import { ActiviteGroupe, EvenementCalendrier, MembreGroupe } from "@/lib/types"
import { supabase } from "@/lib/supabase"

// Copie les activités des groupes dans le calendrier de l'élève et les garde à
// jour : une activité modifiée (titre, date, heure, durée) est mise à jour, une
// activité supprimée (ou un groupe quitté) disparaît du calendrier.
export async function syncActivitesGroupeVersCalendrier(userId: string) {
  if (!userId) return

  const { data: membres, error: e1 } = await supabase.from("membres_groupe").select("groupe_id").eq("user_id", userId)
  if (e1) return
  const groupeIds = (membres as MembreGroupe[] | null)?.map(m => m.groupe_id) || []

  const { data: activites, error: e2 } = groupeIds.length
    ? await supabase.from("activites_groupe").select("*").in("groupe_id", groupeIds)
    : { data: [] as ActiviteGroupe[], error: null }
  if (e2) return   // sans la liste à jour, on ne touche à rien

  const { data: existants, error: e3 } = await supabase
    .from("evenements_calendrier")
    .select("id,activite_groupe_id,titre,date,heure,duree")
    .eq("user_id", userId)
    .not("activite_groupe_id", "is", null)
  if (e3) return

  const voulu = (a: ActiviteGroupe) => ({ titre: `👥 ${a.titre}`, date: a.date, heure: a.heure || null, duree: a.duree || 60 })
  const parId = new Map(((activites || []) as ActiviteGroupe[]).map(a => [a.id, a]))
  const dejaLa = new Set<string>()

  for (const ev of (existants || []) as Pick<EvenementCalendrier, "id" | "activite_groupe_id" | "titre" | "date" | "heure" | "duree">[]) {
    const a = ev.activite_groupe_id ? parId.get(ev.activite_groupe_id) : undefined
    if (!a) { await supabase.from("evenements_calendrier").delete().eq("id", ev.id); continue }
    dejaLa.add(a.id)
    const v = voulu(a)
    const heure = (h: string | null | undefined) => (h || "").slice(0, 5)
    if (ev.titre !== v.titre || ev.date !== v.date || heure(ev.heure) !== heure(v.heure) || (ev.duree || 60) !== v.duree) {
      await supabase.from("evenements_calendrier").update(v).eq("id", ev.id)
    }
  }

  const aInserer = ((activites || []) as ActiviteGroupe[])
    .filter(a => !dejaLa.has(a.id))
    .map(a => ({ user_id: userId, ...voulu(a), couleur: a.couleur || "#8B5CF6", activite_groupe_id: a.id }))
  if (aInserer.length > 0) await supabase.from("evenements_calendrier").insert(aInserer)
}
