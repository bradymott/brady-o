/* ============================================================
   THE ORCHARD AFTER CLOSING: the stages (world 28) and the land's map. Six stages, each a new kind of play, taught
   where a slip costs nothing, tested, then twisted; the last one is the boss.
   28-1 ELBOWS ON THE TRELLIS (espalier)  two-faced trellises: grip, climb four ways, slip behind a stake at a collar
        to pass the critters on the other face; bend a branch fork across a gap by pushing against it; late forks
        spring back unless bent from the far face, where the tie holds them. Room B11 up the tall trellis's corner.
   (28-2 to 28-6 below.)
   ============================================================ */
(function () {
const C = Tour.countries.orch;
if (!C) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length) Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const pit = (Gr, x0, x1) => fillG(Gr, x0, 0, x1, Gr.length - 1, '.');
const rowsOf = Gr => Gr.map(r => r.join(''));
const stamps = {};
const SIGN = text => ['spawn', 'sign', { text }];
const TREL = (w, h, holes) => ['piece', 'orch.trellis', { w, h, holes: holes || [] }];
const FORK = (len, o) => ['piece', 'orch.fork', Object.assign({ len, dir: 1 }, o || {})];
const CRAWL = o => ['piece', 'orch.crawler', o];
const BITE = o => ['piece', 'orch.bite', o || {}];
// a secret room's stand-in stamp (the room kind builds its own place from it): its door out, its prize
const roomStamp = (out, look, items) => ({ floor: 12, rows: [
  '############################', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#.@..D..................?..#',
  '############################', '############################'], items: items || ['oneup'], doors: [{ to: out, look: look || 'orchShed' }] });

/* ---------------- 28-1 Elbows on the Trellis ---------------- */
// ground tops are row 23. ① the teach: a little trellis over the grass, then one over the first gap; a fork bent
// across a pit between two trellises; ② collars (slip behind the stake past a fly), the tall trellis up to the high
// bank (the potting-shed ledge with the bitten pear at its top left: room B11); ③ the late fork: it springs back from
// the near face, so go round the back and bend it there; ④ two late forks in a row, critters on both faces
const trelRows = (() => {
  const W = 246, H = 30, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 21, 23); put(Gr, 3, 22, '@'); put(Gr, 6, 22, 'k'); put(Gr, 19, 22, 'x');
  put(Gr, 10, 15, '1'); put(Gr, 11, 16, 'o.o.o.o'); put(Gr, 14, 12, '?');
  put(Gr, 20, 13, '2'); put(Gr, 22, 17, 'o.o.o.o.o'); put(Gr, 26, 15, '*');
  ground(Gr, 30, 40, 23); put(Gr, 33, 22, 'c'); put(Gr, 31, 19, '?');
  // the first fork: trellis 36-41, its branch across 42-46, trellis 47-54 over the pit; the bank at 55
  put(Gr, 36, 12, '3'); put(Gr, 41, 14, 'f'); put(Gr, 47, 12, '4'); put(Gr, 38, 22, 'K'); put(Gr, 43, 13, 'o.o.o');
  ground(Gr, 55, 60, 23); put(Gr, 57, 22, 'l');
  // ② collars over the second pit; the bank with a checkpoint
  put(Gr, 58, 11, '5'); put(Gr, 66, 11, 'm'); put(Gr, 65, 17, 'n'); put(Gr, 61, 12, 'o.o'); put(Gr, 69, 12, 'o.o');
  ground(Gr, 74, 91, 23); put(Gr, 76, 22, 'c'); put(Gr, 85, 22, 'r'); put(Gr, 81, 19, 'o.o.o'); put(Gr, 79, 22, 'J');
  // the tall trellis up to the high bank; the shed ledge above its top left (only the trellis reaches it)
  put(Gr, 90, 6, '6'); put(Gr, 93, 9, 'e'); put(Gr, 101, 15, 'q'); put(Gr, 95, 18, 'o.o.o'); put(Gr, 97, 8, 'o.o.o');
  fillG(Gr, 82, 5, 88, 5, 'H'); put(Gr, 83, 4, 'A'); put(Gr, 86, 4, 'u'); put(Gr, 85, 2, 'o.o');
  ground(Gr, 106, 123, 13); put(Gr, 109, 12, 'c'); put(Gr, 113, 12, 'j'); put(Gr, 118, 9, '?'); put(Gr, 117, 12, 'x');
  ground(Gr, 124, 127, 16); ground(Gr, 128, 131, 19); ground(Gr, 132, 146, 23);
  put(Gr, 133, 22, 'a'); put(Gr, 136, 22, 'O'); put(Gr, 139, 22, 'l'); put(Gr, 125, 12, 'd');
  // ③ the late fork: trellis 146-155 (a collar), its branch 156-161 (bent from behind), trellis 162-171; pit 147-172
  put(Gr, 146, 10, '7'); put(Gr, 155, 12, 'X'); put(Gr, 162, 10, '8'); put(Gr, 149, 13, 'w'); put(Gr, 166, 12, 'z'); put(Gr, 158, 12, 'R');
  put(Gr, 150, 18, 'o.o.o'); put(Gr, 165, 17, 'o.o.o');
  ground(Gr, 173, 188, 23); put(Gr, 175, 22, 'c'); put(Gr, 180, 19, '?'); put(Gr, 184, 22, 'r');
  // ④ two late forks in a row, critters on both faces
  put(Gr, 189, 9, '9'); put(Gr, 196, 11, 'E'); put(Gr, 202, 9, '0'); put(Gr, 208, 13, 'Y'); put(Gr, 215, 9, 'Z');
  put(Gr, 191, 12, 'U'); put(Gr, 205, 10, 'V'); put(Gr, 205, 17, 'N'); put(Gr, 218, 12, 'M');
  put(Gr, 192, 16, 'o.o.o'); put(Gr, 204, 14, 'o.o'); put(Gr, 217, 16, 'o.o');
  ground(Gr, 223, W - 1, 23); put(Gr, 225, 22, 'c'); put(Gr, 229, 22, 'r'); fillG(Gr, 233, 20, 234, 22, 'H'); put(Gr, 233, 16, 'P'); put(Gr, 240, 22, 'G');
  fillG(Gr, W - 1, 0, W - 1, 22, 'H');
  return rowsOf(Gr);
})();
const TRL = {
  k: SIGN('A TRELLIS! PUSH UP INTO IT TO GRIP, CLIMB WITH THE STICK, JUMP TO LET GO'),
  K: SIGN('A BRANCH FORK HANGS AT THE EDGE: HOLD THE STICK AGAINST IT AND IT BENDS ACROSS THE GAP'),
  J: SIGN('A STAKE WITH A RUST TIE IS A COLLAR: JUMP THERE TO SLIP ROUND THE BACK. ONLY CRITTERS ON YOUR SIDE CAN TOUCH YOU'),
  O: SIGN('LATE FORKS SPRING BACK WHEN YOU LET GO. THEIR TIE IS ROUND THE BACK: BEND THEM FROM BEHIND'),
  x: ['decor', 'orchCrate'], l: ['enemy', 'orchWorm'], r: ['enemy', 'orchFinch'], j: ['enemy', 'orchSnail'], d: ['enemy', 'orchFly'],
  '1': TREL(8, 5), '2': TREL(12, 7),
  '3': TREL(6, 8), f: FORK(5), '4': TREL(8, 8),
  '5': TREL(16, 9, [[4, 4], [11, 4]]),
  m: CRAWL({ kind: 'fly', face: 0, ay: 7, speed: 1.2 }), n: CRAWL({ kind: 'worm', face: 1, ax: 4, speed: 1.0 }),
  '6': TREL(18, 14, [[4, 10], [9, 4], [14, 8]]),
  e: CRAWL({ kind: 'worm', face: 0, ax: 6, speed: 1.0 }), q: CRAWL({ kind: 'fly', face: 1, ay: -6, speed: 1.2 }),
  A: ['spawn', 'portal', { kind: 'door', look: 'orchShed', targetRef: 'shed@in' }], u: BITE(), a: ['anchor', 'shedOut'],
  '7': TREL(10, 10, [[3, 4]]), X: FORK(6, { late: true }), '8': TREL(10, 10, [[6, 5]]),
  w: CRAWL({ kind: 'fly', face: 0, ay: 6, speed: 1.2 }), z: CRAWL({ kind: 'worm', face: 0, ax: 4, speed: 1.0, phase: 1.2 }),
  '9': TREL(8, 11, [[2, 4]]), E: FORK(5, { late: true }), '0': TREL(7, 11, [[2, 7], [5, 3]]), Y: FORK(6, { late: true }), Z: TREL(8, 11, [[4, 6]]),
  U: CRAWL({ kind: 'fly', face: 0, ay: 7, speed: 1.1 }), V: CRAWL({ kind: 'fly', face: 1, ay: 6, speed: 1.0, phase: 1.5 }),
  N: CRAWL({ kind: 'worm', face: 0, ax: 2, speed: 0.9 }), M: CRAWL({ kind: 'fly', face: 0, ay: 6, speed: 1.1, phase: 0.8 })
};
stamps.orchTrellis = { floor: 23, rows: trelRows, legend: TRL, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power', 'power'] };
stamps.orchShed = roomStamp('rows@shedOut', 'orchHatch');
const L1 = { n: 1, name: 'Elbows on the Trellis', mapLabel: 'Elbows on the Trellis', arch: 'espalier', theme: 'orch_trellis',
  gimmick: 'Espalier trellises over the orchard\'s ditches: grip, climb any way, slip behind a stake to pass the critters on the other face, and push a branch fork across a gap. Late forks spring back unless their tie is done up from behind',
  hint: 'Only a critter on your side of the trellis can touch you. A late fork\'s tie is round the back: bend it from there. Something has been nibbling a pear high over the tall trellis...',
  postcard: 'Brady! The pear trees here hold hands along wires all day. Once the gate shuts they let go and stretch. I did my pliés with them. ♥ C',
  enemies: [['orchWorm', 2], ['orchFinch', 3], ['orchSnail', 1], ['orchFly', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '28-2' } },
  areas: [
    { id: 'rows', gen: 'room', theme: 'orch_trellis', stamp: 'orchTrellis', camera: 'free', bottomKill: true },
    { id: 'shed', gen: 'room', role: 'secret', theme: 'orch_room_shed', stamp: 'orchShed' }
  ] };

Tour.amend('orch', { stamps, levels: [L1] });

/* ---------------- the land's map: an orchard behind a clipped hedge ---------------- */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.orch = {
  labels: { '28-1': 'Elbows on the Trellis', '28-2': 'Appointment with a Bee', '28-3': 'Cut Above', '28-4': 'A Pear in a Sleeve', '28-5': 'The Graft Takes', '28-6': 'Windfall Committee' },
  w: 1520, h: 760,
  pal: { sea: '#5a4a7a', deep: '#3e3a6a', land: '#9ab84a', light: '#b8d06a', path: '#e8dcb8', beach: '#c8b07a', cliff: '#3e6a2a', roof: RUSTC(), wall: '#f4ecd4' },
  sea: 'clouds', coast: 'orchHedge', tufts: 'none', trail: 'stones', bridge: 'rope', meadow: false, woods: false, foam: false, birds: true,
  land: [[[170, 380], [250, 230], [430, 170], [660, 200], [860, 150], [1090, 180], [1310, 240], [1390, 380], [1350, 540], [1210, 650], [970, 670], [720, 630], [470, 660], [270, 590]]],
  // the route winds between the rows of trees like a mown path
  nodes: { start: [260, 450], '28-1': [430, 280, 'n'], '28-2': [640, 470, 's'], '28-3': [840, 260, 'n'], '28-4': [1040, 470, 's'], '28-5': [1240, 300, 'n'], '28-6': [1170, 560, 's'], port: [960, 620] },
  paths: { 'start>28-1': [[330, 340]], '28-1>28-2': [[540, 360]], '28-2>28-3': [[740, 360]], '28-3>28-4': [[940, 370]], '28-4>28-5': [[1140, 380]], '28-5>28-6': [[1250, 440]], '28-6>port': [[1070, 600]] },
  feat: [
    ['sprite', 'orchGateSprite', 230, 530, 24], ['sprite', 'orchTrellisSprite', 520, 250, 34], ['sprite', 'orchSkep', 720, 520, 22], ['sprite', 'orchTree', 940, 240, 26],
    ['sprite', 'orchTree', 1140, 520, 24], ['sprite', 'orchTree', 400, 560, 22], ['sprite', 'orchBasketSprite', 820, 600, 28]
  ],
  flora: ['rock'], density: 0,
  live: [['circle', 700, 120, 60, 0.6]]
};
function RUSTC() { return '#c0462a'; }
})();
