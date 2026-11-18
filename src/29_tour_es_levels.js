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

/* ---------------- Pupo in Spain (docs/design/PUPO.md §4.2, §4.3) ---------------- */
const PP = {
  // a Nap Box on its own bit of street
  napBox(st, o) { const tx = st.x + 1; st.floor(st.x, st.x + 2); st.B.set(tx, st.gy - 1, T.QBLOCK); st.B.item(tx, st.gy - 1, 'pupo'); st.B.spawn('napBox', tx, st.gy - 1, {}); return st.x + 3; },
  /* 6-1's Pupo obstacle, The Soapy Pole: plaza three's gate stays shut until someone takes the ham off the top of the
     soaped pole (that is how the real tomato fight starts). Brady slides straight off it ("TOO SOAPY!"); Pupo grips
     it (Action), climbs, squeaking, pulls up on the crossbar and reaches up for the ham. The ham is only ever taken by
     his arm (a pupoSnatch that stands still): a spring sock or a puff of beans up there gets a hint, never the ham.
     The gate rolls up the moment he has it, and plaza three's waves begin. { h: the pole's height, key } */
  soapyPole(st, o) {
    const B = st.B, x = st.x, gy = st.gy, h = o.h || 6, key = o.key || 'ham', px = x + 6, top = gy - h, gx = x + 13;
    st.floor(x, gx + 1);
    st.sign(x + 1, 'THE PLAZA OPENS WHEN SOMEONE TAKES THE HAM OFF THE SOAPED POLE. TOO SLIPPERY? PUPO CAN CLIMB IT (ACTION)');
    B.spawn('pupoClimb', px, gy - 1, { h, side: 1, look: 'esSoapyPole', slick: 'TOO SOAPY! (PUPO CAN CLIMB IT)', squeak: 'SQUEAK' });
    // the crossbar at the top: a tile each side of the pole, where he pulls himself up (he lands on the right: the ham
    // hangs over that end, from the hook at the top of the mast, so Up + Action reaches it)
    for (const q of [-1, 1]) { B.set(px + q, top, T.HARD); B.setHide(px + q, top, 1); }
    B.spawn('pupoSnatch', px + 1, top - 3, { key, path: [[0, 0]], period: 9, look: 'esHam', opens: true, name: 'THE HAM! PLAZA THREE OPENS', say: '...HAM.', hot: 'IT WON\'T COME OFF! PUPO\'S ARM CAN TUG IT' });
    st.decor('esPots', x + 3); st.decor('esPots', x + 10);
    // plaza three's gate: a roller of crates and planks under a stone arch, the arch up to the top of the area
    tourShutterLock(B, gx, gy - 3, gy - 1, key, 'esPlazaGate');
    for (let y = 0; y <= gy - 4; y++) { B.set(gx, y, T.HARD); B.setHide(gx, y, 1); }
    B.prop('esPlazaArch', gx, 0, 1, gy - 3, 'none', {});
    return gx + 2;
  },
  /* 6-7's Pupo bonus (a helper level): the Giant, the oldest and biggest mill of La Mancha. While the wind blows its
     great sails turn like the others'; when it drops they stop with one sail flat out over the lane, and Pupo can hang
     under it (Action) from the mill's gallery and shimmy out to the hay loft on its posts, where the miller keeps his
     coins. The loft is too high to jump to from the lane and too far from the gallery (nine tiles); the lane runs on
     under it. { g: the wind group } */
  stillMill(st, o) {
    const B = st.B, x = st.x, gy = st.gy, g = o.g || 0, mx = x + 4, gal = gy - 4, hubY = gy - 10, roof = gy - 6, l0 = mx + 14, l1 = l0 + 3;
    st.floor(x, l1 + 3);
    st.sign(x, 'THE GIANT: WITH THE WIND OFF ITS SAILS STAND STILL. PUPO CAN HANG UNDER ONE (ACTION) TO THE HAY LOFT');
    B.fill(x + 1, gy - 2, x + 2, gy - 1, T.HARD); B.setHide(x + 1, gy - 2, 1); B.setHide(x + 2, gy - 2, 1); B.setHide(x + 1, gy - 1, 1); B.setHide(x + 2, gy - 1, 1);
    B.prop('esSacks', x + 1, gy - 2, 2, 2, 'none', {});
    for (let q = -1; q <= 4; q++) B.set(mx + q, gal, T.SEMI);
    B.prop('esStillMillTower', mx, hubY, 4, gy - hubY, 'none', { gal: gal * TS });
    // the sails are scenery behind the ground (a decor the brake entity turns); the hub is at the bar's height
    const id = 'giant' + x, len = l0 + 1.5 - (mx + 2);
    B.decor.push({ kind: 'esGiantSails', x: (mx + 2) * TS + TS / 2, y: hubY * TS + TS / 2, w: 2 * len * TS, id, len: len * TS, a: 0.4 });
    B.spawn('esSailBrake', mx + 2, hubY, { g, id });
    // the flat sail: a bar from the hub out over the lane to above the loft (four rows over it)
    B.spawn('pupoBar', mx + 2, hubY, { w: l0 + 2 - (mx + 2), look: 'esSailBar', need: { g, on: true }, say: '...WHEE... SLOWLY.', dropSay: '...WINDY... AGAIN.' });
    // the hay loft on its posts (the lane runs under it), its coins on top
    for (let xx = l0; xx <= l1; xx++) { B.set(xx, roof, T.HARD); B.setHide(xx, roof, 1); }
    B.prop('esHayLoft', l0, roof, 4, gy - roof, 'none', {});
    B.picksRow(l0, l1, roof - 1); B.picksRow(l0 + 1, l1 - 1, roof - 2);
    st.coins(mx + 7, l0 - 2, gy - 3);
    return l1 + 4;
  }
};
for (const k in PP) Tour.pieces['es.' + k] = PP[k];

