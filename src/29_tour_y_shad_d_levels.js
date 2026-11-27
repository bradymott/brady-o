/* ============================================================
   THE DEPARTMENT OF UNCLAIMED SHADOWS: the levels (world 35) and the land's map. A hidden bonus land at about Nepal's
   level (d0 0.8): each stage teaches its one new idea where a slip costs nothing, tests it among the critters, then
   twists it ("late on / the last one"); the last ordinary stage and the boss are the hardest.
   35-1 LOST PROPERTY (claim)              heels on the matching shadow's heels, THROW: it goes home; the last two
                                           umbrellas look the same until one opens on its missing spoke
   35-2 LONG DIVISION (lamplen)            walk to or from a floor lamp until the shadow's hand meets the shelf's
                                           handle; a filing-wall climb; the last handle is over a lip: jump for it
   35-3 OVERLAP ALLOWANCE (overlap)        slide a folding screen till two wall shadows overlap into a step; the last
                                           one: give up half the patch to get a step tall enough
   35-4 ALTERATIONS WHILE YOU WAIT (trim)  stand on the chalk mark, THROW: trimmed to fit the mail slot; the last slot
                                           wants a long arm and a short body (jump, then cut)
   35-5 JOINT CUSTODY (lair)               both shadows' feet on their claim slots (the last desk's hats lie), then
                                           the Understudy himself
   Every stage's secret room is found the same way: a door's shadow on the wall with no door to cast it (the land's tell),
   right by the way in (a wall that is only painted, a gap in a ceiling, a mail slot off the path).
   ============================================================ */
