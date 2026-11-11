// Art Cart career-track test (C3): one track, played for real.
//   node tools/cart_track_test.js [track=loveparade] [shotsDir=shots/track-<track>] [ref=neon]
// 1. Races: a full 3-lap race with all 8 karts on autopilot (the player too), twice (two seeds). Every kart must
//    finish, nobody may be stuck (progress in every 6 s window), lap times must sit in the range of the reference
//    track's (same cars, lap time per metre), and the level's hazards must fire and land (hits > 0) without being
//    absurd (no more than ~2.5 hazard hits per kart per lap). The reference track runs the same way for comparison.
// 2. Views: the start grid and 10 points round the lap with the whole pack around the player (chase camera), each
//    rendered and screenshotted; peak triangles and draw calls (main + shadow) must stay within 420k / 120.
// 3. Hazards in action: one screenshot per obstacle / enemy at its moment (taken from the level's own debug state).
// 4. Career start without menus: debug.start({ mode: 'career', track }) loads and races.
// Exits non-zero on any failure or page error. Serves $BRADY_DIST/site (or dist/site).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const track = process.argv[2] || 'loveparade';
const out = path.resolve(process.argv[3] || path.join(__dirname, '..', 'shots', 'track-' + track));
const ref = process.argv[4] || 'neon';
const BUDGET = { tris: 420000, draws: 120 };
const ONLY = process.env.ONLY || '';   // races | views | shots (default: all)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json' };
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }

