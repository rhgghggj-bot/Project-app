// Envoie au serveur un rapport d'erreur technique (sans données personnelles :
// page, message, pile d'appels, navigateur). Les rapports apparaissent dans
// Vercel → Logs, filtrés par « [erreur-client] ».
const dejaEnvoyees = new Set<string>()

export function signalerErreur(erreur: unknown, origine: string) {
  try {
    const e = erreur instanceof Error ? erreur : new Error(typeof erreur === "string" ? erreur : JSON.stringify(erreur))
    const message = (e.message || "Erreur inconnue").slice(0, 500)
    // Bruit sans importance : extensions du navigateur, coupures de réseau
    if (/ResizeObserver loop|chrome-extension:|moz-extension:|safari-extension:/i.test(message + (e.stack || ""))) return
    const cle = origine + "|" + message
    if (dejaEnvoyees.has(cle) || dejaEnvoyees.size >= 20) return
    dejaEnvoyees.add(cle)
    const rapport = JSON.stringify({
      origine, message, pile: (e.stack || "").slice(0, 3000), digest: (e as Error & { digest?: string }).digest,
      page: location.pathname, navigateur: navigator.userAgent.slice(0, 200), enLigne: navigator.onLine,
    })
    if (!navigator.sendBeacon?.("/api/erreurs", new Blob([rapport], { type: "application/json" }))) {
      fetch("/api/erreurs", { method: "POST", body: rapport, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {})
    }
  } catch { /* le signalement ne doit jamais casser l'appli */ }
}
