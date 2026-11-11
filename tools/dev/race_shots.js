// Throwaway: 8-car race shots (grid + mid-race) day / sunset / night, with draw/tri counts. Modelled on tools/cart_shots.js.
const { chromium } = require('/Users/bradymott/brady-o/node_modules/playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const site = path.join(process.env.BRADY_DIST, 'site');
const out = process.argv[2];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary' };
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }
const RUNS = [
  { name: 'sunset-esplanade', cup: 'dust', race: 0, car: 'heart', mid: 25 },
  { name: 'day-gateroad', cup: 'dust', race: 1, car: 'whale', mid: 25 },
  { name: 'night-burn', cup: 'fire', race: 3, car: 'heart', mid: 25 },
  { name: 'night-deepplaya', cup: 'dust', race: 2, car: 'shark', mid: 30 },
];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site);
  const browser = await chromium.launch();
  const errs = [];
  for (const R of RUNS) {
    const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { window.__cartFixedQ = 1; });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(R.name + ' pageerror: ' + e.message.slice(0, 300)));
    page.on('console', m => { if (m.type() === 'error') errs.push(R.name + ' console: ' + m.text().slice(0, 300)); });
    await page.goto(url + 'art-cart/');
    await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready, null, { timeout: 120000 });
    const carIds = await page.evaluate(() => window.BRADY_BURNS.CART_CARS.map(c => c.id));
    if (!carIds.includes(R.car)) { console.log('car ids:', carIds.join(',')); R.car = carIds[0]; }
    const t0 = Date.now();
    const st0 = await page.evaluate(([R]) => { window.__burnsHideHUD = false; const s = window.BRADY_CART.debug.start({ mode: 'gp', cup: R.cup, race: R.race, driver: 'brady', car: R.car, autoGas: true }); return s.state + ' ' + s.track; }, [R]);
    const loadMs = Date.now() - t0;
    await page.evaluate(() => { const s = window.BRADY.Game.scene; s.state = 'count'; s.stateT = 0.5; });
    await page.waitForTimeout(1500);
    // freeze back on count for the grid shot
    await page.evaluate(() => { const s = window.BRADY.Game.scene; if (s.state === 'count') s.stateT = Math.min(s.stateT, 1); });
    await page.screenshot({ path: path.join(out, R.name + '-grid.png'), timeout: 120000 });
    const g = await page.evaluate(() => { const d = window.BRADY_CART.debug.state(); const s = window.BRADY.Game.scene; return { state: d.state, draws: d.draws, main: d.mainDraws, shadow: d.shadowDraws, tris: d.tris, fps: d.fps, tier: d.tier, glbKarts: s.karts.filter(k => k.M && k.M.glb).length, karts: s.karts.length, cam: s.cam && [s.cam.x, s.cam.y, s.cam.z].map(v => +(+v).toFixed(1)) }; });
    console.log(R.name, 'load', st0, loadMs + 'ms', 'grid', JSON.stringify(g));
    await page.evaluate(([mid]) => { const D = window.BRADY_CART.debug; D.skipIntro(); D.sim(mid, { auto: true }); }, [R.mid]);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(out, R.name + '-mid.png'), timeout: 120000 });
    const m = await page.evaluate(() => { const d = window.BRADY_CART.debug.state(); const p = d.karts.find(k => k.player); return { state: d.state, raceT: d.raceT, draws: d.draws, main: d.mainDraws, shadow: d.shadowDraws, tris: d.tris, fps: d.fps, player: p && { rank: p.rank, lap: p.lap, speed: p.speed } }; });
    console.log(R.name, 'mid ', JSON.stringify(m));
    await ctx.close();
  }
  await browser.close(); srv.close();
  if (errs.length) { console.log('ERRORS:\n' + errs.slice(0, 15).join('\n')); process.exit(1); }
  console.log('ok');
})().catch(e => { console.error(e); process.exit(1); });
