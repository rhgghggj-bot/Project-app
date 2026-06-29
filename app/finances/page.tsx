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
      setTitre(""); setMontant(""); setCategorie(""); setRecurrent(false)
      setShowForm(false)
      const { data: d } = await supabase.from("depenses").select("*").eq("user_id", user.id).order("date", { ascending: false })
      setDepenses(d || [])
      const { data: r } = await supabase.from("revenus").select("*").eq("user_id", user.id).order("date", { ascending: false })
      setRevenus(r || [])
    }
  }

  async function supprimer(id: string, type: "depense"|"revenu") {
    const table = type === "depense" ? "depenses" : "revenus"
    await supabase.from(table).delete().eq("id", id)
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
    return {
      mois: m, annee: a, label: MOIS_NOMS[m],
      depenses: totalMois(depenses, m, a),
      revenus: totalMois(revenus, m, a)
    }
  })

  const moisActuelData = donneesGraphique[5]
  const solde = moisActuelData.revenus - moisActuelData.depenses
  const maxVal = Math.max(...donneesGraphique.map(d => Math.max(d.depenses, d.revenus)), 1)

  const moisMaxDep = donneesGraphique.reduce((a, b) => a.depenses > b.depenses ? a : b)
  const moisMinDep = donneesGraphique.filter(d => d.depenses > 0).reduce((a, b) => a.depenses < b.depenses ? a : b, donneesGraphique[0])

  const depensesMoisAff = moisSelectionne ? filtrerMois(depenses, moisSelectionne.mois, moisSelectionne.annee) : filtrerMois(depenses, moisActuel, anneeActuelle)
  const revenusMoisAff = moisSelectionne ? filtrerMois(revenus, moisSelectionne.mois, moisSelectionne.annee) : filtrerMois(revenus, moisActuel, anneeActuelle)

  const depensesParCat = CAT_DEPENSES.map(cat => ({
    cat, total: filtrerMois(depenses, moisSelectionne?.mois ?? moisActuel, moisSelectionne?.annee ?? anneeActuelle)
      .filter(d => d.categorie === cat).reduce((s, d) => s + parseFloat(d.montant), 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const totalDep = depensesMoisAff.reduce((s, d) => s + parseFloat(d.montant), 0)
  const totalRev = revenusMoisAff.reduce((s, r) => s + parseFloat(r.montant), 0)

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 28px'}}>
        <a href="/" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'8px'}}>← Accueil</a>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginBottom:'4px'}}>Solde ce mois</div>
        <div style={{fontSize:'32px',fontWeight:'500',color: solde >= 0 ? '#4ade80' : '#F43F5E',marginBottom:'2px'}}>{solde >= 0 ? '+' : ''}{solde.toFixed(0)} CHF</div>
        <div style={{display:'flex',gap:'16px',marginTop:'8px'}}>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)'}}>📈 Revenus : <span style={{color:'#4ade80',fontWeight:'500'}}>{moisActuelData.revenus.toFixed(0)} CHF</span></div>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)'}}>📉 Dépenses : <span style={{color:'#F43F5E',fontWeight:'500'}}>{moisActuelData.depenses.toFixed(0)} CHF</span></div>
        </div>
      </div>

      <div style={{display:'flex',borderBottom:'0.5px solid #E8F1FF',background:'#fff',position:'sticky',top:0,zIndex:10}}>
        {["vue","revenus","charges"].map(o => (
          <button key={o} onClick={() => setOnglet(o)}
            style={{flex:1,padding:'12px 0',fontSize:'12px',fontWeight:'500',border:'none',background:'none',cursor:'pointer',
              color: onglet === o ? '#2B7FFF' : '#aaa',
              borderBottom: onglet === o ? '2px solid #2B7FFF' : '2px solid transparent'}}>
            {o === "vue" ? "📊 Vue globale" : o === "revenus" ? "💰 Revenus" : "🔄 Charges"}
          </button>
        ))}
      </div>

      {onglet === "vue" && (
        <div style={{padding:'16px 18px'}}>
          <div style={{background:'rgba(255,255,255,0.9)',border:'0.5px solid #E8F1FF',borderRadius:'18px',padding:'16px',marginBottom:'14px',boxShadow:'0 4px 24px rgba(43,127,255,0.08)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
              <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>6 derniers mois</div>
              <div style={{display:'flex',gap:'10px'}}>
                <span style={{fontSize:'11px',color:'#2B7FFF'}}>■ Dépenses</span>
                <span style={{fontSize:'11px',color:'#4ade80'}}>■ Revenus</span>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'flex-end',gap:'6px',height:'120px',marginBottom:'8px'}}>
              {donneesGraphique.map((d, i) => {
                const estActuel = d.mois === moisActuel
                const estSel = moisSelectionne?.mois === d.mois
                const hDep = d.depenses > 0 ? Math.max((d.depenses/maxVal)*100, 8) : 3
                const hRev = d.revenus > 0 ? Math.max((d.revenus/maxVal)*100, 8) : 3
                return (
                  <div key={i} onClick={() => setMoisSelectionne(estSel ? null : d)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',cursor:'pointer'}}>
                    <div style={{width:'100%',display:'flex',gap:'2px',alignItems:'flex-end',height:'100px'}}>
                      <div style={{flex:1,height:`${hDep}%`,borderRadius:'4px 4px 0 0',background: estSel ? '#1a1a2e' : '#2B7FFF',opacity: d.depenses === 0 ? 0.2 : 1}}></div>
                      <div style={{flex:1,height:`${hRev}%`,borderRadius:'4px 4px 0 0',background: estSel ? '#D4A843' : '#4ade80',opacity: d.revenus === 0 ? 0.2 : 1}}></div>
                    </div>
                    <div style={{fontSize:'10px',color: estActuel ? '#2B7FFF' : '#aaa',fontWeight: estActuel ? '500' : '400'}}>{d.label}</div>
                  </div>
                )
              })}
            </div>
            {moisSelectionne && (
              <div style={{background:'#F8FBFF',borderRadius:'10px',padding:'10px 12px',marginTop:'6px'}}>
                <div style={{fontSize:'12px',fontWeight:'500',color:'#1a1a2e',marginBottom:'4px'}}>{moisSelectionne.label} {moisSelectionne.annee}</div>
                <div style={{display:'flex',gap:'12px'}}>
                  <span style={{fontSize:'12px',color:'#F43F5E'}}>Dépenses : {moisSelectionne.depenses.toFixed(0)} CHF</span>
                  <span style={{fontSize:'12px',color:'#4ade80'}}>Revenus : {moisSelectionne.revenus.toFixed(0)} CHF</span>
                </div>
                <button onClick={() => setMoisSelectionne(null)} style={{fontSize:'11px',color:'#2B7FFF',background:'none',border:'none',cursor:'pointer',marginTop:'4px'}}>× Fermer</button>
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
                    <div style={{height:'100%',width:`${totalDep > 0 ? (c.total/totalDep)*100 : 0}%`,background:'linear-gradient(90deg,#2B7FFF,#87CEEB)',borderRadius:'99px'}}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
            <button onClick={() => { setTypeForm("depense"); setShowForm(!showForm) }}
              style={{flex:1,background:'#FFE4E6',color:'#F43F5E',fontSize:'13px',fontWeight:'500',padding:'10px',borderRadius:'12px',border:'none',cursor:'pointer'}}>
              - Dépense
            </button>
            <button onClick={() => { setTypeForm("revenu"); setShowForm(!showForm) }}
              style={{flex:1,background:'#E1F5EE',color:'#10B981',fontSize:'13px',fontWeight:'500',padding:'10px',borderRadius:'12px',border:'none',cursor:'pointer'}}>
              + Revenu
            </button>
          </div>

          {showForm && (
            <div style={{background: typeForm === "depense" ? '#FFF5F5' : '#F0FFF8',borderRadius:'16px',padding:'14px',marginBottom:'12px',border:`0.5px solid ${typeForm === "depense" ? '#FECDD3' : '#A7F3D0'}`}}>
              <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>{typeForm === "depense" ? '➖ Nouvelle dépense' : '➕ Nouveau revenu'}</div>
              <input value={titre} onChange={e => setTitre(e.target.value)} placeholder={typeForm === "depense" ? "Ex: Loyer, Migros..." : "Ex: Salaire, Freelance..."}
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

          {revenusMoisAff.map((r: any) => (
            <div key={r.id} style={{background:'#F0FFF8',border:'0.5px solid #A7F3D0',borderRadius:'14px',padding:'12px 14px',marginBottom:'8px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'36px',height:'36px',background:'#E1F5EE',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>
                  {r.categorie?.split(' ')[0] || '💰'}
                </div>
                <div>
                  <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{r.titre}</div>
                  <div style={{fontSize:'11px',color:'#aaa'}}>{new Date(r.date).toLocaleDateString('fr-FR')} {r.recurrent ? '· 🔄' : ''}</div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{fontSize:'14px',fontWeight:'500',color:'#10B981'}}>+{parseFloat(r.montant).toFixed(0)} CHF</div>
                <button onClick={() => supprimer(r.id, "revenu")} style={{background:'none',border:'none',color:'#ddd',cursor:'pointer',fontSize:'16px'}}>×</button>
              </div>
            </div>
          ))}

          {depensesMoisAff.map((d: any) => (
            <div key={d.id} style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'12px 14px',marginBottom:'8px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'36px',height:'36px',background:'#EEF5FF',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>
                  {d.categorie?.split(' ')[0] || '📦'}
                </div>
                <div>
                  <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{d.titre}</div>
                  <div style={{fontSize:'11px',color:'#aaa'}}>{new Date(d.date).toLocaleDateString('fr-FR')} {d.recurrent ? '· 🔄' : ''}</div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{fontSize:'14px',fontWeight:'500',color:'#F43F5E'}}>-{parseFloat(d.montant).toFixed(0)} CHF</div>
                <button onClick={() => supprimer(d.id, "depense")} style={{background:'none',border:'none',color:'#ddd',cursor:'pointer',fontSize:'16px'}}>×</button>
              </div>
            </div>
          ))}

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
          {showForm && onglet === "revenus" && (
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
          {revenus.map((r: any) => (
            <div key={r.id} style={{background:'#F0FFF8',border:'0.5px solid #A7F3D0',borderRadius:'14px',padding:'12px 14px',marginBottom:'8px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'36px',height:'36px',background:'#E1F5EE',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>
                  {r.categorie?.split(' ')[0] || '💰'}
                </div>
                <div>
                  <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{r.titre}</div>
                  <div style={{fontSize:'11px',color:'#aaa'}}>{new Date(r.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long'})} {r.recurrent ? '· 🔄 Récurrent' : ''}</div>
                  {r.categorie && <div style={{fontSize:'11px',color:'#10B981'}}>{r.categorie}</div>}
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{fontSize:'14px',fontWeight:'500',color:'#10B981'}}>+{parseFloat(r.montant).toFixed(0)} CHF</div>
                <button onClick={() => supprimer(r.id, "revenu")} style={{background:'none',border:'none',color:'#ddd',cursor:'pointer',fontSize:'16px'}}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {onglet === "charges" && (
        <div style={{padding:'16px 18px'}}>
          <div style={{fontSize:'11px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:'500',marginBottom:'10px'}}>Charges fixes mensuelles</div>
          {depenses.filter(d => d.recurrent).length === 0 && revenus.filter(r => r.recurrent).length === 0 && (
            <div style={{textAlign:'center',padding:'32px 0',color:'#aaa'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>🔄</div>
              <div style={{fontSize:'13px'}}>Aucune charge fixe — coche "Récurrent" en ajoutant</div>
            </div>
          )}
          {revenus.filter(r => r.recurrent).map((r: any) => (
            <div key={r.id} style={{background:'#F0FFF8',border:'0.5px solid #A7F3D0',borderRadius:'14px',padding:'12px 14px',marginBottom:'8px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'36px',height:'36px',background:'#E1F5EE',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>{r.categorie?.split(' ')[0] || '💰'}</div>
                <div><div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{r.titre}</div><div style={{fontSize:'11px',color:'#10B981'}}>{r.categorie}</div></div>
              </div>
              <div style={{fontSize:'14px',fontWeight:'500',color:'#10B981'}}>+{parseFloat(r.montant).toFixed(0)} CHF/mois</div>
            </div>
          ))}
          {depenses.filter(d => d.recurrent).map((d: any) => (
            <div key={d.id} style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'12px 14px',marginBottom:'8px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'36px',height:'36px',background:'#EEF5FF',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>{d.categorie?.split(' ')[0] || '🔄'}</div>
                <div><div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{d.titre}</div><div style={{fontSize:'11px',color:'#aaa'}}>{d.categorie}</div></div>
              </div>
              <div style={{fontSize:'14px',fontWeight:'500',color:'#F43F5E'}}>-{parseFloat(d.montant).toFixed(0)} CHF/mois</div>
            </div>
          ))}
          {(depenses.filter(d => d.recurrent).length > 0 || revenus.filter(r => r.recurrent).length > 0) && (
            <div style={{background:'#EEF5FF',borderRadius:'14px',padding:'14px',marginTop:'8px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                <span style={{fontSize:'13px',color:'#10B981',fontWeight:'500'}}>Total revenus fixes</span>
                <span style={{fontSize:'14px',fontWeight:'500',color:'#10B981'}}>+{revenus.filter(r => r.recurrent).reduce((s,r) => s + parseFloat(r.montant), 0).toFixed(0)} CHF</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                <span style={{fontSize:'13px',color:'#F43F5E',fontWeight:'500'}}>Total charges fixes</span>
                <span style={{fontSize:'14px',fontWeight:'500',color:'#F43F5E'}}>-{depenses.filter(d => d.recurrent).reduce((s,d) => s + parseFloat(d.montant), 0).toFixed(0)} CHF</span>
              </div>
              <div style={{height:'0.5px',background:'#DCE9FF',margin:'8px 0'}}></div>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:'13px',fontWeight:'500',color:'#2B7FFF'}}>Reste après charges</span>
                <span style={{fontSize:'15px',fontWeight:'500',color: (revenus.filter(r=>r.recurrent).reduce((s,r)=>s+parseFloat(r.montant),0) - depenses.filter(d=>d.recurrent).reduce((s,d)=>s+parseFloat(d.montant),0)) >= 0 ? '#10B981' : '#F43F5E'}}>
                  {(revenus.filter(r=>r.recurrent).reduce((s,r)=>s+parseFloat(r.montant),0) - depenses.filter(d=>d.recurrent).reduce((s,d)=>s+parseFloat(d.montant),0)).toFixed(0)} CHF
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
