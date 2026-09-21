"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function RechercheGlobale() {
  const [ouvert, setOuvert] = useState(false)
  const [q, setQ] = useState("")
  const [groupes, setGroupes] = useState<any[]>([])
  const [annonces, setAnnonces] = useState<any[]>([])
  const [projets, setProjets] = useState<any[]>([])
  const [enCours, setEnCours] = useState(false)

  async function rechercher(valeur: string) {
    setQ(valeur)
    if (valeur.trim().length < 2) { setGroupes([]); setAnnonces([]); setProjets([]); return }
    setEnCours(true)

    const { data: { user } } = await supabase.auth.getUser()

    let g: any[] = []
    if (user) {
      const { data: mesGroupes } = await supabase.from("membres_groupe").select("groupe_id").eq("user_id", user.id)
      const ids = (mesGroupes || []).map((m: any) => m.groupe_id)
      if (ids.length > 0) {
        const { data } = await supabase.from("groupes").select("id,nom").in("id", ids).ilike("nom", `%${valeur.trim()}%`).limit(5)
        g = data || []
      }
    }
    setGroupes(g)

    const { data: a } = await supabase.from("marketplace_annonces").select("id,titre,prix").neq("statut", "vendu").ilike("titre", `%${valeur.trim()}%`).limit(5)
    setAnnonces(a || [])

    const { data: p } = await supabase.from("projets").select("id,titre,categorie").ilike("titre", `%${valeur.trim()}%`).limit(5)
    setProjets(p || [])

    setEnCours(false)
  }

  function fermer() {
    setOuvert(false); setQ(""); setGroupes([]); setAnnonces([]); setProjets([])
  }

  const aucunResultat = q.trim().length >= 2 && groupes.length === 0 && annonces.length === 0 && projets.length === 0 && !enCours

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOuvert(!ouvert)}
        style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#F8FBFF", border: "1px solid #E8F1FF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      </button>

      {ouvert && (
        <>
          <div onClick={fermer} style={{ position: "fixed", inset: 0, zIndex: 40 }}></div>
          <div style={{ position: "absolute", top: "46px", right: 0, width: "300px", background: "#fff", borderRadius: "16px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: "0.5px solid #E8F1FF", zIndex: 50, overflow: "hidden" }}>
            <div style={{ padding: "10px 12px", borderBottom: "0.5px solid #E8F1FF" }}>
              <input autoFocus value={q} onChange={e => rechercher(e.target.value)} placeholder="Rechercher groupes, annonces, projets..."
                style={{ width: "100%", border: "1px solid #E8F1FF", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", color: "#1a1a2e", background: "#F8FBFF", boxSizing: "border-box" }} />
            </div>
            <div style={{ maxHeight: "360px", overflowY: "auto" }}>
              {q.trim().length < 2 && (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "#aaa", fontSize: "12px" }}>Tape au moins 2 caractères</div>
              )}
              {aucunResultat && (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "#aaa", fontSize: "12px" }}>Aucun résultat</div>
              )}

              {groupes.length > 0 && (
                <div>
                  <div style={{ padding: "8px 14px 4px", fontSize: "10px", color: "#aaa", fontWeight: 600, textTransform: "uppercase" }}>Groupes</div>
                  {groupes.map(g => (
                    <a key={g.id} href={`/groupes/${g.id}`} onClick={fermer} style={{ display: "block", padding: "10px 14px", fontSize: "13px", color: "#1a1a2e", textDecoration: "none", borderBottom: "0.5px solid #F0F4FA" }}>
                      💬 {g.nom}
                    </a>
                  ))}
                </div>
              )}

              {annonces.length > 0 && (
                <div>
                  <div style={{ padding: "8px 14px 4px", fontSize: "10px", color: "#aaa", fontWeight: 600, textTransform: "uppercase" }}>Marketplace</div>
                  {annonces.map(a => (
                    <a key={a.id} href="/marketplace" onClick={fermer} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", fontSize: "13px", color: "#1a1a2e", textDecoration: "none", borderBottom: "0.5px solid #F0F4FA" }}>
                      <span>🛍️ {a.titre}</span>
                      <span style={{ color: "#2B7FFF", fontWeight: 500 }}>{parseFloat(a.prix).toFixed(0)} CHF</span>
                    </a>
                  ))}
                </div>
              )}

              {projets.length > 0 && (
                <div>
                  <div style={{ padding: "8px 14px 4px", fontSize: "10px", color: "#aaa", fontWeight: 600, textTransform: "uppercase" }}>Projets</div>
                  {projets.map(p => (
                    <a key={p.id} href={`/projet/${p.id}`} onClick={fermer} style={{ display: "block", padding: "10px 14px", fontSize: "13px", color: "#1a1a2e", textDecoration: "none", borderBottom: "0.5px solid #F0F4FA" }}>
                      🚀 {p.titre}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
