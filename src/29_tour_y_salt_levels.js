/* ============================================================
   THE TABLE SALT SEA: the stages (world 34) and the land's map. Five stages, each a new kind of play, taught where a
   slip costs nothing, tested, then twisted; the last one is the boss.
   34-1 ANGLE OF REPOSE (repose), 34-2 GRAIN ELEVATOR (brinefloat), 34-3 CRYSTAL HABIT (cubegrow), 34-4 THE SHAKER TEST
   (shakercap), 34-5 SEASON TO TASTE (lair: A Pinch, the cork who considers himself a chef). Each stage's one secret
   room is behind the land's one tell: a single cobalt grain of salt that twinkles (the only blue grain in the land).
   ============================================================ */
(function () {
const C = Tour.countries.salt;
if (!C) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length) Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const pit = (Gr, x0, x1) => fillG(Gr, x0, 0, x1, Gr.length - 1, '.');
const rowsOf = Gr => Gr.map(r => r.join(''));
const stamps = {};
const SIGN = text => ['spawn', 'sign', { text }];
const GRAIN = o => ['piece', 'salt.grain', o || {}];
const ENEMY = { r: ['enemy', 'saltShrimp'], f: ['enemy', 'saltWren'], j: ['enemy', 'saltWeevil'], l: ['enemy', 'saltLick'] };
// a secret room's stand-in stamp (the room kind builds its own place from it): its door out, its prize
const roomStamp = (out, look, items) => ({ floor: 12, rows: [
  '############################', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#.@..D..................?..#',
  '############################', '############################'], items: items || ['oneup'], doors: [{ to: out, look: look || 'saltHatch' }] });
const DOOR = (to, look) => ['spawn', 'portal', { kind: 'door', look: look || 'saltCellar', targetRef: to }];

/* ---------------- 34-1 Angle of Repose ---------------- */
// the tread's top is row 18. ① the teach: a heap by a notch (nothing else about); ② crystal stair-steps up to a high
// plateau with a heap and a notch in it; above the plateau a climb of ledges to a high cellar door (the cobalt grain on
// its sill: room B41); ③ the last heap with two notches (stop at the first one's FULL line), the end
const flatRows = (() => {
  const W = 200, H = 22, Gr = grid(W, H, '.');
  ground(Gr, 0, 20, 18); put(Gr, 3, 17, '@'); put(Gr, 6, 17, 'k'); put(Gr, 10, 14, '?'); put(Gr, 16, 17, '1'); put(Gr, 21, 18, 'n');
  ground(Gr, 30, 52, 18); put(Gr, 31, 17, 'c'); put(Gr, 34, 13, '*'); put(Gr, 31, 15, 'o.o.o'); put(Gr, 44, 17, 'r'); put(Gr, 38, 17, 'x');
  // crystal stair-steps up to the plateau (row 13)
  put(Gr, 48, 16, '--'); put(Gr, 51, 14, '--'); ground(Gr, 53, 74, 13); ground(Gr, 84, 92, 13);
  put(Gr, 60, 9, '?'); put(Gr, 58, 12, 'f'); put(Gr, 69, 12, '2'); put(Gr, 75, 13, 'm'); put(Gr, 87, 12, 'r');
  // the climb to the high door (B41) from the plateau's left end
  put(Gr, 55, 10, '--'); put(Gr, 58, 7, '--'); fillG(Gr, 61, 4, 66, 4, 'H'); put(Gr, 63, 3, 'A'); put(Gr, 65, 3, 'u'); put(Gr, 61, 2, 'o.o');
  put(Gr, 86, 9, 'o.o.o');
  // down to the tread, ③
  put(Gr, 92, 12, '.'); ground(Gr, 93, 120, 18); put(Gr, 94, 16, '-'); put(Gr, 100, 17, 'c'); put(Gr, 104, 17, 'a'); put(Gr, 108, 17, 'j'); put(Gr, 112, 14, '?');
  put(Gr, 118, 17, '3'); put(Gr, 123, 18, 'p'); ground(Gr, 129, 133, 18); put(Gr, 134, 18, 'q'); ground(Gr, 143, W - 1, 18);
  put(Gr, 115, 17, 'K'); put(Gr, 138, 13, 'R'); put(Gr, 130, 15, 'o.o');
  put(Gr, 146, 17, 'l'); put(Gr, 152, 17, 'c'); put(Gr, 158, 16, 'HH'); put(Gr, 158, 15, 'HH'); put(Gr, 161, 13, '--'); put(Gr, 164, 10, '--'); put(Gr, 165, 8, 'P');
  put(Gr, 170, 17, 'r'); put(Gr, 176, 17, 'j'); put(Gr, 172, 14, 'o.o.o'); put(Gr, 182, 17, 'x'); put(Gr, 190, 17, 'G');
  fillG(Gr, W - 1, 0, W - 1, 17, 'H');
  // the notches' pits (the pieces lay their hidden floors)
  pit(Gr, 21, 29); fillG(Gr, 75, 13, 83, H - 1, '.'); pit(Gr, 123, 128); pit(Gr, 134, 142);
  put(Gr, 21, 18, 'n'); put(Gr, 75, 13, 'm'); put(Gr, 123, 18, 'p'); put(Gr, 134, 18, 'q');
  return rowsOf(Gr);
})();
const FLAT = Object.assign({}, ENEMY, {
  k: SIGN('A SALT HEAP! STAND ON ITS GOLD RING AND HOLD RUN: THE TOP LAYER SLIDES DOWN INTO THE NOTCH'),
  K: SIGN('THIS HEAP FEEDS TWO NOTCHES. LET GO OF RUN WHEN THE FIRST ONE IS FULL, THEN SCUFF AGAIN'),
  x: ['decor', 'saltCellarProp'],
  '1': ['piece', 'salt.heap', { notches: ['n1'], cap: 1.6 }], n: ['piece', 'salt.notch', { w: 9, id: 'n1' }],
  '2': ['piece', 'salt.heap', { notches: ['n2'], cap: 1.6 }], m: ['piece', 'salt.notch', { w: 9, id: 'n2' }],
  '3': ['piece', 'salt.heap', { notches: ['n3', 'n4'], cap: 2.6 }], p: ['piece', 'salt.notch', { w: 6, id: 'n3' }], q: ['piece', 'salt.notch', { w: 9, id: 'n4' }],
  A: DOOR('kettle@in'), u: GRAIN(), a: ['anchor', 'kettleOut']
});
stamps.saltFlat = { floor: 18, rows: flatRows, legend: FLAT, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power', 'power'] };
stamps.saltKettle = roomStamp('flats@kettleOut', 'saltHatch');
const L1 = { n: 1, name: 'Angle of Repose', mapLabel: 'Angle of Repose', arch: 'repose', theme: 'salt_flats',
  gimmick: 'Salt heaps beside notches in the tread: hold RUN on a heap\'s gold ring to scuff its top layer downhill into the notch, until it is full to the line and sets hard. The last heap feeds two notches',
  hint: 'Hold RUN on the ring. The last heap has only just enough: let go when the first notch reaches its FULL line, then scuff again. A blue grain twinkles on a high sill...',
  postcard: 'Brady! I scuffed a heap of salt into a hole and walked across it. The heap looked a bit put out. It said it was resting at its natural angle. ♥ C',
  enemies: [['saltShrimp', 3], ['saltWeevil', 2], ['saltWren', 1], ['saltLick', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '34-2' } },
  areas: [
    { id: 'flats', gen: 'room', theme: 'salt_flats', stamp: 'saltFlat', camera: 'free', bottomKill: true },
    { id: 'kettle', gen: 'room', role: 'secret', theme: 'salt_room_kettle', stamp: 'saltKettle', room: 'saltKettle' }
  ] };

/* ---------------- 34-2 Grain Elevator ---------------- */
// floors on row 18. ① the teach: a spoon by a basin that floats its cork with one dose; ② a basin that needs two
// doses; a cobalt cellar block whose left face is only glass paint (the grain on top: room B42 inside); ③ a lick by
// the spoon of a wide basin, a climb to a high postcard; ④ the last basin, with a low lip and a spoon under a shaker
// that tips again by itself: board the half-floating cork before it does
const seaRows = (() => {
  const W = 200, H = 22, Gr = grid(W, H, '.');
  ground(Gr, 0, 19, 18); put(Gr, 3, 17, '@'); put(Gr, 6, 17, 'k'); put(Gr, 10, 14, '?'); put(Gr, 17, 17, '1'); pit(Gr, 20, 28); put(Gr, 20, 18, 'N');
  ground(Gr, 29, 43, 18); put(Gr, 32, 17, 'c'); put(Gr, 36, 13, '*'); put(Gr, 33, 15, 'o.o.o'); put(Gr, 38, 17, 'r'); put(Gr, 41, 17, '2'); pit(Gr, 44, 53); put(Gr, 44, 18, 'd');
  ground(Gr, 54, 92, 18); put(Gr, 57, 17, 'K'); put(Gr, 70, 14, '?'); put(Gr, 74, 17, 'j');
  // the cellar block with its painted-glass left face (B42 inside)
  fillG(Gr, 62, 15, 67, 17, 'H'); fillG(Gr, 63, 16, 66, 17, '.'); fillG(Gr, 62, 16, 62, 17, 'F'); put(Gr, 65, 17, 'A'); put(Gr, 64, 14, 'u');
  put(Gr, 80, 17, 'x'); put(Gr, 84, 17, 'c'); put(Gr, 88, 17, 'a'); put(Gr, 86, 14, 'f');
  put(Gr, 91, 17, '3'); put(Gr, 89, 17, 'l'); pit(Gr, 94, 105); put(Gr, 94, 18, 'e');
  ground(Gr, 106, 150, 18); put(Gr, 110, 17, 'r'); put(Gr, 114, 16, '-'); put(Gr, 117, 13, '--'); put(Gr, 120, 10, '--'); put(Gr, 121, 8, 'P'); put(Gr, 125, 14, '?'); put(Gr, 128, 17, 'j');
  put(Gr, 136, 17, 'c'); put(Gr, 140, 17, 'Z'); put(Gr, 144, 14, 'f');
  put(Gr, 148, 17, '4'); pit(Gr, 151, 163); put(Gr, 151, 18, 'M'); put(Gr, 157, 13, 'R');
  ground(Gr, 164, W - 1, 18); put(Gr, 168, 15, 'o.o.o'); put(Gr, 174, 17, 'r'); put(Gr, 180, 17, 'x'); put(Gr, 190, 17, 'G');
  fillG(Gr, W - 1, 0, W - 1, 17, 'H');
  return rowsOf(Gr);
})();
const SEA = Object.assign({}, ENEMY, {
  k: SIGN('JUMP ON THE SALT SPOON: IT TIPS A DOSE INTO THE BRINE. THICK ENOUGH, THE CORK FLOATS UP: RIDE IT ACROSS'),
  K: SIGN('THIS BRINE NEEDS TWO DOSES. WATCH THE GAUGE ON THE BASIN WALL'),
  Z: SIGN('THE LAST SPOON REFILLS AND TIPS BY ITSELF. GET ON THE CORK BEFORE IT DOES, OR IT FLOATS OFF'),
  x: ['decor', 'saltCellarProp'],
  N: ['piece', 'salt.basin', { id: 'b1', w: 9, d: 4, need: 1 }], '1': ['piece', 'salt.spoon', { basin: 'b1' }],
  d: ['piece', 'salt.basin', { id: 'b2', w: 10, d: 4, need: 2 }], '2': ['piece', 'salt.spoon', { basin: 'b2' }],
  e: ['piece', 'salt.basin', { id: 'b3', w: 12, d: 4, need: 2 }], '3': ['piece', 'salt.spoon', { basin: 'b3' }],
  M: ['piece', 'salt.basin', { id: 'b4', w: 13, d: 4, need: 1, lip: true }], '4': ['piece', 'salt.spoon', { basin: 'b4', auto: 2.6 }],
  A: DOOR('lamps@in'), u: GRAIN(), a: ['anchor', 'lampsOut']
});
stamps.saltSea = { floor: 18, rows: seaRows, legend: SEA, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power'] };
stamps.saltLamps = roomStamp('sea@lampsOut', 'saltHatch');
const L2 = { n: 2, name: 'Grain Elevator', mapLabel: 'Grain Elevator', arch: 'brinefloat', theme: 'salt_sea',
  gimmick: 'Basins of brine with a weighted cork asleep in a cradle at the bottom: jump on the salt spoon to tip a dose in, thicken the brine until the cork floats up, then ride it across. The last spoon refills itself',
  hint: 'The gauge on the basin wall shows the doses: gold means it floats. On the last basin get on the half-floating cork before the spoon tips again. A blue grain sits on top of a glass block...',
  postcard: 'Brady! I salted a pond until a cork came up for air, and then it gave me a lift. I tipped it nothing. It seemed to expect that. ♥ C',
  enemies: [['saltShrimp', 3], ['saltWeevil', 2], ['saltWren', 2], ['saltLick', 1]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '34-3' } },
  areas: [
    { id: 'sea', gen: 'room', theme: 'salt_sea', stamp: 'saltSea', camera: 'free', bottomKill: true },
    { id: 'lamps', gen: 'room', role: 'secret', theme: 'salt_room_lamps', stamp: 'saltLamps', room: 'saltLamps' }
  ] };

/* ---------------- 34-3 Crystal Habit ---------------- */
// floors on row 18. ① the teach: a little crystal at a cliff's edge grows a bridge across; ② a crystal that grows
// straight up (an elevator: each cube lifts Brady) to a high shelf, a bridge from a crystal on a pillar; ③ an
// optional crystal elevator to a high sill (the grain on it: room B43's cellar door); ④ the corner: a glass beam
// overhead stops the bridge, so it grows down from the tip and on, lower; the brine rises in the trough below
const caveRows = (() => {
  const W = 200, H = 22, Gr = grid(W, H, '.');
  ground(Gr, 0, 19, 18); put(Gr, 3, 17, '@'); put(Gr, 6, 17, 'k'); put(Gr, 10, 14, '?'); put(Gr, 19, 17, '1'); pit(Gr, 20, 28);
  ground(Gr, 29, 52, 18); put(Gr, 30, 17, 'c'); put(Gr, 34, 13, '*'); put(Gr, 31, 15, 'o.o.o'); put(Gr, 40, 17, 'r'); put(Gr, 46, 17, 'K');
  // ② the elevator crystal up to the shelf (row 12), the shelf, a pillar crystal bridging down the far side
  put(Gr, 50, 17, '2'); ground(Gr, 51, 64, 12); put(Gr, 56, 11, 'f'); put(Gr, 58, 8, '?'); put(Gr, 64, 11, '3'); pit(Gr, 65, 73); ground(Gr, 74, 96, 12);
  put(Gr, 78, 11, 'j'); put(Gr, 81, 11, 'c');
  // ③ the optional elevator to the high sill (B43)
  put(Gr, 88, 11, '4'); fillG(Gr, 89, 5, 94, 5, 'H'); put(Gr, 92, 4, 'A'); put(Gr, 94, 4, 'u'); put(Gr, 90, 3, 'o.o');
  put(Gr, 96, 11, '.'); ground(Gr, 97, 140, 18); put(Gr, 99, 17, 'a'); put(Gr, 104, 17, 'l'); put(Gr, 110, 14, '?'); put(Gr, 114, 17, 'r'); put(Gr, 120, 17, 'c');
  put(Gr, 126, 16, '--'); put(Gr, 129, 14, '--'); put(Gr, 132, 11, '--'); put(Gr, 133, 9, 'P'); put(Gr, 136, 17, 'Z'); put(Gr, 138, 15, '---');
  // ④ the corner: the cliff (row 13) from 141, the stem at its edge, the beam overhead past the tip, the trough below
  ground(Gr, 141, 150, 13); put(Gr, 144, 12, 'j'); put(Gr, 150, 12, '5'); fillG(Gr, 155, 8, 163, 12, 'H'); pit(Gr, 151, 160); put(Gr, 157, 13, 'R');
  ground(Gr, 161, W - 1, 16); put(Gr, 166, 15, 'o.o.o'); put(Gr, 172, 15, 'r'); put(Gr, 178, 15, 'c'); put(Gr, 184, 15, 'x'); put(Gr, 190, 15, 'G');
  fillG(Gr, W - 1, 0, W - 1, 15, 'H');
  return rowsOf(Gr);
})();
const CAVE = Object.assign({}, ENEMY, {
  k: SIGN('A SALT CRYSTAL! STAND ON IT AND HOLD THROW: A NEW CUBE GROWS WHERE THE DASHED SQUARE IS'),
  K: SIGN('SOME CRYSTALS GROW UP. A CUBE GROWING UNDER YOU LIFTS YOU WITH IT'),
  Z: SIGN('THE LAST ONE TURNS A CORNER UNDER THE BEAM. THE BRINE RISES ONCE IT STARTS: KEEP GROWING'),
  x: ['decor', 'saltCellarProp'],
  '1': ['piece', 'salt.crystal', { id: 'c1', h: 1, plan: [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0]] }],
  '2': ['piece', 'salt.crystal', { id: 'c2', h: 1, plan: [[0, -1], [0, -2], [0, -3], [0, -4], [0, -5]] }],
  '3': ['piece', 'salt.crystal', { id: 'c3', h: 1, plan: [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0]] }],
  '4': ['piece', 'salt.crystal', { id: 'c4', h: 1, plan: [[0, -1], [0, -2], [0, -3], [0, -4], [0, -5], [0, -6]] }],
  '5': ['piece', 'salt.crystal', { id: 'c5', h: 1, plan: [[1, 0], [2, 0], [3, 0], [3, 1], [3, 2], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3]], brine: { dx0: 1, dx1: 10, dy: 4, time: 16 } }],
  A: DOOR('mitts@in'), u: GRAIN(), a: ['anchor', 'mittsOut']
});
stamps.saltCave = { floor: 18, rows: caveRows, legend: CAVE, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power', 'power'] };
stamps.saltMitts = roomStamp('cave@mittsOut', 'saltHatch');
const L3 = { n: 3, name: 'Crystal Habit', mapLabel: 'Crystal Habit', arch: 'cubegrow', theme: 'salt_cave',
  gimmick: 'Salt crystals that grow while you hold THROW on them: a new cube comes out of the flat face, where the dashed square shows. Bridges, lifts, and late on a corner under a glass beam while the brine rises',
  hint: 'Stand on any cube of a crystal and hold THROW. A cube growing under Brady lifts him. On the last one keep growing: the brine dissolves it if it reaches the stem. A blue grain sits on a high sill...',
  postcard: 'Brady! I held a salt crystal until it grew me a staircase. Then it grew me a bit more staircase than I needed. Crystals are like that. ♥ C',
  enemies: [['saltShrimp', 3], ['saltWeevil', 2], ['saltWren', 1], ['saltLick', 1]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '34-4' } },
  areas: [
    { id: 'cave', gen: 'room', theme: 'salt_cave', stamp: 'saltCave', camera: 'free', bottomKill: true },
    { id: 'mitts', gen: 'room', role: 'secret', theme: 'salt_room_mitts', stamp: 'saltMitts', room: 'saltMitts' }
  ] };
