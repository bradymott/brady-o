// Build: concatenate src/*.js into self-contained HTML games.
// Outputs:
//   dist/index.html        - combined build, page body for the hosted (artifact) version
//   dist/brady-o.html      - combined standalone page (all games; used by the test tools)
//   dist/app/ + zip        - combined installable web app (legacy)
//   dist/site/             - THE THREE APPS, ready for GitHub Pages:
//       index.html                     launcher page linking the three apps
//       burning-man/                   "Brady Goes to Burning Man"  (3D adventure)
//       super-brady-o-world/           "Super Brady-O World"        (2D platformer)
//       art-cart/                      "Art Cart"                   (kart battle racer)
//     each with index.html, manifest.webmanifest, sw.js (offline), icons, font licences
// Set BRADY_DIST=/some/dir to build into a private folder (agents do this).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(root, 'dist');
const allFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.js')).sort();

/* ---------- the three apps ---------- */
// Each app bundles a subset of src/ modules. BRADY_APP tells the shared boot code which game to start.
const isBurns = f => /^4[0-2]_burns_/.test(f);
// Art Cart: the old WebGL1 kart (30–31) and the new 3D modules built on the Burns engine (43_cart_*, loaded after 40–42)
const isKart = f => /^3[01]_kart/.test(f) || /^43_cart_/.test(f);
const APPS = {
  burningman: {
    dir: 'burning-man', name: 'Brady Goes to Burning Man', short: 'Burning Man',
    desc: 'A 3D open-world adventure: Brady goes to Burning Man for the first time, becomes a burner, and rescues Chinka from the Man.',
    color: '#0d0716', saveKey: 'bgtbm-save-v1',
    // shared core + the 3D game; 2D-game modules the 3D game borrows are listed in BURNS_DEPS
    files: f => /^(00|01|02|99)_/.test(f) || isBurns(f) || BURNS_DEPS.includes(f)
  },
  world: {
    dir: 'super-brady-o-world', name: 'Super Brady-O World', short: 'Super Brady-O',
    desc: 'Super Brady-O travels the world: a 2D platformer across twelve countries.',
    color: '#0b1630', saveKey: 'super-brady-o-world-save-v1',
    // the world tour replaced the Black Rock City lands, their level designs, themes and city map
    files: f => !isBurns(f) && !isKart(f) && !['08c_designs.js', '20b_world_themes.js', '24_sloth.js', '26_worlddata.js', '27_brcmap.js', '27_brcmap_land.js'].includes(f)
  },
  kart: {
    dir: 'art-cart', name: 'Art Cart', short: 'Art Cart',
    desc: 'Battle-race wild art cars across the playa: every car has its own weapon.',
    color: '#1a0626', saveKey: 'art-cart-save-v1',
    // the shared core, the Burns 3D engine (renderer, meshes, rig, cast, props, world runtime; not its hub 'k' or
    // title app 'l'), the new 3D Art Cart modules (43_cart_*) and the 2D modules the shared boot code still needs
    files: f => /^(00|01|02|99)_/.test(f) || isKart(f) || KART_DEPS.includes(f) || (/^40_burns_/.test(f) && !/^40_burns_[kl]_/.test(f))
  }
};
// 2D-game modules the other apps still use (UI kit, title scene, portraits…). Trim as the apps separate.
const BURNS_DEPS = ['03_themes.js', '04_tiles.js', '05_brady.js', '22_cast.js'];   // only for the 2D Chinka portrait on photo collectibles (drawChinka); the rest of the app is engine-only
const KART_DEPS = ['04_tiles.js', '10_entities.js', '12_play.js', '06_sprites.js', '03_themes.js', '05_brady.js', '13_ui.js', '20_burn_themes.js', '21_burn_sprites.js', '22_cast.js', '25_story.js'];

function bundle(appId, files) {
  let code = `const BRADY_APP = ${JSON.stringify(appId)};\n` +
    files.map(f => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(srcDir, f), 'utf8')).join('\n');
  code = `(function(){\n${code}\n})();`;
  if (code.includes('</script')) throw new Error('source contains </script');
  return code;
}

