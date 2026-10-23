import { ImageResponse } from "next/og"

// Image affichée quand un lien Nexia est partagé (WhatsApp, Instagram, LinkedIn…)
export const alt = "Nexia — Ton hub de vie : espace étudiant, finances, calendrier et groupes"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 90px", background: "linear-gradient(150deg, #0A1628 0%, #1a3a6e 60%, #2B7FFF 100%)", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="88" height="88" viewBox="0 0 60 60">
            <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#5B9BFF" /><stop offset="100%" stopColor="#D4A843" /></linearGradient></defs>
            <path d="M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z" fill="url(#g)" />
          </svg>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: 8 }}>NEXIA</div>
        </div>
        <div style={{ fontSize: 58, fontWeight: 800, marginTop: 40, lineHeight: 1.1, maxWidth: 950 }}>Révise moins longtemps, retiens mieux.</div>
        <div style={{ fontSize: 30, marginTop: 24, color: "rgba(255,255,255,.8)", maxWidth: 950 }}>Notes, fiches, cartes de révision, planning d&apos;examen, finances, calendrier et groupes. Gratuit et sans publicité.</div>
      </div>
    ),
    size,
  )
}
