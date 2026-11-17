// Super Brady-O World: the "figure out the route" levels (5-1's souk and the other maze-type levels). Node only: the
// real game modules in a VM, the real Play scene stepped at the fixed 1/120 s step, no browser.
// For each maze level:
//   doors   every door, hatch, lift or ladder Brady can see has a destination: a real area, a spot he can stand on, and
//           (inside a maze) a partner door or a room's way in next to where he lands. No door-like decor is drawn
//           (decor named *door* / *archway*), so nothing looks like a door that isn't one.
//   route   the intended route, played in the game: Brady walks each leg with a simple autopilot (left / right / jump),
//           goes through each door with UP, picks up keys, opens locks, rings bells, and touches the exit gate. A leg
//           the autopilot can't walk (a tricky climb) is first proven by the level checker's physics search from where
//           Brady stands, then Brady is put at the end of the leg; such legs are listed as "placed". Every door hop,
//           pickup, lock and the gate itself always run in the game.
//   guard   without the route's key (or switch), the level checker can NOT reach the main exit: the puzzle is real.
// usage: node tools/sbw_mazes_test.js [levelId ...] [--verbose]
const loadGame = require('./load_game');
const args = process.argv.slice(2), verbose = args.includes('--verbose'), only = args.filter(a => !a.startsWith('--'));

/* ---------- the routes ----------
   steps: ['go', area, tx, ty]   walk to tile column tx, standing in row ty (the row Brady's feet are in)
          ['door', area, tx, ty] press UP here (Brady is at a door); he must come out in `area` near (tx, ty)
          ['has', key]           g.keys holds this key (a key, a lever's virtual key...)
          ['up']                 press UP where Brady stands (a lever, a bell, a lift button)
          ['jump']               a full jump straight up where Brady stands
          ['exit', key]          walk into the gate: the level clears through this exit
   guard: { key } or { noSwitch: group } (or a list of them): with that key's spawns, or that toggle group's switches,
          taken away, the level checker must not reach the main exit */