(function () {
const C = Tour.countries.shad, SK = Tour.shadKit;
if (!C || !SK) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length && str[k] !== ' ') Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const pit = (Gr, x0, x1) => fillG(Gr, x0, 0, x1, Gr.length - 1, '.');
const ink = (Gr, x0, x1, top) => { pit(Gr, x0, x1); fillG(Gr, x0, top, x1, Gr.length - 1, 'L'); };
const rowsOf = Gr => Gr.map(r => r.join(''));
// the secret nook: a solid block (x0..x0+4, rows top..floor-1) whose one face is only painted (fake), a hollow behind it
// with the room's door and a postcard; the land's tell (a door's shadow, no door) on the wall beside the painted face
const nook = (Gr, x0, top, fl, side) => {
  fillG(Gr, x0, top, x0 + 4, fl - 1, 'H'); Gr[top][x0] = '%';
  const fx = side < 0 ? x0 : x0 + 4, hx0 = side < 0 ? x0 + 1 : x0 + 1, hx1 = side < 0 ? x0 + 3 : x0 + 3;
  fillG(Gr, fx, fl - 2, fx, fl - 1, 'F'); fillG(Gr, hx0, fl - 2, hx1, fl - 1, '.');
  put(Gr, fx + side, fl - 1, 'x'); put(Gr, side < 0 ? hx0 + 1 : hx1 - 1, fl - 2, 'A'); put(Gr, side < 0 ? hx1 : hx0, fl - 1, 'D');
};
const stamps = {};
const oldRoom = (to, items, look) => ({ floor: 12, rows: ['##############################', '#............................#'].concat(Array(9).fill('#............................#')).concat(['#.@D.....................?...#', '##############################', '##############################']), items, doors: [{ to, look: look || 'shadDoor' }] });
const SIGN = text => ['spawn', 'sign', { text }];
const GRILLE = (id, h) => ['piece', 'shad.grille', { id, h: h || 5 }];
const COMMON = { '%': ['piece', 'shad.cover', { w: 5, h: 3 }], k: ['decor', 'shadCrate'], l: ['decor', 'shadBell'], q: ['decor', 'shadSpool'], x: ['decor', 'shadTell'],
  u: ['enemy', 'shadRabbit'], w: ['enemy', 'shadHound'], j: ['enemy', 'shadFlea'], M: ['enemy', 'shadCrow'] };
const GOLD = { '*': 'must', A: 'hidden', E: 'risky' };

/* ---------------- 35-1 Lost Property ---------------- */
// ① the teach: a rabbit's shadow beside a teapot's (easy: the shapes differ); ② the test: two teapots and a watering
// can (the notch decides), critters about; a block whose left face is only painted (the tell beside it: the parcel room);
// kettles; ③ the twist: three closed umbrella shadows, identical until Brady stands on one and it opens
const lostRows = (() => {
  const W = 170, H = 24, Gr = grid(W, H, '.');
  ground(Gr, 0, 30, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 7, 15, '?');
  put(Gr, 9, 18, '1'); put(Gr, 18, 18, 'r'); put(Gr, 21, 15, 'o.o.o'); put(Gr, 25, 18, 'u'); put(Gr, 27, 15, '?');
  ink(Gr, 31, 34, 21); put(Gr, 32, 13, 'M'); put(Gr, 31, 15, 'o.o');
  ground(Gr, 35, 90, 19); put(Gr, 37, 18, 'c'); put(Gr, 40, 18, '2'); put(Gr, 52, 18, 'R'); put(Gr, 55, 15, '*');
  // the parcel room's block (its left face only painted)
  nook(Gr, 58, 16, 19, -1);
  put(Gr, 66, 18, 'k'); put(Gr, 69, 18, 'w'); put(Gr, 72, 15, '?'); put(Gr, 76, 15, 'h'); put(Gr, 79, 18, 'j');
  ground(Gr, 81, 86, 17); put(Gr, 82, 14, 'o.o.o'); put(Gr, 88, 18, 'a');
  ink(Gr, 91, 94, 21); put(Gr, 92, 13, 'M');
  ground(Gr, 95, 115, 19); put(Gr, 97, 18, 'c'); put(Gr, 100, 18, '3'); put(Gr, 112, 18, 'P');
  ink(Gr, 116, 125, 21); fillG(Gr, 118, 16, 119, 16, '-'); fillG(Gr, 122, 15, 123, 15, '-'); put(Gr, 121, 12, 'E'); put(Gr, 120, 10, 'M');
  ground(Gr, 126, W - 1, 19); put(Gr, 128, 18, 'c'); put(Gr, 132, 18, 'O'); put(Gr, 136, 18, '4'); put(Gr, 148, 18, 'X');
  put(Gr, 152, 18, 'u'); put(Gr, 156, 18, 'k'); put(Gr, 158, 15, 'o.o.o'); put(Gr, 162, 18, 'G'); fillG(Gr, W - 1, 0, W - 1, 18, '#');
  return rowsOf(Gr);
})();
const BOARD = o => ['piece', 'shad.board', o];
stamps.shadLost = { floor: 19, rows: lostRows, gold: GOLD, items: ['power', 'pick', 'power'], hidden: ['oneup'], doors: [{ to: 'parcel@in', look: 'shadHatch' }], legend: Object.assign({}, COMMON, {
  n: SIGN('WHOSE SHADOW? HEELS ON ITS HEELS, THEN THROW'),
  O: SIGN('THESE UMBRELLAS LOOK THE SAME. STAND ON ONE'),
  '1': BOARD({ pins: [['rab', 1, 0], ['pot', 0, 3]], owner: ['rab', 1, 6], right: 0, lock: 'shad:l1' }),
  '2': BOARD({ pins: [['pot', 2, 0], ['can', 2, 3], ['pot', 3, 6]], owner: ['pot', 3, 9], right: 2, lock: 'shad:l2' }),
  '3': BOARD({ pins: [['ket', 1, 0], ['ket', 3, 3], ['can', 3, 6]], owner: ['ket', 3, 9], right: 1, lock: 'shad:l3' }),
  '4': BOARD({ pins: [['umb', 1, 0, null], ['umb', 1, 3, 2], ['umb', 1, 6, null]], owner: ['umbOpen', null, 9, 2], right: 1, lock: 'shad:l4', umb: true }),
  r: GRILLE('shad:l1'), R: GRILLE('shad:l2'), P: GRILLE('shad:l3'), X: GRILLE('shad:l4'),
  a: ['anchor', 'parcelOut']
}) };
stamps.shadParcelOld = oldRoom('lost@parcelOut', ['oneup']);
const L1 = { n: 1, name: 'Lost Property', mapLabel: 'Lost Property', arch: 'claim', theme: 'shad_lost',
  gimmick: 'Shadows pinned to the wall, each with one notch. Find the one whose notch matches its owner, stand with your heels on its heels and THROW to send it home. The last two umbrellas look the same until one opens on its missing spoke',
  hint: 'Match the notch, stand on the chalk heels, THROW. Stand on an umbrella to open it. A door\'s shadow with no door...',
  postcard: 'Brady! A whole office of shadows nobody came back for. I asked for yours. The clerk said it left with a man in sunglasses. I said, darling, that WAS him. ♥ C',
  enemies: [['shadRabbit', 2], ['shadHound', 1], ['shadFlea', 1], ['shadCrow', 3]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '35-2' } },
  areas: [
    { id: 'lost', gen: 'room', theme: 'shad_lost', stamp: 'shadLost', shad: { claim: true }, bottomKill: true },
    { id: 'parcel', gen: 'room', role: 'secret', room: 'shadBeat', theme: 'shad_room_parcel', stamp: 'shadParcelOld', shad: { room: true } }
  ] };

