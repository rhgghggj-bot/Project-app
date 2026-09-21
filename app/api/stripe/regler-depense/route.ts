import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getAuthUser } from '@/lib/apiAuth'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const limite = rateLimit(`stripe-regler-depense:${authUser.id}`, 10, 5 * 60 * 1000)
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Trop de tentatives, réessaie dans un instant' }, { status: 429, headers: { 'Retry-After': String(limite.retryAfterSec) } })
  }

  const { partId, retourUrl } = await request.json()
  if (!partId || !retourUrl) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

  const { data: part } = await getSupabaseAdmin()
    .from('depenses_partagees_parts')
    .select('*, depense:depenses_partagees(*)')
    .eq('id', partId)
    .single()
  if (!part) return NextResponse.json({ error: 'Part introuvable' }, { status: 404 })
  if (part.user_id !== authUser.id) return NextResponse.json({ error: 'Cette dépense ne te concerne pas' }, { status: 403 })
  if (part.statut === 'regle') return NextResponse.json({ error: 'Déjà réglé' }, { status: 400 })

  const depense = part.depense
  const { data: payeur } = await getSupabaseAdmin()
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete, nom')
    .eq('id', depense.payeur_id)
    .single()
  if (!payeur?.stripe_account_id || !payeur.stripe_onboarding_complete) {
    return NextResponse.json({ error: "La personne à rembourser n'a pas encore activé la réception de paiements" }, { status: 400 })
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'chf',
        product_data: { name: `Remboursement : ${depense.titre}` },
        unit_amount: Math.round(parseFloat(part.montant) * 100),
      },
      quantity: 1,
    }],
    payment_intent_data: {
      transfer_data: { destination: payeur.stripe_account_id },
    },
    metadata: {
      type: 'depense_partagee',
      part_id: partId,
    },
    success_url: retourUrl + '?reglement=succes',
    cancel_url: retourUrl + '?reglement=annule',
  })

  return NextResponse.json({ url: session.url })
}
