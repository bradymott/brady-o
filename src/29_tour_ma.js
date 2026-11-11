/* ============================================================
   MOROCCO (world 5): the country's art, cast, objects and bosses.
   The levels (v2 format, LEVEL_OVERHAUL.md §2) are in 29_tour_ma_levels.js:
   5-1 Souk Labyrinth       MAZE   rug doors, spice-colour clues, rug moths, a lantern shop with a secret
   5-2 Sahara Caravan       SCROLL camels over quicksand, sandstorms, mirage slabs; door 22 to World 22
   5-3 Chefchaouen Blue     PHASE  the sun-moon lantern flips the blue medina between day and night
   5-4 Kasbah of the Brass Owl FORT kasbah walls, a goat-filled argan tree, the Brass Owl mini-boss
   5-5 Riad of Fountains    LAIR   fountain galleries, then Berrad the Magnificent (a grand brass teapot)
   5-6 Carpet Skies         SKY    (secret) flying rugs over the High Atlas
   ============================================================ */
(() => {
const COL = { a: '#ffd23a', b: '#1a8a6a', c: '#c8323a' };
const K = TourKit;
const ZEL = ['#1a6ab8', '#1a9a8a', '#f4ecd8', '#c8a03a', '#2a3a6a'];   // zellige tile colours
const RUG = ['#b8222a', '#e8a02a', '#2a4a9a', '#f4e8d0'];
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };
if (typeof LIQUIDS !== 'undefined') LIQUIDS.quicksand = ['#e8c47a', '#c89a5a', '#8a6a3a', 'rgba(255,240,200,0.2)', null, 'rgba(255,240,210,0.5)'];

/* ---------------- background painters ---------------- */
function arch(ctx, x, y, w, h) { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + w * 0.6); ctx.quadraticCurveTo(x, y, x + w / 2, y - w * 0.2); ctx.quadraticCurveTo(x + w, y, x + w, y + w * 0.6); ctx.lineTo(x + w, y + h); ctx.closePath(); }
const painters = {
  // ochre walls of the medina with arched doors; a minaret far off, as respectful background
  maMedina(ctx, L, rng, H) {
    let x = 0;
    while (x < BG_W) {
      const w = 60 + rng() * 70, h = 70 + rng() * 80;
      ctx.fillStyle = shade(L.color, (rng() - 0.5) * 0.12); ctx.fillRect(x, L.base - h, w - 3, h + (H - L.base));
      ctx.fillStyle = shade(L.color, -0.35); arch(ctx, x + w / 2 - 9, L.base - 34, 18, 34); ctx.fill();
      if (rng() < 0.6) { ctx.fillStyle = ZEL[Math.floor(rng() * 2)]; arch(ctx, x + 10, L.base - h + 16, 12, 18); ctx.fill(); }
      x += w;
    }
    if (L.minaret) { const mx = 700; ctx.fillStyle = shade(L.color, -0.1); ctx.fillRect(mx, L.base - 220, 40, 220); ctx.fillRect(mx + 8, L.base - 248, 24, 28); ctx.fillStyle = ZEL[1]; ctx.fillRect(mx, L.base - 200, 40, 8); ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.arc(mx + 20, L.base - 254, 5, 0, TAU); ctx.fill(); }
  },
  // the Sahara: dune ridges in the evening light
  maSahara(ctx, L, rng, H) {
    for (let r = 0; r < 3; r++) {
      ctx.fillStyle = shade(L.color, r * 0.08 - 0.08); ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= BG_W; x += 12) ctx.lineTo(x, L.base + r * 26 - 40 * Math.abs(Math.sin(x * 0.006 + r * 1.7)) - 10 * Math.sin(x * 0.02));
      ctx.lineTo(BG_W, H); ctx.fill();
    }
    for (let k = 0; k < 5; k++) { const cx = 120 + k * 22; ctx.fillStyle = 'rgba(80,50,30,0.6)'; ctx.beginPath(); ctx.ellipse(cx, L.base - 48, 7, 4, 0, 0, TAU); ctx.fill(); ctx.fillRect(cx + 4, L.base - 56, 2, 8); ctx.fillRect(cx - 5, L.base - 45, 1.5, 7); ctx.fillRect(cx + 3, L.base - 45, 1.5, 7); }
  },
  // the snowy High Atlas
  maAtlas(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H);
    const pts = []; for (let x = 0; x <= BG_W; x += 32) { const y = L.base - 120 - 80 * Math.abs(Math.sin(x * 0.007)) - rng() * 30; pts.push([x, y]); ctx.lineTo(x, y); }
    ctx.lineTo(BG_W, H); ctx.fill();
    ctx.fillStyle = '#ffffff'; for (let i = 1; i < pts.length - 1; i++) { const [x, y] = pts[i]; if (y < L.base - 160) { ctx.beginPath(); ctx.moveTo(x - 18, y + 22); ctx.lineTo(x, y); ctx.lineTo(x + 18, y + 22); ctx.fill(); } }
  },
  // a kasbah of red earth with crenellated towers
  maKasbah(ctx, L, rng, H) {
    for (let x = 30; x < BG_W; x += 220) wrapDraw(x, 180, xx => {
      ctx.fillStyle = L.color; ctx.fillRect(xx, L.base - 90, 160, 90 + (H - L.base));
      for (const tx of [xx - 10, xx + 140]) { ctx.fillRect(tx, L.base - 130, 30, 130); for (let k = 0; k < 3; k++) ctx.fillRect(tx + k * 11, L.base - 138, 7, 8); }
      ctx.fillStyle = shade(L.color, -0.3); for (let k = 0; k < 4; k++) ctx.fillRect(xx + 20 + k * 34, L.base - 70, 8, 14);
    });
  }  ,
  // the green Rif mountains behind Chefchaouen, a scatter of tiny blue houses on the lower slope
  maRif(ctx, L, rng, H) {
    for (let r = 0; r < 2; r++) {
      ctx.fillStyle = shade(L.color, r * 0.08); ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= BG_W; x += 24) ctx.lineTo(x, L.base - 70 + r * 30 - 60 * Math.abs(Math.sin(x * 0.004 + r * 2.1)) - 18 * Math.sin(x * 0.017 + r));
      ctx.lineTo(BG_W, H); ctx.fill();
    }
    for (let k = 0; k < 40; k++) { const x = rng() * BG_W, y = L.base - 10 - rng() * 30; ctx.fillStyle = rng() < 0.5 ? shade('#9ac4ec', L.night ? -0.5 : 0) : shade('#c8e0f8', L.night ? -0.5 : 0); ctx.fillRect(x, y, 6, 5); }
  },
  // the blue medina: stepped blue-washed houses, darker doors, stairs between them, flower pots on the walls
  maBlueTown(ctx, L, rng, H) {
    let x = 0;
    while (x < BG_W) {
      const w = 50 + rng() * 60, h = 50 + rng() * 70, c = shade(L.color, (rng() - 0.5) * 0.18);
      ctx.fillStyle = c; ctx.fillRect(x, L.base - h, w - 4, h + (H - L.base));
      ctx.fillStyle = shade(c, 0.25); ctx.fillRect(x, L.base - h, w - 4, 4);
      ctx.fillStyle = shade(c, -0.35); arch(ctx, x + w / 2 - 8, L.base - 30, 16, 30); ctx.fill();
      if (rng() < 0.7) { ctx.fillStyle = L.night ? '#ffc870' : shade(c, -0.3); ctx.fillRect(x + 8, L.base - h + 14, 9, 11); }
      if (rng() < 0.6) { for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#e8503a', '#f0c040', '#3aa86a'][k]; ctx.fillRect(x + 6 + k * 9, L.base - h * 0.55, 6, 5); } }
      if (rng() < 0.35) { ctx.fillStyle = shade(c, 0.12); for (let s = 0; s < 4; s++) ctx.fillRect(x + w - 4, L.base - s * 9 - 9, 12 - s * 2, 9); }
      x += w;
    }
  },
  // the inside of a tent: cloth in broad stripes, a hanging rug between the poles
  maTentWall(ctx, L, rng, H) {
    for (let x = 0; x < BG_W; x += 36) { ctx.fillStyle = (x / 36) % 2 ? shade(L.color, 0.05) : '#e8c890'; ctx.fillRect(x, 0, 36, H); }
    for (let x = 60; x < BG_W; x += 260) { ctx.fillStyle = '#5a3a22'; ctx.fillRect(x, 0, 8, H); ctx.fillStyle = RUG[Math.floor(rng() * 3)]; ctx.fillRect(x + 40, L.base - 200, 110, 150); ctx.fillStyle = RUG[3]; ctx.fillRect(x + 48, L.base - 192, 94, 4); ctx.fillRect(x + 48, L.base - 62, 94, 4); ctx.fillStyle = RUG[(Math.floor(x / 260) + 1) % 3]; for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(x + 70 + k * 25, L.base - 125); ctx.rotate(Math.PI / 4); ctx.fillRect(-8, -8, 16, 16); ctx.restore(); } }
  },
  // the lantern shop's back wall: shelves of brass lanterns (some glowing) and hanging chains
  maShopWall(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let y = L.base - 260; y < L.base; y += 64) { ctx.fillStyle = '#2a160e'; ctx.fillRect(0, y + 44, BG_W, 6);
      for (let x = 10 + rng() * 20; x < BG_W; x += 34 + rng() * 20) { const on = rng() < 0.4, s = 0.7 + rng() * 0.6; ctx.fillStyle = on ? '#e8c050' : '#8a6a3a'; ctx.beginPath(); ctx.moveTo(x - 7 * s, y + 44 - 26 * s); ctx.lineTo(x + 7 * s, y + 44 - 26 * s); ctx.lineTo(x + 9 * s, y + 44 - 8 * s); ctx.lineTo(x, y + 44); ctx.lineTo(x - 9 * s, y + 44 - 8 * s); ctx.closePath(); ctx.fill(); if (on) { ctx.fillStyle = 'rgba(255,220,140,0.9)'; ctx.fillRect(x - 2.5 * s, y + 44 - 20 * s, 5 * s, 8 * s); } } }
  },
  // banks of big soft clouds (5-6), a few storks gliding between them
  maClouds(ctx, L, rng, H) {
    for (let k = 0; k < 9; k++) {
      const cx = rng() * BG_W, cy = L.base - 40 - rng() * 120, s = 0.7 + rng() * 0.9;
      ctx.fillStyle = shade(L.color, -0.06); for (const [dx, dy, r] of [[-40, 10, 30], [0, 0, 40], [42, 8, 32], [80, 16, 22]]) { ctx.beginPath(); ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, TAU); ctx.fill(); }
      ctx.fillStyle = L.color; for (const [dx, dy, r] of [[-36, 4, 26], [2, -6, 34], [40, 2, 26]]) { ctx.beginPath(); ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, TAU); ctx.fill(); }
    }
    ctx.strokeStyle = 'rgba(40,40,52,0.6)'; ctx.lineWidth = 2;
    for (let k = 0; k < 4; k++) { const x = rng() * BG_W, y = L.base - 120 - rng() * 80; ctx.beginPath(); ctx.moveTo(x - 10, y + 3); ctx.quadraticCurveTo(x - 5, y - 3, x, y); ctx.quadraticCurveTo(x + 5, y - 3, x + 10, y + 3); ctx.stroke(); }
  }
};
const dyn = {
  // drifting sand in the storm
  maSand(ctx, L, camX, oy, S, W, t) {
    ctx.strokeStyle = 'rgba(240,200,140,0.35)'; ctx.lineWidth = 1.5 * S;
    for (let k = 0; k < 24; k++) { const x = ((k * 97 - t * 220) % W + W) % W, y = oy + (40 + (k * 53) % 260) * S; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30 * S, y + 2 * S); ctx.stroke(); }
  }
};

/* ---------------- tiles: earth walls, zellige item boxes ---------------- */
function zelligeBox(ctx, th, f) {
  ctx.save(); ctx.shadowColor = 'rgba(255,220,120,0.8)'; ctx.shadowBlur = 4 + f * 1.5;
  ctx.fillStyle = ZEL[0]; rr(ctx, 1, 2, TS - 2, TS - 3, 3); ctx.fill(); ctx.restore();
  ctx.save(); rr(ctx, 1, 2, TS - 2, TS - 3, 3); ctx.clip();
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = ZEL[(i + j) % 2 ? 2 : 1]; ctx.save(); ctx.translate(6 + i * 10, 7 + j * 10); ctx.rotate(Math.PI / 4); ctx.fillRect(-3.5, -3.5, 7, 7); ctx.restore(); }
  ctx.fillStyle = ZEL[3]; ctx.beginPath(); for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, r = k % 2 ? 4 : 8; ctx.lineTo(TS / 2 + Math.cos(a) * r, TS / 2 + 1 + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#0e2a4a'; ctx.lineWidth = 1.2; rr(ctx, 1, 2, TS - 2, TS - 3, 3); ctx.stroke();
}
function zelligeUsed(ctx) { ctx.fillStyle = '#8a8a90'; rr(ctx, 1, 3, TS - 2, TS - 4, 3); ctx.fill(); ctx.strokeStyle = '#5a5a60'; ctx.lineWidth = 1.2; ctx.stroke(); }
const base = {
  ground: { style: 'grass', cap: '#d8a070', capHi: '#f0c890', dirt: '#c87a4a', dirt2: '#9a5a32', rock: '#d88a5a' },
  brick: { style: 'stone', c1: '#d8905a', c2: '#a86a3a', mortar: '#7a4a2a' }, hard: { c1: '#d8905a', c2: '#a8683a' },
  semi: { style: 'plank', c1: '#8a5a3a', c2: '#5a3a22' }, pillar: { c1: '#e8d8c0', c2: '#b8a888', cap: '#1a8a8a', style: 'column' },
  accent: COL.a, qblockArt: zelligeBox, usedArt: zelligeUsed, tint: {}, bloom: 0.18
};
const themes = {
  ma_souk: Object.assign({}, base, {
    rays: '#fff0c8',
    name: 'The Souk', music: 'tour_ma', particles: 'motes',
    sky: ['#3a8ae8', '#9ad0ff', '#fff0d8'], horizonGlow: '#ffe8c0', celestial: { type: 'sun', x: 0.6, y: 0.12, r: 38, color: '#fffbe0', glow: '#ffd890' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'maAtlas', color: '#a8a8c8', base: 300, f: 0.02, blur: true }, { kind: 'maMedina', color: '#e8b088', base: 300, f: 0.08, minaret: true }, { kind: 'maMedina', color: '#d8946a', base: 352, f: 0.25 }],
    fog: '#ffe8c8', decor: ['maPots', 'maLantern', 'maSpiceSacks']
  }),
  ma_sahara: Object.assign({}, base, {
    rays: '#ffd8a0',
    name: 'The Sahara', music: 'tour_ma_desert', particles: 'sand', liquid: 'quicksand',
    ground: { style: 'grass', cap: '#f0c87a', capHi: '#ffe0a0', dirt: '#e8b060', dirt2: '#c88a40', rock: '#d89a50' },
    sky: ['#ff7a3a', '#ffb86a', '#ffe8b8'], horizonGlow: '#ffb070', celestial: { type: 'sun', x: 0.75, y: 0.32, r: 52, color: '#fff0c0', glow: '#ff9050' }, stars: 0,
    layers: [{ kind: 'maSahara', color: '#e8a860', base: 300, f: 0.04, dyn: 'maSand' }, { kind: 'maSahara', color: '#f0b870', base: 350, f: 0.2 }],
    fog: '#ffd8a0', decor: ['maDunePalm', 'maBones']
  }),
  ma_atlas: Object.assign({}, base, {
    name: 'The Atlas', music: 'tour_ma_desert', particles: 'leaves',
    sky: ['#3a7ad8', '#a0d0ff', '#ffffff'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.2, y: 0.14, r: 32, color: '#fffbe8', glow: '#ffffff' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'maAtlas', color: '#8a8ab0', base: 330, f: 0.03 }, { kind: 'maKasbah', color: '#c8784a', base: 360, f: 0.1 }],
    fog: '#ffffff', ground: { style: 'grass', cap: '#7aa84a', capHi: '#a8d070', dirt: '#b8704a', dirt2: '#8a4a2a', rock: '#c8805a' }
  }),
  ma_night: Object.assign({}, base, {
    name: 'Jemaa el-Fnaa', music: 'tour_ma_night', particles: 'embers',
    sky: ['#0e0a24', '#2a1a40', '#6a3a4a'], horizonGlow: '#ff9a5a', celestial: { type: 'moon', x: 0.8, y: 0.14, r: 20, color: '#fff4e0', glow: '#ffc890' }, stars: 0.8,
    layers: [{ kind: 'maMedina', color: '#3a2a3a', base: 320, f: 0.08, minaret: true }, { kind: 'maMedina', color: '#2a1e2a', base: 355, f: 0.22 }],
    fog: '#ff9a5a', darkness: 0.45, decor: ['maLantern', 'maPots']
  }),
  ma_riad: Object.assign({}, base, {
    rays: '#ffffff',
    name: 'Riad of Fountains', music: 'tour_ma', particles: 'motes', liquid: 'sea',
    ground: { style: 'marble', cap: '#f4ecd8', capHi: '#ffffff', dirt: '#e8dcc4', dirt2: '#c8b898', rock: '#d8c8a8' },
    sky: ['#2a6ab8', '#7ab8e8', '#e8f4ff'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.5, y: 0.1, r: 30, color: '#fffbe8', glow: '#ffffff' }, stars: 0,
    layers: [{ kind: 'maMedina', color: '#f0e0c8', base: 330, f: 0.08 }],
    fog: '#e8f4ff', hard: { c1: '#1a6ab8', c2: '#0e3a6a' }, semi: { style: 'plank', c1: '#1a9a8a', c2: '#0e5a5a' }, decor: ['maPots', 'maLantern']
  })
  ,
  // 5-3: Chefchaouen's blue medina by day (the sun-moon lantern swaps it to ma_azul_night)
  ma_azul: Object.assign({}, base, {
    rays: '#ffffff',
    name: 'Chefchaouen Blue', music: 'tour_ma', particles: 'motes',
    sky: ['#3a8ae8', '#a8d8ff', '#f4fbff'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.3, y: 0.12, r: 34, color: '#fffbe8', glow: '#ffffff' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'maRif', color: '#6a9a6a', base: 300, f: 0.04 }, { kind: 'maBlueTown', color: '#7ab4ec', base: 352, f: 0.2 }],
    ground: { style: 'marble', cap: '#eef6ff', capHi: '#ffffff', dirt: '#bcd8f4', dirt2: '#9cc4ec', rock: '#7ab0e8' },
    brick: { style: 'stone', c1: '#7ab4ec', c2: '#4a86d0', mortar: '#2a5aa8' }, hard: { c1: '#5a9ae0', c2: '#2a5aa8' },
    semi: { style: 'plank', c1: '#4a86d0', c2: '#2a5aa8' }, accent: '#ffd23a',
    fog: '#e8f4ff', decor: ['maFlowerPots', 'maPots', 'maFlowerPots']
  }),
  ma_azul_night: Object.assign({}, base, {
    name: 'Chefchaouen by Night', music: 'tour_ma_night', particles: 'fireflies',
    sky: ['#0a0e2a', '#1a2a5a', '#3a3a6a'], horizonGlow: '#5a6aa8', celestial: { type: 'moon', x: 0.72, y: 0.14, r: 22, color: '#fff4e0', glow: '#a8c8ff' }, stars: 0.8,
    layers: [{ kind: 'maRif', color: '#2a3a4a', base: 300, f: 0.04, night: true }, { kind: 'maBlueTown', color: '#34589a', base: 352, f: 0.2, night: true }],
    ground: { style: 'marble', cap: '#8aa8d8', capHi: '#a8c4e8', dirt: '#4a6aa0', dirt2: '#3a5a90', rock: '#5a7ab0' },
    brick: { style: 'stone', c1: '#34589a', c2: '#244080', mortar: '#1a3060' }, hard: { c1: '#3a64a8', c2: '#1a3060' },
    semi: { style: 'plank', c1: '#34589a', c2: '#1a3060' }, accent: '#ffd23a',
    fog: '#3a4a8a', darkness: 0.35, decor: ['maFlowerPots', 'maLantern']
  }),
  // inside a desert tent (5-2's oasis camp, 5-6's sky tent): striped cloth walls, rugs and lanterns
  ma_tent: Object.assign({}, base, {
    name: 'The Tent', music: 'tour_ma_desert', particles: 'motes',
    sky: ['#4a1a14', '#7a3024', '#b86a40'], horizonGlow: '#ffb070', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'maTentWall', color: '#8a3a2a', base: 340, f: 0.04 }],
    ground: { style: 'carpet', cap: '#e8a02a', capHi: '#f4e8d0', dirt: '#b8222a', dirt2: '#a01c24', rock: '#2a4a9a' },
    hard: { c1: '#c8a070', c2: '#8a6a44' }, semi: { style: 'plank', c1: '#8a5a3a', c2: '#5a3a22' },
    fog: '#ffb070', darkness: 0.18, decor: ['maLantern', 'maPots']
  }),
  // inside the lantern shop (5-1's secret): walls hung with lanterns, warm and dim
  ma_lampshop: Object.assign({}, base, {
    name: 'The Lantern Shop', music: 'tour_ma_night', particles: 'embers',
    sky: ['#1a0e14', '#3a1e1e', '#5a3424'], horizonGlow: '#ff9a5a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'maShopWall', color: '#4a2a22', base: 340, f: 0.05 }],
    ground: { style: 'carpet', cap: '#c8a03a', capHi: '#f4e8d0', dirt: '#7a2a20', dirt2: '#5a1e18', rock: '#2a3a6a' },
    hard: { c1: '#9a6038', c2: '#6a3a22' }, semi: { style: 'plank', c1: '#8a5a3a', c2: '#5a3a22' },
    fog: '#ff9a5a', darkness: 0.42, decor: ['maLantern', 'maPots']
  }),
  // 5-6: the carpet skies over the High Atlas
  ma_cielo: Object.assign({}, base, {
    rays: '#fff4e0',
    name: 'Carpet Skies', music: 'tour_ma_desert', particles: 'motes',
    sky: ['#4a8ae0', '#a8d0ff', '#ffe8d0'], horizonGlow: '#ffe0c0', celestial: { type: 'sun', x: 0.8, y: 0.2, r: 40, color: '#fff8e0', glow: '#ffd8a0' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'maAtlas', color: '#a8b0d0', base: 330, f: 0.03, blur: true }, { kind: 'maClouds', color: '#fff2e4', base: 380, f: 0.12 }],
    ground: { style: 'carpet', cap: '#e8a02a', capHi: '#f4e8d0', dirt: '#b8222a', dirt2: '#a01c24', rock: '#2a4a9a' },
    semi: { style: 'plank', c1: '#b8222a', c2: '#7a161c' },
    fog: '#ffe8d0', decor: []
  })
};

