// Super Brady-O World: what comes out of an item block (a gift box: pinata block, patisserie box, bento, chest...)
// always ends up in free space where Brady can collect it. Node only: the real game modules in a VM, the real Play
// scene stepped at the fixed 1/120 s step, no browser.
// Sections:
//   fixture  small rooms: a ceiling, the top of the area, a one-way panel, a box closed on three and on four sides; the
//            open-above pop unchanged; tiles growing back over an item (crumble, toggle group); a dropped item under a
//            low ceiling; a mushroom between two walls; a magnet pulling an item against a wall
//   open     a box on the floor opens from above (landing, the pound), when hit by anything thrown, and by a kick
//   levels   every item block of all 88 levels, bumped from below (small Brady, and big Brady for mushroom blocks, in
//            every toggle state of its area): the item must never be inside a solid, inside a one-way panel or out of
//            the area, must not be lost in a pit or lava at once, and (where it did not simply pop up into open air)
//            the validator's Brady must be able to touch it (Validator.run probes). --reach checks every item's reach
//            (a full validator search per level: about two minutes on six cores instead of a few seconds).
// usage: node tools/sbw_items_test.js [fixture] [levels] [--levels 2-1,4-1] [--reach] [--list] [--jobs N]
const path = require('path'), os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const loadGame = require('./load_game');

