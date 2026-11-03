// service worker: makes the game load instantly and work offline
const CACHE = 'app-kart-7504d2d0ae';
const SHELL = ["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./models/bass_valentine.glb","./models/bass_valentine_lo.glb","./models/calamari_inferno.glb","./models/calamari_inferno_lo.glb","./models/dune_chomper.glb","./models/dune_chomper_lo.glb","./models/dusty_doubloon.glb","./models/dusty_doubloon_lo.glb","./models/frosted_fury.glb","./models/frosted_fury_lo.glb","./models/glitterfin.glb","./models/glitterfin_lo.glb","./models/jelly_jolt.glb","./models/jelly_jolt_lo.glb","./models/pyramid_scheme.glb","./models/pyramid_scheme_lo.glb","./models/quackzilla.glb","./models/quackzilla_lo.glb","./models/sir_scorchalot.glb","./models/sir_scorchalot_lo.glb","./models/turbo_escargot.glb","./models/turbo_escargot_lo.glb","./models/whale_of_a_time.glb","./models/whale_of_a_time_lo.glb","./models/index.json"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('app-kart-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
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
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
