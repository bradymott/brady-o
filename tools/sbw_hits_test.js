// Super Brady-O World: what a hit costs Brady (src/28_tour_hc_hits.js), and every boss / enemy touch that should hurt
// him does. Node only (the real game modules in a VM, the real Play scene; no browser, no sound).
//   ladder    one hit takes ONE thing: HANDS item -> jump power -> kandi -> joint -> big -> a life; 2 s of flicker
//             after each step (a second touch takes nothing); the lost thing pops off and can't be picked up again;
//             the star blocks, the Backpack is kept, trips / buffs run on; a grab is released, a carried box dropped;
//             pits still kill outright; what is left after the hits is what carries to the next level
//   bosses    every boss fight (all 17 arenas, mini-bosses included) runs ~40 s with phases forced; every 0.05 s
//             Brady (big, holding a paper plane and Magic Beans, no flicker) is put against the boss's side (feet on
//             its floor, and half way up) and its body touches him: he must lose exactly the plane and start the 2 s
//             flicker. A touch that does nothing must be one of the listed deliberate safe states (the boss reeling
//             from a hit, its weak spot open, its own listed passive acts); anything else fails
//   enemies   every enemy type, spawned beside Brady for 8 s and touched the same way; a harmless touch must be a
//             listed deliberate state (asleep, hidden, underground, waiting under water, stunned, a thief...)
//   ecuador   El Tortugón (2-5) in the real loop: Brady standing in his walk loses his plane, then his beans, then
//             shrinks, one step per touch, never two at once
// usage: node tools/sbw_hits_test.js [--verbose] [--no-sweep]
const loadGame = require('./load_game');
const args = process.argv.slice(2), verbose = args.includes('--verbose'), noSweep = args.includes('--no-sweep');
let failures = 0, passes = 0;
const check = (name, ok, info) => { if (!ok || verbose) console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); if (ok) passes++; else failures++; };

