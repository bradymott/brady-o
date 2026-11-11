/* ============================================================
   MOZAMBIQUE (world 4): the six levels in the v2 format
   (docs/design/LEVEL_OVERHAUL.md §2 World 4, §3.2, §4.3).
   4-1 Ostrich Dash      RACE    race the ostrich across Gorongosa; elephant jets, dung beetles, thorn hedges
   4-2 Dune Stampede     DOOM    the herd's dust cloud chases you over the dunes
   4-3 Baobab Skyline    SKY     baobab crowns at sunset; weaver nests, honey, evening gusts
   4-4 Hatchling Night   CARRY   carry a turtle hatchling to the sea; the lighthouse beam freezes ghost crabs
   4-5 Ilha Fortress     LAIR    ramparts and the cistern, then O Eremita's tide pool
   4-6 Buried Dhow       DIG     (secret) dig down through the dune into a buried dhow
   Loads after 29_tour_mz.js (art, old pieces, enemies, the boss) and
   replaces its level list with Tour.amend.
   ============================================================ */
(() => {
const C = Tour.countries.mz;
if (!C) return;
const K = TourKit;
const CAPU = ['#ff7a1a', '#1aa8a8', '#ffd23a', '#c8287a', '#2a5ad8'];
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };

/* ================= themes: depth for the single-strip backgrounds ================= */
// an image layer from a (possibly other) atlas strip, with its procedural fallback
const strip = (atlas, id, f, shift, fallback) => ({ kind: 'image', atlas, id, f, base: fallback.base, color: fallback.color, fallback, shift: shift || 0 });
const painters = {
  // the low sun of a savanna evening: a warm haze band with long thin clouds
  mzSunsetHaze(ctx, L, rng, H) {
    const g = ctx.createLinearGradient(0, L.base - 140, 0, L.base); g.addColorStop(0, 'rgba(255,180,120,0)'); g.addColorStop(1, 'rgba(255,170,110,0.45)');
    ctx.fillStyle = g; ctx.fillRect(0, L.base - 140, BG_W, 140);
    for (let k = 0; k < 8; k++) { const x = rng() * BG_W, y = L.base - 60 - rng() * 120, w = 140 + rng() * 180; wrapDraw(x - w / 2, w, xx => { ctx.fillStyle = rgba(L.color, 0.35 + rng() * 0.2); ctx.beginPath(); ctx.ellipse(xx + w / 2, y, w / 2, 5 + rng() * 4, 0, 0, TAU); ctx.fill(); }); }
  },
  // near: silhouettes of baobab boughs and leaf clusters framing the bottom of the view (sparse, dark)
  mzNearBoughs(ctx, L, rng, H) {
    for (let x = 80; x < BG_W; x += 260 + rng() * 160) wrapDraw(x - 80, 160, xx => {
      ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(xx, H); ctx.quadraticCurveTo(xx + 20, L.base + 20, xx + 70, L.base - 10); ctx.lineTo(xx + 84, L.base - 4); ctx.quadraticCurveTo(xx + 40, L.base + 30, xx + 30, H); ctx.closePath(); ctx.fill();
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(xx + 60 + k * 14, L.base - 14 + Math.sin(k * 2) * 8, 16, 7, -0.3, 0, TAU); ctx.fill(); }
    });
  },
  // the moonlit headland across the bay: low dark hills, a sprinkle of village lights
  mzHeadland(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 10) ctx.lineTo(x, L.base - 24 - Math.sin(x / BG_W * TAU * 2 + 0.6) * 16 - Math.sin(x / BG_W * TAU * 5) * 6);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    for (let k = 0; k < 26; k++) { const x = rng() * BG_W; ctx.fillStyle = `rgba(255,214,140,${0.35 + rng() * 0.4})`; ctx.fillRect(x, L.base - 18 + rng() * 12, 2, 2); }
  },
  // near: dune grass in silhouette against the glowing sea
  mzNightGrass(ctx, L, rng, H) {
    for (let x = 0; x < BG_W; x += 34 + rng() * 60) wrapDraw(x, 30, xx => { ctx.strokeStyle = L.color; ctx.lineWidth = 2; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(xx + k * 2, H); ctx.quadraticCurveTo(xx + k * 4, L.base + 10, xx + k * 6 + 4, L.base - 10 - Math.abs(k) * 3 - rng() * 10); ctx.stroke(); } });
  },
  // the far coast behind the fort: a low green island with palms
  mzFarIsle(ctx, L, rng, H) {
    for (const [cx, w] of [[220, 300], [700, 220]]) wrapDraw(cx - w / 2, w, xx => {
      ctx.fillStyle = L.color; ctx.beginPath(); ctx.ellipse(xx + w / 2, L.base, w / 2, 24, 0, Math.PI, TAU); ctx.fill();
      for (let k = 0; k < 4; k++) { const px = xx + w * (0.25 + k * 0.17); ctx.strokeStyle = shade(L.color, -0.2); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, L.base - 16); ctx.quadraticCurveTo(px + 3, L.base - 34, px + 6, L.base - 44); ctx.stroke(); ctx.fillStyle = shade(L.color, -0.15); for (let q = 0; q < 5; q++) { ctx.save(); ctx.translate(px + 6, L.base - 44); ctx.rotate(-1.2 + q * 0.6); ctx.beginPath(); ctx.ellipse(9, 0, 10, 2.5, 0, 0, TAU); ctx.fill(); ctx.restore(); } }
    });
  },
  // under the dunes: strata of sand and the ribs of an old buried hull
  mzSandStrata(ctx, L, rng, H) {
    for (let r = 0; r < 7; r++) { ctx.fillStyle = shade(L.color, -r * 0.05); ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= BG_W; x += 12) ctx.lineTo(x, L.base - 160 + r * 50 + Math.sin(x * 0.01 + r) * 8); ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill(); }
    for (let x = 120; x < BG_W; x += 420) wrapDraw(x - 120, 240, xx => { ctx.strokeStyle = rgba('#5a3a1a', 0.5); ctx.lineWidth = 7; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(xx + 120, L.base + 40, 60 + k * 18, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } });
  }
};
Object.assign(BGPaint, painters);
const base = THEMES.mz_savanna;
const T_ = {};
// 4-3: baobab crowns at sunset: far savanna hills, the baobab strip, a haze band and near boughs
T_.mz_copas = Object.assign({}, THEMES.mz_baobab, {
  name: 'Baobab Skyline', music: 'tour_mz', particles: 'leaves',
  sky: ['#5a2a6a', '#e8706a', '#ffd08a'], horizonGlow: '#ffb070',
  celestial: { type: 'sun', x: 0.7, y: 0.5, r: 52, color: '#ffe0a0', glow: '#ff8a5a' }, stars: 0.12, cloudsDyn: false, fog: '#ffa880',
  layers: [
    strip('mz_savanna', 'L0', 0.015, -46, { kind: 'mountains', color: '#c8907a', base: 280, amp: 60 }),
    { kind: 'mzSunsetHaze', color: '#ffb0a0', base: 300, f: 0.02 },
    strip('mz_baobab', 'L0', 0.05, 0, { kind: 'mzSavanna', color: '#c89a4a', base: 340 }),
    strip('mz_baobab_near', 'L1', 0.22, 0, { kind: 'mzSavanna', color: '#b8883a', base: 365 }),
    { kind: 'mzNearBoughs', color: '#3a2418', base: 380, f: 0.45 }
  ],
  semi: { style: 'log', c1: '#9a7a5a', c2: '#6a4a2e' }
});
T_.mz_copas.atlas = 'mz_baobab';
// the night beach, the fort and the baobab get the depth their single strips lack: a far layer (painted or borrowed)
// behind, and their own near strip in front (mz_beach_near, mz_fort_near, mz_baobab_near)
THEMES.mz_beach.layers = [
  { kind: 'mzHeadland', color: '#0a1830', base: 300, f: 0.02 },
  strip('mz_beach', 'L0', 0.06, 0, THEMES.mz_beach.layers[0]),
  strip('mz_beach_near', 'L1', 0.2, 0, { kind: 'mzNightGrass', color: '#0a1a30', base: 360 })
];
THEMES.mz_fort.layers = [
  strip('mz_dunes', 'L0', 0.02, -40, { kind: 'mzFarIsle', color: '#5a9a6a', base: 300 }),
  { kind: 'mzFarIsle', color: '#4a8a5a', base: 316, f: 0.035 },
  strip('mz_fort', 'L0', 0.08, 0, THEMES.mz_fort.layers[0]),
  strip('mz_fort_near', 'L1', 0.22, 0, { kind: 'mzFarIsle', color: '#b8a888', base: 365 })
];
THEMES.mz_baobab.layers = [
  strip('mz_savanna', 'L0', 0.015, -46, { kind: 'mountains', color: '#c8907a', base: 280, amp: 60 }),
  strip('mz_baobab', 'L0', 0.05, 0, THEMES.mz_baobab.layers[0]),
  strip('mz_baobab_near', 'L1', 0.22, 0, { kind: 'mzSavanna', color: '#b8883a', base: 365 })
];
// 4-6: under the dunes (the surface is the beach dunes)
T_.mz_areia = Object.assign({}, THEMES.mz_dunes, {
  name: 'Buried Dhow', music: 'underground', particles: 'sand',
  sky: ['#4a2a14', '#8a5a2a', '#e8b878'], horizonGlow: '#f0c890', celestial: { type: 'sun', x: 0.8, y: 0.1, r: 30, color: '#fffbe0', glow: '#ffe8a0' }, stars: 0, cloudsDyn: false,
  layers: [{ kind: 'mzSandStrata', color: '#c89a5a', base: 300, f: 0.08 }],
  fog: '#e8c890'
});
T_.mz_areia.atlas = 'mz_dunes';
// interiors
const room = (b, over) => Object.assign({}, THEMES[caveVariant(b)], over);
T_.mz_cupim = room('mz_savanna', { name: 'Inside the Termite Mound', ground: Object.assign({}, THEMES.mz_savanna.ground, { cap: '#c8703a', capHi: '#e8905a' }), sky: ['#2a120a', '#5a2a14', '#8a4a24'] });
T_.mz_porao = Object.assign({}, THEMES.mz_dunes, { name: 'The Hold', music: 'secret', sky: ['#2a1a10', '#4a3020', '#6a4a2a'], celestial: { type: 'none' }, cloudsDyn: false, layers: [{ kind: 'mzSandStrata', color: '#8a6a3a', base: 300, f: 0.08 }], decor: [] });
T_.mz_oco = room('mz_baobab', { name: 'The Hollow Trunk', sky: ['#1a0e08', '#3a2414', '#5a3a1e'] });
T_.mz_farol = Object.assign({}, THEMES.mz_fort, { name: 'O Farol', music: 'secret', sky: ['#0a1020', '#1a2438', '#2a3448'], celestial: { type: 'none' }, cloudsDyn: false, layers: [{ kind: 'mzHeadland', color: '#1a2a40', base: 330, f: 0.05 }], darkness: 0.2, decor: [] });
T_.mz_gruta = room('mz_beach', { name: 'Sea Cave', particles: 'bubbles' });
T_.mz_cisterna = room('mz_fort', { name: 'The Cistern' });
T_.mz_cabine = Object.assign({}, T_.mz_porao, { name: 'Captain\'s Cabin' });
Object.assign(THEMES, T_);

