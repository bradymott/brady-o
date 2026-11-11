// The level toolkit's interface (LEVEL_OVERHAUL.md §7): spec v2, stamps, the area graph, exits and progress, and the
// validator v2 primitives, each on a small fixture level. Node only (no browser); the browser checks of the same
// objects live in tools/sbw_toolkit_shots.js.
// usage: node tools/sbw_toolkit_test.js [section ...]   sections: spec stamps graph progress validator gens objects systems behave gear map
const loadGame = require('./load_game');
const G = loadGame();
const { Tour, TourProgress, TourBuild, TourStamp, Validator, Save, T, TS } = G;
const want = process.argv.slice(2);
let bad = 0, n = 0;
const check = (name, ok, info) => { n++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined && !ok ? '  ' + JSON.stringify(info) : '')); if (!ok) bad++; };
const section = (name, fn) => { if (want.length && !want.includes(name)) return; console.log('== ' + name); try { fn(); } catch (e) { check(name + ' runs', false, String(e.stack).slice(0, 600)); } };
const fixtures = require('./fixtures/sbw_lab_levels.js');
const MX = Tour.countries.mx;
const build = (spec, i) => TourBuild.fromSpec(Tour.countries[spec.host || 'mx'], spec, i || 90);
const validate = (spec, i) => { const lvl = build(spec, i); return { lvl, r: Validator.run(lvl, {}) }; };
const fresh = () => { Save.data = Save.defaults(); Save.data.v = 3; TourProgress.data(); };

section('spec', () => {
  check('68 main levels in 14 countries (secret levels come on top)', Tour.worldList().reduce((n, w) => n + Tour.byWorld[w].mainCount, 0) === 68 && Tour.allLevelIds().length >= 68 && Tour.worldList().length === 14);
  check('every country knows its main-level count (5, or 4 for the secret lands)', Tour.worldList().every(w => { const C = Tour.byWorld[w]; return C.mainCount === (C.secret ? 4 : 5); }), Tour.worldList().map(w => Tour.byWorld[w].id + Tour.byWorld[w].mainCount));
  const L84 = Tour.specOf('8-4');
  check('a legacy secret: {to} becomes exits.secret = land:aq', L84.exits.secret && L84.exits.secret.to === 'land:aq' && L84.secret === false, L84.exits);
  check('main exits default to the next level, the boss to country:next', Tour.specOf('1-1').exits.main.to === '1-2' && Tour.specOf('1-5').exits.main.to === 'country:next' && Tour.specOf('13-4').exits.main.to === null, [Tour.specOf('1-1').exits, Tour.specOf('1-5').exits]);
  check('levels know their number (n) and kind', Tour.specOf('3-5').n === 5 && Tour.specOf('3-5').kind === 'castle' && Tour.specOf('3-2').kind === 'level');
  check('isFinale and isBoss use the main count', Tour.isFinale('12-5') && !Tour.isFinale('12-4') && Tour.isBoss('13-4') && !Tour.isBoss('13-3'));
  check('WORLDS kinds mark the boss level', G.WORLDS[1].kinds[4] === 'castle' && G.WORLDS[1].mainCount === 5);
  check('exit targets parse', ['1-6', 'node:1-5', 'house:mx-tienda', 'land:aq', 'flight:ma', 'country:next', null].map(t => Tour.target(t, MX).kind).join() === 'level,node,house,land,flight,country,map', ['1-6', 'node:1-5', 'land:aq', 'flight:ma', 'country:next'].map(t => Tour.target(t, MX)));
  check('no spec problems in the registered countries', Tour.problems.length === 0, Tour.problems);
});

