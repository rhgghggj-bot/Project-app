"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { toast, confirmer } from "@/lib/toast"
import { useChargement } from "@/lib/useChargement"
import { colors, radius } from "@/app/components/ui/tokens"
import { ENTREPRISES, FichesSchema, consigneFiches, entrepriseChoisie, quizValide, type EntreprisePerso, type Fiches, type Pays } from "@/lib/etudes"
import { analyserDocument, deposerFichier, lienFichier, type ReglagesIA } from "./document"
import Depot, { Exercice, carte, champ, titreCarte } from "./Depot"
import { PetitBouton } from "./CorrectionSection"
import Quiz from "./Quiz"

type CoursEtudiant = { id: string; matiere: string; titre: string; fichier_path: string | null; entreprise_id: string; fiches: Fiches; created_at: string }

export default function RevisionSection({ userId, pays, reglages, entrepriseId, entreprisePerso, onChangerEntreprise }: {
  userId: string
  pays: Pays
  reglages: ReglagesIA
  entrepriseId: string
  entreprisePerso: EntreprisePerso | null
  onChangerEntreprise: (id: string, perso: EntreprisePerso | null) => void
}) {
  const [cours, setCours] = useState<CoursEtudiant[] | null>(null)
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [choixOuvert, setChoixOuvert] = useState(false)
  const entreprise = entrepriseChoisie(entrepriseId, entreprisePerso)

  async function charger() {
    const { data } = await supabase.from("cours_etudiant").select("id,matiere,titre,fichier_path,entreprise_id,fiches,created_at")
      .eq("user_id", userId).order("created_at", { ascending: false })
    setCours((data || []) as CoursEtudiant[])
  }
  useChargement(charger, userId)

  async function creerFiches(d: { fichier: File | null; texte: string; matiere: string; titre: string }) {
    setEnCours(true)
    try {
      const [fiches, chemin] = await Promise.all([
        analyserDocument({
          mode: "fiches", reglages, fichier: d.fichier, texteColle: d.texte, pays, matiere: d.matiere,
          consigneLocale: consigneFiches({ pays, matiere: d.matiere, entreprise }), schema: FichesSchema,
          entrepriseId, entreprisePerso,
        }),
        d.fichier ? deposerFichier(userId, d.fichier, "cours") : Promise.resolve(null),
      ])
      const { data, error } = await supabase.from("cours_etudiant").insert({
        user_id: userId, matiere: d.matiere, titre: d.titre || fiches.titre, fichier_path: chemin,
        entreprise_id: entreprise.id, fiches, ia: reglages.ia,
      }).select("id,matiere,titre,fichier_path,entreprise_id,fiches,created_at").single()
      if (error || !data) throw new Error("Fiches créées mais pas enregistrées")
      setCours(c => [data as CoursEtudiant, ...(c || [])])
      setOuvert(data.id)
      toast(`${fiches.notions.length} fiches créées`, "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erreur lors de l'analyse du cours", "error")
    } finally {
      setEnCours(false)
    }
  }

  async function supprimer(c: CoursEtudiant) {
    if (!(await confirmer("Supprimer ce cours et ses fiches ?", "Supprimer"))) return
    const { error } = await supabase.from("cours_etudiant").delete().eq("id", c.id)
    if (error) return toast("Suppression impossible", "error")
    if (c.fichier_path) await supabase.storage.from("etudes").remove([c.fichier_path])
    setCours(l => (l || []).filter(x => x.id !== c.id))
  }

  // Regroupe les cours par matière : une "pièce" de l'entreprise par matière.
  const parMatiere = new Map<string, CoursEtudiant[]>()
  for (const c of cours || []) {
    const m = c.matiere || "Autres"
    parMatiere.set(m, [...(parMatiere.get(m) || []), c])
  }

  return (
    <div>
      {/* Entreprise fictive */}
      <div style={{ ...carte, background: `linear-gradient(135deg, ${entreprise.couleur}22, #fff)`, borderColor: `${entreprise.couleur}55` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 12, background: entreprise.couleur, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "16px", flexShrink: 0 }}>
            {entreprise.nom[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "11px", color: colors.textFaint }}>Tu révises à travers</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: colors.text }}>{entreprise.nom}</div>
            <div style={{ fontSize: "11px", color: colors.textMuted }}>{entreprise.secteur}</div>
          </div>
          <PetitBouton onClick={() => setChoixOuvert(!choixOuvert)}>{choixOuvert ? "Fermer" : "Changer"}</PetitBouton>
        </div>
        {entreprise.description && <p style={{ fontSize: "12px", color: colors.textMuted, margin: "8px 0 0", lineHeight: 1.5 }}>{entreprise.description}</p>}
        {choixOuvert && (
          <ChoixEntreprise actuelle={entrepriseId} perso={entreprisePerso}
            onChoisir={(id, perso) => { onChangerEntreprise(id, perso); setChoixOuvert(false) }} />
        )}
      </div>

      <Depot titre="Déposer un cours" ia={reglages.ia} enCours={enCours} libelleAction={`Créer mes fiches avec ${entreprise.nom}`} onEnvoyer={creerFiches}
        aide={`Envoie tes slides ou ton polycopié. Chaque notion devient une fiche avec un résumé, le vocabulaire expliqué, un exemple chez ${entreprise.nom}, un exercice corrigé et un quiz. Tes documents restent privés.`} />

      {cours === null && <div className="nx-skel" style={{ height: 80, borderRadius: radius.md }} />}
      {[...parMatiere.entries()].map(([matiere, liste]) => (
        <div key={matiere} style={{ marginBottom: "6px" }}>
          <div style={{ fontSize: "12px", fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", margin: "14px 2px 8px" }}>{matiere}</div>
          {liste.map(c => (
            <div key={c.id} style={carte}>
              <button onClick={() => setOuvert(ouvert === c.id ? null : c.id)} aria-expanded={ouvert === c.id}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: colors.text }}>{c.titre || "Cours"}</div>
                  <div style={{ fontSize: "11px", color: colors.textFaint }}>{c.fiches.notions.length} fiches · {entrepriseChoisie(c.entreprise_id, entreprisePerso).nom} · {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</div>
                </div>
                <span aria-hidden="true" style={{ color: colors.textFaint }}>{ouvert === c.id ? "▴" : "▾"}</span>
              </button>
              {ouvert === c.id && <DetailCours cours={c} userId={userId} onSupprimer={() => supprimer(c)} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function ChoixEntreprise({ actuelle, perso, onChoisir }: { actuelle: string; perso: EntreprisePerso | null; onChoisir: (id: string, perso: EntreprisePerso | null) => void }) {
  const [form, setForm] = useState<EntreprisePerso>(perso || { nom: "", secteur: "", description: "" })
  return (
    <div style={{ marginTop: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        {ENTREPRISES.map(e => (
          <button key={e.id} onClick={() => onChoisir(e.id, perso)} aria-pressed={actuelle === e.id}
            style={{ textAlign: "left", background: "#fff", border: `1.5px solid ${actuelle === e.id ? e.couleur : colors.border}`, borderRadius: radius.sm, padding: "8px 10px", cursor: "pointer" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: e.couleur }}>{e.nom}</div>
            <div style={{ fontSize: "10px", color: colors.textMuted }}>{e.secteur}</div>
          </button>
        ))}
      </div>
      <div style={{ fontSize: "12px", fontWeight: 500, color: colors.text, margin: "12px 0 6px" }}>Ou invente ta propre entreprise</div>
      <div style={{ display: "grid", gap: "6px" }}>
        <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={champ} placeholder="Nom de l'entreprise" aria-label="Nom de l'entreprise" maxLength={80} />
        <input value={form.secteur} onChange={e => setForm({ ...form, secteur: e.target.value })} style={champ} placeholder="Secteur (ex. boulangerie, banque, start-up…)" aria-label="Secteur" maxLength={80} />
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...champ, resize: "vertical" }} rows={2}
          placeholder="Ce qu'elle fait, sa taille, où elle se trouve…" aria-label="Description" maxLength={400} />
        <button disabled={!form.nom.trim()} onClick={() => onChoisir("perso", { nom: form.nom.trim(), secteur: form.secteur.trim(), description: form.description.trim() })}
          style={{ background: colors.blue, color: "#fff", border: "none", borderRadius: radius.sm, padding: "9px", fontSize: "13px", cursor: form.nom.trim() ? "pointer" : "not-allowed", opacity: form.nom.trim() ? 1 : 0.5 }}>
          Utiliser mon entreprise
        </button>
      </div>
    </div>
  )
}

function DetailCours({ cours, userId, onSupprimer }: { cours: CoursEtudiant; userId: string; onSupprimer: () => void }) {
  const [fiche, setFiche] = useState(0)
  const [quizGlobal, setQuizGlobal] = useState(false)
  const notions = cours.fiches.notions
  const n = notions[fiche]
  const tousLesQuiz = quizValide(notions.flatMap(x => x.quiz))

  async function enregistrerScore(score: number, total: number) {
    await supabase.from("resultats_quiz_etudiant").insert({ user_id: userId, source: "cours", source_id: cours.id, score, total })
  }

  async function ouvrirFichier() {
    if (!cours.fichier_path) return
    const url = await lienFichier(cours.fichier_path)
    if (url) window.open(url, "_blank", "noopener")
    else toast("Fichier introuvable", "error")
  }

  if (!n) return null

  return (
    <div style={{ marginTop: "12px" }}>
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "6px", marginBottom: "8px" }}>
        {notions.map((x, i) => (
          <button key={i} onClick={() => { setFiche(i); setQuizGlobal(false) }} aria-pressed={!quizGlobal && fiche === i}
            style={{ whiteSpace: "nowrap", padding: "6px 10px", borderRadius: radius.pill, border: "none", cursor: "pointer", fontSize: "11px",
              background: !quizGlobal && fiche === i ? colors.blue : colors.blueLight, color: !quizGlobal && fiche === i ? "#fff" : colors.blue }}>
            {i + 1}. {x.titre}
          </button>
        ))}
        {tousLesQuiz.length > 0 && (
          <button onClick={() => setQuizGlobal(true)} aria-pressed={quizGlobal}
            style={{ whiteSpace: "nowrap", padding: "6px 10px", borderRadius: radius.pill, border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 600,
              background: quizGlobal ? colors.gold : colors.goldLight, color: quizGlobal ? "#fff" : "#92400E" }}>
            Quiz du cours
          </button>
        )}
      </div>

      {quizGlobal ? (
        <div style={{ background: "#F8FBFF", borderRadius: radius.sm, padding: "12px" }}>
          <div style={titreCarte}>Quiz de tout le cours · {tousLesQuiz.length} questions</div>
          <Quiz key={`global-${cours.id}`} questions={tousLesQuiz} onTermine={enregistrerScore} />
        </div>
      ) : (
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: colors.text, marginBottom: "6px" }}>{n.titre}</div>
          <p style={{ fontSize: "13px", color: colors.textMuted, lineHeight: 1.55, margin: "0 0 8px" }}>{n.resume}</p>
          {n.points.length > 0 && (
            <ul style={{ margin: "0 0 10px", paddingLeft: "18px" }}>
              {n.points.map((p, i) => <li key={i} style={{ fontSize: "13px", color: colors.text, lineHeight: 1.5, marginBottom: "3px" }}>{p}</li>)}
            </ul>
          )}
          {n.vocabulaire.length > 0 && (
            <div style={{ background: colors.blueLight, borderRadius: radius.sm, padding: "10px 12px", marginBottom: "10px" }}>
              <div style={{ fontSize: "12px", fontWeight: 500, color: colors.blue, marginBottom: "4px" }}>Vocabulaire</div>
              {n.vocabulaire.map((v, i) => <div key={i} style={{ fontSize: "12px", color: colors.text, lineHeight: 1.5 }}><b>{v.mot}</b> : {v.definition}</div>)}
            </div>
          )}
          <div style={{ background: colors.goldLight, borderRadius: radius.sm, padding: "10px 12px", marginBottom: "10px" }}>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "#92400E", marginBottom: "4px" }}>Dans ton entreprise</div>
            <div style={{ fontSize: "12px", color: colors.text, lineHeight: 1.5 }}>{n.exemple_entreprise}</div>
          </div>
          <Exercice numero={1} enonce={n.exercice.enonce} solution={n.exercice.solution} />
          {quizValide(n.quiz).length > 0 && (
            <div style={{ background: "#F8FBFF", borderRadius: radius.sm, padding: "12px", marginTop: "6px" }}>
              <div style={titreCarte}>Teste-toi</div>
              <Quiz key={`${cours.id}-${fiche}`} questions={quizValide(n.quiz)} onTermine={enregistrerScore} />
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
        {cours.fichier_path && <PetitBouton onClick={ouvrirFichier}>Voir le document</PetitBouton>}
        <PetitBouton onClick={onSupprimer} danger>Supprimer</PetitBouton>
      </div>
    </div>
  )
}
