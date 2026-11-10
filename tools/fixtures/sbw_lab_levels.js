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

/* ---------- the worked example in docs/design/TOOLKIT_STATUS.md (keep the two in step) ---------- */
LAB.levels.guide = {
  n: 6, name: 'Guide Alley', arch: 'parade', secret: true, theme: 'mx_mercado',
  gimmick: 'A street, a hatch to a cellar, a fake wall to a secret gate',
  hint: 'Stomp the crate on the hatch, then press down',
  enemies: [['mxPepper', 2], ['mxElote', 1]],
  mapCell: [2, 2], mapFrom: 2,
  exits: { main: { to: 'node:1-5' }, secret: { to: 'house:mx-tienda', hint: 'Chili dust puffs from a crate...' } },
  areas: [
    { id: 'street', gen: 'strip', script: [
      ['itemBlock', { item: 'power', y: 4 }],
      ['stalls', { n: 2 }],
      ['postcard', { kind: 'must', dy: -9 }],
      'gap',
      ['trapdoor', { to: 'cellar@in', crate: true, back: 'cellarBack' }],
      ['enemies', { n: 2 }],
      'cp',
      ['spring', {}],
      ['end', { exit: 'main' }]
    ] },
    { id: 'cellar', gen: 'room', role: 'secret', stamp: {
      floor: 9,
      rows: [
        '##############################',
        '#.............#..............#',
        '#..o.o.o......#....o.o.o.....#',
        '#.............#..............#',
        '#....*........#..............#',
        '#..-----......F..............#',
        '#.............F..............#',
        '#......?......F..............#',
        '#.@..D....k...F.......g......#',
        '##############################'
      ],
      legend: { k: ['decor', 'mxPots'] }, items: ['oneup'], doors: [{ to: 'street@cellarBack' }], gold: { '*': 'hidden' } } }
  ]
};

/* ---------- one fixture per generator (W8) ---------- */
const lv = (name, areas, extra) => Object.assign({ name, arch: 'lab', theme: 'mx_mercado', enemies: [['mxPepper', 2], ['mxElote', 1]], exits: { main: { to: null } }, areas }, extra || {});
LAB.gens = {};
LAB.gens.layered = lv('Layered lanes', [
  { id: 'lanes', gen: 'layered', W: 150, H: 30, lanes: { roof: 12, street: 21, cellar: 27 }, script: [
    ['itemBlock', { lane: 'street', item: 'power', y: 4 }],
    ['stalls', { lane: 'street', n: 2 }],
    ['flat', { lane: 'roof', n: 14 }], ['gap', { lane: 'roof', n: 3 }], ['flat', { lane: 'roof', n: 8 }],
    ['flat', { lane: 'cellar', n: 20 }], ['enemies', { lane: 'cellar', n: 1 }],
    ['trapdoor', { lane: 'street', to: 'cellarRoom@in', crate: true, back: 'roomBack' }],
    ['sync'],
    ['postcard', { lane: 'roof', kind: 'must', dy: -3 }],
    ['spring', { lane: 'street', gold: false }],
    ['flat', { lane: 'cellar', n: 12 }],
    ['sync'],
    ['end', { lane: 'street', exit: 'main' }]
  ] },
  { id: 'cellarRoom', gen: 'room', role: 'secret', stamp: room([
    '##############################',
    '#............................#',
    '#.......*....................#',
    '#.....-----.......o.o.o......#',
    '#............................#',
    '#............................#',
    '#.@.......D...........g......#',
    '##############################',
    '##############################'
  ], { doors: [{ to: 'lanes@roomBack' }], gold: { '*': 'hidden' } }) }
], { exits: { main: { to: null }, secret: { to: 'house:mx-lab' } } });
LAB.gens.islands = lv('Sky islands', [{ id: 'sky', gen: 'islands', W: 140, H: 26, script: [['itemBlock', { item: 'power' }], 'floating', ['flat', { n: 6 }], 'mover', ['postcard', { kind: 'must', dy: -4 }], 'gap', 'fallers', ['flat', { n: 8 }], 'end'] }]);
LAB.gens.shaft = lv('Freefall shaft', [{ id: 'pit', gen: 'shaft', W: 22, H: 120 }]);
LAB.gens.riseScroll = lv('Rising climb (camera)', [{ id: 'up', gen: 'rise', W: 28, H: 80, rise: { speed: 0.5, delay: 3 }, script: [['blockBand', { item: 'power' }], ['zigzag', { n: 4 }], ['zigzag', { n: 4, flip: true, gold: true }], ['zigzag', { n: 4, crumble: true }], ['zigzag', { n: 4, flip: true }], ['zigzag', { n: 4 }]] }]);
LAB.gens.riseFlood = lv('Rising flood', [{ id: 'up', gen: 'rise', W: 28, H: 80, risingWater: { speed: 0.4, delay: 4 }, script: [['blockBand', { item: 'power' }], ['zigzag', { n: 4 }], ['zigzag', { n: 4, flip: true, gold: true }], ['zigzag', { n: 4 }], ['zigzag', { n: 4, flip: true }], ['zigzag', { n: 4 }]] }]);
LAB.gens.maze = lv('Maze', [{ id: 'maze', gen: 'maze', cells: [3, 2], links: [{ from: [0, 0], to: [1, 0], kind: 'door' }, { from: [1, 0], to: [1, 1], kind: 'drop' }, { from: [1, 1], to: [2, 1], kind: 'door' }, { from: [2, 1], to: [2, 0], kind: 'oneway' }, { from: [2, 0], to: [0, 1], kind: 'door', at: [12, 11] }],
  script: [[room(['##########################', '#........................#', '#........................#', '#..?.....................#', '#........................#', '#........................#', '#......*.................#', '#....-----...............#', '#........................#', '#........................#', '#........................#', '#..@.....................#', '##########################', '##########################'], { items: ['power'], gold: { '*': 'must' } })],
    [null, null, room(['##########################', '#........................#', '#........................#', '#........................#', '#........................#', '#........*...............#', '#.....-------............#', '#........................#', '#........................#', '#........................#', '#.................G......#', '#........................#', '##########################', '##########################'], { gold: { '*': 'high' } })]] }]);