/* ---------------- decor ---------------- */
const decor = {
  maPots(ctx, x, y) { for (const [dx, s, c] of [[-8, 1, '#c8603a'], [6, 0.8, '#1a6ab8']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + dx, y - 8 * s, 7 * s, 8 * s, 0, 0, TAU); ctx.fill(); ctx.fillRect(x + dx - 3 * s, y - 18 * s, 6 * s, 4 * s); } },
  maLantern(ctx, x, y, t) { ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 60); ctx.lineTo(x, y - 44); ctx.stroke(); ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.moveTo(x - 6, y - 44); ctx.lineTo(x + 6, y - 44); ctx.lineTo(x + 8, y - 32); ctx.lineTo(x, y - 24); ctx.lineTo(x - 8, y - 32); ctx.closePath(); ctx.fill(); ctx.fillStyle = `rgba(255,${200 + Math.sin(t * 5 + x) * 30},120,0.9)`; ctx.fillRect(x - 3, y - 40, 6, 8); },
  maSpiceSacks(ctx, x, y) { [['#c8322a', -10], ['#e8b81a', 0], ['#7a4a2a', 10]].forEach(([c, dx]) => { ctx.fillStyle = '#e8d8b8'; ctx.fillRect(x + dx - 5, y - 10, 10, 10); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + dx, y - 10, 5, 3, 0, Math.PI, TAU); ctx.fill(); }); },
  maDunePalm(ctx, x, y) { ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6, y - 30, x + 2, y - 60); ctx.stroke(); ctx.fillStyle = '#3a8a3a'; for (let k = 0; k < 6; k++) { ctx.save(); ctx.translate(x + 2, y - 60); ctx.rotate(-Math.PI + k * 0.6); ctx.beginPath(); ctx.ellipse(16, 0, 18, 4, 0.3, 0, TAU); ctx.fill(); ctx.restore(); } },
  maBones(ctx, x, y) { ctx.fillStyle = '#f0e8d0'; ctx.fillRect(x - 8, y - 3, 16, 3); ctx.beginPath(); ctx.arc(x - 8, y - 2, 2.5, 0, TAU); ctx.arc(x + 8, y - 2, 2.5, 0, TAU); ctx.fill(); },
  // a rug draped over a rope between two poles (its top is a bouncy one-way platform)
  maRug(ctx, x, y, t, th, d) {
    const w = d.w, x0 = x - w / 2, top = y - d.h, c = RUG[d.seed % 3];
    // a rug moth (platEater) ate some of its top tiles: leave a gap through the rug there until they regrow
    const A = !d.cut && Game.scene && Game.scene.area, eaten = A && A.eaten && A.eaten.size ? A.eaten : null;
    if (eaten) {
      const row = Math.round(top / TS), c0 = Math.round(x0 / TS), n = Math.round(w / TS), gaps = [];
      for (let q = 0; q < n; q++) if (eaten.has(row * A.W + c0 + q)) gaps.push(q);
      if (gaps.length) { ctx.save(); ctx.beginPath(); let from = x0 - 10; for (const q of gaps) { ctx.rect(from, top - 12, x0 + q * TS - from, d.h + 60); from = x0 + (q + 1) * TS; } ctx.rect(from, top - 12, x0 + w + 10 - from, d.h + 60); ctx.clip(); decor.maRug(ctx, x, y, t, th, Object.assign({}, d, { cut: true })); ctx.restore(); return; }
    }
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x0 - 4, top - 6, 4, d.h + 6); ctx.fillRect(x0 + w, top - 6, 4, d.h + 6);
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x0, top); ctx.quadraticCurveTo(x, top + 8 + Math.sin(t * 2 + d.seed) * 2, x0 + w, top); ctx.lineTo(x0 + w - 6, top + 40); ctx.lineTo(x0 + 6, top + 40); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = RUG[3]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + 10, top + 20); ctx.lineTo(x0 + w - 10, top + 20); ctx.stroke();
    ctx.fillStyle = RUG[(d.seed + 1) % 3]; for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(x0 + w * (k + 1) / 4, top + 28); ctx.rotate(Math.PI / 4); ctx.fillRect(-4, -4, 8, 8); ctx.restore(); }
  },
  // a spice pyramid (its body is solid)
  maSpice(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, c = ['#c8322a', '#e8b81a', '#8a4a1a', '#2a8a3a'][d.seed % 4];
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(x - w / 2 - 4, y - 8, w + 8, 8);
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - w / 2, y - 8); ctx.lineTo(x - 3, y - h - 2); ctx.lineTo(x + 3, y - h - 2); ctx.lineTo(x + w / 2, y - 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(x - 3, y - h); ctx.lineTo(x - w / 4, y - 10); ctx.lineTo(x - w / 2 + 6, y - 10); ctx.closePath(); ctx.fill();
  },
  maBasket(ctx, x, y) { ctx.fillStyle = '#c8a060'; ctx.beginPath(); ctx.moveTo(x - 12, y - 18); ctx.lineTo(x + 12, y - 18); ctx.lineTo(x + 9, y); ctx.lineTo(x - 9, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 11, y - 15 + k * 4); ctx.lineTo(x + 11, y - 15 + k * 4); ctx.stroke(); } },
  // an argan tree (goats climb these!)
  maArgan(ctx, x, y, t, th, d) { ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 8, y - d.h * 0.5, x, y - d.h); ctx.stroke(); ctx.fillStyle = '#4a7a3a'; ctx.beginPath(); ctx.ellipse(x, y - d.h - 10, d.w * 0.55, 30, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8c84a'; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(x - d.w * 0.4 + k * d.w * 0.1, y - d.h - 14 + (k % 3) * 8, 2.5, 0, TAU); ctx.fill(); } },
  // grill smoke rising (it lifts Brady)
  maSmoke(ctx, x, y, t, th, d) {
    ctx.fillStyle = '#3a2a2a'; ctx.fillRect(x - d.w / 2, y - 14, d.w, 14); ctx.fillStyle = `rgba(255,${120 + Math.sin(t * 9) * 40},40,0.8)`; ctx.fillRect(x - d.w / 2 + 4, y - 16, d.w - 8, 3);
    for (let k = 0; k < 10; k++) { const ph = (t * 0.5 + k / 10) % 1; ctx.fillStyle = `rgba(220,210,220,${0.35 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x + Math.sin(k * 1.9 + t) * d.w * 0.3, y - 20 - ph * (d.h - 20), 8 + ph * 10, 0, TAU); ctx.fill(); }
  },
  // a zellige fountain basin
  maFountain(ctx, x, y, t, th, d) {
    ctx.fillStyle = ZEL[1]; ctx.fillRect(x - d.w / 2, y - 18, d.w, 18); for (let k = 0; k < d.w / 10; k++) { ctx.fillStyle = ZEL[k % 2 ? 2 : 0]; ctx.fillRect(x - d.w / 2 + k * 10 + 2, y - 14, 6, 6); }
    ctx.fillStyle = 'rgba(180,230,255,0.85)'; ctx.fillRect(x - d.w / 2 + 3, y - 20, d.w - 6, 3);
  },
  maJet(ctx, x, y, t, th, d) { const g = ctx.createLinearGradient(0, y - d.h, 0, y); g.addColorStop(0, 'rgba(200,240,255,0)'); g.addColorStop(1, 'rgba(200,240,255,0.7)'); ctx.fillStyle = g; ctx.fillRect(x - d.w * 0.3, y - d.h, d.w * 0.6, d.h); for (let k = 0; k < 8; k++) { const ph = (t * 1.2 + k / 8) % 1; ctx.fillStyle = 'rgba(230,250,255,0.8)'; ctx.beginPath(); ctx.arc(x + Math.sin(k * 2 + t * 3) * d.w * 0.25, y - ph * d.h, 2.5, 0, TAU); ctx.fill(); } },
  maArchway(ctx, x, y, t, th, d) { ctx.fillStyle = '#f4ecd8'; ctx.fillRect(x - d.w / 2, y - d.h, d.w, 14); ctx.fillStyle = ZEL[0]; for (let k = 0; k < d.w / 12; k++) ctx.fillRect(x - d.w / 2 + k * 12 + 2, y - d.h + 4, 8, 6); }
};
const decorLights = { maLantern: [100, '#ffc870', -36], maSmoke: [70, '#ff8a3a', -14] };

/* ---------------- enemies ---------------- */
const tagineArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); if (m === 'flat') ctx.scale(1.3, 0.4);
  const lift = m === 'hop' ? 6 : 0;
  ctx.fillStyle = '#b8562a'; ctx.beginPath(); ctx.ellipse(0, -5, 15, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d8743a'; ctx.beginPath(); ctx.moveTo(-13, -8 - lift); ctx.lineTo(0, -30 - lift); ctx.lineTo(13, -8 - lift); ctx.closePath(); ctx.fill();
  ctx.fillStyle = ZEL[0]; ctx.fillRect(-10, -14 - lift, 20, 3);
  ctx.fillStyle = '#e8b81a'; ctx.beginPath(); ctx.arc(0, -31 - lift, 3, 0, TAU); ctx.fill();
  if (lift) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(-4, -8, 3, 0, TAU); ctx.arc(4, -10, 4, 0, TAU); ctx.fill(); }
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, e.dir * 2, -19 - lift, e.dir, 3.2, 2, true);
  ctx.restore();
};
const teapotArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#d8d8e0'; ctx.beginPath(); ctx.ellipse(0, -12, 12, 11, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8, -12); ctx.quadraticCurveTo(20, -14, 22, -26); ctx.lineTo(19, -26); ctx.quadraticCurveTo(16, -16, 8, -8); ctx.fill();
  ctx.fillStyle = '#c8c8d0'; ctx.beginPath(); ctx.moveTo(-7, -21); ctx.lineTo(0, -32); ctx.lineTo(7, -21); ctx.fill();
  ctx.strokeStyle = '#a8a8b0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-12, -12, 6, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 2, -13, 1, 3, 2, true);
  ctx.restore();
};
const cobraArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y + 10);
  ctx.strokeStyle = '#5a7a3a'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 4); ctx.quadraticCurveTo(-8, -8, 0, -16); ctx.stroke(); ctx.lineCap = 'butt';
  ctx.fillStyle = '#6a8a4a'; ctx.beginPath(); ctx.ellipse(0, -22, 9, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8d870'; ctx.beginPath(); ctx.ellipse(0, -20, 4, 5, 0, 0, TAU); ctx.fill();
  K.eyes(ctx, 0, -25, 1, 3, 1.6, true);
  ctx.strokeStyle = '#e8322a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -17); ctx.lineTo(0, -13); ctx.lineTo(-2, -11); ctx.moveTo(0, -13); ctx.lineTo(2, -11); ctx.stroke();
  ctx.restore();
};
const scarabArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y - 9); if (m === 'roll' || m === 'curl') ctx.rotate(e.t * 12 * e.dir);
  ctx.fillStyle = '#1a3a5a'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 9, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#3a8ab8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, 9); ctx.stroke();
  ctx.fillStyle = 'rgba(160,220,255,0.5)'; ctx.beginPath(); ctx.ellipse(-4, -3, 3, 4, 0.3, 0, TAU); ctx.fill();
  if (m !== 'roll' && m !== 'curl' && m !== 'flat' && m !== 'ko') K.eyes(ctx, e.dir * 6, -2, e.dir, 2.4, 1.6, true);
  ctx.restore();
};
const fennecArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#f0d8a8'; ctx.beginPath(); ctx.ellipse(-2, -9, 10, 7, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, -10); ctx.quadraticCurveTo(-20, -14, -18, -4); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -14, 6, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(3, -16); ctx.lineTo(1, -32); ctx.lineTo(8, -18); ctx.fill(); ctx.beginPath(); ctx.moveTo(9, -18); ctx.lineTo(15, -32); ctx.lineTo(13, -15); ctx.fill();
  ctx.fillStyle = '#ffc8b0'; ctx.beginPath(); ctx.moveTo(4, -18); ctx.lineTo(3, -28); ctx.lineTo(7, -19); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(14, -13, 1.5, 0, TAU); ctx.arc(9, -15, 1.4, 0, TAU); ctx.fill();
  for (const lx of [-8, 4]) { ctx.fillStyle = '#f0d8a8'; ctx.fillRect(lx, -4, 3, 4); }
  ctx.restore();
};
const goatArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.ellipse(-2, -14, 13, 8, 0, 0, TAU); ctx.fill();
  for (const lx of [-10, -4, 4, 9]) ctx.fillRect(lx - 1.5, -8, 3, 8);
  ctx.beginPath(); ctx.ellipse(12, -20, 6, 5, 0.3, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#8a7a6a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(10, -26, 5, Math.PI, Math.PI * 1.8); ctx.stroke();
  ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.moveTo(15, -16); ctx.lineTo(16, -11); ctx.lineTo(13, -15); ctx.fill();
  K.eyes(ctx, 13, -21, 1, 2, 1.5, m === 'charge');
  ctx.restore();
};
const orangeArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y - 10); if (m === 'roll' || m === 'curl') ctx.rotate(e.t * 12 * e.dir);
  ctx.fillStyle = '#ff8a1a'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(-3, -3, 3, 0, TAU); ctx.fill();
  if (m !== 'roll' && m !== 'curl' && m !== 'flat' && m !== 'ko') { K.eyes(ctx, e.dir * 3, 0, e.dir, 3, 2, true); ctx.fillStyle = '#3a8a3a'; ctx.beginPath(); ctx.ellipse(2, -11, 4, 2, 0.4, 0, TAU); ctx.fill(); }
  ctx.restore();
};
const snailArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  if (m === 'shell') { ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.arc(0, -9, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let a = 0; a < 8; a += 0.3) ctx.lineTo(Math.cos(a) * (8 - a), -9 + Math.sin(a) * (8 - a)); ctx.stroke(); ctx.fillStyle = '#e8e0f0'; ctx.font = `bold 8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('z', 9, -18); ctx.restore(); return; }
  ctx.fillStyle = '#c8b898'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(12, 0); ctx.quadraticCurveTo(16, -4, 12, -8); ctx.lineTo(-10, -4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#c8b898'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(10, -8); ctx.lineTo(12, -16); ctx.moveTo(13, -7); ctx.lineTo(17, -14); ctx.stroke();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(12, -17, 1.6, 0, TAU); ctx.arc(17, -15, 1.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.arc(-4, -10, 9, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let a = 0; a < 8; a += 0.3) ctx.lineTo(-4 + Math.cos(a) * (8 - a), -10 + Math.sin(a) * (8 - a)); ctx.stroke();
  ctx.restore();
};
const teaDrop = (ctx, s) => { ctx.fillStyle = '#a86a2a'; ctx.beginPath(); ctx.arc(s.cx, s.cy, 4, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(s.cx - 1, s.cy - 2, 1.5, 1.5); };
const enemies = {
  maTagine: { cls: TourEnemy.make({ w: 28, h: 30, speed: 0.8, behavior: 'hop', hopV: 9, hopEvery: 1.6, art: tagineArt, burst: '#d8743a' }), place: 'walk' },
  maTeapot: { cls: TourEnemy.make({ w: 26, h: 30, speed: 0.4, behavior: 'throw', every: 2.2, range: 9, pace: true, art: teapotArt, burst: '#d8d8e0', shoot: e => {
    tourFire(e.g, e.cx + e.dir * 18, e.y + 2, { kind: 'tea', vx: e.dir * 3.4 * TS, vy: -5 * TS, grav: PHYS.gDown * 0.4, w: 9, h: 9, life: 3, col: '#a86a2a', art: teaDrop }); K.say(e.g, e, 'MORE TEA?', '#ffe0a0');
  } }), place: 'walk' },
  maCobra: { cls: TourLeaper.make({ w: 22, h: 30, jumpV: 9, every: 1.8, stompable: true, art: cobraArt, splash: '#c8a060' }), place: 'here' },
  maScarab: { cls: TourEnemy.make({ w: 22, h: 18, speed: 0.8, behavior: 'roll', range: 8, rollSpeed: 6, art: scarabArt, burst: '#3a8ab8' }), place: 'walk' },
  maFennec: { cls: TourEnemy.make({ w: 24, h: 20, speed: 1.6, behavior: 'hop', hopV: 12, hopEvery: 1.1, art: fennecArt, burst: '#f0d8a8' }), place: 'walk' },
  maGoat: { cls: TourEnemy.make({ w: 30, h: 26, speed: 0.8, behavior: 'charge', range: 6, chargeSpeed: 5.5, art: goatArt, burst: '#f4f0e8', onNotice: e => K.say(e.g, e, 'MEHHH!', '#ffffff') }), place: 'walk' },
  maOrange: { cls: TourEnemy.make({ w: 20, h: 20, speed: 0.9, behavior: 'roll', range: 9, rollSpeed: 6.5, art: orangeArt, burst: '#ff8a1a' }), place: 'walk' },
  // the street snail: tucked in its shell by day in 5-3, out at night leaving a slick trail (TourBehave.maShellSnail)
  maSnail: { cls: TourEnemy.make({ w: 30, h: 20, speed: 0.5, behavior: 'maShellSnail', trail: 'slime', trailT: 4, art: snailArt, burst: '#c8b898' }), place: 'walk' }
};

/* ---------------- entities ---------------- */
// the sandstorm: gusts blow back against Brady, then die down
class MaStorm extends Ent {
  constructor(g, s) { super(g, s, 10, 10); this.zone = null; }
  update(dt) {
    this.t += dt;
    if (!this.zone) this.zone = (this.g.area.zones || []).find(z => z.kind === 'storm' && Math.abs(z.x - this.s.zx) < 2) || null;
    const on = (this.t % 5) < 2.6; if (this.zone) this.zone.off = !on; this.on = on;
  }
  draw(ctx) {
    const z = this.zone; if (!z || !this.on) return;
    ctx.strokeStyle = 'rgba(240,200,140,0.5)'; ctx.lineWidth = 2;
    for (let k = 0; k < 18; k++) { const ph = (this.t * 1.4 + k * 0.17) % 1, sx = z.x + z.w - ph * z.w, sy = z.y + 10 + ((k * 37) % Math.max(20, z.h - 20)); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 26, sy - 2); ctx.stroke(); }
  }
}


/* ---------------- the signature power-up: THE FLYING CARPET ---------------- */
// twelve seconds of free flight on a magic carpet (up / jump to rise, down to sink), then a gentle glide down
function carpetIcon(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y + 2);
  ctx.fillStyle = RUG[0]; ctx.beginPath(); ctx.moveTo(-11, -3 + Math.sin(t * 5) * 1.5); ctx.quadraticCurveTo(0, -6, 11, -3 + Math.sin(t * 5 + 2) * 1.5); ctx.lineTo(11, 3); ctx.quadraticCurveTo(0, 0, -11, 3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = RUG[1]; ctx.fillRect(-6, -2, 12, 2);
  ctx.strokeStyle = RUG[1]; ctx.lineWidth = 1; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(s * 11, -2 + k * 2); ctx.lineTo(s * 14, -1 + k * 2); ctx.stroke(); }
  ctx.restore();
}
const power = {
  id: 'carpet', name: 'FLYING CARPET', country: 'ma', hint: 'FLY FOR 12 SECONDS · UP OR JUMP TO RISE, DOWN TO SINK', time: 12, flight: true,
  icon: carpetIcon,
  update(p, dt, inp, g) { if (p.sig && p.sig.t > 0 && p.sig.t <= dt * 1.5) { p.glideT = 3; g.toast('THE CARPET LANDS YOU GENTLY'); } else if (p.sig && p.sig.t > 2 && p.sig.t - dt <= 2) g.toast('THE CARPET IS GETTING TIRED...'); },
  drawOn(p, ctx, t) {
    const x = p.cx, y = p.y + p.h + 3, w = 30, fl = p.sig && p.sig.t < 2 && Math.floor(t * 10) % 2 === 0;
    ctx.save(); if (fl) ctx.globalAlpha = 0.5;
    ctx.fillStyle = RUG[0]; ctx.beginPath(); ctx.moveTo(x - w, y + Math.sin(t * 8) * 2); for (let k = 0; k <= 6; k++) ctx.lineTo(x - w + k * w / 3, y + Math.sin(t * 8 + k) * 2.5); ctx.lineTo(x + w, y + 6); ctx.lineTo(x - w, y + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = RUG[1]; ctx.fillRect(x - w + 4, y + 2, w * 2 - 8, 2);
    ctx.fillStyle = RUG[2]; for (let k = 0; k < 4; k++) ctx.fillRect(x - w + 8 + k * 14, y + 1, 4, 4);
    ctx.strokeStyle = RUG[1]; ctx.lineWidth = 1; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + s * w, y + 1 + k * 2); ctx.lineTo(x + s * (w + 5), y + 2 + k * 2 + Math.sin(t * 10 + k) * 1.5); ctx.stroke(); }
    ctx.restore();
  }
};

