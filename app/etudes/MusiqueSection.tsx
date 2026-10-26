"use client"
import EmplacementLecteur from "@/app/components/EmplacementLecteur"
import { ouvrirListe } from "@/lib/lecteurGlobal"
import { useCallback, useEffect, useRef, useState } from "react"
import { colors, radius } from "@/app/components/ui/tokens"
import { lecteurYoutube, miniature, type EtatVideos } from "@/lib/videos"
import { ALBUMS, APPLE_MUSIC, APPLE_MUSIC_ALBUM, ARTISTES_ALBUMS, CHANSONS, DECENNIES, SPOTIFY, SPOTIFY_ALBUM, lecteurAlbum, vignetteAlbum, type Album, type Chanson, type Decennie, type Mot, type Question } from "@/lib/musique"

// Anglais en musique : clips officiels YouTube + fiches d'anglais (histoire, vocabulaire, quiz).
// Aucune parole n'est affichée : les paroles complètes sont sur Spotify / Apple Music.
type Onglet = "histoire" | "vocabulaire" | "quiz"
type Filtre = "toutes" | "favorites" | Decennie | `artiste:${string}`
type OngletAlbum = "album" | "titres" | "vocabulaire" | "quiz"
type FiltreAlbum = "tous" | "favoris" | string   // « string » = nom d'un artiste
const SEUIL_ALBUM = 3  // quiz d'album : 3 bonnes réponses sur 4
const VIDE = { favoris: [] as string[], apprises: [] as string[] }
const SEUIL = 2   // quiz réussi à partir de 2 bonnes réponses sur 3

