import { AccessToken } from 'livekit-server-sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/apiAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit } from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const limite = rateLimit(`livekit:${authUser.id}`, 20, 5 * 60 * 1000)
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Trop de tentatives, réessaie dans un instant' }, { status: 429, headers: { 'Retry-After': String(limite.retryAfterSec) } })
  }

  const { searchParams } = new URL(request.url)
  const room = searchParams.get('room')
  const username = searchParams.get('username')

  if (!room) {
    return NextResponse.json({ error: 'room requis' }, { status: 400 })
  }

  // Un salon d'appel de groupe s'appelle "groupe-<id>" : on vérifie que
  // l'utilisateur authentifié fait bien partie de ce groupe avant de lui
  // donner un token d'accès (sinon n'importe qui pouvait rejoindre n'importe
  // quel appel en devinant le nom du salon).
  const groupeId = room.startsWith('groupe-') ? room.slice('groupe-'.length) : null
  if (groupeId) {
    const { data: membre } = await getSupabaseAdmin()
      .from('membres_groupe')
      .select('user_id')
      .eq('groupe_id', groupeId)
      .eq('user_id', authUser.id)
      .maybeSingle()
    if (!membre) return NextResponse.json({ error: "Tu n'es pas membre de ce groupe" }, { status: 403 })
  }

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: authUser.id, name: username || authUser.email || undefined }
  )

  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true })

  return NextResponse.json({ token: await at.toJwt() })
}
