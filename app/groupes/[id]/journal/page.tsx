"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import SectionHeader from "@/app/components/ui/SectionHeader"
import EmptyState from "@/app/components/ui/EmptyState"
import { colors } from "@/app/components/ui/tokens"

type Evenement = { id: string; icone: string; couleur: string; texte: string; date: string; auteur: string }

const IconJournal = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>

export default function JournalGroupePage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => { charger() }, [])

  async function charger() {
    try {
      await chargerJournal()
    } finally {
      setChargement(false)
    }
  }

  async function chargerJournal() {
    const { data: mb } = await supabase.from("membres_groupe").select("user_id").eq("groupe_id", id)
    const { data: profs } = await supabase.from("profiles").select("id,nom").in("id", (mb || []).map((m: any) => m.user_id))
    const profils: Record<string, string> = {}
    profs?.forEach((p: any) => { profils[p.id] = p.nom || "Membre" })
    const nom = (uid: string) => profils[uid] || "Quelqu'un"

    const [depenses, objectifs, sondages, activites] = await Promise.all([
      supabase.from("depenses_partagees").select("id,titre,montant_total,payeur_id,created_at").eq("groupe_id", id),
      supabase.from("objectifs_groupe").select("id,titre,montant_cible,created_by,created_at").eq("groupe_id", id),
      supabase.from("sondages_groupe").select("id,question,created_by,created_at").eq("groupe_id", id),
      supabase.from("activites_groupe").select("id,titre,created_by,created_at").eq("groupe_id", id),
    ])

    const objectifIds = (objectifs.data || []).map(o => o.id)
    const contributions = objectifIds.length > 0
      ? await supabase.from("objectifs_groupe_contributions").select("id,objectif_id,user_id,montant,created_at").in("objectif_id", objectifIds)
      : { data: [] }
    const titreObjectif: Record<string, string> = {}
    objectifs.data?.forEach(o => { titreObjectif[o.id] = o.titre })

    const tous: Evenement[] = [
      ...(depenses.data || []).map(d => ({
        id: `dep-${d.id}`, icone: "💰", couleur: colors.blue,
        texte: `${nom(d.payeur_id)} a ajouté "${d.titre}" — ${parseFloat(d.montant_total).toFixed(0)} CHF`,
        date: d.created_at, auteur: nom(d.payeur_id),
      })),
      ...(objectifs.data || []).map(o => ({
        id: `obj-${o.id}`, icone: "🎯", couleur: colors.gold,
        texte: `${nom(o.created_by)} a lancé l'objectif "${o.titre}" — ${parseFloat(o.montant_cible).toFixed(0)} CHF`,
        date: o.created_at, auteur: nom(o.created_by),
      })),
      ...(contributions.data || []).map((c: any) => ({
        id: `contrib-${c.id}`, icone: "🪙", couleur: colors.gold,
        texte: `${nom(c.user_id)} a contribué ${parseFloat(c.montant).toFixed(0)} CHF à "${titreObjectif[c.objectif_id] || 'un objectif'}"`,
        date: c.created_at, auteur: nom(c.user_id),
      })),
      ...(sondages.data || []).map(s => ({
        id: `sondage-${s.id}`, icone: "📊", couleur: "#F97316",
        texte: `${nom(s.created_by)} a lancé le sondage "${s.question}"`,
        date: s.created_at, auteur: nom(s.created_by),
      })),
      ...(activites.data || []).map(a => ({
        id: `act-${a.id}`, icone: "📅", couleur: colors.purple,
        texte: `${nom(a.created_by)} a planifié "${a.titre}"`,
        date: a.created_at, auteur: nom(a.created_by),
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setEvenements(tous)
  }

  return (
    <main className="min-h-screen bg-white">
      <SectionHeader backHref={`/groupes/${id}`} backLabel="← Retour au groupe" title="Journal du groupe" />

      <div style={{ padding: "16px 14px" }}>
        {!chargement && evenements.length === 0 && (
          <EmptyState icon={<IconJournal />} title="Rien à afficher pour l'instant" subtitle="Les dépenses, objectifs, sondages et activités du groupe apparaîtront ici" />
        )}

        {evenements.length > 0 && (
          <div style={{ position: "relative", paddingLeft: "24px" }}>
            <div style={{ position: "absolute", left: "9px", top: "8px", bottom: "8px", width: "2px", background: colors.border }} />
            {evenements.map(e => (
              <div key={e.id} style={{ position: "relative", marginBottom: "18px" }}>
                <div style={{ position: "absolute", left: "-24px", top: "0", width: "20px", height: "20px", borderRadius: "50%", background: "#fff", border: `2px solid ${e.couleur}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>
                  {e.icone}
                </div>
                <div style={{ fontSize: "13px", color: colors.text, lineHeight: 1.4 }}>{e.texte}</div>
                <div style={{ fontSize: "11px", color: colors.textFaint, marginTop: "2px" }}>
                  {new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
