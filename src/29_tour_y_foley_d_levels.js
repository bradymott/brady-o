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
    // scenery along a floor row: a letter every `step` tiles where the cell is free and stands on ground
    dress(F, step, letters) { let k = 0; for (let x = 6; x < W - 4; x += step) { if (g[F - 1][x] === '.' && g[F][x] === '#' && g[F - 1][x - 1] === '.' && g[F - 1][x + 1] === '.') g[F - 1][x] = letters[k++ % letters.length]; } return o; },
    rows() { return g.map(r => r.join('')); }
  };
  return o;
};
const stamps = {};
// a secret room's old stamp (TourRooms keeps its door back and its prize boxes): '@', 'D', the prize '?'
const roomStamp = (back, items) => ({ floor: 12, rows: ['############################', '#..........................#', '#.........................?#', '#..........................#'].concat(Array.from({ length: 7 }, () => '#..........................#')).concat(['#.@.D......................#', '############################', '############################']), items, doors: [{ to: back, look: 'foleyHatch' }] });
const SIGN = text => ['spawn', 'sign', { text }];
const COMMON = { x: ['decor', 'foleyGrass'], z: ['decor', 'foleyLamp'], l: ['enemy', 'foleyClam'], k: ['enemy', 'foleyKettle'], r: ['enemy', 'foleyRay'], m: ['enemy', 'foleyCrab'], e: ['piece', 'foley.sand', {}], E: ['piece', 'foley.sand', { up: true }] };
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
  G.dress(14, 9, 'x');
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

/* ---------------- 29-2 The Quiet Cut ----------------
   Floor row 14. Each tin panel hangs over a gap, rattling (a jagged ripple: nothing to stand on). Hold THROW at its
   near end and the felt damper presses it flat; keep holding and the felt slides along under Brady: walk it across.
   ① the teach: a short panel over a shallow dip (fall in, climb out), then one over a real gap. ② the test: a long
   panel with a Rubbersole Ray tiptoeing up on the far side; a panel high between two ledges; a little hut whose
   front wall has sand puffing at its foot (a false panel: walk in) to THE TIN CUPBOARD (B17). ③ the twist: the last
   panel throws two humps that run toward each other: tap THROW as they meet under the hanging damper and it catches
   both (the panel lies flat for good). Then one more long one with a Hiss Kettle waiting on the far side. */
