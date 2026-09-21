import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabaseAdmin"

// Job planifié (voir vercel.json) : prévient chaque utilisateur 0 à 3 jours
// avant l'échéance d'une charge récurrente (loyer, assurance...). Protégé
// par CRON_SECRET pour que seul Vercel Cron (ou toi manuellement) puisse le
// déclencher — sinon n'importe qui pourrait spammer les notifications.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const admin = getSupabaseAdmin()
  const aujourdhui = new Date()
  const debutJour = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate()).getTime()
  const moisActuel = `${aujourdhui.getFullYear()}-${String(aujourdhui.getMonth() + 1).padStart(2, "0")}`

  const { data: charges } = await admin
    .from("depenses")
    .select("id,user_id,titre,montant,jour_du_mois,dernier_rappel_mois")
    .eq("recurrent", true)
    .not("jour_du_mois", "is", null)
    .or(`dernier_rappel_mois.is.null,dernier_rappel_mois.neq.${moisActuel}`)

  let notifiees = 0

  for (const charge of charges || []) {
    const jour = Math.min(charge.jour_du_mois, joursDansLeMois(aujourdhui))
    const echeance = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), jour)
    const diffJours = Math.round((echeance.getTime() - debutJour) / 86400000)

    if (diffJours >= 0 && diffJours <= 3) {
      const message = diffJours === 0
        ? `📅 Ta charge "${charge.titre}" de ${parseFloat(charge.montant).toFixed(0)} CHF tombe aujourd'hui`
        : `📅 Ta charge "${charge.titre}" de ${parseFloat(charge.montant).toFixed(0)} CHF arrive dans ${diffJours} jour${diffJours > 1 ? "s" : ""}`

      await admin.from("notifications").insert({
        user_id: charge.user_id, type: "charge_recurrente", titre: "Charge à venir", contenu: message, lien: "/finances",
      })
      await admin.from("depenses").update({ dernier_rappel_mois: moisActuel }).eq("id", charge.id)
      notifiees++
    }
  }

  return NextResponse.json({ ok: true, verifiees: charges?.length || 0, notifiees })
}

function joursDansLeMois(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}
