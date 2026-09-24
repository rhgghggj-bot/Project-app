// Types des lignes des tables Supabase utilisées par l'appli.
// Reconstitués depuis supabase/migrations et l'usage dans le code : les colonnes
// "numeric" arrivent en nombre dans le JSON de PostgREST, les dates en chaîne ISO.
export type { User } from "@supabase/supabase-js"

export type Uuid = string
export type DateISO = string

export type Profil = {
  id: Uuid
  nom: string | null
  avatar_url: string | null
  bio?: string | null
  ville?: string | null
  couleur?: string | null
  devise?: string | null
  email?: string | null
  stripe_account_id?: string | null
  stripe_onboarding_complete?: boolean | null
  created_at?: DateISO
}

export type Groupe = {
  id: Uuid
  nom: string
  description?: string | null
  est_dm: boolean
  annonce_id?: Uuid | null
  code?: string | null
  created_by?: Uuid | null
  created_at: DateISO
}

export type MembreGroupe = {
  id?: Uuid
  groupe_id: Uuid
  user_id: Uuid
  role?: string | null
  created_at?: DateISO
}

export type MessageGroupe = {
  id: Uuid
  groupe_id: Uuid
  user_id: Uuid
  contenu: string
  modifie?: boolean | null
  created_at: DateISO
}

export type Projet = {
  id: Uuid
  user_id: Uuid
  groupe_id: Uuid | null
  titre: string
  description: string | null
  categorie: string | null
  image_url: string | null
  prive: boolean
  created_at: DateISO
  [colonne: string]: unknown
}

export type Depense = {
  id: Uuid
  user_id: Uuid
  titre: string
  montant: number
  categorie: string | null
  date: DateISO
  recurrent?: boolean | null
  jour_du_mois?: number | null
  dernier_rappel_mois?: string | null
}

export type Revenu = {
  id: Uuid
  user_id: Uuid
  titre: string
  montant: number
  categorie: string | null
  date: DateISO
  recurrent?: boolean | null
}

export type EvenementCalendrier = {
  id: Uuid
  user_id: Uuid
  titre: string
  date: DateISO
  heure: string | null
  duree: number | null
  categorie: string | null
  couleur: string | null
  description?: string | null
  lieu?: string | null
  lat?: number | null
  lng?: number | null
  // Événement répété : jours de la semaine (0-6) jusqu'à la date de fin
  recurrence_jours?: number[] | null
  recurrence_fin?: DateISO | null
  activite_groupe_id?: Uuid | null
}

export type Notification = {
  id: Uuid
  user_id: Uuid
  type: string
  titre: string
  contenu: string | null
  lien: string | null
  lu: boolean
  created_at: DateISO
}

export type Annonce = {
  id: Uuid
  user_id: Uuid
  titre: string
  description: string | null
  prix: number
  categorie: string | null
  image_url: string | null
  statut?: string | null
  etat?: string | null
  public?: boolean | null
  acheteur_id?: Uuid | null
  paiement_statut?: string | null
  stripe_payment_intent_id?: string | null
  created_at: DateISO
}

export type Liste = {
  id: Uuid
  groupe_id: Uuid
  titre: string
  categorie_budget?: string | null
  budget?: number | null
  created_at: DateISO
}

export type ArticleListe = {
  id: Uuid
  liste_id: Uuid
  nom: string
  quantite: number | null
  unite: string | null
  prix: number | null
  categorie: string | null
  statut?: string | null
  modifie_par?: Uuid | null
  updated_at?: DateISO
  created_at?: DateISO
}

export type ActiviteGroupe = {
  id: Uuid
  groupe_id: Uuid
  titre: string
  date: DateISO
  heure: string | null
  lieu: string | null
  description: string | null
  couleur: string | null
  duree: number | null
  created_by: Uuid
}

export type DepensePartagee = {
  id: Uuid
  groupe_id: Uuid
  payeur_id: Uuid
  titre: string
  montant_total: number
  categorie: string | null
  date: DateISO
  created_at: DateISO
}

