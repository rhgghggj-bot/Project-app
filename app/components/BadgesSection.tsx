"use client"
import { useChargement } from "@/lib/useChargement"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { colors } from "./ui/tokens"

type BadgeDef = { id: string; icone: string; titre: string; description: string }

const BADGES: BadgeDef[] = [
  { id: "premier_pas", icone: "🌱", titre: "Premier pas", description: "Enregistre ta première dépense ou revenu" },
  { id: "serie_7", icone: "🔥", titre: "Série de 7 jours", description: "7 jours d'affilée avec une transaction" },
  { id: "serie_30", icone: "⚡", titre: "Série de 30 jours", description: "30 jours d'affilée avec une transaction" },
  { id: "epargnant", icone: "🎯", titre: "Épargnant", description: "Atteins un objectif d'épargne personnel" },
  { id: "genereux", icone: "💛", titre: "Généreux", description: "Contribue à un objectif de groupe" },
  { id: "organisateur", icone: "👥", titre: "Organisateur", description: "Crée un groupe" },
  { id: "vendeur", icone: "🏷️", titre: "Vendeur", description: "Conclus une vente sur le marketplace" },
  { id: "createur", icone: "🚀", titre: "Créateur", description: "Publie un projet" },
]

function calculerStreak(dates: string[]): number {
  const jours = new Set(dates.map(d => d.slice(0, 10)))
  let streak = 0
  const curseur = new Date()
  // Si rien aujourd'hui, la série peut quand même être en cours si elle inclut hier.
  if (!jours.has(curseur.toISOString().slice(0, 10))) curseur.setDate(curseur.getDate() - 1)
  while (jours.has(curseur.toISOString().slice(0, 10))) {
    streak++
    curseur.setDate(curseur.getDate() - 1)
  }
  return streak
}

export default function BadgesSection() {
  const [debloques, setDebloques] = useState<Set<string>>(new Set())
  const [streak, setStreak] = useState(0)
  const [chargement, setChargement] = useState(true)


  async function charger() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setChargement(false); return }

    const [depenses, revenus, objectifsPerso, contribsGroupe, groupesCrees, ventes, projets] = await Promise.all([
      supabase.from("depenses").select("date").eq("user_id", user.id),
      supabase.from("revenus").select("date").eq("user_id", user.id),
      supabase.from("objectifs_personnels").select("montant_cible,montant_actuel").eq("user_id", user.id),
      supabase.from("objectifs_groupe_contributions").select("id").eq("user_id", user.id).limit(1),
      supabase.from("groupes").select("id").eq("created_by", user.id).limit(1),
      supabase.from("marketplace_annonces").select("id").eq("user_id", user.id).eq("statut", "vendu").limit(1),
      supabase.from("projets").select("id").eq("user_id", user.id).limit(1),
    ])

    const toutesDates = [...(depenses.data || []), ...(revenus.data || [])].map(d => d.date)
    const serie = calculerStreak(toutesDates)
    setStreak(serie)

    const nouveaux = new Set<string>()
    if (toutesDates.length > 0) nouveaux.add("premier_pas")
    if (serie >= 7) nouveaux.add("serie_7")
    if (serie >= 30) nouveaux.add("serie_30")
    if ((objectifsPerso.data || []).some(o => parseFloat(o.montant_actuel) >= parseFloat(o.montant_cible))) nouveaux.add("epargnant")
    if ((contribsGroupe.data || []).length > 0) nouveaux.add("genereux")
    if ((groupesCrees.data || []).length > 0) nouveaux.add("organisateur")
    if ((ventes.data || []).length > 0) nouveaux.add("vendeur")
    if ((projets.data || []).length > 0) nouveaux.add("createur")

    setDebloques(nouveaux)
    setChargement(false)
  }

  useChargement(charger)

  if (chargement) return null

  return (
    <div>
      {streak > 0 && (
        <div style={{ background: "linear-gradient(135deg,#1a3a6e,#2B7FFF)", borderRadius: "16px", padding: "16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "32px" }}>🔥</div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: "#fff" }}>{streak} jour{streak > 1 ? 's' : ''} de suite</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>Continue à suivre tes finances chaque jour</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {BADGES.map(b => {
          const debloque = debloques.has(b.id)
          return (
            <div key={b.id} style={{
              background: debloque ? "#fff" : "#F5F7FA",
              border: `0.5px solid ${debloque ? colors.border : "#E5E9EF"}`,
              borderRadius: "14px", padding: "14px", textAlign: "center",
              opacity: debloque ? 1 : 0.5,
            }}>
              <div style={{ fontSize: "28px", marginBottom: "6px", filter: debloque ? "none" : "grayscale(1)" }}>{b.icone}</div>
              <div style={{ fontSize: "12px", fontWeight: 500, color: colors.text, marginBottom: "2px" }}>{b.titre}</div>
              <div style={{ fontSize: "10px", color: colors.textFaint, lineHeight: 1.3 }}>{b.description}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