/* ---------------- set pieces ---------------- */
const P = {
  /* 5-1: the souk */
  // rugs draped between poles: bouncy one-way platforms
  rugs(st, o) {
    const x = st.x, B = st.B, n = o.n || 3; st.floor(x, x + n * 5 + 1);
    for (let k = 0; k < n; k++) {
      const rx = x + 1 + k * 5, ry = st.gy - 3 - (k % 2) * 2;
      for (let q = 0; q < 4; q++) { B.set(rx + q, ry, T.SEMI); B.setHide(rx + q, ry, 1); B.setSurf(rx + q, ry, SURF.BOUNCE); }
      B.prop('maRug', rx, ry, 4, st.gy - ry, 'none', { seed: k });
      st.coins(rx, rx + 3, ry - 3);
    }
    st.enemy('maTagine', x + n * 5 - 1, st.gy);
    return x + n * 5 + 2;
  },
  // spice pyramids to hop over (solid)
  spices(st) {
    const x = st.x, B = st.B; st.floor(x, x + 13);
    [[x + 2, 2, 0], [x + 6, 3, 1], [x + 10, 2, 2]].forEach(([sx, h, s]) => B.prop('maSpice', sx, st.gy - h, 3, h, 'body', { seed: s }));
    st.coins(x + 2, x + 12, st.gy - 5);
    st.enemy('maTeapot', x + 13, st.gy);
    return x + 14;
  },
  // snake-charmer baskets: cobras pop up (hop over when they're down)
  baskets(st, o) {
    const x = st.x, n = o.n || 3; st.floor(x, x + n * 4 + 2);
    for (let k = 0; k < n; k++) { st.decor('maBasket', x + 2 + k * 4); st.spawn('maCobra', x + 2 + k * 4, st.gy - 1, { delay: k * 0.6 }); }
    st.coins(x + 1, x + n * 4, st.gy - 4);
    return x + n * 4 + 3;
  },
  // the carpet route: a staircase of floating rugs up to a sky path (fly up with the carpet, or climb)
  skyrugs(st, o) {
    const x = st.x, B = st.B, n = o.n || 5; st.floor(x, x + n * 4 + 4);
    for (let k = 0; k < n; k++) {
      const rx = x + 2 + k * 4, ry = Math.max(2, st.gy - 3 - Math.min(k, 2) * 3);
      for (let q = 0; q < 3; q++) { B.set(rx + q, ry, T.SEMI); B.setHide(rx + q, ry, 1); }
      B.prop('maRug', rx, ry, 3, 1, 'none', { seed: k + 1 });
      st.coins(rx, rx + 2, ry - 2);
    }
    if (o.gold) st.gold(x + n * 4, Math.max(1, st.gy - 12), 'high');
    return x + n * 4 + 5;
  },

  /* 5-2: the Sahara */
  // a camel caravan plods across a quicksand flat: ride the camels' humps
  caravan(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const span = o.span || 11;
    st.pit(x, x + span - 1); st.B.fill(x, st.gy + 1, x + span - 1, st.H - 1, T.LAVA);
    st.spawn('mplat', x + 1, st.gy - 2, { pw: 3, ax: (span - 4) * TS, ay: 0, speed: 1.2, skin: 'maCamel' });
    for (let k = 0; k < span; k++) st.B.ghosts.push([x + k, st.gy - 1]);
    st.coins(x + 2, x + span - 3, st.gy - 4);
    if (o.gold) st.gold(x + Math.floor(span / 2), st.gy - 5, 'risky');
    x += span; st.floor(x, x + 2);
    return x + 3;
  },
  // a sandstorm: gusts blow Brady back, then die down (walk in the lulls)
  storm(st) {
    const x = st.x, B = st.B, w = 16; st.floor(x, x + w);
    B.zone(x, st.gy - 8, w, 8, -4.2 * TS, 0, 0, 'storm');
    st.spawn('maStorm', x + 8, st.gy - 8, { zx: x * TS });
    B.fill(x + 6, st.gy - 2, x + 7, st.gy - 1, T.HARD); B.fill(x + 12, st.gy - 3, x + 13, st.gy - 1, T.HARD);
    st.coins(x + 1, x + 5, st.gy - 2); st.enemy('maScarab', x + 10, st.gy);
    return x + w + 1;
  },
  // an oasis: palm fronds over a pool, a fennec on the bank
  oasis(st, o) {
    let x = st.x; st.floor(x, x + 3); st.decor('maDunePalm', x + 1);
    x += 4; st.pit(x, x + 4); st.B.fill(x, st.gy + 2, x + 4, st.H - 1, T.LAVA);
    st.semi(x + 1, x + 3, st.gy - 3); st.coins(x + 1, x + 3, st.gy - 5);
    x += 5; st.floor(x, x + 5); st.enemy('maFennec', x + 4, st.gy);
    return x + 6;
  },

  /* 5-3: the Atlas (a climb) */
  // kasbah walls: window ledges up alternating sides
  kasbah(st, o) {
    const B = st.B, W = st.W, n = o.n || 4, y0 = st.y;
    for (let k = 0; k < n; k++) {
      const y = y0 - 3 * (k + 1), x0 = k % 2 ? W - 11 : 2;
      for (let x = x0; x < x0 + 9; x++) B.set(x, y, T.HARD);
      B.prop('maArchway', x0, y, 9, 1, 'none', {});
      st.coins(x0 + 2, x0 + 4, y - 2);
    }
    st.top(y0 - 3 * n - 3);
  },
  // an argan tree full of goats
  argan(st, o) {
    const B = st.B, W = st.W, y0 = st.y, mid = st.mid;
    B.prop('maArgan', mid - 4, y0 - 9, 8, 9, 'none', {});
    [[mid - 7, y0 - 3], [mid + 1, y0 - 6], [mid - 6, y0 - 9]].forEach(([bx, by], k) => { for (let q = 0; q < 6; q++) B.set(bx + q, by, T.SEMI); st.coins(bx + 1, bx + 4, by - 2); if (k < 2) st.enemy('maGoat', bx + 3, by, { edgeTurn: true }); });
    if (o.gold) st.gold(mid - 3, y0 - 11, 'high');
    st.top(y0 - 12);
  },
  // a mule path switching back up the mountain
  switchback(st) {
    const B = st.B, W = st.W, y0 = st.y;
    for (let k = 0; k < 4; k++) { const y = y0 - 2 - k * 2, left = k % 2 === 0; for (let x = left ? 2 : 8; x <= (left ? W - 9 : W - 3); x++) B.set(x, y, T.SEMI); if (k === 2) st.enemy('maFennec', left ? 6 : W - 6, y); }
    st.coins(4, W - 5, y0 - 9);
    st.top(y0 - 11);
  },

  /* 5-4: the night market */
  // grill smoke rises from the food stalls: ride it up to the lantern-lit awnings
  grills(st, o) {
    const x = st.x, B = st.B, gy = st.gy; st.floor(x, x + 14);
    const ay = gy - 9;
    B.zone(x + 2, ay - 2, 3, gy - ay + 2, 0, -105 * TS, 6.8 * TS, 'smoke', { pull: 3 });
    B.prop('maSmoke', x + 2, ay, 3, gy - ay, 'none', {});
    for (let q = 5; q <= 13; q++) B.set(x + q, ay, T.SEMI);
    for (let k = 7; k <= 12; k += 2) st.decor('maLantern', x + k, ay + 2);
    st.coins(x + 7, x + 12, ay - 2);
    if (o.gold) st.gold(x + 10, ay - 3, 'high');
    st.enemy('maSnail', x + 9, gy);
    return x + 15;
  },
  // the juice carts: oranges come rolling
  juice(st) { const x = st.x; st.floor(x, x + 12); st.enemy('maOrange', x + 10, st.gy); st.enemy('maOrange', x + 12, st.gy); st.semi(x + 3, x + 7, st.gy - 4); st.coins(x + 3, x + 7, st.gy - 6); st.decor('maLantern', x + 5); return x + 13; },

  /* 5-5: the riad */
  // a courtyard fountain: its jet lifts Brady to the gallery
  fountain(st, o) {
    const x = st.x, B = st.B, gy = st.gy; st.floor(x, x + 12);
    const ty = gy - 8;
    B.prop('maFountain', x + 1, gy - 1, 5, 1, 'none', {});
    B.zone(x + 2, ty - 2, 3, gy - ty + 2, 0, -110 * TS, 7 * TS, 'jet', { pull: 3 });
    B.prop('maJet', x + 2, ty - 2, 3, gy - ty + 1, 'none', {});
    for (let q = 5; q <= 12; q++) B.set(x + q, ty, T.SEMI);
    st.coins(x + 7, x + 11, ty - 2);
    if (o.gold) st.gold(x + 9, ty - 3, 'high');
    return x + 13;
  },
  // mashrabiya screens slide up and down: ride them over the pool
  screens(st) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    for (let k = 0; k < 3; k++) {
      st.pit(x, x + 2); st.B.fill(x, st.gy + 2, x + 2, st.H - 1, T.LAVA);
      st.spawn('mplat', x, st.gy - 1, { pw: 3, ax: 0, ay: -3 * TS, speed: 1.4 + k * 0.2, skin: 'maScreen', phase: k * 0.9 });
      for (let y = st.gy - 3; y <= st.gy; y++) for (let q = 0; q < 3; q++) st.B.ghosts.push([x + q, y]);
      x += 3; if (k < 2) { st.floor(x, x, st.gy - 2); x += 1; }
    }
    st.floor(x, x + 2); return x + 3;
  },
  // rugs being rolled up: conveyor floors
  rolling(st) { const x = st.x, B = st.B; st.floor(x, x + 12); for (let q = 2; q < 11; q++) B.set(x + q, st.gy, T.CONV_L); st.enemy('maTagine', x + 8, st.gy); st.coins(x + 2, x + 10, st.gy - 3); return x + 13; },
  // the boss arena: a square riad courtyard (26 x 20) with a gallery ring 6 rows up, a high arcade over the court,
  // the fountain basin in the middle and Berrad's charcoal brazier on the floor
  arena_riad(st, o) {
    const B = st.B, { x0, w, GY } = o, mid = x0 + Math.floor(w / 2);
    for (let q = 0; q < 6; q++) { B.set(x0 + 1 + q, GY - 6, T.SEMI); B.set(x0 + w - 7 + q, GY - 6, T.SEMI); }
    for (let q = 0; q < 6; q++) B.set(mid - 3 + q, GY - 10, T.SEMI);
    B.prop('maFountain', mid - 3, GY - 1, 6, 1, 'none', {});
    B.decorAt('maArchway', x0 + 4, GY - 6, 0); B.decorAt('maArchway', x0 + w - 4, GY - 6, 0);
    B.decorAt('maLantern', x0 + 3, GY - 6, 0); B.decorAt('maLantern', x0 + w - 4, GY - 6, 0); B.decorAt('maLantern', mid, GY - 10, 0);
    B.decorAt('maOrangeTree', x0 + 2, GY, 0); B.decorAt('maOrangeTree', x0 + w - 3, GY, 1); B.decorAt('maJar', x0 + 6, GY, 0); B.decorAt('maSpiceSacks', x0 + w - 8, GY, 0);
    st.spawn('maPot', mid - 6, GY - 1, {});
  }  ,
  /* ---- stamp helpers (run from a stamp legend: st.x = the cell, st.gy = the row under it) ---- */
  // a spice heap w x h whose bottom-left cell is the stamp letter (solid, drawn as a cone of spice)
  heap(st, o) { const w = o.w || 2, h = o.h || 2; st.B.prop('maSpice', st.x, st.gy - h, w, h, 'body', { seed: o.seed || 0 }); return st.x; },
  // a rug slung between two poles: its top (the letter's row) is a one-way platform, bouncy with { bounce: true }
  rug(st, o) {
    const B = st.B, w = o.w || 4, ry = st.gy - 1, h = o.h || 3;
    for (let q = 0; q < w; q++) { B.set(st.x + q, ry, T.SEMI); B.setHide(st.x + q, ry, 1); if (o.bounce) B.setSurf(st.x + q, ry, SURF.BOUNCE); }
    B.prop('maRug', st.x, ry, w, h, 'none', { seed: o.seed || 0 });
    return st.x;
  },
  // a snake-charmer's basket with a cobra that pops up out of it
  cobraBasket(st, o) { st.decor('maBasket', st.x, st.gy); st.spawn('maCobra', st.x, st.gy - 1, { delay: o.delay || 0 }); return st.x; },
  // the lantern shop's unlit lantern: stand under it for a second (the validator's virtual key is the floor cell)
  shopLantern(st, o) { st.B.spawn('maShopLantern', st.x, st.gy - 1, { opens: o.opens || 'shopWall' }); st.B.vkey(o.opens || 'shopWall', [[st.x, st.gy - 1]]); return st.x; },
  // the sliding back wall (a shutter) h tall, standing on the row under the letter
  slideWall(st, o) { const h = o.h || 4; tourShutterLock(st.B, st.x, st.gy - h, st.gy - 1, o.id || 'shopWall', 'maSlideWall'); return st.x; },

  /* ---- 5-2 ---- */
  // mirage slabs over quicksand: on 2 s, off 1 s, each a little later than the last so a chain is always crossable
  mirage(st, o) {
    let x = st.x; const n = o.n || 4, B = st.B; st.floor(x, x + 1); x += 2;
    const span = n * 5 + 1; st.pit(x, x + span - 1); B.fill(x, st.gy + 1, x + span - 1, st.H - 1, T.LAVA);
    for (let k = 0; k < n; k++) {
      const px = x + 1 + k * 5, py = st.gy - 1 - (k % 2) * 2;
      for (let q = 0; q < 3; q++) { B.set(px + q, py, T.SEMI); B.setHide(px + q, py, 1); }
      B.spawn('maMirageSlab', px, py, { w: 3, phase: k * 0.7 });
      st.coins(px, px + 2, py - 2);
      if (o.gold && k === n - 2) st.gold(px + 1, py - 4, o.gold === true ? 'risky' : o.gold);
    }
    x += span; st.floor(x, x + 2);
    return x + 3;
  },

  /* ---- 5-3: Chefchaouen ---- */
  // a blue house to climb: steps up its side to a roof terrace (a postcard spot with { gold })
  blueHouse(st, o) {
    const B = st.B, x = st.x, w = o.w || 8, h = o.h || 5; st.floor(x, x + w + 3);
    for (let k = 0; k < Math.min(h, 4); k++) B.fill(x + k, st.gy - 1 - k, x + k, st.gy - 1, T.BRICK);
    B.fill(x + Math.min(h, 4), st.gy - h, x + w, st.gy - 1, T.BRICK);
    st.coins(x + 5, x + w - 1, st.gy - h - 2);
    st.decor('maFlowerPots', x + w - 2, st.gy - h);
    if (o.gold) st.gold(x + w - 1, st.gy - h - 3, o.gold === true ? 'must' : o.gold);
    return x + w + 4;
  },
  // the sun-moon lantern: strike it (UP / THROW, or the kazoo) and the whole medina flips between day and night
  sunMoon(st, o) {
    const B = st.B, x = st.x, g = o.g || 0; st.floor(x, x + 3);
    B.toggle(g, [], [], { kind: 'phase' }); B.switchAt(g, x + 1, st.gy - 1); B.switchAt(g, x + 2, st.gy - 1);
    B.spawn('toggleSwitch', x + 1, st.gy - 1, { g, kind: 'phase', look: 'maSunMoon' });
    return x + 4;
  },
  // a laundry line (day only) or a string of lanterns (night only), y rows above the ground, w wide, over a gap
  phaseLine(st, o) {
    const B = st.B, g = o.g || 0, w = o.w || 5, y = st.gy - (o.y || 3), x = st.x + (o.dx || 0);
    const r = [x, y, x + w - 1, y, T.SEMI];
    if (o.night) { B.toggle(g, [], [r], { kind: 'phase' }); for (let q = 0; q < w; q++) B.set(x + q, y, T.EMPTY); }
    else { B.toggle(g, [r], [], { kind: 'phase' }); for (let q = 0; q < w; q++) { B.set(x + q, y, T.SEMI); B.setHide(x + q, y, 1); } }
    B.spawn('maPhaseLine', x, y, { w, g, night: !!o.night });
    return st.x;
  },
  // a gap crossed by a laundry line by day or a lantern string by night (or both, at different heights)
  lines(st, o) {
    const x = st.x, n = o.n || 6; st.floor(x, x + 1);
    st.pit(x + 2, x + 1 + n);
    const run = (night, y) => { const sx = st.x; st.x = x + 2; Tour.pieces['ma.phaseLine'](st, { g: o.g || 0, w: n, y, night }); st.x = sx; };
    if (o.day !== false) run(false, o.dayY || 2);
    if (o.night) run(true, o.nightY || 4);
    st.coins(x + 3, x + n, st.gy - (o.night && o.day === false ? (o.nightY || 4) + 2 : 4));
    if (o.gold) st.gold(x + 1 + Math.floor(n / 2), st.gy - (o.nightY || 4) - 2, o.gold === true ? 'risky' : o.gold);
    st.floor(x + 2 + n, x + 4 + n);
    return x + 5 + n;
  },
  // a night-only ledge high up with an item block over it (only reachable after dark)
  nightLedge(st, o) {
    const x = st.x, B = st.B, y = st.gy - (o.y || 4), w = o.w || 4; st.floor(x, x + w + 3);
    Tour.pieces['ma.phaseLine']({ ...st, x: x + 2 }, { g: o.g || 0, w, y: o.y || 4, night: true });
    if (o.item) st.block(x + 3, y - 4, o.item);
    if (o.gold) st.gold(x + 2 + w - 1, y - 2, o.gold === true ? 'risky' : o.gold);
    return x + w + 4;
  },

  /* ---- 5-4: the kasbah ---- */
  // crenellated earth walls: a stepped climb up and down (the theme's brick)
  kasbahWall(st, o) {
    const B = st.B, x = st.x, n = o.n || 3; st.floor(x, x + n * 3 + 4);
    for (let k = 0; k < n; k++) { const h = 2 + k * 2; B.fill(x + 1 + k * 3, st.gy - h, x + 3 + k * 3, st.gy - 1, T.BRICK); if (k === n - 1) for (let c = 0; c < 3; c += 2) B.set(x + 1 + k * 3 + c, st.gy - h - 1, T.BRICK); st.coins(x + 1 + k * 3, x + 3 + k * 3, st.gy - h - 2); }
    if (o.enemy) st.enemy(o.enemy, x + n * 3 + 3, st.gy);
    return x + n * 3 + 5;
  },
  // an argan tree full of goats: branches to climb (one-way), goats on them, a postcard at the crown
  arganTree(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 13);
    B.prop('maArgan', x + 5, st.gy - 9, 4, 9, 'none', {});
    [[x + 1, st.gy - 3, 5], [x + 7, st.gy - 6, 5], [x + 3, st.gy - 9, 6]].forEach(([bx, by, w], k) => { for (let q = 0; q < w; q++) B.set(bx + q, by, T.SEMI); st.coins(bx + 1, bx + w - 2, by - 2); if (k < 2 && o.goats !== false) st.enemy('maGoat', bx + 2, by, { edgeTurn: true }); });
    if (o.gold) st.gold(x + 6, st.gy - 12, o.gold === true ? 'must' : o.gold);
    return x + 14;
  },
  // the portcullis and the FORT banner as Brady arrives
  portcullis(st, o) { const x = st.x; st.floor(x, x + 4); st.B.spawn('maPortcullis', x + 2, st.gy - 1, { title: o.title || 'FORT' }); return x + 5; },
  // a chain that drops a tagine lid dx tiles on (hook hy rows above the ground); { opens, shutterAt, h } raises a grille too
  chainLid(st, o) {
    const B = st.B, x = st.x, dx = o.dx || 5, id = o.id || 'lid' + x; st.floor(x, x + dx + 2);
    B.spawn('maChain', x + 1, st.gy - 1, { id, opens: o.opens || null });
    B.spawn('maLidHook', x + 1 + dx, st.gy - (o.hy || 8), { id });
    if (o.opens) B.vkey(o.opens, [[x + 1, st.gy - 1]]);
    if (o.enemy) st.enemy(o.enemy, x + 1 + dx, st.gy, { edgeTurn: true });
    if (o.opens && o.shutterAt != null) { const lx = x + o.shutterAt, h = o.h || 3; st.floor(x, lx + 1); tourShutterLock(B, lx, st.gy - h, st.gy - 1, o.opens, 'maGrille'); B.fill(lx, Math.max(0, st.gy - h - 8), lx, st.gy - h - 1, T.BRICK); return lx + 2; }
    return x + dx + 3;
  },
  // the owl's tower top: three tagine lids on hooks under the roof, a chain for each, ledges to dodge feathers
  arena_owl(st, o) {
    const B = st.B, { x0, w, GY } = o;
    const spots = [x0 + 5, x0 + Math.floor(w / 2), x0 + w - 6];
    spots.forEach((sx, k) => {
      B.spawn('maLidHook', sx, 3, { id: 'owlLid' + k });
      B.spawn('maChain', sx + (k === 2 ? 3 : -3), GY - 1, { id: 'owlLid' + k });
    });
    for (let q = 0; q < 3; q++) { B.set(x0 + 2 + q, GY - 4, T.SEMI); B.set(x0 + w - 5 + q, GY - 4, T.SEMI); B.set(x0 + Math.floor(w / 2) - 5 + q, GY - 6, T.SEMI); B.set(x0 + Math.floor(w / 2) + 3 + q, GY - 6, T.SEMI); }
    B.decorAt('maLantern', x0 + 2, GY - 4, 0); B.decorAt('maLantern', x0 + w - 3, GY - 4, 0);
    B.decorAt('maJar', x0 + 1, GY, 0); B.decorAt('maJar', x0 + w - 2, GY, 1);
  },

  /* ---- 5-5: the riad ---- */
  // a little brazier on wheels and a tagine in front of it: kick it (run into it) and it bowls the tagine over
  kickPot(st, o) {
    const x = st.x; st.floor(x, x + 12);
    st.spawn('maKickPot', x + 3, st.gy - 1, {});
    st.enemy('maTagine', x + 10, st.gy);
    st.sign(x + 1, 'RUN INTO THE BRAZIER TO KICK IT!');
    return x + 13;
  },
  // galleries: fountain jets lift Brady from the court to a gallery and on to a higher one
  galleries(st, o) {
    const B = st.B, x = st.x, gy = st.gy; st.floor(x, x + 16);
    for (const [jx, top] of [[x + 2, gy - 6], [x + 9, gy - 10]]) {
      B.prop('maFountain', jx - 1, gy - 1, 4, 1, 'none', {});
      B.zone(jx, top - 2, 2, gy - top + 2, 0, -110 * TS, 7 * TS, 'jet', { pull: 3 });
      B.prop('maJet', jx, top - 2, 2, gy - top + 1, 'none', {});
    }
    for (let q = 4; q <= 8; q++) B.set(x + q, gy - 6, T.SEMI);
    for (let q = 11; q <= 16; q++) B.set(x + q, gy - 10, T.SEMI);
    B.decorAt('maArchway', x + 6, gy - 6, 0);
    st.coins(x + 4, x + 8, gy - 8); st.coins(x + 12, x + 15, gy - 12);
    if (o.gold) st.gold(x + 14, gy - 13, o.gold === true ? 'risky' : o.gold);
    return x + 17;
  },

  /* ---- 5-6: carpet skies ---- */
  // a static woven rug island hanging in the sky (one-way top, drawn as a rug) with an optional moth nibbling it
  rugIsland(st, o) {
    const B = st.B, w = o.w || 6, dy = o.dy || 0, x = st.x, y = st.gy + dy;
    for (let q = 0; q < w; q++) { B.set(x + q, y, T.SEMI); B.setHide(x + q, y, 1); }
    B.prop('maRug', x, y, w, 2, 'none', { seed: x });
    st.coins(x + 1, x + w - 2, y - 2);
    if (o.moth) st.enemy('maMoth', x + w - 2, y);   // y is the rug row (st.enemy stands a walker on the row it is given)
    if (o.gold) st.gold(x + Math.floor(w / 2), y - 3, o.gold === true ? 'risky' : o.gold);
    return x + w + (o.gap || 3);
  },
  // flying rugs as moving islands across a wide gap
  flyingRugs(st, o) {
    let x = st.x; const n = o.n || 2, span = o.span || 10, B = st.B;
    st.floor(x, x + 2); x += 3;
    for (let k = 0; k < n; k++) {
      const y = st.gy - 1 - (k % 2) * 2;
      st.spawn('mplat', x + 1, y, { pw: 3, ax: (span - 4) * TS, ay: 0, speed: 1.3 + k * 0.2, skin: 'maFlyingRug', phase: k * 1.1 });
      for (let q = 0; q < span; q++) B.ghosts.push([x + q, y + 1]);
      st.coins(x + 2, x + span - 3, y - 2);
      x += span; if (k < n - 1) { st.floor(x, x + 2); x += 3; }
    }
    st.floor(x, x + 2);
    return x + 3;
  },
  // a gusty ridge of rug: the wind comes and goes (walk in the lulls), two short gaps to hop
  gust(st, o) {
    const x = st.x, w = o.w || 12, B = st.B; st.floor(x, x + w);
    for (const px of [x + 4, x + w - 5]) st.pit(px, px + 1);
    B.zone(x + 2, st.gy - 9, w - 3, 9, (o.dir || -1) * 4 * TS, 0, 0, 'storm');
    st.spawn('maStorm', x + Math.floor(w / 2), st.gy - 9, { zx: (x + 2) * TS });
    st.coins(x + 3, x + w - 3, st.gy - 3);
    if (o.gold) st.gold(x + Math.floor(w / 2), st.gy - 5, o.gold === true ? 'risky' : o.gold);
    return x + w + 1;
  }
};
const platforms = {
  // a camel plodding across the quicksand (stand on the humps)
  maCamel(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w, d = p.dx < 0 ? -1 : 1, cx = x + w / 2, step = Math.sin(t * 6);
    ctx.save(); ctx.translate(cx, y); ctx.scale(d, 1);
    ctx.fillStyle = '#c8945a';
    for (const [lx, s] of [[-20, step], [-10, -step], [12, step], [22, -step]]) ctx.fillRect(lx, 14, 5, 34 + s * 2);
    ctx.beginPath(); ctx.ellipse(0, 14, w / 2 + 2, 12, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-12, 4, 14, 10, 0, Math.PI, TAU); ctx.ellipse(12, 4, 14, 10, 0, Math.PI, TAU); ctx.fill();
    ctx.strokeStyle = '#c8945a'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w / 2 - 4, 10); ctx.quadraticCurveTo(w / 2 + 12, 0, w / 2 + 14, -18); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.ellipse(w / 2 + 20, -20, 10, 6, 0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(w / 2 + 20, -23, 1.6, 0, TAU); ctx.fill();
    ctx.fillStyle = RUG[0]; ctx.fillRect(-14, -2, 28, 6); ctx.fillStyle = RUG[1]; ctx.fillRect(-14, 2, 28, 2);
    ctx.restore();
  },
  // a carved wooden mashrabiya screen sliding up and down
  maScreen(ctx, p) {
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x, y, w, 12); ctx.fillStyle = '#5a3a22'; ctx.fillRect(x + 2, y + 12, w - 4, 40);
    ctx.strokeStyle = '#c8945a'; ctx.lineWidth = 1.5; for (let k = 0; k < w / 10; k++) for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(x + 6 + k * 10, y + 18 + j * 9, 3, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#c8945a'; ctx.fillRect(x, y, w, 3);
  }
};

