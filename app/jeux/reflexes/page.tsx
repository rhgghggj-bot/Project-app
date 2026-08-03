'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

function vibrer(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}

type Etat = 'attente'|'prepare'|'pret'|'resultat'|'trop_tot'

export default function TestReflexes() {
  const router = useRouter()
  const [etat, setEtat] = useState<Etat>('attente')
  const [temps, setTemps] = useState<number|null>(null)
  const [meilleur, setMeilleur] = useState(0)
  const [historique, setHistorique] = useState<number[]>([])
  const debutRef = useRef(0)
  const timeoutRef = useRef<any>(null)

  useEffect(() => {
    const m = localStorage.getItem('reflexes_meilleur')
    if (m) setMeilleur(parseInt(m))
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  function demarrer() {
    setEtat('prepare')
    setTemps(null)
    const delai = 1200 + Math.random() * 2800
    timeoutRef.current = setTimeout(() => {
      debutRef.current = Date.now()
      setEtat('pret')
      vibrer(15)
    }, delai)
  }

  function onTap() {
    if (etat === 'attente' || etat === 'resultat' || etat === 'trop_tot') {
      demarrer()
      return
    }
    if (etat === 'prepare') {
      clearTimeout(timeoutRef.current)
      setEtat('trop_tot')
      vibrer([50,30,50])
      return
    }
    if (etat === 'pret') {
      const t = Date.now() - debutRef.current
      setTemps(t)
      setEtat('resultat')
      setHistorique(h => [t, ...h].slice(0, 5))
      vibrer([10,20,10])
      if (meilleur === 0 || t < meilleur) {
        setMeilleur(t)
        localStorage.setItem('reflexes_meilleur', String(t))
      }
    }
  }

  const couleurs: any = {
    attente: { bg: 'linear-gradient(160deg,#0A1628,#1a3a6e)', txt: 'Touche pour commencer' },
    prepare: { bg: 'linear-gradient(160deg,#4c1414,#7a1f1f)', txt: 'Attends le vert...' },
    pret: { bg: 'linear-gradient(160deg,#0d5c3a,#10B981)', txt: 'TAPE MAINTENANT !' },
    resultat: { bg: 'linear-gradient(160deg,#0A1628,#1a3a6e)', txt: '' },
    trop_tot: { bg: 'linear-gradient(160deg,#4c1414,#7a1f1f)', txt: 'Trop tôt ! Retouche pour réessayer' },
  }

  return (
    <main style={{minHeight:'100vh',background:'#0A1628',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 18px'}}>
        <button onClick={() => router.push('/jeux')} style={{color:'rgba(255,255,255,0.6)',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
        <span style={{color:'#fff',fontWeight:'500',fontSize:'15px'}}>Test de réflexes</span>
        <div style={{width:'32px'}}></div>
      </div>

      <div style={{display:'flex',gap:'10px',padding:'0 18px 16px'}}>
        <div style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:'14px',padding:'12px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',marginBottom:'2px',textTransform:'uppercase',letterSpacing:'.05em'}}>Meilleur temps</div>
          <div style={{fontSize:'20px',fontWeight:'600',color:'#D4A843'}}>{meilleur > 0 ? meilleur+' ms' : '-'}</div>
        </div>
        <div style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:'14px',padding:'12px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',marginBottom:'2px',textTransform:'uppercase',letterSpacing:'.05em'}}>Moyenne (5)</div>
          <div style={{fontSize:'20px',fontWeight:'600',color:'#fff'}}>{historique.length > 0 ? Math.round(historique.reduce((a,b)=>a+b,0)/historique.length)+' ms' : '-'}</div>
        </div>
      </div>

      <button onClick={onTap} style={{flex:1,background:couleurs[etat].bg,border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',transition:'background 0.15s',margin:'0 18px 18px',borderRadius:'24px'}}>
        {etat === 'resultat' && temps !== null ? (
          <>
            <div style={{fontSize:'48px',fontWeight:'700',color:'#fff',marginBottom:'8px'}}>{temps} ms</div>
            <div style={{fontSize:'14px',color:'rgba(255,255,255,0.6)'}}>
              {temps < 200 ? 'Ultra rapide ⚡' : temps < 300 ? 'Très bien !' : temps < 400 ? 'Bien' : 'Continue à t\'entraîner'}
            </div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.4)',marginTop:'16px'}}>Touche pour rejouer</div>
          </>
        ) : (
          <div style={{fontSize:'18px',fontWeight:'600',color:'#fff',textAlign:'center',padding:'0 20px'}}>{couleurs[etat].txt}</div>
        )}
      </button>

      {historique.length > 0 && (
        <div style={{padding:'0 18px 24px'}}>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'8px'}}>Historique</div>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            {historique.map((t, i) => (
              <div key={i} style={{background:'rgba(255,255,255,0.08)',borderRadius:'10px',padding:'6px 12px',color:'#fff',fontSize:'13px',fontWeight:'500'}}>{t} ms</div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
