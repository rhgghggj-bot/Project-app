// Rate limiting en mémoire, par utilisateur + route. Suffisant pour un seul
// process long-lived ; sur du serverless multi-instance ça ne partage pas
// l'état entre instances (chaque instance a ses propres compteurs), donc ce
// n'est qu'une première ligne de défense — pas une garantie stricte à grande
// échelle. Pour ça il faudrait un store partagé (ex. Upstash Redis).
const compteurs = new Map<string, { count: number; resetAt: number }>()

// Purge périodique pour éviter une fuite mémoire sur les clés expirées.
setInterval(() => {
  const maintenant = Date.now()
  for (const [cle, v] of compteurs) {
    if (v.resetAt <= maintenant) compteurs.delete(cle)
  }
}, 5 * 60 * 1000).unref?.()

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
  const maintenant = Date.now()
  const entree = compteurs.get(key)

  if (!entree || entree.resetAt <= maintenant) {
    compteurs.set(key, { count: 1, resetAt: maintenant + windowMs })
    return { allowed: true, retryAfterSec: 0 }
  }

  if (entree.count >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((entree.resetAt - maintenant) / 1000) }
  }

  entree.count += 1
  return { allowed: true, retryAfterSec: 0 }
}