section('stamps', () => {
  const S = fixtures.stamps.roundtrip;
  const P = TourStamp.parse(S);
  check('a stamp parses with no problems', !P.problems.length && P.W === S.rows[0].length && P.H === S.rows.length, P.problems);
  check('the parser catches a letter that redefines the legend and an unknown letter', TourStamp.parse({ rows: ['#Z#', '###'], legend: { '#': ['decor', 'x'] } }).problems.length === 2);
  // round trip: parse -> tiles -> back to characters
  const lvl = build(fixtures.levels.roundtrip);
  const A = lvl.areas[0];
  const inv = { [T.EMPTY]: '.', [T.GROUND]: '#', [T.BRICK]: 'B', [T.QBRICK]: 'Q', [T.HARD]: 'H', [T.SEMI]: '-', [T.PILLAR]: '|', [T.SPIKES]: '^', [T.SPIKES_CEIL]: 'v', [T.LAVA]: 'L', [T.WATER]: 'W', [T.ICE]: 'I', [T.CONV_L]: '<', [T.CONV_R]: '>', [T.CRUMBLE]: 'C', [T.FAKE]: 'F', [T.SOIL]: 'S', [T.LINTEL]: 'T', [T.PICK]: 'o', [T.QBLOCK]: '?', [T.HIDDEN]: 'h' };
  const SB = { 1: 'b', 2: 'y' };
  let diff = [];
  S.rows.forEach((row, y) => {
    let out = '';
    for (let x = 0; x < row.length; x++) { const k = y * A.W + x; let c = inv[A.tiles[k]] || '?'; if (A.surf[k] && SB[A.surf[k]]) c = SB[A.surf[k]]; out += c; }
    const expect = row.replace(/[*s@GgDc]/g, '.').replace(/k/g, '.');
    if (out !== expect) diff.push([y, expect, out]);
  });
  check('a stamp round-trips: parse -> tiles -> characters', !diff.length, diff.slice(0, 3));
  const sp = t => A.spawns.filter(s => s.type === t).length;
  check('stamp spawns: spring, checkpoint, gates (main + secret), door, decor', sp('spring') === 1 && sp('checkpoint') === 1 && A.spawns.filter(s => s.type === 'gate' && s.exit === 'secret').length === 1 && A.spawns.filter(s => s.type === 'gate' && s.exit === 'main').length === 1 && sp('portal') === 1 && A.decor.length === 1, A.spawns.map(s => s.type));
  check('item and hidden blocks get their contents in reading order', Object.values(A.contents).filter(c => c === 'power').length === 1 && Object.values(A.contents).filter(c => c === 'oneup').length === 1, A.contents);
  check('the anchor @ is the start of the first area', A.anchors.start && lvl.start.x === A.anchors.start.x);
});

section('graph', () => {
  const { lvl, r } = validate(fixtures.levels.twoRooms);
  check('two rooms joined by doors build as two areas', lvl.areas.length === 2 && lvl.areas[1].aid === 'back' && lvl.areas[1].role === 'secret');
  const door = lvl.areas[0].spawns.find(s => s.type === 'portal'), back = lvl.areas[1].spawns.find(s => s.type === 'portal');
  check('door targets resolve to area@anchor', door.target && door.target.area === 1 && back.target && back.target.area === 0 && back.target.x === lvl.areas[0].anchors.porch.x, [door.target, back.target]);
  check('the validator walks through both doors, reaches both areas and both exits', r.areasReached.every(Boolean) && r.exits.main && r.exits.secret && r.gold.every(Boolean), { exits: r.exits, areas: r.areasReached, gold: r.gold });
  check('postcards are spread over the areas (P2 in the secret room)', lvl.areas[1].spawns.some(s => s.type === 'gold'), lvl.areas.map(a => a.spawns.filter(s => s.type === 'gold').length));
  const broken = build(Object.assign({}, fixtures.levels.twoRooms, { areas: [fixtures.levels.twoRooms.areas[0], Object.assign({}, fixtures.levels.twoRooms.areas[1], { id: 'elsewhere' })] }));
  check('a door to a missing area is reported', broken.problems.some(p => /no area 'back'/.test(p)), broken.problems);
  // legacy specs: one area plus bonus rooms, built exactly as before (tools/sbw_snapshot.js checks the bytes)
  // (any legacy level with a bonus room: the countries are moving to the v2 format one by one)
  const legIds = Tour.allLevelIds().filter(id => { const L = Tour.specOf(id); return !L.v2 && JSON.stringify(L.script || []).indexOf('"secret"') >= 0; });
  const l84 = legIds.length ? G.getLevel(...legIds[0].split('-').map(Number)) : null;
  check('a legacy level is one main area plus its bonus room, roles set', !l84 || (l84.areas[0].role === 'main' && l84.areas[1].role === 'secret' && !l84.v2), legIds[0] || 'none left');
});

