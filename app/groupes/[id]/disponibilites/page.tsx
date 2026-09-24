"use client"
import { useChargement } from "@/lib/useChargement"
import { Fragment, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import SectionHeader from "@/app/components/ui/SectionHeader"
import { colors } from "@/app/components/ui/tokens"

const CRENEAUX = [
  { id: "matin", label: "Matin" },
  { id: "apres-midi", label: "Après-midi" },
  { id: "soir", label: "Soir" },
] as const

function joursSuivants(n: number) {
  const jours: Date[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    jours.push(d)
  }
  return jours
}

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function DisponibilitesGroupePage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [user, setUser] = useState<any>(null)
  const [nbMembres, setNbMembres] = useState(0)
  const [dispos, setDispos] = useState<any[]>([])
  const jours = joursSuivants(14)


  async function charger() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    const { data: mb } = await supabase.from("membres_groupe").select("user_id").eq("groupe_id", id)
    setNbMembres(mb?.length || 0)

    const { data: d } = await supabase.from("disponibilites_groupe").select("*")
      .eq("groupe_id", id).gte("date", dateStr(jours[0])).lte("date", dateStr(jours[jours.length - 1]))
    setDispos(d || [])
  }

  useChargement(charger, id)

  async function toggleCreneau(date: string, creneau: string) {
    if (!user) return
    const existant = dispos.find(d => d.date === date && d.creneau === creneau && d.user_id === user.id)
    if (existant) {
      await supabase.from("disponibilites_groupe").delete().eq("id", existant.id)
      setDispos(prev => prev.filter(d => d.id !== existant.id))
    } else {
      const { data } = await supabase.from("disponibilites_groupe").insert({
        groupe_id: id, user_id: user.id, date, creneau,
      }).select().single()
      if (data) setDispos(prev => [...prev, data])
    }
  }

  function intensite(date: string, creneau: string) {
    const n = dispos.filter(d => d.date === date && d.creneau === creneau).length
    return nbMembres > 0 ? n / nbMembres : 0
  }

  function meilleurCreneau() {
    let meilleur: { date: string; creneau: string; n: number } | null = null
    jours.forEach(j => {
      CRENEAUX.forEach(c => {
        const n = dispos.filter(d => d.date === dateStr(j) && d.creneau === c.id).length
        if (n > 0 && (!meilleur || n > meilleur.n)) meilleur = { date: dateStr(j), creneau: c.label, n }
      })
    })
    return meilleur
  }

  const top = meilleurCreneau() as { date: string; creneau: string; n: number } | null

  return (
    <main className="min-h-screen bg-white">
      <SectionHeader backHref={`/groupes/${id}`} backLabel="← Retour au groupe" title="Disponibilités" />

      <div style={{ padding: "16px 14px" }}>
        <div style={{ fontSize: "12px", color: colors.textFaint, marginBottom: "14px" }}>
          Coche les créneaux où tu es libre sur les 2 prochaines semaines. Plus la case est foncée, plus vous êtes disponibles à ce moment-là.
        </div>

        {top && (
          <div style={{ background: colors.greenLight, border: `0.5px solid ${colors.greenBorder}`, borderRadius: "12px", padding: "12px 14px", marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", color: colors.green, fontWeight: 500 }}>
              🎯 Meilleur créneau : {new Date(top.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} — {top.creneau} ({top.n}/{nbMembres} dispo{top.n > 1 ? 's' : ''})
            </div>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: `70px repeat(${jours.length}, 44px)`, gap: "3px", minWidth: "max-content" }}>
            <div />
            {jours.map(j => (
              <div key={dateStr(j)} style={{ textAlign: "center", fontSize: "10px", color: colors.textFaint, fontWeight: 500 }}>
                <div>{j.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2)}</div>
                <div>{j.getDate()}</div>
              </div>
            ))}
            {CRENEAUX.map(c => (
              <Fragment key={c.id}>
                <div style={{ fontSize: "11px", color: colors.textMuted, display: "flex", alignItems: "center" }}>{c.label}</div>
                {jours.map(j => {
                  const date = dateStr(j)
                  const moi = dispos.some(d => d.date === date && d.creneau === c.id && d.user_id === user?.id)
                  const alpha = intensite(date, c.id)
                  return (
                    <button key={date + c.id} onClick={() => toggleCreneau(date, c.id)}
                      style={{
                        width: "44px", height: "36px", borderRadius: "8px", cursor: "pointer",
                        border: moi ? `2px solid ${colors.blue}` : "1px solid #E8F1FF",
                        background: alpha > 0 ? `rgba(43,127,255,${0.15 + alpha * 0.6})` : "#fff",
                      }} />
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "16px", fontSize: "11px", color: colors.textFaint }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", border: `2px solid ${colors.blue}` }} />
          Toi
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(43,127,255,0.6)", marginLeft: "10px" }} />
          Beaucoup de monde dispo
        </div>
      </div>
    </main>
  )
}
