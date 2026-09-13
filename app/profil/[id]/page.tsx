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
  const [abonnements, setAbonnements] = useState<any[]>([])
  const [chargement, setChargement] = useState(true)
  const [listeOuverte, setListeOuverte] = useState<"followers" | "abonnements" | null>(null)
  const [profilsListe, setProfilsListe] = useState<any[]>([])

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
      const { data: ab } = await supabase.from("app_followers").select("*").eq("follower_id", profilId)
      setAbonnements(ab || [])
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

  async function ouvrirListe(type: "followers" | "abonnements") {
    const source = type === "followers" ? followers : abonnements
    const ids = source.map(f => type === "followers" ? f.follower_id : f.suivi_id)
    if (ids.length === 0) { setProfilsListe([]); setListeOuverte(type); return }
    const { data } = await supabase.from("profiles").select("id,nom,avatar_url").in("id", ids)
    setProfilsListe(data || [])
    setListeOuverte(type)
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
            <div style={{display:'flex',gap:'10px',marginTop:'4px'}}>
              <button onClick={() => ouvrirListe("followers")} style={{background:'none',border:'none',padding:0,cursor:'pointer',fontSize:'13px',color:'rgba(255,255,255,0.75)'}}>
                <b style={{color:'#fff'}}>{followers.length}</b> follower{followers.length>1?'s':''}
              </button>
              <button onClick={() => ouvrirListe("abonnements")} style={{background:'none',border:'none',padding:0,cursor:'pointer',fontSize:'13px',color:'rgba(255,255,255,0.75)'}}>
                <b style={{color:'#fff'}}>{abonnements.length}</b> abonnement{abonnements.length>1?'s':''}
              </button>
            </div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginTop:'2px'}}>{projets.length} projet{projets.length>1?'s':''}</div>
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

      {listeOuverte && (
        <div onClick={() => setListeOuverte(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'flex-end'}}>
          <div onClick={e => e.stopPropagation()} style={{width:'100%',maxHeight:'70vh',overflowY:'auto',background:'#fff',borderRadius:'22px 22px 0 0',padding:'10px 18px 24px'}}>
            <div style={{width:'36px',height:'4px',background:'#E8F1FF',borderRadius:'99px',margin:'6px auto 14px'}}></div>
            <div style={{fontSize:'15px',fontWeight:'600',color:'#1a1a2e',marginBottom:'12px'}}>{listeOuverte === "followers" ? "Followers" : "Abonnements"}</div>
            {profilsListe.length === 0 && <div style={{textAlign:'center',padding:'24px 0',color:'#aaa',fontSize:'13px'}}>Personne pour l'instant</div>}
            {profilsListe.map((p: any) => (
              <a key={p.id} href={'/profil/'+p.id} style={{textDecoration:'none',display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'0.5px solid #F5F8FC'}}>
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.nom} style={{width:'40px',height:'40px',borderRadius:'50%',objectFit:'cover'}}/>
                ) : (
                  <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'linear-gradient(135deg,#2B7FFF,#8B5CF6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'14px',fontWeight:'600'}}>
                    {(p.nom || "M")[0]?.toUpperCase()}
                  </div>
                )}
                <div style={{fontSize:'14px',color:'#1a1a2e',fontWeight:'500'}}>{p.nom || "Membre"}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
