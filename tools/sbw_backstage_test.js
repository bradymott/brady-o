// Super Brady-O World: backstage areas, Wormholes, Brady Buttons and the bonus lands (docs/design/BACKSTAGE_STATUS.md).
// Node part (the real game modules in a VM, the real Play scene stepped at 1/120 s, no browser, no sound):
//   seams     every backstage area: Brady goes in through its entrance the way a player does (off the top on the spring,
//             left off the start, past the gate, down the odd pit), lands in the backstage area with his velocity and
//             powers, and the way back takes him out again
//   warps     every Wormhole: a plain touch does nothing; Up sucks Brady in, the level clears through the warp exit
//             (WORMHOLE!), and the save says where it leads (the target unlocked, the map's arrival / hop queued)
//   progress  in-land and cross-land Wormholes on the maps: trails, warp links from the airstrip, nothing earlier
//             marked done, exit pips
//   buttons   every Brady Button: jumping on it does nothing, a slap revokes its rule at once (saved), opens what the
//             rule opens, the map reveal is queued, and slapping again changes nothing
//   checker   the validator catches a backstage trap and a seam with no way back (negative fixtures)
// Browser part (needs BRADY_DIST, one browser at a time): tools/sbw_backstage_shots.js.
// usage: node tools/sbw_backstage_test.js [section ...] [--verbose]
const loadGame = require('./load_game');
const args = process.argv.slice(2), verbose = args.includes('--verbose'), only = args.filter(a => !a.startsWith('--'));
const want = s => !only.length || only.includes(s);

const G = loadGame();
G.run('(' + function () {
  Atlas.need = () => {}; Atlas.keep = () => {}; Atlas.load = () => {};
  globalThis.Game = { dpr: 1, cssW: 844, cssH: 390, viewW: 844, viewH: 10 * TS, rows: 10, gameRect: { x: 0, y: 0, w: 844, h: 390 }, quality: 1, forceTouchUI: true, S: 1,
    setRows(r) { this.rows = r; this.viewH = r * TS; }, setScene(s) { this.scene = s; }, resize() {}, reportError() {}, isUnlocked: () => true, isDone: () => false, secretFound() {}, goldCount: () => 0, pathOpen: () => true, complete() {}, vignette() {}, canvas: { width: 844, height: 390, style: {} } };
  globalThis.__errors = 0;
  const ce = console.error; console.error = function () { globalThis.__errors++; return ce.apply(console, arguments); };
  globalThis.__start = function (lvl, keep) {
    if (!keep) { Save.data = Save.defaults(); Save.data.lives = 9; }
    const g = new Play(lvl, {}); Game.scene = g;
    for (let k = 0; k < 240 && g.state !== 'play'; k++) g.update(1 / 120);
    g.state = 'play'; g.fade.a = 0; g.fade.target = 0;
    return g;
  };
  const clearInput = () => { for (const k of ['left', 'right', 'up', 'down', 'jump', 'action', 'run']) Input[k] = false; Input.jumpPressed = Input.upPressed = Input.downPressed = Input.actionPressed = false; };
  globalThis.__frame = function (g, keys, hurt) {
    clearInput(); Object.assign(Input, keys || {});
    if (!hurt && g.player) g.player.invuln = Math.max(g.player.invuln || 0, 5);
    g.update(1 / 120);
    return g.player && (g.player.dead || g.player.state === 'dead') ? 'dead' : null;
  };
  globalThis.__hold = function (g, keys, sec, until) { for (let k = 0, n = Math.round(sec * 120); k < n; k++) { const r = __frame(g, k ? Object.assign({}, keys, { jumpPressed: false, upPressed: false, actionPressed: false }) : keys); if (r) return r; if (until && until()) return null; } return 'timeout'; };
  globalThis.__place = function (g, tx, ty) { const p = g.player; p.x = tx * TS + TS / 2 - p.w / 2; p.y = (ty + 1) * TS - p.h; p.vx = p.vy = 0; };
}.toString() + ')()');
const { TS, Tour } = G;
const run = name => G.run(name);
const [start, frame, hold, place] = ['__start', '__frame', '__hold', '__place'].map(run);
const TP = G.TourProgress, Save = G.Save;

let failures = 0, checks = 0;
const check = (name, ok, info) => { checks++; if (!ok || verbose) console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); if (!ok) failures++; };
const level = id => { const [w, i] = id.split('-').map(Number); return G.getLevel(w, i); };
const aidOf = (lvl, k) => lvl.areas[k].aid;

