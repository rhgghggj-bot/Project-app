"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ouvrirConversationPrivee } from "@/lib/dm"

export default function ProfilPublic() {
  const { id } = useParams()
  const profilId = String(id)
  const [user, setUser] = useState<any>(null)
  const [profil, setProfil] = useState<any>(null)
  const [projets, setProjets] = useState<any[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user && user.id === profilId) { window.location.href = "/profile"; return }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", profilId).single()
      setProfil(p)
      const { data: pj } = await supabase.from("projets").select("*").eq("user_id", profilId).eq("prive", false).order("created_at", { ascending: false })
      setProjets(pj || [])
      const { data: f } = await supabase.from("app_followers").select("*").eq("suivi_id", profilId)
      setFollowers(f || [])
      setChargement(false)
    }
    if (profilId) charger()
  }, [profilId])

  async function toggleSuivre() {
    if (!user) { window.location.href = "/connexion"; return }
    const dejaSuivi = followers.find(f => f.follower_id === user.id)
    if (dejaSuivi) {
      await supabase.from("app_followers").delete().eq("id", dejaSuivi.id)
      setFollowers(prev => prev.filter(f => f.id !== dejaSuivi.id))
    } else {
      const { data } = await supabase.from("app_followers").insert({ follower_id: user.id, suivi_id: profilId }).select().single()
      if (data) setFollowers(prev => [...prev, data])
    }
  }

  async function envoyerMessage() {
    if (!user) { window.location.href = "/connexion"; return }
    const idConv = await ouvrirConversationPrivee(supabase, user.id, profilId)
    if (idConv) window.location.href = "/groupes/" + idConv
  }

  if (chargement) return <div style={{padding:'32px',textAlign:'center',color:'#aaa',fontSize:'14px'}}>Chargement...</div>
  if (!profil) return <div style={{padding:'32px',textAlign:'center',color:'#aaa',fontSize:'14px'}}>Profil introuvable</div>

  const jeSuis = followers.some(f => f.follower_id === user?.id)
  const nom = profil.nom || "Membre"

  return (
    <main style={{minHeight:'100vh',background:'#f8faff'}}>
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',padding:'20px 18px 28px'}}>
        <a href="/" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',textDecoration:'none'}}>← Accueil</a>
        <div style={{display:'flex',alignItems:'center',gap:'14px',marginTop:'16px'}}>
          {profil.avatar_url ? (
            <img src={profil.avatar_url} alt={nom} style={{width:'64px',height:'64px',borderRadius:'50%',objectFit:'cover',flexShrink:0,border:'2px solid rgba(255,255,255,0.3)'}}/>
          ) : (
            <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'24px',fontWeight:'600',flexShrink:0}}>
              {nom[0]?.toUpperCase()}
            </div>
          )}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'19px',fontWeight:'600',color:'#fff'}}>{nom}</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)',marginTop:'2px'}}>{followers.length} follower{followers.length>1?'s':''} · {projets.length} projet{projets.length>1?'s':''}</div>
          </div>
        </div>
        {profil.bio && <div style={{fontSize:'13px',color:'rgba(255,255,255,0.75)',marginTop:'12px',lineHeight:'1.5'}}>{profil.bio}</div>}
        <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
          <button onClick={toggleSuivre}
            style={{flex:1,background: jeSuis ? 'rgba(255,255,255,0.15)' : '#fff',color: jeSuis ? '#fff' : '#1a3a6e',border: jeSuis ? '0.5px solid rgba(255,255,255,0.3)' : 'none',borderRadius:'12px',padding:'11px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>
            {jeSuis ? 'Suivi ✓' : 'Suivre'}
          </button>
          <button onClick={envoyerMessage}
            style={{flex:1,background:'rgba(255,255,255,0.15)',color:'#fff',border:'0.5px solid rgba(255,255,255,0.3)',borderRadius:'12px',padding:'11px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>
            Envoyer un message
          </button>
        </div>
      </div>

      <div style={{padding:'16px 18px'}}>
        <div style={{fontSize:'13px',fontWeight:'600',color:'#1a1a2e',marginBottom:'12px'}}>Projets publiés</div>
        {projets.length === 0 && (
          <div style={{textAlign:'center',padding:'40px 0',color:'#aaa',fontSize:'13px'}}>Aucun projet publié pour l'instant</div>
        )}
        {projets.map(projet => (
          <a key={projet.id} href={'/projet/'+projet.id} style={{textDecoration:'none',display:'block',marginBottom:'10px'}}>
            <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'6px'}}>
                <span style={{fontSize:'10px',background:'#EEF5FF',color:'#2B7FFF',padding:'2px 8px',borderRadius:'99px',fontWeight:'500'}}>{projet.categorie}</span>
              </div>
              <div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e',marginBottom:'4px'}}>{projet.titre}</div>
              <div style={{fontSize:'12px',color:'#666',lineHeight:'1.5'}}>{projet.description}</div>
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}