const quiet = (() => {
  const G = mk(204, 18), F = 14;
  G.ground(0, 15, F); G.put(2, 13, '@'); G.put(4, 13, 'n'); G.put(7, 10, '?');
  // ① the teach: a panel over a shallow dip
  G.pit(16, 21); G.ground(16, 21, 16); G.put(16, 14, '1');
  G.ground(22, 29, F); G.put(24, 13, 'N');
  G.pit(30, 37); G.put(30, 14, '2'); G.put(33, 9, '*'); G.coins(31, 36, 11);
  G.ground(38, 50, F); G.put(44, 13, 'k'); G.put(48, 13, 'c');
  // ② the long panel, a ray on the far side; the high panel between two ledges
  G.pit(51, 60); G.put(51, 14, '3'); G.coins(52, 59, 11);
  G.ground(61, 70, F); G.put(66, 13, 'r');
  G.ground(71, 72, 11); G.pit(73, 80); G.put(73, 11, '4'); G.ground(81, 84, 11); G.coins(74, 79, 8);
  G.ground(85, 120, F); G.put(88, 13, 'l');
  // the hut: plank steps up onto its roof; its front panel is false, sand puffing at its foot; the nook, the hatch, P2
  G.put(90, 11, '----'); G.fill(95, 10, 100, 13, 'H'); G.fill(96, 11, 99, 13, '.'); G.fill(95, 11, 95, 13, 'F');
  G.put(94, 13, 'E'); G.put(98, 13, 'D'); G.put(92, 13, 'p'); G.put(97, 11, 'P');
  G.put(108, 13, 'c'); G.put(112, 10, '?'); G.put(116, 13, 'r');
  // ③ the twist: the two humps that meet in the middle
  G.ground(121, 140, F); G.put(126, 13, 'O'); G.put(132, 13, 'k');
  G.pit(141, 154); G.put(141, 14, '5'); G.put(147, 9, 'R');
  G.ground(155, 170, F); G.put(160, 13, 'r'); G.put(164, 13, 'c');
  G.pit(171, 182); G.put(171, 14, '6'); G.coins(172, 181, 11);
  G.ground(183, 203, F); G.put(188, 13, 'k'); G.put(199, 13, 'G'); G.fill(203, 0, 203, 17, 'H');
  G.dress(14, 9, 'x');
  return G.rows();
})();
const PANEL = (n, more) => ['piece', 'foley.panel', Object.assign({ n }, more || {})];
stamps.foleyQuiet = {
  floor: 14, rows: quiet, items: ['power', 'power'], gold: { '*': 'must', P: 'hidden', R: 'risky' }, doors: [{ to: 'tins@in', look: 'foleyHatch' }],
  legend: Object.assign({}, COMMON, {
    n: SIGN('A RATTLING TIN PANEL: YOU CAN\'T STAND ON IT. HOLD THROW AT ITS END: THE FELT DAMPER PRESSES IT FLAT'),
    N: SIGN('KEEP HOLDING THROW AND WALK: THE FELT SLIDES ALONG UNDER YOU. LET GO AND IT STARTS TO RATTLE AGAIN'),
    O: SIGN('TWO HUMPS RUN TOWARD EACH OTHER. TAP THROW WHEN THEY MEET UNDER THE HANGING DAMPER'),
    '1': PANEL(6), '2': PANEL(8), '3': PANEL(10), '4': PANEL(8), '5': PANEL(14, { meet: true }), '6': PANEL(12),
    p: ['anchor', 'b17Back']
  })
};
stamps.foleyTins = roomStamp('cut@b17Back', ['oneup']);
const L2 = { n: 2, name: 'The Quiet Cut', mapLabel: 'Quiet Cut', arch: 'damper', theme: 'foley_quiet',
  gimmick: 'Tin panels rattle over the gaps (a jagged ripple: nothing to stand on). Hold THROW and the felt damper presses one flat; keep holding and walk it across',
  hint: 'Hold THROW at a panel\'s end until it lies flat, then keep holding as you walk. When two humps run at each other, tap THROW as they meet under the hanging damper',
  postcard: 'Brady, the weather here is a sheet of tin. I put a cushion on it. Now it is a very small breeze. ♥ C',
  enemies: [['foleyKettle', 3], ['foleyRay', 3], ['foleyClam', 1]],
  mapCell: [1, 1], mapFrom: 0,
  exits: { main: { to: '29-3' } },
  areas: [
    { id: 'cut', gen: 'room', theme: 'foley_quiet', stamp: 'foleyQuiet', bottomKill: true },
    { id: 'tins', gen: 'room', role: 'secret', theme: 'foley_room_booth', stamp: 'foleyTins', room: 'foleyLids' }
  ] };

/* ---------------- 29-3 Coconut Understudy ----------------
   Floor row 16 (20 rows), backstage of Piwi's seaside show. Each bank of fixed props stands before a silent
   flipbook on a tall screen that blocks the way: THROW at the bank takes it, the stick picks a prop, THROW plays it.
   Play the noise that fits the picture when its foot lands (the picture flashes, a dust puff, the beat dot reaches
   the mark), twice, and the screen rolls up. ① the teach: a horse (the coconuts). ② the test: a duck (the rubber
   duck), a Boom Crab that runs to every noise; then the prop-lifting cargo net over the scenery dock: push UP into
   it to grip, climb in all four directions, and at a brass collar JUMP to swing round to the far side of the ropes;
   crabs clamber on each side. Up at the net's top, sand trickles out of a gap in the loft floor: jump up through it
   to the flies and the door to THE NET LOFT (B18), which lets Brady out further along. ③ the twist: the horse twice,
   then a wooden hobbyhorse: the coconuts, then the single wood block. */
