import { useMemo, useSyncExternalStore } from "react"

// Lecture du stockage du navigateur (localStorage / sessionStorage) et des media queries
// sans setState dans un effet : le rendu serveur voit la valeur par défaut, le client la vraie,
// et React gère l'hydratation proprement.

const EVENEMENT = "nexia:stockage"

function abonner(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(EVENEMENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(EVENEMENT, callback)
  }
}

function lire(zone: "local" | "session", cle: string): string | null {
  try {
    return (zone === "local" ? localStorage : sessionStorage).getItem(cle)
  } catch {
    return null
  }
}

export function useStockageLocal(cle: string): string | null {
  return useSyncExternalStore(abonner, () => lire("local", cle), () => null)
}

export function useStockageSession(cle: string): string | null {
  return useSyncExternalStore(abonner, () => lire("session", cle), () => null)
}

// Plusieurs clés d'un coup (liste fixe) : renvoie un objet { cle: valeur }
export function useStockagesLocaux(cles: readonly string[]): Record<string, string | null> {
  const instantane = useSyncExternalStore(
    abonner,
    () => JSON.stringify(cles.map(c => lire("local", c))),
    () => JSON.stringify(cles.map(() => null)),
  )
  return useMemo(() => {
    const valeurs: (string | null)[] = JSON.parse(instantane)
    return Object.fromEntries(cles.map((c, i) => [c, valeurs[i]]))
  }, [instantane, cles])
}

// Écrit et prévient les composants abonnés de cet onglet (l'événement "storage" ne couvre que les autres onglets)
export function ecrireStockage(zone: "local" | "session", cle: string, valeur: string) {
  try {
    (zone === "local" ? localStorage : sessionStorage).setItem(cle, valeur)
  } catch {
    return
  }
  window.dispatchEvent(new Event(EVENEMENT))
}

// Vrai uniquement côté client, après l'hydratation
export function useEstClient(): boolean {
  return useSyncExternalStore(() => () => {}, () => true, () => false)
}

export function useMediaQuery(requete: string): boolean {
  return useSyncExternalStore(
    callback => {
      const mq = window.matchMedia(requete)
      mq.addEventListener("change", callback)
      return () => mq.removeEventListener("change", callback)
    },
    () => window.matchMedia(requete).matches,
    () => false,
  )
}
