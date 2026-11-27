/* ============================================================
   THE SPARE BONE QUARRY: the levels (world 37) and the land's map. A hidden bonus land at about Nepal's level
   (d0 0.8): each stage teaches its one new idea where a slip costs nothing, tests it among the critters, then
   twists it ("late on / the last one"); the last ordinary stage and the boss are the hardest.
   37-1 WALK LIKE THIS (trackway)  footprint trackways raise giant stone steps; the last creature walked backwards
   (37-2 to 37-5 below.)
   ============================================================ */
(function () {
const C = Tour.countries.bone;
if (!C) return;
const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
const put = (Gr, x, y, str) => { for (let k = 0; k < str.length; k++) if (x + k >= 0 && x + k < Gr[0].length) Gr[y][x + k] = str[k]; };
const fillG = (Gr, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) Gr[y][x] = ch; };
const ground = (Gr, x0, x1, top, ch) => fillG(Gr, x0, top, x1, Gr.length - 1, ch || '#');
const pit = (Gr, x0, x1) => fillG(Gr, x0, 0, x1, Gr.length - 1, '.');
const rowsOf = Gr => Gr.map(r => r.join(''));
const stamps = {};
// a secret room's old stamp: the way back out (its door) and its prize; the room kind builds the room from it
const oldRoom = (to, items, look) => ({ floor: 12, rows: ['##############################', '#............................#'].concat(Array(9).fill('#............................#')).concat(['#.@D.....................?...#', '##############################', '##############################']), items, doors: [{ to, look: look || 'boneHatch' }] });
const SIGN = text => ['spawn', 'sign', { text }];

/* ---------------- 37-1 Walk Like This ---------------- */
// ① the teach: a plinth, three prints, a pair raises two stone steps up the first cliff (P1 over it); ② the test: four
// prints in two pairs with a dust brush sweeping between them and a rook overhead; each pair raises two steps up to
// the high bench; ③ the low quarry floor: a tunnel under a thin strata ceiling (a gap in it, the whiskers' tell: the
// run on top leads to the great hall), the scree pit (P3), and the twist: a trackway up a staircase whose toes all
// point back down. Follow the toes: top print first, down to the bottom one, and the last steps rise to the gate.
const walkRows = (() => {
  const W = 236, H = 26, Gr = grid(W, H, '.');
  // ① the teach
  ground(Gr, 0, 32, 19); put(Gr, 3, 18, '@'); put(Gr, 7, 18, 'n'); put(Gr, 10, 18, 'k'); put(Gr, 13, 15, '?');
  put(Gr, 16, 18, '1'); put(Gr, 19, 16, 'o.o.o.o');
  ground(Gr, 33, 56, 13); put(Gr, 38, 10, '*'); put(Gr, 40, 11, 'o.o.o'); put(Gr, 46, 12, 'e'); put(Gr, 35, 12, 'l'); put(Gr, 52, 12, 'r');
  // ② the test
  ground(Gr, 57, 74, 19); put(Gr, 60, 18, 'c'); put(Gr, 66, 18, 'w'); put(Gr, 70, 18, 'r');
  pit(Gr, 75, 77); put(Gr, 74, 15, 'o.o.o');
  ground(Gr, 78, 104, 19); put(Gr, 79, 18, 'N'); put(Gr, 81, 18, '2'); put(Gr, 89, 18, 'u'); put(Gr, 91, 12, 'M');
  ground(Gr, 105, 130, 9); put(Gr, 110, 8, 'c'); put(Gr, 112, 5, '?'); put(Gr, 116, 7, 'o.o.o.o'); put(Gr, 122, 8, 'e'); put(Gr, 127, 8, 'l');
  // ③ the low floor: the tunnel under a thin strata ceiling, with walls up from its ends (the run on top is a secret)
  ground(Gr, 131, W - 1, 21); put(Gr, 136, 20, 'c'); put(Gr, 133, 20, 'w');
  fillG(Gr, 141, 17, 169, 17, 'H'); fillG(Gr, 140, 9, 140, 17, 'H'); fillG(Gr, 170, 9, 170, 17, 'H');
  fillG(Gr, 154, 17, 155, 17, '.'); fillG(Gr, 154, 20, 155, 20, 'H'); put(Gr, 153, 18, 'x');
  put(Gr, 144, 19, 'o.o.o'); put(Gr, 160, 19, 'o.o.o.o');
  // the run on top of the ceiling: coins, a plaster block to hop, a rook, the hidden 1UP, P2, the hall's hatch
  put(Gr, 143, 15, 'o.o.o.o.o'); put(Gr, 147, 12, 'h'); put(Gr, 158, 13, 'A'); fillG(Gr, 161, 15, 162, 16, 'B'); put(Gr, 156, 10, 'M'); put(Gr, 165, 14, 'o.o'); put(Gr, 168, 16, 'D');
  put(Gr, 174, 20, 'a'); put(Gr, 176, 20, 'c');
  // the scree pit (P3 over it), a rook
  pit(Gr, 179, 182); put(Gr, 180, 15, 'R'); put(Gr, 178, 13, 'M'); put(Gr, 184, 20, 'e');
  // the twist: the staircase trackway (toes point back down), the last steps up to the gate's bench
  put(Gr, 187, 20, '3'); put(Gr, 186, 20, 'N');
  ground(Gr, 190, 192, 19); ground(Gr, 193, 195, 17); ground(Gr, 196, 198, 15); ground(Gr, 199, 201, 13);
  ground(Gr, 204, W - 1, 9); put(Gr, 212, 8, 'r'); put(Gr, 218, 8, 'l'); put(Gr, 228, 8, 'G'); put(Gr, 222, 8, 'k');
  fillG(Gr, W - 1, 0, W - 1, 8, '#');
  return rowsOf(Gr);
})();
const T1 = { prints: [[19, 19, 2, 0], [22, 19, 0, 0], [25, 19, 1, 0]], order: [2, 1], plinth: [16, 19], raise: [[2, [[29, 17, 30, 18], [31, 15, 32, 18]]]], gs: [0] };
const T2 = { prints: [[84, 19, 4, 0], [88, 19, 3, 0], [92, 19, 2, 0], [96, 19, 0, 0]], order: [1, 3, 2, 0], plinth: [81, 19], raise: [[2, [[97, 17, 98, 18], [99, 15, 100, 18]]], [4, [[101, 13, 102, 18], [103, 11, 104, 18]]]], gs: [1, 2] };
const T3 = { mode: 'toes', prints: [[191, 19, 4, -1], [194, 17, 4, -1], [197, 15, 4, -1], [200, 13, 4, -1]], order: [3, 2, 1, 0], plinth: [187, 21], raise: [[4, [[202, 11, 203, 20]]]], gs: [3] };
stamps.boneWalk = { floor: 21, rows: walkRows, gold: { '*': 'must', A: 'hidden', R: 'risky' }, items: ['power', 'power'], hidden: ['oneup'], doors: [{ to: 'hall@in', look: 'boneHatch' }], legend: {
  n: SIGN('A TRACKWAY! THE PLINTH SHOWS THE NEXT FOOT. JUMP ONTO THE PRINT THAT FITS. EACH PAIR RAISES THE STONE STEPS'),
  N: SIGN('A WRONG FOOT ONLY STARTS THE PAIR AGAIN. WATCH THE BRUSH: IT SWEEPS AT YOUR SHOES'),
  k: ['decor', 'boneCrate'], l: ['decor', 'boneLabel'], r: ['decor', 'boneRock'],
  e: ['enemy', 'boneMouse'], w: ['enemy', 'boneNewt'], u: ['enemy', 'boneBrush'], M: ['enemy', 'boneRook'],
  '1': ['piece', 'bone.track', T1], '2': ['piece', 'bone.track', T2], '3': ['piece', 'bone.track', T3],
  x: ['decor', 'boneTellCeil'], a: ['anchor', 'hallOut']
} };
stamps.boneHallOld = oldRoom('quarry@hallOut', ['oneup']);
const L1 = { n: 1, name: 'Walk Like This', mapLabel: 'Walk Like This', arch: 'trackway', theme: 'bone_quarry',
  gimmick: 'Footprint trackways: the plinth shows the creature\'s next foot; jump onto the print that fits it, and every pair raises giant stone steps. The last one walked backwards',
  hint: 'Jump ONTO the print: walking across one does nothing. At the end, follow the toes, not the slope. A mouse\'s whiskers twitch under a crack in the tunnel roof...',
  postcard: 'Brady! A crate of plaster fossils fell down a quarry and they put themselves back together. One has a foot where its ear should be. He seems happy. ♥ C',
  enemies: [['boneMouse', 2], ['boneNewt', 2], ['boneBrush', 1], ['boneRook', 2]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '37-2' } },
  areas: [
    { id: 'quarry', gen: 'room', theme: 'bone_quarry', stamp: 'boneWalk', bone: { track: true }, bottomKill: true },
    { id: 'hall', gen: 'room', role: 'secret', room: 'boneGiant', theme: 'bone_room_hall', stamp: 'boneHallOld', bone: { room: true } }
  ] };