const fontLink = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Bungee&family=Rubik:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">';
const embeddedCssPath = path.join(root, 'assets', 'fonts', 'embedded.css');
const fontEmbed = fs.existsSync(embeddedCssPath) ? `<style>\n${fs.readFileSync(embeddedCssPath, 'utf8')}\n</style>` : fontLink;
const style = (bg) => `<style>
/* a single dark stage; the canvas fills the screen and handles safe areas itself */
:root { color-scheme: dark; --stage: ${bg || '#07040e'}; --ink: #ffffff; }
html, body { height: 100%; margin: 0; background: var(--stage); color: var(--ink); overflow: hidden; overscroll-behavior: none; }
body { padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; -webkit-text-size-adjust: 100%; }
#game { position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; display: block; background: var(--stage); touch-action: none; outline: none; }
noscript p { position: fixed; inset: 0; display: grid; place-items: center; font: 16px system-ui, sans-serif; }
</style>`;
const bodyOf = (code, label) => `<canvas id="game" aria-label="${label}" tabindex="0"></canvas>
<noscript><p>This game needs JavaScript to run.</p></noscript>
<script>
${code}
</script>`;
const pageHtml = ({ title, appleTitle, desc, color, extra, code }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="description" content="${desc}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${appleTitle}">
<meta name="application-name" content="${appleTitle}">
<meta name="format-detection" content="telephone=no">
<meta name="theme-color" content="${color}">
${extra || ''}
${fontEmbed}
${style(color)}
</head>
<body>
${bodyOf(code, title)}
</body>
</html>
`;
const swReg = `<script>
// offline support: cache the game after the first visit (needs https, skipped elsewhere)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
</script>`;
const swSource = (prefix, version, shell) => `// service worker: makes the game load instantly and work offline
const CACHE = '${prefix}-${version}';
const SHELL = ${JSON.stringify(shell)};
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('${prefix}-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
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
const ICONS = ['icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
const manifestFor = (name, short, desc, color, icons) => ({
  name, short_name: short, description: desc,
  id: './', start_url: './', scope: './',
  display: 'fullscreen', display_override: ['fullscreen', 'standalone'], orientation: 'any',
  background_color: color, theme_color: color, categories: ['games', 'entertainment'],
  icons: [
    icons.includes('icon-192.png') && { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    icons.includes('icon-512.png') && { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    icons.includes('icon-maskable-512.png') && { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ].filter(Boolean)
});
const copyFontLicences = (dir) => {
  for (const f of ['OFL-bungee.txt', 'OFL-rubik.txt']) {
    const p = path.join(root, 'assets', 'fonts', f);
    if (fs.existsSync(p)) fs.copyFileSync(p, path.join(dir, 'FONT-LICENSE-' + f.replace('OFL-', '').replace('.txt', '').toUpperCase() + '.txt'));
  }
};

fs.mkdirSync(dist, { recursive: true });

/* ---------- combined build (all games; used by tests and agents) ---------- */
const allCode = bundle('all', allFiles);
const artifact = `<title>Brady-O</title>
<meta name="claude:viewport-fit-sides" content="cover">
${fontLink}
${style()}
${bodyOf(allCode, 'Brady-O game')}
`;
const iconB64Path = path.join(dist, 'icon.b64');
const iconData = fs.existsSync(iconB64Path) ? `data:image/png;base64,${fs.readFileSync(iconB64Path, 'utf8').trim()}` : '';
const combinedMeta = { title: 'Brady-O', appleTitle: 'Brady-O', desc: 'All the Brady games in one build.', color: '#07040e' };
fs.writeFileSync(path.join(dist, 'index.html'), artifact);
fs.writeFileSync(path.join(dist, 'brady-o.html'), pageHtml({ ...combinedMeta, code: allCode, extra: iconData ? `<link rel="apple-touch-icon" href="${iconData}">` : '' }));
{
  const appDir = path.join(dist, 'app');
  fs.mkdirSync(appDir, { recursive: true });
  const icons = ICONS.filter(f => fs.existsSync(path.join(dist, 'icons', f)));
  for (const f of icons) fs.copyFileSync(path.join(dist, 'icons', f), path.join(appDir, f));
  const html = pageHtml({ ...combinedMeta, code: allCode, extra: `<link rel="manifest" href="manifest.webmanifest">\n${icons.includes('icon-180.png') ? '<link rel="apple-touch-icon" sizes="180x180" href="icon-180.png">' : ''}\n${swReg}` });
  fs.writeFileSync(path.join(appDir, 'index.html'), html);
  fs.writeFileSync(path.join(appDir, 'manifest.webmanifest'), JSON.stringify(manifestFor('Brady-O', 'Brady-O', combinedMeta.desc, combinedMeta.color, icons), null, 2));
  const v = crypto.createHash('sha1').update(html).digest('hex').slice(0, 10);
  fs.writeFileSync(path.join(appDir, 'sw.js'), swSource('brady-o', v, ['./', './index.html', './manifest.webmanifest'].concat(icons.map(f => './' + f))));
  copyFontLicences(appDir);
  try { const z = path.join(dist, 'Brady-O-app.zip'); if (fs.existsSync(z)) fs.unlinkSync(z); execSync(`cd "${appDir}" && zip -q -X -r "${z}" .`); } catch (e) { /* zip optional */ }
}

/* ---------- the three separate apps ---------- */
const siteDir = path.join(dist, 'site');
fs.mkdirSync(siteDir, { recursive: true });
const report = [];
for (const [id, A] of Object.entries(APPS)) {
  const files = allFiles.filter(A.files);
  const code = bundle(id, files);
  const dir = path.join(siteDir, A.dir);
  fs.mkdirSync(dir, { recursive: true });
  // per-app icons from dist/icons/<id>/ (tools/make_icon.js); fall back to the shared ones
  const iconSrc = f => [path.join(dist, 'icons', id, f), path.join(dist, 'icons', f)].find(p => fs.existsSync(p));
  const icons = ICONS.filter(f => iconSrc(f));
  for (const f of icons) fs.copyFileSync(iconSrc(f), path.join(dir, f));
  const html = pageHtml({ title: A.name, appleTitle: A.short, desc: A.desc, color: A.color, code,
    extra: `<link rel="manifest" href="manifest.webmanifest">\n${icons.includes('icon-180.png') ? '<link rel="apple-touch-icon" sizes="180x180" href="icon-180.png">' : ''}\n${icons.includes('icon-192.png') ? '<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">' : ''}\n${swReg}` });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  fs.writeFileSync(path.join(dir, 'manifest.webmanifest'), JSON.stringify(manifestFor(A.name, A.short, A.desc, A.color, icons), null, 2));
  const v = crypto.createHash('sha1').update(html).digest('hex').slice(0, 10);
  fs.writeFileSync(path.join(dir, 'sw.js'), swSource('app-' + id, v, ['./', './index.html', './manifest.webmanifest'].concat(icons.map(f => './' + f))));
  copyFontLicences(dir);
  report.push(`${A.dir} ${files.length} modules ${(html.length / 1024).toFixed(0)}KB`);
}
// launcher page at the site root
const tile = (A, id) => `<a class="app" href="${A.dir}/"><img src="${A.dir}/icon-180.png" alt="" onerror="this.style.visibility='hidden'"><span><b>${A.name}</b><small>${A.desc}</small></span></a>`;
fs.writeFileSync(path.join(siteDir, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Brady's Games</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0d0716">
<style>
:root { color-scheme: dark; --bg: #0d0716; --card: #1c1030; --ink: #fff; --muted: #c9b8e8; --accent: #ff9a3a; }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; background: radial-gradient(120% 80% at 50% 0%, #3a1450 0%, var(--bg) 60%); color: var(--ink); font: 16px/1.4 system-ui, -apple-system, sans-serif; padding: max(24px, env(safe-area-inset-top)) 16px 32px; }
h1 { font-size: 26px; margin: 8px 0 4px; text-align: center; }
p.lede { text-align: center; color: var(--muted); margin: 0 0 20px; }
.apps { display: grid; gap: 14px; max-width: 560px; margin: 0 auto; }
.app { display: flex; gap: 14px; align-items: center; background: var(--card); border-radius: 20px; padding: 14px; color: inherit; text-decoration: none; border: 1px solid #ffffff1a; }
.app img { width: 72px; height: 72px; border-radius: 16px; flex: none; }
.app b { display: block; font-size: 18px; } .app small { display: block; color: var(--muted); margin-top: 2px; }
.how { max-width: 560px; margin: 22px auto 0; color: var(--muted); font-size: 14px; text-align: center; }
</style></head>
<body>
<h1>Brady's Games</h1>
<p class="lede">Three separate games. Open one, then add it to your Home Screen.</p>
<div class="apps">
${Object.entries(APPS).map(([id, A]) => tile(A, id)).join('\n')}
</div>
<p class="how">On iPhone: open a game in Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>. Each game installs as its own app.</p>
</body></html>
`);
try { const z = path.join(dist, 'Brady-Games-site.zip'); if (fs.existsSync(z)) fs.unlinkSync(z); execSync(`cd "${siteDir}" && zip -q -X -r "${z}" .`); } catch (e) { /* zip optional */ }

console.log('built', allFiles.length, 'modules,', (artifact.length / 1024).toFixed(0) + 'KB', '· site:', report.join(' · '));
