import type Stripe from "stripe"
import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Signature invalide : ' + err.message }, { status: 400 })
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    if (account.details_submitted && account.charges_enabled) {
      await getSupabaseAdmin().from('profiles').update({ stripe_onboarding_complete: true }).eq('stripe_account_id', account.id)
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.metadata?.type === 'depense_partagee') {
      const partId = session.metadata.part_id
      await getSupabaseAdmin().from('depenses_partagees_parts').update({
        statut: 'regle',
        stripe_payment_intent_id: session.payment_intent,
        regle_le: new Date().toISOString(),
      }).eq('id', partId)

      const { data: part } = await getSupabaseAdmin()
        .from('depenses_partagees_parts')
        .select('*, depense:depenses_partagees(*)')
        .eq('id', partId)
        .single()
      if (part?.depense) {
        await getSupabaseAdmin().from('messages_groupe').insert({
          groupe_id: part.depense.groupe_id,
          user_id: part.user_id,
          contenu: `💸 Remboursement de ${part.montant} CHF réglé pour "${part.depense.titre}".`,
        })
      }
    } else if (session.metadata?.type === 'soutien_projet') {
      const montant = (session.amount_total || 0) / 100
      await getSupabaseAdmin().from('projets_soutiens').insert({
        projet_id: session.metadata.projet_id,
        soutien_id: session.metadata.soutien_id,
        montant,
        stripe_payment_intent_id: session.payment_intent,
      })
    } else {
      const { annonce_id, acheteur_id, groupe_id } = session.metadata

      await getSupabaseAdmin().from('marketplace_annonces').update({
        statut: 'réservé',
        paiement_statut: 'retenu',
        stripe_payment_intent_id: session.payment_intent,
        acheteur_id: acheteur_id,
      }).eq('id', annonce_id)

      const { data: annonce } = await getSupabaseAdmin().from('marketplace_annonces').select('titre,prix').eq('id', annonce_id).single()

      await getSupabaseAdmin().from('messages_groupe').insert({
        groupe_id,
        user_id: acheteur_id,
        contenu: `💳 Paiement de ${annonce?.prix} CHF effectué pour "${annonce?.titre}". L'argent est retenu en sécurité jusqu'à confirmation de réception.`,
      })
    }
  }

  return NextResponse.json({ received: true })
}
