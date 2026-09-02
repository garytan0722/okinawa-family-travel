const CACHE_PREFIX = 'okinawa-road-book-';
const CACHE = 'okinawa-road-book-v21';
const CORE = [
  './index.html?v=21', './recovery.html?v=21', './styles.css?v=21', './app.mjs?v=21', './manifest.json?v=21', './icons/icon.svg?v=21', './icons/dog-paw-stamp.svg?v=21',
  './content/trip.json?v=21', './src/trip-domain.mjs?v=21', './src/render.mjs?v=21', './src/storage.mjs?v=21', './src/pwa-update.mjs?v=21', './src/recovery.mjs?v=21', './src/recovery-page.mjs?v=21',
  './output/pdf/okinawa-family-trip-A-balanced.pdf?v=21',
  './output/pdf/okinawa-family-trip-B-active.pdf?v=21',
  './output/pdf/okinawa-family-trip-C-relaxed.pdf?v=21',
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
    event.respondWith(fromNetwork().catch(() => caches.match('./index.html?v=21')));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fromNetwork()));
});
