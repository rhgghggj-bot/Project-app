import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getAuthUser } from '@/lib/apiAuth'

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { annonceId } = await request.json()
  const acheteurId = authUser.id
  if (!annonceId) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

  const { data: annonce } = await getSupabaseAdmin().from('marketplace_annonces').select('*').eq('id', annonceId).single()
  if (!annonce) return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
  if (annonce.acheteur_id !== acheteurId) return NextResponse.json({ error: "Seul l'acheteur peut confirmer la réception" }, { status: 403 })
  if (annonce.paiement_statut !== 'retenu') return NextResponse.json({ error: 'Aucun paiement en attente pour cette annonce' }, { status: 400 })

  const { data: vendeur } = await getSupabaseAdmin().from('profiles').select('stripe_account_id').eq('id', annonce.user_id).single()
  if (!vendeur?.stripe_account_id) return NextResponse.json({ error: 'Compte vendeur introuvable' }, { status: 400 })

  const paymentIntent: any = await getStripe().paymentIntents.retrieve(annonce.stripe_payment_intent_id)
  const montantRecu = paymentIntent.amount_received

  const transfer = await getStripe().transfers.create({
    amount: montantRecu,
    currency: 'chf',
    destination: vendeur.stripe_account_id,
    transfer_group: 'annonce_' + annonceId,
    source_transaction: paymentIntent.latest_charge,
  })

  await getSupabaseAdmin().from('marketplace_annonces').update({
    statut: 'vendu',
    paiement_statut: 'libere',
  }).eq('id', annonceId)

  await getSupabaseAdmin().from('revenus').insert({
    user_id: annonce.user_id, titre: 'Vente : ' + annonce.titre, montant: parseFloat(annonce.prix),
    categorie: 'Autre', date: new Date().toISOString().slice(0, 10), recurrent: false,
  })
  await getSupabaseAdmin().from('depenses').insert({
    user_id: acheteurId, titre: 'Achat : ' + annonce.titre, montant: parseFloat(annonce.prix),
    categorie: 'Autre', date: new Date().toISOString().slice(0, 10), recurrent: false,
  })

  return NextResponse.json({ success: true, transferId: transfer.id })
}
