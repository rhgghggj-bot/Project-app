"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const JOURS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]

export default function Home() {
  const [projets, setProjets] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [evenements, setEvenements] = useState<any[]>([])
  const [depenses, setDepenses] = useState<any[]>([])
  const [revenus, setRevenus] = useState<any[]>([])

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: p } = await supabase.from("projets").select("*").is("groupe_id", null).eq("prive", false).order("created_at", { ascending: false })
      setProjets(p || [])
      if (user) {
        const { data: e } = await supabase.from("evenements_calendrier").select("*").eq("user_id", user.id)
        setEvenements(e || [])
        const { data: d } = await supabase.from("depenses").select("*").eq("user_id", user.id)
        setDepenses(d || [])
        const { data: r } = await supabase.from("revenus").select("*").eq("user_id", user.id)
        setRevenus(r || [])
      }
    }
    charger()
  }, [])

  const today = new Date()
  const getLundi = () => {
    const d = new Date(today)
    const day = d.getDay() || 7
    d.setDate(d.getDate() - day + 1)
    d.setHours(0,0,0,0)
    return d
  }
  const lundi = getLundi()
  const jours = Array.from({length:7}, (_, i) => {
    const d = new Date(lundi)
    d.setDate(lundi.getDate() + i)
    return d
  })
  const evtDuJour = (date: Date) => evenements.filter(e => new Date(e.date).toDateString() === date.toDateString())

  const moisActuel = today.getMonth()
  const anneeActuelle = today.getFullYear()
  const totalDep = depenses.filter(d => { const dt = new Date(d.date); return dt.getMonth() === moisActuel && dt.getFullYear() === anneeActuelle }).reduce((s,d) => s + parseFloat(d.montant), 0)
  const totalRev = revenus.filter(r => { const dt = new Date(r.date); return dt.getMonth() === moisActuel && dt.getFullYear() === anneeActuelle }).reduce((s,r) => s + parseFloat(r.montant), 0)
  const solde = totalRev - totalDep
  const prochainEvt = evenements.filter(e => new Date(e.date) >= today).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  return (
    <main style={{paddingBottom:'80px'}} className="min-h-screen bg-white">

      {user ? (
        <div style={{background:'linear-gradient(160deg,#0A1628 0%,#1a3a6e 50%,#2B7FFF 100%)',padding:'20px 18px 32px',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:'-40px',right:'-40px',width:'180px',height:'180px',borderRadius:'50%',background:'rgba(43,127,255,0.15)'}}></div>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginBottom:'4px'}}>{today.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
          <div style={{fontSize:'22px',fontWeight:'500',color:'#fff',marginBottom:'6px'}}>Bonjour 👋</div>
          <div style={{display:'flex',gap:'12px'}}>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.7)'}}><span style={{color:'#4ade80',fontWeight:'500'}}>{totalRev.toFixed(0)} CHF</span></div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.7)'}}>📉 <span style={{color:'#F43F5E',fontWeight:'500'}}>{totalDep.toFixed(0)} CHF</span></div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.7)'}}>Solde : <span style={{color: solde >= 0 ? '#4ade80' : '#F43F5E',fontWeight:'500'}}>{solde >= 0 ? '+' : ''}{solde.toFixed(0)} CHF</span></div>
          </div>
        </div>
      ) : (
        <div style={{padding:'28px 18px',background:'linear-gradient(135deg,#EEF5FF,#FDF8EC)',borderBottom:'0.5px solid #E8F1FF'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'#FDF8EC',color:'#D4A843',fontSize:'11px',fontWeight:'500',padding:'4px 10px',borderRadius:'99px',border:'1px solid #F0D88A',marginBottom:'12px'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg> Réseau de projets</div>
          <h1 style={{fontSize:'22px',fontWeight:'500',color:'#1a1a2e',lineHeight:'1.3',marginBottom:'6px'}}>Lancez vos projets,<br/><span style={{color:'#2B7FFF'}}>trouvez votre soutien</span></h1>
          <p style={{fontSize:'13px',color:'#aaa',marginBottom:'16px',lineHeight:'1.6'}}>Partagez votre projet avec votre groupe et recevez conseils et dons directement.</p>
          <div style={{display:'flex',gap:'8px'}}>
            <a href="/nouveau-projet"><button style={{background:'#2B7FFF',color:'#fff',fontWeight:'500',fontSize:'13px',padding:'9px 18px',borderRadius:'99px',border:'none',cursor:'pointer'}}>Publier un projet</button></a>
            <a href="/groupes"><button style={{background:'#FDF8EC',color:'#D4A843',fontWeight:'500',fontSize:'13px',padding:'9px 18px',borderRadius:'99px',border:'1.5px solid #F0D88A',cursor:'pointer'}}>Rejoindre un groupe</button></a>
          </div>
        </div>
      )}

      {user && (
        <div style={{margin:'-16px 14px 0',borderRadius:'18px',padding:'14px',position:'relative',zIndex:2,background:'rgba(255,255,255,0.18)',backdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.35)',marginBottom:'4px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
            <span style={{fontSize:'13px',fontWeight:'500',color:'#fff'}}>Cette semaine</span>
            <a href="/semaine" style={{fontSize:'12px',color:'#a8d8f0',fontWeight:'500',textDecoration:'none'}}>Voir tout →</a>
          </div>
          <div style={{display:'flex',gap:'4px'}}>
            {jours.map((jour, i) => {
              const isToday = jour.toDateString() === today.toDateString()
              const evts = evtDuJour(jour)
              const hasEvts = evts.length > 0
              return (
                <a key={i} href="/semaine" style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',textDecoration:'none'}}>
                  <div style={{fontSize:'10px',color:'rgba(255,255,255,0.65)',fontWeight:'500'}}>{JOURS[i]}</div>
                  <div style={{width:'100%',minHeight: hasEvts ? '42px' : '32px',borderRadius:'8px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'3px',
                    background: isToday ? '#fff' : hasEvts ? 'rgba(255,255,255,0.15)' : 'transparent',
                    border: hasEvts && !isToday ? '1px solid rgba(255,255,255,0.35)' : 'none',
                    padding: hasEvts ? '3px 0' : '0'}}>
                    <span style={{fontSize:'12px',fontWeight:'600',color: isToday ? '#1e56a0' : 'rgba(255,255,255,0.85)'}}>
                      {jour.getDate()}
                    </span>
                    {hasEvts && (
                      <div style={{display:'flex',gap:'2px',alignItems:'center'}}>
                        {evts.slice(0,3).map((e:any,j:number) => (
                          <div key={j} style={{width:'5px',height:'5px',borderRadius:'50%',background:e.couleur,opacity:0.9}}></div>
                        ))}
                        {evts.length > 3 && (
                          <div style={{background:'rgba(255,255,255,0.3)',borderRadius:'3px',padding:'0 3px',fontSize:'7px',color:'#fff',fontWeight:'600'}}>+{evts.length-3}</div>
                        )}
                      </div>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {user && (
        <div style={{padding:'12px 14px 0'}}>
          <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
            <a href="/finances" style={{flex:1,textDecoration:'none'}}>
              <div style={{background:'rgba(255,255,255,0.18)',backdropFilter:'blur(20px)',borderRadius:'14px',padding:'12px',border:'1px solid rgba(255,255,255,0.35)'}}>
                <div style={{fontSize:'11px',color:'#a8d8f0',fontWeight:'500',marginBottom:'4px'}}>Finances</div>
                <div style={{fontSize:'18px',fontWeight:'500',color: solde >= 0 ? '#86efac' : '#fca5a5'}}>{solde >= 0 ? '+' : ''}{solde.toFixed(0)} CHF</div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.65)',marginTop:'2px'}}>Solde ce mois</div>
              </div>
            </a>
            <a href="/semaine" style={{flex:1,textDecoration:'none'}}>
              <div style={{background:'rgba(255,255,255,0.18)',backdropFilter:'blur(20px)',borderRadius:'14px',padding:'12px',border:'1px solid rgba(255,255,255,0.35)'}}>
                <div style={{fontSize:'11px',color:'#fcd34d',fontWeight:'500',marginBottom:'4px'}}>Prochain</div>
                <div style={{fontSize:'13px',fontWeight:'500',color:'#fff'}}>{prochainEvt?.titre || 'Aucun'}</div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.65)',marginTop:'2px'}}>{prochainEvt ? new Date(prochainEvt.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : 'Ajoute un événement'}</div>
              </div>
            </a>
          </div>
          <a href="/scanner" style={{textDecoration:'none',display:'block',marginBottom:'8px'}}>
            <div style={{background:'rgba(255,255,255,0.18)',backdropFilter:'blur(20px)',borderRadius:'14px',padding:'12px',display:'flex',alignItems:'center',gap:'12px',border:'1px solid rgba(255,255,255,0.35)'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.35)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><polyline points="4 7 4 4 7 4"/><polyline points="17 4 20 4 20 7"/><polyline points="20 17 20 20 17 20"/><polyline points="7 20 4 20 4 17"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
              </div>
              <div>
                <div style={{fontSize:'13px',fontWeight:'500',color:'#fff'}}>Scanner un document</div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.7)',marginTop:'2px'}}>Facture, relevé, contrat...</div>
              </div>
              <div style={{marginLeft:'auto',color:'rgba(255,255,255,0.7)',fontSize:'18px'}}>›</div>
            </div>
          </a>
        </div>
      )}

      <div style={{padding:'8px 18px 16px'}}>
        <div style={{fontSize:'11px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:'500',marginBottom:'12px'}}>Projets publics</div>

        {projets.length === 0 && (
          <div style={{textAlign:'center',padding:'40px 0',color:'#aaa'}}>
            <svg width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='1.5' style={{marginBottom:'12px'}}><path d='M22 2L11 13'/><path d='M22 2L15 22 11 13 2 9l20-7z'/></svg>
            <div style={{fontSize:'16px',fontWeight:'500',color:'#666',marginBottom:'8px'}}>Soyez les premiers !</div>
            <div style={{fontSize:'13px',marginBottom:'16px'}}>Aucun projet pour l'instant. Lance le tien !</div>
            <a href="/nouveau-projet">
              <button style={{background:'#2B7FFF',color:'#fff',fontWeight:'500',fontSize:'13px',padding:'10px 20px',borderRadius:'99px',border:'none',cursor:'pointer'}}>Publier mon projet</button>
            </a>
          </div>
        )}

        {projets.map((projet: any) => (
          <a key={projet.id} href={`/projet/${projet.id}`} style={{textDecoration:'none'}}>
            <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',overflow:'hidden',marginBottom:'12px',cursor:'pointer'}}>
              <div style={{height:'90px',background:'linear-gradient(135deg,#EEF5FF,#DCE9FF)',display:'flex',alignItems:'center',justifyContent:'center',}}><svg width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='rgba(43,127,255,0.5)' strokeWidth='1.5'><path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'/><circle cx='12' cy='10' r='3'/></svg></div>
              <div style={{padding:'12px 14px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'6px'}}>
                  <div style={{width:'20px',height:'20px',borderRadius:'50%',background:'#2B7FFF',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'10px',fontWeight:'500'}}>
                    {projet.titre?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <span style={{marginLeft:'auto',fontSize:'11px',background:'#EEF5FF',color:'#2B7FFF',padding:'2px 8px',borderRadius:'99px',fontWeight:'500'}}>{projet.categorie}</span>
                </div>
                <div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e',marginBottom:'4px'}}>{projet.titre}</div>
                <div style={{fontSize:'12px',color:'#aaa',marginBottom:'10px'}}>{projet.description}</div>
                <div style={{background:'#EEF5FF',borderRadius:'10px',padding:'8px 12px',marginBottom:'10px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                    <span style={{color:'#666'}}>Cagnotte</span>
                    <span style={{fontWeight:'500',color:'#2B7FFF'}}>0 CHF</span>
                  </div>
                  <div style={{height:'5px',background:'#DCE9FF',borderRadius:'99px'}}></div>
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:'8px',borderTop:'0.5px solid #E8F1FF'}}>
                  <div style={{display:'flex',gap:'10px'}}>
                    <span style={{fontSize:'12px',color:'#aaa',display:'flex',alignItems:'center',gap:'3px'}}><svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'/></svg> 0</span>
                    <span style={{fontSize:'12px',color:'#aaa',display:'flex',alignItems:'center',gap:'3px'}}><svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/></svg> 0</span>
                  </div>
                  <button style={{background:'#D4A843',color:'#fff',fontSize:'11px',fontWeight:'500',padding:'5px 12px',borderRadius:'99px',border:'none',cursor:'pointer'}}><span style={{display:"flex",alignItems:"center",gap:"4px"}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Soutenir</span></button>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}
