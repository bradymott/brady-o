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
  ground(Gr, 28, 50, 21); put(Gr, 29, 20, 'N'); put(Gr, 48, 20, 'c');
  fillG(Gr, 30, 4, 46, 14, 'H'); fillG(Gr, 31, 15, 45, 15, 'v'); put(Gr, 38, 20, 'B'); put(Gr, 33, 18, 'o.o'); put(Gr, 41, 18, 'o.o');
  // ② the crater field
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
  fillG(Gr, 161, 2, 181, 13, 'H'); fillG(Gr, 162, 14, 180, 14, 'v');
  pit(Gr, 164, 169); fillG(Gr, 161, 2, 181, 13, 'H'); fillG(Gr, 162, 14, 180, 14, 'v');
  ground(Gr, 170, 174, 21); put(Gr, 172, 20, 'e');
  pit(Gr, 175, 179); fillG(Gr, 175, 2, 179, 13, 'H'); fillG(Gr, 175, 14, 179, 14, 'v');
  ground(Gr, 180, 190, 21); put(Gr, 181, 20, 'c'); put(Gr, 184, 20, 'z'); put(Gr, 188, 20, 'Z'); put(Gr, 186, 16, '?');
  // ... then all of it: a geyser under spikes up to a cliff, a long jump past a moth over the last crater (P3)
  pit(Gr, 191, 199); put(Gr, 194, 24, '5'); fillG(Gr, 192, 3, 197, 4, 'H'); fillG(Gr, 192, 5, 197, 5, 'v');
  ground(Gr, 200, 204, 12);
  pit(Gr, 205, 212); put(Gr, 208, 12, 'R'); put(Gr, 207, 9, 'M');
  ground(Gr, 213, 217, 16); put(Gr, 215, 15, 'e');
  ground(Gr, 218, 224, 14); put(Gr, 221, 13, 'O'); put(Gr, 219, 13, 'z'); put(Gr, 223, 13, 'c');
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
  enemies: [['moonBunny', 3], ['moonMite', 2], ['moonHand', 1], ['moonMoth', 2]],
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
  plate(Gr, 150, 166, 13); fillG(Gr, 150, 15, 166, 15, 'v'); put(Gr, 152, 12, 'c'); put(Gr, 155, 9, '?');
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
  put(Gr, 64, 19, 'c'); put(Gr, 66, 19, 'e'); put(Gr, 74, 19, 'z'); put(Gr, 78, 19, 'l');
  pit(Gr, 86, 96); put(Gr, 91, 13, '*'); put(Gr, 87, 15, 'o.o.o.o.o');
  put(Gr, 99, 19, 'c'); put(Gr, 104, 16, '?'); put(Gr, 108, 19, 'm');
  // the spike overhang with craters under it
  fillG(Gr, 112, 4, 134, 13, 'H'); fillG(Gr, 112, 14, 134, 14, 'v'); put(Gr, 111, 19, 'J');
  pit(Gr, 117, 120); fillG(Gr, 117, 4, 120, 13, 'H'); fillG(Gr, 117, 14, 120, 14, 'v');
  pit(Gr, 126, 129); fillG(Gr, 126, 4, 129, 13, 'H'); fillG(Gr, 126, 14, 129, 14, 'v'); put(Gr, 127, 17, 'R');
  // the rover depot's garage door (a blinking light), ridges
  put(Gr, 142, 19, 'D'); put(Gr, 145, 19, 'a'); put(Gr, 139, 19, 'p'); put(Gr, 148, 19, 'c');
  fillG(Gr, 152, 19, 156, 19, '#'); fillG(Gr, 154, 18, 156, 18, '#'); fillG(Gr, 156, 17, 156, 17, '#'); fillG(Gr, 166, 17, 166, 19, 'B');
  // the crater whose steady geyser flings the buggy up onto the mesa
  pit(Gr, 172, 180); put(Gr, 173, 24, '1'); ground(Gr, 181, 199, 16); put(Gr, 197, 15, 'e'); put(Gr, 192, 12, 'o.o.o');
  put(Gr, 204, 19, 'c'); put(Gr, 208, 16, '?');
  // ③ all of it
  pit(Gr, 214, 220); put(Gr, 223, 19, 'z'); put(Gr, 228, 19, 'e');
  put(Gr, 233, 19, 'B'); pit(Gr, 237, 241); put(Gr, 237, 24, '2'); fillG(Gr, 242, 15, 244, 19, '#'); put(Gr, 246, 19, 'c');
  fillG(Gr, 248, 4, 268, 13, 'H'); fillG(Gr, 248, 14, 268, 14, 'v'); pit(Gr, 252, 255); fillG(Gr, 252, 4, 255, 13, 'H'); fillG(Gr, 252, 14, 255, 14, 'v'); put(Gr, 259, 19, 'Z'); pit(Gr, 262, 265); fillG(Gr, 262, 4, 265, 13, 'H'); fillG(Gr, 262, 14, 265, 14, 'v');
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
  enemies: [['moonBunny', 3], ['moonMite', 2]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '18-4' } },
  areas: [
    { id: 'buggy', gen: 'room', theme: 'moon_rover', stamp: 'moonBuggy', gravity: G0, moon: { rover: true }, camera: 'free', bottomKill: true },
    { id: 'depot', gen: 'room', role: 'secret', theme: 'moon_base', stamp: 'moonDepot', gravity: G0, moon: { lowg: true } }
  ] };

