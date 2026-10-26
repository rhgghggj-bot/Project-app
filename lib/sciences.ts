// Onglet « Sciences » : avancement dans l'histoire « Projet Graine » (défis
// réussis) et réponses aux quiz de biodiversité. Gardé dans l'espace privé de
// l'élève, avec une copie sur l'appareil pour le mode sans réseau.

import { supabase } from "./supabase"
import { memoriser, relire } from "./horsLigne"

export type EtatSciences = {
  graine: Record<string, Record<number, "ok" | "vu">>   // chapitre → défi → réussi (« ok ») ou solution affichée (« vu »)
  quiz: Record<string, Record<number, number>>          // continent → question → option choisie
}
export const ETAT_SCIENCES_VIDE: EtatSciences = { graine: {}, quiz: {} }

const chemin = (uid: string) => `${uid}/sciences/etat.json`
const copie = (uid: string) => `sciences:${uid}`

export async function chargerSciences(uid: string): Promise<EtatSciences> {
  const local = relire<EtatSciences>(copie(uid))
  const { data } = await supabase.storage.from("etudes").download(chemin(uid))
  if (!data) return { ...ETAT_SCIENCES_VIDE, ...(local ?? {}) }
  try { const e = { ...ETAT_SCIENCES_VIDE, ...JSON.parse(await data.text()) }; memoriser(copie(uid), e); return e } catch { return { ...ETAT_SCIENCES_VIDE, ...(local ?? {}) } }
}

export async function enregistrerSciences(uid: string, e: EtatSciences): Promise<boolean> {
  memoriser(copie(uid), e)
  const { error } = await supabase.storage.from("etudes").upload(chemin(uid), new Blob([JSON.stringify(e)], { type: "application/json" }), { upsert: true, contentType: "application/json" })
  return !error
}

// Réponse numérique juste à la tolérance près (relative)
export const reponseJuste = (donnee: number, attendue: number, tolerance: number) =>
  attendue === 0 ? Math.abs(donnee) <= tolerance : Math.abs(donnee - attendue) <= Math.abs(attendue) * tolerance

// Fiche d'une espèce sur Wikipédia (photo et résumé), d'après son nom scientifique
export type FicheEspece = { titre: string; resume?: string; image?: string; url: string }
const fiches = new Map<string, Promise<FicheEspece | null>>()
export function ficheEspece(sci: string): Promise<FicheEspece | null> {
  if (!fiches.has(sci)) {
    fiches.set(sci, fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(sci.replace(/ /g, "_"))}`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => (j && j.type !== "disambiguation" ? { titre: String(j.title), resume: j.extract ? String(j.extract) : undefined, image: j.thumbnail?.source, url: j.content_urls?.desktop?.page || `https://fr.wikipedia.org/wiki/${encodeURIComponent(sci)}` } : null))
      .catch(() => { fiches.delete(sci); return null }))
  }
  return fiches.get(sci)!
}
