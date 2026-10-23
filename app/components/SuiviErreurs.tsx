"use client"
import { useEffect } from "react"
import { signalerErreur } from "@/lib/signalerErreur"

// Signale les erreurs qui échappent à l'appli (scripts, promesses rejetées)
export default function SuiviErreurs() {
  useEffect(() => {
    const surErreur = (e: ErrorEvent) => signalerErreur(e.error ?? e.message, "fenetre")
    const surRejet = (e: PromiseRejectionEvent) => signalerErreur(e.reason, "promesse")
    window.addEventListener("error", surErreur)
    window.addEventListener("unhandledrejection", surRejet)
    return () => { window.removeEventListener("error", surErreur); window.removeEventListener("unhandledrejection", surRejet) }
  }, [])
  return null
}
