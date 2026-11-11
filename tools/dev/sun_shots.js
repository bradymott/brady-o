// Throwaway: chase-cam shots at the moments the camera faces the low sun (dawn + sunset tracks, skate arena)
const { chromium } = require('/Users/bradymott/brady-o/node_modules/playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const site = path.join(process.env.BRADY_DIST, 'site'), out = process.argv[2];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }
const RUNS = JSON.parse(process.argv[3]);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site), browser = await chromium.launch();
  for (const R of RUNS) {
    const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { window.__cartFixedQ = 1; });
    const page = await ctx.newPage(); page.on('pageerror', e => console.log(R.name, 'pageerror', e.message.slice(0, 200)));
    await page.goto(url + 'art-cart/');
    await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready, null, { timeout: 120000 });
    await page.evaluate(([o]) => { window.BRADY_CART.debug.start(Object.assign({ driver: 'brady', car: 'heart', autoGas: true }, o)); }, [R.opts]);
    await page.waitForFunction(() => { const s = window.BRADY.Game.scene; return s && s.state && s.state !== 'load'; }, null, { timeout: 120000 });
    await page.evaluate(() => window.BRADY_CART.debug.skipIntro());
    let n = 0, best = -2;
    for (let i = 0; i < 60 && n < 3; i++) { if (i < 8) { await page.evaluate(() => window.BRADY_CART.debug.sim(2, { auto: true })); continue; }
      const d = await page.evaluate(() => { const D = window.BRADY_CART.debug; D.sim(2, { auto: true }); const s = window.BRADY.Game.scene, k = s.player, sd = s.env && s.env.sunDir || s.R.env && s.R.env.sunDir || [0, 0, 1]; const h = Math.hypot(sd[0], sd[2]) || 1; return { dot: (Math.sin(k.yaw) * sd[0] + Math.cos(k.yaw) * sd[2]) / h, t: s.raceT, tod: s.E && s.E.tod }; });
      best = Math.max(best, d.dot);
      if (d.dot > 0.93) { await page.waitForTimeout(700); await page.screenshot({ path: path.join(out, R.name + '-sun' + (++n) + '.png') }); i += 3; }
    }
    console.log(R.name, 'shots', n, 'best dot', best.toFixed(2));
    await ctx.close();
  }
  await browser.close(); srv.close();
})();
