"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

// Connexion en un clic avec Google ou Apple. Chaque bouton n'apparaît que si
// le fournisseur est activé dans Supabase ET signalé à l'appli par sa variable
// d'environnement (NEXT_PUBLIC_CONNEXION_GOOGLE=1, NEXT_PUBLIC_CONNEXION_APPLE=1).
const FOURNISSEURS = [
  { id: "google" as const, nom: "Google", actif: process.env.NEXT_PUBLIC_CONNEXION_GOOGLE === "1",
    logo: <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg> },
  { id: "apple" as const, nom: "Apple", actif: process.env.NEXT_PUBLIC_CONNEXION_APPLE === "1",
    logo: <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.5 2.1-3.7 2.2-3.8-1.2-1.7-3-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.2zM13.8 5.1c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z"/></svg> },
]

export const oauthDisponible = FOURNISSEURS.some(f => f.actif)

export default function BoutonsOAuth({ onErreur }: { onErreur: (message: string) => void }) {
  const [envoi, setEnvoi] = useState<string | null>(null)
  const actifs = FOURNISSEURS.filter(f => f.actif)
  if (!actifs.length) return null

  async function continuer(id: "google" | "apple") {
    setEnvoi(id)
    const { error } = await supabase.auth.signInWithOAuth({ provider: id, options: { redirectTo: `${window.location.origin}/` } })
    if (error) { setEnvoi(null); onErreur("Cette connexion n'est pas disponible pour le moment. Utilise ton e-mail et ton mot de passe.") }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {actifs.map(f => (
        <button key={f.id} type="button" onClick={() => void continuer(f.id)} disabled={!!envoi} aria-busy={envoi === f.id}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", minHeight: 48, borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)", background: f.id === "apple" ? "#000" : "#fff", color: f.id === "apple" ? "#fff" : "#1a1a2e", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: envoi && envoi !== f.id ? 0.6 : 1 }}>
          {f.logo}{envoi === f.id ? "Redirection…" : `Continuer avec ${f.nom}`}
        </button>
      ))}
      <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
        <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.2)" }} />ou avec ton e-mail<span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.2)" }} />
      </div>
    </div>
  )
}
