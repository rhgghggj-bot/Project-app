import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import { z } from "zod"
import { getAuthUser } from "@/lib/apiAuth"
import { rateLimit } from "@/lib/rateLimit"
import { CorrectionSchema, FichesSchema, consigneCorrection, consigneFiches, entrepriseChoisie } from "@/lib/etudes"

// Une copie ou un cours de plusieurs pages peut prendre une à deux minutes.
export const maxDuration = 300

const MODELE = "claude-opus-5-5"

const TYPES_IMAGE = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const

const CorpsSchema = z.object({
  mode: z.enum(["correction", "fiches"]),
  matiere: z.string().max(120).default(""),
  pays: z.enum(["CH", "FR"]),
  niveau: z.string().max(300).optional(),
  base64: z.string().max(6_000_000).optional(),
  mediaType: z.string().optional(),
  texte: z.string().max(100_000).optional(),
  entrepriseId: z.string().max(40).optional(),
  entreprisePerso: z.object({ nom: z.string().max(80), secteur: z.string().max(80), description: z.string().max(400) }).nullable().optional(),
})

let client: Anthropic | null = null
function getClient() {
  if (!client) client = new Anthropic()
  return client
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const limite = rateLimit(`etudes:${authUser.id}`, 10, 10 * 60 * 1000)
  if (!limite.allowed) {
    return NextResponse.json({ error: "Trop de demandes, réessaie dans un instant" }, { status: 429, headers: { "Retry-After": String(limite.retryAfterSec) } })
  }

  const corps = CorpsSchema.safeParse(await req.json().catch(() => null))
  if (!corps.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  const { mode, matiere, pays, niveau, base64, mediaType, texte, entrepriseId, entreprisePerso } = corps.data

  // Le document : PDF ou image en base64, sinon du texte collé.
  const contenu: Anthropic.Beta.BetaContentBlockParam[] = []
  if (base64 && mediaType === "application/pdf") {
    contenu.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } })
  } else if (base64 && TYPES_IMAGE.includes(mediaType as typeof TYPES_IMAGE[number])) {
    contenu.push({ type: "image", source: { type: "base64", media_type: mediaType as typeof TYPES_IMAGE[number], data: base64 } })
  } else if (texte?.trim()) {
    contenu.push({ type: "text", text: `Texte du document :\n\n${texte}` })
  } else {
    return NextResponse.json({ error: "Document manquant (PDF, image ou texte)" }, { status: 400 })
  }

  const consigne = mode === "correction"
    ? consigneCorrection({ pays, matiere, niveau })
    : consigneFiches({ pays, matiere, niveau, entreprise: entrepriseChoisie(entrepriseId, entreprisePerso) })
  contenu.push({ type: "text", text: consigne })

  try {
    const reponse = await getClient().beta.messages.parse({
      model: MODELE,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content: contenu }],
      output_config: {
        effort: "medium",
        format: betaZodOutputFormat(mode === "correction" ? CorrectionSchema : FichesSchema),
      },
    })

    if (reponse.stop_reason === "refusal") {
      return NextResponse.json({ error: "L'IA n'a pas pu analyser ce document" }, { status: 422 })
    }
    if (reponse.stop_reason === "max_tokens" || !reponse.parsed_output) {
      return NextResponse.json({ error: "Document trop long ou réponse incomplète, essaie avec moins de pages" }, { status: 502 })
    }
    return NextResponse.json(reponse.parsed_output)
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "L'IA est très demandée, réessaie dans une minute" }, { status: 429 })
    }
    if (e instanceof Anthropic.BadRequestError) {
      return NextResponse.json({ error: "Document illisible ou trop lourd pour l'IA" }, { status: 400 })
    }
    console.error("etudes/analyser", e)
    return NextResponse.json({ error: "Erreur lors de l'analyse du document" }, { status: 502 })
  }
}
