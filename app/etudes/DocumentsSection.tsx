"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast, confirmer } from "@/lib/toast"
import { useChargement } from "@/lib/useChargement"
import { colors, radius } from "@/app/components/ui/tokens"
import { COLONNES_NOTE, compresserImage, dateCourte, nettoyerHtml, normaliser, texteBrut, type Dossier, type NoteCarnet } from "@/lib/carnet"
import { convertir, typeConvertible, versHtml, type TypeConvertible } from "@/lib/conversion"
import { BLEU_TEXTE, ROUGE_TEXTE, TEXTE_DOUX } from "./cahier"

// « Mes documents » : n'importe quel fichier (PDF, PowerPoint, Word, images,
// vidéos, audio…) rangé dans l'espace privé de l'élève. Les formats que le
// navigateur sait afficher s'ouvrent dans l'appli ; PowerPoint, Word, PDF et
// images peuvent aussi être transformés en note du carnet.

export type DocumentEtudes = { id: string; dossier_id: string | null; nom: string; chemin: string; type: string; taille: number; created_at: string }

const TAILLE_MAX = 50 * 1024 * 1024

type Genre = "pdf" | "image" | "video" | "audio" | "texte" | "office" | "autre"
function genre(d: { nom: string; type: string }): Genre {
  const ext = d.nom.toLowerCase().split(".").pop() || ""
  if (d.type === "application/pdf" || ext === "pdf") return "pdf"
  if (d.type.startsWith("image/")) return "image"
  if (d.type.startsWith("video/")) return "video"
  if (d.type.startsWith("audio/")) return "audio"
  if (d.type.startsWith("text/") || ["txt", "md", "csv", "json"].includes(ext)) return "texte"
  if (["ppt", "pptx", "doc", "docx", "xls", "xlsx", "key", "pages", "numbers", "odt", "odp", "ods"].includes(ext)) return "office"
  return "autre"
}

const ETIQUETTE: Record<Genre, { court: string; couleur: string }> = {
  pdf: { court: "PDF", couleur: "#DC2626" },
  image: { court: "IMG", couleur: "#0D9488" },
  video: { court: "VID", couleur: "#7C3AED" },
  audio: { court: "SON", couleur: "#DB2777" },
  texte: { court: "TXT", couleur: "#475569" },
  office: { court: "DOC", couleur: "#2563EB" },
  autre: { court: "FIC", couleur: "#64748B" },
}
function etiquette(d: DocumentEtudes) {
  const ext = d.nom.toLowerCase().split(".").pop() || ""
  if (["ppt", "pptx", "key", "odp"].includes(ext)) return { court: ext === "key" ? "KEY" : "PPT", couleur: "#C2410C" }
  if (["xls", "xlsx", "numbers", "ods"].includes(ext)) return { court: "XLS", couleur: "#15803D" }
  return ETIQUETTE[genre(d)]
}

function poids(o: number) {
  return o < 1024 * 1024 ? `${Math.max(1, Math.round(o / 1024))} Ko` : `${(o / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`
}

function nomPropre(nom: string) {
  return nom.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").slice(-80) || "fichier"
}

