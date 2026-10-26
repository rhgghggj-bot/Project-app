// Vidéothèque de l'espace étudiant : vidéos YouTube choisies (lues dans
// l'appli, sans quitter Nexia) et vidéos ajoutées par l'élève. L'état (vues,
// favoris, vidéos perso) est gardé dans l'espace privé de l'élève, comme la
// bibliothèque, pour suivre d'un appareil à l'autre.

import { supabase } from "./supabase"
import { memoriser, relire } from "./horsLigne"
import type { VideoPerso } from "./videosPerso"

export type Video = { id: string; titre: string; chaine: string; duree?: string; note?: string }
export type Collection = { id: string; titre: string; sport: string; desc: string; videos: Video[] }

export const COLLECTIONS: Collection[] = [
  {
    id: "abalo", sport: "Handball", titre: "Luc Abalo, l'artiste de l'aile droite",
    desc: "Ailier droit de l'équipe de France, triple champion olympique (2008, 2012, 2021), célèbre pour ses tirs impossibles depuis l'aile.",
    videos: [
      { id: "hwT9MiyvOq0", titre: "Luc Abalo, From Another World", chaine: "BD Productions", duree: "4:31" },
      { id: "YvkP2lXvJ1o", titre: "Luc Abalo, The Artist of Handball (mini-documentaire)", chaine: "EHF Home of Handball", duree: "7:18", note: "Documentaire officiel de la Fédération européenne." },
      { id: "1ejOPs7W1S0", titre: "Top 15 des buts de Luc Abalo", chaine: "72Handball", duree: "4:06" },
      { id: "-hbCFUh7U2k", titre: "Luc Abalo, top 10 goals", chaine: "davidhannabenjamin", duree: "2:53" },
      { id: "OdBUXtjA8Lk", titre: "Ses meilleurs buts à l'Euro 2010 avec la France", chaine: "Yager007", duree: "3:34" },
      { id: "xZ4UJ2YFEmc", titre: "Le meilleur de Luc Abalo au PSG (2012-2020)", chaine: "PSG Handball", duree: "18:17" },
    ],
  },
  {
    id: "ailiers-noirs", sport: "Handball", titre: "Ailiers droits noirs : les références",
    desc: "Les joueurs noirs qui ont marqué l'aile droite (et le côté droit) au plus haut niveau, à commencer par l'école française.",
    videos: [
      { id: "hwT9MiyvOq0", titre: "Luc Abalo, From Another World", chaine: "BD Productions", duree: "4:31", note: "Ailier droit, France." },
      { id: "EeSInCUyWDw", titre: "Benoît Kounkoud, best of 2017-2018", chaine: "YS 24 Handball Video", duree: "3:30", note: "Ailier droit, formé au PSG, international français." },
      { id: "BXRVz86jS4Y", titre: "Top buts : merci Benoît ! (Kounkoud au PSG)", chaine: "PSG Handball", duree: "3:14" },
      { id: "UxTM3wO6npk", titre: "Benoît Kounkoud, but en kempa contre Ivry", chaine: "PSG Handball", duree: "0:15" },
      { id: "UQBnvc1mx_Q", titre: "Best of Melvyn Richardson (FC Barcelone, 2024)", chaine: "TOP HANDBALL", duree: "4:18", note: "Gaucher, arrière droit et ailier droit, international français." },
      { id: "1L8vfU_AHvI", titre: "L'exercice de tir par Melvyn Richardson", chaine: "Montpellier Handball", duree: "1:12" },
      { id: "5PW6l0FSvls", titre: "Best of Dika Mem, The Bomber (Barça 2022-23)", chaine: "YS 24 Handball Video", duree: "3:21", note: "Bonus : arrière droit (pas ailier), gaucher, international français." },
    ],
  },
  {
    id: "legendes-aile-droite", sport: "Handball", titre: "Légendes de l'aile droite",
    desc: "Les grands ailiers droits des 20 dernières années, chez les hommes et chez les femmes.",
    videos: [
      { id: "xNitDH5ZV94", titre: "Ivan Čupić : ses 31 buts à l'Euro 2010", chaine: "davidhannabenjamin", duree: "4:26", note: "Croatie." },
      { id: "ka5FKE4p4Ww", titre: "Ivan Čupić offre le titre européen à Vardar contre le PSG", chaine: "EHF Home of Handball", duree: "1:07" },
      { id: "SXGCleiTJpk", titre: "Hans Lindberg, all time best goals", chaine: "Handball Nation", duree: "3:53", note: "Danemark." },
      { id: "MI1Yhvg-75U", titre: "Best of Lasse Svan (Flensburg)", chaine: "Flex Handball Videos", duree: "4:13", note: "Danemark." },
      { id: "PQbq1tsrFnc", titre: "Best of Patrick Groetzki (2014-2015)", chaine: "BD Productions", duree: "4:42", note: "Allemagne." },
      { id: "3-d-5dOWmtY", titre: "Best of Blaž Janc (FC Barcelone, 2023-24)", chaine: "TOP HANDBALL", duree: "3:08", note: "Slovénie." },
      { id: "ywzphaPds2E", titre: "Le meilleur de Ferran Solé", chaine: "YS 24 Handball Video", duree: "3:52", note: "Espagne." },
      { id: "w2kG1hRsCls", titre: "Blaž Janc contre Ferran Solé : les meilleurs ailiers droits", chaine: "Handball Addiction", duree: "7:40" },
      { id: "22CwMDFQ-TI", titre: "Jovanka Radičević, Heart of a Lioness", chaine: "EHF Home of Handball", duree: "8:35", note: "Monténégro, l'une des meilleures ailières droites de l'histoire." },
      { id: "0I_2Ex0F5Cw", titre: "Jovanka Radičević, ailière droite de l'équipe type du Mondial 2015", chaine: "IHF", duree: "1:54" },
    ],
  },
  {
    id: "technique-ailier", sport: "Handball", titre: "Technique : progresser à l'aile droite",
    desc: "Tirs, angles, roucoulette, kempa : des tutoriels pour travailler ce qu'on voit faire aux meilleurs.",
    videos: [
      { id: "0vhHcidXR3o", titre: "Comment tirer depuis l'aile droite quand on est droitier", chaine: "iHandball", duree: "7:27" },
      { id: "pTlKqF4Q0Yo", titre: "Ailier : tirer au premier poteau (long corner)", chaine: "iCoach Handball", duree: "0:47" },
      { id: "lREKt5Mo92I", titre: "La roucoulette (spin shot) de l'ailier", chaine: "iCoach Handball", duree: "1:06" },
      { id: "zXb6ssKlnhM", titre: "La roucoulette en 4 étapes (avancé)", chaine: "SH Handball", duree: "1:00" },
      { id: "7Zm5HgoqBfw", titre: "Le kempa depuis l'aile, masterclass avec Johannes Sellin", chaine: "Opel Handball-Bundesliga", duree: "1:56", note: "En allemand, mais tout se comprend en regardant." },
      { id: "wEhnaFSxCD8", titre: "Le saut de l'ailier pour le kempa", chaine: "handball.inspires", duree: "7:39" },
      { id: "g37lVSpFUNo", titre: "Comment faire progresser les ailiers : l'exemple de Chloé Valentini", chaine: "Nico Tournadour", duree: "27:44" },
      { id: "n4Uei7aZsxI", titre: "Côté gardien : la parade sur tir d'aile", chaine: "PATAGAUCHE", duree: "5:06", note: "Comprendre ce que fait le gardien pour mieux le battre." },
    ],
  },
]