section('guide', () => {
  const { lvl, r } = validate(fixtures.levels.guide, 6);
  check('the worked example in TOOLKIT_STATUS.md builds and validates (both exits, 3 postcards, both areas)', r.ok && r.exits.main && r.exits.secret && !lvl.problems.length, { exits: r.exits, gold: r.gold, areas: r.areasReached, problems: lvl.problems });
});

section('progress', () => {
  // a test copy of Mexico with a secret level, a house and a shortcut (this VM only)
  fresh();
  Tour.amend('mx', { houses: [{ id: 'mx-test', name: 'Test Stand', stock: ['plane'], mapCell: [2, 2], mapFrom: 2 }], levels: [
    { n: 3, name: 'Cenote Dive', style: 'swim', theme: 'mx_cenote', script: ['shaft'], exits: { secret: { to: '1-6', hint: 'bubbles' } } },
    { n: 6, name: 'Secret Pit', secret: true, style: 'run', theme: 'mx_mercado', script: ['flat'], exits: { main: { to: 'node:1-5' }, secret: { to: 'house:mx-test' } } }
  ] });
  check('amend: a secret level after the boss keeps mainCount 5', MX.mainCount === 5 && MX.levels.length === 6 && MX.levels[5].secret && Tour.isBoss('1-5') && Tour.problems.length === 0, Tour.problems);
  check('a secret level starts locked and hidden', !TourProgress.isUnlocked('1-6') && !TourProgress.isRevealed('1-6'));
  const rv = TourProgress.exit('1-3', 'secret');
  check('exit(1-3, secret) records the exit and returns a path then a stop reveal', Save.data.exits['1-3'].secret && rv.length === 2 && rv[0].kind === 'path' && rv[0].from === 2 && rv[0].to === 5 && rv[1].kind === 'stop' && rv[1].id === '1-6', rv);
  check('the secret level is unlocked by the taken exit; 1-4 is not', TourProgress.isUnlocked('1-6') && !TourProgress.isUnlocked('1-4'));
  check('reveals wait in tour.pending until the map plays them', TourProgress.data().pending.length === 2 && !TourProgress.isRevealed('1-6'));
  rv.forEach(q => TourProgress.revealDone(q));
  check('revealDone writes revealed/paths and clears the queue', TourProgress.isRevealed('1-6') && TourProgress.data().paths['mx:2>5'] && !TourProgress.data().pending.length);
  check('exitsFound(1-3) is 1 of 2', JSON.stringify(TourProgress.exitsFound('1-3')) === '{"found":1,"total":2}', TourProgress.exitsFound('1-3'));
  const sc = TourProgress.exit('1-6', 'main');
  check('a shortcut exit (node:1-5) unlocks 1-5 and draws a gold trail', TourProgress.isUnlocked('1-5') && sc.length === 1 && sc[0].kind === 'path' && sc[0].gold && sc[0].to === 4, sc);
  const hs = TourProgress.exit('1-6', 'secret');
  check('a house exit reveals the stand (path, then house)', hs.length === 2 && hs[1].kind === 'house' && hs[1].id === 'mx-test' && hs[0].to === TourProgress.stopIndex(MX, 'house:mx-test') && hs[0].to >= MX.levels.length, hs);
  hs.forEach(q => TourProgress.revealDone(q));
  check('isRevealed(house)', TourProgress.isRevealed('house:mx-test') && TourProgress.isRevealed('mx-test'));
  Save.data.done['1-6'] = true;
  const tot = TourProgress.totals();
  check('totals count revealed secret levels apart (houses never count)', tot.secretDone === 1 && tot.total === 61, tot);
  fresh();
  for (const id of ['1-1', '1-2', '1-3', '1-4', '1-5']) { Save.data.done[id] = true; TourProgress.complete(id, false); }
  check('the boss exit (country:next) opens Ecuador; bossDone uses the main count', TourProgress.bossDone(MX) && TourProgress.countryUnlocked(Tour.countries.ec) && TourProgress.isUnlocked('2-1'));
  check('countryDone ignores secret levels', TourProgress.countryDone(MX));
  fresh();
  const land = TourProgress.complete('8-4', true);
  check('legacy: the 8-4 secret gate opens Antarctica via exits', land.secretLand === 'aq' && TourProgress.countryUnlocked(Tour.countries.aq) && TourProgress.isUnlocked('13-1') && land.reveals[0].kind === 'land', land);
  fresh();
});

