"use client"
import { useEffect, useState } from "react"
import { toast, confirmer } from "@/lib/toast"
import { colors, radius } from "@/app/components/ui/tokens"
import type { Pays } from "@/lib/etudes"
import { chapitreVisible, chargerProgramme } from "@/lib/programmes"
import { chargerFichesPerso } from "@/lib/fichesPerso"
import { normaliser } from "@/lib/carnet"
import { jourISO } from "@/lib/cartes"
import { ajouterAuCalendrier, chargerPlans, creerSeances, enRetard, enregistrerPlans, joursAvant, joursDisponibles, replanifier, retirerDuCalendrier, type Plan, type Seance, type Sujet } from "@/lib/planning"
import { TEXTE_DOUX } from "./cahier"

// Planning de révision jusqu'à un examen : sujets répartis jour par jour,
// séances à cocher, retard réparti sur les jours qui restent, et (au choix)
// séances ajoutées au calendrier.

type Option = { id: string; titre: string; matiere: string; source: "perso" | "programme" }
const JOURS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"]

const champ: React.CSSProperties = { width: "100%", border: `1px solid ${colors.blueBorder}`, borderRadius: 10, padding: "10px 12px", fontSize: 16, color: colors.text, background: "#fff", boxSizing: "border-box" }
const etiquette: React.CSSProperties = { display: "block", fontSize: 12, color: TEXTE_DOUX, margin: "12px 0 5px" }
const puce = (actif: boolean): React.CSSProperties => ({
  flexShrink: 0, border: `1px solid ${actif ? colors.navy : colors.blueBorder}`, background: actif ? colors.navy : "#fff", color: actif ? "#fff" : colors.text,
  borderRadius: radius.pill, padding: "6px 12px", fontSize: 13, cursor: "pointer", minHeight: 36, whiteSpace: "nowrap",
})

function dateLongue(iso: string) {
  const [a, m, j] = iso.split("-").map(Number)
  return new Date(a, m - 1, j).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
}

