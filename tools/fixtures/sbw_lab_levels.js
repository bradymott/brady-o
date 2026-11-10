// Fixture levels for the level toolkit (LEVEL_OVERHAUL.md §7): small v2 specs that exercise one generator, object,
// system or validator primitive each. Used by tools/sbw_toolkit_test.js (Node) and tools/sbw_toolkit_shots.js
// (in the browser, where this file is injected as window.SBW_LAB). Specs are built with TourBuild.fromSpec on a host
// country ('host', default Mexico) and never registered, so they don't touch the game's level list.
(function (root) {
const room = (rows, extra) => Object.assign({ floor: rows.length - 2, rows }, extra || {});
const flat = n => ['flat', { n: n || 6, coins: false }];
const LAB = { stamps: {}, levels: {}, validator: {} };

/* ---------- stamps ---------- */
LAB.stamps.roundtrip = room([
  '############################',
  '#..........................#',
  '#..o.o.o......*......*.....#',
  '#........................v.#',
  '#..?..h........*...........#',
  '#.BQB.....HHH....-----.....#',
  '#.........................|#',
  '#...k.....................|#',
  '#.@.D...s...c.....G...g...|#',
  '#bby##<<>>IICCFFSSTT^^LLWW##',
  '############################'
], { legend: { k: ['decor', 'mxPots'] }, items: ['power'], hidden: ['oneup'], doors: [{ to: 'rt@in' }], gold: { '*': 'hidden' } });
LAB.levels.roundtrip = { name: 'Stamp round trip', arch: 'lab', theme: 'mx_mercado', exits: { main: { to: null } }, areas: [{ id: 'rt', gen: 'room', stamp: LAB.stamps.roundtrip }] };

/* ---------- two rooms joined by doors ---------- */
LAB.levels.twoRooms = { name: 'Two rooms', arch: 'lab', theme: 'mx_mercado', exits: { main: { to: null }, secret: { to: 'house:mx-lab', hint: 'a door' } },
  areas: [
    { id: 'front', gen: 'room', stamp: room([
      '##############################',
      '#............................#',
      '#..........*.........*.......#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#..@.....D....p.......G......#',
      '##############################',
      '##############################'
    ], { legend: { p: ['anchor', 'porch'] }, doors: [{ to: 'back@in', look: 'tourDoor' }], gold: { '*': 'must' } }) },
    { id: 'back', gen: 'room', role: 'secret', stamp: room([
      '############################',
      '#..........................#',
      '#.........*................#',
      '#......-----...............#',
      '#..........................#',
      '#..........................#',
      '#..@..D.............g......#',
      '############################',
      '############################'
    ], { doors: [{ to: 'front@porch' }], gold: { '*': 'hidden' } }) }
  ] };

/* ---------- validator primitives ---------- */
const v = (what, spec, expect) => ({ what, spec: Object.assign({ name: what, arch: 'lab', theme: 'mx_mercado', exits: { main: { to: null } } }, spec), expect });
const oneRoom = (rows, extra, areaExtra) => ({ areas: [Object.assign({ id: 'r', gen: 'room', stamp: room(rows, extra) }, areaExtra || {})] });
const lockRows = k => [
  '##############################',
  '#.................l..........#',
  '#.................l..........#',
  '#.................l..........#',
  '#.................l..........#',
  '#.................l..........#',
  '#.................l..........#',
  '#.@...' + k + '..*..*..*..l....G.....#',
  '##############################',
  '##############################'
];
LAB.validator.vkeyLock = v('a lever (virtual key) opens a lock', oneRoom(lockRows('k'), { legend: { k: ['vkey', 'lever1'], l: ['lock', 'lever1'] } }), { exits: { main: true }, held: ['lever1'] });
LAB.validator.lockShut = v('without the lever the lock stays shut', oneRoom(lockRows('.'), { legend: { l: ['lock', 'lever1'] } }), { exits: { main: false } });
// an edge: a catapult-like jump from the floor to a ledge far too high to jump to
const edgeStrip = withEdge => ({ areas: [{ id: 's', gen: 'strip', H: 18, script: [
  flat(6),
  (st, o) => { const x = st.x; st.floor(x, x + 12); st.B.fill(x + 6, st.gy - 12, x + 12, st.gy - 12, st.T.GROUND); st.B.fill(x + 6, st.gy - 11, x + 12, st.gy - 1, st.T.HARD);
    if (withEdge) st.B.edge([x + 2, st.gy - 1], [x + 8, st.gy - 12]); st.B.spawn('gate', x + 10, st.gy - 13, { exit: 'main' }); st.gold(x + 1, st.gy - 2); st.gold(x + 3, st.gy - 2); st.gold(x + 4, st.gy - 2); return x + 13; }
] }] });
LAB.validator.edge = v('a one-way edge (zip line, catapult) reaches a high ledge', edgeStrip(true), { exits: { main: true } });
LAB.validator.noEdge = v('without the edge the ledge is out of reach', edgeStrip(false), { exits: { main: false } });
// a toggle group: state 1 bridges a pit too wide to jump
const toggleStrip = (sw, auto) => ({ areas: [{ id: 's', gen: 'strip', script: [
  flat(6),
  (st, o) => { const x = st.x; st.floor(x, x + 3); st.pit(x + 4, x + 13); st.B.toggle(0, [], [[x + 4, st.gy, x + 13, st.gy]], { auto: !!auto, kind: 'valve' }); if (sw) st.B.switchAt(0, x + 2, st.gy - 1); st.floor(x + 14, x + 19); st.gold(x + 1, st.gy - 2); st.gold(x + 2, st.gy - 2); st.gold(x + 3, st.gy - 2); return x + 20; },
  ['gate', {}]
] }] });
LAB.validator.toggle = v('a switch flips a toggle group and the bridge appears', toggleStrip(true), { exits: { main: true } });
LAB.validator.toggleAuto = v('an automatic toggle (tide, timed phase) flips by itself', toggleStrip(false, true), { exits: { main: true } });
LAB.validator.toggleNone = v('no switch, no bridge', toggleStrip(false), { exits: { main: false } });
// a crawlway: only with the knee pads (vkey gear:pads)
const crawlRows = p => [
  '##############################',
  '#..........######............#',
  '#..........######............#',
  '#..........######............#',
  '#..........######............#',
  '#..........######............#',
  '#..........######............#',
  '#..........TTTTTT............#',
  '#.@.' + p + '...*..........*.*..G....#',
  '##############################',
  '##############################'
];
LAB.validator.crawl = v('a crawlway with the knee pads', oneRoom(crawlRows('p'), { legend: { p: ['vkey', 'gear:pads'] } }), { exits: { main: true }, held: ['gear:pads'] });
LAB.validator.crawlNoPads = v('a crawlway without them is shut', oneRoom(crawlRows('.')), { exits: { main: false } });
// carry physics: lower jumps until the item is delivered
const carryStrip = deliver => ({ areas: [{ id: 's', gen: 'strip', carry: { item: 'egg', jumpMul: 0.6 }, script: [
  flat(6),
  (st, o) => { const x = st.x; st.floor(x, x + 4); if (deliver) st.B.vkey('deliver', [[x + 1, st.gy - 1]]); st.gold(x + 2, st.gy - 2); st.gold(x + 3, st.gy - 2); st.gold(x + 4, st.gy - 2); st.gy -= 3; st.floor(x + 5, x + 10); return x + 11; },
  ['gate', {}]
] }] });
LAB.validator.carryDelivered = v('carrying: a delivery before the step restores full jumps', carryStrip(true), { exits: { main: true } });
LAB.validator.carryHeavy = v('carrying: lower jumps miss a 3-tile step', carryStrip(false), { exits: { main: false } });
// pace against a chaser
const paceStrip = speed => ({ areas: [{ id: 's', gen: 'strip', chase: { speed }, script: [flat(20), flat(20), ['gate', {}]] }] });
LAB.validator.paceOk = v('a slow chaser: the route beats it by 25 %', paceStrip(2), { exits: { main: true }, pace: true });
LAB.validator.paceFail = v('a chaser faster than Brady fails the pace check', paceStrip(12), { pace: false });
// light-only tiles (hide 3) count as there: the light is always obtainable
LAB.validator.lightOnly = v('light-only platforms count as present', oneRoom([
  '##############################',
  '#............................#',
  '#............................#',
  '#.......................G....#',
  '#..................#########.#',
  '#..............zz............#',
  '#..........zz................#',
  '#......zz....................#',
  '#.@..*..*..*.................#',
  '##############################',
  '##############################'
], { legend: { z: ['tile', 'SEMI', { hide: 3 }] } }), { exits: { main: true } });
// dig down through soil to a cavern
const digRows = s => [
  '##############################',
  '#............................#',
  '#.@.....*..*..*..............#',
  '###' + s + s + s + s + '#######################',
  '#............................#',
  '#............................#',
  '#............................#',
  '#...................G........#',
  '##############################',
  '##############################'
];
LAB.validator.dig = v('soil: dig down into the cavern', oneRoom(digRows('S')), { exits: { main: true } });
LAB.validator.noDig = v('rock does not dig', oneRoom(digRows('#')), { exits: { main: false } });

if (typeof module !== 'undefined' && module.exports) module.exports = LAB; else root.SBW_LAB = LAB;
})(typeof window !== 'undefined' ? window : this);
