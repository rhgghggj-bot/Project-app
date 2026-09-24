"use client"
import { useEscape } from "@/lib/a11y"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ouvrirConversationPrivee } from "@/lib/dm"
import Card from "@/app/components/ui/Card"
import { colors } from "@/app/components/ui/tokens"

export default function FicheVendeur() {
  const { id } = useParams()
  const vendeurId = String(id)
  const [user, setUser] = useState<any>(null)
  const [profil, setProfil] = useState<any>(null)
  const [annonces, setAnnonces] = useState<any[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [abonnements, setAbonnements] = useState<any[]>([])
  const [chargement, setChargement] = useState(true)
  const [listeOuverte, setListeOuverte] = useState<"followers" | "abonnements" | null>(null)
  useEscape(!!listeOuverte, () => setListeOuverte(null))
  const [profilsListe, setProfilsListe] = useState<any[]>([])
  const [avis, setAvis] = useState<any[]>([])
  const [profilsAvis, setProfilsAvis] = useState<Record<string, any>>({})

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: p } = await supabase.from("profiles").select("*").eq("id", vendeurId).single()
      setProfil(p)
      const { data: a } = await supabase.from("marketplace_annonces").select("*").eq("user_id", vendeurId).neq("statut", "vendu").order("created_at", { ascending: false })
      setAnnonces(a || [])
      const { data: f } = await supabase.from("marketplace_followers").select("*").eq("suivi_id", vendeurId)
      setFollowers(f || [])
      const { data: ab } = await supabase.from("marketplace_followers").select("*").eq("suiveur_id", vendeurId)
      setAbonnements(ab || [])
      const { data: av } = await supabase.from("marketplace_avis").select("*").eq("cible_id", vendeurId).order("created_at", { ascending: false })
      setAvis(av || [])
      if (av && av.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id,nom").in("id", av.map((a: any) => a.auteur_id))
        const map: Record<string, any> = {}
        profs?.forEach((pr: any) => { map[pr.id] = pr })
        setProfilsAvis(map)
      }
      setChargement(false)
    }
    if (vendeurId) charger()
  }, [vendeurId])

  async function toggleSuivre() {
    if (!user) { window.location.href = "/connexion"; return }
    const dejaSuivi = followers.find(f => f.suiveur_id === user.id)
    if (dejaSuivi) {
      await supabase.from("marketplace_followers").delete().eq("id", dejaSuivi.id)
      setFollowers(prev => prev.filter(f => f.id !== dejaSuivi.id))
    } else {
      const { data } = await supabase.from("marketplace_followers").insert({ suiveur_id: user.id, suivi_id: vendeurId }).select().single()
      if (data) setFollowers(prev => [...prev, data])
    }
  }

  async function envoyerMessage() {
    if (!user) { window.location.href = "/connexion"; return }
    const idConv = await ouvrirConversationPrivee(supabase, user.id, vendeurId)
    if (idConv) window.location.href = "/groupes/" + idConv
  }

  async function ouvrirListe(type: "followers" | "abonnements") {
    const source = type === "followers" ? followers : abonnements
    const ids = source.map(f => type === "followers" ? f.suiveur_id : f.suivi_id)
    if (ids.length === 0) { setProfilsListe([]); setListeOuverte(type); return }
    const { data } = await supabase.from("profiles").select("id,nom,avatar_url").in("id", ids)
    setProfilsListe(data || [])
    setListeOuverte(type)
  }

  if (chargement) return <div style={{padding:'32px',textAlign:'center',color:'#aaa',fontSize:'14px'}}>Chargement…</div>
  if (!profil) return <div style={{padding:'32px',textAlign:'center',color:'#aaa',fontSize:'14px'}}>Vendeur introuvable</div>

  const jeSuis = followers.some(f => f.suiveur_id === user?.id)
  const estMoi = user?.id === vendeurId
  const nomVendeur = profil.nom || "Membre"

  return (
    <main style={{minHeight:'100vh',background:'#f8faff'}}>
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',padding:'20px 18px 28px'}}>
        <Link href="/marketplace" transitionTypes={['nav-back']} style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',textDecoration:'none'}}>← Marketplace</Link>
        <div style={{display:'flex',alignItems:'center',gap:'16px',marginTop:'16px'}}>
          {profil.avatar_url ? (
            <img src={profil.avatar_url} alt={nomVendeur} style={{width:'72px',height:'72px',borderRadius:'50%',objectFit:'cover',flexShrink:0,border:'2px solid rgba(255,255,255,0.3)'}}/>
          ) : (
            <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'26px',fontWeight:'600',flexShrink:0}}>
              {nomVendeur[0]?.toUpperCase()}
            </div>
          )}
          <div style={{flex:1,display:'flex',justifyContent:'space-around'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'22px',fontWeight:'700',color:'#fff'}}>{annonces.length}</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.6)',marginTop:'2px'}}>publication{annonces.length>1?'s':''}</div>
            </div>
            <button onClick={() => ouvrirListe("followers")} style={{background:'none',border:'none',cursor:'pointer',textAlign:'center'}}>
              <div style={{fontSize:'22px',fontWeight:'700',color:'#fff'}}>{followers.length}</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.6)',marginTop:'2px'}}>follower{followers.length>1?'s':''}</div>
            </button>
            <button onClick={() => ouvrirListe("abonnements")} style={{background:'none',border:'none',cursor:'pointer',textAlign:'center'}}>
              <div style={{fontSize:'22px',fontWeight:'700',color:'#fff'}}>{abonnements.length}</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.6)',marginTop:'2px'}}>abonnement{abonnements.length>1?'s':''}</div>
            </button>
          </div>
        </div>
        <div style={{fontSize:'17px',fontWeight:'600',color:'#fff',marginTop:'14px'}}>{nomVendeur}</div>
        {avis.length > 0 && (
          <div style={{display:'flex',alignItems:'center',gap:'4px',marginTop:'4px'}}>
            <span style={{color:'#D4A843',fontSize:'13px'}}>★</span>
            <span style={{fontSize:'13px',fontWeight:'600',color:'#fff'}}>{(avis.reduce((s,a)=>s+a.note,0)/avis.length).toFixed(1)}</span>
            <span style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>({avis.length} avis)</span>
          </div>
        )}
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

        {avis.length > 0 && (
          <div style={{marginTop:'20px'}}>
            <div style={{fontSize:'13px',fontWeight:'600',color:colors.text,marginBottom:'12px'}}>Avis ({avis.length})</div>
            {avis.map(a => (
              <Card key={a.id} style={{marginBottom:'8px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                  <span style={{fontSize:'13px',fontWeight:500,color:colors.text}}>{profilsAvis[a.auteur_id]?.nom || 'Acheteur'}</span>
                  <span style={{color:colors.gold,fontSize:'13px'}}>{'★'.repeat(a.note)}{'☆'.repeat(5-a.note)}</span>
                </div>
                {a.commentaire && <div style={{fontSize:'12px',color:colors.textMuted,lineHeight:1.5}}>{a.commentaire}</div>}
              </Card>
            ))}
          </div>
        )}
      </div>

      {listeOuverte && (
        <div role="presentation" onClick={() => setListeOuverte(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:200,display:'flex',alignItems:'flex-end'}}>
          <div role="dialog" aria-modal="true" onClick={e => e.stopPropagation()} style={{width:'100%',maxHeight:'70vh',overflowY:'auto',background:'#fff',borderRadius:'22px 22px 0 0',padding:'10px 18px 24px'}}>
            <div style={{width:'36px',height:'4px',background:'#E8F1FF',borderRadius:'99px',margin:'6px auto 14px'}}></div>
            <div style={{fontSize:'15px',fontWeight:'600',color:'#1a1a2e',marginBottom:'12px'}}>{listeOuverte === "followers" ? "Followers" : "Abonnements"}</div>
            {profilsListe.length === 0 && <div style={{textAlign:'center',padding:'24px 0',color:'#aaa',fontSize:'13px'}}>Personne pour l'instant</div>}
            {profilsListe.map((p: any) => (
              <a key={p.id} href={'/vendeur/'+p.id} style={{textDecoration:'none',display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'0.5px solid #F5F8FC'}}>
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
