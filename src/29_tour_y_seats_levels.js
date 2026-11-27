/* ============================================================
   BELOW THE CHEAP SEATS: the stages (world 33) and the land's map. Six stages, each a new kind of play, taught
   where a slip costs nothing, tested, then twisted; the last one is the boss.
   33-1 TWO WAYS ROUND A POLE (roundpole)  two-faced scaffolds: grip, climb four ways, swing round a pole at a collar
        to pass the critters on the other face; the late Bolt Crab mirrors the climb about its collar: go round the
        back, down behind it, and THROW through the collar to knock its spanner loose. Room B36 up the tall scaffold.
   (33-2 to 33-6 below.)
   ============================================================ */
(function () {
const C = Tour.countries.seats;
if (!C) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length) Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const rowsOf = Gr => Gr.map(r => r.join(''));
const stamps = {};
const SIGN = text => ['spawn', 'sign', { text }];
const SCAF = (w, h, holes) => ['piece', 'seats.scaffold', { w, h, holes: holes || [] }];
const CRAWL = o => ['piece', 'seats.crawler', o];
const TELL = o => ['piece', 'seats.tell', o || {}];
// a secret room's stand-in stamp (the room kind builds its own place from it): its door out, its prize
const roomStamp = (out, look, items) => ({ floor: 12, rows: [
  '############################', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#..........................#',
  '#..........................#', '#..........................#', '#..........................#', '#.@..D..................?..#',
  '############################', '############################'], items: items || ['oneup'], doors: [{ to: out, look: look || 'seatsDoor' }] });
Tour.seatsKit.roomStamp = roomStamp;

/* ---------------- 33-1 Two Ways Round a Pole ---------------- */
// ground tops are row 23. ① the teach: a little scaffold over the boards, then one over the first pit; a long one
// with a Bolt Crab pacing its middle and a collar to swing round it; ② collars both sides of a critter pair, the tall
// scaffold up to the high bank (the cable-store ledge with the wrong-way seat at its top left: room B36); ③ the late
// Bolt Crab: it mirrors the climb about its collar and holds the bolted board shut; ④ two scaffolds over the last pit,
// critters on both faces, a let-go jump between them
const scafRows = (() => {
  const W = 246, H = 30, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 21, 23); put(Gr, 3, 22, '@'); put(Gr, 6, 22, 'k'); put(Gr, 17, 22, 'x');
  put(Gr, 10, 15, '1'); put(Gr, 11, 16, 'o.o.o.o'); put(Gr, 14, 12, '?');
  put(Gr, 20, 13, '2'); put(Gr, 22, 17, 'o.o.o.o.o'); put(Gr, 26, 15, '*');
  ground(Gr, 30, 40, 23); put(Gr, 33, 22, 'c'); put(Gr, 32, 19, '?'); put(Gr, 38, 22, 'K');
  // the long scaffold over the pit 41-54: a crab paces its middle row; the collar at its left swings round the back
  put(Gr, 36, 12, '3'); put(Gr, 44, 16, 'f'); put(Gr, 43, 13, 'o.o.o');
  ground(Gr, 55, 60, 23); put(Gr, 57, 22, 'x');
  // ② collars over the second pit; the bank with a checkpoint
  put(Gr, 58, 11, '5'); put(Gr, 66, 11, 'm'); put(Gr, 65, 17, 'n'); put(Gr, 61, 12, 'o.o'); put(Gr, 69, 12, 'o.o');
  ground(Gr, 74, 91, 23); put(Gr, 76, 22, 'c'); put(Gr, 85, 22, 'r'); put(Gr, 81, 19, 'o.o.o'); put(Gr, 79, 22, 'J');
  // the tall scaffold up to the high bank; the cable-store ledge above its top left (only the scaffold reaches it)
  put(Gr, 90, 6, '6'); put(Gr, 93, 9, 'e'); put(Gr, 101, 15, 'q'); put(Gr, 95, 18, 'o.o.o'); put(Gr, 97, 8, 'o.o.o');
  fillG(Gr, 82, 5, 88, 5, 'H'); put(Gr, 83, 4, 'A'); put(Gr, 86, 4, 'u'); put(Gr, 85, 2, 'o.o');
  ground(Gr, 106, 123, 13); put(Gr, 109, 12, 'c'); put(Gr, 113, 12, 'j'); put(Gr, 118, 9, '?'); put(Gr, 117, 12, 'x');
  ground(Gr, 124, 127, 16); ground(Gr, 128, 131, 19); ground(Gr, 132, 146, 23);
  put(Gr, 133, 22, 'a'); put(Gr, 136, 22, 'O'); put(Gr, 139, 22, 'l'); put(Gr, 125, 12, 'd');
  // ③ the late Bolt Crab: scaffold 146-171 over the pit 147-172, its collar at 156/14, the bolted board at 168
  put(Gr, 146, 10, '7'); put(Gr, 156, 14, 'X'); put(Gr, 168, 19, 'Z'); put(Gr, 150, 12, 'R');
  put(Gr, 149, 18, 'o.o.o'); put(Gr, 163, 17, 'o.o');
  ground(Gr, 173, 188, 23); put(Gr, 175, 22, 'c'); put(Gr, 182, 19, '?'); put(Gr, 179, 22, 'r');
  // ④ two scaffolds over the last pit, critters on both faces, a jump between them
  put(Gr, 189, 9, '9'); put(Gr, 194, 12, 'U'); put(Gr, 192, 16, 'V'); put(Gr, 192, 13, 'o.o.o');
  fillG(Gr, 202, 18, 205, 18, '-'); put(Gr, 206, 9, '0'); put(Gr, 210, 11, 'N'); put(Gr, 214, 15, 'M'); put(Gr, 209, 16, 'o.o.o');
  ground(Gr, 223, W - 1, 23); put(Gr, 225, 22, 'c'); put(Gr, 229, 22, 'r'); fillG(Gr, 233, 20, 234, 22, 'H'); put(Gr, 233, 16, 'P'); put(Gr, 240, 22, 'G');
  fillG(Gr, W - 1, 0, W - 1, 22, 'H');
  return rowsOf(Gr);
})();
const SCF = {
  k: SIGN('A SCAFFOLD! PUSH UP INTO IT TO GRIP, CLIMB WITH THE STICK, JUMP TO LET GO'),
  K: SIGN('A GOLD COLLAR ON A POLE: JUMP THERE TO SWING ROUND TO THE BACK. ONLY CRITTERS ON YOUR SIDE CAN TOUCH YOU'),
  J: SIGN('CRITTERS ON THE BACK ARE SHADOWS: THEY CANNOT TOUCH YOU UNTIL YOU GO ROUND'),
  O: SIGN('A BOLT CRAB THAT MIRRORS YOU: GO ROUND THE BACK, DOWN BEHIND IT, AND THROW THROUGH THE COLLAR'),
  x: ['decor', 'seatsCoilDecor'], l: ['enemy', 'seatsCrab'], r: ['enemy', 'seatsStoat'], j: ['enemy', 'seatsHen'], d: ['enemy', 'seatsShrew'],
  '1': SCAF(8, 5), '2': SCAF(12, 7),
  '3': SCAF(19, 8, [[2, 4]]), f: CRAWL({ kind: 'crab', face: 0, ax: 8, speed: 1.1 }),
  '5': SCAF(16, 9, [[4, 4], [11, 4]]),
  m: CRAWL({ kind: 'crab', face: 0, ay: 7, speed: 1.2 }), n: CRAWL({ kind: 'shrew', face: 1, ax: 4, speed: 1.0 }),
  '6': SCAF(18, 14, [[4, 10], [9, 4], [14, 8]]),
  e: CRAWL({ kind: 'shrew', face: 0, ax: 6, speed: 1.0 }), q: CRAWL({ kind: 'crab', face: 1, ay: -6, speed: 1.2 }),
  A: ['spawn', 'portal', { kind: 'door', look: 'seatsTrap', targetRef: 'store@in' }], u: TELL(), a: ['anchor', 'storeOut'],
  '7': SCAF(26, 10, [[10, 4], [2, 2]]), X: ['piece', 'seats.mirrorCrab', { id: 'seats:bolt1', rx: 5, ry: 4 }], Z: ['piece', 'seats.board', { id: 'seats:bolt1', h: 20 }],
  '9': SCAF(13, 11, [[3, 4], [9, 7]]), U: CRAWL({ kind: 'crab', face: 0, ay: 6, speed: 1.1 }), V: CRAWL({ kind: 'shrew', face: 1, ax: 7, speed: 1.0, phase: 1.5 }),
  '0': SCAF(16, 11, [[2, 6], [9, 3]]), N: CRAWL({ kind: 'shrew', face: 0, ax: 6, speed: 0.9 }), M: CRAWL({ kind: 'crab', face: 1, ax: 5, speed: 1.1, phase: 0.8 })
};
stamps.seatsScaffold = { floor: 23, rows: scafRows, legend: SCF, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power', 'power'] };
stamps.seatsStore = roomStamp('rows@storeOut', 'seatsDoor');
const L1 = { n: 1, time: 400, name: 'Two Ways Round a Pole', mapLabel: 'Two Ways Round a Pole', arch: 'roundpole', theme: 'seats_scaffold',
  gimmick: 'Scaffolds under the grandstand: grip, climb any way, swing round a pole at its gold collar to pass the critters on the other face. A late Bolt Crab mirrors your climb: go round the back and knock its spanner loose through the collar',
  hint: 'Only a critter on your side of the scaffold can touch you. The mirror crab always meets you on the front: go round the back, then THROW through the collar. A little seat facing the floor sits high over the tall scaffold...',
  postcard: 'Brady! There is a whole scaffold under the grandstand. I climbed round a pole in my good shoes and a crab tutted at me. ♥ C',
  enemies: [['seatsCrab', 2], ['seatsStoat', 3], ['seatsHen', 1], ['seatsShrew', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '33-2' } },
  areas: [
    { id: 'rows', gen: 'room', theme: 'seats_scaffold', stamp: 'seatsScaffold', camera: 'free', bottomKill: true },
    { id: 'store', gen: 'room', role: 'secret', theme: 'seats_room_store', stamp: 'seatsStore', room: 'seatsSpool' }
  ] };

/* ---------------- 33-2 Slack Department ---------------- */
// the fly floor, ground tops row 17. ① the teach: a short flat over a narrow pit, its rope tail on the boards before
// it; ② a longer flat with a Cable Hen laying coils across the rope tail; ③ a flat over a wide pit under a little fly
// gallery: once it is clamped, a jump from its middle goes up through the gallery's gap (the wrong-way seat by it) to
// the counterweight cage (room B37), which lets Brady out on the far bank; ④ the last flat spans three supports with
// a narrow window: too much slack tips it off the middle support
const fliesRows = (() => {
  const W = 204, H = 22, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 23, 17); put(Gr, 3, 16, '@'); put(Gr, 6, 16, 'k'); put(Gr, 10, 13, '?'); put(Gr, 2, 12, 'o.o.o');
  put(Gr, 24, 17, '1'); ground(Gr, 30, 49, 17);
  // the bank: a platform with the first postcard, a crab
  fillG(Gr, 34, 13, 37, 13, '-'); put(Gr, 35, 10, '*'); put(Gr, 41, 16, 'l'); put(Gr, 33, 16, 'c'); put(Gr, 44, 12, 'o.o.o');
  // ② the longer flat; the hen on its rope tail
  put(Gr, 50, 16, 'K'); ground(Gr, 50, 60, 17); put(Gr, 47, 16, 'j'); put(Gr, 61, 17, '2'); ground(Gr, 69, 99, 17);
  put(Gr, 64, 12, 'R'); put(Gr, 72, 16, 'c'); put(Gr, 76, 13, '?'); put(Gr, 80, 16, 'r'); fillG(Gr, 83, 13, 86, 13, '-'); put(Gr, 84, 11, 'o.o');
  // ③ the flat under the fly gallery (the room above it), the far bank
  put(Gr, 100, 17, '3'); fillG(Gr, 100, 8, 111, 8, 'H'); fillG(Gr, 100, 9, 100, 13, 'H'); fillG(Gr, 111, 9, 111, 13, 'H');
  fillG(Gr, 100, 14, 111, 14, 'H'); fillG(Gr, 105, 14, 106, 14, '.'); put(Gr, 104, 13, 'u'); put(Gr, 108, 13, 'A'); put(Gr, 102, 11, 'o.o');
  ground(Gr, 112, 145, 17); put(Gr, 115, 16, 'a'); put(Gr, 118, 16, 'c'); put(Gr, 124, 16, 'd'); fillG(Gr, 127, 13, 130, 13, '-'); put(Gr, 128, 10, '?'); put(Gr, 131, 16, 'O');
  // ④ the last flat over the wide pit, three supports
  put(Gr, 146, 17, '4'); ground(Gr, 162, W - 1, 17);
  put(Gr, 165, 16, 'c'); put(Gr, 170, 16, 'l'); fillG(Gr, 174, 13, 177, 13, '-'); fillG(Gr, 179, 10, 182, 10, '-'); put(Gr, 181, 7, 'P'); put(Gr, 175, 11, 'o.o');
  put(Gr, 186, 16, 'j'); put(Gr, 196, 16, 'G'); fillG(Gr, W - 1, 0, W - 1, 16, 'H');
  return rowsOf(Gr);
})();
const FLY = {
  k: SIGN('A FLAT ON A ROPE! STAND ON THE ROPE TAIL, HOLD THROW AND WALK: IT PAYS OUT LINE. LET GO WHEN IT READS LEVEL'),
  K: SIGN('TOO LOW? HOLD THROW AND WALK BACK: IT HAULS THE LINE IN'),
  O: SIGN('THE LAST FLAT SITS ON THREE SUPPORTS. GO GENTLY: TOO MUCH SLACK TIPS IT'),
  l: ['enemy', 'seatsCrab'], r: ['enemy', 'seatsStoat'], j: ['enemy', 'seatsHen'], d: ['enemy', 'seatsShrew'],
  '1': ['piece', 'seats.flat', { w: 6, tail: 6, gap: 2, target: 3 }],
  '2': ['piece', 'seats.flat', { w: 8, tail: 6, gap: 2, target: 4 }],
  '3': ['piece', 'seats.flat', { w: 12, tail: 7, gap: 2, target: 4 }],
  '4': ['piece', 'seats.flat', { w: 16, tail: 8, gap: 2, target: 5, win: 7, k: 0.8, mid: 8 }],
  A: ['spawn', 'portal', { kind: 'door', look: 'seatsDoor', targetRef: 'weights@in' }], u: TELL(), a: ['anchor', 'weightsOut']
};
stamps.seatsFlies = { floor: 17, rows: fliesRows, legend: FLY, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power'] };
stamps.seatsWeights = roomStamp('flies@weightsOut', 'seatsDoor');
const L2 = { n: 2, time: 360, name: 'Slack Department', mapLabel: 'Slack Department', arch: 'slackline', theme: 'seats_flies',
  gimmick: 'Painted flats hang over the pits from the flies. Stand on a flat\'s rope tail and hold THROW: walking pays out line, walking back hauls it in. Let go when it reads LEVEL and the stagehands clamp it into a bridge',
  hint: 'Watch the spirit level and the dashed line. The last flat rests on three supports: too much slack tips it. A little seat faces the floor up in the fly gallery...',
  postcard: 'Brady! The stagehands let me pay out a rope. I said "a bit more" four times and they said I was a natural. ♥ C',
  enemies: [['seatsCrab', 2], ['seatsHen', 2], ['seatsStoat', 1], ['seatsShrew', 1]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '33-3' } },
  areas: [
    { id: 'flies', gen: 'room', theme: 'seats_flies', stamp: 'seatsFlies', camera: 'free', bottomKill: true },
    { id: 'weights', gen: 'room', role: 'secret', theme: 'seats_room_weights', stamp: 'seatsWeights', room: 'seatsScale' }
  ] };

