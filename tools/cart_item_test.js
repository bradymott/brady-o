// Art Cart item test: every gift-box item, every car's signature special, every car weapon and every arena power is
// used for real in a race (and in the battle arenas), with rivals placed in range, and must do something measurable.
//   node tools/cart_item_test.js [outDir=shots/items] [onlyId]
// For each case: starts the course, puts the player on autopilot and the rivals around it, gives/uses the item (or fires
// the weapon), steps the simulation and measures: hit events credited to the item, rivals' states (foamed, lovestruck,
// stuck, stunned, flipped…), the player's flight height / speed / progress, the item's live objects (ducks, bombs…).
// Then a matrix: the sky drops and the flights in every arena (and a Grand Prix race) — no errors, an effect, a safe
// landing. Then the render cost (draw calls, triangles) of a duck downpour and a bombing run in the busiest view.
// Exits non-zero on any failed expectation or page error. Serves $BRADY_DIST/site (or dist/site).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'items'));
const only = process.argv[3] || null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json' };
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }

// ---- runs inside the page: one case -> measurements ----
function pageRun(c) {
  const D = window.BRADY_CART.debug, B = window.BRADY_BURNS, STEP = 1 / 60;
  const errs = [];
  // an older build without the item helpers (for before/after audits): place rivals by hand
  if (!D.placeRel) D.placeRel = (i, ds, lat, o) => { const s = D.scene(), k = s.player; let x, z, yaw; if (s.T && s.isRace) { const g = s.T.at(k.loc.s + ds, {}); x = g.x + g.nx * g.hw * lat; z = g.z + g.nz * g.hw * lat; yaw = g.yaw; } else { const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw); x = k.x + fx * ds - fz * lat * 8; z = k.z + fz * ds + fx * lat * 8; yaw = k.yaw; } return D.place(i, x, z, yaw, o); };
  if (c.kind !== 'weapon' && !B.CART_ITEMS[c.id]) return { err: 'unknown item ' + c.id };
  try {
    D.start({ mode: c.mode || 'quick', track: c.track || 'esplanade', arena: c.arena, objective: c.objective || 'vibe', car: c.car || 'heart', driver: 'brady', seed: c.seed || 5, autoGas: true });
    const s = D.scene();
    if (s.state !== 'intro') return { err: 'load state ' + s.state };
    s.state = 'race'; s.stateT = 0; s.raceT = 0;
    s.autoDrive = true;
    s.update(STEP);
    const race = !!(s.T && s.isRace), P = s.player;
    // the player somewhere straight-ish on the course (races) or in the open (arenas)
    if (race) { const T = s.T; let best = 0, bk = 1; for (let i = 0; i < T.N; i += 4) { let kk = 0; for (let j = 0; j < 60; j += 3) kk += Math.abs(T.K[(i + j) % T.N]); if (kk < bk) { bk = kk; best = i; } } const g = T.at(best * T.ds, {}); D.place(-1, g.x, g.z, g.yaw, { speed: c.speed || 22 }); }
    else { const E = s.E; let best = null, bd = -1; for (const sp of E.spawn) { const w = E.walls ? s.wallDist(sp.x, sp.z, {}).d : 50; if (w > bd) { bd = w; best = sp; } } const yaw = Math.atan2(-best.x, -best.z); D.place(-1, best.x, best.z, yaw, { speed: c.speed || 18 }); }
    // rivals: c.rivals = [[ds, lat, frozen]] relative to the player (default: a spread ahead and around)
    const R = c.rivals || [[9, 0.3, 0], [16, -0.3, 0], [28, 0, 0], [45, 0.4, 0], [70, -0.3, 0], [-9, 0, 0], [110, 0, 0]];
    let j = 0;
    for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = R[j++]; if (!r) { D.placeRel(i, -60 - j * 8, 0, { frozen: true }); continue; } D.placeRel(i, r[0], r[1], { speed: r[2] ? 0 : (c.rivalSpeed || 20), frozen: !!r[2] }); }
    for (const k of s.karts) { k.wpn.t = 99; k.invT = 0; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } k.item = null; k.roul = 0; if (race) { k.prevS = k.loc.s; k.lap = 1; k.prog = k.loc.s; } }
    if (!P.ai) s.aiInput(P, STEP, true);
    P.ai.itemT = 99; P.ai.fireT = 99;
    s.events.length = 0;
    const gh0 = s.terrain.height(P.x, P.z), prog0 = P.prog || 0, rprog0 = s.karts.map(k => k.prog || 0);
    if (c.pre === 'stun') P.stunT = 1.5;
    // use it
    if (c.kind === 'weapon') { D.rearm(-1); s.fireWeapon(P); }
    else { D.give(c.id); s.useItem(P); }
    const m = { hits: 0, victims: new Set(), kinds: {}, duck: 0, blocked: 0, maxH: 0, endH: 0, maxSpeed: 0, flew: false, sunk: false, carried: 0, maxList: 0, maxDucks: 0, ducksDown: 0, maxShots: 0, maxHaz: 0, st: {}, selfFx: {}, jump: 0, immune: false };
    const stateKeys = ['foamT', 'charmT', 'gooT', 'stunT', 'dazzleT', 'spinT', 'flipT', 'slowT', 'bubbleT'];
    let lastProg = P.prog || 0;
    const steps = Math.round((c.secs || 4) * 60);
    for (let f = 0; f < steps; f++) {
      if (c.after && f === Math.round(c.after.t * 60)) {
        // put a rival onto what the item left behind (mines, slime, a dropped tumbleweed, a porta-potty, a trap…)
        let x, z;
        if (c.after.what === 'mine') { const mm = s.props.mines.find(o => o.alive); if (mm) { x = mm.gx; z = mm.gz; } }
        if (c.after.what === 'slime') { const h = s.hazards.find(o => o.type === 'slime'); if (h) { x = h.x; z = h.z; } }
        if (c.after.what === 'tumble') { const o = s.props.tumbles.find(q => q.alive); if (o) { x = o.gx; z = o.gz; } }
        if (c.after.what === 'potty') { const o = s.props.potties.find(q => q.alive); if (o) { x = o.gx; z = o.gz; } }
        if (c.after.what === 'prism') { const r = s.ix.list.find(q => q.type === 'prism'); if (r) { x = r.x; z = r.z; } }
        if (c.after.what === 'shoot') { const o = s.karts.find(k => !k.player); s.hit(P, 'spin', o, { weapon: 'test' }); }
        if (x !== undefined) { const i = s.karts.findIndex(k => !k.player); D.place(i, x, z, 0, { frozen: false, speed: 2 }); }
      }
      s.update(STEP);
      const gh = s.terrain.height(P.x, P.z), h = P.y - gh;
      m.maxH = Math.max(m.maxH, h); m.maxSpeed = Math.max(m.maxSpeed, P.speed);
      if (P.fly) m.flew = true; if (P.sunk) m.sunk = true; if (P.immuneT > 0) m.immune = true;
      const dp = (P.prog || 0) - lastProg; if (dp > m.jump) m.jump = dp; lastProg = P.prog || 0;
      for (const k of s.karts) { if (k.player) continue; if (k.carry) m.carried++; for (const key of stateKeys) if (k[key] > 0) m.st[key] = (m.st[key] || 0) + 1; }
      for (const key of ['shieldT', 'boostT', 'ghostT', 'tiresT', 'jetT', 'slimeT', 'dashT']) if (P[key] > 0) m.selfFx[key] = 1;
      if (P.sk && P.sk.waxT > 0) m.selfFx.wax = 1;
      if (P.guard) m.selfFx.guard = 1;
      if (s.ix) { m.maxList = Math.max(m.maxList, s.ix.list.length); const dl = s.ix.ducks.filter(d => d.live).length; m.maxDucks = Math.max(m.maxDucks, dl); m.ducksDown = Math.max(m.ducksDown, s.ix.ducks.filter(d => d.live && d.rest).length); }
      m.maxShots = Math.max(m.maxShots, s.shots.length); m.maxHaz = Math.max(m.maxHaz, s.hazards.length);
      if (s.state !== 'race') break;
    }
    const id = c.id;
    for (const e of s.events) {
      if (e.type === 'hit' && (e.w || e.item) === id && e.by === P.id) { m.hits++; m.victims.add(e.k); m.kinds[e.kind] = (m.kinds[e.kind] || 0) + 1; }
      if (e.type === 'duck') m.duck++;
      if (e.type === 'blocked' && e.k === P.id) m.blocked++;
    }
    const gh = s.terrain.height(P.x, P.z); m.endH = P.y - gh;
    let onCourse = true;
    if (race) { const L = s.T.locate(P.x, P.z, P.loc.i, {}); onCourse = Math.abs(L.d) < Math.max(s.T.WR[L.i], s.T.WL[L.i]) + 0.5; }
    else if (s.E.walls) onCourse = s.wallDist(P.x, P.z, {}).d > 0;
    return { state: s.state, hits: m.hits, victims: m.victims.size, kinds: m.kinds, duck: m.duck, blocked: m.blocked, maxH: +m.maxH.toFixed(2), endH: +m.endH.toFixed(2), maxSpeed: +m.maxSpeed.toFixed(1), vmax: +P.vmax.toFixed(1), flew: m.flew, sunk: m.sunk, immune: m.immune, carried: m.carried, jump: +m.jump.toFixed(1), prog: +((P.prog || 0) - prog0).toFixed(1), maxList: m.maxList, maxDucks: m.maxDucks, ducksDown: m.ducksDown, maxShots: m.maxShots, maxHaz: m.maxHaz, st: m.st, selfFx: m.selfFx, stunAfter: +P.stunT.toFixed(2), onCourse, out: P.out, air: P.air,
      flying: !!P.fly, moonFloat: !!P.moonFloat, rivalsBehind: race ? s.karts.filter((k, i) => !k.player && (k.prog || 0) < (P.prog || 0) && rprog0[i] > prog0).length : 0, errs };
  } catch (e) { return { err: String(e && e.stack || e).slice(0, 500) }; }
}

