import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/apiAuth"
import { rateLimit } from "@/lib/rateLimit"

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser(req)
  if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const limite = rateLimit(`scanner:${authUser.id}`, 10, 5 * 60 * 1000)
  if (!limite.allowed) {
    return NextResponse.json({ error: "Trop de tentatives, réessaie dans un instant" }, { status: 429, headers: { "Retry-After": String(limite.retryAfterSec) } })
  }

  const { base64, mediaType } = await req.json()
  if (!base64) return NextResponse.json({ error: "Image manquante" }, { status: 400 })

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType || "image/jpeg", data: base64 }
          },
          {
            type: "text",
            text: `Analyse ce document et extrais les informations importantes. Réponds UNIQUEMENT en JSON valide sans markdown:
{
  "type": "facture" ou "releve_bancaire" ou "contrat" ou "assurance" ou "autre",
  "titre": "nom du document ou de l'entreprise",
  "montant": nombre ou null,
  "date": "date trouvée ou null",
  "description": "résumé en une phrase",
  "transactions": [{"nom": "...", "montant": nombre, "type": "depense" ou "revenu"}],
  "infos_cles": ["info 1", "info 2", "info 3"]
}`
          }
        ]
      }]
    })
  })
  
  if (!response.ok) {
    return NextResponse.json({ error: "Erreur lors de l'analyse du document" }, { status: 502 })
  }

  const data = await response.json()
  const text = data.content?.[0]?.text
  if (!text) {
    return NextResponse.json({ error: "Réponse inattendue de l'analyse" }, { status: 502 })
  }
  const clean = text.replace(/```json|```/g, "").trim()
  
  try {
    return NextResponse.json(JSON.parse(clean))
  } catch {
    return NextResponse.json({ type: "autre", titre: "Document", description: "Analyse terminée.", infos_cles: [], transactions: [] })
  }
}
