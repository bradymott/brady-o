/* ============================================================
   KENYA: the levels (world 15) and the land's walkable map.
   15-1 THE GREAT MIGRATION (stampede): run with the wildebeest. The herd is the moving floor: ride their backs
        across crocodile rivers they swim and over thorn thickets they leap (both too wide or too tall to jump).
   15-2 GIRAFFE GROVE (necks): carry a bunch of acacia leaves; a giraffe's head follows them. Ride its head and hold
        UP or DOWN to steer it: up to the canopy, out across a gap. The hidden exit to 15-6 is here.
   15-3 FLAMINGO LAKE (flock): flamingos standing in the soda lake are the stepping stones, but they panic and fly
        off a moment after you land; skeins of flamingos carry you across the wide water.
   15-4 HIGH NOON (shade): the sun is the hazard. A heat gauge fills out in the open and empties in the shade: under
        acacias and rocks, in a drifting cloud's shadow, in the walking elephant's shadow.
   15-5 BIG KIBOKO (lair): the waterhole. The hippo who does water ballet.
   15-6 MEERKAT MANOR (burrow, secret): the warren. Meerkat sentries whistle when they see Brady above ground and an
        eagle stoops on the spot; drop down the burrows and run the tunnels underneath.
   ============================================================ */
(function () {
const C = Tour.countries.ke;
if (!C) return;
const stamps = {};

/* ---------------- 15-1 The Great Migration ---------------- */
stamps.keDen = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#....................*.......#',
    '#...................o.o......#',
    '#.................-------....#',
    '#............................#',
    '#..........-----.............#',
    '#.h.........o.o..............#',
    '#............................#',
    '#...-----.........k..........#',
    '#............................#',
    '#.@...D......t.........t.....#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'plain@denBack', look: 'keMoundDoor' }],
  legend: { t: ['decor', 'kePebbles'], k: ['decor', 'keRoots'] }
};
const L1 = { n: 1, name: 'The Great Migration', mapLabel: 'Migration', arch: 'stampede', theme: 'ke_mara',
  gimmick: 'Run with the wildebeest: their backs are the floor. The herd swims the crocodile rivers and leaps the thorn thickets you could never jump',
  hint: 'Hop on a wildebeest as it runs past and ride it across. Crocs lunge out of the river: watch for the bubbles and the eyes',
  postcard: 'A MILLION wildebeest, Brady! They all seem to know where they\'re going. Nobody asked for directions. ♥ C',
  enemies: [['keBeetle', 2], ['keWarthog', 2], ['keVulture', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '15-2' } },
  areas: [
    { id: 'plain', gen: 'strip', W: 250, H: 18, GY: 14,
      script: [
        ['box', { item: 'power' }],
        ['tip', { text: 'THE GREAT MIGRATION! HOP ON A WILDEBEEST AS IT RUNS PAST: THE HERD SWIMS RIVERS AND LEAPS THORNS YOU CAN\'T' }],
        ['plain', { n: 6 }],
        // ① teach: an empty river, then a thicket: just ride
        ['herdOn', { n: 10, every: 1.1 }],
        ['river', { w: 11 }],
        ['plain', { n: 4 }],
        ['thicket', { h: 6, w: 2 }],
        ['herdOff', { n: 4 }],
        ['enemies', { kind: 'keBeetle', n: 2, len: 12 }],
        ['postcard', { kind: 'must', dx: -6, dy: -4 }],
        'cp',
        // ② test: crocs in the rivers, a vulture over the water, a thicket between two rivers
        ['herdOn', { n: 8, every: 1.15 }],
        ['river', { w: 13, crocs: 1, gold: 'risky', goldDy: 5 }],
        ['plain', { n: 3 }],
        ['thicket', { h: 7, w: 3 }],
        'cp',
        ['river', { w: 16, crocs: 2, fly: 'keVulture' }],
        ['herdOff', { n: 4 }],
        ['moundDoor', { to: 'den@in', back: 'denBack' }],
        ['enemies', { kind: 'keWarthog', n: 1, len: 12 }],
        ['box', { item: 'power' }],
        'cp',
        // ③ twist: the gorge leap straight into the long river, a thicket on the far bank, one more river
        ['herdOn', { n: 8, every: 1.0 }],
        ['gorge', { w: 10, h: 3 }],
        ['river', { w: 20, crocs: 3, fly: 'keVulture' }],
        'cp',
        ['thicket', { h: 6, w: 2 }],
        ['river', { w: 12, crocs: 1, gold: 'high', goldDy: 6 }],
        ['herdOff', { n: 6 }],
        ['enemies', { kind: 'keWarthog', n: 1, len: 10 }],
        ['end', { exit: 'main' }]
      ] },
    { id: 'den', gen: 'room', role: 'secret', theme: 'ke_den', stamp: 'keDen' }
  ] };

/* ---------------- 15-2 Giraffe Grove ---------------- */
// the meerkats' burrow under the kopje ledge: the way to Meerkat Manor (the hidden exit), a hidden postcard
stamps.keManorDoor = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#.....*......................#',
    '#....----....................#',
    '#............o.o.o...........#',
    '#..........-------...........#',
    '#.h..........................#',
    '#.................-----......#',
    '#............................#',
    '#.......k..............-----.#',
    '#............................#',
    '#.@...D...t.......t.......g..#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'grove@manorBack', look: 'keBurrow' }],
  legend: { t: ['decor', 'kePebbles'], k: ['decor', 'keRoots'] }
};
const L2 = { n: 2, name: 'Giraffe Grove', mapLabel: 'Giraffes', arch: 'necks', theme: 'ke_grove',
  gimmick: 'Giraffes follow a bunch of acacia leaves: ride a giraffe\'s head and hold UP or DOWN to steer it, up the cliffs and out across the gaps',
  hint: 'Take the leaves from a sapling. On a giraffe\'s head, hold UP to go up and across, DOWN to come back',
  postcard: 'The giraffes here eat out of your hand, Brady. And off your hat. And your hair. ♥ C',
  enemies: [['keBeetle', 1], ['keWarthog', 1], ['keWeaver', 2], ['keVulture', 1]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '15-3' }, secret: { to: '15-6', hint: 'Meerkats chatter from a burrow on a high rock that only a giraffe can reach...' } },
  areas: [
    { id: 'grove', gen: 'strip', W: 230, H: 18, GY: 14,
      script: [
        ['box', { item: 'power' }],
        ['tip', { text: 'GIRAFFE GROVE! TAKE SOME ACACIA LEAVES. ON A GIRAFFE\'S HEAD, HOLD UP AND IT STRETCHES FOR THEM' }],
        ['leaves', {}],
        ['plain', { n: 4 }],
        // ① a living lift up the cliff
        ['giraffe', { n: 9, at: 3, path: [[3, 0], [3, -6]], rise: 6, gold: [3, -9, 'must'] }],
        ['plain', { n: 5 }],
        ['enemies', { kind: 'keBeetle', n: 1, len: 8 }],
        // the high kopje: a second giraffe reaches it; the meerkats' burrow (the hidden exit) is up there
        ['giraffe', { n: 7, at: 2, path: [[3, 0], [3, -4]] }],
        ['ledge', { h: 5, w: 6, n: 8, burrow: { to: 'manor@in', back: 'manorBack' } }],
        ['plain', { n: 4 }],
        ['step', { h: -6 }],
        'cp',
        ['leaves', {}],
        // ② living bridges over the gaps; weaver birds drop twigs on the rider
        ['giraffe', { n: 20, at: 2, pit: [5, 15], path: [[2, 0], [4, -4], [13, -4], [15, 0]], fly: 'keWeaver', flyDx: 8, flyDy: 9, coins: [[5, 11, -7]] }],
        ['enemies', { kind: 'keWarthog', n: 1, len: 12 }],
        ['box', { item: 'power' }],
        ['giraffe', { n: 22, at: 2, pit: [5, 18], path: [[2, 0], [2, -5], [9, -7], [18, -3], [18, 0]], fly: 'keWeaver', flyDx: 12, flyDy: 10, gold: [9, -10, 'risky'] }],
        'cp',
        ['leaves', {}],
        // ③ the hand-over: one giraffe's reach ends over the gap; the next one bends its head to meet it
        ['giraffe', { n: 12, at: 2, pit: [5, 11], path: [[2, 0], [2, -4], [10, -4]], fly: 'keVulture', flyDx: 9, flyDy: 9 }],
        ['giraffe', { n: 14, at: 7, pit: [0, 4], path: [[-4, -4], [2, -6], [6, 0]] }],
        ['plain', { n: 4 }],
        ['enemies', { kind: 'keWarthog', n: 1, len: 10 }],
        ['end', { exit: 'main' }]
      ] },
    { id: 'manor', gen: 'room', role: 'secret', theme: 'ke_den', stamp: 'keManorDoor' }
  ] };

