/* ============================================================
   MOROCCO (world 5)
   5-1 Souk Spice Maze      run    draped rugs to bounce across, spice pyramids, cobra baskets; a carpet sky route over the souk
   5-2 Sahara Caravan       run    ride camels over quicksand, sandstorm gusts that come and go, scarabs and fennecs
   5-3 Atlas Kasbah         climb  kasbah window ledges, argan trees with goats in them, switchback mule paths, snow at the top
   5-4 Jemaa el-Fnaa Nights night  lantern-lit stalls, grill smoke that lifts Brady, juice-cart oranges, snail-soup snails
   5-5 Riad of Fountains    castle fountain jets, sliding mashrabiya screens, rolling rug conveyors; boss the Djinn of the Teapot
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
  maSnail: { cls: TourEnemy.make({ w: 30, h: 20, speed: 0.4, behavior: 'walk', hp: 2, art: snailArt, burst: '#c8b898' }), place: 'walk' }
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
const entities = { maStorm: MaStorm };

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
  arena_riad(st, o) {
    const B = st.B, { x0, w, GY } = o;
    for (let q = 0; q < 4; q++) { B.set(x0 + 3 + q, GY - 4, T.SEMI); B.set(x0 + w - 7 + q, GY - 4, T.SEMI); }
    B.prop('maFountain', x0 + Math.floor(w / 2) - 2, GY - 1, 4, 1, 'none', {});
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

/* ---------------- the boss: THE DJINN OF THE TEAPOT ---------------- */
// A grumpy blue djinn bound to a brass teapot. He floats and pours scalding tea, spins into a
// whirlwind across the riad, and hides in his pot to hop after Brady. Each time the pot lands it has
// to let off steam: the lid pops and the djinn's head pokes out, dizzy. Stomp it then!
const boss = {
  id: 'ma_djinn', name: 'The Djinn of the Teapot', hp: 4, dims: [60, 64], floats: true, music: 'tour_ma_boss', country: 'ma',
  brain: {
    guardText: 'TOO HOT!',
    noDisc(b) { return b.act === 'swirl'; },
    wake(b) { K.say(b.g, b, 'THREE WISHES? NO. ZERO WISHES!', '#7ad8ff'); },
    update(b, dt) {
      const g = b.g, p = g.player, skyY = b.floorY - b.h - 4 * TS;
      b.guard = 'bounce'; b.vuln = false;
      if (b.act === 'walk') {
        b.pose = 'float'; b.face(); b.hover(dt, skyY, p ? p.cx + (b.cx < p.cx ? -3 : 3) * TS : b.cx);
        if (b.at > 0.6 && !b.fired) { b.fired = true; for (let k = 0; k < (b.hp <= 2 ? 4 : 3); k++) tourFire(g, b.cx, b.cy, { kind: 'tea', vx: (k - 1) * 2 * TS + b.dir * TS, vy: -4 * TS, grav: PHYS.gDown * 0.4, w: 10, h: 10, life: 3, thru: true, col: '#a86a2a', art: teaDrop }); Sound.play('throw', { pitch: 1.4 }); }
        if (b.at > 2) { b.fired = false; b.cycle++; b.go(b.cycle % 2 ? 'swirl' : 'pot'); }
      } else if (b.act === 'swirl') {
        if (b.first) b.face();
        b.pose = 'swirl'; b.hover(dt, b.floorY - b.h);
        if (b.at > 0.6) { b.x += b.dir * (6 + (b.hp <= 2 ? 2 : 0)) * TS * dt; if (b.x <= b.arenaX0 + 2 || b.x >= b.arenaX1 - b.w - 2) { b.dir = -b.dir; b.turns = (b.turns || 0) + 1; } }
        if (b.at > 4.5 || (b.turns || 0) >= 2) { b.turns = 0; b.go('pot'); }
      } else if (b.act === 'pot') {
        // hop after Brady inside the teapot, three hops; after each landing the lid pops: he's exposed
        b.pose = b.vent ? 'vent' : 'pot';
        if (b.first) { b.hops = 0; b.vy = 0; b.vent = 0; }
        if (b.vent > 0) { b.vent -= dt; b.vuln = true; b.guard = 'hurt'; if (b.vent <= 0) { b.vent = 0; if (b.hops >= 3) b.go('rise'); } }
        else if (b.onGround && b.at > 0.4) {
          if (b.landed) { b.landed = false; b.vent = b.hp <= 2 ? 1.0 : 1.4; g.burst(b.cx, b.y, 14, '#ffffff', 'dust'); Sound.play('splash', { pitch: 1.6, vol: 0.4 }); }
          else { b.face(); b.vy = -11 * TS; b.vx = b.dir * 3 * TS; b.hops++; b.landed = true; }
        }
        if (!b.onGround) b.landed = true;
        b.fall(dt); if (b.onGround && !b.vent) b.vx = 0;
        if (b.at > 9) b.go('rise');
      } else if (b.act === 'rise') { b.pose = 'float'; b.vx = 0; b.hover(dt, skyY); if (b.at > 0.8) b.go('walk'); }
    },
    hurt(b) { b.vent = 0; b.go('rise'); K.say(b.g, b, pick(['MY LAMP! I MEAN POT!', 'OUCH! WISH GRANTED: PAIN!', 'TOO MUCH SUGAR!']), '#7ad8ff'); b.g.burst(b.cx, b.cy, 24, '#7ad8ff', 'confetti'); },
    draw(b, ctx, t) {
      const x = b.cx, y = b.y + b.h, d = b.dir, P = b.pose;
      ctx.save(); ctx.translate(x, y);
      if (P === 'swirl') {
        for (let k = 0; k < 6; k++) { ctx.strokeStyle = `rgba(122,216,255,${0.8 - k * 0.1})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, -k * 11 - 6, 14 + k * 5, 5, 0, t * 10 + k, t * 10 + k + 4.5); ctx.stroke(); }
        ctx.restore(); return;
      }
      const inPot = P === 'pot' || P === 'vent';
      // the brass teapot
      if (inPot) {
        ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.ellipse(0, -22, 26, 22, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(20, -22); ctx.quadraticCurveTo(40, -24, 42, -44); ctx.lineTo(37, -44); ctx.quadraticCurveTo(34, -30, 20, -14); ctx.fill();
        ctx.strokeStyle = '#a8801a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-26, -24, 10, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
        ctx.fillStyle = ZEL[0]; ctx.fillRect(-24, -26, 48, 4);
        const lid = P === 'vent' ? -14 : 0;
        ctx.fillStyle = '#d8b04a'; ctx.beginPath(); ctx.moveTo(-12, -42 + lid); ctx.lineTo(0, -58 + lid); ctx.lineTo(12, -42 + lid); ctx.fill();
        if (P === 'vent') {
          for (let k = 0; k < 5; k++) { ctx.fillStyle = `rgba(255,255,255,${0.5 - k * 0.08})`; ctx.beginPath(); ctx.arc(Math.sin(t * 6 + k) * 6, -50 - k * 10, 6 + k * 2, 0, TAU); ctx.fill(); }
          ctx.fillStyle = '#4ab8ff'; ctx.beginPath(); ctx.arc(0, -46, 11, Math.PI, TAU); ctx.fill(); K.dizzy(ctx, 0, -60, t);
        }
      } else {
        // the djinn floating above his pot: a blue genie-tail, crossed arms, a fez with a tassel
        ctx.fillStyle = '#4ab8ff'; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.quadraticCurveTo(14 * Math.sin(t * 3), -20, -12, -36); ctx.lineTo(12, -36); ctx.quadraticCurveTo(10, -18, 6, -4); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -46, 20, 16, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2a8ad8'; ctx.fillRect(-18, -46, 36, 7);
        ctx.fillStyle = '#4ab8ff'; ctx.beginPath(); ctx.arc(0, -66, 13, 0, TAU); ctx.fill();
        ctx.fillStyle = '#c8323a'; ctx.beginPath(); ctx.moveTo(-8, -76); ctx.lineTo(8, -76); ctx.lineTo(6, -88); ctx.lineTo(-6, -88); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(6, -88); ctx.quadraticCurveTo(14, -86, 12, -78); ctx.stroke();
        K.eyes(ctx, d * 3, -68, d, 4, 2.6, true);
        ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6 + d * 2, -60); ctx.quadraticCurveTo(d * 2, -62, 6 + d * 2, -60); ctx.stroke();
      }
      ctx.restore();
    }
  }
};

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
  levels: [
    { name: 'Souk Spice Maze', style: 'run', theme: 'ma_souk', gimmick: 'Bounce across draped rugs, hop spice pyramids and cobra baskets, and take the flying-carpet route over the souk',
      enemies: [['maTagine', 3], ['maTeapot', 2]],
      hint: 'The flying carpet lets you soar for 12 seconds!',
      postcard: 'The souk smells like cinnamon and mint. A teapot tried to pour me a drink. ♥ C',
      script: [['flat', { n: 5 }], 'rugs', 'spices', 'baskets', 'sig', ['skyrugs', { gold: true }], 'cp', ['rugs', { n: 4 }], 'gap', 'spices', 'bonus', ['baskets', { n: 2 }], 'end'] },
    { name: 'Sahara Caravan', style: 'run', theme: 'ma_sahara', gimmick: 'Ride a camel caravan over quicksand, walk in the lulls of a sandstorm, and rest at an oasis',
      enemies: [['maScarab', 2], ['maFennec', 2]],
      hint: 'Sandstorm gusts come and go: move in the calm',
      postcard: 'Camels are VERY tall. The one I rode hummed the whole way. ♥ C',
      script: [['flat', { n: 5 }], ['caravan', { gold: true }], 'storm', 'oasis', 'sig', ['skyrugs', { n: 4 }], 'cp', ['caravan', { span: 13 }], ['storm', {}], 'oasis', ['enemies', { n: 2 }], 'end'] },
    { name: 'Atlas Kasbah', style: 'climb', theme: 'ma_atlas', gimmick: 'Climb the kasbah walls and an argan tree full of goats, then the mule switchbacks to the snow',
      enemies: [['maGoat', 2], ['maFennec', 1]], W: 24, H: 96,
      hint: 'Yes, the goats really are in the tree',
      postcard: 'Goats! In a tree! Nobody believes me. ♥ C',
      script: [['kasbah', {}], ['argan', { gold: true }], 'switchback', ['kasbah', { n: 3 }], 'argan', 'switchback', ['kasbah', { n: 4 }]] },
    { name: 'Jemaa el-Fnaa Nights', style: 'night', theme: 'ma_night', gimmick: 'A lantern-lit night market: grill smoke lifts Brady to the awnings, juice-cart oranges roll, snail-soup snails crawl',
      enemies: [['maSnail', 2], ['maOrange', 2], ['maTeapot', 1]], dark: true,
      hint: 'Ride the grill smoke up to the lanterns',
      postcard: 'Snail soup at midnight. Brady, it was... interesting. ♥ C',
      script: [['flat', { n: 6 }], ['grills', { gold: true }], 'juice', ['baskets', { n: 2 }], 'spices', 'cp', 'grills', 'juice', 'rugs', 'lsd', ['enemies', { n: 2 }], 'grills', 'end'] },
    { name: 'Riad of Fountains', style: 'castle', theme: 'ma_riad', gimmick: 'Fountain jets lift Brady to the galleries, mashrabiya screens slide over the pools, rugs roll underfoot; then the Djinn of the Teapot',
      enemies: [['maTagine', 2], ['maTeapot', 1]], boss: 'ma_djinn', arena: 'riad', arenaW: 26, roof: false,
      hint: 'When the teapot lands, the lid pops: stomp the djinn!',
      postcard: 'The kasbah is unrolled and back on its hill! The Baron went to Spain. ¡Olé! ♥ C',
      script: [['flat', { n: 4 }], ['fountain', { gold: true }], 'screens', 'rolling', 'cp', 'fountain', ['screens', {}], ['enemies', { n: 2 }], ['blocks', { content: 'power' }], 'arena'] }
  ]
});
})();
