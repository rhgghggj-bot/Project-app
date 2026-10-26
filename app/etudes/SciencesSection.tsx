"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { colors, radius } from "@/app/components/ui/tokens"
import { toast } from "@/lib/toast"
import { lireNombre } from "@/lib/esprit"
import { CHAPITRES, HISTOIRE, type Chapitre, type Defi } from "@/lib/renaissance"
import { CONTINENTS, NOTIONS, type Continent, type Espece } from "@/lib/biodiversite"
import { ETAT_SCIENCES_VIDE, chargerSciences, enregistrerSciences, reponseJuste, type EtatSciences } from "@/lib/sciences"
import type { ModeAtlas } from "./Atlas"

// Onglet « Sciences » : la biodiversité (continents, et le globe colorié par
// nombre d'espèces) et « Projet Graine », une histoire où l'on reconstruit la
// civilisation avec la chimie, la physique, les maths et la biologie.

const Atlas = dynamic(() => import("./Atlas"), { ssr: false })

type Partie = "nature" | "graine"
const carte: React.CSSProperties = { background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: 16, marginBottom: 12 }
const boutonPrincipal: React.CSSProperties = { minHeight: 44, padding: "0 18px", borderRadius: 999, border: "none", background: colors.blue, color: "#fff", fontWeight: 700, fontSize: 14.5, cursor: "pointer" }
const boutonSecondaire: React.CSSProperties = { minHeight: 44, padding: "0 16px", borderRadius: 999, border: `1px solid ${colors.border}`, background: "#fff", color: colors.text, fontSize: 14, cursor: "pointer" }
const titre3: React.CSSProperties = { fontSize: 15.5, fontWeight: 700, margin: "16px 0 8px", textWrap: "balance" }
const texte: React.CSSProperties = { fontSize: 14.5, lineHeight: 1.6, margin: "0 0 10px", textWrap: "pretty" }

// Un chapitre est fini quand tous ses défis sont réussis (ou leur solution lue)
const fini = (e: EtatSciences, c: Chapitre) => c.defis.every((_, i) => e.graine[c.id]?.[i])
const COULEUR_MATIERE: Record<string, string> = { Chimie: "#7A3FC2", Physique: "#1D6FD8", Maths: "#C2410C", Biologie: "#2E8B57" }

export default function SciencesSection({ userId }: { userId: string }) {
  const [etat, setEtat] = useState<EtatSciences | null>(null)
  const [partie, setPartie] = useState<Partie>("nature")
  const etatRef = useRef<EtatSciences>(ETAT_SCIENCES_VIDE)
  const [atlas, setAtlas] = useState<{ mode: ModeAtlas; centre?: [number, number] } | null>(null)
  const fermerAtlas = useCallback(() => setAtlas(null), [])

  useEffect(() => {
    let actif = true
    chargerSciences(userId).then(e => { if (actif) { etatRef.current = e; setEtat(e) } })
    return () => { actif = false }
  }, [userId])

  function maj(f: (e: EtatSciences) => EtatSciences) {
    const e = f(etatRef.current)
    etatRef.current = e
    setEtat(e)
    void enregistrerSciences(userId, e).then(ok => { if (!ok && navigator.onLine) toast("Progrès pas enregistré, vérifie ta connexion", "error") })
  }

  if (!etat) return <div className="nx-skel" style={{ height: 240, borderRadius: radius.md }} />
  const chapitresFinis = CHAPITRES.filter(c => fini(etat, c)).length

  return (
    <div>
      <section data-sans-inversion style={{ borderRadius: radius.md, padding: "16px 18px", background: "linear-gradient(135deg, #0B3B2E, #1B4D7A)", color: "#fff", marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Sciences</div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.82)", marginTop: 4, lineHeight: 1.45 }}>Découvre la nature de chaque continent et de chaque pays, puis reconstruis la civilisation avec la chimie, la physique et les maths.</div>
      </section>
      <div role="tablist" aria-label="Parties" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginBottom: 14 }}>
        {([
          { id: "nature", nom: "🌿 Biodiversité", sous: `${CONTINENTS.length} continents, tous les pays sur le globe` },
          { id: "graine", nom: "🧪 Projet Graine", sous: `${chapitresFinis} / ${CHAPITRES.length} chapitres finis` },
        ] as const).map(p => (
          <button key={p.id} role="tab" aria-selected={partie === p.id} onClick={() => setPartie(p.id)}
            style={{ textAlign: "left", borderRadius: radius.md, padding: "10px 12px", cursor: "pointer", minHeight: 44,
              border: `1.5px solid ${partie === p.id ? colors.blue : colors.border}`, background: partie === p.id ? colors.blueLight : "#fff", color: colors.text }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{p.nom}</div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{p.sous}</div>
          </button>
        ))}
      </div>

      {partie === "nature"
        ? <Biodiversite etat={etat} maj={maj} ouvrirGlobe={(mode, centre) => setAtlas({ mode, centre })} />
        : <Graine etat={etat} maj={maj} />}

      {atlas && <Atlas onFermer={fermerAtlas} depart={atlas} />}
    </div>
  )
}