export default function MusiqueSection({ etat, maj }: { etat: EtatVideos; maj: (f: (e: EtatVideos) => EtatVideos) => void }) {
  const [filtre, setFiltre] = useState<Filtre>("toutes")
  const [ouverte, setOuverte] = useState<Chanson | null>(null)
  const [filtreAlbum, setFiltreAlbum] = useState<FiltreAlbum>("tous")
  const [albumOuvert, setAlbumOuvert] = useState<Album | null>(null)
  const { favoris, apprises } = etat.musique ?? VIDE

  const basculerFavori = (id: string) => maj(e => {
    const mu = e.musique ?? VIDE
    return { ...e, musique: { ...mu, favoris: mu.favoris.includes(id) ? mu.favoris.filter(x => x !== id) : [...mu.favoris, id] } }
  })
  const marquerApprise = useCallback((id: string) => maj(e => {
    const mu = e.musique ?? VIDE
    return mu.apprises.includes(id) ? e : { ...e, musique: { ...mu, apprises: [...mu.apprises, id] } }
  }), [maj])
  const fermer = useCallback(() => setOuverte(null), [])
  const fermerAlbum = useCallback(() => setAlbumOuvert(null), [])

  const decennies = DECENNIES.filter(d => CHANSONS.some(c => c.decennie === d))
  // Artistes avec au moins 3 chansons : un filtre chacun
  const artistes = [...new Set(CHANSONS.map(c => c.artiste))].filter(a => CHANSONS.filter(c => c.artiste === a).length >= 3)
  const visibles = filtre === "toutes" ? CHANSONS : filtre === "favorites" ? CHANSONS.filter(c => favoris.includes(c.id))
    : filtre.startsWith("artiste:") ? CHANSONS.filter(c => c.artiste === filtre.slice(8)) : CHANSONS.filter(c => c.decennie === filtre)
  const nbApprises = CHANSONS.filter(c => apprises.includes(c.id)).length
  const nbFavoris = CHANSONS.filter(c => favoris.includes(c.id)).length
  const albumsVisibles = filtreAlbum === "tous" ? ALBUMS : filtreAlbum === "favoris" ? ALBUMS.filter(a => favoris.includes(a.id)) : ALBUMS.filter(a => a.artiste === filtreAlbum)
  const nbAlbumsApprises = ALBUMS.filter(a => apprises.includes(a.id)).length
  const nbAlbumsFavoris = ALBUMS.filter(a => favoris.includes(a.id)).length

  const puce = (actif: boolean): React.CSSProperties => ({ flexShrink: 0, minHeight: 44, borderRadius: 999, border: `1px solid ${actif ? colors.navy : colors.border}`, background: actif ? colors.navy : "#fff", color: actif ? "#fff" : colors.text, fontSize: 13, padding: "0 14px", cursor: "pointer" })

  return (
    <section aria-labelledby="titre-musique" style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: 16, marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <h2 id="titre-musique" style={{ fontSize: 17, color: colors.navy, margin: 0, flex: 1 }}>Anglais en musique</h2>
        <span style={{ fontSize: 12, color: colors.textMuted, fontVariantNumeric: "tabular-nums" }}>{nbApprises} / {CHANSONS.length} apprises</span>
      </div>
      <p style={{ fontSize: 13, color: colors.textMuted, margin: "4px 0 12px", lineHeight: 1.45 }}>
        Apprends l&apos;anglais avec des albums complets et des classiques des années 60 à aujourd&apos;hui : écoute, regarde le clip officiel, découvre l&apos;histoire de la chanson, retiens le vocabulaire et teste-toi avec un quiz.
      </p>

      <h3 id="titre-albums" style={{ fontSize: 15, color: colors.navy, margin: "0 0 2px" }}>Albums complets</h3>
      <p style={{ fontSize: 12.5, color: colors.textMuted, margin: "0 0 8px", lineHeight: 1.45 }}>
        {nbAlbumsApprises} / {ALBUMS.length} appris · lecture des albums officiels de YouTube, titre après titre.
      </p>
      <div role="group" aria-label="Filtrer les albums par artiste" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 8, scrollbarWidth: "none" }}>
        <button style={puce(filtreAlbum === "tous")} aria-pressed={filtreAlbum === "tous"} onClick={() => setFiltreAlbum("tous")}>Tous</button>
        {ARTISTES_ALBUMS.map(ar => <button key={ar} style={puce(filtreAlbum === ar)} aria-pressed={filtreAlbum === ar} onClick={() => setFiltreAlbum(ar)}>{ar}</button>)}
        <button style={puce(filtreAlbum === "favoris")} aria-pressed={filtreAlbum === "favoris"} onClick={() => setFiltreAlbum("favoris")}>♥ Mes favoris{nbAlbumsFavoris ? ` (${nbAlbumsFavoris})` : ""}</button>
      </div>
      {albumsVisibles.length === 0 && <p style={{ fontSize: 13, color: colors.textMuted, margin: "8px 0" }}>Appuie sur ♡ sous un album pour le retrouver ici.</p>}
      <ul style={{ listStyle: "none", margin: "0 0 20px", padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        {albumsVisibles.map(a => {
          const fav = favoris.includes(a.id)
          return (
            <li key={a.id} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0 }}>
              <button onClick={() => setAlbumOuvert(a)} aria-label={`Ouvrir l'album : ${a.titre}, ${a.artiste}, ${a.annee}`}
                style={{ position: "relative", border: "none", padding: 0, cursor: "pointer", background: a.couleur, aspectRatio: "1 / 1", overflow: "hidden", color: "#fff", textAlign: "left" }}>
                <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 10, gap: 2 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, overflowWrap: "anywhere" }}>{a.titre.split(":")[0]}</span>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>{a.artiste} · {a.annee}</span>
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={vignetteAlbum(a)} alt="" loading="lazy" onError={e => { e.currentTarget.style.display = "none" }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <span aria-hidden="true" style={{ position: "absolute", right: 8, bottom: 8, width: 36, height: 36, borderRadius: "50%", background: "rgba(10,22,40,.75)", display: "grid", placeItems: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                </span>
                {apprises.includes(a.id) && <span style={{ position: "absolute", left: 6, top: 6, background: colors.green, color: "#fff", fontSize: 11.5, borderRadius: 4, padding: "1px 6px" }}>✓ Appris</span>}
                {a.explicite && <span style={{ position: "absolute", right: 6, top: 6, background: "rgba(0,0,0,.75)", color: "#fff", fontSize: 10.5, borderRadius: 4, padding: "1px 5px" }}>Explicit</span>}
              </button>
              <div style={{ padding: "6px 8px 6px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 12, color: colors.textMuted, flex: 1, minWidth: 0, lineHeight: 1.3 }}>{a.videos ? `${a.videos.length} clips · ${a.nbTitres} titres` : `${a.nbTitres} titres`}</div>
                <button onClick={() => basculerFavori(a.id)} aria-pressed={fav} aria-label={fav ? `Retirer ${a.titre} des favoris` : `Ajouter ${a.titre} aux favoris`}
                  style={{ minWidth: 44, minHeight: 44, border: "none", background: "none", cursor: "pointer", fontSize: 18, color: fav ? "#E11D48" : colors.textFaint }}>
                  {fav ? "♥" : "♡"}
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <h3 id="titre-chansons" style={{ fontSize: 15, color: colors.navy, margin: "0 0 6px" }}>Chansons</h3>
      <div role="group" aria-label="Filtrer les chansons" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 8, scrollbarWidth: "none" }}>
        <button style={puce(filtre === "toutes")} aria-pressed={filtre === "toutes"} onClick={() => setFiltre("toutes")}>Toutes</button>
        {artistes.map(a => <button key={a} style={puce(filtre === `artiste:${a}`)} aria-pressed={filtre === `artiste:${a}`} onClick={() => setFiltre(`artiste:${a}`)}>{a}</button>)}
        {decennies.map(d => <button key={d} style={puce(filtre === d)} aria-pressed={filtre === d} onClick={() => setFiltre(d)}>{d}</button>)}
        <button style={puce(filtre === "favorites")} aria-pressed={filtre === "favorites"} onClick={() => setFiltre("favorites")}>♥ Mes favorites{nbFavoris ? ` (${nbFavoris})` : ""}</button>
      </div>

      {visibles.length === 0 && <p style={{ fontSize: 13, color: colors.textMuted, margin: "8px 0" }}>Appuie sur ♡ sous une chanson pour la retrouver ici.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
        {visibles.map(c => {
          const fav = favoris.includes(c.id)
          return (
            <article key={c.id} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0 }}>
              <button onClick={() => setOuverte(c)} aria-label={`Ouvrir : ${c.titre}, ${c.artiste}, ${c.annee}`}
                style={{ position: "relative", border: "none", padding: 0, cursor: "pointer", background: colors.navy, aspectRatio: "16 / 9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={miniature(c.id)} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                  <span style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(10,22,40,.75)", display: "grid", placeItems: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </span>
                <span style={{ position: "absolute", right: 6, bottom: 6, background: "rgba(0,0,0,.75)", color: "#fff", fontSize: 11.5, borderRadius: 4, padding: "1px 5px", fontVariantNumeric: "tabular-nums" }}>{c.duree}</span>
                {apprises.includes(c.id) && <span style={{ position: "absolute", left: 6, top: 6, background: colors.green, color: "#fff", fontSize: 11.5, borderRadius: 4, padding: "1px 6px" }}>✓ Apprise</span>}
              </button>
              <div style={{ padding: "8px 10px 10px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: colors.text, lineHeight: 1.35, overflowWrap: "anywhere" }}>{c.titre}</div>
                <div style={{ fontSize: 12, color: colors.textMuted }}>{c.artiste} · {c.annee}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: "auto" }}>
                  <button onClick={() => basculerFavori(c.id)} aria-pressed={fav} aria-label={fav ? `Retirer ${c.titre} des favorites` : `Ajouter ${c.titre} aux favorites`}
                    style={{ minWidth: 44, minHeight: 44, border: "none", background: "none", cursor: "pointer", fontSize: 18, color: fav ? "#E11D48" : colors.textFaint }}>
                    {fav ? "♥" : "♡"}
                  </button>
                  <span style={{ fontSize: 11.5, color: colors.textMuted, marginLeft: "auto" }}>{c.style.split(" / ")[0]}</span>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <p style={{ fontSize: 11.5, color: colors.textFaint, margin: "12px 0 0", lineHeight: 1.4 }}>
        Les clips sont les clips officiels, lus depuis YouTube. Nexia n&apos;affiche pas les paroles : Spotify et Apple Music ont les droits de les montrer, synchronisées avec la musique.
      </p>

      {albumOuvert && <FicheAlbum key={albumOuvert.id} album={albumOuvert} favori={favoris.includes(albumOuvert.id)} appris={apprises.includes(albumOuvert.id)}
        onFavori={() => basculerFavori(albumOuvert.id)} onAppris={() => marquerApprise(albumOuvert.id)} onFermer={fermerAlbum} />}
      {ouverte && <Fiche key={ouverte.id} chanson={ouverte} favori={favoris.includes(ouverte.id)} apprise={apprises.includes(ouverte.id)}
        onFavori={() => basculerFavori(ouverte.id)} onApprise={() => marquerApprise(ouverte.id)} onFermer={fermer} />}
    </section>
  )
}

const bouton: React.CSSProperties = { minHeight: 44, padding: "0 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.08)", color: "#fff", fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", textDecoration: "none" }

// Fenêtre modale partagée (chansons et albums) : focus piégé, Échap pour fermer, défilement de la page bloqué.
function Modale({ label, onFermer, children }: { label: string; onFermer: () => void; children: React.ReactNode }) {
  const boite = useRef<HTMLDivElement>(null)
  const fermerBtn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const ancien = document.activeElement as HTMLElement | null
    fermerBtn.current?.focus()
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onFermer(); return }
      if (e.key !== "Tab" || !boite.current) return
      const el = Array.from(boite.current.querySelectorAll<HTMLElement>("button, a[href], [tabindex]:not([tabindex='-1'])")).filter(x => !x.hasAttribute("disabled"))
      if (!el.length) return
      const premier = el[0], dernier = el[el.length - 1]
      if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus() }
      else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus() }
    }
    window.addEventListener("keydown", touche)
    const avant = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { window.removeEventListener("keydown", touche); document.body.style.overflow = avant; ancien?.focus?.() }
  }, [onFermer])

  return (
    <div role="dialog" aria-modal="true" aria-label={label} onClick={e => { if (e.target === e.currentTarget) onFermer() }}
      style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(5,10,20,.92)", overflowY: "auto", overscrollBehavior: "contain", padding: "calc(12px + env(safe-area-inset-top)) 12px calc(12px + env(safe-area-inset-bottom))" }}>
      <div ref={boite} style={{ width: "100%", maxWidth: 760, margin: "0 auto", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button ref={fermerBtn} onClick={onFermer} aria-label="Fermer la fiche" style={{ ...bouton, minWidth: 44, padding: 0, fontSize: 18, justifyContent: "center" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Fiche({ chanson: c, favori, apprise, onFavori, onApprise, onFermer }: {
  chanson: Chanson; favori: boolean; apprise: boolean; onFavori: () => void; onApprise: () => void; onFermer: () => void
}) {
  const [onglet, setOnglet] = useState<Onglet>("histoire")

  const onglets: [Onglet, string][] = [["histoire", "L'histoire"], ["vocabulaire", "Vocabulaire"], ["quiz", "Quiz"]]

  return (
    <Modale label={`${c.titre}, ${c.artiste}`} onFermer={onFermer}>
        <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#000", borderRadius: 12, overflow: "hidden" }}>
          <EmplacementLecteur src={lecteurYoutube(c.id)} titre={c.titre} sousTitre={c.artiste} />
        </div>
        <h3 style={{ fontSize: 18, margin: "12px 0 2px", textWrap: "balance", overflowWrap: "anywhere" }}>{c.titre}</h3>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)" }}>{c.artiste} · {c.annee} · {c.style}{apprise ? " · ✓ Apprise" : ""}</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <button style={{ ...bouton, color: favori ? "#FF8FA3" : "#fff" }} onClick={onFavori} aria-pressed={favori}>{favori ? "♥ Favorite" : "♡ Favorite"}</button>
          <a href={SPOTIFY(c)} target="_blank" rel="noopener noreferrer" style={bouton}>Paroles et écoute sur Spotify</a>
          <a href={APPLE_MUSIC(c)} target="_blank" rel="noopener noreferrer" style={bouton}>Apple Music</a>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.6)", margin: "8px 0 0", lineHeight: 1.4 }}>
          Spotify et Apple Music ont les droits d&apos;afficher les paroles synchronisées ; ici, on travaille le sens et le vocabulaire.
        </p>

        <div role="tablist" aria-label="Fiche d'anglais" style={{ display: "flex", gap: 6, margin: "16px 0 12px", overflowX: "auto", scrollbarWidth: "none" }}>
          {onglets.map(([id, nom]) => (
            <button key={id} role="tab" id={`onglet-${id}`} aria-selected={onglet === id} aria-controls="panneau-musique" onClick={() => setOnglet(id)}
              style={{ ...bouton, flexShrink: 0, background: onglet === id ? "#fff" : "rgba(255,255,255,.08)", color: onglet === id ? colors.navy : "#fff", fontWeight: onglet === id ? 700 : 400 }}>{nom}</button>
          ))}
        </div>

        <div role="tabpanel" id="panneau-musique" aria-labelledby={`onglet-${onglet}`} style={{ background: "#fff", color: colors.text, borderRadius: radius.md, padding: 16 }}>
          {onglet === "histoire" && <Histoire c={c} />}
          {onglet === "vocabulaire" && <Vocabulaire mots={c.mots} langue={c.langue} />}
          {onglet === "quiz" && <Quiz quiz={c.quiz} seuil={SEUIL} succes="Cette chanson est marquée comme apprise." onTermine={score => { if (score >= SEUIL) onApprise() }} />}
        </div>
    </Modale>
  )
}

const titreH4: React.CSSProperties = { fontSize: 15, color: colors.navy, margin: "0 0 4px" }
const texteP: React.CSSProperties = { fontSize: 14.5, lineHeight: 1.55, margin: "0 0 14px" }

function FicheAlbum({ album: a, favori, appris, onFavori, onAppris, onFermer }: {
  album: Album; favori: boolean; appris: boolean; onFavori: () => void; onAppris: () => void; onFermer: () => void
}) {
  const [onglet, setOnglet] = useState<OngletAlbum>("album")
  const onglets: [OngletAlbum, string][] = [["album", "L'album"], ["titres", "Titres"], ["vocabulaire", "Vocabulaire"], ["quiz", "Quiz"]]
  return (
    <Modale label={`Album : ${a.titre}, ${a.artiste}`} onFermer={onFermer}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#000", borderRadius: 12, overflow: "hidden" }}>
        <EmplacementLecteur src={lecteurAlbum(a)} titre={a.titre} sousTitre={`${a.artiste} · album`} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 0", flexWrap: "wrap" }}>
        <button onClick={ouvrirListe} style={{ minHeight: 40, padding: "0 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.1)", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>☰ Choisir un titre</button>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.4, flex: "1 1 180px" }}>
          {a.videos ? `Les ${a.videos.length} clips officiels s'enchaînent ; l'album complet (${a.nbTitres} titres) est sur Spotify ou Apple Music.` : "La musique continue quand tu fermes cette fenêtre."}
        </span>
      </div>
      <h3 style={{ fontSize: 18, margin: "10px 0 2px", textWrap: "balance", overflowWrap: "anywhere" }}>{a.titre}</h3>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)" }}>{a.artiste} · {a.annee} · {a.label}{a.explicite ? " · paroles explicites" : ""}{appris ? " · ✓ Appris" : ""}</div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button style={{ ...bouton, color: favori ? "#FF8FA3" : "#fff" }} onClick={onFavori} aria-pressed={favori}>{favori ? "♥ Favori" : "♡ Favori"}</button>
        <a href={SPOTIFY_ALBUM(a)} target="_blank" rel="noopener noreferrer" style={bouton}>Écouter sur Spotify</a>
        <a href={APPLE_MUSIC_ALBUM(a)} target="_blank" rel="noopener noreferrer" style={bouton}>Apple Music</a>
      </div>

      <div role="tablist" aria-label="Fiche de l'album" style={{ display: "flex", gap: 6, margin: "16px 0 12px", overflowX: "auto", scrollbarWidth: "none" }}>
        {onglets.map(([id, nom]) => (
          <button key={id} role="tab" id={`onglet-album-${id}`} aria-selected={onglet === id} aria-controls="panneau-album" onClick={() => setOnglet(id)}
            style={{ ...bouton, flexShrink: 0, background: onglet === id ? "#fff" : "rgba(255,255,255,.08)", color: onglet === id ? colors.navy : "#fff", fontWeight: onglet === id ? 700 : 400 }}>{nom}</button>
        ))}
      </div>

      <div role="tabpanel" id="panneau-album" aria-labelledby={`onglet-album-${onglet}`} style={{ background: "#fff", color: colors.text, borderRadius: radius.md, padding: 16 }}>
        {onglet === "album" && (
          <div>
            <h4 style={titreH4}>L&apos;histoire de l&apos;album</h4>
            <p style={texteP}>{a.histoire}</p>
            <h4 style={titreH4}>Pourquoi il compte</h4>
            <p style={texteP}>{a.pourquoi}</p>
            {a.edition && <p style={{ fontSize: 12.5, color: colors.textMuted, margin: 0, lineHeight: 1.45 }}>{a.edition}</p>}
            {a.explicite && <p style={{ fontSize: 12.5, color: colors.textMuted, margin: "6px 0 0", lineHeight: 1.45 }}>Paroles explicites.</p>}
          </div>
        )}
        {onglet === "titres" && (
          <div>
            <ol style={{ margin: 0, paddingLeft: 22, display: "grid", gap: 8 }}>
              {a.titres.map(t => (
                <li key={t.t} style={{ fontSize: 14.5, lineHeight: 1.4 }}>
                  <span lang="en" style={{ fontWeight: t.note ? 700 : 400, color: t.note ? colors.navy : colors.text, overflowWrap: "anywhere" }}>{t.t}</span>
                  {t.note && <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 1.45 }}>{t.note}</div>}
                </li>
              ))}
            </ol>
            {a.titresNote && <p style={{ fontSize: 12.5, color: colors.textMuted, margin: "12px 0 0", lineHeight: 1.45 }}>{a.titresNote}</p>}
            <p style={{ fontSize: 12, color: colors.textFaint, margin: "8px 0 0", lineHeight: 1.4 }}>Nexia n&apos;affiche pas les paroles : elles sont sur Spotify et Apple Music.</p>
          </div>
        )}
        {onglet === "vocabulaire" && <Vocabulaire mots={a.mots} />}
        {onglet === "quiz" && <Quiz quiz={a.quiz} seuil={SEUIL_ALBUM} succes="Cet album est marqué comme appris." onTermine={score => { if (score >= SEUIL_ALBUM) onAppris() }} />}
      </div>
    </Modale>
  )
}

function Histoire({ c }: { c: Chanson }) {
  const titre: React.CSSProperties = { fontSize: 15, color: colors.navy, margin: "0 0 4px" }
  const texte: React.CSSProperties = { fontSize: 14.5, lineHeight: 1.55, margin: "0 0 14px" }
  return (
    <div>
      <h4 style={titre}>L&apos;histoire</h4>
      <p style={texte}>{c.histoire}</p>
      <h4 style={titre}>De quoi ça parle</h4>
      <p style={{ ...texte, marginBottom: 0 }}>{c.sujet}</p>
    </div>
  )
}

function Vocabulaire({ mots, langue }: { mots: Mot[]; langue?: "fr" }) {
  const [cache, setCache] = useState(false)
  const [reveles, setReveles] = useState<string[]>([])
  const niveau: Record<string, string> = { A2: colors.green, B1: colors.blue, B2: colors.purple }
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, flex: "1 1 180px", lineHeight: 1.4 }}>{mots.length} mots et expressions à retenir ({langue === "fr" ? "argot → français courant" : "anglais → français"}).</p>
        <button aria-pressed={cache} onClick={() => { setCache(v => !v); setReveles([]) }}
          style={{ minHeight: 44, padding: "0 14px", borderRadius: 999, border: `1px solid ${cache ? colors.navy : colors.border}`, background: cache ? colors.navy : "#fff", color: cache ? "#fff" : colors.text, fontSize: 13, cursor: "pointer" }}>
          {cache ? "Traduction cachée" : "Cacher la traduction"}
        </button>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
        {mots.map(mot => {
          const visible = !cache || reveles.includes(mot.en)
          return (
            <li key={mot.en} style={{ border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span lang={langue ?? "en"} style={{ fontSize: 16, fontWeight: 700, color: colors.navy, overflowWrap: "anywhere" }}>{mot.en}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: niveau[mot.niveau], borderRadius: 999, padding: "1px 8px" }} title="Niveau">{mot.niveau}</span>
                </div>
                {visible ? (
                  <>
                    <div style={{ fontSize: 14.5, marginTop: 2 }}>→ {mot.fr}</div>
                    <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 1.45 }}>{mot.explication}</div>
                  </>
                ) : (
                  <button onClick={() => setReveles(r => [...r, mot.en])} aria-label={`Voir la traduction de ${mot.en}`}
                    style={{ minHeight: 44, marginTop: 4, padding: "0 14px", borderRadius: 999, border: `1px dashed ${colors.blueBorder}`, background: colors.blueLight, color: colors.blue, fontSize: 13, cursor: "pointer" }}>
                    Voir la traduction
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Quiz({ quiz, seuil, succes, onTermine }: { quiz: Question[]; seuil: number; succes: string; onTermine: (score: number) => void }) {
  const [reponses, setReponses] = useState<number[]>([])
  const [choisi, setChoisi] = useState<number | null>(null)
  const n = quiz.length
  const fini = reponses.length >= n
  const score = reponses.reduce((a, r, i) => a + (r === quiz[i].bonne ? 1 : 0), 0)

  if (fini) {
    const reussi = score >= seuil
    return (
      <div aria-live="polite" style={{ textAlign: "center", padding: "8px 0" }}>
        <div style={{ fontSize: 34, fontWeight: 800, color: reussi ? colors.green : colors.navy, fontVariantNumeric: "tabular-nums" }}>{score} / {n}</div>
        <p style={{ fontSize: 14.5, margin: "6px 0 14px", lineHeight: 1.45 }}>
          {reussi ? `Bravo ! ${succes}` : `Encore un effort : il faut ${seuil} bonnes réponses sur ${n}. Relis le vocabulaire et réessaie.`}
        </p>
        <button onClick={() => { setReponses([]); setChoisi(null) }}
          style={{ minHeight: 44, padding: "0 18px", borderRadius: 999, border: "none", background: colors.navy, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Recommencer</button>
      </div>
    )
  }

  const qu = quiz[reponses.length]
  const repondu = choisi !== null
  function suivante() {
    if (choisi === null) return
    const nouv = [...reponses, choisi]
    setReponses(nouv)
    setChoisi(null)
    if (nouv.length >= n) onTermine(nouv.reduce((a, r, i) => a + (r === quiz[i].bonne ? 1 : 0), 0))
  }
  return (
    <div>
      <div style={{ fontSize: 12.5, color: colors.textMuted, marginBottom: 4 }}>Question {reponses.length + 1} sur {n}</div>
      <div role="group" aria-label={qu.question}>
        <p style={{ fontSize: 15.5, fontWeight: 600, margin: "0 0 10px", lineHeight: 1.4 }}>{qu.question}</p>
        <div style={{ display: "grid", gap: 8 }}>
          {qu.choix.map((ch, i) => {
            const bonne = i === qu.bonne, pris = i === choisi
            const fond = !repondu ? "#fff" : bonne ? colors.greenLight : pris ? colors.redLight : "#fff"
            const bord = !repondu ? colors.border : bonne ? colors.greenBorder : pris ? colors.redBorder : colors.border
            return (
              <button key={ch} disabled={repondu} aria-pressed={pris} onClick={() => setChoisi(i)}
                style={{ minHeight: 48, textAlign: "left", padding: "8px 14px", borderRadius: radius.sm, border: `1px solid ${bord}`, background: fond, color: colors.text, fontSize: 14.5, cursor: repondu ? "default" : "pointer", overflowWrap: "anywhere" }}>
                {ch}{repondu && bonne ? " ✓" : repondu && pris ? " ✗" : ""}
              </button>
            )
          })}
        </div>
      </div>
      {repondu && (
        <div aria-live="polite" style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.5, margin: "0 0 10px", color: colors.text }}>
            <strong>{choisi === qu.bonne ? "Bonne réponse. " : "Pas tout à fait. "}</strong>{qu.explication}
          </p>
          <button onClick={suivante} style={{ minHeight: 44, padding: "0 18px", borderRadius: 999, border: "none", background: colors.navy, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {reponses.length + 1 >= n ? "Voir mon score" : "Question suivante"}
          </button>
        </div>
      )}
    </div>
  )
}
