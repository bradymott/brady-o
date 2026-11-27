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
  u: ['enemy', 'galPigeon'], j: ['enemy', 'galVarnish'], M: ['enemy', 'galGnat'], w: ['enemy', 'galVelvet'] };
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
  put(Gr, 34, 18, 'k'); put(Gr, 36, 18, 'c'); put(Gr, 40, 15, 'o.o.o'); put(Gr, 44, 18, 'u'); put(Gr, 46, 15, '?'); put(Gr, 48, 14, 'M');
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
  varnish(Gr, 132, 135, 21); put(Gr, 133, 13, 'E'); put(Gr, 134, 14, 'M');
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
  enemies: [['galPigeon', 2], ['galVarnish', 1], ['galGnat', 3], ['galVelvet', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '30-2' } },
  areas: [
    { id: 'hall', gen: 'room', theme: 'gal_hall', stamp: 'galHall', gal: { sitter: true }, bottomKill: true },
    { id: 'loft', gen: 'room', role: 'secret', room: 'galSteps', theme: 'gal_room_loft', stamp: 'galLoftOld', gal: { room: true } }
  ] };

/* ---------------- 30-2 A Question of Perspective ---------------- */
// ① the teach: a viewing frame on a rail before a long varnish channel: roll it till the two halves of a painted
// bridge meet in its window, hold still a breath, the bridge is real; ② the test: another frame with a pigeon on the
// rail and gnats over the channel; a panel by a pale patch is only canvas (walk in: the framer's workshop); ③ the twist:
// a cliff with a painted stair; the handrail meets one spot early (it glows), the stair needs one more nudge.
const longRows = (() => {
  const W = 176, H = 24, Gr = grid(W, H, '.');
  ground(Gr, 0, 20, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 7, 15, '?'); put(Gr, 9, 18, '1');
  varnish(Gr, 21, 32, 21); put(Gr, 26, 13, 'o.o.o');
  ground(Gr, 33, 49, 19); put(Gr, 34, 18, 'c'); put(Gr, 38, 18, 'N'); put(Gr, 40, 18, '2'); put(Gr, 46, 18, 'u');
  varnish(Gr, 50, 61, 21); put(Gr, 55, 14, '*'); put(Gr, 54, 13, 'M');
  ground(Gr, 62, 118, 19); put(Gr, 66, 15, '?'); put(Gr, 68, 18, 'l'); put(Gr, 84, 18, 'j');
  // the canvas panel: a pillar of panelling whose foot is only painted canvas (the pale patch beside it)
  fillG(Gr, 74, 12, 77, 18, 'H'); fillG(Gr, 74, 17, 74, 18, 'F'); fillG(Gr, 75, 17, 77, 18, '.'); put(Gr, 73, 18, 'x'); put(Gr, 75, 17, 'A'); put(Gr, 77, 18, 'D');
  put(Gr, 82, 18, 'k'); put(Gr, 86, 15, 'h'); put(Gr, 90, 18, 'a'); put(Gr, 94, 18, 'c'); put(Gr, 96, 18, 'O'); put(Gr, 98, 18, '3'); put(Gr, 104, 14, 'M');
  // the cliff the painted stair climbs
  ground(Gr, 119, W - 1, 12); put(Gr, 124, 11, 'w'); put(Gr, 130, 8, 'o.o.o');
  varnish(Gr, 135, 139, 14); put(Gr, 137, 8, 'E'); put(Gr, 152, 9, 'M');
  put(Gr, 146, 11, 'j'); put(Gr, 152, 11, 'u'); put(Gr, 158, 11, 'k'); put(Gr, 166, 11, 'G'); fillG(Gr, W - 1, 0, W - 1, 11, '#');
  return rowsOf(Gr);
})();
const VIEW = o => ['piece', 'gal.viewer', o];
stamps.galLong = { floor: 19, rows: longRows, gold: { '*': 'must', A: 'hidden', E: 'risky' }, items: ['power', 'power'], hidden: ['oneup'], doors: [{ to: 'framer@in', look: 'galHatch' }], legend: Object.assign({}, COMMON, {
  n: SIGN('A VIEWING FRAME. WALK IT ALONG TILL THE HALVES MEET'),
  N: SIGN('HOLD IT STILL A BREATH: THE BRIDGE GETS REAL'),
  O: SIGN('THE RAIL MEETING ISN\'T THE STAIR MEETING'),
  '1': VIEW({ rail: [9, 17, 19], at: 9, good: 15, obj: [21, 19, 32, 19], kind: 'bridge', g: 0 }),
  '2': VIEW({ rail: [40, 47, 19], at: 40, good: 44, obj: [50, 19, 61, 19], kind: 'bridge', g: 1 }),
  '3': VIEW({ rail: [98, 114, 19], at: 98, good: 111, decoy: 108, obj: [112, 12, 118, 18], kind: 'stair', g: 2 }),
  a: ['anchor', 'framerOut']
}) };
stamps.galFramerOld = oldRoom('long@framerOut', ['oneup']);
const L2 = { n: 2, name: 'A Question of Perspective', mapLabel: 'A Question of Perspective', arch: 'vantage', theme: 'gal_long',
  gimmick: 'Roll a wheeled viewing frame along its rail until two painted scraps meet in its window: hold it still for a full breath and they become one real bridge or stair. In the last frame the handrail lines up early; the stair needs one more nudge',
  hint: 'Stand at the frame and walk to roll it. Watch the dashed halves: where they meet, the edge glows. Wait for the ring. A pale patch where a picture used to hang...',
  postcard: 'Brady! A man in this gallery stood in one spot for an hour so two paintings lined up. Then he walked across them. I clapped. ♥ C',
  enemies: [['galPigeon', 2], ['galVarnish', 2], ['galGnat', 3], ['galVelvet', 1]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '30-3' } },
  areas: [
    { id: 'long', gen: 'room', theme: 'gal_long', stamp: 'galLong', gal: { vantage: true }, bottomKill: true },
    { id: 'framer', gen: 'room', role: 'secret', room: 'galNest', theme: 'gal_room_framer', stamp: 'galFramerOld', gal: { room: true } }
  ] };

