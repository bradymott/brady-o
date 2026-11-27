/* ============================================================
   AUSTRALIA: the levels (world 16) and the land's map.
   16-1 POUCH EXPRESS   pouch   ride in a kangaroo's pouch across the red centre: hold JUMP to wind up a hop
   16-2 ROAD TRAIN      convoy  hop down a road train at speed, into a headwind, under low bridges, onto passing utes
   16-3 PLATYPUS CREEK  sonar   the creek at dusk: nothing shows until the platypus on your hat sends a PING
   16-4 THE CANOPY      web     giant webs in the gums are trampolines; every landing sends a tremor to the huntsman
   16-5 THE DROP BEAR   lair    a gum tree at night: watch for the shadow
   16-6 THE BIG THINGS  giant   (secret, from 16-1's cliff) tiny Brady among the roadside giants; everything rolls
   Stamps are drawn with a small grid helper (mk) so the coordinates stay exact; legend letters are listed with each.
   ============================================================ */
(function () {
const C = Tour.countries.au;
if (!C) return;
// a grid of '.' W x H: put, fill, horizontal / vertical runs, a row of coins; rows() gives the stamp's rows
const mk = (W, H) => {
  const g = []; for (let y = 0; y < H; y++) g.push(new Array(W).fill('.'));
  const o = {
    W, H,
    put(x, y, c) { if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = c; return o; },
    str(x, y, s) { for (let k = 0; k < s.length; k++) o.put(x + k, y, s[k]); return o; },
    fill(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) o.put(x, y, c); return o; },
    coins(x0, x1, y) { for (let x = x0; x <= x1; x += 2) o.put(x, y, 'o'); return o; },
    rows() { return g.map(r => r.join('')); }
  };
  return o;
};
const stamps = {};

/* ---------------- 16-1 Pouch Express ----------------
   The ground is row 15 (Brady stands on it), H 20; gullies go to the bottom (a fall is a life). Teach (safe: a step,
   a mound, a shallow dry creek), test (gullies of 5, 8 and 11 tiles, mounds of every height, emus on the flats),
   twist (the last third: crumbling sandstone ledges over the gullies while magpies swoop). The hidden exit: past the
   last checkpoint a brown sign points up a cliff to THE BIG THINGS; a full wind-up from the mound beside it reaches the
   ledge on top. */
const pouchRows = (() => {
  const m = mk(236, 20), GY = 15;
  m.fill(0, GY, 235, 19, '#');
  const pit = (x0, x1) => m.fill(x0, GY, x1, 19, '.');
  const mound = (x, w, h, ch) => m.fill(x, GY - h, x + w - 1, GY - 1, ch || 'B');
  // the start: the sign, a mushroom block, a road sign
  m.put(3, 14, '@').put(7, 14, 'k').put(12, 10, 'p').put(16, 14, 'r');
  // teach: a 2-high step, a 4-high mound, a dry creek (only 2 deep: hop back out)
  mound(22, 6, 2, 'H'); m.coins(23, 27, 11);
  mound(33, 3, 4); m.coins(33, 35, 9);
  m.fill(40, GY, 51, 16, '.'); m.put(45, 16, 'e');            // the dry creek bed (floor on row 17)
  m.put(46, 13, 't');
  // a row of termite mounds, heights 3, 5, 4: P1 on the tallest
  mound(56, 2, 3); mound(62, 3, 5); mound(69, 2, 4); m.put(63, 7, '*'); m.coins(56, 57, 10); m.coins(69, 70, 9);
  m.put(74, 14, 'u'); m.put(78, 14, 'n');
  // checkpoint 1
  m.put(84, 14, 'c');
  // test: gullies of 5, 8 and 11; an emu on the flat between; a mesa with the wombat burrow (the secret room)
  pit(90, 94); m.coins(91, 93, 10);
  m.put(97, 14, 'n'); m.put(100, 10, 'p');
  pit(104, 111); m.coins(105, 110, 8); m.put(107, 6, 'm');
  mound(113, 3, 2, 'H');
  pit(118, 128); m.put(123, 5, 'R'); m.coins(120, 126, 7);
  mound(130, 10, 3, '#'); m.put(136, 11, 'a');
  // the hidden way in: the mesa's left face is loose (a puff of red dust now and then): walk into it, along the
  // tunnel inside (P2 hangs in it), the burrow's door at the end
  m.fill(130, 13, 130, 14, 'F'); m.fill(131, 13, 136, 14, '.'); m.put(133, 13, 'V'); m.put(136, 14, 'D'); m.put(129, 14, 'P'); m.put(134, 14, 'x');
  m.put(143, 14, 'w'); m.put(146, 14, 'r'); m.put(147, 14, 'X');
  // a step down, a mound staircase over a long gully: 4, 6, 4 high, the gaps between bottomless
  pit(150, 166); mound(153, 2, 4); mound(158, 2, 6); mound(163, 2, 3); m.put(158, 5, 'm');
  // checkpoint 2
  m.put(170, 14, 'c');
  // twist: crumbling sandstone ledges over one long gully, magpies above; then the cliff to THE BIG THINGS
  pit(174, 206);
  m.fill(178, 12, 181, 12, 'C'); m.fill(186, 10, 189, 10, 'C'); m.fill(194, 12, 197, 12, 'C'); m.fill(202, 11, 205, 11, 'C');
  m.coins(186, 189, 8); m.put(183, 6, 'm'); m.put(199, 6, 'm');
  // the cliff top (the landing after the ledges), and high above the way on, the sandstone shelf with the secret gate:
  // only a full wind-up from the cliff top (where the brown sign stands) reaches it
  m.fill(207, 9, 211, 19, 'H'); m.put(209, 8, 'z');
  m.fill(214, 3, 219, 4, 'H'); m.put(218, 2, 'g'); m.coins(214, 216, 2);
  // the last flat and the gate
  m.fill(212, GY, 235, 19, '#');
  m.put(224, 14, 'n'); m.put(230, 14, 'G'); m.put(220, 14, 'e');
  return m.rows();
})();
const POUCH = {
  k: ['spawn', 'sign', { text: 'G\'DAY! YOU\'RE IN THE POUCH. HOLD JUMP TO WIND UP A HOP, LET GO TO LEAP. THE LONGER YOU HOLD, THE FURTHER YOU GO!' }],
  p: ['piece', 'box', { item: 'power' }], r: ['decor', 'auRoadSign'], t: ['decor', 'auTermite'], u: ['decor', 'auGum'], w: ['decor', 'auWindmill'], e: ['decor', 'auSpinifex'],
  n: ['enemy', 'auEmu'], m: ['enemy', 'auMagpie'], a: ['enemy', 'auWombat'],
  l: ['decor', 'auHollowLog'],
  z: ['decor', 'auBigSign'], x: ['anchor', 'burrowBack'], X: ['anchor', 'burrowOut'], P: ['spawn', 'auPuff', {}]
};
stamps.auPouch = { floor: 15, rows: pouchRows, legend: POUCH, gold: { '*': 'must', R: 'risky', V: 'hidden' }, doors: [{ to: 'burrow@in', look: 'tourDoorHidden' }] };
// the wombat burrow under the mesa: a cosy den of tunnels, the wombat's snoring, P2 and a hidden water bottle
stamps.auBurrow = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#............................#',
    '#...o.o.o.........------.....#',
    '#..-------...................#',
    '#.............h..............#',
    '#........------..............#',
    '#............................#',
    '#..................------....#',
    '#....o.o.o.o.................#',
    '#............................#',
    '#.@...D.........l.......l....#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'red@burrowBack', look: 'tourDoorHidden' }],
  legend: { l: ['decor', 'auLantern'] }
};
const L1 = { n: 1, name: 'Pouch Express', arch: 'pouch', theme: 'au_outback',
  gimmick: 'Ride in a kangaroo\'s pouch across the red centre: hold JUMP to wind up a hop, let go to leap. The longer the hold, the further the leap',
  hint: 'No run-up needed: the wind-up is everything. Watch the ring over your head. Sandstone that shakes is about to go!',
  postcard: 'A kangaroo gave you a lift! She says you\'re heavier than her joey. ♥ C',
  enemies: [['auEmu', 2], ['auMagpie', 2]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '16-2' }, secret: { to: '16-6', hint: 'A brown sign points up a cliff: THE BIG THINGS...' } },
  areas: [
    { id: 'red', gen: 'room', theme: 'au_outback', stamp: 'auPouch', camera: 'free', au: { pouch: true, fakeFill: [[130, 13, 136, 14]] } },
    { id: 'burrow', gen: 'room', role: 'secret', theme: 'au_burrow', stamp: 'auBurrow', room: 'auEcho', auEcho: { exit: 'red@burrowOut' } }
  ] };