/* ---------- the headless game: a stand-in for Game (99_main.js is not loaded), no atlases, optional collecting ---------- */
function boot() {
  const G = loadGame();
  G.run('(' + function () {
    Atlas.need = () => {}; Atlas.keep = () => {}; Atlas.load = () => {};
    globalThis.Game = { dpr: 1, cssW: 844, cssH: 390, viewW: 844, viewH: 10 * TS, rows: 10, gameRect: { x: 0, y: 0, w: 844, h: 390 }, quality: 1, forceTouchUI: true, S: 1,
      setRows(r) { this.rows = r; this.viewH = r * TS; }, setScene(s) { this.scene = s; }, resize() {}, reportError() {}, isUnlocked: () => true, isDone: () => false, secretFound() {}, goldCount: () => 0, pathOpen: () => true, complete() {}, vignette() {}, canvas: { width: 844, height: 390, style: {} } };
    const tc = TourItem.prototype.touchPlayer;
    TourItem.prototype.touchPlayer = function (p) { if (globalThis.__noCollect) return; return tc.call(this, p); };
    // 1 px of slack: a walker slipping off a block corner overlaps it by a fraction of a pixel for a frame
    const solidIn = (A, b) => !regionFree(A, b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    const tileIn = (A, b, t, m) => { for (let ty = Math.floor((b.y + m) / TS); ty <= Math.floor((b.y + b.h - m) / TS); ty++) for (let tx = Math.floor((b.x + m) / TS); tx <= Math.floor((b.x + b.w - m) / TS); tx++) if (tileAt(A, tx, ty) === t) return true; return false; };
    const box = e => ({ x: e.x, y: e.y, w: e.w, h: e.h });
    const why = (A, b, walker) => solidIn(A, b) ? 'inside a solid' : (b.y < -4 || b.x < 0 || b.x + b.w > A.W * TS) ? 'out of the area' : (!walker && tileIn(A, b, T.SEMI, 6)) ? 'inside a one-way panel' : null;
    globalThis.__why = why;
    // a Play on the level, Brady (frozen, unhurt, not collecting) standing under block (tx, ty) of area ai, in toggle state mask
    globalThis.__play = function (lvl, ai, tx, ty, power, mask) {
      Save.data = Save.defaults(); Save.data.lives = 9;
      const g = new Play(lvl, { power }); Game.scene = g;
      const h = power > 0 ? PLAYER_DIM.big.h : PLAYER_DIM.small.h;
      g.loadArea(ai, tx * TS + TS / 2, (ty + 1) * TS + h, power);
      g.player.power = power; g.state = 'play'; g.fade.a = 0; g.fade.target = 0;
      g.camX = Math.max(0, g.player.cx - Game.viewW / 2); g.camY = g.camTargetY(true);   // the camera on Brady (the active window follows it)
      if (mask) { const P0 = Validator.proxyArea(lvl.areas[ai], 0), P = Validator.proxyArea(lvl.areas[ai], mask), A = g.area; for (let i = 0; i < A.tiles.length; i++) if (P.tiles[i] !== P0.tiles[i]) A.tiles[i] = P.tiles[i]; }
      for (const e of g.entities) if (e.enemy || e.boss) e.remove = true;
      g.player.invuln = 1e9; g.player.update = function () {}; g.timeLeft = 999;
      globalThis.__noCollect = true;
      return g;
    };
    globalThis.__step = (g, sec) => { for (let k = 0, n = Math.round(sec * 120); k < n; k++) { g.update(1 / 120); g.player.state = 'play'; g.player.dead = false; g.state = 'play'; } };
    // bump a block and follow what comes out for 2 s
    globalThis.__bump = function (lvl, ai, tx, ty, power, mask) {
      const g = __play(lvl, ai, tx, ty, power, mask), A = g.area;
      const before = new Set(g.entities);
      g.bumpBlock(tx, ty, power > 0, g.player);
      const it = g.entities.find(e => !before.has(e) && e.item);
      if (!it) return { none: true };
      const out = { kind: it.kind, walker: !!it.speedX, samples: [], worst: null, lava: false };
      let t = 0, goneAt = null;
      for (let k = 0; k < 240; k++) {
        g.update(1 / 120); t += 1 / 120; g.player.state = 'play'; g.state = 'play';
        if (it.remove) { goneAt = t; break; }
        // where Brady can touch it (from late in the pop on), every 0.1 s
        if (it.emerge <= 0.25 && k % 12 === 0 && t < 1.6) out.samples.push(box(it));
        if (it.emerge > 0) continue;
        const b = box(it);
        if (!out.emerged) out.emerged = b;
        const w = why(A, b, !!it.speedX);
        if (w && !out.worst) out.worst = { why: w, at: +t.toFixed(2), x: Math.round(b.x), y: Math.round(b.y) };
        if (tileIn(A, b, T.LAVA, 2) || b.y + b.h > (A.lavaY || 1e9) + 4) out.lava = true;
      }
      out.goneAt = goneAt; out.final = box(it);
      // the pop: straight up into the open cell over the block, where it has always gone
      out.up = !!out.emerged && out.emerged.y >= (ty - 1) * TS - 0.01 && out.emerged.y <= (ty - 1) * TS + 8.01 && Math.abs(out.emerged.x - (tx * TS + 4)) < 1;   // (a floating item may sit 4 px lower, its bob clear of a ceiling; a walker stands on the box, 8 px lower)
      // a floating item bobs: the box Brady can touch is its whole swing
      if (!it.speedX && !it.remove) out.samples = [{ x: it.x, y: (it.hoverY != null ? it.hoverY : it.y) - 4, w: it.w, h: it.h + 8 }];
      globalThis.__noCollect = false;
      return out;
    };
  }.toString() + ')()');
  return G;
}

// toggle groups (switch, phase blocks...): every state when there are up to three groups, else none and all
const masksOf = A => { const gs = Object.keys(A.toggles || {}).map(Number).filter(k => !['water', 'tide'].includes(A.toggles[k].kind)); if (!gs.length) return [0]; const all = gs.reduce((s, b) => s | 1 << b, 0); if (gs.length > 3) return [0, all]; const out = []; for (let m = 0; m <= all; m++) if (!(m & ~all)) out.push(m); return out; };

/* every item block of one level: bump it, then (when asked) one validator search for the whole level */
function scanLevel(G, id, reachAll) {
  const { T, TS, Validator, getLevel } = G;
  const bump = G.run('__bump'), tname = t => Object.keys(T).find(k => T[k] === t) || t;
  const blockTiles = new Set([T.QBLOCK, T.HIDDEN, T.QBRICK]);
  const [w, i] = id.split('-').map(Number);
  const lvl = getLevel(w, i);
  const rows = [];
  lvl.areas.forEach((A, ai) => {
    for (const key in A.contents) {
      const c = A.contents[key]; if (c === 'pick' || c === 'picks') continue;
      const [tx, ty] = key.split(',').map(Number);
      if (!blockTiles.has(A.tiles[ty * A.W + tx])) continue;
      const row = { id, ai, aid: A.aid, tx, ty, c, above: ty === 0 ? 'TOP' : tname(A.tiles[(ty - 1) * A.W + tx]), runs: [], under: { ai, x: tx * TS + 3, y: (ty + 1) * TS, w: TS - 6, h: 8 },
        // the other ways in (src/28_tour_dj_boxes.js): landing on top, or standing right beside it (a kick, a throw)
        top: { ai, x: tx * TS + 3, y: ty * TS - 6, w: TS - 6, h: 6 }, left: { ai, x: tx * TS - 6, y: ty * TS + 4, w: 6, h: TS - 8 }, right: { ai, x: (tx + 1) * TS, y: ty * TS + 4, w: 6, h: TS - 8 } };
      for (const mask of masksOf(A)) for (const power of (c === 'power' ? [0, 1] : [0])) { const r = bump(lvl, ai, tx, ty, power, mask); r.power = power; r.mask = mask; row.runs.push(JSON.parse(JSON.stringify(r))); }
      rows.push(row);
    }
  });
  // the reach search (slow) runs where it matters: an item that did not pop straight up, one lost soon after (it must be
  // catchable on its way), a floating item in a one-tile slot under a ceiling (big Brady may not fit beside it)
  const slot = row => { const A = lvl.areas[row.ai], t = row.ty < 2 ? -1 : A.tiles[(row.ty - 2) * A.W + row.tx]; return row.ty < 2 || G.run('SOLID')[t] === 1; };
  // ... and a block up high (nothing to stand on in the four rows under it): what floats over it may be out of reach
  const high = row => { const A = lvl.areas[row.ai], S = G.run('SOLID'); for (let y = row.ty + 1; y <= row.ty + 4; y++) { const t = y < A.H ? A.tiles[y * A.W + row.tx] : 0; if (S[t] || t === T.SEMI) return false; } return true; };
  // ... and a box with no room under it (on the floor, in a wall): bumping it from below was the only way in before
  const ground = row => { const A = lvl.areas[row.ai], S = G.run('SOLID'); return row.ty + 1 >= A.H || S[A.tiles[(row.ty + 1) * A.W + row.tx]] === 1; };
  const need = rows.filter(row => reachAll || slot(row) || high(row) || ground(row) || row.runs.some(r => !r.none && (!r.up || r.lava || (r.goneAt != null && r.goneAt < 1.5))));
  let ms = 0;
  if (need.length) {
    const probes = [];
    for (const row of need) { probes.push(row.under, row.top, row.left, row.right); for (const r of row.runs) { r.probes = (r.samples || []).map(b => Object.assign({ ai: row.ai }, b)); probes.push(...r.probes); } }
    // stop the search once every block has been bumped and every item touched (somewhere on its path)
    const groups = need.flatMap(row => [[row.under, row.top, row.left, row.right], ...row.runs.filter(r => r.probes.length).map(r => r.probes)]);
    const answered = () => groups.every(gr => gr.some(q => q.hit));
    const t0 = Date.now(); Validator.run(lvl, { probes, untilProbes: answered }); ms = Date.now() - t0;
    for (const row of need) { row.checked = true; row.bumpable = !!row.under.hit; row.openable = !!(row.under.hit || row.top.hit || row.left.hit || row.right.hit); for (const r of row.runs) r.reach = r.probes.some(q => q.hit); }
    // the search moves big Brady; an item that small Brady bumped out only has to be in small Brady's reach
    const small = need.filter(row => row.bumpable).flatMap(row => row.runs.filter(r => !r.power && !r.reach && r.probes.length));
    if (small.length) {
      const probes2 = small.flatMap(r => r.probes.map(q => Object.assign({}, q, { hit: false, run: r })));
      const groups2 = small.map(r => probes2.filter(q => q.run === r));
      const t1 = Date.now(); Validator.run(lvl, { probes: probes2, dim: G.PLAYER_DIM.small, untilProbes: () => groups2.every(gr => gr.some(q => q.hit)) }); ms += Date.now() - t1;
      for (const q of probes2) if (q.hit) q.run.reach = true;
      for (const r of small) delete r.probes;
    }
  }
  return { id, rows, ms };
}

if (!isMainThread) {
  const G = boot();
  for (const id of workerData.ids) parentPort.postMessage(scanLevel(G, id, workerData.reachAll));
  return;
}

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const want = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && ['--levels', '--jobs'].includes(args[i - 1])));
const LIST = args.includes('--list'), REACH = args.includes('--reach');
let bad = 0, n = 0;
const check = (name, ok, info) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined && !ok ? '  ' + JSON.stringify(info, null, 1).slice(0, 4000) : '')); if (!ok) bad++; };
const G = boot();
const { Tour, T, TS, TourBuild } = G;

