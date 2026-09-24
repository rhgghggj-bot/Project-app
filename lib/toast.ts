// Notifications intégrées à l'appli (remplacent alert()).
// Appelable depuis n'importe quel composant client ; <Toaster /> dans le layout les affiche.
export type ToastTone = "info" | "success" | "error"
export type ToastDetail = { id: number; message: string; tone: ToastTone }

let prochainId = 1

export function toast(message: string, tone: ToastTone = "info") {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<ToastDetail>("nexia:toast", { detail: { id: prochainId++, message, tone } }))
}

// Confirmation intégrée (remplace confirm()) : `if (!(await confirmer("…"))) return`
export type ConfirmDetail = { message: string; confirmLabel: string; resolve: (ok: boolean) => void }

export function confirmer(message: string, confirmLabel = "Confirmer"): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  return new Promise(resolve => {
    window.dispatchEvent(new CustomEvent<ConfirmDetail>("nexia:confirm", { detail: { message, confirmLabel, resolve } }))
  })
}
