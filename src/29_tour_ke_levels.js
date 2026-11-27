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
  doors: [{ to: 'plain@denOut', look: 'keBurrow' }],
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
        ['herdOn', { n: 10, every: 0.85 }],
        ['river', { w: 11 }],
        ['plain', { n: 4 }],
        ['thicket', { h: 6, w: 2 }],
        ['herdOff', { n: 4 }],
        ['enemies', { kind: 'keBeetle', n: 2, len: 12 }],
        ['postcard', { kind: 'must', dx: -6, dy: -4 }],
        'cp',
        // ② test: crocs in the rivers, a vulture over the water, a thicket between two rivers
        ['herdOn', { n: 8, every: 1.0 }],
        ['river', { w: 13, crocs: 1, gold: 'risky', goldDy: 5 }],
        ['plain', { n: 3 }],
        ['thicket', { h: 7, w: 3, canopy: { len: 26, to: 'den@in', fly: 'keWeaver', gaps: [[12, 2]] } }],
        'cp',
        ['river', { w: 16, crocs: 2, fly: 'keVulture' }],
        ['herdOff', { n: 4 }],
        ['enemies', { kind: 'keWarthog', n: 1, len: 12 }],
        ['box', { item: 'power' }],
        ['anchor', { name: 'denOut' }],
        'cp',
        // ③ twist: the gorge leap straight into the long river, a thicket on the far bank, one more river
        ['herdOn', { n: 8, every: 0.95 }],
        ['gorge', { w: 10, h: 3 }],
        ['river', { w: 20, crocs: 3, fly: 'keVulture' }],
        'cp',
        ['thicket', { h: 6, w: 2 }],
        ['river', { w: 12, crocs: 1, gold: 'high', goldDy: 6 }],
        ['herdOff', { n: 6 }],
        ['enemies', { kind: 'keWarthog', n: 1, len: 10 }],
        ['end', { exit: 'main' }]
      ] },
    { id: 'den', gen: 'room', role: 'secret', theme: 'ke_weave', stamp: 'keDen', room: 'keSimon', keSimon: { title: 'THE WEAVERS\' SONG' } }
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
        ['giraffe', { n: 9, at: 3, path: [[3, 0], [3, -6], [0, -12]], rise: 6, gold: [3, -9, 'must'],
          secret: { dx: -7, w: 6, row: 12, burrow: { to: 'manor@in', back: 'manorBack' }, trail: [[2, -10], [1, -12]] } }],
        ['plain', { n: 5 }],
        ['enemies', { kind: 'keBeetle', n: 1, len: 8 }],
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
    { id: 'manor', gen: 'room', role: 'secret', theme: 'ke_den', stamp: 'keManorDoor', room: 'doors',
      doors: { title: 'THE MEERKAT BURROWS', rule: 'WHICH BURROW GOES WHERE? THE MEERKATS HID A PRIZE DOWN ONE OF THEM', look: 'keBurrow', joke: 'A MEERKAT\'S BEDROOM. VERY TIDY. NOTHING HERE.' } }
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
  doors: [{ to: 'lake@nestsOut', look: 'keReedGap' }],
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
        ['flock', { w: 20, ax: 14, ay: -6, speed: 1.2, y: 2, gold: 'high', secret: { to: 'nests@in', ledge: [17, 5], up: 3 } }],
        ['anchor', { name: 'nestsOut' }],
        ['box', { item: 'power' }],
        'cp',
        // ③ the panic chain: startle the first and the whole line takes off behind you
        ['lake', { w: 26, posts: [[3, { chain: true }], [7, { chain: true }], [11, { chain: true }], [15, { chain: true }], [19, { chain: true }], [23]], gold: [13, 7, 'risky'], fly: 'keVulture' }],
        ['plain', { n: 4 }],
        ['enemies', { kind: 'keWeaver', n: 1, len: 8 }],
        'cp',
        // the nervous ones (half a second) and a skein to finish
        ['lake', { w: 18, posts: [[3, { calm: 0.5 }], [9, { alt: -2, calm: 0.5 }], [14, { calm: 0.5 }]] }],
        ['flock', { w: 18, ax: 12, ay: -2, speed: 1.5, y: 2 }],
        ['end', { exit: 'main' }]
      ] },
    { id: 'nests', gen: 'room', role: 'secret', theme: 'ke_reeds', stamp: 'keNests', room: 'rush',
      rush: { title: 'FEATHER DASH', rule: 'GRAB THE SIX FLAMINGO FEATHERS BEFORE THE CLOCK RUNS OUT', look: 'tokFeather', n: 6 } }
  ] };