/* ---------------- 30-3 Underpainting ---------------- */
// ① the teach: a brush ridge on the floor before a tall wall: RUN across it and the old painted balcony steps appear
// up the wall (walking only polishes it); ② the test: a ridge whose balcony crosses a varnish channel, critters on the
// floor; a hole in the floor by a pale patch drops to the cloakroom; ③ the twist: two ridges at the last channel: run
// the one on the ledge (it gives the balcony), WALK the one over the varnish (it holds you up and gives nothing).
const studioRows = (() => {
  const W = 180, H = 24, Gr = grid(W, H, '.');
  ground(Gr, 0, 29, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 8, 15, '?'); put(Gr, 12, 18, '1');
  ground(Gr, 30, 62, 12); put(Gr, 27, 10, '*'); put(Gr, 34, 11, 'c'); put(Gr, 40, 11, 'u'); put(Gr, 44, 8, '?'); put(Gr, 48, 8, 'o.o.o'); put(Gr, 55, 11, 'i'); put(Gr, 58, 8, 'M');
  ground(Gr, 63, 73, 19); put(Gr, 64, 18, 'N'); put(Gr, 66, 18, '2'); put(Gr, 71, 18, 'j');
  varnish(Gr, 74, 85, 21); put(Gr, 79, 15, 'M');
  ground(Gr, 86, 110, 19); put(Gr, 88, 18, 'c'); put(Gr, 96, 18, 'w');
  // the hole in the floor by a pale patch: a short drop to a passage under the floor and the cloakroom's door
  fillG(Gr, 92, 19, 93, 19, '.'); fillG(Gr, 92, 20, 99, 22, '.'); put(Gr, 91, 18, 'x'); put(Gr, 95, 21, 'A'); put(Gr, 98, 22, 'D');
  put(Gr, 104, 18, 'a'); put(Gr, 106, 18, 'k');
  // the twist: the ledge's ridge (run it: the balcony), then the ridge over the varnish (walk it: it holds you up)
  put(Gr, 109, 18, '3'); varnish(Gr, 111, 132, 21); put(Gr, 111, 18, 'O'); put(Gr, 113, 18, '4'); put(Gr, 116, 15, 'E'); put(Gr, 124, 15, 'M');
  ground(Gr, 133, W - 1, 19); put(Gr, 136, 18, 'u'); put(Gr, 142, 15, 'o.o.o'); put(Gr, 154, 18, 'l'); put(Gr, 168, 18, 'G'); fillG(Gr, W - 1, 0, W - 1, 18, '#');
  return rowsOf(Gr);
})();
const RIDGE = o => ['piece', 'gal.ridge', o];
stamps.galStudio = { floor: 19, rows: studioRows, gold: { '*': 'must', A: 'hidden', E: 'risky' }, items: ['power', 'power'], doors: [{ to: 'cloak@in', look: 'galHatch' }], legend: Object.assign({}, COMMON, {
  n: SIGN('THICK TOP COAT. HOLD RUN ACROSS IT TO SCRAPE'),
  N: SIGN('THE FAINT SHAPE SHOWS WHAT IS UNDERNEATH'),
  O: SIGN('THIS RIDGE HOLDS YOU UP. LET GO OF RUN'),
  '1': RIDGE({ cells: [12, 19, 19], reveal: [[22, 16, 24, 16], [26, 13, 28, 13]], g: 0 }),
  '2': RIDGE({ cells: [66, 72, 19], reveal: [[74, 19, 85, 19]], g: 1 }),
  '3': RIDGE({ cells: [104, 110, 19], reveal: [[121, 19, 132, 19]], g: 2 }),
  '4': RIDGE({ cells: [111, 120, 19], reveal: [], solid: true }),
  a: ['anchor', 'cloakOut']
}) };
stamps.galCloakOld = oldRoom('studio@cloakOut', ['oneup']);
const L3 = { n: 3, name: 'Underpainting', mapLabel: 'Underpainting', arch: 'scrape', theme: 'gal_studio',
  gimmick: 'Thick brush ridges of top coat: cross one holding RUN and Brady\'s shoes scrape it off, showing the older painting beneath: its painted balcony becomes solid, but the ridge is gone. At the last channel one ridge gives the balcony and the other is what you stand on',
  hint: 'Hold RUN over a ridge to scrape it; let go of RUN to keep it. The faint shape beside a ridge is what it will show. A pale patch where a picture used to hang...',
  postcard: 'Brady, under the portrait of Piwi there was an older portrait of Piwi. Under that, a balcony. Under the balcony, more Piwi. ♥ C',
  enemies: [['galPigeon', 2], ['galVarnish', 1], ['galGnat', 3], ['galVelvet', 1]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '30-4' } },
  areas: [
    { id: 'studio', gen: 'room', theme: 'gal_studio', stamp: 'galStudio', gal: { scrape: true }, bottomKill: true },
    { id: 'cloak', gen: 'room', role: 'secret', room: 'galQueue', theme: 'gal_room_cloak', stamp: 'galCloakOld', gal: { room: true } }
  ] };

