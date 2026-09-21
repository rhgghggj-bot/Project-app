// Jarvis (local Ollama + clé Claude perso) n'est prévu que pour l'exploitant
// de l'app, pas pour les utilisateurs finaux : le mode local ne peut de toute
// façon pas fonctionner ailleurs que sur sa machine, et le mode cloud
// consomme sa propre clé API. On compare l'email du compte connecté à
// NEXT_PUBLIC_JARVIS_OWNER_EMAIL (à définir dans les variables d'env du
// déploiement, jamais dans le code source).
export function isJarvisOwner(email: string | null | undefined): boolean {
  const ownerEmail = process.env.NEXT_PUBLIC_JARVIS_OWNER_EMAIL
  if (!ownerEmail || !email) return false
  return email.toLowerCase() === ownerEmail.toLowerCase()
}