/* ---------------- 35-2 Long Division ---------------- */
// ① the teach: a floor lamp; walk toward it until the shadow's hand meets the shelf's handle: the shelf folds into a
// step up a filing cliff; ② the test: a filing wall to climb (fleas on it, an open drawer to cross), a low passage whose
// ceiling has a gap by the tell (the night corridor above), a second lamp further off; ③ the twist: the last handle
// over a lip: jump from the right spot
const L2_SHELVES = [[9, 12, 0], [92, 96, 0], [136, 141, 1]];
const divRows = (() => {
  const W = 180, H = 24, Gr = grid(W, H, '.');
  ground(Gr, 0, 16, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 6, 15, '?'); put(Gr, 9, 18, '1');
  ground(Gr, 17, 38, 13); put(Gr, 20, 9, 'o.o.o'); put(Gr, 26, 9, '*'); put(Gr, 30, 12, 'u'); put(Gr, 34, 12, 'c');
  ground(Gr, 39, 57, 19); put(Gr, 42, 15, 'o.o'); put(Gr, 45, 18, 'j'); put(Gr, 48, 18, 'N');
  // the filing wall up to the top floor
  put(Gr, 50, 9, 'f'); put(Gr, 52, 15, 'z'); put(Gr, 55, 11, 'Z');
  ground(Gr, 58, 81, 9); put(Gr, 60, 8, 'c'); put(Gr, 63, 8, 'w'); put(Gr, 66, 5, '?'); put(Gr, 69, 5, 'h');
  // the low passage: a ceiling of drawers with a gap by the tell; the night corridor's hatch on top
  fillG(Gr, 72, 6, 80, 6, 'H'); fillG(Gr, 71, 1, 71, 6, 'H'); fillG(Gr, 81, 1, 81, 6, 'H'); fillG(Gr, 76, 6, 77, 6, '.'); put(Gr, 75, 8, 'x');
  put(Gr, 72, 5, 'o.o.o'); put(Gr, 78, 4, 'A'); put(Gr, 79, 5, 'D');
  ground(Gr, 82, 99, 19); put(Gr, 84, 18, 'a'); put(Gr, 87, 18, 'k'); put(Gr, 92, 18, '2');
  ground(Gr, 100, 125, 14); put(Gr, 103, 10, 'o.o.o'); put(Gr, 106, 13, 'j'); put(Gr, 110, 10, '?'); put(Gr, 112, 9, 'M'); put(Gr, 118, 13, 'u'); put(Gr, 122, 13, 'c');
  ground(Gr, 126, 144, 19); put(Gr, 130, 18, 'q'); put(Gr, 133, 18, 'O'); put(Gr, 136, 18, '3');
  ground(Gr, 145, W - 1, 13); put(Gr, 147, 12, 'c'); put(Gr, 149, 9, 'o.o');
  ink(Gr, 152, 156, 15); put(Gr, 154, 10, 'E'); put(Gr, 153, 8, 'M');
  put(Gr, 160, 12, 'j'); put(Gr, 164, 12, 'k'); put(Gr, 170, 12, 'G'); fillG(Gr, W - 1, 0, W - 1, 12, '#');
  return rowsOf(Gr);
})();
const LAMP = (k, g) => ['piece', 'shad.lamp', { lamp: L2_SHELVES[k][0], at: L2_SHELVES[k][1], jump: !!L2_SHELVES[k][2], w: 2, dir: 1, g }];
stamps.shadDiv = { floor: 19, rows: divRows, gold: GOLD, items: ['pick', 'power', 'power'], hidden: ['oneup'], doors: [{ to: 'rain@in', look: 'shadHatch' }], legend: Object.assign({}, COMMON, {
  n: SIGN('NEARER THE LAMP, TALLER YOUR SHADOW. HAND ON THE HANDLE'),
  N: SIGN('PUSH UP INTO THE DRAWERS TO CLIMB. JUMP AT AN OPEN DRAWER: THROUGH'),
  O: SIGN('THIS HANDLE IS OVER A LIP. JUMP AT THE RIGHT SPOT'),
  '1': LAMP(0, 0), '2': LAMP(1, 1), '3': LAMP(2, 2),
  f: ['piece', 'shad.filing', { w: 8, h: 10, holes: [[4, 4]] }],
  z: ['piece', 'shad.crawler', { face: 0, ay: 2.5, speed: 0.9 }], Z: ['piece', 'shad.crawler', { face: 1, ax: 1.5, speed: 0.8, phase: 1 }],
  a: ['anchor', 'rainOut']
}) };
stamps.shadRainOld = oldRoom('div@rainOut', ['oneup']);
const L2 = { n: 2, name: 'Long Division', mapLabel: 'Long Division', arch: 'lamplen', theme: 'shad_lamp',
  gimmick: 'A floor lamp throws Brady\'s own shadow up the wall: the nearer the lamp, the taller it grows. Put its hand on a folded shelf\'s handle and the shelf comes down as a step. A wall of filing drawers to climb. The last handle sits over a lip: jump at the right spot',
  hint: 'Walk to or from the lamp until the hand meets the brass ring. Push up into the drawers to climb. A door\'s shadow with no door...',
  postcard: 'Brady! A lamp here makes your shadow taller the closer you stand. I stood very close for a while. I was enormous, darling. The shadow clerk asked me to step back. ♥ C',
  enemies: [['shadFlea', 3], ['shadHound', 1], ['shadRabbit', 1], ['shadCrow', 2]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '35-3' } },
  areas: [
    { id: 'div', gen: 'room', theme: 'shad_lamp', stamp: 'shadDiv', shad: { lamp: true }, bottomKill: true },
    { id: 'rain', gen: 'room', role: 'secret', room: 'shadWindow', theme: 'shad_room_rain', stamp: 'shadRainOld', shad: { room: true } }
  ] };

