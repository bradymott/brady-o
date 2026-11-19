// Super Brady-O World: Piwi's House Rules 9 and 1 and 22-6 The Rulebook (src/29_tour_zz_wormholes9.js,
// src/29_tour_w22_zrulebook.js; docs/design/BACKSTAGE_STATUS.md). Node only: the real game modules in a VM, the real
// Play scene stepped at 1/120 s, no browser.
//   rule9     5-1's evidence locker: its door from the basket weavers, the Brady Button inside, a slap revokes rule 9;
//             the six dormant Wormholes are padlocked before and open after
//   express   rule 9's express trails: a walkable airstrip -> port trail on a land whose boss is beaten, none before
//   rule1     22-5's margin: in by the left edge of the desk; the button under glass does nothing until rules 3, 7, 9,
//             10 and 12 are revoked, then a slap revokes rule 1 and opens 22-6 (its stop and its trail are queued)
//   pages     22-6's page-turn platforms: two clocks half a period apart, the leaf tiles swap sides, the spine never
//             moves, the corner curls before a turn, Brady on a spine rides out the turns
//   stamps    22-6's rubber stamps: harmless resting high, one hit while down, never a death
//   boss      the Rulebook: stomps bounce off while it flies, it falls open after a slam and a stomp tears a page, ink
//             blots in phase 2, a double slam in phase 3, three pages and it is gone, the way out opens
//   page      the HOUSE RULES page lists all six rules (masked, under glass, revoked)
//   party     rule 1's effects: the ending gains its party cards; the map's Showtrunk becomes a party blimp
// usage: node tools/sbw_rulebook_test.js [section ...] [--verbose]
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
  const clearInput = () => { for (const k of ['left', 'right', 'up', 'down', 'jump', 'action', 'run']) Input[k] = false; Input.jumpPressed = Input.upPressed = Input.downPressed = Input.actionPressed = false; Input.taps.length = 0; };
  globalThis.__frame = function (g, keys, hurt) {
    clearInput(); Object.assign(Input, keys || {});
    if (!hurt && g.player) g.player.invuln = Math.max(g.player.invuln || 0, 5);
    g.update(1 / 120);
    return g.player && (g.player.dead || g.player.state === 'dead') ? 'dead' : null;
  };
  globalThis.__hold = function (g, keys, sec, until, hurt) { for (let k = 0, n = Math.round(sec * 120); k < n; k++) { const r = __frame(g, k ? Object.assign({}, keys, { jumpPressed: false, upPressed: false, actionPressed: false }) : keys, hurt); if (r) return r; if (until && until()) return null; } return 'timeout'; };
}.toString() + ')()');
const { TS, Tour, T } = G;
const run = name => G.run(name);
const [start, frame, hold] = ['__start', '__frame', '__hold'].map(run);
const TP = G.TourProgress, Save = G.Save, TR = run('TourRules');

let failures = 0, checks = 0;
const check = (name, ok, info) => { checks++; if (!ok || verbose) console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); if (!ok) failures++; };
const level = id => { const [w, i] = id.split('-').map(Number); return G.getLevel(w, i); };
const areaOf = (lvl, aid) => lvl.areas.findIndex(a => a.aid === aid);
const revoke = list => { const Tt = TP.data(); for (const n of list) Tt.rules[n] = { at: 'test' }; };
const slap = (g, b) => { const p = g.player; p.x = b.x - p.w - 2; p.y = b.y + b.h - p.h; p.vx = p.vy = 0; p.facing = 1; hold(g, {}, 0.3); hold(g, { action: true, actionPressed: true }, 0.1); hold(g, {}, 0.4); };
const DORMANT = [['4-2', '1-6'], ['6-1', '2-6'], ['7-3', '7-7'], ['9-3', '4-6'], ['10-2', '5-6'], ['12-2', '11-7']];

