"use client"

import { useEffect, useRef, useState } from "react"
import { colors } from "@/app/components/ui/tokens"
import { COULEURS_SURLIGNEUR } from "@/lib/carnet"
import { analyser, LIBELLES, type Importance, type Reference } from "@/lib/nuage"

// Nuage de points des surlignages : un fil rouge relie les notions du chapitre
// dans leur ordre ; chaque passage se pose sur la notion qu'il touche. Toucher
// un point explique son importance pour comprendre le chapitre.

const ROUGE = "#E0453A"
const W = 340
const RAYON: Record<Importance, number> = { essentiel: 12, utile: 9, detail: 6 }
const BADGE: Record<Importance, [string, string]> = { essentiel: ["#FDECEA", "#B42318"], utile: ["#E8F1FF", "#1D4ED8"], detail: ["#F1F3F6", "#4B5563"] }
const hex = (id: string) => COULEURS_SURLIGNEUR.find(c => c.id === id)?.hex ?? COULEURS_SURLIGNEUR[0].hex
const court = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1) + "…" : t)

// Courbe douce qui passe par tous les points (Catmull-Rom → Bézier)
function courbe(p: [number, number][]) {
  if (p.length < 2) return ""
  let d = `M${p[0][0]},${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i], b = p[i], c = p[i + 1], e = p[i + 2] ?? c
    d += ` C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6},${c[1] - (e[1] - b[1]) / 6} ${c[0]},${c[1]}`
  }
  return d
}

export default function NuageSurlignages({ passages, reference, chargement, onAller }: {
  passages: { texte: string; couleur: string }[]
  reference: Reference | null
  chargement: boolean
  onAller: (i: number) => void
}) {
  const [choix, setChoix] = useState<{ point: number } | { etape: number } | null>(null)
  const ficheRef = useRef<HTMLDivElement>(null)
  // L'explication apparaît sous le nuage : on la fait venir à l'écran
  useEffect(() => { if (choix) ficheRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }) }, [choix])
  const { points, etapes } = analyser(passages, reference)
  const avecFil = etapes.length > 0

  // Places : les notions serpentent de haut en bas ; sans chapitre, les passages suivent l'ordre de la note
  const ancres: [number, number][] = (avecFil ? etapes : points).map((_, k) => [Math.round(W / 2 + Math.sin(k * 1.25 + 0.6) * W * 0.25), 46 + k * 80] as [number, number])
  const pos = new Map<number, [number, number]>()
  if (avecFil) {
    etapes.forEach((e, k) => e.points.forEach((i, j) => {
      const [x, y] = ancres[k]
      const a = j * 2.3 - 0.8
      pos.set(i, j === 0 ? [x, y] : [x + Math.cos(a) * 26, y + Math.sin(a) * 22])
    }))
  } else points.forEach((p, k) => pos.set(p.i, ancres[k]))
  const hors = points.filter(p => !pos.has(p.i))
  const H = Math.max(220, (ancres.length ? ancres[ancres.length - 1][1] : 0) + 50)
  hors.forEach((p, j) => {
    const gauche = j % 2 === 0
    pos.set(p.i, [gauche ? 24 + ((j * 53) % 34) : W - 24 - ((j * 37) % 34), 30 + ((j * 97 + 40) % (H - 60))])
  })

  const lesEtapes = avecFil ? etapes : []
  const couvertes = lesEtapes.filter(e => e.points.length).length
  const sel = choix && "point" in choix ? points[choix.point] : null
  const selEtape = choix && "etape" in choix ? choix.etape : null

  if (!passages.length) return <p style={{ fontSize: 13, color: colors.textMuted }}>Surligne des passages dans ta note : ils apparaîtront ici comme des points.</p>

  return (
    <div>
      <p style={{ fontSize: 12.5, color: colors.textMuted, margin: "2px 4px 6px", lineHeight: 1.45 }}>
        {chargement ? "Chargement du chapitre…"
          : reference ? <>Fil rouge : <b style={{ color: colors.text }}>{reference.titre}</b>. {couvertes} notion{couvertes > 1 ? "s" : ""} sur {lesEtapes.length} surlignée{couvertes > 1 ? "s" : ""}. Touche un point.</>
          : "Note reliée à aucun chapitre : les points suivent l'ordre de ta note. Relie-la à un chapitre pour voir le fil rouge et l'importance de chaque passage."}
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="group" aria-label="Nuage des surlignages" style={{ display: "block", background: "#FAFBFD", borderRadius: 14, border: `1px solid ${colors.border}` }}>
        {ancres.length > 1 && (
          <path d={courbe(ancres)} fill="none" stroke={avecFil ? ROUGE : "#B8C0CC"} strokeWidth={avecFil ? 2.5 : 1.5} strokeLinecap="round"
            strokeDasharray={avecFil ? "1" : "4 5"} pathLength={avecFil ? 1 : undefined}>
            {avecFil && <animate attributeName="stroke-dashoffset" from="1" to="0" dur="1.1s" fill="freeze" />}
          </path>
        )}
        {lesEtapes.map((e, k) => {
          const [x, y] = ancres[k], droite = x < W / 2
          const place = Math.floor(((droite ? W - x : x) - 24) / 6)
          return (
            <g key={`e${k}`}>
              {!e.points.length && (
                <g role="button" tabIndex={0} aria-label={`Notion sans surlignage : ${e.titre}`} style={{ cursor: "pointer", outline: "none" }}
                  onClick={() => setChoix({ etape: k })} onKeyDown={ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setChoix({ etape: k }) } }}>
                  <circle cx={x} cy={y} r={20} fill="transparent" />
                  <circle cx={x} cy={y} r={7} fill="#fff" stroke={ROUGE} strokeWidth={1.5} strokeDasharray="3 2.5" />
                </g>
              )}
              <text x={x + (droite ? 18 : -18)} y={y - 12} textAnchor={droite ? "start" : "end"} fontSize={10.5} fill={e.points.length ? colors.text : "#9AA3AF"} fontWeight={600}>
                {k + 1}. {court(e.titre, Math.max(12, place))}
              </text>
            </g>
          )
        })}
        {points.map(p => {
          const [x, y] = pos.get(p.i)!, r = RAYON[p.importance], actif = sel?.i === p.i
          return (
            <g key={p.i} role="button" tabIndex={0} aria-label={`${LIBELLES[p.importance]} : ${p.texte}`} style={{ cursor: "pointer", outline: "none" }}
              onClick={() => setChoix({ point: p.i })} onKeyDown={ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setChoix({ point: p.i }) } }}>
              <circle cx={x} cy={y} r={Math.max(20, r + 6)} fill="transparent" />
              {actif && <circle cx={x} cy={y} r={r + 6} fill="none" stroke={colors.navy} strokeWidth={2} />}
              <circle cx={x} cy={y} r={r} fill={hex(p.couleur)} stroke={p.importance === "essentiel" ? ROUGE : "rgba(0,0,0,.28)"} strokeWidth={p.importance === "essentiel" ? 2.5 : 1} />
            </g>
          )
        })}
      </svg>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11.5, color: colors.textMuted, margin: "6px 4px 0" }}>
        <span>● gros : essentiel</span><span>● moyen : utile</span><span>• petit : détail</span>
        {avecFil && <span><span style={{ color: ROUGE }}>━</span> fil rouge du chapitre</span>}
      </div>

      <div ref={ficheRef}>
      {sel && (
        <div role="status" style={{ marginTop: 10, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 12, background: "#fff" }}>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "3px 10px", background: BADGE[sel.importance][0], color: BADGE[sel.importance][1] }}>
            {!reference ? LIBELLES[sel.importance] : sel.importance === "detail" ? "Détail, pas indispensable pour comprendre" : `${LIBELLES[sel.importance]} pour comprendre le chapitre`}
          </span>
          <p style={{ margin: "8px 0", fontSize: 14, lineHeight: 1.45, color: colors.text }}>
            <span style={{ background: hex(sel.couleur), borderRadius: 3, padding: "0 3px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>{sel.texte}</span>
          </p>
          <ul style={{ margin: "0 0 10px", paddingLeft: 18, fontSize: 13, lineHeight: 1.5, color: colors.text }}>
            {sel.raisons.map((r, k) => <li key={k}>{r}</li>)}
          </ul>
          <button className="carnet-choix" onClick={() => onAller(sel.i)}>Aller au passage</button>
        </div>
      )}
      {selEtape !== null && lesEtapes[selEtape] && (
        <div role="status" style={{ marginTop: 10, border: `1px dashed ${ROUGE}`, borderRadius: 14, padding: 12, background: "#fff" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#B42318" }}>Notion {selEtape + 1} sur {lesEtapes.length} · rien de surligné</span>
          <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.45, color: colors.text }}>
            « {lesEtapes[selEtape].titre} » fait partie du fil rouge du chapitre, mais aucun de tes passages n&apos;en parle.
            Vérifie si elle est dans ton cours : sans elle, il manque une étape pour tout comprendre.
          </p>
        </div>
      )}
      </div>
    </div>
  )
}
