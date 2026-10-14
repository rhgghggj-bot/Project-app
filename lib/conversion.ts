// Transforme un document (PowerPoint, Word, PDF, image) en contenu de note du
// carnet : titres, paragraphes, listes et images. Tout se passe dans le
// navigateur, sans IA ni serveur.
//
// Un .pptx / .docx est une archive ZIP de fichiers XML : on lit le texte, sa
// structure (titres, puces, gras…) et les images de chaque slide ou page.
// Un PDF est lu avec pdf.js : chaque page devient une image + son texte.

import { unzip } from "fflate"

export type Morceau = { t: string; b?: boolean; i?: boolean; u?: boolean; mark?: boolean; br?: boolean }
export type Bloc =
  | { type: "h2" | "h3" | "p" | "li"; morceaux: Morceau[] }
  | { type: "img"; image: Blob; alt: string }

export type Avancement = (etape: string) => void

export type TypeConvertible = "pptx" | "docx" | "pdf" | "image"

export function typeConvertible(nom: string, mime: string): TypeConvertible | null {
  const ext = nom.toLowerCase().split(".").pop() || ""
  if (ext === "pptx" || mime.includes("presentationml")) return "pptx"
  if (ext === "docx" || mime.includes("wordprocessingml")) return "docx"
  if (ext === "pdf" || mime === "application/pdf") return "pdf"
  if (/^image\/(png|jpe?g|gif|webp|bmp|heic|heif)$/.test(mime) || /^(png|jpe?g|gif|webp|bmp)$/.test(ext)) return "image"
  return null
}

export async function convertir(fichier: Blob, type: TypeConvertible, avancer: Avancement): Promise<Bloc[]> {
  if (type === "image") return [{ type: "img", image: fichier, alt: "Image" }]
  if (type === "pdf") return lirePdf(fichier, avancer)
  const zip = await ouvrirZip(fichier)
  return type === "pptx" ? lirePptx(zip, avancer) : lireDocx(zip, avancer)
}

// ─── Outils ZIP / XML ───
type Zip = Record<string, Uint8Array>

function ouvrirZip(fichier: Blob): Promise<Zip> {
  return fichier.arrayBuffer().then(buf => new Promise((ok, ko) => {
    unzip(new Uint8Array(buf), (err, data) => (err ? ko(new Error("Ce fichier est abîmé ou n'est pas un document Office récent")) : ok(data)))
  }))
}

const decodeur = new TextDecoder()
function xml(zip: Zip, chemin: string): Document | null {
  const d = zip[chemin]
  if (!d) return null
  const doc = new DOMParser().parseFromString(decodeur.decode(d), "application/xml")
  return doc.getElementsByTagName("parsererror").length ? null : doc
}

// Relations d'un fichier XML (rId → chemin dans l'archive)
function relations(zip: Zip, chemin: string): Record<string, { cible: string; type: string }> {
  const dossier = chemin.slice(0, chemin.lastIndexOf("/") + 1)
  const fichier = chemin.slice(chemin.lastIndexOf("/") + 1)
  const doc = xml(zip, `${dossier}_rels/${fichier}.rels`)
  const sortie: Record<string, { cible: string; type: string }> = {}
  if (!doc) return sortie
  for (const r of Array.from(doc.getElementsByTagName("Relationship"))) {
    const cible = r.getAttribute("Target") || ""
    if (r.getAttribute("TargetMode") === "External") continue
    sortie[r.getAttribute("Id") || ""] = { cible: resoudre(dossier, cible), type: r.getAttribute("Type") || "" }
  }
  return sortie
}

function resoudre(dossier: string, cible: string): string {
  if (cible.startsWith("/")) return cible.slice(1)
  const parties = (dossier + cible).split("/")
  const pile: string[] = []
  for (const p of parties) { if (p === "..") pile.pop(); else if (p && p !== ".") pile.push(p) }
  return pile.join("/")
}

const enfants = (el: Element, nom: string) => Array.from(el.children).filter(c => c.tagName === nom)
const premier = (el: Element, nom: string) => el.getElementsByTagName(nom)[0] as Element | undefined

