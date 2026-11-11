// service worker: makes the game load instantly and work offline
const CACHE = 'app-burningman-ad0aac6de8';
const SHELL = ["./","./index.html","./manifest.webmanifest","./models/brady.glb.gz","./models/bus.glb.gz","./models/chinka.glb.gz","./models/dome.glb.gz","./models/mannequin.glb.gz","./models/pbr_crate.glb.gz","./models/potty.glb.gz","./models/rv.glb.gz","./models/shade.glb.gz","./models/tipi.glb.gz","./models/index.json"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('app-burningman-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // newest version when online, cached copy when offline
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put('./index.html', copy));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  if (req.url.includes('/sprites/')) {
    // sprite atlases: cached the first time a level asks for them (they are big, and most are never needed at once)
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
