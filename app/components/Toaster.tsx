"use client"
import { useEffect, useState } from "react"
import type { ConfirmDetail, ToastDetail } from "@/lib/toast"
import { useEscape } from "@/lib/a11y"
import { colors } from "./ui/tokens"

const tons = {
  info: { background: colors.navy, color: "#fff" },
  success: { background: colors.green, color: "#fff" },
  error: { background: colors.red, color: "#fff" },
} as const

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastDetail[]>([])
  const [demande, setDemande] = useState<ConfirmDetail | null>(null)

  function repondre(ok: boolean) {
    demande?.resolve(ok)
    setDemande(null)
  }
  useEscape(!!demande, () => repondre(false))

  useEffect(() => {
    function onToast(e: Event) {
      const t = (e as CustomEvent<ToastDetail>).detail
      setToasts(prev => [...prev.slice(-2), t])
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 4500)
    }
    function onConfirm(e: Event) {
      setDemande((e as CustomEvent<ConfirmDetail>).detail)
    }
    window.addEventListener("nexia:toast", onToast)
    window.addEventListener("nexia:confirm", onConfirm)
    return () => {
      window.removeEventListener("nexia:toast", onToast)
      window.removeEventListener("nexia:confirm", onConfirm)
    }
  }, [])

  return (
    <>
    {demande && (
      <div role="presentation" onClick={() => repondre(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(10,22,40,0.5)", zIndex: 3001, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div role="alertdialog" aria-modal="true" aria-labelledby="nx-confirm-texte" onClick={e => e.stopPropagation()}
          style={{ background: "#fff", borderRadius: "18px", padding: "22px", maxWidth: "340px", width: "100%", textAlign: "center" }}>
          <p id="nx-confirm-texte" style={{ fontSize: "15px", color: colors.text, margin: "0 0 18px", lineHeight: 1.45 }}>{demande.message}</p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" autoFocus onClick={() => repondre(false)}
              style={{ flex: 1, padding: "12px", borderRadius: "12px", border: `0.5px solid ${colors.border}`, background: "#fff", color: colors.textMuted, fontSize: "14px", cursor: "pointer" }}>Annuler</button>
            <button type="button" onClick={() => repondre(true)}
              style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: colors.red, color: "#fff", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>{demande.confirmLabel}</button>
          </div>
        </div>
      </div>
    )}
    <div aria-live="polite" role="status"
      style={{ position: "fixed", left: 0, right: 0, bottom: "calc(96px + env(safe-area-inset-bottom))", zIndex: 3000, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "0 16px", pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} className="nexia-in"
          style={{ ...tons[t.tone], maxWidth: "420px", width: "100%", padding: "12px 16px", borderRadius: "14px", fontSize: "14px", lineHeight: 1.4, boxShadow: "0 8px 30px rgba(10,22,40,0.25)", pointerEvents: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button type="button" aria-label="Fermer" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            style={{ background: "none", border: "none", color: "inherit", opacity: 0.8, cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "2px" }}>×</button>
        </div>
      ))}
    </div>
    </>
  )
}
