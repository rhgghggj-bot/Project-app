"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const JEUX_NOMS: Record<string, string> = {
  "2048": "2048", snake: "Snake", blockblast: "Block Blast", cassebriques: "Casse-briques",
  stacktower: "Stack Tower", reflexes: "Réflexes", maville: "Ma Ville",
}

export default function ClassementJeux() {
  const [user, setUser] = useState<any>(null)
  const [scores, setScores] = useState<any[]>([])
  const [profils, setProfils] = useState<Record<string, any>>({})
  const [jeu, setJeu] = useState("2048")

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) return

      const { data: mesGroupes } = await supabase.from("membres_groupe").select("groupe_id").eq("user_id", user.id)
      const groupeIds = (mesGroupes || []).map((g: any) => g.groupe_id)
      let amisIds: string[] = [user.id]
      if (groupeIds.length > 0) {
        const { data: coMembres } = await supabase.from("membres_groupe").select("user_id").in("groupe_id", groupeIds)
        amisIds = Array.from(new Set([user.id, ...(coMembres || []).map((m: any) => m.user_id)]))
      }

      const { data: sc } = await supabase.from("scores_jeux").select("*").in("user_id", amisIds)
      setScores(sc || [])

      const { data: profs } = await supabase.from("profiles").select("id,nom").in("id", amisIds)
      const map: Record<string, any> = {}
      profs?.forEach((p: any) => { map[p.id] = p })
      setProfils(map)
    }
    charger()
  }, [])

  const scoresJeu = scores.filter(s => s.jeu === jeu).sort((a, b) => b.meilleur_score - a.meilleur_score).slice(0, 15)

  return (
    <main className="min-h-screen bg-white">
      <div style={{ background: "linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)", padding: "20px 18px 24px" }}>
        <a href="/jeux" style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "8px" }}>← Jeux</a>
        <div style={{ fontSize: "22px", fontWeight: 600, color: "#fff" }}>🏆 Classement</div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>Entre toi et les membres de tes groupes</div>
      </div>

      <div style={{ display: "flex", gap: "6px", padding: "12px 14px", overflowX: "auto" }}>
        {Object.entries(JEUX_NOMS).map(([id, nom]) => (
          <button key={id} onClick={() => setJeu(id)}
            style={{ whiteSpace: "nowrap", padding: "6px 14px", borderRadius: "99px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500, background: jeu === id ? "#2B7FFF" : "#EEF5FF", color: jeu === id ? "#fff" : "#2B7FFF" }}>
            {nom}
          </button>
        ))}
      </div>

      <div style={{ padding: "0 14px 24px" }}>
        {scoresJeu.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa", fontSize: "13px" }}>Personne n'a encore de score sur ce jeu</div>
        )}
        {scoresJeu.map((s, i) => {
          const cestMoi = s.user_id === user?.id
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "14px", background: cestMoi ? "#EEF5FF" : "#fff", border: `0.5px solid ${cestMoi ? "#DCE9FF" : "#F0F4FA"}`, marginBottom: "8px" }}>
              <div style={{ width: "26px", fontSize: "14px", fontWeight: 700, color: i === 0 ? "#D4A843" : i === 1 ? "#9CA3AF" : i === 2 ? "#D97706" : "#ccc" }}>
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </div>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#2B7FFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "13px", fontWeight: 500 }}>
                {(profils[s.user_id]?.nom || "?")[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: "#1a1a2e" }}>{profils[s.user_id]?.nom || "Membre"}{cestMoi ? " (toi)" : ""}</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#2B7FFF" }}>{s.meilleur_score}</div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
