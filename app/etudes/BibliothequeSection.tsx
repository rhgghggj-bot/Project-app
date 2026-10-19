"use client"

import "./bibliotheque.css"
import { useEffect, useRef, useState } from "react"
import { chargerEtat, enregistrerEtat, ETAT_VIDE, LIVRES, livre as trouverLivre, noterJour, serie, THEMES, type EtatBiblio, type Livre, type Position } from "@/lib/bibliotheque"
import { cormorant, garamond } from "./polices"
import LecteurLivre from "./LecteurLivre"

type Filtre = "tous" | "lire" | "fiche" | "alire" | "encours" | "lu"
type Statut = "alire" | "encours" | "lu"
const FILTRES: [Filtre, string][] = [["tous", "Tous"], ["lire", "À lire dans l'app"], ["fiche", "Fiches"], ["alire", "Ma liste"], ["encours", "En cours"], ["lu", "Lus"]]
const STATUTS: [Statut, string][] = [["alire", "À lire"], ["encours", "En cours"], ["lu", "Lu"]]
const ROMAINS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"]

const sans = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
const reduit = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
const lisible = (l: Livre) => l.type === "lire" && !!l.texte
const lireLocal = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } }
const ecrireLocal = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* stockage indisponible */ } }

function Ornement() {
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M20 4l4 12 12 4-12 4-4 12-4-12-12-4 12-4z" /><circle cx="20" cy="20" r="3" />
    </svg>
  )
}

function Couverture({ l }: { l: Livre }) {
  return (
    <div className={`couv ${l.s}`} style={{ background: l.c[0], color: l.c[1] }}>
      <span className="t">{l.titre}</span>
      <span className="orn"><Ornement /></span>
      <span><span className="filet" /><span className="a">{l.auteur}</span></span>
    </div>
  )
}

function Livre3D({ l, w }: { l: Livre; w: number }) {
  const h = Math.round(w * 1.5), e = Math.max(16, Math.round(l.pages / 14))
  return (
    <div className="l3d" style={{ "--w": `${w}px`, "--h": `${h}px`, "--e": `${e}px` } as React.CSSProperties}>
      <div className="avant"><Couverture l={l} /></div>
      <div className="arriere" style={{ background: l.c[0] }} />
      <div className="tranche" style={{ background: l.c[0], color: l.c[1] }}><span>{l.titre}</span></div>
      <div className="pages" />
    </div>
  )
}

// Le livre pivote au doigt ou à la souris, avec un peu d'inertie
function usePivotant(ref: React.RefObject<HTMLDivElement | null>, cle: string) {
  useEffect(() => {
    const scene = ref.current
    const l = scene?.querySelector<HTMLElement>(".l3d")
    if (!scene || !l) return
    let base = -28, angle = base, depart: number | null = null, vitesse = 0, dernier = 0, raf = 0
    const tourne = (a: number) => { l.style.transform = `rotateY(${a}deg) rotateX(4deg)` }
    const bas = (e: PointerEvent) => {
      depart = e.clientX; dernier = e.clientX; cancelAnimationFrame(raf); l.style.transition = "none"
      try { scene.setPointerCapture(e.pointerId) } catch { /* déjà relâché */ }
      scene.style.cursor = "grabbing"
    }
    const bouge = (e: PointerEvent) => {
      if (depart === null) return
      vitesse = e.clientX - dernier; dernier = e.clientX
      angle = base + (e.clientX - depart) * 0.9
      tourne(angle)
    }
    const fin = () => {
      if (depart === null) return
      depart = null; scene.style.cursor = ""
      const glisse = () => {
        vitesse *= 0.92; angle += vitesse * 0.9
        tourne(angle)
        if (Math.abs(vitesse) > 0.3) raf = requestAnimationFrame(glisse)
        else { base = Math.round((angle + 28) / 360) * 360 - 28; l.style.transition = "transform 700ms var(--ease)"; tourne(base); angle = base }
      }
      raf = requestAnimationFrame(glisse)
    }
    scene.addEventListener("pointerdown", bas)
    scene.addEventListener("pointermove", bouge)
    scene.addEventListener("pointerup", fin)
    scene.addEventListener("pointercancel", fin)
    return () => {
      cancelAnimationFrame(raf)
      scene.removeEventListener("pointerdown", bas)
      scene.removeEventListener("pointermove", bouge)
      scene.removeEventListener("pointerup", fin)
      scene.removeEventListener("pointercancel", fin)
    }
  }, [ref, cle])
}

