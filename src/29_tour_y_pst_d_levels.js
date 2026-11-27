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
const roomStamp = (to, items, look) => ({ floor: 12, rows: [
  '##############################', '#............................#', '#............................#', '#............................#',
  '#............................#', '#............................#', '#............................#', '#............................#',
  '#............................#', '#............................#', '#............................#', '#.@.D........?...............#',
  '##############################', '##############################'], items: items || ['oneup'], doors: [{ to, look: look || 'pstNook' }] });
// the area options the land's mechanics read (copied onto the built area: pst: { blink: [groups], borrow })
{
  const gen0 = TourBuild.generateV2;
  TourBuild.generateV2 = function (C0, spec, w, i, attempt) {
    const L = gen0.call(this, C0, spec, w, i, attempt);
    if (C0 && C0.id === 'pst') spec.areas.forEach((A, k) => { const o = A.pst; if (!o || !L.areas[k]) return; const a = L.areas[k]; if (o.blink) { a.pstBlinkGroups = o.blink; a.pstBlinkDef = o.blinkDef || null; } if (o.borrow) a.pstBorrow = true; if (o.room) a.pstRoom = true; if (o.lead) a.pstLead = true; });
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
  ground(Gr, 25, 40, 19); put(Gr, 29, 15, 'o.o.o'); put(Gr, 34, 18, 'u');
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
  fillG(Gr, 114, 14, 136, 15, 'H'); fillG(Gr, 123, 14, 124, 15, '.');
  put(Gr, 116, 18, '6'); put(Gr, 123, 18, '7'); put(Gr, 129, 18, '8'); put(Gr, 124, 16, 'Z');
  put(Gr, 115, 12, 'o.o.o.o'); put(Gr, 127, 12, 'o.o.o.o'); put(Gr, 131, 13, 'm');
  fillG(Gr, 137, 14, 152, 15, 'H'); put(Gr, 140, 11, 'A'); put(Gr, 142, 13, 'e'); put(Gr, 146, 12, 'o.o.o'); put(Gr, 150, 13, 'K');
  put(Gr, 154, 18, 'a'); put(Gr, 158, 18, 'c'); put(Gr, 156, 18, 'k');
  // ③ the twist: think inside the low tunnel, walk out, the lift fires on the far side
  put(Gr, 159, 18, 'M');
  ground(Gr, 160, 169, 19); fillG(Gr, 162, 9, 169, 16, 'H'); put(Gr, 163, 18, '9'); ground(Gr, 170, 173, 19); ground(Gr, 174, 182, 13); put(Gr, 175, 11, 'o.o.o.o');
  ground(Gr, 183, 207, 19); put(Gr, 188, 18, 'l'); put(Gr, 192, 13, 'w'); put(Gr, 186, 15, 'o.o.o');
  // again, harder: the tunnel's ceiling has spikes in it (a lift inside it hurts), the far floor is short, the wall
  // taller; P3 over the wall
  fillG(Gr, 197, 9, 203, 15, 'H'); fillG(Gr, 197, 16, 203, 16, 'v'); put(Gr, 197, 18, 'E'); put(Gr, 195, 18, 'V');
  ground(Gr, 208, 216, 13); put(Gr, 212, 9, 'R'); put(Gr, 209, 11, 'o.o.o');
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
  '6': CUSH(3), '7': CUSH(2, [[-2, -5], [3, -5]]), '8': CUSH(3),
  '9': CUSH(3, [[12, -6]]), E: CUSH(3, [[12, -6]]),
  Z: ['piece', 'pst.z', {}],
  K: ['spawn', 'portal', { kind: 'door', look: 'pstNook', targetRef: 'forts@in' }], a: ['anchor', 'fortsOut']
} };
stamps.pstFortsOld = roomStamp('dream@fortsOut', ['oneup']);
const L1 = { n: 1, name: 'Hold That Thought', mapLabel: 'Hold That Thought', arch: 'delay', theme: 'pst_cushion',
  gimmick: 'On a dream cushion JUMP plants a thought, and one full breath later it lifts Brady sky-high from wherever he is standing then',
  hint: 'Press jump on a cushion, then move: the lift fires wherever you are when the bubble pops. Watch it stretch up first. A lone z drifts out of a gap in the cushion fort...',
  postcard: 'Brady, Pupo has been thinking about a biscuit since Tuesday. I can see the thought from here. It has a little tail. ♥ C',
  enemies: [['pstLouse', 2], ['pstPea', 2], ['pstSlug', 2], ['pstBat', 2]],
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
  ground(Gr, 165, 175, 19);
  ground(Gr, 176, 199, 21); put(Gr, 179, 20, 'c'); put(Gr, 184, 16, '?'); put(Gr, 186, 20, 'p'); put(Gr, 190, 20, 'G'); fillG(Gr, 199, 0, 199, 20, 'H');
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
  ground(Gr, 80, 112, 19); put(Gr, 107, 18, 'u');
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
stamps.pstKitchenOld = roomStamp('yawn@kitchenOut', ['oneup'], 'pstDoor');
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

/* ---------------- 32-4 Borrow a Second ---------------- */
// the floor is row 19. ① the teach: an hourglass flower, a snapping jaw to hold open, a quick lift up a wall (hold it
// at the top), P1; ② a low corridor of three jaws (one second for the fastest), the ferry and the lift over a long
// pit (hold the lift at the bottom while the ferry brings you), a very quick lift to a high nook (a lone z: the
// nightcaps, B34); ③ the twist: a folding ruler whose near elbow always folds back: hold the elbow and its far end
// finishes the bridge (P3 over it); again, with a jaw at the far end to time; the gate
const borrowRows = (() => {
  const W = 220, H = 24, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 22, 19); put(Gr, 3, 18, '@'); put(Gr, 6, 18, 'n'); put(Gr, 9, 14, '?'); put(Gr, 12, 18, 'f'); put(Gr, 16, 18, 'j');
  put(Gr, 24, 18, 'E'); ground(Gr, 29, 36, 13); put(Gr, 32, 9, '*'); put(Gr, 30, 12, 'o.o.o');
  ground(Gr, 37, 94, 19); put(Gr, 42, 18, 'l'); put(Gr, 48, 18, 'c'); put(Gr, 52, 14, '?');
  // ② the corridor of jaws
  put(Gr, 58, 18, 'N'); put(Gr, 62, 18, 'f'); fillG(Gr, 64, 9, 88, 14, 'H'); put(Gr, 68, 18, 'i'); put(Gr, 75, 18, 'k'); put(Gr, 82, 18, 'q'); put(Gr, 70, 16, 'o.o.o.o.o.o.o.o');
  // the ferry and the lift over the long pit
  put(Gr, 91, 18, 'V'); put(Gr, 93, 18, 'f'); put(Gr, 96, 18, 'm'); put(Gr, 105, 18, 'E'); put(Gr, 100, 13, 'w');
  ground(Gr, 109, 116, 13); put(Gr, 112, 12, 'c');
  ground(Gr, 117, 156, 19); put(Gr, 146, 18, 'p'); put(Gr, 136, 18, 'u');
  // the very quick lift to the high nook
  put(Gr, 121, 18, 'f'); put(Gr, 124, 18, 'U'); fillG(Gr, 127, 9, 132, 10, '#'); put(Gr, 130, 8, 'K'); put(Gr, 128, 8, 'Z'); put(Gr, 142, 18, 'a');
  // ③ the folding rulers
  put(Gr, 148, 18, 'M'); put(Gr, 152, 18, 'f'); put(Gr, 157, 18, 'r'); put(Gr, 162, 15, 'R');
  ground(Gr, 167, 182, 19); put(Gr, 172, 13, 'w'); put(Gr, 178, 18, 'f'); put(Gr, 183, 18, 'x');
  ground(Gr, 192, 219, 19); put(Gr, 193, 18, 'J'); put(Gr, 200, 18, 'c'); put(Gr, 204, 14, '?'); put(Gr, 211, 18, 'G'); fillG(Gr, 219, 0, 219, 18, 'H');
  return rowsOf(Gr);
})();
stamps.pstBorrow = { floor: 19, rows: borrowRows, gold: { '*': 'must', A: 'high', R: 'risky' }, items: ['power', 'power', 'power', 'oneup'], legend: {
  n: SIGN('AN HOURGLASS FLOWER! STAND BESIDE IT AND HOLD THROW TO BORROW A SECOND (ONE AT A TIME). TAP THROW BY SOMETHING MOVING TO SPEND IT THERE: IT HOLDS STILL'),
  N: SIGN('ONE SECOND, THREE JAWS. SPEND IT ON THE QUICK ONE'),
  V: SIGN('STAND ON A MOVING CUSHION AND TAP THROW: IT WAITS FOR YOU'),
  M: SIGN('A FOLDING RULER: ITS NEAR ELBOW ALWAYS FOLDS BACK TOO SOON. STAND ON THE LITTLE CLOCK BY IT AND SPEND YOUR SECOND THERE'),
  l: ['enemy', 'pstLouse'], u: ['enemy', 'pstSlug'], p: ['enemy', 'pstPea'], w: ['enemy', 'pstBat'],
  f: ['piece', 'pst.flower', {}], j: ['piece', 'pst.jaw', { h: 4, period: 2.6 }],
  i: ['piece', 'pst.jaw', { h: 4, period: 2.4 }], k: ['piece', 'pst.jaw', { h: 4, period: 1.5, phase: 0.6 }], q: ['piece', 'pst.jaw', { h: 4, period: 2.4, phase: 1.2 }],
  J: ['piece', 'pst.jaw', { h: 4, period: 2.2, phase: 0.4 }],
  E: ['piece', 'pst.mover', { pw: 3, ay: -6, speed: 4.5 }], m: ['piece', 'pst.mover', { pw: 3, ax: 5, speed: 2.4 }],
  U: ['piece', 'pst.mover', { pw: 3, ay: -9, speed: 9 }],
  r: ['piece', 'pst.ruler', { g: 0, n: 10, mark: -2 }], x: ['piece', 'pst.ruler', { g: 1, n: 9, mark: -2 }],
  Z: ['piece', 'pst.z', {}],
  K: ['spawn', 'portal', { kind: 'door', look: 'pstNook', targetRef: 'nursery@in' }], a: ['anchor', 'nurseryOut']
} };
stamps.pstNurseryOld = roomStamp('borrow@nurseryOut', ['magnet']);
const L4 = { n: 4, name: 'Borrow a Second', mapLabel: 'Borrow a Second', arch: 'borrow', theme: 'pst_hour',
  gimmick: 'Hourglass flowers lend one second of stillness at a time: hold THROW beside one to bank it, tap THROW by a moving thing to spend it there',
  hint: 'Bank a second at a flower, then spend it on a jaw, a moving cushion or a ruler\'s elbow. Only one at a time! A lone z drifts from a nook only a held lift reaches...',
  postcard: 'Pupo lent me a second and I spent it on a nap. He says I owe him interest. In biscuits. ♥ C',
  enemies: [['pstLouse', 2], ['pstPea', 2], ['pstSlug', 1], ['pstBat', 2]],
  mapCell: [3, 0], mapFrom: 2,
  exits: { main: { to: '32-5' } },
  areas: [
    { id: 'borrow', gen: 'room', theme: 'pst_hour', stamp: 'pstBorrow', camera: 'free', bottomKill: true, pst: { borrow: true } },
    { id: 'nursery', gen: 'room', role: 'secret', room: 'pstCaps', theme: 'pst_room_nursery', stamp: 'pstNurseryOld', pst: { room: true } }
  ] };

