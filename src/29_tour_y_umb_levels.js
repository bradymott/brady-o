/* ============================================================
   THE UMBRELLA REPAIR DISTRICT: the stages (world 31) and the land's map. Six stages, each a new kind of play,
   taught where a slip costs nothing, tested, then twisted; the last one is the boss.
   31-1 RIB INSPECTOR (ribcrawl)  open canopies hung across the gaps: grip the ribs, crawl four ways, flip through a
        rivet to the fabric side to pass the ticks there; late on a Rivet Tick wedged in its seat walls off both faces
        until its rib is flexed from the far end with THROW. Room B26 (Long Lunch) off a ledge only the tall canopy
        reaches.
   (31-2 to 31-6 below.)
   ============================================================ */
(function () {
const C = Tour.countries.umb;
if (!C) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length) Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const pit = (Gr, x0, x1) => fillG(Gr, x0, 0, x1, Gr.length - 1, '.');
const rowsOf = Gr => Gr.map(r => r.join(''));
const stamps = {};
const SIGN = text => ['spawn', 'sign', { text }];
const CANP = (w, h, holes) => ['piece', 'umb.canopy', { w, h, holes: holes || [] }];
const CRAWL = o => ['piece', 'umb.crawler', o];
const TICKET = o => ['piece', 'umb.ticket', o || {}];
const ENEMY = { l: ['enemy', 'umbTick'], r: ['enemy', 'umbMule'], f: ['enemy', 'umbFinch'], j: ['enemy', 'umbFerret'] };
// a secret room's stand-in stamp (the room kind builds its own place from it): its door out, its prize
const roomStamp = (out, look, items) => ({ floor: 12, rows: [
  '############################', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#.@..D..................?..#',
  '############################', '############################'], items: items || ['oneup'], doors: [{ to: out, look: look || 'umbHatch' }] });

/* ---------------- 31-1 Rib Inspector ---------------- */
// the street's top is row 23. ① the teach: a little canopy over the street (nothing to fall into), then a canopy over
// the first gap; ② rivets and the fabric side (a tick patrols the underside's middle spoke), the mule's street, the
// tall canopy up to the high roof (the window ledge with the repair ticket at its top left: room B26); ③ the covered
// passage: the seated tick across the long canopy (its rib's ferrule end four spokes back), then the last canopy
// with a second seated tick and critters on both faces, the end street and the gate
const ribRows = (() => {
  const W = 240, H = 30, Gr = grid(W, H, '.');
  ground(Gr, 0, 21, 23); put(Gr, 3, 22, '@'); put(Gr, 6, 22, 'k'); put(Gr, 19, 22, 'x');
  put(Gr, 10, 15, '1'); put(Gr, 11, 16, 'o.o.o.o'); put(Gr, 14, 12, '?');
  put(Gr, 20, 13, '2'); put(Gr, 22, 17, 'o.o.o.o.o'); put(Gr, 26, 15, '*');
  ground(Gr, 30, 54, 23); put(Gr, 36, 22, 'c'); put(Gr, 40, 19, '?'); put(Gr, 46, 22, 'l'); put(Gr, 50, 22, 'K'); put(Gr, 33, 22, 'x');
  put(Gr, 53, 11, '3'); put(Gr, 61, 11, 'm'); put(Gr, 60, 17, 'n'); put(Gr, 56, 12, 'o.o'); put(Gr, 64, 12, 'o.o');
  ground(Gr, 69, 86, 23); put(Gr, 71, 22, 'c'); put(Gr, 80, 22, 'r'); put(Gr, 76, 19, 'o.o.o');
  put(Gr, 85, 6, '4'); put(Gr, 88, 9, 'e'); put(Gr, 96, 15, 'q'); put(Gr, 90, 18, 'o.o.o'); put(Gr, 92, 8, 'o.o.o');
  // the window ledge above the tall canopy's top left: only the canopy reaches it (the ticket; B26's door)
  fillG(Gr, 77, 5, 83, 5, 'H'); put(Gr, 78, 4, 'A'); put(Gr, 81, 4, 'u'); put(Gr, 80, 2, 'o.o');
  ground(Gr, 101, 118, 13); put(Gr, 104, 12, 'c'); put(Gr, 108, 12, 'j'); put(Gr, 113, 9, '?'); put(Gr, 112, 12, 'x');
  ground(Gr, 119, 122, 16); ground(Gr, 123, 126, 19); ground(Gr, 127, 140, 23);
  put(Gr, 128, 22, 'c'); put(Gr, 131, 22, 'a'); put(Gr, 134, 22, 'Z'); put(Gr, 137, 22, 'l'); put(Gr, 120, 12, 'f');
  // ③ the covered passage: the seated tick across the long canopy
  fillG(Gr, 139, 4, 172, 6, 'H');
  put(Gr, 141, 7, '5'); put(Gr, 156, 7, 'Y'); put(Gr, 145, 11, 'w'); put(Gr, 151, 10, 'z'); put(Gr, 160, 18, 'R');
  put(Gr, 144, 15, 'o.o.o'); put(Gr, 160, 10, 'o.o.o'); put(Gr, 163, 16, 'o.o.o');
  ground(Gr, 169, 186, 23); put(Gr, 172, 22, 'c'); put(Gr, 176, 19, '?'); put(Gr, 180, 22, 'r');
  // the last canopy: a second seated tick, critters on both faces
  fillG(Gr, 185, 4, 218, 7, 'H');
  put(Gr, 187, 8, '6'); put(Gr, 202, 8, 'J'); put(Gr, 195, 10, 'U'); put(Gr, 199, 13, 'V'); put(Gr, 208, 9, 'E'); put(Gr, 211, 17, 'N');
  put(Gr, 190, 15, 'o.o.o'); put(Gr, 204, 12, 'o.o.o');
  ground(Gr, 215, W - 1, 23); put(Gr, 218, 22, 'c'); put(Gr, 222, 22, 'j'); fillG(Gr, 226, 20, 227, 22, 'H'); put(Gr, 226, 16, 'P'); put(Gr, 233, 22, 'G');
  fillG(Gr, W - 1, 0, W - 1, 22, 'H');
  return rowsOf(Gr);
})();
const RIB = Object.assign({}, ENEMY, {
  k: SIGN('AN OPEN CANOPY! PUSH UP INTO IT TO GRIP THE RIBS. CRAWL WITH THE STICK. JUMP TO LET GO'),
  K: SIGN('CORAL RIVETS: PRESS JUMP ON ONE TO FLIP TO THE FABRIC SIDE. ONLY A CRITTER ON YOUR SIDE CAN TOUCH YOU'),
  Z: SIGN('A TICK WEDGED IN ITS SEAT BLOCKS BOTH SIDES. CRAWL TO THE FAR END OF ITS RIB AND PRESS THROW TO FLEX IT'),
  x: ['decor', 'umbStand'],
  '1': CANP(8, 5, []), '2': CANP(12, 7, []),
  '3': CANP(18, 9, [[4, 4], [13, 4]]),
  m: CRAWL({ kind: 'tick', face: 0, ay: 8, speed: 1.2 }), n: CRAWL({ kind: 'tick', face: 1, ax: 4, speed: 1.0 }),
  '4': CANP(18, 14, [[4, 10], [9, 4], [14, 8]]),
  e: CRAWL({ kind: 'ferret', face: 0, ax: 6, speed: 1.1 }), q: CRAWL({ kind: 'tick', face: 1, ay: -6, speed: 1.2 }),
  A: ['spawn', 'portal', { kind: 'door', look: 'umbCase', targetRef: 'lunch@in' }], u: TICKET({ dy: 1 }), a: ['anchor', 'lunchOut'],
  '5': CANP(30, 13, [[6, 7], [11, 3], [20, 5], [25, 9]]),
  Y: ['piece', 'umb.seat', { h: 13, side: -1, reach: 4, mark: 2, id: 'seat1' }],
  w: CRAWL({ kind: 'tick', face: 0, ay: 6, speed: 1.1 }), z: CRAWL({ kind: 'ferret', face: 1, ay: 6, speed: 1.0, phase: 1.5 }),
  '6': CANP(30, 12, [[5, 4], [10, 8], [19, 3], [24, 7]]),
  J: ['piece', 'umb.seat', { h: 12, side: -1, reach: 5, mark: 6, id: 'seat2' }],
  U: CRAWL({ kind: 'tick', face: 1, ax: 4, speed: 1.3 }), V: CRAWL({ kind: 'ferret', face: 0, ay: 5, speed: 1.2 }),
  E: CRAWL({ kind: 'tick', face: 0, ay: 8, speed: 1.2 }), N: CRAWL({ kind: 'tick', face: 1, ax: -3, speed: 1.0 })
});
stamps.umbRib = { floor: 23, rows: ribRows, legend: RIB, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power', 'power'] };
stamps.umbLunch = roomStamp('ribs@lunchOut', 'umbHatch');
const L1 = { n: 1, name: 'Rib Inspector', mapLabel: 'Rib Inspector', arch: 'ribcrawl', theme: 'umb_ribs',
  gimmick: 'Huge repair canopies hung open across the gaps: push up to grip the ribs, crawl any way underneath, flip through a coral rivet to the fabric side to slip past the Rivet Ticks. Late on, a tick sits wedged in the seat of a rib',
  hint: 'Only a critter on your side of the cloth can touch you. A wedged tick won\'t budge from its own end: crawl to the far end of its rib and press THROW. A repair ticket hangs over a high window ledge...',
  postcard: 'Brady! I hung under an umbrella the size of a bandstand and a tick counted my fingers. He got to eleven, twice. ♥ C',
  enemies: [['umbTick', 3], ['umbMule', 2], ['umbFerret', 2], ['umbFinch', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '31-2' } },
  areas: [
    { id: 'ribs', gen: 'room', theme: 'umb_ribs', stamp: 'umbRib', camera: 'free', bottomKill: true },
    { id: 'lunch', gen: 'room', role: 'secret', theme: 'umb_room_lunch', stamp: 'umbLunch', room: Tour.umbRoom ? 'umbLunch' : undefined }
  ] };

Tour.amend('umb', { stamps, levels: [L1] });
Tour.umbLevels = { grid, put, fillG, ground, pit, rowsOf, SIGN, CANP, CRAWL, TICKET, ENEMY, roomStamp };

/* ---------------- the land's map: wet cobbles and open umbrellas ---------------- */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.umb = {
  labels: { '31-1': 'Rib Inspector', '31-2': 'Every Drop', '31-3': 'Hook Exchange', '31-4': 'Panel Beater', '31-5': 'Shake Well', '31-6': 'Lifetime Warranty' },
  w: 1520, h: 760,
  pal: { sea: '#93a8c8', deep: '#6f85ad', land: '#c8c4d8', light: '#dcd8e8', path: '#f4b32e', beach: '#a8a4c0', cliff: '#1f2a56', roof: '#ef6f5a', wall: '#f4f1e8' },
  sea: 'clouds', coast: 'umbKerb', tufts: 'none', trail: 'cobble', bridge: 'stone', meadow: false, woods: false, foam: false, birds: false,
  land: [[[170, 380], [260, 220], [480, 160], [760, 200], [1000, 150], [1260, 210], [1380, 360], [1330, 560], [1160, 660], [900, 640], [640, 680], [400, 640], [230, 560]]],
  // the route spirals in like the ribs of an umbrella seen from above, to the inspector's hall in the middle
  nodes: { start: [270, 470], '31-1': [380, 280, 'n'], '31-2': [700, 250, 'n'], '31-3': [1040, 240, 'n'], '31-4': [1250, 420, 'e'], '31-5': [1000, 580, 's'], '31-6': [700, 460, 's'], port: [480, 600] },
  paths: { 'start>31-1': [[300, 360]], '31-1>31-2': [[540, 230]], '31-2>31-3': [[870, 210]], '31-3>31-4': [[1190, 300]], '31-4>31-5': [[1160, 540]], '31-5>31-6': [[850, 540]], '31-6>port': [[580, 560]] },
  feat: [
    ['sprite', 'umbOpen', 560, 380, 34], ['sprite', 'umbOpen', 880, 360, 30], ['sprite', 'umbOpen', 1180, 600, 26], ['sprite', 'umbStandSprite', 260, 600, 24],
    ['sprite', 'umbPuddle', 780, 620, 22], ['sprite', 'umbPuddle', 430, 420, 16], ['sprite', 'umbHallSprite', 700, 380, 36]
  ],
  flora: ['rock'], density: 0,
  live: [['circle', 700, 120, 60, 0.6]]
};
})();