/* ---------------- 16-2 Road Train ----------------
   The convoy runs right to left under us: the decks are still, the road and everything beside it race past (the
   AuRoad controller). Rows: decks of flatbeds on row 10, box vans' roofs on row 7, tankers on row 8, the road on row
   13 (a fall is a life). A steady headwind blows Brady back down the trailers; gusts double it (dust streaks first).
   LOW BRIDGES sweep the two marked stretches of flatbeds (a warning sign and a dashed line first): be small or crouch.
   The two widest gaps are crossed on an overtaking ute. Teach (short gaps, the first bridge over flat decks), test
   (box vans and tankers, cockatoos, the first ute), twist (bridges, a ute and magpies together in the last third). */
const convoyRows = (() => {
  const m = mk(248, 16);
  const trailer = (x0, w, top) => { m.fill(x0, top, x0 + w - 1, top, '#'); m.fill(x0, top + 1, x0 + w - 1, 11, top < 10 ? '#' : 'H');   // (box vans and tankers: steel all through)
 m.put(x0 + 1, 12, 'w'); if (w > 10) m.put(x0 + w - 5, 12, 'w'); };
  trailer(0, 30, 10); m.put(3, 9, '@').put(6, 9, 'k').put(1, 9, 'Z').put(9, 6, 'p'); m.fill(14, 8, 15, 9, 'B'); m.coins(18, 26, 7);
  trailer(33, 20, 10); m.put(48, 9, 'a'); m.coins(36, 44, 8);
  trailer(57, 14, 7); m.put(63, 4, '*'); m.fill(55, 9, 56, 9, '.');
  trailer(75, 16, 10); m.put(80, 6, 'p'); m.put(86, 9, 'c'); m.fill(76, 8, 77, 9, 'B');
  m.put(91, 11, 'u'); m.put(96, 9, 'R'); m.put(97, 4, 'm');
  trailer(102, 16, 10); m.fill(110, 8, 111, 9, 'B'); m.coins(104, 108, 7); m.put(108, 4, 'm');
  trailer(122, 18, 10); m.fill(126, 8, 127, 9, 'B'); m.coins(124, 130, 6);
  trailer(144, 17, 7); m.put(150, 6, 'a'); m.put(158, 6, 'c');
  // the hidden way in: one roof panel of the box van is a loose hatch (a different tile; red dust puffs up beside it):
  // DOWN + JUMP on it drops into a cubby in the van (P2) and the sheep van's door
  m.fill(147, 7, 148, 7, '-'); m.fill(145, 8, 149, 9, '.'); m.put(146, 8, 'V'); m.put(149, 9, 'D'); m.put(149, 6, 'P'); m.put(145, 9, 'x'); m.put(155, 6, 'X'); m.put(147, 6, 'A'); m.put(147, 9, 'J');
  trailer(165, 26, 10); m.fill(172, 8, 173, 9, 'B'); m.coins(176, 186, 8);
  m.put(191, 11, 'u'); m.put(196, 5, 'm'); m.coins(193, 199, 10);
  trailer(202, 13, 10);
  trailer(219, 16, 8); m.put(231, 7, 'G'); m.put(240, 12, 'f'); m.coins(221, 227, 6);
  return m.rows();
})();
const CONVOY = {
  k: ['spawn', 'sign', { text: 'ROAD TRAIN! HOLD RIGHT INTO THE HEADWIND. LOW BRIDGE? GET DOWN: HOLD DOWN (OR BE SMALL). THE UTES OVERTAKE: RIDE THEIR TRAYS OVER THE WIDE GAPS' }],
  Z: ['piece', 'convoy', { road: 13, wind: 1.8, bridges: [[33, 53], [165, 215]], bridgeY: 8.875, every: 5 }],
  p: ['piece', 'box', { item: 'power' }], w: ['piece', 'wheels', { n: 2 }], u: ['piece', 'ute', { ax: 6, w: 4, speed: 1.5 }],
  a: ['enemy', 'auCocky'], m: ['enemy', 'auMagpie'], q: ['decor', 'auSheep'], f: ['decor', 'auCab'], x: ['anchor', 'vanBack'], X: ['anchor', 'vanOut'], P: ['spawn', 'auPuff', {}], A: ['anchor', 'edgeA2'], J: ['anchor', 'edgeB2']
};
stamps.auConvoy = { floor: 10, rows: convoyRows, legend: CONVOY, gold: { '*': 'must', R: 'risky', V: 'hidden' }, doors: [{ to: 'van@in', look: 'tourDoorHidden' }] };
// inside the sheep van: a woolly crowd, P2 on the top rail, a hidden water bottle
stamps.auSheepVan = {
  floor: 13,
  rows: [
    '##############################',
    '#............................#',
    '#............................#',
    '#..------....................#',
    '#..............o.o.o.........#',
    '#..........h.................#',
    '#.......------...............#',
    '#............................#',
    '#............................#',
    '#..............------........#',
    '#.......q.......q......q.....#',
    '#............................#',
    '#.@...D......................#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'convoy@vanBack', look: 'tourDoorHidden' }],
  legend: { q: ['decor', 'auSheep'] }
};
const L2 = { n: 2, name: 'Road Train', arch: 'convoy', theme: 'au_highway',
  gimmick: 'Hop down a road train at speed: a headwind in your face, low bridges sweeping the decks, utes overtaking beside the widest gaps',
  hint: 'Keep pushing RIGHT or the wind blows you off the back. When the LOW BRIDGE sign flashes, get low on a flat deck',
  postcard: 'A road train! Fifty wheels and not one of them stops for lunch. ♥ C',
  enemies: [['auCocky', 2], ['auMagpie', 2]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '16-3' } },
  areas: [
    { id: 'convoy', gen: 'room', theme: 'au_highway', stamp: 'auConvoy', camera: 'free', au: { convoy: true, fakeFill: [[145, 8, 149, 9]] } },
    { id: 'van', gen: 'room', role: 'secret', theme: 'au_burrow', stamp: 'auSheepVan', room: 'auMuster', auMuster: { exit: 'convoy@vanOut', prize: ['star'] } }
  ] };