/* ---------------- 32-5 One Thought at a Time ---------------- */
// the floor is row 19. Picture bubbles float at a fork: jump into one and its subject fills the next room until
// another is chosen. ① the teach: a step stool up to the ledge, or a ladder up to P1; ② a towel over a pit (not the
// tub, not the ladder), a ladder up a tall wall (the ladder also stands under a gap in a ceiling: a lone z: the even
// pour, B35); ③ the twist: the tub as a step up to the towel's bubble; jump through it and the towel replaces the tub
// as the landing a step higher (P3 over it); the gate
const PIC = (g, kind, set) => ['piece', 'pst.pic', { g, kind, set }];
const THING = (g, kind, w, h, solid) => ['piece', 'pst.thing', { g, kind, w, h, solid }];
const thoughtRows = (() => {
  const W = 200, H = 24, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 27, 19); put(Gr, 3, 18, '@'); put(Gr, 6, 18, 'n'); put(Gr, 9, 14, '?');
  put(Gr, 12, 18, '1'); put(Gr, 16, 18, '2');
  put(Gr, 24, 16, 'q'); put(Gr, 22, 11, 'Y'); fillG(Gr, 17, 9, 21, 10, '#'); put(Gr, 19, 7, '*');
  ground(Gr, 28, 34, 13); put(Gr, 30, 12, 'o.o.o');
  ground(Gr, 35, 71, 19); put(Gr, 40, 18, 'l'); put(Gr, 46, 18, 'c'); put(Gr, 50, 14, '?'); put(Gr, 54, 18, 'p');
  // ② the towel over the pit (the tub only sits on the far floor, the ladder leans on nothing)
  put(Gr, 59, 18, 'N'); put(Gr, 62, 18, '3'); put(Gr, 65, 18, '4'); put(Gr, 68, 18, '5');
  put(Gr, 72, 19, 't'); ground(Gr, 82, 103, 19); put(Gr, 76, 14, 'w');
  put(Gr, 84, 16, 'd'); put(Gr, 88, 18, '6'); put(Gr, 91, 18, '7');
  // the ladder up the tall wall (the tub would leave you four rows short)
  put(Gr, 93, 16, 'X'); put(Gr, 96, 11, 'E'); ground(Gr, 98, 104, 11); put(Gr, 100, 10, 'o.o.o'); put(Gr, 102, 10, 'l');
  ground(Gr, 105, 160, 19); put(Gr, 108, 18, 'c'); put(Gr, 100, 7, 'A');
  // the same ladder thought also stands under a gap in a ceiling: the way to the pantry
  fillG(Gr, 112, 9, 122, 10, 'H'); fillG(Gr, 116, 9, 117, 10, '.'); put(Gr, 116, 11, 'O'); put(Gr, 117, 12, 'Z'); put(Gr, 120, 8, 'K'); put(Gr, 113, 8, 'o.o');
  put(Gr, 126, 18, 'p'); put(Gr, 130, 18, 'a');
  // ③ the twist: the tub as a step to the towel's bubble, the towel a step higher
  put(Gr, 132, 18, 'M'); put(Gr, 135, 18, '8'); put(Gr, 140, 16, 'P'); put(Gr, 141, 15, '9'); put(Gr, 139, 13, 'J');
  fillG(Gr, 146, 10, 152, 18, '#'); put(Gr, 142, 9, 'R'); put(Gr, 148, 9, 'o.o.o'); put(Gr, 150, 9, 'u');
  ground(Gr, 153, 199, 19); put(Gr, 158, 18, 'c'); put(Gr, 163, 14, '?'); put(Gr, 168, 18, 'l'); put(Gr, 180, 18, 'G'); fillG(Gr, 199, 0, 199, 18, 'H');
  return rowsOf(Gr);
})();
stamps.pstThought = { floor: 19, rows: thoughtRows, gold: { '*': 'must', A: 'high', R: 'risky' }, items: ['power', 'power', 'oneup'], legend: {
  n: SIGN('PICTURE BUBBLES! JUMP INTO ONE AND PUPO THINKS OF ITS THING: IT STANDS IN THE NEXT ROOM UNTIL HE THINKS OF ANOTHER'),
  N: SIGN('ONE THOUGHT AT A TIME. WHICH ONE GETS YOU OVER?'),
  M: SIGN('A TUB TO STAND ON... AND THEN SOMETHING HIGHER TO LAND ON'),
  l: ['enemy', 'pstLouse'], u: ['enemy', 'pstSlug'], p: ['enemy', 'pstPea'], w: ['enemy', 'pstBat'],
  '1': PIC(0, 'stool', [0, 1]), '2': PIC(1, 'ladder', [0, 1]),
  q: THING(0, 'stool', 2, 3, 'HARD'), Y: THING(1, 'ladder', 2, 8),
  '3': PIC(0, 'tub', [0, 1, 2]), '4': PIC(1, 'towel', [0, 1, 2]), '5': PIC(2, 'ladder', [0, 1, 2]),
  t: THING(1, 'towel', 10, 1), d: THING(0, 'tub', 4, 3, 'HARD'),
  '6': PIC(0, 'tub', [0, 1, 2]), '7': PIC(2, 'ladder', [0, 1, 2]), X: THING(0, 'tub', 3, 3, 'HARD'), E: THING(2, 'ladder', 2, 8),
  O: THING(2, 'ladder', 2, 8),
  '8': PIC(0, 'tub', [0, 1]), P: THING(0, 'tub', 4, 3, 'HARD'), '9': PIC(1, 'towel', [0, 1]), J: THING(1, 'towel', 5, 1),
  Z: ['piece', 'pst.z', {}],
  K: ['spawn', 'portal', { kind: 'door', look: 'pstNook', targetRef: 'pantry@in' }], a: ['anchor', 'pantryOut']
} };
stamps.pstPantryOld = roomStamp('thought@pantryOut', ['star']);
const L5 = { n: 5, name: 'One Thought at a Time', mapLabel: 'One Thought at a Time', arch: 'thought', theme: 'pst_picture',
  gimmick: 'At each fork in Pupo\'s dream, jump into a picture bubble: its subject (a tub, a towel, a ladder, a step stool) fills the next room until another is chosen',
  hint: 'Pick the thought that gets you over, then change your mind when you must. The tub is a step; the towel can be a step higher. A lone z drifts down out of a gap in a ceiling...',
  postcard: 'Pupo thought about a bath all afternoon and now the hall is full of tub. I am writing this from inside it. ♥ C',
  enemies: [['pstLouse', 3], ['pstPea', 2], ['pstSlug', 1], ['pstBat', 1]],
  mapCell: [3, 1], mapFrom: 3,
  exits: { main: { to: '32-6' } },
  areas: [
    { id: 'thought', gen: 'room', theme: 'pst_picture', stamp: 'pstThought', camera: 'free', bottomKill: true },
    { id: 'pantry', gen: 'room', role: 'secret', room: 'pstPour', theme: 'pst_room_pantry', stamp: 'pstPantryOld', pst: { room: true } }
  ] };

