"use client"
import { useEffect, useRef, useState } from "react"
import { colors, radius } from "@/app/components/ui/tokens"
import { toast } from "@/lib/toast"
import {
  COLLECTIONS, ETAT_VIDE, chargerEtatVideos, enregistrerEtatVideos, idYoutube, infosYoutube, lecteurYoutube, miniature,
  type EtatVideos, type Video,
} from "@/lib/videos"

// Vidéothèque : collections choisies + vidéos ajoutées par l'élève, lues dans l'appli
type Ouverte = { video: Video; liste: Video[] }
const PERSO = "Mes vidéos"

export default function VideosSection({ userId }: { userId: string }) {
  const [etat, setEtat] = useState<EtatVideos | null>(null)
  const [filtre, setFiltre] = useState<string>("toutes")
  const [ouverte, setOuverte] = useState<Ouverte | null>(null)
  const [lien, setLien] = useState("")
  const [ajout, setAjout] = useState(false)
  const etatRef = useRef<EtatVideos>(ETAT_VIDE)

  useEffect(() => {
    let actif = true
    chargerEtatVideos(userId).then(e => { if (actif) { etatRef.current = e; setEtat(e) } })
    return () => { actif = false }
  }, [userId])

  function maj(f: (e: EtatVideos) => EtatVideos) {
    const e = f(etatRef.current)
    etatRef.current = e
    setEtat(e)
    void enregistrerEtatVideos(userId, e).then(ok => { if (!ok) toast("Pas enregistré : vérifie ta connexion", "error") })
  }
  const basculerFavori = (id: string) => maj(e => ({ ...e, favoris: e.favoris.includes(id) ? e.favoris.filter(x => x !== id) : [...e.favoris, id] }))
  const marquerVue = (id: string) => maj(e => (e.vues[id] ? e : { ...e, vues: { ...e.vues, [id]: new Date().toISOString().slice(0, 10) } }))

  async function ajouter(e: React.FormEvent) {
    e.preventDefault()
    const id = idYoutube(lien)
    if (!id) return toast("Colle un lien YouTube (youtube.com/watch?v=… ou youtu.be/…)", "error")
    if (etatRef.current.perso.some(v => v.id === id)) return toast("Cette vidéo est déjà dans « Mes vidéos »", "info")
    setAjout(true)
    const infos = await infosYoutube(id)
    setAjout(false)
    maj(st => ({ ...st, perso: [{ id, titre: infos?.titre || "Vidéo YouTube", chaine: infos?.chaine || "", collection: PERSO }, ...st.perso] }))
    setLien("")
    setFiltre(PERSO)
    toast("Vidéo ajoutée", "success")
  }

  const retirer = (id: string) => maj(e => ({ ...e, perso: e.perso.filter(v => v.id !== id) }))

  if (!etat) return <div className="nx-skel" style={{ height: 240, borderRadius: radius.md }} />

  const toutes = [...COLLECTIONS.flatMap(c => c.videos), ...etat.perso]
  const parId = new Map(toutes.map(v => [v.id, v]))
  const groupes = [
    ...(etat.perso.length ? [{ id: PERSO, titre: PERSO, desc: "Les vidéos que tu as ajoutées.", videos: etat.perso as Video[] }] : []),
    ...COLLECTIONS,
  ]
  const favoris = etat.favoris.map(id => parId.get(id)).filter((v): v is Video => !!v)
  const visibles = filtre === "toutes" ? groupes
    : filtre === "favoris" ? [{ id: "favoris", titre: "Mes favoris", desc: favoris.length ? "" : "Appuie sur ♡ sous une vidéo pour la retrouver ici.", videos: favoris }]
      : filtre === "a-voir" ? groupes.map(g => ({ ...g, videos: g.videos.filter(v => !etat.vues[v.id]) })).filter(g => g.videos.length)
        : groupes.filter(g => g.id === filtre)
  const nbVues = new Set(toutes.filter(v => etat.vues[v.id]).map(v => v.id)).size

  const puce = (actif: boolean): React.CSSProperties => ({ flexShrink: 0, minHeight: 38, borderRadius: 999, border: `1px solid ${actif ? colors.navy : colors.border}`, background: actif ? colors.navy : "#fff", color: actif ? "#fff" : colors.text, fontSize: 13, padding: "0 14px", cursor: "pointer" })

  return (
    <div>
      <section style={{ borderRadius: radius.md, padding: "16px 18px", background: "linear-gradient(135deg, #0A1628, #1a3a6e)", color: "#fff", marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Vidéothèque</div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.78)", margin: "4px 0 12px", lineHeight: 1.45 }}>
          Des vidéos choisies pour progresser, lues directement dans Nexia. {nbVues > 0 && `${nbVues} vue${nbVues > 1 ? "s" : ""} sur ${parId.size}.`}
        </div>
        <form onSubmit={ajouter} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label htmlFor="lien-video" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Lien d&apos;une vidéo YouTube</label>
          <input id="lien-video" value={lien} onChange={e => setLien(e.target.value)} placeholder="Colle un lien YouTube pour l'ajouter" inputMode="url" autoComplete="off"
            style={{ flex: "1 1 220px", minWidth: 0, minHeight: 44, borderRadius: 12, border: "none", padding: "0 14px", fontSize: 16, background: "#fff", color: colors.text }} />
          <button type="submit" disabled={ajout || !lien.trim()} style={{ minHeight: 44, padding: "0 16px", borderRadius: 12, border: "none", background: "#fff", color: colors.navy, fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: ajout || !lien.trim() ? 0.6 : 1 }}>
            {ajout ? "Ajout…" : "Ajouter"}
          </button>
        </form>
      </section>

      <div role="group" aria-label="Filtrer les vidéos" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 6, scrollbarWidth: "none" }}>
        <button style={puce(filtre === "toutes")} aria-pressed={filtre === "toutes"} onClick={() => setFiltre("toutes")}>Toutes</button>
        <button style={puce(filtre === "favoris")} aria-pressed={filtre === "favoris"} onClick={() => setFiltre("favoris")}>♥ Favoris{favoris.length ? ` (${favoris.length})` : ""}</button>
        <button style={puce(filtre === "a-voir")} aria-pressed={filtre === "a-voir"} onClick={() => setFiltre("a-voir")}>Pas encore vues</button>
        {groupes.map(g => <button key={g.id} style={puce(filtre === g.id)} aria-pressed={filtre === g.id} onClick={() => setFiltre(g.id)}>{g.titre}</button>)}
      </div>

      {visibles.map(g => (
        <section key={g.id} aria-labelledby={`titre-${g.id}`} style={{ marginBottom: 20 }}>
          <h2 id={`titre-${g.id}`} style={{ fontSize: 17, color: colors.navy, margin: "8px 0 2px", textWrap: "balance" }}>{g.titre}</h2>
          {g.desc && <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 10px", lineHeight: 1.45 }}>{g.desc}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
            {g.videos.map(v => (
              <article key={g.id + v.id} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <button onClick={() => { setOuverte({ video: v, liste: g.videos }); marquerVue(v.id) }} aria-label={`Regarder : ${v.titre}`}
                  style={{ position: "relative", border: "none", padding: 0, cursor: "pointer", background: "#0A1628", aspectRatio: "16 / 9" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={miniature(v.id)} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                    <span style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(10,22,40,.75)", display: "grid", placeItems: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </span>
                  {v.duree && <span style={{ position: "absolute", right: 6, bottom: 6, background: "rgba(0,0,0,.75)", color: "#fff", fontSize: 11.5, borderRadius: 4, padding: "1px 5px", fontVariantNumeric: "tabular-nums" }}>{v.duree}</span>}
                  {etat.vues[v.id] && <span style={{ position: "absolute", left: 6, top: 6, background: colors.green, color: "#fff", fontSize: 11.5, borderRadius: 4, padding: "1px 6px" }}>✓ Vue</span>}
                </button>
                <div style={{ padding: "8px 10px 10px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: colors.text, lineHeight: 1.35 }}>{v.titre}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>{v.chaine}{v.note ? ` · ${v.note}` : ""}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: "auto" }}>
                    <button onClick={() => basculerFavori(v.id)} aria-pressed={etat.favoris.includes(v.id)} aria-label={etat.favoris.includes(v.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      style={{ minWidth: 40, minHeight: 36, border: "none", background: "none", cursor: "pointer", fontSize: 18, color: etat.favoris.includes(v.id) ? "#E11D48" : colors.textFaint }}>
                      {etat.favoris.includes(v.id) ? "♥" : "♡"}
                    </button>
                    {g.id === PERSO && <button onClick={() => retirer(v.id)} style={{ minHeight: 36, border: "none", background: "none", cursor: "pointer", fontSize: 12.5, color: colors.textMuted }}>Retirer</button>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <p style={{ fontSize: 11.5, color: colors.textFaint, marginTop: 10 }}>Les vidéos sont lues depuis YouTube (mode sans cookies publicitaires). Elles restent la propriété de leurs auteurs.</p>

      {ouverte && <Lecteur ouverte={ouverte} favori={etat.favoris.includes(ouverte.video.id)}
        onFavori={() => basculerFavori(ouverte.video.id)}
        onChanger={v => { setOuverte({ ...ouverte, video: v }); marquerVue(v.id) }}
        onFermer={() => setOuverte(null)} />}
    </div>
  )
}

function Lecteur({ ouverte, favori, onFavori, onChanger, onFermer }: {
  ouverte: Ouverte; favori: boolean; onFavori: () => void; onChanger: (v: Video) => void; onFermer: () => void
}) {
  const { video: v, liste } = ouverte
  const i = liste.findIndex(x => x.id === v.id)
  const suivante = liste[i + 1], precedente = liste[i - 1]
  useEffect(() => {
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") onFermer() }
    window.addEventListener("keydown", echap)
    const avant = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { window.removeEventListener("keydown", echap); document.body.style.overflow = avant }
  }, [onFermer])
  const bouton: React.CSSProperties = { minHeight: 44, padding: "0 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.08)", color: "#fff", fontSize: 14, cursor: "pointer" }
  return (
    <div role="dialog" aria-modal="true" aria-label={v.titre} onClick={e => { if (e.target === e.currentTarget) onFermer() }}
      style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(5,10,20,.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: "calc(12px + env(safe-area-inset-top)) 12px calc(12px + env(safe-area-inset-bottom))" }}>
      <div style={{ width: "100%", maxWidth: 960, color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button onClick={onFermer} aria-label="Fermer la vidéo" style={{ ...bouton, minWidth: 44, padding: 0, fontSize: 18 }}>✕</button>
        </div>
        <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#000", borderRadius: 12, overflow: "hidden" }}>
          <iframe key={v.id} src={lecteurYoutube(v.id)} title={v.titre} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
        </div>
        <h2 style={{ fontSize: 17, margin: "12px 0 2px", textWrap: "balance" }}>{v.titre}</h2>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)" }}>{v.chaine}{v.note ? ` · ${v.note}` : ""}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {precedente && <button style={bouton} onClick={() => onChanger(precedente)}>← Précédente</button>}
          <button style={{ ...bouton, color: favori ? "#FF8FA3" : "#fff" }} onClick={onFavori} aria-pressed={favori}>{favori ? "♥ Favori" : "♡ Favori"}</button>
          <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" style={{ ...bouton, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Ouvrir sur YouTube</a>
          {suivante && <button style={{ ...bouton, background: "#fff", color: "#0A1628", fontWeight: 700 }} onClick={() => onChanger(suivante)}>Suivante →</button>}
        </div>
      </div>
    </div>
  )
}
