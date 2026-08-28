const CACHE_PREFIX = 'okinawa-road-book-';
const CACHE = 'okinawa-road-book-v3';
const CORE = [
  './', './index.html', './styles.css', './app.mjs', './manifest.json', './icons/icon.svg',
  './content/trip.json', './src/trip-domain.mjs', './src/render.mjs', './src/storage.mjs',
  './output/pdf/okinawa-family-trip-A-balanced.pdf',
  './output/pdf/okinawa-family-trip-B-active.pdf',
  './output/pdf/okinawa-family-trip-C-relaxed.pdf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === self.location.origin) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : undefined)));
});
