// Service worker de Nexia :
//  1. affiche les rappels du calendrier comme notifications (obligatoire sur iPhone) ;
//  2. garde l'appli sur l'appareil pour l'ouvrir sans réseau (espace étudiant,
//     carnet, livres déjà ouverts). Les données (Supabase) ne passent pas par ici :
//     elles sont gardées par l'appli elle-même (lib/horsLigne.ts).
const CACHE = 'nexia-v1'
const DEMARRAGE = ['/etudes', '/manifest.json', '/icon-192.png']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(DEMARRAGE)).catch(() => {}).then(() => self.skipWaiting()))
})
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const cle of await caches.keys()) if (cle !== CACHE) await caches.delete(cle)
  await self.clients.claim()
})()))

// Fichiers qui ne changent pas (nom unique à chaque version) : le cache d'abord
const FIXE = /^\/(_next\/static\/|.*\.(?:png|svg|jpg|jpeg|webp|ico|woff2?)$)/
// Livres, programmes : le cache d'abord, puis mise à jour en arrière-plan
const CONTENU = /^\/(bibliotheque|programmes|pdfjs)\//

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  if (FIXE.test(url.pathname) || CONTENU.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE)
      const deja = await cache.match(req)
      const frais = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r }).catch(() => null)
      if (deja) { if (CONTENU.test(url.pathname)) e.waitUntil(frais); return deja }
      return (await frais) || new Response('', { status: 504 })
    })())
    return
  }

  // Pages (et données de navigation de Next) : le réseau d'abord, sinon la dernière copie
  e.respondWith((async () => {
    const cache = await caches.open(CACHE)
    try {
      const r = await fetch(req)
      if (r.ok) cache.put(req, r.clone())
      return r
    } catch {
      return (await cache.match(req)) || (req.mode === 'navigate' && await cache.match('/etudes')) || new Response('Hors connexion', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }
  })())
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil((async () => {
    const fenetres = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const ouverte = fenetres.find(f => 'focus' in f)
    if (ouverte) { await ouverte.focus(); return ouverte.navigate?.('/semaine') }
    return self.clients.openWindow('/semaine')
  })())
})