// ---- what each one must do ----
const ok = (cond, why) => cond ? null : why;
const EXPECT = {
  // signature weapons
  bassdrop: r => ok(r.hits >= 1, 'no car knocked'), dazzle: r => ok(r.hits >= 1, 'nobody dazzled'), torch: r => ok(r.hits >= 1, 'nobody toasted'),
  fireball: r => ok(r.hits >= 1, 'no fireball hit'), bubbles: r => ok(r.hits >= 1, 'nobody bubbled'), laser: r => ok(r.hits >= 1, 'laser hit nobody'),
  sprinkles: r => ok(r.hits >= 1, 'no mine went off'), cannon: r => ok(r.hits >= 1, 'no cannonball hit'), slime: r => ok(r.hits >= 1 && r.selfFx.slimeT, 'no slip / no turbo'),
  zap: r => ok(r.hits >= 1, 'nobody zapped'), chomp: r => ok(r.hits >= 1, 'nobody chomped'), geyser: r => ok(r.hits >= 1, 'nobody launched'),
  // gift-box items
  glow: r => ok(r.selfFx.boostT && r.maxSpeed > r.vmax * 1.12, 'no speed boost'), water: r => ok(r.stunAfter === 0 && r.selfFx.boostT, 'did not clear the stun / no boost'),
  tumble: r => ok(r.hits >= 1, 'tumbleweed spun nobody'), devil: r => ok(r.hits >= 2 && r.kinds.whirl, 'dust devil whirled fewer than 2 cars'),
  potty: r => ok(r.hits >= 1, 'porta-potty spun nobody'), foam: r => ok(r.hits >= 2 && r.st.foamT > 30, 'foam party foamed fewer than 2 cars'),
  shield: r => ok(r.selfFx.shieldT && r.blocked >= 1, 'shield did not block'), whistle: r => ok(r.hits >= 2, 'whistle slowed fewer than 2 cars'),
  skymail: r => ok(r.hits >= 2 && r.kinds.launch, 'sky mail blasted fewer than 2 cars'), bombs: r => ok(r.hits >= 1 && r.kinds.flip, 'no bomb hit'),
  ducks: r => ok(r.maxDucks >= 30 && r.ducksDown >= 10 && r.duck >= 2, 'ducks did not rain / litter / bump (' + r.maxDucks + '/' + r.ducksDown + '/' + r.duck + ')'),
  // car specials
  throb: r => ok(r.hits >= 2 && r.st.charmT > 30, 'fewer than 2 lovestruck'), decoys: r => ok(r.selfFx.guard && r.blocked >= 1, 'decoys blocked nothing'),
  toss: r => ok(r.hits >= 1 && r.carried > 20 && r.rivalsBehind >= 1, 'nobody thrown behind'),
  glide: r => ok(r.flew && r.maxH > 5.5 && r.endH < 0.6 && r.onCourse && r.hits >= 1, 'flight / landing / scorch failed'),
  breach: r => ok(r.flew && r.maxH > 8 && r.endH < 0.6 && r.onCourse, 'breach flight / landing failed'),
  hover: r => ok(r.flew && r.maxH > 3 && r.hits >= 1 && r.endH < 0.6, 'hover / zap failed'),
  shell: r => ok(r.flew && r.maxH > 4 && r.immune && r.maxHaz >= 3 && r.endH < 0.6, 'shell bounce failed'),
  dive: r => ok(r.sunk && r.immune && r.hits >= 1 && r.kinds.launch, 'sand dive / burst failed'),
  warp: r => ok(r.jump > 35 && r.onCourse && r.hits >= 1, 'no warp jump / trap'), frosting: r => ok(r.hits >= 1 && r.st.gooT > 30, 'nobody stuck'),
  wave: r => ok(r.hits >= 2, 'wave caught fewer than 2'), surf: r => ok(r.maxSpeed > r.vmax * 1.2 && r.hits >= 1, 'no surge / no bowl'),
  // arena powers: an effect on a rival or on the user
  _power: r => ok(r.hits >= 1 || Object.keys(r.selfFx).some(k => k !== 'boostT') || r.maxH > 2.5 || (r.selfFx.boostT && r.maxSpeed > r.vmax * 1.12), 'no measurable effect')
};
// per-case setup: which car, where the rivals are, what to do after
const CASES = [];
const W = { bassdrop: 'heart', dazzle: 'fish', torch: 'octo', fireball: 'dragon', bubbles: 'duck', laser: 'pyramid', sprinkles: 'cupcake', cannon: 'galleon', slime: 'snail', zap: 'jelly', chomp: 'shark', geyser: 'whale' };
const CLOSE = [[6, 0.25, 0], [10, -0.3, 0], [18, 0, 0], [26, 0.3, 0], [40, -0.2, 0], [-8, 0, 0], [60, 0, 0]];
const LINE = [[14, 0, 1], [24, 0.15, 1], [34, -0.1, 1], [-8, 0, 0], [50, 0, 1], [80, 0.2, 1], [120, 0, 1]];
const SIDE = [[0.5, 0.55, 1], [-1, -0.55, 1], [6, 0.2, 0], [20, 0, 0], [40, 0, 0], [-8, 0, 0], [70, 0, 0]];
for (const w in W) CASES.push({ id: w, kind: 'weapon', car: W[w], rivals: w === 'cannon' ? SIDE : w === 'chomp' || w === 'laser' || w === 'dazzle' || w === 'fireball' || w === 'bubbles' ? LINE : CLOSE, after: w === 'sprinkles' ? { t: 0.8, what: 'mine' } : w === 'slime' ? { t: 0.6, what: 'slime' } : null, secs: 3.5 });
const ITEM = {
  glow: {}, water: { pre: 'stun' }, tumble: { after: { t: 0.5, what: 'tumble' } }, devil: { rivals: [[20, 0.2, 0], [35, -0.3, 0], [55, 0.3, 0], [80, 0, 0], [100, 0, 0], [-10, 0, 0], [130, 0, 0]], secs: 6 },
  potty: { after: { t: 1.6, what: 'potty' }, secs: 4 }, foam: { rivals: CLOSE }, shield: { after: { t: 0.5, what: 'shoot' } }, whistle: {},
  skymail: { secs: 4 }, bombs: { rivals: [[46, 0.45, 1], [58, -0.45, 1], [70, 0.45, 1], [94, 0.45, 1], [-10, 0, 0], [-20, 0, 0], [-30, 0, 0]], secs: 4 },
  ducks: { rivals: [[18, 0.3, 0], [30, -0.4, 0], [42, 0.1, 0], [-12, 0, 0], [60, 0.5, 0], [-20, -0.3, 0], [80, 0, 0]], secs: 7, rivalSpeed: 24 }
};
for (const id in ITEM) CASES.push(Object.assign({ id, kind: 'item', car: 'heart' }, ITEM[id]));
const SPECIAL = {
  heart: {}, fish: { after: { t: 0.5, what: 'shoot' } }, octo: { rivals: CLOSE }, dragon: { rivals: [[25, 0, 1], [40, 0.2, 1], [55, -0.2, 1], [-10, 0, 0], [70, 0, 1], [90, 0.3, 1], [-25, 0, 0]], secs: 6.5 },
  duck: { rivals: [[12, 0, 1], [24, 0.3, 1], [40, -0.2, 1], [-8, 0, 0], [60, 0, 1], [80, 0, 0], [-20, 0, 0]], secs: 5 },
  pyramid: { after: { t: 1.2, what: 'prism' }, secs: 3 }, cupcake: { rivals: [[30, 0, 1], [31, 0.5, 1], [-8, 0, 0], [60, 0, 0], [80, 0, 0], [-20, 0, 0], [100, 0, 0]], secs: 3 },
  galleon: { rivals: [[20, 0.3, 0], [32, -0.3, 0], [45, 0, 0], [-8, 0, 0], [70, 0, 0], [-20, 0, 0], [100, 0, 0]], secs: 3.5 },
  snail: { rivals: CLOSE, secs: 5 }, jelly: { rivals: [[12, 0, 1], [24, 0.1, 1], [36, -0.1, 1], [-8, 0, 0], [60, 0, 1], [80, 0, 0], [-20, 0, 0]], secs: 6.5 },
  shark: { rivals: [[60, 0, 1], [75, 0, 1], [90, 0, 1], [105, 0, 1], [-8, 0, 0], [-20, 0, 0], [140, 0, 0]], secs: 4 }, whale: { secs: 6 }
};
const SPECIAL_ID = { heart: 'throb', fish: 'decoys', octo: 'toss', dragon: 'glide', duck: 'surf', pyramid: 'warp', cupcake: 'frosting', galleon: 'wave', snail: 'shell', jelly: 'hover', shark: 'dive', whale: 'breach' };
for (const car in SPECIAL) CASES.push(Object.assign({ id: SPECIAL_ID[car], kind: 'special', car }, SPECIAL[car]));

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
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready && window.BRADY_CART, null, { timeout: 120000 });
  await page.waitForTimeout(300);
  // arena powers: each in its own arena
  const powers = await page.evaluate(() => window.BRADY_BURNS.CART_ARENAS.flatMap(a => (a.powers || []).map(p => [a.id, p])));
  for (const [arena, p] of powers) CASES.push({ id: p, kind: 'power', mode: 'battle', arena, objective: 'vibe', car: 'heart', rivals: p === 'lantern' ? [[22, 0, 1], [27, 0.2, 1], [32, -0.2, 1], [-8, 0, 0], [40, 0.2, 0], [55, 0, 0], [-16, 0, 0]] : [[10, 0.2, 0], [18, -0.3, 0], [28, 0, 0], [-8, 0, 0], [40, 0.2, 0], [55, 0, 0], [-16, 0, 0]], secs: 4.5 });
  let bad = 0; const table = [];
  for (const c of CASES) {
    if (only && c.id !== only) continue;
    const r = await page.evaluate(pageRun, c);
    const why = r.err ? r.err : (EXPECT[c.kind === 'power' ? '_power' : c.id] || EXPECT._power)(r);
    if (why) bad++;
    table.push([c.kind, c.id, c.car, why ? 'FAIL' : 'ok']);
    console.log((why ? 'FAIL ' : 'ok   ') + c.kind.padEnd(8) + c.id.padEnd(11) + (c.arena || c.car).padEnd(8) + (why ? ' ← ' + why + ' ' : ' ') + JSON.stringify(r.err ? {} : { hits: r.hits, victims: r.victims, kinds: r.kinds, st: r.st, maxH: r.maxH, endH: r.endH, maxSpeed: r.maxSpeed, vmax: r.vmax, jump: r.jump, prog: r.prog, duck: r.duck, maxDucks: r.maxDucks, ducksDown: r.ducksDown, blocked: r.blocked, carried: r.carried, behind: r.rivalsBehind, onCourse: r.onCourse, selfFx: r.selfFx }));
  }
  // the matrix: sky drops + flights + foam/devil in every arena and a Grand Prix race (errors, an effect, safe landings)
  const OLD = !!process.env.OLD;   // auditing an older build: just the per-item cases
  if (!OLD && (!only || only === 'matrix')) {
    const arenas = await page.evaluate(() => window.BRADY_BURNS.CART_ARENAS.map(a => a.id));
    const M = [['skymail', 'heart'], ['bombs', 'heart'], ['ducks', 'heart'], ['foam', 'heart'], ['devil', 'heart'], ['glide', 'dragon'], ['breach', 'whale'], ['hover', 'jelly'], ['shell', 'snail'], ['dive', 'shark'], ['warp', 'pyramid'], ['toss', 'octo'], ['wave', 'galleon'], ['frosting', 'cupcake'], ['surf', 'duck'], ['throb', 'heart'], ['decoys', 'fish']];
    const rings = [[8, 0.2, 0], [14, -0.3, 0], [22, 0, 0], [-8, 0, 0], [30, 0.3, 0], [40, 0, 0], [-16, 0, 0]];
    for (const where of arenas.concat(['gp'])) {
      for (const [id, car] of M) {
        const c = where === 'gp' ? { id, kind: 'item', mode: 'gp', car, secs: 6 } : { id, kind: 'item', mode: 'battle', arena: where, objective: 'vibe', car, rivals: rings, secs: 6 };
        const r = await page.evaluate(pageRun, c);
        const flight = ['glide', 'breach', 'hover', 'shell', 'warp'].includes(id);
        const why = r.err ? r.err : flight ? ok((r.flew || r.jump > 20) && !r.flying && (r.endH < 1.0 || r.moonFloat) && r.onCourse && !r.out, 'flight did not land safely on the course (endH ' + r.endH + ', onCourse ' + r.onCourse + ')')
          : id === 'ducks' ? ok(r.maxDucks >= 30, 'no ducks') : id === 'decoys' ? ok(r.selfFx.guard, 'no decoys') : id === 'dive' ? ok(r.sunk && r.onCourse, 'no dive') : id === 'surf' ? ok(r.maxSpeed > r.vmax * 1.15 || r.hits >= 1 || r.selfFx.boostT, 'no surge, nobody bowled') : ok(r.hits >= 1 || id === 'bombs' || id === 'wave' || id === 'frosting', 'no hit');
        if (why) bad++;
        console.log((why ? 'FAIL ' : 'ok   ') + 'matrix  ' + id.padEnd(11) + where.padEnd(8) + (why ? ' ← ' + why + ' ' : ' ') + JSON.stringify(r.err ? {} : { hits: r.hits, maxH: r.maxH, endH: r.endH, onCourse: r.onCourse, maxDucks: r.maxDucks }));
      }
    }
  }
  // render cost: a duck downpour and a bombing run in front of the player, in a full night race and the busiest arena
  if (!OLD && (!only || only === 'perf')) {
    for (const [mode, where] of [['gp', 'burn'], ['battle', 'temple'], ['battle', 'playa']]) for (const id of ['none', 'ducks', 'bombs', 'skymail']) {
      const r = await page.evaluate(async ([mode, where, id]) => {
        const D = window.BRADY_CART.debug;
        D.start(mode === 'gp' ? { mode: 'gp', cup: 'fire', race: 3, car: 'heart', driver: 'brady', seed: 3 } : { mode: 'battle', arena: where, objective: 'vibe', car: 'heart', driver: 'brady', seed: 3 });
        const s = D.scene(); s.state = 'race'; s.autoDrive = true; window.BRADY.Input.setMode('game'); s.layoutControls();
        D.run(1.5, 20);
        if (id !== 'none') { D.give(id); s.useItem(s.player); }
        // the items' own cost in the same frames: the mesh groups drawn (1 draw each) and their triangles
        let draws = 0, tris = 0, live = 0, itemDraws = 0, itemTris = 0;
        for (let i = 0; i < 12; i++) { D.run(0.25, 4); draws = Math.max(draws, s.stats.draws); tris = Math.max(tris, s.stats.tris); const G = s.ix ? s.ix.groups.filter(g => g.objs.some(o => o.live && o.visible)) : []; itemDraws = Math.max(itemDraws, G.length); itemTris = Math.max(itemTris, G.reduce((a, g) => a + g.geo.count / 3, 0)); live = Math.max(live, s.ix ? s.ix.ducks.filter(d => d.live && d.visible).length + s.ix.bombs.filter(b => b.live && b.visible).length + s.ix.missiles.filter(b => b.live && b.visible).length : 0); }
        return { draws, tris: Math.round(tris), live, itemDraws, itemTris, sprites: s.R.bbs.n + s.R.flat.n };
      }, [mode, where, id]);
      console.log('perf    ' + (mode + ':' + where).padEnd(14) + id.padEnd(9) + JSON.stringify(r));
    }
  }
  await browser.close(); srv.close();
  if (errs.length) { console.log('PAGE ERRORS:\n' + errs.slice(0, 12).join('\n')); process.exit(1); }
  console.log(bad ? bad + ' FAILED' : 'item test ok (' + table.length + ' cases)');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
