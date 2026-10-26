"use client"
import { useEffect, useRef, useState } from "react"

// Élément flottant que l'on déplace en le glissant (doigt ou souris) par sa
// poignée. La position est gardée sur l'appareil ; un double appui sur la
// poignée le remet à sa place d'origine.

type Pos = { x: number; y: number }

function borner(el: HTMLElement | null, x: number, y: number): Pos {
  const r = el?.getBoundingClientRect()
  const w = r?.width ?? 0, h = r?.height ?? 0
  return { x: Math.round(Math.min(Math.max(4, x), window.innerWidth - w - 4)), y: Math.round(Math.min(Math.max(4, y), window.innerHeight - h - 4)) }
}

function lire(cle: string): Pos | null {
  if (typeof window === "undefined") return null
  try { const v = JSON.parse(localStorage.getItem(cle) || "null"); return v && typeof v.x === "number" && typeof v.y === "number" ? v : null } catch { return null }
}

export function useDeplacable(cle: string, el: React.RefObject<HTMLElement | null>) {
  const [pos, setPos] = useState<Pos | null>(() => lire(cle))
  const geste = useRef<{ dx: number; dy: number; bouge: boolean } | null>(null)
  const place = pos != null

  // Écran tourné ou fenêtre réduite : l'élément reste visible
  useEffect(() => {
    if (!place) return
    const f = () => setPos(p => (p ? borner(el.current, p.x, p.y) : p))
    window.addEventListener("resize", f)
    return () => window.removeEventListener("resize", f)
  }, [place, el])

  const poignee = {
    onPointerDown(e: React.PointerEvent) {
      if (!el.current || (e.pointerType === "mouse" && e.button !== 0)) return
      const r = el.current.getBoundingClientRect()
      geste.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, bouge: false }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove(e: React.PointerEvent) {
      const g = geste.current
      if (!g) return
      g.bouge = true
      setPos(borner(el.current, e.clientX - g.dx, e.clientY - g.dy))
    },
    onPointerUp() {
      const g = geste.current
      geste.current = null
      if (!g?.bouge) return
      setPos(p => { try { if (p) localStorage.setItem(cle, JSON.stringify(p)) } catch { /* sans stockage : position oubliée au rechargement */ } return p })
    },
    onPointerCancel() { geste.current = null },
    onDoubleClick() {
      setPos(null)
      try { localStorage.removeItem(cle) } catch { /* rien à effacer */ }
    },
    style: { touchAction: "none", cursor: "grab" } as React.CSSProperties,
  }

  // Style à appliquer à l'élément quand il a été déplacé
  const placement: React.CSSProperties | null = pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : null
  return { placement, poignee }
}
