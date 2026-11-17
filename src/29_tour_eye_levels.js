/* ============================================================
   THE RED-EYE: the levels (world 25) and the land's map. Bonus levels (arch 'bonus': exempt from the archetype
   caps), each a different kind of place:
   25-1 AISLE SEAT: a CHASE down the night cabin. The drinks trolley broke loose and is coming down the aisle with
        everything it has collected. Hop the seat rows, bounce off the snoring walrus to the high bin, hop the cola
        spill, ride the sleepy sloth along the bin rail. The galley curtain halfway down hides the crew rest.
   25-2 TURBULENCE: a ROUTE through the jet's three decks (the upper deck, the main cabin, the cargo hold). Every few
        seconds the seat-belt light dings and the cabin lurches: the loose galley cart, the jammed cart upstairs and a
        cargo container slide to their other spot. Work out which way round, and when.
   25-3 WING WALK: OUTSIDE, on the wing in bright daylight over the clouds: tilting flaps that fling you, the engines'
        hot exhaust that lifts you, a gull escort across the gap where a wing panel is missing. One gap in the wing is
        safe (the landing-gear bay is open under it, the yellow escape slide puffed up): the backstage, with a
        Wormhole back to Japan.
   25-4 CAPTAIN GULL: the boss, in the cargo hold.
   Where everything is: docs/design/BACKSTAGE_STATUS.md.
   ============================================================ */
