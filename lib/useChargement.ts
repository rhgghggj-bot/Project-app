import { useEffect, useEffectEvent } from "react"

// Lance le chargement des données d'une page au montage, puis à chaque changement de `cle`
// (ex. l'id du groupe). `charger` peut rester une fonction du composant, réutilisée
// après une modification : elle lit toujours l'état le plus récent.
export function useChargement(charger: () => unknown, cle?: unknown) {
  const lancer = useEffectEvent(() => { void charger() })
  useEffect(() => {
    // Les mises à jour d'état arrivent après les requêtes, pas pendant l'effet
    let actif = true
    queueMicrotask(() => { if (actif) lancer() })
    return () => { actif = false }
  }, [cle])
}
