import { redirect } from "next/navigation"

// L'ancienne introduction en trois écrans est remplacée par la présentation
// unique ; l'adresse est gardée pour les anciens liens.
export default function Onboarding() {
  redirect("/presentation")
}
