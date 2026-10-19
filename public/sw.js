// Service worker minimal : il sert seulement à afficher les rappels du calendrier
// comme des notifications du téléphone (obligatoire sur iPhone) et à rouvrir
// le calendrier quand on touche la notification.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil((async () => {
    const fenetres = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const ouverte = fenetres.find(f => 'focus' in f)
    if (ouverte) { await ouverte.focus(); return ouverte.navigate?.('/semaine') }
    return self.clients.openWindow('/semaine')
  })())
})
