// Art Cart screenshots of a Blender-made car (.glb) in the showroom and in a race.
//   node tools/cart_shots.js [outDir=shots/cart] [carId=heart]
// Serves dist/site (or $BRADY_DIST/site) over http (file:// can't fetch the .glb), opens art-cart/, waits for the
// models to load, then shoots: the showroom with the glb (landscape + portrait), the procedural car for comparison,
// and the glb car in a time trial. Fails on any page error. Prints triangle/vertex counts of both models.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'cart'));
const carId = process.argv[3] || 'heart';
const raceMode = process.argv[4] || 'tt';   // 'gp' = a full Grand Prix grid (8 cars) for budget checks
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.glb': 'model/gltf-binary' };
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
  const browser = await chromium.launch();
  const errs = [];
  const open = async (w, h) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { window.__cartFixedQ = 1; });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
    await page.goto(url + 'art-cart/');
    await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready, null, { timeout: 120000 });
    await page.evaluate(() => { window.__cartGlbMs = Math.round(performance.now()); });
    return page;
  };
  const showroom = async (page, glb) => {
    await page.evaluate(([id, glb]) => {
      const B = window.BRADY_BURNS, s = window.BRADY.Game.scene;
      window.__cartNoGLB = !glb;
      s.state = 'car'; s.carSel = Math.max(0, B.CART_CARS.findIndex(c => c.id === id)); s.spin = 0.9; s.pcar = null; s.build();
    }, [carId, glb]);
    await page.waitForTimeout(1800);
  };
  const info = async (page) => page.evaluate(() => {
    const s = window.BRADY.Game.scene, M = s.pcar && s.pcar.M;
    return M ? { glb: !!M.glb, tris: M.geo.count / 3, nv: M.geo.nv, nb: M.nb, len: +M.len.toFixed(2), w: +M.w.toFixed(2), h: +M.h.toFixed(2), lights: M.lights.length, parts: M.parts.length, draws: s.R && s.R.stats ? s.R.stats.draws : undefined } : null;
  });
  // landscape
  let page = await open(874, 402);
  await showroom(page, true);
  const glbInfo = await info(page);
  await page.screenshot({ path: path.join(out, 'showroom-glb-landscape.png') });
  await showroom(page, false);
  const procInfo = await info(page);
  await page.screenshot({ path: path.join(out, 'showroom-procedural-landscape.png') });
  console.log('glb        ', JSON.stringify(glbInfo));
  console.log('procedural ', JSON.stringify(procInfo));
  // race: a time trial on the first track with the glb car
  const lo = await page.evaluate(([id]) => { window.__cartNoGLB = false; const B = window.BRADY_BURNS, M = B.CartGLB.model(id, true); return M ? { tris: M.geo.count / 3, nv: M.geo.nv, lo: !!M.lo } : null; }, [carId]);
  console.log('glb lo     ', JSON.stringify(lo));
  await page.evaluate(([id, mode]) => {
    const B = window.BRADY_BURNS; window.__cartNoGLB = false; window.__burnsHideHUD = true;
    const o = mode === 'gp' ? { mode: 'gp', cup: B.CART_CUPS[0].id, race: 0 } : { mode: 'tt', track: B.CART_TRACK_ORDER[0] };
    window.BRADY.Game.setScene(new B.CartRaceScene(Object.assign(o, { driver: 'brady', car: id, autoGas: true })));
  }, [carId, raceMode]);
  await page.waitForFunction(() => { const s = window.BRADY.Game.scene; return s && s.state && s.state !== 'load'; }, null, { timeout: 120000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(out, 'race-glb.png'), timeout: 120000 });
  const race = await page.evaluate(() => { const s = window.BRADY.Game.scene; return { state: s.state, draws: s.stats && s.stats.draws, tris: s.stats && s.stats.tris, carGlb: s.player && s.player.M && !!s.player.M.glb, karts: s.karts && s.karts.length, glbKarts: s.karts && s.karts.filter(k => k.M && k.M.glb).length, loadMs: window.__cartGlbMs }; });
  console.log('race       ', JSON.stringify(race));
  await page.context().close();
  // portrait showroom
  page = await open(402, 874);
  await showroom(page, true);
  await page.screenshot({ path: path.join(out, 'showroom-glb-portrait.png') });
  await page.context().close();
  await browser.close(); srv.close();
  if (errs.length) { console.log('ERRORS:\n' + errs.slice(0, 10).join('\n')); process.exit(1); }
  console.log('shots in', out);
})().catch(e => { console.error(e); process.exit(1); });
