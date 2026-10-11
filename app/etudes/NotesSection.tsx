"use client"
import { useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast, confirmer } from "@/lib/toast"
import { useChargement } from "@/lib/useChargement"
import { useMaintenant } from "@/lib/useMaintenant"
import { colors, radius } from "@/app/components/ui/tokens"
import { SYSTEMES, formaterNote, moyennePonderee, type Echelle, type Pays } from "@/lib/etudes"

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

      <Graphique key={filtre} notes={visibles} pays={pays} titre={filtre === "Toutes" ? "Ta moyenne générale" : `Ta moyenne en ${filtre}`} />

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
