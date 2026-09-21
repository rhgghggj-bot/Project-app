import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

// Job planifié quotidien (voir vercel.json) : le jour configuré pour une
// charge de colocation, génère automatiquement la dépense partagée du mois
// (une fois par mois, grâce à dernier_mois_genere) et notifie le groupe.
// Protégé par CRON_SECRET, comme rappels-charges.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const aujourdhui = new Date()
  const jourActuel = aujourdhui.getDate()
  const moisActuel = `${aujourdhui.getFullYear()}-${String(aujourdhui.getMonth() + 1).padStart(2, "0")}`

  const { data: charges } = await admin
    .from("colocation_charges")
    .select("*")
    .eq("jour_du_mois", jourActuel)
    .or(`dernier_mois_genere.is.null,dernier_mois_genere.neq.${moisActuel}`)

  let generees = 0

  for (const charge of charges || []) {
    const { data: parts } = await admin.from("colocation_charges_parts").select("user_id,montant").eq("charge_id", charge.id)
    if (!parts || parts.length === 0) continue

    const montantTotal = parts.reduce((s, p) => s + parseFloat(p.montant), 0)

    const { data: depense, error } = await admin.from("depenses_partagees").insert({
      groupe_id: charge.groupe_id, payeur_id: charge.payeur_id, titre: charge.titre, montant_total: montantTotal,
    }).select().single()
    if (error || !depense) continue

    const autres = parts.filter(p => p.user_id !== charge.payeur_id)
    if (autres.length > 0) {
      await admin.from("depenses_partagees_parts").insert(
        autres.map(p => ({ depense_id: depense.id, user_id: p.user_id, montant: p.montant }))
      )
    }

    await admin.from("messages_groupe").insert({
      groupe_id: charge.groupe_id, user_id: charge.payeur_id,
      contenu: `🏠 Charge mensuelle générée : "${charge.titre}" — ${montantTotal.toFixed(2)} CHF, répartie entre les colocataires.`,
    })

    await admin.from("colocation_charges").update({ dernier_mois_genere: moisActuel }).eq("id", charge.id)
    generees++
  }

  return NextResponse.json({ ok: true, verifiees: charges?.length || 0, generees })
}
