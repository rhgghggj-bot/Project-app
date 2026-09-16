"use client"
import { usePathname } from "next/navigation"

export default function PageFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const bare = pathname === "/presentation"

  if (bare) return <>{children}</>

  return (
    <div style={{ paddingBottom: "90px", paddingTop: "calc(44px + env(safe-area-inset-top))" }} className="md:pt-0">
      {children}
    </div>
  )
}
