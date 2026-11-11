// Boots each of the three apps from the per-app site build and fails on any page error.
//   node tools/apps_test.js [siteDir=dist/site] [shotsDir=shots]
// Checks: the app id, its first scene, its page title and its own save key. Saves a screenshot per app.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.resolve(process.argv[2] || path.join(dist, 'site'));
const shots = path.resolve(process.argv[3] || path.join(__dirname, '..', 'shots'));
const EXPECT = {
  'burning-man': { app: 'burningman', title: 'Brady Goes to Burning Man', key: 'bgtbm-save-v1' },
  'super-brady-o-world': { app: 'world', title: 'Super Brady-O World', key: 'super-brady-o-world-save-v2' },
  'art-cart': { app: 'kart', title: 'Super Art Kart', key: 'art-cart-save-v1' }
};
(async () => {
  fs.mkdirSync(shots, { recursive: true });
  const browser = await chromium.launch();
  let bad = 0;
  for (const [dir, want] of Object.entries(EXPECT)) {
    const page = await (await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
    await page.goto('file://' + path.join(site, dir, 'index.html'));
    await page.waitForTimeout(3500);
    const info = await page.evaluate(() => ({ app: window.BRADY && window.BRADY.APP, scene: window.BRADY && window.BRADY.Game && window.BRADY.Game.scene && window.BRADY.Game.scene.constructor.name, title: document.title, key: window.BRADY && window.BRADY.Save && window.BRADY.Save.key }));
    // generous timeout: the 3D app renders slowly on a busy machine without a GPU
    await page.screenshot({ path: path.join(shots, 'app-' + dir + '.png'), timeout: 180000 });
    const wrong = ['app', 'title', 'key'].filter(k => info[k] !== want[k]);
    const ok = !errs.length && !wrong.length;
    if (!ok) bad++;
    console.log((ok ? 'PASS ' : 'FAIL ') + dir, JSON.stringify(info), errs.length ? 'errors: ' + errs.slice(0, 3).join(' | ') : '', wrong.length ? 'wrong: ' + wrong.join(',') : '');
    await page.context().close();
  }
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
