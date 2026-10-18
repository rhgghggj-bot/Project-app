// Planning de révision jusqu'à un examen : chaque sujet est d'abord étudié,
// puis revu plus tard (révision espacée), et la veille de l'examen est
// gardée pour une révision générale. Les séances en retard peuvent être
// réparties de nouveau sur les jours qui restent.
// Les plannings sont gardés dans un fichier JSON de l'espace privé de l'élève.

import { supabase } from "./supabase"
import { jourISO } from "./cartes"

export type Sujet = { id: string; titre: string; chapitreId: string | null }
export type Seance = { id: string; date: string; sujetId: string | null; type: "etude" | "revision" | "general"; fait: boolean }
export type Plan = {
  id: string
  examen: string
  date: string
  matiere: string
  minutes: number
  heure: string | null
  joursOff: number[]  // 0 = lundi … 6 = dimanche
  sujets: Sujet[]
  seances: Seance[]
  evenements: string[]  // événements ajoutés au calendrier
  cree_le: string
}

const idxSemaine = (d: Date) => (d.getDay() + 6) % 7
const dateDe = (iso: string) => { const [a, m, j] = iso.split("-").map(Number); return new Date(a, m - 1, j) }

// Jours de révision possibles : de `depuis` à la veille de l'examen
export function joursDisponibles(depuis: string, examen: string, joursOff: number[]): string[] {
  const jours: string[] = []
  const d = dateDe(depuis), fin = dateDe(examen)
  while (d < fin) {
    if (!joursOff.includes(idxSemaine(d))) jours.push(jourISO(d))
    d.setDate(d.getDate() + 1)
  }
  return jours
}

// Répartit les séances d'étude puis de révision ; la dernière journée est
// une révision générale (s'il y a au moins 2 jours).
export function repartir(etudes: string[], revisions: string[], jours: string[], general = true): Seance[] {
  if (!jours.length) return []
  const sortie: Seance[] = []
  const id = () => crypto.randomUUID()
  const avecGeneral = general && jours.length >= 2
  const travail = avecGeneral ? jours.slice(0, -1) : jours
  // 60 % des jours pour découvrir les sujets, 40 % pour les revoir
  const coupe = revisions.length && travail.length >= 3 ? Math.max(1, Math.round(travail.length * 0.6)) : travail.length
  const zoneEtude = travail.slice(0, coupe), zoneRevision = travail.slice(coupe)
  etudes.forEach((s, i) => sortie.push({ id: id(), date: zoneEtude[Math.floor(i * zoneEtude.length / etudes.length)], sujetId: s, type: "etude", fait: false }))
  if (zoneRevision.length) revisions.forEach((s, i) => sortie.push({ id: id(), date: zoneRevision[Math.floor(i * zoneRevision.length / revisions.length)], sujetId: s, type: "revision", fait: false }))
  if (avecGeneral) sortie.push({ id: id(), date: jours[jours.length - 1], sujetId: null, type: "general", fait: false })
  return sortie.sort((a, b) => a.date.localeCompare(b.date))
}

export function creerSeances(sujets: Sujet[], depuis: string, examen: string, joursOff: number[]): Seance[] {
  const ids = sujets.map(s => s.id)
  return repartir(ids, ids, joursDisponibles(depuis, examen, joursOff))
}

// Les séances pas faites (en retard ou à venir) sont réparties à partir d'aujourd'hui
export function replanifier(p: Plan, aujourdhui = jourISO()): Seance[] {
  const faites = p.seances.filter(s => s.fait)
  const restantes = p.seances.filter(s => !s.fait)
  const jours = joursDisponibles(aujourdhui, p.date, p.joursOff)
  if (!jours.length) return p.seances
  const nouvelles = repartir(
    restantes.filter(s => s.type === "etude").map(s => s.sujetId!),
    restantes.filter(s => s.type === "revision").map(s => s.sujetId!),
    jours, restantes.some(s => s.type === "general"))
  return [...faites, ...nouvelles].sort((a, b) => a.date.localeCompare(b.date))
}

export const enRetard = (p: Plan, aujourdhui = jourISO()) => p.seances.filter(s => !s.fait && s.date < aujourdhui).length

export function joursAvant(date: string, aujourdhui = jourISO()) {
  return Math.round((dateDe(date).getTime() - dateDe(aujourdhui).getTime()) / 86400_000)
}

// ─── Stockage ───
const chemin = (uid: string) => `${uid}/revision/plannings.json`

export async function chargerPlans(uid: string): Promise<Plan[]> {
  const { data } = await supabase.storage.from("etudes").download(chemin(uid))
  if (!data) return []
  try { const j = JSON.parse(await data.text()); return Array.isArray(j?.plans) ? j.plans : [] } catch { return [] }
}

export async function enregistrerPlans(uid: string, plans: Plan[]): Promise<boolean> {
  const { error } = await supabase.storage.from("etudes").upload(chemin(uid),
    new Blob([JSON.stringify({ v: 1, plans })], { type: "application/json" }), { upsert: true, contentType: "application/json" })
  return !error
}

// ─── Calendrier ───
// Une séance par jour dans le calendrier (à l'heure choisie), plus l'examen
export async function ajouterAuCalendrier(uid: string, p: Plan): Promise<string[]> {
  const parJour = new Map<string, Seance[]>()
  for (const s of p.seances) if (!s.fait && s.date >= jourISO()) parJour.set(s.date, [...(parJour.get(s.date) || []), s])
  const nom = (s: Seance) => s.type === "general" ? "Révision générale" : `${s.type === "revision" ? "Revoir" : "Étudier"} : ${p.sujets.find(x => x.id === s.sujetId)?.titre ?? ""}`
  const lignes = [...parJour].map(([date, ss]) => ({
    user_id: uid, titre: `Révision · ${p.examen}`, date, heure: p.heure, duree: p.minutes, couleur: "#7C3AED",
    description: ss.map(nom).join("\n"),
  }))
  if (p.date >= jourISO()) lignes.push({ user_id: uid, titre: `Examen · ${p.examen}`, date: p.date, heure: null, duree: 0, couleur: "#DC2626", description: p.matiere })
  if (!lignes.length) return []
  const { data, error } = await supabase.from("evenements_calendrier").insert(lignes).select("id")
  return error ? [] : (data || []).map(d => d.id as string)
}

export async function retirerDuCalendrier(ids: string[]) {
  if (ids.length) await supabase.from("evenements_calendrier").delete().in("id", ids)
}
