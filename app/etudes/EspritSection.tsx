"use client"
import { useEffect, useRef, useState } from "react"
import { colors, radius } from "@/app/components/ui/tokens"
import { toast } from "@/lib/toast"
import { ecrireNombre, ouvrirCalculatrice } from "@/lib/calcul"
import {
  AFFIRMATIONS, DEFIS_FERMI, ETAT_ESPRIT_VIDE, EXERCICES_MANIP, LECONS_PROBA, NIVEAUX_CONFIANCE, TECHNIQUES,
  bilanCalibration, chargerEsprit, ecartFermi, enregistrerEsprit, lireNombre, type EtatEsprit,
} from "@/lib/esprit"

// « Entraîne ton esprit » : estimer (Fermi), raisonner en probabilités, repérer la manipulation
type Partie = "fermi" | "proba" | "manip"
const PARTIES: { id: Partie; nom: string; desc: string }[] = [
  { id: "fermi", nom: "Estimer (Fermi)", desc: "Trouver un ordre de grandeur sans chercher sur internet, en découpant le problème." },
  { id: "proba", nom: "Penser en probabilités", desc: "Dire à quel point tu es sûr, et vérifier si ton intuition est fiable." },
  { id: "manip", nom: "Repérer la manipulation", desc: "Les techniques des faux voyants (« cold reading ») et des arnaqueurs, pour ne plus te faire avoir." },
]

