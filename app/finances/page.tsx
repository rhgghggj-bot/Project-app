"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const CATEGORIES = ["🏠 Logement","🛡️ Assurance maladie","🚗 Assurance voiture","🏡 Assurance maison","⛽ Transport","🍽️ Alimentation","💊 Santé","📱 Téléphone","💡 Énergie","🎮 Loisirs","📦 Autres"]
const MOIS_NOMS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"]

export default function Finances() {
  const [depenses, setDepenses] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [onglet, setOnglet] = useState("vue")
  const [showForm, setShowForm] = useState(false)
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
        const { data } = await supabase.from("depenses").select("*").eq("user_id", user.id).order("date", { ascending: false })
        setDepenses(data || [])
      }
    }
    charger()
  }, [])

  async function ajouterDepense() {
    if (!titre || !montant) return
    const { error } = await supabase.from("depenses").insert({
      user_id: user.id, titre, montant: parseFloat(montant), categorie, date, recurrent
    })
    if (!error) {
      setTitre(""); setMontant(""); setCategorie(""); setRecurrent(false)
      setShowForm(false)
      const { data } = await supabase.from("depenses").select("*").eq("user_id", user.id).order("date", { ascending: false })
      setDepenses(data || [])
    }
  }

  async function supprimerDepense(id: string) {
    await supabase.from("depenses").delete().eq("id", id)
    setDepenses(depenses.filter(d => d.id !== id))
  }

  const today = new Date()
  const moisActuel = today.getMonth()
  const anneeActuelle = today.getFullYear()

  const depensesDuMois = (mois: number, annee: number) =>
    depenses.filter(d => {
      const date = new Date(d.date)
      return date.getMonth() === mois && date.getFullYear() === annee
    })

  const totalMois = (mois: number, annee: number) =>
    depensesDuMois(mois, annee).reduce((s, d) => s + parseFloat(d.montant), 0)

  const donneesGraphique = Array.from({length: 6}, (_, i) => {
    const m = (moisActuel - 5 + i + 12) % 12
    const a = moisActuel - 5 + i < 0 ? anneeActuelle - 1 : anneeActuelle
    return { mois: m, annee: a, label: MOIS_NOMS[m], total: totalMois(m, a) }
  })

  const maxDepense = Math.max(...donneesGraphique.map(d => d.total), 1)
  const totalActuel = totalMois(moisActuel, anneeActuelle)
  const moisMax = donneesGraphique.reduce((a, b) => a.total > b.total ? a : b)
  const moisMin = donneesGraphique.reduce((a, b) => a.total < b.total ? a : b)

  const depensesParCategorie = CATEGORIES.map(cat => ({
    cat,
    total: depenses.filter(d => d.categorie === cat && new Date(d.date).getMonth() === moisActuel).reduce((s, d) => s + parseFloat(d.montant), 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const depensesMoisAffiche = moisSelectionne ? depensesDuMois(moisSelectionne.mois, moisSelectionne.annee) : depensesDuMois(moisActuel, anneeActuelle)

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 28px'}}>
        <a href="/" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',display:'block',marginBottom:'8px'}}>← Accueil</a>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginBottom:'4px'}}>Total ce mois</div>
        <div style={{fontSize:'32px',fontWeight:'500',color:'#fff',marginBottom:'2px'}}>{totalActuel.toFixed(0)} CHF</div>
        <div style={{fontSize:'13px',color:'rgba(255,255,255,0.6)'}}>{depensesDuMois(moisActuel, anneeActuelle).length} dépenses enregistrées</div>
      </div>

      <div style={{display:'flex',borderBottom:'0.5px solid #E8F1FF',background:'#fff',position:'sticky',top:0,zIndex:10}}>
        {["vue","detail","charges"].map(o => (
          <button key={o} onClick={() => setOnglet(o)}
            style={{flex:1,padding:'12px 0',fontSize:'12px',fontWeight:'500',border:'none',background:'none',cursor:'pointer',
              color: onglet === o ? '#2B7FFF' : '#aaa',
              borderBottom: onglet === o ? '2px solid #2B7FFF' : '2px solid transparent'}}>
            {o === "vue" ? "📊 Vue globale" : o === "detail" ? "📋 Détail" : "🔄 Charges fixes"}
          </button>
        ))}
      </div>

      {onglet === "vue" && (
        <div style={{padding:'16px 18px'}}>
          <div style={{background:'rgba(255,255,255,0.8)',backdropFilter:'blur(20px)',border:'0.5px solid #E8F1FF',borderRadius:'18px',padding:'16px',marginBottom:'14px',boxShadow:'0 4px 24px rgba(43,127,255,0.08)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
              <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>Dépenses sur 6 mois</div>
              {moisSelectionne && (
                <button onClick={() => setMoisSelectionne(null)} style={{fontSize:'11px',color:'#2B7FFF',background:'#EEF5FF',border:'none',padding:'3px 8px',borderRadius:'99px',cursor:'pointer'}}>
                  Tout voir
                </button>
              )}
            </div>
            <div style={{display:'flex',alignItems:'flex-end',gap:'8px',height:'120px',marginBottom:'8px'}}>
              {donneesGraphique.map((d, i) => {
                const hauteur = d.total > 0 ? Math.max((d.total / maxDepense) * 100, 8) : 4
                const estActuel = d.mois === moisActuel && d.annee === anneeActuelle
                const estSelectionne = moisSelectionne?.mois === d.mois
                return (
                  <div key={i} onClick={() => setMoisSelectionne(d)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',cursor:'pointer'}}>
                    {d.total > 0 && <div style={{fontSize:'9px',color:estActuel ? '#D4A843' : '#aaa'}}>{d.total.toFixed(0)}</div>}
                    <div style={{width:'100%',height:`${hauteur}%`,borderRadius:'6px 6px 0 0',
                      background: estSelectionne ? '#D4A843' : estActuel ? 'linear-gradient(180deg,#D4A843,#F59E0B)' : 'linear-gradient(180deg,#2B7FFF,#87CEEB)',
                      border: estSelectionne ? '2px solid #D4A843' : 'none',
                      opacity: d.total === 0 ? 0.3 : 1,
                      transition:'all 0.2s'}}></div>
                    <div style={{fontSize:'10px',color: estActuel ? '#D4A843' : '#aaa',fontWeight: estActuel ? '500' : '400'}}>{d.label}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
            <div style={{flex:1,background:'#E1F5EE',borderRadius:'14px',padding:'12px',border:'0.5px solid #A7F3D0'}}>
              <div style={{fontSize:'10px',color:'#10B981',fontWeight:'500',marginBottom:'4px'}}>📉 Mois le moins cher</div>
              <div style={{fontSize:'16px',fontWeight:'500',color:'#1a1a2e'}}>{moisMin.label}</div>
              <div style={{fontSize:'12px',color:'#10B981'}}>{moisMin.total.toFixed(0)} CHF</div>
            </div>
            <div style={{flex:1,background:'#FFE4E6',borderRadius:'14px',padding:'12px',border:'0.5px solid #FECDD3'}}>
              <div style={{fontSize:'10px',color:'#F43F5E',fontWeight:'500',marginBottom:'4px'}}>📈 Mois le plus cher</div>
              <div style={{fontSize:'16px',fontWeight:'500',color:'#1a1a2e'}}>{moisMax.label}</div>
              <div style={{fontSize:'12px',color:'#F43F5E'}}>{moisMax.total.toFixed(0)} CHF</div>
            </div>
          </div>

          {depensesParCategorie.length > 0 && (
            <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px',marginBottom:'14px'}}>
              <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'12px'}}>Répartition par catégorie</div>
              {depensesParCategorie.map((c, i) => (
                <div key={i} style={{marginBottom:'8px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'3px'}}>
                    <span style={{fontSize:'12px',color:'#666'}}>{c.cat}</span>
                    <span style={{fontSize:'12px',fontWeight:'500',color:'#1a1a2e'}}>{c.total.toFixed(0)} CHF · {totalActuel > 0 ? ((c.total/totalActuel)*100).toFixed(0) : 0}%</span>
                  </div>
                  <div style={{height:'6px',background:'#F0F8FF',borderRadius:'99px',overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${totalActuel > 0 ? (c.total/totalActuel)*100 : 0}%`,background:'linear-gradient(90deg,#2B7FFF,#87CEEB)',borderRadius:'99px'}}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{moisSelectionne ? `${moisSelectionne.label} ${moisSelectionne.annee}` : 'Ce mois'}</div>
            <button onClick={() => setShowForm(!showForm)}
              style={{fontSize:'12px',background:'#2B7FFF',color:'#fff',border:'none',padding:'6px 14px',borderRadius:'99px',cursor:'pointer',fontWeight:'500'}}>
              + Ajouter
            </button>
          </div>

          {showForm && (
            <div style={{background:'#EEF5FF',borderRadius:'16px',padding:'14px',marginBottom:'12px',border:'0.5px solid #DCE9FF'}}>
              <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Nom de la dépense"
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
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                <input type="checkbox" checked={recurrent} onChange={e => setRecurrent(e.target.checked)} id="rec"/>
                <label htmlFor="rec" style={{fontSize:'13px',color:'#666'}}>Charge fixe / récurrente</label>
              </div>
              <button onClick={ajouterDepense}
                style={{width:'100%',background:'#2B7FFF',color:'#fff',fontSize:'13px',fontWeight:'500',padding:'10px',borderRadius:'10px',border:'none',cursor:'pointer'}}>
                Enregistrer
              </button>
            </div>
          )}

          {depensesMoisAffiche.map((d: any) => (
            <div key={d.id} style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'12px 14px',marginBottom:'8px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'36px',height:'36px',background:'#EEF5FF',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>
                  {d.categorie?.split(' ')[0] || '📦'}
                </div>
                <div>
                  <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{d.titre}</div>
                  <div style={{fontSize:'11px',color:'#aaa'}}>{new Date(d.date).toLocaleDateString('fr-FR')} {d.recurrent ? '· 🔄 Récurrent' : ''}</div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{fontSize:'14px',fontWeight:'500',color:'#F43F5E'}}>-{parseFloat(d.montant).toFixed(0)} CHF</div>
                <button onClick={() => supprimerDepense(d.id)} style={{background:'none',border:'none',color:'#ddd',cursor:'pointer',fontSize:'16px'}}>×</button>
              </div>
            </div>
          ))}

          {depensesMoisAffiche.length === 0 && (
            <div style={{textAlign:'center',padding:'32px 0',color:'#aaa'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>💸</div>
              <div style={{fontSize:'13px'}}>Aucune dépense ce mois</div>
            </div>
          )}
        </div>
      )}

      {onglet === "detail" && (
        <div style={{padding:'16px 18px'}}>
          <div style={{fontSize:'11px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:'500',marginBottom:'10px'}}>Toutes les dépenses</div>
          {depenses.length === 0 && (
            <div style={{textAlign:'center',padding:'32px 0',color:'#aaa'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>📋</div>
              <div style={{fontSize:'13px'}}>Aucune dépense enregistrée</div>
            </div>
          )}
          {depenses.map((d: any) => (
            <div key={d.id} style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'12px 14px',marginBottom:'8px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'36px',height:'36px',background:'#EEF5FF',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>
                  {d.categorie?.split(' ')[0] || '📦'}
                </div>
                <div>
                  <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{d.titre}</div>
                  <div style={{fontSize:'11px',color:'#aaa'}}>{new Date(d.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})} {d.recurrent ? '· 🔄' : ''}</div>
                  {d.categorie && <div style={{fontSize:'11px',color:'#2B7FFF',marginTop:'1px'}}>{d.categorie}</div>}
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{fontSize:'14px',fontWeight:'500',color:'#F43F5E'}}>-{parseFloat(d.montant).toFixed(0)} CHF</div>
                <button onClick={() => supprimerDepense(d.id)} style={{background:'none',border:'none',color:'#ddd',cursor:'pointer',fontSize:'16px'}}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {onglet === "charges" && (
        <div style={{padding:'16px 18px'}}>
          <div style={{fontSize:'11px',color:'#aaa',textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:'500',marginBottom:'10px'}}>Charges fixes & récurrentes</div>
          {depenses.filter(d => d.recurrent).length === 0 && (
            <div style={{textAlign:'center',padding:'32px 0',color:'#aaa'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>🔄</div>
              <div style={{fontSize:'13px',marginBottom:'6px'}}>Aucune charge fixe</div>
              <div style={{fontSize:'12px'}}>Ajoute une dépense et coche "Charge fixe"</div>
            </div>
          )}
          {depenses.filter(d => d.recurrent).map((d: any) => (
            <div key={d.id} style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'14px',padding:'12px 14px',marginBottom:'8px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'36px',height:'36px',background:'#EEF5FF',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>
                  {d.categorie?.split(' ')[0] || '🔄'}
                </div>
                <div>
                  <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{d.titre}</div>
                  <div style={{fontSize:'11px',color:'#aaa'}}>{d.categorie}</div>
                </div>
              </div>
              <div style={{fontSize:'14px',fontWeight:'500',color:'#F43F5E'}}>-{parseFloat(d.montant).toFixed(0)} CHF/mois</div>
            </div>
          ))}
          {depenses.filter(d => d.recurrent).length > 0 && (
            <div style={{background:'#EEF5FF',borderRadius:'14px',padding:'12px 14px',marginTop:'8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'13px',fontWeight:'500',color:'#2B7FFF'}}>Total charges fixes</span>
              <span style={{fontSize:'16px',fontWeight:'500',color:'#F43F5E'}}>
                -{depenses.filter(d => d.recurrent).reduce((s,d) => s + parseFloat(d.montant), 0).toFixed(0)} CHF/mois
              </span>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
