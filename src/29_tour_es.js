/* ============================================================
   SPAIN (world 6)
   6-1 La Tomatina          run    tomato trucks lob tomatoes, slippery pulp streets, crate stacks, balconies
   6-2 The Aquarium         swim   glass tunnels, pulsing jellyfish, pump currents and big tanks
   6-3 City of Arts by Night night white ribbed arches, reflecting pools, light-up floor tiles on the beat, a lifting "eyelid" deck
   6-4 The Giant Falla      climb  climb a giant papier-mâché sculpture: rocket launchers, firecracker strings, giant fruit
   6-5 The Silk Exchange    castle twisted columns, swinging silk banners, rising and falling scales; boss Paellasaurus
   ============================================================ */
(() => {
const COL = { a: '#ffd23a', b: '#ff8a1a', c: '#c8222a' };
const K = TourKit;
const FALLA = ['#ff5a8a', '#ffd23a', '#3ac8ff', '#7ae05a', '#ff8a2a', '#b86aff'];
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };
if (typeof LIQUIDS !== 'undefined') LIQUIDS.pool = ['#9ae8ff', '#3aa8d8', '#0e4a7a', 'rgba(240,255,255,0.35)', '#5ad8ff', 'rgba(255,255,255,0.7)'];

/* ---------------- background painters ---------------- */
const painters = {
  // white town houses with terracotta roofs, green shutters and flower balconies
  esTown(ctx, L, rng, H) {
    let x = 0;
    while (x < BG_W) {
      const w = 56 + rng() * 50, h = 80 + rng() * 70;
      ctx.fillStyle = shade(L.color, (rng() - 0.5) * 0.08); ctx.fillRect(x, L.base - h, w - 3, h + (H - L.base));
      ctx.fillStyle = '#c8603a'; ctx.beginPath(); ctx.moveTo(x - 4, L.base - h); ctx.lineTo(x + w / 2, L.base - h - 18); ctx.lineTo(x + w + 1, L.base - h); ctx.fill();
      for (let wy = L.base - h + 14; wy < L.base - 20; wy += 30) for (let wx = x + 8; wx < x + w - 14; wx += 20) { ctx.fillStyle = '#2a7a4a'; ctx.fillRect(wx, wy, 10, 14); ctx.fillStyle = FALLA[Math.floor(rng() * 6)]; ctx.fillRect(wx - 1, wy + 14, 12, 3); }
      x += w;
    }
  },
  // rows of orange trees
  esGrove(ctx, L, rng, H) {
    ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let x = 20; x < BG_W; x += 44) wrapDraw(x, 40, xx => { ctx.fillStyle = '#5a3a22'; ctx.fillRect(xx - 2, L.base - 22, 4, 22); ctx.fillStyle = L.color; ctx.beginPath(); ctx.arc(xx, L.base - 32, 18, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff8a1a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(xx - 10 + (k * 7) % 20, L.base - 40 + (k * 5) % 16, 2.5, 0, TAU); ctx.fill(); } });
  },
  // stylised futuristic white shells and ribs mirrored in long pools
  esArts(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, L.base, H, '#1a3a6a', '#0a1a34'); ctx.fillRect(0, L.base, BG_W, H - L.base);
    const shell = (x, w, h) => { ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(x, L.base); ctx.quadraticCurveTo(x + w * 0.2, L.base - h, x + w * 0.7, L.base - h * 0.9); ctx.quadraticCurveTo(x + w * 0.95, L.base - h * 0.6, x + w, L.base); ctx.closePath(); ctx.fill(); ctx.strokeStyle = shade(L.color, -0.25); ctx.lineWidth = 2; for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x + w * k / 6, L.base); ctx.lineTo(x + w * (0.2 + k * 0.1), L.base - h * (0.5 + k * 0.07)); ctx.stroke(); } };
    shell(60, 220, 130); shell(560, 260, 110);
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.ellipse(410, L.base - 30, 70, 30, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = 'rgba(120,200,255,0.5)'; ctx.beginPath(); ctx.ellipse(410, L.base - 30, 30, 14, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.3; ctx.scale(1, -1); ctx.translate(0, -2 * L.base); shell(60, 220, 60); shell(560, 260, 50); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  },
  // giant papier-mâché sculptures and festival lights
  esFallas(ctx, L, rng, H) {
    for (let x = 60; x < BG_W; x += 260) wrapDraw(x, 160, xx => {
      ctx.fillStyle = FALLA[(xx / 260 | 0) % 6]; ctx.beginPath(); ctx.ellipse(xx + 60, L.base - 120, 50, 70, 0.1, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(xx + 44, L.base - 140, 12, 0, TAU); ctx.arc(xx + 76, L.base - 140, 12, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(xx + 46, L.base - 138, 5, 0, TAU); ctx.arc(xx + 78, L.base - 138, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(L.color, -0.1); ctx.fillRect(xx, L.base - 50, 120, 50 + (H - L.base));
    });
    for (let k = 0; k < 50; k++) { ctx.fillStyle = FALLA[k % 6]; ctx.beginPath(); ctx.arc(k * BG_W / 50, L.base - 230 + Math.sin(k * 0.6) * 10, 3, 0, TAU); ctx.fill(); }
  },
  // a Gothic hall: pointed vaults on twisted columns
  esHall(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 128) {
      ctx.strokeStyle = shade(L.color, 0.18); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, L.base); ctx.lineTo(x, L.base - 160); ctx.quadraticCurveTo(x + 64, L.base - 260, x + 128, L.base - 160); ctx.stroke();
      ctx.fillStyle = shade(L.color, 0.1); for (let y = L.base - 160; y < L.base; y += 12) { ctx.beginPath(); ctx.ellipse(x, y, 9, 4, 0.5, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,220,150,0.18)'; ctx.fillRect(x + 50, L.base - 150, 28, 70);
    }
  }
};

/* ---------------- tiles ---------------- */
// squashed tomato pulp: the street's slippery surface
function pulp(ctx, topOpen) {
  const g = ctx.createLinearGradient(0, 0, 0, TS); g.addColorStop(0, '#e8322a'); g.addColorStop(1, '#a81a1a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, TS, TS);
  ctx.fillStyle = 'rgba(255,220,180,0.55)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(4 + i * 6, 10 + (i % 2) * 10, 1.6, 1, 0.4, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(3, 5, 10, 2);
  if (topOpen) { ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.moveTo(0, 0); for (let x = 0; x <= TS; x += 4) ctx.lineTo(x, 3 + Math.sin(x * 0.9) * 1.6); ctx.lineTo(TS, 0); ctx.fill(); }
}
function crateBox(ctx, th, f) {
  ctx.save(); ctx.shadowColor = 'rgba(255,180,60,0.85)'; ctx.shadowBlur = 4 + f * 1.5;
  ctx.fillStyle = '#c8945a'; rr(ctx, 1, 3, TS - 2, TS - 4, 3); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#a8743a'; for (let k = 0; k < 3; k++) ctx.fillRect(1, 6 + k * 8, TS - 2, 3);
  ctx.fillStyle = '#ff8a1a'; ctx.beginPath(); ctx.arc(10, 6, 5, 0, TAU); ctx.arc(20, 5, 5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a8a3a'; ctx.fillRect(9, 0, 2, 3); ctx.fillRect(19, -1, 2, 3);
  ctx.fillStyle = '#ffffff'; ctx.font = `bold 9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('VLC', TS / 2, 24 + Math.sin(f) * 0.5);
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.2; rr(ctx, 1, 3, TS - 2, TS - 4, 3); ctx.stroke();
}
function crateUsed(ctx) { ctx.fillStyle = '#9a8a7a'; rr(ctx, 1, 3, TS - 2, TS - 4, 3); ctx.fill(); ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1.2; ctx.stroke(); }
const base = {
  ground: { style: 'grass', cap: '#c8b8a0', capHi: '#e8dcc8', dirt: '#b8a48a', dirt2: '#8a7a62', rock: '#c8b498' },
  brick: { style: 'brick', c1: '#e8e0d0', c2: '#c8b8a0', mortar: '#8a7a6a' }, hard: { c1: '#c8945a', c2: '#8a6a3a' },
  semi: { style: 'plank', c1: '#2a7a4a', c2: '#1a4a2a' }, pillar: { c1: '#e8dcc4', c2: '#b8a888', cap: '#ffffff', style: 'column' },
  accent: COL.a, qblockArt: crateBox, usedArt: crateUsed, tint: {}, bloom: 0.15, iceStyle: pulp
};
const themes = {
  es_tomatina: Object.assign({}, base, {
    rays: '#fff4d8',
    name: 'La Tomatina', music: 'tour_es', particles: 'confetti',
    sky: ['#2a8ae8', '#8ad0ff', '#fff4e0'], horizonGlow: '#ffe8d0', celestial: { type: 'sun', x: 0.7, y: 0.14, r: 40, color: '#fffbe0', glow: '#ffd890' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'esGrove', color: '#3a8a3a', base: 300, f: 0.05 }, { kind: 'esTown', color: '#f4f0e8', base: 340, f: 0.15 }],
    fog: '#fff0e0', decor: ['esCrates', 'esPots']
  }),
  es_aquarium: Object.assign({}, base, {
    rays: '#c8ffff',
    name: 'The Aquarium', music: 'tour_es_deep', particles: 'bubbles', underwater: true,
    sky: ['#6ae8ff', '#1a8ad8', '#0a3a7a'], horizonGlow: '#aaffff', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'rocks', color: '#1a5a8a', base: 330, amp: 50, f: 0.08 }, { kind: 'kelp', color: '#0e6a6a', base: 360, f: 0.2 }],
    fog: '#8af0ff', ground: { style: 'coral', cap: '#ff9a7a', capHi: '#ffd0b0', dirt: '#3a5a7a', dirt2: '#1a3048', rock: '#4a6a8a' },
    hard: { c1: '#a8e8ff', c2: '#5ab8e8' }
  }),
  es_arts: Object.assign({}, base, {
    name: 'City of Arts', music: 'tour_es_night', particles: 'motes', liquid: 'pool',
    sky: ['#0a0e2a', '#1a2a5a', '#3a4a8a'], horizonGlow: '#5aa8ff', celestial: { type: 'moon', x: 0.8, y: 0.14, r: 22, color: '#f8f8ff', glow: '#a0c8ff' }, stars: 1,
    layers: [{ kind: 'esArts', color: '#e8f0f8', base: 330, f: 0.08 }],
    fog: '#5aa8ff', darkness: 0.35, ground: { style: 'marble', cap: '#f0f4f8', capHi: '#ffffff', dirt: '#c8d0d8', dirt2: '#98a0a8', rock: '#d8e0e8' },
    semi: { style: 'plank', c1: '#f0f4f8', c2: '#a8b0b8' }
  }),
  es_fallas: Object.assign({}, base, {
    rays: '#fff0e0',
    name: 'Las Fallas', music: 'tour_es', particles: 'confetti',
    sky: ['#3a6ad8', '#9ac8ff', '#fff0e8'], horizonGlow: '#ffe0d0', celestial: { type: 'sun', x: 0.3, y: 0.12, r: 34, color: '#fffbe8', glow: '#ffe0b0' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'esTown', color: '#f0e8dc', base: 330, f: 0.04 }, { kind: 'esFallas', color: '#e8dcc8', base: 360, f: 0.12 }],
    fog: '#fff0e8', hard: { c1: '#ff8aa8', c2: '#c85a7a' }, semi: { style: 'plank', c1: '#ffd23a', c2: '#c8901a' }
  }),
  es_lonja: Object.assign({}, base, {
    name: 'The Silk Exchange', music: 'tour_es_night', particles: 'motes',
    sky: ['#2a1e1a', '#4a3a2a', '#6a5038'], horizonGlow: '#ffc890', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'esHall', color: '#5a4a38', base: 360, f: 0.08 }],
    fog: '#ffd8a0', ground: { style: 'marble', cap: '#d8c8a8', capHi: '#f0e4c8', dirt: '#b8a888', dirt2: '#8a7a62', rock: '#c8b898' },
    hard: { c1: '#c8b898', c2: '#8a7a62' }, pillar: { c1: '#d8c8a8', c2: '#a89878', cap: '#f0e4c8', style: 'column' }
  })
};

/* ---------------- decor ---------------- */
const decor = {
  esCrates(ctx, x, y) { for (const [dx, dy] of [[-10, 0], [6, 0], [-2, -12]]) { ctx.fillStyle = '#c8945a'; ctx.fillRect(x + dx - 7, y + dy - 12, 14, 12); ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.arc(x + dx - 2, y + dy - 12, 3, 0, TAU); ctx.arc(x + dx + 3, y + dy - 12, 3, 0, TAU); ctx.fill(); } },
  esPots(ctx, x, y) { ctx.fillStyle = '#c8603a'; ctx.fillRect(x - 6, y - 10, 12, 10); ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.arc(x - 3, y - 13, 3, 0, TAU); ctx.arc(x + 3, y - 14, 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a8a3a'; ctx.fillRect(x - 5, y - 11, 10, 2); },
  // a tomato truck parked at the kerb (it lobs tomatoes: see esTruck)
  esTruckBody(ctx, x, y) {
    ctx.fillStyle = '#2a6ad8'; rr(ctx, x - 40, y - 46, 50, 34, 4); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 34, y - 40, 16, 10);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x + 10, y - 40, 54, 28);
    ctx.fillStyle = '#e8322a'; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(x + 14 + (k % 5) * 11, y - 42 - Math.floor(k / 5) * 6, 6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#1a1a22'; for (const wx of [x - 24, x + 22, x + 50]) { ctx.beginPath(); ctx.arc(wx, y - 8, 8, 0, TAU); ctx.fill(); }
  },
  esBalcony(ctx, x, y, t, th, d) { ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 1.5; ctx.strokeRect(x - d.w / 2, y - d.h - 14, d.w, 14); for (let k = 0; k < d.w / 6; k++) { ctx.beginPath(); ctx.moveTo(x - d.w / 2 + k * 6, y - d.h - 14); ctx.lineTo(x - d.w / 2 + k * 6, y - d.h); ctx.stroke(); } ctx.fillStyle = '#e8322a'; for (let k = 0; k < d.w / 14; k++) { ctx.beginPath(); ctx.arc(x - d.w / 2 + 7 + k * 14, y - d.h - 16, 3.5, 0, TAU); ctx.fill(); } },
  // a white rib arch (City of Arts)
  esRib(ctx, x, y, t, th, d) { ctx.strokeStyle = 'rgba(240,248,255,0.95)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - d.w / 2, y); ctx.quadraticCurveTo(x, y - d.h * 2, x + d.w / 2, y); ctx.stroke(); ctx.strokeStyle = 'rgba(120,200,255,0.4)'; ctx.lineWidth = 2; ctx.stroke(); },
  esTank(ctx, x, y, t, th, d) {
    ctx.fillStyle = 'rgba(160,230,255,0.25)'; ctx.fillRect(x - d.w / 2, y - d.h, d.w, d.h); ctx.strokeStyle = 'rgba(220,250,255,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(x - d.w / 2, y - d.h, d.w, d.h);
    for (let k = 0; k < 4; k++) { const fx = x - d.w / 2 + ((t * 30 + k * 40) % d.w); ctx.fillStyle = FALLA[k]; ctx.beginPath(); ctx.ellipse(fx, y - d.h * (0.3 + k * 0.15), 6, 3, 0, 0, TAU); ctx.fill(); }
  },
  // a giant papier-mâché fruit (its body is solid)
  esNinot(ctx, x, y, t, th, d) {
    const kind = d.seed % 3;
    if (kind === 0) { ctx.fillStyle = '#ff8a1a'; ctx.beginPath(); ctx.arc(x, y - d.h / 2, d.w / 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a8a3a'; ctx.beginPath(); ctx.ellipse(x + 6, y - d.h - 2, 10, 4, 0.4, 0, TAU); ctx.fill(); }
    else if (kind === 1) { ctx.fillStyle = '#e8b81a'; ctx.beginPath(); ctx.ellipse(x, y - d.h / 2, d.w / 2, d.h / 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8322a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x - 10 + k * 7, y - d.h / 2 - 4 + (k % 2) * 6, 3, 0, TAU); ctx.fill(); } }
    else { ctx.fillStyle = '#3ac8ff'; rr(ctx, x - d.w / 2, y - d.h, d.w, d.h, 8); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - d.w / 2 + 6, y - d.h + 6, d.w - 12, 6); }
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x - 7, y - d.h * 0.6, 5, 0, TAU); ctx.arc(x + 7, y - d.h * 0.6, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(x - 6, y - d.h * 0.6, 2.2, 0, TAU); ctx.arc(x + 8, y - d.h * 0.6, 2.2, 0, TAU); ctx.fill();
  },
  esLamp(ctx, x, y, t) { ctx.fillStyle = '#1a1a22'; ctx.fillRect(x - 2, y - 64, 4, 64); ctx.fillStyle = `rgba(255,${220 + Math.sin(t * 3 + x) * 20},150,0.95)`; ctx.beginPath(); ctx.arc(x, y - 68, 6, 0, TAU); ctx.fill(); }
};
const decorLights = { esLamp: [120, '#ffe0a0', -68] };
// light-up floor tiles that switch on the beat
const beatArt = {
  esLight(ctx, k, on, warn, t) {
    if (on) { ctx.fillStyle = ['#5ad8ff', '#ff5aa8'][k.grp % 2]; ctx.fillRect(1, 0, 30, 10); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(3, 2, 26, 2); }
    else { ctx.globalAlpha = warn ? 0.7 : 0.3; ctx.strokeStyle = '#a8e8ff'; ctx.strokeRect(1.5, 0.5, 29, 8); ctx.globalAlpha = 1; }
  }
};

/* ---------------- enemies ---------------- */
const tomatoArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); if (m === 'flat') ctx.scale(1.3, 0.4);
  ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.ellipse(0, -11, 12, 10, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a8a3a'; for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(0, -20); ctx.rotate(k * TAU / 5); ctx.fillRect(-1, -6, 2.5, 6); ctx.restore(); }
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-5, -14, 3, 2, -0.4, 0, TAU); ctx.fill();
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, e.dir * 3, -12, e.dir, 3.2, 2.2, true);
  ctx.restore();
};
const orangeArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y - 10); if (m === 'roll' || m === 'curl') ctx.rotate(e.t * 12 * e.dir);
  ctx.fillStyle = '#ff8a1a'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.arc(-3, -3, 3, 0, TAU); ctx.fill();
  if (m !== 'roll' && m !== 'curl' && m !== 'flat' && m !== 'ko') { K.eyes(ctx, e.dir * 3, 0, e.dir, 3, 2, true); ctx.fillStyle = '#2a8a3a'; ctx.beginPath(); ctx.ellipse(2, -11, 4, 2, 0.4, 0, TAU); ctx.fill(); }
  ctx.restore();
};
const horchataArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  if (m !== 'flat' && m !== 'ko') K.feet(ctx, 0, 0, e.t, '#8a7a6a', 4, 5, m === 'stun');
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.moveTo(-8, -28); ctx.lineTo(8, -28); ctx.lineTo(6, -4); ctx.lineTo(-6, -4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4ead0'; ctx.fillRect(-7, -22, 14, 17);
  ctx.strokeStyle = '#e8322a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(2, -28); ctx.lineTo(6, -38); ctx.stroke();
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 0, -16, 1, 3, 2, true);
  ctx.restore();
};
const batArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); const f = Math.sin(e.t * 14);
  ctx.fillStyle = '#2a2a3a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 18, -6 - f * 8); ctx.lineTo(s * 14, 2); ctx.lineTo(s * 8, 0); ctx.closePath(); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(0, 0, 6, 7, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-4, -5); ctx.lineTo(-3, -11); ctx.lineTo(-1, -6); ctx.moveTo(4, -5); ctx.lineTo(3, -11); ctx.lineTo(1, -6); ctx.fill();
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(-2, -2, 1.4, 0, TAU); ctx.arc(2, -2, 1.4, 0, TAU); ctx.fill();
  ctx.restore();
};
const jellyArt = (ctx, e, x, y) => {
  ctx.save(); ctx.translate(x, y); const p = Math.sin(e.t * 4);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,120,200,0.25)'; ctx.beginPath(); ctx.arc(0, -2, 16, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = 'rgba(255,150,220,0.85)'; ctx.beginPath(); ctx.ellipse(0, -4, 11 + p * 1.5, 9 - p, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(-11 - p * 1.5, -4, 22 + p * 3, 3);
  ctx.strokeStyle = 'rgba(255,170,230,0.8)'; ctx.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 4, -1); ctx.quadraticCurveTo(k * 4 + Math.sin(e.t * 5 + k) * 4, 8, k * 4, 16 + p * 2); ctx.stroke(); }
  ctx.restore();
};
const sharkArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); if (m === 'ko') ctx.scale(1, -1);
  ctx.fillStyle = '#6a8aa8'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 8, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-30, -9); ctx.lineTo(-28, 0); ctx.lineTo(-30, 8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, -7); ctx.lineTo(2, -18); ctx.lineTo(8, -7); ctx.fill();
  ctx.fillStyle = '#e8f0f8'; ctx.beginPath(); ctx.ellipse(4, 3, 14, 4, 0, 0, Math.PI); ctx.fill();
  K.eyes(ctx, 14, -2, 1, 2, 1.6, true);
  ctx.restore();
};
const petardoArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); if (m === 'flat') ctx.scale(1.3, 0.4);
  ctx.fillStyle = '#e8322a'; rr(ctx, -6, -26, 12, 26, 3); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(-6, -18, 12, 3); ctx.fillRect(-6, -9, 12, 3);
  ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -26); ctx.quadraticCurveTo(4, -31, 2, -35); ctx.stroke();
  if (m === 'charge' || m === 'notice') { ctx.fillStyle = Math.floor(e.t * 20) % 2 ? '#ffd23a' : '#ff6a1a'; ctx.beginPath(); ctx.arc(2, -36, 3, 0, TAU); ctx.fill(); }
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 0, -14, e.dir, 2.6, 1.8, true);
  ctx.restore();
};
// jellyfish bob up and down in place
const JELLY = { w: 22, h: 20, speed: 0.3, range: 1, chase: false, art: jellyArt };
class EsJelly extends TourSwimmer {
  constructor(g, s) { super(g, s, JELLY); this.hy = this.y; this.ph = Math.random() * TAU; }
  update(dt) { this.t += dt; if (this.knocked) return this.updateKnocked(dt); if (this.stunT > 0) { this.stunT -= dt; return; } this.y = this.hy + Math.sin(this.t * 1.4 + this.ph) * (this.s.amp || 2.5) * TS; }
}
// a static cfg so 30_tour_sprites.js names its pre-rendered art ('jelly/swim', 'jelly_ko_000'); jellyArt stays the fallback
EsJelly.cfg = JELLY;
const tomatoBall = (ctx, s, t) => { ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.arc(s.cx, s.cy, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a8a3a'; ctx.fillRect(s.cx - 1, s.cy - 8, 2, 3); };
const enemies = {
  esTomato: { cls: TourEnemy.make({ w: 22, h: 24, speed: 1.0, behavior: 'hop', hopV: 10, hopEvery: 1.2, art: tomatoArt, burst: '#e8322a' }), place: 'walk' },
  esOrange: { cls: TourEnemy.make({ w: 20, h: 20, speed: 0.9, behavior: 'roll', range: 9, rollSpeed: 6.5, art: orangeArt, burst: '#ff8a1a' }), place: 'walk' },
  esHorchata: { cls: TourEnemy.make({ w: 18, h: 30, speed: 1.2, behavior: 'walk', art: horchataArt, burst: '#f4ead0' }), place: 'walk' },
  esBat: { cls: TourFlyer.make({ w: 30, h: 14, range: 4, speed: 1.1, swoop: true, art: batArt, burst: '#2a2a3a' }), place: 'fly' },
  esJelly: { cls: EsJelly, place: 'swim' },
  esShark: { cls: TourSwimmer.make({ w: 44, h: 16, speed: 1.8, range: 5, art: sharkArt }), place: 'swim' },
  esPetardo: { cls: TourEnemy.make({ w: 14, h: 26, speed: 0.8, behavior: 'charge', range: 6, chargeSpeed: 6, windup: 0.6, art: petardoArt, burst: '#ffd23a', onNotice: e => K.say(e.g, e, 'TSSS...', '#ffd23a') }), place: 'walk' }
};

/* ---------------- entities ---------------- */
// a tomato truck lobs tomatoes over the street
class EsTruck extends Ent {
  constructor(g, s) { super(g, s, 20, 20); this.cool = 1; this.every = s.period || 1.6; }
  update(dt) {
    this.t += dt; this.cool -= dt;
    if (this.cool <= 0 && this.g.onScreen(this)) { this.cool = this.every; const p = this.g.player; const dx = p ? clamp((p.cx - this.cx) / TS, -9, 9) : -4;
      tourFire(this.g, this.cx, this.y - 30, { kind: 'tomato', vx: dx * 0.62 * TS + (Math.random() - 0.5) * TS, vy: -9 * TS, grav: PHYS.gDown * 0.45, w: 12, h: 12, life: 3.5, thru: true, stompable: true, col: '#e8322a', art: tomatoBall }); }
  }
  draw(ctx) { Decor.esTruckBody(ctx, this.cx, this.y + this.h); }
}
// a string of firecrackers along a ledge: it pops in a wave (don't stand on it then!)
class EsCrackers extends Ent {
  constructor(g, s) { super(g, s, (s.len || 5) * TS, 12); this.x = s.x - TS / 2; this.y = s.y - 12; this.n = s.len || 5; this.ph = s.phase || 0; }
  get popping() { const c = (this.t + this.ph) % 3.2; return c > 2.2 ? Math.floor((c - 2.2) / 1 * this.n) : -1; }
  update(dt) { this.t += dt; const k = this.popping; if (k >= 0 && k !== this.last) { this.last = k; if (this.g.onScreen(this)) Sound.play('kick', { pitch: 2, vol: 0.25 }); this.g.burst(this.x + k * TS + 16, this.y, 6, FALLA[k % 6], 'spark'); } if (k < 0) this.last = -1; }
  touchPlayer(p) { const k = this.popping; if (k >= 0 && Math.abs(p.cx - (this.x + k * TS + 16)) < TS) p.hurt(this); }
  draw(ctx) {
    const k = this.popping, warn = ((this.t + this.ph) % 3.2) > 1.7;
    ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(this.x, this.y + 4); ctx.lineTo(this.x + this.w, this.y + 4); ctx.stroke();
    for (let i = 0; i < this.n; i++) { const cx = this.x + i * TS + 16; if (i === k) { ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.arc(cx, this.y + 2, 10, 0, TAU); ctx.fill(); continue; } ctx.fillStyle = warn && Math.floor(this.t * 12) % 2 ? '#ffd23a' : '#e8322a'; ctx.fillRect(cx - 3, this.y + 4, 6, 9); }
  }
}
// the boss arena's ammunition: tomatoes are world objects Brady kicks (or stomps to launch) into the pan
const ES_TOMATO_CFG = {
  w: 18, h: 18, kick: 8, bounce: 0.35, friction: 4, roll: true, hp: 1, breakOnWall: true, life: 16, burst: '#e8322a', tomato: true,
  art(ctx, e, x, y, t) {
    ctx.save(); ctx.translate(x, y - 9);
    ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.ellipse(0, 0, 9.5, 8.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a8a3a'; for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(0, -7); ctx.rotate(k * TAU / 5); ctx.fillRect(-1, -4, 2, 4.5); ctx.restore(); }
    ctx.fillStyle = '#ff8a7a'; ctx.beginPath(); ctx.ellipse(-3.5, -3, 2.5, 1.6, -0.4, 0, TAU); ctx.fill();
    ctx.restore();
  },
  onBreak(e) { K.sfx('splat', null, { vol: 0.5, pitch: 1.3 }); }
};
const EsTomato = TourProp.make(ES_TOMATO_CFG);
// a tomato crate: it spills a tomato now and then (it wobbles first), two when stomped; in phase 2 the crates hop
// around the hall on the light-up floor tiles
class EsCrate extends Ent {
  constructor(g, s) { super(g, s, 36, 30); this.slot = s.slot || 0; this.every = 2.8; this.cool = 1.6 + this.slot * 0.9; this.wob = 0; this.hop = false; this.hopT = 2 + this.slot; this.squash = 0; this.lit = 0; }
  count() { return this.g.entities.filter(e => e.prop && e.cfg.tomato && !e.remove).length; }
  spill(n, vx) {
    for (let k = 0; k < n; k++) { const t = new EsTomato(this.g, { x: this.cx, y: this.y + 8 }); t.fling((vx != null ? vx : (Math.random() - 0.5) * 4 * TS) + (k - (n - 1) / 2) * 1.6 * TS, -(6.5 + Math.random() * 2) * TS, null); this.g.spawn(t); }
    Sound.play('kick', { vol: 0.4, pitch: 1.3 }); this.g.burst(this.cx, this.y, 6, '#e8322a', 'confetti'); this.squash = 1;
  }
  update(dt) {
    this.t += dt; const g = this.g, b = g.boss;
    this.squash = approach(this.squash, 0, dt * 4); if (this.lit > 0) this.lit -= dt;
    const fighting = b && b.state === 'fight';
    if (fighting) {
      this.cool -= dt; this.wob = this.cool < 0.6 ? 1 : 0;
      if (this.cool <= 0) { this.cool = this.every; if (this.count() < 4) this.spill(1); }
      if (this.hop) {
        this.hopT -= dt;
        if (this.hopT <= 0 && this.onGround) {
          this.hopT = 3.2 + Math.random(); const p = g.player;
          const tx = clamp((p ? p.cx : this.cx) + (Math.random() - 0.5) * 12 * TS, b.arenaX0 + 2 * TS, b.arenaX1 - 2 * TS);
          this.vx = (tx - this.cx) * 0.9; this.vy = -10 * TS; this.onGround = false; this.lit = 1; Sound.play('jump', { vol: 0.3, pitch: 0.7 });
        }
      }
    }
    this.vy += PHYS.gDown * dt; if (this.vy > PHYS.maxFall) this.vy = PHYS.maxFall;
    const wasAir = !this.onGround;
    moveBody(this, g.area, dt, { semis: true });
    if (this.onGround) { this.vx = approach(this.vx, 0, 12 * TS * dt); if (wasAir && this.hop) { this.lit = 1; this.squash = 1; g.burst(this.cx, this.y + this.h, 6, '#c8945a', 'dust'); } }
  }
  touchPlayer(p) {
    if (p.dead) return;
    if (p.vy > 0 && p.prevBottom <= this.y + 12) { p.vy = -(p.inp.jump ? PHYS.stompVHeld : PHYS.stompV); p.jumping = true; p.y = Math.min(p.y, this.y - p.h + 2); if (this.count() < 6) this.spill(2, p.facing * 2 * TS); Sound.play('stomp', { vol: 0.5 }); }
  }
  draw(ctx) {
    // the light-up floor tile under a hopping crate (phase 2)
    if (this.hop) { const k = Math.max(0, this.lit), c = ['#5ad8ff', '#ff5aa8', '#ffd23a'][this.slot % 3]; ctx.fillStyle = k > 0 ? c : 'rgba(255,255,255,0.18)'; ctx.fillRect(this.x - 6, this.y + this.h - 3, this.w + 12, 5); if (k > 0) { ctx.fillStyle = `rgba(255,255,255,${0.5 * k})`; ctx.fillRect(this.x - 4, this.y + this.h - 2, this.w + 8, 2); } }
    Ink.ent(ctx, this, c => this.drawArt(c));
  }
  drawArt(ctx) {
    const x = this.cx, y = this.y + this.h, w = Math.sin(this.t * 40) * this.wob * 2;
    ctx.save(); ctx.translate(x + w, y); ctx.scale(1 + this.squash * 0.15, 1 - this.squash * 0.2);
    ctx.fillStyle = '#c8945a'; ctx.fillRect(-18, -26, 36, 26); ctx.fillStyle = '#a8743a'; for (let k = 0; k < 3; k++) ctx.fillRect(-18, -22 + k * 8, 36, 2.5);
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-18, -26, 3, 26); ctx.fillRect(15, -26, 3, 26);
    ctx.fillStyle = '#ffffff'; ctx.font = `bold 8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('VLC', 0, -9);
    ctx.fillStyle = '#e8322a'; for (const [tx, ty] of [[-11, -30], [0, -32], [11, -30]]) { ctx.beginPath(); ctx.arc(tx, ty, 5.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#2a8a3a'; for (const tx of [-11, 0, 11]) ctx.fillRect(tx - 1, -38, 2, 4);
    ctx.restore();
  }
}
// a Las Fallas rocket: it marks its spot on the floor (a flashing ring and a lit fuse), then shoots straight up
class EsRocket extends Ent {
  constructor(g, s) { super(g, s, 18, 44); this.fuse = s.fuse || 1.0; this.state = 'arm'; this.fy = s.y; }
  update(dt) {
    this.t += dt;
    if (this.state === 'arm') { this.fuse -= dt; if (this.fuse <= 0) { this.state = 'fly'; this.vy = -13 * TS; K.sfx('firework_launch', 'fire', { vol: 0.5 }); this.g.shake(2); } return; }
    this.vy -= 6 * TS * dt; this.y += this.vy * dt;
    if (this.y < this.fy - 10 * TS) { this.remove = true; K.sfx('firework_burst', 'pick', { vol: 0.5, pitch: 0.7 }); this.g.burst(this.cx, this.y, 26, FALLA[Math.floor(Math.random() * 6)], 'firework'); }
  }
  touchPlayer(p) { if (this.state === 'fly') p.hurt(this); }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t;
    if (this.state === 'arm') {
      const k = Math.max(0, this.fuse), on = Math.floor(t * (k < 0.4 ? 24 : 10)) % 2 === 0;
      ctx.strokeStyle = on ? '#ff5a3a' : '#ffd23a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y - 2, 22, 7, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', x, y - 52 + Math.sin(t * 12) * 2);
      for (let q = 0; q < 3; q++) { ctx.fillStyle = q ? '#ffd23a' : '#ffffff'; ctx.beginPath(); ctx.arc(x + 6 + Math.sin(t * 30 + q) * 4, y - 28 - q * 3 - Math.random() * 4, 1.5 + q * 0.5, 0, TAU); ctx.fill(); }
    } else {
      for (let q = 0; q < 5; q++) { ctx.fillStyle = q % 2 ? '#ffd23a' : '#ff8a2a'; ctx.beginPath(); ctx.arc(x + Math.sin(t * 40 + q) * 3, y + 4 + q * 7, 5 - q * 0.7, 0, TAU); ctx.fill(); }
    }
    Ink.ent(ctx, this, c => { c.fillStyle = '#5a4a3a'; c.fillRect(x - 1, y - 28, 2, 28); c.fillStyle = '#e8322a'; rr(c, x - 6, y - 44, 12, 22, 3); c.fill(); c.fillStyle = '#ffd23a'; c.fillRect(x - 6, y - 38, 12, 3); c.fillRect(x - 6, y - 30, 12, 3); c.fillStyle = '#3ac8ff'; c.beginPath(); c.moveTo(x - 6, y - 44); c.lineTo(x, y - 54); c.lineTo(x + 6, y - 44); c.fill(); });
  }
}
const entities = { esTruck: EsTruck, esCrackers: EsCrackers, esTomatoProp: EsTomato, esCrate: EsCrate, esRocket: EsRocket };

/* ---------------- the signature power-up: TOMATO FIGHT ---------------- */
// lob tomatoes: a direct hit knocks an enemy out; a splat leaves a slippery puddle that sends enemies sliding
function tomatoIcon(ctx, x, y, t) { ctx.save(); ctx.translate(x, y + 1); ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a8a3a'; for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(0, -7); ctx.rotate(k * TAU / 5 + t); ctx.fillRect(-1, -4, 2, 4); ctx.restore(); } ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(-3, -3, 2.5, 1.6, -0.4, 0, TAU); ctx.fill(); ctx.restore(); }
class EsPuddle extends Ent {
  constructor(g, x, y) { super(g, null, 2.4 * TS, 10); this.x = x - this.w / 2; this.y = y - 10; this.life = 5; this.friendly = true; }
  update(dt) {
    this.t += dt; this.life -= dt; if (this.life <= 0) this.remove = true;
    for (const e of this.g.entities) {
      if (!e.enemy || e.dead || e.boss || !(e instanceof TourEnemy) || !overlap(this, e)) continue;
      if (!e.slideT) { e.slideT = 1.4; K.say(this.g, e, 'WHOAAA!', '#ff8a8a'); }
    }
  }
  draw(ctx) { ctx.globalAlpha = Math.min(1, this.life); ctx.fillStyle = '#d8222a'; ctx.beginPath(); ctx.ellipse(this.cx, this.y + 8, this.w / 2, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,220,180,0.6)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(this.x + 8 + k * this.w / 6, this.y + 7, 1.3, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
}
class EsTomatoShot extends Ent {
  constructor(g, x, y, dir) { super(g, null, 14, 14); this.x = x - 7; this.y = y - 7; this.vx = dir * 5.2 * TS; this.vy = -7 * TS; this.friendly = true; this.life = 3; }
  update(dt) {
    this.t += dt; this.life -= dt; this.vy += PHYS.gDown * 0.6 * dt;
    moveBody(this, this.g.area, dt, { semis: true });
    const g = this.g;
    for (const e of g.entities) { if (!e.enemy || e.dead || e.remove || !overlap(this, e)) continue; if (e.boss) { if (e.state === 'fight' && !e.hit('tomato', this)) e.hit('disc', this); } else if (e.hit('tomato', this)) g.addScore(200, e.cx, e.y); return this.splat(false); }
    if (this.onGround) return this.splat(true);
    if (this.hitWall || this.life <= 0) return this.splat(false);
  }
  splat(puddle) {
    if (this.remove) return; this.remove = true;
    this.g.burst(this.cx, this.cy, 12, '#e8322a', 'confetti'); Sound.play('splash', { pitch: 1.5, vol: 0.35 });
    if (puddle && this.g.entities.filter(e => e instanceof EsPuddle).length < 3) this.g.spawn(new EsPuddle(this.g, this.cx, this.y + this.h));
  }
  draw(ctx) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(this.t * 8); tomatoIcon(ctx, 0, 0, 0); ctx.restore(); }
}
const power = {
  id: 'tomato', name: 'TOMATO FIGHT', country: 'es', hint: 'PRESS ACTION TO LOB TOMATOES · SPLATS MAKE ENEMIES SLIDE', time: 0, cooldown: 0.3,
  icon: tomatoIcon,
  action(p, g) { g.spawn(new EsTomatoShot(g, p.cx + p.facing * 12, p.y + 8, p.facing)); Sound.play('throw'); return true; },
  drawOn(p, ctx, t) { tomatoIcon(ctx, p.cx - p.facing * 10, p.y + (p.small ? 14 : 22), 0); }
};

/* ---------------- set pieces ---------------- */
const P = {
  /* 6-1: La Tomatina */
  // a tomato truck lobs tomatoes over a pulp-slick street
  truck(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 14);
    for (let q = 4; q <= 13; q++) B.set(x + q, st.gy, T.ICE);
    st.spawn('esTruck', x + 2, st.gy - 1, { period: o.period || 1.6 });
    st.coins(x + 5, x + 12, st.gy - 3); st.enemy('esTomato', x + 10, st.gy);
    return x + 15;
  },
  // stacks of tomato crates (solid) to climb
  crates(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 12);
    [[x + 2, 1], [x + 4, 2], [x + 6, 3], [x + 9, 2]].forEach(([cx, h]) => { for (let y = st.gy - h; y < st.gy; y++) { B.set(cx, y, T.HARD); B.set(cx + 1, y, T.HARD); } });
    st.coins(x + 6, x + 7, st.gy - 5);
    if (o.gold) st.gold(x + 7, st.gy - 7, 'high');
    return x + 13;
  },
  // balconies along the street, flower pots and all
  balconies(st) {
    const x = st.x, B = st.B; st.floor(x, x + 13);
    [[x + 1, st.gy - 3], [x + 6, st.gy - 5], [x + 10, st.gy - 3]].forEach(([bx, by]) => { for (let q = 0; q < 3; q++) B.set(bx + q, by, T.SEMI); B.prop('esBalcony', bx, by, 3, 0.01, 'none', {}); st.coins(bx, bx + 2, by - 2); });
    st.enemy('esHorchata', x + 8, st.gy);
    return x + 14;
  },
  // a slick of pulp running into a gap: slide with care
  pulp(st) { const x = st.x, B = st.B; st.floor(x, x + 8); for (let q = 1; q <= 8; q++) B.set(x + q, st.gy, T.ICE); st.pit(x + 9, x + 11); st.arc(x + 8, x + 12, st.gy - 2, 2); st.floor(x + 12, x + 15); st.enemy('esOrange', x + 14, st.gy); return x + 16; },

  /* 6-2: the aquarium (swim) */
  // a glass tunnel: the tank's walls above and below, a passage through the middle
  tunnel(st, o) {
    const x = st.x, F = st.floorY, w = o.w || 12;
    st.rock(x, 2, x + w - 1, 5); st.rock(x, 11, x + w - 1, F - 1);
    // the rock is drawn as glass tanks full of fish (invisible collision under the tank art)
    for (let q = x; q < x + w; q++) { for (let y = 2; y <= 5; y++) st.B.setHide(q, y, 1); for (let y = 11; y < F; y++) st.B.setHide(q, y, 1); }
    st.B.prop('esTank', x, 2, w, 4, 'none', {}); st.B.prop('esTank', x, 11, w, F - 11, 'none', {});
    st.coins(x + 1, x + w - 2, 8);
    st.spawn('esShark', x + Math.floor(w / 2), 8, { range: Math.floor(w / 2) - 1 });
    return x + w + 1;
  },
  // jellyfish pulse up and down in a column
  jellies(st, o) { const x = st.x, n = o.n || 3; for (let k = 0; k < n; k++) st.spawn('esJelly', x + 2 + k * 4, 6 + (k % 2) * 4, { amp: 2.5 }); st.coins(x + 1, x + n * 4, 9); return x + n * 4 + 2; },
  // pump jets push water along
  pumps(st, o) { const x = st.x, w = 12, d = o.dir || 1; st.B.zone(x, 3, w, 7, d * 2.4 * TS, 0, 0, 'current'); st.rock(x + 3, 10, x + 4, st.floorY - 1); st.rock(x + 8, 2, x + 9, 4); st.coins(x + 1, x + w - 2, 6); return x + w + 1; },
  // a hidden alcove behind the tanks
  alcove(st) { const x = st.x, F = st.floorY; st.rock(x, 2, x + 6, F - 4); st.water(x + 2, 5, x + 4, 7); st.water(x + 3, 8, x + 3, F - 4); st.gold(x + 3, 6, 'must'); st.coins(x + 1, x + 5, F - 2); return x + 7; },

  /* 6-3: the City of Arts by night */
  // white ribs arch over a reflecting pool: their crowns are platforms
  ribs(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const n = o.n || 3;
    for (let k = 0; k < n; k++) {
      st.pit(x, x + 3); st.B.fill(x, st.gy + 2, x + 3, st.H - 1, T.LAVA);
      const top = st.gy - 3 - (k % 2) * 2;
      st.semi(x, x + 3, top); st.B.prop('esRib', x, st.gy, 4, st.gy - top, 'none', {});
      st.coins(x, x + 3, top - 2); x += 4;
      if (k < n - 1) { st.floor(x, x); x += 1; }
    }
    st.floor(x, x + 2); return x + 3;
  },
  // light-up floor tiles switch on and off with the beat
  lights(st, o) {
    const x = st.x, B = st.B, n = o.n || 4; st.floor(x, x + 1);
    let xx = x + 2;
    for (let k = 0; k < n; k++) { st.pit(xx, xx + 2); st.B.fill(xx, st.gy + 2, xx + 2, st.H - 1, T.LAVA); B.beat(xx, xx + 2, st.gy - 1 - (k % 2), k % 2, 'esLight'); st.coins(xx, xx + 2, st.gy - 3 - (k % 2)); xx += 3; if (k < n - 1) { st.floor(xx, xx); xx += 1; } }
    st.floor(xx, xx + 2); return xx + 3;
  },
  // the "eyelid": a big white deck that lifts up to the walkway
  eyelid(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 5);
    const rise = 5;
    st.spawn('mplat', x + 1, st.gy - 1, { pw: 4, ax: 0, ay: -rise * TS, speed: 1.3, skin: 'esEyelid' });
    for (let y = st.gy - rise; y <= st.gy; y++) for (let q = 0; q < 4; q++) B.ghosts.push([x + 1 + q, y]);
    st.gy -= rise; st.floor(x + 6, x + 12);
    st.coins(x + 7, x + 11, st.gy - 2); st.decor('esLamp', x + 9);
    if (o.gold) st.gold(x + 10, st.gy - 4, 'high');
    return x + 13;
  },
  bats(st) { const x = st.x; st.floor(x, x + 11); st.enemy('esBat', x + 6, st.gy); st.decor('esLamp', x + 2); st.decor('esLamp', x + 9); st.coins(x + 3, x + 8, st.gy - 3); return x + 12; },
  drop(st) { const x = st.x; st.floor(x, x + 2); st.gy = Math.min(st.GY, st.gy + 5); st.floor(x + 3, x + 8); return x + 9; },

  /* 6-4: the giant falla (a climb) */
  // zigzag ledges of painted papier-mâché with giant fruit to stand on
  falla(st, o) {
    const B = st.B, W = st.W, n = o.n || 4, y0 = st.y;
    for (let k = 0; k < n; k++) {
      const y = y0 - 3 * (k + 1), left = k % 2 === 0, x0 = left ? 2 : W - 11;
      for (let x = x0; x < x0 + 9; x++) B.set(x, y, T.SEMI);
      if (k === 1) B.prop('esNinot', left ? x0 + 6 : x0 + 1, y - 2, 2, 2, 'body', { seed: k });
      st.coins(x0 + 2, x0 + 5, y - 2);
    }
    if (o.petardo) st.enemy('esPetardo', 5, y0 - 3, { edgeTurn: true });
    st.top(y0 - 3 * n - 3);
  },
  // a rocket launcher: stand on it and it fires you up two floors
  rockets(st, o) {
    const B = st.B, W = st.W, y0 = st.y, x = o.left ? 4 : W - 6;
    st.spawn('spring', x, y0 - 1, { skin: 'esRocket' }); B.springs.push([x, y0 - 1]);
    const ly = y0 - 8;
    for (let q = 2; q < W - 2; q++) if (q < x - 1 || q > x + 1) B.set(q, ly, T.SEMI);
    st.coins(x, x, y0 - 4); st.coins(x, x, y0 - 6);
    if (o.gold) st.gold(o.left ? W - 5 : 4, ly - 2, 'high');
    st.top(ly - 3);
  },
  // firecracker strings pop in a wave along the ledges
  crackers(st) {
    const B = st.B, W = st.W, y0 = st.y;
    for (let k = 0; k < 3; k++) {
      const y = y0 - 3 * (k + 1), left = k % 2 === 0, x0 = left ? 2 : 9;
      for (let x = x0; x < x0 + 13; x++) B.set(x, y, T.SEMI);
      st.spawn('esCrackers', x0 + 4, y - 1, { len: 5, phase: k * 1.1 });
      st.coins(x0 + 1, x0 + 3, y - 2);
    }
    st.top(y0 - 12);
  },

  /* 6-5: the silk exchange */
  // twisted columns rise from the cellar floor
  columns(st) { return Tour.pieces.pillars(st, { n: 4 }); },
  // silk banners swing across the hall
  banners(st, o) {
    const B = st.B, n = o.n || 2; let x = st.x;
    st.floor(x, x + 2); x += 3;
    for (let k = 0; k < n; k++) {
      st.pit(x, x + 6);
      const ax = x + 3, ay = st.gy - 6, len = 5, amp = 0.55;
      st.spawn('mplat', ax, ay, { pw: 3, swing: { len: len * TS, amp }, speed: 1.1 + st.d * 0.4, skin: 'esBanner', phase: k * 1.3 });
      for (let a = -10; a <= 10; a++) { const th = a / 10 * amp; const gx = Math.round(ax + Math.sin(th) * len), gy2 = Math.round(ay + 1 + Math.cos(th) * len); for (let q = -1; q <= 1; q++) B.ghosts.push([gx + q, gy2]); }
      st.arc(ax - 2, ax + 2, ay + len - 2, 1);
      x += 7; if (k < n - 1) { st.floor(x, x + 1); x += 2; }
    }
    st.floor(x, x + 2); return x + 3;
  },
  // merchants' scales: two pans rise and fall in turn
  scales(st) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    st.pit(x, x + 8);
    st.spawn('mplat', x, st.gy - 1, { pw: 3, ax: 0, ay: -3 * TS, speed: 1.2, skin: 'esPan' });
    st.spawn('mplat', x + 5, st.gy - 4, { pw: 3, ax: 0, ay: 3 * TS, speed: 1.2, skin: 'esPan' });
    for (let y = st.gy - 4; y <= st.gy; y++) for (let q = 0; q < 3; q++) { st.B.ghosts.push([x + q, y]); st.B.ghosts.push([x + 5 + q, y]); }
    st.coins(x + 1, x + 7, st.gy - 6);
    x += 9; st.floor(x, x + 2); return x + 3;
  },
  // the boss arena: the Silk Exchange's trading hall, twisted columns at the doors, galleries on both sides, lamps,
  // flower pots, and three tomato crates (the ammunition) on the floor
  arena_lonja(st, o) {
    const B = st.B, { x0, w, GY } = o, mid = x0 + Math.floor(w / 2);
    for (let q = 0; q < 4; q++) { B.set(x0 + 3 + q, GY - 4, T.SEMI); B.set(x0 + w - 7 + q, GY - 4, T.SEMI); }
    for (let q = 0; q < 3; q++) B.set(mid - 1 + q, GY - 7, T.SEMI);
    B.fill(x0 + 1, GY - 2, x0 + 1, GY - 1, T.PILLAR); B.fill(x0 + w - 2, GY - 2, x0 + w - 2, GY - 1, T.PILLAR);
    B.decorAt('esLamp', x0 + 4, GY - 4, 0); B.decorAt('esLamp', x0 + w - 5, GY - 4, 0);
    B.decorAt('esPots', x0 + 9, GY, 0); B.decorAt('esPots', x0 + w - 10, GY, 1); B.decorAt('esCrates', mid, GY - 7, 0);
    st.spawn('esCrate', x0 + 4, GY - 1, { slot: 0 }); st.spawn('esCrate', mid, GY - 1, { slot: 1 }); st.spawn('esCrate', x0 + w - 5, GY - 1, { slot: 2 });
    st.gold(x0 + 5, GY - 7, 'high');   // a postcard over the left gallery (the castle script has no other photo spot)
  }
};
const platforms = {
  esEyelid(ctx, p) { const x = p.x, y = p.y, w = p.w; ctx.fillStyle = '#f0f4f8'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.quadraticCurveTo(x + w / 2, y - 10, x + w + 6, y); ctx.lineTo(x + w, y + 12); ctx.lineTo(x, y + 12); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#5ad8ff'; ctx.fillRect(x + 4, y + 8, w - 8, 3); ctx.strokeStyle = '#a8b0b8'; ctx.lineWidth = 1; for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x + k * w / 6, y - 3); ctx.lineTo(x + k * w / 6, y + 12); ctx.stroke(); } },
  esBanner(ctx, p, t) {
    const ax = p.ancX, ay = p.ancY, mx = p.x + p.w / 2;
    ctx.strokeStyle = '#c8a03a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(mx, p.y); ctx.stroke();
    ctx.fillStyle = '#b8222a'; ctx.beginPath(); ctx.moveTo(p.x - 2, p.y); ctx.lineTo(p.x + p.w + 2, p.y); ctx.lineTo(p.x + p.w, p.y + 26); ctx.lineTo(mx, p.y + 20 + Math.sin(t * 4) * 2); ctx.lineTo(p.x, p.y + 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(p.x, p.y, p.w, 5); ctx.beginPath(); ctx.arc(mx, p.y + 12, 4, 0, TAU); ctx.fill();
  },
  esPan(ctx, p) { const x = p.x, y = p.y, w = p.w; ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + w / 2, y - 60); ctx.lineTo(x + w - 4, y); ctx.stroke(); ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 4, w / 2 + 4, 7, 0, 0, Math.PI); ctx.fill(); ctx.fillRect(x - 4, y, w + 8, 4); },
  esRocketSpring(ctx, x, y, comp, t) {
    const h = 30 * (1 - comp * 0.3);
    ctx.fillStyle = '#e8322a'; rr(ctx, x - 9, y - h, 18, h, 4); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 9, y - h + 6, 18, 4); ctx.fillRect(x - 9, y - h + 16, 18, 4);
    ctx.fillStyle = '#3ac8ff'; ctx.beginPath(); ctx.moveTo(x - 9, y - h); ctx.lineTo(x, y - h - 12); ctx.lineTo(x + 9, y - h); ctx.fill();
    ctx.fillStyle = `rgba(255,${150 + Math.sin(t * 30) * 60},40,0.9)`; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x, y + 6 + Math.sin(t * 40) * 3); ctx.lineTo(x + 6, y); ctx.fill();
  }
};

