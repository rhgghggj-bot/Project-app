"use client"
import { useEffect } from "react"
import { signalerErreur } from "@/lib/signalerErreur"

// Dernier filet : l'appli entière a planté (remplace la mise en page)
export default function ErreurGlobale({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => { signalerErreur(error, "globale") }, [error])
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#F4F6FA", color: "#1a1a2e" }}>
        <main role="alert" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16, textAlign: "center" }}>
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: 22 }}>Nexia a rencontré un problème</h1>
            <p style={{ color: "#5B6577", lineHeight: 1.5 }}>Tes données ne sont pas perdues. Le problème nous a été signalé.</p>
            <button onClick={() => unstable_retry()} style={{ minHeight: 44, padding: "0 20px", borderRadius: 999, border: "none", background: "#2B7FFF", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Recharger</button>
          </div>
        </main>
      </body>
    </html>
  )
}
