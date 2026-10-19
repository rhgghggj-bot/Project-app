// Moteur du lecteur de la bibliothèque : découpe un chapitre en pages de la taille
// de l'écran, affiche une page (téléphone) ou une double page (grand écran), et
// tourne la page en suivant le doigt. Code DOM direct : la page suit le pointeur
// à chaque image, sans passer par React.

import type { Bloc, Position, TexteLivre } from "@/lib/bibliotheque"

type Morceau = { b: number; k: Bloc[0]; t: string; n?: string; suite: boolean }
type Page = { morceaux: Morceau[]; sec: string; premier: number; dernier: number }
type Ref = { c: number; i: number }
type Tour = { f: HTMLDivElement; ombre: HTMLDivElement; sens: 1 | -1; cible: Ref; w: number; angle: number }

export type InfoLecteur = { c: number; i: number; pages: number; pct: number; premier: number; dernier: number }
export type Surlignage = { c: number; b: number; t: string }

export type OptionsLecteur = {
  scene: HTMLElement
  ouvert: HTMLElement
  texte: TexteLivre
  auteur: string
  taille: number
  depart: Position | null
  signets: () => Position[]
  passages: () => Surlignage[]
  onPosition: (info: InfoLecteur) => void
  onSelection: (s: { c: number; b: number; t: string; x: number; y: number } | null) => void
}

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!))
const reduit = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
const COUPABLES = new Set(["p", "n", "v"])
const TITRES = new Set(["c", "h", "s"])

function htmlMorceau(m: Morceau, marques: string[] = []) {
  let t = esc(m.t)
  for (const s of marques) { const e = esc(s); if (t.includes(e)) t = t.replace(e, `<mark class="sl">${e}</mark>`) }
  const b = ` data-b="${m.b}"`
  switch (m.k) {
    case "c": return `<div class="chapitre"${b}>${t}</div>`
    case "h": return `<h2${b}>${t}</h2>`
    case "s": return `<p class="sous"${b}>${t}</p>`
    case "v": return `<p class="vers${m.suite ? " suite" : ""}"${b}>${t}</p>`
    case "n": return `<p class="maxime${m.suite ? " suite" : ""}"${b}>${m.suite ? "" : `<b>${esc(m.n || "")}.</b>`}${t}</p>`
    default: return `<p${m.suite ? ' class="suite"' : ""}${b}>${t}</p>`
  }
}