/* every backstage area in the game, with the seam that leads into it */
function backstages() {
  const out = [];
  for (const id of Tour.allLevelIds()) {
    const lvl = level(id);
    lvl.areas.forEach((a, k) => {
      if (a.role !== 'backstage') return;
      let from = null;
      lvl.areas.forEach((b, j) => { for (const s of b.seams || []) if (j !== k && s.target && s.target.area === k) from = { area: j, seam: s }; });
      out.push({ id, lvl, k, aid: a.aid, from });
    });
  }
  return out;
}

/* ---------- seams: in the way a player gets in, back out the way back ---------- */
// put Brady just before the seam and press the way through it; returns the area he ends up in (or null)
function goThrough(g, ai, s) {
  const A = g.level.areas[ai];
  if (g.area.idx !== ai) g.loadArea(ai, A.anchors.in ? A.anchors.in.x : 64, A.anchors.in ? A.anchors.in.y : 64);
  const p = g.player, mid = Math.floor((s.a + s.b) / 2);
  const before = g.area.idx;
  const moved = () => g.area.idx !== before;
  if (s.side === 'top') {
    // a launcher under the span: a spring or a bouncy surface; else jump
    const sp = g.entities.find(e => e.constructor.name === 'Spring' && Math.floor(e.cx / TS) >= s.a - 1 && Math.floor(e.cx / TS) <= s.b + 1);
    if (sp) { p.x = sp.cx - p.w / 2; p.y = sp.y - p.h - 6; p.vy = 2 * TS; p.vx = 0; }
    hold(g, { jump: true }, 3, moved);
  } else if (s.side === 'bottom') {
    // stand over the pit (the lowest solid row above it) and drop in, pressing down (sinks through mud too)
    const solid = run('SOLID'); let ty = A.H - 1; while (ty > 0 && !solid[A.tiles[ty * A.W + mid]]) ty--;
    p.x = mid * TS + TS / 2 - p.w / 2; p.y = (ty + 1) * TS + 4; p.vx = 0; p.vy = 0;
    hold(g, { down: true }, 4, moved);
  } else {
    const left = s.side === 'left', row = s.b;
    p.x = left ? TS * 1.5 : (A.W - 2) * TS - p.w; p.y = (row + 1) * TS - p.h; p.vx = 0; p.vy = 0;
    hold(g, left ? { left: true } : { right: true }, 3, moved);
  }
  return g.area.idx !== before ? g.area.idx : null;
}
if (want('seams')) {
  const list = backstages();
  check('there is at least one backstage area', list.length > 0, list.length);
  for (const B of list) {
    const tag = B.id + ' ' + B.aid;
    check(tag + ': a seam leads into it', !!B.from, B.from && B.from.seam.side);
    if (!B.from) continue;
    const g = start(B.lvl);
    g.player.power = 1;   // a power to carry through
    const s = B.from.seam;
    const got = goThrough(g, B.from.area, s);
    check(tag + `: through the ${s.side} seam of ${aidOf(B.lvl, B.from.area)} Brady arrives here`, got === B.k, { got: got != null ? aidOf(B.lvl, got) : null });
    if (got !== B.k) continue;
    check(tag + ': powers come along (big Brady stays big)', g.player.power === 1, g.player.power);
    if (s.side === 'top') check(tag + ': arriving from below he keeps rising (velocity kept)', g.player.vy < 0, g.player.vy);
    check(tag + ': the curtain whip plays', !!g.seamFx);
    hold(g, {}, 1);
    check(tag + ': he lands safe, no death', !g.player.dead && g.state === 'play');
    // the way back
    const back = (g.area.seams || []).find(x => x.target && x.target.area !== B.k);
    if (back) {
      const got2 = goThrough(g, B.k, back);
      check(tag + `: the way back (${back.side} seam) leads out to ${back.target ? aidOf(B.lvl, back.target.area) : '?'}`, got2 === back.target.area, { got: got2 });
      hold(g, {}, 1);
      check(tag + ': back out, he lands safe', !g.player.dead);
    } else {
      const door = g.entities.find(e => e.constructor.name === 'Portal' && e.target && e.target.area !== B.k);
      check(tag + ': a way back (a seam or a door)', !!door);
    }
  }
}

