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
      setProfil({ ...profil, nom, bio, ville, couleur })
      setTimeout(() => setMessage(""), 2000)
    }
  }

  async function deconnecter() {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const initiale = profil?.nom?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"
  const couleurProfil = couleur || "#2B7FFF"

  return (
    <main className="min-h-screen bg-white" style={{overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
      <div className="h-24 relative" style={{background:`linear-gradient(135deg,${couleurProfil},#87CEEB)`}}>
        <a href="/" className="absolute top-3 left-4 text-white text-sm opacity-80">← Accueil</a>
      </div>

      <div style={{padding:'0 18px'}}>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginTop:'-32px',marginBottom:'12px'}}>
          <div style={{width:'64px',height:'64px',borderRadius:'50%',background:couleurProfil,border:'4px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'22px',fontWeight:'500'}}>
            {initiale}
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={() => setOnglet("settings")} style={{fontSize:'12px',padding:'7px 12px',borderRadius:'99px',border:'1.5px solid #E8F1FF',background:'#fff',color:'#666',cursor:'pointer'}}>⚙️</button>
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
              {o === "projets" ? "📌 Mes projets" : "⚙️ Paramètres"}
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
                  📌
                  {projet.prive && (
                    <span style={{position:'absolute',top:'8px',right:'8px',background:'#1a1a2e',color:'#fff',fontSize:'10px',padding:'2px 8px',borderRadius:'99px'}}>🔒 Privé</span>
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
                <div style={{width:'36px',height:'36px',background:'#EEF5FF',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>👥</div>
                <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e'}}>Mes groupes</div><div style={{fontSize:'12px',color:'#aaa'}}>Voir & créer des groupes</div></div>
                <span style={{color:'#aaa'}}>›</span>
              </a>
              <a href="/calendrier" style={{display:'flex',alignItems:'center',gap:'12px',padding:'14px 16px',textDecoration:'none'}}>
                <div style={{width:'36px',height:'36px',background:'#FDF8EC',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>📅</div>
                <div style={{flex:1}}><div style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e'}}>Calendrier</div><div style={{fontSize:'12px',color:'#aaa'}}>Mes échéances</div></div>
                <span style={{color:'#aaa'}}>›</span>
              </a>
            </div>

            <button onClick={deconnecter}
              style={{width:'100%',background:'#FFE4E6',color:'#F43F5E',fontSize:'14px',fontWeight:'500',padding:'12px',borderRadius:'14px',border:'none',cursor:'pointer',marginBottom:'24px'}}>
              🚪 Se déconnecter
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
