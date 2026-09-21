import { supabase } from "@/lib/supabase"

// Renvoie le header Authorization avec le token de session Supabase courant,
// à passer sur tout appel vers une route API qui vérifie l'identité côté serveur.
export async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}
