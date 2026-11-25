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
  mound(130, 10, 3, 'H'); m.put(133, 11, 'l'); m.put(138, 11, 'D'); m.put(136, 11, 'a');
  m.put(143, 14, 'w'); m.put(146, 14, 'r'); m.put(141, 14, 'x');
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
  z: ['decor', 'auBigSign'], x: ['anchor', 'burrowBack']
};
stamps.auPouch = { floor: 15, rows: pouchRows, legend: POUCH, gold: { '*': 'must', R: 'risky' }, doors: [{ to: 'burrow@in', look: 'tourDoorHidden' }] };
// the wombat burrow under the mesa: a cosy den of tunnels, the wombat's snoring, P2 and a hidden water bottle
stamps.auBurrow = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#.....................*......#',
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
    { id: 'red', gen: 'room', theme: 'au_outback', stamp: 'auPouch', camera: 'free', au: { pouch: true } },
    { id: 'burrow', gen: 'room', role: 'secret', theme: 'au_burrow', stamp: 'auBurrow' }
  ] };

/* ---------------- placeholders (replaced level by level) ---------------- */
const simpleRoom = (id, extra) => ({ floor: 12, rows: ['############################'].concat(Array.from({ length: 11 }, (_, k) => '#' + (k === 10 ? '.@...........' + (extra || '.') + '..........G.' : '.'.repeat(26)) + '#')).concat(['############################', '############################']) });
stamps.auTmp = simpleRoom('tmp');
const tmp = (n, name, arch, theme, extra) => ({ n, name, arch, theme, gimmick: name, hint: name, postcard: name, enemies: [['auYabby', 1]], mapCell: [n % 3, Math.floor(n / 3)], mapFrom: n - 2,
  areas: [{ id: 'a', gen: 'room', stamp: 'auTmp' }], ...(extra || {}) });
const L2 = tmp(2, 'Road Train', 'convoy', 'au_highway');
const L3 = tmp(3, 'Platypus Creek', 'sonar', 'au_creek');
const L4 = tmp(4, 'The Canopy', 'web', 'au_canopy');
const L5 = { n: 5, name: 'The Drop Bear', mapLabel: 'Drop Bear', arch: 'lair', theme: 'au_night', boss: 'au_dropbear',
  gimmick: 'A gum tree at night. The drop bear is real, and he drops. Watch for the shadow',
  hint: 'When his shadow stops and darkens, MOVE. If he misses, he lands winded: stomp him!',
  postcard: 'The harbour\'s white sails are back where they belong! The drop bear says he was only ever "hanging about". ♥ C',
  enemies: [['auKooka', 1]],
  mapCell: [1, 2], mapFrom: 3,
  exits: { main: { to: 'country:next' } },
  areas: [
    { id: 'gums', gen: 'strip', W: 70, H: 18, theme: 'au_night',
      script: [['itemBlock', { item: 'power' }], ['flat', { n: 6 }], ['postcard', { kind: 'must', dy: -5 }], ['stairs', { n: 3 }], ['flat', { n: 4 }], ['itemBlock', { item: 'power' }], ['postcard', { kind: 'high', dy: -7, dx: -2 }], ['flat', { n: 4 }], ['postcard', { kind: 'risky', dy: -4 }], ['door', { to: 'arena@in', perch: 0 }]] },
    { id: 'arena', gen: 'arena', role: 'arena', layout: 'gum', arenaW: 26, H: 18, roof: false }
  ] };
const L6 = Object.assign(tmp(6, 'The Big Things', 'giant', 'au_big'), { secret: true, mapCell: [2, 2], mapFrom: 0, exits: { main: { to: 'node:16-2' } } });
for (const L of [L2, L3, L4]) L.exits = { main: { to: '16-' + (L.n + 1) } };

Tour.amend('au', { stamps, map: { fort: 'arena', start: [0, 0] }, levels: [L1, L2, L3, L4, L5, L6] });
})();
