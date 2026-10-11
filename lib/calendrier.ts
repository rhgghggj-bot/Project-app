import type { EvenementCalendrier } from "./types"

// Occurrences des événements du calendrier, en tenant compte des événements
// répétés (recurrence_jours = jours de la semaine, 0 = lundi … 6 = dimanche,
// à partir de `date` et jusqu'à `recurrence_fin`). Sans ça, un cours
// hebdomadaire créé il y a un mois n'apparaît que le jour de sa création.

export type Occurrence = { evt: EvenementCalendrier; debut: Date; fin: Date }

const idxSemaine = (d: Date) => (d.getDay() + 6) % 7

// "2026-10-12" → minuit heure locale (new Date("2026-10-12") serait minuit UTC)
export function dateLocale(iso: string): Date {
  const [a, m, j] = iso.slice(0, 10).split("-").map(Number)
  return new Date(a, m - 1, j)
}

export function aLieuLe(e: EvenementCalendrier, jour: Date): boolean {
  const j0 = new Date(jour.getFullYear(), jour.getMonth(), jour.getDate())
  const debut = dateLocale(e.date)
  if (e.recurrence_jours && e.recurrence_jours.length > 0) {
    if (j0 < debut) return false
    if (e.recurrence_fin && j0 > dateLocale(e.recurrence_fin)) return false
    return e.recurrence_jours.includes(idxSemaine(j0))
  }
  return j0.getTime() === debut.getTime()
}

export function evenementsDuJour(evenements: EvenementCalendrier[], jour: Date): EvenementCalendrier[] {
  return evenements.filter(e => aLieuLe(e, jour))
}

function occurrence(e: EvenementCalendrier, jour: Date): Occurrence {
  const debut = new Date(jour.getFullYear(), jour.getMonth(), jour.getDate())
  if (e.heure) {
    const [h, m] = e.heure.split(":").map(Number)
    debut.setHours(h, m, 0, 0)
  }
  // Sans heure : l'événement couvre toute la journée
  const fin = e.heure ? new Date(debut.getTime() + (e.duree || 0) * 60_000) : new Date(debut.getTime() + 24 * 3600_000 - 1)
  return { evt: e, debut, fin }
}

// Occurrences à venir (ou en cours) dans les `jours` prochains jours, triées.
export function prochainesOccurrences(evenements: EvenementCalendrier[], maintenant: Date, jours = 60): Occurrence[] {
  const resultat: Occurrence[] = []
  for (let i = 0; i <= jours; i++) {
    const jour = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() + i)
    for (const e of evenements) {
      if (!aLieuLe(e, jour)) continue
      const o = occurrence(e, jour)
      if (o.fin.getTime() > maintenant.getTime()) resultat.push(o)
    }
  }
  return resultat.sort((a, b) => a.debut.getTime() - b.debut.getTime())
}
