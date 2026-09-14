import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const { annonceId, acheteurId, groupeId, retourUrl } = await request.json()
  if (!annonceId || !acheteurId || !groupeId) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const { data: annonce } = await supabaseAdmin.from('marketplace_annonces').select('*').eq('id', annonceId).single()
  if (!annonce) return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
  if (annonce.user_id === acheteurId) return NextResponse.json({ error: "Tu ne peux pas acheter ta propre annonce" }, { status: 400 })
  if (annonce.statut !== 'disponible') return NextResponse.json({ error: 'Cette annonce n\'est plus disponible' }, { status: 400 })

  const { data: vendeur } = await supabaseAdmin.from('profiles').select('stripe_account_id, stripe_onboarding_complete').eq('id', annonce.user_id).single()
  if (!vendeur?.stripe_account_id || !vendeur.stripe_onboarding_complete) {
    return NextResponse.json({ error: "Le vendeur n'a pas encore activé la réception de paiements" }, { status: 400 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'chf',
        product_data: { name: annonce.titre },
        unit_amount: Math.round(parseFloat(annonce.prix) * 100),
      },
      quantity: 1,
    }],
    payment_intent_data: {
      transfer_group: 'annonce_' + annonceId,
    },
    metadata: {
      annonce_id: annonceId,
      acheteur_id: acheteurId,
      vendeur_id: annonce.user_id,
      groupe_id: groupeId,
    },
    success_url: retourUrl + '?paiement=succes',
    cancel_url: retourUrl + '?paiement=annule',
  })

  return NextResponse.json({ url: session.url })
}