/* ---------------- 35-3 Overlap Allowance ---------------- */
// ① the teach: the screen's shadow slides over a fixed one above an ink trench; where they overlap, a step; ② the test:
// a step up to a ledge (a block on it whose right face is only painted: the boot room), the trench again with a crow;
// ③ the twist: an L-shaped shadow: the wide overlap is too low, the narrow one climbs to the high ledge
const OV = [
  { a: [[22, 15, 26, 17]], b: [[14, 15, 18, 17]], rail: [8, 16, 19], at: 8, good: 16, g: 0 },
  { a: [[46, 13, 49, 17]], b: [[40, 16, 43, 17]], rail: [36, 42, 19], at: 36, good: 42, g: 1 },
  { a: [[91, 16, 99, 17]], b: [[84, 16, 88, 17]], rail: [80, 88, 19], at: 80, good: 88, g: 2 },
  { a: [[124, 16, 127, 17], [126, 12, 127, 15]], b: [[118, 12, 119, 17]], rail: [112, 120, 19], at: 112, good: 120, g: 3 }
];
const ovRows = (() => {
  const W = 170, H = 24, Gr = grid(W, H, '.');
  ground(Gr, 0, 20, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 6, 15, '?'); put(Gr, 8, 18, '1');
  ink(Gr, 21, 29, 21);
  ground(Gr, 30, 49, 19); put(Gr, 32, 18, 'c'); put(Gr, 34, 18, 'N'); put(Gr, 36, 18, '2');
  ground(Gr, 50, 70, 13); put(Gr, 54, 9, '*'); put(Gr, 57, 12, 'u'); put(Gr, 52, 10, 'o.o');
  nook(Gr, 64, 10, 13, 1);
  ground(Gr, 71, 89, 19); put(Gr, 73, 18, 'c'); put(Gr, 75, 18, 'a'); put(Gr, 77, 18, 'w'); put(Gr, 79, 15, '?'); put(Gr, 80, 18, '3');
  ink(Gr, 90, 99, 21); put(Gr, 95, 11, 'E'); put(Gr, 96, 9, 'M');
  ground(Gr, 100, 127, 19); put(Gr, 103, 18, 'c'); put(Gr, 106, 15, 'o.o.o'); put(Gr, 108, 15, 'h'); put(Gr, 110, 18, 'O'); put(Gr, 112, 18, '4');
  ink(Gr, 124, 127, 21);
  ground(Gr, 128, 150, 9); put(Gr, 131, 8, 'c'); put(Gr, 134, 5, 'o.o.o'); put(Gr, 140, 5, '?'); put(Gr, 143, 8, 'j'); put(Gr, 146, 4, 'M');
  ground(Gr, 151, W - 1, 19); put(Gr, 154, 18, 'u'); put(Gr, 158, 18, 'k'); put(Gr, 162, 18, 'G'); fillG(Gr, W - 1, 0, W - 1, 18, '#');
  return rowsOf(Gr);
})();
const OVER = k => ['piece', 'shad.overlap', OV[k]];
stamps.shadOver = { floor: 19, rows: ovRows, gold: GOLD, items: ['pick', 'power', 'power'], hidden: ['oneup'], doors: [{ to: 'boot@in', look: 'shadHatch' }], legend: Object.assign({}, COMMON, {
  n: SIGN('TWO SHADOWS: SOLID ONLY WHERE THEY OVERLAP. ROLL THE SCREEN'),
  N: SIGN('STAND AT THE SCREEN AND WALK: IT ROLLS WITH YOU'),
  O: SIGN('THE WIDEST OVERLAP ISN\'T ALWAYS THE TALLEST'),
  '1': OVER(0), '2': OVER(1), '3': OVER(2), '4': OVER(3),
  a: ['anchor', 'bootOut']
}) };
stamps.shadBootOld = oldRoom('over@bootOut', ['oneup']);
const L3 = { n: 3, name: 'Overlap Allowance', mapLabel: 'Overlap Allowance', arch: 'overlap', theme: 'shad_screens',
  gimmick: 'Two shadows on the wall are only solid where they overlap. Stand at a folding screen and walk to roll it: its shadow slides, and the dark overlap becomes a step. The last one: give up half the overlap for a taller step',
  hint: 'Roll the screen until the overlap is dark with a bright top: that\'s a step. Wide isn\'t always tall. A door\'s shadow with no door...',
  postcard: 'Brady! Two shadows overlapped and I stood on them. The clerk said that is not what they are for. I said it was exactly what I needed them for. ♥ C',
  enemies: [['shadRabbit', 2], ['shadHound', 1], ['shadFlea', 1], ['shadCrow', 2]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '35-4' } },
  areas: [
    { id: 'over', gen: 'room', theme: 'shad_screens', stamp: 'shadOver', shad: { overlap: true }, bottomKill: true },
    { id: 'boot', gen: 'room', role: 'secret', room: 'shadFoot', theme: 'shad_room_boot', stamp: 'shadBootOld', shad: { room: true } }
  ] };