const nf = (n: number) => n.toLocaleString("fr-CH", { maximumFractionDigits: n < 100 ? 1 : 0 })
const carte: React.CSSProperties = { background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: 16, marginBottom: 12 }
const boutonPrincipal: React.CSSProperties = { minHeight: 44, padding: "0 18px", borderRadius: 999, border: "none", background: colors.blue, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer" }
const boutonSecondaire: React.CSSProperties = { minHeight: 44, padding: "0 16px", borderRadius: 999, border: `1px solid ${colors.border}`, background: "#fff", color: colors.text, fontSize: 14, cursor: "pointer" }

export default function EspritSection({ userId }: { userId: string }) {
  const [etat, setEtat] = useState<EtatEsprit | null>(null)
  const [partie, setPartie] = useState<Partie>("fermi")
  const etatRef = useRef<EtatEsprit>(ETAT_ESPRIT_VIDE)

  useEffect(() => {
    let actif = true
    chargerEsprit(userId).then(e => { if (actif) { etatRef.current = e; setEtat(e) } })
    return () => { actif = false }
  }, [userId])

  function maj(f: (e: EtatEsprit) => EtatEsprit) {
    const e = f(etatRef.current)
    etatRef.current = e
    setEtat(e)
    void enregistrerEsprit(userId, e).then(ok => { if (!ok && navigator.onLine) toast("Progrès pas enregistré, vérifie ta connexion", "error") })
  }

  if (!etat) return <div className="nx-skel" style={{ height: 240, borderRadius: radius.md }} />
  const faits = { fermi: Object.keys(etat.fermi).length, proba: Object.keys(etat.calibration).length, manip: Object.keys(etat.manipulation).length }
  const totaux = { fermi: DEFIS_FERMI.length, proba: AFFIRMATIONS.length, manip: EXERCICES_MANIP.length }

  return (
    <div>
      <section style={{ borderRadius: radius.md, padding: "16px 18px", background: "linear-gradient(135deg, #0A1628, #3B2A6B)", color: "#fff", marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Entraîne ton esprit</div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.8)", marginTop: 4, lineHeight: 1.45 }}>Trois façons de mieux réfléchir que la moyenne : estimer vite, raisonner avec l&apos;incertitude, et voir clair dans les discours trop beaux.</div>
      </section>
      <div role="tablist" aria-label="Parties" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginBottom: 14 }}>
        {PARTIES.map(p => (
          <button key={p.id} role="tab" aria-selected={partie === p.id} onClick={() => setPartie(p.id)}
            style={{ textAlign: "left", borderRadius: radius.md, padding: "10px 12px", cursor: "pointer", minHeight: 44,
              border: `1.5px solid ${partie === p.id ? colors.blue : colors.border}`, background: partie === p.id ? colors.blueLight : "#fff", color: colors.text }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{p.nom}</div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{faits[p.id]} / {totaux[p.id]} faits</div>
          </button>
        ))}
      </div>
      <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 12px" }}>{PARTIES.find(p => p.id === partie)!.desc}</p>
      <div role="tabpanel">
        {partie === "fermi" && <Fermi etat={etat} maj={maj} />}
        {partie === "proba" && <Proba etat={etat} maj={maj} />}
        {partie === "manip" && <Manip etat={etat} maj={maj} />}
      </div>
    </div>
  )
}

type PropsPartie = { etat: EtatEsprit; maj: (f: (e: EtatEsprit) => EtatEsprit) => void }

// ─── Fermi ───
function Fermi({ etat, maj }: PropsPartie) {
  const [i, setI] = useState(() => Math.max(0, DEFIS_FERMI.findIndex(d => !etat.fermi[d.id])))
  const [saisie, setSaisie] = useState("")
  const [pistes, setPistes] = useState(0)
  const d = DEFIS_FERMI[i]
  const fait = etat.fermi[d.id]
  const ecart = fait ? ecartFermi(fait.estimation, d.reference) : null
  const MESSAGES = { excellent: ["🎯 Excellent", "à moins de 2 fois la bonne valeur"], bon: ["👍 Bon ordre de grandeur", "à moins de 3 fois la bonne valeur"], moyen: ["🙂 Pas loin", "le bon ordre de grandeur à 10 fois près"], loin: ["🔁 Assez loin", "plus de 10 fois d'écart : revois la démarche"] } as const

  function valider(e: React.FormEvent) {
    e.preventDefault()
    const n = lireNombre(saisie)
    if (n == null || n <= 0) return toast("Écris un nombre, par exemple 3000000, 3 millions ou 3e6", "error")
    maj(st => ({ ...st, fermi: { ...st.fermi, [d.id]: { estimation: n, date: new Date().toISOString().slice(0, 10) } } }))
  }
  function aller(k: number) { setI((k + DEFIS_FERMI.length) % DEFIS_FERMI.length); setSaisie(""); setPistes(0) }

  return (
    <div style={carte}>
      <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>Défi {i + 1} / {DEFIS_FERMI.length}</div>
      <h3 style={{ fontSize: 17, color: colors.navy, margin: "4px 0 10px", textWrap: "balance" }}>{d.question}</h3>
      {d.pistes.slice(0, pistes).map((p, k) => <p key={k} style={{ fontSize: 13.5, margin: "0 0 6px", color: colors.text }}>💡 {p}</p>)}
      {!fait && pistes < d.pistes.length && <button style={{ ...boutonSecondaire, minHeight: 38, fontSize: 13, marginBottom: 10 }} onClick={() => setPistes(p => p + 1)}>Un indice pour découper le problème</button>}
      {!fait ? (
        <form onSubmit={valider} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <label htmlFor="estimation" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Ton estimation</label>
          <input id="estimation" value={saisie} onChange={e => setSaisie(e.target.value)} inputMode="decimal" autoComplete="off" placeholder="Ton estimation (ex. 3 millions)"
            style={{ flex: "1 1 200px", minHeight: 44, borderRadius: 12, border: `1px solid ${colors.border}`, padding: "0 12px", fontSize: 16 }} />
          <span style={{ fontSize: 13, color: colors.textMuted }}>{d.unite}</span>
          <button type="button" onClick={() => ouvrirCalculatrice(n => setSaisie(ecrireNombre(n)))} aria-label="Ouvrir la calculatrice" title="Calculatrice" style={{ ...boutonSecondaire, padding: "0 12px", fontSize: 18 }}>🧮</button>
          <button type="submit" style={boutonPrincipal}>Valider</button>
        </form>
      ) : (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "4px 0 10px" }}>
            <div style={{ background: "#F4F6FA", borderRadius: 12, padding: "10px 12px" }}><div style={{ fontSize: 12, color: colors.textMuted }}>Ton estimation</div><b style={{ fontSize: 17, fontVariantNumeric: "tabular-nums" }}>{nf(fait.estimation)}</b></div>
            <div style={{ background: "#EEF4FF", borderRadius: 12, padding: "10px 12px" }}><div style={{ fontSize: 12, color: colors.textMuted }}>{d.exact ? "Valeur réelle" : "Ordre de grandeur"}</div><b style={{ fontSize: 17, fontVariantNumeric: "tabular-nums" }}>{nf(d.reference)} {d.unite}</b></div>
          </div>
          {ecart && <p role="status" style={{ margin: "0 0 10px", fontSize: 14 }}><b>{MESSAGES[ecart.niveau][0]}</b> : {MESSAGES[ecart.niveau][1]} (écart ×{nf(ecart.facteur)}).</p>}
          <div style={{ fontSize: 13.5, fontWeight: 700, margin: "6px 0 4px" }}>Une démarche possible</div>
          <ol style={{ margin: "0 0 8px", paddingLeft: 20, fontSize: 13.5, lineHeight: 1.5 }}>{d.demarche.map((x, k) => <li key={k}>{x}</li>)}</ol>
          <div style={{ fontSize: 11.5, color: colors.textFaint }}>Source : {d.source}</div>
          <button style={{ ...boutonSecondaire, minHeight: 36, fontSize: 13, marginTop: 8 }} onClick={() => maj(st => { const f = { ...st.fermi }; delete f[d.id]; return { ...st, fermi: f } })}>Recommencer ce défi</button>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginTop: 14 }}>
        <button style={boutonSecondaire} onClick={() => aller(i - 1)}>← Précédent</button>
        <button style={boutonSecondaire} onClick={() => aller(i + 1)}>Suivant →</button>
      </div>
    </div>
  )
}