/* ---------- rule 9: the evidence locker ---------- */
if (want('rule9')) {
  const lvl = level('5-1'), k = areaOf(lvl, 'locker');
  check('5-1: the evidence locker is an area of the souk level', k > 0);
  const door = lvl.areas[0].spawns.find(s => s.type === 'portal' && s.target && s.target.area === k);
  check('5-1: a door in the souk leads into it (the plank door with the tube)', !!door && door.look === 'r9LockerDoor', door && door.look);
  const back = lvl.areas[k].spawns.find(s => s.type === 'portal' && s.target && s.target.area === 0);
  check('5-1: its door goes back out beside the souk door', !!back && !!door && Math.abs(back.target.x - door.x) <= 2 * TS, back && back.target);
  const g = start(lvl);
  g.enterPortal({ kind: 'door', target: door.target }); hold(g, {}, 1.5);
  check('5-1: Brady walks in through the door', g.area.idx === k, g.area.idx);
  const b = g.entities.find(e => e.isButton && e.rule === 9);
  check('5-1: the Brady Button for rule 9 is in the locker', !!b);
  if (b) {
    slap(g, b);
    check('5-1: a slap revokes rule 9 at once (saved)', TR.isRevoked(9) && TP.data().rules[9].at === '5-1', TP.data().rules);
    check('5-1: the REVOKED card plays', !!g.buttonFx);
    hold(g, {}, 6);
  }
  check('5-1: no errors', run('__errors') === 0, run('__errors'));
  // the dormant Wormholes: padlocked with the rule in force, open once it is revoked
  for (const [id, to] of DORMANT) {
    const L = level(id), ex = Object.keys(L.exits).find(x => L.exits[x].via === 'warp' && L.exits[x].to === to);
    check(`${id}: a dormant Wormhole exit to ${to} (needs rule:9)`, !!ex && L.exits[ex].needs === 'rule:9', ex);
    if (!ex) continue;
    let ai = -1, sp = null; L.areas.forEach((a, j) => { const s = a.spawns.find(x => x.type === 'warp' && x.exit === ex); if (s && !sp) { sp = s; ai = j; } });
    check(`${id}: its trunk is placed in a backstage area (${ai >= 0 ? L.areas[ai].aid + ', ' + L.areas[ai].zone : '-'})`, !!sp && L.areas[ai].role === 'backstage');
    if (!sp) continue;
    const g2 = start(L); g2.loadArea(ai, sp.x, sp.y); g2.player.invuln = 5;
    const w = g2.entities.find(e => e.isWarp && e.exitKey === ex);
    hold(g2, { up: true, upPressed: true }, 0.1); hold(g2, {}, 0.5);
    check(`${id}: rule 9 in force: padlocked, Up does nothing`, w && w.locked && !w.used && g2.state === 'play');
    revoke([9]);
    hold(g2, { up: true, upPressed: true }, 0.1); hold(g2, {}, 1.5);
    check(`${id}: rule 9 revoked: Up and Brady is through to ${to}`, w && w.used && g2.exitKey === ex && Save.data.unlocked[to], { used: w && w.used, key: g2.exitKey });
  }
}

/* ---------- rule 9: express trails ---------- */
if (want('express')) {
  const TG = run('TourGraph'), C = Tour.countries.mx, boss = C.world + '-' + C.mainCount;
  Save.data = Save.defaults();
  let E = TG.edges(C, TG.nodes(C));
  check('express: no express trail while rule 9 is in force', !E.some(e => e.express));
  revoke([9]); E = TG.edges(C, TG.nodes(C));
  check('express: rule 9 revoked but the boss not beaten: no express trail yet', !E.some(e => e.express));
  Save.data.done[boss] = true; E = TG.edges(C, TG.nodes(C));
  const e = E.find(x => x.express);
  check('express: boss beaten: an express trail from the airstrip to the port, open and walkable', e && e.a === 'start' && e.b === 'port' && e.open && e.visible && !!TG.route(E, 'start', 'port') && TG.route(E, 'start', 'port').length === 1, e);
}

