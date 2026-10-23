"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { messageErreurAuth } from "@/lib/authErreurs"
import CarteAuth, { boutonAuth, champAuth, etiquetteAuth, messageAuth } from "@/app/components/CarteAuth"

// Arrivée depuis le lien de l'e-mail : Supabase ouvre une session temporaire
// à partir du lien, puis on enregistre le nouveau mot de passe.
export default function NouveauMotDePasse() {
  const [session, setSession] = useState<"attente" | "ok" | "invalide">("attente")
  const [mdp, setMdp] = useState("")
  const [mdp2, setMdp2] = useState("")
  const [erreur, setErreur] = useState("")
  const [etat, setEtat] = useState<"saisie" | "envoi" | "fait">("saisie")

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evenement, s) => {
      if (s && (evenement === "PASSWORD_RECOVERY" || evenement === "SIGNED_IN" || evenement === "INITIAL_SESSION")) setSession("ok")
    })
    // Lien expiré ou déjà utilisé : erreur dans l'adresse, ou aucune session après la lecture du lien
    const minuterie = setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session ? "ok" : "invalide")
    }, 1500)
    return () => { subscription.unsubscribe(); clearTimeout(minuterie) }
  }, [])

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    if (mdp.length < 8 || !/[A-Za-z]/.test(mdp) || !/\d/.test(mdp)) return setErreur("Au moins 8 caractères, avec des lettres et au moins un chiffre.")
    if (mdp !== mdp2) return setErreur("Les deux mots de passe ne sont pas identiques.")
    setErreur(""); setEtat("envoi")
    const { error } = await supabase.auth.updateUser({ password: mdp })
    if (error) { setEtat("saisie"); return setErreur(messageErreurAuth(error.message)) }
    setEtat("fait")
  }

  if (session === "invalide") return (
    <CarteAuth titre="Lien expiré" sousTitre="Ce lien n'est plus valable : il a peut-être déjà servi, ou il date de plus d'une heure.">
      <Link href="/mot-de-passe-oublie" style={{ ...boutonAuth, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", boxSizing: "border-box" }}>Demander un nouveau lien</Link>
    </CarteAuth>
  )

  return (
    <CarteAuth titre="Nouveau mot de passe" sousTitre="Choisis un mot de passe que tu n'utilises pas ailleurs.">
      {etat === "fait" ? (
        <>
          <div role="status" style={messageAuth(true)}>✓ Ton mot de passe est changé. Tu es connecté.</div>
          <button onClick={() => window.location.assign("/")} style={boutonAuth}>Aller sur Nexia</button>
        </>
      ) : (
        <form onSubmit={enregistrer} noValidate>
          <label htmlFor="mdp" style={etiquetteAuth}>Nouveau mot de passe</label>
          <input id="mdp" type="password" autoComplete="new-password" value={mdp} onChange={e => setMdp(e.target.value)} aria-describedby="mdp-aide" style={champAuth} />
          <p id="mdp-aide" style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: "6px 0 14px" }}>8 caractères minimum, avec des lettres et au moins un chiffre</p>
          <label htmlFor="mdp2" style={etiquetteAuth}>Confirme le mot de passe</label>
          <input id="mdp2" type="password" autoComplete="new-password" value={mdp2} onChange={e => setMdp2(e.target.value)} style={{ ...champAuth, marginBottom: 16 }} />
          {erreur && <div role="alert" style={messageAuth(false)}>{erreur}</div>}
          <button type="submit" disabled={session !== "ok" || etat === "envoi"} aria-busy={etat === "envoi"} style={{ ...boutonAuth, opacity: session !== "ok" ? 0.6 : 1 }}>
            {session !== "ok" ? "Vérification du lien…" : etat === "envoi" ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      )}
    </CarteAuth>
  )
}