/* ---------------- 33-3 The Seat That Ate Row G ---------------- */
// the stalls under the balcony, ground tops row 17. ① the teach: a seat whose backrest a plain jump clears, then one
// whose backrest only the seat's rising lip clears; ② Row G: seats one after another, Seat Shrews folding themselves
// into seats between them; ③ the balcony overhead: a gap in its front over a seat (the wrong-way seat by it) is the
// way up to the props table (room B38), which lets Brady out further along; ④ the late twist: two seats share one
// hinge in front of the tallest backrest: only the far seat, both feet on it, lifts
const rowgRows = (() => {
  const W = 206, H = 22, Gr = grid(W, H, '.');
  ground(Gr, 0, W - 1, 17);
  // ① the teach
  put(Gr, 3, 16, '@'); put(Gr, 6, 16, 'k'); put(Gr, 9, 12, '?'); put(Gr, 3, 12, 'o.o');
  put(Gr, 13, 16, '1'); put(Gr, 22, 16, 'K'); put(Gr, 25, 16, '2'); put(Gr, 26, 8, 'o.o.o'); put(Gr, 27, 6, '*');
  put(Gr, 32, 16, 'c'); put(Gr, 36, 16, 'd');
  // ② Row G: four seats in a row (G1-G4), shrews between, a crab
  put(Gr, 42, 16, '3'); put(Gr, 49, 16, '4'); put(Gr, 56, 16, '5'); put(Gr, 63, 16, '6');
  put(Gr, 47, 16, 'e'); put(Gr, 54, 16, 'l'); put(Gr, 61, 16, 'e'); put(Gr, 50, 9, 'R'); put(Gr, 57, 9, 'o.o');
  put(Gr, 70, 16, 'c'); put(Gr, 74, 13, '?');
  // ③ the balcony: rows 2-9 over columns 78-100, its floor row 9 with a gap over the seat at 85; inside, the props door
  fillG(Gr, 78, 0, 100, 9, 'H'); fillG(Gr, 79, 3, 99, 8, '.'); fillG(Gr, 85, 9, 86, 9, '.');
  put(Gr, 84, 16, '7'); put(Gr, 88, 8, 'u'); put(Gr, 95, 8, 'A'); put(Gr, 90, 6, 'o.o.o');
  put(Gr, 80, 16, 'r'); put(Gr, 92, 16, '8'); put(Gr, 97, 16, 'd'); put(Gr, 104, 16, 'a'); put(Gr, 107, 16, 'c');
  // more rows: a pair of seats back to back (jump one, then the next), a stoat, a hen
  put(Gr, 114, 16, '9'); put(Gr, 122, 16, '0'); put(Gr, 118, 16, 'r'); put(Gr, 128, 16, 'j'); fillG(Gr, 131, 13, 134, 13, '-'); put(Gr, 132, 11, 'o.o');
  put(Gr, 138, 16, 'c'); put(Gr, 141, 16, 'O');
  // ④ the shared hinge before the tallest backrest; then the high postcard over the last row
  put(Gr, 147, 16, 'X'); put(Gr, 154, 16, 'e'); put(Gr, 158, 16, 'Y'); put(Gr, 161, 8, 'P');
  put(Gr, 166, 16, 'c'); put(Gr, 172, 16, 'l'); put(Gr, 180, 13, '?'); put(Gr, 186, 16, 'j'); put(Gr, 198, 16, 'G');
  fillG(Gr, W - 1, 0, W - 1, 16, 'H');
  return rowsOf(Gr);
})();
const SEAT = (h, o) => ['piece', 'seats.seat', Object.assign({ h }, o || {})];
const RG = {
  k: SIGN('FOLD-UP SEATS! STAND ON ONE AND JUMP: ITS RISING LIP LIFTS YOU OVER THE NEXT BACKREST'),
  K: SIGN('A PLAIN JUMP WILL NOT CLEAR THIS BACKREST. JUMP FROM THE SEAT'),
  O: SIGN('TWO SEATS ON ONE HINGE: THE LIP ONLY LIFTS WITH BOTH FEET ON THE FAR SEAT'),
  l: ['enemy', 'seatsCrab'], r: ['enemy', 'seatsStoat'], j: ['enemy', 'seatsHen'], d: ['enemy', 'seatsShrew'], e: ['enemy', 'seatsShrew'],
  '1': SEAT(3, { label: 'F1' }), '2': SEAT(5, { label: 'F2' }),
  '3': SEAT(5, { label: 'G1' }), '4': SEAT(5, { label: 'G2' }), '5': SEAT(6, { label: 'G3' }), '6': SEAT(5, { label: 'G4' }),
  '7': SEAT(3, { label: 'H1' }), '8': SEAT(5, { label: 'H2' }), '9': SEAT(5, { label: 'J1' }), '0': SEAT(6, { label: 'J2' }),
  X: SEAT(6, { pair: true, label: 'K1' }), Y: SEAT(5, { label: 'K2' }),
  A: ['spawn', 'portal', { kind: 'door', look: 'seatsDoor', targetRef: 'props@in' }], u: TELL(), a: ['anchor', 'propsOut']
};
stamps.seatsRowG = { floor: 17, rows: rowgRows, legend: RG, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power', 'power'] };
stamps.seatsProps = roomStamp('stalls@propsOut', 'seatsDoor');
const L3 = { n: 3, time: 360, name: 'The Seat That Ate Row G', mapLabel: 'The Seat That Ate Row G', arch: 'foldseat', theme: 'seats_rowg',
  gimmick: 'Fold-up seats with tall backrests. Stand on a seat and jump: its rising lip lifts you over the next backrest. Two seats on one shared hinge lift only from the far seat',
  hint: 'A plain jump clears a short backrest, never a tall one. On a shared hinge, both feet on the far seat. A little seat faces the floor up in the balcony...',
  postcard: 'Brady! A seat in row G folded me up like a sandwich. A shrew pretended to be a seat next to me. I sat on it. We are friends now. ♥ C',
  enemies: [['seatsShrew', 4], ['seatsCrab', 2], ['seatsStoat', 2], ['seatsHen', 2]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '33-4' } },
  areas: [
    { id: 'stalls', gen: 'room', theme: 'seats_rowg', stamp: 'seatsRowG', camera: 'free', bottomKill: true },
    { id: 'props', gen: 'room', role: 'secret', theme: 'seats_room_props', stamp: 'seatsProps', room: 'seatsEgg' }
  ] };

