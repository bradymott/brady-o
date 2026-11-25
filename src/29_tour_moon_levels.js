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

/* ---------------- 18-2 Spacewalk ---------------- */
// no ground: hull plates, airlocks and drifting junk around Piwi's orbiting venue. ① the teach over a safety net:
// a push across, a puff up; ② the first void with an air valve half way, junk drifting through, a climb of plates
// under antenna spikes, the locker-room airlock high up; ③ the twist: the venue's air vents blow you about, spikes
// under every plate, a stagehand on the long gantry, then the long void with a chain of valves past junk (P3) to
// the far airlock
const plate = (Gr, x0, x1, y, ch) => fillG(Gr, x0, y, x1, y + 1, ch || '#');
const walkRows = (() => {
  const W = 224, H = 30, Gr = grid(W, H, '.');
  // ① the teach, over a safety net
  plate(Gr, 0, 9, 22); fillG(Gr, 0, 24, 9, 29, '#'); put(Gr, 3, 21, '@'); put(Gr, 7, 21, 'n'); put(Gr, 5, 18, '?');
  plate(Gr, 10, 44, 27, '-'); put(Gr, 12, 26, 'r');
  plate(Gr, 16, 21, 22); put(Gr, 17, 19, 'o.o.o');
  plate(Gr, 29, 35, 16); put(Gr, 27, 21, 'N'); put(Gr, 30, 13, 'o.o.o');
  plate(Gr, 40, 46, 20); put(Gr, 43, 19, 'e');
  // ② the first void: a valve half way, junk drifting up and down through it
  put(Gr, 58, 17, 'V'); put(Gr, 57, 12, '*'); put(Gr, 64, 10, 'j');
  plate(Gr, 72, 84, 19); put(Gr, 74, 18, 'c'); put(Gr, 80, 15, '?'); put(Gr, 82, 18, 'u');
  // the climb of plates under antenna spikes
  plate(Gr, 90, 94, 15); plate(Gr, 99, 103, 10); fillG(Gr, 99, 12, 103, 12, 'v'); plate(Gr, 108, 112, 5); fillG(Gr, 108, 7, 112, 7, 'v');
  put(Gr, 96, 8, 'M');
  // the locker-room airlock on its own little plate up top (a light blinks on it)
  plate(Gr, 115, 121, 3); put(Gr, 118, 2, 'A'); put(Gr, 120, 2, 'a');
  plate(Gr, 120, 131, 15); fillG(Gr, 120, 17, 131, 17, 'v'); put(Gr, 124, 14, 'c'); put(Gr, 128, 11, 'o.o');
  // ③ the twist: an air vent blows up out of the void beside the plates; spikes under the plates
  put(Gr, 136, 28, '1'); plate(Gr, 141, 146, 8); fillG(Gr, 141, 10, 146, 10, 'v'); put(Gr, 142, 7, 'o.o.o');
  plate(Gr, 150, 166, 13); fillG(Gr, 150, 15, 166, 15, 'v'); put(Gr, 158, 12, 'u'); put(Gr, 155, 9, '?');
  // the long void with a chain of valves past junk (P3 by the second valve)
  put(Gr, 172, 12, 'V'); put(Gr, 177, 5, 'k'); put(Gr, 181, 10, 'V'); put(Gr, 190, 11, 'V'); put(Gr, 198, 12, 'V'); put(Gr, 186, 7, 'R'); put(Gr, 184, 18, 'K'); put(Gr, 197, 9, 'M');
  fillG(Gr, 0, 0, 223, 0, 'H');
  plate(Gr, 203, 223, 16); fillG(Gr, 203, 18, 223, 29, '#'); put(Gr, 205, 15, 'c'); put(Gr, 214, 15, 'G'); fillG(Gr, 223, 0, 223, 15, '#');
  return rowsOf(Gr);
})();
const WALK = {
  n: ['spawn', 'sign', { text: 'SPACEWALK! JUMP PUSHES OFF A PLATE. PRESS JUMP AGAIN IN MID-AIR FOR A PUFF OF AIR (TWO IN THE TANK)' }],
  N: ['spawn', 'sign', { text: 'YOU KEEP DRIFTING THE WAY YOU PUSHED. LAND ON A PLATE (OR FLY THROUGH A VALVE) TO REFILL' }],
  r: ['decor', 'moonGolf'], e: ['enemy', 'moonBunny'], u: ['enemy', 'moonHand'], M: ['enemy', 'moonMoth'],
  V: ['piece', 'moon.valve', {}],
  j: ['piece', 'moon.junk', { ay: 9, speed: 0.7, kind: 0 }], k: ['piece', 'moon.junk', { ay: 10, speed: 0.55, kind: 1 }], K: ['piece', 'moon.junk', { ax: 9, speed: 0.6, kind: 2, phase: 1 }],
  '1': ['piece', 'moon.geyser', { steady: true, top: 6, w: 2, force: 70, vmax: 6 }],
  A: ['spawn', 'portal', { kind: 'door', look: 'moonAirlock', targetRef: 'locker@in' }]
};
stamps.moonWalk = { floor: 22, rows: walkRows, legend: WALK, gold: { '*': 'must', R: 'risky' }, items: ['power', 'power', 'power'] };
// the venue's locker room: Piwi's stagehands keep their spare keys here (and a 1UP, and P2)
stamps.moonLocker = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#.........*..................#',
    '#.......-----......o.o.o.....#',
    '#..................-----.....#',
    '#..h.........................#',
    '#.......................-----#',
    '#...-----....................#',
    '#............................#',
    '#..........-----.............#',
    '#............................#',
    '#.@...D......l.....l....l....#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'walk@lockerBack', look: 'moonAirlock' }],
  legend: { l: ['decor', 'moonLamp'] }
};
WALK.a = ['anchor', 'lockerBack'];
const L2 = { n: 2, name: 'Spacewalk', mapLabel: 'Spacewalk', arch: 'drift', theme: 'moon_orbit',
  gimmick: 'Outside Piwi\'s orbiting venue with no ground at all: push off the hull plates and steer with puffs from your air canister. You keep your momentum; the tank holds two puffs',
  hint: 'Jump to push off, jump again in mid-air to puff. Plan your puffs: land on a plate or fly through a valve to refill. The blinking airlock up top is not locked...',
  postcard: 'Brady! I watched you spacewalk from the venue window. You looked like a very determined balloon. ♥ C',
  enemies: [['moonMoth', 2], ['moonHand', 2], ['moonBunny', 1]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '18-3' } },
  areas: [
    { id: 'walk', gen: 'room', theme: 'moon_orbit', stamp: 'moonWalk', gravity: 0.2, moon: { drift: { tank: 2 } }, camera: 'free', bottomKill: true },
    { id: 'locker', gen: 'room', role: 'secret', theme: 'moon_base', stamp: 'moonLocker', gravity: G0, moon: { lowg: true } }
  ] };

