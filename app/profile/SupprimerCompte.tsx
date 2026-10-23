"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { authHeaders } from "@/lib/authFetch"
import { toast } from "@/lib/toast"

// Suppression définitive du compte, après avoir tapé SUPPRIMER
export default function SupprimerCompte() {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [saisie, setSaisie] = useState("")
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState("")

  async function supprimer() {
    setEnvoi(true); setErreur("")
    try {
      const r = await fetch("/api/compte/supprimer", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ confirmation: "SUPPRIMER" }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) { setErreur(data.error || "La suppression n'a pas abouti, réessaie."); setEnvoi(false); return }
    } catch {
      setErreur("Pas de connexion : réessaie quand tu es en ligne."); setEnvoi(false); return
    }
    await supabase.auth.signOut().catch(() => {})
    try { localStorage.clear(); sessionStorage.clear() } catch { /* stockage indisponible */ }
    toast("Ton compte et tes données ont été supprimés", "success")
    router.replace("/presentation")
  }

  if (!ouvert) return (
    <button onClick={() => setOuvert(true)} style={{ display: "block", margin: "0 auto 28px", background: "none", border: "none", color: "#B4233C", fontSize: 13, textDecoration: "underline", cursor: "pointer", padding: "10px 8px", minHeight: 44 }}>
      Supprimer mon compte
    </button>
  )

  return (
    <section aria-labelledby="titre-suppression" style={{ background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 14, padding: 16, marginBottom: 28 }}>
      <h2 id="titre-suppression" style={{ fontSize: 16, color: "#9F1239", margin: "0 0 6px" }}>Supprimer mon compte</h2>
      <p style={{ fontSize: 13.5, color: "#4C0519", lineHeight: 1.5, margin: "0 0 8px" }}>
        C&apos;est définitif. Tes notes, cours, fiches, documents, finances, calendrier, photos et annonces en vente seront effacés.
        Tes messages et dépenses dans les groupes restent visibles pour les autres membres, signés « Compte supprimé ».
      </p>
      <p style={{ fontSize: 13.5, color: "#4C0519", lineHeight: 1.5, margin: "0 0 10px" }}>
        Conseil : exporte d&apos;abord tes données depuis l&apos;espace étudiant.
      </p>
      <label htmlFor="confirmer-suppression" style={{ fontSize: 13, fontWeight: 600, color: "#4C0519", display: "block", marginBottom: 6 }}>Pour confirmer, écris SUPPRIMER</label>
      <input id="confirmer-suppression" value={saisie} onChange={e => setSaisie(e.target.value)} autoCapitalize="characters" autoComplete="off" spellCheck={false}
        style={{ width: "100%", boxSizing: "border-box", fontSize: 16, padding: "10px 12px", borderRadius: 10, border: "1px solid #FDA4AF", marginBottom: 10 }} />
      {erreur && <p role="alert" style={{ fontSize: 13, color: "#9F1239", margin: "0 0 10px" }}>{erreur}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => void supprimer()} disabled={saisie.trim().toUpperCase() !== "SUPPRIMER" || envoi} aria-busy={envoi}
          style={{ flex: 1, minHeight: 44, borderRadius: 12, border: "none", background: "#E11D48", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", opacity: saisie.trim().toUpperCase() !== "SUPPRIMER" || envoi ? 0.5 : 1 }}>
          {envoi ? "Suppression…" : "Supprimer définitivement"}
        </button>
        <button onClick={() => { setOuvert(false); setSaisie(""); setErreur("") }} disabled={envoi}
          style={{ minHeight: 44, borderRadius: 12, border: "1px solid #FECDD3", background: "#fff", color: "#4C0519", fontSize: 14, padding: "0 16px", cursor: "pointer" }}>Annuler</button>
      </div>
    </section>
  )
}
