// Vidéos d'entraînement filmées par l'élève : compressées dans le navigateur,
// envoyées dans son espace privé (bucket « etudes », dossier <uid>/videos-perso)
// et gardées sur l'appareil (Cache Storage) pour être regardées sans réseau.

import { supabase } from "./supabase"

export type VideoPerso = {
  id: string; titre: string; theme: string; date: string
  duree: number; taille: number; chemin: string; type: string
  apercu?: string            // petite image JPEG (data URL), visible même hors connexion
}

export const THEMES_ENTRAINEMENT = ["Tirs", "Kempa", "Roucoulette", "Course et appuis", "Défense", "Match", "Autre"] as const

const CACHE = "nexia-videos-perso"
const cle = (id: string) => `/videos-perso/${id}`

// ─── Compression (réencodage en 720p environ, ~1,8 Mbit/s) ───
// La vidéo est rejouée en silence dans une page cachée et filmée à nouveau :
// cela prend autant de temps que la vidéo dure.
const BITS_VIDEO = 1_800_000
const COTE_MAX = 1280

function typeEnregistrement(): string | null {
  if (typeof MediaRecorder === "undefined") return null
  for (const t of ["video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]) {
    if (MediaRecorder.isTypeSupported(t)) return t
  }
  return null
}

export type Compressee = { blob: Blob; type: string; duree: number; apercu?: string }

export async function preparerVideo(fichier: File, onProgres: (p: number) => void): Promise<Compressee> {
  const url = URL.createObjectURL(fichier)
  const video = document.createElement("video")
  video.src = url; video.playsInline = true; video.preload = "auto"; video.crossOrigin = "anonymous"
  try {
    await new Promise<void>((ok, ko) => { video.onloadedmetadata = () => ok(); video.onerror = () => ko(new Error("Cette vidéo ne peut pas être lue par le navigateur")) })
    const duree = isFinite(video.duration) ? video.duration : 0
    const k = Math.min(1, COTE_MAX / Math.max(video.videoWidth, video.videoHeight))
    const w = Math.round((video.videoWidth * k) / 2) * 2, h = Math.round((video.videoHeight * k) / 2) * 2
    const apercu = await image(video, w, h)
    const type = typeEnregistrement()
    // Petite vidéo, ou navigateur sans enregistreur : on garde le fichier tel quel
    if (fichier.size <= 12 * 1024 * 1024 || !type) {
      if (fichier.size > 50 * 1024 * 1024) throw new Error("Vidéo trop lourde (plus de 50 Mo) et ce navigateur ne sait pas la compresser")
      onProgres(1)
      return { blob: fichier, type: fichier.type || "video/mp4", duree, apercu }
    }
    const canvas = document.createElement("canvas")
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext("2d")!
    const flux = canvas.captureStream(30)
    // Le son passe par le graphe audio (sans sortir des haut-parleurs)
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const audio = new AC()
    try {
      const sortie = audio.createMediaStreamDestination()
      audio.createMediaElementSource(video).connect(sortie)
      sortie.stream.getAudioTracks().forEach(t => flux.addTrack(t))
    } catch { /* vidéo sans son */ }
    const morceaux: Blob[] = []
    const rec = new MediaRecorder(flux, { mimeType: type, videoBitsPerSecond: BITS_VIDEO, audioBitsPerSecond: 96_000 })
    rec.ondataavailable = e => { if (e.data.size) morceaux.push(e.data) }
    const fini = new Promise<void>(ok => { rec.onstop = () => ok() })
    let actif = true
    const dessiner = () => {
      if (!actif) return
      ctx.drawImage(video, 0, 0, w, h)
      if (duree) onProgres(Math.min(0.99, video.currentTime / duree))
      requestAnimationFrame(dessiner)
    }
    video.currentTime = 0
    await audio.resume().catch(() => {})
    rec.start(1000)
    await video.play()
    dessiner()
    await new Promise<void>(ok => { video.onended = () => ok() })
    actif = false
    rec.stop()
    await fini
    audio.close().catch(() => {})
    const blob = new Blob(morceaux, { type: type.split(";")[0] })
    onProgres(1)
    // Si la compression n'a rien gagné, on garde l'original
    if (blob.size > fichier.size || blob.size < 1000) return { blob: fichier, type: fichier.type || "video/mp4", duree, apercu }
    return { blob, type: type.split(";")[0], duree, apercu }
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Petite image d'aperçu, prise à une demi-seconde
async function image(video: HTMLVideoElement, w: number, h: number): Promise<string | undefined> {
  try {
    video.currentTime = Math.min(0.5, (video.duration || 1) / 2)
    await new Promise<void>(ok => { video.onseeked = () => ok(); setTimeout(ok, 1500) })
    const c = document.createElement("canvas")
    const k = 320 / Math.max(w, h)
    c.width = Math.round(w * k); c.height = Math.round(h * k)
    c.getContext("2d")!.drawImage(video, 0, 0, c.width, c.height)
    return c.toDataURL("image/jpeg", 0.6)
  } catch { return undefined }
}

// ─── Envoi, copie sur l'appareil, lecture ───
export async function envoyerVideo(uid: string, id: string, c: Compressee): Promise<string> {
  const ext = c.type.includes("webm") ? "webm" : c.type.includes("quicktime") ? "mov" : "mp4"
  const chemin = `${uid}/videos-perso/${id}.${ext}`
  const { error } = await supabase.storage.from("etudes").upload(chemin, c.blob, { contentType: c.type, upsert: false })
  if (error) throw new Error(/size|large|exceed/i.test(error.message) ? "Vidéo trop lourde pour ton stockage (limite par fichier)" : /mime|type/i.test(error.message) ? "Ton espace de stockage n'accepte pas encore les vidéos" : "Envoi impossible, vérifie ta connexion")
  await garderSurAppareil(id, c.blob)
  return chemin
}

export async function garderSurAppareil(id: string, blob: Blob) {
  try { await (await caches.open(CACHE)).put(cle(id), new Response(blob, { headers: { "Content-Type": blob.type } })) } catch { /* stockage du navigateur indisponible */ }
}

export async function surAppareil(id: string): Promise<boolean> {
  try { return !!(await (await caches.open(CACHE)).match(cle(id))) } catch { return false }
}

// La vidéo depuis l'appareil si elle y est, sinon depuis le serveur (puis gardée)
export async function lireVideo(v: VideoPerso): Promise<Blob> {
  try {
    const r = await (await caches.open(CACHE)).match(cle(v.id))
    if (r) return await r.blob()
  } catch { /* on passe par le serveur */ }
  const { data } = await supabase.storage.from("etudes").createSignedUrl(v.chemin, 3600)
  if (!data?.signedUrl) throw new Error("Vidéo indisponible : connecte-toi une première fois pour la télécharger sur cet appareil")
  const r = await fetch(data.signedUrl)
  if (!r.ok) throw new Error("Téléchargement impossible")
  const blob = await r.blob()
  await garderSurAppareil(v.id, blob)
  return blob
}

export async function supprimerVideo(v: VideoPerso) {
  await supabase.storage.from("etudes").remove([v.chemin])
  try { await (await caches.open(CACHE)).delete(cle(v.id)) } catch { /* rien à faire */ }
}

export const taille = (o: number) => (o >= 1e9 ? `${(o / 1e9).toFixed(2).replace(".", ",")} Go` : `${Math.max(0.1, o / 1e6).toFixed(1).replace(".", ",")} Mo`)
export const duree = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`
