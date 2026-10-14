import type { CSSProperties } from "react"

// Papier des notes : petits carreaux de 6 mm environ (24 px) comme les
// cahiers d'école suisses et français. Une ligne de texte occupe un carreau.
export const CARREAU = 24
const LIGNE = "rgba(43,127,255,0.13)"

export const FOND_CAHIER: CSSProperties = {
  backgroundColor: "#fff",
  backgroundImage: `linear-gradient(${LIGNE} 1px, transparent 1px), linear-gradient(90deg, ${LIGNE} 1px, transparent 1px)`,
  backgroundSize: `${CARREAU}px ${CARREAU}px`,
}

// Même papier avec la marge rouge à gauche
export const FOND_PAGE: CSSProperties = {
  ...FOND_CAHIER,
  backgroundImage: `linear-gradient(90deg, transparent 39px, rgba(225,29,72,0.45) 39px, rgba(225,29,72,0.45) 41px, transparent 41px), ${FOND_CAHIER.backgroundImage}`,
  backgroundSize: `100% 100%, ${CARREAU}px ${CARREAU}px, ${CARREAU}px ${CARREAU}px`,
}
