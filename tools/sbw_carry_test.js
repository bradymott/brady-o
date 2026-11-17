// Super Brady-O World: powers carry from one level to the next (src/28_tour_dk_carry.js). Node only: the real game
// modules in a VM, the real Play scene, no browser.
//   kinds     clear a level holding each kind of power (form, hands gear, signature item, jump power, buffs, the star,
//             the LSD flight, the trip colours, the picker's choice): the next level, whichever, starts with it
//   timed     a timed power carries the time left at the exit, not a fresh one
//   save      the carry is in the save: a reload (a closed app) keeps it; an old save without it loads and plays
//   rules     a death respawns Brady with nothing (as before) and leaves the store alone; GAME OVER -> CONTINUE too;
//             RESTART LEVEL / the map give the stored carry again; a clear always overwrites it; the Hydration
//             Station gift and opts.power still apply (the larger one wins)
//   parked    a level that starts on a ride / autoscroll or underwater keeps the LSD flight and the flying carpet
//             waiting, and the next level that starts on foot gives them back
//   audit     (report only) levels where a free flight (the LSD tab, the carpet) reaches the main exit without a key /
//             switch the normal route needs; with --jumps also the jump powers, approximated as a 1.29x jump (Spring
//             Socks and Magic Beans both top out near 6.9 tiles against 4.1 for a plain jump; about 2 more minutes)
// usage: node tools/sbw_carry_test.js [--verbose] [--no-audit] [--jumps]
const loadGame = require('./load_game');
const args = process.argv.slice(2), verbose = args.includes('--verbose'), noAudit = args.includes('--no-audit'), jumps = args.includes('--jumps');

let failures = 0, passes = 0;
const check = (name, ok, info) => { if (!ok || verbose) console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); if (ok) passes++; else failures++; };

function boot(opts) {
  const G = loadGame(opts);
  G.run('(' + function () {
    Atlas.need = () => {}; Atlas.keep = () => {}; Atlas.load = () => {};
    globalThis.Game = { dpr: 1, cssW: 844, cssH: 390, viewW: 844, viewH: 10 * TS, rows: 10, gameRect: { x: 0, y: 0, w: 844, h: 390 }, quality: 1, forceTouchUI: true, S: 1,
      setRows(r) { this.rows = r; this.viewH = r * TS; }, setScene(s) { this.scene = s; }, resize() {}, reportError(e) { console.error(e); }, isUnlocked: () => true, isDone: () => false, secretFound() {}, goldCount: () => 0, pathOpen: () => true, complete() {}, vignette() {}, canvas: { width: 844, height: 390, style: {} } };
    globalThis.__errors = [];
    const lv = id => { const [w, i] = id.split('-').map(Number); return getLevel(w, i); };
    globalThis.__lv = lv;
    // start a level the way the map does (opts {}), or a respawn ({ checkpoint })
    globalThis.__start = function (id, opts) {
      const g = new Play(lv(id), opts || {}); Game.scene = g;
      return g;
    };
    globalThis.__play = function (g, sec) { for (let k = 0, n = Math.round(sec * 120); k < n; k++) { g.player.invuln = Math.max(g.player.invuln || 0, 1); g.update(1 / 120); } };
    // through the intro to play
    globalThis.__go = function (g) { for (let k = 0; k < 400 && g.state !== 'play'; k++) g.update(1 / 120); g.fade.a = 0; g.fade.target = 0; return g.state; };
    // touch the main exit (the level's own gate entity when there is one)
    globalThis.__clear = function (g) {
      const gate = g.entities.find(e => e instanceof Gate && !e.secret) || { cx: g.player.cx, y: g.player.y, exitKey: 'main' };
      g.levelClear(gate); return g.state;
    };
    // a death: the real flow (Play.onPlayerDead fades, then builds the respawn or the GAME OVER scene)
    globalThis.__die = function (g) { g.player.die('pit'); for (let k = 0; k < 1200 && Game.scene === g; k++) { if (g.state !== 'dead' && g.player.dead && g.player.deathT > 4) g.onPlayerDead(); g.update(1 / 120); } return Game.scene; };
  }.toString() + ')()');
  return G;
}

