// Art Cart driver test (C3): the 12 drivers, their stat pip and their specials.
//   node tools/cart_driver_test.js [shotsDir=shots/drivers] [onlyId]
// 1. The roster is exactly the 12 drivers, each with a stat and a special that exists (name, icon, effect, guide text).
// 2. Stats: every driver adds +1 to its stat on a car whose stats are all under 5 (Jelly Jolt): the kart's vmax / acc /
//    turn / mass move by exactly one pip and nothing else does.
// 3. Retired drivers ('man', 'undercovercop', 'furry'…) as the saved or requested driver fall back to Brady.
// 4. Every special is used for real in a race with rivals placed around the player, and must do something measurable
//    (hit events credited to it, rivals' states, the player's speed / flight / item). Each case also renders the
//    moment and saves a screenshot (844x390), and the driver-select screen is shot in landscape and portrait.
// 5. Rolls: gift boxes give a driver its own special (and never another driver's) at a sensible rate.
// Exits non-zero on any failed expectation or page error. Serves $BRADY_DIST/site (or dist/site).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'drivers'));
const only = process.argv[3] || null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json' };
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }

const WANT = ['brady', 'chinka', 'sparklepony', 'dpw', 'deathguild', 'crusty', 'ranger', 'annoyingdj', 'darkwad', 'badideaguy', 'messiah', 'partyboy'];
// rivals [ds, lat, frozen] relative to the player
const NEAR = [[9, 0.35, 0], [13, -0.35, 0], [18, 0, 0], [-9, 0.2, 0], [-14, -0.3, 0], [60, 0, 0], [-60, 0, 1]];
const AHEAD = [[20, 0.3, 0], [35, -0.3, 0], [60, 0, 0], [80, 0.4, 0], [100, -0.3, 1], [-10, 0, 0], [-60, 0, 1]];
// id: { drv, rivals, secs, shotAt, setup (in-page code name), expect }
const CASES = {
  firstburn: { drv: 'brady', rivals: AHEAD, secs: 3, shotAt: 1.0, pre: 'slowed' },
  lapped: { drv: 'chinka', rivals: [[22, 0, 0], [45, 0.3, 0], [70, -0.3, 0], [-10, 0, 0], [-20, 0.3, 0], [-40, 0, 1], [-60, 0, 1]], secs: 3.2, shotAt: 0.9, rivalSpeed: 18 },
  borrow: { drv: 'sparklepony', rivals: AHEAD, secs: 1.6, shotAt: 0.45, pre: 'rivalItem' },
  roadwork: { drv: 'dpw', rivals: [[30, 0, 0], [-25, -0.3, 0], [50, 0, 0], [70, 0, 0], [90, 0, 1], [-70, 0, 1], [110, 0, 1]], secs: 4, shotAt: 1.1, after: 'bar', user: true, rivalSpeed: 22 },
  bungee: { drv: 'deathguild', rivals: [[8, 0.4, 0], [40, -0.3, 0], [60, 0, 0], [80, 0, 0], [-40, 0, 1], [-60, 0, 1], [100, 0, 1]], secs: 2.6, shotAt: 1.05 },
  lecture: { drv: 'crusty', rivals: NEAR, secs: 3, shotAt: 1.2 },
  fivemph: { drv: 'ranger', rivals: [[45, 0.4, 0], [60, -0.3, 0], [80, 0, 0], [-10, 0, 0], [-30, 0, 1], [-60, 0, 1], [120, 0, 1]], secs: 4, shotAt: 1.3, rivalSpeed: 14 },
  airhorn: { drv: 'annoyingdj', rivals: NEAR, secs: 2.5, shotAt: 0.35 },
  lightsout: { drv: 'darkwad', rivals: NEAR, secs: 3, shotAt: 0.9 },
  holdwater: { drv: 'badideaguy', rivals: [[10, 0, 0], [40, 0.3, 0], [60, 0, 0], [-10, 0, 0], [-30, 0, 1], [-60, 0, 1], [120, 0, 1]], secs: 2.8, shotAt: 0.6, rng: 0.9 },
  holdwater_bad: { id: 'holdwater', drv: 'badideaguy', rivals: [[-4, 0.35, 0], [40, 0.3, 0], [60, 0, 0], [-10, 0, 0], [-30, 0, 1], [-60, 0, 1], [120, 0, 1]], secs: 2.4, shotAt: 1.25, rng: 0.1 },
  parting: { drv: 'messiah', rivals: [[15, 0.1, 0], [25, -0.1, 0], [40, 0, 0], [55, 0.1, 0], [-10, 0, 0], [-40, 0, 1], [120, 0, 1]], secs: 2.4, shotAt: 0.9, rivalSpeed: 16 },
  afterparty: { drv: 'partyboy', rivals: NEAR, secs: 3, shotAt: 1.4 }
};
const ok = (c, why) => c ? null : why;
const EXPECT = {
  firstburn: r => ok(r.selfMax.joyT && r.clearedSlow && r.maxSpeed > r.vmax * 1.2, 'no joy / slow-downs not cleared / no boost'),
  lapped: r => ok(r.flew && r.events.pass >= 1 && r.passedOk, 'did not fly past the car ahead'),
  borrow: r => ok(r.hits >= 1 && r.playerItem === 'devil' && !r.rivalItem, 'item not borrowed (' + r.playerItem + ')'),
  roadwork: r => ok(r.maxBars >= 4 && r.maxCones >= 5 && r.hits >= 1 && r.kinds.knock, 'barricade not placed / never hit (' + r.maxBars + ' bars, ' + r.maxCones + ' cones)'),
  bungee: r => ok(r.hits >= 1 && r.kinds.spin && r.st.spinT, 'nobody bonked'),
  lecture: r => ok(r.hits >= 3 && r.st.crawlT && r.st.boredT, 'fewer than 3 lectured'),
  fivemph: r => ok(r.hits >= 1 && r.st.crawlT, 'nobody crawled in the zone'),
  airhorn: r => ok(r.hits >= 3 && r.st.mixT, 'fewer than 3 steering backwards'),
  lightsout: r => ok(r.selfMax.darkT && r.immune && r.hits >= 2 && r.st.lostT, 'not dark / nobody lost'),
  holdwater: r => ok(r.maxSpeed > r.vmax * 1.4 && r.hits >= 1 && !r.events.backfire, 'no rocket ride / no bowl'),
  holdwater_bad: r => ok(r.events.backfire >= 1 && r.selfFlipped, 'no backfire'),
  parting: r => ok(r.hits >= 3 && r.st.partT && r.spread > 2, 'cars not parted (spread ' + r.spread + ')'),
  afterparty: r => ok(r.hits >= 2 && r.st.trainT && r.maxSpeed > r.vmax * 1.2, 'no rave train')
};