/* ---------------- 16-3 Platypus Creek ----------------
   The creek at dusk, nearly dark. The water is thick mud (a fall is a life). The banks show in Brady's own glow; the
   stepping stones (X), the logs (Y) and the snags on them (Z) are light-only: they show only while a PING's light is
   on them. The platypus on Brady's hat pings on the action button (as often as you like, once a second). Teach
   (visible log, then three stones close together), test (stones at every height, snag-topped decoys beside the safe
   stones, yabbies), twist (drifting logs that also show only in the ping, while kookaburras laugh and dive). */
const creekRows = (() => {
  const m = mk(216, 18);
  m.fill(0, 12, 215, 17, '#');
  const gap = (x0, x1) => m.fill(x0, 12, x1, 17, '.');
  const st = (x, y, n, ch) => m.fill(x, y, x + (n || 2) - 1, y, ch || 'X');
  m.put(0, 11, 'M').put(2, 11, '@').put(5, 11, 'k').put(8, 8, 'p').put(11, 11, 'r');
  gap(15, 17); m.fill(15, 12, 17, 12, '-');
  gap(25, 40); st(28, 12, 3); st(33, 11, 3); st(38, 12, 1); m.coins(29, 33, 9);
  m.put(46, 8, 'p'); m.put(44, 11, 'r');
  gap(51, 80); st(54, 11); st(59, 9); m.put(59, 7, '*'); st(64, 10); st(69, 12); m.fill(69, 11, 70, 11, 'Z'); st(70, 8); st(75, 10); m.put(76, 9, 'n');
  m.put(84, 11, 'c'); m.put(90, 11, 'n'); m.put(98, 11, 'r');
  // the hidden way in: two tiles of the bank are an old log (red dust puffs up between them): DOWN + JUMP drops
  // through into a tunnel under the bank (P2), the glow-worm cave's door at its end
  m.fill(94, 12, 95, 12, '-'); m.fill(93, 13, 99, 14, '.'); m.put(97, 13, 'V'); m.put(99, 14, 'D'); m.put(93, 14, 'q'); m.put(96, 11, 'P'); m.put(96, 14, 'x'); m.put(94, 11, 'A'); m.put(94, 14, 'B'.replace('B', 'J'));
  gap(101, 140); st(104, 11, 3); m.put(105, 10, 'n'); st(110, 9); st(115, 11); m.fill(115, 10, 116, 10, 'Z'); st(116, 7); st(121, 10); st(126, 12); st(131, 10, 3); m.put(129, 6, 'R'); st(137, 11);
  m.put(144, 11, 'c'); m.put(146, 6, 'e'); m.put(148, 11, 'r');
  gap(151, 195); m.put(152, 13, 'u'); st(162, 11); m.put(165, 13, 'j'); st(177, 10); m.put(180, 13, 'w'); st(193, 11);
  m.put(175, 5, 'e'); m.put(188, 5, 'e'); m.coins(166, 172, 9);
  m.put(203, 11, 'r'); m.put(208, 11, 'G');
  return m.rows();
})();
const CREEK = {
  M: ['piece', 'mud', { y: 14 }],
  k: ['spawn', 'sign', { text: 'PLATYPUS CREEK. IT\'S DARK! PRESS ACTION: THE PLATYPUS ON YOUR HAT PINGS, AND THE STONES SHOW FOR A MOMENT. THE MUD IS DEEP' }],
  p: ['piece', 'box', { item: 'power' }],
  X: ['tile', 'HARD', { hide: 3 }], Y: ['tile', 'SEMI', { hide: 3 }], Z: ['tile', 'SPIKES', { hide: 3 }],
  n: ['enemy', 'auYabby'], e: ['enemy', 'auKooka'], r: ['decor', 'auReed'], q: ['decor', 'auGlow'], x: ['anchor', 'caveBack'], P: ['spawn', 'auPuff', {}], A: ['anchor', 'edgeA1'], J: ['anchor', 'edgeB1'],
  u: ['piece', 'raft', { ax: 6, w: 3, speed: 1.0 }], j: ['piece', 'raft', { ax: 7, w: 3, speed: 1.2, phase: 2 }], w: ['piece', 'raft', { ax: 8, w: 3, speed: 1.3, phase: 4 }]
};
stamps.auCreek = { floor: 12, rows: creekRows, legend: CREEK, gold: { '*': 'must', R: 'risky', V: 'hidden' }, doors: [{ to: 'cave@in', look: 'tourDoorHidden' }] };
// the glow-worm cave in the bank: P2 under the glow-worms, a hidden water bottle
stamps.auGlowCave = {
  floor: 12,
  rows: [
    '##############################',
    '#....q.......q.......q.......#',
    '#............................#',
    '#..............-----.........#',
    '#.........h..................#',
    '#.....-----..................#',
    '#........................o.o.#',
    '#..............-----.........#',
    '#..o.o.o.....................#',
    '#.......................-----#',
    '#............................#',
    '#.@...D..........q...........#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'creek@caveBack', look: 'tourDoorHidden' }],
  legend: { q: ['decor', 'auGlow'] }
};
const L3 = { n: 3, name: 'Platypus Creek', arch: 'sonar', theme: 'au_creek',
  gimmick: 'A creek at dusk. Nothing shows until the platypus on your hat sends a PING: the stones, the snags and the drifting logs light up for a moment',
  hint: 'Ping (ACTION), look, then jump. A stone with a snag on it has a safe one near it. The drifting logs only show in the ping',
  postcard: 'A platypus! It\'s a duck, a beaver and an otter at once. It says you\'re the odd-looking one. ♥ C',
  enemies: [['auYabby', 2], ['auKooka', 2]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '16-4' } },
  areas: [
    { id: 'creek', gen: 'room', theme: 'au_creek', stamp: 'auCreek', camera: 'free', au: { sonar: true, fakeFill: [[93, 13, 99, 14]] } },
    { id: 'cave', gen: 'room', role: 'secret', theme: 'au_burrow', stamp: 'auGlowCave', room: 'auOpals', auOpals: { prize: ['oneup', 'magnet'] }, au: { sonar: true } }
  ] };