export default function Planning({ userId, planInitial = null, pays, niveauId, filiere, specialites, onFermer, onOuvrirChapitre }: {
  userId: string
  planInitial?: string | null
  pays: Pays
  niveauId: string | null
  filiere: string | null
  specialites: string[]
  onFermer: () => void
  onOuvrirChapitre: (id: string) => void
}) {
  const [plans, setPlans] = useState<Plan[] | null>(null)
  const [ouvert, setOuvert] = useState<string | null>(planInitial)
  const [nouveau, setNouveau] = useState(false)
  const [options, setOptions] = useState<Option[]>([])

  useEffect(() => {
    let actif = true
    chargerPlans(userId).then(p => { if (actif) { setPlans(p); if (!p.length) setNouveau(true) } })
    Promise.all([chargerFichesPerso(userId), niveauId ? chargerProgramme(pays, niveauId) : Promise.resolve(null)]).then(([perso, prog]) => {
      if (!actif) return
      setOptions([
        ...perso.map(f => ({ id: f.id, titre: f.titre, matiere: f.matiere, source: "perso" as const })),
        ...(prog?.chapitres.filter(c => chapitreVisible(c, filiere, specialites)).map(c => ({ id: c.id, titre: c.titre, matiere: c.matiere, source: "programme" as const })) || []),
      ])
    })
    return () => { actif = false }
  }, [userId, pays, niveauId, filiere, specialites])

  useEffect(() => {
    function echap(e: KeyboardEvent) { if (e.key === "Escape") { e.stopPropagation(); onFermer() } }
    window.addEventListener("keydown", echap, true)
    return () => window.removeEventListener("keydown", echap, true)
  }, [onFermer])

  async function sauver(liste: Plan[]) {
    setPlans(liste)
    if (!(await enregistrerPlans(userId, liste))) toast("Planning non enregistré, vérifie ta connexion", "error")
  }

  const plan = plans?.find(p => p.id === ouvert) ?? null

  return (
    <div role="dialog" aria-modal="true" aria-label="Planning de révision" style={{ position: "fixed", inset: 0, zIndex: 1150, background: "#F4F7FB", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", paddingTop: "calc(10px + env(safe-area-inset-top))", background: "#fff", borderBottom: `1px solid ${colors.border}` }}>
        <button onClick={() => (plan || (nouveau && plans?.length) ? (setOuvert(null), setNouveau(false)) : onFermer())}
          style={{ border: "none", background: colors.blueLight, color: colors.blue, fontWeight: 600, fontSize: 13, padding: "8px 13px", borderRadius: radius.pill, cursor: "pointer" }}>
          ← {plan || (nouveau && plans?.length) ? "Plannings" : "Réviser"}
        </button>
        <div style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: colors.navy }}>Planning de révision</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          {plans === null && <div className="nx-skel" style={{ height: 200, borderRadius: radius.md }} />}
          {plans && nouveau && (
            <NouveauPlan options={options} onCreer={async p => {
              const evenements = p.heure !== null || p.evenements.length ? await ajouterAuCalendrier(userId, p) : []
              const complet = { ...p, evenements }
              await sauver([...(plans || []), complet])
              setNouveau(false); setOuvert(complet.id)
              toast(evenements.length ? "Planning créé et ajouté au calendrier" : "Planning créé", "success")
            }} />
          )}
          {plans && !nouveau && !plan && (
            <>
              {[...plans].sort((a, b) => a.date.localeCompare(b.date)).map(p => {
                const faites = p.seances.filter(s => s.fait).length
                const j = joursAvant(p.date)
                return (
                  <button key={p.id} onClick={() => setOuvert(p.id)}
                    style={{ width: "100%", textAlign: "left", background: "#fff", border: `1px solid ${colors.blueBorder}`, borderRadius: radius.md, padding: 14, marginBottom: 10, cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ flex: 1, fontSize: 15.5, fontWeight: 700, color: colors.navy }}>{p.examen}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: j < 0 ? TEXTE_DOUX : j <= 3 ? "#C81E3F" : colors.blue }}>{j < 0 ? "Passé" : j === 0 ? "Aujourd'hui" : `J-${j}`}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: TEXTE_DOUX, margin: "2px 0 8px" }}>{p.matiere} · {dateLongue(p.date)}{enRetard(p) ? ` · ${enRetard(p)} en retard` : ""}</div>
                    <div aria-hidden="true" style={{ height: 6, borderRadius: 3, background: "#E3E9F2" }}><div style={{ height: 6, borderRadius: 3, width: `${(faites / Math.max(1, p.seances.length)) * 100}%`, background: colors.green }} /></div>
                  </button>
                )
              })}
              <button onClick={() => setNouveau(true)} style={{ width: "100%", border: `1.5px dashed ${colors.blueBorder}`, background: "#fff", borderRadius: radius.md, padding: 14, fontSize: 14, fontWeight: 600, color: colors.blue, cursor: "pointer" }}>+ Nouveau planning</button>
            </>
          )}
          {plan && (
            <DetailPlan plan={plan} onOuvrirChapitre={onOuvrirChapitre}
              onMaj={p => sauver((plans || []).map(x => (x.id === p.id ? p : x)))}
              onReplanifier={async () => {
                await retirerDuCalendrier(plan.evenements)
                const p = { ...plan, seances: replanifier(plan), evenements: [] as string[] }
                p.evenements = plan.evenements.length ? await ajouterAuCalendrier(userId, p) : []
                await sauver((plans || []).map(x => (x.id === p.id ? p : x)))
                toast("Séances réparties sur les jours qui restent", "success")
              }}
              onSupprimer={async () => {
                if (!(await confirmer(`Supprimer le planning « ${plan.examen} »${plan.evenements.length ? " et ses séances dans le calendrier" : ""} ?`, "Supprimer"))) return
                await retirerDuCalendrier(plan.evenements)
                await sauver((plans || []).filter(x => x.id !== plan.id))
                setOuvert(null)
              }} />
          )}
        </div>
      </div>
    </div>
  )
}