const under = (() => {
  const G = mk(200, 20), F = 16;
  G.ground(0, 61, F); G.put(2, 15, '@'); G.put(4, 15, 'n'); G.put(7, 12, '?');
  // ① the teach bank (x12-14) and its screen (x17)
  G.put(12, 15, 'a'); G.put(26, 11, '*'); G.coins(22, 28, 13); G.put(24, 15, 'r');
  // ② the duck bank (x32-34), its screen (x37), a Boom Crab
  G.put(31, 15, 'N'); G.put(32, 15, 'j'); G.put(43, 15, 'm'); G.put(48, 15, 'c');
  // the cargo net over the scenery dock (x60-73, rows 6-15); the dock's soft floor (row 19) and steps back up
  G.pit(62, 73); G.ground(62, 73, 19); G.ground(62, 62, 18); G.put(56, 15, 'O');
  G.put(60, 7, 'u'); G.put(71, 5, 'w'); G.put(67, 7, '!'); G.put(66, 13, '$');
  G.ground(74, 80, 9); G.fill(74, 9, 74, 19, '#');
  // the loft over the net: its floor (row 6) has a gap at x71-72 with sand trickling out; the flies above, the door
  // (the net's lifting ropes run on up through the gap: jump from the net's top and grab them)
  G.fill(56, 0, 84, 2, 'H'); G.fill(56, 6, 84, 6, 'H'); G.fill(56, 3, 65, 5, 'H'); G.fill(83, 3, 84, 5, 'H');
  G.fill(71, 6, 72, 6, '.'); G.put(71, 6, 'e'); G.put(81, 5, 'D'); G.put(79, 5, 'p'); G.put(76, 4, 'P'); G.coins(73, 77, 5);
  G.put(69, 8, 'R');
  G.ground(81, 199, F); G.put(86, 15, 'l'); G.put(92, 15, 'Z'); G.put(100, 15, 'c'); G.put(104, 12, '?');
  // ③ the twist bank (x120-123), its screen (x127)
  G.put(112, 15, 'k'); G.put(118, 15, 'V'); G.put(120, 15, 'd'); G.put(134, 15, 'r'); G.put(140, 15, 'k');
  G.put(150, 15, 'c'); G.pit(158, 161); G.put(162, 13, '----'); G.pit(166, 169); G.put(172, 15, 'm'); G.put(180, 15, 'r');
  G.put(194, 15, 'G'); G.fill(199, 0, 199, 19, 'H');
  G.dress(16, 9, 'z');
  return G.rows();
})();
const BANK = (id, props, pics, more) => ['piece', 'foley.bank', Object.assign({ id, props, pics, sx: props.length + 3, sh: 6 }, more || {})];
stamps.foleyUnder = {
  floor: 16, rows: under, items: ['power', 'power'], gold: { '*': 'must', P: 'hidden', R: 'risky' }, doors: [{ to: 'loft@in', look: 'foleyHatch' }],
  legend: Object.assign({}, COMMON, {
    n: SIGN('THE SILENT PICTURES NEED NOISES. THROW AT THE BANK TAKES IT: STICK PICKS A PROP, THROW PLAYS IT, AS THE FOOT LANDS'),
    N: SIGN('WHAT DOES A DUCK\'S FOOT SOUND LIKE? PICK, THEN PLAY IT ON THE LANDING. JUMP LETS GO OF THE BANK'),
    O: SIGN('THE CARGO NET: PUSH UP TO GRIP, CLIMB ANY WAY. AT A BRASS COLLAR, JUMP TO SWING ROUND TO THE FAR SIDE'),
    V: SIGN('A HORSE... THEN A HOBBYHORSE. IT IS WOOD, NOT A HORSE'),
    a: BANK('u1', ['coconut', 'block', 'squeak'], ['horse', 'horse']),
    j: BANK('u2', ['coconut', 'squeak', 'sponge'], ['duck', 'duck']),
    d: BANK('u3', ['coconut', 'block', 'squeak', 'sponge'], ['horse', 'horse', 'hobby']),
    u: ['piece', 'foley.net', { w: 14, h: 9, holes: [[5, 5], [10, 2]] }], w: ['piece', 'foley.net', { w: 2, h: 2, holes: [], lift: true }],
    '!': ['piece', 'foley.netcrab', { face: 0, ay: 8, speed: 1.4 }], '$': ['piece', 'foley.netcrab', { face: 1, ax: 6, speed: 1.0, phase: 0.5 }],
    p: ['anchor', 'b18Back'], Z: ['anchor', 'b18Out']
  })
};
stamps.foleyLoft = roomStamp('stage@b18Back', ['oneup']);
const L3 = { n: 3, name: 'Coconut Understudy', mapLabel: 'Understudy', arch: 'understudy', theme: 'foley_under',
  gimmick: 'Silent flipbooks block the way backstage. Take the bank of props, pick the noise that fits the picture and play it as the foot lands. And the prop-lifting cargo net to climb',
  hint: 'Stick picks, THROW plays, JUMP lets go. Watch for the flash and the dust puff: that is the foot landing. On the net, push UP to grip; JUMP at a brass collar to swing round the back',
  postcard: 'Brady, the horse in the show is two coconuts and a very confident man. He has an agent. ♥ C',
  enemies: [['foleyRay', 3], ['foleyCrab', 2], ['foleyKettle', 2], ['foleyClam', 1]],
  mapCell: [2, 1], mapFrom: 1,
  exits: { main: { to: '29-4' } },
  areas: [
    { id: 'stage', gen: 'room', theme: 'foley_under', stamp: 'foleyUnder', bottomKill: true },
    { id: 'loft', gen: 'room', role: 'secret', theme: 'foley_room_nets', stamp: 'foleyLoft', room: 'foleyPerch', foleyPerch: { exit: 'stage@b18Out' } }
  ] };