// ─── Biodiversité ───
function Biodiversite({ etat, maj, ouvrirGlobe }: { etat: EtatSciences; maj: (f: (e: EtatSciences) => EtatSciences) => void; ouvrirGlobe: (mode: ModeAtlas, centre?: [number, number]) => void }) {
  const [choisi, setChoisi] = useState<string | null>(null)
  const c = CONTINENTS.find(x => x.id === choisi)
  if (c) return <FicheContinent c={c} etat={etat} maj={maj} retour={() => setChoisi(null)} ouvrirGlobe={ouvrirGlobe} />
  return (
    <>
      <section data-sans-inversion style={{ ...carte, background: "linear-gradient(135deg, #0B2545, #1D4E89)", color: "#fff", border: "none", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 220px" }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Le globe de la nature</div>
          <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.82)", marginTop: 4, lineHeight: 1.45 }}>Chaque pays colorié selon ses espèces de plantes, ses espèces menacées ou ses forêts. Touche un pays, puis l&apos;onglet « Nature » de sa fiche : plantes, mammifères et oiseaux avec photos.</div>
        </div>
        <button className="presse" onClick={() => ouvrirGlobe("natPlantes")} style={{ ...boutonPrincipal, background: "#fff", color: "#0B2545" }}>🌍 Ouvrir le globe</button>
      </section>
      <h3 style={titre3}>Les continents</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 14 }}>
        {CONTINENTS.map(x => {
          const r = Object.keys(etat.quiz[x.id] ?? {}).length
          return (
            <button key={x.id} className="presse" onClick={() => setChoisi(x.id)} style={{ ...carte, marginBottom: 0, textAlign: "left", cursor: "pointer", minHeight: 72 }}>
              <div style={{ fontSize: 26 }} aria-hidden="true">{x.emoji}</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: colors.text }}>{x.nom}</div>
              <div style={{ fontSize: 12, color: colors.textMuted }}>{x.biomes.length} milieux · quiz {r}/{x.quiz.length}</div>
            </button>
          )
        })}
      </div>
      <h3 style={titre3}>Les notions à connaître</h3>
      {NOTIONS.map(n => (
        <details key={n.titre} style={{ ...carte, padding: "12px 16px" }}>
          <summary style={{ fontWeight: 600, fontSize: 14.5, cursor: "pointer", minHeight: 24 }}>{n.titre}</summary>
          <p style={{ ...texte, marginTop: 8 }}>{n.texte}</p>
        </details>
      ))}
    </>
  )
}

function ListeEspeces({ titre, liste }: { titre: string; liste: Espece[] }) {
  if (!liste.length) return null
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>{titre}</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {liste.map(e => (
          <li key={e.sci} style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 4 }}>
            <a href={`https://fr.wikipedia.org/wiki/${encodeURIComponent(e.sci.replace(/ /g, "_"))}`} target="_blank" rel="noopener noreferrer" style={{ color: colors.text, fontWeight: 600 }}>{e.nom}</a>{" "}
            <i style={{ color: colors.textMuted, fontSize: 12.5 }}>{e.sci}</i> : {e.desc}
          </li>
        ))}
      </ul>
    </div>
  )
}