function pageCase(c) {
  const D = window.BRADY_CART.debug, STEP = 1 / 60;
  const id = c.id || c.key;
  try {
    D.start({ mode: 'quick', track: 'neon', car: 'heart', driver: c.drv, seed: 5, autoGas: true });
    const s = D.scene(); s.state = 'race'; s.stateT = 0; s.raceT = 0; s.autoDrive = true; window.BRADY.Input.setMode('game'); s.layoutControls(); s.update(STEP);
    const T = s.T, P = s.player; let best = 0, bk = 1; for (let i = 0; i < T.N; i += 4) { let kk = 0; for (let j = 0; j < 70; j += 3) kk += Math.abs(T.K[(i + j) % T.N]); if (kk < bk) { bk = kk; best = i; } }
    const g = T.at(best * T.ds, {}); D.place(-1, g.x, g.z, g.yaw, { speed: 22 });
    let j = 0; for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = c.rivals[j++]; D.placeRel(i, r[0], r[1], { speed: r[2] ? 0 : (c.rivalSpeed || 20), frozen: !!r[2] }); }
    for (const k of s.karts) { k.wpn.t = 99; k.invT = 0; k.item = null; k.roul = 0; k.prevS = k.loc.s; k.lap = 1; k.prog = k.loc.s; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } }
    if (!P.ai) s.aiInput(P, STEP, true); P.ai.itemT = 99; P.ai.fireT = 99;
    if (c.pre === 'rivalItem') { const o = s.karts.find(k => !k.player && k.prog > P.prog && k.prog - P.prog < 25); if (o) o.item = 'devil'; }
    if (c.pre === 'slowed') { P.foamT = 3; P.slowT = 3; P.gooT = 2; }
    if (c.rng) { const v = c.rng; s.rng = () => v; }
    s.snapCam = true; D.run(0.3, 10);
    s.events.length = 0;
    const d0 = s.karts.map(k => k.loc.d);
    const U = c.user ? s.karts.find(k => !k.player && Math.abs(k.prog - P.prog - 30) < 3) : P; window.__U = U.id;
    U.item = id; U.roul = 0; s.useItem(U);
    const m = { maxSpeed: 0, flew: false, immune: false, st: {}, selfMax: {}, maxBars: 0, maxCones: 0, selfFlipped: false, clearedSlow: false, shot: false };
    const steps = Math.round(c.secs * 60);
    for (let f = 0; f < steps; f++) {
      if (c.after === 'bar' && f === 70) { const b = s.drv.bars.find(o => o.live && !o.down); const o = s.karts.find(k => !k.player && k.id !== window.__U); if (b && o) D.place(s.karts.indexOf(o), b.gx - b.tx * 4, b.gz - b.tz * 4, Math.atan2(b.tx, b.tz), { speed: 10, frozen: false }); }
      s.update(STEP);
      if (c.shotAt && !m.shot && f >= Math.round(c.shotAt * 60)) { m.shot = true; break; }
      m.maxSpeed = Math.max(m.maxSpeed, P.speed); if (P.fly) m.flew = true; if (P.immuneT > 0) m.immune = true; if (P.flipT > 0) m.selfFlipped = true;
      for (const key of ['joyT', 'darkT']) if (P[key] > 0) m.selfMax[key] = 1;
      if (f === 12 && c.pre === 'slowed') m.clearedSlow = P.foamT === 0 && P.slowT === 0 && P.gooT === 0;
      for (const k of s.karts) { if (k.player) continue; for (const key of ['crawlT', 'mixT', 'lostT', 'trainT', 'partT', 'boredT', 'spinT', 'slowT']) if (k[key] > 0) m.st[key] = (m.st[key] || 0) + 1; }
      if (s.drv) { m.maxBars = Math.max(m.maxBars, s.drv.bars.filter(b => b.live).length); m.maxCones = Math.max(m.maxCones, s.drv.cones.filter(b => b.live).length); }
    }
    window.__m = m; window.__c = c; window.__d0 = d0;
    return { ok: true };
  } catch (e) { return { err: String(e && e.stack || e).slice(0, 600) }; }
}
// finish the case after the screenshot: keep stepping, then measure
function pageFinish() {
  const D = window.BRADY_CART.debug, STEP = 1 / 60, s = D.scene(), P = s.player, c = window.__c, m = window.__m, id = c.id || c.key;
  try {
    const rest = Math.round((c.secs - (c.shotAt || 0)) * 60);
    for (let f = 0; f < rest; f++) {
      if (c.after === 'bar' && !m.placed && s.drv) { const b = s.drv.bars.find(o => o.live && !o.down && o.t > o.drop); const o = s.karts.find(k => !k.player && k.id !== window.__U); if (b && o) { m.placed = true; D.place(s.karts.indexOf(o), b.gx - b.tx * 5, b.gz - b.tz * 5, Math.atan2(b.tx, b.tz), { speed: 12, frozen: false }); o.ai.itemT = 99; } }
      s.update(STEP);
      m.maxSpeed = Math.max(m.maxSpeed, P.speed); if (P.fly) m.flew = true; if (P.immuneT > 0) m.immune = true; if (P.flipT > 0) m.selfFlipped = true;
      for (const key of ['joyT', 'darkT']) if (P[key] > 0) m.selfMax[key] = 1;
      for (const k of s.karts) { if (k.player) continue; for (const key of ['crawlT', 'mixT', 'lostT', 'trainT', 'partT', 'boredT', 'spinT', 'slowT']) if (k[key] > 0) m.st[key] = (m.st[key] || 0) + 1; }
      if (s.drv) { m.maxBars = Math.max(m.maxBars, s.drv.bars.filter(b => b.live).length); m.maxCones = Math.max(m.maxCones, s.drv.cones.filter(b => b.live).length); }
    }
    let hits = 0; const kinds = {}, events = {};
    for (const e of s.events) { if (e.type === 'hit' && e.by === window.__U && (e.item || e.w) === id) { hits++; kinds[e.kind] = (kinds[e.kind] || 0) + 1; } if (e.type !== 'hit') events[e.type] = (events[e.type] || 0) + 1; }
    const tg = s.karts.find(k => !k.player && window.__d0 && true);
    let spread = 0; if (id === 'parting') s.karts.forEach((k, i) => { if (!k.player && Math.abs(window.__d0[i] - P.loc.d) < 6) spread = Math.max(spread, Math.abs(k.loc.d - window.__d0[i])); });
    const rivalItem = s.karts.some(k => !k.player && k.item === 'devil');
    const passedOk = s.events.some(e => e.type === 'pass');
    return { hits, kinds, events, maxSpeed: +m.maxSpeed.toFixed(1), vmax: +P.vmax.toFixed(1), flew: m.flew, immune: m.immune, st: m.st, selfMax: m.selfMax, maxBars: m.maxBars, maxCones: m.maxCones, selfFlipped: m.selfFlipped, clearedSlow: m.clearedSlow, playerItem: P.item, rivalItem, passedOk, spread: +spread.toFixed(1), draws: s.stats.draws, tris: s.stats.tris };
  } catch (e) { return { err: String(e && e.stack || e).slice(0, 600) }; }
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
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready && window.BRADY_CART && window.BRADY_CART.debug.drivers, null, { timeout: 600000 });
  await page.evaluate(() => { window.BRADY.Game.frame = () => {}; });

  // 1. roster
  if (!only) {
    const r = await page.evaluate(() => { const B = window.BRADY_BURNS; return { list: window.BRADY_CART.debug.drivers(), guide: B.CART_DRIVERS.map(d => !!(B.CART_ITEM_FX[d.special] && B.CART_ITEM_FX[d.special].use && B.CART_ITEM_FX[d.special].icon && B.CART_ITEM_FX[d.special].aiWants)) }; });
    const ids = r.list.map(d => d.id);
    console.log('roster:', r.list.map(d => d.id + '(' + d.stat + ', ' + d.specialName + ')').join(' '));
    if (JSON.stringify(ids) !== JSON.stringify(WANT)) fails.push('roster is ' + ids.join(','));
    r.list.forEach((d, i) => { if (!d.stat || !d.specialName || !r.guide[i]) fails.push(d.id + ': stat/special/effect missing'); });

    // 2. stats on Jelly Jolt (3, 4, 4, 2)
    const st = await page.evaluate(() => {
      const D = window.BRADY_CART.debug, o = {};
      for (const d of D.drivers()) { D.start({ mode: 'quick', track: 'esplanade', car: 'jelly', driver: d.id, seed: 3 }); const k = D.kartDrv(-1); o[d.id] = { vmax: k.vmax, acc: k.acc, turn: k.turn, mass: k.mass, drv: k.drv }; }
      return o;
    });
    const base = { speed: 3, accel: 4, handling: 4, weight: 2 }, f = { vmax: v => 25.5 + v.speed * 0.75, acc: v => 8.5 + v.accel * 2.7, turn: v => 1.4 + v.handling * 0.14, mass: v => 0.7 + v.weight * 0.15 };
    for (const d of r.list) {
      const v = Object.assign({}, base); v[d.stat]++; const got = st[d.id];
      for (const key in f) if (Math.abs(got[key] - f[key](v)) > 0.002) fails.push(`${d.id}: ${key} ${got[key]} != ${f[key](v).toFixed(3)} (+1 ${d.stat})`);
    }
    console.log('stats ok for', Object.keys(st).length, 'drivers');

    // 3. retired drivers fall back to Brady (requested and saved)
    const fb = await page.evaluate(() => {
      const D = window.BRADY_CART.debug, B = window.BRADY_BURNS, o = {};
      for (const id of ['man', 'undercovercop', 'partiedtoohard', 'furry', 'cultleader']) { D.start({ mode: 'quick', track: 'esplanade', car: 'heart', driver: id, seed: 3 }); o[id] = D.scene().player.drv.id; }
      const sv = B.cartSave(); sv.driver = 'undercovercop'; o.saved = B.cartSave().driver;
      D.start({ mode: 'quick', track: 'esplanade', car: 'heart', seed: 3 }); o.rivals = D.scene().karts.map(k => k.drv.id);
      return o;
    });
    for (const id of ['man', 'undercovercop', 'partiedtoohard', 'furry', 'cultleader']) if (fb[id] !== 'brady') fails.push('retired ' + id + ' -> ' + fb[id]);
    if (fb.saved !== 'brady') fails.push('saved retired driver -> ' + fb.saved);
    if (fb.rivals.some(d => !WANT.includes(d))) fails.push('a retired driver raced as a rival: ' + fb.rivals.join(','));
    console.log('fallback:', JSON.stringify(fb));

    // 5. rolls: own special only, rate by bucket
    const roll = await page.evaluate(() => {
      const B = window.BRADY_BURNS, rng = (() => { let a = 12345; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })();
      const o = { lead: 0, back: 0, other: 0, car: 0, pool: 0, n: 4000 };
      for (let i = 0; i < o.n; i++) { const a = B.cartRollItem(1, 8, rng, null, 'fish', 'dpw'), b = B.cartRollItem(8, 8, rng, null, 'fish', 'dpw', 'heart'); if (a === 'roadwork') o.lead++; if (b === 'roadwork') o.back++; if (a === 'decoys' || b === 'decoys') o.car++; if (b === 'throb') o.pool++; for (const x of [a, b]) if (B.CART_ITEMS[x] && B.CART_ITEMS[x].driver && x !== 'roadwork') o.other++; }
      return o;
    });
    console.log('rolls:', JSON.stringify(roll));
    if (roll.other) fails.push('another driver\'s special rolled');
    if (roll.lead / roll.n > 0.06 || roll.lead === 0 || roll.back / roll.n < 0.08 || roll.back / roll.n > 0.2) fails.push('driver special odds off: ' + JSON.stringify(roll));
    if (roll.pool / roll.n < 0.05) fails.push('level car special missing from the pool');

    // driver select screen (landscape + portrait)
    for (const [w, h, tag] of [[844, 390, 'land'], [390, 844, 'port']]) {
      await page.setViewportSize({ width: w, height: h });
      for (const id of ['brady', 'messiah', 'partyboy']) {
        await page.evaluate(id => { const B = window.BRADY_BURNS; B.cartSave().driver = id; const D = window.BRADY_CART.debug; D.menu({ state: 'driver' }); const sc = window.BRADY.Game.scene; if (sc.resize) sc.resize(); for (let i = 0; i < 40; i++) { sc.update && sc.update(1 / 60); } }, id);
        for (let i = 0; i < 6; i++) await page.evaluate(() => { const G = window.BRADY.Game; G.ctx.setTransform(1, 0, 0, 1, 0, 0); G.scene.draw(G.ctx); });
        const file = path.join(out, `select-${tag}-${id}.png`); await page.screenshot({ path: file }); console.log(file);
      }
    }
    await page.setViewportSize({ width: 844, height: 390 });
  }

  // 4. every special
  for (const key in CASES) {
    const c = Object.assign({ key }, CASES[key]); if (only && key !== only && c.id !== only) continue;
    const a = await page.evaluate(pageCase, c);
    if (a.err) { fails.push(key + ': ' + a.err); console.log('FAIL', key, a.err); continue; }
    await page.evaluate(() => { const D = window.BRADY_CART.debug; const s = D.scene(); for (let i = 0; i < 3; i++) { s.lastFrame = performance.now() - 16; D.frame(); } });
    const file = path.join(out, 'special-' + key + '.png'); await page.screenshot({ path: file });
    const r = await page.evaluate(pageFinish);
    if (r.err) { fails.push(key + ': ' + r.err); console.log('FAIL', key, r.err); continue; }
    const why = EXPECT[key](r);
    console.log((why ? 'FAIL ' : 'ok   ') + key.padEnd(14), JSON.stringify(r), why || '', file);
    if (why) fails.push(key + ': ' + why);
  }
  await browser.close(); srv.close();
  if (errs.length) console.log('PAGE ERRORS:\n' + errs.slice(0, 12).join('\n'));
  if (fails.length) console.log('FAILURES:\n' + fails.join('\n'));
  process.exit(errs.length || fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