/* ---------------- 18-4 The Moon Base ---------------- */
// inside: the ceiling is rows 0-2, the floor row 20. ① the boots taught over a safe floor, then over a spike floor;
// ② a deadly pit crossed on the ceiling (P3 over it), ceiling spikes where the metal stops, two metal spans with a
// gap: drop to the ledge between and go back up; the storeroom ledge you only reach from the ceiling; ③ an air
// vent up to a ledge under the metal, more spikes, then out through the airlock into the YARD: a spacewalk in low
// orbit past junk and golf balls to the stage door (all of the land at once)
const baseRows = (() => {
  const W = 184, H = 24, Gr = grid(W, H, '.');
  fillG(Gr, 0, 0, W - 1, 2, 'H'); ground(Gr, 0, W - 1, 20);
  put(Gr, 3, 19, '@'); put(Gr, 7, 19, 'n'); put(Gr, 10, 16, '?');
  put(Gr, 14, 19, '1'); put(Gr, 15, 4, 'o.o.o.o'); put(Gr, 23, 5, '*');
  put(Gr, 26, 19, '2'); fillG(Gr, 30, 20, 40, 20, '^'); put(Gr, 27, 4, 'o.o.o.o.o.o.o.o');
  put(Gr, 46, 19, 'N');
  // ② the deadly pit under a metal span
  put(Gr, 53, 19, '3'); fillG(Gr, 55, 20, 72, 23, '.'); put(Gr, 63, 7, 'R'); put(Gr, 77, 19, 'u');
  fillG(Gr, 75, 3, 80, 3, 'v');
  put(Gr, 82, 19, 'c'); put(Gr, 90, 16, '?'); put(Gr, 94, 19, 'e');
  // two metal spans with a gap: drop to the ledge between, boots on again from it
  fillG(Gr, 101, 20, 120, 23, '.'); put(Gr, 99, 19, '4'); fillG(Gr, 104, 11, 111, 11, '#'); put(Gr, 111, 19, '5'); fillG(Gr, 107, 3, 110, 3, 'v'); put(Gr, 108, 10, 'k');
  // the storeroom ledge, only reachable from the ceiling (its hatch light blinks)
  fillG(Gr, 122, 9, 126, 9, '#'); put(Gr, 124, 8, 'D'); put(Gr, 126, 8, 'a');
  put(Gr, 128, 12, 'M'); put(Gr, 132, 19, 'c');
  // ③ the air vent up to a ledge under the metal; spikes on the ceiling elsewhere
  fillG(Gr, 138, 20, 145, 23, '.'); put(Gr, 139, 23, '6'); fillG(Gr, 136, 3, 145, 3, 'v'); fillG(Gr, 146, 10, 151, 10, '-'); put(Gr, 146, 19, '7');
  fillG(Gr, 152, 20, 162, 20, '^'); put(Gr, 150, 6, 'o.o.o.o.o.o');
  put(Gr, 164, 19, 'u'); put(Gr, 172, 19, 'A'); put(Gr, 168, 16, '?'); put(Gr, 169, 19, 'c');
  fillG(Gr, W - 1, 0, W - 1, 19, 'H');
  return rowsOf(Gr);
})();
const BASE = {
  n: ['spawn', 'sign', { text: 'MAGNET BOOTS! PRESS ACTION TO SWITCH THEM ON: UNDER THE BLUE PANELS YOU FALL UP AND WALK THE CEILING' }],
  N: ['spawn', 'sign', { text: 'SWITCH THE BOOTS OFF TO DROP. YOU CAN SWITCH IN MID-AIR TOO' }],
  e: ['enemy', 'moonBunny'], u: ['enemy', 'moonHand'], M: ['enemy', 'moonMoth'], k: ['decor', 'moonLamp'],
  '1': ['piece', 'moon.metal', { w: 10, ceil: 2, bot: 19 }], '2': ['piece', 'moon.metal', { w: 18, ceil: 2, bot: 19 }],
  '3': ['piece', 'moon.metal', { w: 21, ceil: 2, bot: 19 }], '4': ['piece', 'moon.metal', { w: 8, ceil: 2, bot: 19 }],
  '5': ['piece', 'moon.metal', { w: 16, ceil: 2, bot: 19 }],
  '6': ['piece', 'moon.geyser', { steady: true, top: 4, w: 2 }], '7': ['piece', 'moon.metal', { w: 6, ceil: 2, bot: 9 }],
  a: ['anchor', 'storeBack'],
  A: ['spawn', 'portal', { kind: 'door', look: 'moonAirlock', targetRef: 'yard@in' }]
};
stamps.moonBase = { floor: 20, rows: baseRows, legend: BASE, gold: { '*': 'must', R: 'risky' }, items: ['power', 'power', 'power'], doors: [{ to: 'store@in', look: 'moonHatch' }] };
// the storeroom over the corridor: Piwi's spare posters, P2, a hidden 1UP
stamps.moonStore = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#........*...................#',
    '#......-----......o.o.o......#',
    '#.................-----......#',
    '#..h.........................#',
    '#.....................-----..#',
    '#...-----....................#',
    '#............................#',
    '#..........-----.............#',
    '#............................#',
    '#.@...D.....j....j......l....#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'base@storeBack', look: 'moonHatch' }],
  legend: { l: ['decor', 'moonLamp'], j: ['decor', 'moonPoster'] }
};
// the yard outside the base: a short spacewalk in low orbit over the stage crater, junk and golf balls adrift
const yardRows = (() => {
  const W = 96, H = 26, Gr = grid(W, H, '.');
  fillG(Gr, 0, 0, W - 1, 0, 'H');
  plate(Gr, 0, 8, 18); fillG(Gr, 0, 20, 8, 25, '#'); put(Gr, 2, 17, '@'); put(Gr, 6, 17, 'n'); put(Gr, 4, 17, 'c');
  put(Gr, 16, 14, 'j'); plate(Gr, 22, 26, 13); put(Gr, 34, 9, 'V'); put(Gr, 40, 12, 'k');
  plate(Gr, 47, 51, 16); fillG(Gr, 47, 18, 51, 18, 'v'); put(Gr, 49, 15, 'c'); put(Gr, 58, 11, 'V'); put(Gr, 64, 6, 'K'); put(Gr, 70, 13, 'M');
  plate(Gr, 78, 95, 15); fillG(Gr, 78, 17, 95, 25, '#'); put(Gr, 82, 14, 'c'); put(Gr, 90, 14, 'G'); fillG(Gr, W - 1, 0, W - 1, 14, '#');
  return rowsOf(Gr);
})();
stamps.moonYard = { floor: 18, rows: yardRows, legend: {
  n: ['spawn', 'sign', { text: 'THE YARD! NO GRAVITY OUT HERE: PUSH OFF AND PUFF TO THE STAGE DOOR' }],
  V: ['piece', 'moon.valve', {}], M: ['enemy', 'moonMoth'],
  j: ['piece', 'moon.junk', { ay: 8, speed: 0.7, kind: 2 }], k: ['piece', 'moon.junk', { ay: 9, speed: 0.6, kind: 0, phase: 2 }], K: ['piece', 'moon.junk', { ax: 8, speed: 0.6, kind: 1 }]
} };
const L4 = { n: 4, name: 'The Moon Base', mapLabel: 'The Moon Base', arch: 'mag', theme: 'moon_base',
  gimmick: 'Magnet boots: under the blue metal panels Brady falls up and walks the ceiling. Switch them on and off with the action button; off the metal he floats in the low gravity. Then out into the yard',
  hint: 'Action switches the boots. Walk the ceiling over the spikes and pits, switch off to drop onto ledges. A hatch blinks on a ledge only the ceiling reaches...',
  postcard: 'Brady! You walked on the CEILING. The stagehands have fishbowls on their heads. One waved at me. I think. ♥ C',
  enemies: [['moonHand', 2], ['moonMoth', 2], ['moonBunny', 1]],
  mapCell: [2, 1], mapFrom: 2,
  exits: { main: { to: '18-5' } },
  areas: [
    { id: 'base', gen: 'room', theme: 'moon_base', stamp: 'moonBase', gravity: G0, moon: { mag: true } },
    { id: 'store', gen: 'room', role: 'secret', theme: 'moon_base', stamp: 'moonStore', gravity: G0, moon: { lowg: true } },
    { id: 'yard', gen: 'room', theme: 'moon_orbit', stamp: 'moonYard', gravity: 0.2, moon: { drift: { tank: 2 } }, camera: 'free', bottomKill: true }
  ] };

