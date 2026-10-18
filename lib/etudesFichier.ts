import { z } from "zod"
import { CorrectionSchema, FichesSchema, QuestionQuizSchema } from "./etudes"

// Fiches d'un fichier importé : en plus du format produit par l'IA, une fiche
// peut avoir un identifiant stable (ref), un schéma, des vidéos et des
// exercices supplémentaires (artefact Bise Cycles par exemple).
const NotionImportSchema = FichesSchema.shape.notions.element.extend({
  ref: z.string().max(80).optional(),
  schema: z.string().max(400000).optional(),
  videos: z.array(z.object({ titre: z.string(), url: z.string(), duree: z.string().optional() })).optional(),
  exercices: z.array(z.object({ enonce: z.string(), solution: z.string() })).optional(),
  quiz: z.array(QuestionQuizSchema),
})
export const FichesImportSchema = z.object({ titre: z.string(), notions: z.array(NotionImportSchema) })

// Format d'échange : l'étudiant récupère toutes ses données dans un fichier,
// et peut en réimporter (sauvegarde, changement de compte, ou fiches
// préparées ailleurs, par exemple depuis un artefact Claude).
export const FichierSchema = z.object({
  format: z.literal("nexia-etudes"),
  version: z.literal(1),
  profil: z.object({
    pays: z.enum(["CH", "FR"]),
    niveau: z.string().nullable().optional(),
    filiere: z.string().nullable().optional(),
    annee: z.string().nullable().optional(),
    specialites: z.array(z.string()).optional(),
    entreprise_id: z.string(),
    entreprise_perso: z.object({ nom: z.string(), secteur: z.string(), description: z.string() }).nullable().optional(),
  }).optional(),
  notes: z.array(z.object({
    matiere: z.string(), titre: z.string().nullable().optional(), note: z.number(),
    echelle: z.enum(["CH6", "FR20"]), coefficient: z.number().positive(), date: z.string(),
    chapitre_id: z.string().nullable().optional(),
  })).optional(),
  cours: z.array(z.object({
    matiere: z.string(), titre: z.string(), entreprise_id: z.string(), fiches: FichesImportSchema,
  })).optional(),
  // Horaire hebdomadaire : ajouté au calendrier comme cours répétés
  horaire: z.array(z.object({
    titre: z.string().min(1).max(200),
    jour: z.number().int().min(0).max(6), // 0 = lundi
    debut: z.string().regex(/^\d{2}:\d{2}$/),
    fin: z.string().regex(/^\d{2}:\d{2}$/),
    lieu: z.string().max(200).optional(),
    du: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    au: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })).optional(),
  evaluations: z.array(z.object({
    matiere: z.string(), titre: z.string(), correction: CorrectionSchema.extend({ echelle: z.enum(["CH6", "FR20"]) }),
  })).optional(),
})
export type FichierEtudes = z.infer<typeof FichierSchema>
