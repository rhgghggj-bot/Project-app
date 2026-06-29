"use client"
import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

const CAT_DEPENSES = ["🏠 Logement","🛡️ Assurance maladie","🚗 Assurance voiture","🏡 Assurance maison","⛽ Transport","🍽️ Alimentation","💊 Santé","📱 Téléphone","💡 Énergie","🎮 Loisirs","📦 Autres"]
const CAT_REVENUS = ["💼 Salaire","🏢 Freelance","📈 Investissement","🎁 Don / Cadeau","🏦 Allocation","💰 Autre revenu"]

export default function ModifierDepense() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "depense"
  const [titre, setTitre] = useState("")
  const [montant, setMontant] = useState("")
  const [categorie, setCategorie] = useState("")
  const [date, setDate] = useState("")
  const [recurrent, setRecurrent] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function charger() {
      const table = type === "depense" ? "depenses" : "revenus"
      const { data } = await supabase.from(table).select("*").eq("id", id).single()
      if (data) {
        setTitre(data.titre || "")
        setMontant(data.montant?.toString() || "")
        setCategorie(data.categorie || "")
        setDate(data.date || "")
        setRecurrent(data.recurrent || false)
      }
    }
    charger()
  }, [id, type])

  async function sauvegarder() {
    const table = type === "depense" ? "depenses" : "revenus"
    const { error } = await supabase.from(table).update({
      titre, montant: parseFloat(montant), categorie, date, recurrent
    }).eq("id", id)
    if (error) {
      setMessage("Erreur : " + error.message)
    } else {
      setMessage("Mis à jour !")
      setTimeout(() => window.location.href = "/finances", 1500)
    }
  }

  async function supprimer() {
    const table = type === "depense" ? "depenses" : "revenus"
    await supabase.from(table).delete().eq("id", id)
    window.location.href = "/finances"
  }

  const isRevenu = type === "revenu"
  const couleur = isRevenu ? "#10B981" : "#F43F5E"
  const categories = isRevenu ? CAT_REVENUS : CAT_DEPENSES

  return (
    <main className="min-h-screen bg-white">
      <div style={{background:'linear-gradient(160deg,#0A1628,#1a3a6e)',padding:'20px 18px 28px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <a href="/finances" style={{fontSize:'12px',color:'rgba(255,255,255,0.5)'}}>← Retour</a>
          <button onClick={supprimer} style={{fontSize:'12px',color:'#F43F5E',background:'rgba(244,63,94,0.15)',border:'none',padding:'5px 12px',borderRadius:'99px',cursor:'pointer'}}>
            Supprimer
          </button>
        </div>
        <div style={{fontSize:'22px',fontWeight:'500',color:'#fff',marginTop:'8px'}}>
          {isRevenu ? '💰 Modifier le revenu' : '💸 Modifier la dépense'}
        </div>
      </div>

      <div style={{padding:'20px 18px',display:'flex',flexDirection:'column',gap:'14px'}}>
        <div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Titre</label>
          <input value={titre} onChange={e => setTitre(e.target.value)}
            style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF'}}/>
        </div>

        <div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Montant (CHF)</label>
          <input value={montant} onChange={e => setMontant(e.target.value)} type="number"
            style={{width:'100%',border:`1px solid ${couleur}44`,borderRadius:'10px',padding:'10px 14px',fontSize:'16px',fontWeight:'500',color:couleur,background:'#F8FBFF'}}/>
        </div>

        <div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Date</label>
          <input value={date} onChange={e => setDate(e.target.value)} type="date"
            style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF'}}/>
        </div>

        <div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Catégorie</label>
          <select value={categorie} onChange={e => setCategorie(e.target.value)}
            style={{width:'100%',border:'1px solid #E8F1FF',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',color:'#1a1a2e',background:'#F8FBFF'}}>
            <option value="">Choisir une catégorie</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <input type="checkbox" checked={recurrent} onChange={e => setRecurrent(e.target.checked)} id="rec"/>
          <label htmlFor="rec" style={{fontSize:'13px',color:'#666'}}>Récurrent (mensuel)</label>
        </div>

        <button onClick={sauvegarder}
          style={{width:'100%',background:couleur,color:'#fff',fontSize:'14px',fontWeight:'500',padding:'13px',borderRadius:'12px',border:'none',cursor:'pointer'}}>
          Sauvegarder ✓
        </button>

        {message && <p style={{fontSize:'13px',color:'#10B981',textAlign:'center',fontWeight:'500'}}>{message}</p>}
      </div>
    </main>
  )
}