/* ---------------- 18-5 The Lunar Stage (the boss) ---------------- */
// the wings behind the stage: crates of shrunk scenery, a stagehand or two, Piwi's posters; then the stage itself
const wingsRows = (() => {
  const W = 70, H = 20, Gr = grid(W, H, '.');
  fillG(Gr, 0, 0, W - 1, 1, 'H'); ground(Gr, 0, W - 1, 16); fillG(Gr, 0, 0, 0, 15, 'H');
  put(Gr, 3, 15, '@'); put(Gr, 7, 15, 'n'); put(Gr, 9, 11, '?'); put(Gr, 13, 15, 'p');
  fillG(Gr, 17, 13, 19, 15, 'B'); put(Gr, 18, 9, '*'); put(Gr, 24, 15, 'u');
  fillG(Gr, 28, 11, 33, 11, '-'); put(Gr, 30, 7, 'A'); put(Gr, 36, 15, 'X');
  put(Gr, 46, 11, '?'); put(Gr, 50, 15, 'm'); fillG(Gr, 54, 12, 57, 12, '-'); put(Gr, 55, 9, 'R');
  put(Gr, 62, 15, 'D'); fillG(Gr, W - 1, 0, W - 1, 15, 'H');
  return rowsOf(Gr);
})();
stamps.moonWings = { floor: 16, rows: wingsRows, gold: { '*': 'must', A: 'high', R: 'risky' }, items: ['power', 'power'], doors: [{ to: 'stage@in', look: 'moonHatch' }], legend: {
  n: ['spawn', 'sign', { text: 'THE LUNAR STAGE: TONIGHT ONLY, MADAME MOO! (SHE HAS BEEN WAITING FOR WEEKS)' }],
  p: ['decor', 'moonPoster'], u: ['enemy', 'moonHand'], m: ['enemy', 'moonMite'],
  X: ['piece', 'secretDoor', { to: 'dressing@in', look: 'fake', back: 'dressingBack' }]
} };
// the headliner's dressing room behind a loose wall panel: her spare capes, a hidden 1UP
stamps.moonDressing = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#.........o.o.o..............#',
    '#........-------.............#',
    '#............................#',
    '#..h.................-----...#',
    '#............................#',
    '#...-----.........-----......#',
    '#............................#',
    '#............................#',
    '#............................#',
    '#.@...D.....j.....l.....j....#',
    '##############################',
    '##############################'],
  hidden: ['oneup'], doors: [{ to: 'wings@dressingBack', look: 'moonHatch' }],
  legend: { l: ['decor', 'moonLamp'], j: ['decor', 'moonPoster'] }
};
const L5 = { n: 5, name: 'The Lunar Stage', mapLabel: 'The Lunar Stage', arch: 'lair', theme: 'moon_stage', boss: 'moon_moo',
  gimmick: 'The last act nobody cancelled: Madame Moo, the cow who jumped over the moon, in her sequined cape. Three acts: the big jump, the milky way, the grand finale',
  hint: 'Watch for her shadow and jump her shockwaves. When her hooves sink in the dust, stomp her head. When the gravity goes, let her charge into the wall',
  postcard: 'BRADY! The cow took a bow and jumped over the moon, all the way home. The crater is back in the ground. The tour is OVER. We did it! ♥ C',
  enemies: [['moonHand', 1], ['moonMite', 1]],
  mapCell: [1, 1], mapFrom: 3,
  exits: { main: { to: 'country:next' } },
  areas: [
    { id: 'wings', gen: 'room', theme: 'moon_base', stamp: 'moonWings', gravity: G0, moon: { lowg: true } },
    { id: 'dressing', gen: 'room', role: 'secret', theme: 'moon_base', stamp: 'moonDressing', gravity: G0, moon: { lowg: true } },
    { id: 'stage', gen: 'arena', role: 'arena', layout: 'stage', arenaW: 30, H: 20, roof: false, theme: 'moon_stage', gravity: G0, moon: { lowg: true } }
  ] };