/* ---------------- 35-4 Alterations While You Wait ---------------- */
// ① the teach: a cutter, the chalk mark, the slot; ② the test: a mirrored station up on a raised floor, the main slot
// further on; a second slot in the raised floor's face, off the path by the tell, takes the same cut (the staff
// kitchen); a station across an ink trench with a crow; ③ the twist: the last slot wants a long arm and a short body
const altRows = (() => {
  const W = 170, H = 24, Gr = grid(W, H, '.');
  ground(Gr, 0, 38, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 7, 15, '?'); put(Gr, 10, 18, '1'); put(Gr, 21, 18, 'Y');
  put(Gr, 24, 15, '*'); put(Gr, 28, 18, 'u'); put(Gr, 30, 15, '?'); put(Gr, 34, 18, 'c');
  fillG(Gr, 37, 17, 38, 17, '-');
  // the raised floor: a mirrored station; its right face holds the kitchen's slot (and the hollow behind it)
  ground(Gr, 39, 60, 15); put(Gr, 41, 14, 'N'); put(Gr, 50, 14, '2');
  fillG(Gr, 56, 16, 59, 18, '.'); put(Gr, 60, 18, 'V'); put(Gr, 57, 18, 'D'); put(Gr, 58, 17, 'A'); put(Gr, 61, 18, 'x');
  fillG(Gr, 63, 17, 63, 17, '-');
  ground(Gr, 61, 91, 19); put(Gr, 66, 18, 'U'); put(Gr, 70, 18, 'a'); put(Gr, 73, 18, 'w'); put(Gr, 79, 18, 'c'); put(Gr, 82, 18, '3');
  ink(Gr, 92, 96, 21); put(Gr, 94, 13, 'M');
  ground(Gr, 97, W - 1, 19); put(Gr, 100, 18, 'K'); put(Gr, 104, 18, 'j'); put(Gr, 108, 15, 'h'); put(Gr, 112, 15, 'o.o.o');
  put(Gr, 116, 18, 'c'); put(Gr, 118, 18, 'O'); put(Gr, 122, 18, '4'); put(Gr, 136, 18, 'J');
  put(Gr, 140, 18, 'u'); ink(Gr, 145, 149, 21); put(Gr, 147, 13, 'E'); put(Gr, 150, 15, '?');
  ground(Gr, 150, W - 1, 19); put(Gr, 154, 18, 'k'); put(Gr, 162, 18, 'G'); fillG(Gr, W - 1, 0, W - 1, 18, '#');
  return rowsOf(Gr);
})();
const CUT = o => ['piece', 'shad.cutter', o], SLOT = o => ['piece', 'shad.slot', o];
stamps.shadAlt = { floor: 19, rows: altRows, gold: GOLD, items: ['power', 'power', 'pick'], hidden: ['oneup'], doors: [{ to: 'kitchen@in', look: 'shadHatch' }], legend: Object.assign({}, COMMON, {
  n: SIGN('STAND ON THE CHALK, THROW: TRIMMED TO FIT THE SLOT'),
  N: SIGN('THIS CUTTER FACES THE OTHER WAY'),
  O: SIGN('THE LAST SLOT WANTS A LONG ARM: JUMP, THEN THROW'),
  '1': CUT({ cutter: 10, mark: 13, id: 'shad:t1' }), Y: SLOT({ id: 'shad:t1', h: 5 }),
  '2': CUT({ cutter: 50, mark: 47, id: 'shad:t2', also: ['shad:t2s'] }), U: SLOT({ id: 'shad:t2', h: 5 }), V: SLOT({ id: 'shad:t2s', accept: 'shad:t2', h: 3 }),
  '3': CUT({ cutter: 84, mark: 88, id: 'shad:t3' }), K: SLOT({ id: 'shad:t3', h: 5 }),
  '4': CUT({ cutter: 122, mark: 126, id: 'shad:t4', arm: true }), J: SLOT({ id: 'shad:t4', h: 5, arm: true }),
  a: ['anchor', 'kitchenOut']
}) };
stamps.shadKitchenOld = oldRoom('alt@kitchenOut', ['oneup']);
const L4 = { n: 4, name: 'Alterations While You Wait', mapLabel: 'Alterations', arch: 'trim', theme: 'shad_tailor',
  gimmick: 'A tailor\'s station: a lamp lays Brady\'s shadow out long behind him, under a paper cutter. Stand on the chalk mark and THROW: trimmed to fit, it posts through the mail slot and the wall opens. The last slot wants a long arm and a short body: jump on the mark and cut in the air',
  hint: 'Stand on the chalk cross, THROW, then walk into the slot. For the last one: JUMP on the chalk and THROW in the air. A door\'s shadow with no door...',
  postcard: 'Brady! A tailor here takes in shadows while you wait. Mine was a little long at the back. Now it fits like a glove. It is a very small glove. ♥ C',
  enemies: [['shadRabbit', 2], ['shadHound', 1], ['shadFlea', 1], ['shadCrow', 1]],
  mapCell: [3, 0], mapFrom: 2,
  exits: { main: { to: '35-5' } },
  areas: [
    { id: 'alt', gen: 'room', theme: 'shad_tailor', stamp: 'shadAlt', shad: { trim: true }, bottomKill: true },
    { id: 'kitchen', gen: 'room', role: 'secret', room: 'shadCup', theme: 'shad_room_kitchen', stamp: 'shadKitchenOld', shad: { room: true } }
  ] };

