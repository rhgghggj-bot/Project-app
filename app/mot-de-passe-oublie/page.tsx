"use client"
import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import CarteAuth, { boutonAuth, champAuth, etiquetteAuth, messageAuth } from "@/app/components/CarteAuth"

// Demande d'un lien pour choisir un nouveau mot de passe. La réponse est la
// même que l'adresse ait un compte ou non (on ne révèle pas qui est inscrit).
export default function MotDePasseOublie() {
  const [email, setEmail] = useState("")
  const [etat, setEtat] = useState<"saisie" | "envoi" | "envoye">("saisie")
  const [erreur, setErreur] = useState("")

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    if (etat === "envoi") return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setErreur("Cette adresse e-mail n'a pas l'air correcte.")
    setErreur(""); setEtat("envoi")
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/nouveau-mot-de-passe` })
    if (error && /rate|seconds|limit/i.test(error.message)) { setEtat("saisie"); return setErreur("Tu as déjà demandé un lien il y a peu. Attends une minute avant de réessayer.") }
    setEtat("envoye")
  }

  return (
    <CarteAuth titre="Mot de passe oublié ?" sousTitre="Indique l'adresse e-mail de ton compte : on t'envoie un lien pour choisir un nouveau mot de passe.">
      {etat === "envoye" ? (
        <>
          <div role="status" style={messageAuth(true)}>📬 Si un compte existe avec <b>{email.trim()}</b>, un e-mail vient de partir. Ouvre-le et appuie sur le lien (pense à regarder dans les indésirables).</div>
          <Link href="/connexion" style={{ ...boutonAuth, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", boxSizing: "border-box" }}>Retour à la connexion</Link>
        </>
      ) : (
        <form onSubmit={envoyer} noValidate>
          <label htmlFor="email" style={etiquetteAuth}>Adresse e-mail</label>
          <input id="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required
            value={email} onChange={e => setEmail(e.target.value)} placeholder="thomas@email.com" style={{ ...champAuth, marginBottom: 16 }} />
          {erreur && <div role="alert" style={messageAuth(false)}>{erreur}</div>}
          <button type="submit" disabled={etat === "envoi"} aria-busy={etat === "envoi"} style={{ ...boutonAuth, marginBottom: 14 }}>{etat === "envoi" ? "Envoi…" : "M'envoyer le lien"}</button>
          <div style={{ textAlign: "center" }}><Link href="/connexion" style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Retour à la connexion</Link></div>
        </form>
      )}
    </CarteAuth>
  )
}
