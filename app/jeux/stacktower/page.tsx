'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const GAME_W = 300
const BLOC_H = 34
const HAUTEUR_VISIBLE = 480
const COULEURS = ['#2B7FFF','#10B981','#D4A843','#F97316','#8B5CF6','#EC4899','#F43F5E']

function vibrer(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}

export default function StackTower() {
  const router = useRouter()
  const [blocs, setBlocs] = useState<{x:number,w:number,couleur:string}[]>([{ x: 0, w: GAME_W, couleur: COULEURS[0] }])
  const [courant, setCourant] = useState({ x: 0, w: GAME_W })
  const [score, setScore] = useState(0)
  const [meilleur, setMeilleur] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [parfait, setParfait] = useState(false)
  const directionRef = useRef(1)
  const vitesseRef = useRef(1.6)
  const xRef = useRef(0)
  const rafRef = useRef<number>(0)
  const blocsRef = useRef(blocs)
  const courantRef = useRef(courant)

  useEffect(() => {
    const m = localStorage.getItem('stacktower_meilleur')
    if (m) setMeilleur(parseInt(m))
  }, [])

  useEffect(() => { blocsRef.current = blocs }, [blocs])
  useEffect(() => { courantRef.current = courant }, [courant])

  useEffect(() => {
    if (gameOver) return
    function step() {
      const dernier = blocsRef.current[blocsRef.current.length - 1]
      xRef.current += directionRef.current * vitesseRef.current
      const maxX = GAME_W - dernier.w
      if (xRef.current <= 0) { xRef.current = 0; directionRef.current = 1 }
      if (xRef.current >= maxX) { xRef.current = maxX; directionRef.current = -1 }
      setCourant({ x: xRef.current, w: dernier.w })
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [gameOver, blocs.length])

  function poser() {
    if (gameOver) { recommencer(); return }
    const dernier = blocsRef.current[blocsRef.current.length - 1]
    const c = courantRef.current
    const gauche = Math.max(c.x, dernier.x)
    const droite = Math.min(c.x + c.w, dernier.x + dernier.w)
    const largeur = droite - gauche

    if (largeur <= 4) {
      setGameOver(true)
      vibrer([50,30,50,30,80])
      if (score > meilleur) { setMeilleur(score); localStorage.setItem('stacktower_meilleur', String(score)) }
      return
    }

    const diff = Math.abs(c.x - dernier.x)
    let nouveauBloc
    if (diff < 5) {
      nouveauBloc = { x: dernier.x, w: dernier.w, couleur: COULEURS[blocsRef.current.length % COULEURS.length] }
      setParfait(true)
      setTimeout(() => setParfait(false), 500)
      vibrer([10,15,10,15,10])
      setScore(s => s + 2)
    } else {
      nouveauBloc = { x: gauche, w: largeur, couleur: COULEURS[blocsRef.current.length % COULEURS.length] }
      vibrer(10)
      setScore(s => s + 1)
    }

    setBlocs(prev => [...prev, nouveauBloc])
    xRef.current = nouveauBloc.x === 0 ? nouveauBloc.w >= GAME_W - nouveauBloc.w ? 0 : GAME_W - nouveauBloc.w : 0
    directionRef.current = Math.random() > 0.5 ? 1 : -1
    vitesseRef.current = Math.min(vitesseRef.current + 0.08, 5)

    const s = score + (diff < 5 ? 2 : 1)
    if (s > meilleur) { setMeilleur(s); localStorage.setItem('stacktower_meilleur', String(s)) }
  }

  function recommencer() {
    setBlocs([{ x: 0, w: GAME_W, couleur: COULEURS[0] }])
    setCourant({ x: 0, w: GAME_W })
    setScore(0)
    setGameOver(false)
    directionRef.current = 1
    vitesseRef.current = 1.6
    xRef.current = 0
  }

  const totalHauteur = (blocs.length + 1) * BLOC_H
  const decalage = Math.max(0, totalHauteur - HAUTEUR_VISIBLE)

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 16px',display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',maxWidth:GAME_W+40,marginBottom:'14px'}}>
        <button onClick={() => router.push('/jeux')} style={{color:'rgba(255,255,255,0.6)',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
        <span style={{color:'#fff',fontWeight:'500',fontSize:'15px'}}>Stack Tower</span>
        <div style={{width:'32px'}}></div>
      </div>

      <div style={{display:'flex',gap:'10px',width:'100%',maxWidth:GAME_W+40,marginBottom:'14px'}}>
        <div style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:'14px',padding:'10px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'.05em'}}>Score</div>
          <div style={{fontSize:'20px',fontWeight:'600',color:'#fff'}}>{score}</div>
        </div>
        <div style={{flex:1,background:'rgba(212,168,67,0.15)',border:'0.5px solid rgba(212,168,67,0.3)',borderRadius:'14px',padding:'10px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'#D4A843',textTransform:'uppercase',letterSpacing:'.05em'}}>Meilleur</div>
          <div style={{fontSize:'20px',fontWeight:'600',color:'#D4A843'}}>{meilleur}</div>
        </div>
      </div>

      <div onClick={poser} style={{position:'relative',width:GAME_W,height:HAUTEUR_VISIBLE,background:'rgba(255,255,255,0.05)',borderRadius:'16px',overflow:'hidden',cursor:'pointer'}}>
        {parfait && (
          <div style={{position:'absolute',top:'30%',left:'50%',transform:'translate(-50%,-50%)',zIndex:10,background:'linear-gradient(135deg,#D4A843,#F97316)',color:'#fff',padding:'8px 20px',borderRadius:'99px',fontSize:'15px',fontWeight:'700',boxShadow:'0 8px 20px rgba(212,168,67,0.5)'}}>
            PARFAIT !
          </div>
        )}
        <div style={{position:'absolute',bottom: -decalage,left:0,width:'100%',transition:'bottom 0.25s ease'}}>
          {blocs.map((b, i) => (
            <div key={i} style={{
              position:'absolute', bottom: i * BLOC_H, left: b.x, width: b.w, height: BLOC_H - 3,
              background: b.couleur, borderRadius:'4px', boxShadow:'0 2px 4px rgba(0,0,0,0.25)'
            }}></div>
          ))}
          {!gameOver && (
            <div style={{
              position:'absolute', bottom: blocs.length * BLOC_H, left: courant.x, width: courant.w, height: BLOC_H - 3,
              background: COULEURS[blocs.length % COULEURS.length], borderRadius:'4px', boxShadow:'0 2px 6px rgba(0,0,0,0.35)', opacity:0.95
            }}></div>
          )}
        </div>
        {blocs.length === 1 && !gameOver && (
          <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',color:'rgba(255,255,255,0.4)',fontSize:'13px',textAlign:'center',pointerEvents:'none'}}>
            👆 Touche pour empiler
          </div>
        )}
      </div>

      {gameOver && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'20px'}}>
          <div style={{background:'#fff',borderRadius:'20px',padding:'28px',textAlign:'center',maxWidth:'320px',width:'100%'}}>
            <div style={{fontSize:'40px',marginBottom:'8px'}}>🗼</div>
            <div style={{fontSize:'18px',fontWeight:'600',color:'#1a1a2e',marginBottom:'4px'}}>Tour effondrée !</div>
            <div style={{fontSize:'32px',fontWeight:'700',color:'#2B7FFF',marginBottom:'4px'}}>{score}</div>
            {score >= meilleur && score > 0 && <div style={{fontSize:'12px',color:'#D4A843',fontWeight:'500',marginBottom:'16px'}}>🏆 Nouveau record !</div>}
            <button onClick={recommencer} style={{width:'100%',background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>Rejouer</button>
          </div>
        </div>
      )}
    </main>
  )
}
