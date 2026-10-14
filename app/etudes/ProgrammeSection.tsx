"use client"
import type { ActionCarnet } from "./CarnetSection"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useChargement } from "@/lib/useChargement"
import { colors, radius } from "@/app/components/ui/tokens"
import { formaterNote, systemeDeEchelle, type Echelle, type Pays } from "@/lib/etudes"
import { trouverNiveau } from "@/lib/cursus"
import { chapitreVisible, chapitresPour, chargerProgramme, type Chapitre, type Programme } from "@/lib/programmes"
import { carte } from "./Depot"
import FicheNotion from "./FicheNotion"

// « Mon programme » : les chapitres de l'année de l'élève, matière par
// matière, sans avoir besoin d'importer de fichier. Un chapitre ouvert affiche
// son document de révision et les notes que l'élève y a liées.

// Recherche insensible aux accents et aux majuscules
function normaliser(t: string) {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

function texteChapitre(c: Chapitre) {
  return normaliser([c.titre, c.matiere, ...c.notions, c.doc?.resume ?? "", ...(c.doc?.points ?? []), ...(c.doc?.vocabulaire.map(v => v.mot) ?? [])].join(" "))
}

type NoteLiee = { id: string; note: number; echelle: Echelle; titre: string | null; date: string }

export default function ProgrammeSection({ userId, pays, niveauId, filiere, specialites, annee, onChangerAnnee, chapitreOuvert, onOuvrirChapitre, onCarnet }: {
  onCarnet: (a: ActionCarnet) => void
  userId: string
  pays: Pays
  niveauId: string | null
  filiere: string | null
  specialites: string[]
  annee: string | null
  onChangerAnnee: (annee: string) => void
  chapitreOuvert: string | null
  onOuvrirChapitre: (id: string | null) => void
}) {
  const niveau = trouverNiveau(pays, niveauId)
  const [programme, setProgramme] = useState<Programme | null | undefined>(undefined)
  const [matiereOuverte, setMatiereOuverte] = useState<string | null>(null)
  const [recherche, setRecherche] = useState("")

  useChargement(async () => {
    if (!niveauId) { setProgramme(null); return }
    setProgramme(undefined)
    setProgramme(await chargerProgramme(pays, niveauId))
  }, `${pays}-${niveauId}`)

  if (!niveau) {
    return <div style={carte}><div style={{ fontSize: "12px", color: colors.textMuted }}>Choisis ton niveau d&apos;études dans Réglages pour voir ton programme.</div></div>
  }
  if (programme === undefined) return <div className="nx-skel" style={{ height: 90, borderRadius: radius.md, marginBottom: "12px" }} />
  if (programme === null) {
    return <div style={carte}><div style={{ fontSize: "12px", color: colors.textMuted }}>Le programme de ce niveau n&apos;est pas encore disponible.</div></div>
  }

  const anneeChoisie = annee && niveau.annees.includes(annee) ? annee : niveau.annees[0]
  const chapitre = chapitreOuvert ? programme.chapitres.find(c => c.id === chapitreOuvert) : undefined
  if (chapitre) return <VueChapitre chapitre={chapitre} userId={userId} onRetour={() => onOuvrirChapitre(null)} onCarnet={onCarnet} />

  const chapitres = chapitresPour(programme, anneeChoisie, filiere, specialites)
  const matieres = [...new Set(chapitres.map(c => c.matiere))]
  const filiereLabel = niveau.filieres?.find(f => f.id === filiere)?.label

  // Recherche dans tout le programme (toutes années) : chaque mot tapé doit
  // apparaître ; les chapitres dont le titre correspond passent en premier.
  const mots = normaliser(recherche).split(/\s+/).filter(Boolean)
  const resultats = mots.length === 0 ? [] : programme.chapitres
    .filter(c => chapitreVisible(c, filiere, specialites))
    .map(c => ({ c, texte: texteChapitre(c), titre: normaliser(c.titre + " " + c.matiere) }))
    .filter(r => mots.every(m => r.texte.includes(m)))
    .sort((a, b) => Number(mots.every(m => b.titre.includes(m))) - Number(mots.every(m => a.titre.includes(m))))
    .slice(0, 30)
    .map(r => r.c)

  return (
    <div style={carte}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: colors.text }}>Mon programme</div>
        <div style={{ fontSize: "11px", color: colors.textFaint, textAlign: "right" }}>{filiereLabel || niveau.label}</div>
      </div>
      <input type="search" value={recherche} onChange={e => setRecherche(e.target.value)} aria-label="Rechercher un chapitre"
        placeholder="Rechercher un chapitre, une notion…"
        style={{ width: "100%", border: `0.5px solid ${colors.blueBorder}`, borderRadius: radius.pill, padding: "8px 14px", fontSize: "13px", color: colors.text, background: "#F8FBFF", marginBottom: "10px" }} />
      {mots.length > 0 ? (
        <div>
          <div style={{ fontSize: "11px", color: colors.textFaint, marginBottom: "6px" }}>
            {resultats.length === 0 ? "Aucun chapitre trouvé." : `${resultats.length}${resultats.length === 30 ? "+" : ""} résultat${resultats.length > 1 ? "s" : ""}`}
          </div>
          {resultats.map(c => (
            <button key={c.id} onClick={() => onOuvrirChapitre(c.id)}
              style={{ width: "100%", display: "block", background: colors.blueLight, border: "none", borderRadius: radius.sm, padding: "8px 10px", marginBottom: "4px", cursor: "pointer", textAlign: "left" }}>
              <div style={{ fontSize: "12px", color: colors.text, fontWeight: 500 }}>{c.titre}{!c.doc && <span style={{ fontSize: "10px", color: colors.textFaint, fontWeight: 400 }}> · bientôt</span>}</div>
              <div style={{ fontSize: "11px", color: colors.textMuted }}>{c.matiere} · {c.annee}</div>
            </button>
          ))}
        </div>
      ) : (<>
      {niveau.annees.length > 1 && (
        <div role="tablist" aria-label="Année" style={{ display: "flex", gap: "4px", overflowX: "auto", marginBottom: "10px" }}>
          {niveau.annees.map(a => (
            <button key={a} role="tab" aria-selected={a === anneeChoisie} onClick={() => onChangerAnnee(a)}
              style={{ whiteSpace: "nowrap", padding: "5px 11px", borderRadius: radius.pill, border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500,
                background: a === anneeChoisie ? colors.blue : colors.blueLight, color: a === anneeChoisie ? "#fff" : colors.blue }}>
              {a}
            </button>
          ))}
        </div>
      )}
      {matieres.length === 0 && (
        <div style={{ fontSize: "12px", color: colors.textMuted }}>
          {niveau.filieres && !filiere ? "Choisis ta filière dans Réglages pour voir tes chapitres." : niveau.specialites && specialites.length === 0 ? "Choisis tes spécialités dans Réglages pour voir leurs chapitres." : "Pas encore de chapitres pour cette année."}
        </div>
      )}
      {matieres.map(m => {
        const liste = chapitres.filter(c => c.matiere === m)
        const ouverte = matiereOuverte === m
        const prets = liste.filter(c => c.doc).length
        return (
          <div key={m} style={{ borderTop: `0.5px solid ${colors.border}` }}>
            <button onClick={() => setMatiereOuverte(ouverte ? null : m)} aria-expanded={ouverte}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: "10px 0", cursor: "pointer", textAlign: "left" }}>
              <span style={{ flex: 1, fontSize: "13px", fontWeight: 500, color: colors.text }}>{m}</span>
              <span style={{ fontSize: "11px", color: colors.textFaint }}>{liste.length} chap.{prets < liste.length ? ` · ${prets} prêts` : ""}</span>
              <span aria-hidden="true" style={{ color: colors.textFaint, fontSize: "11px" }}>{ouverte ? "▴" : "▾"}</span>
            </button>
            {ouverte && (
              <div style={{ paddingBottom: "8px" }}>
                {liste.map((c, i) => (
                  <button key={c.id} onClick={() => onOuvrirChapitre(c.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", background: colors.blueLight, border: "none", borderRadius: radius.sm, padding: "8px 10px", marginBottom: "4px", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: "11px", color: colors.blue, fontWeight: 600, width: "18px" }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: "12px", color: colors.text }}>{c.titre}</span>
                    {!c.doc && <span style={{ fontSize: "10px", color: colors.textFaint }}>bientôt</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
      </>)}
      <p style={{ fontSize: "10px", color: colors.textFaint, margin: "8px 0 0", lineHeight: 1.4 }}>
        Programme indicatif basé sur les plans d&apos;études officiels : l&apos;ordre des chapitres peut varier selon ton école.
      </p>
    </div>
  )
}

function VueChapitre({ chapitre, userId, onRetour, onCarnet }: { chapitre: Chapitre; userId: string; onRetour: () => void; onCarnet: (a: ActionCarnet) => void }) {
  const [notes, setNotes] = useState<NoteLiee[]>([])
  const [pages, setPages] = useState<{ id: string; titre: string }[]>([])

  useEffect(() => {
    let actif = true
    supabase.from("carnet_notes").select("id,titre").eq("user_id", userId).eq("chapitre_id", chapitre.id).order("updated_at", { ascending: false })
      .then(({ data }) => { if (actif) setPages(data || []) })
    return () => { actif = false }
  }, [chapitre.id, userId])

  useEffect(() => {
    let actif = true
    supabase.from("notes_etudiant").select("id,note,echelle,titre,date").eq("user_id", userId).eq("chapitre_id", chapitre.id).order("date")
      .then(({ data }) => { if (actif) setNotes((data || []).map(n => ({ ...n, note: Number(n.note) })) as NoteLiee[]) })
    return () => { actif = false }
  }, [chapitre.id, userId])

  return (
    <div style={carte}>
      <button onClick={onRetour} style={{ background: "none", border: "none", color: colors.blue, fontSize: "12px", cursor: "pointer", padding: 0, marginBottom: "8px" }}>← Mon programme</button>
      <div style={{ fontSize: "11px", color: colors.textFaint, marginBottom: "4px" }}>{chapitre.matiere} · {chapitre.annee}</div>

      {notes.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
          {notes.map(n => {
            const ok = n.note >= systemeDeEchelle(n.echelle).suffisant
            return (
              <span key={n.id} style={{ fontSize: "11px", padding: "4px 9px", borderRadius: radius.pill, background: ok ? colors.greenLight : colors.redLight, color: colors.text }}>
                Ta note : <b style={{ color: ok ? "#006300" : "#b42323" }}>{formaterNote(n.note, n.echelle)}</b>
                {" · "}{new Date(n.date + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </span>
            )
          })}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", marginBottom: "10px" }}>
        {pages.map(p => (
          <button key={p.id} onClick={() => onCarnet({ type: "ouvrir", noteId: p.id })}
            style={{ fontSize: "12px", border: `1px solid ${colors.blueBorder}`, background: "#fff", color: colors.navy, borderRadius: radius.pill, padding: "5px 11px", cursor: "pointer", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Ma note : {p.titre || "Sans titre"}
          </button>
        ))}
        <button onClick={() => onCarnet({ type: "nouvelle", chapitreId: chapitre.id })}
          style={{ fontSize: "12px", border: `1px dashed ${colors.blue}`, background: "none", color: colors.blue, borderRadius: radius.pill, padding: "5px 11px", cursor: "pointer" }}>
          Prendre une note sur ce chapitre
        </button>
      </div>

      {chapitre.doc ? (
        <FicheNotion fiche={{ titre: chapitre.titre, ...chapitre.doc }} libelleExemple="Exemple concret" cleQuiz={chapitre.id} />
      ) : (
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: colors.text, marginBottom: "6px" }}>{chapitre.titre}</div>
          <div style={{ fontSize: "12px", color: colors.textMuted, marginBottom: "6px" }}>Ce que tu dois savoir :</div>
          <ul style={{ margin: "0 0 10px", paddingLeft: "18px", listStyle: "disc" }}>
            {chapitre.notions.map((n, i) => <li key={i} style={{ fontSize: "13px", color: colors.text, lineHeight: 1.5 }}>{n}</li>)}
          </ul>
          <div style={{ fontSize: "11px", color: colors.textFaint }}>Le document de révision de ce chapitre est en préparation.</div>
        </div>
      )}
    </div>
  )
}
