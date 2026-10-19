import { supabase } from "./supabase"
import type { NoteCarnet } from "./carnet"

// Espace étudiant sans réseau : on garde sur l'appareil une copie de ce qui a
// été chargé (profil, carnet) et la liste des notes modifiées hors connexion,
// envoyées dès que le réseau revient.

export function memoriser(cle: string, valeur: unknown) {
  try { localStorage.setItem("hl:" + cle, JSON.stringify(valeur)) } catch { /* stockage plein : pas de copie */ }
}

export function relire<T>(cle: string): T | null {
  try { const v = localStorage.getItem("hl:" + cle); return v ? (JSON.parse(v) as T) : null } catch { return null }
}

export const horsLigne = () => typeof navigator !== "undefined" && !navigator.onLine

// ─── Notes en attente d'envoi ───
const cleAttente = (uid: string) => `carnet-attente:${uid}`

export function notesEnAttente(uid: string): NoteCarnet[] {
  return relire<NoteCarnet[]>(cleAttente(uid)) ?? []
}

export function mettreEnAttente(uid: string, note: NoteCarnet) {
  memoriser(cleAttente(uid), [...notesEnAttente(uid).filter(n => n.id !== note.id), note])
}

export function retirerDeAttente(uid: string, id: string) {
  const reste = notesEnAttente(uid).filter(n => n.id !== id)
  memoriser(cleAttente(uid), reste)
}

// Envoie les notes en attente ; renvoie celles qui n'ont pas pu partir
export async function envoyerAttente(uid: string): Promise<number> {
  let restantes = 0
  for (const n of notesEnAttente(uid)) {
    const { error } = await supabase.from("carnet_notes").upsert({ ...n, user_id: uid })
    if (error) restantes++
    else retirerDeAttente(uid, n.id)
  }
  return restantes
}
