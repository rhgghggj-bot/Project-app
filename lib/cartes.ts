// Cartes de révision (flashcards) créées automatiquement :
//  - chaque passage surligné d'une note devient une phrase à trou ;
//  - chaque encadré « Définition » ou « À retenir » devient une question ;
//  - le vocabulaire des cours importés (mot → définition) ;
//  - les passages surlignés dans la bibliothèque (de quel livre vient la phrase).
// Révision espacée (méthode Leitner) : une carte sue revient de plus en plus
// tard, une carte ratée revient tout de suite. L'avancement est gardé dans un
// fichier JSON de l'espace privé de l'élève.

import { chargerEtat, livre, type Passage } from "./bibliotheque"
import { supabase } from "./supabase"
import type { Fiches, NotionFiche } from "./etudes"
import { idFiche } from "./fichesPerso"

export type Carte = {
  id: string
  recto: string
  verso: string
  contexte: string
  groupe: string
  source: { note: string } | { fiche: string } | { livre: string }
}

export type EtatCarte = { b: number; p: string; n: number; r: number }
export type Etats = Record<string, EtatCarte>
export type Reponse = "rate" | "presque" | "su"

// Jours avant le retour d'une carte, selon sa boîte
export const INTERVALLES = [0, 1, 2, 4, 8, 16, 32]

function empreinte(t: string) {
  let h = 2166136261
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0).toString(36)
}

const propre = (t: string) => t.replace(/​/g, "").replace(/\s+/g, " ").trim()

export function jourISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
function plusJours(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n)
  return jourISO(d)
}

// Phrase qui contient le repère \u0001 (sans « lookbehind », pour Safari)
function phraseAutour(texte: string): string {
  const i = texte.indexOf("\u0001")
  let debut = 0, fin = texte.length
  for (let k = i - 1; k > 0; k--) if (/[.!?]/.test(texte[k]) && /\s/.test(texte[k + 1] || "")) { debut = k + 1; break }
  for (let k = i + 1; k < texte.length; k++) if (/[.!?]/.test(texte[k])) { fin = k + 1; break }
  return texte.slice(debut, fin)
}

function titreAvant(el: Element, racine: Element): string {
  // Titre (h2/h3) le plus proche au-dessus du bloc
  let n: Element | null = el
  while (n && n !== racine) {
    let s = n.previousElementSibling
    while (s) {
      if (s.tagName === "H2" || s.tagName === "H3") return propre(s.textContent || "")
      const h = s.querySelectorAll("h2, h3")
      if (h.length) return propre(h[h.length - 1].textContent || "")
      s = s.previousElementSibling
    }
    n = n.parentElement
  }
  return ""
}