function Dos({ l, k, statut, onOuvrir }: { l: Livre; k: number; statut?: Statut; onOuvrir: (el: HTMLElement) => void }) {
  const largeur = Math.max(30, Math.min(52, Math.round(l.pages / 9)))
  const hauteur = 150 + ((l.titre.length * 7 + l.pages) % 46)
  const penche = k === 2 && l.titre.length % 2 === 0
  return (
    <button className={`dos${penche ? " penche" : ""}`} onClick={e => onOuvrir(e.currentTarget)}
      aria-label={`${l.titre}, ${l.auteur}${lisible(l) ? ", à lire dans l'app" : l.type === "fiche" ? ", fiche" : ""}`}
      style={{ width: largeur, height: hauteur, color: l.c[1], animationDelay: `${k * 55}ms`,
        background: `linear-gradient(90deg, rgba(0,0,0,.18), transparent 22%, transparent 78%, rgba(0,0,0,.22)), ${l.c[0]}` }}>
      {statut === "lu" ? <span className="pastille m-lu" title="Lu">✓</span> : lisible(l) ? <span className="pastille m-lire" title="À lire dans l'app">▸</span> : null}
      <span className="bande" /><span className="titre">{l.titre}</span>
      <span className="ini">{l.auteur.split(" et ")[0].split(" ").slice(-1)[0].slice(0, 3)}</span><span className="bande" />
    </button>
  )
}

