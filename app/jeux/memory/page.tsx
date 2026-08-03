'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const SYMBOLES = ['🍎','🎈','🚀','🎸','🐬','🌵','⚡','🎯']

function vibrer(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}

function melanger<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function nouvelleGrille() {
  return melanger([...SYMBOLES, ...SYMBOLES]).map((symbole, id) => ({ id, symbole }))
}

export default function Memory() {
  const router = useRouter()
  const [cartes, setCartes] = useState(() => nouvelleGrille())
  const [retournees, setRetournees] = useState<number[]>([])
  const [trouvees, setTrouvees] = useState<number[]>([])
  const [coups, setCoups] = useState(0)
  const [meilleur, setMeilleur] = useState(0)
  const [temps, setTemps] = useState(0)
  const [enCours, setEnCours] = useState(false)
  const [termine, setTermine] = useState(false)
  const bloque = useRef(false)

  useEffect(() => {
    const m = localStorage.getItem('memory_meilleur')
    if (m) setMeilleur(parseInt(m))
  }, [])

  useEffect(() => {
    if (!enCours || termine) return
    const interval = setInterval(() => setTemps(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [enCours, termine])

  function retourner(id: number) {
    if (bloque.current || retournees.includes(id) || trouvees.includes(id) || termine) return
    if (!enCours) setEnCours(true)
    vibrer(8)
    const nouvelles = [...retournees, id]
    setRetournees(nouvelles)

    if (nouvelles.length === 2) {
      bloque.current = true
      setCoups(c => c + 1)
      const [a, b] = nouvelles
      if (cartes[a].symbole === cartes[b].symbole) {
        vibrer([15,20,15])
        setTimeout(() => {
          const nt = [...trouvees, a, b]
          setTrouvees(nt)
          setRetournees([])
          bloque.current = false
          if (nt.length === cartes.length) {
            setTermine(true)
            setEnCours(false)
            vibrer([20,40,20,40,60])
            const score = coups + 1
            if (meilleur === 0 || score < meilleur) {
              setMeilleur(score)
              localStorage.setItem('memory_meilleur', String(score))
            }
          }
        }, 500)
      } else {
        setTimeout(() => {
          setRetournees([])
          bloque.current = false
        }, 800)
      }
    }
  }

  function recommencer() {
    setCartes(nouvelleGrille())
    setRetournees([])
    setTrouvees([])
    setCoups(0)
    setTemps(0)
    setEnCours(false)
    setTermine(false)
    bloque.current = false
  }

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 16px',display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',maxWidth:'400px',marginBottom:'16px'}}>
        <button onClick={() => router.push('/jeux')} style={{color:'rgba(255,255,255,0.6)',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
        <span style={{color:'#fff',fontWeight:'500',fontSize:'15px'}}>Memory</span>
        <div style={{width:'32px'}}></div>
      </div>

      <div style={{display:'flex',gap:'10px',width:'100%',maxWidth:'400px',marginBottom:'18px'}}>
        <div style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:'14px',padding:'12px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',marginBottom:'2px',textTransform:'uppercase',letterSpacing:'.05em'}}>Coups</div>
          <div style={{fontSize:'20px',fontWeight:'600',color:'#fff'}}>{coups}</div>
        </div>
        <div style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:'14px',padding:'12px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',marginBottom:'2px',textTransform:'uppercase',letterSpacing:'.05em'}}>Temps</div>
          <div style={{fontSize:'20px',fontWeight:'600',color:'#fff'}}>{Math.floor(temps/60)}:{String(temps%60).padStart(2,'0')}</div>
        </div>
        <div style={{flex:1,background:'rgba(212,168,67,0.15)',border:'0.5px solid rgba(212,168,67,0.3)',borderRadius:'14px',padding:'12px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'#D4A843',marginBottom:'2px',textTransform:'uppercase',letterSpacing:'.05em'}}>Record</div>
          <div style={{fontSize:'20px',fontWeight:'600',color:'#D4A843'}}>{meilleur || '-'}</div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',width:'100%',maxWidth:'360px'}}>
        {cartes.map(carte => {
          const visible = retournees.includes(carte.id) || trouvees.includes(carte.id)
          const estTrouvee = trouvees.includes(carte.id)
          return (
            <button key={carte.id} onClick={() => retourner(carte.id)}
              style={{
                aspectRatio:'1',borderRadius:'12px',border:'none',cursor:'pointer',
                background: estTrouvee ? 'rgba(16,185,129,0.25)' : visible ? '#fff' : 'rgba(255,255,255,0.1)',
                boxShadow: estTrouvee ? '0 0 0 2px #10B981' : 'none',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',
                transition:'transform 0.2s, background 0.2s',
                transform: visible ? 'scale(1)' : 'scale(1)',
                touchAction:'manipulation', WebkitTapHighlightColor:'transparent'
              }}>
              {visible ? carte.symbole : ''}
            </button>
          )
        })}
      </div>

      {termine && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'20px'}}>
          <div style={{background:'#fff',borderRadius:'20px',padding:'28px',textAlign:'center',maxWidth:'320px',width:'100%'}}>
            <div style={{fontSize:'40px',marginBottom:'8px'}}>🎉</div>
            <div style={{fontSize:'18px',fontWeight:'600',color:'#1a1a2e',marginBottom:'4px'}}>Toutes les paires trouvées !</div>
            <div style={{fontSize:'13px',color:'#aaa',marginBottom:'16px'}}>{coups} coups · {Math.floor(temps/60)}:{String(temps%60).padStart(2,'0')}</div>
            {coups <= meilleur && <div style={{fontSize:'12px',color:'#D4A843',fontWeight:'500',marginBottom:'16px'}}>🏆 Nouveau record !</div>}
            <button onClick={recommencer} style={{width:'100%',background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>Rejouer</button>
          </div>
        </div>
      )}
    </main>
  )
}
