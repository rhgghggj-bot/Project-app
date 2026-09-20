import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { getAuthUser } from '@/lib/apiAuth'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

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
      refresh_url: retourUrl,
      return_url: retourUrl,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: lien.url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur serveur inconnue' }, { status: 500 })
  }
}
