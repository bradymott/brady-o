// retires the old all-in-one app's service worker (the site is now a launcher plus three apps)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('brady-o-')).map(k => caches.delete(k)));
    await self.registration.unregister();
    const open = await self.clients.matchAll({ type: 'window' });
    for (const c of open) { try { c.navigate(c.url); } catch (err) { /* ignore */ } }
  })());
});
