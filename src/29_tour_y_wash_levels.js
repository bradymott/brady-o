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
  ground(Gr, 169, 186, 23); put(Gr, 172, 22, 'c'); put(Gr, 176, 19, '?'); put(Gr, 182, 22, 'l');
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
    { id: 'basket', gen: 'room', role: 'secret', theme: 'wash_room_wicker', stamp: 'washBasket' }
  ] };

Tour.amend('wash', { stamps, levels: [L1] });

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