const MAZES = {
  '5-1': {
    name: 'Souk Labyrinth',
    guard: { key: 'roofKey' },
    route: [
      ['go', 0, 21, 11], ['door', 0, 30, 11],     // the gate's saffron door to the spice hall
      ['go', 0, 38, 25],                           // over the heap and down the hole into the dyers' hall
      ['go', 0, 48, 25], ['door', 0, 56, 25],      // saffron on to lantern alley: the rooftop grille is locked
      ['go', 0, 64, 25], ['door', 0, 73, 39],      // the mint back stairs down to the fountain court
      ['go', 0, 54, 39], ['door', 0, 48, 39],      // mint across to the tagine cooks
      ['go', 0, 35, 39], ['door', 0, 20, 39],      // paprika down to the cumin cellar
      ['go', 0, 19, 39], ['jump'],                 // the key hangs on a hook by the shelf: jump for it
      ['has', 'roofKey'],
      ['go', 0, 21, 39], ['door', 0, 36, 39],      // paprika back up to the cooks
      ['go', 0, 49, 39], ['door', 0, 55, 39],      // mint to the court
      ['go', 0, 74, 39], ['door', 0, 65, 25],      // mint up to the alley
      ['go', 0, 70, 25],                           // the grille opens with the key
      ['go', 0, 74, 25], ['door', 0, 56, 11],      // the saffron door to the rooftops
      ['go', 0, 73, 2], ['exit', 'main']           // up the sky rugs to the gate
    ]
  },
  '8-2': {
    name: 'Flower Auction',
    guard: { key: 'daffodil' },
    route: [
      ['go', 0, 48, 11], ['door', 0, 31, 25],      // the clock floor's stairs down to the sorting belts
      ['go', 0, 20, 21], ['has', 'daffodil'],      // left to the cold room: up the crates for the daffodil token
      ['go', 0, 72, 25], ['has', 'tulip'],         // right past the belts: the yellow shutter opens, the tulip token
      ['go', 0, 30, 25], ['door', 0, 47, 11],      // back to the stairs, up to the clock floor
      ['go', 0, 2, 11], ['has', 'hyacinth'],       // left to the gallery: the red shutter opens, the hyacinth token
      ['go', 0, 73, 11], ['exit', 'main']          // right across the clock floor, the blue shutter, the dock's gate
    ]
  },
  '10-3': {
    name: 'Hoi An Lanterns',
    guard: [{ noSwitch: 0, name: 'red gong' }, { noSwitch: 1, name: 'green gong' }],
    route: [
      ['go', 0, 9, 18], ['up'],                    // ring RED: the first red blind rolls up (the one past the stairs drops)
      ['go', 0, 21, 15], ['go', 0, 21, 12],        // the stools and the stair hole up to the gallery
      ['go', 0, 32, 12], ['up'],                   // ring GREEN: the gallery's green blind and the street's roll up
      ['go', 0, 21, 15], ['go', 0, 9, 18], ['up'], // back down the stairs to the red gong: ring RED again (the far red blinds roll up)
      ['go', 0, 4, 15], ['go', 0, 4, 12],          // the first red blind is down again: up the left stairs instead
      ['go', 0, 37, 12], ['go', 0, 37, 15],        // along the gallery, past the open green blind, down the far stairs
      ['go', 0, 75, 18], ['exit', 'main']          // past the workshop to the gate
    ]
  },
  '6-2': {
    name: 'Pintxos Bar',
    guard: [{ key: 'corkscrew' }],
    route: [
      ['go', 0, 8, 20], ['up'], ['go', 0, 12, 20], ['door', 1, 13, 20],   // take the Crawl Pads, then the first mouse hole into the wall
      ['go', 1, 18, 18], ['go', 1, 22, 14],        // crawl under the wiring, up the steps onto the pipe's walkway
      ['go', 1, 63, 20], ['go', 1, 56, 20], ['door', 0, 57, 20],   // along the pipe, down past it, out through the second hole
      ['go', 0, 50, 14], ['has', 'corkscrew'],     // up the bread to the shelf: the corkscrew
      ['go', 0, 40, 14], ['door', 1, 41, 14],      // the shelf's mouse hole back into the wall, onto the walkway
      ['go', 1, 81, 16], ['go', 1, 85, 13], ['go', 1, 81, 10], ['go', 1, 78, 7],   // down past the pipe, up the wedged corks to the top ledge
      ['go', 1, 66, 7], ['door', 0, 67, 7],        // the cork comes out with the corkscrew: the hole to the top shelf
      ['go', 0, 85, 7], ['exit', 'main']           // along the top shelf to the last pintxo
    ]
  },
  '11-1': {
    name: 'Sushi Carousel',
    oneway: /^jpHatch/,
    guard: [{ key: 'noren', name: 'the pantry lever' }, { key: 'staff', name: 'the roof lever' }],
    route: [
      ['go', 0, 22, 11], ['door', 0, 30, 11],      // lap 1: the counter's hatch to the kitchen (the staff door is shut)
      ['go', 0, 35, 11], ['door', 0, 30, 25],      // the kitchen's hatch to the cold store
      ['go', 0, 48, 25], ['door', 0, 4, 25],       // the cold store's hatch up to the roof sign
      ['go', 0, 11, 25], ['up'], ['has', 'staff'], // pull the roof lever: the kitchen's staff door opens
      ['go', 0, 22, 25], ['door', 0, 7, 11],       // the roof's hatch back down to the counter (the noren is still shut)
      ['go', 0, 22, 11], ['door', 0, 30, 11],      // lap 2: to the kitchen again
      ['go', 0, 46, 8], ['go', 0, 47, 5], ['door', 0, 56, 11],   // through the staff door, up the shelves to the pantry hatch
      ['go', 0, 63, 11], ['up'], ['has', 'noren'], // pull the pantry lever: the noren opens
      ['go', 0, 74, 11], ['door', 0, 30, 25],      // the pantry's hatch to the cold store
      ['go', 0, 48, 25], ['door', 0, 4, 25],       // up to the roof sign
      ['go', 0, 22, 25], ['door', 0, 7, 11],       // down to the counter
      ['go', 0, 1, 11], ['exit', 'main']           // through the open noren to the way out
    ]
  }
};

