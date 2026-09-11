"use client"
import Tutorial from "../components/Tutorial"
import Constellation from "../components/Constellation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { syncActivitesGroupeVersCalendrier } from "@/lib/syncActivites"

const JOURS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]
const COULEURS_EVT = ["#2B7FFF","#10B981","#F43F5E","#D4A843","#8B5CF6","#F59E0B","#EC4899"]

export default function Semaine() {
  const [evenements, setEvenements] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [selectedDay, setSelectedDay] = useState<any>(null)
  const [semaineOffset, setSemaineOffset] = useState(0)
  const [jourFiltre, setJourFiltre] = useState<Date>(() => new Date())
  const [voirTouteLaSemaine, setVoirTouteLaSemaine] = useState(false)
  const [vue3D, setVue3D] = useState(false)
  const [periode3D, setPeriode3D] = useState<'semaine' | 'mois' | 'annee'>('semaine')

  const idxSemaine = (d: Date) => (d.getDay() + 6) % 7 // 0=Lun ... 6=Dim, aligné sur JOURS

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        await syncActivitesGroupeVersCalendrier(user.id)
        const { data } = await supabase.from("evenements_calendrier").select("*").eq("user_id", user.id).order("date", { ascending: true })
        setEvenements(data || [])
      }
    }
    charger()
  }, [])

  const today = new Date()

  const getLundi = (offset: number) => {
    const d = new Date(today)
    const day = d.getDay() || 7
    d.setDate(d.getDate() - day + 1 + offset * 7)
    d.setHours(0,0,0,0)
    return d
  }

  const lundi = getLundi(semaineOffset)
  const jours = Array.from({length: 7}, (_, i) => {
    const d = new Date(lundi)
    d.setDate(lundi.getDate() + i)
    return d
  })

  const evtDuJour = (date: Date) =>
    evenements.filter(e => {
      if (e.recurrence_jours && e.recurrence_jours.length > 0) {
        const debut = new Date(e.date); debut.setHours(0,0,0,0)
        const d0 = new Date(date); d0.setHours(0,0,0,0)
        if (d0 < debut) return false
        if (e.recurrence_fin) {
          const fin = new Date(e.recurrence_fin); fin.setHours(0,0,0,0)
          if (d0 > fin) return false
        }
        return e.recurrence_jours.includes(idxSemaine(date))
      }
      const ed = new Date(e.date)
      return ed.toDateString() === date.toDateString()
    })

  async function supprimerEvt(id: string) {
    await supabase.from("evenements_calendrier").delete().eq("id", id)
    setEvenements(evenements.filter(e => e.id !== id))
  }

  const debutSemaine = jours[0].toLocaleDateString('fr-FR', {day:'numeric', month:'long'})
  const finSemaine = jours[6].toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})

  const renderEvt = (e: any) => (
    <a key={e.id} href={`/evenement/${e.id}`} style={{textDecoration:'none',display:'block'}}>
      <div style={{background:'#fff',border:`0.5px solid ${e.couleur}44`,borderLeft:`3px solid ${e.couleur}`,borderRadius:'10px',padding:'10px 12px',marginBottom:'6px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',display:'flex',alignItems:'center',gap:'5px'}}>
            {e.recurrence_jours?.length > 0 && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            )}
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.titre}</span>
          </div>
          <div style={{fontSize:'11px',color:'#aaa',marginTop:'2px',display:'flex',alignItems:'center',gap:'6px'}}>
            {e.heure && <span>{e.heure}{e.duree ? ` · ${e.duree >= 60 ? Math.floor(e.duree/60)+'h'+(e.duree%60 ? (e.duree%60)+'min' : '') : e.duree+'min'}` : ''}</span>}
            {e.lieu && (
              <span style={{display:'flex',alignItems:'center',gap:'2px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {e.lieu}
              </span>
            )}
          </div>
        </div>
        <button onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); supprimerEvt(e.id) }} style={{background:'none',border:'none',color:'#ddd',cursor:'pointer',fontSize:'18px',flexShrink:0,marginLeft:'8px'}}>×</button>
      </div>
    </a>
  )

  const evtsJourFiltre = evtDuJour(jourFiltre)

  const evtsPour3D = (() => {
    let dates: Date[] = jours
    if (periode3D === 'mois') {
      const ref = jours[0]
      const debut = new Date(ref.getFullYear(), ref.getMonth(), 1)
      const fin = new Date(ref.getFullYear(), ref.getMonth() + 1, 0)
      dates = []
      for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) dates.push(new Date(d))
    } else if (periode3D === 'annee') {
      const ref = jours[0]
      const debut = new Date(ref.getFullYear(), 0, 1)
      const fin = new Date(ref.getFullYear(), 11, 31)
      dates = []
      for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) dates.push(new Date(d))
    }
    return dates.flatMap(d => evtDuJour(d).map((e: any) => ({ ...e, _occId: `${e.id}-${d.toISOString().slice(0,10)}` })))
  })()
  const jourFiltreEstAujourdhui = jourFiltre.toDateString() === today.toDateString()

  return (
    <main className="min-h-screen bg-white"><Tutorial page="calendrier" />
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 32px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-40px',right:'-40px',width:'180px',height:'180px',borderRadius:'50%',background:'rgba(43,127,255,0.15)'}}></div>
        <a href="/" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'8px'}}>← Accueil</a>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginBottom:'4px'}}>Calendrier</div>
        <div style={{fontSize:'20px',fontWeight:'500',color:'#fff',marginBottom:'2px'}}>{debutSemaine} – {finSemaine}</div>
        <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)'}}>{evenements.length} événements au total</div>
      </div>

      <div style={{margin:'-16px 14px 0',borderRadius:'18px',padding:'14px',position:'relative',zIndex:2,background:'rgba(255,255,255,0.85)',backdropFilter:'blur(20px)',border:'0.5px solid rgba(255,255,255,0.9)',boxShadow:'0 4px 24px rgba(43,127,255,0.1)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
          <button onClick={() => setSemaineOffset(o => o-1)} style={{width:'28px',height:'28px',borderRadius:'50%',border:'none',background:'#EEF5FF',color:'#2B7FFF',cursor:'pointer',fontSize:'16px'}}>‹</button>
          <button onClick={() => setSemaineOffset(0)} style={{fontSize:'12px',color:'#2B7FFF',background:'#EEF5FF',border:'none',padding:'4px 12px',borderRadius:'99px',cursor:'pointer',fontWeight:'500'}}>
            Aujourd'hui
          </button>
          <button onClick={() => setSemaineOffset(o => o+1)} style={{width:'28px',height:'28px',borderRadius:'50%',border:'none',background:'#EEF5FF',color:'#2B7FFF',cursor:'pointer',fontSize:'16px'}}>›</button>
        </div>

        <div style={{display:'flex',gap:'4px'}}>
          {jours.map((jour, i) => {
            const isToday = jour.toDateString() === today.toDateString()
            const evts = evtDuJour(jour)
            const isSelected = selectedDay?.toDateString() === jour.toDateString()
            return (
              <div key={i} onClick={() => { setSelectedDay(jour); setJourFiltre(jour); setVoirTouteLaSemaine(false) }}
                style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',cursor:'pointer',padding:'4px 2px',borderRadius:'10px',background: isSelected ? '#EEF5FF' : 'transparent'}}>
                <div style={{fontSize:'10px',color:'#aaa',fontWeight:'500'}}>{JOURS[i]}</div>
                <div style={{width:'28px',height:'28px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'500',
                  background: isToday ? '#2B7FFF' : 'transparent',
                  color: isToday ? '#fff' : '#1a1a2e'}}>
                  {jour.getDate()}
                </div>
                {evts.length > 0 && (
                  <div style={{display:'flex',gap:'2px',flexWrap:'wrap',justifyContent:'center',maxWidth:'100%'}}>
                    {evts.slice(0,3).map((e,j) => (
                      <div key={j} style={{width:'6px',height:'6px',borderRadius:'50%',background:e.couleur,flexShrink:0}}></div>
                    ))}
                    {evts.length > 3 && <div style={{fontSize:'7px',color:'#aaa'}}>+{evts.length-3}</div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{padding:'16px 18px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
          <div style={{fontSize:'11px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:'500'}}>
            {voirTouteLaSemaine
              ? 'Événements de la semaine'
              : (jourFiltreEstAujourdhui ? "Aujourd'hui" : jourFiltre.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}))}
          </div>
          <button onClick={() => setVoirTouteLaSemaine(v => !v)} style={{fontSize:'11px',color:'#2B7FFF',background:'none',border:'none',cursor:'pointer',fontWeight:'500',padding:0}}>
            {voirTouteLaSemaine ? 'Réduire ↑' : 'Voir toute la semaine →'}
          </button>
        </div>

        <a href={`/evenement/nouveau?date=${(selectedDay || jourFiltre).getFullYear()}-${String((selectedDay || jourFiltre).getMonth()+1).padStart(2,'0')}-${String((selectedDay || jourFiltre).getDate()).padStart(2,'0')}`}
          style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',width:'100%',boxSizing:'border-box',background:'#EEF5FF',color:'#2B7FFF',border:'1px dashed #B8D4FF',borderRadius:'10px',padding:'10px',fontSize:'13px',fontWeight:'500',textDecoration:'none',marginBottom:'14px'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter un événement
        </a>

        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'10px'}}>
          <button onClick={() => setVue3D(v => !v)} style={{fontSize:'11px',color: vue3D ? '#fff' : '#8B5CF6',background: vue3D ? '#8B5CF6' : '#F5F1FF',border:'none',padding:'4px 10px',borderRadius:'99px',cursor:'pointer',fontWeight:'500',display:'flex',alignItems:'center',gap:'4px'}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="6" r="1"/><circle cx="5" cy="19" r="1"/><circle cx="19" cy="19" r="1"/><circle cx="5" cy="6" r="1"/><path d="M12 12L19 6M12 12L5 19M12 12L19 19M12 12L5 6"/></svg>
            {vue3D ? 'Quitter la vue 3D' : 'Vue 3D'}
          </button>
        </div>

        {vue3D && (
          <div style={{marginBottom:'14px'}}>
            <div style={{display:'flex',gap:'6px',marginBottom:'10px'}}>
              {(['semaine','mois','annee'] as const).map(p => (
                <button key={p} onClick={() => setPeriode3D(p)}
                  style={{flex:1,padding:'6px 0',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'11px',fontWeight:'600',
                    background: periode3D===p ? '#8B5CF6' : '#F5F1FF',
                    color: periode3D===p ? '#fff' : '#8B5CF6'}}>
                  {p === 'semaine' ? 'Semaine' : p === 'mois' ? 'Mois' : 'Année'}
                </button>
              ))}
            </div>
            <Constellation evenements={evtsPour3D} periodeLabel={periode3D === 'semaine' ? 'cette semaine' : periode3D === 'mois' ? 'ce mois-ci' : 'cette année'} />
          </div>
        )}

        {!vue3D && (
        <>
        {!voirTouteLaSemaine && (
          evtsJourFiltre.length === 0 ? (
            <div style={{textAlign:'center',padding:'32px 0',color:'#aaa'}}>
              <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='1.5' style={{marginBottom:'8px'}}><rect x='3' y='4' width='18' height='18' rx='2' ry='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></svg>
              <div style={{fontSize:'13px',marginBottom:'6px'}}>Rien de prévu ce jour-là</div>
            </div>
          ) : (
            evtsJourFiltre.map(e => renderEvt(e))
          )
        )}

        {voirTouteLaSemaine && (
          <>
            {jours.map((jour, i) => {
              const evts = evtDuJour(jour)
              if (evts.length === 0) return null
              const isToday = jour.toDateString() === today.toDateString()
              return (
                <div key={i} style={{marginBottom:'12px'}}>
                  <div style={{fontSize:'12px',fontWeight:'500',color: isToday ? '#2B7FFF' : '#666',marginBottom:'6px',display:'flex',alignItems:'center',gap:'5px'}}>
                    {isToday && (
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="#2B7FFF"><circle cx="12" cy="12" r="12"/></svg>
                    )}
                    {isToday ? "Aujourd'hui · " : ''}{jour.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
                  </div>
                  {evts.map(e => renderEvt(e))}
                </div>
              )
            })}

            {jours.every(j => evtDuJour(j).length === 0) && (
              <div style={{textAlign:'center',padding:'32px 0',color:'#aaa'}}>
                <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='1.5' style={{marginBottom:'8px'}}><rect x='3' y='4' width='18' height='18' rx='2' ry='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></svg>
                <div style={{fontSize:'13px',marginBottom:'6px'}}>Aucun événement cette semaine</div>
                <div style={{fontSize:'12px'}}>Touche le + en haut pour en ajouter un</div>
              </div>
            )}
          </>
        )}
        </>
        )}
      </div>
    </main>
  )
}