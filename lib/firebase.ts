import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "project-app-a1425.firebaseapp.com",
  projectId: "project-app-a1425",
  storageBucket: "project-app-a1425.firebasestorage.app",
  messagingSenderId: "42067270987",
  appId: "1:42067270987:web:50e68bfbee8eea4b20dcce"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null
export { getToken, onMessage }
