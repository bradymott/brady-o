/* ============================================================
   ITALY: the levels (world 14) and the land's walkable map.
   14-1 SCOOTER DASH (scoot)   ride a little scooter through the cobbled alleys and over the rooftops: brake, boost
                               through market crates, ramps up onto the roofs, washing lines as trampolines, an
                               olive-oil spill with no brakes. A garage on the roofs hides the scooter workshop.
   14-2 THE PIZZERIA (dough)   stretchy dough pads over pots of sauce: the longer Brady stands, the further they
                               throw him; too long and they tear. Ovens ride the conveyor belts and breathe fire.
                               A cracked wall where coffee steam puffs out: the pantry, and the espresso bar's back
                               door (the hidden exit to 14-6).
   14-3 THE LEANING TOWER (lean)  a climb up the inside of the tower: it tips left, then right, on a creaking clock;
                               crates and planks slide to the low side, barrels roll, bells swing on their ropes.
   14-4 NIGHT AT THE OPERA (aria) a blackbird diva's long notes are updraft columns between the balconies; when she
                               takes a breath they stop. Then two divas in a duet, chandeliers, sour notes.
   14-5 IL POLPETTONE (lair)   backstage, then the grand stage and the meatball tenor (29_tour_it_boss.js).
   14-6 DOPPIO (espresso, secret)  espresso cups put Brady in fast-forward through a gauntlet built for it, with
                               a flood of coffee behind him.
   ============================================================ */
