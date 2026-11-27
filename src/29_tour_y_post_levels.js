/* ============================================================
   POSTMARK SOUND: the levels (world 27) and the land's map. A hidden bonus land at about Nepal's level (d0 0.8):
   each stage teaches its one new idea where a slip costs nothing, tests it among the critters, then twists it
   ("late on / the last one"); the last ordinary stage and the boss are the hardest.
   27-1 PERFORATION WALK (perforate)  tear paper islands free so they fall and plug the ink; the last two share a tooth
   27-2 STAMP DUTY (stampduty)        roll a loose stamp, THROW prints a mirrored foothold; the last is an L
   27-3 BLOTTER BAY (blotter)         a pad drinks a bead, then a gap in the surf; the last needs two and a slap
   27-4 FORWARDING FOLD (fold)        hold THROW and walk back: the far bank folds over; the last needs you on it
   27-5 MISMEASURED COAST (scale)     walk a ruler to grow or shrink the harbour round a pin; the last pin has two
   27-6 RETURN TO SENDER (lair)       torn addresses cancelled whole, then the Postmaster's Thumb
   ============================================================ */
(function () {
const C = Tour.countries.post;
if (!C) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length) Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const pit = (Gr, x0, x1) => fillG(Gr, x0, 0, x1, Gr.length - 1, '.');
const ink = (Gr, x0, x1, top) => { pit(Gr, x0, x1); fillG(Gr, x0, top, x1, Gr.length - 1, 'L'); };
const rowsOf = Gr => Gr.map(r => r.join(''));
const stamps = {};
// a secret room's old stamp: the way back out (its door) and its prize; the room kind builds the room from it
const oldRoom = (to, items, look) => ({ floor: 12, rows: ['##############################', '#............................#'].concat(Array(9).fill('#............................#')).concat(['#.@D.....................?...#', '##############################', '##############################']), items, doors: [{ to, look: look || 'postFlap' }] });
const SIGN = text => ['spawn', 'sign', { text }];
const COMMON = { l: ['decor', 'postBollard'], k: ['decor', 'postCrateS'], q: ['decor', 'postRule'], f: ['decor', 'postFoldMark'], i: ['decor', 'postInkwell'],
  e: ['enemy', 'postCrab'], u: ['enemy', 'postPup'], M: ['enemy', 'postGull'], w: ['enemy', 'postEel'] };

/* ---------------- 27-1 Perforation Walk ---------------- */
// ① the teach: one island level with a ledge over a wide ink channel: walk its perforated top, it tears free, jump
// back to the ledge, it falls and plugs the ink (P1 over it); ② the test: two more islands, a gull overhead and a
// margin crab on the banks; a low tunnel under a thin card ceiling (a corner curls down from a gap in it: the run on
// top leads to the stamp press); ③ the twist: two islands share one two-coloured tooth that holds them both: tear
// the first's teeth, hop OVER the shared tooth onto the second and keep going to the far ledge.
const perfRows = (() => {
  const W = 212, H = 26, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 24, 19); put(Gr, 3, 18, '@'); put(Gr, 6, 18, 'n'); put(Gr, 10, 15, '?'); put(Gr, 14, 16, 'o.o.o'); put(Gr, 20, 18, 'l');
  ground(Gr, 25, 26, 17); ground(Gr, 27, 30, 15); put(Gr, 28, 14, '1');
  ink(Gr, 31, 40, 17); put(Gr, 34, 11, '*');
  ground(Gr, 41, 58, 17); put(Gr, 49, 16, 'q'); put(Gr, 46, 16, 'c'); put(Gr, 44, 13, '?'); put(Gr, 53, 16, 'e'); put(Gr, 57, 16, 'q');
  // ② the test: two more islands
  ground(Gr, 59, 64, 17); put(Gr, 60, 16, 'N'); put(Gr, 63, 16, '2');
  ink(Gr, 65, 74, 19); put(Gr, 68, 12, 'o.o'); put(Gr, 72, 10, 'M');
  ground(Gr, 75, 92, 19); put(Gr, 79, 18, 'k'); put(Gr, 84, 18, 'l'); put(Gr, 90, 18, 'c');
  ground(Gr, 93, 94, 18); ground(Gr, 95, 96, 17); ground(Gr, 97, 100, 16); put(Gr, 99, 15, '3');
  ink(Gr, 101, 110, 18); put(Gr, 104, 9, 'M');
  ground(Gr, 111, 140, 18);
  // the low tunnel under a thin card ceiling, walls up from its ends; a gap in the ceiling (a corner curls down)
  fillG(Gr, 113, 15, 130, 15, 'H'); fillG(Gr, 112, 7, 112, 15, 'H'); fillG(Gr, 131, 7, 131, 15, 'H');
  fillG(Gr, 121, 15, 122, 15, '.'); put(Gr, 120, 16, 'x');
  put(Gr, 115, 17, 'o.o.o'); put(Gr, 125, 17, 'o.o');
  // the run on top of the ceiling: coins, a gull, the hidden 1UP, P2, the press's letterbox
  put(Gr, 114, 13, 'o.o.o'); put(Gr, 117, 10, 'h'); put(Gr, 124, 14, 'e'); put(Gr, 126, 12, 'A'); put(Gr, 129, 14, 'D');
  put(Gr, 134, 17, 'a'); put(Gr, 136, 17, 'c'); put(Gr, 133, 17, 'l');
  // ③ the twist: the two islands that share a tooth over one long ink channel
  ground(Gr, 141, 142, 18); ground(Gr, 143, 146, 17); put(Gr, 143, 16, 'O'); put(Gr, 145, 16, '4');
  ink(Gr, 147, 157, 19); put(Gr, 152, 12, 'R');
  ground(Gr, 158, W - 1, 17); put(Gr, 160, 16, 'q'); put(Gr, 165, 16, 'e'); put(Gr, 172, 16, 'q'); put(Gr, 168, 13, 'o.o.o');
  put(Gr, 178, 16, 'u'); put(Gr, 184, 16, 'k'); put(Gr, 190, 16, 'l'); put(Gr, 200, 16, 'G');
  fillG(Gr, W - 1, 0, W - 1, 16, '#');
  return rowsOf(Gr);
})();
const ISL = (rect, teeth, land, g, pre) => ['piece', 'post.island', { rect, teeth, land, g, pre: pre || [] }];
stamps.postPerf = { floor: 19, rows: perfRows, gold: { '*': 'must', A: 'hidden', R: 'risky' }, items: ['power', 'power'], hidden: ['oneup'], doors: [{ to: 'press@in', look: 'postFlap' }], legend: Object.assign({}, COMMON, {
  n: SIGN('PERFORATIONS! WALK OVER EVERY TOOTH OF AN ISLAND\'S DOTTED EDGE AND IT TEARS FREE. JUMP OFF: IT FALLS AND PLUGS THE INK'),
  N: SIGN('THE TEETH TEAR UNDER YOUR FEET. A JUMP DOESN\'T TEAR THEM'),
  O: SIGN('TWO ISLANDS, ONE TWO-COLOURED TOOTH: TEAR IT AND BOTH COME FREE'),
  '1': ISL([31, 15, 36, 16], [31, 32, 33, 34, 35, 36], [31, 17, 36, 17], 0),
  '2': ISL([65, 17, 70, 18], [65, 66, 67, 68, 69, 70], [65, 19, 70, 19], 1),
  '3': ISL([101, 16, 106, 17], [101, 102, 103, 104, 105, 106], [101, 18, 106, 18], 2),
  '4': ['piece', 'post.pair', { a: [147, 17, 150, 18], b: [151, 17, 154, 18], seam: 150, landA: [147, 19, 150, 19], landB: [151, 19, 154, 19] }],
  x: ['decor', 'postTellCeil'], a: ['anchor', 'pressOut']
}) };
// the twist's pair: the first island's teeth end in the shared tooth; the second hangs by that tooth alone (its own
// teeth were torn long ago). The checker sees a bridge: hopping over the shared tooth keeps it one.
Tour.pieces['post.pair'] = function (st, o) {
  const A = o.a, Bq = o.b, s = o.seam;
  Tour.pieces['post.island'](st, { rect: A, teeth: [A[0], A[0] + 1, A[0] + 2, s], land: o.landA, seam: s });
  const bt = []; for (let x = Bq[0]; x <= Bq[2]; x++) bt.push(x);
  Tour.pieces['post.island'](st, { rect: Bq, teeth: [s].concat(bt), pre: bt, land: o.landB, seam: s, pairRow: A[1] });
  return st.x;
};
stamps.postPressOld = oldRoom('perf@pressOut', ['oneup']);
const L1 = { n: 1, name: 'Perforation Walk', mapLabel: 'Perforation Walk', arch: 'perforate', theme: 'post_sound',
  gimmick: 'Paper islands outlined in perforations: walk over every tooth of an island\'s dotted edge and it tears free; jump off before it falls and plugs the ink. Late on, two islands share one tooth',
  hint: 'Walk, don\'t jump, to tear the teeth. Jump OFF when it trembles. The two-coloured tooth holds two islands: hop over it. A corner of the print curls down from a tunnel roof...',
  postcard: 'Brady! The harbour on my postcard tears along the dotted line. Mind the ink, it never comes out of black trousers. I know. ♥ C',
  enemies: [['postCrab', 3], ['postPup', 1], ['postGull', 2]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '27-2' } },
  areas: [
    { id: 'perf', gen: 'room', theme: 'post_sound', stamp: 'postPerf', post: { perf: true }, bottomKill: true },
    { id: 'press', gen: 'room', role: 'secret', room: 'postGap', theme: 'post_room_press', stamp: 'postPressOld', post: { room: true } }
  ] };

