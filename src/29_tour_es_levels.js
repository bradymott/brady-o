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

/* ---------- 6-2: the pintxos bar and the inside of its wall ----------
   Two maps on top of each other, 90 x 24 each: the bar (barra) and the cavity inside its back wall (pared). Racks of
   wine bottles from floor to ceiling cut the bar into three parts (the start, the middle counter with its shelf, the
   far end with the top shelf and the last pintxo); in the wall, wiring, a fat pipe and wedged corks cut it up in
   other places. Every mouse hole in the bar opens straight into the wall behind it at the same spot, and back. The
   corkscrew on the middle shelf opens the cork that plugs the wall's top ledge, the only way up to the top shelf. */
const BW = 90, BH = 24, BF = 21;
// the bar's racks of wine bottles, floor to ceiling (a solid prop)
if (typeof Decor !== 'undefined') Decor.esBottleRack = (ctx, x, y, t, th, d) => {
  const w = d.w, h = d.h, x0 = x - w / 2, cols = ['#2a6a3a', '#5a1a2a', '#8a6a2a', '#2a4a6a'];
  ctx.fillStyle = '#6a4228'; ctx.fillRect(x0, y - h, w, h);
  for (let yy = y - 6; yy > y - h + 10; yy -= 44) {
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(x0, yy, w, 6);
    for (let k = 0; k < Math.floor(w / 16); k++) { const bx = x0 + 8 + k * 16, c = cols[(k + Math.floor(yy / 44)) % 4]; ctx.fillStyle = c; rr(ctx, bx - 6, yy - 30, 12, 30, 4); ctx.fill(); ctx.fillRect(bx - 2.5, yy - 40, 5, 12); ctx.fillStyle = '#f4e8d0'; ctx.fillRect(bx - 5, yy - 20, 10, 8); ctx.fillStyle = '#c8302a'; ctx.fillRect(bx - 3, yy - 42, 6, 4); }
  }
};
if (typeof TourMaze !== 'undefined') TourMaze.addKeys({
  esCorkscrew: { name: 'CORKSCREW', toast: 'A CORKSCREW! THERE IS A CORK STUCK SOMEWHERE IN THE WALL...', col: '#c8c8d8', glow: '#f4f0ff',
    icon: (c, x, y) => { c.fillStyle = '#8a5226'; rr(c, x - 12, y - 12, 24, 7, 3); c.fill(); c.strokeStyle = '#c8ccd8'; c.lineWidth = 3; c.beginPath(); for (let k = 0; k <= 12; k++) { const yy = y - 5 + k * 1.4; c.lineTo(x + Math.sin(k * 1.2) * 4, yy); } c.stroke(); } },
  esCork: { name: 'CORK', icon: (c, x, y) => { c.fillStyle = '#c8945a'; rr(c, x - 9, y - 12, 18, 24, 4); c.fill(); c.fillStyle = '#a8743a'; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(x - 4 + (k % 3) * 4, y - 8 + k * 4, 1.3, 0, TAU); c.fill(); } } }
});
// the cork wedged in the wall's top ledge: a big cork with a hole for the corkscrew, pulled out when Brady has one
class EsCorkPlug extends ENTITY_TYPES.mazeShutter {
  draw(ctx) {
    const k = this.open ? clamp(1 - (this.openT || 0) / 0.6, 0, 1) : 0, x = this.x + 6, y = this.y - k * 40, w = TS, h = this.h;
    ctx.save(); ctx.globalAlpha = 1 - k;
    Ink.around(ctx, x - 6, y - 6, w + 12, h + 12, c => {
      c.fillStyle = '#c8945a'; rr(c, x - 2, y, w + 4, h, 8); c.fill();
      c.fillStyle = '#a8743a'; for (let q = 0; q < 14; q++) { c.beginPath(); c.arc(x + 4 + (q * 7) % (w - 6), y + 8 + (q * 13) % (h - 14), 1.6, 0, TAU); c.fill(); }
      c.fillStyle = '#5a3a1a'; c.beginPath(); c.arc(x + w / 2, y + 10, 4, 0, TAU); c.fill();
    }, { pad: 4 });
    ctx.restore();
  }
}
ENTITY_TYPES.esCorkPlug = EsCorkPlug;
const grid = (fillCh) => Array.from({ length: BH }, (_, y) => Array.from({ length: BW }, (_, x) => (y >= BF || x === 0 || x === BW - 1) ? '#' : fillCh));
const putter = g => ({
  put: (x, y, s) => { for (let k = 0; k < s.length; k++) g[y][x + k] = s[k]; },
  fill: (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch; }
});
// the bar: three parts between two racks of bottles
const barRows = (() => {
  const g = grid('.'), { put, fill } = putter(g);
  fill(1, 0, BW - 2, 0, '#');                       // the ceiling (the racks reach it)
  put(30, 20, 'R'); put(60, 20, 'R');               // the two racks of bottles, floor to ceiling (x 30-33 and 60-63)
  // part 1: the start, a power-up, the Crawl Pads, the first mouse hole
  put(3, 20, '@'); put(5, 17, '?'); put(8, 20, 'p'); put(12, 20, 'D1'); put(17, 20, 'i'); put(22, 20, 'e');
  put(14, 16, 'o.o.o');
  // part 2: the middle counter, the bread steps up to the shelf, the corkscrew, a star, two mouse holes
  put(36, 20, 'n'); put(54, 20, 'f'); put(56, 20, 'D2');
  fill(36, 15, 58, 15, '-'); put(40, 14, 'D3'); put(46, 11, '?'); put(50, 14, 'k'); put(54, 12, '*');
  put(43, 12, 'o.o');
  // part 3: the far counter (a mouse hole from the wall, beans, a hidden 1UP, the cheese wedge), the top shelf and the gate
  put(64, 20, '5D'); put(68, 17, '?'); put(70, 17, 'h'); put(73, 20, 'q');
  fill(64, 8, 88, 8, '#'); put(66, 7, 'D4'); put(85, 7, 'G'); put(72, 5, 'o.o.o.o'); put(78, 7, 'e');
  return g.map(r => r.join(''));
})();
// the wall: wiring to crawl under, the fat pipe and its walkway, wedged corks, the top ledge plugged by a cork
const wallRows = (() => {
  const g = grid('.'), { put, fill } = putter(g);
  fill(1, 0, BW - 2, 0, '#');
  // part 1: under the first mouse hole, the wiring (a crawlway) and the steps up to the walkway on the pipe
  put(12, 20, 'D1'); fill(14, 1, 15, 18, '#'); put(14, 19, 'TT');
  fill(17, 19, 17, 20, '#'); fill(19, 17, 19, 20, '#');
  fill(20, 15, 62, 15, '#');                        // the walkway on the pipe
  fill(46, 16, 49, 20, '#');                        // the fat pipe down to the floor
  put(40, 14, 'D3'); put(47, 12, '%'); put(30, 17, 'm'); put(26, 12, 'o.o.o');
  // part 2: the floor past the pipe, a cork step back up to the walkway, the second and fifth mouse holes
  fill(52, 17, 53, 20, '#'); put(56, 20, 'D2'); put(64, 20, '5D'); put(60, 20, 'e');
  // corks wedged in the wall as ledges up to the top ledge
  fill(80, 17, 82, 17, '-'); fill(84, 14, 86, 14, '-'); fill(80, 11, 82, 11, '-');
  fill(60, 8, 79, 8, '#'); put(66, 7, 'D4'); put(72, 7, 'K'); fill(72, 1, 72, 4, '#'); put(76, 4, 'm'); put(68, 5, 'o.o');
  return g.map(r => r.join(''));
})();
const hole = (to, back) => ({ to: to, look: back ? 'esHoleBack' : 'esMouseHole' });
const barStamp = {
  floor: BF, rows: barRows,
  legend: {
    R: ['piece', (st) => { st.B.prop('esBottleRack', st.x, 1, 4, BF - 1, 'body', {}); return st.x; }],
    p: ['gear', 'pads'], n: ['piece', 'breads', { n: 3 }], k: ['spawn', 'key', { id: 'corkscrew', look: 'esCorkscrew' }],
    q: ['piece', 'cheese', { to: 'queso@in', back: 'quesoBack' }],
    e: ['enemy', 'esGamba'], f: ['enemy', 'esOlive'],
    i: ['spawn', 'sign', { text: 'EVERY MOUSE HOLE IN THE BAR GOES STRAIGHT INTO THE WALL BEHIND IT. THE WALL IS A WHOLE OTHER BAR. (FOR MICE.)' }],
    1: ['anchor', 'b1'], 2: ['anchor', 'b2'], 3: ['anchor', 'b3'], 4: ['anchor', 'b4'], 5: ['anchor', 'b5']
  },
  items: ['star', 'power', 'beans'], hidden: ['oneup'],
  doors: [hole('pared@w4'), hole('pared@w3'), hole('pared@w1'), hole('pared@w2'), hole('pared@w5')],   // in reading order
  gold: { '*': 'must' }
};
const wallStamp = {
  floor: BF, rows: wallRows,
  legend: {
    K: ['piece', TourMaze.lock('esCorkPlug', { col: '#c8945a', peek: null, need: 'A CORK IS STUCK HERE. IT NEEDS A CORKSCREW' }), { id: 'corkscrew' }],
    m: ['enemy', 'esBat'], e: ['enemy', 'esGamba'],
    1: ['anchor', 'w1'], 2: ['anchor', 'w2'], 3: ['anchor', 'w3'], 4: ['anchor', 'w4'], 5: ['anchor', 'w5']
  },
  doors: [hole('barra@b4', true), hole('barra@b3', true), hole('barra@b1', true), hole('barra@b2', true), hole('barra@b5', true)],
  gold: { '%': 'risky' }
};
// the inside of the bar's wall (6-2's second map): wooden studs and lath with blobs of plaster, a copper pipe and
// wires along it, lost corks and a mouse's matchbox bed. Warm and dim, never a cave.
if (typeof BGPaint !== 'undefined') BGPaint.esLath = function (ctx, L, rng, H) {
  ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
  for (let y = 6; y < H; y += 22) { ctx.fillStyle = y % 44 ? '#6a4228' : '#5e3a22'; ctx.fillRect(0, y, BG_W, 14); ctx.fillStyle = 'rgba(240,230,210,0.35)'; for (let x = (y * 7) % 37; x < BG_W; x += 30 + (x * 13) % 40) { ctx.beginPath(); ctx.ellipse(x, y + 16, 7, 4, 0, 0, TAU); ctx.fill(); } }
  for (let x = 40; x < BG_W; x += 170) { ctx.fillStyle = '#8a5a34'; ctx.fillRect(x, 0, 26, H); ctx.fillStyle = '#6a4228'; ctx.fillRect(x + 20, 0, 6, H); }
  const py = L.base - 120; ctx.fillStyle = '#c87a3a'; ctx.fillRect(0, py, BG_W, 12); ctx.fillStyle = '#e8a060'; ctx.fillRect(0, py + 2, BG_W, 3);
  for (let x = 90; x < BG_W; x += 210) { ctx.fillStyle = '#a85a2a'; ctx.fillRect(x, py - 3, 10, 18); }
  ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 3; ctx.beginPath(); for (let x = 0; x <= BG_W; x += 16) ctx.lineTo(x, py + 40 + Math.sin(x * 0.03) * 10); ctx.stroke();
  ctx.strokeStyle = '#c8302a'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x <= BG_W; x += 16) ctx.lineTo(x, py + 50 + Math.sin(x * 0.025 + 1) * 12); ctx.stroke();
  for (let k = 0; k < 6; k++) { const x = 70 + k * 165 + rng() * 40, y = L.base - 30 - rng() * 200; ctx.fillStyle = '#c8945a'; rr(ctx, x - 6, y - 9, 12, 18, 3); ctx.fill(); }
  const bx = 600; ctx.fillStyle = '#e8c050'; ctx.fillRect(bx, L.base - 22, 54, 20); ctx.fillStyle = '#c8302a'; ctx.fillRect(bx, L.base - 22, 54, 5); ctx.fillStyle = '#f4f0e8'; ctx.fillRect(bx + 6, L.base - 28, 40, 8); ctx.fillStyle = '#c8302a'; ctx.fillRect(bx + 6, L.base - 28, 14, 8);
};
if (THEMES.es_pintxos) THEMES.es_pared = Object.assign({}, THEMES.es_pintxos, {
  name: 'Inside the Wall', particles: 'dust', rays: null, sky: ['#2a1a12', '#3a2418', '#4a2e1e'], horizonGlow: '#c8945a',
  layers: [{ kind: 'esLath', color: '#3a2418', base: 360, f: 0.06 }],
  ground: { style: 'rock', cap: '#8a5a34', capHi: '#b8844a', dirt: '#5e3a22', dirt2: '#4a2e1a', rock: '#6a4228' },
  hard: { c1: '#c87a3a', c2: '#8a4a22' }, semi: { style: 'plank', c1: '#c8945a', c2: '#8a6a3a' },
  fog: '#c8945a', darkness: 0.25, decor: []
});
// the mouse hole seen from inside the wall: bar light spilling through an arched hole, a chalk arrow, a crumb on the sill
const wallSkins = {
  esHoleBack(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = 'rgba(255,220,150,0.18)'; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x - 30, y - 6); ctx.lineTo(x + 30, y - 6); ctx.lineTo(x + 16, y); ctx.fill();
    ctx.fillStyle = '#ffe8b0'; ctx.beginPath(); ctx.arc(x, y, 16, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#f4c84a'; ctx.beginPath(); ctx.arc(x, y, 11, Math.PI, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(240,240,230,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 8, y - 30); ctx.lineTo(x + 8, y - 30); ctx.moveTo(x + 2, y - 35); ctx.lineTo(x + 8, y - 30); ctx.lineTo(x + 2, y - 25); ctx.stroke();
    ctx.fillStyle = '#e8c070'; ctx.beginPath(); ctx.arc(x + 12, y - 2, 2.5, 0, TAU); ctx.fill();
  }
};
stamps.barra = barStamp;
stamps.pared = wallStamp;