/* ---------------- 16-4 The Canopy ----------------
   High in the gums at twilight; the forest floor is far below (a fall is a life). Limbs (ground) are joined by giant
   webs, which are trampolines (a little hop if you just land, a huge one if you hold JUMP), and by web ladders. Every
   bounce sends a tremor along the strand: it runs about 12 tiles (15 for a big bounce, 3 if you hold DOWN as you land
   and cling). A tremor that reaches a huntsman brings him scuttling over to see who it was; bump into him and it
   hurts, bounce on his back and he goes home in a huff. Teach (a web with nobody on it, a ladder, then a web whose
   huntsman is a heavy sleeper), test (webs where he will come: bounce high and away, or cling), twist (one long web
   with a huntsman at each end while kookaburras dive). */
const canopyRows = (() => {
  // (built 4 rows lower than first drawn: the top rows are the crown run's sky)
  const m0 = mk(200, 26), O = 4, m = {
    put(x, y, c) { m0.put(x, y + O, c); return m; }, fill(x0, y0, x1, y1, c) { m0.fill(x0, y0 + O, x1, y1 + O, c); return m; }, coins(x0, x1, y) { m0.coins(x0, x1, y + O); return m; }
  };
  const limb = (x0, x1, y) => m.fill(x0, y, x1, y + 1, '#');
  m0.fill(0, 0, 1, 25, 'H');
  limb(2, 16, 16); m.put(3, 15, '@').put(6, 15, 'k').put(10, 12, 'p').put(13, 15, 'l');
  m.put(17, 16, 'A'); m.coins(18, 23, 9);
  limb(25, 34, 16); m.put(28, 15, 'l');
  m.put(35, 16, 'u'); limb(37, 48, 8); m.put(39, 4, 'p'); m.coins(41, 45, 5);
  m.put(49, 10, 'a'); m.put(57, 6, '*');
  limb(61, 70, 8); m.put(66, 7, 'c');
  m.put(71, 13, 'd'); m.coins(74, 82, 7);
  limb(87, 95, 6);
  m.put(96, 11, 'E'); m.put(102, 4, 'e'); m.put(104, 3, 'R');
  limb(110, 118, 9); m.put(116, 8, 'c'); m.put(113, 8, 'l'); m.put(112, 8, 'X');
  m.put(120, 12, 'f'); m.put(124, 5, 'e'); m.put(131, 5, 'e'); m.coins(122, 132, 8);
  limb(136, 150, 9); m.put(147, 8, 'l');
  m.put(151, 13, 'J'); m.put(158, 6, 'e');
  for (const [x, y] of [[4, 15], [31, 15], [40, 7], [47, 7], [63, 7], [90, 5], [112, 8], [139, 8], [144, 8], [176, 4], [186, 4], [194, 4]]) if (m0.rows()[y + O][x] === '.') m.put(x, y, 'l');
  m.coins(98, 106, 6); m.coins(153, 160, 9); m.coins(185, 193, 2);
  m.put(163, 13, 'K'); limb(165, 199, 5); m.put(180, 4, 'G'); m.put(170, 4, 'l');
  // THE CROWN RUN (a hidden way in, above the level): a high limb over the first webs, rows 7-8 of the 26, with a
  // gap over the heavy sleeper's web. A big bounce there goes up through the gap (red dust sifts down out of it); a
  // run along the crown with coins and two kookaburras, P2 on the way, the possum's hollow at its end, and its far
  // end open: a drop back down onto the limb beyond
  m0.fill(47, 7, 76, 8, '#'); m0.fill(50, 7, 52, 8, '.'); m0.put(51, 9, 'P');
  m0.coins(55, 61, 5); m0.coins(63, 69, 4); m0.put(66, 6, 'V'); m0.put(60, 3, 'e'); m0.put(69, 3, 'e');
  m0.put(74, 6, 'D'); m0.put(72, 6, 'x'); m0.put(48, 6, 'l'); m0.put(70, 6, 'l');
  // big hanging clumps of gum leaves in the open sky
  for (const x of [12, 30, 104, 126, 146, 160, 190]) m0.put(x, 3, 'L'.replace('L', 'n'));
  return m0.rows();
})();
const CANOPY = {
  k: ['spawn', 'sign', { text: 'THE CANOPY. WEBS ARE TRAMPOLINES: HOLD JUMP TO GO HIGH. EVERY BOUNCE SHAKES THE WEB, AND THE HUNTSMAN COMES TO SEE WHO IT IS! HOLD DOWN AS YOU LAND TO CLING QUIETLY' }],
  p: ['piece', 'box', { item: 'power' }], l: ['decor', 'auGumLeaves'], q: ['decor', 'auGlow'], x: ['anchor', 'hollowBack'], X: ['anchor', 'hollowDrop'], e: ['enemy', 'auKooka'],
  P: ['spawn', 'auPuff', { down: true }], n: ['decor', 'auLeafClump'],
  A: ['piece', 'web', { w: 8 }], u: ['piece', 'webLadder', { w: 2, h: 8 }],
  a: ['piece', 'web', { w: 12, spider: 'right', reach: 0.55 }],
  d: ['piece', 'web', { w: 15, spider: 'right', reach: 0.85 }],
  E: ['piece', 'web', { w: 14, spider: 'left', reach: 1 }],
  f: ['piece', 'web', { w: 14, spider: 'both', reach: 1 }], J: ['piece', 'web', { w: 12, spider: 'right', reach: 1 }],
  K: ['piece', 'webLadder', { w: 2, h: 8 }]
};
stamps.auCanopy = { floor: 20, rows: canopyRows, legend: CANOPY, gold: { '*': 'must', R: 'risky', V: 'hidden' }, doors: [{ to: 'hollow@in', look: 'tourDoorHidden' }] };
// the tree hollow: a possum's flat (the possum is out), P2 on the top shelf, a hidden water bottle
stamps.auHollow = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#............................#',
    '#.................-----......#',
    '#..o.o.o.....................#',
    '#.-------.........h..........#',
    '#............................#',
    '#..........------............#',
    '#............................#',
    '#....................------..#',
    '#............................#',
    '#.@...D.....q.........q......#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'canopy@hollowBack', look: 'tourDoorHidden' }],
  legend: { q: ['decor', 'auLantern'] }
};
const L4 = { n: 4, name: 'The Canopy', arch: 'web', theme: 'au_canopy',
  gimmick: 'Giant webs strung through the gums are trampolines and ladders, but every bounce sends a tremor down the strand, and a tremor that reaches the huntsman brings him over',
  hint: 'Hold JUMP on a web to bounce high. Bounce far from the huntsman, or hold DOWN as you land to cling quietly. If he comes, bounce on his back!',
  postcard: 'A huntsman spider the size of a dinner plate! He waved. With all eight. ♥ C',
  enemies: [['auKooka', 3]],
  mapCell: [2, 1], mapFrom: 2,
  exits: { main: { to: '16-5' } },
  areas: [
    { id: 'canopy', gen: 'room', theme: 'au_canopy', stamp: 'auCanopy', camera: 'free', au: { web: true } },
    { id: 'hollow', gen: 'room', role: 'secret', theme: 'au_burrow', stamp: 'auHollow', room: 'auShell', auShell: { exit: 'canopy@hollowDrop' } }
  ] };

