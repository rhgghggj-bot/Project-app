import Button from "./Button"
import { colors } from "./tokens"

export default function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <div style={{ margin: "0 auto 12px", width: "40px", height: "40px", color: colors.textFaint }}>{icon}</div>
      <p style={{ fontSize: "14px", fontWeight: 500, color: colors.text, marginBottom: "4px" }}>{title}</p>
      {subtitle && <p style={{ fontSize: "12px", color: colors.textFaint, marginBottom: actionLabel ? "16px" : 0 }}>{subtitle}</p>}
      {actionLabel && onAction && <Button onClick={onAction} pill>{actionLabel}</Button>}
    </div>
  )
}
