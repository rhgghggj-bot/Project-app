"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast, confirmer } from "@/lib/toast"
import { colors, radius } from "@/app/components/ui/tokens"
import { chapitreVisible, chargerProgramme } from "@/lib/programmes"
import { chargerFichesPerso } from "@/lib/fichesPerso"
import { cheminsImages, compresserImage, COULEURS_SURLIGNEUR, COULEURS_TEXTE, nettoyerHtml, normaliser, texteBrut, type Dossier, type NoteCarnet } from "@/lib/carnet"
import type { Pays } from "@/lib/etudes"
import { mettreALaCorbeille } from "@/lib/corbeille"
import { effacerSous, estSurligne, motSous, plageEntre, pointSous, surligner as surlignerPlage, type Point } from "@/lib/surligneur"
import { CARREAU, FOND_PAGE } from "./cahier"
import Dessin from "./Dessin"
import Astuce, { astuceVue } from "./Astuce"
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

const SURLIGNEUR = COULEURS_SURLIGNEUR[0].hex

// Encadrés : définition, à retenir, exemple
export const ENCADRES = [
  { id: "definition", nom: "Définition", fond: "#EEF4FF", bord: "#2B6BE6", texte: "#1F5FD6" },
  { id: "important", nom: "À retenir", fond: "#FFF6E0", bord: "#E8A317", texte: "#8A5A00" },
  { id: "exemple", nom: "Exemple", fond: "#EAF8F0", bord: "#1E9E63", texte: "#11744A" },
] as const

const CLE_USAGE = "carnet-outils"
function lireFavoris(): string[] {
  try {
    const u = JSON.parse(localStorage.getItem(CLE_USAGE) || "{}") as Record<string, number>
    return Object.entries(u).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => id)
  } catch { return [] }
}
function noterUsage(id: string) {
  try {
    const u = JSON.parse(localStorage.getItem(CLE_USAGE) || "{}") as Record<string, number>
    u[id] = (u[id] || 0) + 1
    localStorage.setItem(CLE_USAGE, JSON.stringify(u))
  } catch {}
}

type OutilPlus = { id: string; groupe: string; label: string; icone: React.ReactNode; actif?: boolean }

