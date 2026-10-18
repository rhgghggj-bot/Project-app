"use client"
import { useEffect, useState } from "react"
import { toast, confirmer } from "@/lib/toast"
import { colors, radius } from "@/app/components/ui/tokens"
import { joursRestants, JOURS_CORBEILLE, listerCorbeille, restaurer, supprimerDefinitivement, type ElementCorbeille, type TypeCorbeille } from "@/lib/corbeille"
import type { Dossier } from "@/lib/carnet"
import { ROUGE_TEXTE, TEXTE_DOUX } from "./cahier"

// Corbeille du carnet : notes et documents supprimés, à restaurer pendant 30 jours.
export default function Corbeille({ userId, dossiers, onFermer, onRestaure }: {
  userId: string
  dossiers: Dossier[]
  onFermer: () => void
  onRestaure: (type: TypeCorbeille) => void
}) {
  const [liste, setListe] = useState<ElementCorbeille[] | null>(null)
  const [occupe, setOccupe] = useState<string | null>(null)

  useEffect(() => {
    let actif = true
    listerCorbeille(userId).then(l => { if (actif) setListe(l) }).catch(() => { if (actif) setListe([]) })
    return () => { actif = false }
  }, [userId])

  useEffect(() => {
    function echap(e: KeyboardEvent) { if (e.key === "Escape") { e.stopPropagation(); onFermer() } }
    window.addEventListener("keydown", echap, true)
    return () => window.removeEventListener("keydown", echap, true)
  }, [onFermer])

  async function remettre(e: ElementCorbeille) {
    setOccupe(e.id)
    const ok = await restaurer(userId, e, new Set(dossiers.map(d => d.id)))
    setOccupe(null)
    if (!ok) return toast("Restauration impossible, vérifie ta connexion", "error")
    setListe(l => (l || []).filter(x => x.id !== e.id))
    toast(e.type === "note" ? "Note restaurée" : "Document restauré", "success")
    onRestaure(e.type)
  }

  async function effacer(e: ElementCorbeille) {
    if (!(await confirmer(`Supprimer définitivement « ${e.titre} » ? Impossible de revenir en arrière.`, "Supprimer"))) return
    setOccupe(e.id)
    await supprimerDefinitivement(userId, e)
    setOccupe(null)
    setListe(l => (l || []).filter(x => x.id !== e.id))
  }

  async function vider() {
    if (!liste?.length) return
    if (!(await confirmer(`Vider la corbeille (${liste.length} élément${liste.length > 1 ? "s" : ""}) ? Impossible de revenir en arrière.`, "Vider"))) return
    setOccupe("tout")
    for (const e of liste) await supprimerDefinitivement(userId, e)
    setOccupe(null)
    setListe([])
  }

  const bouton: React.CSSProperties = { border: `1px solid ${colors.blueBorder}`, background: "#fff", borderRadius: radius.pill, padding: "6px 12px", fontSize: 12.5, cursor: "pointer", minHeight: 36, color: colors.text, flexShrink: 0 }

  return (
    <div role="dialog" aria-modal="true" aria-label="Corbeille" onClick={e => { if (e.target === e.currentTarget) onFermer() }}
      style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(10,22,40,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 560, maxHeight: "80dvh", borderRadius: "18px 18px 0 0", padding: "14px 14px calc(14px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: colors.text }}>Corbeille</div>
          {!!liste?.length && <button onClick={() => void vider()} disabled={!!occupe} style={{ ...bouton, color: ROUGE_TEXTE, border: "none" }}>Vider</button>}
          <button onClick={onFermer} style={{ ...bouton, border: "none", background: colors.blueLight, color: colors.blue }}>Fermer</button>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: TEXTE_DOUX }}>Les notes et documents supprimés restent ici {JOURS_CORBEILLE} jours, puis disparaissent.</p>
        <div style={{ overflowY: "auto" }}>
          {liste === null && <div className="nx-skel" style={{ height: 120, borderRadius: radius.sm }} />}
          {liste?.length === 0 && <p style={{ fontSize: 13.5, color: colors.textMuted, textAlign: "center", padding: "18px 0" }}>La corbeille est vide.</p>}
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {liste?.map(e => (
              <li key={`${e.type}-${e.id}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 2px", borderBottom: `1px solid ${colors.border}` }}>
                <span aria-hidden="true" style={{ fontSize: 10.5, fontWeight: 800, color: e.type === "note" ? colors.blue : "#C2410C", border: "1.5px solid currentColor", borderRadius: 5, padding: "2px 5px", flexShrink: 0 }}>{e.type === "note" ? "NOTE" : "DOC"}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: colors.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.titre}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: TEXTE_DOUX }}>Encore {joursRestants(e)} jour{joursRestants(e) > 1 ? "s" : ""}</span>
                </span>
                <button onClick={() => void remettre(e)} disabled={!!occupe} style={{ ...bouton, background: colors.navy, borderColor: colors.navy, color: "#fff" }}>Restaurer</button>
                <button onClick={() => void effacer(e)} disabled={!!occupe} aria-label={`Supprimer définitivement ${e.titre}`} style={{ ...bouton, color: ROUGE_TEXTE }}>✕</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
