"use client"
import { useEffect, useRef, useState } from "react"
import { colors, radius } from "@/app/components/ui/tokens"
import { toast, confirmer } from "@/lib/toast"
import { COLLECTIONS, lecteurYoutube, miniature, type EtatVideos } from "@/lib/videos"
import {
  THEMES_ENTRAINEMENT, duree, envoyerVideo, lireVideo, preparerVideo, supprimerVideo, surAppareil, taille, type VideoPerso,
} from "@/lib/videosPerso"

// Mes vidéos d'entraînement : filmer ou choisir une vidéo, la compresser,
// la ranger par thème et la revoir au ralenti, même sans réseau.
const QUOTA = 1e9   // stockage gratuit Supabase : 1 Go

type Envoi = { fichier: File; titre: string; theme: string; etape: "choix" | "compression" | "envoi"; progres: number }

export default function MesEntrainements({ userId, etat, maj }: { userId: string; etat: EtatVideos; maj: (f: (e: EtatVideos) => EtatVideos) => void }) {
  const [envoi, setEnvoi] = useState<Envoi | null>(null)
  const [theme, setTheme] = useState<string>("tous")
  const [ouverte, setOuverte] = useState<VideoPerso | null>(null)
  const [locales, setLocales] = useState<Record<string, boolean>>({})
  const filmer = useRef<HTMLInputElement>(null)
  const choisir = useRef<HTMLInputElement>(null)
  const videos = etat.entrainements
  const utilise = videos.reduce((a, v) => a + v.taille, 0)

  // Quelles vidéos sont déjà sur cet appareil (regardables sans réseau)
  useEffect(() => {
    let actif = true
    Promise.all(videos.map(async v => [v.id, await surAppareil(v.id)] as const)).then(r => { if (actif) setLocales(Object.fromEntries(r)) })
    return () => { actif = false }
  }, [videos])

  function choisirFichier(f?: File) {
    if (!f) return
    if (!f.type.startsWith("video/")) return toast("Choisis un fichier vidéo", "error")
    const jour = new Date().toLocaleDateString("fr-CH", { day: "numeric", month: "long" })
    setEnvoi({ fichier: f, titre: `Entraînement du ${jour}`, theme: "Tirs", etape: "choix", progres: 0 })
  }

  async function enregistrer() {
    if (!envoi) return
    if (!navigator.onLine) return toast("Connecte-toi pour envoyer la vidéo", "error")
    const id = crypto.randomUUID()
    try {
      setEnvoi(e => e && { ...e, etape: "compression", progres: 0 })
      const c = await preparerVideo(envoi.fichier, p => setEnvoi(e => e && { ...e, progres: p }))
      if (utilise + c.blob.size > QUOTA) throw new Error("Ton stockage est plein (1 Go). Supprime d'anciennes vidéos.")
      setEnvoi(e => e && { ...e, etape: "envoi" })
      const chemin = await envoyerVideo(userId, id, c)
      const v: VideoPerso = { id, titre: envoi.titre.trim().slice(0, 120) || "Entraînement", theme: envoi.theme, date: new Date().toISOString(), duree: c.duree, taille: c.blob.size, chemin, type: c.type, apercu: c.apercu }
      maj(st => ({ ...st, entrainements: [v, ...st.entrainements] }))
      setEnvoi(null)
      toast(`Vidéo enregistrée (${taille(c.blob.size)}), disponible sans réseau sur ce téléphone`, "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "La vidéo n'a pas pu être enregistrée", "error")
      setEnvoi(st => st && { ...st, etape: "choix", progres: 0 })
    }
  }

  async function supprimer(v: VideoPerso) {
    if (!(await confirmer(`Supprimer « ${v.titre} » ?`, "Supprimer"))) return
    await supprimerVideo(v).catch(() => {})
    maj(st => ({ ...st, entrainements: st.entrainements.filter(x => x.id !== v.id) }))
    setOuverte(null)
  }

  const visibles = theme === "tous" ? videos : videos.filter(v => v.theme === theme)
  const themesUtilises = THEMES_ENTRAINEMENT.filter(t => videos.some(v => v.theme === t))
  const puce = (actif: boolean): React.CSSProperties => ({ flexShrink: 0, minHeight: 36, borderRadius: 999, border: `1px solid ${actif ? colors.navy : colors.border}`, background: actif ? colors.navy : "#fff", color: actif ? "#fff" : colors.text, fontSize: 13, padding: "0 12px", cursor: "pointer" })
  const gros: React.CSSProperties = { flex: "1 1 150px", minHeight: 48, borderRadius: 12, border: "none", fontSize: 14.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }

  return (
    <section aria-labelledby="titre-entrainements" style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: 16, marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <h2 id="titre-entrainements" style={{ fontSize: 17, color: colors.navy, margin: 0, flex: 1 }}>Mes vidéos d&apos;entraînement</h2>
        <span style={{ fontSize: 12, color: colors.textMuted, fontVariantNumeric: "tabular-nums" }}>{taille(utilise)} / 1 Go</span>
      </div>
      <p style={{ fontSize: 13, color: colors.textMuted, margin: "4px 0 12px", lineHeight: 1.45 }}>Filme tes tirs, revois-les au ralenti et compare-les aux pros. Elles restent sur ton téléphone : pas besoin de réseau pour les regarder.</p>

      <input ref={filmer} type="file" accept="video/*" capture="environment" hidden onChange={e => { choisirFichier(e.target.files?.[0]); e.target.value = "" }} />
      <input ref={choisir} type="file" accept="video/*" hidden onChange={e => { choisirFichier(e.target.files?.[0]); e.target.value = "" }} />

      {!envoi ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: videos.length ? 14 : 0 }}>
          <button onClick={() => filmer.current?.click()} style={{ ...gros, background: colors.blue, color: "#fff" }}>🎥 Filmer</button>
          <button onClick={() => choisir.current?.click()} style={{ ...gros, background: colors.blueLight, color: colors.navy }}>Choisir une vidéo</button>
        </div>
      ) : (
        <div style={{ background: "#F4F6FA", borderRadius: 12, padding: 12, marginBottom: 14 }}>
          {envoi.etape === "choix" ? (
            <>
              <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>{envoi.fichier.name} · {taille(envoi.fichier.size)}</div>
              <label htmlFor="titre-video" style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 4 }}>Titre</label>
              <input id="titre-video" value={envoi.titre} onChange={e => setEnvoi({ ...envoi, titre: e.target.value })} maxLength={120}
                style={{ width: "100%", boxSizing: "border-box", minHeight: 44, borderRadius: 10, border: `1px solid ${colors.border}`, padding: "0 12px", fontSize: 16, marginBottom: 10 }} />
              <div id="theme-video" style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Thème</div>
              <div role="radiogroup" aria-labelledby="theme-video" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {THEMES_ENTRAINEMENT.map(t => <button key={t} role="radio" aria-checked={envoi.theme === t} style={puce(envoi.theme === t)} onClick={() => setEnvoi({ ...envoi, theme: t })}>{t}</button>)}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => void enregistrer()} style={{ ...gros, background: colors.blue, color: "#fff" }}>Enregistrer</button>
                <button onClick={() => setEnvoi(null)} style={{ ...gros, flex: "0 0 auto", padding: "0 16px", background: "#fff", color: colors.text, border: `1px solid ${colors.border}`, fontWeight: 500 }}>Annuler</button>
              </div>
            </>
          ) : (
            <div role="status">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                {envoi.etape === "compression" ? `Compression… ${Math.round(envoi.progres * 100)} %` : "Envoi…"}
              </div>
              <div style={{ height: 8, background: "#E3E9F2", borderRadius: 4 }}><div style={{ height: 8, width: `${envoi.etape === "envoi" ? 100 : envoi.progres * 100}%`, background: colors.blue, borderRadius: 4, transition: "width 300ms" }} /></div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>Garde l&apos;écran allumé et reste sur cette page : la compression dure environ le temps de la vidéo.</div>
            </div>
          )}
        </div>
      )}

      {videos.length > 0 && (
        <>
          {themesUtilises.length > 1 && (
            <div role="group" aria-label="Filtrer par thème" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 8, scrollbarWidth: "none" }}>
              <button style={puce(theme === "tous")} aria-pressed={theme === "tous"} onClick={() => setTheme("tous")}>Toutes ({videos.length})</button>
              {themesUtilises.map(t => <button key={t} style={puce(theme === t)} aria-pressed={theme === t} onClick={() => setTheme(t)}>{t}</button>)}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {visibles.map(v => (
              <button key={v.id} onClick={() => setOuverte(v)} aria-label={`Regarder : ${v.titre}`}
                style={{ textAlign: "left", border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden", background: "#fff", padding: 0, cursor: "pointer" }}>
                <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#0A1628" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {v.apercu && <img src={v.apercu} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                  <span style={{ position: "absolute", right: 5, bottom: 5, background: "rgba(0,0,0,.75)", color: "#fff", fontSize: 11, borderRadius: 4, padding: "1px 5px", fontVariantNumeric: "tabular-nums" }}>{duree(v.duree)}</span>
                  {locales[v.id] && <span style={{ position: "absolute", left: 5, top: 5, background: "rgba(16,185,129,.95)", color: "#fff", fontSize: 10.5, borderRadius: 4, padding: "1px 5px" }}>Sans réseau ✓</span>}
                </div>
                <div style={{ padding: "6px 8px 8px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, lineHeight: 1.3 }}>{v.titre}</div>
                  <div style={{ fontSize: 11.5, color: colors.textMuted }}>{v.theme} · {new Date(v.date).toLocaleDateString("fr-CH")}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {ouverte && <LecteurPerso v={ouverte} onFermer={() => setOuverte(null)} onSupprimer={() => void supprimer(ouverte)}
        onGardee={() => setLocales(l => ({ ...l, [ouverte.id]: true }))} />}
    </section>
  )
}

// Lecteur : ralenti, boucle, et comparaison avec une vidéo de pro
const VITESSES = [0.25, 0.5, 1] as const
const PROS = COLLECTIONS.filter(c => c.sport === "Handball").flatMap(c => c.videos).filter((v, i, t) => t.findIndex(x => x.id === v.id) === i)

function LecteurPerso({ v, onFermer, onSupprimer, onGardee }: { v: VideoPerso; onFermer: () => void; onSupprimer: () => void; onGardee: () => void }) {
  const [src, setSrc] = useState<{ pour: string; url?: string; erreur?: string } | null>(null)
  const [vitesse, setVitesse] = useState<number>(1)
  const [boucle, setBoucle] = useState(false)
  const [pro, setPro] = useState<string | null>(null)
  const [choixPro, setChoixPro] = useState(false)
  const lecteur = useRef<HTMLVideoElement>(null)
  // Les rappels du parent changent à chaque rendu : on garde les derniers sans relancer le chargement
  const rappels = useRef({ onFermer, onGardee })
  useEffect(() => { rappels.current = { onFermer, onGardee } })

  useEffect(() => {
    let url: string | undefined
    let actif = true
    lireVideo(v).then(b => { url = URL.createObjectURL(b); if (actif) { setSrc({ pour: v.id, url }); rappels.current.onGardee() } })
      .catch(e => { if (actif) setSrc({ pour: v.id, erreur: e instanceof Error ? e.message : "Lecture impossible" }) })
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") rappels.current.onFermer() }
    window.addEventListener("keydown", echap)
    return () => { actif = false; if (url) URL.revokeObjectURL(url); window.removeEventListener("keydown", echap) }
  }, [v])

  useEffect(() => { if (lecteur.current) lecteur.current.playbackRate = vitesse }, [vitesse, src])

  const bouton = (actif = false): React.CSSProperties => ({ minHeight: 40, padding: "0 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,.25)", background: actif ? "#fff" : "rgba(255,255,255,.08)", color: actif ? "#0A1628" : "#fff", fontSize: 13.5, cursor: "pointer", fontWeight: actif ? 700 : 500 })
  const etat = src?.pour === v.id ? src : null

  return (
    <div role="dialog" aria-modal="true" aria-label={v.titre} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(5,10,20,.95)", overflowY: "auto", padding: "calc(10px + env(safe-area-inset-top)) 12px calc(16px + env(safe-area-inset-bottom))", color: "#fff" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.titre}</div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.65)" }}>{v.theme} · {new Date(v.date).toLocaleDateString("fr-CH")} · {taille(v.taille)}</div>
          </div>
          <button onClick={onFermer} aria-label="Fermer" style={{ ...bouton(), minWidth: 44, padding: 0, fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: pro ? "repeat(auto-fit, minmax(300px, 1fr))" : "1fr" }}>
          <div style={{ background: "#000", borderRadius: 12, overflow: "hidden", display: "grid", placeItems: "center", minHeight: 200 }}>
            {!etat ? <div role="status" style={{ padding: 30, fontSize: 14 }}>Chargement de la vidéo…</div>
              : etat.erreur ? <div role="alert" style={{ padding: 20, fontSize: 14, textAlign: "center" }}>{etat.erreur}</div>
                : <video ref={lecteur} src={etat.url} controls playsInline autoPlay muted={!!pro} loop={boucle} style={{ width: "100%", maxHeight: pro ? "45vh" : "70vh", display: "block" }} />}
          </div>
          {pro && (
            <div style={{ position: "relative", aspectRatio: "16 / 9", background: "#000", borderRadius: 12, overflow: "hidden" }}>
              {navigator.onLine
                ? <iframe key={pro} src={lecteurYoutube(pro).replace("autoplay=1", "autoplay=0")} title="Vidéo du pro" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
                : <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 20, textAlign: "center", fontSize: 14 }}>Les vidéos de pros demandent une connexion.</div>}
            </div>
          )}
        </div>

        <div role="group" aria-label="Vitesse" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginRight: 2 }}>Vitesse</span>
          {VITESSES.map(x => <button key={x} style={bouton(vitesse === x)} aria-pressed={vitesse === x} onClick={() => setVitesse(x)}>{x === 1 ? "Normale" : `×${String(x).replace(".", ",")}`}</button>)}
          <button style={bouton(boucle)} aria-pressed={boucle} onClick={() => setBoucle(b => !b)}>⟲ En boucle</button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          <button style={bouton(!!pro)} onClick={() => (pro ? setPro(null) : setChoixPro(c => !c))}>{pro ? "Arrêter la comparaison" : "Comparer avec un pro"}</button>
          <button style={{ ...bouton(), borderColor: "rgba(255,120,140,.5)", color: "#FF9AAB" }} onClick={onSupprimer}>Supprimer</button>
        </div>

        {choixPro && !pro && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginBottom: 6 }}>Choisis la vidéo à mettre à côté de la tienne :</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
              {PROS.map(p => (
                <button key={p.id} onClick={() => { setPro(p.id); setChoixPro(false) }} style={{ textAlign: "left", border: "1px solid rgba(255,255,255,.15)", borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,.05)", padding: 0, cursor: "pointer", color: "#fff" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={miniature(p.id)} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "16 / 9", objectFit: "cover", display: "block" }} />
                  <div style={{ fontSize: 12, padding: "5px 7px 7px", lineHeight: 1.3 }}>{p.titre}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
