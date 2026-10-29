import type { ReactNode } from "react"

// Schémas didactiques du « Projet Graine » : SVG en ligne, sans image ni bibliothèque.
// Palette : texte #1B2B4B, bleu #2B7FFF, orange #E0661B, vert #2E8B57, jaune #C99A06.

const T = "#1B2B4B"
const B = "#2B7FFF"
const O = "#E0661B"
const G = "#2E8B57"
const Y = "#C99A06"
const LB = "#EAF2FF"
const LO = "#FFF0E6"
const LG = "#E6F4EC"
const LY = "#FFF7D6"
const LN = "#F1F3F8"

type Coul = "T" | "B" | "O" | "G"
const COUL: Record<Coul, string> = { T, B, O, G }

function Ar({ x1, y1, x2, y2, c = "T", w = 2, both = false, dash }: {
  x1: number; y1: number; x2: number; y2: number; c?: Coul; w?: number; both?: boolean; dash?: string
}) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={COUL[c]} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash}
      markerEnd={`url(#gr-a-${c})`} markerStart={both ? `url(#gr-a-${c})` : undefined}
    />
  )
}

function Tx({ x, y, children, anchor = "middle", c = T, size, bold = false, rotate }: {
  x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end"; c?: string; size?: number; bold?: boolean; rotate?: number
}) {
  return (
    <text
      x={x} y={y} textAnchor={anchor} fill={c} fontSize={size} fontWeight={bold ? 700 : 400}
      transform={rotate === undefined ? undefined : `rotate(${rotate} ${x} ${y})`}
    >
      {children}
    </text>
  )
}

function Fig({ label, caption, h, children }: { label: string; caption: string; h: number; children: ReactNode }) {
  return (
    <figure
      style={{
        margin: "14px auto", maxWidth: 520, background: "#fff", borderRadius: 12,
        border: "1px solid #D9E0EE", padding: "8px 8px 8px", color: T,
      }}
    >
      <svg viewBox={`0 0 400 ${h}`} width="100%" role="img" aria-label={label} style={{ display: "block", height: "auto" }}>
        <defs>
          {(Object.keys(COUL) as Coul[]).map((k) => (
            <marker key={k} id={`gr-a-${k}`} viewBox="0 0 8 8" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
              <path d="M0,0 L8,4 L0,8 z" fill={COUL[k]} />
            </marker>
          ))}
        </defs>
        <g fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" fontSize={13} fill={T}>{children}</g>
      </svg>
      <figcaption style={{ fontSize: 13, lineHeight: 1.4, color: "#33425F", textAlign: "center", marginTop: 6 }}>{caption}</figcaption>
    </figure>
  )
}

// Points d'une courbe y = f(x) sous forme de chaîne pour <polyline>
function courbe(x0: number, x1: number, pas: number, f: (x: number) => number, fx: (x: number) => number = (x) => x): string {
  const pts: string[] = []
  for (let x = x0; x <= x1 + 1e-9; x += pas) pts.push(`${fx(x).toFixed(1)},${f(x).toFixed(1)}`)
  return pts.join(" ")
}

