"use client"
import { useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast, confirmer } from "@/lib/toast"
import { colors, radius } from "@/app/components/ui/tokens"
import { FichierSchema, type FichierEtudes } from "@/lib/etudesFichier"
import { oublierFichesPerso } from "@/lib/fichesPerso"


export default function Donnees({ userId, onImporte }: { userId: string; onImporte: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [occupe, setOccupe] = useState(false)

  async function exporter() {
    setOccupe(true)
    const [profil, notes, cours, evaluations] = await Promise.all([
      supabase.from("profils_etudiant").select("pays,niveau,filiere,annee,specialites,entreprise_id,entreprise_perso").eq("user_id", userId).maybeSingle(),
      supabase.from("notes_etudiant").select("matiere,titre,note,echelle,coefficient,date,chapitre_id").eq("user_id", userId).order("date"),
      supabase.from("cours_etudiant").select("matiere,titre,entreprise_id,fiches").eq("user_id", userId).order("created_at"),
      supabase.from("evaluations_corrigees").select("matiere,titre,correction").eq("user_id", userId).order("created_at"),
    ])
    setOccupe(false)
    if (profil.error || notes.error || cours.error || evaluations.error) return toast("Export impossible", "error")
    const fichier: FichierEtudes = {
      format: "nexia-etudes", version: 1,
      profil: profil.data ?? undefined,
      notes: (notes.data || []).map(n => ({ ...n, note: Number(n.note), coefficient: Number(n.coefficient) })),
      cours: cours.data || [],
      evaluations: evaluations.data || [],
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(fichier, null, 2)], { type: "application/json" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `mes-etudes-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importer(f: File) {
    let donnees: FichierEtudes
    try {
      donnees = FichierSchema.parse(JSON.parse(await f.text()))
    } catch {
      return toast("Fichier non reconnu", "error")
    }
    const resume = [
      donnees.cours?.length ? `${donnees.cours.length} cours` : "",
      donnees.horaire?.length ? `ton horaire (${donnees.horaire.length} cours par semaine, ajoutés au calendrier)` : "",
      donnees.notes?.length ? `${donnees.notes.length} notes` : "",
      donnees.evaluations?.length ? `${donnees.evaluations.length} corrections` : "",
      donnees.profil ? "ton profil" : "",
    ].filter(Boolean).join(", ")
    if (!resume) return toast("Le fichier est vide", "error")
    if (!(await confirmer(`Ajouter ${resume} à ton espace ?${donnees.cours?.length ? " Un cours qui porte le même nom qu'un cours déjà présent le remplace (nouvelle version), sans doublon." : ""}`, "Importer"))) return

    setOccupe(true)
    const erreurs: string[] = []
    if (donnees.profil) {
      const { error } = await supabase.from("profils_etudiant").upsert({ user_id: userId, ...donnees.profil, updated_at: new Date().toISOString() })
      if (error) erreurs.push("profil")
    }
    if (donnees.notes?.length) {
      const { error } = await supabase.from("notes_etudiant").insert(donnees.notes.map(n => ({ ...n, user_id: userId })))
      if (error) erreurs.push("notes")
    }
    if (donnees.cours?.length) {
      // Nouvelle version d'un cours déjà importé : elle remplace l'ancienne.
      // Un cours à la fois, pour ne pas envoyer plusieurs Mo d'un coup.
      for (const c of donnees.cours) {
        const { data: anciens } = await supabase.from("cours_etudiant").select("id").eq("user_id", userId).eq("titre", c.titre)
        const { error } = await supabase.from("cours_etudiant").insert({ ...c, user_id: userId, ia: "claude" })
        if (error) { erreurs.push(`cours « ${c.titre} »`); continue }
        if (anciens?.length) await supabase.from("cours_etudiant").delete().in("id", anciens.map(a => a.id))
      }
    }
    if (donnees.horaire?.length) {
      const { data: existants } = await supabase.from("evenements_calendrier").select("titre,heure,recurrence_jours").eq("user_id", userId)
      const deja = new Set((existants || []).flatMap(e => (e.recurrence_jours || []).map((j: number) => `${e.titre}|${e.heure}|${j}`)))
      const COULEURS = ["#2B7FFF", "#10B981", "#F43F5E", "#D4A843", "#8B5CF6", "#F59E0B", "#EC4899"]
      const minutes = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5))
      const nouveaux = donnees.horaire.filter(h => !deja.has(`${h.titre}|${h.debut}|${h.jour}`)).map((h, i) => {
        // Première séance : le premier jour de la semaine voulu à partir de « du »
        const d = new Date(h.du + "T12:00")
        while ((d.getDay() + 6) % 7 !== h.jour) d.setDate(d.getDate() + 1)
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        return {
          user_id: userId, titre: h.titre, date, heure: h.debut, duree: Math.max(15, minutes(h.fin) - minutes(h.debut)),
          lieu: h.lieu || null, couleur: COULEURS[i % COULEURS.length], recurrence_jours: [h.jour], recurrence_fin: h.au,
        }
      })
      if (nouveaux.length) {
        const { error } = await supabase.from("evenements_calendrier").insert(nouveaux)
        if (error) erreurs.push("horaire")
      }
    }
    if (donnees.evaluations?.length) {
      const { error } = await supabase.from("evaluations_corrigees").insert(donnees.evaluations.map(e => ({ ...e, user_id: userId, ia: "claude" })))
      if (error) erreurs.push("corrections")
    }
    oublierFichesPerso()
    setOccupe(false)
    if (erreurs.length) toast(`Import partiel : échec pour ${erreurs.join(", ")}`, "error")
    else toast("Import terminé", "success")
    onImporte()
  }

  const bouton: React.CSSProperties = { flex: 1, background: colors.blueLight, color: colors.blue, border: "none", borderRadius: radius.sm, padding: "9px", fontSize: "12px", fontWeight: 500, cursor: occupe ? "wait" : "pointer", opacity: occupe ? 0.6 : 1 }

  return (
    <div>
      <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text, marginBottom: "4px" }}>Mes données</div>
      <p style={{ fontSize: "11px", color: colors.textMuted, margin: "0 0 8px", lineHeight: 1.5 }}>
        Télécharge tout ce que tu as enregistré (notes, cours, corrections) dans un fichier, ou importe un fichier de fiches.
      </p>
      <div style={{ display: "flex", gap: "6px" }}>
        <button onClick={exporter} disabled={occupe} style={bouton}>Télécharger mes données</button>
        <button onClick={() => fileRef.current?.click()} disabled={occupe} style={bouton}>Importer un fichier</button>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importer(f) }} />
      </div>
    </div>
  )
}
