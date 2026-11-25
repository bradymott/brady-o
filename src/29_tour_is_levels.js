/* ============================================================
   ICELAND: the levels (world 17) and the land's map. The Encore Tour's fourth land, the second hardest in the game
   (ENCORE_TOUR.md §3: tight timing windows, moving hazards over pits, one checkpoint per long level plus one before
   the last stretch). Each level: teach where failing costs nothing, test over the pits, twist in the last third.
   17-1 NORTHERN LIGHTS (aurora): run the aurora's ribbons of light over the black lava field at night.
   17-2 THE GLACIER LAGOON (berg): hop the icebergs that tip and roll; balance against the seals.
   17-3 THE RIFT (quake): the two halves of the land slide apart and grind together on a slow clock.
   17-4 THE ORGAN PIPES (basalt): basalt columns sink under Brady like organ keys over a lava lake.
   17-5 THE NIGHT TROLL (lair): a cave mouth before dawn; bounce the sunrise off the shields onto the troll.
   17-6 THE HIDDEN FOLK (shy, secret): their planks are there only while Brady looks away; walk backwards.
   Stamps are drawn with a small grid helper (mk) so the coordinates stay exact; legend letters are listed with each.
   ============================================================ */
(function () {
const C = Tour.countries.is;
if (!C) return;
// a grid of '.' W x H: put, fill, horizontal runs, a row of coins; rows() gives the stamp's rows
const mk = (W, H) => {
  const g = []; for (let y = 0; y < H; y++) g.push(new Array(W).fill('.'));
  const o = {
    W, H,
    put(x, y, s) { for (let k = 0; k < s.length; k++) if (y >= 0 && y < H && x + k >= 0 && x + k < W) g[y][x + k] = s[k]; return o; },
    fill(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = c; return o; },
    coins(x0, x1, y) { for (let x = x0; x <= x1; x += 2) o.put(x, y, 'o'); return o; },
    rows() { return g.map(r => r.join('')); }
  };
  return o;
};
const stamps = {};

/* ---------------- 17-1 Northern Lights ----------------
   The lava field at night, the floor on row 15 (Brady stands on row 14), pits down through the bottom. Ribbons of the
   aurora (r: pulse, R: sweep, Q: sweep the other way, z: a drifting plank). Teach over two shallow dips (a fall costs
   a walk back), test over the pits with puffins swooping over the ribbons, twist with ribbons that fade toward you and
   ripple hard. A painted door in a rock high on the ridge is the hidden folk's: their room has the secret exit. */
const aurora = (() => {
  const G = mk(212, 18);
  const ground = (x0, x1, top) => G.fill(x0, top == null ? 15 : top, x1, 17, '#');
  ground(0, 14); ground(23, 28); ground(39, 46); ground(61, 68); ground(81, 92); ground(105, 114); ground(141, 150); ground(186, 211);
  // the two teaching dips: a floor two rows down, steps out
  G.fill(15, 17, 22, 17, '#'); G.fill(29, 17, 38, 17, '#');
  // the start: a hut, the sign, a power block, the start
  G.put(5, 14, 'j'); G.put(2, 14, '@'); G.put(9, 14, 'k'); G.put(8, 10, '?'); G.put(12, 14, 'x');
  // teach 1: a pulse ribbon over the first dip
  G.put(15, 12, 'a'); G.coins(16, 21, 10); G.put(20, 16, 'V');
  // teach 2: a sweep ribbon over the second dip
  G.put(25, 14, 'K'); G.put(29, 13, 'd'); G.coins(30, 37, 11);
  // the fox in the moss, P1 over him
  G.put(43, 14, 'f'); G.put(44, 9, '*'); G.put(41, 14, 'x');
  // test 1: a long sweep ribbon over the first pit, a puffin over it
  G.put(47, 12, 'R'); G.put(53, 7, 'p'); G.coins(50, 58, 10);
  G.put(63, 10, '?'); G.put(66, 14, 'j');
  // test 2: a pulse ribbon low, then a sweep high (jump up from one to the other)
  G.put(69, 13, 'r'); G.put(75, 11, 'E'); G.coins(76, 80, 9);
  // checkpoint 1, a ram on the flat
  G.put(83, 14, 'c'); G.put(90, 14, 'm'); G.put(87, 14, 'q');
  // the twist: a ribbon whose fade comes TOWARD you (from its far end), rippling hard; a tern over it
  G.put(93, 13, 'Z'); G.put(99, 8, 't'); G.coins(95, 104, 11);
  // the ridge: a pulse ribbon up to the high ledge with the folk's painted door (the secret), a tern
  G.put(113, 14, 'x'); G.put(106, 12, 'u'); G.fill(99, 9, 103, 9, '-'); G.put(99, 8, 'e'); G.put(102, 8, 'D'); G.coins(100, 102, 6); G.put(110, 14, 'f'); G.put(106, 14, 'A');
  // the third stretch: a sweep ribbon and a drifting plank above it, two puffins
  G.put(115, 12, 'R'); G.put(122, 7, 'p'); G.put(130, 9, 'z'); G.put(133, 12, 'w'); G.put(136, 6, 'p'); G.coins(117, 127, 10);
  // checkpoint 2, before the last stretch
  G.put(143, 14, 'c'); G.put(148, 14, 'x');
  // the last stretch: three sweep ribbons in a chain over one long pit, P3 (risky) over the middle one, terns
  G.put(151, 13, '1'); G.put(163, 11, '2'); G.put(175, 12, '3'); G.put(168, 6, 'P'); G.put(158, 7, 't'); G.put(181, 7, 'p');
  G.coins(153, 160, 11); G.coins(178, 184, 10);
  // the end: the gate, a hut, horses
  G.put(190, 14, 'i'); G.put(196, 14, 'G'); G.put(202, 14, 'j'); G.put(207, 14, 'i');
  return G.rows();
})();
const AUR = {
  j: ['decor', 'isHut'], x: ['decor', 'isRock'], q: ['decor', 'isCairn'], i: ['decor', 'isHorse'], e: ['decor', 'isElfDoor'], V: ['decor', 'isVentDecor'], A: ['anchor', 'folkBack'],
  k: ['spawn', 'sign', { text: 'THE NORTHERN LIGHTS ARE SOLID! STAND ON A RIBBON WHILE IT GLOWS. SPARKLES MEAN IT IS ABOUT TO FADE' }],
  K: ['spawn', 'sign', { text: 'THIS RIBBON RELIGHTS FROM THE LEFT, THEN FADES FROM THE LEFT TOO: STEP ON AS IT LIGHTS, AND RUN AHEAD OF THE FADE' }],
  a: ['piece', 'ribbon', { len: 8, mode: 'pulse', hold: 2.2, dark: 1.4, amp: 4 }],
  d: ['piece', 'ribbon', { len: 10, mode: 'sweep', hold: 1.6, dark: 1.2, speed: 4.0, amp: 6 }],
  R: ['piece', 'ribbon', { len: 14, mode: 'sweep', hold: 1.4, dark: 1.2, speed: 4.6, amp: 8, hue: 1 }],
  r: ['piece', 'ribbon', { len: 6, mode: 'pulse', hold: 2.0, dark: 1.6, amp: 4, hue: 2 }],
  E: ['piece', 'ribbon', { len: 6, mode: 'sweep', hold: 1.2, dark: 1.6, speed: 4.4, amp: 6, phase: 1.1 }],
  Z: ['piece', 'ribbon', { len: 12, mode: 'sweep', dir: -1, hold: 2.6, dark: 1.2, speed: 5.0, amp: 14, wave: 8, hue: 1 }],
  u: ['piece', 'ribbon', { len: 6, mode: 'pulse', hold: 2.2, dark: 2.0, amp: 4, hue: 2, phase: 0.5 }],
  z: ['piece', 'plank', { ax: 6, w: 3, speed: 1.6 }],
  '1': ['piece', 'ribbon', { len: 12, mode: 'sweep', hold: 1.2, dark: 1.4, speed: 5.0, amp: 10, phase: 0 }],
  '2': ['piece', 'ribbon', { len: 12, mode: 'sweep', hold: 1.2, dark: 1.4, speed: 5.0, amp: 10, hue: 1, phase: -1.2 }],
  '3': ['piece', 'ribbon', { len: 12, mode: 'sweep', hold: 1.2, dark: 1.4, speed: 5.0, amp: 10, hue: 2, phase: -2.4 }],
  f: ['enemy', 'isFox'], m: ['enemy', 'isRam'], p: ['enemy', 'isPuffin'], t: ['enemy', 'isTern'], w: ['enemy', 'isPuffin']
};
stamps.isAurora = { floor: 15, rows: aurora, legend: AUR, items: ['power', 'power'], gold: { '*': 'must', P: 'risky' }, doors: [{ to: 'huldu@in', look: 'isFolkDoor' }] };
// the hidden folk's front room behind the painted door: lanterns, a tiny table, the secret way on (to 17-6)
stamps.isHuldu = (() => {
  const G = mk(30, 14);
  G.fill(0, 0, 29, 0, 'H').fill(0, 12, 29, 13, '#').fill(0, 0, 0, 11, 'H').fill(29, 0, 29, 11, 'H');
  G.put(2, 11, '@'); G.put(4, 11, 'D'); G.put(9, 11, 'e'); G.put(15, 11, 'n'); G.put(24, 11, 'g'); G.put(20, 11, 'e');
  G.fill(6, 8, 10, 8, '-'); G.fill(13, 6, 17, 6, '-'); G.put(15, 4, '*'); G.coins(7, 9, 7); G.put(11, 3, 'h'); G.fill(20, 8, 24, 8, '-'); G.coins(21, 23, 7);
  return { floor: 12, rows: G.rows(), gold: { '*': 'hidden' }, hidden: ['oneup'], doors: [{ to: 'field@folkBack', look: 'isFolkDoor' }],
    legend: { e: ['decor', 'isElfDoor'], n: ['spawn', 'sign', { text: 'THE HIDDEN FOLK LEFT THEIR BACK DOOR OPEN. WHERE DOES IT GO?' }] } };
})();
const L1 = { n: 1, name: 'Northern Lights', mapLabel: 'Northern Lights', arch: 'aurora', theme: 'is_aurora',
  gimmick: 'A night over the lava field: the aurora\'s ribbons are walkable light. They ripple, fade from one end and relight: run ahead of the fade',
  hint: 'Sparkles on a ribbon mean the fade is coming: step on as it lights up and keep running. A painted door in a rock up on the ridge...',
  postcard: 'The sky is DANCING, Brady. Green and pink. I may never sleep again. ♥ C',
  enemies: [['isFox', 2], ['isPuffin', 4], ['isTern', 2], ['isRam', 1]],
  mapCell: [0, 1], mapFrom: -1,
  exits: { main: { to: '17-2' }, secret: { to: '17-6', hint: 'A tiny painted door in a rock high on the ridge, where a ribbon blinks...' } },
  areas: [
    { id: 'field', gen: 'room', theme: 'is_aurora', stamp: 'isAurora', bottomKill: true },
    { id: 'huldu', gen: 'room', role: 'secret', theme: 'is_folk', stamp: 'isHuldu' }
  ] };

/* ---------------- 17-2 The Glacier Lagoon ----------------
   Black-sand spits between stretches of icy lagoon (the water on rows 15-17 is too cold: L). Icebergs float with their
   tops on row 14, level with the sand. They tip under Brady's weight: off-centre they tilt and he slides downhill;
   held at full tilt they creak, crack and roll over. A seal lying on one end is a counterweight (stand on the other
   side). Teach over two shallow pools (W: a fall is a swim back), test over the lagoon with puffins and terns, twist
   with small bergs, seals on alternate ends and drifting floes; the glacier's ice cave is the secret. */
const lagoon = (() => {
  const G = mk(206, 18);
  const sand = (x0, x1) => G.fill(x0, 14, x1, 17, '#');
  G.fill(0, 15, 205, 17, 'L');
  sand(0, 12); sand(25, 28); sand(41, 46); sand(70, 74); sand(94, 101); sand(124, 128); sand(146, 153); sand(180, 205);
  // the two teaching pools: shallow water over sand (a fall is a swim and a climb back out)
  G.fill(13, 15, 24, 15, 'W').fill(13, 16, 24, 17, '#'); G.fill(29, 15, 40, 15, 'W').fill(29, 16, 40, 17, '#');
  G.put(2, 13, '@'); G.put(6, 13, 'k'); G.put(9, 9, '?'); G.put(4, 13, 'x');
  // teach 1: a wide berg on its own; teach 2: a berg with a seal on its far end
  G.put(16, 14, 'a'); G.coins(16, 21, 11); G.put(26, 13, 'K');
  G.put(32, 14, 'n'); G.coins(32, 37, 11); G.put(36, 8, '*');
  G.put(44, 13, 'f');
  // test 1: the open lagoon, three bergs, a puffin overhead
  G.put(48, 14, 'e'); G.put(55, 14, 'E'); G.put(62, 14, 'e'); G.put(57, 8, 'p'); G.coins(49, 66, 11);
  G.put(72, 9, '?'); G.put(72, 13, 'q');
  // test 2: a drifting berg and a seal berg, a tern
  G.put(76, 14, 'd'); G.put(86, 14, 'n'); G.put(84, 8, 't');
  // checkpoint 1
  G.put(97, 13, 'c'); G.put(100, 13, 'x');
  // the twist: small bergs, seals on alternate ends, a drifting floe between them, puffins
  G.put(103, 14, 'u'); G.put(109, 14, 'w'); G.put(113, 13, 'Y'); G.put(120, 14, 'u'); G.put(112, 8, 'p'); G.put(122, 7, 'p'); G.coins(104, 122, 11);
  G.put(126, 13, 'm');
  // the glacier wall over the next stretch: its ice cave (the secret) up on a shelf, reached off a high floe
  G.put(131, 14, 'e'); G.put(137, 14, 'E'); G.fill(136, 7, 141, 7, '-'); G.put(139, 6, 'D'); G.put(137, 6, 'i'); G.put(134, 11, 'Z');
  // checkpoint 2, before the last stretch
  G.put(149, 13, 'c'); G.put(151, 9, '?'); G.put(147, 13, 'A');
  // the last stretch: drifting bergs with seals, a floe, terns and a puffin; P3 (risky) low over the water
  G.put(155, 14, 'e'); G.put(161, 14, 'w'); G.put(168, 13, 'Y'); G.put(175, 14, 'u'); G.put(169, 10, 'R'); G.put(162, 8, 't'); G.put(182, 7, 'p');
  G.coins(156, 163, 11);
  G.put(192, 13, 'j'); G.put(198, 13, 'G'); G.put(203, 13, 'x');
  return G.rows();
})();
const LAG = {
  x: ['decor', 'isRock'], q: ['decor', 'isCairn'], j: ['decor', 'isHut'], i: ['decor', 'isElfDoor'],
  k: ['spawn', 'sign', { text: 'ICEBERGS TIP UNDER YOUR WEIGHT! STAND IN THE MIDDLE. ON A TILT YOU SLIDE; AT FULL TILT IT CREAKS... AND ROLLS' }],
  K: ['spawn', 'sign', { text: 'A SEAL IS HEAVY: THE BERG LEANS HIS WAY. STAND ON THE OTHER SIDE TO BALANCE IT' }],
  a: ['piece', 'berg', { w: 5 }], n: ['piece', 'berg', { w: 5, seal: 1 }], e: ['piece', 'berg', { w: 4 }], E: ['piece', 'berg', { w: 4, seal: -1 }],
  d: ['piece', 'berg', { w: 4, ax: 4, speed: 0.7 }], u: ['piece', 'berg', { w: 3, seal: 1 }], w: ['piece', 'berg', { w: 3, seal: -1, ax: 2, speed: 0.6 }], A: ['anchor', 'caveBack'],
  Y: ['piece', 'plank', { ax: 2, w: 3, speed: 0.8, skin: 'isFloe' }], Z: ['piece', 'plank', { ax: 0, ay: -3, w: 2, speed: 0.9, skin: 'isFloe' }],
  f: ['enemy', 'isFox'], m: ['enemy', 'isRam'], p: ['enemy', 'isPuffin'], t: ['enemy', 'isTern']
};
stamps.isLagoon = { floor: 14, rows: lagoon, legend: LAG, items: ['power', 'power', 'star'], gold: { '*': 'must', R: 'risky' }, doors: [{ to: 'cave@in', look: 'isTube' }] };
// the ice cave in the glacier: blue walls, a hidden 1UP, P2, the way back out
stamps.isIceCave = (() => {
  const G = mk(30, 14);
  G.fill(0, 0, 29, 0, 'I').fill(0, 12, 29, 13, 'I').fill(0, 0, 0, 11, 'I').fill(29, 0, 29, 11, 'I');
  G.put(2, 11, '@'); G.put(4, 11, 'D'); G.fill(8, 9, 12, 9, '-'); G.fill(15, 7, 19, 7, '-'); G.fill(21, 4, 25, 4, '-'); G.put(23, 2, '*'); G.coins(9, 11, 8); G.coins(16, 18, 6); G.put(13, 3, 'h'); G.put(26, 11, 'x');
  return { floor: 12, rows: G.rows(), gold: { '*': 'hidden' }, hidden: ['oneup'], doors: [{ to: 'lagoon@caveBack', look: 'isTube' }], legend: { x: ['decor', 'isRock'] } };
})();
const L2 = { n: 2, name: 'The Glacier Lagoon', mapLabel: 'Glacier Lagoon', arch: 'berg', theme: 'is_lagoon',
  gimmick: 'Hop across a lagoon of icebergs that tip under your weight and roll over when you stand off-centre; seals are counterweights',
  hint: 'Stand in the middle of a berg, or opposite its seal. If it creaks, move! A floe rises past an ice cave in the glacier...',
  postcard: 'Seals! On icebergs! They do not want to share. ♥ C',
  enemies: [['isPuffin', 4], ['isTern', 2], ['isFox', 1], ['isRam', 1]],
  mapCell: [1, 1], mapFrom: 0,
  areas: [
    { id: 'lagoon', gen: 'room', theme: 'is_lagoon', stamp: 'isLagoon', bottomKill: true },
    { id: 'cave', gen: 'room', role: 'secret', theme: 'is_lagoon', stamp: 'isIceCave' }
  ] };
/* ---------------- 17-3 The Rift ----------------
   The crack between two plates of the earth: the land comes apart and grinds together on a slow clock. Slabs of
   mossy ground slide across the chasms (ferries: board one at one bank, ride it to the other), slabs of rock grind
   down from the overhangs (crushers: pass under while they are up), and a slab lifts to the cliff. Every move is
   told a second ahead: the ground rumbles, dust trickles, the seam glows and a '!' blinks. Groups: 0 the ferries
   (5 s), 1 the crushers (6 s), 2 the lift (4 s), 3 the counter-ferry of the last stretch (5 s, half a beat
   later). Teach over a shallow trough, test over the chasm, twist by combining them; a steaming fissure under the
   cliff hides a lava tube. */
const rift = (() => {
  const G = mk(176, 18);
  const ground = (x0, x1, top) => G.fill(x0, top == null ? 15 : top, x1, 17, '#');
  ground(0, 14); ground(27, 40); ground(50, 52); ground(61, 66); ground(70, 84, 10); ground(85, 88); ground(98, 100); ground(109, 125); ground(135, 136); ground(145, 146); ground(155, 175);
  G.fill(15, 17, 26, 17, '#'); G.fill(67, 16, 69, 17, '#');
  // overhangs over the crushers (rock from the top down to row 8)
  G.fill(33, 0, 39, 8, '#'); G.fill(96, 0, 102, 8, '#'); G.fill(144, 0, 147, 8, '#');
  G.put(2, 14, '@'); G.put(6, 14, 'k'); G.put(9, 10, '?'); G.put(4, 14, 'x'); G.put(12, 14, 'V');
  // teach 1: a ferry over a shallow trough
  G.put(15, 15, 'a'); G.coins(16, 25, 12);
  // teach 2: a crusher grinding down from the overhang over the flat
  G.put(29, 14, 'K'); G.put(35, 9, 'u'); G.put(45, 10, '*');
  // test: two ferries across the chasm with an island between, a puffin over it
  G.put(41, 15, 'r'); G.put(53, 15, 'd'); G.put(51, 8, 'p'); G.coins(42, 48, 12); G.coins(54, 59, 12);
  G.put(64, 10, '?'); G.put(63, 14, 'm');
  // the lift up to the cliff top, checkpoint 1 on the cliff
  G.put(67, 15, 'e'); G.put(74, 9, 'c'); G.put(80, 9, 'q'); G.put(78, 9, 'f');
  // the steaming fissure under the cliff edge (the lava tube: the secret)
  G.put(86, 14, 'D'); G.put(87, 14, 'V'); G.put(88, 14, 'A');
  // the twist: ferry, an island under a crusher, ferry
  G.put(89, 15, 'r'); G.put(98, 9, 'u'); G.put(101, 15, 'd'); G.put(94, 7, 't'); G.coins(90, 96, 12);
  G.put(113, 14, 'x'); G.put(116, 14, 'm');
  // checkpoint 2, before the last stretch
  G.put(120, 14, 'c'); G.put(123, 10, '?');
  // the last stretch: ferry, the counter-ferry, an island under a crusher, a ferry; P3 (risky) over the chasm
  G.put(126, 15, 'r'); G.put(137, 15, 'w'); G.put(145, 9, 'n'); G.put(147, 15, 'd'); G.put(141, 9, 'R'); G.put(132, 7, 'p'); G.put(151, 7, 't');
  G.put(160, 14, 'q'); G.put(166, 14, 'G'); G.put(171, 14, 'x');
  return G.rows();
})();
const RIFTL = {
  x: ['decor', 'isRock'], q: ['decor', 'isCairn'], V: ['decor', 'isVentDecor'], A: ['anchor', 'tubeBack'],
  k: ['spawn', 'sign', { text: 'THE RIFT! THE GROUND HERE SLIDES APART AND BACK. WHEN IT RUMBLES AND THE SEAM GLOWS, A SLAB IS ABOUT TO MOVE. RIDE IT ACROSS' }],
  K: ['spawn', 'sign', { text: 'ROCK GRINDS DOWN FROM ABOVE! PASS UNDER WHILE IT IS UP, AND NEVER WHEN IT RUMBLES' }],
  a: ['piece', 'plate', { w: 4, dx: 8, g: 0, period: 5 }],
  u: ['piece', 'plate', { w: 3, h: 3, dy: 3, g: 1, period: 6, tile: 'HARD', ride: false }],
  n: ['piece', 'plate', { w: 2, h: 3, dy: 3, g: 1, period: 6, tile: 'HARD', ride: false }],
  r: ['piece', 'plate', { w: 3, dx: 6, g: 0, period: 5 }],
  d: ['piece', 'plate', { w: 3, dx: 5, g: 0, period: 5 }],
  e: ['piece', 'plate', { w: 3, dy: -5, g: 2, period: 4 }],
  w: ['piece', 'plate', { w: 3, dx: 5, g: 3, period: 5, phase: 2.5 }],
  f: ['enemy', 'isFox'], m: ['enemy', 'isRam'], p: ['enemy', 'isPuffin'], t: ['enemy', 'isTern']
};
stamps.isRift = { floor: 15, rows: rift, legend: RIFTL, items: ['power', 'power', 'power'], gold: { '*': 'must', R: 'risky' }, doors: [{ to: 'tube@in', look: 'isTube' }] };
// the lava tube under the cliff: a warm glowing tunnel, a hidden 1UP, P2, the way back out
stamps.isLavaTube = (() => {
  const G = mk(32, 14);
  G.fill(0, 0, 31, 1, '#').fill(0, 12, 31, 13, '#').fill(0, 0, 0, 11, '#').fill(31, 0, 31, 11, '#');
  G.put(2, 11, '@'); G.put(4, 11, 'D'); G.fill(9, 9, 13, 9, '-'); G.fill(16, 7, 19, 7, '-'); G.fill(22, 5, 26, 5, '-'); G.put(24, 3, '*'); G.coins(10, 12, 8); G.coins(23, 25, 4); G.put(17, 3, 'h');
  G.put(14, 11, 'V'); G.put(28, 11, 'V');
  return { floor: 12, rows: G.rows(), gold: { '*': 'hidden' }, hidden: ['oneup'], doors: [{ to: 'rift@tubeBack', look: 'isTube' }], legend: { V: ['decor', 'isHotPot'] } };
})();
const L3 = { n: 3, name: 'The Rift', mapLabel: 'The Rift', arch: 'quake', theme: 'is_rift',
  gimmick: 'The land splits along the rift: slabs slide across the chasms and grind down from the overhangs on a slow rhythm. Ride them, time them',
  hint: 'Listen for the rumble: a glowing seam means a slab is about to move. Board a slab while it rests at your bank. Steam hisses from a crack under the cliff...',
  postcard: 'I stood with one foot in America and one in Europe. Then the ground moved and I had to pick one. ♥ C',
  enemies: [['isRam', 2], ['isPuffin', 2], ['isTern', 2], ['isFox', 1]],
  mapCell: [2, 1], mapFrom: 1,
  areas: [
    { id: 'rift', gen: 'room', theme: 'is_rift', stamp: 'isRift', bottomKill: true },
    { id: 'tube', gen: 'room', role: 'secret', theme: 'is_tube', stamp: 'isLavaTube' }
  ] };
/* ---------------- 17-4 The Organ Pipes ----------------
   Inside the volcano: a lava lake on rows 15-17 (L), scoria ledges on row 12, and the organ pipes: hexagonal basalt
   columns whose tops rest on row 12 (p, P, q, Q) and sink under Brady like organ keys, each at its own speed and on its
   own note, rising again when he steps off; the slow ones stop short of the lava, the others go under. Lift columns
   (u, U) rise under him instead. Lava blobs (e) bubble, then leap over the gaps. Teach over a scoria floor (a fall is a
   walk back), test over the lake, twist with fast pipes and lifts between leaping lava. */
const pipes = (() => {
  const G = mk(196, 18);
  const ledge = (x0, x1, top) => G.fill(x0, top == null ? 12 : top, x1, 17, '#');
  G.fill(0, 15, 195, 17, 'L');
  ledge(0, 12); G.fill(13, 15, 30, 17, '#'); ledge(31, 36); ledge(64, 72); ledge(112, 120); ledge(150, 158); ledge(184, 195);
  G.put(2, 11, '@'); G.put(6, 11, 'k'); G.put(9, 8, '?'); G.put(4, 11, 'x');
  // teach: three slow pipes over the scoria floor, then a lift to a coin shelf
  G.put(14, 12, 'p'); G.put(18, 12, 'p'); G.put(22, 12, 'q'); G.put(26, 9, 'K'); G.coins(14, 24, 9);
  G.put(27, 12, 'u'); G.fill(26, 7, 30, 7, '-'); G.put(28, 5, '*');
  // test 1: the lake: pipes that go under, a blob between
  G.put(38, 12, 'q'); G.put(42, 12, 'P'); G.put(41, 14, 'e'); G.put(46, 12, 'q'); G.put(50, 12, 'P'); G.put(49, 14, 'e'); G.put(54, 12, 'q'); G.put(58, 12, 'p'); G.put(61, 14, 'e');
  G.coins(39, 59, 9);
  G.put(66, 8, '?'); G.put(70, 11, 'c'); G.put(68, 11, 'm');
  // test 2: a lift between two leaps up to a high ledge (the vent: the secret), then down over fast pipes
  G.put(74, 12, 'z'); G.put(77, 14, 'e'); G.put(79, 12, 'U'); G.fill(81, 5, 87, 7, '#'); G.put(85, 4, 'D'); G.put(83, 4, 'V');
  G.put(83, 12, 'z'); G.put(87, 12, 'P'); G.put(86, 14, 'e'); G.put(91, 12, 'z'); G.put(95, 12, 'z'); G.put(94, 14, 'e'); G.put(99, 12, 'P'); G.put(103, 12, 'z'); G.put(107, 12, 'P'); G.put(106, 14, 'e');
  G.coins(88, 108, 9);
  G.put(114, 11, 'm'); G.put(117, 11, 'c'); G.put(119, 8, '?'); G.put(116, 11, 'A');
  // the twist: fast pipes, lifts and leaping lava in one breath; P3 (risky) low over the lake
  G.put(122, 12, 'z'); G.put(125, 14, 'e'); G.put(126, 12, 'U'); G.put(130, 12, 'z'); G.put(134, 12, 'z'); G.put(133, 14, 'e'); G.put(138, 12, 'U'); G.put(142, 12, 'z'); G.put(141, 14, 'e'); G.put(146, 12, 'P');
  G.put(136, 11, 'R'); G.coins(123, 147, 9);
  // checkpoint 2 before the last stretch
  G.put(153, 11, 'c'); G.put(156, 11, 'x');
  // the last stretch: the fastest pipes, the blobs on a quicker beat
  G.put(160, 12, 'z'); G.put(163, 14, 'f'); G.put(164, 12, 'z'); G.put(168, 12, 'U'); G.put(167, 14, 'f'); G.put(172, 12, 'z'); G.put(176, 12, 'z'); G.put(175, 14, 'f'); G.put(180, 12, 'P'); G.put(179, 14, 'f');
  G.coins(161, 181, 9);
  G.put(188, 11, 'G'); G.put(193, 11, 'x');
  return G.rows();
})();
const PIPEL = {
  x: ['decor', 'isRock'], V: ['decor', 'isVentDecor'], A: ['anchor', 'ventBack'],
  k: ['spawn', 'sign', { text: 'THE ORGAN PIPES! BASALT COLUMNS SINK UNDER YOUR WEIGHT, EACH AT ITS OWN SPEED. KEEP HOPPING BEFORE YOURS GOES UNDER' }],
  K: ['spawn', 'sign', { text: 'A BLUE COLUMN WITH AN ARROW RISES WHEN YOU STAND ON IT' }],
  p: ['piece', 'pipe', { w: 2, lo: 2, speed: 0.9, rise: 2 }],
  q: ['piece', 'pipe', { w: 2, lo: 4, speed: 1.3, rise: 2.4 }],
  P: ['piece', 'pipe', { w: 2, lo: 4, speed: 1.0, rise: 2.2 }],
  z: ['piece', 'pipe', { w: 2, lo: 4, speed: 2.0, rise: 3 }],
  u: ['piece', 'pipe', { w: 2, lo: 4, kind: 'lift', speed: 2.2, rise: 2.2 }],
  U: ['piece', 'pipe', { w: 2, lo: 5, kind: 'lift', speed: 2.6, rise: 2.4 }],
  e: ['piece', 'ember', { jump: 14, every: 2.4 }], f: ['piece', 'ember', { jump: 14, every: 1.7 }],
  m: ['enemy', 'isRam']
};
stamps.isPipes = { floor: 12, rows: pipes, legend: PIPEL, items: ['power', 'power', 'power', 'power'], gold: { '*': 'must', R: 'risky' }, doors: [{ to: 'vent@in', look: 'isTube' }] };
// the vent behind the steaming crack: a warm chamber of hot pots, a hidden 1UP, P2, the way back down
stamps.isVent = (() => {
  const G = mk(30, 14);
  G.fill(0, 0, 29, 1, '#').fill(0, 12, 29, 13, '#').fill(0, 0, 0, 11, '#').fill(29, 0, 29, 11, '#');
  G.put(2, 11, '@'); G.put(4, 11, 'D'); G.fill(8, 8, 12, 8, '-'); G.fill(15, 6, 19, 6, '-'); G.fill(21, 4, 25, 4, '-'); G.put(23, 2, '*'); G.coins(9, 11, 7); G.coins(16, 18, 5); G.put(14, 3, 'h');
  G.put(10, 11, 'V'); G.put(18, 11, 'V'); G.put(25, 11, 'V');
  return { floor: 12, rows: G.rows(), gold: { '*': 'hidden' }, hidden: ['oneup'], doors: [{ to: 'crater@ventBack', look: 'isTube' }], legend: { V: ['decor', 'isHotPot'] } };
})();
const L4 = { n: 4, name: 'The Organ Pipes', mapLabel: 'Organ Pipes', arch: 'basalt', theme: 'is_volcano',
  gimmick: 'Inside the volcano, over a lava lake: hexagonal basalt columns sink under your weight like organ keys, each at its own speed. Lift columns rise. Lava leaps',
  hint: 'Never stand still on a column: hop on before it goes under. Blue columns lift you. A crack steams high on the crater wall...',
  postcard: 'Every column plays a different note. I played a song! It was mostly the same note. ♥ C',
  enemies: [['isRam', 2]],
  mapCell: [2, 2], mapFrom: 2,
  areas: [
    { id: 'crater', gen: 'room', theme: 'is_volcano', stamp: 'isPipes', bottomKill: true },
    { id: 'vent', gen: 'room', role: 'secret', theme: 'is_tube', stamp: 'isVent' }
  ] };
/* ---------------- 17-5 The Night Troll ----------------
   The shore below the troll's cave, the last of the night: the aurora fading, sea stacks in the fjord (trolls the sun
   caught long ago), a ram and a fox, two power-ups on the way (rule 6), a turf hut with its door ajar; then the cave
   mouth (the arena, 29_tour_is_boss.js). */
const shore = (() => {
  const G = mk(78, 16);
  G.fill(0, 13, 77, 15, '#'); G.fill(18, 13, 21, 15, '.'); G.fill(38, 13, 41, 15, '.');
  G.put(2, 12, '@'); G.put(5, 12, 'k'); G.put(8, 9, '?'); G.put(12, 12, 'j'); G.put(13, 12, 'D');
  G.put(18, 10, 'a'); G.coins(18, 21, 8); G.put(26, 12, 'm'); G.put(30, 7, '*'); G.fill(28, 9, 32, 9, '-');
  G.put(38, 10, 'd'); G.put(40, 6, 'R'); G.put(46, 12, 'f'); G.put(50, 9, '?'); G.put(55, 12, 't');
  G.put(60, 12, 'P'); G.put(66, 12, 'x'); G.put(72, 12, 'E'); G.put(14, 12, 'A');
  return G.rows();
})();
stamps.isShore = { floor: 13, rows: shore, items: ['power', 'power'], gold: { '*': 'must', R: 'risky' }, doors: [{ to: 'hut@in', look: 'isHutDoor' }],
  legend: { j: ['decor', 'isHut'], x: ['decor', 'isRock'], t: ['decor', 'isTrollStone'], P: ['decor', 'isPoster'], A: ['anchor', 'hutBack'],
    k: ['spawn', 'sign', { text: 'THE NIGHT TROLL HAS WAITED WEEKS FOR HIS ENCORE. TROLLS TURN TO STONE IN SUNLIGHT... AND DAWN IS COMING' }],
    a: ['piece', 'ribbon', { len: 4, mode: 'pulse', hold: 2.4, dark: 1.2, amp: 3 }], d: ['piece', 'ribbon', { len: 4, mode: 'pulse', hold: 2.4, dark: 1.2, amp: 3, hue: 2, phase: 1.2 }],
    m: ['enemy', 'isRam'], f: ['enemy', 'isFox'], E: ['spawn', 'portal', { kind: 'door', look: 'isTube', targetRef: 'cave@in' }] } };
// inside the turf hut: a warm little room, a hidden 1UP up in the rafters, P2
stamps.isTrollHut = (() => {
  const G = mk(28, 14);
  G.fill(0, 0, 27, 1, 'B').fill(0, 12, 27, 13, '#').fill(0, 0, 0, 11, 'B').fill(27, 0, 27, 11, 'B');
  G.put(2, 11, '@'); G.put(4, 11, 'D'); G.fill(8, 8, 12, 8, '-'); G.fill(15, 6, 19, 6, '-'); G.put(17, 4, '*'); G.put(10, 4, 'h'); G.coins(9, 11, 7); G.put(22, 11, 'V');
  return { floor: 12, rows: G.rows(), gold: { '*': 'hidden' }, hidden: ['oneup'], doors: [{ to: 'shore@hutBack', look: 'isHutDoor' }], legend: { V: ['decor', 'isHotPot'] } };
})();
const L5 = { n: 5, name: 'The Night Troll', mapLabel: 'Troll\'s Cave', arch: 'lair', theme: 'is_dawn', boss: 'is_troll',
  gimmick: 'The act nobody cancelled: a troll who must finish before sunrise. Bounce the dawn off the old shields onto him',
  hint: 'Step on a shield\'s stone: it throws sunlight onto a spot on the floor. Lure the troll onto the spot, then stomp his stony head',
  postcard: 'The geyser is uncorked! Whoosh. The troll is a very handsome rock now. He seems happy with the view. ♥ C',
  enemies: [['isRam', 1], ['isFox', 1]],
  mapCell: [1, 2], mapFrom: 3,
  exits: { main: { to: 'country:next' } },
  areas: [
    { id: 'shore', gen: 'room', theme: 'is_dawn', stamp: 'isShore', bottomKill: true },
    { id: 'hut', gen: 'room', role: 'secret', theme: 'is_tube', stamp: 'isTrollHut' },
    { id: 'cave', gen: 'arena', role: 'arena', layout: 'cave', arenaW: 28, H: 18, theme: 'is_cave' }
  ] };
/* ---------------- 17-6 The Hidden Folk (secret) ----------------
   Behind the painted door on the ridge (17-1): the hidden folk's own country under the midnight sun. Their painted
   planks (s) are only there while nobody looks at them: tap THROW to look back over your shoulder, then walk
   backwards onto them. Their little gates (w) are the other way round: there while Brady looks at them, so he backs
   through. The twist: white planks with a painted eye (e) are there only while he DOES look at them: switch your gaze
   in mid-air. Teach over a shallow dip, test over the pits, twist with both kinds in a row. */
const folk = (() => {
  const G = mk(176, 18);
  const ground = (x0, x1, top) => G.fill(x0, top == null ? 15 : top, x1, 17, '#');
  ground(0, 14); ground(27, 36); ground(53, 58); ground(77, 86); ground(105, 110); ground(124, 132); ground(150, 175);
  G.fill(15, 17, 26, 17, '#');
  G.put(1, 14, 'E'); G.put(3, 14, '@'); G.put(6, 14, 'k'); G.put(10, 10, '?'); G.put(12, 14, 'i');
  // teach 1: planks over a shallow dip
  G.put(15, 15, 'n'); G.put(19, 15, 'n'); G.put(23, 15, 'n'); G.coins(16, 25, 11);
  // teach 2: a folk gate across the path, then the dip's far side
  G.put(28, 14, 'K'); G.put(32, 14, 'w'); G.put(35, 10, '*');
  // test: planks over the pit, a gap between each (jump backwards), a fox on the island
  G.put(37, 15, 'n'); G.put(42, 14, 'n'); G.put(47, 13, 'n'); G.put(50, 14, 'n'); G.put(56, 14, 'f'); G.coins(38, 51, 9);
  G.put(59, 15, 'N'); G.put(63, 14, 'n'); G.put(68, 13, 'N'); G.put(72, 14, 'n'); G.put(66, 7, 'p');
  G.put(79, 14, 'c'); G.put(82, 10, '?'); G.put(84, 14, 'w');
  // the folk's house in a boulder (the secret room), its door beside a gate
  G.put(85, 14, 'D'); G.put(86, 14, 'A');
  // the twist: eye planks (look AT them) and folk planks (look AWAY) in turn, a tern
  G.put(87, 15, 'e'); G.put(91, 14, 'n'); G.put(95, 13, 'e'); G.put(99, 14, 'n'); G.put(103, 15, 'e'); G.put(96, 7, 't'); G.coins(88, 104, 10);
  // checkpoint 2, a gate, then the last stretch: longer, a gate on an island, P3 (risky) high over the pit
  G.put(106, 14, 'c'); G.put(109, 14, 'w');
  G.put(111, 15, 'n'); G.put(115, 14, 'e'); G.put(119, 13, 'n'); G.put(122, 14, 'e'); G.put(118, 7, 'R');
  G.put(126, 14, 'w'); G.put(130, 14, 'f');
  G.put(133, 15, 'e'); G.put(137, 14, 'n'); G.put(141, 13, 'e'); G.put(145, 14, 'N'); G.put(140, 6, 'p'); G.coins(134, 147, 9);
  G.put(155, 14, 'i'); G.put(162, 14, 'G'); G.put(168, 14, 'j');
  return G.rows();
})();
const FOLK = {
  i: ['decor', 'isElfDoor'], j: ['decor', 'isHut'], A: ['anchor', 'houseBack'], E: ['piece', 'shyEye', {}],
  k: ['spawn', 'sign', { text: 'THE HIDDEN FOLK\'S PLANKS ARE ONLY THERE WHEN NOBODY LOOKS. TAP THROW TO LOOK BACK, THEN WALK BACKWARDS ONTO THEM' }],
  K: ['spawn', 'sign', { text: 'THEIR LITTLE GATES ARE THE OTHER WAY ROUND: THEY STOP YOU ONLY WHILE YOU LOOK AT THEM. BACK THROUGH!' }],
  n: ['piece', 'shy', { w: 3 }], N: ['piece', 'shy', { w: 2 }], e: ['piece', 'shy', { w: 3, bold: true }], w: ['piece', 'shyWall', { h: 3 }],
  f: ['enemy', 'isFox'], p: ['enemy', 'isPuffin'], t: ['enemy', 'isTern']
};
stamps.isFolk = { floor: 15, rows: folk, legend: FOLK, items: ['power', 'power'], gold: { '*': 'must', R: 'risky' }, doors: [{ to: 'house@in', look: 'isFolkDoor' }] };
// inside the boulder: the folk's parlour (nobody home: a kettle still steaming), P2, a hidden 1UP, the way out
stamps.isFolkHouse = (() => {
  const G = mk(28, 14);
  G.fill(0, 0, 27, 1, 'B').fill(0, 12, 27, 13, '#').fill(0, 0, 0, 11, 'B').fill(27, 0, 27, 11, 'B');
  G.put(2, 11, '@'); G.put(4, 11, 'D'); G.fill(8, 8, 12, 8, '-'); G.fill(15, 6, 19, 6, '-'); G.put(17, 4, '*'); G.put(10, 4, 'h'); G.coins(9, 11, 7); G.put(22, 11, 'V'); G.put(14, 11, 'i');
  return { floor: 12, rows: G.rows(), gold: { '*': 'hidden' }, hidden: ['oneup'], doors: [{ to: 'folk@houseBack', look: 'isFolkDoor' }], legend: { V: ['decor', 'isHotPot'], i: ['decor', 'isElfDoor'] } };
})();
const L6 = { n: 6, name: 'The Hidden Folk', mapLabel: 'Hidden Folk', arch: 'shy', secret: true, theme: 'is_folk',
  gimmick: 'The hidden folk\'s country: their planks exist only while you look away from them, their gates only while you look at them. Walk backwards',
  hint: 'Tap THROW to look back over your shoulder: then the painted planks ahead of you appear. White planks with an eye want to be looked at',
  postcard: 'I did not see any hidden folk. That is how you know they were there. ♥ C',
  enemies: [['isFox', 2], ['isPuffin', 2], ['isTern', 1]],
  mapCell: [0, 2], mapFrom: 0,
  exits: { main: { to: 'node:17-2' } },
  areas: [
    { id: 'folk', gen: 'room', theme: 'is_folk', stamp: 'isFolk', bottomKill: true },
    { id: 'house', gen: 'room', role: 'secret', theme: 'is_tube', stamp: 'isFolkHouse' }
  ] };
/* ---------------- placeholders for the levels still to come (replaced below as each is built) ---------------- */
const stub = (n, name, arch, theme, extra) => Object.assign({ n, name, arch, theme, gimmick: name, hint: name, postcard: name + ' ♥ C', enemies: [['isFox', 1]],
  mapCell: [n % 3, 1], mapFrom: n - 2, areas: [{ id: 'a', gen: 'room', theme, stamp: 'isStub' }] }, extra || {});
stamps.isStub = (() => { const G = mk(29, 12); G.fill(0, 0, 28, 0, '#').fill(0, 10, 28, 11, '#').fill(0, 0, 0, 9, '#').fill(28, 0, 28, 9, '#'); G.put(2, 9, '@..?..*....?..o.o..R...P..G'); return { floor: 10, rows: G.rows(), items: ['power', 'power'], gold: { '*': 'must', R: 'risky', P: 'high' } }; })();
const levels = [L1, L2, L3, L4,
  L5, L6];

Tour.amend('is', { stamps, levels });
/* ---------------- the land's map: the island of fire and ice ----------------
   Iceland's own shape (the west fjords' claw at the top left), the night field in the west, the glacier lagoon under
   the ice cap in the south east, the rift running through the middle, the volcano in the north, the troll's cave on
   the north-east fjord where the port is; the hidden folk's stop (17-6) hides by a rock near 17-1. */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.is = {
  labels: { '17-1': 'Northern Lights', '17-2': 'Glacier Lagoon', '17-3': 'The Rift', '17-4': 'Organ Pipes', '17-5': 'Troll\'s Cave', '17-6': 'Hidden Folk' },
  w: 1700, h: 900,
  pal: { sea: '#2a5a7a', deep: '#123048', land: '#4a7a4a', light: '#7ab05a', path: '#f2e8c8', beach: '#2a2a32', cliff: '#3a3a44' },
  trail: 'stones',
  land: [[[90, 300], [150, 160], [260, 110], [330, 190], [300, 260], [380, 250], [430, 160], [560, 140], [700, 190], [860, 130], [1040, 150], [1180, 110], [1330, 170], [1470, 150], [1600, 260], [1620, 420], [1560, 560], [1600, 650], [1480, 760], [1300, 800], [1080, 840], [860, 830], [640, 780], [460, 720], [300, 640], [200, 560], [120, 480], [170, 400]]],
  nodes: { start: [230, 520], '17-1': [420, 430], '17-6': [330, 300], '17-2': [1000, 720], '17-3': [760, 520], '17-4': [960, 300], '17-5': [1330, 330], port: [1490, 230] },
  paths: { 'start>17-1': [[320, 480]], '17-1>17-6': [[380, 360]], '17-6>17-2': [[520, 330], [700, 400], [860, 640]], '17-1>17-2': [[560, 560], [800, 700]], '17-2>17-3': [[880, 620]], '17-3>17-4': [[860, 400]], '17-4>17-5': [[1140, 290]], '17-5>port': [[1420, 280]] },
  feat: [
    ['patch', '#eef6fa', [[1080, 420], [1240, 400], [1380, 470], [1360, 600], [1180, 640], [1060, 560]]],
    ['patch', '#2a2a32', [[860, 780], [1100, 800], [1300, 760], [1080, 840], [860, 830]]],
    ['range', 'mtn', [[1500, 480, 44], [1450, 620, 38], [560, 230, 40], [680, 260, 34], [250, 220, 32]], { snow: true }],
    ['volcano', 960, 230, 54, { lava: true }],
    ['river', [[700, 180], [740, 320], [760, 520], [720, 700], [700, 790]], 10],
    ['sprite', 'isGlacierMap', 1210, 520, 40], ['sprite', 'isBergMap', 1060, 790, 14], ['sprite', 'isBergMap', 1120, 780, 10],
    ['sprite', 'isGeyserMap', 640, 470, 16], ['sprite', 'isHutMap', 300, 560, 18], ['sprite', 'isHutMap', 520, 610, 16],
    ['sprite', 'isHorseMap', 600, 660, 14], ['sprite', 'isPuffinMap', 1560, 330, 20], ['sprite', 'isTrollMap', 1400, 400, 20], ['sprite', 'isPipesMap', 1060, 300, 20]
  ],
  flora: ['rock'], density: 0.4,
  live: [['walk', 'goose', [[480, 640], [620, 680]], 9]]
};
Object.assign(TourLandscape.ARCH_LABEL, { aurora: 'AURORA', berg: 'BERGS', quake: 'QUAKE', basalt: 'PIPES', shy: 'SHY' });
})();
