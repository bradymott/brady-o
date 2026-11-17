// Renders the home-screen icons with the game's own art.
//   dist/icons/<app>/icon-180.png, icon-192.png, icon-512.png, icon-maskable-512.png  (one set per app)
//   dist/icons/icon-*.png + dist/icon.png/.b64 (the combined build; same art as Burning Man)
// Run after a build (it renders from dist/brady-o.html), then build again so the apps pick the icons up.
//   node tools/make_icon.js [app ...]   only those apps (burningman, world, kart); default: all three
// Super Brady-O World draws its icon with window.__sbwIcon (src/28_tour_gt_title.js: Brady's grinning face on a
// globe and a sunburst) and also gets a 32 px favicon. The committed copies live in dist/icons/<app>/: when
// rendering into a private BRADY_DIST, copy the app's folder back into the repo's dist/icons/.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 600, height: 600 }, deviceScaleFactor: 1 })).newPage();
  await page.goto('file://' + path.join(dist, 'brady-o.html'));
  await page.waitForTimeout(1800);
  const sizes = [['icon-180.png', 180, false], ['icon-192.png', 192, false], ['icon-512.png', 512, false], ['icon-maskable-512.png', 512, true]];
  const apps = { burningman: '__iconScene', world: '__iconWorld', kart: '__iconKart' };
  const only = process.argv.slice(2);
  if (await page.evaluate(() => typeof window.__sbwIcon === 'function')) apps.world = '__sbwIcon';
  for (const [app, fn] of Object.entries(apps)) {
    if (only.length && !only.includes(app)) continue;
    const out = path.join(dist, 'icons', app);
    fs.mkdirSync(out, { recursive: true });
    for (const [name, N, mask] of sizes.concat(app === 'world' ? [['icon-32.png', 32, false]] : [])) {
      const b64 = await page.evaluate(([fn, N, mask]) => {
        const c = document.createElement('canvas'); c.width = N; c.height = N;
        window[fn](c.getContext('2d'), N, mask);
        return c.toDataURL('image/png').split(',')[1];
      }, [fn, N, mask]);
      fs.writeFileSync(path.join(out, name), Buffer.from(b64, 'base64'));
      if (app === 'burningman') {
        fs.writeFileSync(path.join(dist, 'icons', name), Buffer.from(b64, 'base64'));
        if (N === 180) { fs.writeFileSync(path.join(dist, 'icon.b64'), b64); fs.writeFileSync(path.join(dist, 'icon.png'), Buffer.from(b64, 'base64')); }
      }
    }
    console.log('icons:', app);
  }
  await browser.close();
})();
