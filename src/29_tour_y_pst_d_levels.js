/* ============================================================
   PUPO STANDARD TIME: the levels (world 32) and the land's map. A hidden land at about Nepal's difficulty (d0 0.8):
   every stage teaches its idea where a slip costs nothing, tests it with the land's critters, then twists it.
   32-1 HOLD THAT THOUGHT (delay)  dream cushions eat your jump; a thought lifts you one breath later from wherever
        you stand then. The twist: think, then walk out from under a shelf so the lift fires on its far side.
   (32-2 to 32-6 below.)
   Every stage hides one secret room (the land's tell: a lone sleepy z drifting up out of the way in).
   ============================================================ */
(function () {
const C = Tour.countries.pst;
if (!C) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length) Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const pit = (Gr, x0, x1) => fillG(Gr, x0, 0, x1, Gr.length - 1, '.');
const rowsOf = Gr => Gr.map(r => r.join(''));
const stamps = {};
const SIGN = text => ['spawn', 'sign', { text }];
const CUSH = (n, lifts) => ['piece', 'pst.cushion', { n, lifts: lifts || [] }];
// a secret room's old stamp: the door back (or onward), the prize box; the room kit (29_tour_y_pst_b_rooms.js)
// builds the game around them
const roomStamp = (to, items) => ({ floor: 12, rows: [
  '##############################', '#............................#', '#............................#', '#............................#',
  '#............................#', '#............................#', '#............................#', '#............................#',
  '#............................#', '#............................#', '#............................#', '#.@.D........?...............#',
  '##############################', '##############################'], items: items || ['oneup'], doors: [{ to, look: 'pstNook' }] });
// the area options the land's mechanics read (copied onto the built area: pst: { blink: [groups], borrow })
{
  const gen0 = TourBuild.generateV2;
  TourBuild.generateV2 = function (C0, spec, w, i, attempt) {
    const L = gen0.call(this, C0, spec, w, i, attempt);
    if (C0 && C0.id === 'pst') spec.areas.forEach((A, k) => { const o = A.pst; if (!o || !L.areas[k]) return; const a = L.areas[k]; if (o.blink) { a.pstBlinkGroups = o.blink; a.pstBlinkDef = o.blinkDef || null; } if (o.borrow) a.pstBorrow = true; if (o.room) a.pstRoom = true; });
    return L;
  };
}

/* ---------------- 32-1 Hold That Thought ---------------- */
// the floor is row 19. ① the teach: a cushion under a 5-high ledge (a miss falls back on the cushion), a second one
// under a floating ledge with P1; ② think, then walk: a cushion under ceiling spikes, the lift only safe out in the
// open by the wall; a cushion stair up two ledges past a napkin bat; the cushion fort (a ceiling with one gap: a lone
// z drifts out of it) and the run on its roof to the pillow forts (B31); ③ the twist: a cushion inside a low tunnel:
// think, walk out from under the shelf, the lift fires on the far side by the wall; again with a soft pit beyond the
// far floor and the ledge out over it (P3); the gate
const dreamRows = (() => {
  const W = 244, H = 24, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 15, 19); put(Gr, 3, 18, '@'); put(Gr, 6, 18, 'n'); put(Gr, 9, 14, '?');
  put(Gr, 12, 18, '1'); ground(Gr, 16, 24, 14); put(Gr, 17, 12, 'o.o.o.o');
  ground(Gr, 25, 40, 19); put(Gr, 29, 15, 'o.o.o'); put(Gr, 34, 18, 'l');
  ground(Gr, 41, 58, 19); put(Gr, 41, 18, '2'); fillG(Gr, 44, 13, 49, 14, '#'); put(Gr, 47, 10, '*'); put(Gr, 45, 12, 'o.o');
  put(Gr, 52, 18, 'c'); put(Gr, 55, 14, '?');
  // ② think, then walk: the cushion under ceiling spikes; the wall in the open
  put(Gr, 56, 18, 'N');
  ground(Gr, 59, 69, 19); fillG(Gr, 58, 9, 64, 13, 'H'); fillG(Gr, 58, 14, 64, 14, 'v'); put(Gr, 59, 18, '3');
  ground(Gr, 70, 78, 13); put(Gr, 71, 11, 'o.o.o.o');
  ground(Gr, 79, 98, 19); put(Gr, 85, 18, 'p'); put(Gr, 90, 18, 'u'); put(Gr, 86, 15, 'o.o.o');
  // the cushion stair: two lifts up two ledges, a napkin bat on the way
  put(Gr, 96, 18, '4'); ground(Gr, 99, 103, 14); put(Gr, 100, 13, '5'); ground(Gr, 104, 109, 9); put(Gr, 106, 4, '?'); put(Gr, 99, 9, 'w'); put(Gr, 105, 7, 'o.o.o');
  ground(Gr, 110, 160, 19); put(Gr, 112, 18, 'c');
  // the cushion fort: a ceiling slab with one gap (the tell), cushions under it; its roof is the run to the forts
  fillG(Gr, 114, 13, 136, 15, 'H'); fillG(Gr, 123, 13, 124, 15, '.');
  put(Gr, 116, 18, '6'); put(Gr, 123, 18, '7'); put(Gr, 129, 18, '8'); put(Gr, 124, 16, 'Z'); put(Gr, 133, 18, 'l');
  put(Gr, 115, 11, 'o.o.o.o'); put(Gr, 127, 11, 'o.o.o.o'); put(Gr, 131, 12, 'm');
  fillG(Gr, 137, 13, 152, 14, 'H'); put(Gr, 140, 10, 'A'); put(Gr, 142, 12, 'e'); put(Gr, 146, 11, 'o.o.o'); put(Gr, 150, 12, 'K');
  put(Gr, 154, 18, 'a'); put(Gr, 158, 18, 'c'); put(Gr, 156, 18, 'k');
  // ③ the twist: think inside the low tunnel, walk out, the lift fires on the far side
  put(Gr, 159, 18, 'M');
  ground(Gr, 160, 169, 19); fillG(Gr, 162, 9, 169, 16, 'H'); put(Gr, 163, 18, '9'); ground(Gr, 170, 173, 19); ground(Gr, 174, 182, 13); put(Gr, 175, 11, 'o.o.o.o');
  ground(Gr, 183, 207, 19); put(Gr, 188, 18, 'l'); put(Gr, 192, 13, 'w'); put(Gr, 186, 15, 'o.o.o');
  // again, harder: the tunnel's ceiling has spikes in it (a lift inside it hurts), the far floor is short, the wall
  // taller; P3 over the wall
  fillG(Gr, 197, 9, 203, 15, 'H'); fillG(Gr, 197, 16, 203, 16, 'v'); put(Gr, 197, 18, 'E'); put(Gr, 195, 18, 'V');
  ground(Gr, 208, 216, 13); put(Gr, 212, 9, 'R'); put(Gr, 209, 11, 'o.o.o'); put(Gr, 214, 12, 'l');
  ground(Gr, 217, 243, 19); put(Gr, 224, 18, 'c'); put(Gr, 227, 14, '?'); put(Gr, 230, 18, 'p'); put(Gr, 236, 18, 'G'); fillG(Gr, 243, 0, 243, 18, 'H');
  return rowsOf(Gr);
})();
stamps.pstDream = { floor: 19, rows: dreamRows, gold: { '*': 'must', R: 'risky', A: 'high' }, items: ['power', 'power', 'power', 'oneup'], legend: {
  n: SIGN('DREAM CUSHIONS ARE TOO SOFT TO JUMP FROM. PRESS JUMP ON ONE: PUPO HAS A THOUGHT... AND ONE BREATH LATER IT LIFTS YOU'),
  N: SIGN('THINK FIRST, THEN MOVE: THE THOUGHT LIFTS YOU FROM WHEREVER YOU ARE STANDING WHEN IT POPS'),
  M: SIGN('A SHELF IN THE WAY? HAVE THE THOUGHT HERE, WALK OUT FROM UNDER IT, AND LET IT POP ON THE FAR SIDE'),
  V: SIGN('MIND THE SPIKES IN THIS ONE: BE OUT FROM UNDER IT BEFORE THE BUBBLE POPS'),
  l: ['enemy', 'pstLouse'], u: ['enemy', 'pstSlug'], p: ['enemy', 'pstPea'], w: ['enemy', 'pstBat'], e: ['enemy', 'pstLouse'], m: ['enemy', 'pstPea'],
  k: ['decor', 'pstPillowPile'],
  '1': CUSH(4, [[5, -5]]), '2': CUSH(3, [[4, -6]]), '3': CUSH(3, [[12, -6]]),
  '4': CUSH(3, [[4, -5]]), '5': CUSH(3, [[5, -5]]),
  '6': CUSH(3), '7': CUSH(2, [[-2, -6], [3, -6]]), '8': CUSH(3),
  '9': CUSH(3, [[12, -6]]), E: CUSH(3, [[12, -6]]),
  Z: ['piece', 'pst.z', {}],
  K: ['spawn', 'portal', { kind: 'door', look: 'pstNook', targetRef: 'forts@in' }], a: ['anchor', 'fortsOut']
} };
stamps.pstFortsOld = roomStamp('dream@fortsOut', ['oneup']);
const L1 = { n: 1, name: 'Hold That Thought', mapLabel: 'Hold That Thought', arch: 'delay', theme: 'pst_cushion',
  gimmick: 'On a dream cushion JUMP plants a thought, and one full breath later it lifts Brady sky-high from wherever he is standing then',
  hint: 'Press jump on a cushion, then move: the lift fires wherever you are when the bubble pops. Watch it stretch up first. A lone z drifts out of a gap in the cushion fort...',
  postcard: 'Brady, Pupo has been thinking about a biscuit since Tuesday. I can see the thought from here. It has a little tail. ♥ C',
  enemies: [['pstLouse', 4], ['pstPea', 3], ['pstSlug', 1], ['pstBat', 2]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '32-2' } },
  areas: [
    { id: 'dream', gen: 'room', theme: 'pst_cushion', stamp: 'pstDream', camera: 'free', bottomKill: true },
    { id: 'forts', gen: 'room', role: 'secret', room: 'pstKnock', theme: 'pst_room_forts', stamp: 'pstFortsOld', pst: { room: true } }
  ] };