export default function BibliothequeSection({ userId }: { userId: string }) {
  const [etat, setEtat] = useState<EtatBiblio>(ETAT_VIDE)
  const [charge, setCharge] = useState(false)
  const [vue, setVue] = useState<"etagere" | "grille">(() => lireLocal("biblio-vue", "etagere"))
  const [filtre, setFiltre] = useState<Filtre>("tous")
  const [q, setQ] = useState("")
  const [fiche, setFiche] = useState<{ id: string; depuis: DOMRect | null; n: number } | null>(null)
  const [lecture, setLecture] = useState<string | null>(null)
  const [erreurSauvegarde, setErreurSauvegarde] = useState(false)

  const heroRef = useRef<HTMLDivElement>(null)
  const segmentRef = useRef<HTMLDivElement>(null)
  const aSauver = useRef<EtatBiblio | null>(null)

  useEffect(() => {
    let vivant = true
    chargerEtat(userId).then(e => { if (vivant) { setEtat(e); setCharge(true) } })
    return () => { vivant = false }
  }, [userId])

  // Sauvegarde dans le compte, une seconde après le dernier changement
  useEffect(() => {
    if (!charge) return
    aSauver.current = etat
    const t = setTimeout(() => {
      aSauver.current = null
      enregistrerEtat(userId, etat).then(ok => setErreurSauvegarde(!ok))
    }, 1200)
    return () => clearTimeout(t)
  }, [etat, charge, userId])
  useEffect(() => () => { if (aSauver.current) enregistrerEtat(userId, aSauver.current) }, [userId])

  // Curseur du choix « Étagères / Couvertures »
  useEffect(() => {
    const placer = () => {
      const g = segmentRef.current
      const actif = g?.querySelector<HTMLElement>("[aria-pressed='true']"), c = g?.querySelector<HTMLElement>(".curseur")
      if (actif && c) { c.style.left = actif.offsetLeft + "px"; c.style.width = actif.offsetWidth + "px" }
    }
    placer()
    document.fonts?.ready.then(placer)
    window.addEventListener("resize", placer)
    return () => window.removeEventListener("resize", placer)
  }, [vue])

  const enCours = trouverLivre(etat.dernier || "") ?? LIVRES.find(l => l.id === "raison")!
  usePivotant(heroRef, enCours.id)

  const maj = (f: (e: EtatBiblio) => EtatBiblio) => setEtat(f)

  function changerStatut(id: string, s: Statut) {
    maj(e => {
      const statuts = { ...e.statuts }
      if (statuts[id] === s) delete statuts[id]; else statuts[id] = s
      return { ...e, statuts }
    })
  }

  function position(id: string, p: Position) {
    maj(e => {
      const a = e.positions[id]
      const meme = a && a.c === p.c && a.b === p.b && a.pct === p.pct
      if (meme && e.dernier === id && e.statuts[id]) return noterJour(e)
      return noterJour({
        ...e, positions: { ...e.positions, [id]: p }, dernier: id,
        statuts: e.statuts[id] ? e.statuts : { ...e.statuts, [id]: "encours" },
      })
    })
  }

  const ouvrirFiche = (id: string, el: HTMLElement | null) => setFiche(f => ({ id, depuis: el?.getBoundingClientRect() ?? null, n: (f?.n ?? 0) + 1 }))

  const recherche = sans(q.trim())
  const garde = (l: Livre) =>
    (filtre === "tous" || (filtre === "lire" && l.type === "lire") || (filtre === "fiche" && l.type === "fiche") || etat.statuts[l.id] === filtre)
    && (!recherche || sans(`${l.titre} ${l.auteur} ${l.desc} ${(l.idees || []).join(" ")} ${l.themes.join(" ")}`).includes(recherche))

  const pos = etat.positions[enCours.id]
  const pct = pos?.pct ?? 0
  const valeurs = Object.values(etat.statuts)
  const stats: [number, string][] = [
    [valeurs.filter(s => s === "lu").length, "livres lus"],
    [valeurs.filter(s => s === "alire").length, "dans ma liste"],
    [serie(etat.jours), "jours de suite"],
    [etat.passages.length, "passages surlignés"],
  ]

  const visibles = LIVRES.filter(garde)
  const livreLu = lecture ? trouverLivre(lecture) : undefined
  const livreFiche = fiche ? trouverLivre(fiche.id) : undefined

  return (
    <div className={`bib ${garamond.variable} ${cormorant.variable}`}>
      <div className="biblio">
        <section className="accueil" aria-label="Lecture en cours">
          <div>
            <div className="kicker">Espace étudiant</div>
            <h1>Ma Bibliothèque</h1>
            <div className="reprise">
              <div className="kicker" style={{ marginTop: 2 }}>{pos ? "Lecture en cours" : "Pour commencer"}</div>
              <div className="titre">{enCours.titre}</div>
              <div className="meta">{enCours.auteur}{pos ? ` · ${pct} %` : ` · ${enCours.pages} pages`}</div>
              <div className="jauge"><i style={{ width: `${pct}%` }} /></div>
              <div>
                <button className="bouton presse" onClick={() => setLecture(enCours.id)} disabled={!charge}>
                  {pos ? "Reprendre la lecture" : "Commencer la lecture"}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>
            <div className="stats">
              {stats.map(([n, t]) => <div className="stat" key={t}><b>{n}</b><span>{t}</span></div>)}
            </div>
            {erreurSauvegarde && <p className="droits">Ton avancement n&apos;a pas pu être enregistré. Il le sera dès que la connexion revient.</p>}
          </div>
          <div className="scene-hero" ref={heroRef} aria-hidden="true" key={enCours.id}><Livre3D l={enCours} w={132} /></div>
        </section>

        <div className="outils">
          <input className="recherche" type="search" placeholder="Titre, auteur, idée…" aria-label="Chercher un livre" value={q} onChange={e => setQ(e.target.value)} />
          <div className="segment" role="group" aria-label="Affichage" ref={segmentRef}>
            <span className="curseur" />
            {([["etagere", "Étagères"], ["grille", "Couvertures"]] as const).map(([v, n]) => (
              <button key={v} className="presse" aria-pressed={vue === v} onClick={() => { setVue(v); ecrireLocal("biblio-vue", v) }}>{n}</button>
            ))}
          </div>
        </div>
        <div className="filtres" role="group" aria-label="Filtrer">
          {FILTRES.map(([f, n]) => <button key={f} className="puce presse" aria-pressed={filtre === f} onClick={() => setFiltre(f)}>{n}</button>)}
        </div>

        {!visibles.length ? (
          <p style={{ color: "var(--encre-douce)", marginTop: 30 }}>{q ? `Aucun livre ne correspond à « ${q} ».` : "Aucun livre ici pour l'instant."}</p>
        ) : vue === "grille" ? (
          <div className="grille">
            {visibles.map((l, i) => (
              <button key={l.id} className="vignette presse" style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }} onClick={e => ouvrirFiche(l.id, e.currentTarget.querySelector(".mini"))}>
                <div className="mini"><Couverture l={l} /></div>
                <div className="legende">{l.titre}<span>{l.auteur}{lisible(l) ? " · à lire ici" : ""}</span></div>
              </button>
            ))}
          </div>
        ) : THEMES.map(t => {
          const ls = visibles.filter(l => l.themes.includes(t))
          if (!ls.length) return null
          return (
            <section className="etagere" key={t}>
              <div className="etagere-titre"><h2>{t}</h2><span>{ls.length} livre{ls.length > 1 ? "s" : ""}</span></div>
              <div className="rayon">
                {ls.map((l, k) => <Dos key={l.id} l={l} k={k} statut={etat.statuts[l.id]} onOuvrir={el => ouvrirFiche(l.id, el)} />)}
                <span className="serre" aria-hidden="true" />
              </div>
              <div className="planche" />
            </section>
          )
        })}
      </div>

      {fiche && livreFiche && (
        <Fiche key={fiche.n} l={livreFiche} depuis={fiche.depuis} statut={etat.statuts[livreFiche.id]} pct={etat.positions[livreFiche.id]?.pct}
          onStatut={s => changerStatut(livreFiche.id, s)}
          onAutre={id => ouvrirFiche(id, null)}
          onLire={() => { setFiche(null); setLecture(livreFiche.id) }}
          onFermer={() => setFiche(null)} />
      )}

      {livreLu && (
        <LecteurLivre key={livreLu.id} livre={livreLu} etat={etat} onChange={maj} onPosition={position} onFermer={() => setLecture(null)} />
      )}
    </div>
  )
}

