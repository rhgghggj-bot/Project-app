import { NextRequest } from "next/server"
import { supabase } from "@/lib/supabase"

// Vérifie le token Supabase envoyé par le client (header Authorization: Bearer <token>)
// et retourne l'utilisateur authentifié, ou null. Ne jamais faire confiance à un
// user id envoyé dans le body/query d'une requête : toujours dériver l'identité d'ici.
export async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || ""
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
  if (!token) return null

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  return data.user
}
