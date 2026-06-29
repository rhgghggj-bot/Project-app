'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LiveKitRoom,
  useLocalParticipant,
  RoomAudioRenderer,
  useTracks,
  VideoTrack,
  useParticipants,
} from '@livekit/components-react'
import { Track } from 'livekit-client'

function VideoGrid() {
  const participants = useParticipants()
  const tracks = useTracks([Track.Source.Camera])

  return (
    <div style={{flex:1,display:'grid',gridTemplateColumns: participants.length > 1 ? '1fr 1fr' : '1fr',gap:'3px',padding:'3px',background:'rgba(255,255,255,0.1)',minHeight:0}}>
      {participants.map((participant, i) => {
        const track = tracks.find(t => t.participant.identity === participant.identity)
        const isBig = i === 0
        return (
          <div key={participant.identity}
            style={{
              gridColumn: isBig && participants.length > 1 ? '1/3' : 'auto',
              height: participants.length === 1 ? '100%' : isBig ? '220px' : '140px',
              background:'rgba(255,255,255,0.15)',
              borderRadius:'10px',
              border:'1px solid rgba(255,255,255,0.25)',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              position:'relative',
              overflow:'hidden'
            }}>
            {track && participant.isCameraEnabled ? (
              <VideoTrack trackRef={track} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            ) : (
              <div style={{width: isBig ? '75px' : '52px',height: isBig ? '75px' : '52px',borderRadius:'50%',background:'linear-gradient(135deg,#fff,#D4A843)',border:'3px solid rgba(255,255,255,0.6)',display:'flex',alignItems:'center',justifyContent:'center',color:'#1a3a6e',fontSize: isBig ? '28px' : '20px',fontWeight:'500'}}>
                {(participant.identity || "?")[0].toUpperCase()}
              </div>
            )}
            <div style={{position:'absolute',bottom:'8px',left:'8px',background:'rgba(255,255,255,0.25)',border:'0.5px solid rgba(255,255,255,0.4)',color:'#fff',fontSize:'10px',padding:'2px 8px',borderRadius:'99px',display:'flex',alignItems:'center',gap:'4px'}}>
              <div style={{width:'5px',height:'5px',borderRadius:'50%',background: participant.isMicrophoneEnabled ? '#D4A843' : '#F43F5E'}}></div>
              {participant.identity || "Participant"} {!participant.isCameraEnabled ? '· cam off' : ''}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Controls({ onLeave }: { onLeave: () => void }) {
  const { localParticipant } = useLocalParticipant()
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)

  const toggleMic = () => { localParticipant.setMicrophoneEnabled(!micOn); setMicOn(!micOn) }
  const toggleCam = () => { localParticipant.setCameraEnabled(!camOn); setCamOn(!camOn) }

  const btnStyle = (active: boolean, gold?: boolean) => ({
    width:'58px',height:'58px',borderRadius:'50%',
    border: gold ? '1.5px solid rgba(212,168,67,0.6)' : active ? '1.5px solid rgba(255,255,255,0.4)' : '1.5px solid rgba(244,63,94,0.6)',
    background: gold ? 'rgba(212,168,67,0.2)' : active ? 'rgba(255,255,255,0.2)' : 'rgba(244,63,94,0.3)',
    cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'
  })

  return (
    <div style={{padding:'18px 24px 24px',background:'rgba(255,255,255,0.15)',borderTop:'1px solid rgba(255,255,255,0.25)',display:'flex',justifyContent:'center',alignItems:'center',gap:'20px'}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px'}}>
        <button onClick={toggleMic} style={btnStyle(micOn) as any}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            {micOn ? <><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></> : <><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>}
          </svg>
        </button>
        <span style={{color:'rgba(255,255,255,0.8)',fontSize:'10px'}}>{micOn ? 'Micro' : 'Muet'}</span>
      </div>

      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px'}}>
        <button onClick={onLeave} style={{width:'70px',height:'70px',borderRadius:'50%',border:'none',background:'linear-gradient(135deg,#F43F5E,#e11d48)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 30px rgba(244,63,94,0.6)'}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M23.36 14.6c-.16-1.52-1.5-2.6-3.04-2.6h-3.27c-1.34 0-2.42.9-2.72 2.1-.1.4-.42.7-.84.7h-2.98c-.42 0-.74-.3-.84-.7C9.37 12.9 8.29 12 6.95 12H3.68C2.14 12 .8 13.08.64 14.6.22 18.4 2.7 22 6.5 22h11c3.8 0 6.28-3.6 5.86-7.4z"/></svg>
        </button>
        <span style={{color:'rgba(255,255,255,0.8)',fontSize:'10px'}}>Raccrocher</span>
      </div>

      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px'}}>
        <button onClick={toggleCam} style={btnStyle(camOn) as any}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            {camOn ? <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></> : <><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h3a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/></>}
          </svg>
        </button>
        <span style={{color:'rgba(255,255,255,0.8)',fontSize:'10px'}}>{camOn ? 'Caméra' : 'Cam off'}</span>
      </div>

      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'6px'}}>
        <button style={btnStyle(true, true) as any}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </button>
        <span style={{color:'#D4A843',fontSize:'10px'}}>Retourner</span>
      </div>
    </div>
  )
}

export default function AppelGroupe() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [token, setToken] = useState('')
  const [groupe, setGroupe] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const navMobile = document.querySelector('nav.md\\:hidden') as HTMLElement
    const navDesktop = document.querySelector('nav.hidden') as HTMLElement
    if (navMobile) navMobile.style.display = 'none'
    if (navDesktop) navDesktop.style.display = 'none'
    return () => {
      if (navMobile) navMobile.style.display = ''
      if (navDesktop) navDesktop.style.display = ''
    }
    
  }, [])

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

  if (loading) return (
    <main style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'linear-gradient(135deg,#1a3a6e,#2B7FFF,#87CEEB)'}}>
      <div style={{color:'#fff',fontSize:'16px',fontWeight:'500'}}>Connexion en cours...</div>
    </main>
  )

  return (
    <main style={{height:'100vh',background:'linear-gradient(135deg,#1a3a6e,#2B7FFF,#87CEEB)',display:'flex',flexDirection:'column'}}>
      <div style={{padding:'14px 16px',background:'rgba(255,255,255,0.15)',borderBottom:'0.5px solid rgba(255,255,255,0.3)',display:'flex',alignItems:'center',gap:'10px',flexShrink:0}}>
        <span style={{color:'#fff',fontWeight:'500',fontSize:'15px'}}>📞 {groupe?.nom}</span>
      </div>
      <LiveKitRoom video={true} audio={true} token={token} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} style={{flex:1,display:'flex',flexDirection:'column'}}>
        <VideoGrid />
        <RoomAudioRenderer />
        <Controls onLeave={() => router.back()} />
      </LiveKitRoom>
    </main>
  )
}
