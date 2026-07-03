"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Rejoindre() {
  const { code } = useParams()
  const [message, setMessage] = useState("Vérification de l'invitation...")
  const [groupe, setGroupe] = useState<any>(null)

  useEffect(() => {
    async function rejoindre() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = `/connexion`
        return
      }
      const { data: inv } = await supabase.from("invitations").select("*, groupes(*)").eq("code", code).single()
      if (!inv) {
        setMessage("Lien invalide ou expiré.")
        return
      }
      setGroupe(inv.groupes)
      const { data: dejaMembre } = await supabase.from("membres_groupe")
        .select("*").eq("groupe_id", inv.groupe_id).eq("user_id", user.id).single()
      if (dejaMembre) {
        setMessage("Tu es déjà membre de ce groupe !")
        setTimeout(() => window.location.href = `/groupes/${inv.groupe_id}`, 1500)
        return
      }
      const { error } = await supabase.from("membres_groupe").insert({
        groupe_id: inv.groupe_id,
        user_id: user.id
      })
      if (!error) {
        setMessage("Tu as rejoint le groupe ! Redirection...")
        setTimeout(() => window.location.href = `/groupes/${inv.groupe_id}`, 1500)
      }
    }
    rejoindre()
  }, [code])

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="1.5" style={{marginBottom:"16px"}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        {groupe && <h1 className="text-lg font-medium text-gray-900 mb-2">{groupe.nom}</h1>}
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </main>
  )
}