(function () {
const C = Tour.countries.eye;
if (!C) return;
// join stamps side by side (each a list of rows of the same height)
const joinH = (...segs) => { const H = segs[0].length, out = []; for (let y = 0; y < H; y++) out.push(segs.map(s => s[y]).join('')); return out; };

/* ---------------- 25-1 Aisle Seat (the chase) ---------------- */
// the cabin: a ceiling of two rows, the floor on row 12. Seat rows (H) two high, open overhead bins (-) on row 7.
const A1 = {
  start: [
    '####################',
    '####################',
    '#..l........l.......',
    '#...................',
    '#...................',
    '#...................',
    '#...................',
    '#.......--------....',
    '#...p...............',
    '#...................',
    '#...................',
    '#.@.k...............',
    '####################',
    '####################',
    '####################'],
  economy: [
    '############################',
    '############################',
    '....l..........l.......l....',
    '............................',
    '............................',
    '............................',
    '...o.o.o.....o.o.o.....o.o..',
    '..-------...-------...------',
    '............................',
    '...j.........j.........j....',
    '..HHH.......HHH.......HHH...',
    '..HHH...n...HHH.......HHH...',
    '############################',
    '############################',
    '############################'],
  walrus: [
    '########################',
    '########################',
    '.....l.........l........',
    '......o*o...............',
    '.....-----..............',
    '........................',
    '...........o.o.o........',
    '...........-----........',
    '........................',
    '................j.......',
    '....w..........HHH......',
    '....HHH........HHH......',
    '########################',
    '########################',
    '########################'],
  bins: [
    '##########################',
    '##########################',
    '..l.......l.......l.......',
    '..........................',
    '..........................',
    '..........................',
    '...x.......x.......x......',
    '..........................',
    '........o.o.o.............',
    '......j.......j...........',
    '.....HHH.....HHH..........',
    '.....HHH.....HHH......n...',
    '##########################',
    '##########################',
    '##########################'],
  galley: [
    '########################',
    '########################',
    '..l..........l..........',
    '........................',
    '........................',
    '........................',
    '........................',
    '...........----.........',
    '........................',
    '........................',
    '........................',
    '..u...c...r.K..a........',
    '########################',
    '########################',
    '########################'],
  sloth: [
    '############################',
    '############################',
    '..l.........l.........l.....',
    '................P...........',
    '...o.o.o.o.....----.........',
    '............................',
    '............................',
    '...z........................',
    '............................',
    '.j........j.................',
    'HHH......HHH................',
    'HHH......HHH.......n........',
    '############################',
    '############################',
    '############################'],
  spill: [
    '########################',
    '########################',
    '....l........l..........',
    '........................',
    '........................',
    '......o.o.o.o...........',
    '........................',
    '......------............',
    '........................',
    '....j.........j.........',
    '...HHH........HHH.......',
    '...HHH8.......HHH..n....',
    '######yyyyyyyy##########',
    '########################',
    '########################'],
  pods: [
    '##########################',
    '##########################',
    '...l.......l.......l......',
    '..........................',
    '..........................',
    '....o.o.o....o.o.o........',
    '...------...------........',
    '..........................',
    '..........................',
    '...HH......HH......HH.....',
    '...HH......HH......HH.....',
    '...HH...n..HH......HH.....',
    '##########################',
    '##########################',
    '##########################'],
  front: [
    '##################',
    '##################',
    '...l........l....#',
    '.................#',
    '.................#',
    '.................#',
    '.................#',
    '.................#',
    '.................#',
    '.................#',
    '.................#',
    '..u.......G...f..#',
    '##################',
    '##################',
    '##################']
};
const AISLE = {
  l: ['decor', 'eyeLamp'], j: ['decor', 'eyeSnoozer'], u: ['decor', 'eyeGalley'], f: ['decor', 'eyeCockpit'], r: ['decor', 'bkCrewSign'],
  n: ['enemy', 'eyeGoose'], p: ['piece', 'box', { item: 'power' }], w: ['piece', 'walrus', { w: 3 }], z: ['piece', 'sloth', { ax: 6, w: 3, speed: 0.8 }],
  x: ['piece', 'binDrop', {}], a: ['anchor', 'crewBack'],
  k: ['spawn', 'sign', { text: 'THE DRINKS TROLLEY HAS BROKEN LOOSE! RUN FOR THE FRONT GALLEY!' }], '8': ['decor', 'eyeSpill'],
  K: ['spawn', 'portal', { kind: 'door', look: 'eyeCurtain', targetRef: 'crew@in' }]
};
const stamps = {
  eyeAisle: { floor: 12, rows: joinH(A1.start, A1.economy, A1.walrus, A1.bins, A1.galley, A1.sloth, A1.spill, A1.pods, A1.front), legend: AISLE, gold: { '*': 'must', P: 'high' } },
  // the crew rest behind the galley curtain: bunks up the wall, everyone asleep; P2 on the top bunk, a hidden 1UP
  eyeCrewRest: {
    floor: 12,
    rows: [
      '##############################',
      '#............................#',
      '#..............*.............#',
      '#...........-------..........#',
      '#..o.o.o.....................#',
      '#.-------............h.......#',
      '#............................#',
      '#..j.........j...-------.....#',
      '#..-----.....----............#',
      '#............................#',
      '#............................#',
      '#.@...D..l..........l...m....#',
      '##############################',
      '##############################'],
    gold: { '*': 'hidden' }, hidden: ['oneup'],
    doors: [{ to: 'cabin@crewBack', look: 'eyeCurtain' }],
    legend: { j: ['decor', 'eyeSnoozer'], l: ['decor', 'eyeLamp'], m: ['piece', 'box', { item: 'star' }] }
  }
};
const L1 = { n: 1, name: 'Aisle Seat', mapLabel: 'Aisle Seat', arch: 'bonus', tag: 'CHASE', theme: 'eye_chase',
  gimmick: 'The drinks trolley has broken loose and is chasing you down the night cabin: hop the seats, bounce off the snoring walrus, ride the sleepy sloth along the bins',
  hint: 'Don\'t stop! The walrus\'s belly is a trampoline. The galley curtain halfway down hides somewhere quiet...',
  postcard: 'A night flight! Everyone is asleep. A walrus is snoring in 23B. ♥ C',
  enemies: [['eyeGoose', 3]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '25-2' } },
  areas: [
    { id: 'cabin', gen: 'room', theme: 'eye_chase', stamp: 'eyeAisle', chase: { speed: 3.4, ramp: 0.3, look: 'trolley', floor: 12 } },
    { id: 'crew', gen: 'room', role: 'secret', theme: 'eye_cabin', stamp: 'eyeCrewRest' }
  ] };

/* ---------------- 25-2 Turbulence (the three decks) ---------------- */
// rows: the roof 0; the upper deck (only over the front two thirds) 1-7 with its floor on 8; the main cabin 9-17 with
// its floor on 18; the cargo hold 19-25 with its floor on 26. Toggle group 0 is the lurch (auto): A, the cart bridging
// the hole in the cabin floor (or parked beyond it); J, the jammed cart upstairs (blocking the passage at 78, or slid
// back to 70); M, the cargo container (beside the crate stack, or away from it).
// (drawn with a few calls instead of typed rows: a grid of '#', the decks cut out, then each thing put at its spot)
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (G, x, y, str) => { for (let k = 0; k < str.length; k++) G[y][x + k] = str[k]; };
const fillG = (G, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) G[y][x] = ch; };
const rowsOf = G => G.map(r => r.join(''));
const deckRows = (() => {
  const G = grid(120, 28, '#');
  fillG(G, 44, 1, 118, 7, '.');          // the upper deck (the hump at the front)
  fillG(G, 1, 9, 118, 17, '.');          // the main cabin
  fillG(G, 1, 19, 118, 25, '.');         // the cargo hold
  fillG(G, 80, 9, 80, 17, '#');          // the first-class bulkhead: the front cabin is reached from below or above
  // the upper deck: the stairs down, the galley, P1 over the lounge sofa, the jammed cart, the flight deck
  put(G, 47, 2, 'l'); put(G, 95, 2, 'l'); put(G, 62, 1, 'e'); put(G, 100, 1, 'e');
  put(G, 48, 7, 'V.i'); put(G, 56, 7, 't'); put(G, 66, 7, 'n');
  put(G, 55, 3, 'o.o.o*o.o.o'); put(G, 54, 4, '------------');
  put(G, 78, 3, 'J');
  put(G, 90, 4, 'o.o.o'); put(G, 89, 5, '-------');
  put(G, 104, 7, 'P.k.....G...f');
  // the main cabin: the start, seat rows, the hole in the floor and its cart, the stairs up, the galley lift
  put(G, 2, 9, 'E'); put(G, 1, 19, '9'); put(G, 4, 9, 'l'); put(G, 24, 9, 'l'); put(G, 46, 9, 'l'); put(G, 70, 9, 'l'); put(G, 88, 9, 'l'); put(G, 110, 9, 'l'); put(G, 36, 9, 'e');
  put(G, 2, 17, '@.x'); put(G, 5, 14, 'p'); put(G, 10, 13, 'o.o.o');
  for (const x of [7, 14, 32]) { put(G, x, 15, '.j.'); put(G, x, 16, 'HHH'); put(G, x, 17, 'HHH'); }
  put(G, 19, 17, 'q'); put(G, 22, 18, 'A..');
  put(G, 38, 13, '------'); put(G, 39, 12, 'o.o.o');
  put(G, 44, 17, 'U.d'); put(G, 50, 17, 't'); put(G, 54, 17, 'X.3'); put(G, 66, 17, 'n');
  put(G, 56, 12, '--------'); put(G, 57, 11, 'o.o.o.o');
  // first class (behind the bulkhead): pods, the hatch down to the hold, the front stairs up
  for (const x of [83, 90]) { put(G, x, 14, '.j.'); put(G, x, 15, 'HHH'); put(G, x, 16, 'HHH'); put(G, x, 17, 'HHH'); }
  put(G, 86, 12, 'o.o.o'); put(G, 85, 13, '-------');
  put(G, 98, 17, 'r.u.....w.O');
  // the cargo hold: crates, the galley lift, the container and the crate stack, the ladder up, the pets' false wall
  put(G, 10, 24, 'BB'); put(G, 10, 25, 'BB'); put(G, 30, 25, 'a'); put(G, 40, 22, 'p');
  put(G, 54, 25, 'Y.4');
  put(G, 64, 23, 'M');
  fillG(G, 75, 21, 76, 25, 'B'); put(G, 75, 20, 'R');
  put(G, 86, 25, 'a');
  put(G, 98, 25, 'm.N');
  fillG(G, 112, 19, 112, 21, '#'); fillG(G, 112, 22, 112, 25, 'F'); put(G, 106, 25, '2.2'); put(G, 114, 25, 'z.Z');
  return rowsOf(G);
})();
const TURB = {
  // the lurch's moving parts (piece 'slide': the letter is rect A's top-left)
  A: ['piece', 'slide', { w: 3, h: 1, dx: 4, dy: -1, tile: 'SEMI', look: 'cart' }],
  J: ['piece', 'slide', { w: 2, h: 5, dx: -8, dy: 0, tile: 'HARD', look: 'jam' }],
  M: ['piece', 'slide', { w: 3, h: 3, dx: 8, dy: 0, tile: 'HARD', look: 'container' }],
  E: ['piece', 'lurch', { g: 0 }], '9': ['piece', 'holdWall', { x0: 1, x1: 118, floor: 26 }],
  // the stairs between the decks, the galley lift down to the hold, the cargo ladder up to the front cabin
  U: ['spawn', 'portal', { kind: 'door', look: 'eyeStairs', targetRef: 'deck@stairTop' }],
  V: ['spawn', 'portal', { kind: 'door', look: 'eyeStairs', targetRef: 'deck@stairBot' }],
  P: ['spawn', 'portal', { kind: 'door', look: 'eyeStairs', targetRef: 'deck@frontBot' }],
  O: ['spawn', 'portal', { kind: 'door', look: 'eyeStairs', targetRef: 'deck@frontTop' }],
  X: ['spawn', 'portal', { kind: 'door', look: 'eyeLift', targetRef: 'deck@liftBot' }],
  Y: ['spawn', 'portal', { kind: 'door', look: 'eyeLift', targetRef: 'deck@liftTop' }],
  N: ['spawn', 'portal', { kind: 'door', look: 'eyeHatch', targetRef: 'deck@ladderTop' }],
  Z: ['spawn', 'portal', { kind: 'door', look: 'eyeHatch', targetRef: 'pets@in' }],
  u: ['spawn', 'portal', { kind: 'door', look: 'eyeHatch', targetRef: 'deck@ladderBot' }],
  i: ['anchor', 'stairTop'], d: ['anchor', 'stairBot'], k: ['anchor', 'frontTop'], w: ['anchor', 'frontBot'],
  '3': ['anchor', 'liftTop'], '4': ['anchor', 'liftBot'], r: ['anchor', 'ladderTop'], m: ['anchor', 'ladderBot'], z: ['anchor', 'petsBack'],
  l: ['decor', 'eyeLamp'], j: ['decor', 'eyeSnoozer'], t: ['decor', 'eyeGalley'], f: ['decor', 'eyeCockpit'], e: ['decor', 'eyeBeltSign'], '2': ['decor', 'eyePaws'],
  n: ['enemy', 'eyeTray'], q: ['enemy', 'eyeTray'], a: ['enemy', 'eyeBag'], p: ['piece', 'box', { item: 'power' }],
  x: ['spawn', 'sign', { text: 'TURBULENCE! WHEN THE SEAT-BELT LIGHT DINGS, HOLD DOWN TO BRACE. LOOSE CARTS SLIDE WITH EVERY LURCH' }]
};
stamps.eyeDecks = { floor: 17, rows: deckRows, legend: TURB, gold: { '*': 'must', R: 'risky' } };
// the pet hold behind the false wall in the cargo hold: a warm little room of travelling pets (all asleep)
stamps.eyePetHold = {
  floor: 12,
  rows: [
    '############################',
    '#..........................#',
    '#.................*........#',
    '#..............-----.......#',
    '#..........................#',
    '#........h.................#',
    '#...-----..................#',
    '#..........................#',
    '#..........-----...........#',
    '#..........................#',
    '#..........................#',
    '#.@...D...k....k.....k.....#',
    '############################',
    '############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'deck@petsBack', look: 'eyeHatch' }],
  legend: { k: ['decor', 'eyeCrate'] }
};
const L2 = { n: 2, name: 'Turbulence', mapLabel: 'Turbulence', arch: 'maze', tag: 'ROUTE', theme: 'eye_turb',
  gimmick: 'The jet\'s three decks in turbulence: every few seconds the seat-belt light dings and the cabin lurches; loose carts and containers slide to their other spot. Find your way to the flight deck',
  hint: 'When the seat-belt light dings, hold DOWN to brace. The lurch moves the jammed cart upstairs, the cart over the hole and the container in the hold: wait for the right one',
  postcard: 'BUMPY! The seat-belt light keeps dinging. The trays are sliding everywhere. ♥ C',
  enemies: [['eyeTray', 3]],
  mapCell: [1, 0], mapFrom: 0,
  areas: [
    { id: 'deck', gen: 'room', theme: 'eye_turb', stamp: 'eyeDecks', camera: 'lanes', lanes: { upper: 8, main: 18, hold: 26 } },
    { id: 'pets', gen: 'room', role: 'secret', theme: 'eye_hold', stamp: 'eyePetHold' }
  ] };

/* ---------------- 25-3 Wing Walk ---------------- */
// the wing's top is row 13 (two rows thick); under it, open sky down to row 21: a fall is the end of a life, except
// into the engines' exhaust (it blows you back up) and into the gap over the open landing-gear bay (the backstage)
const wingRows = (() => {
  const G = grid(136, 22, '.');
  fillG(G, 0, 13, 134, 14, '#');         // the wing, two rows thick, from the fuselage to the tip
  fillG(G, 0, 15, 3, 21, '#');           // the fuselage's side going down at the wing root
  // the start at the over-wing exit, a power block
  put(G, 4, 12, 'f.@.k'); put(G, 11, 9, 'p');
  // a deadly gap (sky), a flap that flings you up to a coin arc
  fillG(G, 16, 13, 18, 14, '.'); put(G, 21, 12, 'q'); put(G, 22, 7, 'o.o.o');
  // the odd gap: the landing-gear bay is open under it, the escape slide puffed up (the Under-Stage seam)
  fillG(G, 33, 13, 35, 14, '.'); put(G, 33, 15, 'Y'); put(G, 33, 21, 'ttt'); put(G, 38, 12, 'a');
  fillG(G, 32, 15, 32, 21, 'H'); fillG(G, 36, 15, 36, 21, 'H');   // the bay's side walls, down through the clouds
  put(G, 28, 12, 'n');
  // engine 1, its spoilers, its exhaust gap (P1 at the top of the hot air)
  put(G, 42, 15, 'E'); put(G, 40, 9, '------'); put(G, 41, 8, 'o.o.o');
  fillG(G, 48, 13, 49, 14, '.'); put(G, 48, 13, 'X'); put(G, 48, 3, '*'); for (let y = 6; y <= 10; y += 2) put(G, 48, y, 'oo');
  // the missing panel: a gull escort ferries you across; P3 over the middle; a gull of Piwi's crew swoops
  fillG(G, 58, 13, 73, 14, '.'); put(G, 58, 13, '5'); put(G, 65, 9, 'R'); put(G, 66, 6, 'm');
  // engine 2 and its exhaust gap
  put(G, 80, 15, 'E'); fillG(G, 88, 13, 89, 14, '.'); put(G, 88, 13, 'X'); for (let y = 6; y <= 10; y += 2) put(G, 88, y, 'oo');
  put(G, 95, 8, 'm'); put(G, 92, 12, 'n');
  // a flap to fling you over the raised spoiler wall
  put(G, 100, 12, 'd'); fillG(G, 108, 8, 111, 12, 'H'); put(G, 108, 6, 'o.o.o');
  // the outer wing: the gate and the winglet
  put(G, 116, 12, 'n'); put(G, 124, 12, 'G'); put(G, 131, 12, '6');
  return rowsOf(G);
})();
const WING = {
  k: ['spawn', 'sign', { text: 'WING WALK! THE FLAPS TILT: LAND ON THE HIGH END. THE ENGINES\' HOT AIR LIFTS YOU. MIND THE GAPS' }],
  p: ['piece', 'box', { item: 'power' }], q: ['piece', 'flap', { len: 5 }], d: ['piece', 'flap', { len: 5 }],
  X: ['piece', 'exhaust', { w: 2, up: 9 }], '5': ['piece', 'gull', { ax: 13, w: 3, speed: 1.3 }], m: ['enemy', 'eyeGoon'],
  t: ['seam', 'bottom', 'gear@in'], Y: ['spawn', 'eyeSlideTell', { w: 3 }], a: ['anchor', 'gearBack'],
  '6': ['decor', 'eyeWinglet'], f: ['decor', 'eyeFuselage'], E: ['decor', 'eyeEngine'], n: ['decor', 'eyeNoStep']
};
stamps.eyeWing = { floor: 13, rows: wingRows, legend: WING, gold: { '*': 'must', R: 'risky' } };
// the landing-gear bay under the wing (the backstage under the stage): the escape slide is the crash mat; the old
// trunk at the far end is a Wormhole back to Japan; the hatch in the wall climbs back up to the wing
stamps.eyeGearBay = {
  floor: 12,
  rows: [
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    'H............................H',
    'H............*...............H',
    'H..........-----.............H',
    'H............................H',
    'H...h........................H',
    'H.................-----......H',
    'H............................H',
    'H.....-----..................H',
    'H............................H',
    'H............................H',
    'H..@.....m....k....w....D....H',
    'HHbbbbbHHHHHHHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHH'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'wing@gearBack', look: 'eyeHatch' }],
  legend: { m: ['spawn', 'bkMouse', {}], k: ['decor', 'bkGhostLight'], w: ['spawn', 'warp', { exit: 'warp' }] }
};
const L3 = { n: 3, name: 'Wing Walk', mapLabel: 'Wing Walk', arch: 'bonus', tag: 'SKY', theme: 'eye_sky',
  gimmick: 'Out on the wing in bright daylight above the clouds: flaps that tilt and fling you, engine exhaust that lifts you, a gull escort across the missing panel',
  hint: 'Land on the high end of a flap to be flung. Drop into the engine\'s hot air on purpose: it carries you up. One gap in the wing has a soft landing under it...',
  postcard: 'You\'re walking on the WING. The gulls are flying in formation with you. Waving is allowed. ♥ C',
  enemies: [['eyeGoon', 3]],
  mapCell: [1, 1], mapFrom: 1,
  exits: {
    main: { to: '25-4' },
    warp: { to: '11-4', via: 'warp', label: 'JAPAN', hint: 'One gap in the wing has the yellow escape slide puffed up under it...' }
  },
  areas: [
    { id: 'wing', gen: 'room', theme: 'eye_sky', stamp: 'eyeWing', bottomKill: true, camera: 'free' },
    { id: 'gear', gen: 'room', role: 'backstage', zone: 'under', theme: 'bk_under', stamp: 'eyeGearBay' }
  ] };