/* ---------------- 15-3 Flamingo Lake ---------------- */
// a hollow under the shore where the flamingos keep their mud nests (a hidden postcard, a hidden 1UP)
stamps.keNests = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#...................*........#',
    '#.................-----......#',
    '#............................#',
    '#..........-----.............#',
    '#.h..........................#',
    '#....-----...................#',
    '#............................#',
    '#.........-----..............#',
    '#............................#',
    '#.@...D.....n......n.....n...#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'lake@nestsBack', look: 'keMoundDoor' }],
  legend: { n: ['decor', 'keMudNest'] }
};
const L3 = { n: 3, name: 'Flamingo Lake', mapLabel: 'Flamingos', arch: 'flock', theme: 'ke_lake',
  gimmick: 'The flamingos standing in the soda lake are the stepping stones, but each one panics a moment after you land and flies off. Skeins of flamingos ferry you over the wide water',
  hint: 'Land and hop on at once: a flamingo squawks, then flies. Some land back on another spot. Startle one and its neighbours go too!',
  postcard: 'The lake is PINK, Brady. The flamingos are pink. I am wearing pink. Nobody can find me. ♥ C',
  enemies: [['keBeetle', 1], ['keVulture', 2], ['keWeaver', 1]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '15-4' } },
  areas: [
    { id: 'lake', gen: 'strip', W: 240, H: 18, GY: 14,
      script: [
        ['box', { item: 'power' }],
        ['tip', { text: 'FLAMINGO LAKE! THE FLAMINGOS ARE STEPPING STONES, BUT THEY PANIC A MOMENT AFTER YOU LAND: KEEP HOPPING. THE SODA LAKE IS DEEP' }],
        ['plain', { n: 4 }],
        // ① two calm flamingos, then a skein that ferries you
        ['lake', { w: 12, posts: [[3], [8]], gold: [8, 7, 'must'] }],
        ['plain', { n: 4 }],
        ['flock', { w: 16, ax: 10, speed: 1.3, y: 2 }],
        ['enemies', { kind: 'keBeetle', n: 1, len: 8 }],
        'cp',
        // ② a longer crossing; one flamingo hops between two spots; a fish-eagle overhead
        ['lake', { w: 22, posts: [[3], [8, { alt: 2 }], [14], [19]], fly: 'keVulture' }],
        ['moundDoor', { to: 'nests@in', back: 'nestsBack' }],
        ['flock', { w: 20, ax: 14, ay: -3, speed: 1.2, y: 2, gold: 'high' }],
        ['box', { item: 'power' }],
        'cp',
        // ③ the panic chain: startle the first and the whole line takes off behind you
        ['lake', { w: 26, posts: [[3, { chain: true }], [7, { chain: true }], [11, { chain: true }], [15, { chain: true }], [19, { chain: true }], [23]], gold: [13, 7, 'risky'], fly: 'keVulture' }],
        ['plain', { n: 4 }],
        ['enemies', { kind: 'keWeaver', n: 1, len: 8 }],
        // the nervous ones (half a second) and a skein to finish
        ['lake', { w: 18, posts: [[3, { calm: 0.5 }], [9, { alt: -2, calm: 0.5 }], [14, { calm: 0.5 }]] }],
        ['flock', { w: 18, ax: 12, ay: -2, speed: 1.5, y: 2 }],
        ['end', { exit: 'main' }]
      ] },
    { id: 'nests', gen: 'room', role: 'secret', theme: 'ke_den', stamp: 'keNests' }
  ] };