/* ================= decor ================= */
const decor = {
  // flat-topped acacia over the fast route (its crown is the platform)
  mzAcacia(ctx, x, y, t, th, d) {
    const w = d.w, top = y - d.h;
    ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y + 220); ctx.quadraticCurveTo(x - 4, top + 60, x, top + 12); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, top + 40); ctx.lineTo(x - w * 0.35, top + 10); ctx.moveTo(x, top + 30); ctx.lineTo(x + w * 0.35, top + 8); ctx.stroke();
    ctx.fillStyle = '#6a7a2a'; ctx.beginPath(); ctx.ellipse(x, top + 6, w / 2 + 6, 10, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a9a3a'; ctx.beginPath(); ctx.ellipse(x - 6, top + 2, w / 2 - 4, 6, 0, 0, TAU); ctx.fill();
  },
  // a termite mound with ants marching into a wide hole at its foot
  mzAnts(ctx, x, y, t) { for (let k = 0; k < 7; k++) { const u = ((t * 0.5 + k / 7) % 1); ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.arc(x - 60 + u * 60, y - 2 - Math.sin(u * 9) * 0.6, 1.8, 0, TAU); ctx.fill(); } },
  // ostrich-race start banner
  mzStartLine(ctx, x, y, t) {
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 40, y - 76, 4, 76); ctx.fillRect(x + 36, y - 76, 4, 76);
    ctx.fillStyle = '#f4ecd8'; ctx.fillRect(x - 38, y - 76, 76, 18);
    for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#1a1020' : '#f4ecd8'; ctx.fillRect(x - 38 + k * 9.5, y - 58, 9.5, 5); }
    ctx.fillStyle = '#c8287a'; ctx.font = `bold 9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('CORRIDA!', x, y - 63);
    for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#1a1020' : '#ffffff'; ctx.fillRect(x - 38 + k * 9.5, y - 4, 9.5, 4); }
  },
  // a wooden game-ranger lookout at the finish
  mzLookout(ctx, x, y) {
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 22, y); ctx.lineTo(x + s * 14, y - 90); ctx.stroke(); }
    ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 20 + k * 2, y - 20 - k * 25); ctx.lineTo(x + 18 - k * 2, y - 40 - k * 25); ctx.stroke(); }
    ctx.fillStyle = '#7a5230'; ctx.fillRect(x - 24, y - 100, 48, 14); ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.moveTo(x - 30, y - 100); ctx.lineTo(x, y - 122); ctx.lineTo(x + 30, y - 100); ctx.closePath(); ctx.fill();
  },
  // the dark mouth of a tunnel through a termite mound
  mzTunnelMouth(ctx, x, y, t, th, d) { const x0 = x - d.w / 2; ctx.fillStyle = '#2a120a'; rr(ctx, x0 + 26, y - d.h, d.w - 40, d.h, 14); ctx.fill(); ctx.fillStyle = 'rgba(255,200,120,0.08)'; ctx.fillRect(x0 + 30, y - d.h + 6, d.w - 48, 3); },
  // a dhow's mast and pennant sticking out of the dune (the tell for the hold)
  mzMast(ctx, x, y, t) {
    ctx.fillStyle = '#5a3a1a'; ctx.save(); ctx.translate(x, y); ctx.rotate(0.12); ctx.fillRect(-2, -120, 4, 120); ctx.fillRect(-26, -96, 52, 3);
    ctx.fillStyle = '#c8287a'; ctx.beginPath(); ctx.moveTo(2, -120); ctx.lineTo(26 + Math.sin(t * 6) * 3, -114); ctx.lineTo(2, -108); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(10, -114, 2.5, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // turtle nest: a dimple in the sand with eggs (the start of 4-4)
  mzTurtleNest(ctx, x, y) { ctx.fillStyle = '#6a5a40'; ctx.beginPath(); ctx.ellipse(x, y - 2, 22, 6, 0, Math.PI, TAU); ctx.fill(); for (let k = 0; k < 5; k++) { ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.arc(x - 12 + k * 6, y - 5 - (k % 2) * 3, 4, 0, TAU); ctx.fill(); } },
  // the farol on the beach (the door is a separate entity)
  mzFarolTower(ctx, x, y, t, th, d) {
    const top = y - d.h;
    ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x - 26, top + 40); ctx.lineTo(x + 26, top + 40); ctx.lineTo(x + 40, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c8323a'; for (let k = 0; k < 4; k++) { const yy = top + 70 + k * (d.h - 90) / 4; const hw = 26 + (yy - top - 40) / (d.h - 40) * 14; ctx.fillRect(x - hw, yy, hw * 2, 18); }
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(x - 30, top + 30, 60, 10); ctx.fillStyle = '#3a3a48'; ctx.fillRect(x - 18, top + 4, 36, 26); ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.moveTo(x - 22, top + 4); ctx.lineTo(x, top - 14); ctx.lineTo(x + 22, top + 4); ctx.closePath(); ctx.fill();
  },
  // inside the termite mound: ant tunnels in the wall
  mzTunnels(ctx, x, y, t) { ctx.strokeStyle = 'rgba(40,16,8,0.6)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 50, y - 20); ctx.quadraticCurveTo(x - 20, y - 70, x + 10, y - 40); ctx.quadraticCurveTo(x + 40, y - 10, x + 60, y - 80); ctx.stroke(); ctx.lineCap = 'butt'; for (let k = 0; k < 9; k++) { const u = (t * 0.2 + k / 9) % 1; ctx.fillStyle = '#1a0e08'; ctx.beginPath(); ctx.arc(x - 50 + u * 110, y - 20 - Math.sin(u * Math.PI) * 50, 1.6, 0, TAU); ctx.fill(); } },
  // the queen's chamber glow
  mzMushroomGarden(ctx, x, y, t) { for (let k = 0; k < 5; k++) { ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.ellipse(x - 20 + k * 10, y - 6 - (k % 2) * 3, 5, 3, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(x - 21 + k * 10, y - 6 - (k % 2) * 3, 2, 6 + (k % 2) * 3); } },
  // ribs of the buried hull in the dig
  mzRibs(ctx, x, y) { ctx.strokeStyle = '#6a4220'; ctx.lineWidth = 6; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x - 60 + k * 40, y + 10, 50, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); } },
  // cashew crates in the hold
  mzCashewCrate(ctx, x, y) { TourObj.plank(ctx, x - 16, y - 26, 32, 26, ['#c8945a', '#8a5a2a', '#5a3a1a', '#f0c088']); ctx.fillStyle = '#c8a070'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x - 10 + k * 5, y - 28 - (k % 2) * 2, 3.5, 2.2, 0.4, 0, TAU); ctx.fill(); } },
  // a rope coil and a lantern (the cabin)
  mzLantern(ctx, x, y, t) { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - 90); ctx.lineTo(x, y - 34); ctx.stroke(); ctx.fillStyle = `rgba(255,${200 + Math.sin(t * 6) * 20},110,0.95)`; rr(ctx, x - 6, y - 32, 12, 15, 3); ctx.fill(); },
  // a hornbill keeper behind the Banca's counter
  mzKeeperHornbill(ctx, x, y, t) {
    ctx.save(); ctx.translate(x + 18, y + 2);
    ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.ellipse(0, -16, 14, 18, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.ellipse(2, -10, 8, 11, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.arc(-2, -38, 10, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(-10, -42); ctx.quadraticCurveTo(-36, -44 + Math.sin(t * 2) * 1, -40, -30); ctx.quadraticCurveTo(-24, -34, -10, -34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8422a'; ctx.beginPath(); ctx.moveTo(-10, -48); ctx.quadraticCurveTo(-26, -52, -30, -44); ctx.lineTo(-10, -44); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-4, -40, 2.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(-4.5, -40, 1.2, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a coconut palm on the rampart
  mzRampartPalm(ctx, x, y, t) { ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 8, y - 50, x + 14, y - 90); ctx.stroke(); ctx.fillStyle = '#2a8a4a'; for (let k = 0; k < 6; k++) { ctx.save(); ctx.translate(x + 14, y - 90); ctx.rotate(-2.6 + k * 0.62 + Math.sin(t * 1.5 + k) * 0.04); ctx.beginPath(); ctx.ellipse(20, 0, 22, 5, 0.2, 0, TAU); ctx.fill(); ctx.restore(); } }
};
Object.assign(Decor, decor);
Object.assign(TOUR_DECOR_LIGHTS, { mzLantern: [120, '#ffc070', -26], mzMushroomGarden: [50, '#fff0c0', -6] });

/* ================= enemies ================= */
// ghost crabs freeze in light: the lighthouse beam, lamp posts, the hard hat's headlamp (not Brady's own glow)
const mzLit = e => {
  const g = e.g, p = g.player;
  if (g.mzLitFrame !== g.t) { g.mzLitFrame = g.t; g.mzLitList = g.collectLights ? g.collectLights(g.camX - 400, g.camY - 300).filter(L => !(p && L.x === p.cx && L.y === p.cy)) : []; }
  for (const L of g.mzLitList) if (!(L.x === e.cx && L.y === e.cy) && Math.hypot(L.x - e.cx, L.y - e.cy) < L.r * 0.75) return true;   // its own pale glow doesn't count
  return false;
};
const ghostCrabArt = ENTITY_TYPES.mzGhostCrab.cfg.art;
const GHOST = { w: 22, h: 14, speed: 2.2, behavior: 'lightFrozen', art: ghostCrabArt, burst: '#e8e0c8', glow: 'rgba(220,255,240,',
  think(e, dt) {
    if (mzLit(e)) { if (e.bst !== 'statue') { e.bst = 'statue'; e.bt = 0; e.mode = 'statue'; TourKit.sfx('freeze', 'select', { vol: 0.25, pitch: 1.6 }); } e.vx = 0; return; }
    if (e.bst === 'statue') { e.bst = 'walk'; e.bt = 0; }
    e.mode = 'walk'; if (!e.vx || Math.abs(e.vx) < 2.2 * TS * 0.5) e.vx = e.dir * 2.2 * TS; if (e.hitWall) e.dir = -e.dir;
  } };
// the dung beetle rolls its ball at Brady (the ball grows); stomp the beetle, then kick the ball
const beetleArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1);
  const step = Math.sin(e.t * 14) * 2;
  ctx.strokeStyle = '#1a2a10'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-6 + k * 6, -6); ctx.lineTo(-9 + k * 6 + (k % 2 ? step : -step), 0); ctx.stroke(); }
  const g = ctx.createLinearGradient(-12, -18, 10, -4); g.addColorStop(0, '#6ae86a'); g.addColorStop(0.5, '#1a9a4a'); g.addColorStop(1, '#0a5a2a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-2, -10, 12, 8, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(0,40,10,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-2, -18); ctx.lineTo(-2, -3); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-6, -14, 3, 1.5, -0.4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a3a1a'; ctx.beginPath(); ctx.ellipse(9, -9, 5, 4, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#1a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, -10); ctx.quadraticCurveTo(16, -16, 18, -12); ctx.stroke();
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 10, -10, 1, 2, 1.5, m === 'push');
  ctx.restore();
};
// the pangolin curls into an armoured ball when Brady is in the air above it
const pangolinArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1);
  if (m === 'ball' || m === 'curl') {
    ctx.fillStyle = '#9a7a4a'; ctx.beginPath(); ctx.arc(0, -12, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a5a2a'; for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + r * 0.5 + e.t * 2; ctx.beginPath(); ctx.ellipse(Math.cos(a) * (4 + r * 3), -12 + Math.sin(a) * (4 + r * 3), 3.5, 2.5, a, 0, TAU); ctx.fill(); }
    ctx.restore(); return;
  }
  ctx.fillStyle = '#9a7a4a'; ctx.beginPath(); ctx.ellipse(-2, -10, 15, 9, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-14, -8); ctx.quadraticCurveTo(-26, -6, -24, 0); ctx.lineTo(-12, -2); ctx.fill();
  ctx.fillStyle = '#7a5a2a'; for (let k = 0; k < 6; k++) for (let r = 0; r < 2; r++) { ctx.beginPath(); ctx.ellipse(-12 + k * 4.5, -15 + r * 5, 3.2, 2.4, 0.3, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#c8a878'; ctx.beginPath(); ctx.ellipse(13, -7, 6, 4, 0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5a4a3a'; for (const lx of [-8, 6]) ctx.fillRect(lx, -3, 3, 3);
  if (m !== 'ko') { ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(14, -8, 1.3, 0, TAU); ctx.fill(); }
  if (m === 'uncurl') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(14, -8, 1.6, 0, TAU); ctx.fill(); }
  ctx.restore();
};
// the chameleon: its colour cycles slowly; it swivels an eye, then lashes its tongue
const chameleonArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1);
  const hue = (e.t * 25 + (e.seed || 0)) % 360, body = `hsl(${hue},55%,45%)`, dark = `hsl(${hue},55%,30%)`;
  ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, -8); ctx.quadraticCurveTo(-20, -6, -18, 0); ctx.arc(-14, 0, 4, Math.PI, Math.PI * 2.6); ctx.stroke();
  ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-12, -6); ctx.quadraticCurveTo(-6, -20, 6, -16); ctx.quadraticCurveTo(12, -12, 10, -6); ctx.quadraticCurveTo(0, -2, -12, -6); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6, -16); ctx.lineTo(16, -12); ctx.lineTo(10, -6); ctx.fill();
  ctx.strokeStyle = dark; ctx.lineWidth = 2; for (const lx of [-6, 4]) { ctx.beginPath(); ctx.moveTo(lx, -6); ctx.lineTo(lx - 2, 0); ctx.stroke(); }
  ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(9, -13, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; const sw = m === 'tell' ? Math.sin(e.t * 30) * 1.5 : 1; ctx.beginPath(); ctx.arc(10 + sw, -13, 1.6, 0, TAU); ctx.fill();
  ctx.restore();
};
// the mole-rat burrows under the sand and pops up beneath Brady
const moleRatArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#e8b8a0'; ctx.beginPath(); ctx.ellipse(0, -11, 13, 11, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(160,100,80,0.35)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(-6 + k * 4, -14 + (k % 2) * 4, 3, 1.5, 0.3, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(9, -8, 3, 6); ctx.fillRect(12.5, -8, 3, 6);
  ctx.fillStyle = '#3a2a2a'; ctx.beginPath(); ctx.arc(8, -15, 1.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d89a88'; ctx.beginPath(); ctx.ellipse(13, -11, 3, 2.4, 0, 0, TAU); ctx.fill();
  ctx.restore();
};
// fruit bats in the evening sky
const fruitBatArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const f = Math.sin(e.t * (m === 'swoop' ? 16 : 10));
  ctx.fillStyle = '#4a2a20'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 3, -2); ctx.quadraticCurveTo(s * 14, -12 - f * 6, s * 22, -2 - f * 4); ctx.quadraticCurveTo(s * 14, 2, s * 3, 3); ctx.fill(); }
  ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 7, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(2, -7, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.moveTo(-1, -11); ctx.lineTo(0, -15); ctx.lineTo(2, -11); ctx.fill(); ctx.beginPath(); ctx.moveTo(3, -11); ctx.lineTo(5, -15); ctx.lineTo(6, -11); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(4.5, -8, 1.3, 0, TAU); ctx.fill();
  ctx.restore();
};
const enemies = {
  mzGhostCrab: { cls: TourEnemy.make(GHOST), place: 'walk' },
  mzDungBeetle: { cls: TourEnemy.make({ w: 26, h: 20, speed: 0.9, behavior: 'pusher', maxScale: 2, ballKind: 'dung', art: beetleArt, burst: '#1a9a4a' }), place: 'walk' },
  mzPangolin: { cls: TourEnemy.make({ w: 30, h: 22, speed: 0.9, behavior: 'curlShield', curlT: 1.5, art: pangolinArt, burst: '#9a7a4a' }), place: 'walk' },
  mzChameleon: { cls: TourEnemy.make({ w: 24, h: 20, speed: 0, behavior: 'tongue', len: 3, art: chameleonArt, burst: '#4aa04a', init(e) { e.seed = Math.random() * 360; } }), place: 'walk' },
  mzMoleRat: { cls: TourEnemy.make({ w: 26, h: 22, speed: 1.2, behavior: 'burrower', art: moleRatArt, burst: '#c8907a' }), place: 'walk' },
  mzFruitBat: { cls: TourFlyer.make({ w: 26, h: 14, range: 3, speed: 1.3, swoop: true, art: fruitBatArt, burst: '#8a5a3a' }), place: 'fly' }
};
for (const k in enemies) { ENTITY_TYPES[k] = enemies[k].cls; Tour.enemyInfo[k] = { place: enemies[k].place, country: 'mz' }; }

/* ================= entities ================= */
// 4-4: the lighthouse beam. Before the lamp is relit it sweeps the beach (a moving pool of light); once the lever in
// the farol is pulled (key 'beam') it locks on the last tide pools, steady and wide. Ghost crabs freeze in it.
class MzBeam extends Ent {
  constructor(g, s) { super(g, s, 40, 40); this.lx = s.x; this.ly = s.y - (s.h || 7) * TS; this.span = (s.span || 14) * TS; this.lit = false; this.back = true; this.groundY = s.y; this.fixX = (s.fix || 0) * TS; }
  update(dt) { this.t += dt; if (!this.lit && this.g.keys && this.g.keys.has('beam')) { this.lit = true; this.g.toast && this.g.toast('THE LIGHTHOUSE SHINES AGAIN!'); this.g.burst(this.lx, this.ly, 30, '#ffe8a0', 'spark'); } }
  get spot() { const p = this.g.player; if (this.lit) { this.sx = approach(this.sx == null ? this.lx : this.sx, clamp(p ? p.cx + 2 * TS : this.lx, this.lx, this.lx + this.fixX), 6 * TS * (1 / 60)); return { x: this.sx, r: 220 }; } return { x: this.lx + Math.sin(this.t * 0.55) * this.span, r: 120 }; }
  get light() { const s = this.spot; return { x: s.x, y: this.groundY - 40, r: s.r, c: 'rgba(255,240,180,' }; }
  draw(ctx) {
    const s = this.spot, x0 = this.lx, y0 = this.ly;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(x0, y0, s.x, this.groundY); g.addColorStop(0, `rgba(255,240,180,${this.lit ? 0.45 : 0.32})`); g.addColorStop(1, 'rgba(255,240,180,0.02)');
    const half = this.lit ? 150 : 70;
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 - 6, y0); ctx.lineTo(x0 + 6, y0); ctx.lineTo(s.x + half, this.groundY); ctx.lineTo(s.x - half, this.groundY); ctx.closePath(); ctx.fill();
    const r = ctx.createRadialGradient(s.x, this.groundY - 4, 4, s.x, this.groundY - 4, half); r.addColorStop(0, 'rgba(255,240,180,0.35)'); r.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = r; ctx.fillRect(s.x - half, this.groundY - half, half * 2, half * 2);
    ctx.restore();
    ctx.fillStyle = this.lit ? '#fff4c0' : '#ffe8a0'; ctx.beginPath(); ctx.arc(x0, y0, this.lit ? 11 : 8, 0, TAU); ctx.fill();
  }
}
// 4-4: a shutter that opens once the key it waits for is held anywhere in the level (the lever is in another area)
class MzKeyShutter extends ENTITY_TYPES.shutter {
  constructor(g, s) { super(g, s); this.friendly = true; }   // friendly: updated off screen too
  update(dt) { if (!this.open && this.g.keys && this.g.keys.has(this.id)) this.setOpen(true); super.update(dt); }
}
// 4-1: the rival, an ostrich in a racing number
TOUR_SKINS.mzOstrichRival = (ctx, e, t) => {
  const x = e.cx, y = e.y + e.h, run = e.state === 'run', b = run ? Math.abs(Math.sin(t * 16)) * 3 : 0, l = run ? Math.sin(t * 16) * 8 : 0;
  Ink.around(ctx, e.x - 20, e.y - 44, e.w + 40, e.h + 46, c => {
    c.strokeStyle = '#e8b0a0'; c.lineWidth = 3; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * 3, y - 18 - b); c.lineTo(x + s * 2 + s * l, y - 8); c.lineTo(x + s * 4 + s * l * 0.5, y); c.stroke(); }
    c.fillStyle = '#2a2a2a'; c.beginPath(); c.ellipse(x - 2, y - 24 - b, 15, 11, -0.15, 0, TAU); c.fill();
    c.fillStyle = '#f4ecd8'; c.beginPath(); c.ellipse(x - 14, y - 26 - b, 7, 5, 0.6, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; rr(c, x - 6, y - 30 - b, 12, 9, 2); c.fill(); c.fillStyle = '#c8287a'; c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.fillText('7', x, y - 23 - b);
    c.strokeStyle = '#e8c0b0'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 9, y - 30 - b); c.quadraticCurveTo(x + 12, y - 44 - b, x + 13, y - 50 - b); c.stroke();
    c.fillStyle = '#e8c0b0'; c.beginPath(); c.arc(x + 14, y - 52 - b, 5, 0, TAU); c.fill();
    c.fillStyle = '#e8a050'; c.beginPath(); c.moveTo(x + 18, y - 53 - b); c.lineTo(x + 25, y - 51 - b); c.lineTo(x + 18, y - 49 - b); c.fill();
    c.fillStyle = '#1a1020'; c.beginPath(); c.arc(x + 15, y - 54 - b, 1.3, 0, TAU); c.fill();
  }, { pad: 8 });
  if (e.state === 'count' && e.ct > 0) TourObj.label(ctx, String(Math.ceil(e.ct)), x, e.y - 50, 24, '#ffd84a');
};
Object.assign(ENTITY_TYPES, { mzBeam: MzBeam, mzKeyShutter: MzKeyShutter });

/* ================= skins ================= */
const skins = {
  // a termite mound with a hole wider than the rest; a line of ants marches in (the door to the cupim)
  mzMoundDoor(ctx, e, t) {
    const x = e.x + e.w / 2, y = e.y + e.h;
    ctx.save(); ctx.globalAlpha = 1 - (e.part || 0) * 0.45;
    ctx.fillStyle = '#b8603a'; ctx.beginPath(); ctx.moveTo(x - 44, y); ctx.quadraticCurveTo(x - 36, y - 80, x - 8, y - 150); ctx.lineTo(x + 6, y - 140); ctx.quadraticCurveTo(x + 14, y - 100, x + 20, y - 110); ctx.quadraticCurveTo(x + 34, y - 60, x + 44, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x - 16 + (k % 3) * 14, y - 30 - k * 16, 2.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#2a120a'; ctx.beginPath(); ctx.ellipse(x, y - 22, 16, 22, 0, Math.PI, TAU); ctx.lineTo(x + 16, y); ctx.lineTo(x - 16, y); ctx.fill();
    ctx.restore();
    for (let k = 0; k < 8; k++) { const u = ((t * 0.45 + k / 8) % 1); ctx.fillStyle = '#1a0e08'; ctx.beginPath(); ctx.arc(x - 70 + u * 66, y - 2, 1.8, 0, TAU); ctx.fill(); }
  },
  // the way back up out of the mound
  mzMoundExit(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = 'rgba(255,220,150,0.25)'; rr(ctx, x - 16, y - 54, 32, 54, 14); ctx.fill(); ctx.strokeStyle = '#8a4a24'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 30, 16, Math.PI, TAU); ctx.stroke(); },
  // the dhow hatch in the sand (4-2)
  mzMastHatch(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w, k = e.open || 0;
    ctx.fillStyle = '#5a3a1a'; rr(ctx, x - 4, y - 3, w + 8, 10, 3); ctx.fill();
    ctx.save(); ctx.translate(x, y - 2); ctx.scale(1, Math.cos(k * Math.PI / 2)); TourObj.plank(ctx, 0, 0, w, 7, ['#a8784a', '#7a5028', '#4a3018', '#d8a870']); ctx.restore();
    ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(x + w / 2, y + 1, 2.5, 0, TAU); ctx.fill();
    if (e.crate) e.crateArt(ctx);
  },
  // a hole in the top of a baobab crown (4-3): leaves round a dark opening
  mzCrownHole(ctx, e, t) { const x = e.x, y = e.y, w = e.w, k = e.open || 0; ctx.fillStyle = '#1a0e08'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 3, w / 2, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#6a7a2a'; for (let q = 0; q < 6; q++) { ctx.beginPath(); ctx.ellipse(x - 4 + q * (w + 8) / 5, y - 1 + (q % 2) * 2 + k * 3, 6, 3, q * 0.6, 0, TAU); ctx.fill(); } },
  // a flat stepping stone in the cistern that is really a lid (4-5)
  mzStoneHatch(ctx, e, t) { const x = e.x, y = e.y, w = e.w, k = e.open || 0; ctx.save(); ctx.translate(x + w / 2, y); ctx.rotate(-k * 0.6); ctx.fillStyle = '#a89878'; rr(ctx, -w / 2, -2, w, 9, 3); ctx.fill(); ctx.strokeStyle = 'rgba(60,40,20,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(-w / 2 + 3, 0, w - 6, 5); ctx.restore(); if (Math.random() < 0.03 && e.g) e.g.burst(x + w / 2, y - 2, 1, '#8ad8ff', 'spark'); },
  // the lighthouse lever (a brass crank)
  mzLighthouseLever(ctx, e, t) { const x = e.cx, y = e.y + e.h, k = e.k || 0; ctx.fillStyle = '#5a5866'; rr(ctx, x - 12, y - 10, 24, 10, 3); ctx.fill(); ctx.save(); ctx.translate(x, y - 8); ctx.rotate(-0.8 + k * 1.6); ctx.fillStyle = '#c8902a'; ctx.fillRect(-2, -26, 4, 26); ctx.fillStyle = '#e8222a'; ctx.beginPath(); ctx.arc(0, -27, 5, 0, TAU); ctx.fill(); ctx.restore(); },
  // a sea-worn rock wall you can shoulder through with the hard hat (4-6)
  mzHullRock(ctx, e, t) { const x = e.x, y = e.y, w = e.w, h = e.h; ctx.fillStyle = '#8a7a6a'; rr(ctx, x - 2, y, w + 4, h, 6); ctx.fill(); ctx.strokeStyle = 'rgba(40,30,20,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 6, y + 6); ctx.lineTo(x + 18, y + h * 0.4); ctx.lineTo(x + 8, y + h * 0.7); ctx.lineTo(x + 20, y + h - 4); ctx.stroke(); const G = TourGear.get('hat'); if (G) { ctx.save(); ctx.globalAlpha = 0.8; ctx.translate(x + w / 2, y + h / 2); ctx.scale(0.5, 0.5); G.icon(ctx, 0, 0, t); ctx.restore(); } },
  // the lighthouse door (4-4)
  mzFarolDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#3a2a1a'; rr(ctx, x - 14, y - 48, 28, 48, 12); ctx.fill(); ctx.fillStyle = '#6a4a2a'; rr(ctx, x - 11, y - 45, 22, 45, 10); ctx.fill(); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + k * 6, y - 42); ctx.lineTo(x + k * 6, y); ctx.stroke(); } ctx.fillStyle = `rgba(255,214,140,${0.6 + 0.3 * Math.sin(t * 3)})`; ctx.beginPath(); ctx.arc(x, y - 56, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x + 6, y - 22, 2, 0, TAU); ctx.fill(); },
  // the fortress gate into the boss's tide pool (4-5)
  mzFortGate(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#c8b898'; ctx.fillRect(x - 26, y - 76, 52, 76); ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x - 16, y - 44); ctx.arc(x, y - 44, 16, Math.PI, TAU); ctx.lineTo(x + 16, y); ctx.fill(); ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 2; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + k * 8, y - 56); ctx.lineTo(x + k * 8, y); ctx.stroke(); } ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 3, y - 74, 6, 8); },
  // a nest pad (bouncy weaver nest on a crown, 4-3)
  mzNestPad(ctx, e, t) { const x = e.x, y = e.y + 4, w = e.w, k = e.squash || 0; ctx.save(); ctx.translate(x + w / 2, y - 8 + k * 3); ctx.scale(1 + k * 0.15, 1 - k * 0.25); ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.ellipse(0, 0, w / 2, 10, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 1; for (let q = -3; q <= 3; q++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 4, q * 2); ctx.lineTo(w / 2 - 4, q * 2 - 2); ctx.stroke(); } ctx.restore(); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x + w / 2 + 6, y - 18 + Math.sin(t * 5) * 1.5, 3.5, 0, TAU); ctx.fill(); },
  // a thorn hedge only a rolling dung ball smashes (4-1)
  mzBallHedge(ctx, e, t) { const x = e.x, y = e.y, w = e.w, h = e.h; ctx.fillStyle = '#5a7a2a'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#3a4a1a'; ctx.lineWidth = 2; for (let k = 0; k < h / 8; k++) { ctx.beginPath(); ctx.moveTo(x, y + k * 8 + 4); ctx.lineTo(x + w, y + k * 8); ctx.stroke(); } ctx.fillStyle = '#e8e0c8'; for (let k = 0; k < h / 10; k++) { ctx.beginPath(); ctx.moveTo(x - 4, y + k * 10 + 5); ctx.lineTo(x + 3, y + k * 10 + 3); ctx.lineTo(x + 3, y + k * 10 + 7); ctx.fill(); } ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 7, 0, TAU); ctx.fill(); },
  // honeycomb over the sticky crown (4-3)
  mzComb(ctx, e, t) { const x = e.x, y = e.y + 4, w = e.w; ctx.fillStyle = 'rgba(240,170,30,0.9)'; ctx.fillRect(x, y - 4, w, 8); ctx.strokeStyle = '#c8801a'; ctx.lineWidth = 1; for (let q = 0; q < w; q += 8) { ctx.beginPath(); ctx.moveTo(x + q, y - 4); ctx.lineTo(x + q + 4, y); ctx.lineTo(x + q, y + 4); ctx.stroke(); } for (let q = 6; q < w; q += 18) { ctx.fillStyle = 'rgba(240,170,30,0.9)'; ctx.fillRect(x + q, y + 4, 3, 5 + Math.sin(t * 2 + q) * 3); } }
};

/* ================= stamps ================= */
const stamps = {
  // 4-1: inside the termite mound (secret): the queen's fungus garden, the way to the Banca
  cupim: {
    floor: 11,
    rows: [
      '##############################',
      '########............##########',
      '#####....................#####',
      '###.........o.o.o.o.........##',
      '##.........-------...........#',
      '#....*.......................#',
      '#..----..............-----...#',
      '#................?...........#',
      '#............................#',
      '#..........t.................#',
      '#.@.D..............m.....g...#',
      '##############################',
      '##############################'
    ],
    legend: { t: ['decor', 'mzTunnels'], m: ['decor', 'mzMushroomGarden'] },
    items: ['oneup'], doors: [{ to: 'gorongosa@cupimBack', look: 'mzMoundExit' }], gold: { '*': 'hidden' }
  },
  // 4-2: the hold of the buried dhow (secret): cashew crates, the way to 4-6
  porao: {
    floor: 10,
    rows: [
      '##############################',
      '#............................#',
      '#..o.o.o.o...................#',
      '#..........................*.#',
      '#.......................-----#',
      '#.........-----..............#',
      '#............................#',
      '#............?...............#',
      '#............................#',
      '#.@.D...k.......k.......g....#',
      '##############################',
      '##############################'
    ],
    legend: { k: ['decor', 'mzCashewCrate'] },
    items: ['sundial'], doors: [{ to: 'dunas@holdBack', look: 'tourDoor' }], gold: { '*': 'hidden' }
  },
  // 4-3: the hollow trunk (secret): a vertical room with ledges up the inside of the baobab
  oco: {
    floor: 12,
    rows: [
      '########################',
      '#......................#',
      '#....*.......o.o.o.....#',
      '#..----......-----.....#',
      '#......................#',
      '#..........----........#',
      '#......................#',
      '#..----............?...#',
      '#......................#',
      '#.........----.........#',
      '#......................#',
      '#.@.D..................#',
      '########################',
      '########################'
    ],
    items: ['lsd'], doors: [{ to: 'copas@holeBack', look: 'tourDoor' }], gold: { '*': 'hidden' }
  },
  // 4-4: inside the lighthouse: stairs up to the lamp room and its lever; a fake wall in the basement (the cave)
  farol: {
    floor: 14,
    rows: [
      '######################',
      '#....................#',
      '#..lk................#',
      '#######..............#',
      '#....................#',
      '#.......-----........#',
      '#....................#',
      '#....................#',
      '#..-----.............#',
      '#....................#',
      '#...............######',
      '#........-----..F....#',
      '#.....?.........F....#',
      '#.@.D...........F.aD.#',
      '######################',
      '######################'
    ],
    legend: { l: ['spawn', 'lever', { opens: 'beam', look: 'mzLighthouseLever' }], k: ['vkey', 'beam'], a: ['anchor', 'caveBack'] },
    items: ['power'], doors: [{ to: 'praia@farolBack', look: 'tourDoor' }, { to: 'gruta@in', look: 'tourDoor' }]
  },
  // 4-4: the sea cave behind the basement wall (secret): Bottle #3
  gruta: {
    floor: 10,
    rows: [
      '############################',
      '#..........................#',
      '#....o.o.o.o...............#',
      '#..........................#',
      '#...--------......*........#',
      '#................---.......#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#.@.D..n...........p.......#',
      '############################',
      '############################'
    ],
    legend: { n: ['piece', 'bottle', { n: 3 }], p: ['decor', 'mzPlankton'] },
    doors: [{ to: 'farol@caveBack', look: 'tourDoor' }], gold: { '*': 'hidden' }
  },
  // 4-5: the room under the cistern's stepping stone (secret)
  cisterna: {
    floor: 10,
    rows: [
      '############################',
      '#..........................#',
      '#..........................#',
      '#....o.o.o.o...............#',
      '#...........*..............#',
      '#...-------.......?........#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#.@.D......................#',
      '############################',
      '############################'
    ],
    items: ['oneup'], doors: [{ to: 'muralha@cisternBack', look: 'tourDoor' }], gold: { '*': 'hidden' }
  },
  // 4-6: the captain's cabin behind the rock (secret)
  cabine: {
    floor: 10,
    rows: [
      '############################',
      '#..........................#',
      '#......l..........l........#',
      '#..........................#',
      '#....o.o.o.o...............#',
      '#............*.............#',
      '#...-------..-----.........#',
      '#.....................?....#',
      '#..........................#',
      '#.@.D.........k............#',
      '############################',
      '############################'
    ],
    legend: { l: ['decor', 'mzLantern'], k: ['decor', 'mzCashewCrate'] },
    items: ['magnet'], doors: [{ to: 'areia@cabinBack', look: 'tourDoor' }], gold: { '*': 'hidden' }
  },
  // the Banca da Gorongosa (Souvenir Stand): a hornbill keeper
  stand: {
    floor: 10,
    rows: [
      '############################',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#...........q..............#',
      '#.@........$............G..#',
      '############################',
      '############################'
    ],
    legend: { q: ['decor', 'mzKeeperHornbill'] }
  }
};

/* ================= pieces ================= */
const P = {};
P.opening = (st, o) => { for (const [k, tx, dy] of o.decor || []) st.B.decorAt(k, tx, st.gy + (dy || 0), tx * 7); return st.x; };
P.standSign = (st, o) => { const x = st.x; st.floor(x, x + 7); Tour.pieces.gearStand(st, { item: o.item, skin: o.skin || null }); st.sign(x + 5, o.text); return x + 8; };
// 4-1: the starting line with the rival (countdown)
P.startLine = (st, o) => { const x = st.x; st.floor(x, x + 9); st.decor('mzStartLine', x + 4); st.B.spawn('tourRival', x + 6, st.gy - 1, { speed: o.speed || 6, look: 'mzOstrichRival', name: 'AVESTRUZ' }); return x + 10; };
// 4-1: the fast route over acacia crowns (reached from an elephant's jet); thorn hedges and mounds on the ground below
P.acaciaRun = (st, o) => {
  const B = st.B, x = st.x, n = o.n || 4, ty = st.gy - (o.rise || 9); st.floor(x, x + n * 7 + 2);
  for (let k = 0; k < n; k++) {
    const ax = x + 2 + k * 7, w = 4;
    for (let q = 0; q < w; q++) { B.set(ax + q, ty, T.SEMI); B.setHide(ax + q, ty, 1); }
    B.prop('mzAcacia', ax, ty, w, 1, 'none', {});
    st.coins(ax, ax + w - 1, ty - 2);
    if (k === Math.floor(n / 2) && o.gold) st.gold(ax + 2, ty - 3, o.gold);
  }
  // the ground route: a mound and a thorn hedge
  B.prop('mzMound', x + 6, st.gy - 2, 2, 2, 'body', {});
  B.fill(x + 14, st.gy - 3, x + 16, st.gy - 1, T.BRICK);
  for (let y = st.gy - 2; y < st.gy; y++) B.set(x + 15, y, T.PICK);
  if (o.enemy) st.enemy(o.enemy, x + 20, st.gy);
  return x + n * 7 + 3;
};
// 4-1: a dung beetle pushing its ball down the track; a hedge only the ball smashes guards a pocket
P.beetleRun = (st, o) => {
  const B = st.B, x = st.x, n = o.n || 16; st.floor(x, x + n - 1);
  st.enemy('mzDungBeetle', x + n - 5, st.gy, { ball: true });
  st.coins(x + 2, x + n - 8, st.gy - 3);
  if (o.sign) st.sign(x + 1, o.sign);
  return x + n;
};
P.ballPocket = (st, o) => {
  const B = st.B, x = st.x; st.floor(x, x + 13);
  // a big termite mound with a tunnel through its foot: a thorn hedge plugs the tunnel; only a kicked dung ball breaks
  // it. The 1-up sits in the tunnel's roof. The main route goes over the mound.
  B.prop('mzMound', x + 3, st.gy - 4, 9, 4, 'body', {});
  for (let xx = x + 4; xx <= x + 10; xx++) for (let y = st.gy - 2; y < st.gy; y++) { B.set(xx, y, T.EMPTY); }
  B.prop('mzTunnelMouth', x + 3, st.gy - 2, 9, 2, 'none', {});
  const tiles = []; for (let y = st.gy - 2; y < st.gy; y++) { B.set(x + 3, y, T.HARD); B.setHide(x + 3, y, 1); tiles.push([x + 3, y]); }
  B.locks.push({ id: 'ball', tiles }); B.spawn('breakWall', x + 3, st.gy - 1, { needs: 'ball', h: 2, skin: 'mzBallHedge', id: 'bw' + x });
  B.set(x + 8, st.gy - 3, T.QBLOCK); B.item(x + 8, st.gy - 3, 'oneup');
  st.coins(x + 5, x + 9, st.gy - 1);
  return x + 14;
};
// 4-1: the termite mound with the wide hole (the cupim, the secret exit) and ants marching in
P.moundDoor = (st, o) => { const x = st.x, nx = Tour.pieces.secretDoor(st, { to: o.to, look: 'curtain', skin: 'mzMoundDoor', back: o.back, h: 5 }); return nx; };
// 4-1: the finish: the ranger lookout and the gate
P.savannaFinale = (st, o) => { const B = st.B, x = st.x; st.floor(x, x + 18); st.decor('mzLookout', x + 15); st.decor('mzGrass', x + 3); B.spawn('gate', x + 9, st.gy - 1, { exit: 'main' }); return x + 19; };
// 4-2: a dune with a crumbling crest, rising (o.up rows) or falling back
P.dune = (st, o) => {
  const B = st.B, x = st.x, w = o.w || 10, h = o.h || 3; st.floor(x, x + w - 1);
  for (let i = 0; i < w; i++) { const k = Math.sin((i + 0.5) / w * Math.PI), hh = Math.round(k * h); if (hh > 0) B.fill(x + i, st.gy - hh, x + i, st.gy - 1, T.GROUND); }
  if (o.crumble) { const c = Math.floor(w / 2); for (let q = -1; q <= 1; q++) { const hh = Math.round(Math.sin((c + q + 0.5) / w * Math.PI) * h); B.set(x + c + q, st.gy - hh, T.CRUMBLE); } }
  st.arc(x + 1, x + w - 2, st.gy - h - 2, 1);
  if (o.enemy) st.enemy(o.enemy, x + w - 2, st.gy);
  if (o.gold) st.gold(x + Math.floor(w / 2), st.gy - h - 3, o.gold);
  return x + w;
};
// 4-2: a pit of soft sand with a crumbling bridge (keep running)
P.softBridge = (st, o) => { const x = st.x, n = o.n || 6; st.floor(x, x + 1); st.pit(x + 2, x + n + 1); for (let q = 0; q < n; q++) st.B.set(x + 2 + q, st.gy, T.CRUMBLE); st.floor(x + n + 2, x + n + 4); st.coins(x + 2, x + n + 1, st.gy - 2); return x + n + 5; };
// 4-2: the mast with the pennant and the hatch beside it (to the hold)
P.mastHatch = (st, o) => {
  const B = st.B, x = st.x; st.floor(x, x + 7);
  st.decor('mzMast', x + 2);
  B.spawn('trapdoor', x + 4, st.gy - 1, { targetRef: o.to, crate: false, look: 'mzMastHatch' });
  B.anchor(o.back, x + 7, st.gy - 1);
  return x + 8;
};
// 4-2: the finish: a dune ridge and the gate; the herd thunders by below
P.ridgeFinale = (st, o) => { const B = st.B, x = st.x; st.floor(x, x + 18); B.fill(x + 3, st.gy - 2, x + 6, st.gy - 1, T.GROUND); B.fill(x + 4, st.gy - 3, x + 5, st.gy - 3, T.GROUND); st.decor('mzGrass', x + 8); B.spawn('gate', x + 12, st.gy - 1, { exit: 'main' }); return x + 19; };
// 4-3 sky: a baobab crown island at row o.gy after o.gap open columns; its slab is drawn as the crown
P.crown = (st, o) => {
  const B = st.B; if (o.gy != null) st.gy = o.gy;
  const gap = o.gap || 0, x = st.x + gap, w = o.w || 7;
  for (let xx = x; xx < x + w; xx++) for (let y = st.gy; y <= Math.min(B.H - 1, st.gy + 1); y++) { B.set(xx, y, T.GROUND); B.setHide(xx, y, 1); }
  B.prop('mzCrown', x, st.gy, w, 2, 'none', { trunk: o.trunk !== false });
  if (gap >= 4 && o.coins !== false) st.arc(st.x, x - 1, st.gy - 2, 2);
  if (o.stand) { B.spawn('gearStand', x + 1, st.gy - 1, { item: o.stand }); B.vkey('gear:' + o.stand, [[x + 1, st.gy - 1], [x + 1, st.gy - 2]]); }
  if (o.nest) { const nx = x + w - 3; for (let q = 0; q < 2; q++) B.setSurf(nx + q, st.gy, SURF.BOUNCE); B.spawn('surfaceSkin', nx, st.gy - 1, { n: 2, kind: 'bounce', look: 'mzNestPad' }); B.springs.push([nx, st.gy - 1]); }
  if (o.honey) { for (let q = 1; q < w - 1; q++) B.setSurf(x + q, st.gy, SURF.STICKY); B.spawn('surfaceSkin', x + 1, st.gy - 1, { n: w - 2, kind: 'honey', look: 'mzComb' }); st.spawn('mzWeaver', x + Math.floor(w / 2), st.gy - 3, { range: 2 }); }
  if (o.hole) { B.spawn('trapdoor', x + Math.floor(w / 2) - 1, st.gy - 1, { targetRef: o.hole, crate: false, look: 'mzCrownHole' }); }
  if (o.item) st.block(x + Math.floor(w / 2), st.gy - 4, o.item);
  if (o.enemy) st.enemy(o.enemy, x + Math.floor(w / 2), st.gy);
  if (o.gold) st.gold(x + (o.gold[1] != null ? o.gold[1] : Math.floor(w / 2)), st.gy + (o.gold[2] != null ? o.gold[2] : -3), o.gold[0]);
  if (o.back) B.anchor(o.back, x + w - 2, st.gy - 1);
  if (o.cp) st.spawn('checkpoint', x + w - 2, st.gy - 1);
  return x + w;
};
// 4-3: dress the last n tiles (a checkpoint's slab) as a crown
P.crownify = (st, o) => { const B = st.B, n = o.n || 6, x0 = st.x - n; for (let x = x0; x < st.x; x++) for (let y = st.gy; y <= Math.min(B.H - 1, st.gy + 2); y++) B.setHide(x, y, 1); for (let x = x0; x < st.x; x++) B.set(x, st.gy + 2, T.EMPTY); B.prop('mzCrown', x0, st.gy, n, 2, 'none', { trunk: false }); return st.x; };
// 4-3: the start pad drawn as the first crown
P.crownStart = (st, o) => { const B = st.B; for (let x = 0; x < 12; x++) for (let y = st.gy; y <= Math.min(B.H - 1, st.gy + 2); y++) B.setHide(x, y, 1); for (let x = 0; x < 12; x++) B.set(x, st.gy + 2, T.EMPTY); B.prop('mzCrown', 0, st.gy, 12, 2, 'none', { trunk: true, big: true }); return st.x; };
// 4-3: an evening gust across a gap: a wind zone (leaf streaks show it) that carries a jump further
P.gust = (st, o) => {
  const B = st.B, x = st.x, w = o.w || 8, y0 = st.gy - 9, h = 12;
  B.zone(x, y0, w, h, (o.fx || 1) * 220, 0, 0, 'wind');
  B.spawn('mzGustFx', x, y0 + h - 1, { w, h, dir: o.fx || 1 });
  if (o.gold) st.gold(x + Math.floor(w / 2), st.gy - 5, o.gold);
  if (o.bat) st.spawn('mzFruitBat', x + Math.floor(w / 2), st.gy - 6, {});
  return x;
};
// 4-3: the finish on the great baobab's crown
P.crownFinale = (st, o) => { const B = st.B; if (o.gy != null) st.gy = o.gy; const x = st.x + (o.gap || 0); for (let xx = x; xx < x + 18; xx++) for (let y = st.gy; y <= st.gy + 1; y++) { B.set(xx, y, T.GROUND); B.setHide(xx, y, 1); } B.prop('mzCrown', x, st.gy, 18, 2, 'none', { trunk: true, big: true }); B.spawn('gate', x + 11, st.gy - 1, { exit: 'main' }); st.decor('mzNest', x + 4); return x + 18; };
// 4-4: the nest at the start: the hatchling's pedestal
P.nestStart = (st, o) => { const x = st.x; st.decor('mzTurtleNest', x + 1); const nx = Tour.pieces.pedestal(st, { item: 'hatchling', start: true, look: o.look || null }); st.floor(nx, nx + 1); st.sign(nx, 'CARRY THE HATCHLING TO THE SEA. NO FIGHTING, NO BIG FALLS'); return nx + 2; };
// 4-4: the lighthouse on the point: a nest stone to set the hatchling on, the door in, the sweeping beam
P.farol = (st, o) => {
  const B = st.B, x = st.x; st.floor(x, x + 16);
  Tour.pieces.pedestal(Object.assign(st, { x: x + 1 }), { item: 'hatchling' }); st.x = x;
  B.prop('mzFarolTower', x + 7, st.gy - 8, 4, 8, 'none', {});
  B.spawn('portal', x + 9, st.gy - 1, { kind: 'door', look: 'mzFarolDoor', targetRef: o.to });
  st.sign(x, 'SET THE HATCHLING ON THE STONE (THROW), THEN GO IN');
  B.anchor(o.back, x + 12, st.gy - 1);
  B.spawn('mzBeam', x + 9, st.gy - 1, { h: 8, span: o.span || 16, fix: o.fix || 20 });
  // the lantern gallery round the top: a ledge outside the lamp room (P3)
  B.fill(x + 5, st.gy - 4, x + 12, st.gy - 4, T.SEMI);
  if (o.gold) st.gold(x + 6, st.gy - 6, o.gold);
  return x + 17;
};
// 4-4: rocks across a glowing tide pool
P.poolRocks = (st, o) => Tour.pieces['mz.rocks'](st, o);
// 4-4: a beach stretch where crabs scuttle in the dark and freeze in the beam
P.crabBeach = (st, o) => { const x = st.x, n = o.n || 2; st.floor(x, x + 4 * n + 5); for (let k = 0; k < n; k++) { st.enemy('mzGhostCrab', x + 4 + k * 4, st.gy); st.decor('mzShell', x + 2 + k * 4); } if (o.prawn) st.enemy('mzPrawn', x + 4 * n + 3, st.gy); st.coins(x + 2, x + 4 * n, st.gy - 3); if (o.gold) st.gold(x + 3, st.gy - 5, o.gold); return x + 4 * n + 6; };
// 4-4: the jetty gate: shut until the lighthouse shines again
P.beamGate = (st, o) => {
  const B = st.B, x = st.x; st.floor(x, x + 4);
  const tiles = []; for (let y = st.gy - 3; y < st.gy; y++) { B.set(x + 2, y, T.HARD); B.setHide(x + 2, y, 1); tiles.push([x + 2, y]); }
  B.locks.push({ id: 'beam', tiles }); B.spawn('mzKeyShutter', x + 2, st.gy - 1, { id: 'beam', h: 3, look: null });
  B.fill(x + 2, Math.max(0, st.gy - 10), x + 2, st.gy - 4, T.HARD);
  if (o.sign) st.sign(x, o.sign);
  return x + 5;
};
// 4-4: the sea at the end: the delivery stone, then the gate
P.seaFinale = (st, o) => {
  const B = st.B, x = st.x; st.floor(x, x + 22);
  const nx = Tour.pieces.pedestal(st, { deliver: true, lockAt: 3 });
  st.decor('mzTurtleNest', x + 1);
  B.spawn('gate', nx + 6, st.gy - 1, { exit: 'main' });
  st.floor(nx, nx + 10);
  return nx + 11;
};
// 4-5: a thorn barricade (burn it with piri-piri, or jump it) after a pot you kick into a water trough (the boss's moves)
P.potTrough = (st, o) => {
  const B = st.B, x = st.x; st.floor(x, x + 16);
  for (let q = 10; q <= 12; q++) for (let y = st.gy; y <= st.gy + 2; y++) B.set(x + q, y, T.WATER);
  B.spawn('mzShellPot', x + 5, st.gy - 1, {});
  st.sign(x + 1, 'KICK THE POT INTO THE WATER. SHELLS SINK!');
  B.fill(x + 14, st.gy - 3, x + 15, st.gy - 1, T.BRICK);
  return x + 17;
};
P.cisternHatch = (st, o) => {
  const B = st.B; let x = st.x; st.floor(x, x + 1); x += 2;
  for (let i = 0; i < 4; i++) { st.pit(x, x + 2); B.fill(x, st.gy + 1, x + 2, st.H - 1, T.LAVA); x += 3; B.fill(x, st.gy - 1, x, st.H - 1, T.PILLAR); st.coins(x, x, st.gy - 3); if (i === 2) { B.spawn('trapdoor', x, st.gy - 2, { targetRef: o.to, crate: false, look: 'mzStoneHatch' }); B.anchor(o.back, x, st.gy - 2); } x += 1; }
  st.floor(x, x + 2); return x + 3;
};
// 4-6: the dig: hull chambers full of cashews, rock to dig round, cave-ins
P.hullChamber = (st, o) => {
  const x = st.x, w = o.w || 12, h = o.h || 4, B = st.B, y = Math.min(B.H - 4 - h, st.y + (o.dy || 4));
  st.cavern(x, y, x + w - 1, y + h - 1); st.coins(x + 1, x + w - 2, y + h - 2);
  B.decorAt('mzRibs', x + Math.floor(w / 2), y + h, x);
  if (o.enemy) st.enemy(o.enemy, x + Math.floor(w / 2), y + h);
  if (o.item) { B.set(x + Math.floor(w / 2), y, T.QBLOCK); B.item(x + Math.floor(w / 2), y, o.item); }
  if (o.gold) st.gold(x + Math.floor(w / 2) - 2, y + h - 2, o.gold);
  if (o.caveIn) for (let q = 2; q < w - 2; q++) B.set(x + q, y - 1, T.CRUMBLE);
  st.y = y + h; return x + w + (o.gap || 3);
};
// 4-6: the captain's cabin: a rock wall you shoulder through (hard hat), then the cabin door
P.cabinRock = (st, o) => {
  const B = st.B, x = st.x, y1 = Math.min(B.H - 4, st.y + 4), y0 = y1 - 3;
  st.cavern(x, y0, x + 10, y1);
  for (let y = y0 + 1; y <= y1; y++) { B.set(x + 4, y, T.HARD); B.setHide(x + 4, y, 1); }
  B.locks.push({ id: 'gear:hat', tiles: [[x + 4, y0 + 1], [x + 4, y0 + 2], [x + 4, y1]] });
  B.spawn('breakWall', x + 4, y1, { needs: 'hat', h: 3, skin: 'mzHullRock', id: 'bw' + x });
  B.spawn('portal', x + 8, y1, { kind: 'door', look: 'tourDoor', targetRef: o.to });
  B.anchor(o.back, x + 7, y1);
  st.y = y1; return x + 12;
};
for (const k in P) Tour.pieces['mz.' + k] = P[k];

// the crown of a baobab (an island): thick branches holding a flat crown, the trunk down into the haze
Decor.mzCrown = (ctx, x, y, t, th, d) => {
  const x0 = x - d.w / 2, top = y - d.h;
  if (d.trunk) { const tw = Math.min(70, d.w * 0.5); const g = ctx.createLinearGradient(x - tw / 2, 0, x + tw / 2, 0); g.addColorStop(0, '#6a4a32'); g.addColorStop(0.5, '#9a7454'); g.addColorStop(1, '#5a3e28'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - tw / 2, y + 900); ctx.quadraticCurveTo(x - tw * 0.62, top + 120, x - tw * 0.3, top + 24); ctx.lineTo(x + tw * 0.3, top + 24); ctx.quadraticCurveTo(x + tw * 0.62, top + 120, x + tw / 2, y + 900); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = '#7a5a3e'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  for (let k = 0; k < 4; k++) { const bx = x0 + 8 + k * (d.w - 16) / 3; ctx.beginPath(); ctx.moveTo(x, top + 40); ctx.quadraticCurveTo((x + bx) / 2, top + 22, bx, top + 6); ctx.stroke(); }
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#5a6a24'; rr(ctx, x0 - 4, top - 2, d.w + 8, 16, 7); ctx.fill();
  ctx.fillStyle = '#7a8a2e'; for (let k = 0; k < d.w / 14; k++) { ctx.beginPath(); ctx.ellipse(x0 + 6 + k * 14, top + 1 + Math.sin(k * 1.9) * 2, 9, 5, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#8a6a48'; ctx.fillRect(x0, top + 10, d.w, 5);
};
// evening gust streaks
class MzGustFx extends Ent {
  constructor(g, s) { super(g, s, (s.w || 8) * TS, (s.h || 12) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h + TS; this.dir = s.dir || 1; this.back = true; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,240,220,0.55)'; ctx.lineWidth = 1.6;
    for (let k = 0; k < 9; k++) { const ph = (this.t * 0.9 + k * 0.37) % 1, xx = this.x + (this.dir > 0 ? ph : 1 - ph) * this.w, yy = this.y + (k * 53 % this.h); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + this.dir * 18, yy - 4, xx + this.dir * 36, yy); ctx.stroke(); }
    ctx.fillStyle = '#7a8a2e'; for (let k = 0; k < 4; k++) { const ph = (this.t * 0.7 + k / 4) % 1; ctx.beginPath(); ctx.ellipse(this.x + ph * this.w, this.y + 40 + k * 60 + Math.sin(this.t * 3 + k) * 10, 4, 2, this.t * 4 + k, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
ENTITY_TYPES.mzGustFx = MzGustFx;

// the boss beach reshaped for the v2 lair (30 wide): the sea at both ends, three borrowed shells (the bottle nearest
// to where he wakes), two ledges, the chili basket on the middle platform under the great baobab; P3 on a cannon
Tour.pieces['mz.arena_tidepool'] = (st, o) => {
  const B = st.B, { x0, w, GY } = o;
  for (const tx of [x0 + 1, x0 + 2, x0 + w - 3, x0 + w - 2]) for (let y = GY; y <= GY + 2; y++) B.set(tx, y, T.WATER);
  for (let q = 0; q < 3; q++) { B.set(x0 + 5 + q, GY - 4, T.SEMI); B.set(x0 + w - 8 + q, GY - 4, T.SEMI); }
  for (let q = 0; q < 4; q++) B.set(x0 + 13 + q, GY - 6, T.SEMI);
  B.prop('mzBaobabProp', x0 + 12, GY - 9, 6, 9, 'none', {});
  B.spawn('mzChiliBasket', x0 + 14, GY - 7, {});
  B.spawn('mzShellPot', x0 + 7, GY - 1, {}); B.spawn('mzShellBucket', x0 + 14, GY - 1, {}); B.spawn('mzShellBottle', x0 + 21, GY - 1, {});
  B.decorAt('mzCannonDecor', x0 + 6, GY - 4, 0); B.decorAt('mzCannonDecor', x0 + w - 7, GY - 4, 0);
  B.decorAt('mzShell', x0 + 10, GY, 0); B.decorAt('mzShell', x0 + 19, GY, 0); B.decorAt('mzGrass', x0 + 4, GY, 0); B.decorAt('mzGrass', x0 + w - 5, GY, 0);
  B.decorAt('mzRampartPalm', x0 + 3, GY, 0);
  B.gold(x0 + w - 7, GY - 6, 'risky');
};

/* ================= houses and the country panel ================= */
const houses = [{ id: 'mz-gorongosa', mapLabel: 'Banca', kind: 'stand', name: 'Banca da Gorongosa', keeper: 'hornbill', theme: 'mz_savanna', stock: ['hat', 'plane', 'fins', 'magnet', 'oneup', 'sundial', 'sig:piri'], mapCell: [0, 1], mapFrom: 0 }];
const map = { fort: 'seafort', start: [0, 0] };

/* ================= the levels ================= */
const levels = [
  // 4-1 RACE: the ostrich runs the course; elephant jets lift you onto the acacia route; dung beetles; thorn hedges
  { n: 1, name: 'Ostrich Dash', mapLabel: 'Ostriches', arch: 'race', theme: 'mz_savanna',
    gimmick: 'Race an ostrich across Gorongosa: elephants spray you onto the acacia route, dung beetles roll, thorns burn',
    hint: 'Ride an elephant\'s water jet up to the acacias: the high route is faster. Piri-piri burns thorn hedges',
    postcard: 'The ostrich won. The ostrich always wins. It has done this before. ♥ C',
    enemies: [['mzWarthog', 2], ['mzDungBeetle', 2], ['mzWeaver', 1]],
    mapCell: [0, 0], mapFrom: -1,
    exits: { main: { to: '4-2' }, secret: { to: 'house:mz-gorongosa', hint: 'Ants march into one termite mound with a bigger door...' } },
    areas: [
      { id: 'gorongosa', gen: 'strip', W: 210, H: 20, script: [
        ['opening', { decor: [['mzGrass', 2], ['mzSkull', 8]] }],
        ['startLine', { speed: 6 }],
        ['itemBlock', { item: 'power', y: 4 }],
        // ① the race; the elephant's jet lifts you to the fast route
        ['elephant', {}],
        ['postcard', { kind: 'must', dx: -5, dy: -12 }],
        ['acaciaRun', { n: 4, enemy: 'mzWarthog', gold: 'risky' }],
        'sig',
        ['mounds'],
        'cp',
        // ② dung beetles: knock the beetle, kick its ball at the hedge
        ['beetleRun', { n: 16, sign: 'STOMP THE BEETLE, THEN KICK ITS BALL AT THE HEDGE' }],
        ['ballPocket'],
        ['moundDoor', { to: 'cupim@in', back: 'cupimBack' }],
        ['elephant', { phase: 1.5 }],
        ['acaciaRun', { n: 3, rise: 9 }],
        // ③ thorn hedges the ostrich leaps (burn them, or jump)
        ['thorns', { h: 4 }],
        ['herd'],
        ['thorns', { h: 4 }],
        ['beetleRun', { n: 12 }],
        ['savannaFinale']
      ] },
      { id: 'cupim', gen: 'room', role: 'secret', theme: 'mz_cupim', stamp: 'cupim' }
    ] },

  // 4-2 DOOM: the stampede's dust cloud chases you over the dunes
  { n: 2, name: 'Dune Stampede', mapLabel: 'Stampede', arch: 'doom', theme: 'mz_dunes',
    gimmick: 'A stampede of wildebeest kicks up a dust storm behind you: keep running over the dunes',
    hint: 'Don\'t stop! The dust cloud costs a hit if it catches you. Bounce off the dhow sails',
    postcard: 'Something stampeded. Possibly wildebeest. Possibly the Baron\'s luggage. I ran. ♥ C',
    enemies: [['mzGhostCrab', 2], ['mzPangolin', 2], ['mzMango', 1]],
    mapCell: [1, 0], mapFrom: 0,
    exits: { main: { to: '4-3' }, secret: { to: '4-6', hint: 'A pennant flies from a mast sticking out of the dunes...' } },
    areas: [
      { id: 'dunas', gen: 'strip', W: 210, H: 20, chase: { speed: 3.4, ramp: 0.12, look: 'dust' }, script: [
        ['opening', { decor: [['mzGrass', 3], ['mzShell', 7]] }],
        ['itemBlock', { item: 'power', y: 4 }],
        // ① the dust cloud: open dunes
        ['dune', { w: 10, h: 2 }],
        ['softBridge', { n: 5 }],
        ['dune', { w: 12, h: 3, crumble: true }],
        ['postcard', { kind: 'must', dx: -4, dy: -6 }],
        // ② crumbling crests and beached dhows (bounce off the sails)
        ['dhow', {}],
        ['dune', { w: 10, h: 3, crumble: true, enemy: 'mzGhostCrab' }],
        ['mastHatch', { to: 'porao@in', back: 'holdBack' }],
        'cp',
        ['dhow', { gold: true }],
        ['softBridge', { n: 6 }],
        // ③ ghost crabs and curled pangolins in the way while the herd speeds up
        ['star'],
        ['dune', { w: 12, h: 4, enemy: 'mzPangolin' }],
        ['crabs', { n: 2 }],
        ['dune', { w: 10, h: 3, crumble: true, enemy: 'mzPangolin', gold: 'risky' }],
        ['softBridge', { n: 5 }],
        ['ridgeFinale']
      ] },
      { id: 'porao', gen: 'room', role: 'secret', theme: 'mz_porao', stamp: 'porao' }
    ] },

  // 4-3 SKY: baobab crowns at sunset; weaver nests bounce you; honey and bees; evening gusts and fruit bats
  { n: 3, name: 'Baobab Skyline', mapLabel: 'Baobabs', arch: 'sky', theme: 'mz_copas',
    gimmick: 'Hop the crowns of giant baobabs at sunset: weaver nests bounce, honey sticks, gusts carry you',
    hint: 'Nests bounce you high. Honey slows your jump. The evening gusts push you over the wide gaps',
    postcard: 'The baobabs are upside-down trees, they say. I stood on one. It felt right-side up. ♥ C',
    enemies: [['mzMonkey', 1], ['mzWeaver', 2], ['mzChameleon', 2], ['mzFruitBat', 1]],
    mapCell: [2, 0], mapFrom: 1,
    exits: { main: { to: '4-4' } },
    areas: [
      { id: 'copas', gen: 'islands', W: 200, H: 30, GY: 16, script: [
        ['crownStart'],
        ['crown', { w: 6, stand: 'plane', tight: true }],
        // ① crowns as islands, weaver nests bounce you
        ['crown', { gap: 4, gy: 15, w: 7, item: 'power', enemy: 'mzChameleon', tight: true }],
        ['crown', { gap: 4, gy: 13, w: 6, nest: true, tight: true }],
        ['crown', { gap: 3, gy: 6, w: 7, gold: ['must', 3, -3], hole: 'oco@in', back: 'holeBack', tight: true }],
        ['crown', { gap: 4, gy: 11, w: 6, enemy: 'mzMonkey', tight: true }],
        // ② honey and bees
        ['crown', { gap: 4, gy: 13, w: 9, honey: true, tight: true }],
        ['crown', { gap: 3, gy: 11, w: 6, nest: true, tight: true }],
        ['cp', { tight: true }],
        ['crownify', { n: 6, tight: true }],
        ['crown', { gap: 3, gy: 8, w: 6, item: 'lsd', tight: true }],
        ['crown', { gap: 5, gy: 12, w: 7, honey: true, enemy: 'mzChameleon', tight: true }],
        // ③ evening gusts and fruit bats over the widest gaps
        ['gust', { w: 9, fx: 1, bat: true, gold: 'risky', tight: true }],
        ['crown', { gap: 9, gy: 13, w: 6, tight: true }],
        ['gust', { w: 8, fx: 1, bat: true, tight: true }],
        ['crown', { gap: 8, gy: 12, w: 7, nest: true, tight: true }],
        ['crown', { gap: 3, gy: 6, w: 6, enemy: 'mzMonkey', tight: true }],
        ['gust', { w: 9, fx: 1, tight: true }],
        ['crownFinale', { gap: 9, gy: 11, tight: true }]
      ] },
      { id: 'oco', gen: 'room', role: 'secret', theme: 'mz_oco', stamp: 'oco' }
    ] },

  // 4-4 CARRY (dark): carry the hatchling to the sea; the lighthouse beam freezes the ghost crabs; relight it
  { n: 4, name: 'Hatchling Night', mapLabel: 'Hatchlings', arch: 'carry', theme: 'mz_beach',
    gimmick: 'Carry a lost turtle hatchling to the sea at night. Ghost crabs freeze in the lighthouse beam',
    hint: 'THROW sets the hatchling down on a stone. Crabs only move in the dark: stay in the beam',
    postcard: 'The little turtle made it to the sea. I may have cried. The crabs were rude about it. ♥ C',
    enemies: [['mzGhostCrab', 3], ['mzPrawn', 1]],
    mapCell: [2, 1], mapFrom: [2, 5],
    exits: { main: { to: '4-5' } },
    areas: [
      { id: 'praia', gen: 'strip', W: 190, H: 20, dark: true, carry: { item: 'hatchling', jumpMul: 0.92 }, script: [
        ['nestStart'],
        ['itemBlock', { item: 'power', y: 4 }],
        ['standSign', { item: 'hat', text: 'A HARD HAT: ITS HEADLAMP FREEZES GHOST CRABS TOO' }],
        // ① carry it gently: rocks and turtles over the glowing pools
        ['poolRocks'],
        ['postcard', { kind: 'must', dx: -6, dy: -5 }],
        ['turtles', { span: 10 }],
        // ② the beam sweeps: crabs freeze in the light, scuttle in the dark
        ['crabBeach', { n: 2 }],
        ['farol', { to: 'farol@in', back: 'farolBack', span: 16, fix: 26, gold: 'risky' }],
        ['crabBeach', { n: 3, prawn: true }],
        'cp',
        // ③ the relit beam lights the last tide pools; the jetty gate opens with it
        ['beamGate', { sign: 'THE JETTY OPENS WHEN THE LIGHTHOUSE SHINES' }],
        ['turtles', { span: 12 }],
        ['crabBeach', { n: 2 }],
        ['poolRocks'],
        ['seaFinale']
      ] },
      { id: 'farol', gen: 'room', role: 'sub', theme: 'mz_farol', stamp: 'farol' },
      { id: 'gruta', gen: 'room', role: 'secret', theme: 'mz_gruta', stamp: 'gruta' }
    ] },

  // 4-5 LAIR: the ramparts and the cistern teach the shells and the fire, then O Eremita's tide pool
  { n: 5, name: 'Ilha Fortress', mapLabel: 'Ilha', arch: 'lair', theme: 'mz_fort',
    gimmick: 'Coconut cannons on the ramparts, the flooded cistern, then O Eremita the hermit crab',
    hint: 'Breathe piri-piri fire on O Eremita\'s borrowed shell until he jumps out, then stomp him. Kick empty shells into the sea!',
    postcard: 'The great baobab is back on its hill! The Baron flew north, to Morocco. ♥ C',
    enemies: [['mzPrawn', 2], ['mzCashew', 2]], boss: 'mz_hermit',
    mapCell: [1, 2], mapFrom: 3,
    exits: { main: { to: 'country:next' } },
    areas: [
      { id: 'muralha', gen: 'strip', mode: 'castle', W: 84, H: 18, script: [
        ['opening', { decor: [['mzRampartPalm', 3]] }],
        ['itemBlock', { item: 'power', y: 4 }],
        ['rampart', { gold: true }],
        'sig',
        ['potTrough'],
        ['cisternHatch', { to: 'cisterna@in', back: 'cisternBack' }],
        ['rampart', {}],
        ['door', { to: 'arena@in', perch: 0, look: 'mzFortGate' }]
      ] },
      { id: 'cisterna', gen: 'room', role: 'secret', theme: 'mz_cisterna', stamp: 'cisterna' },
      { id: 'arena', gen: 'arena', role: 'arena', layout: 'tidepool', arenaW: 30, theme: 'mz_fort' }
    ] },

  // 4-6 DIG (secret): dig through the dune into the buried dhow's hull
  { n: 6, name: 'Buried Dhow', mapLabel: 'Dhow', arch: 'dig', secret: true, theme: 'mz_areia',
    gimmick: 'Dig down through the dune into a buried dhow: chambers of cashews, mole-rats, cave-ins',
    hint: 'Stomp (down + jump) on sand to dig. The hard hat\'s dash digs sideways and breaks rock',
    postcard: 'A whole boat under the sand, full of cashews. The mole-rats had eaten half. ♥ C',
    enemies: [['mzMoleRat', 2], ['mzGhostCrab', 1], ['mzCashew', 1]],
    mapCell: [1, 1], mapFrom: 1,
    exits: { main: { to: 'node:4-4' } },
    areas: [
      { id: 'areia', gen: 'dig', W: 120, H: 40, script: [
        ['standSign', { item: 'hat', text: 'STOMP ON SAND TO DIG. THE HARD HAT DASH DIGS SIDEWAYS' }],
        ['itemBlock', { item: 'power', y: 4 }],
        ['hullChamber', { w: 12, h: 4, dy: 3, gold: 'must', enemy: 'mzMoleRat' }],
        ['rockBand', { w: 5 }],
        ['hullChamber', { w: 10, h: 4, dy: 4, item: 'magnet', caveIn: true }],
        ['cabinRock', { to: 'cabine@in', back: 'cabinBack' }],
        ['hullChamber', { w: 12, h: 5, dy: 3, enemy: 'mzMoleRat', caveIn: true, gold: 'risky' }],
        ['pocket', { item: 'oneup' }],
        ['hullChamber', { w: 10, h: 4, dy: 4, enemy: 'mzGhostCrab' }],
        ['exit', {}]
      ] },
      { id: 'cabine', gen: 'room', role: 'secret', theme: 'mz_cabine', stamp: 'cabine' }
    ] }
];

Tour.amend('mz', { stamps, skins, houses, map, levels });
})();
