const CACHE_VERSION = 'v1';
const CACHE_NAME = `ovenx-app-${CACHE_VERSION}`;

// All files that make your app work offline
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  // Add your CSS/JS files here if separate
];

// Install: Cache the app shell permanently
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Serve from cache first (offline-first strategy)
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached; // Return cached version immediately
      }
      
      return fetch(event.request)
        .then((response) => {
          // Cache new requests for future offline use
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // Offline fallback
          return new Response('Offline - App cached', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
    })
  );
});