const G = loadGame();
G.run('(' + function () {
  Atlas.need = () => {}; Atlas.keep = () => {}; Atlas.load = () => {};
  globalThis.Game = { dpr: 1, cssW: 844, cssH: 390, viewW: 844, viewH: 10 * TS, rows: 10, gameRect: { x: 0, y: 0, w: 844, h: 390 }, quality: 1, forceTouchUI: true, S: 1,
    setRows(r) { this.rows = r; this.viewH = r * TS; }, setScene(s) { this.scene = s; }, resize() {}, reportError(e) { console.error(e); }, canvas: { width: 844, height: 390, style: {} } };
  let seed = 1; Math.random = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const lv = id => { const [w, i] = id.split('-').map(Number); return getLevel(w, i); };
  globalThis.__start = function (id) {
    Save.data = Save.defaults(); Save.data.lives = 99;
    const g = new Play(lv(id), {}); Game.scene = g;
    for (let k = 0; k < 400 && g.state !== 'play'; k++) g.update(1 / 120);
    g.fade.a = 0; g.fade.target = 0; return g;
  };
  globalThis.__step = function (g, sec, inv) { for (let k = 0, n = Math.round(sec * 120); k < n; k++) { if (inv) g.player.invuln = 99; g.update(1 / 120); } };
  globalThis.__load = function (p, o) {
    p.hands = null; p.sig = null; p.jumpPow = null; p.kandi = 0;
    if (o.power != null && o.power !== p.power) p.setPower(o.power, true);
    if (o.hands) p.holdKind(o.hands);
    if (o.jump) p.jumpPow = { id: o.jump, gas: 1, used: false, pants: 0 };
    if (o.kandi) p.kandi = o.kandi;
  };
  globalThis.__state = p => ({ hands: p.handsKind ? p.handsKind() : null, jump: p.jumpPow ? p.jumpPow.id : null, kandi: p.kandi, power: p.power, dead: !!p.dead, invuln: +(p.invuln || 0).toFixed(2) });
  const keys = ['x', 'y', 'vx', 'vy', 'prevBottom', 'invuln', 'power', 'state', 'dead', 'star', 'kandi', 'onGround', 'grabbedBy', 'mounted', 'stunT', 'slowT', 'hurtFlash', 'w', 'h', 'crouch', 'deathT', 'carrying', 'pound', 'hands', 'sig', 'jumpPow', 'lastHit'];
  // one probe: Brady (big, a paper plane in hands, Magic Beans on his feet, no flicker) against e's side (s -1 left,
  // 1 right), standing (how 'feet') or half way up (how 'mid'); the entity's own touch code runs as the game's would
  globalThis.__probe = function (g, e, s, how) {
    const p = g.player, o = {}; for (const k of keys) o[k] = p[k];
    const ents = g.entities.length, shake = g.shakeAmt;
    p.state = 'play'; p.dead = false; p.grabbedBy = null; p.mounted = false; p.stunT = 0; p.star = 0; p.carrying = null;
    __load(p, { power: 1, hands: 'gear:plane', jump: 'beans' }); p.invuln = 0;
    // a boss whose brain names a hurt box smaller than its hit box (brain.body, e.g. Piwi in 12-5) is probed at that box
    const R = e.boss && e.brain && e.brain.body ? e.brain.body(e) : e;
    const bottom = how === 'mid' ? R.y + R.h * 0.6 + p.h / 2 : R.y + R.h;
    p.x = s < 0 ? R.x - p.w + 6 : R.x + R.w - 6; p.y = Math.min(bottom, R.y + R.h + p.h - 4) - p.h; p.vx = 0; p.vy = 0; p.prevBottom = p.y + p.h;
    let err = null;
    try {
      if (e.enemy && !e.dead && !e.boss) { if (!(e.friendly || e.friendT)) e.touchPlayer(p); }
      else if (e.customCollide) { if (e.collidePlayer(p) === 'body') e.touchPlayer(p); }
      else e.touchPlayer(p);
    } catch (x) { err = x.message; }
    const r = { hands: p.handsKind(), jump: p.jumpPow && p.jumpPow.id, power: p.power, dead: !!p.dead, invuln: p.invuln, stun: p.stunT > 0 || !!p.grabbedBy, err };
    r.one = !r.dead && !r.hands && r.jump === 'beans' && r.power === 1 && Math.abs(r.invuln - 2) < 0.01;   // exactly one step: the plane
    r.none = !r.dead && r.hands === 'gear:plane' && r.jump === 'beans' && r.power === 1 && !(r.invuln > 0);
    // put everything back (a lost-power pop spawned by the probe goes too)
    for (let k = g.entities.length - 1; k >= ents; k--) if (g.entities[k].lost) g.entities.splice(k, 1);
    for (const k of keys) p[k] = o[k]; if (p.h !== o.h) { p.h = o.h; p.w = o.w; }
    g.shakeAmt = shake;
    return r;
  };
  globalThis.__bossLevels = () => { const out = []; for (const C of Object.values(Tour.countries)) for (const id of Tour.levelIds(C)) { const L = lv(id); L.areas.forEach((a, k) => { for (const s of a.spawns) if (s.type === 'boss') out.push({ id, area: k, style: s.style }); }); } return out; };
  globalThis.__toBoss = function (g, area) {
    if (g.area.idx !== area) { const a = g.level.areas[area], an = (a.anchors && (a.anchors.in || a.anchors.start)) || { x: 3 * TS + 16, y: (a.H - 4) * TS }; g.loadArea(area, an.x, an.y, 1); }
    const b = g.entities.find(e => e.boss && !e.remove); if (!b) return null;
    const p = g.player; if (p.power === 0) p.setPower(1, true);
    p.x = b.arenaX0 + 64; p.y = b.floorY - p.h - 4; p.vy = 0;
    __step(g, 4, true); return b;
  };
  globalThis.__fight = function (id, area, secs) {
    const g = __start(id), b = __toBoss(g, area); if (!b) return { err: 'no boss' };
    const p = g.player, acts = {}, things = {};
    let vulnSince = null;
    for (let f = 0; f < secs * 120; f++) {
      p.invuln = 99; p.star = 0;
      const side = b.cx > (b.arenaX0 + b.arenaX1) / 2 ? -1 : 1; p.x = side < 0 ? b.arenaX0 + 8 : b.arenaX1 - p.w - 8; p.vx = 0;
      if (p.power === 0) p.setPower(1, true);
      if (p.state !== 'play' || p.dead) break;
      g.update(1 / 120);
      if (b.remove || b.state === 'dying') break;
      // the fight moves on: an open weak spot is hit after 0.5 s; a stuck fight gets a hit every 14 s; El Tortugón is flipped
      if (f % (120 * 6) === 600 && b.brain.flip) { const v = g.entities.find(e => e.constructor.name === 'EcVent'); if (v) b.brain.flip(b, v); }
      if (f % (120 * 14) === 1600 && b.hp > 1.5 && !b.vuln && b.hurtT <= 0) b.damage(1);
      if (b.vuln) { vulnSince = vulnSince == null ? f : vulnSince; if (f - vulnSince > 60 && b.hp > 1.5) { b.damage(1); vulnSince = null; } } else vulnSince = null;
      if (f % 6 === 0 && b.state === 'fight') {
        const key = b.act + (b.vuln ? '(vuln)' : '') + (b.hurtT > 0 ? '(reel)' : '');
        const A = acts[key] || (acts[key] = { n: 0, one: 0, none: 0, other: [] });
        for (const s of [-1, 1]) for (const how of ['feet', 'mid']) { const r = __probe(g, b, s, how); A.n++; if (r.one) A.one++; else if (r.none) A.none++; else if (A.other.length < 3) A.other.push(r); }
      }
    }
    return { style: b.style, phase: b.phase || 1, acts };
  };
  globalThis.__enemies = function () {
    const out = {};
    for (const type of Object.keys(ENTITY_TYPES)) {
      const g = __start('22-3'), p = g.player; p.setPower(1, true);
      let e; try { e = new ENTITY_TYPES[type](g, { x: p.cx + 120, y: p.y + p.h, dir: -1 }); } catch (err) { continue; }
      if (!e.enemy || e.boss) continue;
      g.spawn(e);
      const st = {};
      for (let f = 0; f < 120 * 8; f++) {
        p.invuln = 99; p.star = 0; if (p.power === 0) p.setPower(1, true);
        p.x = e.cx - 200; p.vx = 0;
        try { g.update(1 / 120); } catch (err) { break; }
        if (e.remove) break;
        if (f % 15 === 0) {
          const key = [e.state, e.mode, e.act, e.bst, e.dead ? 'dead' : '', e.stunT > 0 ? 'stunned' : '', e.friendly ? 'friendly' : '', e.friendT ? 'friendT' : '', e.cfg && e.cfg.harmless ? 'harmless' : ''].filter(Boolean).join('/') || '-';
          const S = st[key] || (st[key] = { n: 0, one: 0, none: 0, other: [] });
          for (const s of [-1, 1]) { const r = __probe(g, e, s, 'feet'); S.n++; if (r.one) S.one++; else if (r.none) S.none++; else if (S.other.length < 2) S.other.push(r); }
        }
      }
      out[type] = { cls: e.constructor.name, states: st };
    }
    return out;
  };
}.toString() + ')()');
const start = id => G.run('__start')(id), step = (g, s, inv) => G.run('__step')(g, s, inv), load = (p, o) => G.run('__load')(p, o), state = p => G.run('__state')(p);
const foe = { x: 0, y: 0, w: 20, h: 20 };
const hitFrom = p => ({ x: p.x + p.w + 4, y: p.y, w: 20, h: 20 });

