/* ============================================================
   THE SPARE BONE QUARRY: the levels (world 37) and the land's map. A hidden bonus land at about Nepal's level
   (d0 0.8): each stage teaches its one new idea where a slip costs nothing, tests it among the critters, then
   twists it ("late on / the last one"); the last ordinary stage and the boss are the hardest.
   37-1 WALK LIKE THIS (trackway)  footprint trackways raise giant stone steps; the last creature walked backwards
   (37-2 to 37-5 below.)
   ============================================================ */
(function () {
const C = Tour.countries.bone;
if (!C) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length) Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const pit = (Gr, x0, x1) => fillG(Gr, x0, 0, x1, Gr.length - 1, '.');
const rowsOf = Gr => Gr.map(r => r.join(''));
const stamps = {};
// a secret room's old stamp: the way back out (its door) and its prize; the room kind builds the room from it
const oldRoom = (to, items, look) => ({ floor: 12, rows: ['##############################', '#............................#'].concat(Array(9).fill('#............................#')).concat(['#.@D.....................?...#', '##############################', '##############################']), items, doors: [{ to, look: look || 'boneHatch' }] });
const SIGN = text => ['spawn', 'sign', { text }];

/* ---------------- 37-1 Walk Like This ---------------- */
// ① the teach: a plinth, three prints, a pair raises two stone steps up the first cliff (P1 over it); ② the test: four
// prints in two pairs with a dust brush sweeping between them and a rook overhead; each pair raises two steps up to
// the high bench; ③ the low quarry floor: a tunnel under a thin strata ceiling (a gap in it, the whiskers' tell: the
// run on top leads to the great hall), the scree pit (P3), and the twist: a trackway up a staircase whose toes all
// point back down. Follow the toes: top print first, down to the bottom one, and the last steps rise to the gate.
const walkRows = (() => {
  const W = 236, H = 26, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 32, 19); put(Gr, 3, 18, '@'); put(Gr, 7, 18, 'n'); put(Gr, 10, 18, 'k'); put(Gr, 13, 15, '?');
  put(Gr, 16, 18, '1'); put(Gr, 19, 16, 'o.o.o.o');
  ground(Gr, 33, 56, 13); put(Gr, 38, 10, '*'); put(Gr, 40, 11, 'o.o.o'); put(Gr, 46, 12, 'e'); put(Gr, 35, 12, 'l'); put(Gr, 52, 12, 'r');
  // ② the test
  ground(Gr, 57, 74, 19); put(Gr, 60, 18, 'c'); put(Gr, 66, 18, 'w'); put(Gr, 70, 18, 'r');
  pit(Gr, 75, 77); put(Gr, 74, 15, 'o.o.o');
  ground(Gr, 78, 104, 19); put(Gr, 79, 18, 'N'); put(Gr, 81, 18, '2'); put(Gr, 89, 18, 'u'); put(Gr, 91, 12, 'M');
  ground(Gr, 105, 130, 9); put(Gr, 110, 8, 'c'); put(Gr, 112, 5, '?'); put(Gr, 116, 7, 'o.o.o.o'); put(Gr, 122, 8, 'e'); put(Gr, 127, 8, 'l');
  // ③ the low floor: the tunnel under a thin strata ceiling, with walls up from its ends (the run on top is a secret)
  ground(Gr, 131, W - 1, 21); put(Gr, 136, 20, 'c'); put(Gr, 133, 20, 'w');
  fillG(Gr, 141, 17, 169, 17, 'H'); fillG(Gr, 140, 9, 140, 17, 'H'); fillG(Gr, 170, 9, 170, 17, 'H');
  fillG(Gr, 154, 17, 155, 17, '.'); fillG(Gr, 154, 20, 155, 20, 'H'); put(Gr, 153, 18, 'x');
  put(Gr, 144, 19, 'o.o.o'); put(Gr, 160, 19, 'o.o.o.o');
  // the run on top of the ceiling: coins, a plaster block to hop, a rook, the hidden 1UP, P2, the hall's hatch
  put(Gr, 143, 15, 'o.o.o.o.o'); put(Gr, 147, 12, 'h'); put(Gr, 158, 13, 'A'); fillG(Gr, 161, 15, 162, 16, 'B'); put(Gr, 156, 10, 'M'); put(Gr, 165, 14, 'o.o'); put(Gr, 168, 16, 'D');
  put(Gr, 174, 20, 'a'); put(Gr, 176, 20, 'c');
  // the scree pit (P3 over it), a rook
  pit(Gr, 179, 182); put(Gr, 180, 15, 'R'); put(Gr, 178, 13, 'M'); put(Gr, 184, 20, 'e');
  // the twist: the staircase trackway (toes point back down), the last steps up to the gate's bench
  put(Gr, 187, 20, '3'); put(Gr, 186, 20, 'N');
  ground(Gr, 190, 192, 19); ground(Gr, 193, 195, 17); ground(Gr, 196, 198, 15); ground(Gr, 199, 201, 13);
  ground(Gr, 204, W - 1, 9); put(Gr, 212, 8, 'r'); put(Gr, 218, 8, 'l'); put(Gr, 228, 8, 'G'); put(Gr, 222, 8, 'k');
  fillG(Gr, W - 1, 0, W - 1, 8, '#');
  return rowsOf(Gr);
})();
const T1 = { prints: [[19, 19, 2, 0], [22, 19, 0, 0], [25, 19, 1, 0]], order: [2, 1], plinth: [16, 19], raise: [[2, [[29, 17, 30, 18], [31, 15, 32, 18]]]], gs: [0] };
const T2 = { prints: [[84, 19, 4, 0], [88, 19, 3, 0], [92, 19, 2, 0], [96, 19, 0, 0]], order: [1, 3, 2, 0], plinth: [81, 19], raise: [[2, [[97, 17, 98, 18], [99, 15, 100, 18]]], [4, [[101, 13, 102, 18], [103, 11, 104, 18]]]], gs: [1, 2] };
const T3 = { mode: 'toes', prints: [[191, 19, 4, -1], [194, 17, 4, -1], [197, 15, 4, -1], [200, 13, 4, -1]], order: [3, 2, 1, 0], plinth: [187, 21], raise: [[4, [[202, 11, 203, 20]]]], gs: [3] };
stamps.boneWalk = { floor: 21, rows: walkRows, gold: { '*': 'must', A: 'hidden', R: 'risky' }, items: ['power', 'power'], hidden: ['oneup'], doors: [{ to: 'hall@in', look: 'boneHatch' }], legend: {
  n: SIGN('A TRACKWAY! THE PLINTH SHOWS THE NEXT FOOT. JUMP ONTO THE PRINT THAT FITS. EACH PAIR RAISES THE STONE STEPS'),
  N: SIGN('A WRONG FOOT ONLY STARTS THE PAIR AGAIN. WATCH THE BRUSH: IT SWEEPS AT YOUR SHOES'),
  k: ['decor', 'boneCrate'], l: ['decor', 'boneLabel'], r: ['decor', 'boneRock'],
  e: ['enemy', 'boneMouse'], w: ['enemy', 'boneNewt'], u: ['enemy', 'boneBrush'], M: ['enemy', 'boneRook'],
  '1': ['piece', 'bone.track', T1], '2': ['piece', 'bone.track', T2], '3': ['piece', 'bone.track', T3],
  x: ['decor', 'boneTellCeil'], a: ['anchor', 'hallOut']
} };
stamps.boneHallOld = oldRoom('quarry@hallOut', ['oneup']);
const L1 = { n: 1, name: 'Walk Like This', mapLabel: 'Walk Like This', arch: 'trackway', theme: 'bone_quarry',
  gimmick: 'Footprint trackways: the plinth shows the creature\'s next foot; jump onto the print that fits it, and every pair raises giant stone steps. The last one walked backwards',
  hint: 'Jump ONTO the print: walking across one does nothing. At the end, follow the toes, not the slope. A mouse\'s whiskers twitch under a crack in the tunnel roof...',
  postcard: 'Brady! A crate of plaster fossils fell down a quarry and they put themselves back together. One has a foot where its ear should be. He seems happy. ♥ C',
  enemies: [['boneMouse', 2], ['boneNewt', 2], ['boneBrush', 1], ['boneRook', 2]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '37-2' } },
  areas: [
    { id: 'quarry', gen: 'room', theme: 'bone_quarry', stamp: 'boneWalk', bone: { track: true }, bottomKill: true },
    { id: 'hall', gen: 'room', role: 'secret', room: 'boneGiant', theme: 'bone_room_hall', stamp: 'boneHallOld', bone: { room: true } }
  ] };