(async () => {
  const runSection = async (name, fn) => { if (want.length && !want.includes(name)) return; console.log('== ' + name); try { await fn(); } catch (e) { check(name + ' runs', false, String(e.stack).slice(0, 800)); } };

  /* ---------- fixture rooms ---------- */
  await runSection('fixture', () => {
    const build = (rows, items) => TourBuild.fromSpec(Tour.countries.mx, { name: 'items lab', arch: 'lab', theme: 'mx_mercado', exits: { main: { to: null } }, areas: [{ id: 'r', gen: 'room', stamp: { floor: rows.length - 2, rows, items } }] }, 90);
    const play = G.run('__play'), step = G.run('__step'), why = G.run('__why');
    const spawned = (g, f) => { const before = new Set(g.entities); f(); return g.entities.find(e => !before.has(e) && e.item); };
    const blockAt = (lvl, ch) => { const r = lvl.areas[0]; for (let y = 0; y < r.H; y++) for (let x = 0; x < r.W; x++) if (r.tiles[y * r.W + x] === T.QBLOCK && r.contents[x + ',' + y] && r.contents[x + ',' + y] !== 'pick') return [x, y]; };
    // follow an item for sec seconds: the first problem, and where it was
    const follow = (g, it, sec) => { let bad = null; for (let k = 0; k < sec * 120; k++) { g.update(1 / 120); g.player.state = 'play'; if (it.remove) break; if (it.emerge > 0) continue; const w = why(g.area, it, !!it.speedX); if (w && !bad) bad = w + ' @' + Math.round(it.x) + ',' + Math.round(it.y); } return bad; };
    const bumpCase = (name, rows, content, power, expect) => {
      const lvl = build(rows, [content]); const [tx, ty] = blockAt(lvl);
      const g = play(lvl, 0, tx, ty, power || 0, 0);
      const it = spawned(g, () => g.bumpBlock(tx, ty, !!power, g.player));
      const bad = follow(g, it, 2.5);
      const fin = { x: Math.round(it.x), y: Math.round(it.y), kind: it.kind, gone: !!it.remove };
      check(`${name}: the ${it.kind} never sits in a solid (${expect.say})`, !bad && !it.remove && expect.ok(fin, tx, ty), { bad, fin, block: [tx, ty] });
      return { g, it, tx, ty };
    };
    // the classic pop is unchanged: up one tile, centred on the block, rising out of it (clipped to above the block)
    {
      const lvl = build(['##########', '#........#', '#........#', '#...?....#', '#........#', '#........#', '#.@......#', '##########', '##########'], ['power']);
      const [tx, ty] = blockAt(lvl); const g = play(lvl, 0, tx, ty, 1, 0);
      const it = spawned(g, () => g.bumpBlock(tx, ty, true, g.player));
      const y0 = it.y; step(g, 0.25); const yMid = it.y; step(g, 0.3);
      check('open above: the joint rises one tile out of the block (eased) and floats there, as before', y0 === ty * TS && Math.abs(yMid - (ty * TS - TS * 0.75)) < 2 && Math.abs(it.hoverY - (ty - 1) * TS) < 0.01 && it.x === tx * TS + 4, { y0, yMid, hoverY: it.hoverY, x: it.x, tx, ty });
    }
    bumpCase('ceiling right above', ['##########', '#........#', '#...#....#', '#...?....#', '#........#', '#........#', '#.@......#', '##########', '##########'], 'power', 1,
      { say: 'it comes out of the bottom, toward Brady', ok: (f, tx, ty) => f.y > (ty + 1) * TS - 1 });
    bumpCase('top row of the area', ['....?.....', '#........#', '#........#', '#........#', '#........#', '#.@......#', '##########', '##########'], 'lsd', 0,
      { say: 'it comes out of the bottom', ok: (f, tx, ty) => f.y >= (ty + 1) * TS });
    bumpCase('a one-way panel above', ['##########', '#........#', '#..---...#', '#...?....#', '#........#', '#........#', '#.@......#', '##########', '##########'], 'sig', 0,
      { say: 'not buried in the panel: out of the bottom', ok: (f, tx, ty) => f.y >= (ty + 1) * TS });
    bumpCase('a mushroom under a ceiling', ['##########', '#........#', '#...#....#', '#...?....#', '#........#', '#........#', '#.@......#', '##########', '##########'], 'power', 0,
      { say: 'it drops out of the bottom and walks on the floor', ok: (f, tx, ty) => f.y + 24 === 7 * TS });
    bumpCase('closed above and below', ['##########', '#........#', '#...#....#', '#...?....#', '#...#....#', '#........#', '#.@......#', '##########', '##########'], 'star', 0,
      { say: 'it comes out of a side', ok: (f, tx, ty) => true });
    bumpCase('closed on four sides', ['##########', '#........#', '#...#....#', '#..#?#...#', '#...#....#', '#........#', '#.@......#', '##########', '##########'], 'oneup', 0,
      { say: 'it pops into the nearest open cell', ok: () => true });
    // tiles that come back over an item: a crumble growing back, a switch group, a door
    {
      const lvl = build(['##########', '#........#', '#........#', '#...?....#', '#........#', '#........#', '#.@......#', '##########', '##########'], ['lsd']);
      const [tx, ty] = blockAt(lvl); const g = play(lvl, 0, tx, ty, 0, 0);
      const it = spawned(g, () => g.bumpBlock(tx, ty, false, g.player)); step(g, 0.8);
      g.setTile(tx, ty - 1, T.CRUMBLE); step(g, 1 / 60);
      const a = why(g.area, it, false);
      g.setTile(tx, ty - 1, T.EMPTY); step(g, 0.3); for (const dx of [-1, 0, 1]) g.setTile(tx + dx, ty - 2, T.HARD); g.setTile(tx, ty - 1, T.HARD); step(g, 1 / 60);
      const b = why(g.area, it, false);
      check('a tile growing back over a floating item nudges it to the nearest open cell', !a && !b && !it.remove, { a, b, at: [it.x, it.y] });
    }
    {
      const lvl = build(['##########', '#........#', '#........#', '#........#', '#........#', '#........#', '#.@......#', '##########', '##########'], []);
      const g = play(lvl, 0, 4, 4, 0, 0);
      const it = new (G.run('TourItem'))(g, 5 * TS, 6 * TS, 'mushroom'); it.emerge = 0; it.vx = it.speedX; g.spawn(it); step(g, 0.3);
      g.setTile(Math.floor(it.cx / TS), Math.floor(it.cy / TS), T.HARD); step(g, 1 / 60);
      check('a tile appearing on a walking mushroom (a toggle group) nudges it out', !why(g.area, it, true) && !it.remove, { x: it.x, y: it.y });
    }
    // a dropped item (a hit) floats where Brady was: never in the ceiling of a low tunnel
    {
      const lvl = build(['##########', '#........#', '#........#', '#........#', '#........#', '#########.', '#.@......#', '##########', '##########'], []);
      const g = play(lvl, 0, 3, 5, 0, 0);
      const p = g.player; p.x = 3 * TS + 6; p.y = 7 * TS - p.h; p.dropKind('gear:socks', 2);
      const it = g.entities.find(e => e.item && e.dropped); step(g, 1 / 60);
      const bad1 = why(g.area, it, false); step(g, 0.5);
      check('a dropped jump power under a low ceiling floats in open air (not in the ceiling)', !bad1 && !why(g.area, it, false), { bad1, y: it.y, hoverY: it.hoverY });
    }
    // a mushroom between two walls turns at each one and never wedges
    {
      const lvl = build(['##########', '#........#', '#........#', '#........#', '#........#', '##.....###', '##.@...###', '##########', '##########'], []);
      const g = play(lvl, 0, 4, 4, 0, 0);
      const it = new (G.run('TourItem'))(g, 4 * TS, 7 * TS - 24, 'mushroom'); it.emerge = 0; it.vx = it.speedX; it.hoverY = it.y; g.spawn(it);
      let turns = 0, last = 1, bad = null, minX = 1e9, maxX = -1e9;
      for (let k = 0; k < 6 * 120; k++) { g.update(1 / 120); if (Math.sign(it.vx) !== last && it.vx) { turns++; last = Math.sign(it.vx); } minX = Math.min(minX, it.x); maxX = Math.max(maxX, it.x + it.w); bad = bad || why(g.area, it, true); }
      check('a walking mushroom between two walls turns at each wall (never wedged, never inside)', !bad && turns >= 2 && minX >= 2 * TS - 0.01 && maxX <= 7 * TS + 0.01, { bad, turns, minX, maxX });
    }
    // the magnet pulls items toward Brady, but not through a wall
    {
      const lvl = build(['##########', '#........#', '#........#', '#....#...#', '#....#...#', '#....#...#', '#.@..#...#', '##########', '##########'], []);
      const g = play(lvl, 0, 3, 4, 0, 0);
      const it = new (G.run('TourItem'))(g, 6 * TS + 16, 5 * TS, 'lsd'); it.emerge = 0; it.speedX = 0; it.hoverY = it.y; g.spawn(it);
      g.player.x = 4 * TS; g.player.y = 7 * TS - g.player.h;
      let bad = null; for (let k = 0; k < 120; k++) { g.update(1 / 120); g.player.magnetPull(1 / 120); bad = bad || why(g.area, it, false); }
      check('a magnet pull never drags an item into a wall', !bad, { bad, x: it.x });
    }
  });

  /* ---------- a box opens from any side (src/28_tour_dj_boxes.js) ---------- */
  await runSection('open', () => {
    const build = rows => TourBuild.fromSpec(Tour.countries.mx, { name: 'box lab', arch: 'lab', theme: 'mx_mercado', exits: { main: { to: null } }, areas: [{ id: 'r', gen: 'room', stamp: { floor: rows.length - 2, rows, items: ['power'] } }] }, 90);
    // a box on the floor at (6, 6); Brady live (his real update), nothing frozen
    const rows = ['##############', '#............#', '#............#', '#............#', '#............#', '#............#', '#.@...?......#', '##############', '##############'];
    const live = G.run(`(function (lvl, px, py) {
      Save.data = Save.defaults(); Save.data.lives = 9; Save.data.tips = { box: true };
      const g = new Play(lvl, {}); Game.scene = g; g.state = 'play'; g.fade.a = 0; g.fade.target = 0;
      for (const k in Input) if (typeof Input[k] === 'boolean') Input[k] = false;
      const p = g.player; p.x = px - p.w / 2; p.y = py - p.h; p.vx = p.vy = 0; p.invuln = 99;
      for (const e of g.entities) if (e.enemy) e.remove = true;
      g.camX = Math.max(0, p.cx - Game.viewW / 2); g.camY = g.camTargetY(true); globalThis.__noCollect = false;
      return g;
    })`);
    const step = (g, n, inp) => { const I = G.run('Input'); for (let k = 0; k < n; k++) { Object.assign(I, inp || {}); g.update(1 / 120); if (k === 0) { I.actionPressed = false; I.jumpPressed = false; } } for (const k in (inp || {})) I[k] = false; };
    const T_ = G.T, used = g => g.area.tiles[6 * g.area.W + 6] === T_.USED;
    const item = g => g.entities.find(e => e.item);
    const res = {};
    { const g = live(build(rows), 6 * TS + 16, 4 * TS); step(g, 90); res.stomp = { open: used(g), power: g.player.power, item: !!item(g) }; }
    { const g = live(build(rows), 5 * TS + 10, 7 * TS); g.player.facing = 1; g.player.poundLand(); step(g, 2); res.pound = used(g); }
    { const g = live(build(rows), 4 * TS + 8, 7 * TS); const P = G.run("TourPowers.get('taco')"), p = g.player; p.facing = 1; p.sig = { id: 'taco', t: 0, n: 0 }; P.action(p, g); step(g, 60); res.taco = used(g); }
    { const g = live(build(rows), 3 * TS, 7 * TS); const C = G.run('SmokePuff'); g.spawn(new C(g, 4 * TS, 6 * TS + 16, 1)); step(g, 60); res.puff = used(g); }
    { const g = live(build(rows), 2 * TS, 7 * TS); const E = G.run('Ent'); const b = new E(g, { x: 4 * TS, y: 7 * TS }, 16, 16); b.thrownBy = g.player; b.vx = 6 * TS; b.update = function (dt) { this.x += this.vx * dt; }; g.spawn(b); step(g, 60); res.kicked = used(g); }
    { const g = live(build(rows), 2 * TS, 7 * TS); const E = G.run('Ent'); const b = new E(g, { x: 4 * TS, y: 7 * TS }, 20, 16); b.enemy = true; b.mode = 'roll'; b.vx = 6 * TS; b.update = function (dt) { this.x += this.vx * dt; }; b.hit = () => false; g.spawn(b); step(g, 60); res.rolling = used(g); }
    { const g = live(build(rows), 6 * TS - 12, 7 * TS); g.player.facing = 1; step(g, 2); step(g, 2, { actionPressed: true, action: true }); step(g, 60); res.kick = { open: used(g), item: !!item(g) || g.player.power > 0 }; }
    { const g = live(build(rows), 6 * TS - 12, 7 * TS); g.player.facing = 1; step(g, 30, { right: true }); res.walkInto = used(g); }
    check('a box on the floor opens when Brady lands on it, and he gets the mushroom', res.stomp.open && res.stomp.power === 1, res.stomp);
    check('the Pound Cake pound opens a box right beside his boots', res.pound, res);
    check('a taco, a smoke puff, a kicked thing and a rolling enemy each open a box they hit', res.taco && res.puff && res.kicked && res.rolling, res);
    check('THROW next to a box with no throwing power kicks it open (the item comes out)', res.kick.open && res.kick.item, res.kick);
    check('just walking into a box does not open it', !res.walkInto, res);
  });

  /* ---------- every item block of the game ---------- */
  await runSection('levels', async () => {
    const ids = opt('--levels') ? opt('--levels').split(',') : Tour.allLevelIds();
    const t0 = Date.now();
    const jobs = Math.max(1, Math.min(ids.length, +opt('--jobs') || Math.min(6, os.cpus().length - 2)));
    let results;
    if (jobs <= 1) results = ids.map(id => scanLevel(G, id, REACH));
    else {
      const parts = Array.from({ length: jobs }, () => []); ids.forEach((id, k) => parts[k % jobs].push(id));
      results = [];
      await Promise.all(parts.map(p => new Promise((res, rej) => { const wk = new Worker(__filename, { workerData: { ids: p, reachAll: REACH } }); wk.on('message', m => results.push(m)); wk.on('error', rej); wk.on('exit', res); })));
      results.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    }
    let blocks = 0, runs = 0, checked = 0;
    const problems = [], design = [], unbump = [], moved = [], dead = [];
    for (const { rows } of results) for (const row of rows) {
      blocks++;
      const where = `${row.id} ${row.aid || 'a' + row.ai} (${row.tx},${row.ty}) ${row.c} [above: ${row.above}]`;
      if (row.checked) { checked++; if (!row.bumpable) unbump.push(`${where}: ${row.openable ? 'opens now (' + ['top', 'left', 'right'].filter(k => row[k].hit).join(', ') + ')' : 'STILL CLOSED'}`); if (!row.openable) dead.push(where); }
      for (const r of row.runs) {
        runs++;
        const tag = `${where}${r.power ? ' big' : ''}${r.mask ? ' mask ' + r.mask : ''} -> ${r.kind || '-'}`;
        if (r.none) { problems.push(tag + ': nothing came out'); continue; }
        if (!r.up && r.emerged) moved.push(`${tag}: out at (${Math.round(r.emerged.x)},${Math.round(r.emerged.y)})`);
        if (r.worst) { problems.push(`${tag}: ${r.worst.why} at ${r.worst.at} s (${r.worst.x},${r.worst.y})`); continue; }
        const lost = r.goneAt != null && r.goneAt < 1.5 ? `lost in a pit after ${r.goneAt.toFixed(2)} s` : r.lava ? 'into the lava' : null;
        if (lost && !(row.checked && row.openable && r.reach)) { design.push(`${tag}: ${lost}${row.checked && row.openable ? ', never in Brady\'s reach on the way' : ''}`); continue; }
        // a box under soil is reached by digging (down onto it, or into its pocket): the validator's dig model is too
        // coarse to follow the item there, so only the solid / pit checks apply to it
        if (row.checked && row.openable && !r.reach && row.above !== 'SOIL') design.push(`${tag}: Brady can't reach it (${Math.round(r.final.x)},${Math.round(r.final.y)})`);
      }
    }
    if (LIST) console.log("  reach search ms: " + results.filter(r => r.ms).map(r => r.id + " " + r.ms).join(", "));
    console.log(`  ${ids.length} levels, ${blocks} item blocks, ${runs} bumps, ${checked} blocks reach-checked, ${Date.now() - t0} ms`);
    if (LIST || moved.length) console.log('  items that do not pop straight up (a solid, a panel or the top over the block):\n    ' + (moved.join('\n    ') || '-'));
    if (unbump.length) console.log('  boxes that could not be bumped from below (the only way in before), and how they open now:\n    ' + unbump.join('\n    '));
    check('every box Brady can get to opens (from below, by landing on it, or from a side)', !dead.length, dead);
    check('no item ends inside a solid, inside a one-way panel or out of the area', !problems.length, problems);
    check('no item is lost in a pit or lava at once, and Brady can reach every item he can bump out', !design.length, design);
  });

  console.log(bad ? `${bad} of ${n} checks FAILED` : `all ${n} checks passed`);
  process.exit(bad ? 1 : 0);
})();
