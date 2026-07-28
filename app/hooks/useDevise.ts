"use client"
import { useState, useEffect } from "react"

export function useDevise() {
  const [devise, setDevise] = useState('CHF')

  useEffect(() => {
    const saved = localStorage.getItem('nexia_devise')
    if (saved) setDevise(saved)
  }, [])

  return devise
}
