"use client"
import { useState } from "react"
import { colors, radius } from "@/app/components/ui/tokens"

// Petite bulle d'aide montrée une seule fois, au bon moment. Une fois fermée,
// elle ne revient plus (mémorisé sur l'appareil).

const CLE = "etudes-astuces-vues"

function vues(): string[] {
  try { return JSON.parse(localStorage.getItem(CLE) || "[]") } catch { return [] }
}

export function astuceVue(id: string) {
  return typeof window !== "undefined" && vues().includes(id)
}

export default function Astuce({ id, children, style }: { id: string; children: React.ReactNode; style?: React.CSSProperties }) {
  const [visible, setVisible] = useState(() => typeof window !== "undefined" && !vues().includes(id))
  if (!visible) return null
  function fermer() {
    try { localStorage.setItem(CLE, JSON.stringify([...new Set([...vues(), id])])) } catch {}
    setVisible(false)
  }
  return (
    <div role="note" style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#FFF9E6", border: "1px solid #F2DB93", borderRadius: radius.md, padding: "10px 10px 10px 12px", margin: "0 0 12px", fontSize: 13, lineHeight: 1.45, color: colors.text, ...style }}>
      <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1.2 }}>💡</span>
      <span style={{ flex: 1 }}>{children}</span>
      <button onClick={fermer} aria-label="Fermer l'astuce" style={{ background: "none", border: "none", color: colors.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "2px 4px", minHeight: 28 }}>OK</button>
    </div>
  )
}