/* ---------- kinds, timed, rules ---------- */
const G = boot();
const S = () => G.Save.data;
const fresh = () => { G.Save.data = G.Save.defaults(); S().lives = 9; G.run('Game.scene = null'); };
const start = (id, opts) => G.run('__start')(id, opts);
const go = g => G.run('__go')(g);
const clear = g => G.run('__clear')(g);
const play = (g, s) => G.run('__play')(g, s);
const carry = () => S().tour && S().tour.carry;
const J = x => JSON.parse(JSON.stringify(x));

// clear `from` holding what `setup` gives, then start `to` fresh: returns the new Play
function through(from, to, setup) {
  const g = start(from); go(g);
  setup(g, g.player);
  const st = clear(g);
  if (st !== 'clear') throw new Error('the level did not clear: ' + st);
  return start(to);
}
fresh();
{
  // 1. form: the magic mushroom (big), the joint
  let n = through('1-1', '2-1', (g, p) => p.setPower(1, true));
  check('form: big carries (1-1 -> 2-1)', n.player.power === 1, { power: n.player.power });
  n = through('2-1', '3-2', (g, p) => p.setPower(2, true));
  check('form: the joint (smoke puffs) carries (2-1 -> 3-2)', n.player.power === 2, { power: n.player.power });
  // nothing held: small, nothing
  n = through('3-2', '1-1', (g, p) => { p.setPower(0, true); p.hands = null; p.sig = null; p.jumpPow = null; });
  check('nothing held: the next level starts small with nothing', n.player.power === 0 && !n.player.hands && !n.player.sig && !n.player.jumpPow && !(n.player.lsdT > 0) && !(n.player.star > 0), J(carry()));

  // 2. hands: gear with uses left, the signature item from another land
  n = through('1-1', '6-1', (g, p) => p.holdKind('gear:plane'));
  check('hands: the paper plane carries (1-1 -> 6-1)', n.player.hands && n.player.hands.id === 'plane', J(n.player.hands));
  const globe = G.TourGear.get('globe');
  if (globe && globe.uses) {
    n = through('6-1', '8-1', (g, p) => { p.holdKind('gear:globe'); p.hands.uses = 1; });
    check('hands: gear with uses keeps the uses left', n.player.hands && n.player.hands.id === 'globe' && n.player.hands.uses === 1, J(n.player.hands));
  }
  n = through('1-1', '4-1', (g, p) => { p.clearHands(); p.collectTour('sig:taco'); });
  check('hands: Mexico\'s taco toss carries into Mozambique (1-1 -> 4-1)', n.player.sig && n.player.sig.id === 'taco' && !n.player.hands, J(n.player.sig));
  n = through('4-1', '4-1', (g, p) => { p.clearHands(); p.collectTour('sig:piri'); p.sig.t = 4.5; });
  check('hands: a timed signature item (piri-piri, 4.5 s left) keeps its time', n.player.sig && n.player.sig.id === 'piri' && Math.abs(n.player.sig.t - 4.5) < 0.01, J(n.player.sig));

  // 3. feet: each jump power (a full gas meter)
  for (const id of ['socks', 'cake', 'beans']) {
    n = through('1-1', '5-3', (g, p) => { p.clearHands(); p.takeJump(G.TourGear.get(id)); if (id === 'beans') p.jumpPow.gas = 0.2; });
    check(`feet: ${id} carries (1-1 -> 5-3)`, n.player.jumpPow && n.player.jumpPow.id === id && n.player.jumpPow.gas === 1, J(n.player.jumpPow));
  }
  // and through a door in the next level (the existing door carry still holds it)
  {
    const g = n; go(g);
    const door = g.entities.find(e => e.target && e.target.area !== g.area.idx && typeof e.kind === 'string');
    if (door) { g.enterPortal(door); for (let k = 0; k < 900 && (g.area.idx === 0 || g.fade.a > 0.05); k++) g.update(1 / 120); check('feet: the carried Magic Beans go through a door too', g.player.jumpPow && g.player.jumpPow.id === 'beans', { area: g.area.idx }); }
  }
  // all at once: Magic Beans + hands gear + big (the screenshot loadout)
  n = through('1-1', '2-1', (g, p) => { p.setPower(1, true); p.holdKind('gear:plane'); p.takeJump(G.TourGear.get('beans')); });
  check('all at once: big + paper plane + Magic Beans', n.player.power === 1 && n.player.hands && n.player.hands.id === 'plane' && n.player.jumpPow && n.player.jumpPow.id === 'beans');

  // 4. buffs, star, LSD, trip colours: the time left
  n = through('1-1', '2-1', (g, p) => { p.buffs.magnet = 3.25; });
  check('buffs: the magnet keeps its 3.25 s', Math.abs((n.player.buffs.magnet || 0) - 3.25) < 0.01, J(n.player.buffs));
  n = through('2-1', '3-2', (g, p) => { p.collectTour('lsd'); play(g, 0); p.lsdT = 6; });
  check('timed: 6 s of LSD at the exit -> 6 s at the next start', Math.abs(n.player.lsdT - 6) < 0.01, { lsdT: n.player.lsdT });
  go(n); play(n, 1);
  check('timed: ... and it runs down in play (about 5 s after a second)', n.player.lsdT > 4.8 && n.player.lsdT < 5.2 && n.lsdK > 0, { lsdT: n.player.lsdT, lsdK: n.lsdK });
  n = through('3-2', '1-1', (g, p) => { p.star = 4; });
  check('timed: the star\'s 4 s carry (cleared levels take it away at the gate; it is read first)', Math.abs(n.player.star - 4) < 0.01, { star: n.player.star });
  go(n); play(n, 1);
  check('timed: ... the star runs out normally in the next level', n.player.star > 2.8 && n.player.star < 3.2, { star: n.player.star });
  play(n, 3.5);
  check('timed: ... and ends (music back)', n.player.star === 0);
  n = through('1-1', '2-1', (g, p) => { p.collectTour('mushroom'); g.dizzy = 2.5; });
  check('timed: the mushroom\'s dizzy colours carry their 2.5 s', Math.abs(n.dizzy - 2.5) < 0.01 && n.player.power >= 1, { dizzy: n.dizzy });
  n = through('2-1', '3-2', (g, p) => { p.collectTour('joint'); g.tripJoint = 0.9; });
  check('timed: the joint\'s green moment carries its 0.9 s', Math.abs(n.tripJoint - 0.9) < 0.01 && n.player.power === 2, { tripJoint: n.tripJoint });

  // 5. the picker's choice
  n = through('1-1', '2-1', (g, p) => { p.setPower(2, true); p.holdKind('gear:plane'); G.run('TourPicker').got(g, 'gear:plane'); G.run('TourPicker').got(g, 'joint'); });
  check('picker: the active power (smoke puffs, picked last) is still the active one', G.run('TourPicker').active(n.player) === 'joint', { active: G.run('TourPicker').active(n.player) });

  // 6. the Backpack keeps its old rule (live in Save.data.pack): still there next level
  {
    const g = start('1-1'); go(g); g.player.pack = 'gear:kazoo'; play(g, 0.05); clear(g);
    const m = start('2-1');
    check('backpack: the spare still comes along (its old rule, Save.data.pack)', m.player.pack === 'gear:kazoo', { pack: m.player.pack });
    m.player.pack = null; S().pack = null;
  }

  // 7. Hydration Station + opts.power: the larger one wins
  S().gifts = { hydration: true };
  n = through('1-1', '2-1', (g, p) => p.setPower(2, true));
  check('hydration gift + carried joint: the joint (2) wins', n.player.power === 2);
  n = through('2-1', '3-2', (g, p) => p.setPower(0, true));
  check('hydration gift + nothing carried: still starts big', n.player.power === 1);
  S().gifts = {};
  {
    const g = start('1-1'); go(g); g.player.setPower(1, true); clear(g);
    const m = new (G.run('Play'))(G.run('__lv')('2-1'), { power: 2 });
    check('opts.power (NEXT) 2 + carried big 1: 2 wins', m.player.power === 2);
  }

  // 8. dying, quitting, game over, replay
  {
    const g0 = start('1-1'); go(g0); g0.player.setPower(1, true); g0.player.takeJump(G.TourGear.get('beans')); clear(g0);
    const stored = J(carry());
    const g = start('2-1'); go(g);
    check('rules: entering with the carry', g.player.power === 1 && g.player.jumpPow && g.player.jumpPow.id === 'beans');
    g.player.holdKind('gear:plane');
    const sc = G.run('__die')(g);
    const isPlay = sc && sc !== g && sc.constructor.name === 'Play';
    check('rules: a death respawns Brady small with nothing (the in-level rule, as before)', isPlay && sc.player.power === 0 && !sc.player.jumpPow && !sc.player.hands, { scene: sc && sc.constructor.name, power: sc && sc.player && sc.player.power });
    check('rules: ... and leaves the stored carry as it was on entry', JSON.stringify(J(carry())) === JSON.stringify(stored), J(carry()));
    // RESTART LEVEL / the map: a fresh start gets the stored carry again
    const r = start('2-1');
    check('rules: RESTART LEVEL / re-entering from the map gives the stored carry again', r.player.power === 1 && r.player.jumpPow && r.player.jumpPow.id === 'beans');
    // GAME OVER -> CONTINUE: a respawn too
    const c = start('2-1', { checkpoint: null });
    check('rules: GAME OVER -> CONTINUE (a respawn) starts with nothing', c.player.power === 0 && !c.player.jumpPow);
    // quitting with more than he came with does not store it
    const q = start('2-1'); go(q); q.player.setPower(2, true); q.player.holdKind('gear:plane'); /* WORLD MAP */
    check('rules: quitting stores nothing new', JSON.stringify(J(carry())) === JSON.stringify(stored));
    // a replay of a cleared level overwrites it
    const rp = start('1-1'); go(rp); rp.player.setPower(0, true); rp.player.jumpPow = null; clear(rp);
    check('rules: a clear (a replay too) always overwrites the store', carry().power === 0 && !carry().jump, J(carry()));
  }

  // 9. a secret exit and a boss level clear store it too
  {
    const g = start('1-1'); go(g); g.player.setPower(2, true);
    g.levelClear({ cx: g.player.cx, y: g.player.y, secret: true, exitKey: 'secret' });
    check('a secret exit stores the carry', carry() && carry().power === 2, J(carry()));
    const b = start('1-5'); go(b); b.player.holdKind('gear:plane'); b.player.setPower(1, true);
    if (b.boss && b.bossDefeated) { try { b.bossDefeated(b.boss); } catch (e) { /* the boss's own effects */ } }
    clear(b);
    check('a boss level clear stores the carry', carry() && carry().hands && carry().hands.id === 'plane' && carry().from === '1-5', J(carry()));
  }

  // 10. parked: a ride / underwater start keeps the flight waiting
  {
    const g = start('1-1'); go(g); g.player.collectTour('lsd'); g.player.lsdT = 7; g.player.setPower(1, true); clear(g);
    const r = start('1-2');   // Xochimilco: a boat on a rail
    check('parked: 1-2 (a boat ride) starts without the LSD flight, the rest given', !(r.player.lsdT > 0) && r.player.power === 1 && r.carryParked && r.carryParked.lsd === 7, { lsdT: r.player.lsdT, parked: r.carryParked });
    go(r); r.player.lsdT = 0; clear(r);
    check('parked: clearing 1-2 keeps the waiting 7 s in the store', carry().lsd === 7, J(carry()));
    const w = start('1-3');   // the cenote: underwater
    check('parked: 1-3 (underwater) keeps it waiting too', !(w.player.lsdT > 0) && w.carryParked && w.carryParked.lsd === 7);
    go(w); clear(w);
    const f = start('1-4');
    check('parked: 1-4 (on foot) gives the 7 s back', Math.abs(f.player.lsdT - 7) < 0.01, { lsdT: f.player.lsdT });
    // a death on the ride: what waits keeps waiting
    go(f); f.player.lsdT = 0; clear(f);
    const g2 = start('1-1'); go(g2); g2.player.lsdT = 5; clear(g2);
    const r2 = start('1-2'); go(r2);
    const sc = G.run('__die')(r2);
    check('parked: a death on the ride keeps the waiting LSD waiting', sc && sc.carryParked && sc.carryParked.lsd === 5 && !(sc.player.lsdT > 0), { parked: sc && sc.carryParked });
    go(sc); clear(sc);
    check('parked: ... and it is stored again at the clear', carry().lsd === 5);
    // the flying carpet: waits on a ride, its hands slot is free there
    const m = start('1-1'); go(m); m.player.clearHands(); m.player.collectTour('sig:carpet'); m.player.sig.t = 8; clear(m);
    const v = start('10-2');   // Ha Long junk ride
    check('parked: the flying carpet waits on a ride (10-2)', !v.player.sig && v.carryParked && v.carryParked.sig && v.carryParked.sig.id === 'carpet');
    go(v); v.player.holdKind('gear:plane'); clear(v);
    check('parked: cleared holding new gear: the gear is in hands, the carpet still waits', carry().hands && carry().hands.id === 'plane' && carry().parked && carry().parked.sig.id === 'carpet', J(carry()));
    const x = start('10-1'); go(x); x.player.clearHands(); clear(x);
    const y = start('10-3');
    check('parked: hands free at a level start on foot: the carpet comes back with its 8 s', y.player.sig && y.player.sig.id === 'carpet' && Math.abs(y.player.sig.t - 8) < 0.01, J(y.player.sig));
  }

  // 11. a broken or unknown carry never stops a level
  {
    G.run('TourProgress').data().carry = { v: 1, power: 7, hands: { id: 'nonsense' }, sig: { id: 'nope' }, jump: { id: 'boots' }, buffs: { x: 'y' }, lsd: 'a', pick: { hist: 'no' } };
    let ok = true, g; try { g = start('2-1'); go(g); play(g, 0.5); } catch (e) { ok = false; console.error(e); }
    check('a broken carry (unknown ids, odd values) starts the level anyway', ok && g && !g.player.hands && g.player.power <= 2, { power: g && g.player.power });
    G.run('TourProgress').data().carry = null;
  }
}

