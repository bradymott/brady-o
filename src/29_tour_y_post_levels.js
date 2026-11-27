/* ============================================================
   POSTMARK SOUND: the levels (world 27) and the land's map. A hidden bonus land at about Nepal's level (d0 0.8):
   each stage teaches its one new idea where a slip costs nothing, tests it among the critters, then twists it
   ("late on / the last one"); the last ordinary stage and the boss are the hardest.
   27-1 PERFORATION WALK (perforate)  tear paper islands free so they fall and plug the ink; the last two share a tooth
   27-2 STAMP DUTY (stampduty)        roll a loose stamp, THROW prints a mirrored foothold; the last is an L
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
  ground(Gr, 41, 58, 17); put(Gr, 43, 16, 'q'); put(Gr, 46, 16, 'c'); put(Gr, 49, 13, '?'); put(Gr, 52, 16, 'e'); put(Gr, 56, 16, 'q');
  // ② the test: two more islands
  ground(Gr, 59, 64, 17); put(Gr, 60, 16, 'N'); put(Gr, 63, 16, '2');
  ink(Gr, 65, 74, 19); put(Gr, 68, 12, 'o.o'); put(Gr, 72, 10, 'M');
  ground(Gr, 75, 92, 19); put(Gr, 79, 18, 'k'); put(Gr, 84, 18, 'u'); put(Gr, 90, 18, 'c');
  ground(Gr, 93, 94, 18); ground(Gr, 95, 96, 17); ground(Gr, 97, 100, 16); put(Gr, 99, 15, '3');
  ink(Gr, 101, 110, 18); put(Gr, 104, 9, 'M');
  ground(Gr, 111, 140, 18);
  // the low tunnel under a thin card ceiling, walls up from its ends; a gap in the ceiling (a corner curls down)
  fillG(Gr, 113, 15, 130, 15, 'H'); fillG(Gr, 112, 7, 112, 15, 'H'); fillG(Gr, 131, 7, 131, 15, 'H');
  fillG(Gr, 121, 15, 122, 15, '.'); put(Gr, 120, 16, 'x');
  put(Gr, 115, 17, 'o.o.o'); put(Gr, 125, 17, 'o.o');
  // the run on top of the ceiling: coins, a gull, the hidden 1UP, P2, the press's letterbox
  put(Gr, 114, 13, 'o.o.o'); put(Gr, 117, 10, 'h'); put(Gr, 124, 10, 'M'); put(Gr, 126, 12, 'A'); put(Gr, 129, 14, 'D');
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
  enemies: [['postCrab', 2], ['postPup', 2], ['postGull', 3]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '27-2' } },
  areas: [
    { id: 'perf', gen: 'room', theme: 'post_sound', stamp: 'postPerf', post: { perf: true }, bottomKill: true },
    { id: 'press', gen: 'room', role: 'secret', theme: 'post_room_press', stamp: 'postPressOld', post: { room: true } }
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
  ink(Gr, 151, 154, 20); put(Gr, 152, 13, 'M'); put(Gr, 151, 15, 'o.o.o');
  ground(Gr, 155, W - 1, 19); put(Gr, 160, 18, 'l'); put(Gr, 166, 18, 'k'); put(Gr, 172, 18, 'G'); fillG(Gr, W - 1, 0, W - 1, 18, '#');
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
    { id: 'bureau', gen: 'room', role: 'secret', theme: 'post_room_bureau', stamp: 'postBureauOld', post: { room: true } }
  ] };

Tour.amend('post', { stamps, levels: [L1, L2] });

/* ---------------- the land's map: the postcard's printed harbour ---------------- */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.post = {
  labels: { '27-1': 'Perforation Walk', '27-2': 'Stamp Duty', '27-3': 'Blotter Bay', '27-4': 'Forwarding Fold', '27-5': 'Mismeasured Coast', '27-6': 'Return to Sender' },
  w: 1520, h: 760,
  pal: { sea: '#3a5ad8', deep: '#1e3490', land: '#fbe6a2', light: '#fff4cc', path: '#f47a5a', beach: '#fff4cc', cliff: '#c8a254', roof: '#f47a5a', wall: '#fffdf4' },
  sea: 'waves', coast: 'postEdge', tufts: 'none', trail: 'dots', bridge: 'steps', meadow: false, woods: false, foam: false, birds: false,
  land: [[[120, 640], [110, 400], [170, 190], [380, 140], [600, 170], [700, 300], [780, 420], [880, 400], [940, 250], [1040, 130], [1260, 110], [1420, 200], [1440, 420], [1390, 650], [1160, 720], [760, 730], [400, 720]]],
  nodes: { start: [230, 620], '27-1': [300, 360, 'n'], '27-2': [520, 560, 's'], '27-3': [760, 620, 's'], '27-4': [980, 330, 'n'], '27-5': [1180, 220, 'n'], '27-6': [1270, 560, 's'] },
  paths: { 'start>27-1': [[240, 480]], '27-1>27-2': [[400, 480]], '27-2>27-3': [[640, 600]], '27-3>27-4': [[880, 500]], '27-4>27-5': [[1080, 260]], '27-5>27-6': [[1260, 400]] },
  feat: [
    ['sprite', 'postBoatS', 190, 680, 26], ['sprite', 'postQuayS', 420, 250, 36], ['sprite', 'postStampS', 660, 690, 22],
    ['sprite', 'postMarkS', 1120, 470, 40], ['sprite', 'postThumbS', 1360, 670, 30], ['sprite', 'postQuayS', 900, 680, 30]
  ],
  flora: ['rock'], density: 0,
  live: [['circle', 760, 120, 60, 0.6]]
};
})();
