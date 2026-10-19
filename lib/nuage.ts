// Nuage des surlignages d'une note : chaque passage surligné devient un point,
// et un fil rouge relie les notions du chapitre relié, dans leur ordre.
// L'importance d'un passage est calculée sans IA, en le comparant aux notions
// du chapitre (programme) ou aux points clés de la fiche (mes cours).

import { supabase } from "./supabase"
import { normaliser } from "./carnet"
import { chargerProgramme } from "./programmes"
import type { Fiches, NotionFiche, Pays } from "./etudes"

export type Reference = {
  titre: string
  etapes: string[]                                   // le fil rouge, dans l'ordre
  vocabulaire: { mot: string; definition: string }[]
}

export type Importance = "essentiel" | "utile" | "detail"

export type PointNuage = {
  i: number                 // ordre dans la note
  texte: string
  couleur: string           // id de couleur du surligneur
  etape: number | null      // notion du chapitre touchée
  importance: Importance
  raisons: string[]
}

export type Analyse = { points: PointNuage[]; etapes: { titre: string; points: number[] }[] }

// ─── Chapitre relié : notions du programme ou points clés d'une fiche ───
export async function chargerReference(userId: string, chapitreId: string, contexte: { pays: Pays; niveauId: string | null }): Promise<Reference | null> {
  const perso = chapitreId.match(/^fiche:(.+)$/) || chapitreId.match(/^cours:([^:]+):(\d+)$/)
  if (perso) {
    const { data } = await supabase.from("cours_etudiant").select("id,fiches").eq("user_id", userId)
    for (const c of (data || []) as { id: string; fiches: Fiches }[]) {
      const notions = c.fiches.notions as NotionFiche[]
      const n = chapitreId.startsWith("fiche:")
        ? notions.find(x => x.ref === perso[1])
        : c.id === perso[1] ? notions[Number(perso[2])] : undefined
      if (n) return { titre: n.titre, etapes: n.points.length ? n.points : [n.titre], vocabulaire: n.vocabulaire }
    }
    return null
  }
  if (!contexte.niveauId) return null
  const prog = await chargerProgramme(contexte.pays, contexte.niveauId)
  const ch = prog?.chapitres.find(c => c.id === chapitreId)
  if (!ch) return null
  return { titre: ch.titre, etapes: ch.notions, vocabulaire: ch.doc?.vocabulaire ?? [] }
}

// ─── Comparaison de textes ───
const VIDES = new Set(("les des une aux par pour sur dans avec sans sous entre vers chez est sont etre ont avoir fait faire plus moins tres tout tous toute toutes "
  + "cette ces cet son sa ses leur leurs notre nos votre vos qui que quoi dont ou mais donc car comme ainsi alors aussi bien elle elles ils lui nous vous "
  + "pas peu peut peuvent doit doivent etc entre selon lors quand afin meme autre autres deux trois chaque celui celle ceux cela ceci").split(" "))

// Racine grossière : sans accents, sans pluriel, coupée à 6 lettres
function racines(t: string): string[] {
  return normaliser(t).split(/[^a-z0-9]+/)
    .filter(m => m.length > 2 && !VIDES.has(m))
    .map(m => m.replace(/(?<=.{3})(s|x)$/, "").slice(0, 6))
}

const RE_DEFINITION = /\b(est|sont|designe|designent|correspond|signifie|se definit|on appelle|c'est|represente|permet)\b|[:=]/

export function analyser(passages: { texte: string; couleur: string }[], ref: Reference | null): Analyse {
  const etapes = (ref?.etapes ?? []).map(titre => ({ titre, cles: [...new Set(racines(titre))], points: [] as number[] }))
  const vocab = (ref?.vocabulaire ?? []).map(v => ({ mot: v.mot, cles: racines(v.mot) })).filter(v => v.cles.length)
  const N = etapes.length

  const brut = passages.map((p, i) => {
    const cles = new Set(racines(p.texte))
    // Notion la plus proche : part de ses mots clés présents dans le passage
    let etape: number | null = null, meilleur = 0
    etapes.forEach((e, k) => {
      if (!e.cles.length) return
      const s = e.cles.filter(c => cles.has(c)).length / e.cles.length
      if (s > meilleur) { meilleur = s; etape = k }
    })
    if (meilleur < (etape !== null && etapes[etape].cles.length <= 2 ? 0.5 : 0.4)) etape = null
    const motCle = vocab.find(v => v.cles.every(c => cles.has(c)))
    const definition = RE_DEFINITION.test(normaliser(p.texte))

    let score = 0
    if (etape !== null) score += 2 + (meilleur >= 0.75 ? 1 : 0)
    if (definition) score += 1
    if (motCle) score += 1
    const importance: Importance = score >= 4 ? "essentiel" : score >= 2 ? "utile" : "detail"
    if (etape !== null) etapes[etape].points.push(i)
    const point: PointNuage = { i, texte: p.texte, couleur: p.couleur, etape, importance, raisons: [] }
    return { point, motCle: motCle?.mot, definition }
  })

  // Les explications, une fois toutes les notions placées
  for (const { point: p, motCle, definition } of brut) {
    const r: string[] = []
    if (!ref) {
      r.push("Relie cette note à un chapitre (menu « Dossier, chapitre » en haut de la note) pour savoir quelle place ce passage tient dans le cours.")
    } else if (p.etape !== null) {
      const k = p.etape, e = etapes[k]
      r.push(`Il touche la notion ${k + 1} sur ${N} du chapitre : « ${e.titre} ».`)
      if (N === 1) r.push("C'est le cœur du chapitre.")
      else if (k === 0) r.push("C'est le point de départ du fil rouge : les notions suivantes s'appuient dessus. Comprends-le en premier.")
      else if (k === N - 1) r.push(`C'est l'aboutissement du chapitre : il rassemble ce qui précède, notamment « ${etapes[k - 1].titre} ».`)
      else r.push(`Il fait le lien entre « ${etapes[k - 1].titre} » et « ${etapes[k + 1].titre} » : sans lui, le fil rouge se casse.`)
      if (e.points.length > 1) r.push(`Tu as surligné ${e.points.length} passages sur cette notion : pour réviser, garde le plus clair.`)
    } else {
      r.push("Il ne correspond à aucune notion du chapitre : c'est sans doute un exemple ou un détail. Utile pour illustrer, moins pour comprendre l'essentiel.")
    }
    if (ref && definition) r.push("Il ressemble à une définition : à savoir presque mot pour mot.")
    if (motCle) r.push(`Il contient un mot clé du chapitre : « ${motCle} ».`)
    p.raisons = r
  }

  return { points: brut.map(b => b.point), etapes: etapes.map(e => ({ titre: e.titre, points: e.points })) }
}

export const LIBELLES: Record<Importance, string> = { essentiel: "Essentiel", utile: "Utile", detail: "Détail" }
