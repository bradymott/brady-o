/* ============================================================
   THE UMBRELLA REPAIR DISTRICT: the stages (world 31) and the land's map. Six stages, each a new kind of play,
   taught where a slip costs nothing, tested, then twisted; the last one is the boss.
   31-1 RIB INSPECTOR (ribcrawl)  open canopies hung across the gaps: grip the ribs, crawl four ways, flip through a
        rivet to the fabric side to pass the ticks there; late on a Rivet Tick wedged in its seat walls off both faces
        until its rib is flexed from the far end with THROW. Room B26 (Long Lunch) off a ledge only the tall canopy
        reaches.
   31-2 EVERY DROP ACCOUNTED FOR (dripstamp), 31-3 HOOK EXCHANGE (hookchain), 31-4 PANEL BEATER (panelpop),
   31-5 SHAKE WELL (puddleherd), 31-6 LIFETIME WARRANTY (lair: The Inspector of Unlikely Weather): below.
   ============================================================ */
(function () {
const C = Tour.countries.umb;
if (!C) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length) Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const pit = (Gr, x0, x1) => fillG(Gr, x0, 0, x1, Gr.length - 1, '.');
const rowsOf = Gr => Gr.map(r => r.join(''));
const stamps = {};
// a room kind once the rooms file has it (until then the stand-in stamp is the room)
const RK = k => k;
const SIGN = text => ['spawn', 'sign', { text }];
const CANP = (w, h, holes) => ['piece', 'umb.canopy', { w, h, holes: holes || [] }];
const CRAWL = o => ['piece', 'umb.crawler', o];
const TICKET = o => ['piece', 'umb.ticket', o || {}];
const ENEMY = { l: ['enemy', 'umbTick'], r: ['enemy', 'umbMule'], f: ['enemy', 'umbFinch'], j: ['enemy', 'umbFerret'] };
// a secret room's stand-in stamp (the room kind builds its own place from it): its door out, its prize
const roomStamp = (out, look, items) => ({ floor: 12, rows: [
  '############################', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#.@..D..................?..#',
  '############################', '############################'], items: items || ['oneup'], doors: [{ to: out, look: look || 'umbHatch' }] });

/* ---------------- 31-1 Rib Inspector ---------------- */
// the street's top is row 23. ① the teach: a little canopy over the street (nothing to fall into), then a canopy over
// the first gap; ② rivets and the fabric side (a tick patrols the underside's middle spoke), the mule's street, the
// tall canopy up to the high roof (the window ledge with the repair ticket at its top left: room B26); ③ the covered
// passage: the seated tick across the long canopy (its rib's ferrule end four spokes back), then the last canopy
// with a second seated tick and critters on both faces, the end street and the gate
const ribRows = (() => {
  const W = 240, H = 30, Gr = grid(W, H, '.');
  ground(Gr, 0, 21, 23); put(Gr, 3, 22, '@'); put(Gr, 6, 22, 'k'); put(Gr, 19, 22, 'x');
  put(Gr, 10, 15, '1'); put(Gr, 11, 16, 'o.o.o.o'); put(Gr, 14, 12, '?');
  put(Gr, 20, 13, '2'); put(Gr, 22, 17, 'o.o.o.o.o'); put(Gr, 26, 15, '*');
  ground(Gr, 30, 54, 23); put(Gr, 36, 22, 'c'); put(Gr, 40, 19, '?'); put(Gr, 46, 22, 'l'); put(Gr, 50, 22, 'K'); put(Gr, 33, 22, 'x');
  put(Gr, 53, 11, '3'); put(Gr, 61, 11, 'm'); put(Gr, 60, 17, 'n'); put(Gr, 56, 12, 'o.o'); put(Gr, 64, 12, 'o.o');
  ground(Gr, 69, 86, 23); put(Gr, 71, 22, 'c'); put(Gr, 80, 22, 'r'); put(Gr, 76, 19, 'o.o.o');
  put(Gr, 85, 6, '4'); put(Gr, 88, 9, 'e'); put(Gr, 96, 15, 'q'); put(Gr, 90, 18, 'o.o.o'); put(Gr, 92, 8, 'o.o.o');
  // the window ledge above the tall canopy's top left: only the canopy reaches it (the ticket; B26's door)
  fillG(Gr, 77, 5, 83, 5, 'H'); put(Gr, 78, 4, 'A'); put(Gr, 81, 4, 'u'); put(Gr, 80, 2, 'o.o');
  ground(Gr, 101, 118, 13); put(Gr, 104, 12, 'c'); put(Gr, 108, 12, 'j'); put(Gr, 113, 9, '?'); put(Gr, 112, 12, 'x');
  ground(Gr, 119, 122, 16); ground(Gr, 123, 126, 19); ground(Gr, 127, 140, 23);
  put(Gr, 128, 22, 'c'); put(Gr, 131, 22, 'a'); put(Gr, 134, 22, 'Z'); put(Gr, 115, 12, 'l'); put(Gr, 120, 12, 'f');
  // ③ the covered passage: the seated tick across the long canopy
  fillG(Gr, 139, 4, 172, 6, 'H');
  put(Gr, 139, 7, '5'); put(Gr, 156, 7, 'Y'); put(Gr, 149, 8, 'w'); put(Gr, 163, 10, 'z'); put(Gr, 160, 18, 'R');
  put(Gr, 144, 15, 'o.o.o'); put(Gr, 160, 10, 'o.o.o'); put(Gr, 163, 16, 'o.o.o');
  ground(Gr, 169, 186, 23); put(Gr, 172, 22, 'c'); put(Gr, 176, 19, '?');
  // the last canopy: a second seated tick, critters on both faces
  fillG(Gr, 185, 4, 218, 7, 'H');
  put(Gr, 185, 8, '6'); put(Gr, 202, 8, 'J'); put(Gr, 195, 10, 'U'); put(Gr, 199, 13, 'V'); put(Gr, 208, 9, 'E'); put(Gr, 211, 17, 'N');
  put(Gr, 190, 15, 'o.o.o'); put(Gr, 204, 12, 'o.o.o');
  ground(Gr, 215, W - 1, 23); put(Gr, 218, 22, 'c'); put(Gr, 222, 22, 'j'); fillG(Gr, 226, 20, 227, 22, 'H'); put(Gr, 226, 16, 'P'); put(Gr, 233, 22, 'G');
  fillG(Gr, W - 1, 0, W - 1, 22, 'H');
  return rowsOf(Gr);
})();
const RIB = Object.assign({}, ENEMY, {
  k: SIGN('AN OPEN CANOPY! PUSH UP INTO IT TO GRIP THE RIBS. CRAWL WITH THE STICK. JUMP TO LET GO'),
  K: SIGN('CORAL RIVETS: PRESS JUMP ON ONE TO FLIP TO THE FABRIC SIDE. ONLY A CRITTER ON YOUR SIDE CAN TOUCH YOU'),
  Z: SIGN('A TICK WEDGED IN ITS SEAT BLOCKS BOTH SIDES. CRAWL TO THE FAR END OF ITS RIB AND PRESS THROW TO FLEX IT'),
  x: ['decor', 'umbStand'],
  '1': CANP(8, 5, []), '2': CANP(12, 7, []),
  '3': CANP(18, 9, [[4, 4], [13, 4]]),
  m: CRAWL({ kind: 'tick', face: 0, ay: 8, speed: 1.2 }), n: CRAWL({ kind: 'tick', face: 1, ax: 4, speed: 1.0 }),
  '4': CANP(18, 14, [[4, 10], [9, 4], [14, 8]]),
  e: CRAWL({ kind: 'ferret', face: 0, ax: 6, speed: 1.1 }), q: CRAWL({ kind: 'tick', face: 1, ay: -6, speed: 1.2 }),
  A: ['spawn', 'portal', { kind: 'door', look: 'umbCase', targetRef: 'lunch@in' }], u: TICKET({ dy: 1 }), a: ['anchor', 'lunchOut'],
  '5': CANP(32, 13, [[8, 7], [13, 3], [22, 5], [27, 9]]),
  Y: ['piece', 'umb.seat', { h: 13, side: -1, reach: 4, mark: 2, id: 'seat1' }],
  w: CRAWL({ kind: 'tick', face: 0, ax: 4, speed: 1.1 }), z: CRAWL({ kind: 'ferret', face: 1, ay: 6, speed: 1.0, phase: 1.5 }),
  '6': CANP(32, 12, [[7, 4], [12, 8], [21, 3], [26, 7]]),
  J: ['piece', 'umb.seat', { h: 12, side: -1, reach: 5, mark: 6, id: 'seat2' }],
  U: CRAWL({ kind: 'tick', face: 1, ax: 4, speed: 1.3 }), V: CRAWL({ kind: 'ferret', face: 0, ay: 5, speed: 1.2 }),
  E: CRAWL({ kind: 'tick', face: 0, ay: 8, speed: 1.2 }), N: CRAWL({ kind: 'tick', face: 1, ax: -3, speed: 1.0 })
});
stamps.umbRib = { floor: 23, rows: ribRows, legend: RIB, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power', 'power'] };
stamps.umbLunch = roomStamp('ribs@lunchOut', 'umbHatch');
const L1 = { n: 1, name: 'Rib Inspector', mapLabel: 'Rib Inspector', arch: 'ribcrawl', theme: 'umb_ribs',
  gimmick: 'Huge repair canopies hung open across the gaps: push up to grip the ribs, crawl any way underneath, flip through a coral rivet to the fabric side to slip past the Rivet Ticks. Late on, a tick sits wedged in the seat of a rib',
  hint: 'Only a critter on your side of the cloth can touch you. A wedged tick won\'t budge from its own end: crawl to the far end of its rib and press THROW. A repair ticket hangs over a high window ledge...',
  postcard: 'Brady! I hung under an umbrella the size of a bandstand and a tick counted my fingers. He got to eleven, twice. ♥ C',
  enemies: [['umbTick', 3], ['umbMule', 2], ['umbFerret', 2], ['umbFinch', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '31-2' } },
  areas: [
    { id: 'ribs', gen: 'room', theme: 'umb_ribs', stamp: 'umbRib', camera: 'free', bottomKill: true },
    { id: 'lunch', gen: 'room', role: 'secret', theme: 'umb_room_lunch', stamp: 'umbLunch', room: RK('umbLunch') }
  ] };

/* ---------------- 31-2 Every Drop Accounted For ---------------- */
// floors on row 21. ① the teach: a drip, its gutter's plate beside it, the cistern and its sluice shutter; ② a
// cistern that needs three drops (carry three, or stamp twice); the downpipe housing whose left face is only a
// painted board (the ticket on it: room B27, the sewing loft, inside); ③ a cistern with a grate: one big drop
// only (let two merge on your head before stamping), then a second grated one that needs two big drops
const dropRows = (() => {
  const W = 200, H = 26, Gr = grid(W, H, '.');
  ground(Gr, 0, 40, 21); put(Gr, 3, 20, '@'); put(Gr, 6, 20, 'k'); put(Gr, 10, 17, '?'); put(Gr, 14, 20, 'd'); put(Gr, 15, 20, '1');
  put(Gr, 26, 20, 'c'); put(Gr, 30, 16, '*'); put(Gr, 33, 14, 'f'); put(Gr, 62, 20, 'r'); put(Gr, 28, 18, 'o.o.o');
  ground(Gr, 44, 100, 21); put(Gr, 48, 20, 'd'); put(Gr, 50, 20, '2'); put(Gr, 45, 17, 'o.o');
  put(Gr, 84, 20, 'l');
  // the downpipe housing: its left face is a painted board (walk into it); the cupboard door inside
  fillG(Gr, 66, 18, 70, 20, 'H'); fillG(Gr, 67, 19, 69, 20, '.'); fillG(Gr, 66, 19, 66, 20, 'F'); put(Gr, 68, 20, 'A'); put(Gr, 65, 20, 'u');
  put(Gr, 76, 20, 'c'); put(Gr, 80, 17, '?'); put(Gr, 90, 20, 'j'); put(Gr, 92, 14, 'f'); put(Gr, 97, 20, 'a'); put(Gr, 72, 14, 'o.o.o');
  put(Gr, 102, 17, 'R');
  ground(Gr, 104, 160, 21); put(Gr, 106, 20, 'K'); put(Gr, 112, 20, 'd'); put(Gr, 113, 20, '3');
  put(Gr, 125, 20, 'c'); put(Gr, 130, 20, 'r'); put(Gr, 128, 16, '?');
  put(Gr, 140, 20, 'e'); put(Gr, 141, 20, '4'); put(Gr, 156, 14, 'f');
  ground(Gr, 161, W - 1, 21); fillG(Gr, 161, 22, 163, 25, '#');
  put(Gr, 170, 20, 'c'); put(Gr, 176, 20, 'l'); fillG(Gr, 180, 18, 181, 20, 'H'); put(Gr, 180, 14, 'P'); put(Gr, 184, 18, 'o.o.o'); put(Gr, 192, 20, 'G');
  fillG(Gr, W - 1, 0, W - 1, 20, 'H');
  return rowsOf(Gr);
})();
const DROP = Object.assign({}, ENEMY, {
  k: SIGN('A DRIP! STAND UNDER IT: EACH DROP STAYS ON YOUR HEAD. THEN JUMP ONTO THE CORAL PLATE TO SEND THEM DOWN THE GUTTER'),
  K: SIGN('THIS CISTERN HAS A GRATE: ONLY A BIG DROP GETS IN. TWO DROPS ON YOUR HEAD MERGE INTO ONE BIG ONE'),
  d: ['piece', 'umb.drip', { top: 7 }], e: ['piece', 'umb.drip', { top: 7, phase: 0.45 }],
  '1': ['piece', 'umb.gutter', { len: 5, need: 2, gate: 2, h: 4, id: 'cis1' }],
  '2': ['piece', 'umb.gutter', { len: 6, need: 3, gate: 2, h: 4, id: 'cis2' }],
  '3': ['piece', 'umb.gutter', { len: 6, need: 1, big: true, gate: 2, h: 4, id: 'cis3' }],
  '4': ['piece', 'umb.gutter', { len: 7, need: 2, big: true, gate: 2, h: 4, id: 'cis4' }],
  A: ['spawn', 'portal', { kind: 'door', look: 'umbCase', targetRef: 'sew@in' }], u: TICKET({}), a: ['anchor', 'sewOut']
});
stamps.umbDrop = { floor: 21, rows: dropRows, legend: DROP, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power'] };
stamps.umbSew = roomStamp('drips@sewOut', 'umbHatch');
const L2 = { n: 2, name: 'Every Drop Accounted For', mapLabel: 'Every Drop', arch: 'dripstamp', theme: 'umb_gutter',
  gimmick: 'The workshops\' leaks are all on the books: stand under a drip to catch each drop on your head, then stamp on a gutter\'s dry end to send them along into a leaky cistern. A full cistern floats its sluice shutter up',
  hint: 'Two drops on your head merge into one big one. A grated cistern only takes a big drop. One downpipe\'s housing has a ticket on its side...',
  postcard: 'Brady! A whole street of leaks and every single drop is written down in a ledger. I signed for three of them. ♥ C',
  enemies: [['umbTick', 2], ['umbMule', 2], ['umbFerret', 1], ['umbFinch', 3]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '31-3' } },
  areas: [
    { id: 'drips', gen: 'room', theme: 'umb_gutter', stamp: 'umbDrop', camera: 'free', bottomKill: true },
    { id: 'sew', gen: 'room', role: 'secret', theme: 'umb_room_sew', stamp: 'umbSew', room: RK('umbThread') }
  ] };

/* ---------------- 31-3 Hook Exchange ---------------- */
// floors on row 21. ① the teach: a hook over a shallow trench (a fall costs nothing: steps back up); ② a hook over a
// real gap, a hook over a gap with a tick on the far bank; the side hook on the pillar by the ticket builds a chain to
// the high ledge with room B28's door (only the chain reaches it); ③ the corner hook: its sister handle turns the
// corner at the far pulley before it nests
const hookRows = (() => {
  const W = 220, H = 26, Gr = grid(W, H, '.');
  ground(Gr, 0, 25, 21); put(Gr, 3, 20, '@'); put(Gr, 6, 20, 'k'); put(Gr, 12, 17, '?'); put(Gr, 25, 20, '1');
  // the teach trench: a floor three rows down, a step back up on the left
  ground(Gr, 26, 31, 24); ground(Gr, 26, 26, 23); put(Gr, 28, 18, 'o.o.o');
  ground(Gr, 32, 62, 21); put(Gr, 35, 20, 'c'); put(Gr, 42, 17, '?'); put(Gr, 47, 20, 'j'); put(Gr, 54, 15, 'f'); put(Gr, 62, 20, '2'); put(Gr, 64, 16, '*');
  ground(Gr, 71, 96, 21); put(Gr, 87, 20, 'r'); put(Gr, 82, 20, 'c'); put(Gr, 96, 20, '3'); put(Gr, 88, 17, 'o.o.o');
  ground(Gr, 104, 150, 21); put(Gr, 110, 20, 'l');
  // the side hook: up the steps onto the pillar, a chain across to the high ledge (B28's door); under it the street
  fillG(Gr, 116, 19, 117, 20, 'B'); fillG(Gr, 118, 16, 120, 20, 'H'); put(Gr, 120, 15, '4'); put(Gr, 119, 14, 'u');
  // a beam over the chain's gap: no jumping across, only walking the chain
  fillG(Gr, 121, 13, 126, 13, 'H'); fillG(Gr, 127, 16, 133, 16, 'H'); put(Gr, 130, 15, 'A'); put(Gr, 131, 14, 'o.o');
  put(Gr, 136, 20, 'c'); put(Gr, 140, 17, '?'); put(Gr, 145, 20, 'a'); put(Gr, 142, 15, 'f');
  // a long gap, the risky postcard over it
  put(Gr, 150, 20, '5'); put(Gr, 152, 16, 'R');
  ground(Gr, 159, 182, 21); put(Gr, 164, 20, 'K'); put(Gr, 170, 20, 'r'); put(Gr, 174, 20, 'c'); put(Gr, 182, 20, '6');
  ground(Gr, 193, W - 1, 21); put(Gr, 197, 20, 'l'); fillG(Gr, 202, 18, 203, 20, 'H'); put(Gr, 202, 13, 'P'); put(Gr, 212, 20, 'G');
  fillG(Gr, W - 1, 0, W - 1, 20, 'H');
  return rowsOf(Gr);
})();
const HOOKL = Object.assign({}, ENEMY, {
  k: SIGN('A HOOK EXCHANGE! STAND ON THE MARK BY THE HOOK AND HOLD THROW: HANDLES NEST ONE IN ANOTHER ACROSS THE GAP. LET GO WHEN THE FAR RING LIGHTS'),
  K: SIGN('THIS LAST PAIR OPEN THE SAME WAY ROUND. THE SISTER HAS TO TURN THE CORNER FIRST: KEEP HOLDING'),
  '1': ['piece', 'umb.hook', { span: 6 }], '2': ['piece', 'umb.hook', { span: 8 }], '3': ['piece', 'umb.hook', { span: 7 }],
  '4': ['piece', 'umb.hook', { span: 6, wire: 2 }], '5': ['piece', 'umb.hook', { span: 8 }], '6': ['piece', 'umb.hook', { span: 10, corner: true }],
  A: ['spawn', 'portal', { kind: 'door', look: 'umbCase', targetRef: 'tray@in' }], u: TICKET({}), a: ['anchor', 'trayOut']
});
stamps.umbHooks = { floor: 21, rows: hookRows, legend: HOOKL, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power'] };
stamps.umbTray = roomStamp('hooks@trayOut', 'umbHatch');
const L3 = { n: 3, name: 'Hook Exchange', mapLabel: 'Hook Exchange', arch: 'hookchain', theme: 'umb_hooks',
  gimmick: 'Closed umbrellas ride a wire past the hooks at every gap. Hold THROW by a hook and it catches a passing handle; the next one nests inside it, and the next, a rigid chain across the gap',
  hint: 'Keep holding until the ring on the far side lights, then let go when you like. The last pair open the same way round: wait while the sister turns the corner. A hook on a pillar by a ticket leads somewhere high...',
  postcard: 'Brady! I crossed a gap on a chain of other people\'s umbrellas. Piwi\'s was in it. It has a duck on the handle. ♥ C',
  enemies: [['umbTick', 2], ['umbMule', 2], ['umbFerret', 1], ['umbFinch', 2]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '31-4' } },
  areas: [
    { id: 'hooks', gen: 'room', theme: 'umb_hooks', stamp: 'umbHooks', camera: 'free', bottomKill: true },
    { id: 'tray', gen: 'room', role: 'secret', theme: 'umb_room_tray', stamp: 'umbTray', room: RK('umbMagnet') }
  ] };

/* ---------------- 31-4 Panel Beater ---------------- */
// floors on row 21; the arcade's canopy is the ceiling on row 16 over the covered stretches. ① the teach: a dent,
// its rain sheet across the way: jump into the dent from underneath; ② dents with critters between, one over a step;
// the missing panel by the ticket (a crate under it): up through it onto the arcade's roof, along it to room B29's
// hatch; ③ three panels in a row, each popping its left neighbour back in, and the shutter they lift
const panelRows = (() => {
  const W = 210, H = 24, Gr = grid(W, H, '.');
  ground(Gr, 0, W - 1, 21); put(Gr, 3, 20, '@'); put(Gr, 6, 20, 'k'); put(Gr, 9, 17, '?');
  fillG(Gr, 11, 16, 20, 16, 'H'); put(Gr, 13, 16, '1'); put(Gr, 24, 17, 'o.o.o');
  put(Gr, 28, 20, 'c'); put(Gr, 33, 20, 'r');
  fillG(Gr, 38, 16, 50, 16, 'H'); put(Gr, 40, 16, '2'); put(Gr, 46, 20, 'l'); put(Gr, 56, 17, '*'); put(Gr, 60, 14, 'f');
  // a step up under the third panel
  fillG(Gr, 64, 19, 76, 20, '#'); fillG(Gr, 62, 14, 78, 14, 'H'); put(Gr, 66, 14, '3'); put(Gr, 74, 17, 'o.o');
  put(Gr, 82, 20, 'c'); put(Gr, 85, 17, '?');
  // the covered stretch with a missing panel (a crate under it, the ticket at its edge); the roof run to the hatch
  fillG(Gr, 90, 16, 124, 16, 'H'); fillG(Gr, 95, 16, 96, 16, '.'); fillG(Gr, 95, 19, 96, 20, 'B'); put(Gr, 94, 17, 'u');
  put(Gr, 100, 15, 'o.o.o.o'); put(Gr, 120, 15, 'A'); put(Gr, 104, 20, 'j'); put(Gr, 112, 20, 'r');
  put(Gr, 114, 16, '4'); put(Gr, 108, 13, 'R');
  put(Gr, 128, 20, 'a'); put(Gr, 130, 20, 'c'); put(Gr, 136, 16, 'f'); put(Gr, 140, 17, '?');
  // ③ the row of three, the shutter after it
  put(Gr, 146, 20, 'K'); fillG(Gr, 148, 16, 166, 16, 'H'); put(Gr, 150, 16, '5');
  put(Gr, 172, 20, 'c'); put(Gr, 178, 20, 'l'); fillG(Gr, 184, 18, 185, 20, 'H'); put(Gr, 184, 14, 'P'); put(Gr, 190, 20, 'r'); put(Gr, 200, 20, 'G');
  fillG(Gr, W - 1, 0, W - 1, 20, 'H');
  return rowsOf(Gr);
})();
const PANL = Object.assign({}, ENEMY, {
  k: SIGN('A DENTED PANEL LETS THE RAIN THROUGH IN A SHEET. JUMP INTO THE DENT FROM UNDERNEATH TO POP IT OUT'),
  K: SIGN('THREE PANELS: ALL OUT AT ONCE LIFTS THE SHUTTER. WATCH WHICH ONE POPS BACK IN...'),
  '1': ['piece', 'umb.panel', { w: 5, floor: 5, id: 'p1' }], '2': ['piece', 'umb.panel', { w: 6, floor: 5, id: 'p2' }],
  '3': ['piece', 'umb.panel', { w: 6, floor: 5, curtain: 5, id: 'p3' }], '4': ['piece', 'umb.panel', { w: 6, floor: 5, id: 'p4' }],
  '5': ['piece', 'umb.panelRow', { w: 4, floor: 5, gate: 3, h: 4, id: 'row' }],
  A: ['spawn', 'portal', { kind: 'door', look: 'umbCase', targetRef: 'booth@in' }], u: TICKET({ dy: 1 }), a: ['anchor', 'boothOut']
});
stamps.umbPanels = { floor: 21, rows: panelRows, legend: PANL, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power', 'power'] };
stamps.umbBooth = roomStamp('arcade@boothOut', 'umbHatch');
const L4 = { n: 4, name: 'Panel Beater', mapLabel: 'Panel Beater', arch: 'panelpop', theme: 'umb_arcade',
  gimmick: 'The arcade\'s great canopy has dents, and every dent lets the rain through in a solid sheet across the way. Jump into a dent from underneath to pop it out and send the rain off the sides',
  hint: 'Bump the dent from below, on your side of the rain. In the row of three, popping one pops its left neighbour back in: start from the far end. A crate stands under a missing panel...',
  postcard: 'Brady! I popped a dent out of a canopy with my head. The rain went round me like I was somebody important. ♥ C',
  enemies: [['umbTick', 2], ['umbMule', 3], ['umbFerret', 1], ['umbFinch', 2]],
  mapCell: [3, 0], mapFrom: 2,
  exits: { main: { to: '31-5' } },
  areas: [
    { id: 'arcade', gen: 'room', theme: 'umb_arcade', stamp: 'umbPanels', camera: 'free', bottomKill: true },
    { id: 'booth', gen: 'room', role: 'secret', theme: 'umb_room_photo', stamp: 'umbBooth', room: RK('umbCamera') }
  ] };

/* ---------------- 31-5 Shake Well ---------------- */
// floors on row 21. ① the teach: one puddle on a canopy floor, its cup low; ② two puddles, a cup that needs both
// (herd them together into the scallop); the manhole by the ticket: drop in (room B30, the carousel, under the
// square); a canopy whose scallop is on the left; ③ the high cup: three little puddles must leave together
const shakeRows = (() => {
  const W = 220, H = 26, Gr = grid(W, H, '.');
  ground(Gr, 0, 98, 21); put(Gr, 3, 20, '@'); put(Gr, 6, 20, 'k'); put(Gr, 10, 17, '?'); put(Gr, 14, 20, '1');
  put(Gr, 28, 20, 'c'); put(Gr, 33, 20, 'l'); put(Gr, 38, 15, 'f'); put(Gr, 30, 17, 'o.o.o');
  put(Gr, 44, 20, '2'); put(Gr, 50, 15, '*');
  put(Gr, 64, 20, 'c'); put(Gr, 70, 20, 'r'); put(Gr, 76, 17, '?'); put(Gr, 84, 20, 'j');
  // the manhole: a shaft down to the room under the square, the ticket beside it
  put(Gr, 94, 20, 'u'); fillG(Gr, 95, 0, 96, H - 1, '.'); fillG(Gr, 95, H - 1, 96, H - 1, 'z');
  ground(Gr, 97, 98, 21); ground(Gr, 99, 150, 21);
  put(Gr, 104, 20, 'a'); put(Gr, 108, 20, 'c'); put(Gr, 112, 20, '3'); put(Gr, 130, 15, 'f'); put(Gr, 136, 20, 'l'); put(Gr, 128, 17, 'R');
  put(Gr, 142, 20, 'c'); put(Gr, 146, 20, 'K'); ground(Gr, 151, W - 1, 21); put(Gr, 150, 20, '4');
  put(Gr, 178, 20, 'c'); put(Gr, 184, 20, 'r'); fillG(Gr, 190, 18, 191, 20, 'H'); put(Gr, 190, 13, 'P'); put(Gr, 196, 20, 'j'); put(Gr, 210, 20, 'G');
  fillG(Gr, W - 1, 0, W - 1, 20, 'H');
  return rowsOf(Gr);
})();
const SHAKEL = Object.assign({}, ENEMY, {
  k: SIGN('A PUDDLED CANOPY! WALK ALONG IT TO HERD THE WATER INTO THE SCALLOP AT THE FAR END. THEN JUMP ON THE DRY END TO FLING IT INTO THE CUP'),
  K: SIGN('THIS CUP IS HIGH: THREE LITTLE PUDDLES HAVE TO LEAVE TOGETHER'),
  '1': ['piece', 'umb.shake', { w: 8, n: 1, need: 1, cup: 4, gate: 2, h: 4, id: 'cup1' }],
  '2': ['piece', 'umb.shake', { w: 10, n: 2, need: 2, cup: 5, gate: 2, h: 4, id: 'cup2' }],
  '3': ['piece', 'umb.shake', { w: 11, n: 2, need: 2, cup: 5, gate: 2, h: 4, id: 'cup3' }],
  '4': ['piece', 'umb.shake', { w: 12, n: 3, need: 3, cup: 7, gate: 2, h: 4, id: 'cup4' }],
  z: ['seam', 'bottom', 'slice@in'], u: TICKET({}), a: ['anchor', 'sliceOut']
});
stamps.umbShake = { floor: 21, rows: shakeRows, legend: SHAKEL, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power'] };
stamps.umbSlice = roomStamp('square@sliceOut', 'umbHatch');
const L5 = { n: 5, name: 'Shake Well', mapLabel: 'Shake Well', arch: 'puddleherd', theme: 'umb_puddles',
  gimmick: 'Puddled canopies laid out to dry across the square: walk along one to herd the loose water into its scallop, then stamp on the dry end to fling it up into the counterweight cup that lifts the gate',
  hint: 'Water left outside the scallop rolls back to the middle. The last cup is high: all three puddles at once. A ticket hangs by a manhole...',
  postcard: 'Brady! I herded three puddles into one and flung it at a cup. The cup was delighted. So was a passing mule. ♥ C',
  enemies: [['umbTick', 2], ['umbMule', 2], ['umbFerret', 2], ['umbFinch', 2]],
  mapCell: [4, 0], mapFrom: 3,
  exits: { main: { to: '31-6' } },
  areas: [
    { id: 'square', gen: 'room', theme: 'umb_puddles', stamp: 'umbShake', camera: 'free', bottomKill: true },
    { id: 'slice', gen: 'room', role: 'secret', theme: 'umb_room_slice', stamp: 'umbSlice', room: RK('umbSlice') }
  ] };

/* ---------------- 31-6 Lifetime Warranty (the boss) ---------------- */
// the repair hall's corridor, floor row 16 under a long shelf (row 11): two inside-out umbrellas jammed in collars
// across the way (hold THROW at the runner, walk back); a gap in the shelf by the ticket lets you up onto the shelf
// run (bundles, two postcards) to the test shower (Missing Rib); it lets you out by the hall door. Then the hall.
const warRows = (() => {
  const W = 76, H = 20, Gr = grid(W, H, '#');
  fillG(Gr, 1, 13, W - 2, 15, '.'); fillG(Gr, 1, 1, 11, 15, '.'); fillG(Gr, 12, 6, W - 6, 11, '.');
  put(Gr, 3, 15, '@'); put(Gr, 6, 15, 'k'); put(Gr, 9, 11, '?'); put(Gr, 5, 8, 'o.o.o');
  put(Gr, 18, 15, '1'); put(Gr, 30, 14, '*'); put(Gr, 34, 15, 'l');
  // the gap up to the shelf run, the ticket by it
  fillG(Gr, 26, 12, 27, 12, '.'); fillG(Gr, 26, 15, 26, 15, 'H'); put(Gr, 28, 15, 'u');
  put(Gr, 31, 10, 'BB'); put(Gr, 38, 9, 'BBB'); put(Gr, 44, 8, 'R'); put(Gr, 52, 10, 'BB'); put(Gr, 33, 7, 'o.o.o'); put(Gr, 60, 7, 'P'); put(Gr, 64, 11, 'A');
  put(Gr, 46, 15, '2'); put(Gr, 56, 15, 'c'); put(Gr, 58, 9, '?'); put(Gr, 62, 15, 'a'); put(Gr, 66, 15, 'r'); put(Gr, 72, 15, 'E');
  return rowsOf(Gr);
})();
const WAR = Object.assign({}, ENEMY, {
  k: SIGN('AN UMBRELLA JAMMED INSIDE OUT IN A REPAIR COLLAR! STAND AT ITS RUNNER, HOLD THROW AND WALK BACK TO SLIDE IT HOME'),
  '1': ['piece', 'umb.jam', { h: 3, side: -1, pull: 3, id: 'jam1' }], '2': ['piece', 'umb.jam', { h: 3, side: -1, pull: 3, id: 'jam2' }],
  u: TICKET({ dy: 1 }), A: ['spawn', 'portal', { kind: 'door', look: 'umbCase', targetRef: 'shower@in' }], a: ['anchor', 'showerOut'],
  E: ['spawn', 'portal', { kind: 'door', look: 'umbCase', targetRef: 'hall@in' }]
});
stamps.umbWarranty = { floor: 16, rows: warRows, legend: WAR, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power'] };
stamps.umbShower = roomStamp('corridor@showerOut', 'umbHatch', ['star']);
const L6 = { n: 6, name: 'Lifetime Warranty', mapLabel: 'Lifetime Warranty', arch: 'lair', theme: 'umb_hall', boss: 'umb_inspector',
  gimmick: 'The Inspector of Unlikely Weather will not be mended. Catch his tip in a repair collar, then hold THROW on his runner and walk it home: the poke, the scoop, the jab',
  hint: 'You can\'t stomp an umbrella. Stand in the glowing collar\'s ring and jump his attack: the tip lodges. Then hold THROW at the runner\'s mark and walk back, away from him',
  postcard: 'Brady! You mended the inspector. He says it was most unlikely. It rained on him once and he looked marvellous. ♥ C',
  enemies: [['umbTick', 1], ['umbMule', 1]],
  mapCell: [5, 0], mapFrom: 4,
  exits: { main: { to: null } },
  areas: [
    { id: 'corridor', gen: 'room', theme: 'umb_hall', stamp: 'umbWarranty' },
    { id: 'shower', gen: 'room', role: 'secret', theme: 'umb_room_rib', stamp: 'umbShower', room: RK('umbRib') },
    { id: 'hall', gen: 'arena', role: 'arena', layout: 'hall', arenaW: 30, H: 18, roof: false, theme: 'umb_hall' }
  ] };

Tour.amend('umb', { stamps, levels: [L1, L2, L3, L4, L5, L6] });
Tour.umbLevels = { grid, put, fillG, ground, pit, rowsOf, SIGN, CANP, CRAWL, TICKET, ENEMY, roomStamp };

/* ---------------- the land's map: wet cobbles and open umbrellas ---------------- */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.umb = {
  labels: { '31-1': 'Rib Inspector', '31-2': 'Every Drop', '31-3': 'Hook Exchange', '31-4': 'Panel Beater', '31-5': 'Shake Well', '31-6': 'Lifetime Warranty' },
  w: 1520, h: 760,
  pal: { sea: '#93a8c8', deep: '#6f85ad', land: '#c8c4d8', light: '#dcd8e8', path: '#f4b32e', beach: '#a8a4c0', cliff: '#1f2a56', roof: '#ef6f5a', wall: '#f4f1e8' },
  sea: 'clouds', coast: 'umbKerb', tufts: 'none', trail: 'cobble', bridge: 'stone', meadow: false, woods: false, foam: false, birds: false,
  land: [[[170, 380], [260, 220], [480, 160], [760, 200], [1000, 150], [1260, 210], [1380, 360], [1330, 560], [1160, 660], [900, 640], [640, 680], [400, 640], [230, 560]]],
  // the route spirals in like the ribs of an umbrella seen from above, to the inspector's hall in the middle
  nodes: { start: [270, 470], '31-1': [380, 280, 'n'], '31-2': [700, 250, 'n'], '31-3': [1040, 240, 'n'], '31-4': [1250, 420, 'e'], '31-5': [1000, 580, 's'], '31-6': [700, 460, 's'], port: [480, 600] },
  paths: { 'start>31-1': [[300, 360]], '31-1>31-2': [[540, 230]], '31-2>31-3': [[870, 210]], '31-3>31-4': [[1190, 300]], '31-4>31-5': [[1160, 540]], '31-5>31-6': [[850, 540]], '31-6>port': [[580, 560]] },
  feat: [
    ['sprite', 'umbOpen', 560, 380, 34], ['sprite', 'umbOpen', 880, 360, 30], ['sprite', 'umbOpen', 1180, 600, 26], ['sprite', 'umbStandSprite', 260, 600, 24],
    ['sprite', 'umbPuddle', 780, 620, 22], ['sprite', 'umbPuddle', 430, 420, 16], ['sprite', 'umbHallSprite', 700, 380, 36]
  ],
  flora: ['rock'], density: 0,
  live: [['circle', 700, 120, 60, 0.6]]
};
})();
