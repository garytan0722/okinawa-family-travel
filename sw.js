const CACHE_PREFIX = 'okinawa-road-book-';
const CACHE = 'okinawa-road-book-v9';
const CORE = [
  './index.html?v=9', './styles.css?v=9', './app.mjs?v=9', './manifest.json?v=9', './icons/icon.svg?v=9', './icons/dog-paw-stamp.svg?v=9',
  './content/trip.json?v=9', './src/trip-domain.mjs?v=9', './src/render.mjs?v=9', './src/storage.mjs?v=9', './src/pwa-update.mjs?v=9',
  './output/pdf/okinawa-family-trip-A-balanced.pdf?v=9',
  './output/pdf/okinawa-family-trip-B-active.pdf?v=9',
  './output/pdf/okinawa-family-trip-C-relaxed.pdf?v=9',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const fromNetwork = () => fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  });
  if (event.request.mode === 'navigate') {
    event.respondWith(fromNetwork().catch(() => caches.match('./index.html?v=9')));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fromNetwork()));
});
