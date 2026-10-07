import { z } from "zod"
import { CorrectionSchema, FichesSchema } from "./etudes"

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
    specialites: z.array(z.string()).optional(),
    entreprise_id: z.string(),
    entreprise_perso: z.object({ nom: z.string(), secteur: z.string(), description: z.string() }).nullable().optional(),
  }).optional(),
  notes: z.array(z.object({
    matiere: z.string(), titre: z.string().nullable().optional(), note: z.number(),
    echelle: z.enum(["CH6", "FR20"]), coefficient: z.number().positive(), date: z.string(),
  })).optional(),
  cours: z.array(z.object({
    matiere: z.string(), titre: z.string(), entreprise_id: z.string(), fiches: FichesSchema,
  })).optional(),
  evaluations: z.array(z.object({
    matiere: z.string(), titre: z.string(), correction: CorrectionSchema.extend({ echelle: z.enum(["CH6", "FR20"]) }),
  })).optional(),
})
export type FichierEtudes = z.infer<typeof FichierSchema>
