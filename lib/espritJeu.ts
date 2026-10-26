// « Esprit » en mode jeu : des parties courtes tirées au hasard (on évite ce
// qu'on a vu récemment), des points, un chrono, des séries de bonnes réponses,
// des records, de l'expérience (niveaux) et un défi du jour commun à tous.

export type ModeJeu = "fermi" | "proba" | "manip" | "jour"
export type Partie = { mode: ModeJeu; score: number; max: number; date: string }
export type EtatJeu = {
  xp: number
  records: Partial<Record<ModeJeu, number>>
  parties: Partie[]                         // les 40 dernières
  vus: Record<string, number>               // question → dernier passage (ms)
  jours: string[]                           // jours où l'on a joué (pour la série)
  duJour?: { date: string; score: number; max: number }
  calib: [number, 0 | 1][]                  // [confiance, juste ?] des 400 dernières réponses
}
export const JEU_VIDE: EtatJeu = { xp: 0, records: {}, parties: [], vus: {}, jours: [], calib: [] }

export const NOMBRE_QUESTIONS: Record<Exclude<ModeJeu, "jour">, number> = { fermi: 4, proba: 10, manip: 8 }
export const CHRONO: Record<Exclude<ModeJeu, "jour">, number> = { fermi: 120, proba: 20, manip: 20 }   // secondes par question

export const jourISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

// Hasard reproductible (même défi du jour pour tout le monde)
export function graine(texte: string) {
  let h = 2166136261
  for (const c of texte) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296 }
}
export function melanger<T>(liste: T[], hasard: () => number = Math.random): T[] {
  const l = [...liste]
  for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(hasard() * (i + 1)); [l[i], l[j]] = [l[j], l[i]] }
  return l
}

// Tirage : d'abord ce qu'on n'a jamais vu, puis ce qu'on a vu il y a longtemps
export function tirer<T extends { id: string }>(liste: T[], vus: Record<string, number>, n: number): T[] {
  const JOUR = 86_400_000
  return melanger(liste).map(x => ({ x, cle: (vus[x.id] ?? 0) + Math.random() * 2 * JOUR }))
    .sort((a, b) => a.cle - b.cle).slice(0, n).map(a => a.x)
}
export function tirerDuJour<T extends { id: string }>(liste: T[], n: number, sel: string, jour = jourISO()): T[] {
  return melanger(liste, graine(jour + sel)).slice(0, n)
}

// ─── Points ───
// Fermi : plus l'estimation est proche (en facteur), plus on gagne ; les indices coûtent un peu
export function pointsFermi(estimation: number, reference: number, indices: number): number {
  const f = Math.max(estimation, reference) / Math.max(1e-9, Math.min(estimation, reference))
  const base = f <= 1.25 ? 100 : f <= 2 ? 80 : f <= 3 ? 60 : f <= 5 ? 40 : f <= 10 ? 20 : 0
  return Math.max(0, base - 10 * indices)
}
// Probabilités : score de Brier transformé (100 = sûr et juste, 75 = « 50 % », 0 = sûr et faux).
// Mentir sur sa confiance fait toujours perdre des points en moyenne.
export const pointsCalib = (confiance: number, juste: boolean) => Math.round(100 * (1 - (confiance - (juste ? 1 : 0)) ** 2))
// Manipulation : 50 points pour la bonne réponse, jusqu'à 50 de plus si on est rapide
export const pointsManip = (juste: boolean, resteFraction: number) => (juste ? 50 + Math.round(50 * Math.max(0, resteFraction)) : 0)
// Série de bonnes réponses : +10 % par réponse d'affilée (jusqu'à +50 %)
export const bonusSerie = (serie: number) => 1 + Math.min(0.5, 0.1 * Math.max(0, serie - 1))

// ─── Niveaux ───
const NIVEAUX = ["Novice", "Curieux", "Apprenti", "Penseur", "Stratège", "Analyste", "Expert", "Maître", "Sage", "Légende"]
export function niveau(xp: number) {
  const n = Math.floor(Math.sqrt(xp / 150))                       // 150, 600, 1 350, 2 400… XP
  const bas = 150 * n * n, haut = 150 * (n + 1) * (n + 1)
  return { n: n + 1, nom: NIVEAUX[Math.min(n, NIVEAUX.length - 1)], progres: (xp - bas) / (haut - bas), reste: haut - xp }
}

// Jours d'affilée (aujourd'hui ou hier compris)
export function serieJours(jours: string[]): number {
  const set = new Set(jours)
  const d = new Date()
  if (!set.has(jourISO(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (set.has(jourISO(d))) { n++; d.setDate(d.getDate() - 1) }
  return n
}

// Fin de partie : records, expérience, historique
export function finirPartie(j: EtatJeu, mode: ModeJeu, score: number, max: number, vus: string[], calib: [number, 0 | 1][]): { jeu: EtatJeu; record: boolean; xp: number } {
  const date = jourISO()
  const record = score > (j.records[mode] ?? 0)
  const xp = Math.round(score / 10)
  const maintenant = Date.now()
  const nv: EtatJeu = {
    ...j,
    xp: j.xp + xp,
    records: record ? { ...j.records, [mode]: score } : j.records,
    parties: [...j.parties, { mode, score, max, date }].slice(-40),
    vus: { ...j.vus, ...Object.fromEntries(vus.map(id => [id, maintenant])) },
    jours: j.jours.includes(date) ? j.jours : [...j.jours, date].slice(-400),
    calib: [...j.calib, ...calib].slice(-400),
    duJour: mode === "jour" && j.duJour?.date !== date ? { date, score, max } : j.duJour,
  }
  return { jeu: nv, record, xp }
}

// Calibration : part de bonnes réponses par niveau de confiance
export function bilanCalib(calib: [number, 0 | 1][], niveaux: readonly number[]) {
  const lignes = niveaux.map(c => ({ confiance: c, total: 0, justes: 0 }))
  let brier = 0
  for (const [c, ok] of calib) {
    const l = lignes.find(x => x.confiance === c); if (l) { l.total++; l.justes += ok }
    brier += (c - ok) ** 2
  }
  return { lignes, brier: calib.length ? brier / calib.length : null, total: calib.length }
}