/* ---------- warps ---------- */
if (want('warps')) {
  const W = run('TourSecrets').warps();
  check('there is at least one Wormhole', W.length > 0, W.length);
  for (const w of W) {
    const lvl = level(w.id), tag = `${w.id} ${w.key} -> ${w.to} (${w.label})`;
    let ai = -1, sp = null;
    lvl.areas.forEach((a, k) => { const s = a.spawns.find(x => x.type === 'warp' && (x.exit || 'warp') === w.key); if (s && !sp) { sp = s; ai = k; } });
    check(tag + ': the Wormhole is placed', !!sp);
    if (!sp) continue;
    const g = start(lvl);
    g.loadArea(ai, sp.x, sp.y); g.player.invuln = 5;
    const e = g.entities.find(x => x.isWarp);
    check(tag + ': it is a Wormhole entity', !!e);
    // a plain touch does nothing
    hold(g, {}, 1);
    check(tag + ': standing at it without Up does nothing', g.state === 'play' && !e.used);
    // Up: in he goes
    hold(g, { up: true, upPressed: true }, 0.1);
    check(tag + ': Up sucks Brady in', e.used && g.player.state === 'portal');
    hold(g, {}, 1.5);
    check(tag + ': the level clears through the warp exit', g.state !== 'play' && g.exitKey === w.key, { state: g.state, key: g.exitKey });
    check(tag + ': the results say WORMHOLE!', run('TourHooks').titleFor(g) === 'WORMHOLE!', run('TourHooks').titleFor(g));
    check(tag + ': Brady stays inside (hidden, no victory walk)', g.player.state === 'portal');
    check(tag + ': the screen fills with the wormhole', !!g.warpFx);
    const T = TP.data();
    check(tag + ': the exit is saved, the level done, the target unlocked', Save.data.exits[w.id] && Save.data.exits[w.id][w.key] && Save.data.done[w.id] && Save.data.unlocked[w.to]);
    if (w.cc !== w.toCc) {
      check(tag + ': the arrival is queued for the map', T.arrive && T.arrive.at === w.to && T.arrive.cc === w.toCc, T.arrive);
      check(tag + ': the route map reveal is queued', T.pending.some(r => r.kind === 'warp' && r.id === w.to), T.pending);
      check(tag + ': the warp link from the airstrip is saved', T.warpLinks[w.toCc] && T.warpLinks[w.toCc][w.to] === w.id);
      const TC = Tour.countries[w.toCc];
      check(tag + ': the target land opens; nothing earlier there is marked done', TP.countryUnlocked(TC) && TP.isUnlocked(w.to) && !Tour.levelIds(TC).some(id => Save.data.done[id]));
    } else check(tag + ': the hop is queued for the map', T.hop && T.hop.to === w.to, T.hop);
    for (let k = 0; k < 6 * 120 && g.state !== 'results'; k++) frame(g);
    check(tag + ': on to the results screen, no errors', g.state === 'results' && run('__errors') === 0, { state: g.state, errors: run('__errors') });
  }
}

/* ---------- progress on the maps ---------- */
if (want('progress')) {
  const W = run('TourSecrets').warps(), TG = run('TourGraph');
  for (const w of W) {
    const tag = `${w.id} ${w.key}`;
    Save.data = Save.defaults(); const T = TP.data();
    const C = Tour.countries[w.cc], TC = Tour.countries[w.toCc];
    const before = TP.exitsFound(w.id);
    TP.exit(w.id, w.key);
    // play the reveals the way the maps do
    for (const r of T.pending.slice()) TP.revealDone(r);
    const E = TG.edges(TC, TG.nodes(TC));
    if (w.cc === w.toCc) {
      const e = E.find(x => (x.a === w.id && x.b === w.to) || (x.b === w.id && x.a === w.to));
      check(tag + ': an in-land Wormhole draws a walkable wormhole trail', e && e.open && e.warp, e);
    } else {
      const e = E.find(x => x.a === 'start' && x.b === w.to);
      check(tag + ': a cross-land Wormhole links the target to the airstrip (never stranded)', e && e.open && e.visible && e.warp, e);
      check(tag + ': walkable from the airstrip', !!TG.route(E, 'start', w.to));
      check(tag + ': only the target and its land open, no earlier level done', !Tour.levelIds(TC).some(id => Save.data.done[id]));
    }
    check(tag + ': the exit pips count the Wormhole', before.total >= 2 && TP.exitsFound(w.id).found >= 1, { before, after: TP.exitsFound(w.id) });
  }
}

