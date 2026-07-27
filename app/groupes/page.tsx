"use client"
import Tutorial from "../components/Tutorial"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Groupes() {
  const [groupes, setGroupes] = useState<any[]>([])
  const [mesGroupes, setMesGroupes] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)
  const [nom, setNom] = useState("")
  const [description, setDescription] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data } = await supabase.from("groupes").select("*").order("created_at", { ascending: false })
      setGroupes(data || [])
      if (user) {
        const { data: membres } = await supabase.from("membres_groupe").select("groupe_id").eq("user_id", user.id)
        setMesGroupes(membres?.map((m: any) => m.groupe_id) || [])
      }
    }
    charger()
  }, [])

  async function creerGroupe() {
    if (!user) { window.location.href = "/connexion"; return }
    if (!nom) { setMessage("Donne un nom au groupe !"); return }
    const { data, error } = await supabase.from("groupes").insert({
      nom, description, created_by: user.id
    }).select().single()
    if (error) {
      setMessage("Erreur : " + error.message)
    } else {
      await supabase.from("membres_groupe").insert({ groupe_id: data.id, user_id: user.id })
      setMessage("Groupe créé !")
      setNom("")
      setDescription("")
      setShowForm(false)
      window.location.href = `/groupes/${data.id}`
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',padding:'20px 18px 24px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:'22px',fontWeight:'600',color:'#fff'}}>Groupes</div>
          <button onClick={() => setShowForm(!showForm)}
            style={{background:'rgba(255,255,255,0.15)',border:'0.5px solid rgba(255,255,255,0.25)',color:'#fff',borderRadius:'99px',padding:'8px 16px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>
            + Créer
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{padding:'14px',background:'#EEF5FF',borderBottom:'0.5px solid #DCE9FF'}}>
          <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom du groupe"
            style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px',fontSize:'16px',marginBottom:'8px',boxSizing:'border-box'}}/>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optionnel)"
            style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px',fontSize:'16px',marginBottom:'8px',boxSizing:'border-box'}}/>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={creerGroupe} style={{flex:1,background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'10px',padding:'10px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>Créer</button>
            <button onClick={() => setShowForm(false)} style={{flex:1,background:'#fff',color:'#666',border:'0.5px solid #E8F1FF',borderRadius:'10px',padding:'10px',fontSize:'13px',cursor:'pointer'}}>Annuler</button>
          </div>
        </div>
      )}

      <div>
        {groupes.map((g, i) => {
          const couleur = [
            {bg:'#EEF5FF',stroke:'#2B7FFF'},
            {bg:'#E1F5EE',stroke:'#10B981'},
            {bg:'#FDF8EC',stroke:'#D4A843'},
            {bg:'#F3E8FF',stroke:'#8B5CF6'},
            {bg:'#FFE4E6',stroke:'#F43F5E'},
          ][i % 5]
          return (
            <a key={g.id} href={'/groupes/'+g.id} style={{textDecoration:'none',display:'block'}}>
              <div style={{display:'flex',alignItems:'center',gap:'14px',padding:'14px 18px',borderBottom:'0.5px solid #f5f5f5',cursor:'pointer'}}>
                <div style={{width:'52px',height:'52px',borderRadius:'50%',background:couleur.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={couleur.stroke} strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'3px'}}>
                    <div style={{fontSize:'15px',fontWeight:'500',color:'#1a1a2e'}}>{g.nom}</div>
                    <div style={{fontSize:'12px',color:'#aaa'}}>{new Date(g.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
                  </div>
                  <div style={{fontSize:'13px',color:'#aaa',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{g.description || 'Aucune description'}</div>
                </div>
              </div>
            </a>
          )
        })}

        {groupes.length === 0 && (
          <div style={{textAlign:'center',padding:'60px 20px'}}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" style={{margin:'0 auto 12px',display:'block'}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
            <div style={{fontSize:'14px',color:'#aaa'}}>Aucun groupe pour l'instant</div>
            <div style={{fontSize:'12px',color:'#ccc',marginTop:'4px'}}>Crée un groupe ou rejoins-en un</div>
          </div>
        )}
      </div>
    </main>
  )
}