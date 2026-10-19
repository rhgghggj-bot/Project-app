import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate"

// Partager une note du carnet sans rien stocker sur le serveur : la note est
// compressée dans le lien lui-même (après le #, jamais envoyé au serveur).
// Les images restent privées : elles sont remplacées par une mention.

export type NotePartagee = { titre: string; html: string; de?: string }

const enBase64Url = (u: Uint8Array) => {
  let s = ""
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000))
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}
const deBase64Url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0))

export const LIEN_MAX = 60_000   // au-delà, certaines messageries coupent le lien

export function lienDePartage(note: NotePartagee, origine = window.location.origin) {
  const html = note.html.replace(/<img\b[^>]*>/gi, "<p><i>[image non partagée]</i></p>")
  const code = enBase64Url(deflateSync(strToU8(JSON.stringify({ ...note, html })), { level: 9 }))
  return `${origine}/etudes/partage#${code}`
}

export function lireNotePartagee(code: string): NotePartagee | null {
  try {
    const n = JSON.parse(strFromU8(inflateSync(deBase64Url(code))))
    return typeof n?.titre === "string" && typeof n?.html === "string" ? n : null
  } catch { return null }
}