/* ---------- the ladder ---------- */
{
  const g = start('22-3'), p = g.player;
  load(p, { power: 2, hands: 'gear:plane', jump: 'beans', kandi: 1 });
  const seq = [];
  for (let k = 0; k < 7; k++) {
    p.invuln = 0; p.hurt(hitFrom(p)); const s = state(p); const pops = g.entities.filter(e => e.lost).map(e => e.kind); seq.push({ after: s, step: p.lastHit, pops });
    if (s.dead) break;
    // a second touch at once: the flicker takes nothing
    const before = JSON.stringify(state(p)); p.hurt(hitFrom(p)); seq[seq.length - 1].second = JSON.stringify(state(p)) === before;
    for (const e of g.entities) if (e.lost) e.remove = true; step(g, 0.02);
  }
  const want = ['hands', 'feet', 'kandi', 'joint', 'big', 'life'];
  check('ladder: plane -> beans -> kandi -> joint -> big -> a life, one step per hit', seq.map(s => s.step).join() === want.join(), seq.map(s => s.step));
  check('ladder: each step leaves exactly what it should', seq[0].after.hands === null && seq[0].after.jump === 'beans' && seq[1].after.jump === null && seq[1].after.kandi === 1 && seq[2].after.kandi === 0 && seq[2].after.power === 2 && seq[3].after.power === 1 && seq[4].after.power === 0 && seq[5].after.dead, seq.map(s => s.after));
  check('ladder: every step starts the 2 s flicker, and a second touch inside it takes nothing', seq.slice(0, 5).every(s => Math.abs(s.after.invuln - 2) < 0.01 && s.second), seq.map(s => [s.after.invuln, s.second]));
  check('ladder: the plane, the beans, the joint and the mushroom pop off him', seq[0].pops.includes('gear:plane') && seq[1].pops.includes('gear:beans') && seq[3].pops.includes('joint') && seq[4].pops.includes('mushroom'), seq.map(s => s.pops));
}
{
  // lost things are gone: before, the dropped item hovered where he stood and he took it straight back
  const g = start('22-3'), p = g.player; load(p, { power: 1, hands: 'gear:plane' }); p.invuln = 0; p.hurt(hitFrom(p));
  step(g, 3);
  check('a lost item is not picked up again (Brady standing still for 3 s)', !p.handsKind() && !g.entities.some(e => e.item && e.dropped), state(p));
  load(p, { power: 1, jump: 'socks' }); p.invuln = 0; p.hurt(hitFrom(p)); step(g, 3);
  check('a lost jump power is not picked up again', !p.jumpPow, state(p));
  load(p, { power: 1 }); p.clearHands(); p.collectTour('sig:taco'); p.invuln = 0; p.hurt(hitFrom(p)); step(g, 0.1);
  check('the signature item sits in HANDS: the first thing a hit takes', !p.sig && p.power === 1, state(p));
  load(p, { power: 1, hands: 'gear:hat' }); p.invuln = 0; p.hurt(hitFrom(p));
  check('the Hard Hat is a HANDS item: it takes the hit and is lost (CLONK)', !p.hands && p.power === 1);
}
{
  // not part of the ladder
  const g = start('22-3'), p = g.player; load(p, { power: 1, hands: 'gear:plane' }); p.pack = 'gear:kazoo';
  p.star = 3; p.invuln = 0; p.hurt(hitFrom(p));
  check('the star: no damage, nothing lost', p.hands && p.power === 1 && !(p.invuln > 0), state(p));
  p.star = 0; p.lsdT = 5; g.dizzy = 3; p.buffs.magnet = 6; p.invuln = 0; p.hurt(hitFrom(p));
  check('the Backpack is a reserve: kept through a hit', p.pack === 'gear:kazoo', { pack: p.pack });
  check('trips and buffs are effects, not armour: the hit still took the plane, the LSD / colours / magnet run on', !p.hands && p.lsdT === 5 && g.dizzy === 3 && p.buffs.magnet === 6, { hands: p.handsKind(), lsd: p.lsdT });
  // a grab: released, one step
  load(p, { power: 1, hands: 'gear:plane' }); p.lsdT = 0; p.invuln = 0; let released = false; p.grabbedBy = { release() { released = true; } }; p.hurt(hitFrom(p));
  check('grabbed: the hit lets go and takes one step', released && !p.grabbedBy && !p.hands && p.power === 1, state(p));
  // a carried box: dropped, and one step
  load(p, { power: 1, hands: 'gear:plane' }); p.invuln = 0; let dropped = false; p.carrying = { item: 'egg', fallY: p.y }; const dc = p.dropCarry; p.dropCarry = function () { dropped = true; this.carrying = null; }; p.hurt(hitFrom(p)); p.dropCarry = dc; delete p.dropCarry;
  check('carrying: the box drops and the hit takes one step', dropped && !p.hands && p.power === 1, state(p));
  // pits still kill outright
  load(p, { power: 2, hands: 'gear:plane', jump: 'beans', kandi: 1 }); p.invuln = 0; p.die('pit');
  check('a pit kills outright, whatever he holds', p.dead);
}
{
  // what is left after the hits carries on
  const g = start('1-1'), p = g.player; load(p, { power: 1, hands: 'gear:plane', jump: 'beans' });
  p.invuln = 0; p.hurt(hitFrom(p)); step(g, 0.05);
  g.levelClear({ cx: p.cx, y: p.y, exitKey: 'main' });
  const c = G.Save.data.tour && G.Save.data.tour.carry;
  check('carry: after a hit took the plane, the next level gets the beans and big, not the plane', c && !c.hands && c.jump && c.jump.id === 'beans' && c.power === 1, c);
}

