"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import QRCodeComponent from "../../components/QRCode"

export default function Projet() {
  const { id } = useParams()
  const [projet, setProjet] = useState<any>(null)
  const [commentaires, setCommentaires] = useState<any[]>([])
  const [contenu, setContenu] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: p } = await supabase.from("projets").select("*").eq("id", id).single()
      setProjet(p)
      const { data: c } = await supabase.from("commentaires").select("*").eq("projet_id", id).order("created_at", { ascending: true })
      setCommentaires(c || [])
    }
    charger()
  }, [id])

  async function commenter() {
    if (!contenu || !user) return
    const { error } = await supabase.from("commentaires").insert({
      projet_id: id,
      user_id: user.id,
      contenu
    })
    if (!error) {
      setContenu("")
      const { data: c } = await supabase.from("commentaires").select("*").eq("projet_id", id).order("created_at", { ascending: true })
      setCommentaires(c || [])
    }
  }

  if (!projet) return <div className="p-8 text-center text-gray-400">Chargement...</div>

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="px-5 py-4 bg-white border-b border-gray-100 flex items-center gap-3">
        <a href="/profile" className="text-gray-400 text-sm">← Retour</a>
        <h1 className="text-base font-medium text-gray-900">{projet.titre}</h1>
      </div>
      <div className="px-5 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
          <div className="bg-purple-100 h-32 flex items-center justify-center text-5xl">📌</div>
          <div className="p-4">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{projet.categorie}</span>
            <h2 className="font-medium text-gray-900 mt-2 mb-2">{projet.titre}</h2>
            <p className="text-sm text-gray-500 mb-4">{projet.description}</p>
            {projet.image_url && (
              <div className="bg-purple-50 rounded-xl p-3 flex items-center gap-3">
                <QRCodeComponent lien={projet.image_url} />
                <div>
                  <p className="text-sm font-medium text-purple-900">Soutenir via Revolut</p>
                  <p className="text-xs text-purple-600 mt-1">revolut.me/{projet.image_url}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Conseils & commentaires</p>
        {commentaires.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Sois le premier à laisser un conseil !</p>
        )}
        {commentaires.map((c: any) => (
          <div key={c.id} className="flex gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
              {c.user_id.slice(0, 2).toUpperCase()}
            </div>
            <div className="bg-white rounded-xl p-3 flex-1 border border-gray-100">
              <p className="text-sm text-gray-700">{c.contenu}</p>
            </div>
          </div>
        ))}
        <div className="flex gap-3 mt-4 items-center">
          <input
            type="text"
            placeholder="Laisser un conseil..."
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-purple-400"
          />
          <button
            onClick={commenter}
            className="bg-purple-600 text-white text-sm px-4 py-2 rounded-full"
          >
            Envoyer
          </button>
        </div>
      </div>
    </main>
  )
}
