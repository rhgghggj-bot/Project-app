import { supabase } from "./supabase"
import type { Fiches, NotionFiche } from "./etudes"

// Fiches des cours de l'élève (importés d'un artefact ou créés par l'IA),
// pour y relier des notes du carnet comme on relie un chapitre du programme.
//
// Identifiant d'une fiche dans carnet_notes.chapitre_id :
//   - « fiche:<ref> » quand la fiche a un identifiant stable (import
//     d'artefact) : le lien survit à un nouvel import du même cours ;
//   - « cours:<id du cours>:<n° de la fiche> » sinon.

export type FichePerso = { id: string; titre: string; matiere: string; coursId: string; index: number }

export function idFiche(coursId: string, n: NotionFiche, index: number) {
  return n.ref ? `fiche:${n.ref}` : `cours:${coursId}:${index}`
}

export const estIdFichePerso = (id: string | null | undefined) => !!id && /^(fiche|cours):/.test(id)

type CoursLeger = { id: string; matiere: string; fiches: Fiches }

export function fichesDe(cours: CoursLeger[]): FichePerso[] {
  return cours.flatMap(c => (c.fiches.notions as NotionFiche[]).map((n, i) => ({
    id: idFiche(c.id, n, i), titre: n.titre, matiere: c.matiere || "Mes cours", coursId: c.id, index: i,
  })))
}

let cache: { userId: string; promesse: Promise<FichePerso[]> } | null = null

export function chargerFichesPerso(userId: string, rafraichir = false): Promise<FichePerso[]> {
  if (!cache || cache.userId !== userId || rafraichir) {
    cache = {
      userId,
      promesse: Promise.resolve(supabase.from("cours_etudiant").select("id,matiere,fiches").eq("user_id", userId).order("created_at", { ascending: false }))
        .then(({ data }) => fichesDe((data || []) as CoursLeger[]))
        .catch(() => []),
    }
  }
  return cache.promesse
}

// À appeler quand les cours changent (import, création, suppression)
export function oublierFichesPerso() { cache = null }
