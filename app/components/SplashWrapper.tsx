"use client"
import { useState, useEffect } from "react"
import SplashScreen from "./SplashScreen"

export default function SplashWrapper({ children }: { children: React.ReactNode }) {
  const [splash, setSplash] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const done = sessionStorage.getItem("splashDone")
    if (!done) setSplash(true)
  }, [])

  const handleDone = () => {
    setSplash(false)
    sessionStorage.setItem("splashDone", "1")
  }

  if (!mounted) return <>{children}</>

  return (
    <>
      {splash && <SplashScreen onDone={handleDone} />}
      {children}
    </>
  )
}