/* ---------------- 29-4 Sound Goes Round ----------------
   Floor row 16, the sea cliffs. THROW at a speaking trumpet takes it; the stick aims (the dotted line shows where the
   puff will go, bounces and all; a green ring: it will reach an ear's front, red: its back); THROW sends the puff.
   A puff into the FRONT of a hinged ear makes it fold down into a landing. ① the teach: one ear on a pillar in a
   chasm. ② the test: an ear up on a cliff (aim high) whose landing is the step up; two ears in a row over a long
   chasm. A high ledge with sand trickling off its lip has its own ear: open it and climb to the door of THE CUE
   OFFICE (B19). ③ the twist: the last ear faces away from the trumpet: bounce the puff off two tin platters, round
   and into its front. */
const round = (() => {
  const G = mk(204, 20), F = 16;
  G.ground(0, 16, F); G.put(2, 15, '@'); G.put(4, 15, 'n'); G.put(7, 12, '?'); G.put(12, 15, 'a');
  // ① the teach: the ear on the pillar (x23), its landing x19-22
  G.pit(17, 28); G.ground(23, 24, 14); G.put(23, 13, 'A'); G.put(21, 9, '*');
  G.ground(29, 62, F); G.put(33, 15, 'k'); G.put(37, 15, 'N'); G.put(40, 15, 'i');
  // ② the cliff: a plank, the ear on the cliff's lip (x52) whose landing (x49-51) is the step up
  G.put(45, 13, '---'); G.ground(52, 62, 10); G.put(52, 9, 'K'); G.put(58, 9, 'k'); G.put(60, 9, 'c'); G.coins(53, 57, 7);
  G.ground(63, 75, F); G.put(68, 15, 'r'); G.ground(73, 75, 14); G.put(74, 13, 'd');   // (the trumpet up on a crate: its puff flies level with the ears)
  // two ears over the long chasm
  G.pit(76, 95); G.ground(83, 84, 14); G.ground(91, 92, 14); G.put(83, 13, 'J'); G.put(91, 13, 'U'); G.put(88, 9, 'R');
  G.ground(96, 143, F); G.put(100, 15, 'r'); G.put(101, 15, 'f');
  // the secret: a high ledge (one plank row over the path), its ear, sand trickling off its lip, the door
  G.put(103, 13, '---'); G.fill(110, 10, 118, 10, 'H'); G.put(110, 9, 'E'); G.put(109, 10, 'e'); G.put(116, 9, 'D'); G.put(114, 9, 'p'); G.put(113, 7, 'P');
  G.put(124, 15, 'c'); G.put(128, 12, '?'); G.put(134, 15, 'k'); G.put(137, 15, 'O');
  // ③ the twist: the ear facing away on a floating block, the two platters over the pit
  G.put(140, 15, 'q'); G.pit(144, 161); G.put(146, 13, '--'); G.fill(150, 10, 151, 10, 'H'); G.put(150, 9, 'X');
  G.put(165, 14, '1'); G.put(165, 8, '2');
  G.ground(162, 203, F); G.put(170, 15, 'c'); G.put(178, 15, 'r'); G.put(186, 15, 'k'); G.put(198, 15, 'G'); G.fill(203, 0, 203, 19, 'H');
  G.dress(16, 9, 'x');
  return G.rows();
})();
const TRUMP = (a) => ['piece', 'foley.trumpet', { a, g: 1 }];
const EAR = (face, land) => ['piece', 'foley.ear', { face, g: 1, land }];
stamps.foleyRound = {
  floor: 16, rows: round, items: ['power', 'power'], gold: { '*': 'must', P: 'hidden', R: 'risky' }, doors: [{ to: 'office@in', look: 'foleyHatch' }],
  legend: Object.assign({}, COMMON, {
    n: SIGN('A SPEAKING TRUMPET! THROW TAKES IT, THE STICK AIMS (FOLLOW THE DOTS), THROW PUFFS. A HINGED EAR THAT HEARS YOU FOLDS DOWN'),
    N: SIGN('AIM HIGH: THE DOTS SHOW WHERE THE PUFF GOES. GREEN RING: IT HITS THE EAR\'S FRONT'),
    O: SIGN('THAT EAR FACES AWAY. TIN PLATTERS BOUNCE A PUFF: SEND IT ROUND'),
    a: TRUMP(-0.2), i: TRUMP(-0.5), d: TRUMP(-0.2), f: TRUMP(-0.6), q: TRUMP(-0.2),
    A: EAR(-1, [[-4, 0, -1, 0]]), K: EAR(-1, [[-3, 1, -1, 1]]), J: EAR(-1, [[-4, 0, -1, 0]]), U: EAR(-1, [[-4, 0, -1, 0]]), E: EAR(-1, [[-4, 1, -1, 1]]), X: EAR(1, [[2, 1, 5, 1]]),
    '1': ['piece', 'foley.platter', { dirn: '/' }], '2': ['piece', 'foley.platter', { dirn: '\\' }],
    p: ['anchor', 'b19Back']
  })
};
stamps.foleyOffice = roomStamp('cliffs@b19Back', ['oneup']);
const L4 = { n: 4, name: 'Sound Goes Round', mapLabel: 'Goes Round', arch: 'trumpet', theme: 'foley_round',
  gimmick: 'Aim a speaking trumpet with the stick (the dots show the puff\'s path) and send a puff into the front of a distant hinged ear: it folds down into a landing. The last ear faces away: bounce it off the tin platters',
  hint: 'THROW takes the trumpet, the stick aims, THROW puffs, JUMP lets go. A green ring at the end of the dots: you will hit an ear\'s front. Platters bounce a puff round corners',
  postcard: 'Brady, I whispered "dinner" into a seashell and a cliff folded its ear down to listen. Very good manners for a cliff. ♥ C',
  enemies: [['foleyKettle', 4], ['foleyRay', 3]],
  mapCell: [3, 1], mapFrom: 2,
  exits: { main: { to: '29-5' } },
  areas: [
    { id: 'cliffs', gen: 'room', theme: 'foley_round', stamp: 'foleyRound', bottomKill: true },
    { id: 'office', gen: 'room', role: 'secret', theme: 'foley_room_office', stamp: 'foleyOffice', room: 'foleyTicket' }
  ] };

