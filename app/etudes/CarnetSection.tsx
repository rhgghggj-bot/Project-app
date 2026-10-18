"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast, confirmer } from "@/lib/toast"
import { useChargement } from "@/lib/useChargement"
import { colors, radius } from "@/app/components/ui/tokens"
import { chapitreVisible, chargerProgramme } from "@/lib/programmes"
import { chargerFichesPerso } from "@/lib/fichesPerso"
import { COLONNES_NOTE, dateCourte, normaliser, type Dossier, type NoteCarnet } from "@/lib/carnet"
import EditeurNote, { type ContexteProgramme } from "./EditeurNote"
import DocumentsSection from "./DocumentsSection"
import { BLEU_TEXTE, FOND_CAHIER, ROUGE_TEXTE, TEXTE_DOUX } from "./cahier"

// Onglet « Carnet » : toutes les notes de l'élève, rangées par dossier, avec
// recherche dans les titres et le texte. Les notes épinglées restent en haut.


export type ActionCarnet = { type: "nouvelle"; chapitreId: string } | { type: "ouvrir"; noteId: string }

type Filtre = "toutes" | "sans" | string

export default function CarnetSection({ userId, contexte, action, onActionTraitee, onOuvrirChapitre }: {
  userId: string
  contexte: ContexteProgramme
  action: ActionCarnet | null
  onActionTraitee: () => void
  onOuvrirChapitre: (id: string) => void
}) {
  const [notes, setNotes] = useState<NoteCarnet[] | null>(null)
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [erreur, setErreur] = useState<string | null>(null)
  const [filtre, setFiltre] = useState<Filtre>("toutes")
  const [recherche, setRecherche] = useState("")
  const [ouverte, setOuverte] = useState<{ note: NoteCarnet; nouvelle: boolean } | null>(null)
  const [nomDossier, setNomDossier] = useState<string | null>(null)
  const [renommer, setRenommer] = useState<string | null>(null)
  const [chapitres, setChapitres] = useState<Map<string, { matiere: string; titre: string }>>(new Map())
  const [vue, setVue] = useState<"notes" | "documents">("notes")

  async function charger() {
    const [n, d] = await Promise.all([
      supabase.from("carnet_notes").select(COLONNES_NOTE).eq("user_id", userId).order("updated_at", { ascending: false }),
      supabase.from("carnet_dossiers").select("id,nom").eq("user_id", userId).order("nom"),
    ])
    if (n.error || d.error) {
      const absent = [n.error, d.error].some(e => e?.code === "42P01" || e?.code === "PGRST205")
      setErreur(absent ? "Le carnet n'est pas encore activé sur la base de données. Il faut exécuter le fichier SQL du carnet dans Supabase." : "Impossible de charger le carnet. Vérifie ta connexion puis réessaie.")
      setNotes([])
      return
    }
    setErreur(null)
    setNotes((n.data || []) as NoteCarnet[])
    setDossiers((d.data || []) as Dossier[])
  }
  useChargement(charger, userId)

  // Titres des chapitres et fiches reliés, pour les afficher dans la liste
  useEffect(() => {
    let actif = true
    Promise.all([
      chargerFichesPerso(userId),
      contexte.niveauId ? chargerProgramme(contexte.pays, contexte.niveauId) : Promise.resolve(null),
    ]).then(([perso, prog]) => {
      if (!actif) return
      const m = new Map<string, { matiere: string; titre: string }>()
      for (const c of prog?.chapitres.filter(c => chapitreVisible(c, contexte.filiere, contexte.specialites)) || []) m.set(c.id, c)
      for (const f of perso) m.set(f.id, f)
      setChapitres(m)
    })
    return () => { actif = false }
  }, [userId, contexte.pays, contexte.niveauId, contexte.filiere, contexte.specialites])

  function nouvelleNote(chapitreId: string | null = null): NoteCarnet {
    const maintenant = new Date().toISOString()
    return {
      id: crypto.randomUUID(), titre: "", contenu: "", texte: "", epingle: false, chapitre_id: chapitreId,
      dossier_id: filtre !== "toutes" && filtre !== "sans" ? filtre : null, created_at: maintenant, updated_at: maintenant,
    }
  }

  // Demande venue de « Réviser » : écrire sur un chapitre ou ouvrir une note
  useEffect(() => {
    if (!action || notes === null) return
    let actif = true
    queueMicrotask(() => {
      if (!actif) return
      onActionTraitee()
      if (erreur) return
      if (action.type === "nouvelle") setOuverte({ note: nouvelleNote(action.chapitreId), nouvelle: true })
      else {
        const n = notes.find(x => x.id === action.noteId)
        if (n) setOuverte({ note: n, nouvelle: false })
        else toast("Cette note n'existe plus", "error")
      }
    })
    return () => { actif = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, notes])

  async function creerDossier() {
    const nom = (nomDossier || "").trim()
    if (!nom) { setNomDossier(null); return }
    const { data, error } = await supabase.from("carnet_dossiers").insert({ user_id: userId, nom: nom.slice(0, 60) }).select("id,nom").single()
    if (error || !data) return toast("Dossier non créé", "error")
    setDossiers(ds => [...ds, data as Dossier].sort((a, b) => a.nom.localeCompare(b.nom)))
    setFiltre(data.id)
    setNomDossier(null)
  }

  async function renommerDossier(id: string) {
    const nom = (renommer || "").trim()
    setRenommer(null)
    if (!nom) return
    const { error } = await supabase.from("carnet_dossiers").update({ nom: nom.slice(0, 60) }).eq("id", id)
    if (error) return toast("Dossier non renommé", "error")
    setDossiers(ds => ds.map(d => (d.id === id ? { ...d, nom } : d)))
  }

  async function supprimerDossier(d: Dossier) {
    const n = (notes || []).filter(x => x.dossier_id === d.id).length
    if (!(await confirmer(`Supprimer le dossier « ${d.nom} » ? ${n ? `Ses ${n} note${n > 1 ? "s" : ""} restent dans le carnet, sans dossier.` : ""}`, "Supprimer"))) return
    const { error } = await supabase.from("carnet_dossiers").delete().eq("id", d.id)
    if (error) return toast("Dossier non supprimé", "error")
    setDossiers(ds => ds.filter(x => x.id !== d.id))
    setNotes(ns => (ns || []).map(x => (x.dossier_id === d.id ? { ...x, dossier_id: null } : x)))
    setFiltre("toutes")
  }

  if (ouverte) {
    return (
      <EditeurNote userId={userId} note={ouverte.note} nouvelle={ouverte.nouvelle} dossiers={dossiers} contexte={contexte}
        onOuvrirChapitre={id => { setOuverte(null); onOuvrirChapitre(id) }}
        onFermer={({ note, supprimee }) => {
          const id = ouverte.note.id
          setOuverte(null)
          // Le focus revient sur la note qu'on vient de quitter
          setTimeout(() => document.querySelector<HTMLElement>(`[data-note="${id}"]`)?.focus(), 50)
          setNotes(ns => {
            const reste = (ns || []).filter(x => x.id !== id)
            return note && !supprimee ? [note, ...reste].sort((a, b) => b.updated_at.localeCompare(a.updated_at)) : reste
          })
        }} />
    )
  }

  const mots = normaliser(recherche).split(/\s+/).filter(Boolean)
  const visibles = (notes || [])
    .filter(n => filtre === "toutes" || (filtre === "sans" ? !n.dossier_id : n.dossier_id === filtre))
    .filter(n => mots.every(m => normaliser(`${n.titre} ${n.texte}`).includes(m)))
  const epinglees = visibles.filter(n => n.epingle)
  const autres = visibles.filter(n => !n.epingle)
  const dossierActif = dossiers.find(d => d.id === filtre)
  const nomDe = (id: string | null) => dossiers.find(d => d.id === id)?.nom
  const compte = (f: Filtre) => (notes || []).filter(n => f === "toutes" || (f === "sans" ? !n.dossier_id : n.dossier_id === f)).length

  const puce = (actif: boolean): React.CSSProperties => ({
    flexShrink: 0, border: `1px solid ${actif ? colors.navy : colors.blueBorder}`, background: actif ? colors.navy : "#fff",
    color: actif ? "#fff" : colors.text, borderRadius: radius.pill, padding: "6px 12px", fontSize: "12.5px", cursor: "pointer", whiteSpace: "nowrap", minHeight: 36,
  })

  const ligne = (n: NoteCarnet) => {
    const chap = n.chapitre_id ? chapitres.get(n.chapitre_id) : undefined
    return (
      <li key={n.id} style={{ borderTop: `1px solid ${colors.border}` }}>
        <button data-note={n.id} onClick={() => setOuverte({ note: n, nouvelle: false })}
          style={{ width: "100%", display: "block", textAlign: "left", background: "none", border: "none", padding: "11px 14px", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontSize: "15.5px", fontWeight: 600, color: n.titre ? colors.navy : TEXTE_DOUX, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {n.titre || "Sans titre"}
            </span>
            <span style={{ fontSize: "11.5px", color: TEXTE_DOUX, flexShrink: 0 }}>{dateCourte(n.updated_at)}</span>
          </div>
          <div style={{ fontSize: "13px", color: colors.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
            {n.texte || (n.contenu.includes("<img") ? "Image" : "Pas de texte")}
          </div>
          {(chap || (filtre === "toutes" && nomDe(n.dossier_id))) && (
            <div style={{ display: "flex", gap: "6px", marginTop: 6, flexWrap: "wrap" }}>
              {filtre === "toutes" && nomDe(n.dossier_id) && <span style={{ fontSize: "11px", color: colors.textMuted, background: "#F3F5F9", borderRadius: radius.pill, padding: "2px 8px" }}>{nomDe(n.dossier_id)}</span>}
              {chap && <span style={{ fontSize: "11px", color: colors.blue, background: colors.blueLight, borderRadius: radius.pill, padding: "2px 8px", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chap.matiere} : {chap.titre}</span>}
            </div>
          )}
        </button>
      </li>
    )
  }

  const bascule = (
    <div role="tablist" aria-label="Notes ou documents" style={{ display: "flex", gap: 2, background: "#EEF2F8", borderRadius: 10, padding: 3, marginBottom: 10 }}>
      {(["notes", "documents"] as const).map(v => (
        <button key={v} role="tab" aria-selected={vue === v} onClick={() => setVue(v)}
          style={{ flex: 1, border: "none", borderRadius: 8, padding: "8px 0", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            background: vue === v ? "#fff" : "transparent", color: vue === v ? colors.navy : TEXTE_DOUX, boxShadow: vue === v ? "0 1px 3px rgba(10,22,40,.12)" : "none" }}>
          {v === "notes" ? "Notes" : "Documents"}
        </button>
      ))}
    </div>
  )

  if (vue === "documents") {
    return (
      <div>
        {bascule}
        <DocumentsSection userId={userId} dossiers={dossiers}
          onOuvrirNote={n => { setNotes(ns => [n, ...(ns || []).filter(x => x.id !== n.id)]); setVue("notes"); setOuverte({ note: n, nouvelle: false }) }} />
      </div>
    )
  }

  return (
    <div>
      {bascule}
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <input type="search" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher" aria-label="Rechercher dans mes notes"
          style={{ flex: 1, minWidth: 0, border: `1px solid ${colors.blueBorder}`, borderRadius: radius.pill, padding: "10px 15px", fontSize: "14px", color: colors.text, background: "#fff" }} />
        <button onClick={() => setOuverte({ note: nouvelleNote(), nouvelle: true })} disabled={!!erreur}
          style={{ flexShrink: 0, background: colors.blue, color: "#fff", border: "none", borderRadius: radius.pill, padding: "0 16px", fontSize: "14px", fontWeight: 600, cursor: "pointer", opacity: erreur ? 0.5 : 1 }}>
          Nouvelle note
        </button>
      </div>

      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "10px" }}>
        <div role="group" aria-label="Filtrer par dossier" style={{ display: "contents" }}>
        <button aria-pressed={filtre === "toutes"} style={puce(filtre === "toutes")} onClick={() => setFiltre("toutes")}>Toutes <span style={{ opacity: 0.6 }}>{compte("toutes")}</span></button>
        {dossiers.map(d => (
          <button key={d.id} aria-pressed={filtre === d.id} style={puce(filtre === d.id)} onClick={() => setFiltre(d.id)}>{d.nom} <span style={{ opacity: 0.6 }}>{compte(d.id)}</span></button>
        ))}
        </div>
        {nomDossier === null ? (
          <button style={{ ...puce(false), borderStyle: "dashed", color: BLEU_TEXTE }} onClick={() => setNomDossier("")} disabled={!!erreur}>+ Dossier</button>
        ) : (
          <form onSubmit={e => { e.preventDefault(); void creerDossier() }} style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
            <input autoFocus value={nomDossier} onChange={e => setNomDossier(e.target.value)} onBlur={() => void creerDossier()} maxLength={60}
              onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); setNomDossier(null) } }}
              placeholder="Nom du dossier" aria-label="Nom du nouveau dossier"
              style={{ width: 150, border: `1px solid ${colors.blue}`, borderRadius: radius.pill, padding: "6px 12px", fontSize: "16px" }} />
          </form>
        )}
      </div>

      {dossierActif && (
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "10px", fontSize: "12.5px" }}>
          {renommer === null ? (
            <>
              <button onClick={() => setRenommer(dossierActif.nom)} style={{ background: "none", border: "none", padding: "8px 0", minHeight: 36, color: BLEU_TEXTE, cursor: "pointer" }}>Renommer le dossier</button>
              <button onClick={() => void supprimerDossier(dossierActif)} style={{ background: "none", border: "none", padding: "8px 0", minHeight: 36, color: ROUGE_TEXTE, cursor: "pointer" }}>Supprimer le dossier</button>
            </>
          ) : (
            <form onSubmit={e => { e.preventDefault(); void renommerDossier(dossierActif.id) }}>
              <input autoFocus value={renommer} onChange={e => setRenommer(e.target.value)} onBlur={() => void renommerDossier(dossierActif.id)} maxLength={60}
                onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); setRenommer(null) } }} aria-label="Nouveau nom du dossier"
                style={{ border: `1px solid ${colors.blue}`, borderRadius: radius.pill, padding: "6px 12px", fontSize: "16px", width: 200 }} />
            </form>
          )}
        </div>
      )}

      {erreur && <p role="alert" style={{ fontSize: "13px", color: colors.text, background: colors.redLight, borderRadius: radius.sm, padding: "10px 12px" }}>{erreur}</p>}
      {notes === null && <div className="nx-skel" style={{ height: 180, borderRadius: radius.md }} />}

      {notes !== null && !erreur && visibles.length === 0 && (
        <div style={{ ...FOND_CAHIER, border: `1px solid ${colors.blueBorder}`, borderRadius: radius.md, padding: "28px 20px", textAlign: "center" }}>
          {mots.length ? (
            <p style={{ margin: 0, fontSize: "14px", color: colors.textMuted }}>Aucune note ne contient « {recherche.trim()} ».</p>
          ) : (
            <>
              <p style={{ margin: "0 0 4px", fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600, color: colors.navy }}>{dossierActif ? "Ce dossier est vide" : "Ton carnet est vide"}</p>
              <p style={{ margin: "0 0 14px", fontSize: "13.5px", color: colors.textMuted, lineHeight: 1.5 }}>Prends des notes de cours, fais une liste de choses à réviser, photographie le tableau ou dessine un schéma.</p>
              <button onClick={() => setOuverte({ note: nouvelleNote(), nouvelle: true })}
                style={{ background: colors.blue, color: "#fff", border: "none", borderRadius: radius.pill, padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                Écrire ma première note
              </button>
            </>
          )}
        </div>
      )}

      <p role="status" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {notes !== null && mots.length ? `${visibles.length} note${visibles.length > 1 ? "s" : ""} trouvée${visibles.length > 1 ? "s" : ""}` : ""}
      </p>

      {visibles.length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${colors.blueBorder}`, borderRadius: radius.md, overflow: "hidden" }}>
          {epinglees.length > 0 && (
            <>
              <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: colors.textMuted, padding: "10px 14px 6px", background: "#FBFCFF" }}>Épinglées</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>{epinglees.map(ligne)}</ul>
            </>
          )}
          {autres.length > 0 && epinglees.length > 0 && <h3 style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: colors.textMuted, padding: "10px 14px 6px", background: "#FBFCFF", borderTop: `1px solid ${colors.border}` }}>Autres notes</h3>}
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>{autres.map(ligne)}</ul>
        </div>
      )}
    </div>
  )
}
