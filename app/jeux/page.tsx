'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const JEUX = [
  { id: 'blockblast', nom: 'Block Blast', desc: 'Place les blocs, complète les lignes', couleur: '#F97316', icone: 'blocks' },
  { id: '2048', nom: '2048', desc: 'Fusionne les nombres jusqu\'à 2048', couleur: '#2B7FFF', icone: 'grid' },
  { id: 'snake', nom: 'Snake', desc: 'Mange, grandis, ne te mords pas', couleur: '#10B981', icone: 'snake' },
  { id: 'memory', nom: 'Memory', desc: 'Retrouve toutes les paires', couleur: '#8B5CF6', icone: 'cards' },
]

function Icone({ type, couleur }: { type: string, couleur: string }) {
  const props = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: couleur, strokeWidth: 2 } as any
  if (type === 'blocks') return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  if (type === 'grid') return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
  if (type === 'snake') return <svg {...props}><path d="M4 6c0-1.5 1.5-2 3-2s3 .5 3 2-1.5 2-3 2H5c-1.5 0-3 .5-3 2s1.5 2 3 2h9c1.5 0 3 .5 3 2s-1.5 2-3 2h-2"/><circle cx="19" cy="16" r="1"/></svg>
  return <svg {...props}><rect x="2" y="7" width="8" height="12" rx="1.5"/><rect x="14" y="7" width="8" height="12" rx="1.5"/><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></svg>
}

export default function JeuxHub() {
  const router = useRouter()
  const [meilleurs, setMeilleurs] = useState<any>({})

  useEffect(() => {
    const m: any = {}
    m.blockblast = parseInt(localStorage.getItem('blockblast_meilleur') || '0')
    m['2048'] = parseInt(localStorage.getItem('jeu2048_meilleur') || '0')
    m.snake = parseInt(localStorage.getItem('snake_meilleur') || '0')
    m.memory = parseInt(localStorage.getItem('memory_meilleur') || '0')
    setMeilleurs(m)
  }, [])

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',padding:'20px 18px 28px'}}>
        <a href="/" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'8px'}}>← Accueil</a>
        <div style={{fontSize:'22px',fontWeight:'600',color:'#fff'}}>Jeux</div>
        <div style={{fontSize:'13px',color:'rgba(255,255,255,0.5)',marginTop:'2px'}}>Détends-toi, seul ou en famille</div>
      </div>

      <div style={{padding:'16px 14px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
        {JEUX.map(j => (
          <button key={j.id} onClick={() => router.push('/jeux/'+j.id)}
            style={{textAlign:'left',background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'20px',padding:'16px',cursor:'pointer',boxShadow:'0 4px 20px rgba(43,127,255,0.06)'}}>
            <div style={{width:'48px',height:'48px',borderRadius:'14px',background:j.couleur+'18',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'12px'}}>
              <Icone type={j.icone} couleur={j.couleur} />
            </div>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#1a1a2e',marginBottom:'3px'}}>{j.nom}</div>
            <div style={{fontSize:'11px',color:'#aaa',lineHeight:'1.4',marginBottom:'10px'}}>{j.desc}</div>
            {meilleurs[j.id] > 0 && (
              <div style={{fontSize:'11px',color:j.couleur,fontWeight:'600',display:'flex',alignItems:'center',gap:'4px'}}>
                🏆 {meilleurs[j.id]}
              </div>
            )}
          </button>
        ))}
      </div>

      <div style={{padding:'0 18px 24px'}}>
        <div style={{background:'#F8FBFF',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'14px',display:'flex',alignItems:'center',gap:'10px'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2" style={{flexShrink:0}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <div style={{fontSize:'12px',color:'#666'}}>Tu cherches à défier quelqu'un ? Puissance 4 et Quiz sont dans le menu de chaque groupe.</div>
        </div>
      </div>
    </main>
  )
}
