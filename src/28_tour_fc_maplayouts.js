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
  // France: Paris on the river with the iron tower (daylight), the lavender fields, the abbey islet in the bay
  // (drawn as a plain rock town), the truffle woods, the château, balloons
  fr: {
    w: 1600, h: 960,
    land: [[[70, 560], [110, 380], [230, 270], [420, 200], [600, 120], [860, 90], [1120, 110], [1340, 180], [1500, 300], [1550, 480], [1510, 640], [1380, 700], [1250, 700], [1120, 760], [1040, 880], [800, 910], [520, 920], [280, 900], [100, 800]],
      [[1255, 800], [1330, 768], [1405, 800], [1395, 862], [1300, 885], [1245, 850]]],
    nodes: { start: [170, 700], '7-1': [370, 720], '7-2': [780, 790], '7-3': [1325, 822], '7-4': [1290, 470], '7-5': [790, 255], '7-6': [420, 410, 'e'], '7-7': [800, 520], 'house:fr-brocante': [1180, 255], port: [1040, 150, 'n'] },
    paths: { 'start>7-1': [[260, 730]], '7-1>7-2': [[580, 790]], '7-2>7-3': [[1000, 800], [1180, 805]], '7-3>7-4': [[1400, 720], [1330, 590]], '7-4>7-5': [[1040, 330]], '7-1>7-6': [[350, 560]], '7-3>7-7': [[1060, 660]], '7-4>house:fr-brocante': [[1260, 350]], '7-5>port': [[920, 175]] },
    feat: [
      ['river', [[200, 300], [300, 400], [430, 470], [520, 530], [570, 640], [600, 770], [640, 930]], 16],
      ['fields', '#7a8a5a', [[640, 600], [770, 590], [910, 630], [930, 710], [700, 710]], ['#9a6ad8', '#a682e0'], 0.3],
      ['trees', 'round', 1320, 360, 110, 10], ['trees', 'poplar', 620, 330, 90, 8], ['trees', 'cypress', 980, 700, 60, 4],
      ['town', 470, 800, 6, 45], ['landmark', 225, 530, 60]
    ],
    flora: ['round', 'poplar', 'cypress'], density: 32,
    scenes: { '7-1': 'paris', '7-2': 'lavender', '7-3': 'islet', '7-4': 'truffle', '7-5': 'garden', '7-6': ['barges', { river: 0 }], '7-7': 'balloons' },
    live: [['sail', [[1100, 940], [1590, 900], [1590, 720], [1250, 950]], 10]]
  },
  // the Netherlands: polders and canals, tulip stripes, windmills, the frozen canals, the old weigh house town
  nl: {
    w: 1600, h: 960,
    land: [[[60, 520], [120, 330], [300, 220], [540, 170], [800, 140], [1060, 150], [1300, 200], [1470, 320], [1540, 500], [1510, 700], [1400, 860], [1150, 910], [850, 890], [560, 915], [290, 900], [100, 800]]],
    nodes: { start: [160, 620], '8-1': [360, 700], '8-2': [780, 790], '8-3': [1190, 760], '8-4': [1290, 470], '8-5': [790, 250], '8-6': [800, 520], 'house:nl-winkel': [400, 450], port: [1140, 220] },
    paths: { 'start>8-1': [[250, 680]], '8-1>8-2': [[560, 780]], '8-2>8-3': [[990, 800]], '8-3>8-4': [[1300, 620]], '8-4>8-5': [[1050, 330]], '8-2>8-6': [[800, 650]], '8-6>8-4': [[1050, 500]], '8-1>house:nl-winkel': [[360, 570]], '8-5>port': [[970, 210]] },
    feat: [
      ['fields', '#6a9a4a', [[420, 790], [540, 760], [660, 820], [640, 880], [460, 880]], ['#ff4a5a', '#ffd23a', '#ff8ad0', '#ffffff', '#ff7a1a'], 0.12, 'bands'],
      ['fields', '#7ac860', [[120, 420], [300, 320], [420, 360], [300, 520], [160, 540]], ['#86cc6a', '#6ab45a'], -0.2, 'bands'],
      ['fields', '#7ac860', [[930, 600], [1080, 570], [1120, 680], [960, 700]], ['#86cc6a', '#6ab45a'], 0.5, 'bands'],
      ['river', [[540, 170], [560, 300], [600, 420], [640, 560], [660, 700], [680, 920]], 12],
      ['river', [[900, 650], [1100, 620], [1300, 560], [1540, 520]], 12],
      ['snow', [[1180, 380], [1400, 360], [1450, 520], [1300, 560], [1180, 520]]],
      ['sprite', 'windmill', 220, 650, 18], ['sprite', 'windmill', 520, 640, 18], ['sprite', 'windmill', 980, 420, 18], ['sprite', 'windmill', 1420, 700, 18],
      ['town', 620, 250, 8, 70], ['landmark', 1390, 260, 56]
    ],
    flora: ['willow', 'round', 'poplar'], density: 26,
    scenes: { '8-1': ['windmills', { n: 2, ground: '#86cc6a', wall: '#7a5a4a', roof: '#3a3a4a' }], '8-2': 'greenhouse', '8-3': 'bikes', '8-4': 'skating', '8-5': 'canalhouses', '8-6': ['windmills', { n: 3, ground: '#9ad07a' }] },
    live: [['sail', [[60, 700], [80, 940], [500, 960], [200, 900]], 9]]
  },
  // Bali: the surf beach, the kite fields, the volcano, the manta jetty, the rice terraces, the monkey forest
  id: {
    labels: { '9-3': 'Batur', '9-2': 'Kites' },
    w: 1600, h: 960,
    land: [[[90, 600], [160, 420], [330, 300], [560, 220], [820, 180], [1060, 190], [1280, 240], [1450, 340], [1530, 520], [1470, 700], [1300, 820], [1060, 880], [800, 900], [520, 900], [280, 860], [120, 760]]],
    nodes: { start: [180, 680], '9-1': [380, 770], 'bottle:5': [270, 815], '9-2': [780, 800], '9-3': [1180, 700], '9-4': [1380, 470, 'w'], '9-5': [800, 285], '9-6': [380, 440], '9-7': [800, 545], 'house:id-warung': [1170, 290], port: [1000, 215, 'n'] },
    paths: { 'start>9-1': [[260, 740]], '9-1>9-2': [[580, 820]], '9-2>9-3': [[990, 780]], '9-3>9-4': [[1320, 600]], '9-4>9-5': [[1150, 420], [950, 330]], '9-2>9-6': [[560, 620]], '9-3>9-7': [[1000, 620]], '9-4>house:id-warung': [[1320, 330]], '9-5>port': [[900, 200]] },
    feat: [
      ['volcano', 1085, 520, 64], ['paddies', '#9ccf6b', [[470, 520], [640, 470], [700, 600], [600, 700], [470, 660]]],
      ['trees', ['palm', 'round'], 260, 500, 120, 14], ['trees', 'round', 660, 330, 100, 10], ['trees', 'palm', 520, 820, 80, 6],
      ['landmark', 610, 580, 64]
    ],
    flora: ['palm', 'round', 'bush'], density: 34,
    scenes: { '9-1': 'surf', '9-2': 'kites', '9-3': 'volcano', '9-4': 'manta', '9-5': ['grove', { trees: ['round', 'palm', 'round'], critters: ['monkey', 'monkey'] }], '9-6': 'canopy', '9-7': 'bluefire' },
    live: [['sail', [[60, 780], [300, 950], [900, 950], [400, 900]], 10]]
  },
  // Vietnam: train street, the bay of limestone towers, the lantern town, the cave mountains, the delta
  // market, the citadel
  vn: {
    labels: { '10-6': 'Mekong Market' },
    w: 1600, h: 960,
    land: [[[80, 700], [100, 560], [200, 450], [330, 380], [420, 260], [560, 170], [800, 130], [1040, 140], [1250, 190], [1400, 300], [1450, 450], [1420, 600], [1500, 720], [1450, 860], [1200, 900], [920, 880], [620, 900], [340, 880], [160, 820]]],
    nodes: { start: [180, 760], '10-1': [380, 740], '10-2': [780, 700], '10-3': [1190, 760], '10-4': [1290, 470], '10-5': [790, 260], '10-6': [1010, 520], 'house:vn-chonho': [430, 470], port: [1150, 195] },
    paths: { 'start>10-1': [[270, 760]], '10-1>10-2': [[580, 760]], '10-2>10-3': [[1000, 740]], '10-3>10-4': [[1290, 620]], '10-4>10-5': [[1050, 330]], '10-3>10-6': [[1100, 620]], '10-2>house:vn-chonho': [[580, 560]], '10-5>port': [[970, 200]] },
    feat: [
      ['lake', [[620, 810], [760, 780], [900, 800], [950, 865], [860, 905], [680, 905]]],
      ['sprite', 'karst', 700, 860, 22, { sea: true }], ['sprite', 'karst', 790, 850, 26, { sea: true }], ['sprite', 'karst', 880, 870, 20, { sea: true }],
      ['range', 'karst', [[1380, 400, 26], [1420, 540, 22], [1200, 390, 24], [1250, 340, 20]], {}],
      ['river', [[900, 600], [960, 660], [1010, 720], [1050, 800], [1060, 900]], 14],
      ['paddies', '#a8d070', [[290, 560], [500, 520], [560, 640], [420, 680], [280, 660]]],
      ['trees', 'bamboo', 600, 330, 90, 7], ['town', 1300, 820, 6, 50], ['town', 640, 250, 5, 50],
      ['landmark', 1420, 250, 54]
    ],
    flora: ['palm', 'bamboo', 'round'], density: 30,
    scenes: { '10-1': 'trainstreet', '10-2': 'junks', '10-3': ['village', { wall: '#e8c870', walls: ['#e8c870', '#e8a060', '#c8d870'], roof: '#a84a3a', n: 6, lanterns: true, ground: '#d8c8a0' }], '10-4': 'cave', '10-5': 'moat', '10-6': ['floatmarket', { river: 0 }] },
    live: [['sail', [[1450, 900], [1590, 940], [1590, 640], [1520, 900]], 9, '#7a4a30', '#c8402a']]
  },
  // Japan: the sushi harbour, the bullet train line, the snowy cone, the bamboo night woods, the neon towers,
  // the kappa garden pond
  jp: {
    labels: { '11-6': 'Capsule Toys', '11-1': 'Sushi' },
    w: 1600, h: 960,
    land: [[[80, 720], [140, 560], [300, 470], [420, 330], [600, 230], [820, 160], [1060, 120], [1300, 150], [1480, 240], [1530, 400], [1450, 560], [1350, 700], [1200, 820], [960, 890], [680, 900], [420, 890], [200, 840]]],
    nodes: { start: [180, 760], '11-1': [380, 760], '11-2': [780, 790], '11-3': [1180, 700], '11-4': [1310, 470], '11-5': [800, 285], '11-6': [1290, 245, 'w'], '11-7': [380, 480], 'house:jp-omise': [820, 525], port: [610, 300, 'n'] },
    paths: { 'start>11-1': [[270, 780]], '11-1>11-2': [[580, 820]], '11-2>11-3': [[1000, 780]], '11-3>11-4': [[1280, 600]], '11-4>11-5': [[1060, 380]], '11-2>11-7': [[560, 620]], '11-3>house:jp-omise': [[1000, 600]], '11-4>11-6': [[1360, 360]], '11-5>port': [[680, 255]] },
    feat: [
      ['volcano', 545, 440, 70, { lava: false, col: '#7a86a8' }],
      ['trees', 'bamboo', 1150, 600, 110, 10], ['trees', 'cherry', 680, 660, 120, 10], ['trees', 'bonsai', 420, 620, 80, 5],
      ['lake', [[880, 300], [960, 290], [990, 340], [930, 362], [870, 342]]],
      ['town', 1400, 520, 6, 50, 'flat'], ['town', 400, 850, 5, 40]
    ],
    flora: ['bonsai', 'cherry', 'round'], density: 30,
    scenes: { '11-1': 'sushi', '11-2': 'bullettrain', '11-3': 'bamboonight', '11-4': 'neon', '11-5': 'kappapond', '11-6': 'gacha', '11-7': 'glider' },
    live: [['sail', [[60, 760], [120, 940], [700, 950], [300, 900]], 10]]
  },
  // Nepal: highlands above a sea of clouds; rope bridges over the rivers, the yak pass, the icefall, the
  // supply depot, the Baron's fortress under the snow peaks
  np: {
    labels: { '12-1': 'Rope Bridges', '12-5': 'Fortress', '12-7': 'Supply Depot', '12-4': 'Icefall' },
    w: 1600, h: 960,
    pal: { sea: '#dbe6f2', deep: '#aebfda', cliff: '#7a6a66', beach: '#c9c0a8' },
    land: [[[60, 620], [110, 430], [260, 300], [460, 220], [700, 180], [960, 170], [1220, 190], [1430, 280], [1540, 450], [1520, 650], [1440, 820], [1200, 900], [900, 880], [620, 910], [340, 890], [130, 820]]],
    nodes: { start: [170, 720], '12-1': [380, 740], '12-2': [780, 790], '12-3': [1180, 760], '12-4': [1290, 480], '12-5': [790, 255], '12-6': [560, 330, 'n'], '12-7': [800, 530], 'house:np-pasal': [380, 480], port: [1150, 230] },
    paths: { 'start>12-1': [[260, 740]], '12-1>12-2': [[580, 790]], '12-2>12-3': [[990, 820]], '12-3>12-4': [[1300, 630]], '12-4>12-5': [[1050, 340]], '12-2>12-6': [[640, 560]], '12-6>12-4': [[900, 420]], '12-3>12-7': [[1000, 640]], '12-1>house:np-pasal': [[340, 620]], '12-5>port': [[970, 225]] },
    feat: [
      ['snow', [[440, 240], [700, 190], [1000, 180], [1250, 210], [1300, 300], [1000, 320], [700, 300], [460, 320]]],
      ['range', 'mtn', [[200, 420, 50], [300, 330, 60], [690, 195, 60], [1000, 215, 60], [1350, 330, 58], [1450, 560, 50], [1110, 330, 44]], { snow: true }],
      ['river', [[460, 560], [480, 680], [520, 800], [560, 900]], 16], ['river', [[1050, 520], [1060, 640], [1080, 760], [1100, 900]], 14],
      ['landmark', 1430, 690, 60]
    ],
    flora: ['pine', 'snowpine', 'rock'], density: 34,
    scenes: { '12-1': 'gorge', '12-2': ['herd', { animal: 'yak' }], '12-3': 'camp', '12-4': 'seracs', '12-6': 'crevasse', '12-7': 'depot' }
  },
  // Antarctica: the ice shelf, penguins, the station, icebergs in a dark sea
  aq: {
    labels: { '13-4': 'Big Tusk' },
    w: 1500, h: 820,
    pal: { sea: '#2f6496', deep: '#173a64', land: '#e6f2f8', light: '#ffffff', path: '#bcd6ea', beach: '#cfe6f2', cliff: '#86b2d0', wall: '#ffd23a', roof: '#e8423a' },
    land: [[[60, 560], [120, 380], [300, 250], [560, 180], [860, 160], [1140, 190], [1360, 290], [1450, 460], [1400, 640], [1240, 740], [960, 770], [640, 780], [340, 760], [130, 690]]],
    nodes: { start: [180, 600], '13-1': [370, 625], '13-2': [740, 660], '13-3': [1120, 620], '13-4': [760, 360], '13-5': [380, 335], 'house:aq-store': [1250, 420], port: [1060, 260, 'n'] },
    paths: { '13-3>13-4': [[980, 450]], '13-3>house:aq-store': [[1230, 540]], '13-4>port': [[900, 280]] },
    feat: [
      ['sprite', 'berg', 190, 170, 30, { sea: true }], ['sprite', 'berg', 1380, 140, 34, { sea: true }], ['sprite', 'berg', 1440, 760, 26, { sea: true }], ['sprite', 'berg', 260, 790, 22, { sea: true }],
      ['range', 'mtn', [[560, 300, 44], [1290, 560, 40], [200, 470, 34]], { col: '#c6dcec', snow: true }],
      ['trees', 'penguin', 580, 520, 80, 7], ['landmark', 940, 260, 56]
    ],
    flora: ['rock', 'penguin'], density: 14,
    scenes: { '13-1': 'bowling', '13-2': 'aurora', '13-3': 'station', '13-4': 'walrus', '13-5': 'colony' }
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
