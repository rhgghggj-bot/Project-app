"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import NotificationBell from "./components/NotificationBell"

const JOURS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]

export default function Home() {
  const [projets, setProjets] = useState<any[]>([])
  const [categorie, setCategorie] = useState("Tous")
  const [user, setUser] = useState<any>(null)
  const [evenements, setEvenements] = useState<any[]>([])
  const [depenses, setDepenses] = useState<any[]>([])
  const [revenus, setRevenus] = useState<any[]>([])

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) {
        const vu = sessionStorage.getItem('onboardingVu')
        if (!vu) { sessionStorage.setItem('onboardingVu','1'); window.location.href='/onboarding'; return }
      }
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
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const nowMin = today.getHours() * 60 + today.getMinutes()
  const prochainEvt = evenements
    .filter(e => {
      if (e.date > todayStr) return true
      if (e.date === todayStr) {
        if (!e.heure) return true
        const [h, m] = e.heure.split(':').map(Number)
        const debut = h * 60 + m
        const fin = debut + (e.duree || 0)
        return fin > nowMin
      }
      return false
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      if (!a.heure && !b.heure) return 0
      if (!a.heure) return -1
      if (!b.heure) return 1
      return a.heure.localeCompare(b.heure)
    })[0]

  return (
    <main className="min-h-screen bg-white">

      {/* Zone bleue - header */}
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',padding:'20px 18px 20px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-40px',right:'-40px',width:'200px',height:'200px',borderRadius:'50%',background:'rgba(43,127,255,0.15)'}}></div>

        {!user && (
          <div style={{textAlign:'center',paddingBottom:'20px'}}>
            <div style={{fontSize:'22px',fontWeight:'500',color:'#fff',marginBottom:'8px'}}>Bienvenue sur Project</div>
            <p style={{fontSize:'14px',color:'rgba(255,255,255,0.6)',marginBottom:'24px'}}>Connecte-toi pour accéder à toutes les fonctionnalités</p>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <a href="/inscription" style={{textDecoration:'none'}}>
                <button style={{width:'100%',background:'#fff',color:'#1a3a6e',fontWeight:'500',fontSize:'15px',padding:'14px',borderRadius:'14px',border:'none',cursor:'pointer'}}>Créer mon compte</button>
              </a>
              <a href="/connexion" style={{textDecoration:'none'}}>
                <button style={{width:'100%',background:'transparent',color:'rgba(255,255,255,0.7)',fontWeight:'500',fontSize:'14px',padding:'13px',borderRadius:'14px',border:'0.5px solid rgba(255,255,255,0.3)',cursor:'pointer'}}>J'ai déjà un compte</button>
              </a>
              <a href="/onboarding" style={{textDecoration:'none'}}>
                <button style={{width:'100%',background:'transparent',color:'rgba(255,255,255,0.5)',fontSize:'13px',padding:'10px',borderRadius:'14px',border:'none',cursor:'pointer'}}>Voir les fonctionnalités →</button>
              </a>
            </div>
          </div>
        )}

        {user && (
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>
                {today.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
              </div>
              <NotificationBell />
            </div>
            <div style={{fontSize:'22px',fontWeight:'500',color:'#fff',marginBottom:'12px'}}>Bonjour</div>
            <div style={{display:'flex',gap:'12px'}}>
              <div style={{fontSize:'13px',color:'#86efac',fontWeight:'500'}}><span style={{color:'rgba(255,255,255,0.5)'}}>Rev. </span>{totalRev.toFixed(0)} CHF</div>
              <div style={{fontSize:'13px',color:'#fca5a5',fontWeight:'500'}}><span style={{color:'rgba(255,255,255,0.5)'}}>Dép. </span>{totalDep.toFixed(0)} CHF</div>
              <div style={{fontSize:'13px',color: solde >= 0 ? '#86efac' : '#fca5a5',fontWeight:'500'}}>Solde : {solde >= 0 ? '+' : ''}{solde.toFixed(0)} CHF</div>
            </div>
          </div>
        )}
      </div>

      {/* Zone gris clair - calendrier + cartes */}
      {user && (
        <div style={{background:'#f0f4ff',padding:'14px'}}>
          <div style={{borderRadius:'16px',padding:'14px',background:'rgba(15,45,92,0.85)',border:'1px solid rgba(255,255,255,0.15)',marginBottom:'10px'}}>
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
                    <div style={{fontSize:'10px',color:'rgba(255,255,255,0.5)',fontWeight:'500'}}>{JOURS[i]}</div>
                    <div style={{width:'100%',minHeight: hasEvts ? '42px' : '28px',borderRadius:'6px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'3px',
                      background: isToday ? '#fff' : hasEvts ? 'rgba(255,255,255,0.12)' : 'transparent',
                      border: hasEvts && !isToday ? '1px solid rgba(255,255,255,0.2)' : 'none',
                      padding: hasEvts ? '3px 0' : '0'}}>
                      <span style={{fontSize:'12px',fontWeight:'600',color: isToday ? '#1e56a0' : 'rgba(255,255,255,0.85)'}}>
                        {jour.getDate()}
                      </span>
                      {hasEvts && (
                        <div style={{display:'flex',gap:'2px',alignItems:'center'}}>
                          {evts.slice(0,3).map((e:any,j:number) => (
                            <div key={j} style={{width:'4px',height:'4px',borderRadius:'50%',background:e.couleur}}></div>
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

          <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
            <a href="/finances" style={{flex:1,textDecoration:'none'}}>
              <div style={{background:'rgba(15,45,92,0.85)',borderRadius:'14px',padding:'12px',border:'1px solid rgba(255,255,255,0.15)'}}>
                <div style={{fontSize:'11px',color:'#a8d8f0',fontWeight:'500',marginBottom:'4px'}}>Finances</div>
                <div style={{fontSize:'18px',fontWeight:'500',color: solde >= 0 ? '#86efac' : '#fca5a5'}}>{solde >= 0 ? '+' : ''}{solde.toFixed(0)} CHF</div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',marginTop:'2px'}}>Solde ce mois</div>
              </div>
            </a>
            <a href="/semaine" style={{flex:1,textDecoration:'none'}}>
              <div style={{background:'rgba(15,45,92,0.85)',borderRadius:'14px',padding:'12px',border:'1px solid rgba(255,255,255,0.15)'}}>
                <div style={{fontSize:'11px',color:'#fcd34d',fontWeight:'500',marginBottom:'4px'}}>Prochain</div>
                <div style={{fontSize:'13px',fontWeight:'500',color:'#fff'}}>{prochainEvt?.titre || 'Aucun'}</div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',marginTop:'2px'}}>{prochainEvt ? new Date(prochainEvt.date).toLocaleDateString('fr-FR',{day:'numeric',month:'short'}) : 'Ajoute un événement'}</div>
              </div>
            </a>
          </div>

          <a href="/scanner" style={{textDecoration:'none',display:'block'}}>
            <div style={{background:'rgba(15,45,92,0.85)',borderRadius:'14px',padding:'12px',display:'flex',alignItems:'center',gap:'12px',border:'1px solid rgba(255,255,255,0.15)'}}>
              <div style={{width:'38px',height:'38px',borderRadius:'10px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><polyline points="4 7 4 4 7 4"/><polyline points="17 4 20 4 20 7"/><polyline points="20 17 20 20 17 20"/><polyline points="7 20 4 20 4 17"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
              </div>
              <div>
                <div style={{fontSize:'13px',fontWeight:'500',color:'#fff'}}>Scanner un document</div>
                <div style={{fontSize:'11px',color:'rgba(255,255,255,0.6)',marginTop:'2px'}}>Facture, relevé, contrat...</div>
              </div>
              <div style={{marginLeft:'auto',color:'rgba(255,255,255,0.5)',fontSize:'18px'}}>›</div>
            </div>
          </a>
        </div>
      )}

      {/* Zone decouvrir */}
      <div style={{background:'#fff'}}>
        <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',padding:'16px 14px 20px'}}>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',marginBottom:'4px'}}>Réseau Project</div>
          <div style={{fontSize:'20px',fontWeight:'500',color:'#fff',marginBottom:'12px'}}>Découvrir</div>
          <div style={{display:'flex',gap:'8px',overflowX:'auto',paddingBottom:'4px'}}>
            {['Tous','Tech','Business','Art','Sport','Education','Sante','Autre'].map(cat => (
              <button key={cat} onClick={() => setCategorie(cat)}
                style={{whiteSpace:'nowrap',padding:'6px 14px',borderRadius:'99px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'500',
                  background: categorie === cat ? '#fff' : 'rgba(255,255,255,0.15)',
                  color: categorie === cat ? '#1a3a6e' : '#fff'}}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{padding:'16px 14px'}}>
          {projets.length === 0 && (
            <div className="text-center py-12">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" style={{margin:'0 auto 12px'}}><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
              <p className="text-sm font-medium text-gray-900 mb-1">Soyez les premiers !</p>
              <p className="text-xs text-gray-400 mb-4">Aucun projet pour l'instant. Lance le tien !</p>
              <a href="/nouveau-projet"><button className="bg-blue-500 text-white text-sm font-medium px-6 py-2 rounded-full">Publier mon projet</button></a>
            </div>
          )}

          {projets.length > 0 && (
            <>
              {/* Projet en vedette */}
              <a href={'/projet/'+projets[0].id} style={{textDecoration:'none',display:'block',marginBottom:'14px'}}>
                <div style={{background:'linear-gradient(135deg,#1a3a6e,#2B7FFF)',borderRadius:'20px',padding:'20px',position:'relative',overflow:'hidden'}}>
                  <div style={{position:'absolute',top:'-20px',right:'-20px',width:'100px',height:'100px',borderRadius:'50%',background:'rgba(255,255,255,0.08)'}}></div>
                  <div style={{fontSize:'10px',color:'rgba(255,255,255,0.6)',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'.05em'}}>En vedette</div>
                  <div style={{fontSize:'17px',fontWeight:'500',color:'#fff',marginBottom:'6px'}}>{projets[0].titre}</div>
                  <div style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',marginBottom:'14px',lineHeight:'1.5'}}>{projets[0].description}</div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'500',color:'#fff'}}>
                        {(projets[0].titre?.[0] || 'P').toUpperCase()}
                      </div>
                      <span style={{fontSize:'12px',color:'rgba(255,255,255,0.7)'}}>{projets[0].categorie}</span>
                    </div>
                    <div style={{background:'rgba(255,255,255,0.15)',borderRadius:'99px',padding:'6px 14px',fontSize:'12px',color:'#fff',fontWeight:'500'}}>Voir</div>
                  </div>
                </div>
              </a>

              <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'12px'}}>Récents</div>
            </>
          )}

          {projets
            .filter((_: any, i: number) => i > 0)
            .filter((p: any) => categorie === 'Tous' || p.categorie === categorie)
            .map((projet: any) => (
            <a key={projet.id} href={'/projet/'+projet.id} style={{textDecoration:'none',display:'block',marginBottom:'10px'}}>
              <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'linear-gradient(135deg,#EEF5FF,#DCE9FF)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e',marginBottom:'3px'}}>{projet.titre}</div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                      <span style={{fontSize:'10px',background:'#EEF5FF',color:'#2B7FFF',padding:'2px 8px',borderRadius:'99px',fontWeight:'500'}}>{projet.categorie}</span>
                      <span style={{fontSize:'11px',color:'#aaa'}}>{new Date(projet.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>
                    </div>
                  </div>
                </div>
                <div style={{fontSize:'12px',color:'#666',marginBottom:'12px',lineHeight:'1.5'}}>{projet.description}</div>
                <div style={{background:'#F8FBFF',borderRadius:'10px',padding:'8px 12px',marginBottom:'10px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                    <span style={{color:'#666'}}>Cagnotte</span>
                    <span style={{fontWeight:'500',color:'#2B7FFF'}}>0 / 1 000 CHF</span>
                  </div>
                  <div style={{height:'4px',background:'#DCE9FF',borderRadius:'99px'}}></div>
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',gap:'12px'}}>
                    <span style={{fontSize:'12px',color:'#aaa',display:'flex',alignItems:'center',gap:'4px'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      0
                    </span>
                    <span style={{fontSize:'12px',color:'#aaa',display:'flex',alignItems:'center',gap:'4px'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      0
                    </span>
                  </div>
                  <button style={{background:'#D4A843',color:'#fff',fontSize:'11px',fontWeight:'500',padding:'6px 14px',borderRadius:'99px',border:'none',cursor:'pointer'}}>
                    Soutenir
                  </button>
                </div>
              </div>
            </a>
          ))}

          {user && (
            <a href="/nouveau-projet" style={{textDecoration:'none',display:'block',marginTop:'8px'}}>
              <button style={{width:'100%',background:'#EEF5FF',color:'#2B7FFF',fontSize:'13px',fontWeight:'500',padding:'14px',borderRadius:'14px',border:'0.5px solid #DCE9FF',cursor:'pointer'}}>
                + Publier mon projet
              </button>
            </a>
          )}
        </div>
      </div>

    </main>
  )
}
