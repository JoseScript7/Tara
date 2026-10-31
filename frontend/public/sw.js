// Tara PWA Service Worker (v1.0.0)
// Rule 43: No Offline Money Movement - financial commits are never queued offline.
// Rule 44: Stale and Unreachable Data as Unknown - offline reads are flagged.

const CACHE_NAME = 'tara-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/mobile',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache or queue money-movement POSTs offline (Rule 43)
  if (event.request.method !== 'GET') {
    return;
  }

  // Network-first strategy for live API routes
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return structured offline fallback indicating data freshness is unknown
        return new Response(
          JSON.stringify({
            status: 'OFFLINE_STALE',
            error: 'Network offline. Under Rule 44, data freshness is unknown.',
            is_offline: true
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Cache-first strategy for static assets and shell
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
