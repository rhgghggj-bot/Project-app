"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Connexion() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  async function connecter() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage("Erreur : " + error.message)
    } else {
      window.location.href = "/"
    }
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-gray-900 mb-1">
            Pro<span className="text-yellow-500">ject</span>
          </h1>
          <p className="text-sm text-gray-500">Content de te revoir !</p>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 p-6">
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <input
              type="email"
              placeholder="thomas@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-blue-100 rounded-xl px-4 py-3 text-sm text-gray-900 bg-blue-50 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-blue-100 rounded-xl px-4 py-3 text-sm text-gray-900 bg-blue-50 focus:outline-none focus:border-blue-400"
            />
          </div>

          <button
            onClick={connecter}
            className="w-full bg-blue-500 text-white font-medium py-3 rounded-xl text-sm hover:bg-blue-600"
          >
            Se connecter
          </button>

          {message && (
            <p className="text-sm text-center mt-4 text-red-500">{message}</p>
          )}

          <p className="text-xs text-center text-gray-400 mt-4">
            Pas encore de compte ?{" "}
            <a href="/inscription" className="text-blue-500 font-medium">S'inscrire</a>
          </p>
        </div>
      </div>
    </main>
  )
}
