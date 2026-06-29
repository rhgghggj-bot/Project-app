"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const CAT_DEPENSES = ["🏠 Logement","🛡️ Assurance maladie","🚗 Assurance voiture","🏡 Assurance maison","⛽ Transport","🍽️ Alimentation","💊 Santé","📱 Téléphone","💡 Énergie","🎮 Loisirs","📦 Autres"]
const CAT_REVENUS = ["💼 Salaire","🏢 Freelance","📈 Investissement","🎁 Don / Cadeau","🏦 Allocation","💰 Autre revenu"]
const MOIS_NOMS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"]

export default function Finances() {
  const [depenses, setDepenses] = useState<any[]>([])
  const [revenus, setRevenus] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [onglet, setOnglet] = useState("vue")
  const [showForm, setShowForm] = useState(false)
  const [typeForm, setTypeForm] = useState<"depense"|"revenu">("depense")
  const [titre, setTitre] = useState("")
  const [montant, setMontant] = useState("")
  const [categorie, setCategorie] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [recurrent, setRecurrent] = useState(false)
  const [moisSelectionne, setMoisSelectionne] = useState<any>(null)
  const [objectif, setObjectif] = useState("")
  const [montantEpargne, setMontantEpargne] = useState("")
  const [duree, setDuree] = useState("12")
  const [showEpargne, setShowEpargne] = useState(false)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data: d } = await supabase.from("depenses").select("*").eq("user_id", user.id).order("date", { ascending: false })
        setDepenses(d || [])
        const { data: r } = await supabase.from("revenus").select("*").eq("user_id", user.id).order("date", { ascending: false })
        setRevenus(r || [])
      }
    }
    charger()
  }, [])

  async function ajouter() {
    if (!titre || !montant) return
    const table = typeForm === "depense" ? "depenses" : "revenus"
    const { error } = await supabase.from(table).insert({
      user_id: user.id, titre, montant: parseFloat(montant), categorie, date, recurrent
    })
    if (!error) {
      setTitre(""); setMontant(""); setCategorie(""); setRecurrent(false); setShowForm(false)
      const { data: d } = await supabase.from("depenses").select("*").eq("user_id", user.id).order("date", { ascending: false })
      setDepenses(d || [])
      const { data: r } = await supabase.from("revenus").select("*").eq("user_id", user.id).order("date", { ascending: false })
      setRevenus(r || [])
    }
  }

  async function supprimer(id: string, type: "depense"|"revenu") {
    await supabase.from(type === "depense" ? "depenses" : "revenus").delete().eq("id", id)
    if (type === "depense") setDepenses(depenses.filter(d => d.id !== id))
    else setRevenus(revenus.filter(r => r.id !== id))
  }

  const today = new Date()
  const moisActuel = today.getMonth()
  const anneeActuelle = today.getFullYear()

  const filtrerMois = (items: any[], mois: number, annee: number) =>
    items.filter(d => { const dt = new Date(d.date); return dt.getMonth() === mois && dt.getFullYear() === annee })

  const totalMois = (items: any[], mois: number, annee: number) =>
    filtrerMois(items, mois, annee).reduce((s, d) => s + parseFloat(d.montant), 0)

  const donneesGraphique = Array.from({length: 6}, (_, i) => {
    const m = (moisActuel - 5 + i + 12) % 12
    const a = moisActuel - 5 + i < 0 ? anneeActuelle - 1 : anneeActuelle
    return { mois: m, annee: a, label: MOIS_NOMS[m], depenses: totalMois(depenses, m, a), revenus: totalMois(revenus, m, a) }
  })

  const moisActuelData = donneesGraphique[5]
  const solde = moisActuelData.revenus - moisActuelData.depenses
  const maxVal = Math.max(...donneesGraphique.map(d => Math.max(d.depenses, d.revenus)), 1)
  const pctDepenses = moisActuelData.revenus > 0 ? Math.min((moisActuelData.depenses / moisActuelData.revenus) * 100, 100) : 0
  const statutSolde = solde > 0 ? "benefice" : solde < 0 ? "deficit" : "equilibre"
  const couleurSolde = statutSolde === "benefice" ? "#10B981" : statutSolde === "deficit" ? "#F43F5E" : "#D4A843"
  const iconeSolde = statutSolde === "benefice" ? "✅" : statutSolde === "deficit" ? "🔴" : "⚠️"
  const texteSolde = statutSolde === "benefice" ? "Bénéfice" : statutSolde === "deficit" ? "Déficit" : "Équilibre"

  const moisMaxDep = donneesGraphique.reduce((a, b) => a.depenses > b.depenses ? a : b)
  const moisMinDep = donneesGraphique.filter(d => d.depenses > 0).reduce((a, b) => a.depenses < b.depenses ? a : b, donneesGraphique[0])

  const depensesMoisAff = moisSelectionne ? filtrerMois(depenses, moisSelectionne.mois, moisSelectionne.annee) : filtrerMois(depenses, moisActuel, anneeActuelle)
  const revenusMoisAff = moisSelectionne ? filtrerMois(revenus, moisSelectionne.mois, moisSelectionne.annee) : filtrerMois(revenus, moisActuel, anneeActuelle)
  const totalDep = depensesMoisAff.reduce((s, d) => s + parseFloat(d.montant), 0)

  const depensesParCat = CAT_DEPENSES.map(cat => ({
    cat, total: filtrerMois(depenses, moisSelectionne?.mois ?? moisActuel, moisSelectionne?.annee ?? anneeActuelle)
      .filter(d => d.categorie === cat).reduce((s, d) => s + parseFloat(d.montant), 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const ItemDepense = ({ d, type }: { d: any, type: "depense"|"revenu" }) => (
    <div style={{background: type === "revenu" ? '#F0FFF8' : '#fff', border:`0.5px solid ${type === "revenu" ? '#A7F3D0' : '#E8F1FF'}`,borderRadius:'14px',padding:'12px 14px',marginBottom:'8px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',flex:1}}>
        <div style={{width:'36px',height:'36px',background: type === "revenu" ? '#E1F5EE' : '#EEF5FF',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>
          {d.categorie?.split(' ')[0] || (type === "revenu" ? '💰' : '📦')}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{d.titre}</div>
          <div style={{fontSize:'11px',color:'#aaa'}}>{new Date(d.date).toLocaleDateString('fr-FR')} {d.recurrent ? '· 🔄' : ''}</div>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
        <div style={{fontSize:'14px',fontWeight:'500',color: type === "revenu" ? '#10B981' : '#F43F5E'}}>
          {type === "revenu" ? '+' : '-'}{parseFloat(d.montant).toFixed(0)} CHF
        </div>
        <a href={`/modifier-depense/${d.id}?type=${type}`}>
          <button style={{background:'#F0F8FF',border:'none',borderRadius:'8px',width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'12px'}}>✏️</button>
        </a>
        <button onClick={() => supprimer(d.id, type)} style={{background:'none',border:'none',color:'#ddd',cursor:'pointer',fontSize:'16px'}}>×</button>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 28px'}}>
        <a href="/" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'8px'}}>← Accueil</a>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginBottom:'8px'}}>Bilan du mois</div>
        <div style={{background:'rgba(255,255,255,0.08)',borderRadius:'16px',padding:'16px',marginBottom:'12px',border:`1px solid ${couleurSolde}44`}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
            <span style={{fontSize:'20px'}}>{iconeSolde}</span>
            <span style={{fontSize:'14px',fontWeight:'500',color:couleurSolde}}>{texteSolde}</span>
          </div>
          <div style={{fontSize:'32px',fontWeight:'500',color:couleurSolde,marginBottom:'8px'}}>
            {solde >= 0 ? '+' : ''}{solde.toFixed(0)} CHF
          </div>
          <div style={{height:'8px',background:'rgba(255,255,255,0.1)',borderRadius:'99px',overflow:'hidden',marginBottom:'6px'}}>
            <div style={{height:'100%',width:`${pctDepenses}%`,background: pctDepenses > 90 ? '#F43F5E' : pctDepenses > 70 ? '#D4A843' : '#10B981',borderRadius:'99px'}}></div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:'12px',color:'rgba(255,255,255,0.6)'}}>Dépenses : {pctDepenses.toFixed(0)}% des revenus</span>
            <span style={{fontSize:'12px',color: pctDepenses > 90 ? '#F43F5E' : pctDepenses > 70 ? '#D4A843' : '#10B981',fontWeight:'500'}}>
              {pctDepenses > 90 ? '⚠️ Attention' : pctDepenses > 70 ? '👀 Surveille' : '👍 Bon rythme'}
            </span>
          </div>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <div style={{flex:1,background:'rgba(16,185,129,0.15)',borderRadius:'12px',padding:'10px 12px',border:'0.5px solid rgba(16,185,129,0.3)'}}>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',marginBottom:'3px'}}>📈 Revenus</div>
            <div style={{fontSize:'18px',fontWeight:'500',color:'#4ade80'}}>{moisActuelData.revenus.toFixed(0)} CHF</div>
          </div>
          <div style={{flex:1,background:'rgba(244,63,94,0.15)',borderRadius:'12px',padding:'10px 12px',border:'0.5px solid rgba(244,63,94,0.3)'}}>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',marginBottom:'3px'}}>📉 Dépenses</div>
            <div style={{fontSize:'18px',fontWeight:'500',color:'#F43F5E'}}>{moisActuelData.depenses.toFixed(0)} CHF</div>
          </div>
        </div>
      </div>

      <div style={{display:'flex',borderBottom:'0.5px solid #E8F1FF',background:'#fff',position:'sticky',top:0,zIndex:10}}>
        {["vue","revenus","charges","epargne"].map(o => (
          <button key={o} onClick={() => setOnglet(o)}
            style={{flex:1,padding:'12px 0',fontSize:'12px',fontWeight:'500',border:'none',background:'none',cursor:'pointer',
              color: onglet === o ? '#2B7FFF' : '#aaa',
              borderBottom: onglet === o ? '2px solid #2B7FFF' : '2px solid transparent'}}>
            {o === "vue" ? "📊 Vue" : o === "revenus" ? "💰 Revenus" : o === "charges" ? "🔄 Charges" : "💎 Épargne"}
          </button>
        ))}
      </div>

      {onglet === "vue" && (
        <div style={{padding:'16px 18px'}}>
          <div style={{background:'rgba(255,255,255,0.9)',border:'0.5px solid #E8F1FF',borderRadius:'18px',padding:'16px',marginBottom:'14px',boxShadow:'0 4px 24px rgba(43,127,255,0.08)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
              <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>6 derniers mois</div>
              <div style={{display:'flex',gap:'10px'}}>
                <span style={{fontSize:'11px',color:'#F43F5E'}}>■ Dépenses</span>
                <span style={{fontSize:'11px',color:'#4ade80'}}>■ Revenus</span>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'flex-end',gap:'6px',height:'120px',marginBottom:'8px'}}>
              {donneesGraphique.map((d, i) => {
                const estActuel = d.mois === moisActuel
                const estSel = moisSelectionne?.mois === d.mois
                const hDep = d.depenses > 0 ? Math.max((d.depenses/maxVal)*100, 8) : 3
                const hRev = d.revenus > 0 ? Math.max((d.revenus/maxVal)*100, 8) : 3
                const soldeMois = d.revenus - d.depenses
                return (
                  <div key={i} onClick={() => setMoisSelectionne(estSel ? null : d)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',cursor:'pointer'}}>
                    <div style={{width:'100%',display:'flex',gap:'2px',alignItems:'flex-end',height:'100px'}}>
                      <div style={{flex:1,height:`${hDep}%`,borderRadius:'4px 4px 0 0',background: estSel ? '#1a1a2e' : '#F43F5E',opacity: d.depenses === 0 ? 0.2 : 1}}></div>
                      <div style={{flex:1,height:`${hRev}%`,borderRadius:'4px 4px 0 0',background: estSel ? '#D4A843' : '#4ade80',opacity: d.revenus === 0 ? 0.2 : 1}}></div>
                    </div>
                    <div style={{fontSize:'9px',color: soldeMois > 0 ? '#10B981' : soldeMois < 0 ? '#F43F5E' : '#aaa',fontWeight:'500'}}>
                      {soldeMois !== 0 ? (soldeMois > 0 ? '+' : '') + soldeMois.toFixed(0) : '-'}
                    </div>
                    <div style={{fontSize:'10px',color: estActuel ? '#2B7FFF' : '#aaa',fontWeight: estActuel ? '500' : '400'}}>{d.label}</div>
                  </div>
                )
              })}
            </div>
            {moisSelectionne && (
              <div style={{background:'#F8FBFF',borderRadius:'10px',padding:'10px 12px',marginTop:'6px',border:`0.5px solid ${moisSelectionne.revenus - moisSelectionne.depenses >= 0 ? '#A7F3D0' : '#FECDD3'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                  <span style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{moisSelectionne.label} {moisSelectionne.annee}</span>
                  <span style={{fontSize:'13px',fontWeight:'500',color: moisSelectionne.revenus - moisSelectionne.depenses >= 0 ? '#10B981' : '#F43F5E'}}>
                    {moisSelectionne.revenus - moisSelectionne.depenses >= 0 ? '+' : ''}{(moisSelectionne.revenus - moisSelectionne.depenses).toFixed(0)} CHF
                  </span>
                </div>
                <div style={{display:'flex',gap:'12px'}}>
                  <span style={{fontSize:'12px',color:'#F43F5E'}}>📉 {moisSelectionne.depenses.toFixed(0)} CHF</span>
                  <span style={{fontSize:'12px',color:'#4ade80'}}>📈 {moisSelectionne.revenus.toFixed(0)} CHF</span>
                </div>
                <button onClick={() => setMoisSelectionne(null)} style={{fontSize:'11px',color:'#aaa',background:'none',border:'none',cursor:'pointer',marginTop:'4px'}}>× Fermer</button>
              </div>
            )}
          </div>

          <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
            <div style={{flex:1,background:'#E1F5EE',borderRadius:'14px',padding:'12px',border:'0.5px solid #A7F3D0'}}>
              <div style={{fontSize:'10px',color:'#10B981',fontWeight:'500',marginBottom:'4px'}}>📉 Mois le moins cher</div>
              <div style={{fontSize:'15px',fontWeight:'500',color:'#1a1a2e'}}>{moisMinDep?.label || '-'}</div>
              <div style={{fontSize:'12px',color:'#10B981'}}>{moisMinDep?.depenses.toFixed(0) || 0} CHF</div>
            </div>
            <div style={{flex:1,background:'#FFE4E6',borderRadius:'14px',padding:'12px',border:'0.5px solid #FECDD3'}}>
              <div style={{fontSize:'10px',color:'#F43F5E',fontWeight:'500',marginBottom:'4px'}}>📈 Mois le plus cher</div>
              <div style={{fontSize:'15px',fontWeight:'500',color:'#1a1a2e'}}>{moisMaxDep.label}</div>
              <div style={{fontSize:'12px',color:'#F43F5E'}}>{moisMaxDep.depenses.toFixed(0)} CHF</div>
            </div>
          </div>

          {depensesParCat.length > 0 && (
            <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px',marginBottom:'14px'}}>
              <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'12px'}}>Répartition dépenses</div>
              {depensesParCat.map((c, i) => (
                <div key={i} style={{marginBottom:'8px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                    <span style={{fontSize:'12px',color:'#666'}}>{c.cat}</span>
                    <span style={{fontSize:'12px',fontWeight:'500',color:'#1a1a2e'}}>{c.total.toFixed(0)} CHF · {totalDep > 0 ? ((c.total/totalDep)*100).toFixed(0) : 0}%</span>
                  </div>
                  <div style={{height:'6px',background:'#F0F8FF',borderRadius:'99px',overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${totalDep > 0 ? (c.total/totalDep)*100 : 0}%`,background:'linear-gradient(90deg,#F43F5E,#F59E0B)',borderRadius:'99px'}}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
            <button onClick={() => { setTypeForm("depense"); setShowForm(!showForm) }}
              style={{flex:1,background:'#FFE4E6',color:'#F43F5E',fontSize:'13px',fontWeight:'500',padding:'10px',borderRadius:'12px',border:'none',cursor:'pointer'}}>
              ➖ Dépense
            </button>
            <button onClick={() => { setTypeForm("revenu"); setShowForm(!showForm) }}
              style={{flex:1,background:'#E1F5EE',color:'#10B981',fontSize:'13px',fontWeight:'500',padding:'10px',borderRadius:'12px',border:'none',cursor:'pointer'}}>
              ➕ Revenu
            </button>
          </div>

          {showForm && (
            <div style={{background: typeForm === "depense" ? '#FFF5F5' : '#F0FFF8',borderRadius:'16px',padding:'14px',marginBottom:'12px',border:`0.5px solid ${typeForm === "depense" ? '#FECDD3' : '#A7F3D0'}`}}>
              <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>{typeForm === "depense" ? '➖ Nouvelle dépense' : '➕ Nouveau revenu'}</div>
              <input value={titre} onChange={e => setTitre(e.target.value)} placeholder={typeForm === "depense" ? "Ex: Loyer..." : "Ex: Salaire..."}
                style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#fff',marginBottom:'8px'}}/>
              <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
                <input value={montant} onChange={e => setMontant(e.target.value)} placeholder="Montant CHF" type="number"
                  style={{flex:1,border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#fff'}}/>
                <input value={date} onChange={e => setDate(e.target.value)} type="date"
                  style={{flex:1,border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#fff'}}/>
              </div>
              <select value={categorie} onChange={e => setCategorie(e.target.value)}
                style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#fff',marginBottom:'8px'}}>
                <option value="">Catégorie</option>
                {(typeForm === "depense" ? CAT_DEPENSES : CAT_REVENUS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                <input type="checkbox" checked={recurrent} onChange={e => setRecurrent(e.target.checked)} id="rec"/>
                <label htmlFor="rec" style={{fontSize:'13px',color:'#666'}}>Récurrent (mensuel)</label>
              </div>
              <button onClick={ajouter}
                style={{width:'100%',background: typeForm === "depense" ? '#F43F5E' : '#10B981',color:'#fff',fontSize:'13px',fontWeight:'500',padding:'10px',borderRadius:'10px',border:'none',cursor:'pointer'}}>
                Enregistrer
              </button>
            </div>
          )}

          <div style={{fontSize:'11px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:'500',marginBottom:'10px'}}>
            {moisSelectionne ? `${moisSelectionne.label} ${moisSelectionne.annee}` : 'Ce mois'}
          </div>

          {revenusMoisAff.map((r: any) => <ItemDepense key={r.id} d={r} type="revenu" />)}
          {depensesMoisAff.map((d: any) => <ItemDepense key={d.id} d={d} type="depense" />)}

          {depensesMoisAff.length === 0 && revenusMoisAff.length === 0 && (
            <div style={{textAlign:'center',padding:'32px 0',color:'#aaa'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>💸</div>
              <div style={{fontSize:'13px'}}>Rien ce mois — ajoute une dépense ou un revenu !</div>
            </div>
          )}
        </div>
      )}

      {onglet === "revenus" && (
        <div style={{padding:'16px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
            <div style={{fontSize:'11px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:'500'}}>Tous les revenus</div>
            <button onClick={() => { setTypeForm("revenu"); setShowForm(!showForm) }}
              style={{fontSize:'12px',background:'#10B981',color:'#fff',border:'none',padding:'6px 14px',borderRadius:'99px',cursor:'pointer',fontWeight:'500'}}>+ Revenu</button>
          </div>
          {showForm && (
            <div style={{background:'#F0FFF8',borderRadius:'16px',padding:'14px',marginBottom:'12px',border:'0.5px solid #A7F3D0'}}>
              <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Salaire juin"
                style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#fff',marginBottom:'8px'}}/>
              <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
                <input value={montant} onChange={e => setMontant(e.target.value)} placeholder="Montant" type="number"
                  style={{flex:1,border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#fff'}}/>
                <input value={date} onChange={e => setDate(e.target.value)} type="date"
                  style={{flex:1,border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#fff'}}/>
              </div>
              <select value={categorie} onChange={e => setCategorie(e.target.value)}
                style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#fff',marginBottom:'8px'}}>
                <option value="">Catégorie</option>
                {CAT_REVENUS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                <input type="checkbox" checked={recurrent} onChange={e => setRecurrent(e.target.checked)} id="rec2"/>
                <label htmlFor="rec2" style={{fontSize:'13px',color:'#666'}}>Récurrent (mensuel)</label>
              </div>
              <button onClick={ajouter}
                style={{width:'100%',background:'#10B981',color:'#fff',fontSize:'13px',fontWeight:'500',padding:'10px',borderRadius:'10px',border:'none',cursor:'pointer'}}>
                Enregistrer
              </button>
            </div>
          )}
          {revenus.length === 0 && (
            <div style={{textAlign:'center',padding:'32px 0',color:'#aaa'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>💰</div>
              <div style={{fontSize:'13px'}}>Aucun revenu enregistré</div>
            </div>
          )}
          {revenus.map((r: any) => <ItemDepense key={r.id} d={r} type="revenu" />)}
        </div>
      )}

      {onglet === "charges" && (
        <div style={{padding:'16px 18px'}}>
          <div style={{fontSize:'11px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:'500',marginBottom:'10px'}}>Charges fixes mensuelles</div>
          {depenses.filter(d => d.recurrent).length === 0 && revenus.filter(r => r.recurrent).length === 0 && (
            <div style={{textAlign:'center',padding:'32px 0',color:'#aaa'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>🔄</div>
              <div style={{fontSize:'13px'}}>Coche "Récurrent" en ajoutant une dépense</div>
            </div>
          )}
          {revenus.filter(r => r.recurrent).map((r: any) => <ItemDepense key={r.id} d={r} type="revenu" />)}
          {depenses.filter(d => d.recurrent).map((d: any) => <ItemDepense key={d.id} d={d} type="depense" />)}
          {(depenses.filter(d => d.recurrent).length > 0 || revenus.filter(r => r.recurrent).length > 0) && (
            <div style={{background:'#EEF5FF',borderRadius:'14px',padding:'14px',marginTop:'8px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                <span style={{fontSize:'13px',color:'#10B981',fontWeight:'500'}}>Revenus fixes</span>
                <span style={{fontSize:'14px',fontWeight:'500',color:'#10B981'}}>+{revenus.filter(r=>r.recurrent).reduce((s,r)=>s+parseFloat(r.montant),0).toFixed(0)} CHF</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                <span style={{fontSize:'13px',color:'#F43F5E',fontWeight:'500'}}>Charges fixes</span>
                <span style={{fontSize:'14px',fontWeight:'500',color:'#F43F5E'}}>-{depenses.filter(d=>d.recurrent).reduce((s,d)=>s+parseFloat(d.montant),0).toFixed(0)} CHF</span>
              </div>
              <div style={{height:'0.5px',background:'#DCE9FF',margin:'8px 0'}}></div>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:'13px',fontWeight:'500',color:'#2B7FFF'}}>Reste après charges</span>
                <span style={{fontSize:'15px',fontWeight:'500',color:(revenus.filter(r=>r.recurrent).reduce((s,r)=>s+parseFloat(r.montant),0)-depenses.filter(d=>d.recurrent).reduce((s,d)=>s+parseFloat(d.montant),0))>=0?'#10B981':'#F43F5E'}}>
                  {(revenus.filter(r=>r.recurrent).reduce((s,r)=>s+parseFloat(r.montant),0)-depenses.filter(d=>d.recurrent).reduce((s,d)=>s+parseFloat(d.montant),0)).toFixed(0)} CHF
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      {onglet === "epargne" && (
        <div style={{padding:'16px 18px'}}>
          <div style={{background:'linear-gradient(135deg,#1a3a6e,#2B7FFF)',borderRadius:'18px',padding:'16px',marginBottom:'14px'}}>
            <div style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>💎 Plan d'épargne</div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>Définis ton objectif et on calcule tout</div>
          </div>

          <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px',marginBottom:'12px'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'12px'}}>Mon objectif</div>
            <input value={objectif} onChange={e => setObjectif(e.target.value)} placeholder="Ex: Voyage au Japon, Voiture..."
              style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF',marginBottom:'8px'}}/>
            <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:'11px',color:'#aaa',marginBottom:'4px'}}>Montant cible (CHF)</div>
                <input value={montantEpargne} onChange={e => setMontantEpargne(e.target.value)} placeholder="Ex: 5000" type="number"
                  style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF'}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:'11px',color:'#aaa',marginBottom:'4px'}}>En combien de mois</div>
                <input value={duree} onChange={e => setDuree(e.target.value)} placeholder="Ex: 12" type="number"
                  style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF'}}/>
              </div>
            </div>

            {montantEpargne && duree && (() => {
              const cible = parseFloat(montantEpargne)
              const mois = parseInt(duree)
              const parMois = cible / mois
              const resteApresCharges = revenus.filter(r=>r.recurrent).reduce((s,r)=>s+parseFloat(r.montant),0) - depenses.filter(d=>d.recurrent).reduce((s,d)=>s+parseFloat(d.montant),0)
              const faisable = parMois <= resteApresCharges
              const pct = resteApresCharges > 0 ? Math.min((parMois / resteApresCharges) * 100, 100) : 0

              return (
                <div style={{background: faisable ? '#F0FFF8' : '#FFF5F5',borderRadius:'12px',padding:'12px',border:`0.5px solid ${faisable ? '#A7F3D0' : '#FECDD3'}`}}>
                  <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'8px'}}>
                    {faisable ? '✅ Objectif atteignable' : '⚠️ Objectif ambitieux'}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                    <span style={{fontSize:'12px',color:'#666'}}>A epargner par mois</span>
                    <span style={{fontSize:'14px',fontWeight:'500',color: faisable ? '#10B981' : '#F43F5E'}}>{parMois.toFixed(0)} CHF</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                    <span style={{fontSize:'12px',color:'#666'}}>Reste disponible</span>
                    <span style={{fontSize:'12px',color:'#2B7FFF'}}>{resteApresCharges.toFixed(0)} CHF</span>
                  </div>
                  <div style={{height:'8px',background:'#E8F1FF',borderRadius:'99px',overflow:'hidden',marginBottom:'10px'}}>
                    <div style={{height:'100%',width:`${pct}%`,background: faisable ? '#10B981' : '#F43F5E',borderRadius:'99px'}}></div>
                  </div>
                  <div style={{fontSize:'11px',color:'#aaa'}}>Représente {pct.toFixed(0)}% de ton reste disponible</div>
                </div>
              )
            })()}

            {montantEpargne && duree && (() => {
              const cible = parseFloat(montantEpargne)
              const mois = parseInt(duree)
              const parMois = cible / mois
              const projections = Array.from({length: mois}, (_, i) => ({
                mois: i + 1,
                cumul: parMois * (i + 1)
              }))
              const max = cible
              return (
                <div style={{marginTop:'14px'}}>
                  <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>📈 Projection mois par mois</div>
                  <div style={{display:'flex',alignItems:'flex-end',gap:'3px',height:'100px',marginBottom:'8px'}}>
                    {projections.map((p, i) => (
                      <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
                        <div style={{width:'100%',height:Math.max((p.cumul/max)*90, 4) + 'px',borderRadius:'3px 3px 0 0',background: p.cumul >= cible ? '#10B981' : '#2B7FFF',opacity: 0.7 + (i/mois)*0.3}}></div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontSize:'10px',color:'#aaa'}}>Mois 1</span>
                    <span style={{fontSize:'10px',color:'#10B981',fontWeight:'500'}}>🎯 {cible.toFixed(0)} CHF</span>
                    <span style={{fontSize:'10px',color:'#aaa'}}>Mois {mois}</span>
                  </div>
                </div>
              )
            })()}
          </div>

          <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px',marginBottom:'12px'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'12px'}}>💡 Conseils placement</div>
            {[
              {titre:'Livret A', desc:'Sécurisé, disponible, 3% par an. Idéal pour epargne de precaution (3-6 mois de charges).', couleur:'#10B981'},
              {titre:'PEA (Plan Epargne Actions)', desc:'Avantage fiscal apres 5 ans. Investis en actions europeennes. Plafond 150 000 EUR.', couleur:'#2B7FFF'},
              {titre:'Assurance-vie', desc:'Fiscalite avantageuse apres 8 ans. Flexible, diversifie. Ideal pour long terme.', couleur:'#8B5CF6'},
              {titre:'ETF / Index funds', desc:'Diversification maximale, frais minimes. S&P500 ou MSCI World pour commencer.', couleur:'#D4A843'},
            ].map((c, i) => (
              <div key={i} style={{display:'flex',gap:'12px',marginBottom:'10px',paddingBottom:'10px',borderBottom: i < 3 ? '0.5px solid #E8F1FF' : 'none'}}>
                <div style={{width:'8px',borderRadius:'99px',background:c.couleur,flexShrink:0}}></div>
                <div>
                  <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'2px'}}>{c.titre}</div>
                  <div style={{fontSize:'12px',color:'#aaa',lineHeight:'1.5'}}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{background:'#FDF8EC',border:'0.5px solid #F0D88A',borderRadius:'16px',padding:'14px',marginBottom:'12px'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#D4A843',marginBottom:'8px'}}>⚠️ Note importante</div>
            <div style={{fontSize:'12px',color:'#666',lineHeight:'1.6'}}>
              Ces informations sont a titre educatif uniquement. Consulte un conseiller financier agree avant tout investissement. Les performances passees ne garantissent pas les resultats futurs.
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
