"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ecrireStockage, useEstClient, useStockageLocal } from "@/lib/useStockage"
import { PAGES_PUBLIQUES } from "@/lib/legal"

// Bandeau d'information affiché une seule fois. Nexia n'utilise ni cookies
// publicitaires ni traceurs : seulement le stockage nécessaire (session,
// préférences, mode hors connexion) et des statistiques anonymes sans
// cookies. Aucun consentement n'est donc requis, mais on l'explique.
const CLE = "bandeau-cookies-vu"

export default function BandeauCookies() {
  const estClient = useEstClient()
  const vu = useStockageLocal(CLE)
  const publique = PAGES_PUBLIQUES.includes(usePathname())
  if (!estClient || vu) return null
  return (
    <div role="region" aria-label="Cookies et confidentialité"
      style={{ position: "fixed", zIndex: 1001, left: 12, right: 12, bottom: publique ? "calc(12px + env(safe-area-inset-bottom))" : "calc(84px + env(safe-area-inset-bottom))", margin: "0 auto", maxWidth: 560, background: "#0A1628", color: "#fff", borderRadius: 16, padding: "12px 14px", boxShadow: "0 12px 32px -12px rgba(0,0,0,.45)", display: "flex", gap: 12, alignItems: "center", fontSize: 13.5, lineHeight: 1.45 }}>
      <span style={{ flex: 1, textWrap: "pretty" }}>
        🍪 Pas de cookies publicitaires ici : Nexia garde seulement ce qui est nécessaire pour fonctionner et compte les visites de façon anonyme.{" "}
        <Link href="/confidentialite" style={{ color: "#9EC2FF" }}>En savoir plus</Link>
      </span>
      <button onClick={() => ecrireStockage("local", CLE, "1")}
        style={{ flexShrink: 0, minHeight: 44, minWidth: 64, padding: "0 16px", borderRadius: 999, border: "none", background: "#fff", color: "#0A1628", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>OK</button>
    </div>
  )
}
