"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Groupes() {
  const [groupes, setGroupes] = useState<any[]>([])
  const [mesGroupes, setMesGroupes] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)
  const [nom, setNom] = useState("")
  const [description, setDescription] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data } = await supabase.from("groupes").select("*").order("created_at", { ascending: false })
      setGroupes(data || [])
      if (user) {
        const { data: membres } = await supabase.from("membres_groupe").select("groupe_id").eq("user_id", user.id)
        setMesGroupes(membres?.map((m: any) => m.groupe_id) || [])
      }
    }
    charger()
  }, [])

  async function creerGroupe() {
    if (!user) { window.location.href = "/connexion"; return }
    if (!nom) { setMessage("Donne un nom au groupe !"); return }
    const { data, error } = await supabase.from("groupes").insert({
      nom, description, created_by: user.id
    }).select().single()
    if (error) {
      setMessage("Erreur : " + error.message)
    } else {
      await supabase.from("membres_groupe").insert({ groupe_id: data.id, user_id: user.id })
      setMessage("Groupe créé !")
      setNom("")
      setDescription("")
      setShowForm(false)
      window.location.href = `/groupes/${data.id}`
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-white border-b border-blue-50 px-5 py-3 flex items-center justify-between">
        <a href="/" className="text-gray-400 text-sm">← Retour</a>
        <h1 className="text-base font-medium text-gray-900">Groupes</h1>
        <button onClick={() => setShowForm(!showForm)} className="text-sm bg-blue-500 text-white px-4 py-2 rounded-full font-medium">+ Créer</button>
      </div>

      {showForm && (
        <div className="mx-5 mt-4 bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-sm font-medium text-gray-900 mb-3">Nouveau groupe</p>
          <input type="text" placeholder="Nom du groupe" value={nom} onChange={e => setNom(e.target.value)}
            className="w-full border border-blue-100 rounded-xl px-4 py-2 text-sm text-gray-900 bg-white mb-2 focus:outline-none focus:border-blue-400"/>
          <textarea placeholder="Description du groupe..." value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="w-full border border-blue-100 rounded-xl px-4 py-2 text-sm text-gray-900 bg-white mb-3 focus:outline-none focus:border-blue-400 resize-none"/>
          <button onClick={creerGroupe} className="w-full bg-blue-500 text-white text-sm font-medium py-2 rounded-xl">Créer le groupe</button>
          {message && <p className="text-sm text-center mt-2 text-green-500">{message}</p>}
        </div>
      )}

      <div className="px-5 py-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Mes groupes</p>

        {groupes.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" style={{marginBottom:"12px"}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p className="text-sm mb-2">Aucun groupe pour l'instant</p>
            <button onClick={() => setShowForm(true)} className="text-blue-500 text-sm font-medium">Créer le premier groupe →</button>
          </div>
        )}

        {groupes.filter((groupe: any) => mesGroupes.includes(groupe.id) || groupe.created_by === user?.id).map((groupe: any) => {
          const estMembre = mesGroupes.includes(groupe.id)
          return (
            <div key={groupe.id} className="bg-white border border-blue-100 rounded-2xl p-4 mb-3">
              <div className="flex items-center justify-between">
                {estMembre ? (
                  <a href={`/groupes/${groupe.id}`} className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-medium text-lg">
                      {groupe.nom?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{groupe.nom}</p>
                      <p className="text-xs text-gray-400">{groupe.description}</p>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400 font-medium text-lg">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{groupe.nom}</p>
                      <p className="text-xs text-gray-400">Groupe privé · invitation requise</p>
                    </div>
                  </div>
                )}
                {estMembre && (
                  <span className="text-xs bg-blue-50 text-blue-500 px-3 py-1 rounded-full font-medium ml-3">
                    <span style={{display:"flex",alignItems:"center",gap:"4px"}}>Membre <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg></span>
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
