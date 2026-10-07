import type { Pays } from "./etudes"

// Niveaux d'études, filières et matières proposées selon le pays. Sert à
// pré-remplir les matières (notes, dépôts) et à adapter les explications de
// l'IA au niveau de l'élève. Les noms suivent les grilles officielles
// (Genève pour la Suisse romande, Éducation nationale pour la France) ; une
// matière absente peut toujours être tapée à la main.

export type Filiere = { id: string; label: string; matieres: string[] }
export type Niveau = {
  id: string
  label: string
  detail: string
  matieres: string[]
  filieres?: Filiere[]
  libelleFiliere?: string
  // France, voie générale : spécialités à cocher en plus de la filière
  specialites?: string[]
}

const LANGUES_CH = ["Français", "Allemand", "Anglais"]

export const CURSUS: Record<Pays, Niveau[]> = {
  CH: [
    {
      id: "co", label: "Cycle d'orientation (9e–11e)", detail: "Secondaire I · fin de l'école obligatoire",
      matieres: [...LANGUES_CH, "Mathématiques", "Histoire", "Géographie", "Biologie", "Physique", "Arts visuels", "Musique", "Éducation physique", "Éducation numérique"],
      libelleFiliere: "Section",
      filieres: [
        { id: "ls-latin", label: "LS · latin", matieres: ["Latin"] },
        { id: "ls-langues", label: "LS · langues vivantes", matieres: ["Italien", "Espagnol"] },
        { id: "ls-sciences", label: "LS · sciences", matieres: ["Sciences expérimentales", "Informatique"] },
        { id: "lc", label: "LC · langues vivantes et communication", matieres: ["Communication", "Technologie"] },
        { id: "ct", label: "CT · communication et technologie", matieres: ["Technologie", "Travaux manuels"] },
      ],
    },
    {
      id: "college", label: "Collège / gymnase (maturité gymnasiale)", detail: "4 ans · donne accès à l'université et à l'EPF",
      matieres: [...LANGUES_CH, "Mathématiques", "Biologie", "Chimie", "Physique", "Histoire", "Géographie", "Philosophie", "Informatique", "Économie et droit", "Arts visuels", "Musique", "Éducation physique", "Travail de maturité"],
      libelleFiliere: "Option spécifique (OS)",
      filieres: [
        { id: "os-latin", label: "Latin", matieres: ["Latin"] },
        { id: "os-grec", label: "Grec", matieres: ["Grec"] },
        { id: "os-italien", label: "Italien", matieres: ["Italien"] },
        { id: "os-espagnol", label: "Espagnol", matieres: ["Espagnol"] },
        { id: "os-anglais", label: "Anglais", matieres: ["Anglais avancé"] },
        { id: "os-pam", label: "Physique et applications des maths", matieres: ["Physique avancée", "Applications des mathématiques"] },
        { id: "os-bc", label: "Biologie et chimie", matieres: ["Biologie avancée", "Chimie avancée"] },
        { id: "os-ed", label: "Économie et droit", matieres: ["Économie politique", "Économie d'entreprise", "Droit", "Comptabilité"] },
        { id: "os-av", label: "Arts visuels", matieres: ["Arts visuels (OS)", "Histoire de l'art"] },
        { id: "os-musique", label: "Musique", matieres: ["Musique (OS)", "Solfège"] },
      ],
    },
    {
      id: "ecg", label: "ECG (école de culture générale)", detail: "3 ans · certificat ECG puis maturité spécialisée",
      matieres: [...LANGUES_CH, "Mathématiques", "Histoire", "Géographie", "Biologie", "Chimie", "Physique", "Économie et droit", "Arts", "Éducation physique"],
      libelleFiliere: "Option préprofessionnelle",
      filieres: [
        { id: "ecg-sante", label: "Santé", matieres: ["Biologie humaine", "Psychologie", "Santé publique"] },
        { id: "ecg-social", label: "Travail social", matieres: ["Psychologie", "Sociologie", "Droit social"] },
        { id: "ecg-pedagogie", label: "Pédagogie", matieres: ["Psychologie", "Pédagogie", "Didactique"] },
        { id: "ecg-com", label: "Communication et information", matieres: ["Communication", "Médias", "Information documentaire"] },
        { id: "ecg-arts", label: "Arts et design", matieres: ["Arts visuels", "Design", "Musique", "Théâtre"] },
      ],
    },
    {
      id: "cfc-commerce", label: "CFC employé·e de commerce", detail: "Apprentissage · réforme 2023",
      matieres: [
        "Langue nationale locale (français)", "Langue étrangère (allemand)", "Anglais", "Économie et société",
        "Finances et comptabilité", "Technologies d'application", "Relations clients et fournisseurs",
        "Coordination des processus", "Interaction en réseau", "Structures organisationnelles", "Éducation physique",
      ],
      libelleFiliere: "Variante",
      filieres: [
        { id: "cfc-seul", label: "CFC seul", matieres: [] },
        { id: "cfc-mp1", label: "CFC + maturité pro (MP1, économie et services)", matieres: ["Mathématiques", "Économie et droit", "Histoire et politique", "Technique et environnement", "Travail interdisciplinaire (TIB)"] },
      ],
    },
    {
      id: "cfc-autre", label: "Autre CFC / AFP (apprentissage)", detail: "Culture générale + branches professionnelles",
      matieres: ["Culture générale · langue et communication", "Culture générale · société", "Branches professionnelles", "Mathématiques professionnelles", "Connaissances professionnelles", "Éducation physique"],
    },
    {
      id: "mp2", label: "Maturité professionnelle après CFC (MP2)", detail: "1 an à plein temps ou 2 ans en emploi",
      matieres: ["Français", "Allemand", "Anglais", "Mathématiques", "Histoire et politique"],
      libelleFiliere: "Orientation",
      filieres: [
        { id: "mp-eco", label: "Économie et services", matieres: ["Finances et comptabilité", "Économie et droit", "Technique et environnement"] },
        { id: "mp-tech", label: "Technique, architecture, sciences de la vie", matieres: ["Physique", "Chimie", "Mathématiques avancées"] },
        { id: "mp-sante", label: "Santé et social", matieres: ["Biologie", "Chimie", "Sciences sociales"] },
        { id: "mp-arts", label: "Arts visuels et arts appliqués", matieres: ["Création et culture", "Arts visuels"] },
        { id: "mp-nature", label: "Nature, paysage et alimentation", matieres: ["Biologie", "Chimie", "Physique"] },
      ],
    },
    {
      id: "hes", label: "Haute école spécialisée (HES)", detail: "Bachelor HES, ex. HEG, HEPIA, HEdS",
      matieres: ["Anglais", "Communication"],
      libelleFiliere: "Filière",
      filieres: [
        { id: "heg-ee", label: "HEG · Économie d'entreprise", matieres: ["Comptabilité financière", "Économie et société (micro)", "Économie et société (globalisations)", "Droit", "Marketing", "Management intégré", "Bases du management", "Mathématiques", "Statistique descriptive", "Communication en anglais", "Informatique de gestion"] },
        { id: "heg-ig", label: "HEG · Informatique de gestion", matieres: ["Programmation", "Bases de données", "Réseaux", "Mathématiques", "Comptabilité", "Gestion de projet"] },
        { id: "heg-id", label: "HEG · Information documentaire", matieres: ["Gestion de l'information", "Archivistique", "Bibliothéconomie", "Informatique documentaire"] },
        { id: "heg-ihm", label: "HEG · International Business Management", matieres: ["International Business", "Accounting", "Economics", "Marketing", "Business Law"] },
        { id: "hepia", label: "Ingénierie et architecture", matieres: ["Mathématiques", "Physique", "Informatique", "Projet"] },
        { id: "heds", label: "Santé (soins, physio, nutrition…)", matieres: ["Anatomie", "Physiologie", "Soins", "Recherche en santé"] },
        { id: "hets", label: "Travail social", matieres: ["Sociologie", "Psychologie", "Droit social", "Méthodologie"] },
      ],
    },
    {
      id: "uni", label: "Université / EPF", detail: "Bachelor ou master",
      matieres: ["Méthodologie", "Statistique", "Anglais"],
      libelleFiliere: "Faculté",
      filieres: [
        { id: "u-gsem", label: "Économie et management", matieres: ["Microéconomie", "Macroéconomie", "Comptabilité", "Finance", "Mathématiques", "Statistique"] },
        { id: "u-droit", label: "Droit", matieres: ["Droit civil", "Droit constitutionnel", "Droit des obligations", "Droit pénal", "Introduction au droit"] },
        { id: "u-sciences", label: "Sciences", matieres: ["Analyse", "Algèbre linéaire", "Physique", "Chimie", "Biologie", "Informatique"] },
        { id: "u-medecine", label: "Médecine", matieres: ["Anatomie", "Biochimie", "Physiologie", "Histologie"] },
        { id: "u-lettres", label: "Lettres", matieres: ["Littérature", "Linguistique", "Histoire", "Philosophie"] },
        { id: "u-sss", label: "Sciences de la société", matieres: ["Sociologie", "Science politique", "Géographie", "Histoire économique"] },
        { id: "u-psy", label: "Psychologie et éducation", matieres: ["Psychologie", "Sciences de l'éducation", "Statistique"] },
      ],
    },
  ],
  FR: [
    {
      id: "college-fr", label: "Collège (6e–3e)", detail: "Diplôme national du brevet en 3e",
      matieres: ["Français", "Mathématiques", "Histoire-géographie", "EMC", "Anglais (LV1)", "LV2", "SVT", "Physique-chimie", "Technologie", "Arts plastiques", "Éducation musicale", "EPS"],
      libelleFiliere: "Option",
      filieres: [
        { id: "college-latin", label: "Latin", matieres: ["Latin"] },
        { id: "college-grec", label: "Grec", matieres: ["Grec"] },
        { id: "college-sans", label: "Aucune option", matieres: [] },
      ],
    },
    {
      id: "seconde", label: "Seconde générale et technologique", detail: "Tronc commun avant le choix de voie",
      matieres: ["Français", "Mathématiques", "Histoire-géographie", "EMC", "LVA", "LVB", "SES", "Physique-chimie", "SVT", "SNT", "EPS"],
    },
    {
      id: "lycee-general", label: "Lycée · voie générale (1re–Tle)", detail: "3 spécialités en 1re, 2 en terminale",
      matieres: ["Français (1re)", "Philosophie (Tle)", "Histoire-géographie", "EMC", "LVA", "LVB", "Enseignement scientifique", "Mathématiques (tronc commun)", "EPS", "Grand oral"],
      specialites: [
        "Mathématiques", "Physique-chimie", "SVT", "SES", "HGGSP", "HLP", "LLCER (langues, littératures et cultures étrangères)",
        "LLCA (latin ou grec)", "NSI (numérique et sciences informatiques)", "Sciences de l'ingénieur", "Biologie-écologie",
        "Arts", "EPPCS (éducation physique, pratiques et culture sportives)",
      ],
    },
    {
      id: "lycee-techno", label: "Lycée · voie technologique (1re–Tle)", detail: "Bac technologique",
      matieres: ["Français (1re)", "Philosophie (Tle)", "Histoire-géographie", "EMC", "LVA", "LVB", "Mathématiques", "EPS", "Grand oral"],
      libelleFiliere: "Série",
      filieres: [
        { id: "stmg", label: "STMG (management et gestion)", matieres: ["Management, sciences de gestion et numérique", "Droit et économie", "Gestion et finance / Mercatique / RH / SIG"] },
        { id: "sti2d", label: "STI2D (industrie et développement durable)", matieres: ["Physique-chimie et mathématiques", "Ingénierie, innovation et développement durable"] },
        { id: "stl", label: "STL (laboratoire)", matieres: ["Physique-chimie et mathématiques", "Biochimie-biologie-biotechnologies", "Sciences physiques et chimiques en laboratoire"] },
        { id: "st2s", label: "ST2S (santé et social)", matieres: ["Chimie, biologie et physiopathologie humaines", "Sciences et techniques sanitaires et sociales"] },
        { id: "std2a", label: "STD2A (design et arts appliqués)", matieres: ["Analyse et méthodes en design", "Conception et création en design et métiers d'art"] },
        { id: "sthr", label: "STHR (hôtellerie et restauration)", matieres: ["Économie-gestion hôtelière", "Sciences et technologies culinaires et des services"] },
        { id: "s2tmd", label: "S2TMD (théâtre, musique, danse)", matieres: ["Culture et sciences artistiques", "Pratique artistique"] },
        { id: "stav", label: "STAV (agronomie et vivant)", matieres: ["Gestion des ressources et de l'alimentation", "Territoires et technologie"] },
      ],
    },
    {
      id: "lycee-pro", label: "Lycée professionnel (CAP, bac pro)", detail: "Enseignement général + professionnel",
      matieres: ["Français", "Histoire-géographie", "EMC", "Mathématiques", "Anglais", "Prévention santé environnement", "Économie-gestion / Économie-droit", "Arts appliqués", "EPS", "Enseignement professionnel", "Chef-d'œuvre"],
      libelleFiliere: "Famille de métiers",
      filieres: [
        { id: "pro-relation-client", label: "Métiers de la relation client", matieres: ["Commerce", "Vente", "Accueil"] },
        { id: "pro-gatl", label: "Gestion administrative, transport, logistique", matieres: ["Gestion administrative", "Logistique"] },
        { id: "pro-hotellerie", label: "Hôtellerie-restauration", matieres: ["Cuisine", "Service"] },
        { id: "pro-industrie", label: "Industrie, électricité, numérique", matieres: ["Électrotechnique", "Systèmes numériques"] },
        { id: "pro-btp", label: "Construction et bâtiment", matieres: ["Technologie du bâtiment"] },
        { id: "pro-sante", label: "Soins, services aux personnes", matieres: ["Biologie et microbiologie", "Sciences médico-sociales"] },
        { id: "pro-autre", label: "Autre", matieres: [] },
      ],
    },
    {
      id: "sup-fr", label: "Études supérieures", detail: "BTS, BUT, licence, prépa, école",
      matieres: ["Anglais", "Culture générale et expression"],
      libelleFiliere: "Formation",
      filieres: [
        { id: "bts", label: "BTS (ex. MCO, NDRC, CG, GPME)", matieres: ["Culture économique, juridique et managériale", "Gestion", "Management commercial", "Comptabilité"] },
        { id: "but", label: "BUT (ex. GEA, TC, informatique)", matieres: ["Comptabilité", "Marketing", "Droit", "Économie", "Statistiques", "Programmation"] },
        { id: "licence-eco", label: "Licence économie-gestion / AES", matieres: ["Microéconomie", "Macroéconomie", "Comptabilité", "Mathématiques", "Statistiques", "Droit"] },
        { id: "licence-droit", label: "Licence de droit", matieres: ["Droit civil", "Droit constitutionnel", "Droit administratif", "Histoire du droit"] },
        { id: "licence-sciences", label: "Licence de sciences", matieres: ["Analyse", "Algèbre", "Physique", "Chimie", "Biologie", "Informatique"] },
        { id: "pass-las", label: "Santé (PASS / L.AS)", matieres: ["Biochimie", "Anatomie", "Physiologie", "Biologie cellulaire"] },
        { id: "cpge", label: "Classe prépa (CPGE)", matieres: ["Mathématiques", "Physique", "Économie", "Histoire", "Lettres", "Philosophie"] },
        { id: "ecole", label: "École de commerce / d'ingénieurs", matieres: ["Finance", "Marketing", "Management", "Mathématiques"] },
      ],
    },
  ],
}

export function trouverNiveau(pays: Pays, id: string | null | undefined): Niveau | null {
  return CURSUS[pays].find(n => n.id === id) ?? null
}

// Matières proposées : celles du niveau, de la filière et des spécialités, sans doublon.
export function matieresProposees(pays: Pays, niveauId: string | null | undefined, filiereId: string | null | undefined, specialites: string[] = []): string[] {
  const niveau = trouverNiveau(pays, niveauId)
  if (!niveau) return []
  const filiere = niveau.filieres?.find(f => f.id === filiereId)
  return [...new Set([...(filiere?.matieres ?? []), ...specialites, ...niveau.matieres])]
}

// Description courte transmise à l'IA pour adapter le niveau des explications.
export function descriptionNiveau(pays: Pays, niveauId: string | null | undefined, filiereId: string | null | undefined, specialites: string[] = []): string {
  const niveau = trouverNiveau(pays, niveauId)
  if (!niveau) return ""
  const filiere = niveau.filieres?.find(f => f.id === filiereId)
  return [niveau.label, filiere?.label, specialites.length ? `spécialités : ${specialites.join(", ")}` : ""].filter(Boolean).join(" · ")
}
