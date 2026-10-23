import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getAuthUser } from '@/lib/apiAuth'
import { rateLimit } from '@/lib/rateLimit'

// Suppression du compte (droit à l'effacement, nLPD / RGPD).
// - Les données personnelles sont effacées : études, finances, calendrier,
//   fichiers, annonces, favoris…
// - Ce qui est partagé avec d'autres (messages et dépenses d'un groupe, avis)
//   reste pour eux, mais n'est plus relié à une personne : le profil devient
//   « Compte supprimé ».
// - Le compte de connexion est supprimé de façon définitive (suppression
//   « douce » de Supabase : l'e-mail est effacé, les liens des données
//   partagées restent valides).

// Tables dont les lignes appartiennent à l'utilisateur seul (colonne user_id).
// Une table absente ou sans cette colonne est simplement ignorée.
const TABLES_PERSONNELLES = [
  'resultats_quiz_etudiant', 'evaluations_corrigees', 'notes_etudiant', 'cours_etudiant', 'profils_etudiant',
  'carnet_notes', 'carnet_dossiers', 'etudes_documents',
  'revenus', 'depenses', 'objectifs_personnels', 'evenements_calendrier', 'domaines_couleur',
  'notifications', 'trajets_historique', 'scanner_corrections',
  'marketplace_favoris', 'marketplace_likes', 'marketplace_followers', 'app_followers', 'projets_likes',
  'portfolio_articles',
]
const DOSSIERS = ['etudes', 'marketplace', 'Avatar']

// Tous les fichiers sous <uid>/ dans un espace de stockage
async function listerFichiers(admin: SupabaseClient, bucket: string, dossier: string): Promise<string[]> {
  const chemins: string[] = []
  for (let page = 0; page < 50; page++) {
    const { data, error } = await admin.storage.from(bucket).list(dossier, { limit: 1000, offset: page * 1000 })
    if (error || !data?.length) break
    for (const f of data) {
      const chemin = `${dossier}/${f.name}`
      if (f.id) chemins.push(chemin)
      else chemins.push(...await listerFichiers(admin, bucket, chemin))   // sous-dossier
    }
    if (data.length < 1000) break
  }
  return chemins
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const limite = rateLimit(`compte-supprimer:${authUser.id}`, 3, 10 * 60 * 1000)
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Trop de tentatives, réessaie dans un instant' }, { status: 429, headers: { 'Retry-After': String(limite.retryAfterSec) } })
  }

  const { confirmation } = await request.json().catch(() => ({}))
  if (confirmation !== 'SUPPRIMER') return NextResponse.json({ error: 'Confirmation manquante' }, { status: 400 })

  const admin = getSupabaseAdmin()
  const uid = authUser.id

  // Un paiement en cours (achat ou vente pas encore confirmé) doit d'abord être terminé
  const { data: enCours } = await admin.from('marketplace_annonces').select('id')
    .eq('paiement_statut', 'retenu').or(`user_id.eq.${uid},acheteur_id.eq.${uid}`).limit(1)
  if (enCours?.length) {
    return NextResponse.json({ error: "Tu as un achat ou une vente avec un paiement en cours sur la marketplace. Termine-le (réception confirmée ou remboursement) avant de supprimer ton compte." }, { status: 409 })
  }

  // 1. Fichiers
  for (const bucket of DOSSIERS) {
    const chemins = await listerFichiers(admin, bucket, uid)
    for (let i = 0; i < chemins.length; i += 100) await admin.storage.from(bucket).remove(chemins.slice(i, i + 100))
  }

  // 2. Données personnelles, et annonces encore en vente
  for (const table of TABLES_PERSONNELLES) await admin.from(table).delete().eq('user_id', uid)
  await admin.from('marketplace_annonces').delete().eq('user_id', uid).neq('statut', 'vendu')

  // 3. Profil rendu anonyme (il reste lié aux messages et dépenses partagés)
  const { error: errProfil } = await admin.from('profiles')
    .update({ nom: 'Compte supprimé', prenom: null, bio: null, ville: null, avatar_url: null }).eq('id', uid)
  if (errProfil) await admin.from('profiles').update({ nom: 'Compte supprimé', avatar_url: null }).eq('id', uid)

  // 4. Compte de connexion
  const { error } = await admin.auth.admin.deleteUser(uid, true)
  if (error) return NextResponse.json({ error: "Tes données ont été effacées, mais le compte n'a pas pu être fermé. Réessaie ou écris-nous." }, { status: 500 })

  return NextResponse.json({ success: true })
}
