import { supabase } from "@/lib/supabase"

export async function syncMeilleurScoreJeu(jeu: string, score: number) {
  if (!score || score <= 0) return
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: existant } = await supabase.from("scores_jeux").select("*").eq("user_id", user.id).eq("jeu", jeu).maybeSingle()
  if (!existant) {
    await supabase.from("scores_jeux").insert({ user_id: user.id, jeu, meilleur_score: score })
  } else if (score > existant.meilleur_score) {
    await supabase.from("scores_jeux").update({ meilleur_score: score, updated_at: new Date().toISOString() }).eq("id", existant.id)
  }
}
