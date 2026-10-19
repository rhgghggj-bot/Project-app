// Messages non lus des discussions : on retient sur l'appareil la date du
// dernier message vu dans chaque discussion.
const cle = (groupeId: string) => `discussion-lu:${groupeId}`

export function dateLu(groupeId: string): string | null {
  try { return localStorage.getItem(cle(groupeId)) } catch { return null }
}

export function marquerLu(groupeId: string, iso: string) {
  try { if ((localStorage.getItem(cle(groupeId)) || "") < iso) localStorage.setItem(cle(groupeId), iso) } catch { /* stockage indisponible */ }
}

// Première utilisation sur cet appareil : tout ce qui existe déjà compte comme lu
export function premiereFois(): boolean {
  try {
    if (localStorage.getItem("discussion-lu-init")) return false
    localStorage.setItem("discussion-lu-init", "1")
    return true
  } catch { return false }
}