function FicheContinent({ c, etat, maj, retour, ouvrirGlobe }: { c: Continent; etat: EtatSciences; maj: (f: (e: EtatSciences) => EtatSciences) => void; retour: () => void; ouvrirGlobe: (mode: ModeAtlas, centre?: [number, number]) => void }) {
  const reponses = etat.quiz[c.id] ?? {}
  useEffect(() => { window.scrollTo({ top: 0 }) }, [c.id])
  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={retour} style={boutonSecondaire}>← Continents</button>
        {c.pays.length > 0 && <button className="presse" onClick={() => ouvrirGlobe("natPlantes", c.centre)} style={boutonPrincipal}>🌍 Voir sur le globe</button>}
      </div>
      <h2 style={{ fontSize: 22, margin: "0 0 8px", textWrap: "balance" }}><span aria-hidden="true">{c.emoji} </span>{c.nom}</h2>
      {c.resume.map((p, i) => <p key={i} style={texte}>{p}</p>)}
      {c.chiffres.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, margin: "12px 0" }}>
          {c.chiffres.map(x => (
            <div key={x.nom} style={{ ...carte, marginBottom: 0, padding: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{x.valeur}</div>
              <div style={{ fontSize: 12.5, color: colors.textMuted, lineHeight: 1.35 }}>{x.nom}</div>
              <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>Source : {x.source}</div>
            </div>
          ))}
        </div>
      )}
      <h3 style={titre3}>Les grands milieux</h3>
      {c.biomes.map(b => (
        <details key={b.nom} style={carte} open={c.biomes.length < 3}>
          <summary style={{ fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{b.nom}</summary>
          <p style={{ ...texte, marginTop: 8 }}>{b.desc}</p>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 10px" }}>📍 {b.ou}</p>
          <ListeEspeces titre="🌱 Plantes" liste={b.plantes} />
          <ListeEspeces titre="🐾 Animaux" liste={b.animaux} />
        </details>
      ))}
      <h3 style={titre3}>Espèces célèbres</h3>
      <div style={carte}><ListeEspeces titre="" liste={c.emblemes} /></div>
      <h3 style={titre3}>Ce qui la menace</h3>
      <ul style={{ ...carte, paddingLeft: 32 }}>{c.menaces.map(m => <li key={m} style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 6 }}>{m}</li>)}</ul>
      <h3 style={titre3}>Quiz</h3>
      {c.quiz.map((q, i) => {
        const r = reponses[i]
        return (
          <div key={i} style={carte}>
            <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 8, textWrap: "pretty" }}>{i + 1}. {q.question}</div>
            <div style={{ display: "grid", gap: 6 }}>
              {q.options.map((o, j) => {
                const montre = r != null && (j === q.bonne || j === r)
                return (
                  <button key={j} disabled={r != null} onClick={() => maj(e => ({ ...e, quiz: { ...e.quiz, [c.id]: { ...e.quiz[c.id], [i]: j } } }))}
                    style={{ textAlign: "left", minHeight: 44, padding: "8px 12px", borderRadius: 10, fontSize: 14, cursor: r == null ? "pointer" : "default", color: colors.text,
                      border: `1.5px solid ${montre ? (j === q.bonne ? "#2E8B57" : "#D9485F") : colors.border}`, background: montre ? (j === q.bonne ? "#E8F6EE" : "#FDECEE") : "#fff" }}>
                    {montre && (j === q.bonne ? "✓ " : "✗ ")}{o}
                  </button>
                )
              })}
            </div>
            {r != null && <p style={{ ...texte, fontSize: 13.5, marginTop: 10, marginBottom: 0, color: colors.textMuted }}>{r === q.bonne ? "Bravo ! " : ""}{q.explication}</p>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Projet Graine ───
function Graine({ etat, maj }: { etat: EtatSciences; maj: (f: (e: EtatSciences) => EtatSciences) => void }) {
  const [ouvert, setOuvert] = useState<string | null>(null)
  const index = CHAPITRES.findIndex(c => c.id === ouvert)
  if (index >= 0) {
    const suivant = CHAPITRES[index + 1]
    return <VueChapitre c={CHAPITRES[index]} etat={etat} maj={maj} retour={() => setOuvert(null)} suivant={suivant && fini(etat, CHAPITRES[index]) ? () => setOuvert(suivant.id) : undefined} />
  }
  // Un chapitre s'ouvre quand le précédent est fini
  const ouvrable = (i: number) => i === 0 || fini(etat, CHAPITRES[i - 1])
  return (
    <>
      <section data-sans-inversion style={{ ...carte, background: "linear-gradient(160deg, #10241B, #2C4A2E 60%, #6B5B2A)", color: "#fff", border: "none" }}>
        <div style={{ fontSize: 19, fontWeight: 700 }}>{HISTOIRE.titre}</div>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(255,255,255,.88)", margin: "6px 0 0", textWrap: "pretty" }}>{HISTOIRE.accroche}</p>
      </section>
      <details style={carte}>
        <summary style={{ fontWeight: 700, fontSize: 14.5, cursor: "pointer" }}>Les personnages</summary>
        {HISTOIRE.personnages.map(p => <p key={p.nom} style={{ ...texte, marginTop: 8 }}><b>{p.nom}</b> ({p.role}) : {p.desc}</p>)}
      </details>
      <h3 style={titre3}>Les chapitres</h3>
      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {CHAPITRES.map((c, i) => {
          const ok = ouvrable(i), f = fini(etat, c)
          const reussis = c.defis.filter((_, j) => etat.graine[c.id]?.[j]).length
          return (
            <li key={c.id}>
              <button className={ok ? "presse" : undefined} disabled={!ok} onClick={() => setOuvert(c.id)}
                style={{ ...carte, width: "100%", display: "flex", gap: 12, alignItems: "center", textAlign: "left", cursor: ok ? "pointer" : "not-allowed", opacity: ok ? 1 : 0.6, color: colors.text }}>
                <span aria-hidden="true" style={{ flex: "none", width: 40, height: 40, borderRadius: 999, display: "grid", placeItems: "center", fontWeight: 700, fontVariantNumeric: "tabular-nums",
                  background: f ? "#2E8B57" : ok ? colors.blueLight : "#EEF1F5", color: f ? "#fff" : colors.text }}>{f ? "✓" : ok ? c.numero : "🔒"}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 700, fontSize: 14.5, textWrap: "balance" }}>Chapitre {c.numero} · {c.titre}</span>
                  <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4, fontSize: 12, color: colors.textMuted, alignItems: "center" }}>
                    {c.matieres.map(m => <span key={m} style={{ color: COULEUR_MATIERE[m], fontWeight: 600 }}>{m}</span>)}
                    <span>· niveau {"●".repeat(c.niveau)}{"○".repeat(4 - c.niveau)}</span>
                    <span>· défis {reussis}/{c.defis.length}</span>
                  </span>
                  {!ok && <span style={{ display: "block", fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Termine le chapitre {CHAPITRES[i - 1].numero} pour l&apos;ouvrir</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </>
  )
}

function VueChapitre({ c, etat, maj, retour, suivant }: { c: Chapitre; etat: EtatSciences; maj: (f: (e: EtatSciences) => EtatSciences) => void; retour: () => void; suivant?: () => void }) {
  useEffect(() => { window.scrollTo({ top: 0 }) }, [c.id])
  const noter = (i: number, r: "ok" | "vu") => maj(e => ({ ...e, graine: { ...e.graine, [c.id]: { ...e.graine[c.id], [i]: e.graine[c.id]?.[i] === "ok" ? "ok" : r } } }))
  const termine = fini(etat, c)
  return (
    <article>
      <button onClick={retour} style={{ ...boutonSecondaire, marginBottom: 12 }}>← Chapitres</button>
      <div style={{ fontSize: 12.5, color: colors.textMuted, fontWeight: 600 }}>Chapitre {c.numero} · {c.matieres.join(", ")}</div>
      <h2 style={{ fontSize: 22, margin: "2px 0 12px", textWrap: "balance" }}>{c.titre}</h2>
      <div style={{ ...carte, background: "#FBF8F1", borderColor: "#EADFC8" }}>
        {c.recit.map((p, i) => <p key={i} style={{ ...texte, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 15.5, lineHeight: 1.65 }}>{p}</p>)}
      </div>
      {c.science.map(x => (
        <section key={x.titre} style={{ ...carte, borderLeft: `4px solid ${COULEUR_MATIERE[c.matieres[0]] ?? colors.blue}` }}>
          <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 6 }}>🔬 {x.titre}</div>
          {x.texte.map((p, i) => <p key={i} style={texte}>{p}</p>)}
          {x.formule && <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 15, background: "#F3F5F9", borderRadius: 8, padding: "10px 12px", overflowX: "auto" }}>{x.formule}</div>}
        </section>
      ))}
      {c.experience && <div style={{ ...carte, background: "#EEF6FF", borderColor: "#CFE2FA" }}><b>🧫 À essayer chez toi</b><p style={{ ...texte, marginTop: 6, marginBottom: 0 }}>{c.experience}</p></div>}
      {c.securite && <div role="note" style={{ ...carte, background: "#FFF4E5", borderColor: "#F5D3A3" }}><b>⚠️ Sécurité</b><p style={{ ...texte, marginTop: 6, marginBottom: 0 }}>{c.securite}</p></div>}
      <h3 style={titre3}>Les défis {termine ? "✓" : `(réussis-les pour débloquer la suite)`}</h3>
      {c.defis.map((d, i) => <CarteDefi key={`${c.id}-${i}`} d={d} n={i + 1} statut={etat.graine[c.id]?.[i]} noter={r => noter(i, r)} />)}
      {termine && (
        <>
          <div style={{ ...carte, background: "#F4F1FB", borderColor: "#DCD3F0" }}><b>📜 Et dans la vraie histoire ?</b><p style={{ ...texte, marginTop: 6, marginBottom: 0 }}>{c.enVrai}</p></div>
          <p style={{ ...texte, fontStyle: "italic", fontFamily: "Georgia, serif" }}>{c.suite}</p>
          {suivant ? <button className="presse" onClick={suivant} style={boutonPrincipal}>Chapitre suivant →</button>
            : <p style={{ ...texte, fontWeight: 600 }}>🎉 Tu as reconstruit la civilisation, bravo !</p>}
        </>
      )}
    </article>
  )
}

function CarteDefi({ d, n, statut, noter }: { d: Defi; n: number; statut?: "ok" | "vu"; noter: (r: "ok" | "vu") => void }) {
  const [saisie, setSaisie] = useState("")
  const [choix, setChoix] = useState<number | null>(null)
  const [essais, setEssais] = useState(0)
  const [indice, setIndice] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const resolu = statut != null

  function verifier() {
    if (d.type === "nombre") {
      const x = lireNombre(saisie)
      if (x == null) { setMessage("Écris un nombre (par exemple 12,5)."); return }
      if (reponseJuste(x, d.reponse, d.tolerance)) { setMessage(null); noter("ok"); return }
    } else {
      if (choix == null) { setMessage("Choisis une réponse."); return }
      if (choix === d.bonne) { setMessage(null); noter("ok"); return }
    }
    setEssais(e => e + 1)
    setMessage(essais >= 1 ? "Pas encore. Tu peux lire l'indice ou voir la solution." : "Pas tout à fait, réessaie !")
  }

  return (
    <div style={{ ...carte, borderColor: statut === "ok" ? "#9FD5B5" : colors.border }}>
      <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 10, textWrap: "pretty" }}>Défi {n}. {d.question}</div>
      {d.type === "choix" ? (
        <div style={{ display: "grid", gap: 6, marginBottom: 10 }}>
          {d.options.map((o, j) => {
            const bon = resolu && j === d.bonne
            return (
              <button key={j} disabled={resolu} onClick={() => { setChoix(j); setMessage(null) }} aria-pressed={choix === j}
                style={{ textAlign: "left", minHeight: 44, padding: "8px 12px", borderRadius: 10, fontSize: 14, cursor: resolu ? "default" : "pointer", color: colors.text,
                  border: `1.5px solid ${bon ? "#2E8B57" : choix === j && !resolu ? colors.blue : colors.border}`, background: bon ? "#E8F6EE" : choix === j && !resolu ? colors.blueLight : "#fff" }}>
                {bon && "✓ "}{o}
              </button>
            )
          })}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
          {resolu ? <b style={{ fontVariantNumeric: "tabular-nums" }}>Réponse : {d.reponse.toLocaleString("fr-CH", { maximumFractionDigits: 4 })}{d.unite ? ` ${d.unite}` : ""}</b> : (
            <>
              <input inputMode="decimal" value={saisie} onChange={e => { setSaisie(e.target.value); setMessage(null) }} onKeyDown={e => { if (e.key === "Enter") verifier() }}
                aria-label={`Ta réponse${d.unite ? ` en ${d.unite}` : ""}`} placeholder="Ta réponse"
                style={{ minHeight: 44, width: 150, padding: "0 12px", borderRadius: 10, border: `1px solid ${colors.border}`, fontSize: 16, fontVariantNumeric: "tabular-nums" }} />
              {d.unite && <span style={{ fontSize: 14, color: colors.textMuted }}>{d.unite}</span>}
            </>
          )}
        </div>
      )}
      {!resolu && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="presse" onClick={verifier} style={boutonPrincipal}>Vérifier</button>
          {!indice && <button onClick={() => setIndice(true)} style={boutonSecondaire}>💡 Indice</button>}
          {essais >= 2 && <button onClick={() => noter("vu")} style={boutonSecondaire}>Voir la solution</button>}
        </div>
      )}
      {message && <p role="status" style={{ fontSize: 13.5, color: "#B42318", margin: "8px 0 0" }}>{message}</p>}
      {indice && !resolu && <p style={{ ...texte, fontSize: 13.5, margin: "10px 0 0", color: colors.textMuted }}>💡 {d.indice}</p>}
      {resolu && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: statut === "ok" ? "#2E8B57" : colors.textMuted, marginBottom: 4 }}>{statut === "ok" ? "✓ Réussi !" : "Solution"}</div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>{d.solution.map((l, i) => <li key={i} style={{ fontSize: 13.5, lineHeight: 1.55 }}>{l}</li>)}</ol>
        </div>
      )}
    </div>
  )
}
