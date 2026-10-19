"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { colors, radius } from "@/app/components/ui/tokens"
import { typeConvertible, type Bloc } from "@/lib/conversion"
import type { DocumentEtudes } from "./DocumentsSection"
import type { Fiches, NotionFiche } from "@/lib/etudes"
import FicheNotion from "./FicheNotion"
import { CadreArtefact, listerArtefacts, sourceArtefact } from "./ArtefactsSection"

// Trois sortes de cours : un document importé (clé = son id), un cours de
// « Réviser » avec ses fiches et son cas pratique (« cours:<id> »), ou une
// page d'artefact interactive (« page:<chemin> »).
type CoursRevision = { id: string; matiere: string; titre: string; fiches: Fiches }

// Cours affiché à côté de la note (écran partagé) : un document importé dans
// « Documents » (PDF, PowerPoint, Word, Excel, image, texte), un cours de
// « Réviser » ou une page d'artefact (cas pratique), lus dans le navigateur. Un PDF est dessiné page par page (sur iPhone, un PDF dans un
// cadre n'affiche que la première page). La note retient son cours et
// l'endroit où on en était.

type Contenu = { blocs: Bloc[]; urls: Map<Blob, string>; pdf: boolean }
const cacheContenus = new Map<string, Promise<Contenu>>()

function charger(doc: DocumentEtudes, avancer: (e: string) => void): Promise<Contenu> {
  if (!cacheContenus.has(doc.id)) {
    cacheContenus.set(doc.id, (async () => {
      const type = typeConvertible(doc.nom, doc.type)
      if (!type) throw new Error("Ce type de fichier ne peut pas s'afficher ici")
      const { data, error } = await supabase.storage.from("etudes").download(doc.chemin)
      if (!data) throw new Error(error?.message || "Cours introuvable")
      const { convertir } = await import("@/lib/conversion")
      const blocs = await convertir(data, type, avancer)
      const urls = new Map<Blob, string>()
      for (const b of blocs) if (b.type === "img") urls.set(b.image, URL.createObjectURL(b.image))
      return { blocs, urls, pdf: type === "pdf" }
    })().catch(e => { cacheContenus.delete(doc.id); throw e }))
  }
  return cacheContenus.get(doc.id)!
}

const cleNote = (noteId: string) => `cours-note:${noteId}`
export function coursDeLaNote(noteId: string): { doc: string; haut: number } | null {
  try { return JSON.parse(localStorage.getItem(cleNote(noteId)) || "null") } catch { return null }
}
export function oublierCours(noteId: string) { retenir(noteId, null) }
function retenir(noteId: string, v: { doc: string; haut: number } | null) {
  try { if (v) localStorage.setItem(cleNote(noteId), JSON.stringify(v)); else localStorage.removeItem(cleNote(noteId)) } catch { /* stockage indisponible */ }
}