export default function DocumentsSection({ userId, dossiers, onNoteCreee }: {
  userId: string
  dossiers: Dossier[]
  onNoteCreee: (note: NoteCarnet) => void
}) {
  const fichierRef = useRef<HTMLInputElement>(null)
  const [docs, setDocs] = useState<DocumentEtudes[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [recherche, setRecherche] = useState("")
  const [filtre, setFiltre] = useState<string>("tous")
  const [envois, setEnvois] = useState<{ nom: string; etat: string }[]>([])
  const [ouvert, setOuvert] = useState<DocumentEtudes | null>(null)

  async function charger() {
    const { data, error } = await supabase.from("etudes_documents").select("id,dossier_id,nom,chemin,type,taille,created_at").eq("user_id", userId).order("created_at", { ascending: false })
    if (error) {
      setErreur(error.code === "42P01" || error.code === "PGRST205"
        ? "Les documents ne sont pas encore activés sur la base de données. Il faut exécuter le fichier SQL des documents dans Supabase."
        : "Impossible de charger tes documents. Vérifie ta connexion puis réessaie.")
      setDocs([])
      return
    }
    setErreur(null)
    setDocs((data || []) as DocumentEtudes[])
  }
  useChargement(charger, userId)

  async function deposer(fichiers: File[]) {
    for (const f of fichiers) {
      if (f.size > TAILLE_MAX) { toast(`« ${f.name} » dépasse 50 Mo`, "error"); continue }
      setEnvois(e => [...e, { nom: f.name, etat: "Envoi…" }])
      const chemin = `${userId}/documents/${crypto.randomUUID()}-${nomPropre(f.name)}`
      const { error } = await supabase.storage.from("etudes").upload(chemin, f, { contentType: f.type || "application/octet-stream" })
      if (error) {
        setEnvois(e => e.filter(x => x.nom !== f.name))
        toast(/size|exceed/i.test(error.message) ? `« ${f.name} » est trop lourd pour ton espace` : `« ${f.name} » n'a pas pu être envoyé`, "error")
        continue
      }
      const ligne = { user_id: userId, nom: f.name.slice(0, 200), chemin, type: f.type || "", taille: f.size, dossier_id: filtre !== "tous" ? filtre : null }
      const { data, error: e2 } = await supabase.from("etudes_documents").insert(ligne).select("id,dossier_id,nom,chemin,type,taille,created_at").single()
      setEnvois(e => e.filter(x => x.nom !== f.name))
      if (e2 || !data) { await supabase.storage.from("etudes").remove([chemin]); toast(`« ${f.name} » n'a pas pu être enregistré`, "error"); continue }
      setDocs(d => [data as DocumentEtudes, ...(d || [])])
    }
  }

  if (ouvert) {
    return (
      <Lecteur doc={ouvert} userId={userId} dossiers={dossiers} onFermer={() => setOuvert(null)} onNoteCreee={onNoteCreee}
        onMaj={d => { setDocs(ds => (ds || []).map(x => (x.id === d.id ? d : x))); setOuvert(d) }}
        onSupprime={id => { setDocs(ds => (ds || []).filter(x => x.id !== id)); setOuvert(null) }} />
    )
  }

  const mots = normaliser(recherche).split(/\s+/).filter(Boolean)
  const visibles = (docs || [])
    .filter(d => filtre === "tous" || d.dossier_id === filtre)
    .filter(d => mots.every(m => normaliser(d.nom).includes(m)))
  const dossiersUtiles = dossiers.filter(d => (docs || []).some(x => x.dossier_id === d.id))
  const puce = (actif: boolean): React.CSSProperties => ({
    flexShrink: 0, border: `1px solid ${actif ? colors.navy : colors.blueBorder}`, background: actif ? colors.navy : "#fff",
    color: actif ? "#fff" : colors.text, borderRadius: radius.pill, padding: "6px 12px", fontSize: "12.5px", cursor: "pointer", whiteSpace: "nowrap", minHeight: 36,
  })

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <input type="search" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher" aria-label="Rechercher un document"
          style={{ flex: 1, minWidth: 0, border: `1px solid ${colors.blueBorder}`, borderRadius: radius.pill, padding: "10px 15px", fontSize: "14px", color: colors.text, background: "#fff" }} />
        <button onClick={() => fichierRef.current?.click()} disabled={!!erreur}
          style={{ flexShrink: 0, background: colors.blue, color: "#fff", border: "none", borderRadius: radius.pill, padding: "0 16px", fontSize: "14px", fontWeight: 600, cursor: "pointer", opacity: erreur ? 0.5 : 1 }}>
          Ajouter
        </button>
        <input ref={fichierRef} type="file" multiple hidden onChange={e => { const f = Array.from(e.target.files || []); e.target.value = ""; if (f.length) void deposer(f) }} />
      </div>

      {dossiersUtiles.length > 0 && (
        <div role="group" aria-label="Filtrer par dossier" style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "10px" }}>
          <button aria-pressed={filtre === "tous"} style={puce(filtre === "tous")} onClick={() => setFiltre("tous")}>Tous</button>
          {dossiersUtiles.map(d => <button key={d.id} aria-pressed={filtre === d.id} style={puce(filtre === d.id)} onClick={() => setFiltre(d.id)}>{d.nom}</button>)}
        </div>
      )}

      {envois.map(e => (
        <div key={e.nom} role="status" style={{ display: "flex", gap: 10, alignItems: "center", background: colors.blueLight, borderRadius: radius.sm, padding: "10px 12px", marginBottom: 8, fontSize: 13 }}>
          <span className="nx-skel" style={{ width: 18, height: 18, borderRadius: "50%" }} />
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.nom}</span>
          <span style={{ color: TEXTE_DOUX }}>{e.etat}</span>
        </div>
      ))}

      {erreur && <p role="alert" style={{ fontSize: "13px", color: colors.text, background: colors.redLight, borderRadius: radius.sm, padding: "10px 12px" }}>{erreur}</p>}
      {docs === null && <div className="nx-skel" style={{ height: 160, borderRadius: radius.md }} />}

      {docs !== null && !erreur && visibles.length === 0 && envois.length === 0 && (
        <button onClick={() => fichierRef.current?.click()}
          style={{ width: "100%", border: `1.5px dashed ${colors.blueBorder}`, background: "#fff", borderRadius: radius.md, padding: "26px 18px", cursor: "pointer", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 600, color: colors.navy, marginBottom: 4 }}>
            {mots.length ? `Aucun document ne s'appelle « ${recherche.trim()} »` : "Ajoute tes supports de cours"}
          </div>
          {!mots.length && <div style={{ fontSize: "13px", color: colors.textMuted, lineHeight: 1.5 }}>PowerPoint, PDF, Word, photos, vidéos… jusqu&apos;à 50 Mo par fichier. Les PowerPoint, Word et PDF peuvent devenir des notes à annoter.</div>}
        </button>
      )}

      {visibles.length > 0 && (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, background: "#fff", border: `1px solid ${colors.blueBorder}`, borderRadius: radius.md, overflow: "hidden" }}>
          {visibles.map((d, i) => {
            const e = etiquette(d)
            const dossier = dossiers.find(x => x.id === d.dossier_id)?.nom
            return (
              <li key={d.id} style={{ borderTop: i ? `1px solid ${colors.border}` : "none" }}>
                <button data-doc={d.id} onClick={() => setOuvert(d)} style={{ width: "100%", display: "flex", gap: 12, alignItems: "center", background: "none", border: "none", padding: "11px 14px", cursor: "pointer", textAlign: "left" }}>
                  <span aria-hidden="true" style={{ width: 40, height: 48, flexShrink: 0, borderRadius: 6, border: `1.5px solid ${e.couleur}`, color: e.couleur, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6, fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3, background: "#fff", boxShadow: `inset 0 10px 0 ${e.couleur}14` }}>{e.court}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "14.5px", fontWeight: 600, color: colors.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nom}</span>
                    <span style={{ display: "block", fontSize: "12px", color: TEXTE_DOUX, marginTop: 2 }}>
                      {poids(d.taille)}, {dateCourte(d.created_at)}{filtre === "tous" && dossier ? `, ${dossier}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Lecteur({ doc, userId, dossiers, onFermer, onMaj, onSupprime, onNoteCreee }: {
  doc: DocumentEtudes
  userId: string
  dossiers: Dossier[]
  onFermer: () => void
  onMaj: (d: DocumentEtudes) => void
  onSupprime: (id: string) => void
  onNoteCreee: (n: NoteCarnet) => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [texte, setTexte] = useState<string | null>(null)
  const [conversion, setConversion] = useState<string | null>(null)
  const [renommer, setRenommer] = useState<string | null>(null)
  const g = genre(doc)
  const convertible: TypeConvertible | null = typeConvertible(doc.nom, doc.type)

  useEffect(() => {
    let actif = true
    supabase.storage.from("etudes").createSignedUrl(doc.chemin, 3600).then(async ({ data }) => {
      if (!actif || !data) return
      setUrl(data.signedUrl)
      if (g === "texte") {
        const r = await fetch(data.signedUrl)
        const t = await r.text()
        if (actif) setTexte(t.length > 300000 ? t.slice(0, 300000) + "\n…" : t)
      }
    })
    return () => { actif = false }
  }, [doc.chemin, g])

  useEffect(() => {
    function echap(e: KeyboardEvent) { if (e.key === "Escape" && !conversion) onFermer() }
    window.addEventListener("keydown", echap)
    return () => window.removeEventListener("keydown", echap)
  }, [conversion, onFermer])

  async function telecharger() {
    const { data } = await supabase.storage.from("etudes").createSignedUrl(doc.chemin, 3600, { download: doc.nom })
    if (data) window.location.assign(data.signedUrl)
  }

  async function changerDossier(id: string | null) {
    const { error } = await supabase.from("etudes_documents").update({ dossier_id: id }).eq("id", doc.id)
    if (error) return toast("Dossier non modifié", "error")
    onMaj({ ...doc, dossier_id: id })
  }

  async function renommerDoc() {
    const nom = (renommer || "").trim().slice(0, 200)
    setRenommer(null)
    if (!nom || nom === doc.nom) return
    const { error } = await supabase.from("etudes_documents").update({ nom }).eq("id", doc.id)
    if (error) return toast("Nom non modifié", "error")
    onMaj({ ...doc, nom })
  }

  async function supprimer() {
    if (!(await confirmer(`Supprimer « ${doc.nom} » ? Les notes déjà créées à partir de ce document sont gardées.`, "Supprimer"))) return
    const { error } = await supabase.from("etudes_documents").delete().eq("id", doc.id)
    if (error) return toast("Suppression impossible", "error")
    await supabase.storage.from("etudes").remove([doc.chemin])
    toast("Document supprimé", "success")
    onSupprime(doc.id)
  }

  async function enNote() {
    if (!convertible) return
    const noteId = crypto.randomUUID()
    try {
      setConversion("Téléchargement du document…")
      const { data, error } = await supabase.storage.from("etudes").download(doc.chemin)
      if (error || !data) throw new Error("Téléchargement impossible")
      const blocs = await convertir(data, convertible, setConversion)
      if (!blocs.length) throw new Error("Aucun texte ni image trouvé dans ce document")
      const html = await versHtml(blocs, async img => {
        const jpeg = await compresserImage(img).catch(() => null)
        if (!jpeg) return null
        const chemin = `${userId}/notes/${noteId}/${crypto.randomUUID()}.jpg`
        const { error: e } = await supabase.storage.from("etudes").upload(chemin, jpeg, { contentType: "image/jpeg" })
        return e ? null : chemin
      }, setConversion)
      setConversion("Création de la note…")
      const contenu = nettoyerHtml(html)
      const maintenant = new Date().toISOString()
      const note = {
        id: noteId, user_id: userId, dossier_id: doc.dossier_id, titre: doc.nom.replace(/\.[^.]+$/, "").slice(0, 200),
        contenu, texte: texteBrut(contenu).slice(0, 200000), epingle: false, chapitre_id: null, created_at: maintenant, updated_at: maintenant,
      }
      const { data: creee, error: e3 } = await supabase.from("carnet_notes").insert(note).select(COLONNES_NOTE).single()
      if (e3 || !creee) throw new Error("La note n'a pas pu être enregistrée")
      toast("Note créée à partir du document", "success")
      onNoteCreee(creee as NoteCarnet)
    } catch (e) {
      setConversion(null)
      toast(e instanceof Error ? e.message : "Transformation impossible", "error")
    }
  }

  const bouton: React.CSSProperties = { border: `1px solid ${colors.blueBorder}`, background: "#fff", borderRadius: radius.pill, padding: "9px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer", color: colors.text, minHeight: 40 }
  const ext = doc.nom.toLowerCase().split(".").pop()

  return (
    <div role="dialog" aria-modal="true" aria-label={doc.nom} style={{ position: "fixed", inset: 0, zIndex: 1100, background: "#F4F7FB", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", paddingTop: "calc(10px + env(safe-area-inset-top))", background: "#fff", borderBottom: `1px solid ${colors.border}` }}>
        <button onClick={onFermer} disabled={!!conversion} aria-label="Retour aux documents"
          style={{ border: "none", background: colors.blueLight, color: colors.blue, fontWeight: 600, fontSize: "13px", padding: "8px 13px", borderRadius: radius.pill, cursor: "pointer" }}>← Documents</button>
        {renommer === null ? (
          <button onClick={() => setRenommer(doc.nom)} title="Renommer" style={{ flex: 1, minWidth: 0, border: "none", background: "none", textAlign: "left", fontSize: "14px", fontWeight: 600, color: colors.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "text", padding: 0 }}>{doc.nom}</button>
        ) : (
          <form style={{ flex: 1 }} onSubmit={e => { e.preventDefault(); void renommerDoc() }}>
            <input autoFocus value={renommer} onChange={e => setRenommer(e.target.value)} onBlur={() => void renommerDoc()} aria-label="Nom du document" maxLength={200}
              onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); setRenommer(null) } }}
              style={{ width: "100%", border: `1px solid ${colors.blue}`, borderRadius: 8, padding: "6px 10px" }} />
          </form>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, padding: "10px 12px", overflowX: "auto", background: "#fff", borderBottom: `1px solid ${colors.border}`, alignItems: "center" }}>
        {convertible && (
          <button onClick={() => void enNote()} disabled={!!conversion}
            style={{ ...bouton, background: colors.navy, color: "#fff", borderColor: colors.navy, flexShrink: 0 }}>Transformer en note</button>
        )}
        <button onClick={() => void telecharger()} style={{ ...bouton, flexShrink: 0 }}>{g === "office" || g === "autre" ? "Ouvrir avec une app" : "Télécharger"}</button>
        {url && (g === "pdf" || g === "image" || g === "video" || g === "audio") && (
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...bouton, flexShrink: 0, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Plein écran</a>
        )}
        <select value={doc.dossier_id ?? ""} onChange={e => void changerDossier(e.target.value || null)} aria-label="Dossier"
          style={{ ...bouton, flexShrink: 0, padding: "8px 10px" }}>
          <option value="">Aucun dossier</option>
          {dossiers.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
        </select>
        <button onClick={() => void supprimer()} style={{ ...bouton, color: ROUGE_TEXTE, flexShrink: 0 }}>Supprimer</button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", alignItems: g === "pdf" ? "stretch" : "center", justifyContent: "center", padding: g === "pdf" ? 0 : 16 }}>
        {conversion ? (
          <div role="status" style={{ textAlign: "center", color: colors.navy }}>
            <div className="nx-skel" style={{ width: 56, height: 56, borderRadius: "50%", margin: "0 auto 14px" }} />
            <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600 }}>Transformation en note</div>
            <div style={{ fontSize: 13, color: TEXTE_DOUX, marginTop: 4 }}>{conversion}</div>
          </div>
        ) : !url ? (
          <div className="nx-skel" style={{ width: "100%", height: "60%", borderRadius: radius.md }} />
        ) : g === "pdf" ? (
          <iframe src={url} title={doc.nom} style={{ width: "100%", height: "100%", border: "none", background: "#fff" }} />
        ) : g === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={doc.nom} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8, boxShadow: "0 2px 12px rgba(10,22,40,.12)" }} />
        ) : g === "video" ? (
          <video src={url} controls playsInline style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, background: "#000" }} />
        ) : g === "audio" ? (
          <audio src={url} controls style={{ width: "100%", maxWidth: 480 }} />
        ) : g === "texte" ? (
          <pre style={{ alignSelf: "stretch", width: "100%", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#fff", borderRadius: 8, padding: 16, fontSize: 13.5, lineHeight: 1.55, fontFamily: "var(--font-geist-mono), monospace", color: colors.text }}>{texte ?? "Chargement…"}</pre>
        ) : (
          <div style={{ maxWidth: 380, textAlign: "center", color: colors.text }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: colors.navy, marginBottom: 8 }}>Aperçu impossible dans l&apos;appli</div>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: colors.textMuted, margin: "0 0 14px" }}>
              {ext === "ppt" || ext === "doc"
                ? "Ce fichier est dans un ancien format Office (avant 2007). Ouvre-le avec PowerPoint, Word, Keynote ou Pages ; pour le transformer en note, enregistre-le d'abord en .pptx ou .docx."
                : convertible
                  ? "Ouvre-le avec l'app de ton téléphone, ou transforme-le en note pour le lire, le surligner et l'annoter ici."
                  : "Ouvre-le avec l'app adaptée de ton téléphone (PowerPoint, Keynote, Excel, Numbers…)."}
            </p>
            {convertible && <button onClick={() => void enNote()} style={{ ...bouton, background: colors.navy, color: "#fff", borderColor: colors.navy }}>Transformer en note</button>}
            <p style={{ fontSize: 12, color: BLEU_TEXTE, marginTop: 14 }}>{poids(doc.taille)}</p>
          </div>
        )}
      </div>
    </div>
  )
}
