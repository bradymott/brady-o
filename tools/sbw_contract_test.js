// The secrets contracts (docs/design/SECRETS_CONTRACTS.md, WP-1 of docs/design/SECRETS_WARPS_SWITCHES.md): every hook,
// the builder's new fields and every new validator rule, on small inline fixture levels. Node only: the real game
// modules in a VM, the real Play scene stepped at 1/120 s for the runtime hooks. The other secrets packages (save and
// maps, backstage and warps, room types, buttons) build on exactly what this file checks.
// usage: node tools/sbw_contract_test.js [section ...]
//   sections: hooks needs build validator rules rooms pace runtime menus
const loadGame = require('./load_game');
const VL = require('./validate_levels.js');
const G = loadGame();
const { Tour, TourBuild, Validator, Save, T, TS } = G;
const TourHooks = G.run('TourHooks'), TourNeeds = G.run('TourNeeds'), TourSeams = G.run('TourSeams');
const want = process.argv.slice(2);
let bad = 0, n = 0;
const check = (name, ok, info) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined && !ok ? '  ' + JSON.stringify(info) : '')); if (!ok) bad++; };
const section = (name, fn) => { if (want.length && !want.includes(name)) return; console.log('== ' + name); try { fn(); } catch (e) { check(name + ' runs', false, String(e.stack).slice(0, 800)); } };
const MX = Tour.countries.mx;
const build = (spec, i) => TourBuild.fromSpec(MX, Object.assign({ arch: 'lab', theme: 'mx_mercado' }, spec), i || 90);
const quiet = fn => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };
// a fresh copy of every hook list (a section never leaks handlers into the next)
const LISTS = ['offEdge', 'playerDie', 'playUpdate', 'areaLoaded', 'camera', 'entityDraw', 'afterEntities', 'levelClear', 'resultsTitle', 'pausePages', 'settings', 'owDraw', 'owTap', 'routeDraw'];
const reset = () => { for (const k of LISTS) TourHooks[k].length = 0; for (const k in TourHooks.rooms) delete TourHooks.rooms[k]; for (const k in TourHooks.exitKinds) delete TourHooks.exitKinds[k]; TourNeeds.provider = null; };

/* ---------- fixtures ---------- */
// a grid of rows from a fill character, with characters set at (x, y)
const grid = (W, H, fill, marks) => { const g = Array.from({ length: H }, () => Array(W).fill(fill)); for (const [x, y, ch] of marks) g[y][x] = ch; return g.map(r => r.join('')); };
const box = (W, H) => { const m = []; for (let x = 0; x < W; x++) { m.push([x, 0, '#'], [x, H - 1, '#'], [x, H - 2, '#']); } for (let y = 0; y < H; y++) m.push([0, y, '#'], [W - 1, y, '#']); return m; };
/* The stage, 36 x 8: Brady stands on row 6. A seam on each edge: the ceiling gap over the spring (top, cols 10-15),
   the pit (bottom, cols 19-21, a crash-mat tell over it), the left wall (rows 4-5) and the right wall (rows 4-5).
   The gate at col 30. Anchors for the way back from each backstage area. */
const STAGE = (() => {
  const W = 36, H = 8, m = box(W, H);
  for (let x = 10; x <= 15; x++) m.push([x, 0, 't']);
  for (const y of [4, 5]) m.push([0, y, 'l'], [W - 1, y, 'r']);
  for (let x = 19; x <= 21; x++) m.push([x, 6, '.'], [x, 7, 'p']);
  m.push([3, 5, '@'], [12, 5, 's'], [30, 5, 'G'], [6, 5, 'a'], [17, 5, 'e'], [24, 5, 'f'], [27, 5, 'd'], [20, 4, 'k'], [6, 3, '*'], [15, 4, '*']);
  return { rows: grid(W, H, '.', m), gold: { '*': 'hidden' }, legend: {
    t: ['seam', 'top', 'rig'], p: ['seam', 'bottom', 'under'], l: ['seam', 'left', 'wings'], r: ['seam', 'right', 'dock'],
    a: ['anchor', 'fromRig'], e: ['anchor', 'fromUnder'], f: ['anchor', 'fromDock'], d: ['anchor', 'fromWings'], k: ['spawn', 'tourCrashMat', {}] } };
})();
// a 28 x 8 backstage room: '@' in, a door back (unless noDoor), one extra legend letter 'x' at col 12
const ROOM = (to, x, opts) => {
  opts = opts || {};
  const W = 28, H = 8, m = box(W, H);
  m.push([2, 5, '@']);
  if (!opts.noDoor) m.push([24, 5, 'D']);
  if (x) m.push([12, 5, 'x']);
  if (opts.pit) for (let c = opts.pit[0]; c <= opts.pit[1]; c++) m.push([c, 6, '.'], [c, 7, '.']);
  if (opts.gold) m.push([5, 3, '*']);
  return { rows: grid(W, H, '.', m), legend: x ? { x } : {}, doors: opts.noDoor ? [] : [{ to }], gold: { '*': 'hidden' } };
};
const STAGE_SPEC = over => Object.assign({
  name: 'Contract stage',
  exits: { main: { to: null }, warp: { to: '1-4', via: 'warp', label: 'VOLCAN' }, warp2: { to: '1-6', via: 'warp', label: 'HOME', needs: 'rule:9' } },
  areas: [
    { id: 'stage', gen: 'room', minH: 8, stamp: STAGE },
    { id: 'rig', gen: 'room', role: 'backstage', zone: 'rigging', minH: 8, stamp: ROOM(null, ['spawn', 'button', { rule: 7 }], { noDoor: true, pit: [14, 17], gold: true }), back: { side: 'bottom', span: [14, 17], to: 'stage@fromRig', tell: 'rope' } },
    { id: 'under', gen: 'room', role: 'backstage', zone: 'under', minH: 8, stamp: ROOM('stage@fromUnder') },
    { id: 'dock', gen: 'room', role: 'backstage', zone: 'dock', minH: 8, stamp: ROOM('stage@fromDock', ['spawn', 'warp', { exit: 'warp' }]) },
    { id: 'wings', gen: 'room', role: 'backstage', zone: 'wings', minH: 8, stamp: ROOM('stage@fromWings', ['spawn', 'warp', { exit: 'warp2', needs: 'rule:9' }]) }
  ]
}, over || {});
const flagsOf = lvl => { const r = Validator.run(lvl, { earlyExit: true }), flags = [], warns = []; VL.secretChecks(G, lvl, r, flags, warns); return { r, flags, warns }; };