function Fiche({ l, depuis, statut, pct, onStatut, onAutre, onLire, onFermer }: {
  l: Livre; depuis: DOMRect | null; statut?: Statut; pct?: number
  onStatut: (s: Statut) => void; onAutre: (id: string) => void; onLire: () => void; onFermer: () => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const [idee, setIdee] = useState(0)
  const sceneRef = useRef<HTMLDivElement>(null)
  const dialogueRef = useRef<HTMLDivElement>(null)
  const rappel = useRef(onFermer)
  usePivotant(sceneRef, l.id)

  useEffect(() => { rappel.current = onFermer })

  function fermer() {
    setOuvert(false)
    setTimeout(() => rappel.current(), 240)
  }

  useEffect(() => {
    const avant = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const touche = (e: KeyboardEvent) => { if (e.key === "Escape") { setOuvert(false); setTimeout(() => rappel.current(), 240) } }
    window.addEventListener("keydown", touche)
    dialogueRef.current?.focus()
    return () => { document.body.style.overflow = avant; window.removeEventListener("keydown", touche) }
  }, [])

  // Ouverture : la fiche monte, et le livre quitte l'étagère pour venir s'y poser
  useEffect(() => {
    let r2 = 0, minuterie: ReturnType<typeof setTimeout> | undefined
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => {
      setOuvert(true)
      const cible = sceneRef.current?.querySelector<HTMLElement>(".l3d")
      const racine = sceneRef.current?.closest(".bib")
      if (!depuis || !cible || !racine || reduit()) return
      minuterie = setTimeout(() => {
        const b = cible.getBoundingClientRect()
        if (!b.width) return
        const w = cible.offsetWidth, h = cible.offsetHeight
        const f = document.createElement("div")
        f.className = "volant"
        f.style.cssText = `left:${b.left + b.width / 2 - w / 2}px;top:${b.top + b.height / 2 - h / 2}px;width:${w}px;height:${h}px`
        const copie = cible.cloneNode(true) as HTMLElement
        copie.style.transition = "none"
        f.appendChild(copie)
        racine.appendChild(f)
        cible.style.visibility = "hidden"
        const dx = depuis.left + depuis.width / 2 - (b.left + b.width / 2), dy = depuis.top + depuis.height / 2 - (b.top + b.height / 2), sc = depuis.height / h
        copie.animate([
          { transform: `translate(${dx}px, ${dy}px) scale(${sc}) rotateY(80deg)` },
          { transform: `translate(${dx * .4}px, ${dy * .5 - 60}px) scale(${(sc + 1) / 2 * 1.08}) rotateY(20deg) rotateX(6deg)`, offset: .55 },
          { transform: "translate(0,0) scale(1) rotateY(-28deg) rotateX(4deg)" },
        ], { duration: 720, easing: "cubic-bezier(.2,.8,.2,1)" }).onfinish = () => { cible.style.visibility = ""; f.remove() }
      }, 60)
    }) })
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); clearTimeout(minuterie) }
  }, [depuis])

  const proches = LIVRES.filter(x => x.id !== l.id && x.themes.some(t => l.themes.includes(t))).slice(0, 8)
  const an = l.annee < 0 ? `vers ${-l.annee} av. J.-C.` : String(l.annee)
  const idees = l.idees || []
  const iStatut = STATUTS.findIndex(([k]) => k === statut)

  return (
    <div className={`voile${ouvert ? " ouvert" : ""}`} onClick={e => { if (e.target === e.currentTarget) fermer() }}>
      <div className="fiche" role="dialog" aria-modal="true" aria-label={l.titre} tabIndex={-1} ref={dialogueRef}>
        <div className="poignee" aria-hidden="true" />
        <div className="fiche-haut">
          <div>
            <div className="scene-fiche" ref={sceneRef}><Livre3D l={l} w={132} /></div>
            <div className="tourner-aide">Fais tourner le livre du doigt</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>{l.titre}</h2>
            <div className="auteur">{l.auteur}, {an}</div>
            <div className="themes">
              {l.themes.map(t => <span className="theme" key={t}>{t}</span>)}
              <span className="theme" style={{ background: "var(--salle)", color: "var(--encre-douce)" }}>{l.pages} pages</span>
            </div>
          </div>
        </div>

        <div className="statuts" role="group" aria-label="Où en es-tu ?">
          <span className="curseur" style={{ opacity: iStatut < 0 ? 0 : 1, transform: `translateX(${Math.max(0, iStatut) * 100}%)` }} />
          {STATUTS.map(([k, n]) => <button key={k} className="presse" aria-pressed={statut === k} onClick={() => onStatut(k)}>{n}</button>)}
        </div>

        <h3>Le livre</h3>
        <p className="desc">{l.desc}</p>

        {idees.length > 0 && (
          <>
            <h3>Idées clés{idees.length > 1 ? " · fais glisser" : ""}</h3>
            <div className="cartes" onScroll={e => {
              const el = e.currentTarget, premier = el.firstElementChild as HTMLElement | null
              if (premier) setIdee(Math.round(el.scrollLeft / (premier.offsetWidth + 12)))
            }}>
              {idees.map((t, i) => <div className="idee" key={i}><span className="n">{ROMAINS[i]}</span><p>{t}</p></div>)}
            </div>
            {idees.length > 1 && <div className="points" aria-hidden="true">{idees.map((_, i) => <i key={i} className={i === idee ? "actif" : ""} />)}</div>}
          </>
        )}

        <div className="actions">
          {lisible(l) ? (
            <button className="bouton presse" onClick={onLire}>{pct ? `Reprendre · ${pct} %` : "Ouvrir le livre"}</button>
          ) : l.type === "lire" ? (
            <span className="bientot">Texte bientôt disponible dans l&apos;app</span>
          ) : null}
          <button className="bouton second presse" onClick={fermer}>Fermer</button>
        </div>
        <p className="droits">{l.type === "lire"
          ? "Texte libre de droits, lisible en entier dans l'app."
          : "Livre protégé par le droit d'auteur : la fiche donne une présentation et des idées clés écrites pour toi, pas le texte du livre. Tu le trouves en bibliothèque, en librairie ou en livre audio."}</p>

        {proches.length > 0 && (
          <>
            <h3>Si tu as aimé, lis aussi</h3>
            <div className="aussi">
              {proches.map(x => <button key={x.id} className="vignette presse" aria-label={x.titre} onClick={() => onAutre(x.id)}><div className="mini"><Couverture l={x} /></div></button>)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
