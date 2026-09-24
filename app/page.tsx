"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { syncActivitesGroupeVersCalendrier } from "@/lib/syncActivites"
import { useDeviseConversion } from "./hooks/useDevise"

const JOURS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]

export default function Home() {
  const [projets, setProjets] = useState<any[]>([])
  const [categorie, setCategorie] = useState("Tous")
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const { format } = useDeviseConversion()
  const [evenements, setEvenements] = useState<any[]>([])
  const [depenses, setDepenses] = useState<any[]>([])
  const [revenus, setRevenus] = useState<any[]>([])
  const [likesProjets, setLikesProjets] = useState<any[]>([])
  const [profilsCreateurs, setProfilsCreateurs] = useState<Record<string, string>>({})
  const [commentairesCount, setCommentairesCount] = useState<Record<string, number>>({})

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setAuthChecked(true)
      if (!user) {
        const vu = sessionStorage.getItem('onboardingVu')
        if (!vu) { sessionStorage.setItem('onboardingVu','1'); window.location.href='/onboarding'; return }
      }
      const { data: p } = await supabase.from("projets").select("*").is("groupe_id", null).eq("prive", false).order("created_at", { ascending: false })
      setProjets(p || [])
      if (p && p.length > 0) {
        const idsCreateurs = Array.from(new Set(p.map((pr: any) => pr.user_id)))
        const { data: profs } = await supabase.from("profiles").select("id,nom").in("id", idsCreateurs)
        const map: Record<string, string> = {}
        profs?.forEach((pf: any) => { map[pf.id] = pf.nom || "Membre" })
        setProfilsCreateurs(map)
      }
      const { data: lp } = await supabase.from("projets_likes").select("*")
      setLikesProjets(lp || [])
      const { data: com } = await supabase.from("commentaires").select("projet_id")
      if (com) {
        const compte: Record<string, number> = {}
        com.forEach((c: any) => { compte[c.projet_id] = (compte[c.projet_id] || 0) + 1 })
        setCommentairesCount(compte)
      }
      if (user) {
        await syncActivitesGroupeVersCalendrier(user.id)
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

  async function toggleLikeProjet(projetId: string) {
    if (!user) { window.location.href = "/connexion"; return }
    const dejaLike = likesProjets.find(l => l.projet_id === projetId && l.user_id === user.id)
    if (dejaLike) {
      await supabase.from("projets_likes").delete().eq("id", dejaLike.id)
      setLikesProjets(prev => prev.filter(l => l.id !== dejaLike.id))
    } else {
      const { data } = await supabase.from("projets_likes").insert({ projet_id: projetId, user_id: user.id }).select().single()
      if (data) setLikesProjets(prev => [...prev, data])
    }
  }


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
    <main className="min-h-screen" style={{background:'#F7F9FC'}}>

      {/* Ciel de nuit - header */}
      <div style={{background:'radial-gradient(120% 90% at 85% 0%, #1a3a6e 0%, #0A1628 60%)',padding:'20px 20px 18px',position:'relative',overflow:'hidden'}}>

        {!authChecked && (
          <div style={{minHeight:'160px'}}></div>
        )}

        {authChecked && !user && (
          <div style={{textAlign:'center',paddingBottom:'20px'}}>
            <h1 style={{fontSize:'26px',fontWeight:'600',color:'#fff',margin:'0 0 8px'}}>Bienvenue sur Nexia</h1>
            <p style={{fontSize:'14px',color:'rgba(255,255,255,0.6)',marginBottom:'24px'}}>Connecte-toi pour accéder à toutes les fonctionnalités</p>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <a href="/inscription" style={{textDecoration:'none'}}>
                <button style={{width:'100%',background:'#fff',color:'#1a3a6e',fontWeight:'500',fontSize:'15px',padding:'14px',borderRadius:'14px',border:'none',cursor:'pointer'}}>Créer mon compte</button>
              </a>
              <a href="/connexion" style={{textDecoration:'none'}}>
                <button style={{width:'100%',background:'transparent',color:'rgba(255,255,255,0.7)',fontWeight:'500',fontSize:'14px',padding:'13px',borderRadius:'14px',border:'0.5px solid rgba(255,255,255,0.3)',cursor:'pointer'}}>J'ai déjà un compte</button>
              </a>
              <a href="/onboarding" style={{textDecoration:'none'}}>
                <button style={{width:'100%',background:'transparent',color:'rgba(255,255,255,0.5)',fontSize:'13px',padding:'10px',borderRadius:'14px',border:'none',cursor:'pointer'}}>Voir les fonctionnalités</button>
              </a>
            </div>
          </div>
        )}

        {user && (
          <div style={{maxWidth:'640px',margin:'0 auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'22px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <svg aria-hidden="true" width='18' height='18' viewBox='0 0 60 60' style={{flexShrink:0}}>
                  <path d='M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z' fill='#D4A843'/>
                </svg>
                <span className="nx-display" style={{fontSize:'15px',fontWeight:'600',color:'#fff',letterSpacing:'0.14em'}}>NEXIA</span>
              </div>
              <span style={{fontSize:'12px',color:'rgba(255,255,255,0.55)'}}>
                {today.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
              </span>
            </div>

            <h1 className="nx-display" style={{fontSize:'17px',fontWeight:'500',color:'rgba(255,255,255,0.7)',margin:'0 0 4px',letterSpacing:0}}>Bonjour</h1>
            <a href="/finances" style={{textDecoration:'none',display:'block'}}>
              <div className="nx-display" style={{fontSize:'44px',fontWeight:'600',lineHeight:1.05,letterSpacing:'-0.035em',color: solde >= 0 ? '#fff' : '#fca5a5'}}>
                {solde >= 0 ? '+' : ''}{format(solde)}
              </div>
              <div style={{fontSize:'13px',color:'rgba(255,255,255,0.55)',marginTop:'6px'}}>
                Solde de {today.toLocaleDateString('fr-FR',{month:'long'})} : <span style={{color:'#86efac'}}>{format(totalRev)}</span> gagnés, <span style={{color:'#fca5a5'}}>{format(totalDep)}</span> dépensés
              </div>
            </a>

            {/* Signature : la semaine dessinée comme une constellation */}
            <a href="/semaine" aria-label="Voir ma semaine" style={{display:'block',maxWidth:'440px',margin:'22px auto 0',textDecoration:'none'}}>
              <svg viewBox="0 0 350 104" width="100%" role="img" aria-hidden="true" style={{display:'block',overflow:'visible'}}>
                {(() => {
                  const ys = [58, 40, 52, 30, 46, 24, 42]
                  const pts = jours.map((_, i) => ({ x: 25 + i * 50, y: ys[i] }))
                  return (
                    <>
                      <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                      {jours.map((jour, i) => {
                        const isToday = jour.toDateString() === today.toDateString()
                        const nb = evtDuJour(jour).length
                        const { x, y } = pts[i]
                        return (
                          <g key={i}>
                            {isToday && <circle cx={x} cy={y} r="13" fill="#D4A843" opacity="0.18" />}
                            <circle cx={x} cy={y} r={isToday ? 5 : nb > 0 ? 4 : 2.5}
                              fill={isToday ? '#D4A843' : nb > 0 ? '#fff' : 'rgba(255,255,255,0.45)'} />
                            {nb > 0 && (
                              <text x={x} y={y - 12} textAnchor="middle" fontSize="10" fill={isToday ? '#D4A843' : 'rgba(255,255,255,0.8)'}>{nb}</text>
                            )}
                            <text x={x} y="86" textAnchor="middle" fontSize="10" fill={isToday ? '#D4A843' : 'rgba(255,255,255,0.45)'}>{JOURS[i]}</text>
                            <text x={x} y="100" textAnchor="middle" fontSize="12" fontWeight={isToday ? 600 : 400} fill={isToday ? '#fff' : 'rgba(255,255,255,0.7)'}>{jour.getDate()}</text>
                          </g>
                        )
                      })}
                    </>
                  )
                })()}
              </svg>
            </a>
          </div>
        )}
      </div>

      {user && evenements.filter(e => {
        const now = new Date()
        const todayStr = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0')
        if (e.date !== todayStr || !e.heure) return false
        const [h,m] = e.heure.split(':').map(Number)
        const diffMin = (h*60+m) - (now.getHours()*60+now.getMinutes())
        return diffMin > 0 && diffMin <= 60
      }).map(e => {
        const now = new Date()
        const [h,m] = e.heure.split(':').map(Number)
        const diffMin = (h*60+m) - (now.getHours()*60+now.getMinutes())
        return (
          <div key={e.id} style={{margin:'0 14px 8px',background:'#FFE4E6',border:'0.5px solid #FECDD3',borderRadius:'10px',padding:'10px 14px',display:'flex',alignItems:'center',gap:'10px'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{fontSize:'12px',color:'#1a1a2e',flex:1}}><b style={{color:'#F43F5E'}}>{e.titre}</b> dans <b style={{color:'#F43F5E'}}>{diffMin} min</b></span>
            <a href="/semaine" style={{fontSize:'11px',color:'#F43F5E',fontWeight:'500',textDecoration:'none'}}>Voir →</a>
          </div>
        )
      })}

      {/* Prochain rendez-vous + raccourcis */}
      {user && (
        <div style={{maxWidth:'640px',margin:'0 auto',padding:'20px 16px 8px'}}>
          <a href="/semaine" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:'14px',background:'#fff',borderRadius:'18px',padding:'14px 16px',boxShadow:'0 1px 2px rgba(10,22,40,0.06)'}}>
            <div style={{width:'48px',flexShrink:0,textAlign:'center',borderRight:'1px solid #E8EEF7',paddingRight:'12px'}}>
              <div className="nx-display" style={{fontSize:'20px',fontWeight:'600',color:'#0A1628',lineHeight:1}}>
                {prochainEvt ? new Date(prochainEvt.date).getDate() : '–'}
              </div>
              <div style={{fontSize:'11px',color:'#8A94A6',marginTop:'2px'}}>
                {prochainEvt ? new Date(prochainEvt.date).toLocaleDateString('fr-FR',{month:'short'}) : ''}
              </div>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:'12px',color:'#8A94A6',marginBottom:'2px'}}>Prochain rendez-vous</div>
              <div style={{fontSize:'15px',fontWeight:'500',color:'#0A1628',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                {prochainEvt ? prochainEvt.titre : 'Rien de prévu'}
              </div>
              <div style={{fontSize:'12px',color:'#8A94A6',marginTop:'1px'}}>
                {prochainEvt ? (prochainEvt.heure ? `à ${prochainEvt.heure.slice(0,5)}` : 'toute la journée') : 'Ajoute un événement'}
              </div>
            </div>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B4BDCC" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </a>

          <div style={{background:'#fff',borderRadius:'18px',marginTop:'12px',boxShadow:'0 1px 2px rgba(10,22,40,0.06)',overflow:'hidden'}}>
            {[
              { href: '/scanner', titre: 'Scanner un document', sous: 'Facture, relevé, contrat…', icon: <><polyline points="4 7 4 4 7 4"/><polyline points="17 4 20 4 20 7"/><polyline points="20 17 20 20 17 20"/><polyline points="7 20 4 20 4 17"/><line x1="4" y1="12" x2="20" y2="12"/></> },
              { href: '/jeux', titre: 'Jeux', sous: 'Block Blast, 2048, Snake, Memory', icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
            ].map((l, i) => (
              <a key={l.href} href={l.href} style={{display:'flex',alignItems:'center',gap:'14px',padding:'14px 16px',textDecoration:'none',borderTop: i ? '1px solid #EEF2F8' : 'none'}}>
                <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'#0A1628',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">{l.icon}</svg>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'15px',fontWeight:'500',color:'#0A1628'}}>{l.titre}</div>
                  <div style={{fontSize:'12px',color:'#8A94A6',marginTop:'1px'}}>{l.sous}</div>
                </div>
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B4BDCC" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            ))}
          </div>
        </div>
      )}
      {/* Zone decouvrir */}
      <div style={{maxWidth:'640px',margin:'0 auto'}}>
        <div style={{padding:'24px 16px 8px'}}>
          <h2 style={{fontSize:'24px',fontWeight:'600',color:'#0A1628',margin:'0 0 4px'}}>Découvrir</h2>
          <p style={{fontSize:'13px',color:'#8A94A6',margin:'0 0 14px'}}>Les projets lancés par la communauté Nexia</p>
          <div style={{display:'flex',gap:'8px',overflowX:'auto',paddingBottom:'4px'}}>
            {['Tous','Tech','Business','Art','Sport','Éducation','Santé','Autre'].map(cat => (
              <button key={cat} onClick={() => setCategorie(cat)}
                aria-pressed={categorie === cat}
                style={{whiteSpace:'nowrap',padding:'7px 14px',borderRadius:'99px',cursor:'pointer',fontSize:'13px',fontWeight:'500',
                  border: categorie === cat ? '1px solid #0A1628' : '1px solid #DDE3EC',
                  background: categorie === cat ? '#0A1628' : '#fff',
                  color: categorie === cat ? '#fff' : '#4A5568'}}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{padding:'12px 16px 24px'}}>
          {projets.length === 0 && (
            <div className="text-center py-12">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" style={{margin:'0 auto 12px'}}><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
              <p className="text-sm font-medium text-gray-900 mb-1">Soyez les premiers !</p>
              <p className="text-xs text-gray-400 mb-4">Aucun projet pour l'instant. Lance le tien !</p>
              <a href="/nouveau-projet"><button className="bg-blue-500 text-white text-sm font-medium px-6 py-2 rounded-full">Publier mon projet</button></a>
            </div>
          )}

          {projets.length > 0 && (() => {
            const projetsFiltres = projets.filter((p: any) => categorie === 'Tous' || p.categorie === categorie)
            const vedette = projetsFiltres[0]
            if (!vedette) return (
              <div className="text-center py-12">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" style={{margin:'0 auto 12px'}}><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
                <p className="text-sm font-medium text-gray-900 mb-1">Aucun projet dans cette catégorie</p>
                <p className="text-xs text-gray-400 mb-4">Sois le premier à publier dans "{categorie}" !</p>
                <a href="/nouveau-projet"><button className="bg-blue-500 text-white text-sm font-medium px-6 py-2 rounded-full">Publier mon projet</button></a>
              </div>
            )
            return (
              <>
                {/* Projet en vedette */}
                <a href={'/projet/'+vedette.id} style={{textDecoration:'none',display:'block',marginBottom:'14px'}}>
                  <div style={{background:'#0A1628',borderRadius:'22px',padding:'22px',position:'relative',overflow:'hidden'}}>
                    <svg aria-hidden="true" width="120" height="120" viewBox='0 0 60 60' style={{position:'absolute',top:'-26px',right:'-26px',opacity:0.12}}>
                      <path d='M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z' fill='#D4A843'/>
                    </svg>
                    <div style={{fontSize:'12px',color:'#D4A843',marginBottom:'8px',fontWeight:'500'}}>En vedette</div>
                    <div className="nx-display" style={{fontSize:'22px',fontWeight:'600',color:'#fff',marginBottom:'6px',lineHeight:1.2}}>{vedette.titre}</div>
                    <div style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',marginBottom:'14px',lineHeight:'1.5'}}>{vedette.description}</div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'500',color:'#fff'}}>
                          {(vedette.titre?.[0] || 'P').toUpperCase()}
                        </div>
                        <span style={{fontSize:'12px',color:'rgba(255,255,255,0.7)'}}>{vedette.categorie}</span>
                      </div>
                      <div style={{background:'#D4A843',borderRadius:'99px',padding:'7px 16px',fontSize:'13px',color:'#0A1628',fontWeight:'600'}}>Découvrir le projet</div>
                    </div>
                  </div>
                </a>

                <h3 style={{fontSize:'15px',fontWeight:'600',color:'#0A1628',margin:'8px 0 12px'}}>Récents</h3>
              </>
            )
          })()}

          {projets
            .filter((p: any) => categorie === 'Tous' || p.categorie === categorie)
            .filter((p: any) => p.id !== (projets.filter((pr: any) => categorie === 'Tous' || pr.categorie === categorie)[0]?.id))
            .map((projet: any) => {
              const nbLikes = likesProjets.filter(l => l.projet_id === projet.id).length
              const jaimeMoi = likesProjets.some(l => l.projet_id === projet.id && l.user_id === user?.id)
              const nbCommentaires = commentairesCount[projet.id] || 0
              return (
            <div key={projet.id} role="link" tabIndex={0}
              onClick={() => window.location.href = '/projet/'+projet.id}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = '/projet/'+projet.id } }}
              style={{cursor:'pointer',display:'block',marginBottom:'10px'}}>
              <div style={{background:'#fff',borderRadius:'18px',padding:'16px',boxShadow:'0 1px 2px rgba(10,22,40,0.06)'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                  <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'#EEF2F8',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A1628" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'15px',fontWeight:'500',color:'#0A1628',marginBottom:'3px'}}>{projet.titre}</div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px'}}>
                      <span style={{fontSize:'11px',background:'#EEF2F8',color:'#4A5568',padding:'2px 8px',borderRadius:'99px',fontWeight:'500'}}>{projet.categorie}</span>
                      <span style={{fontSize:'11px',color:'#aaa'}}>{new Date(projet.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</span>
                    </div>
                    <a href={'/profil/'+projet.user_id} onClick={e => e.stopPropagation()} style={{fontSize:'11px',color:'#2B7FFF',textDecoration:'none'}}>
                      par {profilsCreateurs[projet.user_id] || 'Membre'}
                    </a>
                  </div>
                </div>
                <div style={{fontSize:'12px',color:'#666',marginBottom:'12px',lineHeight:'1.5'}}>{projet.description}</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{display:'flex',gap:'12px'}}>
                    <button onClick={e => { e.stopPropagation(); toggleLikeProjet(projet.id) }}
                      style={{background:'none',border:'none',padding:0,cursor:'pointer',fontSize:'12px',color: jaimeMoi ? '#F43F5E' : '#aaa',display:'flex',alignItems:'center',gap:'4px'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill={jaimeMoi ? '#F43F5E' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      {nbLikes}
                    </button>
                    <span style={{fontSize:'12px',color:'#aaa',display:'flex',alignItems:'center',gap:'4px'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {nbCommentaires}
                    </span>
                  </div>
                  {projet.image_url ? (
                    <a href={projet.image_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      style={{background:'#D4A843',color:'#fff',fontSize:'11px',fontWeight:'500',padding:'6px 14px',borderRadius:'99px',border:'none',cursor:'pointer',textDecoration:'none'}}>
                      Soutenir
                    </a>
                  ) : (
                    <span style={{fontSize:'11px',color:'#ccc'}}>Pas de lien de soutien</span>
                  )}
                </div>
              </div>
            </div>
              )
          })}

          {user && (
            <a href="/nouveau-projet" style={{textDecoration:'none',display:'block',marginTop:'8px'}}>
              <button style={{width:'100%',background:'transparent',color:'#0A1628',fontSize:'14px',fontWeight:'500',padding:'14px',borderRadius:'18px',border:'1.5px dashed #C5CEDB',cursor:'pointer'}}>
                Publier mon projet
              </button>
            </a>
          )}
        </div>
      </div>

    </main>
  )
}