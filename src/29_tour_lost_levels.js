/* ============================================================
   LOST & FOUND: the levels (world 24) and the land's map. Bonus levels (arch 'bonus': exempt from the archetype
   caps); each a different kind of place to work out:
   24-1 BAGGAGE CAROUSEL: a baggage hall as a maze of six rooms joined only by the carousels' rubber FLAPS. A flap
        swallows anything that stands still in front of it and drops it somewhere else (its plate says where). Find
        your red suitcase and show it at Customs.
   24-2 UNCLAIMED MOUNTAIN: a climb up a mountain of lost luggage; open umbrellas bounce you high, cardboard boxes give
        way, and zipped suitcases unzip into doors: inside one, a shortcut further up. Over the summit, the Rigging
        (backstage) and a Wormhole back to the Netherlands.
   24-3 X-RAY TUNNEL: the security scanner. Platforms show only inside the scanner's beam; the sniffer beagle barks at
        the hidden ones it smells. One giant suitcase shows a door only under the x-ray.
   24-4 THE SOCK HYDRA (boss): the lost-property warehouse.
   Stamps are drawn with a small grid helper (mk) so the coordinates stay exact; legend letters are listed with each.
   ============================================================ */
(function () {
const C = Tour.countries.lost;
if (!C) return;

// a grid of '.' W x H: put, fill, horizontal / vertical runs, a row of coins; rows() gives the stamp's rows
const mk = (W, H) => {
  const g = []; for (let y = 0; y < H; y++) g.push(new Array(W).fill('.'));
  const o = {
    W, H,
    put(x, y, c) { if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = c; return o; },
    fill(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) o.put(x, y, c); return o; },
    h(x0, x1, y, c) { return o.fill(x0, y, x1, y, c); },
    v(x, y0, y1, c) { return o.fill(x, y0, x, y1, c); },
    coins(x0, x1, y) { for (let x = x0; x <= x1; x += 2) o.put(x, y, 'o'); return o; },
    rows() { return g.map(r => r.join('')); }
  };
  return o;
};
// a 28 x 14 maze cell: ceiling, walls, the floor (rows 12-13); Brady stands on row 11
const cell = () => mk(28, 14).h(0, 27, 0, '#').fill(0, 12, 27, 13, '#').v(0, 1, 11, '#').v(27, 1, 11, '#');

/* ---------------- 24-1 Baggage Carousel ----------------
   Six rooms, no doors between the floors: only the carousels' flaps. Arrivals (start) -> Belt 1 hall -> Customs (the
   gate, behind a shutter that wants your suitcase). Flap A (Arrivals) drops to Belt 3, flap B (Belt 1) to Belt 2.
   Your red suitcase is up on Belt 2's top rack; flap D (up on Belt 3's luggage stack) goes back up to Belt 1, by
   Customs. Flap E on Belt 1's top belt sends dawdlers back to Arrivals; flap C (Belt 2) goes to the Lost & Found
   desk, a dead end with the office (a shell game with suitcases) and a cargo hatch back to Belt 3. */
const HALL = {
  m: ['enemy', 'lostCase'], z: ['enemy', 'lostCrab'], n: ['enemy', 'lostMoth'],
  p: ['decor', 'lostPalm'], r: ['decor', 'lostTrolley'], q: ['decor', 'lostBoard'], J: ['decor', 'lostBoardFlaps'], e: ['decor', 'lostCone'], x: ['decor', 'lostBags'],
  K: ['spawn', 'key', { id: 'bag:red', look: 'lostBagRed' }],
  X: ['piece', 'bagLock', { id: 'bag:red', h: 3, col: '#e84a4a', icon: 'lostBagRed', peek: 'lostBagRed' }]
};
const flap = (to, label) => ['spawn', 'lostFlap', { targetRef: 'hall@' + to, label }];
const belt = n => ['spawn', 'lostBelt', { n }];
const hcell = (G, extra) => { const e = Object.assign({}, extra || {}), legend = Object.assign({}, HALL, e.legend || {}); delete e.legend; return Object.assign({ floor: 12, rows: G.rows(), legend }, e); };

// ARRIVALS (the start): flap A at the left wall (the belt runs into it), P1 over the luggage racks
const arrivals = (() => {
  const G = cell();
  G.v(27, 9, 11, '.');
  // flaps stand mid-room (never under the touch controls in the corners): flap A, the belt running into it
  G.put(4, 11, '@'); G.put(6, 11, 'u'); G.put(9, 8, '?');
  G.put(13, 11, 'A'); G.h(14, 17, 12, '<'); G.put(21, 11, 'J');
  G.h(19, 24, 8, '-'); G.put(21, 5, '*'); G.coins(18, 25, 6);
  G.coins(8, 12, 4);
  G.put(19, 11, 'r'); G.put(24, 11, 'm'); G.put(26, 11, 'p'); G.put(2, 11, 'e');
  G.put(9, 11, 'w');   // the way back from Belt 1's top flap lands here (anchor arrBack)
  return hcell(G, { items: ['power'], gold: { '*': 'must' }, legend: {
    A: flap('c3in', '→ BELT 3'), w: ['anchor', 'arrBack'],
    u: ['spawn', 'sign', { text: 'A FLAP SWALLOWS ANYTHING THAT STANDS STILL IN FRONT OF IT! ITS PLATE SAYS WHERE IT GOES. YOUR SUITCASE IS SOMEWHERE ON THE BELTS' }]
  } });
})();
// BELT 1: two tiers of belts; flap E at the top belt's end (back to Arrivals); a stack of suitcases up to the top belt
// with flap B on it (don't dawdle on the stack!)
const belt1 = (() => {
  const G = cell();
  G.v(0, 9, 11, '.'); G.v(27, 9, 11, '.');
  G.h(5, 15, 9, '>'); G.put(5, 8, 'k');
  G.h(9, 17, 6, '<'); G.put(9, 5, 'j'); G.h(7, 8, 6, 'H'); G.v(7, 3, 5, 'H'); G.put(8, 5, 'E');
  G.coins(10, 16, 4); G.put(13, 2, 'h');
  G.fill(19, 9, 20, 11, 'B'); G.put(20, 8, 'f');
  G.put(23, 11, 'V');
  G.put(13, 4, 'n'); G.put(3, 11, 'q'); G.put(25, 11, 'x');
  return hcell(G, { hidden: ['oneup'], legend: {
    k: belt(11), j: belt(9), E: flap('arrBack', '→ ARRIVALS'), f: flap('c2in', '→ BELT 2'), V: ['anchor', 'c1east']
  } });
})();
// CUSTOMS: the shutter wants your red suitcase; the gate behind it
const customs = (() => {
  const G = cell();
  G.v(0, 9, 11, '.');
  G.put(8, 11, 'X'); G.put(4, 11, 'e');
  G.put(14, 11, 'd'); G.put(11, 8, '?');
  G.h(16, 21, 7, '-'); G.coins(16, 21, 5);
  G.put(22, 11, 'G'); G.put(25, 11, 'p');
  return hcell(G, { items: ['star'], legend: { d: ['decor', 'lostCustoms'] } });
})();
// BELT 2: a three-tier carousel up to the top rack and your red suitcase (top left); P3 high on the right; flap C
const belt2 = (() => {
  const G = cell();
  G.v(27, 9, 11, '.');
  G.put(8, 11, 'a'); G.h(9, 12, 12, '<');
  G.h(13, 22, 9, '<'); G.put(13, 8, 'k');
  G.h(5, 14, 6, '>'); G.put(5, 5, 'j');
  G.h(1, 6, 3, '-'); G.put(3, 2, 'K');
  G.h(18, 22, 4, '-'); G.put(20, 1, '*');
  G.put(4, 8, '?');
  G.put(24, 11, 'i'); G.put(18, 11, 'z'); G.put(23, 2, 'n'); G.put(25, 11, 'q');
  return hcell(G, { items: ['socks'], gold: { '*': 'high' }, legend: {
    a: flap('lfin', '→ LOST & FOUND'), k: belt(10), j: belt(10), i: ['anchor', 'c2in']
  } });
})();
// BELT 3: arrive from flap A; a stack of suitcases up to flap D (back up to Belt 1, by Customs)
const belt3 = (() => {
  const G = cell();
  G.v(0, 9, 11, '.');
  G.put(4, 11, 'i');
  G.h(6, 10, 12, '>');
  G.fill(12, 9, 13, 11, 'B'); G.fill(15, 7, 16, 11, 'B');
  G.h(19, 23, 6, 'H'); G.put(21, 5, 'Y');
  G.coins(18, 24, 3);
  G.put(9, 11, 'm'); G.put(22, 11, 'x'); G.put(11, 4, 'n');
  return hcell(G, { legend: { i: ['anchor', 'c3in'], Y: flap('c1east', '→ BELT 1') } });
})();
// THE LOST & FOUND DESK: arrive from flap C; the office door behind the desk; a cargo hatch back to Belt 3
const desk = (() => {
  const G = cell();
  G.put(4, 11, 'i');
  G.put(10, 11, 'f'); G.put(15, 11, 'D'); G.put(13, 11, 'k');
  G.coins(6, 22, 6); G.h(7, 11, 8, '-');
  G.put(6, 11, 'x'); G.put(24, 11, 'r');
  return hcell(G, { doors: [{ to: 'office@in', look: 'tourDoor' }], legend: { i: ['anchor', 'lfin'], f: ['decor', 'lostDesk'], k: ['anchor', 'lfBack'] } });
})();
const stamps = {
  // the Lost & Found office (a shell game: three suitcases, one prize)
  lostOffice: {
    floor: 10,
    rows: mk(28, 12).h(0, 27, 0, '#').fill(0, 10, 27, 11, '#').v(0, 1, 9, '#').v(27, 1, 9, '#')
      .put(2, 9, '@').put(4, 9, 'D').put(16, 4, '*').put(12, 6, '?').put(20, 9, 'x').rows(),
    legend: { x: ['decor', 'lostBags'] },
    items: ['oneup'], doors: [{ to: 'hall@lfBack', look: 'tourDoor' }], gold: { '*': 'hidden' }
  }
};
const L1 = { n: 1, name: 'Baggage Carousel', mapLabel: 'Carousels', arch: 'bonus', theme: 'lost_hall',
  gimmick: 'A baggage hall where the only way between rooms is a carousel flap: stand still in front of one and it swallows you. Find your red suitcase, then get through Customs',
  hint: 'Each flap\'s plate says where it goes. Your suitcase is on Belt 2\'s top rack',
  postcard: 'An island where every lost bag ends up. I found three of your socks already. ♥ C',
  enemies: [['lostCase', 2], ['lostCrab', 1], ['lostMoth', 2]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '24-2' } },
  areas: [
    { id: 'hall', gen: 'maze', cells: [3, 2], cell: [28, 14],
      script: [[arrivals, belt1, customs], [belt2, belt3, desk]],
      links: [{ kind: 'oneway', from: [2, 1], to: [1, 1], at: [20, 11], toAt: [7, 11], look: 'lostHatch' }] },
    { id: 'office', gen: 'room', role: 'secret', theme: 'lost_hall', stamp: 'lostOffice', room: 'shell',
      shell: { title: 'THE UNCLAIMED BAGS SHUFFLE', rule: 'THE BEAGLE AT THE DESK HIDES A PRIZE UNDER ONE OF THREE SUITCASES. WATCH IT, THEN STOMP THE RIGHT ONE', cup: 'lostCase', dealer: 'lostBeagle', joke: ['sock', 'boot'] } }
  ] };

