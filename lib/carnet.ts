// Carnet de l'espace étudiant : outils partagés par la liste et l'éditeur.
//
// Le contenu d'une note est du HTML écrit dans un éditeur contentEditable.
// Avant chaque enregistrement et chaque affichage, il passe par une liste
// blanche de balises : rien d'autre (scripts, styles, liens, iframes…) ne
// peut entrer dans la base ni s'afficher, même collé depuis une page web.

export type Dossier = { id: string; nom: string }

export type NoteCarnet = {
  id: string
  dossier_id: string | null
  titre: string
  contenu: string
  texte: string
  epingle: boolean
  chapitre_id: string | null
  created_at: string
  updated_at: string
}

export const COLONNES_NOTE = "id,dossier_id,titre,contenu,texte,epingle,chapitre_id,created_at,updated_at"

// Balises gardées telles quelles ; les autres sont remplacées par leur contenu
const BLOCS = new Set(["P", "H2", "H3", "UL", "OL", "LI", "TABLE", "TBODY", "TR", "TD", "TH"])
const EN_LIGNE: Record<string, string> = { B: "b", STRONG: "b", I: "i", EM: "i", U: "u", S: "s", STRIKE: "s", DEL: "s", MARK: "mark" }

// Couleurs du texte et du surligneur : un nom gardé dans la note (jamais une
// valeur CSS libre), traduit en couleur par la feuille de style.
export const COULEURS_TEXTE = [
  { id: "rouge", nom: "Rouge", hex: "#D92D20" },
  { id: "bleu", nom: "Bleu", hex: "#1F5FD6" },
  { id: "vert", nom: "Vert", hex: "#0F8A5F" },
  { id: "violet", nom: "Violet", hex: "#7A3FD1" },
  { id: "orange", nom: "Orange", hex: "#D46B08" },
] as const
export const COULEURS_SURLIGNEUR = [
  { id: "", nom: "Jaune", hex: "#FFE66D" },
  { id: "vert", nom: "Vert", hex: "#B7F0C8" },
  { id: "rose", nom: "Rose", hex: "#FFC7DE" },
  { id: "bleu", nom: "Bleu", hex: "#BFE3FF" },
  { id: "orange", nom: "Orange", hex: "#FFD8A8" },
] as const

function rvb(c: string): [number, number, number] | null {
  const h = c.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (h) {
    const v = h[1].length === 3 ? h[1].split("").map(x => x + x).join("") : h[1]
    return [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16)) as [number, number, number]
  }
  const m = c.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}
// Couleur la plus proche dans une palette (null si aucune n'est proche)
function proche<T extends { id: string; hex: string }>(c: string | null | undefined, palette: readonly T[], max = 90): T | null {
  const v = c ? rvb(c) : null
  if (!v) return null
  let mieux: T | null = null, ecart = Infinity
  for (const p of palette) {
    const q = rvb(p.hex)!
    const d = Math.hypot(v[0] - q[0], v[1] - q[1], v[2] - q[2])
    if (d < ecart) { ecart = d; mieux = p }
  }
  return ecart <= max ? mieux : null
}
const TEXTE_OK = new Set<string>(COULEURS_TEXTE.map(c => c.id))
const SURLIGNEUR_OK = new Set<string>(COULEURS_SURLIGNEUR.map(c => c.id).filter(Boolean))

// Tailles et polices autorisées (voir TAILLES et POLICES dans l'éditeur)
const TAILLES_OK = new Set(["s", "m", "l", "xl"])  // m = normal (dans un passage agrandi)
const POLICES_OK = new Set(["standard", "titre", "livre", "main", "machine"])
function tailleDeFont(size: string | null): string | null {
  const n = Number(size)
  return !n ? null : n <= 2 ? "s" : n === 3 ? "m" : n <= 5 ? "l" : "xl"
}

function estSurligne(el: HTMLElement) {
  const fond = el.style?.backgroundColor
  return !!fond && fond !== "transparent" && fond !== "rgba(0, 0, 0, 0)" && fond !== "inherit" && fond !== "initial"
}