/* ---------------- the boss: BERRAD THE MAGNIFICENT, the grand brass teapot ---------------- */
// A pompous brass teapot ("berrad" is the Moroccan word for one) who floats about the riad on his own steam. He
// flings tea glasses, tips his spout for a scalding pour and spins across the floor like a top, but every attack
// costs him steam: he RUNS OUT OF STEAM and has to settle back onto his charcoal brazier to come back to the boil.
// Kick the brazier across the courtyard so he has to chase it, and the moment he sinks into its ring, stomp his lid.
// Phase 2 brings a sandstorm and two mirage braziers; in phase 3 he swells up, the brazier rides off on a little
// flying rug and a flying carpet appears so Brady can follow it up. Finish: his lid clamps shut and he whistles.
const glassArt = (ctx, s, t) => {
  // a little Moroccan tea glass (painted gold band, mint sprig)
  ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(t * 9 + s.x);
  ctx.fillStyle = 'rgba(220,240,255,0.95)'; ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, -6); ctx.lineTo(4, 6); ctx.lineTo(-4, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b8742a'; ctx.beginPath(); ctx.moveTo(-5.4, -2); ctx.lineTo(5.4, -2); ctx.lineTo(4, 6); ctx.lineTo(-4, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8b81a'; ctx.fillRect(-6, -6, 12, 2); ctx.fillStyle = '#3aa84a'; ctx.beginPath(); ctx.ellipse(2, -8, 2.5, 1.5, -0.5, 0, TAU); ctx.fill();
  ctx.restore();
};
const BERRAD_LINES = ['LET ME OUT! I AM MAGNIFICENT!', 'TOO HOT IN HERE!', 'MY LID! MIND MY LID!', 'I SHALL WHISTLE TO MY LAWYER!'];
const brass = (k, dull) => dull ? ['#c8b07a', '#a8905a', '#8a7448'][k] : ['#f0c24a', '#c8902a', '#8a5a14'][k];
// the teapot himself (feet-centre at 0,0): a round brass belly with a zellige band, a domed lid with a tall finial,
// a curly spout for a nose and a handle propped on his "hip"; eyebrows and eyes on the belly
function berradBody(ctx, t, o) {
  o = o || {};
  const d = o.dir || 1, dull = !!o.dull, lidUp = o.lidUp || 0;
  ctx.save(); ctx.scale(d, 1);
  // handle (behind)
  ctx.strokeStyle = brass(1, dull); ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-20, -52); ctx.bezierCurveTo(-46, -54, -46, -22, -22, -22); ctx.stroke();
  // spout: curls up and out like a proud nose
  ctx.strokeStyle = brass(0, dull); ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(18, -30); ctx.bezierCurveTo(36, -30, 38, -44, 46, -56); ctx.stroke();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(46, -56); ctx.quadraticCurveTo(50, -62, 56, -60); ctx.stroke(); ctx.lineCap = 'butt';
  // belly
  const g = ctx.createRadialGradient(-8, -48, 4, 0, -36, 34); g.addColorStop(0, dull ? '#e0d0a8' : '#fff0a8'); g.addColorStop(0.45, brass(0, dull)); g.addColorStop(1, brass(1, dull));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -34, 28, 26, 0, 0, TAU); ctx.fill();
  // foot ring
  ctx.fillStyle = brass(2, dull); rr(ctx, -18, -10, 36, 8, 3); ctx.fill();
  // the zellige band round his middle
  ctx.fillStyle = ZEL[0]; ctx.fillRect(-27, -26, 54, 6); ctx.fillStyle = ZEL[2]; for (let k = 0; k < 7; k++) { ctx.save(); ctx.translate(-21 + k * 7, -23); ctx.rotate(Math.PI / 4); ctx.fillRect(-1.6, -1.6, 3.2, 3.2); ctx.restore(); }
  // the domed lid with a crown-like finial (it rattles and lifts when he steams)
  ctx.save(); ctx.translate(0, -58 - lidUp);
  ctx.fillStyle = brass(1, dull); ctx.beginPath(); ctx.ellipse(0, 2, 17, 4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = brass(0, dull); ctx.beginPath(); ctx.moveTo(-15, 2); ctx.quadraticCurveTo(0, -18, 15, 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = brass(2, dull); ctx.fillRect(-2, -18, 4, 8);
  ctx.fillStyle = dull ? '#a8905a' : '#ffd84a'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(5, -20); ctx.lineTo(0, -16); ctx.lineTo(-5, -20); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e83a5a'; ctx.beginPath(); ctx.arc(0, -21, 2, 0, TAU); ctx.fill();
  ctx.restore();
  // shine
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-12, -46, 6, 3.5, -0.6, 0, TAU); ctx.fill();
  // face: lofty eyebrows, eyes looking down his spout, a little puffed-up mouth
  const ey = -40;
  ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  for (const s of [-1, 1]) { ctx.beginPath(); if (o.angry) { ctx.moveTo(6 + s * 8 - 4, ey - 10 + (s > 0 ? 3 : 0)); ctx.lineTo(6 + s * 8 + 4, ey - 10 + (s > 0 ? 0 : 3)); } else { ctx.moveTo(6 + s * 8 - 4, ey - 9); ctx.quadraticCurveTo(6 + s * 8, ey - 13, 6 + s * 8 + 4, ey - 9); } ctx.stroke(); }
  ctx.lineCap = 'butt';
  if (o.dazed) { ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(6 + s * 8 - 3, ey - 3); ctx.lineTo(6 + s * 8 + 3, ey + 3); ctx.moveTo(6 + s * 8 + 3, ey - 3); ctx.lineTo(6 + s * 8 - 3, ey + 3); ctx.stroke(); } }
  else K.eyes(ctx, 6, ey, 1, 8, 3.6, !!o.angry);
  ctx.fillStyle = '#5a2a1a'; ctx.beginPath();
  if (o.dull) ctx.arc(8, ey + 12, 4, Math.PI + 0.3, TAU - 0.3); else ctx.ellipse(8, ey + 11, 4, 2.6, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}