(function () {
const C = Tour.countries.it;
if (!C) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (G, x, y, str) => { for (let k = 0; k < str.length; k++) if (str[k] !== ' ') G[y][x + k] = str[k]; };
const fillG = (G, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) G[y][x] = ch; };
const rowsOf = G => G.map(r => r.join(''));
const stamps = {};

// a secret room: steps of one-way shelves up to the hidden postcard, an item block, a hidden block, coins, props.
// letters: '@' in, 'D' the door back, '*' the postcard, '?' an item, 'h' a hidden item, 'p' / 'q' props, 'g' a gate
const secretRoom = (o) => {
  const rows = [
    '##############################',
    '#............................#',
    '#............*...............#',
    '#..........-----.............#',
    '#............................#',
    '#....o.o.o..............?....#',
    '#...-------........-----.....#',
    '#............................#',
    '#....h.......................#',
    '#.........------......-----..#',
    '#............................#',
    '#.@..D.....p.......q.........#',
    '##############################',
    '##############################'];
  if (o.gate) { rows[11] = '#.@..D.....p.......q......g..#'; }
  return Object.assign({ floor: 12, rows, gold: { '*': 'hidden' } }, o.stamp);
};

/* ---------------- 14-1 Scooter Dash ---------------- */
stamps.itGarage = secretRoom({ stamp: { items: ['star'], hidden: ['oneup'], doors: [{ to: 'vicolo@garageBack', look: 'itGarage' }], legend: { p: ['decor', 'itParked'], q: ['decor', 'itCrateStack'] } } });
const L1 = { n: 1, name: 'Scooter Dash', arch: 'scoot', theme: 'it_vicolo',
  gimmick: 'A little scooter through the cobbled alleys: it rolls on its own. Brake, boost through the market crates, ramp up onto the rooftops, bounce on the washing lines',
  hint: 'DOWN brakes, ACTION boosts (it smashes crates), JUMP hops. Ramps throw you onto the roofs. Washing lines are trampolines: hold JUMP',
  postcard: 'Brady! I rented a scooter. It has no brakes worth mentioning and a horn that goes "meep". I love it. ♥ C',
  enemies: [['itPigeon', 2], ['itCat', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '14-2' } },
  areas: [
    { id: 'vicolo', gen: 'strip', W: 330, H: 20, gyMin: 6, gyMax: 15, it: { scoot: true },
      script: [
        // ① teach: the scooter rolls; a pigeon, a trench, the first crates
        ['itemBlock', { item: 'power', y: 4 }],
        ['cobbles', { n: 12, sign: 'YOUR SCOOTER ROLLS BY ITSELF! DOWN = BRAKE · ACTION = BOOST · JUMP = HOP', enemies: ['itPigeon'] }],
        ['trench', { n: 3 }],
        ['cobbles', { n: 6 }],
        ['crates', { sign: 'MARKET CRATES! PRESS ACTION TO BOOST RIGHT THROUGH THEM' }],
        ['postcard', { kind: 'must', dx: -3, dy: -5 }],
        'cp',
        // the first ramp onto the roofs, a garage up there, a washing line
        ['trench', { n: 4, canal: true }],
        ['ramp', { up: 5, roofN: 10, land: 3, sign: 'A RAMP! ROLL UP IT AND IT THROWS YOU ONTO THE ROOFS', tight: true }],
        ['roofs', { gaps: [3, 4], chimney: 0, pigeon: true, tight: true }],
        ['cp', { tight: true }],
        ['door', { to: 'garage@in', perch: 0, look: 'itGarage', back: 'garageBack', tight: true }],
        ['washing', { n: 9, gold: 'risky', tight: true }],
        ['drop', { down: 5 }],
        'cp',
        // ② test: the oil (no brakes), crates, a canal
        ['cobbles', { n: 8, enemies: ['itCat'], item: 'power' }],
        ['oil', { n: 5, gap: 4 }],
        ['crates', {}],
        ['trench', { n: 5, canal: true }],
        'cp',
        // a higher ramp, a long row of roofs, cats and a washing line
        ['ramp', { up: 7, roofN: 8, land: 3, tight: true }],
        ['roofs', { gaps: [4, 5], cat: true, tight: true }],
        ['washing', { n: 10, tight: true }],
        ['drop', { down: 7 }],
        'cp',
        // ③ twist: crates right in front of a ramp (boost through, keep the speed), the oil before the last canal
        ['crates', {}],
        ['ramp', { up: 6, roofN: 9, land: 4, run: 4, tight: true }],
        ['washing', { n: 11, tight: true }],
        ['roofs', { gaps: [5], pigeon: true, tight: true }],
        ['drop', { down: 6 }],
        'cp',
        ['oil', { n: 6, gap: 5 }],
        ['gate', { exit: 'main' }]
      ] },
    { id: 'garage', gen: 'room', role: 'secret', theme: 'it_cantina', stamp: 'itGarage' }
  ] };

/* ---------------- 14-2 The Pizzeria ---------------- */
stamps.itDispensa = secretRoom({ gate: true, stamp: { items: ['power'], hidden: ['oneup'], doors: [{ to: 'cucina@pantryBack', look: 'itPantry' }], legend: { p: ['decor', 'itFlourSack'], q: ['decor', 'itCupStack'] } } });
const L2 = { n: 2, name: 'The Pizzeria', arch: 'dough', theme: 'it_pizzeria',
  gimmick: 'Stretchy pizza dough over pots of tomato sauce: stand on it, it sags, and the longer you wait the further it throws you. Wait too long and it tears. Ovens ride the conveyor belts',
  hint: 'Watch the ring under the dough fill up, then jump: a full ring is a SUPER FLING. Ovens glow before they puff fire',
  postcard: 'The pizza chef is a heron. He tosses the dough so high it sticks to the ceiling. He says that is the secret. ♥ C',
  enemies: [['itTomato', 2], ['itMoka', 1], ['itMeatball', 1]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '14-3' }, secret: { to: '14-6', hint: 'Coffee steam puffs from a crack in the pizzeria wall...' } },
  areas: [
    { id: 'cucina', gen: 'strip', W: 240, H: 20, gyMin: 4, gyMax: 15, liquid: 'sauce',
      script: [
        // ① teach: a low fling to a shelf over a pot (a fall costs a life, but the first pot is shallow work)
        ['itemBlock', { item: 'power', y: 4 }],
        ['cobbles', { n: 8, sign: 'PIZZA DOUGH! STAND ON IT: IT SAGS AND THE RING FILLS. THE LONGER YOU WAIT, THE FURTHER IT THROWS YOU. NOT TOO LONG...', coins: false }],
        ['pad', { up: 4, ahead: 2, shelf: 6 }],
        ['postcard', { kind: 'must', dx: -3, dy: -4 }],
        ['cobbles', { n: 6, enemies: ['itTomato'] }],
        ['pad', { up: 6, ahead: 3, shelf: 6 }],
        'cp',
        ['ovens', { n: 14, ovens: 2, sign: 'OVENS ON THE BELT! THEY GLOW, THEN PUFF FIRE. HOP THEM WHEN THEY ARE DARK' }],
        // ② test: a far fling, the moka pot, a chain of pads
        ['padFar', { far: 8 }],
        'cp',
        ['cobbles', { n: 8, enemies: ['itMoka'] }],
        ['secretDoor', { to: 'dispensa@in', look: 'fake', back: 'pantryBack' }],
        ['padChain', { n: 2, step: 4, gap: 4 }],
        ['drop', { down: 8 }],
        'cp',
        // ③ twist: ovens and pads together, a high fling with a meatball on the shelf, a long fling
        ['ovens', { n: 18, ovens: 3 }],
        ['pad', { up: 7, ahead: 4, shelf: 5, enemy: 'itMeatball', gold: 'risky' }],
        'cp',
        ['cobbles', { n: 6, item: 'power', enemies: ['itTomato'] }],
        ['padFar', { far: 9 }],
        'cp',
        ['padChain', { n: 2, step: 4, gap: 5 }],
        ['drop', { down: 8 }],
        ['ovens', { n: 12, ovens: 2 }],
        ['gate', { exit: 'main' }]
      ] },
    { id: 'dispensa', gen: 'room', role: 'secret', theme: 'it_cantina', stamp: 'itDispensa' }
  ] };

