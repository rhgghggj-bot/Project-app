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
const BLOCS = new Set(["P", "H2", "H3", "UL", "OL", "LI"])
const EN_LIGNE: Record<string, string> = { B: "b", STRONG: "b", I: "i", EM: "i", U: "u", MARK: "mark" }

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
    } else if ((tag === "DIV" || tag === "BLOCKQUOTE") && el.querySelector("p,div,h1,h2,h3,h4,h5,h6,ul,ol,li,blockquote")) {
      // Conteneur de blocs (ex. <div><ul>… créé par le navigateur) : on garde seulement son contenu
      nouveau = null
    } else if (tag === "DIV" || tag === "H1" || tag === "H4" || tag === "H5" || tag === "H6" || tag === "BLOCKQUOTE") {
      nouveau = doc.createElement(tag === "H1" ? "h2" : tag.startsWith("H") ? "h3" : "p")
    } else if (EN_LIGNE[tag]) {
      nouveau = doc.createElement(EN_LIGNE[tag])
    } else if (tag === "SPAN" || tag === "FONT") {
      // Taille et police : <font size/face> pendant la frappe, <span data-…> une fois enregistré
      const taille = tag === "FONT" ? tailleDeFont(el.getAttribute("size")) : el.getAttribute("data-taille")
      const police = tag === "FONT" ? el.getAttribute("face") : el.getAttribute("data-police")
      const style = doc.createElement("span")
      if (taille && TAILLES_OK.has(taille)) style.setAttribute("data-taille", taille)
      if (police && POLICES_OK.has(police)) style.setAttribute("data-police", police)
      // Le surligneur du navigateur produit <span style="background-color">
      const interieur = estSurligne(el) ? doc.createElement("mark")
        : el.style?.fontWeight === "bold" || Number(el.style?.fontWeight) >= 600 ? doc.createElement("b") : null
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
  const doc = new DOMParser().parseFromString(`<body>${html.replace(/<\/(p|h2|h3|li)>|<br>/g, "$& ")}</body>`, "text/html")
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