section('hooks', () => {
  reset();
  const calls = [];
  TourHooks.on('playUpdate', (a, b) => { calls.push(['one', a, b]); return 0; });
  TourHooks.on('playUpdate', () => { calls.push(['two']); return 'second'; });
  TourHooks.on('playUpdate', () => { calls.push(['three']); return 'third'; });
  check('run(): handlers in order, the first truthy return wins', TourHooks.run('playUpdate', 1, 2) === 'second' && calls.map(c => c[0]).join() === 'one,two', calls);
  calls.length = 0; TourHooks.each('playUpdate', 5);
  check('each(): every handler runs', calls.map(c => c[0]).join() === 'one,two,three', calls);
  check('run() on an empty or unknown list returns null', TourHooks.run('offEdge') === null && TourHooks.run('noSuchHook') === null);
  const errs0 = G.run('window.__sbwErrors || 0'), ce = console.error; console.error = () => {};
  const thrower = TourHooks.on('camera', () => { throw new Error('boom'); });
  TourHooks.on('camera', () => 'after');
  const r = TourHooks.run('camera');
  console.error = ce;
  check('a handler that throws is skipped and counted in window.__sbwErrors (tests see it)', r === 'after' && G.run('window.__sbwErrors') === errs0 + 1);
  TourHooks.off('camera', thrower);
  check('off() removes a handler', TourHooks.camera.length === 1);
  check('every list of the plan exists (§5.6 Hooks) plus the WP-1 additions', LISTS.every(k => Array.isArray(TourHooks[k])) && 'peek' in TourHooks, LISTS.filter(k => !Array.isArray(TourHooks[k])));
  // exit kinds
  const lvl = { exits: { main: { to: null }, warp: { to: '1-4', via: 'warp' }, odd: { to: '1-2', via: 'nope' } } };
  TourHooks.exitKind('warp', { title: 'WORMHOLE!', marksDone: false });
  check('exit kinds: kindOf / marksDone / titleFor read exits.<key>.via', TourHooks.kindOf(lvl, 'warp').title === 'WORMHOLE!' && !TourHooks.marksDone(lvl, 'warp') && TourHooks.marksDone(lvl, 'main') && TourHooks.marksDone(lvl, 'odd') && TourHooks.titleFor({ level: lvl, exitKey: 'warp' }) === 'WORMHOLE!' && TourHooks.titleFor({ level: lvl, exitKey: 'main' }) === null);
  TourHooks.on('resultsTitle', p => p.exitKey === 'main' ? 'HOOKED!' : null);
  check('a resultsTitle handler wins over the exit kind', TourHooks.titleFor({ level: lvl, exitKey: 'main' }) === 'HOOKED!' && TourHooks.titleFor({ level: lvl, exitKey: 'warp' }) === 'WORMHOLE!');
  reset();
});

section('needs', () => {
  reset();
  const M = TourNeeds.met.bind(TourNeeds);
  check("'rule:9' holds only when rule 9 is revoked", !M('rule:9', null) && !M('rule:9', [7]) && M('rule:9', [7, 9]) && M('rule:9', new Set([9])) && M('rule:9', 'all'));
  check("'rules:5' holds when any five rules are revoked", !M('rules:5', [1, 3, 7, 9]) && M('rules:5', [1, 3, 7, 9, 10]));
  check('an array of needs must all hold; no needs always hold', M(['rule:7', 'rule:9'], [7, 9]) && !M(['rule:7', 'rule:9'], [7]) && M(null, null) && M(undefined, []));
  check('valid() accepts rule:n and rules:n only', TourNeeds.valid('rule:9') && TourNeeds.valid(['rules:5']) && !TourNeeds.valid('rule:x') && !TourNeeds.valid('9'));
  Save.data = Save.defaults(); Save.data.tour = { rules: { 7: { at: '1-4' } } };
  check('in the game, the revoked set is Save.data.tour.rules (WP-2\'s save field)', TourNeeds.ok('rule:7') && !TourNeeds.ok('rule:9') && TourNeeds.revoked().has(7));
  TourNeeds.provider = () => new Set([9]);
  check('TourNeeds.provider replaces the save lookup (WP-5 may set it)', TourNeeds.ok('rule:9') && !TourNeeds.ok('rule:7'));
  reset(); Save.data = Save.defaults();
});

