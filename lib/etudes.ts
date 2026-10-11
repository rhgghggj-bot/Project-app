import { z } from "zod"

// ─── Notation selon le pays ────────────────────────────────────────────────
// Chaque note garde son échelle : changer de pays ne fausse pas les anciennes.
export type Pays = "CH" | "FR"
export type Echelle = "CH6" | "FR20"

export const SYSTEMES: Record<Pays, { echelle: Echelle; label: string; min: number; max: number; suffisant: number; pas: number; devise: string }> = {
  CH: { echelle: "CH6", label: "Suisse · notes de 1 à 6", min: 1, max: 6, suffisant: 4, pas: 0.1, devise: "CHF" },
  FR: { echelle: "FR20", label: "France · notes sur 20", min: 0, max: 20, suffisant: 10, pas: 0.25, devise: "EUR" },
}

export function systemeDeEchelle(echelle: Echelle) {
  return echelle === "CH6" ? SYSTEMES.CH : SYSTEMES.FR
}

export function formaterNote(note: number, echelle: Echelle) {
  const txt = note.toLocaleString("fr-FR", { maximumFractionDigits: 2 })
  return echelle === "FR20" ? `${txt}/20` : txt
}

// Moyenne pondérée par les coefficients ; null s'il n'y a aucune note.
export function moyennePonderee(notes: { note: number; coefficient: number }[]): number | null {
  const poids = notes.reduce((s, n) => s + n.coefficient, 0)
  if (poids <= 0) return null
  return notes.reduce((s, n) => s + n.note * n.coefficient, 0) / poids
}

// Début de l'année scolaire en cours (août en Suisse romande, septembre en France).
export function debutAnneeScolaire(pays: Pays, aujourdhui = new Date()): Date {
  const moisDebut = pays === "CH" ? 7 : 8
  const annee = aujourdhui.getMonth() >= moisDebut ? aujourdhui.getFullYear() : aujourdhui.getFullYear() - 1
  return new Date(annee, moisDebut, 1)
}

// ─── Entreprises fictives pour réviser ─────────────────────────────────────
// Chaque cours déposé est illustré à travers l'entreprise choisie par
// l'étudiant : les exemples, exercices et quiz parlent de "son" entreprise.
export type EntrepriseFictive = {
  id: string
  nom: string
  secteur: string
  description: string
  couleur: string
}

export const ENTREPRISES: EntrepriseFictive[] = [
  { id: "cafe", nom: "Lumen Café", secteur: "Restauration", couleur: "#D97706",
    description: "Petite chaîne de 3 cafés-boulangeries en centre-ville, 25 employés, produits faits maison." },
  { id: "jeux", nom: "Pixel Forge Studio", secteur: "Tech · jeux vidéo", couleur: "#7C3AED",
    description: "Studio indépendant de 12 personnes qui développe et vend des jeux mobiles et PC." },
  { id: "bio", nom: "Verde Market", secteur: "Commerce en ligne", couleur: "#16A34A",
    description: "Épicerie bio en ligne qui livre des paniers de producteurs locaux, 18 employés." },
  { id: "sante", nom: "Clinique Alpina", secteur: "Santé", couleur: "#0EA5E9",
    description: "Centre médical de quartier avec 8 médecins, physiothérapie et laboratoire." },
  { id: "sport", nom: "Nova Sport Club", secteur: "Sport et loisirs", couleur: "#E11D48",
    description: "Réseau de 2 salles de fitness avec cours collectifs, abonnements et boutique." },
  { id: "mode", nom: "Fil Rouge", secteur: "Mode responsable", couleur: "#DB2777",
    description: "Marque de vêtements éthiques, atelier de confection et vente en boutique et en ligne." },
  { id: "voyage", nom: "Horizon Voyages", secteur: "Tourisme", couleur: "#0D9488",
    description: "Agence de voyages qui organise des séjours sur mesure et des voyages d'étude." },
  { id: "energie", nom: "SolarNest", secteur: "Énergie et industrie", couleur: "#CA8A04",
    description: "PME qui fabrique et installe des panneaux solaires pour particuliers, 40 employés." },
]

export type EntreprisePerso = { nom: string; secteur: string; description: string }

export function entrepriseChoisie(id: string | null | undefined, perso: EntreprisePerso | null | undefined): EntrepriseFictive {
  if (id === "perso" && perso?.nom) {
    return { id: "perso", nom: perso.nom, secteur: perso.secteur || "Autre", description: perso.description || "", couleur: "#2B7FFF" }
  }
  return ENTREPRISES.find(e => e.id === id) || ENTREPRISES[0]
}

// ─── Format des réponses de l'IA (Claude ou IA locale) ─────────────────────
export const QuestionQuizSchema = z.object({
  question: z.string(),
  choix: z.array(z.string()).describe("Exactement 4 propositions"),
  bonne: z.number().int().describe("Index (0 à 3) de la bonne réponse dans choix"),
  explication: z.string(),
})
export type QuestionQuiz = z.infer<typeof QuestionQuizSchema>

