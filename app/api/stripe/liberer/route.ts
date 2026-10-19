import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { libererAnnonce } from '@/lib/liberer'
import { getAuthUser } from '@/lib/apiAuth'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request)
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const limite = rateLimit(`stripe-liberer:${authUser.id}`, 5, 5 * 60 * 1000)
  if (!limite.allowed) {
    return NextResponse.json({ error: 'Trop de tentatives, réessaie dans un instant' }, { status: 429, headers: { 'Retry-After': String(limite.retryAfterSec) } })
  }

  const { annonceId } = await request.json()
  const acheteurId = authUser.id
  if (!annonceId) return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })

  const { data: annonce } = await getSupabaseAdmin().from('marketplace_annonces').select('*').eq('id', annonceId).single()
  if (!annonce) return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
  if (annonce.acheteur_id !== acheteurId) return NextResponse.json({ error: "Seul l'acheteur peut confirmer la réception" }, { status: 403 })
  if (annonce.paiement_statut !== 'retenu') return NextResponse.json({ error: 'Aucun paiement en attente pour cette annonce' }, { status: 400 })

  const r = await libererAnnonce(annonce)
  if (r.ok === false) return NextResponse.json({ error: r.erreur }, { status: 400 })
  return NextResponse.json({ success: true, transferId: r.transferId })
}
