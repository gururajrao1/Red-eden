/* RED EDEN service worker: the app shell works offline after one visit.
   Bump CACHE when shipping new shell files. */
const CACHE = 'reden-v1';
const SHELL = [
  'sandbox.html', 'index.html', 'lab.html', 'library.html', 'story.html',
  'style.css', 'simsandbox.js', 'sandbox.js', 'papers.js', 'chapters.js',
  'lab.js', 'sim.js',
  'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png',
];
self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', ev => {
  if (ev.request.method !== 'GET' || new URL(ev.request.url).origin !== location.origin) return;
  ev.respondWith(caches.match(ev.request).then(hit => hit || fetch(ev.request)));
});
