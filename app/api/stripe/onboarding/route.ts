import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getAuthUser } from '@/lib/apiAuth'
import { rateLimit } from '@/lib/rateLimit'
import { urlDeRetour } from '@/lib/retourUrl'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const limite = rateLimit(`stripe-onboarding:${authUser.id}`, 5, 10 * 60 * 1000)
    if (!limite.allowed) {
      return NextResponse.json({ error: 'Trop de tentatives, réessaie dans un instant' }, { status: 429, headers: { 'Retry-After': String(limite.retryAfterSec) } })
    }

    const { retourUrl } = await request.json()
    const userId = authUser.id
    const email = authUser.email

    const { data: profil } = await getSupabaseAdmin().from('profiles').select('stripe_account_id').eq('id', userId).single()

    let accountId = profil?.stripe_account_id

    if (!accountId) {
      const account = await getStripe().accounts.create({
        type: 'express',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
      accountId = account.id
      await getSupabaseAdmin().from('profiles').update({ stripe_account_id: accountId }).eq('id', userId)
    }

    const lien = await getStripe().accountLinks.create({
      account: accountId,
      refresh_url: urlDeRetour(request, retourUrl, '/profile'),
      return_url: urlDeRetour(request, retourUrl, '/profile'),
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: lien.url })
  } catch (e) {
    // Le détail de l'erreur Stripe reste dans les journaux du serveur
    console.error('stripe onboarding', e)
    return NextResponse.json({ error: "Impossible d'ouvrir l'inscription aux paiements. Réessaie plus tard." }, { status: 500 })
  }
}