LAB.gens.rail = lv('Branching rail', [{ id: 'rail', gen: 'rail', len: 150, decks: { upper: 6, lower: 11 }, script: [['coinsRow', { n: 8 }], ['fork', { len: 36, upper: [['coinsRow', { n: 10 }]], lower: [['coinsRow', { n: 10 }]] }], ['coinsRow', { n: 6 }], ['fork', { len: 30 }]] }]);
LAB.gens.dig = lv('Dig down', [{ id: 'earth', gen: 'dig', W: 90, H: 30, script: [['itemBlock', { item: 'power' }], ['cavern', { w: 10, h: 4, gold: 'must' }], ['rockBand', { w: 6 }], ['pocket', { item: 'oneup' }], ['cavern', { w: 12, h: 4, dy: 6, gold: 'risky' }]] }]);
LAB.gens.arena = lv('Arena', [
  { id: 'lead', gen: 'strip', script: [['itemBlock', { item: 'power' }], ['flat', { n: 10 }], ['postcard', { kind: 'must' }], 'gap', ['spring', {}], ['flat', { n: 6 }], ['postcard', { kind: 'risky', dy: -4 }], ['door', { to: 'boss@in', perch: 0 }]] },
  { id: 'boss', gen: 'arena', role: 'arena', layout: 'fiesta', arenaW: 26, theme: 'mx_hacienda' }
], { boss: 'mx_pinata', arch: 'lair' });
LAB.gens.facade = lv('Facade climb', [{ id: 'wall', gen: 'climb', variant: 'facade', W: 34, H: 70, script: [['blockBand', { item: 'power' }], ['zigzag', { n: 3 }], ['waterfall', { h: 10 }], ['zigzag', { n: 4, flip: true, gold: true }], ['gondola', { rise: 8 }], ['zigzag', { n: 4 }]] }]);

/* ---------- gear (W12): a street of gear stands, and a crawlway that needs the knee pads ---------- */
LAB.gear = {};
LAB.gear.stands = lv('Gear street', [{ id: 'gear', gen: 'strip', script: [
  ['gearStand', { item: 'plane' }], flat(3), ['gearStand', { item: 'hat' }], flat(3), ['gearStand', { item: 'pads' }], flat(3), ['gearStand', { item: 'magnet' }], flat(3), ['gearStand', { item: 'fins' }],
  flat(3), ['gearStand', { item: 'box' }], flat(3), ['gearStand', { item: 'kazoo' }], flat(3), ['gearStand', { item: 'wand' }], flat(3), ['gearStand', { item: 'sundial' }], flat(3), ['gearStand', { item: 'globe' }],
  ['postcard', { kind: 'must' }], ['enemies', { n: 3 }], ['postcard', { kind: 'high', dy: -4 }], 'gap', ['postcard', { kind: 'risky', dy: -2 }], flat(8), ['end', { exit: 'main' }]
] }]);
LAB.gear.crawl = lv('Crawl with pads', [{ id: 'tunnel', gen: 'room', stamp: room([
  '##############################',
  '#..........######............#',
  '#..........######............#',
  '#..........######............#',
  '#..........######............#',
  '#..........######............#',
  '#..........######............#',
  '#..........TTTTTT............#',
  '#.@.p...*..........*.*..G....#',
  '##############################',
  '##############################'
], { legend: { p: ['gear', 'pads'] } }) }]);