/* ---------- buttons ---------- */
if (want('buttons')) {
  const RULES = run("typeof TOUR_RULES !== 'undefined' ? TOUR_RULES : null"), TR = run("typeof TourRules !== 'undefined' ? TourRules : null");
  if (!RULES || !TR) check('buttons: TOUR_RULES and TourRules exist', false);
  else for (const n in RULES) {
    const R = RULES[n], tag = `rule ${n} (${R.title})`;
    let lvl = null, ai = -1, sp = null;
    for (const id of Tour.allLevelIds()) { const L = level(id); L.areas.forEach((a, k) => { const s = a.spawns.find(x => x.type === 'button' && x.rule === +n); if (s && !sp) { sp = s; ai = k; lvl = L; } }); if (sp) break; }
    check(tag + ': its button is placed', !!sp);
    if (!sp) continue;
    const g = start(lvl);
    g.loadArea(ai, sp.x - 2.2 * TS, sp.y); g.player.invuln = 5;
    const b = g.entities.find(e => e.isButton && e.rule === +n);
    check(tag + ': it is a Brady Button entity', !!b);
    if (!b) continue;
    // jumping on it does nothing
    const p = g.player; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 40; p.vy = 6 * TS;
    hold(g, {}, 0.8);
    check(tag + ': landing on it does nothing', !TR.isRevoked(+n) && !b.pressed);
    // slap it from the side: stand next to it, Action
    p.x = b.x - p.w - 2; p.y = b.y + b.h - p.h; p.vx = p.vy = 0; p.facing = 1;
    hold(g, {}, 0.3);
    hold(g, { action: true, actionPressed: true }, 0.1);
    hold(g, {}, 0.5);
    const T = TP.data();
    check(tag + ': a slap from the side revokes the rule, saved at once', TR.isRevoked(+n) && T.rules[n] && T.rules[n].at === lvl.id, T.rules);
    for (const o of [].concat(R.opens || [])) {
      const t = Tour.target(o, null);
      if (t.kind === 'land') check(tag + `: opens ${o} (the land unlocks, its reveal is queued)`, T.lands[t.id] && TP.countryUnlocked(Tour.countries[t.id]) && T.pending.some(r => r.kind === 'land' && r.id === t.id));
      else if (t.kind === 'level') check(tag + `: opens ${o}`, TP.isUnlocked(t.id));
    }
    check(tag + ': the cut to the map plays', !!g.buttonFx, g.buttonFx && g.buttonFx.t);
    hold(g, {}, 6);
    check(tag + ': the cut ends and play goes on', !g.buttonFx && g.state === 'play');
    const pend = T.pending.length;
    p.x = b.x - p.w - 2; p.y = b.y + b.h - p.h; p.vx = p.vy = 0; p.facing = 1;
    hold(g, { action: true, actionPressed: true }, 0.1); hold(g, {}, 0.5);
    check(tag + ': slapping it again changes nothing', T.pending.length === pend && !g.buttonFx);
    check(tag + ': no errors', run('__errors') === 0, run('__errors'));
  }
}

/* ---------- the checker catches traps ---------- */
if (want('checker')) {
  const VL = require('./validate_levels.js'), C = Tour.countries.mx, TB = G.TourBuild;
  const mainRows = ['############################'].concat(Array.from({ length: 8 }, () => '#..........................#'),
    ['#.@......................G.#', '#####..#####################', '#####..#####################', '#####..#####################', '#####..#####################']);
  // a backstage room (16 rows): the way back is the right edge (rows 7-9), a Wormhole on the floor; pocket: a 4-wide,
  // 5-deep hole in the floor with sheer sides that Brady can drop into and never jump out of
  const bkRows = pocket => ['############################'].concat(
    Array.from({ length: 6 }, () => '#..........................#'),
    ['#...........................', '#...........................', '#.@.......w.................'],
    Array.from({ length: 5 }, () => pocket ? '####################....####' : '############################'),
    ['############################']);
  const mk = pocket => TB.fromSpec(C, { name: 'Trap Lab', arch: 'bonus', theme: 'mx_mercado', exits: { main: {}, warp: { to: '1-3', via: 'warp', label: 'LAB' } }, areas: [
    { id: 'main', gen: 'room', stamp: { floor: 9, rows: mainRows }, seams: [{ side: 'bottom', a: 5, b: 6, to: 'bk@in', tell: 'mat' }] },
    { id: 'bk', gen: 'room', role: 'backstage', zone: 'under', theme: 'bk_under', stamp: { floor: 10, rows: bkRows(pocket), legend: { w: ['spawn', 'warp', { exit: 'warp' }] } },
      back: { side: 'right', span: [7, 9], to: 'main@start' } }] }, 9);
  const flagsOf = L => { const r = G.Validator.run(L, { earlyExit: true }), f = []; VL.secretChecks(G, L, r, f, []); return f; };
  const f1 = flagsOf(mk(true));
  check('checker: a backstage pocket you cannot climb out of is a TRAP', f1.some(f => /BACKSTAGE bk TRAP/.test(f)), f1);
  const f2 = flagsOf(mk(false));
  check('checker: the same room without the pocket has no TRAP', !f2.some(f => /TRAP/.test(f)), f2);
}

console.log(`\n${checks - failures}/${checks} backstage checks passed`);
process.exit(failures ? 1 : 0);
