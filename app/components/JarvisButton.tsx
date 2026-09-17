"use client"
import { useEffect, useState } from "react"

export default function JarvisButton() {
  const [estLocal, setEstLocal] = useState(false)

  useEffect(() => {
    setEstLocal(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  }, [])

  if (!estLocal) return null

  return (
    <a href="/jarvis" aria-label="Ouvrir Jarvis" style={{
      position:'fixed', bottom:'90px', right:'18px', zIndex:1001,
      width:'52px', height:'52px', borderRadius:'50%',
      background:'radial-gradient(circle at 35% 30%, #FFD9A0, #FF9E2C 55%, #C96A0A 100%)',
      boxShadow:'0 4px 16px rgba(255,150,40,0.45)',
      display:'flex', alignItems:'center', justifyContent:'center',
      textDecoration:'none'
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <ellipse cx="12" cy="12" rx="9" ry="3.6"/>
        <path d="M12 3v18"/>
      </svg>
    </a>
  )
}
