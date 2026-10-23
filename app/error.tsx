"use client"
import { useEffect } from "react"
import Link from "next/link"
import { signalerErreur } from "@/lib/signalerErreur"

// Une page a planté : message clair, bouton pour réessayer, et rapport envoyé
export default function ErreurPage({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => { signalerErreur(error, "page") }, [error])
  const bouton: React.CSSProperties = { display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 18px", borderRadius: 999, fontSize: 14.5, fontWeight: 600, textDecoration: "none", cursor: "pointer" }
  return (
    <main role="alert" style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: "40px 16px", textAlign: "center" }}>
      <div style={{ maxWidth: 440 }}>
        <div style={{ fontSize: 40 }} aria-hidden="true">🛠️</div>
        <h1 style={{ fontSize: 24, color: "#0A1628", margin: "8px 0", textWrap: "balance" }}>Oups, cette page a eu un problème</h1>
        <p style={{ color: "#5B6577", lineHeight: 1.55, margin: "0 0 20px", textWrap: "pretty" }}>Tes données ne sont pas perdues. Le problème nous a été signalé automatiquement. Tu peux réessayer tout de suite.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => unstable_retry()} style={{ ...bouton, border: "none", background: "#2B7FFF", color: "#fff" }}>Réessayer</button>
          <Link href="/" style={{ ...bouton, background: "#fff", color: "#1a1a2e", border: "1px solid #D6DCE6" }}>Retour à l&apos;accueil</Link>
        </div>
      </div>
    </main>
  )
}
