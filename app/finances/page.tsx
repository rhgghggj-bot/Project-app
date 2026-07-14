"use client"
import Tutorial from "../components/Tutorial"
import PlacementsSection from "../components/PlacementsSection"
import FiscaliteSection from "../components/FiscaliteSection"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

const CAT_DEPENSES = ["Logement","Assurance maladie","Assurance voiture","Assurance maison","Transport","Alimentation","Santé","Téléphone","Énergie","Loisirs","Autres"]
const CAT_REVENUS = ["Salaire","Freelance","Investissement","Don / Cadeau","Allocation","Autre revenu"]
const MOIS_NOMS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"]

function FinancesContent() {
  const [depenses, setDepenses] = useState<any[]>([])
  const [revenus, setRevenus] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const searchParams = useSearchParams()
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
    const action = searchParams.get('action')
    const montant_url = searchParams.get('montant')
    const titre_url = searchParams.get('titre')
    if (action === 'depense' && montant_url) {
      setTypeForm('depense')
      setMontant(montant_url)
      if (titre_url) setTitre(titre_url)
      setOnglet('charges')
      setShowForm(true)
    } else if (action === 'revenu' && montant_url) {
      setTypeForm('revenu')
      setMontant(montant_url)
      if (titre_url) setTitre(titre_url)
      setOnglet('revenus')
      setShowForm(true)
    } else if (action === 'fiscalite') {
      setOnglet('fiscalite')
    }
  }, [searchParams])

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

  function haptic(t='light') { if(typeof navigator !== 'undefined' && navigator.vibrate) { if(t==='light') navigator.vibrate(10); else if(t==='success') navigator.vibrate([10,30,10]); else if(t==='error') navigator.vibrate([50,30,50]); } }

  async function ajouter() {
    if (!titre || !montant) { haptic("error"); return }
    const table = typeForm === "depense" ? "depenses" : "revenus"
    const { error } = await supabase.from(table).insert({
      user_id: user.id, titre, montant: parseFloat(montant), categorie, date, recurrent
    })
    if (!error) { haptic("success");
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
  const iconeSolde = ""
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
          {type === "revenu" ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e'}}>{d.titre}</div>
          <div style={{fontSize:'11px',color:'#aaa'}}>{new Date(d.date).toLocaleDateString('fr-FR')} {d.recurrent ? '· récurrent' : ''}</div>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
        <div style={{fontSize:'14px',fontWeight:'500',color: type === "revenu" ? '#10B981' : '#F43F5E'}}>
          {type === "revenu" ? '+' : '-'}{parseFloat(d.montant).toFixed(0)} CHF
        </div>
        <a href={`/modifier-depense/${d.id}?type=${type}`}>
          <button style={{background:'#F0F8FF',border:'none',borderRadius:'8px',width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'12px'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        </a>
        <button onClick={() => supprimer(d.id, type)} style={{background:'none',border:'none',color:'#ddd',cursor:'pointer',fontSize:'16px'}}>×</button>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-white"><Tutorial page="finances" />
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
              {pctDepenses > 90 ? 'Attention' : pctDepenses > 70 ? 'Surveille' : 'Bon rythme'}
            </span>
          </div>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <div style={{flex:1,background:'rgba(16,185,129,0.15)',borderRadius:'12px',padding:'10px 12px',border:'0.5px solid rgba(16,185,129,0.3)'}}>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',marginBottom:'3px'}}>Revenus</div>
            <div style={{fontSize:'18px',fontWeight:'500',color:'#4ade80'}}>{moisActuelData.revenus.toFixed(0)} CHF</div>
          </div>
          <div style={{flex:1,background:'rgba(244,63,94,0.15)',borderRadius:'12px',padding:'10px 12px',border:'0.5px solid rgba(244,63,94,0.3)'}}>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',marginBottom:'3px'}}>Dépenses</div>
            <div style={{fontSize:'18px',fontWeight:'500',color:'#F43F5E'}}>{moisActuelData.depenses.toFixed(0)} CHF</div>
          </div>
        </div>
      </div>

      <div style={{display:'flex',borderBottom:'0.5px solid #E8F1FF',background:'#fff',position:'sticky',top:0,zIndex:10}}>
        {["vue","revenus","charges","epargne","fiscalite"].map(o => (
          <button key={o} onClick={() => setOnglet(o)}
            style={{flex:1,padding:'12px 0',fontSize:'12px',fontWeight:'500',border:'none',background:'none',cursor:'pointer',
              color: onglet === o ? '#2B7FFF' : '#aaa',
              borderBottom: onglet === o ? '2px solid #2B7FFF' : '2px solid transparent'}}>
            {o === "vue" ? "Vue" : o === "revenus" ? "Revenus" : o === "charges" ? "Charges" : o === "epargne" ? "Épargne" : "Fiscalité"}
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
                const hDep = d.depenses > 0 ? Math.max(Math.min((d.depenses/maxVal)*90, 90), 8) : 3
                const hRev = d.revenus > 0 ? Math.max(Math.min((d.revenus/maxVal)*90, 90), 8) : 3
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
                  <span style={{fontSize:'12px',color:'#F43F5E'}}>Dép. {moisSelectionne.depenses.toFixed(0)} CHF</span>
                  <span style={{fontSize:'12px',color:'#4ade80'}}>Rev. {moisSelectionne.revenus.toFixed(0)} CHF</span>
                </div>
                <button onClick={() => setMoisSelectionne(null)} style={{fontSize:'11px',color:'#aaa',background:'none',border:'none',cursor:'pointer',marginTop:'4px'}}>× Fermer</button>
              </div>
            )}
          </div>

          <div style={{display:'flex',gap:'8px',marginBottom:'14px'}}>
            <div style={{flex:1,background:'#E1F5EE',borderRadius:'14px',padding:'12px',border:'0.5px solid #A7F3D0'}}>
              <div style={{fontSize:'10px',color:'#10B981',fontWeight:'500',marginBottom:'4px'}}>Revenus · mois min</div>
              <div style={{fontSize:'15px',fontWeight:'500',color:'#1a1a2e'}}>{moisMinDep?.label || '-'}</div>
              <div style={{fontSize:'12px',color:'#10B981'}}>{moisMinDep?.depenses.toFixed(0) || 0} CHF</div>
            </div>
            <div style={{flex:1,background:'#FFE4E6',borderRadius:'14px',padding:'12px',border:'0.5px solid #FECDD3'}}>
              <div style={{fontSize:'10px',color:'#F43F5E',fontWeight:'500',marginBottom:'4px'}}>Dépenses · mois max</div>
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
              Dépense
            </button>
            <button onClick={() => { setTypeForm("revenu"); setShowForm(!showForm) }}
              style={{flex:1,background:'#E1F5EE',color:'#10B981',fontSize:'13px',fontWeight:'500',padding:'10px',borderRadius:'12px',border:'none',cursor:'pointer'}}>
              Revenu
            </button>
          </div>

          {showForm && (
            <div style={{background: typeForm === "depense" ? '#FFF5F5' : '#F0FFF8',borderRadius:'16px',padding:'14px',marginBottom:'12px',border:`0.5px solid ${typeForm === "depense" ? '#FECDD3' : '#A7F3D0'}`}}>
              <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>{typeForm === "depense" ? 'Nouvelle dépense' : 'Nouveau revenu'}</div>
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
              <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='1.5' style={{marginBottom:'8px'}}><line x1='12' y1='1' x2='12' y2='23'/><path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'/></svg>
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
              <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='1.5' style={{marginBottom:'8px'}}><line x1='12' y1='1' x2='12' y2='23'/><path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'/></svg>
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
              <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#aaa' strokeWidth='1.5' style={{marginBottom:'8px'}}><polyline points='23 4 23 10 17 10'/><polyline points='1 20 1 14 7 14'/><path d='M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'/></svg>
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
      {onglet === "fiscalite" && (
        <div style={{padding:'16px 18px'}}>
          <FiscaliteSection />
        </div>
      )}

      {onglet === "epargne" && (
        <div style={{padding:'16px 18px'}}>

          {/* Plan épargne */}
          <div style={{background:'linear-gradient(135deg,#1a3a6e,#2B7FFF)',borderRadius:'18px',padding:'16px',marginBottom:'14px'}}>
            <div style={{fontSize:'15px',fontWeight:'500',color:'#fff',marginBottom:'4px'}}>Plan d'épargne</div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.6)'}}>Entre ton objectif et vois combien épargner par mois</div>
          </div>

          <div style={{background:'#fff',border:'0.5px solid #E8F1FF',borderRadius:'16px',padding:'14px',marginBottom:'14px'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>Mon objectif</div>
            <input value={objectif} onChange={e => setObjectif(e.target.value)} placeholder="Ex: Voyage au Japon, Voiture..."
              style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'16px',color:'#1a1a2e',background:'#F8FBFF',marginBottom:'8px'}}/>
            <div style={{fontSize:'11px',color:'#aaa',marginBottom:'4px'}}>Montant cible (CHF)</div>
            <input value={montantEpargne} onChange={e => setMontantEpargne(e.target.value)} placeholder="Ex: 5000" type="number"
              style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'8px 12px',fontSize:'16px',color:'#1a1a2e',background:'#F8FBFF'}}/>
          </div>

          {montantEpargne && parseFloat(montantEpargne) > 0 && (() => {
            const cible = parseFloat(montantEpargne)
            const scenarios = [
              { mois: 6, label: '6 mois', couleur: '#F43F5E' },
              { mois: 12, label: '1 an', couleur: '#D4A843' },
              { mois: 24, label: '2 ans', couleur: '#2B7FFF' },
              { mois: 36, label: '3 ans', couleur: '#10B981' },
            ]
            return (
              <div style={{marginBottom:'14px'}}>
                <div style={{fontSize:'13px',fontWeight:'500',color:'#1a1a2e',marginBottom:'10px'}}>
                  Pour atteindre {cible.toFixed(0)} CHF :
                </div>
                {scenarios.map((s, i) => {
                  const parMois = cible / s.mois
                  const resteApresCharges = revenus.filter(r=>r.recurrent).reduce((sum,r)=>sum+parseFloat(r.montant),0) - depenses.filter(d=>d.recurrent).reduce((sum,d)=>sum+parseFloat(d.montant),0)
                  const faisable = parMois <= resteApresCharges
                  return (
                    <div key={i} style={{background:'#fff',border:`1px solid ${s.couleur}33`,borderRadius:'14px',padding:'14px',marginBottom:'10px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                        <span style={{fontSize:'14px',fontWeight:'500',color:s.couleur}}>{s.label}</span>
                        <span style={{fontSize:'11px',background: faisable ? '#E1F5EE' : '#FFE4E6',color: faisable ? '#10B981' : '#F43F5E',padding:'3px 8px',borderRadius:'99px'}}>
                          {faisable ? 'Faisable' : 'Difficile'}
                        </span>
                      </div>
                      <div style={{fontSize:'22px',fontWeight:'500',color:s.couleur,marginBottom:'4px'}}>
                        {parMois.toFixed(0)} CHF / mois
                      </div>
                      <div style={{fontSize:'12px',color:'#aaa',marginBottom:'10px'}}>
                        soit {(parMois * 7 / 30).toFixed(0)} CHF / semaine
                      </div>
                      <div style={{display:'flex',alignItems:'flex-end',gap:'2px',height:'60px',marginBottom:'6px'}}>
                        {Array.from({length: Math.min(s.mois, 12)}, (_, j) => {
                          const cumul = parMois * (j + 1)
                          const pct = Math.min((cumul / cible) * 100, 100)
                          const estDernier = j === Math.min(s.mois, 12) - 1
                          return (
                            <div key={j} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
                              <div style={{width:'100%',height: Math.max(pct * 0.55, 3) + 'px',borderRadius:'2px 2px 0 0',background: estDernier ? s.couleur : s.couleur + '66'}}></div>
                            </div>
                          )
                        })}
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between'}}>
                        <span style={{fontSize:'10px',color:'#aaa'}}>0 CHF</span>
                        <span style={{fontSize:'10px',color:s.couleur,fontWeight:'500'}}>{cible.toFixed(0)} CHF</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {/* Onglet placements */}
          <PlacementsSection />
        </div>
      )}

</main>
  )
}


export default function Finances() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Chargement...</div>}>
      <FinancesContent />
    </Suspense>
  )
}