"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [projets, setProjets] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data } = await supabase
        .from("projets")
        .select("*")
        .is("groupe_id", null)
        .order("created_at", { ascending: false })
      setProjets(data || [])
    }
    charger()
  }, [])

  return (
    <main className="min-h-screen bg-white">
      <nav className="bg-white border-b border-blue-50 px-5 py-3 flex items-center justify-between">
        <span className="text-lg font-medium text-gray-900">Pro<span className="text-yellow-500">ject</span></span>
        <div className="flex items-center gap-3">
          <a href="/groupes" className="text-sm text-gray-500">Groupes</a>
          <a href="/calendrier" className="text-sm text-gray-500">Calendrier</a>
          {user ? (
            <a href="/profile" className="text-sm font-medium bg-blue-500 text-white px-4 py-2 rounded-full">Mon profil</a>
          ) : (
            <a href="/connexion" className="text-sm font-medium bg-blue-500 text-white px-4 py-2 rounded-full">Connexion</a>
          )}
        </div>
      </nav>

      <div className="px-5 py-8 bg-gradient-to-br from-blue-50 to-yellow-50 border-b border-blue-100">
        <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 text-xs font-medium px-3 py-1 rounded-full border border-yellow-200 mb-4">✦ Réseau de projets</div>
        <h1 className="text-2xl font-medium text-gray-900 leading-tight mb-2">Lancez vos projets,<br /><span className="text-blue-500">trouvez votre soutien</span></h1>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">Partagez votre projet avec votre groupe et recevez conseils et dons directement.</p>
        <div className="flex gap-3">
          <a href="/nouveau-projet"><button className="bg-blue-500 text-white font-medium text-sm px-5 py-2 rounded-full">Publier un projet</button></a>
          <a href="/groupes"><button className="bg-yellow-50 text-yellow-700 font-medium text-sm px-5 py-2 rounded-full border border-yellow-200">Rejoindre un groupe</button></a>
        </div>
      </div>

      <div className="px-5 py-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-4">Projets publics</p>

        {projets.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-4">🚀</p>
            <p className="text-lg font-medium text-gray-600 mb-2">Soyez les premiers !</p>
            <p className="text-sm mb-4">Aucun projet pour l'instant. Lance le tien !</p>
            <a href="/nouveau-projet">
              <button className="bg-blue-500 text-white font-medium text-sm px-6 py-3 rounded-full">Publier mon projet</button>
            </a>
          </div>
        )}

        {projets.map((projet: any) => (
          <a key={projet.id} href={`/projet/${projet.id}`}>
            <div className="bg-white border border-blue-100 rounded-2xl overflow-hidden mb-3 cursor-pointer hover:border-blue-300">
              <div className="h-24 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-4xl">📌</div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                    {projet.titre?.[0]?.toUpperCase() || "P"}
                  </div>
                  <span className="ml-auto text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-medium">{projet.categorie}</span>
                </div>
                <p className="font-medium text-gray-900 mb-1">{projet.titre}</p>
                <p className="text-xs text-gray-400 mb-3">{projet.description}</p>
                <div className="bg-blue-50 rounded-xl p-3 mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Cagnotte</span>
                    <span className="font-medium"><span className="text-blue-500">0€</span> / objectif</span>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full w-0" style={{background:'linear-gradient(90deg,#2B7FFF,#D4A843)'}}></div>
                  </div>
                  <p className="text-xs text-blue-500 font-medium mt-1 text-right">0% atteint</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>❤️ 0</span><span>💬 0</span>
                  </div>
                  <button className="bg-yellow-400 text-white text-xs font-medium px-4 py-2 rounded-full">✦ Soutenir</button>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}
