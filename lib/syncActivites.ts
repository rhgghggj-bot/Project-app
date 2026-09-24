import { ActiviteGroupe, EvenementCalendrier, MembreGroupe } from "@/lib/types"
import { supabase } from "@/lib/supabase"

export async function syncActivitesGroupeVersCalendrier(userId: string) {
  if (!userId) return

  const { data: membres } = await supabase.from("membres_groupe").select("groupe_id").eq("user_id", userId)
  const groupeIds = (membres as MembreGroupe[] | null)?.map(m => m.groupe_id) || []
  if (groupeIds.length === 0) return

  const { data: activites } = await supabase.from("activites_groupe").select("*").in("groupe_id", groupeIds)
  if (!activites || activites.length === 0) return

  const { data: existants } = await supabase
    .from("evenements_calendrier")
    .select("activite_groupe_id")
    .eq("user_id", userId)
    .not("activite_groupe_id", "is", null)

  const idsExistants = new Set(((existants || []) as Pick<EvenementCalendrier, 'activite_groupe_id'>[]).map(e => e.activite_groupe_id))

  const aInserer = activites
    .filter((a: ActiviteGroupe) => !idsExistants.has(a.id))
    .map((a: ActiviteGroupe) => ({
      user_id: userId,
      titre: `👥 ${a.titre}`,
      date: a.date,
      heure: a.heure || null,
      duree: a.duree || 60,
      couleur: a.couleur || "#8B5CF6",
      activite_groupe_id: a.id,
    }))

  if (aInserer.length > 0) {
    await supabase.from("evenements_calendrier").insert(aInserer)
  }
}
