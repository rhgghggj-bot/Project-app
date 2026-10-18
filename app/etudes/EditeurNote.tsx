"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast, confirmer } from "@/lib/toast"
import { colors, radius } from "@/app/components/ui/tokens"
import { chapitreVisible, chargerProgramme } from "@/lib/programmes"
import { chargerFichesPerso } from "@/lib/fichesPerso"
import { cheminsImages, compresserImage, nettoyerHtml, normaliser, texteBrut, type Dossier, type NoteCarnet } from "@/lib/carnet"
import type { Pays } from "@/lib/etudes"
import { CARREAU, FOND_PAGE } from "./cahier"
import Dessin from "./Dessin"
import { caveat, lora } from "./polices"

// Éditeur plein écran d'une note du carnet. Le texte est mis en forme dans
// un contentEditable (titres, gras, surligneur, listes, cases à cocher),
// avec photos et dessins rangés dans le stockage privé de l'élève.
// Enregistrement automatique moins d'une seconde après la dernière frappe.

const CLE_BROUILLON = "carnet-brouillon:"

function lireBrouillon(note: NoteCarnet): { titre: string; html: string } | null {
  try {
    const b = JSON.parse(localStorage.getItem(CLE_BROUILLON + note.id) || "null")
    return b && b.le > note.updated_at ? b : null
  } catch { return null }
}
function ecrireBrouillon(id: string, titre: string, html: string) {
  try { localStorage.setItem(CLE_BROUILLON + id, JSON.stringify({ titre, html, le: new Date().toISOString() })) } catch {}
}
function effacerBrouillon(id: string) {
  try { localStorage.removeItem(CLE_BROUILLON + id) } catch {}
}

export type ContexteProgramme = { pays: Pays; niveauId: string | null; filiere: string | null; specialites: string[] }

type Meta = { titre: string; dossier_id: string | null; epingle: boolean; chapitre_id: string | null }
type Statut = "pret" | "modifie" | "enregistrement" | "enregistre" | "erreur"

const SURLIGNEUR = "#FFE66D"

// Tailles : valeur de execCommand("fontSize") (1-7) → nom gardé dans la note
export const TAILLES = [
  { id: "s", nom: "Petit", commande: "2", px: 13 },
  { id: "", nom: "Normal", commande: "3", px: 16 },
  { id: "l", nom: "Grand", commande: "5", px: 20 },
  { id: "xl", nom: "Très grand", commande: "6", px: 26 },
] as const
// Taille du passage où est le curseur, au format des boutons ("" = normal)
function tailleAffichee(el: Element): string {
  const d = el.getAttribute("data-taille")
  if (d) return d === "m" ? "" : d
  const n = Number(el.getAttribute("size"))
  return n <= 2 ? "s" : n === 3 ? "" : n <= 5 ? "l" : "xl"
}

export const POLICES = [
  { id: "", nom: "Standard", css: "var(--font-geist-sans), sans-serif" },
  { id: "titre", nom: "Titre", css: "var(--font-display), sans-serif" },
  { id: "livre", nom: "Livre", css: "var(--font-lora), Georgia, serif" },
  { id: "main", nom: "Manuscrite", css: "var(--font-caveat), cursive" },
  { id: "machine", nom: "Machine", css: "var(--font-geist-mono), monospace" },
] as const