/* ---------------- 25-4 Captain Gull (the boss) ---------------- */
// a short walk through the cargo hold past the crated animals, then the gull's corner of the hold
const L4 = { n: 4, name: 'Captain Gull', mapLabel: 'Cargo Hold', arch: 'lair', theme: 'eye_hold', boss: 'eye_gull',
  gimmick: 'A stowaway seagull in a captain\'s cap has stolen every pretzel on board. He keeps out of reach, his sack of pretzels dangling under him',
  hint: 'Stomp the dangling SACK: the string yanks him down. Then stomp HIM while he\'s dizzy. Climb the crates when he flies high',
  postcard: 'You got the pretzels back! The gull is sulking on the tail. We shared one with him anyway. ♥ C',
  enemies: [['eyeBag', 2]],
  mapCell: [2, 1], mapFrom: 2,
  areas: [
    { id: 'aft', gen: 'strip', W: 64, H: 18, theme: 'eye_hold',
      script: [
        ['itemBlock', { item: 'power' }],
        ['flat', { n: 6 }],
        ['enemies', { n: 1, kind: 'eyeBag' }],
        ['postcard', { kind: 'must', dy: -5 }],
        ['stairs', { n: 3 }],
        ['flat', { n: 4 }],
        ['enemies', { n: 1, kind: 'eyeBag' }],
        ['itemBlock', { item: 'power' }],
        ['postcard', { kind: 'high', dy: -7, dx: -2 }],
        ['flat', { n: 4 }],
        ['postcard', { kind: 'risky', dy: -4 }],
        ['door', { to: 'arena@in', perch: 0, look: 'eyeHatch' }]
      ] },
    { id: 'arena', gen: 'arena', role: 'arena', layout: 'hold', arenaW: 24, H: 18 }
  ] };