/* ---------------- 16-5 The Drop Bear: the walk in under the gums, then his tree ----------------
   A short night walk through the gum forest: two power-ups, a kookaburra, a hollow trunk with a crack in it (a fake
   wall) hiding P2, then the clearing under the big gum. */
const gumsRows = (() => {
  const m = mk(72, 18);
  m.fill(0, 14, 71, 17, '#'); m.fill(0, 0, 0, 13, 'H');
  m.put(2, 13, '@').put(5, 13, 'k').put(8, 10, 'p').put(12, 13, 'u');
  m.fill(15, 11, 19, 11, '-'); m.fill(20, 8, 24, 8, '-'); m.put(22, 6, '*'); m.coins(16, 18, 9);
  m.put(27, 4, 'e'); m.put(30, 13, 'u');
  m.fill(38, 4, 43, 13, 'H'); m.fill(38, 11, 43, 13, 'F'); m.fill(39, 11, 42, 12, '.'); m.fill(38, 11, 38, 13, 'F'); m.fill(43, 11, 43, 13, 'F'); m.put(41, 12, '*'.replace('*', 'V'));
  m.fill(35, 9, 37, 9, '-'); m.put(44, 13, 'n');
  m.put(50, 10, 'p'); m.fill(53, 10, 57, 10, '-'); m.put(55, 6, 'U'); m.put(58, 13, 'u');
  m.put(66, 13, 'D');
  return m.rows();
})();
stamps.auGums = { floor: 14, rows: gumsRows, gold: { '*': 'must', V: 'hidden', U: 'high' }, doors: [{ to: 'arena@in', look: 'tourDoor' }],
  legend: { k: ['spawn', 'sign', { text: 'DROP BEARS AREN\'T REAL. ...ARE THEY? KEEP AN EYE ON THE GROUND UNDER THE TREES' }], p: ['piece', 'box', { item: 'power' }], u: ['decor', 'auGum'], e: ['enemy', 'auKooka'], n: ['decor', 'auGumLeaves'] } };