/* ---------------- 14-3 The Leaning Tower ---------------- */
// floors (one-row stone slabs) every 9 rows; the climb goes up through one-way trapdoors (semi patches) in them.
// Toggle group 0 is the tilt (auto): A = leaning left (everything slid left), B = leaning right.
const towerRows = (() => {
  const W = 30, H = 88, G = grid(W, H, '#');
  const FL = [84, 75, 66, 57, 48, 39, 30, 21, 12];
  fillG(G, 1, 4, W - 2, FL[0] - 1, '.');
  for (let k = 1; k < FL.length; k++) fillG(G, 1, FL[k], W - 2, FL[k], '#');
  const hole = (k, x0, x1) => fillG(G, x0, FL[k], x1, FL[k], '-');
  // storey 0: the start, the tilt clock, a power block, the first crate (it slides right in a right lean: a step up)
  put(G, 2, 83, 't@..e'); put(G, 9, 80, '?'); put(G, 5, 82, 'A');
  put(G, 24, 79, '----'); put(G, 24, 78, 'o.o.'); hole(1, 23, 27);
  put(G, 12, 83, 'r'); put(G, 18, 77, 'o.o.o'); put(G, 3, 78, '*');
  // storey 1: a ledge, the sliding plank, the trapdoor top left; a barrel rack on the left wall
  put(G, 17, 71, '----'); put(G, 3, 69, 'P'); hole(2, 2, 4); put(G, 1, 74, 'R');
  put(G, 9, 66 - 1, 'o.o.o');
  // storey 2: a checkpoint, the bell over the open floor, a ledge, the trapdoor top right; the store behind a cracked
  // stretch of the left wall
  fillG(G, 7, FL[2], 22, FL[2], '.'); put(G, 4, 65, 'c'); put(G, 15, 58, 'w'); put(G, 23, 61, '-----'); hole(3, 24, 27);
  put(G, 12, 61, 'o.o.o.o'); put(G, 14, 60, '!'); put(G, 1, 65, 'Y');
  // storey 3: the crate stack that slides across the corridor; barrels from the right wall; the trapdoor top left
  put(G, 6, 51, 'K'); hole(4, 2, 5); fillG(G, 1, 55, 3, 56, '#'); put(G, 1, 52, '----'); put(G, 28, 56, 'V'); put(G, 14, 53, 'o.o.o');
  // storey 4: a checkpoint, two bells over the open floor, the ledge and the trapdoor top right
  fillG(G, 7, FL[4], 24, FL[4], '.'); put(G, 3, 47, 'c'); put(G, 11, 40, 'w'); put(G, 19, 40, 'w'); put(G, 24, 43, '----'); hole(5, 24, 27);
  put(G, 4, 43, '?'); put(G, 13, 43, 'o.o.o.o');
  // storey 5: the ledge, the plank, barrels from the right; the trapdoor top left
  put(G, 19, 35, '----'); put(G, 3, 33, 'U'); hole(6, 2, 4); put(G, 28, 38, 'V'); put(G, 7, 31, 'o.o.o');
  // storey 6: a checkpoint, the barrel step and its ledge, the trapdoor top right; a cat on patrol
  put(G, 3, 29, 'c'); put(G, 4, 28, 'M'); put(G, 16, 25, '----'); hole(7, 20, 23); put(G, 10, 29, 'n'); put(G, 16, 24, 'o.o.');
  // storey 7: the last ledge and plank, the trapdoor into the bell chamber, barrels from the left
  put(G, 14, 17, '----'); put(G, 2, 15, 'N'); hole(8, 2, 5); put(G, 1, 20, 'R');
  // the bell chamber at the top: the gate, the great bells (decor), P3 up high
  put(G, 22, 11, 'G'); put(G, 11, 11, 'E'); put(G, 17, 11, 'E'); put(G, 26, 7, '%'); put(G, 24, 8, '---');
  return rowsOf(G);
})();
stamps.itTorre = {
  floor: 84, rows: towerRows,
  legend: {
    t: ['piece', 'tilt', { g: 0 }],
    e: ['spawn', 'sign', { text: 'THE TOWER IS LEANING AGAIN! WHEN IT CREAKS IT TIPS THE OTHER WAY: CRATES AND PLANKS SLIDE TO THE LOW SIDE' }],
    A: ['piece', 'slide', { w: 2, h: 2, dx: 16, look: 'crates' }],
    P: ['piece', 'slide', { w: 6, h: 1, dx: 11, tile: 'SEMI', look: 'plank', ride: true }],
    K: ['piece', 'slide', { w: 2, h: 6, dx: 13, look: 'crates' }],
    U: ['piece', 'slide', { w: 6, h: 1, dx: 11, tile: 'SEMI', look: 'plank', ride: true }],
    M: ['piece', 'slide', { w: 2, h: 2, dx: 10, look: 'barrels' }],
    N: ['piece', 'slide', { w: 6, h: 1, dx: 6, tile: 'SEMI', look: 'plank', ride: true }],
    R: ['piece', 'rack', { side: 1 }], V: ['piece', 'rack', { side: -1 }],
    w: ['piece', 'bell', { len: 5, amp: 0.7, pw: 2, rate: 0.85 }],
    r: ['decor', 'itBellRope'], E: ['decor', 'itGreatBell'],
    Y: ['piece', 'hideDoor', { to: 'store@in', back: 'storeBack', look: 'fake' }],
    n: ['enemy', 'itCat']
  },
  gold: { '*': 'must', '!': 'risky', '%': 'high' }, items: ['power', 'power']
};
stamps.itStore = secretRoom({ stamp: { items: ['power'], hidden: ['oneup'], doors: [{ to: 'torre@storeBack', look: 'itTowerDoor' }], legend: { p: ['decor', 'itBarrel'], q: ['decor', 'itCrateStack'] } } });
const L3 = { n: 3, name: 'The Leaning Tower', arch: 'lean', theme: 'it_torre',
  gimmick: 'Climb the inside of the leaning tower while it tips left, then right: crates and planks slide to the low side, the floor pushes you downhill, barrels roll, bells swing on their ropes',
  hint: 'Watch the plumb bob at the top: when it shakes and the tower CREAKS, it is about to tip. Ride the planks as they slide',
  postcard: 'Piwi "fixed" the lean and it popped right back. The tower says it prefers it that way. So do I. ♥ C',
  enemies: [['itPigeon', 1], ['itCat', 1]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '14-4' } },
  areas: [
    { id: 'torre', gen: 'room', theme: 'it_torre', stamp: 'itTorre', camera: 'free', it: { tower: true } },
    { id: 'store', gen: 'room', role: 'secret', theme: 'it_cantina', stamp: 'itStore' }
  ] };

