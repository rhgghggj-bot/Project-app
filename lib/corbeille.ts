// Corbeille du carnet : une note ou un document supprimé est gardé 30 jours.
// La ligne de la base est copiée dans un petit fichier JSON de l'espace
// privé de l'élève (<uid>/corbeille/…) ; les photos de la note et le fichier
// du document restent en place jusqu'à la suppression définitive.
// Aucune table en plus : les droits du stockage « etudes » suffisent.

import { supabase } from "./supabase"

export type TypeCorbeille = "note" | "document"
export type ElementCorbeille = { type: TypeCorbeille; id: string; titre: string; supprime_le: string; ligne: Record<string, unknown> }

export const JOURS_CORBEILLE = 30
const dossier = (uid: string, type: TypeCorbeille) => `${uid}/corbeille/${type === "note" ? "notes" : "documents"}`
const chemin = (uid: string, type: TypeCorbeille, id: string) => `${dossier(uid, type)}/${id}.json`

export async function mettreALaCorbeille(uid: string, type: TypeCorbeille, ligne: Record<string, unknown> & { id: string }, titre: string): Promise<boolean> {
  const el: ElementCorbeille = { type, id: ligne.id, titre, supprime_le: new Date().toISOString(), ligne }
  const { error } = await supabase.storage.from("etudes").upload(chemin(uid, type, ligne.id), new Blob([JSON.stringify(el)], { type: "application/json" }), { upsert: true, contentType: "application/json" })
  return !error
}

export async function listerCorbeille(uid: string): Promise<ElementCorbeille[]> {
  const sortie: ElementCorbeille[] = []
  for (const type of ["note", "document"] as const) {
    const { data } = await supabase.storage.from("etudes").list(dossier(uid, type), { limit: 1000 })
    const fichiers = (data || []).filter(f => f.name.endsWith(".json"))
    const lus = await Promise.all(fichiers.map(async f => {
      const { data: blob } = await supabase.storage.from("etudes").download(`${dossier(uid, type)}/${f.name}`)
      try { return blob ? (JSON.parse(await blob.text()) as ElementCorbeille) : null } catch { return null }
    }))
    for (const el of lus) if (el?.id && el.ligne) sortie.push({ ...el, type })
  }
  // Au-delà de 30 jours : supprimé pour de bon
  const limite = Date.now() - JOURS_CORBEILLE * 86400_000
  const perimes = sortie.filter(e => new Date(e.supprime_le).getTime() < limite)
  for (const e of perimes) await supprimerDefinitivement(uid, e)
  return sortie.filter(e => !perimes.includes(e)).sort((a, b) => b.supprime_le.localeCompare(a.supprime_le))
}

export function joursRestants(e: ElementCorbeille, maintenant = Date.now()) {
  return Math.max(0, Math.ceil(JOURS_CORBEILLE - (maintenant - new Date(e.supprime_le).getTime()) / 86400_000))
}

// Remet la note ou le document à sa place (sans dossier si le dossier n'existe plus)
export async function restaurer(uid: string, e: ElementCorbeille, dossiersExistants: Set<string>): Promise<boolean> {
  const ligne: Record<string, unknown> = { ...e.ligne, user_id: uid }
  if (ligne.dossier_id && !dossiersExistants.has(String(ligne.dossier_id))) ligne.dossier_id = null
  const table = e.type === "note" ? "carnet_notes" : "etudes_documents"
  const { error } = await supabase.from(table).upsert(ligne)
  if (error) return false
  await supabase.storage.from("etudes").remove([chemin(uid, e.type, e.id)])
  return true
}

export async function supprimerDefinitivement(uid: string, e: ElementCorbeille): Promise<void> {
  if (e.type === "note") {
    const d = `${uid}/notes/${e.id}`
    const { data } = await supabase.storage.from("etudes").list(d, { limit: 1000 })
    if (data?.length) await supabase.storage.from("etudes").remove(data.map(f => `${d}/${f.name}`))
  } else if (typeof e.ligne.chemin === "string" && e.ligne.chemin.startsWith(`${uid}/`)) {
    await supabase.storage.from("etudes").remove([e.ligne.chemin])
  }
  await supabase.storage.from("etudes").remove([chemin(uid, e.type, e.id)])
}
