import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const { userId, email, retourUrl } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })

  const { data: profil } = await supabaseAdmin.from('profiles').select('stripe_account_id').eq('id', userId).single()

  let accountId = profil?.stripe_account_id

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })
    accountId = account.id
    await supabaseAdmin.from('profiles').update({ stripe_account_id: accountId }).eq('id', userId)
  }

  const lien = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: retourUrl,
    return_url: retourUrl,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: lien.url })
}
