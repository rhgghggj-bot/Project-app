"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useStockageLocal } from "@/lib/useStockage"

export function useDevise() {
  return useStockageLocal('nexia_devise') || 'CHF'
}

// Conversion complète (devise + taux de change en direct), pour tout
// composant qui affiche un montant en CHF et veut le montrer dans la devise
// choisie par l'utilisateur — pas seulement /finances.
export function useDeviseConversion() {
  const [devise, setDevise] = useState('CHF')
  const [taux, setTaux] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase.from('profiles').select('devise').eq('id', user.id).single()
        if (data?.devise) { setDevise(data.devise); return }
      }
      const saved = localStorage.getItem('nexia_devise')
      if (saved) setDevise(saved)
    })
    fetch('https://open.er-api.com/v6/latest/CHF')
      .then(r => r.json())
      .then(data => setTaux(data.rates))
      .catch(() => {})
  }, [])

  function conv(montantCHF: number) {
    if (devise === 'CHF' || !taux || !taux[devise]) return montantCHF
    return montantCHF * taux[devise]
  }

  function format(montantCHF: number) {
    return `${conv(montantCHF).toFixed(0)} ${devise}`
  }

  return { devise, conv, format }
}
