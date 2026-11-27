/* ============================================================
   THE ORCHARD AFTER CLOSING: the stages (world 28) and the land's map. Six stages, each a new kind of play, taught
   where a slip costs nothing, tested, then twisted; the last one is the boss.
   28-1 ELBOWS ON THE TRELLIS (espalier)  two-faced trellises: grip, climb four ways, slip behind a stake at a collar
        to pass the critters on the other face; bend a branch fork across a gap by pushing against it; late forks
        spring back unless bent from the far face, where the tie holds them. Room B11 up the tall trellis's corner.
   (28-2 to 28-6 below.)
   ============================================================ */
(function () {
const C = Tour.countries.orch;
if (!C) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length) Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const pit = (Gr, x0, x1) => fillG(Gr, x0, 0, x1, Gr.length - 1, '.');
const rowsOf = Gr => Gr.map(r => r.join(''));
const stamps = {};
const SIGN = text => ['spawn', 'sign', { text }];
const TREL = (w, h, holes) => ['piece', 'orch.trellis', { w, h, holes: holes || [] }];
const FORK = (len, o) => ['piece', 'orch.fork', Object.assign({ len, dir: 1 }, o || {})];
const CRAWL = o => ['piece', 'orch.crawler', o];
const BITE = o => ['piece', 'orch.bite', o || {}];
// a secret room's stand-in stamp (the room kind builds its own place from it): its door out, its prize
const roomStamp = (out, look, items) => ({ floor: 12, rows: [
  '############################', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#.@..D..................?..#',
  '############################', '############################'], items: items || ['oneup'], doors: [{ to: out, look: look || 'orchShed' }] });

/* ---------------- 28-1 Elbows on the Trellis ---------------- */
// ground tops are row 23. ① the teach: a little trellis over the grass, then one over the first gap; a fork bent
// across a pit between two trellises; ② collars (slip behind the stake past a fly), the tall trellis up to the high
// bank (the potting-shed ledge with the bitten pear at its top left: room B11); ③ the late fork: it springs back from
// the near face, so go round the back and bend it there; ④ two late forks in a row, critters on both faces
const trelRows = (() => {
  const W = 246, H = 30, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 21, 23); put(Gr, 3, 22, '@'); put(Gr, 6, 22, 'k'); put(Gr, 19, 22, 'x');
  put(Gr, 10, 15, '1'); put(Gr, 11, 16, 'o.o.o.o'); put(Gr, 14, 12, '?');
  put(Gr, 20, 13, '2'); put(Gr, 22, 17, 'o.o.o.o.o'); put(Gr, 26, 15, '*');
  ground(Gr, 30, 40, 23); put(Gr, 33, 22, 'c'); put(Gr, 31, 19, '?');
  // the first fork: trellis 36-41, its branch across 42-46, trellis 47-54 over the pit; the bank at 55
  put(Gr, 36, 12, '3'); put(Gr, 41, 14, 'f'); put(Gr, 47, 12, '4'); put(Gr, 38, 22, 'K'); put(Gr, 43, 13, 'o.o.o');
  ground(Gr, 55, 60, 23); put(Gr, 57, 22, 'l');
  // ② collars over the second pit; the bank with a checkpoint
  put(Gr, 58, 11, '5'); put(Gr, 66, 11, 'm'); put(Gr, 65, 17, 'n'); put(Gr, 61, 12, 'o.o'); put(Gr, 69, 12, 'o.o');
  ground(Gr, 74, 91, 23); put(Gr, 76, 22, 'c'); put(Gr, 85, 22, 'r'); put(Gr, 81, 19, 'o.o.o'); put(Gr, 79, 22, 'J');
  // the tall trellis up to the high bank; the shed ledge above its top left (only the trellis reaches it)
  put(Gr, 90, 6, '6'); put(Gr, 93, 9, 'e'); put(Gr, 101, 15, 'q'); put(Gr, 95, 18, 'o.o.o'); put(Gr, 97, 8, 'o.o.o');
  fillG(Gr, 82, 5, 88, 5, 'H'); put(Gr, 83, 4, 'A'); put(Gr, 86, 4, 'u'); put(Gr, 85, 2, 'o.o');
  ground(Gr, 106, 123, 13); put(Gr, 109, 12, 'c'); put(Gr, 113, 12, 'j'); put(Gr, 118, 9, '?'); put(Gr, 117, 12, 'x');
  ground(Gr, 124, 127, 16); ground(Gr, 128, 131, 19); ground(Gr, 132, 146, 23);
  put(Gr, 133, 22, 'a'); put(Gr, 136, 22, 'O'); put(Gr, 139, 22, 'l'); put(Gr, 125, 12, 'd');
  // ③ the late fork: trellis 146-155 (a collar), its branch 156-161 (bent from behind), trellis 162-171; pit 147-172
  put(Gr, 146, 10, '7'); put(Gr, 155, 12, 'X'); put(Gr, 162, 10, '8'); put(Gr, 149, 13, 'w'); put(Gr, 166, 12, 'z'); put(Gr, 158, 12, 'R');
  put(Gr, 150, 18, 'o.o.o'); put(Gr, 165, 17, 'o.o.o');
  ground(Gr, 173, 188, 23); put(Gr, 175, 22, 'c'); put(Gr, 180, 19, '?'); put(Gr, 184, 22, 'r');
  // ④ two late forks in a row, critters on both faces
  put(Gr, 189, 9, '9'); put(Gr, 196, 11, 'E'); put(Gr, 202, 9, '0'); put(Gr, 208, 13, 'Y'); put(Gr, 215, 9, 'Z');
  put(Gr, 191, 12, 'U'); put(Gr, 205, 10, 'V'); put(Gr, 205, 18, 'N'); put(Gr, 218, 12, 'M');
  put(Gr, 192, 16, 'o.o.o'); put(Gr, 204, 14, 'o.o'); put(Gr, 217, 16, 'o.o');
  ground(Gr, 223, W - 1, 23); put(Gr, 225, 22, 'c'); put(Gr, 229, 22, 'r'); fillG(Gr, 233, 20, 234, 22, 'H'); put(Gr, 233, 16, 'P'); put(Gr, 240, 22, 'G');
  fillG(Gr, W - 1, 0, W - 1, 22, 'H');
  return rowsOf(Gr);
})();
const TRL = {
  k: SIGN('A TRELLIS! PUSH UP INTO IT TO GRIP, CLIMB WITH THE STICK, JUMP TO LET GO'),
  K: SIGN('A BRANCH FORK HANGS AT THE EDGE: HOLD THE STICK AGAINST IT AND IT BENDS ACROSS THE GAP'),
  J: SIGN('A STAKE WITH A RUST TIE IS A COLLAR: JUMP THERE TO SLIP ROUND THE BACK. ONLY CRITTERS ON YOUR SIDE CAN TOUCH YOU'),
  O: SIGN('LATE FORKS SPRING BACK WHEN YOU LET GO. THEIR TIE IS ROUND THE BACK: BEND THEM FROM BEHIND'),
  x: ['decor', 'orchCrate'], l: ['enemy', 'orchWorm'], r: ['enemy', 'orchFinch'], j: ['enemy', 'orchSnail'], d: ['enemy', 'orchFly'],
  '1': TREL(8, 5), '2': TREL(12, 7),
  '3': TREL(6, 8), f: FORK(5), '4': TREL(8, 8),
  '5': TREL(16, 9, [[4, 4], [11, 4]]),
  m: CRAWL({ kind: 'fly', face: 0, ay: 7, speed: 1.2 }), n: CRAWL({ kind: 'worm', face: 1, ax: 4, speed: 1.0 }),
  '6': TREL(18, 14, [[4, 10], [9, 4], [14, 8]]),
  e: CRAWL({ kind: 'worm', face: 0, ax: 6, speed: 1.0 }), q: CRAWL({ kind: 'fly', face: 1, ay: -6, speed: 1.2 }),
  A: ['spawn', 'portal', { kind: 'door', look: 'orchShed', targetRef: 'shed@in' }], u: BITE(), a: ['anchor', 'shedOut'],
  '7': TREL(10, 10, [[3, 4]]), X: FORK(6, { late: true }), '8': TREL(10, 10, [[6, 5]]),
  w: CRAWL({ kind: 'fly', face: 0, ay: 6, speed: 1.2 }), z: CRAWL({ kind: 'worm', face: 0, ax: 4, speed: 1.0, phase: 1.2 }),
  '9': TREL(8, 11, [[2, 4]]), E: FORK(5, { late: true }), '0': TREL(7, 11, [[1, 6], [5, 3]]), Y: FORK(6, { late: true }), Z: TREL(8, 11, [[4, 6]]),
  U: CRAWL({ kind: 'fly', face: 0, ay: 7, speed: 1.1 }), V: CRAWL({ kind: 'fly', face: 1, ay: 6, speed: 1.0, phase: 1.5 }),
  N: CRAWL({ kind: 'worm', face: 0, ax: 2, speed: 0.9 }), M: CRAWL({ kind: 'fly', face: 0, ay: 6, speed: 1.1, phase: 0.8 })
};
stamps.orchTrellis = { floor: 23, rows: trelRows, legend: TRL, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power', 'power'] };
stamps.orchShed = roomStamp('rows@shedOut', 'orchHatch');
const L1 = { n: 1, name: 'Elbows on the Trellis', mapLabel: 'Elbows on the Trellis', arch: 'espalier', theme: 'orch_trellis',
  gimmick: 'Espalier trellises over the orchard\'s ditches: grip, climb any way, slip behind a stake to pass the critters on the other face, and push a branch fork across a gap. Late forks spring back unless their tie is done up from behind',
  hint: 'Only a critter on your side of the trellis can touch you. A late fork\'s tie is round the back: bend it from there. Something has been nibbling a pear high over the tall trellis...',
  postcard: 'Brady! The pear trees here hold hands along wires all day. Once the gate shuts they let go and stretch. I did my pliés with them. ♥ C',
  enemies: [['orchWorm', 2], ['orchFinch', 3], ['orchSnail', 1], ['orchFly', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '28-2' } },
  areas: [
    { id: 'rows', gen: 'room', theme: 'orch_trellis', stamp: 'orchTrellis', camera: 'free', bottomKill: true },
    { id: 'shed', gen: 'room', role: 'secret', theme: 'orch_room_shed', stamp: 'orchShed' }
  ] };

/* ---------------- 28-2 Appointment with a Bee ---------------- */
// floors on row 21 (the banks on row 15, 13 and 14). ① the teach: a bell, the bee, a blossom whose pad is a step up
// the first bank; ② petal pads as stepping stones over a ditch (the second bell stands on the first pad); the high
// ledge with the bitten pear over a blossom off the path (room B12, the preserving pantry); ③ two blossoms stacked up
// the wall; ④ a SHY blossom under the last wall: it shuts while you stand by it, so send the bee from the far bell
const beeRows = (() => {
  const W = 212, H = 26, Gr = grid(W, H, '.');
  ground(Gr, 0, 24, 21); put(Gr, 3, 20, '@'); put(Gr, 6, 20, 'k'); put(Gr, 12, 17, '?'); put(Gr, 14, 20, 'x');
  put(Gr, 18, 20, 'f'); put(Gr, 22, 20, '1');
  ground(Gr, 25, 50, 15); put(Gr, 40, 14, 'c'); put(Gr, 34, 12, '*'); put(Gr, 28, 13, 'o.o.o'); put(Gr, 45, 10, 'd');
  pit(Gr, 51, 63); put(Gr, 49, 14, 'e'); put(Gr, 54, 25, '2'); put(Gr, 54, 14, 'i'); put(Gr, 59, 25, '3'); put(Gr, 59, 12, 'R');
  ground(Gr, 64, 92, 15); put(Gr, 72, 14, 'r'); put(Gr, 68, 11, '?'); put(Gr, 78, 14, 'c');
  // the pantry ledge: only a blossom's pad reaches it
  put(Gr, 81, 14, 'j'); put(Gr, 84, 14, '4'); fillG(Gr, 86, 8, 92, 8, 'H'); put(Gr, 90, 7, 'A'); put(Gr, 87, 7, 'u'); put(Gr, 88, 5, 'o.o');
  ground(Gr, 93, 95, 18); ground(Gr, 96, 119, 21); put(Gr, 100, 20, 'a'); put(Gr, 105, 20, 'l');
  put(Gr, 110, 20, 'n'); put(Gr, 114, 20, '5'); put(Gr, 114, 16, 'q'); put(Gr, 117, 20, '6');
  ground(Gr, 120, 150, 13); put(Gr, 124, 12, 'c'); put(Gr, 130, 9, '?'); put(Gr, 140, 12, 'r'); put(Gr, 135, 8, 'd');
  ground(Gr, 151, 173, 21); put(Gr, 153, 20, 'c'); put(Gr, 156, 20, 'K'); put(Gr, 160, 20, 't'); put(Gr, 167, 20, 'p'); put(Gr, 171, 20, '7');
  ground(Gr, 174, W - 1, 15); put(Gr, 180, 11, '?'); put(Gr, 185, 14, 'z'); fillG(Gr, 190, 12, 191, 14, 'H'); put(Gr, 190, 9, 'P'); put(Gr, 196, 14, 'r'); put(Gr, 205, 14, 'G');
  fillG(Gr, W - 1, 0, W - 1, 14, 'H');
  return rowsOf(Gr);
})();
const BL = (id, o) => ['piece', 'orch.blossom', Object.assign({ id, w: 3, dy: 3 }, o || {})];
const BELL = to => ['piece', 'orch.bell', { to }];
const BEE = {
  k: SIGN('KNOCK A BELL FLOWER WITH THROW AND ITS BEE FLIES TO THE BLOSSOM IT POINTS AT. AN OPEN BLOSSOM BLOOMS INTO A STEP'),
  K: SIGN('A SHY BLOSSOM SHUTS WHILE YOU STAND BY IT, AND OPENS A MOMENT AFTER YOU WALK OFF. SEND THE BEE FROM FARTHER AWAY'),
  x: ['decor', 'orchCrate'], l: ['enemy', 'orchWorm'], r: ['enemy', 'orchFinch'], z: ['enemy', 'orchSnail'], d: ['enemy', 'orchFly'],
  f: BELL('b1'), '1': BL('b1'), e: BELL('b2'), '2': BL('b2', { dy: 10 }), i: BELL('b3'), '3': BL('b3', { dy: 10 }),
  j: BELL('b4'), '4': BL('b4'), A: ['spawn', 'portal', { kind: 'door', look: 'orchShed', targetRef: 'pantry@in' }], u: BITE(), a: ['anchor', 'pantryOut'],
  n: BELL('b5'), '5': BL('b5'), q: BELL('b6'), '6': BL('b6', { dy: 6 }),
  t: BELL('b7'), p: BELL('b7'), '7': BL('b7', { dy: 3, shy: true })
};
stamps.orchBees = { floor: 21, rows: beeRows, legend: BEE, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power', 'power'] };
stamps.orchPantry = roomStamp('meadow@pantryOut', 'orchHatch');
const L2 = { n: 2, name: 'Appointment with a Bee', mapLabel: 'Appointment with a Bee', arch: 'pollinate', theme: 'orch_bees',
  gimmick: 'Bell flowers on every bank: knock one with THROW and its bee flies to the blossom it points at, and the blossom blooms into a petal step. A shy blossom only opens once you have walked away',
  hint: 'Stand on the bell\'s gold ring and press THROW. The bee is a friend: it only visits flowers. Send it to a shy blossom from the far bell. A bitten pear sits on a ledge only a petal reaches...',
  postcard: 'Brady! A bee here keeps appointments. Ours was at six, and she was early, and the flower was not ready. I knew how she felt. ♥ C',
  enemies: [['orchWorm', 1], ['orchFinch', 3], ['orchSnail', 1], ['orchFly', 2]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '28-3' } },
  areas: [
    { id: 'meadow', gen: 'room', theme: 'orch_bees', stamp: 'orchBees', camera: 'free', bottomKill: true },
    { id: 'pantry', gen: 'room', role: 'secret', theme: 'orch_room_pantry', stamp: 'orchPantry' }
  ] };

/* ---------------- 28-3 Cut Above ---------------- */
// floors on row 21 (the banks on rows 14, 11 and 9). ① the teach: a stem by the first bank, two buds; ② a taller
// stem with a fly round it up to the high bank; a soft bed of soil behind a stem's foot with the bitten pear (drop
// through it: room B13, the hay loft); ③ the last stem: its lower bud is a fat knob to stand on; pinch the top bud
// from the knob (pinch the knob and it's gone for a moment)
const cutRows = (() => {
  const W = 206, H = 26, Gr = grid(W, H, '.');
  ground(Gr, 0, 19, 21); put(Gr, 3, 20, '@'); put(Gr, 6, 20, 'k'); put(Gr, 10, 17, '?'); put(Gr, 16, 20, '1');
  ground(Gr, 20, 44, 14); put(Gr, 30, 13, 'c'); put(Gr, 26, 10, '*'); put(Gr, 36, 13, 'l'); put(Gr, 40, 10, 'o.o');
  ground(Gr, 45, 47, 17); ground(Gr, 48, 62, 21); put(Gr, 52, 17, '?'); put(Gr, 55, 20, 'x');
  put(Gr, 60, 20, '2'); put(Gr, 56, 14, 'd'); put(Gr, 60, 9, 'R');
  ground(Gr, 63, 104, 11); put(Gr, 68, 10, 'c'); put(Gr, 76, 10, 'r'); put(Gr, 84, 7, '?'); put(Gr, 90, 10, 'z');
  // the hedge mound: its left face is only leaves (walk into it), the bitten pear on top; the hay loft's door inside
  fillG(Gr, 92, 8, 96, 10, 'H'); fillG(Gr, 93, 9, 95, 10, '.'); fillG(Gr, 92, 9, 92, 10, 'F'); put(Gr, 94, 10, 'A'); put(Gr, 94, 7, 'u'); ground(Gr, 105, 108, 15); ground(Gr, 109, 139, 21); put(Gr, 112, 20, 'a'); put(Gr, 118, 20, 'c'); put(Gr, 124, 20, 'l'); put(Gr, 130, 17, '?'); put(Gr, 134, 20, 'K');
  // ③ the last stem
  put(Gr, 140, 20, '4'); put(Gr, 136, 13, 'd');
  ground(Gr, 143, W - 1, 9); put(Gr, 147, 8, 'c'); put(Gr, 155, 8, 'r'); put(Gr, 165, 8, 'z'); fillG(Gr, 176, 6, 177, 8, 'H'); put(Gr, 176, 3, 'P'); put(Gr, 185, 8, 'r'); put(Gr, 199, 8, 'G');
  fillG(Gr, W - 1, 0, W - 1, 8, 'H');
  return rowsOf(Gr);
})();
const STEM = (h, buds, o) => ['piece', 'orch.stem', Object.assign({ h, buds, len: 3 }, o || {})];
const CUT = {
  k: SIGN('A MARKED BUD! STAND ON ITS GOLD RING AND PRESS THROW TO PINCH IT: TWO SHOOTS GROW OUT INTO STEPS'),
  K: SIGN('THE LAST STEM\'S LOWER BUD IS A FAT KNOB. STAND ON IT TO REACH THE TOP BUD... DON\'T PINCH YOUR FOOTHOLD'),
  x: ['decor', 'orchCrate'], l: ['enemy', 'orchWorm'], r: ['enemy', 'orchFinch'], z: ['enemy', 'orchSnail'], d: ['enemy', 'orchFly'],
  '1': STEM(6, [[0, -1], [3, -1]]),
  '2': STEM(9, [[0, -1], [3, -1], [6, -1]], { len: 2 }),
  A: ['spawn', 'portal', { kind: 'door', look: 'orchHatch', targetRef: 'loft@in' }], u: BITE(), a: ['anchor', 'loftOut'],
  '4': STEM(12, [[0, -1], [3, -1], [6, -1], [9, -1]], { len: 2, knob: 2 })
};
stamps.orchCut = { floor: 21, rows: cutRows, legend: CUT, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power', 'power'] };
stamps.orchLoft = roomStamp('yard@loftOut', 'orchShed');
const L3 = { n: 3, name: 'Cut Above', mapLabel: 'Cut Above', arch: 'pinch', theme: 'orch_prune',
  gimmick: 'The pruning yard: pinch a marked bud with THROW and its two side shoots grow out into steps up the stem. The last stem\'s lower bud is the knob you stand on to reach the top one',
  hint: 'Stand on a bud\'s gold ring and press THROW. Shoots grow two rows up. On the last stem, stand on the knob and pinch the bud above it. A hedge mound on the high bank has a bitten pear on top...',
  postcard: 'Brady! I pinched one bud and the tree grew me a staircase. Piwi pinched one and it grew him a hat. He is wearing it. ♥ C',
  enemies: [['orchWorm', 2], ['orchFinch', 3], ['orchSnail', 2], ['orchFly', 2]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '28-4' } },
  areas: [
    { id: 'yard', gen: 'room', theme: 'orch_prune', stamp: 'orchCut', camera: 'free', bottomKill: true },
    { id: 'loft', gen: 'room', role: 'secret', theme: 'orch_room_loft', stamp: 'orchLoft' }
  ] };

/* ---------------- 28-4 A Pear in a Sleeve ---------------- */
// the stage goes down and up: the start bank on row 12. ① the teach: a sleeve down off the start bank over soft
// grass to the lower ledge; ② a sleeve down into the valley over the ditch; a sleeve up to the high bank (wound
// with the seam) that keeps going past it, up into the canopy: the bitten pear and the parlour door (room B14);
// ③ the late sleeve down: past its rust tie the seam turns; ④ a late sleeve up with critters round it, the last one
// down, the gate
const sleeveRows = (() => {
  const W = 214, H = 30, Gr = grid(W, H, '.');
  ground(Gr, 0, 20, 12); put(Gr, 3, 11, '@'); put(Gr, 6, 11, 'k'); put(Gr, 10, 8, '?'); put(Gr, 17, 11, 'x');
  put(Gr, 21, 11, '1'); ground(Gr, 21, 23, 26);
  ground(Gr, 24, 45, 18); put(Gr, 28, 17, 'c'); put(Gr, 33, 14, '?'); put(Gr, 38, 17, 'l'); put(Gr, 30, 14, 'o.o.o');
  put(Gr, 46, 17, '2'); put(Gr, 47, 21, 'R');
  ground(Gr, 49, 69, 25); put(Gr, 52, 24, 'c'); put(Gr, 58, 24, 'r'); put(Gr, 62, 21, '*'); put(Gr, 66, 24, 'K');
  // the lift up past the high bank into the canopy: the parlour niche at its very top
  put(Gr, 70, 7, '3'); fillG(Gr, 66, 8, 69, 8, 'H'); put(Gr, 67, 7, 'A'); put(Gr, 69, 7, 'u'); put(Gr, 66, 5, 'o.o');
  ground(Gr, 73, 100, 15); put(Gr, 76, 14, 'c'); put(Gr, 80, 14, 'a'); put(Gr, 86, 11, '?'); put(Gr, 92, 14, 'z'); put(Gr, 96, 10, 'd');
  // ③ the late sleeve down
  put(Gr, 101, 14, '4');
  ground(Gr, 104, 130, 27); put(Gr, 107, 26, 'c'); put(Gr, 114, 26, 'l'); put(Gr, 119, 23, '?'); put(Gr, 124, 26, 'J');
  // ④ the late sleeve up, critters round it; the high run; the last one down
  put(Gr, 131, 13, '5'); put(Gr, 128, 17, 'd'); put(Gr, 136, 19, 'd');
  ground(Gr, 134, 168, 14); put(Gr, 138, 13, 'c'); put(Gr, 146, 13, 'r'); put(Gr, 158, 13, 'z');
  put(Gr, 169, 13, '6'); put(Gr, 172, 18, 'd');
  ground(Gr, 172, W - 1, 25); put(Gr, 175, 24, 'c'); put(Gr, 182, 24, 'r'); fillG(Gr, 190, 22, 191, 24, 'H'); put(Gr, 190, 19, 'P'); put(Gr, 207, 24, 'G');
  fillG(Gr, W - 1, 0, W - 1, 24, 'H');
  return rowsOf(Gr);
})();
const SLV = o => ['piece', 'orch.sleeve', o];
const SLEEVE = {
  k: SIGN('A PEAR IN A PAPER SLEEVE! STAND ON ITS TOP AND WALK AGAINST THE SPIRAL SEAM: IT UNSCREWS DOWN. WALK WITH IT: BACK UP'),
  K: SIGN('A SLEEVE CAN WIND UP TOO: WALK WITH THE SEAM. KEEP WINDING AND SEE HOW HIGH IT GOES...'),
  J: SIGN('A RUST TIE ON THE STALK: PAST IT THE SEAM TURNS THE OTHER WAY. KEEP ON THE OLD WAY AND YOU WIND BACK UP'),
  x: ['decor', 'orchCrate'], l: ['enemy', 'orchWorm'], r: ['enemy', 'orchFinch'], z: ['enemy', 'orchSnail'], d: ['enemy', 'orchFly'],
  '1': SLV({ bot: 6, hand: 1, hang: 3 }),
  '2': SLV({ bot: 7, hand: -1, hang: 3 }),
  '3': SLV({ bot: 17, hand: 1, hang: 3, start: 'bot' }),
  A: ['spawn', 'portal', { kind: 'door', look: 'orchHatch', targetRef: 'parlour@in' }], u: BITE(), a: ['anchor', 'parlourOut'],
  '4': SLV({ bot: 12, hand: 1, join: 6, hang: 3 }),
  '5': SLV({ bot: 13, hand: -1, join: 6, hang: 3, start: 'bot' }),
  '6': SLV({ bot: 11, hand: 1, join: 5, hang: 3 })
};
stamps.orchSleeve = { floor: 25, rows: sleeveRows, legend: SLEEVE, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power', 'power'] };
stamps.orchParlour = roomStamp('shed@parlourOut', 'orchShed');
const L4 = { n: 4, name: 'A Pear in a Sleeve', mapLabel: 'A Pear in a Sleeve', arch: 'unscrew', theme: 'orch_sleeve',
  gimmick: 'Pears hang in paper sleeves from the packing-shed beams: stand on one and walk against its spiral seam to unscrew it down, or with the seam to wind it up. Late sleeves change their seam at a rust tie',
  hint: 'Watch the arrows on the sleeve: walk that way to go down. Past a rust tie the seam turns: turn round with it. One sleeve keeps winding up past the bank, into the leaves...',
  postcard: 'Brady! Every pear here wears a paper sleeve, like a little nightie. I unscrewed one and rode it down to supper. ♥ C',
  enemies: [['orchWorm', 2], ['orchFinch', 2], ['orchSnail', 2], ['orchFly', 4]],
  mapCell: [3, 0], mapFrom: 2,
  exits: { main: { to: '28-5' } },
  areas: [
    { id: 'shed', gen: 'room', theme: 'orch_sleeve', stamp: 'orchSleeve', camera: 'free', bottomKill: true },
    { id: 'parlour', gen: 'room', role: 'secret', theme: 'orch_room_parlour', stamp: 'orchParlour' }
  ] };

Tour.amend('orch', { stamps, levels: [L1, L2, L3, L4] });

/* ---------------- the land's map: an orchard behind a clipped hedge ---------------- */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.orch = {
  labels: { '28-1': 'Elbows on the Trellis', '28-2': 'Appointment with a Bee', '28-3': 'Cut Above', '28-4': 'A Pear in a Sleeve', '28-5': 'The Graft Takes', '28-6': 'Windfall Committee' },
  w: 1520, h: 760,
  pal: { sea: '#5a4a7a', deep: '#3e3a6a', land: '#9ab84a', light: '#b8d06a', path: '#e8dcb8', beach: '#c8b07a', cliff: '#3e6a2a', roof: RUSTC(), wall: '#f4ecd4' },
  sea: 'clouds', coast: 'orchHedge', tufts: 'none', trail: 'stones', bridge: 'rope', meadow: false, woods: false, foam: false, birds: true,
  land: [[[170, 380], [250, 230], [430, 170], [660, 200], [860, 150], [1090, 180], [1310, 240], [1390, 380], [1350, 540], [1210, 650], [970, 670], [720, 630], [470, 660], [270, 590]]],
  // the route winds between the rows of trees like a mown path
  nodes: { start: [260, 450], '28-1': [430, 280, 'n'], '28-2': [640, 470, 's'], '28-3': [840, 260, 'n'], '28-4': [1040, 470, 's'], '28-5': [1240, 300, 'n'], '28-6': [1170, 560, 's'], port: [960, 620] },
  paths: { 'start>28-1': [[330, 340]], '28-1>28-2': [[540, 360]], '28-2>28-3': [[740, 360]], '28-3>28-4': [[940, 370]], '28-4>28-5': [[1140, 380]], '28-5>28-6': [[1250, 440]], '28-6>port': [[1070, 600]] },
  feat: [
    ['sprite', 'orchGateSprite', 230, 530, 24], ['sprite', 'orchTrellisSprite', 520, 250, 34], ['sprite', 'orchSkep', 720, 520, 22], ['sprite', 'orchTree', 940, 240, 26],
    ['sprite', 'orchTree', 1140, 520, 24], ['sprite', 'orchTree', 400, 560, 22], ['sprite', 'orchBasketSprite', 820, 600, 28]
  ],
  flora: ['rock'], density: 0,
  live: [['circle', 700, 120, 60, 0.6]]
};
function RUSTC() { return '#c0462a'; }
})();