/* ---------------- 27-2 Stamp Duty ---------------- */
// ① the teach: a loose stamp on the left page; roll it along and THROW: its raised slab prints on the facing page,
// mirrored across the gutter: two jumps over the ink need it just there (the silhouette shows where); ② the test: a
// stamp that prints a step half-way up a cliff (a corner curls out of the cliff's foot: a fake wall to the inspector's
// bureau); ③ the twist: an L-shaped stamp prints the other way round: its tall side has to land against the last
// cliff, so it goes where the silhouette says, not where the stamp face looks.
const stampRows = (() => {
  const W = 182, H = 24, Gr = grid(W, H, '.');
  ground(Gr, 0, 16, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 7, 15, '?'); put(Gr, 12, 18, '1');
  ink(Gr, 17, 26, 20); put(Gr, 21, 14, 'R');
  ground(Gr, 27, 49, 19); put(Gr, 31, 18, 'c'); put(Gr, 36, 18, '2'); put(Gr, 30, 18, 'N'); put(Gr, 45, 10, 'M'); put(Gr, 40, 15, '?');
  ground(Gr, 50, 75, 14); put(Gr, 54, 13, 'q'); put(Gr, 60, 13, 'e'); put(Gr, 67, 13, 'q'); put(Gr, 64, 10, '*'); put(Gr, 58, 13, 'a'); put(Gr, 71, 13, 'c');
  // the inspector's bureau: a fake wall at the cliff's foot (a corner curls out of it), a short passage, the door
  fillG(Gr, 50, 17, 50, 18, 'F'); fillG(Gr, 51, 17, 54, 18, '.'); put(Gr, 49, 17, 'x'); put(Gr, 52, 17, 'A'); put(Gr, 54, 18, 'D');
  ground(Gr, 76, 103, 19); put(Gr, 78, 18, 'O'); put(Gr, 84, 18, '3'); put(Gr, 81, 18, 'u'); put(Gr, 90, 13, 'o.o.o'); put(Gr, 99, 9, 'M');
  ground(Gr, 104, 135, 14); put(Gr, 110, 13, 'k'); put(Gr, 116, 13, 'e'); put(Gr, 112, 13, 'q'); put(Gr, 124, 13, 'q'); put(Gr, 120, 13, 'c'); put(Gr, 118, 10, 'o.o.o');
  ground(Gr, 136, 137, 16); ground(Gr, 138, 150, 19); put(Gr, 143, 18, 'u');
  ink(Gr, 151, 153, 20); put(Gr, 151, 15, 'o.o.o');
  ground(Gr, 154, W - 1, 19); put(Gr, 166, 11, 'M'); put(Gr, 160, 18, 'l'); put(Gr, 166, 18, 'k'); put(Gr, 172, 18, 'G'); fillG(Gr, W - 1, 0, W - 1, 18, '#');
  return rowsOf(Gr);
})();
const STAMP = (rail, at, crease, shape, ty, good, g) => ['piece', 'post.stamp', { rail, w: 2, at, crease, shape, ty, good, g }];
stamps.postStampDuty = { floor: 19, rows: stampRows, gold: { '*': 'must', A: 'hidden', R: 'risky' }, items: ['power', 'power'], doors: [{ to: 'bureau@in', look: 'postSlit' }], legend: Object.assign({}, COMMON, {
  n: SIGN('A LOOSE STAMP! STAND AT IT AND WALK TO ROLL IT. THROW PRINTS ITS RAISED SHAPE ON THE FACING PAGE, MIRRORED ACROSS THE GUTTER'),
  N: SIGN('THE INK SILHOUETTE SHOWS WHERE IT WILL PRINT. A NEW PRINT WIPES THE LAST ONE'),
  O: SIGN('THIS STAMP IS AN L. IT PRINTS THE OTHER WAY ROUND: WATCH THE SILHOUETTE, NOT THE STAMP'),
  '1': STAMP([9, 14, 19], 14, 17, [[0, 0], [1, 0]], 19, 11, 0),
  '2': STAMP([30, 38, 19], 31, 42, [[0, 0], [1, 0]], 16, 34, 1),
  '3': STAMP([84, 92, 19], 86, 97, [[0, 0], [0, 1], [1, 1]], 17, 90, 2),
  x: ['decor', 'postTellWall'], a: ['anchor', 'bureauOut']
}) };
stamps.postBureauOld = oldRoom('stamp@bureauOut', ['oneup'], 'postSlit');
const L2 = { n: 2, name: 'Stamp Duty', mapLabel: 'Stamp Duty', arch: 'stampduty', theme: 'post_album',
  gimmick: 'A loose stamp on the left page: roll it along by walking with it, THROW prints its raised shape as a foothold on the facing page, mirrored. The last one is an L that prints the other way round',
  hint: 'Follow the ink silhouette, not the stamp. The L\'s tall side must end up against the cliff. A corner curls out of a cliff\'s foot...',
  postcard: 'Brady! I stamped my foot and it printed a step. Backwards. I climbed it anyway, darling, in heels. ♥ C',
  enemies: [['postCrab', 2], ['postPup', 2], ['postGull', 3]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '27-3' } },
  areas: [
    { id: 'stamp', gen: 'room', theme: 'post_album', stamp: 'postStampDuty', post: { stamp: true }, bottomKill: true },
    { id: 'bureau', gen: 'room', role: 'secret', room: 'postFake', theme: 'post_room_bureau', stamp: 'postBureauOld', post: { room: true } }
  ] };

