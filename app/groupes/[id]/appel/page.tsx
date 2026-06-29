'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LiveKitRoom,
  useLocalParticipant,
  RoomAudioRenderer,
  useTracks,
  VideoTrack,
} from '@livekit/components-react'
import { Track } from 'livekit-client'

function Controls({ onLeave }: { onLeave: () => void }) {
  const { localParticipant } = useLocalParticipant()
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)

  const toggleMic = () => {
    localParticipant.setMicrophoneEnabled(!micOn)
    setMicOn(!micOn)
  }

  const toggleCam = () => {
    localParticipant.setCameraEnabled(!camOn)
    setCamOn(!camOn)
  }

  const [facingMode, setFacingMode] = useState<'user'|'environment'>('user')
  const switchCam = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(d => d.kind === 'videoinput')
      if (cameras.length > 1) {
        const newMode = facingMode === 'user' ? 'environment' : 'user'
        setFacingMode(newMode)
        await localParticipant.setCameraEnabled(false)
        setTimeout(async () => {
          await localParticipant.setCameraEnabled(true, { facingMode: newMode })
        }, 500)
      }
    } catch(e) { console.log(e) }
  }

  return (
    <div style={{position:'fixed',bottom:'90px',left:0,right:0,display:'flex',justifyContent:'center',gap:'16px',zIndex:100,padding:'0 20px'}}>
      <button onClick={toggleMic} style={{width:'56px',height:'56px',borderRadius:'50%',border:'none',cursor:'pointer',fontSize:'22px',background: micOn ? 'rgba(255,255,255,0.2)' : '#F43F5E',color:'#fff',backdropFilter:'blur(10px)'}}>
        {micOn ? '🎙️' : '🔇'}
      </button>
      <button onClick={onLeave} style={{width:'64px',height:'64px',borderRadius:'50%',border:'none',cursor:'pointer',fontSize:'24px',background:'#F43F5E',color:'#fff'}}>
        📵
      </button>
      <button onClick={toggleCam} style={{width:'56px',height:'56px',borderRadius:'50%',border:'none',cursor:'pointer',fontSize:'22px',background: camOn ? 'rgba(255,255,255,0.2)' : '#F43F5E',color:'#fff',backdropFilter:'blur(10px)'}}>
        {camOn ? '📹' : '🚫'}
      </button>
      <button onClick={switchCam} style={{width:'56px',height:'56px',borderRadius:'50%',border:'none',cursor:'pointer',fontSize:'22px',background:'rgba(255,255,255,0.2)',color:'#fff',backdropFilter:'blur(10px)'}}>
        🔄
      </button>
    </div>
  )
}

function VideoGrid() {
  const tracks = useTracks([Track.Source.Camera])
  return (
    <div style={{flex:1,display:'flex',flexWrap:'wrap',gap:'4px',padding:'4px'}}>
      {tracks.map(track => (
        <div key={track.participant.identity} style={{flex:1,minWidth:'45%',background:'#1a1a2e',borderRadius:'12px',overflow:'hidden',position:'relative',minHeight:'200px'}}>
          <VideoTrack trackRef={track} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          <div style={{position:'absolute',bottom:'8px',left:'8px',background:'rgba(0,0,0,0.5)',color:'#fff',fontSize:'11px',padding:'2px 8px',borderRadius:'99px'}}>
            {track.participant.identity}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AppelGroupe() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [token, setToken] = useState('')
  const [facingMode, setFacingMode] = useState<'user'|'environment'>('user')
  const [groupe, setGroupe] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/connexion'); return }

      const { data: g } = await supabase.from('groupes').select('*').eq('id', params.id).single()
      setGroupe(g)

      const username = user.email.split('@')[0]

      await supabase.from('messages_groupe').insert({
        groupe_id: String(params.id),
        user_id: user.id,
        contenu: '📞 ' + username + ' a lance un appel — Clique sur 📞 pour rejoindre'
      })

      const res = await fetch('/api/livekit?room=groupe-' + params.id + '&username=' + username)
      const data = await res.json()
      setToken(data.token)
      setLoading(false)
    }
    init()
  }, [])

  const handleLeave = () => router.back()

  if (loading) return (
    <main style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#1a1a2e'}}>
      <div style={{color:'#fff',fontSize:'16px'}}>Connexion en cours...</div>
    </main>
  )

  return (
    <main style={{height:'100vh',background:'#1a1a2e',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'12px 16px',background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',gap:'12px',flexShrink:0}}>
        <span style={{color:'#fff',fontWeight:'500',fontSize:'15px'}}>📞 {groupe?.nom}</span>
      </div>
      <LiveKitRoom video={true} audio={true} token={token} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} style={{flex:1,display:'flex',flexDirection:'column'}}>
        <VideoGrid />
        <RoomAudioRenderer />
        <Controls onLeave={handleLeave} />
      </LiveKitRoom>
    </main>
  )
}