const STYLES = `
.carnet-page{outline:none;min-height:calc(100dvh - 260px);padding:0 16px ${CARREAU * 4}px 52px;font-size:16px;line-height:${CARREAU}px;color:${colors.text};word-wrap:break-word}
.carnet-page p,.carnet-page h2,.carnet-page h3,.carnet-page ul,.carnet-page ol{margin:0}
.carnet-page h2{font-family:var(--font-display),sans-serif;font-size:21px;font-weight:700;line-height:${CARREAU}px;padding-top:${CARREAU}px}
.carnet-page h3{font-size:16px;font-weight:650;color:${colors.blue};line-height:${CARREAU}px}
.carnet-page ul,.carnet-page ol{padding-left:${CARREAU}px}
.carnet-page mark{background:${SURLIGNEUR};color:inherit;border-radius:2px;padding:0 1px}
.carnet-page ul[data-liste="cases"]{list-style:none;padding-left:4px}
.carnet-page ul[data-liste="cases"] li{position:relative;padding-left:28px}
.carnet-page ul[data-liste="cases"] li::before{content:"";position:absolute;left:0;top:3px;width:18px;height:18px;border:1.5px solid ${colors.navyMid};border-radius:4px;background:#fff;cursor:pointer}
.carnet-page ul[data-liste="cases"] li[data-fait="1"]{color:${colors.textMuted};text-decoration:line-through}
.carnet-page ul[data-liste="cases"] li[data-fait="1"]::before{background:${colors.blue};border-color:${colors.blue};background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M3.5 8.5l3 3 6-7' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")}
.carnet-page img{display:block;max-width:100%;max-height:420px;margin:${CARREAU / 2}px 0;border-radius:6px;box-shadow:0 1px 6px rgba(10,22,40,.12)}
.carnet-page img[src=""],.carnet-page img:not([src]){min-height:120px;width:60%;background:${colors.blueLight}}
.carnet-titre{font-size:27px !important}
.carnet-page font[size="1"],.carnet-page font[size="2"],.carnet-page [data-taille="s"]{font-size:13px}
.carnet-page font[size="3"],.carnet-page [data-taille="m"]{font-size:16px}
.carnet-page font[size="4"],.carnet-page font[size="5"],.carnet-page [data-taille="l"]{font-size:20px}
.carnet-page font[size="6"],.carnet-page font[size="7"],.carnet-page [data-taille="xl"]{font-size:26px;line-height:1.25}
.carnet-page font[face="titre"],.carnet-page [data-police="titre"]{font-family:var(--font-display),sans-serif}
.carnet-page font[face="livre"],.carnet-page [data-police="livre"]{font-family:var(--font-lora),Georgia,serif}
.carnet-page font[face="main"],.carnet-page [data-police="main"]{font-family:var(--font-caveat),cursive;font-size-adjust:0.53}
.carnet-page font[face="machine"],.carnet-page [data-police="machine"]{font-family:var(--font-geist-mono),monospace;font-size-adjust:0.5}
.carnet-page font[face="standard"],.carnet-page [data-police="standard"]{font-family:var(--font-geist-sans),sans-serif}
.carnet-menu{position:absolute;z-index:5;background:#fff;border:1px solid ${colors.blueBorder};border-radius:14px;box-shadow:0 10px 30px rgba(10,22,40,.15);padding:12px}
.carnet-choix{border:1px solid ${colors.blueBorder};background:#fff;border-radius:10px;min-height:40px;padding:0 12px;cursor:pointer;color:${colors.text}}
.carnet-choix[aria-pressed="true"]{border-color:${colors.navy};background:${colors.navy};color:#fff}
.carnet-titre::placeholder{color:#B8C2D6}
.carnet-page img[alt="Dessin"]{box-shadow:none;border-radius:0}
.carnet-page:empty::before{content:attr(data-vide);color:${colors.textFaint};pointer-events:none}
.carnet-outil{border:none;background:none;min-width:44px;height:44px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;gap:4px;color:${colors.text};font-size:15px;cursor:pointer;padding:0 8px;flex-shrink:0}
.carnet-outil[aria-pressed="true"]{background:${colors.navy};color:#fff}
.carnet-outil:focus-visible,.carnet-puce:focus-visible{outline:2px solid ${colors.blue};outline-offset:2px}
.carnet-puce{border:1px solid ${colors.blueBorder};background:#fff;border-radius:99px;padding:5px 11px;font-size:12.5px;color:${colors.text};cursor:pointer;display:inline-flex;align-items:center;gap:6px;max-width:100%}
`

function Outil({ label, actif, onAction, children }: { label: string; actif?: boolean; onAction: () => void; children: React.ReactNode }) {
  // pointerdown sans action par défaut : le curseur reste dans la note
  return (
    <button type="button" className="carnet-outil" aria-label={label} title={label} aria-pressed={actif}
      onPointerDown={e => e.preventDefault()} onMouseDown={e => e.preventDefault()} onClick={onAction}>
      {children}
    </button>
  )
}

function Icone({ d, titre }: { d: string; titre?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden={titre ? undefined : true}>
      <path d={d} />
    </svg>
  )
}
const ICONES = {
  puces: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  numeros: "M10 6h10M10 12h10M10 18h10M4 5h1v4M4 9h2M4 15.5c.4-.6 1-.9 1.6-.6.7.3.7 1.2 0 1.7L4 18h2.2",
  cases: "M4 5h5v5H4zM4 14h5v5H4zM13 7.5h7M13 16.5h7M5.3 16.4l1.3 1.3 2.2-2.6",
  photo: "M4 7h3l2-2h6l2 2h3v12H4zM12 16.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z",
  dessin: "M4 20l4-1 11-11-3-3L5 16zM14 7l3 3",
  epingle: "M9 4h6l-1 6 3 3H7l3-3zM12 13v7",
  corbeille: "M5 7h14M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  livre: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 21V5",
}

