import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: 'Signature invalide : ' + err.message }, { status: 400 })
  }

  if (event.type === 'account.updated') {
    const account: any = event.data.object
    if (account.details_submitted && account.charges_enabled) {
      await getSupabaseAdmin().from('profiles').update({ stripe_onboarding_complete: true }).eq('stripe_account_id', account.id)
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session: any = event.data.object
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

  return NextResponse.json({ received: true })
}
