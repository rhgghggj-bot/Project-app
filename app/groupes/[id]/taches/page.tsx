"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import SectionHeader from "@/app/components/ui/SectionHeader"
import Card from "@/app/components/ui/Card"
import Button from "@/app/components/ui/Button"
import Badge from "@/app/components/ui/Badge"
import EmptyState from "@/app/components/ui/EmptyState"
import { colors } from "@/app/components/ui/tokens"

const IconChores = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg>

function periodeIndex(d = new Date()) {
  return Math.floor(d.getTime() / (7 * 24 * 3600 * 1000))
}

export default function TachesMenageresPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [user, setUser] = useState<any>(null)
  const [membres, setMembres] = useState<any[]>([])
  const [profils, setProfils] = useState<Record<string, any>>({})
  const [taches, setTaches] = useState<any[]>([])
  const [inscrits, setInscrits] = useState<any[]>([])
  const [completions, setCompletions] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState("")
  const [participants, setParticipants] = useState<Record<string, boolean>>({})

  const periode = String(periodeIndex())

  useEffect(() => { charger() }, [])

  async function charger() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    const { data: mb } = await supabase.from("membres_groupe").select("user_id").eq("groupe_id", id)
    setMembres(mb || [])
    if (mb && mb.length > 0) {
      const ids = mb.map((m: any) => m.user_id)
      const { data: profs } = await supabase.from("profiles").select("id,nom").in("id", ids)
      const map: Record<string, any> = {}
      profs?.forEach((p: any) => { map[p.id] = p })
      setProfils(map)
      setParticipants(prev => {
        const next = { ...prev }
        ids.forEach((uid: string) => { if (!(uid in next)) next[uid] = true })
        return next
      })
    }

    const { data: t } = await supabase.from("taches_menageres").select("*").eq("groupe_id", id).order("created_at", { ascending: false })
    setTaches(t || [])
    if (t && t.length > 0) {
      const tacheIds = t.map((x: any) => x.id)
      const { data: ins } = await supabase.from("taches_menageres_membres").select("*").in("tache_id", tacheIds).order("ordre")
      setInscrits(ins || [])
      const { data: comp } = await supabase.from("taches_menageres_completions").select("*").in("tache_id", tacheIds)
      setCompletions(comp || [])
    } else {
      setInscrits([]); setCompletions([])
    }
  }

  async function creerTache() {
    const idsChoisis = Object.entries(participants).filter(([, v]) => v).map(([k]) => k)
    if (!titre.trim() || idsChoisis.length === 0 || !user) return

    const { data: nouvelleTache, error } = await supabase.from("taches_menageres").insert({
      groupe_id: id, titre: titre.trim(), created_by: user.id,
    }).select().single()
    if (error || !nouvelleTache) return

    await supabase.from("taches_menageres_membres").insert(
      idsChoisis.map((uid, i) => ({ tache_id: nouvelleTache.id, user_id: uid, ordre: i }))
    )

    await supabase.from("messages_groupe").insert({
      groupe_id: id, user_id: user.id,
      contenu: `🧹 ${profils[user.id]?.nom || "Quelqu'un"} a créé une tâche tournante : "${titre.trim()}"`,
    })

    setTitre(""); setShowForm(false)
    charger()
  }

  async function supprimerTache(tacheId: string) {
    await supabase.from("taches_menageres_membres").delete().eq("tache_id", tacheId)
    await supabase.from("taches_menageres_completions").delete().eq("tache_id", tacheId)
    await supabase.from("taches_menageres").delete().eq("id", tacheId)
    charger()
  }

  async function marquerFait(tacheId: string) {
    if (!user) return
    const { data, error } = await supabase.from("taches_menageres_completions").insert({
      tache_id: tacheId, periode, user_id: user.id,
    }).select().single()
    if (error || !data) return
    setCompletions(prev => [...prev, data])

    const tache = taches.find(t => t.id === tacheId)
    await supabase.from("messages_groupe").insert({
      groupe_id: id, user_id: user.id,
      contenu: `✅ ${profils[user.id]?.nom || "Quelqu'un"} a fait la tâche "${tache?.titre}" cette semaine`,
    })
  }

  return (
    <main className="min-h-screen bg-white">
      <SectionHeader
        backHref={`/groupes/${id}`}
        backLabel="← Retour au groupe"
        title="Tâches ménagères"
        action={<Button variant="secondary" onClick={() => setShowForm(!showForm)}>+ Nouvelle</Button>}
      />

      <div style={{ padding: "16px 14px" }}>
        <div style={{ fontSize: "12px", color: colors.textFaint, marginBottom: "14px" }}>
          Chaque tâche tourne automatiquement entre les membres inscrits, semaine après semaine.
        </div>

        {showForm && (
          <Card style={{ background: colors.blueLight, border: `0.5px solid ${colors.blueBorder}`, marginBottom: "14px" }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text, marginBottom: "10px" }}>Nouvelle tâche tournante</div>
            <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Poubelles, Ménage, Vaisselle..."
              style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 12px", fontSize: "16px", color: colors.text, background: "#fff", marginBottom: "10px", boxSizing: "border-box" }} />
            <div style={{ fontSize: "12px", color: colors.textMuted, marginBottom: "6px" }}>Participe à la rotation</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
              {membres.map((m: any) => (
                <label key={m.user_id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: colors.text }}>
                  <input type="checkbox" checked={!!participants[m.user_id]}
                    onChange={e => setParticipants(prev => ({ ...prev, [m.user_id]: e.target.checked }))} />
                  {profils[m.user_id]?.nom || 'Membre'}{m.user_id === user?.id ? ' (toi)' : ''}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button full onClick={creerTache}>Créer</Button>
              <Button variant="ghost" full onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </Card>
        )}

        {taches.length === 0 && (
          <EmptyState icon={<IconChores />} title="Aucune tâche tournante pour l'instant" subtitle="Répartis les tâches de la coloc automatiquement" />
        )}

        {taches.map(t => {
          const membresListe = inscrits.filter(i => i.tache_id === t.id)
          if (membresListe.length === 0) return null
          const assigneIndex = periodeIndex() % membresListe.length
          const assigne = membresListe[assigneIndex]
          const faitCetteSemaine = completions.some(c => c.tache_id === t.id && c.periode === periode)
          const cestMonTour = assigne?.user_id === user?.id

          return (
            <Card key={t.id} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: colors.text }}>{t.titre}</div>
                  <div style={{ fontSize: "11px", color: colors.textFaint }}>Cette semaine : {profils[assigne?.user_id]?.nom || 'Membre'}</div>
                </div>
                {faitCetteSemaine ? <Badge tone="success">Fait ✓</Badge> : cestMonTour ? <Badge tone="warning">À toi</Badge> : null}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                {membresListe.map((m: any) => (
                  <span key={m.user_id} style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: m.user_id === assigne?.user_id ? colors.blueLight : "#F5F7FA", color: m.user_id === assigne?.user_id ? colors.blue : colors.textFaint }}>
                    {profils[m.user_id]?.nom || 'Membre'}
                  </span>
                ))}
              </div>

              {!faitCetteSemaine && cestMonTour && (
                <Button full onClick={() => marquerFait(t.id)}>Marquer comme fait</Button>
              )}

              {t.created_by === user?.id && (
                <button onClick={() => supprimerTache(t.id)} style={{ background: "none", border: "none", color: colors.red, fontSize: "12px", cursor: "pointer", padding: "8px 0 0", textAlign: "left" }}>
                  Supprimer cette tâche
                </button>
              )}
            </Card>
          )
        })}
      </div>
    </main>
  )
}
