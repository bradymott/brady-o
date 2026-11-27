/* ============================================================
   FOLEY BEACH: the levels (world 29) and the land's map. A hidden land at about Nepal's difficulty (d0 0.8): every
   stage teaches its idea where a slip costs nothing, tests it with the land's critters, then twists it.
   29-1 MADE YOU LOOK (clack)        strike a hollow prop: the nosy shell flock rushes to sit on it, clearing its patch.
   29-2 THE QUIET CUT (damper)       hold THROW: the felt damper lays a rattling tin panel flat; walk it across.
   29-3 COCONUT UNDERSTUDY (understudy) pick the prop that fits the silent picture and play it as the foot lands;
                                     the prop-lifting cargo net to climb, up and round the crabs.
   29-4 SOUND GOES ROUND (trumpet)   aim the speaking trumpet, puff into the front of a hinged ear: it opens a landing.
   29-5 CUT THE TAKE (take)          hold THROW from the band's start on the picture strip, let go at its end.
   29-6 A STORM OF HIS OWN MAKING (lair) the mic and the machines, then Mr. Thunder.
   The secret rooms (B16-B20, then Rain for One) are one per stage; the land's tell for a hidden way is a thin
   trickle of sand out of a gap (foleySand). Stamps are drawn with a small grid helper (mk) so coordinates stay exact.
   ============================================================ */
