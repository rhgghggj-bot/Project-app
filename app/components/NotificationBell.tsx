"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<any[]>([])
  const [ouvert, setOuvert] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const channelRef = useRef<any>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      setNotifs(data || [])

      channelRef.current = supabase
        .channel('notifs-' + user.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + user.id },
          (payload) => setNotifs(prev => [payload.new, ...prev]))
        .subscribe()

      return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
    }
    init()
  }, [])

  const nonLues = notifs.filter(n => !n.lu).length

  async function marquerLu(id: string, lien?: string) {
    await supabase.from("notifications").update({ lu: true }).eq("id", id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
    if (lien) { setOuvert(false); router.push(lien) }
  }

  async function toutMarquerLu() {
    if (!user) return
    await supabase.from("notifications").update({ lu: true }).eq("user_id", user.id).eq("lu", false)
    setNotifs(prev => prev.map(n => ({ ...n, lu: true })))
  }

  const iconType = (type: string) => {
    if (type === 'message') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    if (type === 'appel') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.47 2 2 0 0 1 3.54 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
    if (type === 'echeance') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  }

  const couleurType = (type: string) => {
    if (type === 'message') return '#2B7FFF'
    if (type === 'appel') return '#10B981'
    if (type === 'echeance') return '#D4A843'
    return '#8B5CF6'
  }

  const tempsEcoule = (date: string) => {
    const diff = (Date.now() - new Date(date).getTime()) / 1000
    if (diff < 60) return 'maintenant'
    if (diff < 3600) return Math.floor(diff/60) + 'min'
    if (diff < 86400) return Math.floor(diff/3600) + 'h'
    return Math.floor(diff/86400) + 'j'
  }

  if (!user) return null

  return (
    <div style={{position:'relative'}}>
      <button onClick={() => setOuvert(!ouvert)}
        style={{width:'38px',height:'38px',borderRadius:'50%',background: nonLues > 0 ? '#EEF5FF' : '#F8FBFF',border:'1px solid #E8F1FF',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',position:'relative'}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B7FFF" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {nonLues > 0 && (
          <div style={{position:'absolute',top:'-2px',right:'-2px',width:'16px',height:'16px',borderRadius:'50%',background:'#F43F5E',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',color:'#fff',fontWeight:'600'}}>
            {nonLues > 9 ? '9+' : nonLues}
          </div>
        )}
      </button>

      {ouvert && (
        <>
          <div onClick={() => setOuvert(false)} style={{position:'fixed',inset:0,zIndex:40}}></div>
          <div style={{position:'absolute',top:'46px',right:0,width:'300px',background:'#fff',borderRadius:'16px',boxShadow:'0 8px 30px rgba(0,0,0,0.12)',border:'0.5px solid #E8F1FF',zIndex:50,overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'0.5px solid #E8F1FF',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontSize:'14px',fontWeight:'500',color:'#1a1a2e'}}>Notifications</span>
              {nonLues > 0 && (
                <button onClick={toutMarquerLu} style={{fontSize:'11px',color:'#2B7FFF',background:'none',border:'none',cursor:'pointer'}}>
                  Tout marquer lu
                </button>
              )}
            </div>
            <div style={{maxHeight:'360px',overflowY:'auto'}}>
              {notifs.length === 0 ? (
                <div style={{padding:'32px 16px',textAlign:'center',color:'#aaa',fontSize:'13px'}}>
                  Aucune notification
                </div>
              ) : notifs.map((n: any) => (
                <div key={n.id} onClick={() => marquerLu(n.id, n.lien)}
                  style={{padding:'12px 16px',borderBottom:'0.5px solid #F0F4FA',cursor:'pointer',background: n.lu ? '#fff' : '#F8FBFF',display:'flex',gap:'10px',alignItems:'flex-start'}}>
                  <div style={{width:'32px',height:'32px',borderRadius:'10px',background:couleurType(n.type)+'22',color:couleurType(n.type),display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {iconType(n.type)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'13px',fontWeight: n.lu ? '400' : '500',color:'#1a1a2e',marginBottom:'2px'}}>{n.titre}</div>
                    <div style={{fontSize:'11px',color:'#aaa',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{n.contenu}</div>
                  </div>
                  <div style={{fontSize:'10px',color:'#aaa',flexShrink:0}}>{tempsEcoule(n.created_at)}</div>
                  {!n.lu && <div style={{width:'6px',height:'6px',borderRadius:'50%',background:'#2B7FFF',flexShrink:0,marginTop:'4px'}}></div>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