export function creerLecteur(o: OptionsLecteur) {
  const { scene, ouvert, texte } = o
  const nbChap = texte.chapitres.length
  let taille = o.taille
  let double = false
  let cache = new Map<number, Page[]>()
  const redecoupes = new Set<number>()
  let courant: Ref = { c: 0, i: 0 }
  let tour: Tour | null = null
  let surligneur = false
  let fini = false

  function dimensions() {
    const sc = scene.getBoundingClientRect()
    double = sc.width >= 900 && sc.width / Math.max(1, sc.height) > 1.25
    const hMax = Math.min(sc.height - 14, 880)
    const wMax = double ? (sc.width - 30) / 2 : sc.width - 24
    let h = hMax, w = h * 0.66
    if (w > wMax) { w = wMax; h = w / 0.66 }
    return { w: Math.max(120, Math.floor(w)), h: Math.max(180, Math.floor(h)) }
  }

  // Découpe un chapitre : on remplit la page bloc par bloc ; un paragraphe trop
  // long est coupé au mot près (recherche par dichotomie).
  function paginer(c: number): Page[] {
    const deja = cache.get(c)
    if (deja) return deja
    const { w, h } = dimensions()
    const mesure = document.createElement("div")
    mesure.className = "page seule"
    mesure.style.cssText = `position:absolute;visibility:hidden;width:${w}px;height:${h}px;left:-9999px;top:0`
    mesure.innerHTML = `<div class="contenu" lang="fr" style="--taille:${taille}px"></div>`
    ouvert.parentElement!.appendChild(mesure)
    const zone = mesure.firstElementChild as HTMLElement
    const deborde = () => zone.scrollHeight > zone.clientHeight + 1
    const chap = texte.chapitres[c]
    const pages: Page[] = []
    let cur: Morceau[] = [], sec = chap.titre
    const html = (ms: Morceau[]) => ms.map(m => htmlMorceau(m)).join("")
    const finPage = () => {
      if (!cur.length) return
      pages.push({ morceaux: cur, sec, premier: cur[0].b, dernier: cur[cur.length - 1].b })
      cur = []; zone.innerHTML = ""
    }
    // Change de page ; un titre ne reste pas seul en bas : il passe à la page suivante
    const nouvellePage = () => {
      const porte: Morceau[] = []
      while (cur.length > 1 && TITRES.has(cur[cur.length - 1].k)) porte.unshift(cur.pop()!)
      if (cur.every(m => TITRES.has(m.k))) { cur.push(...porte); porte.length = 0 }
      finPage()
      cur = porte
    }
    chap.blocs.forEach((bl, b) => {
      const k = bl[0]
      const t = bl.length === 3 ? bl[2] : bl[1]
      const n = bl.length === 3 ? bl[1] : undefined
      if (k === "h") sec = t
      const m: Morceau = { b, k, t, n, suite: false }
      zone.innerHTML = html([...cur, m])
      if (!deborde()) { cur.push(m); return }
      if (!COUPABLES.has(k)) { nouvellePage(); cur.push(m); zone.innerHTML = html(cur); return }
      let mots = t.split(" "), suite = false
      while (mots.length) {
        let bas = 0, haut = mots.length
        while (bas < haut) {
          const mi = Math.ceil((bas + haut) / 2)
          zone.innerHTML = html([...cur, { b, k, n, t: mots.slice(0, mi).join(" "), suite }])
          if (deborde()) haut = mi - 1; else bas = mi
        }
        if (bas === 0) {
          if (cur.length) { nouvellePage(); zone.innerHTML = html(cur); continue }
          bas = Math.min(mots.length, 30)   // page trop petite : on force
        }
        cur.push({ b, k, n, t: mots.slice(0, bas).join(" "), suite })
        mots = mots.slice(bas); suite = true
        if (mots.length) finPage()
      }
      zone.innerHTML = html(cur)
    })
    finPage()
    if (!pages.length) pages.push({ morceaux: [], sec: chap.titre, premier: 0, dernier: 0 })
    mesure.remove()
    cache.set(c, pages)
    return pages
  }

  const page = (r: Ref) => (r.c >= 0 && r.c < nbChap ? paginer(r.c)[r.i] : undefined)
  const voisine = (r: Ref): Ref => ({ c: r.c, i: r.i + 1 })

  function marquePage(p: Page, c: number) {
    return o.signets().some(s => s.c === c && s.b >= p.premier && s.b <= p.dernier)
  }

  function htmlPage(r: Ref, cote: "gauche" | "droite" | "seule") {
    const p = page(r)
    if (!p) return `<div class="page ${cote}"></div>`
    const passages = o.passages().filter(s => s.c === r.c)
    const corps = p.morceaux.map(m => htmlMorceau(m, passages.filter(s => s.b === m.b).map(s => s.t))).join("")
    const enTete = r.i % 2 ? o.auteur.toUpperCase() : p.sec.toUpperCase()
    return `<div class="page ${cote}" data-c="${r.c}" data-i="${r.i}">${marquePage(p, r.c) ? '<div class="signet"></div>' : ""}
      <div class="courant">${esc(enTete.length > 48 ? enTete.slice(0, 46) + "…" : enTete)}</div>
      <div class="contenu" lang="fr" style="--taille:${taille}px">${corps}</div><div class="folio">${r.i + 1}</div>${cote !== "gauche" ? '<div class="coin"></div>' : ""}</div>`
  }

  function taillePages(w: number, h: number) {
    ouvert.querySelectorAll<HTMLElement>(".page").forEach(p => { if (!p.closest(".feuille")) { p.style.width = w + "px"; p.style.height = h + "px" } })
  }

  function info(): InfoLecteur {
    const pages = paginer(courant.c)
    const p = pages[courant.i]
    const vu = Math.min(pages.length, courant.i + (double ? 2 : 1))
    return { c: courant.c, i: courant.i, pages: pages.length, pct: Math.round((courant.c + vu / pages.length) / nbChap * 100), premier: p?.premier ?? 0, dernier: (double ? pages[courant.i + 1]?.dernier : undefined) ?? p?.dernier ?? 0 }
  }

  function rendre() {
    if (fini) return
    const { w, h } = dimensions()
    ouvert.style.height = h + "px"
    ouvert.innerHTML = double ? htmlPage(courant, "gauche") + htmlPage(voisine(courant), "droite") : htmlPage(courant, "seule")
    taillePages(w, h)
    // Filet de sécurité : si la mise en page a bougé depuis la découpe (police ou
    // césure chargée entre-temps), on redécoupe le chapitre une fois.
    const deborde = [...ouvert.querySelectorAll<HTMLElement>(".page[data-c] .contenu")].some(z => z.scrollHeight > z.clientHeight + 1)
    if (deborde && !redecoupes.has(courant.c)) {
      redecoupes.add(courant.c)
      const b = paginer(courant.c)[courant.i]?.premier ?? 0
      cache.delete(courant.c)
      allerBloc(courant.c, b)
      return
    }
    o.onPosition(info())
  }

  function caler(r: Ref): Ref {
    const c = Math.max(0, Math.min(nbChap - 1, r.c))
    const n = paginer(c).length
    let i = r.i < 0 ? n + r.i : r.i
    i = Math.max(0, Math.min(n - 1, i))
    if (double && i % 2) i--
    return { c, i }
  }

  function allerBloc(c: number, b: number) {
    const pages = paginer(c)
    let i = pages.findIndex(p => p.dernier >= b)
    if (i < 0) i = pages.length - 1
    courant = caler({ c, i })
    rendre()
  }

  // Page suivante ou précédente, en passant d'un chapitre à l'autre
  function cibleDe(sens: 1 | -1): Ref | null {
    const pas = double ? 2 : 1
    const n = paginer(courant.c).length
    const i = courant.i + sens * pas
    if (i >= 0 && i < n) return { c: courant.c, i }
    const c = courant.c + sens
    if (c < 0 || c >= nbChap) return null
    return caler({ c, i: sens > 0 ? 0 : -1 })
  }

  function preparer(sens: 1 | -1): Tour | null {
    const cible = cibleDe(sens)
    if (!cible) return null
    const { w, h } = dimensions()
    const recto = sens > 0 ? (double ? voisine(courant) : courant) : (double ? voisine(cible) : cible)
    const verso = sens > 0 ? cible : courant
    const f = document.createElement("div")
    f.className = "feuille"
    f.style.cssText = `width:${w}px;height:${h}px;left:${double ? w : 0}px`
    f.innerHTML = `<div class="face">${htmlPage(recto, double ? "droite" : "seule")}</div>
      <div class="face dos-f">${double ? htmlPage(verso, "gauche") : `<div class="page gauche"></div>`}</div><div class="reflet"></div>`
    f.querySelectorAll<HTMLElement>(".page").forEach(p => { p.style.width = "100%"; p.style.height = "100%"; p.style.boxShadow = "none" })
    const ombre = document.createElement("div")
    ombre.className = "ombre-sol"
    ombre.style.cssText = `left:${double ? w : 0}px;width:${w}px`
    if (sens > 0 && double) ouvert.lastElementChild!.outerHTML = htmlPage(voisine(cible), "droite")
    else if (sens > 0) ouvert.innerHTML = htmlPage(cible, "seule")
    else if (double) ouvert.firstElementChild!.outerHTML = htmlPage(cible, "gauche")
    taillePages(w, h)
    ouvert.appendChild(ombre); ouvert.appendChild(f)
    return { f, ombre, sens, cible, w, angle: sens > 0 ? 0 : -180 }
  }

  function poser(t: Tour, a: number) {
    t.angle = a
    t.f.style.transform = `rotateY(${a}deg)`
    const pli = Math.sin(Math.abs(a) * Math.PI / 180)
    ;(t.f.querySelector(".reflet") as HTMLElement).style.background =
      `linear-gradient(${a > -90 ? 90 : 270}deg, rgba(0,0,0,${0.04 + pli * 0.28}), transparent 35%, rgba(255,255,255,${pli * 0.18}) 70%, rgba(0,0,0,${pli * 0.12}))`
    t.ombre.style.background = `linear-gradient(90deg, rgba(0,0,0,${pli * 0.35}), transparent ${20 + (1 - pli) * 60}%)`
  }

  function finir(t: Tour, aller: boolean) {
    const debut = t.angle, fin = aller ? (t.sens > 0 ? -180 : 0) : (t.sens > 0 ? 0 : -180)
    const t0 = performance.now(), duree = reduit() ? 1 : 260 + Math.abs(fin - debut) * 2.4
    const pas = (n: number) => {
      if (fini) return
      const k = Math.min(1, (n - t0) / duree), e = 1 - Math.pow(1 - k, 3)
      poser(t, debut + (fin - debut) * e)
      if (k < 1) { requestAnimationFrame(pas); return }
      tour = null
      if (aller) courant = t.cible
      rendre()
    }
    requestAnimationFrame(pas)
  }

  function tourner(sens: 1 | -1) {
    if (tour) return
    const t = preparer(sens)
    if (!t) return
    tour = t; poser(t, t.angle); finir(t, true)
  }

  // ─── Doigt / souris ───
  let doigt: { x: number; y: number; t: Tour | null; id: number } | null = null
  const bas = (e: PointerEvent) => {
    if (surligneur || tour || e.button > 0) return
    doigt = { x: e.clientX, y: e.clientY, t: null, id: e.pointerId }
  }
  const bouge = (e: PointerEvent) => {
    if (!doigt || e.pointerId !== doigt.id) return
    const dx = e.clientX - doigt.x
    if (!doigt.t) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(e.clientY - doigt.y)) return
      doigt.t = preparer(dx < 0 ? 1 : -1)
      if (!doigt.t) { doigt = null; return }
      tour = doigt.t
      try { scene.setPointerCapture(e.pointerId) } catch { /* pointeur déjà relâché */ }
    }
    const t = doigt.t, k = Math.max(0, Math.min(1, Math.abs(dx) / (t.w * (double ? 1.4 : 1.1))))
    poser(t, t.sens > 0 ? -180 * k : -180 + 180 * k)
  }
  const haut = (e: PointerEvent) => {
    if (!doigt || e.pointerId !== doigt.id) return
    const d = doigt; doigt = null
    if (d.t) { const fait = Math.abs(d.t.angle - (d.t.sens > 0 ? 0 : -180)); finir(d.t, fait > 50 || Math.abs(e.clientX - d.x) > 90); return }
    if (Math.abs(e.clientX - d.x) < 8 && Math.abs(e.clientY - d.y) < 8) {
      const sc = scene.getBoundingClientRect(), x = (e.clientX - sc.left) / sc.width
      if (x > 0.66) tourner(1); else if (x < 0.34) tourner(-1)
    }
  }
  const annule = () => { if (doigt?.t) finir(doigt.t, false); doigt = null }

  // ─── Surligner : sélection dans un seul paragraphe ───
  const selection = () => {
    if (!surligneur) return
    const sel = document.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) { o.onSelection(null); return }
    const el = (n: Node | null) => (n instanceof Element ? n : n?.parentElement)?.closest<HTMLElement>("[data-b]")
    const a = el(sel.anchorNode), z = el(sel.focusNode)
    const pg = a?.closest<HTMLElement>(".page[data-c]")
    const t = sel.toString().replace(/\s+/g, " ").trim()
    if (!a || a !== z || !pg || !ouvert.contains(pg) || t.length < 3) { o.onSelection(null); return }
    const r = sel.getRangeAt(0).getBoundingClientRect()
    o.onSelection({ c: Number(pg.dataset.c), b: Number(a.dataset.b), t, x: r.left + r.width / 2, y: Math.max(60, r.top - 10) })
  }

  let redim: ReturnType<typeof setTimeout> | undefined
  const redimension = () => {
    clearTimeout(redim)
    redim = setTimeout(() => { if (tour) return; const b = info().premier; cache = new Map(); allerBloc(courant.c, b) }, 200)
  }

  scene.addEventListener("pointerdown", bas)
  scene.addEventListener("pointermove", bouge)
  scene.addEventListener("pointerup", haut)
  scene.addEventListener("pointercancel", annule)
  document.addEventListener("selectionchange", selection)
  window.addEventListener("resize", redimension)
  document.fonts?.addEventListener("loadingdone", redimension)

  if (o.depart) allerBloc(Math.min(o.depart.c, nbChap - 1), o.depart.b)
  else { courant = { c: 0, i: 0 }; rendre() }

  return {
    tourner,
    rendre: () => { if (!tour) rendre() },
    allerChapitre: (c: number) => { if (!tour) { courant = caler({ c, i: 0 }); rendre() } },
    allerBloc: (c: number, b: number) => { if (!tour) allerBloc(c, b) },
    allerPage: (i: number) => { if (!tour) { courant = caler({ c: courant.c, i }); rendre() } },
    taille: (t: number) => { const b = info().premier; taille = t; cache = new Map(); allerBloc(courant.c, b) },
    surligneur: (v: boolean) => { surligneur = v; scene.classList.toggle("surligner", v); if (!v) o.onSelection(null) },
    detruire: () => {
      fini = true
      clearTimeout(redim)
      scene.removeEventListener("pointerdown", bas)
      scene.removeEventListener("pointermove", bouge)
      scene.removeEventListener("pointerup", haut)
      scene.removeEventListener("pointercancel", annule)
      document.removeEventListener("selectionchange", selection)
      window.removeEventListener("resize", redimension)
      document.fonts?.removeEventListener("loadingdone", redimension)
    },
  }
}

export type Lecteur = ReturnType<typeof creerLecteur>
