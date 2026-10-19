"use client"
import { useState } from "react"
import type { EvenementCalendrier } from "@/lib/types"

const JOURS = ["L", "M", "M", "J", "V", "S", "D"]

// Vue du mois : une grille de dates avec un point par événement. Toucher un
// jour ouvre la semaine correspondante, ce jour sélectionné.
export default function VueMois({ evtDuJour, onChoisir }: { evtDuJour: (d: Date) => EvenementCalendrier[]; onChoisir: (d: Date) => void }) {
  const [decalage, setDecalage] = useState(0)
  const aujourdhui = new Date()
  const premier = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + decalage, 1)
  const debut = new Date(premier)
  debut.setDate(1 - ((premier.getDay() || 7) - 1))   // lundi de la première semaine
  const nbSemaines = Math.ceil((((premier.getDay() || 7) - 1) + new Date(premier.getFullYear(), premier.getMonth() + 1, 0).getDate()) / 7)
  const jours = Array.from({ length: nbSemaines * 7 }, (_, i) => { const d = new Date(debut); d.setDate(debut.getDate() + i); return d })
  const btn = { width: 28, height: 28, borderRadius: "50%", border: "none", background: "#EEF5FF", color: "#2B7FFF", cursor: "pointer", fontSize: 16 } as const

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <button aria-label="Mois précédent" onClick={() => setDecalage(d => d - 1)} style={btn}>‹</button>
        <button onClick={() => setDecalage(0)} style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e", background: "none", border: "none", cursor: "pointer", textTransform: "capitalize" }}>
          {premier.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </button>
        <button aria-label="Mois suivant" onClick={() => setDecalage(d => d + 1)} style={btn}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 2 }}>
        {JOURS.map((j, i) => <div key={i} style={{ fontSize: 10, color: "#aaa", textAlign: "center", fontWeight: 500, paddingBottom: 4 }}>{j}</div>)}
        {jours.map(d => {
          const dansMois = d.getMonth() === premier.getMonth()
          const estAujourdhui = d.toDateString() === aujourdhui.toDateString()
          const evts = dansMois ? evtDuJour(d) : []
          return (
            <button key={d.toISOString()} onClick={() => onChoisir(d)} aria-label={`${d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}, ${evts.length} événement${evts.length > 1 ? "s" : ""}`}
              style={{ border: "none", background: "none", padding: "4px 0", minHeight: 44, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, opacity: dansMois ? 1 : 0.3 }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 500,
                background: estAujourdhui ? "#2B7FFF" : "transparent", color: estAujourdhui ? "#fff" : "#1a1a2e", fontVariantNumeric: "tabular-nums" }}>{d.getDate()}</span>
              <span style={{ display: "flex", gap: 2, height: 6 }}>
                {evts.slice(0, 3).map((e, k) => <i key={k} style={{ width: 5, height: 5, borderRadius: "50%", background: e.couleur || "#2B7FFF" }} />)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
