import type { Metadata } from "next"

export const metadata: Metadata = { title: "Bilan de l'année" }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