function NouveauPlan({ options, onCreer }: { options: Option[]; onCreer: (p: Plan) => Promise<void> }) {
  const demain = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return jourISO(d) })()
  const [examen, setExamen] = useState("")
  const [date, setDate] = useState(demain)
  const matieres = [...new Set(options.map(o => o.matiere))].sort((a, b) => a.localeCompare(b, "fr"))
  const [matiere, setMatiere] = useState("")
  const [choisis, setChoisis] = useState<Sujet[]>([])
  const [q, setQ] = useState("")
  const [libre, setLibre] = useState("")
  const [minutes, setMinutes] = useState(45)
  const [joursOff, setJoursOff] = useState<number[]>([])
  const [calendrier, setCalendrier] = useState(true)
  const [heure, setHeure] = useState("18:00")
  const [envoi, setEnvoi] = useState(false)

  const mots = normaliser(q).split(/\s+/).filter(Boolean)
  const proposes = options.filter(o => (!matiere || o.matiere === matiere) && mots.every(m => normaliser(`${o.titre} ${o.matiere}`).includes(m))).slice(0, 60)
  const jours = date > jourISO() ? joursDisponibles(jourISO(), date, joursOff) : []
  const basculer = (o: Option) => setChoisis(c => c.some(s => s.id === o.id) ? c.filter(s => s.id !== o.id) : [...c, { id: o.id, titre: o.titre, chapitreId: o.id }])

  async function creer() {
    if (!examen.trim()) return toast("Donne un nom à l'examen", "error")
    if (date <= jourISO()) return toast("Choisis une date d'examen à partir de demain", "error")
    if (!choisis.length) return toast("Choisis au moins un sujet à réviser", "error")
    if (!jours.length) return toast("Aucun jour de révision avant l'examen", "error")
    setEnvoi(true)
    const p: Plan = {
      id: crypto.randomUUID(), examen: examen.trim().slice(0, 100), date, matiere: matiere || "Plusieurs matières", minutes,
      heure: calendrier ? heure : null, joursOff, sujets: choisis, seances: creerSeances(choisis, jourISO(), date, joursOff),
      evenements: [], cree_le: new Date().toISOString(),
    }
    await onCreer(p)
    setEnvoi(false)
  }

  return (
    <div style={{ background: "#fff", border: `1px solid ${colors.blueBorder}`, borderRadius: radius.md, padding: 16 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: colors.navy }}>Nouveau planning</div>
      <p style={{ fontSize: 13, color: TEXTE_DOUX, margin: "4px 0 0", lineHeight: 1.5 }}>Chaque sujet est étudié, puis revu quelques jours plus tard. La veille de l&apos;examen est gardée pour une révision générale.</p>

      <label style={etiquette} htmlFor="pl-examen">Examen</label>
      <input id="pl-examen" value={examen} onChange={e => setExamen(e.target.value)} placeholder="ex. Examen de comptabilité" style={champ} maxLength={100} />
      <label style={etiquette} htmlFor="pl-date">Date de l&apos;examen</label>
      <input id="pl-date" type="date" value={date} min={jourISO()} onChange={e => setDate(e.target.value)} style={champ} />

      <label style={etiquette}>Sujets à réviser {choisis.length > 0 && <b style={{ color: colors.navy }}>({choisis.length})</b>}</label>
      {matieres.length > 0 && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6 }}>
          {["", ...matieres].map(m => <button key={m || "tout"} type="button" aria-pressed={matiere === m} style={puce(matiere === m)} onClick={() => setMatiere(m)}>{m || "Toutes"}</button>)}
        </div>
      )}
      {options.length > 0 && <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Chercher un chapitre" aria-label="Chercher un chapitre" style={{ ...champ, marginBottom: 6 }} />}
      <div style={{ maxHeight: 240, overflowY: "auto", border: `1px solid ${colors.border}`, borderRadius: 10 }}>
        {proposes.map(o => {
          const actif = choisis.some(s => s.id === o.id)
          return (
            <label key={o.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", borderBottom: `1px solid ${colors.border}`, cursor: "pointer", background: actif ? "#F1F6FF" : "#fff" }}>
              <input type="checkbox" checked={actif} onChange={() => basculer(o)} style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: colors.text }}>{o.titre}<span style={{ display: "block", fontSize: 11.5, color: TEXTE_DOUX }}>{o.matiere}{o.source === "perso" ? " · mes cours" : ""}</span></span>
            </label>
          )
        })}
        {choisis.filter(s => !s.chapitreId).map(s => (
          <label key={s.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderBottom: `1px solid ${colors.border}`, background: "#F1F6FF" }}>
            <input type="checkbox" checked onChange={() => setChoisis(c => c.filter(x => x.id !== s.id))} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 14 }}>{s.titre}</span>
          </label>
        ))}
        {!proposes.length && !choisis.some(s => !s.chapitreId) && <p style={{ fontSize: 13, color: TEXTE_DOUX, padding: "10px 12px", margin: 0 }}>Ajoute tes sujets ci-dessous.</p>}
      </div>
      <form onSubmit={e => { e.preventDefault(); const t = libre.trim(); if (t) { setChoisis(c => [...c, { id: crypto.randomUUID(), titre: t.slice(0, 120), chapitreId: null }]); setLibre("") } }} style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <input value={libre} onChange={e => setLibre(e.target.value)} placeholder="Ajouter un sujet (ex. Chapitre 3)" aria-label="Ajouter un sujet" style={champ} />
        <button type="submit" style={{ ...puce(false), padding: "0 14px" }}>Ajouter</button>
      </form>

      <label style={etiquette}>Temps par jour</label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[30, 45, 60, 90].map(m => <button key={m} type="button" aria-pressed={minutes === m} style={puce(minutes === m)} onClick={() => setMinutes(m)}>{m < 60 ? `${m} min` : m === 60 ? "1 h" : "1 h 30"}</button>)}
      </div>
      <label style={etiquette}>Jours sans révision</label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {JOURS.map((j, i) => <button key={j} type="button" aria-pressed={joursOff.includes(i)} style={puce(joursOff.includes(i))} onClick={() => setJoursOff(o => o.includes(i) ? o.filter(x => x !== i) : [...o, i])}>{j}</button>)}
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, fontSize: 14, color: colors.text, cursor: "pointer" }}>
        <input type="checkbox" checked={calendrier} onChange={e => setCalendrier(e.target.checked)} style={{ width: 18, height: 18 }} />
        Ajouter les séances au calendrier, à
        <input type="time" value={heure} onChange={e => setHeure(e.target.value)} disabled={!calendrier} aria-label="Heure des séances" style={{ ...champ, width: 110, padding: "6px 8px" }} />
      </label>

      <div style={{ fontSize: 13, color: colors.textMuted, margin: "14px 0 10px" }}>
        {jours.length ? `${jours.length} jour${jours.length > 1 ? "s" : ""} de révision avant l'examen.` : "Choisis une date d'examen à partir de demain."}
        {jours.length > 0 && choisis.length > jours.length && " Plusieurs sujets par jour : pense à augmenter le temps."}
      </div>
      <button onClick={() => void creer()} disabled={envoi}
        style={{ width: "100%", background: colors.blue, color: "#fff", border: "none", borderRadius: radius.pill, padding: "13px", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: envoi ? 0.6 : 1 }}>
        {envoi ? "Création…" : "Créer mon planning"}
      </button>
    </div>
  )
}

