"use client"
import { useEffect, useRef } from "react"
import { jouer, poserAncre, retirerAncre } from "@/lib/lecteurGlobal"

// Emplacement du lecteur dans une fenêtre : le lecteur partagé vient s'y
// afficher, et continue à jouer en petit quand la fenêtre se ferme.
export default function EmplacementLecteur({ src, titre, sousTitre }: { src: string; titre: string; sousTitre?: string }) {
  const zone = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = zone.current!
    jouer({ src, titre, sousTitre })
    poserAncre(el)
    return () => retirerAncre(el)
  }, [src, titre, sousTitre])
  return <div ref={zone} style={{ position: "absolute", inset: 0 }} aria-hidden="true" />
}