/* ---------- rule 1: the button under glass in 22-5's margin ---------- */
if (want('rule1')) {
  const lvl = level('22-5'), k = areaOf(lvl, 'margin');
  check('22-5: the margin is a backstage area (the Wings)', k > 0 && lvl.areas[k].role === 'backstage' && lvl.areas[k].zone === 'wings');
  const seam = (lvl.areas[0].seams || []).find(s => s.side === 'left');
  check('22-5: a seam on the left of the start leads to it', seam && seam.target && seam.target.area === k, seam);
  const g = start(lvl);
  const p = g.player; p.x = TS * 1.5; p.vx = 0;
  hold(g, { left: true }, 3, () => g.area.idx === k);
  check('22-5: walking left off the start, Brady arrives in the margin', g.area.idx === k, g.area.idx);
  hold(g, {}, 1);
  const b = g.entities.find(e => e.isButton && e.rule === 1);
  check('22-5: the Brady Button for rule 1 is there, under glass', b && b.covered);
  if (b) {
    slap(g, b);
    check('22-5: with rules 3, 7, 9, 10, 12 in force a slap does nothing', !TR.isRevoked(1) && !g.buttonFx && b.covered);
    check('22-5: the cloche is remembered for the HOUSE RULES page', !!TP.data().cloche);
    revoke([3, 7, 9, 10]);
    hold(g, {}, 1.4); slap(g, b);
    check('22-5: four of five is not enough', !TR.isRevoked(1) && b.covered);
    revoke([12]); hold(g, {}, 1.4);
    check('22-5: all five revoked: the glass lifts', !b.covered);
    slap(g, b);
    const Tt = TP.data();
    check('22-5: a slap revokes rule 1 (saved, at 22-5)', TR.isRevoked(1) && Tt.rules[1].at === '22-5', Tt.rules[1]);
    check('22-5: 22-6 The Rulebook is unlocked', TP.isUnlocked('22-6'));
    check('22-5: the map will reveal 22-6\'s stop and a gold trail to it from 22-5', Tt.pending.some(r => r.kind === 'stop' && r.id === '22-6') && Tt.pending.some(r => r.kind === 'path' && r.cc === 'w22' && r.from === 4 && r.to === 5), Tt.pending);
    hold(g, {}, 6);
    check('22-5: the cut ends, play goes on, no errors', !g.buttonFx && g.state === 'play' && run('__errors') === 0, run('__errors'));
  }
  // 22-6 is hidden on World 22's map until then
  Save.data = Save.defaults();
  const stop = run('TourPanel').stops(Tour.countries.w22).find(s => s.id === '22-6');
  check('22-6: hidden on the map before the rule is revoked', stop && !stop.visible);
}

/* ---------- 22-6: page-turn platforms ---------- */
if (want('pages')) {
  const lvl = level('22-6'), A = lvl.areas[0];
  const groups = Object.keys(A.toggles || {}).filter(gi => A.toggles[gi].kind === 'page');
  check('22-6: two page clocks (auto toggle groups)', groups.length === 2 && groups.every(gi => A.toggles[gi].auto), groups);
  const g = start(lvl), pages = g.entities.filter(e => e.constructor.name === 'RbPage');
  check('22-6: five pages over the gaps', pages.length === 5, pages.length);
  const pg = pages[0], Gp = g.area.toggles[pg.gi], at = x => g.area.tiles[pg.row * g.area.W + x];
  const states = [];
  for (let k = 0; k < 4; k++) {
    // the moment before the next turn: the corner curls (the entity's own clock says < 0.9 s to go)
    const left = (g.t + Gp.offset) % Gp.period;
    hold(g, {}, Gp.period - left - 0.5);
    const curl = Gp.period - ((g.t + Gp.offset) % Gp.period) < 0.9;
    hold(g, {}, 0.7);
    states.push({ curl, bit: g.toggleBit(pg.gi), L: at(pg.sp - 2), R: at(pg.sp + 2), spine: at(pg.sp) });
  }
  check('22-6: a page turns every period, and the corner curls in the second before', states.every((s, k) => s.curl && s.bit === (states[0].bit ? k % 2 === 0 : k % 2 === 1)), states);
  check('22-6: the leaf lies on one side at a time (one-way paper)', states.every(s => (s.bit ? s.R === T.SEMI && s.L === T.EMPTY : s.L === T.SEMI && s.R === T.EMPTY)), states);
  check('22-6: the spine never moves', states.every(s => s.spine === T.HARD));
  // Brady on a spine rides out three turns
  const p = g.player; p.x = pg.sp * TS + TS / 2 - p.w / 2; p.y = pg.row * TS - p.h; p.vx = p.vy = 0;
  const r = hold(g, {}, Gp.period * 3, null, true);
  check('22-6: standing on a spine is safe through the turns', r === 'timeout' && !p.dead && Math.abs(p.y + p.h - pg.row * TS) < 2, { r, y: p.y + p.h, row: pg.row * TS });
  check('22-6 pages: no errors', run('__errors') === 0, run('__errors'));
}

