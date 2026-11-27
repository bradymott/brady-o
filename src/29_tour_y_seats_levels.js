/* ============================================================
   BELOW THE CHEAP SEATS: the stages (world 33) and the land's map. Six stages, each a new kind of play, taught
   where a slip costs nothing, tested, then twisted; the last one is the boss.
   33-1 TWO WAYS ROUND A POLE (roundpole)  two-faced scaffolds: grip, climb four ways, swing round a pole at a collar
        to pass the critters on the other face; the late Bolt Crab mirrors the climb about its collar: go round the
        back, down behind it, and THROW through the collar to knock its spanner loose. Room B36 up the tall scaffold.
   (33-2 to 33-6 below.)
   ============================================================ */
(function () {
const C = Tour.countries.seats;
if (!C) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length) Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const rowsOf = Gr => Gr.map(r => r.join(''));
const stamps = {};
const SIGN = text => ['spawn', 'sign', { text }];
const SCAF = (w, h, holes) => ['piece', 'seats.scaffold', { w, h, holes: holes || [] }];
const CRAWL = o => ['piece', 'seats.crawler', o];
const TELL = o => ['piece', 'seats.tell', o || {}];
// a secret room's stand-in stamp (the room kind builds its own place from it): its door out, its prize
const roomStamp = (out, look, items) => ({ floor: 12, rows: [
  '############################', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#.@..D..................?..#',
  '############################', '############################'], items: items || ['oneup'], doors: [{ to: out, look: look || 'seatsDoor' }] });
Tour.seatsKit.roomStamp = roomStamp;

/* ---------------- 33-1 Two Ways Round a Pole ---------------- */
// ground tops are row 23. ① the teach: a little scaffold over the boards, then one over the first pit; a long one
// with a Bolt Crab pacing its middle and a collar to swing round it; ② collars both sides of a critter pair, the tall
// scaffold up to the high bank (the cable-store ledge with the wrong-way seat at its top left: room B36); ③ the late
// Bolt Crab: it mirrors the climb about its collar and holds the bolted board shut; ④ two scaffolds over the last pit,
// critters on both faces, a let-go jump between them
const scafRows = (() => {
  const W = 246, H = 30, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 21, 23); put(Gr, 3, 22, '@'); put(Gr, 6, 22, 'k'); put(Gr, 17, 22, 'x');
  put(Gr, 10, 15, '1'); put(Gr, 11, 16, 'o.o.o.o'); put(Gr, 14, 12, '?');
  put(Gr, 20, 13, '2'); put(Gr, 22, 17, 'o.o.o.o.o'); put(Gr, 26, 15, '*');
  ground(Gr, 30, 40, 23); put(Gr, 33, 22, 'c'); put(Gr, 32, 19, '?'); put(Gr, 38, 22, 'K');
  // the long scaffold over the pit 41-54: a crab paces its middle row; the collar at its left swings round the back
  put(Gr, 36, 12, '3'); put(Gr, 44, 16, 'f'); put(Gr, 43, 13, 'o.o.o');
  ground(Gr, 55, 60, 23); put(Gr, 57, 22, 'x');
  // ② collars over the second pit; the bank with a checkpoint
  put(Gr, 58, 11, '5'); put(Gr, 66, 11, 'm'); put(Gr, 65, 17, 'n'); put(Gr, 61, 12, 'o.o'); put(Gr, 69, 12, 'o.o');
  ground(Gr, 74, 91, 23); put(Gr, 76, 22, 'c'); put(Gr, 85, 22, 'r'); put(Gr, 81, 19, 'o.o.o'); put(Gr, 79, 22, 'J');
  // the tall scaffold up to the high bank; the cable-store ledge above its top left (only the scaffold reaches it)
  put(Gr, 90, 6, '6'); put(Gr, 93, 9, 'e'); put(Gr, 101, 15, 'q'); put(Gr, 95, 18, 'o.o.o'); put(Gr, 97, 8, 'o.o.o');
  fillG(Gr, 82, 5, 88, 5, 'H'); put(Gr, 83, 4, 'A'); put(Gr, 86, 4, 'u'); put(Gr, 85, 2, 'o.o');
  ground(Gr, 106, 123, 13); put(Gr, 109, 12, 'c'); put(Gr, 113, 12, 'j'); put(Gr, 118, 9, '?'); put(Gr, 117, 12, 'x');
  ground(Gr, 124, 127, 16); ground(Gr, 128, 131, 19); ground(Gr, 132, 146, 23);
  put(Gr, 133, 22, 'a'); put(Gr, 136, 22, 'O'); put(Gr, 139, 22, 'l'); put(Gr, 125, 12, 'd');
  // ③ the late Bolt Crab: scaffold 146-171 over the pit 147-172, its collar at 156/14, the bolted board at 168
  put(Gr, 146, 10, '7'); put(Gr, 156, 14, 'X'); put(Gr, 168, 19, 'Z'); put(Gr, 150, 12, 'R');
  put(Gr, 149, 18, 'o.o.o'); put(Gr, 163, 17, 'o.o');
  ground(Gr, 173, 188, 23); put(Gr, 175, 22, 'c'); put(Gr, 182, 19, '?'); put(Gr, 179, 22, 'r');
  // ④ two scaffolds over the last pit, critters on both faces, a jump between them
  put(Gr, 189, 9, '9'); put(Gr, 194, 12, 'U'); put(Gr, 192, 16, 'V'); put(Gr, 192, 13, 'o.o.o');
  fillG(Gr, 202, 18, 205, 18, '-'); put(Gr, 206, 9, '0'); put(Gr, 210, 11, 'N'); put(Gr, 214, 15, 'M'); put(Gr, 209, 16, 'o.o.o');
  ground(Gr, 223, W - 1, 23); put(Gr, 225, 22, 'c'); put(Gr, 229, 22, 'r'); fillG(Gr, 233, 20, 234, 22, 'H'); put(Gr, 233, 16, 'P'); put(Gr, 240, 22, 'G');
  fillG(Gr, W - 1, 0, W - 1, 22, 'H');
  return rowsOf(Gr);
})();
const SCF = {
  k: SIGN('A SCAFFOLD! PUSH UP INTO IT TO GRIP, CLIMB WITH THE STICK, JUMP TO LET GO'),
  K: SIGN('A GOLD COLLAR ON A POLE: JUMP THERE TO SWING ROUND TO THE BACK. ONLY CRITTERS ON YOUR SIDE CAN TOUCH YOU'),
  J: SIGN('CRITTERS ON THE BACK ARE SHADOWS: THEY CANNOT TOUCH YOU UNTIL YOU GO ROUND'),
  O: SIGN('A BOLT CRAB THAT MIRRORS YOU: GO ROUND THE BACK, DOWN BEHIND IT, AND THROW THROUGH THE COLLAR'),
  x: ['decor', 'seatsCoilDecor'], l: ['enemy', 'seatsCrab'], r: ['enemy', 'seatsStoat'], j: ['enemy', 'seatsHen'], d: ['enemy', 'seatsShrew'],
  '1': SCAF(8, 5), '2': SCAF(12, 7),
  '3': SCAF(19, 8, [[2, 4]]), f: CRAWL({ kind: 'crab', face: 0, ax: 8, speed: 1.1 }),
  '5': SCAF(16, 9, [[4, 4], [11, 4]]),
  m: CRAWL({ kind: 'crab', face: 0, ay: 7, speed: 1.2 }), n: CRAWL({ kind: 'shrew', face: 1, ax: 4, speed: 1.0 }),
  '6': SCAF(18, 14, [[4, 10], [9, 4], [14, 8]]),
  e: CRAWL({ kind: 'shrew', face: 0, ax: 6, speed: 1.0 }), q: CRAWL({ kind: 'crab', face: 1, ay: -6, speed: 1.2 }),
  A: ['spawn', 'portal', { kind: 'door', look: 'seatsTrap', targetRef: 'store@in' }], u: TELL(), a: ['anchor', 'storeOut'],
  '7': SCAF(26, 10, [[10, 4], [2, 2]]), X: ['piece', 'seats.mirrorCrab', { id: 'seats:bolt1', rx: 5, ry: 4 }], Z: ['piece', 'seats.board', { id: 'seats:bolt1', h: 20 }],
  '9': SCAF(13, 11, [[3, 4], [9, 7]]), U: CRAWL({ kind: 'crab', face: 0, ay: 6, speed: 1.1 }), V: CRAWL({ kind: 'shrew', face: 1, ax: 7, speed: 1.0, phase: 1.5 }),
  '0': SCAF(16, 11, [[2, 6], [9, 3]]), N: CRAWL({ kind: 'shrew', face: 0, ax: 6, speed: 0.9 }), M: CRAWL({ kind: 'crab', face: 1, ax: 5, speed: 1.1, phase: 0.8 })
};
stamps.seatsScaffold = { floor: 23, rows: scafRows, legend: SCF, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power', 'power'] };
stamps.seatsStore = roomStamp('rows@storeOut', 'seatsDoor');
const L1 = { n: 1, time: 400, name: 'Two Ways Round a Pole', mapLabel: 'Two Ways Round a Pole', arch: 'roundpole', theme: 'seats_scaffold',
  gimmick: 'Scaffolds under the grandstand: grip, climb any way, swing round a pole at its gold collar to pass the critters on the other face. A late Bolt Crab mirrors your climb: go round the back and knock its spanner loose through the collar',
  hint: 'Only a critter on your side of the scaffold can touch you. The mirror crab always meets you on the front: go round the back, then THROW through the collar. A little seat facing the floor sits high over the tall scaffold...',
  postcard: 'Brady! There is a whole scaffold under the grandstand. I climbed round a pole in my good shoes and a crab tutted at me. ♥ C',
  enemies: [['seatsCrab', 2], ['seatsStoat', 3], ['seatsHen', 1], ['seatsShrew', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '33-2' } },
  areas: [
    { id: 'rows', gen: 'room', theme: 'seats_scaffold', stamp: 'seatsScaffold', camera: 'free', bottomKill: true },
    { id: 'store', gen: 'room', role: 'secret', theme: 'seats_room_store', stamp: 'seatsStore', room: 'seatsSpool' }
  ] };

/* ---------------- 33-2 Slack Department ---------------- */
// the fly floor, ground tops row 17. ① the teach: a short flat over a narrow pit, its rope tail on the boards before
// it; ② a longer flat with a Cable Hen laying coils across the rope tail; ③ a flat over a wide pit under a little fly
// gallery: once it is clamped, a jump from its middle goes up through the gallery's gap (the wrong-way seat by it) to
// the counterweight cage (room B37), which lets Brady out on the far bank; ④ the last flat spans three supports with
// a narrow window: too much slack tips it off the middle support
const fliesRows = (() => {
  const W = 204, H = 22, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 23, 17); put(Gr, 3, 16, '@'); put(Gr, 6, 16, 'k'); put(Gr, 10, 13, '?'); put(Gr, 2, 12, 'o.o.o');
  put(Gr, 24, 17, '1'); ground(Gr, 30, 49, 17);
  // the bank: a platform with the first postcard, a crab
  fillG(Gr, 34, 13, 37, 13, '-'); put(Gr, 35, 10, '*'); put(Gr, 41, 16, 'l'); put(Gr, 33, 16, 'c'); put(Gr, 44, 12, 'o.o.o');
  // ② the longer flat; the hen on its rope tail
  put(Gr, 50, 16, 'K'); ground(Gr, 50, 60, 17); put(Gr, 47, 16, 'j'); put(Gr, 61, 17, '2'); ground(Gr, 69, 99, 17);
  put(Gr, 64, 12, 'R'); put(Gr, 72, 16, 'c'); put(Gr, 76, 13, '?'); put(Gr, 80, 16, 'r'); fillG(Gr, 83, 13, 86, 13, '-'); put(Gr, 84, 11, 'o.o');
  // ③ the flat under the fly gallery (the room above it), the far bank
  put(Gr, 100, 17, '3'); fillG(Gr, 100, 8, 111, 8, 'H'); fillG(Gr, 100, 9, 100, 13, 'H'); fillG(Gr, 111, 9, 111, 13, 'H');
  fillG(Gr, 100, 14, 111, 14, 'H'); fillG(Gr, 105, 14, 106, 14, '.'); put(Gr, 104, 13, 'u'); put(Gr, 108, 13, 'A'); put(Gr, 102, 11, 'o.o');
  ground(Gr, 112, 145, 17); put(Gr, 115, 16, 'a'); put(Gr, 118, 16, 'c'); put(Gr, 124, 16, 'd'); fillG(Gr, 127, 13, 130, 13, '-'); put(Gr, 128, 10, '?'); put(Gr, 131, 16, 'O');
  // ④ the last flat over the wide pit, three supports
  put(Gr, 146, 17, '4'); ground(Gr, 162, W - 1, 17);
  put(Gr, 165, 16, 'c'); put(Gr, 170, 16, 'l'); fillG(Gr, 174, 13, 177, 13, '-'); fillG(Gr, 179, 10, 182, 10, '-'); put(Gr, 181, 7, 'P'); put(Gr, 175, 11, 'o.o');
  put(Gr, 186, 16, 'j'); put(Gr, 196, 16, 'G'); fillG(Gr, W - 1, 0, W - 1, 16, 'H');
  return rowsOf(Gr);
})();
const FLY = {
  k: SIGN('A FLAT ON A ROPE! STAND ON THE ROPE TAIL, HOLD THROW AND WALK: IT PAYS OUT LINE. LET GO WHEN IT READS LEVEL'),
  K: SIGN('TOO LOW? HOLD THROW AND WALK BACK: IT HAULS THE LINE IN'),
  O: SIGN('THE LAST FLAT SITS ON THREE SUPPORTS. GO GENTLY: TOO MUCH SLACK TIPS IT'),
  l: ['enemy', 'seatsCrab'], r: ['enemy', 'seatsStoat'], j: ['enemy', 'seatsHen'], d: ['enemy', 'seatsShrew'],
  '1': ['piece', 'seats.flat', { w: 6, tail: 6, gap: 2, target: 3 }],
  '2': ['piece', 'seats.flat', { w: 8, tail: 6, gap: 2, target: 4 }],
  '3': ['piece', 'seats.flat', { w: 12, tail: 7, gap: 2, target: 4 }],
  '4': ['piece', 'seats.flat', { w: 16, tail: 7, gap: 2, target: 5, win: 5, mid: 8 }],
  A: ['spawn', 'portal', { kind: 'door', look: 'seatsDoor', targetRef: 'weights@in' }], u: TELL(), a: ['anchor', 'weightsOut']
};
stamps.seatsFlies = { floor: 17, rows: fliesRows, legend: FLY, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power'] };
stamps.seatsWeights = roomStamp('flies@weightsOut', 'seatsDoor');
const L2 = { n: 2, time: 360, name: 'Slack Department', mapLabel: 'Slack Department', arch: 'slackline', theme: 'seats_flies',
  gimmick: 'Painted flats hang over the pits from the flies. Stand on a flat\'s rope tail and hold THROW: walking pays out line, walking back hauls it in. Let go when it reads LEVEL and the stagehands clamp it into a bridge',
  hint: 'Watch the spirit level and the dashed line. The last flat rests on three supports: too much slack tips it. A little seat faces the floor up in the fly gallery...',
  postcard: 'Brady! The stagehands let me pay out a rope. I said "a bit more" four times and they said I was a natural. ♥ C',
  enemies: [['seatsCrab', 2], ['seatsHen', 2], ['seatsStoat', 1], ['seatsShrew', 1]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '33-3' } },
  areas: [
    { id: 'flies', gen: 'room', theme: 'seats_flies', stamp: 'seatsFlies', camera: 'free', bottomKill: true },
    { id: 'weights', gen: 'room', role: 'secret', theme: 'seats_room_weights', stamp: 'seatsWeights', room: 'seatsScale' }
  ] };