/* ---------------- 24-2 Unclaimed Mountain ----------------
   One tall area, a climb up a zig-zag of ledges made of luggage; umbrellas bounce (hold jump), cardboard boxes
   crumble. Zipped suitcases are doors: the one on the foothill opens into 'the sock drawer' (a climb inside a
   suitcase) that lets you out much higher; the one on the west ledge into 'the duty-free bag', out near the top. A
   sock sticking out of the east wall marks a fake wall: behind it, a zipped trunk (a treasure room: a prank). At the
   summit, the claim desk (the gate). Over it, a sandbag dangles from above the top of the screen: bounce off the
   umbrella on the luggage pile and you fly up into the Rigging, with the Wormhole back to the Netherlands. */
const PEAK = {
  m: ['enemy', 'lostCase'], z: ['enemy', 'lostCrab'], n: ['enemy', 'lostMoth'],
  x: ['decor', 'lostBags'], k: ['decor', 'lostSockPile'], w: ['decor', 'lostBrollyStuck'],
  U: ['piece', 'brolly', { w: 3 }], V: ['piece', 'brolly', { w: 3, col: '#3a8ae0' }]
};
const peak = (() => {
  const W = 34, H = 72, G = mk(W, H);
  G.h(0, W - 1, 0, '#').fill(0, 70, W - 1, 71, '#').v(0, 1, 69, '#').v(W - 1, 1, 69, '#');
  // the apron at the foot: start, the sign, a power-up, the first umbrella
  G.put(3, 69, '@'); G.put(6, 69, 'u'); G.put(8, 66, '?'); G.put(11, 69, 'U');
  // the foothill: luggage, a zipped suitcase (the sock drawer); P1 over it
  G.fill(18, 67, 32, 69, '#'); G.fill(16, 68, 17, 69, '#');
  G.put(30, 66, 'D'); G.put(27, 66, 'a'); G.put(23, 66, 'z'); G.put(24, 62, '*'); G.coins(20, 26, 63);
  // the face: a zig-zag of ledges every three rows (racks, suitcases, crumbling boxes)
  const L = [
    [11, 16, 63, '-'], [3, 9, 60, 'B'], [11, 15, 57, 'C'], [17, 23, 54, '-'], [25, 31, 51, '#'], [18, 22, 48, '-'],
    [8, 14, 45, 'B'], [2, 7, 42, '-'], [9, 13, 39, 'C'], [15, 20, 36, '-'], [22, 28, 33, 'B'], [26, 32, 30, '-'],
    [18, 23, 27, '-'], [10, 15, 24, '#'], [3, 8, 21, '-'], [9, 14, 18, 'C'], [14, 19, 15, '-'], [11, 16, 12, 'B']
  ];
  for (const [a, b, y, c] of L) G.h(a, b, y, c);
  // the umbrella on the west ledge, a hidden 1UP, coins, critters
  G.put(4, 59, 'V');
  G.put(20, 44, 'h'); G.coins(4, 8, 39); G.coins(16, 20, 33); G.coins(11, 15, 9);
  G.put(28, 50, 'm'); G.put(12, 44, 'z'); G.put(14, 52, 'n'); G.put(24, 40, 'n'); G.put(12, 30, 'n'); G.put(20, 20, 'n'); G.put(12, 23, 'z');
  G.put(29, 50, 'O'); // the sock drawer lets you out here (anchor d1out)
  // the duty-free bag's zip on the west ledge, and where it lets you out
  G.put(4, 41, 'D'); G.put(6, 41, 'P'); G.put(5, 20, 'e');
  // the fake wall on the east side (a sock pokes out of it): the zipped trunk behind it
  G.fill(29, 24, 32, 29, '#'); G.fill(29, 27, 32, 29, 'F'); G.put(32, 29, 'D'); G.put(28, 29, 'k'); G.put(27, 29, 'j');
  // the summit: the claim desk (gate); a luggage pile with an umbrella on it; the sandbag dangling from above
  G.fill(18, 9, 32, 10, '#'); G.put(29, 8, 'G'); G.put(24, 8, 'x'); G.put(19, 8, 'i');
  G.fill(21, 7, 23, 8, '#'); G.put(22, 6, 's'); G.put(20, 8, 'w');
  G.h(20, 24, 0, 't'); G.fill(20, 1, 24, 5, '.');
  G.put(22, 4, 'r'); G.put(26, 8, 'l');
  return {
    floor: 70, rows: G.rows(),
    legend: Object.assign({}, PEAK, {
      u: ['spawn', 'sign', { text: 'UNCLAIMED LUGGAGE! CLIMB TO THE CLAIM DESK AT THE TOP. ZIPPED SUITCASES ARE DOORS: PRESS UP TO UNZIP' }],
      j: ['anchor', 'trunkBack'], a: ['anchor', 'd1back'], O: ['anchor', 'd1out'], P: ['anchor', 'd2back'], e: ['anchor', 'd2out'], i: ['anchor', 'rigDrop'],
      t: ['seam', 'top', 'rigging@in'],
      r: ['decor', 'bkDangle'], l: ['decor', 'bkCrewSign']
    }),
    items: ['power'], hidden: ['oneup'], gold: { '*': 'must' },
    // doors are read top to bottom: the trunk (row 29), the duty-free bag (row 41), the sock drawer (row 66)
    doors: [{ to: 'trunk@in', look: 'lostZip' }, { to: 'dutyfree@in', look: 'lostZip' }, { to: 'drawer@in', look: 'lostZip' }]
  };
})();
// inside the first suitcase: the sock drawer, a climb up folded clothes past sewing pins; P3 (risky) over the pins
const drawerStamp = (() => {
  const G = mk(30, 18);
  G.h(0, 29, 0, '#').fill(0, 16, 29, 17, '#').v(0, 1, 15, '#').v(29, 1, 15, '#');
  G.put(2, 15, '@'); G.put(3, 15, 'D');
  G.h(8, 13, 15, '^'); G.h(7, 14, 12, '-'); G.put(10, 9, '*');
  G.h(17, 22, 13, '-'); G.h(22, 27, 10, '-'); G.h(14, 19, 7, '-'); G.h(21, 26, 4, '-');
  G.put(25, 3, 'D'); G.coins(15, 19, 5); G.put(19, 9, '?');
  G.put(6, 15, 'k'); G.put(26, 15, 'x');
  return { floor: 16, rows: G.rows(), items: ['magnet'], gold: { '*': 'risky' },
    legend: { k: ['decor', 'lostSockPile'], x: ['decor', 'lostBags'] },
    doors: [{ to: 'peak@d1out', look: 'tourDoor' }, { to: 'peak@d1back', look: 'tourDoor' }] };   // top to bottom
})();
// inside the second: the duty-free bag, tissue paper that tears (crumbles) and a hidden 1UP
const dutyStamp = (() => {
  const G = mk(30, 18);
  G.h(0, 29, 0, '#').fill(0, 16, 29, 17, '#').v(0, 1, 15, '#').v(29, 1, 15, '#');
  G.put(2, 15, '@'); G.put(3, 15, 'D');
  G.h(7, 11, 13, 'C'); G.h(13, 17, 11, 'C'); G.h(19, 23, 9, 'C'); G.h(24, 28, 6, '-'); G.h(15, 20, 4, '-');
  G.put(27, 5, 'D'); G.coins(8, 22, 8); G.put(17, 1, 'h');
  G.put(12, 15, 'm'); G.put(22, 15, 'k');
  return { floor: 16, rows: G.rows(), hidden: ['oneup'],
    legend: { m: ['enemy', 'lostCrab'], k: ['decor', 'lostSockPile'] },
    doors: [{ to: 'peak@d2out', look: 'tourDoor' }, { to: 'peak@d2back', look: 'tourDoor' }] };   // top to bottom
})();
// the zipped trunk behind the fake wall: TOTALLY REAL TREASURE (a prank, then the real prize)
const trunkStamp = { floor: 10,
  rows: mk(28, 12).h(0, 27, 0, '#').fill(0, 10, 27, 11, '#').v(0, 1, 9, '#').v(27, 1, 9, '#').put(2, 9, '@').put(3, 9, 'D').put(20, 3, '*').put(14, 5, '?').rows(),
  items: ['oneup'], gold: { '*': 'hidden' }, doors: [{ to: 'peak@trunkBack', look: 'tourDoor' }] };
