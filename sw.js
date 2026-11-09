const CACHE_NAME = 'geodata-pwa-shell-v1794217989089';
const APP_SHELL_URLS = [
  './',
  './index.html',
  './app.html',
  './manifest.webmanifest',
  './maplibre-gl-worker.mjs',
  './icons/icon512.png',
  './icons/icon192.png',
  './icons/icon128.png',
  './icons/icon48.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_URLS).catch((err) => {
        console.warn('[PWA SW] Предкэширование частично пропущено:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const res = await fetch(req);
        if (res && res.status === 200 && res.type === 'basic') {
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        const cached = await cache.match(req);
        if (cached) return cached;
        throw new Error('Offline and not in cache');
      }
    })
  );
});