section('build', () => {
  reset();
  const lvl = build(STAGE_SPEC());
  const [S, R, U, D, Wg] = lvl.areas, sm = side => (S.seams || []).find(s => s.side === side);
  check('the fixture builds with no problems', !lvl.problems.length, lvl.problems);
  check("the stamp legend's 'seam' letters become one seam per edge, spans along the edge", sm('top') && sm('top').a === 10 && sm('top').b === 15 && sm('bottom').a === 19 && sm('bottom').b === 21 && sm('left').a === 4 && sm('left').b === 5 && sm('right').a === 4 && sm('right').b === 5, S.seams);
  check('seam targets resolve like door refs (area index and anchor position)', sm('top').target.area === 1 && sm('bottom').target.area === 2 && sm('right').target.area === 3 && sm('left').target.area === 4 && sm('top').target.x === R.anchors.in.x, S.seams.map(s => s.target));
  check('seam cells are left open (the ceiling gap, the side doors in the walls, the pit floor)', [10, 15].every(x => S.tiles[x] === T.EMPTY) && S.tiles[4 * S.W] === T.EMPTY && S.tiles[5 * S.W + S.W - 1] === T.EMPTY && S.tiles[7 * S.W + 20] === T.EMPTY);
  check("an area's back: { side, span, to, tell } is a return seam", R.seams && R.seams.length === 1 && R.seams[0].side === 'bottom' && R.seams[0].a === 14 && R.seams[0].b === 17 && R.seams[0].target.area === 0 && R.seams[0].target.x === S.anchors.fromRig.x && R.seams[0].tell === 'rope', R.seams);
  check('role backstage and zone are copied onto the area', R.role === 'backstage' && R.zone === 'rigging' && U.zone === 'under' && D.zone === 'dock' && Wg.zone === 'wings');
  check('level.buttons lists the buttons placed (rule numbers)', JSON.stringify(lvl.buttons) === '[7]', lvl.buttons);
  const rc = Wg.spawns.find(s => s.type === 'warp');
  check('spawn options carry needs through the stamp legend', rc && rc.needs === 'rule:9' && rc.exit === 'warp2', rc);
  check('exits keep via, label and needs', lvl.exits.warp.via === 'warp' && lvl.exits.warp.label === 'VOLCAN' && lvl.exits.warp2.needs === 'rule:9');
  check('TourNeeds.inLevel sees the needs', TourNeeds.inLevel(lvl) && !TourNeeds.inLevel(build({ name: 'plain', exits: { main: { to: null } }, areas: [{ id: 'r', gen: 'room', stamp: ROOM(null, null, { noDoor: true }) }] })));
  // a level that uses none of the new fields gets none of them (the 88 shipped levels build byte-identical)
  const plain = build({ name: 'plain', exits: { main: { to: null } }, areas: [{ id: 'r', gen: 'room', stamp: ROOM(null, null, { noDoor: true }) }] });
  check('a plain level gets no seams, buttons, roomType, zone or needs fields', !('buttons' in plain) && plain.areas.every(a => !('seams' in a) && !('roomType' in a) && !('zone' in a) && !('needs' in a) && !('paceTo' in a)));
  // a seam to nowhere is a build problem
  const lost = quiet(() => build(STAGE_SPEC({ areas: [{ id: 'stage', gen: 'room', minH: 8, stamp: Object.assign({}, STAGE, { legend: Object.assign({}, STAGE.legend, { t: ['seam', 'top', 'nowhere@x'] }) }) }].concat(STAGE_SPEC().areas.slice(1)) })));
  check('a seam whose target does not exist is a build problem and has no target', lost.problems.some(p => /seam stage\/top: no target 'nowhere@x'/.test(p)) && !lost.areas[0].seams.find(s => s.side === 'top').target, lost.problems);
  // mirrored areas flip their seams with them (22-3 Mirror Lake: its wings are off the right edge)
  const mir = build({ name: 'mirror', exits: { main: { to: null } }, areas: [{ id: 'm', gen: 'room', minH: 8, mirror: true, stamp: { rows: grid(28, 8, '.', box(28, 8).concat([[0, 5, 'l'], [0, 4, 'l'], [2, 5, '@'], [5, 0, 't'], [6, 0, 't']])), legend: { l: ['seam', 'left', 'w'], t: ['seam', 'top', 'w'] } } }, { id: 'w', gen: 'room', minH: 8, stamp: ROOM('m') }] });
  const ms = side => mir.areas[0].seams.find(s => s.side === side);
  check('a mirrored area flips its seams: left becomes right, a top span is mirrored', ms('right') && !ms('left') && ms('top').a === 28 - 1 - 6 && ms('top').b === 28 - 1 - 5, mir.areas[0].seams);
  // locks: needsAll, needs, and the treasure X
  const lk = build({ name: 'locks', exits: { main: { to: null } }, areas: [{ id: 'k', gen: 'room', minH: 8, stamp: { rows: grid(28, 8, '.', box(28, 8).concat([[2, 5, '@'], [10, 5, 'M'], [10, 4, 'M'], [10, 3, 'M'], [14, 5, 'N'], [14, 4, 'N'], [14, 3, 'N'], [18, 6, 'X']])), legend: { M: ['lock', 'pot', { needsAll: ['ing:chili', 'ing:cacao'] }], N: ['lock', 'pad9', { needs: 'rule:9' }], X: ['xmark', 'x1'] } } }] });
  const byId = (list, id) => list.find(q => q.id === id) || {}, Ls = lk.areas[0].locks, sp = lk.areas[0].spawns.filter(s => s.type === 'lock');
  check("lock legend { needsAll, needs } lands on area.locks and the lock spawn; 'xmark' is a one-tile floor lock (look 'xmark')", Ls.length === 3 && JSON.stringify(byId(Ls, 'pot').needsAll) === '["ing:chili","ing:cacao"]' && byId(sp, 'pot').needsAll && byId(Ls, 'pad9').needs === 'rule:9' && byId(sp, 'pad9').needs === 'rule:9' && byId(Ls, 'x1').tiles.length === 1 && byId(sp, 'x1').look === 'xmark' && lk.areas[0].tiles[6 * 28 + 18] === T.HARD, { Ls, sp });
  check('the stamp legend accepts seam and xmark (no parse problems)', !lk.problems.length && !lvl.problems.length, lk.problems);
  reset();
});

