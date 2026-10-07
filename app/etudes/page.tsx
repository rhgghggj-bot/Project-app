"use client"
import { useState } from "react"
import SectionHeader from "@/app/components/ui/SectionHeader"
import Button from "@/app/components/ui/Button"
import { SkeletonPage } from "@/app/components/ui/Skeleton"
import Tutorial from "@/app/components/Tutorial"
import { colors, radius } from "@/app/components/ui/tokens"
import { supabase } from "@/lib/supabase"
import { toast } from "@/lib/toast"
import { useChargement } from "@/lib/useChargement"
import { ecrireStockage, useStockagesLocaux } from "@/lib/useStockage"
import { OLLAMA_MODELE_DEFAUT, OLLAMA_URL_DEFAUT, SYSTEMES, type EntreprisePerso, type Pays } from "@/lib/etudes"
import type { ChoixIA, ReglagesIA } from "./document"
import { champ } from "./Depot"
import NotesSection from "./NotesSection"
import CorrectionSection from "./CorrectionSection"
import RevisionSection from "./RevisionSection"
import Donnees from "./Donnees"
import ArtefactsSection from "./ArtefactsSection"
import { CURSUS, descriptionNiveau, matieresProposees, trouverNiveau } from "@/lib/cursus"

type Onglet = "notes" | "corriger" | "reviser" | "artefacts"
type Profil = { pays: Pays; niveau: string | null; filiere: string | null; specialites: string[]; entreprise_id: string; entreprise_perso: EntreprisePerso | null }

const ONGLETS: { id: Onglet; label: string }[] = [
  { id: "notes", label: "Mes notes" },
  { id: "corriger", label: "Corriger" },
  { id: "reviser", label: "Réviser" },
  { id: "artefacts", label: "Artefacts" },
]

// Le choix de l'IA dépend de l'appareil (Ollama tourne en local) : il est
// gardé dans le navigateur, pas dans le profil.
const CLES_IA = ["etudes_ia", "etudes_ollama_url", "etudes_ollama_modele"] as const

