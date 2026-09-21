import { colors } from "./tokens"

type Tone = "success" | "danger" | "warning" | "info" | "neutral"

const toneStyles: Record<Tone, React.CSSProperties> = {
  success: { background: colors.greenLight, color: colors.green },
  danger: { background: colors.redLight, color: colors.red },
  warning: { background: colors.goldLight, color: "#8a6d1a" },
  info: { background: colors.blueLight, color: colors.blue },
  neutral: { background: "#F0F4FA", color: colors.textMuted },
}

export default function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span style={{ ...toneStyles[tone], fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "99px", display: "inline-block" }}>
      {children}
    </span>
  )
}
