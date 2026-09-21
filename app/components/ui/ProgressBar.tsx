import { gradients } from "./tokens"

export default function ProgressBar({ percent, color = gradients.gold }: { percent: number; color?: string }) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div style={{ background: "#F0F4FA", borderRadius: "99px", height: "10px", overflow: "hidden" }}>
      <div style={{ width: `${clamped}%`, height: "100%", background: color, borderRadius: "99px", transition: "width 0.3s ease" }} />
    </div>
  )
}