/* ---------- save: reload and old saves ---------- */
{
  fresh();
  const g = start('1-1'); go(g); g.player.setPower(2, true); g.player.takeJump(G.TourGear.get('beans')); g.player.holdKind('gear:plane'); g.player.lsdT = 6; clear(g);
  const store = Object.assign({}, G.store);
  const H = boot({ store, load: true });
  const c = H.Save.data.tour && H.Save.data.tour.carry;
  check('save: the carry survives a reload (the app closed between levels)', c && c.power === 2 && c.jump && c.jump.id === 'beans' && c.hands && c.hands.id === 'plane' && c.lsd === 6, c);
  const n = H.run('__start')('3-2');
  check('save: ... and the next level after the reload starts with it', n.player.power === 2 && n.player.jumpPow && n.player.jumpPow.id === 'beans' && n.player.hands && n.player.hands.id === 'plane' && Math.abs(n.player.lsdT - 6) < 0.01);
  // an old save: no tour.carry at all (and one with no tour)
  const old = JSON.parse(store[H.Save.key]); delete old.tour.carry;
  const O = boot({ store: { [H.Save.key]: JSON.stringify(old) }, load: true });
  let ok = true, m; try { m = O.run('__start')('3-2'); O.run('__go')(m); O.run('__play')(m, 0.5); } catch (e) { ok = false; console.error(e); }
  check('save: an old save without the carry loads and plays (small, nothing)', ok && m.player.power === 0 && !m.player.jumpPow && O.Save.key === H.Save.key);
  const old2 = JSON.parse(store[H.Save.key]); delete old2.tour;
  const O2 = boot({ store: { [H.Save.key]: JSON.stringify(old2) }, load: true });
  ok = true; try { m = O2.run('__start')('1-1'); O2.run('__go')(m); O2.run('__clear')(m); } catch (e) { ok = false; console.error(e); }
  check('save: a save with no tour block at all: a clear creates the carry', ok && O2.Save.data.tour && O2.Save.data.tour.carry && O2.Save.data.tour.carry.from === '1-1');
  check('save: the save key is unchanged (super-brady-o-world-save-v2)', H.Save.key === 'super-brady-o-world-save-v2', H.Save.key);
}