const MIME_IMAGE: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", bmp: "image/bmp", webp: "image/webp" }
function image(zip: Zip, chemin: string): Blob | null {
  const ext = chemin.toLowerCase().split(".").pop() || ""
  const d = zip[chemin]
  // EMF/WMF/SVG (dessins Windows, vectoriels) : non affichables partout, ignorés
  if (!d || !MIME_IMAGE[ext] || d.length < 1500) return null
  return new Blob([d.slice()], { type: MIME_IMAGE[ext] })
}

const vide = (m: Morceau[]) => m.every(x => !x.t.trim() && !x.br)

// ─── PowerPoint ───
function lirePptx(zip: Zip, avancer: Avancement): Bloc[] {
  const pres = xml(zip, "ppt/presentation.xml")
  if (!pres) throw new Error("Présentation illisible")
  const rels = relations(zip, "ppt/presentation.xml")
  const slides = Array.from(pres.getElementsByTagName("p:sldId")).map(s => rels[s.getAttribute("r:id") || ""]?.cible).filter(Boolean) as string[]
  const blocs: Bloc[] = []
  const imagesVues = new Set<string>()
  slides.forEach((chemin, n) => {
    avancer(`Slide ${n + 1} / ${slides.length}`)
    const doc = xml(zip, chemin)
    if (!doc) return
    const r = relations(zip, chemin)
    let titre: Morceau[] | null = null
    const corps: Bloc[] = []
    const arbre = premier(doc.documentElement, "p:spTree")
    if (arbre) parcourirFormes(arbre, zip, r, imagesVues, corps, t => { if (!titre) titre = t })
    blocs.push({ type: "h2", morceaux: titre && !vide(titre) ? titre : [{ t: `Slide ${n + 1}` }] })
    blocs.push(...corps)
    // Notes de l'orateur
    const notes = Object.values(r).find(x => x.type.endsWith("/notesSlide"))
    const docNotes = notes ? xml(zip, notes.cible) : null
    if (docNotes) {
      const texte = Array.from(docNotes.getElementsByTagName("p:sp"))
        .filter(sp => premier(sp, "p:ph")?.getAttribute("type") === "body")
        .flatMap(sp => Array.from(sp.getElementsByTagName("a:p")).map(p => texteDe(p)))
        .filter(t => t.trim())
      if (texte.length) {
        blocs.push({ type: "p", morceaux: [{ t: "Notes : ", b: true }, { t: texte.join(" "), i: true }] })
      }
    }
  })
  return blocs
}

function texteDe(p: Element): string {
  return Array.from(p.getElementsByTagName("a:t")).map(t => t.textContent || "").join("")
}

function morceauxDrawingML(p: Element): Morceau[] {
  const sortie: Morceau[] = []
  for (const el of Array.from(p.children)) {
    if (el.tagName === "a:r" || el.tagName === "a:fld") {
      const pr = premier(el, "a:rPr")
      const t = premier(el, "a:t")?.textContent || ""
      if (t) sortie.push({ t, b: pr?.getAttribute("b") === "1", i: pr?.getAttribute("i") === "1", u: !!pr?.getAttribute("u") && pr.getAttribute("u") !== "none", mark: !!(pr && premier(pr, "a:highlight")) })
    } else if (el.tagName === "a:br") sortie.push({ t: "", br: true })
  }
  return sortie
}

