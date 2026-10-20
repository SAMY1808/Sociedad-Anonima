/* Calculadora Electoral — service worker
   Estrategia: "stale-while-revalidate". Abre al instante desde la caché (sirve sin internet)
   y, si hay conexión, baja en segundo plano la versión nueva para el próximo arranque.
   Para forzar una actualización inmediata tras subir cambios: sube el número de CACHE_VERSION. */
const CACHE_VERSION = 1;
const CACHE = 'calc-electoral-v' + CACHE_VERSION;

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // cache:'reload' salta la caché HTTP del servidor (GitHub Pages guarda ~10 min) para bajar lo último
      .then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('calc-electoral-') && k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });

    const red = fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      })
      .catch(() => null);

    if (cached) {
      event.waitUntil(red);   // actualiza en segundo plano
      return cached;
    }
    const res = await red;
    if (res) return res;
    if (req.mode === 'navigate') {
      return (await cache.match('./index.html')) || (await cache.match('./'));
    }
    return new Response('Sin conexión', { status: 503, statusText: 'Offline' });
  })());
});