const L5 = { n: 5, name: 'The Drop Bear', mapLabel: 'Drop Bear', arch: 'lair', theme: 'au_night', boss: 'au_dropbear',
  gimmick: 'A gum tree at night. The drop bear is real, and he drops. Watch for the shadow',
  hint: 'When his shadow stops and darkens, MOVE. If he misses, he lands winded: stomp him!',
  postcard: 'The harbour\'s white sails are back where they belong! The drop bear says he was only ever "hanging about". ♥ C',
  enemies: [['auKooka', 1]],
  mapCell: [1, 2], mapFrom: 3,
  exits: { main: { to: 'country:next' } },
  areas: [
    { id: 'gums', gen: 'room', theme: 'au_night', stamp: 'auGums', camera: 'free' },
    { id: 'arena', gen: 'arena', role: 'arena', layout: 'gum', arenaW: 26, H: 18, roof: false }
  ] };

/* ---------------- 16-6 The Big Things (secret, from 16-1's cliff shelf) ----------------
   A roadside lay-by of fibreglass giants: Brady is tiny among them. Giant oranges roll back and forth across the
   gaps (ride on top); fruit stalls roll giant mangoes down at Brady (jump them, or land on one: BOING, a huge bounce).
   The first plinth is too tall to jump: wait under it for a mango to come tumbling off the top and bounce off it (the
   checker is told about that one bounce with an edge; tools/sbw_au_shots.js plays it). Inside the giant pineapple:
   P2 and a water bottle. */