/* ---------------- 14-4 Night at the Opera ---------------- */
const operaRows = (() => {
  const W = 156, H = 26, G = grid(W, H, '.');
  fillG(G, 0, 0, W - 1, 0, '#');                     // the ceiling
  fillG(G, 0, 22, W - 1, H - 1, '#');                // the stalls (floor)
  fillG(G, 0, 1, 0, 21, '#'); fillG(G, W - 1, 1, W - 1, 21, '#');
  // ① the first diva on her box; her column over the stalls lifts Brady to the first balcony
  put(G, 2, 21, '@.j'); put(G, 9, 18, '?');
  fillG(G, 2, 17, 7, 17, '#'); put(G, 3, 16, 'O'); put(G, 5, 16, 'd');
  put(G, 12, 21, 'X');
  fillG(G, 15, 12, 24, 12, '-'); put(G, 18, 11, '*'); put(G, 20, 11, 'o.o'); put(G, 23, 11, 'Y');
  put(G, 30, 19, 'n'); put(G, 27, 13, 'o.o.o');
  fillG(G, 26, 15, 33, 15, '-');
  // ② the orchestra pit: two solo divas, each with a column up out of the pit
  fillG(G, 39, 14, 45, 14, '-'); put(G, 42, 13, 'c');
  fillG(G, 40, 5, 45, 5, '#'); put(G, 41, 4, 'O'); put(G, 43, 4, 'e');
  fillG(G, 44, 22, 77, H - 1, '.');                   // the pit (bottomless)
  put(G, 50, 25, 'U');
  fillG(G, 54, 10, 59, 10, '-'); put(G, 56, 9, 'o.o');
  put(G, 63, 25, 'V'); fillG(G, 66, 3, 71, 3, '#'); put(G, 67, 2, 'O'); put(G, 69, 2, 'f');
  fillG(G, 68, 9, 77, 9, '-'); put(G, 70, 8, 'o.o.o'); put(G, 60, 15, 'q');
  fillG(G, 76, 12, 78, 21, '#');                      // the far side of the pit: a box tier down to the stalls
  // ③ the duet: two divas take turns; column X then column Y
  put(G, 82, 21, 'c'); put(G, 83, 17, 'o.o.o');
  fillG(G, 86, 22, 113, H - 1, '.');
  put(G, 88, 25, 'J'); put(G, 99, 25, 'K');
  fillG(G, 82, 4, 86, 4, '#'); put(G, 84, 3, 'm');
  fillG(G, 102, 3, 106, 3, '#'); put(G, 104, 2, 'i');
  fillG(G, 91, 12, 95, 12, '-'); put(G, 92, 11, 'o.o');
  fillG(G, 103, 8, 113, 8, '-'); put(G, 108, 7, '!'); put(G, 110, 7, 'o.o');
  fillG(G, 114, 9, 117, 21, '#'); fillG(G, 118, 12, 123, 21, '#');
  // ④ the finale: chandeliers over the pit, a last column, sour notes; the gate on the stage
  put(G, 120, 11, 'c'); put(G, 121, 7, '?');
  fillG(G, 124, 22, 146, H - 1, '.');
  put(G, 128, 2, 'w'); put(G, 136, 2, 'w');
  put(G, 140, 25, 'Z'); fillG(G, 143, 5, 147, 5, '#'); put(G, 145, 4, 'k');
  fillG(G, 144, 9, 151, 9, '-'); put(G, 132, 14, 'q');
  put(G, 150, 21, 'G'); put(G, 147, 21, 'r'); put(G, 153, 21, 'r');
  return rowsOf(G);
})();
stamps.itOpera = {
  floor: 22, rows: operaRows,
  legend: {
    j: ['spawn', 'sign', { text: 'THE DIVA IS SINGING! HER LONG NOTES LIFT YOU UP. WHEN SHE GASPS FOR BREATH THEY STOP' }],
    X: ['piece', 'song', { g: 0, who: 0, w: 3, h: 12 }], d: ['piece', 'diva', { g: 0, who: 0, dir: 1 }],
    U: ['piece', 'song', { g: 1, who: 0, w: 3, h: 19 }], e: ['piece', 'diva', { g: 1, who: 0, dir: 1 }],
    V: ['piece', 'song', { g: 2, who: 0, w: 3, h: 20 }], f: ['piece', 'diva', { g: 2, who: 0, dir: -1, off: 2.0 }],
    J: ['piece', 'song', { g: 3, who: 0, w: 3, h: 17 }], m: ['piece', 'diva', { g: 3, who: 0, duet: true, dir: 1 }],
    K: ['piece', 'song', { g: 3, who: 1, w: 3, h: 21 }], i: ['piece', 'diva', { g: 3, who: 1, duet: true, dir: -1 }],
    Z: ['piece', 'song', { g: 4, who: 0, w: 3, h: 20 }], k: ['piece', 'diva', { g: 4, who: 0, dir: -1, off: 1.0 }],
    w: ['piece', 'bell', { len: 7, amp: 0.55, pw: 3, rate: 0.8, skin: 'itChandelier' }],
    O: ['decor', 'itBoxFront'],
    Y: ['piece', 'hideDoor', { to: 'loggia@in', back: 'loggiaBack', look: 'curtain', backDx: -2 }],
    n: ['enemy', 'itNote'], q: ['enemy', 'itNote'], r: ['decor', 'itRoses']
  },
  gold: { '*': 'must', '!': 'risky' }, items: ['power', 'power']
};
stamps.itLoggia = secretRoom({ stamp: { items: ['power'], hidden: ['oneup'], doors: [{ to: 'teatro@loggiaBack', look: 'itStageDoor' }], legend: { p: ['decor', 'itRoses'], q: ['decor', 'itMusicStand'] } } });
const L4 = { n: 4, name: 'Night at the Opera', arch: 'aria', theme: 'it_opera',
  gimmick: 'A blackbird diva sings: her long notes are columns of song that lift Brady between the balconies. When she gasps for breath they stop. Then two divas in a duet, over the orchestra pit',
  hint: 'Ride a column while the diva holds her note. When she gasps (...HH!) get onto a balcony',
  postcard: 'The diva is a blackbird and the audience are owls. Nobody coughs. Nobody DARES. ♥ C',
  enemies: [['itNote', 3]],
  mapCell: [2, 1], mapFrom: 2,
  exits: { main: { to: '14-5' } },
  areas: [
    { id: 'teatro', gen: 'room', theme: 'it_opera', stamp: 'itOpera', camera: 'free', bottomKill: true },
    { id: 'loggia', gen: 'room', role: 'secret', theme: 'it_opera', stamp: 'itLoggia' }
  ] };