/* ---------------- 15-4 High Noon ---------------- */
// a cool hollow under a kopje with a spring in it (a hidden postcard, a hidden 1UP); no sun down here
stamps.keSpring = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#..*.........................#',
    '#.----.......................#',
    '#.......-----................#',
    '#............................#',
    '#.............-----..........#',
    '#..................h.........#',
    '#....................-----...#',
    '#............................#',
    '#............................#',
    '#.@...D......WWWWWW..........#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'plain@springOut', look: 'keBurrow' }]
};
const L4 = { n: 4, name: 'High Noon', mapLabel: 'High Noon', arch: 'shade', theme: 'ke_noon',
  gimmick: 'The sun is the hazard: a heat gauge fills out in the open and empties in the shade. Hop from acacia to rock, drift with the clouds\' shadows, walk in the elephant\'s shade',
  hint: 'Watch the gauge at the top. Shade is under trees and rocks, under a cloud, beside the elephant. Her trunk shower cools you right down',
  postcard: 'It is SO hot, Brady. The elephant let me stand in her shadow. She is very polite. ♥ C',
  enemies: [['keBeetle', 2], ['keWarthog', 2], ['keVulture', 1]],
  mapCell: [2, 1], mapFrom: 2,
  exits: { main: { to: '15-5' } },
  areas: [
    { id: 'plain', gen: 'strip', W: 260, H: 18, GY: 14,
      script: [
        ['sun', {}],
        ['box', { item: 'power' }],
        ['tip', { text: 'HIGH NOON! THE GAUGE UP TOP FILLS IN THE SUN AND EMPTIES IN THE SHADE. A FULL GAUGE AND YOU WILT' }],
        // ① tree to tree, rock to puddle
        ['shadeTree', { w: 6 }],
        ['open', { n: 14 }],
        ['shadeTree', { w: 6, gold: 'must' }],
        ['open', { n: 18 }],
        ['overhang', { w: 6, h: 3 }],
        ['enemies', { kind: 'keBeetle', n: 1, len: 10 }],
        ['puddle', { w: 3 }],
        'cp',
        // ② a long open stretch: two clouds drift over it, their shadows sliding along the ground
        ['shadeTree', { w: 5 }],
        ['cloud', { dx: 4, w: 7, ax: 34, speed: 0.045, sky: 3 }],
        ['cloud', { dx: 22, w: 6, ax: 24, speed: 0.06, sky: 2, phase: 2.4 }],
        ['open', { n: 22 }],
        ['enemies', { kind: 'keWarthog', n: 1, len: 12 }],
        ['open', { n: 12 }],
        ['box', { item: 'power' }],
        'cp',
        // ③ the elephant: sixty tiles of open plain; walk in her shade and keep up
        ['shadeTree', { w: 6 }],
        ['elephant', { dx: 2, ax: 56, speed: 2.4 }],
        ['open', { n: 20 }],
        ['enemies', { kind: 'keBeetle', n: 1, len: 10 }],
        ['open', { n: 14 }],
        ['enemies', { kind: 'keWarthog', n: 1, len: 12 }],
        ['puddle', { w: 3 }],
        'cp',
        // ④ gullies in the sun, a cloud over them, the elephant once more to the finish
        ['shadeTree', { w: 5 }],
        ['cloud', { dx: 2, w: 7, ax: 26, speed: 0.05, sky: 3 }],
        ['gully', { n: 3 }],
        ['open', { n: 6 }],
        ['gully', { n: 4, seam: 'cool@in' }],
        ['postcard', { kind: 'risky', dx: -3, dy: -6 }],
        ['anchor', { name: 'springOut' }],
        ['open', { n: 6 }],
        ['gully', { n: 3 }],
        'cp',
        ['overhang', { w: 5, h: 3 }],
        ['elephant', { dx: 2, ax: 30, speed: 2.8 }],
        ['open', { n: 24 }],
        ['enemies', { kind: 'keVulture', n: 1, len: 8 }],
        ['end', { exit: 'main' }]
      ] },
    { id: 'cool', gen: 'room', role: 'secret', theme: 'ke_kopje', stamp: 'keSpring', room: 'keGolf', keGolf: { title: 'DUNG BALL GOLF' } }
  ] };

