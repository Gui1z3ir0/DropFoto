/* ==========================================================================
   PICDROP - MULTIPLATFORM SERVICE WORKER (PWA)
   Enables offline capability, asset caching and standalone app behavior
   ========================================================================== */

const CACHE_NAME = 'picdrop-saas-v2.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/css/style.css',
  '/css/dashboard.css',
  '/css/responsive.css',
  '/js/notifications.js',
  '/js/plans.js',
  '/js/security.js',
  '/js/domains.js',
  '/js/referral.js',
  '/js/galleries.js',
  '/js/auth.js',
  '/js/app.js',
  '/assets/icons/icon.svg',
  '/assets/images/family_sunset.jpg',
  '/assets/images/wedding_hands.jpg',
  '/assets/images/maria_clark.jpg',
  '/assets/images/editorial_cover.jpg',
  '/assets/images/maternity_golden_hour.jpg',
  '/assets/images/architecture_interior.jpg',
  '/assets/images/portfolio_camera.jpg'
];

// Install Event: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Some assets failed to cache during install:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate Strategy
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  // Ignore non-http requests (e.g. chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache valid responses
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});
