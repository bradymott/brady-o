/* ============================================================
   World tour: the hand-tuned overworld layout of every land.
   TOUR_OW_MAPS[cc] = {
     w, h                 the map size in map units (about CSS px at zoom 1)
     land: [ring, ...]    coast polygons ([x, y] points, smoothed into curves)
     nodes: { key: [x, y, labelSide] }   key = a level id ('1-3'), 'house:<id>', 'start' (the airstrip Brady
                          lands on), 'port' (opens when the boss falls), 'bottle:<n>'; labelSide 's' (default), 'n', 'e', 'w'
     paths: { 'a>b': [[x, y], ...] }      bends of a trail between two stops (either direction)
     feat: [...]          scenery: ['mtn'|'hill'|'volcano'|'karst'|'mesa'|'berg', x, y, size, opts], ['range', kind,
                          [[x, y, size], ...]], ['trees', kind, x, y, radius, n], ['town', x, y, n, radius, style],
                          ['lake', ring], ['river', pts, width], ['patch'|'dunes'|'snow'|'fields'|'paddies', colour, ring],
                          ['sprite', kind, x, y, size], ['landmark', x, y, size]
     flora: [kinds], density   trees scattered over the free land
     pal: { sea, deep, land, light, path, beach, cliff, roof, wall }   colour overrides (else TourLandscape.looks)
     sea, coast, tufts, trail, bridge   the land's own painters by name (28_tour_fg_owlands.js): sea 'clouds' |
                          'stars' | 'pack' | 'reef'; coast 'float' | 'ice' | 'dike' | 'rock'; tufts 'sand' | 'snow' |
                          'flowers' | 'none'; trail 'planks' | 'stones' | 'rail' | 'prints' | 'bricks' | 'sand' |
                          'cobble' | 'sparkle'; bridge 'stone' | 'rope' | 'ice' | 'steps'
     meadow (false | colour), beachW, flowerCols, foam (false), foamY, birds (false), woods (false)   small options
     live: [[kind, ...], ...]   moving bits drawn each frame (TourOWScenes.liveKinds: sail, flutter, spout, mill,
                          balloon, kite, train, walk, circle, flakes, fish, bob, lanterns, blink, glider, clock, plane, seal)
   }
   Every land has its own route shape (horseshoe, zigzag, diagonal, descent, V, Z, spiral, rings, loop, S,
   staircase, switchbacks, crescent, clock face); tools/sbw_overworld_test.js fails if two lands' shapes match.
   Positions for stops that do not exist yet (a bonus level such as '1-7') are ignored until they do.
   The topology (which stop leads where) always comes from the levels' mapFrom and exits; a stop missing here
   falls back to its mapCell on the layout's grid ([x0, y0 of cell 0,0, dx, dy]).
   ============================================================ */
