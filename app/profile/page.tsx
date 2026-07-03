"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import QRCodeComponent from "../components/QRCode"

const COULEURS = ["#2B7FFF","#F43F5E","#10B981","#D4A843","#8B5CF6","#F59E0B","#EC4899","#1a1a2e"]

export default function Profile() {
  const [projets, setProjets] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [profil, setProfil] = useState<any>(null)
  const [onglet, setOnglet] = useState("projets")
  const [nom, setNom] = useState("")
  const [bio, setBio] = useState("")
  const [ville, setVille] = useState("")
  const [couleur, setCouleur] = useState("#2B7FFF")
  const [message, setMessage] = useState("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setProfil(p)
        setNom(p?.nom || "")
        setBio(p?.bio || "")
        setVille(p?.ville || "")
        setCouleur(p?.couleur || "#2B7FFF")
        const { data } = await supabase.from("projets").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
        setProjets(data || [])
      }
    }
    charger()
  }, [])

  async function sauvegarderProfil() {
    const { error } = await supabase.from("profiles").update({ nom, bio, ville, couleur }).eq("id", user.id)
    if (!error) {
      setMessage("Profil mis à jour !")
      setProfil({ ...profil, nom, bio, ville, couleur, avatar_url: profil?.avatar_url })
      setTimeout(() => setMessage(""), 2000)
    }
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = user.id + '/avatar.' + ext
    // supprimer ancien avatar
    await supabase.storage.from('Avatar').remove([user.id + '/avatar.jpg', user.id + '/avatar.png', user.id + '/avatar.jpeg', user.id + '/avatar.heic'])
    const { error } = await supabase.storage.from('Avatar').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('Avatar').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
      setProfil({ ...profil, avatar_url: data.publicUrl })
      setMessage('Photo mise a jour')
      setTimeout(() => setMessage(''), 2000)
    }
    setUploading(false)
  }

  async function deconnecter() {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const initiale = profil?.nom?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"
  const couleurProfil = couleur || "#2B7FFF"

  return (
    <main className="min-h-screen bg-white" style={{overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
      <div style={{height:"160px",background:`linear-gradient(135deg,${couleurProfil},#87CEEB)`}}>
        <a href="/" className="absolute top-3 left-4 text-white text-sm opacity-80">← Accueil</a>
      </div>

      <div style={{padding:"0 18px 100px 18px"}}>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginTop:'-40px',marginBottom:'12px'}}>
          <div style={{width:'64px',height:'64px',borderRadius:'50%',background:couleurProfil,border:'4px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'22px',fontWeight:'500',position:'relative',overflow:'hidden',cursor:'pointer'}}>
            {profil?.avatar_url ? <img src={profil.avatar_url} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/> : initiale}
            <input type='file' accept='image/*' onChange={uploadAvatar} style={{position:'absolute',inset:0,opacity:0,cursor:'pointer',width:'100%',height:'100%'}}/>
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={() => setOnglet("settings")} style={{fontSize:'12px',padding:'7px 12px',borderRadius:'99px',border:'1.5px solid #E8F1FF',background:'#fff',color:'#666',cursor:'pointer'}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>
            <a href="/nouveau-projet">
              <button style={{fontSize:'12px',padding:'7px 14px',borderRadius:'99px',background:couleurProfil,color:'#fff',border:'none',cursor:'pointer',fontWeight:'500'}}>+ Projet</button>
            </a>
          </div>
        </div>

        <div style={{fontSize:'18px',fontWeight:'500',color:'#1a1a2e'}}>{profil?.nom || user?.email}</div>
        {profil?.ville && <div style={{fontSize:'13px',color:'#aaa',marginTop:'2px'}}>{profil.ville}</div>}
        {profil?.bio && <div style={{fontSize:'13px',color:'#666',marginTop:'6px',lineHeight:'1.5',marginBottom:'8px'}}>{profil.bio}</div>}

        <div style={{display:'flex',gap:'8px',margin:'14px 0'}}>
          <div style={{flex:1,background:'#EEF5FF',borderRadius:'12px',padding:'10px',textAlign:'center',border:'0.5px solid #DCE9FF'}}>
            <div style={{fontSize:'17px',fontWeight:'500',color:couleurProfil}}>{projets.filter(p => !p.prive).length}</div>
            <div style={{fontSize:'11px',color:'#aaa'}}>publics</div>
          </div>
          <div style={{flex:1,background:'#FDF8EC',borderRadius:'12px',padding:'10px',textAlign:'center',border:'0.5px solid #F0D88A'}}>
            <div style={{fontSize:'17px',fontWeight:'500',color:'#D4A843'}}>{projets.filter(p => p.prive).length}</div>
            <div style={{fontSize:'11px',color:'#aaa'}}>privés</div>
          </div>
          <div style={{flex:1,background:'#EEF5FF',borderRadius:'12px',padding:'10px',textAlign:'center',border:'0.5px solid #DCE9FF'}}>
            <div style={{fontSize:'17px',fontWeight:'500',color:couleurProfil}}>{projets.length}</div>
            <div style={{fontSize:'11px',color:'#aaa'}}>total</div>
          </div>
        </div>

        <div style={{display:'flex',borderBottom:'0.5px solid #E8F1FF',marginBottom:'16px'}}>
          {["projets","settings"].map(o => (
            <button key={o} onClick={() => setOnglet(o)}
              style={{flex:1,padding:'10px 0',fontSize:'13px',fontWeight:'500',border:'none',background:'none',cursor:'pointer',
                color: onglet === o ? couleurProfil : '#aaa',
                borderBottom: onglet === o ? `2px solid ${couleurProfil}` : '2px solid transparent'}}>
              {o === "projets" ? (
              <span style={{display:"flex",alignItems:"center",gap:"6px",justifyContent:"center"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Mes projets
              </span>
            ) : (
              <span style={{display:"flex",alignItems:"center",gap:"6px",justifyContent:"center"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Paramètres
              </span>
            )}
            </button>
          ))}
        </div>

        {onglet === "projets" && (
          <div>
            {projets.length === 0 && (
              <div style={{textAlign:'center',padding:'48px 0',color:'#aaa'}}>
                <div style={{fontSize:'40px',marginBottom:'12px'}}>📭</div>
                <div style={{fontSize:'14px',marginBottom:'8px'}}>Aucun projet pour l'instant</div>
                <a href="/nouveau-projet" style={{color:couleurProfil,fontSize:'13px',fontWeight:'500'}}>Publier mon premier projet →</a>
              </div>
            )}
            {projets.map((projet: any) => (
              <div key={projet.id} style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',overflow:'hidden',marginBottom:'12px'}}>
                <div style={{height:'100px',background:`linear-gradient(135deg,${couleurProfil}22,${couleurProfil}44)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'36px',position:'relative'}}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {projet.prive && (
                    <span style={{position:'absolute',top:'8px',right:'8px',background:'#1a1a2e',color:'#fff',fontSize:'10px',padding:'2px 8px',borderRadius:'99px',display:'flex',alignItems:'center',gap:'4px'}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Privé</span>
                  )}
                </div>
                <div style={{padding:'12px 14px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                    <span style={{fontSize:'11px',background:`${couleurProfil}22`,color:couleurProfil,padding:'2px 8px',borderRadius:'99px',fontWeight:'500'}}>{projet.categorie}</span>
                    <a href={`/modifier-projet/${projet.id}`}>
                      <button style={{fontSize:'11px',color:'#aaa',background:'#F5F5F5',border:'none',padding:'3px 10px',borderRadius:'99px',cursor:'pointer'}}>✏️ Modifier</button>
                    </a>
                  </div>
                  <div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e',marginBottom:'4px'}}>{projet.titre}</div>
                  <div style={{fontSize:'12px',color:'#aaa',marginBottom:'10px'}}>{projet.description}</div>
                  {projet.image_url && (
                    <div style={{background:`${couleurProfil}11`,borderRadius:'10px',padding:'10px 12px',display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
                      <QRCodeComponent lien={projet.image_url} />
                      <div>
                        <div style={{fontSize:'13px',fontWeight:'500',color:couleurProfil}}>Soutenir via Revolut</div>
                        <div style={{fontSize:'11px',color:'#aaa',marginTop:'2px'}}>revolut.me/{projet.image_url}</div>
                      </div>
                    </div>
                  )}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingTop:'10px',borderTop:'0.5px solid #E8F1FF'}}>
                    <div style={{display:'flex',gap:'12px'}}>
                      <span style={{fontSize:'12px',color:'#aaa'}}>❤️ 0</span>
                      <a href={`/projet/${projet.id}`} style={{fontSize:'12px',color:couleurProfil}}>💬 Voir les conseils →</a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {onglet === "settings" && (
          <div>
            <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'16px',marginBottom:'12px'}}>
              <div style={{fontSize:'13px',fontWeight:'500',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'12px'}}>Mon profil</div>
              <div style={{marginBottom:'10px'}}>
                <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Prénom & Nom</label>
                <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Pierre Diatta"
                  style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF'}}/>
              </div>
              <div style={{marginBottom:'10px'}}>
                <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Ville</label>
                <input value={ville} onChange={e => setVille(e.target.value)} placeholder="Genève"
                  style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF'}}/>
              </div>
              <div style={{marginBottom:'12px'}}>
                <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Passionné de projets..." rows={3}
                  style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF',resize:'none'}}/>
              </div>
              <div style={{marginBottom:'12px'}}>
                <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'8px'}}>Couleur du profil</label>
                <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:'8px'}}>
                  {COULEURS.map(c => (
                    <div key={c} onClick={() => setCouleur(c)}
                      style={{height:'36px',borderRadius:'10px',background:c,cursor:'pointer',border: couleur === c ? '3px solid #1a1a2e' : '3px solid transparent'}}/>
                  ))}
                </div>
              </div>
              <button onClick={sauvegarderProfil}
                style={{width:'100%',background:couleurProfil,color:'#fff',fontSize:'13px',fontWeight:'500',padding:'10px',borderRadius:'10px',border:'none',cursor:'pointer'}}>
                Sauvegarder
              </button>
              {message && <p style={{fontSize:'12px',color:'#10B981',textAlign:'center',marginTop:'8px'}}>{message}</p>}
            </div>

            <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',overflow:'hidden',marginBottom:'12px'}}>
              <a href="/groupes" style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',borderBottom:'0.5px solid #E8F1FF',textDecoration:'none'}}>
                <div style={{width:'36px',height:'36px',background:'#EEF5FF',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e'}}>Mes groupes</div><div style={{fontSize:'12px',color:'#aaa'}}>Voir & créer des groupes</div></div>
                <span style={{color:'#aaa'}}>›</span>
              </a>
              <a href="/calendrier" style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',textDecoration:'none'}}>
                <div style={{width:'36px',height:'36px',background:'#FDF8EC',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e'}}>Calendrier</div><div style={{fontSize:'12px',color:'#aaa'}}>Mes échéances</div></div>
                <span style={{color:'#aaa'}}>›</span>
              </a>
            </div>

            <button onClick={deconnecter}
              style={{width:'100%',background:'#FFE4E6',color:'#F43F5E',fontSize:'14px',fontWeight:'500',padding:'12px',borderRadius:'14px',border:'none',cursor:'pointer',marginBottom:'24px'}}>
              <span style={{display:"flex",alignItems:"center",gap:"8px",justifyContent:"center"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Se déconnecter</span>
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