/* ---------- the swap loop (the football freeze) ---------- */
{
  // gear in hands, the Backpack full, a signature item touched: the old hands item drops on Brady; taking it straight
  // back (the same collision pass) dropped the other one on him, and so on forever: memory filled and the page died
  for (const setup of [{ power: 2, hands: 'gear:plane', jump: 'beans' }, { power: 1, hands: 'gear:kazoo' }, { power: 0, hands: 'gear:hat', jump: 'socks' }]) {
    const g = start('3-5'), p = g.player; load(p, setup); p.pack = 'gear:wand'; p.invuln = 99;
    const it = new (G.run('TourItem'))(g, p.cx, p.y + p.h, 'sig:ball'); it.emerge = 1; g.spawn(it);
    const n0 = g.entities.length; let n1 = 0, ok = true;
    try { for (let k = 0; k < 120; k++) { g.update(1 / 120); n1 = Math.max(n1, g.entities.length); if (n1 > n0 + 20) { ok = false; break; } } } catch (e) { ok = false; console.error(e); }
    const drop = g.entities.find(e => e.item && e.dropped);
    check(`swap loop (${setup.hands}, Backpack full, ${setup.jump || 'no jump power'}, form ${setup.power}): taking the FOOTBALL ends in one frame, the old item drops once`, ok && p.handsKind() === 'sig:ball' && p.pack === 'gear:wand' && drop && drop.kind === setup.hands, { hands: p.handsKind(), pack: p.pack, drop: drop && drop.kind, ents: [n0, n1] });
    // stepping clear of the drop and back takes it again (a normal swap, one drop)
    if (drop) { p.x = drop.cx + 4 * 32; g.update(1 / 120); p.x = drop.cx - p.w / 2; p.y = drop.y + drop.h - p.h; const m0 = g.entities.length; for (let k = 0; k < 30; k++) g.update(1 / 120); check(`swap loop (${setup.hands}): stepping clear and back takes the dropped item again, one swap`, p.handsKind() === setup.hands && g.entities.length <= m0 + 2, { hands: p.handsKind(), ents: [m0, g.entities.length] }); }
  }
}

