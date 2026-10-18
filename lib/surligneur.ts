// Surligneur « crayon » du carnet : on passe le doigt, la souris ou le stylet
// sur le texte, sans le sélectionner (donc sans risque de l'effacer en
// tapant). Ces fonctions travaillent directement sur le DOM de la note :
// chaque morceau de texte touché est entouré d'un <mark data-couleur>.

export type Point = { node: Node; offset: number }

// Position du texte sous le doigt. Pendant le surlignage la note n'est pas
// sélectionnable : on la rend sélectionnable le temps de la mesure.
export function pointSous(page: HTMLElement, x: number, y: number): Point | null {
  page.classList.add("carnet-mesure")
  let p: Point | null = null
  const d = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
  }
  if (d.caretPositionFromPoint) {
    const c = d.caretPositionFromPoint(x, y)
    if (c) p = { node: c.offsetNode, offset: c.offset }
  } else if (d.caretRangeFromPoint) {
    const r = d.caretRangeFromPoint(x, y)
    if (r) p = { node: r.startContainer, offset: r.startOffset }
  }
  page.classList.remove("carnet-mesure")
  return p && page.contains(p.node) ? p : null
}

// Sans l'apostrophe : « l'entreprise » → « entreprise »
const LETTRE = /[\p{L}\p{N}\-]/u

// Plage entre deux points (dans n'importe quel ordre), étendue aux mots
// entiers : un doigt n'est jamais précis à la lettre près.
export function plageEntre(a: Point, b: Point, motsEntiers = true): Range {
  const r = document.createRange()
  r.setStart(a.node, a.offset)
  r.collapse(true)
  if (r.comparePoint(b.node, b.offset) < 0) { r.setStart(b.node, b.offset); r.setEnd(a.node, a.offset) }
  else r.setEnd(b.node, b.offset)
  if (motsEntiers) {
    if (r.startContainer.nodeType === Node.TEXT_NODE) {
      const t = r.startContainer.textContent || ""
      let i = r.startOffset
      while (i > 0 && LETTRE.test(t[i - 1])) i--
      r.setStart(r.startContainer, i)
    }
    if (r.endContainer.nodeType === Node.TEXT_NODE) {
      const t = r.endContainer.textContent || ""
      let i = r.endOffset
      while (i < t.length && LETTRE.test(t[i])) i++
      r.setEnd(r.endContainer, i)
    }
  }
  return r
}

// Le mot sous un point (pour une simple touche)
export function motSous(p: Point): Range | null {
  if (p.node.nodeType !== Node.TEXT_NODE) return null
  const r = plageEntre(p, p)
  return r.collapsed ? null : r
}

const CONTENEURS = new Set(["UL", "OL", "TABLE", "TBODY", "TR", "BLOCKQUOTE"])

function textesDans(page: HTMLElement, r: Range): Text[] {
  const sortie: Text[] = []
  const w = document.createTreeWalker(page, NodeFilter.SHOW_TEXT)
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const t = n as Text
    if (!t.length || !r.intersectsNode(t)) continue
    if (r.endContainer === t && r.endOffset === 0) continue
    if (r.startContainer === t && r.startOffset >= t.length) continue
    // Espaces entre deux blocs (fin de ligne d'une liste…) : rien à surligner
    if (!/\S/.test(t.data) && (t.parentNode === page || CONTENEURS.has((t.parentNode as Element)?.tagName))) continue
    sortie.push(t)
  }
  return sortie
}

// Sort le texte `t` de son <mark> : le surlignage avant et après reste en place
function isoler(m: HTMLElement, t: Text) {
  const avant = document.createRange()
  avant.setStart(m, 0); avant.setEndBefore(t)
  if (!avant.collapsed) {
    const f = avant.extractContents()
    if (f.textContent) { const c = m.cloneNode(false) as HTMLElement; c.appendChild(f); m.before(c) }
  }
  const apres = document.createRange()
  apres.setStartAfter(t); apres.setEnd(m, m.childNodes.length)
  if (!apres.collapsed) {
    const f = apres.extractContents()
    if (f.textContent) { const c = m.cloneNode(false) as HTMLElement; c.appendChild(f); m.after(c) }
  }
}

const couleurDe = (m: Element) => m.getAttribute("data-couleur") || ""

// Surligne (couleur = "" pour le jaune, "vert"…) ou efface (couleur = null)
// le texte de la plage. Renvoie false si rien n'a changé.
export function surligner(page: HTMLElement, plage: Range, couleur: string | null): boolean {
  const textes = textesDans(page, plage)
  if (!textes.length) return false
  // Coupe le premier et le dernier morceau aux limites exactes de la plage
  const dernier = textes[textes.length - 1]
  if (plage.endContainer === dernier && plage.endOffset < dernier.length) dernier.splitText(plage.endOffset)
  if (plage.startContainer === textes[0] && plage.startOffset > 0) textes[0] = textes[0].splitText(plage.startOffset)

  let change = false
  for (const t of textes) {
    const m = t.parentElement?.closest("mark") as HTMLElement | null
    if (m && page.contains(m)) {
      if (couleur !== null && couleurDe(m) === couleur) continue
      isoler(m, t)
      if (couleur === null) m.replaceWith(...Array.from(m.childNodes))
      else if (couleur) m.setAttribute("data-couleur", couleur)
      else m.removeAttribute("data-couleur")
      change = true
    } else if (couleur !== null) {
      const mk = document.createElement("mark")
      if (couleur) mk.setAttribute("data-couleur", couleur)
      t.replaceWith(mk)
      mk.appendChild(t)
      change = true
    }
  }
  if (change) ranger(page)
  return change
}

// Efface tout le passage surligné sous un point (une touche sur un surlignage)
export function effacerSous(page: HTMLElement, p: Point): boolean {
  const el = p.node.nodeType === Node.ELEMENT_NODE ? (p.node as Element) : p.node.parentElement
  const m = el?.closest("mark")
  if (!m || !page.contains(m)) return false
  m.replaceWith(...Array.from(m.childNodes))
  ranger(page)
  return true
}

export function estSurligne(page: HTMLElement, p: Point): boolean {
  const el = p.node.nodeType === Node.ELEMENT_NODE ? (p.node as Element) : p.node.parentElement
  const m = el?.closest("mark")
  return !!m && page.contains(m)
}

// Retire les balises vides laissées par les découpes et fusionne les
// surlignages voisins de même couleur
function ranger(page: HTMLElement) {
  page.querySelectorAll("mark, b, i, u, s, span, sup, sub").forEach(el => {
    if (!el.textContent && !el.querySelector("img, br")) el.remove()
  })
  page.querySelectorAll("mark").forEach(m => {
    let suivant = m.nextSibling
    while (suivant instanceof HTMLElement && suivant.tagName === "MARK" && couleurDe(suivant) === couleurDe(m)) {
      while (suivant.firstChild) m.appendChild(suivant.firstChild)
      const s = suivant
      suivant = suivant.nextSibling
      s.remove()
    }
  })
  page.normalize()
}
