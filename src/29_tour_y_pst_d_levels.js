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
  ground(Gr, 183, 203, 19); put(Gr, 188, 18, 'l'); put(Gr, 192, 13, 'w'); put(Gr, 186, 15, 'o.o.o');
  // again: a far floor four tiles long, a soft pit beyond it (a cushion at its bottom to climb back), the ledge out
  // over the pit
  fillG(Gr, 197, 9, 203, 16, 'H'); put(Gr, 197, 18, 'E'); ground(Gr, 204, 207, 19);
  ground(Gr, 208, 213, 22); put(Gr, 208, 21, 'J'); fillG(Gr, 208, 13, 218, 14, 'H'); put(Gr, 212, 10, 'R'); put(Gr, 209, 12, 'o.o.o');
  ground(Gr, 214, 243, 19); put(Gr, 222, 18, 'c'); put(Gr, 225, 14, '?'); put(Gr, 229, 18, 'p'); put(Gr, 236, 18, 'G'); fillG(Gr, 243, 0, 243, 18, 'H');
  return rowsOf(Gr);
})();
stamps.pstDream = { floor: 19, rows: dreamRows, gold: { '*': 'must', R: 'risky', A: 'high' }, items: ['power', 'power', 'power', 'oneup'], legend: {
  n: SIGN('DREAM CUSHIONS ARE TOO SOFT TO JUMP FROM. PRESS JUMP ON ONE: PUPO HAS A THOUGHT... AND ONE BREATH LATER IT LIFTS YOU'),
  N: SIGN('THINK FIRST, THEN MOVE: THE THOUGHT LIFTS YOU FROM WHEREVER YOU ARE STANDING WHEN IT POPS'),
  M: SIGN('A SHELF IN THE WAY? HAVE THE THOUGHT HERE, WALK OUT FROM UNDER IT, AND LET IT POP ON THE FAR SIDE'),
  l: ['enemy', 'pstLouse'], u: ['enemy', 'pstSlug'], p: ['enemy', 'pstPea'], w: ['enemy', 'pstBat'], e: ['enemy', 'pstLouse'], m: ['enemy', 'pstPea'],
  k: ['decor', 'pstPillowPile'],
  '1': CUSH(4, [[5, -5]]), '2': CUSH(3, [[4, -6]]), '3': CUSH(3, [[12, -6]]),
  '4': CUSH(3, [[4, -5]]), '5': CUSH(3, [[5, -5]]),
  '6': CUSH(3), '7': CUSH(2, [[-2, -6], [3, -6]]), '8': CUSH(3),
  '9': CUSH(3, [[12, -6]]), E: CUSH(3, [[11, -6]]), J: CUSH(6, [[-3, -3], [-1, -3]]),
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

Tour.amend('pst', { stamps, levels: [L1] });
Tour.pstLevels = { grid, put, fillG, ground, pit, rowsOf, roomStamp, SIGN, CUSH, stamps };
})();
