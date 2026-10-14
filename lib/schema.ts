// Schémas des fiches importées (SVG et petits tableaux HTML venus d'un
// artefact). Avant affichage, ils passent par une liste blanche : seules des
// balises de dessin et de mise en page sont gardées, sans script, lien,
// image externe ni attribut d'événement.

const BALISES = new Set([
  // HTML
  "figure", "figcaption", "div", "span", "p", "b", "strong", "i", "em", "small", "br", "sup", "sub",
  "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td", "h4", "h5",
  // SVG
  "svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text", "tspan",
  "defs", "marker", "title", "desc", "lineargradient", "radialgradient", "stop", "clippath", "pattern", "symbol",
])

const ATTRIBUTS = new Set([
  "class", "style", "id", "role", "aria-label", "colspan", "rowspan",
  "viewbox", "xmlns", "width", "height", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "d", "points",
  "fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "transform",
  "text-anchor", "dominant-baseline", "font-size", "font-weight", "font-family", "opacity", "fill-opacity", "stroke-opacity",
  "marker-end", "marker-start", "marker-mid", "markerwidth", "markerheight", "markerunits", "refx", "refy", "orient",
  "offset", "stop-color", "stop-opacity", "preserveaspectratio", "dx", "dy", "gradienttransform", "gradientunits",
  "clip-path", "patternunits", "letter-spacing",
])

// Une valeur ne peut référencer qu'un élément du schéma lui-même : url(#id)
function valeurSure(v: string) {
  if (/javascript:|expression\s*\(|@import|behavior\s*:/i.test(v)) return false
  const urls = v.match(/url\s*\(([^)]*)\)/gi) || []
  return urls.every(u => /^url\s*\(\s*['"]?#[\w-]+['"]?\s*\)$/i.test(u))
}

function nettoyer(el: Element) {
  for (const enfant of Array.from(el.children)) {
    if (!BALISES.has(enfant.tagName.toLowerCase())) { enfant.remove(); continue }
    for (const a of Array.from(enfant.attributes)) {
      if (!ATTRIBUTS.has(a.name.toLowerCase()) || !valeurSure(a.value)) enfant.removeAttribute(a.name)
    }
    nettoyer(enfant)
  }
}

const cache = new Map<string, string>()

export function schemaSur(html: string): string {
  if (typeof window === "undefined" || !html || html.length > 400000) return ""
  const deja = cache.get(html)
  if (deja !== undefined) return deja
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html")
  nettoyer(doc.body)
  const sortie = doc.body.innerHTML
  cache.set(html, sortie)
  return sortie
}
