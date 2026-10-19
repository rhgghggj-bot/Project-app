"use client"
import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { messageErreurAuth } from "@/lib/authErreurs"
import Vitrine from "@/app/components/Vitrine"
import s from "@/app/components/vitrine.module.css"

export default function Connexion() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [envoi, setEnvoi] = useState(false)

  async function connecter(e: React.FormEvent) {
    e.preventDefault()
    if (envoi) return
    setEnvoi(true)
    setMessage("")
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setMessage(messageErreurAuth(error.message))
      setEnvoi(false)
    } else {
      window.location.assign("/")
    }
  }

  // Deux logos (téléphone / ordinateur) : chacun son dégradé, sinon celui qui est masqué l'emporte
  const logo = (id: string) => (
    <div className={s.logo}>
      <svg aria-hidden="true" width="30" height="30" viewBox="0 0 60 60">
        <path d="M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z" fill={`url(#${id})`}/>
        <defs><linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#2B7FFF"/><stop offset="100%" stopColor="#D4A843"/></linearGradient></defs>
      </svg>
      <span>NEXIA</span>
    </div>
  )

  return (
    <main className={s.page}>
      <div className={`${s.mobileSeul} ${s.entete}`}>
        {logo("logo-mobile")}
        <a href="#email" className={s.raccourci} onClick={e => { e.preventDefault(); const c = document.getElementById("email"); c?.scrollIntoView({ behavior: "smooth", block: "center" }); c?.focus({ preventScroll: true }) }}>Se connecter</a>
      </div>
      <Vitrine />

      <div className={s.colonne}>
        <div className={s.bureauSeul} style={{ marginBottom: 18 }}>{logo("logo-bureau")}</div>
        <form onSubmit={connecter} className={s.form}>
          <h2>Content de te revoir !</h2>
          <p>Connecte-toi pour retrouver tes notes, tes cartes et ta lecture en cours.</p>
          <div className={s.champ}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" inputMode="email" spellCheck={false} autoCapitalize="none" required
              value={email} onChange={e => setEmail(e.target.value)} placeholder="ton@email.com" />
          </div>
          <div className={s.champ}>
            <label htmlFor="password">Mot de passe</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required
              value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {message && <div role="alert" className={s.erreur}>{message}</div>}
          <button type="submit" disabled={envoi} aria-busy={envoi} className={s.envoyer}>
            {envoi ? 'Connexion…' : 'Se connecter'}
          </button>
          <div className={s.bas}>
            Pas encore de compte ? <Link href="/inscription">Créer un compte</Link>
          </div>
        </form>
        <Link href="/presentation" className={s.decouvrir}>Découvrir tout Nexia →</Link>
      </div>
    </main>
  )
}