/* ---------------- the boss: PAELLASAURUS ---------------- */
// A giant paella pan that grew mussel-shell legs. It boils on three flames, charges, spits rice and
// (later) calls Las Fallas rockets up through the floor. Too hot to stomp: TOMATO ARTILLERY. The crates
// around the hall spill tomatoes; kick (or stomp-launch) three into the pan in a row and the fire goes
// out: cold, blue and sluggish, one stomp cracks the crust. In phase 3 it flips the pan and the whole
// floor becomes sliding tomato pulp.
const riceArt = (ctx, s) => { ctx.fillStyle = '#ffe070'; ctx.beginPath(); ctx.ellipse(s.cx, s.cy, 4, 2.5, s.t * 6, 0, TAU); ctx.fill(); };
const paellaBits = [
  (ctx, s) => { ctx.fillStyle = '#ffe070'; ctx.beginPath(); ctx.ellipse(s.cx, s.cy, 4, 2.5, s.t * 6, 0, TAU); ctx.fill(); },
  (ctx, s) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(s.t * 5); ctx.fillStyle = '#ff7a5a'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0.5, 0, TAU); ctx.fill(); ctx.restore(); },
  (ctx, s) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(s.t * 4); ctx.fillStyle = '#2a2a3a'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 3.5, -0.3, 0, TAU); ctx.fill(); ctx.restore(); },
  (ctx, s) => { ctx.fillStyle = '#ffe85a'; ctx.beginPath(); ctx.ellipse(s.cx, s.cy, 6, 3, 0.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff8c0'; ctx.fillRect(s.cx - 4, s.cy - 1, 8, 1.5); }
];
const boss = {
  id: 'es_paella', name: 'Paellasaurus', hp: 4, dims: [96, 44], music: 'tour_es_boss', country: 'es',
  brain: {
    guardText: 'TOO HOT!',
    phases: [3, 2],
    wake(b) { b.heat = 3; b.splats = []; b.coolT = 0; b.shiver = 0; K.say(b.g, b, 'YOU ARE NOT ON THE MENU... YET!', '#ffd84a'); b.g.toast('TOO HOT TO STOMP! KICK THREE TOMATOES INTO THE PAN'); },
    noDisc(b) { return b.act === 'flip' || b.act === 'clatter'; },
    hit(b, kind, src) {
      if (kind === 'stomp' || kind === 'spin') { if (b.vuln) { b.damage(1, { text: 'CRUST CRACKED!', col: '#ffe070' }); return true; } return 'bounce'; }
      // only tomatoes Brady kicked, stomp-launched or lobbed count: a crate's own spill bouncing off the pan does nothing
      if (kind === 'tomato' || (kind === 'prop' && src && src.cfg && src.cfg.tomato)) { if (kind === 'prop' && src.thrownBy !== b.g.player) return false; this.splat(b); return true; }
      if (kind === 'prop' || kind === 'bump') return false;
      return undefined;
    },
    // a tomato lands in the pan: one flame out, a red splat on the rice; three in a row and the fire is out
    splat(b) {
      const g = b.g;
      if (b.heat <= 0 || b.act === 'cold' || b.act === 'relight' || b.act === 'clatter') { g.parts.text(b.cx, b.y - 20, 'SPLAT', '#ff8a8a'); g.burst(b.cx, b.y, 10, '#e8322a', 'confetti'); return; }
      b.heat--; b.coolT = 5.5; b.splats.push({ x: (Math.random() - 0.5) * 70, y: -27 - Math.random() * 7, t: 0 }); if (b.splats.length > 6) b.splats.shift();
      g.burst(b.cx, b.y, 16, '#e8322a', 'confetti'); K.sfx('splat', null, { vol: 0.6, pitch: 1.2 }); g.shake(2);
      if (b.heat <= 0) b.go('cold');
      else { g.parts.text(b.cx, b.y - 22, b.heat === 1 ? 'ONE MORE!' : 'TWO MORE!', '#ffe070'); K.say(g, b, pick(['SSSSS!', 'NOT THE TOMATOES!', 'MY FLAME!']), '#ffd8a0'); }
    },
    update(b, dt) {
      const g = b.g, p = g.player, ph = b.phase || 1;
      b.guard = 'bounce';
      for (const s of b.splats) s.t += dt;
      // the fire comes back if the tomatoes stop coming
      if (b.coolT > 0 && b.act !== 'cold' && b.act !== 'relight') { b.coolT -= dt; if (b.coolT <= 0 && b.heat < 3) { b.heat = 3; b.splats = []; K.say(g, b, 'SIZZLE! BACK TO THE BOIL!', '#ff8a2a'); g.burst(b.cx, b.y + b.h - 8, 14, '#ff8a2a', 'spark'); } }
      if (b.act === 'clatter') {
        // the finish: the pan clatters over and the paella rains down (harmless, delicious)
        b.vx = 0; b.pose = 'flip';
        if (Math.floor(b.at * 24) !== Math.floor((b.at - dt) * 24) && b.at < 2.4) for (let q = 0; q < 2; q++) { const s = tourFire(g, b.cx + (Math.random() - 0.5) * 80, b.y - 10, { kind: 'paella', vx: (Math.random() - 0.5) * 9 * TS, vy: -(10 + Math.random() * 8) * TS, grav: PHYS.gDown * 0.6, w: 12, h: 10, life: 3, thru: true, col: '#ffe070', art: pick(paellaBits) }); s.enemy = false; s.friendly = true; }
        if (Math.floor(b.at * 2) !== Math.floor((b.at - dt) * 2)) g.parts.text(b.cx + (Math.random() - 0.5) * 60, b.y - 30, pick(['¡AY!', 'MY SOCARRAT!', 'ARROZ EVERYWHERE!']), '#ffd84a');
        if (b.at > 2.8) b.die();
        b.fall(dt); return;
      }
      if (b.act === 'walk') { b.face(); b.walk(ph >= 3 ? 1.6 : 1.1); b.pose = 'walk'; if (b.at > 1.3) { b.cycle++; const moves = ph >= 3 ? ['charge', 'rice', 'skate', 'rockets'] : ph >= 2 ? ['charge', 'rice', 'rockets'] : ['charge', 'rice']; b.go(moves[b.cycle % moves.length]); } }
      else if (b.act === 'charge') {
        // tell: the legs stamp on the spot, ¡OLÉ!, then the pan bolts to the far wall
        if (b.at < 0.7) { b.vx = 0; b.pose = 'stamp'; if (b.first) { b.face(); K.say(g, b, '¡OLÉ!', '#ffd84a'); } }
        else { b.walk(6.5); b.pose = 'charge'; if ((b.dir < 0 && (b.hitWall || b.x <= b.arenaX0 + 1)) || (b.dir > 0 && (b.hitWall || b.x >= b.arenaX1 - b.w - 1))) { g.shake(6); Sound.play('bump'); b.go('skid'); } }
        if (b.at > 3) b.go('walk');
      }
      else if (b.act === 'skid') { b.vx = approach(b.vx, 0, 20 * TS * dt); b.pose = 'skid'; if (b.at > 0.5) b.go('walk'); }
      else if (b.act === 'rice') {
        b.vx = 0; b.pose = 'hot';
        if (b.first) { K.say(g, b, '¡ARROZ!', '#ffe070'); b.lastSpray = -1; }
        if (b.at > 0.6 && Math.floor(b.at * 2.5) !== b.lastSpray) { b.lastSpray = Math.floor(b.at * 2.5); for (let k = 0; k < 3; k++) tourFire(g, b.cx + (k - 1) * 20, b.y, { kind: 'rice', vx: (k - 1) * 2.6 * TS + (Math.random() - 0.5) * TS, vy: -8 * TS, grav: PHYS.gDown * 0.4, w: 8, h: 8, life: 3, thru: true, col: '#f4e8a0', art: riceArt }); Sound.play('throw', { vol: 0.3, pitch: 1.5 }); }
        if (b.at > 2.6) b.go('walk');
      }
      else if (b.act === 'rockets') {
        // tell: the pan stamps, shouts, and three spots on the floor light up before the rockets fire
        b.vx = 0; b.pose = 'stamp';
        if (b.first) { K.say(g, b, '¡MASCLETÀ!', '#ff5a8a'); const cx = p ? p.cx : b.cx; for (let k = -1; k <= 1; k++) { const x = clamp(cx + k * 4 * TS, b.arenaX0 + TS, b.arenaX1 - TS); g.spawn(new EsRocket(g, { x, y: b.floorY, fuse: 1.0 + Math.abs(k) * 0.25 })); } Sound.play('crumble', { vol: 0.4 }); }
        if (b.at > 1.3) b.go('walk');
      }
      else if (b.act === 'skate') {
        // phase 3: tell, then it skates across the pulp, three lengths of the hall
        if (b.first) { b.face(); b.turns = 0; K.say(g, b, '¡VAMOS!', '#ffd84a'); }
        b.pose = b.at < 0.5 ? 'stamp' : 'skate';
        if (b.at > 0.5) { b.vx = b.dir * 8 * TS; if ((b.dir < 0 && (b.hitWall || b.x <= b.arenaX0 + 2)) || (b.dir > 0 && (b.hitWall || b.x >= b.arenaX1 - b.w - 2))) { b.dir = -b.dir; b.x += b.dir * 4; g.shake(4); Sound.play('bump'); b.turns++; } }
        if (b.turns >= 3 || b.at > 5) b.go('walk');
      }
      else if (b.act === 'flip') {
        // phase 3 opener: it flips the pan and the pulp floods the hall floor
        b.vx = 0; b.pose = 'flip';
        if (b.first) { K.say(g, b, 'ENOUGH! FLIP IT!', '#ffd84a'); g.shake(4); }
        if (b.at > 1.0 && !b.flooded) {
          b.flooded = true; const row = Math.floor(b.floorY / TS), tx0 = Math.floor(b.arenaX0 / TS), tx1 = Math.floor(b.arenaX1 / TS) - 1;
          for (let tx = tx0; tx <= tx1; tx++) if (tileAt(g.area, tx, row) === T.GROUND) g.setTile(tx, row, T.ICE);
          g.bannerText = 'TOMATO PULP EVERYWHERE!'; g.bannerT = 2.4; g.shake(8); K.sfx('splat', null, { vol: 0.8, pitch: 0.6 }); for (let k = 0; k < 10; k++) g.burst(b.arenaX0 + Math.random() * (b.arenaX1 - b.arenaX0), b.floorY, 8, '#e8322a', 'confetti');
        }
        if (b.at > 1.8) b.go('walk');
      }
      else if (b.act === 'cold') {
        // the weak moment: fire out, the pan goes blue and shivers, and the crust can be cracked
        b.vx = approach(b.vx, 0, 8 * TS * dt); b.pose = 'cold'; b.vuln = true; b.guard = 'hurt'; b.shiver = 1;
        if (b.first) { K.say(g, b, 'BRRR... MY FIRE...', '#8ad8ff'); g.toast('THE FIRE IS OUT! STOMP THE PAN!'); K.sfx('flame', null, { vol: 0.4, pitch: 0.5 }); g.burst(b.cx, b.y - 10, 18, '#8ad8ff', 'spark'); }
        if (b.at > (ph >= 3 ? 4 : 5)) b.go('relight');
      }
      else if (b.act === 'relight') {
        // tell: sparks under the pan, then the flames whoosh back
        b.vx = 0; b.pose = 'relight'; b.shiver = 0;
        if (b.first) K.say(g, b, '¡FUEGO!', '#ff8a2a');
        if (Math.random() < 0.5) g.burst(b.cx + (Math.random() - 0.5) * 60, b.y + b.h - 6, 2, '#ffd23a', 'spark');
        if (b.at > 0.9) { b.heat = 3; b.splats = []; b.coolT = 0; g.burst(b.cx, b.y + b.h - 6, 22, '#ff8a2a', 'spark'); K.sfx('flame_jet', 'fire', { vol: 0.5 }); b.go('walk'); }
      }
      b.fall(dt);
    },
    hurt(b) { b.go('relight'); K.say(b.g, b, pick(['MY SOCARRAT!', '¡AY, MI ARROZ!', 'NOT THE PRAWNS!']), '#ffd84a'); b.g.burst(b.cx, b.cy, 24, '#ffe070', 'confetti'); },
    phase(b, n) {
      const g = b.g;
      if (n === 2) { this.hurt(b); for (const e of g.entities) if (e instanceof EsCrate) e.hop = true; g.bannerText = 'LAS FALLAS! THE CRATES DANCE!'; g.bannerT = 2.4; K.say(g, b, 'ROCKETS! MUSIC! TOMATOES!', '#ff5a8a'); }
      else if (n === 3) { b.heat = 3; b.splats = []; b.coolT = 0; b.shiver = 0; b.flooded = false; b.go('flip'); g.burst(b.cx, b.cy, 24, '#ffe070', 'confetti'); }
    },
    lastHit(b) { b.go('clatter'); b.vuln = false; b.g.bannerText = 'THE PAN CLATTERS OVER!'; b.g.bannerT = 2.6; b.g.shake(10); K.sfx('break', null, { vol: 0.7 }); return true; },
    draw(b, ctx, t) {
      const x = b.cx, y = b.y + b.h, d = b.dir, P = b.pose, hot = P === 'hot' || P === 'charge', cold = P === 'cold';
      ctx.save(); ctx.translate(x, y);
      if (cold) ctx.translate(Math.sin(t * 40) * 1.5, 0);
      if (P === 'skate') ctx.rotate(-d * 0.12);
      if (P === 'flip') { ctx.translate(0, -18); ctx.scale(1, -1); ctx.translate(0, -18); ctx.rotate(Math.sin(t * 30) * 0.03); }
      // mussel-shell legs
      if (P !== 'flip') { ctx.fillStyle = '#2a2a3a'; for (const lx of [-34, -14, 14, 34]) { ctx.save(); ctx.translate(lx, -8); const st = P === 'stamp' ? Math.sin(t * 30 + lx) * 0.5 : P === 'walk' || P === 'charge' ? Math.sin(t * (P === 'charge' ? 24 : 10) + lx) * 0.3 : 0; ctx.rotate(st); ctx.beginPath(); ctx.ellipse(0, 0, 5, 9, 0, 0, TAU); ctx.fill(); ctx.restore(); } }
      // the pan and the rice
      ctx.fillStyle = cold ? '#4a5a6a' : '#3a3a44'; ctx.beginPath(); ctx.ellipse(0, -18, 52, 12, 0, 0, Math.PI); ctx.fill(); ctx.fillRect(-54, -22, 108, 5);
      ctx.fillStyle = cold ? '#6a7a8a' : '#4a4a54'; ctx.fillRect(-72, -22, 18, 5); ctx.fillRect(54, -22, 18, 5);
      const rice = ctx.createLinearGradient(0, -36, 0, -18);
      if (cold) { rice.addColorStop(0, '#c8d8e8'); rice.addColorStop(1, '#a8b8d0'); } else { rice.addColorStop(0, hot ? '#ffb040' : '#ffe070'); rice.addColorStop(1, hot ? '#e8602a' : '#e8b83a'); }
      ctx.fillStyle = rice; ctx.beginPath(); ctx.ellipse(0, -22, 50, 12, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#ff7a5a'; for (const [px, py] of [[-28, -28], [10, -31], [30, -26]]) { ctx.beginPath(); ctx.ellipse(px, py, 8, 4, 0.5, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#2a2a3a'; for (const [px, py] of [[-10, -27], [22, -24]]) { ctx.beginPath(); ctx.ellipse(px, py, 6, 3, -0.3, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#ffe85a'; ctx.beginPath(); ctx.ellipse(-40, -26, 6, 3, 0.4, 0, TAU); ctx.fill();
      // tomato splats on the rice (the cooling patches)
      for (const s of b.splats || []) { const k = Math.min(1, s.t * 4); ctx.fillStyle = '#d8222a'; ctx.beginPath(); ctx.ellipse(s.x, s.y, 11 * k, 5 * k, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd0b0'; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.arc(s.x - 5 + q * 5, s.y + (q % 2) * 2, 1.2 * k, 0, TAU); ctx.fill(); } }
      // the three flames under the pan: the heat gauge (each tomato puts one out)
      if (P !== 'flip') for (let k = 0; k < 3; k++) {
        const fx = (k - 1) * 26, on = k < (b.heat == null ? 3 : b.heat);
        if (on) { ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(fx - 8, 1); ctx.quadraticCurveTo(fx - 9, -12 - Math.sin(t * 14 + k) * 4, fx, -22 - Math.sin(t * 11 + k * 2) * 5); ctx.quadraticCurveTo(fx + 9, -12 + Math.sin(t * 13 + k) * 4, fx + 8, 1); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffe070'; ctx.beginPath(); ctx.moveTo(fx - 4, 1); ctx.quadraticCurveTo(fx, -10 - Math.sin(t * 15 + k) * 3, fx + 4, 1); ctx.fill(); }
        else if (P === 'relight') { ctx.fillStyle = Math.floor(t * 20 + k) % 2 ? '#ffd23a' : '#ff8a2a'; ctx.beginPath(); ctx.arc(fx, -4, 3, 0, TAU); ctx.fill(); }
        else { ctx.fillStyle = '#5a5a68'; ctx.beginPath(); ctx.ellipse(fx, 0, 7, 3, 0, 0, TAU); ctx.fill(); if (cold) { ctx.fillStyle = '#a8c8e8'; ctx.beginPath(); ctx.arc(fx + Math.sin(t * 3 + k) * 2, -8 - ((t * 10 + k * 7) % 14), 2, 0, TAU); ctx.fill(); } }
      }
      if (cold) { ctx.fillStyle = '#e8f4ff'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-45 + k * 18, -22); ctx.lineTo(-41 + k * 18, -32 - (k % 2) * 4); ctx.lineTo(-37 + k * 18, -22); ctx.fill(); } }
      if (P !== 'flip') {
        // the face over the rim
        if (cold) { K.eyes(ctx, d * 8, -34, d, 6, 3.2, false); ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(d * 8 - 6, -40 + Math.sin(t * 30) * 1.5); ctx.lineTo(d * 8 + 6, -40 - Math.sin(t * 30) * 1.5); ctx.stroke(); ctx.fillStyle = '#8ad8ff'; ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('BRRR', d * 8 + 26, -46 + Math.sin(t * 6) * 2); }
        else K.eyes(ctx, d * 8, -34, d, 6, 3.4, true);
        if (hot) for (let k = 0; k < 4; k++) { const ph = (t * 1.5 + k / 4) % 1; ctx.fillStyle = ph < 0.5 ? '#f4f0ff' : '#e0dcf0'; ctx.beginPath(); ctx.arc(-30 + k * 20, -40 - ph * 30, (5 + ph * 6) * (1 - ph * 0.6), 0, TAU); ctx.fill(); }
        if (P === 'stamp') { ctx.fillStyle = '#ffffff'; ctx.font = `12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', d * 8, -52 + Math.sin(t * 12) * 2); }
      }
      ctx.restore();
    }
  }
};

/* ---------------- music: pasodoble brass, flamenco guitar and palmas ---------------- */
const tracks = {
  tour_es: {
    bpm: 120, bars: 8, rv: 0.25, dl: 0.1, hx: 0.08,
    ch: 'Am Dm E Am F Dm E Am',
    ld: 'E5:2 A5:2 C6:2 B5:2 A5:4 E5:4 | F5:2 A5:2 D6:2 C6:2 A5:8 | G#5:2 B5:2 E6:2 D6:2 B5:4 G#5:4 | A5:8 E5:8 |' +
        'C6:2 A5:2 F5:2 A5:2 C6:4 F6:4 | D6:2 F6:2 A6:2 F6:2 D6:8 | B5:2 D6:2 G#6:2 E6:2 D6:4 B5:4 | A5:12 .:4',
    li: 'brass', lv: 0.15,
    bp: 'r...o...r...o...', bi: 'pluckb', bv: 0.3,
    ap: '0.2.1.2.0.2.1.2.', ai: 'gtr', av: 0.05, ao: 60,
    dr: ['k.......k.......', '....s.......s...', 'c..c..c...c..c..', 'r.r.rr.r.r.rr.r.'], dv: 0.42
  },
  tour_es_deep: {
    bpm: 86, bars: 8, rv: 0.6, dl: 0.25,
    ch: 'Fmaj7 Em7 Dm7 Cmaj7 Fmaj7 Em7 Dm7 G',
    ld: 'A5:6 C6:2 E6:8 | G5:4 B5:4 D6:8 | F5:4 A5:4 C6:4 A5:4 | E5:12 .:4 | A5:4 C6:4 F6:8 | E6:4 D6:4 B5:8 | C6:4 A5:4 F5:4 A5:4 | G5:12 .:4',
    li: 'vibes', lv: 0.13,
    bp: 'r.......r...f...', bi: 'sub', bv: 0.24,
    ap: '0.2.4.1.3.5.2.4.', ai: 'harp', av: 0.04, ao: 68,
    dr: ['u.....u..u......', '...u.......u..u.'], dv: 0.3
  },
  tour_es_night: {
    bpm: 112, bars: 8, rv: 0.4, dl: 0.18,
    ch: 'Dm C Bb A Dm C Bb A',
    ld: 'D5:2 F5:2 A5:2 D6:2 C6:4 A5:4 | E5:2 G5:2 C6:2 E6:2 D6:8 | F5:2 Bb5:2 D6:2 F6:2 E6:4 D6:4 | C#6:8 A5:8 |' +
        'A5:2 D6:2 F6:2 A6:2 G6:4 F6:4 | E6:2 C6:2 G5:2 C6:2 E6:8 | D6:2 Bb5:2 F5:2 Bb5:2 D6:4 F6:4 | E6:8 C#6:8',
    li: 'ep', lv: 0.13,
    bp: 'r.r...r.r.r...r.', bi: 'sub', bv: 0.28,
    ap: '0.1.2.1.0.1.2.1.', ai: 'gtr', av: 0.045, ao: 60,
    dr: ['k...k...k...k...', '....c.......c...', 'h.h.h.h.h.h.h.h.', '..c...c..c....c.'], dv: 0.4
  },
  tour_es_boss: {
    bpm: 168, bars: 8, rv: 0.2, hx: 0.1,
    ch: 'Am G F E Am G F E',
    ld: 'A5:2 C6:2 E6:2 A6:2 G6:4 E6:4 | G5:2 B5:2 D6:2 G6:2 F6:4 D6:4 | F5:2 A5:2 C6:2 F6:2 E6:4 C6:4 | E5:2 G#5:2 B5:2 E6:2 G#6:8 |' +
        'A6:2 G6:2 F6:2 E6:2 D6:4 C6:4 | B5:2 C6:2 D6:2 E6:2 F6:8 | E6:2 D6:2 C6:2 B5:2 A5:4 F5:4 | E5:8 G#5:8',
    li: 'brass', lv: 0.17,
    bp: 'r.r.r.o.r.r.r.f.', bi: 'sawb', bv: 0.28,
    ap: 'c-..c-..c-..c-..', ai: 'gtr', av: 0.05, ao: 58,
    dr: ['K...k...K...k.k.', '....s.......s...', 'c.cc.c.cc.c.c.cc', 'h.h.h.h.h.h.h.h.'], dv: 0.46
  }
};

/* ---------------- the five levels ---------------- */
Tour.country({
  id: 'es', colors: COL, tagline: 'Tomatoes, oranges, fallas and the city of the future',
  themes, painters, decor, decorLights, beatArt, platforms, enemies, entities, pieces: P, boss, power, tracks,
  music: { level: 'tour_es', boss: 'tour_es_boss' },
  landmark: 'the silk exchange',
  arrival: 'Brady! The Baron shrank the Silk Exchange and hid it in a paella pan. It smells AMAZING in there. ♥ C',
  coin: { name: 'ORANGE', draw(ctx, x, y) {
    ctx.fillStyle = '#ff8a1a'; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x - 3, y - 3, 2.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a8a3a'; ctx.beginPath(); ctx.ellipse(x + 3, y - 8, 4, 2, 0.4, 0, TAU); ctx.fill();
  } },
  star: { name: 'GOLDEN FAN', draw(ctx, x, y, t) { ctx.save(); ctx.translate(x, y + 6); for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? '#ffd24a' : '#ffe890'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 13, -Math.PI + k * Math.PI / 7, -Math.PI + (k + 1) * Math.PI / 7); ctx.closePath(); ctx.fill(); } ctx.restore(); } },
  levels: [
    { name: 'La Tomatina', style: 'run', theme: 'es_tomatina', gimmick: 'Tomato trucks lob tomatoes over pulp-slick streets: slide carefully, climb crate stacks and balconies',
      enemies: [['esTomato', 3], ['esOrange', 2], ['esHorchata', 2]],
      hint: 'Splat tomatoes in front of enemies: they slide right off!',
      postcard: 'I am red from head to toe. It is the best day of my life. ♥ C',
      script: [['flat', { n: 5 }], 'sig', 'truck', ['crates', { gold: true }], 'balconies', 'pulp', 'cp', ['truck', { period: 1.3 }], 'crates', 'bonus', 'pulp', 'balconies', 'end'] },
    { name: 'The Aquarium', style: 'swim', theme: 'es_aquarium', gimmick: 'Swim through glass tunnels past sharks and pulsing jellyfish, ride the pump currents',
      enemies: [['esJelly', 2], ['esShark', 1]], H: 18, width: 230,
      hint: 'Jellyfish bob up and down: slip past between pulses',
      postcard: 'A beluga smiled at me through the glass. I smiled back for an hour. ♥ C',
      script: [['tunnel', {}], 'jellies', ['pumps', {}], 'alcove', ['tunnel', { w: 14 }], ['jellies', { n: 4 }], ['pumps', { dir: -1 }], 'tunnel', 'jellies'] },
    { name: 'City of Arts by Night', style: 'night', theme: 'es_arts', gimmick: 'White ribs arch over reflecting pools, floor lights switch with the beat, and a lifting deck carries you up',
      enemies: [['esBat', 2], ['esHorchata', 2]], dark: true, bpm: 112,
      hint: 'The floor lights switch on the beat: wait for yours',
      postcard: 'The buildings look like whale bones and spaceships. The bats live here too. ♥ C',
      script: [['flat', { n: 5 }], 'ribs', ['lights', { n: 4 }], ['eyelid', { gold: true }], 'bats', 'drop', 'cp', ['ribs', { n: 4 }], 'lights', 'eyelid', 'bats', 'drop', 'end'] },
    { name: 'The Giant Falla', style: 'climb', theme: 'es_fallas', gimmick: 'Climb a giant papier-mâché sculpture: rocket launchers fire you upward, firecracker strings pop in waves',
      enemies: [['esPetardo', 2]], W: 24, H: 96,
      hint: 'Firecrackers flash before they pop: move along!',
      postcard: 'They BURN these giant sculptures at the end of the festival. On purpose! ♥ C',
      script: [['falla', { petardo: true }], ['rockets', { gold: true }], 'crackers', ['falla', { n: 3 }], ['rockets', { left: true }], 'crackers', ['falla', { n: 4, petardo: true }]] },
    { name: 'The Silk Exchange', style: 'castle', theme: 'es_lonja', gimmick: 'Twisted columns, swinging silk banners and merchants\' scales that rise and fall, then Paellasaurus',
      enemies: [['esHorchata', 2], ['esTomato', 2]], boss: 'es_paella', arena: 'lonja', arenaW: 26, roof: false,
      hint: 'Paellasaurus is too hot to stomp. Kick three tomatoes into the pan to put the fire out, then crack the crust!',
      postcard: 'The Silk Exchange is back! The Baron pedalled off to France. Allez! ♥ C',
      script: [['flat', { n: 4 }], 'columns', ['banners', {}], 'scales', 'cp', 'sig', ['banners', { n: 3 }], 'columns', ['enemies', { n: 2 }], ['blocks', { content: 'power' }], 'arena'] }
  ]
});
})();
