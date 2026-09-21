// Design tokens extraits des patterns déjà utilisés dans l'app (couleurs,
// rayons, ombres répétés partout en inline styles). Un seul endroit à changer
// pour ajuster l'identité visuelle ; les composants de app/components/ui/
// s'appuient dessus.
export const colors = {
  blue: "#2B7FFF",
  blueLight: "#EEF5FF",
  blueBorder: "#DCE9FF",
  gold: "#D4A843",
  goldLight: "#FDF3DC",
  goldBorder: "#F0D88A",
  sky: "#87CEEB",
  navy: "#0A1628",
  navyMid: "#1a3a6e",
  green: "#10B981",
  greenLight: "#E1F5EE",
  greenBorder: "#A7F3D0",
  red: "#F43F5E",
  redLight: "#FFE4E6",
  redBorder: "#FECDD3",
  purple: "#8B5CF6",
  text: "#1a1a2e",
  textMuted: "#666",
  textFaint: "#aaa",
  border: "#E8F1FF",
} as const

export const radius = {
  sm: "10px",
  md: "14px",
  lg: "18px",
  pill: "99px",
} as const

export const shadow = {
  card: "0 4px 24px rgba(43,127,255,0.08)",
  menu: "0 8px 30px rgba(0,0,0,0.12)",
} as const

export const gradients = {
  header: `linear-gradient(160deg, ${colors.navy}, ${colors.navyMid})`,
  headerBlue: `linear-gradient(160deg, ${colors.navy}, ${colors.navyMid}, ${colors.blue})`,
  gold: `linear-gradient(90deg, ${colors.gold}, #F97316)`,
  blueCard: `linear-gradient(135deg, ${colors.navyMid}, ${colors.blue})`,
} as const