/* ---------------- 30-4 Hang It Crooked ---------------- */
// frames hang from a low picture rail over the gaps (too low to jump under it): walk along a frame's bottom edge and
// on past the hook: it turns over and hangs from the next hook, its edge under your feet. ① the teach over a safe floor;
// ② the test: two frames over the varnish; the last one, turned, sits under a gap in the rail (a pale patch on the
// ledge beside it): up through it to the paint store; then the picture-cord rack: climb it, critters on both faces
// (squeeze through a brass ring to pass one); ③ the twist: two more frames up top with a gnat in the low corridor.
const hangRows = (() => {
  const W = 172, H = 24, Gr = grid(W, H, '.');
  ground(Gr, 0, 9, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 6, 15, '?'); fillG(Gr, 8, 18, 9, 18, 'B'); put(Gr, 9, 17, 'B');
  ground(Gr, 10, 16, 14); fillG(Gr, 12, 11, 56, 11, 'H'); put(Gr, 16, 13, '1');
  ground(Gr, 17, 22, 19); fillG(Gr, 17, 17, 17, 18, 'B'); put(Gr, 18, 18, 'B'); put(Gr, 19, 17, 'o.o');
  ground(Gr, 23, 30, 14); put(Gr, 26, 13, 'c'); put(Gr, 28, 13, '*'); put(Gr, 30, 13, '2'); put(Gr, 29, 13, '9');
  varnish(Gr, 31, 42, 21); put(Gr, 36, 16, 'o.o.o');
  ground(Gr, 43, 56, 14); put(Gr, 43, 13, 'x'); put(Gr, 46, 13, 'u'); put(Gr, 50, 13, 'c'); put(Gr, 62, 15, '?');
  // the gap in the rail over the second frame's turned place, the run on top of the rail, the paint store's hatch
  fillG(Gr, 41, 11, 42, 11, '.'); fillG(Gr, 40, 4, 40, 11, 'H'); fillG(Gr, 57, 4, 57, 11, 'H'); put(Gr, 44, 10, 'o.o.o'); put(Gr, 48, 7, 'A'); put(Gr, 52, 7, 'h'); put(Gr, 55, 10, 'D');
  // down to the floor and the picture-cord rack up to the high ledge
  ground(Gr, 57, 73, 19); put(Gr, 60, 18, 'a'); put(Gr, 62, 18, 'N'); put(Gr, 66, 8, 'R'); put(Gr, 68, 9, 'e'); put(Gr, 70, 12, 'f');
  ground(Gr, 74, 95, 9); put(Gr, 78, 8, 'c'); put(Gr, 84, 8, 'w'); put(Gr, 88, 5, 'o.o.o'); put(Gr, 92, 8, 'O');
  fillG(Gr, 92, 6, 120, 6, 'H'); put(Gr, 95, 8, '3');
  varnish(Gr, 96, 107, 21); put(Gr, 101, 8, 'E'); put(Gr, 112, 8, 'u');
  ground(Gr, 108, W - 1, 9); put(Gr, 101, 8, 'E'); put(Gr, 107, 8, '4'); put(Gr, 112, 8, 'j'); put(Gr, 124, 5, 'o.o.o'); put(Gr, 130, 8, 'u'); put(Gr, 140, 8, 'k'); put(Gr, 150, 8, 'G'); fillG(Gr, W - 1, 0, W - 1, 8, '#');
  return rowsOf(Gr);
})();
const TUMBLE = o => ['piece', 'gal.tumble', Object.assign({ n: 3, dir: 1 }, o)];
stamps.galHang = { floor: 19, rows: hangRows, gold: { '*': 'must', A: 'hidden', E: 'risky' }, items: ['power', 'power'], hidden: ['oneup'], doors: [{ to: 'paint@in', look: 'galHatch' }], legend: Object.assign({}, COMMON, {
  n: SIGN('A FRAME ON A RAIL. WALK ON PAST ITS HOOK'),
  N: SIGN('PUSH UP INTO THE CORDS TO CLIMB. JUMP AT A RING'),
  O: SIGN('TWO MORE. MIND THE GNAT IN THE GAP'),
  '1': TUMBLE({ L: 17, top: 12, g: 0 }),
  '2': TUMBLE({ L: 31, top: 12, g: 1 }), '9': TUMBLE({ L: 37, top: 12, g: 2 }),
  R: ['piece', 'gal.rack', { w: 8, h: 10, holes: [[2, 3], [5, 6]] }],
  e: ['piece', 'gal.crawler', { face: 0, ay: 6, speed: 1.2 }], f: ['piece', 'gal.crawler', { face: 1, ax: 3, speed: 1.0 }],
  '3': TUMBLE({ L: 96, top: 7, g: 3 }), '4': TUMBLE({ L: 102, top: 7, g: 4 }),
  a: ['anchor', 'paintOut']
}) };
stamps.galPaintOld = oldRoom('hang@paintOut', ['oneup']);
const L4 = { n: 4, name: 'Hang It Crooked', mapLabel: 'Hang It Crooked', arch: 'pivot', theme: 'gal_hang',
  gimmick: 'Square frames hang from a low picture rail over the gaps. Walk along a frame\'s bottom edge and on past its hook: it turns a quarter over and hangs from the next hook, its edge right under your feet. Then the picture-cord rack: climb both faces',
  hint: 'Keep walking past the end of the frame: it turns under you. Walk back past it to turn it back. On the cords, push UP to grip and JUMP at a brass ring to cross. A pale patch where a picture used to hang...',
  postcard: 'Brady! Every picture in this room is crooked. I straightened one and the whole wall sighed at me. ♥ C',
  enemies: [['galPigeon', 2], ['galVarnish', 1], ['galGnat', 1], ['galVelvet', 1]],
  mapCell: [3, 0], mapFrom: 2,
  exits: { main: { to: '30-5' } },
  areas: [
    { id: 'hang', gen: 'room', theme: 'gal_hang', stamp: 'galHang', gal: { pivot: true }, bottomKill: true },
    { id: 'paint', gen: 'room', role: 'secret', room: 'galChange', theme: 'gal_room_paint', stamp: 'galPaintOld', gal: { room: true } }
  ] };