// Identifiant d'une vidéo YouTube à partir d'un lien (watch, youtu.be, shorts, embed)
export function idYoutube(lien: string): string | null {
  const t = lien.trim()
  if (/^[\w-]{11}$/.test(t)) return t
  const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(t)
  return m ? m[1] : null
}

export const miniature = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
export const lecteurYoutube = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`

export type EtatVideos = { vues: Record<string, string>; favoris: string[]; perso: (Video & { collection: string })[]; entrainements: VideoPerso[]; musique?: { favoris: string[]; apprises: string[] } }
export const ETAT_VIDE: EtatVideos = { vues: {}, favoris: [], perso: [], entrainements: [], musique: { favoris: [], apprises: [] } }

const chemin = (uid: string) => `${uid}/videos/etat.json`

// Une copie reste sur l'appareil : la liste (et les vidéos gardées) s'affiche sans réseau
const copie = (uid: string) => `videos:${uid}`

export async function chargerEtatVideos(uid: string): Promise<EtatVideos> {
  const local = relire<EtatVideos>(copie(uid))
  const { data } = await supabase.storage.from("etudes").download(chemin(uid))
  // Pas de réseau (ou fichier pas encore créé) : la copie de l'appareil
  if (!data) return { ...ETAT_VIDE, ...(local ?? {}) }
  try { const e = { ...ETAT_VIDE, ...JSON.parse(await data.text()) }; memoriser(copie(uid), e); return e } catch { return { ...ETAT_VIDE, ...(local ?? {}) } }
}

export async function enregistrerEtatVideos(uid: string, e: EtatVideos): Promise<boolean> {
  memoriser(copie(uid), e)
  const { error } = await supabase.storage.from("etudes").upload(chemin(uid),
    new Blob([JSON.stringify(e)], { type: "application/json" }), { upsert: true, contentType: "application/json" })
  return !error
}

// Titre et chaîne d'une vidéo ajoutée (service public oEmbed de YouTube)
export async function infosYoutube(id: string): Promise<{ titre: string; chaine: string } | null> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent("https://www.youtube.com/watch?v=" + id)}`)
    if (!r.ok) return null
    const j = await r.json()
    return { titre: String(j.title || "Vidéo YouTube"), chaine: String(j.author_name || "") }
  } catch { return null }
}