function nettoyerNoeud(source: Node, cible: Node, doc: Document) {
  for (const enfant of Array.from(source.childNodes)) {
    if (enfant.nodeType === Node.TEXT_NODE) {
      const t = (enfant.textContent ?? "").replace(/\u200B/g, "")
      if (t) cible.appendChild(doc.createTextNode(t))
      continue
    }
    if (enfant.nodeType !== Node.ELEMENT_NODE) continue
    const el = enfant as HTMLElement
    const tag = el.tagName.toUpperCase()
    if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "TEMPLATE", "HEAD", "META", "LINK", "SVG", "MATH"].includes(tag)) continue

    if (tag === "BR") { cible.appendChild(doc.createElement("br")); continue }
    if (tag === "IMG") {
      const chemin = el.getAttribute("data-chemin")
      if (chemin && /^[\w-]+\/notes\/[\w-]+\/[\w.-]+$/.test(chemin)) {
        const img = doc.createElement("img")
        img.setAttribute("data-chemin", chemin)
        img.setAttribute("alt", (el.getAttribute("alt") || "").slice(0, 120))
        cible.appendChild(img)
      }
      continue
    }

    let nouveau: HTMLElement | null = null
    if (BLOCS.has(tag)) {
      nouveau = doc.createElement(tag.toLowerCase())
      if (tag === "UL" && el.getAttribute("data-liste") === "cases") nouveau.setAttribute("data-liste", "cases")
      if (tag === "LI" && el.getAttribute("data-fait") === "1") nouveau.setAttribute("data-fait", "1")
      if (tag === "TD" || tag === "TH") {
        for (const a of ["colspan", "rowspan"]) {
          const n = Number(el.getAttribute(a))
          if (n > 1 && n <= 20) nouveau.setAttribute(a, String(n))
        }
      }
    } else if ((tag === "DIV" || tag === "BLOCKQUOTE") && el.querySelector("p,div,h1,h2,h3,h4,h5,h6,ul,ol,li,blockquote")) {
      // Conteneur de blocs (ex. <div><ul>… créé par le navigateur) : on garde seulement son contenu
      nouveau = null
    } else if (tag === "DIV" || tag === "H1" || tag === "H4" || tag === "H5" || tag === "H6" || tag === "BLOCKQUOTE") {
      nouveau = doc.createElement(tag === "H1" ? "h2" : tag.startsWith("H") ? "h3" : "p")
    } else if (tag === "MARK") {
      nouveau = doc.createElement("mark")
      const c = el.getAttribute("data-couleur")
      if (c && SURLIGNEUR_OK.has(c)) nouveau.setAttribute("data-couleur", c)
    } else if (EN_LIGNE[tag]) {
      nouveau = doc.createElement(EN_LIGNE[tag])
      // Le navigateur pose parfois la couleur sur la balise existante :
      // <b style="color:…; background-color:…">
      const couleur = proche(el.style?.color, COULEURS_TEXTE)?.id
      let exterieur: HTMLElement | null = null, interieur: HTMLElement | null = null
      if (couleur) { exterieur = interieur = doc.createElement("span"); exterieur.setAttribute("data-couleur", couleur) }
      if (estSurligne(el)) {
        const mark = doc.createElement("mark")
        const c = proche(el.style.backgroundColor, COULEURS_SURLIGNEUR, 140)?.id
        if (c) mark.setAttribute("data-couleur", c)
        if (interieur) interieur.appendChild(mark); else exterieur = mark
        interieur = mark
      }
      if (exterieur && interieur) {
        nettoyerNoeud(el, nouveau, doc)
        interieur.appendChild(nouveau)
        cible.appendChild(exterieur)
        continue
      }
    } else if (tag === "SPAN" || tag === "FONT") {
      // Taille, police, couleur : <font size/face/color> pendant la frappe,
      // <span data-…> une fois enregistré
      const taille = tag === "FONT" ? tailleDeFont(el.getAttribute("size")) : el.getAttribute("data-taille")
      const police = tag === "FONT" ? el.getAttribute("face") : el.getAttribute("data-police")
      const couleur = el.getAttribute("data-couleur") ?? proche(tag === "FONT" ? el.getAttribute("color") : el.style?.color, COULEURS_TEXTE)?.id
      const style = doc.createElement("span")
      if (taille && TAILLES_OK.has(taille)) style.setAttribute("data-taille", taille)
      if (police && POLICES_OK.has(police)) style.setAttribute("data-police", police)
      if (couleur && TEXTE_OK.has(couleur)) style.setAttribute("data-couleur", couleur)
      // Le surligneur du navigateur produit <span style="background-color">
      let interieur: HTMLElement | null = null
      if (estSurligne(el)) {
        interieur = doc.createElement("mark")
        const c = proche(el.style.backgroundColor, COULEURS_SURLIGNEUR, 140)?.id
        if (c) interieur.setAttribute("data-couleur", c)
      } else if (el.style?.fontWeight === "bold" || Number(el.style?.fontWeight) >= 600) interieur = doc.createElement("b")
      else if (/line-through/.test(el.style?.textDecoration || "")) interieur = doc.createElement("s")
      if (style.attributes.length) {
        if (interieur) { nettoyerNoeud(el, interieur, doc); style.appendChild(interieur) } else nettoyerNoeud(el, style, doc)
        cible.appendChild(style)
        continue
      }
      nouveau = interieur
    }

    if (nouveau) {
      nettoyerNoeud(el, nouveau, doc)
      cible.appendChild(nouveau)
    } else {
      nettoyerNoeud(el, cible, doc)
    }
  }
}

export function nettoyerHtml(html: string): string {
  // Au-delà, c'est un collage accidentel (page web entière) : on l'ignore
  if (typeof window === "undefined" || !html || html.length > 2_000_000) return ""
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html")
  const sortie = doc.createElement("div")
  nettoyerNoeud(doc.body, sortie, doc)
  // Pas de blocs imbriqués dans un paragraphe (cas d'un <div> collé)
  return sortie.innerHTML.replace(/<p><\/p>/g, "")
}

// Texte brut : recherche, aperçu dans la liste, note vide ou non
export function texteBrut(html: string): string {
  if (typeof window === "undefined" || !html) return ""
  const doc = new DOMParser().parseFromString(`<body>${html.replace(/<\/(p|h2|h3|li|td|th)>|<br>/g, "$& ")}</body>`, "text/html")
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim()
}

export function cheminsImages(html: string): string[] {
  return [...html.matchAll(/data-chemin="([^"]+)"/g)].map(m => m[1])
}

export function normaliser(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

export function dateCourte(iso: string, maintenant = new Date()) {
  const d = new Date(iso)
  const memeJour = d.toDateString() === maintenant.toDateString()
  if (memeJour) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  const hier = new Date(maintenant); hier.setDate(hier.getDate() - 1)
  if (d.toDateString() === hier.toDateString()) return "Hier"
  const memeAnnee = d.getFullYear() === maintenant.getFullYear()
  return d.toLocaleDateString("fr-FR", memeAnnee ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" })
}

// Réduit une photo avant l'envoi (les photos de téléphone font souvent 4-8 Mo)
export async function compresserImage(fichier: Blob, cote = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(fichier)
  const ratio = Math.min(1, cote / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * ratio)
  canvas.height = Math.round(bitmap.height * ratio)
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((ok, ko) => canvas.toBlob(b => (b ? ok(b) : ko(new Error("compression"))), "image/jpeg", 0.85))
}
