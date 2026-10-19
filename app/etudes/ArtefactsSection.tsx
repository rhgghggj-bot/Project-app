"use client"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast, confirmer } from "@/lib/toast"
import { useChargement } from "@/lib/useChargement"
import { colors, radius } from "@/app/components/ui/tokens"
import { carte, titreCarte } from "./Depot"
import { PetitBouton } from "./CorrectionSection"
import { ChoixEntreprise } from "./RevisionSection"
import { trouverNiveau } from "@/lib/cursus"
import { chapitreVisible, chargerProgramme } from "@/lib/programmes"
import { universPour } from "@/lib/univers"
import type { EntrepriseFictive, EntreprisePerso, Pays } from "@/lib/etudes"

// Pages HTML personnelles (ex. un artefact Claude téléchargé) rangées dans
// l'espace privé de l'élève et affichées dans l'app.
//
// La page tourne dans une iframe isolée (sandbox sans allow-same-origin) :
// elle ne peut lire ni la session ni les données de l'app. Son localStorage
// est remplacé par un stockage en mémoire, renvoyé au parent à chaque
// écriture et sauvegardé à côté du fichier : la progression est conservée
// d'un appareil à l'autre.

const DOSSIER = "artefacts"
const TAILLE_MAX = 15 * 1024 * 1024
const MESSAGE = "nexia-artefact-stockage"

type Artefact = { nom: string; chemin: string; taille: number; maj: string }

function nomAffiche(fichier: string) {
  return fichier.replace(/^\d+-/, "").replace(/\.html?$/i, "").replace(/[_-]+/g, " ")
}

// Script injecté en tête de la page : stockage local simulé + envoi au parent.
function scriptStockage(etat: Record<string, string>) {
  const initial = JSON.stringify(etat).replace(/</g, "\\u003c")
  return `<script>(function(){var d=${initial};function envoyer(){try{parent.postMessage({type:"${MESSAGE}",data:d},"*")}catch(e){}}
var s={getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v);envoyer()},removeItem:function(k){delete d[k];envoyer()},clear:function(){d={};envoyer()},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}};
try{Object.defineProperty(window,"localStorage",{value:s,configurable:true})}catch(e){}})();</script>`
}

function injecter(html: string, script: string) {
  const tete = html.match(/<head[^>]*>/i)
  if (tete?.index !== undefined) {
    const fin = tete.index + tete[0].length
    return html.slice(0, fin) + script + html.slice(fin)
  }
  return script + html
}

// Page de révision par défaut : le modèle public/artefacts/modele-revision.html
// rempli avec les chapitres du programme de l'élève et l'habillage adapté à
// son type d'études (entreprise, lieu de stage, expédition ou examen).
async function pageParDefaut(p: ParDefaut): Promise<string | null> {
  const niveau = trouverNiveau(p.pays, p.niveauId)
  if (!niveau) return null
  const [modele, programme] = await Promise.all([
    fetch("/artefacts/modele-revision.html").then(r => (r.ok ? r.text() : null)).catch(() => null),
    chargerProgramme(p.pays, niveau.id),
  ])
  if (!modele || !programme) return null
  const chapitres = programme.chapitres.filter(c => chapitreVisible(c, p.filiere, p.specialites))
  const filiere = niveau.filieres?.find(f => f.id === p.filiere)?.label ?? null
  const donnees = {
    niveau: niveau.label,
    filiere,
    annees: niveau.annees.filter(a => chapitres.some(c => c.annee === a)),
    anneeActuelle: p.annee,
    univers: universPour({ pays: p.pays, niveauId: niveau.id, niveau: niveau.label, filiere: p.filiere, filiereLabel: filiere, entreprise: p.entreprise }),
    chapitres,
  }
  const json = JSON.stringify(donnees).replace(/</g, "\\u003c")
  return modele.replace("window.DONNEES = null;", () => `window.DONNEES = ${json};`)
}

const DESCRIPTIONS: Record<string, string> = {
  entreprise: "Ton programme sous forme d'entreprise en 3D : chaque matière est un service, chaque chapitre un poste de travail, avec fiches, quiz, révision du jour et progression.",
  lieu: "Ton programme dans un lieu de stage en 3D lié à ta formation : chaque matière est un secteur, avec fiches, quiz, révision du jour et progression.",
  expedition: "Ton programme en expédition : chaque matière est un territoire à explorer, chaque chapitre une étape, avec défis, points et badges.",
  examen: "Ton plan de préparation à l'examen : préparation par discipline, points à retravailler, examen blanc et compte à rebours.",
}

