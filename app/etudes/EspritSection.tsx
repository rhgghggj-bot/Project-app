"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { colors, radius } from "@/app/components/ui/tokens"
import { toast } from "@/lib/toast"
import { ecrireNombre, ouvrirCalculatrice } from "@/lib/calcul"
import { LEGAL } from "@/lib/legal"
import {
  AFFIRMATIONS, DEFIS_FERMI, ETAT_ESPRIT_VIDE, EXERCICES_MANIP, LECONS_PROBA, NIVEAUX_CONFIANCE, TECHNIQUES,
  chargerEsprit, enregistrerEsprit, lireNombre, type Affirmation, type DefiFermi, type EtatEsprit,
} from "@/lib/esprit"
import {
  CHRONO, JEU_VIDE, NOMBRE_QUESTIONS, bilanCalib, bonusSerie, finirPartie, graine, jourISO, melanger, niveau, pointsCalib, pointsFermi, pointsManip,
  serieJours, tirer, tirerDuJour, type EtatJeu, type ModeJeu,
} from "@/lib/espritJeu"

// « Entraîne ton esprit » en mode jeu : parties courtes tirées au hasard,
// chrono, points, séries, records, niveaux et défi du jour (le même pour tout
// le monde, pour se comparer entre amis). Une partie finie laisse place à la
// suivante : rien ne reste affiché.

type Exercice = (typeof EXERCICES_MANIP)[number]
type Question =
  | { type: "fermi"; id: string; d: DefiFermi }
  | { type: "proba"; id: string; a: Affirmation }
  | { type: "manip"; id: string; e: Exercice; options: string[] }

const MODES: { id: Exclude<ModeJeu, "jour">; emoji: string; nom: string; desc: string }[] = [
  { id: "fermi", emoji: "🎯", nom: "Estimer (Fermi)", desc: "Trouve un ordre de grandeur sans chercher sur internet, en découpant le problème." },
  { id: "proba", emoji: "🎲", nom: "Penser en probabilités", desc: "Vrai ou faux, et à quel point tu es sûr : être trop sûr de toi coûte cher." },
  { id: "manip", emoji: "🕵️", nom: "Repérer la manipulation", desc: "Reconnais vite la technique des faux voyants, arnaqueurs et vendeurs." },
]
const NOM_MODE: Record<ModeJeu, string> = { fermi: "Fermi", proba: "Probabilités", manip: "Manipulation", jour: "Défi du jour" }
const EMOJI_MODE: Record<ModeJeu, string> = { fermi: "🎯", proba: "🎲", manip: "🕵️", jour: "📅" }