/* ---------------- 30-5 Going Once ---------------- */
// a portrait auction: a paddle gives a small handful of buttons; each lot's frame fills a missing step in the stair
// up the next wall. ① the teach: three buttons, one lot of two; ② the test: four buttons, a lot of one and a lot of
// three for a two-step stair; a gap in the top floor by a pale patch drops to the catalogue press; ③ the twist: five
// buttons, a handsome decoy at three and a wide lot at four that fills two steps hung sideways: let the decoy go.
const aucRows = (() => {
  const W = 176, H = 24, Gr = grid(W, H, '.');
  ground(Gr, 0, 19, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 8, 15, '?'); put(Gr, 8, 18, 'P'); put(Gr, 13, 18, '1');
  ground(Gr, 20, 36, 13); put(Gr, 24, 12, 'c'); put(Gr, 28, 12, 'u'); put(Gr, 32, 9, 'o.o');
  ground(Gr, 37, 53, 19); put(Gr, 39, 18, 'N'); put(Gr, 41, 18, 'J'); put(Gr, 44, 18, '2'); put(Gr, 47, 18, '3'); put(Gr, 45, 15, '*'); put(Gr, 38, 14, 'M');
  ground(Gr, 54, 80, 10); put(Gr, 58, 9, 'c'); put(Gr, 62, 9, 'j'); put(Gr, 66, 6, '?');
  // the gap in the top floor by a pale patch: a short drop into a passage in the wall, the press's door
  fillG(Gr, 70, 10, 71, 11, '.'); fillG(Gr, 66, 12, 77, 13, '.'); put(Gr, 69, 9, 'x'); put(Gr, 68, 13, 'A'); put(Gr, 76, 13, 'D');
  ground(Gr, 81, 108, 19); put(Gr, 84, 18, 'c'); put(Gr, 85, 18, 'a'); put(Gr, 86, 18, 'O'); put(Gr, 88, 18, 'Z'); put(Gr, 92, 18, '4'); put(Gr, 98, 18, '5'); put(Gr, 95, 14, 'M');
  ground(Gr, 109, W - 1, 10); put(Gr, 114, 9, 'u'); put(Gr, 120, 6, 'o.o.o'); put(Gr, 122, 9, 'w');
  varnish(Gr, 128, 131, 14); put(Gr, 129, 6, 'E'); put(Gr, 130, 6, 'M');
  put(Gr, 138, 9, 'j'); put(Gr, 146, 9, 'k'); put(Gr, 160, 9, 'G'); fillG(Gr, W - 1, 0, W - 1, 9, '#');
  return rowsOf(Gr);
})();
const LOT = o => ['piece', 'gal.lot', o], PADDLE = n => ['piece', 'gal.paddle', { n }];
stamps.galAuction = { floor: 19, rows: aucRows, gold: { '*': 'must', A: 'hidden', E: 'risky' }, items: ['power', 'power'], doors: [{ to: 'print@in', look: 'galHatch' }], legend: Object.assign({}, COMMON, {
  n: SIGN('TAKE A PADDLE. THROW AT A PODIUM TO BID'),
  N: SIGN('BUTTONS DON\'T COME BACK. COUNT FIRST'),
  O: SIGN('HANDSOME ISN\'T USEFUL. THROW AGAIN FOR A REFUND'),
  P: PADDLE(3), J: PADDLE(4), Z: PADDLE(5),
  '1': LOT({ price: 2, gaps: [[18, 16, 19, 16]], g: 0 }),
  '2': LOT({ price: 1, gaps: [[50, 16, 51, 16]], g: 1 }),
  '3': LOT({ price: 3, gaps: [[52, 13, 53, 13]], g: 2 }),
  '4': LOT({ price: 3, gaps: [], decoy: true }),
  '5': LOT({ price: 4, gaps: [[105, 16, 106, 16], [107, 13, 108, 13]], g: 3 }),
  a: ['anchor', 'printOut']
}) };
stamps.galPrintOld = oldRoom('auction@printOut', ['oneup']);
const L5 = { n: 5, name: 'Going Once', mapLabel: 'Going Once', arch: 'auction', theme: 'gal_auction',
  gimmick: 'A portrait auction: take a paddle with a small handful of buttons and THROW at a podium to bid. A sold frame flies to the dashed gap it fits and becomes a step. Late on, a handsome decoy costs three and a wide frame costs four: it fills two steps hung sideways',
  hint: 'Count the buttons on the paddle, then the prices on the podiums. THROW at a sold podium to send it back for a refund. A pale patch where a picture used to hang...',
  postcard: 'Brady, I bid on a portrait of Piwi with his mouth open. Nobody bid against me. Nobody. Not even Piwi. ♥ C',
  enemies: [['galPigeon', 2], ['galVarnish', 2], ['galGnat', 3], ['galVelvet', 1]],
  mapCell: [4, 0], mapFrom: 3,
  exits: { main: { to: '30-6' } },
  areas: [
    { id: 'auction', gen: 'room', theme: 'gal_auction', stamp: 'galAuction', gal: { auction: true }, bottomKill: true },
    { id: 'print', gen: 'room', role: 'secret', room: 'galSold', theme: 'gal_room_print', stamp: 'galPrintOld', gal: { room: true } }
  ] };