//NEXT
Tour.amend('seats', { stamps, levels: [L1, L2] });
Tour.seatsKit.L = { L1, L2 };

/* ---------------- the land's map: a stage seen from the wings, the route a loop round the trap room ---------------- */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.seats = {
  labels: { '33-1': 'Two Ways Round a Pole', '33-2': 'Slack Department', '33-3': 'The Seat That Ate Row G', '33-4': 'Please Mind the Scenery', '33-5': 'House Left', '33-6': 'Just One More Bow' },
  w: 1520, h: 760,
  pal: { sea: '#2a1424', deep: '#1a0a14', land: '#8a5a3a', light: '#a8744a', path: '#f4e6c4', beach: '#6a4228', cliff: '#4e1430', roof: '#c8562a', wall: '#f4e6c4' },
  sea: 'clouds', coast: 'seatsCurtain', tufts: 'none', trail: 'stones', bridge: 'rope', meadow: false, woods: false, foam: false, birds: false,
  land: [[[220, 300], [420, 200], [760, 170], [1100, 200], [1320, 300], [1360, 480], [1240, 640], [920, 690], [600, 690], [300, 640], [200, 480]]],
  // the route runs a horseshoe round the stage: down the left wing, across the front of the stalls, up the right wing
  nodes: { start: [320, 260], '33-1': [330, 420, 's'], '33-2': [430, 580, 's'], '33-3': [640, 620, 's'], '33-4': [860, 620, 's'], '33-5': [1080, 580, 's'], '33-6': [1200, 400, 'n'], port: [1220, 250] },
  paths: { 'start>33-1': [[300, 340]], '33-1>33-2': [[360, 510]], '33-2>33-3': [[530, 630]], '33-3>33-4': [[750, 650]], '33-4>33-5': [[980, 630]], '33-5>33-6': [[1170, 500]], '33-6>port': [[1240, 320]] },
  feat: [
    ['sprite', 'seatsDoorSprite', 250, 250, 24], ['sprite', 'seatsTowerSprite', 520, 420, 30], ['sprite', 'seatsSeatSprite', 760, 470, 24], ['sprite', 'seatsBagSprite', 640, 330, 24],
    ['sprite', 'seatsTowerSprite', 980, 420, 26], ['sprite', 'seatsSeatSprite', 470, 300, 20], ['sprite', 'seatsBasketSprite', 1100, 300, 26]
  ],
  flora: ['rock'], density: 0,
  live: [['circle', 760, 360, 70, 0.5]]
};
})();