// the Rigging over the mountain: catwalks, the Wormhole back to the Netherlands, a rope down to the summit
const rigStamp = (() => {
  const G = mk(40, 16);
  G.h(0, 39, 0, 'H').v(0, 1, 13, 'H').v(39, 1, 13, 'H').fill(0, 14, 39, 15, '#');
  G.fill(3, 14, 4, 15, '.'); G.put(3, 13, 'r');
  G.put(6, 13, '@'); G.put(10, 13, 'k'); G.put(14, 13, 'f'); G.put(24, 13, 'q'); G.put(31, 13, 'x'); G.put(34, 13, 'w'); G.put(37, 13, 'x');
  G.h(8, 14, 10, '-'); G.h(18, 24, 7, '-'); G.h(28, 33, 10, '-'); G.coins(19, 23, 5); G.put(21, 3, '*'); G.h(19, 23, 4, '-');
  G.put(16, 13, 'm'); G.put(26, 13, 'm');
  return { floor: 14, rows: G.rows(), gold: { '*': 'high' },
    legend: { r: ['decor', 'bkRopeDown'], k: ['decor', 'bkGhostLight'], f: ['decor', 'bkFlatBack'], q: ['decor', 'bkRack'], x: ['decor', 'bkCase'], m: ['spawn', 'bkMouse', {}], w: ['spawn', 'warp', { exit: 'warp' }] } };
})();
Object.assign(stamps, { lostPeak: peak, lostDrawer: drawerStamp, lostDuty: dutyStamp, lostTrunk: trunkStamp, lostRigging: rigStamp });
const L2 = { n: 2, name: 'Unclaimed Mountain', mapLabel: 'Luggage Mtn', arch: 'bonus', theme: 'lost_peak',
  gimmick: 'Climb a mountain of unclaimed luggage: umbrellas bounce you high, cardboard boxes give way, and zipped suitcases unzip into doors with shortcuts inside',
  hint: 'Hold jump on an umbrella to fly high. Press Up at a zipped suitcase: some go a long way up. A sandbag dangles over the summit...',
  postcard: 'A mountain made of suitcases. Somebody lost a whole tuba. ♥ C',
  enemies: [['lostCase', 1], ['lostCrab', 2], ['lostMoth', 3]],
  mapCell: [1, 0], mapFrom: 0,
  exits: {
    main: { to: '24-3' },
    warp: { to: '8-3', via: 'warp', label: 'NETHERLANDS', hint: 'A sandbag dangles over the summit of the mountain...' }
  },
  areas: [
    { id: 'peak', gen: 'room', theme: 'lost_peak', stamp: 'lostPeak', camera: 'free' },
    { id: 'drawer', gen: 'room', theme: 'lost_case', stamp: 'lostDrawer' },
    { id: 'dutyfree', gen: 'room', theme: 'lost_case', stamp: 'lostDuty' },
    { id: 'trunk', gen: 'room', role: 'secret', theme: 'lost_case', stamp: 'lostTrunk', room: 'prank',
      prank: { title: 'A SUITCASE FULL OF TREASURE!', rule: 'AN UNCLAIMED TRUNK STUFFED WITH GOLD. NOBODY WILL MISS IT. GO ON, OPEN IT', gag: 'snakes', label: 'GOLD!', line: 'OK, OK. THE REAL PRIZE IS IN THE CAGE.' } },
    { id: 'rigging', gen: 'room', role: 'backstage', zone: 'rigging', theme: 'bk_rigging', stamp: 'lostRigging',
      back: { side: 'bottom', span: [3, 4], to: 'peak@rigDrop', tell: 'rope' } }
  ] };