// in the page: a whole race on autopilot, sim only
function pageRace(o) {
  const D = window.BRADY_CART.debug, STEP = 1 / 60;
  try {
    D.start({ mode: o.mode || 'quick', track: o.track, car: o.car || 'heart', driver: 'brady', seed: o.seed, autoGas: true });
    const s = D.scene(); if (s.state !== 'intro') return { err: 'state ' + s.state };
    D.skipIntro(); s.autoDrive = true;
    const K = s.karts, n = K.length, last = K.map(k => -1e9), lastT = K.map(() => 0); let stuck = [], t = 0;
    const lapT = {};
    while (t < 420 && s.state !== 'results') {
      s.update(STEP); t += STEP;
      if (Math.round(t * 60) % 30 === 0) for (let i = 0; i < n; i++) { const k = K[i]; if (k.finished) continue; if (k.prog > last[i] + 15) { last[i] = k.prog; lastT[i] = t; } else if (t - lastT[i] > 6 && s.state === 'race') { stuck.push({ k: k.id, t: +t.toFixed(1), x: +k.x.toFixed(1), z: +k.z.toFixed(1), s: +k.loc.s.toFixed(1), d: +k.loc.d.toFixed(1) }); lastT[i] = t; } }
      if (s.state === 'done' && s.stateT > 0.1 && K.every(k => k.finished)) break;
    }
    const fin = K.map(k => ({ id: k.id, finished: k.finished, est: !!k.estimated, t: +(k.finishT || 0).toFixed(2), laps: k.lapTimes.map(x => +x.toFixed(2)) }));
    const kit = s.kit || {};
    return { L: +s.T.L.toFixed(1), simT: +t.toFixed(1), state: s.state, fin, stuck, hits: kit.hits || {}, touch: kit.touch || {}, fired: kit.fired || {}, items: s.events.filter(e => e.type === 'item').length, hitEvents: s.events.filter(e => e.type === 'hit').length };
  } catch (e) { return { err: String(e && e.stack || e).slice(0, 600) }; }
}
// in the page: put the pack around the player at fraction f of the lap and settle the camera
function pageView(o) {
  const D = window.BRADY_CART.debug, STEP = 1 / 60;
  if (o.start) { D.start({ mode: 'quick', track: o.track, car: 'heart', driver: 'brady', seed: 7, autoGas: true }); const s = D.scene(); s.state = 'race'; s.stateT = 0; s.autoDrive = true; window.BRADY.Input.setMode('game'); s.layoutControls(); s.update(STEP); }
  const s = D.scene(), T = s.T, P = s.player;
  if (o.grid) { const s2 = D.start({ mode: 'quick', track: o.track, car: 'heart', driver: 'brady', seed: 7, autoGas: true }); const sc = D.scene(); sc.state = 'count'; sc.stateT = 0.5; window.BRADY.Input.setMode('game'); sc.layoutControls(); sc.snapCam = true; D.run(0.5, 10); return { draws: sc.stats.draws, tris: sc.stats.tris }; }
  const g = T.at(o.f * T.L, {}); D.place(-1, g.x + g.nx * g.hw * 0.1, g.z + g.nz * g.hw * 0.1, g.yaw, { speed: 20 });
  const R = [[8, 0.4], [12, -0.4], [20, 0], [-8, -0.3], [-14, 0.35], [30, 0.3], [45, -0.2]]; let j = 0;
  for (let i = 0; i < s.karts.length; i++) { if (s.karts[i].player) continue; const r = R[j++]; D.placeRel(i, r[0], r[1], { speed: 20, frozen: false }); }
  for (const k of s.karts) { k.prevS = k.loc.s; k.lap = 1; k.prog = k.loc.s; k.invT = 0; }
  s.snapCam = true; D.run(o.secs || 0.6, 15);
  return { draws: s.stats.draws, mainDraws: s.stats.mainDraws, shadowDraws: s.stats.shadowDraws, tris: s.stats.tris };
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { window.__cartFixedQ = 1; try { localStorage.clear(); } catch (e) {} });
  const page = await ctx.newPage();
  const errs = [], fails = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await page.goto(url + 'art-cart/');
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready && window.BRADY_CART && window.BRADY_CART.debug.level, null, { timeout: 600000 });
  await page.evaluate(() => { window.BRADY.Game.frame = () => {}; });

  // 1. races
  if (!ONLY || ONLY === 'races') {
  const perM = r => r.fin.flatMap(f => f.laps).map(x => x / r.L);
  const refR = await page.evaluate(pageRace, { track: ref, seed: 3 });
  if (refR.err) fails.push('ref race: ' + refR.err);
  const refPer = refR.err ? [] : perM(refR);
  const avg = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
  console.log(`ref ${ref}: L ${refR.L} m, laps ${refPer.length}, avg lap ${(avg(refPer) * refR.L).toFixed(1)} s (${(avg(refPer) * 1000).toFixed(1)} s/km)`);
  for (const seed of [3, 11]) {
    const r = await page.evaluate(pageRace, { track, seed, mode: seed === 11 ? 'career' : 'quick' });
    if (r.err) { fails.push('race ' + seed + ': ' + r.err); continue; }
    const per = perM(r), laps = r.fin.flatMap(f => f.laps);
    console.log(`race seed ${seed}: L ${r.L} m, ${r.simT} s simulated, finished ${r.fin.filter(f => f.finished && !f.est).length}/8, laps ${laps.length}, lap ${Math.min(...laps).toFixed(1)}–${Math.max(...laps).toFixed(1)} s (avg ${avg(laps).toFixed(1)}; ${(avg(per) * 1000).toFixed(1)} s/km vs ref ${(avg(refPer) * 1000).toFixed(1)})`);
    console.log('   hazards fired', JSON.stringify(r.fired), 'hits', JSON.stringify(r.hits), 'touches', JSON.stringify(r.touch), 'stuck', JSON.stringify(r.stuck));
    console.log('   finishers', r.fin.map(f => f.id + ' ' + f.t + (f.est ? '~' : '')).join(', '));
    if (r.fin.some(f => !f.finished || f.est)) fails.push(`seed ${seed}: not every kart finished (${r.fin.filter(f => f.est || !f.finished).map(f => f.id).join(',')})`);
    if (r.stuck.length) fails.push(`seed ${seed}: stuck ${JSON.stringify(r.stuck.slice(0, 4))}`);
    if (refPer.length && (avg(per) > avg(refPer) * 1.4 || avg(per) < avg(refPer) * 0.75)) fails.push(`seed ${seed}: lap time per km ${(avg(per) * 1000).toFixed(1)} out of range of ${ref} ${(avg(refPer) * 1000).toFixed(1)}`);
    if (r.L < 800 || r.L > 1500) fails.push('lap length ' + r.L);
    const totalHits = Object.values(r.hits).reduce((a, b) => a + b, 0), totalTouch = Object.values(r.touch).reduce((a, b) => a + b, 0);
    if (totalTouch > 8 * 3 * 5) fails.push(`seed ${seed}: absurd soft-hazard count ${totalTouch}`);
    for (const tag of Object.keys(r.fired)) if (!r.hits[tag] && !r.touch[tag]) fails.push(`seed ${seed}: hazard ${tag} fired ${r.fired[tag]}x but never landed`);
    if (Object.keys(r.fired).length < 4) fails.push(`seed ${seed}: only ${Object.keys(r.fired).length} hazard kinds fired`);
    if (totalHits > 8 * 3 * 2.5) fails.push(`seed ${seed}: absurd hazard hit count ${totalHits}`);
  }

  }
  // 2. views
  if (!ONLY || ONLY === 'views') {
  let peak = { tris: 0, draws: 0, where: '' };
  const note = (v, where) => { if (v.tris > peak.tris) peak.tris = v.tris, peak.trisAt = where; if (v.draws > peak.draws) peak.draws = v.draws, peak.drawsAt = where; };
  { const v = await page.evaluate(pageView, { track, grid: true }); note(v, 'grid'); const file = path.join(out, 'view-grid.png'); await page.screenshot({ path: file }); console.log('view grid', JSON.stringify(v), file); }
  await page.evaluate(pageView, { track, start: true, f: 0.02 });
  for (let i = 0; i < 10; i++) {
    const f = (i + 0.5) / 10, v = await page.evaluate(pageView, { track, f });
    note(v, 'f' + f.toFixed(2)); const file = path.join(out, `view-${String(i + 1).padStart(2, '0')}.png`); await page.screenshot({ path: file }); console.log('view', f.toFixed(2), JSON.stringify(v), file);
  }
  console.log('PEAK', JSON.stringify(peak));
  if (peak.tris > BUDGET.tris) fails.push('peak triangles ' + peak.tris + ' at ' + peak.trisAt);
  if (peak.draws > BUDGET.draws) fails.push('peak draws ' + peak.draws + ' at ' + peak.drawsAt);

  }
  // 3. hazards in action (the level registers a shot helper: debug.levelShots() -> [{ name, f, lat, wait(s) }])
  const shots = ONLY && ONLY !== 'shots' ? [] : await page.evaluate(() => window.BRADY_CART.debug.levelShots ? window.BRADY_CART.debug.levelShots() : []);
  for (const sh of shots) {
    const r = await page.evaluate(name => { try { return window.BRADY_CART.debug.levelShot(name); } catch (e) { return { err: String(e).slice(0, 300) }; } }, sh.name);
    if (r && r.err) { fails.push('shot ' + sh.name + ': ' + r.err); continue; }
    const file = path.join(out, 'hazard-' + sh.name + '.png'); await page.screenshot({ path: file }); console.log('hazard', sh.name, JSON.stringify(r), file);
    if (r && r.ok === false) fails.push('shot ' + sh.name + ' did not catch its moment');
  }
  await browser.close(); srv.close();
  if (errs.length) console.log('PAGE ERRORS:\n' + errs.slice(0, 12).join('\n'));
  if (fails.length) console.log('FAILURES:\n' + fails.join('\n'));
  else console.log('ALL OK');
  process.exit(errs.length || fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
