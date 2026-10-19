// Écrire confortablement au téléphone, en portrait comme en paysage : la ligne
// où l'on tape reste toujours au-dessus du clavier, même après une rotation.

export function estEditable(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false
  if (el.isContentEditable) return true
  if (el instanceof HTMLTextAreaElement) return true
  return el instanceof HTMLInputElement && !["button", "checkbox", "radio", "range", "file", "submit", "color"].includes(el.type)
}

// Premier parent qui défile verticalement (sinon la page elle-même)
function parentQuiDefile(el: Element | null): Element | null {
  for (let p = el?.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY
    if ((o === "auto" || o === "scroll") && p.scrollHeight > p.clientHeight + 1) return p
  }
  return null
}

// Rectangle du curseur : dans un texte enrichi on prend la position exacte du
// curseur ; dans un champ, le champ entier.
function rectCurseur(el: HTMLElement): DOMRect | null {
  if (el.isContentEditable) {
    const sel = document.getSelection()
    if (sel?.rangeCount && el.contains(sel.focusNode)) {
      const r = sel.getRangeAt(0).cloneRange()
      r.collapse(false)
      const rects = r.getClientRects()
      const rect = rects[rects.length - 1] ?? r.getBoundingClientRect()
      if (rect && (rect.height || rect.top)) return rect
      // Ligne vide : on mesure l'élément qui contient le curseur
      const n = sel.focusNode
      const bloc = n instanceof Element ? n : n?.parentElement
      if (bloc) return bloc.getBoundingClientRect()
    }
    return null
  }
  return el.getBoundingClientRect()
}

// Fait défiler juste ce qu'il faut pour que le curseur soit dans la partie visible
export function garderCurseurVisible(marge = 28) {
  const el = document.activeElement
  if (!estEditable(el)) return
  const rect = rectCurseur(el)
  if (!rect) return
  const vv = window.visualViewport
  const haut = vv ? vv.offsetTop : 0
  const bas = vv ? vv.offsetTop + vv.height : window.innerHeight
  let delta = 0
  if (rect.bottom > bas - marge) delta = rect.bottom - (bas - marge)
  else if (rect.top < haut + marge) delta = rect.top - (haut + marge)
  if (Math.abs(delta) < 2) return
  const conteneur = parentQuiDefile(el.isContentEditable ? el : el.parentElement)
  if (conteneur) conteneur.scrollBy({ top: delta })
  else window.scrollBy({ top: delta })
}

// Clavier ouvert : la partie visible est nettement plus petite que l'écran
export function clavierOuvert() {
  const vv = window.visualViewport
  return !!vv && estEditable(document.activeElement) && vv.height < window.innerHeight - 120
}
