'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const LARGEUR = 340
const HAUTEUR = 480
const RAQUETTE_L = 70
const RAQUETTE_H = 12
const BALLE_R = 6
const LIGNES = 5
const COLONNES = 7
const BRIQUE_H = 20
const MARGE = 4

const COULEURS_BRIQUES = ['#F43F5E','#F97316','#D4A843','#10B981','#2B7FFF']

function vibrer(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}

function nouvellesBriques() {
  const briques: any[] = []
  const largeurBrique = (LARGEUR - MARGE * (COLONNES + 1)) / COLONNES
  for (let l = 0; l < LIGNES; l++) {
    for (let c = 0; c < COLONNES; c++) {
      briques.push({
        x: MARGE + c * (largeurBrique + MARGE),
        y: 40 + l * (BRIQUE_H + MARGE),
        w: largeurBrique, h: BRIQUE_H,
        couleur: COULEURS_BRIQUES[l % COULEURS_BRIQUES.length],
        vivante: true
      })
    }
  }
  return briques
}

export default function CasseBriques() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const [score, setScore] = useState(0)
  const [meilleur, setMeilleur] = useState(0)
  const [vies, setVies] = useState(3)
  const [gameOver, setGameOver] = useState(false)
  const [gagne, setGagne] = useState(false)
  const [enPause, setEnPause] = useState(true)

  const etatRef = useRef({
    raquetteX: (LARGEUR - RAQUETTE_L) / 2,
    balleX: LARGEUR / 2,
    balleY: HAUTEUR - 40,
    balleVX: 2.4,
    balleVY: -3.2,
    briques: nouvellesBriques(),
    score: 0,
    vies: 3,
  })

  useEffect(() => {
    const m = localStorage.getItem('cassebriques_meilleur')
    if (m) setMeilleur(parseInt(m))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    function dessiner() {
      const e = etatRef.current
      ctx.clearRect(0, 0, LARGEUR, HAUTEUR)
      ctx.fillStyle = '#0A1628'
      ctx.fillRect(0, 0, LARGEUR, HAUTEUR)

      // Briques
      e.briques.forEach(b => {
        if (!b.vivante) return
        ctx.fillStyle = b.couleur
        ctx.beginPath()
        ctx.roundRect(b.x, b.y, b.w, b.h, 3)
        ctx.fill()
      })

      // Raquette
      ctx.fillStyle = '#2B7FFF'
      ctx.beginPath()
      ctx.roundRect(e.raquetteX, HAUTEUR - 24, RAQUETTE_L, RAQUETTE_H, 6)
      ctx.fill()

      // Balle
      ctx.fillStyle = '#D4A843'
      ctx.beginPath()
      ctx.arc(e.balleX, e.balleY, BALLE_R, 0, Math.PI * 2)
      ctx.fill()
    }

    function step() {
      const e = etatRef.current
      if (!enPause && !gameOver && !gagne) {
        e.balleX += e.balleVX
        e.balleY += e.balleVY

        if (e.balleX <= BALLE_R || e.balleX >= LARGEUR - BALLE_R) e.balleVX *= -1
        if (e.balleY <= BALLE_R) e.balleVY *= -1

        // Raquette
        if (e.balleY + BALLE_R >= HAUTEUR - 24 && e.balleY + BALLE_R <= HAUTEUR - 24 + RAQUETTE_H + 6 &&
            e.balleX >= e.raquetteX - BALLE_R && e.balleX <= e.raquetteX + RAQUETTE_L + BALLE_R && e.balleVY > 0) {
          const impact = (e.balleX - (e.raquetteX + RAQUETTE_L/2)) / (RAQUETTE_L/2)
          e.balleVX = impact * 4.5
          e.balleVY = -Math.abs(e.balleVY)
          vibrer(8)
        }

        // Briques
        for (const b of e.briques) {
          if (!b.vivante) continue
          if (e.balleX + BALLE_R > b.x && e.balleX - BALLE_R < b.x + b.w && e.balleY + BALLE_R > b.y && e.balleY - BALLE_R < b.y + b.h) {
            b.vivante = false
            e.balleVY *= -1
            e.score += 10
            setScore(e.score)
            vibrer(12)
            if (e.score > meilleur) { localStorage.setItem('cassebriques_meilleur', String(e.score)) }
            break
          }
        }

        if (e.briques.every(b => !b.vivante)) {
          setGagne(true)
          vibrer([20,40,20,40,60])
        }

        // Balle perdue
        if (e.balleY > HAUTEUR + 20) {
          e.vies -= 1
          setVies(e.vies)
          if (e.vies <= 0) {
            setGameOver(true)
            if (e.score > meilleur) { setMeilleur(e.score); localStorage.setItem('cassebriques_meilleur', String(e.score)) }
            vibrer([50,30,50,30,80])
          } else {
            e.balleX = LARGEUR / 2
            e.balleY = HAUTEUR - 40
            e.balleVX = 2.4 * (Math.random() > 0.5 ? 1 : -1)
            e.balleVY = -3.2
            vibrer([30,20,30])
          }
        }
      }
      dessiner()
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [enPause, gameOver, gagne, meilleur])

  function deplacerRaquette(clientX: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scale = LARGEUR / rect.width
    const x = (clientX - rect.left) * scale - RAQUETTE_L / 2
    etatRef.current.raquetteX = Math.max(0, Math.min(LARGEUR - RAQUETTE_L, x))
  }

  function recommencer() {
    etatRef.current = {
      raquetteX: (LARGEUR - RAQUETTE_L) / 2,
      balleX: LARGEUR / 2, balleY: HAUTEUR - 40,
      balleVX: 2.4, balleVY: -3.2,
      briques: nouvellesBriques(),
      score: 0, vies: 3,
    }
    setScore(0); setVies(3); setGameOver(false); setGagne(false); setEnPause(true)
  }

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 16px',display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',maxWidth:'380px',marginBottom:'14px'}}>
        <button onClick={() => router.push('/jeux')} style={{color:'rgba(255,255,255,0.6)',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
        <span style={{color:'#fff',fontWeight:'500',fontSize:'15px'}}>Casse-briques</span>
        <div style={{width:'32px'}}></div>
      </div>

      <div style={{display:'flex',gap:'10px',width:'100%',maxWidth:'380px',marginBottom:'12px'}}>
        <div style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:'14px',padding:'10px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'.05em'}}>Score</div>
          <div style={{fontSize:'18px',fontWeight:'600',color:'#fff'}}>{score}</div>
        </div>
        <div style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:'14px',padding:'10px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'.05em'}}>Vies</div>
          <div style={{fontSize:'18px',fontWeight:'600',color:'#fff'}}>{'❤️'.repeat(vies)}</div>
        </div>
        <div style={{flex:1,background:'rgba(212,168,67,0.15)',border:'0.5px solid rgba(212,168,67,0.3)',borderRadius:'14px',padding:'10px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'#D4A843',textTransform:'uppercase',letterSpacing:'.05em'}}>Meilleur</div>
          <div style={{fontSize:'18px',fontWeight:'600',color:'#D4A843'}}>{meilleur}</div>
        </div>
      </div>

      <div style={{position:'relative',width:'100%',maxWidth:LARGEUR}}>
        <canvas
          ref={canvasRef}
          width={LARGEUR}
          height={HAUTEUR}
          onMouseMove={(e) => deplacerRaquette(e.clientX)}
          onTouchMove={(e) => { e.preventDefault(); deplacerRaquette(e.touches[0].clientX) }}
          onTouchStart={(e) => { deplacerRaquette(e.touches[0].clientX); setEnPause(false) }}
          onClick={() => setEnPause(false)}
          style={{width:'100%',height:'auto',borderRadius:'16px',touchAction:'none',display:'block'}}
        />
        {enPause && !gameOver && !gagne && (
          <div onClick={() => setEnPause(false)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'16px',cursor:'pointer'}}>
            <div style={{background:'rgba(255,255,255,0.15)',color:'#fff',padding:'12px 24px',borderRadius:'99px',fontSize:'14px',fontWeight:'500'}}>Touche pour lancer</div>
          </div>
        )}
      </div>

      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',textAlign:'center',marginTop:'12px'}}>
        👆 Glisse ton doigt pour déplacer la raquette
      </div>

      {(gameOver || gagne) && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'20px'}}>
          <div style={{background:'#fff',borderRadius:'20px',padding:'28px',textAlign:'center',maxWidth:'320px',width:'100%'}}>
            <div style={{fontSize:'40px',marginBottom:'8px'}}>{gagne ? '🏆' : '🧱'}</div>
            <div style={{fontSize:'18px',fontWeight:'600',color:'#1a1a2e',marginBottom:'4px'}}>{gagne ? 'Toutes les briques cassées !' : 'Partie terminée'}</div>
            <div style={{fontSize:'32px',fontWeight:'700',color:'#2B7FFF',marginBottom:'4px'}}>{score}</div>
            {score >= meilleur && score > 0 && <div style={{fontSize:'12px',color:'#D4A843',fontWeight:'500',marginBottom:'16px'}}>🏆 Nouveau record !</div>}
            <button onClick={recommencer} style={{width:'100%',background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>Rejouer</button>
          </div>
        </div>
      )}
    </main>
  )
}