export const CorrectionSchema = z.object({
  matiere: z.string(),
  titre: z.string().describe("Titre court de l'évaluation"),
  note_estimee: z.number().nullable().describe("Note estimée dans l'échelle demandée, ou null si impossible à estimer"),
  resume: z.string().describe("Bilan en 2-3 phrases, encourageant et honnête"),
  erreurs: z.array(z.object({
    question: z.string().describe("Numéro ou intitulé de la question"),
    reponse_eleve: z.string(),
    correction: z.string().describe("La bonne réponse"),
    explication: z.string().describe("Pourquoi c'est faux et comment raisonner, en mots simples"),
    notion: z.string().describe("Notion du cours à retravailler"),
  })),
  points_forts: z.array(z.string()),
  exercices: z.array(z.object({ enonce: z.string(), solution: z.string() })).describe("3 exercices ciblés sur les erreurs"),
  quiz: z.array(QuestionQuizSchema).describe("5 questions de quiz sur les notions ratées"),
})
export type Correction = z.infer<typeof CorrectionSchema>

export const FichesSchema = z.object({
  titre: z.string().describe("Titre du cours ou du chapitre"),
  notions: z.array(z.object({
    titre: z.string(),
    resume: z.string().describe("L'essentiel en 2-4 phrases simples"),
    points: z.array(z.string()).describe("Définitions, formules et points clés"),
    vocabulaire: z.array(z.object({ mot: z.string(), definition: z.string() })).describe("Mots techniques expliqués simplement"),
    exemple_entreprise: z.string().describe("Application concrète dans l'entreprise fictive"),
    exercice: z.object({ enonce: z.string(), solution: z.string() }),
    quiz: z.array(QuestionQuizSchema).describe("3 questions de compréhension (pas de calcul par cœur)"),
  })),
})
export type Fiches = z.infer<typeof FichesSchema>

// ─── Consignes communes aux deux IA ────────────────────────────────────────
function ligneNiveau(niveau?: string) {
  return niveau ? `\nNiveau d'études : ${niveau}. Adapte le vocabulaire et la difficulté à ce niveau.` : ""
}

export function consigneCorrection(opts: { pays: Pays; matiere: string; niveau?: string }) {
  const s = SYSTEMES[opts.pays]
  return `Tu es un professeur bienveillant qui corrige l'évaluation d'un élève ou étudiant (${opts.pays === "CH" ? "Suisse" : "France"}).
Matière indiquée : ${opts.matiere || "à déduire du document"}.${ligneNiveau(opts.niveau)}
Barème : ${s.label} (suffisant = ${s.suffisant}). Donne note_estimee dans cette échelle.
- Lis toute la copie. Pour chaque réponse fausse ou incomplète, donne la bonne réponse et explique simplement le raisonnement.
- Si la copie est déjà corrigée par le professeur, appuie-toi sur ses annotations.
- Propose 3 exercices d'entraînement ciblés sur les erreurs (avec solution détaillée) et 5 questions de quiz à 4 choix sur les notions ratées.
- S'il n'y a aucune erreur, propose des exercices pour aller plus loin.
- Réponds en français, sans markdown, sans jargon non expliqué.`
}

export function consigneFiches(opts: { pays: Pays; matiere: string; entreprise: EntrepriseFictive; niveau?: string }) {
  const e = opts.entreprise
  return `Tu aides un étudiant (${opts.pays === "CH" ? "Suisse" : "France"}, devise ${SYSTEMES[opts.pays].devise}) à réviser un cours.
Matière : ${opts.matiere || "à déduire du document"}.${ligneNiveau(opts.niveau)}
Il révise à travers une entreprise fictive : ${e.nom} (${e.secteur}). ${e.description}
- Découpe le document en notions (une fiche par notion importante, 3 à 10 notions).
- Reste fidèle au cours : définitions, listes, formules et exemples du professeur.
- Explique chaque mot technique simplement (champ vocabulaire).
- Pour chaque notion : un exemple concret chez ${e.nom}, un exercice avec solution, et 3 questions de quiz à 4 choix sur la compréhension (pas de chiffres à retenir par cœur).
- Réponds en français, sans markdown.`
}

// ─── IA locale (Ollama sur l'appareil de l'utilisateur) ────────────────────
// Ollama tourne sur la machine de l'étudiant : l'appel part donc du
// navigateur, pas du serveur. Sur un site déployé, il faut autoriser
// l'origine côté Ollama (variable OLLAMA_ORIGINS).
export const OLLAMA_URL_DEFAUT = "http://localhost:11434"
export const OLLAMA_MODELE_DEFAUT = "llama3.1:8b"

export async function appelerIALocale<T>(opts: {
  url: string
  modele: string
  consigne: string
  texte: string
  schema: z.ZodType<T>
}): Promise<T> {
  const res = await fetch(`${opts.url.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.modele,
      stream: false,
      format: z.toJSONSchema(opts.schema),
      messages: [
        { role: "system", content: opts.consigne },
        { role: "user", content: `Voici le texte du document :\n\n${opts.texte}` },
      ],
    }),
  })
  if (!res.ok) throw new Error(`IA locale : erreur ${res.status}`)
  const data = await res.json()
  const brut = data?.message?.content
  if (typeof brut !== "string") throw new Error("IA locale : réponse vide")
  return opts.schema.parse(JSON.parse(brut))
}

// Questions de quiz valides uniquement (l'IA locale peut se tromper d'index).
export function quizValide(quiz: QuestionQuiz[]): QuestionQuiz[] {
  return quiz.filter(q => q.choix.length >= 2 && q.bonne >= 0 && q.bonne < q.choix.length)
}
