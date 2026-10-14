// Lecture des fichiers calendrier .ics (Google Agenda, Apple Calendrier,
// Outlook, emplois du temps d'école…) pour les importer dans le calendrier.
//
// Gère : lignes repliées, caractères échappés, heures UTC (« Z ») converties
// en heure locale, journées entières, durée (DTEND ou DURATION), lieu,
// description, répétitions hebdomadaires ou quotidiennes (RRULE) traduites en
// jours de la semaine, événements annulés et exceptions ignorés.

export type EvenementICS = {
  titre: string
  date: string // AAAA-MM-JJ (heure locale)
  heure: string | null // HH:MM, null = journée entière
  duree: number | null // minutes
  lieu: string | null
  description: string | null
  recurrence_jours: number[] | null // 0 = lundi … 6 = dimanche
  recurrence_fin: string | null
}

type Propriete = { valeur: string; params: Record<string, string> }

const deux = (n: number) => String(n).padStart(2, "0")
const dateLocale = (d: Date) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`
const JOURS_ICS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"]

function deplier(texte: string): string[] {
  // Une ligne qui commence par un espace ou une tabulation continue la précédente
  return texte.replace(/\r\n|\r/g, "\n").replace(/\n[ \t]/g, "").split("\n")
}

function lireLigne(ligne: string): [string, Propriete] | null {
  const deuxPoints = ligne.search(/:(?=(?:[^"]*"[^"]*")*[^"]*$)/)
  if (deuxPoints < 0) return null
  const [nom, ...params] = ligne.slice(0, deuxPoints).split(";")
  const p: Record<string, string> = {}
  for (const x of params) { const [k, v] = x.split("="); if (k && v) p[k.toUpperCase()] = v.replace(/"/g, "") }
  return [nom.toUpperCase(), { valeur: ligne.slice(deuxPoints + 1), params: p }]
}

function texteICS(v: string) {
  return v.replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1").trim()
}

// Renvoie l'instant en heure locale, ou une date sans heure (journée entière)
function lireDate(p: Propriete): { d: Date; journee: boolean } | null {
  const m = p.valeur.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/)
  if (!m) return null
  const [, a, mo, j, h, mi, s, z] = m
  if (!h || p.params.VALUE === "DATE") return { d: new Date(+a, +mo - 1, +j), journee: true }
  // « Z » = temps universel : converti en heure de l'appareil. TZID ou heure
  // « flottante » : gardée telle quelle (l'élève vit dans ce fuseau).
  const d = z ? new Date(Date.UTC(+a, +mo - 1, +j, +h, +mi, +(s || 0))) : new Date(+a, +mo - 1, +j, +h, +mi, +(s || 0))
  return { d, journee: false }
}

function dureeISO(v: string): number | null {
  const m = v.match(/^-?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
  if (!m) return null
  const [, w, d, h, mi] = m.map(x => (x ? +x : 0))
  return w * 7 * 1440 + d * 1440 + h * 60 + mi
}

function lireRegle(rrule: string, debut: Date): { jours: number[]; fin: string | null } | null {
  const r: Record<string, string> = {}
  for (const x of rrule.split(";")) { const [k, v] = x.split("="); if (k && v) r[k.toUpperCase()] = v }
  const freq = r.FREQ
  if (freq !== "WEEKLY" && freq !== "DAILY") return null
  if (r.INTERVAL && r.INTERVAL !== "1") return null // ex. une semaine sur deux : non géré, gardé comme événement unique
  let jours: number[]
  if (r.BYDAY) jours = r.BYDAY.split(",").map(x => JOURS_ICS.indexOf(x.replace(/^[+-]?\d+/, ""))).filter(i => i >= 0)
  else jours = freq === "DAILY" ? [0, 1, 2, 3, 4, 5, 6] : [(debut.getDay() + 6) % 7]
  if (!jours.length) return null
  let fin: string | null = null
  if (r.UNTIL) {
    const u = lireDate({ valeur: r.UNTIL, params: {} })
    if (u) fin = dateLocale(u.d)
  } else if (r.COUNT) {
    // Dernière occurrence : on avance jusqu'à la n-ième date correspondante
    let reste = +r.COUNT
    const d = new Date(debut)
    for (let i = 0; i < 3660 && reste > 0; i++) {
      if (jours.includes((d.getDay() + 6) % 7)) { reste--; if (!reste) break }
      d.setDate(d.getDate() + 1)
    }
    fin = dateLocale(d)
  }
  return { jours: [...new Set(jours)].sort(), fin }
}

export function lireICS(texte: string): EvenementICS[] {
  const sortie: EvenementICS[] = []
  let courant: Record<string, Propriete> | null = null
  let profondeur = 0 // blocs imbriqués dans un VEVENT (ex. VALARM)
  for (const ligne of deplier(texte)) {
    if (/^BEGIN:VEVENT$/i.test(ligne.trim())) { courant = {}; profondeur = 0; continue }
    if (!courant) continue
    if (/^BEGIN:/i.test(ligne)) { profondeur++; continue }
    if (/^END:VEVENT$/i.test(ligne.trim())) {
      const e = convertir(courant)
      if (e) sortie.push(e)
      courant = null
      continue
    }
    if (/^END:/i.test(ligne)) { profondeur--; continue }
    if (profondeur > 0) continue
    const lu = lireLigne(ligne)
    if (lu && !(lu[0] in courant)) courant[lu[0]] = lu[1]
  }
  return sortie
}

function convertir(p: Record<string, Propriete>): EvenementICS | null {
  if (p.STATUS?.valeur.toUpperCase() === "CANCELLED") return null
  // Exception d'une série (une seule séance déplacée) : la série suffit
  if (p["RECURRENCE-ID"]) return null
  const debut = p.DTSTART ? lireDate(p.DTSTART) : null
  if (!debut) return null
  let duree: number | null = null
  if (p.DTEND) {
    const fin = lireDate(p.DTEND)
    if (fin) duree = Math.round((fin.d.getTime() - debut.d.getTime()) / 60000)
  } else if (p.DURATION) duree = dureeISO(p.DURATION.valeur.trim())
  if (debut.journee) duree = null
  if (duree !== null && (duree <= 0 || duree > 1440)) duree = null
  const regle = p.RRULE ? lireRegle(p.RRULE.valeur.trim(), debut.d) : null
  return {
    titre: (p.SUMMARY ? texteICS(p.SUMMARY.valeur) : "").slice(0, 200) || "Événement importé",
    date: dateLocale(debut.d),
    heure: debut.journee ? null : `${deux(debut.d.getHours())}:${deux(debut.d.getMinutes())}`,
    duree,
    lieu: p.LOCATION ? texteICS(p.LOCATION.valeur).slice(0, 200) || null : null,
    description: p.DESCRIPTION ? texteICS(p.DESCRIPTION.valeur).slice(0, 2000) || null : null,
    recurrence_jours: regle?.jours ?? null,
    recurrence_fin: regle?.fin ?? null,
  }
}
