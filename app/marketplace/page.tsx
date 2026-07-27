"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const CATEGORIES = ["Tout","Mode","Electronique","Maison","Sport","Autre"]

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
  const [unite, setUnite] = useState("unite")
  const [categorie, setCategorie] = useState("Autre")
  const [titreAnnonce, setTitreAnnonce] = useState("")
  const [descAnnonce, setDescAnnonce] = useState("")
  const [prixAnnonce, setPrixAnnonce] = useState("")
  const [catAnnonce, setCatAnnonce] = useState("Autre")

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) { chargerArticles(); chargerAnnonces() }
    })
  }, [])

  async function chargerArticles() {
    const { data } = await supabase.from("portfolio_articles").select("*").order("created_at", { ascending: true })
    setArticles(data || [])
  }

  async function chargerAnnonces() {
    const { data } = await supabase.from("marketplace_annonces").select("*, profiles(prenom, nom)").order("created_at", { ascending: false })
    setAnnonces(data || [])
  }

  async function ajouterArticle() {
    if (!nom.trim()) return
    const { data: { user: u } } = await supabase.auth.getUser()
    await supabase.from("portfolio_articles").insert({ user_id: u?.id, nom, prix: parseFloat(prix.replace(",",".")) || 0, quantite, unite, categorie })
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

  async function ajouterAnnonce() {
    if (!titreAnnonce.trim()) return
    const { data: { user: u } } = await supabase.auth.getUser()
    await supabase.from("marketplace_annonces").insert({ user_id: u?.id, titre: titreAnnonce, description: descAnnonce, prix: parseFloat(prixAnnonce.replace(",",".")) || 0, categorie: catAnnonce })
    setTitreAnnonce(""); setDescAnnonce(""); setPrixAnnonce(""); setShowFormAnnonce(false); chargerAnnonces()
  }

  const total = articles.reduce((sum, a) => sum + (parseFloat(a.prix || 0) * a.quantite), 0)
  const annoncesFiltrees = annonces.filter(a => filtre === "Tout" || a.categorie === filtre)

  const inp = { width:'100%', border:'1px solid #E8F1FF', borderRadius:'10px', padding:'10px 12px', fontSize:'16px', color:'#1a1a2e', background:'#fff', marginBottom:'8px', boxSizing:'border-box' as any }

  return (
    <main style={{minHeight:'100vh',background:'#f8faff',paddingBottom:'80px'}}>
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)',padding:'20px 18px 24px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-40px',right:'-40px',width:'160px',height:'160px',borderRadius:'50%',background:'rgba(255,255,255,0.06)'}}></div>
        <div style={{fontSize:'22px',fontWeight:'600',color:'#fff',marginBottom:'4px'}}>Marketplace</div>
        <div style={{fontSize:'13px',color:'rgba(255,255,255,0.5)',marginBottom:'16px'}}>Ton portefeuille & les annonces</div>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={() => setOnglet('portfolio')}
            style={{flex:1,padding:'8px',borderRadius:'10px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight: onglet==='portfolio' ? '600' : '400',
              background: onglet==='portfolio' ? '#fff' : 'rgba(255,255,255,0.15)',
              color: onglet==='portfolio' ? '#1a3a6e' : '#fff'}}>
            Mon portefeuille
          </button>
          <button onClick={() => setOnglet('decouvrir')}
            style={{flex:1,padding:'8px',borderRadius:'10px',border: onglet==='decouvrir' ? 'none' : '0.5px solid rgba(255,255,255,0.25)',cursor:'pointer',fontSize:'13px',fontWeight: onglet==='decouvrir' ? '600' : '400',
              background: onglet==='decouvrir' ? '#fff' : 'rgba(255,255,255,0.15)',
              color: onglet==='decouvrir' ? '#1a3a6e' : '#fff'}}>
            Découvrir
          </button>
        </div>
      </div>

      {onglet === 'portfolio' && (
        <div style={{padding:'14px'}}>
          <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
            <button onClick={() => setShowForm(!showForm)}
              style={{flex:1,background:'#EEF5FF',color:'#2B7FFF',border:'0.5px solid #DCE9FF',borderRadius:'12px',padding:'12px',fontSize:'13px',fontWeight:'500',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Ajouter
            </button>
            <button onClick={() => setModeShopping(!modeShopping)}
              style={{flex:1,background: modeShopping ? '#D4A843' : 'rgba(255,255,255,0.8)',color: modeShopping ? '#fff' : '#666',border:'0.5px solid #E8F1FF',borderRadius:'12px',padding:'12px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>
              {modeShopping ? 'Mode normal' : 'Mode shopping'}
            </button>
          </div>

          {showForm && (
            <div style={{background:'#EEF5FF',borderRadius:'14px',padding:'14px',marginBottom:'14px',border:'0.5px solid #DCE9FF'}}>
              <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom de l'article" style={inp}/>
              <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
                <input type="text" value={prix} onChange={e => setPrix(e.target.value)} placeholder="Prix (CHF)"
                  style={{...inp,flex:1,marginBottom:0}}/>
                <select value={categorie} onChange={e => setCategorie(e.target.value)}
                  style={{flex:1,border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 8px',fontSize:'14px',color:'#1a1a2e',background:'#fff'}}>
                  {["Mode","Electronique","Maison","Sport","Alimentation","Autre"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={ajouterArticle} style={{flex:1,background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'10px',padding:'10px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>Ajouter</button>
                <button onClick={() => setShowForm(false)} style={{flex:1,background:'#fff',color:'#666',border:'0.5px solid #E8F1FF',borderRadius:'10px',padding:'10px',fontSize:'13px',cursor:'pointer'}}>Annuler</button>
              </div>
            </div>
          )}

          {articles.filter(a => modeShopping ? !a.coche_shopping : true).map(art => (
            <div key={art.id} style={{background: modeShopping && art.coche_shopping ? '#E1F5EE' : '#fff',border:`0.5px solid ${modeShopping && art.coche_shopping ? '#A7F3D0' : art.quantite <= 1 ? '#FECDD3' : '#E8F1FF'}`,borderRadius:'14px',padding:'14px',marginBottom:'8px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                {modeShopping && (
                  <input type="checkbox" checked={art.coche_shopping || false} onChange={() => cocherShopping(art)}
                    style={{width:'18px',height:'18px',accentColor:'#10B981',cursor:'pointer',flexShrink:0}}/>
                )}
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'2px'}}>
                    <span style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',textDecoration: modeShopping && art.coche_shopping ? 'line-through' : 'none',opacity: modeShopping && art.coche_shopping ? 0.6 : 1}}>{art.nom}</span>
                    <span style={{fontSize:'10px',padding:'2px 6px',borderRadius:'99px',background:'#EEF5FF',color:'#2B7FFF',fontWeight:'500'}}>{art.categorie}</span>
                    {art.quantite <= 1 && !modeShopping && <span style={{fontSize:'10px',padding:'2px 6px',borderRadius:'99px',background:'#FFE4E6',color:'#F43F5E',fontWeight:'500'}}>Stock bas</span>}
                  </div>
                  {art.prix > 0 && <div style={{fontSize:'11px',color:'#2B7FFF',fontWeight:'500'}}>{parseFloat(art.prix).toFixed(2)} CHF × {art.quantite} = {(parseFloat(art.prix)*art.quantite).toFixed(2)} CHF</div>}
                </div>
                {!modeShopping && (
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <button onClick={() => changerQte(art,-1)} style={{width:'22px',height:'22px',borderRadius:'50%',background:art.quantite<=1?'#FFE4E6':'#EEF5FF',border:'none',fontSize:'14px',color:art.quantite<=1?'#F43F5E':'#2B7FFF',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                    <span style={{fontSize:'16px',fontWeight:'600',color:art.quantite<=1?'#F43F5E':'#1a1a2e',minWidth:'18px',textAlign:'center'}}>{art.quantite}</span>
                    <button onClick={() => changerQte(art,1)} style={{width:'22px',height:'22px',borderRadius:'50%',background:'#2B7FFF',border:'none',fontSize:'14px',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                    <button onClick={() => supprimerArticle(art.id)} style={{width:'20px',height:'20px',borderRadius:'50%',background:'#F8FBFF',border:'0.5px solid #E8F1FF',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {articles.length > 0 && !modeShopping && (
            <div style={{background:'linear-gradient(135deg,#1a3a6e,#2B7FFF)',borderRadius:'14px',padding:'14px',display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'8px'}}>
              <div style={{fontSize:'13px',color:'rgba(255,255,255,0.7)'}}>Total à prévoir</div>
              <div style={{fontSize:'22px',fontWeight:'600',color:'#fff'}}>{total.toFixed(2)} CHF</div>
            </div>
          )}

          {articles.length === 0 && (
            <div style={{textAlign:'center',padding:'48px 0',color:'#aaa',fontSize:'13px'}}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" style={{margin:'0 auto 12px',display:'block'}}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              Ton portefeuille est vide
            </div>
          )}
        </div>
      )}

      {onglet === 'decouvrir' && (
        <div style={{padding:'14px'}}>
          <button onClick={() => setShowFormAnnonce(!showFormAnnonce)}
            style={{width:'100%',background:'#EEF5FF',color:'#2B7FFF',border:'0.5px solid #DCE9FF',borderRadius:'12px',padding:'12px',fontSize:'13px',fontWeight:'500',cursor:'pointer',marginBottom:'14px',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Publier une annonce
          </button>

          {showFormAnnonce && (
            <div style={{background:'#EEF5FF',borderRadius:'14px',padding:'14px',marginBottom:'14px',border:'0.5px solid #DCE9FF'}}>
              <input value={titreAnnonce} onChange={e => setTitreAnnonce(e.target.value)} placeholder="Titre de l'annonce" style={inp}/>
              <textarea value={descAnnonce} onChange={e => setDescAnnonce(e.target.value)} placeholder="Description..."
                style={{...inp,height:'60px',resize:'none'}}/>
              <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
                <input type="text" value={prixAnnonce} onChange={e => setPrixAnnonce(e.target.value)} placeholder="Prix CHF"
                  style={{...inp,flex:1,marginBottom:0}}/>
                <select value={catAnnonce} onChange={e => setCatAnnonce(e.target.value)}
                  style={{flex:1,border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 8px',fontSize:'14px',color:'#1a1a2e',background:'#fff'}}>
                  {["Mode","Electronique","Maison","Sport","Alimentation","Autre"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={ajouterAnnonce} style={{flex:1,background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'10px',padding:'10px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>Publier</button>
                <button onClick={() => setShowFormAnnonce(false)} style={{flex:1,background:'#fff',color:'#666',border:'0.5px solid #E8F1FF',borderRadius:'10px',padding:'10px',fontSize:'13px',cursor:'pointer'}}>Annuler</button>
              </div>
            </div>
          )}

          <div style={{display:'flex',gap:'6px',marginBottom:'14px',overflowX:'auto'}}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setFiltre(c)}
                style={{whiteSpace:'nowrap',padding:'6px 14px',borderRadius:'99px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'500',
                  background: filtre===c ? '#2B7FFF' : '#EEF5FF',
                  color: filtre===c ? '#fff' : '#2B7FFF'}}>
                {c}
              </button>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
            {annoncesFiltrees.map(a => (
              <div key={a.id} style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'14px',overflow:'hidden'}}>
                <div style={{height:'100px',background:'linear-gradient(135deg,#EEF5FF,#DCE9FF)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
                </div>
                <div style={{padding:'10px'}}>
                  <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'2px'}}>{a.titre}</div>
                  <div style={{fontSize:'13px',color:'#2B7FFF',fontWeight:'600',marginBottom:'2px'}}>{parseFloat(a.prix).toFixed(0)} CHF</div>
                  <div style={{fontSize:'11px',color:'#aaa'}}>{a.profiles?.prenom || 'Anonyme'}</div>
                </div>
              </div>
            ))}
          </div>

          {annoncesFiltrees.length === 0 && (
            <div style={{textAlign:'center',padding:'48px 0',color:'#aaa',fontSize:'13px'}}>Aucune annonce pour l instant</div>
          )}
        </div>
      )}
    </main>
  )
}