/* ---------------- 29-5 Cut the Take ----------------
   Floor row 16, the night recording shack. A desk's picture strip shows the prop's noise drawn along it; a marker
   sweeps along the strip and a gold band marks the take. Hold THROW as the marker reaches the band's start (HOLD!)
   and let go at its end (LET GO!): the cut take plays out of the speaker and the clapper gate lifts. ① the teach: a
   creaking door, a long band. ② the test: a gull's short cry; a splash up on the bandstand with a Hiss Kettle; in the
   floor beyond, sand puffs up out of a gap: drop through it to the cable run under the boards and the door to THE
   RECORD CABIN (B20), which lets Brady out further along. ③ the twist: thunder, a crack with a long rattle after it:
   the band is only the short crack. Twice, the second faster. */
const take = (() => {
  const G = mk(200, 20), F = 16;
  G.ground(0, 199, F); G.put(2, 15, '@'); G.put(4, 15, 'n'); G.put(7, 12, '?');
  G.put(12, 15, 'a'); G.put(22, 11, '*'); G.coins(20, 24, 13); G.put(27, 15, 'k'); G.pit(31, 34); G.put(40, 15, 'c');
  G.put(46, 15, 'i'); G.put(56, 15, 'r'); G.pit(59, 62);
  // the bandstand: a plank step up, the splash desk on top, its gate, a kettle
  G.put(64, 13, '--'); G.ground(66, 80, 12); G.put(70, 11, 'd'); G.put(78, 11, 'k'); G.coins(67, 69, 9);
  G.put(88, 15, 'l'); G.put(92, 15, 'c');
  // the secret: a gap in the boards with sand puffing up; the cable run under the floor, its door, P2
  G.fill(96, 17, 112, 18, '.'); G.fill(100, 16, 101, 16, '.'); G.put(99, 15, 'E'); G.put(110, 18, 'D'); G.put(108, 18, 'p'); G.put(104, 17, 'P'); G.coins(103, 106, 18);
  G.put(118, 12, '?'); G.put(124, 15, 'r'); G.put(128, 15, 'Z'); G.put(140, 15, 'c'); G.put(144, 15, 'O');
  // ③ the twist: the thunderclap desks
  G.put(150, 15, 'q'); G.pit(163, 167); G.put(165, 10, 'R'); G.put(171, 15, 'k'); G.put(176, 15, 't'); G.put(186, 15, 'r');
  G.put(196, 15, 'G'); G.fill(199, 0, 199, 19, 'H');
  G.dress(16, 9, 'z');
  return G.rows();
})();
const DESK = (id, prop, band, more) => ['piece', 'foley.desk', Object.assign({ id, prop, band, gx: 5, gh: 5, spk: [4, -1] }, more || {})];
stamps.foleyTake = {
  floor: 16, rows: take, items: ['power', 'power'], gold: { '*': 'must', P: 'hidden', R: 'risky' }, doors: [{ to: 'cabin@in', look: 'foleyHatch' }],
  legend: Object.assign({}, COMMON, {
    n: SIGN('CUT THE TAKE: HOLD THROW WHEN THE MARKER REACHES THE GOLD BAND (HOLD!), LET GO AT ITS END (LET GO!)'),
    O: SIGN('THUNDER IS A CRACK AND THEN A LONG RATTLE. THE SHOW ONLY WANTS THE CRACK'),
    a: DESK('t1', 'door', [0.3, 0.65]), i: DESK('t2', 'gull', [0.42, 0.6]), d: DESK('t3', 'splash', [0.55, 0.85]),
    q: DESK('t4', 'thunder', [0.12, 0.24]), t: DESK('t5', 'thunder', [0.12, 0.24], { period: 2.6 }),
    p: ['anchor', 'b20Back'], Z: ['anchor', 'b20Out']
  })
};
stamps.foleyCabin = roomStamp('shack@b20Back', ['oneup']);
const L5 = { n: 5, name: 'Cut the Take', mapLabel: 'Cut the Take', arch: 'take', theme: 'foley_take',
  gimmick: 'A recording desk\'s picture strip shows the noise; a marker sweeps along it. Hold THROW through the marked length and let go at its end: the take plays and the clapper gate lifts. Thunder\'s band is only the crack',
  hint: 'Wait for HOLD! over the band\'s start, hold THROW, wait for LET GO! at its end. Thunder: just the short crack, not the rattle after it',
  postcard: 'Brady, I recorded a gull. Then I recorded you laughing at the gull. The second one is my ringtone now. ♥ C',
  enemies: [['foleyKettle', 3], ['foleyRay', 3], ['foleyClam', 1]],
  mapCell: [4, 1], mapFrom: 3,
  exits: { main: { to: '29-6' } },
  areas: [
    { id: 'shack', gen: 'room', theme: 'foley_take', stamp: 'foleyTake', bottomKill: true },
    { id: 'cabin', gen: 'room', role: 'secret', theme: 'foley_room_cabin', stamp: 'foleyCabin', room: 'foleyRecords', foleyRecords: { exit: 'shack@b20Out' } }
  ] };

