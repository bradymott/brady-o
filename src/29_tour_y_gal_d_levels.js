/* ============================================================
   THE UNFLATTERING GALLERY: the levels (world 30) and the land's map. A hidden bonus land at about Nepal's level
   (d0 0.8): each stage teaches its one new idea where a slip costs nothing, tests it among the critters, then twists
   it ("late on / the last one"); the last ordinary stage and the boss are the hardest.
   30-1 HOLD STILL, DARLING (sitter)      fit Brady's outline into each portrait for a full breath; the last is Pupo
   30-2 A QUESTION OF PERSPECTIVE (vantage) roll the viewing frame till the scraps meet; the last has a false handrail
   30-3 UNDERPAINTING (scrape)            run the top coat off to free the old balcony; leave the last support alone
   30-4 HANG IT CROOKED (pivot)           walk past the hook and the frame turns over; then the picture-cord rack
   30-5 GOING ONCE (auction)              bid a handful of buttons on frames for the stair; let the decoy go
   30-6 THE GOOD SIDE (lair)              the posing mark catches his bad side, then the Retoucher himself
   Every stage's secret room is found the same way: a pale patch on the wallpaper where a picture used to hang, its
   empty hook left behind, right by the way in (a gap in a ceiling, a wall that is only canvas, a floor to drop through).
   ============================================================ */
