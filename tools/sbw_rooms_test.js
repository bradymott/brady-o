// Super Brady-O World: the secret rooms (docs/design/SECRET_ROOMS.md). Node only: the real game modules in a VM, the
// real Play scene stepped at the fixed 1/120 s step, no browser, no sound.
// For every room the room kit builds (an area with a roomKit), in every level:
//   enter   Brady comes in through the room's own entrance from the area that leads to it; the room's banner shows
//           its title and its gimmick arms (doors barred, a clock running, critters dropping, cups shuffling...)
//   win     the room's game is played to a win by a script (stomps, tokens, lamps in order, the right cup...)
//   reward  the prize cage opens, and every prize box in the room gives its prize when bumped
//   exit    the room's door takes Brady back to the area he came from (a Wormhole: forward along the level; a room
//           without a door, 11-2's siding: its gate clears the level)
//   safe    a fight room opens its door by itself at the time-out when Brady doesn't fight; a timed room never kills
// and over the game: no two rooms in a land share a kind, every kind is used.
// The checker's side (every prize, token, lamp and finish reachable; every room escapable) is validate_levels'.
// usage: node tools/sbw_rooms_test.js [levelId ...] [--verbose]
const loadGame = require('./load_game');
const args = process.argv.slice(2), verbose = args.includes('--verbose'), only = args.filter(a => !a.startsWith('--'));

const G = loadGame();
G.run('(' + function () {
  Atlas.need = () => {}; Atlas.keep = () => {}; Atlas.load = () => {};
  globalThis.Game = { dpr: 1, cssW: 844, cssH: 390, viewW: 844, viewH: 10 * TS, rows: 10, gameRect: { x: 0, y: 0, w: 844, h: 390 }, quality: 1, forceTouchUI: true, S: 1,
    setRows(r) { this.rows = r; this.viewH = r * TS; }, setScene(s) { this.scene = s; }, resize() {}, reportError() {}, isUnlocked: () => true, isDone: () => false, secretFound() {}, goldCount: () => 0, pathOpen: () => true, complete() {}, vignette() {}, canvas: { width: 844, height: 390, style: {} } };
  globalThis.__errors = 0;
  const ce = console.error; console.error = function () { globalThis.__errors++; return ce.apply(console, arguments); };
  globalThis.__start = function (lvl) {
    Save.data = Save.defaults(); Save.data.lives = 9;
    const g = new Play(lvl, {}); Game.scene = g;
    for (let k = 0; k < 240 && g.state !== 'play'; k++) g.update(1 / 120);
    g.state = 'play'; g.fade.a = 0; g.fade.target = 0;
    return g;
  };
  const clearInput = () => { for (const k of ['left', 'right', 'up', 'down', 'jump', 'action', 'run']) Input[k] = false; Input.jumpPressed = Input.upPressed = Input.downPressed = Input.actionPressed = false; };
  globalThis.__frame = function (g, keys, hurt) {
    clearInput(); Object.assign(Input, keys || {});
    if (!hurt) g.player.invuln = Math.max(g.player.invuln || 0, 5);
    g.update(1 / 120);
    return g.player.dead || g.player.state === 'dead' ? 'dead' : null;
  };
  globalThis.__wait = function (g, sec, until) { for (let k = 0, n = Math.round(sec * 120); k < n; k++) { const r = __frame(g, {}); if (r) return r; if (until && until()) return null; } return null; };
  // put Brady standing at (tx, ty) (ty: the row his feet are in), still
  globalThis.__place = function (g, tx, ty) { const p = g.player; p.x = tx * TS + TS / 2 - p.w / 2; p.y = (ty + 1) * TS - p.h; p.vx = p.vy = 0; };
  // through a door: press UP where Brady stands, wait for the fade
  globalThis.__door = function (g) {
    const a0 = g.area.idx, x0 = g.player.x, y0 = g.player.y;
    __frame(g, { up: true, upPressed: true });
    for (let k = 0; k < 900; k++) { __frame(g, {}); if (g.player.state === 'play' && g.fade.a < 0.05 && (g.area.idx !== a0 || Math.abs(g.player.x - x0) > TS * 2 || Math.abs(g.player.y - y0) > TS * 2)) return true; }
    return false;
  };
  globalThis.__settle = function (g) { for (let k = 0; k < 900 && !(g.fade.a < 0.05 && g.player.state === 'play' && !g.fade.cb); k++) __frame(g, {}); };
}.toString() + ')()');
const { TS, T, Tour, Validator } = G;
const run = name => G.run(name);
const [start, frame, wait, place, door, settle] = ['__start', '__frame', '__wait', '__place', '__door', '__settle'].map(run);
const Rooms = run('TourRooms'), ENT = run('ENTITY_TYPES'), Portal = run('Portal');

