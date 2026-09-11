"use client"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

const COULEURS_EVT = ["#2B7FFF","#10B981","#F43F5E","#D4A843","#8B5CF6","#F59E0B","#EC4899"]
const JOURS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]

function aujourdhuiStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function Formulaire() {
  const params = useSearchParams()
  const dateInitiale = params.get("date") || aujourdhuiStr()

  const [titre, setTitre] = useState("")
  const [date, setDate] = useState(dateInitiale)
  const [heure, setHeure] = useState("09:00")
  const [duree, setDuree] = useState(30)
  const [couleur, setCouleur] = useState("#2B7FFF")
  const [description, setDescription] = useState("")
  const [lieu, setLieu] = useState("")
  const [multiJours, setMultiJours] = useState(false)
  const [dateFin, setDateFin] = useState("")
  const [recurrence, setRecurrence] = useState(false)
  const [joursRecurrence, setJoursRecurrence] = useState<number[]>([])
  const [recurrenceFin, setRecurrenceFin] = useState("")
  const [message, setMessage] = useState("")
  const [enregistrement, setEnregistrement] = useState(false)

  async function geocoder(adresse: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(adresse)}`)
      const data = await res.json()
      if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    } catch {}
    return null
  }

  async function creer() {
    if (!titre.trim()) { setMessage("Donne un titre à l'événement"); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = "/connexion"; return }

    setEnregistrement(true)
    let lat: number | null = null, lng: number | null = null
    if (lieu.trim()) {
      setMessage("Localisation du lieu...")
      const geo = await geocoder(lieu.trim())
      if (geo) { lat = geo.lat; lng = geo.lng }
    }

    const { error } = await supabase.from("evenements_calendrier").insert({
      user_id: user.id, titre, date, heure, duree, couleur, description, lieu, lat, lng,
      date_fin: multiJours && dateFin ? dateFin : null,
      recurrence_jours: recurrence && joursRecurrence.length > 0 ? joursRecurrence : null,
      recurrence_fin: recurrence && recurrenceFin ? recurrenceFin : null
    })

    if (error) {
      setMessage("Erreur : " + error.message)
      setEnregistrement(false)
    } else {
      setMessage("Enregistré !")
      setTimeout(() => { window.location.href = "/semaine" }, 700)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 28px'}}>
        <a href="/semaine" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>← Retour</a>
        <div style={{fontSize:'20px',fontWeight:'500',color:'#fff',marginTop:'10px'}}>Nouvel événement</div>
      </div>

      <div style={{padding:'20px 18px',display:'flex',flexDirection:'column',gap:'14px'}}>
        <div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Titre</label>
          <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Titre de l'événement"
            style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 14px',fontSize:'14px',color:'#1a1a2e',background:'#F8FBFF',boxSizing:'border-box'}}/>
        </div>

        <div style={{display:'flex',gap:'10px'}}>
          <div style={{flex:1}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Date</label>
            <input value={date} onChange={e => setDate(e.target.value)} type="date"
              style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF',boxSizing:'border-box'}}/>
          </div>
          <div style={{flex:1}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Heure</label>
            <input value={heure} onChange={e => setHeure(e.target.value)} type="time"
              style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF',boxSizing:'border-box'}}/>
          </div>
        </div>

        <div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Durée (minutes)</label>
          <input value={duree} onChange={e => setDuree(Number(e.target.value) || 0)} type="number" min="0" step="5"
            style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF',boxSizing:'border-box'}}/>
        </div>

        <div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'6px'}}>Couleur</label>
          <div style={{display:'flex',gap:'8px'}}>
            {COULEURS_EVT.map(c => (
              <div key={c} onClick={() => setCouleur(c)} style={{width:'26px',height:'26px',borderRadius:'50%',background:c,cursor:'pointer',border: couleur === c ? '3px solid #1a1a2e' : '3px solid transparent'}}/>
            ))}
          </div>
        </div>

        <div style={{background:'#F8FBFF',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>Sur plusieurs jours</div>
            <div style={{fontSize:'11px',color:'#aaa',marginTop:'2px'}}>Du jour choisi jusqu'à une date de fin</div>
          </div>
          <button onClick={() => { const v=!multiJours; setMultiJours(v); if (v) { setRecurrence(false); setJoursRecurrence([]) } }}
            style={{width:'40px',height:'22px',borderRadius:'99px',border:'none',cursor:'pointer',position:'relative',background: multiJours ? '#2B7FFF' : '#E2E8F0'}}>
            <div style={{width:'18px',height:'18px',borderRadius:'50%',background:'#fff',position:'absolute',top:'2px',left: multiJours ? '20px' : '2px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}></div>
          </button>
        </div>

        {multiJours && (
          <div style={{background:'#F8FBFF',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px'}}>
            <label style={{fontSize:'11px',color:'#2B7FFF',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:'6px'}}>Date de fin</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
              style={{width:'100%',border:'none',fontSize:'15px',color:'#1a1a2e',outline:'none',background:'transparent'}}/>
          </div>
        )}

        {!multiJours && (
          <div style={{background:'#F8FBFF',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>Se répète</div>
              <div style={{fontSize:'11px',color:'#aaa',marginTop:'2px'}}>Toutes les semaines, les jours choisis</div>
            </div>
            <button onClick={() => { const v=!recurrence; setRecurrence(v); if (!v) { setJoursRecurrence([]); setRecurrenceFin("") } }}
              style={{width:'40px',height:'22px',borderRadius:'99px',border:'none',cursor:'pointer',position:'relative',background: recurrence ? '#2B7FFF' : '#E2E8F0'}}>
              <div style={{width:'18px',height:'18px',borderRadius:'50%',background:'#fff',position:'absolute',top:'2px',left: recurrence ? '20px' : '2px',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}></div>
            </button>
          </div>
        )}

        {!multiJours && recurrence && (
          <div style={{background:'#F8FBFF',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px'}}>
            <div style={{fontSize:'11px',color:'#2B7FFF',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'8px'}}>Répéter les</div>
            <div style={{display:'flex',gap:'6px',marginBottom:'10px'}}>
              {JOURS.map((j, i) => (
                <button key={j} onClick={() => setJoursRecurrence(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                  style={{flex:1,padding:'8px 0',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'11px',fontWeight:'600',
                    background: joursRecurrence.includes(i) ? '#2B7FFF' : '#fff',
                    color: joursRecurrence.includes(i) ? '#fff' : '#1a1a2e',
                    boxShadow: joursRecurrence.includes(i) ? 'none' : '0 0 0 0.5px #E8F1FF'}}>
                  {j}
                </button>
              ))}
            </div>
            <label style={{fontSize:'11px',color:'#2B7FFF',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:'6px'}}>Jusqu'au (optionnel)</label>
            <input type="date" value={recurrenceFin} onChange={e => setRecurrenceFin(e.target.value)}
              style={{width:'100%',border:'none',fontSize:'15px',color:'#1a1a2e',outline:'none',background:'transparent'}}/>
            {!recurrenceFin && <div style={{fontSize:'11px',color:'#aaa',marginTop:'2px'}}>Se répète indéfiniment si laissé vide</div>}
          </div>
        )}

        <div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
            placeholder="Ajoute des détails sur cet événement..."
            style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF',boxSizing:'border-box',resize:'vertical',fontFamily:'inherit'}}/>
        </div>

        <div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Lieu / Adresse</label>
          <input value={lieu} onChange={e => setLieu(e.target.value)}
            placeholder="Ex: 12 rue du Rhône, Genève"
            style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF',boxSizing:'border-box'}}/>

          {lieu.trim() && (
            <div style={{marginTop:'10px',borderRadius:'12px',overflow:'hidden',border:'1px solid #E8F1FF'}}>
              <iframe
                title="Carte du lieu"
                width="100%"
                height="180"
                style={{border:0,display:'block'}}
                loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(lieu)}&output=embed`}
              />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lieu)}`}
                target="_blank" rel="noopener noreferrer"
                style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'10px',fontSize:'12px',fontWeight:'500',color:'#2B7FFF',background:'#F8FBFF',textDecoration:'none'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Ouvrir dans Google Maps
              </a>
            </div>
          )}
        </div>

        {message && (
          <div style={{fontSize:'13px',color: message.startsWith("Erreur") ? '#F43F5E' : '#10B981',textAlign:'center'}}>{message}</div>
        )}

        <button onClick={creer} disabled={enregistrement} style={{background:'#2B7FFF',color:'#fff',fontSize:'14px',fontWeight:'500',padding:'12px',borderRadius:'12px',border:'none',cursor: enregistrement ? 'default' : 'pointer',opacity: enregistrement ? 0.6 : 1}}>
          {enregistrement ? "Enregistrement..." : "Créer l'événement"}
        </button>
      </div>
    </main>
  )
}

export default function NouvelEvenement() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white flex items-center justify-center"><p className="text-gray-400 text-sm">Chargement...</p></main>}>
      <Formulaire />
    </Suspense>
  )
}
