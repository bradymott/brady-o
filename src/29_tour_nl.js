/* ============================================================
   THE NETHERLANDS (world 8). This file holds the look, the cast,
   the objects, the signature item (the Dutch bike), the boss and
   the music. The levels (v2 format, LEVEL_OVERHAUL.md §2) are in
   29_tour_nl_levels.js:
   8-1 Polder Pumps     SWITCH   8-4 Frozen Canals  LAMP (hidden exit to Antarctica)
   8-2 Flower Auction   FACTORY  8-5 The Weigh House LAIR
   8-3 Bike Lane Rush   RACE     8-6 Windmill Row   SWING (secret)
   ============================================================ */
(() => {
const COL = { a: '#ff7a1a', b: '#2a5ad8', c: '#e8322a' };
const K = TourKit;
const TULIP = ['#e8322a', '#ffd23a', '#ff6ab8', '#ff8a1a', '#b84aff', '#ffffff'];
const GABLE = ['#7a3a2a', '#3a4a5a', '#5a2a2a', '#2a3a2a', '#8a6a4a', '#4a3a5a'];
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };

/* ---------------- background painters ---------------- */
function gableHouse(ctx, x, b, w, h, col, night, rng) {
  ctx.fillStyle = col; ctx.fillRect(x, b - h, w, h + 400);
  const g = h > 120 ? 'bell' : 'step';
  ctx.beginPath();
  if (g === 'step') { ctx.moveTo(x, b - h); for (let k = 0; k < 3; k++) { ctx.lineTo(x + k * w / 7, b - h - 8 - k * 8); ctx.lineTo(x + (k + 1) * w / 7, b - h - 8 - k * 8); } ctx.lineTo(x + w / 2, b - h - 36); for (let k = 2; k >= 0; k--) { ctx.lineTo(x + w - (k + 1) * w / 7, b - h - 8 - k * 8); ctx.lineTo(x + w - k * w / 7, b - h - 8 - k * 8); } ctx.lineTo(x + w, b - h); }
  else { ctx.moveTo(x, b - h); ctx.quadraticCurveTo(x + 4, b - h - 20, x + w * 0.3, b - h - 24); ctx.quadraticCurveTo(x + w / 2, b - h - 44, x + w * 0.7, b - h - 24); ctx.quadraticCurveTo(x + w - 4, b - h - 20, x + w, b - h); }
  ctx.fill();
  ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x + w / 2 - 1, b - h - 30, 2, 10);
  for (let wy = b - h + 10; wy < b - 14; wy += 26) for (let k = 0; k < 2; k++) { ctx.fillStyle = night ? (rng() < 0.55 ? '#ffd890' : '#2a2a3a') : '#e8f0f8'; ctx.fillRect(x + 6 + k * (w / 2), wy, w / 2 - 12, 16); ctx.strokeStyle = '#f4f0e8'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 6 + k * (w / 2), wy, w / 2 - 12, 16); }
}
const painters = {
  // tall narrow canal houses leaning shoulder to shoulder
  nlCanalHouses(ctx, L, rng, H) { let x = 0; while (x < BG_W) { const w = 46 + rng() * 26, h = 100 + rng() * 70; gableHouse(ctx, x, L.base, w, h, L.night ? shade(GABLE[Math.floor(rng() * 6)], -0.3) : GABLE[Math.floor(rng() * 6)], L.night, rng); x += w; } },
  // the canal itself, with reflections
  nlCanal(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, L.base, H, L.color, shade(L.color, -0.35)); ctx.fillRect(0, L.base, BG_W, H - L.base);
    ctx.strokeStyle = L.night ? 'rgba(255,220,140,0.4)' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; for (let i = 0; i < 50; i++) { const x = rng() * BG_W, y = L.base + 6 + rng() * 50; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10 + rng() * 14, y); ctx.stroke(); }
    for (const bx of [200, 700]) wrapDraw(bx, 140, xx => { ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.moveTo(xx, L.base); ctx.quadraticCurveTo(xx + 70, L.base - 40, xx + 140, L.base); ctx.lineTo(xx + 140, L.base - 4); ctx.quadraticCurveTo(xx + 70, L.base - 46, xx, L.base - 4); ctx.fill(); if (L.night) { ctx.fillStyle = '#ffd890'; for (let k = 0; k < 7; k++) { const t = k / 6; ctx.beginPath(); ctx.arc(xx + t * 140, L.base - 4 - Math.sin(t * Math.PI) * 42, 2.2, 0, TAU); ctx.fill(); } } });
  },
  // flat polder fields striped with tulips, windmills on the horizon
  nlPolder(ctx, L, rng, H) {
    for (let r = 0; r < 7; r++) { ctx.fillStyle = r % 2 ? TULIP[(r >> 1) % 5] : '#3a8a3a'; ctx.beginPath(); ctx.moveTo(0, L.base + r * 12); ctx.lineTo(BG_W, L.base + r * 12 - 6); ctx.lineTo(BG_W, L.base + r * 12 + 6); ctx.lineTo(0, L.base + r * 12 + 12); ctx.fill(); }
    ctx.fillStyle = '#3a8a3a'; ctx.fillRect(0, L.base + 84, BG_W, H - L.base - 84);
    for (const mx of [150, 520, 860]) wrapDraw(mx, 80, xx => {
      ctx.fillStyle = '#5a4a4a'; ctx.beginPath(); ctx.moveTo(xx - 14, L.base + 2); ctx.lineTo(xx - 8, L.base - 60); ctx.lineTo(xx + 8, L.base - 60); ctx.lineTo(xx + 14, L.base + 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(xx - 12, L.base - 60); ctx.lineTo(xx, L.base - 74); ctx.lineTo(xx + 12, L.base - 60); ctx.fill();
      ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 3; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; ctx.beginPath(); ctx.moveTo(xx, L.base - 64); ctx.lineTo(xx + Math.cos(a) * 40, L.base - 64 + Math.sin(a) * 40); ctx.stroke(); }
    });
  },
  // a frozen canal under a winter night
  nlIce(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, L.base, H, '#c8e0f0', '#7aa0c0'); ctx.fillRect(0, L.base, BG_W, H - L.base);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; for (let i = 0; i < 30; i++) { const x = rng() * BG_W, y = L.base + 8 + rng() * 50; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y + rng() * 4 - 2); ctx.stroke(); }
  },
  // the weigh house hall: beams, cheese racks
  nlHall(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 100) { ctx.fillStyle = shade(L.color, -0.25); ctx.fillRect(x, 0, 14, H); for (let r = 0; r < 4; r++) { ctx.fillStyle = shade(L.color, 0.15); ctx.fillRect(x + 20, L.base - 60 - r * 50, 70, 6); for (let k = 0; k < 3; k++) { ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.ellipse(x + 34 + k * 22, L.base - 70 - r * 50, 10, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8322a'; ctx.fillRect(x + 25 + k * 22, L.base - 72 - r * 50, 18, 3); } } }
  }
};

/* ---------------- tiles: brick quays, a cheese-crate item box ---------------- */
function cheeseBox(ctx, th, f) {
  ctx.save(); ctx.shadowColor = 'rgba(255,200,80,0.85)'; ctx.shadowBlur = 4 + f * 1.5;
  ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.ellipse(TS / 2, TS / 2 + 1, TS / 2 - 1, TS / 2 - 3, 0, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.ellipse(TS / 2, TS / 2 + 1, TS / 2 - 1, TS / 2 - 3, 0, Math.PI * 0.15, Math.PI * 0.85); ctx.fill();
  ctx.fillStyle = '#ffe080'; ctx.beginPath(); ctx.ellipse(TS / 2, TS / 2 - 3, TS / 2 - 5, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a5ad8'; ctx.font = `bold 9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('NL', TS / 2, TS / 2 + 1 + Math.sin(f) * 0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(8, 8, 5, 2);
}
function cheeseUsed(ctx) { ctx.fillStyle = '#a89878'; ctx.beginPath(); ctx.ellipse(TS / 2, TS / 2 + 1, TS / 2 - 1, TS / 2 - 3, 0, 0, TAU); ctx.fill(); }
const base = {
  ground: { style: 'brick', cap: '#8a8a90', capHi: '#b8b8c0', dirt: '#8a3a2a', dirt2: '#5a2418', rock: '#9a4a32' },
  brick: { style: 'brick', c1: '#a8483a', c2: '#7a3024', mortar: '#d8c8b8' }, hard: { c1: '#9a4a32', c2: '#6a2a1e' },
  semi: { style: 'plank', c1: '#3a5a3a', c2: '#1e3a22' }, pillar: { c1: '#8a8a90', c2: '#5a5a60', cap: '#b8b8c0', style: 'column' },
  accent: COL.a, qblockArt: cheeseBox, usedArt: cheeseUsed, tint: {}, bloom: 0.15
};
const themes = {
  nl_canals: Object.assign({}, base, {
    rays: '#fff8e0',
    name: 'The Canal Ring', music: 'tour_nl', particles: 'leaves', liquid: 'canal',
    sky: ['#4a8ad8', '#a8d0f0', '#f4f4f0'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.3, y: 0.15, r: 32, color: '#fffbe8', glow: '#ffffff' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'nlCanalHouses', color: '#7a3a2a', base: 300, f: 0.08 }, { kind: 'nlCanal', color: '#4a7a7a', base: 330, f: 0.12 }],
    fog: '#f0f4f8', decor: ['nlBike', 'nlFlowerBox', 'nlBike']
  }),
  nl_tulips: Object.assign({}, base, {
    rays: '#fffbe8',
    name: 'Tulip Fields', music: 'tour_nl', particles: 'petals',
    ground: { style: 'grass', cap: '#5ab84a', capHi: '#9ae08a', dirt: '#6a4a2a', dirt2: '#4a3018', rock: '#7a5a3a' },
    sky: ['#3a8ae8', '#9ad0ff', '#ffffff'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.75, y: 0.15, r: 34, color: '#fffbe8', glow: '#fff0c0' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'nlPolder', color: '#3a8a3a', base: 300, f: 0.06 }],
    fog: '#ffffff', decor: ['nlTulips', 'nlTulips', 'nlClogsPair']
  }),
  nl_rush: Object.assign({}, base, {
    rays: '#ffe0c0',
    name: 'Bike Lane', music: 'tour_nl_rush', particles: 'leaves', liquid: 'canal',
    sky: ['#ff9a6a', '#ffd0a0', '#fff4e8'], horizonGlow: '#ffe0c0', celestial: { type: 'sun', x: 0.8, y: 0.25, r: 40, color: '#fff0d0', glow: '#ffb880' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'nlCanalHouses', color: '#5a2a2a', base: 300, f: 0.1 }, { kind: 'nlCanal', color: '#5a7a8a', base: 340, f: 0.16 }],
    fog: '#ffe8d8', decor: ['nlBike', 'nlBike', 'nlFlowerBox']
  }),
  nl_frozen: Object.assign({}, base, {
    name: 'Frozen Canals', music: 'tour_nl_night', particles: 'snow', liquid: 'icewater',
    ground: { style: 'snow', cap: '#f0f8ff', capHi: '#ffffff', dirt: '#8a3a2a', dirt2: '#5a2418', rock: '#9a4a32' },
    sky: ['#0a1430', '#1a2a50', '#3a4a70'], horizonGlow: '#8aa8d8', celestial: { type: 'moon', x: 0.7, y: 0.14, r: 26, color: '#f8f8ff', glow: '#b0c8ff' }, stars: 1,
    layers: [{ kind: 'nlCanalHouses', color: '#2a2a3a', base: 300, f: 0.08, night: true }, { kind: 'nlIce', color: '#c8e0f0', base: 335, f: 0.12 }],
    fog: '#8aa8d8', darkness: 0.4, decor: ['nlLamp', 'nlSnowPile']
  }),
  nl_waag: Object.assign({}, base, {
    name: 'The Weigh House', music: 'tour_nl_rush', particles: 'motes',
    ground: { style: 'wood', cap: '#a87a4a', capHi: '#d8a870', dirt: '#7a5a3a', dirt2: '#4a3a24', rock: '#8a6a44' },
    sky: ['#3a2a1e', '#5a4030', '#7a5a40'], horizonGlow: '#ffc890', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'nlHall', color: '#5a4030', base: 360, f: 0.08 }],
    fog: '#ffd8a0', hard: { c1: '#ffc83a', c2: '#c8901a' }, semi: { style: 'plank', c1: '#a87a4a', c2: '#6a4a2a' }
  })
};
// the overhaul's theme keys borrow the closest Fiesta Toon atlas until their own art exists: the polder (8-1) the
// canal ring's strips, the flower auction (8-2) and the windmill row (8-6) the tulip fields. The tulip strip's fields
// sit low in the picture, under the floor line at the usual camera, so it is lifted (shift) for these levels.
const atlasLayers = (atlas, layers, shifts) => layers.map((L, i) => ({ kind: 'image', atlas, id: 'L' + i, f: L.f, base: L.base, dyn: L.dyn, color: L.color, fallback: L, shift: shifts && shifts[i] != null ? shifts[i] : (L.base > 340 ? -Math.min(60, L.base - 335) : 0) }));
// [strip id, f, fallback, shift]: the canal (base 330) is lifted onto the floor line of the usual phone camera
const ownLayers = (atlas, list) => list.map(([id, f, fb, shift]) => ({ kind: 'image', atlas, id, f, base: fb.base, dyn: fb.dyn, color: fb.color, fallback: fb, shift: shift || 0 }));
const borrow = (from, over, shifts, under) => { const th = Object.assign({}, themes[from], over); th.layers = (under || []).concat(atlasLayers(from, themes[from].layers, shifts)); th.atlasBorrow = from; return th; };
// a plain field colour behind a lifted strip, so tall areas never show the sky under its bottom edge
painters.nlFieldFill = (ctx, L, rng, H) => { ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base); };
const FIELD_FILL = [{ kind: 'nlFieldFill', color: '#3a8a3a', base: 250, f: 0.06 }];
const TULIP_LIFT = -110;
Object.assign(themes, {
  // the polder (8-1) and the flower auction hall (8-2) have their own Fiesta Toon strips (nl_polder: the polder with
  // windmills and the brick pumping station, then the canal; nl_veiling: the whole hall with its auction clock and
  // flower trolleys); the painters are the fallback while they load
  nl_polder: Object.assign({}, themes.nl_canals, { name: 'The Polder', particles: 'leaves', sky: ['#5a9ae8', '#b4dcf8', '#f4f4ec'],
    layers: ownLayers('nl_polder', [['L0', 0.06, { kind: 'nlPolder', color: '#5a9a4a', base: 300 }], ['L1', 0.12, { kind: 'nlCanal', color: '#4a7a7a', base: 330 }, -24]]) }),
  nl_veiling: Object.assign({}, themes.nl_canals, { name: 'The Flower Auction', particles: 'petals', liquid: undefined, sky: ['#c8d4dc', '#dce4e8', '#eef2f0'],
    horizonGlow: '#ffffff', celestial: { type: 'none' }, cloudsDyn: false, rays: null, fog: '#eef2f0', decor: ['nlTulips', 'nlFlowerBox', 'nlTulips', 'nlClogsPair'],
    layers: ownLayers('nl_veiling', [['L0', 0.08, { kind: 'nlHall', color: '#a8b4bc', base: 360 }, -84]]) }),
  nl_molens: borrow('nl_tulips', { name: 'Windmill Row', particles: 'petals' }, [TULIP_LIFT], FIELD_FILL)
});
if (typeof Atlas !== 'undefined') for (const k of ['nl_molens']) {
  const th = themes[k], G = th.ground || {};
  Atlas.applyTiles(th, th.atlasBorrow, { ground: 'ground', groundFallback: G.paint ? (c, r, sd) => G.paint(c, r, sd) : null, capFallback: G.paintCap ? (c, a, b2, r, l, rt) => G.paintCap(c, a, b2, r, l, rt) : null });
}
if (typeof LIQUIDS !== 'undefined' && !LIQUIDS.icewater) LIQUIDS.icewater = ['#dff8ff', '#7ac8f0', '#2a6aa8', 'rgba(240,255,255,0.3)', null, 'rgba(255,255,255,0.75)'];

