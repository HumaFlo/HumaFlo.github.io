/* Dili Microlet PWA — service worker
   App-shell caching + offline fallback + versioned caches.
   The mobility pack itself is stored in IndexedDB after an explicit download;
   data/*.json responses are network-first with a cache fallback for update checks. */
'use strict';
const VERSION = 'v1.5.1';
const APP_CACHE_PREFIX = 'dili-app-';
const DATA_CACHE_PREFIX = 'dili-data-';
const APP_CACHE = `dili-app-${VERSION}`;
const DATA_CACHE = `dili-data-${VERSION}`;
const PRECACHE = [
  './', 'index.html', 'offline.html', 'manifest.webmanifest', 'favicon-64.png',
  'icons/icon-64.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/maskable-192.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png',
  'data/pack-manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(APP_CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) =>
          (k.startsWith(APP_CACHE_PREFIX) || k.startsWith(DATA_CACHE_PREFIX)) &&
          k !== APP_CACHE && k !== DATA_CACHE
        ).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // only same-origin requests use the app caches

  /* navigations: network first, cached shell fallback, then static offline page */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const cp = r.clone();
          caches.open(APP_CACHE).then((c) => c.put('index.html', cp));
          return r;
        })
        .catch(() => caches.match('index.html').then((r) => r || caches.match('offline.html')))
    );
    return;
  }

  /* data files: network first so update checks see new deployments; cache fallback */
  if (url.pathname.includes('/data/')) {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const cp = r.clone();
          caches.open(DATA_CACHE).then((c) => c.put(req, cp));
          return r;
        })
        .catch(() => caches.match(req).then(
          (r) => r || new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
        ))
    );
    return;
  }

  /* static assets: cache first */
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((r) => {
          if (r.ok) {
            const cp = r.clone();
            caches.open(APP_CACHE).then((c) => c.put(req, cp));
          }
          return r;
        }).catch(() => caches.match('offline.html'))
    )
  );
});