Tour.amend('eye', { stamps, levels: [L1, L2, L3, L4] });
// the map card's level-type word: a bonus level may name its own (tag)
{ const lb0 = TourLandscape.label; TourLandscape.label = function (L) { return (L && L.tag) || lb0.call(this, L); }; }

/* ---------------- the land's map: a cutaway jumbo jet, nose to tail, flying through the night ---------------- */
// the route: up the airstairs at the tail, along the cabin, out onto the wing, down into the cargo hold, and the
// flight deck at the nose (the port)
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.eye = {
  labels: { '25-1': 'Aisle Seat', '25-2': 'Turbulence', '25-3': 'Wing Walk', '25-4': 'Cargo Hold' },
  w: 1520, h: 760,
  pal: { sea: '#14205a', deep: '#060a24', land: '#f2f4f8', light: '#ffffff', path: '#ffd84a', beach: '#d8dce4', cliff: '#9aa4b8', roof: '#e8424a', wall: '#ffffff' },
  sea: 'stars', coast: 'eyeHull', tufts: 'none', trail: 'sparkle', bridge: 'steps', meadow: false, woods: false, foam: false, birds: false,
  land: [[[120, 330], [190, 250], [200, 70], [276, 70], [380, 222], [860, 212], [960, 150], [1220, 140], [1350, 196], [1424, 300], [1392, 400], [1250, 458], [980, 462], [770, 652], [640, 662], [782, 466], [420, 458], [220, 412]]],
  nodes: { start: [262, 370], '25-1': [470, 352, 'n'], '25-2': [1060, 214, 'n'], '25-3': [720, 600, 'e'], '25-4': [1120, 430, 's'], port: [1330, 300] },
  paths: { 'start>25-1': [[360, 372]], '25-1>25-2': [[760, 340], [940, 230]], '25-2>25-3': [[900, 380], [800, 520]], '25-3>25-4': [[900, 470]], '25-4>port': [[1260, 380]] },
  feat: [
    ['sprite', 'jetEngine', 700, 528, 34], ['sprite', 'jetEngine', 640, 610, 28],
    ['sprite', 'stairs', 214, 410, 24], ['sprite', 'cockpit', 1380, 300, 34]
  ],
  flora: ['rock'], density: 0,
  live: [['blink', 640, 668, '#ff4a3a'], ['blink', 230, 70, '#ff4a3a'], ['blink', 1150, 140, '#ffffff'], ['walk', 'goose', [[520, 372], [700, 372]], 10], ['circle', 1000, 100, 60, 0.8]]
};
})();

