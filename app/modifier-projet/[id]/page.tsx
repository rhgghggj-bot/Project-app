"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ModifierProjet() {
  const { id } = useParams()
  const [titre, setTitre] = useState("")
  const [description, setDescription] = useState("")
  const [categorie, setCategorie] = useState("")
  const [revolut, setRevolut] = useState("")
  const [objectif, setObjectif] = useState("")
  const [prive, setPrive] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function charger() {
      const { data } = await supabase.from("projets").select("*").eq("id", id).single()
      if (data) {
        setTitre(data.titre || "")
        setDescription(data.description || "")
        setCategorie(data.categorie || "")
        setRevolut(data.image_url || "")
        setObjectif(data.objectif || "")
        setPrive(data.prive || false)
      }
    }
    charger()
  }, [id])

  async function sauvegarder() {
    const { error } = await supabase.from("projets").update({
      titre, description, categorie, image_url: revolut, prive
    }).eq("id", id)
    if (error) {
      setMessage("Erreur : " + error.message)
    } else {
      setMessage("Projet mis à jour ! ✓")
      setTimeout(() => window.location.href = "/profile", 1500)
    }
  }

  async function supprimer() {
    if (!confirm("Tu veux vraiment supprimer ce projet ?")) return
    await supabase.from("projets").delete().eq("id", id)
    window.location.href = "/profile"
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-white border-b border-blue-50 px-5 py-3 flex items-center justify-between">
        <a href="/profile" className="text-gray-400 text-sm">← Retour</a>
        <h1 className="text-base font-medium text-gray-900">Modifier le projet</h1>
        <button onClick={supprimer} className="text-xs text-red-400 font-medium">Supprimer</button>
      </div>

      <div className="px-5 py-5 flex flex-col gap-4">

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
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
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Nom du projet</label>
          <input type="text" value={titre} onChange={e => setTitre(e.target.value)}
            className="w-full border border-blue-100 rounded-xl px-4 py-3 text-sm text-gray-900 bg-blue-50 focus:outline-none focus:border-blue-400"/>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
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
          <label className="text-sm font-medium text-gray-700 mb-1 block">Lien Revolut</label>
          <div className="flex items-center border border-blue-100 rounded-xl bg-blue-50 overflow-hidden focus-within:border-blue-400">
            <span className="text-sm text-gray-400 pl-4">revolut.me/</span>
            <input type="text" value={revolut} onChange={e => setRevolut(e.target.value)}
              className="flex-1 py-3 pr-4 text-sm text-gray-900 bg-transparent focus:outline-none"/>
          </div>
          <p className="text-xs text-gray-400 mt-1">Trouve ton pseudo dans l'appli Revolut → Profil → @pseudo</p>
        </div>

        <button onClick={sauvegarder}
          className="w-full text-white font-medium py-3 rounded-xl text-sm"
          style={{background:'#2B7FFF'}}>
          Sauvegarder les modifications ✓
        </button>

        {message && <p className="text-sm text-center text-green-500 font-medium">{message}</p>}
      </div>
    </main>
  )
}
