"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ouvrirConversationPrivee } from "@/lib/dm"

export default function FicheVendeur() {
  const { id } = useParams()
  const vendeurId = String(id)
  const [user, setUser] = useState<any>(null)
  const [profil, setProfil] = useState<any>(null)
  const [annonces, setAnnonces] = useState<any[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: p } = await supabase.from("profiles").select("*").eq("id", vendeurId).single()
      setProfil(p)
      const { data: a } = await supabase.from("marketplace_annonces").select("*").eq("user_id", vendeurId).order("created_at", { ascending: false })
      setAnnonces(a || [])
      const { data: f } = await supabase.from("marketplace_followers").select("*").eq("suivi_id", vendeurId)
      setFollowers(f || [])
      setChargement(false)
    }
    if (vendeurId) charger()
  }, [vendeurId])

  async function toggleSuivre() {
    if (!user) { window.location.href = "/connexion"; return }
    const dejaSuivi = followers.find(f => f.follower_id === user.id)
    if (dejaSuivi) {
      await supabase.from("marketplace_followers").delete().eq("id", dejaSuivi.id)
      setFollowers(prev => prev.filter(f => f.id !== dejaSuivi.id))
    } else {
      const { data } = await supabase.from("marketplace_followers").insert({ follower_id: user.id, suivi_id: vendeurId }).select().single()
      if (data) setFollowers(prev => [...prev, data])
    }
  }

  async function envoyerMessage() {
    if (!user) { window.location.href = "/connexion"; return }
    const idConv = await ouvrirConversationPrivee(supabase, user.id, vendeurId)
    if (idConv) window.location.href = "/groupes/" + idConv
  }

  if (chargement) return <div style={{padding:'32px',textAlign:'center',color:'#aaa',fontSize:'14px'}}>Chargement...</div>
  if (!profil) return <div style={{padding:'32px',textAlign:'center',color:'#aaa',fontSize:'14px'}}>Vendeur introuvable</div>

  const jeSuis = followers.some(f => f.follower_id === user?.id)
  const estMoi = user?.id === vendeurId
  const nomVendeur = profil.nom || "Membre"

  return (
    <main style={{minHeight:'100vh',background:'#f8faff'}}>
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',padding:'20px 18px 28px'}}>
        <a href="/marketplace" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',textDecoration:'none'}}>← Marketplace</a>
        <div style={{display:'flex',alignItems:'center',gap:'14px',marginTop:'16px'}}>
          {profil.avatar_url ? (
            <img src={profil.avatar_url} alt={nomVendeur} style={{width:'64px',height:'64px',borderRadius:'50%',objectFit:'cover',flexShrink:0,border:'2px solid rgba(255,255,255,0.3)'}}/>
          ) : (
            <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'24px',fontWeight:'600',flexShrink:0}}>
              {nomVendeur[0]?.toUpperCase()}
            </div>
          )}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:'19px',fontWeight:'600',color:'#fff'}}>{nomVendeur}</div>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)',marginTop:'2px'}}>{followers.length} follower{followers.length>1?'s':''} · {annonces.length} publication{annonces.length>1?'s':''}</div>
          </div>
        </div>
        {!estMoi && (
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
        )}
      </div>

      <div style={{padding:'16px 18px'}}>
        <div style={{fontSize:'13px',fontWeight:'600',color:'#1a1a2e',marginBottom:'12px'}}>Publications</div>
        {annonces.length === 0 && (
          <div style={{textAlign:'center',padding:'40px 0',color:'#aaa',fontSize:'13px'}}>Aucune publication pour l'instant</div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
          {annonces.map(a => (
            <a key={a.id} href={'/marketplace?annonce='+a.id} style={{textDecoration:'none'}}>
              <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'14px',overflow:'hidden'}}>
                <div style={{height:'110px',background:'linear-gradient(135deg,#EEF5FF,#DCE9FF)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {a.image_url ? (
                    <img src={a.image_url} alt={a.titre} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  )}
                </div>
                <div style={{padding:'8px 10px'}}>
                  <div style={{fontSize:'12px',fontWeight:'500',color:'#1a1a2e',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.titre}</div>
                  <div style={{fontSize:'13px',fontWeight:'700',color:'#2B7FFF'}}>{parseFloat(a.prix).toFixed(0)} CHF</div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
