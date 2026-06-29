import { AccessToken } from 'livekit-server-sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const room = searchParams.get('room')
  const username = searchParams.get('username')

  if (!room || !username) {
    return NextResponse.json({ error: 'room et username requis' }, { status: 400 })
  }

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: username }
  )

  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true })

  return NextResponse.json({ token: await at.toJwt() })
}