/* ---------------- 33-4 Please Mind the Scenery ---------------- */
// the stage during the show, ground tops row 17: the wings between stretches of stage the house watches. ① the teach:
// one flat on its track across a short stage; ② a longer stage: the flat starts over a stage door (the wrong-way seat
// by it): roll it away and the door to the green room (room B39) shows, which lets Brady out in the next wings; ③ two
// flats in a row (hand over between looks), a Sandbag Stoat; ④ the finale: twin flats roped over one pulley, their
// doorways overlap only shoulder-wide; the big look can only be borne standing in that overlap, and then the curtain
// across the way flies out
const dockRows = (() => {
  const W = 206, H = 22, Gr = grid(W, H, '.');
  ground(Gr, 0, W - 1, 17);
  put(Gr, 3, 16, '@'); put(Gr, 6, 16, 'k'); put(Gr, 10, 13, '?'); put(Gr, 2, 12, 'o.o.o');
  put(Gr, 16, 16, 'v'); put(Gr, 16, 15, '1');
  put(Gr, 38, 16, 'c'); fillG(Gr, 39, 13, 42, 13, '-'); put(Gr, 40, 10, '*'); put(Gr, 41, 16, 'K');
  put(Gr, 45, 16, 'i'); put(Gr, 46, 15, '2'); put(Gr, 44, 16, 'u'); put(Gr, 48, 16, 'A'); put(Gr, 62, 16, 'r');
  put(Gr, 76, 16, 'c'); put(Gr, 78, 13, '?'); fillG(Gr, 79, 11, 82, 11, '-'); put(Gr, 80, 8, 'R'); put(Gr, 81, 16, 'a'); put(Gr, 83, 16, 'l');
  put(Gr, 85, 16, 'm'); put(Gr, 86, 15, '3'); put(Gr, 104, 15, '4'); put(Gr, 110, 16, 'r');
  put(Gr, 124, 16, 'c'); put(Gr, 128, 13, '?'); put(Gr, 126, 16, 'j'); put(Gr, 131, 16, 'O');
  put(Gr, 135, 16, 'n'); put(Gr, 150, 15, '6'); put(Gr, 138, 15, '5'); put(Gr, 166, 16, 'Z');
  put(Gr, 170, 16, 'c'); fillG(Gr, 174, 13, 177, 13, '-'); fillG(Gr, 179, 10, 182, 10, '-'); put(Gr, 180, 7, 'P'); put(Gr, 176, 11, 'o.o');
  put(Gr, 186, 16, 'd'); put(Gr, 196, 16, 'G'); fillG(Gr, W - 1, 0, W - 1, 16, 'H');
  return rowsOf(Gr);
})();
const DK = {
  k: SIGN('THE SHOW IS ON! WHEN THE HOUSE LOOKS, STAND IN A PAINTED DOORWAY. WALK IN ONE AND THE FLAT ROLLS WITH YOU'),
  K: SIGN('THE EYES OUT FRONT GLINT BEFORE THE HOUSE LOOKS. GET IN A DOORWAY'),
  O: SIGN('TWIN FLATS ON ONE ROPE: PUSH THE FRONT ONE AND THE BACK ONE SLIDES THE OTHER WAY. THEIR DOORWAYS MEET ONCE'),
  l: ['enemy', 'seatsCrab'], r: ['enemy', 'seatsStoat'], j: ['enemy', 'seatsHen'], d: ['enemy', 'seatsShrew'],
  v: ['piece', 'seats.house', { w: 20, period: 4.6, phase: 0 }],
  '1': ['piece', 'seats.backdrop', { w: 6, h: 5, dl: 2, dw: 2, track: 14, art: 0 }],
  i: ['piece', 'seats.house', { w: 28, period: 4.6, phase: 1.2 }],
  '2': ['piece', 'seats.backdrop', { w: 6, h: 5, dl: 3, dw: 2, track: 20, art: 1 }],
  m: ['piece', 'seats.house', { w: 36, period: 4.4, phase: 0.5 }],
  '3': ['piece', 'seats.backdrop', { w: 6, h: 5, dl: 2, dw: 2, track: 12, art: 2 }], '4': ['piece', 'seats.backdrop', { w: 6, h: 5, dl: 2, dw: 2, track: 11, art: 0 }],
  n: ['piece', 'seats.house', { w: 31, period: 6.2, tell: 1.4, look: 2.4, phase: 2, finale: true, id: 'seats:finale', kx: 12 }],
  '5': ['piece', 'seats.backdrop', { w: 6, h: 5, dl: 2, dw: 1, track: 14, fid: 'front', link: 'back', art: 1 }],
  '6': ['piece', 'seats.backdrop', { w: 6, h: 6, dl: 3, dw: 1, track: -14, fid: 'back', rear: true, art: 2 }],
  Z: ['piece', 'seats.curtain', { id: 'seats:finale', h: 7 }],
  A: ['spawn', 'portal', { kind: 'door', look: 'seatsDoor', targetRef: 'green@in' }], u: TELL(), a: ['anchor', 'greenOut']
};
stamps.seatsDock = { floor: 17, rows: dockRows, legend: DK, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power'] };
stamps.seatsGreen = roomStamp('dock@greenOut', 'seatsDoor');
const L4 = { n: 4, time: 380, name: 'Please Mind the Scenery', mapLabel: 'Please Mind the Scenery', arch: 'pushflat', theme: 'seats_dock',
  gimmick: 'The show is on. When the house looks, stand in a painted doorway and they think you are scenery. Walk in a doorway and the flat rolls along with you. The twin flats\' doorways meet only once',
  hint: 'The eyes out front glint before the house looks. Twin flats: push the front one until the two doorways overlap and stand right in it. A little seat faces the floor where the second flat starts...',
  postcard: 'Brady! I crossed the stage in the middle of the show inside a painted door. A whole row of owls clapped. I bowed. ♥ C',
  enemies: [['seatsStoat', 3], ['seatsCrab', 1], ['seatsHen', 1], ['seatsShrew', 1]],
  mapCell: [3, 0], mapFrom: 2,
  exits: { main: { to: '33-5' } },
  areas: [
    { id: 'dock', gen: 'room', theme: 'seats_dock', stamp: 'seatsDock', camera: 'free', bottomKill: true },
    { id: 'green', gen: 'room', role: 'secret', theme: 'seats_room_green', stamp: 'seatsGreen', room: 'seatsGap' }
  ] };

/* ---------------- 33-5 House Left ---------------- */
// house left, ground tops row 17: three scenes. Each: a follow-spot on its stand at the edge of the orchestra pit,
// the stage across it where the tin stagehands mill about. ① two stagehands; ② three, walking; then a gantry up from
// the wings (the wrong-way seat at its top) to the band pit (room B40), which lets Brady out by the last scene;
// ③ the last scene: the right stagehand walks behind two enormous false moustaches on sticks
const houseRows = (() => {
  const W = 200, H = 22, Gr = grid(W, H, '.');
  ground(Gr, 0, 22, 17); put(Gr, 3, 16, '@'); put(Gr, 7, 16, 'k'); put(Gr, 10, 13, '?'); put(Gr, 3, 12, 'o.o.o');
  put(Gr, 20, 16, '1'); ground(Gr, 31, 61, 17);
  put(Gr, 49, 16, 'c'); fillG(Gr, 50, 13, 53, 13, '-'); put(Gr, 51, 10, '*'); put(Gr, 55, 16, 'r'); put(Gr, 45, 12, 'o.o');
  put(Gr, 59, 16, '2'); ground(Gr, 71, 105, 17);
  put(Gr, 90, 16, 'c'); put(Gr, 94, 13, '?'); put(Gr, 97, 16, 'j');
  // the gantry: steps up from the wings to a walkway at row 7 with the band-pit door
  fillG(Gr, 79, 14, 81, 14, '-'); fillG(Gr, 83, 11, 85, 11, '-'); fillG(Gr, 79, 8, 88, 8, '-'); put(Gr, 80, 7, 'u'); put(Gr, 86, 7, 'A'); put(Gr, 82, 5, 'o.o');
  put(Gr, 100, 16, 'O'); put(Gr, 103, 16, '3'); ground(Gr, 116, W - 1, 17);
  put(Gr, 137, 16, 'a'); put(Gr, 140, 16, 'c'); put(Gr, 146, 16, 'l'); fillG(Gr, 152, 13, 155, 13, '-'); fillG(Gr, 157, 10, 160, 10, '-'); put(Gr, 158, 7, 'P'); put(Gr, 150, 12, 'o.o');
  put(Gr, 163, 13, 'R'); fillG(Gr, 162, 14, 164, 14, '-'); put(Gr, 170, 16, 'd'); put(Gr, 176, 13, '?'); put(Gr, 182, 16, 'r'); put(Gr, 192, 16, 'G');
  fillG(Gr, W - 1, 0, W - 1, 16, 'H');
  return rowsOf(Gr);
})();
const HL = {
  k: SIGN('A FOLLOW-SPOT! ON ITS MARK THE STICK SWINGS IT AND THROW FOCUSES IT. LIGHT THE STAGEHAND THE BOARD CALLS'),
  O: SIGN('LAST SCENE: SCENERY MOUSTACHES. THE SPOT CANNOT FIND ANYONE BEHIND THEM'),
  l: ['enemy', 'seatsCrab'], r: ['enemy', 'seatsStoat'], j: ['enemy', 'seatsHen'], d: ['enemy', 'seatsShrew'],
  '1': ['piece', 'seats.spot', { gap: 2, pit: 8, stage: [12, 26], hands: [[14, 17, 0.7, 0], [20, 25, 0.8, 1]], right: 1 }],
  '2': ['piece', 'seats.spot', { gap: 2, pit: 9, stage: [13, 32], hands: [[13, 20, 1.0, 2], [18, 26, 0.9, 0], [24, 31, 1.1, 1]], right: 0 }],
  '3': ['piece', 'seats.spot', { gap: 2, pit: 10, stage: [14, 33], hands: [[14, 20, 0.9, 1], [16, 31, 1.1, 2], [26, 33, 0.8, 0]], right: 1, mous: [20, 27] }],
  A: ['spawn', 'portal', { kind: 'door', look: 'seatsDoor', targetRef: 'pit@in' }], u: TELL(), a: ['anchor', 'pitOut']
};
stamps.seatsHouse = { floor: 17, rows: houseRows, legend: HL, gold: { '*': 'must', R: 'risky', P: 'high' }, items: ['power', 'power', 'power'] };
stamps.seatsPit = roomStamp('house@pitOut', 'seatsDoor');
const L5 = { n: 5, time: 380, name: 'House Left', mapLabel: 'House Left', arch: 'followspot', theme: 'seats_house',
  gimmick: 'A follow-spot at the edge of the orchestra pit. The stick swings it along the stage, THROW focuses it. Light the stagehand the call board names and he takes his bow and puts his plank across the pit',
  hint: 'Match the number and the colour on the call board. In the last scene the right stagehand walks behind the false moustaches: wait for him to come out. A little seat faces the floor up on the gantry...',
  postcard: 'Brady! I worked the follow-spot. I lit the wrong tin man twice and he shrugged at me both times. Very professional. ♥ C',
  enemies: [['seatsStoat', 2], ['seatsCrab', 1], ['seatsHen', 1], ['seatsShrew', 1]],
  mapCell: [4, 0], mapFrom: 3,
  exits: { main: { to: '33-6' } },
  areas: [
    { id: 'house', gen: 'room', theme: 'seats_house', stamp: 'seatsHouse', camera: 'free', bottomKill: true },
    { id: 'pit', gen: 'room', role: 'secret', theme: 'seats_room_pit', stamp: 'seatsPit', room: 'seatsRest' }
  ] };

//NEXT
Tour.amend('seats', { stamps, levels: [L1, L2, L3, L4, L5] });
Tour.seatsKit.L = { L1, L2, L3, L4, L5 };

/* ---------------- the land's map: a stage seen from the wings, the route a loop round the trap room ---------------- */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.seats = {
  labels: { '33-1': 'Two Ways Round a Pole', '33-2': 'Slack Department', '33-3': 'The Seat That Ate Row G', '33-4': 'Please Mind the Scenery', '33-5': 'House Left', '33-6': 'Just One More Bow' },
  w: 1520, h: 760,
  pal: { sea: '#2a1424', deep: '#1a0a14', land: '#8a5a3a', light: '#a8744a', path: '#f4e6c4', beach: '#6a4228', cliff: '#4e1430', roof: '#c8562a', wall: '#f4e6c4' },
  sea: 'clouds', coast: 'seatsCurtain', tufts: 'none', trail: 'stones', bridge: 'rope', meadow: false, woods: false, foam: false, birds: false,
  land: [[[220, 300], [420, 200], [760, 170], [1100, 200], [1320, 300], [1360, 480], [1240, 640], [920, 690], [600, 690], [300, 640], [200, 480]]],
  // the route runs a horseshoe round the stage: down the left wing, across the front of the stalls, up the right wing
  nodes: { start: [320, 260], '33-1': [330, 420, 's'], '33-2': [430, 580, 's'], '33-3': [640, 620, 's'], '33-4': [860, 620, 's'], '33-5': [1080, 580, 's'], '33-6': [1200, 400, 'n'], port: [1220, 250] },
  paths: { 'start>33-1': [[300, 340]], '33-1>33-2': [[360, 510]], '33-2>33-3': [[530, 630]], '33-3>33-4': [[750, 650]], '33-4>33-5': [[980, 630]], '33-5>33-6': [[1170, 500]], '33-6>port': [[1240, 320]] },
  feat: [
    ['sprite', 'seatsDoorSprite', 250, 250, 24], ['sprite', 'seatsTowerSprite', 520, 420, 30], ['sprite', 'seatsSeatSprite', 760, 470, 24], ['sprite', 'seatsBagSprite', 640, 330, 24],
    ['sprite', 'seatsTowerSprite', 980, 420, 26], ['sprite', 'seatsSeatSprite', 470, 300, 20], ['sprite', 'seatsBasketSprite', 1100, 300, 26]
  ],
  flora: ['rock'], density: 0,
  live: [['circle', 760, 360, 70, 0.5]]
};
})();