Tour.amend('bone', { stamps, levels: [L1] });

/* ---------------- the land's map: the quarry seen from the rim ---------------- */
// the tipped crate where the arrival trail starts (left), the trackway terraces, the scree slope with the ribs, the
// casting shed, the cutting floor, and the dig pit where the boss sits down at last (right)
if (typeof TOUR_OW_MAPS !== 'undefined') TOUR_OW_MAPS.bone = {
  labels: { '37-1': 'Walk Like This', '37-2': 'Assembly Optional', '37-3': 'Make an Impression', '37-4': 'Clean Break', '37-5': 'Reassembly' },
  w: 1520, h: 760,
  pal: { sea: '#6a4a8a', deep: '#3a2a5a', land: '#e0a060', light: '#f2c070', path: '#f4ead2', beach: '#f2b44e', cliff: '#8a4620', roof: '#f06a2a', wall: '#f4ead2' },
  sea: 'stars', coast: 'boneRim', tufts: 'none', trail: 'dots', bridge: 'steps', meadow: false, woods: false, foam: false, birds: false,
  land: [[[160, 400], [220, 240], [400, 150], [640, 120], [880, 150], [1100, 120], [1320, 190], [1410, 330], [1380, 520], [1250, 640], [1000, 680], [720, 650], [460, 680], [260, 610]]],
  nodes: { start: [250, 460], '37-1': [430, 340, 'n'], '37-2': [690, 230, 'n'], '37-3': [980, 250, 'n'], '37-4': [1180, 420, 'e'], '37-5': [930, 560, 's'] },
  paths: { 'start>37-1': [[330, 410]], '37-1>37-2': [[560, 260]], '37-2>37-3': [[840, 200]], '37-3>37-4': [[1100, 320]], '37-4>37-5': [[1080, 520]] },
  feat: [
    ['sprite', 'boneCrateS', 236, 486, 26], ['sprite', 'boneBench', 560, 360, 40], ['sprite', 'boneRibs', 760, 300, 30],
    ['sprite', 'boneBig', 1060, 360, 34], ['sprite', 'boneSit', 820, 600, 30], ['sprite', 'boneBench', 1250, 560, 34]
  ],
  flora: ['rock'], density: 0,
  live: [['circle', 760, 120, 60, 0.6]]
};
})();
