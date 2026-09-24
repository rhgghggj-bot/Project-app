import { useEffect } from "react"
import type { KeyboardEvent } from "react"

// Pour un élément non-bouton rendu cliquable (role="button") : Entrée et Espace déclenchent l'action.
export function onActivate(action: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      action()
    }
  }
}

// Ferme une fenêtre (feuille, menu, modale) avec la touche Échap tant qu'elle est ouverte.
export function useEscape(active: boolean, close: () => void) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active, close])
}
