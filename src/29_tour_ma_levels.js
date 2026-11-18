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

/* ---------------- Pupo in Morocco (docs/design/PUPO.md §4.2, §4.3) ---------------- */
const PP = {
  // a Nap Box on the ground, o.back columns behind the cursor (under the argan tree just built), taking no room
  napBox(st, o) {
    const tx = st.x - (o.back || 0), ty = st.gy - 1 - (o.y || 0);
    if (!o.back) st.floor(tx - 1, tx + 1);
    st.B.set(tx, ty, T.QBLOCK); st.B.item(tx, ty, 'pupo'); st.B.spawn('napBox', tx, ty, {});
    return o.back ? st.x : st.x + 2;
  },
  /* 5-4's Pupo obstacle, The Beam-End Ladder: the kasbah tower's smooth mud wall, the ends of its wooden floor beams
     sticking out of it in a zig-zag (two rows up and four columns across each time) and the tower-room window at the
     top on its little ledge. The mountain wind pours straight down the tower's face (a downdraft over the whole climb):
     a jump, a spring sock or a puff of magic beans goes nowhere in it, but Pupo zips along his own arm from beam end to
     beam end (Action), and the wind can't touch a zip. The kasbah goats watch from the ledge, unimpressed.
     The tower itself is scenery (not solid): only the beam ends and the ledge stand, as one-way tops (a zip's straight
     line up to the next beam end would clip a solid one's corner). { n: beam ends } */
  beamTower(st, o) {
    const B = st.B, x = st.x, gy = st.gy, n = o.n || 5, c0 = x + 6, top = gy - 2 * (n + 1);
    st.floor(x, x + 18);
    st.sign(x + 1, 'THE MOUNTAIN WIND POURS DOWN THE TOWER: NO JUMPING UP IT! PUPO CAN ZIP UP THE BEAM ENDS (ACTION)');
    const lx = c0 + (n % 2) * 4;
    B.prop('maBeamTower', c0 - 2, top - 3, 9, gy - top + 3, 'none', { n, ledge: [lx * TS, top * TS, 5 * TS] });
    for (let k = 0; k < n; k++) {
      const bx = c0 + (k % 2) * 4, by = gy - 2 - 2 * k;
      B.set(bx, by, T.SEMI); B.setHide(bx, by, 1);
      B.spawn('pupoGrab', bx, by - 1, { kind: 'post', look: 'maBeamEnd', say: k === 0 ? '...UP... WE GO.' : null });
    }
    // the window ledge, its own beam end at the near corner (the last zip), the window and the goats at the far end
    for (let q = 0; q < 5; q++) { B.set(lx + q, top, T.SEMI); B.setHide(lx + q, top, 1); }
    B.spawn('pupoGrab', lx, top - 1, { kind: 'post', look: 'maBeamEnd' });
    B.spawn('portal', lx + 2, top - 1, { kind: 'door', look: 'maTowerWindow', targetRef: o.to || null });
    B.spawn('maWatchGoat', lx + 4, top - 1, { dir: -1, k: 0 });
    // the downdraft: from above the ledge to the ground, over the whole face and two columns either side
    B.zone(c0 - 3, top - 4, 12, gy - top + 4, 0, (o.wind || 150) * TS, 0, 'downdraft');
    B.spawn('maDownWind', c0 - 3, gy - 1, { w: 12, h: gy - top + 4 });
    return c0 + 10;
  },
  /* 5-3's Pupo bonus (a helper level), by day: a washing line strung from a blue house's roof over the lane to a taller
     house's roof terrace, with a 1-up waiting up there. The lane is too wide to jump and the terrace too high to reach
     from the street; Pupo hangs from the line (Action) and shimmies across under the sheets. By night the washing is
     taken in and the line is gone. { lane: the lane's width, g: the phase group } */
  laundryTerrace(st, o) {
    const B = st.B, x = st.x, gy = st.gy, lane = o.lane || 10, g = o.g || 0;
    const a0 = x + 1, a1 = a0 + 7, t0 = a1 + lane + 1, t1 = t0 + 6, roofA = gy - 5, roofT = gy - 7;
    st.floor(x, t1 + 3);
    // the first house: steps up its side to the roof (as blueHouse does)
    for (let k = 0; k < 4; k++) B.fill(a0 + k, gy - 1 - k, a0 + k, gy - 1, T.BRICK);
    B.fill(a0 + 4, roofA, a1, gy - 1, T.BRICK);
    st.decor('maFlowerPots', a1 - 1, roofA);
    // the tall house with its roof terrace, a little parapet, coins and the 1-up box; the lane runs on under it through
    // a covered passage (as Chefchaouen's lanes do)
    B.fill(t0, roofT, t1, gy - 4, T.BRICK);
    B.prop('maPassage', t0, gy - 3, t1 - t0 + 1, 3, 'none', {});
    B.set(t1, roofT - 1, T.BRICK);
    st.decor('maFlowerPots', t0 + 1, roofT);
    B.picksRow(t0 + 1, t1 - 1, roofT - 1);
    st.block(t1 - 2, roofT - 3, 'oneup');
    // the line: from over the first roof to over the terrace's near end (four rows over it: hanging, his feet are half
    // a tile above the terrace, so he shimmies over it and drops on)
    B.spawn('pupoBar', a1 - 2, roofT - 4, { w: t0 + 1 - (a1 - 2) + 1, look: 'maLaundryBar', need: { g, on: false }, say: '...FRESH... SHEETS.', dropSay: '...OH. NIGHT.' });
    st.sign(x, 'BY DAY A WASHING LINE HANGS OVER THE LANE. PUPO CAN HANG FROM IT (ACTION) AND SHIMMY ACROSS');
    st.coins(a1 + 2, t0 - 2, gy - 3);
    return t1 + 4;
  }
};
for (const k in PP) Tour.pieces['ma.' + k] = PP[k];

