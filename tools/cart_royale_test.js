// Battle Royale test (C2): plays the royale through the debug API and fails on anything wrong.
//   node tools/cart_royale_test.js [outDir=shots/royale] [part=all|match|damage|boss|shots] [seeds=3]
// 1. MATCH: full AI-only matches (the player on autopilot, spectating to the end) in THE SOUND CAMP, THE MAN (phase 1)
//    and a stand-in arena: time to finish, first knock-out, the autopilot player's survival, every car's damage sources.
//    Asserts: finishes in ≤ 300 s, no errors, the average first knock-out ≥ 20 s, the autopilot survives ≥ 60 s on average,
//    every knocked-out car has logged damage sources.
// 2. DAMAGE: every signature weapon, gift-box item, car special (and driver special) used for real with rivals placed in
//    reach; every attacking one must take HP off a rival (damage events credited to it); WATER heals; SHIELD blocks;
//    GLOW makes a ram hurt. Plus the table sanity (every id has a sane value).
// 3. BOSS: the Man's fight from phase 2: every weapon / attacking item damages him, then a full fight to his defeat by
//    the autopilot with scripted attacks (the player kept alive), the result (bossDefeated, stageWon), and a fair-fight
//    estimate (the Man's damage to an autopilot player per minute).
// 4. SHOTS: the arenas from several places, the HUD (landscape 844x390, portrait 390x844), a fight, a knock-out, the
//    boss phases; peak draws / triangles over all of them (budget 120 draws, 420k triangles).
// Serves $BRADY_DIST/site (or dist/site). Exits non-zero on a failed expectation or a page error.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'royale'));
const part = process.argv[3] || 'all', NSEED = +(process.argv[4] || 3);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json' };
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }
const fails = []; const fail = m => { fails.push(m); console.log('  FAIL ' + m); };