function parcourirFormes(arbre: Element, zip: Zip, r: ReturnType<typeof relations>, vues: Set<string>, corps: Bloc[], surTitre: (m: Morceau[]) => void) {
  for (const forme of Array.from(arbre.children)) {
    if (forme.tagName === "p:grpSp") { parcourirFormes(forme, zip, r, vues, corps, surTitre); continue }
    if (forme.tagName === "p:sp") {
      const ph = premier(forme, "p:ph")
      const typePh = ph?.getAttribute("type") || (ph ? "body" : null)
      const txBody = premier(forme, "p:txBody")
      if (!txBody) continue
      const paragraphes = enfants(txBody, "a:p").map(morceauxDrawingML).filter(m => !vide(m))
      if (!paragraphes.length) continue
      if (typePh === "title" || typePh === "ctrTitle") { surTitre(paragraphes.flatMap((m, i) => (i ? [{ t: " " }, ...m] : m))); continue }
      if (typePh === "sldNum" || typePh === "dt" || typePh === "ftr") continue
      // Zone de contenu : puces ; zone de texte libre : paragraphes
      const puces = typePh === "body" || typePh === "obj" || paragraphes.length > 1
      for (const m of paragraphes) corps.push({ type: puces ? "li" : "p", morceaux: m })
    } else if (forme.tagName === "p:pic") {
      const id = premier(forme, "a:blip")?.getAttribute("r:embed")
      const cible = id ? r[id]?.cible : null
      if (cible && !vues.has(cible)) {
        const img = image(zip, cible)
        if (img) { vues.add(cible); corps.push({ type: "img", image: img, alt: premier(forme, "p:cNvPr")?.getAttribute("descr") || "Image de la slide" }) }
      }
    } else if (forme.tagName === "p:graphicFrame") {
      for (const ligne of Array.from(forme.getElementsByTagName("a:tr"))) {
        const cellules = Array.from(ligne.getElementsByTagName("a:tc")).map(c => Array.from(c.getElementsByTagName("a:p")).map(texteDe).join(" ").trim())
        if (cellules.some(Boolean)) corps.push({ type: "p", morceaux: [{ t: cellules.join("  |  ") }] })
      }
    }
  }
}

// ─── Word ───
function lireDocx(zip: Zip, avancer: Avancement): Bloc[] {
  const doc = xml(zip, "word/document.xml")
  if (!doc) throw new Error("Document illisible")
  const r = relations(zip, "word/document.xml")
  const corps = premier(doc.documentElement, "w:body")
  if (!corps) return []
  const blocs: Bloc[] = []
  const vues = new Set<string>()
  const elements = Array.from(corps.children)
  elements.forEach((el, n) => {
    if (n % 50 === 0) avancer(`Paragraphe ${n + 1} / ${elements.length}`)
    if (el.tagName === "w:p") lireParagraphe(el, zip, r, vues, blocs)
    else if (el.tagName === "w:tbl") {
      for (const ligne of Array.from(el.getElementsByTagName("w:tr"))) {
        const cellules = Array.from(ligne.getElementsByTagName("w:tc")).map(c => Array.from(c.getElementsByTagName("w:t")).map(t => t.textContent).join("").trim())
        if (cellules.some(Boolean)) blocs.push({ type: "p", morceaux: [{ t: cellules.join("  |  ") }] })
      }
    }
  })
  return blocs
}

function lireParagraphe(p: Element, zip: Zip, r: ReturnType<typeof relations>, vues: Set<string>, blocs: Bloc[]) {
  const style = (premier(p, "w:pStyle")?.getAttribute("w:val") || "").toLowerCase()
  const liste = !!premier(p, "w:numPr")
  const morceaux: Morceau[] = []
  for (const run of Array.from(p.getElementsByTagName("w:r"))) {
    const pr = premier(run, "w:rPr")
    const actif = (nom: string) => { const e = pr && premier(pr, nom); return !!e && !["0", "false", "none"].includes(e.getAttribute("w:val") || "") }
    for (const el of Array.from(run.children)) {
      if (el.tagName === "w:t") morceaux.push({ t: el.textContent || "", b: actif("w:b"), i: actif("w:i"), u: actif("w:u"), mark: actif("w:highlight") || !!(pr && premier(pr, "w:shd")?.getAttribute("w:fill")?.match(/^(FFFF00|FFFF99|FFF2CC)$/i)) })
      else if (el.tagName === "w:tab") morceaux.push({ t: " " })
      else if (el.tagName === "w:br" || el.tagName === "w:cr") morceaux.push({ t: "", br: true })
      else if (el.tagName === "w:drawing" || el.tagName === "w:pict") {
        const id = premier(el, "a:blip")?.getAttribute("r:embed") || premier(el, "v:imagedata")?.getAttribute("r:id")
        const cible = id ? r[id]?.cible : null
        if (cible && !vues.has(cible)) {
          const img = image(zip, cible)
          if (img) { vues.add(cible); blocs.push({ type: "img", image: img, alt: "Image du document" }) }
        }
      }
    }
  }
  if (vide(morceaux)) return
  const type = /^(title|titre|heading1|titre1|heading 1)$/.test(style) ? "h2"
    : /^(subtitle|sous-titre|heading[2-6]|titre[2-6])$/.test(style) ? "h3"
    : liste || /list/.test(style) ? "li" : "p"
  blocs.push({ type, morceaux })
}