/* ---------- Ecuador: El Tortugón in the real loop ---------- */
{
  const g = start('2-5'), B = G.run('__bossLevels')().find(b => b.id === '2-5'), b = G.run('__toBoss')(g, B.area), p = g.player;
  for (let k = 0; k < 120 * 3 && b.act !== 'walk'; k++) { p.invuln = 99; g.update(1 / 120); }
  load(p, { power: 1, hands: 'gear:plane', jump: 'beans' }); p.invuln = 0;
  const log = [];
  // Brady stands in his way; the tortoise walks into him (re-placed in front of him after each knock-back)
  for (let k = 0; k < 120 * 12; k++) {
    if (b.act !== 'walk' && b.act !== 'pause') { b.go('walk'); }
    const s0 = state(p);
    if (!(p.invuln > 0)) { p.x = b.dir < 0 ? b.x - p.w + 4 : b.x + b.w - 4; p.y = b.floorY - p.h; p.vx = 0; p.vy = 0; p.prevBottom = p.y + p.h; }
    g.update(1 / 120);
    const s1 = state(p);
    if (JSON.stringify([s0.hands, s0.jump, s0.power, s0.dead]) !== JSON.stringify([s1.hands, s1.jump, s1.power, s1.dead])) log.push({ t: +(k / 120).toFixed(2), lost: p.lastHit, after: [s1.hands, s1.jump, s1.power, s1.dead] });
    if (p.dead || log.length >= 4) break;
  }
  check(`Ecuador boss (${b.state}): walking into Brady costs the plane, then the beans, then big, then a life`, log.map(l => l.lost).join() === 'hands,feet,big,life', log);
  check('Ecuador boss: never two steps at once (at least ~2 s between them)', log.every((l, i) => i === 0 || l.t - log[i - 1].t >= 1.9), log.map(l => l.t));
}