/* ---------- audit: what a free flight can skip ---------- */
if (!noAudit) {
  const A = boot();
  const { Validator, T, TS } = A;
  const SOLID = A.run('SOLID');
  // a free flight: every area is searched like water (move anywhere through air), and Brady may rise two rows above
  // the top of the area as he can in the game (the LSD flight, the carpet and the beans stop at y = -2 tiles)
  const flood0 = Validator.flood;
  const flight = (fn) => {
    const pa = Validator.proxyArea;
    Validator.proxyArea = function (area, mask) { const P = pa.call(this, area, mask); P.water = true; return P; };
    Validator.flood = function (Ar, ai, sx, sy, markBox, portalCheck, seamCell) {
      const W = Ar.W, H = Ar.H;
      const free = (x, y) => x >= 0 && x < W && y < H && (y < 0 || (!SOLID[Ar.tiles[y * W + x]] && Ar.tiles[y * W + x] !== T.LAVA));
      const ok = (x, y) => y >= -1 && free(x, y) && free(x, y - 1);
      const seen = new Set(); const q = [[sx, sy - 1]];
      while (q.length) {
        const [x, y] = q.pop(); const k = y * 4096 + x;
        if (x < 0 || x >= W || y >= H || seen.has(k) || !ok(x, y)) continue;
        seen.add(k);
        const b = { x: x * TS + 5, y: (y - 1) * TS + 4, w: 22, h: 54 };
        markBox(ai, b); portalCheck(ai, b); if (seamCell && y >= 0) seamCell(x, y);
        q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    };
    try { return fn(); } finally { Validator.proxyArea = pa; Validator.flood = flood0; }
  };
  const without = (lvl, gd) => Object.assign({}, lvl, { areas: lvl.areas.map(a => {
    const b = Object.assign({}, a, { spawns: a.spawns.filter(s => !(gd.key && s.type === 'key' && s.id === gd.key)), vkeys: (a.vkeys || []).filter(v => v.id !== gd.key) });
    if (gd.noSwitch != null && a.toggles) { b.toggles = {}; for (const g in a.toggles) b.toggles[g] = Object.assign({}, a.toggles[g], { switches: +g === gd.noSwitch ? [] : a.toggles[g].switches, auto: +g === gd.noSwitch ? false : a.toggles[g].auto }); }
    return b;
  }) });
  const flagged = [], jumpFlagged = [];
  const sim0 = Validator.simulate;
  const higher = (fn) => { Validator.simulate = function (Ar, ai, tx, ty, m, D, markBox, jb, f) { return sim0.call(this, Ar, ai, tx, ty, m, D, markBox, (jb || 1) * 1.29, f); }; try { return fn(); } finally { Validator.simulate = sim0; } };
  let nLevels = 0, nReq = 0;
  for (const C of Object.values(A.Tour.countries)) for (const id of A.Tour.levelIds(C)) {
    const [w, i] = id.split('-').map(Number); const lvl = A.getLevel(w, i); nLevels++;
    const guards = [];
    for (const a of lvl.areas) { for (const L of a.locks || []) { guards.push({ key: L.id }); for (const k of L.needsAll || []) guards.push({ key: k }); } for (const g in a.toggles || {}) if ((a.toggles[g].switches || []).length) guards.push({ noSwitch: +g }); }
    const seenG = new Set();
    for (const gd of guards) {
      const gk = JSON.stringify(gd); if (seenG.has(gk)) continue; seenG.add(gk);
      const cut = without(lvl, gd);
      const walk = Validator.run(cut, { earlyExit: true, until: r => !!r.exits.main });
      if (walk.exits.main) continue;          // not needed for the main exit
      nReq++;
      const fly = flight(() => Validator.run(cut, { until: r => !!r.exits.main }));
      const what = `${id} ${lvl.name}: ${gd.key ? "key '" + gd.key + "'" : 'switch group ' + gd.noSwitch}`;
      if (fly.exits.main) flagged.push(what);
      if (jumps && higher(() => Validator.run(cut, { until: r => !!r.exits.main })).exits.main) jumpFlagged.push(what);
    }
  }
  console.log(`\naudit (report only): ${nLevels} levels, ${nReq} keys / switches the walking route needs; a free flight gets past ${flagged.length} of them:`);
  for (const f of flagged) console.log('  ' + f);
  if (jumps) { console.log(`a 1.29x jump (Spring Socks / Magic Beans) gets past ${jumpFlagged.length}:`); for (const f of jumpFlagged) console.log('  ' + f); }
}

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
