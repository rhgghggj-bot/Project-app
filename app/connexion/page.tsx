"use client"
import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { messageErreurAuth } from "@/lib/authErreurs"

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
      window.location.href = "/"
    }
  }

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'400px'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginBottom:'16px'}}>
            <svg aria-hidden="true" width="32" height="32" viewBox="0 0 60 60">
              <path d="M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z" fill="url(#cGrad)"/>
              <defs><linearGradient id="cGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#2B7FFF"/><stop offset="100%" stopColor="#D4A843"/></linearGradient></defs>
            </svg>
            <span style={{fontSize:'24px',fontWeight:'700',color:'#fff',letterSpacing:'2px'}}>NEXIA</span>
          </div>
          <p style={{fontSize:'14px',color:'rgba(255,255,255,0.6)'}}>Content de te revoir !</p>
        </div>

        <form onSubmit={connecter} style={{background:'rgba(255,255,255,0.1)',backdropFilter:'blur(20px)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:'20px',padding:'28px'}}>
          <div style={{marginBottom:'16px'}}>
            <label htmlFor="email" style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',display:'block',marginBottom:'6px'}}>Email</label>
            <input id="email" name="email" type="email" autoComplete="email" inputMode="email" spellCheck={false} autoCapitalize="none" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="ton@email.com"
              style={{width:'100%',background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:'10px',padding:'12px 14px',fontSize:'16px',color:'#fff',boxSizing:'border-box'}}/>
          </div>
          <div style={{marginBottom:'24px'}}>
            <label htmlFor="password" style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',display:'block',marginBottom:'6px'}}>Mot de passe</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{width:'100%',background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:'10px',padding:'12px 14px',fontSize:'16px',color:'#fff',boxSizing:'border-box'}}/>
          </div>
          {message && <div role="alert" style={{background:'rgba(244,63,94,0.2)',border:'0.5px solid rgba(244,63,94,0.4)',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#fca5a5',marginBottom:'16px'}}>{message}</div>}
          <button type="submit" disabled={envoi} aria-busy={envoi}
            style={{width:'100%',background:'#fff',color:'#1a3a6e',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor: envoi ? 'wait' : 'pointer',opacity: envoi ? 0.8 : 1,marginBottom:'16px'}}>
            {envoi ? 'Connexion…' : 'Se connecter'}
          </button>
          <div style={{textAlign:'center'}}>
            <Link href="/inscription" style={{fontSize:'13px',color:'rgba(255,255,255,0.6)',textDecoration:'none'}}>Pas encore de compte ? <span style={{color:'#fff',fontWeight:'500'}}>Créer un compte</span></Link>
          </div>
        </form>
      </div>
    </main>
  )
}