{
  // his head on its long neck reaches ~16 px past the shell: standing under it (not touching the shell) hurts
  const g = start('2-5'), B = G.run('__bossLevels')().find(b => b.id === '2-5'), b = G.run('__toBoss')(g, B.area), p = g.player;
  for (let k = 0; k < 120 * 3 && b.state !== 'fight'; k++) { p.invuln = 99; g.update(1 / 120); }
  const res = [];
  for (const act of ['pause', 'rear']) {
    b.go(act); b.vx = 0; b.dir = -1; b.x = (b.arenaX0 + b.arenaX1) / 2; b.at = 0.05; b.first = false;
    load(p, { power: 1, hands: 'gear:plane' }); p.invuln = 0;
    p.x = b.x - p.w - 4; p.y = b.y + b.h - p.h; p.vx = 0; p.vy = 0; p.prevBottom = p.y + p.h;
    const before = !!p.handsKind(); b.update(1 / 120);
    res.push({ act, before, after: p.handsKind(), gap: Math.round(b.x - (p.x + p.w)) });
  }
  check('Ecuador boss: his head (past the shell) hurts like his body, walking or rearing', res.every(r => r.before && !r.after), res);
}

{
  // solid parts drawn past a boss's hurt box (src/28_tour_hd_reach.js): inside one, Brady is touched like by the body;
  // just past its end, nothing; while the boss reels or its weak spot is open, nothing
  const BR = G.run('BossReach'), res = [];
  for (const B of G.run('__bossLevels')()) {
    const L = BR.LIST[B.style]; if (!L) continue;
    for (const r of L) {
      const g = start(B.id), b = G.run('__toBoss')(g, B.area), p = g.player;
      for (let k = 0; k < 120 * 4 && b.state !== 'fight'; k++) { p.invuln = 99; g.update(1 / 120); }
      const act = (r.acts && r.acts[0]) || (r.poses && r.poses[0]) || 'walk';
      const pose = (r.poses && r.poses[0]) || (r.notPoses ? 'walk' : act);
      const set = () => { b.act = act; b.pose = pose; b.vuln = false; b.hurtT = 0; b.dir = r.dir || -1; b.x = (b.arenaX0 + b.arenaX1) / 2 - b.w / 2; };
      const tryAt = (dx, mod) => {
        set(); if (mod) mod();
        const q = BR.boxes(b).find(z => z.part === r.part);
        load(p, { power: 1, hands: 'gear:plane' }); p.invuln = 0; p.state = 'play'; p.dead = false;
        // facing left, the part is on the left: Brady's right edge just inside it (or 2 px short of it)
        if (b.dir > 0) p.x = dx === 'in' ? q.x + 2 : q.x + q.w + 2; else p.x = dx === 'in' ? q.x + q.w - 2 - p.w : q.x - 2 - p.w; p.y = q.y + q.h / 2 - p.h / 2; p.vx = 0; p.vy = 0; p.prevBottom = p.y + p.h;
        const touchesBody = G.run('overlap')(p, b);
        BR.check(g); return { lost: !p.handsKind(), touchesBody };
      };
      const inside = tryAt('in'), past = tryAt('past'), reel = tryAt('in', () => { b.hurtT = 0.5; }), weak = tryAt('in', () => { b.vuln = true; });
      res.push({ boss: B.style, part: r.part, inside, past, reel, weak });
      check(`reach ${B.style} ${r.part}${r.dir ? (r.dir > 0 ? ' (facing right)' : ' (facing left)') : ''}: inside it Brady loses one thing; past its end, while reeling or with the weak spot open, nothing`, inside.lost && !inside.touchesBody && !past.lost && !reel.lost && !weak.lost, { inside, past, reel, weak });
    }
  }
}

