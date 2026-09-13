"use client"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

const CATEGORIES = ["Tout","Mode","Électronique","Maison","Sport","Autre"]

function IconeCat({ cat, size = 14 }: { cat: string; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  switch (cat) {
    case "Mode": return <svg {...p}><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>
    case "Électronique": return <svg {...p}><rect x="4" y="4" width="16" height="12" rx="1"/><line x1="8" y1="20" x2="16" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/></svg>
    case "Maison": return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    case "Sport": return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20M2 12h20"/></svg>
    case "Alimentation": return <svg {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
    default: return <svg {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
  }
}

export default function Marketplace() {
  const [onglet, setOnglet] = useState("portfolio")
  const [user, setUser] = useState<any>(null)
  const [articles, setArticles] = useState<any[]>([])
  const [annonces, setAnnonces] = useState<any[]>([])
  const [modeShopping, setModeShopping] = useState(false)
  const [filtre, setFiltre] = useState("Tout")
  const [showForm, setShowForm] = useState(false)
  const [showFormAnnonce, setShowFormAnnonce] = useState(false)
  const [nom, setNom] = useState("")
  const [prix, setPrix] = useState("")
  const [quantite, setQuantite] = useState(1)
  const [categorie, setCategorie] = useState("Autre")
  const [titreAnnonce, setTitreAnnonce] = useState("")
  const [etatAnnonce, setEtatAnnonce] = useState("Bon état")
  const [imageAnnonce, setImageAnnonce] = useState<File|null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [descAnnonce, setDescAnnonce] = useState("")
  const [prixAnnonce, setPrixAnnonce] = useState("")
  const [catAnnonce, setCatAnnonce] = useState("Autre")
  const [annonceOuverte, setAnnonceOuverte] = useState<any>(null)
  const [profilsVendeurs, setProfilsVendeurs] = useState<any>({})
  const [animCoeurs, setAnimCoeurs] = useState<Record<string, { id: number; x: number; delay: number; size: number; rot: number; couleur: string }[]>>({})
  const [menuOuvertId, setMenuOuvertId] = useState<string | null>(null)
  const [confirmSupprId, setConfirmSupprId] = useState<string | null>(null)
  const [favoris, setFavoris] = useState<any[]>([])
  const [signales, setSignales] = useState<string[]>([])
  const [likes, setLikes] = useState<any[]>([])
  const [commentaires, setCommentaires] = useState<any[]>([])
  const [profilsCommentaires, setProfilsCommentaires] = useState<any>({})
  const [nouveauCommentaire, setNouveauCommentaire] = useState("")

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      chargerAnnonces()
      chargerLikes()
      chargerCommentaires()
      if (user) { chargerArticles(); chargerFavoris(user.id) }
    })
  }, [])

  async function chargerFavoris(userId: string) {
    const { data } = await supabase.from("marketplace_favoris").select("*").eq("user_id", userId)
    setFavoris(data || [])
  }

  async function toggleFavori(annonceId: string) {
    if (!user) { alert("Connecte-toi pour enregistrer une annonce"); return }
    const dejaFavori = favoris.find(f => f.annonce_id === annonceId && f.user_id === user.id)
    if (dejaFavori) {
      await supabase.from("marketplace_favoris").delete().eq("id", dejaFavori.id)
      setFavoris(prev => prev.filter(f => f.id !== dejaFavori.id))
    } else {
      const { data } = await supabase.from("marketplace_favoris").insert({ annonce_id: annonceId, user_id: user.id }).select().single()
      if (data) setFavoris(prev => [...prev, data])
    }
    setMenuOuvertId(null)
  }

  async function signalerAnnonce(annonceId: string) {
    if (!user) { alert("Connecte-toi pour signaler une annonce"); return }
    await supabase.from("marketplace_signalements").insert({ annonce_id: annonceId, user_id: user.id })
    setSignales(prev => [...prev, annonceId])
    setMenuOuvertId(null)
  }

  async function chargerLikes() {
    const { data } = await supabase.from("marketplace_likes").select("*")
    setLikes(data || [])
  }

  async function chargerCommentaires() {
    const { data } = await supabase.from("marketplace_commentaires").select("*").order("created_at", { ascending: true })
    setCommentaires(data || [])
    if (data && data.length > 0) {
      const ids = Array.from(new Set(data.map((c: any) => c.user_id)))
      const { data: profs } = await supabase.from("profiles").select("id,nom").in("id", ids)
      const map: any = {}
      profs?.forEach((p: any) => { map[p.id] = p.nom || "Membre" })
      setProfilsCommentaires(map)
    }
  }

  async function toggleLike(annonceId: string) {
    if (!user) { alert("Connecte-toi pour aimer une annonce"); return }
    const dejaLike = likes.find(l => l.annonce_id === annonceId && l.user_id === user.id)
    if (dejaLike) {
      await supabase.from("marketplace_likes").delete().eq("id", dejaLike.id)
      setLikes(prev => prev.filter(l => l.id !== dejaLike.id))
    } else {
      const { data } = await supabase.from("marketplace_likes").insert({ annonce_id: annonceId, user_id: user.id }).select().single()
      if (data) setLikes(prev => [...prev, data])
    }
  }

  async function ajouterCommentaire() {
    if (!nouveauCommentaire.trim() || !annonceOuverte || !user) return
    const { data, error } = await supabase.from("marketplace_commentaires").insert({
      annonce_id: annonceOuverte.id, user_id: user.id, contenu: nouveauCommentaire.trim()
    }).select().single()
    if (!error && data) {
      setCommentaires(prev => [...prev, data])
      setProfilsCommentaires((prev: any) => ({ ...prev, [user.id]: prev[user.id] || "Toi" }))
      setNouveauCommentaire("")
    }
  }

  async function supprimerCommentaire(id: string) {
    await supabase.from("marketplace_commentaires").delete().eq("id", id)
    setCommentaires(prev => prev.filter(c => c.id !== id))
  }

  async function chargerArticles() {
    const { data } = await supabase.from("portfolio_articles").select("*").order("created_at", { ascending: true })
    setArticles(data || [])
  }

  async function chargerAnnonces() {
    const { data } = await supabase.from("marketplace_annonces").select("*").order("created_at", { ascending: false })
    setAnnonces(data || [])
    if (data && data.length > 0) {
      const ids = Array.from(new Set(data.map((a: any) => a.user_id)))
      const { data: profs } = await supabase.from("profiles").select("id,nom").in("id", ids)
      const map: any = {}
      profs?.forEach((p: any) => { map[p.id] = p.nom || "Membre" })
      setProfilsVendeurs(map)
    }
  }

  const ROUGES = ['#F43F5E', '#FF6B81', '#FB7185', '#E11D48', '#DC2626', '#FF8FA3', '#BE123C']
  const dernierTapRef = useRef<{ id: string; heure: number }>({ id: "", heure: 0 })
  const tapTimeoutRef = useRef<any>(null)

  function onTapImage(a: any) {
    const maintenant = Date.now()
    if (dernierTapRef.current.id === a.id && maintenant - dernierTapRef.current.heure < 300) {
      if (tapTimeoutRef.current) { clearTimeout(tapTimeoutRef.current); tapTimeoutRef.current = null }
      dernierTapRef.current = { id: "", heure: 0 }
      doubleTapLike(a.id)
    } else {
      dernierTapRef.current = { id: a.id, heure: maintenant }
      tapTimeoutRef.current = setTimeout(() => { setAnnonceOuverte(a) }, 280)
    }
  }

  function doubleTapLike(annonceId: string) {
    if (!user) { alert("Connecte-toi pour aimer une annonce"); return }
    const dejaLike = likes.find(l => l.annonce_id === annonceId && l.user_id === user.id)
    if (!dejaLike) toggleLike(annonceId)
    const coeurs = Array.from({ length: 14 }, (_, i) => ({
      id: Date.now() + i,
      x: 15 + Math.random() * 70,
      delay: Math.random() * 0.25,
      size: 18 + Math.random() * 30,
      rot: (Math.random() - 0.5) * 50,
      couleur: ROUGES[Math.floor(Math.random() * ROUGES.length)]
    }))
    setAnimCoeurs(prev => ({ ...prev, [annonceId]: coeurs }))
    setTimeout(() => setAnimCoeurs(prev => { const n = { ...prev }; delete n[annonceId]; return n }), 1100)
  }

  async function ajouterArticle() {
    if (!nom.trim()) return
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return
    await supabase.from("portfolio_articles").insert({ user_id: u.id, nom, prix: parseFloat(prix.replace(",",".")) || 0, quantite, categorie })
    setNom(""); setPrix(""); setQuantite(1); setShowForm(false); chargerArticles()
  }

  async function changerQte(art: any, delta: number) {
    const newQ = Math.max(0, art.quantite + delta)
    await supabase.from("portfolio_articles").update({ quantite: newQ }).eq("id", art.id)
    setArticles(articles.map(a => a.id === art.id ? { ...a, quantite: newQ } : a))
  }

  async function cocherShopping(art: any) {
    const newC = !art.coche_shopping
    await supabase.from("portfolio_articles").update({ coche_shopping: newC }).eq("id", art.id)
    setArticles(articles.map(a => a.id === art.id ? { ...a, coche_shopping: newC } : a))
  }

  async function supprimerArticle(id: string) {
    await supabase.from("portfolio_articles").delete().eq("id", id)
    setArticles(articles.filter(a => a.id !== id))
  }

  async function supprimerAnnonce(id: string) {
    const { error } = await supabase.from("marketplace_annonces").delete().eq("id", id)
    if (!error) setAnnonces(prev => prev.filter(a => a.id !== id))
  }

  async function ajouterAnnonce() {
    if (!titreAnnonce.trim()) return
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { alert("Connecte-toi pour publier"); return }
    let imageUrl = ""
    if (imageAnnonce) {
      const ext = imageAnnonce.name.split(".").pop()
      const path = u.id + "/" + Date.now() + "." + ext
      const { error: upErr } = await supabase.storage.from("marketplace").upload(path, imageAnnonce)
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("marketplace").getPublicUrl(path)
        imageUrl = urlData.publicUrl
      }
    }
    const { error } = await supabase.from("marketplace_annonces").insert({
      user_id: u.id, titre: titreAnnonce, description: descAnnonce,
      prix: parseFloat(prixAnnonce.replace(",",".")) || 0,
      categorie: catAnnonce, image_url: imageUrl, etat: etatAnnonce
    })
    if (error) { alert("Erreur: " + error.message); return }
    setTitreAnnonce(""); setDescAnnonce(""); setPrixAnnonce("")
    setImageAnnonce(null); setImagePreview(""); setShowFormAnnonce(false)
    chargerAnnonces()
  }

  const total = articles.reduce((sum, a) => sum + (parseFloat(a.prix || 0) * a.quantite), 0)
  const annoncesFiltrees = annonces.filter(a => filtre === "Tout" || a.categorie === filtre)
  const inp: any = { width:"100%", border:"1px solid #E8F1FF", borderRadius:"10px", padding:"10px 12px", fontSize:"16px", color:"#1a1a2e", background:"#fff", marginBottom:"8px", boxSizing:"border-box" }

  function renderPost(a: any) {
              const nbLikes = likes.filter(l => l.annonce_id === a.id).length
              const jaime = likes.some(l => l.annonce_id === a.id && l.user_id === user?.id)
              const vendeur = profilsVendeurs[a.user_id] || "Membre"
              return (
              <div key={a.id} style={{background:"#fff",borderRadius:"16px",border:"0.5px solid #E8F1FF",overflow:"hidden",boxShadow:"0 4px 16px rgba(43,127,255,0.06)"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"12px 14px"}}>
                  <div style={{width:"34px",height:"34px",borderRadius:"50%",background:"linear-gradient(135deg,#2B7FFF,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:"13px",fontWeight:"600",flexShrink:0}}>
                    {vendeur[0]?.toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"13px",fontWeight:"600",color:"#1a1a2e"}}>{vendeur}</div>
                    <div style={{fontSize:"11px",color:"#aaa"}}>{a.categorie}</div>
                  </div>
                  {a.etat && <div style={{flexShrink:0,background:a.etat==="Neuf"?"#10B981":a.etat==="Urgent"?"#F43F5E":"#D4A843",borderRadius:"99px",padding:"3px 10px",fontSize:"10px",color:"#fff",fontWeight:"500"}}>{a.etat}</div>}
                  <div style={{position:"relative",flexShrink:0}}>
                    <button onClick={() => setMenuOuvertId(menuOuvertId===a.id?null:a.id)} style={{background:"none",border:"none",color:"#888",cursor:"pointer",padding:"4px",display:"flex"}}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
                    </button>
                    {menuOuvertId === a.id && (() => {
                      const estFavori = favoris.some(f => f.annonce_id === a.id && f.user_id === user?.id)
                      const estSignale = signales.includes(a.id)
                      return (
                      <>
                        <div onClick={() => setMenuOuvertId(null)} style={{position:"fixed",inset:0,zIndex:200}}/>
                        <div style={{position:"absolute",top:"26px",right:0,background:"#fff",borderRadius:"12px",boxShadow:"0 6px 24px rgba(0,0,0,0.15)",border:"0.5px solid #E8F1FF",overflow:"hidden",zIndex:201,minWidth:"190px"}}>
                          <button onClick={() => toggleFavori(a.id)} style={{width:"100%",textAlign:"left",padding:"11px 16px",background:"none",border:"none",fontSize:"13px",color:"#1a1a2e",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px"}}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill={estFavori?"#2B7FFF":"none"} stroke="#2B7FFF" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                            {estFavori ? "Retirer des enregistrements" : "Enregistrer"}
                          </button>
                          <button onClick={() => signalerAnnonce(a.id)} disabled={estSignale} style={{width:"100%",textAlign:"left",padding:"11px 16px",background:"none",border:"none",borderTop:"0.5px solid #F0F4FA",fontSize:"13px",color: estSignale?"#aaa":"#1a1a2e",cursor: estSignale?"default":"pointer",display:"flex",alignItems:"center",gap:"8px"}}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                            {estSignale ? "Publication signalée" : "Signaler la publication"}
                          </button>
                          {user && a.user_id === user.id && (
                            <button onClick={() => { setMenuOuvertId(null); setConfirmSupprId(a.id) }} style={{width:"100%",textAlign:"left",padding:"11px 16px",background:"none",border:"none",borderTop:"0.5px solid #F0F4FA",fontSize:"13px",color:"#F43F5E",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px"}}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                              Retirer la publication
                            </button>
                          )}
                        </div>
                      </>
                      )
                    })()}
                  </div>
                </div>

                <div onClick={() => onTapImage(a)}
                  style={{width:"100%",minHeight:"220px",maxHeight:"420px",background:"linear-gradient(135deg,#EEF5FF,#DCE9FF)",position:"relative",overflow:"hidden",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {a.image_url ? (
                    <img src={a.image_url} alt={a.titre} style={{width:"100%",height:"100%",maxHeight:"420px",objectFit:"contain"}}/>
                  ) : (
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                  )}
                  {animCoeurs[a.id] && (
                    <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
                      {animCoeurs[a.id].map(h => (
                        <div key={h.id} style={{position:"absolute",left:`${h.x}%`,bottom:"6%",transform:`rotate(${h.rot}deg)`}}>
                          <div style={{animation:`coeurVole 0.95s ease-out ${h.delay}s forwards`,opacity:0}}>
                            <svg width={h.size} height={h.size} viewBox="0 0 24 24" fill={h.couleur} style={{filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.2))"}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{padding:"10px 14px 2px",display:"flex",alignItems:"center",gap:"14px"}}>
                  <button onClick={() => toggleLike(a.id)} style={{background:"none",border:"none",padding:0,cursor:"pointer",display:"flex"}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={jaime?"#F43F5E":"none"} stroke={jaime?"#F43F5E":"#1a1a2e"} strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </button>
                  <button onClick={() => setAnnonceOuverte(a)} style={{background:"none",border:"none",padding:0,cursor:"pointer",display:"flex"}}>
                    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </button>
                  <div style={{marginLeft:"auto",fontSize:"16px",fontWeight:"700",color:"#2B7FFF"}}>{parseFloat(a.prix).toFixed(0)} CHF</div>
                </div>

                {nbLikes > 0 && (
                  <div style={{padding:"4px 14px 0",fontSize:"13px",fontWeight:"600",color:"#1a1a2e"}}>{nbLikes} j'aime</div>
                )}

                <div style={{padding:"4px 14px 16px",fontSize:"13px",color:"#333",lineHeight:"1.5"}}>
                  <div><span style={{fontWeight:"600",color:"#1a1a2e"}}>{vendeur} </span>{a.titre}</div>
                  {a.description && <div style={{marginTop:"4px",color:"#555"}}>{a.description}</div>}
                  {commentaires.filter(c => c.annonce_id === a.id).length > 0 && (
                    <button onClick={() => setAnnonceOuverte(a)} style={{background:"none",border:"none",padding:0,marginTop:"6px",fontSize:"12px",color:"#aaa",cursor:"pointer"}}>
                      Voir les {commentaires.filter(c => c.annonce_id === a.id).length} commentaire{commentaires.filter(c => c.annonce_id === a.id).length>1?"s":""}
                    </button>
                  )}
                </div>
              </div>
              )
  }


  return (
    <main style={{minHeight:"100vh",background:"#f8faff",paddingBottom:"80px"}}>
      <div style={{background:"linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)",padding:"20px 18px 24px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-40px",right:"-40px",width:"160px",height:"160px",borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}></div>
        <div style={{fontSize:"22px",fontWeight:"600",color:"#fff",marginBottom:"4px"}}>Marketplace</div>
        <div style={{fontSize:"13px",color:"rgba(255,255,255,0.5)",marginBottom:"16px"}}>Achète, vends, échange</div>
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          <button onClick={() => setOnglet("decouvrir")}
            style={{width:"100%",padding:"12px",borderRadius:"12px",border:"none",cursor:"pointer",fontSize:"15px",fontWeight:onglet==="decouvrir"?"700":"500",background:onglet==="decouvrir"?"#fff":"rgba(255,255,255,0.18)",color:onglet==="decouvrir"?"#1a3a6e":"#fff"}}>
            Découvrir
          </button>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={() => setOnglet("portfolio")}
              style={{flex:1,padding:"7px",borderRadius:"9px",border:onglet==="portfolio"?"none":"0.5px solid rgba(255,255,255,0.22)",cursor:"pointer",fontSize:"12px",fontWeight:onglet==="portfolio"?"600":"400",background:onglet==="portfolio"?"#fff":"rgba(255,255,255,0.08)",color:onglet==="portfolio"?"#1a3a6e":"rgba(255,255,255,0.8)"}}>
              Mon portefeuille
            </button>
            <button onClick={() => setOnglet("enregistres")}
              style={{flex:1,padding:"7px",borderRadius:"9px",border:onglet==="enregistres"?"none":"0.5px solid rgba(255,255,255,0.22)",cursor:"pointer",fontSize:"12px",fontWeight:onglet==="enregistres"?"600":"400",background:onglet==="enregistres"?"#fff":"rgba(255,255,255,0.08)",color:onglet==="enregistres"?"#1a3a6e":"rgba(255,255,255,0.8)"}}>
              Enregistrés
            </button>
          </div>
        </div>
      </div>

      {onglet === "portfolio" && (
        <div style={{padding:"14px"}}>
          <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
            <button onClick={() => setShowForm(!showForm)}
              style={{flex:1,background:"#EEF5FF",color:"#2B7FFF",border:"0.5px solid #DCE9FF",borderRadius:"12px",padding:"12px",fontSize:"13px",fontWeight:"500",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Ajouter
            </button>
            <button onClick={() => setModeShopping(!modeShopping)}
              style={{flex:1,background:modeShopping?"#D4A843":"rgba(255,255,255,0.8)",color:modeShopping?"#fff":"#666",border:"0.5px solid #E8F1FF",borderRadius:"12px",padding:"12px",fontSize:"13px",fontWeight:"500",cursor:"pointer"}}>
              {modeShopping ? "Mode normal" : "Mode shopping"}
            </button>
          </div>

          {showForm && (
            <div style={{background:"#EEF5FF",borderRadius:"14px",padding:"14px",marginBottom:"14px",border:"0.5px solid #DCE9FF"}}>
              <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom de l'article" style={inp}/>
              <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
                <input type="text" value={prix} onChange={e => setPrix(e.target.value)} placeholder="Prix (CHF)" style={{...inp,flex:1,marginBottom:0}}/>
                <select value={categorie} onChange={e => setCategorie(e.target.value)} style={{flex:1,border:"1px solid #E8F1FF",borderRadius:"10px",padding:"10px 8px",fontSize:"14px",color:"#1a1a2e",background:"#fff"}}>
                  {["Mode","Électronique","Maison","Sport","Alimentation","Autre"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={ajouterArticle} style={{flex:1,background:"#2B7FFF",color:"#fff",border:"none",borderRadius:"10px",padding:"10px",fontSize:"13px",fontWeight:"500",cursor:"pointer"}}>Ajouter</button>
                <button onClick={() => setShowForm(false)} style={{flex:1,background:"#fff",color:"#666",border:"0.5px solid #E8F1FF",borderRadius:"10px",padding:"10px",fontSize:"13px",cursor:"pointer"}}>Annuler</button>
              </div>
            </div>
          )}

          {articles.filter(a => modeShopping ? !a.coche_shopping : true).map(art => (
            <div key={art.id} style={{background:modeShopping&&art.coche_shopping?"#E1F5EE":"#fff",border:`0.5px solid ${modeShopping&&art.coche_shopping?"#A7F3D0":art.quantite<=1?"#FECDD3":"#E8F1FF"}`,borderRadius:"14px",padding:"14px",marginBottom:"8px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                {modeShopping && <input type="checkbox" checked={art.coche_shopping||false} onChange={() => cocherShopping(art)} style={{width:"18px",height:"18px",accentColor:"#10B981",cursor:"pointer",flexShrink:0}}/>}
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px"}}>
                    <span style={{fontSize:"13px",fontWeight:"500",color:"#1a1a2e",textDecoration:modeShopping&&art.coche_shopping?"line-through":"none",opacity:modeShopping&&art.coche_shopping?0.6:1}}>{art.nom}</span>
                    <span style={{fontSize:"10px",padding:"2px 6px 2px 4px",borderRadius:"99px",background:"#EEF5FF",color:"#2B7FFF",fontWeight:"500",display:"inline-flex",alignItems:"center",gap:"3px"}}><IconeCat cat={art.categorie} size={9}/>{art.categorie}</span>
                  </div>
                  {art.prix > 0 && <div style={{fontSize:"11px",color:"#2B7FFF",fontWeight:"500"}}>{parseFloat(art.prix).toFixed(2)} CHF × {art.quantite} = {(parseFloat(art.prix)*art.quantite).toFixed(2)} CHF</div>}
                </div>
                {!modeShopping && (
                  <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                    <button onClick={() => changerQte(art,-1)} style={{width:"22px",height:"22px",borderRadius:"50%",background:art.quantite<=1?"#FFE4E6":"#EEF5FF",border:"none",fontSize:"14px",color:art.quantite<=1?"#F43F5E":"#2B7FFF",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                    <span style={{fontSize:"16px",fontWeight:"600",color:art.quantite<=1?"#F43F5E":"#1a1a2e",minWidth:"18px",textAlign:"center"}}>{art.quantite}</span>
                    <button onClick={() => changerQte(art,1)} style={{width:"22px",height:"22px",borderRadius:"50%",background:"#2B7FFF",border:"none",fontSize:"14px",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                    <button onClick={() => supprimerArticle(art.id)} style={{width:"20px",height:"20px",borderRadius:"50%",background:"#FFE4E6",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {articles.length > 0 && !modeShopping && (
            <div style={{background:"linear-gradient(135deg,#1a3a6e,#2B7FFF)",borderRadius:"14px",padding:"14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:"8px"}}>
              <div style={{fontSize:"13px",color:"rgba(255,255,255,0.7)"}}>Total à prévoir</div>
              <div style={{fontSize:"22px",fontWeight:"600",color:"#fff"}}>{total.toFixed(2)} CHF</div>
            </div>
          )}

          {articles.length === 0 && (
            <div style={{textAlign:"center",padding:"48px 0",color:"#aaa",fontSize:"13px"}}>Ton portefeuille est vide</div>
          )}
        </div>
      )}

      {onglet === "decouvrir" && (
        <div style={{padding:"14px"}}>
          <button onClick={() => setShowFormAnnonce(!showFormAnnonce)}
            style={{width:"100%",background:"#EEF5FF",color:"#2B7FFF",border:"0.5px solid #DCE9FF",borderRadius:"12px",padding:"12px",fontSize:"13px",fontWeight:"500",cursor:"pointer",marginBottom:"14px",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Publier une annonce
          </button>

          {showFormAnnonce && (
            <div style={{background:"#EEF5FF",borderRadius:"14px",padding:"14px",marginBottom:"14px",border:"0.5px solid #DCE9FF"}}>
              <input value={titreAnnonce} onChange={e => setTitreAnnonce(e.target.value)} placeholder="Titre de l'annonce" style={inp}/>
              <textarea value={descAnnonce} onChange={e => setDescAnnonce(e.target.value)} placeholder="Description..." style={{...inp,height:"60px",resize:"none"} as any}/>
              <div style={{marginBottom:"8px"}}>
                <label style={{fontSize:"12px",color:"#666",display:"block",marginBottom:"6px"}}>Photo</label>
                <label style={{display:"block",background:"#fff",border:"1px dashed #2B7FFF",borderRadius:"10px",padding:"16px",textAlign:"center",cursor:"pointer",color:"#2B7FFF",fontSize:"13px",fontWeight:"500"}}>
                  Choisir une photo
                  <input type="file" accept="image/*" onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) { setImageAnnonce(f); setImagePreview(URL.createObjectURL(f)) }
                  }} style={{display:"none"}}/>
                </label>
                {imagePreview && <img src={imagePreview} alt="preview" style={{width:"100%",height:"140px",objectFit:"cover",borderRadius:"10px",marginTop:"8px"}}/>}
              </div>
              <select value={etatAnnonce} onChange={e => setEtatAnnonce(e.target.value)} style={{...inp} as any}>
                <option>Neuf</option>
                <option>Bon état</option>
                <option>État correct</option>
                <option>Urgent</option>
              </select>
              <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
                <input type="text" value={prixAnnonce} onChange={e => setPrixAnnonce(e.target.value)} placeholder="Prix CHF" style={{...inp,flex:1,marginBottom:0}}/>
                <select value={catAnnonce} onChange={e => setCatAnnonce(e.target.value)} style={{flex:1,border:"1px solid #E8F1FF",borderRadius:"10px",padding:"10px 8px",fontSize:"14px",color:"#1a1a2e",background:"#fff"}}>
                  {["Mode","Électronique","Maison","Sport","Alimentation","Autre"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={ajouterAnnonce} style={{flex:1,background:"#2B7FFF",color:"#fff",border:"none",borderRadius:"10px",padding:"10px",fontSize:"13px",fontWeight:"500",cursor:"pointer"}}>Publier</button>
                <button onClick={() => setShowFormAnnonce(false)} style={{flex:1,background:"#fff",color:"#666",border:"0.5px solid #E8F1FF",borderRadius:"10px",padding:"10px",fontSize:"13px",cursor:"pointer"}}>Annuler</button>
              </div>
            </div>
          )}

          <div style={{display:"flex",gap:"6px",marginBottom:"14px",overflowX:"auto"}}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setFiltre(c)}
                style={{whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:"5px",padding:"6px 14px",borderRadius:"99px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:"500",background:filtre===c?"#2B7FFF":"#EEF5FF",color:filtre===c?"#fff":"#2B7FFF"}}>
                {c !== "Tout" && <IconeCat cat={c} size={12}/>}
                {c}
              </button>
            ))}
          </div>

          <style>{`@keyframes coeurVole { 0% { opacity: 0; transform: translateY(0) scale(0.3); } 12% { opacity: 1; transform: translateY(-6px) scale(1); } 100% { opacity: 0; transform: translateY(-120px) scale(1.1); } }`}</style>
          <div style={{display:"flex",flexDirection:"column",gap:"28px"}}>
            {annoncesFiltrees.map(a => renderPost(a))}
          </div>

          {annoncesFiltrees.length === 0 && (
            <div style={{textAlign:"center",padding:"48px 0",color:"#aaa",fontSize:"13px"}}>Aucune annonce pour l'instant</div>
          )}

          {confirmSupprId && (
            <div onClick={() => setConfirmSupprId(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
              <div onClick={e => e.stopPropagation()} style={{background:"#fff",borderRadius:"18px",padding:"22px",maxWidth:"320px",width:"100%",textAlign:"center"}}>
                <div style={{fontSize:"15px",fontWeight:"600",color:"#1a1a2e",marginBottom:"8px"}}>Retirer cette publication ?</div>
                <div style={{fontSize:"13px",color:"#666",marginBottom:"18px",lineHeight:"1.5"}}>Cette action est définitive. La publication sera supprimée pour tout le monde.</div>
                <div style={{display:"flex",gap:"8px"}}>
                  <button onClick={() => setConfirmSupprId(null)} style={{flex:1,background:"#F5F8FC",color:"#666",border:"none",borderRadius:"10px",padding:"11px",fontSize:"13px",fontWeight:"500",cursor:"pointer"}}>Annuler</button>
                  <button onClick={() => { supprimerAnnonce(confirmSupprId); setConfirmSupprId(null) }} style={{flex:1,background:"#F43F5E",color:"#fff",border:"none",borderRadius:"10px",padding:"11px",fontSize:"13px",fontWeight:"500",cursor:"pointer"}}>Supprimer</button>
                </div>
              </div>
            </div>
          )}

          {annonceOuverte && (
            <div onClick={() => setAnnonceOuverte(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:1500,display:"flex",alignItems:"flex-end"}}>
              <div onClick={(e) => e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"88vh",overflowY:"auto"}}>
                <div style={{position:"relative"}}>
                  {annonceOuverte.image_url ? (
                    <div style={{width:"100%",maxHeight:"50vh",background:"linear-gradient(135deg,#EEF5FF,#DCE9FF)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                      <img src={annonceOuverte.image_url} alt={annonceOuverte.titre} style={{width:"100%",maxHeight:"50vh",objectFit:"contain"}}/>
                    </div>
                  ) : (
                    <div style={{width:"100%",height:"260px",background:"linear-gradient(135deg,#EEF5FF,#DCE9FF)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    </div>
                  )}
                  <button onClick={() => setAnnonceOuverte(null)}
                    style={{position:"absolute",top:"12px",right:"12px",background:"rgba(255,255,255,0.9)",border:"none",borderRadius:"50%",width:"32px",height:"32px",cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                  {annonceOuverte.etat && <div style={{position:"absolute",top:"12px",left:"12px",background:annonceOuverte.etat==="Neuf"?"#10B981":annonceOuverte.etat==="Urgent"?"#F43F5E":"#D4A843",borderRadius:"99px",padding:"4px 12px",fontSize:"11px",color:"#fff",fontWeight:"500"}}>{annonceOuverte.etat}</div>}
                </div>
                <div style={{padding:"18px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px"}}>
                    <div style={{fontSize:"18px",fontWeight:"600",color:"#1a1a2e",flex:1}}>{annonceOuverte.titre}</div>
                    <div style={{fontSize:"20px",fontWeight:"700",color:"#2B7FFF",whiteSpace:"nowrap",marginLeft:"10px"}}>{parseFloat(annonceOuverte.prix).toFixed(0)} CHF</div>
                  </div>
                  <div style={{fontSize:"11px",color:"#aaa",marginBottom:"14px"}}>{annonceOuverte.categorie}</div>

                  <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"14px",paddingBottom:"14px",borderBottom:"0.5px solid #F0F4FA"}}>
                    <button onClick={() => toggleLike(annonceOuverte.id)}
                      style={{display:"flex",alignItems:"center",gap:"6px",background: likes.some(l=>l.annonce_id===annonceOuverte.id&&l.user_id===user?.id) ? "#FFE4E6" : "#F8FBFF",border:"0.5px solid #E8F1FF",borderRadius:"99px",padding:"8px 14px",cursor:"pointer"}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={likes.some(l=>l.annonce_id===annonceOuverte.id&&l.user_id===user?.id)?"#F43F5E":"none"} stroke={likes.some(l=>l.annonce_id===annonceOuverte.id&&l.user_id===user?.id)?"#F43F5E":"#aaa"} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      <span style={{fontSize:"13px",fontWeight:"500",color:"#1a1a2e"}}>{likes.filter(l => l.annonce_id === annonceOuverte.id).length}</span>
                    </button>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",color:"#aaa"}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      <span style={{fontSize:"13px"}}>{commentaires.filter(c => c.annonce_id === annonceOuverte.id).length}</span>
                    </div>
                  </div>

                  <div style={{fontSize:"13px",color:"#666",lineHeight:"1.6",whiteSpace:"pre-wrap"}}>{annonceOuverte.description || "Aucune description."}</div>

                  <div style={{marginTop:"18px"}}>
                    <div style={{fontSize:"13px",fontWeight:"500",color:"#1a1a2e",marginBottom:"10px"}}>Commentaires</div>
                    {commentaires.filter(c => c.annonce_id === annonceOuverte.id).length === 0 && (
                      <div style={{fontSize:"12px",color:"#aaa",marginBottom:"10px"}}>Aucun commentaire pour l'instant</div>
                    )}
                    {commentaires.filter(c => c.annonce_id === annonceOuverte.id).map(c => (
                      <div key={c.id} style={{display:"flex",gap:"8px",marginBottom:"10px"}}>
                        <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#EEF5FF",color:"#2B7FFF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:"500",flexShrink:0}}>
                          {(profilsCommentaires[c.user_id] || "?")[0].toUpperCase()}
                        </div>
                        <div style={{flex:1,background:"#F8FBFF",borderRadius:"12px",padding:"8px 12px"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2px"}}>
                            <span style={{fontSize:"12px",fontWeight:"500",color:"#1a1a2e"}}>{profilsCommentaires[c.user_id] || "Membre"}</span>
                            {user && c.user_id === user.id && (
                              <button onClick={() => supprimerCommentaire(c.id)} style={{background:"none",border:"none",color:"#ddd",cursor:"pointer",fontSize:"14px"}}>×</button>
                            )}
                          </div>
                          <div style={{fontSize:"13px",color:"#333"}}>{c.contenu}</div>
                        </div>
                      </div>
                    ))}
                    {user ? (
                      <div style={{display:"flex",gap:"8px",marginTop:"10px"}}>
                        <input value={nouveauCommentaire} onChange={e => setNouveauCommentaire(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && ajouterCommentaire()}
                          placeholder="Écrire un commentaire..."
                          style={{flex:1,border:"1px solid #E8F1FF",borderRadius:"99px",padding:"10px 14px",fontSize:"14px",color:"#1a1a2e",background:"#F8FBFF"}}/>
                        <button onClick={ajouterCommentaire} style={{width:"40px",height:"40px",borderRadius:"50%",background:"#2B7FFF",color:"#fff",border:"none",cursor:"pointer",fontSize:"16px",flexShrink:0}}>↑</button>
                      </div>
                    ) : (
                      <div style={{fontSize:"12px",color:"#aaa",marginTop:"8px"}}>Connecte-toi pour commenter</div>
                    )}
                  </div>

                  {user && annonceOuverte.user_id === user.id && (
                    <button onClick={() => { supprimerAnnonce(annonceOuverte.id); setAnnonceOuverte(null) }}
                      style={{width:"100%",marginTop:"18px",background:"#FFE4E6",color:"#F43F5E",border:"none",borderRadius:"12px",padding:"12px",fontSize:"13px",fontWeight:"500",cursor:"pointer"}}>
                      Supprimer mon annonce
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {onglet === "enregistres" && (
        <div style={{padding:"14px"}}>
          <div style={{fontSize:"13px",color:"#666",marginBottom:"14px"}}>Tes publications enregistrées</div>
          <div style={{display:"flex",flexDirection:"column",gap:"28px"}}>
            {annonces.filter(a => favoris.some(f => f.annonce_id === a.id && f.user_id === user?.id)).map(a => renderPost(a))}
          </div>
          {annonces.filter(a => favoris.some(f => f.annonce_id === a.id && f.user_id === user?.id)).length === 0 && (
            <div style={{textAlign:"center",padding:"48px 0",color:"#aaa"}}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" style={{marginBottom:"8px"}}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              <div style={{fontSize:"13px"}}>Rien d'enregistré pour l'instant</div>
              <div style={{fontSize:"12px",marginTop:"4px"}}>Touche "•••" sur une publication pour l'enregistrer</div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}