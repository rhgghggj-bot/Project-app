import { z } from "zod"
import { supabase } from "@/lib/supabase"
import { authHeaders } from "@/lib/authFetch"
import { appelerIALocale, type Pays } from "@/lib/etudes"

export type ChoixIA = "claude" | "local"
export type ReglagesIA = { ia: ChoixIA; url: string; modele: string }

// Vercel limite le corps d'une requête à ~4,5 Mo : les photos sont réduites,
// les PDF trop lourds refusés avant l'envoi.
const PDF_MAX_OCTETS = 3_000_000
const IMAGE_COTE_MAX = 1800

export type DocumentPret = { base64?: string; mediaType?: string; texte?: string }

function lireCommeDataUrl(fichier: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error("Lecture du fichier impossible"))
    r.readAsDataURL(fichier)
  })
}

async function reduireImage(fichier: File): Promise<string> {
  const url = URL.createObjectURL(fichier)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("Image illisible"))
      img.src = url
    })
    const echelle = Math.min(1, IMAGE_COTE_MAX / Math.max(img.width, img.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(img.width * echelle)
    canvas.height = Math.round(img.height * echelle)
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/jpeg", 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Prépare le fichier pour Claude : PDF tel quel, image réduite en JPEG.
export async function preparerPourClaude(fichier: File): Promise<DocumentPret> {
  if (fichier.type === "application/pdf") {
    if (fichier.size > PDF_MAX_OCTETS) throw new Error("PDF trop lourd (3 Mo max) : envoie seulement les pages utiles")
    const dataUrl = await lireCommeDataUrl(fichier)
    return { base64: dataUrl.split(",")[1], mediaType: "application/pdf" }
  }
  if (fichier.type.startsWith("image/")) {
    const dataUrl = await reduireImage(fichier)
    return { base64: dataUrl.split(",")[1], mediaType: "image/jpeg" }
  }
  if (fichier.type.startsWith("text/")) return { texte: await fichier.text() }
  throw new Error("Format non pris en charge (PDF, photo ou texte)")
}

// L'IA locale ne lit que du texte : on fait la reconnaissance de texte (OCR)
// dans le navigateur pour les photos.
export async function extraireTexteLocal(fichier: File): Promise<string> {
  if (fichier.type.startsWith("text/")) return fichier.text()
  if (fichier.type.startsWith("image/")) {
    const Tesseract = (await import("tesseract.js")).default
    const { data: { text } } = await Tesseract.recognize(fichier, "fra+eng", { logger: () => {} })
    if (!text.trim()) throw new Error("Aucun texte lisible sur la photo")
    return text
  }
  throw new Error("L'IA locale lit les photos et le texte. Pour un PDF, choisis Claude ou colle le texte.")
}

// Garde une copie du fichier dans l'espace privé de l'étudiant.
export async function deposerFichier(userId: string, fichier: File, dossier: "evaluations" | "cours"): Promise<string | null> {
  const nomPropre = fichier.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80)
  const chemin = `${userId}/${dossier}/${Date.now()}-${nomPropre}`
  const { error } = await supabase.storage.from("etudes").upload(chemin, fichier, { contentType: fichier.type || undefined })
  return error ? null : chemin
}

export async function lienFichier(chemin: string): Promise<string | null> {
  const { data } = await supabase.storage.from("etudes").createSignedUrl(chemin, 60 * 10)
  return data?.signedUrl ?? null
}

// Envoie le document à l'IA choisie et renvoie la réponse validée.
export async function analyserDocument<T>(opts: {
  mode: "correction" | "fiches"
  reglages: ReglagesIA
  fichier: File | null
  texteColle: string
  pays: Pays
  niveau: string
  matiere: string
  consigneLocale: string
  schema: z.ZodType<T>
  entrepriseId?: string
  entreprisePerso?: { nom: string; secteur: string; description: string } | null
}): Promise<T> {
  if (opts.reglages.ia === "local") {
    const texte = opts.fichier ? await extraireTexteLocal(opts.fichier) : opts.texteColle
    if (!texte.trim()) throw new Error("Rien à analyser")
    try {
      return await appelerIALocale({ url: opts.reglages.url, modele: opts.reglages.modele, consigne: opts.consigneLocale, texte, schema: opts.schema })
    } catch (e) {
      if (e instanceof TypeError) throw new Error("IA locale injoignable : vérifie qu'Ollama tourne sur cet appareil")
      throw e
    }
  }

  const doc = opts.fichier ? await preparerPourClaude(opts.fichier) : { texte: opts.texteColle }
  const res = await fetch("/api/etudes/analyser", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({
      mode: opts.mode, pays: opts.pays, niveau: opts.niveau || undefined, matiere: opts.matiere, ...doc,
      entrepriseId: opts.entrepriseId, entreprisePerso: opts.entreprisePerso,
    }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || "Erreur lors de l'analyse")
  return opts.schema.parse(data)
}
