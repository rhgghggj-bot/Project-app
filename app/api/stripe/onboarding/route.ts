import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  const { userId, email, retourUrl } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })

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
}