// ─── PDF ───
const PAGES_MAX = 120

async function lirePdf(fichier: Blob, avancer: Avancement): Promise<Bloc[]> {
  // Version « legacy » : la version standard utilise des fonctions JavaScript
  // trop récentes pour Safari (iPhone) et Chrome actuels.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs"
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await fichier.arrayBuffer()) }).promise
  const blocs: Bloc[] = []
  const total = Math.min(pdf.numPages, PAGES_MAX)
  for (let n = 1; n <= total; n++) {
    avancer(`Page ${n} / ${total}`)
    const page = await pdf.getPage(n)
    const base = page.getViewport({ scale: 1 })
    const vue = page.getViewport({ scale: Math.min(2, 1400 / base.width) })
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(vue.width)
    canvas.height = Math.round(vue.height)
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvas, canvasContext: ctx, viewport: vue }).promise
    const img = await new Promise<Blob | null>(ok => canvas.toBlob(ok, "image/jpeg", 0.82))
    const contenu = await page.getTextContent()
    let texte = ""
    for (const it of contenu.items) {
      if (!("str" in it)) continue
      texte += it.str + (it.hasEOL ? "\n" : "")
    }
    blocs.push({ type: "h2", morceaux: [{ t: `Page ${n}` }] })
    if (img) blocs.push({ type: "img", image: img, alt: `Page ${n}` })
    const lignes = texte.split("\n").map(l => l.replace(/\s+/g, " ").trim()).filter(Boolean)
    if (lignes.length) blocs.push({ type: "p", morceaux: lignes.flatMap((l, i) => (i ? [{ t: "", br: true }, { t: l }] : [{ t: l }])) })
    page.cleanup()
  }
  if (pdf.numPages > PAGES_MAX) blocs.push({ type: "p", morceaux: [{ t: `Les pages après la ${PAGES_MAX}e n'ont pas été transformées.`, i: true }] })
  await pdf.loadingTask.destroy()
  return blocs
}

// ─── Assemblage en HTML de note ───
// Les images sont envoyées par la fonction `envoyer` (qui renvoie leur chemin
// de stockage) ; le texte est inséré comme texte, jamais comme HTML.
export async function versHtml(blocs: Bloc[], envoyer: (img: Blob) => Promise<string | null>, avancer: Avancement, max = 450000): Promise<string> {
  const racine = document.createElement("div")
  let liste: HTMLUListElement | null = null
  const nbImages = blocs.filter(b => b.type === "img").length
  let iImage = 0
  for (const b of blocs) {
    if (racine.innerHTML.length > max) {
      const p = document.createElement("p"); p.textContent = "… (la suite du document est trop longue pour une seule note)"; racine.appendChild(p)
      break
    }
    if (b.type !== "li") liste = null
    if (b.type === "img") {
      iImage++
      avancer(`Image ${iImage} / ${nbImages}`)
      const chemin = await envoyer(b.image)
      if (!chemin) continue
      const img = document.createElement("img")
      img.setAttribute("data-chemin", chemin)
      img.setAttribute("alt", b.alt.slice(0, 120))
      racine.appendChild(img)
      continue
    }
    const el = document.createElement(b.type)
    for (const m of b.morceaux) {
      if (m.br) { el.appendChild(document.createElement("br")); continue }
      let noeud: Node = document.createTextNode(m.t)
      for (const [actif, tag] of [[m.mark, "mark"], [m.u, "u"], [m.i, "i"], [m.b, "b"]] as const) {
        if (actif) { const w = document.createElement(tag); w.appendChild(noeud); noeud = w }
      }
      el.appendChild(noeud)
    }
    if (b.type === "li") {
      if (!liste) { liste = document.createElement("ul"); racine.appendChild(liste) }
      liste.appendChild(el)
    } else racine.appendChild(el)
  }
  return racine.innerHTML
}
