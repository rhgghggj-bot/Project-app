"use client"
import { ViewTransition } from "react"
import { usePathname } from "next/navigation"

// Types posés par les <Link transitionTypes={[...]}> :
// - nav-tab : onglets de la barre de navigation -> fondu
// - nav-forward / nav-back : liste -> détail et retour -> glissement horizontal
// Sans type (premier chargement, bouton retour du navigateur) : pas d'animation.
const animations = {
  "nav-tab": "nav-fade",
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
}

export default function PageFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const bare = pathname === "/presentation"

  if (bare) return <>{children}</>

  return (
    <div style={{ paddingBottom: "90px", paddingTop: "env(safe-area-inset-top)" }} className="md:pt-0 md:pb-0">
      {/* Bande sous la barre d'état iOS (PWA en black-translucent) : sombre pour que l'heure reste lisible */}
      <div aria-hidden="true" style={{ position: "fixed", top: 0, left: 0, right: 0, height: "env(safe-area-inset-top)", background: "#0A1628", zIndex: 1000 }} />
      {/* Sur ordinateur, l'appli est une colonne centrée au lieu de s'étirer sur tout l'écran */}
      <div className="nx-colonne">
        <ViewTransition key={pathname} enter={animations} exit={animations} default="none">
          <div>{children}</div>
        </ViewTransition>
      </div>
    </div>
  )
}
