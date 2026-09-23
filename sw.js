const CACHE_PREFIX = 'okinawa-road-book-';
const CACHE = 'okinawa-road-book-v29';
const CORE = [
  './index.html?v=29', './recovery.html?v=29', './styles.css?v=29', './app.mjs?v=29', './manifest.json?v=29', './icons/icon.svg?v=29', './icons/dog-paw-stamp.svg?v=29',
  './content/trip.json?v=29', './src/trip-domain.mjs?v=29', './src/render.mjs?v=29', './src/storage.mjs?v=29', './src/private-bookings.mjs?v=29', './src/rain-state.mjs?v=29', './src/pwa-update.mjs?v=29', './src/recovery.mjs?v=29', './src/recovery-page.mjs?v=29',
  './output/pdf/okinawa-family-trip-A-balanced.pdf?v=29',
  './output/pdf/okinawa-family-trip-B-active.pdf?v=29',
  './output/pdf/okinawa-family-trip-C-relaxed.pdf?v=29',
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
    event.respondWith(fromNetwork().catch(() => caches.match('./index.html?v=29')));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fromNetwork()));
});
