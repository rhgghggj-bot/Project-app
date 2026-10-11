"use client"
import { useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast, confirmer } from "@/lib/toast"
import { useChargement } from "@/lib/useChargement"
import { useMaintenant } from "@/lib/useMaintenant"
import { colors, radius } from "@/app/components/ui/tokens"
import { SYSTEMES, formaterNote, moyennePonderee, type Echelle, type Pays } from "@/lib/etudes"
import { chapitresDeMatiere, chargerProgramme, type Programme } from "@/lib/programmes"

export type NoteEtudiant = {
  id: string
  matiere: string
  titre: string | null
  note: number
  echelle: Echelle
  coefficient: number
  date: string
  chapitre_id: string | null
}

const PALETTE = ["#2B7FFF", "#D97706", "#16A34A", "#DB2777", "#7C3AED", "#0D9488", "#E11D48", "#CA8A04", "#0EA5E9", "#64748B"]

const champ: React.CSSProperties = { width: "100%", border: `0.5px solid ${colors.blueBorder}`, borderRadius: radius.sm, padding: "9px 10px", fontSize: "13px", color: colors.text, background: "#fff" }
const etiquette: React.CSSProperties = { fontSize: "11px", color: colors.textMuted, display: "block", marginBottom: "4px" }

function aujourdhuiISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function NotesSection({ userId, pays, matieresProposees, niveauId, filiere, onOuvrirChapitre }: {
  userId: string
  pays: Pays
  matieresProposees: string[]
  niveauId: string | null
  filiere: string | null
  onOuvrirChapitre: (id: string) => void
}) {
  const systeme = SYSTEMES[pays]
  const [notes, setNotes] = useState<NoteEtudiant[] | null>(null)
  const [programme, setProgramme] = useState<Programme | null>(null)
  const [filtre, setFiltre] = useState<string>("Toutes")
  const [vue, setVue] = useState<"graphique" | "tableau">("graphique")
  const [ouvert, setOuvert] = useState(false)
  const [historiqueComplet, setHistoriqueComplet] = useState(false)
  const [form, setForm] = useState({ matiere: "", chapitre: "", titre: "", note: "", coefficient: "1", date: aujourdhuiISO() })
  const [envoi, setEnvoi] = useState(false)

  async function charger() {
    const { data } = await supabase.from("notes_etudiant").select("id,matiere,titre,note,echelle,coefficient,date,chapitre_id")
      .eq("user_id", userId).order("date", { ascending: true })
    setNotes((data || []).map(n => ({ ...n, note: Number(n.note), coefficient: Number(n.coefficient) })))
  }
  useChargement(charger, userId)
  useChargement(async () => { setProgramme(niveauId ? await chargerProgramme(pays, niveauId) : null) }, `${pays}-${niveauId}`)

  // Seules les notes de l'échelle du pays choisi sont comparables entre elles.
  const notesEchelle = useMemo(() => (notes || []).filter(n => n.echelle === systeme.echelle), [notes, systeme.echelle])
  const autresEchelles = (notes?.length || 0) - notesEchelle.length
  const matieres = useMemo(() => [...new Set(notesEchelle.map(n => n.matiere))].sort((a, b) => a.localeCompare(b, "fr")), [notesEchelle])
  const couleurDe = (m: string) => PALETTE[Math.max(0, matieres.indexOf(m)) % PALETTE.length]
  const visibles = filtre === "Toutes" ? notesEchelle : notesEchelle.filter(n => n.matiere === filtre)
  const moyenneGenerale = moyennePonderee(visibles)
  const titreChapitre = (id: string | null) => (id && programme?.chapitres.find(c => c.id === id)?.titre) || null
  const chapitresForm = programme && form.matiere ? chapitresDeMatiere(programme, form.matiere.trim(), filiere) : []
  // Matières du programme (toutes années) en plus de celles du niveau
  const propositions = [...new Set([
    ...(programme ? programme.chapitres.filter(c => c.filiere === null || c.filiere === filiere).map(c => c.matiere) : []),
    ...matieresProposees,
  ])]

  async function ajouter(e: React.FormEvent) {
    e.preventDefault()
    const valeur = Number(form.note.replace(",", "."))
    const coef = Number(form.coefficient.replace(",", "."))
    if (!form.matiere.trim()) return toast("Indique la matière", "error")
    if (!Number.isFinite(valeur) || valeur < systeme.min || valeur > systeme.max) return toast(`La note doit être entre ${systeme.min} et ${systeme.max}`, "error")
    if (!Number.isFinite(coef) || coef <= 0) return toast("Le coefficient doit être positif", "error")
    setEnvoi(true)
    const { error } = await supabase.from("notes_etudiant").insert({
      user_id: userId, matiere: form.matiere.trim(), titre: form.titre.trim() || null, chapitre_id: form.chapitre || null,
      note: valeur, echelle: systeme.echelle, coefficient: coef, date: form.date,
    })
    setEnvoi(false)
    if (error) return toast("Impossible d'enregistrer la note", "error")
    toast("Note ajoutée", "success")
    setForm(f => ({ ...f, chapitre: "", titre: "", note: "" }))
    setOuvert(false)
    charger()
  }

  async function supprimer(id: string) {
    if (!(await confirmer("Supprimer cette note ?", "Supprimer"))) return
    const { error } = await supabase.from("notes_etudiant").delete().eq("id", id)
    if (error) return toast("Suppression impossible", "error")
    setNotes(ns => (ns || []).filter(n => n.id !== id))
  }

  if (notes === null) return <div className="nx-skel" style={{ height: 220, borderRadius: radius.md }} />

  const historique = [...visibles].reverse()
  const historiqueAffiche = historiqueComplet ? historique : historique.slice(0, 3)

  return (
    <div>
      {/* Résumé */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <Stat label={filtre === "Toutes" ? "Moyenne générale" : `Moyenne · ${filtre}`}
          valeur={moyenneGenerale === null ? "–" : formaterNote(arrondi(moyenneGenerale), systeme.echelle)}
          couleur={moyenneGenerale === null ? colors.textFaint : moyenneGenerale >= systeme.suffisant ? colors.green : colors.red} />
        <Stat label="Notes" valeur={String(visibles.length)} couleur={colors.blue} />
        <Stat label="Insuffisantes" valeur={String(visibles.filter(n => n.note < systeme.suffisant).length)} couleur={colors.red} />
      </div>

      {matieres.length > 0 && (
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "8px" }}>
          {["Toutes", ...matieres].map(m => (
            <button key={m} onClick={() => setFiltre(m)} aria-pressed={filtre === m}
              style={{ whiteSpace: "nowrap", padding: "6px 12px", borderRadius: radius.pill, border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500,
                background: filtre === m ? colors.blue : colors.blueLight, color: filtre === m ? "#fff" : colors.blue }}>
              {m}
            </button>
          ))}
        </div>
      )}

      {/* Graphique ou tableau, au même endroit */}
      {notesEchelle.length > 0 && (
        <div role="tablist" aria-label="Affichage" style={{ display: "flex", gap: "2px", background: colors.blueLight, borderRadius: radius.pill, padding: "3px", marginBottom: "8px", width: "fit-content" }}>
          {(["graphique", "tableau"] as const).map(v => (
            <button key={v} role="tab" aria-selected={vue === v} onClick={() => setVue(v)}
              style={{ border: "none", borderRadius: radius.pill, padding: "5px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                background: vue === v ? "#fff" : "transparent", color: vue === v ? colors.blue : colors.textMuted }}>
              {v === "graphique" ? "Graphique" : "Tableau"}
            </button>
          ))}
        </div>
      )}
      {vue === "graphique" || notesEchelle.length === 0 ? (
        <Graphique key={filtre} notes={visibles} pays={pays} titre={filtre === "Toutes" ? "Ta moyenne générale" : `Ta moyenne en ${filtre}`} />
      ) : (
        <TableauNotes notes={visibles} pays={pays} parMatiere={filtre === "Toutes"} couleurDe={couleurDe}
          titreChapitre={titreChapitre} onChoisirMatiere={setFiltre} />
      )}

      {/* Historique replié + ajout */}
      <div style={{ background: "#fff", border: `0.5px solid ${colors.border}`, borderRadius: radius.md, padding: "10px 12px", marginTop: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text }}>Historique</div>
          {!ouvert && (
            <button onClick={() => setOuvert(true)}
              style={{ background: colors.blue, color: "#fff", border: "none", borderRadius: radius.pill, padding: "6px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
              + Ajouter une note
            </button>
          )}
        </div>

        {ouvert && (
          <form onSubmit={ajouter} style={{ background: "#F8FBFF", border: `0.5px solid ${colors.border}`, borderRadius: radius.sm, padding: "12px", margin: "10px 0 4px" }}>
            <div style={{ fontSize: "12px", fontWeight: 500, color: colors.text, marginBottom: "8px" }}>Nouvelle note · {systeme.label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <label style={{ gridColumn: "1 / -1" }}><span style={etiquette}>Matière</span>
                <input list="matieres-etudes" value={form.matiere} onChange={e => setForm({ ...form, matiere: e.target.value, chapitre: "" })} style={champ} placeholder="Mathématiques" required />
                <datalist id="matieres-etudes">{[...new Set([...matieres, ...propositions])].map(m => <option key={m} value={m} />)}</datalist>
                {propositions.length > 0 && !form.matiere && (
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
                    {propositions.slice(0, 14).map(m => (
                      <button key={m} type="button" onClick={() => setForm({ ...form, matiere: m, chapitre: "" })}
                        style={{ fontSize: "11px", padding: "4px 9px", borderRadius: radius.pill, border: `0.5px solid ${colors.blueBorder}`, background: "#fff", color: colors.blue, cursor: "pointer" }}>
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </label>
              {chapitresForm.length > 0 && (
                <label style={{ gridColumn: "1 / -1" }}><span style={etiquette}>Chapitre (pour retrouver le cours en un clic)</span>
                  <select value={form.chapitre} onChange={e => setForm({ ...form, chapitre: e.target.value })} style={champ}>
                    <option value="">Aucun chapitre</option>
                    {[...new Set(chapitresForm.map(c => c.annee))].map(a => (
                      <optgroup key={a} label={a}>
                        {chapitresForm.filter(c => c.annee === a).map(c => <option key={c.id} value={c.id}>{c.titre}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </label>
              )}
              <label style={{ gridColumn: "1 / -1" }}><span style={etiquette}>Évaluation (facultatif)</span>
                <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} style={champ} placeholder="Test chapitre 2" />
              </label>
              <label><span style={etiquette}>Note ({systeme.min} à {systeme.max})</span>
                <input inputMode="decimal" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} style={champ} placeholder={pays === "CH" ? "4.5" : "13"} required />
              </label>
              <label><span style={etiquette}>Coefficient</span>
                <input inputMode="decimal" value={form.coefficient} onChange={e => setForm({ ...form, coefficient: e.target.value })} style={champ} />
              </label>
              <label style={{ gridColumn: "1 / -1" }}><span style={etiquette}>Date</span>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={champ} required />
              </label>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button type="button" onClick={() => setOuvert(false)} style={{ flex: 1, background: "#fff", color: colors.textMuted, border: `0.5px solid ${colors.border}`, borderRadius: radius.sm, padding: "9px", fontSize: "13px", cursor: "pointer" }}>Annuler</button>
              <button type="submit" disabled={envoi} style={{ flex: 2, background: colors.blue, color: "#fff", border: "none", borderRadius: radius.sm, padding: "9px", fontSize: "13px", fontWeight: 500, cursor: "pointer", opacity: envoi ? 0.6 : 1 }}>Enregistrer</button>
            </div>
          </form>
        )}

        {historique.length === 0 && !ouvert && (
          <p style={{ fontSize: "12px", color: colors.textFaint, margin: "8px 0 2px" }}>Ajoute ta première note pour voir ton évolution sur l&apos;année.</p>
        )}
        {historiqueAffiche.map(n => {
          const chap = titreChapitre(n.chapitre_id)
          const lien = !!(n.chapitre_id && chap)
          return (
            <div key={n.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 0", borderTop: `0.5px solid ${colors.border}` }}>
              <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 4, background: couleurDe(n.matiere), flexShrink: 0 }} />
              <button onClick={() => lien && onOuvrirChapitre(n.chapitre_id!)} disabled={!lien}
                aria-label={lien ? `Ouvrir le chapitre ${chap}` : undefined}
                style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: "6px", background: "none", border: "none", padding: 0, textAlign: "left", cursor: lien ? "pointer" : "default" }}>
                <span style={{ fontSize: "12px", color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {n.matiere}{(n.titre || chap) ? ` · ${n.titre || chap}` : ""}
                </span>
                {lien && <span style={{ fontSize: "11px", color: colors.blue, flexShrink: 0 }}>cours ›</span>}
              </button>
              <span style={{ fontSize: "11px", color: colors.textFaint, flexShrink: 0 }}>{new Date(n.date + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
              <b style={{ fontSize: "13px", width: "34px", textAlign: "right", flexShrink: 0, color: n.note >= systeme.suffisant ? colors.green : colors.red }}>{formaterNote(n.note, n.echelle)}</b>
              <button onClick={() => supprimer(n.id)} aria-label={`Supprimer la note de ${n.matiere}`} style={{ background: "none", border: "none", color: colors.textFaint, cursor: "pointer", fontSize: "15px", padding: "0 2px" }}>×</button>
            </div>
          )
        })}
        {historique.length > 3 && (
          <button onClick={() => setHistoriqueComplet(!historiqueComplet)}
            style={{ width: "100%", background: "none", border: "none", borderTop: `0.5px solid ${colors.border}`, color: colors.blue, fontSize: "12px", padding: "8px 0 2px", cursor: "pointer" }}>
            {historiqueComplet ? "Réduire" : `Voir tout l'historique (${historique.length})`}
          </button>
        )}
      </div>

      {autresEchelles > 0 && (
        <p style={{ fontSize: "11px", color: colors.textFaint, textAlign: "center", marginTop: "10px" }}>
          {autresEchelles} note{autresEchelles > 1 ? "s" : ""} dans l&apos;autre système de notation {autresEchelles > 1 ? "sont masquées" : "est masquée"}.
        </p>
      )}
    </div>
  )
}

// Tableau des notes. « Toutes » : une ligne par matière, de la plus faible à
// la plus forte, pour voir tout de suite où travailler. Une matière : une
// ligne par note.
function TableauNotes({ notes, pays, parMatiere, couleurDe, titreChapitre, onChoisirMatiere }: {
  notes: NoteEtudiant[]
  pays: Pays
  parMatiere: boolean
  couleurDe: (m: string) => string
  titreChapitre: (id: string | null) => string | null
  onChoisirMatiere: (m: string) => void
}) {
  const s = SYSTEMES[pays]
  const cellule: React.CSSProperties = { padding: "8px 6px", fontSize: "12px", color: colors.text, borderTop: `0.5px solid ${colors.border}`, verticalAlign: "top" }
  const entete: React.CSSProperties = { padding: "0 6px 6px", fontSize: "10px", fontWeight: 500, color: colors.textFaint, textAlign: "left" }
  const couleurNote = (v: number) => (v >= s.suffisant ? "#006300" : "#b42323")
  const generale = moyennePonderee(notes)

  if (parMatiere) {
    const lignes = [...new Set(notes.map(n => n.matiere))]
      .map(m => { const ns = notes.filter(n => n.matiere === m); return { matiere: m, notes: ns, moyenne: moyennePonderee(ns)! } })
      .sort((a, b) => a.moyenne - b.moyenne)
    return (
      <div style={{ background: "#fff", border: `0.5px solid ${colors.border}`, borderRadius: radius.md, padding: "12px 8px 6px" }}>
        <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text, padding: "0 6px 2px" }}>Moyenne par matière</div>
        <div style={{ fontSize: "11px", color: colors.textMuted, padding: "0 6px 8px" }}>De la plus faible à la plus forte : commence par réviser celles du haut.</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={entete}>Matière</th><th style={entete}>Notes</th><th style={{ ...entete, textAlign: "right" }}>Moyenne</th></tr></thead>
          <tbody>
            {lignes.map(l => (
              <tr key={l.matiere}>
                <td style={cellule}>
                  <button onClick={() => onChoisirMatiere(l.matiere)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontSize: "12px", color: colors.text, display: "flex", alignItems: "center", gap: "6px" }}>
                    <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 4, background: couleurDe(l.matiere), flexShrink: 0 }} />{l.matiere}
                  </button>
                  {l.moyenne < s.suffisant && <div style={{ fontSize: "10px", color: "#b42323", marginTop: "2px" }}>✗ à travailler</div>}
                </td>
                <td style={{ ...cellule, color: colors.textMuted }}>{l.notes.map(n => formaterNote(n.note, n.echelle)).join(" · ")}</td>
                <td style={{ ...cellule, textAlign: "right", fontWeight: 600, color: couleurNote(l.moyenne) }}>{formaterNote(arrondi(l.moyenne), s.echelle)}</td>
              </tr>
            ))}
            {generale !== null && (
              <tr>
                <td style={{ ...cellule, fontWeight: 600, borderTop: `1px solid ${colors.text}` }} colSpan={2}>Moyenne générale</td>
                <td style={{ ...cellule, textAlign: "right", fontWeight: 700, borderTop: `1px solid ${colors.text}`, color: couleurNote(generale) }}>{formaterNote(arrondi(generale), s.echelle)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  const lignes = [...notes].sort((a, b) => dateNote(b) - dateNote(a))
  return (
    <div style={{ background: "#fff", border: `0.5px solid ${colors.border}`, borderRadius: radius.md, padding: "12px 8px 6px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><th style={entete}>Date</th><th style={entete}>Évaluation</th><th style={{ ...entete, textAlign: "right" }}>Coef.</th><th style={{ ...entete, textAlign: "right" }}>Note</th></tr></thead>
        <tbody>
          {lignes.map(n => (
            <tr key={n.id}>
              <td style={{ ...cellule, color: colors.textMuted, whiteSpace: "nowrap" }}>{new Date(n.date + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</td>
              <td style={cellule}>{n.titre || titreChapitre(n.chapitre_id) || "–"}</td>
              <td style={{ ...cellule, textAlign: "right", color: colors.textMuted }}>{n.coefficient}</td>
              <td style={{ ...cellule, textAlign: "right", fontWeight: 600, color: couleurNote(n.note) }}>{formaterNote(n.note, n.echelle)}</td>
            </tr>
          ))}
          {generale !== null && (
            <tr>
              <td style={{ ...cellule, fontWeight: 600, borderTop: `1px solid ${colors.text}` }} colSpan={3}>Moyenne</td>
              <td style={{ ...cellule, textAlign: "right", fontWeight: 700, borderTop: `1px solid ${colors.text}`, color: couleurNote(generale) }}>{formaterNote(arrondi(generale), s.echelle)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Stat({ label, valeur, couleur }: { label: string; valeur: string; couleur: string }) {
  return (
    <div style={{ flex: 1, background: "#fff", border: `0.5px solid ${colors.border}`, borderRadius: radius.md, padding: "10px 12px", minWidth: 0 }}>
      <div style={{ fontSize: "10px", color: colors.textFaint, marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ fontSize: "18px", fontWeight: 600, color: couleur }}>{valeur}</div>
    </div>
  )
}

// Évolution de la moyenne : une seule ligne (ta moyenne, recalculée après
// chaque note), les notes elles-mêmes en points gris, et le seuil
// « suffisant » en repère. Une phrase au-dessus dit l'essentiel en clair ;
// toucher un point affiche le détail de la note.
const GRIS = "#898781"
const GRILLE = "#e1e0d9"

function dateNote(n: NoteEtudiant) {
  return new Date(n.date + "T12:00").getTime()
}

function arrondi(v: number) {
  return Math.round(v * 100) / 100
}

function Graphique({ notes, pays, titre }: { notes: NoteEtudiant[]; pays: Pays; titre: string }) {
  const s = SYSTEMES[pays]
  const [choisie, setChoisie] = useState<string | null>(null)
  const [aideOuverte, setAideOuverte] = useState(false)
  const maintenant = useMaintenant(60 * 60_000)

  const triees = [...notes].sort((a, b) => dateNote(a) - dateNote(b))
  if (triees.length === 0) {
    return (
      <div style={{ background: "#fff", border: `0.5px solid ${colors.border}`, borderRadius: radius.md, padding: "20px 14px", textAlign: "center", fontSize: "12px", color: colors.textFaint }}>
        Ajoute ta première note : le graphique montrera comment ta moyenne évolue.
      </div>
    )
  }

  // Moyenne après chaque note (pondérée par les coefficients)
  const points = triees.map((n, i) => ({ note: n, moyenne: moyennePonderee(triees.slice(0, i + 1))! }))
  const finale = points[points.length - 1].moyenne
  const premiere = points[0].moyenne
  const ecart = finale - premiere
  const suffisant = finale >= s.suffisant
  const meilleure = triees.reduce((a, b) => (b.note > a.note ? b : a))

  // Axe du temps : de la première note à aujourd'hui (au moins 3 semaines)
  const L = 340, H = 190, G = 34, D = 40, HAUT = 14, BAS = 26
  const t0 = dateNote(triees[0])
  const t1 = Math.max(maintenant, dateNote(triees[triees.length - 1]), t0 + 21 * 864e5)
  const x = (t: number) => G + ((t - t0) / (t1 - t0)) * (L - G - D)
  const y = (v: number) => HAUT + (1 - (v - s.min) / (s.max - s.min)) * (H - HAUT - BAS)
  const graduations = pays === "CH" ? [1, 2, 3, 4, 5, 6] : [0, 5, 10, 15, 20]
  const nbReperes = 4
  const reperes = Array.from({ length: nbReperes }, (_, i) => t0 + (i / (nbReperes - 1)) * (t1 - t0))
  const court = (t: number) => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "")

  const detail = triees.find(n => n.id === choisie)
  const moyenneApres = detail ? points.find(p => p.note.id === detail.id)!.moyenne : null
  const evolution = Math.abs(ecart) < 0.05
    ? "Elle est stable depuis ta première note"
    : `Elle a ${ecart > 0 ? "monté" : "baissé"} de ${formaterNote(arrondi(Math.abs(ecart)), "CH6")} point${Math.abs(ecart) >= 2 ? "s" : ""} depuis ta première note`

  return (
    <figure style={{ margin: 0, background: "#fff", border: `0.5px solid ${colors.border}`, borderRadius: radius.md, padding: "14px 12px 10px" }}>
      <figcaption style={{ padding: "0 4px 10px" }}>
        <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text, marginBottom: "6px" }}>{titre} au fil de l&apos;année</div>
        <div style={{ fontSize: "13px", color: colors.text, lineHeight: 1.5 }}>
          Ta moyenne est de <b>{formaterNote(arrondi(finale), s.echelle)}</b>{" "}
          <span style={{ color: suffisant ? "#006300" : "#b42323", fontWeight: 600 }}>{suffisant ? "✓ suffisante" : "✗ insuffisante"}</span>
          {" "}(il faut {s.suffisant}{s.echelle === "FR20" ? "/20" : ""}). {triees.length > 1 && <>{evolution}.</>}
        </div>
        {triees.length > 1 && (
          <div style={{ fontSize: "12px", color: colors.textMuted, marginTop: "4px" }}>
            Ta meilleure note : {formaterNote(meilleure.note, meilleure.echelle)} en {meilleure.matiere}.
          </div>
        )}
      </figcaption>

      <svg viewBox={`0 0 ${L} ${H}`} width="100%" role="img"
        aria-label={`Ta moyenne passe de ${formaterNote(arrondi(premiere), s.echelle)} à ${formaterNote(arrondi(finale), s.echelle)} sur ${triees.length} notes. Seuil suffisant : ${s.suffisant}.`}>
        {/* Zone sous le seuil, très légère */}
        <rect x={G} y={y(s.suffisant)} width={L - G - D} height={y(s.min) - y(s.suffisant)} fill="#d03b3b" opacity={0.05} />
        {graduations.map(v => (
          <g key={v}>
            <line x1={G} x2={L - D} y1={y(v)} y2={y(v)} stroke={GRILLE} strokeWidth={1} />
            <text x={G - 6} y={y(v) + 3} fontSize="9" textAnchor="end" fill={GRIS}>{v}</text>
          </g>
        ))}
        {/* Seuil « suffisant » */}
        <line x1={G} x2={L - D} y1={y(s.suffisant)} y2={y(s.suffisant)} stroke="#d03b3b" strokeWidth={1.2} opacity={0.7} />
        <text x={L - D} y={y(s.min) - 4} fontSize="8.5" textAnchor="end" fill="#b42323">zone insuffisante</text>
        {reperes.map((t, i) => (
          <text key={i} x={x(t)} y={H - 8} fontSize="9" textAnchor={i === 0 ? "start" : i === nbReperes - 1 ? "end" : "middle"} fill={GRIS}>{court(t)}</text>
        ))}

        {/* Tes notes : points gris */}
        {triees.map(n => (
          <circle key={n.id} cx={x(dateNote(n))} cy={y(n.note)} r={choisie === n.id ? 5 : 3.5}
            fill={choisie === n.id ? colors.text : "#fff"} stroke={choisie === n.id ? colors.text : GRIS} strokeWidth={1.5} />
        ))}

        {/* Ta moyenne : ligne bleue */}
        {points.length > 1 && (
          <polyline fill="none" stroke="#2a78d6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
            points={points.map(p => `${x(dateNote(p.note))},${y(p.moyenne)}`).join(" ")} />
        )}
        <circle cx={x(dateNote(points[points.length - 1].note))} cy={y(finale)} r={4} fill="#2a78d6" stroke="#fff" strokeWidth={2} />
        <text x={x(dateNote(points[points.length - 1].note)) + 7} y={y(finale) + 3} fontSize="10" fontWeight={600} fill={colors.text}>
          {formaterNote(arrondi(finale), s.echelle)}
        </text>

        {/* Zones de toucher plus grandes que les points */}
        {triees.map(n => (
          <circle key={`zone-${n.id}`} cx={x(dateNote(n))} cy={y(n.note)} r={12} fill="transparent" style={{ cursor: "pointer" }}
            onClick={() => setChoisie(choisie === n.id ? null : n.id)}>
            <title>{`${n.matiere} : ${formaterNote(n.note, n.echelle)}`}</title>
          </circle>
        ))}
      </svg>

      {/* Légende */}
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "11px", color: colors.textMuted, padding: "2px 4px 0" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
          <svg width="18" height="8" aria-hidden="true"><line x1="1" x2="17" y1="4" y2="4" stroke="#2a78d6" strokeWidth="2" strokeLinecap="round" /></svg>
          Ta moyenne
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
          <svg width="10" height="10" aria-hidden="true"><circle cx="5" cy="5" r="3.5" fill="#fff" stroke={GRIS} strokeWidth="1.5" /></svg>
          Une note
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
          <svg width="18" height="8" aria-hidden="true"><line x1="1" x2="17" y1="4" y2="4" stroke="#d03b3b" strokeWidth="1.2" /></svg>
          Limite suffisant ({s.suffisant})
        </span>
      </div>

      {detail ? (
        <div style={{ margin: "10px 4px 0", background: colors.blueLight, borderRadius: radius.sm, padding: "8px 10px", fontSize: "12px", color: colors.text, lineHeight: 1.5 }}>
          <b>{detail.matiere}{detail.titre ? ` · ${detail.titre}` : ""}</b> le {new Date(detail.date + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} :{" "}
          {formaterNote(detail.note, detail.echelle)}{detail.coefficient !== 1 ? ` (coef. ${detail.coefficient})` : ""}. Après cette note, ta moyenne était de {formaterNote(arrondi(moyenneApres!), s.echelle)}.
        </div>
      ) : (
        <div style={{ fontSize: "11px", color: colors.textFaint, padding: "8px 4px 0" }}>Touche un point pour voir le détail de la note.</div>
      )}

      <button onClick={() => setAideOuverte(!aideOuverte)} aria-expanded={aideOuverte}
        style={{ background: "none", border: "none", color: colors.blue, fontSize: "12px", cursor: "pointer", padding: "8px 4px 0" }}>
        {aideOuverte ? "Masquer l'explication" : "Comment lire ce graphique ?"}
      </button>
      {aideOuverte && (
        <div style={{ fontSize: "12px", color: colors.textMuted, lineHeight: 1.55, padding: "6px 4px 0" }}>
          <p style={{ margin: "0 0 6px" }}><b>De gauche à droite</b>, le temps : ta première note à gauche, aujourd&apos;hui à droite. <b>De bas en haut</b>, la note : plus c&apos;est haut, meilleur c&apos;est.</p>
          <p style={{ margin: "0 0 6px" }}><b>Chaque rond gris</b> est une note que tu as ajoutée.</p>
          <p style={{ margin: "0 0 6px" }}><b>La ligne bleue</b> est ta moyenne, recalculée après chaque note. Si elle monte, tu progresses ; si elle descend, tes dernières notes sont plus basses que ta moyenne.</p>
          <p style={{ margin: 0 }}><b>La ligne rouge</b> est la limite du suffisant ({s.suffisant}{s.echelle === "FR20" ? "/20" : ""}). Tant que la ligne bleue reste au-dessus, ta moyenne est suffisante. Choisis une matière au-dessus du graphique pour ne voir qu&apos;elle.</p>
        </div>
      )}
    </figure>
  )
}