section('validator', () => {
  reset();
  const lvl = build(STAGE_SPEC());
  const off = Validator.run(lvl, {});
  check('rules off: the main exit and the active warp are reached; the dormant warp is not required', off.exits.main && off.exits.warp && !off.exitKeys.includes('warp2') && off.exitKeys.includes('warp'), { exits: off.exits, keys: off.exitKeys });
  check('every backstage area is reached through its seam (top by the spring, bottom by the pit, both side walls)', off.areasReached.every(Boolean) && ['stage/top', 'stage/bottom', 'stage/left', 'stage/right', 'rig/bottom'].every(k => off.seams[k]), { reached: off.areasReached, seams: off.seams });
  check('the button is a required target (res.buttons), reached in the Rigging', off.buttons[7] === true && JSON.stringify(off.buttonRules) === '[7]');
  check('all three postcards (one of them backstage) and res.ok', off.gold.every(Boolean) && off.ok, { gold: off.gold, pace: off.pace });
  check('rules off: the dormant warp (needs rule:9) is skipped', !off.exits.warp2);
  const on = Validator.run(lvl, { rules: 'all' });
  check("rules on ('all'): the dormant warp is required and reached", on.exitKeys.includes('warp2') && on.exits.warp2 && on.ok, on.exits);
  check('rules { 9 } only: the same as all for this level', Validator.run(lvl, { rules: new Set([9]) }).exits.warp2 === true);
  // without the seams nothing backstage is reachable: the seams are what the search walks through
  const cut = Object.assign({}, lvl, { areas: lvl.areas.map(a => Object.assign({}, a, { seams: undefined })) });
  const rc = Validator.run(cut, {});
  check('the same level with its seams removed: no backstage area, warp or button is reachable', rc.areasReached.slice(1).every(x => !x) && !rc.exits.warp && !rc.buttons[7], rc.areasReached);
  // a button nobody can reach fails res.ok
  const walled = build(STAGE_SPEC({ areas: STAGE_SPEC().areas.map(A => A.id === 'stage' ? Object.assign({}, A, { stamp: Object.assign({}, STAGE, { legend: Object.assign({}, STAGE.legend, { t: ['tile', 'HARD'] }) }) }) : A) }));
  const rw = quiet(() => Validator.run(walled, {}));
  check('the ceiling gap walled up: the Rigging and its button are unreached and res.ok fails', !rw.areasReached[1] && !rw.buttons[7] && !rw.ok);
  const fw = flagsOf(walled).flags;
  check('validate_levels names it: BUTTON 7 UNREACHABLE', fw.includes('BUTTON 7 UNREACHABLE'), fw);
  // the seam check runs before the "left the area" give-up: the same jump without the seam returns null
  const A0 = Validator.proxyArea(lvl.areas[0], 0); A0.crawl = [];
  const m = { dir: 1, sp: G.PHYS.walk, off: 1, hold: 0, jump: false };
  const withSeam = Validator.simulate(Object.assign({}, A0, { seams: lvl.areas[0].seams }), 0, 18, 6, m, G.PLAYER_DIM.big, () => {}, 1, 0);
  const without = Validator.simulate(A0, 0, 18, 6, m, G.PLAYER_DIM.big, () => {}, 1, 0);
  check('simulate(): walking off into the seam pit returns { seam }; with no seam the same fall returns null', withSeam && withSeam.seam && withSeam.seam.side === 'bottom' && without === null, { withSeam, without });
  // no flags on the good fixture (way back, Under-Stage, labels, warps)
  const ok = flagsOf(lvl);
  check('the good fixture passes every validate_levels secrets check', !ok.flags.length, ok.flags);
  // a water seam (a whirlpool on a sea floor): the flood search finds it
  const sea = build({ name: 'sea', exits: { main: { to: null } }, areas: [
    { id: 'sea', gen: 'room', water: true, minH: 10, stamp: { rows: grid(28, 10, 'W', box(28, 10).filter(([x, y]) => y < 9).concat([[2, 7, '@'], [12, 8, 'w'], [13, 8, 'w'], [12, 9, 'w'], [13, 9, 'w'], [11, 9, '#'], [14, 9, '#']]).concat(Array.from({ length: 28 }, (_, x) => [x, 9, x === 12 || x === 13 ? 'w' : '#']))), legend: { w: ['seam', 'bottom', 'cave'] } } },
    { id: 'cave', gen: 'room', minH: 8, stamp: ROOM('sea') }] });
  const rs = Validator.run(sea, {});
  check('a water seam: swimming into the sea-floor seam reaches its area', rs.areasReached[1] && rs.seams['sea/bottom'], { reached: rs.areasReached, seams: rs.seams, problems: sea.problems });
  reset();
});

