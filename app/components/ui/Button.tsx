import { colors, radius } from "./tokens"

type Variant = "primary" | "gold" | "secondary" | "danger" | "ghost"

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: colors.blue, color: "#fff", border: "none" },
  gold: { background: colors.gold, color: "#fff", border: "none" },
  secondary: { background: colors.blueLight, color: colors.blue, border: `0.5px solid ${colors.blueBorder}` },
  danger: { background: colors.redLight, color: colors.red, border: `0.5px solid ${colors.redBorder}` },
  ghost: { background: "#fff", color: colors.textMuted, border: `0.5px solid ${colors.border}` },
}

export default function Button({
  children,
  onClick,
  variant = "primary",
  full = false,
  pill = false,
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: Variant
  full?: boolean
  pill?: boolean
  disabled?: boolean
  type?: "button" | "submit"
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variantStyles[variant],
        width: full ? "100%" : undefined,
        borderRadius: pill ? radius.pill : radius.sm,
        padding: pill ? "10px 24px" : "10px 16px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}