/* ---------------- 32-6 Finish My Sentence (the boss) ---------------- */
// the study, on the desk (the floor is row 16): a cushion lift up the books, parrot echoes on the shelves spitting
// comma seeds, a soft patch in the floor (a lone z: Pupo's bedroom, A LITTLE PRIVACY, entered before the boss); then
// the sentence on its paper strip: push the full stop to the slot after "MORE", the end of the part worth keeping, and
// the door to the arena unlocks
const CREAM_LO = Tour.pstKit.CREAM_LO;
const studyRows = (() => {
  const W = 100, H = 20, Gr = grid(W, H, '.');
  ground(Gr, 0, 99, 16); put(Gr, 3, 15, '@'); put(Gr, 6, 15, 'n'); put(Gr, 9, 11, '?');
  fillG(Gr, 12, 12, 16, 15, '#'); put(Gr, 13, 11, 'o.o.o'); fillG(Gr, 20, 10, 25, 15, '#'); put(Gr, 22, 6, '*'); put(Gr, 17, 15, '1');
  fillG(Gr, 10, 3, 44, 4, 'H'); put(Gr, 28, 5, 'e'); put(Gr, 38, 5, 'f');
  // the soft patch in the floor: drop through to Pupo's bedroom
  fillG(Gr, 30, 16, 31, 16, 'F'); fillG(Gr, 30, 17, 31, 18, '.'); put(Gr, 30, 18, 'K'); put(Gr, 31, 15, 'Z');
  put(Gr, 36, 15, 'l'); put(Gr, 42, 15, 'p'); put(Gr, 46, 15, 'c'); put(Gr, 48, 11, '?'); put(Gr, 50, 15, 'a');
  fillG(Gr, 52, 12, 54, 15, '#'); put(Gr, 53, 9, 'A');
  // the sentence strip and its full stop; echoes over it
  put(Gr, 55, 15, 'N'); put(Gr, 56, 15, 'q'); fillG(Gr, 58, 3, 84, 4, 'H'); put(Gr, 64, 5, 'i'); put(Gr, 76, 5, 'j'); put(Gr, 70, 10, 'R');
  fillG(Gr, 86, 12, 86, 15, 'Y'); fillG(Gr, 86, 3, 86, 11, 'H'); put(Gr, 92, 15, 'D'); put(Gr, 89, 15, 'k'); fillG(Gr, 99, 0, 99, 15, 'H');
  return rowsOf(Gr);
})();
stamps.pstStudy = { floor: 16, rows: studyRows, gold: { '*': 'must', A: 'high', R: 'risky' }, items: ['power', 'power'], doors: [{ to: 'stage@in', look: 'pstDoor' }], legend: {
  n: SIGN('THE GREAT DREAM PARROT KEEPS INTERRUPTING PUPO. HELP HIM FINISH HIS SENTENCE: WALK INTO THE FULL STOP TO PUSH IT'),
  N: SIGN('PUSH THE FULL STOP TO THE END OF THE PART WORTH KEEPING: THE SLOT AFTER "MORE"'),
  l: ['enemy', 'pstLouse'], p: ['enemy', 'pstPea'], k: ['decor', 'pstInkpot'],
  '1': CUSH(3, [[5, -6]]),
  e: ['piece', 'pst.echo', { period: 3.4 }], f: ['piece', 'pst.echo', { period: 3.4, phase: 1.7 }], i: ['piece', 'pst.echo', { period: 3.0 }], j: ['piece', 'pst.echo', { period: 3.0, phase: 1.5 }],
  q: ['piece', 'pst.sentence', { n: 28, stop: 1, slot: 18, words: [[2, 'I'], [6, 'WOULD'], [10, 'LIKE'], [15, 'MORE...'], [21, 'UM...', CREAM_LO], [24, 'ER...', CREAM_LO], [27, 'TRIP', CREAM_LO]] }],
  Y: ['lock', 'pst:stop'],
  Z: ['piece', 'pst.z', {}],
  K: ['spawn', 'portal', { kind: 'door', look: 'pstNook', targetRef: 'bedroom@in' }], a: ['anchor', 'bedOut']
} };
stamps.pstBedroomOld = roomStamp('study@bedOut', ['oneup'], 'pstDoor');
const L6 = { n: 6, name: 'Finish My Sentence', mapLabel: 'Finish My Sentence', arch: 'lair', theme: 'pst_desk', boss: 'pst_parrot',
  gimmick: 'The great dream parrot, The Interrupter, reads Pupo\'s sentence back and will not let him finish it. Put the full stop where it belongs',
  hint: 'Walk into the full stop to push it into a slot. Commas: stop after his first word. A sweeping clause: after his second. The last word: wait quietly by the blank until Pupo says please',
  postcard: 'Pupo finished his sentence: "I would like more... trip." The parrot passed the biscuits. We are staying another week. ♥ C',
  enemies: [['pstLouse', 1], ['pstPea', 1]],
  mapCell: [2, 1], mapFrom: 4,
  areas: [
    { id: 'study', gen: 'room', theme: 'pst_desk', stamp: 'pstStudy', pst: { lead: true } },
    { id: 'bedroom', gen: 'room', role: 'secret', room: 'pstPrivacy', theme: 'pst_room_bedroom', stamp: 'pstBedroomOld', pst: { room: true } },
    { id: 'stage', gen: 'arena', role: 'arena', layout: 'desk', arenaW: 28, H: 18, roof: false, theme: 'pst_desk' }
  ] };

