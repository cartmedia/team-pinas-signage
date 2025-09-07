// Service Worker for Team Pinas Signage
// Implements aggressive caching for performance

const CACHE_NAME = 'team-pinas-v1';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for API calls

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/src/styles/MenuSignage.css',
  '/assets/images/team-pinas-logo.svg',
  '/assets/images/pinas_kroon.svg',
  '/src/scripts/display/MenuSignage.js',
  '/src/scripts/shared/cms-connector.js',
  '/config/cms-config.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API calls - Cache with TTL
  if (url.pathname.includes('/.netlify/functions/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
          const cachedTime = cachedResponse.headers.get('sw-cached-time');
          if (cachedTime && (Date.now() - parseInt(cachedTime)) < CACHE_DURATION) {
            console.log('Service Worker: Serving API from cache:', url.pathname);
            return cachedResponse;
          }
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            // Clone and add timestamp header
            const responseClone = networkResponse.clone();
            const responseWithTimestamp = new Response(responseClone.body, {
              status: responseClone.status,
              statusText: responseClone.statusText,
              headers: {
                ...Object.fromEntries(responseClone.headers.entries()),
                'sw-cached-time': Date.now().toString()
              }
            });
            
            cache.put(request, responseWithTimestamp);
            console.log('Service Worker: Cached API response:', url.pathname);
          }
          return networkResponse;
        } catch (error) {
          console.log('Service Worker: Network failed, serving stale cache:', url.pathname);
          return cachedResponse || new Response('Service Unavailable', { status: 503 });
        }
      })
    );
    return;
  }

  // Static assets - Cache first, fallback to network
  if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('Service Worker: Serving static asset from cache:', url.pathname);
          return cachedResponse;
        }
        
        return fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // All other requests - Network first, cache fallback
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(
      // Implement background sync logic here
      Promise.resolve()
    );
  }
});