/* ---------------- 37-2 Assembly Optional ---------------- */
// ① the teach: one crank, one vertebra, one rib: a turn lays it flat over the scree (P1 over the bridge); the first
// replica ribs to climb (push UP to grip) onto the cliff; ② the test: a vertebra three notches round, a rook over the
// bridge; down to the floor and up a tall rib cage with a critter on each face (cross at a persimmon collar); a
// vertebra with a long rib and a short one at right angles (the short one is a bridge too short); ③ the twist: one
// vertebra turns two unequal ribs; one angle lays the long rib over the first pit and the short one useless; only one
// puts both tips on solid ground. Then the last cage, critters on both faces, up to the gate.
const ascentRows = (() => {
  const W = 236, H = 26, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 13, 19); put(Gr, 3, 18, '@'); put(Gr, 6, 18, 'n'); put(Gr, 9, 15, '?'); put(Gr, 11, 18, '1');
  ground(Gr, 14, 14, 17); put(Gr, 18, 14, 'o.o.o'); put(Gr, 19, 12, '*');
  ground(Gr, 24, 40, 17); put(Gr, 27, 16, 'r'); put(Gr, 33, 16, 'N'); put(Gr, 36, 16, 'i');
  ground(Gr, 41, 58, 9); ground(Gr, 58, 58, 7); put(Gr, 44, 8, 'c'); put(Gr, 50, 8, 'e'); put(Gr, 55, 8, '2'); put(Gr, 64, 3, 'M');
  // ② the test
  ground(Gr, 68, 90, 7); put(Gr, 72, 3, '?'); put(Gr, 78, 6, 'w'); put(Gr, 86, 6, 'l');
  ground(Gr, 91, 103, 19); put(Gr, 93, 18, 'c'); put(Gr, 96, 18, 'j'); put(Gr, 97, 18, 'K'); put(Gr, 95, 18, 'Z'); put(Gr, 92, 18, 'O');
  ground(Gr, 104, 113, 7); ground(Gr, 113, 113, 6); put(Gr, 106, 6, 'e'); put(Gr, 110, 6, '3');
  ground(Gr, 123, 150, 6); put(Gr, 128, 5, 'w'); put(Gr, 134, 5, 'o.o.o'); put(Gr, 142, 5, 'l');
  // the gift shop: a crack in the shelf's face at floor level, whiskers twitching out of it
  fillG(Gr, 146, 17, 149, 18, '.'); fillG(Gr, 150, 17, 150, 18, 'F'); put(Gr, 147, 18, 'D'); put(Gr, 151, 17, 'x');
  // ③ the twist
  ground(Gr, 151, 166, 19); put(Gr, 155, 18, 'c'); put(Gr, 157, 15, '?'); put(Gr, 158, 12, '----'); put(Gr, 158, 11, 'X'); put(Gr, 158, 10, 'o.o'); put(Gr, 161, 18, 'N'); put(Gr, 164, 18, '4');
  fillG(Gr, 166, 13, 185, 14, 'H'); ground(Gr, 173, 173, 17);
  ground(Gr, 185, W - 1, 17); put(Gr, 188, 16, 'e'); put(Gr, 192, 16, 'r'); put(Gr, 196, 6, 'M'); put(Gr, 198, 7, 'A');
  put(Gr, 199, 16, 'P'); put(Gr, 202, 16, 'E'); put(Gr, 203, 16, 'U'); put(Gr, 204, 16, 'V'); put(Gr, 203, 9, 'R');
  ground(Gr, 206, W - 1, 5); put(Gr, 210, 4, 'c'); put(Gr, 216, 4, 'l'); put(Gr, 225, 4, 'G'); put(Gr, 221, 4, 'r');
  fillG(Gr, W - 1, 0, W - 1, 4, '#');
  return rowsOf(Gr);
})();
const VERT = (socket, pivot, ribs, notch, good, g) => ['piece', 'bone.vert', { socket, pivot, ribs, notch, good, g }];
const RIBS = (x0, y0, x1, y1, collars) => ['piece', 'bone.ribs', { x0, y0, x1, y1, collars: collars || [] }];
const CLIMBER = (x, y0, y1, face, speed, phase) => ['piece', 'bone.climber', { x, y0, y1, face, speed, phase }];
stamps.boneAscent = { floor: 19, rows: ascentRows, gold: { '*': 'must', A: 'high', R: 'risky' }, items: ['power', 'power', 'power'], doors: [{ to: 'shop@in', look: 'boneCrack' }], legend: {
  n: SIGN('A VERTEBRA! STAND AT ITS CRANK AND THROW: IT TURNS ONE NOTCH. TURN THE RIB FLAT TO BRIDGE THE SCREE'),
  N: SIGN('REPLICA RIBS: PUSH UP INTO THEM TO GRIP, CLIMB ANY WAY, JUMP TO LET GO. JUMP AT A COLLAR TO CROSS TO THE FAR SIDE'),
  l: ['decor', 'boneLabel'], r: ['decor', 'boneRock'], e: ['enemy', 'boneMouse'], w: ['enemy', 'boneNewt'], M: ['enemy', 'boneRook'],
  '1': VERT([11, 19], [14, 17], [[9, 0]], 0, 1, 0),
  '2': VERT([55, 9], [58, 7], [[9, 0]], 2, 1, 1),
  '3': VERT([110, 7], [113, 6], [[9, 0], [3, 3]], 2, 1, 2),
  '4': VERT([164, 19], [173, 17], [[11, 0], [6, 2]], 2, 1, 3),
  i: RIBS(37, 8, 40, 16),
  j: RIBS(98, 4, 103, 18, [[99, 12], [102, 9]]), K: CLIMBER(100, 6, 16, 0, 1.6, 0), Z: CLIMBER(102, 6, 16, 1, 1.4, 0.5), O: ['decor', 'boneRock'],
  P: RIBS(199, 4, 205, 16, [[200, 11], [204, 7]]), E: CLIMBER(202, 6, 13, 0, 1.8, 0), U: CLIMBER(203, 6, 13, 1, 1.5, 0.6), V: CLIMBER(200, 8, 14, 0, 1.4, 0.3),
  x: ['decor', 'boneTellWallR'], X: ['anchor', 'shopOut']
} };
stamps.boneShopOld = oldRoom('ascent@shopOut', ['oneup']);
const L2 = { n: 2, name: 'Assembly Optional', mapLabel: 'Assembly Optional', arch: 'vertebra', theme: 'bone_scree',
  gimmick: 'Vertebrae on sockets: THROW at a crank to turn one a notch until its rib lies flat over the scree. Replica-rib rungs to climb, critters on both faces. Late on, one vertebra turns two unequal ribs',
  hint: 'Count the notches before you cross. On the ribs, cross to the far face at a persimmon collar to get round a critter. Whiskers twitch in a crack at the foot of the last high shelf...',
  postcard: 'Brady! Every skeleton here was put together by someone in a hurry. One has its ribs on as a ladder. You climbed it. It was flattered. ♥ C',
  enemies: [['boneMouse', 2], ['boneNewt', 2], ['boneRook', 2]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '37-3' } },
  areas: [
    { id: 'ascent', gen: 'room', theme: 'bone_scree', stamp: 'boneAscent', bone: { ribs: true, vert: true }, bottomKill: true },
    { id: 'shop', gen: 'room', role: 'secret', room: 'boneQueue', theme: 'bone_room_shop', stamp: 'boneShopOld', bone: { room: true } }
  ] };

