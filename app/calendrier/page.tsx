"use client"
import { useState } from "react"

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
const JOURS = ["L","M","M","J","V","S","D"]

export default function Calendrier() {
  const today = new Date()
  const [mois, setMois] = useState(today.getMonth())
  const [annee, setAnnee] = useState(today.getFullYear())
  const [evenements, setEvenements] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newNom, setNewNom] = useState("")
  const [newDate, setNewDate] = useState("")

  const premierJour = new Date(annee, mois, 1).getDay()
  const decalage = premierJour === 0 ? 6 : premierJour - 1
  const nbJours = new Date(annee, mois + 1, 0).getDate()

  const evtDuMois = evenements.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === mois && d.getFullYear() === annee
  })

  const joursAvecEvt = evtDuMois.map(e => new Date(e.date).getDate())

  function prevMois() {
    if (mois === 0) { setMois(11); setAnnee(a => a-1) }
    else setMois(m => m-1)
  }
  function nextMois() {
    if (mois === 11) { setMois(0); setAnnee(a => a+1) }
    else setMois(m => m+1)
  }

  function ajouterEvt() {
    if (!newNom || !newDate) return
    setEvenements(prev => [...prev, { id: Date.now(), nom: newNom, date: newDate, couleur: "#2B7FFF" }])
    setNewNom("")
    setNewDate("")
    setShowForm(false)
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="bg-white border-b border-blue-50 px-5 py-3 flex items-center justify-between">
        <a href="/profile" className="text-gray-400 text-sm">← Retour</a>
        <span className="text-base font-medium text-gray-900">Calendrier</span>
        <button onClick={() => setShowForm(!showForm)} className="text-sm bg-yellow-400 text-white px-4 py-2 rounded-full font-medium">+ Échéance</button>
      </div>

      {showForm && (
        <div className="mx-5 mt-4 bg-blue-50 rounded-2xl p-4 border border-blue-100">
          <p className="text-sm font-medium text-gray-900 mb-3">Nouvelle échéance</p>
          <input type="text" placeholder="Nom de l'événement" value={newNom} onChange={e => setNewNom(e.target.value)}
            className="w-full border border-blue-100 rounded-xl px-4 py-2 text-sm text-gray-900 bg-white mb-2 focus:outline-none focus:border-blue-400"/>
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
            className="w-full border border-blue-100 rounded-xl px-4 py-2 text-sm text-gray-900 bg-white mb-3 focus:outline-none focus:border-blue-400"/>
          <button onClick={ajouterEvt} className="w-full bg-blue-500 text-white text-sm font-medium py-2 rounded-xl">Ajouter</button>
        </div>
      )}

      <div className="px-5 py-4">
        <div className="bg-white border border-blue-100 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMois} className="text-gray-400 text-xl px-2">‹</button>
            <span className="text-base font-medium text-gray-900">{MOIS[mois]} {annee}</span>
            <button onClick={nextMois} className="text-gray-400 text-xl px-2">›</button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {JOURS.map((j,i) => (
              <div key={i} className="text-xs text-gray-400 font-medium py-1">{j}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array(decalage).fill(null).map((_,i) => <div key={`e${i}`}></div>)}
            {Array(nbJours).fill(null).map((_,i) => {
              const jour = i + 1
              const isToday = jour === today.getDate() && mois === today.getMonth() && annee === today.getFullYear()
              const hasEvt = joursAvecEvt.includes(jour)
              return (
                <div key={jour} className="relative">
                  <div className={`text-sm py-1.5 rounded-lg mx-0.5 ${isToday ? 'bg-blue-500 text-white font-medium' : hasEvt ? 'bg-yellow-50 text-yellow-700 font-medium' : 'text-gray-700'}`}>
                    {jour}
                  </div>
                  {hasEvt && !isToday && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-yellow-400"></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {evtDuMois.length > 0 && (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Échéances de ce mois</p>
            {evtDuMois.map(e => (
              <div key={e.id} className="flex items-center gap-3 bg-white border border-blue-100 rounded-xl px-4 py-3 mb-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:e.couleur}}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{e.nom}</p>
                  <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}</p>
                </div>
              </div>
            ))}
          </>
        )}

        {evenements.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm">Aucune échéance pour l'instant</p>
            <button onClick={() => setShowForm(true)} className="text-blue-500 text-sm font-medium mt-2">Ajouter une échéance →</button>
          </div>
        )}

        {evenements.length > 0 && (
          <>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3 mt-4">Toutes les échéances</p>
            {evenements.map(e => (
              <div key={e.id} className="flex items-center gap-3 bg-white border border-blue-100 rounded-xl px-4 py-3 mb-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:e.couleur}}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{e.nom}</p>
                  <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'})}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  )
}
