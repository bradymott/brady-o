/* ============================================================
   MOZAMBIQUE (world 4): art, enemies, set pieces, the boss O Eremita,
   music and the piri-piri chili. The six levels (v2 format: 4-1 Ostrich
   Dash, 4-2 Dune Stampede, 4-3 Baobab Skyline, 4-4 Hatchling Night,
   4-5 Ilha Fortress, 4-6 Buried Dhow) and the pieces only they use are
   in 29_tour_mz_levels.js.
   ============================================================ */
(() => {
const COL = { a: '#ffd23a', b: '#1a9a5a', c: '#e8423a' };
const K = TourKit;
const CAPU = ['#ff7a1a', '#1aa8a8', '#ffd23a', '#c8287a', '#2a5ad8'];   // capulana cloth colours
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };

/* ---------------- background painters ---------------- */
function baobab(ctx, x, b, h, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - h * 0.16, b); ctx.quadraticCurveTo(x - h * 0.2, b - h * 0.5, x - h * 0.1, b - h * 0.8); ctx.lineTo(x + h * 0.1, b - h * 0.8); ctx.quadraticCurveTo(x + h * 0.2, b - h * 0.5, x + h * 0.16, b); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = h * 0.03; ctx.lineCap = 'round';
  for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x + k * h * 0.02, b - h * 0.78); ctx.lineTo(x + k * h * 0.09, b - h * (0.95 + (k % 2) * 0.05)); ctx.lineTo(x + k * h * 0.12, b - h * 0.98); ctx.stroke(); }
  ctx.lineCap = 'butt';
}
const painters = {
  // golden grass plains with flat-topped acacias and baobabs
  mzSavanna(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= BG_W; x += 16) ctx.lineTo(x, L.base - 8 * Math.sin(x * 0.01) - 4 * Math.sin(x * 0.05)); ctx.lineTo(BG_W, H); ctx.fill();
    for (let x = 40; x < BG_W; x += 140 + rng() * 120) wrapDraw(x, 80, xx => {
      if (rng() < 0.5) { ctx.fillStyle = shade(L.color, -0.45); ctx.fillRect(xx - 2, L.base - 50, 4, 50); ctx.beginPath(); ctx.ellipse(xx, L.base - 54, 46, 9, 0, 0, TAU); ctx.fill(); }
      else baobab(ctx, xx, L.base + 4, 110 + rng() * 40, shade(L.color, -0.4));
    });
    ctx.strokeStyle = shade(L.color, 0.15); ctx.lineWidth = 1; for (let k = 0; k < 120; k++) { const x = rng() * BG_W, y = L.base + rng() * 60; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2, y - 7); ctx.stroke(); }
  },
  // rolling dunes down to the Indian Ocean
  mzDunes(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, L.base - 60, L.base, '#3ac8d8', '#1a8ab8'); ctx.fillRect(0, L.base - 60, BG_W, 60);
    for (let r = 0; r < 2; r++) { ctx.fillStyle = shade(L.color, -r * 0.12); ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= BG_W; x += 16) ctx.lineTo(x, L.base - 30 + r * 30 - 30 * Math.sin(x * 0.008 + r * 2) ** 2); ctx.lineTo(BG_W, H); ctx.fill(); }
    for (const sx of [300, 760]) wrapDraw(sx, 40, xx => { ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.moveTo(xx, L.base - 110); ctx.quadraticCurveTo(xx + 30, L.base - 80, xx + 34, L.base - 66); ctx.lineTo(xx, L.base - 66); ctx.fill(); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(xx - 16, L.base - 66, 52, 6); });
  },
  // the night ocean with a lighthouse on the point
  mzNightSea(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, L.base, H, '#0e2a4a', '#04101e'); ctx.fillRect(0, L.base, BG_W, H - L.base);
    ctx.strokeStyle = 'rgba(90,255,220,0.35)'; ctx.lineWidth = 2; for (let r = 0; r < 3; r++) { ctx.beginPath(); for (let x = 0; x <= BG_W; x += 10) ctx.lineTo(x, L.base + 10 + r * 16 + Math.sin(x * 0.03 + r) * 3); ctx.stroke(); }
    ctx.fillStyle = '#1a2030'; ctx.beginPath(); ctx.moveTo(760, L.base); ctx.lineTo(774, L.base - 120); ctx.lineTo(794, L.base - 120); ctx.lineTo(808, L.base); ctx.fill();
    ctx.fillStyle = '#e8e0c8'; for (let k = 0; k < 4; k++) ctx.fillRect(772 + k, L.base - 100 + k * 26, 24 - k * 2, 8);
    ctx.fillStyle = '#ffe8a0'; ctx.beginPath(); ctx.arc(784, L.base - 128, 7, 0, TAU); ctx.fill();
  },
  // the old island fortress: thick walls and bastions over the sea
  mzFort(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, L.base, H, '#2a8ab8', '#0e4a7a'); ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let x = 0; x < BG_W; x += 256) {
      ctx.fillStyle = L.color; ctx.fillRect(x, L.base - 90, 200, 90); ctx.beginPath(); ctx.moveTo(x + 200, L.base); ctx.lineTo(x + 200, L.base - 110); ctx.lineTo(x + 250, L.base - 90); ctx.lineTo(x + 250, L.base); ctx.fill();
      for (let k = 0; k < 10; k++) ctx.fillRect(x + k * 20, L.base - 100, 12, 12);
      ctx.fillStyle = shade(L.color, -0.2); ctx.fillRect(x, L.base - 30, 200, 4); ctx.fillStyle = L.color;
    }
  }
};
const dyn = {
  // the stampede's dust cloud rolling along behind Brady
  mzDust(ctx, L, camX, oy, S, W, t) {
    const g = ctx.createLinearGradient(0, 0, 160 * S, 0); g.addColorStop(0, 'rgba(200,150,90,0.55)'); g.addColorStop(1, 'rgba(200,150,90,0)');
    ctx.fillStyle = g; ctx.fillRect(0, oy + 100 * S, 160 * S, 260 * S);
  }
};

/* ---------------- tiles: red earth, thorn hedges (they burn!), capulana bundles ---------------- */
const thorn = {
  c1: '#8a6a3a', c2: '#5a3a1a', mortar: '#3a2a1a', style: 'stone',
  paint(ctx) {
    ctx.fillStyle = '#8a6a3a'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(k * 8 - 4, TS); ctx.lineTo(k * 8 + 6, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(k * 8 + 6, TS); ctx.lineTo(k * 8 - 4, 0); ctx.stroke(); }
    ctx.fillStyle = '#c8b46a'; for (let k = 0; k < 8; k++) ctx.fillRect((k * 13) % 30, (k * 7) % 30, 2, 2);
    ctx.fillStyle = 'rgba(255,240,200,0.2)'; ctx.fillRect(0, 0, TS, 2);
  }
};
function capulanaBox(ctx, th, f) {
  ctx.save(); ctx.shadowColor = 'rgba(255,200,80,0.85)'; ctx.shadowBlur = 4 + f * 1.5;
  ctx.fillStyle = CAPU[0]; rr(ctx, 1, 3, TS - 2, TS - 4, 4); ctx.fill(); ctx.restore();
  ctx.save(); rr(ctx, 1, 3, TS - 2, TS - 4, 4); ctx.clip();
  for (let k = 0; k < 3; k++) { ctx.fillStyle = CAPU[1 + k]; ctx.beginPath(); ctx.arc(6 + k * 10, 12 + (k % 2) * 8, 5, 0, TAU); ctx.fill(); ctx.fillStyle = CAPU[0]; ctx.beginPath(); ctx.arc(6 + k * 10, 12 + (k % 2) * 8, 2, 0, TAU); ctx.fill(); }
  ctx.fillStyle = CAPU[4]; ctx.fillRect(0, 25, TS, 4);
  ctx.restore();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(TS / 2 - 2, 1, 4, 5);
  ctx.strokeStyle = '#6a2a0a'; ctx.lineWidth = 1.2; rr(ctx, 1, 3, TS - 2, TS - 4, 4); ctx.stroke();
}
function capulanaUsed(ctx) { ctx.fillStyle = '#9a8070'; rr(ctx, 1, 3, TS - 2, TS - 4, 4); ctx.fill(); ctx.strokeStyle = '#6a5040'; ctx.lineWidth = 1.2; ctx.stroke(); }
const base = {
  ground: { style: 'grass', cap: '#c8b44a', capHi: '#e8d878', dirt: '#b8603a', dirt2: '#8a3a24', rock: '#c8784a' },
  brick: thorn, hard: { c1: '#c8a070', c2: '#8a6a44' }, semi: { style: 'log', c1: '#8a6a4a', c2: '#5a4028' },
  pillar: { c1: '#b8784a', c2: '#7a4a2a', cap: '#d8a070', style: 'column' },
  accent: COL.a, qblockArt: capulanaBox, usedArt: capulanaUsed, tint: {}, bloom: 0.15
};
const themes = {
  mz_savanna: Object.assign({}, base, {
    rays: '#ffe0a0',
    name: 'Gorongosa', music: 'tour_mz', particles: 'dust',
    sky: ['#ff9a4a', '#ffd08a', '#fff4d8'], horizonGlow: '#ffd8a0',
    celestial: { type: 'sun', x: 0.72, y: 0.22, r: 46, color: '#fff2c0', glow: '#ffb060' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'mountains', color: '#c8907a', base: 280, amp: 60, f: 0.03, blur: true }, { kind: 'mzSavanna', color: '#c89a4a', base: 300, f: 0.1 }, { kind: 'mzSavanna', color: '#b8883a', base: 352, f: 0.3 }],
    fog: '#ffe0b0', decor: ['mzGrass', 'mzGrass', 'mzSkull']
  }),
  mz_dunes: Object.assign({}, base, {
    rays: '#fff4d8',
    name: 'The Dunes', music: 'tour_mz_run', particles: 'sand',
    ground: { style: 'grass', cap: '#f0d89a', capHi: '#fff0c0', dirt: '#e8c47a', dirt2: '#c89a5a', rock: '#d8b06a' },
    sky: ['#2a9ae8', '#9ad8ff', '#fff8e8'], horizonGlow: '#fff0d0', celestial: { type: 'sun', x: 0.3, y: 0.14, r: 38, color: '#fffbe0', glow: '#ffe8a0' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'mzDunes', color: '#f0d08a', base: 320, f: 0.06, dyn: 'mzDust' }, { kind: 'mzDunes', color: '#e8c070', base: 352, f: 0.22 }],
    fog: '#fff4d8', decor: ['mzShell', 'mzGrass']
  }),
  mz_baobab: Object.assign({}, base, {
    rays: '#fff0c0',
    name: 'The Great Baobab', music: 'tour_mz', particles: 'leaves',
    sky: ['#3a9ae8', '#a8d8ff', '#fff4d8'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.25, y: 0.15, r: 34, color: '#fffbe8', glow: '#ffe8b0' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'mzSavanna', color: '#c89a4a', base: 340, f: 0.04 }],
    fog: '#fff0d0', hard: { c1: '#a8805a', c2: '#6a4a2e' }, semi: { style: 'log', c1: '#9a7a5a', c2: '#6a4a2e' }
  }),
  mz_beach: Object.assign({}, base, {
    name: 'Turtle Beach', music: 'tour_mz_night', particles: 'fireflies', liquid: 'glowsea',
    // moonlit rock stacks in the surf: cool grey-violet stone, a pale moonlit cap (the warm terracotta glowed at night)
    pillar: { c1: '#6a6880', c2: '#3a3850', cap: '#b8b8cc', style: 'column' },
    ground: { style: 'grass', cap: '#d8c8a0', capHi: '#f0e4c0', dirt: '#8a7a5a', dirt2: '#4a4030', rock: '#6a6050' },
    sky: ['#040814', '#0a1a34', '#1a3050'], horizonGlow: '#3a6a8a', celestial: { type: 'moon', x: 0.2, y: 0.16, r: 26, color: '#f8f4e0', glow: '#a0c0ff' }, stars: 1,
    layers: [{ kind: 'mzNightSea', color: '#0e2a4a', base: 320, f: 0.06 }],
    fog: '#3a6a8a', darkness: 0.5, decor: ['mzShell', 'mzPlankton']
  }),
  mz_fort: Object.assign({}, base, {
    name: 'Ilha Fortress', music: 'tour_mz_run', particles: 'motes', liquid: 'sea',
    ground: { style: 'grass', cap: '#c8b898', capHi: '#e8dcc0', dirt: '#a89878', dirt2: '#7a6a50', rock: '#b8a888' },
    sky: ['#3a8ad8', '#9ad0ff', '#fff4e0'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.8, y: 0.15, r: 34, color: '#fffbe8', glow: '#ffe8b0' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'mzFort', color: '#c8b898', base: 330, f: 0.08 }],
    fog: '#fff0e0', hard: { c1: '#d8c8a8', c2: '#a89878' }
  })
};
if (typeof LIQUIDS !== 'undefined') LIQUIDS.glowsea = ['#3affd0', '#0e6a7a', '#04202e', 'rgba(120,255,220,0.3)', '#3affd0', 'rgba(180,255,240,0.6)'];