const bigRows = (() => {
  const m = mk(184, 18), GY = 14;
  m.fill(0, GY, 183, 17, '#');
  const gap = (x0, x1) => m.fill(x0, GY, x1, 17, '.');
  m.put(2, 13, '@').put(5, 13, 'k').put(9, 10, 'p').put(15, 13, 'f');
  gap(22, 31); m.put(22, 14, 'o'.replace('o', 'O')); m.put(26, 8, 'R'); m.coins(23, 30, 11);
  // the tall plinth (6 high) and the stall on top of it rolling mangoes off its left edge
  m.fill(43, 9, 60, 13, 'H'); m.put(56, 8, 'Z'); m.put(48, 6, '*'); m.put(39, 13, 'E'); m.put(45, 8, 'e'); m.put(36, 13, 'n');
  m.fill(61, 11, 64, 13, '#');
  // the hidden way in: the little plinth's far face is loose (red dust): walk back into it; a cubby (P2), the door
  m.fill(64, 12, 64, 13, 'F'); m.fill(62, 12, 63, 13, '.'); m.put(63, 12, 'V'); m.put(62, 13, 'D'); m.put(65, 13, 'P'); m.put(63, 13, 'x');
  m.put(70, 13, 'c'); m.put(74, 13, 'P'); m.put(80, 10, 'p');
  // the giant pineapple (the secret room's door), the giant banana
  m.put(86, 13, 'q'); m.put(100, 13, 'j');
  // twist: two rolling oranges over long gaps while mangoes roll at the landings
  gap(106, 116); m.put(106, 14, 'O'); m.put(112, 6, 'm');
  m.put(126, 13, 'K'); m.put(120, 13, 'c');
  gap(132, 143); m.put(132, 14, 'O'); m.coins(133, 142, 10);
  m.put(160, 13, 'K'); m.put(150, 13, 'w'); m.put(172, 13, 'G');
  return m.rows();
})();
const BIG = {
  k: ['spawn', 'sign', { text: 'THE BIG THINGS! EVERYTHING HERE IS GIANT, AND EVERYTHING ROLLS. RIDE THE ORANGES. LAND ON A ROLLING MANGO: BOING!' }],
  p: ['piece', 'box', { item: 'power' }], O: ['piece', 'orange', { ax: 6, w: 3, speed: 1.4 }],
  Z: ['piece', 'stall', { every: 3.4, dir: -1, speed: 4 }], K: ['piece', 'stall', { every: 3.0, dir: -1, speed: 5, delay: 0.8 }],
  f: ['decor', 'auGiantPrawn'], P: ['decor', 'auGiantBoot'], q: ['decor', 'auGiantPineapple'], j: ['decor', 'auGiantBanana'], w: ['decor', 'auGiantBoot'],
  E: ['anchor', 'edgeA1'], e: ['anchor', 'edgeB1'], P: ['spawn', 'auPuff', {}], n: ['decor', 'auGum'], m: ['enemy', 'auMagpie'], x: ['anchor', 'pineBack']
};
stamps.auBig = { floor: 14, rows: bigRows, legend: BIG, gold: { '*': 'must', R: 'risky', V: 'hidden' }, doors: [{ to: 'pine@in', look: 'tourDoorHidden' }] };
stamps.auPineapple = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#............................#',
    '#..------....................#',
    '#..............o.o.o.........#',
    '#..........h.................#',
    '#.......------...............#',
    '#............................#',
    '#............................#',
    '#..............------........#',
    '#............................#',
    '#.@...D......................#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'layby@pineBack', look: 'tourDoorHidden' }]
};
const L6 = { n: 6, name: 'The Big Things', arch: 'giant', secret: true, theme: 'au_big',
  gimmick: 'The roadside giants: a giant prawn, a giant boot, a giant pineapple. Brady is tiny, and everything rolls: ride the giant oranges, bounce off the tumbling mangoes',
  hint: 'Too tall to climb? Wait for a mango to come tumbling and land on it: BOING!',
  postcard: 'THE BIG THINGS! A giant prawn, a giant boot and a giant pineapple. I bought a normal-sized postcard. ♥ C',
  enemies: [['auMagpie', 1]],
  mapCell: [2, 2], mapFrom: 0,
  exits: { main: { to: 'node:16-2' } },
  areas: [
    { id: 'layby', gen: 'room', theme: 'au_big', stamp: 'auBig', camera: 'free', au: { fakeFill: [[62, 12, 64, 13]] } },
    { id: 'pine', gen: 'room', role: 'secret', theme: 'au_burrow', stamp: 'auPineapple', room: 'auOddOne', auOddOne: { prize: ['star'] } }
  ] };

