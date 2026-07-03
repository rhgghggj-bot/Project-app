'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const COLS = 7
const ROWS = 6
const vide = Array(ROWS).fill(null).map(() => Array(COLS).fill(0))

function verifierGagnant(grille: number[][]): number {
  const check = (r: number, c: number, dr: number, dc: number, j: number) => {
    for (let i = 0; i < 4; i++) {
      const nr = r + dr*i, nc = c + dc*i
      if (nr<0||nr>=ROWS||nc<0||nc>=COLS||grille[nr][nc]!==j) return false
    }
    return true
  }
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) for (const j of [1,2])
    for (const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]])
      if (check(r,c,dr,dc,j)) return j
  return 0
}

export default function Puissance4() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profils, setProfils] = useState<any>({})
  const [membres, setMembres] = useState<any[]>([])
  const [partie, setPartie] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: mb } = await supabase.from('membres_groupe').select('*').eq('groupe_id', params.id)
      setMembres(mb || [])
      if (mb && mb.length > 0) {
        const ids = mb.map((m: any) => m.user_id)
        const { data: profs } = await supabase.from('profiles').select('id,nom').in('id', ids)
        const map: any = {}
        profs?.forEach((p: any) => { map[p.id] = p })
        setProfils(map)
      }
      const { data: p } = await supabase.from('jeux_groupe')
        .select('*').eq('groupe_id', params.id).eq('type','puissance4')
        .is('gagnant', null).order('created_at', { ascending: false }).limit(1)
      if (p && p.length > 0) setPartie(p[0])
      setLoading(false)

      channelRef.current = supabase
        .channel('puissance4-' + params.id)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jeux_groupe', filter: 'groupe_id=eq.' + params.id }, (payload) => {
          setPartie(payload.new)
        })
        .subscribe()

      return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
    }
    init()
  }, [])

  async function nouvellePartie(adversaireId: string) {
    const { data } = await supabase.from('jeux_groupe').insert({
      groupe_id: params.id,
      type: 'puissance4',
      etat: { grille: vide },
      joueur1_id: user.id,
      joueur2_id: adversaireId,
      tour: user.id
    }).select().single()
    setPartie(data)
  }

  async function jouer(col: number) {
    if (!partie || partie.tour !== user.id) return
    const grille = partie.etat.grille.map((r: number[]) => [...r])
    let row = -1
    for (let r = ROWS-1; r >= 0; r--) {
      if (grille[r][col] === 0) { row = r; break }
    }
    if (row === -1) return
    const joueurNum = partie.joueur1_id === user.id ? 1 : 2
    grille[row][col] = joueurNum
    const gagnant = verifierGagnant(grille)
    const prochainTour = partie.tour === partie.joueur1_id ? partie.joueur2_id : partie.joueur1_id
    await supabase.from('jeux_groupe').update({
      etat: { grille },
      tour: gagnant ? partie.tour : prochainTour,
      gagnant: gagnant ? partie.tour : null,
      updated_at: new Date().toISOString()
    }).eq('id', partie.id)
  }

  async function abandonner() {
    if (!partie) return
    await supabase.from('jeux_groupe').update({ gagnant: partie.tour === partie.joueur1_id ? partie.joueur2_id : partie.joueur1_id }).eq('id', partie.id)
  }

  const estMonTour = partie?.tour === user?.id
  const grille = partie?.etat?.grille || vide
  const gagnantId = partie?.gagnant
  const nomJoueur = (id: string) => profils[id]?.nom || 'Joueur'

  if (loading) return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg,#1a1a2e,#16213e)',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#fff'}}>Chargement...</div>
    </main>
  )

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg,#1a1a2e,#16213e)',padding:'20px 18px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
        <button onClick={() => router.back()} style={{color:'rgba(255,255,255,0.6)',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
        <span style={{color:'#fff',fontWeight:'500',fontSize:'15px'}}>Puissance 4</span>
        <div style={{width:'32px'}}></div>
      </div>

      {!partie && (
        <div>
          <div style={{color:'#fff',fontWeight:'500',fontSize:'15px',marginBottom:'14px',textAlign:'center'}}>Choisir un adversaire</div>
          {membres.filter((m: any) => m.user_id !== user?.id).map((m: any) => (
            <button key={m.user_id} onClick={() => nouvellePartie(m.user_id)}
              style={{width:'100%',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'16px',padding:'16px',marginBottom:'10px',display:'flex',alignItems:'center',gap:'12px',cursor:'pointer'}}>
              <div style={{width:'44px',height:'44px',borderRadius:'50%',background:'linear-gradient(135deg,#2B7FFF,#87CEEB)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:'500',fontSize:'18px'}}>
                {(profils[m.user_id]?.nom || '?')[0].toUpperCase()}
              </div>
              <span style={{color:'#fff',fontSize:'15px',fontWeight:'500'}}>{profils[m.user_id]?.nom || 'Membre'}</span>
              <span style={{marginLeft:'auto',color:'rgba(255,255,255,0.5)',fontSize:'13px'}}>Défier →</span>
            </button>
          ))}
          {membres.filter((m: any) => m.user_id !== user?.id).length === 0 && (
            <div style={{textAlign:'center',color:'rgba(255,255,255,0.5)',fontSize:'14px',padding:'32px 0'}}>
              Aucun autre membre dans ce groupe
            </div>
          )}
        </div>
      )}

      {partie && (
        <div>
          <div style={{display:'flex',justifyContent:'center',gap:'12px',marginBottom:'16px'}}>
            <div style={{background: partie.joueur1_id === user?.id ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.08)',border:`1px solid ${partie.joueur1_id === user?.id ? 'rgba(255,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`,borderRadius:'12px',padding:'10px 16px',textAlign:'center'}}>
              <div style={{width:'20px',height:'20px',borderRadius:'50%',background:'#FF4444',marginBottom:'4px'}}></div>
              <div style={{color:'#fff',fontSize:'12px',fontWeight:'500'}}>{nomJoueur(partie.joueur1_id)}</div>
            </div>
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:'20px',display:'flex',alignItems:'center'}}>VS</div>
            <div style={{background: partie.joueur2_id === user?.id ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.08)',border:`1px solid ${partie.joueur2_id === user?.id ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.15)'}`,borderRadius:'12px',padding:'10px 16px',textAlign:'center'}}>
              <div style={{width:'20px',height:'20px',borderRadius:'50%',background:'#FFD700',marginBottom:'4px'}}></div>
              <div style={{color:'#fff',fontSize:'12px',fontWeight:'500'}}>{nomJoueur(partie.joueur2_id)}</div>
            </div>
          </div>

          {gagnantId ? (
            <div style={{background:'rgba(212,168,67,0.2)',border:'1px solid rgba(212,168,67,0.5)',borderRadius:'14px',padding:'14px',textAlign:'center',marginBottom:'16px'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>{gagnantId === user?.id ? '★' : '—'}</div>
              <div style={{color:'#D4A843',fontWeight:'500',fontSize:'15px'}}>{gagnantId === user?.id ? 'Tu as gagné !' : nomJoueur(gagnantId) + ' a gagné !'}</div>
              <button onClick={() => setPartie(null)} style={{background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'10px',padding:'8px 20px',fontSize:'13px',cursor:'pointer',marginTop:'12px',fontWeight:'500'}}>
                Nouvelle partie
              </button>
            </div>
          ) : (
            <div style={{background: estMonTour ? 'rgba(43,127,255,0.2)' : 'rgba(255,255,255,0.08)',border:`1px solid ${estMonTour ? 'rgba(43,127,255,0.4)' : 'rgba(255,255,255,0.1)'}`,borderRadius:'10px',padding:'8px',textAlign:'center',marginBottom:'12px'}}>
              <span style={{color: estMonTour ? '#87CEEB' : 'rgba(255,255,255,0.5)',fontSize:'13px',fontWeight:'500'}}>
                {estMonTour ? '👆 Ton tour !' : '⏳ Tour de ' + nomJoueur(partie.tour)}
              </span>
            </div>
          )}

          <div style={{background:'rgba(43,127,255,0.7)',borderRadius:'16px',padding:'10px',marginBottom:'12px'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'5px'}}>
              {grille.map((row: number[], r: number) =>
                row.map((cell: number, c: number) => (
                  <div key={r+'-'+c} style={{aspectRatio:'1',borderRadius:'50%',background: cell===1 ? '#FF4444' : cell===2 ? '#FFD700' : 'rgba(0,0,40,0.6)',boxShadow: cell===1 ? '0 0 8px rgba(255,68,68,0.6)' : cell===2 ? '0 0 8px rgba(255,215,0,0.6)' : 'none',transition:'background 0.2s'}}></div>
                ))
              )}
            </div>
          </div>

          {!gagnantId && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'5px',marginBottom:'16px'}}>
              {Array(COLS).fill(0).map((_,c) => (
                <button key={c} onClick={() => jouer(c)} disabled={!estMonTour}
                  style={{background: estMonTour ? 'rgba(43,127,255,0.3)' : 'rgba(255,255,255,0.05)',border:`1px solid ${estMonTour ? 'rgba(43,127,255,0.5)' : 'rgba(255,255,255,0.1)'}`,borderRadius:'8px',padding:'8px 0',color: estMonTour ? '#87CEEB' : 'rgba(255,255,255,0.2)',fontSize:'16px',cursor: estMonTour ? 'pointer' : 'not-allowed'}}>
                  ↓
                </button>
              ))}
            </div>
          )}

          <button onClick={abandonner} style={{width:'100%',background:'rgba(244,63,94,0.15)',border:'1px solid rgba(244,63,94,0.3)',color:'#F43F5E',borderRadius:'12px',padding:'10px',fontSize:'13px',cursor:'pointer'}}>
            Abandonner
          </button>
        </div>
      )}
    </main>
  )
}
