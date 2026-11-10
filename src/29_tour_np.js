/* ============================================================
   NEPAL (world 12, the grand finale)
   12-1 Suspension Bridges    run    a yak pen lends Brady a shaggy yak to ride; long suspension bridges sag under
                                     every step (some planks are missing); momo dumplings hop, monal pheasants swoop
   12-2 Yak Caravan Pass      run    ride the yak up the stone stairways of the pass, CHARGE through packed snow walls,
                                     marmots pelt you with pebbles, snowballs roll down the icy stretches
   12-3 Blizzard Night        night  white-out gusts blow Brady back: shelter behind the boulders between gusts,
                                     cross the crevasses in the lulls, a snowball-throwing yeti
   12-4 Khumbu Icefall        climb  climb the icefall: ladder bridges over the crevasses, icicles that drop when you
                                     pass beneath, seracs that crumble underfoot
   12-5 Baron's Fortress      castle shrink-ray security cameras sweep the halls, wind-up souvenir goons, crates to
                                     smash; then Baron Bric-a-Brac on the summit: he throws the stolen landmarks and
                                     Brady kicks them back (airship, bric-a-brac mech, then on foot in the gales)
   Mountains, monasteries, stupas and prayer flags are scenery only, painted with respect, never the joke.
   ============================================================ */
(() => {
const COL = { a: '#c8322a', b: '#2a5aa8', c: '#ffd23a' };
const K = TourKit;
const FLAGS = ['#2a6ad8', '#f4f4f4', '#d8322a', '#2aa84a', '#f2c81a'];
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };
LIQUIDS.np_river = ['#7ac8c8', '#3a8a96', '#1a4a5a', 'rgba(230,255,255,0.3)', null, 'rgba(240,255,255,0.7)'];
LIQUIDS.np_crevasse = ['#5aa0d8', '#1e4a8a', '#0a1a3a', 'rgba(200,240,255,0.25)', null, 'rgba(220,245,255,0.6)'];
LIQUIDS.np_vault = ['#b85aff', '#5a1a9a', '#24083a', 'rgba(255,220,255,0.25)', '#d88aff', 'rgba(255,230,255,0.5)'];

// a jagged snowy peak
function peak(ctx, x, base, w, h, col, snow, seed) {
  const r = k => Math.sin(seed * 12.9898 + k * 78.233) * 0.5 + 0.5;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w / 2, base);
  const pts = [[-0.5, 0], [-0.3, 0.45 + r(1) * 0.1], [-0.12, 0.8], [0, 1], [0.1, 0.84], [0.22, 0.62 + r(2) * 0.1], [0.36, 0.5], [0.5, 0]];
  for (const [u, v] of pts) ctx.lineTo(x + u * w, base - v * h);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = snow; ctx.beginPath(); ctx.moveTo(x - 0.24 * w, base - 0.62 * h);
  for (const [u, v] of [[-0.12, 0.8], [0, 1], [0.1, 0.84], [0.22, 0.64], [0.16, 0.58], [0.08, 0.66], [0, 0.6], [-0.08, 0.68], [-0.16, 0.6]]) ctx.lineTo(x + u * w, base - v * h);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(120,150,200,0.25)'; ctx.beginPath(); ctx.moveTo(x, base - h); ctx.lineTo(x + 0.1 * w, base - 0.84 * h); ctx.lineTo(x + 0.22 * w, base - 0.62 * h); ctx.lineTo(x + 0.5 * w, base); ctx.lineTo(x + 0.05 * w, base); ctx.closePath(); ctx.fill();
}
// a string of prayer flags far away on a ridge (scenery, drawn with care)
function flagLine(ctx, x0, y0, x1, y1, s) {
  ctx.strokeStyle = 'rgba(80,60,40,0.5)'; ctx.lineWidth = 0.8; const my = Math.max(y0, y1) + 14 * s;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, my, x1, y1); ctx.stroke();
  const n = Math.floor(Math.abs(x1 - x0) / (9 * s));
  for (let k = 1; k < n; k++) { const u = k / n, x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * (x0 + x1) / 2 + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * my + u * u * y1; ctx.fillStyle = FLAGS[k % 5]; ctx.fillRect(x - 2.5 * s, y, 5 * s, 6 * s); }
}

/* ---------------- background painters ---------------- */
const painters = {
  // the great white wall of the Himalaya
  npPeaks(ctx, L, rng, H) {
    let x = -60; let k = 0;
    while (x < BG_W + 60) { const w = 240 + rng() * 220, h = (L.hh || 170) * (0.7 + rng() * 0.45), sd = rng() * 99; wrapDraw(x - w / 2, w, xx => peak(ctx, xx + w / 2, L.base, w, h, shade(L.color, (k % 2) * -0.06), L.snow || '#f4f8ff', sd)); x += w * 0.62; k++; }
  },
  // green terraced hills with little stone houses and rhododendrons; prayer flags far away on the ridges
  npTerraces(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 12) ctx.lineTo(x, L.base - 40 + Math.sin(x / 160) * 26 + Math.sin(x / 53) * 6);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(L.color, -0.15); ctx.lineWidth = 1.2;
    for (let r = 0; r < 6; r++) { ctx.beginPath(); for (let x = 0; x <= BG_W; x += 12) { const y = L.base - 30 + r * 12 + Math.sin(x / 160) * 26 * (1 - r * 0.12) + Math.sin(x / 53) * 5; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    for (let i = 0; i < 9; i++) { const x = rng() * BG_W, y = L.base - 36 + Math.sin(x / 160) * 26; ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x - 7, y - 9, 14, 9); ctx.fillStyle = '#8a3a2a'; ctx.beginPath(); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x, y - 15); ctx.lineTo(x + 9, y - 9); ctx.fill(); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 2, y - 6, 3, 6); }
    for (let i = 0; i < 5; i++) { const x = rng() * BG_W, y = L.base - 60 + Math.sin(x / 160) * 26; flagLine(ctx, x, y - 8, x + 50 + rng() * 40, y - 14 - rng() * 10, 0.7); }
  },
  // rhododendron trees in red bloom
  npRhodo(ctx, L, rng, H) {
    for (let x = 20; x < BG_W; x += 90 + Math.floor(rng() * 80)) {
      const s = 0.8 + rng() * 0.5, blooms = []; for (let k = 0; k < 14; k++) blooms.push([rng() * TAU, rng(), rng() < 0.7 ? '#d8323a' : '#ff6a7a', 7 + rng() * 6]);
      for (const xx of [x, x - BG_W, x + BG_W]) {
        if (xx < -80 || xx > BG_W + 80) continue;
        ctx.strokeStyle = '#4a3428'; ctx.lineWidth = 5 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xx, L.base); ctx.quadraticCurveTo(xx + 6 * s, L.base - 26 * s, xx - 2 * s, L.base - 44 * s); ctx.stroke(); ctx.lineCap = 'butt';
        ctx.fillStyle = '#2e5a2e'; ctx.beginPath(); ctx.ellipse(xx, L.base - 52 * s, 34 * s, 22 * s, 0, 0, TAU); ctx.fill();
        for (const [a, r, c, rad] of blooms) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(xx + Math.cos(a) * 28 * s * r, L.base - 54 * s + Math.sin(a) * 16 * s * r, rad * s * 0.6, 0, TAU); ctx.fill(); }
      }
    }
  },
  // a far monastery on a ridge: whitewashed walls, a gilded roof (scenery only)
  npGompa(ctx, L, rng, H) {
    const x = L.at || 500, b = L.base;
    ctx.fillStyle = shade(L.color, -0.1); ctx.beginPath(); ctx.moveTo(x - 140, H); ctx.quadraticCurveTo(x - 60, b - 40, x, b - 46); ctx.quadraticCurveTo(x + 70, b - 40, x + 150, H); ctx.fill();
    ctx.fillStyle = '#f2ece0'; ctx.fillRect(x - 34, b - 76, 68, 30); ctx.fillStyle = '#8a2a1e'; ctx.fillRect(x - 34, b - 80, 68, 5);
    ctx.fillStyle = '#c8962a'; ctx.beginPath(); ctx.moveTo(x - 20, b - 80); ctx.lineTo(x, b - 94); ctx.lineTo(x + 20, b - 80); ctx.fill();
    ctx.fillStyle = '#3a2a2a'; for (let k = -2; k <= 2; k++) ctx.fillRect(x + k * 12 - 2, b - 68, 4, 7);
    flagLine(ctx, x + 34, b - 74, x + 120, b - 56, 0.8);
  },
  // snowy hummocks in the night storm
  npDrifts(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 10) ctx.lineTo(x, L.base - 20 + Math.sin(x / 90) * 14 + Math.sin(x / 31) * 4);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 10; i++) { const x = rng() * BG_W, y = L.base - 22 + Math.sin(x / 90) * 14; ctx.fillStyle = shade(L.color, -0.25); ctx.beginPath(); ctx.ellipse(x, y + 4, 16 + rng() * 14, 8, 0, Math.PI, TAU); ctx.fill(); }
  },
  // walls of blue glacier ice: seracs and crevasse shadows
  npIceWall(ctx, L, rng, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#bfe4f8'); g.addColorStop(1, L.color);
    ctx.fillStyle = g; ctx.fillRect(0, 0, BG_W, H);
    for (let i = 0; i < 40; i++) { const x = rng() * BG_W, y = rng() * H, w = 30 + rng() * 60, h = 40 + rng() * 120; ctx.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.25)' : 'rgba(40,100,160,0.18)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * 0.6, y - 8); ctx.lineTo(x + w, y + h * 0.3); ctx.lineTo(x + w * 0.7, y + h); ctx.lineTo(x + w * 0.1, y + h * 0.8); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = 'rgba(20,60,120,0.25)'; ctx.lineWidth = 2; for (let i = 0; i < 18; i++) { const x = rng() * BG_W; ctx.beginPath(); ctx.moveTo(x, rng() * H); ctx.lineTo(x + (rng() - 0.5) * 30, rng() * H); ctx.stroke(); }
  },
  // the Baron's fortress: a purple vault lined with shelves of stolen snow globes and his monocle banners
  npVault(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 64) { ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(x, 0, 32, H); }
    for (let x = 30; x < BG_W; x += 300) {
      ctx.fillStyle = '#4a1a8a'; ctx.fillRect(x, 60, 70, 120); ctx.fillStyle = '#ffd84a'; ctx.fillRect(x, 60, 70, 6); ctx.beginPath(); ctx.moveTo(x, 180); ctx.lineTo(x + 35, 196); ctx.lineTo(x + 70, 180); ctx.fill();
      ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 35, 118, 18, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 48, 130); ctx.lineTo(x + 54, 160); ctx.stroke();
    }
    for (const sy of [L.base - 150, L.base - 90]) {
      ctx.fillStyle = '#5a3a7a'; ctx.fillRect(0, sy, BG_W, 6);
      for (let x = 14; x < BG_W; x += 34) { const c = ['#e8b838', '#c8c8d0', '#d8322a', '#3ab0e8', '#5ad04a', '#f4f0e8'][Math.floor(rng() * 6)]; ctx.fillStyle = '#3a2a4a'; ctx.fillRect(x - 8, sy - 6, 16, 6); ctx.fillStyle = 'rgba(210,240,255,0.55)'; ctx.beginPath(); ctx.arc(x, sy - 15, 10, 0, TAU); ctx.fill(); ctx.fillStyle = c; ctx.fillRect(x - 4, sy - 16, 8, 8); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x - 6, sy - 21, 2, 3); }
    }
  }
};
const dyn = {
  // big flakes racing sideways in front of the far layers
  npStorm(ctx, L, camX, oy, S, W, t) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 70; i++) { const x = ((i * 137 - t * (240 + (i % 5) * 60) - camX * L.f) % (W / S + 200) + W / S + 200) % (W / S + 200) * S, y = ((i * 71 + t * (30 + i % 7 * 6)) % 300) * S + oy * 0.2; ctx.beginPath(); ctx.arc(x, y, (1 + (i % 3)) * S, 0, TAU); ctx.fill(); }
  }
};

/* ---------------- tiles ---------------- */
// the item block: a red lacquered box with a golden sunburst
function boxBlock(ctx, th, f) {
  ctx.save(); ctx.shadowColor = 'rgba(255,210,90,0.9)'; ctx.shadowBlur = 4 + f * 1.5;
  const g = ctx.createLinearGradient(0, 0, 0, TS); g.addColorStop(0, '#c8322a'); g.addColorStop(1, '#8a1a12');
  ctx.fillStyle = g; rr(ctx, 1, 1, TS - 2, TS - 2, 4); ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 1.5; rr(ctx, 4, 4, TS - 8, TS - 8, 3); ctx.stroke();
  ctx.fillStyle = '#ffd23a'; ctx.save(); ctx.translate(TS / 2, TS / 2); ctx.rotate(f * 0.1); for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(-2, -5); ctx.lineTo(0, -10); ctx.lineTo(2, -5); ctx.fill(); } ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, TAU); ctx.fill(); ctx.restore();
  const sx = -8 + f * 12; ctx.save(); rr(ctx, 1, 1, TS - 2, TS - 2, 4); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + 5, 0); ctx.lineTo(sx - 5, TS); ctx.lineTo(sx - 10, TS); ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#3a0a06'; ctx.lineWidth = 1.2; rr(ctx, 1, 1, TS - 2, TS - 2, 4); ctx.stroke();
}
function boxUsed(ctx) { ctx.fillStyle = '#5a3020'; rr(ctx, 1, 2, TS - 2, TS - 3, 4); ctx.fill(); ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 1.2; rr(ctx, 1, 2, TS - 2, TS - 3, 4); ctx.stroke(); }
const hillRock = { style: 'npHill', cap: '#6aa84a', capHi: '#a8d86a', dirt: '#7a6a5a', dirt2: '#4a4038', rock: '#9a9088',
  paint(ctx, rng) { for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#8a7e72', '#9a8e80', '#7a7064'][Math.floor(rng() * 3)]; ctx.beginPath(); ctx.ellipse(rng() * TS, rng() * TS, 5 + rng() * 4, 3.5 + rng() * 2, rng(), 0, TAU); ctx.fill(); } ctx.strokeStyle = 'rgba(40,30,20,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, rng() * TS); ctx.lineTo(TS, rng() * TS); ctx.stroke(); },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#5a9a3a'; ctx.fillRect(x0, 0, x1 - x0, 6); ctx.fillStyle = '#a8d86a'; for (let x = x0; x < x1; x += 4) ctx.fillRect(x, 0, 2, 1.5 + ((x * 3) % 3)); }
};
const snowRock = { style: 'npSnowRock', cap: '#f4f8ff', capHi: '#ffffff', dirt: '#7a7e8a', dirt2: '#4a4e5a', rock: '#9aa0aa',
  paint(ctx, rng) { for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#7a7e8a', '#8a8e9a', '#6a6e7a'][Math.floor(rng() * 3)]; ctx.beginPath(); ctx.moveTo(rng() * TS, rng() * TS); ctx.lineTo(rng() * TS, rng() * TS); ctx.lineTo(rng() * TS, rng() * TS); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(rng() * TS, rng() * TS, 4, 2); },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#eef4ff'; ctx.beginPath(); ctx.moveTo(x0, 9); for (let x = x0; x <= x1; x += 6) ctx.lineTo(x, 7 + Math.sin(x * 0.7) * 2); ctx.lineTo(x1, 0); ctx.lineTo(x0, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(160,190,230,0.5)'; ctx.fillRect(x0, 0, x1 - x0, 1.5); }
};
const glacier = { style: 'npGlacier', cap: '#e8f6ff', capHi: '#ffffff', dirt: '#7ab8e0', dirt2: '#3a78b0', rock: '#a8d8f4',
  paint(ctx, rng) { const g = ctx.createLinearGradient(0, 0, TS, TS); g.addColorStop(0, '#9ad0f0'); g.addColorStop(1, '#5a98c8'); ctx.fillStyle = g; ctx.fillRect(0, 0, TS, TS); ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(rng() * TS, 0); ctx.lineTo(rng() * TS, TS); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(rng() * TS, rng() * TS, 6, 2); },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#f4faff'; ctx.fillRect(x0, 0, x1 - x0, 5); ctx.fillStyle = 'rgba(120,180,230,0.5)'; ctx.fillRect(x0, 5, x1 - x0, 1.5); }
};
const marble = { style: 'npMarble', cap: '#ffd84a', capHi: '#fff4b0', dirt: '#5a2a8a', dirt2: '#3a1260', rock: '#7a4aa8',
  paint(ctx, rng) { ctx.fillStyle = '#5a2a8a'; ctx.fillRect(0, 0, TS, TS); ctx.strokeStyle = 'rgba(220,180,255,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); let x = rng() * TS; ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 10, TS / 2, x - 4, TS); ctx.stroke(); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, TS - 2, TS, 2); ctx.fillRect(TS - 2, 0, 2, TS); },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#c8a03a'; ctx.fillRect(x0, 0, x1 - x0, 5); ctx.fillStyle = '#ffe88a'; ctx.fillRect(x0, 0, x1 - x0, 1.5); }
};
const plankSemi = { style: 'plank', c1: '#8a6a4a', c2: '#5a4030' };
const base = {
  brick: { style: 'brick', c1: '#c8bca8', c2: '#8a7e6a', mortar: '#4a4038' }, hard: { c1: '#9a9088', c2: '#5a524a' }, semi: plankSemi,
  pillar: { c1: '#c8322a', c2: '#7a1a12', cap: '#ffd23a', style: 'column' }, accent: COL.a, qblockArt: boxBlock, usedArt: boxUsed, tint: {}, bloom: 0.16
};
const themes = {
  np_hills: Object.assign({}, base, {
    name: 'Suspension Bridges', music: 'tour_np', particles: 'leaves',
    sky: ['#4a90d8', '#a8d4f4', '#f0f8ff'], horizonGlow: '#ffffff',
    celestial: { type: 'sun', x: 0.78, y: 0.12, r: 26, color: '#ffffff', glow: '#fff4d8' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'npPeaks', color: '#8a9ac8', base: 250, hh: 200, f: 0.01, blur: true },
      { kind: 'npTerraces', color: '#7aa85a', base: 320, f: 0.06 },
      { kind: 'npRhodo', color: '#2e5a2e', base: 350, f: 0.14 }
    ],
    fog: '#eef8ff', liquid: 'np_river', ground: hillRock, decor: ['npRhodoBush', 'npStones', 'npMarigolds']
  }),
  np_pass: Object.assign({}, base, {
    name: 'Yak Caravan Pass', music: 'tour_np', particles: 'snow',
    sky: ['#2a6ac8', '#8ac0f0', '#e8f4ff'], horizonGlow: '#ffffff',
    celestial: { type: 'sun', x: 0.2, y: 0.15, r: 24, color: '#ffffff', glow: '#e8f4ff' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'npPeaks', color: '#7a8ab8', base: 260, hh: 230, f: 0.015, blur: true },
      { kind: 'npGompa', color: '#8a94a8', base: 310, f: 0.05, at: 640 },
      { kind: 'npPeaks', color: '#6a7488', base: 330, hh: 120, f: 0.1, snow: '#e8f0fa' }
    ],
    fog: '#f0f8ff', liquid: 'np_crevasse', ground: snowRock, brick: { style: 'brick', c1: '#e8eef8', c2: '#a8b8d0', mortar: '#6a7a98' }, decor: ['npStones', 'npSnowTuft']
  }),
  np_blizzard: Object.assign({}, base, {
    name: 'Blizzard Night', music: 'tour_np_night', particles: 'snow',
    sky: ['#0a1430', '#1a2a50', '#3a4a70'], horizonGlow: '#8aa8d8',
    celestial: { type: 'moon', x: 0.7, y: 0.12, r: 18, color: '#e8f0ff', glow: '#a8c0e8' }, stars: 0.4,
    layers: [
      { kind: 'npPeaks', color: '#2a3a5a', base: 270, hh: 200, f: 0.015, blur: true, snow: '#9aaacc' },
      { kind: 'npDrifts', color: '#5a6a8a', base: 330, f: 0.08, dyn: 'npStorm' }
    ],
    fog: '#a8c0e8', liquid: 'np_crevasse', ground: snowRock, brick: { style: 'brick', c1: '#c8d4e8', c2: '#7a8aa8', mortar: '#3a4a68' }, decor: ['npStones', 'npSnowTuft']
  }),
  np_icefall: Object.assign({}, base, {
    name: 'Khumbu Icefall', music: 'tour_np_ice', particles: 'snow',
    sky: ['#8ac8f0', '#c8e8fa', '#f4fbff'], horizonGlow: '#ffffff', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'npIceWall', color: '#5a98c8', base: 0, f: 0.05 }],
    fog: '#e8f6ff', ground: glacier, hard: { c1: '#a8d8f4', c2: '#5a98c8' }, semi: { style: 'plank', c1: '#c8ccd4', c2: '#8a8e98' }, decor: ['npSnowTuft']
  }),
  np_fortress: Object.assign({}, base, {
    name: "Baron's Fortress", music: 'tour_np_fort', particles: 'motes',
    sky: ['#2a0a4a', '#4a1a6a', '#6a2a8a'], horizonGlow: '#ffd84a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'npVault', color: '#3a1460', base: 340, f: 0.08 }],
    fog: '#b88ad8', liquid: 'np_vault', ground: marble, hard: { c1: '#c8a03a', c2: '#8a6a1a' }, semi: { style: 'plank', c1: '#ffd84a', c2: '#a8801a' },
    brick: { style: 'brick', c1: '#7a4aa8', c2: '#4a1a7a', mortar: '#ffd84a' }, decor: ['npGlobeStand', 'npCrateStack']
  })
};