/* ---------------- 14-5 Il Polpettone ---------------- */
// the tenor's dressing room behind a velvet curtain: his mirror, his throat sweets, a hidden 1UP
stamps.itCamerino = secretRoom({ stamp: { items: ['star'], hidden: ['oneup'], doors: [{ to: 'quinte@camerinoBack', look: 'itStageDoor' }], legend: { p: ['decor', 'itRoses'], q: ['decor', 'itMusicStand'] }, gold: {} } });
stamps.itCamerino.rows = stamps.itCamerino.rows.map(r => r.replace('*', '.'));
const L5 = { n: 5, name: 'Il Polpettone', mapLabel: 'Grand Stage', arch: 'lair', theme: 'it_opera', boss: 'it_tenor',
  gimmick: 'Backstage past the costume racks, then the grand stage: a giant meatball tenor who has been warming up for weeks. Far too saucy to stomp... unless he is dizzy',
  hint: 'When he rocks back and spins (HUP!), get out of the way: he rolls into the wall and sees stars. Stomp him then. Jump the rings of song',
  postcard: 'The tenor took a bow and rolled home. The stage manager (a pelican) swept up the parmesan. ♥ C',
  enemies: [['itNote', 2], ['itMeatball', 2]],
  mapCell: [1, 1], mapFrom: 3,
  exits: { main: { to: 'country:next' } },
  areas: [
    { id: 'quinte', gen: 'strip', W: 80, H: 18, theme: 'it_opera',
      script: [
        ['itemBlock', { item: 'power' }],
        ['cobbles', { n: 6, enemies: ['itMeatball'] }],
        ['postcard', { kind: 'must', dy: -5 }],
        ['stairs', { n: 3 }],
        ['cobbles', { n: 6, enemies: ['itNote'] }],
        ['secretDoor', { to: 'camerino@in', look: 'curtain', skin: 'itVelvet', back: 'camerinoBack' }],
        ['itemBlock', { item: 'power' }],
        ['postcard', { kind: 'high', dy: -7, dx: -2 }],
        ['cobbles', { n: 6, enemies: ['itMeatball'] }],
        ['postcard', { kind: 'risky', dy: -4 }],
        ['door', { to: 'palco@in', perch: 0, look: 'itStageDoor' }]
      ] },
    { id: 'camerino', gen: 'room', role: 'secret', theme: 'it_opera', stamp: 'itCamerino' },
    { id: 'palco', gen: 'arena', role: 'arena', layout: 'stage', arenaW: 28, H: 18, theme: 'it_stage' }
  ] };

