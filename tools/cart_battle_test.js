// Battle-arena smoke test: runs every secret-level arena × its three games headless for a while and screenshots each
// (King of the Hill and Capture the Flag are retired: 43_cart_h_career.js; royale arenas have their own test).
//   node tools/cart_battle_test.js [outDir=shots/battle] [arenaId] [seconds=40]
// For each combo: loads the arena, drops straight into the race with the player on autopilot, steps the sim,
// reports the objective state, the draw/triangle counts and any error. Fails on page errors or exceptions.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'battle'));
const only = process.argv[3] || null, secs = +(process.argv[4] || 40);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json' };
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { window.__cartFixedQ = 0.7; });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await page.goto(url + 'art-cart/');
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready, null, { timeout: 120000 });
  const combos = await page.evaluate(() => window.BRADY_BURNS.CART_ARENAS.filter(a => a.secretOf).flatMap(a => a.objectives.map(o => [a.id, o])));
  if (combos.some(c => c[1] === 'hill' || c[1] === 'flag')) { console.log('FAIL: a retired objective is still on an arena', JSON.stringify(combos)); process.exit(1); }
  // the menus: the secret levels, and the three games of the arena under test
  await page.evaluate(() => { const s = window.BRADY.Game.scene; s.state = 'secret'; s.build(); });
  await page.waitForTimeout(600); await page.screenshot({ path: path.join(out, 'menu-secret.png'), timeout: 120000 });
  if (only) { await page.evaluate(([id]) => { const B = window.BRADY_BURNS, s = window.BRADY.Game.scene, A = B.CART_ARENAS.find(a => a.id === id); s.carSel = Math.max(0, B.CART_CARS.findIndex(c => c.id === (A && A.secretOf))); s.state = 'secretGames'; s.build(); }, [only]); await page.waitForTimeout(600); await page.screenshot({ path: path.join(out, 'menu-games-' + only + '.png'), timeout: 120000 }); }
  let bad = 0;
  for (const [arena, objective] of combos) {
    if (only && arena !== only) continue;
    const r = await page.evaluate(async ([arena, objective, secs]) => {
      const B = window.BRADY_BURNS; window.__burnsHideHUD = false;
      let s;
      try {
        s = new B.CartRaceScene({ mode: 'battle', arena, objective, driver: 'brady', car: 'heart', autoGas: true, seed: 7 });
        window.BRADY.Game.setScene(s); s.loadAll();
        if (s.state !== 'intro') return { err: 'state after load: ' + s.state + ' ' + (s.noglMsg || '') };
        s.state = 'race'; s.stateT = 0; s.autoDrive = true; window.BRADY.Input.setMode('game'); s.layoutControls();
        const dt = 1 / 60; let steps = Math.round(secs / dt), t0 = performance.now();
        for (let i = 0; i < steps && s.state === 'race'; i++) s.update(dt);
        const cpu = (performance.now() - t0) / secs;
        const p = s.player, lead = s.battleRank()[0];
        return { state: s.state, raceT: +s.raceT.toFixed(1), cpuMsPerSimSec: +cpu.toFixed(0), player: { x: +p.x.toFixed(1), y: +p.y.toFixed(2), z: +p.z.toFixed(1), score: +(+p.score || 0).toFixed(1), vibes: p.vibes, out: p.out, item: p.item }, leader: lead.car.id, leaderScore: +(+lead.score || 0).toFixed(1), events: s.events.length, items: s.events.filter(e => e.type === 'item').map(e => e.item).slice(0, 12) };
      } catch (e) { return { err: String(e && e.stack || e).slice(0, 400) }; }
    }, [arena, objective, secs]);
    if (r.err) bad++;
    console.log(arena.padEnd(8), objective.padEnd(8), JSON.stringify(r));
    await page.waitForTimeout(400);
    try { await page.screenshot({ path: path.join(out, arena + '-' + objective + '.png'), timeout: 120000 }); } catch (e) { console.log('  (screenshot failed)'); }
    const stats = await page.evaluate(() => { const s = window.BRADY.Game.scene; return s && s.stats ? { draws: s.stats.draws, tris: Math.round(s.stats.tris) } : null; });
    console.log('  render', JSON.stringify(stats));
  }
  await browser.close(); srv.close();
  if (errs.length) { console.log('ERRORS:\n' + errs.slice(0, 10).join('\n')); process.exit(1); }
  if (bad) process.exit(1);
  console.log('battle test ok, shots in', out);
})().catch(e => { console.error(e); process.exit(1); });
