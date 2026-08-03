'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const LARGEUR = 340
const HAUTEUR = 480
const RAQUETTE_L = 70
const RAQUETTE_H = 12
const BALLE_R = 6
const COLONNES = 7
const BRIQUE_H = 20
const MARGE = 4

const COULEURS_BRIQUES = ['#F43F5E','#F97316','#D4A843','#10B981','#2B7FFF','#8B5CF6']

function vibrer(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}

function genererNiveau(niveau: number) {
  const briques: any[] = []
  const lignes = Math.min(4 + Math.floor(niveau / 2), 8)
  const largeurBrique = (LARGEUR - MARGE * (COLONNES + 1)) / COLONNES
  const seed = niveau * 7 + 3
  for (let l = 0; l < lignes; l++) {
    for (let c = 0; c < COLONNES; c++) {
      if (niveau >= 2) {
        const trou = ((l * 3 + c * 5 + seed) % 11) < Math.min(1 + niveau, 4)
        if (trou) continue
      }
      const chanceSolide = niveau >= 3 ? 0.15 + niveau * 0.02 : 0
      const vie = Math.random() < chanceSolide ? 2 : 1
      briques.push({
        x: MARGE + c * (largeurBrique + MARGE),
        y: 40 + l * (BRIQUE_H + MARGE),
        w: largeurBrique, h: BRIQUE_H,
        couleur: COULEURS_BRIQUES[l % COULEURS_BRIQUES.length],
        vie, vieMax: vie,
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
  const [niveau, setNiveau] = useState(1)
  const [combo, setCombo] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [enPause, setEnPause] = useState(true)
  const [toast, setToast] = useState<string|null>(null)

  const etatRef = useRef({
    raquetteX: (LARGEUR - RAQUETTE_L) / 2,
    balleX: LARGEUR / 2,
    balleY: HAUTEUR - 40,
    balleVX: 2.4,
    balleVY: -3.2,
    briques: genererNiveau(1),
    score: 0,
    vies: 3,
    niveau: 1,
    combo: 0,
  })

  useEffect(() => {
    const m = localStorage.getItem('cassebriques_meilleur')
    if (m) setMeilleur(parseInt(m))
  }, [])

  function afficherToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 1100)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    function dessiner() {
      const e = etatRef.current
      ctx.clearRect(0, 0, LARGEUR, HAUTEUR)
      ctx.fillStyle = '#0A1628'
      ctx.fillRect(0, 0, LARGEUR, HAUTEUR)

      e.briques.forEach(b => {
        if (!b.vivante) return
        ctx.globalAlpha = b.vie < b.vieMax ? 0.55 : 1
        ctx.fillStyle = b.couleur
        ctx.beginPath()
        ctx.roundRect(b.x, b.y, b.w, b.h, 3)
        ctx.fill()
        if (b.vieMax > 1) {
          ctx.globalAlpha = 1
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.roundRect(b.x+1.5, b.y+1.5, b.w-3, b.h-3, 2)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      })

      ctx.fillStyle = '#2B7FFF'
      ctx.beginPath()
      ctx.roundRect(e.raquetteX, HAUTEUR - 24, RAQUETTE_L, RAQUETTE_H, 6)
      ctx.fill()

      ctx.fillStyle = '#D4A843'
      ctx.beginPath()
      ctx.arc(e.balleX, e.balleY, BALLE_R, 0, Math.PI * 2)
      ctx.fill()
    }

    function niveauSuivant() {
      const e = etatRef.current
      e.niveau += 1
      e.briques = genererNiveau(e.niveau)
      e.balleX = LARGEUR / 2
      e.balleY = HAUTEUR - 40
      e.balleVX = (2.4 + e.niveau * 0.15) * (Math.random() > 0.5 ? 1 : -1)
      e.balleVY = -(3.2 + e.niveau * 0.12)
      setNiveau(e.niveau)
      afficherToast('Niveau ' + e.niveau + ' !')
      vibrer([15,20,15,20,30])
    }

    function step() {
      const e = etatRef.current
      if (!enPause && !gameOver) {
        e.balleX += e.balleVX
        e.balleY += e.balleVY

        if (e.balleX <= BALLE_R || e.balleX >= LARGEUR - BALLE_R) e.balleVX *= -1
        if (e.balleY <= BALLE_R) e.balleVY *= -1

        if (e.balleY + BALLE_R >= HAUTEUR - 24 && e.balleY + BALLE_R <= HAUTEUR - 24 + RAQUETTE_H + 6 &&
            e.balleX >= e.raquetteX - BALLE_R && e.balleX <= e.raquetteX + RAQUETTE_L + BALLE_R && e.balleVY > 0) {
          const impact = (e.balleX - (e.raquetteX + RAQUETTE_L/2)) / (RAQUETTE_L/2)
          e.balleVX = impact * 4.5
          e.balleVY = -Math.abs(e.balleVY)
          if (e.combo > 0) { e.combo = 0; setCombo(0) }
          vibrer(8)
        }

        for (const b of e.briques) {
          if (!b.vivante) continue
          if (e.balleX + BALLE_R > b.x && e.balleX - BALLE_R < b.x + b.w && e.balleY + BALLE_R > b.y && e.balleY - BALLE_R < b.y + b.h) {
            b.vie -= 1
            e.balleVY *= -1
            if (b.vie <= 0) {
              b.vivante = false
              e.combo += 1
              setCombo(e.combo)
              const gain = 10 * (1 + Math.floor(e.combo / 3))
              e.score += gain
              setScore(e.score)
              if (e.combo > 0 && e.combo % 5 === 0) afficherToast('Combo x' + e.combo + ' !')
            }
            vibrer(12)
            if (e.score > meilleur) localStorage.setItem('cassebriques_meilleur', String(e.score))
            break
          }
        }

        if (e.briques.every(b => !b.vivante)) niveauSuivant()

        if (e.balleY > HAUTEUR + 20) {
          e.vies -= 1
          e.combo = 0
          setCombo(0)
          setVies(e.vies)
          if (e.vies <= 0) {
            setGameOver(true)
            if (e.score > meilleur) { setMeilleur(e.score); localStorage.setItem('cassebriques_meilleur', String(e.score)) }
            vibrer([50,30,50,30,80])
          } else {
            e.balleX = LARGEUR / 2
            e.balleY = HAUTEUR - 40
            e.balleVX = (2.4 + e.niveau * 0.15) * (Math.random() > 0.5 ? 1 : -1)
            e.balleVY = -(3.2 + e.niveau * 0.12)
            vibrer([30,20,30])
          }
        }
      }
      dessiner()
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [enPause, gameOver, meilleur])

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
      briques: genererNiveau(1),
      score: 0, vies: 3, niveau: 1, combo: 0,
    }
    setScore(0); setVies(3); setNiveau(1); setCombo(0); setGameOver(false); setEnPause(true)
  }

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 16px',display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',maxWidth:'380px',marginBottom:'12px'}}>
        <button onClick={() => router.push('/jeux')} style={{color:'rgba(255,255,255,0.6)',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
        <span style={{color:'#fff',fontWeight:'500',fontSize:'15px'}}>Casse-briques · Niv. {niveau}</span>
        <div style={{width:'32px'}}></div>
      </div>

      <div style={{display:'flex',gap:'8px',width:'100%',maxWidth:'380px',marginBottom:'12px'}}>
        <div style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:'14px',padding:'10px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'.05em'}}>Score</div>
          <div style={{fontSize:'18px',fontWeight:'600',color:'#fff'}}>{score}</div>
        </div>
        <div style={{flex:1,background: combo >= 3 ? 'rgba(212,168,67,0.25)' : 'rgba(255,255,255,0.08)',border: combo >= 3 ? '0.5px solid rgba(212,168,67,0.5)' : 'none',borderRadius:'14px',padding:'10px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color: combo >= 3 ? '#D4A843' : 'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'.05em'}}>Combo</div>
          <div style={{fontSize:'18px',fontWeight:'600',color: combo >= 3 ? '#D4A843' : '#fff'}}>{combo > 0 ? 'x'+combo : '-'}</div>
        </div>
        <div style={{flex:1,background:'rgba(255,255,255,0.08)',borderRadius:'14px',padding:'10px',textAlign:'center'}}>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'.05em'}}>Vies</div>
          <div style={{fontSize:'18px',fontWeight:'600',color:'#fff'}}>{'❤️'.repeat(vies)}</div>
        </div>
      </div>

      <div style={{position:'relative',width:'100%',maxWidth:LARGEUR}}>
        {toast && (
          <div style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)',zIndex:20,background:'linear-gradient(135deg,#D4A843,#F97316)',color:'#fff',padding:'10px 22px',borderRadius:'99px',fontSize:'15px',fontWeight:'700',boxShadow:'0 8px 24px rgba(212,168,67,0.5)'}}>
            {toast}
          </div>
        )}
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
        {enPause && !gameOver && (
          <div onClick={() => setEnPause(false)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'16px',cursor:'pointer'}}>
            <div style={{background:'rgba(255,255,255,0.15)',color:'#fff',padding:'12px 24px',borderRadius:'99px',fontSize:'14px',fontWeight:'500'}}>Touche pour lancer</div>
          </div>
        )}
      </div>

      <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',textAlign:'center',marginTop:'12px'}}>
        👆 Glisse ton doigt · les briques à contour blanc résistent à 2 coups
      </div>

      {gameOver && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'20px'}}>
          <div style={{background:'#fff',borderRadius:'20px',padding:'28px',textAlign:'center',maxWidth:'320px',width:'100%'}}>
            <div style={{fontSize:'40px',marginBottom:'8px'}}>🧱</div>
            <div style={{fontSize:'18px',fontWeight:'600',color:'#1a1a2e',marginBottom:'4px'}}>Partie terminée</div>
            <div style={{fontSize:'32px',fontWeight:'700',color:'#2B7FFF',marginBottom:'4px'}}>{score}</div>
            <div style={{fontSize:'12px',color:'#aaa',marginBottom:'8px'}}>Niveau atteint : {niveau}</div>
            {score >= meilleur && score > 0 && <div style={{fontSize:'12px',color:'#D4A843',fontWeight:'500',marginBottom:'16px'}}>🏆 Nouveau record !</div>}
            <button onClick={recommencer} style={{width:'100%',background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>Rejouer</button>
          </div>
        </div>
      )}
    </main>
  )
}
