// Cache-on-fetch service worker: the first real load (with network) caches
// every GET request it sees. After that, cached responses are served first,
// with the network only used to fill cache misses — giving the kiosk full
// offline playability after one successful load, with no precache manifest
// to keep in sync with hashed build filenames.
const CACHE_NAME = 'real-or-ai-wall-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;

      try {
        const response = await fetch(event.request);
        if (response.ok) {
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (err) {
        if (cached) return cached;
        throw err;
      }
    })
  );
});
