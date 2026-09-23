const CACHE = 'poker-tournament-v3';
const base = new URL(self.registration.scope).pathname;
const asset = path => `${base}${path}`;
const STATIC_ASSETS = ['manifest.webmanifest', 'icon.svg'];

async function precacheApp() {
  const cache = await caches.open(CACHE);
  const page = await fetch(base);
  const html = await page.clone().text();
  await Promise.all([cache.put(base, page.clone()), cache.put(asset('index.html'), page.clone())]);
  const files = [...html.matchAll(/(?:src|href)="([^"#?]+)"/g)].map(match => match[1]).filter(path => path.startsWith(base));
  await cache.addAll([...STATIC_ASSETS.map(asset), ...files]);
}
self.addEventListener('install', event => event.waitUntil(precacheApp().then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => { if (event.request.method !== 'GET') return; event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); return response; }).catch(() => caches.match(base)))); });
