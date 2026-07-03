"use client"
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PushNotifSetup() {
  useEffect(() => {
    async function setup() {
      try {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        
        const { getToken } = await import('firebase/messaging')
        const { messaging } = await import('@/lib/firebase')
        if (!messaging) return

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: reg
        })

        if (token) {
          await supabase.from('push_tokens').upsert({
            user_id: user.id,
            token,
            updated_at: new Date().toISOString()
          }, { onConflict: 'token' })
        }
      } catch(e) {
        console.error('Push setup error:', e)
      }
    }
    setup()
  }, [])

  return null
}
