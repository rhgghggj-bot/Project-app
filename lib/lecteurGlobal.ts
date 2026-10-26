// Lecteur partagé par toute l'appli : la vidéo ou la musique continue quand on
// change de page. Une fenêtre (vidéo, chanson, album) « prête » un emplacement
// où le lecteur s'affiche en grand ; quand elle se ferme, le lecteur devient
// une petite barre en bas de l'écran.

import { useSyncExternalStore } from "react"

export type Lecture = { src: string; titre: string; sousTitre?: string }
type Etat = { lecture: Lecture | null; ancre: HTMLElement | null; liste: boolean }

let etat: Etat = { lecture: null, ancre: null, liste: false }
const abonnes = new Set<() => void>()
const changer = (e: Partial<Etat>) => { etat = { ...etat, ...e }; abonnes.forEach(f => f()) }

export function jouer(l: Lecture) {
  if (etat.lecture?.src !== l.src) changer({ lecture: l, liste: false })
}
export const arreter = () => changer({ lecture: null, liste: false })
// Liste des titres (album, playlist) pour choisir ce qu'on écoute
export const ouvrirListe = () => changer({ liste: true })
export const fermerListe = () => changer({ liste: false })
export const poserAncre = (el: HTMLElement) => changer({ ancre: el })
export function retirerAncre(el: HTMLElement) { if (etat.ancre === el) changer({ ancre: null }) }

const abonner = (f: () => void) => { abonnes.add(f); return () => { abonnes.delete(f) } }
export const useLecteur = () => useSyncExternalStore(abonner, () => etat, () => etat)
