import type { EntrepriseFictive, Pays } from "./etudes"

// Habillage de la page de révision par défaut, choisi selon le type d'études.
// L'entreprise fictive (forme Bise Cycles) n'a de sens que pour les
// formations commerciales ou en entreprise ; ailleurs la même mécanique
// (fiches, quiz, révision du jour) prend la forme la plus parlante :
//   - entreprise : commerce, gestion, apprentissage → l'entreprise de l'élève ;
//   - lieu       : formations tournées vers un métier (santé, social, arts,
//                  technique…) → un lieu de stage fictif, chaque matière un
//                  secteur de ce lieu ;
//   - expedition : école obligatoire (cycle, collège français) → une carte
//                  de territoires à explorer, étapes, badges et points ;
//   - examen     : voies générales et études académiques → un tableau de
//                  préparation à l'examen avec compte à rebours.

export type FormeUnivers = "entreprise" | "lieu" | "expedition" | "examen"

export type Univers = {
  forme: FormeUnivers
  titre: string
  sousTitre: string
  intro: string
  couleur: string
  piece: string        // nom d'une matière dans cet univers (« Service », « Unité »…)
  plan: string         // titre de la grille des matières
  fiche: { titre: string; lignes: [string, string][] }
  examen?: string      // forme examen : nom de l'examen visé
}

type Lieu = Omit<Univers, "forme" | "fiche" | "examen"> & { type: string; role: string; filieres: string[] }

const LIEUX: Lieu[] = [
  { filieres: ["ecg-sante", "heds", "mp-sante", "st2s", "pro-sante", "u-medecine", "pass-las"],
    titre: "Centre de santé des Tilleuls", sousTitre: "Lieu de stage fictif", type: "Centre de soins de quartier : consultations, soins, laboratoire", role: "Stagiaire",
    couleur: "#0EA5E9", piece: "Unité", plan: "Plan du centre",
    intro: "Tu fais ton stage au centre : chaque unité correspond à une matière. Entre dans une unité pour réviser ses chapitres, puis teste-toi : un chapitre est maîtrisé quand tu réussis tout son quiz." },
  { filieres: ["ecg-social", "hets"],
    titre: "Maison de quartier des Platanes", sousTitre: "Lieu de stage fictif", type: "Accueil, animation et accompagnement des habitants", role: "Stagiaire",
    couleur: "#E11D48", piece: "Secteur", plan: "Plan de la maison",
    intro: "Tu fais ton stage à la maison de quartier : chaque secteur correspond à une matière. Réviser ses chapitres, puis se tester : un chapitre est maîtrisé quand tout son quiz est réussi." },
  { filieres: ["ecg-pedagogie"],
    titre: "École des Cerisiers", sousTitre: "Lieu de stage fictif", type: "École primaire, 12 classes", role: "Assistant·e en classe",
    couleur: "#16A34A", piece: "Classe", plan: "Plan de l'école",
    intro: "Tu fais ton stage à l'école : chaque classe correspond à une matière. Entre dans une classe pour réviser ses chapitres, puis teste-toi." },
  { filieres: ["ecg-com"],
    titre: "Le Journal du Lac", sousTitre: "Rédaction fictive", type: "Quotidien régional, papier et en ligne", role: "Stagiaire en rédaction",
    couleur: "#334155", piece: "Rubrique", plan: "Sommaire de la rédaction",
    intro: "Tu rejoins la rédaction : chaque rubrique correspond à une matière. Prépare tes sujets en révisant les chapitres, puis teste-toi." },
  { filieres: ["heg-id"],
    titre: "Médiathèque des Trois-Ponts", sousTitre: "Lieu de stage fictif", type: "Bibliothèque, archives et services numériques", role: "Stagiaire",
    couleur: "#7C3AED", piece: "Fonds", plan: "Plan de la médiathèque",
    intro: "Chaque fonds de la médiathèque correspond à une matière. Explore ses chapitres, puis teste-toi : un chapitre est maîtrisé quand tout son quiz est réussi." },
  { filieres: ["ecg-arts", "mp-arts", "std2a", "s2tmd"],
    titre: "La Fabrique", sousTitre: "Atelier-galerie fictif", type: "Ateliers de création, galerie et scène", role: "Résident·e",
    couleur: "#DB2777", piece: "Atelier", plan: "Plan de La Fabrique",
    intro: "Tu es en résidence à La Fabrique : chaque atelier correspond à une matière. Travaille ses chapitres, puis teste-toi." },
  { filieres: ["hepia", "mp-tech", "sti2d", "pro-industrie", "pro-btp"],
    titre: "Bureau Ingénia", sousTitre: "Bureau d'ingénieurs fictif", type: "Études, conception et suivi de chantiers", role: "Stagiaire technique",
    couleur: "#CA8A04", piece: "Département", plan: "Plan du bureau",
    intro: "Tu rejoins le bureau d'ingénieurs : chaque département correspond à une matière. Révise ses chapitres, puis teste-toi." },
  { filieres: ["stl", "mp-nature", "stav"],
    titre: "Laboratoire Helix", sousTitre: "Laboratoire fictif", type: "Analyses, recherche et environnement", role: "Stagiaire de laboratoire",
    couleur: "#0D9488", piece: "Paillasse", plan: "Plan du laboratoire",
    intro: "Tu travailles au laboratoire : chaque paillasse correspond à une matière. Révise ses chapitres, puis teste-toi." },
  { filieres: ["u-droit", "licence-droit"],
    titre: "Étude Lambert & Associés", sousTitre: "Étude d'avocats fictive", type: "Conseil et défense des particuliers et des entreprises", role: "Stagiaire juriste",
    couleur: "#1E3A8A", piece: "Dossier", plan: "Les dossiers de l'étude",
    intro: "Tu rejoins l'étude : chaque dossier correspond à une matière. Prépare-le en révisant ses chapitres, puis teste-toi." },
  { filieres: ["sthr", "pro-hotellerie"],
    titre: "Hôtel du Lac", sousTitre: "Hôtel-restaurant fictif", type: "Hôtel 4 étoiles, 60 chambres et restaurant", role: "Stagiaire",
    couleur: "#B45309", piece: "Service", plan: "Plan de l'hôtel",
    intro: "Tu fais ton stage à l'hôtel : chaque service correspond à une matière. Révise ses chapitres, puis teste-toi." },
]

