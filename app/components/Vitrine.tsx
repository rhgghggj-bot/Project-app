"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import s from "./vitrine.module.css"

// Vitrine de la page de connexion : les nouveautés de l'espace étudiant, une à
// la fois, avec une petite scène animée. Elles défilent seules (sauf si
// l'appareil demande moins d'animations) et s'arrêtent dès qu'on en choisit une.

const DUREE = 5200
const MOINS = "(prefers-reduced-motion: reduce)"
const suivreMouvement = (f: () => void) => { const m = window.matchMedia(MOINS); m.addEventListener("change", f); return () => m.removeEventListener("change", f) }

const Ico = ({ d }: { d: string }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)

const NOUVEAUTES = [
  { id: "carnet", nom: "Carnet et crayon", ico: "M15 4l5 5-8 8H7v-5zM7 17l-3 3h6",
    titre: "Passe le crayon, c'est surligné.", texte: "Prends tes notes de cours, importe tes PDF et surligne au doigt, sans sélectionner. Cinq couleurs, encadrés, tableaux, export Word." },
  { id: "cartes", nom: "Cartes de révision", ico: "M3 7h14v12H3zM7 3h14v12",
    titre: "Tes surlignages deviennent des cartes.", texte: "Chaque passage surligné devient une question. L'appli te les repose au bon moment, jusqu'à ce que tu les saches." },
  { id: "planning", nom: "Planning d'examen", ico: "M4 5h16v15H4zM4 10h16M9 3v4M15 3v4",
    titre: "Un plan jour par jour jusqu'à l'examen.", texte: "Donne la date et les chapitres : l'appli répartit les séances, les ajoute à ton calendrier et te dit quelle note viser." },
  { id: "livres", nom: "Bibliothèque", ico: "M4 4h6a3 3 0 013 3v13a2 2 0 00-2-2H4zM20 4h-6a3 3 0 00-3 3v13a2 2 0 012-2h7z",
    titre: "Des livres qui se lisent comme des vrais.", texte: "Schopenhauer, Marc Aurèle, Machiavel… 13 classiques en entier et 27 fiches de livres récents. La page se tourne au doigt." },
  { id: "nuage", nom: "Nuage des surlignages", ico: "M5 18c3-8 6 2 9-6s4-4 5-6",
    titre: "Le fil rouge de ton chapitre.", texte: "Tes surlignages forment un nuage relié par les notions du cours. Touche un point : l'appli te dit s'il est essentiel." },
] as const

type Id = (typeof NOUVEAUTES)[number]["id"]

function Scene({ id }: { id: Id }) {
  if (id === "carnet") return (
    <div className={s.mock}>
      Le bilan présente la <span className={s.surl}>situation financière de l&apos;entreprise</span>{" "}à une date donnée.
      L&apos;actif, c&apos;est ce qu&apos;elle possède ; le passif, d&apos;où viennent les ressources.
      <svg className={s.crayon} style={{ left: 128, top: 12, "--fin": "150px" } as React.CSSProperties} viewBox="0 0 24 24" fill="#13294d" aria-hidden="true">
        <path d="M15 4l5 5-8 8H7v-5z" /><rect x="3" y="19" width="9" height="2.5" rx="1" fill="#E3B23C" />
      </svg>
    </div>
  )
  if (id === "cartes") return (
    <div>
      <div className={s.carteZone}>
        <div className={s.carte}>
          <div className={s.recto}><small>Question</small><b>Le bilan présente la ______ de l&apos;entreprise.</b></div>
          <div className={s.verso}><small>Réponse</small><b>situation financière</b></div>
        </div>
      </div>
      <div className={s.boutonsCarte} aria-hidden="true"><span>Pas su</span><span>Presque</span><span>Je savais</span></div>
    </div>
  )
  if (id === "planning") return (
    <div className={s.jours}>
      {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((j, k) => (
        <div key={j} className={`${s.jour}${k === 6 ? ` ${s.examen}` : ""}`}>
          <b>{12 + k}</b>{j}
          {k < 6 ? <i className={s.seance} style={{ background: k % 3 === 2 ? "#E9C46A" : "#8FC1FF", animationDelay: `${k * 160}ms` }} /> : <span style={{ display: "block", fontSize: 10, marginTop: 4 }}>Examen</span>}
        </div>
      ))}
    </div>
  )
  if (id === "livres") return (
    <div className={s.livre} aria-hidden="true">
      <div className={s.pg}><b style={{ fontSize: 11 }}>Pensées pour moi-même</b>{Array.from({ length: 7 }, (_, k) => <i key={k} className={s.ligne} style={{ width: `${70 + ((k * 13) % 30)}%` }} />)}</div>
      <div className={s.pg}>{Array.from({ length: 9 }, (_, k) => <i key={k} className={s.ligne} style={{ width: `${68 + ((k * 17) % 32)}%` }} />)}</div>
      <div className={s.feuille} />
    </div>
  )
  return (
    <svg viewBox="0 0 300 150" width="100%" aria-hidden="true" className={s.mockSombre} style={{ borderRadius: 14, display: "block" }}>
      <path className={s.fil} pathLength={1} d="M30 40 C80 10, 110 110, 150 80 S230 20, 270 110" fill="none" stroke="#E0453A" strokeWidth="2.5" strokeLinecap="round" />
      {[[30, 40, 11, "#FFE66D"], [94, 62, 8, "#B7F0C8"], [150, 80, 11, "#FFC7DE"], [212, 52, 8, "#BFE3FF"], [270, 110, 7, "#fff"], [60, 118, 5, "#FFD8A8"], [250, 28, 5, "#FFE66D"]].map(([x, y, r, c], k) => (
        <circle key={k} className={s.pt} cx={x} cy={y} r={r} fill={String(c)} stroke={Number(r) === 11 ? "#E0453A" : "rgba(0,0,0,.25)"} strokeWidth={Number(r) === 11 ? 2.5 : 1}
          strokeDasharray={k === 4 ? "3 2.5" : undefined} style={{ animationDelay: `${k * 120}ms` }} />
      ))}
    </svg>
  )
}

