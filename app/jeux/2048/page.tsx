'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const TAILLE = 4

const COULEURS: any = {
  2: { bg:'#EEF5FF', txt:'#1a1a2e' },
  4: { bg:'#DCE9FF', txt:'#1a1a2e' },
  8: { bg:'#F97316', txt:'#fff' },
  16: { bg:'#F59E0B', txt:'#fff' },
  32: { bg:'#F43F5E', txt:'#fff' },
  64: { bg:'#EC4899', txt:'#fff' },
  128: { bg:'#8B5CF6', txt:'#fff' },
  256: { bg:'#7C3AED', txt:'#fff' },
  512: { bg:'#2B7FFF', txt:'#fff' },
  1024: { bg:'#0EA5E9', txt:'#fff' },
  2048: { bg:'#D4A843', txt:'#fff' },
}

function vibrer(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}

function grilleVide() {
  return Array(TAILLE).fill(null).map(() => Array(TAILLE).fill(null) as (number|null)[])
}

function ajouterTuile(g: (number|null)[][]) {
  const vides: [number,number][] = []
  for (let r=0;r<TAILLE;r++) for (let c=0;c<TAILLE;c++) if (!g[r][c]) vides.push([r,c])
  if (vides.length === 0) return g
  const [r,c] = vides[Math.floor(Math.random()*vides.length)]
  const ng = g.map(row => [...row])
  ng[r][c] = Math.random() < 0.9 ? 2 : 4
  return ng
}

function compresserLigne(ligne: (number|null)[]) {
  const valeurs = ligne.filter(v => v !== null) as number[]
  let gain = 0
  const res: (number|null)[] = []
  let i = 0
  while (i < valeurs.length) {
    if (valeurs[i] === valeurs[i+1]) {
      const fusion = valeurs[i]*2
      res.push(fusion)
      gain += fusion
      i += 2
    } else {
      res.push(valeurs[i])
      i += 1
    }
  }
  while (res.length < TAILLE) res.push(null)
  return { ligne: res, gain }
}

function rotationHoraire(g: (number|null)[][]) {
  const ng = grilleVide()
  for (let r=0;r<TAILLE;r++) for (let c=0;c<TAILLE;c++) ng[c][TAILLE-1-r] = g[r][c]
  return ng
}

// direction: 0=gauche,1=haut,2=droite,3=bas
function bouger(g: (number|null)[][], direction: number) {
  let gg = g
  for (let i=0;i<direction;i++) gg = rotationHoraire(gg)
  // maintenant on applique un "vers la gauche" en fonction de la rotation choisie
  // gauche(0): pas de rotation prealable a gauche direct
  // haut(1): apres avoir tourne, "haut" devient "gauche"... on adapte via rotations differentes
  return gg
}

function deplacerGauche(g: (number|null)[][]) {
  let gain = 0
  let bouge = false
  const ng = g.map(row => {
    const { ligne, gain: gLigne } = compresserLigne(row)
    gain += gLigne
    return ligne
  })
  for (let r=0;r<TAILLE;r++) for (let c=0;c<TAILLE;c++) if (ng[r][c] !== g[r][c]) bouge = true
  return { grille: ng, gain, bouge }
}

function appliquerDirection(g: (number|null)[][], direction: 'gauche'|'droite'|'haut'|'bas') {
  let gg = g
  let rotations = 0
  if (direction === 'gauche') rotations = 0
  if (direction === 'haut') rotations = 3
  if (direction === 'droite') rotations = 2
  if (direction === 'bas') rotations = 1
  for (let i=0;i<rotations;i++) gg = rotationHoraire(gg)
  const { grille, gain, bouge } = deplacerGauche(gg)
  let res = grille
  for (let i=0;i<(4-rotations)%4;i++) res = rotationHoraire(res)
  return { grille: res, gain, bouge }
}

function peutBouger(g: (number|null)[][]) {
  for (let r=0;r<TAILLE;r++) for (let c=0;c<TAILLE;c++) {
    if (!g[r][c]) return true
    if (c<TAILLE-1 && g[r][c]===g[r][c+1]) return true
    if (r<TAILLE-1 && g[r][c]===g[r+1][c]) return true
  }
  return false
}