/* ---------------- 35-5 Joint Custody (the boss) ---------------- */
// the claims office: two clerks' lamps throw two shadows of Brady; stand where both shadows' feet are on their claim
// slots for a breath. The last desk: dashed hat marks line up one spot early (only the feet count). A block whose left
// face is only painted (the tell beside it): the cut-out workshop, before the boss; then the counter and the Understudy
const custRows = (() => {
  const W = 100, H = 22, Gr = grid(W, H, '.');
  ground(Gr, 0, W - 1, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 6, 15, '?'); put(Gr, 9, 18, '1'); put(Gr, 24, 18, 'r');
  put(Gr, 28, 15, '*'); put(Gr, 32, 18, 'u'); put(Gr, 36, 18, 'c'); put(Gr, 40, 15, '?'); put(Gr, 42, 18, 'N'); put(Gr, 44, 18, '2'); put(Gr, 60, 18, 'R');
  nook(Gr, 64, 16, 19, -1);
  put(Gr, 72, 18, 'a'); put(Gr, 75, 18, 'k'); ink(Gr, 80, 82, 21); put(Gr, 81, 15, 'E');
  put(Gr, 86, 18, 'l'); put(Gr, 92, 18, 'D'); fillG(Gr, W - 1, 0, W - 1, 18, '#');
  return rowsOf(Gr);
})();
const SPLIT = o => ['piece', 'shad.split', o];
stamps.shadCust = { floor: 19, rows: custRows, gold: GOLD, items: ['power', 'power'], doors: [{ to: 'cutout@in', look: 'shadHatch' }, { to: 'counter@in', look: 'shadDoor' }], legend: Object.assign({}, COMMON, {
  n: SIGN('TWO LAMPS, TWO SHADOWS. BOTH FEET ON THEIR SLOTS'),
  N: SIGN('THE HATS LINE UP FIRST. ONLY THE FEET COUNT'),
  '1': SPLIT({ lamps: [9, 21], at: 13, lock: 'shad:j1' }), r: GRILLE('shad:j1'),
  '2': SPLIT({ lamps: [44, 56], at: 52, decoy: 48, lock: 'shad:j2' }), R: GRILLE('shad:j2'),
  a: ['anchor', 'cutoutOut']
}) };
stamps.shadCutoutOld = oldRoom('cust@cutoutOut', ['star']);
const L5 = { n: 5, name: 'Joint Custody', mapLabel: 'Joint Custody', arch: 'lair', theme: 'shad_claims', boss: 'shad_understudy',
  gimmick: 'The Understudy, a shadow that signs for everything. Never stomp it: line its reach up with the hand slot and cross the lamp, lead its kick into the boot slot and cross back, then stand between the lamps till both halves\' feet are on their slots',
  hint: 'Phase 1: stand on the HAND slot, jump the reach, walk past the lamp. Phase 2: the same with the BOOT slot. Phase 3: stand between the lamps till both FEET slots glow, then jump the rush. A door\'s shadow with no door...',
  postcard: 'BRADY! You got your shadow back. I checked: bun and all. The Understudy signed for my umbrella on the way out. I am letting him keep it. He looked so pleased. ♥ C',
  enemies: [['shadRabbit', 1], ['shadCrow', 1]],
  mapCell: [4, 0], mapFrom: 3,
  exits: { main: { to: null } },
  areas: [
    { id: 'cust', gen: 'room', theme: 'shad_claims', stamp: 'shadCust', shad: { split: true }, bottomKill: true },
    { id: 'cutout', gen: 'room', role: 'secret', room: 'shadFish', theme: 'shad_room_cutout', stamp: 'shadCutoutOld', shad: { room: true } },
    { id: 'counter', gen: 'arena', role: 'arena', layout: 'counter', arenaW: 25, H: 18, roof: false, theme: 'shad_arena', shad: { boss: true } }
  ] };

