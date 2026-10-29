"use client"
import { useRef, useState, useSyncExternalStore } from "react"
import { abonnerCalculatrice, calculer, ecrireNombre, fermerCalculatrice, lireCalculatrice } from "@/lib/calcul"
import { useDeplacable } from "@/lib/deplacable"

// Calculatrice flottante (scientifique) : s'ouvre depuis les défis, les
// estimations ou une page de révision, reste par-dessus la page sans la
// bloquer, et se déplace en la glissant par son en-tête.

const TOUCHES: { t: string; ins?: string; nom?: string; type?: "op" | "fn" | "egal" | "eff" | "ret" }[] = [
  { t: "C", type: "eff", nom: "Tout effacer" }, { t: "(", type: "op" }, { t: ")", type: "op" }, { t: "⌫", type: "ret", nom: "Effacer le dernier caractère" }, { t: "÷", type: "op", nom: "Diviser" },
  { t: "sin", ins: "sin(", type: "fn" }, { t: "7" }, { t: "8" }, { t: "9" }, { t: "×", type: "op", nom: "Multiplier" },
  { t: "cos", ins: "cos(", type: "fn" }, { t: "4" }, { t: "5" }, { t: "6" }, { t: "−", type: "op", nom: "Moins" },
  { t: "tan", ins: "tan(", type: "fn" }, { t: "1" }, { t: "2" }, { t: "3" }, { t: "+", type: "op", nom: "Plus" },
  { t: "√", ins: "√(", type: "fn", nom: "Racine carrée" }, { t: "0" }, { t: ",", nom: "Virgule" }, { t: "π", type: "fn", nom: "Pi" }, { t: "=", type: "egal", nom: "Égal" },
  { t: "x²", ins: "²", type: "fn", nom: "Au carré" }, { t: "xʸ", ins: "^", type: "fn", nom: "Puissance" }, { t: "log", ins: "log(", type: "fn" }, { t: "ln", ins: "ln(", type: "fn" }, { t: "%", type: "fn", nom: "Pour cent" },
]

const CLE_HISTORIQUE = "calculatrice-historique"
function lireHistorique(): { e: string; r: string }[] {
  try { const v = JSON.parse(localStorage.getItem(CLE_HISTORIQUE) || "[]"); return Array.isArray(v) ? v.slice(0, 10) : [] } catch { return [] }
}

