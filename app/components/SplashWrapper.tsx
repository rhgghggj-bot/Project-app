"use client"
import { useState, useEffect } from "react"
import SplashScreen from "./SplashScreen"

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [splash, setSplash] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return <>{children}</>

  return (
    <>
      {splash && <SplashScreen onDone={() => setSplash(false)} />}
      {children}
    </>
  )
}