// steam (drawn after the ink outline so it stays soft): from the spout, under him while he floats, a sputter when dry
function berradSteam(ctx, t, o) {
  const d = o.dir || 1;
  ctx.save();
  const puff = (x, y, r, a) => { ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  if (o.float) for (let k = 0; k < 6; k++) { const ph = (t * 1.4 + k / 6) % 1; puff(Math.sin(k * 2.1 + t * 3) * 14, ph * 26, 6 + ph * 7, 0.55 * (1 - ph)); }
  const n = o.dull ? 2 : 4;
  for (let k = 0; k < n; k++) { const ph = (t * (o.dull ? 0.7 : 1.5) + k / n) % 1; puff(d * (56 + ph * 10), -62 - ph * 30, 4 + ph * 6, (o.dull ? 0.3 : 0.6) * (1 - ph)); }
  ctx.restore();
}

// his steam, drawn as its own soft layer over him (the boss itself is inked)
class MaBerradSteam extends Ent {
  constructor(g, s) { super(g, s, 10, 10); this.b = s.boss; this.always = true; this.friendly = true; }
  update(dt) { this.t += dt; const b = this.b; if (!b || b.remove) { this.remove = true; return; } this.x = b.cx; this.y = b.y + b.h; }
  draw(ctx) {
    const b = this.b; if (!b || b.state === 'sleep' || b.pose === 'inside' || b.act === 'trapped' || b.pose === 'swirl' || b.pose === 'spin') return;
    const P = b.pose, sc = 1 + (b.big || 0) * 0.32;
    ctx.save(); ctx.translate(b.cx, b.y + b.h); ctx.scale(sc, sc); if (P === 'pour') ctx.rotate(b.dir * 0.5);
    berradSteam(ctx, this.t, { dir: b.dir, float: P === 'float' || P === 'cups' || P === 'pour' || P === 'rise' || P === 'walk', dull: P === 'dry' });
    ctx.restore();
  }
}
/* the charcoal brazier: a heavy clay "kanoun" on three little brass wheels. Brady pushes, kicks and (while Berrad
   sits in its ring) stomps his lid shut */
const POT_W = 46, POT_H = 40;
function potBody(ctx, x, y, t, o) {
  o = o || {};
  ctx.save(); ctx.translate(x, y);
  if (o.mirage) { ctx.translate(Math.sin(t * 9) * 2, Math.sin(t * 13) * 1.2); ctx.scale(1 + Math.sin(t * 11) * 0.06, 1 - Math.sin(t * 11) * 0.06); }
  const clay = o.mirage ? '#f0d8b8' : '#c8643a', clayD = o.mirage ? '#e0c4a0' : '#9a4426', clayL = o.mirage ? '#fff0d8' : '#e88a5a';
  const rattle = o.rattle ? Math.sin(t * 50) * 2.5 : 0;
  // the little flying rug it rides in phase 3
  if (o.fly) { ctx.fillStyle = RUG[0]; ctx.beginPath(); ctx.moveTo(-34, 2 + Math.sin(t * 8) * 2); for (let k = 0; k <= 6; k++) ctx.lineTo(-34 + k * 68 / 6, 2 + Math.sin(t * 8 + k) * 2.5); ctx.lineTo(34, 8); ctx.lineTo(-34, 8); ctx.closePath(); ctx.fill(); ctx.fillStyle = RUG[1]; ctx.fillRect(-30, 4, 60, 2); }
  // wheels
  ctx.fillStyle = '#8a6a1a'; for (const wx of [-14, 0, 14]) { ctx.beginPath(); ctx.arc(wx, -4, 4, 0, TAU); ctx.fill(); }
  // pedestal and bowl
  ctx.fillStyle = clayD; ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(10, -6); ctx.lineTo(14, -16); ctx.lineTo(-14, -16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = clay; ctx.beginPath(); ctx.moveTo(-23, -30); ctx.quadraticCurveTo(-22, -14, 0, -14); ctx.quadraticCurveTo(22, -14, 23, -30); ctx.closePath(); ctx.fill();
  // painted band and vent holes, glowing when hot
  ctx.fillStyle = ZEL[0]; ctx.fillRect(-20, -28, 40, 3);
  const hot = o.inside || o.sealed || o.glow;
  for (let k = 0; k < 4; k++) { ctx.fillStyle = hot ? `rgba(255,${130 + Math.sin(t * 10 + k) * 50},40,0.95)` : '#4a2010'; ctx.beginPath(); ctx.arc(-12 + k * 8, -20, 2.2, 0, TAU); ctx.fill(); }
  // the rim, with coals in the ring
  ctx.fillStyle = clayL; ctx.beginPath(); ctx.ellipse(0, -30, 24, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a1a14'; ctx.beginPath(); ctx.ellipse(0, -30, 19, 3.4, 0, 0, TAU); ctx.fill();
  for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(255,${100 + ((k * 37 + Math.floor(t * 6)) % 90)},30,0.9)`; ctx.beginPath(); ctx.arc(-14 + k * 5.6, -30 + (k % 2) * 1.2, 2, 0, TAU); ctx.fill(); }
  // Berrad sitting in the ring to come back to the boil: only his lid and eyes show above the rim
  if (o.inside || o.sealed) {
    ctx.save(); ctx.translate(0, -30 + rattle * 0.3);
    ctx.fillStyle = '#c8902a'; ctx.beginPath(); ctx.ellipse(0, 0, 20, 6, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#f0c24a'; ctx.beginPath(); ctx.ellipse(0, -4, 18, 10, 0, Math.PI, TAU); ctx.fill();
    if (!o.sealed) K.eyes(ctx, 0, -6, 1, 6, 2.8, false);
    else { ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 6 - 3, -7); ctx.lineTo(s * 6 + 3, -5); ctx.stroke(); } }
    const ly = -12 - (o.lidUp || 0) + rattle;
    ctx.fillStyle = '#c8902a'; ctx.beginPath(); ctx.ellipse(0, ly + 2, 15, 3.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = o.glow ? '#ffe070' : '#f0c24a'; ctx.beginPath(); ctx.moveTo(-13, ly + 2); ctx.quadraticCurveTo(0, ly - 14, 13, ly + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(0, ly - 22); ctx.lineTo(4, ly - 13); ctx.lineTo(0, ly - 10); ctx.lineTo(-4, ly - 13); ctx.closePath(); ctx.fill();
    if (o.sealed) { ctx.strokeStyle = '#5a5a68'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-22, ly + 4); ctx.quadraticCurveTo(0, ly - 16, 22, ly + 4); ctx.stroke(); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(0, ly - 6, 3.5, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-12, -22, 4, 2.5, -0.4, 0, TAU); ctx.fill();
  if (o.mirage) { ctx.fillStyle = '#ffffff'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('?', 0, -58 + Math.sin(t * 4) * 3); }
  ctx.restore();
}
// the soft stuff (steam, the flying sparkle trail, the hot glow) goes on after the ink outline, so it stays soft
function potFx(ctx, x, y, t, o) {
  ctx.save(); ctx.translate(x, y);
  const ly = -44 - (o.lidUp || 0);
  if (o.fly) for (let k = 0; k < 4; k++) { const ph = (t * 1.1 + k / 4) % 1; ctx.fillStyle = `rgba(255,230,140,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.arc(Math.sin(t * 3 + k * 2) * 20, 10 + ph * 22, 4 + ph * 5, 0, TAU); ctx.fill(); }
  if (o.steam) for (let k = 0; k < 5; k++) { const ph = (t * 1.6 + k / 5) % 1; ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - ph)})`; ctx.beginPath(); ctx.arc(Math.sin(t * 6 + k) * 6, ly - 8 - ph * 34, 5 + ph * 8, 0, TAU); ctx.fill(); }
  if (o.whistle) { ctx.fillStyle = '#ffffff'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('♪', 18 + Math.sin(t * 7) * 4, ly - 20 - ((t * 30) % 20)); }
  if (o.glow) { ctx.strokeStyle = `rgba(255,240,160,${0.5 + 0.4 * Math.sin(t * 12)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -34, 30, 18, 0, 0, TAU); ctx.stroke(); }
  ctx.restore();
}
const potLook = (e, t) => ({ inside: e.inside, sealed: e.sealed, fly: e.fly, rattle: e.rattle > 0, steam: e.inside || e.sealed || e.rattle > 0, whistle: e.sealed, glow: e.inside && !e.sealed, lidUp: e.inside && !e.sealed ? 4 + Math.sin(t * 20) * 3 : 0 });
const MA_POT_CFG = { w: POT_W, h: POT_H, kick: 5.2, bounce: 0.3, friction: 9, hp: 0, burst: '#c8643a', art: (ctx, e, x, y, t) => potBody(ctx, x, y, t, potLook(e, t)) };
class MaPot extends TourProp {
  constructor(g, s) { super(g, s, MA_POT_CFG); this.pot = true; this.inside = false; this.sealed = false; this.fly = false; this.rattle = 0; this.flyT = 0; }
  draw(ctx) { super.draw(ctx); potFx(ctx, this.cx, this.y + this.h, this.g.t, potLook(this, this.g.t)); }
  get light() { return this.inside || this.sealed ? { r: 90, c: 'rgba(255,170,90,' } : null; }
  update(dt) {
    if (this.rattle > 0) this.rattle -= dt;
    if (!this.fly) { super.update(dt); return; }
    // phase 3: the brazier rides a little flying rug round the riad
    this.t += dt; this.flyT += dt; if (this.hot > 0) this.hot -= dt;
    const b = this.g.boss, x0 = b ? b.arenaX0 : this.x - 200, x1 = b ? b.arenaX1 : this.x + 200, fy = b ? b.floorY : this.y + this.h;
    const tx = (x0 + x1) / 2 + Math.sin(this.flyT * 0.3) * (x1 - x0) * 0.3 - this.w / 2;
    const ty = fy - 5.2 * TS + Math.sin(this.flyT * 1.7) * 16 - this.h;
    this.vx = (tx - this.x) * 2; this.vy = (ty - this.y) * 2;
    this.x += this.vx * dt; this.y += this.vy * dt; this.onGround = false; this.fast = false;
  }
  touchPlayer(p) {
    if (p.dead) return;
    const fromAbove = p.vy > 0 && p.prevBottom <= this.y + Math.max(8, this.h * 0.4);
    if (fromAbove && (this.inside || this.sealed)) {
      p.vy = -(p.inp.jump ? PHYS.stompVHeld : PHYS.stompV); p.jumping = true; p.y = Math.min(p.y, this.y - p.h + 2);
      const b = this.g.boss;
      if (this.inside && !this.sealed && b && b.state === 'fight' && b.hit('lid', this)) { this.rattle = 1.2; return; }
      Sound.play('bump', { vol: 0.4 }); return;
    }
    if (this.fly) { if (fromAbove) { p.vy = -PHYS.stompV * 0.6; p.jumping = true; Sound.play('bump', { vol: 0.3 }); } return; }
    super.touchPlayer(p);
  }
}
// a mirage brazier: it shimmers, and pops the moment it is kicked into a wall or stomped
const MA_MIRAGE_CFG = { w: POT_W, h: POT_H, kick: 7, bounce: 0.2, friction: 8, hp: 1, breakOnWall: true, burst: '#ffe8b0', art: (ctx, e, x, y, t) => potBody(ctx, x, y, t, { mirage: true }), onBreak: e => { e.g.parts.text(e.cx, e.y - 10, 'A MIRAGE!', '#ffe8b0'); K.sfx('glass', 'portal', { vol: 0.4 }); } };
class MaMirage extends TourProp {
  constructor(g, s) { super(g, s, MA_MIRAGE_CFG); this.mirage = true; }
  touchPlayer(p) { if (p.dead) return; if (p.vy > 0 && p.prevBottom <= this.y + Math.max(8, this.h * 0.4)) { p.vy = -PHYS.stompV; p.jumping = true; this.break(); return; } super.touchPlayer(p); }
}
// the sandstorm of phase 2: gusts across the whole riad, with a warning puff of sand before each one
class MaGale extends Ent {
  constructor(g, s) {
    super(g, s, 10, 10); this.x0 = s.x0; this.x1 = s.x1; this.fy = s.floorY; this.ph = 0; this.dir = 1; this.on = false; this.warn = false;
    this.zone = { x: this.x0, y: this.fy - 10 * TS, w: this.x1 - this.x0, h: 10 * TS, fx: 0, fy: 0, vmax: 0, kind: 'storm', off: true };
    (g.area.zones = g.area.zones || []).push(this.zone);
  }
  update(dt) {
    this.t += dt; this.ph += dt;
    const b = this.g.boss;
    if (!b || b.state === 'dying') { this.zone.off = true; this.remove = true; return; }
    const c = this.ph % 7.5, warn = c > 2.0 && c < 2.9, on = c >= 2.9 && c < 5.4;
    if (warn && !this.warn) { this.dir = -this.dir; K.sfx('wind', 'crumble', { vol: 0.35 }); this.g.toast(this.dir > 0 ? 'SANDSTORM FROM THE LEFT!' : 'SANDSTORM FROM THE RIGHT!'); }
    if (on && !this.on) this.g.shake(2);
    this.warn = warn; this.on = on; this.zone.fx = this.dir * 3.4 * TS; this.zone.off = !on;
  }
  draw(ctx) {
    const z = this.zone, t = this.t;
    if (this.warn) { const sx = this.dir > 0 ? z.x + 20 : z.x + z.w - 20; for (let k = 0; k < 8; k++) { ctx.fillStyle = `rgba(240,200,140,${0.35 + 0.2 * Math.sin(t * 12 + k)})`; ctx.beginPath(); ctx.arc(sx + this.dir * (k % 3) * 10, z.y + 40 + k * 32, 8 + (k % 2) * 4, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ffe8b0'; ctx.font = `12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(this.dir > 0 ? '>>>' : '<<<', sx + this.dir * 30, z.y + 30); return; }
    if (!this.on) return;
    ctx.strokeStyle = 'rgba(240,200,140,0.55)'; ctx.lineWidth = 2;
    for (let k = 0; k < 26; k++) { const ph = (t * 1.3 + k * 0.137) % 1, sx = this.dir > 0 ? z.x + ph * z.w : z.x + z.w - ph * z.w, sy = z.y + 12 + ((k * 41) % (z.h - 24)); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + this.dir * 28, sy - 2); ctx.stroke(); }
  }
}

const boss = {
  id: 'ma_berrad', name: 'Berrad the Magnificent', hp: 4, dims: [60, 64], floats: true, music: 'tour_ma_boss', country: 'ma',
  brain: {
    guardText: 'TOO HOT!',
    phases: [3, 2],
    pot(b) { if (!b.potRef || b.potRef.remove) b.potRef = b.g.entities.find(e => e instanceof MaPot && !e.remove) || null; return b.potRef; },
    skyY(b) { return b.floorY - b.h - (3.4 + (b.big || 0) * 0.5) * TS; },
    wake(b) { if (!b.steamFx) { b.steamFx = new MaBerradSteam(b.g, { x: b.cx, y: b.y, boss: b }); b.g.spawn(b.steamFx); } b.big = 0; b.inside = false; b.tank = 1; b.carpetT = 0; K.say(b.g, b, 'TEA? I INSIST. I AM MAGNIFICENT!', '#ffe08a'); b.g.toast('KICK HIS BRAZIER AWAY. WHEN HE SINKS IN TO REBOIL, STOMP HIS LID!'); },
    noDisc(b) { return b.act === 'swirl' || b.inside || b.act === 'dive'; },
    hit(b, kind, src) {
      if (kind === 'lid') { if (!b.inside) return false; b.damage(1, { text: 'CLONK!', col: '#ffe08a' }); return true; }
      if (kind === 'stomp' || kind === 'spin') { if (b.inside) { b.damage(1, { text: 'CLONK!', col: '#ffe08a' }); return true; } return 'bounce'; }
      if (kind === 'prop') { if (src && src.pot && !b.inside && b.act !== 'dive' && b.act !== 'trapped') { b.damage(1, { text: 'BONK!', col: '#ffe08a' }); return true; } return false; }
      if (kind === 'bump') return false;
      if (b.inside || b.act === 'dive') return false;
      return undefined;
    },
    touch(b, p) { return b.inside || b.act === 'dive' || b.act === 'trapped'; },
    update(b, dt) {
      const g = b.g, p = g.player, pot = this.pot(b), skyY = this.skyY(b), ph = b.phase || 1;
      b.guard = 'bounce'; b.vuln = false;
      if (b.act === 'trapped') {
        // the finish: the lid is clamped, the brazier rattles, he whistles like a kettle and grumbles
        if (pot) { b.x = pot.cx - b.w / 2; b.y = pot.y - 12; pot.inside = true; pot.sealed = true; pot.rattle = 1; if (!pot.fly) pot.vx = Math.sin(b.at * 40) * 1.5 * TS; }
        if (Math.floor(b.at * 2.5) !== Math.floor((b.at - dt) * 2.5)) g.parts.text(b.cx + (Math.random() - 0.5) * 50, b.y - 20 - Math.random() * 20, pick(BERRAD_LINES), '#ffe08a');
        if (Math.random() < 0.3) g.burst(b.cx, b.y - 10, 2, '#ffffff', 'dust');
        if (b.at > 2.8) b.die();
        return;
      }
      // phase 3: a flying carpet appears whenever Brady has none, so the airborne brazier can be reached
      if (ph >= 3 && p && !p.dead) {
        const has = p.sig && p.sig.id === 'carpet', out = g.entities.some(e => e instanceof TourItem && e.kind === 'sig:carpet' && !e.remove);
        b.carpetT = has || out ? 2.5 : (b.carpetT || 0) - dt;
        if (b.carpetT <= 0) { const x = clamp(p.cx + (p.cx < (b.arenaX0 + b.arenaX1) / 2 ? 3 : -3) * TS, b.arenaX0 + 2 * TS, b.arenaX1 - 2 * TS); g.spawn(new TourItem(g, x, b.floorY - 36, 'sig:carpet')); g.parts.text(x, b.floorY - 50, 'A CARPET!', '#ffe08a'); K.sfx('appear', null, { vol: 0.5 }); b.carpetT = 2.5; }
      }
      if (b.act === 'walk') {
        b.pose = 'float'; b.face(); b.hover(dt, skyY + Math.sin(b.t * 2) * 8, p ? p.cx + (b.cx < p.cx ? -3 : 3) * TS : b.cx);
        if (b.at > 0.9) { b.cycle++; b.go(['cups', 'pour', 'swirl'][b.cycle % 3]); }
      } else if (b.act === 'cups') {
        // tell: he balances a tray of tea glasses on his lid and rattles it, then flings the lot
        b.pose = 'cups'; b.hover(dt, skyY);
        if (b.first) K.sfx('glass', 'select2', { vol: 0.4, pitch: 1.3 });
        if (b.at > 0.7 && !b.fired) {
          b.fired = true; b.face(); const n = ph >= 3 ? 5 : ph >= 2 ? 4 : 3;
          for (let k = 0; k < n; k++) tourFire(g, b.cx, b.cy - 10, { kind: 'cup', vx: ((k - (n - 1) / 2) * 1.6 + b.dir * 0.8) * TS, vy: -5 * TS, grav: PHYS.gDown * 0.45, w: 14, h: 12, life: 3, thru: true, stompable: true, col: '#f4ecd8', art: glassArt });
          Sound.play('throw', { pitch: 1.4 }); K.say(g, b, 'TEA TIME!', '#ffe0a0');
        }
        if (b.at > 1.5) { b.fired = false; b.go('refill'); }
      } else if (b.act === 'pour') {
        // tell: he leans over Brady and tips his spout down, then a scalding stream falls
        b.pose = 'pour'; const tx = p ? p.cx : b.cx; b.hover(dt, skyY - TS, b.at < 0.7 || ph >= 3 ? tx : undefined);
        if (b.at > 0.7 && b.at < 1.7 && Math.floor(b.at * 14) !== Math.floor((b.at - dt) * 14)) tourFire(g, b.cx + b.dir * 30, b.y + b.h - 10, { kind: 'tea', vx: (Math.random() - 0.5) * TS, vy: 4 * TS, grav: PHYS.gDown * 0.5, w: 10, h: 12, life: 2, thru: true, col: '#a86a2a', art: teaDrop });
        if (b.at > 0.7 && !b.poured) { b.poured = true; K.say(g, b, 'HOT! HOT! HOT!', '#ffe0a0'); Sound.play('splash', { pitch: 1.3, vol: 0.4 }); }
        if (b.at > 2.0) { b.poured = false; b.go('refill'); }
      } else if (b.act === 'swirl') {
        // tell: he drops to the floor and starts spinning on his foot ring before he whirls across like a top
        if (b.first) { b.face(); b.turns = 0; }
        b.pose = b.at < 0.6 ? 'spin' : 'swirl'; b.hover(dt, b.floorY - b.h);
        if (b.at > 0.6) { b.x += b.dir * (6 + (ph >= 3 ? 2 : 0)) * TS * dt; if (b.x <= b.arenaX0 + 2 || b.x >= b.arenaX1 - b.w - 2) { b.dir = -b.dir; b.turns++; } }
        if (b.at > 4.5 || b.turns >= 2) b.go('refill');
      } else if (b.act === 'refill') {
        // out of steam: his brass dulls, the gauge empties, and he must get back onto his brazier
        b.pose = 'dry'; b.tank = Math.max(0, 1 - b.at / 1.2);
        if (b.first) K.say(g, b, pick(['RUNNING OUT OF STEAM...', 'MUST... REBOIL...', 'WHERE IS MY BRAZIER?!']), '#ffe08a');
        if (!pot) { if (b.at > 1) b.go('walk'); }
        else {
          const tx = pot.cx, ty = pot.y - b.h - 14, sp = (pot.fly ? 5 : 4.2) * TS * dt;
          b.x = approach(b.x, tx - b.w / 2, sp); b.y = approach(b.y, ty, sp * 1.3); b.dir = tx < b.cx ? -1 : 1;
          if (Math.abs(b.cx - tx) < 10 && Math.abs(b.y - ty) < 10) b.go('dive');
        }
      } else if (b.act === 'dive') {
        b.pose = 'dive';
        if (pot) { b.x = pot.cx - b.w / 2; b.y = pot.y - b.h - 14 + b.at * 30; }
        if (b.first) { K.sfx('splash', null, { pitch: 1.6, vol: 0.5 }); K.say(g, b, 'AAAH, THE COALS', '#ffe0a0'); }
        if (b.at > 0.5) b.go('inside');
      } else if (b.act === 'inside') {
        // the weak moment: he sits in the brazier's ring coming back to the boil, his lid glows and rattles
        b.pose = 'inside'; b.inside = true; b.vuln = true; b.guard = 'hurt';
        if (b.first && pot) { pot.inside = true; pot.rattle = 0.6; g.burst(pot.cx, pot.y - 30, 10, '#ffffff', 'dust'); if (!b.lidHint) { b.lidHint = true; g.toast('NOW! STOMP HIS LID!'); } }
        if (pot) { b.x = pot.cx - b.w / 2; b.y = pot.y - 12; pot.inside = true; }
        const stay = ph >= 3 ? 1.4 : ph >= 2 ? 1.7 : 2.1;
        if (b.at > stay) { b.inside = false; if (pot) pot.inside = false; b.tank = 1; b.go('rise'); }
      } else if (b.act === 'rise') {
        b.pose = 'float'; b.vx = 0;
        if (b.first) { if (pot) g.burst(pot.cx, pot.y - 20, 16, '#ffffff', 'spark'); K.sfx('portal', null, { vol: 0.4 }); K.say(g, b, pick(['BACK ON THE BOIL!', 'FULL STEAM AHEAD!', 'MAGNIFICENT ONCE MORE!']), '#ffe08a'); }
        b.hover(dt, skyY); if (b.at > 0.8) b.go('walk');
      }
    },
    hurt(b) {
      const g = b.g, pot = this.pot(b);
      b.inside = false; b.tank = 1; if (pot) { pot.inside = false; pot.rattle = 1.2; g.burst(pot.cx, pot.y - 20, 30, '#ffffff', 'spark'); }
      b.go('rise'); K.say(g, b, pick(['MY LID! MIND MY LID!', 'HOW IMPUDENT!', 'I AM DENTED!']), '#ffe08a'); g.burst(b.cx, b.cy, 24, '#ffd84a', 'confetti');
    },
    phase(b, n) {
      const g = b.g, pot = this.pot(b);
      this.hurt(b);
      if (n === 2) {
        g.spawn(new MaGale(g, { x: b.arenaX0, y: b.floorY, x0: b.arenaX0, x1: b.arenaX1, floorY: b.floorY }));
        for (const k of [0.22, 0.78]) g.spawn(new MaMirage(g, { x: b.arenaX0 + (b.arenaX1 - b.arenaX0) * k, y: b.floorY }));
        g.bannerText = 'A SANDSTORM! AND... THREE BRAZIERS?!'; g.bannerT = 2.4; K.say(g, b, 'FIND THE REAL ONE, HA HA!', '#ffe08a');
      } else if (n === 3) {
        b.big = 1; if (pot) { pot.fly = true; pot.flyT = 0; }
        g.bannerText = 'BERRAD BOILS OVER! THE BRAZIER TAKES OFF!'; g.bannerT = 2.6; g.shake(8); K.say(g, b, 'NOW I AM TRULY MAGNIFICENT!', '#ffe08a'); b.carpetT = 0.5;
      }
    },
    lastHit(b) {
      const g = b.g, pot = this.pot(b);
      b.go('trapped'); b.inside = true; b.vuln = false;
      if (pot) { pot.inside = true; pot.sealed = true; pot.rattle = 3; pot.fly = false; pot.vy = 2 * TS; }
      g.bannerText = 'THE LID CLAMPS SHUT!'; g.bannerT = 2.6; g.shake(10); K.sfx('break', null, { vol: 0.7 }); g.burst(b.cx, b.y, 30, '#ffffff', 'dust');
      return true;
    },
    draw(b, ctx, t) {
      const P = b.pose, d = b.dir;
      if (P === 'inside' || b.act === 'trapped') return;
      const x = b.cx, y = b.y + b.h, sc = 1 + (b.big || 0) * 0.32;
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
      if (P === 'swirl' || P === 'spin') {
        // spinning on his foot ring like a top: a blur of brass and a ring of steam
        const n = P === 'spin' ? 3 : 6;
        for (let k = 0; k < n; k++) { ctx.strokeStyle = `rgba(255,255,255,${0.8 - k * 0.1})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, -k * 9 - 6, 22 + k * 5, 5, 0, t * 10 + k, t * 10 + k + 4.5); ctx.stroke(); }
        ctx.save(); ctx.scale(Math.cos(t * (P === 'spin' ? 14 : 30)), 1); berradBody(ctx, t, { dir: 1, angry: true }); ctx.restore();
        if (P === 'spin') { ctx.fillStyle = '#ffffff'; ctx.font = `12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', 0, -96); }
        ctx.restore(); return;
      }
      if (P === 'dive') { const k = Math.min(1, b.at / 0.5); ctx.translate(0, k * 30); ctx.scale(1 - k * 0.5, 1 - k * 0.5); }
      if (P === 'pour') { ctx.rotate(d * 0.5); }
      const dull = P === 'dry' && Math.sin(t * 18) > -0.3;
      berradBody(ctx, t, { dir: d, dull, angry: P === 'cups' || P === 'pour', lidUp: P === 'float' ? Math.max(0, Math.sin(t * 9)) * 3 : 0 });
      if (P === 'cups') {
        // the tray of tea glasses held up on his lid: the tell for the volley
        const sh = Math.sin(t * 30) * 2;
        ctx.fillStyle = '#c8a03a'; ctx.fillRect(-26 + sh, -92, 52, 4);
        for (let k = -1; k <= 1; k++) { ctx.fillStyle = 'rgba(220,240,255,0.95)'; ctx.fillRect(k * 16 - 5 + sh, -103, 10, 11); ctx.fillStyle = '#b8742a'; ctx.fillRect(k * 16 - 4 + sh, -99, 8, 7); }
      }
      if (P === 'dry') {
        // the steam gauge over his lid emptying, and the word for it
        const k = b.tank == null ? 1 : b.tank;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(-10, -116, 20, 14);
        ctx.fillStyle = '#e8e8f0'; ctx.fillRect(-9, -103 - 12 * k, 18, 12 * k);
        ctx.fillStyle = '#ffffff'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(k <= 0 ? 'NO STEAM!' : 'LOW', 0, -120);
      }
      ctx.restore();
    }
  }
};

/* ---------------- 5-4's mini-boss: THE BRASS OWL (the Baron's clockwork sentry) ---------------- */
// It perches under one of three tagine lids hanging from the tower roof. Every four seconds its head turns right
// round (gears clank first). While it looks away, pull a chain: that lid drops on it. Pull while it watches and it
// screeches, hops clear and blows a volley of brass feathers. Phase 2: it flies a lap of the room and lands under a
// different lid each time. Finish: its head spins and it falls apart into a heap of teaspoons.
const owlBrass = ['#e8b84a', '#b8862a', '#7a5414', '#fff0b0'];
function owlArt(ctx, t, o) {
  o = o || {};
  const look = o.look || 1, turn = o.turn || 0, wing = o.wing || 0, bob = o.fly ? Math.sin(t * 18) * 3 : 0;
  ctx.save(); ctx.translate(0, bob);
  // talons and a little clockwork key in its back
  ctx.fillStyle = owlBrass[2]; for (const s of [-1, 1]) { ctx.fillRect(s * 9 - 4, -6, 8, 6); for (let k = 0; k < 3; k++) ctx.fillRect(s * 9 - 5 + k * 4, -2, 2, 4); }
  ctx.strokeStyle = owlBrass[2]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-look * 20, -30); ctx.lineTo(-look * 30, -30); ctx.stroke();
  ctx.fillStyle = owlBrass[1]; ctx.beginPath(); ctx.ellipse(-look * 33, -30, 3, 7, Math.sin(t * 6) * 0.5, 0, TAU); ctx.fill();
  // body: riveted brass egg with a feather-plate chest
  const g = ctx.createRadialGradient(-6, -32, 3, 0, -24, 26); g.addColorStop(0, owlBrass[3]); g.addColorStop(0.5, owlBrass[0]); g.addColorStop(1, owlBrass[1]);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -24, 19, 21, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = owlBrass[1]; for (let r = 0; r < 3; r++) for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.arc(k * 7 + (r % 2) * 3.5 - 1.75, -22 + r * 6, 3.4, 0, Math.PI); ctx.fill(); }
  ctx.fillStyle = owlBrass[2]; for (const [rx, ry] of [[-15, -30], [15, -30], [-13, -12], [13, -12]]) { ctx.beginPath(); ctx.arc(rx, ry, 1.4, 0, TAU); ctx.fill(); }
  // wings (plates): flap when it flies, flare up for the feather volley
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 17, -30); ctx.rotate(s * (0.25 + wing * 0.9)); ctx.fillStyle = owlBrass[1]; ctx.beginPath(); ctx.ellipse(s * 4, 10, 7, 15, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = owlBrass[2]; ctx.lineWidth = 1.2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(s * 1, 2 + k * 6); ctx.lineTo(s * 9, 6 + k * 6); ctx.stroke(); } ctx.restore(); }
  // the head on its gear neck: it swings right round (the scale is the turn)
  ctx.save(); ctx.translate(0, -48); const ct = Math.cos(turn * Math.PI); ctx.scale(Math.max(0.08, Math.abs(ct)), 1);
  const front = Math.abs(ct) > 0.35;
  ctx.fillStyle = owlBrass[0]; ctx.beginPath(); ctx.ellipse(0, 0, 17, 13, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-15, -6); ctx.lineTo(-11, -20); ctx.lineTo(-5, -10); ctx.fill(); ctx.beginPath(); ctx.moveTo(15, -6); ctx.lineTo(11, -20); ctx.lineTo(5, -10); ctx.fill();
  if (front) {
    // big glass eyes with brass rims, an iron beak
    for (const s of [-1, 1]) {
      ctx.fillStyle = owlBrass[2]; ctx.beginPath(); ctx.arc(s * 7, 0, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = o.dazed ? '#8a8aa0' : o.angry ? '#ff6a3a' : '#ffc84a'; ctx.beginPath(); ctx.arc(s * 7, 0, 5.2, 0, TAU); ctx.fill();
      if (o.dazed) { ctx.strokeStyle = '#2a2030'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(s * 7, 0, 2.5, 0, 5); ctx.stroke(); }
      else { ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(s * 7 + 2 * look, 0.5, 2.4, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(s * 7 - 2, -3, 1.6, 1.6); }
    }
    ctx.fillStyle = '#5a5a68'; ctx.beginPath(); ctx.moveTo(-3 + look * 2, 5); ctx.lineTo(3 + look * 2, 5); ctx.lineTo(look * 3, 11); ctx.closePath(); ctx.fill();
    if (o.angry) { ctx.strokeStyle = owlBrass[2]; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-13, -9); ctx.lineTo(-2, -5); ctx.moveTo(13, -9); ctx.lineTo(2, -5); ctx.stroke(); }
  } else {
    // the back of its head: a window on the clockwork, a gear turning inside
    ctx.fillStyle = owlBrass[2]; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill();
    ctx.save(); ctx.rotate(t * 3); ctx.fillStyle = '#c8c8d8'; for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-1.4, -7.5, 2.8, 3); } ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill(); ctx.fillStyle = owlBrass[2]; ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  ctx.restore();
}
// a brass feather, the volley's shot
const featherArt = (ctx, s, t) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(Math.atan2(s.vy || 0, s.vx || 1)); ctx.fillStyle = '#e8b84a'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 3, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#7a5414'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke(); ctx.restore(); };

