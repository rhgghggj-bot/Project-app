"use client"
import { useState } from "react"
import SplashScreen from "./SplashScreen"
import { ecrireStockage, useEstClient, useStockageSession } from "@/lib/useStockage"

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  // Rien au rendu serveur, puis l'écran d'accueil une seule fois par session
  const estClient = useEstClient()
  const dejaVu = useStockageSession("splashDone")
  const [termine, setTermine] = useState(false)

  const handleDone = () => {
    setTermine(true)
    ecrireStockage("session", "splashDone", "1")
  }

  if (!estClient) return null

  if (!dejaVu && !termine) return <SplashScreen onDone={handleDone} />

  return <>{children}</>
}
