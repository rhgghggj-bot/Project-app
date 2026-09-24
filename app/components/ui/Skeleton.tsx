import { gradients } from "./tokens"

// Squelettes de chargement : la page garde sa forme pendant que les données arrivent,
// et la transition de navigation se pose sur une structure plutôt que sur un texte.

function Bloc({ w = "100%", h = 14, r = 8, dark = false, style }: { w?: string; h?: number; r?: number; dark?: boolean; style?: React.CSSProperties }) {
  return <div className={dark ? "nx-skel nx-skel-dark" : "nx-skel"} style={{ width: w, height: h, borderRadius: r, ...style }} />
}

function Annonce() {
  return <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Chargement…</span>
}

// Page avec en-tête bleu nuit puis une liste de cartes (finances, projet, événement…)
export function SkeletonPage() {
  return (
    <main aria-busy="true" className="min-h-screen bg-white">
      <Annonce />
      <div style={{ background: gradients.header, padding: "20px 18px 28px" }}>
        <Bloc dark w="70px" h={12} />
        <Bloc dark w="55%" h={24} style={{ marginTop: 14 }} />
        <Bloc dark w="40%" h={12} style={{ marginTop: 10 }} />
      </div>
      <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ border: "0.5px solid #E8F1FF", borderRadius: 16, padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
            <Bloc w="40px" h={40} r={12} />
            <div style={{ flex: 1 }}>
              <Bloc w="60%" />
              <Bloc w="35%" h={11} style={{ marginTop: 8 }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

// Discussion : barre du haut blanche puis bulles de messages
export function SkeletonChat() {
  return (
    <main aria-busy="true" className="bg-white">
      <Annonce />
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #EEF5FF", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Bloc w="60px" h={12} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Bloc w="120px" h={16} />
          <Bloc w="70px" h={10} />
        </div>
        <Bloc w="90px" h={40} r={12} />
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        {["55%", "40%", "65%", "35%"].map((w, i) => (
          <Bloc key={i} w={w} h={38} r={18} style={{ alignSelf: i % 2 ? "flex-end" : "flex-start" }} />
        ))}
      </div>
    </main>
  )
}

// Profil public : avatar, nom, statistiques
export function SkeletonProfil() {
  return (
    <main aria-busy="true" className="min-h-screen bg-white">
      <Annonce />
      <div style={{ background: gradients.header, padding: "28px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <Bloc dark w="72px" h={72} r={36} />
        <Bloc dark w="140px" h={18} />
        <Bloc dark w="90px" h={12} />
      </div>
      <div style={{ padding: "16px 14px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[0, 1, 2].map(i => <Bloc key={i} h={56} r={14} />)}
      </div>
    </main>
  )
}
