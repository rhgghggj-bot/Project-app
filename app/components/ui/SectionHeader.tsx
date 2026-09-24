import Link from "next/link"
import { gradients } from "./tokens"

// En-tête des pages secondaires : lien retour (glissement "nav-back"), titre, action optionnelle.
export default function SectionHeader({
  backHref,
  backLabel = "← Retour",
  title,
  subtitle,
  action,
}: {
  backHref: string
  backLabel?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div style={{ background: gradients.header, padding: "20px 18px 28px" }}>
      <Link href={backHref} transitionTypes={["nav-back"]} style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", display: "inline-block", marginBottom: "8px", textDecoration: "none" }}>{backLabel}</Link>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <h1 className="nx-display" style={{ fontSize: "22px", fontWeight: 600, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>{title}</h1>
        {action}
      </div>
      {subtitle && <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>{subtitle}</p>}
    </div>
  )
}