Tour.amend('ke', { stamps, levels: [L1, L2, L3] });

/* ---------------- the land's map: the savannah under a big sky ---------------- */
// the route: the airstrip by the great mountain, down the migration river, through the acacia grove (a meerkat
// burrow off it), round the pink lake, over the sun-baked plain, to the waterhole; the port is a hot-air balloon
// launch past the waterhole
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.ke = {
  labels: { '15-1': 'Migration', '15-2': 'Giraffe Grove', '15-3': 'Flamingo Lake', '15-4': 'High Noon', '15-5': 'Waterhole', '15-6': 'Meerkat Manor' },
  w: 1360, h: 980,
  pal: { sea: '#4a9ad0', deep: '#2a5a8a', land: '#d8b058', light: '#f0d080', path: '#fff0c8', beach: '#e8c890', cliff: '#a8582a' },
  coast: 'rock', trail: 'prints', tufts: 'sand', meadow: '#e0c068',
  land: [[[70, 120], [380, 60], [800, 70], [1180, 110], [1300, 300], [1280, 560], [1300, 800], [1150, 920], [800, 940], [420, 920], [120, 860], [60, 600], [80, 340]]],
  nodes: { start: [200, 200], '15-1': [420, 230, 'n'], '15-2': [700, 260, 'n'], '15-6': [900, 170, 'n'], '15-3': [980, 470, 'e'], '15-4': [640, 620, 's'], '15-5': [330, 720, 's'], port: [190, 800, 'n'] },
  paths: { 'start>15-1': [[300, 230]], '15-1>15-2': [[560, 280]], '15-2>15-6': [[800, 190]], '15-6>15-3': [[1000, 300]], '15-2>15-3': [[860, 360]], '15-3>15-4': [[820, 580]], '15-4>15-5': [[480, 700]], '15-5>port': [[250, 780]] },
  feat: [
    ['river', [[300, 60], [360, 200], [500, 330], [480, 520], [380, 640], [300, 900]], 18],
    ['lake', [[900, 430], [1010, 400], [1120, 440], [1120, 530], [1010, 570], [910, 540]]],
    ['lake', [[280, 690], [350, 670], [400, 710], [370, 760], [290, 760]]],
    ['patch', '#e8c060', [[560, 540], [800, 520], [860, 700], [640, 760], [540, 680]]],
    ['trees', 'acacia', 700, 300, 120, 10], ['trees', 'acacia', 1150, 700, 120, 6], ['trees', 'acacia', 200, 450, 100, 5], ['trees', 'acacia', 640, 620, 140, 3],
    ['sprite', 'giraffe', 760, 330, 20], ['sprite', 'giraffe', 640, 210, 17], ['sprite', 'giraffe', 820, 280, 15],
    ['sprite', 'termite', 520, 180, 14], ['sprite', 'termite', 950, 200, 12], ['sprite', 'termite', 720, 700, 13], ['sprite', 'termite', 1100, 300, 12],
    ['landmark', 160, 120, 52]
  ],
  flora: ['acacia', 'bush', 'acacia'], density: 40,
  live: [['walk', 'buffalo', [[380, 380], [520, 420], [600, 450]], 10], ['walk', 'buffalo', [[420, 400], [560, 440]], 9], ['circle', 600, 600, 70, 1.0], ['circle', 980, 380, 50, 0.8]]
};
})();
