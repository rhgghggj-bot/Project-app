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
  const [prix, setPrix] = useState<string>("")

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
    const statut = modeShopping ? "a_acheter" : "possede"
    await supabase.from("liste_articles").insert({ liste_id: listeId, nom, quantite, unite, categorie, prix: parseFloat(String(prix).replace(",",".")) || 0, modifie_par: user?.id, statut })
    setNom(""); setQuantite(1); setPrix(""); setShowForm(false); charger()
  }

  async function changerQuantite(art: any, delta: number) {
    const newQ = Math.max(0, art.quantite + delta)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("liste_articles").update({ quantite: newQ, modifie_par: user?.id, updated_at: new Date().toISOString() }).eq("id", art.id)
    setArticles(articles.map(a => a.id === art.id ? { ...a, quantite: newQ } : a))
  }

  function exporterPDF() {
    const titre = liste?.titre || 'Liste'
    const date = new Date().toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'})
    const totalDep = articles.reduce((sum, a) => sum + (parseFloat(a.prix || 0) * a.quantite), 0)
    const budget = liste?.budget || 0

    const lignes = articles.map(a => `
      <tr style="border-bottom:1px solid #E8F1FF">
        <td style="padding:10px 12px;font-size:13px;color:#1a1a2e">${a.nom}</td>
        <td style="padding:10px 12px;font-size:13px;color:#666;text-align:center">${a.categorie}</td>
        <td style="padding:10px 12px;font-size:13px;color:#1a1a2e;text-align:center">${a.quantite} ${a.unite}</td>
        <td style="padding:10px 12px;font-size:13px;color:#2B7FFF;text-align:right">${a.prix > 0 ? parseFloat(a.prix).toFixed(2)+' CHF' : '—'}</td>
        <td style="padding:10px 12px;font-size:13px;font-weight:500;color:#1a1a2e;text-align:right">${a.prix > 0 ? (parseFloat(a.prix)*a.quantite).toFixed(2)+' CHF' : '—'}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${titre}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 24px; color: #1a1a2e; }
    .header { background: linear-gradient(135deg, #0A1628, #1a3a6e); color: white; padding: 24px; border-radius: 12px; margin-bottom: 20px; }
    .header h1 { margin: 0 0 4px; font-size: 20px; }
    .header p { margin: 0; opacity: 0.6; font-size: 13px; }
    .budget { display: flex; justify-content: space-between; background: #F8FBFF; border: 1px solid #E8F1FF; border-radius: 10px; padding: 14px; margin-bottom: 20px; }
    .budget div { text-align: center; }
    .budget label { font-size: 11px; color: #aaa; display: block; margin-bottom: 4px; }
    .budget value { font-size: 18px; font-weight: 600; display: block; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 12px; background: #F8FBFF; font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: .05em; }
    th:last-child, th:nth-child(4), th:nth-child(3) { text-align: right; }
    .footer { text-align: center; font-size: 11px; color: #aaa; margin-top: 20px; padding-top: 12px; border-top: 1px solid #E8F1FF; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${titre}</h1>
    <p>Genere le ${date} · Nexia App</p>
  </div>
  ${budget > 0 ? `<div class="budget">
    <div><label>Total depense</label><value style="color:#F43F5E">${totalDep.toFixed(2)} CHF</value></div>
    <div><label>Budget</label><value>${budget.toFixed(2)} CHF</value></div>
    <div><label>Restant</label><value style="color:#10B981">${(budget-totalDep).toFixed(2)} CHF</value></div>
  </div>` : ''}
  <table>
    <tr>
      <th>Article</th><th>Categorie</th><th style="text-align:center">Quantite</th><th style="text-align:right">Prix unit.</th><th style="text-align:right">Total</th>
    </tr>
    ${lignes}
    <tr style="background:#F8FBFF;font-weight:600">
      <td colspan="4" style="padding:10px 12px;font-size:13px">Total</td>
      <td style="padding:10px 12px;font-size:14px;color:#2B7FFF;text-align:right">${totalDep.toFixed(2)} CHF</td>
    </tr>
  </table>
  <div class="footer">Nexia App · Liste partagee · ${date}</div>
</body>
</html>`

    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500) }
  }

  async function marquerAchete(art: any) {
    // Passage definitif de "a acheter" vers "possede" : ne revient plus tout seul dans la liste shopping
    const { data: { user: u } } = await supabase.auth.getUser()
    await supabase.from('liste_articles').update({
      statut: 'possede',
      modifie_par: u?.id,
      updated_at: new Date().toISOString()
    }).eq('id', art.id)
    setArticles(articles.map(a => a.id === art.id ? { ...a, statut: 'possede' } : a))
  }

  async function supprimerArticle(artId: string) {
    await supabase.from("liste_articles").delete().eq("id", artId)
    setArticles(articles.filter(a => a.id !== artId))
  }

  const totalDepense = articles.reduce((sum, a) => sum + (parseFloat(a.prix || 0) * a.quantite), 0)
  const budgetListe = liste?.budget || 0
  const restebudget = budgetListe - totalDepense
  const articlesFiltres = articles.filter(a => filtre === 'Tous' || a.categorie === filtre)
  const nonAchetes = modeShopping ? articles.filter(a => a.statut === 'a_acheter').length : articles.filter(a => (a.statut || 'possede') === 'possede').length

  const inp = {width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 12px',fontSize:'16px',color:'#1a1a2e',background:'#fff',marginBottom:'8px',boxSizing:'border-box' as any}

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 24px'}}>
        <a href={`/groupes/${id}/listes`} style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'8px'}}>← Listes</a>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
          <div style={{fontSize:'18px',fontWeight:'500',color:'#fff'}}>{liste?.titre || 'Liste'}</div>
          <button onClick={() => setModeShopping(!modeShopping)}
            style={{background: modeShopping ? '#D4A843' : 'rgba(255,255,255,0.15)',border:'none',borderRadius:'10px',padding:'7px 12px',color:'#fff',fontSize:'12px',cursor:'pointer',fontWeight:'500'}}>
            {modeShopping ? 'Mode normal' : 'Mode shopping'}</button>
        <button onClick={exporterPDF}
          style={{background:'rgba(255,255,255,0.15)',border:'0.5px solid rgba(255,255,255,0.3)',borderRadius:'10px',padding:'7px 10px',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginBottom: budgetListe > 0 ? '12px' : 0}}>{nonAchetes} article{nonAchetes > 1 ? 's' : ''} restant{nonAchetes > 1 ? 's' : ''}</div>

        {modeShopping && budgetListe > 0 && (
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
            <div style={{fontSize:'11px',color: modeShopping ? '#D4A843' : '#2B7FFF',fontWeight:'600',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'.04em'}}>
              {modeShopping ? 'Ajout dans : À acheter' : 'Ajout dans : Ce que je possède'}
            </div>
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
            <input type="number" value={prix} onChange={e => setPrix(e.target.value)} placeholder="Ex: 8.50"
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

        {articlesFiltres.filter(a => modeShopping ? a.statut === 'a_acheter' : (a.statut || 'possede') === 'possede').map(art => (
          <div key={art.id} style={{background: art.quantite <= 1 && !modeShopping ? '#FFF8F8' : '#fff', border:`0.5px solid ${art.quantite <= 1 && !modeShopping ? '#FECDD3' : '#E8F1FF'}`,borderRadius:'14px',padding:'14px',marginBottom:'8px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              {modeShopping && (
                <input type="checkbox" checked={false} onChange={() => marquerAchete(art)}
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
                  {art.quantite <= 1 && !modeShopping && <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'99px',background:'#FFE4E6',color:'#F43F5E',fontWeight:'500'}}>Stock bas</span>}
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

        {articlesFiltres.filter(a => modeShopping ? a.statut === 'a_acheter' : (a.statut || 'possede') === 'possede').length === 0 && (
          <div style={{textAlign:'center',padding:'32px 0',color:'#aaa',fontSize:'13px'}}>{modeShopping ? "Rien a acheter pour l'instant" : "Aucun article dans cette categorie"}</div>
        )}
      </div>
    </main>
  )
}