/* ---------------- 24-3 X-Ray Tunnel ----------------
   The security tunnel, dark but for the scanner's beam. Platforms over the pits show only inside the beam (light-only
   tiles); the sniffer beagle trots after Brady and barks at the hidden ones it smells (the spot lights up). Five
   stretches: a sweeping gantry over the first pit; a dark pit only the beagle can read; the big scanner (a still arch,
   then a gantry) over a floor of spikes, where one giant suitcase on a hidden ledge shows a door only under the
   x-ray (the CONFISCATED room); then a climb of hidden steps the beagle calls out, and the exit. */
const XRAY = {
  x: ['tile', 'SEMI', { hide: 3 }], X: ['tile', 'HARD', { hide: 3 }],
  w: ['spawn', 'lostBeagle', {}], n: ['enemy', 'lostMoth'], m: ['enemy', 'lostCase'],
  a: ['decor', 'lostArch'], t: ['decor', 'lostTray'], k: ['decor', 'lostBags']
};
const tunnel = (() => {
  const W = 150, H = 16, G = mk(W, H);
  G.h(0, W - 1, 0, 'B').fill(0, 14, W - 1, 15, '#').v(0, 1, 13, 'B').v(W - 1, 1, 13, 'B');
  // A: the security queue (start), the beagle, a power-up; the tray belt
  G.put(3, 13, '@'); G.put(5, 13, 'w'); G.put(8, 13, 'u'); G.put(11, 10, '?'); G.h(12, 17, 14, '>'); G.put(14, 13, 't'); G.put(16, 9, '%');
  // B: the first pit under a sweeping gantry
  G.fill(20, 14, 37, 15, '.');
  G.h(22, 24, 12, 'x'); G.h(27, 29, 10, 'x'); G.h(32, 34, 11, 'x');
  G.put(28, 1, 'Z');
  G.coins(26, 30, 6);
  // C: the dark pit: only the beagle can tell (P3, risky, over the highest step)
  G.fill(43, 14, 60, 15, '.');
  G.h(45, 46, 12, 'X'); G.h(49, 50, 10, 'X'); G.h(53, 54, 8, 'X'); G.h(57, 58, 11, 'X'); G.put(53, 5, '*');
  G.put(51, 3, 'n');
  // D: the big scanner: a still arch, then a gantry, over a floor of spikes; the x-ray door on a hidden ledge
  G.put(63, 13, 'c');
  G.h(66, 96, 13, '^');
  G.put(72, 1, 'R'); G.h(68, 70, 11, 'x'); G.h(73, 75, 9, 'x');
  G.put(86, 1, 'N');
  G.h(78, 80, 11, 'x'); G.h(83, 84, 9, 'x'); G.h(86, 90, 7, 'X'); G.put(89, 6, 'D'); G.put(87, 6, 'j'); G.h(92, 94, 10, 'x');
  G.coins(76, 82, 4); G.put(81, 3, 'n');
  // E: the climb out: hidden steps the beagle calls out, up to the high ledge
  G.fill(102, 14, 124, 15, '.');
  G.h(103, 104, 12, 'X'); G.h(107, 108, 10, 'x'); G.h(111, 112, 8, 'x'); G.h(115, 116, 6, 'X'); G.h(119, 124, 6, 'B'); G.put(122, 3, 'h');
  G.put(110, 4, 'n');
  // F: the drop to the exit: the gate under the last scanner arch
  G.put(130, 13, 'm'); G.put(138, 13, 'a'); G.put(143, 13, 'G'); G.put(134, 13, 'k'); G.coins(128, 136, 10);
  return {
    floor: 14, rows: G.rows(),
    legend: Object.assign({}, XRAY, {
      u: ['spawn', 'sign', { text: 'X-RAY TUNNEL: PLATFORMS SHOW ONLY IN THE SCANNER BEAM. NO BEAM? THE BEAGLE CAN SMELL THEM: WATCH WHERE IT BARKS' }],
      Z: ['spawn', 'lostScanner', { x0: 20, x1: 37, period: 4.5, rows: 10, foot: 14 }],
      R: ['spawn', 'lostScanner', { x0: 68, x1: 76, still: true, rows: 10, foot: 14 }],
      N: ['spawn', 'lostScanner', { x0: 77, x1: 96, period: 5, rows: 10, phase: 1.5, foot: 14 }],
      j: ['anchor', 'lockerBack']
    }),
    items: ['power'], hidden: ['oneup'], gold: { '*': 'risky', '%': 'must' },
    doors: [{ to: 'locker@in', look: 'lostXrayDoor' }]
  };
})();
// the CONFISCATED room behind the x-ray door: pick one of three things security took
stamps.lostTunnel = tunnel;
stamps.lostLocker = { floor: 10,
  rows: mk(28, 12).h(0, 27, 0, '#').fill(0, 10, 27, 11, '#').v(0, 1, 9, '#').v(27, 1, 9, '#').put(2, 9, '@').put(3, 9, 'D').put(22, 3, '*').put(14, 6, '?').put(20, 9, 't').rows(),
  legend: { t: ['decor', 'lostTray'] },
  items: ['lsd'], gold: { '*': 'hidden' }, doors: [{ to: 'tunnel@lockerBack', look: 'tourDoor' }] };
