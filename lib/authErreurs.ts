// Messages Supabase Auth (en anglais) -> message clair en français avec la marche à suivre.
export function messageErreurAuth(message: string): string {
  const m = message.toLowerCase()
  if (m.includes("invalid login credentials")) return "Email ou mot de passe incorrect. Vérifie-les et réessaie."
  if (m.includes("email not confirmed")) return "Confirme d'abord ton email : ouvre le lien reçu dans ta boîte mail."
  if (m.includes("already registered") || m.includes("already been registered")) return "Un compte existe déjà avec cet email. Connecte-toi plutôt."
  if (m.includes("password should be at least")) return "Mot de passe trop court : 6 caractères minimum."
  if (m.includes("unable to validate email") || m.includes("invalid email")) return "Cette adresse email n'est pas valide."
  if (m.includes("rate limit") || m.includes("too many")) return "Trop de tentatives. Patiente une minute puis réessaie."
  if (m.includes("fetch") || m.includes("network")) return "Pas de connexion réseau. Vérifie ta connexion et réessaie."
  return message
}
