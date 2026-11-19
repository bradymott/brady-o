// Secret levels of Glitterfin (THE MIRROR TANK, SCHOOL OF GLITTER) and Calamari Inferno (THE COPPER FORGE, LIGHT THE FORGE).
//   node tools/cart_secret_secA_test.js [outDir=shots/secret-secA] [seconds=full]
// 1. The secret flow: each car's secret card shows its arena with three games, each starts through debug.career.playSecret,
//    winning all three (with Career + Royale won) marks the car complete.
// 2. Each unique game played headless with every car on autopilot (the player too) until it ends: the AI must score,
//    the round must end inside its time, and the results must rank a winner. Screenshots in landscape (844x390) and
//    portrait (390x844) mid-game, with draw / triangle counts. Exits non-zero on a failed check or a page error.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'secret-secA'));
const maxSecs = +(process.argv[3] || 0);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json' };
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }
let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); if (!ok) fails++; };
const LEVELS = [{ car: 'fish', arena: 'aquarium', game: 'shoal' }, { car: 'octo', arena: 'forge', game: 'kindle' }];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { window.__cartFixedQ = 0.7; });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await page.goto(url + 'art-cart/');
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready && window.BRADY_CART && window.BRADY_CART.debug.career, null, { timeout: 180000 });
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const shot = async name => { await page.waitForTimeout(700); try { await page.screenshot({ path: path.join(out, name + '.png'), timeout: 120000 }); } catch (e) { console.log('  (screenshot failed: ' + name + ')'); } };
  const stats = () => ev(() => { const s = window.BRADY.Game.scene; return s && s.stats ? { draws: s.stats.draws, tris: Math.round(s.stats.tris) } : null; });

  for (const L of LEVELS) {
    // ---- the secret flow ----
    const flow = await ev(L => {
      const C = window.BRADY_CART.debug.career, sv = window.BRADY_BURNS.cartSave();
      C.reset(L.car);
      const locked = C.secret(L.car);
      const p = sv.prog[L.car] = sv.prog[L.car] || {}; p.careerWon = 1; p.royaleWon = 1;
      const open = C.secret(L.car), games = [];
      for (const g of open.games) { C.playSecret(L.car, g); const s = window.BRADY.Game.scene; const r = { g, arena: s.arenaId, obj: s.objective, car: s.carId, state: s.state }; const o = C.win(1); r.pass = o && o.pass; r.complete = o && o.complete; games.push(r); }
      const res = { locked: locked.unlocked, open, games, complete: C.complete(L.car) };
      C.reset(L.car); return res;
    }, L);
    check(L.car + ': secret level locked until the Royale is won', flow.locked === false, flow.locked);
    check(L.car + ': secret card shows ' + L.arena + ' with 3 games', flow.open.ready && flow.open.openable && flow.open.games.join() === L.game + ',vibe,glow', flow.open);
    check(L.car + ': each game starts in its arena with the car', flow.games.length === 3 && flow.games.every(g => g.arena === L.arena && g.car === L.car && g.state === 'intro'), flow.games);
    check(L.car + ': winning all three completes the car', flow.games.every(g => g.pass) && flow.games[2].complete && flow.complete, flow.games.map(g => [g.pass, g.complete]));

    // ---- the unique game played to the end, everyone on autopilot ----
    const play = async (portrait, full) => {
      await page.setViewportSize(portrait ? { width: 390, height: 844 } : { width: 844, height: 390 });
      return ev(async ([L, full, maxSecs]) => {
        const B = window.BRADY_BURNS; let s;
        try {
          s = new B.CartRaceScene({ mode: 'battle', arena: L.arena, objective: L.game, driver: 'brady', car: L.car, autoGas: true, seed: full ? 11 : 5 });
          window.BRADY.Game.setScene(s); s.loadAll();
          s.state = 'race'; s.stateT = 0; s.autoDrive = true; window.BRADY.Input.setMode('game'); s.layoutControls();
          const dt = 1 / 60, lim = full ? (maxSecs || B.CART_OBJECTIVES[L.game].time + 2) : 24; let i = 0;
          for (; i < lim / dt && s.state === 'race'; i++) s.update(dt);
          const order = s.battleRank();
          return { state: s.state, ended: !!s.obj.ended, raceT: +s.raceT.toFixed(1), scores: order.map(k => (k.player ? 'YOU:' : k.car.id + ':') + Math.floor(k.score)), ai: s.karts.filter(k => !k.player).map(k => k.score), winner: order[0].car.id, events: s.events.filter(e => /shoal|kindle|steam|bellows/.test(e.type)).reduce((m, e) => (m[e.type] = (m[e.type] || 0) + 1, m), {}) };
        } catch (e) { return { err: String(e && e.stack || e).slice(0, 500) }; }
      }, [L, full, maxSecs]);
    };
    const mid = await play(false, false);
    check(L.game + ': 24 s in, no errors, AI scoring', !mid.err && mid.ai.some(v => v > 0), mid);
    await shot(L.arena + '-' + L.game + '-land'); console.log('  render land', JSON.stringify(await stats()));
    const midP = await play(true, false);
    check(L.game + ': portrait run ok', !midP.err, midP.err);
    await shot(L.arena + '-' + L.game + '-port'); console.log('  render port', JSON.stringify(await stats()));
    const full = await play(false, true);
    check(L.game + ': the round ends with a winner', !full.err && full.ended && full.state === 'done', full);
    console.log('  full round', JSON.stringify(full));
    await page.waitForTimeout(1500); await shot(L.arena + '-' + L.game + '-end');
  }
  await page.setViewportSize({ width: 844, height: 390 });
  // the secret-games menu for both cars
  for (const L of LEVELS) { await ev(car => { const sv = window.BRADY_BURNS.cartSave(); const p = sv.prog[car] = sv.prog[car] || {}; p.careerWon = 1; p.royaleWon = 1; return window.BRADY_CART.debug.career.menu({ state: 'secretGames', car }); }, L.car); await shot('menu-secret-' + L.car); await ev(car => window.BRADY_CART.debug.career.reset(car), L.car); }
  await browser.close(); srv.close();
  if (errs.length) { console.log('ERRORS:\n' + errs.slice(0, 10).join('\n')); fails++; }
  console.log(fails ? fails + ' FAILED' : 'secret secA test ok, shots in ' + out);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
