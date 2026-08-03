'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const TAILLE = 8
const COULEURS = ['#2B7FFF', '#F43F5E', '#10B981', '#D4A843', '#8B5CF6', '#EC4899', '#F97316']

const FORMES: number[][][] = [
  [[0,0]],
  [[0,0],[0,1]],
  [[0,0],[1,0]],
  [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[0,2],[0,3]],
  [[0,0],[1,0],[2,0],[3,0]],
  [[0,0],[0,1],[1,0],[1,1]],
  [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],
  [[0,0],[1,0],[0,1],[1,1],[2,0],[2,1]],
  [[0,0],[1,0],[2,0],[2,1]],
  [[0,1],[1,1],[2,1],[2,0]],
  [[0,0],[0,1],[1,0],[2,0]],
  [[0,0],[0,1],[1,1],[2,1]],
  [[0,0],[0,1],[0,2],[1,1]],
  [[1,0],[1,1],[1,2],[0,1]],
  [[0,0],[1,0],[2,0],[1,1]],
  [[0,1],[1,0],[1,1],[2,1]],
  [[0,1],[0,2],[1,0],[1,1]],
  [[0,0],[0,1],[1,1],[1,2]],
  [[0,0],[0,1],[1,0]],
  [[0,0],[0,1],[1,1]],
  [[0,0],[1,0],[1,1]],
  [[0,1],[1,0],[1,1]],
  [[0,1],[1,0],[1,1],[1,2],[2,1]],
  [[0,0],[0,1],[0,2],[1,0],[2,0]],
]

function normaliser(forme: number[][]) {
  const minR = Math.min(...forme.map(c => c[0]))
  const minC = Math.min(...forme.map(c => c[1]))
  const decalee = forme.map(([r,c]) => [r-minR, c-minC])
  return decalee.sort((a,b) => a[0]-b[0] || a[1]-b[1])
}

function formeAleatoire() {
  const forme = normaliser(FORMES[Math.floor(Math.random()*FORMES.length)])
  const couleur = COULEURS[Math.floor(Math.random()*COULEURS.length)]
  return { forme, couleur, id: Math.random().toString(36).slice(2) }
}

function nouvellesPieces() {
  return [formeAleatoire(), formeAleatoire(), formeAleatoire()]
}

function peutPlacer(forme: number[][], board: (string|null)[][], baseR: number, baseC: number) {
  for (const [dr,dc] of forme) {
    const r = baseR+dr, c = baseC+dc
    if (r<0||r>=TAILLE||c<0||c>=TAILLE||board[r][c]) return false
  }
  return true
}

function pieceJouable(forme: number[][], board: (string|null)[][]) {
  for (let r=0;r<TAILLE;r++) for (let c=0;c<TAILLE;c++) if (peutPlacer(forme, board, r, c)) return true
  return false
}

function vibrer(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}

