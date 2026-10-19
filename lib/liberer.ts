import { getStripe } from './stripe'
import { getSupabaseAdmin } from './supabaseAdmin'

type Annonce = { id: string; user_id: string; acheteur_id: string; titre: string; prix: string | number; stripe_payment_intent_id: string }

// Verse l'argent retenu au vendeur et note la vente dans les finances des deux.
// Utilisé quand l'acheteur confirme la réception, et par le job automatique
// après 14 jours sans confirmation.
export async function libererAnnonce(annonce: Annonce): Promise<{ ok: true; transferId: string } | { ok: false; erreur: string }> {
  const db = getSupabaseAdmin()
  const { data: vendeur } = await db.from('profiles').select('stripe_account_id').eq('id', annonce.user_id).single()
  if (!vendeur?.stripe_account_id) return { ok: false, erreur: 'Compte vendeur introuvable' }

  const paymentIntent = await getStripe().paymentIntents.retrieve(annonce.stripe_payment_intent_id)
  const latestCharge = typeof paymentIntent.latest_charge === 'string' ? paymentIntent.latest_charge : paymentIntent.latest_charge?.id

  // Clé d'idempotence : un double clic ou un nouvel essai ne paie pas deux fois le vendeur
  const transfer = await getStripe().transfers.create({
    amount: paymentIntent.amount_received,
    currency: 'chf',
    destination: vendeur.stripe_account_id,
    transfer_group: 'annonce_' + annonce.id,
    source_transaction: latestCharge,
  }, { idempotencyKey: 'liberer_' + annonce.id })

  // Seule la première libération passe l'annonce à « vendu » et note la vente
  const { data: liberee } = await db.from('marketplace_annonces').update({ statut: 'vendu', paiement_statut: 'libere' })
    .eq('id', annonce.id).eq('paiement_statut', 'retenu').select('id')
  if (liberee?.length) {
    const jour = new Date().toISOString().slice(0, 10)
    const montant = parseFloat(String(annonce.prix))
    await db.from('revenus').insert({ user_id: annonce.user_id, titre: 'Vente : ' + annonce.titre, montant, categorie: 'Autre revenu', date: jour, recurrent: false })
    await db.from('depenses').insert({ user_id: annonce.acheteur_id, titre: 'Achat : ' + annonce.titre, montant, categorie: 'Autres', date: jour, recurrent: false })
  }
  return { ok: true, transferId: transfer.id }
}