export default function EspaceEtudiant() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [onglet, setOnglet] = useState<Onglet>("notes")
  const [reglagesOuverts, setReglagesOuverts] = useState(false)
  // Change après un import pour recharger les onglets
  const [version, setVersion] = useState(0)
  const stockage = useStockagesLocaux(CLES_IA)
  const reglages: ReglagesIA = {
    ia: (stockage.etudes_ia as ChoixIA) === "local" ? "local" : "claude",
    url: stockage.etudes_ollama_url || OLLAMA_URL_DEFAUT,
    modele: stockage.etudes_ollama_modele || OLLAMA_MODELE_DEFAUT,
  }

  async function charger() {
    const { data: { user } } = await supabase.auth.getUser()
    setUserId(user?.id ?? null)
    if (!user) return
    const { data } = await supabase.from("profils_etudiant").select("pays,niveau,filiere,specialites,entreprise_id,entreprise_perso").eq("user_id", user.id).maybeSingle()
    if (data) setProfil({ ...data, specialites: data.specialites ?? [] } as Profil)
    else {
      // Premier passage : pays deviné depuis la langue du navigateur, modifiable ensuite.
      const pays: Pays = navigator.language.toLowerCase().endsWith("-fr") ? "FR" : "CH"
      const nouveau: Profil = { pays, niveau: null, filiere: null, specialites: [], entreprise_id: "cafe", entreprise_perso: null }
      await supabase.from("profils_etudiant").insert({ user_id: user.id, ...nouveau })
      setProfil(nouveau)
    }
  }
  useChargement(charger)

  async function majProfil(modif: Partial<Profil>) {
    if (!userId || !profil) return
    const suivant = { ...profil, ...modif }
    setProfil(suivant)
    const { error } = await supabase.from("profils_etudiant").upsert({ user_id: userId, ...suivant, updated_at: new Date().toISOString() })
    if (error) toast("Réglage non enregistré", "error")
  }

  if (userId === undefined || (userId && !profil)) return <SkeletonPage />

  if (userId === null) {
    return (
      <main className="min-h-screen bg-white">
        <SectionHeader backHref="/" backLabel="← Accueil" title="Espace étudiant" />
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: colors.text, marginBottom: "16px" }}>Connecte-toi pour suivre tes notes et réviser.</p>
          <Button href="/connexion" pill>Se connecter</Button>
        </div>
      </main>
    )
  }

  const p = profil!
  const niveau = trouverNiveau(p.pays, p.niveau)
  const matieres = matieresProposees(p.pays, p.niveau, p.filiere, p.specialites)
  const texteNiveau = descriptionNiveau(p.pays, p.niveau, p.filiere, p.specialites)
  const afficherReglages = reglagesOuverts || !niveau

  return (
    <main className="min-h-screen" style={{ background: "#f8faff" }}>
      <Tutorial page="etudes" />
      <SectionHeader
        backHref="/"
        backLabel="← Accueil"
        title={<><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>Espace étudiant</>}
        subtitle={`${niveau ? niveau.label : SYSTEMES[p.pays].label} · IA : ${reglages.ia === "local" ? "locale (Ollama)" : "Claude"}`}
        action={<Button variant="onDark" onClick={() => setReglagesOuverts(!reglagesOuverts)}>Réglages</Button>}
      />

      <div style={{ padding: "14px 14px 96px", maxWidth: 640, margin: "0 auto" }}>
        {afficherReglages && (
          <div style={{ background: "#fff", border: `0.5px solid ${colors.border}`, borderRadius: radius.md, padding: "14px", marginBottom: "12px" }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text, marginBottom: "8px" }}>Pays et notation</div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
              {(Object.keys(SYSTEMES) as Pays[]).map(k => (
                <Choix key={k} actif={p.pays === k} onClick={() => p.pays !== k && majProfil({ pays: k, niveau: null, filiere: null, specialites: [] })}>{SYSTEMES[k].label}</Choix>
              ))}
            </div>
            <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text, marginBottom: "6px" }}>Mon niveau d&apos;études</div>
            {!niveau && <p style={{ fontSize: "11px", color: colors.textMuted, margin: "0 0 6px" }}>Choisis ton niveau : les matières te seront proposées et l&apos;IA adaptera ses explications.</p>}
            <select value={p.niveau ?? ""} onChange={e => majProfil({ niveau: e.target.value || null, filiere: null, specialites: [] })} style={{ ...champ, marginBottom: "8px" }} aria-label="Niveau d'études">
              <option value="">Choisir…</option>
              {CURSUS[p.pays].map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            {niveau && <p style={{ fontSize: "11px", color: colors.textFaint, margin: "-4px 0 8px" }}>{niveau.detail}</p>}
            {niveau?.filieres && (
              <select value={p.filiere ?? ""} onChange={e => majProfil({ filiere: e.target.value || null })} style={{ ...champ, marginBottom: "8px" }} aria-label={niveau.libelleFiliere || "Filière"}>
                <option value="">{niveau.libelleFiliere || "Filière"} : choisir…</option>
                {niveau.filieres.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            )}
            {niveau?.specialites && (
              <div style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "11px", color: colors.textMuted, marginBottom: "4px" }}>Spécialités (3 en 1re, 2 en terminale)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {niveau.specialites.map(sp => {
                    const coche = p.specialites.includes(sp)
                    return (
                      <button key={sp} aria-pressed={coche}
                        onClick={() => coche ? majProfil({ specialites: p.specialites.filter(x => x !== sp) }) : p.specialites.length < 3 ? majProfil({ specialites: [...p.specialites, sp] }) : toast("3 spécialités maximum", "error")}
                        style={{ fontSize: "11px", padding: "5px 9px", borderRadius: radius.pill, cursor: "pointer", border: `1px solid ${coche ? colors.blue : colors.blueBorder}`, background: coche ? colors.blue : "#fff", color: coche ? "#fff" : colors.textMuted }}>
                        {sp}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div style={{ height: "6px" }} />
            <div style={{ fontSize: "13px", fontWeight: 500, color: colors.text, marginBottom: "8px" }}>Intelligence artificielle</div>
            <div style={{ display: "flex", gap: "6px" }}>
              <Choix actif={reglages.ia === "claude"} onClick={() => ecrireStockage("local", "etudes_ia", "claude")}>Claude (en ligne)</Choix>
              <Choix actif={reglages.ia === "local"} onClick={() => ecrireStockage("local", "etudes_ia", "local")}>IA locale (Ollama)</Choix>
            </div>
            {reglages.ia === "local" ? (
              <div style={{ marginTop: "10px", display: "grid", gap: "6px" }}>
                <p style={{ fontSize: "11px", color: colors.textMuted, margin: 0, lineHeight: 1.5 }}>
                  L&apos;IA tourne sur ton ordinateur : rien ne quitte ton appareil. Installe Ollama, lance un modèle (ex. <code>ollama pull {OLLAMA_MODELE_DEFAUT}</code>) et autorise ce site avec la variable OLLAMA_ORIGINS. Elle lit les photos et le texte, pas les PDF.
                </p>
                <label><span style={{ fontSize: "11px", color: colors.textMuted }}>Adresse d&apos;Ollama</span>
                  <input value={reglages.url} onChange={e => ecrireStockage("local", "etudes_ollama_url", e.target.value)} style={champ} />
                </label>
                <label><span style={{ fontSize: "11px", color: colors.textMuted }}>Modèle</span>
                  <input value={reglages.modele} onChange={e => ecrireStockage("local", "etudes_ollama_modele", e.target.value)} style={champ} />
                </label>
              </div>
            ) : (
              <p style={{ fontSize: "11px", color: colors.textMuted, margin: "10px 0 0", lineHeight: 1.5 }}>
                Claude lit les photos, les PDF et les schémas. Tes documents sont envoyés pour l&apos;analyse puis rangés dans ton espace privé.
              </p>
            )}
            <div style={{ borderTop: `0.5px solid ${colors.border}`, margin: "14px 0 12px" }} />
            <Donnees userId={userId} onImporte={() => { setVersion(v => v + 1); charger() }} />
          </div>
        )}

        <div role="tablist" aria-label="Sections de l'espace étudiant" style={{ display: "flex", gap: "4px", background: colors.blueLight, borderRadius: radius.pill, padding: "4px", marginBottom: "14px" }}>
          {ONGLETS.map(o => (
            <button key={o.id} role="tab" aria-selected={onglet === o.id} onClick={() => setOnglet(o.id)}
              style={{ flex: 1, border: "none", borderRadius: radius.pill, padding: "8px 2px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                background: onglet === o.id ? "#fff" : "transparent", color: onglet === o.id ? colors.blue : colors.textMuted,
                boxShadow: onglet === o.id ? "0 1px 4px rgba(43,127,255,0.15)" : "none" }}>
              {o.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" key={version}>
          {onglet === "notes" && <NotesSection userId={userId} pays={p.pays} matieresProposees={matieres} />}
          {onglet === "corriger" && <CorrectionSection userId={userId} pays={p.pays} niveau={texteNiveau} matieres={matieres} reglages={reglages} />}
          {onglet === "reviser" && (
            <RevisionSection userId={userId} pays={p.pays} niveau={texteNiveau} matieres={matieres} reglages={reglages}
              entrepriseId={p.entreprise_id} entreprisePerso={p.entreprise_perso}
              onChangerEntreprise={(id, perso) => majProfil({ entreprise_id: id, entreprise_perso: perso })} />
          )}
          {onglet === "artefacts" && <ArtefactsSection userId={userId} />}
        </div>
      </div>
    </main>
  )
}

function Choix({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={actif}
      style={{ flex: 1, padding: "9px 8px", borderRadius: radius.sm, fontSize: "12px", fontWeight: 500, cursor: "pointer",
        border: `1px solid ${actif ? colors.blue : colors.blueBorder}`, background: actif ? colors.blue : "#fff", color: actif ? "#fff" : colors.textMuted }}>
      {children}
    </button>
  )
}