// Formations où l'élève travaille (ou travaillera) dans une entreprise
const ENTREPRISE_NIVEAUX = ["cfc-commerce", "cfc-autre"]
const ENTREPRISE_FILIERES = ["heg-ee", "heg-ig", "heg-ihm", "mp-eco", "os-ed", "u-gsem", "stmg", "pro-relation-client", "pro-gatl", "bts", "but", "licence-eco", "ecole"]

const EXPEDITION_NIVEAUX = ["co", "college-fr"]

const EXAMENS: Record<string, string> = {
  college: "la maturité", ecg: "le certificat ECG", mp2: "la maturité professionnelle", hes: "tes examens de semestre",
  uni: "ta session d'examens", seconde: "le bac", "lycee-general": "le bac",
  "lycee-techno": "le bac", "lycee-pro": "le bac pro", "sup-fr": "tes partiels",
}

export function universPour(opts: { pays: Pays; niveauId: string; niveau: string; filiere: string | null; filiereLabel: string | null; entreprise: EntrepriseFictive }): Univers {
  const { niveauId, niveau, filiere, filiereLabel, entreprise } = opts
  const formation = filiereLabel || niveau

  if (EXPEDITION_NIVEAUX.includes(niveauId)) {
    return {
      forme: "expedition", titre: "L'expédition", sousTitre: "Plan de révision", couleur: "#F97316",
      piece: "Territoire", plan: "La carte",
      intro: "Chaque territoire de la carte est une matière, chaque chapitre une étape. Lis la fiche de l'étape, réussis son défi pour la valider et gagne un badge quand tout le territoire est exploré.",
      fiche: { titre: "Carnet de bord", lignes: [[filiereLabel ? "Section" : "Niveau", formation]] },
    }
  }

  if (ENTREPRISE_NIVEAUX.includes(niveauId) || (filiere && ENTREPRISE_FILIERES.includes(filiere))) {
    const lignes: [string, string][] = [["Raison sociale", entreprise.nom]]
    if (entreprise.secteur) lignes.push(["Secteur", entreprise.secteur])
    if (entreprise.description) lignes.push(["Activité", entreprise.description])
    lignes.push(["Formation", formation])
    return {
      forme: "entreprise", titre: entreprise.nom, sousTitre: "Entreprise fictive", couleur: entreprise.couleur,
      piece: "Service", plan: "Plan de l'entreprise",
      intro: "Chaque service du bâtiment correspond à une matière. Entre dans une pièce pour réviser ses chapitres, puis teste-toi : un chapitre est maîtrisé quand tu réussis tout son quiz.",
      fiche: { titre: "Extrait du registre (fictif)", lignes },
    }
  }

  const lieu = filiere ? LIEUX.find(l => l.filieres.includes(filiere)) : undefined
  if (lieu) {
    return {
      forme: "lieu", titre: lieu.titre, sousTitre: lieu.sousTitre, intro: lieu.intro, couleur: lieu.couleur, piece: lieu.piece, plan: lieu.plan,
      fiche: { titre: "Fiche de stage", lignes: [["Lieu", lieu.titre], ["Activité", lieu.type], ["Ton rôle", lieu.role], ["Formation", formation]] },
    }
  }

  const examen = filiere === "cpge" ? "les concours" : EXAMENS[niveauId] ?? "tes examens"
  return {
    forme: "examen", titre: `Objectif ${examen.replace(/^(la|le|les|tes|ta|ton) /, "")}`, sousTitre: "Plan de révision", couleur: "#2B7FFF",
    piece: "Discipline", plan: "Tableau de préparation", examen,
    intro: `Ton plan de révision pour ${examen} : chaque discipline avec ses chapitres, ta préparation en pourcentage et les points à retravailler. Un chapitre est prêt quand tu réussis tout son quiz.`,
    fiche: { titre: "Fiche candidat·e", lignes: [[filiereLabel ? "Option" : "Formation", formation]] },
  }
}