/* ---------------- 15-5 Big Kiboko (the boss) ---------------- */
// the evening walk down to the waterhole: hippos' backs across the channels, a croc, then the reed curtain
stamps.keHollow = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#............................#',
    '#...............o.o.o........#',
    '#..............-------.......#',
    '#............................#',
    '#.........-----..............#',
    '#............................#',
    '#....-----............h......#',
    '#............................#',
    '#............................#',
    '#.@...D......t..........t....#',
    '##############################',
    '##############################'],
  hidden: ['oneup'],
  doors: [{ to: 'shore@hollowBack', look: 'keMoundDoor' }],
  legend: { t: ['decor', 'kePebbles'] }
};
const L5 = { n: 5, name: 'Big Kiboko', mapLabel: 'Waterhole', arch: 'lair', theme: 'ke_hole', boss: 'ke_kiboko',
  gimmick: 'The act nobody cancelled: Big Kiboko, the hippo who does water ballet, in the waterhole at sunset',
  hint: 'When she leaps out of the pool, her shadow shows where she lands. After the landing she takes a bow: stomp her head!',
  postcard: 'The snow cap is back on the mountain! Big Kiboko signed my programme. With her foot. It\'s very big. ♥ C',
  enemies: [['keWarthog', 1], ['keVulture', 1]],
  mapCell: [1, 2], mapFrom: 3,
  exits: { main: { to: 'country:next' } },
  areas: [
    { id: 'shore', gen: 'strip', W: 110, H: 18, GY: 14,
      script: [
        ['box', { item: 'power' }],
        ['tip', { text: 'THE WATERHOLE AT SUNSET. BIG KIBOKO\'S SHOW IS ON TONIGHT. THE HIPPOS WILL LET YOU CROSS ON THEIR BACKS' }],
        ['plain', { n: 6 }],
        ['hippos', { w: 12, n: 1, gold: 'must', goldDy: 4 }],
        ['enemies', { kind: 'keWarthog', n: 1, len: 10 }],
        ['hippos', { w: 18, n: 2, crocs: true }],
        ['box', { item: 'power' }],
        ['moundDoor', { to: 'hollow@in', back: 'hollowBack' }],
        ['acacia', { h: 4, w: 6, gold: 'high' }],
        ['hippos', { w: 14, n: 1, gold: 'risky', goldDy: 6 }],
        ['plain', { n: 4 }],
        ['door', { to: 'arena@in', perch: 0, look: 'keReedCurtain' }]
      ] },
    { id: 'hollow', gen: 'room', role: 'secret', theme: 'ke_mound', stamp: 'keHollow', room: 'shell',
      shell: { title: 'THREE OSTRICH EGGS', rule: 'WATCH THE PRIZE GO UNDER AN EGG, WATCH THE SHUFFLE, THEN STOMP THE RIGHT EGG', cup: 'egg', dealer: 'secretary', joke: ['boot', 'fish'] } },
    { id: 'arena', gen: 'arena', role: 'arena', layout: 'pool', arenaW: 32, H: 18, roof: false, theme: 'ke_stage' }
  ] };

