"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function NouveauProjet() {
  const [titre, setTitre] = useState("")
  const [description, setDescription] = useState("")
  const [categorie, setCategorie] = useState("")
  const [revolut, setRevolut] = useState("")
  const [objectif, setObjectif] = useState("")
  const [echeance, setEcheance] = useState("")
  const [groupeId, setGroupeId] = useState("")
  const [prive, setPrive] = useState(false)
  const [groupes, setGroupes] = useState<any[]>([])
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function charger() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: membres } = await supabase
          .from("membres_groupe")
          .select("groupe_id, groupes(id, nom)")
          .eq("user_id", user.id)
        setGroupes(membres?.map((m: any) => m.groupes) || [])
      }
    }
    charger()
  }, [])

  async function publier() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = "/connexion"; return }
    const { error } = await supabase.from("projets").insert({
      user_id: user.id,
      titre,
      description,
      categorie,
      image_url: revolut,
      groupe_id: groupeId || null,
      prive
    })
    if (error) {
      setMessage("Erreur : " + error.message)
    } else {
      setMessage("Projet publié ! 🎉")
      setTimeout(() => window.location.href = "/profile", 1500)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-white border-b border-blue-50 px-5 py-3 flex items-center gap-3">
        <a href="/profile" className="text-gray-400 text-sm">← Retour</a>
        <h1 className="text-base font-medium text-gray-900">Nouveau projet</h1>
      </div>

      <div className="px-5 py-5 flex flex-col gap-4">

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{prive ? "🔒 Publication privée" : "🌍 Publication publique"}</p>
              <p className="text-xs text-gray-400 mt-1">{prive ? "Visible uniquement par toi" : "Visible par tout le monde"}</p>
            </div>
            <button onClick={() => setPrive(!prive)}
              style={{width:'48px',height:'28px',borderRadius:'99px',border:'none',cursor:'pointer',
                background: prive ? '#2B7FFF' : '#E2E8F0',position:'relative',transition:'background 0.2s'}}>
              <div style={{width:'22px',height:'22px',borderRadius:'50%',background:'#fff',position:'absolute',
                top:'3px',transition:'left 0.2s',left: prive ? '23px' : '3px',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}></div>
            </button>
          </div>
          {!prive && groupes.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-100">
              <label className="text-xs text-gray-500 mb-1 block">Partager dans un groupe (optionnel)</label>
              <select value={groupeId} onChange={e => setGroupeId(e.target.value)}
                className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-blue-400">
                <option value="">Visible par tous (public)</option>
                {groupes.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.nom}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Nom du projet</label>
          <input type="text" placeholder="Restaurant le Coin" value={titre} onChange={e => setTitre(e.target.value)}
            className="w-full border border-blue-100 rounded-xl px-4 py-3 text-sm text-gray-900 bg-blue-50 focus:outline-none focus:border-blue-400"/>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
          <textarea placeholder="Décris ton projet..." value={description} onChange={e => setDescription(e.target.value)} rows={4}
            className="w-full border border-blue-100 rounded-xl px-4 py-3 text-sm text-gray-900 bg-blue-50 focus:outline-none focus:border-blue-400 resize-none"/>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Catégorie</label>
          <select value={categorie} onChange={e => setCategorie(e.target.value)}
            className="w-full border border-blue-100 rounded-xl px-4 py-3 text-sm text-gray-900 bg-blue-50 focus:outline-none focus:border-blue-400">
            <option value="">Choisir une catégorie</option>
            <option value="restauration">Restauration</option>
            <option value="commerce">Commerce</option>
            <option value="musique">Musique</option>
            <option value="art">Art</option>
            <option value="technologie">Technologie</option>
            <option value="sport">Sport</option>
            <option value="education">Éducation</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Objectif de la cagnotte</label>
          <div className="flex items-center border border-blue-100 rounded-xl bg-blue-50 overflow-hidden">
            <input type="number" placeholder="500" value={objectif} onChange={e => setObjectif(e.target.value)}
              className="flex-1 py-3 pl-4 text-sm text-gray-900 bg-transparent focus:outline-none"/>
            <span className="text-sm text-gray-400 pr-4">€ / CHF</span>
          </div>
          {objectif && (
            <div className="mt-2 bg-blue-50 rounded-xl p-3 border border-blue-100">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Cagnotte</span>
                <span className="font-medium"><span className="text-blue-500">0</span> / {objectif} €</span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full w-0 rounded-full" style={{background:'linear-gradient(90deg,#2B7FFF,#D4A843)'}}></div>
              </div>
              <p className="text-xs text-blue-500 font-medium mt-1 text-right">0% atteint</p>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Date limite</label>
          <input type="date" value={echeance} onChange={e => setEcheance(e.target.value)}
            className="w-full border border-blue-100 rounded-xl px-4 py-3 text-sm text-gray-900 bg-blue-50 focus:outline-none focus:border-blue-400"/>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Lien Revolut</label>
          <div className="flex items-center border border-blue-100 rounded-xl bg-blue-50 overflow-hidden">
            <span className="text-sm text-gray-400 pl-4">revolut.me/</span>
            <input type="text" placeholder="tonpseudo" value={revolut} onChange={e => setRevolut(e.target.value)}
              className="flex-1 py-3 pr-4 text-sm text-gray-900 bg-transparent focus:outline-none"/>
          </div>
        </div>

        <button onClick={publier} className="w-full text-white font-medium py-3 rounded-xl text-sm"
          style={{background: prive ? '#1a1a2e' : '#2B7FFF'}}>
          {prive ? "🔒 Publier en privé" : "🌍 Publier en public"} ✦
        </button>

        {message && <p className="text-sm text-center text-green-500 font-medium">{message}</p>}
      </div>
    </main>
  )
}
