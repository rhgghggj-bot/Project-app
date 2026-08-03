'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const JEUX = [
  { id: 'blockblast', nom: 'Block Blast', desc: 'Place les blocs, complète les lignes', couleur: '#F97316', icone: 'blocks' },
  { id: '2048', nom: '2048', desc: 'Fusionne les nombres jusqu\'à 2048', couleur: '#2B7FFF', icone: 'grid' },
  { id: 'snake', nom: 'Snake', desc: 'Mange, grandis, ne te mords pas', couleur: '#10B981', icone: 'snake' },
  { id: 'memory', nom: 'Memory', desc: 'Retrouve toutes les paires', couleur: '#8B5CF6', icone: 'cards' },
  { id: 'puissance4', nom: 'Puissance 4', desc: 'Défie un membre d\'un groupe', couleur: '#F43F5E', icone: 'connect4' },
  { id: 'quiz', nom: 'Quiz', desc: 'Crée ou joue un quiz de groupe', couleur: '#D4A843', icone: 'quiz' },
  { id: 'stacktower', nom: 'Stack Tower', desc: 'Empile les blocs sans déborder', couleur: '#EC4899', icone: 'stack' },
  { id: 'reflexes', nom: 'Réflexes', desc: 'Teste ton temps de réaction', couleur: '#10B981', icone: 'bolt' },
  { id: 'cassebriques', nom: 'Casse-briques', desc: 'Détruis toutes les briques', couleur: '#2B7FFF', icone: 'breakout' },
]

function Icone({ type, couleur }: { type: string, couleur: string }) {
  const props = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: couleur, strokeWidth: 2 } as any
  if (type === 'blocks') return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  if (type === 'grid') return <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
  if (type === 'snake') return <svg {...props}><path d="M4 6c0-1.5 1.5-2 3-2s3 .5 3 2-1.5 2-3 2H5c-1.5 0-3 .5-3 2s1.5 2 3 2h9c1.5 0 3 .5 3 2s-1.5 2-3 2h-2"/><circle cx="19" cy="16" r="1"/></svg>
  if (type === 'connect4') return <svg {...props}><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="7" cy="9" r="1.6" fill={couleur}/><circle cx="12" cy="9" r="1.6" fill={couleur}/><circle cx="17" cy="9" r="1.6" fill={couleur}/><circle cx="7" cy="15" r="1.6" fill={couleur}/><circle cx="12" cy="15" r="1.6" fill={couleur}/></svg>
  if (type === 'quiz') return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  if (type === 'stack') return <svg {...props}><rect x="4" y="4" width="16" height="4" rx="1"/><rect x="7" y="10" width="10" height="4" rx="1"/><rect x="5" y="16" width="14" height="4" rx="1"/></svg>
  if (type === 'bolt') return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  if (type === 'breakout') return <svg {...props}><rect x="3" y="4" width="5" height="3"/><rect x="9" y="4" width="5" height="3"/><rect x="15" y="4" width="5" height="3"/><rect x="6" y="9" width="5" height="3"/><rect x="12" y="9" width="5" height="3"/><circle cx="12" cy="15" r="1.5" fill={couleur}/><rect x="8" y="20" width="8" height="2" rx="1"/></svg>
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
    m.memory = parseInt(localStorage.getItem('memory_meilleur_facile') || '0')
    m.stacktower = parseInt(localStorage.getItem('stacktower_meilleur') || '0')
    m.cassebriques = parseInt(localStorage.getItem('cassebriques_meilleur') || '0')
    const r = localStorage.getItem('reflexes_meilleur')
    m.reflexes = r ? parseInt(r) : 0
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

    </main>
  )
}