/* ---------------- 37-3 Make an Impression ---------------- */
// ① the teach: one clay tray under a press, a cliff that wants a TALL cast (stand as it comes down); ② a pit under a
// low shelf that wants a LOW, broad one (crouch); a brush and a newt on the floor; a tall one under a rook up to the
// high bench (a soft patch of plaster floor there gives way if you crouch on it: the cast room); ③ the twist: the
// slab that must go under a long low shelf (bent knees, a broad low back), then a tall one straight after, to the gate.
const clayRows = (() => {
  const W = 212, H = 26, Gr = grid(W, H, '.');
  ground(Gr, 0, 19, 19); put(Gr, 3, 18, '@'); put(Gr, 6, 18, 'n'); put(Gr, 9, 15, '?'); put(Gr, 11, 18, 'k'); put(Gr, 14, 18, '1');
  ground(Gr, 20, 45, 13); put(Gr, 30, 9, '*'); put(Gr, 38, 12, 'e'); put(Gr, 25, 12, 'l');
  ground(Gr, 46, 54, 19); put(Gr, 48, 18, 'c'); put(Gr, 49, 18, 'N'); put(Gr, 51, 18, '2');
  pit(Gr, 55, 63); fillG(Gr, 54, 15, 64, 16, 'H');
  ground(Gr, 64, 91, 19); put(Gr, 70, 18, 'u'); put(Gr, 74, 14, 'R'); put(Gr, 80, 18, 'w'); put(Gr, 86, 18, '3'); put(Gr, 84, 18, 'k');
  ground(Gr, 92, 120, 13); put(Gr, 96, 12, 'c'); put(Gr, 100, 9, '?'); put(Gr, 104, 8, 'A'); put(Gr, 98, 6, 'M'); put(Gr, 116, 12, 'l');
  // the cast room: a soft patch of floor (whiskers beside it), a shaft, the pocket and its door
  fillG(Gr, 110, 14, 111, 20, '.'); fillG(Gr, 108, 19, 113, 20, '.'); put(Gr, 112, 20, 'D'); put(Gr, 110, 12, 'f'); put(Gr, 112, 12, 'x');
  ground(Gr, 121, 136, 19); put(Gr, 124, 18, 'X'); put(Gr, 127, 18, 'c'); put(Gr, 129, 18, 'k'); put(Gr, 131, 18, '4');
  pit(Gr, 137, 152); fillG(Gr, 134, 15, 153, 16, 'H'); put(Gr, 144, 18, 'o.o.o');
  ground(Gr, 153, 173, 19); put(Gr, 160, 18, 'w'); put(Gr, 164, 10, 'M'); put(Gr, 168, 18, '5');
  ground(Gr, 174, W - 1, 13); put(Gr, 180, 12, 'r'); put(Gr, 186, 12, 'l'); put(Gr, 200, 12, 'G'); fillG(Gr, W - 1, 0, W - 1, 12, '#');
  return rowsOf(Gr);
})();
const PRESS = (tray, need, casts, g, edge, phase) => ['piece', 'bone.press', { tray, need, casts, g, edge, phase: phase || 0 }];
stamps.boneClay = { floor: 19, rows: clayRows, gold: { '*': 'must', A: 'high', R: 'risky' }, items: ['power', 'power'], doors: [{ to: 'cast@in', look: 'boneHatch' }], legend: {
  n: SIGN('A CLAY PRESS! STAND IN THE TRAY AS IT COMES DOWN: STAND UP FOR A TALL CAST, CROUCH (DOWN) FOR A LOW ONE'),
  N: SIGN('THE CHALK OUTLINE SAYS WHICH CAST FITS. TOO TALL FOR A LOW SHELF? BEND YOUR KNEES'),
  k: ['decor', 'boneBucket'], l: ['decor', 'boneLabel'], r: ['decor', 'boneRock'], e: ['enemy', 'boneMouse'], w: ['enemy', 'boneNewt'], u: ['enemy', 'boneBrush'], M: ['enemy', 'boneRook'],
  '1': PRESS([14, 15, 19], 'tall', { tall: [18, 16, 19, 18], low: [17, 18, 20, 18] }, 0),
  '2': PRESS([51, 52, 19], 'low', { low: [55, 19, 63, 19], tall: [54, 15, 55, 18] }, 1),
  '3': PRESS([86, 87, 19], 'tall', { tall: [90, 16, 91, 18], low: [89, 18, 92, 18] }, 2, null, 1.2),
  '4': PRESS([131, 132, 19], 'low', { low: [137, 19, 152, 19], tall: [136, 15, 137, 18] }, 3),
  '5': PRESS([168, 169, 19], 'tall', { tall: [172, 16, 173, 18], low: [171, 18, 174, 18] }, null, [174, 12], 0.8),
  f: ['piece', 'bone.soft', { x: 110, y: 13, w: 2, to: [110, 20] }], x: ['decor', 'boneTell'], X: ['anchor', 'castOut']
} };
stamps.boneCastOld = oldRoom('clay@castOut', ['star']);
const L3 = { n: 3, name: 'Make an Impression', mapLabel: 'Make an Impression', arch: 'mould', theme: 'bone_clay',
  gimmick: 'Clay presses: stand in the tray as the press comes down and the cast takes your shape. Stand tall for a step up a wall, crouch for a low, broad slab under a shelf',
  hint: 'Watch the chalk outline: it shows the cast that fits. The press shakes before it drops. On the high bench, mouse whiskers poke out of the floor by a patch that sounds hollow...',
  postcard: 'Brady! You pressed yourself into the clay and it made a STEP. A step shaped like you. I stood on your shoulders. Lovely view. ♥ C',
  enemies: [['boneMouse', 1], ['boneNewt', 2], ['boneBrush', 1], ['boneRook', 2]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '37-4' } },
  areas: [
    { id: 'clay', gen: 'room', theme: 'bone_clay', stamp: 'boneClay', bone: { press: true }, bottomKill: true },
    { id: 'cast', gen: 'room', role: 'secret', room: 'boneOrder', theme: 'bone_room_cast', stamp: 'boneCastOld', bone: { room: true } }
  ] };

