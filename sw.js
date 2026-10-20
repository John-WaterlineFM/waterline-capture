// Keeps the phone page itself on the phone, so it opens with no signal (Work 015 P2; DEC-0287 rule 3).
// Network first: a fresh page whenever there is signal, the kept copy when there is none. Only this
// site's own files are kept; the relay (Google) and captures are never cached here.
const KEEP = 'waterline-phone-2';
const FILES = ['./', 'index.html', 'shapes.js', 'manifest.webmanifest', 'push/icon-192.png', 'push/icon-512.png', 'waterline-logo.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(KEEP).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== KEEP).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(KEEP).then(k => k.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