export default function Calculatrice() {
  const { ouverte, utiliser } = useSyncExternalStore(abonnerCalculatrice, lireCalculatrice, lireCalculatrice)
  const boite = useRef<HTMLDivElement>(null)
  const { placement, poignee } = useDeplacable("calculatrice-position", boite)
  const [expr, setExpr] = useState("")
  const [avant, setAvant] = useState("")          // calcul précédent, affiché au-dessus
  const [fini, setFini] = useState(false)         // on vient d'appuyer sur « = »
  const [degres, setDegres] = useState(true)
  const [erreur, setErreur] = useState(false)
  const [reduite, setReduite] = useState(false)   // seulement l'écran : on voit mieux la page derrière
  // Les 10 derniers calculs, gardés sur l'appareil
  const [historique, setHistorique] = useState<{ e: string; r: string }[]>(lireHistorique)
  const [voirHistorique, setVoirHistorique] = useState(false)

  if (!ouverte) return null

  let apercu: number | null = null
  try { if (expr) apercu = calculer(expr, degres) } catch { apercu = null }

  function appuyer(k: (typeof TOUCHES)[number]) {
    setErreur(false)
    if (k.type === "eff") { setExpr(""); setAvant(""); setFini(false); return }
    if (k.type === "ret") { setExpr(e => e.replace(/(asin|acos|atan|sin|cos|tan|log|ln|√)\($|.$/, "")); setFini(false); return }
    if (k.type === "egal") { egal(); return }
    const ins = k.ins ?? k.t
    // Après « = » : + − × ÷ ^ ² % continuent avec le résultat, le reste commence un nouveau calcul
    const continuer = ["+", "−", "×", "÷", "^", "²", "%", ")"].includes(ins)
    setExpr(e => (fini && !continuer ? ins : e + ins))
    setFini(false)
  }

  function egal() {
    if (!expr) return
    try {
      const r = calculer(expr, degres)
      if (!isFinite(r)) throw new Error("infini")
      setAvant(`${expr} =`); setExpr(ecrireNombre(r)); setFini(true)
      if (expr !== ecrireNombre(r)) setHistorique(h => { const n = [{ e: expr, r: ecrireNombre(r) }, ...h].slice(0, 10); try { localStorage.setItem(CLE_HISTORIQUE, JSON.stringify(n)) } catch { /* historique non gardé */ } return n })
    } catch { setErreur(true) }
  }

  const resultat = fini ? (() => { try { return calculer(expr, degres) } catch { return null } })() : apercu
  const touche: React.CSSProperties = { minHeight: 40, borderRadius: 10, border: "none", fontSize: 17, cursor: "pointer", fontVariantNumeric: "tabular-nums" }

  return (
    <div ref={boite} role="dialog" aria-label="Calculatrice" data-sans-inversion
      style={{ position: "fixed", zIndex: 1260, right: 8, bottom: "calc(140px + env(safe-area-inset-bottom))", width: "min(290px, calc(100vw - 16px))",
        background: "#0F1B2E", color: "#fff", borderRadius: 16, boxShadow: "0 18px 40px -12px rgba(0,0,0,.6)", padding: "0 10px 10px", ...placement }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div {...poignee} title="Glisse pour déplacer (double appui : remettre à sa place)"
          style={{ ...poignee.style, flex: 1, minHeight: 40, display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.75)", userSelect: "none" }}>
          <span aria-hidden="true" style={{ fontSize: 15, color: "rgba(255,255,255,.45)" }}>⠿</span>Calculatrice
        </div>
        <button onClick={() => setDegres(d => !d)} aria-label={degres ? "Angles en degrés (toucher pour radians)" : "Angles en radians (toucher pour degrés)"}
          style={{ minHeight: 32, padding: "0 10px", borderRadius: 999, border: "1px solid rgba(255,255,255,.25)", background: "transparent", color: "#9EC2FF", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{degres ? "DEG" : "RAD"}</button>
        <button onClick={() => setVoirHistorique(v => !v)} aria-label="Derniers calculs" aria-expanded={voirHistorique}
          style={{ width: 36, height: 40, borderRadius: 999, border: "none", background: voirHistorique ? "rgba(255,255,255,.15)" : "transparent", color: "rgba(255,255,255,.75)", fontSize: 16, cursor: "pointer" }}>🕘</button>
        <button onClick={() => setReduite(r => !r)} aria-label={reduite ? "Afficher les touches" : "Réduire la calculatrice"} aria-expanded={!reduite}
          style={{ width: 36, height: 40, borderRadius: 999, border: "none", background: "transparent", color: "rgba(255,255,255,.75)", fontSize: 16, cursor: "pointer" }}>{reduite ? "▴" : "▾"}</button>
        <button onClick={fermerCalculatrice} aria-label="Fermer la calculatrice" style={{ width: 40, height: 40, borderRadius: 999, border: "none", background: "transparent", color: "rgba(255,255,255,.75)", fontSize: 16, cursor: "pointer" }}>✕</button>
      </div>
      <div style={{ background: "#09121F", borderRadius: 12, padding: "6px 12px", marginBottom: reduite ? 0 : 8, textAlign: "right" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", minHeight: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{avant}</div>
        <input value={expr} inputMode="none" aria-label="Calcul" placeholder="0" autoComplete="off" spellCheck={false}
          onChange={e => { setExpr(e.target.value); setFini(false); setErreur(false) }}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); egal() } if (e.key === "Escape") fermerCalculatrice() }}
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 22, textAlign: "right", fontVariantNumeric: "tabular-nums", padding: 0 }} />
        <div role="status" style={{ fontSize: 13, minHeight: 18, color: erreur ? "#FF9AA8" : "rgba(255,255,255,.55)", fontVariantNumeric: "tabular-nums" }}>
          {erreur ? "Calcul impossible, vérifie l'écriture" : !fini && apercu != null && expr !== ecrireNombre(apercu) ? `= ${ecrireNombre(apercu)}` : ""}
        </div>
      </div>
      {voirHistorique && (
        <div style={{ background: "#09121F", borderRadius: 12, padding: "6px 8px", marginBottom: 8, maxHeight: 170, overflowY: "auto" }}>
          {historique.length === 0 ? <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.55)", padding: 6 }}>Pas encore de calcul.</div> : (
            <>
              {historique.map((h, k) => (
                <button key={k} onClick={() => { setExpr(h.r); setAvant(`${h.e} =`); setFini(true); setVoirHistorique(false) }} title="Reprendre ce résultat"
                  style={{ display: "block", width: "100%", textAlign: "right", background: "none", border: "none", color: "#fff", padding: "6px 4px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,.08)", fontVariantNumeric: "tabular-nums" }}>
                  <span style={{ display: "block", fontSize: 11.5, color: "rgba(255,255,255,.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.e} =</span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{h.r}</span>
                </button>
              ))}
              <button onClick={() => { setHistorique([]); try { localStorage.removeItem(CLE_HISTORIQUE) } catch { /* rien */ } }} style={{ background: "none", border: "none", color: "#FFB4C0", fontSize: 12, padding: "6px 4px", cursor: "pointer" }}>Effacer l&apos;historique</button>
            </>
          )}
        </div>
      )}
      {!reduite && <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5 }}>
        {TOUCHES.map(k => (
          <button key={k.t} onClick={() => appuyer(k)} aria-label={k.nom ?? k.t}
            style={{ ...touche, fontSize: k.type === "fn" ? 14.5 : 17,
              background: k.type === "egal" ? "#2B7FFF" : k.type === "op" ? "#24344D" : k.type === "eff" || k.type === "ret" ? "#3A2A35" : k.type === "fn" ? "#1A283C" : "#2A3B55",
              color: k.type === "eff" || k.type === "ret" ? "#FFB4C0" : "#fff", fontWeight: k.type === "egal" ? 700 : 500 }}>{k.t}</button>
        ))}
      </div>}
      {utiliser && !reduite && (
        <button disabled={resultat == null || !isFinite(resultat)} onClick={() => { if (resultat != null) { utiliser(resultat); fermerCalculatrice() } }}
          style={{ ...touche, width: "100%", marginTop: 6, background: resultat == null ? "#24344D" : "#2E8B57", color: "#fff", fontSize: 14.5, fontWeight: 700, cursor: resultat == null ? "default" : "pointer" }}>
          {resultat == null ? "Calcule, puis utilise le résultat" : `Utiliser ${ecrireNombre(resultat)} comme réponse`}
        </button>
      )}
    </div>
  )
}