section('validator', () => {
  for (const [name, f] of Object.entries(fixtures.validator)) {
    const { lvl, r } = validate(f.spec);
    const got = {};
    for (const k in f.expect) {
      if (k === 'exits') got.exits = Object.keys(f.expect.exits).every(e => !!r.exits[e] === f.expect.exits[e]);
      else if (k === 'areas') got.areas = r.areasReached.every(Boolean) === f.expect.areas;
      else if (k === 'pace') got.pace = r.pace.ok === f.expect.pace;
      else if (k === 'gold') got.gold = r.gold.every(Boolean) === f.expect.gold;
      else if (k === 'held') got.held = f.expect.held.every(h => r.held.includes(h));
    }
    check(`validator fixture ${name}: ${f.what}`, Object.values(got).every(Boolean), { got, exits: r.exits, areas: r.areasReached, pace: r.pace, held: r.held, gold: r.gold, problems: lvl.problems });
  }
});

section('gens', () => {
  for (const [name, spec] of Object.entries(fixtures.gens)) {
    const { lvl, r } = validate(spec);
    const ok = r.ok && !(lvl.problems || []).some(p => !/is not defined yet/.test(p));
    check(`gen ${name}: ${lvl.areas.map(a => a.gen + ' ' + a.W + 'x' + a.H).join(' + ')} validates (exits, postcards, areas, pace)`, ok, { exits: r.exits, gold: r.gold, areas: r.areasReached, pace: r.pace, problems: lvl.problems, guard: r.guardHit });
  }
});

section('gear', () => {
  const ids = Object.keys(G.TourGear ? G.TourGear.list : {});
  for (const [name, spec] of Object.entries(fixtures.gear)) {
    const { lvl, r } = validate(spec);
    check(`gear fixture ${name} validates (gear stands are virtual keys gear:<id>)`, r.ok, { exits: r.exits, gold: r.gold, held: r.held });
  }
  const { r } = validate(fixtures.gear.stands);
  check('all ten gear stands are held keys', ['plane', 'hat', 'pads', 'magnet', 'fins', 'box', 'kazoo', 'wand', 'sundial', 'globe'].every(i => r.held.includes('gear:' + i)), r.held);
});

section('objects', () => {
  for (const [name, spec] of Object.entries(fixtures.objects)) {
    const { lvl, r } = validate(spec);
    check(`object ${name} validates`, r.ok && !(lvl.problems || []).length, { exits: r.exits, gold: r.gold, held: r.held, problems: lvl.problems });
  }
  // negative checks: without the thing that opens the way, the exit is out of reach
  const strip = (steps) => ({ name: 'neg', arch: 'lab', theme: 'mx_mercado', exits: { main: { to: null } }, areas: [{ id: 'o', gen: 'strip', script: [['flat', { n: 4 }]].concat(steps, [['postcard', { kind: 'must' }], ['postcard', { kind: 'high', dx: 2 }], ['postcard', { kind: 'risky', dx: 4 }], ['flat', { n: 6 }], ['end', { exit: 'main' }]]) }] });
  const neg = [
    ['a breakwall for the hat with no hat stand', [['breakwall', { needs: 'hat' }]]],
    ['a 12-tile pit without the ring', [(st) => { const x = st.x; st.floor(x, x + 1); st.pit(x + 2, x + 13); st.floor(x + 14, x + 16); return x + 17; }]],
    ['a lever lock without its lever', [(st) => { const x = st.x; st.floor(x, x + 8); st.B.locks.push({ id: 'L9', tiles: [[x + 6, st.gy - 1], [x + 6, st.gy - 2], [x + 6, st.gy - 3]] }); st.B.fill(x + 6, 0, x + 6, st.gy - 1, st.T.HARD); return x + 9; }]]
  ];
  for (const [what, steps] of neg) { const { r } = validate(strip(steps)); check('negative: ' + what + ' blocks the exit', !r.exits.main, r.exits); }
});

