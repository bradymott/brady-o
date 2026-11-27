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

Tour.amend('table', { stamps, levels: [L1] });
Tour.tableLevels = { mk, stamps, roomStamp, SIGN, COMMON };
})();
