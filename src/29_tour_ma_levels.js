/* ============================================================
   Morocco: the six levels in the v2 format (LEVEL_OVERHAUL.md §2,
   §3.2 Morocco). The country (art, cast, objects, Berrad and the
   Brass Owl) is registered by 29_tour_ma.js; this file adds the
   stamps and the levels with Tour.amend.
   ============================================================ */
(() => {
const C = Tour.countries.ma;
if (!C) return;

/* ---------- 5-1: the souk maze, nine cells of 26 x 14 (plus a tea room and the lantern shop) ----------
   Every door Brady can see goes somewhere: each is a stamp door 'D' aimed at a named anchor next to its partner door,
   and the plaque over it shows where it leads (a rooftop, a spice cone, a cellar jar...). The colour of the rug says
   which way it heads: SAFFRON up towards the rooftops, PAPRIKA down towards the cellars, MINT the back stairs between
   the alley and the kitchens, INDIGO a side room for tea. The backdrop for this level has no doorways in it.
   Route: gate -> spice hall -> (hole) dyers -> lantern alley: the rooftop door is behind a locked grille; the key is in
   the cumin cellar (dyers -> cooks -> cellar by the paprika stairs, or alley -> court -> cooks by the mint stairs),
   then back up and through the grille to the rooftops. A hole in the basket weavers' floor is an early way down.
   ------------------------------------------------------------------------------------------------------------ */
// the little hanging plaque over each souk door: the icon is the room the door leads to
const SOUK_ICONS = {
  roof(c, x, y) { c.fillStyle = '#e8a878'; c.fillRect(x - 8, y - 2, 16, 7); for (let k = 0; k < 4; k++) c.fillRect(x - 8 + k * 5, y - 5, 3, 3); c.fillStyle = '#ffc83a'; c.beginPath(); c.arc(x + 5, y - 6, 3, 0, TAU); c.fill(); },
  cone(c, x, y) { const col = ['#f0c02a', '#d8402a', '#3aa86a']; for (let k = 0; k < 3; k++) { c.fillStyle = col[k]; c.beginPath(); c.moveTo(x - 9 + k * 6, y + 5); c.lineTo(x - 6 + k * 6, y - 4 - (k % 2) * 2); c.lineTo(x - 3 + k * 6, y + 5); c.closePath(); c.fill(); } },
  jar(c, x, y) { c.fillStyle = '#c8643a'; c.beginPath(); c.moveTo(x - 3, y - 6); c.quadraticCurveTo(x - 9, y, x - 4, y + 6); c.lineTo(x + 4, y + 6); c.quadraticCurveTo(x + 9, y, x + 3, y - 6); c.closePath(); c.fill(); c.fillStyle = '#9a4426'; c.fillRect(x - 4, y - 8, 8, 3); },
  pot(c, x, y) { c.fillStyle = '#b8603a'; c.fillRect(x - 9, y + 2, 18, 4); c.beginPath(); c.moveTo(x - 7, y + 2); c.lineTo(x, y - 7); c.lineTo(x + 7, y + 2); c.closePath(); c.fill(); c.fillStyle = '#e8c890'; c.beginPath(); c.arc(x, y - 7, 1.8, 0, TAU); c.fill(); },
  fountain(c, x, y) { c.fillStyle = '#1a6ab8'; c.fillRect(x - 9, y + 2, 18, 4); c.strokeStyle = '#5ab8ff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 6, y + 2); c.quadraticCurveTo(x, y - 12, x + 6, y + 2); c.stroke(); },
  cup(c, x, y) { c.fillStyle = 'rgba(200,230,255,0.9)'; c.beginPath(); c.moveTo(x - 5, y - 5); c.lineTo(x + 5, y - 5); c.lineTo(x + 3, y + 6); c.lineTo(x - 3, y + 6); c.closePath(); c.fill(); c.fillStyle = '#c8783a'; c.fillRect(x - 4, y - 1, 8, 6); c.fillStyle = '#3aa86a'; c.beginPath(); c.ellipse(x + 2, y - 7, 3, 1.6, -0.5, 0, TAU); c.fill(); },
  basket(c, x, y) { c.fillStyle = '#c8a060'; c.beginPath(); c.ellipse(x, y + 2, 8, 5, 0, 0, TAU); c.fill(); c.strokeStyle = '#8a6a3a'; c.lineWidth = 1; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x - 7, y + 2 + k * 2); c.lineTo(x + 7, y + 2 + k * 2); c.stroke(); } c.fillStyle = '#3a8a3a'; c.fillRect(x - 1, y - 8, 3, 7); c.beginPath(); c.arc(x + 0.5, y - 8, 2.6, 0, TAU); c.fill(); },
  skein(c, x, y) { const col = ['#d8402a', '#2a4aa8', '#f0c02a']; c.fillStyle = '#5a3a22'; c.fillRect(x - 9, y - 7, 18, 2); for (let k = 0; k < 3; k++) { c.fillStyle = col[k]; c.fillRect(x - 8 + k * 6, y - 5, 4, 10); } },
  lantern(c, x, y) { c.fillStyle = '#c8a03a'; c.beginPath(); c.moveTo(x - 4, y - 6); c.lineTo(x + 4, y - 6); c.lineTo(x + 6, y + 2); c.lineTo(x, y + 7); c.lineTo(x - 6, y + 2); c.closePath(); c.fill(); c.fillStyle = '#fff0a0'; c.fillRect(x - 2, y - 3, 4, 5); },
  gate(c, x, y) { c.fillStyle = '#e8b088'; c.fillRect(x - 9, y - 7, 18, 13); c.fillStyle = '#2a1820'; c.beginPath(); c.moveTo(x - 4, y + 6); c.lineTo(x - 4, y - 1); c.arc(x, y - 1, 4, Math.PI, 0); c.lineTo(x + 4, y + 6); c.closePath(); c.fill(); }
};
const SOUK_RUGS = { saffron: 'maDoorSaffron', paprika: 'maDoorPaprika', mint: 'maDoorMint', indigo: 'maDoorIndigo' };
const soukSkins = {};
for (const col in SOUK_RUGS) for (const ic in SOUK_ICONS) soukSkins['maSouk_' + col + '_' + ic] = (ctx, e, t) => {
  const base = TOUR_SKINS[SOUK_RUGS[col]]; if (base) base(ctx, e, t);
  // the plaque hangs on two cords from the arch: cream tile, ink rim, the icon of where the door goes
  const x = e.cx, y = e.y + e.h - 84 + Math.sin(t * 1.4 + e.cx) * 0.8;
  ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 8, y - 10); ctx.lineTo(x - 4, y + 14); ctx.moveTo(x + 8, y - 10); ctx.lineTo(x + 4, y + 14); ctx.stroke();
  ctx.fillStyle = '#f4e8d0'; rr(ctx, x - 13, y - 10, 26, 21, 4); ctx.fill();
  ctx.strokeStyle = '#2a1820'; ctx.lineWidth = 2; rr(ctx, x - 13, y - 10, 26, 21, 4); ctx.stroke();
  SOUK_ICONS[ic](ctx, x, y);
};
// the rooftop grille: carved cedar lattice with a brass padlock shaped like a teapot; the cellar key opens it
class MaRoofGrille extends ENTITY_TYPES.lock {
  draw(ctx) {
    const k = this.open ? clamp(1 - (this.openT || 0) / 0.6, 0, 1) : 0, x = this.x + 6, y = this.y, w = TS, h = this.h;
    ctx.save(); ctx.globalAlpha = 1 - k;
    Ink.around(ctx, x - 4, y - 6, w + 8, h + 8, c => {
      c.fillStyle = '#7a4a2a'; c.fillRect(x, y - k * h, w, h);
      c.strokeStyle = '#c8945a'; c.lineWidth = 2;
      for (let yy = y + 6; yy < y + h - 4; yy += 12) for (let xx = x + 8; xx < x + w; xx += 16) { c.beginPath(); c.moveTo(xx, yy - 6 - k * h); c.lineTo(xx + 6, yy - k * h); c.lineTo(xx, yy + 6 - k * h); c.lineTo(xx - 6, yy - k * h); c.closePath(); c.stroke(); }
      // the teapot padlock
      const px = x + w / 2, py = y + h / 2 - k * h;
      c.fillStyle = '#e8b830'; c.beginPath(); c.ellipse(px, py + 3, 9, 7, 0, 0, TAU); c.fill();
      c.strokeStyle = '#e8b830'; c.lineWidth = 2.5; c.beginPath(); c.arc(px, py - 4, 5, Math.PI, 0); c.stroke();
      c.beginPath(); c.moveTo(px + 8, py + 2); c.quadraticCurveTo(px + 14, py - 2, px + 13, py - 6); c.stroke();
      c.fillStyle = '#2a1820'; c.fillRect(px - 1.5, py + 1, 3, 5);
    }, { pad: 4 });
    ctx.restore();
  }
}
ENTITY_TYPES.maRoofGrille = MaRoofGrille;
// stamp helper: a lock 3 tall standing on the row under the letter, drawn as the grille
const roofGrille = (st, o) => { const B = st.B, n = B.spawns.length; B.lock(st.x, st.gy - 3, st.gy - 1, o.id || 'roofKey', 'door'); for (let k = n; k < B.spawns.length; k++) if (B.spawns[k].type === 'lock') B.spawns[k].type = 'maRoofGrille'; return st.x; };

