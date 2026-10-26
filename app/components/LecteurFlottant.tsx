"use client"
import { useEffect, useRef, useState } from "react"
import { arreter, fermerListe, ouvrirListe, useLecteur } from "@/lib/lecteurGlobal"
import { useMediaQuery } from "@/lib/useStockage"
import { useDeplacable } from "@/lib/deplacable"

// Le lecteur lui-même : un seul iframe pour toute l'appli, jamais recréé tant
// que la même vidéo joue. En grand, il se place sur l'emplacement de la fenêtre
// ouverte ; sinon, petite barre en bas (au-dessus de la navigation), que l'on
// peut déplacer en la glissant par sa poignée (⠿) ou par l'image.
// Il est piloté par l'API officielle du lecteur YouTube : lecture / pause,
// titre précédent / suivant, et choix d'un titre dans la liste de l'album.

type YTPlayer = {
  playVideo(): void; pauseVideo(): void; nextVideo(): void; previousVideo(): void; playVideoAt(i: number): void
  getPlaylist(): string[] | null; getPlaylistIndex(): number; getPlayerState(): number
  getVideoData(): { title?: string; author?: string }; destroy(): void
}
type YTNamespace = { Player: new (el: HTMLIFrameElement, o: { events: Record<string, (e: { data: number; target: YTPlayer }) => void> }) => YTPlayer }
declare global { interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void } }

// Script officiel chargé une seule fois
let apiPrete: Promise<YTNamespace> | null = null
function chargerApi(): Promise<YTNamespace> {
  if (!apiPrete) apiPrete = new Promise(ok => {
    if (window.YT?.Player) return ok(window.YT)
    const avant = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { avant?.(); ok(window.YT!) }
    const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; s.async = true
    document.head.appendChild(s)
  })
  return apiPrete
}

