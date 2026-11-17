/* ============================================================
   FESTIVAL FIELDS: the levels (world 23) and the land's map. Bonus levels (arch 'bonus': exempt from the
   archetype caps). Every one is a non-linear place to work out, not a run to the right.
   23-1 CAMPSITE SCRAMBLE: the campsite as a maze of six fields. Piwi has padlocked the main stage with three
        padlocks; their three tent pegs are lost round the campsite (on a tent roof up a guy-rope, on the highest
        hammock of the chill-out field, over the airbed pond). Any order. Off the left edge of the gate field, past the
        stirring curtain: the main stage's wings, with a Wormhole back to Mexico.
   23-2 THE MUD BATH: see below.
   ============================================================ */
(function () {
const C = Tour.countries.fest;
if (!C) return;

/* ---------------- 23-1 Campsite Scramble ---------------- */
const CAMP = {
  m: ['enemy', 'festBin'], n: ['enemy', 'festDuck'], p: ['enemy', 'festBalloon'],
  t: ['decor', 'festTent'], f: ['decor', 'festFlag'], x: ['decor', 'festBales'], l: ['decor', 'festLlama'], z: ['decor', 'festLoo'], j: ['decor', 'festCooler'],
  A: ['piece', 'bouncy', { w: 3, look: 'airbed' }], Z: ['piece', 'bouncy', { w: 3, look: 'tramp' }],
  1: ['spawn', 'key', { id: 'peg:red', look: 'festPegRed' }], 2: ['spawn', 'key', { id: 'peg:blue', look: 'festPegBlue' }], 3: ['spawn', 'key', { id: 'peg:gold', look: 'festPegGold' }],
  4: ['piece', 'pegLock', { id: 'peg:red', h: 3, col: '#e84a4a', icon: 'festPegRed', peek: 'festPegRed' }],
  5: ['piece', 'pegLock', { id: 'peg:blue', h: 3, col: '#3a8ae0', icon: 'festPegBlue', peek: 'festPegBlue' }],
  6: ['piece', 'pegLock', { id: 'peg:gold', h: 3, col: '#ffc83a', icon: 'festPegGold', peek: 'festPegGold' }]
};
const cell = (rows, extra) => { const e = Object.assign({}, extra || {}), legend = Object.assign({}, CAMP, e.legend || {}); delete e.legend; return Object.assign({ floor: 12, rows, legend }, e); };
const camp = {
  // the gate field (the start): the signpost, a mushroom, P1 up the pallet steps; the curtain stirring at the left edge
  gate: cell([
    '############################',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#..............*...........#',
    '#..........................#',
    '#...........-------........#',
    '#......o.o.o...............#',
    '#....................?.....#',
    'e....-----..................',
    'e...........................',
    'e.q.@.k.u.f.............t...',
    '############################',
    '############################'
  ], { items: ['power'], gold: { '*': 'must' }, legend: { e: ['seam', 'left', 'wings@in'], q: ['anchor', 'wingsBack'], k: ['spawn', 'bkMouse', { dir: -1 }], u: ['spawn', 'sign', { text: 'PIWI PADLOCKED THE MAIN STAGE! FIND THE THREE LOST TENT PEGS' }] } }),
  // guy-rope alley: the red peg on the big tent's roof (the guy-rope under it is a spring: hold jump); a tent flap
  // down to the lost-property yard
  ropes: cell([
    '############################',
    '#..........................#',
    '#........1.................#',
    '#......-----...............#',
    '#..........................#',
    '#..o.o.o...........o.o.o...#',
    '#..........................#',
    '#..................----....#',
    '#..........................#',
    '............................',
    '............................',
    '.....t..s...t...m.......f...',
    '############################',
    '############################'
  ]),
  // the main stage: three padlocked barriers in the crowd lane, then the stage and the arena gate
  stage: cell([
    '############################',
    '#############..............#',
    '#############..............#',
    '#############.....o.o.o....#',
    '#############..............#',
    '#############....------....#',
    '#############..............#',
    '#############..............#',
    '#############..............#',
    '...........................#',
    '...........................#',
    '....4..5..6...l..l....G....#',
    '############################',
    '############################'
  ]),
  // the chill-out field: hammocks (bouncy) up to the gold peg on the high platform
  chill: cell([
    '############################',
    '#..........................#',
    '#...3......................#',
    '#..-----...................#',
    '#..........................#',
    '#..........o.o.o...........#',
    '#.........-------..........#',
    '#..........................#',
    '#..........................#',
    '#...........................',
    '#...........................',
    '#..t.......n......x..l......',
    '#####Z######################',
    '############################'
  ]),
  // the lost-property yard: piles of suitcases (straw bales), P2 behind a fake wall up in the top corner
  lost: cell([
    '############################',
    '#.....................F....#',
    '#.....................F.*..#',
    '#.....................F....#',
    '#................----#######',
    '#..........................#',
    '#...........----...........#',
    '#..........................#',
    '#.......?..................#',
    '.......BB...................',
    '.......BB...................',
    '...i...BB...m.....j.....z...',
    '############################',
    '############################'
  ], { items: ['power'], gold: { '*': 'hidden' }, legend: { i: ['anchor', 'lpIn'] } }),
  // the airbed pond: airbeds float on the mud (bounce off them, hold jump) up to the blue peg
  pond: cell([
    '############################',
    '#..........................#',
    '#...............2..........#',
    '#.............-----........#',
    '#..........................#',
    '#....p.....................#',
    '#..........................#',
    '#..........................#',
    '#.........o.o.o............#',
    '...........................#',
    '.....A.......A.............#',
    '....WWWWWWWWWWWWWWWWWW.....#',
    '############################',
    '############################'
  ])
};
// the main stage's wings (backstage): the Wormhole back to Mexico, a ghost light, a ladder of catwalks to P3
const stamps = {
  festWings: {
    floor: 12,
    rows: [
      'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
      'H......................................H',
      'H.............*........................H',
      'H...........-----......................H',
      'H......................................H',
      'H......................................H',
      'H...................-----..............H',
      'H......................................H',
      'H...h..................................H',
      'H.........................----.........e',
      'H......................................e',
      'H..k..w....r....x...m.....q...a...@....e',
      '########################################',
      '########################################'
    ],
    gold: { '*': 'high' }, hidden: ['oneup'],
    legend: { e: ['seam', 'right', 'campsite@wingsBack'], k: ['decor', 'bkGhostLight'], w: ['spawn', 'warp', { exit: 'warp' }], r: ['decor', 'bkRack'], x: ['decor', 'bkCase'], m: ['spawn', 'bkMouse', {}], q: ['decor', 'bkFlatBack'], a: ['decor', 'bkCrewSign'] }
  }
};
const L1 = { n: 1, name: 'Campsite Scramble', mapLabel: 'Campsite', arch: 'bonus', theme: 'fest_field',
  gimmick: 'A maze of six fields: find the three lost tent pegs (any order) to open Piwi\'s padlocks on the main stage',
  hint: 'Hold jump on a guy-rope or an airbed to fly high. The tent flap leads down to the lost-property yard',
  postcard: 'A whole festival! The llamas have the best spot by the stage. ♥ C',
  enemies: [['festBin', 2], ['festDuck', 2], ['festBalloon', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: {
    main: { to: '23-2' },
    warp: { to: '1-4', via: 'warp', label: 'MEXICO', hint: 'A curtain stirs at the very left of the gate field...' }
  },
  areas: [
    { id: 'campsite', gen: 'maze', cells: [3, 2], cell: [28, 14],
      script: [[camp.gate, camp.ropes, camp.stage], [camp.chill, camp.lost, camp.pond]],
      links: [{ from: [1, 0], to: [1, 1], at: [22, 11], toAt: [4, 11], look: 'festFlap' }] },
    { id: 'wings', gen: 'room', role: 'backstage', zone: 'wings', theme: 'bk_wings', stamp: 'festWings' }
  ] };

/* ---------------- 23-2 The Mud Bath ---------------- */
// The lower field is a mud bath and it rains in squalls: every 16 s the mud rises to the top of the pools, holds,
// and drains again. Up top the boardwalk is broken: down into the wallow, then wait for the squall and swim up
// through the gaps that only the high mud reaches. P3 waits in the wellies pool (high mud only); a drain in the
// duck pond swirls: dive down it at any mud level and come out under the main stage (the backstage), where P2 is.
const MUD = {
  n: ['enemy', 'festDuck'], p: ['enemy', 'festBalloon'], t: ['decor', 'festTent'], f: ['decor', 'festFlag'], x: ['decor', 'festBales'],
  w: ['decor', 'festWellies'], z: ['decor', 'festLoo'], q: ['gear', 'fins'],
  u: ['spawn', 'sign', { text: 'THE MUD RISES IN EVERY SQUALL: SWIM UP WITH IT. WHEN IT DRAINS, WALK THE BOTTOM' }]
};
const mcell = (rows, extra) => { const e = Object.assign({}, extra || {}), legend = Object.assign({}, MUD, e.legend || {}); delete e.legend; return Object.assign({ floor: 12, rows, legend }, e); };
const mud = {
  // the boardwalk gate (the start): the wellies (flipper fins) on their stand, the broken boardwalk, the drop
  start: mcell([
    '############################',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#......o.o.o...............#',
    '#..........................#',
    '#.....-------..............#',
    '#..........................#',
    '#...?......................#',
    '#..........................#',
    '#..........................#',
    '#.@.u..q.......n.....w.....#',
    '############################',
    '############################'
  ], { items: ['power'] }),
  // the shower block: P1 over the shower stalls; the tent flap down to the duck pond
  showers: mcell([
    '############################',
    '#..........................#',
    '#..........................#',
    '#..........*...............#',
    '#..........................#',
    '#..........................#',
    '#........-----.............#',
    '#..........................#',
    '#.................?........#',
    '#..-----....................',
    '#...........................',
    '#..........t.....n......z...',
    '############################',
    '############################'
  ], { items: ['sig'], gold: { '*': 'must' } }),
  // the wash-up tent and the way out
  exit: mcell([
    '############################',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#...............o.o.o......#',
    '#..........................#',
    '#..............-------.....#',
    '#..........................#',
    '#..........................#',
    '...........................#',
    '...........................#',
    '.......t.......x.....G.....#',
    '############################',
    '############################'
  ]),
  // the wallow (in by the drop from the boardwalk): flip-flop stepping stones, a gap high in the right wall
  wallow: mcell([
    '############################',
    '#..........................#',
    '#..o.o.o.o.o...............#',
    '#...........................',
    '#...........................',
    '#..........................#',
    '#..........................#',
    '#.......----......----.....#',
    '#..........................#',
    '#..........................#',
    '#..----.........----.......#',
    '#.......w..........n.......#',
    '############################',
    '############################'
  ]),
  // the duck pond: gaps high in both walls, the drain swirling in the bottom (the way under the stage), the
  // tent flap up to the showers
  pond: mcell([
    '############################',
    '#..........................#',
    '............................',
    '............................',
    '............................',
    '#..........................#',
    '#.....o.o.o.....o.o.o......#',
    '#..........................#',
    '#...----..........----.....#',
    '#..........................#',
    '#..........................#',
    '#..........r...k...........#',
    '#############ddd############',
    '#############ddd############'
  ], { legend: { d: ['seam', 'bottom', 'under@in', { tell: 'drain' }], r: ['decor', 'festDrain'], k: ['anchor', 'underBack'] } }),
  // the wellies pool: P3 right under the ceiling (high mud only), a hidden 1UP
  wellies: mcell([
    '############################',
    '#...*......................#',
    '...........................#',
    '...........................#',
    '...........................#',
    '#..........................#',
    '#..........h...............#',
    '#..........................#',
    '#..........................#',
    '#.....--------.............#',
    '#..........................#',
    '#.......n..........w.......#',
    '############################',
    '############################'
  ], { hidden: ['oneup'], gold: { '*': 'high' } })
};
stamps.festUnder = {
  floor: 12,
  rows: [
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    'H..........*...................H',
    'H..............................H',
    'H........-----.................H',
    'H..............................H',
    'H..............................H',
    'H.............-----............H',
    'H.....h........................H',
    'H..............................H',
    'H...................------.....H',
    'H..............................H',
    'H...@.a..k...x.....m......D....H',
    '################################',
    '################################'
  ],
  gold: { '*': 'hidden' }, hidden: ['oneup'],
  doors: [{ to: 'mud@underBack', look: 'tourDoor' }],
  legend: { a: ['decor', 'bkMatTag'], k: ['decor', 'bkGhostLight'], x: ['decor', 'bkCase'], m: ['spawn', 'bkMouse', {}] }
};
const L2 = { n: 2, name: 'The Mud Bath', mapLabel: 'Mud Bath', arch: 'bonus', theme: 'fest_mud',
  gimmick: 'A maze of mud pools that rise in every rain squall and drain again: swim up through the gaps only the high mud reaches',
  hint: 'Wait for the squall: the mud lifts you to the gaps high in the walls. The drain in the duck pond goes somewhere...',
  postcard: 'Mud everywhere. I mean EVERYWHERE. The ducks love it. ♥ C',
  enemies: [['festDuck', 3], ['festBalloon', 1]],
  mapCell: [1, 0], mapFrom: 0,
  areas: [
    { id: 'mud', gen: 'maze', cells: [3, 2], cell: [28, 14], tide: { low: 26, high: 15, period: 16, hold: 4 },
      script: [[mud.start, mud.showers, mud.exit], [mud.wallow, mud.pond, mud.wellies]],
      links: [{ kind: 'drop', from: [0, 0], to: [0, 1], at: [18, 0] }, { from: [1, 0], to: [1, 1], at: [5, 11], toAt: [3, 11], look: 'festFlap' }] },
    { id: 'under', gen: 'room', role: 'backstage', zone: 'under', theme: 'bk_under', stamp: 'festUnder' }
  ] };

/* ---------------- 23-3 The Silent Disco ---------------- */
// Night. Piwi switched the festival's music off; only Brady's glow lights the dark field and it fades (glow-stick
// lanterns relight it). The dance floors still pulse to a beat nobody can hear. Find the way to the DJ booth: the
// dance floor over the spikes leads down to the glow-stick grove; the chill tent hides P2 and a 1UP; the speaker
// stacks climb to the booth's back door.
const DISCO = {
  l: ['piece', 'lantern', { kind: 'relight' }], n: ['enemy', 'festDuck'], p: ['enemy', 'festBalloon'], a: ['decor', 'festLlama'], f: ['decor', 'festFlag'],
  1: ['piece', 'beatFloor', { w: 4, grp: 0 }], 2: ['piece', 'beatFloor', { w: 4, grp: 1 }],
  u: ['spawn', 'sign', { text: 'PIWI SWITCHED THE MUSIC OFF! FIND THE DJ BOOTH IN THE DARK. GLOW STICKS RELIGHT YOUR GLOW' }]
};
const dcell = (rows, extra) => { const e = Object.assign({}, extra || {}), legend = Object.assign({}, DISCO, e.legend || {}); delete e.legend; return Object.assign({ floor: 12, rows, legend }, e); };
const disco = {
  start: dcell([
    '############################',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#.....o.o.o................#',
    '#....-------.......?.......#',
    '#...........................',
    '#...........................',
    '#.@.l..u.........f..........',
    '############################',
    '############################'
  ], { items: ['power'] }),
  bridge: dcell([
    '############################',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#.............*............#',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '....1.....2.....1.....2....#',
    '...........................#',
    '.l..^^^^^^^^^^^^^^^^^^^^...#',
    '############################',
    '############################'
  ], { gold: { '*': 'must' } }),
  booth: dcell([
    '############################',
    '#..........................#',
    '#..........................#',
    '#.......o.o.o.o.o..........#',
    '#..........................#',
    '#......-----------.........#',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#..........a..a.a.....G....#',
    '############################',
    '############################'
  ]),
  chill: dcell([
    '############################',
    '#..*F......................#',
    '#...F......................#',
    '#...F......................#',
    '#####......................#',
    '#................h.........#',
    '#..........................#',
    '#....------................#',
    '#..........................#',
    '#.............-----.........',
    '#...........................',
    '#..l.........n..............',
    '############################',
    '############################'
  ], { hidden: ['oneup'], gold: { '*': 'hidden' } }),
  grove: dcell([
    '############################',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#.....o.o.o.......o.o.o....#',
    '#..........................#',
    '#....------.......------...#',
    '#..........................#',
    '#.............?............#',
    '............................',
    '............................',
    '........l......p...l........',
    '############################',
    '############################'
  ], { items: ['power'] }),
  stacks: dcell([
    '############################',
    '#..........................#',
    '#..................*.......#',
    '#..........................#',
    '#...............--------...#',
    '#..........................#',
    '#..........................#',
    '#.........1....BBB.........#',
    '#..............BBB.........#',
    '.....BBB.......BBB.........#',
    '.....BBB.......BBB.........#',
    '.....BBB...l...BBB.........#',
    '############################',
    '############################'
  ], { gold: { '*': 'high' } })
};
const L3 = { n: 3, name: 'The Silent Disco', mapLabel: 'Silent Disco', arch: 'bonus', theme: 'fest_night',
  gimmick: 'A dark festival field at night: your glow fades, glow sticks relight it, the dance floors pulse to a silent beat. Find the way to the DJ booth',
  hint: 'Touch a glow stick to relight your glow. The dance floor flickers to the beat: cross when it lights up',
  postcard: 'A silent disco! Everyone dances to music only they can hear. Mostly llamas. ♥ C',
  enemies: [['festDuck', 2], ['festBalloon', 1]],
  mapCell: [2, 0], mapFrom: 1,
  areas: [
    { id: 'disco', gen: 'maze', cells: [3, 2], cell: [28, 14], lamp: { r0: 190, r1: 80, decay: 22 }, bpm: 120,
      script: [[disco.start, disco.bridge, disco.booth], [disco.chill, disco.grove, disco.stacks]],
      links: [{ from: [1, 0], to: [1, 1], at: [25, 11], toAt: [4, 11], look: 'festFlap' }, { from: [2, 1], to: [2, 0], at: [22, 3], toAt: [4, 11], look: 'festFlap' }] }
  ] };

/* ---------------- 23-4 The Sound Limiter (the boss) ---------------- */
// A short walk past the stalls to the main stage, then Piwi's noise-complaint robot. Stomp its dial while it
// listens; jump the hush waves.
const L4 = { n: 4, name: 'The Sound Limiter', mapLabel: 'Main Stage', arch: 'lair', theme: 'fest_field', boss: 'fest_limiter',
  gimmick: 'Piwi\'s noise-complaint robot, a giant volume knob on legs, turns the festival down. Jump its hush waves; stomp its dial while it listens',
  hint: 'Stomps bounce off... except while it stops to LISTEN: its dial lights up. Stomp it then!',
  postcard: 'You turned the festival back UP. The llamas are crowd-surfing. ♥ C',
  enemies: [['festBin', 2], ['festDuck', 1]],
  mapCell: [2, 1], mapFrom: 2,
  areas: [
    { id: 'stalls', gen: 'strip', W: 64, H: 18, theme: 'fest_field',
      script: [
        ['itemBlock', { item: 'power' }],
        ['flat', { n: 6 }],
        ['enemies', { n: 1, kind: 'festBin' }],
        ['postcard', { kind: 'must', dy: -5 }],
        'gap',
        ['flat', { n: 4 }],
        ['enemies', { n: 1, kind: 'festDuck' }],
        ['itemBlock', { item: 'power' }],
        ['postcard', { kind: 'high', dy: -7, dx: -2 }],
        ['flat', { n: 4 }],
        ['postcard', { kind: 'risky', dy: -4 }],
        ['door', { to: 'stage@in', perch: 0, look: 'festFlap' }]
      ] },
    { id: 'stage', gen: 'arena', role: 'arena', layout: 'stage', arenaW: 24, H: 18 }
  ] };

Tour.amend('fest', { stamps, levels: [L1, L2, L3, L4] });

/* ---------------- the land's map: a festival site in a field ---------------- */
// the route: in at the car-park airstrip, round the campsite, along the mud, up to the stage (a loop of a walk
// round a field, the stage at the top)
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.fest = {
  labels: { '23-1': 'Campsite', '23-2': 'Mud Bath', '23-3': 'Silent Disco', '23-4': 'Main Stage' },
  w: 1400, h: 900,
  pal: { sea: '#5aa8c8', deep: '#2a6a8a', land: '#8ac860', light: '#b8e080', path: '#c8a070', beach: '#d8c890', cliff: '#6a8a4a', roof: '#ff5fa0', wall: '#fff4e0' },
  coast: 'rock', tufts: 'flowers', trail: 'planks', bridge: 'steps', flowerCols: ['#ff5fa0', '#ffd84a', '#3ac8d8'],
  land: [[[90, 600], [110, 380], [240, 200], [470, 110], [760, 90], [1040, 120], [1250, 230], [1330, 430], [1300, 640], [1180, 790], [900, 840], [600, 830], [330, 800], [150, 730]]],
  nodes: { start: [230, 690], '23-1': [330, 470, 'e'], '23-2': [690, 680], '23-3': [1060, 560, 'w'], '23-4': [760, 250, 'n'], port: [1130, 250] },
  paths: { 'start>23-1': [[240, 560]], '23-1>23-2': [[470, 640]], '23-2>23-3': [[900, 700]], '23-3>23-4': [[960, 360]], '23-4>port': [[960, 220]] },
  feat: [
    ['patch', '#7a5232', [[560, 560], [520, 640], [600, 740], [800, 760], [880, 680], [820, 590], [700, 560]]],
    ['sprite', 'ferris', 1000, 230, 40], ['sprite', 'bigtop', 520, 280, 46], ['sprite', 'stage', 760, 180, 44],
    ['sprite', 'tent', 300, 330, 18], ['sprite', 'tent', 380, 360, 16], ['sprite', 'tent', 250, 420, 17], ['sprite', 'tent', 430, 520, 15], ['sprite', 'tent', 200, 520, 16],
    ['sprite', 'tent', 1180, 470, 16], ['sprite', 'tent', 1220, 600, 15], ['sprite', 'tent', 1120, 680, 17],
    ['trees', 'round', 600, 420, 70, 6], ['trees', 'round', 1180, 340, 50, 4], ['trees', 'round', 380, 770, 50, 4],
    ['landmark', 900, 450, 40]
  ],
  flora: ['round', 'bush'], density: 24,
  live: [['flutter', 760, 140], ['balloon', 640, 200], ['circle', 1000, 190, 40, 0.6]]
};
})();
