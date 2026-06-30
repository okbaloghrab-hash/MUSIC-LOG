const CACHE_NAME = 'music-log-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js',
  'https://img.icons8.com/color/192/audio-wave.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Force cache preloading of essential assets and scripts
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('Some non-critical pre-cache assets failed to load: ', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  // Exclude API sync routes from being cached
  if (e.request.url.includes('/api/')) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response immediately for offline instant boot, and fetch update in the background
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse);
            });
          }
        }).catch(() => { /* ignore background network update failures when offline */ });
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        // Cache both standard responses and cross-origin (opaque status 0) resources like CDN fonts and scripts
        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.status !== 0)) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
