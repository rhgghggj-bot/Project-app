import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Page introuvable", robots: { index: false } }

// Page 404 : lien évident vers l'accueil et les endroits les plus utilisés
export default function PageIntrouvable() {
  const lien: React.CSSProperties = { display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 18px", borderRadius: 999, fontSize: 14.5, fontWeight: 600, textDecoration: "none" }
  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "40px 16px", textAlign: "center" }}>
      <div style={{ maxWidth: 440 }}>
        <svg aria-hidden="true" width="56" height="56" viewBox="0 0 60 60" style={{ marginBottom: 12 }}>
          <path d="M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z" fill="url(#nfGrad)" />
          <defs><linearGradient id="nfGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#2B7FFF" /><stop offset="100%" stopColor="#D4A843" /></linearGradient></defs>
        </svg>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".08em", color: "#2B7FFF" }}>ERREUR 404</div>
        <h1 style={{ fontSize: 26, color: "#0A1628", margin: "6px 0 8px", textWrap: "balance" }}>Cette page n&apos;existe pas</h1>
        <p style={{ color: "#5B6577", lineHeight: 1.55, margin: "0 0 20px", textWrap: "pretty" }}>Le lien est peut-être ancien ou mal recopié. Pas de souci, tout le reste est toujours là.</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ ...lien, background: "#2B7FFF", color: "#fff" }}>Retour à l&apos;accueil</Link>
          <Link href="/etudes" style={{ ...lien, background: "#fff", color: "#1a1a2e", border: "1px solid #D6DCE6" }}>Espace étudiant</Link>
        </div>
      </div>
    </main>
  )
}
