"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast, confirmer } from "@/lib/toast"
import { useChargement } from "@/lib/useChargement"
import { colors, radius } from "@/app/components/ui/tokens"
import { CorrectionSchema, SYSTEMES, consigneCorrection, formaterNote, quizValide, type Correction, type Echelle, type Pays, systemeDeEchelle } from "@/lib/etudes"
import { analyserDocument, deposerFichier, lienFichier, type ReglagesIA } from "./document"
import Depot, { Exercice, carte, titreCarte } from "./Depot"
import Quiz from "./Quiz"

// L'échelle est gardée avec la correction : changer de pays ne fausse pas la note estimée.
type CorrectionEnregistree = Correction & { echelle: Echelle }
type EvaluationCorrigee = { id: string; matiere: string; titre: string; fichier_path: string | null; correction: CorrectionEnregistree; created_at: string }

export default function CorrectionSection({ userId, pays, niveau, matieres, reglages }: { userId: string; pays: Pays; niveau: string; matieres: string[]; reglages: ReglagesIA }) {
  const [liste, setListe] = useState<EvaluationCorrigee[] | null>(null)
  const [ouverte, setOuverte] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  async function charger() {
    const { data } = await supabase.from("evaluations_corrigees").select("id,matiere,titre,fichier_path,correction,created_at")
      .eq("user_id", userId).order("created_at", { ascending: false })
    setListe((data || []) as EvaluationCorrigee[])
  }
  useChargement(charger, userId)

  async function corriger(d: { fichier: File | null; texte: string; matiere: string; titre: string }) {
    setEnCours(true)
    try {
      const [correction, chemin] = await Promise.all([
        analyserDocument({
          mode: "correction", reglages, fichier: d.fichier, texteColle: d.texte, pays, niveau, matiere: d.matiere,
          consigneLocale: consigneCorrection({ pays, matiere: d.matiere, niveau }), schema: CorrectionSchema,
        }),
        d.fichier ? deposerFichier(userId, d.fichier, "evaluations") : Promise.resolve(null),
      ])
      const { data, error } = await supabase.from("evaluations_corrigees").insert({
        user_id: userId, matiere: d.matiere || correction.matiere, titre: d.titre || correction.titre,
        fichier_path: chemin, correction: { ...correction, echelle: SYSTEMES[pays].echelle }, ia: reglages.ia,
      }).select("id,matiere,titre,fichier_path,correction,created_at").single()
      if (error || !data) throw new Error("Correction faite mais pas enregistrée")
      setListe(l => [data as EvaluationCorrigee, ...(l || [])])
      setOuverte(data.id)
      toast("Correction prête", "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur lors de la correction", "error")
    } finally {
      setEnCours(false)
    }
  }

  async function supprimer(ev: EvaluationCorrigee) {
    if (!(await confirmer("Supprimer cette correction ?", "Supprimer"))) return
    const { error } = await supabase.from("evaluations_corrigees").delete().eq("id", ev.id)
    if (error) return toast("Suppression impossible", "error")
    if (ev.fichier_path) await supabase.storage.from("etudes").remove([ev.fichier_path])
    setListe(l => (l || []).filter(x => x.id !== ev.id))
  }

  return (
    <div>
      <Depot titre="Scanner une évaluation" matieres={matieres} ia={reglages.ia} enCours={enCours} libelleAction="Corriger mon évaluation" onEnvoyer={corriger}
        aide="Photographie ta copie (ou ton test corrigé par le prof). L'IA repère les erreurs, explique la bonne réponse et te prépare des exercices et un quiz sur tes points faibles." />

      {liste === null && <div className="nx-skel" style={{ height: 80, borderRadius: radius.md }} />}
      {liste?.map(ev => (
        <div key={ev.id} style={carte}>
          <button onClick={() => setOuverte(ouverte === ev.id ? null : ev.id)} aria-expanded={ouverte === ev.id}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: 500, color: colors.text }}>{ev.titre || "Évaluation"}</div>
              <div style={{ fontSize: "11px", color: colors.textFaint }}>{ev.matiere} · {new Date(ev.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · {ev.correction.erreurs.length} erreur{ev.correction.erreurs.length > 1 ? "s" : ""}</div>
            </div>
            {ev.correction.note_estimee !== null && (
              <b style={{ fontSize: "15px", color: ev.correction.note_estimee >= systemeDeEchelle(ev.correction.echelle).suffisant ? colors.green : colors.red }}>
                ≈ {formaterNote(ev.correction.note_estimee, ev.correction.echelle)}
              </b>
            )}
            <span aria-hidden="true" style={{ color: colors.textFaint }}>{ouverte === ev.id ? "▴" : "▾"}</span>
          </button>
          {ouverte === ev.id && <DetailCorrection ev={ev} userId={userId} onSupprimer={() => supprimer(ev)} />}
        </div>
      ))}
    </div>
  )
}