export default function Vitrine() {
  const [actif, setActif] = useState(0)
  const [arrete, setArrete] = useState(false)
  const [pause, setPause] = useState(false)
  // Défilement seul seulement si l'appareil accepte les animations
  const moins = useSyncExternalStore(suivreMouvement, () => window.matchMedia(MOINS).matches, () => true)
  const auto = !moins && !arrete

  useEffect(() => {
    if (!auto || pause) return
    const t = setTimeout(() => setActif(i => (i + 1) % NOUVEAUTES.length), DUREE)
    return () => clearTimeout(t)
  }, [actif, auto, pause])

  const n = NOUVEAUTES[actif]
  const choisir = (i: number) => { setActif(i); setArrete(true) }

  return (
    <section className={s.vitrine} aria-label="Nouveautés de Nexia" onPointerEnter={() => setPause(true)} onPointerLeave={() => setPause(false)}
      onFocus={() => setPause(true)} onBlur={() => setPause(false)}>
      <span className={s.badge}>Nouveau · Espace étudiant</span>
      <h1 className={s.titre}>Révise moins longtemps, <em>retiens mieux.</em></h1>
      <p className={s.sous}>Notes, cartes de révision, planning d&apos;examen et bibliothèque : tout ton travail d&apos;étudiant au même endroit, à côté de tes finances et de tes groupes.</p>

      <div className={s.scene}>
        <div className={s.ecran} role="tabpanel" id="vitrine-panneau" aria-label={n.nom}>
          <div key={n.id} className={s.entre}>
            <h3>{n.titre}</h3>
            <p>{n.texte}</p>
            <Scene id={n.id} />
          </div>
        </div>
        <div className={s.liste} role="tablist" aria-label="Choisir une nouveauté">
          {NOUVEAUTES.map((x, i) => (
            <button key={x.id} role="tab" aria-selected={i === actif} aria-controls="vitrine-panneau" className={s.choix} onClick={() => choisir(i)}>
              <span className={s.ico}><Ico d={x.ico} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                {x.nom}
                {auto && i === actif && (
                  <span className={s.progres} aria-hidden="true">
                    <i key={actif} style={{ animationDuration: `${DUREE}ms`, animationPlayState: pause ? "paused" : "running" }} />
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
        <div className={s.points} role="tablist" aria-label="Choisir une nouveauté">
          {NOUVEAUTES.map((x, i) => (
            <button key={x.id} role="tab" aria-selected={i === actif} aria-label={x.nom} onClick={() => choisir(i)}><i /></button>
          ))}
        </div>
      </div>

      <div className={s.aussi}>
        <span>Et toujours :</span>
        {["Finances", "Groupes et discussions", "Calendrier", "Impôts suisses", "Marketplace"].map(t => <span key={t} className={s.puce}>{t}</span>)}
      </div>
    </section>
  )
}