const TOUR_OW_MAPS = {
  // Mexico: a horseshoe walk round the middle of the land: along the south coast from the market town over the
  // canals to the cenote in the jungle, up past the volcano, and back west along the top to the hacienda; the
  // desert with its cactus in the north-west, monarch butterflies, a vulture circling (the shape every other land
  // now departs from)
  mx: {
    labels: { '1-3': 'Cenote', '1-4': 'Volcán', '1-5': 'Hacienda', '1-6': 'Swallow Pit' },
    w: 1600, h: 960,
    land: [[[70, 640], [120, 450], [250, 330], [390, 170], [620, 95], [900, 80], [1160, 105], [1360, 170], [1500, 290], [1545, 470], [1525, 640], [1560, 790], [1460, 895], [1180, 915], [880, 890], [600, 920], [330, 905], [130, 860], [60, 760]]],
    nodes: { start: [165, 770], '1-1': [380, 745], '1-2': [780, 790], '1-3': [1180, 760], '1-4': [1300, 470, 'w'], '1-5': [800, 255], '1-6': [800, 525], 'house:mx-tienda': [350, 480], port: [1170, 205], '1-7': [560, 440] },
    paths: { 'start>1-1': [[270, 790]], '1-1>1-2': [[570, 820]], '1-2>1-3': [[985, 745]], '1-3>1-4': [[1270, 640]], '1-4>1-5': [[1080, 330]], '1-3>1-6': [[1060, 610], [900, 590]], '1-6>1-5': [[770, 390]], '1-1>house:mx-tienda': [[310, 620]], '1-5>port': [[990, 205]] },
    feat: [
      ['patch', '#dcc685', [[170, 420], [300, 300], [520, 210], [640, 300], [560, 400], [420, 430], [260, 470]]],
      ['lake', [[470, 560], [560, 535], [630, 575], [610, 640], [525, 655], [455, 610]]],
      ['river', [[575, 650], [590, 740], [600, 830], [610, 930]], 16], ['river', [[596, 735], [700, 712], [860, 722], [940, 762]], 12],
      ['volcano', 1410, 380, 66], ['range', 'mtn', [[1450, 260, 40], [1340, 300, 34]], { snow: false, col: '#a07a6a' }],
      ['mesa', 560, 330, 34], ['sprite', 'sombrero', 225, 570, 26], ['mesa', 640, 200, 28],
      ['fields', '#c8a070', [[930, 380], [1080, 360], [1130, 450], [990, 480]], ['#5a9a9a', '#4a8a8a'], 0.4],
      ['fields', '#a8784a', [[1030, 555], [1120, 540], [1150, 600], [1050, 615]], ['#e8423a', '#3f8a3a'], -0.3],
      ['trees', 'cactus', 420, 320, 120, 9], ['trees', 'agave', 300, 400, 90, 6],
      ['trees', ['round', 'palm'], 1120, 640, 90, 9], ['trees', 'palm', 1330, 820, 90, 7],
      ['town', 470, 760, 6, 50], ['landmark', 430, 290, 74]
    ],
    flora: ['cactus', 'agave', 'round', 'bush'], density: 52,
    scenes: { '1-1': 'market', '1-2': ['canals', { river: 1 }], '1-3': 'cenote', '1-4': 'volcano', '1-5': 'hacienda', '1-6': 'pit', 'house:mx-tienda': 'keeper', start: 'airstrip' },
    live: [['sail', [[60, 960], [40, 300], [300, 30], [1300, 40], [1580, 400], [1590, 940]], 14], ['flutter', 1060, 660, '#ff8a1a'], ['flutter', 300, 640, '#ffb81a'], ['spout', 1560, 160], ['circle', 560, 360, 90, 1.1], ['walk', 'dog', [[420, 860], [520, 870], [600, 850]], 9]]
  },
  // Ecuador: the trail zigzags back and forth across the equator (the red and yellow line), west to east: the
  // Amazon canopy and its river in the north-west, the boobies' beach and a Galápagos island in the bay, the
  // cacao groves, the snowy Andes and Cotopaxi in the east
  ec: {
    labels: { '2-7': 'Cauldron', 'house:ec-cacao': 'Cacao Shop', '2-2': 'Canopy', '2-6': 'Galápagos' },
    w: 1700, h: 900,
    pal: { land: '#4f9a62', light: '#8ac06a', path: '#f2dfa8' },
    sea: 'reef', trail: 'stones', tufts: 'flowers', flowerCols: ['#ff5a8a', '#ffd23a', '#3a8aff'],
    land: [[[60, 520], [90, 330], [200, 170], [420, 80], [700, 60], [1000, 70], [1300, 60], [1520, 110], [1650, 260], [1660, 480], [1620, 700], [1500, 840], [1300, 870], [1180, 820], [1140, 700], [1060, 640], [920, 680], [860, 790], [700, 865], [450, 870], [220, 830], [90, 720]],
      [[925, 740], [1000, 705], [1100, 735], [1125, 805], [1060, 858], [950, 850], [915, 800]]],
    nodes: { start: [150, 640], '2-1': [330, 450], '2-2': [560, 260], '2-7': [300, 170], '2-3': [760, 650], '2-6': [990, 775], 'bottle:1': [1075, 815], '2-4': [1040, 330], 'house:ec-cacao': [1250, 190], '2-5': [1330, 560], port: [1500, 300] },
    paths: { 'start>2-1': [[230, 560]], '2-1>2-2': [[420, 330]], '2-2>2-7': [[420, 190]], '2-2>2-3': [[640, 420], [720, 540]], '2-3>2-6': [[880, 730]], '2-3>2-4': [[880, 520], [960, 400]], '2-6>2-4': [[1060, 640], [1110, 480]], '2-4>house:ec-cacao': [[1150, 250]], '2-4>2-5': [[1200, 380], [1270, 470]], '2-5>port': [[1440, 460]], '2-6>bottle:1': [[1040, 805]] },
    feat: [
      ['river', [[640, 60], [610, 160], [680, 300], [700, 440], [640, 560], [580, 700], [560, 880]], 16],
      ['patch', '#3f8a52', [[100, 380], [180, 220], [380, 120], [520, 140], [560, 330], [430, 400], [250, 440]]],
      ['trees', ['round', 'banana', 'round', 'palm'], 300, 300, 200, 26], ['trees', 'cacao', 1040, 210, 110, 10], ['trees', 'cacao', 880, 300, 60, 5],
      ['range', 'mtn', [[1560, 560, 50], [1480, 700, 44], [1600, 420, 40], [1380, 780, 36], [1240, 760, 30], [1600, 680, 34]], { snow: true }],
      ['volcano', 1440, 600, 58, { lava: false, col: '#7a7a8a' }],
      ['patch', '#e8d8a8', [[640, 760], [760, 740], [860, 790], [700, 860], [560, 850]]],
      ['trees', 'palm', 680, 800, 70, 6], ['trees', 'cactus', 1080, 790, 30, 3],
      ['sprite', 'rock', 1180, 880, 12, { sea: true }], ['sprite', 'rock', 860, 885, 9, { sea: true }],
      ['town', 160, 480, 5, 40], ['landmark', 860, 180, 56]
    ],
    flora: ['round', 'banana', 'palm', 'bush'], density: 46,
    scenes: { '2-1': 'marker', '2-2': 'canopy', '2-3': 'boobies', '2-4': 'factory', '2-5': 'crater', '2-6': 'reef', '2-7': ['waterfall', { h: 52 }] },
    live: [['walk', 'tortoise', [[950, 815], [1010, 830], [1060, 845]], 4], ['circle', 1460, 470, 90, 1.2], ['flutter', 260, 320, '#3a8aff'], ['flutter', 470, 520, '#3a8aff'], ['sail', [[820, 900], [1180, 900], [1200, 860], [900, 880]], 10], ['fish', 1150, 700, '#ffb05a']]
  },
  // Brazil: one long beach road from the south-west to the north-east, the ocean on its right: the samba town on
  // the sand, the Pantanal pools, the Iguaçu river and falls, the white Lençóis dunes, the stadium city, and the
  // Sugarloaf-style rock offshore where the plane waits; the rainforest fills the inland corner
  br: {
    labels: { '3-6': 'Hang-Glide' },
    w: 1700, h: 900,
    pal: { land: '#57a95c', light: '#9fd36e', path: '#e9c98a', beach: '#f6e2a8' },
    sea: 'reef', beachW: 52, trail: 'planks', bridge: 'rope', tufts: 'flowers', flowerCols: ['#ff4f6a', '#ffd23a', '#ff8a2a'],
    land: [[[40, 60], [600, 40], [1200, 40], [1660, 50], [1600, 200], [1450, 330], [1250, 480], [1000, 620], [700, 700], [400, 800], [150, 870], [50, 800], [40, 400]],
      [[1490, 350], [1570, 305], [1650, 340], [1650, 430], [1570, 460], [1500, 420]]],
    nodes: { start: [150, 770], '3-1': [380, 670], 'house:br-quati': [470, 420], '3-2': [640, 570], '3-3': [890, 480], '3-6': [960, 230], '3-4': [1150, 390], 'bottle:2': [1130, 520], '3-5': [1360, 270], port: [1570, 390] },
    paths: { 'start>3-1': [[260, 740]], '3-1>3-2': [[510, 640]], '3-2>house:br-quati': [[540, 480]], '3-2>3-3': [[770, 540]], '3-3>3-4': [[1020, 450]], '3-3>3-6': [[880, 350]], '3-6>3-5': [[1160, 220]], '3-4>3-5': [[1250, 340]], '3-4>bottle:2': [[1120, 460]], '3-5>port': [[1470, 320]] },
    feat: [
      ['river', [[700, 40], [760, 160], [820, 280], [960, 360], [1000, 470], [1040, 560], [1080, 640]], 18],
      ['lake', [[560, 420], [620, 400], [660, 440], [610, 470], [560, 460]]], ['lake', [[700, 640], [760, 625], [780, 655], [720, 670]]], ['lake', [[740, 470], [780, 462], [790, 490], [748, 497]]],
      ['dunes', '#f6f0e0', [[1080, 430], [1200, 400], [1330, 360], [1380, 440], [1250, 500], [1120, 540]]],
      ['lake', [[1240, 440], [1280, 430], [1290, 455], [1250, 465]]], ['lake', [[1180, 470], [1210, 462], [1215, 485], [1185, 490]]],
      ['trees', ['round', 'palm', 'round', 'banana'], 260, 230, 210, 34], ['trees', ['round', 'palm'], 560, 200, 120, 14],
      ['range', 'hill', [[1080, 120, 50], [1220, 110, 44], [960, 110, 40]], { col: '#4f9a52' }],
      ['town', 1300, 160, 9, 70], ['town', 470, 760, 5, 40],
      ['trees', 'palm', 300, 790, 60, 5], ['trees', 'palm', 760, 700, 80, 6], ['trees', 'pineapple', 820, 610, 60, 6],
      ['sprite', 'umbrella', 230, 820, 14, { col: '#ff5a6a' }], ['sprite', 'umbrella', 520, 755, 14, { col: '#38c8ff' }], ['sprite', 'umbrella', 640, 720, 14, { col: '#ffd23a' }],
      ['sprite', 'rock', 1400, 470, 12, { sea: true }], ['sprite', 'rock', 1660, 480, 10, { sea: true }],
      ['landmark', 1590, 440, 50]
    ],
    flora: ['palm', 'round', 'banana', 'bush'], density: 44,
    scenes: { '3-1': 'samba', '3-2': ['wetland', { critter: 'coati' }], '3-3': ['waterfall', { wide: true, h: 38, rainbow: true }], '3-4': 'lagoons', '3-5': 'stadium', '3-6': 'glider' },
    live: [['glider', 960, 160, 80], ['sail', [[900, 820], [1300, 640], [1650, 560], [1400, 860]], 12], ['spout', 1250, 760], ['walk', 'caiman', [[700, 690], [760, 680]], 4], ['flutter', 330, 420, '#ff6a3a'], ['fish', 1050, 720, '#ffd23a']]
  },
  // Mozambique: a tall map walked from top to bottom, down the savanna beside the Zambezi as it winds south and
  // fans out into its delta: the Gorongosa grasslands and their ostriches up top, the dunes, the baobab avenue,
  // the turtle beach on the south coast, and the island fortress reached over the long bridge
  mz: {
    labels: { '4-6': 'Buried Dhow' },
    w: 1120, h: 1360,
    pal: { land: '#b4b45e', light: '#d8cc80', path: '#f6e0b0', beach: '#f2dca0', cliff: '#8a6a44' },
    sea: 'reef', trail: 'prints', tufts: 'sand', meadow: '#c8c070',
    land: [[[60, 80], [400, 50], [800, 60], [1020, 130], [1050, 300], [960, 480], [900, 640], [930, 820], [870, 980], [770, 1100], [600, 1200], [400, 1250], [200, 1240], [70, 1100], [50, 800], [60, 450]],
      [[770, 1215], [850, 1170], [960, 1180], [1010, 1250], [960, 1315], [830, 1310], [770, 1270]]],
    nodes: { start: [560, 130], '4-1': [620, 330], 'house:mz-gorongosa': [180, 320], '4-2': [560, 560], '4-6': [800, 720], '4-3': [600, 790], '4-4': [560, 1050], 'bottle:3': [430, 1170], '4-5': [850, 1245], port: [960, 1215, 'n'] },
    paths: { 'start>4-1': [[610, 230]], '4-1>house:mz-gorongosa': [[450, 330]], '4-1>4-2': [[600, 450]], '4-2>4-6': [[700, 610]], '4-6>4-4': [[760, 900], [650, 1000]], '4-2>4-3': [[570, 680]], '4-3>4-4': [[560, 920]], '4-4>bottle:3': [[480, 1120]], '4-4>4-5': [[680, 1140], [770, 1200]], '4-5>port': [[910, 1260]] },
    feat: [
      ['river', [[330, 50], [370, 250], [260, 450], [340, 650], [280, 850], [350, 1020]], 20],
      ['river', [[350, 1020], [250, 1150], [190, 1250]], 14], ['river', [[350, 1020], [360, 1140], [380, 1260]], 12], ['river', [[350, 1020], [460, 1110], [540, 1220]], 12],
      ['patch', '#cfc072', [[420, 200], [800, 180], [880, 420], [700, 480], [430, 420]]],
      ['dunes', '#ecd08a', [[640, 500], [820, 480], [900, 620], [780, 680], [650, 640]]],
      ['trees', 'baobab', 720, 820, 120, 8], ['trees', 'baobab', 450, 760, 60, 3], ['trees', 'acacia', 760, 300, 160, 9], ['trees', 'acacia', 170, 250, 120, 7],
      ['sprite', 'giraffe', 820, 380, 20], ['sprite', 'giraffe', 870, 410, 17], ['sprite', 'giraffe', 160, 580, 18],
      ['sprite', 'termite', 470, 280, 14], ['sprite', 'termite', 700, 160, 12], ['sprite', 'termite', 150, 720, 13],
      ['sprite', 'hut', 120, 960, 14], ['sprite', 'hut', 170, 1000, 13], ['sprite', 'hut', 110, 1040, 12],
      ['trees', 'palm', 660, 1150, 90, 8], ['trees', 'palm', 880, 960, 60, 5], ['town', 880, 1270, 4, 30, 'flat'],
      ['lake', [[180, 400], [230, 385], [255, 420], [215, 440], [175, 430]]],
      ['sprite', 'rock', 1060, 1100, 12, { sea: true }], ['landmark', 160, 1150, 52]
    ],
    flora: ['acacia', 'bush', 'baobab', 'acacia'], density: 44,
    scenes: { '4-1': 'herd', '4-2': 'dustdunes', '4-3': 'baobabs', '4-4': 'turtlebeach', '4-5': 'seawall', '4-6': 'dhow' },
    live: [['walk', 'ostrich', [[760, 240], [860, 270], [900, 330]], 18], ['walk', 'turtle', [[600, 1170], [640, 1180]], 3], ['sail', [[1000, 560], [1100, 900], [1060, 1340], [1000, 900]], 10, '#c8a878', '#fff4e0'], ['circle', 460, 620, 80, 1.1], ['spout', 1080, 760]]
  },
  // Morocco: a V through the desert: down from the walled souk town on the Atlantic coast, deep into the dunes
  // to the oasis where the caravan rests, then up again past the blue town and the kasbahs to the riad garden;
  // the flying carpets cut straight across the Atlas between the V's two tips
  ma: {
    labels: { '5-6': 'Carpets' },
    w: 1600, h: 960,
    pal: { land: '#d6a466', light: '#ecc890', path: '#fff2d6', beach: '#f2d8a0', cliff: '#a86a44' },
    trail: 'sand', tufts: 'sand', meadow: '#e8bf88',
    land: [[[240, 70], [700, 50], [1150, 60], [1500, 90], [1560, 300], [1540, 560], [1500, 800], [1300, 910], [900, 920], [520, 900], [260, 800], [110, 620], [60, 420], [120, 220]]],
    nodes: { start: [200, 260], '5-1': [430, 400], '5-6': [820, 230], '5-2': [800, 790], '5-3': [1080, 580], 'house:ma-bazar': [1300, 700], '5-4': [1250, 380], '5-5': [1400, 190], port: [1460, 420] },
    paths: { 'start>5-1': [[300, 360]], '5-1>5-2': [[560, 580], [680, 720]], '5-2>5-3': [[950, 720]], '5-3>house:ma-bazar': [[1200, 660]], '5-3>5-4': [[1180, 480]], '5-1>5-6': [[600, 290]], '5-6>5-4': [[1050, 270]], '5-4>5-5': [[1320, 270]], '5-5>port': [[1470, 300]] },
    feat: [
      ['dunes', '#efc77a', [[420, 640], [640, 600], [900, 640], [1000, 760], [960, 900], [600, 900], [400, 800]]],
      ['dunes', '#f2cf88', [[860, 420], [980, 400], [1020, 480], [920, 520]]],
      ['lake', [[700, 810], [760, 845], [740, 880], [670, 870], [655, 835]]],
      ['trees', 'palm', 700, 860, 70, 7], ['trees', 'palm', 870, 800, 40, 3],
      ['range', 'mtn', [[560, 150, 44], [680, 120, 52], [960, 130, 54], [1100, 160, 44], [700, 330, 34], [1000, 340, 36]], { snow: true, col: '#b08a7a' }],
      ['wall', [[300, 470], [380, 520], [500, 520], [560, 450], [540, 340], [420, 300], [320, 340]], '#d89a62', true],
      ['town', 440, 470, 7, 50, 'flat'], ['town', 1090, 500, 6, 45, 'blue'], ['town', 1010, 600, 3, 30, 'blue'],
      ['sprite', 'kasbah', 1140, 320, 20], ['sprite', 'kasbah', 1350, 470, 18], ['sprite', 'kasbah', 1330, 120, 16],
      ['sprite', 'tagine', 600, 760, 16], ['sprite', 'tagine', 980, 860, 18], ['sprite', 'tagine', 470, 860, 14], ['sprite', 'tagine', 1200, 840, 16],
      ['sprite', 'tent', 860, 700, 16, { col: '#e8d0a0', stripe: '#3a6ab8' }], ['sprite', 'tent', 900, 740, 14],
      ['trees', 'olive', 1350, 600, 90, 7], ['trees', 'palm', 1460, 120, 50, 3], ['trees', 'cactus', 200, 600, 70, 5],
      ['landmark', 160, 480, 52]
    ],
    flora: ['palm', 'olive', 'bush', 'agave'], density: 36,
    scenes: { '5-1': 'souk', '5-2': 'caravan', '5-3': ['village', { wall: '#7ab4e8', walls: ['#7ab4e8', '#5a9ad8', '#a8d0f0'], roof: '#5a8ac8', flat: true, n: 7, ground: '#c8d8e8' }], '5-4': ['grove', { trees: ['palm', 'palm', 'olive'], ground: '#d8b078' }], '5-5': 'riad', '5-6': 'carpets' },
    live: [['walk', 'camel', [[500, 700], [600, 680], [720, 700]], 9], ['walk', 'camel', [[1000, 820], [1100, 800], [1180, 760]], 7], ['walk', 'fennec', [[880, 470], [940, 450]], 10], ['circle', 820, 400, 80, 1], ['sail', [[40, 300], [60, 900], [400, 950], [20, 500]], 10]]
  },
  // Spain: a Z: east along the north coast (tomatoes, the pintxos bar), down across the windmill plateau to the
  // City of Arts, over the strait to the volcano island, then east along the south coast to the old market hall
  es: {
    labels: { '6-6': 'Aquarium', '6-7': 'Molinos' },
    w: 1500, h: 960,
    pal: { land: '#b4a466', light: '#d8c890', path: '#f3d2a2', cliff: '#9a5a3a', beach: '#ecd2a0' },
    bridge: 'stone',
    land: [[[80, 90], [500, 70], [1000, 80], [1350, 110], [1460, 260], [1450, 520], [1400, 760], [1280, 880], [1000, 900], [700, 890], [580, 860], [530, 720], [440, 640], [260, 610], [120, 560], [70, 380]],
      [[220, 700], [330, 662], [460, 700], [500, 800], [420, 880], [280, 890], [200, 820]]],
    nodes: { start: [160, 190], '6-1': [540, 170], '6-7': [330, 380], 'house:es-pintxos': [1200, 320], '6-2': [960, 200], '6-3': [760, 480], '6-6': [450, 520], 'bottle:4': [300, 520], '6-4': [430, 760], '6-5': [800, 790], port: [1170, 760] },
    paths: { 'start>6-1': [[350, 160]], '6-1>6-7': [[420, 290]], '6-1>6-2': [[750, 200]], '6-2>house:es-pintxos': [[1090, 280]], '6-2>6-3': [[880, 340]], '6-3>6-6': [[600, 520]], '6-6>bottle:4': [[375, 530]], '6-6>6-4': [[400, 650]], '6-3>6-4': [[600, 600], [470, 700]], '6-4>6-5': [[560, 820]], '6-5>port': [[990, 800]] },
    feat: [
      ['contours', '#c8b47a', [[180, 300], [460, 280], [640, 360], [560, 430], [300, 460], [150, 420]], 3],
      ['sprite', 'windmill', 240, 330, 18, { spin: 1 }], ['sprite', 'windmill', 440, 340, 18, { spin: 1 }], ['sprite', 'windmill', 220, 440, 16, { spin: 1 }],
      ['patch', '#d8604a', [[580, 90], [700, 100], [690, 140], [600, 140]]],
      ['fields', '#a89a5a', [[900, 380], [1100, 380], [1140, 470], [960, 500]], ['#6a8a4a', '#7a9a5a'], 0.4],
      ['trees', 'orange', 1250, 520, 120, 10], ['trees', 'olive', 640, 660, 110, 8], ['trees', 'cypress', 1000, 640, 80, 5], ['trees', 'olive', 1100, 180, 80, 5],
      ['volcano', 290, 820, 50, { lava: false, col: '#8a6a5a' }],
      ['sprite', 'paella', 1000, 860, 18], ['sprite', 'paella', 620, 410, 14], ['sprite', 'hayroll', 200, 520, 10], ['sprite', 'hayroll', 520, 600, 10],
      ['town', 1300, 760, 6, 50, 'flat'], ['town', 700, 100, 4, 40], ['town', 940, 760, 4, 40, 'flat'],
      ['landmark', 1330, 380, 54]
    ],
    flora: ['olive', 'orange', 'cypress', 'bush'], density: 36,
    scenes: { '6-1': 'tomatina', '6-2': 'pintxos', '6-3': 'arts', '6-4': ['grove', { trees: ['pine', 'pine', 'rock'], ground: '#9a8a7a' }], '6-5': ['grove', { trees: ['orange', 'orange', 'olive'], ground: '#e8d0a0' }], '6-6': 'aquarium', '6-7': ['windmills', { ground: '#d9c48a' }] },
    live: [['mill', 240, 330, 18], ['mill', 440, 340, 18], ['mill', 220, 440, 16], ['sail', [[1350, 900], [1480, 700], [1480, 940]], 10], ['circle', 380, 330, 70, 1], ['fish', 510, 760, '#8ab0d0']]
  },
  // France: a six-sided land walked as a spiral out of Paris (its blocks and the iron tower in daylight in the
  // middle), clockwise past the lavender, over the causeway to the abbey islet in the bay (a plain rock town), the
  // truffle woods in the west and the château gardens in the north; the Seine crosses the land, balloons drift
  fr: {
    labels: { '7-7': 'Balloons', '7-6': 'Seine' },
    w: 1600, h: 960,
    pal: { land: '#86b07e', light: '#b8d39a', path: '#f4ead0', beach: '#efe2bc' },
    trail: 'cobble', bridge: 'stone', tufts: 'flowers', flowerCols: ['#e8423a', '#ffffff', '#9a6ad8'],
    land: [[[250, 100], [700, 60], [1150, 80], [1450, 250], [1530, 520], [1350, 820], [1000, 880], [870, 790], [760, 760], [600, 780], [480, 880], [200, 860], [90, 560], [110, 300]],
      [[640, 822], [712, 800], [780, 830], [772, 892], [690, 910], [630, 878]]],
    nodes: { start: [1010, 400], '7-1': [790, 470], '7-6': [540, 380], '7-2': [1020, 640], '7-3': [705, 855], '7-7': [420, 760], '7-4': [300, 540], 'house:fr-brocante': [210, 330], '7-5': [560, 170], port: [1060, 160] },
    paths: { 'start>7-1': [[900, 420]], '7-1>7-6': [[660, 400]], '7-1>7-2': [[900, 580]], '7-2>7-3': [[880, 760], [780, 800]], '7-3>7-7': [[560, 830]], '7-3>7-4': [[560, 760], [380, 680]], '7-4>house:fr-brocante': [[230, 440]], '7-4>7-5': [[360, 330]], '7-5>port': [[820, 120]] },
    feat: [
      ['river', [[1530, 300], [1300, 330], [1120, 470], [900, 520], [700, 520], [560, 460], [400, 440], [90, 420]], 16],
      ['blocks', [[720, 400], [860, 380], [880, 460], [860, 560], [740, 570], [700, 480]], { step: 30, street: 9, cols: ['#f0e4c8', '#e8dcc0', '#dcd4c4'], road: '#a8a0b0' }],
      ['fields', '#7a8a5a', [[1080, 560], [1250, 540], [1300, 680], [1150, 720], [1060, 660]], ['#9a6ad8', '#a682e0'], 0.3],
      ['fields', '#c8b060', [[1200, 280], [1350, 290], [1380, 380], [1230, 400]], ['#ffd23a', '#e8b82a'], -0.2],
      ['fields', '#7aa060', [[440, 140], [620, 110], [700, 200], [540, 250], [420, 220]], ['#4a8a4a', '#6aa85a'], 0, 'bands'],
      ['trees', 'round', 260, 600, 120, 12], ['trees', 'poplar', 620, 300, 100, 8], ['fields', '#9a8a5a', [[1080, 760], [1250, 720], [1320, 790], [1200, 850], [1060, 830]], ['#7a3a8a', '#5a8a3a'], 0.5],
      ['trees', 'poplar', 1250, 470, 60, 5], ['trees', 'cypress', 1400, 600, 60, 4],
      ['town', 160, 720, 5, 40], ['town', 1350, 200, 5, 45], ['town', 700, 880, 4, 26, 'flat'],
      ['sprite', 'cheese', 1000, 260, 16], ['sprite', 'cheese', 300, 820, 14], ['sprite', 'hayroll', 480, 640, 10], ['sprite', 'hayroll', 520, 670, 10],
      ['landmark', 880, 330, 62]
    ],
    flora: ['round', 'poplar', 'cypress', 'bush'], density: 40,
    scenes: { '7-1': 'paris', '7-2': 'lavender', '7-3': 'islet', '7-4': 'truffle', '7-5': 'garden', '7-6': ['barges', { river: 0 }], '7-7': 'balloons' },
    live: [['balloon', 1250, 420, '#ff5a6a', '#ffd23a'], ['balloon', 380, 280, '#38a8e8', '#ffffff'], ['walk', 'pig', [[230, 640], [300, 660], [340, 640]], 6], ['sail', [[1100, 940], [1590, 900], [1590, 720], [1250, 950]], 10], ['flutter', 1180, 620, '#ffffff']]
  },
  // the Netherlands: reclaimed land behind a dike; from the harbour in the north-east the walk goes down through
  // the polders, west past the flower auction and the bike lanes, then in across the canal rings (half circles
  // round the old town, the harbour water on top) to the weigh house among the cheese wheels; windmills turn, a
  // goose cycles the dike road
  nl: {
    labels: { '8-6': 'Windmills' },
    w: 1600, h: 960,
    pal: { land: '#86bc6e', light: '#b0d888', path: '#e8c0a0', sea: '#5a9ab8', cliff: '#6a8a5a' },
    coast: 'dike', trail: 'bricks', tufts: 'flowers', flowerCols: ['#ff4a5a', '#ffd23a', '#ff8ad0', '#ffffff'], foamY: 9,
    land: [[[60, 110], [500, 100], [700, 130], [900, 130], [1100, 100], [1540, 110], [1550, 500], [1530, 900], [800, 910], [70, 900], [50, 500]]],
    nodes: { start: [1420, 250], '8-1': [1340, 520], 'house:nl-winkel': [1440, 760], '8-2': [1060, 820], '8-6': [760, 690], '8-3': [560, 830], '8-4': [360, 460], '8-5': [800, 220], port: [580, 175] },
    paths: { 'start>8-1': [[1400, 380]], '8-1>house:nl-winkel': [[1420, 640]], '8-1>8-2': [[1220, 700]], '8-2>8-6': [[900, 720]], '8-2>8-3': [[810, 870]], '8-6>8-4': [[540, 600]], '8-3>8-4': [[400, 680]], '8-4>8-5': [[520, 300]], '8-5>port': [[690, 170]] },
    feat: [
      ['river', [[320, 105], [340, 300], [460, 470], [620, 560], [800, 590], [980, 560], [1140, 470], [1260, 300], [1280, 105]], 14],
      ['river', [[500, 105], [520, 240], [620, 360], [800, 410], [980, 360], [1080, 240], [1100, 105]], 12],
      ['polders', [[70, 520], [300, 480], [520, 620], [560, 760], [420, 890], [80, 890]], 0.35],
      ['polders', [[1150, 700], [1400, 680], [1530, 760], [1520, 890], [1100, 895]], -0.3, ['#9ad07a', '#86c06a', '#b0d878']],
      ['fields', '#6a9a4a', [[600, 720], [760, 700], [960, 730], [1000, 800], [620, 800]], ['#ff4a5a', '#ffd23a', '#ff8ad0', '#ffffff', '#ff7a1a'], 0.12, 'bands'],
      ['sprite', 'gable', 640, 300, 16, { v: 0.1 }], ['sprite', 'gable', 960, 300, 16, { v: 0.5 }], ['sprite', 'gable', 600, 470, 16, { v: 0.8 }], ['sprite', 'gable', 1010, 460, 16, { v: 0.3 }], ['sprite', 'gable', 420, 340, 15, { v: 0.6 }], ['sprite', 'gable', 1190, 380, 15, { v: 0.2 }],
      ['sprite', 'wheel', 720, 250, 12], ['sprite', 'wheel', 880, 250, 12], ['sprite', 'cheese', 760, 300, 12],
      ['sprite', 'windmill', 120, 760, 18, { spin: 1 }], ['sprite', 'windmill', 500, 670, 18, { spin: 1 }], ['sprite', 'windmill', 1180, 800, 18, { spin: 1 }], ['sprite', 'windmill', 1460, 560, 18, { spin: 1 }], ['sprite', 'windmill', 160, 300, 16, { spin: 1 }],
      ['trees', 'willow', 1420, 380, 80, 6], ['trees', 'poplar', 240, 220, 70, 5],
      ['landmark', 1450, 220, 50]
    ],
    flora: ['willow', 'round', 'poplar'], density: 26, woods: false,
    scenes: { '8-1': ['windmills', { n: 2, ground: '#86cc6a', wall: '#7a5a4a', roof: '#3a3a4a' }], '8-2': 'greenhouse', '8-3': 'bikes', '8-4': 'skating', '8-5': 'canalhouses', '8-6': ['windmills', { n: 3, ground: '#9ad07a' }] },
    live: [['mill', 120, 760, 18], ['mill', 500, 670, 18], ['mill', 1180, 800, 18], ['mill', 1460, 560, 18], ['mill', 160, 300, 16], ['walk', 'bike', [[1100, 885], [1300, 885], [1500, 870]], 22], ['bob', 'duck', 470, 465], ['bob', 'duck', 1110, 255], ['sail', [[300, 40], [1500, 30], [1550, 70], [200, 70]], 14]]
  },
  // Bali: the walk goes once round the island's volcano, clockwise, whose slopes are stepped rice terraces: from
  // the south coast to the surf beach, the kite fields in the west, the lava side in the north, the manta coast,
  // the monkey forest in the east; the secret trails climb the terraces inward; outriggers sail the reef
  id: {
    labels: { '9-3': 'Batur', '9-2': 'Kites' },
    w: 1500, h: 1000,
    pal: { land: '#5aa070', light: '#9cc878', path: '#ecd2a2', beach: '#f4e0b0' },
    sea: 'reef', trail: 'stones', tufts: 'flowers', flowerCols: ['#ff8a3a', '#ffd23a', '#ff5a8a'],
    land: [[[110, 520], [170, 330], [330, 180], [560, 100], [820, 80], [1080, 110], [1300, 200], [1430, 360], [1450, 560], [1360, 760], [1180, 880], [900, 930], [600, 940], [330, 900], [150, 760]],
      [[1290, 870], [1360, 840], [1440, 870], [1430, 930], [1340, 950], [1280, 915]]],
    nodes: { start: [720, 870], '9-1': [400, 800], 'bottle:5': [270, 830], '9-2': [230, 480], '9-6': [460, 560], '9-3': [500, 200], '9-7': [760, 330], '9-4': [1010, 170], 'house:id-warung': [1250, 260], '9-5': [1280, 540], port: [1120, 800] },
    paths: { 'start>9-1': [[560, 870]], '9-1>bottle:5': [[330, 840]], '9-1>9-2': [[260, 650]], '9-2>9-6': [[340, 540]], '9-2>9-3': [[300, 290]], '9-3>9-7': [[640, 250]], '9-3>9-4': [[760, 150]], '9-4>house:id-warung': [[1140, 200]], '9-4>9-5': [[1230, 360]], '9-5>port': [[1260, 700]] },
    feat: [
      ['terraces', '#8ac86a', [[460, 560], [560, 360], [740, 300], [930, 340], [1000, 500], [920, 690], [720, 740], [540, 700]], 8],
      ['volcano', 740, 500, 78, { col: '#7a6a6a' }],
      ['trees', ['round', 'palm', 'round'], 780, 120, 120, 12], ['trees', 'palm', 560, 900, 100, 9], ['trees', 'palm', 1000, 900, 80, 7], ['trees', 'banana', 1150, 450, 110, 9],
      ['trees', 'round', 1380, 520, 60, 5], ['trees', 'palm', 220, 560, 60, 5],
      ['sprite', 'stilt', 300, 330, 16, { col: '#c8955a', roof: '#8a6a3a' }], ['sprite', 'stilt', 1100, 760, 15, { col: '#c8955a', roof: '#8a6a3a' }], ['sprite', 'stilt', 360, 600, 14, { col: '#d8a868', roof: '#8a6a3a' }],
      ['sprite', 'surfboard', 600, 900, 12, { col: '#ff5a6a' }], ['sprite', 'surfboard', 630, 905, 12, { col: '#38c8ff' }], ['sprite', 'umbrella', 690, 900, 13, { col: '#ffd23a' }],
      ['town', 1340, 640, 5, 40], ['town', 200, 640, 4, 30],
      ['sprite', 'rock', 1220, 960, 10, { sea: true }],
      ['landmark', 1400, 905, 40]
    ],
    flora: ['palm', 'round', 'banana', 'bush'], density: 44,
    scenes: { '9-1': 'surf', '9-2': 'kites', '9-3': 'volcano', '9-4': 'manta', '9-5': ['grove', { trees: ['round', 'palm', 'round'], critters: ['monkey', 'monkey'] }], '9-6': 'canopy', '9-7': 'bluefire' },
    live: [['kite', 170, 560, '#ff4f8a'], ['kite', 300, 400, '#ffd23a'], ['kite', 250, 620, '#38c8ff'], ['walk', 'monkey', [[1250, 640], [1320, 620], [1380, 600]], 8], ['sail', [[60, 780], [300, 980], [900, 990], [400, 940]], 10, '#f4ede0', '#ff8a3a'], ['sail', [[1450, 120], [1490, 600], [1470, 300]], 8, '#f4ede0', '#38a8e8'], ['fish', 1460, 720, '#ffd23a'], ['walk', 'gecko', [[880, 820], [920, 800]], 5]]
  },
  // Vietnam: a long land walked in an S from the bottom up: east along the train street to the bay of
  // limestone towers, back west past the lantern town on its river to the cave mountains, then north to the
  // citadel and east across the delta's rice paddies to the harbour; junks sail among the karsts
  vn: {
    labels: { '10-6': 'Mekong Market', 'house:vn-chonho': 'Chợ Nhỏ' },
    w: 1100, h: 1390,
    pal: { land: '#5a9a6a', light: '#a8c878', path: '#f0dc9c', sea: '#4a9a98' },
    trail: 'planks', bridge: 'rope',
    land: [[[60, 1330], [560, 1350], [860, 1320], [930, 1230], [880, 1160], [900, 1060], [1000, 970], [960, 830], [1000, 630], [1060, 410], [1000, 150], [800, 50], [480, 45], [200, 130], [150, 330], [230, 510], [130, 670], [90, 870], [200, 1010], [80, 1140]]],
    nodes: { start: [170, 1250], '10-1': [460, 1220], '10-2': [800, 1110], 'house:vn-chonho': [880, 920], '10-3': [700, 830], '10-6': [840, 530], '10-4': [330, 750], '10-5': [400, 380], port: [760, 210] },
    paths: { 'start>10-1': [[310, 1260]], '10-1>10-2': [[640, 1190]], '10-2>house:vn-chonho': [[860, 1010]], '10-2>10-3': [[780, 970]], '10-3>10-6': [[800, 670]], '10-3>10-4': [[520, 750]], '10-4>10-5': [[310, 570]], '10-5>port': [[560, 260]] },
    feat: [
      ['rail', [[60, 1160], [300, 1140], [600, 1140], [880, 1230]]],
      ['sprite', 'karst', 980, 1160, 22, { sea: true }], ['sprite', 'karst', 1040, 1090, 26, { sea: true }], ['sprite', 'karst', 970, 1270, 18, { sea: true }], ['sprite', 'karst', 1060, 1230, 20, { sea: true }], ['sprite', 'karst', 1060, 990, 16, { sea: true }],
      ['range', 'karst', [[170, 830, 26], [230, 920, 22], [450, 910, 20], [160, 570, 22], [480, 630, 24], [560, 550, 18]], {}],
      ['river', [[1000, 790], [840, 750], [700, 740], [560, 690], [400, 630], [300, 490], [180, 430]], 14],
      ['river', [[620, 430], [700, 330], [820, 290], [1040, 290]], 14], ['river', [[620, 430], [660, 240], [700, 50]], 12],
      ['paddies', '#a8d070', [[480, 510], [620, 530], [700, 410], [560, 330], [440, 390]]],
      ['paddies', '#b0d880', [[820, 210], [960, 240], [990, 140], [860, 100]]], ['paddies', '#a0c868', [[260, 290], [380, 270], [400, 170], [260, 170]]],
      ['wall', [[310, 430], [490, 430], [490, 320], [310, 320]], '#c8a070', true],
      ['trees', 'bamboo', 600, 1010, 100, 8], ['trees', 'palm', 880, 410, 80, 7], ['trees', 'dragonfruit', 640, 140, 70, 5],
      ['town', 300, 1210, 7, 50], ['town', 640, 870, 5, 40],
      ['sprite', 'lantern', 560, 830, 14, { col: '#ff5a3a' }], ['sprite', 'lantern', 780, 790, 14, { col: '#ffd23a' }], ['sprite', 'stilt', 900, 340, 15], ['sprite', 'stilt', 260, 390, 14],
      ['landmark', 120, 970, 50]
    ],
    flora: ['palm', 'bamboo', 'round', 'bush'], density: 40,
    scenes: { '10-1': 'trainstreet', '10-2': 'junks', '10-3': ['village', { wall: '#e8c870', walls: ['#e8c870', '#e8a060', '#c8d870'], roof: '#a84a3a', n: 6, lanterns: true, ground: '#d8c8a0' }], '10-4': 'cave', '10-5': 'moat', '10-6': ['floatmarket', { river: 1 }] },
    live: [['train', [[60, 1160], [300, 1140], [600, 1140], [880, 1230]], 40, '#e8423a', 4], ['sail', [[940, 1290], [1080, 1190], [1080, 970], [960, 1090]], 8, '#7a4a30', '#c8402a'], ['lanterns', 0, 5], ['walk', 'buffalo', [[480, 450], [560, 470], [640, 440]], 5], ['walk', 'goose', [[880, 150], [940, 160]], 6], ['circle', 330, 870, 60, 0.9]]
  },
  // Japan: a staircase of straight railway trails stepping down from the north-west, every turn a right angle,
  // as the line runs from the sushi harbour past the snowy cone to the neon blocks and the kappa garden;
  // the bullet train races along the coast, cherry petals fall
  jp: {
    labels: { '11-6': 'Capsule Toys', '11-1': 'Sushi', '11-7': 'Fuji Thermals' },
    w: 1600, h: 960,
    pal: { land: '#8ab496', light: '#c8dcae', path: '#f4ead4', sea: '#6aaac0' },
    trail: 'rail', tufts: 'flowers', flowerCols: ['#ffb7c9', '#ffffff'],
    land: [[[140, 70], [700, 60], [1200, 80], [1470, 140], [1540, 400], [1520, 700], [1450, 900], [900, 910], [400, 900], [90, 820], [60, 400]]],
    nodes: { start: [200, 160], '11-1': [520, 160], '11-2': [520, 440], '11-7': [240, 620], '11-3': [880, 440], 'house:jp-omise': [880, 210], '11-4': [880, 720], '11-6': [620, 790], '11-5': [1260, 720], port: [1260, 420] },
    paths: { 'start>11-1': [[360, 160]], '11-1>11-2': [[520, 300]], '11-2>11-7': [[520, 620]], '11-2>11-3': [[700, 440]], '11-3>house:jp-omise': [[880, 330]], '11-3>11-4': [[880, 580]], '11-4>11-6': [[750, 790]], '11-4>11-5': [[1070, 720]], '11-5>port': [[1260, 570]] },
    feat: [
      ['rail', [[90, 860], [500, 880], [1000, 880], [1430, 860], [1500, 600], [1480, 250]]],
      ['blocks', [[960, 500], [1160, 500], [1180, 640], [960, 650]], { step: 34, street: 9, cols: ['#4a4a6a', '#5a4a7a', '#3a5a7a'], road: '#2a2a3a', lit: true }],
      ['blocks', [[640, 240], [780, 250], [780, 360], [640, 370]], { step: 34, street: 9, cols: ['#e8d8c8', '#d8c8b8', '#c8d0d8'], road: '#a8a0a8' }],
      ['volcano', 250, 400, 74, { lava: false, col: '#7a86a8' }],
      ['lake', [[1180, 780], [1260, 800], [1290, 850], [1200, 860], [1150, 830]]],
      ['trees', 'cherry', 680, 620, 110, 10], ['trees', 'cherry', 400, 760, 90, 7], ['trees', 'bamboo', 1100, 300, 110, 10], ['trees', 'bonsai', 1380, 600, 70, 5], ['trees', 'cherry', 1380, 300, 60, 5],
      ['sprite', 'onigiri', 400, 560, 18], ['sprite', 'onigiri', 1080, 820, 16], ['sprite', 'onigiri', 720, 160, 14],
      ['sprite', 'neon', 1000, 470, 14, { v: 0.2 }], ['sprite', 'neon', 1120, 470, 16, { v: 0.6 }], ['sprite', 'neon', 1180, 600, 13, { v: 0.9 }],
      ['town', 620, 110, 5, 40, 'flat'], ['town', 1360, 160, 4, 40],
      ['landmark', 1420, 470, 52]
    ],
    flora: ['bonsai', 'cherry', 'round'], density: 34,
    scenes: { '11-1': 'sushi', '11-2': 'bullettrain', '11-3': 'bamboonight', '11-4': 'neon', '11-5': 'kappapond', '11-6': 'gacha', '11-7': 'glider' },
    live: [['train', [[90, 860], [500, 880], [1000, 880], [1430, 860], [1500, 600], [1480, 250]], 90, '#38a8e8', 5], ['flakes', 560, 520, 820, 720, 14, '#ffc8d8', true], ['walk', 'shiba', [[300, 250], [380, 240], [420, 260]], 10], ['sail', [[160, 30], [800, 25], [1200, 40], [700, 50]], 12], ['fish', 1220, 820, '#ff7a3a']]
  },
  // Nepal: a mountain rising out of a sea of clouds, climbed in switchbacks from the valley airstrip at the
  // bottom: the rope bridges over the glacier river, the yak meadows, the blizzard camp, the icefall, and the
  // Baron's fortress under the summit; yaks plod, an eagle circles, snow falls up high
  np: {
    labels: { '12-1': 'Rope Bridges', '12-5': 'Fortress', '12-7': 'Supply Depot', '12-4': 'Icefall' },
    w: 1100, h: 1390,
    pal: { sea: '#dbe6f2', deep: '#aebfda', cliff: '#7a6a66', beach: '#a89a88', land: '#78a67a', path: '#f4e4c4' },
    sea: 'clouds', coast: 'rock', trail: 'prints', bridge: 'rope', foam: false,
    land: [[[120, 1300], [80, 1000], [110, 700], [170, 420], [300, 200], [520, 80], [760, 100], [940, 250], [1010, 520], [1020, 820], [990, 1120], [900, 1320], [520, 1360]]],
    nodes: { start: [250, 1240], '12-1': [650, 1210], 'house:np-pasal': [870, 1060], '12-2': [350, 1010], '12-6': [200, 780], '12-3': [780, 870], '12-7': [880, 640], '12-4': [370, 610], '12-5': [700, 340], port: [420, 230, 'w'] },
    paths: { 'start>12-1': [[450, 1270]], '12-1>house:np-pasal': [[780, 1150]], '12-1>12-2': [[480, 1100]], '12-2>12-6': [[230, 900]], '12-6>12-4': [[260, 680]], '12-2>12-3': [[580, 940]], '12-3>12-7': [[860, 760]], '12-3>12-4': [[580, 740]], '12-4>12-5': [[540, 460]], '12-5>port': [[560, 250]] },
    feat: [
      ['patch', '#9ab88a', [[120, 1000], [500, 900], [900, 920], [1000, 1150], [800, 1320], [200, 1300]]],
      ['terraces', '#a8c47a', [[540, 1110], [700, 1090], [800, 1160], [700, 1210], [560, 1200]], 4, false],
      ['patch', '#a8a094', [[170, 560], [500, 470], [900, 500], [1010, 640], [900, 760], [500, 720], [200, 700]]],
      ['snow', [[260, 260], [520, 100], [760, 110], [930, 260], [990, 480], [800, 450], [500, 420], [280, 470]]],
      ['river', [[620, 470], [560, 600], [640, 760], [520, 900], [600, 1060], [560, 1180], [600, 1340]], 14],
      ['range', 'mtn', [[600, 150, 70], [820, 230, 56], [380, 260, 44], [960, 420, 46], [220, 460, 40]], { snow: true }],
      ['range', 'mtn', [[150, 900, 36], [960, 980, 40], [1000, 700, 34]], { snow: false, col: '#8a8a9a' }],
      ['trees', 'pine', 200, 1150, 100, 9], ['trees', 'pine', 900, 1200, 70, 6], ['trees', 'snowpine', 520, 800, 80, 6], ['trees', 'snowpine', 920, 560, 60, 4],
      ['sprite', 'momo', 300, 880, 12], ['sprite', 'momo', 330, 900, 9], ['sprite', 'momo', 700, 1000, 11], ['sprite', 'tent', 860, 900, 14, { col: '#ffd23a', stripe: '#e8423a' }],
      ['sprite', 'bigstone', 460, 560, 14], ['sprite', 'bigstone', 760, 520, 16],
      ['town', 280, 1300, 4, 34], ['landmark', 140, 600, 46]
    ],
    flora: ['pine', 'snowpine', 'rock', 'pine'], density: 38,
    scenes: { '12-1': 'gorge', '12-2': ['herd', { animal: 'yak' }], '12-3': 'camp', '12-4': 'seracs', '12-6': 'crevasse', '12-7': 'depot' },
    live: [['walk', 'yak', [[420, 1080], [500, 1050], [560, 1000]], 5], ['walk', 'yak', [[250, 1100], [300, 1120]], 4], ['circle', 600, 680, 110, 1.3], ['flakes', 200, 90, 1000, 500, 40], ['walk', 'redpanda', [[150, 1180], [200, 1200]], 5]]
  },
  // Antarctica: a horseshoe of ice shelf around a dark bay full of pack ice, walked up its east arm, west along
  // its top and over an ice bridge to the floe of Big Tusk; penguin rookeries, a station with a blinking mast,
  // crevasses, igloos; seals pop up in the bay, a whale spouts, snow falls
  aq: {
    labels: { '13-4': 'Big Tusk' },
    w: 1500, h: 1000,
    pal: { sea: '#2a5a8a', deep: '#142f54', land: '#e4f0f6', light: '#ffffff', path: '#bcd6ea', beach: '#cfe6f2', cliff: '#86b2d0', wall: '#ffd23a', roof: '#e8423a' },
    sea: 'pack', coast: 'ice', trail: 'prints', bridge: 'ice', tufts: 'snow', meadow: false, foamY: 24,
    land: [[[1420, 900], [1440, 600], [1380, 300], [1200, 120], [800, 70], [400, 80], [120, 160], [50, 320], [120, 410], [350, 390], [600, 410], [800, 430], [1010, 480], [1090, 620], [1110, 900], [1260, 950]],
      [[400, 520], [200, 470], [60, 560], [40, 760], [150, 900], [350, 900], [440, 760], [450, 600]],
      [[940, 640], [820, 600], [720, 660], [740, 760], [860, 790], [940, 740]]],
    nodes: { start: [1270, 830], '13-1': [1250, 520], '13-5': [830, 700], '13-2': [960, 230], '13-3': [540, 260], 'house:aq-store': [240, 230], '13-4': [260, 620], port: [250, 810] },
    paths: { 'start>13-1': [[1230, 680]], '13-1>13-5': [[1030, 640]], '13-1>13-2': [[1160, 330]], '13-2>13-3': [[750, 200]], '13-3>house:aq-store': [[390, 220]], '13-3>13-4': [[450, 430], [350, 540]], '13-4>port': [[200, 720]] },
    feat: [
      ['cracks', [[1380, 400], [1120, 300], [1020, 460], [1100, 700], [1350, 720]], 9],
      ['cracks', [[800, 120], [400, 120], [200, 300], [600, 360], [800, 300]], 8],
      ['snow', [[380, 640], [200, 560], [80, 660], [100, 820], [300, 860], [400, 760]]],
      ['range', 'mtn', [[1080, 150, 46], [680, 120, 40], [320, 130, 44], [1360, 450, 34]], { col: '#c6dcec', snow: true }],
      ['trees', 'penguin', 1360, 650, 70, 8], ['trees', 'penguin', 800, 340, 80, 9], ['trees', 'penguin', 160, 800, 60, 6], ['trees', 'penguin', 860, 720, 40, 3],
      ['sprite', 'igloo', 1180, 420, 14], ['sprite', 'igloo', 380, 330, 14], ['sprite', 'snowman', 1100, 760, 12], ['sprite', 'snowman', 640, 160, 11],
      ['sprite', 'seal', 300, 860, 14], ['sprite', 'seal', 1040, 580, 12],
      ['sprite', 'berg', 740, 500, 30, { sea: true }], ['sprite', 'berg', 580, 640, 24, { sea: true }], ['sprite', 'berg', 1440, 140, 26, { sea: true }], ['sprite', 'berg', 40, 960, 22, { sea: true }], ['sprite', 'berg', 620, 900, 28, { sea: true }],
      ['landmark', 1380, 760, 46]
    ],
    flora: ['rock', 'penguin', 'rock'], density: 30,
    scenes: { '13-1': 'bowling', '13-2': 'aurora', '13-3': 'station', '13-4': 'walrus', '13-5': 'colony' },
    live: [['seal', 650, 560], ['seal', 940, 880], ['spout', 520, 760], ['walk', 'penguin', [[1200, 600], [1140, 620], [1080, 600]], 6], ['walk', 'penguin', [[350, 700], [290, 720]], 5], ['flakes', 60, 60, 1440, 960, 46], ['circle', 900, 420, 90, 0.9]]
  },
  // World 22: pastel islands in a violet sea, clocks and crystals, the mirror lake
  w22: {
    labels: { '22-1': 'Clocks', '22-2': 'Corridor', '22-5': "Writer's Desk" },
    w: 1500, h: 820,
    pal: { sea: '#5c4ca0', deep: '#2e2460', cliff: '#5a5a8a', path: '#fff0c8' },
    land: [[[80, 560], [140, 400], [320, 300], [560, 260], [820, 240], [1080, 260], [1320, 330], [1430, 480], [1380, 640], [1180, 720], [900, 760], [600, 760], [320, 740], [130, 680]]],
    nodes: { start: [190, 600], '22-1': [380, 620], '22-2': [760, 660], '22-3': [1130, 600], '22-4': [770, 380], '22-5': [400, 385], port: [1100, 330, 'n'] },
    paths: { '22-3>22-4': [[980, 460]], '22-2>22-5': [[560, 520]], '22-4>port': [[940, 330]] },
    feat: [
      ['lake', [[1200, 480], [1300, 460], [1355, 545], [1285, 610], [1205, 585]]],
      ['fields', '#c8b8e8', [[480, 600], [640, 560], [700, 700], [520, 720]], ['#d8ccf0', '#b8a8d8'], 0.78, 'bands'],
      ['trees', 'clock', 560, 330, 80, 4], ['trees', 'crystal', 1000, 680, 80, 5], ['landmark', 600, 520, 56]
    ],
    flora: ['crystal', 'clock'], density: 16,
    scenes: { '22-1': 'clocks', '22-2': 'doors', '22-3': 'mirror', '22-4': 'bigdoor', '22-5': 'desk' }
  }
};