/* the tagine lid on a ceiling hook (5-4): a chain somewhere else drops it; it re-hangs a moment later */
class MaLidHook extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, TS); this.id = s.id; this.k = 1; this.down = 0; this.always = true; this.friendly = true; this.back = true; this.hx = s.x; }
  get armed() { return this.down <= 0; }
  drop(by) {
    if (!this.armed) return false;
    this.down = 3.2; this.k = 0;
    const lid = new MaLid(this.g, { x: this.hx, y: this.y + this.h + 26, hook: this }); this.g.spawn(lid);
    K.sfx('clank', 'bump', { vol: 0.6, pitch: 0.7 });
    return lid;
  }
  update(dt) { this.t += dt; if (this.down > 0) { this.down -= dt; if (this.down <= 0) K.sfx('chain', 'select', { vol: 0.3, pitch: 0.8 }); } this.k = approach(this.k, this.down > 0 ? 0 : 1, dt * 1.2); }
  draw(ctx) {
    const x = this.hx, y = this.y;
    // the hook bracket and a rope that lowers a fresh lid back into place
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 12, y - 2, 24, 5); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y + 8, 5, -Math.PI / 2, Math.PI); ctx.stroke();
    if (this.k > 0.02) { const ly = y + 8 + (1 - this.k) * -20; ctx.globalAlpha = Math.min(1, this.k * 2); ctx.strokeStyle = '#8a6a3a'; ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x, ly + 6); ctx.stroke(); MaLid.art(ctx, x, ly + 32, this.t); ctx.globalAlpha = 1; }
  }
}
class MaLid extends Ent {
  static art(ctx, x, y, t) {
    // a big terracotta tagine lid: a cone with painted bands and a knob (feet-centre at x, y)
    ctx.fillStyle = '#c8643a'; ctx.beginPath(); ctx.moveTo(x - 26, y); ctx.quadraticCurveTo(x - 14, y - 10, x - 4, y - 30); ctx.lineTo(x + 4, y - 30); ctx.quadraticCurveTo(x + 14, y - 10, x + 26, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = ZEL[0]; ctx.fillRect(x - 20, y - 8, 40, 3); ctx.fillStyle = '#f4e8d0'; ctx.fillRect(x - 13, y - 17, 26, 2);
    ctx.fillStyle = '#e8b81a'; ctx.beginPath(); ctx.arc(x, y - 32, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#9a4426'; ctx.fillRect(x - 27, y - 2, 54, 3);
  }
  constructor(g, s) { super(g, s, 2 * TS - 8, 30); this.x = s.x - this.w / 2; this.y = s.y - 30; this.hook = s.hook; this.vy = 0; this.landed = 0; this.lid = true; this.always = true; this.friendly = true; this.hitSet = new Set(); }
  update(dt) {
    this.t += dt; const g = this.g;
    if (this.landed > 0) { this.landed += dt; if (this.landed > 1.3) { this.remove = true; g.burst(this.cx, this.y + this.h, 8, '#e8d8c0', 'dust'); } return; }
    this.vy = Math.min(this.vy + PHYS.gDown * 0.7 * dt, 22 * TS); this.y += this.vy * dt;
    const b = g.boss;
    if (b && !b.remove && b.state === 'fight' && !this.hitSet.has(b) && overlap(this, b)) { this.hitSet.add(b); b.hit('hazard', this); }
    for (const e of g.entities) if (e.enemy && !e.boss && !e.dead && !this.hitSet.has(e) && overlap(this, e)) { this.hitSet.add(e); if (e.hit('prop', this)) g.addScore(200, e.cx, e.y); }
    const p = g.player; if (p && !p.dead && overlap(this, p) && !this.bonked) { this.bonked = true; g.parts.text(p.cx, p.y - 10, 'BONK', '#ffe0a0'); p.vy = Math.max(p.vy, 3 * TS); }
    const ty = Math.floor((this.y + this.h) / TS);
    if (SOLID[tileAt(g.area, Math.floor(this.cx / TS), ty)] && this.vy > 0) { this.y = ty * TS - this.h; this.landed = 0.01; g.shake(3); K.sfx('clank', 'bump', { vol: 0.8 }); g.burst(this.cx, this.y + this.h, 14, '#e8d8c0', 'dust'); }
  }
  draw(ctx) { Ink.around(ctx, this.x - 6, this.y - 8, this.w + 12, this.h + 10, c => MaLid.art(c, this.cx, this.y + this.h, this.t), { pad: 8 }); }
}
// a chain with a brass ring hanging from a wall bracket: pull it (touch + UP or THROW) and its lid drops
class MaChain extends Ent {
  constructor(g, s) { super(g, s, 24, 3 * TS); this.id = s.id; this.opens = s.opens || null; this.cool = 0; this.k = 0; this.skinName = s.look; }
  hook() { return this.g.entities.find(e => e instanceof MaLidHook && e.id === this.id); }
  update(dt) { this.t += dt; if (this.cool > 0) this.cool -= dt; this.k = approach(this.k, this.cool > 1.8 ? 1 : 0, dt * 6); }
  touchPlayer(p) {
    if (this.cool > 0) return;
    if (Input.actionPressed || (p.inp && p.inp.actionPressed) || Input.upPressed || (p.inp && p.inp.upPressed)) this.pull(p);
    else if (!this.told) { this.told = true; this.g.parts.text(this.cx, this.y - 8, 'UP: PULL THE CHAIN', '#ffd84a'); }
  }
  hit(kind) { if ((kind === 'plane' || kind === 'kazoo') && this.cool <= 0) { this.pull(this.g.player); return true; } return false; }
  pull(p) {
    const h = this.hook(); this.cool = 2.4; K.sfx('chain', 'select', { vol: 0.7, pitch: 0.7 });
    const lid = h ? h.drop(this) : null;
    if (this.opens) TourLock.open(this.g, this.opens);
    const b = this.g.boss; if (b && b.brain && b.brain.onPull && b.state === 'fight') b.brain.onPull(b, h, p, lid);
  }
  draw(ctx) {
    const x = this.cx, y0 = this.y - 20, y1 = this.y + this.h - 16 + this.k * 14;
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 8, y0 - 4, 16, 6);
    ctx.strokeStyle = '#8a8a98'; ctx.lineWidth = 2; for (let y = y0; y < y1; y += 7) { ctx.beginPath(); ctx.ellipse(x, y + 3, 2.4, 4, (y / 7) % 2 ? 0 : Math.PI / 2, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(x, y1 + 8, 7, 0, TAU); ctx.stroke();
    if (this.cool <= 0) { ctx.fillStyle = `rgba(255,216,74,${0.25 + 0.2 * Math.sin(this.t * 5)})`; ctx.beginPath(); ctx.arc(x, y1 + 8, 11, 0, TAU); ctx.fill(); }
  }
}

const owlBoss = {
  id: 'ma_owl', name: 'The Brass Owl', hp: 3, dims: [44, 54], floats: true, music: 'tour_ma_boss', country: 'ma',
  brain: {
    guardText: 'CLANK!',
    phases: [2],
    hooks(b) { return b.g.entities.filter(e => e instanceof MaLidHook).sort((a, c) => a.hx - c.hx); },
    perchAt(b, k) { const H = this.hooks(b); if (!H.length) return; b.spot = (k + H.length) % H.length; b.tx = H[b.spot].hx - b.w / 2; },
    wake(b) { b.look = -1; b.turnT = 0; b.featherT = 2.5; this.perchAt(b, 1); b.g.toast('PULL A CHAIN WHILE THE OWL LOOKS AWAY!'); K.say(b.g, b, 'WHO-WHO GOES THERE?', '#ffe08a'); },
    hit(b, kind, src) {
      if (kind === 'hazard' && src && src.lid) { if (b.act === 'lap' || b.act === 'hop') return false; b.damage(1, { text: 'CLANG!', col: '#ffe08a' }); return true; }
      if (kind === 'stomp' || kind === 'spin') return 'bounce';
      return false;
    },
    // a chain was pulled: if the owl is watching Brady, it hops clear of that lid and answers with feathers
    onPull(b, hook, p, lid) {
      if (!hook || b.act === 'lap' || b.act === 'apart') return;
      const under = Math.abs(hook.hx - b.cx) < TS * 1.2;
      const watching = p && sign(p.cx - b.cx) === b.look && b.act !== 'turn';
      if (under && watching) { b.go('dodge'); K.say(b.g, b, 'SKREEEE!', '#ff9a6a'); K.sfx('screech', 'bossHit', { vol: 0.5, pitch: 1.8 }); b.volley = true; }
    },
    volley(b) {
      const g = b.g, p = g.player; if (!p) return;
      for (let k = -1; k <= 1; k++) tourFire(g, b.cx, b.y + 16, { kind: 'feather', vx: sign(p.cx - b.cx || 1) * (4.2 + k * 0.6) * TS, vy: (-5.5 + k * 1.6) * TS, grav: PHYS.gDown * 0.32, w: 16, h: 8, life: 2.6, thru: true, col: '#e8b84a', art: featherArt });
      Sound.play('throw', { pitch: 0.9 });
    },
    update(b, dt) {
      const g = b.g, p = g.player, fy = b.floorY - b.h;
      b.guard = 'bounce'; b.vuln = false;
      if (b.act === 'apart') {
        // the finish: the head spins faster and faster, then it falls apart into teaspoons
        b.turnSpin = (b.turnSpin || 0) + dt * (4 + b.at * 12);
        if (b.at > 1.4 && !b.spooned) { b.spooned = true; g.burst(b.cx, b.cy, 40, '#d8d8e8', 'debris'); g.burst(b.cx, b.cy, 20, '#e8b84a', 'debris'); g.parts.text(b.cx, b.y - 20, 'TEASPOONS!', '#ffe08a'); K.sfx('break', null, { vol: 0.7 }); }
        if (b.at > 1.6) b.die();
        return;
      }
      // the head turn: every 4 s, a 0.6 s clank, then it looks the other way
      if (b.act !== 'lap' && b.act !== 'hop') {
        b.turnT += dt;
        if (b.turnT > 3.4 && b.act !== 'turn' && b.act !== 'dazed') { b.go('turn'); K.sfx('clank', 'select', { vol: 0.5, pitch: 0.6 }); }
      }
      if (b.tx == null) this.perchAt(b, 1);
      if (b.act === 'walk' || b.act === 'perch') {
        b.pose = 'perch'; b.x = approach(b.x, b.tx, 2 * TS * dt); b.y = approach(b.y, fy, 6 * TS * dt);
        // looking at Brady: the feather volley (tell: the wings flare for 0.5 s)
        b.featherT -= dt;
        if (b.featherT <= 0 && p && sign(p.cx - b.cx) === b.look && Math.abs(p.cx - b.cx) < 9 * TS) { b.go('flare'); }
      } else if (b.act === 'flare') {
        b.pose = 'flare'; if (b.first) K.sfx('ruffle', 'select', { vol: 0.4, pitch: 1.5 });
        if (b.at > 0.5) { this.volley(b); b.featherT = (b.phase || 1) >= 2 ? 2.2 : 3; b.go('perch'); }
      } else if (b.act === 'turn') {
        b.pose = 'turn';
        if (b.at > 0.6) { b.look = -b.look; b.turnT = 0; b.go('perch'); }
      } else if (b.act === 'dodge') {
        // seen! it hops to the next perch, clear of the falling lid, and lets fly
        b.pose = 'hop';
        if (b.first) { const H = this.hooks(b); this.perchAt(b, b.spot + (b.cx < (b.arenaX0 + b.arenaX1) / 2 ? 1 : -1)); b.vy = -9 * TS; }
        b.x = approach(b.x, b.tx, 7 * TS * dt); b.vy += PHYS.gDown * 0.5 * dt; b.y = Math.min(fy, b.y + b.vy * dt);
        if (b.volley && b.at > 0.3) { b.volley = false; this.volley(b); }
        if (b.at > 0.6 && b.y >= fy) b.go('perch');
      } else if (b.act === 'dazed') {
        b.pose = 'dazed'; if (b.at > 1.2) { this.perchAt(b, b.spot + 1 + Math.floor(Math.random() * 2)); b.go((b.phase || 1) >= 2 ? 'lap' : 'hop'); }
      } else if (b.act === 'hop') {
        b.pose = 'hop'; if (b.first) b.vy = -10 * TS;
        b.x = approach(b.x, b.tx, 6 * TS * dt); b.vy += PHYS.gDown * 0.5 * dt; b.y = Math.min(fy, b.y + b.vy * dt);
        if (b.at > 0.4 && b.y >= fy && Math.abs(b.x - b.tx) < 2) b.go('perch');
      } else if (b.act === 'lap') {
        // phase 2: a lap of the room under the roof (feathers drift down), then it lands under a different lid
        b.pose = 'fly'; const cx = (b.arenaX0 + b.arenaX1) / 2, rx = (b.arenaX1 - b.arenaX0) / 2 - 2 * TS, a = b.at * 1.9;
        if (b.first) { b.lapX0 = b.x; K.say(g, b, 'WHO-WHOOSH!', '#ffe08a'); }
        if (b.at < 3.3) { b.x = cx + Math.cos(Math.PI + a) * rx - b.w / 2; b.y = fy - 4 * TS - Math.sin(a) * 1.5 * TS; if (Math.floor(b.at * 3) !== Math.floor((b.at - dt) * 3)) tourFire(g, b.cx, b.y + b.h, { kind: 'feather', vx: (Math.random() - 0.5) * 2 * TS, vy: 1.5 * TS, grav: PHYS.gDown * 0.12, w: 16, h: 8, life: 3, thru: true, col: '#e8b84a', art: featherArt }); }
        else { b.x = approach(b.x, b.tx, 7 * TS * dt); b.y = approach(b.y, fy, 7 * TS * dt); if (Math.abs(b.x - b.tx) < 2 && b.y >= fy - 1) { b.turnT = 0; b.go('perch'); } }
      }
      if (b.x !== b.tx && (b.act === 'perch' || b.act === 'hop')) b.dir = sign(b.tx - b.x) || b.dir;
    },
    hurt(b) { b.go('dazed'); K.say(b.g, b, pick(['WHO-OUCH!', 'MY GEARS!', 'TICK... TOCK?']), '#ffe08a'); },
    phase(b, n) { this.hurt(b); b.g.bannerText = 'THE OWL TAKES WING!'; b.g.bannerT = 2; },
    lastHit(b) { b.go('apart'); b.vuln = false; b.g.shake(8); return true; },
    draw(b, ctx, t) {
      const P = b.pose;
      ctx.save(); ctx.translate(b.cx, b.y + b.h);
      // the head swings right round while it turns (and spins when it falls apart); the eyes look `look`'s way
      const turn = P === 'turn' ? Math.min(1, b.at / 0.6) : b.act === 'apart' ? (b.turnSpin || 0) : 0;
      owlArt(ctx, t, { look: P === 'turn' && b.at > 0.3 ? -b.look : b.look, turn, wing: P === 'flare' ? 1 : P === 'fly' ? Math.abs(Math.sin(t * 14)) : P === 'hop' ? 0.5 : 0, fly: P === 'fly', angry: P === 'flare' || P === 'hop', dazed: P === 'dazed' });
      if (P === 'turn') { ctx.fillStyle = '#ffffff'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('CLANK', 0, -78 - Math.sin(t * 30) * 2); }
      // which way it is watching: a soft cone so the player can read it from afar
      if (P !== 'fly' && P !== 'dazed' && b.act !== 'apart') { ctx.fillStyle = 'rgba(255,220,120,0.12)'; ctx.beginPath(); ctx.moveTo(b.look * 10, -48); ctx.lineTo(b.look * 170, -10); ctx.lineTo(b.look * 170, -90); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
  }
};

/* ---------------- the overhaul cast (LEVEL_OVERHAUL.md §4.3): moths, cats, storks ---------------- */
// procedural art (the ma_x atlas draws them once it is in; these are the fallback and keep the ink outline)
const mothArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1);
  const flap = Math.sin((t || 0) * 16) * 0.35;
  // rug-patterned wings
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(-2, -12); ctx.rotate(s * (0.5 + flap)); ctx.fillStyle = RUG[0]; ctx.beginPath(); ctx.ellipse(0, s * -9, 7, 11, 0, 0, TAU); ctx.fill(); ctx.fillStyle = RUG[1]; ctx.fillRect(-4, s * -9 - 1, 8, 2); ctx.fillStyle = RUG[2]; ctx.save(); ctx.translate(0, s * -13); ctx.rotate(Math.PI / 4); ctx.fillRect(-2, -2, 4, 4); ctx.restore(); ctx.restore(); }
  // fluffy cream body
  ctx.fillStyle = '#f4e8d0'; ctx.beginPath(); ctx.ellipse(0, -9, 10, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e0d0b0'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-6 + k * 4, -4, 2.5, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(7, -14); ctx.quadraticCurveTo(10, -22, 13 + s * 3, -22); ctx.stroke(); }
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 6, -11, 1, 2.6, 2, false);
  if (m === 'eat') { ctx.fillStyle = '#5a2a2a'; ctx.beginPath(); ctx.arc(9, -6, 2.5, 0, TAU); ctx.fill(); ctx.fillStyle = RUG[0]; ctx.fillRect(11, -7, 3, 2); }
  ctx.restore();
};
const catArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1);
  const sleep = m === 'sleep', crouch = m === 'crouch' || m === 'tell';
  ctx.fillStyle = '#e8964a';
  if (sleep) {
    // curled up in a ginger loop, tail over the nose
    ctx.beginPath(); ctx.ellipse(0, -8, 14, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff4e4'; ctx.beginPath(); ctx.ellipse(6, -6, 5, 4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8964a'; ctx.beginPath(); ctx.arc(8, -12, 6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(4, -16); ctx.lineTo(5, -22); ctx.lineTo(9, -17); ctx.fill(); ctx.beginPath(); ctx.moveTo(10, -17); ctx.lineTo(13, -22); ctx.lineTo(13, -15); ctx.fill();
    ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1.4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(8 + s * 2.5, -12, 1.6, 0.2, Math.PI - 0.2); ctx.stroke(); }
    ctx.strokeStyle = '#c8763a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-12, -6); ctx.quadraticCurveTo(-4, 2, 10, -4); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.restore(); return;
  }
  const by = crouch ? -7 : -11;
  ctx.beginPath(); ctx.ellipse(-2, by, 13, crouch ? 6 : 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff4e4'; ctx.beginPath(); ctx.ellipse(7, by + 2, 5, 4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8964a'; if (!crouch) for (const lx of [-10, -4, 4, 9]) ctx.fillRect(lx - 1.5, by + 4, 3, -by - 4);
  ctx.beginPath(); ctx.arc(11, by - 6, 6.5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6, by - 10); ctx.lineTo(7, by - 18); ctx.lineTo(11, by - 12); ctx.fill(); ctx.beginPath(); ctx.moveTo(12, by - 12); ctx.lineTo(16, by - 18); ctx.lineTo(16, by - 9); ctx.fill();
  ctx.strokeStyle = '#c8763a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-14, by); ctx.quadraticCurveTo(-22, by - 4 + Math.sin((t || 0) * 8) * 4, -18, by - 14); ctx.stroke(); ctx.lineCap = 'butt';
  if (m !== 'ko') { ctx.fillStyle = m === 'tell' ? '#ffe84a' : '#7ad84a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(12 + s * 2.6, by - 7, 1.6, 2.2, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = '#1a1020'; for (const s of [-1, 1]) ctx.fillRect(12 + s * 2.6 - 0.5, by - 8.5, 1, 3); }
  ctx.fillStyle = '#e87a8a'; ctx.beginPath(); ctx.arc(15, by - 4, 1.2, 0, TAU); ctx.fill();
  ctx.restore();
};
const storkArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const flap = m === 'rest' ? 0 : Math.sin((t || 0) * 9) * 0.6;
  ctx.fillStyle = '#2a2a34'; for (const s of [-1, 1]) { ctx.save(); ctx.translate(-2, -2); ctx.rotate(s * 0.2 - flap * s); ctx.beginPath(); ctx.ellipse(-4, s * -10, 14, 6, s * 0.3, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = '#fbfbf6'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 8, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#fbfbf6'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(10, -3); ctx.quadraticCurveTo(16, -8, 16, -14); ctx.stroke();
  ctx.fillStyle = '#fbfbf6'; ctx.beginPath(); ctx.arc(17, -15, 5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8502a'; ctx.beginPath(); ctx.moveTo(21, -16); ctx.lineTo(32, m === 'swoop' ? -10 : -14); ctx.lineTo(21, -13); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e8603a'; ctx.lineWidth = 2; for (const s of [0, 4]) { ctx.beginPath(); ctx.moveTo(-6 + s, 6); ctx.lineTo(-12 + s, m === 'swoop' ? 18 : 14); ctx.stroke(); }
  if (m !== 'ko') K.eyes(ctx, 18, -16, 1, 0, 1.8, m === 'swoop');
  ctx.restore();
};
// the rug moth: it walks rug platforms and eats the tile behind it (it grows back): the country's headline power
const MA_X = 'ma_x';
const maEnemies = {
  maMoth: { cls: TourEnemy.make({ w: 24, h: 18, speed: 0.7, behavior: 'platEater', every: 1.2, regrow: 6, edgeTurn: true, atlas: MA_X, art: mothArt, burst: '#f4e8d0' }), place: 'walk' },
  maCat: { cls: TourEnemy.make({ w: 26, h: 20, speed: 1.4, behavior: 'sleeper', base: 'pouncer', phaseWake: true, hear: 3, range: 6, tell: 1.0, atlas: MA_X, art: catArt, burst: '#e8964a' }), place: 'walk' },
  maStork: { cls: TourFlyer.make({ w: 34, h: 24, speed: 0.7, range: 3, swoop: true, atlas: MA_X, art: storkArt, burst: '#fbfbf6', onSwoop: e => K.sfx('clatter', 'select', { vol: 0.4, pitch: 1.4 }) }), place: 'fly' }
};
// modes the behaviours use that the atlas has under another name
for (const [m, list] of [['wake', ['wake', 'tell', 'walk']], ['land', ['land', 'stun', 'walk']], ['awake', ['walk']], ['eat', ['eat', 'walk']], ['shell', ['shell', 'stun', 'walk']]]) if (!TourSprite.FALLBACK.walk[m]) TourSprite.FALLBACK.walk[m] = list;
if (!TourSprite.FALLBACK.fly.rest) TourSprite.FALLBACK.fly.rest = ['rest', 'fly'];
/* the street snail of Chefchaouen: by day it stays tucked in its shell (harmless, a little step to stand on); at night
   it comes out and leaves a slick trail (trailLayer) */
TourBehave.maShellSnail = {
  think(e, dt) {
    const A = e.g.area;
    if (A.phase && !A.night) { e.vx = 0; e.mode = 'shell'; return; }
    TourBehave.trailLayer.think(e, dt);
  },
  touch(e, p) { const A = e.g.area; return !!(A.phase && !A.night); },
  hit(e, kind) { const A = e.g.area; if ((kind === 'stomp' || kind === 'spin') && A.phase && !A.night) return 'bounce'; return undefined; }
};

/* ---------------- level objects ---------------- */
// 5-1: the unlit lantern in the lantern shop. Stand under it for a second: it lights and the back wall slides open
class MaShopLantern extends Ent {
  constructor(g, s) { super(g, s, 30, 40); this.opens = s.opens; this.k = 0; this.lit = false; this.always = true; }
  update(dt) {
    this.t += dt; const p = this.g.player;
    if (this.lit) return;
    const under = p && !p.dead && p.onGround && Math.abs(p.cx - this.cx) < 22 && Math.abs(p.y + p.h - (this.y + this.h)) < 12;
    this.k = under ? this.k + dt : Math.max(0, this.k - dt * 2);
    if (under && Math.random() < 0.3) this.g.burst(this.cx + (Math.random() - 0.5) * 10, this.y - 70, 1, '#ffd890', 'spark');
    if (this.k >= 1) {
      this.lit = true; TourLock.open(this.g, this.opens); K.sfx('relight', 'checkpoint', { vol: 0.7 }); this.g.burst(this.cx, this.y - 60, 24, '#ffd890', 'spark');
      this.g.toast('THE LANTERN LIGHTS... AND THE BACK WALL SLIDES OPEN!'); this.g.shake(2);
    }
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h - 76, on = this.lit ? 1 : this.k;
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - 60); ctx.lineTo(x, y - 14); ctx.stroke();
    // a pierced brass lantern; unlit it is dull with a single glint, lighting up it glows through its star holes
    ctx.fillStyle = on > 0.05 ? '#e8c050' : '#8a7a5a'; ctx.beginPath(); ctx.moveTo(x - 9, y - 14); ctx.lineTo(x + 9, y - 14); ctx.lineTo(x + 12, y + 6); ctx.lineTo(x, y + 16); ctx.lineTo(x - 12, y + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a4a2a'; ctx.fillRect(x - 10, y - 17, 20, 4);
    for (let k = 0; k < 5; k++) { ctx.fillStyle = on > 0.05 ? `rgba(255,${200 + Math.sin(this.t * 6 + k) * 30},110,${Math.min(1, 0.3 + on)})` : '#3a2a1a'; ctx.beginPath(); TourKit.star(ctx, x - 6 + (k % 3) * 6, y - 6 + Math.floor(k / 3) * 8, 2.2, 1, 5); ctx.fill(); }
    if (!this.lit) { ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(this.t * 3)})`; ctx.fillRect(x + 5, y - 10, 2, 2); }
    if (this.k > 0 && !this.lit) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y + 30, 9, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, this.k)); ctx.stroke(); }
  }
  get light() { return this.lit || this.k > 0 ? { r: 60 + 90 * (this.lit ? 1 : this.k), c: 'rgba(255,214,140,', y: this.y + this.h - 76 } : null; }
}
// 5-2: mirage slabs over the quicksand: on 2 s, off 1 s (each one with its own phase), a shimmer before they vanish
class MaMirageSlab extends Ent {
  constructor(g, s) { super(g, s, (s.w || 3) * TS, 10); this.x = s.x - TS / 2; this.y = s.y - TS; this.tx = Math.floor(s.x / TS); this.ty = Math.floor((s.y - 1) / TS); this.n = s.w || 3; this.ph = s.phase || 0; this.on = true; this.back = true; this.always = true; }
  update(dt) {
    this.t += dt; const c = (this.t + this.ph) % 3, on = c < 2;
    this.warn = c > 1.6 && c < 2;
    if (on !== this.on) {
      // never vanish from under Brady's feet mid-frame without the shimmer (it shimmered for 0.4 s first)
      this.on = on; for (let k = 0; k < this.n; k++) this.g.setTile(this.tx + k, this.ty, on ? T.SEMI : T.EMPTY);
      if (!on && this.g.onScreen(this, 40)) this.g.burst(this.cx, this.y + 4, 6, '#fff0c8', 'spark');
    }
  }
  draw(ctx) {
    // a mirage reads as water on the sand: a cool turquoise slab of shimmering "water", inked dark so it pops against the
    // warm dunes; it flickers for the last 0.4 s; while gone a dashed ghost and a faint glint mark where it comes back
    const x = this.x + 2, y = this.y, w = this.w - 4;
    if (this.on) {
      const a = this.warn ? 0.68 + 0.32 * Math.sin(this.t * 40) : 1;
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(40,20,10,0.25)'; ctx.beginPath(); ctx.ellipse(this.cx, y + 20, w / 2, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2ab0c8'; rr(ctx, x, y, w, 14, 5); ctx.fill();
      ctx.fillStyle = '#8ae8f4'; rr(ctx, x, y, w, 6, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let k = 0; k < Math.floor(w / 30); k++) ctx.fillRect(x + 8 + k * 30 + Math.sin(this.t * 6 + k) * 4, y + 9, 12, 2);
      ctx.strokeStyle = '#123a52'; ctx.lineWidth = 2.5; rr(ctx, x, y, w, 14, 5); ctx.stroke();
      // heat shimmer above it
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2;
      for (let k = 0; k < 3; k++) { const sx = x + (k + 0.5) * w / 3, ph = (this.t * 1.5 + k * 0.33) % 1; ctx.globalAlpha = a * (1 - ph); ctx.beginPath(); ctx.moveTo(sx, y - 4 - ph * 14); ctx.quadraticCurveTo(sx + 4, y - 8 - ph * 14, sx, y - 12 - ph * 14); ctx.stroke(); }
      ctx.restore();
    } else {
      ctx.save(); ctx.fillStyle = 'rgba(138,232,244,0.22)'; rr(ctx, x, y, w, 14, 5); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); rr(ctx, x, y + 1, w, 12, 5); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
  }
}
// 5-3: laundry lines (day only) and strings of lanterns to stand on (night only), drawn over their toggle tiles
class MaPhaseLine extends Ent {
  constructor(g, s) { super(g, s, (s.w || 4) * TS, 12); this.x = s.x - TS / 2; this.y = s.y - TS; this.gi = s.g || 0; this.night = !!s.night; this.k = 1; this.back = true; this.seed = Math.floor(s.x / TS); }
  get present() { const bit = this.g.toggleBit ? this.g.toggleBit(this.gi) : false; return this.night ? !!bit : !bit; }
  update(dt) { this.t += dt; this.k = approach(this.k, this.present ? 1 : 0, dt * 4); }
  draw(ctx) {
    const x0 = this.x, x1 = this.x + this.w, y = this.y + 2, t = this.t, k = this.k;
    if (!this.night) {
      // poles and a line of washing; the line itself is the platform (it sags a little)
      ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x0 - 2, y - 10, 4, 40); ctx.fillRect(x1 - 2, y - 10, 4, 40);
      if (k < 0.05) return;
      ctx.save(); ctx.globalAlpha = k;
      ctx.strokeStyle = '#f4f0e6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + 5, x1, y); ctx.stroke();
      const cols = ['#e8503a', '#ffffff', '#f0c040', '#3aa86a', '#e86aa8', '#4a86d0'];
      for (let q = 0, xx = x0 + 6; xx < x1 - 14; xx += 18, q++) { const sag = Math.sin((xx - x0) / (x1 - x0) * Math.PI) * 4, sw = Math.sin(t * 2 + q) * 2; ctx.fillStyle = cols[(q + this.seed) % cols.length]; ctx.beginPath(); ctx.moveTo(xx, y + sag); ctx.lineTo(xx + 14, y + sag); ctx.lineTo(xx + 13 + sw, y + sag + 16); ctx.lineTo(xx + 1 + sw, y + sag + 16); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#c8c0b0'; ctx.fillRect(xx + 2, y + sag - 2, 2, 4); ctx.fillRect(xx + 10, y + sag - 2, 2, 4); }
      ctx.restore(); return;
    }
    // night: a string of glowing brass lanterns hung between hooks; the string is the platform
    ctx.fillStyle = '#3a3440'; ctx.fillRect(x0 - 3, y - 6, 6, 6); ctx.fillRect(x1 - 3, y - 6, 6, 6);
    if (k < 0.05) { ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = '#a8c8ff'; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.restore(); return; }
    ctx.save(); ctx.globalAlpha = k;
    ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    for (let xx = x0 + 10; xx < x1 - 4; xx += 20) { ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.moveTo(xx - 5, y); ctx.lineTo(xx + 5, y); ctx.lineTo(xx + 6, y + 9); ctx.lineTo(xx, y + 14); ctx.lineTo(xx - 6, y + 9); ctx.closePath(); ctx.fill(); ctx.fillStyle = `rgba(255,${200 + Math.sin(t * 5 + xx) * 30},110,0.95)`; ctx.fillRect(xx - 2.5, y + 3, 5, 6); }
    ctx.restore();
  }
  get light() { return this.night && this.k > 0.5 ? { r: 70 + this.w * 0.4, c: 'rgba(255,214,140,', y: this.y + 8 } : null; }
}
// 5-4: the portcullis of the kasbah: it rattles up as Brady comes near, with the FORT banner
class MaPortcullis extends Ent {
  constructor(g, s) { super(g, s, TS * 2, 4 * TS); this.k = 0; this.open = false; this.back = true; this.title = s.title || 'FORT'; }
  update(dt) { this.t += dt; const p = this.g.player; if (!this.open && p && Math.abs(p.cx - this.cx) < 7 * TS) { this.open = true; this.g.bannerText = this.title; this.g.bannerT = 2.2; K.sfx('chain', 'select', { vol: 0.6, pitch: 0.6 }); this.g.shake(2); } this.k = approach(this.k, this.open ? 1 : 0, dt * 1.2); }
  draw(ctx) {
    const x = this.x, y = this.y - this.k * 3.4 * TS, w = this.w, h = this.h;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 6, this.y - 4 * TS, w + 12, h + 4 * TS); ctx.clip();
    ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 5; for (let k = 0; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(x + k * w / 4, y); ctx.lineTo(x + k * w / 4, y + h); ctx.stroke(); }
    for (let k = 0; k <= 5; k++) { ctx.beginPath(); ctx.moveTo(x, y + k * h / 5); ctx.lineTo(x + w, y + k * h / 5); ctx.stroke(); }
    ctx.fillStyle = '#4a3a2a'; for (let k = 0; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(x + k * w / 4 - 4, y + h); ctx.lineTo(x + k * w / 4, y + h + 8); ctx.lineTo(x + k * w / 4 + 4, y + h); ctx.fill(); }
    ctx.restore();
  }
}
const maEntities = { maShopLantern: MaShopLantern, maMirageSlab: MaMirageSlab, maPhaseLine: MaPhaseLine, maPortcullis: MaPortcullis, maLidHook: MaLidHook, maChain: MaChain };

/* ---------------- decor for the new levels ---------------- */
const maDecor = {
  // painted flower pots on a blue wall (5-3)
  maFlowerPots(ctx, x, y, t, th, d) { const s = (d && d.seed) || 0; for (let k = 0; k < 3; k++) { const px = x - 12 + k * 12, c = ['#e8503a', '#f0c040', '#3aa86a', '#e86aa8'][(k + s) % 4]; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(px - 5, y - 10); ctx.lineTo(px + 5, y - 10); ctx.lineTo(px + 4, y); ctx.lineTo(px - 4, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#3a8a3a'; ctx.beginPath(); ctx.arc(px, y - 13, 4, 0, TAU); ctx.fill(); ctx.fillStyle = ['#ff5a6a', '#ffffff', '#ffd84a'][(k + s) % 3]; ctx.beginPath(); ctx.arc(px + 1, y - 15, 2, 0, TAU); ctx.fill(); } },
  // a dyer's vat of saffron, paprika or indigo (5-1)
  maDyeVat(ctx, x, y, t, th, d) { const c = ['#f0c02a', '#d8402a', '#2a4aa8', '#3aa86a'][(d && d.seed || 0) % 4]; ctx.fillStyle = '#c8b898'; ctx.beginPath(); ctx.ellipse(x, y - 4, 22, 6, 0, 0, TAU); ctx.fill(); ctx.fillRect(x - 22, y - 16, 44, 12); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y - 16, 20, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(x - 6 + Math.sin(t + x) * 3, y - 17, 5, 1.5, 0, 0, TAU); ctx.fill(); },
  // a hanging bundle of dyed wool skeins
  maSkeins(ctx, x, y, t, th, d) { ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 30, y - 70); ctx.lineTo(x + 30, y - 70); ctx.stroke(); for (let k = 0; k < 5; k++) { ctx.fillStyle = ['#f0c02a', '#d8402a', '#2a4aa8', '#3aa86a', '#e86aa8'][(k + (d && d.seed || 0)) % 5]; ctx.beginPath(); ctx.ellipse(x - 24 + k * 12, y - 56 + Math.sin(t * 1.5 + k) * 1.5, 4, 13, 0, 0, TAU); ctx.fill(); } },
  // a tent of striped cloth (the oasis camp, the sky tent)
  maTentBack(ctx, x, y) { ctx.fillStyle = '#8a3a2a'; ctx.beginPath(); ctx.moveTo(x - 80, y); ctx.lineTo(x, y - 110); ctx.lineTo(x + 80, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#e8c890'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 80 + k * 40, y); ctx.lineTo(x, y - 110); ctx.lineTo(x - 70 + k * 40, y); ctx.closePath(); ctx.fill(); } },
  // a cage of a cooing pigeon (the loft)
  maPigeon(ctx, x, y, t) { ctx.fillStyle = '#a8a8b8'; ctx.beginPath(); ctx.ellipse(x, y - 8, 9, 7, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x + 7, y - 14 + Math.sin(t * 4 + x) * 1.5, 4.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#7ac8a8'; ctx.fillRect(x + 3, y - 12, 6, 2); ctx.fillStyle = '#e8803a'; ctx.beginPath(); ctx.moveTo(x + 11, y - 14); ctx.lineTo(x + 14, y - 13); ctx.lineTo(x + 11, y - 12); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(x + 8.5, y - 15, 1, 0, TAU); ctx.fill(); },
  // an orange tree in a riad (5-3's courtyard, 5-5's)
  maOrangeTree(ctx, x, y, t) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 3, y - 50, 6, 50); ctx.fillStyle = '#3a8a3a'; ctx.beginPath(); ctx.arc(x, y - 62, 26, 0, TAU); ctx.fill(); ctx.fillStyle = '#4aa04a'; ctx.beginPath(); ctx.arc(x - 8, y - 68, 14, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff8a1a'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(x - 16 + (k * 13) % 32, y - 74 + (k * 7) % 26, 3.2, 0, TAU); ctx.fill(); } },
  // a big terracotta oil jar
  maJar(ctx, x, y) { ctx.fillStyle = '#c8643a'; ctx.beginPath(); ctx.moveTo(x - 6, y - 34); ctx.quadraticCurveTo(x - 18, y - 22, x - 9, y); ctx.lineTo(x + 9, y); ctx.quadraticCurveTo(x + 18, y - 22, x + 6, y - 34); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#9a4426'; ctx.fillRect(x - 7, y - 37, 14, 4); ctx.fillStyle = ZEL[0]; ctx.fillRect(x - 12, y - 20, 24, 3); }
};

/* ---------------- country looks for library objects ---------------- */
const maSkins = {
  // the souk's rug-curtain doors: the colour is the clue (follow saffron yellow)
  maDoorSaffron(ctx, e, t) { maRugDoor(ctx, e, t, '#f0c02a', '#b8861a'); },
  maDoorPaprika(ctx, e, t) { maRugDoor(ctx, e, t, '#d8402a', '#8a2418'); },
  maDoorIndigo(ctx, e, t) { maRugDoor(ctx, e, t, '#2a4aa8', '#16286a'); },
  maDoorMint(ctx, e, t) { maRugDoor(ctx, e, t, '#3aa86a', '#1e6a40'); },
  // the lantern shop's doorway, hung with a dozen lanterns
  maShopDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#e8b088'; arch(ctx, x - 20, y - 56, 40, 56); ctx.fill(); ctx.fillStyle = '#2a1820'; arch(ctx, x - 15, y - 50, 30, 50); ctx.fill(); for (let k = 0; k < 4; k++) { const lx = x - 12 + k * 8; ctx.fillStyle = '#c8a03a'; ctx.fillRect(lx - 3, y - 40 + (k % 2) * 6, 6, 8); ctx.fillStyle = `rgba(255,${200 + Math.sin(t * 5 + k) * 30},110,0.95)`; ctx.fillRect(lx - 1.5, y - 38 + (k % 2) * 6, 3, 4); } },
  // the carved cedar panel at the back of the lantern shop (a shutter): it slides up into the ceiling
  maSlideWall(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w, h = e.h * (1 - e.k * 0.95);
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(x - 3, y - 4, w + 6, 4);
    ctx.fillStyle = '#9a6038'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#c8945a'; ctx.lineWidth = 1.4; for (let yy = 6; yy < h - 4; yy += 12) { ctx.beginPath(); ctx.arc(x + w / 2, y + yy + 4, 5, 0, TAU); ctx.stroke(); }
  },
  // the sun-moon lantern (5-3's phase switch): a brass lantern on a post with a sun on one side and a moon on the other
  maSunMoon(ctx, e, t) {
    const x = e.cx, y = e.y + e.h, night = e.g && e.g.area && e.g.area.night, k = e.spinA || 0;
    ctx.fillStyle = '#3a3440'; ctx.fillRect(x - 2, y - 46, 4, 46); ctx.fillRect(x - 9, y - 4, 18, 4);
    ctx.save(); ctx.translate(x, y - 56); ctx.scale(Math.cos(t * 1.2) * 0.2 + 0.8, 1);
    ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.moveTo(-10, -12); ctx.lineTo(10, -12); ctx.lineTo(12, 6); ctx.lineTo(0, 14); ctx.lineTo(-12, 6); ctx.closePath(); ctx.fill();
    if (night) { ctx.fillStyle = '#e8f0ff'; ctx.beginPath(); ctx.arc(0, -1, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.arc(3, -3, 5.5, 0, TAU); ctx.fill(); }
    else { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(0, -1, 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 1.5; for (let q = 0; q < 8; q++) { const a = q * Math.PI / 4 + t; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 7, -1 + Math.sin(a) * 7); ctx.lineTo(Math.cos(a) * 9.5, -1 + Math.sin(a) * 9.5); ctx.stroke(); } }
    ctx.restore();
    if (!e.told) { ctx.fillStyle = `rgba(255,216,74,${0.2 + 0.15 * Math.sin(t * 4)})`; ctx.beginPath(); ctx.arc(x, y - 56, 18, 0, TAU); ctx.fill(); }
  },
  // the door painted the same blue as the wall (5-3's secret): at night a lantern hangs over it
  maBlueDoor(ctx, e, t) {
    const x = e.cx || (e.x + e.w / 2), y = (e.y + e.h), night = e.g && e.g.area && e.g.area.night;
    ctx.strokeStyle = 'rgba(30,60,140,0.35)'; ctx.lineWidth = 1.5; arch(ctx, x - 15, y - 54, 30, 54); ctx.stroke();
    ctx.fillStyle = 'rgba(30,60,140,0.12)'; arch(ctx, x - 15, y - 54, 30, 54); ctx.fill();
    ctx.fillStyle = 'rgba(30,60,140,0.4)'; ctx.beginPath(); ctx.arc(x + 9, y - 26, 2, 0, TAU); ctx.fill();
    if (night) { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y - 92); ctx.lineTo(x, y - 74); ctx.stroke(); ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.moveTo(x - 6, y - 74); ctx.lineTo(x + 6, y - 74); ctx.lineTo(x + 8, y - 62); ctx.lineTo(x, y - 56); ctx.lineTo(x - 8, y - 62); ctx.closePath(); ctx.fill(); ctx.fillStyle = `rgba(255,${210 + Math.sin(t * 6) * 30},120,0.95)`; ctx.fillRect(x - 3, y - 71, 6, 8); }
  },
  // the riad's door back to the street
  maRiadDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#f4ecd8'; arch(ctx, x - 20, y - 58, 40, 58); ctx.fill(); ctx.fillStyle = '#1a6ab8'; arch(ctx, x - 15, y - 52, 30, 52); ctx.fill(); ctx.fillStyle = '#c8a03a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * 5, y - 26, 2.4, 0, TAU); ctx.fill(); } ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 52); ctx.lineTo(x, y); ctx.stroke(); },
  // the oasis camp tent flap
  maTentDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#8a3a2a'; ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.lineTo(x, y - 60); ctx.lineTo(x + 24, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2a1410'; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x, y - 40 - Math.sin(t * 2) * 2); ctx.lineTo(x + 12, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#e8c890'; ctx.fillRect(x - 24, y - 4, 48, 4); },
  // the kasbah tower door, iron-studded
  maKasbahDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#a8603a'; arch(ctx, x - 20, y - 60, 40, 60); ctx.fill(); ctx.fillStyle = '#5a3420'; arch(ctx, x - 15, y - 54, 30, 54); ctx.fill(); ctx.fillStyle = '#2a2430'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x - 8 + (k % 2) * 16, y - 44 + Math.floor(k / 2) * 16, 2, 0, TAU); ctx.fill(); } },
  // the shutter that the tower chain raises: a wooden grille
  maGrille(ctx, e, t) { const x = e.x, y = e.y, w = e.w, h = e.h * (1 - e.k * 0.92); ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x - 2, y - 6, w + 4, 6); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3; for (let xx = 4; xx < w; xx += 8) { ctx.beginPath(); ctx.moveTo(x + xx, y); ctx.lineTo(x + xx, y + h); ctx.stroke(); } for (let yy = 6; yy < h; yy += 10) { ctx.beginPath(); ctx.moveTo(x, y + yy); ctx.lineTo(x + w, y + yy); ctx.stroke(); } },
  // the carved cedar screen hiding 5-5's little courtyard (a curtain)
  maCarvedScreen(ctx, e, t) {
    const x0 = e.x, y0 = e.y, w = e.w, h = e.h, part = e.part || 0;
    ctx.save(); ctx.globalAlpha = 1 - part * 0.6;
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(x0 - 2, y0 - 6, w + 4, h + 6);
    ctx.strokeStyle = '#c8945a'; ctx.lineWidth = 1.5; for (let yy = y0; yy < y0 + h - 4; yy += 10) for (let xx = x0 + 5; xx < x0 + w - 2; xx += 10) { ctx.beginPath(); ctx.arc(xx, yy + 4, 3.5, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
};
function maRugDoor(ctx, e, t, c, c2) {
  const x = e.cx, y = e.y + e.h;
  // a zellige archway with a rug curtain in the clue colour, a matching spice cone on the sill
  ctx.fillStyle = '#e8d8b8'; arch(ctx, x - 20, y - 58, 40, 58); ctx.fill();
  ctx.fillStyle = ZEL[0]; ctx.fillRect(x - 20, y - 6, 40, 6);
  ctx.fillStyle = '#2a1820'; arch(ctx, x - 15, y - 52, 30, 52); ctx.fill();
  const sw = Math.sin(t * 1.6) * 1.5;
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 15, y - 44); ctx.lineTo(x + 15, y - 44); ctx.lineTo(x + 14 + sw, y - 4); ctx.lineTo(x - 14 + sw, y - 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = c2; for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(x + sw * 0.5, y - 34 + k * 11); ctx.rotate(Math.PI / 4); ctx.fillRect(-3.5, -3.5, 7, 7); ctx.restore(); }
  ctx.fillStyle = '#f4e8d0'; ctx.fillRect(x - 15, y - 45, 30, 3);
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + 18, y); ctx.lineTo(x + 23, y - 9); ctx.lineTo(x + 28, y); ctx.closePath(); ctx.fill();
}
// a flying rug as a moving platform (5-6)
const maPlatforms = {
  maFlyingRug(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = RUG[0]; ctx.beginPath(); ctx.moveTo(x, y + 2 + Math.sin(t * 6) * 2); for (let k = 0; k <= 8; k++) ctx.lineTo(x + k * w / 8, y + 2 + Math.sin(t * 6 + k * 0.8) * 2.5); ctx.lineTo(x + w, y + 10); ctx.lineTo(x, y + 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = RUG[1]; ctx.fillRect(x + 4, y + 5, w - 8, 2); ctx.fillStyle = RUG[2]; for (let k = 0; k < w / 16; k++) ctx.fillRect(x + 8 + k * 16, y + 4, 4, 4);
    ctx.strokeStyle = RUG[3]; ctx.lineWidth = 1; for (const s of [0, 1]) for (let k = 0; k < 3; k++) { const fx = s ? x + w : x; ctx.beginPath(); ctx.moveTo(fx, y + 4 + k * 2); ctx.lineTo(fx + (s ? 5 : -5), y + 5 + k * 2 + Math.sin(t * 10 + k) * 1.5); ctx.stroke(); }
  }
};
const MA_KICKPOT_CFG = { w: 34, h: 30, kick: 7, bounce: 0.4, friction: 6, hp: 0, burst: '#c8643a', art: (ctx, e, x, y, t) => { ctx.save(); ctx.translate(x, y); ctx.scale(0.74, 0.74); potBody(ctx, 0, 0, t, {}); ctx.restore(); } };
const entities = Object.assign({ maStorm: MaStorm, maPot: MaPot, maMirage: MaMirage, maGale: MaGale, maKickPot: TourProp.make(MA_KICKPOT_CFG) }, maEntities);
Object.assign(enemies, maEnemies);
Object.assign(decor, maDecor);
Object.assign(platforms, maPlatforms);

/* ---------------- music: oud and guembri, qraqeb castanets, ney flute in the desert ---------------- */
const tracks = {
  tour_ma: {
    bpm: 112, bars: 8, rv: 0.3, dl: 0.12, hx: 0.06,
    ch: 'E F E Dm E F G E',
    ld: 'E5:2 F5:2 G#5:2 A5:2 B5:4 A5:4 | C6:2 B5:2 A5:2 G#5:2 F5:8 | E5:2 G#5:2 B5:2 E6:2 D6:4 B5:4 | D6:2 C6:2 A5:2 F5:2 D5:8 |' +
        'E5:2 F5:2 G#5:4 B5:4 A5:4 | C6:2 B5:2 A5:2 C6:2 F6:8 | G5:2 B5:2 D6:2 F6:2 E6:4 D6:4 | E6:12 .:4',
    li: 'pluck', lv: 0.17,
    bp: 'r..r..r.r.r.....', bi: 'pluckb', bv: 0.32,
    ap: '0.1.0.2.0.1.0.2.', ai: 'pluck', av: 0.04, ao: 60,
    dr: ['k......k..k.....', 'l.ll.ll.l.ll.ll.', '....c.......c...', 'd...b..d..b.d...'], dv: 0.42
  },
  tour_ma_desert: {
    bpm: 84, bars: 8, rv: 0.6, dl: 0.25,
    ch: 'Dm Dm Bb A Dm Dm Gm A',
    ld: 'D5:6 E5:2 F5:4 A5:4 | G5:4 F5:4 E5:8 | F5:4 E5:2 D5:2 C#5:8 | D5:12 .:4 | A5:6 Bb5:2 A5:4 G5:4 | F5:4 G5:4 A5:8 | Bb5:4 A5:4 G5:4 F5:2 E5:2 | D5:12 .:4',
    li: 'whistle', lv: 0.13,
    bp: 'r.......r...r...', bi: 'pluckb', bv: 0.26,
    ap: '0...2...1...0...', ai: 'pluck', av: 0.04, ao: 58,
    dr: ['d.......d..d....', '....b.......b...', 'l.l.l.l.l.l.l.l.'], dv: 0.32
  },
  tour_ma_night: {
    bpm: 120, bars: 8, rv: 0.35, dl: 0.15,
    ch: 'Am Bb Am Gm Am Bb C Am',
    ld: 'A5:2 Bb5:2 C#6:2 D6:2 E6:4 D6:4 | F6:2 E6:2 D6:2 C#6:2 Bb5:8 | A5:2 C#6:2 E6:2 A6:2 G6:4 E6:4 | F6:2 E6:2 D6:2 Bb5:2 G5:8 |' +
        'A5:2 Bb5:2 C#6:4 E6:4 D6:4 | F6:2 E6:2 D6:2 F6:2 Bb6:8 | C6:2 E6:2 G6:2 E6:2 C#6:4 Bb5:4 | A5:12 .:4',
    li: 'reed', lv: 0.13,
    bp: 'r.r..r.r..r.r...', bi: 'pluckb', bv: 0.32,
    ap: '0.1.0.2.0.1.0.2.', ai: 'pluck', av: 0.04, ao: 60,
    dr: ['k..k..k.k..k..k.', 'l.lll.lll.lll.ll', '....c.......c...', 'd.b.d.b.d.b.d.bb'], dv: 0.44
  },
  tour_ma_boss: {
    bpm: 160, bars: 8, rv: 0.2, hx: 0.1,
    ch: 'E F E F G F E E',
    ld: 'E6:2 F6:2 E6:2 C6:2 B5:2 A5:2 G#5:4 | F5:2 A5:2 C6:2 F6:2 E6:8 | E5:2 G#5:2 B5:2 E6:2 G#6:4 E6:4 | F6:2 E6:2 D6:2 C6:2 A5:8 |' +
        'G5:2 B5:2 D6:2 G6:2 F6:4 D6:4 | F6:2 E6:2 C6:2 A5:2 F5:8 | E5:2 F5:2 G#5:2 B5:2 C6:4 B5:4 | E6:12 .:4',
    li: 'brass', lv: 0.16,
    bp: 'r.r.r.o.r.r.r.f.', bi: 'sawb', bv: 0.28,
    ap: 'c-..c-..c-..c-..', ai: 'pluck', av: 0.05, ao: 60,
    dr: ['K...k...K...k.k.', 'l.ll.ll.l.ll.ll.', '....s.......s...', 'd.b.d.b.d.b.d.b.'], dv: 0.46
  }
};

/* ---------------- the five levels ---------------- */
Tour.country({
  id: 'ma', colors: COL, tagline: 'Souks, the Sahara and the Atlas mountains',
  themes, painters, dyn, decor, decorLights, platforms, enemies, entities, pieces: P, boss, power, tracks,
  music: { level: 'tour_ma', boss: 'tour_ma_boss' },
  landmark: 'the great kasbah',
  arrival: 'Brady! The Baron rolled up a whole kasbah like a rug and hid it in the souk. ♥ C',
  coin: { name: 'DATE', draw(ctx, x, y) {
    ctx.fillStyle = '#8a4a2a'; ctx.beginPath(); ctx.ellipse(x, y, 6, 8.5, 0.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5a2a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 2, y - 6); ctx.quadraticCurveTo(x + 2, y, x - 1, y + 6); ctx.stroke();
    ctx.fillStyle = 'rgba(255,220,180,0.45)'; ctx.fillRect(x - 3, y - 5, 2, 4);
  } },
  star: { name: 'GOLDEN LANTERN', draw(ctx, x, y, t) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(6, -8); ctx.lineTo(8, 2); ctx.lineTo(0, 10); ctx.lineTo(-8, 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff4c0'; ctx.fillRect(-2, -4, 4, 6); ctx.restore(); } },
  skins: maSkins, bosses: [owlBoss],
  map: { fort: 'riad', start: [0, 0] },
  houses: [{ id: 'ma-bazar', mapLabel: 'Bazar', kind: 'stand', name: 'Bazar Bleu', keeper: 'fennec', stock: ['kazoo', 'plane', 'oneup', 'sundial', 'magnet', 'wand'], mapCell: [2, 2], mapFrom: 2 }],
  // the levels are registered by 29_tour_ma_levels.js (Tour.amend)
  levels: []
});
})();
