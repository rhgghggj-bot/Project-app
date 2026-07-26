"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

const CATEGORIES = ["Alimentation", "Hygiene", "Menage", "Boissons", "Autre"]
const CAT_COLORS: any = {
  Alimentation: { bg:'#E1F5EE', color:'#10B981' },
  Hygiene: { bg:'#FDF8EC', color:'#D4A843' },
  Menage: { bg:'#EEF5FF', color:'#2B7FFF' },
  Boissons: { bg:'#F3E8FF', color:'#8B5CF6' },
  Autre: { bg:'#F8FBFF', color:'#aaa' },
}

export default function ListeDetailPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const listeId = Array.isArray(params.listeId) ? params.listeId[0] : params.listeId
  const [liste, setListe] = useState<any>(null)
  const [articles, setArticles] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [profils, setProfils] = useState<any>({})
  const [showForm, setShowForm] = useState(false)
  const [nom, setNom] = useState("")
  const [quantite, setQuantite] = useState(1)
  const [unite, setUnite] = useState("unite")
  const [categorie, setCategorie] = useState("Alimentation")
  const [filtre, setFiltre] = useState("Tous")
  const [modeShopping, setModeShopping] = useState(false)
  const [prix, setPrix] = useState(0)

  useEffect(() => {
    if (listeId) {
      charger()
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user)
      })
    }
  }, [listeId])

  async function charger() {
    const { data: l } = await supabase.from("listes").select("*").eq("id", listeId).single()
    setListe(l)
    const { data: a } = await supabase.from("liste_articles").select("*").eq("liste_id", listeId).order("created_at", { ascending: true })
    setArticles(a || [])

    const { data: members } = await supabase.from("membres_groupe").select("user_id, profiles(prenom, nom)").eq("groupe_id", id)
    const p: any = {}
    members?.forEach((m: any) => { p[m.user_id] = m.profiles?.prenom || 'Membre' })
    setProfils(p)
  }

  async function ajouterArticle() {
    if (!nom.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("liste_articles").insert({ liste_id: listeId, nom, quantite, unite, categorie, prix, modifie_par: user?.id })
    setNom(""); setQuantite(1); setPrix(0); setShowForm(false); charger()
  }

  async function changerQuantite(art: any, delta: number) {
    const newQ = Math.max(0, art.quantite + delta)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("liste_articles").update({ quantite: newQ, modifie_par: user?.id, updated_at: new Date().toISOString() }).eq("id", art.id)
    setArticles(articles.map(a => a.id === art.id ? { ...a, quantite: newQ } : a))
  }

  async function toggleAchete(art: any) {
    await supabase.from("liste_articles").update({ achete: !art.achete }).eq("id", art.id)
    setArticles(articles.map(a => a.id === art.id ? { ...a, achete: !a.achete } : a))
  }

  async function supprimerArticle(artId: string) {
    await supabase.from("liste_articles").delete().eq("id", artId)
    setArticles(articles.filter(a => a.id !== artId))
  }

  const totalDepense = articles.reduce((sum, a) => sum + (parseFloat(a.prix || 0) * a.quantite), 0)
  const budgetListe = liste?.budget || 0
  const restebudget = budgetListe - totalDepense
  const articlesFiltres = articles.filter(a => filtre === 'Tous' || a.categorie === filtre)
  const nonAchetes = articles.filter(a => !a.achete).length

  const inp = {width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px',fontSize:'16px',color:'#1a1a2e',background:'#fff',marginBottom:'8px',boxSizing:'border-box' as any}

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 24px'}}>
        <a href={`/groupes/${id}/listes`} style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'8px'}}>← Listes</a>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
          <div style={{fontSize:'18px',fontWeight:'500',color:'#fff'}}>{liste?.titre || 'Liste'}</div>
          <button onClick={() => setModeShopping(!modeShopping)}
            style={{background: modeShopping ? '#D4A843' : 'rgba(255,255,255,0.15)',border:'none',borderRadius:'10px',padding:'7px 12px',color:'#fff',fontSize:'12px',cursor:'pointer',fontWeight:'500'}}>
            {modeShopping ? 'Mode normal' : 'Mode shopping'}
          </button>
        </div>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginBottom: budgetListe > 0 ? '12px' : 0}}>{nonAchetes} article{nonAchetes > 1 ? 's' : ''} restant{nonAchetes > 1 ? 's' : ''}</div>

        {budgetListe > 0 && (
          <div style={{background:'rgba(255,255,255,0.1)',borderRadius:'14px',padding:'14px',border:'0.5px solid rgba(255,255,255,0.15)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:'10px'}}>
              <div>
                <div style={{fontSize:'10px',color:'rgba(255,255,255,0.4)',marginBottom:'2px'}}>Depense</div>
                <div style={{fontSize:'20px',fontWeight:'600',color:'#fff'}}>{totalDepense.toFixed(2)} CHF</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'10px',color:'rgba(255,255,255,0.4)',marginBottom:'2px'}}>Budget</div>
                <div style={{fontSize:'20px',fontWeight:'600',color:'#fff'}}>{budgetListe.toFixed(2)} CHF</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,0.1)',borderRadius:'99px',height:'6px',overflow:'hidden',marginBottom:'6px'}}>
              <div style={{width: Math.min((totalDepense/budgetListe)*100, 100)+'%',height:'100%',background: restebudget < 0 ? '#F43F5E' : 'linear-gradient(90deg,#10B981,#D4A843)',borderRadius:'99px',transition:'width 0.3s'}}></div>
            </div>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',textAlign:'right'}}>
              Il reste <b style={{color: restebudget < 0 ? '#F43F5E' : '#10B981'}}>{restebudget.toFixed(2)} CHF</b>
            </div>
          </div>
        )}

        <div style={{display:'flex',gap:'6px',marginTop:'12px',overflowX:'auto',paddingBottom:'4px'}}>
          {['Tous', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFiltre(c)}
              style={{whiteSpace:'nowrap',padding:'5px 12px',borderRadius:'99px',border:'none',cursor:'pointer',fontSize:'11px',fontWeight:'500',
                background: filtre === c ? '#fff' : 'rgba(255,255,255,0.15)',
                color: filtre === c ? '#1a3a6e' : 'rgba(255,255,255,0.8)'}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'12px 14px'}}>
        {showForm && (
          <div style={{background:'#EEF5FF',borderRadius:'14px',padding:'14px',marginBottom:'14px',border:'0.5px solid #DCE9FF'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>Nouvel article</div>
            <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom de l'article" style={inp}/>
            <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:'11px',color:'#666',marginBottom:'4px'}}>Quantite</div>
              <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#fff',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'6px 10px'}}>
                <button onClick={() => setQuantite(Math.max(1,quantite-1))} style={{background:'#EEF5FF',border:'none',borderRadius:'50%',width:'28px',height:'28px',color:'#2B7FFF',cursor:'pointer',fontSize:'16px'}}>−</button>
                <span style={{flex:1,textAlign:'center',fontSize:'18px',fontWeight:'600',color:'#1a1a2e'}}>{quantite}</span>
                <button onClick={() => setQuantite(quantite+1)} style={{background:'#2B7FFF',border:'none',borderRadius:'50%',width:'28px',height:'28px',color:'#fff',cursor:'pointer',fontSize:'16px'}}>+</button>
              </div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:'11px',color:'#666',marginBottom:'4px'}}>Unite</div>
              <select value={unite} onChange={e => setUnite(e.target.value)} style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 10px',fontSize:'16px',color:'#1a1a2e',background:'#fff'}}>
                {['unite','kg','g','L','cl','paquet','bouteille','boite','sachet'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:'8px'}}>
            <div style={{fontSize:'11px',color:'#666',marginBottom:'4px'}}>Prix unitaire (CHF)</div>
            <input type="number" value={prix} onChange={e => setPrix(Number(e.target.value))} placeholder="0.00"
              style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 10px',fontSize:'16px',color:'#1a1a2e',background:'#fff',boxSizing:'border-box'}}/>
          </div>
          <div style={{fontSize:'11px',color:'#666',marginBottom:'4px'}}>Categorie</div>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'10px'}}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategorie(c)}
                  style={{padding:'5px 12px',borderRadius:'99px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:'500',
                    background: categorie === c ? '#2B7FFF' : '#EEF5FF',
                    color: categorie === c ? '#fff' : '#2B7FFF'}}>
                  {c}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={ajouterArticle} style={{flex:1,background:'#2B7FFF',color:'#fff',border:'none',borderRadius:'10px',padding:'10px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>Ajouter</button>
              <button onClick={() => setShowForm(false)} style={{flex:1,background:'#fff',color:'#666',border:'0.5px solid #E8F1FF',borderRadius:'10px',padding:'10px',fontSize:'13px',cursor:'pointer'}}>Annuler</button>
            </div>
          </div>
        )}

        <button onClick={() => setShowForm(!showForm)}
          style={{width:'100%',background:'#EEF5FF',color:'#2B7FFF',border:'0.5px solid #DCE9FF',borderRadius:'12px',padding:'12px',fontSize:'13px',fontWeight:'500',cursor:'pointer',marginBottom:'12px',display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter un article
        </button>

        {articlesFiltres.filter(a => !a.achete).map(art => (
          <div key={art.id} style={{background: art.quantite <= 1 ? '#FFF8F8' : '#fff',border:`0.5px solid ${art.quantite <= 1 ? '#FECDD3' : '#E8F1FF'}`,borderRadius:'14px',padding:'14px',marginBottom:'8px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              {modeShopping && (
                <input type="checkbox" checked={art.achete} onChange={() => toggleAchete(art)}
                  style={{width:'20px',height:'20px',flexShrink:0,accentColor:'#10B981',cursor:'pointer'}}/>
              )}
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'3px'}}>
                  <span style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{art.nom}</span>
                  <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'99px',fontWeight:'500',
                    background: CAT_COLORS[art.categorie]?.bg || '#F8FBFF',
                    color: CAT_COLORS[art.categorie]?.color || '#aaa'}}>
                    {art.categorie}
                  </span>
                  {art.quantite <= 1 && <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'99px',background:'#FFE4E6',color:'#F43F5E',fontWeight:'500'}}>Stock bas</span>}
                </div>
                <div style={{fontSize:'11px',color:'#aaa',display:'flex',gap:'8px',alignItems:'center'}}>
                  {profils[art.modifie_par] ? `Modifie par ${profils[art.modifie_par]}` : 'Ajoute'} · {art.unite}
                  {art.prix > 0 && <span style={{color:'#2B7FFF',fontWeight:'500'}}>{parseFloat(art.prix).toFixed(2)} CHF = {(parseFloat(art.prix)*art.quantite).toFixed(2)} CHF</span>}
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <button onClick={() => changerQuantite(art, -1)}
                  style={{width:'30px',height:'30px',borderRadius:'50%',border:'none',cursor:'pointer',fontSize:'18px',
                    background: art.quantite <= 1 ? '#FFE4E6' : '#EEF5FF',
                    color: art.quantite <= 1 ? '#F43F5E' : '#2B7FFF'}}>−</button>
                <span style={{fontSize:'20px',fontWeight:'600',minWidth:'24px',textAlign:'center',
                  color: art.quantite <= 1 ? '#F43F5E' : '#1a1a2e'}}>{art.quantite}</span>
                <button onClick={() => changerQuantite(art, 1)}
                  style={{width:'30px',height:'30px',borderRadius:'50%',border:'none',cursor:'pointer',fontSize:'18px',
                    background:'#2B7FFF',color:'#fff'}}>+</button>
                <button onClick={() => supprimerArticle(art.id)}
                  style={{width:'26px',height:'26px',borderRadius:'50%',background:'#F8FBFF',border:'0.5px solid #E8F1FF',cursor:'pointer',color:'#aaa',fontSize:'12px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {articlesFiltres.filter(a => a.achete).length > 0 && (
          <>
            <div style={{fontSize:'11px',color:'#aaa',fontWeight:'500',textTransform:'uppercase',letterSpacing:'.05em',margin:'16px 0 8px'}}>Achetes</div>
            {articlesFiltres.filter(a => a.achete).map(art => (
              <div key={art.id} style={{background:'#F8FBFF',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'14px',marginBottom:'8px',opacity:0.6,display:'flex',alignItems:'center',gap:'12px'}}>
                <input type="checkbox" checked onChange={() => toggleAchete(art)} style={{width:'18px',height:'18px',accentColor:'#10B981',cursor:'pointer'}}/>
                <span style={{fontSize:'13px',color:'#aaa',flex:1,textDecoration:'line-through'}}>{art.nom}</span>
                <span style={{fontSize:'12px',color:'#10B981',fontWeight:'500'}}>OK</span>
              </div>
            ))}
          </>
        )}

        {articlesFiltres.length === 0 && (
          <div style={{textAlign:'center',padding:'32px 0',color:'#aaa',fontSize:'13px'}}>Aucun article dans cette categorie</div>
        )}
      </div>
    </main>
  )
}
