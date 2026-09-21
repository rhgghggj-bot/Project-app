"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Card from "./ui/Card"
import Button from "./ui/Button"
import ProgressBar from "./ui/ProgressBar"
import EmptyState from "./ui/EmptyState"
import { colors } from "./ui/tokens"

const CAT_DEPENSES = ["Logement","Assurance maladie","Assurance voiture","Assurance maison","Transport","Alimentation","Santé","Téléphone","Énergie","Loisirs","Épargne","Autres"]

const IconEnvelope = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>

export default function BudgetsCategoriesSection() {
  const [user, setUser] = useState<any>(null)
  const [budgets, setBudgets] = useState<any[]>([])
  const [depensesMois, setDepensesMois] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [categorie, setCategorie] = useState(CAT_DEPENSES[0])
  const [plafond, setPlafond] = useState("")

  useEffect(() => { charger() }, [])

  async function charger() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (!user) return

    const { data: b } = await supabase.from("budgets_categories").select("*").eq("user_id", user.id)
    setBudgets(b || [])

    const now = new Date()
    const debutMois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
    const { data: d } = await supabase.from("depenses").select("*").eq("user_id", user.id).gte("date", debutMois)
    setDepensesMois(d || [])
  }

  async function creerBudget() {
    const p = parseFloat(plafond)
    if (!p || p <= 0 || !user) return
    const { data, error } = await supabase.from("budgets_categories").upsert(
      { user_id: user.id, categorie, plafond_mensuel: p },
      { onConflict: "user_id,categorie" }
    ).select().single()
    if (error || !data) return
    setBudgets(prev => [...prev.filter(b => b.categorie !== categorie), data])
    setPlafond(""); setShowForm(false)
  }

  async function supprimerBudget(id: string) {
    await supabase.from("budgets_categories").delete().eq("id", id)
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  if (!user) return null

  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text }}>Budgets par catégorie</div>
        <Button variant="secondary" onClick={() => setShowForm(!showForm)}>+ Nouveau budget</Button>
      </div>

      {showForm && (
        <Card style={{ background: colors.blueLight, border: `0.5px solid ${colors.blueBorder}`, marginBottom: "12px" }}>
          <select value={categorie} onChange={e => setCategorie(e.target.value)}
            style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "8px 12px", fontSize: "14px", color: colors.text, background: "#fff", marginBottom: "8px" }}>
            {CAT_DEPENSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={plafond} onChange={e => setPlafond(e.target.value)} type="number" min="0" step="10" placeholder="Plafond mensuel (CHF)"
            style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "8px 12px", fontSize: "16px", color: colors.text, background: "#fff", marginBottom: "10px", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <Button full onClick={creerBudget}>Enregistrer</Button>
            <Button variant="ghost" full onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      {budgets.length === 0 && !showForm && (
        <EmptyState icon={<IconEnvelope />} title="Aucun budget par catégorie" subtitle="Fixe un plafond mensuel pour surveiller tes dépenses" />
      )}

      {budgets.map(b => {
        const depense = depensesMois.filter(d => d.categorie === b.categorie).reduce((s, d) => s + parseFloat(d.montant), 0)
        const plafondVal = parseFloat(b.plafond_mensuel)
        const pct = Math.min(100, (depense / plafondVal) * 100)
        const couleur = pct >= 100 ? colors.red : pct >= 80 ? colors.gold : colors.green
        return (
          <Card key={b.id} style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: colors.text }}>{b.categorie}</span>
              <span style={{ fontSize: "12px", fontWeight: 500, color: couleur }}>{depense.toFixed(0)} / {plafondVal.toFixed(0)} CHF</span>
            </div>
            <div style={{ marginBottom: "6px" }}><ProgressBar percent={pct} color={couleur} /></div>
            {pct >= 100 && <div style={{ fontSize: "11px", color: colors.red, marginBottom: "4px" }}>Plafond dépassé</div>}
            {pct >= 80 && pct < 100 && <div style={{ fontSize: "11px", color: colors.gold, marginBottom: "4px" }}>Bientôt au plafond</div>}
            <button onClick={() => supprimerBudget(b.id)} style={{ background: "none", border: "none", color: colors.textFaint, fontSize: "11px", cursor: "pointer", padding: 0 }}>
              Supprimer
            </button>
          </Card>
        )
      })}
    </div>
  )
}
