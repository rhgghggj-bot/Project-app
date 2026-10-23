"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { messageErreurAuth } from "@/lib/authErreurs"
import BoutonsOAuth, { oauthDisponible } from "@/app/components/BoutonsOAuth"

export default function Inscription() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nom, setNom] = useState("")
  const [message, setMessage] = useState("")
  const [succes, setSucces] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [accepte, setAccepte] = useState(false)
  // Anti-spam : un champ caché que seuls les robots remplissent, et un délai
  // minimum entre l'affichage du formulaire et l'envoi
  const [piege, setPiege] = useState("")
  const ouvertLe = useRef(0)
  useEffect(() => { ouvertLe.current = Date.now() }, [])

  async function inscrire(e: React.FormEvent) {
    e.preventDefault()
    if (envoi) return
    setSucces(false)
    if (piege || Date.now() - ouvertLe.current < 2500) {
      setMessage("Un petit instant… réessaie dans quelques secondes.")
      return
    }
    if (nom.trim().length < 2) return setMessage("Indique ton prénom (2 lettres minimum).")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setMessage("Cette adresse e-mail n'a pas l'air correcte.")
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return setMessage("Ton mot de passe doit avoir au moins 8 caractères, avec des lettres et au moins un chiffre.")
    if (!accepte) return setMessage("Accepte les conditions d'utilisation pour créer ton compte.")
    setEnvoi(true)
    setMessage("")
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { nom: nom.trim() } }
    })
    setEnvoi(false)
    if (error) {
      setSucces(false)
      setMessage(messageErreurAuth(error.message))
    } else {
      setSucces(true)
      setMessage("Compte créé ! Tu peux maintenant te connecter.")
    }
  }

  return (
    <main data-deja-sombre style={{minHeight:'100vh',background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{width:'100%',maxWidth:'400px'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginBottom:'16px'}}>
            <svg aria-hidden="true" width="32" height="32" viewBox="0 0 60 60">
              <path d="M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z" fill="url(#iGrad)"/>
              <defs><linearGradient id="iGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#2B7FFF"/><stop offset="100%" stopColor="#D4A843"/></linearGradient></defs>
            </svg>
            <span style={{fontSize:'24px',fontWeight:'700',color:'#fff',letterSpacing:'2px'}}>NEXIA</span>
          </div>
          <p style={{fontSize:'14px',color:'rgba(255,255,255,0.6)'}}>Crée ton compte gratuitement</p>
        </div>

        <form onSubmit={inscrire} noValidate style={{background:'rgba(255,255,255,0.1)',backdropFilter:'blur(20px)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:'20px',padding:'28px'}}>
          <BoutonsOAuth onErreur={m => { setSucces(false); setMessage(m) }} />
          {oauthDisponible && <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', margin: '-4px 0 14px', textAlign: 'center' }}>En continuant avec Google ou Apple, tu acceptes les <Link href="/cgu" style={{ color: '#fff' }}>conditions d&apos;utilisation</Link>.</p>}
          <div style={{marginBottom:'16px'}}>
            <label htmlFor="nom" style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',display:'block',marginBottom:'6px'}}>Ton prénom</label>
            <input id="nom" name="given-name" type="text" autoComplete="given-name" required
              value={nom} onChange={e => setNom(e.target.value)}
              placeholder="Thomas"
              style={{width:'100%',background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:'10px',padding:'12px 14px',fontSize:'16px',color:'#fff',boxSizing:'border-box'}}/>
          </div>
          <div style={{marginBottom:'16px'}}>
            <label htmlFor="email" style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',display:'block',marginBottom:'6px'}}>Email</label>
            <input id="email" name="email" type="email" autoComplete="email" inputMode="email" spellCheck={false} autoCapitalize="none" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="thomas@email.com"
              style={{width:'100%',background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:'10px',padding:'12px 14px',fontSize:'16px',color:'#fff',boxSizing:'border-box'}}/>
          </div>
          <div style={{marginBottom:'24px'}}>
            <label htmlFor="password" style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',display:'block',marginBottom:'6px'}}>Mot de passe</label>
            <input id="password" name="new-password" type="password" autoComplete="new-password" minLength={8} required aria-describedby="password-aide"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{width:'100%',background:'rgba(255,255,255,0.1)',border:'0.5px solid rgba(255,255,255,0.2)',borderRadius:'10px',padding:'12px 14px',fontSize:'16px',color:'#fff',boxSizing:'border-box'}}/>
            <p id="password-aide" style={{fontSize:'12px',color:'rgba(255,255,255,0.55)',margin:'6px 0 0'}}>8 caractères minimum, avec des lettres et au moins un chiffre</p>
          </div>
          {/* Champ piège invisible pour les personnes, rempli par les robots */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
            <label htmlFor="site-web">Ne pas remplir</label>
            <input id="site-web" name="site-web" type="text" tabIndex={-1} autoComplete="off" value={piege} onChange={e => setPiege(e.target.value)} />
          </div>
          <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.45, marginBottom: '18px', cursor: 'pointer' }}>
            <input type="checkbox" checked={accepte} onChange={e => setAccepte(e.target.checked)} required style={{ width: 20, height: 20, marginTop: 1, flexShrink: 0 }} />
            <span>J&apos;accepte les <Link href="/cgu" style={{ color: '#fff' }}>conditions d&apos;utilisation</Link> et j&apos;ai lu la <Link href="/confidentialite" style={{ color: '#fff' }}>politique de confidentialité</Link>.</span>
          </label>
          {message && (
            <div role={succes ? 'status' : 'alert'} style={{background: !succes ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.18)', border: !succes ? '0.5px solid rgba(244,63,94,0.4)' : '0.5px solid rgba(16,185,129,0.4)', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', color: !succes ? '#fca5a5' : '#86efac', marginBottom:'16px'}}>{message}</div>
          )}
          <button type="submit" disabled={envoi} aria-busy={envoi}
            style={{width:'100%',background:'#fff',color:'#1a3a6e',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor: envoi ? 'wait' : 'pointer',opacity: envoi ? 0.8 : 1,marginBottom:'16px'}}>
            {envoi ? 'Création du compte…' : 'Créer mon compte'}
          </button>
          <div style={{textAlign:'center'}}>
            <Link href="/connexion" style={{fontSize:'13px',color:'rgba(255,255,255,0.6)',textDecoration:'none'}}>Déjà un compte ? <span style={{color:'#fff',fontWeight:'500'}}>Se connecter</span></Link>
          </div>
        </form>
      </div>
    </main>
  )
}
