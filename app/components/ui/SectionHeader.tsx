import { gradients } from "./tokens"

export default function SectionHeader({
  backHref,
  backLabel = "← Retour",
  title,
  action,
}: {
  backHref: string
  backLabel?: string
  title: string
  action?: React.ReactNode
}) {
  return (
    <div style={{ background: gradients.header, padding: "20px 18px 28px" }}>
      <a href={backHref} style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: "8px" }}>{backLabel}</a>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "20px", fontWeight: 500, color: "#fff" }}>{title}</div>
        {action}
      </div>
    </div>
  )
}