/* ---------- 22-6: rubber stamps ---------- */
if (want('stamps')) {
  const g = start(level('22-6')), S = g.entities.filter(e => e.constructor.name === 'RbStamp');
  check('22-6: five rubber stamps', S.length === 5, S.length);
  const s = S[0], p = g.player;
  const put = () => { p.x = s.fx - p.w / 2; p.y = s.floor - p.h; p.vx = p.vy = 0; p.invuln = 0; };
  // resting high: harmless underneath
  hold(g, {}, 0.01, () => !s.danger && s.k === 0); for (let k = 0; k < 600 && (s.danger || s.k > 0); k++) frame(g);
  put(); const hp0 = { power: p.power, dead: p.dead };
  hold(g, {}, 0.2, null, true);
  check('22-6: under a resting stamp: no harm', !p.dead && p.power === hp0.power && !(p.invuln > 0), { k: s.k, invuln: p.invuln });
  // the tell, then the slam: one hit (Brady big: he shrinks; never a death)
  p.power = 1;
  for (let k = 0; k < 600 && !s.danger; k++) frame(g, {}, true);
  const tellSeen = true;
  put(); p.power = 1;
  for (let k = 0; k < 240 && !(p.invuln > 0) && !p.dead; k++) { put(); p.invuln = 0; frame(g, {}, true); }
  check('22-6: a slamming stamp costs one hit, never a life', tellSeen && !p.dead && p.invuln > 0, { power: p.power, dead: p.dead, inv: p.invuln });
  check('22-6 stamps: no errors', run('__errors') === 0, run('__errors'));
}

/* ---------- 22-6: the Rulebook (mini-boss) ---------- */
if (want('boss')) {
  const lvl = level('22-6'), k = lvl.areas.findIndex(a => a.role === 'arena');
  const g = start(lvl); const an = lvl.areas[k].anchors.in;
  g.loadArea(k, an.x, an.y);
  const b = g.entities.find(e => e.boss), p = g.player;
  check('22-6: the Rulebook waits in its arena (3 pages)', b && b.style === 'w22_rulebook' && b.hp === 3);
  p.x = b.arenaX0 + 64; p.y = b.floorY - p.h - 4; p.vy = 0;
  hold(g, {}, 3);
  check('22-6: it wakes when Brady walks in', b.state === 'fight', b.state);
  const stompOn = () => { p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * TS; p.prevBottom = p.y + p.h; frame(g); frame(g); };
  // flying: a stomp bounces off the hard cover
  hold(g, {}, 0.4, () => b.act === 'walk');
  const hp0 = b.hp; stompOn();
  check('22-6: while it flies a stomp bounces off (no page)', b.hp === hp0 && p.vy < 0, { hp: b.hp, act: b.act });
  const phases = [];
  for (let n = 0; n < 3 && b.hp > 0; n++) {
    // wait for it to aim (the red marks), slam and fall open
    let aimed = false, blots = 0, slams = 0;
    for (let q = 0; q < 12 * 120 && b.act !== 'open'; q++) { if (b.act === 'aim') aimed = true; if (b.act === 'slam') slams = Math.max(slams, b.slams + 1); frame(g); p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; }
    frame(g);
    blots = g.entities.filter(e => e.constructor.name === 'TourShot' && !e.remove).length;
    const open = b.act === 'open', vuln = b.vuln;
    stompOn();
    phases.push({ aimed, open, vuln, blots, slams: b.slams, hp: b.hp, phase: b.phase || 1 });
    hold(g, {}, 0.3);
  }
  check('22-6: it aims (the tell) before every slam', phases.every(x => x.aimed), phases);
  check('22-6: after a slam it lies open and a stomp tears out a page (3 pages)', phases.length === 3 && phases.every(x => x.open && x.vuln) && b.hp <= 0, phases);
  check('22-6: phase 2 splashes ink blots', phases[1] && phases[1].blots >= 2, phases[1]);
  check('22-6: phase 3 slams twice before it falls open', phases[2] && phases[2].slams >= 2, phases[2]);
  for (let q = 0; q < 6 * 120 && !b.remove; q++) frame(g);
  check('22-6: the last page and it is gone; the way out opens', b.remove && g.area.tiles.indexOf(T.HARD) >= 0 && (() => { const A = g.area; for (let y = 0; y < A.H; y++) if (A.tiles[y * A.W + b.doorX] === T.HARD) return false; return true; })(), { removed: b.remove });
  const gate = g.entities.find(e => e.constructor.name === 'Gate' || e.exitKey === 'main');
  check('22-6: the gate is beyond the door', !!gate);
  if (gate) { p.x = gate.cx - 50; p.y = gate.y + gate.h - p.h - 2; p.vy = 0; hold(g, { right: true }, 3, () => g.state !== 'play'); check('22-6: the gate clears the level (main exit, back to the map)', g.state !== 'play' && g.exitKey === 'main', { state: g.state, key: g.exitKey }); }
  check('22-6 boss: no errors', run('__errors') === 0, run('__errors'));
}

