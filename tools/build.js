// Build: concatenate src/*.js into a single self-contained HTML game.
// Outputs:
//   dist/index.html        - page body for the hosted (artifact) version
//   dist/brady-o.html      - fully standalone page (own <head>, fonts embedded)
//   dist/app/              - installable iPhone web app: host this folder anywhere (HTTPS)
//                            index.html, manifest.webmanifest, sw.js (offline), icons, font licences
//   dist/Brady-O-app.zip   - the same folder zipped
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const dist = path.join(root, 'dist');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js')).sort();
let code = files.map(f => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(srcDir, f), 'utf8')).join('\n');
code = `(function(){\n${code}\n})();`;
if (code.includes('</script')) throw new Error('source contains </script');

const fontLink = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Bungee&family=Rubik:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">';
const embeddedCssPath = path.join(root, 'assets', 'fonts', 'embedded.css');
const fontEmbed = fs.existsSync(embeddedCssPath) ? `<style>\n${fs.readFileSync(embeddedCssPath, 'utf8')}\n</style>` : fontLink;
const style = `<style>
/* Brady-O: a single dark stage; the canvas fills the screen and handles safe areas itself. */
:root { color-scheme: dark; --stage: #07040e; --ink: #ffffff; }
html, body { height: 100%; margin: 0; background: var(--stage); color: var(--ink); overflow: hidden; overscroll-behavior: none; }
body { padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; -webkit-text-size-adjust: 100%; }
#game { position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; display: block; background: var(--stage); touch-action: none; outline: none; }
noscript p { position: fixed; inset: 0; display: grid; place-items: center; font: 16px system-ui, sans-serif; }
</style>`;
const body = `<canvas id="game" aria-label="Brady-O game" tabindex="0"></canvas>
<noscript><p>Brady-O needs JavaScript to run.</p></noscript>
<script>
${code}
</script>`;

const artifact = `<title>Brady-O</title>
<meta name="claude:viewport-fit-sides" content="cover">
${fontLink}
${style}
${body}
`;
const iconB64Path = path.join(dist, 'icon.b64');
const iconData = fs.existsSync(iconB64Path) ? `data:image/png;base64,${fs.readFileSync(iconB64Path, 'utf8').trim()}` : '';
const head = (extra) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Brady-O</title>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="description" content="Brady's road trip to the Burn to find Chinka. Four games in one.">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Brady-O">
<meta name="application-name" content="Brady-O">
<meta name="format-detection" content="telephone=no">
<meta name="theme-color" content="#07040e">
${extra}
${fontEmbed}
${style}
</head>
<body>
${body}
</body>
</html>
`;
const standalone = head(iconData ? `<link rel="apple-touch-icon" href="${iconData}">` : '');

fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), artifact);
fs.writeFileSync(path.join(dist, 'brady-o.html'), standalone);

/* ---------- installable web app (PWA) ---------- */
const appDir = path.join(dist, 'app');
fs.mkdirSync(appDir, { recursive: true });
const icons = ['icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'].filter(f => fs.existsSync(path.join(dist, 'icons', f)));
for (const f of icons) fs.copyFileSync(path.join(dist, 'icons', f), path.join(appDir, f));
const swReg = `<script>
// offline support: cache the game after the first visit (needs https, skipped elsewhere)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
</script>`;
const appHtml = head(`<link rel="manifest" href="manifest.webmanifest">
${icons.includes('icon-180.png') ? '<link rel="apple-touch-icon" sizes="180x180" href="icon-180.png">' : (iconData ? `<link rel="apple-touch-icon" href="${iconData}">` : '')}
${icons.includes('icon-192.png') ? '<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">' : ''}
${swReg}`);
fs.writeFileSync(path.join(appDir, 'index.html'), appHtml);
const manifest = {
  name: 'Brady-O',
  short_name: 'Brady-O',
  description: "Brady's road trip to the Burn to find Chinka. Four games in one.",
  id: './',
  start_url: './',
  scope: './',
  display: 'fullscreen',
  display_override: ['fullscreen', 'standalone'],
  orientation: 'any',
  background_color: '#07040e',
  theme_color: '#07040e',
  categories: ['games', 'entertainment'],
  icons: [
    icons.includes('icon-192.png') && { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    icons.includes('icon-512.png') && { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    icons.includes('icon-maskable-512.png') && { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ].filter(Boolean)
};
fs.writeFileSync(path.join(appDir, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
const version = crypto.createHash('sha1').update(appHtml).digest('hex').slice(0, 10);
const shell = ['./', './index.html', './manifest.webmanifest'].concat(icons.map(f => './' + f));
const sw = `// Brady-O service worker: makes the game load instantly and work offline.
const CACHE = 'brady-o-${version}';
const SHELL = ${JSON.stringify(shell)};
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('brady-o-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
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
`;
fs.writeFileSync(path.join(appDir, 'sw.js'), sw);
for (const f of ['OFL-bungee.txt', 'OFL-rubik.txt']) {
  const p = path.join(root, 'assets', 'fonts', f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(appDir, 'FONT-LICENSE-' + f.replace('OFL-', '').replace('.txt', '').toUpperCase() + '.txt'));
}
fs.writeFileSync(path.join(appDir, 'README.txt'), `BRADY-O — installable iPhone app
=================================
Put every file in this folder on any HTTPS web host (GitHub Pages, Netlify,
Cloudflare Pages...). Then on your iPhone:

  1. Open the web address in Safari.
  2. Tap Share (the square with the arrow), then "Add to Home Screen".
  3. Make sure "Open as Web App" is on, then tap Add.

Brady-O then launches from its own icon, full screen with no browser bars,
turns with your phone (portrait or landscape) and keeps working offline.

Files: index.html (the whole game), manifest.webmanifest (app settings),
sw.js (offline cache), icon-*.png (home-screen icons), FONT-LICENSE-*.txt
(Bungee and Rubik fonts, SIL Open Font License 1.1).
`);
try {
  const zipPath = path.join(dist, 'Brady-O-app.zip');
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  execSync(`cd "${appDir}" && zip -q -X -r "${zipPath}" .`);
} catch (e) { console.warn('zip skipped:', e.message); }
console.log('built', files.length, 'modules,', (artifact.length / 1024).toFixed(0) + 'KB', '· app', (appHtml.length / 1024).toFixed(0) + 'KB', '· icons', icons.length);
