"use client"
import { useState } from "react"
import { usePathname } from "next/navigation"
import SplashScreen from "./SplashScreen"
import { ecrireStockage, useEstClient, useStockageSession } from "@/lib/useStockage"
import { PAGES_PUBLIQUES } from "@/lib/legal"

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  // Rien au rendu serveur, puis l'écran d'accueil une seule fois par session
  const estClient = useEstClient()
  const dejaVu = useStockageSession("splashDone")
  const [termine, setTermine] = useState(false)
  const publique = PAGES_PUBLIQUES.includes(usePathname())

  const handleDone = () => {
    setTermine(true)
    ecrireStockage("session", "splashDone", "1")
  }

  // Pages publiques : rendues tout de suite, dès le serveur (référencement et
  // vitesse d'affichage), sans écran d'accueil animé
  if (publique) return <>{children}</>
  if (!estClient) return null

  if (!dejaVu && !termine) return <SplashScreen onDone={handleDone} />

  return <>{children}</>
}