/* ---------------- 32-2 The Long Blink ---------------- */
// the floor is row 21. ① the teach: a lid bridge over a soft pit (shut it's a walkway; it trembles before it opens),
// a lash ladder up a wall (one outer rung that always stays, two inner ones only while shut) to P1; ② two lid bridges
// on two rhythms with an island between (the pit under the first one has a gap in its floor: a lone z: the pillow
// sample, B32), a tall ladder with an outer rung to rest on, a high lid over a deep pit (an outer ladder climbs back
// out), the high ledge (P2); ③ the twist: up a ladder to the plateau, then DOWN the short outer lashes and across the
// last long lid before it opens over the pillow (a fall means the climb again); P3 over the lid; the gate
const L = (dy, k) => [dy, k];
const blinkRows = (() => {
  const W = 200, H = 28, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 13, 21); put(Gr, 3, 20, '@'); put(Gr, 6, 20, 'n'); put(Gr, 9, 16, '?');
  ground(Gr, 14, 21, 24); put(Gr, 14, 21, '1'); put(Gr, 15, 18, 'o.o.o.o');
  ground(Gr, 22, 29, 21); put(Gr, 24, 20, 'N'); put(Gr, 28, 20, '2'); ground(Gr, 30, 40, 13); put(Gr, 35, 9, '*'); put(Gr, 32, 11, 'o.o.o');
  ground(Gr, 41, 57, 21); put(Gr, 45, 20, 'l'); put(Gr, 50, 20, 'c'); put(Gr, 54, 16, '?');
  // ② the two rhythms; the pit under the first lid hides the way down to the pillow sample
  ground(Gr, 58, 65, 24); put(Gr, 58, 21, '3'); fillG(Gr, 61, 24, 62, 26, '.'); put(Gr, 61, 26, 'K'); put(Gr, 62, 23, 'Z');
  ground(Gr, 66, 68, 21); put(Gr, 67, 20, 'a'); put(Gr, 66, 18, 'o.o');
  ground(Gr, 69, 76, 24); put(Gr, 69, 21, '4'); put(Gr, 73, 15, 'w');
  ground(Gr, 77, 83, 21); put(Gr, 79, 20, 'k');
  put(Gr, 84, 20, '5'); ground(Gr, 86, 96, 9); put(Gr, 92, 8, 'l'); put(Gr, 88, 7, 'o.o.o');
  ground(Gr, 97, 104, 24); put(Gr, 97, 9, '6'); put(Gr, 97, 22, '7'); put(Gr, 99, 6, 'o.o.o.o');
  ground(Gr, 105, 112, 9); put(Gr, 108, 5, '?'); put(Gr, 110, 6, 'A');
  ground(Gr, 113, 139, 21); put(Gr, 118, 20, 'c'); put(Gr, 124, 20, 'p'); put(Gr, 130, 20, 'u'); put(Gr, 133, 20, 'M');
  // ③ the twist: up to the plateau, down the outer lashes, across the last lid before it opens over the pillow
  put(Gr, 138, 20, '8'); fillG(Gr, 140, 9, 152, 10, '#'); put(Gr, 143, 8, 'c'); put(Gr, 149, 8, 'l'); put(Gr, 146, 4, 'w'); put(Gr, 144, 6, 'o.o.o');
  put(Gr, 153, 8, '9'); put(Gr, 151, 8, 'V');
  ground(Gr, 140, 164, 25); put(Gr, 140, 24, 'E'); put(Gr, 155, 19, 'J'); put(Gr, 160, 15, 'R'); put(Gr, 156, 16, 'o.o.o.o.o');
  ground(Gr, 165, 175, 19); put(Gr, 170, 18, 'p');
  ground(Gr, 176, 199, 21); put(Gr, 179, 20, 'c'); put(Gr, 184, 16, '?'); put(Gr, 190, 20, 'G'); fillG(Gr, 199, 0, 199, 20, 'H');
  return rowsOf(Gr);
})();
stamps.pstBlink = { floor: 21, rows: blinkRows, gold: { '*': 'must', A: 'high', R: 'risky' }, items: ['power', 'power', 'power', 'oneup'], legend: {
  n: SIGN('PUPO IS FAST ASLEEP AND BLINKING SLOWLY. WHILE AN EYE IS SHUT ITS LIDS MEET AND ITS LASHES LOCK INTO RUNGS'),
  N: SIGN('WHEN THE LASHES TREMBLE THE EYE IS ABOUT TO OPEN. THE SHORT DARK OUTER LASHES NEVER MOVE: REST ON THOSE'),
  M: SIGN('TWO EYES, TWO RHYTHMS. WAIT FOR THE BLINK'),
  V: SIGN('THE LAST BLINK: DOWN THE SHORT OUTER LASHES, THEN ACROSS THE LONG LID BEFORE IT OPENS'),
  l: ['enemy', 'pstLouse'], u: ['enemy', 'pstSlug'], p: ['enemy', 'pstPea'], w: ['enemy', 'pstBat'], k: ['decor', 'pstLamp'],
  '1': ['piece', 'pst.lid', { g: 0, n: 8 }], '3': ['piece', 'pst.lid', { g: 0, n: 8 }], '4': ['piece', 'pst.lid', { g: 1, n: 8 }],
  '6': ['piece', 'pst.lid', { g: 0, n: 8 }], J: ['piece', 'pst.lid', { g: 1, n: 10 }],
  '2': ['piece', 'pst.lashes', { g: 0, rows: [L(-2, 'out'), L(-4, 'in'), L(-6, 'in')] }],
  '5': ['piece', 'pst.lashes', { g: 1, rows: [L(-2, 'out'), L(-4, 'in'), L(-6, 'in'), L(-8, 'out'), L(-10, 'in')] }],
  '7': ['piece', 'pst.lashes', { g: 0, rows: [L(0, 'out'), L(-2, 'out'), L(-4, 'out'), L(-6, 'out'), L(-8, 'out'), L(-10, 'out'), L(-12, 'out')] }],
  '8': ['piece', 'pst.lashes', { g: 0, rows: [L(-2, 'out'), L(-4, 'in'), L(-6, 'in'), L(-8, 'out'), L(-10, 'in')] }],
  '9': ['piece', 'pst.lashes', { g: 1, rows: [L(2, 'out'), L(4, 'out'), L(6, 'out'), L(8, 'out')] }],
  E: ['piece', 'pst.lashes', { g: 0, rows: [L(-2, 'out')] }],
  Z: ['piece', 'pst.z', {}],
  K: ['spawn', 'portal', { kind: 'door', look: 'pstNook', targetRef: 'lab@in' }], a: ['anchor', 'labOut']
} };
stamps.pstLabOld = roomStamp('blink@labOut', ['oneup']);
const L2 = { n: 2, name: 'The Long Blink', mapLabel: 'The Long Blink', arch: 'blink', theme: 'pst_lid',
  gimmick: 'Along Pupo\'s enormous eyelids: while an eye is shut its lids meet into a bridge and its long lashes lock into a ladder. They tremble before it opens',
  hint: 'Cross and climb while the eye is shut; rest on the short dark outer lashes when they tremble. A lone z drifts up out of the floor of one soft pit...',
  postcard: 'Pupo blinked during lunch and I read half a novel. Your lashes would never. You blink like a hummingbird. ♥ C',
  enemies: [['pstLouse', 3], ['pstBat', 3], ['pstPea', 2], ['pstSlug', 1]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '32-3' } },
  areas: [
    { id: 'blink', gen: 'room', theme: 'pst_lid', stamp: 'pstBlink', camera: 'free', bottomKill: true, pst: { blink: [0, 1] } },
    { id: 'lab', gen: 'room', role: 'secret', room: 'pstCore', theme: 'pst_room_lab', stamp: 'pstLabOld', pst: { room: true } }
  ] };

