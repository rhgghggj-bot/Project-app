"use client"
import { useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast, confirmer } from "@/lib/toast"
import { colors, radius } from "@/app/components/ui/tokens"
import { FichierSchema, type FichierEtudes } from "@/lib/etudesFichier"


export default function Donnees({ userId, onImporte }: { userId: string; onImporte: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [occupe, setOccupe] = useState(false)

  async function exporter() {
    setOccupe(true)
    const [profil, notes, cours, evaluations] = await Promise.all([
      supabase.from("profils_etudiant").select("pays,niveau,filiere,specialites,entreprise_id,entreprise_perso").eq("user_id", userId).maybeSingle(),
      supabase.from("notes_etudiant").select("matiere,titre,note,echelle,coefficient,date").eq("user_id", userId).order("date"),
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
      donnees.notes?.length ? `${donnees.notes.length} notes` : "",
      donnees.evaluations?.length ? `${donnees.evaluations.length} corrections` : "",
      donnees.profil ? "ton profil" : "",
    ].filter(Boolean).join(", ")
    if (!resume) return toast("Le fichier est vide", "error")
    if (!(await confirmer(`Ajouter ${resume} à ton espace ?`, "Importer"))) return

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
      const { error } = await supabase.from("cours_etudiant").insert(donnees.cours.map(c => ({ ...c, user_id: userId, ia: "claude" })))
      if (error) erreurs.push("cours")
    }
    if (donnees.evaluations?.length) {
      const { error } = await supabase.from("evaluations_corrigees").insert(donnees.evaluations.map(e => ({ ...e, user_id: userId, ia: "claude" })))
      if (error) erreurs.push("corrections")
    }
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