// ---------------- in the page ----------------
function pgMatch(c) {
  const D = window.BRADY_CART.debug;
  try {
    D.start({ mode: 'royale', arena: c.arena, car: c.car || 'heart', driver: 'brady', seed: c.seed, autoGas: true });
    const s = D.scene(); if (s.state !== 'intro') return { err: 'load state ' + s.state };
    s.state = 'race'; s.stateT = 0; s.autoDrive = true; s.roy.keepGoing = true;
    const n = Math.round(320 * 60); let pOut = null;
    for (let i = 0; i < n && s.state === 'race'; i++) { s.update(1 / 60); if (pOut === null && s.player.out) pOut = s.raceT; if (s.roy.phase === 2) break; }
    const R = D.royale(), kos = s.events.filter(e => e.type === 'ko');
    return { arena: s.arenaId, seed: c.seed, state: s.state, phase: s.roy.phase, t: +s.raceT.toFixed(1), firstKO: R.firstKO === undefined ? null : +R.firstKO.toFixed(1), playerOut: pOut === null ? null : +pOut.toFixed(1), winner: (s.battleRank()[0] || {}).id,
      kos: kos.map(e => [e.k.split(':')[0], e.by ? e.by.split(':')[0] : '-', e.src, e.t]),
      karts: R.karts.map(k => ({ car: k.id.split(':')[0], player: k.player, hp: k.hp, outT: k.outT === undefined ? null : +(+k.outT).toFixed(1), kos: k.kos, dealt: k.dealt, taken: k.taken, dmgBy: k.dmgBy })) };
  } catch (e) { return { err: String(e && e.stack || e).slice(0, 600) }; }
}
// one attack used for real in the Sound Camp with rivals placed around the player
function pgDamage(c) {
  const D = window.BRADY_CART.debug, B = window.BRADY_BURNS, STEP = 1 / 60;
  try {
    D.start({ mode: 'royale', arena: 'sound', car: c.car || 'heart', driver: 'brady', seed: 5, autoGas: true, rivals: ['jelly', 'fish', 'dragon', 'duck', 'shark', 'whale', 'snail'] });
    const s = D.scene(); s.state = 'race'; s.stateT = 0; s.raceT = 0; s.autoDrive = true; s.update(STEP);
    // keep the subs and drones quiet (the player is far from the dance floor): only the item under test does damage
    if (s.snd) { for (const sb of s.snd.subs) sb.next = 999; for (const d of s.snd.drones) d.cool = 999; }
    const P = s.player, px = 0, pz = 150, yaw = Math.PI / 2;   // on the outer playa, heading +x (clear ground)
    D.place(-1, px, pz, yaw, { speed: c.speed === undefined ? 14 : c.speed });
    const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = -fz, rz = fx;
    const spots = c.rivals || [[9, 0], [18, 1.2], [30, -1], [45, 0], [-10, 0], [3, 5], [3, -5]];
    let j = 0;
    for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = spots[j++] || [-80 - j * 10, 30]; D.place(i, px + fx * r[0] + rx * r[1], pz + fz * r[0] + rz * r[1], yaw, { frozen: true }); }
    for (const k of s.karts) { k.invT = 0; k.wpn.t = 99; k.item = null; k.roul = 0; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } }
    P.ai = P.ai || null; s.autoDrive = false;
    s.events.length = 0;
    if (c.pre === 'hurt') D.hurt(-1, 50, 'test');
    const hp0 = P.hp, x0 = P.x, z0 = P.z;
    if (c.kind === 'weapon') { D.rearm(-1); s.fireWeapon(P); } else { D.give(c.id); s.useItem(P); }
    const steps = Math.round((c.secs || 4) * 60);
    for (let f = 0; f < steps; f++) {
      if (c.after && f === Math.round(c.after.t * 60)) {
        let x, z;
        if (c.after.what === 'mine') { const m = s.props.mines.find(o => o.alive); if (m) { x = m.gx; z = m.gz; } }
        if (c.after.what === 'slime') { const h = s.hazards.find(o => o.type === 'slime'); if (h) { x = h.x; z = h.z; } }
        if (c.after.what === 'tumble') { const o = s.props.tumbles.find(q => q.alive); if (o) { x = o.gx; z = o.gz; } }
        if (c.after.what === 'start') { x = x0; z = z0; }
        if (c.after.what === 'duck') { const d = s.ix && s.ix.ducks.find(o => o.live && o.visible && o.rest); if (d) { x = d.gx; z = d.gz; } }
        if (c.after.what === 'landing') { x = P.x + Math.sin(P.yaw) * 4 + 1.5; z = P.z + Math.cos(P.yaw) * 4; }
        if (c.after.what === 'behind') { x = P.x - Math.sin(P.yaw) * 6; z = P.z - Math.cos(P.yaw) * 6; }
        if (x !== undefined) { const i = s.karts.findIndex(k => !k.player); D.place(i, x - 1.5, z, yaw, { frozen: false, speed: 6 }); s.karts[i].invT = 0; }
      }
      if (c.ram && f === 30) { const i = s.karts.findIndex(k => !k.player); D.place(i, P.x + Math.sin(P.yaw) * 8, P.z + Math.cos(P.yaw) * 8, 0, { frozen: true }); s.karts[i].invT = 0; P.inp.gas = 1; }
      if (c.attacker && f === 6) { const i = s.karts.findIndex(k => !k.player && k.car.id === 'jelly'), k = s.karts[i]; D.place(i, P.x - Math.sin(P.yaw) * 12, P.z - Math.cos(P.yaw) * 12, P.yaw, { frozen: true }); k.wpn.t = 0; s.fireWeapon(k); }
      s.update(STEP);
    }
    const dmg = s.events.filter(e => e.type === 'dmg' && !e.player && (e.src === c.id || (c.kind === 'weapon' && e.src === c.id))), heal = s.events.filter(e => e.type === 'heal' && e.k === P.id);
    const ram = s.events.filter(e => e.type === 'dmg' && e.src === 'ram' && !e.player), blocked = s.events.filter(e => e.type === 'blocked' && e.k === P.id);
    return { id: c.id, kind: c.kind, dmg: +dmg.reduce((a, e) => a + e.n, 0).toFixed(1), victims: new Set(dmg.map(e => e.k)).size, heal: +heal.reduce((a, e) => a + e.n, 0).toFixed(1), ram: +ram.reduce((a, e) => a + e.n, 0).toFixed(1), blocked: blocked.length, hp0, hp1: +P.hp.toFixed(1), table: B.CART_ROY_DMG[c.id] };
  } catch (e) { return { id: c.id, err: String(e && e.stack || e).slice(0, 600) }; }
}
// the boss: one attack against the Man (phase 2 started directly)
function pgBossHit(c) {
  const D = window.BRADY_CART.debug, STEP = 1 / 60;
  try {
    D.start({ mode: 'royale', arena: 'man', car: c.car || 'heart', driver: 'brady', seed: 5, autoGas: true, phase: 2 });
    const s = D.scene(); s.state = 'race'; s.stateT = 0; s.raceT = 0; s.autoDrive = false;
    for (let i = 0; i < 20; i++) s.update(STEP);
    const B = s.boss, P = s.player; B.st = 'idle'; B.t = 0; B.dur = 99;   // he waits
    const d = c.dist || 20, a = 0.5; D.place(-1, Math.sin(a) * d, Math.cos(a) * d, a + Math.PI + (c.yawOff || 0), { speed: c.speed === undefined ? 6 : c.speed });
    P.invT = 0; s.events.length = 0; const hp0 = B.hp;
    if (c.kind === 'weapon') { D.rearm(-1); s.fireWeapon(P); } else { D.give(c.id); s.useItem(P); }
    for (let f = 0; f < Math.round((c.secs || 4) * 60); f++) { if (c.after === 'atFeet' && f === 30) { const m = s.props.mines.find(o => o.alive); if (m) { m.gx = Math.sin(a) * 13.5; m.gz = Math.cos(a) * 13.5; } } s.update(STEP); P.invT = Math.max(P.invT, 0.5); if (P.hp < 50) P.hp = 100; B.t = 0; }
    return { id: c.id, kind: c.kind, dmg: +(hp0 - B.hp).toFixed(1), srcs: B.dmgBy };
  } catch (e) { return { id: c.id, err: String(e && e.stack || e).slice(0, 600) }; }
}
// the whole boss fight on autopilot (kept alive) to his defeat
function pgBossFight(c) {
  const D = window.BRADY_CART.debug, STEP = 1 / 60;
  try {
    D.start({ mode: 'royale', arena: 'man', car: c.car || 'heart', driver: 'brady', seed: c.seed || 5, autoGas: true, phase: 2 });
    const s = D.scene(); s.state = 'race'; s.stateT = 0; s.raceT = 0; s.autoDrive = true;
    const B = s.boss, P = s.player; let taken = 0, lastHp = P.hp, t0 = null, states = {}, items = 0;
    for (let i = 0; i < 60 * 600 && s.state === 'race'; i++) {
      s.update(STEP);
      if (B.active && t0 === null) t0 = s.raceT;
      states[B.st] = (states[B.st] || 0) + 1;
      if (P.hp < lastHp) taken += lastHp - P.hp;
      if (c.keepAlive && P.hp < 35) P.hp = 100;
      lastHp = P.hp;
      // scripted attacks: a gift every 9 s (a real player picks up boxes), the weapon fires on reload (the autopilot)
      if (i % (9 * 60) === 0 && !P.item && B.active) { P.item = ['skymail', 'bombs', 'devil', 'potty', 'foam', 'water', 'glow', 'shield'][items++ % 8]; P.roul = 0; }
    }
    for (let i = 0; i < 60 * 12 && s.state === 'done'; i++) s.update(STEP);
    const R = s.roy;
    return { state: s.state, defeated: !!R.bossDefeated, fight: t0 === null ? null : +(s.raceT - t0).toFixed(1), bossHp: +B.hp.toFixed(1), bossBy: B.dmgBy, playerTaken: +taken.toFixed(1), perMin: t0 === null ? 0 : +(taken / Math.max(1, (s.raceT - t0) / 60)).toFixed(1), playerOut: P.out, result: R.result, stageWon: s.stageWon, results: s.results && s.results.slice(0, 2).map(r => [r.car, r.player, r.rank]), states };
  } catch (e) { return { err: String(e && e.stack || e).slice(0, 600) }; }
}

