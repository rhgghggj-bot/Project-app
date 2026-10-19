"use client"
import { useEffect, useRef, useState } from "react"
import { colors, radius } from "@/app/components/ui/tokens"
import { FOND_CAHIER } from "./cahier"

// Feuille d'écriture du carnet : stylo, surligneur et gomme, au doigt, à la
// souris ou au stylet (la pression de l'Apple Pencil épaissit le trait ; dès
// qu'un stylet a servi, la paume posée sur l'écran est ignorée).
// Chaque trait est gardé : l'écriture se rouvre plus tard pour être complétée
// ou corrigée. Le résultat est un PNG transparent posé sur le papier quadrillé.

type Outil = "stylo" | "surligneur" | "gomme"
export type Trait = { o: Outil; c: string; p: [number, number, number][] }   // points : x, y, pression
export type Ecriture = { largeur: number; hauteur: number; traits: Trait[] }

const ENCRES = [
  { nom: "Noir", valeur: "#1a1a2e" },
  { nom: "Bleu", valeur: "#2B7FFF" },
  { nom: "Rouge", valeur: "#E11D48" },
  { nom: "Vert", valeur: "#0E9F6E" },
]
const HAUTEUR = 440
const AJOUT = 320

function dessinerTrait(ctx: CanvasRenderingContext2D, t: Trait, k: number) {
  const pts = t.p
  if (!pts.length) return
  ctx.save()
  ctx.lineCap = "round"; ctx.lineJoin = "round"
  if (t.o === "surligneur") {
    ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = 0.4; ctx.strokeStyle = "#FACC15"; ctx.lineWidth = 18 * k
    ctx.beginPath()
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k)))
    if (pts.length === 1) ctx.lineTo(pts[0][0] * k + 0.01, pts[0][1] * k)
    ctx.stroke()
  } else {
    ctx.globalCompositeOperation = t.o === "gomme" ? "destination-out" : "source-over"
    ctx.strokeStyle = t.c
    // Courbe lissée : on passe par le milieu de chaque segment
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[Math.min(pts.length - 1, i + 1)]
      ctx.lineWidth = (t.o === "gomme" ? 22 : 1.2 + b[2] * 3.2) * k
      ctx.beginPath()
      ctx.moveTo(((a[0] + b[0]) / 2) * k, ((a[1] + b[1]) / 2) * k)
      ctx.quadraticCurveTo(b[0] * k, b[1] * k, ((b[0] + c[0]) / 2) * k + 0.01, ((b[1] + c[1]) / 2) * k)
      ctx.stroke()
    }
  }
  ctx.restore()
}