/* ---------- the HOUSE RULES page ---------- */
if (want('page')) {
  const RC = run('TourRuleCut'), FAKE = { addColorStop() {}, width: 10 }, fakeCtx = () => new Proxy({}, { get: () => () => FAKE, set: () => true });
  Save.data = Save.defaults();
  let L = RC.lines();
  check('page: six rules, all masked on a new save', L.length === 6 && L.every(l => !l.done && /RULE \?/.test(l.title)), L.map(l => l.title));
  TP.data().lighthouse = true; L = RC.lines();
  check('page: once the Lighthouse is lit, a masked rule names the land of its button', L.every(l => /somewhere in/.test(l.sub)), L.map(l => l.sub));
  TP.data().cloche = '22-5'; revoke([3, 9]); L = RC.lines();
  const r1 = L[0], r9 = L.find(l => /RULE 9/.test(l.title));
  check('page: rule 1 seen under glass shows its title and how many of the other five are done', r1.glass && /NO FUN/.test(r1.title) && /2 of 5/.test(r1.sub), r1);
  check('page: a revoked rule says where its button was and what it opened', r9 && r9.done && /WORMHOLES/.test(r9.sub), r9);
  let ok = true; try { G.run('Game.cssW = 390; Game.cssH = 844;'); RC.page(fakeCtx(), 0, L); G.run('Game.cssW = 844; Game.cssH = 390;'); RC.page(fakeCtx(), 0, L); } catch (e) { ok = String(e); }
  check('page: it draws in portrait and landscape', ok === true, ok);
}

/* ---------- rule 1's effects ---------- */
if (want('party')) {
  Save.data = Save.defaults();
  const E = run('TourEndingScene');
  G.run('Input.taps.length = 0; Input.uiKey = null; Input.jumpPressed = false;');
  let s = new E(); s.update(0.01);
  const n0 = s.lines.length;
  revoke([1]); s = new E(); s.update(0.01);
  check('party: the ending gains two party cards once rule 1 is revoked', s.lines.length === n0 + 2 && /sulks/.test(s.lines[n0]) && /dances/.test(s.lines[n0 + 1]), { n0, n: s.lines.length });
  const FK = { addColorStop() {}, width: 10 }, fk = () => new Proxy({}, { get: () => () => FK, set: () => true });
  let ok = true; try { s.stage = n0; s.draw(fk()); s.stage = n0 + 1; s.draw(fk()); } catch (e) { ok = String(e); }
  check('party: the party cards draw', ok === true, ok);
  const PF = run('TourPanelFx'), ST = run('Showtrunk'); let mini = 0; const m0 = ST.mini; ST.mini = function () { mini++; };
  const ctx = new Proxy({}, { get: () => () => ({}), set: () => true });
  PF.airship(ctx, 10, 10, 0); const asBlimp = mini === 0;
  Save.data.settings.danceFx = false; PF.airship(ctx, 10, 10, 0); const offTrunk = mini === 1; delete Save.data.settings.danceFx;
  ST.mini = m0;
  check('party: the Showtrunk is a party blimp on the maps (and back to the trunk with DANCING off)', asBlimp && offTrunk, { asBlimp, offTrunk });
}

console.log(`\n${checks - failures}/${checks} rulebook checks passed`);
process.exit(failures ? 1 : 0);