section('rules', () => {
  reset();
  const good = build(STAGE_SPEC());
  const variant = mut => { const L = build(STAGE_SPEC()); mut(L); return flagsOf(L).flags; };
  check('no way back: a backstage area with no exit is flagged', variant(L => { const d = L.areas[3]; d.spawns = d.spawns.filter(s => s.type !== 'portal'); }).includes('SEAM stage/right HAS NO WAY BACK'));
  check('Under-Stage: a seam pit with no tell is flagged', variant(L => { L.areas[0].spawns = L.areas[0].spawns.filter(s => s.type !== 'tourCrashMat'); }).some(f => /UNDER-STAGE stage\/bottom: the seam pit has no tell/.test(f)));
  check('Under-Stage: a seam over part of a pit is flagged (the seam pit must be wholly safe)', variant(L => { const s = L.areas[0].seams.find(q => q.side === 'bottom'); s.b = 20; }).some(f => /UNDER-STAGE stage\/bottom: the pit is 19\.\.21/.test(f)));
  check('Under-Stage: a seam over solid floor is flagged', variant(L => { const s = L.areas[0].seams.find(q => q.side === 'bottom'); s.a = 22; s.b = 24; }).some(f => /not one open pit/.test(f)));
  check('a seam with no target is flagged', variant(L => { L.areas[0].seams.find(q => q.side === 'top').target = null; }).some(f => /SEAM stage\/top HAS NO TARGET/.test(f)));
  check('two seams on one side are flagged', variant(L => { L.areas[0].seams.push(Object.assign({}, L.areas[0].seams[0])); }).some(f => /two seams on one side/.test(f)));
  check('a seam on a solid edge is flagged', variant(L => { const s = L.areas[0].seams.find(q => q.side === 'left'); s.a = 1; s.b = 2; for (const y of [1, 2]) L.areas[0].tiles[y * L.areas[0].W] = T.HARD; }).some(f => /the edge is solid/.test(f)));
  for (const [why, mut] of [['autoscroll', L => { L.areas[0].autoscroll = 2; }], ['boss arena', L => { L.areas[0].role = 'arena'; }], ['flip', L => { L.areas[0].zones = [{ kind: 'flip', x: 0, y: 0, w: 32, h: 32 }]; }], ['CARRY', L => { L.areas[0].carry = { jumpMul: 0.9 }; }], ['rail', L => { L.areas[0].gen = 'rail'; }]])
    check(`no seams in a ${why} area`, variant(mut).some(f => f.includes(`not allowed in a ${why} area`)));
  check('a warp exit with no label, or a label over 14 characters, is flagged', variant(L => { L.exits = Object.assign({}, L.exits, { warp: Object.assign({}, L.exits.warp, { label: undefined }) }); }).includes('WARP WARP LABEL MISSING') && variant(L => { L.exits = Object.assign({}, L.exits, { warp: Object.assign({}, L.exits.warp, { label: 'FIFTEEN LETTERS' }) }); }).includes('WARP WARP LABEL TOO LONG'));
  check('a warp naming an exit the level does not have is flagged', variant(L => { L.areas[3].spawns.find(s => s.type === 'warp').exit = 'warp7'; }).some(f => /WARP IN dock: NO EXIT 'warp7'/.test(f)));
  check('a warp that cannot be reached is WARP <key> UNREACHABLE (not EXIT ...)', (() => { const L = build(STAGE_SPEC()); L.areas[0].seams = L.areas[0].seams.filter(s => s.side !== 'right'); const fl = flagsOf(L).flags; return fl.includes('WARP WARP UNREACHABLE'); })());
  check('a dormant warp unreachable with the rules on is flagged (rules on)', variant(L => { const w = L.areas[4]; w.spawns.find(s => s.type === 'warp').x = 40 * TS; }).includes('WARP WARP2 UNREACHABLE (rules on)'));
  // whole-game rules (--rules): buttons, warps per land, room variety; --release turns the rollout warnings into errors
  // a land with no warp in its specs yet (the rollout adds them land by land; Mexico has one since stage B)
  const NW = (() => { const T = G.Tour; for (const w of T.worldList()) { const C = T.byWorld[w]; if (!C.levels.some(L => Object.keys(L.exits || {}).some(k => L.exits[k] && L.exits[k].via === 'warp'))) return C; } return null; })();
  const nw = NW ? NW.world : 1, nwId = NW ? NW.id : 'mx';
  const res = [{ id: nw + '-1', info: { buttons: [7], warps: [], rooms: ['pantry'] } }, { id: nw + '-2', info: { buttons: [7], warps: [], rooms: ['pantry', 'closing'] } }];
  // the fixture rules stand in for the game's own (TOUR_RULES, src/28_tour_sb_buttons.js) while this runs
  G.run('globalThis.__fx = { 7: { opens: ["1-6", "land:nowhere"] }, 3: { opens: ["land:aq"] } }; if (typeof TOUR_RULES !== "undefined") { globalThis.__savedRules = Object.assign({}, TOUR_RULES); for (const k in TOUR_RULES) delete TOUR_RULES[k]; Object.assign(TOUR_RULES, __fx); } else globalThis.TOUR_RULES = __fx');
  const R = VL.secretRules(G, res, false), Rr = VL.secretRules(G, res, true);
  G.run('if (globalThis.__savedRules) { for (const k in TOUR_RULES) delete TOUR_RULES[k]; Object.assign(TOUR_RULES, __savedRules); delete globalThis.__savedRules; } else delete globalThis.TOUR_RULES');
  check('--rules: a button placed twice, a rule with no button, an opens target that does not exist are errors', R.errors.some(e => /rule 7: its button is placed 2 times/.test(e)) && R.errors.some(e => /rule 3: its button is placed 0 times/.test(e)) && R.errors.some(e => /rule 7: opens 'land:nowhere'/.test(e)) && !R.errors.some(e => /'1-6'/.test(e)), R.errors);
  check('--rules: lands without a warp and with under 3 room types are warnings (errors with --release)', R.warnings.some(w => new RegExp('lands without a warp.*' + nwId).test(w)) && R.warnings.some(w => new RegExp('fewer than 3 secret-room types.*' + nwId).test(w)) && Rr.errors.some(e => /lands without a warp/.test(e)), R);
  const R3 = VL.secretRules(G, [{ id: '1-1', info: { buttons: [], warps: [], rooms: ['closing', 'closing', 'closing'] } }], false);
  check('--rules: a new room type more than twice in a land is flagged', R3.warnings.some(w => /room type closing used 3 times/.test(w)), R3);
  check('--rules: a placed button with no TOUR_RULES entry is an error', VL.secretRules(G, res, false).errors.some(e => /no such rule in TOUR_RULES/.test(e)));
  void good;
  reset();
});