/* ---------- the sweeps ---------- */
// the deliberate safe touches (each is coded on purpose in the boss's or enemy's own file)
const BOSS_SAFE = {
  '*': ['(reel)', '(vuln)'],                                   // Boss.touchPlayer: reeling after a hit, the weak spot open
  id_kera: ['fall', 'dizzy', 'surrender', 'climb'],           // 29_tour_id.js touch(): fallen, dizzy, climbing the tree
  jp_kappa: ['bow', 'bonk', 'finalbow', 'tuck'],              // 29_tour_jp.js: bowing, bonked on the wall
  ma_berrad: ['dive', 'inside', 'trapped'],                   // 29_tour_ma.js: inside his pot
  mz_hermit: ['inshell', 'shell', 'hide', 'idle', 'walk'],    // 29_tour_mz.js: passive while in a shell (not lunging)
  vn_phin: ['scald', 'wobble', 'stunned', 'empty'],           // 29_tour_vn.js
  nl_cheese: ['buried'], np_baron: ['finale'], np_tinyak: ['rattle'], aq_walrus: ['exit'], aq_plough: ['melt'], w22_other: ['crack', 'frozen'],
  fest_limiter: ['exit'],                                      // 29_tour_fest.js: blowing its own fuse
  lost_hydra: ['exit'],                                        // 29_tour_lost.js: folding itself up, all paired
  // Australia (16): the Drop Bear is up in the crown, out of reach, while he lurks and takes aim (29_tour_au_kit.js touch())
  au_dropbear: ['lurk', 'aim'],
  ke_kiboko: ['swim', 'dive', 'rise'],                         // 29_tour_ke_boss.js: under the water (only her eyes show)
  // The Spare Bone Quarry (37): a bone lies loose to be seated (paddleDown, heelDown, curlDown), it shudders after one
  // is seated (seated, recover), it sits down at the end (sit): 29_tour_y_bone_c_boss.js touch()
  bone_animal: ['paddleDown', 'heelDown', 'curlDown', 'seated', 'recover', 'sit'],
  // Postmark Sound (27): touching the Postmaster's Thumb never hurts; only its stamp's impact under its ring and its
  // rolling ink stripe do (29_tour_y_post_c_boss.js touch())
  post_thumb: ['hover', 'rise', 'ring', 'stamp', 'down', 'edge', 'roll', 'rings', 'double', 'mailed']
};
const ENEMY_SAFE_TOKENS = ['wait', 'sleep', 'under', 'hide', 'stunned', 'stun', 'friendly', 'friendT', 'harmless', 'perch', 'disguise', 'fade', 'gone', 'dead', 'snatch', 'flee', 'grab'];
const ENEMY_SAFE_TYPES = {
  frMagpie: 'a thief: it snatches, it does not hurt', idMacaque: 'a thief', tourThief: 'a thief',
  aqEggSkua: 'a bird overhead: its egg hurts, not the bird', nlGull: 'a bird overhead: its drop hurts', esStork: 'a stork overhead: its bundle hurts',
  frOyster: 'opens and shuts: hurts while open', w22Envelope: 'a fluttering letter (scenery)',
  // Table for Two (36): the butter curl melts into a harmless puddle (its joke), then pulls itself together
  tabButter: 'a puddle of butter while melted (29_tour_y_table.js harmlessWhen)',
};
// Wrong Side of the Wash (26): Her Fitted Majesty is cloth (her corners hurt, never her body: 29_tour_y_wash_c_boss.js
// touch()); a net critter touches only Brady on its own face of the net, peg jaws only while snapped shut (customCollide)
Object.assign(BOSS_SAFE, { wash_majesty: ['drift', 'aim', 'snap', 'back', 'pucker', 'sweep', 'balloon', 'shake'] });
Object.assign(ENEMY_SAFE_TYPES, { washCrawler: 'on a drying net: touches only Brady on its own face (customCollide)', washJaws: 'peg jaws on a timer: hurt only while snapped shut (customCollide)' });
// The Orchard After Closing (28): the Windfall Committee never hurts by touch (its drops and lunges do: 29_tour_y_orch_c_boss.js
// touch()); a trellis critter touches only Brady on its own face of the trellis (customCollide)
Object.assign(BOSS_SAFE, { orch_committee: ['idle', 'tell', 'move', 'sit', 'flick', 'back'] });
Object.assign(ENEMY_SAFE_TYPES, { orchCrawler: 'on a trellis: touches only Brady on its own face (customCollide)' });
// The Umbrella Repair District (31): the Inspector is cloth and wire (his tip hurts in an attack, never his body:
// 29_tour_y_umb_c_boss.js touch()); a canopy critter touches only Brady on its own face (customCollide)
Object.assign(BOSS_SAFE, { umb_inspector: ['back', 'tell', 'poke', 'scoop', 'jab', 'caught', 'drop'] });
Object.assign(ENEMY_SAFE_TYPES, { umbCrawler: 'on a canopy: touches only Brady on its own face (customCollide)' });
// The Unflattering Gallery (30): touching the Retoucher never hurts; only his paint sweep, his blot and his lunge do
// (29_tour_y_gal_c_boss.js touch()); the gilt gnat is harmless while it slips, the profile pigeon while it hides, the
// cord rack's gnat touches only Brady on its own face (customCollide)
Object.assign(BOSS_SAFE, { gal_retoucher: ['raise', 'drip', 'pullback', 'sweep', 'pause1', 'flourish', 'fling', 'pause2', 'chin', 'lunge', 'pause3', 'sold'] });
Object.assign(ENEMY_SAFE_TYPES, { galGnat: 'harmless while it slips on the shine (29_tour_y_gal.js harmlessWhen)', galPigeon: 'harmless while it hides in profile (29_tour_y_gal.js harmlessWhen)', galCrawler: 'on a cord rack: touches only Brady on its own face (customCollide)' });
// Foley Beach (29): a hiss kettle that has startled itself silent is harmless for two seconds (its joke); a boom crab on the
// cargo net touches only Brady on its own side of the ropes (customCollide)
Object.assign(ENEMY_SAFE_TYPES, { foleyKettle: 'silent and harmless after it startles itself (29_tour_y_foley.js harmlessWhen)', foleyNetCrab: 'on the cargo net: touches only Brady on its own side (customCollide)' });
const OLD_TYPES = { greeter: 1, pony: 1 };   // the old Black Rock City enemies (08a_chunks.js / 10b_burners.js): in no tour level
if (!noSweep) {
  const noHurt = [];
  for (const B of G.run('__bossLevels')()) {
    const r = G.run('__fight')(B.id, B.area, 40);
    if (r.err) { check(`${B.id} boss found`, false, r.err); continue; }
    const safe = (BOSS_SAFE['*']).concat(BOSS_SAFE[r.style] || []);
    let bad = [], one = 0, n = 0;
    for (const [k, A] of Object.entries(r.acts)) {
      n += A.n; one += A.one;
      if (A.none) { const ok = safe.some(s => k.includes(s)) || safe.includes(k.replace(/\(.*$/, '')); noHurt.push(`${B.id} ${r.style} ${k}: ${A.none}/${A.n} safe${ok ? '' : ' (NOT LISTED)'}`); if (!ok) bad.push(`${k} ${A.none}/${A.n}`); }
      if (A.other.length) bad.push(`${k}: not exactly one step ${JSON.stringify(A.other[0])}`);
    }
    check(`boss ${B.id} ${r.style}: every touch takes exactly one thing, or is a listed safe state (${one}/${n} touches hurt, phase ${r.phase})`, !bad.length, bad.join('; ') || undefined);
  }
  const en = G.run('__enemies')();
  for (const [t, o] of Object.entries(en)) {
    if (OLD_TYPES[t]) continue;
    const bad = [];
    let n = 0, one = 0;
    for (const [k, S] of Object.entries(o.states)) {
      n += S.n; one += S.one;
      if (S.none) { const ok = !!ENEMY_SAFE_TYPES[t] || ENEMY_SAFE_TOKENS.some(s => k.split('/').includes(s)); noHurt.push(`${t} ${k}: ${S.none}/${S.n} safe${ENEMY_SAFE_TYPES[t] ? ' (' + ENEMY_SAFE_TYPES[t] + ')' : ''}${ok ? '' : ' (NOT LISTED)'}`); if (!ok) bad.push(`${k} ${S.none}/${S.n}`); }
      if (S.other.length && !S.other.every(r => r.dead || r.stun)) bad.push(`${k}: not exactly one step ${JSON.stringify(S.other[0])}`);
    }
    check(`enemy ${t}: every touch takes exactly one thing, or is a listed safe state (${one}/${n})`, !bad.length, bad.join('; ') || undefined);
  }
  if (verbose) { console.log('\nsafe touches seen:'); for (const l of noHurt) console.log('  ' + l); }
}
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