export type PartDepense = {
  id: Uuid
  depense_id: Uuid
  user_id: Uuid
  montant: number
  statut: "du" | "regle"
  stripe_payment_intent_id: string | null
  regle_le: DateISO | null
  created_at: DateISO
}

export type ObjectifGroupe = {
  id: Uuid
  groupe_id: Uuid
  titre: string
  montant_cible: number
  date_limite: DateISO | null
  created_by: Uuid
  created_at: DateISO
}

export type ContributionObjectif = {
  id: Uuid
  objectif_id: Uuid
  user_id: Uuid
  montant: number
  note: string | null
  created_at: DateISO
}

export type ObjectifPersonnel = {
  id: Uuid
  user_id: Uuid
  titre: string
  montant_cible: number
  montant_actuel: number
  date_limite: DateISO | null
  created_at: DateISO
}

export type Sondage = {
  id: Uuid
  groupe_id: Uuid
  question: string
  created_by: Uuid
  created_at: DateISO
}

export type OptionSondage = {
  id: Uuid
  sondage_id: Uuid
  texte: string
  ordre: number
}

export type VoteSondage = {
  id: Uuid
  sondage_id: Uuid
  option_id: Uuid
  user_id: Uuid
  created_at: DateISO
}

export type ChargeColocation = {
  id: Uuid
  groupe_id: Uuid
  titre: string
  payeur_id: Uuid
  jour_du_mois: number
  dernier_mois_genere: string | null
  created_by: Uuid
  created_at: DateISO
}

export type PartChargeColocation = {
  id: Uuid
  charge_id: Uuid
  user_id: Uuid
  montant: number
}

export type Disponibilite = {
  id: Uuid
  groupe_id: Uuid
  user_id: Uuid
  date: DateISO
  creneau: "matin" | "apres-midi" | "soir"
  created_at: DateISO
}

// Message d'erreur lisible depuis une valeur attrapée par catch
export function messageErreur(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export type ArticlePortfolio = {
  id: Uuid
  user_id: Uuid
  nom: string
  prix: number
  quantite: number
  categorie: string | null
  coche_shopping?: boolean | null
}

// Lien simple utilisateur ↔ annonce (favoris, likes)
export type LienAnnonce = {
  id: Uuid
  annonce_id: Uuid
  user_id: Uuid
}

export type CommentaireAnnonce = {
  id: Uuid
  annonce_id: Uuid
  user_id: Uuid
  contenu: string
  created_at: DateISO
}

// Partie d'un jeu de groupe (table jeux_groupe) ; "etat" dépend du jeu
export type PartieJeu<Etat = unknown> = {
  id: Uuid
  groupe_id: Uuid
  type: string
  etat: Etat
  joueur1_id: Uuid
  joueur2_id: Uuid
  tour: Uuid
  gagnant: Uuid | null
  created_at: DateISO
  updated_at?: DateISO
}

export type ProjetLike = {
  id: Uuid
  projet_id: Uuid
  user_id: Uuid
}

export type SuiviVendeur = {
  id: Uuid
  suiveur_id: Uuid
  suivi_id: Uuid
  created_at?: DateISO
}

export type AvisVendeur = {
  id: Uuid
  annonce_id: Uuid
  auteur_id: Uuid
  cible_id: Uuid
  note: number
  commentaire: string | null
  created_at: DateISO
}

export type LienSuivi = {
  id: Uuid
  follower_id: Uuid
  suivi_id: Uuid
  created_at?: DateISO
}

export type CommentaireProjet = {
  id: Uuid
  projet_id: Uuid
  user_id: Uuid
  contenu: string
  created_at: DateISO
}

export type SoutienProjet = {
  id: Uuid
  projet_id: Uuid
  soutien_id: Uuid
  montant: number
  stripe_payment_intent_id: string | null
  created_at: DateISO
}
