"use client"
import { usePathname } from "next/navigation"

export default function PageFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const bare = pathname === "/presentation"

  if (bare) return <>{children}</>

  return (
    <div style={{ paddingBottom: "90px", paddingTop: "env(safe-area-inset-top)" }} className="md:pt-0 md:pb-0">
      {/* Bande sous la barre d'état iOS (PWA en black-translucent) : sombre pour que l'heure reste lisible */}
      <div aria-hidden="true" style={{ position: "fixed", top: 0, left: 0, right: 0, height: "env(safe-area-inset-top)", background: "#0A1628", zIndex: 1000 }} />
      {children}
    </div>
  )
}