/* ---------------- decor ---------------- */
const decor = {
  mzGrass(ctx, x, y) { ctx.strokeStyle = '#c8a84a'; ctx.lineWidth = 1.5; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x + k * 2, y); ctx.lineTo(x + k * 4, y - 12 - Math.abs(k)); ctx.stroke(); } },
  mzSkull(ctx, x, y) { ctx.fillStyle = '#e8e0c8'; ctx.beginPath(); ctx.ellipse(x, y - 4, 7, 4, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.quadraticCurveTo(x - 14, y - 12, x - 12, y - 18); ctx.moveTo(x + 6, y - 6); ctx.quadraticCurveTo(x + 14, y - 12, x + 12, y - 18); ctx.stroke(); },
  mzShell(ctx, x, y) { ctx.fillStyle = '#f0d8c8'; ctx.beginPath(); ctx.ellipse(x, y - 3, 6, 4, 0, Math.PI, TAU); ctx.fill(); },
  mzPlankton(ctx, x, y, t) { for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(90,255,220,${0.4 + 0.4 * Math.sin(t * 3 + k)})`; ctx.beginPath(); ctx.arc(x - 12 + k * 5, y - 2 - (k % 2) * 2, 1.6, 0, TAU); ctx.fill(); } },
  // an elephant whose trunk sprays a jet of water (the jet lifts Brady)
  mzElephant(ctx, x, y, t, th, d) {
    ctx.fillStyle = '#8a8a90'; ctx.beginPath(); ctx.ellipse(x - 16, y - 40, 36, 28, 0, 0, TAU); ctx.fill();
    for (const lx of [-40, -26, -6, 8]) ctx.fillRect(x + lx, y - 22, 12, 22);
    ctx.beginPath(); ctx.arc(x + 20, y - 52, 18, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a7a80'; ctx.beginPath(); ctx.ellipse(x + 8, y - 50, 14, 20, -0.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8a8a90'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 32, y - 46); ctx.quadraticCurveTo(x + 46, y - 50, d.jx || x + 48, y - 70); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#f4f0e4'; ctx.beginPath(); ctx.moveTo(x + 28, y - 42); ctx.quadraticCurveTo(x + 40, y - 36, x + 44, y - 44); ctx.lineTo(x + 30, y - 46); ctx.fill();
    ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(x + 26, y - 58, 2.2, 0, TAU); ctx.fill();
  },
  mzBaobabProp(ctx, x, y, t, th, d) { baobab(ctx, x, y + 4, d.h + 40, '#9a7a5a'); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x - 6, y - d.h * 0.7, 3, d.h * 0.6); },
  // a termite mound (its body is solid)
  mzMound(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h;
    ctx.fillStyle = '#b8603a'; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x - w / 2 + 2, y - h * 0.7, x - 4, y - h - 6); ctx.lineTo(x + 4, y - h - 2); ctx.quadraticCurveTo(x + w / 2 - 2, y - h * 0.6, x + w / 2, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x - 6 + (k % 2) * 10, y - 12 - k * h / 5, 2.5, 0, TAU); ctx.fill(); }
  },
  mzNest(ctx, x, y, t) { ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.ellipse(x, y + 4, 14, 9, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x - 12, y + 4 + k * 2); ctx.lineTo(x + 12, y + 2 + k * 2); ctx.stroke(); } ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x + 4, y - 4 + Math.sin(t * 5) * 1.5, 3.5, 0, TAU); ctx.fill(); },
  mzHoney(ctx, x, y, t, th, d) { ctx.fillStyle = 'rgba(255,190,40,0.85)'; for (let k = 0; k < d.w / 16; k++) { ctx.beginPath(); ctx.arc(x - d.w / 2 + 8 + k * 16, y - d.h + 4 + ((t * 6 + k) % 10), 2.5, 0, TAU); ctx.fill(); } },
  // a beached dhow: the hull is solid, the big lateen sail is bouncy
  mzDhow(ctx, x, y, t, th, d) {
    const w = d.w;
    ctx.fillStyle = '#8a5a2a'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 8, y - d.h); ctx.lineTo(x + w / 2 + 14, y - d.h - 6); ctx.lineTo(x + w / 2 - 6, y); ctx.lineTo(x - w / 2 + 6, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - w / 2, y - d.h + 6, w, 3);
  },
  mzSail(ctx, x, y, t, th, d) {
    const w = d.w, top = y - d.h;
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, y + 60); ctx.stroke();
    ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.moveTo(x - w / 2, top + 6); ctx.quadraticCurveTo(x, top - 6 - Math.sin(t * 3) * 3, x + w / 2, top); ctx.lineTo(x + 4, y + 50); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(160,120,80,0.5)'; ctx.lineWidth = 1; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + k * w / 4, top + 4); ctx.lineTo(x + 4, y + 50); ctx.stroke(); }
  },
  // the lighthouse beam sweeping the night beach
  mzBeam(ctx, x, y, t) {
    const a = Math.sin(t * 0.6) * 0.9;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y - 200); ctx.rotate(a);
    const g = ctx.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, 'rgba(255,240,180,0.35)'); g.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(90, 420); ctx.lineTo(-90, 420); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#e8e0c8'; ctx.fillRect(x - 10, y - 200, 20, 200); ctx.fillStyle = '#c8323a'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 10, y - 180 + k * 46, 20, 14);
    ctx.fillStyle = '#ffe8a0'; ctx.beginPath(); ctx.arc(x, y - 208, 9, 0, TAU); ctx.fill();
  },
  mzCannonDecor(ctx, x, y) { ctx.fillStyle = '#3a3a44'; rr(ctx, x - 16, y - 12, 32, 12, 3); ctx.fill(); }
};
const decorLights = { mzPlankton: [60, '#3affd0', -4], mzBeam: [200, '#ffe8a0', -200] };

/* ---------------- enemies ---------------- */
const warthogArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const run = m === 'charge' ? Math.sin(e.t * 22) * 3 : Math.sin(e.t * 8);
  ctx.fillStyle = '#7a5a4a'; ctx.beginPath(); ctx.ellipse(-2, -14, 16, 10, 0, 0, TAU); ctx.fill();
  for (const [lx, d] of [[-12, run], [-4, -run], [6, run], [12, -run]]) ctx.fillRect(lx - 2 + d, -6, 4, 6);
  ctx.beginPath(); ctx.ellipse(14, -14, 9, 7, 0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a2a20'; ctx.beginPath(); ctx.moveTo(-14, -24); ctx.lineTo(0, -26); ctx.lineTo(10, -22); ctx.lineTo(-12, -20); ctx.fill();
  ctx.strokeStyle = '#f4ecd8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(20, -12, 5, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke();
  K.eyes(ctx, 14, -17, 1, 2.5, 1.6, m === 'charge' || m === 'notice');
  ctx.restore();
};
const cashewArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#ff6a2a'; ctx.beginPath(); ctx.ellipse(0, -14, 9, 11, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.ellipse(2, -1, 7, 4, 0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a8a3a'; ctx.fillRect(-1, -28, 3, 4);
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 2, -16, 1, 2.6, 2, true);
  ctx.restore();
};
const weaverArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const f = Math.sin(e.t * (m === 'swoop' ? 14 : 9));
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8b81a'; ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-10, -10 - f * 6); ctx.lineTo(4, -2); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(7, -3, 3.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(8, -4, 1, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a2a20'; ctx.beginPath(); ctx.moveTo(10, -3); ctx.lineTo(15, -2); ctx.lineTo(10, -1); ctx.fill();
  ctx.restore();
};
const prawnArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#ff7a5a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(-12 + k * 5, -8 - Math.sin(k * 0.7) * 6, 5, 6, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#e8422a'; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(-22, -2); ctx.lineTo(-20, -10); ctx.fill();
  ctx.strokeStyle = '#e8422a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10, -14); ctx.quadraticCurveTo(22, -26, 26, -16); ctx.moveTo(10, -12); ctx.quadraticCurveTo(24, -20, 28, -10); ctx.stroke();
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-8 + k * 5, -4); ctx.lineTo(-9 + k * 5 + Math.sin(e.t * 12 + k) * 2, 0); ctx.stroke(); }
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 8, -14, 1, 2.4, 1.8, true);
  ctx.restore();
};
const monkeyArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.strokeStyle = '#8a8a7a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -8); ctx.quadraticCurveTo(-20, -6, -18, -24); ctx.stroke();
  ctx.fillStyle = '#9a9a8a'; ctx.beginPath(); ctx.ellipse(0, -12, 9, 11, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(2, -28, 8, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.ellipse(4, -27, 5, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(3, -29, 1.4, 0, TAU); ctx.arc(7, -29, 1.4, 0, TAU); ctx.fill();
  if (m === 'throw') { ctx.fillStyle = '#c8b898'; ctx.beginPath(); ctx.ellipse(10, -20, 4, 6, 0.4, 0, TAU); ctx.fill(); }
  ctx.restore();
};
const ghostCrabArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); if (m === 'flat') ctx.scale(1.2, 0.4);
  ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 2; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(s * 5, -5); ctx.lineTo(s * (11 + k * 2), -1 + Math.sin(e.t * 20 + k) * 2); ctx.stroke(); }
  ctx.fillStyle = 'rgba(240,232,210,0.95)'; ctx.beginPath(); ctx.ellipse(0, -7, 10, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1020'; for (const s of [-1, 1]) { ctx.fillRect(s * 3 - 1, -16, 2, 6); ctx.beginPath(); ctx.arc(s * 3, -17, 2.2, 0, TAU); ctx.fill(); }
  ctx.restore();
};
const mangoArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y - 11); if (m === 'roll' || m === 'curl') ctx.rotate(e.t * 12 * e.dir);
  const g = ctx.createLinearGradient(-10, -10, 10, 10); g.addColorStop(0, '#ff3a3a'); g.addColorStop(0.5, '#ffa82a'); g.addColorStop(1, '#ffe04a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 12, 10, 0.4, 0, TAU); ctx.fill();
  if (m !== 'roll' && m !== 'curl' && m !== 'flat' && m !== 'ko') { K.eyes(ctx, e.dir * 3, -1, e.dir, 3, 2, true); ctx.fillStyle = '#3a8a3a'; ctx.fillRect(-2, -14, 3, 5); }
  ctx.restore();
};
const fruit = (ctx, s, t) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(t * 8); ctx.fillStyle = '#c8b898'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 7, 0, 0, TAU); ctx.fill(); ctx.restore(); };
const enemies = {
  mzWarthog: { cls: TourEnemy.make({ w: 36, h: 24, speed: 1.0, behavior: 'charge', range: 8, chargeSpeed: 6.5, art: warthogArt, burst: '#7a5a4a', onNotice: e => K.say(e.g, e, 'OINK!', '#ffd84a') }), place: 'walk' },
  mzCashew: { cls: TourEnemy.make({ w: 18, h: 26, speed: 1.0, behavior: 'hop', hopV: 11, hopEvery: 1.3, art: cashewArt, burst: '#ff6a2a' }), place: 'walk' },
  mzWeaver: { cls: TourFlyer.make({ w: 22, h: 14, range: 3, speed: 1.2, swoop: true, art: weaverArt, burst: '#ffd23a' }), place: 'fly' },
  mzPrawn: { cls: TourEnemy.make({ w: 30, h: 20, speed: 1.4, behavior: 'walk', art: prawnArt, burst: '#ff7a5a' }), place: 'walk' },
  mzMonkey: { cls: TourEnemy.make({ w: 20, h: 36, speed: 0.6, behavior: 'throw', every: 2.2, range: 9, pace: true, art: monkeyArt, burst: '#9a9a8a', shoot: e => {
    tourFire(e.g, e.cx + e.dir * 12, e.y + 6, { kind: 'fruit', vx: e.dir * 3.6 * TS, vy: -6 * TS, grav: PHYS.gDown * 0.4, w: 12, h: 14, life: 3, col: '#c8b898', stompable: true, art: fruit }); K.say(e.g, e, 'OOK!', '#ffffff');
  } }), place: 'walk' },
  mzGhostCrab: { cls: TourEnemy.make({ w: 22, h: 14, speed: 2.6, behavior: 'walk', art: ghostCrabArt, burst: '#e8e0c8', glow: 'rgba(220,255,240,' }), place: 'walk' },
  mzMango: { cls: TourEnemy.make({ w: 22, h: 20, speed: 0.7, behavior: 'roll', range: 8, rollSpeed: 6, art: mangoArt, burst: '#ffa82a' }), place: 'walk' }
};

/* ---------------- entities ---------------- */
// an elephant's water jet switches on and off: ride it up when it's on
class MzJet extends Ent {
  constructor(g, s) { super(g, s, 10, 10); this.zone = null; this.on = true; this.ph = s.phase || 0; }
  update(dt) {
    this.t += dt;
    if (!this.zone) this.zone = (this.g.area.zones || []).find(z => z.kind === 'trunk' && Math.abs(z.x - this.s.zx) < 2) || null;
    this.on = ((this.t + this.ph) % 4.2) < 3.0;
    if (this.zone) this.zone.off = !this.on;
  }
  draw(ctx) {
    const z = this.zone; if (!z) return;
    const k = this.on ? 1 : Math.max(0, 1 - (((this.t + this.ph) % 4.2) - 3) * 4);
    if (k <= 0) return;
    for (let i = 0; i < 16; i++) { const ph = (this.t * 1.6 + i / 16) % 1; ctx.fillStyle = `rgba(160,220,255,${0.7 * k * (1 - ph * 0.6)})`; ctx.beginPath(); ctx.arc(z.x + z.w / 2 + Math.sin(i * 2.1 + this.t * 6) * z.w * 0.3, z.y + z.h - ph * z.h, 3 + (i % 3), 0, TAU); ctx.fill(); }
  }
}
// the stampede: a thundering dust cloud that follows the auto-scroll's left edge
class MzStampede extends Ent {
  constructor(g, s) { super(g, s, 60, 200); }
  update(dt) { this.t += dt; this.x = this.g.camX - 70; this.y = (this.g.camY || 0) + 60; if (Math.random() < 0.05) this.g.shake(1); }
  draw(ctx) {
    const x = this.g.camX, y0 = this.g.camY || 0;
    for (let k = 0; k < 7; k++) { const by = y0 + 300 + Math.sin(this.t * 9 + k) * 6 + (k % 3) * 30; ctx.fillStyle = '#4a3a2a'; ctx.beginPath(); ctx.ellipse(x - 30 + (k % 2) * 16, by, 26, 14, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x - 8 + (k % 2) * 16, by - 14, 7, Math.PI, TAU); ctx.stroke(); }
    const g = ctx.createLinearGradient(x - 40, 0, x + 70, 0); g.addColorStop(0, 'rgba(210,170,110,0.85)'); g.addColorStop(1, 'rgba(210,170,110,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 40, y0, 110, 900);
  }
}
// a fortress cannon that fires coconuts along the rampart
class MzCannon extends Ent {
  constructor(g, s) { super(g, s, 40, 30); this.dir = s.dir || -1; this.every = s.period || 2.4; this.cool = 1.2; this.recoil = 0; }
  update(dt) {
    this.t += dt; this.recoil = Math.max(0, this.recoil - dt * 4); this.cool -= dt;
    if (this.cool <= 0) { this.cool = this.every; this.recoil = 1; if (this.g.onScreen(this)) Sound.play('kick', { pitch: 0.7, vol: 0.4 }); this.g.burst(this.cx + this.dir * 24, this.y + 10, 6, '#e8e0d0', 'dust');
      tourFire(this.g, this.cx + this.dir * 24, this.y + 12, { kind: 'coconut', vx: this.dir * 5 * TS, vy: -1 * TS, grav: PHYS.gDown * 0.12, w: 16, h: 16, life: 4, stompable: true, col: '#6a4a2a', art: (ctx, s, t) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(t * 6); ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a2a1a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(Math.cos(k * 2.1) * 3, Math.sin(k * 2.1) * 3, 1.3, 0, TAU); ctx.fill(); } ctx.restore(); } }); }
  }
  draw(ctx) { const x = this.cx, y = this.y + this.h, d = this.dir; ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.arc(x - 6, y - 8, 8, 0, TAU); ctx.arc(x + 8, y - 8, 8, 0, TAU); ctx.fill(); ctx.save(); ctx.translate(x, y - 16); ctx.scale(d, 1); ctx.translate(-this.recoil * 4, 0); ctx.fillStyle = '#2a2a34'; rr(ctx, -12, -7, 36, 14, 6); ctx.fill(); ctx.fillStyle = '#4a4a58'; ctx.fillRect(18, -8, 5, 16); ctx.restore(); }
}
const entities = { mzJet: MzJet, mzStampede: MzStampede, mzCannon: MzCannon };

/* ---------------- the signature power-up: PIRI-PIRI CHILI ---------------- */
// one bite and Brady breathes fire for ten seconds: it knocks out enemies and burns thorn hedges
function chiliIcon(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5 + Math.sin(t * 4) * 0.08);
  ctx.fillStyle = '#e8222a'; ctx.beginPath(); ctx.moveTo(-3, -8); ctx.quadraticCurveTo(7, -6, 5, 4); ctx.quadraticCurveTo(2, 10, -1, 11); ctx.quadraticCurveTo(-4, 2, -3, -8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-1, -5, 1.5, 8);
  ctx.fillStyle = '#2a8a3a'; ctx.fillRect(-4, -11, 4, 4);
  ctx.restore();
}
class MzFlame extends Ent {
  constructor(g, x, y, dir) { super(g, null, 24, 22); this.t = 0; this.x = x - 12; this.y = y - 11; this.dir = dir; this.life = 0.5; this.vx = dir * 7 * TS; this.hitSet = new Set(); this.friendly = true; }
  update(dt) {
    this.t += dt; this.life -= dt; this.x += this.vx * dt; this.w = 24 + this.t * 40; this.h = 22 + this.t * 16; this.y -= this.t * 6 * dt;
    const g = this.g, A = g.area;
    // thorn hedges (brick tiles) burn away
    const tx = Math.floor((this.cx + this.dir * 8) / TS), ty0 = Math.floor(this.y / TS), ty1 = Math.floor((this.y + this.h) / TS) + 1;
    for (let ty = ty0; ty <= ty1; ty++) if (tileAt(A, tx, ty) === T.BRICK) { g.setTile(tx, ty, T.EMPTY); g.burst(tx * TS + 16, ty * TS + 16, 12, '#ff8a2a', 'spark'); Sound.play('break', { pitch: 1.3, vol: 0.35 }); g.addScore(50, tx * TS + 16, ty * TS); }
    for (const e of g.entities) {
      if (!e.enemy || e.dead || e.remove || this.hitSet.has(e) || !overlap(this, e)) continue;
      this.hitSet.add(e);
      if (e.boss) { if (e.state === 'fight') e.hit('fire', this); continue; }
      if (e.hit('fire', this)) { g.addScore(200, e.cx, e.y); g.burst(e.cx, e.cy, 10, '#ff6a1a', 'spark'); }
    }
    if (this.life <= 0) this.remove = true;
  }
  draw(ctx) {
    const k = this.life / 0.5;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) { const fx = this.cx - this.dir * i * 4, fy = this.cy + Math.sin(this.t * 30 + i) * 3, r = (this.h / 2) * (1 - i * 0.12); ctx.fillStyle = `rgba(255,${120 + i * 20},40,${0.35 * k})`; ctx.beginPath(); ctx.arc(fx, fy, Math.max(2, r), 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
const power = {
  id: 'piri', name: 'PIRI-PIRI CHILI', country: 'mz', hint: 'PRESS ACTION TO BREATHE FIRE · BURNS THORN HEDGES', time: 10, cooldown: 0.22,
  icon: chiliIcon,
  action(p, g) { g.spawn(new MzFlame(g, p.cx + p.facing * 22, p.y + (p.small ? 10 : 16), p.facing)); Sound.play('fire', { pitch: 0.8, vol: 0.5 }); return true; },
  drawOn(p, ctx, t) { ctx.fillStyle = 'rgba(255,60,40,0.35)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(p.cx + s * 5 + p.facing * 3, p.y + (p.small ? 13 : 20), 3, 0, TAU); ctx.fill(); } if (Math.random() < 0.15) p.g.burst(p.cx + p.facing * 10, p.y + (p.small ? 10 : 16), 1, '#ff8a2a', 'spark'); }
};

/* ---------------- set pieces ---------------- */
const P = {
  /* 4-1: the savanna */
  // an elephant sprays a jet of water: ride it up to the baobab's crown
  elephant(st, o) {
    const x = st.x, B = st.B, gy = st.gy; st.floor(x, x + 14);
    const jx = x + 5, top = gy - 10;
    B.prop('mzElephant', x + 1, gy - 3, 3, 3, 'none', { jx: (jx + 0.5) * TS + TS / 2 });
    B.zone(jx, top, 3, gy - top, 0, -115 * TS, 7.2 * TS, 'trunk', { pull: 3 });
    st.spawn('mzJet', jx + 1, top, { zx: jx * TS, phase: o.phase || 0 });
    B.prop('mzBaobabProp', x + 9, top, 4, gy - top, 'none', {});
    for (let q = 7; q <= 13; q++) B.set(x + q, top + 1, T.SEMI);
    st.coins(x + 8, x + 12, top - 1);
    if (o.gold) st.gold(x + 10, top - 2, 'high');
    st.enemy('mzMonkey', x + 11, top + 1, { edgeTurn: true });
    return x + 15;
  },
  // termite mounds to hop over (solid)
  mounds(st) {
    const x = st.x, B = st.B; st.floor(x, x + 13);
    [[x + 2, 2], [x + 6, 3], [x + 10, 2]].forEach(([mx, h]) => B.prop('mzMound', mx, st.gy - h, 2, h, 'body', {}));
    st.coins(x + 2, x + 11, st.gy - 5);
    st.enemy('mzCashew', x + 8, st.gy);
    return x + 14;
  },
  // a thorn hedge: jump it, or burn through with piri-piri for the coins inside
  thorns(st, o) {
    const x = st.x, B = st.B, h = o.h || 3; st.floor(x, x + 9);
    B.fill(x + 3, st.gy - h, x + 6, st.gy - 1, T.BRICK);
    for (let q = 4; q <= 5; q++) for (let y = st.gy - h + 1; y < st.gy; y++) B.set(x + q, y, T.PICK);
    st.coins(x + 3, x + 6, st.gy - h - 2);
    return x + 10;
  },
  herd(st) { const x = st.x; st.floor(x, x + 14); st.enemy('mzWarthog', x + 12, st.gy); st.semi(x + 3, x + 7, st.gy - 4); st.coins(x + 3, x + 7, st.gy - 6); st.decor('mzSkull', x + 9); return x + 15; },

  /* 4-2: the dunes (auto-scroll) */
  // the stampede that drives the scroll (placed once)
  stampede(st) { st.spawn('mzStampede', 2, st.gy - 3, {}); return st.x; },
  // dunes: up and down, crests of soft sand that crumble
  dunes(st) {
    const x = st.x, B = st.B; st.floor(x, x + 2);
    for (let i = 0; i < 3; i++) st.floor(x + 3 + i * 2, x + 4 + i * 2, st.gy - 1 - i);
    B.fill(x + 9, st.gy - 3, x + 12, st.gy - 3, T.CRUMBLE);
    st.pit(x + 9, x + 12); B.fill(x + 9, st.gy - 3, x + 12, st.gy - 3, T.CRUMBLE);
    st.floor(x + 13, x + 15, st.gy - 2);
    st.coins(x + 9, x + 12, st.gy - 5);
    st.gy = st.gy - 2; return x + 16;
  },
  // a beached dhow: bounce on its billowing sail
  dhow(st, o) {
    const x = st.x, B = st.B, gy = st.gy; st.floor(x, x + 12);
    B.prop('mzDhow', x + 2, gy - 2, 8, 2, 'body', {});
    const sy = gy - 5;
    for (let q = 0; q < 4; q++) { B.set(x + 4 + q, sy, T.SEMI); B.setHide(x + 4 + q, sy, 1); B.setSurf(x + 4 + q, sy, SURF.BOUNCE); }
    B.prop('mzSail', x + 4, sy, 4, 3, 'none', {});
    st.coins(x + 3, x + 8, sy - 6);
    if (o.gold) st.gold(x + 6, sy - 6, 'high');
    st.enemy('mzGhostCrab', x + 11, gy);
    return x + 13;
  },
  crabs(st, o) { const x = st.x, n = o.n || 2; st.floor(x, x + 4 * n + 3); for (let k = 0; k < n; k++) { st.enemy('mzGhostCrab', x + 3 + k * 4, st.gy); st.decor('mzShell', x + 1 + k * 4); } st.coins(x + 2, x + 4 * n, st.gy - 3); return x + 4 * n + 4; },

  /* 4-3: the great baobab (a climb) */
  // zigzag branches with weaver nests that bounce Brady up
  branches(st, o) {
    const B = st.B, W = st.W, n = o.n || 4, y0 = st.y;
    for (let k = 0; k < n; k++) {
      const y = y0 - 3 * (k + 1), left = k % 2 === 0, x0 = left ? 2 : W - 10, x1 = left ? 9 : W - 3;
      for (let x = x0; x <= x1; x++) B.set(x, y, T.SEMI);
      st.coins(x0 + 2, x0 + 5, y - 2);
      if (k === 1) { const nx = left ? x1 - 1 : x0 + 1; B.setSurf(nx, y, SURF.BOUNCE); B.decorAt('mzNest', nx, y, 0); }
    }
    if (o.monkey) st.enemy('mzMonkey', 5, y0 - 3, { edgeTurn: true });
    st.top(y0 - 3 * n - 3);
  },
  // inside the hollow trunk: a narrow shaft with alternating ledges
  hollow(st, o) {
    const B = st.B, W = st.W, mid = st.mid, y0 = st.y, h = o.h || 12, top = y0 - h;
    B.fill(2, top, mid - 4, y0 - 1, T.HARD); B.fill(mid + 3, top, W - 3, y0 - 1, T.HARD);
    for (let y = y0 - 3, k = 0; y > top; y -= 3, k++) { const lx = k % 2 ? mid + 1 : mid - 3; B.set(lx, y, T.SEMI); B.set(lx + 1, y, T.SEMI); B.pickAt(k % 2 ? mid - 2 : mid + 1, y - 1); }
    if (o.gold) st.gold(mid - 2, top + 2, 'must');
    st.top(top - 3);
  },
  // a beehive: sticky honeycomb ledges and buzzing bees
  honey(st) {
    const B = st.B, W = st.W, y0 = st.y;
    // sticky honey cuts jumps to about 2.5 tiles, so the combs are 2 rows apart
    [y0 - 3, y0 - 5, y0 - 7].forEach((y, k) => {
      const x0 = 3 + (k % 2) * 8;
      for (let x = x0; x < x0 + 9; x++) { B.set(x, y, T.SEMI); if (k) B.setSurf(x, y, SURF.STICKY); }
      if (k) B.prop('mzHoney', x0, y, 9, 1, 'none', {});
      st.coins(x0 + 2, x0 + 6, y - 2);
    });
    st.spawn('mzWeaver', W - 6, y0 - 8, { range: 3 });
    st.top(y0 - 9);
  },

  /* 4-4: the night beach */
  // sea turtles crawl slowly across a glowing tide pool: ride them
  turtles(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const span = o.span || 10;
    st.pit(x, x + span - 1); st.B.fill(x, st.gy + 1, x + span - 1, st.H - 1, T.LAVA);
    st.spawn('mplat', x + 1, st.gy - 1, { pw: 3, ax: (span - 4) * TS, ay: 0, speed: 0.9, skin: 'mzTurtle' });
    for (let k = 0; k < span; k++) st.B.ghosts.push([x + k, st.gy]);
    st.coins(x + 2, x + span - 3, st.gy - 3);
    if (o.gold) st.gold(x + Math.floor(span / 2), st.gy - 5, 'risky');
    x += span; st.floor(x, x + 2);
    return x + 3;
  },
  // rocks across a tide pool, glowing plankton in the water
  rocks(st) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    for (let i = 0; i < 3; i++) { st.pit(x, x + 1); st.B.fill(x, st.gy + 1, x + 1, st.H - 1, T.LAVA); const h = 1 + (i % 2); st.B.fill(x + 2, st.gy - h, x + 3, st.H - 1, T.PILLAR); st.coins(x + 2, x + 3, st.gy - h - 2); x += 4; }
    st.pit(x, x + 1); st.B.fill(x, st.gy + 1, x + 1, st.H - 1, T.LAVA); x += 2;
    st.floor(x, x + 2); return x + 3;
  },
  // the lighthouse sweeps the dark beach
  lighthouse(st) { const x = st.x; st.floor(x, x + 10); st.B.decorAt('mzBeam', x + 8, st.gy, 0); st.enemy('mzGhostCrab', x + 5, st.gy); st.coins(x + 1, x + 6, st.gy - 2); return x + 11; },

  /* 4-5: the fortress */
  // a rampart: a cannon fires coconuts along the wall
  rampart(st, o) {
    const x = st.x; st.floor(x, x + 14);
    st.spawn('mzCannon', x + 13, st.gy - 1, { dir: -1, period: 2.3 });
    st.semi(x + 3, x + 7, st.gy - 4); st.coins(x + 3, x + 7, st.gy - 6);
    if (o.gold) st.gold(x + 5, st.gy - 7, 'high');
    st.enemy('mzPrawn', x + 9, st.gy);
    return x + 15;
  },
  // a flooded cistern: stepping stones across the water
  cistern(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const n = o.n || 3;
    for (let i = 0; i < n; i++) { st.pit(x, x + 2); st.B.fill(x, st.gy + 1, x + 2, st.H - 1, T.LAVA); x += 3; st.B.fill(x, st.gy - 1, x, st.H - 1, T.PILLAR); st.coins(x, x, st.gy - 3); x += 1; }
    st.floor(x, x + 2); return x + 3;
  },
  // the boss beach: the sea laps in at both ends (kick the empty shells into it), three borrowed shells on
  // the sand, two ledges, a chili basket on a mid platform and the great baobab leaning over the fort wall
  arena_tidepool(st, o) {
    const B = st.B, { x0, w, GY } = o;
    for (const tx of [x0 + 1, x0 + 2, x0 + w - 3, x0 + w - 2]) for (let y = GY; y <= GY + 2; y++) B.set(tx, y, T.WATER);
    for (let q = 0; q < 3; q++) { B.set(x0 + 5 + q, GY - 4, T.SEMI); B.set(x0 + w - 8 + q, GY - 4, T.SEMI); B.set(x0 + 11 + q, GY - 6, T.SEMI); }
    B.prop('mzBaobabProp', x0 + 10, GY - 9, 6, 9, 'none', {});
    B.spawn('mzChiliBasket', x0 + 12, GY - 7, {});
    B.spawn('mzShellPot', x0 + 6, GY - 1, {}); B.spawn('mzShellBucket', x0 + 12, GY - 1, {}); B.spawn('mzShellBottle', x0 + 18, GY - 1, {});
    B.decorAt('mzCannonDecor', x0 + 6, GY - 4, 0); B.decorAt('mzCannonDecor', x0 + w - 7, GY - 4, 0);
    B.decorAt('mzShell', x0 + 9, GY, 0); B.decorAt('mzSkull', x0 + 17, GY, 0); B.decorAt('mzGrass', x0 + 3, GY, 0); B.decorAt('mzGrass', x0 + w - 4, GY, 0); B.decorAt('mzShell', x0 + 19, GY, 0);
  }
};
const platforms = {
  // a sea turtle crawling over the tide pool, shell glowing in the plankton light
  mzTurtle(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w, d = p.dx < 0 ? -1 : 1, cx = x + w / 2;
    ctx.save(); ctx.translate(cx, y); ctx.scale(d, 1);
    ctx.fillStyle = '#3a6a4a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * w * 0.32, 10, 10, 4, s * (0.4 + Math.sin(t * 3) * 0.2), 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(w / 2 + 6, 6, 9, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(w / 2 + 9, 4, 1.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a8a4a'; ctx.beginPath(); ctx.ellipse(0, 6, w / 2 + 2, 10, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(-w / 2 - 2, 5, w + 4, 4);
    ctx.strokeStyle = '#3a5a2a'; ctx.lineWidth = 1.5; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.arc(k * w * 0.25, 2, 6, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
};

/* ---------------- the boss: O EREMITA ---------------- */
// A giant hermit crab with no shell of his own: he borrows the fort's junk (a clay pot, a tin bucket, a
// bottle). Inside a shell he's armoured and stomps bounce off. Piri-piri fire breath HEATS the shell until
// he jumps out, hot and soft: stomp him. Kick the empty shells into the sea on either side so he has
// nowhere left to hide. Phase 2 the tide floods the floor edges and coconuts drop from the baobab; phase 3
// he's shell-less: claw sweeps, fast scuttling and sulking sprints. Beaten, he grabs a thimble and runs.
const shellArt = {
  pot(ctx, x, y, t, heat) {
    ctx.fillStyle = '#c8663a'; ctx.beginPath(); ctx.moveTo(x - 22, y - 44); ctx.quadraticCurveTo(x - 34, y - 20, x - 20, y); ctx.lineTo(x + 20, y); ctx.quadraticCurveTo(x + 34, y - 20, x + 22, y - 44); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a84a2a'; rr(ctx, x - 26, y - 50, 52, 9, 3); ctx.fill();
    for (let k = 0; k < 5; k++) { ctx.fillStyle = CAPU[k]; ctx.fillRect(x - 24 + k * 10, y - 30, 8, 7); }
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - 18, y - 40, 4, 30);
  },
  bucket(ctx, x, y, t, heat) {
    ctx.fillStyle = '#5a8ab8'; ctx.beginPath(); ctx.moveTo(x - 26, y - 46); ctx.lineTo(x + 26, y - 46); ctx.lineTo(x + 20, y); ctx.lineTo(x - 20, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a6a98'; ctx.fillRect(x - 27, y - 48, 54, 6); ctx.fillRect(x - 23, y - 24, 46, 4);
    ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 44, 24, Math.PI, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - 18, y - 40, 5, 34);
  },
  bottle(ctx, x, y, t, heat) {
    ctx.fillStyle = '#2a8a4a'; rr(ctx, x - 28, y - 34, 44, 34, 10); ctx.fill();
    ctx.fillStyle = '#2a8a4a'; rr(ctx, x + 10, y - 26, 20, 16, 4); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x + 26, y - 27, 5, 18);
    ctx.fillStyle = '#e8e0c8'; ctx.fillRect(x - 20, y - 28, 24, 20); ctx.fillStyle = '#c8323a'; ctx.fillRect(x - 17, y - 24, 18, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - 24, y - 31, 36, 4);
  }
};
// a borrowed shell: Brady kicks it, stomps it to launch it; into the sea it's gone for good
class MzShell extends TourProp {
  constructor(g, s, kind) {
    super(g, s, { w: 56, h: 50, kick: 7, bounce: 0.4, friction: 4, hp: 0, burst: '#c8a080', art: (ctx, p, x, y, t) => p.paint(ctx, x, y, t) });
    this.kind = kind; this.kindName = kind.toUpperCase(); this.held = false; this.hotT = 0;
  }
  update(dt) {
    this.t += dt; if (this.hotT > 0) this.hotT -= dt;
    const b = this.g.boss;
    if (this.held) {
      if (!b || b.remove || b.shell !== this) { this.held = false; return; }
      this.x = b.cx - this.w / 2 - b.dir * 10; this.y = b.y + b.h - this.h; this.vx = this.vy = 0; this.fast = false; this.onGround = true; return;
    }
    super.update(dt);
    if (this.remove) return;
    if (tileAt(this.g.area, Math.floor(this.cx / TS), Math.floor((this.y + this.h * 0.7) / TS)) === T.WATER) {
      this.remove = true; Sound.play('splash', { vol: 0.7 }); this.g.burst(this.cx, this.y + this.h, 24, '#8ad8ff', 'spark'); this.g.parts.text(this.cx, this.y - 10, 'SPLOOSH!', '#8ad8ff'); this.g.addScore(500, this.cx, this.y);
      if (b && b.state === 'fight') K.say(this.g, b, pick(['NO! MY ' + this.kindName + '!', 'THAT WAS A GOOD ONE!', 'YOU MONSTER!']), '#ffd84a');
    }
  }
  touchPlayer(p) { if (this.held) return; super.touchPlayer(p); }
  // a cold shell's picture never changes (the ink is drawn once and reused)
  inkKey() { const b = this.g.boss, heat = this.held && b ? (b.heat || 0) : this.hotT; return heat > 0 ? null : 'cold'; }
  paint(ctx, x, y, t) {
    const b = this.g.boss, heat = this.held && b ? (b.heat || 0) / 3 : (this.hotT > 0 ? Math.min(1, this.hotT / 2.5) : 0);
    shellArt[this.kind](ctx, x, y, t, heat);
    if (heat > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,${120 - heat * 80},40,${0.15 + heat * 0.35 + Math.sin(t * 20) * 0.08 * heat})`;
      ctx.beginPath(); ctx.ellipse(x, y - 24, 30, 26, 0, 0, TAU); ctx.fill(); ctx.restore();
      ctx.strokeStyle = `rgba(255,255,255,${0.35 * heat})`; ctx.lineWidth = 1.5;
      for (let k = -1; k <= 1; k++) { ctx.beginPath(); for (let q = 0; q < 6; q++) { const yy = y - 54 - q * 5 - ((t * 40) % 10); ctx.lineTo(x + k * 12 + Math.sin(t * 12 + q + k) * 3, yy); } ctx.stroke(); }
      if (Math.random() < 0.2 * heat) this.g.burst(x + (Math.random() - 0.5) * 30, y - 50, 1, '#aaaaaa', 'dust');
    }
  }
}
const mzShellOf = kind => class extends MzShell { constructor(g, s) { super(g, s, kind); } };
// the chili basket: restocks a piri-piri whenever Brady has none
class MzChiliBasket extends Ent {
  constructor(g, s) { super(g, s, 30, 22); this.cool = 1; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player, b = g.boss; if (!b || b.state === 'sleep') return;
    this.cool -= dt; if (this.cool > 0) return;
    const has = g.entities.some(e => e instanceof TourItem && e.kind === 'sig:piri' && !e.remove && Math.abs(e.cx - this.cx) < 16 * TS);
    const hot = p && p.sig && p.sig.id === 'piri';
    if (!has && !hot) { this.cool = 3; g.spawn(new TourItem(g, this.cx, this.y - 30, 'sig:piri')); Sound.play('appear', { vol: 0.5 }); g.burst(this.cx, this.y, 8, '#e8222a', 'spark'); }
    else this.cool = 0.5;
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h;
    ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.moveTo(x - 16, y - 16); ctx.lineTo(x + 16, y - 16); ctx.lineTo(x + 12, y); ctx.lineTo(x - 12, y); ctx.closePath(); ctx.fill();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = CAPU[k]; ctx.fillRect(x - 15 + k, y - 13 + k * 4, 30 - k * 2, 2); }
    for (let k = -1; k <= 1; k++) chiliIcon(ctx, x + k * 8, y - 20, this.t + k);
  }
}
Object.assign(entities, { mzShellPot: mzShellOf('pot'), mzShellBucket: mzShellOf('bucket'), mzShellBottle: mzShellOf('bottle'), mzChiliBasket: MzChiliBasket });
// a shadow on the floor under a falling coconut: the tell
class MzShadow extends Ent {
  constructor(g, x, floorY, life) { super(g, null, 40, 8); this.x = x - 20; this.y = floorY - 6; this.life = life; this.max = life; }
  update(dt) { this.t += dt; this.life -= dt; if (this.life <= 0) this.remove = true; }
  draw(ctx) { const k = 1 - this.life / this.max; ctx.fillStyle = `rgba(0,0,0,${0.15 + 0.3 * k})`; ctx.beginPath(); ctx.ellipse(this.cx, this.y + 6, 8 + 14 * k, 3 + 4 * k, 0, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(this.t * 20)})`; ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', this.cx, this.y - 4); }
}
const coconutDropArt = (ctx, s, t) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(t * 5); ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a2a1a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(Math.cos(k * 2.1) * 3, Math.sin(k * 2.1) * 3, 1.3, 0, TAU); ctx.fill(); } ctx.restore(); };
const clawWaveArt = (ctx, s, t) => { const d = s.dir; ctx.fillStyle = '#e85a3a'; ctx.beginPath(); ctx.moveTo(s.x, s.y + s.h); ctx.lineTo(s.x + s.w / 2, s.y + 2 + Math.sin(t * 30) * 2); ctx.lineTo(s.x + s.w, s.y + s.h); ctx.fill(); ctx.fillStyle = '#ff8a6a'; ctx.beginPath(); ctx.arc(s.cx + d * 4, s.y + 10, 5, 0, TAU); ctx.fill(); };
const boss = {
  id: 'mz_hermit', name: 'O Eremita', hp: 4, dims: [80, 60], music: 'tour_mz_boss', country: 'mz',
  brain: {
    guardText: 'SHELL!',
    phases: [3, 2],
    wake(b) { b.tall = true; b.heat = 0; b.heatT = 0; b.shell = null; b.exposed = false; b.tide = 0; b.target = null; K.say(b.g, b, 'A SHELL! MINE! ALL MINE!', '#ffd84a'); },
    // the empty shells he can still reach (inside this arena and off the sea troughs)
    shells(b) { const [x0, x1] = this.bounds(b); return b.g.entities.filter(e => e instanceof MzShell && !e.remove && !e.held && !e.fast && e.cx > x0 + b.w / 2 - 24 && e.cx < x1 + b.w / 2 + 24); },
    nearestShell(b) { let best = null, bd = 1e9; for (const s of this.shells(b)) { const d = Math.abs(s.cx - b.cx) + (s === b.lastShell ? 3 * TS : 0); if (d < bd) { bd = d; best = s; } } return best; },
    // the sea troughs at both ends are off limits to him (he'd sink)
    bounds(b) { const m = (b.phase >= 2 && b.tide >= 1.5 ? 5 : 3) * TS; return [b.arenaX0 + m, b.arenaX1 - m - b.w]; },
    atEdge(b) { const [x0, x1] = this.bounds(b); return b.hitWall || b.x <= x0 + 1 || b.x >= x1 - 1; },
    update(b, dt) {
      const g = b.g, p = g.player, ph = b.phase || 1;
      this.guardText = b.shell ? 'SHELL!' : 'CLAWS!';
      b.guard = 'bounce';
      if (b.heat > 0) { b.heatT += dt; if (b.heatT > 4) { b.heatT = 0; b.heat--; } }
      if (b.act === 'walk') b.go(b.exposed ? 'dash' : 'scuttle');
      if (b.act === 'scuttle') {
        // off to the nearest shell (soft and stompable on the way)
        b.pose = 'run'; b.vuln = true; b.guard = 'hurt';
        const s = b.target && !b.target.remove && !b.target.held && !b.target.fast ? b.target : (b.target = this.nearestShell(b));
        if (!s) { b.exposed = true; K.say(g, b, 'NO SHELLS?! FINE! NO SHELLS!', '#ffd84a'); b.go('dash'); }
        else {
          b.dir = s.cx < b.cx ? -1 : 1; b.vx = b.dir * 4.2 * TS;
          if (Math.abs(s.cx - b.cx) < 30) { b.vx = 0; b.go('enter'); }
          if (b.at > 4) { b.target = null; b.at = 0; }
        }
      } else if (b.act === 'enter') {
        b.pose = 'hop'; b.vuln = true; b.guard = 'hurt';
        if (b.first) b.vy = -6 * TS;
        if (b.at > 0.3 && b.onGround) {
          const s = b.target;
          if (s && !s.remove && !s.held && !s.fast) { s.held = true; b.shell = s; b.lastShell = s; b.heat = 0; Sound.play('bump', { pitch: 1.2 }); g.burst(b.cx, b.y + b.h, 8, '#e8e0d0', 'dust'); K.say(g, b, pick(['HOME SWEET ' + s.kindName + '!', 'COSY.', 'MINE.']), '#ffd84a'); b.go('inshell'); }
          else { b.target = null; b.go('scuttle'); }
        }
      } else if (b.act === 'inshell') {
        b.pose = 'shell'; b.face(); b.walk(0.55);
        if (b.at > 2.2) { b.cycle++; const seq = ph >= 2 ? ['lunge', 'rain'] : ['lunge']; b.go(seq[b.cycle % seq.length]); }
      } else if (b.act === 'lunge') {
        // tell: the claw comes up and clicks, then he lunges out of the shell
        b.pose = b.at < 0.65 ? 'claw' : 'lunge';
        if (b.first) { b.face(); b.vx = 0; K.say(g, b, 'CLICK CLICK!', '#ffffff'); }
        if (b.at < 0.65) b.vx = 0;
        else { if (!b.fired) { b.fired = true; Sound.play('kick', { pitch: 0.8 }); } b.vx = b.dir * 6 * TS; }
        if (b.at > 1.5 || (b.at > 0.7 && this.atEdge(b))) { b.fired = false; b.go('inshell'); }
      } else if (b.act === 'rain') {
        // tell: a whistle, the baobab shakes, shadows on the floor; then the coconuts drop
        b.pose = 'whistle'; b.vx = 0;
        if (b.first) { K.say(g, b, pick(['COCOS! AGORA!', 'TREE! DO YOUR THING!']), '#ffd84a'); g.shake(3); Sound.play('wind', { vol: 0.4, pitch: 1.8 }); }
        if (b.at > 0.5 && !b.fired) {
          b.fired = true;
          const px = p ? p.cx : b.cx, xs = [px, px - (3.5 + Math.random()) * TS, px + (3.5 + Math.random()) * TS];
          for (const x0 of xs) { const x = clamp(x0, b.arenaX0 + TS, b.arenaX1 - TS); g.spawn(new MzShadow(g, x, b.floorY, 0.95)); tourFire(g, x, b.floorY - 11 * TS, { kind: 'coconut', vx: 0, vy: 1 * TS, grav: PHYS.gDown * 0.42, w: 16, h: 16, life: 2.5, thru: true, stompable: true, col: '#6a4a2a', art: coconutDropArt }); }
        }
        if (b.at > 1.3) { b.fired = false; b.go('inshell'); }
      } else if (b.act === 'eject') {
        // too hot: he bails out and runs about, soft and stompable
        b.pose = 'hot'; b.vuln = true; b.guard = 'hurt';
        if (b.first) {
          const s = b.shell; if (s) { s.held = false; s.x = b.cx - s.w / 2; s.hotT = 2.5; s.vx = -b.dir * 2 * TS; } b.shell = null; b.heat = 0; b.vy = -9 * TS; b.vx = b.dir * 3 * TS;
          Sound.play('fire', { pitch: 1.4 }); K.say(g, b, pick(['QUENTE! QUENTE! QUENTE!', 'HOT HOT HOT HOT!', 'AIIIEEEE!']), '#ff7a2a'); g.burst(b.cx, b.cy, 20, '#ff8a2a', 'spark');
        }
        if (b.onGround && b.at > 0.3) { b.vx = Math.sin(b.at * 5) * 4.5 * TS; b.dir = b.vx < 0 ? -1 : 1; }
        if (Math.random() < 0.2) g.burst(b.cx, b.y + 10, 1, '#aaaaaa', 'dust');
        if (b.at > 3.4) { b.target = null; b.go('scuttle'); }
      } else if (b.act === 'dash') {
        // shell-less: he scuttles fast after Brady (soft!)
        b.pose = 'run'; b.vuln = true; b.guard = 'hurt';
        if (b.first || Math.floor(b.at * 2) !== Math.floor((b.at - dt) * 2)) b.face();
        b.vx = b.dir * 3.6 * TS;
        if (b.at > 2.2) { b.cycle++; b.go(b.cycle % 2 ? 'sweep' : 'sprint'); }
      } else if (b.act === 'sweep') {
        // tell: both claws up and snapping, then claw waves race along the floor both ways
        b.pose = 'claw'; b.vx = 0;
        if (b.first) { b.face(); K.say(g, b, 'SNAP SNAP!', '#ffffff'); }
        if (b.at > 0.7 && !b.fired) { b.fired = true; Sound.play('kick', { pitch: 0.6 }); g.shake(4); for (const d of [-1, 1]) tourFire(g, b.cx + d * (b.w / 2 + 10), b.floorY - 12, { kind: 'claw', vx: d * 6 * TS, w: 22, h: 24, ground: true, life: 2.5, col: '#e85a3a', art: clawWaveArt }); }
        if (b.at > 1.3) { b.fired = false; b.go('dash'); }
      } else if (b.act === 'sprint') {
        // the sulking sprint: tell is a stamp and a complaint, then wall to wall at full tilt
        b.pose = b.at < 0.55 ? 'stamp' : 'sprint';
        if (b.first) { b.face(); b.vx = 0; K.say(g, b, pick(['I HATE THIS BEACH!', 'EVERYONE LEAVE!', 'NOT FAIR NOT FAIR']), '#ffd84a'); }
        if (b.at < 0.55) b.vx = 0;
        else { b.vx = b.dir * 8.5 * TS; if (Math.random() < 0.4) g.burst(b.cx - b.dir * 30, b.y + b.h, 2, '#e8e0d0', 'dust'); if (this.atEdge(b)) { g.shake(8); Sound.play('bump'); g.burst(b.cx + b.dir * 30, b.cy, 14, '#e8e0d0', 'debris'); b.go('dazed'); } }
        if (b.at > 3) b.go('dazed');
      } else if (b.act === 'dazed') {
        b.pose = 'dazed'; b.vx = 0; b.vuln = true; b.guard = 'hurt';
        if (b.at > 2.2) b.go('dash');
      } else if (b.act === 'thimble') {
        // the finish: he finds a thimble, declares it perfect, and runs off into the sea
        b.pose = 'thimble'; b.vuln = true;
        if (b.first) { b.vx = 0; K.say(g, b, 'A THIMBLE! PERFECT. GOODBYE.', '#ffd84a'); b.dir = b.cx < (b.arenaX0 + b.arenaX1) / 2 ? -1 : 1; Sound.play('select', { pitch: 1.4 }); }
        if (b.at > 1.1) { b.vx = b.dir * 6 * TS; if (Math.random() < 0.3) g.burst(b.cx - b.dir * 20, b.y + b.h, 2, '#e8e0d0', 'dust'); }
        if (b.at > 1.1 && this.atEdge(b)) { g.burst(b.cx, b.cy, 20, '#8ad8ff', 'spark'); Sound.play('splash'); b.die(); }
        if (b.at > 3.5) b.die();
      }
      b.fall(dt);
      const [x0, x1] = this.bounds(b); b.x = clamp(b.x, x0, x1);
      // phase 2: the tide comes in (a sloshing tell, then the floor edges flood)
      if (b.tide > 0 && b.tide < 1.5) { b.tide += dt; if (Math.random() < 0.4) for (const tx of [b.arenaX0 + 3.5 * TS, b.arenaX1 - 3.5 * TS]) g.burst(tx + (Math.random() - 0.5) * 40, b.floorY, 1, '#8ad8ff', 'spark'); if (b.tide >= 1.5) this.flood(b); }
    },
    flood(b) {
      const g = b.g, x0 = Math.round(b.arenaX0 / TS), x1 = Math.round(b.arenaX1 / TS), GY = Math.round(b.floorY / TS);
      for (const tx of [x0 + 3, x0 + 4, x1 - 5, x1 - 4]) for (let ty = GY; ty <= GY + 2; ty++) g.setTile(tx, ty, T.WATER);
      Sound.play('splash'); g.shake(5); g.parts.text((b.arenaX0 + b.arenaX1) / 2, b.floorY - 3 * TS, 'HIGH TIDE!', '#8ad8ff');
      for (const tx of [x0 + 3.5, x1 - 4.5]) g.burst(tx * TS + 16, b.floorY, 24, '#8ad8ff', 'spark');
    },
    touch(b, p) {
      // inside a shell he's passive (except when lunging): Brady just gets nudged off
      if (!b.shell || b.act === 'lunge') return false;
      const stomping = p.vy > 0 && p.prevBottom <= b.y + b.h * 0.35, bumping = p.vy < 0 && p.prevBottom - p.h >= b.y + b.h * 0.7;
      if (stomping || bumping) return false;
      p.x += (p.cx < b.cx ? -1 : 1) * 2.5; return true;
    },
    hit(b, kind, src) {
      if (b.act === 'thimble') return false;
      const soft = ['scuttle', 'enter', 'eject', 'dash', 'dazed'].indexOf(b.act) >= 0;
      if (kind === 'fire') {
        if (b.shell && b.act !== 'eject') {
          b.heat = Math.min(3, b.heat + 1); b.heatT = 0;
          b.g.parts.text(b.cx, b.y - 16, ['HOT!', 'HOTTER!', 'TOO HOT!!'][b.heat - 1], '#ff7a2a'); b.g.burst(b.cx, b.cy, 10, '#ff8a2a', 'spark'); Sound.play('fire', { pitch: 1.1, vol: 0.4 });
          if (b.heat >= 3) b.go('eject');
          return false;
        }
        // out of the shell, fire only makes him complain: the stomp is the hit
        if (soft && Math.random() < 0.3) K.say(b.g, b, pick(['ALREADY HOT!', 'STOP THAT!']), '#ff7a2a');
        return false;
      }
      if (kind === 'stomp' || kind === 'spin') { if (soft) { b.damage(1, { text: pick(['SOFT BITS!', 'SQUISH!', 'PINCHED!']), col: '#ff9a6a' }); return true; } return 'bounce'; }
      if (kind === 'prop') { if (soft && src.thrownBy) { b.damage(1, { text: 'BONK!', col: '#ffffff' }); return true; } return false; }
      if (kind === 'disc') return soft ? undefined : false;
      if (kind === 'star') return undefined;
      return false;
    },
    hurt(b) {
      K.say(b.g, b, pick(['MY SOFT BITS!', 'OUCH! RUDE!', 'I NEED A SHELL!']), '#ffd84a'); b.g.burst(b.cx, b.cy, 20, '#ff7a5a', 'confetti'); b.target = null;
      if (b.exposed) b.go('sprint'); else { b.go('scuttle'); b.vy = -5 * TS; }
    },
    phase(b, n) {
      const g = b.g; b.target = null; g.burst(b.cx, b.cy, 20, '#ff7a5a', 'confetti');
      if (n === 2) { K.say(g, b, 'THE TIDE! AND THE COCONUTS!', '#ffd84a'); g.bannerText = 'THE TIDE COMES IN'; g.bannerT = 1.6; b.tide = 0.01; b.go('scuttle'); b.vy = -5 * TS; }
      else if (n === 3) {
        b.exposed = true; K.say(g, b, 'BASTA! NO MORE SHELLS!', '#ffd84a'); g.bannerText = 'SHELL-LESS!'; g.bannerT = 1.6; g.shake(8);
        const s = b.shell; if (s) { s.held = false; b.shell = null; const d = b.cx < (b.arenaX0 + b.arenaX1) / 2 ? -1 : 1; s.fling(d * 10 * TS, -8 * TS, null); }
        b.heat = 0; b.go('sprint');
      }
    },
    lastHit(b) { b.go('thimble'); return true; },
    draw(b, ctx, t) {
      const x = b.cx, y = b.y + b.h, d = b.dir, P = b.pose, inShell = !!b.shell;
      ctx.save(); ctx.translate(x, y);
      if (P === 'hop') ctx.rotate(-d * 0.2);
      if (P === 'sprint') ctx.rotate(d * 0.25);
      if (P === 'stamp') ctx.translate(0, Math.abs(Math.sin(t * 20)) * -4);
      // the crab: soft pink body (peeking out of the shell, or all of him when he's out)
      const bx = inShell ? d * 28 : 0, bw = inShell ? 16 : 30, hot = P === 'hot';
      ctx.fillStyle = hot ? '#ff6a4a' : P === 'sprint' || P === 'stamp' ? '#ff7a5a' : '#ff8a6a';
      ctx.beginPath(); ctx.ellipse(bx, -18, bw, 15, 0, 0, TAU); ctx.fill();
      // legs scuttle
      ctx.strokeStyle = '#e85a3a'; ctx.lineWidth = 3;
      const run = P === 'run' || P === 'sprint' || P === 'hot' || P === 'lunge' || P === 'thimble';
      for (let k = 0; k < (inShell ? 3 : 6); k++) { const lx = bx - (inShell ? 10 : 24) + k * (inShell ? 10 : 10), ph = run ? Math.sin(t * 22 + k * 1.3) * 5 : Math.sin(t * 3 + k) * 1.5; ctx.beginPath(); ctx.moveTo(lx, -8); ctx.lineTo(lx + ph - 3, 0); ctx.stroke(); }
      // claws: raised for the tell, snapping for the sweep
      const up = P === 'claw' || P === 'stamp' || P === 'dazed';
      const snap = P === 'claw' ? Math.abs(Math.sin(t * 25)) * 0.6 : 0.2;
      for (const s of (inShell ? [1] : [-1, 1])) {
        const cx = bx + s * d * 26, cy = up ? -44 : -26;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(s * d * (up ? -0.9 : 0.3));
        ctx.fillStyle = '#e85a3a'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 8, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#d84a2a'; ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(18, -8 - snap * 10); ctx.lineTo(12, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(6, 4); ctx.lineTo(18, 6 + snap * 10); ctx.lineTo(12, 0); ctx.fill();
        ctx.restore();
      }
      // eyes on stalks
      for (const s of [-1, 1]) {
        const ex = bx + s * 7 + d * 4, wob = P === 'dazed' ? Math.sin(t * 10 + s) * 4 : 0;
        ctx.fillStyle = '#e85a3a'; ctx.fillRect(ex - 1, -46, 2, 16);
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex + wob, -47, 4, 0, TAU); ctx.fill();
        ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(ex + wob + d * 1.5, -47 + (hot ? -1 : 0), 2, 0, TAU); ctx.fill();
      }
      // the mouth: a grin, a scream when hot, a pout when sulking
      ctx.strokeStyle = '#8a2a1a'; ctx.lineWidth = 2; ctx.beginPath();
      if (hot) { ctx.ellipse(bx + d * 6, -12, 5, 6, 0, 0, TAU); ctx.stroke(); ctx.fillStyle = '#5a1a1a'; ctx.fill(); }
      else if (P === 'sprint' || P === 'stamp' || P === 'dazed') { ctx.moveTo(bx + d * 2, -10); ctx.quadraticCurveTo(bx + d * 8, -14, bx + d * 14, -10); ctx.stroke(); }
      else { ctx.moveTo(bx + d * 2, -12); ctx.quadraticCurveTo(bx + d * 8, -6, bx + d * 14, -12); ctx.stroke(); }
      if (P === 'thimble') { ctx.fillStyle = '#c8c8d0'; ctx.beginPath(); ctx.moveTo(bx + d * 30 - 5, -34); ctx.lineTo(bx + d * 30 + 5, -34); ctx.lineTo(bx + d * 30 + 4, -24); ctx.lineTo(bx + d * 30 - 4, -24); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#8a8a9a'; for (let k = 0; k < 3; k++) ctx.fillRect(bx + d * 30 - 3 + k * 3, -31, 1.5, 1.5); }
      ctx.restore();
      if (P === 'dazed') K.dizzy(ctx, x, b.y - 2, t);
      if (hot && Math.random() < 0.5) ctx.fillStyle = 'rgba(255,120,40,0.6)';
      if (hot) { ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillStyle = `rgba(255,216,74,${0.6 + 0.4 * Math.sin(t * 8)})`; ctx.fillText('SOFT!', x, b.y - 24); }
      if (inShell && b.heat > 0) { ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ff7a2a'; ctx.fillText('♨'.repeat(b.heat), x, b.y - 10 + Math.sin(t * 6) * 2); }
    }
  }
};

/* ---------------- music: timbila xylophones, marrabenta guitar, ngoma drums ---------------- */
const tracks = {
  tour_mz: {
    bpm: 116, bars: 8, rv: 0.28, dl: 0.12, hx: 0.06,
    ch: 'G C D G Em C D G',
    ld: 'B5:2 D6:2 B5:2 G5:2 A5:4 B5:4 | C6:2 E6:2 C6:2 A5:2 G5:8 | A5:2 B5:2 C6:2 D6:2 F#6:4 D6:4 | G6:8 D6:8 |' +
        'E6:2 D6:2 B5:2 G5:2 E5:4 G5:4 | C6:2 B5:2 A5:2 G5:2 E5:8 | F#5:2 A5:2 D6:2 C6:2 B5:4 A5:4 | G5:12 .:4',
    li: 'vibes', lv: 0.16,
    bp: 'r..r..r.r..r....', bi: 'pluckb', bv: 0.3,
    ap: '0.2.1.3.2.1.0.2.', ai: 'mbox', av: 0.05, ao: 72,
    dr: ['k..k...k.k..k...', '....s.......s...', 'n.nnn.nnn.nnn.nn', 'b.d.b..db.d.b..d'], dv: 0.42
  },
  tour_mz_run: {
    bpm: 138, bars: 8, rv: 0.22, hx: 0.08,
    ch: 'D G A D Bm G A D',
    ld: 'F#5:2 A5:2 D6:2 A5:2 F#5:2 A5:2 D6:4 | G5:2 B5:2 D6:2 B5:2 G5:8 | A5:2 C#6:2 E6:2 C#6:2 A5:4 E5:4 | F#5:8 D5:8 |' +
        'B5:2 D6:2 F#6:2 D6:2 B5:4 F#5:4 | G5:2 B5:2 D6:4 G6:8 | E6:2 C#6:2 A5:2 E5:2 G5:4 C#6:4 | D6:12 .:4',
    li: 'gtr', lv: 0.15,
    bp: 'r.r.r.o.r.r.r.f.', bi: 'pluckb', bv: 0.3,
    ap: '0.1.2.1.0.1.2.1.', ai: 'pluck', av: 0.05, ao: 64,
    dr: ['k...k...k...k...', '....s.......s.s.', 'h.h.h.h.h.h.h.h.', 'b..d.b..b..d.b..'], dv: 0.44
  },
  tour_mz_night: {
    bpm: 90, bars: 8, rv: 0.55, dl: 0.22,
    ch: 'Em C G D Em C D Em',
    ld: 'E5:4 G5:4 B5:8 | C6:4 B5:4 G5:8 | D6:4 B5:4 G5:4 D5:4 | F#5:12 .:4 | G5:4 B5:4 E6:8 | E6:4 D6:4 C6:8 | A5:4 B5:4 D6:4 F#5:4 | E5:12 .:4',
    li: 'vibes', lv: 0.13,
    bp: 'r.......r.......', bi: 'sub', bv: 0.24,
    ap: '0..2..1..3..0..2', ai: 'mbox', av: 0.04, ao: 70,
    dr: ['b.......d.......', '....n.......n...', '..u.......u.....'], dv: 0.3
  },
  tour_mz_boss: {
    bpm: 156, bars: 8, rv: 0.2, hx: 0.1,
    ch: 'Am Am F G Am Am F E',
    ld: 'A5:2 C6:2 E6:2 A6:2 G6:4 E6:4 | C6:2 E6:2 A5:4 C6:8 | F5:2 A5:2 C6:2 F6:2 E6:4 C6:4 | D6:4 B5:4 G5:8 |' +
        'E6:2 D6:2 C6:2 B5:2 A5:4 E5:4 | A5:2 C6:2 E6:4 A6:8 | F6:2 E6:2 D6:2 C6:2 B5:4 G#5:4 | A5:12 E6:4',
    li: 'vibes', lv: 0.17,
    bp: 'r.r.r.o.r.r.r.f.', bi: 'sawb', bv: 0.28,
    ap: 'c-..c-..c-..c-..', ai: 'mbox', av: 0.05, ao: 64,
    dr: ['K...k...K...k.k.', '....s.......s...', 'n.n.n.n.n.n.n.n.', 'b.d.b.d.b.d.b.d.'], dv: 0.46
  }
};

/* ---------------- the five levels ---------------- */
Tour.country({
  id: 'mz', colors: COL, tagline: 'Savanna, dunes, baobabs and the Indian Ocean',
  themes, painters, dyn, decor, decorLights, platforms, enemies, entities, pieces: P, boss, power, tracks,
  music: { level: 'tour_mz', boss: 'tour_mz_boss' },
  landmark: 'the great baobab',
  arrival: 'Brady! The Baron shrank the biggest baobab in Africa and put it in a flowerpot. Rude! ♥ C',
  coin: { name: 'CASHEW NUT', draw(ctx, x, y) {
    ctx.fillStyle = '#e8c890'; ctx.beginPath(); ctx.arc(x + 1, y - 2, 7.5, Math.PI * 0.9, Math.PI * 2.2); ctx.quadraticCurveTo(x + 2, y + 9, x - 5, y + 5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#b8945a'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 2, y - 6, 3, 2);
  } },
  star: { name: 'GOLDEN BAOBAB', draw(ctx, x, y, t) { ctx.save(); ctx.translate(x, y); ctx.scale(Math.cos(t * 3) > 0 ? 1 : -1, 1); baobab(ctx, 0, 10, 24, '#ffd24a'); ctx.restore(); } },
  // the six levels (v2 format) are in 29_tour_mz_levels.js
  levels: []
});
})();