/* ---------------- decor ---------------- */
const decor = {
  nlBike(ctx, x, y) {
    ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 1.5;
    for (const wx of [x - 9, x + 9]) { ctx.beginPath(); ctx.arc(wx, y - 7, 7, 0, TAU); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x - 9, y - 7); ctx.lineTo(x - 2, y - 16); ctx.lineTo(x + 6, y - 16); ctx.lineTo(x + 9, y - 7); ctx.moveTo(x - 2, y - 16); ctx.lineTo(x, y - 7); ctx.lineTo(x + 6, y - 16); ctx.stroke();
    ctx.fillStyle = '#1a1a22'; ctx.fillRect(x - 5, y - 19, 6, 2); ctx.fillRect(x + 4, y - 21, 2, 5);
  },
  nlFlowerBox(ctx, x, y) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 12, y - 8, 24, 8); for (let k = 0; k < 5; k++) { ctx.fillStyle = '#3a8a3a'; ctx.fillRect(x - 10 + k * 5, y - 14, 1.5, 6); ctx.fillStyle = TULIP[k % 5]; ctx.beginPath(); ctx.ellipse(x - 9.5 + k * 5, y - 15, 2.4, 3, 0, 0, TAU); ctx.fill(); } },
  nlTulips(ctx, x, y, t) { for (let k = 0; k < 5; k++) { const sw = Math.sin(t * 2 + k + x) * 1.5; ctx.strokeStyle = '#3a8a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 10 + k * 5, y); ctx.lineTo(x - 10 + k * 5 + sw, y - 14); ctx.stroke(); ctx.fillStyle = TULIP[(k + (x | 0)) % 5]; ctx.beginPath(); ctx.moveTo(x - 13 + k * 5 + sw, y - 14); ctx.lineTo(x - 13 + k * 5 + sw, y - 20); ctx.lineTo(x - 10 + k * 5 + sw, y - 17); ctx.lineTo(x - 7 + k * 5 + sw, y - 20); ctx.lineTo(x - 7 + k * 5 + sw, y - 14); ctx.closePath(); ctx.fill(); } },
  nlClogsPair(ctx, x, y) { for (const s of [-1, 1]) { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(x + s * 7, y - 4, 7, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8901a'; ctx.beginPath(); ctx.ellipse(x + s * 7 - 2, y - 5, 3, 2, 0, 0, TAU); ctx.fill(); } },
  nlLamp(ctx, x, y, t) { ctx.fillStyle = '#1a1a22'; ctx.fillRect(x - 2, y - 56, 4, 56); ctx.fillRect(x - 6, y - 60, 12, 4); ctx.fillStyle = `rgba(255,${220 + Math.sin(t * 3 + x) * 20},150,0.95)`; ctx.fillRect(x - 5, y - 70, 10, 10); },
  nlSnowPile(ctx, x, y) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, y, 14, 7, 0, Math.PI, TAU); ctx.fill(); },
  // a gable's hoisting beam (its hook swings out over the canal)
  nlBeam(ctx, x, y) { ctx.fillStyle = '#5a3a22'; ctx.fillRect(x - 40, y - 6, 52, 8); ctx.fillStyle = '#7a3a2a'; ctx.fillRect(x - 60, y - 40, 24, 120); },
  // a windmill tower with its cap (the sails are the moving platforms)
  nlMill(ctx, x, y, t, th, d) {
    ctx.fillStyle = '#5a4a4a'; ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x - 20, y - d.h); ctx.lineTo(x + 20, y - d.h); ctx.lineTo(x + 40, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a2a2a'; ctx.beginPath(); ctx.moveTo(x - 26, y - d.h); ctx.lineTo(x, y - d.h - 30); ctx.lineTo(x + 26, y - d.h); ctx.fill();
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x - 8, y - 30, 16, 30); ctx.fillStyle = '#2a5a3a'; ctx.fillRect(x - 6, y - 28, 12, 26);
    ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.arc(x, y - d.h - 6, 6, 0, TAU); ctx.fill();
  },
  // a koek-en-zopie stand: hot chocolate and stroopwafels on the ice
  nlStall(ctx, x, y) { ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x - 24, y - 26, 48, 26); ctx.fillStyle = '#e8322a'; for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#e8322a'; ctx.fillRect(x - 28 + k * 9.3, y - 38, 9.3, 10); } ctx.fillStyle = '#ffd890'; ctx.fillRect(x - 18, y - 22, 36, 10); ctx.fillStyle = '#c8823a'; ctx.beginPath(); ctx.arc(x - 8, y - 30, 4, 0, TAU); ctx.arc(x + 6, y - 30, 4, 0, TAU); ctx.fill(); }
};
const decorLights = { nlLamp: [120, '#ffe0a0', -64], nlStall: [110, '#ffd890', -20] };

/* ---------------- enemies ---------------- */
const herringArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y - 10); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1); ctx.rotate(m === 'hop' ? -0.4 : 0);
  ctx.fillStyle = '#a8b8c8'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 6, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-20, -6); ctx.lineTo(-20, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a6a7a'; ctx.beginPath(); ctx.ellipse(0, -2, 12, 3, 0, Math.PI, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(6, -6, 3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a5ad8'; ctx.fillRect(-4, -9, 2, 4);
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 8, -1, 1, 2.4, 1.6, true);
  ctx.restore();
};
const cheeseArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y - 12); if (m === 'roll' || m === 'curl') ctx.rotate(e.t * 12 * e.dir);
  ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.arc(0, 0, 12, 0.3, 1.2); ctx.lineTo(0, 0); ctx.fill();
  ctx.fillStyle = '#e8a82a'; for (const [hx, hy] of [[-4, -4], [5, 2], [-2, 6]]) { ctx.beginPath(); ctx.arc(hx, hy, 2, 0, TAU); ctx.fill(); }
  if (m !== 'roll' && m !== 'curl' && m !== 'flat' && m !== 'ko') K.eyes(ctx, e.dir * 3, -3, e.dir, 3, 2, true);
  ctx.restore();
};
const clogArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const hop = m === 'walk' ? Math.abs(Math.sin(e.t * 10)) * 3 : 0; ctx.translate(0, -hop);
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(-14, -4); ctx.quadraticCurveTo(-14, -16, -4, -16); ctx.lineTo(8, -12); ctx.quadraticCurveTo(18, -8, 16, -2); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c8901a'; ctx.beginPath(); ctx.ellipse(-6, -13, 6, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.arc(8, -8, 2.5, 0, TAU); ctx.fill();
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 4, -8, 1, 3, 1.8, true);
  ctx.restore();
};
const gullArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); const f = Math.sin(e.t * (m === 'swoop' ? 8 : 4));
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#b8c0c8'; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.quadraticCurveTo(-10, -12 - f * 6, -22, -6 - f * 8); ctx.lineTo(0, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(10, -12 - f * 6, 20, -6 - f * 8); ctx.lineTo(4, 0); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(10, -3, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffb81a'; ctx.beginPath(); ctx.moveTo(13, -3); ctx.lineTo(19, -1); ctx.lineTo(13, 0); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(11, -4, 1, 0, TAU); ctx.fill();
  ctx.restore();
};
const beeArt = (ctx, e, x, y) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); const f = Math.sin(e.t * 40);
  ctx.fillStyle = 'rgba(220,240,255,0.7)'; ctx.beginPath(); ctx.ellipse(-2, -7, 5, 3 + f, -0.4, 0, TAU); ctx.ellipse(3, -7, 5, 3 - f, 0.4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1a22'; ctx.fillRect(-3, -6, 2.5, 12); ctx.fillRect(2, -6, 2.5, 12);
  K.eyes(ctx, 6, -1, 1, 2, 1.4, true);
  ctx.restore();
};
const snowmanArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); if (m === 'flat') ctx.scale(1.3, 0.4);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, -10, 11, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, -27, 8, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(e.dir * 2, -27); ctx.lineTo(e.dir * 10, -26); ctx.lineTo(e.dir * 2, -24); ctx.fill();
  ctx.fillStyle = '#e8322a'; ctx.fillRect(-8, -20, 16, 3); ctx.fillStyle = '#1a1a22'; ctx.fillRect(-6, -40, 12, 6); ctx.fillRect(-8, -35, 16, 2);
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, e.dir * 2, -29, e.dir, 3, 1.6, true);
  ctx.restore();
};
const stroopArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y - 12); if (m === 'roll' || m === 'curl') ctx.rotate(e.t * 10 * e.dir);
  ctx.fillStyle = '#c8823a'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#8a5222'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(-10, k * 4); ctx.lineTo(10, k * 4); ctx.moveTo(k * 4, -10); ctx.lineTo(k * 4, 10); ctx.stroke(); }
  ctx.fillStyle = '#7a3a1a'; ctx.fillRect(-12, -1, 24, 2);
  if (m !== 'roll' && m !== 'curl' && m !== 'flat' && m !== 'ko') K.eyes(ctx, e.dir * 3, -3, e.dir, 3, 2, true);
  ctx.restore();
};
const snowball = (ctx, s) => { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(s.cx, s.cy, 5, 0, TAU); ctx.fill(); };
function modal(cls, map) {
  return class extends cls {
    paint(ctx, x, y, mode) { return super.paint(ctx, x, y, map[mode] || mode); }
    get artMode() { const m = super.artMode; return map[m] || m; }
  };
}
// the tulip bulb: papery skin, a sprout; popped up it flowers into a red tulip
const bulbArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); if (m === 'flat') ctx.scale(1.3, 0.4);
  const bloom = m === 'idle' || m === 'pop';
  if (m !== 'flat' && m !== 'ko') K.feet(ctx, 0, 0, e.t, '#8a6a3a', 4, 4, m !== 'walk');
  ctx.fillStyle = '#c89a6a'; ctx.beginPath(); ctx.moveTo(0, -24); ctx.quadraticCurveTo(12, -20, 11, -9); ctx.quadraticCurveTo(10, -2, 0, -2); ctx.quadraticCurveTo(-10, -2, -11, -9); ctx.quadraticCurveTo(-12, -20, 0, -24); ctx.fill();
  ctx.strokeStyle = '#a87a4a'; ctx.lineWidth = 1; for (const k of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(k * 0.6, -22); ctx.quadraticCurveTo(k * 1.6, -12, k, -3); ctx.stroke(); }
  ctx.strokeStyle = '#e8d8b8'; ctx.lineWidth = 1.2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 2, -2); ctx.lineTo(k * 3, 2); ctx.stroke(); }
  ctx.strokeStyle = '#3a9a4a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -23); ctx.lineTo(0, bloom ? -36 : -30); ctx.stroke();
  ctx.fillStyle = '#3a9a4a'; ctx.beginPath(); ctx.ellipse(-4, -28, 5, 2, -0.6, 0, TAU); ctx.fill();
  if (bloom) { ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.moveTo(-7, -36); ctx.lineTo(-7, -45); ctx.lineTo(-2, -41); ctx.lineTo(0, -47); ctx.lineTo(2, -41); ctx.lineTo(7, -45); ctx.lineTo(7, -36); ctx.quadraticCurveTo(0, -31, -7, -36); ctx.fill(); }
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 2, -12, e.dir || 1, 3, 1.6, m === 'pop');
  ctx.restore();
};
// the gull on a cargo bike (8-3's racing rival): a box bike with a crate of herring in front
const cargoGullArt = (ctx, e, x, y, m, t) => {
  // the racing rival calls this directly (it has no cfg of its own): the nl_x atlas's gull on its cargo bike, else
  // the procedural bike with the ink line
  if (!e.cfg) {
    if (typeof Atlas !== 'undefined' && Atlas.animate(ctx, 'nl_x', m === 'chase' ? 'gullBike/walk' : 'gullBike_walk_000', (t || 0) * 1.4, x, y, e.dir || 1, { scale: 1.15 })) return;
    Ink.around(ctx, x - 40, y - 60, 80, 64, c => cargoGullArt(c, { dir: e.dir, cfg: true }, x, y, m, t), { pad: 6 });
    return;
  }
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const sp = (t || 0) * 12;
  ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 2; for (const wx of [-16, 16]) { ctx.beginPath(); ctx.arc(wx, -8, 8, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(wx + Math.cos(sp) * 8, -8 + Math.sin(sp) * 8); ctx.lineTo(wx - Math.cos(sp) * 8, -8 - Math.sin(sp) * 8); ctx.stroke(); }
  ctx.fillStyle = '#2a5ad8'; rr(ctx, 4, -26, 22, 14, 2); ctx.fill(); ctx.fillStyle = '#a8b8c8'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(10 + k * 6, -27, 4, 2, 0.3, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#ff7a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-16, -8); ctx.lineTo(-6, -22); ctx.lineTo(6, -12); ctx.moveTo(-6, -22); ctx.lineTo(-10, -26); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(-8, -34, 9, 7, 0.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#b8c0c8'; ctx.beginPath(); ctx.ellipse(-12, -33, 6, 4, 0.4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-2, -42, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffc81a'; ctx.beginPath(); ctx.moveTo(2, -42); ctx.lineTo(9, -40); ctx.lineTo(2, -39); ctx.fill(); ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.arc(6, -40, 0.9, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(-1, -43, 1, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.moveTo(-6, -46); ctx.lineTo(4, -46); ctx.lineTo(-1, -52); ctx.fill();
  ctx.restore();
};
class NlClog extends TourEnemy.make({ w: 28, h: 18, speed: 1.4, behavior: 'hop', hopV: 6, hopEvery: 0.7, art: clogArt, burst: '#ffd23a' }) {
  constructor(g, s) { super(g, s); this.rushT = 0; }
  update(dt) {
    if (this.partner === undefined) { this.partner = this.g.entities.find(e => e !== this && e instanceof NlClog && !e.partner && !e.remove && Math.abs(e.cx - this.cx) < 3 * TS) || null; if (this.partner) { this.partner.partner = this; this.cool = this.partner.cool; } }
    if (this.rushT > 0) { this.rushT -= dt; this.speed = 2.8; if (this.rushT <= 0) this.speed = 1.4; }
    return super.update(dt);
  }
  stomp(p) { const r = super.stomp(p); const q = this.partner; if (q && !q.dead && !q.remove) { q.rushT = 3; this.g.parts.text(q.cx, q.y - 12, 'CLOP CLOP!', '#ffd23a'); } return r; }
}
class NlGull extends TourFlyer.make({ w: 30, h: 14, range: 4, speed: 0.8, swoop: true, art: gullArt, burst: '#ffffff' }) {
  touchPlayer(p) {
    if (this.dead || this.stunT > 0) return;
    if (this.loot == null && this.state === 'swoop') { const n = Math.min(5, this.g.picks); this.g.picks -= n; Save.data.picks = this.g.picks; this.loot = n; this.g.parts.text(this.cx, this.y - 10, n ? '-' + n + ' HA HA!' : 'HA HA!', '#ffffff'); K.sfx('laugh', 'select', { vol: 0.4 }); this.state = 'drift'; this.cool = 3; this.hy -= 2 * TS; }
  }
  hit(kind, src) { if (this.loot) { for (let k = 0; k < this.loot; k++) this.g.addPick(this.cx, this.cy); this.loot = 0; } return super.hit(kind, src); }
}
const enemies = {
  nlHerring: { cls: TourEnemy.make({ w: 28, h: 16, speed: 1.0, behavior: 'hop', hopV: 11, hopEvery: 1.2, art: herringArt, burst: '#a8b8c8' }), place: 'walk' },
  nlCheese: { cls: TourEnemy.make({ w: 24, h: 24, speed: 0.7, behavior: 'roll', range: 9, rollSpeed: 6.5, art: cheeseArt, burst: '#ffc83a' }), place: 'walk' },
  // clogs come in pairs and hop in step; stomp one and its partner hurries (double speed for 3 s)
  nlClog: { cls: NlClog, place: 'walk' },
  // the herring gull: swoops at Brady and snatches five coins instead of hurting him; hit it to get them back
  nlGull: { cls: NlGull, place: 'fly' },
  // the tulip bulb: a moving soil bump under Brady; it pops up as a tulip bloom (tell 0.7 s), then sits stunned
  nlBulb: { cls: modal(TourEnemy.make({ w: 24, h: 24, speed: 1.5, behavior: 'burrower', art: bulbArt, burst: '#c89a6a' }), { pop: 'idle', exposed: 'stun', dig: 'walk' }), place: 'walk' },
  // the gull on a cargo bike: 8-3's rival (art only; TourRival draws it)
  nlCargoGull: { cls: TourEnemy.make({ w: 34, h: 30, speed: 0, behavior: 'still', art: cargoGullArt, atlas: 'nl_x', sprite: 'gullBike' }), place: 'walk' },
  nlBee: { cls: TourFlyer.make({ w: 18, h: 14, range: 2, speed: 2.2, swoop: true, art: beeArt, burst: '#ffd23a' }), place: 'fly' },
  nlSnowman: { cls: TourEnemy.make({ w: 22, h: 40, speed: 0.3, behavior: 'throw', every: 2.2, range: 9, pace: true, hp: 2, art: snowmanArt, burst: '#ffffff', shoot: e => {
    tourFire(e.g, e.cx + e.dir * 12, e.y + 8, { kind: 'snowball', vx: e.dir * 4 * TS, vy: -5 * TS, grav: PHYS.gDown * 0.4, w: 10, h: 10, life: 3, col: '#ffffff', stompable: true, art: snowball }); K.say(e.g, e, 'BRRR!', '#cfefff');
  } }), place: 'walk' },
  nlStroop: { cls: TourEnemy.make({ w: 24, h: 24, speed: 0.8, behavior: 'roll', range: 8, rollSpeed: 6, art: stroopArt, burst: '#c8823a' }), place: 'walk' }
};

/* ---------------- entities ---------------- */
// a cheese chute: wheels of Gouda come rolling out
class NlWheel extends Ent {
  constructor(g, x, y, dir) { super(g, null, 26, 26); this.x = x - 13; this.y = y - 26; this.dir = dir; this.vx = dir * 4 * TS; this.life = 7; this.enemy = true; this.bounces = 0; }
  update(dt) {
    this.t += dt; this.life -= dt;
    if (this.knocked) return this.updateKnocked(dt);
    this.vy += PHYS.gDown * dt; moveBody(this, this.g.area, dt, { semis: true });
    if (this.hitWall) { this.dir = -this.dir; this.vx = this.dir * 4 * TS; if (++this.bounces > 1) this.pop(); }
    if (this.life <= 0 || this.y > this.g.area.H * TS) this.pop();
  }
  pop() { if (this.remove) return; this.remove = true; this.g.burst(this.cx, this.cy, 10, '#ffc83a', 'debris'); }
  hit(kind) { if (kind === 'stomp' || kind === 'spin') { this.pop(); this.g.addScore(100, this.cx, this.y); return true; } this.knockOff(this.dir); return true; }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(this.t * 8 * this.dir); ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 0.8); ctx.lineTo(0, 0); ctx.fill(); ctx.fillStyle = '#e8a82a'; ctx.beginPath(); ctx.arc(4, -4, 2.5, 0, TAU); ctx.arc(-5, 3, 2, 0, TAU); ctx.fill(); ctx.restore(); }
}
class NlChute extends Ent {
  constructor(g, s) { super(g, s, 40, 40); this.dir = s.dir || -1; this.every = s.period || 2.6; this.cool = 1; }
  update(dt) { this.t += dt; this.cool -= dt; if (this.cool <= 0) { this.cool = this.every; if (this.g.onScreen(this)) { this.g.spawn(new NlWheel(this.g, this.cx + this.dir * 20, this.y + this.h, this.dir)); Sound.play('bump', { pitch: 0.7, vol: 0.4 }); } } }
  draw(ctx) { const x = this.cx, y = this.y + this.h; ctx.fillStyle = '#8a6a44'; ctx.beginPath(); ctx.moveTo(x - 20, y - 60); ctx.lineTo(x + 20, y - 60); ctx.lineTo(x + 20 * -this.dir, y - 28); ctx.lineTo(x + 20 * this.dir, y); ctx.lineTo(x - 20 * this.dir * -1, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.arc(x, y - 52, 10, 0, TAU); ctx.fill(); }
}
// the Cheese King's ammunition: a giant Gouda wheel that rolls down the weigh-house ramps at Brady. Run INTO it to
// kick it back (or stomp it to launch it): a wheel Brady sends back knocks the King off his throne.
const NL_WHEEL_CFG = {
  w: 30, h: 30, kick: 9, bounce: 0.5, friction: 0.8, roll: true, hp: 1, hurts: true, life: 18, burst: '#ffc83a', wheel: true,
  art(ctx, e, x, y, t) {
    ctx.save(); ctx.translate(x, y - 15);
    ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.arc(0, 0, 15, 0.2, 1.1); ctx.lineTo(0, 0); ctx.fill();
    ctx.fillStyle = '#e8a82a'; for (const [hx, hy] of [[-5, -5], [6, 3], [-3, 7], [7, -7]]) { ctx.beginPath(); ctx.arc(hx, hy, 2.4, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#c8901a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.stroke();
    ctx.restore();
  },
  onBreak(e) { K.sfx('splat', null, { vol: 0.5, pitch: 0.8 }); }
};
class NlGouda extends TourProp {
  constructor(g, s) { super(g, s, NL_WHEEL_CFG); this.stunT = 0; this.harmless = !!s.harmless; }
  stun(t) { this.stunT = Math.max(this.stunT, t); this.g.burst(this.cx, this.y, 8, '#ffd84a', 'spark'); this.g.parts.text(this.cx, this.y - 10, 'TRING!', '#ffd84a'); }
  update(dt) { if (this.stunT > 0) { this.stunT -= dt; this.vx = approach(this.vx, 0, 40 * TS * dt); } super.update(dt); }
  touchPlayer(p) {
    if (p.dead) return;
    if (p.vy > 0 && p.prevBottom <= this.y + Math.max(8, this.h * 0.4)) { this.stunT = 0; super.touchPlayer(p); return; }
    const side = p.cx < this.cx ? 1 : -1;
    // running into a wheel kicks it back, even a fast one: that is the skill. Standing still gets you bowled over.
    if (Math.abs(p.vx) > 2 * TS && sign(p.vx) === side) { this.stunT = 0; this.kick(side, p); this.g.parts.text(this.cx, this.y - 12, 'KICK!', '#ffffff'); return; }
    if (this.fast && !this.harmless && this.stunT <= 0 && this.thrownBy !== p) { p.hurt(this); return; }
    this.x += side * 1.5; p.x -= side;
  }
  draw(ctx) { super.draw(ctx); if (this.stunT > 0) K.dizzy(ctx, this.cx, this.y - 6, this.t); }
}
// a loft hatch high on the wall at the top of a ramp: it rattles for a moment, then a wheel rolls out
class NlHatch extends Ent {
  constructor(g, s) { super(g, s, 44, 44); this.dir = s.dir || -1; this.side = s.side || (this.dir < 0 ? 'right' : 'left'); this.arm = 0; this.open = 0; this.armed = null; }
  fire(harmless) { this.arm = 0.75; this.armed = !!harmless; K.sfx('crumble', null, { vol: 0.4 }); }
  release(harmless) {
    const g = this.g, w = new NlGouda(g, { x: this.cx + this.dir * 26, y: this.y + this.h, harmless: harmless || this.armed });
    w.fling(this.dir * 5.5 * TS, -1 * TS, g.boss); g.spawn(w); this.open = 0.9; this.armed = null;
    Sound.play('bump', { pitch: 0.7, vol: 0.5 }); g.burst(this.cx + this.dir * 22, this.y + this.h, 8, '#ffc83a', 'dust');
    return w;
  }
  update(dt) { this.t += dt; if (this.open > 0) this.open -= dt; if (this.arm > 0) { this.arm -= dt; if (this.arm <= 0) this.release(); } }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, d = this.dir, sh = this.arm > 0 ? Math.sin(this.t * 50) * 2 : 0;
    // the ramp: a long plank from the hatch mouth down the steps to the floor
    ctx.save(); ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + d * 22, y - 2); ctx.lineTo(x + d * 5.4 * TS, y + 4 * TS); ctx.stroke(); ctx.strokeStyle = '#c8a070'; ctx.lineWidth = 2; for (let k = 0; k <= 5; k++) { const kx = x + d * (22 + k * (5.4 * TS - 22) / 5), ky = y - 2 + k * (4 * TS + 2) / 5; ctx.beginPath(); ctx.moveTo(kx - 6, ky + 3); ctx.lineTo(kx + 6, ky + 3); ctx.stroke(); } ctx.restore();
    Ink.ent(ctx, this, c => {
      c.save(); c.translate(x, y); c.scale(-d, 1);
      // the chute mouth set into the wall, a wooden door that swings open, a cheese peeking out while it rattles
      c.fillStyle = '#5a3a22'; c.fillRect(-22, -44, 44, 44); c.fillStyle = '#3a2412'; c.fillRect(-18, -40, 36, 36);
      c.fillStyle = '#8a6a44'; c.fillRect(-22, -46, 48, 5); c.fillRect(-22, -4, 48, 4);
      if (this.arm > 0) { c.fillStyle = '#ffc83a'; c.beginPath(); c.arc(sh, -22, 12, 0, TAU); c.fill(); c.fillStyle = '#e8322a'; c.beginPath(); c.arc(sh, -22, 12, 0.2, 1.1); c.lineTo(sh, -22); c.fill(); }
      c.save(); c.translate(18, -40 + sh); c.rotate(this.open > 0 ? -1.2 : this.arm > 0 ? -0.25 - Math.abs(sh) * 0.05 : 0); c.fillStyle = '#a87a4a'; c.fillRect(-36, 0, 36, 36); c.fillStyle = '#6a4a2a'; c.fillRect(-36, 10, 36, 3); c.fillRect(-36, 24, 36, 3); c.fillStyle = '#3a3a44'; c.beginPath(); c.arc(-30, 18, 2.5, 0, TAU); c.fill(); c.restore();
      c.restore();
    });
    if (this.arm > 0) { ctx.fillStyle = Math.floor(this.t * 16) % 2 ? '#ffd84a' : '#ffffff'; ctx.font = `12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', x, y - 54 + Math.sin(this.t * 14) * 2); ctx.fillText(d < 0 ? '<<' : '>>', x + d * 34, y - 18); }
  }
}
const entities = { nlChute: NlChute, nlGouda: NlGouda, nlHatch: NlHatch };

/* ---------------- the signature power-up: THE DUTCH BIKE ---------------- */
// ride fast, hop canals, ring the bell to stun everything nearby
function bikeIcon(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y + 2); ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 1.5;
  for (const wx of [-7, 7]) { ctx.beginPath(); ctx.arc(wx, 2, 5, 0, TAU); ctx.stroke(); ctx.save(); ctx.translate(wx, 2); ctx.rotate(t * 6); ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.stroke(); ctx.restore(); }
  ctx.strokeStyle = '#2a5ad8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-7, 2); ctx.lineTo(-2, -5); ctx.lineTo(5, -5); ctx.lineTo(7, 2); ctx.moveTo(-2, -5); ctx.lineTo(0, 2); ctx.lineTo(5, -5); ctx.stroke();
  ctx.fillStyle = '#ff7a1a'; ctx.fillRect(4, -9, 6, 4);
  ctx.restore();
}
class NlBellRing extends Ent {
  constructor(g, x, y) { super(g, null, 10, 10); this.x = x; this.y = y; this.life = 0.5; }
  update(dt) { this.life -= dt; if (this.life <= 0) this.remove = true; }
  draw(ctx) { const k = 1 - this.life / 0.5; ctx.strokeStyle = `rgba(255,220,90,${1 - k})`; ctx.lineWidth = 3; for (let r = 0; r < 2; r++) { ctx.beginPath(); ctx.arc(this.x, this.y, Math.max(1, 10 + k * 140 - r * 30), 0, TAU); ctx.stroke(); } }
}
const power = {
  id: 'bike', name: 'DUTCH BIKE', country: 'nl', hint: 'RIDE FAST, HOP CANALS · ACTION RINGS THE BELL TO STUN ENEMIES', time: 0, cooldown: 1.2, speedMul: 1.42, jumpBoost: 1.1,
  icon: bikeIcon,
  action(p, g) {
    g.spawn(new NlBellRing(g, p.cx, p.cy)); Sound.play('select', { pitch: 2.2, vol: 0.6 }); K.say(g, p, 'TRING TRING!', '#ffd84a');
    for (const e of g.entities) if (e.enemy && !e.dead && !e.boss && e.stun && Math.hypot(e.cx - p.cx, e.cy - p.cy) < 5 * TS) e.stun(2.6);
    for (const e of g.entities) if (e.boss && e.state === 'fight' && Math.hypot(e.cx - p.cx, e.cy - p.cy) < 5 * TS && e.brain.onBell) e.brain.onBell(e);
    // a rolling cheese wheel stops dead at the bell
    for (const e of g.entities) if (e.prop && e.cfg && e.cfg.wheel && !e.remove && e.stun && Math.hypot(e.cx - p.cx, e.cy - p.cy) < 6 * TS) e.stun(2.5);
    return true;
  },
  drawOn(p, ctx, t) {
    if (p.inWater) return;
    const x = p.cx, y = p.y + p.h, f = p.facing, spin = t * (Math.abs(p.vx) / TS) * 1.2;
    ctx.save(); ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 2;
    for (const wx of [x - 14, x + 14]) { ctx.beginPath(); ctx.arc(wx, y - 9, 9, 0, TAU); ctx.stroke(); ctx.save(); ctx.translate(wx, y - 9); ctx.rotate(spin); ctx.lineWidth = 1; for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke(); } ctx.restore(); }
    ctx.strokeStyle = '#2a5ad8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 14, y - 9); ctx.lineTo(x - 4, y - 20); ctx.lineTo(x + 8, y - 20); ctx.lineTo(x + 14, y - 9); ctx.moveTo(x - 4, y - 20); ctx.lineTo(x, y - 9); ctx.lineTo(x + 8, y - 20); ctx.stroke();
    ctx.fillStyle = '#ff7a1a'; ctx.fillRect(x + f * 12 - 5, y - 26, 10, 6); ctx.fillStyle = TULIP[0]; ctx.beginPath(); ctx.arc(x + f * 12, y - 28, 2.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
};

/* ---------------- set pieces ---------------- */
const canalPit = (st, x0, x1) => { st.pit(x0, x1); st.B.fill(x0, st.gy + 2, x1, st.H - 1, T.LAVA); };
const P = {
  /* 8-1: the canal ring */
  // a hoisting hook swings out from a gable over the canal
  hooks(st, o) {
    const B = st.B, n = o.n || 2; let x = st.x;
    st.floor(x, x + 2); x += 3;
    for (let k = 0; k < n; k++) {
      canalPit(st, x, x + 6);
      const ax = x + 3, ay = st.gy - 6, len = 5, amp = 0.55;
      st.spawn('mplat', ax, ay, { pw: 3, swing: { len: len * TS, amp }, speed: 1.1 + st.d * 0.4, skin: 'nlHook', phase: k * 1.3 });
      for (let a = -10; a <= 10; a++) { const th = a / 10 * amp; const gx = Math.round(ax + Math.sin(th) * len), gy2 = Math.round(ay + 1 + Math.cos(th) * len); for (let q = -1; q <= 1; q++) B.ghosts.push([gx + q, gy2]); }
      B.decorAt('nlBeam', ax, ay + 1, 0);
      st.arc(ax - 2, ax + 2, ay + len - 2, 1);
      x += 7; if (k < n - 1) { st.floor(x, x + 1); x += 2; }
    }
    st.floor(x, x + 2); return x + 3;
  },
  // houseboats bob on the canal: hop across their roofs
  houseboats(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const n = o.n || 2;
    for (let k = 0; k < n; k++) {
      canalPit(st, x, x + 5);
      st.spawn('mplat', x + 1, st.gy - 2, { pw: 4, ax: 0, ay: 0.4 * TS, speed: 1.2 + k * 0.3, skin: 'nlBoat' });
      for (let q = 0; q < 4; q++) st.B.ghosts.push([x + 1 + q, st.gy - 1]);
      st.coins(x + 1, x + 4, st.gy - 3); x += 6;
      if (k < n - 1) { st.floor(x, x); x += 1; }
    }
    if (o.gold) st.gold(x - 4, st.gy - 6, 'high');
    st.floor(x, x + 2); return x + 3;
  },
  // an arched bridge over the canal, crowded with parked bikes
  bridge(st) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    canalPit(st, x, x + 8);
    [[0, 1], [1, 2], [2, 3], [3, 3], [4, 3], [5, 3], [6, 2], [7, 1], [8, 0]].forEach(([q, h]) => st.B.set(x + q, st.gy - h, T.SEMI));
    for (const q of [2, 4, 6]) st.B.decorAt('nlBike', x + q, st.gy - 3, 0);
    st.coins(x + 2, x + 6, st.gy - 5); st.enemy('nlClog', x + 4, st.gy - 3, { edgeTurn: true });
    x += 9; st.floor(x, x + 2); return x + 3;
  },
  racks(st, o) { const x = st.x, n = o.n || 2; st.floor(x, x + 12); for (let k = 1; k < 12; k += 3) st.decor('nlBike', x + k); for (let k = 0; k < n; k++) st.enemy(k % 2 ? 'nlHerring' : 'nlClog', x + 5 + k * 4, st.gy); st.coins(x + 2, x + 10, st.gy - 3); return x + 13; },

  /* 8-2: tulips and windmills */
  // a windmill: its four sails are platforms that carry Brady round
  windmill(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const span = 11, cx = x + 4, cy = st.gy - 5, r = 3.5;
    st.pit(x, x + span - 1);
    st.B.prop('nlMill', cx + 1, cy + 1, 2, st.gy - cy - 1 + 3, 'none', {});
    for (let k = 0; k < 4; k++) st.spawn('mplat', cx, cy, { pw: 3, orbit: r * TS, speed: 0.8, phase: k * Math.PI / 2 / 0.8, skin: 'nlSail' });
    for (let a = 0; a < 24; a++) { const th = a / 24 * TAU, gx = Math.round(cx + Math.cos(th) * r), gy2 = Math.round(cy + 1 + Math.sin(th) * r); for (let q = 0; q <= 2; q++) st.B.ghosts.push([gx + q, gy2]); }
    st.coins(cx, cx + 2, cy - 5);
    if (o.gold) st.gold(cx + 1, cy - 6, 'risky');
    x += span; st.floor(x, x + 2); return x + 3;
  },
  // tulip beds: their blooms are bouncy
  tulips(st, o) {
    const x = st.x, B = st.B, n = o.n || 3; st.floor(x, x + n * 4 + 2);
    for (let k = 0; k < n; k++) { const tx = x + 2 + k * 4, ty = st.gy - 1 - (k % 2); for (let q = 0; q < 2; q++) { B.set(tx + q, ty, T.SEMI); B.setSurf(tx + q, ty, SURF.BOUNCE); B.setHide(tx + q, ty, 1); } B.prop('nlBloom', tx, ty, 2, st.gy - ty, 'none', { seed: k }); st.coins(tx, tx + 1, ty - 6); }
    st.enemy('nlBee', x + n * 2, st.gy);
    return x + n * 4 + 3;
  },
  // gusts sweep across the polder
  gusts(st) { const x = st.x, B = st.B, w = 14; st.floor(x, x + w); B.zone(x, st.gy - 7, w, 7, 3.2 * TS, 0, 0, 'gust'); st.semi(x + 3, x + 6, st.gy - 4); st.semi(x + 9, x + 12, st.gy - 4); st.coins(x + 3, x + 12, st.gy - 6); st.enemy('nlClog', x + 8, st.gy); return x + w + 1; },
  // a dyke: a raised path along the water
  dyke(st) { const x = st.x; st.floor(x, x + 2); st.floor(x + 3, x + 4, st.gy - 1); st.floor(x + 5, x + 13, st.gy - 2); st.floor(x + 14, x + 15, st.gy - 1); st.enemy('nlHerring', x + 9, st.gy - 2); st.coins(x + 6, x + 12, st.gy - 4); return x + 16; },

  /* 8-3: the bike lane (auto-scroll) */
  // a drawbridge rises and falls over a canal: cross when it's down
  drawbridge(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    canalPit(st, x, x + 4);
    st.spawn('mplat', x, st.gy - 1, { pw: 5, ax: 0, ay: -3 * TS, speed: 1.0 + (o.fast ? 0.5 : 0), skin: 'nlDrawbridge' });
    for (let y = st.gy - 3; y <= st.gy; y++) for (let q = 0; q < 5; q++) st.B.ghosts.push([x + q, y]);
    st.coins(x, x + 4, st.gy - 2);
    x += 5; st.floor(x, x + 2); return x + 3;
  },
  // a tram glides along its track: ride on its roof
  tram(st, o) {
    const x = st.x; st.floor(x, x + 16);
    st.spawn('mplat', x + 1, st.gy - 3, { pw: 6, ax: 9 * TS, ay: 0, speed: 1.6, skin: 'nlTram' });
    for (let q = 1; q < 16; q++) st.B.ghosts.push([x + q, st.gy - 2]);
    st.coins(x + 3, x + 14, st.gy - 5);
    if (o.gold) st.gold(x + 8, st.gy - 7, 'high');
    st.enemy('nlGull', x + 10, st.gy);
    return x + 17;
  },
  hop(st) { let x = st.x; st.floor(x, x + 2); x += 3; canalPit(st, x, x + 3); st.arc(x - 1, x + 4, st.gy - 2, 3); x += 4; st.floor(x, x + 3); st.enemy('nlStroop', x + 3, st.gy); return x + 4; },

  /* 8-4: the frozen canals */
  // skate along the ice by lantern light
  skate(st, o) { const x = st.x, B = st.B, n = o.n || 14; st.floor(x, x + n); for (let q = 1; q < n; q++) B.set(x + q, st.gy, T.ICE); for (let k = 2; k < n; k += 5) st.decor('nlLamp', x + k); st.coins(x + 2, x + n - 2, st.gy - 2); if (o.snowman) st.enemy('nlSnowman', x + n - 3, st.gy); return x + n + 1; },
  // thin ice: it cracks and gives way under Brady
  thin(st) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    st.pit(x, x + 7); st.B.fill(x, st.gy + 2, x + 7, st.H - 1, T.LAVA);
    st.B.fill(x, st.gy, x + 7, st.gy, T.CRUMBLE);
    st.coins(x + 1, x + 6, st.gy - 2);
    x += 8; st.floor(x, x + 2); return x + 3;
  },
  // a koek-en-zopie stall on the ice
  stall(st, o) { const x = st.x; st.floor(x, x + 10); st.decor('nlStall', x + 5); st.semi(x + 3, x + 7, st.gy - 4); st.coins(x + 3, x + 7, st.gy - 6); if (o.gold) st.gold(x + 5, st.gy - 7, 'high'); st.enemy('nlSnowman', x + 9, st.gy); return x + 11; },

  /* 8-5: the weigh house */
  // a cheese chute: wheels roll out across the floor (stomp them or jump)
  chute(st, o) { const x = st.x; st.floor(x, x + 14); st.spawn('nlChute', x + 13, st.gy - 1, { dir: -1, period: o.period || 2.6 }); st.semi(x + 3, x + 7, st.gy - 4); st.coins(x + 3, x + 7, st.gy - 6); if (o.gold) st.gold(x + 5, st.gy - 7, 'high'); return x + 15; },
  // the weighing scales: two pans rise and fall in turn
  scales(st) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    st.pit(x, x + 8);
    st.spawn('mplat', x, st.gy - 1, { pw: 3, ax: 0, ay: -3 * TS, speed: 1.2, skin: 'nlScale' });
    st.spawn('mplat', x + 5, st.gy - 4, { pw: 3, ax: 0, ay: 3 * TS, speed: 1.2, skin: 'nlScale' });
    for (let y = st.gy - 4; y <= st.gy; y++) for (let q = 0; q < 3; q++) { st.B.ghosts.push([x + q, y]); st.B.ghosts.push([x + 5 + q, y]); }
    st.coins(x + 1, x + 7, st.gy - 6);
    x += 9; st.floor(x, x + 2); return x + 3;
  },
  // cheese sledges slide back and forth over a gap
  sledges(st) { return Tour.pieces.mover(st, { span: 9, pw: 3, skin: 'nlSledge', speed: 1.8 }); },
  // the boss arena: the weigh house. Cheese ramps (one-way steps) come down from the loft hatches on both walls,
  // a weighing-scale ledge hangs in the middle, bikes and clogs and tulips on the floor; the throne is on the right
  arena_waag(st, o) {
    const B = st.B, { x0, w, GY } = o, mid = x0 + Math.floor(w / 2);
    for (let k = 0; k < 5; k++) { B.set(x0 + w - 2 - k, GY - 5 + k, T.SEMI); B.set(x0 + 1 + k, GY - 5 + k, T.SEMI); }
    for (let q = 0; q < 4; q++) B.set(mid - 2 + q, GY - 4, T.SEMI);
    B.decorAt('nlBike', x0 + 8, GY, 0); B.decorAt('nlBike', x0 + w - 10, GY, 1); B.decorAt('nlClogsPair', x0 + 10, GY, 0);
    B.decorAt('nlFlowerBox', mid - 1, GY - 4, 0); B.decorAt('nlFlowerBox', mid + 1, GY - 4, 1); B.decorAt('nlTulips', x0 + 13, GY, 0);
    st.spawn('nlHatch', x0 + w - 1, GY - 6, { dir: -1, side: 'right' }); st.spawn('nlHatch', x0, GY - 6, { dir: 1, side: 'left' });
  }
};
Object.assign(decor, {
  nlBloom(ctx, x, y, t, th, d) { const c = TULIP[d.seed % 5]; ctx.strokeStyle = '#3a8a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - d.h + 4); ctx.stroke(); ctx.fillStyle = c; const top = y - d.h; ctx.beginPath(); ctx.moveTo(x - 22, top + 2); ctx.lineTo(x - 22, top - 10); ctx.lineTo(x - 8, top - 2); ctx.lineTo(x, top - 14); ctx.lineTo(x + 8, top - 2); ctx.lineTo(x + 22, top - 10); ctx.lineTo(x + 22, top + 2); ctx.quadraticCurveTo(x, top + 14, x - 22, top + 2); ctx.fill(); }
});
const platforms = {
  nlHook(ctx, p) { const ax = p.ancX, ay = p.ancY, mx = p.x + p.w / 2; ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(mx, p.y - 14); ctx.stroke(); ctx.strokeStyle = '#5a5a68'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(mx, p.y - 8, 6, Math.PI * 1.1, Math.PI * 2.4); ctx.stroke(); ctx.fillStyle = '#8a5a3a'; rr(ctx, p.x, p.y, p.w, 10, 2); ctx.fill(); ctx.fillStyle = '#a87a4a'; ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, 2); },
  nlBoat(ctx, p) { const x = p.x, y = p.y, w = p.w; ctx.fillStyle = '#2a5a3a'; rr(ctx, x - 8, y + 10, w + 16, 22, 4); ctx.fill(); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x - 2, y - 2, w + 4, 14); for (let k = 0; k < 3; k++) { ctx.fillStyle = '#5ab8e8'; ctx.fillRect(x + 6 + k * (w - 12) / 3, y + 2, 12, 7); } ctx.fillStyle = '#e8322a'; ctx.fillRect(x - 4, y - 4, w + 8, 4); ctx.fillStyle = TULIP[2]; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + 8 + k * 10, y - 6, 2.5, 0, TAU); ctx.fill(); } },
  nlSail(ctx, p, t) { const x = p.x, y = p.y, w = p.w; ctx.fillStyle = '#8a6a44'; ctx.fillRect(x, y, w, 8); ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 1; for (let k = 0; k <= w; k += 8) { ctx.beginPath(); ctx.moveTo(x + k, y); ctx.lineTo(x + k, y + 8); ctx.stroke(); } ctx.fillStyle = 'rgba(240,232,220,0.9)'; ctx.fillRect(x + 2, y + 8, w - 4, 6); },
  nlDrawbridge(ctx, p) { const x = p.x, y = p.y, w = p.w; ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x, y, w, 10); ctx.fillStyle = '#5a3a22'; ctx.fillRect(x, y + 10, w, 6); ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + 4, y - 60); ctx.moveTo(x + w - 4, y); ctx.lineTo(x + w - 4, y - 60); ctx.stroke(); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x - 4, y - 64, w + 8, 6); },
  nlTram(ctx, p, t) { const x = p.x, y = p.y, w = p.w; ctx.fillStyle = '#e8e0d0'; rr(ctx, x - 4, y, w + 8, 60, 6); ctx.fill(); ctx.fillStyle = '#2a5ad8'; ctx.fillRect(x - 4, y + 36, w + 8, 10); for (let k = 0; k < 5; k++) { ctx.fillStyle = '#5ab8e8'; ctx.fillRect(x + 4 + k * (w - 8) / 5, y + 8, (w - 8) / 5 - 6, 20); } ctx.fillStyle = '#1a1a22'; for (const wx of [x + 14, x + w - 14]) { ctx.beginPath(); ctx.arc(wx, y + 62, 7, 0, TAU); ctx.fill(); } ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2 + 20, y - 40); ctx.stroke(); },
  nlScale(ctx, p) { const x = p.x, y = p.y, w = p.w; ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + w / 2, y - 60); ctx.lineTo(x + w - 4, y); ctx.stroke(); ctx.fillStyle = '#c8a03a'; ctx.fillRect(x - 4, y, w + 8, 6); ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.ellipse(x + w / 2, y - 6, 12, 7, 0, 0, TAU); ctx.fill(); },
  nlSledge(ctx, p) { const x = p.x, y = p.y, w = p.w; ctx.fillStyle = '#ffd23a'; ctx.fillRect(x, y, w, 8); ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 6, y + 8); ctx.quadraticCurveTo(x - 10, y + 14, x, y + 14); ctx.lineTo(x + w, y + 14); ctx.stroke(); for (let k = 0; k < 3; k++) { ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.ellipse(x + 12 + k * (w - 24) / 2, y - 6, 10, 7, 0, 0, TAU); ctx.fill(); } }
};

/* ---------------- the boss: THE CHEESE KING ---------------- */
// A wobbling tower of cheese wheels with a crown, on a throne in the weigh house. He pulls the bell-rope and the
// loft hatch rolls a giant Gouda wheel down the ramp at Brady. CHEESE-WHEEL VOLLEY: run into a wheel to kick it
// back (or stomp it to launch it): a returned wheel knocks him off his throne. The bike bell stuns a rolling
// wheel. Phase 2 opens the second ramp and freezes the floor; phase 3 puts the throne on a drawbridge that lifts
// out of reach and comes back down, so the volley has to be timed. Finish: buried under his own wheels.
const boss = {
  id: 'nl_cheese', name: 'The Cheese King', hp: 4, dims: [64, 92], music: 'tour_nl_boss', country: 'nl',
  brain: {
    guardText: 'TOO CHEESY!',
    phases: [3, 2],
    hatch(b, side) { return b.g.entities.find(e => e instanceof NlHatch && e.side === side && !e.remove && Math.abs(e.cx - b.throneX) < 28 * TS) || null; },
    wake(b) { b.throneX = b.cx; b.crownY = 0; K.say(b.g, b, 'I AM THE BIG CHEESE!', '#ffd84a'); b.g.toast('RUN INTO HIS CHEESE WHEELS TO KICK THEM BACK AT HIM!'); },
    onBell(b) { if (b.act === 'roll' || b.act === 'walk') { b.go('totter'); K.say(b.g, b, 'MY EARS! WOBBLE...', '#ffd84a'); } },
    hit(b, kind, src) {
      if (kind === 'stomp' || kind === 'spin') return 'bounce';
      if (kind === 'prop') { if (src && src.cfg && src.cfg.wheel && src.thrownBy === b.g.player && b.act !== 'knocked' && b.act !== 'buried') { b.damage(1, { text: 'GOUDA SMASH!', col: '#ffe070' }); return true; } return false; }
      if (kind === 'bump') return false;
      return undefined;
    },
    touch(b, p) { return b.act === 'buried'; },
    onPlat(b) { const pl = b.plat && !b.plat.remove ? b.plat : null; if (pl) { b.x = pl.x + pl.w / 2 - b.w / 2; b.y = pl.y - b.h; b.vy = 0; b.onGround = true; } return pl; },
    update(b, dt) {
      const g = b.g, p = g.player, ph = b.phase || 1;
      b.guard = 'bounce';
      const pl = b.plat && !b.plat.remove ? b.plat : null;
      if (b.act === 'buried') {
        // the finish: every wheel in the loft comes down on him, the crown spins off
        b.vx = 0; b.pose = 'buried'; b.crownY = (b.crownY || 0) + dt;
        if (Math.floor(b.at * 4) !== Math.floor((b.at - dt) * 4) && b.at < 1.6) { for (const side of ['left', 'right']) { const h = this.hatch(b, side); if (h) h.release(true); } }
        if (Math.floor(b.at * 2) !== Math.floor((b.at - dt) * 2)) g.parts.text(b.cx + (Math.random() - 0.5) * 60, b.y - 20, pick(['MY WHEELS!', 'MY BEAUTIFUL WHEELS!', 'TOO MUCH CHEESE!']), '#ffd84a');
        if (b.at > 3) b.die();
        if (pl) this.onPlat(b); else b.fall(dt);
        return;
      }
      if (pl && b.act !== 'knocked' && b.act !== 'climb') this.onPlat(b);
      if (b.act === 'walk') { b.face(); b.vx = 0; b.pose = 'sit'; if (b.at > (ph >= 3 ? 0.9 : 1.3)) { b.cycle++; b.go(b.cycle % 3 === 0 ? 'quake' : 'roll'); } }
      else if (b.act === 'roll') {
        // tell: he stands, hauls on the bell-rope, the hatch rattles... then the wheel rolls out and down the ramp
        b.vx = 0; b.pose = 'pull';
        if (b.first) {
          b.face(); b.rollN = (b.rollN || 0) + 1; const side = ph >= 2 && b.rollN % 2 === 0 ? 'left' : 'right';
          const h = this.hatch(b, side); if (h) h.fire();
          if (ph >= 3) { const h2 = this.hatch(b, side === 'left' ? 'right' : 'left'); if (h2) h2.fire(); }
          K.say(g, b, pick(['GOUDA AWAY!', 'EDAM! EDAM!', 'ROLL OUT THE CHEESE!']), '#ffd84a');
        }
        if (b.at > 1.2) b.go('walk');
      }
      else if (b.act === 'quake') {
        if (b.first) { b.vy = -13 * TS; b.vx = 0; b.pose = 'jump'; K.say(g, b, 'CRUMBS!', '#ffd84a'); }
        b.pose = 'jump';
        if (pl) { if (b.at > 0.6) { g.shake(9); Sound.play('stomp', { pitch: 0.45 }); for (const d of [-1, 1]) g.spawn(new NlCrumbWave(g, b.cx + d * (b.w / 2 + 12), b.floorY, d)); b.go('walk'); } }
        else if (b.onGround && b.at > 0.3) { g.shake(9); Sound.play('stomp', { pitch: 0.45 }); for (const d of [-1, 1]) g.spawn(new NlCrumbWave(g, b.cx + d * (b.w / 2 + 12), b.floorY, d)); b.go('walk'); }
      }
      else if (b.act === 'totter') { b.vx = 0; b.pose = 'totter'; if (b.at > 1.3) b.go('walk'); }
      else if (b.act === 'knocked') {
        // off the throne: he tumbles left and lies there seeing stars
        b.pose = 'tumble'; if (b.first) { b.vx = -4.5 * TS; b.vy = -7 * TS; b.onGround = false; }
        if (b.onGround && b.at > 0.4) b.vx = approach(b.vx, 0, 10 * TS * dt);
        if (b.at > 1.7) b.go('climb');
      }
      else if (b.act === 'climb') {
        // back to the throne (in phase 3 he waits under the drawbridge until it comes down)
        b.pose = 'walk'; const tx = pl ? pl.x + pl.w / 2 - b.w / 2 : b.throneX - b.w / 2; b.dir = tx > b.x ? 1 : -1; b.vx = b.dir * 3 * TS;
        if (Math.abs(b.x - tx) < 6) { b.x = tx; b.vx = 0; if (!pl || pl.y >= b.floorY - 30) b.go('walk'); }
        if (b.at > 6) b.go('walk');
      }
      if (!pl || b.act === 'knocked' || b.act === 'climb') b.fall(dt);
    },
    hurt(b) { b.go('knocked'); K.say(b.g, b, pick(['MY GOUDA!', 'NOT MY EDAM!', 'OFF MY THRONE?!']), '#ffd84a'); b.g.burst(b.cx, b.y + 20, 24, '#ffc83a', 'confetti'); },
    phase(b, n) {
      const g = b.g;
      this.hurt(b);
      if (n === 2) {
        const row = Math.floor(b.floorY / TS), tx0 = Math.floor(b.arenaX0 / TS) + 6, tx1 = Math.floor(b.arenaX1 / TS) - 8;
        for (let tx = tx0; tx <= tx1; tx++) if (tileAt(g.area, tx, row) === T.GROUND) g.setTile(tx, row, T.ICE);
        g.bannerText = 'THE CANAL FREEZES! TWO RAMPS!'; g.bannerT = 2.4; K.say(g, b, 'SLIPPERY, ISN\'T IT?', '#cfefff'); K.sfx('glass', 'crumble', { vol: 0.5 });
      } else if (n === 3) {
        b.plat = new MovingPlatform(g, { x: b.throneX - 2 * TS + TS / 2, y: b.floorY, pw: 4, ax: 0, ay: -3 * TS, speed: 1.1, skin: 'nlThroneLift' }); g.spawn(b.plat);
        g.bannerText = 'THE THRONE RISES!'; g.bannerT = 2.4; K.say(g, b, 'UP, UP AND AWAY!', '#ffd84a'); g.shake(6);
      }
    },
    lastHit(b) { b.go('buried'); b.vuln = false; b.g.bannerText = 'BURIED IN CHEESE!'; b.g.bannerT = 2.6; b.g.shake(10); K.sfx('break', null, { vol: 0.7 }); return true; },
    draw(b, ctx, t) {
      const x = b.cx, y = b.y + b.h, d = b.dir, P = b.pose, n = Math.max(1, Math.ceil(b.hp)), g = b.g;
      // the throne (where he sits, or on the drawbridge)
      const pl = b.plat && !b.plat.remove ? b.plat : null, thx = pl ? pl.x + pl.w / 2 : b.throneX || x, thy = pl ? pl.y : b.floorY;
      if (thx != null && P !== 'buried') {
        ctx.fillStyle = '#5a3a22'; ctx.fillRect(thx - 40, thy - 104, 80, 10); ctx.fillRect(thx - 44, thy - 110, 12, 110); ctx.fillRect(thx + 32, thy - 110, 12, 110);
        ctx.fillStyle = '#7a4a2a'; ctx.fillRect(thx - 32, thy - 100, 64, 100);
        ctx.fillStyle = '#c8282a'; ctx.fillRect(thx - 28, thy - 96, 56, 92);
        ctx.fillStyle = '#ffd23a'; for (const sx of [-44, 32]) { ctx.beginPath(); ctx.arc(thx + sx + 6, thy - 114, 7, 0, TAU); ctx.fill(); }
      }
      if (P === 'pull') { ctx.strokeStyle = '#c8a070'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + d * 30, y - 200); ctx.lineTo(x + d * 30, y - 96 + Math.sin(t * 20) * 4); ctx.stroke(); }
      ctx.save(); ctx.translate(x, y);
      if (P === 'totter') ctx.rotate(Math.sin(t * 9) * 0.12);
      if (P === 'tumble') { ctx.rotate(b.onGround ? -1.3 : -b.at * 5); if (b.onGround) ctx.translate(0, -20); }
      if (P === 'buried') ctx.translate(0, Math.min(40, b.at * 30));
      const wh = 84 / Math.max(3, n);
      for (let k = 0; k < n; k++) {
        const wy = -wh * (k + 0.5), off = P === 'totter' ? Math.sin(t * 9 + k) * 4 : P === 'pull' ? Math.sin(t * 24 + k) * 1.5 : 0;
        ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.ellipse(off, wy, 32, wh / 2, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = k % 2 ? '#e8322a' : '#e8a82a'; ctx.fillRect(-32 + off, wy - 2, 64, 4);
        ctx.fillStyle = '#e8a82a'; ctx.beginPath(); ctx.arc(off - 12, wy - 4, 3, 0, TAU); ctx.arc(off + 14, wy + 3, 2.5, 0, TAU); ctx.fill();
      }
      const ty = -wh * n;
      // face on the top wheel, the crown, and the sceptre (a cheese on a stick) raised to pull the rope
      if (P === 'totter' || P === 'tumble') K.dizzy(ctx, 0, ty - 26, t); else K.eyes(ctx, d * 8, ty + wh * 0.45, d, 7, 4, P !== 'buried');
      ctx.strokeStyle = '#7a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); if (P === 'buried') ctx.arc(d * 8, ty + wh * 0.7, 6, Math.PI + 0.2, TAU - 0.2); else ctx.arc(d * 8, ty + wh * 0.55, 6, 0.2, Math.PI - 0.2); ctx.stroke();
      if (P === 'pull') { ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(d * 24, ty + 20); ctx.lineTo(d * 30, ty - 30); ctx.stroke(); ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.arc(d * 30, ty - 34, 7, 0, TAU); ctx.fill(); }
      else if (P !== 'buried') { ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(d * 30, ty + 40); ctx.lineTo(d * 36, ty + 4); ctx.stroke(); ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.arc(d * 36, ty, 7, 0, TAU); ctx.fill(); }
      const cy = P === 'buried' ? ty - 10 - (b.crownY || 0) * 90 : ty, cs = P === 'buried' ? Math.cos((b.crownY || 0) * 12) : 1;
      ctx.save(); ctx.translate(0, cy); ctx.scale(cs, 1);
      ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-16, -16); ctx.lineTo(-8, -8); ctx.lineTo(0, -18); ctx.lineTo(8, -8); ctx.lineTo(16, -16); ctx.lineTo(16, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.arc(0, -6, 3, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.restore();
    }
  }
};
Object.assign(platforms, {
  // the throne's drawbridge: chains to the rafters, a plank deck
  nlThroneLift(ctx, p) { const x = p.x, y = p.y, w = p.w; ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 2; for (const cx of [x + 6, x + w - 6]) { ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y - 300); ctx.stroke(); for (let k = 0; k < 30; k++) { ctx.beginPath(); ctx.arc(cx, y - 8 - k * 10, 3, 0, TAU); ctx.stroke(); } } ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x - 4, y, w + 8, 10); ctx.fillStyle = '#5a3a22'; ctx.fillRect(x - 4, y + 10, w + 8, 8); ctx.fillStyle = '#a87a4a'; for (let k = 0; k < 4; k++) ctx.fillRect(x + 2 + k * (w / 4), y + 2, w / 4 - 4, 6); }
});

// the quake's ripple of cheese crumbs along the floor
class NlCrumbWave extends Ent {
  constructor(g, x, floorY, dir) { super(g, null, 26, 14); this.x = x - 13; this.y = floorY - 14; this.dir = dir; this.life = 1.4; }
  update(dt) { this.t += dt; this.life -= dt; this.x += this.dir * 6 * TS * dt; if (this.life <= 0 || SOLID[tileAt(this.g.area, Math.floor((this.cx + this.dir * 14) / TS), Math.floor((this.y + 4) / TS))]) this.remove = true; }
  touchPlayer(p) { p.hurt(this); }
  draw(ctx) { for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#ffc83a' : '#e8a82a'; ctx.fillRect(this.x + k * 5, this.y + this.h - 6 - ((k + Math.floor(this.t * 20)) % 3) * 3, 5, 5); } }
}

/* ---------------- music: barrel organ, carillon bells, brass band ---------------- */
const tracks = {
  tour_nl: {
    bpm: 132, bpb: 3, bars: 16, rv: 0.25, dl: 0.08,
    ch: 'C G G C C F G C F C G C F C G C',
    ld: 'E5:4 G5:4 C6:4 | B5:6 A5:2 G5:4 | D5:4 F5:4 B5:4 | C6:8 G5:4 | E5:4 G5:4 C6:4 | A5:6 C6:2 F6:4 | D6:4 B5:4 G5:4 | C6:12 |' +
        'A5:4 C6:4 F6:4 | E6:6 D6:2 C6:4 | B5:4 D6:4 G6:4 | E6:8 C6:4 | A5:4 C6:4 F6:4 | G5:4 C6:4 E6:4 | D6:4 B5:4 G5:4 | C6:12',
    li: 'calliope', lv: 0.14,
    bp: 'r...o...o...', bi: 'pluckb', bv: 0.28,
    ap: '....c-..c-..', ai: 'organ', av: 0.05, ao: 55,
    dr: ['k...........', '....s...s...', 'h.h.h.h.h.h.'], dv: 0.35
  },
  tour_nl_rush: {
    bpm: 150, bars: 8, rv: 0.2, hx: 0.08,
    ch: 'D A Bm G D A G A',
    ld: 'F#5:2 A5:2 D6:2 A5:2 F#6:4 E6:4 | E5:2 A5:2 C#6:2 E6:2 A6:8 | F#5:2 B5:2 D6:2 F#6:2 E6:4 D6:4 | B5:2 G5:2 D5:2 G5:2 B5:8 |' +
        'A5:2 D6:2 F#6:2 A6:2 G6:4 F#6:4 | E6:2 C#6:2 A5:2 C#6:2 E6:8 | D6:2 B5:2 G5:2 B5:2 D6:4 G6:4 | E6:8 C#6:8',
    li: 'sq2', lv: 0.13,
    bp: 'r.r.r.o.r.r.r.f.', bi: 'pluckb', bv: 0.3,
    ap: '0.1.2.1.0.1.2.1.', ai: 'bell', av: 0.04, ao: 70,
    dr: ['k...k...k...k...', '....s.......s.s.', 'h.h.h.h.h.h.h.h.', '..r...r...r...r.'], dv: 0.44
  },
  tour_nl_night: {
    bpm: 92, bpb: 3, bars: 8, rv: 0.6, dl: 0.25,
    ch: 'F C Dm Bb F C Bb C',
    ld: 'A5:6 C6:3 F6:3 | E6:6 D6:3 C6:3 | D6:6 A5:3 F5:3 | Bb5:9 .:3 | A5:6 C6:3 F6:3 | G6:6 E6:3 C6:3 | D6:3 C6:3 Bb5:3 A5:3 | G5:9 .:3',
    li: 'bell', lv: 0.13,
    bp: 'r...........', bi: 'sub', bv: 0.24,
    ap: '0.2.4.1.3.5.', ai: 'mbox', av: 0.04, ao: 72,
    dr: ['u.....u.....', '......n.....'], dv: 0.28
  },
  tour_nl_boss: {
    bpm: 164, bars: 8, rv: 0.2, hx: 0.1,
    ch: 'Gm Gm Eb D Gm Gm Eb D',
    ld: 'G5:2 Bb5:2 D6:2 G6:2 F6:4 D6:4 | Bb5:2 D6:2 G6:4 A6:8 | G6:2 Eb6:2 Bb5:2 Eb6:2 G6:4 Eb6:4 | F#6:4 D6:4 A5:8 |' +
        'Bb6:2 A6:2 G6:2 F6:2 D6:4 Bb5:4 | G5:2 Bb5:2 D6:4 G6:8 | Eb6:2 G6:2 Bb6:4 G6:4 Eb6:4 | D6:12 F#6:4',
    li: 'brass', lv: 0.16,
    bp: 'r.r.r.o.r.r.r.f.', bi: 'sawb', bv: 0.28,
    ap: 'c-..c-..c-..c-..', ai: 'organ', av: 0.05, ao: 58,
    dr: ['K...k...K...k.k.', '....s.......s...', 'h.h.h.h.h.h.h.h.', 'x...............'], dv: 0.46
  }
};

/* ---------------- the country ---------------- */
Tour.country({
  id: 'nl', colors: COL, tagline: 'Canals, bikes, tulips and windmills',
  themes, painters, decor, decorLights, platforms, enemies, entities, pieces: P, boss, power, tracks,
  music: { level: 'tour_nl', boss: 'tour_nl_boss' },
  landmark: 'the old windmill',
  arrival: 'Brady! The Baron folded up a whole windmill and took it on a canal cruise. ♥ C',
  coin: { name: 'STROOPWAFEL', draw(ctx, x, y) {
    ctx.fillStyle = '#c8823a'; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8a5222'; ctx.lineWidth = 0.8; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x - 7, y + k * 3); ctx.lineTo(x + 7, y + k * 3); ctx.moveTo(x + k * 3, y - 7); ctx.lineTo(x + k * 3, y + 7); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,240,200,0.4)'; ctx.fillRect(x - 4, y - 5, 3, 2);
  } },
  star: { name: 'GOLDEN CLOG', draw(ctx, x, y, t) { ctx.save(); ctx.translate(x, y + 4); ctx.scale(Math.cos(t * 3) > 0 ? 1 : -1, 1); ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(-12, -10, -4, -10); ctx.lineTo(6, -7); ctx.quadraticCurveTo(14, -4, 12, 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#c8901a'; ctx.beginPath(); ctx.ellipse(-5, -8, 5, 2.5, 0, 0, TAU); ctx.fill(); ctx.restore(); } },
  // the levels are added by 29_tour_nl_levels.js (Tour.amend)
  levels: []
});
})();