/* ============================================================
   PIWI'S HOUSE RULE 10: NO LATE FLIGHTS (its Brady Button is in the Rigging above Japan 11-4: 29_tour_jp_secrets.js).
   Revoked, it opens The Red-Eye and wakes up NIGHT FLIGHTS on the world route map: a little red-eye plane with a
   blinking light circles the globe, red dashed night routes join every land Brady has cleared, and a flight between
   two cleared lands is a quick hop through the night.
   ============================================================ */
TOUR_RULES[10] = { title: 'NO LATE FLIGHTS', sign: 'NIGHT FLIGHTS NOW LEAVE FROM EVERY CLEARED LAND!', opens: ['land:eye'], fx: null };
const TourNight = {
  on() { return typeof TourRules !== 'undefined' && TourRules.isRevoked(10); },
  // the lands with night flights: cleared ones (their boss beaten), in route order
  lands() { return TOUR_ROUTE.filter(s => { const Cc = Tour.countries[s.id]; return Cc && TourProgress.countryUnlocked(Cc) && TourProgress.bossDone(Cc); }); },
  // a flight between two cleared lands is a night flight: quicker, under a dark sky
  isNight(from, to) { if (!this.on()) return false; const a = Tour.countries[from], b = Tour.countries[to]; return !!(a && b && a !== b && TourProgress.bossDone(a) && TourProgress.bossDone(b)); }
};
{
  const S = TourMapScene.prototype;
  const fly0 = S.flyTo;
  S.flyTo = function (id, auto) {
    const night = TourNight.isNight(this.sel, id);
    fly0.call(this, id, auto);
    if (night && this.flight) { this.flight.dur = Math.min(this.flight.dur, 1.6); this.flight.night = true; this.toast('NIGHT FLIGHT TO ' + Tour.stops[id].name.toUpperCase()); }
  };
}
TourHooks.on('routeDraw', (scene, ctx, layer) => {
  if (!TourNight.on()) return;
  const t = scene.t;
  if (layer === 'under') {
    // the night routes: thin red dashes from where Brady is to every other cleared land
    const here = Tour.stops[scene.sel]; if (!here) return;
    const list = TourNight.lands(); if (list.length < 2 || !TourProgress.bossDone(Tour.countries[scene.sel] || {})) return;
    ctx.save(); ctx.strokeStyle = 'rgba(255,90,90,0.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([2, 6]); ctx.lineDashOffset = -t * 10;
    const x0 = scene.sx(here.lon), y0 = scene.sy(here.lat);
    for (const s of list) {
      if (s === here) continue;
      const x1 = scene.sx(s.lon), y1 = scene.sy(s.lat), mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - Math.hypot(x1 - x0, y1 - y0) * 0.18;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke();
    }
    ctx.restore();
    return;
  }
  // the red-eye plane circling the globe, its red light blinking, and the night falling over a night flight
  const f = scene.flight;
  if (f && f.night) { const k = Math.sin(clamp(f.k, 0, 1) * Math.PI); ctx.save(); ctx.fillStyle = 'rgba(6,10,40,' + (0.45 * k).toFixed(3) + ')'; ctx.fillRect(0, 0, Game.cssW, Game.cssH); ctx.restore(); }
  const a = t * 0.12, lon = ((a * 57.3 + 180) % 360) - 180, lat = 22 + Math.sin(a * 2.3) * 18;
  const x = scene.sx(lon), y = scene.sy(lat), ang = Math.atan2(-Math.cos(a * 2.3) * 18 * 2.3 / 57.3, 1);
  if (x < -30 || x > Game.cssW + 30 || y < -30 || y > Game.cssH + 30) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-ang * 0.6);
  ctx.fillStyle = '#e8ecf4'; ctx.strokeStyle = '#1a1426'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, 0, 10, 2.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(-5, -8); ctx.lineTo(-2, -8); ctx.lineTo(4, 0); ctx.lineTo(-2, 8); ctx.lineTo(-5, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-10, -4); ctx.lineTo(-8, -4); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (Math.sin(t * 7) > 0.2) { ctx.fillStyle = 'rgba(255,60,60,0.35)'; ctx.beginPath(); ctx.arc(1, -1, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(1, -1, 2, 0, TAU); ctx.fill(); }
  ctx.restore();
});
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.TourNight = TourNight; } } catch (e) { /* not in a browser */ }