section('rooms', () => {
  reset();
  const seen = [];
  TourHooks.room('contract', {
    spec: (A, ctx) => Object.assign({}, A, { minH: 9 }),
    build: (ctx, A, built) => { seen.push([A.id, built.area.H, ctx.id]); built.area.spawns.push({ type: 'roomClockTest', x: 64, y: 160 }); }
  });
  const spec = (room, opts) => ({ name: 'rooms', exits: { main: { to: null } }, areas: [{ id: 'hall', gen: 'room', minH: 8, stamp: ROOM('cell') }, Object.assign({ id: 'cell', gen: 'room', role: 'secret', room, minH: 8, stamp: ROOM('hall', null, opts) }, room === 'contract' ? { contract: { t: 12 } } : {})] });
  const lvl = build(spec('contract'));
  check('a registered room type: spec() rewrites the area before its gen, build() runs after it', seen.length === 1 && seen[0][0] === 'cell' && seen[0][1] === 9 && lvl.areas[1].H === 9 && lvl.areas[1].spawns.some(s => s.type === 'roomClockTest'), seen);
  check('area.roomType is the spec room; door refs still find the area by its id', lvl.areas[1].roomType === 'contract' && lvl.areas[0].spawns.find(s => s.type === 'portal').target.area === 1);
  const un = quiet(() => build(spec('closing')));
  check('an unregistered room type is a build problem and builds as a plain room', un.problems.some(p => /room type 'closing' is not registered/.test(p)) && un.areas[1].roomType === 'closing');
  check("'pantry' (today's room) needs no registration", !quiet(() => build(spec('pantry'))).problems.length);
  check('a room of a new type with a way out passes', !flagsOf(lvl).flags.length, flagsOf(lvl).flags);
  const trap = quiet(() => build({ name: 'trap', exits: { main: { to: null } }, areas: [{ id: 'hall', gen: 'room', minH: 8, stamp: ROOM('cell') }, { id: 'cell', gen: 'room', role: 'secret', room: 'contract', minH: 8, stamp: ROOM(null, null, { noDoor: true }) }] }));
  check('a room of a new type with no way out is flagged: ROOM <aid> HAS NO WAY OUT', flagsOf(trap).flags.includes('ROOM cell (contract) HAS NO WAY OUT'), flagsOf(trap).flags);
  // needsAll: the recipe kitchen's lock opens only with every ingredient held
  const kitchen = keys => build({ name: 'kitchen', exits: { main: { to: null } }, areas: [{ id: 'k', gen: 'room', minH: 8, stamp: { rows: grid(28, 8, '.', box(28, 8).concat([[2, 5, '@'], [16, 5, 'M'], [16, 4, 'M'], [16, 3, 'M'], [16, 2, 'M'], [16, 1, 'M'], [22, 5, 'G']]).concat(keys.map((k, j) => [4 + j * 3, 5, String(j)]))), legend: Object.assign({ M: ['lock', 'pot', { needsAll: ['ing:chili', 'ing:cacao', 'ing:tomato'] }] }, Object.fromEntries(keys.map((k, j) => [String(j), ['key', 'ing:' + k]]))) } }] });
  const all3 = Validator.run(kitchen(['chili', 'cacao', 'tomato']), {}), two = Validator.run(kitchen(['chili', 'cacao']), {});
  check('lock.needsAll: the gate behind the lock is reached with all 3 ingredients, not with 2', all3.exits.main && !two.exits.main, { all3: all3.held, two: two.held });
  // needs on a lock: closed with the rules off even with its key
  const dormant = build({ name: 'dormant', exits: { main: { to: null } }, areas: [{ id: 'k', gen: 'room', minH: 8, stamp: { rows: grid(28, 8, '.', box(28, 8).concat([[2, 5, '@'], [5, 5, 'K'], [16, 5, 'M'], [16, 4, 'M'], [16, 3, 'M'], [16, 2, 'M'], [16, 1, 'M'], [22, 5, 'G']])), legend: { K: ['key', 'pad'], M: ['lock', 'pad', { needs: 'rule:9' }] } } }] });
  check('lock.needs: a padlocked door stays shut with the rules off and opens with rule 9 revoked', !Validator.run(dormant, {}).exits.main && Validator.run(dormant, { rules: [9] }).exits.main);
  reset();
});

