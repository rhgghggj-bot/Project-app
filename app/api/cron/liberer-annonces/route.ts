import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { libererAnnonce } from '@/lib/liberer'

// Job planifié quotidien (voir vercel.json) : si l'acheteur n'a pas confirmé la
// réception 14 jours après le paiement, l'argent est versé au vendeur (comme
// sur Vinted), pour qu'il ne reste jamais bloqué. La date du paiement vient de
// Stripe. Protégé par CRON_SECRET, comme les autres jobs.
const DELAI_JOURS = 14

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const db = getSupabaseAdmin()
  const { data: annonces } = await db.from('marketplace_annonces')
    .select('id,user_id,acheteur_id,titre,prix,stripe_payment_intent_id')
    .eq('paiement_statut', 'retenu').not('stripe_payment_intent_id', 'is', null).limit(50)

  const limite = Date.now() / 1000 - DELAI_JOURS * 86400
  let liberees = 0
  for (const a of annonces || []) {
    try {
      const pi = await getStripe().paymentIntents.retrieve(a.stripe_payment_intent_id)
      if (pi.created > limite) continue
      const r = await libererAnnonce(a)
      if (r.ok) {
        liberees++
        await db.from('notifications').insert({ user_id: a.acheteur_id, type: 'marketplace', titre: 'Marketplace', lien: '/marketplace', contenu: `Paiement de « ${a.titre} » versé au vendeur après ${DELAI_JOURS} jours sans confirmation.` })
      }
    } catch (e) { console.error('liberer-annonces', a.id, e) }
  }
  return NextResponse.json({ ok: true, liberees })
}
