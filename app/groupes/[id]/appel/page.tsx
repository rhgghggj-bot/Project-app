'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import '@livekit/components-styles'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  ControlBar,
} from '@livekit/components-react'

export default function AppelGroupe() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [token, setToken] = useState('')
  const [user, setUser] = useState(null)
  const [groupe, setGroupe] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/connexion'); return }
      setUser(user)
      
      // Attendre que la session soit bien etablie
      await new Promise(resolve => setTimeout(resolve, 500))

      const { data: g } = await supabase.from('groupes').select('*').eq('id', params.id).single()
      setGroupe(g)

      // Envoyer un message dans le chat du groupe
      const username = user.email.split('@')[0]
      await supabase.from('messages_groupe').insert({
        groupe_id: String(params.id),
        user_id: user.id,
        contenu: '📞 ' + username + ' a lance un appel — Clique sur 📞 pour rejoindre'
      })

      const username = user.email.split('@')[0]
      const res = await fetch(`/api/livekit?room=groupe-${params.id}&username=${username}`)
      const data = await res.json()
      setToken(data.token)
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return (
    <main style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#1a1a2e'}}>
      <div style={{color:'#fff',fontSize:'16px'}}>Connexion en cours...</div>
    </main>
  )

  return (
    <main style={{height:'100vh',background:'#1a1a2e'}}>
      <div style={{padding:'12px 16px',background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',gap:'12px'}}>
        <button onClick={() => router.back()} style={{color:'#fff',background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
        <span style={{color:'#fff',fontWeight:'500',fontSize:'15px'}}>Appel — {groupe?.nom}</span>
      </div>
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        style={{height:'calc(100vh - 52px)'}}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  )
}
