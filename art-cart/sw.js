// service worker: makes the game load instantly and work offline
const CACHE = 'app-kart-d98f4ab84b';
const SHELL = ["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./models/bass_valentine_lo.glb.gz","./models/bass_valentine.glb.gz","./models/brady.glb.gz","./models/calamari_inferno_lo.glb.gz","./models/calamari_inferno.glb.gz","./models/chinka.glb.gz","./models/dune_chomper_lo.glb.gz","./models/dune_chomper.glb.gz","./models/dusty_doubloon_lo.glb.gz","./models/dusty_doubloon.glb.gz","./models/frosted_fury_lo.glb.gz","./models/frosted_fury.glb.gz","./models/glitterfin_lo.glb.gz","./models/glitterfin.glb.gz","./models/jelly_jolt_lo.glb.gz","./models/jelly_jolt.glb.gz","./models/mannequin.glb.gz","./models/pyramid_scheme_lo.glb.gz","./models/pyramid_scheme.glb.gz","./models/quackzilla_lo.glb.gz","./models/quackzilla.glb.gz","./models/sir_scorchalot_lo.glb.gz","./models/sir_scorchalot.glb.gz","./models/turbo_escargot_lo.glb.gz","./models/turbo_escargot.glb.gz","./models/whale_of_a_time_lo.glb.gz","./models/whale_of_a_time.glb.gz","./models/index.json"];
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