function DetailCorrection({ ev, userId, onSupprimer }: { ev: EvaluationCorrigee; userId: string; onSupprimer: () => void }) {
  const c = ev.correction
  const systeme = systemeDeEchelle(c.echelle)
  const quiz = quizValide(c.quiz)

  async function ajouterAuxNotes() {
    if (c.note_estimee === null) return
    const note = Math.min(systeme.max, Math.max(systeme.min, c.note_estimee))
    const { error } = await supabase.from("notes_etudiant").insert({
      user_id: userId, matiere: ev.matiere || "Autre", titre: ev.titre || null, note, echelle: systeme.echelle, coefficient: 1,
    })
    toast(error ? "Impossible d'ajouter la note" : "Note ajoutée à ton suivi", error ? "error" : "success")
  }

  async function ouvrirFichier() {
    if (!ev.fichier_path) return
    const url = await lienFichier(ev.fichier_path)
    if (url) window.open(url, "_blank", "noopener")
    else toast("Fichier introuvable", "error")
  }

  async function enregistrerScore(score: number, total: number) {
    await supabase.from("resultats_quiz_etudiant").insert({ user_id: userId, source: "evaluation", source_id: ev.id, score, total })
  }

  return (
    <div style={{ marginTop: "12px" }}>
      <p style={{ fontSize: "13px", color: colors.textMuted, lineHeight: 1.55, margin: "0 0 10px" }}>{c.resume}</p>

      {c.points_forts.length > 0 && (
        <div style={{ background: colors.greenLight, borderRadius: radius.sm, padding: "10px 12px", marginBottom: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: 500, color: colors.green, marginBottom: "4px" }}>Ce que tu maîtrises</div>
          {c.points_forts.map((p, i) => <div key={i} style={{ fontSize: "12px", color: colors.text, lineHeight: 1.5 }}>• {p}</div>)}
        </div>
      )}

      {c.erreurs.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <div style={titreCarte}>Correction détaillée</div>
          {c.erreurs.map((e, i) => (
            <div key={i} style={{ border: `0.5px solid ${colors.redBorder}`, borderRadius: radius.sm, padding: "10px 12px", marginBottom: "8px" }}>
              <div style={{ fontSize: "12px", fontWeight: 500, color: colors.text, marginBottom: "4px" }}>{e.question} <span style={{ fontWeight: 400, color: colors.textFaint }}>· {e.notion}</span></div>
              <div style={{ fontSize: "12px", color: colors.red, lineHeight: 1.5 }}>Ta réponse : {e.reponse_eleve}</div>
              <div style={{ fontSize: "12px", color: colors.green, lineHeight: 1.5 }}>Correction : {e.correction}</div>
              <div style={{ fontSize: "12px", color: colors.textMuted, lineHeight: 1.5, marginTop: "4px" }}>{e.explication}</div>
            </div>
          ))}
        </div>
      )}

      {c.exercices.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <div style={titreCarte}>Exercices pour t&apos;entraîner</div>
          {c.exercices.map((x, i) => <Exercice key={i} numero={i + 1} enonce={x.enonce} solution={x.solution} />)}
        </div>
      )}

      {quiz.length > 0 && (
        <div style={{ background: "#F8FBFF", borderRadius: radius.sm, padding: "12px", marginBottom: "10px" }}>
          <div style={titreCarte}>Quiz sur tes erreurs</div>
          <Quiz questions={quiz} onTermine={enregistrerScore} />
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {c.note_estimee !== null && <PetitBouton onClick={ajouterAuxNotes}>Ajouter la note à mon suivi</PetitBouton>}
        {ev.fichier_path && <PetitBouton onClick={ouvrirFichier}>Voir ma copie</PetitBouton>}
        <PetitBouton onClick={onSupprimer} danger>Supprimer</PetitBouton>
      </div>
    </div>
  )
}

export function PetitBouton({ children, onClick, danger = false }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      style={{ background: danger ? colors.redLight : colors.blueLight, color: danger ? colors.red : colors.blue, border: "none", borderRadius: radius.pill, padding: "7px 14px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
      {children}
    </button>
  )
}