/* ---------------- 18-6 Connect the Stars (secret) ---------------- */
// the star gate from 18-1 opens onto a field of stars over the moon. The floor is row 19. ① three stars on flat
// ground, a bridge over a pit too wide to jump; ② four stars on floating rocks over a deadly gap; ③ four stars up a
// stack of ledges, a bridge high over the void to the plateau (the observatory behind its loose panel); ④ five stars
// on floating rocks past moths and golf balls, the last bridge to the gate
const starRows = (() => {
  const W = 204, H = 24, Gr = grid(W, H, '.');
  ground(Gr, 0, 20, 19); put(Gr, 2, 18, '@'); put(Gr, 4, 18, 'n'); put(Gr, 7, 15, '?');
  put(Gr, 13, 18, 'a'); put(Gr, 9, 18, '1'); put(Gr, 18, 18, 'd');
  put(Gr, 21, 18, 'A'); put(Gr, 30, 15, '*'); put(Gr, 24, 16, 'o.o.o.o.o.o.o');
  ground(Gr, 40, 44, 19); put(Gr, 42, 18, 'f'); put(Gr, 40, 18, 'N'); put(Gr, 44, 18, 'c');
  fillG(Gr, 47, 15, 50, 16, '#'); put(Gr, 48, 14, 'i');
  fillG(Gr, 53, 11, 56, 12, '#'); put(Gr, 54, 10, 'e'); put(Gr, 55, 7, 'R');
  fillG(Gr, 60, 15, 63, 16, '#'); put(Gr, 61, 14, 'j');
  ground(Gr, 66, 70, 19); put(Gr, 64, 9, 'M');
  put(Gr, 71, 18, '3');
  ground(Gr, 93, 98, 19); put(Gr, 95, 18, 'c'); put(Gr, 97, 15, '?');
  fillG(Gr, 100, 15, 103, 16, '#'); put(Gr, 101, 14, 'l'); fillG(Gr, 106, 11, 109, 12, '#'); put(Gr, 107, 10, 'm');
  fillG(Gr, 100, 7, 103, 8, '#'); put(Gr, 101, 6, 'p'); fillG(Gr, 106, 3, 109, 4, '#'); put(Gr, 108, 2, 'q');
  put(Gr, 110, 2, '4'); ground(Gr, 125, 136, 7); put(Gr, 127, 6, 'X'); put(Gr, 135, 6, 'c');
  // ④ the last constellation on floating rocks
  fillG(Gr, 140, 12, 142, 13, '#'); put(Gr, 141, 11, 'r'); fillG(Gr, 146, 16, 148, 17, '#'); put(Gr, 147, 15, '2'); put(Gr, 147, 9, 'M');
  fillG(Gr, 152, 10, 154, 11, '#'); put(Gr, 153, 9, 't'); fillG(Gr, 158, 14, 160, 15, '#'); put(Gr, 159, 13, 'u');
  fillG(Gr, 164, 11, 166, 12, '#'); put(Gr, 165, 10, 'w'); put(Gr, 153, 6, 'z');
  put(Gr, 167, 10, 'E'); ground(Gr, 186, W - 1, 11); put(Gr, 190, 10, 'G'); put(Gr, 196, 10, 'Y'); fillG(Gr, W - 1, 0, W - 1, 10, '#');
  return rowsOf(Gr);
})();
const STAR = (c, n, of) => ['piece', 'moon.star', { c, n, of }];
stamps.moonStars = { floor: 19, rows: starRows, gold: { '*': 'must', R: 'risky' }, items: ['power', 'star'], legend: {
  n: ['spawn', 'sign', { text: 'CONNECT THE STARS! STEP ON THEM IN ORDER, 1, 2, 3... A FINISHED CONSTELLATION BECOMES A BRIDGE' }],
  N: ['spawn', 'sign', { text: 'A WRONG STAR PUTS THEM ALL OUT. FOLLOW THE DOTTED LINE' }],
  a: STAR(0, 0, 3), '1': STAR(0, 1, 3), d: STAR(0, 2, 3),
  i: STAR(1, 3, 4), e: STAR(1, 0, 4), j: STAR(1, 2, 4), f: STAR(1, 1, 4),
  l: STAR(2, 0, 4), m: STAR(2, 1, 4), p: STAR(2, 2, 4), q: STAR(2, 3, 4),
  r: STAR(3, 0, 5), '2': STAR(3, 1, 5), t: STAR(3, 2, 5), u: STAR(3, 3, 5), w: STAR(3, 4, 5),
  A: ['piece', 'moon.bridge', { c: 0, w: 19, dy: 1 }], '3': ['piece', 'moon.bridge', { c: 1, w: 22, dy: 1 }],
  '4': ['piece', 'moon.bridge', { c: 2, w: 15, dy: 1 }], E: ['piece', 'moon.bridge', { c: 3, w: 19, dy: 1 }],
  M: ['enemy', 'moonMoth'], Y: ['decor', 'moonPoster'], z: ['piece', 'moon.golfRain', { period: 3.2 }],
  X: ['piece', 'secretDoor', { to: 'scope@in', look: 'fake', back: 'scopeBack' }]
} };
// the observatory: a big telescope pointed at the Earth, P2, a hidden 1UP
stamps.moonScope = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#...................*........#',
    '#..................-----.....#',
    '#.......o.o.o................#',
    '#..h...-------...............#',
    '#............................#',
    '#...-----.............-----..#',
    '#............................#',
    '#..........-----.............#',
    '#............................#',
    '#.@...D......k...........k...#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'], doors: [{ to: 'sky@scopeBack', look: 'moonHatch' }],
  legend: { k: ['decor', 'moonScope'] }
};
const L6 = { n: 6, name: 'Connect the Stars', mapLabel: 'Connect the Stars', arch: 'stars', secret: true, theme: 'moon_stars',
  gimmick: 'Through the star gate: step on the stars in the right order to draw each constellation, and every finished constellation becomes a bridge of light',
  hint: 'Follow the numbers and the dotted line. A wrong star puts the whole constellation out. A loose panel on the high plateau hides an observatory',
  postcard: 'Brady, you drew a COW in the stars. Or a teapot. Pupo says it is him. ♥ C',
  enemies: [['moonMoth', 3]],
  mapCell: [0, 1], mapFrom: 0,
  exits: { main: { to: 'node:18-4' } },
  areas: [
    { id: 'sky', gen: 'room', theme: 'moon_stars', stamp: 'moonStars', gravity: G0, moon: { lowg: true }, camera: 'free', bottomKill: true },
    { id: 'scope', gen: 'room', role: 'secret', theme: 'moon_base', stamp: 'moonScope', gravity: G0, moon: { lowg: true } }
  ] };