/* ---------- Chapitre 1 : eau ---------- */
function FiltreEau() {
  const couches: { y: number; h: number; fill: string; nom: string }[] = [
    { y: 80, h: 35, fill: "#D4D4D4", nom: "gravier" },
    { y: 115, h: 35, fill: "#F2D9A0", nom: "sable fin" },
    { y: 150, h: 25, fill: "#3A3A3A", nom: "charbon de bois" },
    { y: 175, h: 20, fill: "#FFFFFF", nom: "coton / tissu" },
  ]
  return (
    <Fig h={285} label="Filtre à eau en couches : eau trouble en haut, puis gravier, sable, charbon de bois et tissu, et enfin eau plus claire dans un verre." caption="Un filtre en couches retient les saletés visibles. L'eau reste à faire bouillir avant de la boire.">
      <rect x={120} y={50} width={140} height={30} fill="#B8935A" opacity={0.75} />
      {couches.map((c) => (
        <g key={c.nom}>
          <rect x={120} y={c.y} width={140} height={c.h} fill={c.fill} stroke="#8892A8" strokeWidth={1} />
          <Tx x={272} y={c.y + c.h / 2 + 4} anchor="start">{c.nom}</Tx>
        </g>
      ))}
      <path d="M120,50 L120,195 L260,195 L260,50" fill="none" stroke={T} strokeWidth={3} />
      <Ar x1={190} y1={14} x2={190} y2={46} c="B" />
      <Tx x={200} y={28} anchor="start">eau trouble</Tx>
      <Ar x1={190} y1={200} x2={190} y2={228} c="B" />
      <path d="M150,230 L150,268 L230,268 L230,230" fill={LB} stroke={T} strokeWidth={3} />
      <rect x={152} y={248} width={76} height={18} fill={B} opacity={0.35} />
      <Tx x={240} y={252} anchor="start">eau plus claire</Tx>
      <Tx x={20} y={102} anchor="start" size={12}>grosses</Tx>
      <Tx x={20} y={117} anchor="start" size={12}>particules</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 2 : feu ---------- */
function TriangleFeu() {
  return (
    <Fig h={285} label="Triangle du feu : il faut un combustible, un comburant (le dioxygène) et de la chaleur ; sans l'un des trois, le feu s'éteint." caption="Retire un seul côté du triangle (chaleur, combustible ou air) et le feu s'éteint.">
      <polygon points="200,40 70,225 330,225" fill={LO} stroke={O} strokeWidth={3} strokeLinejoin="round" />
      <path d="M200,110 C170,145 175,185 200,195 C225,185 232,150 212,128 C210,142 202,142 200,110 Z" fill={O} />
      <path d="M200,150 C188,165 190,185 200,190 C212,184 212,168 200,150 Z" fill="#FFD27A" />
      <Tx x={200} y={28} bold c={O}>Chaleur</Tx>
      <Tx x={70} y={248} bold anchor="middle">Combustible</Tx>
      <Tx x={70} y={266} anchor="middle" size={12}>(bois, paille...)</Tx>
      <Tx x={330} y={248} bold anchor="middle">Comburant</Tx>
      <Tx x={330} y={266} anchor="middle" size={12}>(O₂ de l’air)</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 3 : orientation ---------- */
function Gnomon() {
  return (
    <Fig h={250} label="Gnomon : un bâton vertical de 100 unités projette une ombre de 120 unités ; l'angle entre le rayon du Soleil et le sol est la hauteur du Soleil." caption="Plus le Soleil est haut, plus l'ombre est courte. À midi solaire, elle est la plus courte et pointe vers le nord (hémisphère nord).">
      <circle cx={38} cy={24} r={16} fill="#FFD84D" stroke={Y} strokeWidth={2} />
      <Ar x1={62} y1={15} x2={147} y2={88} c="O" w={2.5} />
      <line x1={150} y1={90} x2={270} y2={190} stroke={O} strokeWidth={2.5} strokeDasharray="6 5" />
      <line x1={20} y1={190} x2={380} y2={190} stroke={T} strokeWidth={2} />
      <rect x={20} y={190} width={360} height={14} fill="#E8DCC8" />
      <line x1={150} y1={190} x2={150} y2={90} stroke="#7A5A2E" strokeWidth={7} strokeLinecap="round" />
      <line x1={152} y1={190} x2={270} y2={190} stroke={T} strokeWidth={6} opacity={0.55} strokeLinecap="round" />
      <path d="M235,190 A35,35 0 0 1 243.1,167.6" fill="none" stroke={B} strokeWidth={2.5} />
      <Tx x={222} y={176} c={B} bold anchor="end">h</Tx>
      <Tx x={132} y={140} anchor="end">gnomon</Tx>
      <Tx x={211} y={224} anchor="middle">ombre</Tx>
      <Tx x={62} y={52} anchor="start">Soleil</Tx>
      <Tx x={290} y={160} anchor="start" size={12}>tan(h) =</Tx>
      <Tx x={290} y={176} anchor="start" size={12}>gnomon / ombre</Tx>
    </Fig>
  )
}

function EtoilePolaire() {
  return (
    <Fig h={290} label="La hauteur de l'étoile Polaire au-dessus de l'horizon est égale à la latitude de l'observateur, ici 47 degrés." caption="Polaris est presque dans l'axe de rotation de la Terre : sa hauteur au-dessus de l'horizon donne la latitude.">
      <circle cx={130} cy={160} r={85} fill={LB} stroke={B} strokeWidth={2.5} />
      <line x1={130} y1={55} x2={130} y2={270} stroke={T} strokeWidth={1.5} strokeDasharray="5 4" />
      <line x1={30} y1={160} x2={235} y2={160} stroke={T} strokeWidth={1.5} strokeDasharray="5 4" />
      <line x1={130} y1={160} x2={188} y2={98} stroke={T} strokeWidth={1.5} />
      <line x1={136.8} y1={50.2} x2={239.2} y2={145.7} stroke={G} strokeWidth={3} />
      <Ar x1={188} y1={98} x2={188} y2={26} c="O" w={2.5} />
      <circle cx={188} cy={98} r={5} fill={O} />
      <path d="M158.8,70.7 A40,40 0 0 1 188,58" fill="none" stroke={O} strokeWidth={2.5} />
      <path d="M160,160 A30,30 0 0 0 150.5,138.1" fill="none" stroke={B} strokeWidth={2.5} />
      <Tx x={196} y={68} anchor="start" c={O} bold>47°</Tx>
      <Tx x={164} y={150} anchor="start" c={B} bold size={12}>47°</Tx>
      <Tx x={198} y={22} anchor="start">vers Polaris</Tx>
      <Tx x={248} y={142} anchor="start" c={G} bold size={12}>horizon</Tx>
      <Tx x={248} y={160} anchor="start" size={12}>(latitude 47°)</Tx>
      <Tx x={92} y={205}>Terre</Tx>
      <Tx x={130} y={285} size={12}>équateur en pointillés, axe des pôles vertical</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 4 : Pythagore ---------- */
function Triangle345() {
  const nHori = [0, 1, 2, 3, 4].map((k) => [60 + 60 * k, 220])
  const nVert = [0, 1, 2, 3].map((k) => [60, 220 - 60 * k])
  const nHyp = [0, 1, 2, 3, 4, 5].map((k) => [300 - 48 * k, 220 - 36 * k])
  return (
    <Fig h={265} label="Triangle rectangle de côtés 3, 4 et 5 longueurs, tracé avec une corde à nœuds régulièrement espacés : 3 au carré plus 4 au carré égale 5 au carré." caption="Une corde à 12 intervalles égaux, pliée en 3 + 4 + 5, donne un angle droit sans équerre.">
      <polygon points="60,220 300,220 60,40" fill={LB} stroke={B} strokeWidth={3} strokeLinejoin="round" />
      <rect x={60} y={200} width={20} height={20} fill="none" stroke={T} strokeWidth={2} />
      {[...nHori, ...nVert, ...nHyp].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={5.5} fill={O} stroke="#fff" strokeWidth={1.5} />
      ))}
      <Tx x={46} y={134} anchor="end" bold>3</Tx>
      <Tx x={180} y={244} bold>4</Tx>
      <Tx x={188} y={119} bold rotate={36.9}>5 (hypoténuse)</Tx>
      <Tx x={215} y={56} anchor="start" bold>3² + 4² = 5²</Tx>
      <Tx x={215} y={76} anchor="start">9 + 16 = 25</Tx>
      <Tx x={215} y={96} anchor="start" size={12} c={O}>● un nœud par longueur</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 5 : levier ---------- */
function Levier() {
  return (
    <Fig h={275} label="Levier : une poutre posée sur un point d'appui. Une charge de 100 newtons à 0,5 mètre de l'appui est équilibrée par une force de 50 newtons à 1 mètre de l'autre côté." caption="À l'équilibre, les moments sont égaux : F₁ × d₁ = F₂ × d₂. Plus le bras est long, moins la force est grande.">
      <polygon points="140,155 118,205 162,205" fill={LN} stroke={T} strokeWidth={2.5} strokeLinejoin="round" />
      <line x1={90} y1={205} x2={190} y2={205} stroke={T} strokeWidth={3} />
      <rect x={40} y={150} width={310} height={9} rx={3} fill="#C9A66B" stroke="#7A5A2E" strokeWidth={1.5} />
      <rect x={42} y={112} width={36} height={38} rx={4} fill="#9AA3B5" stroke={T} strokeWidth={2} />
      <Ar x1={60} y1={60} x2={60} y2={108} c="O" w={3} />
      <Tx x={72} y={72} anchor="start" c={O} bold>F₁ = 100 N</Tx>
      <Ar x1={300} y1={60} x2={300} y2={146} c="O" w={3} />
      <Tx x={288} y={52} anchor="end" c={O} bold>F₂ = 50 N</Tx>
      <Ar x1={60} y1={185} x2={140} y2={185} c="B" both />
      <Tx x={100} y={178} c={B} bold size={12}>d₁ = 0,5 m</Tx>
      <Ar x1={140} y1={228} x2={300} y2={228} c="B" both />
      <Tx x={220} y={222} c={B} bold size={12}>d₂ = 1 m</Tx>
      <Tx x={200} y={196} anchor="start" size={12}>point d’appui</Tx>
      <Tx x={200} y={254}>100 × 0,5 = 50 × 1 = 50 N·m</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 6 : arbre ---------- */
function TrianglesSemblables() {
  return (
    <Fig h={275} label="Triangles semblables : une personne de 1,5 mètre a une ombre de 2 mètres, l'arbre a une ombre de 16 mètres ; sa hauteur est donc de 12 mètres." caption="Au même moment, les rayons du Soleil sont parallèles : les deux triangles ont les mêmes angles, donc les mêmes proportions (dessin pas à l'échelle).">
      <circle cx={376} cy={22} r={13} fill="#FFD84D" stroke={Y} strokeWidth={2} />
      <line x1={170} y1={56} x2={362} y2={200} stroke={O} strokeWidth={2} strokeDasharray="6 5" />
      <line x1={60} y1={164} x2={108} y2={200} stroke={O} strokeWidth={2} strokeDasharray="6 5" />
      <line x1={20} y1={200} x2={385} y2={200} stroke={T} strokeWidth={2} />
      <line x1={170} y1={200} x2={170} y2={80} stroke="#7A5A2E" strokeWidth={7} />
      <circle cx={170} cy={82} r={26} fill="#7FBF8F" stroke={G} strokeWidth={2.5} />
      <line x1={60} y1={200} x2={60} y2={176} stroke={T} strokeWidth={4} strokeLinecap="round" />
      <circle cx={60} cy={168} r={6} fill="#F2C9A0" stroke={T} strokeWidth={2} />
      <line x1={60} y1={200} x2={108} y2={200} stroke={T} strokeWidth={5} opacity={0.55} />
      <line x1={170} y1={200} x2={362} y2={200} stroke={T} strokeWidth={5} opacity={0.55} />
      <Ar x1={122} y1={58} x2={122} y2={198} c="B" both />
      <Tx x={128} y={130} anchor="start" c={B} bold>H = ?</Tx>
      <Tx x={50} y={186} anchor="end" size={12}>1,5 m</Tx>
      <Tx x={84} y={222} size={12}>2 m</Tx>
      <Tx x={266} y={222} size={12}>16 m</Tx>
      <Tx x={200} y={252} bold>H / 16 = 1,5 / 2  donc  H = 12 m</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 7 : chaux ---------- */
function CycleChaux() {
  const noeud = (x: number, y: number, f: string, nom: string, fill: string, stroke: string) => (
    <g>
      <rect x={x} y={y} width={120} height={56} rx={10} fill={fill} stroke={stroke} strokeWidth={2.5} />
      <Tx x={x + 60} y={y + 25} bold size={15}>{f}</Tx>
      <Tx x={x + 60} y={y + 44} size={12}>{nom}</Tx>
    </g>
  )
  return (
    <Fig h={320} label="Cycle de la chaux : le calcaire CaCO₃ chauffé donne la chaux vive CaO et du CO₂ ; avec de l'eau elle donne la chaux éteinte Ca(OH)₂ ; au contact du CO₂ de l'air, elle redevient du calcaire." caption="Le mortier de chaux durcit en reprenant le CO₂ de l'air : il redevient de la pierre.">
      {noeud(25, 25, "CaCO₃", "calcaire", LN, T)}
      {noeud(255, 25, "CaO", "chaux vive", LO, O)}
      {noeud(140, 235, "Ca(OH)₂", "chaux éteinte", LB, B)}
      <Ar x1={149} y1={53} x2={251} y2={53} c="O" w={3} />
      <Tx x={200} y={40} c={O} bold size={12}>chauffer</Tx>
      <Tx x={200} y={76} size={12}>≈ 900 °C</Tx>
      <Tx x={200} y={92} size={12}>+ CO₂ part</Tx>
      <Ar x1={315} y1={86} x2={262} y2={231} c="B" w={3} />
      <Tx x={300} y={160} anchor="start" c={B} bold size={12}>+ eau</Tx>
      <Tx x={300} y={176} anchor="start" size={12}>(ça chauffe !)</Tx>
      <Ar x1={150} y1={231} x2={88} y2={86} c="G" w={3} />
      <Tx x={108} y={160} anchor="end" c={G} bold size={12}>+ CO₂</Tx>
      <Tx x={108} y={176} anchor="end" size={12}>de l’air</Tx>
      <Tx x={108} y={192} anchor="end" size={12}>(lentement)</Tx>
      <Tx x={200} y={150} size={12}>cycle</Tx>
      <Tx x={200} y={166} size={12}>fermé</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 8 : savon ---------- */
function EchellePh() {
  const px = (ph: number) => 20 + ph * (360 / 14)
  const haut: [number, string][] = [[2, "Jus de citron"], [7, "Eau pure"], [12, "Eau de chaux"]]
  const bas: [number, string][] = [[3, "Vinaigre"], [10, "Savon"]]
  return (
    <Fig h={270} label="Échelle du pH de 0 à 14 : acide en dessous de 7, neutre à 7, basique au-dessus. Citron pH 2, vinaigre pH 3, eau pure pH 7, savon pH 10, eau de chaux pH 12." caption="Plus le pH est bas, plus c'est acide ; plus il est haut, plus c'est basique. L'eau pure est neutre (pH 7).">
      <defs>
        <linearGradient id="gr-ph" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#E4372C" />
          <stop offset="0.25" stopColor="#F08A24" />
          <stop offset="0.4" stopColor="#F2C90F" />
          <stop offset="0.5" stopColor="#3CB371" />
          <stop offset="0.65" stopColor="#1FA8B8" />
          <stop offset="0.8" stopColor="#2B7FFF" />
          <stop offset="1" stopColor="#6B3FA0" />
        </linearGradient>
      </defs>
      <rect x={20} y={105} width={360} height={30} rx={6} fill="url(#gr-ph)" stroke={T} strokeWidth={1.5} />
      {Array.from({ length: 15 }, (_, i) => (
        <Tx key={i} x={px(i)} y={153} size={12}>{i}</Tx>
      ))}
      {haut.map(([ph, nom]) => (
        <g key={nom}>
          <line x1={px(ph)} y1={78} x2={px(ph)} y2={105} stroke={T} strokeWidth={1.5} />
          <Tx x={px(ph)} y={68} bold>{nom}</Tx>
        </g>
      ))}
      {bas.map(([ph, nom]) => (
        <g key={nom}>
          <line x1={px(ph)} y1={160} x2={px(ph)} y2={184} stroke={T} strokeWidth={1.5} />
          <Tx x={px(ph)} y={202} bold>{nom}</Tx>
        </g>
      ))}
      <Ar x1={20} y1={238} x2={190} y2={238} c="O" w={2.5} />
      <Tx x={105} y={228} c={O} bold>ACIDE</Tx>
      <Tx x={200} y={256} size={12}>neutre</Tx>
      <Ar x1={210} y1={238} x2={380} y2={238} c="B" w={2.5} />
      <Tx x={295} y={228} c={B} bold>BASIQUE</Tx>
    </Fig>
  )
}

function MoleculeSavon() {
  const angles = Array.from({ length: 12 }, (_, i) => (i * 2 * Math.PI) / 12)
  const cx = 288
  const cy = 130
  return (
    <Fig h={265} label="Molécule de savon avec une tête qui aime l'eau et une queue qui aime la graisse, et micelle : les queues entourent une goutte de graisse, les têtes restent dans l'eau." caption="Les queues s'accrochent à la graisse, les têtes restent dans l'eau : la graisse est emportée au rinçage.">
      <circle cx={42} cy={64} r={13} fill={B} />
      <polyline points="55,64 70,54 85,74 100,54 115,74 130,54 145,64" fill="none" stroke={O} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <Tx x={42} y={96} size={12} bold c={B}>tête</Tx>
      <Tx x={42} y={111} size={12}>aime l’eau</Tx>
      <Tx x={100} y={36} size={12} bold c={O}>queue</Tx>
      <Tx x={100} y={91} size={12}>aime la graisse</Tx>
      <Tx x={16} y={170} anchor="start">Dans l’eau, les queues se</Tx>
      <Tx x={16} y={188} anchor="start">regroupent autour de la</Tx>
      <Tx x={16} y={206} anchor="start">graisse : c’est une micelle.</Tx>
      <circle cx={cx} cy={cy} r={38} fill={LY} stroke={Y} strokeWidth={2} />
      <Tx x={cx} y={cy + 4} size={12} bold>graisse</Tx>
      {angles.map((a, i) => {
        const x1 = cx + 44 * Math.cos(a)
        const y1 = cy + 44 * Math.sin(a)
        const x2 = cx + 80 * Math.cos(a)
        const y2 = cy + 80 * Math.sin(a)
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={O} strokeWidth={3.5} strokeLinecap="round" />
            <circle cx={cx + 90 * Math.cos(a)} cy={cy + 90 * Math.sin(a)} r={8} fill={B} />
          </g>
        )
      })}
      <Tx x={288} y={252} size={12}>eau tout autour</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 9 : fermentation ---------- */
function CroissanceLevure() {
  const X0 = 55
  const X1 = 365
  const Y0 = 215
  const YMAX = 35
  const px = (t: number) => X0 + (t / 8) * (X1 - X0)
  const py = (n: number) => Y0 - (n / 256) * (Y0 - YMAX)
  return (
    <Fig h={285} label="Courbe de croissance exponentielle de levures : leur nombre double chaque heure, de 1 au départ à 256 au bout de 8 heures." caption="Croissance exponentielle : chaque heure, le nombre double (1, 2, 4, 8... 256). La courbe décolle de plus en plus vite.">
      <line x1={X0} y1={Y0} x2={X1 + 10} y2={Y0} stroke={T} strokeWidth={2} />
      <line x1={X0} y1={Y0} x2={X0} y2={YMAX - 10} stroke={T} strokeWidth={2} />
      <polyline points={courbe(0, 8, 0.25, (t) => py(2 ** t), px)} fill="none" stroke={O} strokeWidth={3.5} strokeLinejoin="round" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((t) => (
        <g key={t}>
          <circle cx={px(t)} cy={py(2 ** t)} r={4.5} fill={O} />
          <line x1={px(t)} y1={Y0} x2={px(t)} y2={Y0 + 5} stroke={T} strokeWidth={1.5} />
          <Tx x={px(t)} y={Y0 + 20} size={12}>{t}</Tx>
        </g>
      ))}
      {[[4, "16"], [6, "64"], [8, "256"]].map(([t, n]) => (
        <Tx key={n} x={px(Number(t)) - 8} y={py(2 ** Number(t)) - 8} anchor="end" bold size={12}>{n}</Tx>
      ))}
      <Tx x={(X0 + X1) / 2} y={Y0 + 40}>temps (heures)</Tx>
      <Tx x={X0 - 6} y={22} anchor="start" size={12}>nombre de levures</Tx>
      <Tx x={70} y={60} anchor="start" bold c={O}>N = N₀ × 2ᵗ</Tx>
      <Tx x={70} y={78} anchor="start" size={12}>(N₀ = 1 au départ)</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 10 : lentilles ---------- */
function Lentille() {
  return (
    <Fig h={255} label="Lentille convergente : des rayons parallèles à l'axe optique traversent la lentille et se croisent au foyer image F', situé à la distance focale f de la lentille." caption="Une lentille convergente concentre les rayons parallèles en un point, le foyer. La distance lentille-foyer est la distance focale f.">
      <line x1={15} y1={130} x2={385} y2={130} stroke={T} strokeWidth={1.2} strokeDasharray="6 4" />
      <path d="M200,48 Q238,130 200,212 Q162,130 200,48 Z" fill={LB} stroke={B} strokeWidth={2.5} />
      <Ar x1={20} y1={80} x2={196} y2={80} c="O" w={2.5} />
      <line x1={200} y1={80} x2={300} y2={130} stroke={O} strokeWidth={2.5} />
      <Ar x1={300} y1={130} x2={365} y2={162.5} c="O" w={2.5} />
      <Ar x1={20} y1={180} x2={196} y2={180} c="O" w={2.5} />
      <line x1={200} y1={180} x2={300} y2={130} stroke={O} strokeWidth={2.5} />
      <Ar x1={300} y1={130} x2={365} y2={97.5} c="O" w={2.5} />
      <circle cx={100} cy={130} r={5} fill={T} />
      <circle cx={300} cy={130} r={5} fill={G} />
      <Tx x={100} y={150} bold>F</Tx>
      <Tx x={300} y={150} bold c={G}>F′ (foyer)</Tx>
      <Tx x={200} y={36} bold c={B}>lentille convergente</Tx>
      <Tx x={24} y={68} anchor="start" size={12}>rayons parallèles</Tx>
      <Ar x1={200} y1={228} x2={300} y2={228} c="G" both />
      <Tx x={250} y={246} c={G} bold>f = distance focale</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 11 : métaux ---------- */
function ReductionFer() {
  const Fe = O
  const Ox = B
  const C = T
  const rond = (x: number, y: number, col: string, k: string) => (
    <circle key={k} cx={x} cy={y} r={8} fill={col} stroke="#fff" strokeWidth={1} />
  )
  const rangee = (x0: number, y: number, cols: string[], p: string) => cols.map((c, i) => rond(x0 + 18 * i, y, c, `${p}${i}`))
  return (
    <Fig h={285} label="Réduction de l'oxyde de fer par le carbone : 2 Fe₂O₃ plus 3 C donnent 4 Fe plus 3 CO₂. Les atomes sont les mêmes avant et après : 4 fer, 6 oxygène, 3 carbone." caption="Rien ne se perd : les 13 atomes d'avant se retrouvent après, autrement assemblés. Le carbone prend l'oxygène du fer.">
      <Tx x={65} y={34} bold>Avant</Tx>
      <Tx x={268} y={34} bold>Après</Tx>
      {rangee(28, 70, [Fe, Fe, Ox, Ox, Ox], "a")}
      {rangee(28, 92, [Fe, Fe, Ox, Ox, Ox], "b")}
      <Tx x={124} y={86} anchor="start" size={12}>2 Fe₂O₃</Tx>
      {rangee(28, 130, [C, C, C], "c")}
      <Tx x={124} y={134} anchor="start" size={12}>3 C</Tx>
      <Ar x1={176} y1={100} x2={222} y2={100} c="O" w={3} />
      <Tx x={199} y={88} size={12} c={O} bold>chaleur</Tx>
      {rangee(240, 70, [Fe, Fe, Fe, Fe], "d")}
      <Tx x={318} y={74} anchor="start" size={12}>4 Fe</Tx>
      {rangee(240, 102, [Ox, C, Ox], "e")}
      {rangee(240, 124, [Ox, C, Ox], "f")}
      {rangee(240, 146, [Ox, C, Ox], "g")}
      <Tx x={300} y={128} anchor="start" size={12}>3 CO₂</Tx>
      <Tx x={200} y={192} bold>2 Fe₂O₃ + 3 C → 4 Fe + 3 CO₂</Tx>
      <Tx x={200} y={214}>avant : 4 Fe, 6 O, 3 C</Tx>
      <Tx x={200} y={232}>après : 4 Fe, 6 O, 3 C</Tx>
      <circle cx={92} cy={258} r={7} fill={Fe} />
      <Tx x={104} y={262} anchor="start" size={12}>fer</Tx>
      <circle cx={168} cy={258} r={7} fill={Ox} />
      <Tx x={180} y={262} anchor="start" size={12}>oxygène</Tx>
      <circle cx={262} cy={258} r={7} fill={C} />
      <Tx x={274} y={262} anchor="start" size={12}>carbone</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 12 : pile ---------- */
function PileVolta() {
  const couches: { y: number; nom: string; fill: string }[] = [
    { y: 80, nom: "cuivre", fill: "#E8A56B" },
    { y: 100, nom: "carton salé", fill: "#FFF3C2" },
    { y: 120, nom: "zinc", fill: "#B8C2D4" },
    { y: 140, nom: "cuivre", fill: "#E8A56B" },
    { y: 160, nom: "carton salé", fill: "#FFF3C2" },
    { y: 180, nom: "zinc", fill: "#B8C2D4" },
  ]
  return (
    <Fig h={250} label="Pile de Volta : deux empilements zinc, carton imbibé d'eau salée, cuivre. Le cuivre du haut est la borne plus, le zinc du bas la borne moins ; le courant sort du plus, traverse l'ampoule et revient au moins." caption="Le courant (sens conventionnel) sort de la borne + (cuivre), traverse l'ampoule et revient à la borne − (zinc).">
      {couches.map((c) => (
        <g key={c.y}>
          <rect x={120} y={c.y} width={100} height={20} fill={c.fill} stroke={T} strokeWidth={1.5} />
          <Tx x={112} y={c.y + 15} anchor="end" size={12}>{c.nom}</Tx>
        </g>
      ))}
      <polyline points="220,90 330,90 330,118" fill="none" stroke={T} strokeWidth={2.5} />
      <polyline points="330,162 330,190 220,190" fill="none" stroke={T} strokeWidth={2.5} />
      <circle cx={330} cy={140} r={22} fill="#FFF3C2" stroke={Y} strokeWidth={2.5} />
      <path d="M318,152 Q330,118 342,152" fill="none" stroke={T} strokeWidth={2} />
      <Ar x1={250} y1={90} x2={290} y2={90} c="O" w={3} />
      <Ar x1={300} y1={190} x2={260} y2={190} c="O" w={3} />
      <Tx x={270} y={74} c={O} bold size={12}>courant</Tx>
      <Tx x={230} y={74} c={O} bold anchor="end">+</Tx>
      <Tx x={230} y={207} c={B} bold anchor="end">−</Tx>
      <Tx x={360} y={144} anchor="start" size={12}>LED</Tx>
      <Tx x={200} y={232} size={12}>les électrons circulent dans le sens inverse</Tx>
      <Tx x={170} y={30} bold>2 empilements zinc / carton / cuivre</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 13 : induction ---------- */
function Induction() {
  return (
    <Fig h={290} label="Induction : un aimant qu'on approche d'une bobine fait apparaître un courant dans le circuit, mesuré par un galvanomètre. Sans mouvement, il n'y a pas de courant." caption="Un aimant qui bouge devant une bobine y crée un courant. Aimant immobile : pas de courant. Plus vite ou plus de spires : plus de courant.">
      <rect x={30} y={100} width={50} height={32} fill={B} stroke={T} strokeWidth={2} />
      <rect x={80} y={100} width={50} height={32} fill={O} stroke={T} strokeWidth={2} />
      <Tx x={55} y={122} c="#fff" bold>S</Tx>
      <Tx x={105} y={122} c="#fff" bold>N</Tx>
      <Ar x1={50} y1={80} x2={140} y2={80} c="G" w={3} />
      <Tx x={95} y={64} c={G} bold size={12}>on approche l’aimant</Tx>
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse key={i} cx={215 + 18 * i} cy={116} rx={10} ry={30} fill="none" stroke="#B87333" strokeWidth={4} />
      ))}
      <Tx x={251} y={170} size={12}>bobine</Tx>
      <polyline points="215,146 215,225 225,225" fill="none" stroke={T} strokeWidth={2.5} />
      <polyline points="287,146 287,225 265,225" fill="none" stroke={T} strokeWidth={2.5} />
      <circle cx={245} cy={225} r={20} fill={LY} stroke={Y} strokeWidth={2.5} />
      <line x1={245} y1={238} x2={256} y2={218} stroke={T} strokeWidth={2.5} strokeLinecap="round" />
      <Tx x={245} y={208} bold size={12}>G</Tx>
      <Tx x={310} y={222} anchor="start" size={12}>courant</Tx>
      <Tx x={310} y={238} anchor="start" size={12}>induit</Tx>
      <Ar x1={287} y1={165} x2={287} y2={200} c="O" w={2.5} />
      <Tx x={200} y={278} size={12}>le courant existe seulement pendant le mouvement</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 14 : machines ---------- */
function Piston() {
  const pts: [number, number][] = [[160, 140], [190, 155], [225, 142], [250, 160], [175, 180], [215, 188], [150, 200], [245, 205]]
  return (
    <Fig h={285} label="Piston dans un cylindre : la vapeur sous pression pousse sur la surface du piston avec une force égale à la pression multipliée par la surface." caption="La vapeur pousse partout avec la même pression. Sur un piston, la force utile vaut F = P × S.">
      <path d="M130,70 L130,230 L270,230 L270,70" fill="none" stroke={T} strokeWidth={4} />
      <rect x={133} y={112} width={134} height={14} fill="#B8C2D4" stroke={T} strokeWidth={2} />
      <rect x={193} y={52} width={14} height={60} fill="#B8C2D4" stroke={T} strokeWidth={2} />
      <rect x={133} y={126} width={134} height={101} fill={LB} opacity={0.8} />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill={B} />
      ))}
      <Ar x1={170} y1={160} x2={170} y2={132} c="O" w={2.5} />
      <Ar x1={230} y1={160} x2={230} y2={132} c="O" w={2.5} />
      <Ar x1={145} y1={180} x2={136} y2={180} c="O" w={2.5} />
      <Ar x1={255} y1={180} x2={264} y2={180} c="O" w={2.5} />
      <Ar x1={200} y1={48} x2={200} y2={12} c="G" w={3.5} />
      <Tx x={212} y={26} anchor="start" c={G} bold>F</Tx>
      <Tx x={20} y={170} anchor="start" bold c={B}>vapeur</Tx>
      <Tx x={20} y={188} anchor="start" size={12}>pression P</Tx>
      <Tx x={20} y={118} anchor="start" size={12}>piston</Tx>
      <Tx x={20} y={134} anchor="start" size={12}>surface S</Tx>
      <Tx x={290} y={86} anchor="start" bold>F = P × S</Tx>
      <Tx x={200} y={262} size={12}>200 000 Pa × 0,05 m² = 10 000 N</Tx>
    </Fig>
  )
}

function MachineThermique() {
  return (
    <Fig h={290} label="Machine thermique : elle reçoit une chaleur Q de la source chaude, fournit un travail W et rejette le reste de la chaleur vers la source froide. Exemple : 50 kJ reçus, 8 kJ de travail, 42 kJ perdus." caption="Une machine thermique ne transforme qu'une partie de la chaleur en travail. Le reste est rejeté vers la source froide.">
      <rect x={110} y={14} width={180} height={48} rx={8} fill={LO} stroke={O} strokeWidth={2.5} />
      <Tx x={200} y={35} bold c={O}>Source chaude</Tx>
      <Tx x={200} y={52} size={12}>température T_c (K)</Tx>
      <rect x={110} y={228} width={180} height={48} rx={8} fill={LB} stroke={B} strokeWidth={2.5} />
      <Tx x={200} y={249} bold c={B}>Source froide</Tx>
      <Tx x={200} y={266} size={12}>température T_f (K)</Tx>
      <circle cx={200} cy={145} r={40} fill={LN} stroke={T} strokeWidth={2.5} />
      <Tx x={200} y={150} bold>machine</Tx>
      <Ar x1={200} y1={64} x2={200} y2={102} c="O" w={4} />
      <Tx x={212} y={88} anchor="start" size={12} c={O} bold>Q_c = 50 kJ</Tx>
      <Ar x1={200} y1={188} x2={200} y2={226} c="B" w={2.5} />
      <Tx x={212} y={212} anchor="start" size={12} c={B} bold>Q_f = 42 kJ perdus</Tx>
      <Ar x1={242} y1={145} x2={330} y2={145} c="G" w={3.5} />
      <Tx x={288} y={132} size={12} c={G} bold>W = 8 kJ</Tx>
      <Tx x={288} y={168} size={12}>travail utile</Tx>
      <Tx x={14} y={138} anchor="start" bold>η = W / Q_c</Tx>
      <Tx x={14} y={158} anchor="start" size={12}>= 8 / 50 = 16 %</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 16 : radio ---------- */
function Onde() {
  const y = (x: number) => 125 - 50 * Math.sin((2 * Math.PI * (x - 20)) / 120)
  return (
    <Fig h={235} label="Onde sinusoïdale avec sa longueur d'onde lambda, distance entre deux crêtes, et son amplitude A, hauteur d'une crête par rapport à l'axe." caption="La longueur d'onde λ est la distance entre deux crêtes. La fréquence f est le nombre de crêtes qui passent chaque seconde. On a c = λ × f.">
      <line x1={15} y1={125} x2={385} y2={125} stroke={T} strokeWidth={1.2} strokeDasharray="6 4" />
      <polyline points={courbe(20, 380, 4, y)} fill="none" stroke={B} strokeWidth={3.5} strokeLinejoin="round" />
      <line x1={50} y1={75} x2={50} y2={52} stroke={T} strokeWidth={1.2} strokeDasharray="4 3" />
      <line x1={170} y1={75} x2={170} y2={52} stroke={T} strokeWidth={1.2} strokeDasharray="4 3" />
      <Ar x1={52} y1={58} x2={168} y2={58} c="O" both w={2.5} />
      <Tx x={110} y={44} c={O} bold>λ (longueur d’onde)</Tx>
      <Ar x1={290} y1={125} x2={290} y2={78} c="G" both w={2.5} />
      <Tx x={298} y={106} anchor="start" c={G} bold>A</Tx>
      <Tx x={298} y={122} anchor="start" size={12}>amplitude</Tx>
      <Tx x={110} y={196} size={12}>creux</Tx>
      <Tx x={170} y={96} size={12}>crête</Tx>
      <Tx x={200} y={222} bold>c = λ × f</Tx>
      <Ar x1={330} y1={192} x2={378} y2={192} c="T" w={2} />
      <Tx x={330} y={186} anchor="end" size={12}>propagation</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 17 : statistiques ---------- */
function HistogrammeRecoltes() {
  const val = [38, 46, 50, 54, 62]
  const nom = ["Champ A", "Champ B", "Champ C", "Champ D", "Champ E"]
  const py = (v: number) => 215 - v * 2.8
  return (
    <Fig h={270} label="Diagramme en barres des récoltes de cinq champs : 38, 46, 50, 54 et 62 kilos. La moyenne est 50 kilos, avec une bande d'un écart-type de 8 kilos de chaque côté." caption="La moyenne (ligne orange) résume la récolte ; l'écart-type (bande jaune) dit si les champs se ressemblent ou non.">
      <rect x={30} y={py(58)} width={350} height={py(42) - py(58)} fill={LY} stroke={Y} strokeWidth={1} strokeDasharray="5 4" />
      {val.map((v, i) => (
        <g key={i}>
          <rect x={48 + 68 * i} y={py(v)} width={44} height={v * 2.8} fill={B} opacity={0.85} />
          <Tx x={70 + 68 * i} y={py(v) + 16} bold size={12} c="#fff">{v}</Tx>
          <Tx x={70 + 68 * i} y={234} size={12}>{nom[i]}</Tx>
        </g>
      ))}
      <line x1={30} y1={215} x2={385} y2={215} stroke={T} strokeWidth={2} />
      <line x1={30} y1={py(50)} x2={385} y2={py(50)} stroke={O} strokeWidth={3} />
      <Tx x={14} y={18} anchor="start" c={O} bold size={12}>── moyenne = 50 kg</Tx>
      <Tx x={14} y={34} anchor="start" c={Y} bold size={12}>▒ ± 1 écart-type (8 kg) · valeurs en kg</Tx>
      <Tx x={200} y={258} size={12}>moyenne = (38 + 46 + 50 + 54 + 62) / 5</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 18 : génétique ---------- */
function CarrePunnett() {
  const cell = (x: number, y: number, g: string, rond: boolean) => (
    <g key={`${x}${y}`}>
      <rect x={x} y={y} width={90} height={64} fill={rond ? LG : LY} stroke={T} strokeWidth={2} />
      <circle cx={x + 45} cy={y + 20} r={rond ? 11 : 9} fill={rond ? "#7FBF8F" : "#E0C24A"} stroke={rond ? G : Y} strokeWidth={2} strokeDasharray={rond ? undefined : "3 2"} />
      <Tx x={x + 45} y={y + 53} bold size={15}>{g}</Tx>
    </g>
  )
  return (
    <Fig h={290} label="Carré de Punnett du croisement de deux pois Rr : un quart RR rond, deux quarts Rr ronds, un quart rr ridé, soit trois ronds pour un ridé." caption="Chaque parent Rr donne R ou r avec une chance sur deux. Résultat : 3/4 de pois ronds et 1/4 de pois ridés.">
      <Tx x={215} y={26} bold>Parent 2 : Rr</Tx>
      <Tx x={175} y={56} bold c={G}>R</Tx>
      <Tx x={265} y={56} bold c={Y}>r</Tx>
      <Tx x={20} y={130} anchor="start" bold>Parent 1</Tx>
      <Tx x={20} y={148} anchor="start" bold>: Rr</Tx>
      <Tx x={118} y={118} bold anchor="end" c={G}>R</Tx>
      <Tx x={118} y={182} bold anchor="end" c={Y}>r</Tx>
      {cell(130, 68, "RR", true)}
      {cell(220, 68, "Rr", true)}
      {cell(130, 132, "Rr", true)}
      {cell(220, 132, "rr", false)}
      <circle cx={80} cy={236} r={8} fill="#7FBF8F" stroke={G} strokeWidth={2} />
      <Tx x={95} y={240} anchor="start" size={12}>rond (RR ou Rr) : 3 sur 4</Tx>
      <circle cx={80} cy={262} r={7} fill="#E0C24A" stroke={Y} strokeWidth={2} />
      <Tx x={95} y={266} anchor="start" size={12}>ridé (rr) : 1 sur 4</Tx>
      <Tx x={290} y={240} anchor="start" size={12}>R : dominant</Tx>
      <Tx x={290} y={266} anchor="start" size={12}>r : récessif</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 19 : cartographie ---------- */
function Triangulation() {
  return (
    <Fig h={265} label="Triangulation : depuis deux points A et B distants de 100 mètres, on mesure deux angles de 45 degrés vers un arbre P de l'autre côté d'une rivière. Le triangle donne sa distance sans traverser." caption="Avec une base AB connue et deux angles mesurés, on construit le triangle et on en déduit la distance, sans traverser la rivière.">
      <rect x={0} y={108} width={400} height={44} fill="#D6E8FF" />
      <Tx x={12} y={134} anchor="start" size={12} c={B} bold>rivière</Tx>
      <polygon points="60,200 340,200 200,60" fill="none" stroke={T} strokeWidth={2.5} strokeLinejoin="round" />
      <line x1={200} y1={60} x2={200} y2={200} stroke={O} strokeWidth={2.5} strokeDasharray="6 5" />
      <circle cx={60} cy={200} r={5} fill={T} />
      <circle cx={340} cy={200} r={5} fill={T} />
      <circle cx={200} cy={52} r={10} fill="#7FBF8F" stroke={G} strokeWidth={2.5} />
      <path d="M95,200 A35,35 0 0 0 84.7,175.3" fill="none" stroke={B} strokeWidth={2.5} />
      <path d="M305,200 A35,35 0 0 1 315.3,175.3" fill="none" stroke={B} strokeWidth={2.5} />
      <Tx x={104} y={188} anchor="start" c={B} bold size={12}>α = 45°</Tx>
      <Tx x={296} y={188} anchor="end" c={B} bold size={12}>β = 45°</Tx>
      <Tx x={50} y={220} anchor="end" bold>A</Tx>
      <Tx x={350} y={220} anchor="start" bold>B</Tx>
      <Tx x={224} y={50} anchor="start" bold>P (arbre)</Tx>
      <Tx x={208} y={172} anchor="start" c={O} bold>h = ?</Tx>
      <Ar x1={62} y1={236} x2={338} y2={236} c="T" both w={1.5} />
      <Tx x={200} y={254} size={12}>base AB = 100 m (mesurée)</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 20 : économie ---------- */
function OffreDemande() {
  return (
    <Fig h={280} label="Offre et demande : la courbe de demande descend, la courbe d'offre monte ; elles se croisent au prix d'équilibre de 4 pièces pour 120 unités." caption="Au prix d'équilibre (4 pièces), la quantité que les gens veulent acheter est égale à celle que les producteurs veulent vendre : 120.">
      <line x1={50} y1={220} x2={385} y2={220} stroke={T} strokeWidth={2} />
      <line x1={50} y1={220} x2={50} y2={22} stroke={T} strokeWidth={2} />
      <line x1={50} y1={30} x2={370} y2={220} stroke={B} strokeWidth={3.5} />
      <line x1={114} y1={220} x2={370} y2={68} stroke={O} strokeWidth={3.5} />
      <line x1={50} y1={144} x2={242} y2={144} stroke={T} strokeWidth={1.2} strokeDasharray="5 4" />
      <line x1={242} y1={144} x2={242} y2={220} stroke={T} strokeWidth={1.2} strokeDasharray="5 4" />
      <circle cx={242} cy={144} r={6} fill={G} stroke="#fff" strokeWidth={2} />
      <Tx x={104} y={52} anchor="start" c={B} bold>Demande</Tx>
      <Tx x={290} y={152} anchor="start" c={O} bold>Offre</Tx>
      <Tx x={44} y={148} anchor="end" size={12} bold>4</Tx>
      <Tx x={242} y={238} size={12} bold>120</Tx>
      <Tx x={228} y={132} anchor="end" c={G} bold>équilibre</Tx>
      <Tx x={62} y={16} anchor="start" size={12}>prix (pièces)</Tx>
      <Tx x={385} y={238} anchor="end" size={12}>quantité</Tx>
      <Tx x={200} y={268} size={12}>Prix trop haut : surplus. Prix trop bas : pénurie.</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 21 : énergie hydraulique ---------- */
function MoulinEau() {
  const aubes = Array.from({ length: 8 }, (_, i) => (i * 45 * Math.PI) / 180)
  const cx = 250
  const cy = 162
  return (
    <Fig h={265} label="Roue à aubes : l'eau d'un réservoir situé à la hauteur h au-dessus de la roue tombe sur les aubes et les fait tourner. Son énergie potentielle vaut m fois g fois h." caption="Plus l'eau tombe de haut, plus elle libère d'énergie : E = m × g × h. Divisée par le temps, c'est la puissance.">
      <rect x={20} y={80} width={110} height={125} fill="#E8DCC8" stroke="#7A5A2E" strokeWidth={2} />
      <rect x={20} y={60} width={110} height={20} fill={B} opacity={0.6} />
      <Tx x={75} y={50} size={12} bold>réservoir</Tx>
      <path d="M130,64 Q200,64 222,116" fill="none" stroke={B} strokeWidth={4} markerEnd="url(#gr-a-B)" />
      <line x1={20} y1={205} x2={385} y2={205} stroke={T} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={42} fill="none" stroke="#7A5A2E" strokeWidth={4} />
      {aubes.map((a, i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={cx + 42 * Math.cos(a)} y2={cy + 42 * Math.sin(a)} stroke="#7A5A2E" strokeWidth={3} />
          <line x1={cx + 42 * Math.cos(a) - 7 * Math.sin(a)} y1={cy + 42 * Math.sin(a) + 7 * Math.cos(a)} x2={cx + 42 * Math.cos(a) + 7 * Math.sin(a)} y2={cy + 42 * Math.sin(a) - 7 * Math.cos(a)} stroke="#7A5A2E" strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
      <circle cx={cx} cy={cy} r={5} fill={T} />
      <Tx x={cx} y={228} size={12}>roue à aubes</Tx>
      <line x1={130} y1={62} x2={165} y2={62} stroke={T} strokeWidth={1} strokeDasharray="4 3" />
      <line x1={130} y1={205} x2={165} y2={205} stroke={T} strokeWidth={1} strokeDasharray="4 3" />
      <Ar x1={158} y1={64} x2={158} y2={203} c="G" both w={2.5} />
      <Tx x={150} y={140} anchor="end" c={G} bold>h</Tx>
      <Tx x={312} y={52} anchor="start" bold>E = m × g × h</Tx>
      <Tx x={312} y={72} anchor="start" size={12}>P = E / t</Tx>
      <Tx x={312} y={92} anchor="start" size={12}>(en watts)</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 22 : lunette ---------- */
function Lunette() {
  return (
    <Fig h={245} label="Lunette astronomique : une grande lentille objectif de grande distance focale recueille la lumière, une petite lentille oculaire de petite distance focale la reprend ; le grossissement vaut le rapport des deux distances focales." caption="La grande lentille recueille beaucoup de lumière ; la petite agrandit l'image. Grossissement G = f objectif / f oculaire.">
      <Tx x={200} y={24} bold>G = f objectif / f oculaire</Tx>
      <line x1={5} y1={110} x2={395} y2={110} stroke={T} strokeWidth={1.2} strokeDasharray="6 4" />
      <path d="M50,45 Q80,110 50,175 Q20,110 50,45 Z" fill={LB} stroke={B} strokeWidth={2.5} />
      <path d="M300,85 Q318,110 300,135 Q282,110 300,85 Z" fill={LB} stroke={B} strokeWidth={2.5} />
      <Ar x1={5} y1={80} x2={48} y2={80} c="O" w={2.5} />
      <line x1={50} y1={80} x2={250} y2={110} stroke={O} strokeWidth={2.5} />
      <line x1={250} y1={110} x2={300} y2={117.5} stroke={O} strokeWidth={2.5} />
      <Ar x1={300} y1={117.5} x2={385} y2={117.5} c="O" w={2.5} />
      <Ar x1={5} y1={140} x2={48} y2={140} c="O" w={2.5} />
      <line x1={50} y1={140} x2={250} y2={110} stroke={O} strokeWidth={2.5} />
      <line x1={250} y1={110} x2={300} y2={102.5} stroke={O} strokeWidth={2.5} />
      <Ar x1={300} y1={102.5} x2={385} y2={102.5} c="O" w={2.5} />
      <circle cx={250} cy={110} r={5} fill={G} />
      <Tx x={250} y={96} size={12} bold c={G}>foyer commun</Tx>
      <Tx x={50} y={198} bold size={12}>objectif</Tx>
      <Tx x={300} y={160} bold size={12}>oculaire</Tx>
      <Ar x1={52} y1={214} x2={248} y2={214} c="G" both w={1.8} />
      <Tx x={150} y={234} size={12}>f objectif (grande)</Tx>
      <Ar x1={252} y1={214} x2={298} y2={214} c="B" both w={1.8} />
      <Tx x={345} y={234} size={12}>f oculaire (petite)</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 23 : azote ---------- */
function CycleAzote() {
  return (
    <Fig h={320} label="Cycle de l'azote : l'azote de l'air est fixé dans le sol par des bactéries, les plantes l'absorbent sous forme de nitrates, les animaux mangent les plantes, la décomposition rend l'azote au sol, et d'autres bactéries en renvoient une partie dans l'air." caption="L'azote circule en boucle entre l'air, le sol, les plantes et les animaux, grâce à des bactéries. Une récolte emporte de l'azote hors du champ.">
      <rect x={140} y={14} width={120} height={50} rx={10} fill={LB} stroke={B} strokeWidth={2.5} />
      <Tx x={200} y={35} bold>Azote de l’air</Tx>
      <Tx x={200} y={53} size={12}>N₂ (78 % de l’air)</Tx>
      <rect x={15} y={225} width={130} height={72} rx={10} fill="#E8DCC8" stroke="#7A5A2E" strokeWidth={2.5} />
      <Tx x={80} y={250} bold>Sol</Tx>
      <Tx x={80} y={268} size={12}>nitrates, ammonium</Tx>
      <rect x={255} y={225} width={130} height={72} rx={10} fill={LG} stroke={G} strokeWidth={2.5} />
      <Tx x={320} y={250} bold>Plantes</Tx>
      <Tx x={320} y={268} size={12}>puis animaux</Tx>
      <Ar x1={170} y1={66} x2={80} y2={221} c="G" w={3} />
      <Tx x={112} y={118} anchor="end" bold c={G} size={12}>fixation</Tx>
      <Tx x={112} y={134} anchor="end" size={12}>(légumineuses,</Tx>
      <Tx x={112} y={150} anchor="end" size={12}>éclairs)</Tx>
      <Ar x1={135} y1={221} x2={195} y2={68} c="O" w={3} />
      <Tx x={180} y={118} anchor="start" bold c={O} size={12}>dénitrification</Tx>
      <Tx x={180} y={134} anchor="start" size={12}>(bactéries du sol)</Tx>
      <Ar x1={148} y1={246} x2={252} y2={246} c="B" w={3} />
      <Tx x={200} y={238} size={12} bold c={B}>absorption</Tx>
      <Ar x1={252} y1={276} x2={148} y2={276} c="T" w={3} />
      <Tx x={200} y={294} size={12} bold>décomposition</Tx>
    </Fig>
  )
}

/* ---------- Chapitre 24 : binaire ---------- */
function Binaire() {
  const poids = [128, 64, 32, 16, 8, 4, 2, 1]
  const bits = [0, 1, 0, 0, 0, 0, 0, 1]
  return (
    <Fig h={215} label="Codage binaire de la lettre A : le nombre 65 s'écrit 01000001 en binaire, car 65 égale 64 plus 1." caption="En binaire, chaque case vaut deux fois la précédente et ne contient que 0 ou 1. La lettre A est codée par le nombre 65.">
      <Tx x={200} y={28} bold>la lettre « A » a pour code 65</Tx>
      <Tx x={14} y={58} anchor="start" size={12}>valeur de la case :</Tx>
      {poids.map((p, i) => (
        <g key={p}>
          <Tx x={40 + 44 * i} y={86} size={12} bold>{p}</Tx>
          <rect x={20 + 44 * i} y={96} width={40} height={44} rx={5} fill={bits[i] ? LG : LN} stroke={bits[i] ? G : "#8892A8"} strokeWidth={bits[i] ? 3 : 1.5} />
          <Tx x={40 + 44 * i} y={125} bold size={20} c={bits[i] ? G : T}>{bits[i]}</Tx>
        </g>
      ))}
      <Tx x={200} y={170} bold>64 + 1 = 65</Tx>
      <Tx x={200} y={192} size={12}>seules les cases à 1 comptent : 01000001</Tx>
    </Fig>
  )
}

const SCHEMAS: Record<string, () => ReactNode> = {
  "filtre-eau": FiltreEau,
  "triangle-feu": TriangleFeu,
  gnomon: Gnomon,
  "etoile-polaire": EtoilePolaire,
  "triangle-345": Triangle345,
  levier: Levier,
  "triangles-semblables": TrianglesSemblables,
  "cycle-chaux": CycleChaux,
  "echelle-ph": EchellePh,
  "molecule-savon": MoleculeSavon,
  "croissance-levure": CroissanceLevure,
  lentille: Lentille,
  "reduction-fer": ReductionFer,
  "pile-volta": PileVolta,
  induction: Induction,
  piston: Piston,
  "machine-thermique": MachineThermique,
  onde: Onde,
  "histogramme-recoltes": HistogrammeRecoltes,
  "carre-punnett": CarrePunnett,
  triangulation: Triangulation,
  "offre-demande": OffreDemande,
  "moulin-eau": MoulinEau,
  lunette: Lunette,
  "cycle-azote": CycleAzote,
  binaire: Binaire,
}

export const IDS_SCHEMAS = Object.keys(SCHEMAS)

export default function SchemaGraine({ id }: { id: string }) {
  const Schema = SCHEMAS[id]
  return Schema ? <Schema /> : null
}