export default function BlockBlast() {
  const router = useRouter()
  const [board, setBoard] = useState<(string|null)[][]>(() => Array(TAILLE).fill(null).map(() => Array(TAILLE).fill(null)))
  const [pieces, setPieces] = useState<any[]>(() => nouvellesPieces())
  const [selection, setSelection] = useState<number|null>(null)
  const [score, setScore] = useState(0)
  const [meilleur, setMeilleur] = useState(0)
  const [survole, setSurvole] = useState<{r:number,c:number}|null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [secousse, setSecousse] = useState(false)
  const [clignotants, setClignotants] = useState<Set<string>>(new Set())
  const [popups, setPopups] = useState<{id:string,texte:string,x:number,y:number,couleur:string}[]>([])
  const [combo, setCombo] = useState<string|null>(null)
  const [dernierPose, setDernierPose] = useState<Set<string>>(new Set())
  const enCoursRef = useRef(false)

  useEffect(() => {
    const m = localStorage.getItem('blockblast_meilleur')
    if (m) setMeilleur(parseInt(m))
  }, [])

  function ajouterPopup(texte: string, x: number, y: number, couleur: string) {
    const id = Math.random().toString(36).slice(2)
    setPopups(p => [...p, { id, texte, x, y, couleur }])
    setTimeout(() => setPopups(p => p.filter(pp => pp.id !== id)), 800)
  }

  function verifierGameOver(piecesActuelles: any[], b: (string|null)[][]) {
    const restantes = piecesActuelles.filter(p => p !== null)
    if (restantes.length === 0) return false
    return !restantes.some(p => pieceJouable(p.forme, b))
  }

  function placer(rClic: number, cClic: number) {
    if (selection === null || gameOver || enCoursRef.current) return
    const piece = pieces[selection]
    if (!piece) return
    const [ancreR, ancreC] = piece.forme[0]
    const r = rClic - ancreR
    const c = cClic - ancreC
    if (!peutPlacer(piece.forme, board, r, c)) {
      setSecousse(true)
      vibrer(15)
      setTimeout(() => setSecousse(false), 300)
      return
    }

    enCoursRef.current = true
    vibrer(12)

    const nb = board.map(row => [...row])
    const posees = new Set<string>()
    for (const [dr,dc] of piece.forme) { nb[r+dr][c+dc] = piece.couleur; posees.add((r+dr)+'-'+(c+dc)) }
    setBoard(nb)
    setDernierPose(posees)
    setTimeout(() => setDernierPose(new Set()), 250)

    const lignesCompletes: number[] = []
    const colonnesCompletes: number[] = []
    for (let i=0;i<TAILLE;i++) {
      if (nb[i].every(cell => cell)) lignesCompletes.push(i)
      if (nb.every(row => row[i])) colonnesCompletes.push(i)
    }

    const nbCellules = piece.forme.length
    const nouvellesPiecesArr = pieces.map((p,i) => i === selection ? null : p)
    const toutesUtilisees = nouvellesPiecesArr.every(p => p === null)
    const piecesFinales = toutesUtilisees ? nouvellesPieces() : nouvellesPiecesArr

    ajouterPopup('+'+nbCellules, c*12.5+6, r*12.5+6, '#fff')

    if (lignesCompletes.length + colonnesCompletes.length > 0) {
      const aClignoter = new Set<string>()
      lignesCompletes.forEach(i => { for (let c2=0;c2<TAILLE;c2++) aClignoter.add(i+'-'+c2) })
      colonnesCompletes.forEach(i => { for (let r2=0;r2<TAILLE;r2++) aClignoter.add(r2+'-'+i) })
      setClignotants(aClignoter)
      vibrer([20,40,20,40,20])

      const nbLignesEffacees = lignesCompletes.length + colonnesCompletes.length
      const bonus = nbLignesEffacees * TAILLE * 10 * nbLignesEffacees
      if (nbLignesEffacees > 1) {
        setCombo(nbLignesEffacees+'x COMBO !')
        setTimeout(() => setCombo(null), 1000)
      }

      setTimeout(() => {
        const nb2 = nb.map(row => [...row])
        lignesCompletes.forEach(i => { for (let c2=0;c2<TAILLE;c2++) nb2[i][c2] = null })
        colonnesCompletes.forEach(i => { for (let r2=0;r2<TAILLE;r2++) nb2[r2][i] = null })
        setBoard(nb2)
        setClignotants(new Set())
        const nouveauScore = score + nbCellules + bonus
        setScore(nouveauScore)
        ajouterPopup('+'+bonus, 45, 40, '#D4A843')
        if (nouveauScore > meilleur) { setMeilleur(nouveauScore); localStorage.setItem('blockblast_meilleur', String(nouveauScore)) }
        setPieces(piecesFinales)
        setSelection(null)
        setSurvole(null)
        enCoursRef.current = false
        if (verifierGameOver(piecesFinales, nb2)) { setGameOver(true); vibrer([50,30,50,30,80]) }
      }, 260)
    } else {
      const nouveauScore = score + nbCellules
      setScore(nouveauScore)
      if (nouveauScore > meilleur) { setMeilleur(nouveauScore); localStorage.setItem('blockblast_meilleur', String(nouveauScore)) }
      setPieces(piecesFinales)
      setSelection(null)
      setSurvole(null)
      enCoursRef.current = false
      if (verifierGameOver(piecesFinales, nb)) { setGameOver(true); vibrer([50,30,50,30,80]) }
    }
  }

  function recommencer() {
    setBoard(Array(TAILLE).fill(null).map(() => Array(TAILLE).fill(null)))
    setPieces(nouvellesPieces())
    setSelection(null)
    setScore(0)
    setGameOver(false)
  }

  const pieceSelectionnee = selection !== null ? pieces[selection] : null

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 16px',display:'flex',flexDirection:'column',alignItems:'center',position:'relative',overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%',maxWidth:'420px',marginBottom:'16px'}}>
        <button onClick={() => router.push('/jeux')} style={{color:'rgba(255,255,255,0.6)',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
        <span style={{color:'#fff',fontWeight:'500',fontSize:'15px'}}>Block Blast</span>
        <div style={{width:'32px'}}></div>
      </div>

      <div style={{display:'flex',gap:'10px',width:'100%',maxWidth:'420px',marginBottom:'16px'}}>
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
        {selection !== null ? '👆 Touche une case pour poser la pièce' : '👇 Touche une pièce pour la sélectionner'}
      </div>

      <div style={{position:'relative',width:'100%',maxWidth:'380px'}}>
        {combo && (
          <div style={{position:'absolute',top:'40%',left:'50%',transform:'translate(-50%,-50%)',zIndex:50,background:'linear-gradient(135deg,#D4A843,#F97316)',color:'#fff',padding:'10px 22px',borderRadius:'99px',fontSize:'16px',fontWeight:'700',boxShadow:'0 8px 24px rgba(212,168,67,0.5)',animation:'popIn 0.3s ease'}}>
            {combo}
          </div>
        )}
        {popups.map(p => (
          <div key={p.id} style={{position:'absolute',left:p.x+'%',top:p.y+'%',color:p.couleur,fontWeight:'700',fontSize:'15px',zIndex:40,animation:'flotter 0.8s ease forwards',textShadow:'0 2px 6px rgba(0,0,0,0.4)',pointerEvents:'none'}}>
            {p.texte}
          </div>
        ))}
        <div style={{
          display:'grid',gridTemplateColumns:`repeat(${TAILLE}, 1fr)`,gap:'3px',
          width:'100%',aspectRatio:'1',background:'rgba(255,255,255,0.06)',
          borderRadius:'14px',padding:'8px',marginBottom:'20px',
          animation: secousse ? 'shake 0.3s' : 'none'
        }}>
          {board.map((row, r) => row.map((cell, c) => {
            const cle = r+'-'+c
            let estSurvole = false
            if (pieceSelectionnee && survole) {
              const [ancreR, ancreC] = pieceSelectionnee.forme[0]
              const baseR = survole.r - ancreR
              const baseC = survole.c - ancreC
              estSurvole = peutPlacer(pieceSelectionnee.forme, board, baseR, baseC) &&
                pieceSelectionnee.forme.some(([dr,dc]: number[]) => baseR+dr===r && baseC+dc===c)
            }
            const clignote = clignotants.has(cle)
            const vientDetrePosee = dernierPose.has(cle)
            return (
              <div key={cle}
                onClick={() => selection !== null && placer(r, c)}
                onMouseEnter={() => setSurvole({r,c})}
                style={{
                  aspectRatio:'1',borderRadius:'5px',
                  background: clignote ? '#fff' : (cell || (estSurvole ? pieceSelectionnee.couleur+'88' : 'rgba(255,255,255,0.06)')),
                  boxShadow: clignote ? '0 0 14px 3px rgba(255,255,255,0.9)' : cell ? '0 1px 3px rgba(0,0,0,0.3) inset' : 'none',
                  cursor: selection !== null ? 'pointer' : 'default',
                  transition: clignote ? 'none' : 'background 0.15s',
                  transform: vientDetrePosee ? 'scale(1)' : undefined,
                  animation: vientDetrePosee ? 'popIn 0.22s ease' : 'none',
                  touchAction:'manipulation', WebkitTapHighlightColor:'transparent'
                }}>
              </div>
            )
          }))}
        </div>
      </div>

      <div style={{display:'flex',gap:'12px',width:'100%',maxWidth:'380px',justifyContent:'center'}}>
        {pieces.map((piece, i) => {
          if (!piece) return <div key={i} style={{width:'90px',height:'90px'}}></div>
          const maxR = Math.max(...piece.forme.map((c:number[]) => c[0]))+1
          const maxC = Math.max(...piece.forme.map((c:number[]) => c[1]))+1
          const taille = Math.max(maxR, maxC)
          const cellPx = Math.min(22, 84/taille)
          return (
            <button key={piece.id} type="button" onClick={() => { setSelection(selection === i ? null : i); vibrer(8) }}
              style={{
                width:'90px',height:'90px',borderRadius:'14px',border:'none',cursor:'pointer',
                background: selection === i ? 'rgba(43,127,255,0.25)' : 'rgba(255,255,255,0.06)',
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow: selection === i ? '0 0 0 2px #2B7FFF' : 'none',
                transition:'transform 0.15s',
                transform: selection === i ? 'scale(1.05)' : 'scale(1)',
                touchAction:'manipulation', WebkitTapHighlightColor:'transparent'
              }}>
              <div style={{position:'relative',width: maxC*cellPx, height: maxR*cellPx}}>
                {piece.forme.map(([dr,dc]: number[], idx: number) => (
                  <div key={idx} style={{
                    position:'absolute',left:dc*cellPx,top:dr*cellPx,
                    width:cellPx-2,height:cellPx-2,borderRadius:'3px',background:piece.couleur,
                    boxShadow:'0 1px 3px rgba(0,0,0,0.3)'
                  }}></div>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {gameOver && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2000,padding:'20px'}}>
          <div style={{background:'#fff',borderRadius:'20px',padding:'28px',textAlign:'center',maxWidth:'320px',width:'100%',animation:'popIn 0.3s ease'}}>
            <div style={{fontSize:'40px',marginBottom:'8px'}}>🎮</div>
            <div style={{fontSize:'18px',fontWeight:'600',color:'#1a1a2e',marginBottom:'4px'}}>Partie terminée</div>
            <div style={{fontSize:'13px',color:'#aaa',marginBottom:'16px'}}>Plus aucune pièce ne peut être placée</div>
            <div style={{fontSize:'32px',fontWeight:'700',color:'#2B7FFF',marginBottom:'4px'}}>{score}</div>
            {score >= meilleur && score > 0 && <div style={{fontSize:'12px',color:'#D4A843',fontWeight:'500',marginBottom:'16px'}}>🏆 Nouveau record !</div>}
            <button onClick={recommencer} style={{width:'100%',background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'12px',padding:'14px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>
              Rejouer
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0.5; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes flotter {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-30px); opacity: 0; }
        }
      `}</style>
    </main>
  )
}