Tour.amend('moon', { stamps, levels: [L1, L2, L3, L4, L5, L6] });
/* ---------------- the land's map: the near side of the moon ---------------- */
// the landing pad at the left; the hop across the crater plain, the spacewalk up by the venue's tether, the buggy
// ruts, the base's dome, the stage in the big crater at the right (the port: back to Earth); the star gate's trail
// from the first rim to the field of stars, and on to the base
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.moon = {
  labels: { '18-1': 'One Small Hop', '18-2': 'Spacewalk', '18-3': 'Moon Buggy', '18-4': 'The Moon Base', '18-5': 'The Lunar Stage', '18-6': 'Connect the Stars' },
  w: 1520, h: 760,
  pal: { sea: '#06061a', deep: '#020210', land: '#c8c2d4', light: '#e8e4f0', path: '#ffe8a0', beach: '#d8d2e2', cliff: '#6a6480', roof: '#ff4f8a', wall: '#ffffff' },
  sea: 'stars', coast: 'moonRim', tufts: 'none', trail: 'sparkle', bridge: 'steps', meadow: false, woods: false, foam: false, birds: false,
  land: [[[150, 380], [210, 220], [380, 140], [620, 120], [860, 150], [1080, 120], [1300, 180], [1400, 320], [1380, 520], [1260, 650], [1000, 690], [720, 660], [460, 680], [250, 600]]],
  nodes: { start: [250, 450], '18-1': [420, 330, 'n'], '18-2': [700, 220, 'n'], '18-3': [1000, 260, 'n'], '18-4': [1160, 420, 'e'], '18-5': [960, 560, 's'], '18-6': [560, 520, 's'], port: [1240, 600] },
  paths: { 'start>18-1': [[320, 400]], '18-1>18-2': [[560, 250]], '18-2>18-3': [[850, 200]], '18-3>18-4': [[1100, 330]], '18-4>18-5': [[1080, 520]], '18-5>port': [[1120, 600]], '18-1>18-6': [[480, 440]], '18-6>18-4': [[800, 500], [1040, 440]] },
  feat: [
    ['sprite', 'moonPad', 240, 470, 30], ['sprite', 'moonDome', 1200, 400, 34], ['sprite', 'moonStage', 960, 600, 30],
    ['sprite', 'moonRuts', 900, 300, 40], ['sprite', 'moonRuts', 1060, 320, 30], ['sprite', 'moonCrater', 620, 600, 26]
  ],
  flora: ['rock'], density: 0,
  live: [['blink', 1200, 372, '#ff5a5a'], ['blink', 700, 170, '#7affd8'], ['circle', 760, 110, 50, 0.6]]
};

})();
