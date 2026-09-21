import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getAuthUser } from '@/lib/apiAuth'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const limite = rateLimit(`stripe-soutenir-projet:${authUser.id}`, 10, 5 * 60 * 1000)
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Trop de tentatives, réessaie dans un instant' }, { status: 429, headers: { 'Retry-After': String(limite.retryAfterSec) } })
  }

  const { projetId, montant, retourUrl } = await request.json()
  const montantNum = parseFloat(montant)
  if (!projetId || !montantNum || montantNum <= 0 || !retourUrl) {
    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  }

  const { data: projet } = await getSupabaseAdmin().from('projets').select('id,titre,user_id').eq('id', projetId).single()
  if (!projet) return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
  if (projet.user_id === authUser.id) return NextResponse.json({ error: 'Tu ne peux pas soutenir ton propre projet' }, { status: 400 })

  const { data: createur } = await getSupabaseAdmin().from('profiles').select('stripe_account_id,stripe_onboarding_complete').eq('id', projet.user_id).single()
  if (!createur?.stripe_account_id || !createur.stripe_onboarding_complete) {
    return NextResponse.json({ error: "Le créateur n'a pas encore activé la réception de paiements" }, { status: 400 })
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'chf',
        product_data: { name: `Soutien : ${projet.titre}` },
        unit_amount: Math.round(montantNum * 100),
      },
      quantity: 1,
    }],
    payment_intent_data: {
      transfer_data: { destination: createur.stripe_account_id },
    },
    metadata: {
      type: 'soutien_projet',
      projet_id: projetId,
      soutien_id: authUser.id,
    },
    success_url: retourUrl + '?soutien=succes',
    cancel_url: retourUrl + '?soutien=annule',
  })

  return NextResponse.json({ url: session.url })
}
