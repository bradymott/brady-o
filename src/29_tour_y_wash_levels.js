/* ============================================================
   WRONG SIDE OF THE WASH: the stages (world 26) and the land's map. Six stages, each a new kind of play, taught where
   a slip costs nothing, tested, then twisted; the last one is the boss.
   26-1 PEG LEGWORK (netclimb)  the drying nets: grip, climb four ways, squeeze through torn squares to the far face to
        pass the critters there; late on a Peg Beetle hung by his trousers blocks both faces until his peg is
        squeezed from behind. Room B1 (Cup with a Limp) up the tall net's top corner.
   (26-2 to 26-6 below.)
   ============================================================ */
(function () {
const C = Tour.countries.wash;
if (!C) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length) Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const pit = (Gr, x0, x1) => fillG(Gr, x0, 0, x1, Gr.length - 1, '.');
const rowsOf = Gr => Gr.map(r => r.join(''));
const stamps = {};
const SIGN = text => ['spawn', 'sign', { text }];
const NETP = (w, h, holes, o) => ['piece', 'wash.net', Object.assign({ w, h, holes: holes || [] }, o || {})];
const CRAWL = o => ['piece', 'wash.crawler', o];

/* ---------------- 26-1 Peg Legwork ---------------- */
// the roofs' tops are row 23. ① the teach: a little net over the roof (nothing to fall into), then a net over the
// first gap; ② torn squares and the far face (a moth patrols the near face's middle column), the heron's roof, the
// tall net up to the high roof (the window ledge with the moth's peephole at its top left: room B1); ③ the covered
// passage: the Peg Beetle's trouser wall across the long net (his peg round the back), then the last net with a second
// beetle and critters on both faces, the end roof and the gate
const pegRows = (() => {
  const W = 240, H = 30, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 21, 23); put(Gr, 3, 22, '@'); put(Gr, 6, 22, 'k'); put(Gr, 19, 22, 'x');
  put(Gr, 10, 15, '1'); put(Gr, 11, 16, 'o.o.o.o'); put(Gr, 14, 12, '?');
  put(Gr, 20, 13, '2'); put(Gr, 22, 17, 'o.o.o.o.o'); put(Gr, 26, 15, '*');
  ground(Gr, 30, 54, 23); put(Gr, 36, 22, 'c'); put(Gr, 40, 19, '?'); put(Gr, 46, 22, 'l'); put(Gr, 50, 22, 'K'); put(Gr, 33, 22, 'x');
  // ② the far face
  put(Gr, 53, 11, '3'); put(Gr, 61, 11, 'm'); put(Gr, 60, 17, 'n'); put(Gr, 56, 12, 'o.o'); put(Gr, 64, 12, 'o.o');
  ground(Gr, 69, 86, 23); put(Gr, 71, 22, 'c'); put(Gr, 80, 22, 'r'); put(Gr, 76, 19, 'o.o.o');
  put(Gr, 85, 6, '4'); put(Gr, 88, 9, 'e'); put(Gr, 96, 15, 'q'); put(Gr, 90, 18, 'o.o.o'); put(Gr, 92, 8, 'o.o.o');
  // the window ledge above the tall net's top left: only the net reaches it (the peephole tell; B1's skylight)
  fillG(Gr, 77, 5, 83, 5, 'H'); put(Gr, 78, 4, 'A'); put(Gr, 81, 4, 'u'); put(Gr, 80, 2, 'o.o');
  ground(Gr, 101, 118, 13); put(Gr, 104, 12, 'c'); put(Gr, 108, 12, 'j'); put(Gr, 113, 9, '?'); put(Gr, 112, 12, 'x');
  ground(Gr, 119, 122, 16); ground(Gr, 123, 126, 19); ground(Gr, 127, 140, 23);
  put(Gr, 128, 22, 'c'); put(Gr, 131, 22, 'a'); put(Gr, 134, 22, 'l'); put(Gr, 137, 22, 'K'); put(Gr, 120, 12, 'f');
  // ③ the covered passage: the Peg Beetle's trouser wall across the long net
  fillG(Gr, 139, 4, 172, 6, 'H');
  put(Gr, 141, 7, '5'); put(Gr, 156, 7, 'Y'); put(Gr, 145, 11, 'w'); put(Gr, 151, 10, 'z'); put(Gr, 158, 18, 'R');
  put(Gr, 144, 15, 'o.o.o'); put(Gr, 160, 10, 'o.o.o'); put(Gr, 163, 16, 'o.o.o');
  ground(Gr, 169, 186, 23); put(Gr, 172, 22, 'c'); put(Gr, 176, 19, '?');
  // the last net: a second beetle, critters on both faces
  fillG(Gr, 185, 4, 218, 7, 'H');
  put(Gr, 187, 8, '6'); put(Gr, 202, 8, 'J'); put(Gr, 195, 10, 'U'); put(Gr, 199, 13, 'V'); put(Gr, 208, 9, 'E'); put(Gr, 211, 17, 'N');
  put(Gr, 190, 15, 'o.o.o'); put(Gr, 204, 12, 'o.o.o');
  ground(Gr, 215, W - 1, 23); put(Gr, 218, 22, 'c'); put(Gr, 222, 22, 'r'); fillG(Gr, 226, 20, 227, 22, 'H'); put(Gr, 226, 16, 'P'); put(Gr, 233, 22, 'G');
  fillG(Gr, W - 1, 0, W - 1, 22, 'H');
  return rowsOf(Gr);
})();
const PEG = {
  k: SIGN('A DRYING NET! PUSH UP INTO IT TO GRIP. CLIMB WITH THE STICK. JUMP TO LET GO'),
  K: SIGN('TORN SQUARES: PRESS JUMP IN ONE TO SQUEEZE THROUGH TO THE FAR SIDE. ONLY A CRITTER ON YOUR SIDE CAN TOUCH YOU'),
  x: ['decor', 'washChimney'], l: ['enemy', 'washLamb'], r: ['enemy', 'washHeron'], f: ['enemy', 'washMoth'],
  '1': NETP(8, 5, []), '2': NETP(12, 7, []),
  '3': NETP(18, 9, [[4, 4], [13, 4]]),
  m: CRAWL({ kind: 'moth', face: 0, ay: 8, speed: 1.3 }), n: CRAWL({ kind: 'beetle', face: 1, ax: 4, speed: 1.0 }),
  '4': NETP(18, 14, [[4, 10], [9, 4], [14, 8]]),
  e: CRAWL({ kind: 'beetle', face: 0, ax: 6, speed: 1.1 }), q: CRAWL({ kind: 'moth', face: 1, ay: -6, speed: 1.2 }),
  A: ['spawn', 'portal', { kind: 'door', look: 'washCupboard', targetRef: 'basket@in' }], u: ['piece', 'wash.peep', { dy: 1 }],
  j: ['enemy', 'washHeron'], a: ['anchor', 'basketOut'],
  '5': NETP(30, 13, [[6, 7], [11, 3], [20, 5], [25, 9]]),
  Y: ['piece', 'wash.beetle', { h: 13, side: -1, clip: 1, id: 'beetle1' }],
  w: CRAWL({ kind: 'beetle', face: 0, ay: 6, speed: 1.1 }), z: CRAWL({ kind: 'moth', face: 1, ay: 6, speed: 1.0, phase: 1.5 }),
  '6': NETP(30, 12, [[5, 4], [10, 8], [19, 3], [24, 7]]),
  J: ['piece', 'wash.beetle', { h: 12, side: -1, clip: 1, id: 'beetle2' }],
  U: CRAWL({ kind: 'beetle', face: 1, ax: 4, speed: 1.3 }), V: CRAWL({ kind: 'moth', face: 0, ay: 5, speed: 1.2 }),
  E: CRAWL({ kind: 'beetle', face: 0, ay: 8, speed: 1.2 }), N: CRAWL({ kind: 'moth', face: 1, ax: -3, speed: 1.0 })
};
stamps.washPeg = { floor: 23, rows: pegRows, legend: PEG, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power', 'power'] };
// B1's room: a stand-in stamp (the room kind builds its own place from it)
stamps.washBasket = { floor: 12, rows: [
  '############################',
  '#..........................#',
  '#..........................#',
  '#..........................#',
  '#..........................#',
  '#..........................#',
  '#..........................#',
  '#..........................#',
  '#..........................#',
  '#..........................#',
  '#..........................#',
  '#.@..D..................?..#',
  '############################',
  '############################'], items: ['oneup'], doors: [{ to: 'roofs@basketOut', look: 'washChute' }] };
const L1 = { n: 1, name: 'Peg Legwork', mapLabel: 'Peg Legwork', arch: 'netclimb', theme: 'wash_roofs',
  gimmick: 'Drying nets strung between the rooftops: push up to grip, climb any way, squeeze through the torn squares to the far side to slip past the critters. Late on, a Peg Beetle hangs by his trousers across both sides',
  hint: 'Only a critter on your side of the net can touch you. The beetle\'s peg is on the far side: go round the back and press THROW. Something peeps out of a window ledge high over the tall net...',
  postcard: 'Brady! Piwi hung the laundry over two rooftops and a whole street lives behind it. I climbed a pillowcase. ♥ C',
  enemies: [['washLamb', 3], ['washHeron', 3], ['washMoth', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '26-2' } },
  areas: [
    { id: 'roofs', gen: 'room', theme: 'wash_roofs', stamp: 'washPeg', camera: 'free', bottomKill: true },
    { id: 'basket', gen: 'room', role: 'secret', theme: 'wash_room_wicker', stamp: 'washBasket', room: 'washCups' }
  ] };

/* ---------------- the shared room stand-in ---------------- */
// a secret room's stand-in stamp (the room kind builds its own place from it): its door out, its prize
const roomStamp = (out, look, items) => ({ floor: 12, rows: [
  '############################', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#.@..D..................?..#',
  '############################', '############################'], items: items || ['oneup'], doors: [{ to: out, look: look || 'washChute' }] });

/* ---------------- 26-2 Cold Wash Only ---------------- */
// roof tops on row 21 (then 19, then 15). ① the teach: a sweater straight off the first roof, a soft heap under it;
// ② a sweater a hop up over a real gap, the safe drop by the hanky (room B2, the launderette), two sweaters in a
// row; ③ the twist: down through a hole in the slab onto the RIGHT shoulder of the last sweater, whose right sleeve is
// short: walk back to the left shoulder and run the whole body to make it reach
const coldRows = (() => {
  const W = 220, H = 26, Gr = grid(W, H, '.');
  ground(Gr, 0, 20, 21); put(Gr, 3, 20, '@'); put(Gr, 6, 20, 'k'); put(Gr, 12, 17, '?'); put(Gr, 16, 20, 'x');
  put(Gr, 21, 21, '1'); ground(Gr, 21, 34, 25); ground(Gr, 21, 22, 23); put(Gr, 27, 19, 'o.o.o'); put(Gr, 31, 17, '*');
  ground(Gr, 35, 60, 21); put(Gr, 38, 20, 'c'); put(Gr, 48, 20, 'l'); put(Gr, 54, 20, 'x');
  pit(Gr, 61, 76); put(Gr, 62, 19, '2'); put(Gr, 68, 17, 'o.o.o.o');
  ground(Gr, 77, 95, 19); put(Gr, 88, 18, 'r'); put(Gr, 84, 15, '?');
  // the safe drop: a gap with a hanky by it; down at the bottom, the launderette
  pit(Gr, 96, 98); fillG(Gr, 96, 25, 98, 25, 'z'); put(Gr, 95, 16, 'u');
  ground(Gr, 99, 115, 19); put(Gr, 102, 18, 'c'); put(Gr, 108, 18, 'a');
  pit(Gr, 116, 146); put(Gr, 117, 17, '3'); put(Gr, 132, 15, '4'); put(Gr, 140, 9, 'f'); put(Gr, 140, 12, 'R'); put(Gr, 124, 14, 'o.o.o');
  ground(Gr, 147, 160, 15); put(Gr, 150, 14, 'c'); put(Gr, 156, 14, 'l');
  // ③ up the steps onto the slab; the hole; the last sweater under it; the wall at the slab's end (no way round)
  ground(Gr, 161, 162, 13); pit(Gr, 163, 177); fillG(Gr, 163, 11, 169, 12, 'H'); fillG(Gr, 172, 11, 178, 12, 'H'); fillG(Gr, 179, 2, 180, 12, 'H');
  put(Gr, 164, 10, 'K'); put(Gr, 167, 15, '5');
  ground(Gr, 178, W - 1, 15); fillG(Gr, 178, 11, 178, 12, 'H'); put(Gr, 184, 14, 'c'); put(Gr, 196, 14, 'r'); fillG(Gr, 204, 13, 205, 14, 'H'); put(Gr, 204, 10, 'P'); put(Gr, 214, 14, 'G');
  fillG(Gr, W - 1, 0, W - 1, 14, 'H');
  return rowsOf(Gr);
})();
const COLD = {
  k: SIGN('A WET SWEATER! WALK ALONG IT AND THE SLEEVE ON THAT SIDE STRETCHES OUT. WALK ON TO THE CUFF, THEN JUMP'),
  K: SIGN('THE LAST SWEATER\'S RIGHT SLEEVE IS SHORT: IT ONLY REACHES IF YOU RUN THE WHOLE BODY FROM THE OTHER SHOULDER'),
  x: ['decor', 'washChimney'], l: ['enemy', 'washLamb'], r: ['enemy', 'washHeron'], f: ['enemy', 'washMoth'],
  '1': ['piece', 'wash.sweater', { w: 5, maxR: 9, kR: 2, col: '#5ab08a' }],
  '2': ['piece', 'wash.sweater', { w: 5, maxR: 10, kR: 3, col: '#e8744a' }],
  '3': ['piece', 'wash.sweater', { w: 5, maxR: 8, kR: 3, col: '#6a8ad8' }],
  '4': ['piece', 'wash.sweater', { w: 5, maxR: 9, kR: 3, col: '#d86a9a' }],
  '5': ['piece', 'wash.sweater', { w: 5, maxL: 2, kL: 1, maxR: 7, kR: 1.6, col: '#e8442e' }],
  z: ['seam', 'bottom', 'launder@in'], u: ['piece', 'wash.peep', {}], a: ['anchor', 'launderOut']
};
stamps.washCold = { floor: 21, rows: coldRows, legend: COLD, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power'] };
stamps.washLaunder = roomStamp('tub@launderOut', 'washCupboard');
const L2 = { n: 2, name: 'Cold Wash Only', mapLabel: 'Cold Wash Only', arch: 'sweater', theme: 'wash_tub',
  gimmick: 'Wet sweaters pegged up by the shoulders: walk along one and your weight stretches the sleeve on that side out flat, far enough to reach the next roof. Jump off the cuff',
  hint: 'The sleeve stretches two tiles for every tile you walk across the body. A short sleeve needs the whole run, from the other shoulder. One gap has a hanky by it...',
  postcard: 'Brady! A sweater on the line stretched all the way to the next roof. It was yours. It fits Pupo now. ♥ C',
  enemies: [['washLamb', 3], ['washHeron', 2], ['washMoth', 1]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '26-3' } },
  areas: [
    { id: 'tub', gen: 'room', theme: 'wash_tub', stamp: 'washCold', camera: 'free', bottomKill: true },
    { id: 'launder', gen: 'room', role: 'secret', theme: 'wash_room_launderette', stamp: 'washLaunder', room: 'washWindows' }
  ] };

/* ---------------- 26-3 Loose End ---------------- */
// floors on row 21 (then 18). ① the teach: a seam over a soft heap; ② a seam under snapping peg jaws, a seam whose
// hem steps up (jump while holding the thread); the chimney with the hanky: its left face is only a painted cloth
// (room B3, the peg loft, inside); ③ a long seam with a lamb coming the other way under the jaws; the last hem with
// two threads: the navy one under his feet drops him to a ledge to try again, the red one runs along the bridge
const looseRows = (() => {
  const W = 214, H = 26, Gr = grid(W, H, '.');
  ground(Gr, 0, 18, 21); put(Gr, 3, 20, '@'); put(Gr, 6, 20, 'k'); put(Gr, 12, 17, '?');
  put(Gr, 18, 20, '1'); ground(Gr, 19, 28, 25); ground(Gr, 19, 20, 23); put(Gr, 22, 17, 'o.o.o');
  ground(Gr, 29, 55, 21); put(Gr, 32, 20, 'c'); put(Gr, 40, 17, '?'); put(Gr, 46, 20, 'l');
  put(Gr, 55, 20, '2'); pit(Gr, 56, 67); put(Gr, 59, 15, 'j'); put(Gr, 64, 15, 'J'); put(Gr, 61, 17, '*');
  ground(Gr, 68, 95, 21); put(Gr, 72, 20, 'c'); put(Gr, 84, 20, 'r'); put(Gr, 78, 17, 'o.o.o');
  put(Gr, 95, 20, '3'); pit(Gr, 96, 107); put(Gr, 101, 13, 'o.o.o');
  ground(Gr, 108, 140, 18); put(Gr, 111, 17, 'c');
  // the chimney: a hollow with its left face only a painted cloth; the cupboard door inside; a crate to climb it
  fillG(Gr, 119, 13, 123, 17, 'H'); fillG(Gr, 120, 14, 122, 17, '.'); fillG(Gr, 119, 14, 119, 17, 'F'); put(Gr, 121, 17, 'A'); fillG(Gr, 116, 15, 116, 17, 'B'); put(Gr, 119, 15, 'u');
  put(Gr, 128, 17, 'a'); put(Gr, 133, 17, 'r');
  // ③ the long seam with a lamb on the far side and jaws over it
  put(Gr, 140, 17, '4'); pit(Gr, 141, 154); put(Gr, 145, 12, 'n'); put(Gr, 151, 12, 'N'); put(Gr, 147, 14, 'R');
  ground(Gr, 155, 175, 18); put(Gr, 158, 17, 'c'); put(Gr, 156, 17, 'l'); put(Gr, 165, 14, '?'); put(Gr, 170, 17, 'K');
  // the last hem: the post on a thin floor; under it the retry ledge, steps back up to the post
  fillG(Gr, 173, 19, 174, 25, '.'); fillG(Gr, 173, 18, 174, 18, 'H'); ground(Gr, 173, 174, 23); fillG(Gr, 173, 21, 173, 22, 'H'); fillG(Gr, 175, 18, 176, 25, 'H'); put(Gr, 176, 17, '5'); pit(Gr, 177, 188);
  ground(Gr, 189, W - 1, 18); put(Gr, 192, 17, 'c'); fillG(Gr, 198, 15, 199, 17, 'H'); put(Gr, 198, 12, 'P'); put(Gr, 207, 17, 'G');
  fillG(Gr, W - 1, 0, W - 1, 17, 'H');
  return rowsOf(Gr);
})();
const LOOSE = {
  k: SIGN('A LOOSE THREAD! STAND BY IT, HOLD THROW AND WALK: THE SEAM UNZIPS INTO A STRIP OF FLOOR. LET GO AND THE FLOOR STAYS'),
  K: SIGN('THE LAST HEM HAS TWO THREADS. THE RED ONE RUNS ALONG THE BRIDGE. THE NAVY ONE RUNS UNDER YOUR OWN FEET...'),
  l: ['enemy', 'washLamb'], r: ['enemy', 'washHeron'],
  '1': ['piece', 'wash.seam', { len: 10 }], '2': ['piece', 'wash.seam', { len: 12 }], '3': ['piece', 'wash.seam', { len: 12, rise: 4 }],
  '4': ['piece', 'wash.seam', { len: 14 }], '5': ['piece', 'wash.seam', { len: 12, trap: 2 }],
  j: ['piece', 'wash.jaws', { period: 2.8, reach: 4 }], J: ['piece', 'wash.jaws', { period: 2.8, phase: 1.4, reach: 4 }],
  n: ['piece', 'wash.jaws', { period: 3.0, reach: 5 }], N: ['piece', 'wash.jaws', { period: 3.0, phase: 1.5, reach: 5 }],
  A: ['spawn', 'portal', { kind: 'door', look: 'washCupboard', targetRef: 'loft@in' }], u: ['piece', 'wash.peep', { hanky: false }], a: ['anchor', 'loftOut']
};
stamps.washLoose = { floor: 21, rows: looseRows, legend: LOOSE, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power'] };
stamps.washLoft = roomStamp('hem@loftOut', 'washChute');
const L3 = { n: 3, name: 'Loose End', mapLabel: 'Loose End', arch: 'unzip', theme: 'wash_hem',
  gimmick: 'Loose threads at the edge of every gap: hold THROW on one and walk, and the seam unzips into a strip of floor ahead of you. Snapping peg jaws hang over the long ones',
  hint: 'Hold THROW and keep walking; let go and the floor stays. The last hem has two threads: follow each one with your eye. One chimney\'s side is only painted cloth...',
  postcard: 'Brady! I pulled one loose thread and walked across a whole street on it. Piwi\'s curtains are now a bridge. ♥ C',
  enemies: [['washLamb', 2], ['washHeron', 2]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '26-4' } },
  areas: [
    { id: 'hem', gen: 'room', theme: 'wash_hem', stamp: 'washLoose', camera: 'free', bottomKill: true },
    { id: 'loft', gen: 'room', role: 'secret', theme: 'wash_room_loft', stamp: 'washLoft', room: 'washPegs' }
  ] };

/* ---------------- 26-4 The Cling Section ---------------- */
// floors on row 23. ① the teach: a rug, a tall wall with a felt patch (two sticks get you up); ② a pit and a wall:
// stick on the far side, two up; a wall whose felt is cut in two by a bare washing label; the high felt by the
// hanky reaches a window (room B4, lost property); ③ the last climb: felt, then labels too tall to cross, the wool
// sill on the other wall for a fresh charge, the last felt, the top
const clingRows = (() => {
  const W = 190, H = 28, Gr = grid(W, H, '.');
  ground(Gr, 0, 24, 23); put(Gr, 3, 22, '@'); put(Gr, 7, 22, 'k'); put(Gr, 16, 22, 'w'); put(Gr, 16, 19, '?');
  fillG(Gr, 25, 13, 27, 22, 'H'); put(Gr, 25, 14, '1'); put(Gr, 26, 10, 'o.o');
  ground(Gr, 28, 50, 23); put(Gr, 31, 22, 'c'); put(Gr, 36, 19, '?'); put(Gr, 38, 22, 'l'); put(Gr, 44, 22, 'Y');
  pit(Gr, 51, 53); fillG(Gr, 54, 12, 56, 22, 'H'); ground(Gr, 54, 56, 23); put(Gr, 54, 13, '2'); put(Gr, 55, 9, '*');
  ground(Gr, 57, 92, 23); put(Gr, 60, 22, 'c'); put(Gr, 74, 22, 'O'); put(Gr, 66, 22, 'l');
  // the wall with a label between two felts; on its top a rug, and over there a felt block hung from above: stick on
  // it and hop up to the window ledge (only the felt reaches it: the hanky's peephole is by the window)
  fillG(Gr, 80, 11, 82, 22, 'H'); put(Gr, 80, 19, '3'); put(Gr, 80, 16, 'E'); put(Gr, 80, 12, '4'); put(Gr, 80, 10, 'V');
  fillG(Gr, 84, 0, 86, 8, 'H'); put(Gr, 84, 4, '7');
  fillG(Gr, 78, 5, 82, 5, 'H'); put(Gr, 80, 4, 'A'); put(Gr, 82, 3, 'u'); put(Gr, 79, 2, 'o.o');
  ground(Gr, 93, 118, 23); put(Gr, 96, 22, 'c'); put(Gr, 102, 22, 'a'); put(Gr, 106, 18, '?'); put(Gr, 110, 22, 'r'); put(Gr, 100, 15, 'f');
  // ③ the last climb: two walls facing; the wool sill on the left wall
  fillG(Gr, 119, 6, 120, 19, 'H'); ground(Gr, 119, 127, 23); put(Gr, 122, 22, 'K'); put(Gr, 121, 22, 'Z');
  fillG(Gr, 121, 16, 124, 16, 'H'); put(Gr, 121, 15, 'U');
  fillG(Gr, 128, 10, 130, 22, 'H'); put(Gr, 128, 18, '5'); put(Gr, 128, 15, 'N'); put(Gr, 128, 11, '6'); put(Gr, 125, 11, 'R');
  ground(Gr, 131, W - 1, 23); fillG(Gr, 128, 10, 135, 10, 'H'); put(Gr, 134, 9, 'o.o');
  put(Gr, 140, 22, 'c'); put(Gr, 150, 22, 'l'); fillG(Gr, 160, 20, 161, 22, 'H'); put(Gr, 160, 16, 'P'); put(Gr, 172, 22, 'r'); put(Gr, 182, 22, 'G');
  fillG(Gr, W - 1, 0, W - 1, 22, 'H');
  return rowsOf(Gr);
})();
const CLINGL = {
  k: SIGN('SCUFF UP AND DOWN THE WOOL RUG TILL YOUR SOCKS CRACKLE, THEN LEAP AT A FELT PATCH: YOU STICK! JUMP TO SPRING OFF. TWO SPARKS A CHARGE'),
  K: SIGN('WHITE LABELS DON\'T HOLD. RUN OUT OF SPARKS? LAND ON THE WOOL SILL FOR A FRESH CHARGE'),
  w: ['piece', 'wash.wool', { w: 9 }], O: ['piece', 'wash.wool', { w: 6 }], Y: ['piece', 'wash.wool', { w: 7 }], Z: ['piece', 'wash.wool', { w: 7 }], V: ['piece', 'wash.wool', { w: 3 }],
  '1': ['piece', 'wash.felt', { w: 1, h: 8, col: '#4a9a6a' }], '2': ['piece', 'wash.felt', { w: 1, h: 9, col: '#c8643a' }],
  '3': ['piece', 'wash.felt', { w: 1, h: 4, col: '#6a7ad8' }], E: ['piece', 'wash.label', { w: 1, h: 3 }], '4': ['piece', 'wash.felt', { w: 1, h: 4, col: '#6a7ad8' }],
  U: ['piece', 'wash.wool', { w: 4 }],
  '7': ['piece', 'wash.felt', { w: 1, h: 5, col: '#e8a83a' }],
  '5': ['piece', 'wash.felt', { w: 1, h: 5, col: '#4a9a6a' }], N: ['piece', 'wash.label', { w: 1, h: 3 }], '6': ['piece', 'wash.felt', { w: 1, h: 4, col: '#c8643a' }],
  l: ['enemy', 'washLamb'], r: ['enemy', 'washHeron'], f: ['enemy', 'washMoth'],
  A: ['spawn', 'portal', { kind: 'door', look: 'washCupboard', targetRef: 'lost@in' }], u: ['piece', 'wash.peep', {}], a: ['anchor', 'lostOut']
};
stamps.washCling = { floor: 23, rows: clingRows, legend: CLINGL, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power'] };
stamps.washLost = roomStamp('lint@lostOut', 'washChute');
const L4 = { n: 4, name: 'The Cling Section', mapLabel: 'The Cling Section', arch: 'cling', theme: 'wash_lint',
  gimmick: 'Inside the tumble dryer\'s lint trap: scuff along a wool rug until your socks crackle, then leap at a felt patch and stick where you land. Two sparks a charge; the white labels don\'t hold',
  hint: 'Scuff back and forth on the wool, jump at the felt, jump again to spring off. Out of sparks halfway up? A wool sill gives a fresh charge. A high felt patch by a hanky leads to a window...',
  postcard: 'Brady! You came out of the dryer stuck to a sock. Piwi says it suits you. I say it\'s the sock that looks lucky. ♥ C',
  enemies: [['washLamb', 3], ['washHeron', 2], ['washMoth', 1]],
  mapCell: [3, 0], mapFrom: 2,
  exits: { main: { to: '26-5' } },
  areas: [
    { id: 'lint', gen: 'room', theme: 'wash_lint', stamp: 'washCling', camera: 'free', bottomKill: true },
    { id: 'lost', gen: 'room', role: 'secret', theme: 'wash_room_counter', stamp: 'washLost', room: 'washBag' }
  ] };

/* ---------------- 26-5 Pocket Address ---------------- */
// floors on row 21. Every pocket's lining matches exactly one other: in one, out of its twin. ① the teach: one
// pocket, its twin up on the high shelf; ② three pockets by the wall, three shelves beyond it (a wrong pocket drops
// you on a heap of Piwi's socks in sight of the right lining); the gold-lined pocket by the hanky (room B5, the drying
// room); ③ two pockets that share a mint stripe: only one has the scalloped hem of the twin on the far side
const pocketRows = (() => {
  const W = 200, H = 26, Gr = grid(W, H, '.');
  ground(Gr, 0, 30, 21); put(Gr, 3, 20, '@'); put(Gr, 6, 20, 'k'); put(Gr, 10, 17, '?');
  put(Gr, 16, 19, '1'); put(Gr, 20, 20, 'q'); fillG(Gr, 26, 4, 30, 20, 'H');
  // the high shelf behind the wall: the teach pocket's twin
  fillG(Gr, 31, 9, 44, 9, 'H'); put(Gr, 38, 7, '2'); put(Gr, 41, 8, 'f'); put(Gr, 34, 7, '*');
  ground(Gr, 31, 70, 21); put(Gr, 46, 20, 'c'); put(Gr, 40, 20, 'l');
  // ② three pockets let into the waistband before the tall wall (and the sock heap's twin): jump over the wrong
  // ones, drop into the right one; beyond it the basin of socks with three shelves:
  // only the check shelf is level with the second wall's top (the way on); the others drop you in the basin
  put(Gr, 50, 22, '0'); put(Gr, 45, 20, 'p'); put(Gr, 56, 22, '3'); put(Gr, 61, 22, '4'); put(Gr, 66, 22, '5'); put(Gr, 59, 20, 'N'); put(Gr, 64, 20, 'O'); put(Gr, 69, 20, 'U'); fillG(Gr, 71, 3, 74, 20, 'H');
  ground(Gr, 75, 98, 21); fillG(Gr, 75, 8, 80, 8, 'H'); put(Gr, 78, 6, '6'); put(Gr, 76, 7, 'd');
  fillG(Gr, 83, 13, 88, 13, 'H'); put(Gr, 86, 11, '7'); put(Gr, 84, 12, 'e');
  put(Gr, 90, 19, 'A'); put(Gr, 94, 20, 'j'); put(Gr, 81, 20, 'j'); put(Gr, 87, 20, 'w');
  fillG(Gr, 91, 7, 98, 7, 'H'); put(Gr, 92, 5, '8'); put(Gr, 96, 6, 'i'); put(Gr, 95, 3, 'o.o');
  fillG(Gr, 99, 7, 100, 20, 'H');
  ground(Gr, 101, 150, 21); put(Gr, 104, 20, 'c'); put(Gr, 112, 20, 'r'); put(Gr, 110, 16, '?');
  // the drying room's pocket: gold lining, by the hanky, hung over the path: up off the crate and drop in
  put(Gr, 122, 16, '9'); fillG(Gr, 118, 18, 118, 20, 'H'); put(Gr, 126, 14, 'u'); put(Gr, 130, 20, 'a');
  // ③ the shared stripe: two mint pockets; beyond the wall a basin, and the scalloped one's shelf by the third wall's top
  put(Gr, 136, 20, 'K'); put(Gr, 138, 20, 't'); put(Gr, 141, 22, 'M'); put(Gr, 144, 20, 'x'); put(Gr, 146, 22, 'X'); put(Gr, 149, 20, 'V'); fillG(Gr, 151, 3, 154, 20, 'H');
  ground(Gr, 155, 170, 21); fillG(Gr, 155, 10, 162, 10, 'H'); put(Gr, 156, 8, 'Y'); put(Gr, 160, 9, 'm'); put(Gr, 161, 6, 'R');
  fillG(Gr, 157, 15, 161, 15, 'H'); put(Gr, 159, 13, 'Z'); put(Gr, 157, 14, 'n'); put(Gr, 166, 19, 'E'); put(Gr, 168, 20, 'j');
  fillG(Gr, 163, 10, 164, 20, 'H');
  ground(Gr, 165, W - 1, 21); fillG(Gr, 165, 10, 166, 20, 'H'); put(Gr, 172, 20, 'c'); put(Gr, 180, 20, 'l'); fillG(Gr, 184, 18, 185, 20, 'H'); put(Gr, 184, 14, 'P'); put(Gr, 192, 20, 'G');
  fillG(Gr, W - 1, 0, W - 1, 20, 'H');
  return rowsOf(Gr);
})();
const PK = (lining, hem, to, col) => ['piece', 'wash.pocket', { lining, hem: hem || 'straight', to, col }];
const POCK = {
  k: SIGN('JUMP DOWN INTO A POCKET AND YOU POP OUT OF THE POCKET WITH THE SAME LINING. WATCH THE LIPS FLOP OPEN TO SHOW IT'),
  K: SIGN('TWO POCKETS HERE SHARE A MINT STRIPE. LOOK AT THE HEMS TOO...'),
  l: ['enemy', 'washLamb'], r: ['enemy', 'washHeron'], j: ['decor', 'washBasket'], w: ['anchor', 'pS'], x: ['anchor', 'pM'], N: ['anchor', 'p3'], O: ['anchor', 'p4'], U: ['anchor', 'p5'], V: ['anchor', 'pX'],
  '1': PK('dots', 'straight', 'pockets@p2', '#3e4f8e'), q: ['anchor', 'p1'], '2': PK('dots', 'straight', 'pockets@p1', '#7a5a8a'), f: ['anchor', 'p2'], 
  '3': PK('mint', 'straight', 'pockets@p6', '#4a7a6a'), '4': PK('check', 'straight', 'pockets@p8', '#a8784a'), '5': PK('sun', 'straight', 'pockets@p7', '#3e4f8e'),
  '6': PK('mint', 'straight', 'pockets@p3', '#7a5a8a'), d: ['anchor', 'p6'],
  '7': PK('sun', 'straight', 'pockets@p5', '#4a7a6a'), e: ['anchor', 'p7'],
  '8': PK('check', 'straight', 'pockets@p4', '#a8784a'), i: ['anchor', 'p8'],
  // the sock heap's way back: a pocket in the basin and its twin by the three
  A: PK('sock', 'straight', 'pockets@pS0', '#7a6a5a'), '0': PK('sock', 'straight', 'pockets@pS', '#7a6a5a'), p: ['anchor', 'pS0'],
  '9': PK('gold', 'scallop', 'drying@in', '#c86a3a'), u: ['piece', 'wash.peep', {}], a: ['anchor', 'dryingOut'],
  M: PK('mint', 'straight', 'pockets@pZ', '#3e4f8e'), X: PK('mint', 'scallop', 'pockets@pY', '#4a7a6a'),
  Y: PK('mint', 'scallop', 'pockets@pX', '#7a5a8a'), m: ['anchor', 'pY'], Z: PK('mint', 'straight', 'pockets@pM', '#a8784a'), n: ['anchor', 'pZ'],
  E: PK('sock', 'straight', 'pockets@pT', '#7a6a5a'), t: ['anchor', 'pT']
};
stamps.washPockets = { floor: 21, rows: pocketRows, legend: POCK, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power'] };
stamps.washDrying = roomStamp('pockets@dryingOut', 'washCupboard');
const L5 = { n: 5, name: 'Pocket Address', mapLabel: 'Pocket Address', arch: 'pockets', theme: 'wash_pockets',
  gimmick: 'Trousers and aprons on the evening lines, all pockets: jump into one and you pop out of the pocket with the matching lining. Their lips flop open now and then to show it',
  hint: 'Watch the lips: the lining tells you where a pocket goes. A wrong pocket only drops you on Piwi\'s socks. Two pockets late on share a stripe: check the hems. One pocket is lined with gold...',
  postcard: 'Brady! I jumped into a pocket in Piwi\'s trousers and came out of his apron. He has been looking for that thimble for years. ♥ C',
  enemies: [['washLamb', 2], ['washHeron', 1]],
  mapCell: [4, 0], mapFrom: 3,
  exits: { main: { to: '26-6' } },
  areas: [
    { id: 'pockets', gen: 'room', theme: 'wash_pockets', stamp: 'washPockets', camera: 'free', bottomKill: true },
    { id: 'drying', gen: 'room', role: 'secret', theme: 'wash_room_drying', stamp: 'washDrying', room: 'washSeats' }
  ] };

/* ---------------- 26-6 Fitted Sheet for One (the boss) ---------------- */
// the linen cupboard, floor row 16 under a long shelf (row 11): two loose sheets hang across the way, each with a
// bedpost beyond it (jump its snapping corner and it hooks the post: the sheet pulls aside); a hole in the shelf by
// the hanky lets you up onto the top shelf run (towels, snapping jaws, two postcards) to the sock drawer (Sock
// Divorce); the drawer lets you out by the bedroom door. Then the bed.
const cupRows = (() => {
  const W = 76, H = 20, Gr = grid(W, H, '#');
  fillG(Gr, 1, 13, W - 2, 15, '.'); fillG(Gr, 1, 1, 11, 15, '.'); fillG(Gr, 12, 6, W - 6, 11, '.');
  put(Gr, 3, 15, '@'); put(Gr, 6, 15, 'k'); put(Gr, 9, 11, '?'); put(Gr, 5, 8, 'o.o.o');
  put(Gr, 16, 15, '1'); put(Gr, 30, 14, '*'); put(Gr, 34, 15, 'l');
  // the hole up to the top shelf run, the hanky by it
  fillG(Gr, 26, 12, 27, 12, '.'); put(Gr, 26, 15, 'H'); put(Gr, 28, 14, 'u');
  put(Gr, 31, 10, 'BB'); put(Gr, 38, 9, 'BBB'); put(Gr, 36, 6, 'j'); put(Gr, 44, 8, 'R'); put(Gr, 48, 6, 'J'); put(Gr, 52, 10, 'BB'); put(Gr, 33, 7, 'o.o.o'); put(Gr, 60, 7, 'P'); put(Gr, 64, 11, 'A');
  put(Gr, 42, 15, '2'); put(Gr, 56, 15, 'c'); put(Gr, 58, 9, '?'); put(Gr, 62, 15, 'a'); put(Gr, 66, 15, 'r'); put(Gr, 72, 15, 'E');
  return rowsOf(Gr);
})();
const CUP = {
  k: SIGN('LOOSE FITTED SHEETS! STAND BEFORE THE BEDPOST: THE CORNER AIMS AT YOU, THEN SNAPS. JUMP IT AND IT HOOKS THE POST'),
  '1': ['piece', 'wash.looseSheet', { post: 6, side: -1, id: 'sheet1' }], '2': ['piece', 'wash.looseSheet', { post: 6, side: -1, id: 'sheet2' }],
  l: ['enemy', 'washLamb'], r: ['enemy', 'washHeron'],
  j: ['piece', 'wash.jaws', { period: 2.6, reach: 3 }], J: ['piece', 'wash.jaws', { period: 2.6, phase: 1.3, reach: 3 }],
  u: ['piece', 'wash.peep', {}], A: ['spawn', 'portal', { kind: 'door', look: 'washCupboard', targetRef: 'drawer@in' }], a: ['anchor', 'drawerOut'],
  E: ['spawn', 'portal', { kind: 'door', look: 'washCupboard', targetRef: 'bed@in' }]
};
stamps.washCupboard = { floor: 16, rows: cupRows, legend: CUP, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power'] };
stamps.washDrawer = roomStamp('cupboard@drawerOut', 'washChute', ['star']);
const L6 = { n: 6, name: 'Fitted Sheet for One', mapLabel: 'Fitted Sheet', arch: 'lair', theme: 'wash_bed', boss: 'wash_majesty',
  gimmick: 'Her Fitted Majesty, a navy-checked fitted sheet with a wink, will not be made. Tuck her corners over the bedposts one by one: the arrow, the double sweep, the shake',
  hint: 'You can\'t stomp a sheet. Jump her snapping corner in front of a free post; duck the wide ring, jump the low one; in the last act, stand in her pocket and be in the air when she shakes the bed',
  postcard: 'Brady! You made the bed. With her in it. She says thank you, and that there is a wrinkle. There is not. ♥ C',
  enemies: [['washLamb', 1], ['washHeron', 1]],
  mapCell: [5, 0], mapFrom: 4,
  exits: { main: { to: null } },
  areas: [
    { id: 'cupboard', gen: 'room', theme: 'wash_bed', stamp: 'washCupboard' },
    { id: 'drawer', gen: 'room', role: 'secret', theme: 'wash_room_socks', stamp: 'washDrawer', room: 'washDivorce' },
    { id: 'bed', gen: 'arena', role: 'arena', layout: 'bed', arenaW: 28, H: 20, roof: false, theme: 'wash_bed' }
  ] };

Tour.amend('wash', { stamps, levels: [L1, L2, L3, L4, L5, L6] });

/* ---------------- the land's map: the rooftops and their washing lines ---------------- */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.wash = {
  labels: { '26-1': 'Peg Legwork', '26-2': 'Cold Wash Only', '26-3': 'Loose End', '26-4': 'The Cling Section', '26-5': 'Pocket Address', '26-6': 'Fitted Sheet' },
  w: 1520, h: 760,
  pal: { sea: '#9fdcc4', deep: '#7ab8a4', land: '#e8c8a8', light: '#f4dcc0', path: '#f4ead2', beach: '#d8b090', cliff: '#8a4434', roof: '#e8442e', wall: '#f4ead2' },
  sea: 'clouds', coast: 'washRoof', tufts: 'none', trail: 'stones', bridge: 'rope', meadow: false, woods: false, foam: false, birds: true,
  land: [[[160, 360], [230, 230], [420, 170], [640, 190], [840, 150], [1080, 170], [1300, 230], [1390, 360], [1360, 520], [1220, 640], [980, 670], [720, 640], [480, 660], [270, 590]]],
  nodes: { start: [270, 440], '26-1': [430, 300, 'n'], '26-2': [680, 250, 'n'], '26-3': [930, 250, 'n'], '26-4': [1160, 330, 'e'], '26-5': [1060, 540, 's'], '26-6': [760, 560, 's'], port: [520, 560] },
  paths: { 'start>26-1': [[340, 380]], '26-1>26-2': [[560, 250]], '26-2>26-3': [[800, 230]], '26-3>26-4': [[1060, 270]], '26-4>26-5': [[1140, 450]], '26-5>26-6': [[900, 580]], '26-6>port': [[640, 580]] },
  feat: [
    ['sprite', 'washBasketSprite', 250, 470, 26], ['sprite', 'washLine', 560, 300, 40], ['sprite', 'washLine', 1050, 230, 40], ['sprite', 'washLine', 1250, 450, 34],
    ['sprite', 'washStack', 820, 330, 16], ['sprite', 'washStack', 980, 420, 18], ['sprite', 'washBedSprite', 760, 600, 34], ['sprite', 'washLine', 600, 480, 30]
  ],
  flora: ['rock'], density: 0,
  live: [['circle', 700, 120, 60, 0.6]]
};
})();