//@@L4@@

Tour.amend('salt', { stamps, levels: [L1, L2, L3] });
Tour.saltLevels = { grid, put, fillG, ground, pit, rowsOf, SIGN, GRAIN, ENEMY, roomStamp, DOOR, stamps };

/* ---------------- the land's map: salt flats in a cobalt sea ---------------- */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.salt = {
  labels: { '34-1': 'Angle of Repose', '34-2': 'Grain Elevator', '34-3': 'Crystal Habit', '34-4': 'The Shaker Test', '34-5': 'Season to Taste' },
  w: 1520, h: 760,
  pal: { sea: '#3a68c8', deep: '#2448a0', land: '#e8eef8', light: '#ffffff', path: '#f08a2a', beach: '#cfe0fa', cliff: '#1c3586', roof: '#f08a2a', wall: '#f6f9ff' },
  sea: 'waves', coast: 'saltCrust', tufts: 'none', trail: 'sand', bridge: 'stone', meadow: false, woods: false, foam: true, birds: false,
  land: [[[200, 420], [300, 240], [520, 190], [760, 250], [980, 180], [1220, 230], [1350, 400], [1280, 580], [1040, 640], [780, 600], [520, 650], [300, 600]]],
  // the trail runs like grains poured along a spoon: left to right and back to the chef's pot in the middle
  nodes: { start: [280, 480], '34-1': [400, 300, 'n'], '34-2': [720, 290, 'n'], '34-3': [1060, 260, 'n'], '34-4': [1200, 470, 'e'], '34-5': [820, 520, 's'], port: [460, 580] },
  paths: { 'start>34-1': [[320, 380]], '34-1>34-2': [[560, 260]], '34-2>34-3': [[890, 250]], '34-3>34-4': [[1170, 360]], '34-4>34-5': [[1020, 560]], '34-5>port': [[620, 590]] },
  feat: [
    ['sprite', 'saltHeapSprite', 560, 400, 30], ['sprite', 'saltHeapSprite', 920, 380, 24], ['sprite', 'saltCellarSprite', 1180, 610, 26],
    ['sprite', 'saltCorkSprite', 660, 660, 22], ['sprite', 'saltPotSprite', 820, 430, 30], ['sprite', 'saltHeapSprite', 330, 560, 18]
  ],
  flora: ['rock'], density: 0,
  live: [['circle', 760, 120, 60, 0.6]]
};
})();