/* ---------------- 30-6 The Good Side (the boss) ---------------- */
// the grand salon: the Retoucher's huge self-portrait looks down at his posing mark. Roll the mark until the sight
// line from his painted eye catches the embarrassing card on its easel, hold a breath: that sitting's rope lifts.
// Twice. A pale patch beside a panelled pillar (only canvas at its foot): the private collection, before the boss;
// then the studio's door and the Retoucher.
const salonRows = (() => {
  const W = 100, H = 22, Gr = grid(W, H, '.');
  ground(Gr, 0, W - 1, 19); put(Gr, 3, 18, '@'); put(Gr, 5, 18, 'n'); put(Gr, 7, 15, '?'); put(Gr, 9, 18, '1');
  partition(Gr, 24, 14); put(Gr, 24, 18, 'r'); put(Gr, 22, 13, '*');
  put(Gr, 27, 18, 'c'); put(Gr, 30, 15, '?'); put(Gr, 32, 18, 'N'); put(Gr, 34, 18, '2'); put(Gr, 31, 14, 'M');
  partition(Gr, 50, 14); put(Gr, 50, 18, 'R'); put(Gr, 45, 12, 'E'); put(Gr, 40, 18, 'u');
  put(Gr, 55, 18, 'k'); put(Gr, 58, 18, 'c');
  // the private collection: a panelled pillar whose foot is only canvas (the pale patch beside it)
  fillG(Gr, 64, 14, 67, 18, 'H'); fillG(Gr, 64, 17, 64, 18, 'F'); fillG(Gr, 65, 17, 67, 18, '.'); put(Gr, 63, 18, 'x'); put(Gr, 65, 17, 'A'); put(Gr, 67, 18, 'D');
  put(Gr, 74, 18, 'a'); put(Gr, 78, 18, 'l'); put(Gr, 88, 18, 'D'); put(Gr, 92, 18, 'k');
  fillG(Gr, W - 1, 0, W - 1, 18, '#');
  return rowsOf(Gr);
})();
const SITTING = o => ['piece', 'gal.sitting', o];
stamps.galSalon = { floor: 19, rows: salonRows, gold: { '*': 'must', A: 'hidden', E: 'risky' }, items: ['power', 'power'], doors: [{ to: 'corridor@in', look: 'galHatch' }, { to: 'studio@in', look: 'galDoor' }], legend: Object.assign({}, COMMON, {
  n: SIGN('ROLL HIS POSING MARK INTO HIS SIGHT LINE'),
  N: SIGN('THIS SITTING, HIS SIGHT LINE GOES THE OTHER WAY'),
  '1': SITTING({ rail: [9, 21, 19], at: 9, good: 18, eye: [12, 10], lock: 'gal:s1', label: 'SPINACH IN HIS TEETH', u: 0.55 }),
  '2': SITTING({ rail: [33, 47, 19], at: 45, good: 36, eye: [44, 10], lock: 'gal:s2', label: 'A HAIR UP HIS NOSE', u: 0.55 }),
  r: ROPE('gal:s1'), R: ROPE('gal:s2'),
  a: ['anchor', 'corridorOut']
}) };
stamps.galCorridorOld = oldRoom('salon@corridorOut', ['star']);
const L6 = { n: 6, name: 'The Good Side', mapLabel: 'The Good Side', arch: 'lair', theme: 'gal_salon', boss: 'gal_retoucher',
  gimmick: 'The Retoucher touches up his own unflattering portraits. Don\'t stomp him: get his own paint onto the portrait on his easel. A moustache, a second ear, and the likeness',
  hint: 'Phase 1: roll the posing mark under the drip, jump the sweep, THROW at the easel. Phase 2: crouch on the mark at the ear spot. Phase 3: crouch on the mark under his chin, then THROW at the easel. A pale patch by a pillar...',
  postcard: 'BRADY! You fixed his portrait and he was furious. I bought it on the spot. It is going over the kettle. He can watch me make tea. ♥ C',
  enemies: [['galPigeon', 1], ['galGnat', 1]],
  mapCell: [5, 0], mapFrom: 4,
  exits: { main: { to: null } },
  areas: [
    { id: 'salon', gen: 'room', theme: 'gal_salon', stamp: 'galSalon', gal: { sitting: true }, bottomKill: true },
    { id: 'corridor', gen: 'room', role: 'secret', room: 'galEyes', theme: 'gal_room_corridor', stamp: 'galCorridorOld', gal: { room: true } },
    { id: 'studio', gen: 'arena', role: 'arena', layout: 'studio', arenaW: 25, H: 18, roof: false, theme: 'gal_arena', gal: { boss: true } }
  ] };

Tour.amend('gal', { stamps, levels: [L1, L2, L3, L4, L5, L6] });

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
