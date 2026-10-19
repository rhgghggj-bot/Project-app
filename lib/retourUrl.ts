import type { NextRequest } from 'next/server'

// Adresse de retour après un passage chez Stripe. Elle vient du navigateur :
// on n'accepte qu'une page de l'appli elle-même (sinon un lien piégé pourrait
// renvoyer l'acheteur vers un autre site après le paiement).
export function urlDeRetour(request: NextRequest, retourUrl: unknown, defaut = '/'): string {
  const origine = request.nextUrl.origin
  try {
    const u = new URL(String(retourUrl), origine)
    if (u.origin === origine) return origine + u.pathname
  } catch { /* adresse invalide : page par défaut */ }
  return origine + defaut
}