/* ---------------- decor ---------------- */
const decor = {
  npRhodoBush(ctx, x, y) { ctx.fillStyle = '#2e5a2e'; ctx.beginPath(); ctx.ellipse(x, y - 9, 15, 10, 0, 0, TAU); ctx.fill(); for (const [dx, dy] of [[-8, -12], [2, -16], [9, -9], [-2, -6]]) { ctx.fillStyle = '#d8323a'; ctx.beginPath(); ctx.arc(x + dx, y + dy, 3.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff8a9a'; ctx.beginPath(); ctx.arc(x + dx - 1, y + dy - 1, 1.2, 0, TAU); ctx.fill(); } },
  npStones(ctx, x, y) { for (const [dx, w, h, c] of [[-8, 9, 6, '#8a8680'], [3, 11, 8, '#9a968e'], [12, 6, 4, '#7a766e']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + dx, y - h / 2, w / 2 + 2, h / 2 + 1, 0, 0, TAU); ctx.fill(); } },
  npMarigolds(ctx, x, y) { ctx.strokeStyle = '#3a7a2a'; ctx.lineWidth = 1.4; for (const dx of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.lineTo(x + dx * 1.2, y - 12 - Math.abs(dx)); ctx.stroke(); } for (const dx of [-6, 0, 6]) { ctx.fillStyle = '#ff9a1a'; ctx.beginPath(); ctx.arc(x + dx * 1.2, y - 13 - Math.abs(dx), 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x + dx * 1.2, y - 13 - Math.abs(dx), 2, 0, TAU); ctx.fill(); } },
  npSnowTuft(ctx, x, y) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, y - 3, 14, 5, 0, Math.PI, TAU); ctx.fill(); ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 1.2; for (const dx of [-5, 0, 4]) { ctx.beginPath(); ctx.moveTo(x + dx, y - 3); ctx.lineTo(x + dx + 2, y - 11); ctx.stroke(); } },
  npGlobeStand(ctx, x, y, t, th, d) { ctx.fillStyle = '#ffd84a'; rr(ctx, x - 6, y - 26, 12, 26, 2); ctx.fill(); ctx.fillStyle = '#3a2a4a'; ctx.fillRect(x - 9, y - 32, 18, 6); ctx.fillStyle = 'rgba(210,240,255,0.6)'; ctx.beginPath(); ctx.arc(x, y - 44, 13, 0, TAU); ctx.fill(); ctx.fillStyle = ['#e8b838', '#d8322a', '#3ab0e8'][d.seed % 3]; ctx.fillRect(x - 5, y - 46, 10, 10); ctx.fillStyle = '#ffffff'; for (let k = 0; k < 5; k++) ctx.fillRect(x - 8 + ((t * 8 + k * 4) % 16), y - 54 + k * 3, 1.5, 1.5); },
  npCrateStack(ctx, x, y, t, th, d) { for (const [dx, dy] of [[-12, 0], [10, 0], [-1, -18]]) { ctx.fillStyle = '#a8804a'; ctx.fillRect(x + dx - 9, y + dy - 18, 18, 18); ctx.strokeStyle = '#6a4a24'; ctx.lineWidth = 1.5; ctx.strokeRect(x + dx - 9, y + dy - 18, 18, 18); ctx.beginPath(); ctx.moveTo(x + dx - 9, y + dy - 18); ctx.lineTo(x + dx + 9, y + dy); ctx.stroke(); } },
  // an aluminium ladder laid across a crevasse (its top is a one-way platform)
  npLadder(ctx, x, y, t, th, d) { const x0 = x - d.w / 2, top = y - d.h; ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x0, top, d.w, 3); ctx.fillRect(x0, top + 8, d.w, 3); ctx.fillStyle = '#9aa0aa'; for (let k = 4; k < d.w; k += 10) ctx.fillRect(x0 + k, top, 3, 11); ctx.strokeStyle = 'rgba(200,60,40,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 - 6, top - 14); ctx.quadraticCurveTo(x, top - 4, x0 + d.w + 6, top - 14); ctx.stroke(); }
};
const decorLights = { npGlobeStand: [50, '#d8f0ff', -44] };

/* ---------------- enemies ---------------- */
const momoArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); const sq = m === 'flat' ? 0.4 : m === 'hop' ? 1.08 : 1; ctx.scale(e.dir * (2 - sq), sq);
  const g = ctx.createRadialGradient(-3, -12, 2, 0, -9, 15); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ece2cc');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-13, 0); ctx.quadraticCurveTo(-15, -14, -4, -18); ctx.quadraticCurveTo(0, -24, 4, -18); ctx.quadraticCurveTo(15, -14, 13, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(180,150,110,0.6)'; ctx.lineWidth = 1; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * 1.2, -21); ctx.quadraticCurveTo(k * 4, -15, k * 4.5, -9); ctx.stroke(); }
  if (m !== 'flat' && m !== 'ko') { K.eyes(ctx, 2, -9, 1, 2.6, 1.8, false); ctx.fillStyle = '#ff9aaa'; ctx.beginPath(); ctx.arc(-5, -6, 1.6, 0, TAU); ctx.arc(9, -6, 1.6, 0, TAU); ctx.fill(); }
  ctx.restore();
};
const rotiArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y - 11); const rolling = m === 'roll' || m === 'curl';
  if (rolling) ctx.rotate(e.t * 12 * e.dir); else ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.strokeStyle = '#b8702a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#e8a050'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 8, -2.4, -0.6); ctx.stroke();
  if (!rolling && m !== 'flat' && m !== 'ko') K.eyes(ctx, 3, -8, 1, 2, 1.5, false);
  ctx.restore();
};
// the Himalayan monal: a pheasant in every colour at once
const monalArt = (ctx, e, x, y, m, t) => {
  const f = Math.sin(t * 11 + (e.seed || 0)) * 0.6;
  ctx.save(); ctx.translate(x, y - 8); ctx.scale(e.dir || 1, 1);
  ctx.fillStyle = '#c8501a'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-22, -2); ctx.lineTo(-20, 5); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(-10, -8, 12, 6); g.addColorStop(0, '#2a8a6a'); g.addColorStop(0.5, '#3a5ad8'); g.addColorStop(1, '#8a2ac8');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 13, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2aa88a'; ctx.beginPath(); ctx.arc(10, -5, 5.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8a01a'; ctx.beginPath(); ctx.moveTo(15, -5); ctx.lineTo(20, -3); ctx.lineTo(15, -2); ctx.fill();
  ctx.strokeStyle = '#2aa88a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10, -10); ctx.quadraticCurveTo(12, -16, 15, -15); ctx.stroke();
  ctx.fillStyle = '#5a3ab8'; ctx.save(); ctx.rotate(-f); ctx.beginPath(); ctx.ellipse(-2, -5, 12, 4, -0.4, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(11, -6, 1.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.arc(11.5, -6, 0.8, 0, TAU); ctx.fill();
  ctx.restore();
};
const marmotArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#b8864a'; ctx.beginPath(); ctx.ellipse(0, -12, 10, 13, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8c890'; ctx.beginPath(); ctx.ellipse(2, -10, 6, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#b8864a'; ctx.beginPath(); ctx.arc(2, -25, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.arc(-2, -30, 2.2, 0, TAU); ctx.arc(6, -30, 2.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a2410'; ctx.beginPath(); ctx.arc(7, -24, 1.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(4, -21, 3, 2.5);
  if (m === 'throw') { ctx.fillStyle = '#b8864a'; ctx.beginPath(); ctx.ellipse(8, -22, 3, 6, -0.8, 0, TAU); ctx.fill(); }
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 3, -27, 1, 1.8, 1.3, false);
  ctx.restore();
};
const chough = (ctx, e, x, y, m, t) => {
  const f = Math.sin(t * 13 + (e.seed || 0)) * 0.7;
  ctx.save(); ctx.translate(x, y - 8); ctx.scale(e.dir || 1, 1);
  ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 6, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-18, -3); ctx.lineTo(-17, 4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(9, -3, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(13, -4); ctx.lineTo(20, -1); ctx.lineTo(13, -1); ctx.fill();
  ctx.fillStyle = '#2a2a38'; ctx.save(); ctx.rotate(-f); ctx.beginPath(); ctx.ellipse(-2, -5, 12, 4, -0.4, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(10, -4, 1.5, 0, TAU); ctx.fill();
  ctx.restore();
};
const yetiArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const bob = m === 'walk' ? Math.abs(Math.sin(t * 6)) * 2 : 0;
  ctx.fillStyle = '#e8eef8'; for (const s of [-1, 1]) { rr(ctx, s * 10 - 6, -14, 12, 14, 5); ctx.fill(); }
  ctx.fillStyle = '#f4f8ff'; ctx.beginPath(); ctx.ellipse(0, -30 - bob, 20, 22, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(160,180,210,0.6)'; ctx.lineWidth = 1.2; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(-16 + k * 4.5, -10 - bob); ctx.lineTo(-17 + k * 4.5, -4 - bob); ctx.stroke(); }
  ctx.fillStyle = '#8ab0d8'; ctx.beginPath(); ctx.ellipse(6, -38 - bob, 10, 9, 0, 0, TAU); ctx.fill();
  if (m !== 'flat' && m !== 'ko') { K.eyes(ctx, 7, -41 - bob, 1, 2.6, 2, m === 'throw'); ctx.strokeStyle = '#3a4a6a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(7, -34 - bob, 3, 0.2, Math.PI - 0.2); ctx.stroke(); }
  const arm = m === 'throw' ? -2.4 : 0.3 + Math.sin(t * 6) * 0.2;
  ctx.save(); ctx.translate(14, -34 - bob); ctx.rotate(arm); ctx.fillStyle = '#f4f8ff'; rr(ctx, -5, 0, 10, 20, 5); ctx.fill(); if (m === 'throw') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 22, 6, 0, TAU); ctx.fill(); } ctx.restore();
  ctx.restore();
};
const snowballArt = (ctx, e, x, y, m, t) => { ctx.save(); ctx.translate(x, y - 12); if (m === 'roll' || m === 'curl') ctx.rotate(e.t * 9 * e.dir); ctx.fillStyle = '#f4f8ff'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(160,190,230,0.6)'; ctx.beginPath(); ctx.arc(4, 4, 7, 0, TAU); ctx.fill(); if (m !== 'roll' && m !== 'curl' && m !== 'flat' && m !== 'ko') K.eyes(ctx, 3, -2, e.dir, 2.2, 1.6, false); ctx.restore(); };
// the Baron's goons: wind-up souvenir toys
const tinBotArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const st = m === 'walk' ? Math.sin(t * 10) * 2 : 0;
  ctx.fillStyle = '#5a5a6a'; ctx.fillRect(-7 + st, -8, 5, 8); ctx.fillRect(2 - st, -8, 5, 8);
  ctx.fillStyle = '#9aa0b0'; rr(ctx, -10, -26, 20, 18, 3); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.fillRect(-6, -21, 12, 3); ctx.fillStyle = '#7a2ac8'; ctx.fillRect(-10, -12, 20, 3);
  ctx.fillStyle = '#b8bcc8'; rr(ctx, -8, -40, 16, 13, 3); ctx.fill(); ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(-3, -34, 2, 0, TAU); ctx.arc(4, -34, 2, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(0, -45); ctx.stroke(); ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(0, -46, 2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c8c8d0'; ctx.save(); ctx.translate(-11, -18); ctx.rotate(t * 6); ctx.fillRect(-1, -5, 2, 10); ctx.beginPath(); ctx.ellipse(0, -6, 4, 2, 0, 0, TAU); ctx.ellipse(0, 6, 4, 2, 0, 0, TAU); ctx.fill(); ctx.restore();
  ctx.restore();
};
const bobbleArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); const sq = m === 'flat' ? 0.4 : 1; ctx.scale(e.dir, sq);
  ctx.fillStyle = '#ffd84a'; rr(ctx, -9, -6, 18, 6, 2); ctx.fill(); ctx.fillStyle = '#7a2ac8'; rr(ctx, -6, -20, 12, 14, 3); ctx.fill();
  const wob = Math.sin(t * 14) * 0.25; ctx.save(); ctx.translate(0, -22); ctx.rotate(wob); ctx.fillStyle = '#c8c8d0'; ctx.fillRect(-1, -4, 2, 4); ctx.fillStyle = '#f2c8a8'; ctx.beginPath(); ctx.arc(0, -14, 12, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.fillRect(-9, -27, 18, 4); rr(ctx, -6, -36, 12, 10, 2); ctx.fill();
  if (m !== 'flat' && m !== 'ko') { K.eyes(ctx, 2, -15, 1, 2.6, 1.8, false); ctx.strokeStyle = '#3a1a1a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(2, -9, 3, 0.2, Math.PI - 0.2); ctx.stroke(); }
  ctx.restore(); ctx.restore();
};
const globeArt = (ctx, e, x, y, m, t) => { ctx.save(); ctx.translate(x, y - 12); const rolling = m === 'roll' || m === 'curl'; if (rolling) ctx.rotate(e.t * 10 * e.dir); ctx.fillStyle = 'rgba(210,240,255,0.8)'; ctx.beginPath(); ctx.arc(0, -2, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8b838'; ctx.fillRect(-4, -4, 8, 8); ctx.fillStyle = '#7a2ac8'; ctx.fillRect(-9, 6, 18, 5); ctx.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) ctx.fillRect(-6 + ((t * 9 + k * 4) % 12), -10 + k * 3, 1.5, 1.5); if (!rolling && m !== 'flat' && m !== 'ko') K.eyes(ctx, 2, -4, e.dir, 2, 1.5, true); ctx.restore(); };
const pebbleArt = (ctx, s, t) => { ctx.fillStyle = '#8a8680'; ctx.beginPath(); ctx.arc(s.cx, s.cy, 5, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(s.cx - 2, s.cy - 3, 2, 2); };
const snowShotArt = (ctx, s, t) => { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(s.cx, s.cy, 8, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(160,190,230,0.6)'; ctx.beginPath(); ctx.arc(s.cx + 2, s.cy + 2, 4, 0, TAU); ctx.fill(); };
const enemies = {
  npMomo: { cls: TourEnemy.make({ w: 26, h: 22, speed: 1.0, behavior: 'hop', hopV: 9.5, hopEvery: 1.3, art: momoArt, burst: '#ffffff' }), place: 'walk' },
  npRoti: { cls: TourEnemy.make({ w: 24, h: 22, speed: 0.8, behavior: 'roll', range: 8, rollSpeed: 6.4, rollT: 2.4, art: rotiArt, burst: '#e8a050' }), place: 'walk' },
  npMonal: { cls: TourFlyer.make({ w: 30, h: 16, range: 3, speed: 1.1, swoop: true, art: monalArt, burst: '#3a5ad8' }), place: 'fly' },
  npMarmot: { cls: TourEnemy.make({ w: 22, h: 30, speed: 0.6, behavior: 'throw', range: 9, every: 2.4, art: marmotArt, burst: '#b8864a', shoot: (e, p) => { tourFire(e.g, e.cx + e.dir * 10, e.y + 6, { kind: 'pebble', vx: e.dir * 5 * TS, vy: -6 * TS, grav: PHYS.gDown * 0.4, w: 10, h: 10, life: 3, thru: true, col: '#8a8680', art: pebbleArt }); K.say(e.g, e, 'EEEEP!', '#ffffff'); } }), place: 'walk' },
  npChough: { cls: TourFlyer.make({ w: 28, h: 14, range: 2.5, speed: 1.3, swoop: true, art: chough, burst: '#1a1a24' }), place: 'fly' },
  npYeti: { cls: TourEnemy.make({ w: 40, h: 54, speed: 0.7, hp: 2, behavior: 'throw', pace: true, range: 10, every: 2.2, art: yetiArt, burst: '#f4f8ff', onHurt: e => K.say(e.g, e, 'OOF! *FLUFF*', '#e8f0ff'), shoot: (e, p) => { tourFire(e.g, e.cx + e.dir * 18, e.y + 10, { kind: 'snowball', vx: e.dir * 6 * TS, vy: -5 * TS, grav: PHYS.gDown * 0.35, w: 16, h: 16, life: 3, thru: true, stompable: true, col: '#ffffff', art: snowShotArt }); } }), place: 'walk' },
  npSnowball: { cls: TourEnemy.make({ w: 24, h: 24, speed: 0.8, behavior: 'roll', range: 9, rollSpeed: 7, rollT: 2.8, art: snowballArt, burst: '#ffffff' }), place: 'walk' },
  npTinBot: { cls: TourEnemy.make({ w: 22, h: 46, speed: 1.1, behavior: 'walk', art: tinBotArt, burst: '#9aa0b0' }), place: 'walk' },
  npBobble: { cls: TourEnemy.make({ w: 24, h: 36, inkPad: 10, speed: 1.0, behavior: 'hop', hopV: 10, hopEvery: 1.2, art: bobbleArt, burst: '#7a2ac8' }), place: 'walk' },
  npGlobe: { cls: TourEnemy.make({ w: 24, h: 26, speed: 0.8, behavior: 'roll', range: 8, rollSpeed: 6.8, rollT: 2.4, art: globeArt, burst: '#bfe8ff' }), place: 'walk' }
};

/* ---------------- the yak: ride it up the stairways, charge through snow walls ---------------- */
const yakArt = (ctx, x, y, d, t, run, charge) => {
  // y = the ground under Brady; the shaggy coat hangs almost to the ground
  ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
  const bob = run ? Math.abs(Math.sin(t * (charge ? 22 : 12))) * 2 : 0;
  ctx.fillStyle = '#2a1e18'; for (const lx of [-16, -8, 8, 16]) { const st = run ? Math.sin(t * (charge ? 22 : 12) + lx) * 3 : 0; rr(ctx, lx - 3 + st, -8, 6, 8, 2); ctx.fill(); }
  ctx.fillStyle = '#4a3428'; ctx.beginPath(); ctx.ellipse(-2, -22 - bob, 26, 14, 0, 0, TAU); ctx.fill();
  // the long fringe of fur
  ctx.fillStyle = '#3a2820'; ctx.beginPath(); ctx.moveTo(-28, -22 - bob); for (let k = 0; k <= 12; k++) ctx.lineTo(-28 + k * 4.6, -6 + (k % 2 ? 2 : -1) + Math.sin(t * 8 + k) * (run ? 1.5 : 0.5)); ctx.lineTo(24, -22 - bob); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6a4a38'; ctx.beginPath(); ctx.ellipse(-6, -30 - bob, 14, 5, -0.1, 0, TAU); ctx.fill();
  // a colourful woven saddle blanket and a bell
  ctx.fillStyle = '#c8322a'; rr(ctx, -12, -36 - bob, 20, 10, 2); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(-12, -32 - bob, 20, 2); ctx.fillStyle = '#2a6ad8'; ctx.fillRect(-12, -29 - bob, 20, 2);
  // head with horns
  ctx.fillStyle = '#3a2820'; ctx.beginPath(); ctx.ellipse(24, -22 - bob, 9, 10, 0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f2ece0'; ctx.beginPath(); ctx.ellipse(28, -20 - bob, 4, 6, 0.3, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(20, -29 - bob); ctx.quadraticCurveTo(14, -40 - bob, 22, -42 - bob); ctx.moveTo(26, -29 - bob); ctx.quadraticCurveTo(34, -40 - bob, 28, -43 - bob); ctx.stroke(); ctx.lineCap = 'butt';
  ctx.fillStyle = '#1a1010'; ctx.beginPath(); ctx.arc(27, -24 - bob, 1.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(31, -16 - bob, 1.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(20, -10 - bob, 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8322a'; ctx.fillRect(18, -16 - bob, 4, 3);
  ctx.strokeStyle = '#3a2820'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-27, -24 - bob); ctx.quadraticCurveTo(-36, -20, -33, -10 + Math.sin(t * 5) * 2); ctx.stroke();
  ctx.restore();
  if (charge) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - d * (34 + k * 6), y - 10 - k * 7); ctx.lineTo(x - d * (54 + k * 8), y - 10 - k * 7); ctx.stroke(); } }
};
const power = {
  id: 'yak', name: 'YAK RIDE', country: 'np', hint: 'THROW: CHARGE · SMASH SNOW WALLS', time: 0, cooldown: 0.9,
  speedMul: 1.2,
  icon(ctx, x, y, t) { ctx.save(); ctx.translate(x, y + 9); ctx.scale(0.42, 0.42); yakArt(ctx, 0, 0, 1, t, false, false); ctx.restore(); },
  action(p, g) { if (p._charge > 0) return false; p._charge = 0.7; p._chargeDir = p.facing; Sound.play('stomp', { pitch: 0.6, vol: 0.5 }); K.say(g, p, 'HRUMPH!', '#ffd84a'); return true; },
  update(p, dt, inp, g) {
    const A = g.area;
    // the yak walks straight up one-tile steps
    const d = p._charge > 0 ? p._chargeDir : inp.right ? 1 : inp.left ? -1 : 0;
    if (d && p.onGround) {
      const fx = d > 0 ? p.x + p.w + 2 : p.x - 2, tx = Math.floor(fx / TS), ty = Math.floor((p.y + p.h - 2) / TS), cx0 = Math.floor(p.x / TS), cx1 = Math.floor((p.x + p.w - 1) / TS);
      const clear = (x, y0, y1) => { for (let y = y0; y <= y1; y++) if (SOLID[tileAt(A, x, y)]) return false; return true; };
      if (SOLID[tileAt(A, tx, ty)] && clear(tx, ty - Math.ceil(p.h / TS), ty - 1) && clear(cx0, ty - Math.ceil(p.h / TS), ty - Math.ceil(p.h / TS)) && clear(cx1, ty - Math.ceil(p.h / TS), ty - Math.ceil(p.h / TS))) { p.y = ty * TS - p.h; p.vy = 0; p.x += d * 2; }
    }
    if (p._charge > 0) {
      p._charge -= dt; p.facing = p._chargeDir; p.pushX = (p.pushX || 0) + p._chargeDir * 8 * TS;
      if (Math.random() < 0.5) g.burst(p.cx - p._chargeDir * 20, p.y + p.h, 2, '#e8e0d0', 'dust');
      const box = { x: p._chargeDir > 0 ? p.x + p.w - 4 : p.x - 26, y: p.y + 4, w: 30, h: p.h - 4 };
      for (const e of g.entities) {
        if (e.remove || e.dead || !overlap(box, e)) continue;
        if (e.snowWall) { e.smash(p); continue; }
        if (e.boss) { if (e.brain.onCharge) e.brain.onCharge(e, p); continue; }
        if (e.enemy && !(e instanceof Shot) && !e.friendT) { if (e.hit('disc', p)) { g.addScore(200, e.cx, e.y); g.burst(e.cx, e.cy, 8, '#ffd84a', 'spark'); Sound.play('kick', { pitch: 0.9, vol: 0.5 }); } }
        else if (e instanceof Shot && e.enemy) e.pop();
      }
    }
  },
  drawOn(p, ctx, t) {
    // the yak, then Brady again sitting up on its saddle (the walking Brady underneath is hidden by the yak)
    yakArt(ctx, p.cx, p.y + p.h + 1, p.facing, t, p.onGround && Math.abs(p.vx) > 30, p._charge > 0);
    drawBrady(ctx, { x: p.cx - p.facing * 3, y: p.y + p.h - 27, facing: p.facing, small: p.small, power: p.power, anim: { state: p.onGround ? 'idle' : 'jump', t: p.anim.t, phase: 0 }, hair: p.hair, look: Save.data.look, time: t, held: 'joint' });
  }
};

/* ---------------- entities ---------------- */
// a little yak pen: the yak inside is happy to carry Brady for a while
class NpPen extends Ent {
  constructor(g, s) { super(g, s, 56, 40); this.cfg = NpPen.cfg; this.cool = 0; }
  update(dt) { this.t += dt; if (this.cool > 0) this.cool -= dt; }
  touchPlayer(p) { if (this.cool > 0 || p.dead || (p.sig && p.sig.id === 'yak')) return; this.cool = 1.5; K.say(this.g, this, 'HRUMPH! (HOP ON)', '#ffd84a'); TourKit.sfx('gift', 'appear'); p.collect('sig:yak'); }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, has = this.g.player && this.g.player.sig && this.g.player.sig.id === 'yak';
    // pre-rendered art (sprite 'pen': idle = the yak in its pen, wave = the empty pen once Brady rides it); procedural below is the fallback
    if (TourSprite.of(this) && TourSprite.draw(ctx, this, x, y, has ? 'wave' : 'idle', TourSprite.FALLBACK.friend)) return;
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3; for (const dx of [-28, -10, 10, 28]) { ctx.beginPath(); ctx.moveTo(x + dx, y); ctx.lineTo(x + dx, y - 22); ctx.stroke(); } for (const dy of [-8, -18]) { ctx.beginPath(); ctx.moveTo(x - 30, y + dy); ctx.lineTo(x + 30, y + dy); ctx.stroke(); }
    if (!has) yakArt(ctx, x, y, 1, this.t * 0.4, false, false);
    else { ctx.fillStyle = '#c8a05a'; ctx.beginPath(); ctx.ellipse(x, y - 4, 16, 5, 0, 0, TAU); ctx.fill(); }
  }
}
// a static cfg so 30_tour_sprites.js names its pre-rendered art ('pen/idle', 'pen_wave_000')
NpPen.cfg = { w: 56, h: 40 };
// a wall of packed snow: only a charging yak gets through (its tiles are put in place at runtime)
class NpSnowWall extends Ent {
  constructor(g, s) {
    super(g, s, (s.w || 2) * TS, (s.h || 3) * TS); this.snowWall = true; this.look = s.look || 'snow'; this.tx = Math.floor(s.x / TS); this.ty1 = Math.floor((s.y - 1) / TS); this.ty0 = this.ty1 - (s.h || 3) + 1; this.tw = s.w || 2;
    this.x = this.tx * TS; this.y = this.ty0 * TS; this.broken = false; this.told = false;
    const A = g.area; for (let y = this.ty0; y <= this.ty1; y++) for (let x = this.tx; x < this.tx + this.tw; x++) { A.tiles[y * A.W + x] = T.HARD; A.hide[y * A.W + x] = 1; }
  }
  smash(p) {
    if (this.broken) return; this.broken = true; this.remove = true; const g = this.g, A = g.area;
    for (let y = this.ty0; y <= this.ty1; y++) for (let x = this.tx; x < this.tx + this.tw; x++) { A.tiles[y * A.W + x] = T.EMPTY; A.hide[y * A.W + x] = 0; }
    g.shake(6); Sound.play('break', { pitch: this.look === 'crates' ? 0.8 : 0.6, vol: 0.7 }); g.burst(this.cx, this.cy, 30, this.look === 'crates' ? '#a8804a' : '#ffffff', 'dust'); g.addScore(300, this.cx, this.y);
  }
  update(dt) { this.t += dt; const p = this.g.player; if (!this.told && p && Math.abs(p.cx - this.cx) < 4 * TS) { this.told = true; if (!(p.sig && p.sig.id === 'yak') && !this.g._npWallTold) { this.g._npWallTold = true; this.g.toast('ONLY A CHARGING YAK GETS THROUGH THAT'); } } }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h;
    if (this.look === 'crates') { for (let r = 0; r < h / TS; r++) for (let c = 0; c < w / TS; c++) { const cx = x + c * TS, cy = y + r * TS; ctx.fillStyle = (r + c) % 2 ? '#a8804a' : '#b88e54'; ctx.fillRect(cx + 1, cy + 1, TS - 2, TS - 2); ctx.strokeStyle = '#6a4a24'; ctx.lineWidth = 2; ctx.strokeRect(cx + 2, cy + 2, TS - 4, TS - 4); ctx.beginPath(); ctx.moveTo(cx + 2, cy + 2); ctx.lineTo(cx + TS - 2, cy + TS - 2); ctx.stroke(); ctx.fillStyle = '#7a2ac8'; ctx.fillRect(cx + 10, cy + 12, 12, 6); } return; }
    const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#e8f0fa'); g.addColorStop(1, '#c8d8ec');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + 10); ctx.quadraticCurveTo(x + w / 2, y - 8, x + w, y + 8); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(140,170,210,0.6)'; ctx.lineWidth = 1.2; for (let k = 1; k < h / 12; k++) { ctx.beginPath(); ctx.moveTo(x + 3, y + k * 12); ctx.lineTo(x + w - 3, y + k * 12 + 3); ctx.stroke(); }
    ctx.fillStyle = 'rgba(200,230,255,0.8)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + 6 + k * 14, y + 10); ctx.lineTo(x + 9 + k * 14, y + 22 + (k % 2) * 6); ctx.lineTo(x + 12 + k * 14, y + 10); ctx.fill(); }
  }
}
// a suspension bridge: a row of planks hanging from two cables. It sags in the middle, and dips where Brady stands
class NpBridge extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.x0 = s.x0 * TS; this.n = s.n; this.y0 = s.y; this.holes = s.holes || []; this.sag = 14 + s.n * 2.2; this.dip = 0; this.px = 0;
    this.x = this.x0 - 20; this.w = this.n * TS + 40; this.y = this.y0 - 80; this.h = 140;
    this.planks = []; const list = (g.area && g.area.entities) || g.entities;
    for (let i = 0; i < this.n; i++) { if (this.holes.indexOf(i) >= 0) continue; const pl = new NpPlank(g, this, i); this.planks.push(pl); list.push(pl); }
  }
  // the end planks sit level with the ledges; the middle sags, and dips under Brady
  yAt(xp) { const u = clamp((xp - this.x0 - TS / 2) / ((this.n - 1) * TS), 0, 1), arc = Math.sin(u * Math.PI); return this.y0 + arc * (this.sag + this.dip * Math.exp(-(((xp - this.px) / 70) ** 2)) + Math.sin(this.t * 1.6 + u * 4) * 1.2); }
  update(dt) {
    this.t += dt; const p = this.g.player, on = p && this.planks.indexOf(p.ride) >= 0;
    this.dip = approach(this.dip, on ? 22 : 0, dt * 90); if (on) this.px = approach(this.px, p.cx, dt * 600);
    // the planks step up and down along the curve: keep Brady's feet on the plank under him as he walks
    if (p && !p.dead && p.vy >= 0) {
      const i = Math.floor((p.cx - this.x0) / TS), pl = this.planks.find(q => q.i === i);
      if (pl && Math.abs(p.y + p.h - pl.y) < (on ? 26 : 8)) { p.y = pl.y - p.h - (pl.dy || 0); p.vy = 0; p.onGround = true; p.ride = pl; }
    }
  }
  draw(ctx) {
    const x0 = this.x0, x1 = this.x0 + this.n * TS;
    for (const off of [-30, -26]) { ctx.strokeStyle = off === -30 ? '#5a4030' : '#8a6a4a'; ctx.lineWidth = off === -30 ? 2.5 : 1.5; ctx.beginPath(); ctx.moveTo(x0 - 6, this.y0 + off); for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, this.yAt(x) + off); ctx.lineTo(x1 + 6, this.y0 + off); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(90,64,48,0.8)'; ctx.lineWidth = 1; for (let x = x0 + 16; x < x1; x += 32) { const y = this.yAt(x); ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x, y); ctx.stroke(); }
    for (const px of [x0 - 8, x1 + 2]) { ctx.fillStyle = '#5a4030'; ctx.fillRect(px, this.y0 - 40, 6, 40); ctx.fillStyle = '#7a5a40'; ctx.fillRect(px - 2, this.y0 - 44, 10, 6); }
  }
}
class NpPlank extends Ent {
  constructor(g, br, i) { super(g, null, TS, 8); this.br = br; this.i = i; this.isPlatform = true; this.dx = 0; this.dy = 0; this.x = br.x0 + i * TS; this.y = br.yAt(this.x + TS / 2); }
  update(dt) { const oy = this.y; this.y = this.br.yAt(this.x + TS / 2); this.dy = this.y - oy; }
  draw(ctx) { ctx.fillStyle = this.i % 2 ? '#9a7a54' : '#8a6a46'; rr(ctx, this.x + 1, this.y, TS - 2, 7, 2); ctx.fill(); ctx.fillStyle = 'rgba(255,230,190,0.3)'; ctx.fillRect(this.x + 2, this.y, TS - 4, 1.5); }
}
// the blizzard: gusts blow Brady back (unless he's sheltering in the lee of a boulder) and white everything out
class NpBlizzard extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; this.k = 3; this.gust = 0; this.state = 'calm'; this.told = false; this.shelter = false; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player; if (!p) return;
    this.x = g.camX; this.y = g.camY; this.w = Game.viewW; this.h = Game.viewH;
    this.k -= dt;
    if (this.state === 'calm') { this.gust = Math.max(0, this.gust - dt * 2); if (this.k <= 0) { this.state = 'warn'; this.k = 1; Sound.play('wind', { vol: 0.3, pitch: 1.3 }); } }
    else if (this.state === 'warn') { this.gust = Math.min(0.25, this.gust + dt * 0.3); if (this.k <= 0) { this.state = 'gust'; this.k = 2.6; Sound.play('wind', { vol: 0.6, pitch: 0.8 }); if (!this.told) { this.told = true; g.toast('WHITE-OUT! SHELTER BEHIND A BOULDER'); } } }
    else { this.gust = Math.min(1, this.gust + dt * 2.5); if (this.k <= 0) { this.state = 'calm'; this.k = 3.4; } }
    // sheltered: a rock right in front of Brady (upwind) takes the wind
    const A = g.area, ty0 = Math.floor(p.y / TS), ty1 = Math.floor((p.y + p.h - 2) / TS), tx = Math.floor(p.cx / TS); let sh = false;
    for (let x = tx + 1; x <= tx + 3 && !sh; x++) for (let y = ty0; y <= ty1; y++) if (SOLID[tileAt(A, x, y)]) { sh = true; break; }
    this.shelter = sh;
    if (!sh && this.gust > 0.3 && !p.dead) g.windForce = -4.6 * TS * this.gust;
    g.dustLevel = 0;
  }
  draw(ctx) {
    const a = this.gust * (this.shelter ? 0.35 : 0.6); if (a < 0.02) return;
    const x = this.g.camX, y = this.g.camY, W = Game.viewW, H = Game.viewH;
    ctx.fillStyle = `rgba(235,242,255,${a})`; ctx.fillRect(x, y, W, H);
    ctx.strokeStyle = `rgba(255,255,255,${Math.min(0.9, a * 1.4)})`; ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) { const sx = x + ((i * 211 - this.t * 1100) % (W + 300) + W + 300) % (W + 300) - 150, sy = y + ((i * 97 + this.t * 60) % H); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 90, sy - 8); ctx.stroke(); }
  }
}
// an icicle under a ledge: it shivers when Brady passes beneath, then drops
class NpIcicle extends Ent {
  constructor(g, s) { super(g, s, 14, 30); this.x = s.x - 7; this.hy = s.y - TS; this.y = this.hy; this.state = 'hang'; this.k = 0; this.vy = 0; }
  update(dt) {
    this.t += dt; const p = this.g.player;
    if (this.state === 'hang') { if (p && Math.abs(p.cx - this.cx) < 1.6 * TS && p.y > this.y && p.y - this.y < 9 * TS) { this.state = 'shake'; this.k = 0.5; Sound.play('crumble', { pitch: 2, vol: 0.3 }); } }
    else if (this.state === 'shake') { this.k -= dt; if (this.k <= 0) { this.state = 'fall'; this.vy = 0; } }
    else if (this.state === 'fall') { this.vy += PHYS.gDown * 0.7 * dt; this.y += this.vy * dt; const t = tileAt(this.g.area, Math.floor(this.cx / TS), Math.floor((this.y + this.h) / TS)); if (SOLID[t] || t === T.SEMI || this.y > this.hy + 14 * TS) { this.g.burst(this.cx, this.y + this.h, 10, '#d8f0ff', 'spark'); Sound.play('break', { pitch: 1.8, vol: 0.35 }); this.state = 'gone'; this.k = 3.5; } }
    else { this.k -= dt; if (this.k <= 0) { this.state = 'hang'; this.y = this.hy; } }
  }
  touchPlayer(p) { if (this.state === 'fall') p.hurt(this); }
  draw(ctx) {
    if (this.state === 'gone') { const k = 1 - this.k / 3.5; if (k > 0.7) { ctx.globalAlpha = (k - 0.7) / 0.3; } else return; }
    const x = this.cx + (this.state === 'shake' ? Math.sin(this.t * 60) * 1.5 : 0), y = this.state === 'gone' ? this.hy : this.y;
    const g = ctx.createLinearGradient(x - 7, 0, x + 7, 0); g.addColorStop(0, '#e8f8ff'); g.addColorStop(1, '#8ac8f0');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.lineTo(x + 1, y + 30); ctx.lineTo(x - 1, y + 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x - 4, y + 2, 2, 14); ctx.globalAlpha = 1;
  }
}
// a shrink-ray security camera: its beam sweeps the hall; caught in it for a moment, FLASH: big Brady goes small
class NpCamera extends Ent {
  constructor(g, s) { super(g, s, 26, 18); this.x = s.x - 13; this.y = (s.top != null ? s.top : 0) * TS; this.range = (s.range || 7) * TS; this.ph = s.phase || 0; this.lock = 0; this.cool = 0; this.flashT = 0; this.ang = 0; }
  update(dt) {
    this.t += dt; if (this.cool > 0) this.cool -= dt; if (this.flashT > 0) this.flashT -= dt;
    this.ang = Math.PI / 2 + Math.sin(this.t * 0.9 + this.ph) * 0.75;
    const p = this.g.player; if (!p || p.dead || this.cool > 0) { this.lock = 0; return; }
    const dx = p.cx - this.cx, dy = p.cy - (this.y + 14), d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    const inBeam = d < this.range && Math.abs(Math.atan2(Math.sin(a - this.ang), Math.cos(a - this.ang))) < 0.2;
    this.lock = inBeam ? this.lock + dt : Math.max(0, this.lock - dt * 2);
    if (this.lock > 0.35) {
      this.lock = 0; this.cool = 2.2; this.flashT = 0.4; this.g.flash = Math.max(this.g.flash || 0, 0.6); TourKit.sfx('camera_flash', 'laser', { vol: 0.5 });
      if (!p.small) { p.hurt(this); K.say(this.g, p, 'SHRUNK!', '#8af0ff'); }
      else { p.vx = sign(dx || 1) * 4 * TS; p.vy = -6 * TS; K.say(this.g, p, 'TOO SMALL TO SHRINK!', '#8af0ff'); }
    }
  }
  draw(ctx) {
    const x = this.cx, y = this.y + 10, a = this.ang;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const L = this.range, sp = 0.2, hot = this.lock > 0.05;
    ctx.fillStyle = hot ? `rgba(255,120,200,${0.18 + this.lock * 0.4})` : 'rgba(140,240,255,0.13)';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a - sp) * L, y + Math.sin(a - sp) * L); ctx.lineTo(x + Math.cos(a + sp) * L, y + Math.sin(a + sp) * L); ctx.closePath(); ctx.fill();
    if (this.flashT > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flashT * 1.5})`; ctx.beginPath(); ctx.arc(x, y, 40 + (0.4 - this.flashT) * 200, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#3a3a4a'; ctx.fillRect(x - 2, this.y - 6, 4, 8);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = '#5a5a6a'; rr(ctx, -10, -8, 24, 16, 4); ctx.fill(); ctx.fillStyle = '#7a2ac8'; ctx.fillRect(-10, -8, 24, 4); ctx.fillStyle = hot ? '#ff5ac8' : '#8af0ff'; ctx.beginPath(); ctx.arc(14, 0, 5, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = Math.sin(this.t * 6) > 0 ? '#ff3a3a' : '#5a1a1a'; ctx.beginPath(); ctx.arc(x - 7, this.y + 2, 2, 0, TAU); ctx.fill();
  }
  get light() { return { r: 40, c: 'rgba(140,240,255,', x: this.cx, y: this.y + 10 }; }
}
const entities = { npPen: NpPen, npSnowWall: NpSnowWall, npBridge: NpBridge, npBlizzard: NpBlizzard, npIcicle: NpIcicle, npCamera: NpCamera };

/* ---------------- set pieces ---------------- */
const pond = (st, x0, x1, row) => { st.pit(x0, x1); st.B.fill(x0, row, x1, st.H - 1, T.LAVA); };
const P = {
  // a yak pen
  pen(st, o) { const x = st.x; st.floor(x, x + 6); st.spawn('npPen', x + 3, st.gy - 1, {}); if (o.first) st.sign(x + 6, 'A yak! It walks right up stone steps. THROW to charge: it smashes through snow walls.'); return x + 7; },
  // checkpoints come with a yak pen
  cp(st, o) { if (st.mode === 'climb') return Tour.pieces.cp(st, o); const x0 = st.x, x = Tour.pieces.cp(st, o); st.spawn('npPen', x0 + 1, st.gy - 1, {}); return x; },
  // the blizzard's controller (place first)
  storm(st) { st.spawn('npBlizzard', st.x, st.gy - 1, {}); return st.x; },

  /* 12-1: suspension bridges */
  terrace(st, o) { let x = st.x; for (let k = 0; k < 3; k++) { st.floor(x, x + 2); if (k === 1) st.decor('npRhodoBush', x + 1); x += 3; st.gy -= 1; } st.floor(x, x + 3); st.block(x + 1, st.gy - 4, o.item || 'power'); st.coins(x, x + 3, st.gy - 2); st.enemy('npMomo', x + 3, st.gy); x += 4; for (let k = 0; k < 3; k++) { st.gy += 1; st.floor(x, x + 1); x += 2; } if (o.gold) st.gold(x - 8, st.gy - 9, 'hidden'); return x; },
  bridge(st, o) {
    const B = st.B, n = o.n || 10, holes = o.holes || []; let x = st.x; st.floor(x, x + 2); st.decor('npMarigolds', x + 1); x += 3;
    pond(st, x, x + n - 1, st.H - 2);
    st.spawn('npBridge', x, st.gy - 1, { x0: x, n, holes });
    for (let i = 0; i < n; i++) if (holes.indexOf(i) < 0) B.ghosts.push([x + i, st.gy]);
    st.coins(x + 1, x + n - 2, st.gy - 3);
    if (o.monal || n >= 12) st.enemy('npMonal', x + Math.floor(n / 2), st.gy);
    if (o.gold) st.gold(x + Math.floor(n / 2), st.gy - 3, 'risky');
    x += n; st.floor(x, x + 2); st.decor('npStones', x + 1);
    return x + 3;
  },
  momos(st, o) { const x = st.x; st.floor(x, x + 12); st.semi(x + 4, x + 7, st.gy - 3); st.coins(x + 4, x + 7, st.gy - 5); st.enemy('npMomo', x + 5, st.gy); st.enemy('npRoti', x + 10, st.gy); st.decor('npMarigolds', x + 1); return x + 13; },

  /* 12-2: the pass */
  // stone steps up (or down) the mountainside: the yak strides straight up them
  slope(st, o) { let x = st.x; const n = o.n || 6, up = !o.down; for (let k = 0; k < n; k++) { st.floor(x, x + 1); x += 2; st.gy = clamp(st.gy + (up ? -1 : 1), st.gyMin, st.gyMax); } st.floor(x, x + 3); st.coins(x, x + 3, st.gy - 2); if (o.gold) st.gold(x + 2, st.gy - 4, 'high'); st.enemy(o.enemy || 'npSnowball', x + 3, st.gy); return x + 4; },
  // a gully choked with packed snow (or a wall of the Baron's crates): a yak pen just before it
  snowwall(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 10);
    if (o.pen !== false) st.spawn('npPen', x + 2, st.gy - 1, {});
    B.fill(x + 6, 0, x + 7, st.gy - 6, o.look === 'crates' ? T.HARD : T.GROUND);
    st.spawn('npSnowWall', x + 6, st.gy - 1, { w: 2, h: 5, look: o.look || 'snow' });
    st.coins(x + 8, x + 10, st.gy - 2);
    if (o.first) st.sign(x + 4, 'Packed snow! Ride the yak and THROW to charge straight through.');
    return x + 11;
  },
  marmots(st, o) { const x = st.x; st.floor(x, x + 13); st.decor('npStones', x + 3); st.decor('npStones', x + 9); st.enemy('npMarmot', x + 4, st.gy); st.enemy('npMarmot', x + 10, st.gy); st.semi(x + 6, x + 8, st.gy - 3); st.coins(x + 6, x + 8, st.gy - 5); if (o.gold) st.gold(x + 7, st.gy - 7, 'high'); return x + 14; },
  icy(st, o) { const x = st.x, B = st.B, n = 12; st.floor(x, x + n - 1); for (let c = x + 1; c < x + n - 1; c++) B.set(c, st.gy, T.ICE); st.enemy('npSnowball', x + n - 2, st.gy); st.coins(x + 2, x + n - 3, st.gy - 2); return x + n; },

  /* 12-3: the blizzard */
  // open snowfield: boulders to shelter behind, crevasses to cross between gusts
  shelter(st, o) {
    let x = st.x; const B = st.B, n = o.n || 2; st.floor(x, x + 2); x += 3;
    for (let k = 0; k < n; k++) {
      // shelter in the boulder's lee (left of it), then hop it and take the crevasse in a lull
      st.floor(x, x + 4); B.fill(x + 1, st.gy - 2, x + 2, st.gy - 1, T.GROUND); st.decor('npSnowTuft', x + 4); x += 5;
      const w = 3; pond(st, x, x + w - 1, st.gy + 1); st.coins(x, x + w - 1, st.gy - 2); x += w;
    }
    st.floor(x, x + 3); if (o.gold) st.gold(x - 2, st.gy - 3, 'risky'); return x + 4;
  },
  yeti(st, o) { const x = st.x, B = st.B; st.floor(x, x + 14); B.fill(x + 3, st.gy - 2, x + 4, st.gy - 1, T.GROUND); st.enemy('npYeti', x + 10, st.gy); if (o.two) st.enemy('npYeti', x + 13, st.gy); st.semi(x + 6, x + 8, st.gy - 4); st.block(x + 7, st.gy - 7, 'power'); st.coins(x + 6, x + 8, st.gy - 6); return x + 15; },

  /* 12-4: the icefall (pieces move st.y up) */
  cstart(st) { st.spawn('npPen', 6, st.y - 1, {}); st.B.decorAt('npSnowTuft', 16, st.y, 0); return st.x; },
  iledges(st, o) {
    const B = st.B, W = st.W, n = o.n || 4, mid = st.mid; let y = st.y;
    for (let k = 0; k < n; k++) {
      y = st.y - 3 * (k + 1); const left = (k + (o.flip ? 1 : 0)) % 2 === 0, x0 = left ? 2 : W - 9;
      B.fill(x0, y, x0 + 6, y, T.GROUND); st.coins(x0 + 1, x0 + 5, y - 2);
      if (k === 1) st.enemy('npChough', x0 + 3, y);
      if (k < n - 1) for (let q = -2; q < 2; q++) B.set(mid + q, y - 2, T.SEMI);
    }
    st.top(y - 2);
  },
  // aluminium ladders bridging the crevasses: one-way rungs to stand on
  ladders(st, o) {
    const B = st.B, W = st.W, n = o.n || 3; let y = st.y;
    for (let k = 0; k < n; k++) { y = st.y - 3 * (k + 1); const left = k % 2 === 0; const x0 = left ? 2 : 9, w = W - 13; B.prop('npLadder', x0, y, w, 1, 'top', {}); st.coins(x0 + 2, x0 + w - 3, y - 2); B.fill(left ? W - 4 : 1, y, left ? W - 3 : 2, y, T.GROUND); }
    if (o.gold) st.gold(W - 5, y - 3, 'high');
    st.top(y - 3);
  },
  // ledges with icicles hanging under the band above
  icicles(st, o) {
    const B = st.B, W = st.W, mid = st.mid; let y = st.y;
    for (let k = 0; k < 3; k++) { y = st.y - 3 * (k + 1); const left = k % 2 === 0, x0 = left ? 2 : W - 10; B.fill(x0, y, x0 + 7, y, T.GROUND); st.spawn('npIcicle', x0 + 3, y + 1, {}); st.spawn('npIcicle', x0 + 6, y + 1, {}); for (let q = -2; q < 2; q++) B.set(mid + q, y - 2, T.SEMI); st.coins(x0 + 2, x0 + 5, y - 2); }
    st.top(y - 2);
  },
  // seracs: crumbling ice blocks to hop up quickly
  seracs(st, o) {
    const B = st.B, W = st.W; let y = st.y;
    const pts = [[4, 2], [8, 4], [13, 3], [17, 5], [12, 7], [6, 8], [10, 10]];
    for (const [x, dy] of pts) { B.set(x, y - dy, T.CRUMBLE); B.set(x + 1, y - dy, T.CRUMBLE); st.coins(x, x + 1, y - dy - 2); }
    st.enemy('npChough', st.mid, y - 6);
    st.top(y - 12);
  },
  ccp(st) { const B = st.B, W = st.W, y = st.y - 3; B.fill(2, y, W - 3, y, T.GROUND); st.spawn('checkpoint', Math.floor(W / 2) + 4, y - 1); st.spawn('npPen', 5, y - 1, {}); for (let q = st.mid - 2; q < st.mid + 2; q++) B.set(q, y, T.SEMI); st.top(y - 3); },

  /* 12-5: the Baron's fortress */
  // a vault corridor watched by shrink-ray cameras
  cameras(st, o) { const x = st.x, B = st.B, n = o.n || 2, w = n * 6 + 4; st.floor(x, x + w - 1); B.fill(x, 0, x + w - 1, st.gy - 7, T.HARD); for (let k = 0; k < n; k++) st.spawn('npCamera', x + 4 + k * 6, st.gy - 1, { top: st.gy - 6, range: 7, phase: k * 1.7 }); st.enemy('npTinBot', x + w - 3, st.gy); st.coins(x + 2, x + w - 3, st.gy - 2); if (o.gold) st.gold(x + 3 + 3, st.gy - 4, 'risky'); return x + w; },
  gallery(st, o) { const x = st.x; st.floor(x, x + 13); st.semi(x + 3, x + 6, st.gy - 3); st.semi(x + 8, x + 11, st.gy - 5); st.block(x + 9, st.gy - 8, o.item || 'power'); st.decor('npGlobeStand', x + 1); st.decor('npCrateStack', x + 12); st.enemy('npBobble', x + 6, st.gy); st.gold(x + 4, st.gy - 6, 'hidden'); return x + 14; },
  belts(st, o) { const x = st.x, B = st.B, n = 12; st.floor(x, x + n - 1); for (let c = x + 1; c < x + n - 1; c++) B.set(c, st.gy, T.CONV_L); st.enemy('npGlobe', x + n - 2, st.gy); st.enemy('npTinBot', x + 6, st.gy); st.coins(x + 2, x + n - 3, st.gy - 3); return x + n; },
  // the summit of the roof of the world: a flat roof with four ledges, the Baron's jar shelf and prayer flags behind
  arena_summit(st, o) {
    const B = st.B, { x0, w, GY } = o;
    for (let q = 0; q < 4; q++) { B.set(x0 + 3 + q, GY - 4, T.SEMI); B.set(x0 + w - 7 + q, GY - 4, T.SEMI); }
    for (let q = 0; q < 2; q++) { B.set(x0 + 11 + q, GY - 4, T.SEMI); B.set(x0 + w - 13 + q, GY - 4, T.SEMI); }
    B.decorAt('npGlobeStand', x0 + 1, GY, 0); B.decorAt('npGlobeStand', x0 + w - 2, GY, 1); B.decorAt('npCrateStack', x0 + 2, GY, 0); B.decorAt('npCrateStack', x0 + w - 3, GY, 0);
    st.spawn('npRoof', x0, GY - 1, { x0, w });
  }
};

/* ---------------- the final boss: BARON BRIC-A-BRAC ---------------- */
// THE STOLEN LANDMARKS. The Baron keeps the shrunken landmarks of the whole tour in jars and throws them at Brady one
// at a time. A thrown landmark lands as a world object: kick it (run into it) or stomp it to launch it and it lobs
// itself back at the Baron. A landmark that hits him is RETURNED: it hurts him and pops back to full size behind the
// summit. Stomps bounce off (NOT THE HAT!).
//   Phase 1 (hp 7-5): the snow-globe airship, three landmarks, snow-globe drops and low swoops.
//   Phase 2 (hp 4-2): he crashes and lands in a bric-a-brac mech built from the stolen things: it walks, stomps, charges
//                     with its windmill arm and fires the laser monocle. Three more landmarks.
//   Phase 3 (hp 1):   the mech breaks; on foot he runs the ledge with the last jar while gales buffet the summit.
//   Finish: the Shrink-o-Matic goes off in his own face, every landmark pops back, Chinka arrives.
const LANDMARKS = [
  { id: 'ec', name: 'THE VOLCANO' }, { id: 'nl', name: 'THE WINDMILL' }, { id: 'fr', name: 'THE IRON TOWER' },
  { id: 'br', name: 'SUGARLOAF' }, { id: 'mz', name: 'THE BAOBAB' }, { id: 'ma', name: 'THE KASBAH' },
  { id: 'mx', name: 'THE PALACE OF FINE ARTS' },
  { id: 'es', name: 'THE SILK EXCHANGE' }, { id: 'id', name: 'THE RICE TERRACES' }, { id: 'vn', name: 'THE COVERED BRIDGE' },
  { id: 'jp', name: 'THE GOLDEN FISH' }, { id: 'np', name: 'THE HIGH PEAK' }
];
// a tiny stylized landmark, feet at (0, 0), about 30 px wide at scale 1
function landmarkArt(ctx, id, t, s) {
  ctx.save(); ctx.scale(s || 1, s || 1);
  switch (id) {
    case 'ec': // the volcano
      ctx.fillStyle = '#6a4a3a'; ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-4, -26); ctx.lineTo(4, -26); ctx.lineTo(15, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff6a2a'; ctx.fillRect(-4, -27, 8, 3); ctx.fillStyle = '#ffb03a'; ctx.beginPath(); ctx.moveTo(-2, -26); ctx.lineTo(1, -14); ctx.lineTo(4, -26); ctx.fill();
      ctx.fillStyle = 'rgba(200,200,200,0.6)'; for (let k = 0; k < 3; k++) { const q = (t * 0.5 + k / 3) % 1; ctx.beginPath(); ctx.arc(Math.sin(q * 6) * 3, -30 - q * 14, 3 + q * 3, 0, TAU); ctx.fill(); }
      break;
    case 'nl': // the windmill
      ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-6, -22); ctx.lineTo(6, -22); ctx.lineTo(9, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c8322a'; ctx.beginPath(); ctx.moveTo(-8, -22); ctx.lineTo(0, -28); ctx.lineTo(8, -22); ctx.fill();
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-2, -7, 4, 7);
      ctx.save(); ctx.translate(0, -24); ctx.rotate(t * 2); ctx.strokeStyle = '#e8dcc8'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -14); ctx.stroke(); ctx.fillStyle = 'rgba(232,220,200,0.8)'; ctx.fillRect(-4, -14, 4, 10); } ctx.restore();
      break;
    case 'fr': // the iron tower (a plain daylight silhouette)
      ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(-3, -16, 0, -34); ctx.quadraticCurveTo(3, -16, 14, 0); ctx.stroke();
      ctx.lineWidth = 1.2; for (const [y, w] of [[-6, 11], [-16, 6], [-26, 3]]) { ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, -6); ctx.moveTo(10, 0); ctx.lineTo(-10, -6); ctx.stroke();
      ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-1, -38, 2, 5);
      break;
    case 'br': { // Sugarloaf with its cable car
      ctx.fillStyle = '#3a8ad8'; ctx.fillRect(-16, -3, 32, 3);
      ctx.fillStyle = '#5a8a4a'; ctx.beginPath(); ctx.moveTo(-16, -2); ctx.quadraticCurveTo(-12, -20, -4, -20); ctx.quadraticCurveTo(2, -20, 2, -2); ctx.fill();
      ctx.fillStyle = '#4a7a3a'; ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(6, -30, 11, -30); ctx.quadraticCurveTo(16, -30, 16, -2); ctx.fill();
      ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-6, -19); ctx.lineTo(11, -29); ctx.stroke();
      const u = (Math.sin(t) + 1) / 2; ctx.fillStyle = '#ffd84a'; ctx.fillRect(-6 + 17 * u - 2, -19 - 10 * u, 4, 3);
      break;
    }
    case 'mz': // the baobab
      ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.quadraticCurveTo(-7, -14, -5, -22); ctx.lineTo(5, -22); ctx.quadraticCurveTo(7, -14, 9, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 2; ctx.lineCap = 'round'; for (const [dx, dy] of [[-12, -30], [-6, -34], [2, -35], [9, -32], [13, -27]]) { ctx.beginPath(); ctx.moveTo(0, -21); ctx.lineTo(dx, dy); ctx.stroke(); } ctx.lineCap = 'butt';
      ctx.fillStyle = '#6aa84a'; for (const [dx, dy] of [[-12, -30], [-6, -34], [2, -35], [9, -32], [13, -27]]) { ctx.beginPath(); ctx.arc(dx, dy, 2.5, 0, TAU); ctx.fill(); }
      break;
    case 'ma': // the kasbah
      ctx.fillStyle = '#d8a86a'; ctx.fillRect(-15, -16, 30, 16); ctx.fillRect(-14, -26, 7, 10); ctx.fillRect(7, -24, 7, 8);
      ctx.fillStyle = '#b8884a'; for (let k = -14; k < 14; k += 4) ctx.fillRect(k, -18, 2, 2); ctx.fillRect(-13, -28, 2, 2); ctx.fillRect(-9, -28, 2, 2); ctx.fillRect(8, -26, 2, 2); ctx.fillRect(12, -26, 2, 2);
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-2, -10, 4, 10); ctx.fillRect(-11, -23, 2, 3); ctx.fillRect(9, -21, 2, 3);
      ctx.fillStyle = '#8a6a3a'; ctx.fillRect(13, -30, 2, 14); ctx.fillStyle = '#4a8a3a'; ctx.beginPath(); ctx.arc(14, -30, 4, 0, TAU); ctx.fill();
      break;
    case 'mx': // the Palace of Fine Arts
      ctx.fillStyle = '#f2e2c8'; ctx.fillRect(-16, -14, 32, 14); ctx.fillStyle = '#c8b898'; for (let k = -13; k <= 13; k += 6) ctx.fillRect(k - 1, -12, 2, 10);
      ctx.fillStyle = '#e8b838'; ctx.beginPath(); ctx.arc(0, -16, 11, Math.PI, TAU); ctx.fill(); ctx.fillStyle = '#ff8a3a'; ctx.beginPath(); ctx.arc(0, -16, 7, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(-1, -32, 2, 6); ctx.beginPath(); ctx.arc(0, -33, 2, 0, TAU); ctx.fill();
      break;
    case 'es': // the silk exchange
      ctx.fillStyle = '#c8b8a0'; ctx.fillRect(-15, -20, 30, 20); ctx.fillStyle = '#8a7a68'; ctx.fillRect(-15, -22, 30, 2);
      ctx.fillStyle = '#3a2a2a'; for (const dx of [-9, 0, 9]) { ctx.beginPath(); ctx.moveTo(dx - 3, 0); ctx.lineTo(dx - 3, -10); ctx.lineTo(dx, -15); ctx.lineTo(dx + 3, -10); ctx.lineTo(dx + 3, 0); ctx.fill(); }
      ctx.fillStyle = '#c8b8a0'; ctx.fillRect(10, -30, 5, 10); ctx.fillStyle = '#8a7a68'; ctx.fillRect(9, -31, 7, 2);
      break;
    case 'id': // the rice terraces
      for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#6ab84a' : '#8ad85a'; ctx.beginPath(); ctx.moveTo(-16, -k * 5); ctx.quadraticCurveTo(0, -k * 5 - 8, 16, -k * 5); ctx.lineTo(16, 0); ctx.lineTo(-16, 0); ctx.fill(); }
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(9, -28, 2, 8); ctx.fillStyle = '#4a8a3a'; ctx.beginPath(); ctx.arc(10, -28, 4, 0, TAU); ctx.fill();
      break;
    case 'vn': // the covered bridge
      ctx.fillStyle = '#8a6a4a'; ctx.fillRect(-16, -6, 32, 3); ctx.fillRect(-12, -3, 3, 3); ctx.fillRect(9, -3, 3, 3);
      ctx.fillStyle = '#e8dcc8'; ctx.fillRect(-13, -16, 26, 10); ctx.fillStyle = '#3a2a2a'; for (const dx of [-8, -1, 6]) ctx.fillRect(dx, -13, 3, 5);
      ctx.fillStyle = '#c8322a'; ctx.beginPath(); ctx.moveTo(-16, -16); ctx.quadraticCurveTo(0, -30, 16, -16); ctx.lineTo(14, -14); ctx.quadraticCurveTo(0, -26, -14, -14); ctx.fill();
      break;
    case 'jp': // the golden roof fish
      ctx.fillStyle = '#3a4a6a'; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.quadraticCurveTo(0, -8, 16, 0); ctx.fill();
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(-2, -4); ctx.quadraticCurveTo(-12, -14, -6, -30); ctx.quadraticCurveTo(0, -26, 4, -14); ctx.quadraticCurveTo(10, -8, 4, -4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8a01a'; ctx.beginPath(); ctx.moveTo(-6, -30); ctx.lineTo(-12, -34); ctx.lineTo(-2, -32); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(1, -8, 1.5, 0, TAU); ctx.fill();
      break;
    default: // the high peak
      peak(ctx, 0, 0, 36, 34, '#6a7a98', '#ffffff', 7);
  }
  ctx.restore();
}
// a landmark shrunk inside a jar (a snow globe on a wooden base); empty jars have popped open
function jarArt(ctx, x, y, id, t, s, empty) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#5a3a2a'; rr(ctx, -16, -5, 32, 6, 2); ctx.fill();
  const cracked = empty === true;
  if (!empty) { ctx.save(); ctx.beginPath(); ctx.arc(0, -23, 19, 0, TAU); ctx.clip(); ctx.translate(0, -6); landmarkArt(ctx, id, t, 0.85); ctx.restore(); }
  ctx.fillStyle = cracked ? 'rgba(200,230,255,0.2)' : 'rgba(200,235,255,0.42)'; ctx.beginPath(); ctx.arc(0, -23, 19, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-11, -34, 3, 7);
  if (!cracked) { ctx.fillStyle = '#ffffff'; for (let k = 0; k < 5; k++) ctx.fillRect(-12 + ((t * 8 + k * 5) % 24), -36 + ((k * 7 + t * 10) % 26), 1.5, 1.5); }
  else { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6, -40); ctx.lineTo(2, -30); ctx.lineTo(-3, -24); ctx.stroke(); }
  ctx.restore();
}
// a thrown landmark: a world object. Brady kicks it (runs into it) or stomps it to launch it, and a fresh kick lobs it
// back at the Baron in an arc that lands on where he is heading. While it flies after the Baron threw it, it hurts.
const NpLandmark = TourProp.make({
  w: 30, h: 32, kick: 8, bounce: 0.45, friction: 7, gravity: 0.3, hurts: true, hp: 1, burst: '#bfe8ff',
  init(e, s) { e.lm = LANDMARKS[s.lm || 0]; e.landmark = true; e.lobbed = false; e.rest = 0; e.spin = 0; },
  think(e, dt) {
    const g = e.g, p = g.player, b = g.boss;
    if (p && e.thrownBy === p && !e.lobbed) {
      e.lobbed = true; e.rest = 0;
      if (b && b.state === 'fight' && b.act !== 'finale' && Math.abs(b.cx - e.cx) > TS && sign(b.cx - e.cx) === sign(e.vx || 1)) {
        const sp = Math.max(Math.abs(e.vx), 6 * TS), gr = PHYS.gDown * 0.3;
        // lead the target: where will the Baron be when it gets there?
        let tx = b.cx; for (let k = 0; k < 2; k++) { const tt = Math.abs(tx - e.cx) / sp; tx = clamp(b.cx + (b.vx || 0) * tt, b.arenaX0 + 20, b.arenaX1 - 20); }
        const tt = Math.max(0.15, Math.abs(tx - e.cx) / sp);
        e.vx = sign(tx - e.cx) * sp; e.vy = clamp((b.cy - e.cy - 0.5 * gr * tt * tt) / tt, -16 * TS, 1 * TS);
        g.burst(e.cx, e.cy, 8, '#7affd8', 'spark'); g.parts.text(e.cx, e.y - 10, 'RETURN TO SENDER!', '#7affd8'); Sound.play('throw', { pitch: 1.5, vol: 0.4 });
      }
    }
    if (e.onGround && Math.abs(e.vx) < 1.5 * TS) { e.rest += dt; if (e.rest > 0.2) { e.lobbed = false; if (e.thrownBy !== p) e.thrownBy = null; } } else e.rest = 0;
    e.spin = e.onGround ? approach(e.spin, 0, dt * 8) : e.spin + e.vx * dt / 60;
    // blown off the summit? the wind brings it straight back
    if (b && (e.x < b.arenaX0 - TS || e.x > b.arenaX1 + TS || e.y > b.floorY + 2 * TS)) { e.x = (b.arenaX0 + b.arenaX1) / 2 - e.w / 2; e.y = b.floorY - 6 * TS; e.vx = 0; e.vy = 0; g.burst(e.cx, e.cy, 10, '#ffffff', 'dust'); }
  },
  art(ctx, e, x, y, t) {
    ctx.save(); ctx.translate(x, y - 2); ctx.rotate(e.spin || 0);
    jarArt(ctx, 0, 0, e.lm.id, t, 0.85, false);
    ctx.restore();
    if (e.onGround && !e.fast) { ctx.fillStyle = `rgba(122,255,216,${0.6 + 0.4 * Math.sin(t * 8)})`; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('KICK IT BACK', x, y - 44 + Math.sin(t * 6) * 3); }
  }
});
// the summit itself: prayer flags high above (scenery), the Baron's shelf of jars, and the restored landmarks growing
// back to full size along the back of the roof of the world
class NpRoof extends Ent {
  constructor(g, s) { super(g, s, 10, 10); this.npRoof = true; this.friendly = true; this.x0 = s.x0 * TS; this.x = this.x0; this.w = s.w * TS; this.x1 = this.x0 + this.w; this.floorY = s.y; this.y = this.floorY - 9 * TS; this.h = 9 * TS; this.freed = {}; this.n = 0; }
  slotX(k) { return this.x0 + 1.5 * TS + (k + 0.5) * (this.w - 3 * TS) / LANDMARKS.length; }
  free(lm, fx, fy) {
    if (this.freed[lm.id]) return; const k = LANDMARKS.indexOf(lm);
    this.freed[lm.id] = { t: 0, k, fx: fx == null ? this.slotX(k) : fx, fy: fy == null ? this.floorY - 6 * TS : fy }; this.n++;
    this.g.burst(this.slotX(k), this.floorY - 20, 24, '#7affd8', 'confetti'); K.sfx('landmark_free', 'oneup', { pitch: 1.1 });
    this.g.parts.text(this.slotX(k), this.floorY - 3 * TS, lm.name + ' RESTORED!', '#7affd8');
  }
  update(dt) { this.t += dt; for (const id in this.freed) this.freed[id].t += dt; }
  draw(ctx) {
    const t = this.t, fy = this.floorY, mid = this.x0 + this.w / 2;
    for (const px of [this.x0 + 12, this.x1 - 12]) { ctx.fillStyle = '#5a4030'; ctx.fillRect(px - 2, fy - 8 * TS, 4, 2 * TS); }
    flagLine(ctx, this.x0 + 12, fy - 7.8 * TS, mid, fy - 7.2 * TS, 1); flagLine(ctx, mid, fy - 7.2 * TS, this.x1 - 12, fy - 7.8 * TS, 1);
    const sy = fy - 6 * TS; ctx.fillStyle = '#5a3a7a'; ctx.fillRect(this.x0 + 2 * TS, sy, this.w - 4 * TS, 6); ctx.fillStyle = '#ffd84a'; ctx.fillRect(this.x0 + 2 * TS, sy, this.w - 4 * TS, 1.5);
    for (let k = 0; k < LANDMARKS.length; k++) jarArt(ctx, this.slotX(k), sy, LANDMARKS[k].id, t, 0.6, !!this.freed[LANDMARKS[k].id]);
    for (const id in this.freed) {
      const f = this.freed[id], k = Math.min(1, f.t / 0.9), e = k < 0.7 ? easeOut(k / 0.7) * 1.15 : 1.15 - 0.15 * (k - 0.7) / 0.3;
      const x = lerp(f.fx, this.slotX(f.k), Math.min(1, easeOut(f.t / 0.5))), y = lerp(f.fy, fy, Math.min(1, easeOut(f.t / 0.5)));
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = 0.92; landmarkArt(ctx, id, t, 0.3 + e * 2.3); ctx.restore();
    }
  }
}
// Chinka: tied up in the gondola in phase 1, she bails out on a scrap of balloon when it pops, cheers from the ledge,
// and runs to Brady when the last landmark is home
class NpChinka extends Ent {
  constructor(g, s) { super(g, s, 24, 46); this.friendly = true; this.npChinka = true; this.state = 'chute'; this.tx = s.tx; this.ty = s.ty; this.lineT = 1; this.facing = 1; this.hearts = 0; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    if (this.state === 'chute') {
      this.x = approach(this.x, this.tx - this.w / 2, 2.6 * TS * dt); this.y = approach(this.y, this.ty - this.h, 2.4 * TS * dt); this.facing = sign(this.tx - this.cx) || 1;
      if (this.y >= this.ty - this.h - 0.5) { this.state = 'cheer'; this.lineT = 0.4; }
    } else if (this.state === 'cheer') {
      this.lineT -= dt; if (p) this.facing = sign(p.cx - this.cx) || 1;
      if (this.lineT <= 0) { this.lineT = 7 + Math.random() * 3; K.say(g, this, pick(['KICK IT BACK, BRADY!', 'YOU\'VE GOT THIS!', 'THAT\'S MY BRADY!', 'HE HATES THAT!']), '#ff9ad8'); }
    } else if (this.state === 'run') {
      if (p) { const tx = p.cx + (p.cx < this.cx ? 34 : -34); this.x = approach(this.x, tx - this.w / 2, 5.5 * TS * dt); this.facing = sign(p.cx - this.cx) || 1; this.y = approach(this.y, p.y + p.h - this.h, 7 * TS * dt); if (Math.abs(this.cx - tx) < 2) { this.state = 'hug'; K.say(g, this, '♥ BRADY! YOU DID IT! ♥', '#ff9ad8'); } }
    } else if (this.state === 'hug') { if (p) this.facing = sign(p.cx - this.cx) || 1; this.hearts += dt; if (this.hearts > 0.3) { this.hearts = 0; g.burst(this.cx + (Math.random() - 0.5) * 40, this.y, 2, '#ff9ad8', 'confetti'); } }
  }
  arrive() { if (this.state !== 'hug') { this.state = 'run'; K.say(this.g, this, 'BRADY!', '#ff9ad8'); } }
  draw(ctx) {
    const t = this.t;
    if (this.state === 'chute') { ctx.fillStyle = 'rgba(200,235,255,0.75)'; ctx.beginPath(); ctx.arc(this.cx, this.y - 30, 30, Math.PI, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(90,60,120,0.7)'; ctx.lineWidth = 1; for (const dx of [-28, 0, 28]) { ctx.beginPath(); ctx.moveTo(this.cx + dx, this.y - 30); ctx.lineTo(this.cx, this.y + 8); ctx.stroke(); } }
    drawChinka(ctx, { x: this.cx, y: this.y + this.h, scale: 0.9, t, pose: this.state === 'chute' ? 'jump' : this.state === 'run' ? 'run' : this.state === 'hug' ? 'hug' : 'cheer', facing: this.facing });
  }
}
// the gales of the summit: warned by the wind sound and the streaks, then a push that lasts a couple of seconds
class NpGale extends Ent {
  constructor(g, s) { super(g, s, 10, 10); this.friendly = true; this.npGale = true; this.k = 1.6; this.state = 'calm'; this.dir = 1; this.gust = 0; this.x0 = s.x0; this.x1 = s.x1; this.floorY = s.y; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player; this.k -= dt;
    if (this.state === 'calm') { this.gust = Math.max(0, this.gust - dt * 3); if (this.k <= 0) { this.state = 'warn'; this.k = 0.9; this.dir = -this.dir; Sound.play('wind', { vol: 0.35, pitch: 1.3 }); if (p) g.parts.text(p.cx, p.y - 30, this.dir > 0 ? 'WIND ▶' : '◀ WIND', '#e8f8ff'); } }
    else if (this.state === 'warn') { this.gust = Math.min(0.2, this.gust + dt * 0.25); if (this.k <= 0) { this.state = 'gust'; this.k = 2.2; Sound.play('wind', { vol: 0.6, pitch: 0.8 }); } }
    else { this.gust = Math.min(1, this.gust + dt * 3); if (this.k <= 0) { this.state = 'calm'; this.k = 2.4; } }
    if (p && !p.dead && this.gust > 0.25 && p.cx > this.x0 && p.cx < this.x1) g.windForce = this.dir * 3.6 * TS * this.gust;
  }
  draw(ctx) {
    if (this.gust < 0.05) return; const a = this.gust, W = this.x1 - this.x0;
    ctx.strokeStyle = `rgba(255,255,255,${0.75 * a})`; ctx.lineWidth = 2;
    for (let i = 0; i < 28; i++) { const ph = (this.t * (1.4 + (i % 3) * 0.3) + i * 0.37) % 1; const sx = this.x0 - 100 + (this.dir > 0 ? ph : 1 - ph) * (W + 200), sy = this.floorY - 7.5 * TS + (i * 53) % (7 * TS); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + this.dir * 56 * a, sy - 3); ctx.stroke(); }
  }
}
const BARON_HP = 7;
const beamArt = (ctx, s) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createLinearGradient(s.x, 0, s.x + s.w, 0); gr.addColorStop(0, 'rgba(255,90,90,0)'); gr.addColorStop(0.5, 'rgba(255,170,170,0.95)'); gr.addColorStop(1, 'rgba(255,90,90,0)'); ctx.fillStyle = gr; rr(ctx, s.x, s.y, s.w, s.h, 7); ctx.fill(); ctx.restore(); };
const shrinkBeamArt = (ctx, s) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createLinearGradient(s.x, 0, s.x + s.w, 0); gr.addColorStop(0, 'rgba(140,240,255,0)'); gr.addColorStop(0.5, 'rgba(200,250,255,0.95)'); gr.addColorStop(1, 'rgba(140,240,255,0)'); ctx.fillStyle = gr; rr(ctx, s.x, s.y, s.w, s.h, 7); ctx.fill(); ctx.restore(); };
const quakeArt = (ctx, s) => { ctx.fillStyle = 'rgba(200,170,255,0.85)'; ctx.beginPath(); ctx.moveTo(s.x, s.y + s.h); ctx.lineTo(s.cx, s.y); ctx.lineTo(s.x + s.w, s.y + s.h); ctx.fill(); };
const globeShot = (ctx, s, t) => { ctx.fillStyle = 'rgba(210,240,255,0.85)'; ctx.beginPath(); ctx.arc(s.cx, s.cy - 2, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8b838'; ctx.fillRect(s.cx - 3, s.cy - 4, 6, 5); ctx.fillStyle = '#7a2ac8'; ctx.fillRect(s.cx - 6, s.cy + 5, 12, 4); };
function baronSize(b, w, h, keepBottom) { const cx = b.cx, bottom = b.y + b.h; b.w = w; b.h = h; b.x = cx - w / 2; b.y = keepBottom ? bottom - h : b.y; }
function baronRoof(b) { if (!b.roof) b.roof = b.g.entities.find(e => e.npRoof) || null; return b.roof; }
function baronOut(b) { return b.g.entities.find(e => e.landmark && !e.remove) || null; }
// the next jar leaves his hand, aimed at Brady; it hurts while it flies and lands as a kickable world object
function baronThrow(b, x, y) {
  const g = b.g, p = g.player; if (b.thrown >= b.quota) return null;
  const e = new NpLandmark(g, { x, y: y + 16, lm: b.thrown }); b.thrown++;
  const dx = p ? p.cx - x : b.dir * 4 * TS, tt = 0.9;
  e.fling(clamp(dx / tt, -8 * TS, 8 * TS), -3.5 * TS, b); e.lobbed = true; g.spawn(e);
  Sound.play('throw', { pitch: 0.9, vol: 0.5 }); g.burst(x, y, 8, '#bfe8ff', 'spark');
  if (!b.told) { b.told = true; g.toast('CATCH IT AND KICK IT BACK AT HIM!'); }
  return e;
}
function baronFinale(b, dt) {
  const g = b.g, at = b.at;
  b.vx = 0; b.pose = 'finale';
  if (b.first) { b.face(); K.say(g, b, 'NOOO! MY COLLECTION!', '#ffd84a'); b.fin = 0; g.shake(6); }
  const times = [0.8, 1.4, 1.7, 2.0, 2.3, 2.6, 3.0, 3.8, 6.2];
  const step = k => { if (b.fin < k && at >= times[k - 1]) { b.fin = k; return true; } return false; };
  // the Shrink-o-Matic slips out of his hand and goes off in his own face
  if (step(1)) { g.flash = 1; TourKit.sfx('camera_flash', 'laser', { vol: 0.7 }); K.say(g, b, 'OOPS.', '#8af0ff'); g.burst(b.cx, b.cy, 20, '#8af0ff', 'spark'); }
  for (let k = 0; k < 5; k++) if (step(2 + k)) { const r = baronRoof(b); if (r) { const left = LANDMARKS.filter(l => !r.freed[l.id]); for (let q = 0; q < Math.ceil(left.length / (5 - k)); q++) if (left[q]) r.free(left[q]); } }
  if (step(7)) { g.bannerText = 'EVERY LANDMARK RETURNED!'; g.bannerT = 3; Sound.play('secret'); const c = g.entities.find(e => e.npChinka); if (c) c.arrive(); }
  if (step(8)) K.say(g, b, 'LET ME OUT! IT\'S TINY IN HERE!', '#ffd84a');
  if (step(9)) b.die();
  b.shrinkK = clamp((at - 0.8) / 0.6, 0, 1);
  if (b.shrinkK >= 1 && b.onGround && Math.random() < dt * 2.5) b.vy = -4 * TS;
  b.fall(dt);
}
// the mech: tower-lattice legs, a kasbah crate for a body, a windmill for an arm, a baobab club, a cockpit dome
function mechArt(ctx, b, t) {
  const k = b.mechK == null ? 1 : b.mechK, P = b.pose, walk = P === 'walk' || P === 'charge';
  ctx.save(); ctx.translate(b.cx, b.y + b.h); ctx.scale(b.dir, 1);
  if (k < 1) { ctx.translate(0, 0); ctx.scale(0.3 + 0.7 * easeOut(k), 0.3 + 0.7 * easeOut(k)); ctx.rotate((1 - k) * 0.4); }
  if (P === 'stagger') ctx.rotate(-Math.sin(b.at * 10) * 0.08 * Math.max(0, 1 - b.at));
  const st = walk ? Math.sin(t * (P === 'charge' ? 16 : 8)) : 0;
  // legs: two lattice legs; the front leg lifts high for the stomp
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * 26, -50); const lift = s > 0 && P === 'lift' ? (b.lift || 0) : 0; ctx.rotate(st * 0.25 * s - lift * 1.0);
    ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-12, 50); ctx.moveTo(8, 0); ctx.lineTo(12, 50); ctx.stroke();
    ctx.lineWidth = 1.5; for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.moveTo(-9, q * 12 + 4); ctx.lineTo(10, q * 12 + 12); ctx.moveTo(9, q * 12 + 4); ctx.lineTo(-10, q * 12 + 12); ctx.stroke(); }
    ctx.fillStyle = '#3a2a2a'; rr(ctx, -16, 46, 32, 8, 3); ctx.fill(); ctx.restore();
  }
  // the kasbah crate body, pinned with souvenirs
  ctx.fillStyle = '#d8a86a'; rr(ctx, -42, -102, 84, 54, 6); ctx.fill(); ctx.fillStyle = '#b8884a'; for (let q = -40; q < 40; q += 8) ctx.fillRect(q, -104, 4, 4); ctx.fillRect(-42, -78, 84, 3);
  ctx.fillStyle = '#7a2ac8'; rr(ctx, -30, -72, 60, 14, 3); ctx.fill(); ctx.save(); ctx.scale(b.dir, 1); ctx.fillStyle = '#ffd84a'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('BRIC-A-BRAC MK II', 0, -62); ctx.restore();
  const pins = ['#ffd84a', '#ff4f8a', '#38c8ff', '#5ad04a', '#ffffff', '#ff9a3a']; for (let q = 0; q < 6; q++) { ctx.fillStyle = pins[q]; ctx.beginPath(); ctx.arc(-30 + q * 12, -92, 3, 0, TAU); ctx.fill(); }
  // the jar rack on top: this phase's landmarks still to throw
  for (let q = 0; q < 3; q++) jarArt(ctx, -28 + q * 28, -104, LANDMARKS[3 + q].id, t, 0.42, b.thrown > 3 + q);
  // arms: the windmill (spins up for the charge) and the baobab club
  if (b.parts > 2) { ctx.save(); ctx.translate(-54, -84); ctx.fillStyle = '#7a5a3a'; rr(ctx, -6, -10, 12, 22, 3); ctx.fill(); ctx.rotate(t * (P === 'charge' ? 18 : 2.5)); ctx.strokeStyle = '#e8dcc8'; ctx.lineWidth = 3; for (let q = 0; q < 4; q++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke(); ctx.fillStyle = 'rgba(232,220,200,0.85)'; ctx.fillRect(-7, -26, 7, 18); } ctx.restore(); }
  if (b.parts > 1) { ctx.save(); ctx.translate(50, -86); ctx.rotate(P === 'wind' ? -1.6 + Math.sin(t * 30) * 0.05 : 0.5); ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-10, 34); ctx.lineTo(10, 34); ctx.lineTo(6, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#6aa84a'; for (const [dx, dy] of [[-8, 36], [0, 40], [9, 36]]) { ctx.beginPath(); ctx.arc(dx, dy, 3, 0, TAU); ctx.fill(); } ctx.restore(); }
  // the held jar during the wind-up
  if (P === 'wind') { const sh = Math.sin(t * 40) * 2; jarArt(ctx, 52 + sh, -118, LANDMARKS[Math.min(b.thrown, 6)].id, t, 0.75, false); ctx.fillStyle = '#ffd84a'; ctx.font = `12px ${FONT_DISPLAY}`; ctx.fillText('!', 52, -160); }
  // the cockpit dome with the Baron inside, his monocle hot when the laser charges
  ctx.fillStyle = 'rgba(200,240,255,0.35)'; ctx.beginPath(); ctx.arc(0, -108, 22, Math.PI, TAU); ctx.fill(); ctx.strokeStyle = b.parts < 1 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.5; ctx.stroke();
  if (b.parts < 1) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.moveTo(-10, -126); ctx.lineTo(-2, -116); ctx.lineTo(-6, -108); ctx.stroke(); }
  TourVillain.draw(ctx, 0, -104, 0.42, t, 'empty');
  if (P === 'aim') { const q = Math.min(1, b.at / 0.9); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,80,80,${0.4 + 0.6 * q})`; ctx.beginPath(); ctx.arc(2, -127, 3 + q * 4, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.restore();
  // the laser's aiming line: the tell
  if (P === 'aim' && b.aimY != null) { const q = Math.min(1, b.at / 0.9); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,80,80,${0.3 + 0.6 * q})`; ctx.lineWidth = 1 + q * 2; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(b.cx + b.dir * 20, b.aimY); ctx.lineTo(b.dir > 0 ? b.arenaX1 : b.arenaX0, b.aimY); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
}
const boss = {
  id: 'np_baron', name: 'Baron Bric-a-Brac', hp: BARON_HP, dims: [140, 84], floats: true, music: 'tour_np_boss', country: 'np',
  brain: {
    guardText: 'NOT THE HAT!',
    phases: [4, 1],
    wake(b) { b.phase = 1; b.thrown = 0; b.quota = 3; b.parts = 3; b.told = false; b.fired = false; K.say(b.g, b, 'AH, THE LAST SOUVENIR: YOU!', '#ffd84a'); },
    noDisc(b) { return true; },
    hit(b, kind, src) {
      if (b.act === 'finale' || b.act === 'crash' || b.act === 'wreck') return false;
      if (kind === 'prop') {
        if (!src || !src.landmark || src.thrownBy !== b.g.player) return false;
        const r = baronRoof(b); if (r) r.free(src.lm, src.cx, src.cy);
        b.damage(1, { text: src.lm.name + ' RETURNED!', col: '#7affd8' });
        return true;
      }
      if (kind === 'stomp' || kind === 'spin') return 'bounce';
      if (kind === 'bump' || kind === 'disc' || kind === 'hazard' || kind === 'laser') return false;
      return undefined;
    },
    onCharge(b, p) { },
    // after a bounce off the hat Brady is still a pixel inside the box for a frame: never let that count as contact
    touch(b, p) { if (b.act === 'finale') return true; if (p.vy < 0 && p.y + p.h < b.y + 12) return true; return false; },
    phase(b, n) {
      const g = b.g;
      if (n === 2) {
        b.quota = 6; b.hurtT = 3.0; b.landed = false; b.mechK = 0; b.vy = 0;
        g.burst(b.cx, b.cy, 60, '#bfe8ff', 'confetti'); g.shake(10); Sound.play('break', { pitch: 0.6, vol: 0.9 });
        K.say(g, b, 'MY AIRSHIP! ...TO THE MECH!', '#ffd84a'); g.bannerText = 'THE BRIC-A-BRAC MECH'; g.bannerT = 2.2;
        g.spawn(new NpChinka(g, { x: b.cx - 24, y: b.y + b.h, tx: b.arenaX0 + 6 * TS, ty: b.floorY - 4 * TS }));
        b.go('crash');
      }
      if (n === 3) {
        b.quota = 7; b.hurtT = 2.4; g.flash = 0.6; g.shake(12); Sound.play('break', { pitch: 0.5, vol: 1 });
        K.say(g, b, 'MY MECH! FINE. I\'LL DO IT MYSELF!', '#ffd84a'); g.bannerText = 'THE LAST LANDMARK'; g.bannerT = 2.2;
        g.spawn(new NpGale(g, { x: b.arenaX0, y: b.floorY, x0: b.arenaX0, x1: b.arenaX1 }));
        b.go('wreck');
      }
    },
    lastHit(b) { if (b.act !== 'finale') { b.vuln = false; b.go('finale'); } return true; },
    update(b, dt) {
      const g = b.g, p = g.player, ph = b.phase || 1, first = b.first;
      b.guard = 'bounce';
      if (b.act === 'finale') { baronFinale(b, dt); return; }
      /* ---- phase 1: the airship ---- */
      if (ph === 1) {
        const hy = b.floorY - b.h - 2.4 * TS;
        if (b.act === 'walk') { b.face(); b.hover(dt, hy + Math.sin(b.t * 1.4) * 12, p ? p.cx + (p.cx < b.cx ? 30 : -30) : undefined); b.pose = 'fly'; if (b.at > 1.5) { b.cycle++; b.go(!baronOut(b) && b.thrown < b.quota ? 'throw' : ['globes', 'swoop'][b.cycle % 2]); } }
        else if (b.act === 'throw') {
          b.face(); b.hover(dt, hy, p ? p.cx : undefined); b.pose = 'wind';
          if (first) { K.say(g, b, pick(['CATCH!', 'A SOUVENIR FOR YOU!', 'HEADS UP, SOUVENIR!']), '#ffd84a'); Sound.play('throw', { pitch: 0.7, vol: 0.4 }); }
          if (b.at > 0.85 && !b.fired) { b.fired = true; baronThrow(b, b.cx + b.dir * 18, b.y + b.h - 10); }
          if (b.at > 1.5) { b.fired = false; b.go('walk'); }
        } else if (b.act === 'globes') {
          b.hover(dt, hy, p ? p.cx : undefined); b.pose = 'drop';
          if (first) { b.n = 0; K.say(g, b, 'SNOW GLOBES! FREE OF CHARGE!', '#ffd84a'); }
          if (b.at > 0.5 + b.n * 0.3 && b.n < 4) { b.n++; tourFire(g, b.cx + (b.n - 2.5) * 26, b.y + b.h, { kind: 'globe', vx: p ? clamp((p.cx - b.cx) / 1.4, -4 * TS, 4 * TS) : 0, vy: 1 * TS, grav: PHYS.gDown * 0.45, w: 18, h: 18, life: 4, col: '#bfe8ff', art: globeShot }); Sound.play('throw', { pitch: 1.4, vol: 0.35 }); }
          if (b.at > 2.2) b.go('walk');
        } else if (b.act === 'swoop') {
          b.pose = 'fly';
          if (first) { b.sdir = p && p.cx < (b.arenaX0 + b.arenaX1) / 2 ? 1 : -1; b.x = b.sdir > 0 ? b.arenaX0 : b.arenaX1 - b.w; b.dir = b.sdir; K.say(g, b, 'WHEEE! DUCK!', '#ffd84a'); b.n = 0; }
          if (b.at > 0.5) { b.y = approach(b.y, b.floorY - b.h - 1.9 * TS, 7 * TS * dt); b.x += b.sdir * 7 * TS * dt; }
          if (b.at > 0.9 + b.n * 0.5 && b.n < 2) { b.n++; tourFire(g, b.cx, b.y + b.h, { kind: 'globe', vx: 0, vy: 2 * TS, grav: PHYS.gDown * 0.45, w: 18, h: 18, life: 3, col: '#bfe8ff', art: globeShot }); }
          if (b.at > 0.6 && ((b.sdir > 0 && b.x >= b.arenaX1 - b.w - 2) || (b.sdir < 0 && b.x <= b.arenaX0 + 2))) b.go('walk');
        } else if (b.act === 'reel') { b.pose = 'reel'; b.y += Math.sin(b.at * 14) * 1.5; b.x -= b.dir * 1.5 * TS * dt; if (b.at > 1) b.go('walk'); }
        else b.go('walk');
        return;
      }
      /* ---- phase 2: the mech ---- */
      if (ph === 2) {
        if (b.act === 'crash') {
          b.pose = 'crash'; b.vy += PHYS.gDown * 0.5 * dt; b.y += b.vy * dt; b.x += (b.dir || 1) * 0.5 * TS * dt;
          if (b.y + b.h >= b.floorY) { b.y = b.floorY - b.h; b.vy = 0; if (!b.landed) { b.landed = true; g.shake(12); g.burst(b.cx, b.floorY, 40, '#bfe8ff', 'debris'); Sound.play('stomp', { pitch: 0.4 }); baronSize(b, 96, 120, true); b.mechK = 0; } }
          if (b.landed) { b.mechK = Math.min(1, b.mechK + dt / 1.4); if (b.mechK >= 1) { K.say(g, b, 'BEHOLD: BRIC-A-BRAC MK II!', '#ffd84a'); g.shake(6); b.go('walk'); } }
          return;
        }
        if (b.act === 'walk') {
          b.face(); b.walk(1.1); b.pose = 'walk'; b.step = (b.step || 0) + dt;
          if (b.step > 0.55) { b.step = 0; g.shake(3); Sound.play('stomp', { pitch: 0.5, vol: 0.3 }); g.burst(b.cx - b.dir * 30, b.floorY, 4, '#c8a8ff', 'dust'); }
          if (b.at > 1.8) { b.cycle++; b.go(!baronOut(b) && b.thrown < b.quota ? 'throw' : ['laser', 'stomp', 'charge'][b.cycle % 3]); }
        } else if (b.act === 'throw') {
          b.vx = 0; b.face(); b.pose = 'wind';
          if (first) { K.say(g, b, pick(['TAKE THIS ONE TOO!', 'FETCH, SOUVENIR!', 'MECH THROW!']), '#ffd84a'); Sound.play('throw', { pitch: 0.7, vol: 0.4 }); }
          if (b.at > 0.85 && !b.fired) { b.fired = true; baronThrow(b, b.cx + b.dir * 46, b.y + 10); }
          if (b.at > 1.5) { b.fired = false; b.go('walk'); }
        } else if (b.act === 'laser') {
          b.vx = 0; b.face(); b.pose = 'aim';
          if (first) { b.aimY = p ? p.cy : b.floorY - 28; K.say(g, b, 'MONOCLE... ENGAGE!', '#ff8a8a'); Sound.play('laser', { vol: 0.25, pitch: 0.5 }); }
          if (b.at > 0.9 && !b.fired) { b.fired = true; g.flash = Math.max(g.flash || 0, 0.3); Sound.play('laser', { vol: 0.6 }); g.shake(4); for (let k = 0; k < 3; k++) tourFire(g, b.cx + b.dir * (56 + k * 44), b.aimY, { kind: 'beam', vx: b.dir * 16 * TS, w: 60, h: 14, life: 1.4, thru: true, col: '#ff5a5a', art: beamArt }); }
          if (b.at > 1.5) { b.fired = false; b.aimY = null; b.go('walk'); }
        } else if (b.act === 'stomp') {
          b.vx = 0; b.pose = 'lift'; b.lift = Math.min(1, b.at / 0.7);
          if (first) K.say(g, b, 'MECH STOMP!', '#ffd84a');
          if (b.at > 0.75 && !b.fired) { b.fired = true; b.lift = 0; g.shake(10); Sound.play('stomp', { pitch: 0.4 }); for (const d of [-1, 1]) tourFire(g, b.cx + d * (b.w / 2 + 12), b.floorY - 14, { kind: 'quake', vx: d * 5 * TS, w: 26, h: 24, ground: true, life: 3, col: '#c8a8ff', art: quakeArt }); }
          if (b.at > 1.4) { b.fired = false; b.go('walk'); }
        } else if (b.act === 'charge') {
          b.pose = 'charge';
          if (first) { b.face(); b.vx = 0; K.say(g, b, 'WINDMILL... WHIRRRR!', '#ffd84a'); Sound.play('wind', { vol: 0.4, pitch: 1.6 }); }
          if (b.at > 0.8) { b.vx = b.dir * 4.5 * TS; if (Math.random() < 0.5) g.burst(b.cx - b.dir * 40, b.floorY, 2, '#c8a8ff', 'dust'); if (b.hitWall || b.at > 2.6) { b.vx = 0; g.shake(5); b.go('walk'); } }
        } else if (b.act === 'stagger') { b.pose = 'stagger'; b.vx = -b.dir * 3 * TS * Math.max(0, 1 - b.at); if (b.at > 1) b.go('walk'); }
        else b.go('walk');
        b.fall(dt); return;
      }
      /* ---- phase 3: on foot, on the windy ledge ---- */
      if (b.act === 'wreck') {
        b.pose = 'wreck'; b.vx = 0; b.wreckK = Math.min(1, b.at / 1.2);
        if (b.at > 0.3 && b.h !== 90) { baronSize(b, 34, 90, true); g.burst(b.cx, b.y + 40, 40, '#d8a86a', 'debris'); g.burst(b.cx, b.y + 40, 20, '#5a4a3a', 'debris'); }
        if (b.at > 1.4) b.go('run');
        b.fall(dt); return;
      }
      if (b.act === 'run') {
        b.pose = 'run'; if (first) b.face();
        b.vx = b.dir * 5.5 * TS; if (b.onGround && Math.random() < dt * 1.5) b.vy = -7 * TS;
        if (b.at > 0.2 && (b.hitWall || b.x <= b.arenaX0 + 2 || b.x >= b.arenaX1 - b.w - 2)) { b.cycle++; b.go(!baronOut(b) && b.thrown < b.quota ? 'throw' : ['taunt', 'flash', 'hop'][b.cycle % 3]); }
        else if (b.at > 2.6) b.go('taunt');
      } else if (b.act === 'taunt') {
        b.vx = 0; b.face(); b.pose = 'taunt';
        if (first) K.say(g, b, pick(['YOU\'LL NEVER GET THIS ONE!', 'IT\'S MINE! MINE!', 'CATCH ME IF YOU CAN!']), '#ffd84a');
        if (b.at > 1.1) { b.dir = -b.dir; b.go('run'); }
      } else if (b.act === 'throw') {
        b.vx = 0; b.face(); b.pose = 'wind';
        if (first) { K.say(g, b, 'THE LAST ONE! CATCH!', '#ffd84a'); Sound.play('throw', { pitch: 0.7, vol: 0.4 }); }
        if (b.at > 0.85 && !b.fired) { b.fired = true; baronThrow(b, b.cx + b.dir * 16, b.y + 16); }
        if (b.at > 1.4) { b.fired = false; b.dir = -b.dir; b.go('run'); }
      } else if (b.act === 'flash') {
        b.vx = 0; b.face(); b.pose = b.at < 0.7 ? 'aim' : 'flash';
        if (first) K.say(g, b, 'SMILE FOR THE SHRINK-O-MATIC!', '#8af0ff');
        if (b.at > 0.7 && !b.fired) { b.fired = true; g.flash = Math.max(g.flash || 0, 0.4); TourKit.sfx('camera_flash', 'laser', { vol: 0.6 }); tourFire(g, b.cx + b.dir * 30, b.floorY - 30, { kind: 'beam', vx: b.dir * 12 * TS, w: 44, h: 14, life: 2, thru: true, col: '#8af0ff', art: shrinkBeamArt }); }
        if (b.at > 1.2) { b.fired = false; b.dir = -b.dir; b.go('run'); }
      } else if (b.act === 'hop') {
        b.pose = 'hop';
        if (first) { b.face(); b.vy = -13 * TS; b.vx = b.dir * 4 * TS; K.say(g, b, 'HUP!', '#ffd84a'); }
        if (b.onGround && b.at > 0.3) b.go('run');
      } else if (b.act === 'tumble') { b.pose = 'tumble'; b.vx = -b.dir * 4 * TS * Math.max(0, 1 - b.at); if (b.at > 1.1) b.go('run'); }
      else b.go('run');
      b.fall(dt);
    },
    hurt(b) {
      const g = b.g, ph = b.phase || 1;
      if (ph === 1) { K.say(g, b, pick(['MY PAINTWORK!', 'THAT WAS NOT YOURS TO RETURN!', 'HOW RUDE!']), '#ffd84a'); b.go('reel'); }
      else if (ph === 2) { b.parts = Math.max(0, (b.parts || 0) - 1); K.say(g, b, pick(['MY BRIC! MY BRAC!', 'NOT THE WINDMILL ARM!', 'WARRANTY VOID!']), '#ffd84a'); g.burst(b.cx, b.y + 30, 20, '#d8a86a', 'debris'); b.go('stagger'); }
      else { K.say(g, b, pick(['OW! MY MONOCLE!', 'UNHAND MY LANDMARK!']), '#ffd84a'); b.go('tumble'); }
      g.burst(b.cx, b.y + 20, 16, '#ffd84a', 'confetti');
    },
    draw(b, ctx, t) {
      const ph = b.phase || 1, d = b.dir || 1, P = b.pose;
      if (ph === 1 || b.act === 'crash') {
        const cy = b.y + 40, tilt = b.act === 'swoop' ? (b.sdir || 1) * 0.12 : b.act === 'reel' ? Math.sin(t * 14) * 0.15 : b.act === 'crash' ? Math.min(1, b.at) * 0.5 : 0;
        if (b.act === 'crash' && b.landed) { if ((b.mechK || 0) < 1) { ctx.save(); ctx.globalAlpha = 1 - b.mechK; TourVillain.blimp(ctx, b.cx, b.y + b.h - 40, 1, t); ctx.restore(); } mechArt(ctx, b, t); return; }
        ctx.save(); ctx.translate(b.cx, cy); ctx.rotate(tilt);
        TourVillain.blimp(ctx, 0, 0, 1, t);
        for (let k = 0; k < 3; k++) jarArt(ctx, -30 + k * 30, 72, LANDMARKS[k].id, t, 0.42, b.thrown > k);
        if (b.act !== 'crash') drawChinka(ctx, { x: -26, y: 54, scale: 0.36, t, pose: 'captive', facing: 1 });
        ctx.save(); ctx.scale(d, 1); TourVillain.draw(ctx, 18, 54, 0.42, t, P === 'wind' ? 'empty' : P === 'drop' ? 'flash' : null); ctx.restore();
        if (P === 'wind') { const sh = Math.sin(t * 40) * 2; jarArt(ctx, 0 + sh, -44, LANDMARKS[Math.min(b.thrown, 6)].id, t, 0.8, false); ctx.fillStyle = '#ffd84a'; ctx.font = `12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', 0, -86); }
        ctx.restore();
        return;
      }
      if (ph === 2) { mechArt(ctx, b, t); return; }
      // phase 3: the little Baron on foot (and, at the end, shrunk inside his own snow globe)
      if (b.act === 'wreck' && b.at < 0.3) { mechArt(ctx, b, t); return; }
      const s = b.act === 'finale' ? 1 - (b.shrinkK || 0) * 0.68 : 1;
      ctx.save(); ctx.translate(b.cx, b.y + b.h);
      if (P === 'tumble') ctx.rotate(-d * Math.min(1, b.at) * TAU * 0.5 * Math.max(0, 1 - b.at * 0.3));
      if (P === 'run') ctx.rotate(d * 0.12);
      ctx.scale(d * s, s);
      TourVillain.draw(ctx, 0, 0, 1, t, P === 'wind' ? 'empty' : P === 'flash' || P === 'aim' ? 'flash' : null);
      if (P === 'wind' || P === 'taunt' || P === 'run') { const sh = P === 'wind' ? Math.sin(t * 40) * 2 : 0; jarArt(ctx, 8 + sh, P === 'wind' ? -92 : -40, LANDMARKS[6].id, t, 0.7, b.thrown > 6); if (P === 'wind') { ctx.fillStyle = '#ffd84a'; ctx.font = `12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', 8, -134); } }
      ctx.restore();
      if (b.act === 'finale' && (b.shrinkK || 0) >= 1) { ctx.save(); ctx.translate(b.cx, b.y + b.h); jarArt(ctx, 0, 2, 'np', t, 1.25, 'dome'); ctx.restore(); }
      if (P === 'tumble') TourKit.dizzy(ctx, b.cx, b.y - 8, t);
    }
  }
};
Object.assign(entities, { npRoof: NpRoof, npLandmark: NpLandmark, npChinka: NpChinka, npGale: NpGale });

/* ---------------- music: bamboo flute, a bowed string, plucked lute, madal hand drums ---------------- */
const tracks = {
  tour_np: {
    bpm: 100, bars: 8, rv: 0.38, dl: 0.18,
    ch: 'D G D A Bm G D A',
    ld: 'A5:4 B5:2 D6:2 E6:6 D6:2 | B5:4 A5:4 F#5:8 | A5:2 B5:2 D6:4 F#6:4 E6:2 D6:2 | E6:12 .:4 | F#6:4 E6:2 D6:2 B5:4 A5:4 | B5:2 D6:2 B5:2 A5:2 G5:8 | A5:4 D6:4 F#6:2 E6:2 D6:4 | E6:12 .:4',
    li: 'whistle', lv: 0.12,
    l2: 'D5:16 | B4:16 | D5:16 | C#5:16 | D5:16 | B4:16 | A4:16 | C#5:16', l2i: 'reed', l2v: 0.035,
    bp: 'r...f...r...o.f.', bi: 'pluckb', bv: 0.24,
    ap: '0.2.1.3.2.4.3.1.', ai: 'harp', av: 0.035, ao: 64,
    dr: ['d.....d...d.....', '....b.......b.b.', '..t.......t...t.', 'n.n.n.n.n.n.n.n.'], dv: 0.38
  },
  tour_np_night: {
    bpm: 80, bars: 8, rv: 0.65, dl: 0.3,
    ch: 'Em Em C C Am Am B B',
    ld: 'B5:8 E6:4 D6:4 | B5:12 .:4 | C6:8 E6:4 G6:4 | E6:12 .:4 | A5:8 C6:4 E6:4 | B5:12 .:4 | A5:4 B5:4 D#6:8 | B5:12 .:4',
    li: 'theremin', lv: 0.1,
    pd: 'c---------------', pi: 'pad', pv: 0.05, po: 48,
    bp: 'r.......r.......', bi: 'sub', bv: 0.22,
    ap: '0...2...4...2...', ai: 'glass', av: 0.03, ao: 70,
    dr: ['d.......d.......', '......t.......t.', '..n...n...n...n.'], dv: 0.28
  },
  tour_np_ice: {
    bpm: 132, bars: 8, rv: 0.3, dl: 0.14,
    ch: 'Am F C G Am F E E',
    ld: 'E5:2 A5:2 C6:2 E6:2 D6:4 C6:4 | A5:2 C6:2 F6:4 E6:4 C6:4 | G5:2 C6:2 E6:2 G6:2 F6:4 E6:4 | D6:2 B5:2 G5:4 B5:8 | E6:2 A6:2 G6:2 E6:2 C6:4 A5:4 | F5:2 A5:2 C6:4 F6:8 | E6:2 D6:2 C6:2 B5:2 G#5:4 B5:4 | E6:12 .:4',
    li: 'pulse', lv: 0.09,
    bp: 'r.r.o.r.r.r.o.f.', bi: 'pluckb', bv: 0.28,
    ap: '0.2.4.2.0.2.4.2.', ai: 'bell', av: 0.03, ao: 72,
    dr: ['k...k...k...k...', '....s.......s...', 'h.h.h.h.h.h.h.hh', 'd.....d.........'], dv: 0.4
  },
  tour_np_fort: {
    bpm: 116, bars: 8, rv: 0.25, dl: 0.12,
    ch: 'Dm Dm A7 A7 Gm Dm E7 A7',
    ld: 'D5:2 F5:2 A5:2 D6:2 C#6:2 D6:2 A5:4 | A5:2 C#6:2 E6:2 G6:2 F6:2 E6:2 C#6:4 | D6:2 F6:2 D6:2 A5:2 F5:4 D5:4 | E5:2 G5:2 C#6:4 A5:8 | G5:2 A#5:2 D6:2 G6:2 F6:4 D6:4 | F6:2 E6:2 D6:2 A5:2 D6:8 | E6:2 D6:2 C6:2 B5:2 G#5:4 E5:4 | A5:2 C#6:2 E6:4 A6:4 .:4',
    li: 'calliope', lv: 0.09,
    bp: 'r...o...r...o...', bi: 'sub', bv: 0.26,
    a2: '..c...c...c...c.', a2i: 'stab', a2v: 0.04, a2o: 60,
    dr: ['k.......k.......', '....s.......s...', 'h...h...h...h.h.', '..t.......t.t...'], dv: 0.38
  },
  tour_np_boss: {
    bpm: 168, bars: 8, rv: 0.22, hx: 0.06,
    ch: 'Dm Bb C A Dm Bb Gm A',
    ld: 'D6:2 F6:2 A6:2 F6:2 D6:2 A5:2 F5:4 | D6:2 C6:2 A#5:2 A5:2 F5:8 | C6:2 E6:2 G6:2 E6:2 C6:2 G5:2 E5:4 | E6:2 C#6:2 A5:4 E5:8 | F6:2 E6:2 D6:2 A5:2 D6:4 F6:4 | D6:2 C6:2 A#5:2 F5:2 A#5:8 | G5:2 A#5:2 D6:2 G6:2 F6:4 E6:4 | C#6:2 E6:2 A6:8 .:4',
    li: 'brass', lv: 0.1,
    l2: 'D5:8 F5:8 | D5:8 A#4:8 | C5:8 E5:8 | C#5:16 | D5:8 F5:8 | D5:8 A#4:8 | G4:8 A#4:8 | C#5:16', l2i: 'strings', l2v: 0.04,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'sawb', bv: 0.28,
    ap: 'c-..c-..c-..c-..', ai: 'stab', av: 0.035, ao: 60,
    dr: ['k...k...k...k...', '....s.......s.s.', 'h.h.h.h.h.h.h.h.', 'd..d..d...d..d..'], dv: 0.46
  }
};

/* ---------------- the five levels ---------------- */
const COIN = { name: 'GOLDEN MOHAR', draw(ctx, x, y) {
  const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 9); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.6, '#ffd24a'); g.addColorStop(1, '#c8901a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#a8701a'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); } ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#c8901a'; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 5, y - 6, 2, 2);
} };
Tour.country({
  id: 'np', colors: COL, tagline: 'Suspension bridges, a yak named Hrumph and the roof of the world',
  themes, painters, dyn, decor, decorLights, enemies, entities, pieces: P, boss, power, tracks,
  music: { level: 'tour_np', boss: 'tour_np_boss' },
  landmark: 'the snow globes of the whole world',
  arrival: 'Namaste, Brady! The Baron\'s fortress is up in the mountains, full of every landmark he stole. A yak has offered to carry you. I said yes for you. ♥ C',
  emblem(ctx, x, y, r, t) { ctx.save(); ctx.translate(x, y); peak(ctx, 0, r * 0.7, r * 2, r * 1.5, '#5a7ab8', '#ffffff', 3); ctx.restore(); },
  coin: COIN,
  star: { name: 'GOLDEN RHODODENDRON', draw(ctx, x, y, t) { for (let k = 0; k < 5; k++) { const a = k * TAU / 5 + Math.sin(t * 2) * 0.1; ctx.fillStyle = k % 2 ? '#ffe070' : '#ffd24a'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 5.5, 4, a, 0, TAU); ctx.fill(); } ctx.fillStyle = '#c8901a'; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill(); } },
  levels: [
    { name: 'Suspension Bridges', style: 'run', theme: 'np_hills', gyMin: 8,
      gimmick: 'A yak pen lends Brady a shaggy yak (it walks right up stone steps); long suspension bridges sag under every step and some planks are missing; momo dumplings hop, monal pheasants swoop',
      enemies: [['npMomo', 2], ['npRoti', 1], ['npMonal', 1]],
      hint: 'The bridges sag where you stand. Mind the missing planks!',
      postcard: 'These bridges bounce when you walk on them! I closed my eyes on the long one. Don\'t tell anyone. ♥ C',
      script: [['pen', { first: true }], 'terrace', ['bridge', { n: 10 }], 'momos', ['bridge', { n: 12, holes: [3, 9] }], 'cp', ['enemies', { n: 2 }], ['terrace', { gold: true }], ['bridge', { n: 14, holes: [3, 6, 11], gold: true }], ['slope', { n: 4, enemy: 'npMomo' }], ['bridge', { n: 9, monal: true }], 'bonus', 'end'] },
    { name: 'Yak Caravan Pass', style: 'run', theme: 'np_pass', gyMin: 5,
      gimmick: 'Ride the yak up the stone stairways of the high pass and CHARGE through snow-choked gullies; marmots pelt you with pebbles; snowballs roll down the icy stretches',
      enemies: [['npSnowball', 2], ['npMarmot', 1], ['npMonal', 1]],
      hint: 'THROW while riding the yak to charge through the packed snow',
      postcard: 'The yak and I have an understanding now. He grunts, I say thank you. The pass is beautiful. ♥ C',
      script: [['pen', { first: true }], ['slope', { n: 6 }], ['snowwall', { first: true }], 'marmots', ['slope', { n: 8, down: true }], 'cp', 'icy', ['snowwall', {}], ['slope', { n: 7, gold: true }], ['marmots', { gold: true }], 'snowwall', ['slope', { n: 5, down: true }], 'bonus', 'end'] },
    { name: 'Blizzard Night', style: 'night', theme: 'np_blizzard', gyMin: 8,
      gimmick: 'White-out gusts blow Brady backwards: shelter in the lee of the boulders, cross the crevasses in the lulls; a snowball-throwing yeti; snow walls for the yak',
      enemies: [['npSnowball', 2], ['npYeti', 1]],
      hint: 'When the white-out hits, hide behind a boulder. Jump the crevasses between gusts',
      postcard: 'I can\'t see a thing up here, Brady. But I can hear a yeti humming. It\'s a nice tune. ♥ C',
      script: ['storm', ['pen', { first: true }], 'shelter', 'yeti', ['shelter', { n: 3 }], ['snowwall', {}], 'cp', ['shelter', { n: 3, gold: true }], ['yeti', { two: true }], 'snowwall', ['shelter', { n: 4 }], 'bonus', 'end'] },
    { name: 'Khumbu Icefall', style: 'climb', theme: 'np_icefall', W: 24, H: 104,
      gimmick: 'Climb the great icefall: aluminium ladder bridges over the crevasses, icicles that drop when you pass beneath, seracs that crumble underfoot, alpine choughs',
      enemies: [['npChough', 2]],
      hint: 'Icicles shiver before they drop. Don\'t stand on the seracs for long!',
      postcard: 'The ice up here groans like an old house. The Baron\'s fortress is right at the top. ♥ C',
      script: ['cstart', ['iledges', { n: 4 }], 'ladders', 'icicles', 'ccp', 'seracs', ['ladders', { n: 3, gold: true }], ['iledges', { n: 3, flip: true }], 'icicles', 'seracs'] },
    { name: "Baron's Fortress", style: 'castle', theme: 'np_fortress', boss: 'np_baron', arena: 'summit', arenaW: 30, roof: false,
      gimmick: 'The Baron\'s vault: shrink-ray security cameras sweep the halls, wind-up souvenir goons, crate walls for the yak to smash, conveyor floors; then Baron Bric-a-Brac on the summit, who throws the stolen landmarks (kick them back!): his airship, his bric-a-brac mech, then on foot in the gales',
      enemies: [['npTinBot', 2], ['npBobble', 2], ['npGlobe', 1]],
      hint: 'Stay out of the camera beams! The Baron throws the stolen landmarks: kick them right back at him',
      postcard: 'WE DID IT, BRADY! Every landmark is back to size and the Baron is a snow globe. Let\'s go home. ♥ C',
      script: [['pen', {}], 'gallery', ['cameras', { n: 2 }], ['enemies', { n: 2 }], ['snowwall', { look: 'crates' }], 'cp', ['cameras', { n: 3, gold: true }], 'belts', ['gallery', { item: 'star' }], 'arena'] }
  ]
});
})();