/* ---------------- 14-6 Doppio ---------------- */
stamps.itRetro = secretRoom({ stamp: { items: ['power'], hidden: ['oneup'], doors: [{ to: 'bar@retroBack', look: 'itPantry' }], legend: { p: ['decor', 'itCupStack'], q: ['decor', 'itSugar'] } } });
const L6 = { n: 6, name: 'Doppio', arch: 'espresso', secret: true, theme: 'it_bar',
  gimmick: 'The espresso bar behind the pizzeria: every cup puts Brady in fast-forward for a few seconds, and the gauntlet is built for it. A flood of coffee is coming',
  hint: 'Drink a cup right before a long jump or a shutter: at double speed you clear it. Cups refill in a moment',
  postcard: 'Two espressos and Pupo ran laps around the bar for ten minutes. Then he napped for ten hours. ♥ C',
  enemies: [['itMoka', 2], ['itTomato', 1]],
  mapCell: [0, 1], mapFrom: 1,
  exits: { main: { to: 'node:14-3' } },
  areas: [
    { id: 'bar', gen: 'strip', W: 230, H: 20, gyMin: 6, gyMax: 15, liquid: 'coffee', chase: { speed: 3.5, ramp: 0.2, look: 'coffee' },
      script: [
        ['itemBlock', { item: 'power', y: 4 }],
        ['cobbles', { n: 6, coins: false }],
        ['cup', { sign: 'ESPRESSO! ONE CUP = DOUBLE SPEED FOR A FEW SECONDS. THE COFFEE FLOOD IS COMING: RUN!' }],
        ['cobbles', { n: 6 }],
        ['leap', { gap: 11, run: 9, liquid: true }],
        ['postcard', { kind: 'must', dy: -3 }],
        ['cobbles', { n: 6, enemies: ['itTomato'] }],
        ['fallers', { n: 4 }],
        'cp',
        ['rushDoor', { n: 22, t: 2.4, sign: 'THE LEVER HOLDS THE SHUTTER OPEN FOR A MOMENT. TOO FAR TO RUN... UNLESS YOU HAD A CUP' }],
        'cp',
        ['cobbles', { n: 6, enemies: ['itMoka'] }],
        ['leap', { gap: 12, run: 9, up: 2, gold: 'risky', liquid: true }],
        ['door', { to: 'retro@in', perch: 3, look: 'itPantry', back: 'retroBack' }],
        'cp',
        ['leap', { gap: 12, run: 8, liquid: true }],
        ['fallers', { n: 5 }],
        'cp',
        ['rushDoor', { n: 24, t: 2.5 }],
        ['cobbles', { n: 6, enemies: ['itMoka'], item: 'power' }],
        'cp',
        ['leap', { gap: 13, run: 9, liquid: true }],
        ['leap', { gap: 11, run: 8, liquid: true }],
        ['gate', { exit: 'main' }]
      ] },
    { id: 'retro', gen: 'room', role: 'secret', theme: 'it_cantina', stamp: 'itRetro' }
  ] };

