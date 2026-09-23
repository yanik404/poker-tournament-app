const CACHE = 'poker-tournament-v5-design';
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
self.addEventListener('fetch', event => { if (event.request.method !== 'GET') return; event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request).then(hit => hit || fetch(event.request).then(response => { if (response.ok) cache.put(event.request, response.clone()); return response; }).catch(() => cache.match(base))))); });