export function cartesDeNote(note: { id: string; titre: string; contenu: string }, groupe: string): Carte[] {
  if (typeof window === "undefined" || !note.contenu) return []
  const doc = new DOMParser().parseFromString(`<body>${note.contenu}</body>`, "text/html")
  const racine = doc.body
  const titre = propre(note.titre) || "Note"
  const cartes: Carte[] = []
  const vus = new Set<string>()
  const ajouter = (recto: string, verso: string, contexte: string) => {
    const id = `n:${note.id}:${empreinte(recto + "|" + verso)}`
    if (vus.has(id) || !recto || !verso) return
    vus.add(id)
    cartes.push({ id, recto, verso, contexte, groupe, source: { note: note.id } })
  }

  // Surlignages → phrases à trou
  const marques = Array.from(racine.querySelectorAll("mark"))
  for (const m of marques) {
    const reponse = propre(m.textContent || "")
    if (reponse.length < 2) continue
    const bloc = m.closest("p, li, td, th, h2, h3, blockquote") ?? racine
    const copie = bloc.cloneNode(true) as Element
    const cible = copie.querySelectorAll("mark")[Array.from(bloc.querySelectorAll("mark")).indexOf(m)]
    if (!cible) continue
    cible.replaceWith(doc.createTextNode("\u0001"))
    copie.querySelectorAll("br").forEach(b => b.replaceWith(doc.createTextNode(" ")))
    const phrase = propre(phraseAutour(propre(copie.textContent || "")))
    const contexte = [titre, titreAvant(bloc, racine)].filter(Boolean).join(" › ")
    const autour = phrase.replace("\u0001", "").replace(/[\s.,;:!?«»"()]/g, "")
    const recto = autour.length >= 12 ? phrase.replace("\u0001", "______") : `${titreAvant(bloc, racine) || titre} : ______`
    ajouter(recto, reponse, contexte)
  }

  // Encadrés → questions
  for (const q of Array.from(racine.querySelectorAll("blockquote[data-encadre]"))) {
    const type = q.getAttribute("data-encadre")
    if (type === "exemple") continue
    const texte = propre(Array.from(q.childNodes).map(n => n.textContent).join(" "))
    if (texte.length < 3) continue
    const sujet = titreAvant(q, racine) || titre
    const contexte = [titre, titreAvant(q, racine)].filter(Boolean).join(" › ")
    const def = texte.match(/^(.{2,60}?)\s*[:=–—]\s+(.{3,})$/)
    if (type === "definition" && def) ajouter(`Définis : ${def[1]}`, def[2], contexte)
    else ajouter(type === "definition" ? `Définition : ${sujet}` : `À retenir : ${sujet}`, texte, contexte)
  }
  return cartes
}

export function cartesDeCours(cours: { id: string; matiere: string; fiches: Fiches }): Carte[] {
  const cartes: Carte[] = []
  const notions = cours.fiches?.notions as NotionFiche[] | undefined
  notions?.forEach((n, i) => {
    for (const v of n.vocabulaire || []) {
      const mot = propre(v.mot || ""), def = propre(v.definition || "")
      if (!mot || !def) continue
      cartes.push({
        id: `c:${empreinte(cours.matiere + "|" + mot + "|" + def)}`, recto: `Que veut dire « ${mot} » ?`, verso: def,
        contexte: `${cours.matiere} › ${n.titre}`, groupe: cours.matiere || "Mes cours", source: { fiche: idFiche(cours.id, n, i) },
      })
    }
  })
  return cartes
}

// Passages surlignés dans la bibliothèque : retrouver de quel livre vient la phrase
export function cartesDeLivres(passages: Passage[]): Carte[] {
  const vus = new Set<string>()
  const cartes: Carte[] = []
  for (const p of passages) {
    const l = livre(p.livre)
    const id = `l:${p.livre}:${empreinte(p.t)}`
    if (!l || vus.has(id)) continue
    vus.add(id)
    cartes.push({ id, recto: `De quel livre vient ce passage : « ${p.t} » ?`, verso: `${l.titre}, ${l.auteur}`, contexte: `Bibliothèque › ${l.titre}`, groupe: "Bibliothèque", source: { livre: p.livre } })
  }
  return cartes
}

// Toutes les cartes de l'élève (notes du carnet + vocabulaire des cours)
export async function chargerCartes(uid: string): Promise<Carte[]> {
  const [notes, dossiers, cours] = await Promise.all([
    supabase.from("carnet_notes").select("id,titre,contenu,dossier_id").eq("user_id", uid),
    supabase.from("carnet_dossiers").select("id,nom").eq("user_id", uid),
    supabase.from("cours_etudiant").select("id,matiere,fiches").eq("user_id", uid),
  ])
  const nomDossier = new Map((dossiers.data || []).map(d => [d.id as string, d.nom as string]))
  const cartes: Carte[] = []
  for (const n of notes.data || []) cartes.push(...cartesDeNote(n as { id: string; titre: string; contenu: string }, nomDossier.get(n.dossier_id as string) || "Carnet"))
  const vus = new Set(cartes.map(c => c.id))
  for (const c of cours.data || []) for (const k of cartesDeCours(c as { id: string; matiere: string; fiches: Fiches })) if (!vus.has(k.id)) { vus.add(k.id); cartes.push(k) }
  cartes.push(...cartesDeLivres((await chargerEtat(uid)).passages))
  return cartes
}

// ─── Avancement ───
const cheminEtats = (uid: string) => `${uid}/revision/cartes.json`

export async function chargerEtats(uid: string): Promise<Etats> {
  const { data } = await supabase.storage.from("etudes").download(cheminEtats(uid))
  if (!data) return {}
  try { const j = JSON.parse(await data.text()); return j && typeof j.cartes === "object" ? j.cartes : {} } catch { return {} }
}

export async function enregistrerEtats(uid: string, etats: Etats): Promise<boolean> {
  const { error } = await supabase.storage.from("etudes").upload(cheminEtats(uid),
    new Blob([JSON.stringify({ v: 1, cartes: etats })], { type: "application/json" }), { upsert: true, contentType: "application/json" })
  return !error
}

export const aRevoir = (c: Carte, etats: Etats, aujourdhui = jourISO()) => !etats[c.id] || etats[c.id].p <= aujourdhui
export const estNouvelle = (c: Carte, etats: Etats) => !etats[c.id]

export function repondre(etat: EtatCarte | undefined, r: Reponse): EtatCarte {
  const e = etat ?? { b: 0, p: jourISO(), n: 0, r: 0 }
  if (r === "su") {
    const b = Math.min(e.b + 1, INTERVALLES.length - 1)
    return { b, p: plusJours(INTERVALLES[b]), n: e.n + 1, r: e.r + 1 }
  }
  if (r === "presque") return { b: Math.max(1, e.b), p: plusJours(1), n: e.n + 1, r: e.r }
  return { b: 0, p: jourISO(), n: e.n + 1, r: e.r }
}

// Cartes de la séance : d'abord celles en retard, puis les nouvelles (20 max par jour)
export function seance(cartes: Carte[], etats: Etats, max = 30, nouvellesMax = 20): Carte[] {
  const aujourdhui = jourISO()
  const dues = cartes.filter(c => etats[c.id] && etats[c.id].p <= aujourdhui).sort((a, b) => etats[a.id].p.localeCompare(etats[b.id].p) || etats[a.id].b - etats[b.id].b)
  const nouvelles = cartes.filter(c => !etats[c.id]).slice(0, nouvellesMax)
  return [...dues, ...nouvelles].slice(0, max)
}
