// Service Worker for PWA
// Cache version is updated on each build to force cache invalidation
const CACHE_VERSION = 'v' + Date.now().toString(36);
const CACHE_NAME = `family-command-center-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  // Force activation of new service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Delete old caches
        return caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames
              .filter((name) => name.startsWith('family-command-center-') && name !== CACHE_NAME)
              .map((name) => caches.delete(name))
          ).then(() => cache.addAll(urlsToCache));
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  // Take control of all pages immediately
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('family-command-center-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first strategy for HTML to ensure fresh content
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
  } else {
    // Stale-while-revalidate for assets
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow('/')
  )
})

// Listen for SKIP_WAITING message from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received SKIP_WAITING command, activating immediately');
    self.skipWaiting();
  }
})
