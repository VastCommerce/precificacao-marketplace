const CACHE_NAME = 'precificacao-v2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})