section('systems', () => {
  for (const [name, spec] of Object.entries(fixtures.systems)) {
    const { lvl, r } = validate(spec);
    check(`system ${name} validates`, r.ok && !(lvl.problems || []).length, { exits: r.exits, gold: r.gold, held: r.held, pace: r.pace, problems: lvl.problems });
  }
  // the flip band is really walked upside down: some search nodes stand on the ceiling
  { const lvl = build(fixtures.systems.flip); const r = Validator.run(lvl, { trace: true }); const up = (r.trace || []).filter(t => t[4] === 1).length; check('flip: the search stands on the ceiling inside the band', up > 5 && r.ok, { upsideDownNodes: up }); }
  const strip = (steps, extra) => ({ name: 'neg', arch: 'lab', theme: 'mx_mercado', exits: { main: { to: null } }, areas: [Object.assign({ id: 'o', gen: 'strip', script: [['flat', { n: 4 }]].concat(steps, [['postcard', { kind: 'must' }], ['postcard', { kind: 'high', dx: 2 }], ['postcard', { kind: 'risky', dx: 4 }], ['flat', { n: 6 }], ['end', { exit: 'main' }]]) }, extra || {})] });
  const wall = h => st => { const x = st.x; st.floor(x, x + 3); st.B.fill(x + 4, st.gy - h, x + 5, st.gy - 1, st.T.HARD); st.floor(x + 4, x + 12); return x + 13; };
  const neg = [
    ['a 14-tile spike floor with no flip band', [st => { const x = st.x; st.floor(x, x + 19); for (let k = x + 3; k < x + 17; k++) st.B.set(k, st.gy, st.T.SPIKES); return x + 20; }]],
    ['the tide wall with no tide', [wall(7)]],
    ['an 8-high wall with no balloon', [wall(8)]],
    ['a 6-high wall with no seesaw', [wall(6)]],
    ['the wheel pit with no wheel', [st => { const x = st.x; st.floor(x, x + 1); st.pit(x + 2, x + 12); st.floor(x + 13, x + 15); return x + 16; }]],
    ['the thief lock with no thief stops', [st => { const x = st.x; st.floor(x, x + 8); st.B.locks.push({ id: 'stamp3', tiles: [[x + 6, st.gy - 1], [x + 6, st.gy - 2], [x + 6, st.gy - 3]] }); st.B.fill(x + 6, 0, x + 6, st.gy - 1, st.T.HARD); return x + 9; }]],
    ['a fast doom (8 t/s) outruns Brady (pace)', [['flat', { n: 20 }]], { chase: { speed: 8 } }]
  ];
  for (const [what, steps, extra] of neg) { const { r } = validate(strip(steps, extra)); check('negative: ' + what + ' fails', !r.ok, { exits: r.exits, pace: r.pace }); }
  // the mirror solver: the default layout has a setting that lights the receptor
  const B = { get: () => 0 }; const sol = G.TourBeam ? G.TourBeam.solve(B, [0, 10], [[4, 10], [4, 7]], [8, 7]) : null;
  check('mirror solver finds the two angles', !!sol && sol.join() === '0,0', sol);
});

console.log(bad ? `${bad} of ${n} TOOLKIT CHECK(S) FAILED` : `ALL ${n} TOOLKIT CHECKS PASSED`);
process.exit(bad ? 1 : 0);