const nf = (n: number) => n.toLocaleString("fr-CH", { maximumFractionDigits: n < 100 ? 1 : 0 })
const carte: React.CSSProperties = { background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: 16, marginBottom: 12 }
const boutonPrincipal: React.CSSProperties = { minHeight: 44, padding: "0 18px", borderRadius: 999, border: "none", background: colors.blue, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer" }
const boutonSecondaire: React.CSSProperties = { minHeight: 44, padding: "0 16px", borderRadius: 999, border: `1px solid ${colors.border}`, background: "#fff", color: colors.text, fontSize: 14, cursor: "pointer" }
const nomTech = (id: string) => TECHNIQUES.find(t => t.id === id)?.nom ?? id

function optionsManip(e: Exercice, hasard: () => number = Math.random) {
  const autres = melanger(TECHNIQUES.map(t => t.id).filter(id => id !== e.bonne), hasard).slice(0, 3)
  return melanger([e.bonne, ...autres], hasard)
}

function construire(mode: ModeJeu, vus: Record<string, number>): Question[] {
  const f = (d: DefiFermi): Question => ({ type: "fermi", id: d.id, d })
  const p = (a: Affirmation): Question => ({ type: "proba", id: a.id, a })
  if (mode === "jour") {
    const h = graine("options" + jourISO())
    return [
      ...tirerDuJour(AFFIRMATIONS, 5, "proba").map(p),
      ...tirerDuJour(EXERCICES_MANIP, 4, "manip").map(e => ({ type: "manip" as const, id: e.id, e, options: optionsManip(e, h) })),
      ...tirerDuJour(DEFIS_FERMI, 1, "fermi").map(f),
    ]
  }
  if (mode === "fermi") return tirer(DEFIS_FERMI, vus, NOMBRE_QUESTIONS.fermi).map(f)
  if (mode === "proba") return tirer(AFFIRMATIONS, vus, NOMBRE_QUESTIONS.proba).map(p)
  return tirer(EXERCICES_MANIP, vus, NOMBRE_QUESTIONS.manip).map(e => ({ type: "manip", id: e.id, e, options: optionsManip(e) }))
}

// Partager un score (WhatsApp, SMS… via le menu de partage du téléphone, sinon copie)
async function partager(texte: string) {
  const message = `${texte}\n${LEGAL.site}`
  try {
    if (navigator.share) { await navigator.share({ text: message }); return }
    await navigator.clipboard.writeText(message)
    toast("Score copié : colle-le dans un message", "success")
  } catch { /* partage annulé */ }
}
const texteScore = (mode: ModeJeu, score: number, justes: number, total: number) =>
  `🧠 Nexia · ${NOM_MODE[mode]}${mode === "jour" ? ` du ${new Date().toLocaleDateString("fr-CH")}` : ""} : ${score} points (${justes}/${total} bonnes réponses). Tu fais mieux ?`

// Mode zen : pas de chrono, et la partie ne compte pas pour les records
function lireZen() { try { return localStorage.getItem("esprit-zen") === "1" } catch { return false } }

type Ecran = { type: "accueil" } | { type: "jeu"; mode: ModeJeu; cle: number } | { type: "apprendre"; quoi: "lecons" | "techniques" | "forer" | "bilan" }

export default function EspritSection({ userId }: { userId: string }) {
  const [etat, setEtat] = useState<EtatEsprit | null>(null)
  const [ecran, setEcran] = useState<Ecran>({ type: "accueil" })
  const [zen, setZen] = useState(lireZen)
  const basculerZen = () => setZen(z => { try { localStorage.setItem("esprit-zen", z ? "0" : "1") } catch { /* réglage non gardé */ } return !z })
  const etatRef = useRef<EtatEsprit>(ETAT_ESPRIT_VIDE)

  useEffect(() => {
    let actif = true
    chargerEsprit(userId).then(e => { if (actif) { etatRef.current = e; setEtat(e) } })
    return () => { actif = false }
  }, [userId])

  const majJeu = useCallback((jeu: EtatJeu) => {
    const e = { ...etatRef.current, jeu }
    etatRef.current = e
    setEtat(e)
    void enregistrerEsprit(userId, e).then(ok => { if (!ok && navigator.onLine) toast("Score pas enregistré, vérifie ta connexion", "error") })
  }, [userId])

  useEffect(() => { window.scrollTo({ top: 0 }) }, [ecran.type])

  if (!etat) return <div className="nx-skel" style={{ height: 240, borderRadius: radius.md }} />
  const jeu = etat.jeu ?? JEU_VIDE

  if (ecran.type === "jeu") return (
    <Jeu key={ecran.cle} mode={ecran.mode} zen={zen && ecran.mode !== "jour"} jeu={jeu} onFin={majJeu}
      onRejouer={() => setEcran({ type: "jeu", mode: ecran.mode, cle: Date.now() })} onQuitter={() => setEcran({ type: "accueil" })} />
  )
  if (ecran.type === "apprendre") return <Apprendre quoi={ecran.quoi} jeu={jeu} retour={() => setEcran({ type: "accueil" })} />
  return <Accueil jeu={jeu} zen={zen} basculerZen={basculerZen} jouer={mode => setEcran({ type: "jeu", mode, cle: Date.now() })} apprendre={quoi => setEcran({ type: "apprendre", quoi })} />
}

// ─── Accueil : niveau, défi du jour, modes, dernières parties ───
function Accueil({ jeu, zen, basculerZen, jouer, apprendre }: { jeu: EtatJeu; zen: boolean; basculerZen: () => void; jouer: (m: ModeJeu) => void; apprendre: (q: "lecons" | "techniques" | "forer" | "bilan") => void }) {
  const nv = niveau(jeu.xp)
  const serie = serieJours(jeu.jours)
  const jourFait = jeu.duJour?.date === jourISO()
  const dernieres = [...jeu.parties].reverse().slice(0, 8)
  return (
    <div>
      <section data-sans-inversion style={{ borderRadius: radius.md, padding: "16px 18px", background: "linear-gradient(135deg, #0A1628, #3B2A6B)", color: "#fff", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>Entraîne ton esprit</div>
            <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.8)", marginTop: 2 }}>Niveau {nv.n} · <b>{nv.nom}</b></div>
          </div>
          <div style={{ textAlign: "right", fontSize: 13, lineHeight: 1.4 }}>
            <div title="Jours d'affilée"><span aria-hidden="true">🔥</span> <b style={{ fontSize: 18, fontVariantNumeric: "tabular-nums" }}>{serie}</b> jour{serie > 1 ? "s" : ""}</div>
            <div style={{ color: "rgba(255,255,255,.7)" }}>{jeu.parties.length} partie{jeu.parties.length > 1 ? "s" : ""}</div>
          </div>
        </div>
        <div role="progressbar" aria-label="Expérience" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(nv.progres * 100)} style={{ height: 8, background: "rgba(255,255,255,.18)", borderRadius: 999, marginTop: 12, overflow: "hidden" }}>
          <div style={{ width: `${nv.progres * 100}%`, height: "100%", background: "linear-gradient(90deg, #F2C94C, #F2994A)", borderRadius: 999 }} />
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{nf(jeu.xp)} XP · encore {nf(nv.reste)} XP pour le niveau {nv.n + 1}</div>
      </section>

      <section style={{ ...carte, borderColor: jourFait ? colors.border : "#F2C94C", background: jourFait ? "#fff" : "#FFFBEB" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>📅 Défi du jour</div>
            <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 1.45 }}>
              {jourFait ? <>Fait : <b style={{ color: colors.text }}>{jeu.duJour!.score} points</b>. Nouveau défi demain ! Les mêmes questions pour tout le monde : compare ton score avec tes amis.</>
                : "10 questions mélangées, les mêmes pour tout le monde aujourd'hui. Seul ton premier essai compte : compare ton score avec tes amis."}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {jourFait && <button className="presse" onClick={() => partager(`📅 Défi du jour Nexia du ${new Date().toLocaleDateString("fr-CH")} : ${jeu.duJour!.score} points. Tu fais mieux ?`)} style={{ ...boutonPrincipal, background: "#B7791F" }}>📤 Partager</button>}
            <button className="presse" onClick={() => jouer("jour")} style={jourFait ? boutonSecondaire : { ...boutonPrincipal, background: "#B7791F" }}>{jourFait ? "Rejouer pour s'entraîner" : "Relever le défi"}</button>
          </div>
        </div>
      </section>

      <label style={{ ...carte, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px 16px" }}>
        <input type="checkbox" checked={zen} onChange={basculerZen} style={{ width: 22, height: 22, accentColor: colors.blue, flexShrink: 0 }} />
        <span style={{ flex: 1 }}>
          <b style={{ fontSize: 14.5 }}>🧘 Mode zen</b>
          <span style={{ display: "block", fontSize: 12.5, color: colors.textMuted, lineHeight: 1.4 }}>Pas de chrono, pour t&apos;entraîner tranquillement. Les parties zen ne comptent pas pour les records (le défi du jour garde toujours son chrono).</span>
        </span>
      </label>

      {MODES.map(m => (
        <section key={m.id} style={{ ...carte, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div aria-hidden="true" style={{ fontSize: 28 }}>{m.emoji}</div>
          <div style={{ flex: "1 1 180px", minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15.5 }}>{m.nom}</div>
            <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.4, margin: "2px 0 4px", textWrap: "pretty" }}>{m.desc}</div>
            <div style={{ fontSize: 12.5, color: colors.textMuted }}>{NOMBRE_QUESTIONS[m.id]} questions · {CHRONO[m.id]} s chacune · 🏆 record : <b style={{ color: colors.text, fontVariantNumeric: "tabular-nums" }}>{jeu.records[m.id] ?? "—"}</b></div>
          </div>
          <button className="presse" onClick={() => jouer(m.id)} style={boutonPrincipal}>Jouer</button>
        </section>
      ))}

      {dernieres.length > 0 && (
        <section style={carte}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Mes dernières parties</div>
          {dernieres.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, margin: "6px 0" }}>
              <span style={{ width: 120, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><span aria-hidden="true">{EMOJI_MODE[p.mode]} </span>{NOM_MODE[p.mode]}</span>
              <span style={{ flex: 1, height: 10, background: "#EEF1F5", borderRadius: 999, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${Math.min(100, (100 * p.score) / p.max)}%`, background: p.score >= (jeu.records[p.mode] ?? Infinity) ? "#E0A100" : colors.blue, borderRadius: 999 }} /></span>
              <b style={{ width: 44, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{p.score}</b>
            </div>
          ))}
        </section>
      )}

      <div style={{ fontWeight: 700, fontSize: 15, margin: "16px 0 8px" }}>Apprendre</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
        {([["lecons", "🎓", `Les ${LECONS_PROBA.length} idées clés des probabilités`], ["techniques", "🛡️", `Les ${TECHNIQUES.length} techniques de manipulation`], ["forer", "🔮", "L'expérience de Forer"], ["bilan", "📊", "Mon bilan de calibration"]] as const).map(([id, e, n]) => (
          <button key={id} className="presse" onClick={() => apprendre(id)} style={{ ...carte, marginBottom: 0, textAlign: "left", cursor: "pointer", color: colors.text, fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>
            <div aria-hidden="true" style={{ fontSize: 22, marginBottom: 4 }}>{e}</div>{n}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Une partie ───
type Retour = { points: number; juste: boolean; temps: boolean; texte: React.ReactNode }

function Jeu({ mode, zen, jeu, onFin, onRejouer, onQuitter }: { mode: ModeJeu; zen: boolean; jeu: EtatJeu; onFin: (j: EtatJeu) => void; onRejouer: () => void; onQuitter: () => void }) {
  const [questions] = useState(() => construire(mode, jeu.vus))
  const [i, setI] = useState(0)
  const [score, setScore] = useState(0)
  const [serie, setSerie] = useState(0)
  const [justes, setJustes] = useState(0)
  const [debut, setDebut] = useState(() => Date.now())
  const [maintenant, setMaintenant] = useState(() => Date.now())
  const [retour, setRetour] = useState<Retour | null>(null)
  const [erreurs, setErreurs] = useState<{ q: string; r: string }[]>([])
  const [calib, setCalib] = useState<[number, 0 | 1][]>([])
  const [fin, setFin] = useState<{ record: boolean; xp: number; ancien: number; nv: number } | null>(null)
  const q = questions[i]
  const limite = q ? CHRONO[q.type] : 1
  const reste = Math.max(0, limite - (maintenant - debut) / 1000)
  const repondreRef = useRef<(r: Omit<Retour, "temps"> & { temps?: boolean }, c?: [number, 0 | 1]) => void>(() => {})

  function repondre(r: Omit<Retour, "temps"> & { temps?: boolean }, c?: [number, 0 | 1]) {
    if (retour || !q) return
    const nouvelleSerie = r.juste ? serie + 1 : 0
    const points = Math.round(r.points * (r.juste ? bonusSerie(nouvelleSerie) : 1))
    setScore(s => s + points); setSerie(nouvelleSerie); if (r.juste) setJustes(j => j + 1)
    if (c) setCalib(l => [...l, c])
    if (!r.juste) setErreurs(l => [...l, { q: q.type === "fermi" ? q.d.question : q.type === "proba" ? q.a.texte : q.e.phrase, r: q.type === "fermi" ? `Ordre de grandeur : ${nf(q.d.reference)} ${q.d.unite}` : q.type === "proba" ? `${q.a.vrai ? "VRAI" : "FAUX"} : ${q.a.explication}` : `${nomTech(q.e.bonne)} : ${q.e.explication}` }])
    setRetour({ ...r, points, temps: !!r.temps })
  }
  useEffect(() => { repondreRef.current = repondre })

  // Chrono : à zéro, la question est perdue
  useEffect(() => {
    if (retour || fin || zen) return
    const t = setInterval(() => {
      const n = Date.now()
      setMaintenant(n)
      if (n - debut >= limite * 1000) repondreRef.current({ points: 0, juste: false, temps: true, texte: "⏱️ Temps écoulé !" }, q?.type === "proba" ? [0.5, 0] : undefined)
    }, 250)
    return () => clearInterval(t)
  }, [retour, fin, debut, limite, q, zen])

  function suivante() {
    if (i + 1 < questions.length) { setI(i + 1); setRetour(null); const n = Date.now(); setDebut(n); setMaintenant(n); return }
    const max = questions.length * 100
    const r = finirPartie(jeu, mode, score, max, questions.map(x => x.id), calib)
    const ancien = jeu.records[mode] ?? 0
    // Le défi du jour ne compte qu'au premier essai ; les parties zen ne comptent pas pour les records
    const horsRecord = zen || (mode === "jour" && jeu.duJour?.date === jourISO())
    onFin(horsRecord ? { ...r.jeu, records: jeu.records, duJour: jeu.duJour } : r.jeu)
    setFin({ record: r.record && !horsRecord, xp: r.xp, ancien, nv: niveau(r.jeu.xp).n })
  }

  if (fin) {
    const max = questions.length * 100
    const etoiles = score >= 0.9 * max ? 3 : score >= 0.7 * max ? 2 : score >= 0.4 * max ? 1 : 0
    const monte = fin.nv > niveau(jeu.xp).n
    return (
      <div>
        <section data-sans-inversion style={{ borderRadius: radius.md, padding: "22px 18px", background: fin.record ? "linear-gradient(135deg, #7A4B00, #E0A100)" : "linear-gradient(135deg, #0A1628, #3B2A6B)", color: "#fff", textAlign: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)" }}>{EMOJI_MODE[mode]} {NOM_MODE[mode]}</div>
          <div aria-label={`${etoiles} étoiles sur 3`} style={{ fontSize: 30, letterSpacing: 4, margin: "6px 0" }}>{"★".repeat(etoiles)}<span style={{ opacity: 0.3 }}>{"★".repeat(3 - etoiles)}</span></div>
          <div style={{ fontSize: 44, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.8)", marginTop: 4 }}>points · {justes}/{questions.length} bonnes réponses</div>
          <div role="status" style={{ fontSize: 16, fontWeight: 700, marginTop: 12 }}>
            {zen ? "🧘 Partie zen (hors record)" : fin.record ? (fin.ancien ? `🎉 Nouveau record ! (ancien : ${fin.ancien})` : "🎉 Premier record !") : `🏆 Record : ${Math.max(fin.ancien, score)}${fin.ancien > score ? ` · encore ${fin.ancien - score + 1} points pour le battre` : ""}`}
          </div>
          <div style={{ fontSize: 13.5, marginTop: 6 }}>+{fin.xp} XP{monte ? ` · ⬆️ Niveau ${fin.nv} : ${niveau(jeu.xp + fin.xp).nom} !` : ""}</div>
        </section>
        {erreurs.length > 0 && (
          <details style={carte}>
            <summary style={{ fontWeight: 700, cursor: "pointer", fontSize: 14.5 }}>Revoir mes {erreurs.length} erreur{erreurs.length > 1 ? "s" : ""}</summary>
            {erreurs.map((x, k) => <div key={k} style={{ borderTop: `1px solid ${colors.border}`, padding: "8px 0", fontSize: 13.5, lineHeight: 1.45 }}><b>{x.q}</b><div style={{ color: colors.textMuted }}>{x.r}</div></div>)}
          </details>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="presse" onClick={onRejouer} style={boutonPrincipal}>🔁 Rejouer (nouvelles questions)</button>
          {!zen && <button className="presse" onClick={() => partager(texteScore(mode, score, justes, questions.length))} style={boutonSecondaire}>📤 Partager mon score</button>}
          <button onClick={onQuitter} style={boutonSecondaire}>Accueil</button>
        </div>
      </div>
    )
  }

  const fraction = zen ? 1 : reste / limite
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <button onClick={onQuitter} aria-label="Quitter la partie" style={{ ...boutonSecondaire, padding: "0 12px" }}>✕</button>
        <div style={{ flex: 1, fontSize: 13, color: colors.textMuted, fontWeight: 600 }}>{EMOJI_MODE[mode]} Question {i + 1} / {questions.length}</div>
        {serie >= 2 && <div title="Bonnes réponses d'affilée" style={{ fontSize: 13, fontWeight: 700, color: "#C2410C" }}>🔥 ×{serie}</div>}
        <div style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{score} pts</div>
      </div>
      {zen ? <div style={{ fontSize: 12.5, color: colors.textMuted, marginBottom: 10 }}>🧘 Mode zen : prends ton temps</div> : <>
      <div role="timer" aria-label={`${Math.ceil(reste)} secondes restantes`} style={{ height: 8, background: "#EEF1F5", borderRadius: 999, overflow: "hidden", marginBottom: 4 }}>
        <div style={{ height: "100%", width: `${(retour ? 0 : fraction) * 100}%`, background: fraction < 0.25 ? "#D9485F" : fraction < 0.5 ? "#E0A100" : "#3FA34D", transition: "width 250ms linear, background-color 250ms" }} />
      </div>
      <div style={{ fontSize: 12, color: fraction < 0.25 && !retour ? "#B42318" : colors.textMuted, textAlign: "right", marginBottom: 10, fontVariantNumeric: "tabular-nums" }}>{retour ? " " : `${Math.ceil(reste)} s`}</div>
      </>}

      <div style={carte}>
        {q.type === "fermi" && <QFermi key={q.id} d={q.d} repondu={!!retour} repondre={repondre} />}
        {q.type === "proba" && <QProba key={q.id} a={q.a} repondu={!!retour} repondre={repondre} />}
        {q.type === "manip" && <QManip key={q.id} e={q.e} options={q.options} repondu={!!retour} fraction={fraction} repondre={repondre} />}
        {retour && (
          <div role="status" style={{ marginTop: 12, borderRadius: 12, padding: "10px 12px", background: retour.juste ? "#EAF8F0" : "#FDECEF", fontSize: 14, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{retour.juste ? "✓" : "✗"} {retour.points > 0 ? `+${retour.points} points` : "0 point"}{retour.juste && serie >= 2 ? ` (série ×${serie} : bonus +${Math.round((bonusSerie(serie) - 1) * 100)} %)` : ""}</div>
            {retour.texte}
          </div>
        )}
      </div>
      {retour && <button className="presse" onClick={suivante} style={{ ...boutonPrincipal, width: "100%" }}>{i + 1 < questions.length ? "Question suivante →" : "Voir mon score"}</button>}
    </div>
  )
}

type PropsQ = { repondu: boolean; repondre: (r: { points: number; juste: boolean; texte: React.ReactNode }, c?: [number, 0 | 1]) => void }

function QFermi({ d, repondu, repondre }: PropsQ & { d: DefiFermi }) {
  const [saisie, setSaisie] = useState("")
  const [indices, setIndices] = useState(0)
  function valider(e: React.FormEvent) {
    e.preventDefault()
    const n = lireNombre(saisie)
    if (n == null || n <= 0) return toast("Écris un nombre, par exemple 3000000, 3 millions ou 3e6", "error")
    const points = pointsFermi(n, d.reference, indices)
    const facteur = Math.max(n, d.reference) / Math.min(n, d.reference)
    repondre({ points, juste: facteur <= 3, texte: (
      <>
        Ton estimation : <b>{nf(n)}</b> · {d.exact ? "valeur réelle" : "ordre de grandeur"} : <b>{nf(d.reference)} {d.unite}</b> (écart ×{nf(facteur)}).
        <details style={{ marginTop: 6 }}><summary style={{ cursor: "pointer", fontWeight: 600 }}>Une démarche possible</summary>
          <ol style={{ margin: "6px 0 4px", paddingLeft: 20 }}>{d.demarche.map((x, k) => <li key={k}>{x}</li>)}</ol>
          <div style={{ fontSize: 11.5, color: colors.textMuted }}>Source : {d.source}</div>
        </details>
      </>
    ) })
  }
  return (
    <>
      <h3 style={{ fontSize: 17, color: colors.navy, margin: "0 0 10px", textWrap: "balance" }}>{d.question}</h3>
      {d.pistes.slice(0, indices).map((p, k) => <p key={k} style={{ fontSize: 13.5, margin: "0 0 6px" }}>💡 {p}</p>)}
      {!repondu && indices < d.pistes.length && <button style={{ ...boutonSecondaire, minHeight: 38, fontSize: 13, marginBottom: 10 }} onClick={() => setIndices(n => n + 1)}>💡 Indice (−10 points)</button>}
      {!repondu ? (
        <form onSubmit={valider} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input autoFocus value={saisie} onChange={e => setSaisie(e.target.value)} inputMode="decimal" autoComplete="off" placeholder="Ton estimation (ex. 3 millions)" aria-label={`Ton estimation en ${d.unite}`}
            style={{ flex: "1 1 180px", minHeight: 44, borderRadius: 12, border: `1px solid ${colors.border}`, padding: "0 12px", fontSize: 16 }} />
          <span style={{ fontSize: 13, color: colors.textMuted }}>{d.unite}</span>
          <button type="button" onClick={() => ouvrirCalculatrice(n => setSaisie(ecrireNombre(n)))} aria-label="Ouvrir la calculatrice" style={{ ...boutonSecondaire, padding: "0 12px", fontSize: 18 }}>🧮</button>
          <button type="submit" style={boutonPrincipal}>Valider</button>
        </form>
      ) : null}
    </>
  )
}

function QProba({ a, repondu, repondre }: PropsQ & { a: Affirmation }) {
  const [rep, setRep] = useState<boolean | null>(null)
  function choisir(c: number) {
    if (rep == null) return
    const juste = rep === a.vrai
    repondre({ points: pointsCalib(c, juste), juste, texte: <>C&apos;était <b>{a.vrai ? "VRAI" : "FAUX"}</b>. {a.explication}{!juste && c >= 0.9 ? <div style={{ marginTop: 4, color: "#B42318" }}>Tu étais très sûr de toi : c&apos;est ce qui coûte le plus cher.</div> : null}</> }, [c, juste ? 1 : 0])
  }
  return (
    <>
      <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>Vrai ou faux ?</div>
      <h3 style={{ fontSize: 17, color: colors.navy, margin: "4px 0 12px", textWrap: "balance" }}>{a.texte}</h3>
      {!repondu && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {([true, false] as const).map(v => (
              <button key={String(v)} style={{ ...boutonSecondaire, flex: 1, fontWeight: 700, ...(rep === v ? { background: colors.navy, color: "#fff", borderColor: colors.navy } : {}) }} aria-pressed={rep === v} onClick={() => setRep(v)}>{v ? "Vrai" : "Faux"}</button>
            ))}
          </div>
          <div id="sur" style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6, opacity: rep == null ? 0.5 : 1 }}>À quel point en es-tu sûr ?</div>
          <div role="group" aria-labelledby="sur" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {NIVEAUX_CONFIANCE.map(n => (
              <button key={n} disabled={rep == null} onClick={() => choisir(n)} style={{ ...boutonSecondaire, padding: "0 6px", opacity: rep == null ? 0.45 : 1, fontVariantNumeric: "tabular-nums" }}>{n === 0.5 ? "50 % 🤷" : `${n * 100} %`}</button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function QManip({ e, options, repondu, fraction, repondre }: PropsQ & { e: Exercice; options: string[]; fraction: number }) {
  const [choisi, setChoisi] = useState<string | null>(null)
  return (
    <>
      <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>Quelle technique est utilisée ?</div>
      <p style={{ fontSize: 15.5, margin: "4px 0 12px", fontWeight: 600, lineHeight: 1.45, textWrap: "pretty" }}>{e.phrase}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 6 }}>
        {options.map(id => {
          const etat = !repondu ? "" : id === e.bonne ? "bon" : id === choisi ? "faux" : ""
          return (
            <button key={id} disabled={repondu} onClick={() => { setChoisi(id); const juste = id === e.bonne; repondre({ points: pointsManip(juste, fraction), juste, texte: <>{juste ? "" : <>C&apos;était <b>{nomTech(e.bonne)}</b>. </>}{e.explication}</> }) }}
              style={{ ...boutonSecondaire, textAlign: "left", borderRadius: 12, fontSize: 13.5, background: etat === "bon" ? "#EAF8F0" : etat === "faux" ? "#FDECEF" : "#fff", borderColor: etat === "bon" ? colors.green : etat === "faux" ? colors.red : colors.border }}>
              {etat === "bon" ? "✓ " : etat === "faux" ? "✗ " : ""}{nomTech(id)}
            </button>
          )
        })}
      </div>
    </>
  )
}

// ─── Apprendre ───
function Apprendre({ quoi, jeu, retour }: { quoi: "lecons" | "techniques" | "forer" | "bilan"; jeu: EtatJeu; retour: () => void }) {
  return (
    <div>
      <button onClick={retour} style={{ ...boutonSecondaire, marginBottom: 12 }}>← Retour</button>
      {quoi === "lecons" && <Lecons />}
      {quoi === "techniques" && (
        <>
          <div style={{ ...carte, background: "#FFF6E0", borderColor: "#F0D88A", fontSize: 13.5, lineHeight: 1.5 }}>
            Le but est de <b>te protéger</b> et de mieux observer, pas de manipuler les autres. Ces techniques sont utilisées par les faux voyants, certains vendeurs et les arnaques en ligne.
          </div>
          {TECHNIQUES.map(t => (
            <div key={t.id} style={carte}>
              <h3 style={{ fontSize: 16, color: colors.navy, margin: "0 0 6px" }}>{t.nom}</h3>
              <p style={{ fontSize: 14, margin: "0 0 6px", lineHeight: 1.5 }}>{t.principe}</p>
              <p style={{ fontSize: 13.5, margin: "0 0 6px", color: colors.textMuted, fontStyle: "italic" }}>Exemple : {t.exemple}</p>
              <p style={{ fontSize: 13.5, margin: 0 }}>🛡️ <b>Comment ne pas se faire avoir :</b> {t.parade}</p>
            </div>
          ))}
        </>
      )}
      {quoi === "forer" && <Forer />}
      {quoi === "bilan" && <Bilan jeu={jeu} />}
    </div>
  )
}

// Les leçons se refont à chaque visite (les réponses ne restent pas affichées)
function Lecons() {
  const [choix, setChoix] = useState<Record<number, number>>({})
  const bonnes = LECONS_PROBA.filter((l, k) => choix[k] === l.bonne).length
  return (
    <>
      {Object.keys(choix).length === LECONS_PROBA.length && <div role="status" style={{ ...carte, background: "#EAF8F0", borderColor: colors.green, fontWeight: 700 }}>Score : {bonnes} / {LECONS_PROBA.length}</div>}
      {LECONS_PROBA.map((l, k) => {
        const c = choix[k]
        return (
          <div key={l.titre} style={carte}>
            <h3 style={{ fontSize: 16, color: colors.navy, margin: "0 0 6px" }}>{k + 1}. {l.titre}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.55, margin: "0 0 10px" }}>{l.texte}</p>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>{l.question}</div>
            <div style={{ display: "grid", gap: 6 }}>
              {l.choix.map((x, j) => {
                const e = c == null ? "" : j === l.bonne ? "bon" : j === c ? "faux" : ""
                return <button key={j} disabled={c != null} onClick={() => setChoix(s => ({ ...s, [k]: j }))}
                  style={{ ...boutonSecondaire, textAlign: "left", borderRadius: 12, background: e === "bon" ? "#EAF8F0" : e === "faux" ? "#FDECEF" : "#fff", borderColor: e === "bon" ? colors.green : e === "faux" ? colors.red : colors.border }}>{x}</button>
              })}
            </div>
            {c != null && <p role="status" style={{ fontSize: 13.5, margin: "8px 0 0" }}>{c === l.bonne ? "✓ Juste. " : "✗ Pas tout à fait. "}{l.explication}</p>}
          </div>
        )
      })}
      {Object.keys(choix).length > 0 && <button style={boutonSecondaire} onClick={() => setChoix({})}>Recommencer</button>}
    </>
  )
}

function Forer() {
  const [etape, setEtape] = useState<0 | 1 | 2>(0)
  return (
    <div style={carte}>
      {etape === 0 && (
        <>
          <p style={{ fontSize: 14, margin: "0 0 10px" }}>Voici ton « profil de personnalité », établi à partir de ton activité dans Nexia. Lis-le, puis note à quel point il te correspond.</p>
          <button style={boutonPrincipal} onClick={() => setEtape(1)}>Voir mon profil</button>
        </>
      )}
      {etape >= 1 && (
        <blockquote style={{ margin: "0 0 12px", padding: "10px 14px", background: "#F4F6FA", borderLeft: `4px solid ${colors.blue}`, borderRadius: "0 12px 12px 0", fontSize: 14, lineHeight: 1.55 }}>
          Tu as besoin que les autres t&apos;apprécient, mais tu restes critique envers toi-même. Tu as un potentiel que tu n&apos;as pas encore pleinement exploité. Tu es parfois sociable et ouvert, parfois réservé et prudent. Tu préfères un peu de changement et de variété, et tu n&apos;aimes pas être enfermé par des règles. Certains de tes rêves sont assez peu réalistes.
        </blockquote>
      )}
      {etape === 1 && (
        <>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>Ce profil te correspond…</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Pas du tout", "Un peu", "Assez bien", "Très bien"].map(x => <button key={x} style={boutonSecondaire} onClick={() => setEtape(2)}>{x}</button>)}
          </div>
        </>
      )}
      {etape === 2 && (
        <p role="status" style={{ fontSize: 14, margin: 0, lineHeight: 1.55 }}>
          <b>Surprise : tout le monde reçoit exactement le même texte.</b> En 1948, le psychologue Bertram Forer a donné ce genre de « profil personnel » à ses étudiants : en moyenne, ils l&apos;ont jugé très juste (4,3 sur 5). C&apos;est l&apos;<b>effet Barnum</b> : des phrases vagues et flatteuses semblent faites pour nous. Horoscopes, « tests de personnalité » sur les réseaux et faux voyants l&apos;utilisent.
          <button style={{ ...boutonSecondaire, display: "block", marginTop: 10 }} onClick={() => setEtape(0)}>Refaire l&apos;expérience</button>
        </p>
      )}
    </div>
  )
}

function Bilan({ jeu }: { jeu: EtatJeu }) {
  const b = bilanCalib(jeu.calib, NIVEAUX_CONFIANCE)
  if (!b.total) return <div style={carte}><p style={{ margin: 0 }}>Joue quelques parties de « Penser en probabilités » pour voir ton bilan.</p></div>
  return (
    <div style={carte}>
      <p style={{ margin: "0 0 10px", fontSize: 14 }}>Sur tes <b>{b.total}</b> dernières réponses. Pour être bien calibré, la barre (tes bonnes réponses) doit arriver au trait (ta confiance).</p>
      {b.lignes.filter(l => l.total).map(l => {
        const taux = l.justes / l.total
        return (
          <div key={l.confiance} style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0", fontSize: 13 }}>
            <span style={{ width: 92, flexShrink: 0 }}>Sûr à {l.confiance * 100} %</span>
            <span style={{ position: "relative", flex: 1, height: 14, background: "#EEF1F5", borderRadius: 4 }} role="img" aria-label={`${Math.round(taux * 100)} % de bonnes réponses quand tu étais sûr à ${l.confiance * 100} %`}>
              <span style={{ position: "absolute", inset: 0, width: `${taux * 100}%`, background: taux + 0.1 < l.confiance ? "#D9485F" : "#3FA34D", borderRadius: 4 }} />
              <span style={{ position: "absolute", top: -3, bottom: -3, left: `${l.confiance * 100}%`, width: 2, background: colors.navy }} />
            </span>
            <b style={{ width: 70, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Math.round(taux * 100)} % ({l.total})</b>
          </div>
        )
      })}
      {b.brier != null && (
        <p style={{ fontSize: 13.5, margin: "12px 0 0", lineHeight: 1.5 }}>
          Score de Brier : <b>{b.brier.toFixed(3).replace(".", ",")}</b> (0 = parfait, 0,25 = comme répondre « 50 % » à tout).{" "}
          {b.lignes.some(l => l.total >= 3 && l.justes / l.total + 0.15 < l.confiance) ? "Tu as tendance à être trop sûr de toi : baisse ta confiance quand tu hésites." : "Ta confiance correspond assez bien à tes résultats."}
        </p>
      )}
    </div>
  )
}
