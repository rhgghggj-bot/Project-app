"use client"
import { useEffect, useState, useSyncExternalStore } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/lib/toast"
import { prochainesOccurrences } from "@/lib/calendrier"
import type { EvenementCalendrier } from "@/lib/types"

// Le seul système de rappels de l'appli : 1 h, 30 min et 10 min avant chaque
// événement du calendrier (cours répétés compris), tant que l'appli est ouverte.
// Un message dans l'appli, plus une notification du téléphone / de l'ordinateur
// si l'élève l'a activée lui-même (bouton du calendrier, jamais demandé d'office).
// Chaque rappel n'est envoyé qu'une fois, même après un rechargement.

const DELAIS_MIN = [60, 30, 10]
// Fenêtre de rattrapage : si l'appli était en arrière-plan à l'heure pile
const RATTRAPAGE_MIN = 5

function libelle(min: number) {
  return min === 60 ? "1 h" : `${min} min`
}

function dejaEnvoye(cle: string) {
  try { return localStorage.getItem(cle) === "1" } catch { return false }
}

function marquer(cle: string) {
  try { localStorage.setItem(cle, "1") } catch { /* stockage indisponible : on accepte un doublon éventuel */ }
}

// Notifications du téléphone : demandées seulement après un geste de l'élève
export const notificationsPossibles = () => typeof window !== "undefined" && "Notification" in window
export async function activerNotifications(): Promise<boolean> {
  if (!notificationsPossibles()) return false
  const permission = await Notification.requestPermission()
  if (permission !== "granted") return false
  try { await navigator.serviceWorker?.register("/sw.js") } catch { /* sans service worker : notification simple */ }
  return true
}

async function notifier(titre: string, corps: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return
  try {
    // Sur iPhone, seules les notifications passées par le service worker s'affichent
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.showNotification(titre, { body: corps, icon: "/icon-192.png", tag: titre + corps })
    else new Notification(titre, { body: corps, icon: "/icon-192.png" })
  } catch { /* notification refusée par le système : le message dans l'appli suffit */ }
}

export default function RappelsEvenements() {
  useEffect(() => {
    let evenements: EvenementCalendrier[] = []
    let actif = true

    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !actif) return
      const { data } = await supabase.from("evenements_calendrier").select("*").eq("user_id", user.id)
      evenements = (data || []) as EvenementCalendrier[]
      verifier()
    }

    function verifier() {
      const maintenant = new Date()
      for (const o of prochainesOccurrences(evenements, maintenant, 1)) {
        if (!o.evt.heure) continue
        const minutesAvant = (o.debut.getTime() - maintenant.getTime()) / 60_000
        for (const delai of DELAIS_MIN) {
          if (minutesAvant > delai || minutesAvant <= delai - RATTRAPAGE_MIN) continue
          const cle = `rappel:${o.evt.id}:${o.debut.toISOString()}:${delai}`
          if (dejaEnvoye(cle)) continue
          marquer(cle)
          const heure = o.evt.heure.slice(0, 5)
          toast(`${o.evt.titre} dans ${libelle(delai)} (${heure})`)
          void notifier(`Dans ${libelle(delai)} : ${o.evt.titre}`, `À ${heure}${o.evt.lieu ? ` · ${o.evt.lieu}` : ""}`)
        }
      }
    }

    // Notifications déjà autorisées : on s'assure que le service worker est là
    if (notificationsPossibles() && Notification.permission === "granted") navigator.serviceWorker?.register("/sw.js").catch(() => {})
    void charger()
    const tic = setInterval(verifier, 30_000)
    const rechargement = setInterval(charger, 10 * 60_000)
    const auRetour = () => { if (document.visibilityState === "visible") void charger() }
    document.addEventListener("visibilitychange", auRetour)
    return () => {
      actif = false
      clearInterval(tic)
      clearInterval(rechargement)
      document.removeEventListener("visibilitychange", auRetour)
    }
  }, [])

  return null
}

// État des rappels sur cet appareil, toujours affiché en haut du calendrier :
// bouton pour les activer, ou explication s'ils sont bloqués / impossibles.
type EtatNotif = NotificationPermission | "impossible"
const aucunAbonnement = () => () => {}
const lireEtat = (): EtatNotif => (notificationsPossibles() ? Notification.permission : "impossible")
const AIDE_BLOQUE = "Les notifications sont bloquées pour Nexia. Sur iPhone : Réglages → Notifications → Nexia. Sur Android ou ordinateur : touche le cadenas à gauche de l'adresse → Notifications → Autoriser. Les rappels s'affichent quand même dans l'appli."
const AIDE_IPHONE = "Sur iPhone, les notifications ne marchent que si Nexia est installé : dans Safari, touche Partager → « Sur l'écran d'accueil », puis ouvre Nexia depuis l'icône. Les rappels s'affichent quand même dans l'appli."

export function BoutonRappels({ style }: { style?: React.CSSProperties }) {
  const lu = useSyncExternalStore(aucunAbonnement, lireEtat, () => "impossible" as EtatNotif)
  const [apres, setApres] = useState<EtatNotif | null>(null)
  const etat = apres ?? lu

  if (etat === "granted") return (
    <button style={style} onClick={() => { void notifier("Test Nexia", "Les rappels du calendrier arriveront comme ça."); toast("Notification de test envoyée.", "success") }}>
      🔔 Rappels activés sur cet appareil · tester
    </button>
  )
  if (etat === "denied") return <button style={style} onClick={() => toast(AIDE_BLOQUE, "info")}>🔕 Rappels bloqués sur cet appareil · comment les autoriser ?</button>
  if (etat === "impossible") return <button style={style} onClick={() => toast(AIDE_IPHONE, "info")}>🔔 Recevoir les rappels : installe Nexia sur ton écran d&apos;accueil</button>
  return (
    <button style={style} onClick={async () => {
      const ok = await activerNotifications()
      setApres(lireEtat())
      toast(ok ? "Rappels activés : tu seras prévenu 1 h, 30 min et 10 min avant tes événements." : "Rappels non activés. Ils s'affichent quand même dans l'appli quand elle est ouverte.", ok ? "success" : "info")
    }}>🔔 Recevoir les rappels sur cet appareil</button>
  )
}