/* ---------------- 27-3 Blotter Bay ---------------- */
// ① the teach: a blotting pad on a quay rail, a pen nib sweeping overhead: walk the pad under the swelling bead (its
// shadow shows where it drops), then push the inky pad into the printed surf: it drinks a gap and the paper boat
// sails through to make a bridge; ② the test: a thicker surf, a gull and a pup; a stamp-edge lid in the quay floor
// (a corner curls up beside it) drops to a passage under the quay and the ink cellar; ③ the twist: the last surf
// wants two beads, and the soaked pad only dries when Brady jumps and slaps it on the hanging blotter.
const blotRows = (() => {
  const W = 190, H = 24, Gr = grid(W, H, '.');
  ground(Gr, 0, 16, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 7, 15, '?'); put(Gr, 11, 18, '1');
  ink(Gr, 17, 24, 20); put(Gr, 21, 15, '*');
  ground(Gr, 25, 54, 19); put(Gr, 30, 18, 'c'); put(Gr, 33, 18, 'q'); put(Gr, 38, 18, 'e'); put(Gr, 43, 18, 'q'); put(Gr, 41, 18, 'u'); put(Gr, 47, 18, 'N'); put(Gr, 49, 18, '2');
  ink(Gr, 55, 64, 20); put(Gr, 59, 9, 'M');
  ground(Gr, 65, 103, 19); put(Gr, 68, 18, 'l'); put(Gr, 86, 15, '?'); put(Gr, 80, 18, 'c'); put(Gr, 97, 18, 'u'); put(Gr, 96, 18, 'a'); put(Gr, 99, 13, 'o.o.o');
  // the ink cellar: a stamp-edge lid in the quay floor (a corner curls up beside it), a passage under the quay, a door
  fillG(Gr, 72, 19, 73, 19, '-'); fillG(Gr, 72, 20, 80, 21, '.'); put(Gr, 74, 18, 'x'); put(Gr, 76, 21, 'A'); put(Gr, 79, 21, 'D'); put(Gr, 71, 18, 'z');
  ground(Gr, 104, 114, 19); put(Gr, 102, 18, 'O'); put(Gr, 109, 18, '3');
  ink(Gr, 115, 126, 20); put(Gr, 121, 14, 'R');
  ground(Gr, 127, W - 1, 19); put(Gr, 130, 18, 'c'); put(Gr, 136, 18, 'q'); put(Gr, 141, 18, 'e'); put(Gr, 147, 18, 'q'); put(Gr, 152, 13, 'o.o.o'); put(Gr, 158, 18, 'u'); put(Gr, 156, 8, 'M'); put(Gr, 166, 18, 'i'); put(Gr, 172, 18, 'l');
  put(Gr, 180, 18, 'G'); fillG(Gr, W - 1, 0, W - 1, 18, '#');
  return rowsOf(Gr);
})();
const BLOT = o => ['piece', 'post.blotter', Object.assign({ w: 2, every: 1.0 }, o)];
stamps.postBlot = { floor: 19, rows: blotRows, gold: { '*': 'must', A: 'hidden', R: 'risky' }, items: ['power', 'power'], doors: [{ to: 'cellar@in', look: 'postSlit' }], legend: Object.assign({}, COMMON, {
  n: SIGN('A BLOTTING PAD! WALK WITH IT UNDER THE INK BEAD (ITS SHADOW SHOWS WHERE IT DROPS), THEN PUSH THE INKY PAD INTO THE SURF'),
  N: SIGN('A THICK SURF DRINKS A LOT. ONE BEAD STILL DOES IT HERE'),
  O: SIGN('THIS SURF NEEDS TWO BEADS. A SOGGY PAD DRIES IF YOU JUMP AND SLAP IT ON THE BLOTTER'),
  '1': BLOT({ rail: [9, 14, 19], at: 12, nib: [9, 15, 9], surf: [17, 13, 18, 19], boat: { at: [22, 20], dock: [17, 19, 24] }, g: 0 }),
  '2': BLOT({ rail: [46, 52, 19], at: 48, nib: [46, 53, 8], surf: [55, 12, 57, 19], boat: { at: [61, 20], dock: [55, 19, 64] }, g: 1 }),
  '3': BLOT({ rail: [104, 112, 19], at: 106, nib: [104, 113, 8], surf: [115, 11, 118, 19], need: 2, blotter: [108, 14], boat: { at: [123, 20], dock: [115, 19, 126] }, g: 2 }),
  // the checker: down + JUMP on the lid drops through it (the game's own drop-through of a one-way floor)
  z: ['piece', st => { st.B.edge([72, 18], [73, 21]); st.B.edge([73, 18], [73, 21]); return st.x; }],
  x: ['decor', 'postTell'], a: ['anchor', 'cellarOut']
}) };
stamps.postCellarOld = oldRoom('blot@cellarOut', ['oneup'], 'postSlit');
const L3 = { n: 3, name: 'Blotter Bay', mapLabel: 'Blotter Bay', arch: 'blotter', theme: 'post_blot',
  gimmick: 'A blotting pad on a quay rail: walk it under the bead swelling on the pen nib overhead, then push the inky pad into the printed surf to drink a gap and let the paper boat through. Late on, two beads, and the pad dries only on the hanging blotter',
  hint: 'Stand on the pad and walk: it rolls with you. Watch the bead\'s shadow. A soggy pad: jump up and slap the blotter. A corner curls up beside a lid in the quay floor...',
  postcard: 'Brady! The sea here is ink and the boats are folded. Pupo blotted the whole bay with his sleeve and now his sleeve is the bay. ♥ C',
  enemies: [['postCrab', 2], ['postPup', 3], ['postGull', 2]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '27-4' } },
  areas: [
    { id: 'blot', gen: 'room', theme: 'post_blot', stamp: 'postBlot', post: { blot: true }, bottomKill: true },
    { id: 'cellar', gen: 'room', role: 'secret', room: 'postEcho', theme: 'post_room_cellar', stamp: 'postCellarOld', post: { room: true } }
  ] };