// the boss fight played by an imperfect, human-like autopilot (no keep-alive): it reacts late or early to the shockwave and
// the sweep (a timing error drawn per threat, sometimes it misses a hop outright), fires its weapon after a reaction delay and
// wastes some shots, uses gift items late and wastes some, and goes for a repair kit when it is low. A gift box roll every
// ~13 s stands in for picking up boxes. Returns the outcome and the fight length.
function pgBossHuman(c) {
  const D = window.BRADY_CART.debug, STEP = 1 / 60;
  try {
    D.start({ mode: 'royale', arena: 'man', car: c.car || 'heart', driver: 'brady', seed: c.seed || 5, autoGas: true, phase: 2 });
    const s = D.scene(); s.state = 'race'; s.stateT = 0; s.raceT = 0; s.autoDrive = true;
    const B = s.boss, P = s.player, H = Object.assign({ miss: 0.18, err: [-0.12, 0.22], fireDelay: [0.25, 1.4], waste: 0.25, itemDelay: [0.8, 4], itemWaste: 0.25, giftEvery: 13 }, c.h || {});
    let seed = (c.seed || 5) * 7919 + 13; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }, rr = a => a[0] + rnd() * (a[1] - a[0]);
    const threat = new Map(); let fireAt = -1, itemAt = -1, hops = 0, missed = 0, hitsBy = {}, shots = 0, wasted = 0;
    const rules = s.rules, step0 = rules.onStep, goal0 = rules.aiGoal;
    // a decision per threat: miss it, or hop with a timing error (seconds; + = late)
    const decide = key => { let d = threat.get(key); if (!d) { d = { miss: rnd() < H.miss, err: rr(H.err), done: false }; threat.set(key, d); } return d; };
    rules.onStep = function (s2, k, dt, racing) {
      if (!k.player || !B.active) return step0.call(this, s2, k, dt, racing);
      const I = k.inp, drift0 = I.driftPress, fire0 = I.fire, item0 = I.item;
      step0.call(this, s2, k, dt, racing);
      const wantFire = I.fire && !fire0, wantItem = I.item && !item0; I.driftPress = drift0; I.fire = fire0; I.item = item0;
      const r = Math.hypot(k.x, k.z), lead = 0.17;
      // the shockwave rolls out at 19 m/s: hop when it is (lead + err) seconds away
      B.waves.forEach((w, i) => { if (!w.live || w.r >= r) return; const d = decide('w' + i + ':' + w.born); const tta = (r - w.r) / 19; if (!d.done && !d.miss && tta <= lead + d.err) { d.done = true; I.driftPress = true; hops++; } if (!d.done && d.miss && tta < 0.05) { d.done = true; missed++; } });
      // the sweep line: hop when it reaches you (angular distance / its speed)
      const W = B.sweep; if (W && W.on && r > 12 && r < W.R) { const a = Math.atan2(k.x, k.z), da = cartWrapT(a - W.a) * W.dir, tta = da / W.w; const d = decide('s' + B.n); if (da > 0 && !d.done && !d.miss && tta <= lead * 0.8 + d.err * 0.8) { d.done = true; I.driftPress = true; hops++; } if (da > 0 && d.miss && !d.done && tta < 0.05) { d.done = true; missed++; } }
      // the weapon: after a reaction delay; some shots go wide (the reload is spent)
      if (wantFire) { if (fireAt < 0) fireAt = s2.raceT + rr(H.fireDelay); if (s2.raceT >= fireAt) { fireAt = -1; shots++; if (rnd() < H.waste) { wasted++; k.wpn.t = k.wpn.def.reload; } else I.fire = true; } } else if (k.wpn.t > 0) fireAt = -1;
      if (wantItem) { if (itemAt < 0) itemAt = s2.raceT + rr(H.itemDelay); if (s2.raceT >= itemAt) { itemAt = -1; if (rnd() < H.itemWaste) { k.item = null; } else I.item = true; } }
    };
    function cartWrapT(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
    rules.aiGoal = function (s2, k) {
      const g = goal0.call(this, s2, k); if (!g || !k.player) return g;
      if (k.hp < 45 && s2.roy) { let b = null, bd = 1e9; for (const o of s2.roy.kits) { if (!o.alive) continue; const d = Math.hypot(o.gx - k.x, o.gz - k.z); if (d < bd) { bd = d; b = o; } } if (b) g.goal = [b.gx, b.gz]; }
      return g;
    };
    // wave ids (a wave object is reused): tag each new one
    let born = 0; const waveTag = () => { for (const w of B.waves) { if (w.live && w._seen !== true) { w._seen = true; w.born = ++born; } if (!w.live) w._seen = false; } };
    let t0 = null, lastGift = 0, kits = 0, hp0 = P.hp;
    for (let i = 0; i < 60 * 600 && s.state === 'race'; i++) {
      waveTag(); s.update(STEP);
      if (B.active && t0 === null) { t0 = s.raceT; lastGift = s.raceT; }
      if (P.hp > hp0 + 20) kits++; hp0 = P.hp;
      if (B.active && !P.item && P.roul <= 0 && s.raceT - lastGift > H.giftEvery) { lastGift = s.raceT; P.item = ['skymail', 'bombs', 'devil', 'potty', 'foam', 'water', 'glow', 'shield', 'tumble', 'whistle', 'ducks', 'throb'][Math.floor(rnd() * 12)]; P.roul = 0; }
    }
    rules.onStep = step0; rules.aiGoal = goal0;
    const hurt = {}; for (const e of s.events) if (e.type === 'dmg' && e.player) hurt[e.src] = +((hurt[e.src] || 0) + e.n).toFixed(1);
    return { seed: c.seed, car: c.car, won: !!s.roy.bossDefeated, fight: t0 === null ? null : +(s.raceT - t0).toFixed(1), bossHp: +B.hp.toFixed(1), playerHp: +P.hp.toFixed(1), hops, missed, shots, wasted, kits, hurt, bossBy: B.dmgBy };
  } catch (e) { return { err: String(e && e.stack || e).slice(0, 600) }; }
}