function DetailPlan({ plan, onMaj, onReplanifier, onSupprimer, onOuvrirChapitre }: {
  plan: Plan
  onMaj: (p: Plan) => void
  onReplanifier: () => Promise<void>
  onSupprimer: () => Promise<void>
  onOuvrirChapitre: (id: string) => void
}) {
  const [occupe, setOccupe] = useState(false)
  const aujourdhui = jourISO()
  const j = joursAvant(plan.date)
  const faites = plan.seances.filter(s => s.fait).length
  const retard = enRetard(plan)
  const parJour = new Map<string, Seance[]>()
  for (const s of plan.seances) parJour.set(s.date, [...(parJour.get(s.date) || []), s])
  const dates = [...parJour.keys()].sort()
  const sujet = (s: Seance) => plan.sujets.find(x => x.id === s.sujetId)
  const nom = (s: Seance) => s.type === "general" ? "Révision générale : relis tes fiches et fais un examen blanc" : `${s.type === "revision" ? "Revoir" : "Étudier"} : ${sujet(s)?.titre ?? ""}`
  const cocher = (s: Seance) => onMaj({ ...plan, seances: plan.seances.map(x => (x.id === s.id ? { ...x, fait: !x.fait } : x)) })

  return (
    <div>
      <div style={{ background: "#fff", border: `1px solid ${colors.blueBorder}`, borderRadius: radius.md, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div style={{ flex: 1, fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700, color: colors.navy }}>{plan.examen}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: j <= 3 ? "#C81E3F" : colors.blue }}>{j < 0 ? "Passé" : j === 0 ? "Jour J" : `J-${j}`}</div>
        </div>
        <div style={{ fontSize: 13, color: TEXTE_DOUX, margin: "2px 0 10px" }}>{plan.matiere} · {dateLongue(plan.date)} · {plan.minutes} min par jour</div>
        <div aria-hidden="true" style={{ height: 8, borderRadius: 4, background: "#E3E9F2" }}><div style={{ height: 8, borderRadius: 4, width: `${(faites / Math.max(1, plan.seances.length)) * 100}%`, background: colors.green }} /></div>
        <div style={{ fontSize: 12.5, color: colors.textMuted, marginTop: 6 }}>{faites} / {plan.seances.length} séances faites</div>
        {retard > 0 && j > 0 && (
          <div role="alert" style={{ marginTop: 12, background: "#FFF4E0", borderRadius: 10, padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ flex: 1, fontSize: 13, color: "#8A5A00" }}>{retard} séance{retard > 1 ? "s" : ""} en retard. Pas grave : on les répartit sur les jours qui restent.</span>
            <button disabled={occupe} onClick={async () => { setOccupe(true); await onReplanifier(); setOccupe(false) }}
              style={{ flexShrink: 0, background: "#B45309", color: "#fff", border: "none", borderRadius: radius.pill, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Replanifier</button>
          </div>
        )}
      </div>

      {dates.map(d => {
        const passe = d < aujourdhui
        const ss = parJour.get(d)!
        if (passe && ss.every(s => s.fait)) return null
        return (
          <div key={d} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: d === aujourdhui ? colors.blue : passe ? "#C81E3F" : TEXTE_DOUX, padding: "4px 2px", textTransform: "capitalize" }}>
              {d === aujourdhui ? "Aujourd'hui" : dateLongue(d)}{passe ? " (en retard)" : ""}
            </div>
            <div style={{ background: "#fff", border: `1px solid ${d === aujourdhui ? colors.blue : colors.blueBorder}`, borderRadius: radius.md, overflow: "hidden" }}>
              {ss.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderTop: i ? `1px solid ${colors.border}` : "none" }}>
                  <input type="checkbox" checked={s.fait} onChange={() => cocher(s)} aria-label={`Fait : ${nom(s)}`} style={{ width: 20, height: 20, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14, color: s.fait ? TEXTE_DOUX : colors.text, textDecoration: s.fait ? "line-through" : "none" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, marginRight: 6, color: s.type === "etude" ? colors.blue : s.type === "revision" ? "#7C3AED" : "#B45309" }}>
                      {s.type === "etude" ? "ÉTUDE" : s.type === "revision" ? "RAPPEL" : "BILAN"}
                    </span>
                    {s.type === "general" ? nom(s) : sujet(s)?.titre}
                  </span>
                  {sujet(s)?.chapitreId && <button onClick={() => onOuvrirChapitre(sujet(s)!.chapitreId!)} style={{ ...puce(false), fontSize: 12, padding: "4px 10px", minHeight: 32 }}>Ouvrir</button>}
                </div>
              ))}
            </div>
          </div>
        )
      })}
      <button onClick={() => void onSupprimer()} style={{ background: "none", border: "none", color: "#C81E3F", fontSize: 13, padding: "12px 0", cursor: "pointer" }}>Supprimer ce planning</button>
    </div>
  )
}