// 5-4: a kasbah goat watching from the tower-room ledge; Pupo arriving gets one flat "MEH."
class MaWatchGoat extends Ent {
  constructor(g, s) { super(g, s, 30, 26); this.x = s.x - 15; this.y = s.y - 26; this.dir = s.dir || -1; this.friendly = true; this.back = true; this.said = false; this.chew = 0; }
  update(dt) {
    this.t += dt; this.chew += dt;
    if (this.said) return;
    const g = this.g, p = g.player;
    if (p && p.pupoRide && !p.dead && Math.abs(p.cx - this.cx) < 4 * TS && Math.abs(p.y + p.h - (this.y + this.h)) < TS) {
      this.said = true; g.parts.text(this.cx, this.y - 12, 'MEH.', '#ffffff');
      PupoRide.say(g, p.cx, p.y - 30, '...NICE... VIEW.');
    }
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, d = this.dir, jaw = Math.sin(this.chew * 9) > 0.3 ? 1.5 : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1); ctx.lineJoin = 'round';
    // legs, body, head: a flat cream goat with a dark ink rim
    ctx.fillStyle = INK; for (const lx of [-10, -4, 4, 9]) ctx.fillRect(lx - 2.5, -10, 5, 10);
    ctx.fillStyle = '#d8ccb8'; for (const lx of [-10, -4, 4, 9]) ctx.fillRect(lx - 1.5, -9, 3, 9);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(-1, -15, 15, 9.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f4ecdc'; ctx.beginPath(); ctx.ellipse(-1, -15, 13.4, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c8a878'; ctx.beginPath(); ctx.ellipse(-6, -17, 5, 3, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(13, -22, 7.6, 6.4, 0.35, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f4ecdc'; ctx.beginPath(); ctx.ellipse(13, -22, 6, 4.9, 0.35, 0, TAU); ctx.fill();
    // horns, a beard that wags as it chews, a bored half-lidded eye
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(9, -28, 5, Math.PI * 0.9, Math.PI * 1.75); ctx.stroke();
    ctx.strokeStyle = '#9a8a72'; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(15, -18); ctx.lineTo(17 + jaw, -10); ctx.lineTo(12, -17); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(14.5, -23.5, 2, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.fillRect(12.4, -25.6, 4.4, 2); ctx.beginPath(); ctx.arc(15, -23, 0.9, 0, TAU); ctx.fill();
    ctx.restore(); ctx.lineCap = 'butt';
  }
}
// 5-4: the downdraft over the tower's face: thin streaks of wind and grit racing down (cheap: lines from the clock)
class MaDownWind extends Ent {
  constructor(g, s) { super(g, s, (s.w || 10) * TS, (s.h || 10) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; this.back = true; this.friendly = true; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x0 = this.x, y0 = this.y, w = this.w, h = this.h, t = this.t;
    ctx.lineCap = 'round';
    for (let k = 0; k < 16; k++) {
      const sp = 260 + (k * 37) % 120, u = ((t * sp + k * 97) % (h + 60)) - 40, xx = x0 + 10 + ((k * 61) % (w - 20)), len = 26 + (k % 3) * 12;
      ctx.strokeStyle = k % 4 ? 'rgba(255,255,255,0.5)' : 'rgba(255,232,190,0.7)'; ctx.lineWidth = k % 3 ? 2 : 3;
      ctx.beginPath(); ctx.moveTo(xx, y0 + u); ctx.lineTo(xx - 3, y0 + u + len); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(200,140,90,0.75)';
    for (let k = 0; k < 10; k++) { const u = ((t * (320 + k * 23) + k * 131) % h), xx = x0 + 6 + ((k * 89) % (w - 12)) + Math.sin(t * 3 + k) * 4; ctx.fillRect(xx, y0 + u, 2.5, 2.5); }
    ctx.lineCap = 'butt';
  }
}
Object.assign(ENTITY_TYPES, { maWatchGoat: MaWatchGoat, maDownWind: MaDownWind });
// 5-4: the kasbah tower behind the beam ends: rammed earth in warm bands, crenellated corners, slit windows, the
// tower-room window up top (the portal draws its own frame); d.n beam ends
Decor.maBeamTower = (ctx, x, y, t, th, d) => {
  const w = d.w - 40, h = d.h, x0 = x - w / 2, top = y - h, inset = 9, edge = yy => inset * (y - yy) / (y - top - 24);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x0 - 3, y); ctx.lineTo(x0 + inset - 2, top + 22); ctx.lineTo(x0 + w - inset + 2, top + 22); ctx.lineTo(x0 + w + 3, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c8784a'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + inset, top + 24); ctx.lineTo(x0 + w - inset, top + 24); ctx.lineTo(x0 + w, y); ctx.closePath(); ctx.fill();
  // rammed-earth courses (darker bands following the taper) and a lighter sunny edge
  ctx.fillStyle = '#b4683e'; for (let yy = y - 40; yy > top + 40; yy -= 44) { const e = edge(yy); ctx.fillRect(x0 + e, yy, w - 2 * e, 8); }
  ctx.fillStyle = '#e09868'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + inset, top + 24); ctx.lineTo(x0 + inset + 8, top + 24); ctx.lineTo(x0 + 8, y); ctx.closePath(); ctx.fill();
  // the crenellated top: a band of carved diamonds, then corner merlons
  ctx.fillStyle = INK; ctx.fillRect(x0 + 4, top + 2, w - 8, 26);
  ctx.fillStyle = '#d88a58'; ctx.fillRect(x0 + 6, top + 4, w - 12, 22);
  ctx.fillStyle = '#8a4a2a'; for (let xx = x0 + 18; xx < x0 + w - 14; xx += 22) { ctx.beginPath(); ctx.moveTo(xx, top + 8); ctx.lineTo(xx + 6, top + 15); ctx.lineTo(xx, top + 22); ctx.lineTo(xx - 6, top + 15); ctx.closePath(); ctx.fill(); }
  for (const mx of [x0 + 4, x0 + w - 26]) { ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(mx, top + 4); ctx.lineTo(mx + 4, top - 22); ctx.lineTo(mx + 18, top - 22); ctx.lineTo(mx + 22, top + 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#d88a58'; ctx.beginPath(); ctx.moveTo(mx + 2, top + 2); ctx.lineTo(mx + 5.5, top - 20); ctx.lineTo(mx + 16.5, top - 20); ctx.lineTo(mx + 20, top + 2); ctx.closePath(); ctx.fill(); }
  // two slit windows between the beam ends
  ctx.fillStyle = '#3a2018'; for (let k = 0; k < 2; k++) { rr(ctx, x - 3, y - 110 - k * 128, 6, 22, 3); ctx.fill(); }
  // the window ledge: a cedar balcony on two brackets (its tiles are the standing part)
  if (d.ledge) {
    const [lx, ly, lw] = d.ledge;
    ctx.fillStyle = INK; rr(ctx, lx - 3, ly - 3, lw + 6, 16, 4); ctx.fill();
    ctx.fillStyle = '#9a6a3a'; rr(ctx, lx, ly, lw, 11, 3); ctx.fill(); ctx.fillStyle = '#b8844a'; ctx.fillRect(lx, ly, lw, 3);
    for (const bx of [lx + 18, lx + lw - 22]) { ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(bx - 6, ly + 10); ctx.lineTo(bx + 6, ly + 10); ctx.lineTo(bx - 6, ly + 30); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#7a5030'; ctx.beginPath(); ctx.moveTo(bx - 4, ly + 11); ctx.lineTo(bx + 3, ly + 11); ctx.lineTo(bx - 4, ly + 25); ctx.closePath(); ctx.fill(); }
  }
};
// 5-3: the covered passage under the tall house: a shady horseshoe arch over the lane
Decor.maPassage = (ctx, x, y, t, th, d) => {
  const w = d.w, h = d.h, x0 = x - w / 2;
  ctx.fillStyle = '#2a4a7a'; ctx.beginPath(); ctx.moveTo(x0 + 4, y); ctx.lineTo(x0 + 4, y - h + 30); ctx.quadraticCurveTo(x0 + 4, y - h + 2, x, y - h + 2); ctx.quadraticCurveTo(x0 + w - 4, y - h + 2, x0 + w - 4, y - h + 30); ctx.lineTo(x0 + w - 4, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a6aa8'; ctx.fillRect(x0 + 4, y - 10, w - 8, 10);
  ctx.strokeStyle = '#e8f0ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + 4, y); ctx.lineTo(x0 + 4, y - h + 30); ctx.quadraticCurveTo(x0 + 4, y - h + 2, x, y - h + 2); ctx.quadraticCurveTo(x0 + w - 4, y - h + 2, x0 + w - 4, y - h + 30); ctx.lineTo(x0 + w - 4, y); ctx.stroke();
};
const pupoSkins = {
  // 5-4: a beam end (a pupoGrab post look): a squared cedar log end out of the wall, end grain rings, the brass ring on top
  maBeamEnd(ctx, e, t) {
    const x = e.hx, y = e.standY;
    ctx.fillStyle = INK; rr(ctx, x - 17, y - 2, 34, TS - 2, 5); ctx.fill();
    ctx.fillStyle = '#8a5a32'; rr(ctx, x - 15, y, 30, TS - 6, 4); ctx.fill();
    ctx.fillStyle = '#a8743e'; ctx.fillRect(x - 15, y, 30, 5);
    ctx.strokeStyle = '#5a3a1e'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, y + 13, 8, 6, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y + 13, 3.5, 2.6, 0, 0, TAU); ctx.stroke();
    pupoRing(ctx, x, y - 6, 4.5);
  },
  // 5-4: the tower-room window (a portal look): a horseshoe-arched opening with open cedar shutters and lamplight inside
  maTowerWindow(ctx, e, t) {
    const x = e.cx, y = e.y + e.h, w = 34, h = 50;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x - w / 2 - 3, y); ctx.lineTo(x - w / 2 - 3, y - h + 14); ctx.arc(x, y - h + 14, w / 2 + 3, Math.PI, 0); ctx.lineTo(x + w / 2 + 3, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd890'; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2, y - h + 14); ctx.arc(x, y - h + 14, w / 2, Math.PI, 0); ctx.lineTo(x + w / 2, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffb860'; ctx.fillRect(x - w / 2, y - 16, w, 16);
    for (const s of [-1, 1]) { ctx.fillStyle = INK; ctx.fillRect(x + s * (w / 2 + 2) - (s < 0 ? 14 : 0), y - h + 8, 14, h - 8); ctx.fillStyle = '#6a8a4a'; ctx.fillRect(x + s * (w / 2 + 3) - (s < 0 ? 12 : 0), y - h + 10, 12, h - 12); ctx.fillStyle = '#4a6a34'; for (let yy = y - h + 16; yy < y - 4; yy += 8) ctx.fillRect(x + s * (w / 2 + 3) - (s < 0 ? 12 : 0), yy, 12, 2); }
    // a brass lantern hanging inside
    const ly = y - h + 22 + Math.sin(t * 1.6) * 1.2; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y - h + 4); ctx.lineTo(x, ly - 7); ctx.stroke();
    ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.moveTo(x - 5, ly - 7); ctx.lineTo(x + 5, ly - 7); ctx.lineTo(x + 6, ly + 2); ctx.lineTo(x, ly + 7); ctx.lineTo(x - 6, ly + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff4c0'; ctx.fillRect(x - 2, ly - 4, 4, 5);
  },
  // 5-3: the washing line over the lane (a pupoBar look): poles on the roofs, the line, sheets and socks pegged on it;
  // by night only the poles are left
  maLaundryBar(ctx, e, t) {
    const x0 = e.x + 4, x1 = e.x + e.w - 4, y = e.y, k = e.lk = approach(e.lk == null ? 1 : e.lk, e.up ? 1 : 0, 1 / 30);
    ctx.fillStyle = INK; ctx.fillRect(x0 - 4, y - 8, 8, 4 * TS - 12); ctx.fillRect(x1 - 4, y - 8, 8, 3 * TS + 4);
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x0 - 2, y - 6, 4, 4 * TS - 16); ctx.fillRect(x1 - 2, y - 6, 4, 3 * TS);
    if (k < 0.05) return;
    ctx.save(); if (k < 1) ctx.globalAlpha = k;
    const mid = (x0 + x1) / 2;
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo(mid, y + 6, x1, y); ctx.stroke();
    ctx.strokeStyle = '#f4f0e6'; ctx.lineWidth = 2; ctx.stroke();
    const cols = ['#e8503a', '#ffffff', '#f0c040', '#3aa86a', '#e86aa8', '#4a86d0'];
    for (let q = 0, xx = x0 + 10; xx < x1 - 22; xx += 34, q++) {
      const u = (xx - x0) / (x1 - x0), sag = 4 * u * (1 - u) * 6, sw = Math.sin(t * 2 + q) * 2, wide = q % 3 === 1;
      const cw = wide ? 22 : 12, ch = wide ? 18 : 14;
      ctx.fillStyle = INK; rr(ctx, xx - 1.5, y + sag - 1.5, cw + 3, ch + 3, 3); ctx.fill();
      ctx.fillStyle = cols[q % cols.length]; ctx.beginPath(); ctx.moveTo(xx, y + sag); ctx.lineTo(xx + cw, y + sag); ctx.lineTo(xx + cw - 1 + sw, y + sag + ch); ctx.lineTo(xx + 1 + sw, y + sag + ch); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c8c0b0'; ctx.fillRect(xx + 2, y + sag - 3, 2, 5); ctx.fillRect(xx + cw - 4, y + sag - 3, 2, 5);
    }
    ctx.restore();
    pupoRing(ctx, x0 + 14, y + 1, 4.2); pupoRing(ctx, x1 - 14, y + 1, 4.2);
  }
};
Tour.amend('ma', { skins: pupoSkins });

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
        { id: 'camp', gen: 'room', role: 'secret', theme: 'ma_tent', stamp: 'oasisCamp', room: 'pick',
          pick: { title: 'THE CARAVAN BARGAIN', rule: 'A CAMEL TRADER LAYS OUT THREE BOXES ON HIS RUG. YOU MAY TAKE ONE. ONE!' } }
      ] },

    /* 5-3 PHASE: the sun-moon lantern turns the blue medina from day to night and back */
    { n: 3, name: 'Chefchaouen Blue', mapLabel: 'Blue City', arch: 'phase', theme: 'ma_azul', pupo: 'helper',   // Pupo's Nap Box by the first blue stair, the washing line to the roof terrace
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
        { id: 'medina', gen: 'strip', W: 222, H: 24, GY: 16, gyMax: 16, phase: { night: 'ma_azul_night' }, script: [   // two more rows of sky (the roof terrace stays clear of the HUD)
          // ① day: blue stairs, laundry lines, napping cats
          ['itemBlock', { item: 'power', y: 4 }],
          ['itemBlock', { item: 'beans', y: 4 }],   // a jump power (bonus)
          // Pupo (a helper here, PUPO.md §4.3): his Nap Box at the foot of the first blue stair; his bonus is the roof
          // terrace across the lane, reached by day along the washing line
          ['napBox', {}],
          ['blueHouse', { w: 8, h: 5, gold: 'must' }],
          ['laundryTerrace', { lane: 10 }],
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
        { id: 'riad', gen: 'room', role: 'secret', theme: 'ma_riad', stamp: 'blueRiad', room: 'lamps',
          lamps: { title: 'THE RIAD\'S LANTERNS', rule: 'THE BLUE RIAD IS DARK. LIGHT ITS LANTERNS IN THE ORDER THE TILE PICTURE SHOWS', sym: 1 } }
      ] },

    /* 5-4 FORT: kasbah walls, the tower room's chain and lids, the Brass Owl */
    { n: 4, name: 'Kasbah of the Brass Owl', mapLabel: 'Kasbah', arch: 'fort', theme: 'ma_atlas', boss: 'ma_owl', mid: true, pupo: 'level',   // Morocco's Pupo level: The Beam-End Ladder
      gimmick: 'Kasbah walls and a tree full of goats, a tower of chains and tagine lids, then Piwi\'s clockwork owl',
      hint: 'Pull a chain while the Brass Owl looks the other way: the lid drops on it',
      postcard: 'A brass owl guarded the kasbah. It fell apart into teaspoons! We kept one. ♥ C',
      enemies: [['maGoat', 2], ['maFennec', 2]],
      mapCell: [2, 1], mapFrom: [2, 5],
      exits: { main: { to: '5-5' } },
      areas: [
        // five more rows of sky over the kasbah (the tower climbs to row 7, clear of the HUD); gyMax keeps the steps where they were
        { id: 'kasbah', gen: 'strip', W: 120, H: 24, GY: 19, gyMax: 19, gyMin: 12, script: [
          ['portcullis', { title: 'KASBAH OF THE BRASS OWL' }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['kasbahWall', { n: 3, enemy: 'maFennec' }],
          ['arganTree', { gold: 'must' }],
          ['napBox', { back: 4 }],   // Pupo's Nap Box under the argan tree (PUPO.md §4.2); he waits at the owl arena door
          ['kasbahWall', { n: 2 }],
          ['step', { h: 3 }],
          ['secretDoor', { to: 'loft@in', look: 'fake', back: 'loftBack' }],
          ['step', { h: -3 }],
          'cp',
          ['napBox', {}],   // the backup Nap Box at the checkpoint (the near side of the ladder)
          ['enemies', { kind: 'maGoat', n: 1 }],
          ['kasbahWall', { n: 3, enemy: 'maFennec' }],
          ['arganTree', { goats: false }],
          ['kasbahWall', { n: 2 }],
          // Pupo's obstacle, The Beam-End Ladder: up the tower's beam ends to the tower-room window, in a downdraft
          ['beamTower', { n: 5, to: 'tower@in' }]
        ] },
        { id: 'tower', gen: 'room', role: 'sub', theme: 'ma_atlas', stamp: 'owlTower' },
        { id: 'owl', gen: 'arena', role: 'arena', layout: 'owl', arenaW: 24, H: 16, theme: 'ma_atlas' },
        { id: 'loft', gen: 'room', role: 'secret', stamp: 'pigeonLoft', room: 'ambush',
          ambush: { title: 'THE GOAT LOFT', rule: 'THE KASBAH GOATS AND FENNECS DON\'T LIKE VISITORS. THE DOOR IS STUCK: STOMP THEM ALL', critters: ['maGoat', 'maFennec'] } }
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
        { id: 'court', gen: 'room', role: 'secret', theme: 'ma_riad', stamp: 'smallCourt', room: 'fetch',
          fetch: { title: 'MINT TEA FOR THE OWL', rule: 'THE OLD OWL WANTS HIS MINT TEA: FIND THE MINT, THE SUGAR AND THE TEAPOT, THEN TO THE POT', ingredients: ['tokMint', 'tokSugar', 'tokTeapot'], dish: 'MINT TEA! THE OWL IS ALMOST SMILING.' } },
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
        { id: 'tent', gen: 'room', role: 'secret', theme: 'ma_tent', stamp: 'skyTent', room: 'floaty',
          floaty: { title: 'THE FLYING CARPET TENT', rule: 'A TENT FULL OF FLYING CARPETS: EVERYTHING FLOATS IN HERE. BIG FLOATY JUMPS!' } }
      ] }
  ]
});
})();