/* ---------- the headless game ---------- */
const G = loadGame();
G.run('(' + function () {
  Atlas.need = () => {}; Atlas.keep = () => {}; Atlas.load = () => {};
  globalThis.Game = { dpr: 1, cssW: 844, cssH: 390, viewW: 844, viewH: 10 * TS, rows: 10, gameRect: { x: 0, y: 0, w: 844, h: 390 }, quality: 1, forceTouchUI: true, S: 1,
    setRows(r) { this.rows = r; this.viewH = r * TS; }, setScene(s) { this.scene = s; }, resize() {}, reportError() {}, isUnlocked: () => true, isDone: () => false, secretFound() {}, goldCount: () => 0, pathOpen: () => true, complete() {}, vignette() {}, canvas: { width: 844, height: 390, style: {} } };
  globalThis.__start = function (lvl) {
    Save.data = Save.defaults(); Save.data.lives = 9;
    const g = new Play(lvl, {}); Game.scene = g;
    for (let k = 0; k < 240 && g.state !== 'play'; k++) g.update(1 / 120);
    g.state = 'play'; g.fade.a = 0; g.fade.target = 0;
    return g;
  };
  const clearInput = () => { for (const k of ['left', 'right', 'up', 'down', 'jump', 'action', 'run']) Input[k] = false; Input.jumpPressed = Input.upPressed = Input.downPressed = Input.actionPressed = false; };
  globalThis.__clear = clearInput;
  // one frame with these keys held (pressed = only on the first frame of a press)
  globalThis.__frame = function (g, keys) {
    clearInput(); Object.assign(Input, keys || {});
    g.player.invuln = Math.max(g.player.invuln || 0, 5);   // the route is about the way, not the fights
    g.update(1 / 120);
    if (g.player.dead || g.player.state === 'dead') return 'dead';
    return null;
  };
  globalThis.__wait = function (g, sec) { for (let k = 0, n = Math.round(sec * 120); k < n; k++) { const r = __frame(g, {}); if (r) return r; } return null; };
  const solidAt = (A, tx, ty) => { const t = tileAt(A, tx, ty); return !!SOLID[t]; };
  const floorAt = (A, tx, ty) => { const t = tileAt(A, tx, ty); return !!SOLID[t] || t === T.SEMI; };
  // the autopilot: walk towards (tx, ty), jumping at walls, gaps and when the target is higher
  globalThis.__walk = function (g, ai, tx, ty, maxSec) {
    const p = g.player; let hold = 0, stuck = 0, lastX = p.x, fallFrames = 0;
    for (let k = 0, n = Math.round(maxSec * 120); k < n; k++) {
      if (g.area.idx !== ai) return 'wrong area ' + g.area.idx;
      const A = g.area, cx = p.cx / TS, feet = Math.floor((p.y + p.h - 1) / TS), dx = tx + 0.5 - cx;
      if (Math.abs(dx) < 0.45 && feet === ty && p.onGround) { __frame(g, {}); return null; }
      const dir = Math.abs(dx) < 0.3 ? 0 : Math.sign(dx);
      const keys = { left: dir < 0, right: dir > 0 };
      if (p.onGround) {
        fallFrames = 0;
        const ax = Math.floor((p.cx + dir * (p.w / 2 + 10)) / TS);
        // a crawlway ahead (a lintel at head height) with the Crawl Pads: crouch and walk under it
        const lint = t => t === T.LINTEL;
        if (dir && (lint(tileAt(A, ax, feet - 1)) || lint(tileAt(A, Math.floor(p.cx / TS), feet - 1)))) { keys.down = true; lastX = p.x; const r = __frame(g, keys); if (r) return r; continue; }
        const wall = dir && (solidAt(A, ax, feet) || solidAt(A, ax, feet - 1));
        const gap = dir && !floorAt(A, ax, feet + 1) && ty <= feet && Math.abs(dx) > 1.2;
        const higher = ty < feet - 0 && Math.abs(dx) < 3;
        if (Math.abs(p.x - lastX) < 0.2) stuck++; else stuck = 0;
        if (wall || gap || higher || stuck > 30) { hold = 48; keys.jump = true; keys.jumpPressed = true; stuck = 0; }
      } else if (hold > 0) { hold--; keys.jump = true; }
      lastX = p.x;
      const r = __frame(g, keys); if (r) return r;
    }
    return 'timeout at ' + (p.cx / TS).toFixed(1) + ',' + Math.floor((p.y + p.h - 1) / TS);
  };
  // put Brady standing at (tx, ty) of the current area (a leg the level checker proved)
  globalThis.__place = function (g, tx, ty) { const p = g.player; p.x = tx * TS + TS / 2 - p.w / 2; p.y = (ty + 1) * TS - p.h; p.vx = p.vy = 0; __wait(g, 0.3); };
  globalThis.__door = function (g) {
    const a0 = g.area.idx, x0 = g.player.x, y0 = g.player.y;
    __frame(g, { up: true, upPressed: true });
    for (let k = 0; k < 600; k++) { __frame(g, {}); if (g.player.state === 'play' && g.fade.a < 0.05 && (g.area.idx !== a0 || Math.abs(g.player.x - x0) > TS * 2 || Math.abs(g.player.y - y0) > TS * 2)) return true; }
    return false;
  };
}.toString() + ')()');
const { Validator, TS, T, Tour } = G;