/* ---------------- 18-3 Moon Buggy ---------------- */
// the floor is row 20. ① the teach: a hop over a trench (not deadly), rocks the wheels climb, a boulder to hop, the
// first crater, golf balls; ② the long crater at full speed (P1 in the arc), the spike overhang with craters under it
// (short hops at speed), the rover depot's garage door, ridges, the crater whose geyser flings the buggy up the
// mesa; ③ everything at once: craters with golf balls on the landings, a geyser hop over a wall, spike overhangs,
// bunnies on the track, the last long crater (P3 over it) and the finish line
const buggyRows = (() => {
  const W = 300, H = 26, Gr = grid(W, H, '.');
  ground(Gr, 0, W - 1, 20);
  put(Gr, 3, 19, '@'); put(Gr, 8, 19, 'n'); put(Gr, 12, 16, '?'); put(Gr, 18, 19, 'p');
  pit(Gr, 31, 34); ground(Gr, 31, 34, 23); put(Gr, 31, 17, 'o.o.');
  put(Gr, 40, 19, 'B'); put(Gr, 44, 19, 'B'); fillG(Gr, 50, 18, 50, 19, 'B'); put(Gr, 47, 19, 'N');
  pit(Gr, 56, 61); put(Gr, 57, 15, 'o.o.o');
  put(Gr, 66, 19, 'e'); put(Gr, 74, 19, 'z'); put(Gr, 78, 19, 'l');
  pit(Gr, 86, 96); put(Gr, 91, 13, '*'); put(Gr, 87, 15, 'o.o.o.o.o');
  put(Gr, 99, 19, 'c'); put(Gr, 104, 16, '?'); put(Gr, 108, 19, 'm');
  // the spike overhang with craters under it
  fillG(Gr, 112, 4, 134, 13, '#'); fillG(Gr, 112, 14, 134, 14, 'v'); put(Gr, 111, 19, 'J');
  pit(Gr, 117, 120); fillG(Gr, 117, 4, 120, 13, '#'); fillG(Gr, 117, 14, 120, 14, 'v');
  pit(Gr, 126, 129); fillG(Gr, 126, 4, 129, 13, '#'); fillG(Gr, 126, 14, 129, 14, 'v'); put(Gr, 127, 17, 'R');
  // the rover depot's garage door (a blinking light), ridges
  put(Gr, 142, 19, 'D'); put(Gr, 145, 19, 'a'); put(Gr, 139, 19, 'p');
  fillG(Gr, 152, 19, 156, 19, '#'); fillG(Gr, 154, 18, 156, 18, '#'); fillG(Gr, 156, 17, 156, 17, '#'); put(Gr, 160, 19, 'u'); fillG(Gr, 166, 17, 166, 19, 'B');
  // the crater whose steady geyser flings the buggy up onto the mesa
  pit(Gr, 172, 180); put(Gr, 173, 24, '1'); ground(Gr, 181, 199, 16); put(Gr, 190, 15, 'e'); put(Gr, 194, 12, 'o.o.o');
  put(Gr, 204, 19, 'c'); put(Gr, 208, 16, '?');
  // ③ all of it
  pit(Gr, 214, 220); put(Gr, 223, 19, 'z'); put(Gr, 228, 19, 'e');
  put(Gr, 233, 19, 'B'); pit(Gr, 237, 241); put(Gr, 237, 24, '2'); fillG(Gr, 242, 15, 244, 19, '#');
  fillG(Gr, 248, 4, 268, 13, '#'); fillG(Gr, 248, 14, 268, 14, 'v'); pit(Gr, 252, 255); fillG(Gr, 252, 4, 255, 13, '#'); fillG(Gr, 252, 14, 255, 14, 'v'); put(Gr, 259, 19, 'Z'); pit(Gr, 262, 265); fillG(Gr, 262, 4, 265, 13, '#'); fillG(Gr, 262, 14, 265, 14, 'v');
  put(Gr, 271, 19, 'm'); pit(Gr, 275, 284); put(Gr, 280, 13, 'o.o.o');
  put(Gr, 292, 19, 'G'); put(Gr, 296, 19, 'p'); fillG(Gr, W - 1, 0, W - 1, 19, '#');
  return rowsOf(Gr);
})();
const BUGGY = {
  n: ['spawn', 'sign', { text: 'MOON BUGGY! HOLD FORWARD TO DRIVE, BACK TO BRAKE. JUMP HOPS. IN THE AIR THE STICK TILTS THE BUGGY: LAND IT FLAT!' }],
  N: ['spawn', 'sign', { text: 'THE WHEELS CLIMB SMALL ROCKS. HOP THE BIG ONES' }],
  J: ['spawn', 'sign', { text: 'SPIKES OVERHEAD: SHORT HOPS (TAP JUMP) AT FULL SPEED' }],
  p: ['decor', 'moonPoster'], l: ['decor', 'moonGolf'], e: ['enemy', 'moonBunny'], m: ['enemy', 'moonMite'], u: ['enemy', 'moonHand'],
  z: ['piece', 'moon.golfRain', { period: 2.8 }], Z: ['piece', 'moon.golfRain', { period: 2.8, phase: 1.4 }],
  '1': ['piece', 'moon.geyser', { steady: true, top: 6, w: 4, pull: 0, vmax: 13, force: 150 }], '2': ['piece', 'moon.geyser', { steady: true, top: 7, w: 3, pull: 0, vmax: 13, force: 150 }],
  a: ['anchor', 'depotBack']
};
stamps.moonBuggy = { floor: 20, rows: buggyRows, legend: BUGGY, gold: { '*': 'must', R: 'risky' }, items: ['power', 'power', 'power'], doors: [{ to: 'depot@in', look: 'moonHatch' }] };
// the rover depot: spare wheels, a buggy up on blocks, P2 on the tyre stack, a hidden 1UP
stamps.moonDepot = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#.....................*......#',
    '#....................---.....#',
    '#.......o.o.o................#',
    '#......-------.....------....#',
    '#..h.........................#',
    '#.......................---..#',
    '#...----.....................#',
    '#..........-----.............#',
    '#............................#',
    '#.@...D.....l....j......l....#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'buggy@depotBack', look: 'moonHatch' }],
  legend: { l: ['decor', 'moonLamp'], j: ['decor', 'moonPoster'] }
};
const L3 = { n: 3, name: 'Moon Buggy', mapLabel: 'Moon Buggy', arch: 'rover', theme: 'moon_rover',
  gimmick: 'Drive a springy six-wheeled buggy over craters and ridges: throttle, brake, hop, and lean in the air to land flat',
  hint: 'Keep your speed up for the long craters. In the air, tilt the buggy level before it lands: a crooked landing kills your speed, a nose-dive costs a hit. A garage door blinks by the ridges...',
  postcard: 'Brady! The buggy has SIX wheels and a little dish on top. I said you could drive. I meant slowly. ♥ C',
  enemies: [['moonBunny', 3], ['moonMite', 2], ['moonHand', 1]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '18-4' } },
  areas: [
    { id: 'buggy', gen: 'room', theme: 'moon_rover', stamp: 'moonBuggy', gravity: G0, moon: { rover: true }, camera: 'free', bottomKill: true },
    { id: 'depot', gen: 'room', role: 'secret', theme: 'moon_base', stamp: 'moonDepot', gravity: G0, moon: { lowg: true } }
  ] };

Tour.amend('moon', { stamps, levels: [L1, L2, L3] });
})();
