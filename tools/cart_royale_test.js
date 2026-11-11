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

// ---------------- cases ----------------
const WEAPONS = { bassdrop: {}, dazzle: {}, torch: { rivals: [[6, 0], [3, 4]] }, fireball: {}, bubbles: { secs: 5 }, laser: {}, sprinkles: { after: { t: 0.6, what: 'mine' } }, cannon: { rivals: [[0, 9], [0, -9], [2, 12]], speed: 2 }, slime: { secs: 4, after: { t: 1.2, what: 'slime' } }, zap: {}, chomp: { rivals: [[7, 0], [12, 0]] }, geyser: {} };
const CARS = { bassdrop: 'heart', dazzle: 'fish', torch: 'octo', fireball: 'dragon', bubbles: 'duck', laser: 'pyramid', sprinkles: 'cupcake', cannon: 'galleon', slime: 'snail', zap: 'jelly', chomp: 'shark', geyser: 'whale' };
const ITEMS = {
  tumble: { after: { t: 0.5, what: 'tumble' }, speed: 4 }, devil: { secs: 8 }, potty: { rivals: [[40, 0], [44, 1], [36, -1]], secs: 5 }, foam: { rivals: [[4, 0], [3, 3], [-4, 0]] }, whistle: {}, skymail: { secs: 6 }, bombs: { secs: 6, rivals: [[36, -3], [48, 3], [60, -3], [72, 3], [84, 0]] }, ducks: { secs: 6, speed: 4, rivals: [[20, 0], [26, 0]], after: { t: 1.5, what: 'behind' } },
  throb: {}, decoys: { rivals: [[3, 2], [3, -2], [5, 0]], speed: 3 }, toss: {}, glide: { secs: 6 }, surf: {}, warp: { after: { t: 1.4, what: 'start' }, secs: 5 }, frosting: { secs: 5 }, wave: { secs: 5 }, shell: { secs: 6 }, hover: { secs: 6, speed: 8 }, dive: { secs: 6 }, breach: { secs: 7, rivals: [[20, 0], [32, 0], [44, 0], [56, 0], [68, 0], [80, 0], [26, 4]] }
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
    for (const arena of ['sound', 'man', 'playa']) {
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
      if (c.extra) continue;
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
    for (const id in WEAPONS) bc.push({ id, kind: 'weapon', car: CARS[id], dist: { torch: 19, bassdrop: 22, zap: 26, chomp: 17, sprinkles: 16 }[id] || 26, after: id === 'sprinkles' ? 'atFeet' : null, yawOff: id === 'sprinkles' ? Math.PI : id === 'cannon' ? Math.PI / 2 : id === 'slime' ? Math.PI : 0, speed: id === 'slime' ? 10 : 6 });
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
  // ---------- 4. screenshots ----------
  if (part === 'all' || part === 'shots') {
    console.log('== SCREENSHOTS');
    const shoot = async (pg, name, setup) => {
      const st = await pg.evaluate(setup);
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
      ['man-ground', 'man', null, cam(0, 4, 60, 0, 14, 0, 1.15)]
    ];
    for (const [name, arena, o, c] of views) await shoot(page, name, new Function(`const s = ${start(arena, o)}; (${c})(s); s.update(1/60); return null;`));
    await page.evaluate(() => { window.__cartHideHUD = false; });
    // gameplay views with the HUD: a fight, the dance floor pulsing, a cupid lock, a bass wave, a knock-out, spectating
    const play = (arena, secs, extra) => new Function(`const s = ${start(arena)}; ${extra || ''}; const n = Math.round(${secs} * 60); for (let i = 0; i < n && s.state === 'race'; i++) s.update(1 / 60); return { t: s.raceT };`);
    await shoot(page, 'hud-fight-landscape', play('sound', 34));
    await shoot(page, 'hud-later-landscape', play('sound', 95));
    const floorCam = cam(0, 46, 62, 0, 0, 8, 1.0);
    await shoot(page, 'sound-floor-warn', new Function(`const s = ${start('sound')}; for (let i = 0; i < 600; i++) { s.update(1/60); if (s.snd.phase === 'warn' && s.raceT > 6) break; } (${floorCam})(s); return { pat: s.snd.pat };`));
    await shoot(page, 'sound-floor-hot', new Function(`const s = ${start('sound')}; for (let i = 0; i < 600; i++) { s.update(1/60); if (s.snd.phase === 'hot' && s.raceT > 6) break; } (${floorCam})(s); return { pat: s.snd.pat };`));
    await page.evaluate(() => { window.__cartHideHUD = false; });
    await shoot(page, 'sound-bass-warn', new Function(`const s = ${start('sound')}; const D = window.BRADY_CART.debug, b = s.snd.subs[0]; D.place(-1, b.b.cx + Math.sin(b.b.yaw) * 14, b.b.cz + Math.cos(b.b.yaw) * 14, b.b.yaw + Math.PI, { speed: 0 }); s.autoDrive = false; b.next = 1.0; b.warn = 0; for (let i = 0; i < 40; i++) { s.update(1/60); s.player.inp.gas = 0; } return null;`));
    await shoot(page, 'sound-cupid-lock', new Function(`const s = ${start('sound')}; const D = window.BRADY_CART.debug, d = s.snd.drones[0]; D.place(-1, 0, 150, Math.PI / 2, { speed: 0 }); s.autoDrive = false; s.autoGas = false; s.player.invT = 0; d.x = 6; d.z = 150; d.cool = 0; for (let i = 0; i < 50; i++) { s.update(1/60); s.player.inp.gas = 0; if (d.st === 'lock' && d.t > 0.6) break; } return { st: d.st };`));
    for (const [nm, fr] of [['royale-knockout', 50], ['royale-poof', 96]]) await shoot(page, nm, new Function(`const s = ${start('sound')}; const D = window.BRADY_CART.debug; D.place(-1, 0, 150, Math.PI / 2, { speed: 0 }); s.autoDrive = false; s.autoGas = false; const i = s.karts.findIndex(k => !k.player); D.place(i, 14, 150, 0.6, { frozen: true }); D.hurt(i, 200, 'test'); for (let f = 0; f < ${fr}; f++) s.update(1/60); return null;`));
    await shoot(page, 'royale-spectating', new Function(`const s = ${start('sound')}; s.roy.keepGoing = false; s.autoDrive = true; for (let i = 0; i < 1200; i++) s.update(1/60); window.BRADY_CART.debug.hurt(-1, 200, 'test'); for (let i = 0; i < 100; i++) s.update(1/60); return null;`));
    await shoot(page, 'man-royale-hud', play('man', 30));
    // the boss phases
    // the player parked 46 m out facing the Man, so the chase camera looks at him
    const boss = (st, setup) => new Function(`const s = ${start('man', { phase: 2 })}; s.autoDrive = false; s.autoGas = false; window.BRADY_CART.debug.place(-1, 0, 46, Math.PI, { speed: 0 }); ${setup}`);
    await shoot(page, 'boss-wake', boss('wake', `for (let i = 0; i < 120; i++) s.update(1/60); return { st: s.boss.st };`));
    await shoot(page, 'boss-stomp-telegraph', boss('stomp', `for (let i = 0; i < 400; i++) { s.update(1/60); s.player.invT = 2; if (s.boss.st === 'stomp' && s.boss.t > 0.8) break; } return { st: s.boss.st };`));
    await shoot(page, 'boss-shockwave', boss('stomp', `for (let i = 0; i < 600; i++) { s.update(1/60); s.player.invT = 2; if (s.boss.waves.some(w => w.live && w.r > 20)) break; } return { st: s.boss.st };`));
    await shoot(page, 'boss-sweep', boss('sweep', `for (let i = 0; i < 3000; i++) { s.update(1/60); s.player.invT = 2; if (s.boss.st === 'idle' && s.boss.t > s.boss.dur - 0.05 && s.boss.n > 0) s.boss.last = 'stomp'; if (s.boss.st === 'sweep' && s.boss.hit && s.boss.ht > 0.4) break; } return { st: s.boss.st };`));
    await shoot(page, 'boss-embers', boss('embers', `for (let i = 0; i < 4000; i++) { s.update(1/60); s.player.invT = 2; if (s.boss.st === 'embers' && s.boss.hit && s.boss.ht > 0.6) break; } return { st: s.boss.st };`));
    await shoot(page, 'boss-weakpoint', boss('rest', `for (let i = 0; i < 3000; i++) { s.update(1/60); s.player.invT = 2; if (s.boss.st === 'rest' && s.boss.t > 0.7) break; } return { st: s.boss.st };`));
    await shoot(page, 'boss-burning', boss('dying', `for (let i = 0; i < 300; i++) s.update(1/60); s.boss.st = 'rest'; s.boss.hp = 1; window.BRADY_BURNS.CART_ARENA_RULES.man.bossHit(s, s.player, 'spin', { weapon: 'bassdrop' }); for (let i = 0; i < 150; i++) s.update(1/60); return null;`));
    await shoot(page, 'boss-collapsed', boss('dying', `for (let i = 0; i < 300; i++) s.update(1/60); s.boss.st = 'rest'; s.boss.hp = 1; window.BRADY_BURNS.CART_ARENA_RULES.man.bossHit(s, s.player, 'spin', { weapon: 'bassdrop' }); for (let i = 0; i < 330; i++) s.update(1/60); return null;`));
    // portrait HUD
    const pp = await mk(390, 844);
    await shoot(pp, 'hud-fight-portrait', play('sound', 40));
    await shoot(pp, 'boss-portrait', boss('stomp', `for (let i = 0; i < 1200; i++) { s.update(1/60); s.player.invT = 2; if (s.boss.st === 'rest') break; } return null;`));
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