const CLE_STYLO = "carnet-surligneur"
function couleurMemorisee(): string {
  try { const c = localStorage.getItem(CLE_STYLO); return c !== null && COULEURS_SURLIGNEUR.some(x => x.id === c) ? c : "" } catch { return "" }
}

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
.carnet-page h3{font-size:17px;font-weight:700;color:${colors.navy};line-height:${CARREAU}px}
.carnet-page ul,.carnet-page ol{padding-left:${CARREAU}px}
.carnet-page ul{list-style:disc}
.carnet-page ol{list-style:decimal}
.carnet-page ul ul,.carnet-page li ul{list-style:circle}
.carnet-page ul ul ul,.carnet-page li li ul{list-style:square}
.carnet-page mark{background:${SURLIGNEUR};color:inherit;border-radius:2px;padding:0 1px}
${COULEURS_SURLIGNEUR.filter(c => c.id).map(c => `.carnet-page mark[data-couleur="${c.id}"]{background:${c.hex}}`).join("")}
${COULEURS_TEXTE.map(c => `.carnet-page [data-couleur="${c.id}"]:not(mark){color:${c.hex}}`).join("")}
.carnet-page sup,.carnet-page sub{font-size:.72em;line-height:0}
.carnet-page hr{border:none;border-top:2px solid #C9D3E3;margin:${CARREAU / 2 - 1}px 0}
.carnet-page blockquote{margin:${CARREAU / 2}px 0;padding:6px 12px 8px 14px;border-left:4px solid;border-radius:0 10px 10px 0}
.carnet-page blockquote::before{display:block;font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;line-height:20px}
${ENCADRES.map(e => `.carnet-page blockquote[data-encadre="${e.id}"]{background:${e.fond};border-color:${e.bord}}.carnet-page blockquote[data-encadre="${e.id}"]::before{content:"${e.nom}";color:${e.texte}}`).join("")}
.carnet-page[data-stylo]{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;cursor:crosshair;caret-color:transparent}
.carnet-page.carnet-mesure{-webkit-user-select:text !important;user-select:text !important}
.carnet-page.carnet-cache{-webkit-user-select:none;user-select:none;caret-color:transparent}
.carnet-page.carnet-cache mark:not(.vu){color:transparent !important;background:repeating-linear-gradient(-45deg,#D6DEEA 0 6px,#E6ECF5 6px 12px) !important;cursor:pointer;border-radius:4px}
.carnet-page.carnet-cache mark:not(.vu) *{color:transparent !important}
.carnet-page.carnet-cache mark.vu{outline:2px solid ${colors.green};outline-offset:1px}
.carnet-apercu{position:absolute;pointer-events:none;border-radius:3px;mix-blend-mode:multiply}
.carnet-page table{border-collapse:collapse;margin:${CARREAU / 2}px 0;background:#fff;min-width:50%;max-width:100%;display:block;overflow-x:auto}
.carnet-page td,.carnet-page th{border:1px solid #C9D3E3;padding:2px 8px;min-width:64px;vertical-align:top;text-align:left}
.carnet-page th{background:#EEF2F8;font-weight:650}
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
#carnet-impression{display:none}
@media print{
  body>*:not(#carnet-impression){display:none !important}
  #carnet-impression{display:block !important;padding:0;color:#111}
  #carnet-impression h1{font-family:var(--font-display),sans-serif;font-size:24px;margin:0 0 12px}
  #carnet-impression .carnet-page{min-height:0;padding:0;line-height:1.5}
  #carnet-impression .carnet-page h2{padding-top:12px;line-height:1.3}
  #carnet-impression .carnet-page img{max-height:none;box-shadow:none;break-inside:avoid}
  #carnet-impression .carnet-page table{display:table}
  #carnet-impression mark,#carnet-impression th{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
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
  annuler: "M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3",
  retablir: "M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3",
  tableau: "M4 5h16v14H4zM4 10h16M4 15h16M10 5v14",
  surligneur: "M15 4l5 5-8 8H7v-5zM7 17l-3 3h6",
  gomme: "M7 20h11M5 15l9-9 5 5-7 7H8z",
  encadre: "M5 4v16M9 6h10M9 10h10M9 14h7",
  plan: "M4 6h16M8 12h12M8 18h12M4 12h.01M4 18h.01",
  retrait: "M4 6h16M10 12h10M10 18h10M4 10l3 2-3 2",
  desretrait: "M4 6h16M10 12h10M10 18h10M7 10l-3 2 3 2",
  separateur: "M4 12h16M8 7h8M8 17h8",
  oeil: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6zM4 4l16 16",
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
  const [menu, setMenu] = useState<"infos" | "texte" | "couleur" | "encadre" | "plus" | null>(null)
  // Outils du « + » les plus utilisés (lus à l'ouverture : la barre ne bouge pas pendant qu'on écrit)
  const [favoris] = useState<string[]>(lireFavoris)
  // Surligneur crayon : couleur choisie ("" = jaune), mode actif ou non
  const [couleurStylo, setCouleurStylo] = useState<string>(couleurMemorisee)
  const [stylo, setStylo] = useState<null | "surligner" | "gommer">(null)
  const [apercu, setApercu] = useState<{ x: number; y: number; l: number; h: number }[]>([])
  const historiqueStylo = useRef<string[]>([])
  const [nbStylo, setNbStylo] = useState(0)
  const trace = useRef<{ id: number; debut: Point; x: number; y: number; bouge: boolean } | null>(null)
  const feuilleRef = useRef<HTMLDivElement>(null)
  // Mode « je m'interroge » : les passages surlignés sont cachés, on les révèle d'une touche
  const [cache, setCache] = useState<{ vus: number; total: number } | null>(null)
  const [plan, setPlan] = useState<{ titres: Element[]; marques: Element[] } | null>(null)
  const [export_, setExport] = useState<string | null>(null)

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
        strike: document.queryCommandState("strikeThrough"), table: !!ancre?.closest("td, th"),
        sup: document.queryCommandState("superscript"), sub: document.queryCommandState("subscript"),
        encadre: !!ancre?.closest("blockquote"),
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

  // corbeille : la note est gardée 30 jours (photos comprises) avant d'être effacée
  async function supprimerEnBase(corbeille = false): Promise<boolean> {
    supprimee.current = true
    if (minuteur.current) { clearTimeout(minuteur.current); minuteur.current = null }
    while (enVol.current) await enVol.current
    if (corbeille) {
      const { contenu, texte } = contenuActuel()
      const ligne = { ...derniere.current, ...meta.current, titre: meta.current.titre.trim().slice(0, 200), contenu, texte, updated_at: new Date().toISOString() }
      if (!(await mettreALaCorbeille(userId, "note", ligne, ligne.titre || "Sans titre"))) { supprimee.current = false; return false }
    }
    if (existe.current) {
      const { error } = await supabase.from("carnet_notes").delete().eq("id", note.id)
      if (error) { supprimee.current = false; return false }
    }
    effacerBrouillon(note.id)
    if (corbeille) return true
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
    if (!(await confirmer("Supprimer cette note ? Elle reste 30 jours dans la corbeille du carnet.", "Supprimer"))) return
    if (!(await supprimerEnBase(true))) { toast("Suppression impossible, vérifie ta connexion", "error"); planifier(); return }
    toast("Note mise à la corbeille", "success")
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

  // ─── Surligneur crayon ───
  // Pendant le surlignage la note n'est plus modifiable au clavier : un
  // glissement ne peut jamais effacer du texte.
  function activerStylo(mode: "surligner" | "gommer" = "surligner") {
    const page = pageRef.current!
    const sel = document.getSelection()
    // Texte déjà sélectionné : surligné tout de suite
    if (mode === "surligner" && sel && !sel.isCollapsed && sel.rangeCount && page.contains(sel.anchorNode)) {
      const r = sel.getRangeAt(0).cloneRange()
      const avant = page.innerHTML
      if (surlignerPlage(page, r, couleurStylo)) {
        historiqueStylo.current = [...historiqueStylo.current.slice(-29), avant]
        setNbStylo(historiqueStylo.current.length)
        planifier()
      }
    }
    sel?.removeAllRanges()
    page.blur()
    setMenu(null)
    setStylo(mode)
  }

  function choisirCouleurStylo(id: string) {
    setCouleurStylo(id)
    setStylo("surligner")
    try { localStorage.setItem(CLE_STYLO, id) } catch {}
  }

  function annulerStylo() {
    const page = pageRef.current!
    const avant = historiqueStylo.current.pop()
    setNbStylo(historiqueStylo.current.length)
    if (avant === undefined) return
    page.innerHTML = avant
    afficherImages()
    planifier()
  }

  function rectanglesDe(r: Range) {
    const base = feuilleRef.current!.getBoundingClientRect()
    return Array.from(r.getClientRects()).filter(x => x.width > 1).map(x => ({ x: x.left - base.left, y: x.top - base.top, l: x.width, h: x.height }))
  }

  function styloDebut(e: React.PointerEvent) {
    if (!stylo || trace.current || (e.pointerType === "mouse" && e.button !== 0)) return
    const p = pointSous(pageRef.current!, e.clientX, e.clientY)
    if (!p) return
    trace.current = { id: e.pointerId, debut: p, x: e.clientX, y: e.clientY, bouge: false }
  }

  function styloBouge(e: React.PointerEvent) {
    const t = trace.current
    if (!t || e.pointerId !== t.id) return
    if (!t.bouge && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 6) return
    if (!t.bouge) { t.bouge = true; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
    const p = pointSous(pageRef.current!, e.clientX, e.clientY)
    if (p) setApercu(rectanglesDe(plageEntre(t.debut, p)))
  }

  function styloFin(e: React.PointerEvent) {
    const t = trace.current
    if (!t || e.pointerId !== t.id) return
    trace.current = null
    setApercu([])
    if (e.type === "pointercancel") return
    const page = pageRef.current!
    const p = pointSous(page, e.clientX, e.clientY) ?? t.debut
    const avant = page.innerHTML
    let change: boolean
    if (!t.bouge) {
      // Simple touche : surligne le mot, ou efface le surlignage touché
      if (estSurligne(page, p)) change = effacerSous(page, p)
      else {
        const mot = motSous(p)
        change = !!mot && stylo === "surligner" && surlignerPlage(page, mot, couleurStylo)
      }
    } else {
      change = surlignerPlage(page, plageEntre(t.debut, p), stylo === "gommer" ? null : couleurStylo)
    }
    if (change) {
      historiqueStylo.current = [...historiqueStylo.current.slice(-29), avant]
      setNbStylo(historiqueStylo.current.length)
      planifier()
    }
  }

  function couleurTexte(hex: string | null) {
    remettreCurseur()
    document.execCommand("styleWithCSS", false, "true")
    document.execCommand("foreColor", false, hex ?? colors.text)
    document.execCommand("styleWithCSS", false, "false")
    planifier()
    document.dispatchEvent(new Event("selectionchange"))
  }

  // ─── Tableaux ───
  function blocRacine(): Node | null {
    const page = pageRef.current!
    let bloc: Node | null = document.getSelection()?.anchorNode ?? null
    if (!bloc || !page.contains(bloc)) return null
    while (bloc && bloc.parentNode !== page) bloc = bloc.parentNode
    return bloc
  }

  function placerDans(el: Node) {
    const r = document.createRange()
    r.selectNodeContents(el); r.collapse(true)
    const sel = document.getSelection()
    sel?.removeAllRanges(); sel?.addRange(r)
  }

  function cellule(tag: "td" | "th") {
    const c = document.createElement(tag)
    c.appendChild(document.createElement("br"))
    return c
  }

  function insererTableau() {
    remettreCurseur()
    const page = pageRef.current!
    const table = document.createElement("table")
    const corps = document.createElement("tbody")
    for (let i = 0; i < 3; i++) {
      const tr = document.createElement("tr")
      for (let j = 0; j < 3; j++) tr.appendChild(cellule(i === 0 ? "th" : "td"))
      corps.appendChild(tr)
    }
    table.appendChild(corps)
    const suite = document.createElement("p")
    suite.appendChild(document.createElement("br"))
    const bloc = blocRacine()
    if (bloc) page.insertBefore(suite, bloc.nextSibling)
    else page.appendChild(suite)
    page.insertBefore(table, suite)
    placerDans(table.querySelector("th")!)
    planifier()
    document.dispatchEvent(new Event("selectionchange"))
  }

  function modifierTableau(action: "ligne" | "colonne" | "-ligne" | "-colonne" | "-tableau") {
    remettreCurseur()
    const c = blocCourant()?.closest<HTMLTableCellElement>("td, th")
    const tr = c?.parentElement as HTMLTableRowElement | undefined
    const table = c?.closest("table")
    if (!c || !tr || !table) return
    const lignes = Array.from(table.querySelectorAll("tr"))
    const index = c.cellIndex
    if (action === "ligne") {
      const nouvelle = document.createElement("tr")
      for (let j = 0; j < tr.cells.length; j++) nouvelle.appendChild(cellule("td"))
      tr.after(nouvelle)
      placerDans(nouvelle.cells[Math.min(index, nouvelle.cells.length - 1)])
    } else if (action === "colonne") {
      for (const l of lignes) {
        const ref = l.cells[Math.min(index, l.cells.length - 1)]
        const n = cellule(ref?.tagName === "TH" ? "th" : "td")
        if (ref) ref.after(n); else l.appendChild(n)
      }
      placerDans(tr.cells[index + 1])
    } else if (action === "-ligne" && lignes.length > 1) {
      const voisine = (tr.nextElementSibling || tr.previousElementSibling) as HTMLTableRowElement
      tr.remove()
      placerDans(voisine.cells[Math.min(index, voisine.cells.length - 1)])
    } else if (action === "-colonne" && tr.cells.length > 1) {
      for (const l of lignes) l.cells[Math.min(index, l.cells.length - 1)]?.remove()
      placerDans(tr.cells[Math.max(0, index - 1)])
    } else {
      const suite = table.nextSibling
      table.remove()
      if (suite) placerDans(suite)
    }
    planifier()
    document.dispatchEvent(new Event("selectionchange"))
  }

  // ─── Encadrés, séparateur ───
  // Garde le curseur au même endroit pendant qu'on déplace des blocs
  function garderCurseur(action: () => void) {
    const sel = document.getSelection()
    const r = sel?.rangeCount ? sel.getRangeAt(0) : null
    const pos = r ? { n: r.startContainer, o: r.startOffset } : null
    action()
    if (pos && pageRef.current!.contains(pos.n)) {
      const n = document.createRange()
      n.setStart(pos.n, Math.min(pos.o, pos.n.nodeType === Node.TEXT_NODE ? (pos.n as Text).length : pos.n.childNodes.length))
      n.collapse(true)
      sel!.removeAllRanges(); sel!.addRange(n)
    }
  }

  function encadrer(type: string | null) {
    remettreCurseur()
    setMenu(null)
    const page = pageRef.current!
    const bq = blocCourant()?.closest("blockquote")
    garderCurseur(() => {
      if (bq && page.contains(bq)) {
        if (type) bq.setAttribute("data-encadre", type)
        else bq.replaceWith(...Array.from(bq.childNodes))
        return
      }
      if (!type) return
      let bloc = blocRacine()
      const q = document.createElement("blockquote")
      q.setAttribute("data-encadre", type)
      if (!bloc || bloc.nodeType === Node.TEXT_NODE || (bloc as Element).tagName === "BR") {
        // Texte libre ou note vide : on crée un paragraphe pour l'encadré
        const p = document.createElement("p")
        if (bloc) { bloc.parentNode!.insertBefore(p, bloc); p.appendChild(bloc) } else p.appendChild(document.createElement("br"))
        if (!bloc) page.appendChild(p)
        bloc = p
      }
      bloc.parentNode!.insertBefore(q, bloc)
      q.appendChild(bloc)
      if (!q.textContent) placerDans(q.firstChild!)
    })
    planifier()
    document.dispatchEvent(new Event("selectionchange"))
  }

  function separateur() {
    remettreCurseur()
    const page = pageRef.current!
    const hr = document.createElement("hr")
    const suite = document.createElement("p")
    suite.appendChild(document.createElement("br"))
    const bloc = blocRacine()
    if (bloc) page.insertBefore(suite, bloc.nextSibling)
    else page.appendChild(suite)
    page.insertBefore(hr, suite)
    placerDans(suite)
    planifier()
  }

  function retrait(plus: boolean) {
    if (!(formats.puces || formats.numeros || formats.cases)) return toast("Place le curseur dans une liste pour la décaler", "info")
    commande(plus ? "indent" : "outdent")
  }

  // ─── Je m'interroge : surlignages cachés ───
  function compterCache() {
    const page = pageRef.current!
    setCache({ vus: page.querySelectorAll("mark.vu").length, total: page.querySelectorAll("mark").length })
  }

  function interroger() {
    const page = pageRef.current!
    if (!page.querySelector("mark")) return toast("Surligne d'abord l'essentiel avec le crayon : les passages surlignés seront cachés pour t'interroger.", "info")
    document.getSelection()?.removeAllRanges()
    page.blur()
    setMenu(null); setStylo(null)
    page.querySelectorAll("mark.vu").forEach(m => m.classList.remove("vu"))
    compterCache()
  }

  function finInterroger() {
    pageRef.current!.querySelectorAll("mark.vu").forEach(m => { m.classList.remove("vu"); if (!m.getAttribute("class")) m.removeAttribute("class") })
    setCache(null)
  }

  function toutReveler(voir: boolean) {
    pageRef.current!.querySelectorAll("mark").forEach(m => m.classList.toggle("vu", voir))
    compterCache()
  }

  // ─── Plan de la note ───
  function ouvrirPlan() {
    const page = pageRef.current!
    setMenu(null)
    setPlan({
      titres: Array.from(page.querySelectorAll("h2, h3")).filter(h => h.textContent?.trim()),
      marques: Array.from(page.querySelectorAll("mark")).filter(m => (m.textContent || "").trim().length > 1),
    })
  }

  function allerA(el: Element) {
    setPlan(null)
    el.scrollIntoView({ block: "center", behavior: "smooth" })
    el.animate?.([{ outline: `3px solid ${colors.blue}` }, { outline: "3px solid transparent" }], { duration: 1400 })
  }

  // ─── Exporter ───
  function telechargerBlob(blob: Blob, nom: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = nom
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  }

  async function exporterWord() {
    setMenu(null)
    setExport("Création du fichier Word…")
    try {
      await enregistrer()
      const { noteEnWord, nomFichier } = await import("@/lib/exportWord")
      const blob = await noteEnWord(meta.current.titre.trim(), nettoyerHtml(pageRef.current?.innerHTML ?? ""), async chemin => {
        const { data } = await supabase.storage.from("etudes").download(chemin)
        return data
      })
      telechargerBlob(blob, nomFichier(meta.current.titre.trim(), "docx"))
    } catch {
      toast("Le fichier Word n'a pas pu être créé", "error")
    }
    setExport(null)
  }

  // Impression (ou « Enregistrer en PDF » dans la fenêtre d'impression)
  function imprimer() {
    setMenu(null)
    const page = pageRef.current
    if (!page) return
    document.getElementById("carnet-impression")?.remove()
    const feuille = document.createElement("div")
    feuille.id = "carnet-impression"
    feuille.className = `${lora.variable} ${caveat.variable}`
    const h1 = document.createElement("h1")
    h1.textContent = meta.current.titre.trim() || "Note"
    const contenu = document.createElement("div")
    contenu.className = "carnet-page"
    contenu.innerHTML = nettoyerHtml(page.innerHTML)
    // Mêmes images que dans l'éditeur (liens déjà signés)
    contenu.querySelectorAll<HTMLImageElement>("img[data-chemin]").forEach(img => {
      const src = page.querySelector<HTMLImageElement>(`img[data-chemin="${CSS.escape(img.getAttribute("data-chemin")!)}"]`)?.src
      if (src) img.src = src
    })
    feuille.append(h1, contenu)
    document.body.appendChild(feuille)
    const retirer = () => { feuille.remove(); window.removeEventListener("afterprint", retirer) }
    window.addEventListener("afterprint", retirer)
    setTimeout(() => window.print(), 50)
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
    if (e.key === "Tab") {
      // Tableau : Tab passe à la cellule suivante (une ligne est ajoutée à la fin)
      const c = blocCourant()?.closest<HTMLTableCellElement>("td, th")
      if (c) {
        e.preventDefault()
        const cellules = Array.from(c.closest("table")!.querySelectorAll<HTMLTableCellElement>("td, th"))
        const i = cellules.indexOf(c) + (e.shiftKey ? -1 : 1)
        if (i >= cellules.length) modifierTableau("ligne")
        else if (i >= 0) placerDans(cellules[i])
        return
      }
    }
    if (e.key === "Tab" && blocCourant()?.closest("li")) {
      e.preventDefault()
      commande(e.shiftKey ? "outdent" : "indent")
      return
    }
    if (e.key === "Enter" && !e.shiftKey) {
      // Ligne vide en fin d'encadré : Entrée fait sortir de l'encadré
      const bloc = blocCourant()
      const bq = bloc?.closest("blockquote")
      const ligne = bloc?.closest("p, h2, h3")
      if (bq && ligne && ligne.parentElement === bq && !ligne.textContent && ligne === bq.lastElementChild && bq.childElementCount > 1) {
        e.preventDefault()
        bq.after(ligne)
        placerDans(ligne)
        planifier()
        return
      }
    }
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

  // ─── Outils rangés dans le « + » ───
  const outilsPlus: OutilPlus[] = [
    { id: "italique", groupe: "Texte", label: "Italique", icone: <i style={{ fontFamily: "Georgia, serif", fontSize: 17 }}>I</i>, actif: formats.italic },
    { id: "souligne", groupe: "Texte", label: "Souligné", icone: <u style={{ fontSize: 16 }}>S</u>, actif: formats.underline },
    { id: "barre", groupe: "Texte", label: "Barré", icone: <s style={{ fontSize: 15 }}>ab</s>, actif: formats.strike },
    { id: "couleur", groupe: "Texte", label: "Couleur", icone: <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1, fontWeight: 700 }}>A<span aria-hidden="true" style={{ width: 16, height: 4, borderRadius: 2, marginTop: 2, background: `linear-gradient(90deg, ${COULEURS_TEXTE.map(c => c.hex).join(",")})` }} /></span> },
    { id: "taille", groupe: "Texte", label: "Taille, police", icone: <span style={{ fontFamily: "var(--font-lora), Georgia, serif", fontSize: 17 }}>A<span style={{ fontSize: 12 }}>a</span></span> },
    { id: "exposant", groupe: "Texte", label: "Exposant", icone: <span style={{ fontSize: 15 }}>x<sup style={{ fontSize: 10 }}>2</sup></span>, actif: formats.sup },
    { id: "indice", groupe: "Texte", label: "Indice", icone: <span style={{ fontSize: 15 }}>x<sub style={{ fontSize: 10 }}>2</sub></span>, actif: formats.sub },
    { id: "soustitre", groupe: "Structure", label: "Sous-titre", icone: <span style={{ fontWeight: 700, fontSize: 13 }}>Sous-t.</span>, actif: formats.h3 },
    { id: "numeros", groupe: "Structure", label: "Numérotée", icone: <Icone d={ICONES.numeros} />, actif: formats.numeros },
    { id: "cases", groupe: "Structure", label: "Cases", icone: <Icone d={ICONES.cases} />, actif: formats.cases },
    { id: "encadre", groupe: "Structure", label: "Encadré", icone: <Icone d={ICONES.encadre} />, actif: formats.encadre },
    { id: "tableau", groupe: "Structure", label: "Tableau", icone: <Icone d={ICONES.tableau} />, actif: formats.table },
    { id: "separateur", groupe: "Structure", label: "Séparation", icone: <Icone d={ICONES.separateur} /> },
    { id: "dessin", groupe: "Ajouter", label: "Dessin", icone: <Icone d={ICONES.dessin} /> },
    { id: "retablir", groupe: "Ajouter", label: "Rétablir", icone: <Icone d={ICONES.retablir} /> },
    { id: "interroger", groupe: "Réviser", label: "Je m'interroge", icone: <Icone d={ICONES.oeil} /> },
    { id: "plan", groupe: "Réviser", label: "Plan, surlignages", icone: <Icone d={ICONES.plan} /> },
  ]

  function actionListe(id: string) {
    if (id === "puces") commande("insertUnorderedList")
    else if (id === "numeros") commande("insertOrderedList")
    else if (id === "cases") cases()
    else retrait(id === "+")
  }

  function executer(id: string) {
    switch (id) {
      case "italique": commande("italic"); break
      case "souligne": commande("underline"); break
      case "barre": commande("strikeThrough"); break
      case "couleur": setMenu("couleur"); break
      case "taille": setMenu("texte"); break
      case "exposant": commande("superscript"); break
      case "indice": commande("subscript"); break
      case "soustitre": titreBloc("h3"); break
      case "numeros": commande("insertOrderedList"); break
      case "cases": cases(); break
      case "encadre": setMenu("encadre"); break
      case "tableau": insererTableau(); break
      case "separateur": separateur(); break
      case "dessin": setDessin(true); break
      case "retablir": commande("redo"); break
      case "interroger": interroger(); break
      case "plan": ouvrirPlan(); break
    }
  }

  function lancer(o: OutilPlus) {
    noterUsage(o.id)
    if (menu === "plus") setMenu(null)
    executer(o.id)
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
          ) : <span role="status">{export_ ?? (envoi > 0 ? "Envoi de l'image…" : libelleStatut)}</span>}
        </span>
        <button className="carnet-outil" aria-label="Plan et surlignages de la note" title="Plan et surlignages" onClick={ouvrirPlan}><Icone d={ICONES.plan} /></button>
        <button className="carnet-outil" aria-label="Dossier, chapitre et téléchargement" aria-expanded={menu === "infos"} title="Dossier, chapitre, télécharger"
          onClick={() => setMenu(menu === "infos" ? null : "infos")} style={{ position: "relative" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
          {(dossierId || chapitreId) && <span aria-hidden="true" style={{ position: "absolute", top: 9, right: 9, width: 7, height: 7, borderRadius: "50%", background: colors.blue }} />}
        </button>
        <button className="carnet-outil" aria-pressed={epingle} aria-label="Épingler en haut du carnet" title="Épingler"
          onClick={() => changerMeta({ epingle: !epingle })}><Icone d={ICONES.epingle} /></button>
        <button className="carnet-outil" aria-label="Supprimer la note" title="Supprimer" onClick={supprimer} style={{ color: colors.red }}><Icone d={ICONES.corbeille} /></button>
      </div>

      {cache ? (
        <div role="toolbar" aria-label="Je m'interroge" style={{ display: "flex", gap: "6px", padding: "6px 8px", overflowX: "auto", alignItems: "center", borderBottom: `1px solid ${colors.border}`, background: "#EEF7F1" }}>
          <button type="button" className="carnet-choix" onClick={finInterroger}
            style={{ flexShrink: 0, background: colors.navy, borderColor: colors.navy, color: "#fff", fontWeight: 600, padding: "0 12px" }}>Terminé</button>
          <span role="status" style={{ flex: 1, fontSize: 13, color: colors.text, whiteSpace: "nowrap" }}><b>{cache.vus}</b> / {cache.total} révélés</span>
          <button type="button" className="carnet-choix" style={{ flexShrink: 0 }} onClick={() => toutReveler(cache.vus < cache.total)}>{cache.vus < cache.total ? "Tout révéler" : "Tout cacher"}</button>
        </div>
      ) : stylo ? (
        <div role="toolbar" aria-label="Surligneur" style={{ display: "flex", gap: "5px", padding: "6px 8px", overflowX: "auto", alignItems: "center", borderBottom: `1px solid ${colors.border}`, background: "#FFFBEA" }}>
          <button type="button" className="carnet-choix" onClick={() => { setStylo(null); setApercu([]) }}
            style={{ flexShrink: 0, background: colors.navy, borderColor: colors.navy, color: "#fff", fontWeight: 600, padding: "0 12px" }}>Terminé</button>
          <Outil label="Annuler le dernier surlignage" onAction={annulerStylo}><span style={{ opacity: nbStylo ? 1 : 0.35, display: "inline-flex" }}><Icone d={ICONES.annuler} /></span></Outil>
          <span aria-hidden="true" style={{ width: 1, alignSelf: "stretch", background: colors.blueBorder, margin: "6px 2px", flexShrink: 0 }} />
          {COULEURS_SURLIGNEUR.map(c => {
            const actif = stylo === "surligner" && couleurStylo === c.id
            return (
              <button key={c.nom} type="button" aria-label={`Surligneur ${c.nom.toLowerCase()}`} aria-pressed={actif} title={c.nom} onClick={() => choisirCouleurStylo(c.id)}
                style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", background: c.hex, cursor: "pointer", border: "2px solid #fff",
                  boxShadow: actif ? `0 0 0 2.5px ${colors.navy}` : `0 0 0 1px ${colors.blueBorder}`, transform: actif ? "scale(1.06)" : undefined }} />
            )
          })}
          <button type="button" aria-label="Gomme à surlignage" title="Gomme" aria-pressed={stylo === "gommer"} onClick={() => setStylo("gommer")} className="carnet-outil"
            style={stylo === "gommer" ? { background: colors.navy, color: "#fff" } : undefined}>
            <Icone d={ICONES.gomme} />
          </button>
        </div>
      ) : (
      <div role="toolbar" aria-label="Mise en forme" style={{ display: "flex", gap: "2px", padding: "4px 8px", overflowX: "auto", borderBottom: `1px solid ${colors.border}`, background: "#FBFCFF" }}>
        <Outil label="Surligneur (crayon)" onAction={() => activerStylo()}>
          <span style={{ position: "relative", display: "inline-flex" }}><Icone d={ICONES.surligneur} />
            <span aria-hidden="true" style={{ position: "absolute", left: -2, right: -2, bottom: -3, height: 5, borderRadius: 3, background: (COULEURS_SURLIGNEUR.find(c => c.id === couleurStylo) ?? COULEURS_SURLIGNEUR[0]).hex }} />
          </span>
        </Outil>
        <Outil label="Titre" actif={formats.h2} onAction={() => titreBloc("h2")}><span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px" }}>Titre</span></Outil>
        <Outil label="Gras" actif={formats.bold} onAction={() => commande("bold")}><b style={{ fontSize: 17 }}>G</b></Outil>
        <Outil label="Liste à puces" actif={formats.puces || formats.numeros || formats.cases} onAction={() => commande("insertUnorderedList")}><Icone d={ICONES.puces} /></Outil>
        <Outil label="Ajouter une photo" onAction={() => photoRef.current?.click()}><Icone d={ICONES.photo} /></Outil>
        <Outil label="Annuler" onAction={() => commande("undo")}><Icone d={ICONES.annuler} /></Outil>
        {/* Outils du « + » les plus utilisés, remontés dans la barre */}
        {favoris.map(id => outilsPlus.find(o => o.id === id)).filter(Boolean).map(o => (
          <Outil key={o!.id} label={o!.label} actif={o!.actif} onAction={() => lancer(o!)}>{o!.icone}</Outil>
        ))}
        <span style={{ flex: 1 }} />
        <Outil label="Plus d'outils" actif={menu === "plus"} onAction={() => setMenu(menu === "plus" ? null : "plus")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </Outil>
        <input ref={photoRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void choisirPhoto(f) }} />
      </div>
      )}
      {cache && (
        <div style={{ fontSize: 12, color: "#6B7280", padding: "5px 12px", background: "#EEF7F1", borderBottom: `1px solid ${colors.border}` }}>
          Les passages surlignés sont cachés. Récite-les dans ta tête, puis touche un passage pour vérifier.
        </div>
      )}
      {stylo && (
        <div style={{ fontSize: 12, color: "#6B7280", padding: "5px 12px", background: "#FFFBEA", borderBottom: `1px solid ${colors.border}` }}>
          {stylo === "gommer" ? "Gomme : passe sur un surlignage pour l'effacer." : "Glisse sur le texte pour surligner. Touche un mot surligné pour l'effacer."}
        </div>
      )}

      {(formats.puces || formats.numeros || formats.cases) && !formats.table && !stylo && !cache && (
        <div role="toolbar" aria-label="Liste" style={{ display: "flex", gap: 6, overflowX: "auto", alignItems: "center", padding: "6px 10px", borderBottom: `1px solid ${colors.border}`, background: "#F4F7FC" }}>
          {([["puces", "• Puces"], ["numeros", "1. Numéros"], ["cases", "☐ Cases"], ["+", "→ Sous-point"], ["-", "← Remonter"]] as const).map(([id, nom]) => (
            <button key={id} type="button" className="carnet-choix" aria-pressed={id === "puces" ? !!formats.puces : id === "numeros" ? !!formats.numeros : id === "cases" ? !!formats.cases : undefined}
              onPointerDown={e => e.preventDefault()} onMouseDown={e => e.preventDefault()} onClick={() => actionListe(id)}
              style={{ flexShrink: 0, minHeight: 36, fontSize: 13 }}>{nom}</button>
          ))}
        </div>
      )}
      {formats.encadre && !stylo && !cache && (
        <div role="toolbar" aria-label="Type d'encadré" style={{ display: "flex", gap: 6, overflowX: "auto", alignItems: "center", padding: "6px 10px", borderBottom: `1px solid ${colors.border}`, background: "#F4F7FC" }}>
          {ENCADRES.map(e => (
            <button key={e.id} type="button" className="carnet-choix" onPointerDown={ev => ev.preventDefault()} onMouseDown={ev => ev.preventDefault()} onClick={() => encadrer(e.id)}
              style={{ flexShrink: 0, minHeight: 36, fontSize: 13, background: e.fond, borderColor: e.bord, color: e.texte, fontWeight: 700 }}>{e.nom}</button>
          ))}
          <button type="button" className="carnet-choix" onPointerDown={ev => ev.preventDefault()} onMouseDown={ev => ev.preventDefault()} onClick={() => encadrer(null)} style={{ flexShrink: 0, minHeight: 36, fontSize: 13 }}>Retirer</button>
        </div>
      )}
      {formats.table && !stylo && !cache && (
        <div role="toolbar" aria-label="Tableau" style={{ display: "flex", gap: 6, overflowX: "auto", alignItems: "center", padding: "6px 10px", borderBottom: `1px solid ${colors.border}`, background: "#F4F7FC" }}>
          {([["ligne", "+ Ligne"], ["colonne", "+ Colonne"], ["-ligne", "− Ligne"], ["-colonne", "− Colonne"], ["-tableau", "Supprimer le tableau"]] as const).map(([a, nom]) => (
            <button key={a} type="button" className="carnet-choix" onPointerDown={e => e.preventDefault()} onMouseDown={e => e.preventDefault()} onClick={() => modifierTableau(a)}
              style={{ flexShrink: 0, minHeight: 36, fontSize: 13, color: a === "-tableau" ? "#C81E3F" : undefined }}>{nom}</button>
          ))}
        </div>
        )}
      <div style={{ position: "relative" }}>
        {menu === "plus" && (
          <div className="carnet-menu" role="group" aria-label="Plus d'outils" style={{ left: 8, right: 8, top: 6, maxWidth: 560, marginLeft: "auto", maxHeight: "60dvh", overflowY: "auto" }}>
            {["Texte", "Structure", "Ajouter", "Réviser"].map(g => (
              <div key={g} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>{g}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(74px, 1fr))", gap: 6 }}>
                  {outilsPlus.filter(o => o.groupe === g).map(o => (
                    <button key={o.id} type="button" className="carnet-choix" aria-pressed={o.actif}
                      onPointerDown={e => e.preventDefault()} onMouseDown={e => e.preventDefault()} onClick={() => lancer(o)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "8px 4px", minHeight: 62 }}>
                      <span style={{ height: 22, display: "inline-flex", alignItems: "center" }}>{o.icone}</span>
                      <span style={{ fontSize: 11.5, lineHeight: 1.15 }}>{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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
        {menu === "couleur" && (
          <div className="carnet-menu" role="group" aria-label="Couleurs" style={{ left: 8, right: 8, top: 6, maxWidth: 520 }}>
            <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: 6 }}>Couleur du texte</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              <button type="button" className="carnet-choix" onPointerDown={e => e.preventDefault()} onMouseDown={e => e.preventDefault()} onClick={() => couleurTexte(null)}>Normal</button>
              {COULEURS_TEXTE.map(c => (
                <button key={c.id} type="button" className="carnet-choix" onPointerDown={e => e.preventDefault()} onMouseDown={e => e.preventDefault()} onClick={() => couleurTexte(c.hex)}
                  style={{ color: c.hex, fontWeight: 650 }}>{c.nom}</button>
              ))}
            </div>
            <p style={{ margin: "0", fontSize: "12px", color: "#6B7280" }}>Sélectionne du texte pour le colorer. Pour surligner, utilise le crayon surligneur (premier bouton de la barre).</p>
          </div>
        )}
        {menu === "encadre" && (
          <div className="carnet-menu" role="group" aria-label="Encadré" style={{ left: 8, right: 8, top: 6, maxWidth: 520 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {ENCADRES.map(e => (
                <button key={e.id} type="button" className="carnet-choix" onPointerDown={ev => ev.preventDefault()} onMouseDown={ev => ev.preventDefault()} onClick={() => encadrer(e.id)}
                  style={{ background: e.fond, borderColor: e.bord, color: e.texte, fontWeight: 700, borderLeftWidth: 4 }}>{e.nom}</button>
              ))}
              {formats.encadre && <button type="button" className="carnet-choix" onPointerDown={ev => ev.preventDefault()} onMouseDown={ev => ev.preventDefault()} onClick={() => encadrer(null)}>Retirer l&apos;encadré</button>}
            </div>
            <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#6B7280" }}>Met la ligne du curseur dans un encadré. Une ligne vide + Entrée pour en sortir.</p>
          </div>
        )}
        {menu === "infos" && (
          <div className="carnet-menu" role="group" aria-label="Dossier, chapitre et téléchargement" style={{ right: 8, top: 6, width: "min(340px, calc(100% - 16px))" }}>
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
            <div style={{ fontSize: "12px", color: "#6B7280", margin: "14px 0 6px" }}>Télécharger</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="carnet-choix" style={{ flex: 1 }} onClick={() => void exporterWord()} disabled={!!export_}>Word (.docx)</button>
              <button className="carnet-choix" style={{ flex: 1 }} onClick={imprimer}>PDF / Imprimer</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", ...FOND_PAGE }} onPointerDown={() => { if (menu) setMenu(null) }}>
        <div ref={feuilleRef} style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          {!stylo && !cache && (
            <div style={{ padding: "12px 12px 0" }}>
              <Astuce id="carnet-outils" style={{ margin: 0 }}>Le <b>crayon</b> (1<sup>er</sup> bouton) surligne sans sélectionner. Couleurs, tableau, encadré, dessin… sont dans le <b>+</b>.</Astuce>
              {note.contenu.includes("<mark") && astuceVue("carnet-outils") && (
                <Astuce id="carnet-cartes" style={{ margin: 0 }}>Tes passages surlignés deviennent des <b>cartes de révision</b> : retrouve-les dans Réviser → Aujourd&apos;hui. Le + → « Je m&apos;interroge » les cache pour t&apos;entraîner.</Astuce>
              )}
            </div>
          )}
          <textarea ref={titreRef} className="carnet-titre" rows={1} value={titre} placeholder="Titre" aria-label="Titre de la note" maxLength={200}
            onChange={e => { changerMeta({ titre: e.target.value.replace(/\n/g, " ") }); ajusterTitre() }}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); pageRef.current?.focus() } }}
            style={{ display: "block", width: "100%", border: "none", background: "transparent", outline: "none", resize: "none", overflow: "hidden", padding: `${CARREAU}px 16px 0 52px`,
              fontFamily: "var(--font-display)", fontSize: "27px", fontWeight: 700, lineHeight: 1.2, paddingBottom: 10, color: colors.navy, boxSizing: "border-box" }} />

          <div ref={pageRef} className={cache ? "carnet-page carnet-cache" : "carnet-page"} contentEditable={!stylo && !cache} suppressContentEditableWarning
            role="textbox" aria-multiline="true" aria-label="Contenu de la note" data-vide="Écris ici…" data-stylo={stylo ?? undefined}
            onInput={planifier} onClick={e => {
              if (cache) { const m = (e.target as Element).closest("mark"); if (m) { m.classList.toggle("vu"); compterCache() } return }
              if (!stylo) surClic(e)
            }} onKeyDown={surTouche} onPaste={surCollage}
            onPointerDown={styloDebut} onPointerMove={styloBouge} onPointerUp={styloFin} onPointerCancel={styloFin}
            style={stylo ? { touchAction: "pan-y" } : undefined} />
          {apercu.map((r, i) => (
            <div key={i} className="carnet-apercu" style={{ left: r.x, top: r.y, width: r.l, height: r.h,
              background: stylo === "gommer" ? "rgba(200,30,63,.18)" : (COULEURS_SURLIGNEUR.find(c => c.id === couleurStylo) ?? COULEURS_SURLIGNEUR[0]).hex }} />
          ))}
        </div>
      </div>

      {plan && <PlanNote titres={plan.titres} marques={plan.marques} onAller={allerA} onFermer={() => setPlan(null)} />}
      {dessin && <Dessin onFermer={() => setDessin(false)} onInserer={png => { setDessin(false); void insererImage(png, "png", "Dessin") }} />}
      {choixChapitre && (
        <ChoixChapitre chapitres={chapitres} onFermer={() => setChoixChapitre(false)}
          onChoisir={id => { setChoixChapitre(false); changerMeta({ chapitre_id: id }) }} />
      )}
    </div>
  )
}

// Plan de la note (titres) et liste des passages surlignés, par couleur
function PlanNote({ titres, marques, onAller, onFermer }: { titres: Element[]; marques: Element[]; onAller: (el: Element) => void; onFermer: () => void }) {
  const [onglet, setOnglet] = useState<"plan" | "surlignages">(titres.length || !marques.length ? "plan" : "surlignages")
  const parCouleur = COULEURS_SURLIGNEUR.map(c => ({ c, liste: marques.filter(m => (m.getAttribute("data-couleur") || "") === c.id) })).filter(g => g.liste.length)
  async function copier() {
    const texte = parCouleur.map(g => `${g.c.nom}\n${g.liste.map(m => `• ${(m.textContent || "").trim()}`).join("\n")}`).join("\n\n")
    try { await navigator.clipboard.writeText(texte); toast("Surlignages copiés", "success") } catch { toast("Copie impossible", "error") }
  }
  useEffect(() => {
    function echap(e: KeyboardEvent) { if (e.key === "Escape") { e.stopPropagation(); onFermer() } }
    window.addEventListener("keydown", echap, true)
    return () => window.removeEventListener("keydown", echap, true)
  }, [onFermer])
  return (
    <div role="dialog" aria-modal="true" aria-label="Plan de la note" onClick={e => { if (e.target === e.currentTarget) onFermer() }}
      style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(10,22,40,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 560, maxHeight: "80dvh", borderRadius: "18px 18px 0 0", padding: "14px 14px calc(14px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div role="tablist" style={{ flex: 1, display: "flex", gap: 2, background: "#EEF2F8", borderRadius: 10, padding: 3, marginRight: 8 }}>
            {(["plan", "surlignages"] as const).map(o => (
              <button key={o} role="tab" aria-selected={onglet === o} onClick={() => setOnglet(o)}
                style={{ flex: 1, border: "none", borderRadius: 8, padding: "8px 0", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  background: onglet === o ? "#fff" : "transparent", color: onglet === o ? colors.navy : "#6B7280" }}>
                {o === "plan" ? `Plan (${titres.length})` : `Surlignages (${marques.length})`}
              </button>
            ))}
          </div>
          <button onClick={onFermer} className="carnet-puce" style={{ border: "none" }}>Fermer</button>
        </div>
        <div style={{ overflowY: "auto" }}>
          {onglet === "plan" && (titres.length ? titres.map((h, i) => (
            <button key={i} onClick={() => onAller(h)}
              style={{ width: "100%", display: "block", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${colors.border}`, cursor: "pointer",
                padding: h.tagName === "H2" ? "11px 4px" : "9px 4px 9px 22px", fontSize: h.tagName === "H2" ? 15 : 14, fontWeight: h.tagName === "H2" ? 700 : 500, color: colors.text }}>
              {h.textContent}
            </button>
          )) : <p style={{ fontSize: 13, color: colors.textMuted }}>Aucun titre pour l&apos;instant. Utilise « Titre » et « Sous-titre » pour structurer ta note : le plan apparaîtra ici.</p>)}
          {onglet === "surlignages" && (parCouleur.length ? (
            <>
              {parCouleur.map(g => (
                <div key={g.c.nom} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "#6B7280", padding: "8px 4px 4px" }}>
                    <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: 4, background: g.c.hex }} />{g.c.nom} ({g.liste.length})
                  </div>
                  {g.liste.map((m, i) => (
                    <button key={i} onClick={() => onAller(m)}
                      style={{ width: "100%", display: "block", textAlign: "left", background: "none", border: "none", borderBottom: `1px solid ${colors.border}`, padding: "9px 4px", cursor: "pointer", fontSize: 14, color: colors.text }}>
                      <span style={{ background: g.c.hex, borderRadius: 3, padding: "0 3px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>{(m.textContent || "").trim()}</span>
                    </button>
                  ))}
                </div>
              ))}
              <button className="carnet-choix" style={{ width: "100%", marginTop: 4 }} onClick={() => void copier()}>Copier tous les surlignages</button>
            </>
          ) : <p style={{ fontSize: 13, color: colors.textMuted }}>Aucun passage surligné. Astuce : une couleur par type d&apos;info (ex. jaune = définitions, vert = exemples, rose = à apprendre par cœur).</p>)}
        </div>
      </div>
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
