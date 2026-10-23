// Lecture d'un article de Wikipédia en français, découpé en sections, pour
// l'atlas (histoire, politique…). Chargé à la demande depuis le navigateur.

export type SectionWiki = { titre: string; blocs: { t: "p" | "h"; x: string }[] }
export type ArticleWiki = { titre: string; intro: string[]; sections: SectionWiki[]; url: string }

const IGNORER = /^(notes?( et références)?|références|voir aussi|bibliographie|liens externes|annexes|articles connexes|sources?|galerie|filmographie|discographie)$/i
const cache = new Map<string, Promise<ArticleWiki>>()

const lien = (titre: string) => `https://fr.wikipedia.org/wiki/${encodeURIComponent(titre.replace(/ /g, "_"))}`
const propre = (t: string) => t.replace(/\[\d+\]|\[réf\. nécessaire\]|\[Quand \?\]/g, "").replace(/\s+/g, " ").trim()

// Version HTML (API REST) : sections imbriquées <section><h2>…</h2>…</section>
function lireHtml(titre: string, html: string): ArticleWiki {
  const doc = new DOMParser().parseFromString(html, "text/html")
  doc.querySelectorAll("style, script, sup, table, figure, .infobox, .navbox, .bandeau-container, .bandeau, .hatnote, .metadata, .mw-ref, .reference, .noprint, .homonymie").forEach(e => e.remove())
  const intro: string[] = []
  const sections: SectionWiki[] = []
  const racines = Array.from(doc.body.querySelectorAll(":scope > section"))
  for (const sec of racines) {
    const h2 = sec.querySelector(":scope > h2, :scope > .mw-heading2 > h2")
    const blocs: SectionWiki["blocs"] = []
    sec.querySelectorAll("p, h3, h4").forEach(e => {
      const x = propre(e.textContent || "")
      if (!x || (e.tagName === "P" && x.length < 25)) return
      blocs.push({ t: e.tagName === "P" ? "p" : "h", x })
    })
    if (!h2) { intro.push(...blocs.filter(b => b.t === "p").map(b => b.x)); continue }
    const t = propre(h2.textContent || "")
    if (IGNORER.test(t) || !blocs.some(b => b.t === "p")) continue
    sections.push({ titre: t, blocs })
  }
  return { titre, intro, sections, url: lien(titre) }
}

// Version texte (API classique), en secours
function lireTexte(titre: string, texte: string): ArticleWiki {
  const intro: string[] = []
  const sections: SectionWiki[] = []
  let courante: SectionWiki | null = null
  for (const ligne of texte.split("\n")) {
    const m = /^(=+)\s*(.+?)\s*=+$/.exec(ligne)
    if (m) {
      if (m[1].length === 2) { courante = IGNORER.test(m[2]) ? null : { titre: m[2], blocs: [] }; if (courante) sections.push(courante) }
      else courante?.blocs.push({ t: "h", x: m[2] })
      continue
    }
    const x = propre(ligne)
    if (x.length < 25) continue
    if (courante) courante.blocs.push({ t: "p", x })
    else if (!sections.length) intro.push(x)
  }
  return { titre, intro, sections: sections.filter(s => s.blocs.some(b => b.t === "p")), url: lien(titre) }
}

export function chargerArticle(titre: string): Promise<ArticleWiki> {
  if (!cache.has(titre)) {
    const p = (async () => {
      try {
        const r = await fetch(`https://fr.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(titre.replace(/ /g, "_"))}?redirect=true`)
        if (r.ok) return lireHtml(titre, await r.text())
      } catch { /* on essaie l'autre adresse */ }
      const r = await fetch(`https://fr.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exsectionformat=wiki&redirects=1&format=json&formatversion=2&origin=*&titles=${encodeURIComponent(titre)}`)
      if (!r.ok) throw new Error("Wikipédia ne répond pas")
      const texte = (await r.json())?.query?.pages?.[0]?.extract
      if (!texte) throw new Error("Article introuvable")
      return lireTexte(titre, texte)
    })()
    p.catch(() => cache.delete(titre))
    cache.set(titre, p)
  }
  return cache.get(titre)!
}

export const lienWikipedia = lien
