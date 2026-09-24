"use client"
import { MembreGroupe, OptionSondage, Profil, Sondage, User, VoteSondage } from "@/lib/types"
import { useChargement } from "@/lib/useChargement"
import { useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import SectionHeader from "@/app/components/ui/SectionHeader"
import Card from "@/app/components/ui/Card"
import Button from "@/app/components/ui/Button"
import EmptyState from "@/app/components/ui/EmptyState"
import { colors } from "@/app/components/ui/tokens"

const IconPoll = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>

export default function SondagesGroupePage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [user, setUser] = useState<User | null>(null)
  const [profils, setProfils] = useState<Record<string, Pick<Profil, 'id' | 'nom'>>>({})
  const [sondages, setSondages] = useState<Sondage[]>([])
  const [options, setOptions] = useState<OptionSondage[]>([])
  const [votes, setVotes] = useState<VoteSondage[]>([])
  const [showForm, setShowForm] = useState(false)
  const [question, setQuestion] = useState("")
  const [choix, setChoix] = useState(["", ""])


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

    const { data: snd } = await supabase.from("sondages_groupe").select("*").eq("groupe_id", id).order("created_at", { ascending: false })
    setSondages(snd || [])
    if (snd && snd.length > 0) {
      const sondageIds = (snd as Sondage[]).map(s => s.id)
      const { data: opts } = await supabase.from("sondages_groupe_options").select("*").in("sondage_id", sondageIds).order("ordre")
      setOptions(opts || [])
      const { data: vts } = await supabase.from("sondages_groupe_votes").select("*").in("sondage_id", sondageIds)
      setVotes(vts || [])
    } else {
      setOptions([]); setVotes([])
    }
  }

  useChargement(charger, id)

  function updateChoix(i: number, val: string) {
    setChoix(prev => prev.map((c, idx) => idx === i ? val : c))
  }

  async function creerSondage() {
    const choixValides = choix.map(c => c.trim()).filter(Boolean)
    if (!question.trim() || choixValides.length < 2 || !user) return

    const { data: nouveauSondage, error } = await supabase.from("sondages_groupe").insert({
      groupe_id: id, question: question.trim(), created_by: user.id,
    }).select().single()
    if (error || !nouveauSondage) return

    await supabase.from("sondages_groupe_options").insert(
      choixValides.map((texte, i) => ({ sondage_id: nouveauSondage.id, texte, ordre: i }))
    )

    await supabase.from("messages_groupe").insert({
      groupe_id: id, user_id: user.id,
      contenu: `📊 ${profils[user.id]?.nom || "Quelqu'un"} a lancé un sondage : "${question.trim()}"`,
    })

    setQuestion(""); setChoix(["", ""]); setShowForm(false)
    charger()
  }

  async function voter(sondageId: string, optionId: string) {
    if (!user) return
    await supabase.from("sondages_groupe_votes").upsert(
      { sondage_id: sondageId, option_id: optionId, user_id: user.id },
      { onConflict: "sondage_id,user_id" }
    )
    charger()
  }

  return (
    <main className="min-h-screen bg-white">
      <SectionHeader
        backHref={`/groupes/${id}`}
        backLabel="← Retour au groupe"
        title="Sondages"
        action={<Button variant="onDark" onClick={() => setShowForm(!showForm)}>+ Nouveau</Button>}
      />

      <div style={{ padding: "16px 14px" }}>
        {showForm && (
          <Card style={{ background: colors.blueLight, border: `0.5px solid ${colors.blueBorder}`, marginBottom: "14px" }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text, marginBottom: "10px" }}>Nouveau sondage</div>
            <input aria-label="On mange où ce soir ?" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ex: On mange où ce soir ?"
              style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 12px", fontSize: "16px", color: colors.text, background: "#fff", marginBottom: "10px", boxSizing: "border-box" }} />
            {choix.map((c, i) => (
              <input aria-label="Option ${i + 1" key={i} value={c} onChange={e => updateChoix(i, e.target.value)} placeholder={`Option ${i + 1}`}
                style={{ width: "100%", border: `1px solid ${colors.border}`, borderRadius: "10px", padding: "10px 12px", fontSize: "16px", color: colors.text, background: "#fff", marginBottom: "8px", boxSizing: "border-box" }} />
            ))}
            {choix.length < 5 && (
              <button onClick={() => setChoix(prev => [...prev, ""])} style={{ background: "none", border: "none", color: colors.blue, fontSize: "12px", fontWeight: 500, cursor: "pointer", padding: "4px 0", marginBottom: "10px" }}>
                + Ajouter une option
              </button>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <Button full onClick={creerSondage}>Lancer</Button>
              <Button variant="ghost" full onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </Card>
        )}

        {sondages.length === 0 && (
          <EmptyState icon={<IconPoll />} title="Aucun sondage pour l'instant" subtitle="Lance une question rapide au groupe" />
        )}

        {sondages.map(s => {
          const optionsSondage = options.filter(o => o.sondage_id === s.id)
          const votesSondage = votes.filter(v => v.sondage_id === s.id)
          const monVote = votesSondage.find(v => v.user_id === user?.id)
          const totalVotes = votesSondage.length

          return (
            <Card key={s.id} elevated style={{ marginBottom: "10px", padding: "16px" }}>
              <div style={{ fontSize: "14px", fontWeight: 500, color: colors.text, marginBottom: "12px" }}>{s.question}</div>
              {optionsSondage.map(o => {
                const nbVotes = votesSondage.filter(v => v.option_id === o.id).length
                const pct = totalVotes > 0 ? Math.round((nbVotes / totalVotes) * 100) : 0
                const estMonChoix = monVote?.option_id === o.id
                return (
                  <button key={o.id} onClick={() => voter(s.id, o.id)}
                    style={{ width: "100%", position: "relative", overflow: "hidden", border: `1px solid ${estMonChoix ? colors.blue : colors.border}`, borderRadius: "10px", padding: "10px 12px", marginBottom: "6px", background: "#fff", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: estMonChoix ? colors.blueLight : "#F5F7FA", transition: "width 0.3s ease" }} />
                    <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: colors.text, fontWeight: estMonChoix ? 500 : 400 }}>{estMonChoix ? "✓ " : ""}{o.texte}</span>
                      <span style={{ fontSize: "12px", color: colors.textFaint }}>{nbVotes} · {pct}%</span>
                    </div>
                  </button>
                )
              })}
              <div style={{ fontSize: "11px", color: colors.textFaint, marginTop: "4px" }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''} · par {profils[s.created_by]?.nom || 'Membre'}</div>
            </Card>
          )
        })}
      </div>
    </main>
  )
}
