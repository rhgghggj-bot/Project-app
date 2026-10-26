// Calculatrice : lecture d'une expression (sans eval) et mise en forme du
// résultat. Accepte × ÷ −, la virgule décimale, les parenthèses, ^ et ²,
// %, √, sin/cos/tan (en degrés ou en radians), log, ln, π et e. La
// multiplication peut être sous-entendue : 2π, 3(4+1), 2√9.

type Jeton = { t: "n"; v: number } | { t: "op"; v: string } | { t: "f"; v: string } | { t: "c"; v: number }

const FONCTIONS = ["asin", "acos", "atan", "sin", "cos", "tan", "sqrt", "log", "ln", "abs"]

function decouper(texte: string): Jeton[] {
  const s = texte.replace(/\s+/g, "").replace(/×|\*/g, "*").replace(/÷|:/g, "/").replace(/−|–/g, "-").replace(/,/g, ".")
  const jetons: Jeton[] = []
  let i = 0
  while (i < s.length) {
    const reste = s.slice(i)
    const nombre = /^(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/.exec(reste)
    if (nombre) { jetons.push({ t: "n", v: Number(nombre[0]) }); i += nombre[0].length; continue }
    const f = FONCTIONS.find(x => reste.startsWith(x))
    if (f) { jetons.push({ t: "f", v: f }); i += f.length; continue }
    if (reste.startsWith("√")) { jetons.push({ t: "f", v: "sqrt" }); i++; continue }
    if (reste.startsWith("π") || reste.startsWith("pi")) { jetons.push({ t: "c", v: Math.PI }); i += reste.startsWith("π") ? 1 : 2; continue }
    if (reste[0] === "e") { jetons.push({ t: "c", v: Math.E }); i++; continue }
    if ("+-*/^()²%".includes(reste[0])) { jetons.push({ t: "op", v: reste[0] }); i++; continue }
    throw new Error("Caractère inconnu")
  }
  return jetons
}

export function calculer(texte: string, degres = true): number {
  const j = decouper(texte)
  if (!j.length) throw new Error("Vide")
  let k = 0
  const voir = () => j[k]
  const estOp = (v: string) => voir()?.t === "op" && voir()!.v === v
  const angle = (x: number) => (degres ? (x * Math.PI) / 180 : x)
  const versAngle = (x: number) => (degres ? (x * 180) / Math.PI : x)
  // Petites erreurs d'arrondi (sin 180° = 1,2e-16) : on les efface
  const net = (x: number) => (Math.abs(x) < 1e-12 ? 0 : x)

  function somme(): number {
    let v = produit()
    while (estOp("+") || estOp("-")) { const o = j[k++].v; const w = produit(); v = o === "+" ? v + w : v - w }
    return v
  }
  function produit(): number {
    let v = signe()
    for (;;) {
      if (estOp("*") || estOp("/")) { const o = j[k++].v; const w = signe(); v = o === "*" ? v * w : v / w; continue }
      const x = voir()
      // Multiplication sous-entendue : 2π, 3(4), 2√9, (1+2)(3)
      if (x && (x.t === "n" || x.t === "c" || x.t === "f" || (x.t === "op" && x.v === "("))) { v *= puissance(); continue }
      return v
    }
  }
  function signe(): number {
    if (estOp("-")) { k++; return -signe() }
    if (estOp("+")) { k++; return signe() }
    return puissance()
  }
  function puissance(): number {
    const base = suffixe()
    if (estOp("^")) { k++; return Math.pow(base, signe()) }
    return base
  }
  function suffixe(): number {
    let v = primaire()
    for (;;) {
      if (estOp("²")) { k++; v = v * v } else if (estOp("%")) { k++; v = v / 100 } else return v
    }
  }
  function primaire(): number {
    const x = j[k++]
    if (!x) throw new Error("Incomplet")
    if (x.t === "n" || x.t === "c") return x.v
    if (x.t === "op" && x.v === "(") {
      const v = somme()
      if (estOp(")")) k++   // parenthèse fermante oubliée en fin d'expression : tolérée
      else if (k < j.length) throw new Error("Parenthèse")
      return v
    }
    if (x.t === "f") {
      const a = suffixe()
      switch (x.v) {
        case "sin": return net(Math.sin(angle(a)))
        case "cos": return net(Math.cos(angle(a)))
        case "tan": return net(Math.tan(angle(a)))
        case "asin": return versAngle(Math.asin(a))
        case "acos": return versAngle(Math.acos(a))
        case "atan": return versAngle(Math.atan(a))
        case "sqrt": return Math.sqrt(a)
        case "log": return Math.log10(a)
        case "ln": return Math.log(a)
        case "abs": return Math.abs(a)
      }
    }
    throw new Error("Expression")
  }

  const v = somme()
  if (k < j.length) throw new Error("Expression")
  return v
}

// Résultat à afficher (et à réutiliser dans une nouvelle expression)
export function ecrireNombre(n: number): string {
  if (!isFinite(n)) return "Erreur"
  if (n === 0) return "0"
  const a = Math.abs(n)
  if (a >= 1e15 || a < 1e-9) return n.toExponential(8).replace(/\.?0+e/, "e").replace("e", "E").replace("E+", "E").replace(".", ",")
  return String(Number(n.toPrecision(12))).replace(".", ",")
}

// ─── Calculatrice partagée par toute l'appli ───
// N'importe quelle page l'ouvre ; si elle donne « utiliser », un bouton
// renvoie le résultat dans son champ (réponse d'un défi, estimation…).
type EtatCalc = { ouverte: boolean; utiliser: ((n: number) => void) | null }
let etatCalc: EtatCalc = { ouverte: false, utiliser: null }
const abonnesCalc = new Set<() => void>()
const changerCalc = (e: EtatCalc) => { etatCalc = e; abonnesCalc.forEach(f => f()) }
export const ouvrirCalculatrice = (utiliser?: (n: number) => void) => changerCalc({ ouverte: true, utiliser: utiliser ?? null })
export const fermerCalculatrice = () => changerCalc({ ouverte: false, utiliser: null })
export const abonnerCalculatrice = (f: () => void) => { abonnesCalc.add(f); return () => { abonnesCalc.delete(f) } }
export const lireCalculatrice = () => etatCalc