const L3 = { n: 3, name: 'X-Ray Tunnel', mapLabel: 'X-Ray', arch: 'bonus', theme: 'lost_xray',
  gimmick: 'The security scanner: platforms show only inside the x-ray beam, and where there is no beam the sniffer beagle barks at the hidden ones',
  hint: 'Wait for the beam to sweep over a pit. In the dark, watch the beagle: it barks at hidden platforms. One suitcase hides a door only the x-ray shows',
  postcard: 'They x-rayed my bag and found a rubber duck. I don\'t own a rubber duck. ♥ C',
  enemies: [['lostMoth', 3], ['lostCase', 1]],
  mapCell: [2, 0], mapFrom: 1,
  areas: [
    { id: 'tunnel', gen: 'room', theme: 'lost_xray', stamp: 'lostTunnel' },
    { id: 'locker', gen: 'room', role: 'secret', theme: 'lost_hall', stamp: 'lostLocker', room: 'pick',
      pick: { title: 'CONFISCATED!', rule: 'THINGS SECURITY TOOK OFF PASSENGERS. TAKE ONE BACK. ONLY ONE', choices: ['star', 'oneup', 'magnet', 'power'] } }
  ] };

/* ---------------- 24-4 The Sock Hydra (the boss) ---------------- */
// the lost-property warehouse: aisles of shelves (three postcards on the way), then the sock heap
const L4 = { n: 4, name: 'The Sock Hydra', mapLabel: 'Warehouse', arch: 'lair', theme: 'lost_depot', boss: 'lost_hydra',
  gimmick: 'Every odd sock in the world, heaped up and alive: stomp a dizzy head and it pops off as a loose sock (and grows back). Kick each loose sock into its twin to pair them up',
  hint: 'Stomping only pops a head off. Kick (or stomp-launch) a loose sock into the heap: if a head is the same sock, they pair up for good',
  postcard: 'You paired up every sock on the island. I have never been prouder. ♥ C',
  enemies: [['lostCase', 2], ['lostMoth', 1]],
  mapCell: [2, 1], mapFrom: 2,
  areas: [
    { id: 'aisles', gen: 'strip', W: 64, H: 18, theme: 'lost_depot',
      script: [
        ['itemBlock', { item: 'power' }],
        ['flat', { n: 6 }],
        ['enemies', { n: 1, kind: 'lostCase' }],
        ['postcard', { kind: 'must', dy: -5 }],
        'gap',
        ['flat', { n: 4 }],
        ['enemies', { n: 1, kind: 'lostMoth' }],
        ['itemBlock', { item: 'power' }],
        ['postcard', { kind: 'high', dy: -7, dx: -2 }],
        ['flat', { n: 4 }],
        ['postcard', { kind: 'risky', dy: -4 }],
        ['door', { to: 'depot@in', perch: 0, look: 'lostHatch' }]
      ] },
    { id: 'depot', gen: 'arena', role: 'arena', layout: 'laundry', arenaW: 26, H: 18 }
  ] };