/* ---------------- 32-3 Half a Yawn ---------------- */
// the floor is row 19. ① the teach: a mouth between two places: stretch left for a feather up to P1, right for one
// up the wall; ② a feather as the one stepping stone over a pit (the other corner's spot is no use), a mouth between
// two high spots (P2 on the left one), a cushion wall with a soft patch in it (a lone z: the cocoa tray, B33);
// ③ a feather staircase up a wall, then the last mouth: its feather is caught on a tooth: stretch the far cheek to
// shake it loose, then the near one to send it out over the pit (P3 above it); the gate
const MOUTH = (g, n, a, b, more) => ['piece', 'pst.mouth', Object.assign({ g, n, a, b }, more || {})];
const yawnRows = (() => {
  const W = 206, H = 24, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 25, 19); put(Gr, 3, 18, '@'); put(Gr, 6, 18, 'n'); put(Gr, 11, 14, '?');
  fillG(Gr, 2, 13, 7, 14, '#'); put(Gr, 4, 10, '*'); put(Gr, 3, 12, 'o.o');
  put(Gr, 14, 18, '1'); ground(Gr, 26, 33, 13); put(Gr, 27, 12, 'o.o.o');
  ground(Gr, 34, 69, 19); put(Gr, 40, 18, 'l'); put(Gr, 46, 18, 'p'); put(Gr, 52, 18, 'c'); put(Gr, 56, 14, '?');
  // ② a feather as the stepping stone over the pit
  put(Gr, 60, 18, 'N'); put(Gr, 64, 18, '2'); put(Gr, 75, 14, 'w');
  ground(Gr, 80, 112, 19); put(Gr, 82, 18, 'u');
  // the mouth between two high spots: the left one has P2 over it, the right one leads on up
  put(Gr, 88, 18, '3'); ground(Gr, 97, 104, 12); put(Gr, 85, 11, 'A'); put(Gr, 98, 11, 'o.o.o.o'); put(Gr, 102, 11, 'l');
  put(Gr, 110, 18, 'c');
  // the cushion wall with a soft patch: walk into it (a lone z drifts out of it)
  fillG(Gr, 116, 16, 121, 18, '#'); fillG(Gr, 116, 17, 116, 18, 'F'); fillG(Gr, 117, 17, 120, 18, '.'); put(Gr, 119, 18, 'K'); put(Gr, 115, 15, 'Z');
  ground(Gr, 112, 154, 19); put(Gr, 125, 18, 'p'); put(Gr, 128, 18, 'a');
  // ③ a feather staircase up the wall
  put(Gr, 130, 18, '4'); ground(Gr, 140, 148, 13); put(Gr, 143, 12, 'l'); put(Gr, 141, 11, 'o.o.o');
  put(Gr, 149, 18, 'M'); put(Gr, 150, 18, '5'); put(Gr, 152, 13, 'w');
  ground(Gr, 167, 205, 19); put(Gr, 162, 13, 'R'); put(Gr, 170, 18, 'c'); put(Gr, 175, 14, '?'); put(Gr, 180, 18, 'p'); put(Gr, 192, 18, 'G'); fillG(Gr, 205, 0, 205, 18, 'H');
  return rowsOf(Gr);
})();
stamps.pstYawn = { floor: 19, rows: yawnRows, gold: { '*': 'must', A: 'high', R: 'risky' }, items: ['power', 'power', 'power', 'oneup'], legend: {
  n: SIGN('A YAWNING MOUTH! STAND ON A CORNER TO STRETCH IT THAT WAY. AT THE NEXT YAWN A FEATHER FLOATS OUT AND SETTLES ON THAT SIDE AS A FOOTHOLD'),
  N: SIGN('ONE FEATHER PER MOUTH: PICK THE SIDE YOU NEED, THEN WAIT FOR THE YAWN'),
  M: SIGN('THIS FEATHER IS CAUGHT ON A TOOTH. TRY STRETCHING THE OTHER CHEEK FIRST'),
  l: ['enemy', 'pstLouse'], u: ['enemy', 'pstSlug'], p: ['enemy', 'pstPea'], w: ['enemy', 'pstBat'],
  '1': MOUTH(0, 5, [-6, -3, 3], [8, -3, 3]),
  '2': MOUTH(1, 5, [6, 0, 2], [9, 0, 3]),
  '3': MOUTH(2, 5, [-4, -4, 2], [7, -4, 2]),
  '4': MOUTH(1, 5, [-5, -3, 2], [7, -3, 2]),
  '5': MOUTH(0, 5, null, [10, -2, 3], { stuck: true, free: 0 }),
  Z: ['piece', 'pst.z', {}],
  K: ['spawn', 'portal', { kind: 'door', look: 'pstNook', targetRef: 'kitchen@in' }], a: ['anchor', 'kitchenOut']
} };
stamps.pstKitchenOld = roomStamp('yawn@kitchenOut', ['oneup']);
const L3 = { n: 3, name: 'Half a Yawn', mapLabel: 'Half a Yawn', arch: 'yawn', theme: 'pst_yawn',
  gimmick: 'Pupo yawns, and the yawns blow feathers. Stand on either corner of a yawning mouth to stretch it that way: the next feather settles on that side as a foothold',
  hint: 'Pick a corner, wait for the yawn, hop on the feather. One feather is caught on a tooth: stretch the other cheek first. A lone z drifts out of a cushion wall...',
  postcard: 'Pupo yawned and three feathers and a sock came out. The sock is yours. I have stopped asking questions. ♥ C',
  enemies: [['pstLouse', 3], ['pstPea', 3], ['pstSlug', 1], ['pstBat', 2]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '32-4' } },
  areas: [
    { id: 'yawn', gen: 'room', theme: 'pst_yawn', stamp: 'pstYawn', camera: 'free', bottomKill: true },
    { id: 'kitchen', gen: 'room', role: 'secret', room: 'pstTray', theme: 'pst_room_kitchen', stamp: 'pstKitchenOld', pst: { room: true } }
  ] };

Tour.amend('pst', { stamps, levels: [L1, L2, L3] });
Tour.pstLevels = { grid, put, fillG, ground, pit, rowsOf, roomStamp, SIGN, CUSH, stamps };
})();
