const CACHE_PREFIX = 'okinawa-road-book-';
const CACHE = 'okinawa-road-book-v23';
const CORE = [
  './index.html?v=23', './recovery.html?v=23', './styles.css?v=23', './app.mjs?v=23', './manifest.json?v=23', './icons/icon.svg?v=23', './icons/dog-paw-stamp.svg?v=23',
  './content/trip.json?v=23', './src/trip-domain.mjs?v=23', './src/render.mjs?v=23', './src/storage.mjs?v=23', './src/rain-state.mjs?v=23', './src/pwa-update.mjs?v=23', './src/recovery.mjs?v=23', './src/recovery-page.mjs?v=23',
  './output/pdf/okinawa-family-trip-A-balanced.pdf?v=23',
  './output/pdf/okinawa-family-trip-B-active.pdf?v=23',
  './output/pdf/okinawa-family-trip-C-relaxed.pdf?v=23',
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
    event.respondWith(fromNetwork().catch(() => caches.match('./index.html?v=23')));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fromNetwork()));
});