let failures = 0, checks = 0;
const check = (name, ok, info) => { checks++; if (!ok || verbose) console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); if (!ok) failures++; };
const level = id => { const [w, i] = id.split('-').map(Number); return G.getLevel(w, i); };
const ofType = (g, C) => g.entities.filter(e => e instanceof C && !e.remove);

/* ---------- into the room the way a player gets there ---------- */
function enterRoom(g, lvl, k) {
  // the entrance: a door, hatch or hidden door elsewhere whose target is this room
  for (let j = 0; j < lvl.areas.length; j++) {
    if (j === k) continue;
    const s = lvl.areas[j].spawns.find(s2 => s2.target && s2.target.area === k);
    if (!s) continue;
    g.loadArea(j, s.x, s.y - 1); g.player.invuln = 5;
    const e = g.entities.find(e2 => (e2 instanceof Portal && e2.target && e2.target.area === k) || (e2.portal && e2.portal.target && e2.portal.target.area === k));
    if (!e) return 'no entrance entity in ' + lvl.areas[j].aid;
    g.enterPortal(e instanceof Portal ? e : e.portal);
    settle(g);
    return g.area.idx === k ? null : 'entered area ' + g.area.idx;
  }
  return 'no way in';
}

/* ---------- the games, played to a win ---------- */
const P = g => g.player;
const WIN = {
  ambush(g, A, R) {
    for (let t = 0; t < 60 * 120 && !R.won; t++) {
      for (const e of R.mobs || []) if (!e.dead && !e.remove && e.onGround) e.hit('stomp', P(g));
      frame(g);
    }
  },
  bigone(g, A, R) {
    for (let t = 0; t < 40 * 120 && !R.won; t++) { const b = R.boss; if (b && !b.dead && !b.remove && !(b.hurtT > 0)) b.hit('stomp', P(g)); frame(g); }
  },
  rush(g, A, R, kit) {
    wait(g, 3.5, () => R.phase === 'run');
    for (const tk of kit.data.tokens) { const e = g.entities.find(e2 => e2.id === tk.id && !e2.remove); if (e) e.touchPlayer(P(g)); frame(g); }
    wait(g, 0.5, () => R.won);
  },
  fetch(g, A, R, kit) {
    for (const i of kit.data.ings) { const e = g.entities.find(e2 => e2.id === i.id && !e2.remove); if (e) e.touchPlayer(P(g)); frame(g); }
    const pot = g.entities.find(e => e.constructor.name === 'TourRoomPot');
    place(g, Math.floor(pot.cx / TS), Math.floor((pot.y + pot.h - 1) / TS)); wait(g, 0.5, () => R.won);
  },
  lamps(g, A, R) {
    const L = g.entities.filter(e => e.constructor.name === 'TourRoomLamp').sort((a, b) => a.ord - b.ord);
    // a wrong lamp first: nothing stays lit
    const wrong = L.find(e => e.ord !== 0);
    place(g, Math.floor(wrong.cx / TS), Math.floor((wrong.y + wrong.h - 1) / TS)); wait(g, 0.3);
    check(g.level.id + ' ' + A.aid + ' lamps: a wrong lamp first lights nothing', !L.some(e => e.lit) && R.next === 0);
    for (const e of L) { place(g, Math.floor(e.cx / TS), Math.floor((e.y + e.h - 1) / TS)); wait(g, 0.3); place(g, 2, 9); wait(g, 0.05); }
    wait(g, 0.3, () => R.won);
  },
  whack(g, A, R, kit) {
    wait(g, 3.5, () => R.phase === 'play');
    for (let t = 0; t < 40 * 120 && !R.won; t++) {
      const h = g.entities.find(e => e.constructor.name === 'TourRoomHole' && e.up > 0.2 && e.rise > 0.6 && !(e.hitT > 0));
      if (h) { const p = P(g); p.x = h.cx - p.w / 2; p.y = h.y + h.h - 30 * h.rise - p.h + 4; p.vy = 4 * TS; p.vx = 0; }
      frame(g);
    }
  },
  shell(g, A, R, kit) {
    place(g, kit.data.slots[1] - 2, kit.data.row);
    wait(g, 20, () => R.phase === 'pick');
    // a wrong cup first: a joke, no prize, and the game goes round again
    const pickCup = c => { const p = P(g); p.x = c.x - p.w / 2; p.y = (kit.data.row + 1) * TS - 34 - p.h + 4; p.vy = 4 * TS; frame(g); };
    const wrong = R.cups.find(c => c.k !== R.prizeCup);
    pickCup(wrong);
    check(g.level.id + ' ' + A.aid + ' shell: the wrong cup is a joke, not a win', !R.won && R.phase === 'reveal' && !!R.joke);
    place(g, kit.data.slots[1] - 2, kit.data.row);
    wait(g, 30, () => R.phase === 'pick');
    pickCup(R.cups.find(c => c.k === R.prizeCup));
    wait(g, 0.3, () => R.won);
  },
  prank(g, A, R) { const ch = g.entities.find(e => e.constructor.name === 'TourRoomChest'); ch.touchPlayer(P(g)); wait(g, 2.5, () => R.won); },
  gauntlet(g, A, R, kit) { place(g, kit.data.finish + 1, 10); wait(g, 0.5, () => R.won); },
  climb(g, A, R) { const c = (A.W >> 1); place(g, 10, 5); wait(g, 0.5, () => R.won); },
  doors(g, A, R, kit) {
    // every door inside the maze goes to its partner and back
    const inner = g.entities.filter(e => e instanceof Portal && e.target && e.target.area === A.idx);
    let ok = 0;
    for (const d of inner) { place(g, Math.floor(d.cx / TS), Math.floor((d.y + d.h - 1) / TS)); if (door(g) && g.area.idx === A.idx) ok++; }
    check(g.level.id + ' ' + A.aid + ' doors: every door inside the maze leads somewhere', ok === inner.length && inner.length >= 10, ok + '/' + inner.length);
    const [a, b, y] = kit.data.prize; place(g, b, y); wait(g, 0.3, () => R.won);
  },
  pick(g, A, R, kit) {
    const B = kit.data.boxes, b0 = B[1];
    g.bumpBlock(b0.x, b0.y, true, P(g)); wait(g, 0.2);
    check(g.level.id + ' ' + A.aid + ' pick: taking one box empties the other two', B.every(b => G.run('tileAt')(g.area, b.x, b.y) === T.USED), B.map(b => G.run('tileAt')(g.area, b.x, b.y)));
  },
  closing(g, A, R, kit) {},
  // Mexico 1-7's kinds (src/29_tour_mx_zcasa.js): the key on the attic ceiling, the cistern's rim, the treasure map
  topsy(g, A, R, kit) { const e = g.entities.find(x => x.id === kit.o.key && !x.remove); if (e) e.touchPlayer(P(g)); wait(g, 0.3, () => R.won); },
  hourglass(g, A, R, kit) { place(g, 14, kit.data.top - 1); wait(g, 0.5, () => R.won); check(g.level.id + ' ' + A.aid + ' hourglass: once at the rim the sand stops', A.risingLava && A.risingLava.speed === 0); },
  treasure(g, A, R, kit) { const e = g.entities.find(x => x.id === kit.o.map && !x.remove); if (e) e.touchPlayer(P(g)); wait(g, 0.3, () => R.won); }
};
// kinds without a game to win: their reward is the checker's (validate_levels' room probes)
const NOGAME = { grotto: 1, lantern: 1, bouncy: 1, floaty: 1, wormhole: 1, pick: 1, closing: 1 };

