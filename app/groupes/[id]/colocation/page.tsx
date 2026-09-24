"use client"
import { useChargement } from "@/lib/useChargement"
import { useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import SectionHeader from "@/app/components/ui/SectionHeader"
import Card from "@/app/components/ui/Card"
import Button from "@/app/components/ui/Button"
import EmptyState from "@/app/components/ui/EmptyState"
import { colors } from "@/app/components/ui/tokens"

const IconHome = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>

export default function ColocationPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [user, setUser] = useState<any>(null)
  const [membres, setMembres] = useState<any[]>([])
  const [profils, setProfils] = useState<Record<string, any>>({})
  const [charges, setCharges] = useState<any[]>([])
  const [parts, setParts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState("")
  const [payeurId, setPayeurId] = useState("")
  const [jourDuMois, setJourDuMois] = useState("1")
  const [montants, setMontants] = useState<Record<string, string>>({})


  async function charger() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) setPayeurId(prev => prev || user.id)

    const { data: mb } = await supabase.from("membres_groupe").select("user_id").eq("groupe_id", id)
    setMembres(mb || [])
    if (mb && mb.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id,nom").in("id", mb.map((m: any) => m.user_id))
      const map: Record<string, any> = {}
      profs?.forEach((p: any) => { map[p.id] = p })
      setProfils(map)
    }

    const { data: ch } = await supabase.from("colocation_charges").select("*").eq("groupe_id", id).order("created_at", { ascending: false })
    setCharges(ch || [])
    if (ch && ch.length > 0) {
      const { data: pt } = await supabase.from("colocation_charges_parts").select("*").in("charge_id", ch.map((c: any) => c.id))
      setParts(pt || [])
    } else {
      setParts([])
    }
  }

  useChargement(charger, id)

  async function creerCharge() {
    const jour = parseInt(jourDuMois, 10)
    const partsValides = Object.entries(montants).filter(([, v]) => parseFloat(v) > 0)
    if (!titre.trim() || !payeurId || !jour || partsValides.length === 0 || !user) return

    const { data: nouvelleCharge, error } = await supabase.from("colocation_charges").insert({
      groupe_id: id, titre: titre.trim(), payeur_id: payeurId, jour_du_mois: jour, created_by: user.id,
    }).select().single()
    if (error || !nouvelleCharge) return

    await supabase.from("colocation_charges_parts").insert(
      partsValides.map(([uid, montant]) => ({ charge_id: nouvelleCharge.id, user_id: uid, montant: parseFloat(montant) }))
    )

    await supabase.from("messages_groupe").insert({
      groupe_id: id, user_id: user.id,
      contenu: `🏠 Charge récurrente configurée : "${titre.trim()}", générée automatiquement le ${jour} de chaque mois.`,
    })

    setTitre(""); setJourDuMois("1"); setMontants({}); setShowForm(false)
    charger()
  }

  async function supprimerCharge(chargeId: string) {
    await supabase.from("colocation_charges_parts").delete().eq("charge_id", chargeId)
    await supabase.from("colocation_charges").delete().eq("id", chargeId)
    charger()
  }

  return (
    <main className="min-h-screen bg-white">
      <SectionHeader
        backHref={`/groupes/${id}`}
        backLabel="← Retour au groupe"
        title="Mode colocation"
        action={<Button variant="onDark" onClick={() => setShowForm(!showForm)}>+ Charge</Button>}
      />

      <div style={{ padding: "16px 14px" }}>
        <div style={{ fontSize: "12px", color: colors.textFaint, marginBottom: "14px" }}>
          Configure une charge récurrente (loyer, internet...) avec une répartition libre par personne. Elle sera générée automatiquement en dépense partagée chaque mois, au jour choisi.
        </div>

        {showForm && (
          <Card style={{ background: colors.blueLight, border: `0.5px solid ${colors.blueBorder}`, marginBottom: "14px" }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text, marginBottom: "10px" }}>Nouvelle charge récurrente</div>
            <input aria-label="Loyer, Internet, Électricité" value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Loyer, Internet, Électricité…"
              style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 12px", fontSize: "16px", color: colors.text, background: "#fff", marginBottom: "10px", boxSizing: "border-box" }} />

            <div style={{ fontSize: "12px", color: colors.textMuted, marginBottom: "6px" }}>Qui collecte et paie le bailleur/fournisseur ?</div>
            <select aria-label="Payé par" value={payeurId} onChange={e => setPayeurId(e.target.value)}
              style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 12px", fontSize: "14px", color: colors.text, background: "#fff", marginBottom: "10px" }}>
              {membres.map((m: any) => <option key={m.user_id} value={m.user_id}>{profils[m.user_id]?.nom || 'Membre'}{m.user_id === user?.id ? ' (toi)' : ''}</option>)}
            </select>

            <div style={{ fontSize: "12px", color: colors.textMuted, marginBottom: "6px" }}>Jour du mois</div>
            <input aria-label="Jour du mois" type="number" min="1" max="31" value={jourDuMois} onChange={e => setJourDuMois(e.target.value)}
              style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 12px", fontSize: "16px", color: colors.text, background: "#fff", marginBottom: "10px", boxSizing: "border-box" }} />

            <div style={{ fontSize: "12px", color: colors.textMuted, marginBottom: "6px" }}>Part de chacun (CHF)</div>
            {membres.map((m: any) => (
              <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ flex: 1, fontSize: "13px", color: colors.text }}>{profils[m.user_id]?.nom || 'Membre'}{m.user_id === user?.id ? ' (toi)' : ''}</span>
                <input aria-label="0" type="number" min="0" step="10" value={montants[m.user_id] || ""} onChange={e => setMontants(prev => ({ ...prev, [m.user_id]: e.target.value }))} placeholder="0"
                  style={{ width: "90px", border: `1px solid ${colors.border}`, borderRadius: "8px", padding: "6px 10px", fontSize: "14px", color: colors.text, boxSizing: "border-box" }} />
              </div>
            ))}

            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <Button full onClick={creerCharge}>Créer</Button>
              <Button variant="ghost" full onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </Card>
        )}

        {charges.length === 0 && (
          <EmptyState icon={<IconHome />} title="Aucune charge récurrente configurée" subtitle="Mets en place le loyer ou l'internet à répartir chaque mois" />
        )}

        {charges.map(c => {
          const partsCharge = parts.filter(p => p.charge_id === c.id)
          const total = partsCharge.reduce((s, p) => s + parseFloat(p.montant), 0)
          return (
            <Card key={c.id} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: colors.text }}>{c.titre}</div>
                  <div style={{ fontSize: "11px", color: colors.textFaint }}>Le {c.jour_du_mois} de chaque mois · collecté par {profils[c.payeur_id]?.nom || 'Membre'}</div>
                </div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: colors.text }}>{total.toFixed(0)} CHF</div>
              </div>
              {partsCharge.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: colors.textMuted, padding: "3px 0" }}>
                  <span>{profils[p.user_id]?.nom || 'Membre'}</span>
                  <span>{parseFloat(p.montant).toFixed(0)} CHF</span>
                </div>
              ))}
              {c.created_by === user?.id && (
                <button onClick={() => supprimerCharge(c.id)} style={{ background: "none", border: "none", color: colors.red, fontSize: "12px", cursor: "pointer", padding: "8px 0 0", textAlign: "left" }}>
                  Supprimer cette charge
                </button>
              )}
            </Card>
          )
        })}
      </div>
    </main>
  )
}
