'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const TAILLE = 15
const VITESSE_MS = 140

type Pos = { r: number, c: number }

function vibrer(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}

function positionAleatoire(occupees: Pos[]): Pos {
  let p: Pos
  do {
    p = { r: Math.floor(Math.random()*TAILLE), c: Math.floor(Math.random()*TAILLE) }
  } while (occupees.some(o => o.r === p.r && o.c === p.c))
  return p
}

export default function Snake() {
  const router = useRouter()
  const [serpent, setSerpent] = useState<Pos[]>([{ r: 7, c: 7 }, { r: 7, c: 6 }, { r: 7, c: 5 }])
  const [nourriture, setNourriture] = useState<Pos>({ r: 10, c: 10 })
  const [score, setScore] = useState(0)
  const [meilleur, setMeilleur] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [enPause, setEnPause] = useState(true)
  const directionRef = useRef<'haut'|'bas'|'gauche'|'droite'>('droite')
  const prochaineDirectionRef = useRef<'haut'|'bas'|'gauche'|'droite'>('droite')
  const serpentRef = useRef(serpent)
  const nourritureRef = useRef(nourriture)
  const touchStart = useRef<{x:number,y:number}|null>(null)

  useEffect(() => {
    const m = localStorage.getItem('snake_meilleur')
    if (m) setMeilleur(parseInt(m))
  }, [])

  useEffect(() => { serpentRef.current = serpent }, [serpent])
  useEffect(() => { nourritureRef.current = nourriture }, [nourriture])

  useEffect(() => {
    if (enPause || gameOver) return
    const interval = setInterval(() => {
      directionRef.current = prochaineDirectionRef.current
      const s = serpentRef.current
      const tete = s[0]
      let nouvelleTete: Pos = { ...tete }
      if (directionRef.current === 'haut') nouvelleTete.r -= 1
      if (directionRef.current === 'bas') nouvelleTete.r += 1
      if (directionRef.current === 'gauche') nouvelleTete.c -= 1
      if (directionRef.current === 'droite') nouvelleTete.c += 1

      if (nouvelleTete.r < 0 || nouvelleTete.r >= TAILLE || nouvelleTete.c < 0 || nouvelleTete.c >= TAILLE || s.some(seg => seg.r === nouvelleTete.r && seg.c === nouvelleTete.c)) {
        setGameOver(true)
        vibrer([50,30,50,30,80])
        return
      }

      const mange = nouvelleTete.r === nourritureRef.current.r && nouvelleTete.c === nourritureRef.current.c
      const nouveauSerpent = [nouvelleTete, ...s]
      if (!mange) nouveauSerpent.pop()
      else {
        vibrer([15,20,15])
        const nf = positionAleatoire(nouveauSerpent)
        setNourriture(nf)
        setScore(sc => {
          const ns = sc + 10
          if (ns > meilleur) { setMeilleur(ns); localStorage.setItem('snake_meilleur', String(ns)) }
          return ns
        })
      }
      setSerpent(nouveauSerpent)
    }, VITESSE_MS)
    return () => clearInterval(interval)
  }, [enPause, gameOver, meilleur])

  function changerDirection(d: 'haut'|'bas'|'gauche'|'droite') {
    const opposes: any = { haut:'bas', bas:'haut', gauche:'droite', droite:'gauche' }
    if (opposes[d] === directionRef.current) return
    prochaineDirectionRef.current = d
    if (enPause) setEnPause(false)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowUp') changerDirection('haut')
      if (e.key === 'ArrowDown') changerDirection('bas')
      if (e.key === 'ArrowLeft') changerDirection('gauche')
      if (e.key === 'ArrowRight') changerDirection('droite')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return
    if (Math.abs(dx) > Math.abs(dy)) changerDirection(dx > 0 ? 'droite' : 'gauche')
    else changerDirection(dy > 0 ? 'bas' : 'haut')
    touchStart.current = null
  }

  function recommencer() {
    setSerpent([{ r: 7, c: 7 }, { r: 7, c: 6 }, { r: 7, c: 5 }])
    setNourriture({ r: 10, c: 10 })
    setScore(0)
    setGameOver(false)
    setEnPause(true)
    directionRef.current = 'droite'
    prochaineDirectionRef.current = 'droite'
  }

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 16px',display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',maxWidth:'400px',marginBottom:'16px'}}>
        <button onClick={() => router.push('/jeux')} style={{color:'rgba(255,255,255,0.6)',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
        <span style={{color:'#fff',fontWeight:'500',fontSize:'15px'}}>Snake</span>
        <div style={{width:'32px'}}></div>
      </div>

      <div style={{display:'flex',gap:'10px',width:'100%',maxWidth:'400px',marginBottom:'14px'}}>
        <div style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:'14px',padding:'12px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',marginBottom:'2px',textTransform:'uppercase',letterSpacing:'.05em'}}>Score</div>
          <div style={{fontSize:'22px',fontWeight:'600',color:'#fff'}}>{score}</div>
        </div>
        <div style={{flex:1,background:'rgba(212,168,67,0.15)',border:'0.5px solid rgba(212,168,67,0.3)',borderRadius:'14px',padding:'12px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'#D4A843',marginBottom:'2px',textTransform:'uppercase',letterSpacing:'.05em'}}>Meilleur</div>
          <div style={{fontSize:'22px',fontWeight:'600',color:'#D4A843'}}>{meilleur}</div>
        </div>
      </div>

      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',textAlign:'center',marginBottom:'10px'}}>
        {enPause && !gameOver ? '👇 Glisse ou appuie sur une flèche pour démarrer' : '👆 Glisse ou utilise les flèches'}
      </div>

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{display:'grid',gridTemplateColumns:`repeat(${TAILLE}, 1fr)`,width:'100%',maxWidth:'340px',aspectRatio:'1',background:'rgba(255,255,255,0.06)',borderRadius:'14px',padding:'6px',marginBottom:'16px',touchAction:'none'}}>
        {Array.from({length: TAILLE*TAILLE}, (_, i) => {
          const r = Math.floor(i/TAILLE), c = i%TAILLE
          const estTete = serpent[0].r === r && serpent[0].c === c
          const estCorps = !estTete && serpent.some(s => s.r === r && s.c === c)
          const estNourriture = nourriture.r === r && nourriture.c === c
          return (
            <div key={i} style={{
              aspectRatio:'1',
              background: estTete ? '#D4A843' : estCorps ? '#10B981' : estNourriture ? '#F43F5E' : 'transparent',
              borderRadius: estTete || estCorps ? '4px' : estNourriture ? '50%' : '0',
              margin: estNourriture ? '2px' : '0.5px',
              transition:'background 0.1s'
            }}></div>
          )
        })}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,56px)',gridTemplateRows:'repeat(3,56px)',gap:'6px'}}>
        <div></div>
        <button onClick={() => changerDirection('haut')} style={btnStyle}>↑</button>
        <div></div>
        <button onClick={() => changerDirection('gauche')} style={btnStyle}>←</button>
        <div></div>
        <button onClick={() => changerDirection('droite')} style={btnStyle}>→</button>
        <div></div>
        <button onClick={() => changerDirection('bas')} style={btnStyle}>↓</button>
        <div></div>
      </div>

      {gameOver && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'20px'}}>
          <div style={{background:'#fff',borderRadius:'20px',padding:'28px',textAlign:'center',maxWidth:'320px',width:'100%'}}>
            <div style={{fontSize:'40px',marginBottom:'8px'}}>🐍</div>
            <div style={{fontSize:'18px',fontWeight:'600',color:'#1a1a2e',marginBottom:'4px'}}>Aïe !</div>
            <div style={{fontSize:'32px',fontWeight:'700',color:'#2B7FFF',marginBottom:'4px'}}>{score}</div>
            {score >= meilleur && score > 0 && <div style={{fontSize:'12px',color:'#D4A843',fontWeight:'500',marginBottom:'16px'}}>🏆 Nouveau record !</div>}
            <button onClick={recommencer} style={{width:'100%',background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>Rejouer</button>
          </div>
        </div>
      )}
    </main>
  )
}

const btnStyle: any = { background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:'12px', color:'#fff', fontSize:'20px', cursor:'pointer' }
