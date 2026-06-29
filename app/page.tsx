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
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.7)'}}>📈 <span style={{color:'#4ade80',fontWeight:'500'}}>{totalRev.toFixed(0)} CHF</span></div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.7)'}}>📉 <span style={{color:'#F43F5E',fontWeight:'500'}}>{totalDep.toFixed(0)} CHF</span></div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.7)'}}>Solde : <span style={{color: solde >= 0 ? '#4ade80' : '#F43F5E',fontWeight:'500'}}>{solde >= 0 ? '+' : ''}{solde.toFixed(0)} CHF</span></div>
          </div>
        </div>
      ) : (
        <div style={{padding:'28px 18px',background:'linear-gradient(135deg,#EEF5FF,#FDF8EC)',borderBottom:'0.5px solid #E8F1FF'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'#FDF8EC',color:'#D4A843',fontSize:'11px',fontWeight:'500',padding:'4px 10px',borderRadius:'99px',border:'1px solid #F0D88A',marginBottom:'12px'}}>✦ Réseau de projets</div>
          <h1 style={{fontSize:'22px',fontWeight:'500',color:'#1a1a2e',lineHeight:'1.3',marginBottom:'6px'}}>Lancez vos projets,<br/><span style={{color:'#2B7FFF'}}>trouvez votre soutien</span></h1>
          <p style={{fontSize:'13px',color:'#aaa',marginBottom:'16px',lineHeight:'1.6'}}>Partagez votre projet avec votre groupe et recevez conseils et dons directement.</p>
          <div style={{display:'flex',gap:'8px'}}>
            <a href="/nouveau-projet"><button style={{background:'#2B7FFF',color:'#fff',fontWeight:'500',fontSize:'13px',padding:'9px 18px',borderRadius:'99px',border:'none',cursor:'pointer'}}>Publier un projet</button></a>
            <a href="/groupes"><button style={{background:'#FDF8EC',color:'#D4A843',fontWeight:'500',fontSize:'13px',padding:'9px 18px',borderRadius:'99px',border:'1.5px solid #F0D88A',cursor:'pointer'}}>Rejoindre un groupe</button></a>
          </div>
        </div>
      )}

      {user && (
        <div style={{margin:'-16px 14px 0',borderRadius:'18px',padding:'14px',position:'relative',zIndex:2,background:'rgba(255,255,255,0.9)',backdropFilter:'blur(20px)',border:'0.5px solid rgba(255,255,255,0.9)',boxShadow:'0 4px 24px rgba(43,127,255,0.1)',marginBottom:'4px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
            <span style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>Cette semaine</span>
            <a href="/semaine" style={{fontSize:'12px',color:'#2B7FFF',fontWeight:'500',textDecoration:'none'}}>Voir tout →</a>
          </div>
          <div style={{display:'flex',gap:'4px'}}>
            {jours.map((jour, i) => {
              const isToday = jour.toDateString() === today.toDateString()
              const evts = evtDuJour(jour)
              return (
                <a key={i} href="/semaine" style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',textDecoration:'none'}}>
                  <div style={{fontSize:'10px',color:'#aaa',fontWeight:'500'}}>{JOURS[i]}</div>
                  <div style={{width:'28px',height:'28px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'500',
                    background: isToday ? '#2B7FFF' : 'transparent',
                    color: isToday ? '#fff' : '#1a1a2e'}}>
                    {jour.getDate()}
                  </div>
                  {evts.slice(0,1).map((e,j) => (
                    <div key={j} style={{width:'100%',borderRadius:'4px',padding:'2px 3px',fontSize:'8px',fontWeight:'500',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',background:`${e.couleur}22`,color:e.couleur}}>
                      {e.titre}
                    </div>
                  ))}
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
              <div style={{background:'linear-gradient(135deg,#EEF5FF,#DCE9FF)',borderRadius:'14px',padding:'12px',border:'0.5px solid #DCE9FF'}}>
                <div style={{fontSize:'11px',color:'#2B7FFF',fontWeight:'500',marginBottom:'4px'}}>💸 Finances</div>
                <div style={{fontSize:'18px',fontWeight:'500',color: solde >= 0 ? '#10B981' : '#F43F5E'}}>{solde >= 0 ? '+' : ''}{solde.toFixed(0)} CHF</div>
                <div style={{fontSize:'11px',color:'#aaa',marginTop:'2px'}}>Solde ce mois</div>
              </div>
            </a>
            <a href="/semaine" style={{flex:1,textDecoration:'none'}}>
              <div style={{background:'linear-gradient(135deg,#FDF8EC,#F0D88A33)',borderRadius:'14px',padding:'12px',border:'0.5px solid #F0D88A'}}>
                <div style={{fontSize:'11px',color:'#D4A843',fontWeight:'500',marginBottom:'4px'}}>📅 Prochain événement</div>
                <div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e'}}>{prochainEvt?.titre || 'Aucun'}</div>
                <div style={{fontSize:'11px',color:'#aaa',marginTop:'2px'}}>{prochainEvt ? new Date(prochainEvt.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : 'Ajoute un événement'}</div>
              </div>
            </a>
          </div>
          <a href="/scanner" style={{textDecoration:'none',display:'block',marginBottom:'8px'}}>
            <div style={{background:'linear-gradient(135deg,#1a1a2e,#2B7FFF)',borderRadius:'14px',padding:'12px',display:'flex',alignItems:'center',gap:'12px'}}>
              <div style={{fontSize:'28px'}}>📄</div>
              <div>
                <div style={{fontSize:'13px',fontWeight:'500',color:'#fff'}}>Scanner un document</div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.6)',marginTop:'2px'}}>Facture, relevé, contrat, assurance...</div>
              </div>
              <div style={{marginLeft:'auto',fontSize:'16px',color:'rgba(255,255,255,0.5)'}}>›</div>
            </div>
          </a>
        </div>
      )}

      <div style={{padding:'8px 18px 16px'}}>
        <div style={{fontSize:'11px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:'500',marginBottom:'12px'}}>Projets publics</div>

        {projets.length === 0 && (
          <div style={{textAlign:'center',padding:'40px 0',color:'#aaa'}}>
            <div style={{fontSize:'40px',marginBottom:'12px'}}>🚀</div>
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
              <div style={{height:'90px',background:'linear-gradient(135deg,#EEF5FF,#DCE9FF)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'36px'}}>📌</div>
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
                    <span style={{fontSize:'12px',color:'#aaa'}}>❤️ 0</span>
                    <span style={{fontSize:'12px',color:'#aaa'}}>💬 0</span>
                  </div>
                  <button style={{background:'#D4A843',color:'#fff',fontSize:'11px',fontWeight:'500',padding:'5px 12px',borderRadius:'99px',border:'none',cursor:'pointer'}}>✦ Soutenir</button>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}