section('pace', () => {
  reset();
  // a sub-area with a rising hazard (an Hourglass Well): measured from where Brady enters to its goal
  const well = (rw, extra) => quiet(() => build({ name: 'well', exits: { main: { to: null } }, areas: [
    { id: 'yard', gen: 'room', minH: 8, stamp: Object.assign(ROOM('well'), { rows: grid(28, 8, '.', box(28, 8).concat([[2, 5, '@'], [24, 5, 'D'], [12, 5, 'G']])) }) },
    Object.assign({ id: 'well', gen: 'room', role: 'secret', minH: 8, risingWater: rw, stamp: { rows: grid(28, 8, '.', box(28, 8).concat([[2, 5, '@'], [24, 5, 'r'], [5, 5, 'D']])), legend: { r: ['anchor', 'rim'] }, doors: [{ to: 'yard' }] } }, extra || {})] }));
  const slow = Validator.run(well({ speed: 0.5, delay: 2 }, { paceTo: 'rim' }), {});
  const fast = Validator.run(well({ speed: 12, delay: 0 }, { paceTo: 'rim' }), {});
  const pa = r => (r.pace.areas || [])[0] || {};
  check('per-area pace: a slow hazard in a sub-area passes with a margin', pa(slow).aid === 'well' && pa(slow).ok && slow.pace.ok && pa(slow).route > 10, slow.pace);
  check('per-area pace: a hazard too fast for the route from entry to goal (area.paceTo) fails the level', pa(fast).aid === 'well' && !pa(fast).ok && !fast.pace.ok && !fast.ok, fast.pace);
  const fl = []; VL.secretChecks(G, well({ speed: 12, delay: 0 }, { paceTo: 'rim' }), fast, fl, []);
  check('validate_levels names the area: PACE well margin ...', fl.some(f => /^PACE well margin/.test(f)), fl);
  check('area.paceTo is copied from the spec', well({ speed: 1 }, { paceTo: 'rim' }).areas[1].paceTo === 'rim');
  // without paceTo the goal is its exit furthest along the hazard; the main area keeps its own rule unchanged
  const noGoal = Validator.run(well({ speed: 0.5, delay: 2 }), {});
  check('without paceTo the furthest exit is the goal (here the door: a short route, a wide margin)', pa(noGoal).ok && pa(noGoal).route != null, noGoal.pace);
  check('the main area\'s pace is unchanged (no main hazard: margin null)', slow.pace.margin === null);
  reset();
});

/* ---------- the runtime hooks: a real Play on the stage fixture ---------- */
let playBooted = false;
const boot = () => {
  if (playBooted) return; playBooted = true;
  G.run('(' + function () {
    Atlas.need = () => {}; Atlas.keep = () => {}; Atlas.load = () => {};
    globalThis.Game = { dpr: 1, cssW: 844, cssH: 390, viewW: 844, viewH: 10 * TS, rows: 10, gameRect: { x: 0, y: 0, w: 844, h: 390 }, quality: 1, forceTouchUI: true, S: 1,
      setRows(r) { this.rows = r; this.viewH = r * TS; }, setScene(s) { this.scene = s; }, resize() {}, reportError() {}, isUnlocked: () => true, isDone: () => false, secretFound() {}, goldCount: () => 0, pathOpen: () => true, complete() {}, vignette() {}, canvas: { width: 844, height: 390, style: {} } };
  } + ')()');
};
const play = (lvl, ai, x, y) => G.run(`(function (lvl, ai, x, y) {
  Save.data = Save.defaults(); Save.data.lives = 9;
  const g = new Play(lvl, {}); Game.scene = g; g.state = 'play'; g.fade.a = 0; g.fade.target = 0;
  for (const k in Input) if (typeof Input[k] === 'boolean') Input[k] = false;
  if (ai !== g.area.idx) g.loadArea(ai, x, y, 1);
  const p = g.player; p.x = x - p.w / 2; p.y = y - p.h; p.vx = p.vy = 0; p.invuln = 99; p.state = 'play';
  g.camX = Math.max(0, p.cx - Game.viewW / 2); g.camY = g.camTargetY(true);
  return g;
})`)(lvl, ai, x, y);
const step = (g, frames, inp) => { const I = G.run('Input'); for (let k = 0; k < frames; k++) { Object.assign(I, inp || {}); g.update(1 / 120); } for (const k in (inp || {})) I[k] = false; };

