import { colors, radius, shadow } from "./tokens"

export default function Card({
  children,
  onClick,
  href,
  padding = "14px",
  elevated = false,
  style,
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  padding?: string
  elevated?: boolean
  style?: React.CSSProperties
}) {
  const base: React.CSSProperties = {
    background: "#fff",
    border: `0.5px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding,
    boxShadow: elevated ? shadow.card : undefined,
    cursor: onClick || href ? "pointer" : undefined,
    display: "block",
    textDecoration: "none",
    color: "inherit",
    ...style,
  }

  if (href) return <a href={href} style={base}>{children}</a>
  if (onClick) return (
    <div role="button" tabIndex={0} onClick={onClick}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick() } }}
      style={base}>
      {children}
    </div>
  )
  return <div style={base}>{children}</div>
}
