"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

const COULEURS_EVT = ["#2B7FFF","#10B981","#F43F5E","#D4A843","#8B5CF6","#F59E0B","#EC4899"]
const JOURS = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]

export default function DetailEvenement() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [introuvable, setIntrouvable] = useState(false)
  const [titre, setTitre] = useState("")
  const [date, setDate] = useState("")
  const [heure, setHeure] = useState("")
  const [duree, setDuree] = useState(30)
  const [couleur, setCouleur] = useState("#2B7FFF")
  const [description, setDescription] = useState("")
  const [lieu, setLieu] = useState("")
  const [recurrenceJours, setRecurrenceJours] = useState<number[] | null>(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function charger() {
      const { data, error } = await supabase.from("evenements_calendrier").select("*").eq("id", id).single()
      if (error || !data) { setIntrouvable(true); setLoading(false); return }
      setTitre(data.titre || "")
      setDate(data.date || "")
      setHeure(data.heure || "")
      setDuree(data.duree || 30)
      setCouleur(data.couleur || "#2B7FFF")
      setDescription(data.description || "")
      setLieu(data.lieu || "")
      setRecurrenceJours(data.recurrence_jours || null)
      setLoading(false)
    }
    if (id) charger()
  }, [id])

  async function sauvegarder() {
    const { error } = await supabase.from("evenements_calendrier").update({
      titre, date, heure, duree, couleur, description, lieu
    }).eq("id", id)
    if (error) {
      setMessage("Erreur : " + error.message)
    } else {
      setMessage("Enregistré !")
      setTimeout(() => setMessage(""), 2000)
    }
  }

  async function supprimer() {
    await supabase.from("evenements_calendrier").delete().eq("id", id)
    window.location.href = "/semaine"
  }

  if (loading) {
    return <main className="min-h-screen bg-white flex items-center justify-center"><p className="text-gray-400 text-sm">Chargement...</p></main>
  }

  if (introuvable) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <p className="text-gray-400 text-sm">Événement introuvable</p>
        <a href="/semaine" className="text-blue-500 text-sm font-medium">← Retour au calendrier</a>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 28px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <a href="/semaine" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>← Retour</a>
          <button onClick={supprimer} style={{fontSize:'12px',color:'#F43F5E',background:'rgba(244,63,94,0.15)',border:'none',padding:'5px 12px',borderRadius:'99px',cursor:'pointer'}}>
            Supprimer
          </button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'10px'}}>
          <div style={{width:'10px',height:'10px',borderRadius:'50%',background:couleur,flexShrink:0}}></div>
          <div style={{fontSize:'20px',fontWeight:'500',color:'#fff'}}>{titre || "Événement"}</div>
        </div>
        {recurrenceJours && recurrenceJours.length > 0 && (
          <div style={{display:'flex',alignItems:'center',gap:'5px',marginTop:'8px'}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            <span style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>
              Se répète tous les {recurrenceJours.map(i => JOURS[i]).join(', ')}
            </span>
          </div>
        )}
      </div>

      <div style={{padding:'20px 18px',display:'flex',flexDirection:'column',gap:'14px'}}>
        <div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Titre</label>
          <input value={titre} onChange={e => setTitre(e.target.value)}
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

        <button onClick={sauvegarder} style={{background:'#2B7FFF',color:'#fff',fontSize:'14px',fontWeight:'500',padding:'12px',borderRadius:'12px',border:'none',cursor:'pointer'}}>
          Enregistrer
        </button>
      </div>
    </main>
  )
}
