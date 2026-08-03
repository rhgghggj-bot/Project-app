'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

function vibrer(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}

const NB_MANCHES = 5

type Etat = 'accueil'|'sequence'|'pret'|'trop_tot'|'manche_terminee'|'fini'

function pointsPour(ms: number) {
  return Math.max(0, Math.round(1000 - ms))
}

export default function TestReflexes() {
  const router = useRouter()
  const [etat, setEtat] = useState<Etat>('accueil')
  const [manche, setManche] = useState(0)
  const [lumieres, setLumieres] = useState([false, false, false])
  const [dernierTemps, setDernierTemps] = useState<number|null>(null)
  const [dernierPoints, setDernierPoints] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [meilleur, setMeilleur] = useState(0)
  const debutRef = useRef(0)
  const timeoutsRef = useRef<any[]>([])

  useEffect(() => {
    const m = localStorage.getItem('reflexes_meilleur_score')
    if (m) setMeilleur(parseInt(m))
    return () => timeoutsRef.current.forEach(clearTimeout)
  }, [])

  function nettoyerTimeouts() {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }

  function lancerManche() {
    nettoyerTimeouts()
    setEtat('sequence')
    setLumieres([false, false, false])
    const t1 = setTimeout(() => setLumieres([true, false, false]), 450)
    const t2 = setTimeout(() => setLumieres([true, true, false]), 900)
    const t3 = setTimeout(() => setLumieres([true, true, true]), 1350)
    const delaiFinal = 1800 + Math.random() * 2200
    const t4 = setTimeout(() => {
      debutRef.current = Date.now()
      setEtat('pret')
      vibrer(15)
    }, delaiFinal)
    timeoutsRef.current = [t1, t2, t3, t4]
  }

  function demarrerPartie() {
    setManche(0)
    setScores([])
    lancerManche()
  }

  function onTap() {
    if (etat === 'accueil' || etat === 'fini') {
      demarrerPartie()
      return
    }
    if (etat === 'manche_terminee') {
      lancerManche()
      return
    }
    if (etat === 'sequence') {
      nettoyerTimeouts()
      setEtat('trop_tot')
      vibrer([50,30,50])
      return
    }
    if (etat === 'trop_tot') {
      lancerManche()
      return
    }
    if (etat === 'pret') {
      const t = Date.now() - debutRef.current
      const pts = pointsPour(t)
      setDernierTemps(t)
      setDernierPoints(pts)
      vibrer([10,20,10])
      const nouveauxScores = [...scores, pts]
      setScores(nouveauxScores)
      if (manche + 1 >= NB_MANCHES) {
        const total = nouveauxScores.reduce((a,b) => a+b, 0)
        setEtat('fini')
        if (total > meilleur) {
          setMeilleur(total)
          localStorage.setItem('reflexes_meilleur_score', String(total))
        }
        vibrer([15,20,15,20,30])
      } else {
        setManche(m => m + 1)
        setEtat('manche_terminee')
      }
    }
  }

  const totalActuel = scores.reduce((a,b) => a+b, 0)

  const fonds: any = {
    accueil: 'linear-gradient(160deg,#0A1628,#1a3a6e)',
    sequence: 'linear-gradient(160deg,#4c1414,#7a1f1f)',
    pret: 'linear-gradient(160deg,#0d5c3a,#10B981)',
    trop_tot: 'linear-gradient(160deg,#4c1414,#7a1f1f)',
    manche_terminee: 'linear-gradient(160deg,#0A1628,#1a3a6e)',
    fini: 'linear-gradient(160deg,#0A1628,#1a3a6e)',
  }

  return (
    <main style={{minHeight:'100vh',background:'#0A1628',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 18px'}}>
        <button onClick={() => router.push('/jeux')} style={{color:'rgba(255,255,255,0.6)',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
        <span style={{color:'#fff',fontWeight:'500',fontSize:'15px'}}>Test de réflexes</span>
        <div style={{width:'32px'}}></div>
      </div>

      <div style={{display:'flex',gap:'10px',padding:'0 18px 12px'}}>
        <div style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:'14px',padding:'12px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',marginBottom:'2px',textTransform:'uppercase',letterSpacing:'.05em'}}>Meilleur score</div>
          <div style={{fontSize:'20px',fontWeight:'600',color:'#D4A843'}}>{meilleur > 0 ? meilleur : '-'}</div>
        </div>
        <div style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:'14px',padding:'12px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',marginBottom:'2px',textTransform:'uppercase',letterSpacing:'.05em'}}>Manche</div>
          <div style={{fontSize:'20px',fontWeight:'600',color:'#fff'}}>{etat === 'accueil' ? '-' : Math.min(manche+1, NB_MANCHES)+' / '+NB_MANCHES}</div>
        </div>
      </div>

      {etat !== 'accueil' && etat !== 'fini' && (
        <div style={{display:'flex',justifyContent:'center',gap:'10px',padding:'0 18px 10px'}}>
          {lumieres.map((allumee, i) => (
            <div key={i} style={{width:'16px',height:'16px',borderRadius:'50%',background: allumee ? '#F43F5E' : 'rgba(255,255,255,0.15)',boxShadow: allumee ? '0 0 10px rgba(244,63,94,0.8)' : 'none',transition:'background 0.15s'}}></div>
          ))}
        </div>
      )}

      {etat === 'fini' ? (
        <div style={{flex:1,margin:'0 18px 18px',borderRadius:'24px',background:'linear-gradient(160deg,#0A1628,#1a3a6e)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div style={{fontSize:'40px',marginBottom:'8px'}}>{totalActuel >= meilleur ? '🏆' : '🎯'}</div>
          <div style={{fontSize:'15px',color:'rgba(255,255,255,0.6)',marginBottom:'6px'}}>Score final</div>
          <div style={{fontSize:'52px',fontWeight:'700',color:'#fff',marginBottom:'16px'}}>{totalActuel}</div>
          {totalActuel >= meilleur && <div style={{fontSize:'13px',color:'#D4A843',fontWeight:'500',marginBottom:'20px'}}>🏆 Nouveau record !</div>}
          <div style={{display:'flex',gap:'6px',marginBottom:'24px',flexWrap:'wrap',justifyContent:'center'}}>
            {scores.map((s, i) => (
              <div key={i} style={{background:'rgba(255,255,255,0.08)',borderRadius:'10px',padding:'6px 12px',color:'#fff',fontSize:'12px',fontWeight:'500'}}>{s} pts</div>
            ))}
          </div>
          <button onClick={demarrerPartie} style={{background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'14px',padding:'14px 32px',fontSize:'15px',fontWeight:'500',cursor:'pointer'}}>Rejouer</button>
        </div>
      ) : (
        <button onClick={onTap} style={{flex:1,background:fonds[etat],border:'none',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',transition:'background 0.15s',margin:'0 18px 18px',borderRadius:'24px'}}>
          {etat === 'manche_terminee' && dernierTemps !== null ? (
            <>
              <div style={{fontSize:'44px',fontWeight:'700',color:'#fff',marginBottom:'4px'}}>+{dernierPoints} pts</div>
              <div style={{fontSize:'13px',color:'rgba(255,255,255,0.5)',marginBottom:'4px'}}>{dernierTemps} ms</div>
              <div style={{fontSize:'14px',color:'rgba(255,255,255,0.6)',marginBottom:'16px'}}>
                {dernierTemps < 200 ? 'Ultra rapide ⚡' : dernierTemps < 300 ? 'Très bien !' : dernierTemps < 400 ? 'Bien' : 'Continue à t\'entraîner'}
              </div>
              <div style={{fontSize:'13px',color:'rgba(255,255,255,0.4)'}}>Touche pour la manche suivante</div>
            </>
          ) : etat === 'accueil' ? (
            <div style={{textAlign:'center',padding:'0 24px'}}>
              <div style={{fontSize:'18px',fontWeight:'600',color:'#fff',marginBottom:'8px'}}>5 manches chronométrées</div>
              <div style={{fontSize:'13px',color:'rgba(255,255,255,0.5)'}}>Touche pour commencer</div>
            </div>
          ) : (
            <div style={{fontSize:'18px',fontWeight:'600',color:'#fff',textAlign:'center',padding:'0 20px'}}>
              {etat === 'sequence' ? 'Attends le vert...' : etat === 'pret' ? 'TAPE MAINTENANT !' : 'Trop tôt ! Retouche pour réessayer'}
            </div>
          )}
        </button>
      )}
    </main>
  )
}