/* ---------- checks ---------- */
let failures = 0;
const check = (name, ok, info) => { if (!ok || verbose) console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); if (!ok) failures++; };
const level = id => { const [w, i] = id.split('-').map(Number); return G.getLevel(w, i); };
// every type of spawn that acts as a way through (validator portals and the maze levels' own doors)
const DOORISH = s => G.run('VALIDATOR_PORTALS')[s.type] || /door|hatch|lift|ladder|stair/i.test(s.type);
const tileAt = (A, x, y) => (x < 0 || y < 0 || x >= A.W || y >= A.H) ? T.HARD : A.tiles[y * A.W + x];
const SOLID = G.run('SOLID');

function doorsCheck(id, oneway) {
  const lvl = level(id);
  let n = 0;
  const bad = [];
  lvl.areas.forEach((A, ai) => {
    for (const s of A.spawns) {
      if (!DOORISH(s)) continue;
      if (s.type === 'lock' || /Grille|Gate$/.test(s.type)) continue;   // locks are walls that open, not ways through
      n++;
      const where = `${A.aid}(${Math.floor(s.x / TS)},${Math.floor((s.y - 1) / TS)}) ${s.look || s.type}`;
      const tg = s.target;
      if (!tg || tg.area == null || !lvl.areas[tg.area]) { bad.push(where + ': no destination'); continue; }
      const B = lvl.areas[tg.area], tx = Math.floor(tg.x / TS), ty = Math.floor((tg.y - 1) / TS);
      const t = tileAt(B, tx, ty + 1);
      if (!(SOLID[t] || t === T.SEMI)) bad.push(where + ` -> ${B.aid}(${tx},${ty}): nothing to stand on`);
      if (SOLID[tileAt(B, tx, ty)] || SOLID[tileAt(B, tx, ty - 1)]) bad.push(where + ` -> ${B.aid}(${tx},${ty}): inside a wall`);
      // the way back: a door near where Brady lands (a maze's partner door), or a room's own door
      const back = B.spawns.some(o => o !== s && DOORISH(o) && o.target && Math.abs(o.x / TS - tx - 0.5) <= 2.5 && Math.abs((o.y - 1) / TS - ty) <= 2);
      if (!back && !(oneway && oneway.test(s.look || ''))) bad.push(where + ` -> ${B.aid}(${tx},${ty}): no door to come back through`);
    }
    for (const d of A.decor || []) if (/door|archway/i.test(d.kind || d.k || d.name || '')) bad.push(`${A.aid}: door-like decor '${d.kind || d.k || d.name}' that leads nowhere`);
  });
  check(`${id} doors: all ${n} doors lead somewhere and have a way back`, !bad.length && n > 0, bad.length ? bad.slice(0, 8).join('; ') : undefined);
  return n;
}

