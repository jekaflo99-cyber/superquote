const CACHE_NAME = 'superquote-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
]

// Instalar o service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
  self.skipWaiting()
})

// Ativar o service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Estratégia: Network First, com fallback para Cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Não cachear requisições que não são sucesso
        if (!response || response.status !== 200 || response.type === 'error') {
          return response
        }

        // Clone a resposta
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
      .catch(() => {
        // Se a rede falhar, tenta o cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response
          }
          // Aqui você pode retornar uma página offline customizada se quiser
          return new Response('Você está offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          })
        })
      })
  )
})
