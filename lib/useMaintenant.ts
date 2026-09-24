import { useEffect, useState } from "react"

// Heure courante pour les libellés relatifs ("il y a 5 min"), rafraîchie à intervalle régulier.
// Lire Date.now() directement pendant le rendu rend le composant impur (valeurs figées ou incohérentes).
export function useMaintenant(intervalleMs = 60_000) {
  const [maintenant, setMaintenant] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setMaintenant(Date.now()), intervalleMs)
    return () => clearInterval(t)
  }, [intervalleMs])
  return maintenant
}