Tour.amend('pst', { stamps, levels: [L1, L2, L3, L4, L5, L6] });

/* ---------------- the land's map: a patchwork quilt of a dream ---------------- */
// the way in (the hollow from Nepal) at the left; the cushions, the eyelids, the yawn, the hourglass garden and the
// gallery round the quilt; the desk at the top right (the port: the way home)
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.pst = {
  labels: { '32-1': 'Hold That Thought', '32-2': 'The Long Blink', '32-3': 'Half a Yawn', '32-4': 'Borrow a Second', '32-5': 'One Thought at a Time', '32-6': 'Finish My Sentence' },
  w: 1520, h: 760,
  pal: { sea: '#3a1a4a', deep: '#24102e', land: '#f2b632', light: '#ffd673', path: '#fbefd2', beach: '#e8c070', cliff: '#7a2f5a', roof: '#8a3462', wall: '#fbefd2' },
  sea: 'stars', coast: 'pstQuilt', tufts: 'none', trail: 'sparkle', bridge: 'steps', meadow: false, woods: false, foam: false, birds: false,
  land: [[[160, 380], [220, 220], [400, 150], [640, 120], [880, 150], [1100, 130], [1300, 200], [1390, 340], [1360, 520], [1240, 640], [980, 690], [700, 660], [440, 680], [250, 600]]],
  // the route nods up and down across the quilt like a slow snore (a loop was too close in shape to other lands' maps)
  nodes: { start: [240, 540], '32-1': [410, 260, 'n'], '32-2': [590, 550, 's'], '32-3': [770, 250, 'n'], '32-4': [950, 560, 's'], '32-5': [1130, 250, 'n'], '32-6': [1280, 470, 'e'], port: [1160, 610] },
  paths: { 'start>32-1': [[300, 380]], '32-1>32-2': [[500, 400]], '32-2>32-3': [[680, 400]], '32-3>32-4': [[860, 400]], '32-4>32-5': [[1040, 400]], '32-5>32-6': [[1240, 340]], '32-6>port': [[1250, 560]] },
  feat: [
    ['sprite', 'pstCushion', 400, 520, 30], ['sprite', 'pstEye', 590, 250, 34], ['sprite', 'pstBubble', 950, 230, 26],
    ['sprite', 'pstGlass', 770, 560, 22], ['sprite', 'pstBubble', 1300, 240, 22], ['sprite', 'pstDesk', 1100, 480, 30]
  ],
  flora: ['rock'], density: 0,
  live: [['blink', 700, 160, '#fbefd2'], ['circle', 1000, 170, 40, 0.5]]
};
Tour.pstLevels = { grid, put, fillG, ground, pit, rowsOf, roomStamp, SIGN, CUSH, stamps };
})();