// one legend for every cell: rugs, spice heaps, decor and the cast
const SOUK = {
  R: ['piece', 'rug', { w: 5, h: 5 }], r: ['piece', 'rug', { w: 3, h: 4 }], U: ['piece', 'rug', { w: 4, h: 3, bounce: true }],
  P: ['piece', 'heap', { w: 2, h: 2, seed: 0 }], p: ['piece', 'heap', { w: 2, h: 1, seed: 1 }], Y: ['piece', 'heap', { w: 2, h: 3, seed: 2 }],
  k: ['decor', 'maBasket'], l: ['decor', 'maLantern'], d: ['decor', 'maDyeVat'], e: ['decor', 'maSkeins'], j: ['decor', 'maJar'], n: ['decor', 'maSpiceSacks'], f: ['decor', 'maPots'], q: ['decor', 'maFountain'],
  m: ['enemy', 'maMoth'], t: ['enemy', 'maTagine'], a: ['enemy', 'maTeapot'], x: ['piece', 'cobraBasket', {}],
  i: ['spawn', 'sign', { text: 'SOUK DOORS: THE SIGN OVER A DOOR SHOWS WHERE IT GOES. SAFFRON = UP TO THE ROOFTOPS. PAPRIKA = DOWN TO THE CELLARS. MINT = THE BACK STAIRS.' }],
  z: ['spawn', 'sign', { text: 'RUG MOTHS NIBBLE THE RUGS (THEY GROW BACK)' }],
  K: ['anchor', 'shopBack'], V: ['piece', roofGrille, { id: 'roofKey' }], J: ['key', 'roofKey']
};
// a cell: its own anchors (digits) and signs on top of the shared legend
const cell = (rows, extra) => { const e = Object.assign({}, extra || {}), legend = Object.assign({}, SOUK, e.legend || {}); delete e.legend; return Object.assign({ floor: 12, rows, legend }, e); };
const to = (anchor, col, icon) => ({ to: 'souk@' + anchor, look: 'maSouk_' + col + '_' + icon });
const souk = {
  // A (0,0) the souk gate, the start: paprika down to the basket weavers, saffron on to the spice hall
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
    '#.@.i.l..D1.P......k.D2..#',
    '##########################',
    '##########################'
  ], { items: ['power'], legend: { 1: ['anchor', 'A1'], 2: ['anchor', 'A2'] },
    doors: [to('E1', 'paprika', 'basket'), to('B1', 'saffron', 'cone')] }),
  // B (1,0) the spice hall: back to the gate, the hole in the floor drops to the dyers, indigo to the tea room
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
    '#..D1..Y.........n..ED...#',
    '###########....###########',
    '###########....###########'
  ], { legend: { 1: ['anchor', 'B1'], E: ['anchor', 'teaBack'] },
    doors: [to('A2', 'saffron', 'gate'), { to: 'tea@in', look: 'maSouk_indigo_cup' }] }),
  // C (2,0) the rooftops: sky rugs up to the terrace and the gate; P3 up high. Only the alley's grille door leads here
  roofs: cell([
    '##########################',
    '#........................#',
    '#..........*.........G...#',
    '#.................########',
    '#..............r.........#',
    '#..........o.............#',
    '#.........r..............#',
    '#........................#',
    '#........................#',
    '#....r...................#',
    '#........................#',
    '#..D1....................#',
    '##########################',
    '##########################'
  ], { gold: { '*': 'high' }, legend: { 1: ['anchor', 'C1'] }, doors: [to('G2', 'saffron', 'lantern')] }),
  // E (0,1) the basket weavers: snake baskets, a hidden water bottle, and a hole in the floor down to the cumin cellar
  baskets: cell([
    '##########################',
    '#........................#',
    '#........................#',
    '#........................#',
    '#..o.o.o.........o.o.o...#',
    '#........................#',
    '#.....R..................#',
    '#........................#',
    '#...........h............#',
    '#........................#',
    '#........................#',
    '#..D1.......A...x........#',
    '##################....####',
    '##################....####'
  ], { hidden: ['oneup'], legend: { 1: ['anchor', 'E1'], A: ['spawn', 'sign', { text: 'BASKET WEAVERS. PLEASE DO NOT POKE THE BASKETS. THE HOLE IN THE FLOOR DROPS TO THE CUMIN CELLAR.' }] },
    doors: [to('A1', 'paprika', 'gate')] }),
  // F (1,1) the dyers' hall: Brady drops in from the spice hall. Rug moths; P1 over the vats; paprika down, saffron on
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
    '#.z.p....D1d...d..p..2D..#',
    '##########################',
    '##########################'
  ], { gold: { '*': 'must' }, legend: { 1: ['anchor', 'F1'], 2: ['anchor', 'F2'] },
    doors: [to('J1', 'paprika', 'pot'), to('G1', 'saffron', 'lantern')] }),
  // G (2,1) lantern alley: the lantern shop, the mint back stairs, and the rooftop door behind the locked grille
  alley: cell([
    '##########################',
    '#..................#######',
    '#..................#######',
    '#...l....l....l....#######',
    '#..................#######',
    '#...o.o.o..........#######',
    '#..................#######',
    '#..................#.....#',
    '#...-----..........#.....#',
    '#........................#',
    '#........................#',
    '#..D1...DK..D3.O...V.2D..#',
    '##########################',
    '##########################'
  ], { legend: { 1: ['anchor', 'G1'], 2: ['anchor', 'G2'], 3: ['anchor', 'G3'], O: ['spawn', 'sign', { text: 'THE ROOFTOP DOOR IS LOCKED. THE KEY-KEEPER IS DOWN IN THE CUMIN CELLAR (TAKE THE PAPRIKA STAIRS... OR THE MINT ONES).' }] },
    doors: [to('F2', 'saffron', 'skein'), { to: 'shop@in', look: 'maShopDoor' }, to('K2', 'mint', 'fountain'), to('C1', 'saffron', 'roof')] }),
  // I (0,2) the cumin cellar: the rooftop key on the shelf, and an invincibility star for the run back past the cooks
  cellar: cell([
    '##################....####',
    '#........................#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#........................#',
    '#.....o.o.o.o.o.o........#',
    '#...?.------------.......#',
    '#........................#',
    '#..................J.....#',
    '#..j.n.....p.....N..1D.n.#',
    '##########################',
    '##########################'
  ], { items: ['star'], legend: { 1: ['anchor', 'I1'], N: ['spawn', 'sign', { text: 'NOTE FROM THE KEY-KEEPER: GONE FOR MINT TEA. THE ROOFTOP KEY IS ON THE SHELF. DO NOT TELL THE DUMMY.' }] },
    doors: [to('J2', 'paprika', 'pot')] }),
  // H (1,2) the tagine cooks: paprika up to the dyers, paprika down to the cellar, mint across to the fountain court
  cooks: cell([
    '##########################',
    '#........................#',
    '#........................#',
    '#........................#',
    '#...........o.o.o........#',
    '#........................#',
    '#............r...........#',
    '#........................#',
    '#..................a.....#',
    '#................-----...#',
    '#........................#',
    '#..D1.f..D2....t....t.3D.#',
    '##########################',
    '##########################'
  ], { legend: { 1: ['anchor', 'J1'], 2: ['anchor', 'J2'], 3: ['anchor', 'J3'] },
    doors: [to('F1', 'paprika', 'skein'), to('I1', 'paprika', 'jar'), to('K1', 'mint', 'fountain')] }),
  // I (2,2) the fountain court: mint back stairs both ways; a bouncy rug to the high coins
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
    '#..D1..q....U......f.2D..#',
    '##########################',
    '##########################'
  ], { legend: { 1: ['anchor', 'K1'], 2: ['anchor', 'K2'] },
    doors: [to('J3', 'mint', 'pot'), to('G3', 'mint', 'lantern')] })
};
// the tea room off the spice hall (indigo door): low tables, a rude teapot, and the flying carpet
const teaRoom = {
  floor: 11,
  rows: [
    '############################',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#..........................#',
    '#.....o.o.o.o..............#',
    '#..........................#',
    '#....---------.....?.......#',
    '#..........................#',
    '#..........................#',
    '#.@.D...A......a.....k..f..#',
    '############################',
    '############################'
  ],
  legend: { A: ['spawn', 'sign', { text: 'TEA ROOM. MINT TEA IS POURED FROM A GREAT HEIGHT. THE TEAPOT IS RUDE BUT THE CARPET IS FREE.' }], a: ['enemy', 'maTeapot'], k: ['decor', 'maBasket'], f: ['decor', 'maPots'] },
  items: ['sig'], doors: [{ to: 'souk@teaBack', look: 'maSouk_indigo_cone' }]
};
// 5-1's own look: the souk theme without the doorways the street backdrop is full of (they looked like doors to try).
// Far: the Atlas strip; then flat roofs with little windows; near: the covered lane of the souk (reed-slat canopy,
// awnings, shelves of pots and slippers, brass lanterns) on a plain plaster wall with no openings at all.
BGPaint.maSoukRoofs = function (ctx, L, rng, H) {
  let x = 0;
  while (x < BG_W) {
    const w = 50 + rng() * 70, h = 60 + rng() * 90;
    ctx.fillStyle = shade(L.color, (rng() - 0.5) * 0.14); ctx.fillRect(x, L.base - h, w - 2, h + (H - L.base));
    ctx.fillStyle = shade(L.color, 0.12); ctx.fillRect(x, L.base - h, w - 2, 4);
    ctx.fillStyle = shade(L.color, -0.32); for (let k = 0; k < 2; k++) if (rng() < 0.7) ctx.fillRect(x + 8 + k * (w / 2), L.base - h + 16 + rng() * 14, 8, 8);
    if (rng() < 0.35) { ctx.fillStyle = '#c8643a'; ctx.fillRect(x + w / 2 - 3, L.base - h - 8, 6, 8); }
    x += w;
  }
};
BGPaint.maSoukLane = function (ctx, L, rng, H) {
  const top = L.base - 210;
  ctx.fillStyle = L.color; ctx.fillRect(0, top, BG_W, H - top);
  // the reed-slat canopy and the stripes of sun through it
  ctx.fillStyle = '#7a5434'; ctx.fillRect(0, top - 14, BG_W, 16);
  for (let x = 0; x < BG_W; x += 22) { ctx.fillStyle = '#5a3a22'; ctx.fillRect(x, top - 14, 3, 16); }
  ctx.fillStyle = 'rgba(255,244,210,0.16)'; for (let x = 30; x < BG_W; x += 90) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + 18, top); ctx.lineTo(x + 70, H); ctx.lineTo(x + 52, H); ctx.closePath(); ctx.fill(); }
  // shop bays: an awning, two shelves of goods, a lantern; the zellige plinth along the bottom
  let x = 0, b = 0;
  while (x < BG_W) {
    const w = 120 + rng() * 60, y0 = L.base - 170;
    ctx.fillStyle = shade(L.color, (b % 2 ? -0.06 : 0.04)); ctx.fillRect(x + 4, y0 - 10, w - 8, 160);
    const aw = ['#b8222a', '#2a4a9a', '#1a9a8a'][b % 3];
    for (let k = 0; k < Math.floor((w - 12) / 14); k++) { ctx.fillStyle = k % 2 ? '#f4e8d0' : aw; ctx.fillRect(x + 6 + k * 14, y0 - 10, 14, 16); ctx.beginPath(); ctx.arc(x + 13 + k * 14, y0 + 6, 7, 0, Math.PI); ctx.fill(); }
    for (const sy of [y0 + 52, y0 + 104]) {
      ctx.fillStyle = '#6a4228'; ctx.fillRect(x + 10, sy, w - 20, 5);
      for (let gx = x + 16; gx < x + w - 18; gx += 13 + rng() * 6) {
        const kind = rng();
        if (kind < 0.4) { ctx.fillStyle = ['#c8643a', '#1a6ab8', '#1a9a8a'][Math.floor(rng() * 3)]; ctx.beginPath(); ctx.ellipse(gx + 5, sy - 8, 6, 8, 0, 0, TAU); ctx.fill(); ctx.fillRect(gx + 2, sy - 18, 6, 4); }
        else if (kind < 0.75) { ctx.fillStyle = ['#e8c050', '#d8402a', '#f4e8d0', '#3aa86a'][Math.floor(rng() * 4)]; ctx.beginPath(); ctx.moveTo(gx, sy); ctx.quadraticCurveTo(gx + 2, sy - 7, gx + 12, sy - 5); ctx.lineTo(gx + 12, sy); ctx.closePath(); ctx.fill(); }
        else { ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.arc(gx + 6, sy - 9, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#a8802a'; ctx.beginPath(); ctx.arc(gx + 6, sy - 9, 5, 0, TAU); ctx.fill(); }
      }
    }
    const lx = x + w / 2; ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, top); ctx.lineTo(lx, y0 - 30); ctx.stroke();
    ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.moveTo(lx - 6, y0 - 30); ctx.lineTo(lx + 6, y0 - 30); ctx.lineTo(lx + 8, y0 - 20); ctx.lineTo(lx, y0 - 12); ctx.lineTo(lx - 8, y0 - 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,140,0.9)'; ctx.fillRect(lx - 2.5, y0 - 26, 5, 7);
    x += w; b++;
  }
  ctx.fillStyle = ZEL_SOUK[0]; ctx.fillRect(0, L.base - 14, BG_W, 14);
  for (let x2 = 0; x2 < BG_W; x2 += 16) { ctx.fillStyle = ZEL_SOUK[(x2 / 16) % 2 ? 1 : 2]; ctx.save(); ctx.translate(x2 + 8, L.base - 7); ctx.rotate(Math.PI / 4); ctx.fillRect(-3.5, -3.5, 7, 7); ctx.restore(); }
};
const ZEL_SOUK = ['#1a6ab8', '#1a9a8a', '#f4ecd8'];
if (THEMES.ma_souk) {
  const far = { kind: 'maAtlas', color: '#a8a8c8', base: 300, f: 0.02, blur: true };
  THEMES.ma_souk_maze = Object.assign({}, THEMES.ma_souk, {
    name: 'The Souk',
    layers: [
      (typeof BRADY_SPRITES !== 'undefined' && BRADY_SPRITES.indexOf('ma_souk') >= 0) ? { kind: 'image', atlas: 'ma_souk', id: 'L0', f: far.f, base: far.base, color: far.color, fallback: far, shift: 0 } : far,
      { kind: 'maSoukRoofs', color: '#e8b088', base: 300, f: 0.08 },
      { kind: 'maSoukLane', color: '#d8946a', base: 352, f: 0.25 }
    ]
  });
}
if (THEMES.ma_souk_maze && typeof Atlas !== 'undefined' && typeof BRADY_SPRITES !== 'undefined' && BRADY_SPRITES.indexOf('ma_souk') >= 0) Atlas.applyTiles(THEMES.ma_souk_maze, 'ma_souk', { ground: 'ground' });

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
  lanternShop, teaRoom,
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
  stamps, skins: soukSkins,
  levels: [
    /* 5-1 MAZE: a 3 x 3 souk of rug doors. Every door goes somewhere and its plaque says where; the rooftop door is
       behind a grille whose key is down in the cumin cellar, so Brady goes down the paprika stairs and back */
    { n: 1, name: 'Souk Labyrinth', mapLabel: 'Souk', arch: 'maze', theme: 'ma_souk_maze',
      gimmick: 'A maze of rug doors with a sign over each: fetch the rooftop key from the cumin cellar and find your way back up',
      hint: 'The sign over a door shows where it goes. Saffron goes up, paprika goes down, mint is the back stairs',
      postcard: 'The souk is a maze, Brady. The key was in the cellar the whole time! ♥ C',
      enemies: [['maTagine', 2], ['maTeapot', 1], ['maMoth', 2]],
      mapCell: [0, 0], mapFrom: -1,
      exits: {
        main: { to: '5-2' },
        secret: { to: '5-6', hint: 'In the lantern shop, one lantern was never lit...' }
      },
      areas: [
        { id: 'souk', gen: 'maze', cells: [3, 3], cell: [26, 14],
          script: [[souk.gate, souk.spices, souk.roofs], [souk.baskets, souk.dyers, souk.alley], [souk.cellar, souk.cooks, souk.court]],
          // the doors are stamp doors in the cells (each with its own sign); the links are the two holes in the floor
          links: [
            { from: [1, 0], to: [1, 1], kind: 'drop' },
            { from: [0, 1], to: [0, 2], kind: 'drop', at: [18, 0] }
          ] },
        { id: 'shop', gen: 'room', role: 'secret', theme: 'ma_lampshop', stamp: 'lanternShop' },
        { id: 'tea', gen: 'room', role: 'sub', theme: 'ma_tent', stamp: 'teaRoom' }
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
          ['itemBlock', { item: 'beans', y: 4 }],   // Magic Beans (fart float), early in the land (Brady's request)
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
      gimmick: 'Kasbah walls and a tree full of goats, a tower of chains and tagine lids, then Piwi\'s clockwork owl',
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
      postcard: 'The kasbah is unrolled and back on its hill! Piwi went to Spain. ¡Olé! ♥ C',
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
          ['itemBlock', { item: 'lsd', y: 4 }],   // moved up from the end (Brady: star / acid too often came at the end, where they are no use)
          // ③ moths nibbling the carpets while the storks swoop
          ['rugIsland', { w: 7, moth: true, tight: true }],
          ['rugIsland', { w: 6, dy: -2, moth: true, tight: true }],
          ['enemies', { kind: 'maStork', n: 1 }],
          ['flyingRugs', { n: 2, span: 10 }],
          ['end', { exit: 'main' }]
        ] },
        { id: 'tent', gen: 'room', role: 'secret', theme: 'ma_tent', stamp: 'skyTent' }
      ] }
  ]
});
})();
