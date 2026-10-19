"use client"
import { useEffect } from "react"
import { clavierOuvert, estEditable, garderCurseurVisible } from "@/lib/clavier"

// Pour toute l'appli : quand le clavier s'ouvre, qu'on tourne le téléphone ou
// qu'on tape en bas de l'écran, la ligne en cours reste visible. Pendant que le
// clavier est ouvert, <html data-clavier="ouvert"> permet de masquer ce qui
// prend de la place (barre de navigation du bas, en-têtes en paysage).
export default function ClavierConfort() {
  useEffect(() => {
    const vv = window.visualViewport
    let minuteries: ReturnType<typeof setTimeout>[] = []

    const marquer = () => {
      if (clavierOuvert()) document.documentElement.dataset.clavier = "ouvert"
      else delete document.documentElement.dataset.clavier
    }
    // Après une rotation ou l'ouverture du clavier, l'écran bouge pendant
    // quelques centaines de millisecondes : on revérifie plusieurs fois.
    const replacer = () => {
      marquer()
      minuteries.forEach(clearTimeout)
      minuteries = [0, 120, 350, 700].map(ms => setTimeout(() => { marquer(); garderCurseurVisible() }, ms))
    }
    const enTapant = (e: Event) => { if (estEditable(e.target as Element)) requestAnimationFrame(() => garderCurseurVisible()) }
    const auFocus = (e: FocusEvent) => { if (estEditable(e.target as Element)) replacer() }
    const auDepart = () => setTimeout(marquer, 50)

    vv?.addEventListener("resize", replacer)
    window.addEventListener("orientationchange", replacer)
    document.addEventListener("focusin", auFocus)
    document.addEventListener("focusout", auDepart)
    document.addEventListener("input", enTapant)
    return () => {
      minuteries.forEach(clearTimeout)
      vv?.removeEventListener("resize", replacer)
      window.removeEventListener("orientationchange", replacer)
      document.removeEventListener("focusin", auFocus)
      document.removeEventListener("focusout", auDepart)
      document.removeEventListener("input", enTapant)
      delete document.documentElement.dataset.clavier
    }
  }, [])
  return null
}
