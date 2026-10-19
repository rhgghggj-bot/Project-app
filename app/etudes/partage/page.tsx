"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { nettoyerHtml, texteBrut } from "@/lib/carnet"
import { lireNotePartagee, type NotePartagee } from "@/lib/partage"
import { toast } from "@/lib/toast"
import { colors, radius } from "@/app/components/ui/tokens"

// Note reçue d'un camarade : elle est dans le lien (après le #). On l'affiche
// en lecture, et on peut l'ajouter à son propre carnet.
export default function NoteRecue() {
  const [note, setNote] = useState<NotePartagee | null | undefined>(undefined)
  const [html, setHtml] = useState("")
  const [connecte, setConnecte] = useState<boolean | null>(null)
  const [ajout, setAjout] = useState<"non" | "envoi" | "fait">("non")

  useEffect(() => {
    const n = lireNotePartagee(window.location.hash.slice(1))
    queueMicrotask(() => { setNote(n); if (n) setHtml(nettoyerHtml(n.html)) })
    supabase.auth.getSession().then(({ data }) => setConnecte(!!data.session))
  }, [])

  async function ajouter() {
    if (!note) return
    setAjout("envoi")
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAjout("non"); return }
    const maintenant = new Date().toISOString()
    const { error } = await supabase.from("carnet_notes").insert({
      id: crypto.randomUUID(), user_id: user.id, dossier_id: null, titre: note.titre.slice(0, 200),
      contenu: html, texte: texteBrut(html).slice(0, 200000), epingle: false, chapitre_id: null, created_at: maintenant, updated_at: maintenant,
    })
    if (error) { setAjout("non"); toast("La note n'a pas pu être ajoutée, vérifie ta connexion", "error"); return }
    setAjout("fait")
    toast("Note ajoutée à ton carnet", "success")
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "20px 16px 40px" }}>
      <Link href="/etudes" style={{ fontSize: 13, color: colors.textMuted }}>← Espace étudiant</Link>
      {note === undefined ? <div className="nx-skel" style={{ height: 200, borderRadius: radius.md, marginTop: 16 }} />
        : note === null ? (
          <p style={{ marginTop: 20, color: colors.text }}>Ce lien de partage est incomplet ou abîmé. Demande à ton camarade de te le renvoyer.</p>
        ) : (
          <>
            <div style={{ fontSize: 12, color: colors.textMuted, margin: "16px 0 4px" }}>Note partagée par un camarade</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: colors.navy, margin: "0 0 12px" }}>{note.titre}</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {connecte === false ? (
                <Link href="/connexion" style={{ background: colors.blue, color: "#fff", borderRadius: radius.pill, padding: "10px 16px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Se connecter pour l&apos;ajouter à mon carnet</Link>
              ) : ajout === "fait" ? (
                <Link href="/etudes" style={{ background: colors.green, color: "#fff", borderRadius: radius.pill, padding: "10px 16px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>✓ Ajoutée · ouvrir mon carnet</Link>
              ) : (
                <button onClick={() => void ajouter()} disabled={ajout === "envoi" || connecte === null}
                  style={{ background: colors.blue, color: "#fff", border: "none", borderRadius: radius.pill, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  {ajout === "envoi" ? "Ajout…" : "Ajouter à mon carnet"}
                </button>
              )}
            </div>
            <article className="note-partagee" style={{ background: "#fff", border: `1px solid ${colors.border}`, borderRadius: radius.md, padding: "16px 18px", fontSize: 16, lineHeight: 1.6, color: colors.text, overflowWrap: "break-word" }}
              dangerouslySetInnerHTML={{ __html: html }} />
            <style>{`.note-partagee mark{background:#FFE66D;border-radius:2px}.note-partagee mark[data-couleur="vert"]{background:#B7F0C8}.note-partagee mark[data-couleur="rose"]{background:#FFC7DE}.note-partagee mark[data-couleur="bleu"]{background:#BFE3FF}.note-partagee mark[data-couleur="orange"]{background:#FFD8A8}.note-partagee blockquote{margin:10px 0;padding:8px 12px;border-left:4px solid #2B7FFF;background:#F4F8FF;border-radius:6px}.note-partagee table{border-collapse:collapse}.note-partagee td,.note-partagee th{border:1px solid #D6DCDF;padding:4px 8px}.note-partagee h2{font-size:20px;margin:16px 0 6px}.note-partagee h3{font-size:17px;margin:12px 0 4px}`}</style>
          </>
        )}
    </main>
  )
}