(function () {
const C = Tour.countries.foley;
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
const roomStamp = (back, items) => ({ floor: 12, rows: ['############################', '#..........................#', '#.........................?#', '#..........................#'].concat(Array.from({ length: 7 }, () => '#..........................#')).concat(['#.@.D......................#', '############################', '############################']), items, doors: [{ to: back, look: 'foleyHatch' }] });
const SIGN = text => ['spawn', 'sign', { text }];
const COMMON = { l: ['enemy', 'foleyClam'], k: ['enemy', 'foleyKettle'], r: ['enemy', 'foleyRay'], m: ['enemy', 'foleyCrab'], e: ['piece', 'foley.sand', {}], E: ['piece', 'foley.sand', { up: true }] };
const PROP = (pid, kind) => ['piece', 'foley.prop', { pid, kind }];
const FLOCK = (id, w, h, size, props, at, skip) => ['piece', 'foley.flock', { id, w, h, size, props, at, skip }];

/* ---------------- 29-1 Made You Look ----------------
   Floor row 14 (18 rows). ① the teach: under the boardwalk's low canopy a heap of nosy shells fills the way; a
   hollow log on a post just before it: strike it and they all rush back to sit on it. ② the test: a heap sitting on
   the springboard in a hollow (the only way up the sea wall); a heap in a tunnel whose prop (a wood block) stands up
   on the canopy's roof, a Boom Crab in the tunnel that comes running to every noise. In the tunnel a thin trickle of
   sand falls from a gap in its ceiling: hop up through it to a cubby and the hatch to THE TRIM SHOP (B16), which lets
   Brady out further along. ③ the twist: a mixed heap (little shells and big ones) with a wood block (high CLACK: the
   little ones come) and a tom (low THUMP: the big ones come); then a second mixed heap where the block is up on the
   canopy and the tom down by the door. */
const look = (() => {
  const G = mk(206, 18), F = 14;
  G.ground(0, 13, F); G.put(2, 13, '@'); G.put(4, 13, 'n'); G.put(7, 10, '?');
  // ① the teach: the canopy, the log, the heap
  G.ground(14, 44, F); G.fill(14, 6, 40, 9, 'H');
  G.put(17, 13, 'a');                                       // the log (pid t1)
  G.put(23, 13, 'A');                                       // heap 1: x23-24, rows 10-13
  G.coins(27, 35, 12); G.put(33, 13, 'l');
  // open beach, a gap with P1 over it
  G.pit(45, 48); G.ground(49, 64, F); G.put(46, 9, '*'); G.coins(45, 48, 11); G.put(55, 13, 'k'); G.put(60, 13, 'N');
  // ② the hollow with the springboard; the heap on it; the sea wall
  G.put(63, 13, 'j');                                       // the log (pid t2) on the lip
  G.pit(65, 70); G.ground(65, 70, 16); G.put(68, 15, 's');
  G.put(67, 15, 'M');                                       // heap 2: x67-69, rows 14-15 (over the spring)
  G.ground(71, 88, 9); G.coins(74, 84, 6); G.put(80, 8, 'l'); G.put(86, 5, '?');
  G.ground(89, 108, F); G.put(92, 13, 'c'); G.put(98, 13, 'r');
  // the tunnel: its prop (a block) up on the canopy roof, reached by two plank steps
  G.put(101, 11, '-----'); G.put(104, 8, '---');
  G.ground(108, 140, F); G.fill(108, 7, 122, 9, 'H');
  G.put(112, 6, 'd');                                       // the block (pid t3) on the canopy's roof
  G.put(116, 13, 'X');                                      // heap 3: x116-117, rows 10-13
  G.put(120, 13, 'm');
  // the secret: the tall canopy over the far end of the tunnel, a gap in its ceiling with sand trickling out of it, a
  // step block under it, a cubby above with the hatch (and P2)
  G.fill(123, 2, 133, 9, 'H'); G.fill(125, 5, 131, 8, '.'); G.fill(126, 9, 127, 9, '.'); G.put(126, 9, 'e');
  G.fill(125, 12, 125, 13, 'H'); G.put(130, 8, 'D'); G.put(128, 8, 'p'); G.put(129, 6, 'P');
  G.coins(134, 138, 12);
  G.put(142, 13, 'Z');                                       // anchor: out of the room (past the tunnel)
  G.ground(141, 206, F); G.put(146, 13, 'c'); G.put(150, 10, '?');
  // ③ the twist: the mixed heap, the block and the tom
  G.put(153, 13, 'O'); G.put(156, 13, 'f'); G.put(158, 13, 'q');   // the block (pid t4), the tom (pid t5)
  G.fill(161, 6, 176, 9, 'H'); G.put(166, 13, 'J'); G.put(168, 13, 'K');   // the little shells x166-167, the big x168-169
  G.put(172, 12, 'R'); G.put(174, 13, 'k');
  // the last one: the tom by the door, the block up on the canopy (two plank steps up)
  G.put(180, 13, 't'); G.put(181, 11, '---'); G.put(184, 8, '---');
  G.fill(187, 6, 201, 9, 'H'); G.put(190, 5, 'i');           // the tom (pid t6) on the ground, the block (pid t7) on the roof
  G.put(194, 13, 'U'); G.put(196, 13, 'V');                  // the little shells x194-195, the big x196-197
  G.put(203, 13, 'G'); G.fill(205, 0, 205, 17, 'H');
  return G.rows();
})();
stamps.foleyLook = {
  floor: 14, rows: look, items: ['oneup', 'power', 'power'], gold: { '*': 'must', P: 'hidden', R: 'risky' }, doors: [{ to: 'trim@in', look: 'foleyHatch' }],
  legend: Object.assign({}, COMMON, {
    n: SIGN('NOSY SHELLS! STAND AT A HOLLOW PROP AND TAP THROW: THEY ALL RUSH OVER TO SIT ON IT'),
    N: SIGN('EVERY NOISE HAS A PICTURE: WATCH THE RINGS. A BOOM CRAB RUNS TO THE LOUDEST ONE'),
    O: SIGN('LITTLE SHELLS COME TO A HIGH CLACK (SMALL QUICK RINGS). BIG ONES TO A LOW THUMP (WIDE SLOW RINGS)'),
    a: PROP('t1', 'log'), j: PROP('t2', 'log'), d: PROP('t3', 'block'), f: PROP('t4', 'block'), q: PROP('t5', 'drum'), t: PROP('t6', 'drum'), i: PROP('t7', 'block'),
    A: FLOCK('f1', 2, 4, 'any', ['t1'], [[-6, 0]]),
    M: FLOCK('f2', 3, 2, 'any', ['t2'], [[-4, -2]], [[1, 0]]),   // (round the springboard)
    X: FLOCK('f3', 2, 4, 'any', ['t3'], [[-4, -7]]),
    J: FLOCK('f4', 2, 4, 'small', ['t4'], [[-10, 0]]), K: FLOCK('f5', 2, 4, 'big', ['t5'], [[-10, 0]]),
    U: FLOCK('f6', 2, 4, 'small', ['t7'], [[-4, -8]]), V: FLOCK('f7', 2, 4, 'big', ['t6'], [[-16, 0]]),
    p: ['anchor', 'b16Back'], Z: ['anchor', 'b16Out']
  })
};
stamps.foleyTrim = roomStamp('beach@b16Back', ['oneup']);
const L1 = { n: 1, name: 'Made You Look', mapLabel: 'Made You Look', arch: 'clack', theme: 'foley_look',
  gimmick: 'Strike a hollow prop with THROW and the nosy shell flock heaped on the beach rushes over to sit on it, clearing the patch. Little shells come to a high clack, big ones to a low thump',
  hint: 'Stand at a prop and tap THROW. Small quick rings: a high CLACK, for the little shells. Wide slow rings: a low THUMP, for the big ones. Sand trickles where something is hidden...',
  postcard: 'Brady, the shells here are SO nosy. I dropped a spoon and forty of them sat on it. ♥ C',
  enemies: [['foleyClam', 2], ['foleyKettle', 2], ['foleyRay', 1], ['foleyCrab', 1]],
  mapCell: [0, 1], mapFrom: -1,
  exits: { main: { to: '29-2' } },
  areas: [
    { id: 'beach', gen: 'room', theme: 'foley_look', stamp: 'foleyLook', bottomKill: true },
    { id: 'trim', gen: 'room', role: 'secret', theme: 'foley_room_cork', stamp: 'foleyTrim', room: 'foleyTrim', foleyTrim: { exit: 'beach@b16Out' } }
  ] };

Tour.foleyLevels = { mk, stamps, roomStamp, SIGN, COMMON, levels: [L1] };
Tour.amend('foley', { stamps, levels: [L1] });
Object.assign(TourLandscape.ARCH_LABEL, { clack: 'CLACK', damper: 'DAMPER', understudy: 'UNDERSTUDY', trumpet: 'TRUMPET', take: 'TAKE' });

/* ---------------- the land's map: the boardwalk behind Piwi's seaside show ---------------- */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.foley = {
  labels: { '29-1': 'Made You Look', '29-2': 'Quiet Cut', '29-3': 'Understudy', '29-4': 'Goes Round', '29-5': 'Cut the Take', '29-6': 'Storm' },
  w: 1520, h: 760,
  pal: { sea: '#2a6a84', deep: '#14405a', land: '#f0d090', light: '#fff0c0', path: '#7a2236', beach: '#f6e0a8', cliff: '#7a2236', roof: '#2e6a80', wall: '#f6ecd6' },
  sea: 'waves', coast: 'foleyBoards', tufts: 'none', trail: 'dots', bridge: 'steps', meadow: false, woods: false, foam: true, birds: true,
  land: [[[120, 230], [260, 150], [520, 120], [760, 170], [980, 120], [1260, 150], [1420, 260], [1400, 420], [1260, 520], [1300, 640], [1100, 690], [820, 650], [560, 690], [330, 620], [180, 520], [100, 380]]],
  nodes: { start: [220, 330, 's'], '29-1': [380, 250, 'n'], '29-2': [640, 220, 'n'], '29-3': [930, 230, 'n'], '29-4': [1220, 300, 'e'], '29-5': [1080, 520, 's'], '29-6': [720, 560, 's'], port: [440, 560] },
  paths: { 'start>29-1': [[290, 280]], '29-1>29-2': [[510, 220]], '29-2>29-3': [[790, 200]], '29-3>29-4': [[1100, 240]], '29-4>29-5': [[1200, 440]], '29-5>29-6': [[900, 560]], '29-6>port': [[580, 580]] },
  feat: [
    ['sprite', 'foleyTinSprite', 1300, 420, 30], ['sprite', 'foleyShellSprite', 300, 450, 22], ['sprite', 'foleyCoconutSprite', 820, 330, 24],
    ['sprite', 'foleyTrumpetSprite', 1330, 220, 26], ['sprite', 'foleyShellSprite', 1000, 620, 18]
  ],
  flora: ['palm'], density: 0.2,
  live: [['blink', 720, 520, '#f6ecd6'], ['blink', 1220, 260, '#ffd84a']]
};
})();
