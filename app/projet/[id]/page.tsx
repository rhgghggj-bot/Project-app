"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import QRCodeComponent from "../../components/QRCode"

export default function Projet() {
  const { id } = useParams()
  const [projet, setProjet] = useState<any>(null)
  const [commentaires, setCommentaires] = useState<any[]>([])
  const [contenu, setContenu] = useState("")
  const [user, setUser] = useState<any>(null)
  const [likes, setLikes] = useState<any[]>([])

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: p } = await supabase.from("projets").select("*").eq("id", id).single()
      setProjet(p)
      const { data: c } = await supabase.from("commentaires").select("*").eq("projet_id", id).order("created_at", { ascending: true })
      setCommentaires(c || [])
      const { data: l } = await supabase.from("projets_likes").select("*").eq("projet_id", id)
      setLikes(l || [])
    }
    charger()
  }, [id])

  async function commenter() {
    if (!contenu || !user) return
    const { error } = await supabase.from("commentaires").insert({
      projet_id: id,
      user_id: user.id,
      contenu
    })
    if (!error) {
      setContenu("")
      const { data: c } = await supabase.from("commentaires").select("*").eq("projet_id", id).order("created_at", { ascending: true })
      setCommentaires(c || [])
    }
  }

  async function toggleLike() {
    if (!user) { window.location.href = "/connexion"; return }
    const dejaLike = likes.find(l => l.user_id === user.id)
    if (dejaLike) {
      await supabase.from("projets_likes").delete().eq("id", dejaLike.id)
      setLikes(prev => prev.filter(l => l.id !== dejaLike.id))
    } else {
      const { data } = await supabase.from("projets_likes").insert({ projet_id: id, user_id: user.id }).select().single()
      if (data) setLikes(prev => [...prev, data])
    }
  }

  if (!projet) return <div style={{padding:'32px',textAlign:'center',color:'#aaa',fontSize:'14px'}}>Chargement...</div>

  const jaimeMoi = likes.some(l => l.user_id === user?.id)

  return (
    <main style={{minHeight:'100vh',background:'#f8faff'}}>
      <div style={{padding:'16px 18px',background:'#fff',borderBottom:'0.5px solid #E8F1FF',display:'flex',alignItems:'center',gap:'12px'}}>
        <a href="/" style={{fontSize:'12px',color:'#aaa',textDecoration:'none'}}>← Retour</a>
        <h1 style={{fontSize:'15px',fontWeight:'500',color:'#1a1a2e',margin:0}}>{projet.titre}</h1>
      </div>
      <div style={{padding:'16px 18px'}}>
        <div style={{background:'#fff',borderRadius:'18px',border:'0.5px solid #E8F1FF',overflow:'hidden',marginBottom:'16px'}}>
          <div style={{height:'128px',background:'linear-gradient(135deg,#1a3a6e,#2B7FFF)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.85"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div style={{padding:'16px'}}>
            <span style={{fontSize:'11px',background:'#EEF5FF',color:'#2B7FFF',padding:'3px 10px',borderRadius:'99px',fontWeight:'500'}}>{projet.categorie}</span>
            <h2 style={{fontSize:'16px',fontWeight:'600',color:'#1a1a2e',marginTop:'10px',marginBottom:'8px'}}>{projet.titre}</h2>
            <p style={{fontSize:'13px',color:'#666',lineHeight:'1.6',marginBottom:'14px'}}>{projet.description}</p>

            <button onClick={toggleLike}
              style={{display:'flex',alignItems:'center',gap:'6px',background: jaimeMoi ? '#FFE4E6' : '#F8FBFF',border:'0.5px solid #E8F1FF',borderRadius:'99px',padding:'8px 14px',cursor:'pointer',marginBottom:'14px'}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill={jaimeMoi ? '#F43F5E' : 'none'} stroke={jaimeMoi ? '#F43F5E' : '#aaa'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{likes.length}</span>
            </button>

            {projet.image_url && (
              <div style={{background:'#F8FBFF',borderRadius:'14px',padding:'12px',display:'flex',alignItems:'center',gap:'12px'}}>
                <QRCodeComponent lien={projet.image_url} />
                <div>
                  <p style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',margin:'0 0 2px'}}>Soutenir via Revolut</p>
                  <a href={projet.image_url} target="_blank" rel="noopener noreferrer" style={{fontSize:'12px',color:'#2B7FFF'}}>{projet.image_url}</a>
                </div>
              </div>
            )}
          </div>
        </div>

        <p style={{fontSize:'12px',color:'#aaa',fontWeight:'500',marginBottom:'12px'}}>Conseils & commentaires</p>
        {commentaires.length === 0 && (
          <p style={{fontSize:'13px',color:'#aaa',textAlign:'center',padding:'16px 0'}}>Sois le premier à laisser un conseil !</p>
        )}
        {commentaires.map((c: any) => (
          <div key={c.id} style={{display:'flex',gap:'10px',marginBottom:'10px'}}>
            <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'#2B7FFF',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'11px',fontWeight:'500',flexShrink:0}}>
              {c.user_id.slice(0, 2).toUpperCase()}
            </div>
            <div style={{background:'#fff',borderRadius:'14px',padding:'10px 14px',flex:1,border:'0.5px solid #E8F1FF'}}>
              <p style={{fontSize:'13px',color:'#333',margin:0}}>{c.contenu}</p>
            </div>
          </div>
        ))}
        <div style={{display:'flex',gap:'8px',marginTop:'14px',alignItems:'center'}}>
          <input
            type="text"
            placeholder="Laisser un conseil..."
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            onKeyDown={e => e.key === "Enter" && commenter()}
            style={{flex:1,border:'1px solid #E8F1FF',borderRadius:'99px',padding:'10px 16px',fontSize:'14px',color:'#1a1a2e',background:'#fff',outline:'none'}}
          />
          <button onClick={commenter} style={{background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'99px',padding:'10px 18px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>
            Envoyer
          </button>
        </div>
      </div>
    </main>
  )
}
