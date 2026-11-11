/* ============================================================
   Spain: the seven levels in the v2 format (LEVEL_OVERHAUL.md §2,
   §3.2 Spain): the whole country, from Buñol and San Sebastián to
   Teide and La Mancha. The country (art, cast, objects, Paellasaurus)
   is registered by 29_tour_es.js; this file adds the stamps and the
   levels with Tour.amend.
   ============================================================ */
(() => {
const C = Tour.countries.es;
if (!C) return;
const stamps = {
  // 6-1: the old flour mill behind the crates: sacks of flour, a millstone, P2, and the way out to the windmills
  molino: {
    floor: 11,
    rows: [
      '##############################',
      '#............................#',
      '#............................#',
      '#...o.o.o.o.o................#',
      '#............................#',
      '#..-------.........*.........#',
      '#.................----.......#',
      '#............................#',
      '#..........?.................#',
      '#............................#',
      '#.@.D...k.....m.......k..g...#',
      '##############################',
      '##############################'
    ],
    legend: { k: ['decor', 'esCrates'], m: ['decor', 'esPots'] },
    items: ['power'], doors: [{ to: 'bunol@molinoBack', look: 'esMillDoor' }], gold: { '*': 'hidden' }
  },
  // 6-2: the cheese cellar inside the wedge: holes to climb through, P2, the way to the souvenir stand
  queso: {
    floor: 11,
    rows: [
      '##############################',
      '#............................#',
      '#..o.o.o.o...................#',
      '#............................#',
      '#..------..........*.........#',
      '#.................----.......#',
      '#............................#',
      '#.........-----..............#',
      '#............................#',
      '#............................#',
      '#.@.D......j.........j...g...#',
      '##############################',
      '##############################'
    ],
    legend: { j: ['decor', 'esOliveBowl'] },
    doors: [{ to: 'barra@quesoBack', look: 'esMouseHole' }], gold: { '*': 'hidden' }
  },
  // 6-3: the Umbracle's garden walk under the white arches: P2, a 1UP, the way down to the aquarium
  umbracle: {
    floor: 11,
    rows: [
      '##############################',
      '#............................#',
      '#............................#',
      '#..o.o.o.o.o.o...............#',
      '#............................#',
      '#...........*................#',
      '#.........-----..............#',
      '#............................#',
      '#.....h......................#',
      '#............................#',
      '#.@.D....l........l......g...#',
      '##############################',
      '##############################'
    ],
    legend: { l: ['decor', 'esLamp'] },
    hidden: ['oneup'], doors: [{ to: 'ciutat@umbBack', look: 'esTileDoor' }], gold: { '*': 'hidden' }
  },
  // 6-4: the cave in the lava tube: cool and dark, P2 and a water bottle
  cueva: {
    floor: 11,
    rows: [
      '##############################',
      '#............................#',
      '#............................#',
      '#....o.o.o.o.o...............#',
      '#............................#',
      '#..............*.............#',
      '#............-----...........#',
      '#............................#',
      '#.......?....................#',
      '#............................#',
      '#.@.D........................#',
      '##############################',
      '##############################'
    ],
    items: ['oneup'], doors: [{ to: 'teide@cuevaBack', look: 'esLavaTube' }], gold: { '*': 'hidden' }
  },
  // 6-5: the falla workshop: half-painted ninots, P2, a mushroom
  taller: {
    floor: 11,
    rows: [
      '##############################',
      '#............................#',
      '#............................#',
      '#..o.o.o.o.o.o.o.............#',
      '#............................#',
      '#..........*.................#',
      '#........-----...............#',
      '#............................#',
      '#..................?.........#',
      '#............................#',
      '#.@.D.....n..........n.......#',
      '##############################',
      '##############################'
    ],
    legend: { n: ['piece', 'ninotDecor', {}] },
    items: ['oneup'], doors: [{ to: 'fallas@tallerBack', look: 'esWorkshopDoor' }], gold: { '*': 'hidden' }
  },
  // 6-6: the alcove behind the porthole (water): Bottle Mail #4, P2
  alcove: {
    floor: 11,
    rows: [
      '##############################',
      '#............................#',
      '#............................#',
      '#...o.o.o.o..................#',
      '#............................#',
      '#..........*.................#',
      '#.......#######..............#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#.@.D.........q..............#',
      '##############################',
      '##############################'
    ],
    legend: { q: ['piece', 'bottle', { n: 4 }] },
    doors: [{ to: 'aquari@alcoveBack', look: 'esPorthole' }], gold: { '*': 'hidden' }
  },
  // 6-7: the flour loft inside the last windmill
  harinero: {
    floor: 11,
    rows: [
      '##############################',
      '#............................#',
      '#............................#',
      '#..o.o.o.o.o.o.o.............#',
      '#............................#',
      '#............*...............#',
      '#..........-----.............#',
      '#............................#',
      '#.....?......................#',
      '#............................#',
      '#.@.D.....k...........k......#',
      '##############################',
      '##############################'
    ],
    legend: { k: ['decor', 'esCrates'] },
    items: ['oneup'], doors: [{ to: 'mancha@harBack', look: 'esMillHouse' }], gold: { '*': 'hidden' }
  }
};

Tour.amend('es', {
  stamps,
  levels: [
    /* 6-1 HOLD: three plazas of the tomato fight in Buñol */
    { n: 1, name: 'La Tomatina', mapLabel: 'Tomatina', arch: 'hold', theme: 'es_tomatina',
      gimmick: 'Three plazas shut tight around the tomato fight: hold out through the waves while the trucks lob and the storks swoop',
      hint: 'A plaza opens again after its third wave. Storks only carry you back a bit: wriggle free!',
      postcard: 'I am red from head to toe. It is the best day of my life. ♥ C',
      enemies: [['esTomato', 3], ['esOrange', 2], ['esHorchata', 1], ['esStork', 1]],
      mapCell: [0, 0], mapFrom: -1,
      exits: { main: { to: '6-2' }, secret: { to: '6-7', hint: 'Two crates block an old door marked MOLINO...' } },
      areas: [
        { id: 'bunol', gen: 'strip', W: 160, H: 18, script: [
          ['itemBlock', { item: 'sig', y: 4 }],
          ['postcard', { kind: 'must', dx: 7, dy: -7 }],
          'balconies',
          // ① plaza one: tomato waves, a truck lobbing more
          ['plaza', { k: 1 }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['itemBlock', { item: 'cake', y: 4 }],   // a jump power (bonus)
          'cp',
          // ② plaza two: a floor of pulp and loose crates
          ['plaza', { k: 2 }],
          ['millDoor', { to: 'molino@in', back: 'molinoBack' }],
          'crates',
          // ③ plaza three: balconies, a star, storks in the waves; P3 on the truck
          ['plaza', { k: 3, gold: 'risky' }],
          ['end', { exit: 'main' }]
        ] },
        { id: 'molino', gen: 'room', role: 'secret', stamp: 'molino' }
      ] },

    /* 6-2 MINI: tiny Brady on a giant pintxos bar in San Sebastián */
    { n: 2, name: 'Pintxos Bar', mapLabel: 'Pintxos', arch: 'mini', theme: 'es_pintxos',
      gimmick: 'Brady is pocket-sized on a giant bar counter: toothpick bridges, bread-slice steps, an olive-oil slick, a salt shaker to climb',
      hint: 'Crawl Pads: hold DOWN and walk to crawl through low holes',
      postcard: 'Everything here is on a toothpick. Even me, nearly. ♥ C',
      enemies: [['esOlive', 2], ['esGamba', 2], ['esPulpo', 1]],
      mapCell: [1, 0], mapFrom: 0,
      exits: { main: { to: '6-3' }, secret: { to: 'house:es-pintxos', hint: 'A mouse hole at the foot of the cheese wedge...' } },
      areas: [
        { id: 'barra', gen: 'strip', W: 200, H: 22, script: [
          // ① toothpicks and bread
          ['itemBlock', { item: 'power', y: 4 }],
          ['breads', { n: 3 }],
          ['toothpicks', { n: 2, enemy: 'esGamba' }],
          ['shaker', { gold: 'must' }],
          ['gearStand', { item: 'wand' }],
          // ② the oil slick and rolling olives
          ['oilSpill', { n: 10, olives: 2 }],
          ['breads', { n: 4, seed: 2, enemy: 'esPulpo' }],
          ['gearStand', { item: 'pads' }],
          ['cheese', { to: 'queso@in', back: 'quesoBack' }],
          // ③ more toothpicks, the octopus, the tortilla flipper
          ['toothpicks', { n: 3, w: 4 }],
          ['enemies', { kind: 'esPulpo', n: 1 }],
          ['oilSpill', { n: 8 }],
          ['pancake', {}],
          ['postcard', { kind: 'risky', dx: -3, dy: -9 }],
          ['enemies', { kind: 'esGamba', n: 2 }],
          ['end', { exit: 'main' }]
        ] },
        { id: 'queso', gen: 'room', role: 'secret', theme: 'es_pintxos', stamp: 'queso' }
      ] },

    /* 6-3 BEAT: Valencia's City of Arts by night */
    { n: 3, name: 'City of Arts by Night', mapLabel: 'Arts', arch: 'beat', theme: 'es_arts', bpm: 112,
      gimmick: 'Floor lights switch on the beat, the white ribs\' crowns are steps, the eyelid deck lifts on the bar',
      hint: 'The floor lights switch on the beat: wait for yours. The kazoo stuns bats',
      postcard: 'The buildings look like whale bones and spaceships. The bats live here too. ♥ C',
      enemies: [['esBat', 2], ['esHorchata', 2]],
      mapCell: [2, 0], mapFrom: 1,
      exits: { main: { to: '6-4' }, secret: { to: '6-6', hint: 'One of the garden arches has a gap behind its hanging plants...' } },
      areas: [
        { id: 'ciutat', gen: 'strip', W: 215, H: 18, dark: true, script: [
          ['itemBlock', { item: 'power', y: 4 }],
          ['itemBlock', { item: 'socks', y: 4 }],   // a jump power (bonus)
          ['gearStand', { item: 'kazoo' }],
          // ① the beat floor
          'ribs',
          ['postcard', { kind: 'must', dx: -6, dy: -7 }],
          ['lights', { n: 4 }],
          // ② the eyelid lifts on the bar
          ['eyelid', { gold: true }],
          'bats',
          'drop',
          ['secretDoor', { to: 'umbracle@in', look: 'curtain', skin: 'esArchCurtain', back: 'umbBack' }],
          // ③ all of it together, bats swooping
          ['ribs', { n: 4 }],
          ['lights', { n: 5 }],
          'eyelid',
          'bats',
          ['itemBlock', { item: 'lsd', y: 5 }],
          'drop',
          ['end', { exit: 'main' }]
        ] },
        { id: 'umbracle', gen: 'room', role: 'secret', theme: 'es_arts', stamp: 'umbracle' }
      ] },

    /* 6-4 GLIDE: down the slopes of Teide on the Canary Islands */
    { n: 4, name: 'Teide Updrafts', mapLabel: 'Teide', arch: 'glide', theme: 'es_teide',
      gimmick: 'Take a paper plane off the volcano: glide through the ring chains, ride the fumaroles\' steam, land on dragon-tree crowns',
      hint: 'Hold jump while falling to glide with the paper plane; steam lifts you',
      postcard: 'A volcano in the sea, Brady! The lizards here are as big as cats. ♥ C',
      enemies: [['esLizard', 2], ['esKestrel', 2]],
      mapCell: [2, 1], mapFrom: [2, 5],
      exits: { main: { to: '6-5' } },
      areas: [
        { id: 'teide', gen: 'islands', W: 220, H: 34, GY: 12, script: [
          ['gearStand', { item: 'plane' }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['lavaBelow', { w: 300 }],
          // ① glide down the slope through the rings
          ['ringChain', { n: 4, gold: 'must' }],
          ['drago', { h: 5, enemy: 'esLizard' }],
          // ② fumaroles and dragon trees
          ['fumarole', { h: 12 }],
          ['drago', { h: 6 }],
          ['enemies', { kind: 'esKestrel', n: 1 }],
          ['fumarole', { h: 14 }],
          ['gearStand', { item: 'plane' }],
          // ③ the ring chains over the lava field
          ['ringChain', { n: 3 }],
          ['drago', { h: 5, enemy: 'esLizard' }],
          ['itemBlock', { item: 'sundial', y: 4 }],
          ['ringChain', { n: 4 }],
          ['postcard', { kind: 'risky', dx: -14, dy: 3 }],
          ['gearStand', { item: 'plane' }],
          ['door', { to: 'cueva@in', look: 'esLavaTube', back: 'cuevaBack', perch: 0 }],
          ['end', { exit: 'main' }]
        ] },
        { id: 'cueva', gen: 'room', role: 'secret', stamp: 'cueva' }
      ] },

    /* 6-5 LAIR: a Fallas street, then Paellasaurus in the Silk Exchange */
    { n: 5, name: 'La Lonja', mapLabel: 'La Lonja', arch: 'lair', theme: 'es_fallas', boss: 'es_paella',
      gimmick: 'A Fallas street of giant papier-mâché fruit, rockets and firecrackers, then Paellasaurus in the Silk Exchange',
      hint: 'Paellasaurus is too hot to stomp. Kick three tomatoes into the pan to put the fire out, then crack the crust!',
      postcard: 'The Silk Exchange is back! The Baron pedalled off to France. Allez! ♥ C',
      enemies: [['esHorchata', 2], ['esTomato', 2]],
      mapCell: [1, 2], mapFrom: 3,
      areas: [
        { id: 'fallas', gen: 'strip', W: 80, H: 18, script: [
          ['itemBlock', { item: 'power', y: 4 }],
          ['ninots', { n: 3, gold: 'must' }],
          ['crackerRow', { n: 6 }],
          ['door', { to: 'taller@in', look: 'esWorkshopDoor', back: 'tallerBack', perch: 0 }],
          ['rocketPad', { gold: 'risky' }],
          ['enemies', { n: 2 }],
          ['crackerRow', { n: 5, phase: 1.2 }],
          ['itemBlock', { item: 'sig', y: 4 }],
          ['door', { to: 'arena@in', perch: 0, look: 'esHallDoor' }]
        ] },
        { id: 'taller', gen: 'room', role: 'secret', theme: 'es_fallas', stamp: 'taller' },
        { id: 'arena', gen: 'arena', role: 'arena', layout: 'lonja', arenaW: 28, theme: 'es_lonja', roof: false }
      ] },

    /* 6-6 DIVE (secret): the Oceanogràfic's glass tunnels */
    { n: 6, name: 'Oceanogràfic', mapLabel: 'Aquarium', arch: 'dive', secret: true, theme: 'es_aquarium',
      gimmick: 'Swim the aquarium\'s glass tunnels past sharks; jellies pulse in columns and pump jets push you along',
      hint: 'Fins make you faster. Jellyfish bob up and down: slip past between pulses',
      postcard: 'A beluga smiled at me through the glass. I smiled back for an hour. ♥ C',
      enemies: [['esJelly', 2], ['esShark', 1]],
      mapCell: [1, 1], mapFrom: 2,
      exits: { main: { to: 'node:6-4' } },
      areas: [
        { id: 'aquari', gen: 'swim', width: 200, H: 18, script: [
          ['gearStand', { item: 'fins' }],
          ['itemBlock', { item: 'power', y: 4 }],
          'tunnel',
          ['postcard', { kind: 'must', dx: -6, dy: -7 }],
          'jellies',
          ['pumps', {}],
          ['door', { to: 'alcove@in', look: 'esPorthole', back: 'alcoveBack', perch: 0 }],
          ['tunnel', { w: 14 }],
          ['jellies', { n: 4 }],
          ['pumps', { dir: -1 }],
          ['postcard', { kind: 'risky', dx: -6, dy: -9 }],
          'tunnel',
          'jellies',
          ['itemBlock', { item: 'oneup', y: 4 }]
        ] },
        { id: 'alcove', gen: 'room', role: 'secret', theme: 'es_aquarium', water: true, stamp: 'alcove' }
      ] },

    /* 6-7 SWITCH (secret): the windmills of La Mancha */
    { n: 7, name: 'Molinos de La Mancha', mapLabel: 'Molinos', arch: 'switch', secret: true, theme: 'es_mancha',
      gimmick: 'The wind lever: with the wind on, the sails turn and cloth boards hold in the gust; with it off, the sails stop and the calm steps settle',
      hint: 'Pull the wind lever (UP) to start or stop the wind. A paper plane can hit it from afar',
      postcard: 'Windmills as far as I can see. One of them waved at me. Probably. ♥ C',
      enemies: [['esSheep', 2], ['esLynx', 1], ['esStork', 1]],
      mapCell: [0, 1], mapFrom: 0,
      exits: { main: {} },
      areas: [
        { id: 'mancha', gen: 'strip', W: 190, H: 20, script: [
          ['itemBlock', { item: 'power', y: 4 }],
          // ① wind on: ride the turning sails, cross on the wind-held boards
          ['windSwitch', {}],
          ['windmill', { r: 4, gold: 'must' }],
          ['enemies', { kind: 'esSheep', n: 2 }],
          ['windBoards', { n: 7 }],
          ['gearStand', { item: 'plane' }],
          // ② wind off: the sails stop, the boards fall, the calm steps settle
          ['windSwitch', {}],
          ['calmSteps', { n: 3, gold: 'risky' }],
          ['enemies', { kind: 'esLynx', n: 1 }],
          ['windmill', { r: 5, speed: 0.45 }],
          // ③ flip the wind on the move
          ['windSwitch', {}],
          ['windBoards', { n: 8 }],
          ['enemies', { kind: 'esStork', n: 1 }],
          ['windmill', { r: 4 }],
          ['windSwitch', {}],
          ['windBoards', { n: 6 }],
          ['door', { to: 'harinero@in', look: 'esMillHouse', back: 'harBack', perch: 0 }],
          ['end', { exit: 'main' }]
        ] },
        { id: 'harinero', gen: 'room', role: 'secret', theme: 'es_mancha', stamp: 'harinero' }
      ] }
  ]
});
})();