// ---------------- cases ----------------
const WEAPONS = { bassdrop: {}, dazzle: {}, torch: { rivals: [[6, 0], [3, 4]] }, fireball: {}, bubbles: { secs: 5 }, laser: {}, sprinkles: { after: { t: 0.6, what: 'mine' } }, cannon: { rivals: [[0, 9], [0, -9], [2, 12]], speed: 2 }, slime: { secs: 4, after: { t: 1.2, what: 'slime' } }, zap: {}, chomp: { rivals: [[7, 0], [12, 0]] }, geyser: {} };
const CARS = { bassdrop: 'heart', dazzle: 'fish', torch: 'octo', fireball: 'dragon', bubbles: 'duck', laser: 'pyramid', sprinkles: 'cupcake', cannon: 'galleon', slime: 'snail', zap: 'jelly', chomp: 'shark', geyser: 'whale' };
const ITEMS = {
  tumble: { after: { t: 0.5, what: 'tumble' }, speed: 4 }, devil: { secs: 8 }, potty: { rivals: [[40, 0], [44, 1], [36, -1]], secs: 5 }, foam: { rivals: [[4, 0], [3, 3], [-4, 0]] }, whistle: {}, skymail: { secs: 6 }, bombs: { secs: 6, rivals: [[36, -3], [48, 3], [60, -3], [72, 3], [84, 0]] }, ducks: { secs: 6, speed: 4, rivals: [[20, 0], [26, 0]], after: { t: 3.5, what: 'duck' } },
  throb: {}, decoys: { rivals: [[3, 2], [3, -2], [5, 0]], speed: 3 }, toss: {}, glide: { secs: 6 }, surf: {}, warp: { after: { t: 1.4, what: 'start' }, secs: 5 }, frosting: { secs: 5 }, wave: { secs: 5 }, shell: { secs: 6 }, hover: { secs: 6, speed: 8 }, dive: { secs: 6 }, breach: { secs: 7, rivals: [[20, 0], [32, 0], [44, 0], [56, 0], [68, 0], [80, 0], [26, 4]], after: { t: 4.2, what: 'landing' } }
};
const SPECIAL_CAR = { throb: 'heart', decoys: 'fish', toss: 'octo', glide: 'dragon', surf: 'duck', warp: 'pyramid', frosting: 'cupcake', wave: 'galleon', shell: 'snail', hover: 'jelly', dive: 'shark', breach: 'whale' };

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site);
  const browser = await chromium.launch();
  const mk = async (w, h) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); await ctx.addInitScript(() => { window.__cartFixedQ = 0.75; }); const page = await ctx.newPage(); page.on('pageerror', e => fail('pageerror: ' + (e.stack || e.message).slice(0, 400))); page.on('console', m => { if (m.type() === 'error' && !/CART_NO_STAGE/.test(m.text())) fail('console: ' + m.text().slice(0, 300)); }); await page.goto(url + 'art-cart/'); await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready, null, { timeout: 900000 }); return page; };
  const page = await mk(844, 390);
  const report = { match: [], damage: [], bossHits: [], boss: null, render: [] };

  // ---------- 1. matches ----------
  if (part === 'all' || part === 'match') {
    console.log('== MATCHES (AI only, autopilot player)');
    // ARENAS=id,id runs only those arenas' matches (each level agent checks its own arena)
    for (const arena of process.env.ARENAS ? process.env.ARENAS.split(',') : ['sound', 'man', 'playa']) {
      const rs = [];
      for (let i = 0; i < NSEED; i++) {
        const r = await page.evaluate(pgMatch, { arena, seed: 11 + i * 7 });
        if (r.err) { fail(arena + ' match: ' + r.err); continue; }
        rs.push(r); report.match.push(r);
        console.log(`  ${arena} seed ${r.seed}: ${r.state}${r.phase === 2 ? ' (boss phase reached)' : ''} in ${r.t}s · first KO ${r.firstKO}s · player out ${r.playerOut === null ? 'never (won)' : r.playerOut + 's'} · winner ${r.winner}`);
        console.log('    KOs: ' + r.kos.map(k => `${k[0]}<-${k[1]}(${k[2]}) ${k[3].toFixed(0)}s`).join(', '));
        for (const k of r.karts) console.log(`    ${k.car.padEnd(8)} ${k.player ? 'P' : ' '} hp ${String(k.hp).padStart(5)} out ${String(k.outT).padStart(5)} kos ${k.kos} dealt ${k.dealt} taken ${k.taken} ← ${JSON.stringify(k.dmgBy)}`);
        if (r.state !== 'done' && r.phase !== 2) fail(`${arena} seed ${r.seed}: did not finish (${r.state} at ${r.t}s)`);
        if (r.t > 300) fail(`${arena} seed ${r.seed}: took ${r.t}s`);
        for (const k of r.karts) if (k.outT !== null && !Object.keys(k.dmgBy).length) fail(`${arena}: ${k.car} out without damage sources`);
      }
      if (rs.length) {
        const fk = rs.filter(r => r.firstKO !== null).map(r => r.firstKO), avgFK = fk.reduce((a, b) => a + b, 0) / Math.max(1, fk.length);
        const surv = rs.map(r => r.playerOut === null ? r.t : r.playerOut), avgS = surv.reduce((a, b) => a + b, 0) / surv.length, avgT = rs.reduce((a, r) => a + r.t, 0) / rs.length;
        console.log(`  ${arena}: avg match ${avgT.toFixed(0)}s · avg first KO ${avgFK.toFixed(1)}s · avg autopilot survival ${avgS.toFixed(0)}s`);
        if (avgFK < 20) fail(`${arena}: first knock-out too early on average (${avgFK.toFixed(1)}s < 20s)`);
        if (avgS < 60) fail(`${arena}: the autopilot player survives only ${avgS.toFixed(0)}s on average (< 60s)`);
      }
    }
  }
  // ---------- 2. damage ----------
  if (part === 'all' || part === 'damage') {
    console.log('== DAMAGE TABLE');
    const T = await page.evaluate(() => window.BRADY_CART.debug.dmgTable());
    for (const [id, v] of Object.entries(T.dmg)) if (!(v > 0 && v <= 30)) fail(`table: ${id} = ${v}`);
    const ids = await page.evaluate(() => ({ items: Object.keys(window.BRADY_BURNS.CART_ITEMS), weapons: Object.keys(window.BRADY_BURNS.CART_ROY_DMG) }));
    const cases = [];
    for (const id in WEAPONS) cases.push(Object.assign({ id, kind: 'weapon', car: CARS[id] }, WEAPONS[id]));
    for (const id in ITEMS) cases.push(Object.assign({ id, kind: 'item', car: SPECIAL_CAR[id] }, ITEMS[id]));
    cases.push({ id: 'water', kind: 'item', pre: 'hurt' }, { id: 'glow', kind: 'item', ram: true, speed: 18 }, { id: 'shield', kind: 'item', attacker: true, car: 'heart' });
    // anything else in the item list (driver specials, arena powers): report what it does here
    const known = new Set(cases.map(c => c.id)), extra = ids.items.filter(id => !known.has(id));
    for (const id of extra) cases.push({ id, kind: 'item', extra: true, secs: 6 });
    for (const c of cases) {
      const r = await page.evaluate(pgDamage, c); report.damage.push(r);
      if (r.err) { fail(`${c.id}: ${r.err}`); continue; }
      const line = `  ${c.id.padEnd(10)} ${c.kind.padEnd(6)} dmg ${String(r.dmg).padStart(5)} on ${r.victims} car(s)` + (r.heal ? ` · heal ${r.heal}` : '') + (r.ram ? ` · ram ${r.ram}` : '') + (r.blocked ? ` · blocked ${r.blocked}` : '') + (c.extra ? '  (not in the core list: reported)' : '');
      console.log(line);
      if (c.extra) { if (['airhorn', 'lightsout', 'afterparty'].includes(c.id) && !(r.dmg > 0)) fail(`${c.id} (driver special, kind 'drv'): no damage`); continue; }
      if (c.id === 'water') { if (!(r.heal > 0)) fail('water: no heal'); }
      else if (c.id === 'glow') { if (!(r.ram > 0)) fail('glow: no ram damage'); }
      else if (c.id === 'shield') { if (!(r.blocked > 0 && r.hp1 >= r.hp0)) fail(`shield: not blocked (hp ${r.hp0}→${r.hp1})`); }
      else if (!(r.dmg > 0)) fail(`${c.id}: no damage`);
    }
  }
  // ---------- 3. boss ----------
  if (part === 'all' || part === 'boss') {
    console.log('== THE MAN');
    const bc = [];
    for (const id in WEAPONS) bc.push({ id, kind: 'weapon', car: CARS[id], dist: { torch: 19, bassdrop: 22, zap: 26, chomp: 17, sprinkles: 16, slime: 15 }[id] || 26, after: id === 'sprinkles' ? 'atFeet' : null, yawOff: id === 'sprinkles' ? Math.PI : id === 'cannon' || id === 'slime' ? Math.PI / 2 : 0, speed: id === 'slime' ? 8 : 6 });
    for (const id of ['tumble', 'devil', 'potty', 'foam', 'whistle', 'skymail', 'bombs', 'ducks', 'water', 'throb', 'decoys', 'toss', 'glide', 'surf', 'warp', 'frosting', 'wave', 'shell', 'hover', 'dive', 'breach'])
      bc.push({ id, kind: 'item', car: SPECIAL_CAR[id], dist: { foam: 17, throb: 20, decoys: 15, potty: 45, breach: 24, shell: 22, dive: 18, hover: 22, glide: 26, toss: 20, tumble: 15 }[id] || 28, secs: 7, yawOff: id === 'tumble' || id === 'warp' ? Math.PI : 0, speed: id === 'decoys' || id === 'surf' || id === 'dive' ? 14 : 6 });
    let noHurt = [];
    for (const c of bc) { const r = await page.evaluate(pgBossHit, c); report.bossHits.push(r); if (r.err) { fail('boss ' + c.id + ': ' + r.err); continue; } console.log(`  ${c.id.padEnd(10)} → the Man -${r.dmg}`); if (!(r.dmg > 0)) noHurt.push(c.id); }
    if (noHurt.length) fail('these do not hurt the Man: ' + noHurt.join(', '));
    // ramming him with a glow boost
    const rr = await page.evaluate(pgBossHit, { id: 'glow', kind: 'item', dist: 30, speed: 24, secs: 3 }); console.log(`  glow+ram   → the Man -${rr.dmg}`); if (!(rr.dmg > 0)) fail('ramming the Man does nothing');
    const f = await page.evaluate(pgBossFight, { keepAlive: true, seed: 5 }); report.boss = f;
    if (f.err) fail('boss fight: ' + f.err);
    else {
      console.log(`  full fight (autopilot, kept alive, a gift every 9 s): ${f.defeated ? 'DEFEATED' : 'not defeated'} in ${f.fight}s · boss HP left ${f.bossHp} · by ${JSON.stringify(f.bossBy)}`);
      console.log(`  the Man's damage to the player: ${f.playerTaken} HP (${f.perMin} HP/min) · result ${JSON.stringify(f.result)} · stageWon ${f.stageWon}`);
      console.log(`  time in each state (frames): ${JSON.stringify(f.states)}`);
      if (!f.defeated) fail('the Man was not defeated by the scripted fight');
      if (f.fight > 300) fail(`the boss fight took ${f.fight}s (> 300)`);
      if (!f.result || !f.result.bossDefeated || f.stageWon !== true) fail('the result does not say bossDefeated / stageWon');
    }
    const f2 = await page.evaluate(pgBossFight, { keepAlive: false, seed: 9 });
    if (f2.err) fail('boss fight 2: ' + f2.err); else { console.log(`  unassisted autopilot: ${f2.defeated ? 'won' : 'lost'} after ${f2.fight}s (boss HP ${f2.bossHp}, the Man dealt ${f2.perMin} HP/min) · results top: ${JSON.stringify(f2.results)} · stageWon ${f2.stageWon}`); if (!f2.defeated && f2.stageWon !== false) fail('a lost boss fight must set stageWon false'); if (!f2.defeated && (!f2.results || f2.results[0][0] !== 'THE MAN')) fail('a lost boss fight must put THE MAN on top'); }
  }
  // ---------- 3b. the boss against a human-like player ----------
  if (part === 'all' || part === 'boss' || part === 'human') {
    console.log('== THE MAN vs a human-like autopilot (late / early hops, missed hops, slow and wasted shots)');
    const cars = ['heart', 'octo', 'fish', 'jelly', 'shark', 'whale', 'galleon', 'snail', 'dragon', 'duck', 'pyramid', 'cupcake'];
    const N = part === 'human' ? Math.max(NSEED, 12) : 8, rs = [];
    for (let i = 0; i < N; i++) {
      const r = await page.evaluate(pgBossHuman, { seed: 21 + i * 13, car: cars[i % cars.length] }); report.human = report.human || []; report.human.push(r);
      if (r.err) { fail('human boss fight: ' + r.err); continue; } rs.push(r);
      console.log(`  ${r.car.padEnd(8)} seed ${r.seed}: ${r.won ? 'WON ' : 'LOST'} in ${r.fight}s · Man HP ${r.bossHp} · player HP ${r.playerHp} · hops ${r.hops} missed ${r.missed} · shots ${r.shots} (wasted ${r.wasted}) · kits ${r.kits} · hurt by ${JSON.stringify(r.hurt)}`);
    }
    if (rs.length) {
      const won = rs.filter(r => r.won), rate = won.length / rs.length, avgW = won.reduce((a, r) => a + r.fight, 0) / Math.max(1, won.length), avgL = rs.filter(r => !r.won).reduce((a, r, _, A) => a + r.fight / A.length, 0);
      console.log(`  human-like: won ${won.length}/${rs.length} (${Math.round(rate * 100)}%) · avg winning fight ${avgW.toFixed(0)}s · avg losing fight ${avgL.toFixed(0)}s`);
      if (rate < 0.55 || rate > 0.92) fail(`human-like win rate ${Math.round(rate * 100)}% outside 55–92%`);
      if (won.length && (avgW < 100 || avgW > 260)) fail(`human-like winning fight ${avgW.toFixed(0)}s outside 100–260s`);
    }
  }
  // ---------- 4. screenshots ----------
  if (part === 'all' || part === 'shots') {
    console.log('== SCREENSHOTS');
    const shoot = async (pg, name, setup) => {
      const st = await pg.evaluate(setup);
      // hold the staged moment: the page's own real-time loop would keep stepping the sim between here and the capture
      await pg.evaluate(() => { const s = window.BRADY_CART.debug.scene(); s.update = function () {}; });
      for (let i = 0; i < 3; i++) await pg.evaluate(() => window.BRADY_CART.debug.frame());
      await pg.waitForTimeout(150);
      const stats = await pg.evaluate(() => { const s = window.BRADY_CART.debug.scene(); return { draws: s.stats.draws, tris: Math.round(s.stats.tris) }; });
      try { await pg.screenshot({ path: path.join(out, name + '.png'), timeout: 120000 }); } catch (e) { fail('screenshot ' + name); }
      report.render.push(Object.assign({ name }, stats, st || {})); console.log(`  ${name.padEnd(28)} draws ${stats.draws} · ${(stats.tris / 1000).toFixed(0)}k tris`);
    };
    // fixed camera for a view (the scene's camera is overridden for the shot)
    const start = (arena, o) => `(() => { const D = window.BRADY_CART.debug; D.start(Object.assign({ mode: 'royale', arena: '${arena}', car: 'heart', driver: 'brady', seed: 7, autoGas: true }, ${JSON.stringify(o || {})})); const s = D.scene(); s.state = 'race'; s.stateT = 0; s.autoDrive = true; s.roy.keepGoing = true; for (let i = 0; i < 60; i++) s.update(1 / 60); return s; })()`;
    const cam = (px, py, pz, tx, ty, tz, fov) => `(s => { s.updateCamera = function () { const c = this.cam; c.x = ${px}; c.y = ${py}; c.z = ${pz}; c.tx = ${tx}; c.ty = ${ty}; c.tz = ${tz}; c.fov = ${fov || 1.0}; c.roll = 0; }; window.__cartHideHUD = true; })`;
    const views = [
      ['sound-overview', 'sound', null, cam(150, 70, 150, 0, 0, 0, 1.0)],
      ['sound-floor', 'sound', null, cam(30, 5, 40, 0, 6, 0, 1.15)],
      ['sound-arch', 'sound', null, cam(Math.sin(Math.PI / 6) * 150, 4, Math.cos(Math.PI / 6) * 150, 0, 6, 0, 1.0)],
      ['sound-subs', 'sound', null, cam(Math.sin(0) * 100, 6, Math.cos(0) * 100, Math.sin(Math.PI / 6) * 70, 4, Math.cos(Math.PI / 6) * 70, 1.0)],
      ['sound-wall', 'sound', null, cam(30, 5, 92, 0, 4, 125, 1.1)],
      ['man-overview', 'man', null, cam(110, 50, 110, 0, 10, 0, 1.0)],
      ['man-ground', 'man', null, cam(0, 4, 60, 0, 14, 0, 1.15)],
      ['mixbowl-overview', 'mixbowl', null, cam(150, 70, 150, 0, 0, 0, 1.0)], ['mixbowl-dough', 'mixbowl', null, cam(30, 5, 40, 0, 8, 0, 1.15)], ['mixbowl-rim', 'mixbowl', null, cam(0, 5, 120, 0, 8, 175, 1.1)], ['mixbowl-cover', 'mixbowl', null, cam(40, 5, 150, -40, 4, 60, 1.0)],
      ['rollerdisco-overview', 'rollerdisco', null, cam(150, 70, 150, 0, 0, 0, 1.0)], ['rollerdisco-rink', 'rollerdisco', null, cam(30, 6, 44, 0, 8, 0, 1.15)], ['rollerdisco-alley', 'rollerdisco', null, cam(96, 5, -118, 80, 2, 0, 1.0)], ['rollerdisco-edge', 'rollerdisco', null, cam(0, 6, 150, 0, 5, 60, 1.1)],
      ['vault-overview', 'vault', null, cam(150, 70, 150, 0, 0, 0, 1.0)], ['vault-capstone', 'vault', null, cam(26, 5, 34, 0, 8, 0, 1.15)], ['vault-columns', 'vault', null, cam(0, 5, 150, 0, 6, 40, 1.0)], ['vault-door', 'vault', null, cam(60, 6, 60, 125, 8, 125, 1.1)],
      ['firegarden-overview', 'firegarden', null, cam(150, 70, 150, 0, 0, 0, 1.0)], ['firegarden-kraken', 'firegarden', null, cam(14, 5, 44, 0, 8, 0, 1.15)], ['firegarden-bed', 'firegarden', null, cam(58, 6, 98, 35, 2, 60, 1.1)], ['firegarden-wall', 'firegarden', null, cam(30, 5, 96, 0, 4, 125, 1.1)],
      ['bigtub-overview', 'bigtub', null, cam(150, 70, 150, 0, 0, 0, 1.0)], ['bigtub-dish', 'bigtub', null, cam(30, 5, 50, 0, 6, 6, 1.15)], ['bigtub-tap', 'bigtub', null, cam(0, 8, 90, 0, 16, 181, 1.1)], ['bigtub-cover', 'bigtub', null, cam(0, 5, -150, 40, 4, -80, 1.1)],
      ['tiltyard-overview', 'tiltyard', null, cam(150, 70, 150, 0, 0, 0, 1.0)], ['tiltyard-lists', 'tiltyard', null, cam(14, 5, -80, 0, 3, 0, 1.15)], ['tiltyard-roost', 'tiltyard', null, cam(20, 6, 50, 0, 12, 106, 1.1)], ['tiltyard-cover', 'tiltyard', null, cam(0, 5, -150, 50, 5, -90, 1.1)],
      ['greenhouse-overview', 'greenhouse', null, cam(150, 70, 150, 0, 0, 0, 1.0)], ['greenhouse-palm', 'greenhouse', null, cam(30, 5, 50, 0, 8, 0, 1.15)], ['greenhouse-trap', 'greenhouse', null, cam(36, 6, 34, 67, 2, 68, 1.1)], ['greenhouse-glass', 'greenhouse', null, cam(0, 5, 110, 0, 14, 178, 1.1)],
      ['skullcove-overview', 'skullcove', null, cam(150, 70, 150, 0, 0, 0, 1.0)], ['skullcove-skull', 'skullcove', null, cam(22, 5, -58, 0, 11, 0, 1.15)], ['skullcove-stacks', 'skullcove', null, cam(0, 5, -150, 30, 6, -80, 1.1)], ['skullcove-wreck', 'skullcove', null, cam(80, 5, -40, 116, 2, -78, 1.1)],
      ['sandpit-overview', 'sandpit', null, cam(150, 70, 150, 0, 0, 0, 1.0)], ['sandpit-chomper', 'sandpit', null, cam(30, 5, 44, 0, 10, 0, 1.15)], ['sandpit-cliffs', 'sandpit', null, cam(0, 6, 110, 0, 6, 178, 1.1)], ['sandpit-cover', 'sandpit', null, cam(0, 5, -150, 60, 4, -80, 1.1)],
      ['tidepool-overview', 'tidepool', null, cam(150, 70, 150, 0, 0, 0, 1.0)], ['tidepool-rock', 'tidepool', null, cam(30, 5, 50, 0, 7, 0, 1.15)], ['tidepool-clam', 'tidepool', null, cam(Math.sin(Math.PI / 4) * 70, 5, Math.cos(Math.PI / 4) * 70, Math.sin(Math.PI / 4) * 96, 2, Math.cos(Math.PI / 4) * 96, 1.1)], ['tidepool-rim', 'tidepool', null, cam(0, 6, -110, 0, 5, -178, 1.1)],
      ['stormcell-overview', 'stormcell', null, cam(150, 70, 150, 0, 0, 0, 1.0)], ['stormcell-core', 'stormcell', null, cam(30, 5, 46, 0, 14, 0, 1.15)], ['stormcell-ring', 'stormcell', null, cam(0, 6, 140, 0, 5, 60, 1.1)], ['stormcell-cover', 'stormcell', null, cam(0, 5, -160, 60, 4, -80, 1.1)],
    ];
    for (const [name, arena, o, c] of views) if (!process.env.SHOTS || new RegExp(process.env.SHOTS).test(name)) await shoot(page, name, new Function(`const s = ${start(arena, o)}; (${c})(s); s.update(1/60); return null;`));
    await page.evaluate(() => { window.__cartHideHUD = false; });
    // gameplay views with the HUD, in landscape and portrait: a fight, the storm, the dance floor pulsing, a cupid lock, a bass wave,
    // a knock-out and its poof, spectating, the results, the Man royale, and the boss phases. SHOTS=<regex> retakes a subset.
    const pp = await mk(390, 844);
    const only = process.env.SHOTS ? new RegExp(process.env.SHOTS) : null;
    const play = (arena, secs, extra) => new Function(`const s = ${start(arena)}; ${extra || ''}; const n = Math.round(${secs} * 60); for (let i = 0; i < n && s.state === 'race'; i++) s.update(1 / 60); return { t: s.raceT };`);
    const floorCam = cam(0, 46, 62, 0, 0, 8, 1.0);
    // the player parked 46 m out facing the Man, so the chase camera looks at him
    const boss = (st, setup) => new Function(`const s = ${start('man', { phase: 2 })}; s.autoDrive = false; s.autoGas = false; window.BRADY_CART.debug.place(-1, 0, 46, Math.PI, { speed: 0 }); ${setup}`);
    const ko = fr => new Function(`const s = ${start('sound')}; const D = window.BRADY_CART.debug; D.place(-1, 0, 150, Math.PI / 2, { speed: 0 }); s.autoDrive = false; s.autoGas = false; const i = s.karts.findIndex(k => !k.player); D.place(i, 14, 150, 0.6, { frozen: true }); for (let f = 0; f < 30; f++) s.update(1/60); D.hurt(i, 200, 'test'); for (let f = 0; f < ${fr}; f++) s.update(1/60); return null;`);
    const shots = [
      ['hud-fight', play('sound', 34)],
      ['rollerdisco-hud', play('rollerdisco', 30)],
      ['firegarden-hud', play('firegarden', 30)],
      ['tiltyard-hud', play('tiltyard', 30)],
      ['skullcove-hud', play('skullcove', 30)],
      ['skullcove-ghost', new Function(`const s = ${start('skullcove')}; const D = window.BRADY_CART.debug, g = s.skc.ghost; s.autoDrive = false; s.autoGas = false; g.next = 0; for (let i = 0; i < 900; i++) { s.update(1/60); s.player.invT = 2; s.player.inp.gas = 0; if (g.st === 'warn' && g.t < 0.03) { const sg = g.lane < 0 ? -1 : 1, mx = g.x0 + g.dx * g.L * 0.5, mz = g.z0 + g.dz * g.L * 0.5, px = mx + g.px * sg * 45, pz = mz + g.pz * sg * 45; D.place(-1, px, pz, Math.atan2(mx - px, mz - pz), { speed: 0 }); } if (g.st === 'sail' && g.t * 34 > g.L * 0.42) break; } return { st: g.st };`)],
      ['tiltyard-joust', new Function(`const s = ${start('tiltyard')}; const D = window.BRADY_CART.debug, Y = s.tyd; D.place(-1, 4.6, 40, Math.PI, { speed: 0 }); s.autoDrive = false; s.autoGas = false; for (let i = 0; i < 1800; i++) { s.update(1/60); s.player.invT = 2; s.player.inp.gas = 0; if (Y.knights[0].st === 'charge' && Math.abs(Y.knights[0].z) < 22) break; } return { st: Y.knights.map(n => n.st) };`)],
      ['tiltyard-dragon', new Function(`const s = ${start('tiltyard')}; const D = window.BRADY_CART.debug, g = s.tyd.drag; D.place(-1, 14, 48, -0.24, { speed: 0 }); s.autoDrive = false; s.autoGas = false; g.cool = 0; for (let i = 0; i < 600; i++) { s.update(1/60); s.player.invT = 2; s.player.inp.gas = 0; if (g.st === 'breath' && g.t > 0.5) break; } return { st: g.st };`)],
      ['tiltyard-catapult', new Function(`const s = ${start('tiltyard')}; const D = window.BRADY_CART.debug, Y = s.tyd; D.place(-1, 80, 60, Math.PI * 0.75, { speed: 0 }); s.autoDrive = false; s.autoGas = false; for (const c of Y.cats) c.cool = 0; for (let i = 0; i < 900; i++) { s.update(1/60); s.player.invT = 2; s.player.inp.gas = 0; if (Y.balls.some(b => b.live && b.t > 0.8)) break; } return { cats: Y.cats.map(c => c.st) };`)],
      ['firegarden-hazards', new Function(`const s = ${start('firegarden')}; const D = window.BRADY_CART.debug, F = s.fgn; s.autoDrive = false; s.autoGas = false; for (let i = 0; i < 2400; i++) { s.update(1/60); s.player.invT = 2; const w = F.whirls.find(q => q.st === 'roam' && q.t > 1.5); if (w) { const r = Math.hypot(w.x, w.z) || 1, a = Math.atan2(w.x, w.z) + 0.25; D.place(-1, Math.sin(a) * (r + 20), Math.cos(a) * (r + 20), a + Math.PI, { speed: 0 }); for (let j = 0; j < 30; j++) { s.update(1/60); s.player.invT = 2; } break; } } return { whirls: F.whirls.map(q => q.st) };`)],
      ['hud-storm', new Function(`const s = ${start('sound')}; for (let i = 0; i < 150 * 60 && s.state === 'race'; i++) { s.update(1/60); s.player.hp = Math.max(s.player.hp, 80); s.player.invT = Math.max(s.player.invT, 0.5); } const Z = s.roy.zone, P = s.player, a = Math.atan2(P.x - Z.x, P.z - Z.z), d = Z.r + 5; window.BRADY_CART.debug.place(-1, Z.x + Math.sin(a) * d, Z.z + Math.cos(a) * d, a + Math.PI, { speed: 6 }); s.autoDrive = false; for (let i = 0; i < 70; i++) s.update(1/60); return { r: Z.r };`)],
      ['sound-floor-warn', new Function(`const s = ${start('sound')}; for (let i = 0; i < 600; i++) { s.update(1/60); if (s.snd.phase === 'warn' && s.raceT > 6) break; } (${floorCam})(s); return { pat: s.snd.pat };`)],
      ['sound-floor-hot', new Function(`const s = ${start('sound')}; for (let i = 0; i < 600; i++) { s.update(1/60); if (s.snd.phase === 'hot' && s.raceT > 6) break; } (${floorCam})(s); return { pat: s.snd.pat };`)],
      ['sound-bass-warn', new Function(`window.__cartHideHUD = false; const s = ${start('sound')}; const D = window.BRADY_CART.debug, b = s.snd.subs[0]; D.place(-1, b.b.cx + Math.sin(b.b.yaw) * 14, b.b.cz + Math.cos(b.b.yaw) * 14, b.b.yaw + Math.PI, { speed: 0 }); s.autoDrive = false; b.next = 1.0; b.warn = 0; for (let i = 0; i < 40; i++) { s.update(1/60); s.player.inp.gas = 0; } return null;`)],
      ['sound-cupid-lock', new Function(`const s = ${start('sound')}; const D = window.BRADY_CART.debug, d = s.snd.drones[0]; D.place(-1, 0, 150, Math.PI / 2, { speed: 0 }); s.autoDrive = false; s.autoGas = false; s.player.invT = 0; d.x = 6; d.z = 150; d.cool = 0; for (let i = 0; i < 50; i++) { s.update(1/60); s.player.inp.gas = 0; if (d.st === 'lock' && d.t > 0.6) break; } return { st: d.st };`)],
      ['royale-knockout', ko(50)], ['royale-poof', ko(96)],
      ['royale-spectating', new Function(`const s = ${start('sound')}; s.roy.keepGoing = false; s.autoDrive = true; for (let i = 0; i < 1200; i++) s.update(1/60); window.BRADY_CART.debug.hurt(-1, 200, 'test'); for (let i = 0; i < 100; i++) s.update(1/60); return null;`)],
      ['royale-results', new Function(`const s = ${start('sound')}; s.roy.keepGoing = false; s.autoDrive = true; for (let i = 0; i < 1800; i++) s.update(1/60); window.BRADY_CART.debug.hurt(-1, 200, 'test'); for (let i = 0; i < 1500 && s.state === 'race'; i++) s.update(1/60); s.finishRace(); for (let i = 0; i < 90; i++) s.update(1/60); return { state: s.state, place: s.royaleResult && s.royaleResult.playerPlace };`)],
      ['man-royale-hud', play('man', 30)],
      ['boss-wake', boss('wake', `for (let i = 0; i < 120; i++) s.update(1/60); return { st: s.boss.st };`)],
      ['boss-stomp-telegraph', boss('stomp', `for (let i = 0; i < 400; i++) { s.update(1/60); s.player.invT = 2; if (s.boss.st === 'stomp' && s.boss.t > 0.8) break; } return { st: s.boss.st };`)],
      ['boss-shockwave', boss('stomp', `for (let i = 0; i < 600; i++) { s.update(1/60); s.player.invT = 2; if (s.boss.waves.some(w => w.live && w.r > 20)) break; } return { st: s.boss.st };`)],
      ['boss-sweep', boss('sweep', `for (let i = 0; i < 3000; i++) { s.update(1/60); s.player.invT = 2; if (s.boss.st === 'idle' && s.boss.t > s.boss.dur - 0.05 && s.boss.n > 0) s.boss.last = 'stomp'; if (s.boss.st === 'sweep' && s.boss.hit && s.boss.ht > 0.4) break; } return { st: s.boss.st };`)],
      ['boss-embers', boss('embers', `for (let i = 0; i < 4000; i++) { s.update(1/60); s.player.invT = 2; if (s.boss.st === 'embers' && s.boss.hit && s.boss.ht > 0.6) break; } return { st: s.boss.st };`)],
      ['boss-weakpoint', boss('rest', `for (let i = 0; i < 3000; i++) { s.update(1/60); s.player.invT = 2; if (s.boss.st === 'rest' && s.boss.t > 0.7) break; } return { st: s.boss.st };`)],
      ['boss-burning', boss('dying', `for (let i = 0; i < 300; i++) s.update(1/60); s.boss.st = 'rest'; s.boss.hp = 1; window.BRADY_BURNS.CART_ARENA_RULES.man.bossHit(s, s.player, 'spin', { weapon: 'bassdrop' }); for (let i = 0; i < 150; i++) s.update(1/60); return null;`)],
      ['boss-collapsed', boss('dying', `for (let i = 0; i < 300; i++) s.update(1/60); s.boss.st = 'rest'; s.boss.hp = 1; window.BRADY_BURNS.CART_ARENA_RULES.man.bossHit(s, s.player, 'spin', { weapon: 'bassdrop' }); for (let i = 0; i < 330; i++) s.update(1/60); return null;`)],
      ['boss-lost', boss('lost', `for (let i = 0; i < 300; i++) s.update(1/60); window.BRADY_CART.debug.hurt(-1, 500, 'test'); for (let i = 0; i < 1200 && s.state === 'race'; i++) s.update(1/60); s.finishRace(); for (let i = 0; i < 90; i++) s.update(1/60); return { state: s.state };`)]
    ];
    for (const [pg, sfx] of [[page, '-landscape'], [pp, '-portrait']]) for (const [nm, fn] of shots) { if (only && !only.test(nm + sfx)) continue; await pg.evaluate(() => { window.__cartHideHUD = false; }); await shoot(pg, nm + sfx, fn); }
    const pk = report.render.reduce((a, r) => ({ draws: Math.max(a.draws, r.draws), tris: Math.max(a.tris, r.tris) }), { draws: 0, tris: 0 });
    console.log(`  PEAK: ${pk.draws} draws · ${(pk.tris / 1000).toFixed(0)}k triangles (budget 120 / 420k)`);
    if (pk.draws > 120) fail(`peak draws ${pk.draws} > 120`);
    if (pk.tris > 420000) fail(`peak triangles ${pk.tris} > 420k`);
  }
  fs.writeFileSync(path.join(out, 'royale-report.json'), JSON.stringify(report, null, 1));
  await browser.close(); srv.close();
  if (fails.length) { console.log('\nFAILED (' + fails.length + '):\n' + fails.slice(0, 40).join('\n')); process.exit(1); }
  console.log('\nroyale test ok · shots and report in', out);
})().catch(e => { console.error(e); process.exit(1); });
