"use client"
import { User } from "@/lib/types"
import { useChargement } from "@/lib/useChargement"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import Card from "./ui/Card"
import Button from "./ui/Button"
import Badge from "./ui/Badge"
import ProgressBar from "./ui/ProgressBar"
import EmptyState from "./ui/EmptyState"
import { colors, gradients } from "./ui/tokens"

const IconTarget = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>

export default function ObjectifsEpargneSection() {
  const [user, setUser] = useState<User | null>(null)
  const [objectifs, setObjectifs] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState("")
  const [montantCible, setMontantCible] = useState("")
  const [contribuerA, setContribuerA] = useState<string | null>(null)
  const [montantContrib, setMontantContrib] = useState("")


  async function charger() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (!user) return
    const { data } = await supabase.from("objectifs_personnels").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
    setObjectifs(data || [])
  }

  useChargement(charger)

  async function creerObjectif() {
    const cible = parseFloat(montantCible)
    if (!titre.trim() || !cible || cible <= 0 || !user) return
    await supabase.from("objectifs_personnels").insert({ user_id: user.id, titre: titre.trim(), montant_cible: cible })
    setTitre(""); setMontantCible(""); setShowForm(false)
    charger()
  }

  async function ajouterContribution(objectifId: string) {
    const montant = parseFloat(montantContrib)
    const objectif = objectifs.find(o => o.id === objectifId)
    if (!montant || montant <= 0 || !objectif) return
    await supabase.from("objectifs_personnels").update({ montant_actuel: parseFloat(objectif.montant_actuel) + montant }).eq("id", objectifId)
    setMontantContrib(""); setContribuerA(null)
    charger()
  }

  if (!user) return null

  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text }}>Mes objectifs d’épargne</div>
        <Button variant="secondary" onClick={() => setShowForm(!showForm)}>+ Nouvel objectif</Button>
      </div>

      {showForm && (
        <Card style={{ background: colors.blueLight, border: `0.5px solid ${colors.blueBorder}`, marginBottom: "12px" }}>
          <input aria-label="Voyage au Japon, Voiture" value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Voyage au Japon, Voiture…"
            style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "8px 12px", fontSize: "16px", color: colors.text, background: "#fff", marginBottom: "8px", boxSizing: "border-box" }} />
          <input aria-label="Montant cible (CHF)" value={montantCible} onChange={e => setMontantCible(e.target.value)} type="number" min="0" step="10" placeholder="Montant cible (CHF)"
            style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "8px 12px", fontSize: "16px", color: colors.text, background: "#fff", marginBottom: "10px", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: "8px" }}>
            <Button full onClick={creerObjectif}>Créer</Button>
            <Button variant="ghost" full onClick={() => setShowForm(false)}>Annuler</Button>
          </div>
        </Card>
      )}

      {objectifs.length === 0 && !showForm && (
        <EmptyState icon={<IconTarget />} title="Aucun objectif enregistré" subtitle="Mets de côté pour un projet précis et suis ta progression" />
      )}

      {objectifs.map(o => {
        const cible = parseFloat(o.montant_cible)
        const actuel = parseFloat(o.montant_actuel)
        const pct = Math.min(100, (actuel / cible) * 100)
        return (
          <Card key={o.id} elevated style={{ marginBottom: "10px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ fontSize: "14px", fontWeight: 500, color: colors.text }}>{o.titre}</div>
              {pct >= 100 && <Badge tone="success">Atteint 🎉</Badge>}
            </div>
            <div style={{ marginBottom: "8px" }}><ProgressBar percent={pct} color={gradients.gold} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: colors.text }}>{actuel.toFixed(0)} CHF</span>
              <span style={{ fontSize: "12px", color: colors.textFaint }}>sur {cible.toFixed(0)} CHF</span>
            </div>

            {contribuerA === o.id ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <input aria-label="Montant CHF" value={montantContrib} onChange={e => setMontantContrib(e.target.value)} type="number" min="0" step="5" autoFocus placeholder="Montant CHF"
                  style={{ flex: 1, border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "8px 12px", fontSize: "16px", color: colors.text, boxSizing: "border-box" }} />
                <Button onClick={() => ajouterContribution(o.id)}>OK</Button>
                <Button variant="ghost" onClick={() => { setContribuerA(null); setMontantContrib("") }}>✕</Button>
              </div>
            ) : (
              <Button full onClick={() => setContribuerA(o.id)}>+ J’ai épargné</Button>
            )}
          </Card>
        )
      })}
    </div>
  )
}