/* ---------- the object library (W10): one small level per object ---------- */
const P3 = [['postcard', { kind: 'must', dy: -2 }], flat(3), ['postcard', { kind: 'high', dy: -2 }], flat(3), ['postcard', { kind: 'risky', dy: -2 }]];
const obj = (name, steps, extra) => lv(name, [Object.assign({ id: 'o', gen: 'strip', script: [flat(4)].concat(steps, P3, [flat(6), ['end', { exit: 'main' }]]) }, extra || {})]);
LAB.objects = {
  keyLock: obj('Key and lock', [['keyLock', { id: 'k1', keyAt: 3, lockAt: 9 }]]),
  lever: obj('Lever', [['lever', { opens: 'L1', lockAt: 6 }]]),
  timedDoor: obj('Timed door', [['timedDoor', { lever: 1, door: 8, t: 6 }]]),
  toggleBridge: obj('Toggle bridge', [['toggle', { g: 0, kind: 'valve', bridge: 8 }]]),
  toggleWall: obj('Toggle wall', [['toggle', { g: 0, kind: 'switch', wall: 4 }]]),
  valve: lv('Valve', [{ id: 'o', gen: 'strip', script: [flat(4)].concat(P3, [['valve', { g: 1, low: 17, high: 6 }], (st, o) => { const x = st.x; st.floor(x, x + 4); st.B.fill(x + 5, 5, x + 9, 5, st.T.GROUND); st.B.fill(x + 10, 0, x + 10, st.gy - 1, st.T.HARD); st.floor(x + 5, x + 10); st.B.spawn('gate', x + 8, 4, { exit: 'main' }); return x + 11; }]) }]),
  plate: obj('Plate and crate', [['plate', { opens: 'P1', crateDx: -4, lockAt: 4 }]]),
  zip: obj('Zip line', [['zip', { dx: 14, dy: 3 }]]),
  catapult: obj('Catapult', [['catapult', { to: [12, -4] }]]),
  ring: obj('Ring', [['ring', { len: 4, w: 12 }]]),
  fan: obj('Fan', [['fan', { w: 2, h: 10 }], (st, o) => { const x = st.x; st.B.fill(x - 4, st.gy - 8, x + 2, st.gy - 8, st.T.SEMI); st.floor(x, x + 2); st.B.fill(x + 3, st.gy - 9, x + 6, st.gy - 1, st.T.HARD); st.floor(x + 3, x + 10); return x + 11; }]),
  fanToggle: obj('Fan on a switch', [['toggle', { g: 0, kind: 'wind' }], ['fan', { w: 2, h: 10, g: 0 }], (st, o) => { const x = st.x; st.B.fill(x - 4, st.gy - 8, x + 2, st.gy - 8, st.T.SEMI); st.floor(x, x + 2); st.B.fill(x + 3, st.gy - 9, x + 6, st.gy - 1, st.T.HARD); st.floor(x + 3, x + 10); return x + 11; }]),
  breakwallHat: obj('Wall for the hard hat', [['gearStand', { item: 'hat' }], flat(2), ['breakwall', { needs: 'hat', h: 3 }]]),
  breakwallBig: obj('Wall for big Brady', [['itemBlock', { item: 'power' }], flat(2), ['breakwall', { needs: 'big', h: 3 }]]),
  teleport: obj('Teleport pair', [['teleport', { pair: 'a' }], (st, o) => { const x = st.x; st.floor(x, x + 3); st.B.fill(x + 1, 0, x + 2, st.gy - 1, st.T.HARD); return x + 4; }, ['teleport', { pair: 'a' }]]),
  surfaces: obj('Surfaces', [['belt', { dir: 1, n: 8 }], ['iceRun', { n: 8 }], ['honey', { n: 6 }], ['bouncePad', { gold: false }], ['crumbleRow', { n: 5 }]]),
  gimmicks: obj('Gimmicks', [['geyser', {}], ['pancake', {}], ['bubbler', {}], ['roller', {}], ['barrel', {}], ['laser', {}], ['sweeper', { len: 3 }], ['subwoofer', {}], ['horn', {}], ['poiring', {}], ['dropper', {}], ['banner', { len: 3 }], ['discoball', { len: 3 }], ['jellypad', {}]])
};

if (typeof module !== 'undefined' && module.exports) module.exports = LAB; else root.SBW_LAB = LAB;
})(typeof window !== 'undefined' ? window : this);