// the hidden passages (au.fakeFill) are fake-wall tiles: they look like the rock round them and fade as Brady walks
// in. And the moves the checker can't work out for itself, each one played in tools/sbw_au_shots.js: an anchor edgeA<n>
// (where Brady stands) and edgeB<n> (where the move really takes him): 16-2's and 16-3's drops through a hatch / an old log (DOWN + JUMP),
// 16-6's bounce off a tumbling mango onto the tall plinth
{ const ed = TourBuild.generateV2; TourBuild.generateV2 = function (Cc, spec, w, i, a) { const L = ed.apply(this, arguments); if (Cc && Cc.id === 'au') for (const A of L.areas) { const ff = A.au && A.au.fakeFill; if (ff) for (const [x0, y0, x1, y1] of ff) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (A.tiles[y * A.W + x] === T.EMPTY) A.tiles[y * A.W + x] = T.FAKE; const an = A.anchors || {}; for (const k in an) { if (k.indexOf('edgeA') !== 0) continue; const b = an['edgeB' + k.slice(5)]; if (b) (A.edges || (A.edges = [])).push({ from: [Math.floor(an[k].x / TS), Math.floor(an[k].y / TS) - 1], to: [Math.floor(b.x / TS), Math.floor(b.y / TS)] }); } } return L; }; }
/* ---------------- the land's map: the red centre to the coast ----------------
   A loop round the land: the airstrip in the south-west, north through the red dunes (16-1; the lay-by of the Big
   Things, 16-6, off to the south of it), the highway across the north (16-2), the creek (16-3), the gum forest
   (16-4), the big gum tree (16-5), and down to the harbour on the south coast (the port). No great red rock: low ranges only. */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.au = {
  labels: { '16-1': 'Pouch Express', '16-2': 'Road Train', '16-3': 'Platypus Creek', '16-4': 'The Canopy', '16-5': 'Drop Bear', '16-6': 'Big Things' },
  w: 1700, h: 900,
  pal: { land: '#d8844a', light: '#eaa86a', path: '#f8e4b8', beach: '#f6e2a8' },
  sea: 'reef', beachW: 40, trail: 'sand', tufts: 'sand',
  land: [[[70, 470], [150, 300], [330, 210], [560, 150], [760, 110], [900, 60], [1000, 150], [1120, 120], [1260, 200], [1420, 240], [1560, 330], [1630, 470], [1600, 640], [1500, 760], [1330, 830], [1150, 800], [980, 840], [800, 760], [620, 730], [430, 790], [250, 760], [120, 660]]],
  nodes: { start: [180, 640], '16-1': [300, 400], '16-6': [430, 580], '16-2': [560, 240], '16-3': [900, 330], '16-4': [1200, 270], '16-5': [1390, 520], port: [1200, 760] },
  paths: { 'start>16-1': [[220, 520]], '16-1>16-2': [[400, 290]], '16-1>16-6': [[350, 500]], '16-6>16-2': [[520, 420]], '16-2>16-3': [[740, 260]], '16-3>16-4': [[1060, 300]], '16-4>16-5': [[1320, 380]], '16-5>port': [[1320, 680]] },
  feat: [
    ['patch', '#c8703a', [[300, 420], [480, 380], [560, 460], [460, 560], [320, 560]]],
    ['river', [[880, 100], [900, 260], [950, 420], [920, 560], [960, 700], [1000, 840]], 14],
    ['lake', [[960, 640], [1010, 625], [1030, 660], [985, 680], [955, 665]]],
    ['patch', '#7aa060', [[1080, 300], [1280, 280], [1350, 420], [1300, 620], [1120, 600], [1060, 460]]],
    ['trees', ['round', 'round', 'bush'], 1200, 450, 150, 22],
    ['range', 'mtn', [[700, 230, 26], [760, 250, 22], [820, 220, 24], [300, 300, 22], [380, 280, 18]], {}],
    ['sprite', 'termite', 420, 600, 16], ['sprite', 'termite', 470, 610, 12], ['sprite', 'termite', 300, 470, 14], ['sprite', 'termite', 700, 640, 14],
    ['sprite', 'rock', 1620, 600, 12, { sea: true }]
  ],
  flora: ['bush', 'round', 'rock'], density: 26,
  scenes: { '16-1': 'herd', '16-2': 'dustdunes', '16-3': 'wetland', '16-4': 'canopy', '16-5': ['grove', { trees: ['round', 'round', 'round'], ground: '#5a7a4a' }], '16-6': 'market' },
  live: [['walk', 'goose', [[330, 600], [420, 640], [500, 600]], 8], ['circle', 1180, 360, 70, 1.0], ['fish', 990, 650, '#5a8ac8']]
};

Tour.amend('au', { stamps, map: { fort: 'arena', start: [0, 0] }, levels: [L1, L2, L3, L4, L5, L6] });
})();