/* ---------------- 27-4 Forwarding Fold ---------------- */
// ① the teach: a crease mark by an ink channel, the far bank's flap standing up beyond it: hold THROW and walk back,
// the flap folds down over the ink until the edges meet; ② the test: a wider channel, crease eels that only turn at
// folds; an optional crease at the end of a bank folds a flap over to a ledge with a letterbox (a corner curls by the
// mark); the way on drops under it; ③ the twist: the last flap tucks the exit away unless Brady, still holding THROW,
// steps onto its printed side before he lets go.
const foldRows = (() => {
  const W = 176, H = 27, Gr = grid(W, H, '.');
  ground(Gr, 0, 20, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 8, 15, '?'); put(Gr, 19, 18, '1'); put(Gr, 13, 18, 'l');
  ink(Gr, 21, 25, 20); put(Gr, 23, 15, '*');
  ground(Gr, 26, 48, 19); put(Gr, 30, 18, 'c'); put(Gr, 28, 18, 'N'); put(Gr, 35, 18, 'f'); put(Gr, 38, 18, 'w'); put(Gr, 44, 18, 'f'); put(Gr, 31, 15, '?'); put(Gr, 46, 18, '2');
  ink(Gr, 49, 54, 20); put(Gr, 52, 9, 'M');
  ground(Gr, 55, 80, 19); put(Gr, 62, 18, 'c'); put(Gr, 58, 18, 'f'); put(Gr, 66, 18, 'w'); put(Gr, 74, 18, 'f'); put(Gr, 79, 18, '3'); put(Gr, 80, 18, 'x');
  // the letterbox ledge: a block in the air over the way on, reached only by folding its flap over
  pit(Gr, 81, 85); fillG(Gr, 86, 19, 92, 20, '#'); put(Gr, 88, 17, 'A'); put(Gr, 91, 18, 'D');
  ground(Gr, 81, 115, 25); put(Gr, 84, 24, 'f'); put(Gr, 90, 24, 'w'); put(Gr, 96, 24, 'f'); put(Gr, 100, 24, 'c'); put(Gr, 106, 24, 'a'); put(Gr, 96, 21, 'o.o.o');
  ground(Gr, 116, 117, 23); ground(Gr, 118, 119, 21); ground(Gr, 120, 135, 19); put(Gr, 122, 18, 'c'); put(Gr, 124, 18, 'O'); put(Gr, 134, 18, '4');
  ink(Gr, 136, 141, 20); put(Gr, 138, 14, 'R');
  ground(Gr, 142, W - 1, 19); put(Gr, 146, 18, 'k'); put(Gr, 158, 18, 'G'); put(Gr, 165, 18, 'l'); fillG(Gr, W - 1, 0, W - 1, 18, '#');
  return rowsOf(Gr);
})();
const FOLD = o => ['piece', 'post.fold', o];
stamps.postFoldLand = { floor: 19, rows: foldRows, gold: { '*': 'must', A: 'hidden', R: 'risky' }, items: ['power', 'power'], doors: [{ to: 'pens@in', look: 'postFlap' }], legend: Object.assign({}, COMMON, {
  n: SIGN('A CREASE! STAND ON THE MARK, HOLD THROW AND WALK BACK: THE FAR BANK FOLDS OVER TOWARD YOU. KEEP HOLDING TILL THE EDGES MEET'),
  N: SIGN('CREASE EELS ONLY TURN AT A FOLD LINE. THEY REAR UP FIRST'),
  O: SIGN('THE LAST FLAP: KEEP HOLDING, STEP ONTO ITS PRINTED SIDE, THEN LET GO. OR IT TUCKS THE EXIT AWAY'),
  '1': FOLD({ mark: [19, 19], hinge: 26, y: 19, len: 5, g: 0 }),
  '2': FOLD({ mark: [46, 19], hinge: 55, y: 19, len: 6, g: 1 }),
  '3': FOLD({ mark: [79, 19], hinge: 86, y: 19, len: 5, g: 2 }),
  '4': FOLD({ mark: [134, 19], hinge: 142, y: 19, len: 6, last: true, cover: [152, 13, 162, 18], g: 3 }),
  x: ['decor', 'postTell'], a: ['anchor', 'pensOut']
}) };
stamps.postPensOld = oldRoom('fold@pensOut', ['oneup']);
const L4 = { n: 4, name: 'Forwarding Fold', mapLabel: 'Forwarding Fold', arch: 'fold', theme: 'post_fold',
  gimmick: 'At a crease, hold THROW and walk back: the far bank\'s flap folds over until the edges meet. Crease eels only turn at folds. The last flap only stays if you step onto its printed side before you let go',
  hint: 'Hold THROW all the way: let go early and it springs back. On the last one, still holding, walk onto the flap, then let go. A corner curls by a crease at the end of a bank...',
  postcard: 'Brady! I folded the far bank over to meet you, like a letter. You stepped across and said "forwarding address". I laughed for a whole page. ♥ C',
  enemies: [['postEel', 3], ['postPup', 1], ['postGull', 1]],
  mapCell: [3, 0], mapFrom: 2,
  exits: { main: { to: '27-5' } },
  areas: [
    { id: 'fold', gen: 'room', theme: 'post_fold', stamp: 'postFoldLand', post: { fold: true }, bottomKill: true },
    { id: 'pens', gen: 'room', role: 'secret', room: 'postDrop', theme: 'post_room_pens', stamp: 'postPensOld', post: { room: true } }
  ] };