// 6-7: the Giant's brake: while the wind blows the sails turn; when it drops they ease to a stop with one sail flat out
// over the lane (the bar). The sails are a decor behind the ground (they dip below it as they turn); this turns them.
class EsSailBrake extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS); this.gi = s.g || 0; this.friendly = true; this.back = true; this.d = null;
    for (const d of (g.area && g.area.decor) || []) if (d.kind === 'esGiantSails' && d.id === s.id) this.d = d;
    if (this.d) this.d.a = 0.4;
  }
  update(dt) {
    this.t += dt; const d = this.d; if (!d) return;
    const wind = !(this.g.toggleBit && this.g.toggleBit(this.gi));
    if (wind) d.a = (d.a + dt * 0.8) % TAU;
    else { const q = Math.PI / 2, tgt = Math.round(d.a / q) * q; d.a = approach(d.a, tgt, dt * 2.5); }
  }
  draw(ctx) {}
}
Object.assign(ENTITY_TYPES, { esSailBrake: EsSailBrake });
Object.assign(Decor, {
  // 6-7: the Giant's four great sails from the hub (d.a turns them): a stock and a lattice frame each
  esGiantSails(ctx, x, y, t, th, d) {
    const L = d.len, a0 = d.a || 0;
    for (let k = 0; k < 4; k++) {
      const a = a0 + k * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), ex = x + c * L, ey = y + s * L, nx = -s, ny = c;
      ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 5; ctx.stroke(); ctx.lineCap = 'butt';
      const w0 = 16, w1 = 34, f0x = x + c * 44, f0y = y + s * 44;
      ctx.fillStyle = 'rgba(236,226,204,0.6)'; ctx.beginPath(); ctx.moveTo(f0x - nx * 5, f0y - ny * 5); ctx.lineTo(ex - nx * 5, ey - ny * 5); ctx.lineTo(ex - nx * w1, ey - ny * w1); ctx.lineTo(f0x - nx * w0, f0y - ny * w0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke();
      ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let u = 0.14; u < 1; u += 0.08) { const px = x + c * L * u, py = y + s * L * u, ww = w0 + (w1 - w0) * u; ctx.moveTo(px - nx * 5, py - ny * 5); ctx.lineTo(px - nx * ww, py - ny * ww); }
      ctx.stroke();
    }
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8902a'; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a5a2a'; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
  },
  // 6-7: two flour sacks to step up on (their tiles are solid)
  esSacks(ctx, x, y) {
    for (const [dx, dy, w] of [[-14, 0, 26], [12, 0, 26], [-1, -26, 28]]) { ctx.fillStyle = INK; rr(ctx, x + dx - w / 2 - 2, y + dy - 30, w + 4, 32, 9); ctx.fill(); ctx.fillStyle = '#f4ecd8'; rr(ctx, x + dx - w / 2, y + dy - 28, w, 28, 8); ctx.fill(); ctx.fillStyle = '#c8b898'; ctx.fillRect(x + dx - 6, y + dy - 18, 12, 3); }
  },
  // 6-7: the old mill's whitewashed tower, its dark cap under the hub, a door, and the wooden gallery round it (d.gal)
  esStillMillTower(ctx, x, y, t, th, d) {
    const top = y - d.h + 16, w0 = 52, w1 = 40;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x - w0 - 3, y); ctx.lineTo(x - w1 - 3, top); ctx.lineTo(x + w1 + 3, top); ctx.lineTo(x + w0 + 3, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fbf8f0'; ctx.beginPath(); ctx.moveTo(x - w0, y); ctx.lineTo(x - w1, top); ctx.lineTo(x + w1, top); ctx.lineTo(x + w0, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8e2d4'; ctx.beginPath(); ctx.moveTo(x + w0 - 16, y); ctx.lineTo(x + w1 - 12, top); ctx.lineTo(x + w1, top); ctx.lineTo(x + w0, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x - w1 - 8, top + 4); ctx.quadraticCurveTo(x, top - 46, x + w1 + 8, top + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a4450'; ctx.beginPath(); ctx.moveTo(x - w1 - 4, top + 1); ctx.quadraticCurveTo(x, top - 41, x + w1 + 4, top + 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a4a3a'; rr(ctx, x - 12, y - 46, 24, 46, 10); ctx.fill(); ctx.fillStyle = '#3a6a9a'; rr(ctx, x - 8, top + 34, 16, 20, 7); ctx.fill();
    if (d.gal) { const gy = d.gal; ctx.fillStyle = INK; ctx.fillRect(x - w0 - 34, gy - 3, 2 * w0 + 76, 11); ctx.fillStyle = '#9a6a3a'; ctx.fillRect(x - w0 - 32, gy - 1, 2 * w0 + 72, 7); ctx.fillStyle = '#7a5030'; for (let xx = x - w0 - 30; xx < x + w0 + 40; xx += 14) ctx.fillRect(xx, gy - 16, 3, 16); ctx.fillRect(x - w0 - 32, gy - 18, 2 * w0 + 72, 3); }
  },
  // 6-7: the hay loft on four posts (its roof tiles are the standing part; the lane runs under it)
  esHayLoft(ctx, x, y, t, th, d) {
    const w = d.w, top = y - d.h, x0 = x - w / 2;
    ctx.fillStyle = INK; for (const px of [x0 + 6, x0 + w - 12]) ctx.fillRect(px - 1, top + 30, 8, d.h - 30);
    ctx.fillStyle = '#8a6a44'; for (const px of [x0 + 6, x0 + w - 12]) ctx.fillRect(px + 0.5, top + 30, 5, d.h - 30);
    ctx.fillStyle = INK; rr(ctx, x0 - 3, top - 2, w + 6, 34, 5); ctx.fill();
    ctx.fillStyle = '#c89a5a'; rr(ctx, x0 - 1, top, w + 2, 30, 4); ctx.fill();
    ctx.strokeStyle = '#9a6a3a'; ctx.lineWidth = 2; for (let xx = x0 + 8; xx < x0 + w; xx += 12) { ctx.beginPath(); ctx.moveTo(xx, top + 2); ctx.lineTo(xx, top + 28); ctx.stroke(); }
    ctx.fillStyle = '#f0d070'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x0 + 10 + k * (w - 20) / 4, top + 1, 9, 4, 0, Math.PI, TAU); ctx.fill(); }
  },
  // 6-1: plaza three's stone arch over the gate (the column above the gate is solid, up to the top of the area)
  esPlazaArch(ctx, x, y, t, th, d) {
    const top = y - d.h;
    ctx.fillStyle = INK; ctx.fillRect(x - 21, top, 42, d.h);
    ctx.fillStyle = '#e8c890'; ctx.fillRect(x - 19, top, 38, d.h - 2);
    ctx.fillStyle = '#d0a870'; for (let yy = y - 30; yy > top; yy -= 30) ctx.fillRect(x - 19, yy, 38, 4);
    ctx.fillStyle = '#c8302a'; ctx.fillRect(x - 19, y - 22, 38, 8);
    ctx.fillStyle = '#ffd84a'; ctx.font = `bold 9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('PLAZA 3', x, y - 15);
  }
});
const pupoSkins = {
  // 6-1: the soaped pole (a climb strip look): a tall pine pole slick with soap, suds sliding down it, grip rings,
  // the crossbar at the top
  esSoapyPole(ctx, e, t) {
    const x = e.cx, top = e.top, bot = e.bottom;
    ctx.fillStyle = INK; ctx.fillRect(x - 8, top - 4, 16, bot - top + 4);
    ctx.fillStyle = '#c89a62'; ctx.fillRect(x - 6.5, top - 2, 13, bot - top + 2);
    ctx.fillStyle = '#e8c48a'; ctx.fillRect(x - 6.5, top - 2, 4, bot - top + 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.6; for (let y = top + 8; y < bot - 4; y += 12) { ctx.beginPath(); ctx.moveTo(x - 6, y + 1); ctx.lineTo(x + 6, y - 2); ctx.stroke(); }
    // suds sliding down (from the clock: no allocation)
    for (let k = 0; k < 6; k++) { const u = ((t * 0.18 + k / 6) % 1), yy = top + 6 + u * (bot - top - 10), xx = x + (k % 2 ? 4 : -4); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(xx, yy, 3.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(xx, yy, 2.6, 0, TAU); ctx.fill(); }
    // the crossbar: a plank across the top, the hook over it for the ham's cord
    ctx.fillStyle = INK; rr(ctx, x - 50, top - 4, 100, 12, 4); ctx.fill(); ctx.fillStyle = '#9a6a3a'; rr(ctx, x - 48, top - 2, 96, 8, 3); ctx.fill();
    ctx.fillStyle = INK; ctx.fillRect(x - 3, top - 120, 6, 118); ctx.fillStyle = '#c89a62'; ctx.fillRect(x - 2, top - 119, 4, 117);
    ctx.fillStyle = INK; ctx.fillRect(x - 3, top - 122, 40, 6); ctx.fillStyle = '#9aa0b0'; ctx.fillRect(x - 2, top - 121, 38, 4);
    ctx.fillStyle = '#e8303a'; ctx.beginPath(); ctx.moveTo(x, top - 120); ctx.lineTo(x - 18, top - 112 + Math.sin(t * 5) * 2); ctx.lineTo(x, top - 104); ctx.closePath(); ctx.fill();
  },
  // 6-1: the ham on its cord from the hook over the pole (a pupoSnatch look); once taken it rides Pupo's arm
  esHam(ctx, e, t) {
    const x = e.cx, y = e.cy, sw = e.taken ? 0 : Math.sin(t * 1.7) * 0.12;
    if (!e.taken) { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 1, y - 38); ctx.lineTo(x + 1, y - 22); ctx.stroke(); }
    ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
    // a whole cured leg: the hoof and bone at the top, the plump leg below, a red ribbon
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-3, -16); ctx.lineTo(5, -16); ctx.lineTo(13, 4); ctx.quadraticCurveTo(12, 17, 0, 17); ctx.quadraticCurveTo(-13, 15, -10, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a8422a'; ctx.beginPath(); ctx.moveTo(-1.5, -14); ctx.lineTo(3.5, -14); ctx.lineTo(11, 4); ctx.quadraticCurveTo(10, 14.5, 0, 15); ctx.quadraticCurveTo(-11, 13, -8.5, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d8785a'; ctx.beginPath(); ctx.ellipse(-2, 6, 4.5, 6.5, 0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f4e8d0'; ctx.fillRect(-2, -20, 6, 6); ctx.fillStyle = '#3a2418'; ctx.fillRect(-2.5, -24, 7, 5);
    ctx.fillStyle = '#e8303a'; ctx.fillRect(-4, -12, 10, 3);
    ctx.restore();
  },
  // 6-1: plaza three's gate (a shutter look): crates and planks lashed into a roller gate, a ham painted on it
  esPlazaGate(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w, h = e.h, k = e.k || 0, hh = h * (1 - k * 0.92);
    ctx.fillStyle = INK; ctx.fillRect(x - 3, y - 4, w + 6, hh + 4);
    for (let yy = 0; yy < hh; yy += 12) { ctx.fillStyle = (yy / 12) % 2 ? '#b8844a' : '#d09a5a'; ctx.fillRect(x - 1, y + yy, w + 2, Math.min(10, hh - yy)); }
    if (k < 0.5) { const cy = y + hh * 0.45; ctx.fillStyle = '#fff4e0'; ctx.beginPath(); ctx.arc(x + w / 2, cy, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#a8422a'; ctx.beginPath(); ctx.ellipse(x + w / 2, cy + 1, 4, 6, 0.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#f4e8d0'; ctx.fillRect(x + w / 2, cy - 7, 3, 4); }
  },
  // 6-7: the flat sail's arm (a pupoBar look): only the brass rings where the hands go (the sails draw the rest);
  // the rings show only while the sail stands still
  esSailBar(ctx, e, t) {
    if (!e.up) return;
    pupoRing(ctx, e.x0 + 60, e.y + 3, 4.4); pupoRing(ctx, e.x1 - 8, e.y + 3, 4.4);
  }
};
Tour.amend('es', { skins: pupoSkins });

Tour.amend('es', {
  stamps, skins: wallSkins,
  levels: [
    /* 6-1 HOLD: three plazas of the tomato fight in Buñol */
    { n: 1, name: 'La Tomatina', mapLabel: 'Tomatina', arch: 'hold', theme: 'es_tomatina', pupo: 'level',   // Spain's Pupo level: The Soapy Pole
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
          ['napBox', {}],   // Pupo's Nap Box by the tomato truck (PUPO.md §4.2): he rides the tomato fight with Brady
          // ① plaza one: tomato waves, a truck lobbing more
          ['plaza', { k: 1 }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['itemBlock', { item: 'cake', y: 4 }],   // a jump power (bonus)
          'cp',
          ['napBox', {}],   // the backup Nap Box at the plaza two checkpoint (the near side of the soapy pole)
          // ② plaza two: a floor of pulp and loose crates
          ['plaza', { k: 2 }],
          ['millDoor', { to: 'molino@in', back: 'molinoBack' }],
          'crates',
          // Pupo's obstacle, The Soapy Pole (PUPO.md §4.2): plaza three opens when someone takes the ham off the top
          ['soapyPole', { h: 6, key: 'ham' }],
          // ③ plaza three: balconies, a star, storks in the waves; P3 on the truck
          ['plaza', { k: 3, gold: 'risky' }],
          ['end', { exit: 'main' }]
        ] },
        { id: 'molino', gen: 'room', role: 'secret', stamp: 'molino', room: 'whack',
          whack: { title: 'WHACK-A-TOMATO', rule: 'TOMATOES POP OUT OF THE OLD MILL FLOOR! SQUASH EIGHT BEFORE TIME IS UP', critter: 'tomato', need: 8, t: 22 } }
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
        { id: 'queso', gen: 'room', role: 'secret', theme: 'es_pintxos', stamp: 'queso', room: 'rush',
          rush: { title: 'THE CHEESE CELLAR DASH', rule: 'THE MICE ARE COMING FOR THE CHEESE! GRAB ALL SIX WEDGES FIRST', look: 'tokCheese', n: 6, t: 17 } }
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
        { id: 'umbracle', gen: 'room', role: 'secret', theme: 'es_arts', stamp: 'umbracle', room: 'lantern',
          lantern: { title: 'THE NIGHT GARDEN', rule: 'A GARDEN WALK AT NIGHT: YOUR LIGHT FADES, THE LAMPS RELIGHT IT. THE STEPPING STONES SHOW ONLY IN THE LIGHT' } }
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
        { id: 'cueva', gen: 'room', role: 'secret', stamp: 'cueva', room: 'gauntlet',
          gauntlet: { title: 'THE LAVA TUBE', rule: 'AN OLD LAVA TUBE UNDER TEIDE. RUN IT TO THE END WITHOUT TOUCHING THE SPIKY ROCK', beats: ['steps', 'mover', 'crumble'] } }
      ] },

    /* 6-5 LAIR: a Fallas street, then Paellasaurus in the Silk Exchange */
    { n: 5, name: 'La Lonja', mapLabel: 'La Lonja', arch: 'lair', theme: 'es_fallas', boss: 'es_paella',
      gimmick: 'A Fallas street of giant papier-mâché fruit, rockets and firecrackers, then Paellasaurus in the Silk Exchange',
      hint: 'Paellasaurus is too hot to stomp. Kick three tomatoes into the pan to put the fire out, then crack the crust!',
      postcard: 'The Silk Exchange is back! Piwi flew off to France in a huff. Allez! ♥ C',
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
        { id: 'taller', gen: 'room', role: 'secret', theme: 'es_fallas', stamp: 'taller', room: 'prank',
          prank: { title: 'THE FINISHED NINOT', rule: 'A GIANT CHEST MARKED \'FINISHED NINOT: DO NOT OPEN\'. YOU KNOW YOU WANT TO', gag: 'jack', label: 'DO NOT OPEN', line: 'HA! THE REAL PRIZE IS IN THE CAGE.' } },
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
        { id: 'alcove', gen: 'room', role: 'secret', theme: 'es_aquarium', water: true, stamp: 'alcove', room: 'grotto',
          grotto: { title: 'THE AQUARIUM\'S BACK TANK', rule: 'BEHIND THE GLASS: THE TANK THE VISITORS NEVER SEE. SWIM TO THE BACK', half: false } }
      ] },

    /* 6-7 SWITCH (secret): the windmills of La Mancha */
    { n: 7, name: 'Molinos de La Mancha', mapLabel: 'Molinos', arch: 'switch', secret: true, theme: 'es_mancha', pupo: 'helper',   // Pupo's Nap Box by the first mill, the Giant's still sail
      gimmick: 'The wind lever: with the wind on, the sails turn and cloth boards hold in the gust; with it off, the sails stop and the calm steps settle',
      hint: 'Pull the wind lever (UP) to start or stop the wind. A paper plane can hit it from afar',
      postcard: 'Windmills as far as I can see. One of them waved at me. Probably. ♥ C',
      enemies: [['esSheep', 2], ['esLynx', 1], ['esStork', 1]],
      mapCell: [0, 1], mapFrom: 0,
      exits: { main: {} },
      areas: [
        { id: 'mancha', gen: 'strip', W: 214, H: 22, GY: 16, gyMax: 16, script: [   // two more rows of sky (the Giant's sail stays clear of the HUD)
          ['itemBlock', { item: 'power', y: 4 }],
          // ① wind on: ride the turning sails, cross on the wind-held boards
          ['windSwitch', {}],
          ['windmill', { r: 4, gold: 'must' }],
          ['napBox', {}],   // Pupo (a helper here, PUPO.md §4.3): his Nap Box by the first mill
          ['enemies', { kind: 'esSheep', n: 2 }],
          ['windBoards', { n: 7 }],
          ['gearStand', { item: 'plane' }],
          // ② wind off: the sails stop, the boards fall, the calm steps settle
          ['windSwitch', {}],
          ['calmSteps', { n: 3, gold: 'risky' }],
          ['stillMill', {}],   // Pupo's bonus: with the wind off, the Giant's flat sail out to the hay loft's coins
          ['enemies', { kind: 'esLynx', n: 1 }],
          'cp',   // where the level's own half-way checkpoint always was (the two Pupo steps would have moved it)
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
        { id: 'harinero', gen: 'room', role: 'secret', theme: 'es_mancha', stamp: 'harinero', room: 'bigone',
          bigone: { title: 'THE BIG SHEEP', rule: 'THE FLOUR STORE\'S GIANT SHEEP IS NOT AMUSED. STOMP IT THREE TIMES', critter: 'esSheep', name: 'THE BIG SHEEP' } }
      ] }
  ]
});
})();
