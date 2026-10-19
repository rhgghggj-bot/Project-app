import type Stripe from "stripe"
import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !secret) return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })

  let event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret)
  } catch {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    if (account.details_submitted && account.charges_enabled) {
      await getSupabaseAdmin().from('profiles').update({ stripe_onboarding_complete: true }).eq('stripe_account_id', account.id)
    }
  }

  // Stripe peut envoyer deux fois le même événement : chaque branche vérifie
  // d'abord qu'il n'a pas déjà été traité.
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata ?? {}
    const intent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null
    if (session.payment_status !== 'paid' || !intent) return NextResponse.json({ received: true })
    const db = getSupabaseAdmin()

    if (meta.type === 'depense_partagee' && meta.part_id) {
      const { data: reglees } = await db.from('depenses_partagees_parts').update({
        statut: 'regle',
        stripe_payment_intent_id: intent,
        regle_le: new Date().toISOString(),
      }).eq('id', meta.part_id).neq('statut', 'regle').select('id')

      if (reglees?.length) {
        const { data: part } = await db
          .from('depenses_partagees_parts')
          .select('*, depense:depenses_partagees(*)')
          .eq('id', meta.part_id)
          .single()
        if (part?.depense) {
          await db.from('messages_groupe').insert({
            groupe_id: part.depense.groupe_id,
            user_id: part.user_id,
            contenu: `💸 Remboursement de ${part.montant} CHF réglé pour "${part.depense.titre}".`,
          })
        }
      }
    } else if (meta.type === 'soutien_projet' && meta.projet_id) {
      const { data: deja } = await db.from('projets_soutiens').select('id').eq('stripe_payment_intent_id', intent).maybeSingle()
      if (!deja) {
        await db.from('projets_soutiens').insert({
          projet_id: meta.projet_id,
          soutien_id: meta.soutien_id,
          montant: (session.amount_total || 0) / 100,
          stripe_payment_intent_id: intent,
        })
      }
    } else if (meta.annonce_id && meta.acheteur_id) {
      const { annonce_id, acheteur_id, groupe_id } = meta
      const { data: annonce } = await db.from('marketplace_annonces').select('titre,prix,stripe_payment_intent_id').eq('id', annonce_id).single()
      if (annonce && annonce.stripe_payment_intent_id !== intent) {
        await db.from('marketplace_annonces').update({
          statut: 'réservé',
          paiement_statut: 'retenu',
          stripe_payment_intent_id: intent,
          acheteur_id,
        }).eq('id', annonce_id)

        if (groupe_id) {
          await db.from('messages_groupe').insert({
            groupe_id,
            user_id: acheteur_id,
            contenu: `💳 Paiement de ${annonce.prix} CHF effectué pour "${annonce.titre}". L'argent est retenu en sécurité jusqu'à confirmation de réception.`,
          })
        }
      }
    }
  }

  return NextResponse.json({ received: true })
}