export default function Dessin({ initiale, onInserer, onFermer }: {
  initiale?: Ecriture | null
  onInserer: (png: Blob, ecriture: Ecriture) => void
  onFermer: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [outil, setOutil] = useState<Outil>("stylo")
  const [encre, setEncre] = useState(ENCRES[0].valeur)
  // Rouvrir une écriture faite sur un écran d'une autre largeur : on garde les proportions
  const [depart] = useState(() => {
    if (!initiale) return { traits: [] as Trait[], hauteur: HAUTEUR }
    const largeur = Math.min(820, window.innerWidth) - 26   // largeur de la feuille sur cet écran
    const k = initiale.largeur ? largeur / initiale.largeur : 1
    return {
      traits: initiale.traits.map(t => ({ ...t, p: t.p.map(([x, y, p]) => [x * k, y * k, p] as [number, number, number]) })),
      hauteur: Math.max(HAUTEUR, Math.round(initiale.hauteur * k)),
    }
  })
  const [traits, setTraits] = useState<Trait[]>(depart.traits)
  const [hauteur, setHauteur] = useState(depart.hauteur)
  const enCours = useRef<{ trait: Trait; pointeur: number } | null>(null)
  const stylet = useRef(false)

  useEffect(() => {
    function echap(e: KeyboardEvent) { if (e.key === "Escape") { e.stopPropagation(); onFermer() } }
    window.addEventListener("keydown", echap, true)
    return () => window.removeEventListener("keydown", echap, true)
  }, [onFermer])

  // Le canevas est redessiné entièrement à chaque changement (taille, annulation…)
  useEffect(() => {
    const c = canvasRef.current!
    const ratio = window.devicePixelRatio || 1
    c.width = c.clientWidth * ratio
    c.height = hauteur * ratio
    const ctx = c.getContext("2d")!
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    traits.forEach(t => dessinerTrait(ctx, t, 1))
  }, [traits, hauteur])

  function point(e: React.PointerEvent): [number, number, number] {
    const r = canvasRef.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top, e.pointerType === "pen" ? Math.max(0.2, e.pressure || 0.5) : 0.5]
  }

  function debut(e: React.PointerEvent) {
    if (e.pointerType === "pen") stylet.current = true
    else if (e.pointerType === "touch" && stylet.current) return
    if (enCours.current) return
    canvasRef.current!.setPointerCapture(e.pointerId)
    enCours.current = { trait: { o: outil, c: encre, p: [point(e)] }, pointeur: e.pointerId }
    dessinerTrait(canvasRef.current!.getContext("2d")!, enCours.current.trait, 1)
  }

  function tracer(e: React.PointerEvent) {
    const t = enCours.current
    if (!t || e.pointerId !== t.pointeur) return
    t.trait.p.push(point(e))
    const ctx = canvasRef.current!.getContext("2d")!
    if (t.trait.o === "surligneur") {
      // Le surligneur est redessiné d'un coup pour une couleur uniforme
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore()
      traits.forEach(x => dessinerTrait(ctx, x, 1))
      dessinerTrait(ctx, t.trait, 1)
    } else {
      dessinerTrait(ctx, { ...t.trait, p: t.trait.p.slice(-3) }, 1)
    }
  }

  function fin(e: React.PointerEvent) {
    const t = enCours.current
    if (!t || e.pointerId !== t.pointeur) return
    enCours.current = null
    setTraits(prev => [...prev, t.trait])
  }

  const vide = !traits.some(t => t.o !== "gomme")

  function inserer() {
    const c = canvasRef.current!
    const ecriture: Ecriture = { largeur: c.clientWidth, hauteur, traits }
    c.toBlob(b => { if (b) onInserer(b, ecriture) }, "image/png")
  }

  const bouton = (actif: boolean): React.CSSProperties => ({
    border: `1px solid ${actif ? colors.navy : colors.blueBorder}`, background: actif ? colors.navy : "#fff", color: actif ? "#fff" : colors.text,
    borderRadius: radius.pill, padding: "7px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer", minHeight: 44, minWidth: 44,
  })

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="titre-dessin" style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(10,22,40,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 820, height: "100dvh", maxHeight: "100dvh", padding: "calc(10px + env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={onFermer} style={{ ...bouton(false), border: "none", color: colors.textMuted }}>Annuler</button>
          <div id="titre-dessin" style={{ flex: 1, textAlign: "center", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "16px", color: colors.text }}>Écriture à la main</div>
          <button onClick={inserer} disabled={vide} style={{ ...bouton(true), background: colors.blue, borderColor: colors.blue, opacity: vide ? 0.4 : 1 }}>{initiale ? "Mettre à jour" : "Insérer"}</button>
        </div>

        <div role="toolbar" aria-label="Outils d'écriture" style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <button style={bouton(outil === "stylo")} aria-pressed={outil === "stylo"} onClick={() => setOutil("stylo")}>Stylo</button>
          <button style={bouton(outil === "surligneur")} aria-pressed={outil === "surligneur"} onClick={() => setOutil("surligneur")}>Surligneur</button>
          <button style={bouton(outil === "gomme")} aria-pressed={outil === "gomme"} onClick={() => setOutil("gomme")}>Gomme</button>
          <span style={{ width: 1, height: 24, background: colors.blueBorder, margin: "0 4px" }} aria-hidden="true" />
          {ENCRES.map(x => (
            <button key={x.valeur} aria-label={`Encre ${x.nom.toLowerCase()}`} aria-pressed={encre === x.valeur && outil === "stylo"}
              onClick={() => { setEncre(x.valeur); setOutil("stylo") }}
              style={{ width: 36, height: 36, borderRadius: "50%", background: x.valeur, cursor: "pointer", border: "3px solid #fff",
                boxShadow: encre === x.valeur && outil === "stylo" ? `0 0 0 2px ${x.valeur}` : `0 0 0 1px ${colors.blueBorder}` }} />
          ))}
          <span style={{ flex: 1 }} />
          <button style={bouton(false)} onClick={() => setTraits(t => t.slice(0, -1))} disabled={!traits.length} aria-label="Annuler le dernier trait">↶</button>
          <button style={bouton(false)} onClick={() => setTraits([])} disabled={!traits.length}>Tout effacer</button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", borderRadius: radius.sm, border: `1px solid ${colors.blueBorder}` }}>
          <canvas ref={canvasRef} aria-label="Zone d'écriture, au stylet, au doigt ou à la souris" role="application"
            onPointerDown={debut} onPointerMove={tracer} onPointerUp={fin} onPointerCancel={fin}
            style={{ display: "block", width: "100%", height: hauteur, touchAction: "none", cursor: "crosshair", ...FOND_CAHIER }} />
          <button onClick={() => setHauteur(h => h + AJOUT)} style={{ ...bouton(false), display: "block", width: "100%", borderRadius: 0, border: "none", borderTop: `1px dashed ${colors.blueBorder}` }}>
            + Agrandir la page
          </button>
        </div>
      </div>
    </div>
  )
}