type ParDefaut = {
  pays: Pays
  niveauId: string | null
  filiere: string | null
  specialites: string[]
  annee: string | null
  entreprise: EntrepriseFictive
  entrepriseId: string
  entreprisePerso: EntreprisePerso | null
  onChangerEntreprise: (id: string, perso: EntreprisePerso | null) => void
}

export default function ArtefactsSection({ userId, parDefaut }: { userId: string; parDefaut: ParDefaut }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [liste, setListe] = useState<Artefact[] | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [ouvert, setOuvert] = useState<Source | null>(null)
  const [choixEntreprise, setChoixEntreprise] = useState(false)

  async function charger() {
    const { data, error } = await supabase.storage.from("etudes").list(`${userId}/${DOSSIER}`, { sortBy: { column: "updated_at", order: "desc" } })
    if (error) { setListe([]); return }
    setListe((data || []).filter(f => /\.html?$/i.test(f.name)).map(f => ({
      nom: f.name, chemin: `${userId}/${DOSSIER}/${f.name}`,
      taille: f.metadata?.size ?? 0, maj: f.updated_at ?? f.created_at ?? "",
    })))
  }
  useChargement(charger, userId)

  async function deposer(f: File) {
    if (!/\.html?$/i.test(f.name)) return toast("Choisis un fichier .html", "error")
    if (f.size > TAILLE_MAX) return toast("Fichier trop lourd (15 Mo max)", "error")
    setEnvoi(true)
    const propre = f.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80)
    const { error } = await supabase.storage.from("etudes").upload(`${userId}/${DOSSIER}/${Date.now()}-${propre}`, f, { contentType: "text/html" })
    setEnvoi(false)
    if (error) return toast("Dépôt impossible", "error")
    toast("Page ajoutée", "success")
    charger()
  }

  async function supprimer(a: Artefact) {
    if (!(await confirmer(`Supprimer « ${nomAffiche(a.nom)} » et sa progression ?`, "Supprimer"))) return
    const { error } = await supabase.storage.from("etudes").remove([a.chemin, a.chemin + ".etat.json"])
    if (error) return toast("Suppression impossible", "error")
    setListe(l => (l || []).filter(x => x.chemin !== a.chemin))
  }

  if (ouvert) return <Lecteur source={ouvert} onFermer={() => setOuvert(null)} />

  const niveau = trouverNiveau(parDefaut.pays, parDefaut.niveauId)
  const univers = niveau ? universPour({
    pays: parDefaut.pays, niveauId: niveau.id, niveau: niveau.label, filiere: parDefaut.filiere,
    filiereLabel: niveau.filieres?.find(f => f.id === parDefaut.filiere)?.label ?? null, entreprise: parDefaut.entreprise,
  }) : null
  const couleur = univers?.couleur ?? colors.blue
  const cleDefaut = `${parDefaut.pays}-${parDefaut.niveauId}-${parDefaut.filiere ?? "tous"}`
  const ouvrirDefaut = () => setOuvert({
    titre: `Révision · ${univers?.titre ?? "Mon programme"}`,
    // L'état (progression) est rangé à part des pages personnelles (.html)
    cheminEtat: `${userId}/${DOSSIER}/defaut-${cleDefaut}.etat.json`,
    charger: () => pageParDefaut(parDefaut),
  })

  return (
    <div>
      <div style={{ ...carte, background: `linear-gradient(135deg, ${couleur}1f, #fff)`, borderColor: `${couleur}55` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 10, background: couleur, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
            {univers?.forme === "expedition" ? "🧭" : univers?.forme === "examen" ? "🎯" : (univers?.titre ?? "?")[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "11px", color: colors.textFaint }}>Page de révision par défaut</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: colors.text }}>{univers?.titre ?? "Mon programme"}</div>
            <div style={{ fontSize: "11px", color: colors.textMuted }}>{niveau ? niveau.label : "Choisis ton niveau dans Réglages"}</div>
          </div>
          <PetitBouton onClick={ouvrirDefaut}>Ouvrir</PetitBouton>
        </div>
        <p style={{ fontSize: "12px", color: colors.textMuted, margin: "8px 0 0", lineHeight: 1.5 }}>
          {DESCRIPTIONS[univers?.forme ?? "examen"]}
        </p>
        {univers?.forme === "entreprise" && <button onClick={() => setChoixEntreprise(!choixEntreprise)} style={{ background: "none", border: "none", color: colors.blue, fontSize: "12px", cursor: "pointer", padding: "8px 0 0" }}>
          {choixEntreprise ? "Fermer" : "Changer d'entreprise"}
        </button>}
        {univers?.forme === "entreprise" && choixEntreprise && (
          <ChoixEntreprise actuelle={parDefaut.entrepriseId} perso={parDefaut.entreprisePerso}
            onChoisir={(id, perso) => { parDefaut.onChangerEntreprise(id, perso); setChoixEntreprise(false) }} />
        )}
      </div>

      <div style={carte}>
        <div style={titreCarte}>Mes pages de révision</div>
        <p style={{ fontSize: "12px", color: colors.textMuted, margin: "0 0 10px", lineHeight: 1.5 }}>
          Ajoute une page HTML que tu as créée, par exemple un artefact Claude téléchargé. Elle reste privée, s&apos;ouvre ici en plein écran et garde ta progression.
        </p>
        <button onClick={() => fileRef.current?.click()} disabled={envoi}
          style={{ width: "100%", background: colors.blue, color: "#fff", border: "none", borderRadius: radius.sm, padding: "11px", fontSize: "13px", fontWeight: 500, cursor: envoi ? "wait" : "pointer", opacity: envoi ? 0.6 : 1 }}>
          {envoi ? "Envoi…" : "Ajouter un fichier .html"}
        </button>
        <input ref={fileRef} type="file" accept=".html,.htm,text/html" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) deposer(f) }} />
      </div>

      {liste === null && <div className="nx-skel" style={{ height: 70, borderRadius: radius.md }} />}
      {liste?.length === 0 && <p style={{ fontSize: "12px", color: colors.textFaint, textAlign: "center" }}>Aucune page pour l&apos;instant.</p>}
      {liste?.map(a => (
        <div key={a.chemin} style={{ ...carte, display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 500, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nomAffiche(a.nom)}</div>
            <div style={{ fontSize: "11px", color: colors.textFaint }}>{(a.taille / 1024 / 1024).toFixed(1)} Mo{a.maj ? ` · ${new Date(a.maj).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}` : ""}</div>
          </div>
          <PetitBouton onClick={() => setOuvert({ titre: nomAffiche(a.nom), cheminEtat: a.chemin + ".etat.json", charger: async () => {
            const { data, error } = await supabase.storage.from("etudes").download(a.chemin)
            return error || !data ? null : data.text()
          } })}>Ouvrir</PetitBouton>
          <PetitBouton onClick={() => supprimer(a)} danger>×</PetitBouton>
        </div>
      ))}
    </div>
  )
}