export default function CoursPanneau({ userId, noteId, onFermer, onEnvoyer, compact }: { userId: string; noteId: string; onFermer: () => void; onEnvoyer: (texte: string, source: string) => void; compact: boolean }) {
  const [docs, setDocs] = useState<DocumentEtudes[] | null>(null)
  const [coursListe, setCoursListe] = useState<CoursRevision[] | null>(null)
  const [pages, setPages] = useState<{ titre: string; chemin: string }[] | null>(null)
  const [docId, setDocId] = useState<string | null>(() => coursDeLaNote(noteId)?.doc ?? null)
  const [contenu, setContenu] = useState<Contenu | null>(null)
  const [etape, setEtape] = useState("")
  const [erreur, setErreur] = useState<string | null>(null)
  const zone = useRef<HTMLDivElement>(null)
  const minuterie = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Passage sélectionné dans le cours, prêt à être envoyé dans la note
  const [passage, setPassage] = useState("")

  useEffect(() => {
    function suivre() {
      const sel = document.getSelection()
      const z = zone.current
      if (!sel || sel.isCollapsed || !z || !z.contains(sel.anchorNode) || !z.contains(sel.focusNode)) { setPassage(""); return }
      setPassage(sel.toString().trim().slice(0, 5000))
    }
    document.addEventListener("selectionchange", suivre)
    return () => document.removeEventListener("selectionchange", suivre)
  }, [])

  useEffect(() => {
    let actif = true
    supabase.from("etudes_documents").select("id,dossier_id,nom,chemin,type,taille,created_at").eq("user_id", userId).order("created_at", { ascending: false })
      .then(({ data }) => { if (actif) setDocs(((data || []) as DocumentEtudes[]).filter(d => typeConvertible(d.nom, d.type))) })
    supabase.from("cours_etudiant").select("id,matiere,titre,fiches").eq("user_id", userId).order("created_at", { ascending: false })
      .then(({ data }) => { if (actif) setCoursListe((data || []) as CoursRevision[]) })
    listerArtefacts(userId).then(p => { if (actif) setPages(p) }).catch(() => { if (actif) setPages([]) })
    return () => { actif = false }
  }, [userId])

  const coursRevision = docId?.startsWith("cours:") ? coursListe?.find(c => c.id === docId.slice(6)) ?? null : null
  const page = docId?.startsWith("page:") ? pages?.find(p => p.chemin === docId.slice(5)) ?? null : null
  const doc = docs?.find(d => d.id === docId) ?? null
  const nom = doc ? doc.nom.replace(/\.[^.]+$/, "") : coursRevision ? coursRevision.titre || coursRevision.matiere : page?.titre ?? null
  useEffect(() => {
    if (!doc) return
    let actif = true
    charger(doc, e => { if (actif) setEtape(e) })
      .then(c => {
        if (!actif) return
        setContenu(c); setErreur(null)
        // On revient à l'endroit où on en était dans ce cours
        const haut = coursDeLaNote(noteId)?.doc === doc.id ? coursDeLaNote(noteId)!.haut : 0
        requestAnimationFrame(() => { if (zone.current) zone.current.scrollTop = haut })
      })
      .catch(e => { if (actif) setErreur(e instanceof Error ? e.message : "Cours illisible") })
    return () => { actif = false }
  }, [doc, noteId])

  // Cours de Réviser : on revient aussi à l'endroit où on en était
  useEffect(() => {
    if (!coursRevision) return
    const haut = coursDeLaNote(noteId)?.doc === docId ? coursDeLaNote(noteId)!.haut : 0
    requestAnimationFrame(() => { if (zone.current) zone.current.scrollTop = haut })
  }, [coursRevision, docId, noteId])

  function choisir(id: string | null) {
    setContenu(null); setErreur(null); setEtape("")
    setDocId(id)
    retenir(noteId, id ? { doc: id, haut: 0 } : null)
  }

  function surDefilement() {
    clearTimeout(minuterie.current)
    const haut = zone.current?.scrollTop ?? 0
    minuterie.current = setTimeout(() => { if (docId) retenir(noteId, { doc: docId, haut }) }, 300)
  }

  const bouton: React.CSSProperties = { border: `1px solid ${colors.blueBorder}`, background: "#fff", borderRadius: radius.pill, padding: "0 12px", minHeight: 34, fontSize: 12.5, cursor: "pointer", color: colors.text, flexShrink: 0 }

  return (
    <section aria-label="Cours" style={{ display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0, height: "100%", background: "#F4F6FA" }}>
      {!compact && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderBottom: `1px solid ${colors.border}`, background: "#fff" }}>
          <span aria-hidden="true">📖</span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: colors.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nom ?? "Choisis un cours"}</span>
          {docId && <button style={bouton} onClick={() => choisir(null)}>Changer</button>}
          <button style={bouton} onClick={onFermer} aria-label="Fermer le cours">✕</button>
        </div>
      )}
      {page ? (
        // Page interactive (cas pratique) : elle gère elle-même son défilement
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <CadreArtefact key={page.chemin} source={sourceArtefact(page)} onErreur={() => choisir(null)} />
        </div>
      ) : (
      <div ref={zone} onScroll={surDefilement} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: compact ? "4px 8px" : 10, touchAction: "pan-x pan-y pinch-zoom" }}>
        {!docId ? (
          docs === null || coursListe === null || pages === null ? <div className="nx-skel" style={{ height: 120, borderRadius: radius.sm }} />
            : !docs.length && !coursListe.length && !pages.length ? <p style={{ fontSize: 13, color: colors.textMuted, margin: 8 }}>Aucun cours pour l&apos;instant. Importe ton cours dans Carnet → Documents, dans Réviser ou dans Artefacts, puis reviens ici.</p>
              : (
                <>
                  <Groupe titre="Mes cours (Réviser)" elements={coursListe.map(c => ({ cle: "cours:" + c.id, nom: c.titre || c.matiere, detail: `${c.matiere} · ${c.fiches.notions.length} fiche${c.fiches.notions.length > 1 ? "s" : ""}` }))} onChoisir={choisir} />
                  <Groupe titre="Cas pratiques et pages (Artefacts)" elements={pages.map(p => ({ cle: "page:" + p.chemin, nom: p.titre }))} onChoisir={choisir} />
                  <Groupe titre="Documents importés (Carnet)" elements={docs.map(d => ({ cle: d.id, nom: d.nom }))} onChoisir={choisir} />
                </>
              )
        ) : docId.startsWith("cours:") ? (
          !coursRevision ? <div className="nx-skel" style={{ height: 120, borderRadius: radius.sm }} />
            : (coursRevision.fiches.notions as NotionFiche[]).map((n, i) => (
              <div key={i} style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: 12, marginBottom: 10 }}>
                <FicheNotion fiche={{ ...n, exemple: n.exemple_entreprise }} libelleExemple="Dans ton entreprise (cas pratique)" cleQuiz={`${coursRevision.id}-${i}`} />
              </div>
            ))
        ) : docId.startsWith("page:") ? null : erreur ? (
          <p role="alert" style={{ fontSize: 13, color: colors.text, margin: 8 }}>{erreur}. <button style={bouton} onClick={() => choisir(null)}>Choisir un autre cours</button></p>
        ) : docs !== null && !doc ? (
          <p style={{ fontSize: 13, color: colors.text, margin: 8 }}>Ce cours n&apos;existe plus. <button style={bouton} onClick={() => choisir(null)}>Choisir un autre cours</button></p>
        ) : !contenu ? (
          <div role="status" style={{ fontSize: 13, color: colors.textMuted, padding: 8 }}>Ouverture du cours… {etape}</div>
        ) : (
          contenu.blocs.map((b, i) => {
            if (b.type === "img") return (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={contenu.urls.get(b.image)} alt={b.alt} style={{ display: "block", width: "100%", borderRadius: 6, background: "#fff", boxShadow: "0 1px 4px rgba(10,22,40,.12)", margin: "0 0 10px" }} />
            )
            if (contenu.pdf) return null   // le texte d'une page PDF est déjà sur son image
            if (b.type === "table") return (
              <table key={i} style={{ borderCollapse: "collapse", fontSize: 12.5, margin: "0 0 10px", background: "#fff" }}>
                <tbody>{b.lignes.map((l, k) => <tr key={k}>{l.map((c, j) => <td key={j} style={{ border: `1px solid ${colors.border}`, padding: "3px 6px" }}>{c}</td>)}</tr>)}</tbody>
              </table>
            )
            const texte = b.morceaux.map((m, k) => (m.br ? <br key={k} /> : <span key={k} style={{ fontWeight: m.b ? 700 : undefined, fontStyle: m.i ? "italic" : undefined }}>{m.t}</span>))
            if (b.type === "h2") return <h3 key={i} style={{ fontSize: 15, color: colors.navy, margin: "14px 0 6px" }}>{texte}</h3>
            if (b.type === "h3") return <h4 key={i} style={{ fontSize: 14, color: colors.navy, margin: "10px 0 4px" }}>{texte}</h4>
            return <p key={i} style={{ fontSize: 14, lineHeight: 1.5, color: colors.text, margin: "0 0 8px", paddingLeft: b.type === "li" ? 14 : 0 }}>{b.type === "li" ? "• " : ""}{texte}</p>
          })
        )}
      </div>
      )}
      {passage && (
        <div style={{ padding: "6px 8px", borderTop: `1px solid ${colors.border}`, background: "#fff", display: "flex", justifyContent: "center" }}>
          {/* onPointerDown : le bouton ne doit pas effacer la sélection avant le clic */}
          <button onPointerDown={e => e.preventDefault()} onMouseDown={e => e.preventDefault()}
            onClick={() => { onEnvoyer(passage, nom ?? "Cours"); document.getSelection()?.removeAllRanges(); setPassage("") }}
            style={{ ...bouton, background: colors.blue, borderColor: colors.blue, color: "#fff", fontWeight: 600, minHeight: 40, padding: "0 16px" }}>
            ➜ Envoyer vers la note
          </button>
        </div>
      )}
    </section>
  )
}

function Groupe({ titre, elements, onChoisir }: { titre: string; elements: { cle: string; nom: string; detail?: string }[]; onChoisir: (cle: string) => void }) {
  if (!elements.length) return null
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: ".06em", margin: "4px 2px 6px" }}>{titre}</div>
      {elements.map(e => (
        <button key={e.cle} onClick={() => onChoisir(e.cle)} style={{ display: "block", width: "100%", textAlign: "left", background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: "10px 12px", marginBottom: 6, fontSize: 14, color: colors.text, cursor: "pointer" }}>
          {e.nom}
          {e.detail && <span style={{ display: "block", fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{e.detail}</span>}
        </button>
      ))}
    </div>
  )
}