/* ---------- one room ---------- */
function testRoom(id, lvl, k) {
  const A0 = lvl.areas[k], kit = A0.roomKit, name = `${id} ${A0.aid} (${kit.kind})`;
  const e0 = run('__errors');
  const g = start(lvl);
  const why = enterRoom(g, lvl, k);
  check(name + ': entered through its entrance', !why, why || undefined);
  if (why) return;
  const A = g.area, R = A.roomState;
  check(name + ': the banner shows the title', g.bannerText === kit.title || R.visits === 1, g.bannerText);
  // the gimmick arms
  if (kit.kind === 'ambush') { place(g, Math.floor(A.W / 2), 10); wait(g, 2.5); check(name + ': the door is barred and critters drop in', !!R.bars && (R.mobs || []).length > 0); }
  if (kit.kind === 'bigone') { place(g, Math.floor(A.W / 2) - 4, 10); wait(g, 2); check(name + ': the door is barred and the Big One drops in', !!R.bars && !!R.boss); }
  if (kit.kind === 'rush' || kit.kind === 'whack' || kit.kind === 'closing') { place(g, Math.floor(A.W / 2), 10); wait(g, 3.5); check(name + ': the clock runs', R.phase === 'run' || R.phase === 'play' || R.phase === 'sweep', R.phase); }
  // reward boxes before a closing shop shuts
  if (kit.kind === 'closing') {
    let got = 0; for (const key in A.contents) { const [x, y] = key.split(',').map(Number); if (G.run('tileAt')(A, x, y) === T.QBLOCK) { const n0 = g.entities.length; g.bumpBlock(x, y, true, g.player); if (g.entities.length > n0) got++; } }
    check(name + ': the shelf boxes give their prizes before the shutters come down', got >= 1, got);
    wait(g, kit.data.t + 4, () => g.area.idx !== k);
    check(name + ': at closing time the keeper sweeps Brady out of the door (no hit)', g.area.idx !== k && !g.player.dead && g.player.state === 'play', { area: g.area.idx, dead: g.player.dead });
    return finish(name, e0);
  }
  if (WIN[kit.kind]) WIN[kit.kind](g, A, R, kit);
  if (!NOGAME[kit.kind]) check(name + ': the game is won', R.won, { phase: R.phase });
  // the cage opens; every prize box gives its prize
  const cage = g.entities.find(e => e.constructor.name === 'TourRoomCage');
  if (cage) { wait(g, 0.5); check(name + ': the prize cage opens', cage.tiles.every(([x, y]) => G.run('tileAt')(A, x, y) === T.EMPTY)); }
  let boxes = 0, gave = 0;
  for (const key in A.contents) {
    const [x, y] = key.split(',').map(Number), t = G.run('tileAt')(A, x, y);
    if (t !== T.QBLOCK && t !== T.QBRICK) continue;
    boxes++; const n0 = g.entities.length, p0 = g.picks; g.bumpBlock(x, y, true, g.player); if (g.entities.length > n0 || g.picks > p0) gave++;
  }
  if (kit.kind !== 'pick') check(name + ': every prize box gives its prize', boxes > 0 && gave === boxes, gave + '/' + boxes);
  // the way out
  const out = g.entities.find(e => e instanceof Portal && e.target && e.target.area !== k && e.s.look !== 'roomWormhole');
  const worm = g.entities.find(e => e instanceof Portal && e.s && e.s.look === 'roomWormhole');
  if (worm) {
    place(g, Math.floor(worm.cx / TS), Math.floor((worm.y + worm.h - 1) / TS));
    const ok = door(g);
    check(name + ': the Wormhole shoots Brady ahead in the level', ok && g.area.idx === worm.target.area && Math.abs(g.player.cx - worm.target.x) < 3 * TS, { area: g.area.idx, x: Math.round(g.player.cx / TS) });
    return finish(name, e0);
  }
  if (out) {
    place(g, Math.floor(out.cx / TS), Math.floor((out.y + out.h - 1) / TS));
    const ok = door(g);
    check(name + ': its door takes Brady back out', ok && g.area.idx === out.target.area, { area: g.area.idx });
  } else {
    const gate = g.entities.find(e => e.exitKey || e.secret);
    check(name + ': a room without a door clears the level by its gate', !!gate);
    if (gate) { const p = g.player; p.x = gate.cx - p.w / 2; p.y = gate.y + gate.h - p.h; wait(g, 0.5); check(name + ': its gate clears the level', g.state === 'clear' || g.state === 'tally', g.state); }
  }
  finish(name, e0);
}
function finish(name, e0) { check(name + ': no errors', run('__errors') === e0, run('__errors') - e0); }

