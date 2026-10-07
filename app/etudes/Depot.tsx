"use client"
import { useRef, useState } from "react"
import { colors, radius } from "@/app/components/ui/tokens"
import type { ChoixIA } from "./document"

export const champ: React.CSSProperties = { width: "100%", border: `0.5px solid ${colors.blueBorder}`, borderRadius: radius.sm, padding: "9px 10px", fontSize: "13px", color: colors.text, background: "#fff" }
export const carte: React.CSSProperties = { background: "#fff", border: `0.5px solid ${colors.border}`, borderRadius: radius.md, padding: "14px", marginBottom: "12px" }
export const titreCarte: React.CSSProperties = { fontSize: "13px", fontWeight: 500, color: colors.text, marginBottom: "8px" }

// Zone de dépôt commune (copie à corriger, cours à réviser) : photo, PDF ou
// texte collé, plus la matière.
export default function Depot({ titre, aide, ia, enCours, libelleAction, onEnvoyer }: {
  titre: string
  aide: string
  ia: ChoixIA
  enCours: boolean
  libelleAction: string
  onEnvoyer: (d: { fichier: File | null; texte: string; matiere: string; titre: string }) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [fichier, setFichier] = useState<File | null>(null)
  const [texte, setTexte] = useState("")
  const [modeTexte, setModeTexte] = useState(false)
  const [matiere, setMatiere] = useState("")
  const [nom, setNom] = useState("")

  const pret = !!fichier || texte.trim().length > 20

  return (
    <div style={carte}>
      <div style={titreCarte}>{titre}</div>
      <p style={{ fontSize: "12px", color: colors.textMuted, margin: "0 0 10px", lineHeight: 1.5 }}>{aide}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
        <label><span style={{ fontSize: "11px", color: colors.textMuted, display: "block", marginBottom: "4px" }}>Matière</span>
          <input value={matiere} onChange={e => setMatiere(e.target.value)} style={champ} placeholder="Comptabilité" />
        </label>
        <label><span style={{ fontSize: "11px", color: colors.textMuted, display: "block", marginBottom: "4px" }}>Titre (facultatif)</span>
          <input value={nom} onChange={e => setNom(e.target.value)} style={champ} placeholder="Chapitre 3" />
        </label>
      </div>

      {!modeTexte ? (
        <div role="button" tabIndex={0} onClick={() => fileRef.current?.click()}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click() } }}
          style={{ border: `2px dashed ${colors.blueBorder}`, borderRadius: radius.md, padding: "20px 12px", textAlign: "center", cursor: "pointer", background: "#F8FBFF" }}>
          <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={colors.blue} strokeWidth="1.6" style={{ margin: "0 auto 6px", display: "block" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <div style={{ fontSize: "13px", color: colors.text, fontWeight: 500 }}>{fichier ? fichier.name : "Photo ou PDF"}</div>
          <div style={{ fontSize: "11px", color: colors.textFaint, marginTop: "2px" }}>
            {fichier ? "Touche pour changer de fichier" : ia === "local" ? "Photo nette (l'IA locale ne lit pas les PDF)" : "Prends une photo nette ou choisis un PDF (3 Mo max)"}
          </div>
          <input ref={fileRef} type="file" accept={ia === "local" ? "image/*,text/plain" : "image/*,application/pdf,text/plain"} style={{ display: "none" }}
            onChange={e => setFichier(e.target.files?.[0] ?? null)} />
        </div>
      ) : (
        <textarea value={texte} onChange={e => setTexte(e.target.value)} rows={6} style={{ ...champ, resize: "vertical" }}
          placeholder="Colle ici le texte de ton évaluation ou de ton cours" aria-label="Texte du document" />
      )}

      <button onClick={() => { setModeTexte(!modeTexte); setFichier(null); setTexte("") }}
        style={{ background: "none", border: "none", color: colors.blue, fontSize: "12px", cursor: "pointer", padding: "8px 0 0" }}>
        {modeTexte ? "Envoyer une photo ou un PDF à la place" : "Ou coller du texte"}
      </button>

      <button disabled={!pret || enCours} onClick={() => onEnvoyer({ fichier, texte, matiere: matiere.trim(), titre: nom.trim() })}
        style={{ display: "block", width: "100%", marginTop: "10px", background: colors.blue, color: "#fff", border: "none", borderRadius: radius.sm, padding: "11px", fontSize: "13px", fontWeight: 500, cursor: pret && !enCours ? "pointer" : "not-allowed", opacity: pret && !enCours ? 1 : 0.5 }}>
        {enCours ? "Analyse en cours… (jusqu'à 1-2 min)" : libelleAction}
      </button>
    </div>
  )
}

// Exercice avec solution masquée tant que l'étudiant ne l'a pas demandée.
export function Exercice({ numero, enonce, solution }: { numero: number; enonce: string; solution: string }) {
  const [vue, setVue] = useState(false)
  return (
    <div style={{ borderTop: `0.5px solid ${colors.border}`, padding: "10px 0" }}>
      <div style={{ fontSize: "13px", color: colors.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}><b>Exercice {numero}.</b> {enonce}</div>
      {vue ? (
        <div style={{ fontSize: "12px", color: colors.textMuted, background: colors.greenLight, borderRadius: radius.sm, padding: "8px 10px", marginTop: "6px", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{solution}</div>
      ) : (
        <button onClick={() => setVue(true)} style={{ background: "none", border: "none", color: colors.blue, fontSize: "12px", cursor: "pointer", padding: "6px 0 0" }}>Voir la solution</button>
      )}
    </div>
  )
}