Tour.amend('es', {
  stamps, skins: wallSkins,
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
      gimmick: 'Brady is pocket-sized in a pintxos bar, and the bar has a second bar inside its wall: every mouse hole leads straight through to the other side',
      hint: 'Racks of bottles block the bar; the wall behind it is blocked in other places. Weave in and out through the mouse holes. A corkscrew opens the stuck cork',
      postcard: 'Everything here is on a toothpick. Even me, nearly. ♥ C',
      enemies: [['esOlive', 2], ['esGamba', 2], ['esBat', 2]],
      mapCell: [1, 0], mapFrom: 0,
      exits: { main: { to: '6-3' }, secret: { to: 'house:es-pintxos', hint: 'A mouse hole at the foot of the cheese wedge...' } },
      areas: [
        { id: 'barra', gen: 'room', theme: 'es_pintxos', stamp: 'barra' },
        { id: 'pared', gen: 'room', role: 'sub', theme: 'es_pared', stamp: 'pared' },
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
          ['itemBlock', { item: 'lsd', y: 5 }],   // moved up from the end (Brady: star / acid too often came at the end, where they are no use)
          // ③ all of it together, bats swooping
          ['ribs', { n: 4 }],
          ['lights', { n: 5 }],
          'eyelid',
          'bats',
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