// Titres des vidéos d'une liste (service public oEmbed), gardés en mémoire
const titres = new Map<string, Promise<string | null>>()
function titreDe(id: string) {
  if (!titres.has(id)) titres.set(id, fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent("https://www.youtube.com/watch?v=" + id)}`)
    .then(r => (r.ok ? r.json() : null)).then(j => (j?.title ? String(j.title) : null)).catch(() => null))
  return titres.get(id)!
}

const MINI = { l: 64, h: 36 }
const avecApi = (src: string) => `${src}${src.includes("?") ? "&" : "?"}enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`

export default function LecteurFlottant() {
  const { lecture, ancre, liste } = useLecteur()
  const boite = useRef<HTMLDivElement>(null)
  const cadre = useRef<HTMLIFrameElement>(null)
  const lecteur = useRef<YTPlayer | null>(null)
  const [info, setInfo] = useState<{ joue: boolean; index: number; ids: string[]; titre?: string }>({ joue: false, index: 0, ids: [] })
  const [noms, setNoms] = useState<Record<string, string>>({})
  // Téléphone : moins de boutons, le titre ouvre la liste
  const etroit = useMediaQuery("(max-width: 430px)")
  const { placement, poignee } = useDeplacable("lecteur-position", boite)

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

  // Branche l'API YouTube sur l'iframe (à chaque nouvelle lecture)
  useEffect(() => {
    if (!lecture) return
    let actif = true
    const maj = (p: YTPlayer) => {
      if (!actif) return
      const d = p.getVideoData?.()
      setInfo({ joue: p.getPlayerState?.() === 1, index: Math.max(0, p.getPlaylistIndex?.() ?? 0), ids: p.getPlaylist?.() ?? [], titre: d?.title })
    }
    chargerApi().then(YT => {
      if (!actif || !cadre.current) return
      lecteur.current = new YT.Player(cadre.current, { events: { onReady: e => maj(e.target), onStateChange: e => maj(e.target) } })
    })
    return () => { actif = false; lecteur.current = null; setInfo({ joue: false, index: 0, ids: [] }) }
  }, [lecture])

  // Noms des titres quand on ouvre la liste
  useEffect(() => {
    if (!liste || !info.ids.length) return
    let actif = true
    info.ids.forEach(id => titreDe(id).then(t => { if (actif && t) setNoms(n => (n[id] ? n : { ...n, [id]: t })) }))
    return () => { actif = false }
  }, [liste, info.ids])

  if (!lecture) return null
  const grand = !!ancre
  const p = () => lecteur.current
  const plusieurs = info.ids.length > 1
  const bouton: React.CSSProperties = { flexShrink: 0, width: etroit ? 36 : 40, height: 40, borderRadius: 999, border: "none", background: "transparent", color: "#fff", fontSize: 17, cursor: "pointer", display: "grid", placeItems: "center" }
  const titreEnCours = info.titre || lecture.titre

  return (
    <>
      <div role="region" aria-label={grand ? "Lecteur" : `Lecture en cours : ${titreEnCours}`} ref={boite}
        style={grand
          ? { position: "fixed", zIndex: 1250, borderRadius: 12, overflow: "hidden", background: "#000" }
          : { position: "fixed", zIndex: 1150, right: 8, left: "auto", top: "auto", bottom: "calc(80px + env(safe-area-inset-bottom))", width: "min(340px, calc(100vw - 16px))", height: "auto",
              display: "flex", alignItems: "center", gap: 6, padding: "5px 4px 5px 0", borderRadius: 12, background: "rgba(10,22,40,.96)", color: "#fff", boxShadow: "0 10px 28px -10px rgba(0,0,0,.55)", ...placement }}>
        {!grand && <div {...poignee} title="Glisse pour déplacer (double appui : remettre en bas)" aria-hidden="true"
          style={{ ...poignee.style, width: 20, alignSelf: "stretch", marginRight: -4, display: "grid", placeItems: "center", color: "rgba(255,255,255,.45)", fontSize: 15, userSelect: "none" }}>⠿</div>}
        {/* YouTube met en pause un lecteur plus petit que 200 × 200 px : en petit, on garde
            l'iframe à sa taille normale (356 × 200) et on la réduit seulement à l'affichage */}
        <div {...(grand ? {} : poignee)} style={grand ? { position: "absolute", inset: 0 } : { ...poignee.style, position: "relative", width: MINI.l, height: MINI.h, flexShrink: 0, borderRadius: 6, overflow: "hidden", background: "#000" }}>
          <iframe ref={cadre} key={lecture.src} src={avecApi(lecture.src)} title={lecture.titre} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            style={grand
              ? { position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }
              : { position: "absolute", left: 0, top: 0, width: 356, height: 200, border: 0, transform: `scale(${MINI.l / 356})`, transformOrigin: "0 0", pointerEvents: "none" }} />
        </div>
        {!grand && (
          <>
            <button onClick={() => (plusieurs ? ouvrirListe() : undefined)} disabled={!plusieurs} aria-label={plusieurs ? "Choisir un titre" : undefined}
              style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", color: "#fff", padding: "0 2px", cursor: plusieurs ? "pointer" : "default" }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{titreEnCours}</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {plusieurs ? `${info.index + 1}/${info.ids.length}${etroit ? " · touche pour choisir" : ` · ${lecture.sousTitre ?? lecture.titre}`}` : lecture.sousTitre}
              </div>
            </button>
            {plusieurs && !etroit && <button onClick={() => p()?.previousVideo()} aria-label="Titre précédent" style={bouton}>⏮</button>}
            <button onClick={() => (info.joue ? p()?.pauseVideo() : p()?.playVideo())} aria-label={info.joue ? "Pause" : "Lecture"} style={{ ...bouton, fontSize: 18 }}>{info.joue ? "⏸" : "▶"}</button>
            {plusieurs && <button onClick={() => p()?.nextVideo()} aria-label="Titre suivant" style={bouton}>⏭</button>}
            {plusieurs && !etroit && <button onClick={ouvrirListe} aria-label="Choisir un titre" style={bouton}>☰</button>}
            <button onClick={arreter} aria-label="Arrêter la lecture" style={{ ...bouton, fontSize: 15, color: "rgba(255,255,255,.75)" }}>✕</button>
          </>
        )}
      </div>

      {liste && (
        <div role="dialog" aria-modal="true" aria-label="Choisir un titre" onClick={e => { if (e.target === e.currentTarget) fermerListe() }}
          style={{ position: "fixed", inset: 0, zIndex: 1300, background: "rgba(5,10,20,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 520, maxHeight: "75vh", display: "flex", flexDirection: "column", background: "#0F1B2E", color: "#fff", borderRadius: "16px 16px 0 0", paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 12px 8px 16px", borderBottom: "1px solid rgba(255,255,255,.1)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lecture.titre}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{info.ids.length} titres · touche un titre pour l&apos;écouter</div>
              </div>
              <button onClick={fermerListe} aria-label="Fermer la liste" style={{ ...bouton, border: "1px solid rgba(255,255,255,.2)", width: 44, height: 44 }}>✕</button>
            </div>
            <ol style={{ listStyle: "none", margin: 0, padding: "4px 0", overflowY: "auto" }}>
              {info.ids.map((id, i) => (
                <li key={id + i}>
                  <button onClick={() => { p()?.playVideoAt(i); fermerListe() }} aria-current={i === info.index}
                    style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", minHeight: 48, padding: "6px 16px", border: "none", cursor: "pointer",
                      background: i === info.index ? "rgba(43,127,255,.22)" : "transparent", color: "#fff", fontSize: 14 }}>
                    <span style={{ width: 22, textAlign: "right", color: i === info.index ? "#9EC2FF" : "rgba(255,255,255,.5)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{i === info.index && info.joue ? "♪" : i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{noms[id] ?? (i === info.index && info.titre ? info.titre : `Titre ${i + 1}`)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  )
}
