"use client"
import { useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast, confirmer } from "@/lib/toast"
import { useChargement } from "@/lib/useChargement"
import { colors, radius } from "@/app/components/ui/tokens"
import { SYSTEMES, debutAnneeScolaire, formaterNote, moyennePonderee, type Echelle, type Pays } from "@/lib/etudes"

export type NoteEtudiant = {
  id: string
  matiere: string
  titre: string | null
  note: number
  echelle: Echelle
  coefficient: number
  date: string
}

const PALETTE = ["#2B7FFF", "#D97706", "#16A34A", "#DB2777", "#7C3AED", "#0D9488", "#E11D48", "#CA8A04", "#0EA5E9", "#64748B"]

const champ: React.CSSProperties = { width: "100%", border: `0.5px solid ${colors.blueBorder}`, borderRadius: radius.sm, padding: "9px 10px", fontSize: "13px", color: colors.text, background: "#fff" }
const etiquette: React.CSSProperties = { fontSize: "11px", color: colors.textMuted, display: "block", marginBottom: "4px" }

function aujourdhuiISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export default function NotesSection({ userId, pays, matieresProposees }: { userId: string; pays: Pays; matieresProposees: string[] }) {
  const systeme = SYSTEMES[pays]
  const [notes, setNotes] = useState<NoteEtudiant[] | null>(null)
  const [filtre, setFiltre] = useState<string>("Toutes")
  const [ouvert, setOuvert] = useState(false)
  const [form, setForm] = useState({ matiere: "", titre: "", note: "", coefficient: "1", date: aujourdhuiISO() })
  const [envoi, setEnvoi] = useState(false)

  async function charger() {
    const { data } = await supabase.from("notes_etudiant").select("id,matiere,titre,note,echelle,coefficient,date")
      .eq("user_id", userId).order("date", { ascending: true })
    setNotes((data || []).map(n => ({ ...n, note: Number(n.note), coefficient: Number(n.coefficient) })))
  }
  useChargement(charger, userId)

  // Seules les notes de l'échelle du pays choisi sont comparables entre elles.
  const notesEchelle = useMemo(() => (notes || []).filter(n => n.echelle === systeme.echelle), [notes, systeme.echelle])
  const autresEchelles = (notes?.length || 0) - notesEchelle.length
  const matieres = useMemo(() => [...new Set(notesEchelle.map(n => n.matiere))].sort((a, b) => a.localeCompare(b, "fr")), [notesEchelle])
  const couleurDe = (m: string) => PALETTE[Math.max(0, matieres.indexOf(m)) % PALETTE.length]
  const visibles = filtre === "Toutes" ? notesEchelle : notesEchelle.filter(n => n.matiere === filtre)

  const moyenneGenerale = moyennePonderee(visibles)
  const parMatiere = matieres.map(m => ({ matiere: m, moyenne: moyennePonderee(notesEchelle.filter(n => n.matiere === m))!, nb: notesEchelle.filter(n => n.matiere === m).length }))

  async function ajouter(e: React.FormEvent) {
    e.preventDefault()
    const valeur = Number(form.note.replace(",", "."))
    const coef = Number(form.coefficient.replace(",", "."))
    if (!form.matiere.trim()) return toast("Indique la matière", "error")
    if (!Number.isFinite(valeur) || valeur < systeme.min || valeur > systeme.max) return toast(`La note doit être entre ${systeme.min} et ${systeme.max}`, "error")
    if (!Number.isFinite(coef) || coef <= 0) return toast("Le coefficient doit être positif", "error")
    setEnvoi(true)
    const { error } = await supabase.from("notes_etudiant").insert({
      user_id: userId, matiere: form.matiere.trim(), titre: form.titre.trim() || null,
      note: valeur, echelle: systeme.echelle, coefficient: coef, date: form.date,
    })
    setEnvoi(false)
    if (error) return toast("Impossible d'enregistrer la note", "error")
    toast("Note ajoutée", "success")
    setForm(f => ({ ...f, titre: "", note: "" }))
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

  return (
    <div>
      {/* Résumé */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <Stat label={filtre === "Toutes" ? "Moyenne générale" : `Moyenne · ${filtre}`}
          valeur={moyenneGenerale === null ? "–" : formaterNote(Math.round(moyenneGenerale * 100) / 100, systeme.echelle)}
          couleur={moyenneGenerale === null ? colors.textFaint : moyenneGenerale >= systeme.suffisant ? colors.green : colors.red} />
        <Stat label="Notes" valeur={String(visibles.length)} couleur={colors.blue} />
        <Stat label="Insuffisantes" valeur={String(visibles.filter(n => n.note < systeme.suffisant).length)} couleur={colors.red} />
      </div>

      {matieres.length > 0 && (
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "10px" }}>
          {["Toutes", ...matieres].map(m => (
            <button key={m} onClick={() => setFiltre(m)} aria-pressed={filtre === m}
              style={{ whiteSpace: "nowrap", padding: "6px 12px", borderRadius: radius.pill, border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500,
                background: filtre === m ? colors.blue : colors.blueLight, color: filtre === m ? "#fff" : colors.blue }}>
              {m}
            </button>
          ))}
        </div>
      )}

      <Graphique notes={visibles} pays={pays} couleurDe={couleurDe} />

      {/* Ajout */}
      {!ouvert ? (
        <button onClick={() => setOuvert(true)}
          style={{ width: "100%", background: colors.blue, color: "#fff", border: "none", borderRadius: radius.md, padding: "12px", fontSize: "13px", fontWeight: 500, cursor: "pointer", margin: "12px 0" }}>
          + Ajouter une note
        </button>
      ) : (
        <form onSubmit={ajouter} style={{ background: "#F8FBFF", border: `0.5px solid ${colors.border}`, borderRadius: radius.md, padding: "14px", margin: "12px 0" }}>
          <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text, marginBottom: "10px" }}>Nouvelle note · {systeme.label}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <label style={{ gridColumn: "1 / -1" }}><span style={etiquette}>Matière</span>
              <input list="matieres-etudes" value={form.matiere} onChange={e => setForm({ ...form, matiere: e.target.value })} style={champ} placeholder="Mathématiques" required />
              <datalist id="matieres-etudes">{[...new Set([...matieres, ...matieresProposees])].map(m => <option key={m} value={m} />)}</datalist>
              {matieresProposees.length > 0 && !form.matiere && (
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "6px" }}>
                  {matieresProposees.slice(0, 12).map(m => (
                    <button key={m} type="button" onClick={() => setForm({ ...form, matiere: m })}
                      style={{ fontSize: "11px", padding: "4px 9px", borderRadius: radius.pill, border: `0.5px solid ${colors.blueBorder}`, background: "#fff", color: colors.blue, cursor: "pointer" }}>
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </label>
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
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button type="button" onClick={() => setOuvert(false)} style={{ flex: 1, background: "#fff", color: colors.textMuted, border: `0.5px solid ${colors.border}`, borderRadius: radius.sm, padding: "10px", fontSize: "13px", cursor: "pointer" }}>Annuler</button>
            <button type="submit" disabled={envoi} style={{ flex: 2, background: colors.blue, color: "#fff", border: "none", borderRadius: radius.sm, padding: "10px", fontSize: "13px", fontWeight: 500, cursor: "pointer", opacity: envoi ? 0.6 : 1 }}>Enregistrer</button>
          </div>
        </form>
      )}

      {/* Moyennes par matière */}
      {filtre === "Toutes" && parMatiere.length > 0 && (
        <div style={{ background: "#fff", border: `0.5px solid ${colors.border}`, borderRadius: radius.md, padding: "14px", marginBottom: "12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text, marginBottom: "10px" }}>Moyennes par matière</div>
          {parMatiere.map(m => {
            const part = (m.moyenne - systeme.min) / (systeme.max - systeme.min)
            const seuil = (systeme.suffisant - systeme.min) / (systeme.max - systeme.min)
            return (
              <div key={m.matiere} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                  <span style={{ color: colors.text }}><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: couleurDe(m.matiere), marginRight: 6 }} />{m.matiere} <span style={{ color: colors.textFaint }}>· {m.nb} note{m.nb > 1 ? "s" : ""}</span></span>
                  <b style={{ color: m.moyenne >= systeme.suffisant ? colors.green : colors.red }}>{formaterNote(Math.round(m.moyenne * 100) / 100, systeme.echelle)}</b>
                </div>
                <div style={{ position: "relative", height: 6, background: colors.blueLight, borderRadius: 3 }}>
                  <div style={{ width: `${Math.max(2, part * 100)}%`, height: "100%", borderRadius: 3, background: m.moyenne >= systeme.suffisant ? colors.green : colors.red }} />
                  <div title="Seuil suffisant" style={{ position: "absolute", left: `${seuil * 100}%`, top: -3, width: 2, height: 12, background: colors.text, opacity: 0.35 }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Liste */}
      {visibles.length > 0 && (
        <div style={{ background: "#fff", border: `0.5px solid ${colors.border}`, borderRadius: radius.md, padding: "6px 14px" }}>
          {[...visibles].reverse().map((n, i, arr) => (
            <div key={n.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: i < arr.length - 1 ? `0.5px solid ${colors.border}` : "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: couleurDe(n.matiere), flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.matiere}{n.titre ? ` · ${n.titre}` : ""}</div>
                <div style={{ fontSize: "11px", color: colors.textFaint }}>{new Date(n.date + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}{n.coefficient !== 1 ? ` · coef. ${n.coefficient}` : ""}</div>
              </div>
              <b style={{ fontSize: "15px", color: n.note >= systeme.suffisant ? colors.green : colors.red }}>{formaterNote(n.note, n.echelle)}</b>
              <button onClick={() => supprimer(n.id)} aria-label={`Supprimer la note de ${n.matiere}`} style={{ background: "none", border: "none", color: colors.textFaint, cursor: "pointer", fontSize: "16px", padding: "0 2px" }}>×</button>
            </div>
          ))}
        </div>
      )}

      {notesEchelle.length === 0 && !ouvert && (
        <p style={{ fontSize: "12px", color: colors.textFaint, textAlign: "center", margin: "8px 0" }}>Ajoute ta première note pour voir ton évolution sur l&apos;année.</p>
      )}
      {autresEchelles > 0 && (
        <p style={{ fontSize: "11px", color: colors.textFaint, textAlign: "center", marginTop: "10px" }}>
          {autresEchelles} note{autresEchelles > 1 ? "s" : ""} dans l&apos;autre système de notation {autresEchelles > 1 ? "sont masquées" : "est masquée"}.
        </p>
      )}
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

// Évolution sur l'année scolaire : chaque note est un point, la ligne suit la
// moyenne (pondérée) cumulée au fil des évaluations.
function Graphique({ notes, pays, couleurDe }: { notes: NoteEtudiant[]; pays: Pays; couleurDe: (m: string) => string }) {
  const s = SYSTEMES[pays]
  const L = 340, H = 180, G = 30, D = 10, HAUT = 12, BAS = 24
  const debut = debutAnneeScolaire(pays)
  const fin = new Date(debut.getFullYear() + 1, debut.getMonth() - 1, 31)
  const t0 = debut.getTime(), t1 = fin.getTime()
  const enCours = notes.filter(n => { const t = new Date(n.date + "T12:00").getTime(); return t >= t0 && t <= t1 })

  const x = (t: number) => G + ((t - t0) / (t1 - t0)) * (L - G - D)
  const y = (v: number) => HAUT + (1 - (v - s.min) / (s.max - s.min)) * (H - HAUT - BAS)

  const graduations = pays === "CH" ? [1, 2, 3, 4, 5, 6] : [0, 5, 10, 15, 20]
  const mois: { t: number; label: string }[] = []
  for (let i = 0; i < 12; i += 2) {
    const d = new Date(debut.getFullYear(), debut.getMonth() + i, 1)
    mois.push({ t: d.getTime(), label: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "") })
  }

  const cumul: { t: number; v: number }[] = []
  enCours.forEach((n, i) => {
    const m = moyennePonderee(enCours.slice(0, i + 1))!
    cumul.push({ t: new Date(n.date + "T12:00").getTime(), v: m })
  })

  return (
    <figure style={{ margin: 0, background: "#fff", border: `0.5px solid ${colors.border}`, borderRadius: radius.md, padding: "12px 8px 6px" }}>
      <figcaption style={{ fontSize: "13px", fontWeight: 500, color: colors.text, padding: "0 6px 6px" }}>
        Évolution {debut.getFullYear()}–{debut.getFullYear() + 1}
      </figcaption>
      <svg viewBox={`0 0 ${L} ${H}`} width="100%" role="img" aria-label={`Graphique de ${enCours.length} notes sur l'année scolaire`}>
        {graduations.map(v => (
          <g key={v}>
            <line x1={G} x2={L - D} y1={y(v)} y2={y(v)} stroke={colors.border} strokeWidth={1} />
            <text x={G - 6} y={y(v) + 3} fontSize="9" textAnchor="end" fill={colors.textFaint}>{v}</text>
          </g>
        ))}
        <line x1={G} x2={L - D} y1={y(s.suffisant)} y2={y(s.suffisant)} stroke={colors.red} strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
        <text x={L - D} y={y(s.suffisant) - 3} fontSize="8" textAnchor="end" fill={colors.red} opacity={0.8}>suffisant</text>
        {mois.map(m => <text key={m.t} x={x(m.t)} y={H - 8} fontSize="9" textAnchor="middle" fill={colors.textFaint}>{m.label}</text>)}
        {cumul.length > 1 && (
          <polyline fill="none" stroke={colors.blue} strokeWidth={2} strokeLinejoin="round" points={cumul.map(c => `${x(c.t)},${y(c.v)}`).join(" ")} />
        )}
        {enCours.map(n => (
          <circle key={n.id} cx={x(new Date(n.date + "T12:00").getTime())} cy={y(n.note)} r={4} fill={couleurDe(n.matiere)} stroke="#fff" strokeWidth={1.5}>
            <title>{`${n.matiere}${n.titre ? " · " + n.titre : ""} : ${formaterNote(n.note, n.echelle)}`}</title>
          </circle>
        ))}
        {enCours.length === 0 && <text x={L / 2} y={H / 2} fontSize="11" textAnchor="middle" fill={colors.textFaint}>Pas encore de note cette année</text>}
      </svg>
      <div style={{ fontSize: "10px", color: colors.textFaint, padding: "0 6px" }}>Points : chaque note · Ligne bleue : ta moyenne au fil de l&apos;année</div>
    </figure>
  )
}