Tour.amend('shad', { stamps, levels: [L1, L2, L3, L4, L5] });
SK.LEVELS = { L2_SHELVES, OV };

/* ---------------- the land's map: the department's long counter, its back offices off it ---------------- */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.shad = {
  labels: { '35-1': 'Lost Property', '35-2': 'Long Division', '35-3': 'Overlap Allowance', '35-4': 'Alterations', '35-5': 'Joint Custody' },
  w: 1520, h: 760,
  pal: { sea: '#3a1848', deep: '#2a1036', land: '#f0d478', light: '#fff0b4', path: '#f08470', beach: '#fff0b4', cliff: '#c8604e', roof: '#5a2a6a', wall: '#fffdf2' },
  sea: 'waves', tufts: 'none', trail: 'dots', bridge: 'steps', meadow: false, woods: false, foam: false, birds: false,
  // the department is a long counter in a T: the way in at its foot, the offices along the bar
  land: [[[640, 680], [620, 360], [180, 330], [160, 150], [1360, 130], [1380, 330], [900, 360], [880, 690]]],
  nodes: { start: [760, 620], '35-1': [760, 460, 's'], '35-2': [420, 250, 'n'], '35-3': [640, 220, 's'], '35-4': [940, 230, 'n'], '35-5': [1240, 240, 's'] },
  paths: { 'start>35-1': [[760, 540]], '35-1>35-2': [[560, 330]], '35-2>35-3': [[530, 190]], '35-3>35-4': [[790, 290]], '35-4>35-5': [[1090, 190]] },
  feat: [
    ['sprite', 'shadLampS', 300, 190, 30], ['sprite', 'shadUmbS', 700, 560, 26], ['sprite', 'shadDrawerS', 1100, 290, 26],
    ['sprite', 'shadPotS', 830, 410, 24], ['sprite', 'shadLampS', 1300, 180, 26], ['sprite', 'shadUmbS', 220, 280, 24]
  ],
  flora: ['rock'], density: 0,
  live: []
};
})();