/* ---------------- 15-6 Meerkat Manor (secret) ---------------- */
// the nursery chamber: meerkat pups asleep in a heap (decor), a hidden postcard, a hidden 1UP
stamps.keNursery = {
  floor: 12,
  rows: [
    '##############################',
    '#............................#',
    '#........................*...#',
    '#......................----..#',
    '#............................#',
    '#.................-----......#',
    '#..h.........................#',
    '#..........-----.............#',
    '#............................#',
    '#....-----...................#',
    '#............................#',
    '#.@...D.......p.......p......#',
    '##############################',
    '##############################'],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'manor@nurseryOut', look: 'keBurrow' }],
  legend: { p: ['decor', 'kePups'] }
};
const L6 = { n: 6, name: 'Meerkat Manor', mapLabel: 'Meerkats', arch: 'burrow', secret: true, theme: 'ke_warren',
  gimmick: 'A meerkat warren: sentries whistle when they see you above ground and an eagle stoops on the spot. Drop down the burrows and run the tunnels; climb out where rocks block the way',
  hint: 'When a sentry whistles, a shadow marks the spot: get out of it, or get underground. Drop down a burrow and climb the root ledges back out',
  postcard: 'The meerkats took turns standing guard over me. I have never felt so safe. Or so watched. ♥ C',
  enemies: [['keBeetle', 2], ['keWarthog', 2]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: 'node:15-3' } },
  areas: [
    { id: 'manor', gen: 'strip', W: 230, H: 20, GY: 8,
      script: [
        ['box', { item: 'power' }],
        ['tip', { text: 'MEERKAT MANOR! SENTRIES WHISTLE WHEN THEY SEE YOU UP TOP, AND THE EAGLE COMES. DROP DOWN A BURROW AND RUN THE TUNNELS' }],
        ['plain', { n: 4 }],
        // ① one sentry; a burrow to duck into, a way out again
        ['warren', { n: 26, mouths: [4, 18], sentries: [12], gold: [[11, 'tunnel', 'must']], enemies: [['keBeetle', 10]] }],
        ['plain', { n: 3 }],
        // ② thorns close the top: go under; a rock plug closes the tunnel: come up between the sentries
        ['warren', { n: 34, mouths: [2, 14, 27], thorns: [[8, 2, 6]], rocks: [[20, 2]], sentries: [17, 24], enemies: [['keWarthog', 6]], box: [21, 'top', 'power'] }],
        'cp',
        // ③ the long run: thorns and rocks alternate; three sentries watch the gaps
        ['warren', { n: 48, mouths: [2, 12, 24, 36], thorns: [[7, 2, 6], [30, 2, 7]], rocks: [[17, 2], [41, 2]], walkIn: [41, 'nursery@in'], sentries: [14, 22, 40], enemies: [['keBeetle', 8], ['keWarthog', 28]], gold: [[20, 'top', 'risky']] }],
        ['anchor', { name: 'nurseryOut' }],
        'cp',
        ['warren', { n: 30, mouths: [2, 16], thorns: [[9, 3, 6]], rocks: [[22, 2]], sentries: [20, 26], enemies: [['keWarthog', 12]] }],
        ['plain', { n: 4 }],
        ['end', { exit: 'main' }]
      ] },
    { id: 'nursery', gen: 'room', role: 'secret', theme: 'ke_sand', stamp: 'keNursery', room: 'whack',
      whack: { title: 'BOP-A-MEERKAT', rule: 'BOP THE MEERKAT PUPS AS THEY POP UP. THEY THINK IT\'S A GAME', critter: 'meerkat', need: 8 } }
  ] };

Tour.amend('ke', { stamps, levels: [L1, L2, L3, L4, L5, L6] });

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
