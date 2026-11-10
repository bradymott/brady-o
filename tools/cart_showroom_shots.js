// Art Cart showroom screenshots: the car-select stage in landscape and portrait (iPhone-like sizes, DPR 3) for a set of
// cars, plus the driver-select screen, on a chosen quality tier. Prints draw calls and triangles per shot.
//   BRADY_DIST=… node tools/cart_showroom_shots.js <outDir> [tier=medium] [cars=heart,whale,shark,fish] [sizes=844x390,390x844]
// Also checks that all 12 cars fit their frame at every turntable angle (KartMenuScene.fitCheck).
// Build first (node tools/build.js). Fails on any page error or a car that leaves the screen.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
if (!process.argv[2]) { console.error('usage: node tools/cart_showroom_shots.js <outDir> [tier] [cars] [sizes]'); process.exit(2); }
const out = path.resolve(process.argv[2]);
const tier = process.argv[3] || 'medium';
const cars = (process.argv[4] || 'heart,whale,shark,fish').split(',');
const sizes = (process.argv[5] || '844x390,390x844').split(',').map(s => s.split('x').map(Number));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.gz': 'application/gzip' };
function serve(root) {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' }));
  });
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site);
  const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const errs = [], rows = [], fits = [];
  for (const [w, h] of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { window.__cartFixedQ = 1; try { localStorage.clear(); } catch (e) { /* ignore */ } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
    await page.goto(url + 'art-cart/');
    await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready, null, { timeout: 120000 });
    await page.waitForFunction(() => !window.BRADY_BURNS.BurnsSkinActor || window.BRADY_BURNS.BurnsSkinActor.ready, null, { timeout: 60000 }).catch(() => {});
    await page.evaluate(t => { window.BRADY_BURNS.BurnsGL.configure(t); }, tier);
    const tag = w > h ? 'landscape' : 'portrait';
    const grab = async (name) => {
      await page.waitForTimeout(250);
      const st = await page.evaluate(() => { const s = window.BRADY.Game.scene, R = s.R; return R ? { draws: R.stats.draws, tris: Math.round(R.stats.tris), shDraws: R.stats.shDraws, shTris: Math.round(R.stats.shTris), tier: window.BRADY_BURNS.BurnsGL.tier, glb: !!(s.pcar && s.pcar.M.glb) } : null; });
      const file = path.join(out, name + '.png');
      await page.screenshot({ path: file });
      rows.push(Object.assign({ shot: name }, st));
    };
    for (const id of cars) {
      await page.evaluate(id => { const B = window.BRADY_BURNS, s = window.BRADY.Game.scene; s.state = 'car'; s.carSel = Math.max(0, B.CART_CARS.findIndex(c => c.id === id)); s.spin = 0; s.pcar = null; s.build(); }, id);
      await page.waitForTimeout(1600);
      await grab(`car-${id}-${tag}`);
      // a close look at the stage area only (paint, chrome, the glass reflection)
      if (w > h) { const r = await page.evaluate(() => Object.assign({}, window.BRADY.Game.scene.stageRect)); await page.screenshot({ path: path.join(out, `car-${id}-detail.png`), clip: { x: r.x, y: r.y, width: r.w, height: r.h } }); }
    }
    // every car (not only the ones shot) must fit its frame at every turntable angle: project the posed geometry
    for (const c of await page.evaluate(() => window.BRADY_BURNS.CART_CARS.map(c => c.id))) {
      await page.evaluate(id => { const B = window.BRADY_BURNS, s = window.BRADY.Game.scene; s.state = 'car'; s.carSel = B.CART_CARS.findIndex(c => c.id === id); s.pcar = null; s.camSnap = true; s.build(); }, c);
      await page.waitForTimeout(250);
      const f = await page.evaluate(() => window.BRADY.Game.scene.fitCheck(24, 3));
      fits.push(Object.assign({ car: c, view: tag }, f));
    }
    await page.evaluate(() => { const s = window.BRADY.Game.scene; s.state = 'driver'; s.build(); });
    await page.waitForTimeout(1600);
    await grab(`driver-${tag}`);
    await page.evaluate(() => { const s = window.BRADY.Game.scene; s.state = 'mode'; s.carSel = 0; s.pcar = null; s.build(); });
    await page.waitForTimeout(1600);
    await grab(`home-${tag}`);
    await ctx.close();
  }
  await browser.close(); srv.close();
  for (const r of rows) console.log(JSON.stringify(r));
  // fit: > 0 px means part of the car (or its driver) leaves its frame at some turntable angle
  for (const f of fits) console.log('fit', f.view.padEnd(9), f.car.padEnd(8), 'overStage', String(f.overStage).padStart(6), 'overScreen', String(f.overScreen).padStart(6), 'fill', f.fill);
  const bad = fits.filter(f => f.overScreen > 0 || f.overStage > 12);
  if (bad.length) errs.push('cars that do not fit their frame: ' + bad.map(f => f.car + '/' + f.view).join(', '));
  if (errs.length) { console.log('ERRORS:\n' + errs.slice(0, 10).join('\n')); process.exit(1); }
  console.log('shots in', out);
})().catch(e => { console.error(e); process.exit(1); });
