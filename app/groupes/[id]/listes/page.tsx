"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ListesPage() {
  const { id } = useParams()
  const router = useRouter()
  const [listes, setListes] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState("")

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) charger()
    })
  }, [])

  async function charger() {
    const { data } = await supabase.from("listes").select("*").eq("groupe_id", id).order("created_at", { ascending: false })
    setListes(data || [])
  }

  async function creerListe() {
    if (!titre.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("listes").insert({ groupe_id: id, titre, created_by: user?.id })
    setTitre(""); setShowForm(false); charger()
  }

  const IconList = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 28px'}}>
        <a href={`/groupes/${id}`} style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'8px'}}>← Retour au groupe</a>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:'20px',fontWeight:'500',color:'#fff'}}>Listes partagees</div>
          <button onClick={() => setShowForm(!showForm)}
            style={{background:'rgba(255,255,255,0.15)',border:'0.5px solid rgba(255,255,255,0.25)',borderRadius:'10px',padding:'8px 14px',color:'#fff',fontSize:'13px',cursor:'pointer'}}>
            + Nouvelle liste
          </button>
        </div>
      </div>

      <div style={{padding:'16px 14px'}}>
        {showForm && (
          <div style={{background:'#EEF5FF',borderRadius:'14px',padding:'14px',marginBottom:'14px',border:'0.5px solid #DCE9FF'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>Nouvelle liste</div>
            <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Courses juillet, Fournitures..."
              style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px',fontSize:'16px',color:'#1a1a2e',background:'#fff',marginBottom:'10px',boxSizing:'border-box'}}/>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={creerListe} style={{flex:1,background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'10px',padding:'10px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>Créer</button>
              <button onClick={() => setShowForm(false)} style={{flex:1,background:'#fff',color:'#666',border:'0.5px solid #E8F1FF',borderRadius:'10px',padding:'10px',fontSize:'13px',cursor:'pointer'}}>Annuler</button>
            </div>
          </div>
        )}

        {listes.length === 0 && (
          <div style={{textAlign:'center',padding:'48px 0'}}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" style={{margin:'0 auto 12px',display:'block'}}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            <div style={{fontSize:'14px',color:'#aaa'}}>Aucune liste pour l'instant</div>
            <div style={{fontSize:'12px',color:'#ccc',marginTop:'4px'}}>Crée une liste partagée avec le groupe</div>
          </div>
        )}

        {listes.map(l => (
          <div key={l.id} onClick={() => router.push(`/groupes/${id}/listes/${l.id}`)}
            style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'14px',marginBottom:'10px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'#EEF5FF',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#2B7FFF'}}>
              <IconList />
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e',marginBottom:'3px'}}>{l.titre}</div>
              <div style={{fontSize:'11px',color:'#aaa'}}>{new Date(l.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'long'})}</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>
    </main>
  )
}
