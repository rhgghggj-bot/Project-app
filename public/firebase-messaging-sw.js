importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyDpsMT1HmA0duV5HGoHvpyWu7xJHHO3Eo4",
authDomain: "project-app-a1425.firebaseapp.com",
  projectId: "project-app-a1425",
  storageBucket: "project-app-a1425.firebasestorage.app",
  messagingSenderId: "42067270987",
  appId: "1:42067270987:web:50e68bfbee8eea4b20dcce"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png'
  })
})
