"use client"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import NotificationBell from "./NotificationBell"
import { supabase } from "@/lib/supabase"

const IconHome = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IconGroupe = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IconCalendrier = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IconFinances = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const IconProfil = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IconScanner = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 7 4"/><polyline points="17 4 20 4 20 7"/><polyline points="20 17 20 20 17 20"/><polyline points="7 20 4 20 4 17"/><line x1="4" y1="12" x2="20" y2="12"/></svg>

export default function Navigation() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const items = [
    { href: "/", Icon: IconHome, label: "Accueil" },
    { href: "/groupes", Icon: IconGroupe, label: "Groupes" },
    { href: "/semaine", Icon: IconCalendrier, label: "Calendrier" },
    { href: "/finances", Icon: IconFinances, label: "Finances" },
    { href: user ? "/profile" : "/connexion", Icon: IconProfil, label: user ? "Profil" : "Connexion" },
  ]

  return (
    <>
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
              gap:'3px',textDecoration:'none',cursor:'pointer',
              color: isActive ? '#2B7FFF' : '#aaa'
            }}>
              <item.Icon />
              <span style={{fontSize:'10px',fontWeight:'500'}}>{item.label}</span>
              {isActive && <div style={{width:'4px',height:'4px',borderRadius:'50%',background:'#2B7FFF'}}></div>}
            </a>
          )
        })}
      </nav>

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
          <a href="/scanner" style={{fontSize:'13px',color: pathname === '/scanner' ? '#2B7FFF' : '#aaa',textDecoration:'none',display:'flex',alignItems:'center',gap:'4px'}}>
            <IconScanner /> Scanner
          </a>
          <NotificationBell />
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
