import { z } from "zod"
import { QuestionQuizSchema, type Pays } from "./etudes"

// Programmes de révision prédéfinis : pour chaque niveau d'études, les
// chapitres de chaque matière et de chaque année, avec (quand il est écrit)
// un document de révision. Les données sont dans public/programmes/
// <pays>-<niveau>.json, chargées seulement quand l'élève ouvre « Réviser » :
// elles ne pèsent pas sur le reste de l'appli.
//
// Les chapitres suivent les plans d'études officiels (Genève pour la Suisse
// romande, Éducation nationale pour la France) mais restent indicatifs :
// l'ordre et le découpage varient d'un établissement et d'un professeur à
// l'autre.

export const DocChapitreSchema = z.object({
  resume: z.string(),
  points: z.array(z.string()),
  vocabulaire: z.array(z.object({ mot: z.string(), definition: z.string() })),
  exemple: z.string(),
  exercice: z.object({ enonce: z.string(), solution: z.string() }),
  quiz: z.array(QuestionQuizSchema),
})
export type DocChapitre = z.infer<typeof DocChapitreSchema>

export const ChapitreSchema = z.object({
  id: z.string(),
  annee: z.string(),
  matiere: z.string(),
  // null : commun à toutes les filières du niveau
  filiere: z.string().nullable(),
  titre: z.string(),
  notions: z.array(z.string()),
  doc: DocChapitreSchema.nullable(),
})
export type Chapitre = z.infer<typeof ChapitreSchema>

export const ProgrammeSchema = z.object({
  pays: z.enum(["CH", "FR"]),
  niveau: z.string(),
  chapitres: z.array(ChapitreSchema),
})
export type Programme = z.infer<typeof ProgrammeSchema>

const cache = new Map<string, Promise<Programme | null>>()

export function chargerProgramme(pays: Pays, niveau: string): Promise<Programme | null> {
  const cle = `${pays}-${niveau}`
  if (!cache.has(cle)) {
    cache.set(cle, fetch(`/programmes/${cle}.json`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => (d ? ProgrammeSchema.parse(d) : null))
      .catch(() => null))
  }
  return cache.get(cle)!
}

export function chapitresPour(programme: Programme, annee: string, filiere: string | null): Chapitre[] {
  return programme.chapitres.filter(c => c.annee === annee && (c.filiere === null || c.filiere === filiere))
}

// Les chapitres d'une matière, toutes années confondues (pour relier une note)
export function chapitresDeMatiere(programme: Programme, matiere: string, filiere: string | null): Chapitre[] {
  return programme.chapitres.filter(c => c.matiere === matiere && (c.filiere === null || c.filiere === filiere))
}
