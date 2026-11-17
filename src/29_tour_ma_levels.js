/* ============================================================
   Morocco: the six levels in the v2 format (LEVEL_OVERHAUL.md §2,
   §3.2 Morocco). The country (art, cast, objects, Berrad and the
   Brass Owl) is registered by 29_tour_ma.js; this file adds the
   stamps and the levels with Tour.amend.
   ============================================================ */
(() => {
const C = Tour.countries.ma;
if (!C) return;

/* ---------- 5-1: the souk maze, nine cells of 26 x 14 ---------- */
// one legend for every cell: rugs, spice heaps, decor and the cast
const SOUK = {
  R: ['piece', 'rug', { w: 5, h: 5 }], r: ['piece', 'rug', { w: 3, h: 4 }], U: ['piece', 'rug', { w: 4, h: 3, bounce: true }],
  P: ['piece', 'heap', { w: 2, h: 2, seed: 0 }], p: ['piece', 'heap', { w: 2, h: 1, seed: 1 }], Y: ['piece', 'heap', { w: 2, h: 3, seed: 2 }],
  k: ['decor', 'maBasket'], l: ['decor', 'maLantern'], d: ['decor', 'maDyeVat'], e: ['decor', 'maSkeins'], j: ['decor', 'maJar'], n: ['decor', 'maSpiceSacks'], f: ['decor', 'maPots'],
  m: ['enemy', 'maMoth'], t: ['enemy', 'maTagine'], a: ['enemy', 'maTeapot'], x: ['piece', 'cobraBasket', {}],
  i: ['spawn', 'sign', { text: 'FOLLOW THE SAFFRON-YELLOW RUGS TO THE ROOFTOPS' }],
  z: ['spawn', 'sign', { text: 'RUG MOTHS NIBBLE THE RUGS (THEY GROW BACK)' }],
  K: ['anchor', 'shopBack']
};
const cell = (rows, extra) => Object.assign({ floor: 12, rows, legend: SOUK }, extra || {});
const souk = {
  // A: the souk gate (start). Paprika door at 9 (a dead end), saffron door at 22
  gate: cell([
    '##########################',
    '#........................#',
    '#........................#',
    '#.........o.o.o..........#',
    '#........................#',
    '#........R...............#',
    '#........................#',
    '#.............o.o........#',
    '#....?.......r...........#',
    '#........................#',
    '#........................#',
    '#.@.i.l.....P......k.....#',
    '##########################',
    '##########################'
  ], { items: ['power'] }),
  // B: the spice hall; the saffron trail drops through the hole in the floor
  spices: cell([
    '##########################',
    '#........................#',
    '#........................#',
    '#........................#',
    '#...o.o.o........o.o.o...#',
    '#........................#',
    '#..R..............R......#',
    '#...........e............#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#......Y......n...Y.t....#',
    '###########....###########',
    '###########....###########'
  ]),
  // E: the dyers' hall: rug moths on the rugs, P1 over the saffron vat
  dyers: cell([
    '###########....###########',
    '#........................#',
    '#........................#',
    '#...o.o.o.......o.o.o....#',
    '#........................#',
    '#....*...................#',
    '#.................m......#',
    '#..R...........R.........#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#.z.p......d...d....p....#',
    '##########################',
    '##########################'
  ], { gold: { '*': 'must' } }),
  // F: lantern alley: the lantern shop's door, the saffron door up to the rooftops
  alley: cell([
    '##########################',
    '#........................#',
    '#........................#',
    '#...l....l....l....l.....#',
    '#........................#',
    '#......o.o.o.............#',
    '#.....r.......r..........#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#..........k.....D.K.j...#',
    '##########################',
    '##########################'
  ], { doors: [{ to: 'shop@in', look: 'maShopDoor' }] }),
  // C: the rooftops: sky rugs up to the terrace and the gate; the carpet; P3 up high
  roofs: cell([
    '##########################',
    '#........................#',
    '#..........*.........G...#',
    '#.................########',
    '#..............r.........#',
    '#..........?.............#',
    '#.........r..............#',
    '#........................#',
    '#........................#',
    '#....r...................#',
    '#........................#',
    '#........................#',
    '##########################',
    '##########################'
  ], { items: ['sig'], gold: { '*': 'high' } }),
  // D: the basket weavers (a dead end down the paprika door): snake baskets and a hidden water bottle
  baskets: cell([
    '##########################',
    '#........................#',
    '#........................#',
    '#........................#',
    '#..o.o.o.........o.o.o...#',
    '#........................#',
    '#..R..............R......#',
    '#........................#',
    '#...........h............#',
    '#........................#',
    '#........................#',
    '#.....x..........x.......#',
    '##########################',
    '##########################'
  ], { hidden: ['oneup'] }),
  // G: the cumin cellar (a dead end): coins and jars
  cellar: cell([
    '##########################',
    '#........................#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#.....o.o.o.o.o.o.o......#',
    '#....-------------.......#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#..j.n.....p.......n.....#',
    '##########################',
    '##########################'
  ]),
  // H: the tagine cooks: the indigo trail in, a paprika door to the cellar, a mint door on
  cooks: cell([
    '##########################',
    '#........................#',
    '#........................#',
    '#........................#',
    '#.......o.o.o.o..........#',
    '#........................#',
    '#.......R................#',
    '#........................#',
    '#.................a......#',
    '#...............-----....#',
    '#........................#',
    '#..f.......t.......t.....#',
    '##########################',
    '##########################'
  ]),
  // I: the fountain court: a bouncy rug to the high coins; a one-way door back up to lantern alley
  court: cell([
    '##########################',
    '#........................#',
    '#.......o.o.o.o..........#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#.....d.....U......f.....#',
    '##########################',
    '##########################'
  ])
};
const lanternShop = {
  floor: 11,
  rows: [
    '############################',
    '#....................#.....#',
    '#....................#.....#',
    '#....................#.....#',
    '#....................#.....#',
    '#...l....l...........#.....#',
    '#....................#.....#',
    '#..........*.........#.....#',
    '#........-----.......#.....#',
    '#....................#.....#',
    '#.@.D.......k....u...w..g..#',
    '############################',
    '############################'
  ],
  legend: { l: ['decor', 'maLantern'], k: ['decor', 'maPots'], u: ['piece', 'shopLantern', { opens: 'shopWall' }], w: ['piece', 'slideWall', { id: 'shopWall', h: 4 }] },
  doors: [{ to: 'souk@shopBack', look: 'maShopDoor' }],
  gold: { '*': 'hidden' }
};

/* ---------- rooms of the other levels ---------- */
const stamps = {
  lanternShop,
  // 5-2: the oasis camp tent; its back wall is cloth over nothing (FAKE): behind it, door 22 to World 22
  oasisCamp: {
    floor: 12,
    rows: [
      '##################################',
      '#.........................#......#',
      '#.........................#......#',
      '#...o.o.o.o.o.o.o.........#......#',
      '#.........................#......#',
      '#.........*...............#......#',
      '#........-----............#......#',
      '#.........................#......#',
      '#.........................#......#',
      '#.....?...................#......#',
      '#.........................F......#',
      '#.@.D.....n.......n......aF.i.N..#',
      '##################################',
      '##################################'
    ],
    legend: { n: ['decor', 'maPots'], a: ['spawn', 'tourDraft', { look: 'fake' }], i: ['spawn', 'sign', { text: 'Door 22. Somewhere, every clock has stopped at 22:22...' }], N: ['spawn', 'gate', { exit: 'secret', secret: true, need: 22 }] },
    items: ['power'], doors: [{ to: 'sahara@campBack', look: 'maTentDoor' }], gold: { '*': 'hidden' }
  },
  // 5-3: a hidden riad behind the blue-painted door: a fountain, an orange tree, P2 and the way to the Bazar Bleu
  blueRiad: {
    floor: 11,
    rows: [
      '##############################',
      '#............................#',
      '#............................#',
      '#..o.o.o.o...................#',
      '#............................#',
      '#..-------.........*.........#',
      '#.................----.......#',
      '#............................#',
      '#.............?..............#',
      '#............................#',
      '#.@.D...t.........q......g...#',
      '##############################',
      '##############################'
    ],
    legend: { t: ['decor', 'maOrangeTree'], q: ['decor', 'maFountain'] },
    items: ['oneup'], doors: [{ to: 'medina@riadBack', look: 'maRiadDoor' }], gold: { '*': 'hidden' }
  },
  // 5-4: the tower room: pull the chain to drop a tagine lid (on the goat, with luck); it raises the grille too
  owlTower: {
    floor: 12,
    rows: [
      '##########################',
      '#........................#',
      '#..*.....................#',
      '#.----...................#',
      '#........................#',
      '#.......-----............#',
      '#........................#',
      '#........................#',
      '#.........?..............#',
      '#........................#',
      '#........................#',
      '#.@.q...............D....#',
      '##########################',
      '##########################'
    ],
    legend: { q: ['piece', 'chainLid', { dx: 6, hy: 9, opens: 'grille', shutterAt: 12, enemy: 'maGoat' }] },
    items: ['star'], doors: [{ to: 'owl@in', look: 'maKasbahDoor' }], gold: { '*': 'risky' }
  },
  // 5-4: the pigeon loft behind a fake bit of roof wall
  pigeonLoft: {
    floor: 10,
    rows: [
      '############################',
      '#..........................#',
      '#..........................#',
      '#....o.o.o.o.o.............#',
      '#..........................#',
      '#...---------.....*........#',
      '#.....p...p......----......#',
      '#..........................#',
      '#..............h...........#',
      '#.@.D.....p.......p....p...#',
      '############################',
      '############################'
    ],
    legend: { p: ['decor', 'maPigeon'] },
    hidden: ['oneup'], doors: [{ to: 'kasbah@loftBack', look: 'maKasbahDoor' }], gold: { '*': 'hidden' }
  },
  // 5-5: the little courtyard behind the carved screen
  smallCourt: {
    floor: 10,
    rows: [
      '############################',
      '#..........................#',
      '#..........................#',
      '#..o.o.o.o.o.o.o.o.........#',
      '#..........................#',
      '#...........*..............#',
      '#.........-----............#',
      '#..........................#',
      '#.....h....................#',
      '#.@.D.....t.......j........#',
      '############################',
      '############################'
    ],
    legend: { t: ['decor', 'maOrangeTree'], j: ['decor', 'maJar'] },
    hidden: ['oneup'], doors: [{ to: 'zellige@courtBack', look: 'maRiadDoor' }], gold: { '*': 'hidden' }
  },
  // 5-6: the tent on the high island
  skyTent: {
    floor: 10,
    rows: [
      '############################',
      '#..........................#',
      '#..........................#',
      '#...o.o.o.o.o..............#',
      '#..........................#',
      '#.........*................#',
      '#.......-----..............#',
      '#..........................#',
      '#.............?............#',
      '#.@.D...n...........n......#',
      '############################',
      '############################'
    ],
    legend: { n: ['decor', 'maPots'] },
    items: ['oneup'], doors: [{ to: 'cielo@tentBack', look: 'maTentDoor' }], gold: { '*': 'hidden' }
  }
};

Tour.amend('ma', {
  stamps,
  levels: [
    /* 5-1 MAZE: a 3 x 3 souk of rug doors; saffron yellow is the way */
    { n: 1, name: 'Souk Labyrinth', mapLabel: 'Souk', arch: 'maze', theme: 'ma_souk',
      gimmick: 'A maze of rug doors: follow the saffron-yellow ones. Rug moths nibble the rugs you stand on',
      hint: 'Saffron-yellow doors lead on; the other colours are dead ends with treats',
      postcard: 'The souk is a maze, Brady. I followed the saffron and found the rooftops! ♥ C',
      enemies: [['maTagine', 2], ['maTeapot', 1], ['maMoth', 2]],
      mapCell: [0, 0], mapFrom: -1,
      exits: {
        main: { to: '5-2' },
        secret: { to: '5-6', hint: 'In the lantern shop, one lantern was never lit...' }
      },
      areas: [
        { id: 'souk', gen: 'maze', cells: [3, 3], cell: [26, 14],
          script: [[souk.gate, souk.spices, souk.roofs], [souk.baskets, souk.dyers, souk.alley], [souk.cellar, souk.cooks, souk.court]],
          links: [
            { from: [0, 0], to: [1, 0], kind: 'door', at: [22, 11], toAt: [3, 11], look: 'maDoorSaffron' },
            { from: [0, 0], to: [0, 1], kind: 'door', at: [9, 11], toAt: [12, 11], look: 'maDoorPaprika' },
            { from: [1, 0], to: [1, 1], kind: 'drop' },
            { from: [1, 1], to: [2, 1], kind: 'door', at: [22, 11], toAt: [3, 11], look: 'maDoorSaffron' },
            { from: [1, 1], to: [1, 2], kind: 'door', at: [8, 11], toAt: [3, 11], look: 'maDoorIndigo' },
            { from: [1, 2], to: [0, 2], kind: 'door', at: [9, 11], toAt: [21, 11], look: 'maDoorPaprika' },
            { from: [1, 2], to: [2, 2], kind: 'door', at: [22, 11], toAt: [3, 11], look: 'maDoorMint' },
            { from: [2, 2], to: [2, 1], kind: 'oneway', at: [22, 11], toAt: [12, 11], look: 'maDoorMint' },
            { from: [2, 1], to: [2, 0], kind: 'door', at: [22, 11], toAt: [3, 11], look: 'maDoorSaffron' }
          ] },
        { id: 'shop', gen: 'room', role: 'secret', theme: 'ma_lampshop', stamp: 'lanternShop' }
      ] },

    /* 5-2 SCROLL: the caravan rolls on; door 22 hides at the back of the oasis camp */
    { n: 2, name: 'Sahara Caravan', mapLabel: 'Sahara', arch: 'scroll', theme: 'ma_sahara',
      gimmick: 'The dunes roll by: ride the camels over quicksand, walk in the sandstorm\'s lulls, cross the flickering mirages',
      hint: 'Mirage slabs shimmer just before they vanish',
      postcard: 'Camels are VERY tall. The one I rode hummed the whole way. ♥ C',
      enemies: [['maScarab', 2], ['maFennec', 2], ['maCobra', 1]],
      mapCell: [1, 0], mapFrom: 0,
      exits: {
        main: { to: '5-3' },
        secret: { to: 'land:w22', need: 22, sign: 'Door 22. Somewhere, every clock has stopped at 22:22...', hint: 'Sand blows out from behind a tent wall at the oasis camp...' }
      },
      areas: [
        { id: 'sahara', gen: 'strip', mode: 'auto', W: 209, H: 18, scroll: 2.6, script: [
          // ① the caravan
          ['itemBlock', { item: 'power', y: 4 }],
          ['flat', { n: 4 }],
          ['caravan', {}],
          ['baskets', { n: 2 }],
          ['postcard', { kind: 'must', dx: 1, dy: -4 }],
          'oasis',
          'sig',
          ['caravan', { span: 13 }],
          'cp',
          // ② the sandstorm
          'storm',
          ['enemies', { n: 2 }],
          'storm',
          ['door', { to: 'camp@in', look: 'maTentDoor', back: 'campBack', perch: 0 }],
          ['caravan', { span: 12 }],
          // ③ mirages over the quicksand, in the wind
          ['mirage', { n: 4, gold: 'risky' }],
          'storm',
          ['mirage', { n: 5 }],
          ['enemies', { n: 2 }],
          ['end', { exit: 'main' }]
        ] },
        { id: 'camp', gen: 'room', role: 'secret', theme: 'ma_tent', stamp: 'oasisCamp' }
      ] },

    /* 5-3 PHASE: the sun-moon lantern turns the blue medina from day to night and back */
    { n: 3, name: 'Chefchaouen Blue', mapLabel: 'Blue City', arch: 'phase', theme: 'ma_azul',
      gimmick: 'Strike the sun-moon lantern: by day laundry lines and napping cats, by night lantern strings, prowling cats and snails',
      hint: 'Press UP at a sun-moon lantern to flip day and night (you can do it in mid-air)',
      postcard: 'Everything here is blue, even the stairs. At night the cats run the town. ♥ C',
      enemies: [['maCat', 2], ['maSnail', 2], ['maTeapot', 1]],
      mapCell: [2, 0], mapFrom: 1,
      exits: {
        main: { to: '5-4' },
        secret: { to: 'house:ma-bazar', hint: 'At night a lantern hangs over a door painted the colour of the wall...' }
      },
      areas: [
        { id: 'medina', gen: 'strip', W: 200, H: 22, phase: { night: 'ma_azul_night' }, script: [
          // ① day: blue stairs, laundry lines, napping cats
          ['itemBlock', { item: 'power', y: 4 }],
          ['itemBlock', { item: 'beans', y: 4 }],   // a jump power (bonus)
          ['blueHouse', { w: 8, h: 5, gold: 'must' }],
          ['enemies', { kind: 'maCat', n: 1 }],
          ['lines', { n: 6 }],
          ['blueHouse', { w: 6, h: 3 }],
          ['enemies', { kind: 'maSnail', n: 1 }],
          ['lines', { n: 5, dayY: 3 }],
          ['gearStand', { item: 'kazoo' }],
          // ② the lantern: night brings lantern strings; the laundry is gone; cats wake, snails come out
          ['sunMoon', {}],
          ['lines', { n: 6, day: false, night: true, nightY: 3 }],
          'cp',
          ['secretDoor', { to: 'riad@in', look: 'painted', skin: 'maBlueDoor', back: 'riadBack' }],
          ['enemies', { kind: 'maCat', n: 2 }],
          ['nightLedge', { y: 4, item: 'lsd', gold: 'risky' }],   // y 4: the ledge is in jump reach, so the box over it opens
          ['sunMoon', {}],
          ['lines', { n: 6, day: false, night: true, nightY: 4 }],
          // ③ flip between them: a laundry line and a lantern string share one long gap
          ['blueHouse', { w: 7, h: 4 }],
          ['enemies', { kind: 'maSnail', n: 1 }],
          ['sunMoon', {}],
          ['lines', { n: 8, night: true, dayY: 2, nightY: 5 }],
          ['enemies', { kind: 'maTeapot', n: 1 }],
          ['end', { exit: 'main' }]
        ] },
        { id: 'riad', gen: 'room', role: 'secret', theme: 'ma_riad', stamp: 'blueRiad' }
      ] },

    /* 5-4 FORT: kasbah walls, the tower room's chain and lids, the Brass Owl */
    { n: 4, name: 'Kasbah of the Brass Owl', mapLabel: 'Kasbah', arch: 'fort', theme: 'ma_atlas', boss: 'ma_owl', mid: true,
      gimmick: 'Kasbah walls and a tree full of goats, a tower of chains and tagine lids, then the Baron\'s clockwork owl',
      hint: 'Pull a chain while the Brass Owl looks the other way: the lid drops on it',
      postcard: 'A brass owl guarded the kasbah. It fell apart into teaspoons! We kept one. ♥ C',
      enemies: [['maGoat', 2], ['maFennec', 2]],
      mapCell: [2, 1], mapFrom: [2, 5],
      exits: { main: { to: '5-5' } },
      areas: [
        { id: 'kasbah', gen: 'strip', W: 80, H: 20, script: [
          ['portcullis', { title: 'KASBAH OF THE BRASS OWL' }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['kasbahWall', { n: 3, enemy: 'maFennec' }],
          ['arganTree', { gold: 'must' }],
          ['kasbahWall', { n: 2 }],
          ['step', { h: 3 }],
          ['secretDoor', { to: 'loft@in', look: 'fake', back: 'loftBack' }],
          ['step', { h: -3 }],
          ['enemies', { kind: 'maGoat', n: 1 }],
          ['door', { to: 'tower@in', look: 'maKasbahDoor', perch: 0 }]
        ] },
        { id: 'tower', gen: 'room', role: 'sub', theme: 'ma_atlas', stamp: 'owlTower' },
        { id: 'owl', gen: 'arena', role: 'arena', layout: 'owl', arenaW: 24, H: 16, theme: 'ma_atlas' },
        { id: 'loft', gen: 'room', role: 'secret', stamp: 'pigeonLoft' }
      ] },

    /* 5-5 LAIR: fountain galleries, then Berrad the Magnificent in the riad courtyard */
    { n: 5, name: 'Riad of Fountains', mapLabel: 'Riad', arch: 'lair', theme: 'ma_riad', boss: 'ma_berrad',
      gimmick: 'Fountain jets lift Brady to the galleries; then Berrad the Magnificent, a grand brass teapot, and his brazier',
      hint: 'Kick Berrad\'s brazier across the riad. When he sinks into it to reboil, stomp his lid!',
      postcard: 'The kasbah is unrolled and back on its hill! The Baron went to Spain. ¡Olé! ♥ C',
      enemies: [['maTagine', 2], ['maTeapot', 1]],
      mapCell: [1, 2], mapFrom: 3,
      areas: [
        { id: 'zellige', gen: 'strip', W: 70, H: 18, script: [
          ['itemBlock', { item: 'power', y: 4 }],
          ['galleries', { gold: 'must' }],
          'screens',
          ['kickPot', {}],
          ['secretDoor', { to: 'court@in', look: 'curtain', skin: 'maCarvedScreen', back: 'courtBack' }],
          'rolling',
          ['fountain', { gold: true }],
          ['itemBlock', { item: 'sig', y: 4 }],
          ['door', { to: 'arena@in', perch: 0, look: 'maRiadDoor' }]
        ] },
        { id: 'court', gen: 'room', role: 'secret', theme: 'ma_riad', stamp: 'smallCourt' },
        { id: 'arena', gen: 'arena', role: 'arena', layout: 'riad', arenaW: 26, H: 20, roof: false }
      ] },

    /* 5-6 SKY (secret): flying rugs over the High Atlas */
    { n: 6, name: 'Carpet Skies', mapLabel: 'Carpets', arch: 'sky', secret: true, theme: 'ma_cielo',
      gimmick: 'No ground at all: hop flying rugs over the High Atlas, ride out the gusts, and mind the moths on the carpets',
      hint: 'Gusts come and go: cross in the lulls',
      postcard: 'Above the clouds on a flying rug! The storks waved. Well, flapped. ♥ C',
      enemies: [['maStork', 2], ['maMoth', 2]],
      mapCell: [0, 1], mapFrom: 0,
      exits: { main: { to: 'node:5-4' } },
      areas: [
        { id: 'cielo', gen: 'islands', W: 220, H: 30, script: [
          // ① flying rugs as moving islands
          ['itemBlock', { item: 'sig', y: 4 }],
          ['flyingRugs', { n: 2, span: 10 }],
          ['rugIsland', { w: 6, dy: -2, tight: true }],
          ['rugIsland', { w: 5, dy: -4, tight: true }],
          ['postcard', { kind: 'must', dx: -3, dy: -7 }],
          ['flyingRugs', { n: 3, span: 9 }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['enemies', { kind: 'maStork', n: 1 }],
          'cp',
          // ② wind gusts
          ['gust', { w: 12, gold: 'risky' }],
          ['rugIsland', { w: 6, moth: true }],
          ['door', { to: 'tent@in', look: 'maTentDoor', back: 'tentBack', perch: 3 }],
          ['gust', { w: 14, dir: 1 }],
          // ③ moths nibbling the carpets while the storks swoop
          ['rugIsland', { w: 7, moth: true, tight: true }],
          ['rugIsland', { w: 6, dy: -2, moth: true, tight: true }],
          ['enemies', { kind: 'maStork', n: 1 }],
          ['itemBlock', { item: 'lsd', y: 4 }],
          ['flyingRugs', { n: 2, span: 10 }],
          ['end', { exit: 'main' }]
        ] },
        { id: 'tent', gen: 'room', role: 'secret', theme: 'ma_tent', stamp: 'skyTent' }
      ] }
  ]
});
})();
