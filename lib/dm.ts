import { MembreGroupe } from "@/lib/types"
import { SupabaseClient } from "@supabase/supabase-js"

// Trouve la conversation privée existante entre deux personnes, ou en crée une.
// Retourne l'id du groupe (utilisé comme conversation) à ouvrir, ou null en cas d'erreur.
export async function ouvrirConversationPrivee(supabase: SupabaseClient, monId: string, autreId: string): Promise<string | null> {
  if (!monId || !autreId || monId === autreId) return null

  const { data: mesGroupes } = await supabase.from("membres_groupe").select("groupe_id").eq("user_id", monId)
  const mesIds = ((mesGroupes || []) as MembreGroupe[]).map(m => m.groupe_id)

  if (mesIds.length > 0) {
    const { data: candidats } = await supabase.from("groupes").select("id").eq("est_dm", true).in("id", mesIds)
    for (const c of candidats || []) {
      const { data: membres } = await supabase.from("membres_groupe").select("user_id").eq("groupe_id", c.id)
      const idsMembres = ((membres || []) as MembreGroupe[]).map(m => m.user_id)
      if (idsMembres.length === 2 && idsMembres.includes(autreId)) {
        return c.id
      }
    }
  }

  const { data: nouveauGroupe, error } = await supabase.from("groupes").insert({
    nom: "", description: "", est_dm: true, created_by: monId
  }).select().single()

  if (error || !nouveauGroupe) return null

  await supabase.from("membres_groupe").insert([
    { groupe_id: nouveauGroupe.id, user_id: monId },
    { groupe_id: nouveauGroupe.id, user_id: autreId }
  ])

  return nouveauGroupe.id
}