/* ---------------- 29-6 A Storm of His Own Making (Mr. Thunder) ----------------
   The lead-in, floor row 14: three mic stands before three clapper gates. Each has a cue card (Mr. Thunder's next
   move, as a picture) and three noisy machines beside it, each sounding on its own cycle with its own visible noise.
   THROW takes the mic, the stick steers it, THROW captures what it points at while it sounds, THROW plays it back:
   the noise that matches the card lifts the gate. ① the clap: the tin sheet. ② the hail: the rice tray. ③ his tiny
   voice: the machines take turns, and only in the quiet after them does the cardboard pea say "thank you". Then the
   stage door. At the foot of the proscenium, sand puffs out of a loose panel (walk in): RAIN FOR ONE, whose door lets
   Brady out beside the stage door: the room can be found before the boss. */
const storm = (() => {
  const G = mk(140, 18), F = 14;
  G.ground(0, 139, F); G.put(2, 13, '@'); G.put(4, 13, 'n'); G.put(7, 10, '?');
  // ① the clap
  G.put(13, 13, 'a'); G.put(17, 13, '1'); G.put(21, 13, '2'); G.put(25, 13, '3');
  G.put(34, 13, 'k'); G.put(38, 13, 'c');
  // ② the hail
  G.put(44, 13, 'i'); G.put(48, 13, '4'); G.put(52, 13, '5'); G.put(56, 13, '6');
  G.pit(64, 67); G.put(65, 9, '*'); G.put(72, 13, 'r'); G.put(76, 13, 'c'); G.put(78, 10, '?');
  // ③ the quiet: the tin and the windcloth take turns; the cardboard pea speaks in the quiet after them
  G.put(84, 13, 'd'); G.put(88, 13, '7'); G.put(92, 13, '8'); G.put(96, 13, '9'); G.put(103, 13, 'R');
  G.put(106, 13, 'k'); G.put(110, 13, 'c');
  // the proscenium; its loose panel (sand puffing at its foot), the nook with the hatch to the room, then the stage door
  G.put(111, 11, '---'); G.fill(116, 9, 122, 13, 'H'); G.fill(117, 11, 121, 13, '.'); G.fill(116, 11, 116, 13, 'F'); G.put(115, 13, 'E');
  G.put(120, 13, 'D'); G.put(113, 13, 'p'); G.put(119, 11, 'P');
  G.put(126, 13, 'Z'); G.put(130, 13, 'D'); G.fill(139, 0, 139, 17, 'H');
  G.dress(14, 9, 'z');
  return G.rows();
})();
const MIC = (id, want, gx) => ['piece', 'foley.mic', { id, want, gx, gh: 5, card: [0, -5] }];
const MACH = (kind, period, on0, dur) => ['piece', 'foley.machine', { kind, period, on0, dur }];
stamps.foleyStorm = {
  floor: 14, rows: storm, items: ['power', 'power'], gold: { '*': 'must', P: 'hidden', R: 'risky' }, doors: [{ to: 'rain@in', look: 'foleyHatch' }, { to: 'stage@in', look: 'foleyDoor' }],
  legend: Object.assign({}, COMMON, {
    n: SIGN('THE CARD SHOWS MR. THUNDER\'S NEXT MOVE. THROW TAKES THE MIC, STICK STEERS, THROW CAPTURES A SOUNDING MACHINE, THROW PLAYS IT BACK'),
    a: MIC('m1', 'tin', 16), '1': MACH('tin', 3.2, 0, 1.3), '2': MACH('rice', 3.2, 1.1, 1.3), '3': MACH('wind', 3.2, 2.2, 1.0),
    i: MIC('m2', 'rice', 16), '4': MACH('tin', 3.6, 0.4, 1.2), '5': MACH('rice', 3.6, 1.8, 1.4), '6': MACH('wind', 3.6, 1.0, 1.0),
    d: MIC('m3', 'pea', 16), '7': MACH('tin', 4.4, 0, 1.3), '8': MACH('wind', 4.4, 1.3, 1.3), '9': MACH('pea'),
    p: ['anchor', 'b21Back'], Z: ['anchor', 'b21Out']
  })
};
stamps.foleyRainRoom = roomStamp('storm@b21Back', ['oneup', 'star']);
const L6 = { n: 6, name: 'A Storm of His Own Making', mapLabel: 'Storm', arch: 'lair', theme: 'foley_storm', boss: 'foley_thunder',
  gimmick: 'Steer the mic to the machine that sounds like the card (Mr. Thunder\'s next move), capture it, play it back. Then Mr. Thunder, a pea in a biscuit tin, who just wants a bow',
  hint: 'THROW takes the mic, the stick steers, THROW captures what sounds, THROW plays it back. His tells: the lid lifts (the clap: the tin sheet), the cloud wheels in (the hail: the rice tray, played back once it is empty), the handle winds (the gust; then wait for quiet and catch his own "thank you")',
  postcard: 'BRADY. The storm took a bow and the rain stopped. Piwi cried. Mr. Thunder signed my programme. ♥ C',
  enemies: [['foleyKettle', 2], ['foleyRay', 1]],
  mapCell: [5, 1], mapFrom: 4,
  exits: { main: {} },
  areas: [
    { id: 'storm', gen: 'room', theme: 'foley_storm', stamp: 'foleyStorm', bottomKill: true },
    { id: 'rain', gen: 'room', role: 'secret', theme: 'foley_room_sky', stamp: 'foleyRainRoom', room: 'foleyRain', foleyRain: { exit: 'storm@b21Out' } },
    { id: 'stage', gen: 'arena', role: 'arena', layout: 'tin', arenaW: 26, H: 18, roof: false, theme: 'foley_arena' }
  ] };

Tour.foleyLevels = { mk, stamps, roomStamp, SIGN, COMMON, levels: [L1, L2, L3, L4, L5, L6] };
Tour.amend('foley', { stamps, levels: [L1, L2, L3, L4, L5, L6] });
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