(function () {
const C = Tour.countries.gal;
if (!C) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length && str[k] !== ' ') Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const pit = (Gr, x0, x1) => fillG(Gr, x0, 0, x1, Gr.length - 1, '.');
const varnish = (Gr, x0, x1, top) => { pit(Gr, x0, x1); fillG(Gr, x0, top, x1, Gr.length - 1, 'L'); };
const rowsOf = Gr => Gr.map(r => r.join(''));
const stamps = {};
// a secret room's old stamp: the way back out (its door) and its prize; the room kind builds the room from it
const oldRoom = (to, items, look) => ({ floor: 12, rows: ['##############################', '#............................#'].concat(Array(9).fill('#............................#')).concat(['#.@D.....................?...#', '##############################', '##############################']), items, doors: [{ to, look: look || 'galDoor' }] });
const SIGN = text => ['spawn', 'sign', { text }];
const ROPE = (id, h) => ['piece', 'gal.rope', { id, h: h || 5 }];
const COMMON = { k: ['decor', 'galBust'], l: ['decor', 'galPlant'], q: ['decor', 'galBench'], i: ['decor', 'galEasel'], x: ['decor', 'galTell'], p: ['decor', 'galPost'],
  u: ['enemy', 'galPigeon'], j: ['enemy', 'galToad'], M: ['enemy', 'galGnat'], w: ['enemy', 'galRope'] };
// a partition over a rope: the wall from the ceiling down to the rope's top (rows 0 .. top - 1)
const partition = (Gr, x, top) => fillG(Gr, x, 0, x, top - 1, 'H');

/* ---------------- 30-1 Hold Still, Darling ---------------- */
// ① the teach: a portrait with a standing outline missing (stand in it a breath: the rope lifts), then a crouching one;
// ② the test: a portrait up on a plinth (jump up to fit it), critters crossing the posing bench; a low passage under a
// panelled ceiling where a pale patch shows an empty hook (a gap in the ceiling: the run on top leads to the pigeon
// loft); ③ the twist: a crouch with a velvet rope critter about, then Pupo yawning: crouch on his plinth so the bent
// knee makes his lower lip.
const hallRows = (() => {
  const W = 176, H = 24, Gr = grid(W, H, '.');
  ground(Gr, 0, 131, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 8, 15, '?'); put(Gr, 10, 14, '*');
  put(Gr, 13, 18, '1'); partition(Gr, 18, 14); put(Gr, 18, 18, 'r');
  put(Gr, 21, 15, 'o.o'); put(Gr, 25, 18, '2'); partition(Gr, 31, 14); put(Gr, 31, 18, 'R');
  put(Gr, 34, 18, 'k'); put(Gr, 36, 18, 'c'); put(Gr, 40, 15, 'o.o.o'); put(Gr, 44, 18, 'u'); put(Gr, 46, 15, '?'); put(Gr, 48, 11, 'M');
  // the plinth portrait
  fillG(Gr, 52, 17, 53, 18, 'B'); put(Gr, 52, 16, '3'); put(Gr, 50, 18, 'N'); partition(Gr, 58, 14); put(Gr, 58, 18, 'P');
  // the low passage under a panelled ceiling, its walls up from the ends; a gap in the ceiling (the pale patch below)
  fillG(Gr, 65, 16, 81, 16, 'H'); fillG(Gr, 64, 7, 64, 16, 'H'); fillG(Gr, 82, 7, 82, 16, 'H'); fillG(Gr, 72, 16, 73, 16, '.'); put(Gr, 71, 18, 'x');
  put(Gr, 66, 18, 'o.o.o'); put(Gr, 76, 18, 'o.o');
  // the run on the ceiling: coins, a gnat, the hidden 1UP, P2, the loft's door
  put(Gr, 66, 15, 'o.o.o'); put(Gr, 70, 12, 'h'); put(Gr, 76, 12, 'M'); put(Gr, 78, 13, 'A'); put(Gr, 80, 15, 'D');
  put(Gr, 86, 18, 'q'); put(Gr, 90, 18, 'a'); put(Gr, 92, 18, 'c'); put(Gr, 96, 18, 'l');
  // ③ a crouch with a velvet rope (the critter) about
  put(Gr, 100, 18, '4'); put(Gr, 108, 18, 'w'); partition(Gr, 112, 14); put(Gr, 112, 18, 'X'); put(Gr, 104, 14, 'o.o.o');
  // Pupo's portrait on its plinth
  fillG(Gr, 120, 17, 121, 18, 'B'); put(Gr, 120, 16, '5'); put(Gr, 117, 18, 'O'); partition(Gr, 127, 14); put(Gr, 127, 18, 'Y');
  // a varnish pit with gnats, P3 over it; on to the gate
  varnish(Gr, 132, 135, 21); put(Gr, 133, 13, 'E'); put(Gr, 134, 10, 'M');
  ground(Gr, 136, W - 1, 19); put(Gr, 140, 18, 'j'); put(Gr, 146, 15, 'o.o.o'); put(Gr, 150, 18, 'u'); put(Gr, 156, 18, 'k'); put(Gr, 165, 18, 'G'); fillG(Gr, W - 1, 0, W - 1, 18, '#');
  return rowsOf(Gr);
})();
const SIT = (pose, lock, o) => ['piece', 'gal.sitter', Object.assign({ pose, lock, who: 'piwi' }, o || {})];
stamps.galHall = { floor: 19, rows: hallRows, gold: { '*': 'must', A: 'hidden', E: 'risky' }, items: ['power', 'power'], hidden: ['oneup'], doors: [{ to: 'loft@in', look: 'galHatch' }], legend: Object.assign({}, COMMON, {
  n: SIGN('A PORTRAIT WITH A PIECE MISSING. STAND IN THE OUTLINE AND HOLD STILL'),
  N: SIGN('UP ON THE PLINTH. FIT THE OUTLINE'),
  O: SIGN('PUPO, YAWNING. YOUR KNEE IS HIS LOWER LIP'),
  '1': SIT('stand', 'gal:h1', { side: 1 }), '2': SIT('crouch', 'gal:h2', { side: -1 }), '3': SIT('stand', 'gal:h3', { side: 1 }), '4': SIT('crouch', 'gal:h4', { side: 1 }), '5': SIT('crouch', 'gal:h5', { who: 'pupo' }),
  r: ROPE('gal:h1'), R: ROPE('gal:h2'), P: ROPE('gal:h3'), X: ROPE('gal:h4'), Y: ROPE('gal:h5'),
  a: ['anchor', 'loftOut']
}) };
stamps.galLoftOld = oldRoom('hall@loftOut', ['oneup']);
const L1 = { n: 1, name: 'Hold Still, Darling', mapLabel: 'Hold Still, Darling', arch: 'sitter', theme: 'gal_hall',
  gimmick: 'Portraits with a piece missing: put Brady\'s outline into the gap (stand, crouch or hop up onto the plinth) and hold still for a full breath. The last portrait is Pupo yawning',
  hint: 'Stand still in the dashed outline until the ring fills. The ▼ ones mean crouch. A pale patch on the wall where a picture used to hang...',
  postcard: 'Brady! Piwi sat for forty portraits and opened his mouth in every one. I asked the painter. He said "it never shuts, madam". ♥ C',
  enemies: [['galPigeon', 2], ['galToad', 1], ['galGnat', 3], ['galRope', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '30-2' } },
  areas: [
    { id: 'hall', gen: 'room', theme: 'gal_hall', stamp: 'galHall', gal: { sitter: true }, bottomKill: true },
    { id: 'loft', gen: 'room', role: 'secret', room: 'galSteps', theme: 'gal_room_loft', stamp: 'galLoftOld', gal: { room: true } }
  ] };

Tour.amend('gal', { stamps, levels: [L1] });

/* ---------------- the land's map: the gallery floor plan ---------------- */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.gal = {
  labels: { '30-1': 'Hold Still, Darling', '30-2': 'A Question of Perspective', '30-3': 'Underpainting', '30-4': 'Hang It Crooked', '30-5': 'Going Once', '30-6': 'The Good Side' },
  w: 1520, h: 760,
  pal: { sea: '#3a2a3e', deep: '#24182a', land: '#d8c4b8', light: '#efe2d6', path: '#e2b33a', beach: '#efe2d6', cliff: '#844070', roof: '#5a2346', wall: '#f4efe4' },
  sea: 'waves', tufts: 'none', trail: 'dots', bridge: 'steps', meadow: false, woods: false, foam: false, birds: false,
  // the land is a gallery floor plan: three rooms in an L, the way in at the corner
  land: [[[150, 140], [760, 120], [800, 300], [1380, 290], [1410, 660], [880, 690], [600, 640], [160, 660], [120, 400]]],
  nodes: { start: [230, 230], '30-1': [330, 520, 's'], '30-2': [560, 280, 'n'], '30-3': [700, 540, 's'], '30-4': [960, 420, 'n'], '30-5': [1130, 600, 's'], '30-6': [1290, 400, 'n'] },
  paths: { 'start>30-1': [[250, 400]], '30-1>30-2': [[440, 380]], '30-2>30-3': [[640, 420]], '30-3>30-4': [[820, 470]], '30-4>30-5': [[1040, 520]], '30-5>30-6': [[1230, 520]] },
  feat: [
    ['sprite', 'galFrameS', 430, 210, 30], ['sprite', 'galBustS', 220, 590, 26], ['sprite', 'galOvalS', 700, 190, 26],
    ['sprite', 'galEaselS', 830, 620, 26], ['sprite', 'galRopeS', 1060, 360, 26], ['sprite', 'galFrameS', 1330, 640, 30], ['sprite', 'galBustS', 1220, 330, 24]
  ],
  flora: ['rock'], density: 0,
  live: []
};
})();
