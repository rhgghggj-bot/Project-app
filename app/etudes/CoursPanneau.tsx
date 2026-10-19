"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { colors, radius } from "@/app/components/ui/tokens"
import { typeConvertible, type Bloc } from "@/lib/conversion"
import type { DocumentEtudes } from "./DocumentsSection"

// Cours affiché à côté de la note (écran partagé) : un document importé dans
// « Documents » (PDF, PowerPoint, Word, Excel, image, texte), lu dans le
// navigateur. Un PDF est dessiné page par page (sur iPhone, un PDF dans un
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

export default function CoursPanneau({ userId, noteId, onFermer, compact }: { userId: string; noteId: string; onFermer: () => void; compact: boolean }) {
  const [docs, setDocs] = useState<DocumentEtudes[] | null>(null)
  const [docId, setDocId] = useState<string | null>(() => coursDeLaNote(noteId)?.doc ?? null)
  const [contenu, setContenu] = useState<Contenu | null>(null)
  const [etape, setEtape] = useState("")
  const [erreur, setErreur] = useState<string | null>(null)
  const zone = useRef<HTMLDivElement>(null)
  const minuterie = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    let actif = true
    supabase.from("etudes_documents").select("id,dossier_id,nom,chemin,type,taille,created_at").eq("user_id", userId).order("created_at", { ascending: false })
      .then(({ data }) => { if (actif) setDocs(((data || []) as DocumentEtudes[]).filter(d => typeConvertible(d.nom, d.type))) })
    return () => { actif = false }
  }, [userId])

  const doc = docs?.find(d => d.id === docId) ?? null
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
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: colors.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc ? doc.nom.replace(/\.[^.]+$/, "") : "Choisis un cours"}</span>
          {doc && <button style={bouton} onClick={() => choisir(null)}>Changer</button>}
          <button style={bouton} onClick={onFermer} aria-label="Fermer le cours">✕</button>
        </div>
      )}
      <div ref={zone} onScroll={surDefilement} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: compact ? "4px 8px" : 10, touchAction: "pan-x pan-y pinch-zoom" }}>
        {!docId ? (
          docs === null ? <div className="nx-skel" style={{ height: 120, borderRadius: radius.sm }} />
            : docs.length === 0 ? <p style={{ fontSize: 13, color: colors.textMuted, margin: 8 }}>Importe d&apos;abord ton cours dans Carnet → Documents (PDF, PowerPoint, Word…), puis reviens ici.</p>
              : docs.map(d => (
                <button key={d.id} onClick={() => choisir(d.id)} style={{ display: "block", width: "100%", textAlign: "left", background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.sm, padding: "10px 12px", marginBottom: 6, fontSize: 14, color: colors.text, cursor: "pointer" }}>
                  {d.nom}
                </button>
              ))
        ) : erreur ? (
          <p role="alert" style={{ fontSize: 13, color: colors.text, margin: 8 }}>{erreur}. <button style={bouton} onClick={() => choisir(null)}>Choisir un autre cours</button></p>
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
    </section>
  )
}