Tour.amend('it', { stamps, levels: [L1, L2, L3, L4, L5, L6] });

/* small scenery for the rooms */
Object.assign(Decor, {
  // a great bronze bell resting on the bell chamber floor
  itGreatBell(ctx, x, y, t) {
    const INK = Tour.itKit.INK; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.fillStyle = '#d8a83a'; ctx.beginPath(); ctx.moveTo(x - 14, y - 70); ctx.quadraticCurveTo(x, y - 80, x + 14, y - 70); ctx.quadraticCurveTo(x + 26, y - 30, x + 36, y - 6); ctx.lineTo(x - 36, y - 6); ctx.quadraticCurveTo(x - 26, y - 30, x - 14, y - 70); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2d070'; ctx.fillRect(x - 20, y - 54, 5, 40);
    ctx.fillStyle = '#b8861a'; ctx.fillRect(x - 38, y - 8, 76, 8); ctx.strokeRect(x - 38, y - 8, 76, 8);
    ctx.restore();
  },
  // the gilded front of the diva's box
  itBoxFront(ctx, x, y) {
    const INK = Tour.itKit.INK; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#7a1420'; ctx.fillRect(x - 20, y + 2, 168, 26); ctx.strokeRect(x - 20, y + 2, 168, 26);
    ctx.fillStyle = '#ffd24a'; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(x - 8 + k * 20, y + 16, 6, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
});

/* ---------------- the land's map: the boot of a peninsula, from the Alps airstrip down to the ferry at the toe ---------------- */
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.it = {
  labels: { '14-1': 'Scooter Dash', '14-2': 'Pizzeria', '14-3': 'Leaning Tower', '14-4': 'Opera', '14-5': 'Grand Stage', '14-6': 'Doppio' },
  w: 1100, h: 1300,
  pal: { sea: '#4aa8e0', deep: '#2a78b8', land: '#b8d488', light: '#d8eaa8', path: '#f4e4c4', beach: '#f2dcaa', cliff: '#a8885a', roof: '#d8693a', wall: '#f2dcb0' },
  sea: 'waves', coast: 'beach', trail: 'prints', bridge: 'stone', foam: true,
  land: [
    [[150, 230], [300, 140], [480, 100], [660, 110], [840, 170], [930, 260], [880, 360], [800, 450], [800, 560], [880, 660], [970, 770], [1040, 860], [1060, 930], [990, 960], [910, 900], [850, 870], [810, 920], [830, 1000], [850, 1080], [800, 1150], [720, 1150], [700, 1080], [710, 1000], [660, 930], [580, 850], [500, 760], [420, 660], [350, 560], [290, 470], [230, 390], [160, 320]],
    [[540, 1210], [700, 1190], [760, 1240], [690, 1280], [560, 1270]]
  ],
  nodes: { start: [620, 190], '14-1': [440, 300], '14-2': [520, 560], '14-6': [690, 470], '14-3': [380, 450], '14-4': [640, 760], '14-5': [790, 920], port: [760, 1110, 'w'] },
  paths: { 'start>14-1': [[540, 230]], '14-1>14-2': [[460, 430], [500, 500]], '14-2>14-6': [[620, 520]], '14-6>14-3': [[560, 400], [440, 400]], '14-2>14-3': [[440, 520]], '14-3>14-4': [[440, 600], [560, 700]], '14-4>14-5': [[720, 840]], '14-5>port': [[790, 1030]] },
  feat: [
    ['patch', '#c8dc98', [[300, 360], [600, 300], [780, 420], [700, 640], [480, 640], [320, 520]]],
    ['range', 'mtn', [[300, 170, 40], [480, 140, 48], [680, 150, 44], [840, 210, 36]], { snow: true }],
    ['sprite', 'itTower', 340, 470, 26], ['sprite', 'itPizza', 560, 600, 16], ['sprite', 'itOpera', 680, 790, 20],
    ['sprite', 'itVolcano', 600, 680, 22], ['sprite', 'itCup', 720, 500, 12],
    ['sprite', 'itCypress', 420, 520, 14], ['sprite', 'itCypress', 436, 528, 12], ['sprite', 'itCypress', 600, 380, 14], ['sprite', 'itCypress', 760, 600, 13], ['sprite', 'itCypress', 300, 400, 12],
    ['town', 470, 320, 4, 30], ['town', 540, 590, 4, 26]
  ],
  flora: ['rock'], density: 18,
  live: [['circle', 600, 300, 50, 0.6], ['blink', 760, 1110, '#ffd24a']]
};
})();