Tour.amend('lost', { stamps, levels: [L1, L2, L3, L4] });

/* ---------------- the land's map: an airport island ---------------- */
// the route: off the plane at the airstrip in the south-west, along the runway to the baggage hall, north up to the
// luggage mountain, east along the taxiway to the x-ray hall, then south to the lost-property warehouse by the port
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.lost = {
  labels: { '24-1': 'Carousels', '24-2': 'Luggage Mtn', '24-3': 'X-Ray', '24-4': 'Warehouse' },
  w: 1400, h: 900,
  pal: { sea: '#2ab8c8', deep: '#1a7a9a', land: '#9ad07a', light: '#d8eca0', path: '#b8bcc4', beach: '#f8eccc', cliff: '#6aa070', roof: '#ff7a3a', wall: '#f2ece0' },
  coast: 'rock', tufts: 'sand', trail: 'cobble', bridge: 'stone', flowerCols: ['#ffd23a', '#ff7a3a', '#ffffff'],
  land: [[[110, 640], [140, 470], [260, 300], [420, 170], [640, 120], [900, 130], [1120, 200], [1290, 330], [1320, 520], [1270, 700], [1120, 800], [860, 830], [560, 820], [300, 790], [160, 730]]],
  nodes: { start: [230, 680], '24-1': [560, 690], '24-2': [470, 330, 'e'], '24-3': [880, 290, 'n'], '24-4': [1110, 560, 'w'], port: [1130, 740] },
  paths: { 'start>24-1': [[400, 720]], '24-1>24-2': [[560, 500]], '24-2>24-3': [[680, 260]], '24-3>24-4': [[1050, 380]], '24-4>port': [[1180, 650]] },
  feat: [
    ['patch', '#7a808c', [[200, 760], [1000, 770], [1010, 795], [200, 790]]],
    ['patch', '#8a909c', [[700, 600], [940, 470], [960, 500], [720, 630]]],
    ['sprite', 'ctower', 300, 600, 22], ['sprite', 'terminal', 700, 700, 30], ['sprite', 'carousel', 640, 620, 16],
    ['sprite', 'pile', 400, 250, 34], ['sprite', 'pile', 560, 220, 26], ['sprite', 'pile', 360, 380, 22],
    ['sprite', 'warehouse', 1200, 470, 30], ['sprite', 'jet', 820, 780, 30], ['sprite', 'jet', 480, 780, 26],
    ['sprite', 'terminal', 980, 250, 22],
    ['trees', 'palm', 1180, 300, 60, 5], ['trees', 'palm', 250, 470, 50, 4], ['trees', 'palm', 760, 420, 60, 4]
  ],
  flora: ['palm', 'bush'], density: 16,
  live: [['blink', 300, 556, '#ff4a3a'], ['blink', 1000, 790, '#ffd23a'], ['blink', 210, 790, '#ffd23a'], ['circle', 860, 520, 70, 0.9], ['plane', 640, 160, 90], ['bob', 'buoy', 1340, 640]]
};
})();
