// Secret levels test for Sir Scorchalot (THE GILDED ROOST 'joust', DRAGON'S HOARD) and Frosted Fury (THE SUGAR COUNTER
// 'pantry', FROSTING FRENZY): 43_cart_g_joust.js, 43_cart_g_pantry.js.
//   node tools/cart_secret_secB_test.js [outDir=shots/secret-secB] [car=all]
// For each car: the secret card is locked until Career + Royale are won, then shows its level with exactly 3 games; each
// game starts in the right arena; the car's own game is played a whole round on autopilot (it must end on its own clock
// with real AI scores and a winner); then all three are won through the career flow and the car is complete.
// Screenshots mid-round in landscape (844x390) and portrait (390x844). Exits non-zero on a failed check or a page error.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'secret-secB'));
const only = process.argv[3] || null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json' };
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }
const LEVELS = [{ car: 'dragon', arena: 'joust', game: 'hoard' }, { car: 'cupcake', arena: 'pantry', game: 'frost' }];
let fails = 0;
const check = (name, ok, info) => { console.log((ok ? 'ok   ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); if (!ok) fails++; };
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
  try { await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready && window.BRADY_CART && window.BRADY_CART.debug.career, null, { timeout: 180000 }); }
  catch (e) { console.log('FAIL boot: ' + e.message.split('\n')[0] + '\n' + errs.slice(0, 5).join('\n')); process.exit(1); }
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const shot = async (name, ms) => { await page.waitForTimeout(ms || 700); try { await page.screenshot({ path: path.join(out, name + '.png'), timeout: 120000 }); } catch (e) { console.log('  (screenshot failed: ' + name + ')'); } };
  const orient = async portrait => { await page.setViewportSize(portrait ? { width: 390, height: 844 } : { width: 844, height: 390 }); await page.waitForTimeout(300); await ev(() => { const s = window.BRADY.Game.scene; if (s && s.resize) s.resize(); if (s && s.layoutControls) s.layoutControls(); }); };
  for (const L of LEVELS) {
    if (only && L.car !== only) continue;
    // ---- gating and the card ----
    const card = await ev(L => {
      const C = window.BRADY_CART.debug.career, sv = window.BRADY_BURNS.cartSave();
      C.reset(L.car); const locked = C.secret(L.car);
      const p = sv.prog[L.car] = sv.prog[L.car] || {}; p.careerWon = 1; p.royaleWon = 1; p.points = 2;
      return { locked, open: C.secret(L.car) };
    }, L);
    check(L.car + ': secret level locked until Career + Royale are won', !card.locked.unlocked && card.open.unlocked, [card.locked.unlocked, card.open.unlocked]);
    check(L.car + ': card shows its own level with exactly 3 games', card.open.ready && card.open.games.join() === [L.game, 'vibe', 'glow'].join() && card.open.name !== 'SECRET LEVEL', card.open);
    // the secret games menu for this car (screenshot)
    await ev(car => { const B = window.BRADY_BURNS, s = window.BRADY.Game.scene.constructor.name === 'KartMenuScene' ? window.BRADY.Game.scene : null; window.BRADY_CART.debug.career.menu({ state: 'secretGames', car }); const m = window.BRADY.Game.scene; m.carSel = Math.max(0, B.CART_CARS.findIndex(c => c.id === car)); m.state = 'secretGames'; m.build(); void s; }, L.car);
    await shot(L.car + '-menu-games', 900);
    // ---- every game starts in the right arena ----
    for (const g of [L.game, 'vibe', 'glow']) {
      const r = await ev(([car, g]) => { const C = window.BRADY_CART.debug.career, D = window.BRADY_CART.debug; C.playSecret(car, g); const s = D.scene(); D.skipIntro(); D.sim(8, { auto: true }); return { arena: s.arenaId, obj: s.objective, car: s.player.car.id, state: s.state, raceT: +s.raceT.toFixed(1), score: s.karts.map(k => +(+k.score || 0).toFixed(1)) }; }, [L.car, g]);
      check(L.car + ': ' + g + ' starts in ' + L.arena + ' and runs', r.arena === L.arena && r.obj === g && r.car === L.car && r.state === 'race' && r.raceT > 7, r);
    }
    // ---- the car's own game: a whole round on autopilot ----
    const play = await ev(async L => {
      const C = window.BRADY_CART.debug.career, D = window.BRADY_CART.debug, B = window.BRADY_BURNS;
      C.playSecret(L.car, L.game); const s = D.scene(); D.skipIntro(); s.autoDrive = true;
      const time = B.CART_OBJECTIVES[L.game].time; let peakTris = 0, peakDraws = 0;
      D.sim(30, { auto: true });
      for (let i = 0; i < 3; i++) { D.frame(); peakTris = Math.max(peakTris, s.stats.tris); peakDraws = Math.max(peakDraws, s.stats.draws); }
      return { time, peakTris: Math.round(peakTris), peakDraws, mid: s.karts.map(k => ({ car: k.car.id, player: k.player, score: +(+k.score || 0).toFixed(1) })) };
    }, L);
    await shot(L.car + '-' + L.game + '-land', 900);
    await orient(true); await shot(L.car + '-' + L.game + '-port', 900); await orient(false);
    const end = await ev(L => {
      const D = window.BRADY_CART.debug, s = D.scene(), ev = s.events.reduce((a, e) => { a[e.type] = (a[e.type] || 0) + 1; return a; }, {});
      D.sim(window.BRADY_BURNS.CART_OBJECTIVES[L.game].time + 10, { auto: true });
      let peakTris = 0, peakDraws = 0; for (let i = 0; i < 2; i++) { D.frame(); peakTris = Math.max(peakTris, s.stats.tris); peakDraws = Math.max(peakDraws, s.stats.draws); }
      const ev2 = s.events.reduce((a, e) => { a[e.type] = (a[e.type] || 0) + 1; return a; }, {});
      return { state: s.state, ended: s.obj.ended, raceT: +s.raceT.toFixed(1), results: (s.results || []).map(r => (r.player ? '*' : '') + r.car + ':' + r.score), events30: ev, events: ev2, peakTris: Math.round(peakTris), peakDraws, runOut: s.runOut || null };
    }, L);
    check(L.car + ': ' + L.game + ' ends on its own clock with a winner', end.ended && end.results.length === 8 && Math.abs(end.raceT - play.time) < 6, { raceT: end.raceT, time: play.time, state: end.state });
    const scores = end.results.map(r => +r.split(':').pop()), ai = scores.filter((v, i) => !end.results[i].startsWith('*'));
    check(L.car + ': AI rivals really play (most score)', ai.filter(v => v > 0).length >= 5, end.results);
    check(L.car + ': budgets (tris <= 420k, draws <= 120)', Math.max(play.peakTris, end.peakTris) <= 420000 && Math.max(play.peakDraws, end.peakDraws) <= 120, { tris: Math.max(play.peakTris, end.peakTris), draws: Math.max(play.peakDraws, end.peakDraws) });
    console.log('  results', JSON.stringify(end.results), 'events', JSON.stringify(end.events));
    await shot(L.car + '-' + L.game + '-results', 900);
    // ---- winning all three through the flow completes the car ----
    const fin = await ev(L => {
      const C = window.BRADY_CART.debug.career, outs = [];
      for (const g of [L.game, 'vibe', 'glow']) { C.playSecret(L.car, g); const r = C.win(1); outs.push({ g, pass: r && r.pass, complete: r && r.complete }); }
      return { outs, complete: C.complete(L.car), sec: C.secret(L.car) };
    }, L);
    check(L.car + ': winning all three secret games completes the car', fin.outs.every(o => o.pass) && fin.complete && fin.outs[2].complete, fin);
    await ev(car => window.BRADY_CART.debug.career.reset(car), L.car);
  }
  await browser.close(); srv.close();
  if (errs.length) { console.log('ERRORS:\n' + errs.slice(0, 10).join('\n')); process.exit(1); }
  console.log(fails ? fails + ' FAILED' : 'secret secB test ok, shots in ' + out);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
