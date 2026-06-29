"use client"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Navigation() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const items = [
    { href: "/", icon: "🏠", label: "Accueil" },
    { href: "/groupes", icon: "👥", label: "Groupes" },
    { href: "/semaine", icon: "📅", label: "Calendrier" },
    { href: "/finances", icon: "💸", label: "Finances" },
    { href: user ? "/profile" : "/connexion", icon: "👤", label: user ? "Profil" : "Connexion" },
  ]

  return (
    <>
      {/* Navigation mobile en bas - iPhone */}
      <nav className="md:hidden" style={{
        position:'fixed',bottom:0,left:0,right:0,
        background:'rgba(255,255,255,0.95)',
        backdropFilter:'blur(20px)',
        borderTop:'0.5px solid #E8F1FF',
        display:'flex',
        padding:'8px 0 20px',
        zIndex:1000
      }}>
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <a key={item.href} href={item.href} style={{
              flex:1,display:'flex',flexDirection:'column',alignItems:'center',
              gap:'3px',textDecoration:'none',cursor:'pointer'
            }}>
              <span style={{fontSize:'22px'}}>{item.icon}</span>
              <span style={{
                fontSize:'10px',fontWeight:'500',
                color: isActive ? '#2B7FFF' : '#aaa'
              }}>{item.label}</span>
              {isActive && <div style={{width:'4px',height:'4px',borderRadius:'50%',background:'#2B7FFF'}}></div>}
            </a>
          )
        })}
      </nav>

      {/* Navigation desktop en haut - Mac */}
      <nav className="hidden md:flex" style={{
        background:'#fff',
        borderBottom:'0.5px solid #E8F1FF',
        padding:'0 18px',
        height:'52px',
        alignItems:'center',
        justifyContent:'space-between'
      }}>
        <span style={{fontSize:'18px',fontWeight:'500',color:'#1a1a2e'}}>
          Pro<span style={{color:'#D4A843'}}>ject</span>
        </span>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          {items.slice(1,-1).map(item => (
            <a key={item.href} href={item.href} style={{
              fontSize:'13px',
              color: pathname === item.href ? '#2B7FFF' : '#aaa',
              textDecoration:'none',
              fontWeight: pathname === item.href ? '500' : '400'
            }}>
              {item.label}
            </a>
          ))}
          <a href="/scanner" style={{fontSize:'13px',color: pathname === '/scanner' ? '#2B7FFF' : '#aaa',textDecoration:'none'}}>📄 Scanner</a>
          {user ? (
            <a href="/profile" style={{fontSize:'13px',fontWeight:'500',background:'#2B7FFF',color:'#fff',padding:'6px 14px',borderRadius:'99px',textDecoration:'none'}}>Mon profil</a>
          ) : (
            <a href="/connexion" style={{fontSize:'13px',fontWeight:'500',background:'#2B7FFF',color:'#fff',padding:'6px 14px',borderRadius:'99px',textDecoration:'none'}}>Connexion</a>
          )}
        </div>
      </nav>
    </>
  )
}
