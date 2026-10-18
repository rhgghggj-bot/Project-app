// Exporte une note du carnet en document Word (.docx), dans le navigateur.
// Le contenu (déjà nettoyé par nettoyerHtml) est parcouru balise par balise :
// titres, paragraphes, listes, cases, tableaux, images, gras, italique,
// souligné, barré, couleurs, surligneur, tailles et polices.

import { strToU8, zipSync } from "fflate"
import { COULEURS_SURLIGNEUR, COULEURS_TEXTE } from "./carnet"

type Style = { b?: boolean; i?: boolean; u?: boolean; s?: boolean; couleur?: string; fond?: string; taille?: number; police?: string }
type Image = { id: string; nom: string; donnees: Uint8Array; cx: number; cy: number }

const TAILLES: Record<string, number> = { s: 20, m: 22, l: 30, xl: 38 }  // demi-points
const POLICES: Record<string, string> = { titre: "Arial", livre: "Georgia", main: "Segoe Print", machine: "Courier New", standard: "Calibri" }
const LARGEUR_MAX = 5_760_000 // ≈ 16 cm en EMU
const EMU_PX = 9525

const echapper = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export async function noteEnWord(titre: string, html: string, lireImage: (chemin: string) => Promise<Blob | null>): Promise<Blob> {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html")
  const images: Image[] = []
  const listes: number[] = []  // une numérotation par liste numérotée (repart de 1)

  // Images : téléchargées d'abord (le parcours du texte reste synchrone)
  const parChemin = new Map<string, Image | null>()
  for (const img of Array.from(doc.querySelectorAll("img[data-chemin]"))) {
    const chemin = img.getAttribute("data-chemin")!
    if (parChemin.has(chemin)) continue
    const blob = await lireImage(chemin).catch(() => null)
    if (!blob) { parChemin.set(chemin, null); continue }
    try {
      const bmp = await createImageBitmap(blob)
      let cx = bmp.width * EMU_PX, cy = bmp.height * EMU_PX
      bmp.close()
      if (cx > LARGEUR_MAX) { cy = Math.round(cy * LARGEUR_MAX / cx); cx = LARGEUR_MAX }
      const ext = blob.type === "image/png" ? "png" : "jpeg"
      const n = images.length + 1
      const image = { id: `rIdImg${n}`, nom: `image${n}.${ext}`, donnees: new Uint8Array(await blob.arrayBuffer()), cx: Math.round(cx), cy: Math.round(cy) }
      images.push(image)
      parChemin.set(chemin, image)
    } catch { parChemin.set(chemin, null) }
  }

  function rPr(st: Style) {
    let x = ""
    if (st.police) x += `<w:rFonts w:ascii="${st.police}" w:hAnsi="${st.police}" w:cs="${st.police}"/>`
    if (st.b) x += "<w:b/>"
    if (st.i) x += "<w:i/>"
    if (st.s) x += "<w:strike/>"
    if (st.couleur) x += `<w:color w:val="${st.couleur}"/>`
    if (st.taille) x += `<w:sz w:val="${st.taille}"/><w:szCs w:val="${st.taille}"/>`
    if (st.u) x += `<w:u w:val="single"/>`
    if (st.fond) x += `<w:shd w:val="clear" w:color="auto" w:fill="${st.fond}"/>`
    return x ? `<w:rPr>${x}</w:rPr>` : ""
  }

  function styleDe(el: Element, parent: Style): Style {
    const st = { ...parent }
    const tag = el.tagName
    if (tag === "B" || tag === "TH") st.b = true
    if (tag === "I") st.i = true
    if (tag === "U") st.u = true
    if (tag === "S") st.s = true
    if (tag === "MARK") st.fond = (COULEURS_SURLIGNEUR.find(c => c.id === (el.getAttribute("data-couleur") || "")) ?? COULEURS_SURLIGNEUR[0]).hex.slice(1)
    const couleur = el.getAttribute("data-couleur")
    if (tag === "SPAN" && couleur) st.couleur = COULEURS_TEXTE.find(c => c.id === couleur)?.hex.slice(1)
    const taille = el.getAttribute("data-taille")
    if (taille && TAILLES[taille]) st.taille = TAILLES[taille]
    const police = el.getAttribute("data-police")
    if (police && POLICES[police]) st.police = POLICES[police]
    return st
  }

  // Texte et mise en forme d'un bloc → suite de <w:r>
  function runs(noeud: Node, st: Style): string {
    return runsDe(Array.from(noeud.childNodes), st)
  }
  function runsDe(noeuds: Node[], st: Style): string {
    let x = ""
    for (const n of noeuds) {
      if (n.nodeType === Node.TEXT_NODE) {
        const t = n.textContent || ""
        if (t) x += `<w:r>${rPr(st)}<w:t xml:space="preserve">${echapper(t)}</w:t></w:r>`
      } else if (n.nodeType === Node.ELEMENT_NODE) {
        const el = n as Element
        if (el.tagName === "BR") x += "<w:r><w:br/></w:r>"
        else if (el.tagName === "IMG") x += dessin(el)
        else if (!["UL", "OL", "TABLE"].includes(el.tagName)) x += runs(el, styleDe(el, st))
      }
    }
    return x
  }

  function dessin(img: Element): string {
    const im = parChemin.get(img.getAttribute("data-chemin") || "")
    if (!im) return ""
    const n = images.indexOf(im) + 1
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${im.cx}" cy="${im.cy}"/><wp:docPr id="${n}" name="Image ${n}"/>`
      + `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">`
      + `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${n}" name="${im.nom}"/><pic:cNvPicPr/></pic:nvPicPr>`
      + `<pic:blipFill><a:blip r:embed="${im.id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>`
      + `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${im.cx}" cy="${im.cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>`
      + `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`
  }

  const para = (contenu: string, pPr = "") => `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ""}${contenu}</w:p>`

  function liste(el: Element, niveau: number): string {
    let x = ""
    const cases = el.getAttribute("data-liste") === "cases"
    let num = 1
    if (el.tagName === "OL") { listes.push(listes.length + 3); num = listes[listes.length - 1] }
    for (const li of Array.from(el.children)) {
      if (li.tagName !== "LI") continue
      const prefixe = cases ? `<w:r><w:t xml:space="preserve">${li.getAttribute("data-fait") === "1" ? "☑" : "☐"} </w:t></w:r>` : ""
      const pPr = cases ? `<w:ind w:left="${360 + niveau * 360}"/>` : `<w:numPr><w:ilvl w:val="${Math.min(niveau, 2)}"/><w:numId w:val="${num}"/></w:numPr>`
      x += para(prefixe + runs(li, li.getAttribute("data-fait") === "1" ? { s: true, couleur: "6B7280" } : {}), pPr)
      for (const sous of Array.from(li.children)) if (sous.tagName === "UL" || sous.tagName === "OL") x += liste(sous, niveau + 1)
    }
    return x
  }

  function tableau(el: Element): string {
    const lignes = Array.from(el.querySelectorAll(":scope > tbody > tr, :scope > tr"))
    const largeur = Math.max(1, ...lignes.map(tr => Array.from(tr.children).reduce((n, c) => n + (Number(c.getAttribute("colspan")) || 1), 0)))
    const col = Math.floor(9000 / largeur)
    let x = `<w:tbl><w:tblPr><w:tblStyle w:val="Tableau"/><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tblGrid>${`<w:gridCol w:w="${col}"/>`.repeat(largeur)}</w:tblGrid>`
    for (const tr of lignes) {
      x += "<w:tr>"
      for (const c of Array.from(tr.children)) {
        const span = Number(c.getAttribute("colspan")) || 1
        const entete = c.tagName === "TH"
        x += `<w:tc><w:tcPr><w:tcW w:w="${col * span}" w:type="dxa"/>${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ""}${entete ? `<w:shd w:val="clear" w:color="auto" w:fill="EEF2F8"/>` : ""}</w:tcPr>`
        x += para(runs(c, entete ? { b: true } : {})) + "</w:tc>"
      }
      x += "</w:tr>"
    }
    return x + "</w:tbl>" + para("")
  }

  let corps = para(`<w:r><w:t xml:space="preserve">${echapper(titre || "Note")}</w:t></w:r>`, `<w:pStyle w:val="Title"/>`)
  let enLigne = ""
  const finLigne = () => { if (enLigne) { corps += para(enLigne); enLigne = "" } }
  for (const n of Array.from(doc.body.childNodes)) {
    const el = n.nodeType === Node.ELEMENT_NODE ? (n as Element) : null
    const bloc = el && ["P", "H2", "H3", "UL", "OL", "TABLE", "IMG"].includes(el.tagName)
    if (!bloc) { enLigne += runsDe([n], {}); continue }
    finLigne()
    if (el.tagName === "P") corps += para(runs(el, {}))
    else if (el.tagName === "H2") corps += para(runs(el, {}), `<w:pStyle w:val="Heading1"/>`)
    else if (el.tagName === "H3") corps += para(runs(el, {}), `<w:pStyle w:val="Heading2"/>`)
    else if (el.tagName === "UL" || el.tagName === "OL") corps += liste(el, 0)
    else if (el.tagName === "TABLE") corps += tableau(el)
    else if (el.tagName === "IMG") corps += para(dessin(el))
  }
  finLigne()

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>${corps}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`

  const niveaux = (format: string, texte: (i: number) => string) => [0, 1, 2].map(i =>
    `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="${format}"/><w:lvlText w:val="${texte(i)}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720 + i * 360}" w:hanging="360"/></w:pPr>${format === "bullet" ? `<w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr>` : ""}</w:lvl>`).join("")
  const numbering = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">`
    + `<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>${niveaux("bullet", () => "")}</w:abstractNum>`
    + `<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>${niveaux("decimal", i => `%${i + 1}.`)}</w:abstractNum>`
    + `<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>`
    + listes.map(id => `<w:num w:numId="${id}"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>`).join("")
    + `</w:numbering>`

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="fr-CH"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="0A1628"/><w:sz w:val="44"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="0A1628"/><w:sz w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="1F5FD6"/><w:sz w:val="26"/></w:rPr></w:style>
<w:style w:type="table" w:styleId="Tableau"><w:name w:val="Tableau"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="C9D3E3"/><w:left w:val="single" w:sz="4" w:color="C9D3E3"/><w:bottom w:val="single" w:sz="4" w:color="C9D3E3"/><w:right w:val="single" w:sz="4" w:color="C9D3E3"/><w:insideH w:val="single" w:sz="4" w:color="C9D3E3"/><w:insideV w:val="single" w:sz="4" w:color="C9D3E3"/></w:tblBorders><w:tblCellMar><w:left w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
</w:styles>`

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdNum" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>${images.map(im => `<Relationship Id="${im.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${im.nom}"/>`).join("")}</Relationships>`

  const fichiers: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`),
    "word/document.xml": strToU8(document),
    "word/styles.xml": strToU8(styles),
    "word/numbering.xml": strToU8(numbering),
    "word/_rels/document.xml.rels": strToU8(rels),
  }
  for (const im of images) fichiers[`word/media/${im.nom}`] = im.donnees
  return new Blob([zipSync(fichiers).slice()], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
}

export function nomFichier(titre: string, ext: string) {
  const base = (titre || "Note").replace(/[\\/:*?"<>|\n\r]+/g, " ").trim().slice(0, 80) || "Note"
  return `${base}.${ext}`
}
