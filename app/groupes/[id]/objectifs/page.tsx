"use client"
import { ContributionObjectif, MembreGroupe, ObjectifGroupe, Profil, User } from "@/lib/types"
import { useChargement } from "@/lib/useChargement"
import { useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import SectionHeader from "@/app/components/ui/SectionHeader"
import Card from "@/app/components/ui/Card"
import Button from "@/app/components/ui/Button"
import Badge from "@/app/components/ui/Badge"
import ProgressBar from "@/app/components/ui/ProgressBar"
import EmptyState from "@/app/components/ui/EmptyState"
import { colors } from "@/app/components/ui/tokens"

const IconTarget = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>

export default function ObjectifsGroupePage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [user, setUser] = useState<User | null>(null)
  const [profils, setProfils] = useState<Record<string, Pick<Profil, 'id' | 'nom'>>>({})
  const [objectifs, setObjectifs] = useState<ObjectifGroupe[]>([])
  const [contributions, setContributions] = useState<ContributionObjectif[]>([])
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState("")
  const [montantCible, setMontantCible] = useState("")
  const [dateLimite, setDateLimite] = useState("")
  const [contribuerA, setContribuerA] = useState<string | null>(null)
  const [montantContrib, setMontantContrib] = useState("")


  async function charger() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    const { data: mb } = await supabase.from("membres_groupe").select("user_id").eq("groupe_id", id)
    if (mb && mb.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("id,nom").in("id", (mb as MembreGroupe[]).map(m => m.user_id))
      const map: Record<string, Pick<Profil, 'id' | 'nom'>> = {}
      for (const p of (profs || []) as Pick<Profil, 'id' | 'nom'>[]) map[p.id] = p
      setProfils(map)
    }

    const { data: obj } = await supabase.from("objectifs_groupe").select("*").eq("groupe_id", id).order("created_at", { ascending: false })
    setObjectifs(obj || [])
    if (obj && obj.length > 0) {
      const { data: contribs } = await supabase.from("objectifs_groupe_contributions").select("*").in("objectif_id", (obj as ObjectifGroupe[]).map(o => o.id))
      setContributions(contribs || [])
    } else {
      setContributions([])
    }
  }

  useChargement(charger, id)

  async function creerObjectif() {
    const cible = parseFloat(montantCible)
    if (!titre.trim() || !cible || cible <= 0 || !user) return

    await supabase.from("objectifs_groupe").insert({
      groupe_id: id, titre: titre.trim(), montant_cible: cible,
      date_limite: dateLimite || null, created_by: user.id,
    })

    await supabase.from("messages_groupe").insert({
      groupe_id: id, user_id: user.id,
      contenu: `🎯 ${profils[user.id]?.nom || "Quelqu'un"} a lancé un objectif de groupe : "${titre.trim()}" — ${cible.toFixed(0)} CHF`,
    })

    setTitre(""); setMontantCible(""); setDateLimite(""); setShowForm(false)
    charger()
  }

  async function ajouterContribution(objectifId: string) {
    const montant = parseFloat(montantContrib)
    if (!montant || montant <= 0 || !user) return

    await supabase.from("objectifs_groupe_contributions").insert({
      objectif_id: objectifId, user_id: user.id, montant,
    })

    const objectif = objectifs.find(o => o.id === objectifId)
    await supabase.from("messages_groupe").insert({
      groupe_id: id, user_id: user.id,
      contenu: `💰 ${profils[user.id]?.nom || "Quelqu'un"} a mis ${montant.toFixed(0)} CHF dans l'objectif "${objectif?.titre}"`,
    })

    setMontantContrib(""); setContribuerA(null)
    charger()
  }

  return (
    <main className="min-h-screen bg-white">
      <SectionHeader
        backHref={`/groupes/${id}`}
        backLabel="← Retour au groupe"
        title="Objectifs de groupe"
        action={<Button variant="onDark" onClick={() => setShowForm(!showForm)}>+ Nouveau</Button>}
      />

      <div style={{ padding: "16px 14px" }}>
        {showForm && (
          <Card style={{ background: colors.goldLight, border: `0.5px solid ${colors.goldBorder}`, marginBottom: "14px" }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text, marginBottom: "10px" }}>Nouvel objectif</div>
            <input aria-label="Voyage à Barcelone, Cadeau" value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Voyage à Barcelone, Cadeau…"
              style={{ width: "100%", border: `1px solid ${colors.goldBorder}`, borderRadius: "10px", padding: "10px 12px", fontSize: "16px", color: colors.text, background: "#fff", marginBottom: "10px", boxSizing: "border-box" }} />
            <input aria-label="Montant visé (CHF)" value={montantCible} onChange={e => setMontantCible(e.target.value)} type="number" min="0" step="10" placeholder="Montant visé (CHF)"
              style={{ width: "100%", border: `1px solid ${colors.goldBorder}`, borderRadius: "10px", padding: "10px 12px", fontSize: "16px", color: colors.text, background: "#fff", marginBottom: "10px", boxSizing: "border-box" }} />
            <div style={{ fontSize: "12px", color: "#8a6d1a", marginBottom: "6px" }}>Date limite (optionnel)</div>
            <input aria-label="Date limite" value={dateLimite} onChange={e => setDateLimite(e.target.value)} type="date"
              style={{ width: "100%", border: `1px solid ${colors.goldBorder}`, borderRadius: "10px", padding: "10px 12px", fontSize: "16px", color: colors.text, background: "#fff", marginBottom: "12px", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <Button variant="gold" full onClick={creerObjectif}>Créer</Button>
              <Button variant="ghost" full onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </Card>
        )}

        {objectifs.length === 0 && (
          <EmptyState icon={<IconTarget />} title="Aucun objectif pour l'instant" subtitle="Lancez une cagnotte pour un projet commun" />
        )}

        {objectifs.map(o => {
          const contribsObjectif = contributions.filter(c => c.objectif_id === o.id)
          const total = contribsObjectif.reduce((s, c) => s + Number(c.montant), 0)
          const pct = Math.min(100, (total / Number(o.montant_cible)) * 100)
          const parPersonne: Record<string, number> = {}
          contribsObjectif.forEach(c => { parPersonne[c.user_id] = (parPersonne[c.user_id] || 0) + Number(c.montant) })

          return (
            <Card key={o.id} elevated style={{ marginBottom: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <div style={{ fontSize: "15px", fontWeight: 500, color: colors.text }}>{o.titre}</div>
                {pct >= 100 && <Badge tone="success">Atteint 🎉</Badge>}
              </div>
              {o.date_limite && (
                <div style={{ fontSize: "11px", color: colors.textFaint, marginBottom: "10px" }}>Avant le {new Date(o.date_limite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</div>
              )}

              <div style={{ marginBottom: "8px" }}>
                <ProgressBar percent={pct} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "13px", fontWeight: 500, color: colors.text }}>{total.toFixed(0)} CHF</span>
                <span style={{ fontSize: "12px", color: colors.textFaint }}>sur {Number(o.montant_cible).toFixed(0)} CHF</span>
              </div>

              {Object.keys(parPersonne).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                  {Object.entries(parPersonne).map(([uid, montant]) => (
                    <Badge key={uid} tone="warning">{profils[uid]?.nom || 'Membre'} · {montant.toFixed(0)} CHF</Badge>
                  ))}
                </div>
              )}

              {contribuerA === o.id ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input aria-label="Montant CHF" value={montantContrib} onChange={e => setMontantContrib(e.target.value)} type="number" min="0" step="5" autoFocus placeholder="Montant CHF"
                    style={{ flex: 1, border: `1px solid ${colors.goldBorder}`, borderRadius: "10px", padding: "8px 12px", fontSize: "16px", color: colors.text, boxSizing: "border-box" }} />
                  <Button variant="gold" onClick={() => ajouterContribution(o.id)}>OK</Button>
                  <Button variant="ghost" onClick={() => { setContribuerA(null); setMontantContrib("") }}>✕</Button>
                </div>
              ) : (
                <Button variant="gold" full onClick={() => setContribuerA(o.id)}>+ Contribuer</Button>
              )}
            </Card>
          )
        })}
      </div>
    </main>
  )
}