/* ---------------- 27-5 Mismeasured Coast ---------------- */
// ① the teach: a map scale on the quay and a brass pin in a quay block out in the ink: walk right on the ruler and the
// block grows around the pin (its outline shows the size, slowly), step off the end and it locks: two short hops;
// ② the test: a tall card wall in the way: shrink it to a stub; a low tunnel roof beyond it (a corner curls down from
// a gap: the chute room); ③ the twist, at the last pin: one ruler enlarges a hanging wall until there is room to walk
// under it, a second ruler past it shrinks the high far quay down to jumping distance.
const coastRows = (() => {
  const W = 150, H = 24, Gr = grid(W, H, '.');
  ground(Gr, 0, 16, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 7, 15, '?'); put(Gr, 11, 18, '1');
  ink(Gr, 17, 36, 20); put(Gr, 27, 14, '*');
  ground(Gr, 37, 101, 19); put(Gr, 40, 18, 'c'); put(Gr, 38, 18, 'N'); put(Gr, 46, 18, '2'); put(Gr, 50, 15, '?');
  // the chute room: a low tunnel roof with a gap (a corner curls down), the run on top, the letterbox
  fillG(Gr, 60, 16, 68, 16, 'H'); fillG(Gr, 59, 8, 59, 16, 'H'); fillG(Gr, 69, 8, 69, 16, 'H'); fillG(Gr, 63, 16, 64, 16, '.'); put(Gr, 62, 17, 'x');
  put(Gr, 61, 14, 'o.o'); put(Gr, 65, 13, 'A'); put(Gr, 67, 15, 'D'); put(Gr, 61, 18, 'o.o.o');
  put(Gr, 72, 18, 'c'); put(Gr, 74, 18, 'a'); put(Gr, 70, 18, 'q'); put(Gr, 66, 18, 'e'); put(Gr, 56, 18, 'q');
  put(Gr, 77, 18, 'O'); put(Gr, 78, 18, '3'); put(Gr, 97, 18, '4');
  ink(Gr, 101, 105, 20); put(Gr, 103, 11, 'R');
  ground(Gr, 106, W - 1, 13); put(Gr, 110, 12, 'c'); put(Gr, 116, 12, 'u'); put(Gr, 124, 12, 'k'); put(Gr, 120, 9, 'o.o.o'); put(Gr, 128, 6, 'M'); put(Gr, 140, 12, 'G'); fillG(Gr, W - 1, 0, W - 1, 12, '#');
  return rowsOf(Gr);
})();
const SCALE = o => ['piece', 'post.scale', Object.assign({ smin: 0.5, smax: 2 }, o)];
stamps.postCoast = { floor: 19, rows: coastRows, gold: { '*': 'must', A: 'hidden', R: 'risky' }, items: ['power', 'power'], doors: [{ to: 'chutes@in', look: 'postFlap' }], legend: Object.assign({}, COMMON, {
  n: SIGN('A MAP SCALE! STOP ON THE RULER, THEN WALK RIGHT TO ENLARGE THE HARBOUR AROUND ITS BRASS PIN, LEFT TO SHRINK IT. STEP OFF THE END TO LOCK IT. RUN STRAIGHT OVER IT AND NOTHING CHANGES'),
  N: SIGN('SHRINKING PULLS EVERYTHING IN TOWARD THE PIN. BIG THINGS GET SMALL'),
  O: SIGN('THE LAST PIN HAS TWO RULERS: ONE BEFORE THE HANGING WALL, ONE AFTER IT'),
  '1': SCALE({ bars: [[9, 14, 19]], pin: [27, 19], pieces: [[24, 19, 29, 20]], checks: [{ bar: 0, end: 'big', idx: [0], g: 0 }] }),
  '2': SCALE({ bars: [[43, 48, 19]], pin: [54, 19], pieces: [[52, 9, 55, 18]], smin: 0.25, smax: 1.5, checks: [{ bar: 0, end: 'small', idx: [0], g: 1 }] }),
  '3': SCALE({ bars: [[78, 84, 19]], pin: [100, 19], pieces: [[90, 3, 93, 17]], checks: [{ bar: 0, end: 'big', idx: [0], g: 2 }] }),
  '4': SCALE({ bars: [[94, 99, 19]], pin: [100, 19], pieces: [[102, 13, 105, 13]], checks: [{ bar: 0, end: 'small', idx: [0], g: 3 }] }),
  x: ['decor', 'postTellCeil'], a: ['anchor', 'chutesOut']
}) };
stamps.postChutesOld = oldRoom('coast@chutesOut', ['oneup']);
const L5 = { n: 5, name: 'Mismeasured Coast', mapLabel: 'Mismeasured Coast', arch: 'scale', theme: 'post_chart',
  gimmick: 'A map scale on the quay: walk either way on the ruler to enlarge or shrink the printed harbour around its brass pin, step off the end to lock it. At the last pin, enlarge a hanging wall to walk under it, then shrink the far quay down to jumping distance',
  hint: 'The dashed outline is the size you are choosing; it changes slowly, so wait at the end before stepping off. A corner curls down from a tunnel roof...',
  postcard: 'Brady! This coast was drawn by someone who measured it with a teaspoon. You made the harbour bigger just by walking. Please don\'t try it on the hotel. ♥ C',
  enemies: [['postCrab', 1], ['postPup', 2], ['postGull', 1]],
  mapCell: [4, 0], mapFrom: 3,
  exits: { main: { to: '27-6' } },
  areas: [
    { id: 'coast', gen: 'room', theme: 'post_chart', stamp: 'postCoast', post: { scale: true }, bottomKill: true },
    { id: 'chutes', gen: 'room', role: 'secret', room: 'postFlip', theme: 'post_room_chutes', stamp: 'postChutesOld', post: { room: true } }
  ] };