section('runtime', () => {
  reset(); boot();
  const lvl = build(STAGE_SPEC());
  const S = lvl.areas[0], log = [];
  TourHooks.on('offEdge', (g, p, side, seam) => { log.push({ side, to: seam.target.area, aid: g.area.aid }); return true; });
  // right: pressing against the right wall inside the span
  let g = play(lvl, 0, 33 * TS + 16, 6 * TS); step(g, 90, { right: true });
  check('offEdge(play, player, "right", seam) fires when Brady presses into the right seam', log.some(l => l.side === 'right' && l.to === 3 && l.aid === 'stage'), log);
  log.length = 0;
  g = play(lvl, 0, 2 * TS, 6 * TS); step(g, 90, { left: true });
  check('offEdge fires for the left seam', log.some(l => l.side === 'left' && l.to === 4), log);
  log.length = 0;
  g = play(lvl, 0, 20 * TS + 16, 6 * TS); g.player.y = 5 * TS; step(g, 120);
  check('offEdge fires for the bottom seam before the pit kills, and the handler taking over keeps Brady alive', log.some(l => l.side === 'bottom' && l.to === 2) && !g.player.dead, { log, dead: g.player.dead });
  log.length = 0;
  g = play(lvl, 0, 12 * TS + 16, 3 * TS); g.player.vy = -900; g.player.onGround = false; step(g, 60);
  check('offEdge fires for the top seam once the whole body is above the area', log.some(l => l.side === 'top' && l.to === 1), log);
  // the same moves with no handler: the game is unchanged (the wall blocks, the pit kills)
  reset(); log.length = 0;
  g = play(lvl, 0, 33 * TS + 16, 6 * TS); step(g, 90, { right: true });
  check('no handler: the right wall still stops Brady at the edge', !g.player.dead && Math.abs(g.player.x + g.player.w - S.W * TS) < 2, { x: g.player.x });
  g = play(lvl, 0, 20 * TS + 16, 6 * TS); g.player.y = 5 * TS; step(g, 120);
  check('no handler: the seam pit is an ordinary deadly pit (the game is unchanged until WP-3 registers)', g.player.dead);
  // a seam whose needs are not met never fires
  const dlvl = build(STAGE_SPEC()); dlvl.areas[0].seams.find(s => s.side === 'right').needs = 'rule:9';
  TourHooks.on('offEdge', (gg, p, side) => { log.push(side); return true; });
  g = play(dlvl, 0, 33 * TS + 16, 6 * TS); step(g, 90, { right: true });
  check('a seam with unmet needs never fires (dormant)', !log.includes('right'), log);
  reset();
  // playerDie, areaLoaded, playUpdate, camera
  let died = 0, loaded = [], frames = 0;
  TourHooks.on('playerDie', (gg, p, reason) => { died++; return reason === 'pit'; });
  TourHooks.on('areaLoaded', (gg, a) => loaded.push(a.aid));
  TourHooks.on('playUpdate', (gg, dt) => { frames++; });
  TourHooks.on('camera', gg => { gg.camX = 123; });
  g = play(lvl, 0, 20 * TS + 16, 6 * TS); g.player.y = 5 * TS; step(g, 120);
  check('playerDie(play, player, reason) -> true cancels the death', died >= 1 && !g.player.dead);
  g.player.die('lava');
  check('playerDie returning false lets the death happen', g.player.dead);
  check('areaLoaded(play, area) runs at the end of every loadArea', loaded[0] === 'stage' && (g.loadArea(2, 3 * TS, 6 * TS), loaded[loaded.length - 1] === 'under'), loaded);
  check('playUpdate(play, dt) runs every frame', frames >= 120, frames);
  check('camera(play, dt) runs last in updateCamera (it may set camX)', g.camX === 123, g.camX);
  reset();
  // levelClear, marksDone, the results title
  TourHooks.exitKind('warp', { title: 'WORMHOLE!', marksDone: false });
  let cleared = null;
  TourHooks.on('levelClear', (gg, gate) => { cleared = gate.exitKey; });
  g = play(lvl, 0, 3 * TS, 6 * TS);
  g.levelClear({ exitKey: 'warp', secret: true, cx: 100, y: 100 });
  check('levelClear(play, gate) runs after the clear is recorded; a marksDone: false kind leaves done unset', cleared === 'warp' && !G.Save.data.done[g.id] && g.exitKey === 'warp', { cleared, done: G.Save.data.done[g.id] });
  check('the results title comes from the exit kind', TourHooks.titleFor(g) === 'WORMHOLE!');
  g = play(lvl, 0, 3 * TS, 6 * TS);
  g.levelClear({ exitKey: 'main', cx: 100, y: 100 });
  check('the main exit still marks the level done', G.Save.data.done[g.id] === true);
  reset();
  // entityDraw and afterEntities: Play.draw on a recording canvas
  let wrapped = 0, after = 0;
  TourHooks.on('entityDraw', (gg, ctx, e) => { wrapped++; ctx.translate(0, -2); e.draw(ctx, gg.t); return true; });
  TourHooks.on('afterEntities', (gg, ctx, layers) => { after = layers.length; });
  g = play(lvl, 0, 3 * TS, 6 * TS);
  const ctx = G.run('document.createElement("canvas").getContext("2d")');
  let drew = true; try { g.draw(ctx); } catch (e) { drew = String(e.stack).slice(0, 300); }
  check('entityDraw(play, ctx, e) wraps each visible entity; afterEntities(play, ctx, layers) runs once after them', drew === true && wrapped > 0 && after === 4, { drew, wrapped, after });
  reset();
});

section('menus', () => {
  reset(); boot();
  const lvl = build(STAGE_SPEC());
  const g = play(lvl, 0, 3 * TS, 6 * TS);
  const labels = L => L.map(b => b.label).join('|');
  const before = G.run('buildPauseUI')(g);
  let opened = 0;
  TourHooks.on('pausePages', pp => ({ label: 'BUTTONS', fn: () => { opened++; } }));
  const after = G.run('buildPauseUI')(g);
  const rb = after.find(b => b.label === 'BUTTONS');
  check('pausePages(play) -> { label, fn }: one extra full-width row; the menu moves up half a row', rb && after.length === before.length + 1 && after.extraRows === 1 && rb.w === before[0].w && after[0].y === before[0].y - 27 && (rb.fn(), opened === 1), { before: labels(before), after: labels(after) });
  check('no pause handler: the menu is exactly as before', labels(before) === labels(G.run('(function(){ TourHooks.pausePages.length = 0; return buildPauseUI(Game.scene); })')()) && !before.extraRows);
  const S0 = G.run('new SettingsScene(null)');
  let flips = 0;
  TourHooks.on('settings', sc => ({ label: 'ANIMAL FX', value: flips % 2 ? 'HIDE' : 'SHOW', fn: () => { flips++; } }));
  const S1 = G.run('new SettingsScene(null)');
  const row = S1.btns.find(b => /^ANIMAL FX/.test(b.label));
  check('settings(scene) -> { label, value, fn }: one extra row; tapping runs fn and rebuilds', row && S1.btns.length === S0.btns.length + 1 && row.label === 'ANIMAL FX:  SHOW' && (row.fn(), flips === 1 && S1.btns.some(b => b.label === 'ANIMAL FX:  HIDE')), S1.btns.map(b => b.label));
  reset();
});

console.log(`\n${n - bad}/${n} contract checks passed`);
process.exit(bad ? 1 : 0);
