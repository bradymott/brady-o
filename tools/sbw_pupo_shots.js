// Pupo in the real game (WebKit, the built app, a touch phone): every route script of tools/pupo_routes.js played at
// the game's fixed step, in landscape (844 x 390) and portrait (390 x 844), with a screenshot at each of its `shot`
// steps (the obstacle before, during and after; the Nap Box shut and Pupo's yawn; each Pupo-only bonus).
// usage: BRADY_DIST=<dist> node tools/sbw_pupo_shots.js <shotsDir> [--checks] [--engine chromium] [route name or level ...]
//   --checks: play every route and check it, no screenshots (the quick form for the regular suite)
// Full resolution is pinned before every capture (the adaptive quality would otherwise drop it on a busy machine).
// Exits 1 if any route fails or the page logs an error.
const playwright = require('playwright');
const { silence } = require('./sbw_silent');
const { ROUTES, RUNNER_SRC } = require('./pupo_routes');
const path = require('path'), fs = require('fs'), http = require('http');
const args = process.argv.slice(2), out = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : path.join(__dirname, '..', 'shots', 'pupo'));
const flags = args.filter(a => a.startsWith('--')), checksOnly = flags.includes('--checks');
const engine = args.includes('--engine') ? args[args.indexOf('--engine') + 1] : 'webkit';
// the app is served over http (WebKit refuses file:// fetches of the sprite files)
function serve(root) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.txt': 'text/plain' };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, path.normalize(p));
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}
const want = args.slice(1).filter((a, i, A) => !a.startsWith('--') && A[i - 1] !== '--engine' && a !== engine);
fs.mkdirSync(out, { recursive: true });
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined && !ok ? '  ' + JSON.stringify(info) : '')); if (!ok) failures++; };

(async () => {
  const srv = await serve(site), url = 'http://127.0.0.1:' + srv.address().port + '/super-brady-o-world/index.html';
  const browser = await playwright[engine].launch();
  const sizes = checksOnly ? [['land', 844, 390]] : [['land', 844, 390], ['port', 390, 844]];
  for (const [tag, w, h] of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await silence(ctx);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(url);
    await page.waitForTimeout(1500);
    await page.evaluate(RUNNER_SRC);
    // between our steps the page's own loop only draws: the scene's update is held (the runner steps it itself)
    const hold = () => page.evaluate(() => { const g = window.__pupoRoute.g; if (g && !g.__upd) { g.__upd = g.update; g.update = function () {}; } if (g && g.player) g.player.invuln = 0; });
    const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
    for (const route of ROUTES) {
      if (want.length && !want.some(x => route.name.startsWith(x) || route.level === x)) continue;
      let res = null, shots = 0;
      try {
        await pin();
        await page.evaluate(r => window.__pupoRoute.start(r), route);
        await hold();
        for (let k = 0; k < 60; k++) {
          res = await page.evaluate(() => window.__pupoRoute.go());
          await hold();
          if (res.shot) {
            if (!checksOnly) { await pin(); await page.waitForTimeout(350); await page.screenshot({ path: path.join(out, `${res.shot}-${tag}.png`) }); shots++; }
            continue;
          }
          if (res.done) break;
        }
      } catch (e) { check(`${tag} ${route.name} runs`, false, String(e.message).slice(0, 400)); continue; }
      for (const p of res.passes || []) check(`${tag} ${route.name}: ${p}`, true);
      for (const f of res.fails || []) check(`${tag} ${route.name}: ${f}`, false);
      check(`${tag} ${route.name}: the route ends${checksOnly ? '' : ` (${shots} shots)`}`, res && res.done && res.ok, res && res.info);
    }
    check(`${tag}: no errors in the page`, !errors.length, errors.slice(0, 5));
    await ctx.close();
  }
  await browser.close(); srv.close();
  console.log(failures ? `${failures} failed` : 'all passed');
  process.exit(failures ? 1 : 0);
})();