type Source = { titre: string; cheminEtat: string; charger: () => Promise<string | null> }

function Lecteur({ source, onFermer }: { source: Source; onFermer: () => void }) {
  const [doc, setDoc] = useState<string | null>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const cheminEtat = source.cheminEtat

  useChargement(async () => {
    const [html, etat] = await Promise.all([source.charger(), supabase.storage.from("etudes").download(cheminEtat)])
    if (!html) { toast("Impossible d'ouvrir la page", "error"); onFermer(); return }
    let sauvegarde: Record<string, string> = {}
    try { if (etat.data) sauvegarde = JSON.parse(await etat.data.text()) } catch { sauvegarde = {} }
    setDoc(injecter(html, scriptStockage(sauvegarde)))
  }, cheminEtat)

  // Sauvegarde la progression envoyée par la page (au plus toutes les 3 s).
  useEffect(() => {
    let attente: ReturnType<typeof setTimeout> | null = null
    let dernier: Record<string, string> | null = null
    async function enregistrer() {
      attente = null
      if (!dernier) return
      const corps = new Blob([JSON.stringify(dernier)], { type: "application/json" })
      await supabase.storage.from("etudes").upload(cheminEtat, corps, { upsert: true, contentType: "application/json" })
    }
    function recevoir(e: MessageEvent) {
      if (e.source !== frameRef.current?.contentWindow || e.data?.type !== MESSAGE) return
      dernier = e.data.data
      if (!attente) attente = setTimeout(enregistrer, 3000)
    }
    window.addEventListener("message", recevoir)
    return () => {
      window.removeEventListener("message", recevoir)
      if (attente) { clearTimeout(attente); void enregistrer() }
    }
  }, [cheminEtat])

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: colors.navy, color: "#fff" }}>
        <button onClick={onFermer} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: radius.pill, padding: "6px 14px", fontSize: "13px", cursor: "pointer" }}>← Fermer</button>
        <span style={{ fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{source.titre}</span>
      </div>
      {doc === null ? (
        <div className="nx-skel" style={{ flex: 1 }} />
      ) : (
        <iframe ref={frameRef} srcDoc={doc} title={source.titre}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-downloads"
          style={{ flex: 1, border: "none", width: "100%" }} />
      )}
    </div>
  )
}