// ─── Probabilités ───
function Proba({ etat, maj }: PropsPartie) {
  const [vue, setVue] = useState<"quiz" | "lecons" | "bilan">("quiz")
  const [reponse, setReponse] = useState<boolean | null>(null)
  const reste = AFFIRMATIONS.filter(a => !etat.calibration[a.id])
  const a = reste[0]
  const dernier = Object.keys(etat.calibration).at(-1)
  const derniereA = dernier ? AFFIRMATIONS.find(x => x.id === dernier) : undefined
  const b = bilanCalibration(etat.calibration)
  const puce = (actif: boolean): React.CSSProperties => ({ minHeight: 38, borderRadius: 999, border: `1px solid ${actif ? colors.navy : colors.border}`, background: actif ? colors.navy : "#fff", color: actif ? "#fff" : colors.text, fontSize: 13, padding: "0 14px", cursor: "pointer" })

  return (
    <>
      <div role="group" aria-label="Affichage" style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {([["quiz", "Quiz de calibration"], ["lecons", "5 idées clés"], ["bilan", "Mon bilan"]] as const).map(([id, n]) => <button key={id} style={puce(vue === id)} aria-pressed={vue === id} onClick={() => setVue(id)}>{n}</button>)}
      </div>

      {vue === "quiz" && (
        <div style={carte}>
          {derniereA && (
            <div role="status" style={{ background: etat.calibration[derniereA.id].reponse === derniereA.vrai ? "#EAF8F0" : "#FDECEF", borderRadius: 12, padding: "8px 12px", fontSize: 13, marginBottom: 12 }}>
              Précédente : « {derniereA.texte} » → <b>{derniereA.vrai ? "VRAI" : "FAUX"}</b>. {derniereA.explication}
            </div>
          )}
          {!a ? (
            <p style={{ margin: 0 }}>Tu as répondu aux {AFFIRMATIONS.length} affirmations. Regarde « Mon bilan » !
              <button style={{ ...boutonSecondaire, marginLeft: 8, minHeight: 36 }} onClick={() => maj(st => ({ ...st, calibration: {} }))}>Recommencer</button></p>
          ) : (
            <>
              <div style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600 }}>Affirmation {AFFIRMATIONS.length - reste.length + 1} / {AFFIRMATIONS.length}</div>
              <h3 style={{ fontSize: 17, color: colors.navy, margin: "4px 0 12px", textWrap: "balance" }}>{a.texte}</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button style={{ ...boutonSecondaire, flex: 1, ...(reponse === true ? { background: colors.navy, color: "#fff" } : {}) }} aria-pressed={reponse === true} onClick={() => setReponse(true)}>Vrai</button>
                <button style={{ ...boutonSecondaire, flex: 1, ...(reponse === false ? { background: colors.navy, color: "#fff" } : {}) }} aria-pressed={reponse === false} onClick={() => setReponse(false)}>Faux</button>
              </div>
              <div id="sur" style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>À quel point en es-tu sûr ?</div>
              <div role="group" aria-labelledby="sur" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {NIVEAUX_CONFIANCE.map(n => (
                  <button key={n} disabled={reponse == null} onClick={() => { maj(st => ({ ...st, calibration: { ...st.calibration, [a.id]: { reponse: reponse!, confiance: n } } })); setReponse(null) }}
                    style={{ ...boutonSecondaire, minWidth: 64, opacity: reponse == null ? 0.45 : 1 }}>{n === 0.5 ? "50 % (au hasard)" : `${n * 100} %`}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {vue === "lecons" && LECONS_PROBA.map((l, k) => {
        const choisi = etat.lecons[l.titre]
        return (
          <div key={l.titre} style={carte}>
            <h3 style={{ fontSize: 16, color: colors.navy, margin: "0 0 6px" }}>{k + 1}. {l.titre}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.55, margin: "0 0 10px" }}>{l.texte}</p>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>{l.question}</div>
            <div style={{ display: "grid", gap: 6 }}>
              {l.choix.map((c, j) => {
                const etatChoix = choisi == null ? "" : j === l.bonne ? "bon" : j === choisi ? "faux" : ""
                return <button key={j} disabled={choisi != null} onClick={() => maj(st => ({ ...st, lecons: { ...st.lecons, [l.titre]: j } }))}
                  style={{ ...boutonSecondaire, textAlign: "left", borderRadius: 12, background: etatChoix === "bon" ? "#EAF8F0" : etatChoix === "faux" ? "#FDECEF" : "#fff", borderColor: etatChoix === "bon" ? colors.green : etatChoix === "faux" ? colors.red : colors.border }}>{c}</button>
              })}
            </div>
            {choisi != null && <p role="status" style={{ fontSize: 13.5, margin: "8px 0 0" }}>{choisi === l.bonne ? "✓ Juste. " : "✗ Pas tout à fait. "}{l.explication}</p>}
          </div>
        )
      })}

      {vue === "bilan" && (
        <div style={carte}>
          {!b.total ? <p style={{ margin: 0 }}>Réponds à quelques affirmations du quiz pour voir ton bilan.</p> : (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 14 }}>Sur <b>{b.total}</b> réponses. Pour être bien calibré, la barre (tes bonnes réponses) doit arriver au trait (ta confiance).</p>
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
            </>
          )}
        </div>
      )}
    </>
  )
}

// ─── Manipulation ───
function Manip({ etat, maj }: PropsPartie) {
  const [vue, setVue] = useState<"techniques" | "exercice" | "barnum">("techniques")
  const [barnum, setBarnum] = useState<0 | 1 | 2>(0)
  const puce = (actif: boolean): React.CSSProperties => ({ minHeight: 38, borderRadius: 999, border: `1px solid ${actif ? colors.navy : colors.border}`, background: actif ? colors.navy : "#fff", color: actif ? "#fff" : colors.text, fontSize: 13, padding: "0 14px", cursor: "pointer" })
  const nomTech = (id: string) => TECHNIQUES.find(t => t.id === id)?.nom ?? id
  const justes = EXERCICES_MANIP.filter(e => etat.manipulation[e.id] === e.bonne).length

  return (
    <>
      <div style={{ ...carte, background: "#FFF6E0", borderColor: "#F0D88A", fontSize: 13.5, lineHeight: 1.5 }}>
        Le but est de <b>te protéger</b> et de mieux observer, pas de manipuler les autres. Ces techniques sont utilisées par les faux voyants, certains vendeurs et les arnaques en ligne.
      </div>
      <div role="group" aria-label="Affichage" style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {([["techniques", "Les 7 techniques"], ["exercice", `Repère la technique (${justes}/${EXERCICES_MANIP.length})`], ["barnum", "L'expérience de Forer"]] as const).map(([id, n]) => <button key={id} style={puce(vue === id)} aria-pressed={vue === id} onClick={() => setVue(id)}>{n}</button>)}
      </div>

      {vue === "techniques" && TECHNIQUES.map(t => (
        <div key={t.id} style={carte}>
          <h3 style={{ fontSize: 16, color: colors.navy, margin: "0 0 6px" }}>{t.nom}</h3>
          <p style={{ fontSize: 14, margin: "0 0 6px", lineHeight: 1.5 }}>{t.principe}</p>
          <p style={{ fontSize: 13.5, margin: "0 0 6px", color: colors.textMuted, fontStyle: "italic" }}>Exemple : {t.exemple}</p>
          <p style={{ fontSize: 13.5, margin: 0 }}>🛡️ <b>Comment ne pas se faire avoir :</b> {t.parade}</p>
        </div>
      ))}

      {vue === "exercice" && EXERCICES_MANIP.map(e => {
        const choisi = etat.manipulation[e.id]
        const options = [e.bonne, ...TECHNIQUES.map(t => t.id).filter(id => id !== e.bonne).slice(0, 3)].sort()
        return (
          <div key={e.id} style={carte}>
            <p style={{ fontSize: 14.5, margin: "0 0 8px", fontWeight: 600 }}>{e.phrase}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 6 }}>
              {options.map(id => {
                const etatChoix = !choisi ? "" : id === e.bonne ? "bon" : id === choisi ? "faux" : ""
                return <button key={id} disabled={!!choisi} onClick={() => maj(st => ({ ...st, manipulation: { ...st.manipulation, [e.id]: id } }))}
                  style={{ ...boutonSecondaire, textAlign: "left", borderRadius: 12, fontSize: 13, background: etatChoix === "bon" ? "#EAF8F0" : etatChoix === "faux" ? "#FDECEF" : "#fff", borderColor: etatChoix === "bon" ? colors.green : etatChoix === "faux" ? colors.red : colors.border }}>{nomTech(id)}</button>
              })}
            </div>
            {choisi && <p role="status" style={{ fontSize: 13.5, margin: "8px 0 0" }}>{choisi === e.bonne ? "✓ " : `✗ C'était « ${nomTech(e.bonne)} ». `}{e.explication}</p>}
          </div>
        )
      })}
      {vue === "exercice" && Object.keys(etat.manipulation).length > 0 && <button style={boutonSecondaire} onClick={() => maj(st => ({ ...st, manipulation: {} }))}>Recommencer l&apos;exercice</button>}

      {vue === "barnum" && (
        <div style={carte}>
          {barnum === 0 && (
            <>
              <p style={{ fontSize: 14, margin: "0 0 10px" }}>Voici ton « profil de personnalité », établi à partir de ton activité dans Nexia. Lis-le, puis note à quel point il te correspond.</p>
              <button style={boutonPrincipal} onClick={() => setBarnum(1)}>Voir mon profil</button>
            </>
          )}
          {barnum >= 1 && (
            <blockquote style={{ margin: "0 0 12px", padding: "10px 14px", background: "#F4F6FA", borderLeft: `4px solid ${colors.blue}`, borderRadius: "0 12px 12px 0", fontSize: 14, lineHeight: 1.55 }}>
              Tu as besoin que les autres t&apos;apprécient, mais tu restes critique envers toi-même. Tu as un potentiel que tu n&apos;as pas encore pleinement exploité. Tu es parfois sociable et ouvert, parfois réservé et prudent. Tu préfères un peu de changement et de variété, et tu n&apos;aimes pas être enfermé par des règles. Certains de tes rêves sont assez peu réalistes.
            </blockquote>
          )}
          {barnum === 1 && (
            <>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>Ce profil te correspond…</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Pas du tout", "Un peu", "Assez bien", "Très bien"].map(x => <button key={x} style={boutonSecondaire} onClick={() => setBarnum(2)}>{x}</button>)}
              </div>
            </>
          )}
          {barnum === 2 && (
            <p role="status" style={{ fontSize: 14, margin: 0, lineHeight: 1.55 }}>
              <b>Surprise : tout le monde reçoit exactement le même texte.</b> En 1948, le psychologue Bertram Forer a donné ce genre de « profil personnel » à ses étudiants : en moyenne, ils l&apos;ont jugé très juste (4,3 sur 5). C&apos;est l&apos;<b>effet Barnum</b> : des phrases vagues et flatteuses semblent faites pour nous. Horoscopes, « tests de personnalité » sur les réseaux et faux voyants l&apos;utilisent.
              <button style={{ ...boutonSecondaire, display: "block", marginTop: 10 }} onClick={() => setBarnum(0)}>Refaire l&apos;expérience</button>
            </p>
          )}
        </div>
      )}
    </>
  )
}
