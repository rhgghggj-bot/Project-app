import Link from "next/link"

// Fond et carte des petites pages de compte (mot de passe oublié, nouveau mot de passe)
export const champAuth: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.1)", border: "0.5px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: 16, color: "#fff", boxSizing: "border-box" }
export const etiquetteAuth: React.CSSProperties = { fontSize: 12, color: "rgba(255,255,255,0.7)", display: "block", marginBottom: 6 }
export const boutonAuth: React.CSSProperties = { width: "100%", background: "#fff", color: "#1a3a6e", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", minHeight: 48 }
export function messageAuth(ok: boolean): React.CSSProperties {
  return { background: ok ? "rgba(16,185,129,0.18)" : "rgba(244,63,94,0.2)", border: `0.5px solid ${ok ? "rgba(16,185,129,0.4)" : "rgba(244,63,94,0.4)"}`, borderRadius: 10, padding: "10px 14px", fontSize: 13.5, color: ok ? "#86efac" : "#fca5a5", marginBottom: 16, lineHeight: 1.45 }
}

export default function CarteAuth({ titre, sousTitre, children }: { titre: string; sousTitre: string; children: React.ReactNode }) {
  return (
    <main data-deja-sombre style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0A1628,#1a3a6e,#2B7FFF)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <Link href="/connexion" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20, textDecoration: "none" }}>
          <svg aria-hidden="true" width="30" height="30" viewBox="0 0 60 60">
            <path d="M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z" fill="url(#authGrad)" />
            <defs><linearGradient id="authGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#2B7FFF" /><stop offset="100%" stopColor="#D4A843" /></linearGradient></defs>
          </svg>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: 2 }}>NEXIA</span>
        </Link>
        <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", border: "0.5px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: 28 }}>
          <h1 style={{ fontSize: 20, color: "#fff", margin: "0 0 6px" }}>{titre}</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: "0 0 20px", lineHeight: 1.5 }}>{sousTitre}</p>
          {children}
        </div>
      </div>
    </main>
  )
}
