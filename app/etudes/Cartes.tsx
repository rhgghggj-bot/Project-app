"use client"
import { useEffect, useRef, useState } from "react"
import { toast } from "@/lib/toast"
import { colors, radius } from "@/app/components/ui/tokens"
import { aRevoir, chargerCartes, chargerEtats, enregistrerEtats, estNouvelle, repondre, seance, type Carte, type Etats, type Reponse } from "@/lib/cartes"
import { TEXTE_DOUX } from "./cahier"

// Séance de cartes de révision, en plein écran : on lit la question, on
// répond dans sa tête, on retourne la carte, puis on dit si on savait.
export default function Cartes({ userId, onFermer }: { userId: string; onFermer: () => void }) {
  const [cartes, setCartes] = useState<Carte[] | null>(null)
  const [etats, setEtats] = useState<Etats>({})
  const [groupe, setGroupe] = useState<string | null>(null)
  const [file, setFile] = useState<Carte[] | null>(null)
  const [retournee, setRetournee] = useState(false)
  const [bilan, setBilan] = useState({ su: 0, presque: 0, rate: 0 })
  const ratees = useRef(new Set<string>())
  const envoi = useRef<ReturnType<typeof setTimeout> | null>(null)
  const derniers = useRef<Etats>({})

  useEffect(() => {
    let actif = true
    Promise.all([chargerCartes(userId), chargerEtats(userId)]).then(([c, e]) => {
      if (!actif) return
      setCartes(c); setEtats(e); derniers.current = e
    }).catch(() => { if (actif) { setCartes([]); toast("Cartes non chargées, vérifie ta connexion", "error") } })
    return () => { actif = false }
  }, [userId])

  // Enregistre l'avancement (regroupé) et à la fermeture
  function sauver(e: Etats) {
    derniers.current = e
    if (envoi.current) clearTimeout(envoi.current)
    envoi.current = setTimeout(() => { envoi.current = null; void enregistrerEtats(userId, e) }, 1200)
  }
  async function fermer() {
    if (envoi.current) { clearTimeout(envoi.current); envoi.current = null; await enregistrerEtats(userId, derniers.current) }
    onFermer()
  }

  useEffect(() => {
    function touche(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); void fermer() }
      if (!file?.length) return
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setRetournee(r => !r) }
      if (retournee && ["1", "2", "3"].includes(e.key)) noter((["rate", "presque", "su"] as const)[Number(e.key) - 1])
    }
    window.addEventListener("keydown", touche, true)
    return () => window.removeEventListener("keydown", touche, true)
  })

  const groupes = cartes ? [...new Set(cartes.map(c => c.groupe))].sort((a, b) => a.localeCompare(b, "fr")) : []
  const duGroupe = (cartes || []).filter(c => !groupe || c.groupe === groupe)
  const nbDues = (g: string | null) => (cartes || []).filter(c => (!g || c.groupe === g) && aRevoir(c, etats)).length

  function commencer() {
    ratees.current = new Set()
    setBilan({ su: 0, presque: 0, rate: 0 })
    setRetournee(false)
    setFile(seance(duGroupe, etats))
  }

  function noter(r: Reponse) {
    if (!file?.length) return
    const c = file[0]
    const suivant = { ...etats, [c.id]: repondre(etats[c.id], r) }
    setEtats(suivant)
    sauver(suivant)
    setBilan(b => ({ ...b, [r]: b[r] + 1 }))
    // Une carte ratée revient une fois en fin de séance
    const reste = file.slice(1)
    if (r === "rate" && !ratees.current.has(c.id)) { ratees.current.add(c.id); reste.push(c) }
    setFile(reste)
    setRetournee(false)
  }

  const carte = file?.[0]
  const total = bilan.su + bilan.presque + bilan.rate + (file?.length || 0)
  const fait = bilan.su + bilan.presque + bilan.rate

  return (
    <div role="dialog" aria-modal="true" aria-label="Cartes de révision" style={{ position: "fixed", inset: 0, zIndex: 1150, background: "#F4F7FB", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", paddingTop: "calc(10px + env(safe-area-inset-top))", background: "#fff", borderBottom: `1px solid ${colors.border}` }}>
        <button onClick={() => void fermer()} style={{ border: "none", background: colors.blueLight, color: colors.blue, fontWeight: 600, fontSize: 13, padding: "8px 13px", borderRadius: radius.pill, cursor: "pointer" }}>← Réviser</button>
        <div style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: colors.navy }}>Cartes</div>
        {file && file.length > 0 && <span style={{ fontSize: 12.5, color: TEXTE_DOUX }}>{fait + 1} / {total}</span>}
      </div>
      {file && file.length > 0 && (
        <div aria-hidden="true" style={{ height: 4, background: "#E3E9F2" }}><div style={{ height: 4, width: `${(fait / Math.max(1, total)) * 100}%`, background: colors.green, transition: "width .3s" }} /></div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          {cartes === null && <div className="nx-skel" style={{ height: 260, borderRadius: radius.md }} />}

          {cartes && cartes.length === 0 && (
            <div style={{ background: "#fff", borderRadius: radius.md, padding: 20, border: `1px solid ${colors.blueBorder}` }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: colors.navy, marginBottom: 8 }}>Pas encore de cartes</div>
              <p style={{ fontSize: 14, color: colors.textMuted, lineHeight: 1.55, margin: 0 }}>
                Tes cartes se créent toutes seules à partir de :<br />
                • tes <b>passages surlignés</b> dans le Carnet (ils deviennent des phrases à trou) ;<br />
                • tes <b>encadrés « Définition » et « À retenir »</b> ;<br />
                • le <b>vocabulaire</b> de tes cours importés.
              </p>
            </div>
          )}

          {/* Choix de la séance */}
          {cartes && cartes.length > 0 && !file && (
            <>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {[null, ...groupes].map(g => (
                  <button key={g ?? "tout"} aria-pressed={groupe === g} onClick={() => setGroupe(g)}
                    style={{ flexShrink: 0, border: `1px solid ${groupe === g ? colors.navy : colors.blueBorder}`, background: groupe === g ? colors.navy : "#fff", color: groupe === g ? "#fff" : colors.text, borderRadius: radius.pill, padding: "6px 12px", fontSize: 12.5, cursor: "pointer", minHeight: 36, whiteSpace: "nowrap" }}>
                    {g ?? "Toutes"} <span style={{ opacity: 0.65 }}>{nbDues(g)}</span>
                  </button>
                ))}
              </div>
              <div style={{ background: "#fff", borderRadius: radius.md, padding: 20, border: `1px solid ${colors.blueBorder}`, textAlign: "center" }}>
                <div style={{ fontSize: 44, fontWeight: 700, color: colors.navy, fontFamily: "var(--font-display)" }}>{nbDues(groupe)}</div>
                <div style={{ fontSize: 14, color: colors.textMuted, marginBottom: 4 }}>carte{nbDues(groupe) > 1 ? "s" : ""} à revoir aujourd&apos;hui</div>
                <div style={{ fontSize: 12.5, color: TEXTE_DOUX, marginBottom: 16 }}>
                  {duGroupe.filter(c => estNouvelle(c, etats)).length} nouvelle{duGroupe.filter(c => estNouvelle(c, etats)).length > 1 ? "s" : ""} · {duGroupe.length} au total
                </div>
                <button onClick={commencer} disabled={nbDues(groupe) === 0}
                  style={{ background: colors.blue, color: "#fff", border: "none", borderRadius: radius.pill, padding: "12px 26px", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: nbDues(groupe) ? 1 : 0.45 }}>
                  {nbDues(groupe) ? "Commencer" : "Tout est révisé pour aujourd'hui"}
                </button>
              </div>
              <p style={{ fontSize: 12.5, color: TEXTE_DOUX, lineHeight: 1.5, margin: 0 }}>
                Une carte que tu sais revient dans 1, 2, 4, 8… jours. Une carte ratée revient tout de suite. Quelques minutes par jour suffisent.
              </p>
            </>
          )}

          {/* Carte en cours */}
          {carte && (
            <>
              <button onClick={() => setRetournee(r => !r)} aria-label={retournee ? "Cacher la réponse" : "Voir la réponse"}
                style={{ flex: 1, minHeight: 280, background: "#fff", border: `1px solid ${colors.blueBorder}`, borderRadius: 18, boxShadow: "0 6px 24px rgba(10,22,40,.08)", padding: "22px 20px", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 14 }}>
                <span style={{ fontSize: 11.5, color: TEXTE_DOUX, letterSpacing: 0.2 }}>{carte.contexte}</span>
                <span style={{ fontSize: 19, lineHeight: 1.45, color: colors.navy, fontWeight: 600 }}>{carte.recto}</span>
                {retournee ? (
                  <span style={{ borderTop: `1.5px dashed ${colors.blueBorder}`, paddingTop: 14, fontSize: 17, lineHeight: 1.5, color: colors.text }}>
                    <span style={{ background: "#FFE66D", borderRadius: 4, padding: "1px 4px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>{carte.verso}</span>
                  </span>
                ) : (
                  <span style={{ marginTop: "auto", alignSelf: "center", fontSize: 13, color: colors.blue }}>Touche pour voir la réponse</span>
                )}
              </button>
              {retournee && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, paddingBottom: "env(safe-area-inset-bottom)" }}>
                  {([["rate", "Pas su", "#C81E3F", "#FDECEF"], ["presque", "Presque", "#B45309", "#FFF4E0"], ["su", "Je savais", "#11744A", "#E6F6EE"]] as const).map(([r, nom, c, fond]) => (
                    <button key={r} onClick={() => noter(r)}
                      style={{ border: `1.5px solid ${c}`, background: fond, color: c, borderRadius: 14, padding: "14px 6px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{nom}</button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Fin de séance */}
          {file && file.length === 0 && (
            <div style={{ background: "#fff", borderRadius: radius.md, padding: 22, border: `1px solid ${colors.blueBorder}`, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: colors.navy, marginBottom: 6 }}>Séance terminée</div>
              <p style={{ fontSize: 14, color: colors.textMuted, margin: "0 0 14px" }}>
                <b style={{ color: "#11744A" }}>{bilan.su}</b> sues · <b style={{ color: "#B45309" }}>{bilan.presque}</b> presque · <b style={{ color: "#C81E3F" }}>{bilan.rate}</b> à retravailler
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {nbDues(groupe) > 0 && <button onClick={commencer} style={{ background: colors.blue, color: "#fff", border: "none", borderRadius: radius.pill, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Continuer ({nbDues(groupe)})</button>}
                <button onClick={() => setFile(null)} style={{ background: colors.blueLight, color: colors.blue, border: "none", borderRadius: radius.pill, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Retour</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
