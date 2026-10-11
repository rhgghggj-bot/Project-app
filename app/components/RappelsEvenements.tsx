"use client"
import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/lib/toast"
import { prochainesOccurrences } from "@/lib/calendrier"
import type { EvenementCalendrier } from "@/lib/types"

// Rappels 1 h, 30 min et 10 min avant chaque événement du calendrier (cours
// répétés compris), tant que l'appli est ouverte : un message dans l'appli,
// plus une notification du téléphone / de l'ordinateur si elle est autorisée.
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
