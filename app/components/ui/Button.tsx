import Link from "next/link"
import { colors, radius } from "./tokens"

// onDark : bouton translucide posé sur les en-têtes bleu nuit
type Variant = "primary" | "gold" | "secondary" | "danger" | "ghost" | "onDark"

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: colors.blue, color: "#fff", border: "none" },
  gold: { background: colors.gold, color: "#fff", border: "none" },
  secondary: { background: colors.blueLight, color: colors.blue, border: `0.5px solid ${colors.blueBorder}` },
  danger: { background: colors.redLight, color: colors.red, border: `0.5px solid ${colors.redBorder}` },
  ghost: { background: "#fff", color: colors.textMuted, border: `0.5px solid ${colors.border}` },
  onDark: { background: "rgba(255,255,255,0.15)", color: "#fff", border: "0.5px solid rgba(255,255,255,0.25)" },
}

export default function Button({
  children,
  onClick,
  href,
  variant = "primary",
  full = false,
  pill = false,
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode
  onClick?: () => void
  // Avec href, le bouton est un lien (évite l'imbrication invalide <a><button>)
  href?: string
  variant?: Variant
  full?: boolean
  pill?: boolean
  disabled?: boolean
  type?: "button" | "submit"
}) {
  const style: React.CSSProperties = {
    ...variantStyles[variant],
    width: full ? "100%" : undefined,
    borderRadius: pill ? radius.pill : radius.sm,
    padding: pill ? "10px 24px" : "10px 16px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  }

  if (href && !disabled) {
    return (
      <Link href={href} style={{ ...style, display: full ? "block" : "inline-block", textAlign: "center", textDecoration: "none" }}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  )
}
