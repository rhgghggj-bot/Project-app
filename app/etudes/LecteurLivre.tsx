"use client"

import { useEffect, useRef, useState } from "react"
import { chargerTexte, jourISO, type EtatBiblio, type Livre, type Position, type TexteLivre } from "@/lib/bibliotheque"
import { creerLecteur, type InfoLecteur, type Lecteur } from "./lecteur"
import { cormorant, garamond } from "./polices"

type Ambiance = "papier" | "sepia" | "nuit"
const AMBIANCES: [Ambiance, string, string, string][] = [["papier", "Papier", "#FBF8F1", "#2A2621"], ["sepia", "Sépia", "#F1E3C6", "#3B2E1E"], ["nuit", "Nuit", "#24282D", "#D9D4C7"]]

const lireLocal = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } }
const ecrireLocal = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* stockage indisponible */ } }

const ICO = {
  retour: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 5l-7 7 7 7" /></svg>,
  aa: <span style={{ fontFamily: "var(--f-livre)", fontSize: 17 }}>A<span style={{ fontSize: 12 }}>a</span></span>,
  signet: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12v18l-6-4.5L6 21z" /></svg>,
  som: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>,
  stylo: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4l5 5-8 8H7v-5zM7 17l-3 3h6" /></svg>,
}

export default function LecteurLivre({ livre, etat, onChange, onPosition, onFermer }: {
  livre: Livre
  etat: EtatBiblio
  onChange: (f: (e: EtatBiblio) => EtatBiblio) => void
  onPosition: (id: string, p: Position) => void
  onFermer: () => void
}) {
  const [texte, setTexte] = useState<TexteLivre | null>(null)
  const [erreur, setErreur] = useState(false)
  const [ambiance, setAmbiance] = useState<Ambiance>(() => lireLocal("biblio-amb", "papier"))
  const [taille, setTaille] = useState<number>(() => lireLocal("biblio-taille", 17))
  const [stylo, setStylo] = useState(false)
  const [panneau, setPanneau] = useState<"aa" | "som" | null>(null)
  const [info, setInfo] = useState<InfoLecteur | null>(null)
  const [sel, setSel] = useState<{ c: number; b: number; t: string; x: number; y: number } | null>(null)
  const [bulle, setBulle] = useState<string | null>(null)

  const sceneRef = useRef<HTMLDivElement>(null)
  const ouvertRef = useRef<HTMLDivElement>(null)
  const lecteurRef = useRef<Lecteur | null>(null)
  const etatRef = useRef(etat)
  const rappels = useRef({ onPosition, onFermer })
  const minuterie = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const signets = etat.signets[livre.id] || []
  const passages = etat.passages.filter(p => p.livre === livre.id)

  function montrer(t: string, ms = 2400) {
    setBulle(t)
    clearTimeout(minuterie.current)
    minuterie.current = setTimeout(() => setBulle(null), ms)
  }

  useEffect(() => { rappels.current = { onPosition, onFermer } })

  // Les marque-pages et surlignages changent : on redessine la page
  useEffect(() => {
    etatRef.current = etat
    lecteurRef.current?.rendre()
  }, [etat])

  useEffect(() => {
    let vivant = true
    // Les polices doivent être prêtes avant de découper les pages, sinon la mesure est fausse
    const polices = Promise.all([
      `400 17px ${garamond.style.fontFamily}`, `italic 400 17px ${garamond.style.fontFamily}`, `600 17px ${garamond.style.fontFamily}`,
      `600 17px ${cormorant.style.fontFamily}`, `700 17px ${cormorant.style.fontFamily}`,
    ].map(f => document.fonts?.load(f).catch(() => null)))
    Promise.all([chargerTexte(livre.id), polices]).then(([t]) => { if (vivant) setTexte(t) }).catch(() => { if (vivant) setErreur(true) })
    return () => { vivant = false }
  }, [livre.id])

  useEffect(() => {
    const avant = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = avant; clearTimeout(minuterie.current) }
  }, [])

  useEffect(() => {
    if (!texte || !sceneRef.current || !ouvertRef.current) return
    const l = creerLecteur({
      scene: sceneRef.current, ouvert: ouvertRef.current, texte, auteur: livre.auteur.split(" et ")[0].split(" ").slice(-1)[0],
      taille: lireLocal("biblio-taille", 17),
      depart: etatRef.current.positions[livre.id] || null,
      signets: () => etatRef.current.signets[livre.id] || [],
      passages: () => etatRef.current.passages.filter(p => p.livre === livre.id),
      onPosition: i => { setInfo(i); rappels.current.onPosition(livre.id, { c: i.c, b: i.premier, pct: i.pct }) },
      onSelection: setSel,
    })
    lecteurRef.current = l
    if (!lireLocal("biblio-aide-tour", false)) {
      ecrireLocal("biblio-aide-tour", true)
      setTimeout(() => montrer("Fais glisser la page pour la tourner"), 400)
    }
    return () => { l.detruire(); lecteurRef.current = null }
  }, [texte, livre.id, livre.auteur])

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") lecteurRef.current?.tourner(1)
      if (e.key === "ArrowLeft") lecteurRef.current?.tourner(-1)
      if (e.key === "Escape") rappels.current.onFermer()
    }
    window.addEventListener("keydown", touche)
    return () => window.removeEventListener("keydown", touche)
  }, [])

  function basculerSignet() {
    if (!info) return
    const ici = (s: Position) => s.c === info.c && s.b >= info.premier && s.b <= info.dernier
    const avait = signets.some(ici)
    onChange(e => {
      const liste = e.signets[livre.id] || []
      return { ...e, signets: { ...e.signets, [livre.id]: avait ? liste.filter(s => !ici(s)) : [...liste, { c: info.c, b: info.premier }] } }
    })
    montrer(avait ? "Marque-page retiré" : "Marque-page ajouté")
  }

  function basculerStylo() {
    const v = !stylo
    setStylo(v)
    lecteurRef.current?.surligneur(v)
    montrer(v ? "Sélectionne un passage pour le surligner" : "Surligneur rangé")
  }

  function surligner() {
    if (!sel) return
    const s = sel
    onChange(e => ({ ...e, passages: [...e.passages, { livre: livre.id, c: s.c, b: s.b, t: s.t, le: jourISO() }] }))
    document.getSelection()?.removeAllRanges()
    setSel(null)
    montrer("Passage surligné · il arrive aussi dans tes cartes de révision")
  }

  function retirerPassage(k: number) {
    const cible = passages[k]
    onChange(e => ({ ...e, passages: e.passages.filter(p => p !== cible) }))
  }

  function aller(c: number, b: number) {
    lecteurRef.current?.allerBloc(c, b)
    setPanneau(null)
  }

  const ici = info ? signets.some(s => s.c === info.c && s.b >= info.premier && s.b <= info.dernier) : false
  const chapitres = texte?.chapitres || []
  const parChapitre = chapitres.length > 1

  return (
    <div className={`lecteur amb-${ambiance}`} role="dialog" aria-modal="true" aria-label={livre.titre}>
      <div className="lect-barre">
        <button className="icone presse" onClick={onFermer} aria-label="Retour à la bibliothèque">{ICO.retour}</button>
        <div className="titre">{livre.titre}</div>
        <button className="icone presse" onClick={() => setPanneau(p => p === "som" ? null : "som")} aria-label="Sommaire et marque-pages" aria-pressed={panneau === "som"}>{ICO.som}</button>
        <button className="icone presse" onClick={() => setPanneau(p => p === "aa" ? null : "aa")} aria-label="Texte et ambiance" aria-pressed={panneau === "aa"}>{ICO.aa}</button>
        <button className="icone presse" onClick={basculerStylo} aria-label="Surligner" aria-pressed={stylo}>{ICO.stylo}</button>
        <button className="icone presse" onClick={basculerSignet} aria-label="Marque-page" aria-pressed={ici}>{ICO.signet}</button>
      </div>

      <div className="scene" ref={sceneRef}>
        <div className="livre-ouvert" ref={ouvertRef} />
        {!texte && <div style={{ position: "absolute", fontFamily: "var(--f-livre)", fontSize: 18, opacity: .8 }}>{erreur ? "Le livre n'a pas pu être chargé. Vérifie ta connexion." : "Ouverture du livre…"}</div>}
      </div>

      <div className="lect-bas">
        {info && (parChapitre ? (
          <>
            <input type="range" min={1} max={chapitres.length} value={info.c + 1} aria-label="Aller au chapitre"
              onChange={e => lecteurRef.current?.allerChapitre(Number(e.target.value) - 1)} />
            <span className="num">Chap. {info.c + 1}/{chapitres.length} · {info.pct} %</span>
          </>
        ) : (
          <>
            <input type="range" min={1} max={info.pages} value={info.i + 1} aria-label="Aller à la page"
              onChange={e => lecteurRef.current?.allerPage(Number(e.target.value) - 1)} />
            <span className="num">{info.i + 1} / {info.pages}</span>
          </>
        ))}
      </div>

      <div className={`bulle${bulle ? " vue" : ""}`} role="status">{bulle}</div>

      {panneau === "aa" && (
        <div className="panneau">
          <label>Ambiance</label>
          <div className="ambiances">
            {AMBIANCES.map(([k, n, f, c]) => (
              <button key={k} className="presse" aria-pressed={ambiance === k} style={{ background: f, color: c }}
                onClick={() => { setAmbiance(k); ecrireLocal("biblio-amb", k) }}>{n}</button>
            ))}
          </div>
          <label htmlFor="biblio-taille">Taille du texte</label>
          <input id="biblio-taille" type="range" min={14} max={24} step={1} value={taille}
            onChange={e => setTaille(Number(e.target.value))}
            onPointerUp={e => { const t = Number((e.target as HTMLInputElement).value); ecrireLocal("biblio-taille", t); lecteurRef.current?.taille(t) }}
            onKeyUp={e => { const t = Number((e.target as HTMLInputElement).value); ecrireLocal("biblio-taille", t); lecteurRef.current?.taille(t) }} />
        </div>
      )}

      {panneau === "som" && (
        <div className="panneau">
          {parChapitre && (
            <>
              <label>Sommaire</label>
              <div className="som">
                {chapitres.map((ch, c) => (
                  <button key={c} onClick={() => aller(c, 0)} aria-current={info?.c === c}
                    style={info?.c === c ? { color: "var(--accent)" } : undefined}>{ch.titre}<span>{c + 1}</span></button>
                ))}
              </div>
            </>
          )}
          {signets.length > 0 && (
            <>
              <label style={{ marginTop: 14 }}>Marque-pages</label>
              <div className="som">
                {[...signets].sort((a, b) => a.c - b.c || a.b - b.b).map((s, k) => (
                  <button key={k} onClick={() => aller(s.c, s.b)}>{chapitres[s.c]?.titre || `Chapitre ${s.c + 1}`}<span>🔖</span></button>
                ))}
              </div>
            </>
          )}
          {passages.length > 0 && (
            <>
              <label style={{ marginTop: 14 }}>Passages surlignés</label>
              <div className="som">
                {passages.map((p, k) => (
                  <div className="ligne" key={k}>
                    <button onClick={() => aller(p.c, p.b)} style={{ fontSize: 14.5 }}>« {p.t.length > 80 ? p.t.slice(0, 80) + "…" : p.t} »</button>
                    <button className="suppr" onClick={() => retirerPassage(k)} aria-label="Retirer ce passage">×</button>
                  </div>
                ))}
              </div>
            </>
          )}
          {!parChapitre && !signets.length && !passages.length && <label>Pas encore de marque-page ni de passage surligné.</label>}
        </div>
      )}

      {sel && stylo && (
        <button className="flottant" style={{ left: sel.x, top: sel.y }} onPointerDown={e => e.preventDefault()} onClick={surligner}>Surligner</button>
      )}
    </div>
  )
}