export default function Jeu2048() {
  const router = useRouter()
  const [grille, setGrille] = useState<(number|null)[][]>(() => ajouterTuile(ajouterTuile(grilleVide())))
  const [score, setScore] = useState(0)
  const [meilleur, setMeilleur] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gagne, setGagne] = useState(false)
  const [continuer, setContinuer] = useState(false)
  const touchStart = useRef<{x:number,y:number}|null>(null)

  useEffect(() => {
    const m = localStorage.getItem('jeu2048_meilleur')
    if (m) setMeilleur(parseInt(m))
  }, [])

  function jouer(direction: 'gauche'|'droite'|'haut'|'bas') {
    if (gameOver || (gagne && !continuer)) return
    const { grille: ng, gain, bouge } = appliquerDirection(grille, direction)
    if (!bouge) return
    const avecNouvelle = ajouterTuile(ng)
    setGrille(avecNouvelle)
    vibrer(gain > 0 ? [10,20,10] : 8)
    const nouveauScore = score + gain
    setScore(nouveauScore)
    if (nouveauScore > meilleur) { setMeilleur(nouveauScore); localStorage.setItem('jeu2048_meilleur', String(nouveauScore)) }
    if (!gagne && avecNouvelle.some(row => row.some(v => v === 2048))) { setGagne(true); vibrer([20,40,20,40,60]) }
    if (!peutBouger(avecNouvelle)) { setGameOver(true); vibrer([50,30,50,30,80]) }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') jouer('gauche')
      if (e.key === 'ArrowRight') jouer('droite')
      if (e.key === 'ArrowUp') jouer('haut')
      if (e.key === 'ArrowDown') jouer('bas')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
    if (Math.abs(dx) > Math.abs(dy)) jouer(dx > 0 ? 'droite' : 'gauche')
    else jouer(dy > 0 ? 'bas' : 'haut')
    touchStart.current = null
  }

  function recommencer() {
    setGrille(ajouterTuile(ajouterTuile(grilleVide())))
    setScore(0)
    setGameOver(false)
    setGagne(false)
    setContinuer(false)
  }

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 16px',display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',maxWidth:'400px',marginBottom:'16px'}}>
        <button onClick={() => router.push('/jeux')} style={{color:'rgba(255,255,255,0.6)',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
        <span style={{color:'#fff',fontWeight:'500',fontSize:'15px'}}>2048</span>
        <div style={{width:'32px'}}></div>
      </div>

      <div style={{display:'flex',gap:'10px',width:'100%',maxWidth:'400px',marginBottom:'16px'}}>
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
        👆 Glisse ton doigt sur la grille, ou utilise les flèches
      </div>

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{display:'grid',gridTemplateColumns:`repeat(${TAILLE}, 1fr)`,gap:'8px',width:'100%',maxWidth:'360px',aspectRatio:'1',background:'rgba(255,255,255,0.06)',borderRadius:'16px',padding:'10px',marginBottom:'18px',touchAction:'none'}}>
        {grille.map((row, r) => row.map((v, c) => (
          <div key={r+'-'+c} style={{
            aspectRatio:'1',borderRadius:'8px',
            background: v ? COULEURS[Math.min(v,2048)]?.bg || '#0A1628' : 'rgba(255,255,255,0.06)',
            color: v ? COULEURS[Math.min(v,2048)]?.txt || '#fff' : 'transparent',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize: v && v >= 1000 ? '18px' : '22px', fontWeight:'700',
            animation: v ? 'popIn 0.15s ease' : 'none',
            boxShadow: v ? '0 2px 6px rgba(0,0,0,0.2)' : 'none'
          }}>
            {v || ''}
          </div>
        )))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,56px)',gridTemplateRows:'repeat(3,56px)',gap:'6px',marginBottom:'8px'}}>
        <div></div>
        <button onClick={() => jouer('haut')} style={btnStyle}>↑</button>
        <div></div>
        <button onClick={() => jouer('gauche')} style={btnStyle}>←</button>
        <div></div>
        <button onClick={() => jouer('droite')} style={btnStyle}>→</button>
        <div></div>
        <button onClick={() => jouer('bas')} style={btnStyle}>↓</button>
        <div></div>
      </div>

      {gagne && !continuer && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'20px'}}>
          <div style={{background:'#fff',borderRadius:'20px',padding:'28px',textAlign:'center',maxWidth:'320px',width:'100%'}}>
            <div style={{fontSize:'40px',marginBottom:'8px'}}>🏆</div>
            <div style={{fontSize:'18px',fontWeight:'600',color:'#1a1a2e',marginBottom:'16px'}}>Tu as atteint 2048 !</div>
            <button onClick={() => setContinuer(true)} style={{width:'100%',background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'14px',fontWeight:'500',cursor:'pointer',marginBottom:'10px'}}>Continuer à jouer</button>
            <button onClick={recommencer} style={{width:'100%',background:'#F8FBFF',color:'#666',border:'0.5px solid #E8F1FF',borderRadius:'12px',padding:'14px',fontSize:'14px',cursor:'pointer'}}>Nouvelle partie</button>
          </div>
        </div>
      )}

      {gameOver && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'20px'}}>
          <div style={{background:'#fff',borderRadius:'20px',padding:'28px',textAlign:'center',maxWidth:'320px',width:'100%'}}>
            <div style={{fontSize:'40px',marginBottom:'8px'}}>🎮</div>
            <div style={{fontSize:'18px',fontWeight:'600',color:'#1a1a2e',marginBottom:'4px'}}>Plus de mouvement possible</div>
            <div style={{fontSize:'32px',fontWeight:'700',color:'#2B7FFF',marginBottom:'16px'}}>{score}</div>
            <button onClick={recommencer} style={{width:'100%',background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>Rejouer</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn { 0% { transform: scale(0.6); opacity: 0.4; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </main>
  )
}

const btnStyle: any = { background:'rgba(255,255,255,0.1)', border:'0.5px solid rgba(255,255,255,0.2)', borderRadius:'12px', color:'#fff', fontSize:'20px', cursor:'pointer' }
