"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const JOURS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]
const COULEURS_EVT = ["#2B7FFF","#10B981","#F43F5E","#D4A843","#8B5CF6","#F59E0B","#EC4899"]

export default function Semaine() {
  const [evenements, setEvenements] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedDay, setSelectedDay] = useState<any>(null)
  const [titre, setTitre] = useState("")
  const [heure, setHeure] = useState("")
  const [duree, setDuree] = useState(30)
  const [couleur, setCouleur] = useState("#2B7FFF")
  const [semaineOffset, setSemaineOffset] = useState(0)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
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
      const ed = new Date(e.date)
      return ed.toDateString() === date.toDateString()
    })

  async function ajouterEvt() {
    if (!titre || !selectedDay) return
    const { error } = await supabase.from("evenements_calendrier").insert({
      user_id: user.id, titre, heure, couleur, duree,
      date: `${selectedDay.getFullYear()}-${String(selectedDay.getMonth()+1).padStart(2,'0')}-${String(selectedDay.getDate()).padStart(2,'0')}`
    })
    if (!error) {
      setTitre(""); setHeure(""); setCouleur("#2B7FFF"); setDuree(30); setShowForm(false)
      const { data } = await supabase.from("evenements_calendrier").select("*").eq("user_id", user.id).order("date", { ascending: true })
      setEvenements(data || [])
    }
  }

  async function supprimerEvt(id: string) {
    await supabase.from("evenements_calendrier").delete().eq("id", id)
    setEvenements(evenements.filter(e => e.id !== id))
  }

  const debutSemaine = jours[0].toLocaleDateString('fr-FR', {day:'numeric', month:'long'})
  const finSemaine = jours[6].toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})

  return (
    <main className="min-h-screen bg-white">
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
              <div key={i} onClick={() => { setSelectedDay(jour); setShowForm(true) }}
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

      {showForm && selectedDay && (
        <div style={{margin:'16px 14px 0',background:'#EEF5FF',borderRadius:'16px',padding:'14px',border:'0.5px solid #DCE9FF'}}>
          <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>
            + Événement le {selectedDay.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
          </div>
          <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Titre de l'événement"
            style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#fff',marginBottom:'8px'}}/>
          <input value={heure} onChange={e => setHeure(e.target.value)} placeholder="Heure (ex: 14:30)" type="time"
            style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#fff',marginBottom:'8px'}}/>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'8px'}}>
            <label style={{fontSize:'12px',color:'#666',whiteSpace:'nowrap'}}>Durée :</label>
            <select value={duree} onChange={e => setDuree(Number(e.target.value))}
              style={{flex:1,border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF'}}>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1h</option>
              <option value={90}>1h30</option>
              <option value={120}>2h</option>
              <option value={180}>3h</option>
              <option value={240}>4h</option>
            </select>
          </div>
          <div style={{display:'flex',gap:'6px',marginBottom:'10px'}}>
            {COULEURS_EVT.map(c => (
              <div key={c} onClick={() => setCouleur(c)} style={{width:'28px',height:'28px',borderRadius:'50%',background:c,cursor:'pointer',border: couleur === c ? '3px solid #1a1a2e' : '3px solid transparent'}}/>
            ))}
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={() => setShowForm(false)} style={{flex:1,background:'#fff',color:'#aaa',fontSize:'13px',padding:'9px',borderRadius:'10px',border:'0.5px solid #E8F1FF',cursor:'pointer'}}>Annuler</button>
            <button onClick={ajouterEvt} style={{flex:2,background:'#2B7FFF',color:'#fff',fontSize:'13px',fontWeight:'500',padding:'9px',borderRadius:'10px',border:'none',cursor:'pointer'}}>Ajouter</button>
          </div>
        </div>
      )}

      <div style={{padding:'16px 18px'}}>
        <div style={{fontSize:'11px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:'500',marginBottom:'10px'}}>Événements de la semaine</div>

        {jours.map((jour, i) => {
          const evts = evtDuJour(jour)
          if (evts.length === 0) return null
          const isToday = jour.toDateString() === today.toDateString()
          return (
            <div key={i} style={{marginBottom:'12px'}}>
              <div style={{fontSize:'12px',fontWeight:'500',color: isToday ? '#2B7FFF' : '#666',marginBottom:'6px'}}>
                {isToday ? '📍 Aujourd\'hui' : ''} {jour.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
              </div>
              {evts.map((e: any) => (
                <div key={e.id} style={{background:'#fff',border:`0.5px solid ${e.couleur}44`,borderLeft:`3px solid ${e.couleur}`,borderRadius:'10px',padding:'10px 12px',marginBottom:'6px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{e.titre}</div>
                    {e.heure && <div style={{fontSize:'11px',color:'#aaa',marginTop:'2px'}}>{e.heure}{e.duree ? ` · ${e.duree >= 60 ? Math.floor(e.duree/60)+'h'+(e.duree%60 ? (e.duree%60)+'min' : '') : e.duree+'min'}` : ''}</div>}
                  </div>
                  <button onClick={() => supprimerEvt(e.id)} style={{background:'none',border:'none',color:'#ddd',cursor:'pointer',fontSize:'18px'}}>×</button>
                </div>
              ))}
            </div>
          )
        })}

        {jours.every(j => evtDuJour(j).length === 0) && (
          <div style={{textAlign:'center',padding:'32px 0',color:'#aaa'}}>
            <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='1.5' style={{marginBottom:'8px'}}><rect x='3' y='4' width='18' height='18' rx='2' ry='2'/><line x1='16' y1='2' x2='16' y2='6'/><line x1='8' y1='2' x2='8' y2='6'/><line x1='3' y1='10' x2='21' y2='10'/></svg>
            <div style={{fontSize:'13px',marginBottom:'6px'}}>Aucun événement cette semaine</div>
            <div style={{fontSize:'12px'}}>Clique sur un jour pour en ajouter un !</div>
          </div>
        )}
      </div>
    </main>
  )
}