/* ---------------- 27-6 Return to Sender (the boss) ---------------- */
// the sorting office: torn addresses barred by stacks of undelivered letters. Stand on an address's crease plate and
// its halves slide together under the incoming postmark (a dotted ring settles first): the whole address is
// cancelled and the stack lifts. A corner curls out of a pillar by the sorting desk's door (the collector's den, before
// the boss); then the desk itself, and the Postmaster's Thumb.
const returnRows = (() => {
  const W = 100, H = 22, Gr = grid(W, H, '.');
  ground(Gr, 0, W - 1, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 7, 15, '?'); put(Gr, 10, 15, '*'); put(Gr, 11, 18, '1');
  put(Gr, 30, 18, 'c'); put(Gr, 33, 18, 'N'); put(Gr, 35, 15, '?'); put(Gr, 38, 18, 'q'); put(Gr, 43, 18, 'e'); put(Gr, 48, 18, 'q'); put(Gr, 40, 18, '2'); put(Gr, 46, 12, 'R'); put(Gr, 44, 8, 'M');
  put(Gr, 63, 18, 'c'); put(Gr, 66, 18, 'i');
  // the collector's den: a fake wall in a pillar (a corner curls out of it), a passage, the door
  fillG(Gr, 70, 16, 72, 18, 'H'); fillG(Gr, 70, 17, 70, 18, 'F'); fillG(Gr, 71, 17, 72, 18, '.'); put(Gr, 69, 17, 'x'); put(Gr, 71, 17, 'A'); put(Gr, 72, 18, 'D');
  put(Gr, 80, 18, 'a'); put(Gr, 84, 18, 'k'); put(Gr, 90, 18, 'D'); put(Gr, 93, 18, 'l');
  fillG(Gr, W - 1, 0, W - 1, 18, '#');
  return rowsOf(Gr);
})();
const ADDR = o => ['piece', 'post.address', o];
stamps.postReturn = { floor: 19, rows: returnRows, gold: { '*': 'must', A: 'hidden', R: 'risky' }, items: ['power', 'power'], doors: [{ to: 'den@in', look: 'postSlit' }, { to: 'desk@in', look: 'postFlap' }], legend: Object.assign({}, COMMON, {
  n: SIGN('A TORN ADDRESS! STAND ON ITS CREASE PLATE: THE HALVES SLIDE TOGETHER. WHEN THE POSTMARK LANDS ON THE WHOLE ADDRESS, THE LETTERS LIFT'),
  N: SIGN('THE DOTTED RING SHOWS WHERE THE POSTMARK LANDS. DON\'T STAND UNDER IT'),
  '1': ADDR({ halves: [[12, 13], [20, 21]], y: 19, plate: [23, 19], drop: 16, barrier: [26, 11, 26, 18], period: 4.2, g: 0 }),
  '2': ADDR({ halves: [[41, 42], [51, 52]], y: 19, plate: [54, 19], drop: 46, barrier: [57, 10, 57, 18], period: 3.8, phase: 1.5, g: 1 }),
  x: ['decor', 'postTellWall'], a: ['anchor', 'denOut']
}) };
stamps.postDenOld = oldRoom('return@denOut', ['star'], 'postSlit');
const L6 = { n: 6, name: 'Return to Sender', mapLabel: 'Return to Sender', arch: 'lair', theme: 'post_office', boss: 'post_thumb',
  gimmick: 'The Postmaster\'s Thumb cancels everything on the sorting desk. Don\'t stomp it: get it to cancel a torn address, whole, and each completed address posts it back along its own arm',
  hint: 'Stand on the first address while the ring settles, then step out. Jump the ink stripe from the crease plate. Hold the crease for the first mark, step off for the second. A corner curls out of a pillar by the desk\'s door...',
  postcard: 'BRADY! You sent the thumb back up its own arm. It wrote "return to sender" on itself. It was very sorry. I forgave it. It has lovely penmanship. ♥ C',
  enemies: [['postCrab', 1], ['postGull', 1]],
  mapCell: [5, 0], mapFrom: 4,
  exits: { main: { to: null } },
  areas: [
    { id: 'return', gen: 'room', theme: 'post_office', stamp: 'postReturn', post: { address: true }, bottomKill: true },
    { id: 'den', gen: 'room', role: 'secret', room: 'postPeel', theme: 'post_room_den', stamp: 'postDenOld', post: { room: true } },
    { id: 'desk', gen: 'arena', role: 'arena', layout: 'desk', arenaW: 30, H: 18, roof: false, theme: 'post_arena', post: { boss: true } }
  ] };

