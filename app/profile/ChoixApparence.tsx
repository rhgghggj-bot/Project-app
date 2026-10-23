"use client"
import { ecrireStockage, useStockageLocal } from "@/lib/useStockage"

// Apparence de l'appli : suit le téléphone (automatique), toujours claire ou toujours sombre
const CHOIX = [
  { id: "auto", nom: "Automatique" },
  { id: "clair", nom: "Clair" },
  { id: "sombre", nom: "Sombre" },
] as const

function choisir(id: string) {
  ecrireStockage("local", "theme", id)
  document.documentElement.dataset.theme = id
}

export default function ChoixApparence() {
  const actuel = useStockageLocal("theme") ?? "auto"
  return (
    <div style={{ marginBottom: 20 }}>
      <div id="titre-apparence" style={{ fontSize: 13, fontWeight: 600, color: "#1a1a2e", marginBottom: 8 }}>Apparence</div>
      <div role="radiogroup" aria-labelledby="titre-apparence" style={{ display: "flex", gap: 6, background: "#F1F4F9", borderRadius: 14, padding: 4 }}>
        {CHOIX.map(c => (
          <button key={c.id} role="radio" aria-checked={actuel === c.id} onClick={() => choisir(c.id)}
            style={{ flex: 1, minHeight: 40, borderRadius: 10, border: "none", fontSize: 13.5, fontWeight: actuel === c.id ? 600 : 500, cursor: "pointer",
              background: actuel === c.id ? "#fff" : "transparent", color: actuel === c.id ? "#1a1a2e" : "#666", boxShadow: actuel === c.id ? "0 1px 3px rgba(10,22,40,.12)" : "none" }}>
            {c.nom}
          </button>
        ))}
      </div>
    </div>
  )
}
