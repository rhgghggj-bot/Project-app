import type { Metadata } from "next"

export const metadata: Metadata = { title: "Espace étudiant" }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
