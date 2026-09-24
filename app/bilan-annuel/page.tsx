"use client"
import { useChargement } from "@/lib/useChargement"
import Link from "next/link"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

const COULEURS_CARTE = [
  "linear-gradient(135deg,#1a3a6e,#2B7FFF)",
  "linear-gradient(135deg,#7c3aed,#D4A843)",
  "linear-gradient(135deg,#0A1628,#8B5CF6)",
  "linear-gradient(135deg,#065f46,#10B981)",
  "linear-gradient(135deg,#9d174d,#F43F5E)",
  "linear-gradient(135deg,#1a3a6e,#87CEEB)",
]

type StatsAnnee = {
  annee: number
  totalDepense: number
  totalRevenu: number
  solde: number
  nbTransactions: number
  nbGroupes: number
  categoriePrefere: string | null
  moisActif: string | null
  objectifsAtteints: number
  totalContribGroupe: number
  nbVentes: number
  nbProjets: number
}

export default function BilanAnnuelPage() {
  const [chargement, setChargement] = useState(true)
  const [stats, setStats] = useState<StatsAnnee | null>(null)


  async function charger() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setChargement(false); return }

      const annee = new Date().getFullYear()
      const debut = `${annee}-01-01`
      const fin = `${annee}-12-31`

      const [depenses, revenus, groupesMembre, objPerso, objGroupeContrib, ventes, projets] = await Promise.all([
        supabase.from("depenses").select("montant,categorie,date").eq("user_id", user.id).gte("date", debut).lte("date", fin),
        supabase.from("revenus").select("montant,date").eq("user_id", user.id).gte("date", debut).lte("date", fin),
        supabase.from("membres_groupe").select("groupe_id").eq("user_id", user.id),
        supabase.from("objectifs_personnels").select("montant_cible,montant_actuel"),
        supabase.from("objectifs_groupe_contributions").select("montant").eq("user_id", user.id),
        supabase.from("marketplace_annonces").select("id").eq("user_id", user.id).eq("statut", "vendu"),
        supabase.from("projets").select("id").eq("user_id", user.id),
      ])

      const totalDepense = (depenses.data || []).reduce((s, d) => s + parseFloat(d.montant), 0)
      const totalRevenu = (revenus.data || []).reduce((s, r) => s + parseFloat(r.montant), 0)

      const parCategorie: Record<string, number> = {}
      ;(depenses.data || []).forEach(d => { parCategorie[d.categorie || 'Autre'] = (parCategorie[d.categorie || 'Autre'] || 0) + parseFloat(d.montant) })
      const categoriePrefere = Object.entries(parCategorie).sort((a, b) => b[1] - a[1])[0]

      const parMois: Record<number, number> = {}
      ;[...(depenses.data || []), ...(revenus.data || [])].forEach((t: { date: string }) => {
        const mois = new Date(t.date).getMonth()
        parMois[mois] = (parMois[mois] || 0) + 1
      })
      const moisActifIdx = Object.entries(parMois).sort((a, b) => b[1] - a[1])[0]?.[0]
      const nomsMois = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]

      const objectifsAtteints = (objPerso.data || []).filter(o => parseFloat(o.montant_actuel) >= parseFloat(o.montant_cible)).length
      const totalContribGroupe = (objGroupeContrib.data || []).reduce((s, c) => s + parseFloat(c.montant), 0)

      setStats({
        annee, totalDepense, totalRevenu, solde: totalRevenu - totalDepense,
        nbTransactions: (depenses.data?.length || 0) + (revenus.data?.length || 0),
        nbGroupes: groupesMembre.data?.length || 0,
        categoriePrefere: categoriePrefere ? categoriePrefere[0] : null,
        moisActif: moisActifIdx !== undefined ? nomsMois[parseInt(moisActifIdx)] : null,
        objectifsAtteints, totalContribGroupe,
        nbVentes: ventes.data?.length || 0,
        nbProjets: projets.data?.length || 0,
      })
    } finally {
      setChargement(false)
    }
  }

  useChargement(charger)

  if (chargement) return null

  if (!stats) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A1628", color: "#fff", padding: "24px", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: "16px", marginBottom: "8px" }}>Connecte-toi pour voir ton bilan</div>
          <Link href="/connexion" style={{ color: "#2B7FFF", fontSize: "14px" }}>Se connecter →</Link>
        </div>
      </main>
    )
  }

  const cartes = [
    { titre: `Ton année ${stats.annee}`, contenu: <div style={{ fontSize: "48px" }}>🎉</div>, sous: "sur Nexia" },
    { titre: "Transactions enregistrées", contenu: <div style={{ fontSize: "56px", fontWeight: 700 }}>{stats.nbTransactions}</div>, sous: "dépenses et revenus suivis" },
    { titre: "Bilan de l'année", contenu: <div style={{ fontSize: "40px", fontWeight: 700, color: stats.solde >= 0 ? "#86efac" : "#fca5a5" }}>{stats.solde >= 0 ? "+" : ""}{stats.solde.toFixed(0)} CHF</div>, sous: `${stats.totalRevenu.toFixed(0)} CHF reçus · ${stats.totalDepense.toFixed(0)} CHF dépensés` },
    ...(stats.categoriePrefere ? [{ titre: "Ta catégorie préférée", contenu: <div style={{ fontSize: "32px", fontWeight: 700 }}>{stats.categoriePrefere}</div>, sous: "là où part le plus ton argent" }] : []),
    ...(stats.moisActif ? [{ titre: "Ton mois le plus actif", contenu: <div style={{ fontSize: "36px", fontWeight: 700 }}>{stats.moisActif}</div>, sous: `${stats.annee}` }] : []),
    { titre: "Vie de groupe", contenu: <div style={{ fontSize: "48px", fontWeight: 700 }}>{stats.nbGroupes}</div>, sous: `groupe${stats.nbGroupes > 1 ? 's' : ''} actif${stats.nbGroupes > 1 ? 's' : ''}${stats.totalContribGroupe > 0 ? ` · ${stats.totalContribGroupe.toFixed(0)} CHF donnés aux objectifs communs` : ''}` },
    ...(stats.objectifsAtteints > 0 ? [{ titre: "Objectifs atteints", contenu: <div style={{ fontSize: "48px" }}>🎯 x{stats.objectifsAtteints}</div>, sous: "bien joué !" }] : []),
    ...(stats.nbVentes > 0 || stats.nbProjets > 0 ? [{ titre: "Sur Nexia", contenu: <div style={{ fontSize: "16px", lineHeight: 1.8 }}>{stats.nbVentes > 0 && <div>🏷️ {stats.nbVentes} vente{stats.nbVentes > 1 ? 's' : ''}</div>}{stats.nbProjets > 0 && <div>🚀 {stats.nbProjets} projet{stats.nbProjets > 1 ? 's' : ''} publié{stats.nbProjets > 1 ? 's' : ''}</div>}</div>, sous: "" }] : []),
    { titre: "Merci d'utiliser Nexia", contenu: <div style={{ fontSize: "40px" }}>✨</div>, sous: "à l'année prochaine !" },
  ]

  return (
    <main style={{ minHeight: "100vh", background: "#0A1628" }}>
      <Link href="/profile" transitionTypes={['nav-back']} style={{ position: "fixed", top: "16px", left: "16px", zIndex: 10, fontSize: "13px", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>← Profil</Link>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "60px 16px 40px", maxWidth: "440px", margin: "0 auto" }}>
        {cartes.map((c, i) => (
          <div key={i} style={{ background: COULEURS_CARTE[i % COULEURS_CARTE.length], borderRadius: "24px", padding: "36px 24px", textAlign: "center", color: "#fff", minHeight: "200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", fontWeight: 500, letterSpacing: "0.5px" }}>{c.titre}</div>
            {c.contenu}
            {c.sous && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>{c.sous}</div>}
          </div>
        ))}
      </div>
    </main>
  )
}