function routeCheck(id, M) {
  const lvl = level(id);
  const g = G.run('__start')(lvl);
  const walk = G.run('__walk'), place = G.run('__place'), door = G.run('__door'), wait = G.run('__wait'), frame = G.run('__frame');
  const placed = [], log = [];
  let ok = true, doors = 0;
  const here = () => `${g.area.aid}(${(g.player.cx / TS).toFixed(1)},${Math.floor((g.player.y + g.player.h - 1) / TS)})`;
  for (const [k, st] of M.route.entries()) {
    const [op, a, x, y] = st;
    if (op === 'go') {
      const r = walk(g, a, x, y, 14);
      if (r) {
        // the autopilot could not do it: the level checker must prove the leg from here, then Brady is placed
        const start = { area: g.area.idx, x: g.player.cx, y: g.player.y + g.player.h };
        const probe = { ai: a, x: x * TS + 4, y: y * TS + 4, w: TS - 8, h: TS - 8 };
        Validator.run(Object.assign({}, lvl, { start }), { probes: [probe], untilProbes: true });
        if (!probe.hit) { ok = false; log.push(`step ${k} go ${x},${y}: autopilot ${r}, and the level checker can't reach it from ${here()}`); break; }
        placed.push(`${x},${y}`); place(g, x, y);
      }
    } else if (op === 'door') {
      doors++;
      if (!door(g)) { ok = false; log.push(`step ${k}: UP at ${here()} did not go through a door`); break; }
      const px = g.player.cx / TS, py = Math.floor((g.player.y + g.player.h - 1) / TS);
      if (g.area.idx !== a || Math.abs(px - x - 0.5) > 1.6 || Math.abs(py - y) > 1) { ok = false; log.push(`step ${k}: the door led to ${here()}, expected area ${a} (${x},${y})`); break; }
    } else if (op === 'has') {
      if (!g.keys.has(a)) { ok = false; log.push(`step ${k}: no '${a}' after ${here()} (keys: ${[...g.keys].join(',')})`); break; }
    } else if (op === 'jump') {
      frame(g, { jump: true, jumpPressed: true }); for (let q = 0; q < 60; q++) frame(g, { jump: true }); wait(g, 0.8);
    } else if (op === 'up') {
      frame(g, { up: true, upPressed: true }); wait(g, 0.6);
    } else if (op === 'exit') {
      wait(g, 0.5);
      if (g.state !== 'clear' || (g.exitKey || 'main') !== a) { ok = false; log.push(`step ${k}: the level did not clear through '${a}' at ${here()} (state ${g.state})`); break; }
    }
  }
  check(`${id} route: the intended route plays to the exit (${doors} doors, ${M.route.filter(s => s[0] === 'go').length - placed.length} legs walked, ${placed.length} placed)`, ok, log.join('; ') || (placed.length ? 'placed: ' + placed.join(' ') : undefined));
}

function guardCheck(id, M) {
  // each guard takes something away; the level checker must then fail to reach the main exit
  for (const gd of [].concat(M.guard || [])) {
    const lvl = level(id);
    const copy = Object.assign({}, lvl, { areas: lvl.areas.map(a => {
      const b = Object.assign({}, a, { spawns: a.spawns.filter(s => !(gd.key && s.type === 'key' && s.id === gd.key)), vkeys: (a.vkeys || []).filter(v => v.id !== gd.key) });
      if (gd.noSwitch != null && a.toggles) { b.toggles = {}; for (const g in a.toggles) b.toggles[g] = Object.assign({}, a.toggles[g], { switches: +g === gd.noSwitch ? [] : a.toggles[g].switches }); }
      return b;
    }) });
    const r = Validator.run(copy, {});
    const what = gd.key ? `'${gd.key}'` : `the ${gd.name || 'group ' + gd.noSwitch} switches`;
    check(`${id} guard: without ${what} the main exit is out of reach`, !r.exits.main, { exits: r.exits });
  }
}

for (const id of Object.keys(MAZES)) {
  if (only.length && !only.includes(id)) continue;
  const M = MAZES[id];
  doorsCheck(id, M.oneway);
  routeCheck(id, M);
  guardCheck(id, M);
}
console.log(failures ? `\n${failures} maze check(s) failed` : '\nall maze checks passed');
process.exit(failures ? 1 : 0);
