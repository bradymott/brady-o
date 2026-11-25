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

/* ---------------- placeholders for the levels still to come (replaced below as each is built) ---------------- */
const stub = (n, name, arch, theme, extra) => Object.assign({ n, name, arch, theme, gimmick: name, hint: name, postcard: name + ' ♥ C', enemies: [['isFox', 1]],
  mapCell: [n % 3, 1], mapFrom: n - 2, areas: [{ id: 'a', gen: 'room', theme, stamp: 'isStub' }] }, extra || {});
stamps.isStub = (() => { const G = mk(29, 12); G.fill(0, 0, 28, 0, '#').fill(0, 10, 28, 11, '#').fill(0, 0, 0, 9, '#').fill(28, 0, 28, 9, '#'); G.put(2, 9, '@..?..*....?..o.o..R...P..G'); return { floor: 10, rows: G.rows(), items: ['power', 'power'], gold: { '*': 'must', R: 'risky', P: 'high' } }; })();
const levels = [L1, stub(2, 'The Glacier Lagoon', 'berg', 'is_lagoon'), stub(3, 'The Rift', 'quake', 'is_rift'), stub(4, 'The Organ Pipes', 'basalt', 'is_volcano'),
  stub(5, 'The Night Troll', 'lair', 'is_dawn'), stub(6, 'The Hidden Folk', 'shy', 'is_folk', { secret: true, mapFrom: 0, exits: { main: { to: 'node:17-2' } } })];

Tour.amend('is', { stamps, levels });
Object.assign(TourLandscape.ARCH_LABEL, { aurora: 'AURORA', berg: 'BERGS', quake: 'QUAKE', basalt: 'PIPES', shy: 'SHY' });
})();