Tour.amend('bone', { stamps, levels: [L1, L2, L3] });

/* ---------------- the land's map: the quarry seen from the rim ---------------- */
// the tipped crate where the arrival trail starts (left), the trackway terraces, the scree slope with the ribs, the
// casting shed, the cutting floor, and the dig pit where the boss sits down at last (right)
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.bone = {
  labels: { '37-1': 'Walk Like This', '37-2': 'Assembly Optional', '37-3': 'Make an Impression', '37-4': 'Clean Break', '37-5': 'Reassembly' },
  w: 1520, h: 760,
  pal: { sea: '#6a4a8a', deep: '#3a2a5a', land: '#e0a060', light: '#f2c070', path: '#f4ead2', beach: '#f2b44e', cliff: '#8a4620', roof: '#f06a2a', wall: '#f4ead2' },
  sea: 'stars', coast: 'boneRim', tufts: 'none', trail: 'dots', bridge: 'steps', meadow: false, woods: false, foam: false, birds: false,
  land: [[[160, 400], [220, 240], [400, 150], [640, 120], [880, 150], [1100, 120], [1320, 190], [1410, 330], [1380, 520], [1250, 640], [1000, 680], [720, 650], [460, 680], [260, 610]]],
  nodes: { start: [250, 460], '37-1': [430, 340, 'n'], '37-2': [690, 230, 'n'], '37-3': [980, 250, 'n'], '37-4': [1180, 420, 'e'], '37-5': [930, 560, 's'] },
  paths: { 'start>37-1': [[330, 410]], '37-1>37-2': [[560, 260]], '37-2>37-3': [[840, 200]], '37-3>37-4': [[1100, 320]], '37-4>37-5': [[1080, 520]] },
  feat: [
    ['sprite', 'boneCrateS', 236, 486, 26], ['sprite', 'boneBench', 560, 360, 40], ['sprite', 'boneRibs', 760, 300, 30],
    ['sprite', 'boneBig', 1060, 360, 34], ['sprite', 'boneSit', 820, 600, 30], ['sprite', 'boneBench', 1250, 560, 34]
  ],
  flora: ['rock'], density: 0,
  live: [['circle', 760, 120, 60, 0.6]]
};
})();
