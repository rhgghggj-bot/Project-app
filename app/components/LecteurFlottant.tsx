"use client"
import { useEffect, useRef } from "react"
import { arreter, useLecteur } from "@/lib/lecteurGlobal"

// Le lecteur lui-même : un seul iframe pour toute l'appli, jamais recréé tant
// que la même vidéo joue. En grand, il se place sur l'emplacement de la fenêtre
// ouverte ; sinon, petite barre en bas (au-dessus de la navigation).
export default function LecteurFlottant() {
  const { lecture, ancre } = useLecteur()
  const boite = useRef<HTMLDivElement>(null)

  // Suit la position de l'emplacement (défilement, rotation, animation d'ouverture)
  useEffect(() => {
    const b = boite.current
    if (!b || !ancre) return
    let id = 0
    const suivre = () => {
      const r = ancre.getBoundingClientRect()
      b.style.top = `${r.top}px`; b.style.left = `${r.left}px`; b.style.width = `${r.width}px`; b.style.height = `${r.height}px`
      id = requestAnimationFrame(suivre)
    }
    suivre()
    return () => cancelAnimationFrame(id)
  }, [ancre, lecture])

  if (!lecture) return null
  const grand = !!ancre
  return (
    <div role="region" aria-label={grand ? "Lecteur" : `Lecture en cours : ${lecture.titre}`}
      style={grand
        ? { position: "fixed", zIndex: 1250, borderRadius: 12, overflow: "hidden", background: "#000" }
        : { position: "fixed", zIndex: 1150, right: 12, left: "auto", top: "auto", bottom: "calc(84px + env(safe-area-inset-bottom))", width: "min(380px, calc(100vw - 24px))", height: "auto",
            display: "flex", alignItems: "center", gap: 10, padding: 8, borderRadius: 14, background: "#0A1628", color: "#fff", boxShadow: "0 14px 34px -12px rgba(0,0,0,.55)" }}
      ref={boite}>
      <div style={grand ? { position: "absolute", inset: 0 } : { position: "relative", width: 128, flexShrink: 0, aspectRatio: "16 / 9", borderRadius: 8, overflow: "hidden", background: "#000" }}>
        <iframe key={lecture.src} src={lecture.src} title={lecture.titre} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
      </div>
      {!grand && (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lecture.titre}</div>
            {lecture.sousTitre && <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lecture.sousTitre}</div>}
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 2 }}>Continue pendant que tu navigues</div>
          </div>
          <button onClick={arreter} aria-label="Arrêter la lecture" style={{ flexShrink: 0, minWidth: 44, minHeight: 44, borderRadius: 999, border: "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.08)", color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
        </>
      )}
    </div>
  )
}
