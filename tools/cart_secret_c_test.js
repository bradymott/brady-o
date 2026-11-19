// Secret levels C test: TREASURE ISLE (lagoon, X MARKS THE SPOT) for Dusty Doubloon and LOVE TRAIN (playa) for
// Bass Valentine (src/43_cart_g_lagoon.js, src/43_cart_g_playa_game.js).
//   node tools/cart_secret_c_test.js [outDir=shots/secret-c] [onlyGame]
// 1. Each new game is played to the end with the player on autopilot: it must end by itself (goal reached or the
//    clock), several cars must score, the winner is ranked 1st; mid-game shots in landscape 844x390 and portrait 390x844
//    with the render stats (peak triangles / draws).
// 2. The secret flow: both cars' secret cards list their level's three games; each starts in the right arena; winning
//    all three marks the car complete.
// Exits non-zero on a failed check or a page error.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'secret-c'));
const only = process.argv[3] || null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json' };
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }
let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); if (!ok) fails++; };
const GAMES = [{ car: 'galleon', arena: 'lagoon', game: 'xmarks', events: ['chest', 'xmap', 'cannonball'] }, { car: 'heart', arena: 'playa', game: 'lovetrain', events: ['heart', 'traincut', 'trainshake'] }];
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
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready && window.BRADY_CART && window.BRADY_CART.debug.career, null, { timeout: 120000 });
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const shot = async name => { await page.waitForTimeout(700); try { await page.screenshot({ path: path.join(out, name + '.png'), timeout: 120000 }); } catch (e) { console.log('  (screenshot failed: ' + name + ')'); } };
  const stats = () => ev(() => { const s = window.BRADY.Game.scene; return s && s.stats ? { draws: s.stats.draws, tris: Math.round(s.stats.tris) } : null; });
  const peak = { tris: 0, draws: 0 };
  const note = st => { if (st) { peak.tris = Math.max(peak.tris, st.tris); peak.draws = Math.max(peak.draws, st.draws); } };

  // ---- 1. each game played to the end ----
  for (const G of GAMES) {
    if (only && only !== G.game) continue;
    await page.setViewportSize({ width: 844, height: 390 });
    const r0 = await ev(G => { const D = window.BRADY_CART.debug; D.start({ mode: 'battle', arena: G.arena, objective: G.game, driver: 'brady', car: G.car, autoGas: true, seed: 11 }); D.skipIntro(); const st = D.sim(22, { auto: true }); return { state: st.state, objective: st.objective, arena: st.arena, raceT: st.raceT }; }, G);
    check(G.game + ': starts in ' + G.arena, r0.objective === G.game && r0.arena === G.arena && r0.state === 'race', r0);
    await shot(G.game + '-land'); const sl = await stats(); note(sl); console.log('  render landscape', JSON.stringify(sl));
    await page.setViewportSize({ width: 390, height: 844 }); await ev(() => { const s = window.BRADY.Game.scene; if (s.layoutControls) s.layoutControls(); });
    await ev(() => window.BRADY_CART.debug.sim(6, { auto: true }));
    await shot(G.game + '-port'); const sp = await stats(); note(sp); console.log('  render portrait', JSON.stringify(sp));
    await page.setViewportSize({ width: 844, height: 390 }); await ev(() => { const s = window.BRADY.Game.scene; if (s.layoutControls) s.layoutControls(); });
    const r = await ev(G => {
      const D = window.BRADY_CART.debug, s = D.scene(), B = window.BRADY_BURNS;
      for (let i = 0; i < 40 && s.state === 'race'; i++) D.sim(3, { auto: true });
      const order = s.finalOrder || s.battleRank(), O = B.CART_OBJECTIVES[G.game], cnt = {};
      for (const e of s.events) cnt[e.type] = (cnt[e.type] || 0) + 1;
      return { state: s.state, ended: s.obj.ended, raceT: +s.raceT.toFixed(1), goal: O.goal, timeLimit: O.time, scores: order.map(k => ({ car: k.car.id, player: k.player, score: O.fx.score(k) })), winner: order[0].car.id, results: (s.results || []).slice(0, 3).map(q => q.car + ':' + q.score + '#' + q.rank), counts: G.events.reduce((o, e) => (o[e] = cnt[e] || 0, o), {}) };
    }, G);
    console.log('  ' + G.game, JSON.stringify(r));
    const scorers = r.scores.filter(q => q.score > 0).length;
    check(G.game + ': the round ends by itself (goal or clock) inside 125 s', r.ended && r.raceT <= 125, { raceT: r.raceT, state: r.state });
    check(G.game + ': the winner is ranked first and has the top score', r.scores[0].score >= Math.max(...r.scores.map(q => q.score)) && (r.scores[0].score >= r.goal || r.raceT >= r.timeLimit - 1), r.scores.slice(0, 3));
    check(G.game + ': several AI cars really play it (3+ cars scored)', scorers >= 3, { scorers, scores: r.scores.map(q => q.score) });
    check(G.game + ': its own events happen (' + G.events.join(', ') + ')', G.events.slice(0, 2).every(e => r.counts[e] > 0), r.counts);
    await shot(G.game + '-results');
  }

  // ---- 2. the secret flow for both cars ----
  const flow = await ev(GAMES => {
    const C = window.BRADY_CART.debug.career, sv = window.BRADY_BURNS.cartSave(), outp = {};
    for (const G of GAMES) {
      C.reset(G.car);
      const locked = C.secret(G.car);
      const p = sv.prog[G.car] = sv.prog[G.car] || {}; p.careerWon = 1; p.royaleWon = 1; p.points = 2;
      const open = C.secret(G.car), games = [];
      for (const g of open.games) { C.playSecret(G.car, g); const s = window.BRADY.Game.scene; const r = C.win(1); games.push({ g, arena: s.arenaId, obj: s.objective, car: s.carId, pass: r && r.pass, complete: r && r.complete }); }
      outp[G.car] = { locked: locked.unlocked, open: open.unlocked, ready: open.ready, name: open.name, games, complete: C.complete(G.car) };
    }
    return outp;
  }, GAMES);
  for (const G of GAMES) {
    const f = flow[G.car];
    check(G.car + ': secret card lists ' + G.game + ', vibe, glow in ' + G.arena, f.ready && f.games.map(g => g.g).join() === G.game + ',vibe,glow' && f.games.every(g => g.arena === G.arena && g.car === G.car && g.obj === g.g), f);
    check(G.car + ': winning all three secret games completes the car', f.games.every(g => g.pass) && f.games[2].complete && f.complete, f.games.map(g => [g.g, g.pass, g.complete]));
  }
  // the secret-games cards (menus) in both orientations
  for (const G of GAMES) for (const portrait of [false, true]) {
    if (only && only !== G.game) continue;
    await page.setViewportSize(portrait ? { width: 390, height: 844 } : { width: 844, height: 390 });
    await ev(car => { window.BRADY_CART.debug.career.menu({ state: 'secretGames', car }); }, G.car);
    await shot('menu-' + G.car + (portrait ? '-port' : '-land'));
  }
  await ev(GAMES => { const C = window.BRADY_CART.debug.career; for (const G of GAMES) C.reset(G.car); }, GAMES);
  console.log('peak render (game shots):', JSON.stringify(peak));
  check('peak triangles <= 420k and draws <= 120', peak.tris <= 420000 && peak.draws <= 120, peak);
  await browser.close(); srv.close();
  if (errs.length) { console.log('ERRORS:\n' + errs.slice(0, 10).join('\n')); process.exit(1); }
  console.log(fails ? fails + ' check(s) failed' : 'secret C test ok, shots in ' + out);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
