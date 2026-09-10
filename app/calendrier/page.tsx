"use client"
import { useState } from "react"

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
const JOURS = ["L","M","M","J","V","S","D"]
const JOURS_LONG = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"]

type Vue = "jour" | "semaine" | "mois"

function memeJour(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

function debutSemaine(d: Date) {
  const copie = new Date(d)
  const jour = copie.getDay()
  const decalage = jour === 0 ? 6 : jour - 1
  copie.setDate(copie.getDate() - decalage)
  copie.setHours(0, 0, 0, 0)
  return copie
}

export default function Calendrier() {
  const today = new Date()
  const [vue, setVue] = useState<Vue>("mois")
  const [mois, setMois] = useState(today.getMonth())
  const [annee, setAnnee] = useState(today.getFullYear())
  const [dateRef, setDateRef] = useState(today)
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
    if (mois === 0) { setMois(11); setAnnee(a => a - 1) }
    else setMois(m => m - 1)
  }
  function nextMois() {
    if (mois === 11) { setMois(0); setAnnee(a => a + 1) }
    else setMois(m => m + 1)
  }

  function prevSemaine() {
    const d = new Date(dateRef)
    d.setDate(d.getDate() - 7)
    setDateRef(d)
  }
  function nextSemaine() {
    const d = new Date(dateRef)
    d.setDate(d.getDate() + 7)
    setDateRef(d)
  }

  function prevJour() {
    const d = new Date(dateRef)
    d.setDate(d.getDate() - 1)
    setDateRef(d)
  }
  function nextJour() {
    const d = new Date(dateRef)
    d.setDate(d.getDate() + 1)
    setDateRef(d)
  }

  function ajouterEvt() {
    if (!newNom || !newDate) return
    setEvenements(prev => [...prev, { id: Date.now(), nom: newNom, date: newDate, couleur: "#2B7FFF" }])
    setNewNom("")
    setNewDate("")
    setShowForm(false)
  }

  const debutSem = debutSemaine(dateRef)
  const joursSemaine = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(debutSem)
    d.setDate(d.getDate() + i)
    return d
  })

  const evtDuJour = (d: Date) =>
    evenements.filter(e => memeJour(new Date(e.date), d))

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

      <div className="px-5 pt-4">
        <div className="flex bg-blue-50 rounded-full p-1 mb-4">
          {(["jour", "semaine", "mois"] as Vue[]).map(v => (
            <button
              key={v}
              onClick={() => setVue(v)}
              className={`flex-1 text-sm font-medium py-1.5 rounded-full capitalize transition-colors ${
                vue === v ? "bg-blue-500 text-white" : "text-gray-500"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-4">
        {vue === "mois" && (
          <>
            <div className="bg-white border border-blue-100 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMois} className="text-gray-400 text-xl px-2">‹</button>
                <span className="text-base font-medium text-gray-900">{MOIS[mois]} {annee}</span>
                <button onClick={nextMois} className="text-gray-400 text-xl px-2">›</button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {JOURS.map((j, i) => (
                  <div key={i} className="text-xs text-gray-400 font-medium py-1">{j}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {Array(decalage).fill(null).map((_, i) => <div key={`e${i}`}></div>)}
                {Array(nbJours).fill(null).map((_, i) => {
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
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.couleur }}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{e.nom}</p>
                      <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </>
            )}

            {evenements.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" style={{ marginBottom: "8px" }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p className="text-sm">Aucune échéance pour l'instant</p>
                <button onClick={() => setShowForm(true)} className="text-blue-500 text-sm font-medium mt-2">Ajouter une échéance →</button>
              </div>
            )}

            {evenements.length > 0 && (
              <>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3 mt-4">Toutes les échéances</p>
                {evenements.map(e => (
                  <div key={e.id} className="flex items-center gap-3 bg-white border border-blue-100 rounded-xl px-4 py-3 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.couleur }}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{e.nom}</p>
                      <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {vue === "semaine" && (
          <>
            <div className="bg-white border border-blue-100 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevSemaine} className="text-gray-400 text-xl px-2">‹</button>
                <span className="text-base font-medium text-gray-900">
                  {joursSemaine[0].getDate()} — {joursSemaine[6].getDate()} {MOIS[joursSemaine[6].getMonth()]} {joursSemaine[6].getFullYear()}
                </span>
                <button onClick={nextSemaine} className="text-gray-400 text-xl px-2">›</button>
              </div>

              <div className="space-y-2">
                {joursSemaine.map((d, i) => {
                  const isToday = memeJour(d, today)
                  const evts = evtDuJour(d)
                  return (
                    <div key={i} className={`flex items-start gap-3 rounded-xl px-3 py-2 ${isToday ? 'bg-blue-50' : ''}`}>
                      <div className="flex flex-col items-center w-10 flex-shrink-0">
                        <span className="text-xs text-gray-400">{JOURS[i]}</span>
                        <span className={`text-sm ${isToday ? 'font-semibold text-blue-500' : 'text-gray-700'}`}>{d.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {evts.length === 0 ? (
                          <p className="text-xs text-gray-300 py-1.5">—</p>
                        ) : (
                          evts.map(e => (
                            <div key={e.id} className="flex items-center gap-2 py-1">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.couleur }}></div>
                              <p className="text-sm text-gray-900 truncate">{e.nom}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {vue === "jour" && (
          <>
            <div className="bg-white border border-blue-100 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevJour} className="text-gray-400 text-xl px-2">‹</button>
                <span className="text-base font-medium text-gray-900">
                  {JOURS_LONG[dateRef.getDay() === 0 ? 6 : dateRef.getDay() - 1]} {dateRef.getDate()} {MOIS[dateRef.getMonth()]}
                </span>
                <button onClick={nextJour} className="text-gray-400 text-xl px-2">›</button>
              </div>

              {evtDuJour(dateRef).length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">Rien de prévu ce jour-là</p>
                  <button onClick={() => { setNewDate(dateRef.toISOString().slice(0, 10)); setShowForm(true) }} className="text-blue-500 text-sm font-medium mt-2">Ajouter une échéance →</button>
                </div>
              ) : (
                evtDuJour(dateRef).map(e => (
                  <div key={e.id} className="flex items-center gap-3 border border-blue-100 rounded-xl px-4 py-3 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.couleur }}></div>
                    <p className="text-sm font-medium text-gray-900">{e.nom}</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}