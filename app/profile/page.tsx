"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import QRCodeComponent from "../components/QRCode"

export default function Profile() {
  const [projets, setProjets] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from("projets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        setProjets(data || [])
      }
    }
    charger()
  }, [])

  return (
    <main className="min-h-screen bg-white">
      <div className="h-24" style={{background:'linear-gradient(135deg,#2B7FFF,#87CEEB)'}}></div>
      <div className="px-5">
        <div className="flex items-end justify-between -mt-8 mb-4">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-2xl border-4 border-white">
            {user?.email?.[0].toUpperCase() || "?"}
          </div>
          <div className="flex gap-2">
            <a href="/groupes">
              <button className="text-sm bg-yellow-400 text-white px-4 py-2 rounded-full font-medium">👥 Groupes</button>
            </a>
            <a href="/nouveau-projet">
              <button className="text-sm bg-blue-500 text-white px-4 py-2 rounded-full font-medium">+ Projet</button>
            </a>
          </div>
        </div>
        <p className="text-lg font-medium text-gray-900">{user?.email || "Mon profil"}</p>
        <p className="text-sm text-gray-400 mb-4">{projets.length} projet{projets.length > 1 ? "s" : ""} publié{projets.length > 1 ? "s" : ""}</p>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <p className="text-lg font-medium text-blue-500">{projets.length}</p>
            <p className="text-xs text-gray-400">projets</p>
          </div>
          <div className="flex-1 bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
            <p className="text-lg font-medium text-yellow-500">0</p>
            <p className="text-xs text-gray-400">soutiens</p>
          </div>
          <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <a href="/groupes"><p className="text-lg font-medium text-blue-500">+</p>
            <p className="text-xs text-gray-400">groupes</p></a>
          </div>
        </div>

        <div className="flex gap-3 mb-5">
          <a href="/groupes" className="flex-1">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-blue-300">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">👥</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Mes groupes</p>
                <p className="text-xs text-gray-400">Voir & créer des groupes</p>
              </div>
            </div>
          </a>
          <a href="/calendrier" className="flex-1">
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-yellow-300">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-white text-sm">📅</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Calendrier</p>
                <p className="text-xs text-gray-400">Mes échéances</p>
              </div>
            </div>
          </a>
        </div>

        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Mes projets</p>

        {projets.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm mb-2">Aucun projet pour l'instant</p>
            <a href="/nouveau-projet" className="text-blue-500 text-sm font-medium">Publier mon premier projet →</a>
          </div>
        )}

        {projets.map((projet: any) => (
          <a key={projet.id} href={`/projet/${projet.id}`}>
            <div className="bg-white border border-blue-100 rounded-2xl overflow-hidden mb-4 cursor-pointer hover:border-blue-300">
              <div className="h-28 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-4xl">📌</div>
              <div className="p-4">
                <span className="text-xs bg-blue-50 text-blue-500 px-2 py-1 rounded-full font-medium">{projet.categorie}</span>
                <h2 className="font-medium text-gray-900 mt-2 mb-1">{projet.titre}</h2>
                <p className="text-sm text-gray-400 mb-4">{projet.description}</p>
                <div className="bg-blue-50 rounded-xl p-3 mb-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-500">Cagnotte</span>
                    <span className="font-medium text-gray-900"><span className="text-blue-500">0€</span> / objectif non défini</span>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full w-0" style={{background:'linear-gradient(90deg,#2B7FFF,#D4A843)'}}></div>
                  </div>
                  <p className="text-xs text-blue-500 font-medium mt-1 text-right">0% atteint</p>
                </div>
                {projet.image_url && (
                  <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3 mb-4 border border-blue-100">
                    <QRCodeComponent lien={projet.image_url} />
                    <div>
                      <p className="text-sm font-medium text-blue-600">Soutenir via Revolut</p>
                      <p className="text-xs text-gray-400 mt-1">revolut.me/{projet.image_url}</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-4 pt-3 border-t border-blue-50">
                  <span className="text-sm text-gray-400">❤️ 0 soutiens</span>
                  <span className="text-sm text-blue-400">💬 Voir les conseils →</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}
