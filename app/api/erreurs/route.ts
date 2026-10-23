import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'

// Rapports d'erreurs envoyés par le navigateur : écrits dans les journaux du
// serveur (Vercel → Logs, rechercher « [erreur-client] »). Rien n'est stocké
// ailleurs.
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'inconnu'
  if (!rateLimit(`erreurs:${ip}`, 30, 10 * 60 * 1000).allowed) return new NextResponse(null, { status: 429 })
  const texte = (await request.text().catch(() => '')).slice(0, 8000)
  let r: Record<string, unknown>
  try { r = JSON.parse(texte) } catch { return new NextResponse(null, { status: 400 }) }
  const champ = (k: string, max: number) => (typeof r[k] === 'string' ? (r[k] as string).slice(0, max) : undefined)
  console.error('[erreur-client]', JSON.stringify({
    origine: champ('origine', 40), message: champ('message', 500), page: champ('page', 200), digest: champ('digest', 100),
    navigateur: champ('navigateur', 200), enLigne: r.enLigne === true, pile: champ('pile', 3000),
  }))
  return new NextResponse(null, { status: 204 })
}