Tour.amend('post', { stamps, levels: [L1, L2, L3, L4, L5, L6] });

/* ---------------- the land's map: the postcard's printed harbour ---------------- */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.post = {
  labels: { '27-1': 'Perforation Walk', '27-2': 'Stamp Duty', '27-3': 'Blotter Bay', '27-4': 'Forwarding Fold', '27-5': 'Mismeasured Coast', '27-6': 'Return to Sender' },
  w: 1520, h: 760,
  pal: { sea: '#3a5ad8', deep: '#1e3490', land: '#fbe6a2', light: '#fff4cc', path: '#f47a5a', beach: '#fff4cc', cliff: '#c8a254', roof: '#f47a5a', wall: '#fffdf4' },
  sea: 'waves', coast: 'postEdge', tufts: 'none', trail: 'dots', bridge: 'steps', meadow: false, woods: false, foam: false, birds: false,
  // the land is the postcard itself: a card with rounded corners (one corner dog-eared, the way in)
  land: [[[170, 120], [1360, 110], [1410, 160], [1420, 640], [1370, 700], [260, 710], [130, 600], [120, 170]]],
  nodes: { start: [240, 220], '27-1': [420, 560, 's'], '27-2': [620, 250, 'n'], '27-3': [840, 560, 's'], '27-4': [1040, 260, 'n'], '27-5': [1200, 560, 's'], '27-6': [1310, 300, 'n'] },
  paths: { 'start>27-1': [[300, 420]], '27-1>27-2': [[540, 400]], '27-2>27-3': [[720, 420]], '27-3>27-4': [[960, 400]], '27-4>27-5': [[1110, 420]], '27-5>27-6': [[1280, 440]] },
  feat: [
    ['sprite', 'postBoatS', 190, 680, 26], ['sprite', 'postQuayS', 420, 250, 36], ['sprite', 'postStampS', 660, 690, 22],
    ['sprite', 'postMarkS', 1120, 470, 40], ['sprite', 'postThumbS', 1360, 670, 30], ['sprite', 'postQuayS', 900, 680, 30]
  ],
  flora: ['rock'], density: 0,
  live: [['circle', 760, 120, 60, 0.6]]
};
})();
