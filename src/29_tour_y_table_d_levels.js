/* ============================================================
   TABLE FOR TWO: the levels (world 36) and the land's map. A hidden land at about Nepal's difficulty (d0 0.8): every
   stage teaches its idea where a slip costs nothing, tests it with the land's critters, then twists it.
   36-1 MIND THE GOOD CHINA (china)    the plates spin under Brady's feet; their chips are doorways down.
   36-2 THE NAPKIN BIRD (napkin)       step on a crease: sail, bird or square, each with its own load-bearing edge.
   36-3 TABLECLOTH SERVICE (cloth)     hold THROW on the corner, run, release: the cloth whips out, the mat springs.
   36-4 SOUP WITHOUT THE SPOON (crouton) paddle a crouton by walking on its crusts; the cream crust needs flipping.
   36-5 AFTER YOU (lair)               the bread plate to the hostess on every offer, then Madame Manners.
   The secret rooms (B51-B55) are one per stage; the land's tell for a hidden way is a wisp of steam (tabSteam).
   Stamps are drawn with a small grid helper (mk) so the coordinates stay exact.
   ============================================================ */
(function () {
const C = Tour.countries.table;
if (!C) return;
const mk = (W, H) => {
  const g = []; for (let y = 0; y < H; y++) g.push(new Array(W).fill('.'));
  const o = {
    W, H,
    put(x, y, s) { for (let k = 0; k < s.length; k++) if (y >= 0 && y < H && x + k >= 0 && x + k < W) g[y][x + k] = s[k]; return o; },
    fill(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = c; return o; },
    ground(x0, x1, top) { return o.fill(x0, top, x1, H - 1, '#'); },
    pit(x0, x1) { return o.fill(x0, 0, x1, H - 1, '.'); },
    coins(x0, x1, y) { for (let x = x0; x <= x1; x += 2) o.put(x, y, 'o'); return o; },
    rows() { return g.map(r => r.join('')); }
  };
  return o;
};
const stamps = {};
// a secret room's old stamp (TourRooms keeps its door back and its prize boxes): '@', 'D', the prize '?'
const roomStamp = (back, items) => ({ floor: 12, rows: ['############################', '#..........................#', '#.........................?#', '#..........................#'].concat(Array.from({ length: 7 }, () => '#..........................#')).concat(['#.@.D......................#', '############################', '############################']), items, doors: [{ to: back, look: 'tabHatch' }] });
const SIGN = text => ['spawn', 'sign', { text }];
const COMMON = {
  j: ['decor', 'tabCandle'], q: ['decor', 'tabShaker'], w: ['decor', 'tabGlass'], x: ['decor', 'tabBread'], t: ['decor', 'tabTeapot'], u: ['decor', 'tabSugar']
};

/* ---------------- 36-1 Mind the Good China ----------------
   The floor is row 14 (22 rows: a cellar row band under it). ① the teach: from the start shelf a plate is the only
   way on (the teapot wall blocks the top): walk on it, the chip comes round, drop through it to the passage under
   the teapot; then a plate over a shallow dip (hop the chip or fall in and climb out). ② the test: up to the high
   shelf, a plate whose chip drops Brady onto the plate below (a Crumb Butler sweeping on it), and that plate's chip
   down to the bread-basket passage; a plate with a wisp of steam at its far end (the secret: its chip there drops
   into a cubby with a hatch: BAD REFLECTION). ③ the twist: two plates meshed at the rims under a low shelf; the rims
   are a wall until both bites meet there. Then the same over a pit, where the chip you are standing on is the danger. */
const china = (() => {
  const G = mk(196, 22), F = 14;
  // ① the start shelf, the first plate, the teapot wall, the passage under it
  G.ground(0, 9, 10); G.put(2, 9, '@'); G.put(4, 9, 'n'); G.put(6, 6, '?'); G.put(8, 9, 'z');
  G.put(10, 10, '1');                                   // plate 1 (x10-17, row 10)
  G.fill(18, 3, 21, 11, 'H');                           // the teapot wall (the top way is shut)
  G.ground(10, 32, F); G.coins(12, 16, 12); G.put(19, 13, 't'); G.coins(23, 29, 12);
  G.put(26, 13, 'r');
  // the second teach: a plate over a shallow dip (fall in: climb the steps out)
  G.put(30, 13, 'N');
  G.pit(33, 42); G.ground(33, 40, 17); G.ground(41, 41, 16); G.ground(42, 42, 15);
  G.put(33, 14, '2');                                   // plate 2 (x33-40, row 14) over the dip
  G.ground(43, 57, F); G.fill(45, 11, 47, 11, 'B'); G.put(46, 8, '*'); G.coins(44, 48, 9); G.put(49, 13, 'c'); G.put(53, 13, 'f');
  // ② up to the high shelf; plate 3 above plate 4; the pit beside plate 4; the bread basket wall over both
  G.ground(56, 57, 11); G.ground(58, 63, 8); G.put(60, 7, 'k');
  G.pit(64, 65);
  G.put(64, 8, '3');                                    // plate 3 (x64-71, row 8)
  G.put(64, 12, '4');                                   // plate 4 (x64-73, row 12)
  G.fill(72, 2, 75, 11, 'H');                           // the bread basket
  G.ground(64, 88, 16); G.put(70, 15, 'k'); G.coins(76, 86, 14); G.put(80, 15, 'P');
  G.ground(89, 89, 15); G.ground(90, 101, F); G.put(94, 10, '?'); G.put(96, 13, 'c'); G.put(92, 13, 'w');
  G.put(100, 13, 'A');                                  // anchor: back from the room
  // the plate with the steam (the secret): a cubby under its far end, a hatch into BAD REFLECTION
  G.put(102, 14, '5');                                  // plate 5 (x102-109, row 14)
  G.fill(102, 15, 104, 21, '#'); G.fill(105, 15, 110, 19, '.'); G.ground(105, 110, 20); G.put(107, 19, 'D'); G.fill(111, 15, 111, 21, '#');
  G.put(107, 13, 'e');
  G.ground(110, 121, F); G.put(114, 13, 'm'); G.put(119, 13, 'O'); G.put(117, 13, 'Z');
  // ③ the meshed plates under a low shelf (the rims are the wall)
  G.fill(125, 7, 130, 10, 'H'); G.ground(122, 133, F + 1);
  G.put(122, 14, '6'); G.put(128, 14, '7');            // meshed pair 1 (x122-127, x128-133)
  G.ground(134, 138, F); G.put(136, 13, 'c'); G.put(135, 13, 'q');
  // the same over a pit: the chip under your feet is the danger now
  G.pit(139, 152); G.fill(143, 7, 148, 10, 'H');
  G.put(140, 14, '8'); G.put(146, 14, '9');            // meshed pair 2 (x140-145, x146-151)
  G.put(149, 12, 'R');
  G.ground(152, 195, F); G.coins(156, 166, 11); G.put(160, 13, 'f'); G.put(170, 13, 'm'); G.put(176, 13, 'j'); G.put(184, 13, 'G'); G.put(189, 13, 'u');
  G.fill(195, 0, 195, 21, 'H');
  return G.rows();
})();
const PL = (o) => ['piece', 'table.plate', o];
stamps.tabChina = {
  floor: 14, rows: china, items: ['power', 'power'], gold: { '*': 'must', P: 'hidden', R: 'risky' }, doors: [{ to: 'reflect@in', look: 'tabHatch' }],
  legend: Object.assign({}, COMMON, {
    n: SIGN('THE GOOD CHINA SPINS UNDER YOUR FEET. WALK ON A PLATE AND ITS CHIP COMES ROUND: IT IS A DOORWAY DOWN'),
    N: SIGN('THE CHIP SLIDES TOWARD YOU AS YOU WALK. HOP OVER IT, OR LET IT DROP YOU'),
    O: SIGN('MESHED PLATES: THE RIMS ARE A WALL UNTIL BOTH BITES MEET. SPIN, WAIT, STEP THROUGH'),
    '1': PL({ w: 8, u: 13 }), '2': PL({ w: 8, u: 11 }), '3': PL({ w: 8, u: 12 }), '4': PL({ w: 10, u: 15 }), '5': PL({ w: 8, u: 10 }),
    '6': PL({ w: 6, u: 9, rimR: 3, mesh: 'm1', g: 0 }), '7': PL({ w: 6, rimL: 3, mesh: 'm1', follow: true, g: 0 }),
    '8': PL({ w: 6, u: 10, rimR: 3, mesh: 'm2', g: 1 }), '9': PL({ w: 6, rimL: 3, mesh: 'm2', follow: true, g: 1 }),
    e: ['piece', 'table.steam', {}], A: ['anchor', 'b51Back'], Z: ['anchor', 'b51Out'], z: ['decor', 'tabReserved'],
    f: ['enemy', 'tabPepper'], k: ['enemy', 'tabCrumb'], m: ['enemy', 'tabButter'], r: ['enemy', 'tabRest']
  })
};
stamps.tabReflect = roomStamp('dining@b51Back', ['oneup']);
const L1 = { n: 1, name: 'Mind the Good China', mapLabel: 'Good China', arch: 'china', theme: 'table_china',
  gimmick: 'The good china spins under Brady\'s feet: walk on a plate and it turns, and its chip comes round the rim. The chip is a doorway down to the next setting',
  hint: 'Walk on a plate to spin it; stop and it coasts to a stop. Hop the chip, or let it drop you where you want to go. Meshed plates open only when both bites meet. Steam rises where something is hidden...',
  postcard: 'Brady, they brought out the GOOD china. I am not allowed to touch it. Pupo licked a saucer. ♥ C',
  enemies: [['tabCrumb', 2], ['tabPepper', 2], ['tabButter', 2], ['tabRest', 1]],
  mapCell: [0, 1], mapFrom: -1,
  exits: { main: { to: '36-2' } },
  areas: [
    { id: 'dining', gen: 'room', theme: 'table_china', stamp: 'tabChina', bottomKill: true },
    { id: 'reflect', gen: 'room', role: 'secret', theme: 'table_room_drawer', stamp: 'tabReflect', room: 'tabSpoons', tabSpoons: { exit: 'dining@b51Out' } }
  ] };
/* ---------------- 36-2 The Napkin Bird ----------------
   Floor row 14. Every napkin has three creases on its tail (the fold marks on the cloth before it): SAIL, BIRD, SQUARE.
   ① the teach: a sail stands in the way (fold it flat and walk over); a sail is the only way up the bread block (its
   tall edge is a step). ② the test: a bird's wings are the bridge over a gap round a sugar pedestal; a napkin by a
   wall (sail or bird both get you over); its sail also reaches a high ledge on the left with a wisp of steam and a
   hatch (the cloakroom: MATCH THE TEAR). ③ the twist: the last napkin stands half under a low upturned glass: only
   flat does it let Brady in under the rim, and it rises (to a sail, lifting him to the cliff) only once he has crossed
   its centre crease. */
const napkin = (() => {
  const G = mk(192, 18), F = 14;
  G.ground(0, 51, F); G.put(2, 13, '@'); G.put(4, 13, 'n'); G.put(5, 10, '?');
  // ① N1: a sail in the way; its creases at x7-9
  G.put(7, 13, '!'); G.put(8, 13, '$'); G.put(9, 13, '%'); G.put(12, 13, '1');
  G.coins(18, 24, 11); G.put(23, 13, 'r');
  // N2: the only way up the bread block is the sail's edge
  G.put(27, 13, 'N'); G.put(29, 13, '&'); G.put(30, 13, '+'); G.put(31, 13, '='); G.put(33, 13, '2');
  G.ground(38, 47, 8); G.put(42, 5, '*'); G.put(46, 7, 'c'); G.coins(39, 44, 6); G.put(40, 7, 'x');
  // ② N3: the bird's wings over the gap round the sugar pedestal
  G.put(48, 13, ':'); G.put(49, 13, ';'); G.put(50, 13, ',');
  G.pit(52, 57); G.ground(58, 61, F); G.fill(58, F, 61, 17, 'B'); G.pit(62, 67);
  G.put(58, 13, '3'); G.put(60, 8, 'R'); G.coins(55, 64, 8);
  G.ground(68, 94, F); G.put(71, 13, 'c'); G.put(75, 13, 'f'); G.put(68, 13, 'O');
  // N4 by the wall; its sail also reaches the high ledge on the left (steam, the hatch: the secret)
  G.put(80, 13, '('); G.put(81, 13, ')'); G.put(82, 13, '['); G.put(85, 13, '4');
  G.fill(77, 8, 81, 8, '#'); G.put(78, 7, 'D'); G.put(80, 7, 'A'); G.put(79, 7, 'e'); G.put(81, 5, 'P');
  G.ground(91, 94, 8);
  G.ground(95, 154, F); G.put(97, 13, 'j'); G.put(100, 13, 'm'); G.put(104, 10, '?'); G.put(110, 13, 'c'); G.coins(112, 120, 11); G.put(118, 13, 'k'); G.put(128, 13, 'f'); G.put(132, 13, 'w');
  // ③ N5 half under the low glass: flat to get in; it rises once Brady has crossed its centre crease
  G.put(136, 13, 'c'); G.put(138, 13, 'V'); G.put(142, 13, ']'); G.put(143, 13, '{'); G.put(144, 13, '}');
  G.put(146, 11, 'Y'); G.put(150, 13, '5');
  G.ground(155, 191, 9); G.coins(158, 166, 6); G.put(168, 8, 'r'); G.put(176, 8, 'u'); G.put(182, 8, 'G'); G.put(187, 8, 'j');
  G.fill(191, 0, 191, 17, 'H');
  return G.rows();
})();
const NAP = (id, g, form, use, more) => ['piece', 'table.napkin', Object.assign({ id, g, form, use }, more || {})];
const CRE = (id, g, form, sw) => ['piece', 'table.crease', { id, g, form, sw }];
stamps.tabNapkin = {
  floor: 14, rows: napkin, items: ['power', 'power'], gold: { '*': 'must', P: 'hidden', R: 'risky' }, doors: [{ to: 'cloak@in', look: 'tabHatch' }],
  legend: Object.assign({}, COMMON, {
    n: SIGN('A STANDING NAPKIN HAS THREE CREASES: HOP ONTO ONE TO FOLD IT. SAIL, BIRD OR FLAT SQUARE'),
    N: SIGN('A SAIL\'S TALL EDGE IS A STEP. STAND ON IT TO REACH UP HIGH'),
    O: SIGN('A BIRD\'S WINGS ARE A BRIDGE'),
    V: SIGN('UNDER THE GLASS: FLAT TO GET IN. THE NAPKIN RISES ONCE YOU CROSS ITS MIDDLE'),
    '1': NAP('n1', 0, 0, [0, 2], { sail: [1, -5, 2, -1] }), '!': CRE('n1', 0, 0, true), '$': CRE('n1', 0, 1, false), '%': CRE('n1', 0, 2, true),
    '2': NAP('n2', 1, 2, [2, 0], { sail: [1, -3, 2, -1] }), '&': CRE('n2', 1, 0, true), '+': CRE('n2', 1, 1, false), '=': CRE('n2', 1, 2, true),
    '3': NAP('n3', 2, 0, [0, 1], { sail: [1, -5, 2, -1], bird: [[-4, -3, 7, -3], [1, -2, 2, -1]] }), ':': CRE('n3', 2, 0, true), ';': CRE('n3', 2, 1, true), ',': CRE('n3', 2, 2, false),
    '4': NAP('n4', 0, 2, [2, 0], { sail: [1, -3, 2, -1], bird: [[-2, -3, 5, -3], [1, -2, 2, -1]] }), '(': CRE('n4', 0, 0, true), ')': CRE('n4', 0, 1, false), '[': CRE('n4', 0, 2, true),
    '5': NAP('n5', 1, 0, [0, 2], { sail: [3, -5, 4, -1], bird: [[3, -3, 4, -3], [3, -2, 4, -1]], rise: { dx: 3, form: 0 } }), ']': CRE('n5', 1, 0, true), '{': CRE('n5', 1, 1, false), '}': CRE('n5', 1, 2, true),
    e: ['piece', 'table.steam', {}], A: ['anchor', 'b52Back'], Y: ['piece', 'table.glass', { w: 7, h: 9 }],
    f: ['enemy', 'tabPepper'], k: ['enemy', 'tabCrumb'], m: ['enemy', 'tabButter'], r: ['enemy', 'tabRest']
  })
};
stamps.tabCloak = roomStamp('fold@b52Back', ['oneup']);
const L2 = { n: 2, name: 'The Napkin Bird', mapLabel: 'Napkin Bird', arch: 'napkin', theme: 'table_napkin',
  gimmick: 'Standing napkins with three creases on their tails: step on one and the napkin folds to a sail, a bird or a flat square, each with its own edge to stand on',
  hint: 'A sail\'s tall edge is a step up; a bird\'s wings are a bridge; flat lets you walk over. Under the glass it has to be flat, and it rises once you are past its middle',
  postcard: 'The waiter folded my napkin into a swan. It bit Piwi. I have never tipped so much. ♥ C',
  enemies: [['tabRest', 2], ['tabPepper', 2], ['tabCrumb', 1], ['tabButter', 1]],
  mapCell: [1, 1], mapFrom: 0,
  exits: { main: { to: '36-3' } },
  areas: [
    { id: 'fold', gen: 'room', theme: 'table_napkin', stamp: 'tabNapkin', bottomKill: true },
    { id: 'cloak', gen: 'room', role: 'secret', theme: 'table_room_cloak', stamp: 'tabCloak', room: 'tabTear' }
  ] };

/* ---------------- 36-3 Tablecloth Service ----------------
   Floor row 15 (a hollow for each place mat). Hold THROW on a cloth's corner tab and run away from the table; let go
   after three paces and the cloth whips out from under the dishes, uncovering the cork place mat, which springs Brady
   up to the next tier. ① the teach: one table, a wide runway; up onto the first tier. Its far end is a wall with a wisp
   of steam at its foot: a fake panel (walk in) to THE SPARE STAR, whose hatch lets Brady out on the second tier. Down,
   a second table to the second tier. ② the test: a table on the tier with a flea hopping in on the runway; its mat
   springs to the high third tier. ③ the twist: the last table's tall glass wobbles while you pull and topples if you
   hold on past five paces: a short, clean release. */
const cloth = (() => {
  const G = mk(176, 20), F = 15;
  G.ground(0, 19, F); G.put(2, 14, '@'); G.put(4, 14, 'n'); G.put(6, 11, '?'); G.put(15, 14, 'q');
  G.put(10, 14, '1');                                    // T1: corner at x10, cloth x11-18, mat x13-15
  G.ground(20, 40, 9); G.put(25, 8, 'k'); G.put(30, 5, '*'); G.coins(27, 33, 6); G.put(36, 8, 'j');
  // the secret: a fake panel in the first tier's far wall, a hidden doorway behind it, steam at its foot
  G.ground(41, 52, F); G.fill(39, 12, 40, 14, 'F'); G.put(40, 14, 'X'); G.put(42, 14, 'e'); G.put(43, 14, 'A');
  G.put(44, 14, '2');                                    // T2: corner x44, cloth x45-50, mat x46-48
  G.ground(51, 64, 9); G.put(54, 8, 'c'); G.put(52, 8, 'Z');
  // ② on the second tier: a table with a flea hopping in on the runway; its mat springs to the high third tier
  G.put(58, 8, '3');                                     // T3: corner x58 (floor row 9), cloth x59-64, mat x60-62
  G.put(53, 8, 'f'); G.put(61, 1, 'R');
  G.ground(65, 92, 4); G.put(68, 3, 'f'); G.put(76, 0, '?'); G.coins(70, 76, 2); G.put(80, 3, 'm'); G.put(88, 3, 'P'); G.put(84, 3, 'w');
  G.ground(93, 96, 9); G.ground(97, 128, F); G.put(100, 14, 'c'); G.put(106, 14, 'r'); G.put(112, 14, 'm'); G.put(103, 14, 'O');
  // ③ the last table, the tall glass on it
  G.put(118, 14, '4');                                   // T4: corner x118, cloth x119-127, mat x120-122, glass at x124
  G.ground(129, 175, 9); G.put(134, 8, 't'); G.put(144, 8, 'k'); G.put(156, 8, 'G'); G.put(162, 8, 'u'); G.put(168, 8, 'j');
  G.fill(175, 0, 175, 19, 'H');
  return G.rows();
})();
const CL = o => ['piece', 'table.cloth', o];
stamps.tabCloth = {
  floor: 15, rows: cloth, items: ['power', 'power'], gold: { '*': 'must', P: 'hidden', R: 'risky' },
  legend: Object.assign({}, COMMON, {
    n: SIGN('TABLECLOTH SERVICE! HOLD THROW ON THE CLOTH\'S CORNER, RUN AWAY FROM THE TABLE, AND LET GO AFTER THREE PACES'),
    O: SIGN('THE LAST TABLE HAS A TALL GLASS. IT WOBBLES WHILE YOU PULL: A SHORT, CLEAN PULL!'),
    '1': CL({ dir: 1, w: 8, mat: [3, 3], g: 0, dishes: [[2, 'plate'], [6, 'cup'], [7, 'teapot']] }),
    '2': CL({ dir: 1, w: 6, mat: [2, 3], g: 1, dishes: [[1, 'cup'], [5, 'plate']] }),
    '3': CL({ dir: 1, w: 6, mat: [2, 3], g: 2, dishes: [[1, 'plate'], [5, 'teapot']] }),
    '4': CL({ dir: 1, w: 9, mat: [2, 3], g: 0, max: 5, glass: 6, dishes: [[1, 'plate'], [8, 'cup']] }),
    X: ['spawn', 'portal', { kind: 'door', look: 'tourDoorHidden', targetRef: 'stars@in', secretDoor: true }],
    e: ['piece', 'table.steam', {}], A: ['anchor', 'b53Back'], Z: ['anchor', 'b53Out'],
    f: ['enemy', 'tabPepper'], k: ['enemy', 'tabCrumb'], m: ['enemy', 'tabButter'], r: ['enemy', 'tabRest']
  })
};
stamps.tabStars = roomStamp('service@b53Back', ['oneup']);
const L3 = { n: 3, name: 'Tablecloth Service', mapLabel: 'Tablecloth', arch: 'cloth', theme: 'table_service',
  gimmick: 'Hold THROW on the corner of a tablecloth, run, and let go: the cloth whips out from under the dishes and the cork place mat under it springs Brady up to the next tier',
  hint: 'Hold THROW on the corner tab and run away from the table; let go after three paces. The tall glass wobbles if you pull too long: a short, clean pull',
  postcard: 'Brady, a waiter pulled the tablecloth out from under our dinner. The dinner stayed. Piwi did not. ♥ C',
  enemies: [['tabCrumb', 2], ['tabPepper', 2], ['tabButter', 2], ['tabRest', 1]],
  mapCell: [2, 1], mapFrom: 1,
  exits: { main: { to: '36-4' } },
  areas: [
    { id: 'service', gen: 'room', theme: 'table_service', stamp: 'tabCloth', bottomKill: true },
    { id: 'stars', gen: 'room', role: 'secret', theme: 'table_room_sky', stamp: 'tabStars', room: 'tabStar', tabStar: { exit: 'service@b53Out' } }
  ] };

/* ---------------- 36-4 Soup Without the Spoon ----------------
   The banks' tops are row 12, the soup from row 13 down. A crouton raft: stand on its left crust and it paddles right,
   on its right crust and it paddles left, in the middle and it drifts to a stop. ① the teach: a bowl of thin broth (a
   fall is a swim back to the bank). ② the test: a long bowl of hot soup with bubbles that swell, then pop (ride past
   between pops); a sugar ledge over its middle that only the raft passes under (steam, a hatch: WRONG END OF THE
   TELESCOPE, whose hatch lets Brady out past the next bowl); a bowl of two rafts with a crust island between them.
   ③ the twist: in the last bowl a dollop of cream sticks to the left crust, the one that paddles right: hop onto the
   middle and the crouton flips over, cream side round, clean side into the stroke. */
const soup = (() => {
  const G = mk(176, 18), S = 13;
  const bank = (x0, x1, top) => G.ground(x0, x1, top == null ? 12 : top);
  const bowl = (x0, x1, ch) => G.fill(x0, S, x1, 17, ch || 'L');
  bank(0, 9); G.put(2, 11, '@'); G.put(4, 11, 'n'); G.put(6, 8, '?');
  G.fill(10, S, 25, 15, 'W'); G.ground(10, 25, 16); G.put(10, 12, '1');       // R1 in the broth (a shallow bowl)
  bank(26, 35); G.fill(29, 9, 31, 9, 'B'); G.put(30, 6, '*'); G.put(33, 11, 'x');
  bowl(36, 57); G.put(36, 12, '2'); G.put(44, 13, '5'); G.put(52, 13, '6');  // R2, two bubbles
  G.fill(45, 9, 49, 9, '#'); G.put(46, 8, 'D'); G.put(47, 8, 'e'); G.put(48, 8, 'A'); G.coins(45, 49, 7);   // the ledge over the soup (the secret)
  bank(58, 66); G.put(62, 11, 'c'); G.put(64, 11, 'f');
  bowl(67, 95); G.put(67, 12, '3'); G.fill(80, 12, 82, 17, '#'); G.put(81, 11, 'r'); G.put(83, 12, '4'); G.put(76, 13, '7'); G.put(90, 13, '8'); G.put(81, 7, 'R');
  bank(96, 110, 9); G.put(100, 8, 'c'); G.put(98, 8, 'Z'); G.put(104, 5, '?'); G.put(106, 8, 'k'); G.put(108, 8, 'O');
  bowl(111, 144); G.put(111, 12, '9'); G.put(120, 13, '5'); G.put(130, 13, '6'); G.put(139, 13, '7'); G.put(128, 8, 'P');
  bank(145, 175, 10); G.put(150, 9, 'm'); G.put(158, 9, 'j'); G.put(166, 9, 'G'); G.put(171, 9, 'u');
  G.fill(175, 0, 175, 17, 'H');
  return G.rows();
})();
const RF = o => ['piece', 'table.raft', o];
const BUB = (period, phase) => ['piece', 'table.bubble', { period, phase }];
stamps.tabSoup = {
  floor: 13, rows: soup, items: ['power', 'power'], gold: { '*': 'must', P: 'hidden', R: 'risky' }, doors: [{ to: 'scope@in', look: 'tabHatch' }],
  legend: Object.assign({}, COMMON, {
    n: SIGN('A CROUTON RAFT! STAND ON ITS LEFT CRUST AND IT PADDLES RIGHT, ON ITS RIGHT CRUST AND IT PADDLES LEFT. THE MIDDLE STOPS IT'),
    O: SIGN('CREAM ON A CRUST AND THAT CRUST WON\'T PADDLE. HOP ONTO THE MIDDLE AND THE CROUTON FLIPS OVER'),
    '1': RF({ w: 3, span: 13 }), '2': RF({ w: 3, span: 19 }), '3': RF({ w: 3, span: 10 }), '4': RF({ w: 3, span: 10 }), '9': RF({ w: 3, span: 31, cream: -1 }),
    '5': BUB(3.4, 0), '6': BUB(3.4, 1.7), '7': BUB(3.0, 0.8), '8': BUB(3.0, 2.2),
    e: ['piece', 'table.steam', {}], A: ['anchor', 'b54Back'], Z: ['anchor', 'b54Out'],
    f: ['enemy', 'tabPepper'], k: ['enemy', 'tabCrumb'], m: ['enemy', 'tabButter'], r: ['enemy', 'tabRest']
  })
};
stamps.tabScope = roomStamp('bowls@b54Back', ['oneup']);
const L4 = { n: 4, name: 'Soup Without the Spoon', mapLabel: 'Soup', arch: 'crouton', theme: 'table_soup',
  gimmick: 'Crouton rafts in thick soup: walk to one crust and the crouton paddles the other way. A dollop of cream stops a crust paddling: flip the crouton over',
  hint: 'Left crust goes right, right crust goes left, the middle stops. Ride past the bubbles between pops. Cream on a crust? Hop onto the middle to turn it over',
  postcard: 'Brady, I ordered the soup and they brought me a crouton with a little oar. I let it row me home. ♥ C',
  enemies: [['tabPepper', 1], ['tabRest', 1], ['tabCrumb', 1], ['tabButter', 1]],
  mapCell: [3, 1], mapFrom: 2,
  exits: { main: { to: '36-5' } },
  areas: [
    { id: 'bowls', gen: 'room', theme: 'table_soup', stamp: 'tabSoup', bottomKill: true, waterLook: 'broth' },
    { id: 'scope', gen: 'room', role: 'secret', theme: 'table_room_scope', stamp: 'tabScope', room: 'tabScope', tabScope: { exit: 'bowls@b54Out' } }
  ] };

/* ---------------- 36-5 After You (Madame Manners) ----------------
   The lead-in: four places along the dessert end of the table, a tall napkin ring between each. At each place the
   hostess (Madame Manners at her own end, smaller) offers Brady the last bite: stand on the bread plate's mark and tap
   THROW while she offers, and the plate slides to her; she accepts and the ring lifts. At dessert (the fourth place)
   she offers twice, and only the second offer lets go. The door at the end is the booth. Past it the table runs on a
   little way: steam rises from a gap in the cloth, down to the pantry under the table (PULL TO ENTER), whose door
   brings Brady back up beside the booth's door: every finale room can be entered before the boss. */
const course = (() => {
  const G = mk(124, 22), F = 14;
  G.ground(0, 123, F); G.put(2, 13, '@'); G.put(4, 13, 'n'); G.put(6, 10, '?');
  G.put(10, 13, '1'); G.coins(20, 25, 11); G.put(24, 13, 'k'); G.put(27, 13, 'c');
  G.put(31, 13, '2'); G.put(31, 9, '*'); G.put(42, 10, '?'); G.put(45, 13, 'f');
  G.put(50, 13, '3'); G.put(61, 13, 'm'); G.put(64, 9, 'R'); G.put(66, 13, 'c');
  G.put(70, 13, '4'); G.put(84, 13, 'w'); G.put(88, 13, 'j');
  G.put(90, 13, 'A'); G.put(92, 13, 'D'); G.put(96, 13, 'u'); G.put(100, 13, 'x');
  // past the booth's door: a gap in the cloth with steam rising out of it; the pantry corridor under the table
  G.fill(96, 15, 112, 19, '.'); G.fill(104, 14, 105, 14, '.'); G.put(103, 13, 'e'); G.put(99, 19, 'E'); G.put(108, 18, 'P');
  G.fill(123, 0, 123, 21, 'H');
  return G.rows();
})();
const PLACE = (id, more) => ['piece', 'table.place', Object.assign({ id, hx: 8, gx: 4, gh: 5 }, more || {})];
stamps.tabCourse = {
  floor: 14, rows: course, items: ['power', 'power'], gold: { '*': 'must', P: 'hidden', R: 'risky' }, doors: [{ to: 'booth@in', look: 'tabDoor' }],
  legend: Object.assign({}, COMMON, {
    n: SIGN('AFTER YOU! WHEN THE HOSTESS OFFERS THE LAST BITE, STAND ON THE BREAD PLATE AND TAP THROW TO PASS IT TO HER'),
    '1': PLACE('p1', { phase: 0 }), '2': PLACE('p2', { phase: 0.4 }), '3': PLACE('p3', { phase: 0.8 }), '4': PLACE('p4', { feint: true, phase: 0.2 }),
    E: ['spawn', 'portal', { kind: 'door', look: 'tabHatch', targetRef: 'pantry@in' }],
    e: ['piece', 'table.steam', {}], A: ['anchor', 'b55Back'],
    f: ['enemy', 'tabPepper'], k: ['enemy', 'tabCrumb'], m: ['enemy', 'tabButter'], r: ['enemy', 'tabRest']
  })
};
stamps.tabPantry = roomStamp('courses@b55Back', ['oneup']);
const L5 = { n: 5, name: 'After You', mapLabel: 'After You', arch: 'lair', theme: 'table_dessert', boss: 'table_manners',
  gimmick: 'The hostess offers Brady the last bite: pass the bread plate back to her (THROW on its mark) and she lets him on to the next place. Then the booth, and Madame Manners',
  hint: 'Tap THROW on the bread plate\'s mark while she offers. At dessert only her second offer lets go. In the booth every courtesy is THROW from a saucer: the bread, from her open side, and the olive when her tines spread',
  postcard: 'BRADY. The fork finally ate. We have the booth. You have the bill. Best dinner of my life. ♥ C',
  enemies: [['tabCrumb', 1], ['tabPepper', 1], ['tabButter', 1]],
  mapCell: [4, 1], mapFrom: 3,
  exits: { main: {} },
  areas: [
    { id: 'courses', gen: 'room', theme: 'table_dessert', stamp: 'tabCourse', bottomKill: true },
    { id: 'pantry', gen: 'room', role: 'secret', theme: 'table_room_pantry', stamp: 'tabPantry', room: 'tabPull' },
    { id: 'booth', gen: 'arena', role: 'arena', layout: 'booth', arenaW: 26, H: 18, roof: false, theme: 'table_booth' }
  ] };


Tour.amend('table', { stamps, levels: [L1, L2, L3, L4, L5] });
Object.assign(TourLandscape.ARCH_LABEL, { china: 'CHINA', napkin: 'NAPKIN', cloth: 'CLOTH', crouton: 'CROUTON' });
Tour.tableLevels = { mk, stamps, roomStamp, SIGN, COMMON };

/* ---------------- the land's map: a candlelit table for two, its cloth, its places ---------------- */
// the way in (the strip) at the left end of the table; the good china, the napkins, the long service, the soup
// bowls; the booth at the far end (the port)
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.table = {
  labels: { '36-1': 'Good China', '36-2': 'Napkin Bird', '36-3': 'Tablecloth', '36-4': 'Soup', '36-5': 'After You' },
  w: 1520, h: 760,
  pal: { sea: '#2a1420', deep: '#14060c', land: '#fbf3e4', light: '#ffffff', path: '#f2c23a', beach: '#f2e2c4', cliff: '#b82a26', roof: '#e0403a', wall: '#ffffff' },
  sea: 'stars', coast: 'tabCloth', tufts: 'none', trail: 'sparkle', bridge: 'steps', meadow: false, woods: false, foam: false, birds: false,
  land: [[[160, 300], [240, 170], [520, 120], [900, 110], [1200, 140], [1380, 240], [1400, 420], [1320, 580], [1060, 640], [700, 650], [380, 620], [190, 500]]],
  nodes: { start: [260, 420, 's'], '36-1': [420, 300, 'n'], '36-2': [700, 220, 'n'], '36-3': [980, 260, 'n'], '36-4': [1100, 470, 's'], '36-5': [780, 520, 's'], port: [560, 540] },
  paths: { 'start>36-1': [[320, 380]], '36-1>36-2': [[560, 250]], '36-2>36-3': [[840, 220]], '36-3>36-4': [[1080, 360]], '36-4>36-5': [[940, 520]], '36-5>port': [[660, 540]] },
  feat: [
    ['sprite', 'tabCandleSprite', 1240, 300, 30], ['sprite', 'tabGlassSprite', 330, 220, 36], ['sprite', 'tabSugarSprite', 860, 580, 24],
    ['sprite', 'tabBowlSprite', 1220, 560, 40], ['sprite', 'tabForkSprite', 600, 380, 26]
  ],
  flora: ['rock'], density: 0,
  live: [['blink', 1240, 260, '#ffd890'], ['blink', 780, 480, '#ff8a9a']]
};
})();