export default function EditeurNote({ userId, note, nouvelle, dossiers, contexte, onFermer, onOuvrirChapitre }: {
  userId: string
  note: NoteCarnet
  nouvelle: boolean
  dossiers: Dossier[]
  contexte: ContexteProgramme
  onFermer: (resultat: { note: NoteCarnet | null; supprimee: boolean }) => void
  onOuvrirChapitre: (id: string) => void
}) {
  const pageRef = useRef<HTMLDivElement>(null)
  const titreRef = useRef<HTMLTextAreaElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const plage = useRef<Range | null>(null)
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null)
  const existe = useRef(!nouvelle)
  // Modifications pas encore enregistrées en base
  const sale = useRef(false)
  // Enregistrement en cours : les suivants attendent qu'il soit fini
  const enVol = useRef<Promise<boolean> | null>(null)
  const supprimee = useRef(false)
  const apercus = useRef<string[]>([])
  const derniere = useRef<NoteCarnet>(note)

  // Brouillon local plus récent que la version en base (appli fermée en
  // pleine frappe, réseau coupé…) : on le reprend.
  const [brouillon] = useState(() => lireBrouillon(note))
  const meta = useRef<Meta>({ titre: brouillon?.titre ?? note.titre, dossier_id: note.dossier_id, epingle: note.epingle, chapitre_id: note.chapitre_id })

  const [titre, setTitre] = useState(brouillon?.titre ?? note.titre)
  const [dossierId, setDossierId] = useState(note.dossier_id)
  const [epingle, setEpingle] = useState(note.epingle)
  const [chapitreId, setChapitreId] = useState(note.chapitre_id)
  const [statut, setStatut] = useState<Statut>("pret")
  const [formats, setFormats] = useState<Record<string, boolean>>({})
  const [styleTexte, setStyleTexte] = useState<{ taille: string; police: string }>({ taille: "", police: "" })
  const [dessin, setDessin] = useState(false)
  const [choixChapitre, setChoixChapitre] = useState(false)
  const [chapitres, setChapitres] = useState<OptionLien[] | null>(null)
  const [envoi, setEnvoi] = useState(0)
  const [vue, setVue] = useState<{ haut: number; hauteur: number } | null>(null)
  const [menu, setMenu] = useState<"infos" | "texte" | null>(null)

  // Photos : liens signés (24 h) pour les images sans source
  function afficherImages() {
    const page = pageRef.current
    if (!page) return
    const sans = Array.from(page.querySelectorAll<HTMLImageElement>("img[data-chemin]:not([src])"))
    const chemins = [...new Set(sans.map(i => i.getAttribute("data-chemin")!))]
    if (!chemins.length) return
    supabase.storage.from("etudes").createSignedUrls(chemins, 86400).then(({ data }) => {
      for (const r of data || []) {
        if (!r.signedUrl || !r.path) continue
        page.querySelectorAll(`img[data-chemin="${CSS.escape(r.path)}"]`).forEach(img => img.setAttribute("src", r.signedUrl))
      }
    })
  }

  // Contenu initial
  useEffect(() => {
    const page = pageRef.current!
    page.innerHTML = nettoyerHtml(brouillon?.html ?? note.contenu)
    afficherImages()
    if (nouvelle) page.focus()
    const urls = apercus.current
    return () => urls.forEach(u => URL.revokeObjectURL(u))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clavier iOS : la feuille suit la partie visible de l'écran pour que la
  // barre d'outils et le curseur restent au-dessus du clavier
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const maj = () => setVue(Math.abs(vv.height - window.innerHeight) > 40 ? { haut: vv.offsetTop, hauteur: vv.height } : null)
    vv.addEventListener("resize", maj)
    vv.addEventListener("scroll", maj)
    return () => { vv.removeEventListener("resize", maj); vv.removeEventListener("scroll", maj) }
  }, [])

  // Le titre s'agrandit sur plusieurs lignes au lieu d'être coupé
  function ajusterTitre() {
    const t = titreRef.current
    if (!t) return
    t.style.height = "auto"
    t.style.height = `${t.scrollHeight}px`
  }
  useEffect(ajusterTitre, [])

  // Titre du chapitre relié (et liste pour le choisir)
  useEffect(() => {
    if (!chapitreId && !choixChapitre && menu !== "infos") return
    let actif = true
    // Mes cours (fiches importées ou créées) + chapitres du programme
    Promise.all([
      chargerFichesPerso(userId),
      contexte.niveauId ? chargerProgramme(contexte.pays, contexte.niveauId) : Promise.resolve(null),
    ]).then(([perso, prog]) => {
      if (!actif) return
      setChapitres([
        ...perso.map(f => ({ id: f.id, titre: f.titre, groupe: f.matiere, source: "perso" as const, cherche: `${f.titre} ${f.matiere}` })),
        ...(prog ? prog.chapitres.filter(c => chapitreVisible(c, contexte.filiere, contexte.specialites)).map(c => ({
          id: c.id, titre: c.titre, groupe: `${c.matiere}, ${c.annee}`, source: "programme" as const, cherche: `${c.titre} ${c.matiere} ${c.annee} ${c.notions.join(" ")}`,
        })) : []),
      ])
    })
    return () => { actif = false }
  }, [userId, contexte.pays, contexte.niveauId, contexte.filiere, contexte.specialites, chapitreId, choixChapitre, menu])

  // Mémorise la position du curseur (pour insérer une photo au bon endroit)
  // et l'état des boutons de mise en forme.
  useEffect(() => {
    function surSelection() {
      const sel = document.getSelection()
      const page = pageRef.current
      if (!sel || !sel.rangeCount || !page || !page.contains(sel.anchorNode)) return
      plage.current = sel.getRangeAt(0).cloneRange()
      const bloc = String(document.queryCommandValue("formatBlock") || "").toLowerCase()
      const ancre = sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode?.parentElement
      setFormats({
        h2: bloc === "h2", h3: bloc === "h3",
        bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"), underline: document.queryCommandState("underline"),
        mark: !!ancre?.closest('mark, span[style*="background-color"]'),
        cases: !!ancre?.closest('ul[data-liste="cases"]'),
        puces: !!ancre?.closest("ul:not([data-liste])"), numeros: !!ancre?.closest("ol"),
      })
      const t = ancre?.closest("font[size], [data-taille]")
      const f = ancre?.closest("font[face], [data-police]")
      setStyleTexte({
        taille: t ? tailleAffichee(t) : "",
        police: f ? ((f.getAttribute("data-police") ?? f.getAttribute("face") ?? "").replace("standard", "")) : "",
      })
    }
    document.addEventListener("selectionchange", surSelection)
    return () => document.removeEventListener("selectionchange", surSelection)
  }, [])

  function contenuActuel() {
    const contenu = nettoyerHtml(pageRef.current?.innerHTML ?? "")
    const texte = texteBrut(contenu)
    const vide = !meta.current.titre.trim() && !texte && cheminsImages(contenu).length === 0
    return { contenu, texte, vide }
  }

  // Envoie la version actuelle si elle a changé. Les appels sont mis en file :
  // une version plus ancienne ne peut jamais écraser une plus récente.
  async function enregistrer(): Promise<boolean> {
    if (minuteur.current) { clearTimeout(minuteur.current); minuteur.current = null }
    while (enVol.current) await enVol.current
    if (!sale.current || supprimee.current || !pageRef.current) return !sale.current
    const { contenu, texte, vide } = contenuActuel()
    // Note vide : rien à enregistrer (une note vidée est retirée à la fermeture)
    if (vide) { sale.current = false; setStatut("pret"); return true }
    sale.current = false
    const maj: NoteCarnet = { ...derniere.current, ...meta.current, titre: meta.current.titre.trim().slice(0, 200), contenu, texte, updated_at: new Date().toISOString() }
    setStatut("enregistrement")
    const envoiEnCours = (async () => {
      const { error } = await supabase.from("carnet_notes").upsert({ ...maj, user_id: userId })
      return !error
    })()
    enVol.current = envoiEnCours
    const ok = await envoiEnCours
    enVol.current = null
    if (!ok) { sale.current = true; setStatut("erreur"); return false }
    existe.current = true
    derniere.current = maj
    if (!sale.current) { effacerBrouillon(note.id); setStatut("enregistre") }
    return true
  }

  function planifier() {
    sale.current = true
    setStatut("modifie")
    ecrireBrouillon(note.id, meta.current.titre, pageRef.current?.innerHTML ?? "")
    if (minuteur.current) clearTimeout(minuteur.current)
    minuteur.current = setTimeout(() => { void enregistrer() }, 800)
  }

  function changerMeta(m: Partial<Meta>) {
    meta.current = { ...meta.current, ...m }
    if ("titre" in m) setTitre(m.titre!)
    if ("dossier_id" in m) setDossierId(m.dossier_id!)
    if ("epingle" in m) setEpingle(m.epingle!)
    if ("chapitre_id" in m) setChapitreId(m.chapitre_id!)
    planifier()
  }

  async function supprimerEnBase(): Promise<boolean> {
    supprimee.current = true
    if (minuteur.current) { clearTimeout(minuteur.current); minuteur.current = null }
    while (enVol.current) await enVol.current
    if (existe.current) {
      const { error } = await supabase.from("carnet_notes").delete().eq("id", note.id)
      if (error) { supprimee.current = false; return false }
    }
    effacerBrouillon(note.id)
    const dossier = `${userId}/notes/${note.id}`
    const { data } = await supabase.storage.from("etudes").list(dossier, { limit: 1000 })
    if (data?.length) await supabase.storage.from("etudes").remove(data.map(f => `${dossier}/${f.name}`))
    return true
  }

  async function fermer() {
    if (envoi > 0) return toast("Attends la fin de l'envoi de l'image", "info")
    const ok = await enregistrer()
    if (!ok) {
      const message = existe.current
        ? "Tes dernières modifications n'ont pas pu être enregistrées (connexion ?). Elles restent sur cet appareil et seront envoyées à la prochaine ouverture de la note. Quitter quand même ?"
        : "Cette nouvelle note n'a pas pu être enregistrée (connexion ?). Si tu quittes maintenant, elle sera perdue. Quitter quand même ?"
      if (!(await confirmer(message, "Quitter"))) return
    }
    if (ok && contenuActuel().vide) {
      // Note vidée : on la retire plutôt que de garder une page blanche
      if (existe.current) await supprimerEnBase()
      else effacerBrouillon(note.id)
      onFermer({ note: null, supprimee: existe.current })
      return
    }
    onFermer({ note: existe.current ? derniere.current : null, supprimee: false })
  }

  async function supprimer() {
    if (!(await confirmer("Supprimer cette note, ses photos et ses dessins ?", "Supprimer"))) return
    if (!(await supprimerEnBase())) { toast("Suppression impossible, vérifie ta connexion", "error"); planifier(); return }
    toast("Note supprimée", "success")
    onFermer({ note: null, supprimee: true })
  }

  // Brouillon repris : on l'envoie dès l'ouverture
  useEffect(() => {
    if (!brouillon) return
    sale.current = true
    minuteur.current = setTimeout(() => { void enregistrer() }, 300)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Envoie tout de suite si l'élève quitte l'onglet ou ferme l'appli
  useEffect(() => {
    function cache() { if (document.visibilityState === "hidden" && sale.current) void enregistrer() }
    function quitte() { if (sale.current) void enregistrer() }
    document.addEventListener("visibilitychange", cache)
    window.addEventListener("pagehide", quitte)
    return () => { document.removeEventListener("visibilitychange", cache); window.removeEventListener("pagehide", quitte) }
  })

  // Échap ferme la note (sauf si une fenêtre est ouverte par-dessus)
  useEffect(() => {
    function echap(e: KeyboardEvent) {
      if (e.key !== "Escape" || dessin || choixChapitre) return
      e.preventDefault()
      if (menu) setMenu(null)
      else void fermer()
    }
    window.addEventListener("keydown", echap)
    return () => window.removeEventListener("keydown", echap)
  })

  // ─── Mise en forme ───
  function remettreCurseur() {
    const page = pageRef.current!
    const sel = document.getSelection()
    // Curseur déjà dans la note : on n'y touche pas (le replacer effacerait
    // le style de frappe en cours, ex. gras désactivé)
    if (document.activeElement === page && sel?.anchorNode && page.contains(sel.anchorNode)) return
    page.focus()
    if (plage.current && sel) { sel.removeAllRanges(); sel.addRange(plage.current) }
  }

  function commande(nom: string, valeur?: string) {
    remettreCurseur()
    document.execCommand(nom, false, valeur)
    planifier()
    document.dispatchEvent(new Event("selectionchange"))
  }

  function blocCourant(): Element | null {
    const n = document.getSelection()?.anchorNode
    return n instanceof Element ? n : n?.parentElement ?? null
  }

  function surligner() {
    remettreCurseur()
    const sel = document.getSelection()
    const surligne = blocCourant()?.closest<HTMLElement>('mark, span[style*="background-color"]')
    if (surligne && sel?.isCollapsed) {
      // Curseur posé dans un passage surligné : la suite s'écrit sans surligneur
      const sortie = document.createTextNode("\u200B")
      surligne.after(sortie)
      const r = document.createRange()
      r.setStart(sortie, 1); r.collapse(true)
      sel.removeAllRanges(); sel.addRange(r)
    } else if (formats.mark) {
      document.execCommand("styleWithCSS", false, "true")
      document.execCommand("hiliteColor", false, "transparent")
      document.execCommand("styleWithCSS", false, "false")
      // Retire aussi les <mark> déjà nettoyés de la sélection
      const r = document.getSelection()?.rangeCount ? document.getSelection()!.getRangeAt(0) : null
      pageRef.current!.querySelectorAll("mark").forEach(m => { if (r?.intersectsNode(m)) m.replaceWith(...Array.from(m.childNodes)) })
    } else {
      document.execCommand("styleWithCSS", false, "true")
      document.execCommand("hiliteColor", false, SURLIGNEUR)
      document.execCommand("styleWithCSS", false, "false")
    }
    planifier()
    document.dispatchEvent(new Event("selectionchange"))
  }

  function taille(commandeTaille: string) {
    remettreCurseur()
    document.execCommand("styleWithCSS", false, "false")
    document.execCommand("fontSize", false, commandeTaille)
    planifier()
    document.dispatchEvent(new Event("selectionchange"))
  }

  function police(id: string) {
    remettreCurseur()
    document.execCommand("styleWithCSS", false, "false")
    document.execCommand("fontName", false, id || "standard")
    planifier()
    document.dispatchEvent(new Event("selectionchange"))
  }

  function titreBloc(tag: "h2" | "h3") {
    commande("formatBlock", formats[tag] ? "p" : tag)
  }

  function cases() {
    remettreCurseur()
    const liste = blocCourant()?.closest("ul")
    if (liste?.getAttribute("data-liste") === "cases") {
      liste.removeAttribute("data-liste")
      liste.querySelectorAll("li[data-fait]").forEach(li => li.removeAttribute("data-fait"))
      document.execCommand("insertUnorderedList")
    } else {
      if (!liste) document.execCommand("insertUnorderedList")
      blocCourant()?.closest("ul")?.setAttribute("data-liste", "cases")
    }
    planifier()
    document.dispatchEvent(new Event("selectionchange"))
  }

  function surClic(e: React.MouseEvent) {
    const li = (e.target as Element).closest('ul[data-liste="cases"] > li')
    if (!li) return
    if (e.clientX - li.getBoundingClientRect().left > 32) return
    e.preventDefault()
    basculer(li)
  }

  function basculer(li: Element) {
    if (li.getAttribute("data-fait") === "1") li.removeAttribute("data-fait")
    else li.setAttribute("data-fait", "1")
    planifier()
  }

  function surTouche(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      // Une nouvelle case n'hérite pas de la coche de la précédente
      setTimeout(() => {
        const li = blocCourant()?.closest("li")
        if (li && !li.textContent) li.removeAttribute("data-fait")
      }, 0)
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); void enregistrer() }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      // Cocher / décocher la case de la ligne au clavier
      const li = blocCourant()?.closest('ul[data-liste="cases"] > li')
      if (li) { e.preventDefault(); basculer(li) }
    }
  }

  function surCollage(e: React.ClipboardEvent) {
    e.preventDefault()
    const html = e.clipboardData.getData("text/html")
    if (html) document.execCommand("insertHTML", false, nettoyerHtml(html))
    else document.execCommand("insertText", false, e.clipboardData.getData("text/plain"))
    afficherImages()
    planifier()
  }

  // ─── Photos et dessins ───
  async function insererImage(fichier: Blob, extension: "jpg" | "png", alt: string) {
    setEnvoi(n => n + 1)
    const chemin = `${userId}/notes/${note.id}/${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage.from("etudes").upload(chemin, fichier, { contentType: extension === "png" ? "image/png" : "image/jpeg" })
    setEnvoi(n => n - 1)
    if (error) return toast("Image non envoyée, vérifie ta connexion", "error")
    if (!pageRef.current) return
    remettreCurseur()
    const apercu = URL.createObjectURL(fichier)
    apercus.current.push(apercu)
    // L'image se place sous le bloc où est le curseur (jamais au milieu d'une
    // liste ou d'un titre), suivie d'une ligne vide pour continuer à écrire.
    const page = pageRef.current
    let bloc: Node | null = document.getSelection()?.anchorNode ?? null
    while (bloc && bloc.parentNode !== page) bloc = bloc.parentNode
    const img = document.createElement("img")
    img.setAttribute("data-chemin", chemin)
    img.setAttribute("alt", alt)
    img.src = apercu
    const suite = document.createElement("p")
    suite.appendChild(document.createElement("br"))
    if (bloc) bloc.parentNode!.insertBefore(suite, bloc.nextSibling)
    else page.appendChild(suite)
    page.insertBefore(img, suite)
    const r = document.createRange()
    r.setStart(suite, 0); r.collapse(true)
    const sel = document.getSelection()
    sel?.removeAllRanges(); sel?.addRange(r)
    planifier()
  }

  async function choisirPhoto(f: File) {
    if (!f.type.startsWith("image/")) return toast("Choisis une image", "error")
    try { await insererImage(await compresserImage(f), "jpg", "Photo") }
    catch { toast("Cette image ne peut pas être lue", "error") }
  }

  const chapitre = chapitres?.find(c => c.id === chapitreId) ?? null
  const libelleStatut = { pret: "", modifie: "Modifié", enregistrement: "Enregistrement…", enregistre: "Enregistré", erreur: "Non enregistré" }[statut]

  return (
    <div role="dialog" aria-modal="true" aria-label="Éditeur de note" className={`${lora.variable} ${caveat.variable}`} style={{ position: "fixed", left: 0, right: 0, top: vue?.haut ?? 0, height: vue?.hauteur ?? "100%", zIndex: 1100, background: "#fff", display: "flex", flexDirection: "column" }}>
      <style>{STYLES}</style>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", paddingTop: "calc(10px + env(safe-area-inset-top))", borderBottom: `1px solid ${colors.border}` }}>
        <button onClick={() => void fermer()} aria-label="Retour au carnet" disabled={envoi > 0} className="carnet-puce" style={{ border: "none", background: colors.blueLight, color: colors.blue, fontWeight: 600, fontSize: "13px", padding: "7px 13px" }}>← Carnet</button>
        <span style={{ flex: 1, fontSize: "12px", color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
          {statut === "erreur" ? (
            <>
              <span role="alert" style={{ color: "#C81E3F" }}>Non enregistré</span>
              <button onClick={() => void enregistrer()} style={{ background: "none", border: "none", color: "#1A5FD0", fontSize: "12px", cursor: "pointer", textDecoration: "underline", minHeight: 32 }}>Réessayer</button>
            </>
          ) : <span role="status">{envoi > 0 ? "Envoi de l'image…" : libelleStatut}</span>}
        </span>
        <button className="carnet-outil" aria-label="Dossier et chapitre" aria-expanded={menu === "infos"} title="Dossier et chapitre"
          onClick={() => setMenu(menu === "infos" ? null : "infos")} style={{ position: "relative" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
          {(dossierId || chapitreId) && <span aria-hidden="true" style={{ position: "absolute", top: 9, right: 9, width: 7, height: 7, borderRadius: "50%", background: colors.blue }} />}
        </button>
        <button className="carnet-outil" aria-pressed={epingle} aria-label="Épingler en haut du carnet" title="Épingler"
          onClick={() => changerMeta({ epingle: !epingle })}><Icone d={ICONES.epingle} /></button>
        <button className="carnet-outil" aria-label="Supprimer la note" title="Supprimer" onClick={supprimer} style={{ color: colors.red }}><Icone d={ICONES.corbeille} /></button>
      </div>

      <div role="toolbar" aria-label="Mise en forme" style={{ display: "flex", gap: "2px", padding: "4px 8px", overflowX: "auto", borderBottom: `1px solid ${colors.border}`, background: "#FBFCFF" }}>
        <Outil label="Taille et police" actif={menu === "texte"} onAction={() => setMenu(menu === "texte" ? null : "texte")}><span style={{ fontFamily: "var(--font-lora), Georgia, serif", fontSize: "18px" }}>A<span style={{ fontSize: "13px" }}>a</span></span></Outil>
        <Outil label="Titre" actif={formats.h2} onAction={() => titreBloc("h2")}><span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "17px" }}>Titre</span></Outil>
        <Outil label="Sous-titre" actif={formats.h3} onAction={() => titreBloc("h3")}><span style={{ fontWeight: 650, fontSize: "14px" }}>Sous-titre</span></Outil>
        <span aria-hidden="true" style={{ width: 1, background: colors.blueBorder, margin: "8px 4px", flexShrink: 0 }} />
        <Outil label="Gras" actif={formats.bold} onAction={() => commande("bold")}><b>G</b></Outil>
        <Outil label="Italique" actif={formats.italic} onAction={() => commande("italic")}><i style={{ fontFamily: "Georgia, serif" }}>I</i></Outil>
        <Outil label="Souligné" actif={formats.underline} onAction={() => commande("underline")}><u>S</u></Outil>
        <Outil label="Surligner" actif={formats.mark} onAction={surligner}><span style={{ background: SURLIGNEUR, color: colors.text, padding: "0 5px", borderRadius: 3, fontWeight: 600 }}>ab</span></Outil>
        <span aria-hidden="true" style={{ width: 1, background: colors.blueBorder, margin: "8px 4px", flexShrink: 0 }} />
        <Outil label="Liste à puces" actif={formats.puces} onAction={() => commande("insertUnorderedList")}><Icone d={ICONES.puces} /></Outil>
        <Outil label="Liste numérotée" actif={formats.numeros} onAction={() => commande("insertOrderedList")}><Icone d={ICONES.numeros} /></Outil>
        <Outil label="Liste à cocher" actif={formats.cases} onAction={cases}><Icone d={ICONES.cases} /></Outil>
        <span aria-hidden="true" style={{ width: 1, background: colors.blueBorder, margin: "8px 4px", flexShrink: 0 }} />
        <Outil label="Ajouter une photo" actif={undefined} onAction={() => photoRef.current?.click()}><><Icone d={ICONES.photo} /><span style={{ fontSize: "13px" }}>Photo</span></></Outil>
        <Outil label="Dessiner" actif={undefined} onAction={() => setDessin(true)}><><Icone d={ICONES.dessin} /><span style={{ fontSize: "13px" }}>Dessin</span></></Outil>
        <input ref={photoRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void choisirPhoto(f) }} />
      </div>

      <div style={{ position: "relative" }}>
        {menu === "texte" && (
          <div className="carnet-menu" role="group" aria-label="Taille et police" style={{ left: 8, right: 8, top: 6, maxWidth: 520 }}>
            <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: 6 }}>Taille</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {TAILLES.map(t => (
                <button key={t.nom} type="button" className="carnet-choix" aria-pressed={styleTexte.taille === t.id}
                  onPointerDown={e => e.preventDefault()} onMouseDown={e => e.preventDefault()} onClick={() => taille(t.commande)}
                  style={{ fontSize: Math.min(t.px, 22) }}>{t.nom}</button>
              ))}
            </div>
            <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: 6 }}>Police</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {POLICES.map(f => (
                <button key={f.nom} type="button" className="carnet-choix" aria-pressed={styleTexte.police === f.id}
                  onPointerDown={e => e.preventDefault()} onMouseDown={e => e.preventDefault()} onClick={() => police(f.id)}
                  style={{ fontFamily: f.css, fontSize: f.id === "main" ? 19 : 15 }}>{f.nom}</button>
              ))}
            </div>
            <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#6B7280" }}>Sélectionne du texte pour le changer, ou choisis avant d&apos;écrire.</p>
          </div>
        )}
        {menu === "infos" && (
          <div className="carnet-menu" role="group" aria-label="Dossier et chapitre" style={{ right: 8, top: 6, width: "min(340px, calc(100% - 16px))" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#6B7280", marginBottom: 6 }} htmlFor="note-dossier">Dossier</label>
            <select id="note-dossier" value={dossierId ?? ""} onChange={e => changerMeta({ dossier_id: e.target.value || null })}
              style={{ width: "100%", border: `1px solid ${colors.blueBorder}`, borderRadius: 10, padding: "9px 10px", background: "#fff", color: colors.text, marginBottom: 12 }}>
              <option value="">Aucun (reste dans « Toutes »)</option>
              {dossiers.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
            {dossiers.length === 0 && <p style={{ margin: "-6px 0 12px", fontSize: "12px", color: "#6B7280" }}>Crée des dossiers depuis la liste du carnet (« + Dossier »).</p>}
            {(
              <>
                <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: 6 }}>Chapitre ou fiche de cours</div>
                {chapitreId ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => { void enregistrer().then(() => onOuvrirChapitre(chapitreId)) }} className="carnet-choix"
                      style={{ flex: 1, minWidth: 0, textAlign: "left", color: "#1A5FD0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {chapitre ? `${chapitre.groupe.split(",")[0]} : ${chapitre.titre}` : "Chapitre relié"}
                    </button>
                    <button className="carnet-choix" onClick={() => changerMeta({ chapitre_id: null })} aria-label="Délier le chapitre">Délier</button>
                  </div>
                ) : (
                  <button className="carnet-choix" style={{ width: "100%" }} onClick={() => { setMenu(null); setChoixChapitre(true) }}>Relier à un chapitre</button>
                )}
                <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#6B7280" }}>Une note reliée apparaît aussi dans le chapitre, dans Réviser.</p>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", ...FOND_PAGE }} onPointerDown={() => { if (menu) setMenu(null) }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <textarea ref={titreRef} className="carnet-titre" rows={1} value={titre} placeholder="Titre" aria-label="Titre de la note" maxLength={200}
            onChange={e => { changerMeta({ titre: e.target.value.replace(/\n/g, " ") }); ajusterTitre() }}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); pageRef.current?.focus() } }}
            style={{ display: "block", width: "100%", border: "none", background: "transparent", outline: "none", resize: "none", overflow: "hidden", padding: `${CARREAU}px 16px 0 52px`,
              fontFamily: "var(--font-display)", fontSize: "27px", fontWeight: 700, lineHeight: 1.2, paddingBottom: 10, color: colors.navy, boxSizing: "border-box" }} />

          <div ref={pageRef} className="carnet-page" contentEditable suppressContentEditableWarning
            role="textbox" aria-multiline="true" aria-label="Contenu de la note" data-vide="Écris ici…"
            onInput={planifier} onClick={surClic} onKeyDown={surTouche} onPaste={surCollage} />
        </div>
      </div>

      {dessin && <Dessin onFermer={() => setDessin(false)} onInserer={png => { setDessin(false); void insererImage(png, "png", "Dessin") }} />}
      {choixChapitre && (
        <ChoixChapitre chapitres={chapitres} onFermer={() => setChoixChapitre(false)}
          onChoisir={id => { setChoixChapitre(false); changerMeta({ chapitre_id: id }) }} />
      )}
    </div>
  )
}

export type OptionLien = { id: string; titre: string; groupe: string; source: "perso" | "programme"; cherche: string }

function ChoixChapitre({ chapitres, onChoisir, onFermer }: { chapitres: OptionLien[] | null; onChoisir: (id: string) => void; onFermer: () => void }) {
  const [q, setQ] = useState("")
  const aDesPerso = !!chapitres?.some(c => c.source === "perso")
  const [source, setSource] = useState<"perso" | "programme" | null>(null)
  const sourceActive = source ?? (aDesPerso ? "perso" : "programme")
  const mots = normaliser(q).split(/\s+/).filter(Boolean)
  const liste = (chapitres || [])
    .filter(c => (mots.length ? true : c.source === sourceActive))
    .filter(c => mots.every(m => normaliser(c.cherche).includes(m)))
    .slice(0, 80)
  return (
    <div role="dialog" aria-modal="true" aria-label="Relier à un chapitre" onClick={e => { if (e.target === e.currentTarget) onFermer() }}
      style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(10,22,40,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 560, maxHeight: "80dvh", borderRadius: "18px 18px 0 0", padding: "14px 14px calc(14px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "16px", color: colors.text }}>Relier à un chapitre</div>
          <button onClick={onFermer} className="carnet-puce" style={{ border: "none" }}>Fermer</button>
        </div>
        <input type="search" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Chercher (ex. introduction, bilan, demande…)" aria-label="Chercher un chapitre"
          style={{ width: "100%", border: `1px solid ${colors.blueBorder}`, borderRadius: radius.pill, padding: "9px 14px", fontSize: "16px", background: "#F8FBFF" }} />
        {aDesPerso && !mots.length && (
          <div role="tablist" style={{ display: "flex", gap: 2, background: "#EEF2F8", borderRadius: 10, padding: 3 }}>
            {(["perso", "programme"] as const).map(s => (
              <button key={s} role="tab" aria-selected={sourceActive === s} onClick={() => setSource(s)}
                style={{ flex: 1, border: "none", borderRadius: 8, padding: "7px 0", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  background: sourceActive === s ? "#fff" : "transparent", color: sourceActive === s ? colors.navy : "#6B7280" }}>
                {s === "perso" ? "Mes cours" : "Programme"}
              </button>
            ))}
          </div>
        )}
        <div style={{ overflowY: "auto" }}>
          {chapitres === null && <div className="nx-skel" style={{ height: 120, borderRadius: radius.sm }} />}
          {chapitres && liste.length === 0 && <p style={{ fontSize: "13px", color: colors.textMuted }}>Aucun chapitre ne correspond.</p>}
          {liste.map((c, i) => (
            <div key={c.id}>
              {(i === 0 || liste[i - 1].groupe !== c.groupe) && (
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", padding: "12px 4px 4px" }}>
                  {c.groupe}{mots.length ? (c.source === "perso" ? " (mes cours)" : " (programme)") : ""}
                </div>
              )}
              <button onClick={() => onChoisir(c.id)}
                style={{ width: "100%", display: "block", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${colors.border}`, padding: "10px 4px", cursor: "pointer" }}>
                <div style={{ fontSize: "14px", color: colors.text, fontWeight: 500 }}>{c.titre}</div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
