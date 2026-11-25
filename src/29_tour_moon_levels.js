/* ============================================================
   THE MOON: the levels (world 18) and the land's map. The hardest land of the game (ENCORE_TOUR.md §3): every
   level teaches its idea where a slip costs little, tests it, twists it, and its last third throws in everything
   the land has shown so far.
   18-1 ONE SMALL HOP (lowg)  low gravity: huge floaty jumps, dust geysers that lift, ceiling spikes that punish a
        full jump, golf balls from the sky. A telescope on the last rim points at the star gate (the secret exit).
   (18-2 to 18-6 below.)
   ============================================================ */
(function () {
const C = Tour.countries.moon;
if (!C) return;
const G0 = (Tour.moonKit && Tour.moonKit.MOON_G) || 0.55;
// a level drawn with a few calls instead of typed rows: a grid of '.', ground and rock put in, then each thing
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length) Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const pit = (Gr, x0, x1) => fillG(Gr, x0, 0, x1, Gr.length - 1, '.');
const rowsOf = Gr => Gr.map(r => r.join(''));
const stamps = {};

/* ---------------- 18-1 One Small Hop ---------------- */
// the floor is row 21. ① the teach: a hop over a shallow dip, a tall rim wall, the spike tunnel (tap jump);
// ② the crater field: the first geyser (to P1), deadly craters, the cracked boulder (the practice green), a pulsing
// geyser, a slab over a wide crater, the big crater whose geyser is the only way up the cliff; ③ the twist: spike
// overhangs over craters (a run and a medium jump), golf balls from the sky, then all of it: a geyser under spikes
// to a cliff, a long jump past a moth over the last crater (P3), the telescope, the star gate high in the sky
const hopRows = (() => {
  const W = 252, H = 26, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 12, 21); put(Gr, 3, 20, '@'); put(Gr, 6, 20, 'k'); put(Gr, 11, 20, 'n'); put(Gr, 9, 16, '?');
  ground(Gr, 13, 13, 20); ground(Gr, 14, 16, 23); ground(Gr, 17, 17, 20); put(Gr, 13, 15, 'o.o.o');
  ground(Gr, 18, 23, 21); put(Gr, 20, 20, 'p');
  ground(Gr, 24, 27, 16); put(Gr, 24, 14, 'o.o.');
  ground(Gr, 28, 50, 21); put(Gr, 29, 20, 'N');
  fillG(Gr, 30, 4, 46, 14, '#'); fillG(Gr, 31, 15, 45, 15, 'v'); put(Gr, 38, 20, 'B'); put(Gr, 33, 18, 'o.o'); put(Gr, 41, 18, 'o.o');
  // ② the crater field
  put(Gr, 53, 20, 'e');
  ground(Gr, 51, 55, 21); ground(Gr, 56, 60, 24); put(Gr, 57, 23, '1'); put(Gr, 55, 20, 'J');
  fillG(Gr, 60, 8, 64, 8, '-'); put(Gr, 60, 7, 'o.o.o'); put(Gr, 62, 5, '*');
  ground(Gr, 61, 64, 21);
  pit(Gr, 65, 70);
  ground(Gr, 71, 74, 19); put(Gr, 72, 18, 'r');
  pit(Gr, 75, 82); put(Gr, 78, 14, 'M'); put(Gr, 76, 15, 'o.o.o.o');
  ground(Gr, 83, 108, 21); put(Gr, 85, 20, 'c'); put(Gr, 89, 16, '?');
  put(Gr, 93, 20, 'X');
  put(Gr, 105, 20, 'u'); put(Gr, 103, 20, 'l');
  ground(Gr, 109, 113, 24); put(Gr, 110, 23, '3'); for (let y = 8; y <= 14; y += 2) put(Gr, 110, y, 'o');
  ground(Gr, 114, 116, 21);
  pit(Gr, 117, 128); fillG(Gr, 121, 16, 123, 16, '-'); put(Gr, 121, 14, 'o.o');
  ground(Gr, 129, 136, 21); put(Gr, 133, 20, 'm');
  pit(Gr, 137, 146); put(Gr, 141, 24, '2'); for (let y = 11; y <= 19; y += 2) put(Gr, 141, y, 'oo');
  ground(Gr, 147, 153, 12); put(Gr, 149, 11, 'r');
  ground(Gr, 154, 163, 21); put(Gr, 157, 20, 'c'); put(Gr, 160, 20, 'p');
  // ③ the twist: spike overhangs over craters
  fillG(Gr, 161, 2, 181, 13, '#'); fillG(Gr, 162, 14, 180, 14, 'v');
  pit(Gr, 164, 169); fillG(Gr, 161, 2, 181, 13, '#'); fillG(Gr, 162, 14, 180, 14, 'v');
  ground(Gr, 170, 174, 21); put(Gr, 172, 20, 'e');
  pit(Gr, 175, 179); fillG(Gr, 175, 2, 179, 13, '#'); fillG(Gr, 175, 14, 179, 14, 'v');
  ground(Gr, 180, 190, 21); put(Gr, 184, 20, 'z'); put(Gr, 188, 20, 'Z'); put(Gr, 186, 16, '?');
  // ... then all of it: a geyser under spikes up to a cliff, a long jump past a moth over the last crater (P3)
  pit(Gr, 191, 199); put(Gr, 194, 24, '5'); fillG(Gr, 192, 3, 197, 4, '#'); fillG(Gr, 192, 5, 197, 5, 'v');
  ground(Gr, 200, 204, 12); put(Gr, 202, 11, 'u');
  pit(Gr, 205, 212); put(Gr, 208, 12, 'R'); put(Gr, 207, 9, 'M');
  ground(Gr, 213, 217, 16); put(Gr, 215, 15, 'e');
  ground(Gr, 218, 224, 14); put(Gr, 221, 13, 'O'); put(Gr, 219, 13, 'z');
  // the narrow chasm with a faint dust vent: it blows all the way up to the star gate on its star rock
  pit(Gr, 225, 227); put(Gr, 225, 24, '4');
  fillG(Gr, 229, 7, 234, 8, '#'); put(Gr, 231, 6, 'g'); put(Gr, 229, 5, 'o.o.o.o');
  ground(Gr, 228, 251, 21); put(Gr, 233, 20, 'p'); put(Gr, 236, 20, 'm'); put(Gr, 243, 20, 'G'); put(Gr, 248, 20, 'p');
  fillG(Gr, 251, 0, 251, 25, '#');
  return rowsOf(Gr);
})();
const HOP = {
  k: ['decor', 'moonCrate'], p: ['decor', 'moonPoster'], r: ['decor', 'moonRock'], l: ['decor', 'moonGolf'], O: ['decor', 'moonScope'],
  n: ['spawn', 'sign', { text: 'LOW GRAVITY! HOLD JUMP FOR A HUGE, FLOATY JUMP. TAP IT FOR A SHORT HOP' }],
  N: ['spawn', 'sign', { text: 'SPIKES OVERHEAD! JUST TAP JUMP: A SHORT HOP' }],
  J: ['spawn', 'sign', { text: 'DUST GEYSERS BLOW YOU UP HIGH. STEER OUT AT THE TOP. HOLD DOWN TO DROP' }],
  e: ['enemy', 'moonBunny'], m: ['enemy', 'moonMite'], u: ['enemy', 'moonHand'], M: ['enemy', 'moonMoth'],
  '1': ['piece', 'moon.geyser', { steady: true, top: 5 }],
  '2': ['piece', 'moon.geyser', { steady: true, top: 9 }],
  '3': ['piece', 'moon.geyser', { top: 6, on: 2.2, off: 2.6 }],
  '4': ['piece', 'moon.geyser', { steady: true, top: 3, faint: true, w: 3 }],
  '5': ['piece', 'moon.geyser', { steady: true, top: 8 }],
  z: ['piece', 'moon.golfRain', { period: 3.0 }], Z: ['piece', 'moon.golfRain', { period: 3.0, phase: 1.5 }],
  X: ['piece', 'secretDoor', { to: 'green@in', look: 'fake', back: 'greenBack' }]
};
stamps.moonHop = { floor: 21, rows: hopRows, legend: HOP, gold: { '*': 'must', R: 'risky' }, items: ['power', 'power', 'star'] };
// Piwi's practice green: under the cracked boulder, a crater cave where someone has been practising their golf for
// years (balls everywhere); P2, a hidden 1UP, the way back out
stamps.moonGreen = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#........o.o.o.......*.......#',
    '#.......-----.......-----....#',
    '#............................#',
    '#..h.........................#',
    '#...........r.......-----....#',
    '#............................#',
    '#...-----........l...........#',
    '#............................#',
    '#............................#',
    '#.@...D.....l....j.....l..l..#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'surface@greenBack' }],
  legend: { l: ['decor', 'moonGolf'], j: ['decor', 'moonPoster'], r: ['decor', 'moonRock'] }
};
const L1 = { n: 1, name: 'One Small Hop', mapLabel: 'One Small Hop', arch: 'lowg', theme: 'moon_surface',
  gimmick: 'Low gravity: huge floaty jumps and long hang time. Dust geysers blow you sky-high, spikes overhead punish a full jump, golf balls fall out of the black sky',
  hint: 'Tap jump for a short hop under spikes; hold it for a huge one. Ride the dust geysers up and steer off at the top. The telescope on the last rim is pointing at something...',
  postcard: 'Brady! I jumped and came down about a week later. The dust gets EVERYWHERE. Someone left golf balls all over the place. ♥ C',
  enemies: [['moonBunny', 3], ['moonMite', 2], ['moonHand', 2], ['moonMoth', 2]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '18-2' }, secret: { to: '18-6', hint: 'A telescope on the last rim points up at a patch of sky. Something twinkles up there...' } },
  areas: [
    { id: 'surface', gen: 'room', theme: 'moon_surface', stamp: 'moonHop', gravity: G0, moon: { lowg: true }, camera: 'free', bottomKill: true },
    { id: 'green', gen: 'room', role: 'secret', theme: 'moon_shadow', stamp: 'moonGreen', gravity: G0, moon: { lowg: true } }
  ] };

Tour.amend('moon', { stamps, levels: [L1] });
})();
