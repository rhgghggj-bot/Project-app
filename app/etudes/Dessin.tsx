"use client"
import { useEffect, useRef, useState } from "react"
import { colors, radius } from "@/app/components/ui/tokens"
import { FOND_CAHIER } from "./cahier"

// Feuille de dessin du carnet : stylo, surligneur et gomme, au doigt, à la
// souris ou au stylet (la pression de l'Apple Pencil épaissit le trait).
// Le résultat est un PNG transparent inséré dans la note, posé sur le même
// papier quadrillé.

type Outil = "stylo" | "surligneur" | "gomme"

const ENCRES = [
  { nom: "Noir", valeur: "#1a1a2e" },
  { nom: "Bleu", valeur: "#2B7FFF" },
  { nom: "Rouge", valeur: "#E11D48" },
  { nom: "Vert", valeur: "#0E9F6E" },
]
const HAUTEUR = 440

export default function Dessin({ onInserer, onFermer }: { onInserer: (png: Blob) => void; onFermer: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [outil, setOutil] = useState<Outil>("stylo")
  const [encre, setEncre] = useState(ENCRES[0].valeur)
  const [vide, setVide] = useState(true)
  const historique = useRef<{ image: ImageData; vide: boolean }[]>([])
  const [nbAnnulations, setNbAnnulations] = useState(0)
  const trait = useRef<{ x: number; y: number } | null>(null)
  // Un seul doigt ou stylet trace à la fois
  const pointeur = useRef<number | null>(null)
  // Surligneur : tout le trait est redessiné d'un coup pour une couleur
  // uniforme (sinon les segments se superposent et font des pois)
  const points = useRef<{ x: number; y: number }[]>([])
  // Dès qu'un stylet a servi, les contacts du doigt (la paume) sont ignorés
  const stylet = useRef(false)

  useEffect(() => {
    function echap(e: KeyboardEvent) { if (e.key === "Escape") { e.stopPropagation(); onFermer() } }
    window.addEventListener("keydown", echap, true)
    return () => window.removeEventListener("keydown", echap, true)
  }, [onFermer])

  useEffect(() => {
    const c = canvasRef.current!
    const ratio = window.devicePixelRatio || 1
    c.width = c.clientWidth * ratio
    c.height = HAUTEUR * ratio
    const ctx = c.getContext("2d")!
    ctx.scale(ratio, ratio)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  function point(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  function debut(e: React.PointerEvent) {
    if (e.pointerType === "pen") stylet.current = true
    else if (e.pointerType === "touch" && stylet.current) return
    if (trait.current) return
    const c = canvasRef.current!
    c.setPointerCapture(e.pointerId)
    pointeur.current = e.pointerId
    const ctx = c.getContext("2d")!
    historique.current = [...historique.current.slice(-19), { image: ctx.getImageData(0, 0, c.width, c.height), vide }]
    setNbAnnulations(historique.current.length)
    trait.current = point(e)
    points.current = [trait.current]
    tracer(e)
  }

  function tracer(e: React.PointerEvent) {
    if (!trait.current || e.pointerId !== pointeur.current) return
    const c = canvasRef.current!
    const ctx = c.getContext("2d")!
    const p = point(e)
    if (outil === "surligneur") {
      points.current.push(p)
      const depart = historique.current[historique.current.length - 1]
      if (depart) ctx.putImageData(depart.image, 0, 0)
      ctx.globalCompositeOperation = "multiply"
      ctx.globalAlpha = 0.4
      ctx.strokeStyle = "#FACC15"
      ctx.lineWidth = 18
      ctx.beginPath()
      points.current.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)))
      if (points.current.length === 1) ctx.lineTo(p.x + 0.01, p.y)
      ctx.stroke()
      ctx.globalCompositeOperation = "source-over"
      ctx.globalAlpha = 1
      trait.current = p
      if (vide) setVide(false)
      return
    }
    const pression = e.pointerType === "pen" ? Math.max(0.2, e.pressure || 0.5) : 0.5
    ctx.globalCompositeOperation = outil === "gomme" ? "destination-out" : "source-over"
    ctx.strokeStyle = encre
    ctx.lineWidth = outil === "gomme" ? 22 : 1.2 + pression * 3.2
    ctx.beginPath()
    ctx.moveTo(trait.current.x, trait.current.y)
    ctx.lineTo(p.x + 0.01, p.y)
    ctx.stroke()
    trait.current = p
    if (vide && outil !== "gomme") setVide(false)
  }

  function fin(e: React.PointerEvent) {
    if (e.pointerId !== pointeur.current) return
    trait.current = null
    pointeur.current = null
  }

  function annuler() {
    const c = canvasRef.current!
    const precedent = historique.current.pop()
    if (precedent) { c.getContext("2d")!.putImageData(precedent.image, 0, 0); setVide(precedent.vide) }
    setNbAnnulations(historique.current.length)
  }

  function effacer() {
    const c = canvasRef.current!
    const ctx = c.getContext("2d")!
    historique.current = [...historique.current.slice(-19), { image: ctx.getImageData(0, 0, c.width, c.height), vide }]
    setNbAnnulations(historique.current.length)
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.restore()
    setVide(true)
  }

  function inserer() {
    canvasRef.current!.toBlob(b => { if (b) onInserer(b) }, "image/png")
  }

  const bouton = (actif: boolean): React.CSSProperties => ({
    border: `1px solid ${actif ? colors.navy : colors.blueBorder}`, background: actif ? colors.navy : "#fff", color: actif ? "#fff" : colors.text,
    borderRadius: radius.pill, padding: "7px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer", minHeight: 44, minWidth: 44,
  })

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="titre-dessin" style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(10,22,40,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 720, borderRadius: "18px 18px 0 0", padding: "14px 14px calc(14px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={onFermer} style={{ ...bouton(false), border: "none", color: colors.textMuted }}>Annuler</button>
          <div id="titre-dessin" style={{ flex: 1, textAlign: "center", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "16px", color: colors.text }}>Dessin</div>
          <button onClick={inserer} disabled={vide} style={{ ...bouton(true), background: colors.blue, borderColor: colors.blue, opacity: vide ? 0.4 : 1 }}>Insérer</button>
        </div>

        <canvas ref={canvasRef} aria-label="Zone de dessin, au doigt, au stylet ou à la souris" role="application"
          onPointerDown={debut} onPointerMove={tracer} onPointerUp={fin} onPointerCancel={fin} onPointerLeave={fin}
          style={{ width: "100%", height: HAUTEUR, touchAction: "none", borderRadius: radius.sm, border: `1px solid ${colors.blueBorder}`, cursor: "crosshair", ...FOND_CAHIER }} />

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }} role="toolbar" aria-label="Outils de dessin">
          <button style={bouton(outil === "stylo")} aria-pressed={outil === "stylo"} onClick={() => setOutil("stylo")}>Stylo</button>
          <button style={bouton(outil === "surligneur")} aria-pressed={outil === "surligneur"} onClick={() => setOutil("surligneur")}>Surligneur</button>
          <button style={bouton(outil === "gomme")} aria-pressed={outil === "gomme"} onClick={() => setOutil("gomme")}>Gomme</button>
          <span style={{ width: 1, height: 24, background: colors.blueBorder, margin: "0 4px" }} aria-hidden="true" />
          {ENCRES.map(e => (
            <button key={e.valeur} aria-label={`Encre ${e.nom.toLowerCase()}`} aria-pressed={encre === e.valeur && outil === "stylo"}
              onClick={() => { setEncre(e.valeur); setOutil("stylo") }}
              style={{ width: 36, height: 36, borderRadius: "50%", background: e.valeur, cursor: "pointer", border: "3px solid #fff",
                boxShadow: encre === e.valeur && outil === "stylo" ? `0 0 0 2px ${e.valeur}` : `0 0 0 1px ${colors.blueBorder}` }} />
          ))}
          <span style={{ flex: 1 }} />
          <button style={bouton(false)} onClick={annuler} disabled={!nbAnnulations} aria-label="Annuler le dernier trait">↶</button>
          <button style={bouton(false)} onClick={effacer} disabled={vide}>Tout effacer</button>
        </div>
      </div>
    </div>
  )
}