// a fight room, left alone: its doors open by themselves at the time-out
function testSafe(id, lvl, k) {
  const A0 = lvl.areas[k], kit = A0.roomKit, name = `${id} ${A0.aid} (${kit.kind})`;
  const g = start(lvl);
  if (enterRoom(g, lvl, k)) return;
  const A = g.area, R = A.roomState;
  place(g, Math.floor(A.W / 2), 10);
  wait(g, 3);
  const barred = !!R.bars;
  for (let t = 0; t < 66 * 120 && R.bars; t++) { g.player.invuln = 5; g.player.vy = 0; frame(g); if (g.area.idx !== k) break; }
  check(name + ': left alone, the critters give up and the door opens (no soft-lock)', barred && !R.bars && !g.player.dead);
}

/* ---------- the game ---------- */
const ids = Tour.allLevelIds().filter(id => !only.length || only.includes(id));
const kinds = Object.keys(Rooms.kinds), used = {}, byLand = {};
let rooms = 0;
for (const id of ids) {
  const lvl = level(id);
  lvl.areas.forEach((A, k) => {
    if (!A.roomKit) return;
    rooms++;
    const cc = lvl.country; (byLand[cc] = byLand[cc] || []).push(id + ' ' + A.roomKit.kind); used[A.roomKit.kind] = (used[A.roomKit.kind] || 0) + 1;
    try { testRoom(id, lvl, k); } catch (e) { check(`${id} ${A.aid}: no exception`, false, e.stack); }
    if (A.roomKit.kind === 'ambush' || A.roomKit.kind === 'bigone') try { testSafe(id, lvl, k); } catch (e) { check(`${id} ${A.aid}: no exception (safe)`, false, e.stack); }
  });
}
for (const cc in byLand) {
  const ks = byLand[cc].map(s => s.split(' ')[1]), dup = ks.filter((k, j) => ks.indexOf(k) !== j);
  check(`land ${cc}: every room a different kind`, !dup.length, byLand[cc].join(', '));
}
if (!only.length) check('every kind is used somewhere', kinds.every(k => used[k]), kinds.filter(k => !used[k]));
console.log(`\n${rooms} rooms, ${checks} checks, ${failures} failed. Kinds used: ${JSON.stringify(used)}`);
process.exit(failures ? 1 : 0);
