/* ============================================================
   FRANCE (world 7): the whole country. This file holds the look
   (themes, painters, decor), the cast, the objects, the signature
   item (the meringue piping bag), the boss and the music. The
   levels (v2 format, LEVEL_OVERHAUL.md §2) are in 29_tour_fr_levels.js:
   7-1 Paris Morning Rounds  HUB     7-5 Château des Glaces   LAIR
   7-2 Lavender Magpie       THIEF   7-6 Seine Chase          SCROLL (secret)
   7-3 Mont-Saint-Michel     TIDE    7-7 Montgolfière Skies   SKY (secret)
   7-4 Truffle Hunt          DIG
   The iron tower is only ever daylight or an unlit silhouette.
   ============================================================ */
(() => {
const COL = { a: '#3a6ad8', b: '#ff8aa8', c: '#ffd86a' };
const MAC = ['#ff9ab8', '#a8e0b0', '#c8a8ff', '#ffe08a', '#8ad0ff', '#ffb08a'];
const K = TourKit;
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };

/* ---------------- background painters ---------------- */
// the lattice tower (always shown in daylight or as a dark silhouette, never with a light show)
function latticeTower(ctx, x, base, h, col, detail) {
  const w = h * 0.36;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(x - w / 2, base); ctx.quadraticCurveTo(x - w * 0.18, base - h * 0.35, x - w * 0.06, base - h * 0.78); ctx.lineTo(x - 2, base - h); ctx.lineTo(x + 2, base - h); ctx.lineTo(x + w * 0.06, base - h * 0.78); ctx.quadraticCurveTo(x + w * 0.18, base - h * 0.35, x + w / 2, base);
  ctx.lineTo(x + w * 0.3, base); ctx.quadraticCurveTo(x, base - h * 0.2, x - w * 0.3, base); ctx.closePath(); ctx.fill();
  ctx.fillRect(x - w * 0.24, base - h * 0.32, w * 0.48, h * 0.03); ctx.fillRect(x - w * 0.12, base - h * 0.6, w * 0.24, h * 0.025);
  if (detail) { ctx.strokeStyle = shade(col, 0.25); ctx.lineWidth = 0.8; for (let k = 1; k < 9; k++) { const yy = base - h * k * 0.09, ww = w * (0.5 - k * 0.045); ctx.beginPath(); ctx.moveTo(x - ww, yy); ctx.lineTo(x + ww * 0.6, yy - h * 0.05); ctx.moveTo(x + ww, yy); ctx.lineTo(x - ww * 0.6, yy - h * 0.05); ctx.stroke(); } }
}
const painters = {
  frTower(ctx, L, rng, H) { wrapDraw((L.at || 720) - 60, 120, ox => latticeTower(ctx, ox + 60, L.base, L.h || 230, L.color, true)); },
  // cream limestone facades with zinc mansard roofs, chimney pots and balconies
  frFacades(ctx, L, rng, H) {
    let x = 0;
    while (x < BG_W) {
      const w = 70 + Math.floor(rng() * 40), floors = 4 + Math.floor(rng() * 2), top = L.base - floors * 22 - 20;
      const stone = L.night ? shade(L.color, -0.1) : shade(L.color, rng() * 0.06);
      wrapDraw(x, w, xx => {
        ctx.fillStyle = stone; ctx.fillRect(xx, top + 20, w - 2, H - top);
        // mansard roof
        ctx.fillStyle = L.roof || '#6a7a90'; ctx.beginPath(); ctx.moveTo(xx - 2, top + 22); ctx.lineTo(xx + 6, top); ctx.lineTo(xx + w - 8, top); ctx.lineTo(xx + w, top + 22); ctx.fill();
        for (let k = 0; k < 3; k++) { ctx.fillStyle = L.roof || '#6a7a90'; ctx.fillRect(xx + 12 + k * (w - 30) / 2, top + 6, 9, 12); ctx.fillStyle = L.night ? (rng() < 0.6 ? '#ffd890' : '#2a3048') : '#b8c8e0'; ctx.fillRect(xx + 14 + k * (w - 30) / 2, top + 9, 5, 7); }
        ctx.fillStyle = '#a86a4a'; ctx.fillRect(xx + w * 0.7, top - 10, 7, 12); ctx.fillStyle = '#c87a5a'; ctx.fillRect(xx + w * 0.7 + 1, top - 13, 2, 4); ctx.fillRect(xx + w * 0.7 + 4, top - 13, 2, 4);
        // windows with wrought-iron balconies
        for (let f = 0; f < floors; f++) for (let k = 0; k < Math.floor((w - 8) / 16); k++) {
          const wx = xx + 6 + k * 16, wy = top + 28 + f * 22;
          ctx.fillStyle = L.night ? (rng() < 0.35 ? '#ffd890' : '#1a2034') : '#4a5a78'; ctx.fillRect(wx, wy, 8, 13);
          if (!L.night) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(wx + 1, wy + 1, 2, 11); }
          if (f % 2 === 0) { ctx.fillStyle = '#2a2a34'; ctx.fillRect(wx - 2, wy + 12, 12, 2); for (let q = 0; q < 4; q++) ctx.fillRect(wx - 1 + q * 3, wy + 8, 1, 5); }
          if (f === floors - 1 && !L.night && rng() < 0.5) { ctx.fillStyle = ['#ff6a8a', '#ffd84a', '#ff9a3a'][Math.floor(rng() * 3)]; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.arc(wx + q * 4, wy + 12, 2, 0, TAU); ctx.fill(); } }
        }
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(xx + w - 6, top + 20, 4, H - top);
      });
      x += w;
    }
  },
  // striped café awnings along the street
  frAwnings(ctx, L, rng, H) {
    let x = 0;
    while (x < BG_W) {
      const w = 60 + rng() * 50, c = ['#c8283a', '#2a6ac8', '#2a8a5a', '#c87a2a'][Math.floor(rng() * 4)];
      wrapDraw(x, w, xx => {
        ctx.fillStyle = shade(L.color, -0.15); ctx.fillRect(xx, L.base - 30, w, H);
        for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#fff4e8' : c; ctx.beginPath(); ctx.moveTo(xx + k * w / 6, L.base - 44); ctx.lineTo(xx + (k + 1) * w / 6, L.base - 44); ctx.lineTo(xx + (k + 1) * w / 6 + 4, L.base - 28); ctx.lineTo(xx + k * w / 6 + 4, L.base - 28); ctx.fill(); }
        ctx.fillStyle = '#3a2a2a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(xx + 14 + k * w / 3, L.base - 8, 5, 0, TAU); ctx.fill(); ctx.fillRect(xx + 13 + k * w / 3, L.base - 8, 2, 8); }
      });
      x += w + 12 + rng() * 20;
    }
  },
  // the river with stone bridges
  frSeine(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, L.base, H, '#5a8ab8', '#2a4a78'); ctx.fillRect(0, L.base, BG_W, H - L.base);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; for (let i = 0; i < 40; i++) { const x = rng() * BG_W, y = L.base + 4 + rng() * 40; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 16, y); ctx.stroke(); }
    for (const bx of [140, 620]) wrapDraw(bx, 260, xx => {
      ctx.fillStyle = L.color; ctx.fillRect(xx, L.base - 34, 260, 12);
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(xx + k * 65, L.base - 22); ctx.lineTo(xx + k * 65, L.base + 6); ctx.arc(xx + k * 65 + 32, L.base + 6, 26, Math.PI, 0, true); ctx.lineTo(xx + k * 65 + 65, L.base - 22); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(xx, L.base - 24, 260, 3);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = '#3a3a48'; ctx.fillRect(xx + 10 + k * 48, L.base - 52, 3, 18); ctx.fillStyle = L.lamps ? '#ffe2a0' : '#5a5a68'; ctx.beginPath(); ctx.arc(xx + 11.5 + k * 48, L.base - 54, 3, 0, TAU); ctx.fill(); }
    });
  },
  // trees along the quay
  frTrees(ctx, L, rng, H) {
    for (let x = 10; x < BG_W; x += 60 + rng() * 30) wrapDraw(x, 50, xx => {
      ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(xx - 3, L.base - 50, 6, 50);
      ctx.fillStyle = L.color; ctx.beginPath(); ctx.arc(xx, L.base - 64, 26, 0, TAU); ctx.arc(xx - 18, L.base - 54, 18, 0, TAU); ctx.arc(xx + 18, L.base - 54, 18, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(L.color, 0.12); ctx.beginPath(); ctx.arc(xx - 6, L.base - 72, 10, 0, TAU); ctx.fill();
    });
  },
  // night rooftops: chimney pots, antennas, the odd lit window
  frRoofs(ctx, L, rng, H) {
    let x = 0;
    while (x < BG_W) {
      const w = 50 + rng() * 60, top = L.base - rng() * 50;
      wrapDraw(x, w, xx => {
        ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(xx, H); ctx.lineTo(xx, top + 16); ctx.lineTo(xx + 8, top); ctx.lineTo(xx + w - 8, top); ctx.lineTo(xx + w, top + 16); ctx.lineTo(xx + w, H); ctx.fill();
        for (let k = 0; k < 2; k++) { ctx.fillRect(xx + 10 + k * w * 0.5, top - 12, 8, 12); }
        if (rng() < 0.5) { ctx.strokeStyle = L.color; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(xx + w * 0.4, top); ctx.lineTo(xx + w * 0.4, top - 24); ctx.moveTo(xx + w * 0.4 - 8, top - 18); ctx.lineTo(xx + w * 0.4 + 8, top - 18); ctx.stroke(); }
        for (let k = 0; k < 3; k++) if (rng() < 0.45) { ctx.fillStyle = 'rgba(255,214,140,0.85)'; ctx.fillRect(xx + 8 + k * (w - 20) / 2, top + 26 + rng() * 30, 6, 9); }
      });
      x += w;
    }
  },
  // the mirror hall: gilded frames, mirrors, chandeliers
  frMirrors(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, 0, H, '#f2e6c8', '#c8a878'); ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 128) {
      ctx.fillStyle = '#c8962a'; rr(ctx, x + 22, 70, 84, 230, 40); ctx.fill();
      const g = ctx.createLinearGradient(x + 28, 80, x + 100, 290); g.addColorStop(0, '#d8e8ff'); g.addColorStop(0.5, '#8aa0c8'); g.addColorStop(1, '#e8f0ff');
      ctx.fillStyle = g; rr(ctx, x + 28, 78, 72, 216, 34); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x + 40, 100, 4, 160);
      ctx.fillStyle = '#e8c870'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + 64 + (k - 2) * 12, 40, 3, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#c8962a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 64, 0); ctx.lineTo(x + 64, 30); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 64, 40, 24, 0, Math.PI); ctx.stroke();
    }
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(0, 318, BG_W, 8);
  }
};
const dyn = {
  // pigeons crossing the sky
  frPigeons(ctx, L, camX, oy, S, W, t) {
    for (let i = 0; i < 4; i++) {
      const x = ((i * 260 + t * (30 + i * 8) - camX * L.f) % BG_W + BG_W) % BG_W * S, y = oy + (80 + i * 26 + Math.sin(t + i) * 8) * S, f = Math.sin(t * 10 + i) * 4 * S;
      ctx.strokeStyle = 'rgba(80,80,100,0.7)'; ctx.lineWidth = 1.5 * S; ctx.beginPath(); ctx.moveTo(x - 6 * S, y - f); ctx.lineTo(x, y); ctx.lineTo(x + 6 * S, y - f); ctx.stroke();
    }
  }
};

/* ---------------- tiles ---------------- */
const cobble = {
  style: 'frCobble', cap: '#9aa4b8', capHi: '#d8e0f0', dirt: '#8a8a98', dirt2: '#5a5a68', rock: '#7a7a88',
  paint(ctx, rng) {
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) {
      const x = k * 8 + (r % 2) * 4 - 2, y = r * 8 + 2;
      ctx.fillStyle = ['#8e94a6', '#7e8496', '#9aa0b2'][Math.floor(rng() * 3)]; rr(ctx, x + 0.6, y + 0.6, 7, 7, 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x + 1.5, y + 1.2, 4, 1);
    }
  },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#c8ccd8'; ctx.fillRect(x0, 0, x1 - x0, 6); ctx.fillStyle = '#eef0f8'; ctx.fillRect(x0, 0, x1 - x0, 1.5); ctx.fillStyle = 'rgba(40,40,60,0.3)'; ctx.fillRect(x0, 5, x1 - x0, 1); }
};
const zinc = {
  style: 'frZinc', cap: '#8a98a8', capHi: '#c8d4e0', dirt: '#5a6474', dirt2: '#3a4250', rock: '#6a7484',
  paint(ctx, rng, o) { ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = 4; x < TS; x += 8) ctx.fillRect(x, 0, 1.5, TS); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = 7; x < TS; x += 8) ctx.fillRect(x, 0, 1, TS); },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#9aa8b8'; ctx.fillRect(x0, 0, x1 - x0, 5); ctx.fillStyle = '#dce4ee'; ctx.fillRect(x0, 0, x1 - x0, 1.5); }
};
const parquet = {
  style: 'frParquet', cap: '#c8904a', capHi: '#f0c080', dirt: '#8a5a2a', dirt2: '#5a3a1a', rock: '#a87038',
  paint(ctx, rng) {
    // staggered oak boards: each row its own shade, joints offset row to row, fine grain and a varnish gloss
    for (let r = 0; r < 4; r++) {
      const y = r * 8, j = [6, 22, 14, 30][r];
      ctx.fillStyle = ['#a8743c', '#9a6832', '#b07c42', '#a06c36'][(r + Math.floor(rng() * 2)) % 4]; ctx.fillRect(0, y, TS, 8);
      ctx.strokeStyle = 'rgba(70,40,15,0.22)'; ctx.lineWidth = 0.6;
      for (let g = 0; g < 2; g++) { const gy = y + 2.5 + g * 3; ctx.beginPath(); ctx.moveTo(0, gy); ctx.bezierCurveTo(10, gy - 0.8, 20, gy + 0.8, TS, gy); ctx.stroke(); }
      ctx.fillStyle = 'rgba(60,32,12,0.55)'; ctx.fillRect(j - 0.5, y, 1, 8); ctx.fillRect(0, y + 7.2, TS, 0.8);
      ctx.fillStyle = 'rgba(255,230,180,0.18)'; ctx.fillRect(0, y, TS, 1.2);
    }
  },
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#d8a05a'; ctx.fillRect(x0, 0, x1 - x0, 5); ctx.fillStyle = '#ffd890'; ctx.fillRect(x0, 0, x1 - x0, 1.5); }
};
const iron = { style: 'metal', cap: '#8a6a4a', capHi: '#c89a6a', dirt: '#6a5040', dirt2: '#3a2a20', rock: '#7a5a44' };
// item block: a striped pâtisserie box with a ribbon
function patisserieBox(ctx, th, f) {
  ctx.save(); ctx.shadowColor = 'rgba(255,220,150,0.85)'; ctx.shadowBlur = 4 + f * 1.5;
  ctx.fillStyle = '#ffb8c8'; rr(ctx, 2, 3, TS - 4, TS - 4, 3); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#ffffff'; for (let x = 4; x < TS - 4; x += 6) ctx.fillRect(x, 3, 3, TS - 4);
  ctx.strokeStyle = '#c86a8a'; ctx.lineWidth = 1.2; rr(ctx, 2, 3, TS - 4, TS - 4, 3); ctx.stroke();
  ctx.fillStyle = '#ffd84a'; ctx.fillRect(TS / 2 - 2, 3, 4, TS - 4); ctx.fillRect(2, TS / 2 - 1, TS - 4, 4);
  ctx.beginPath(); ctx.ellipse(TS / 2 - 5, 4, 5, 3, -0.5, 0, TAU); ctx.ellipse(TS / 2 + 5, 4, 5, 3, 0.5, 0, TAU); ctx.fill();
  const sx = -8 + f * 12; ctx.save(); rr(ctx, 2, 3, TS - 4, TS - 4, 3); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + 5, 0); ctx.lineTo(sx - 5, TS); ctx.lineTo(sx - 10, TS); ctx.fill(); ctx.restore();
}
function patisserieUsed(ctx) { ctx.fillStyle = '#d8b8c0'; rr(ctx, 2, 6, TS - 4, TS - 7, 3); ctx.fill(); ctx.strokeStyle = '#a87a8a'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(4, 9, TS - 8, 3); }
const limestone = { style: 'stone', c1: '#e8dcc0', c2: '#c8b898', mortar: '#a89878' };
const base = {
  brick: limestone, hard: { c1: '#d8ccb0', c2: '#a89878' }, semi: { style: 'grate', c1: '#3a3a48', c2: '#1a1a24' },
  pillar: { c1: '#e8dcc0', c2: '#a89878', cap: '#fff4dc', style: 'column' }, accent: COL.b, qblockArt: patisserieBox, usedArt: patisserieUsed, tint: {}, bloom: 0.15
};
const themes = {
  fr_morning: Object.assign({}, base, {
    rays: '#fff0d0',
    name: 'Boulangerie Boulevard', music: 'tour_fr', particles: 'petals', ground: cobble,
    sky: ['#6aa8e8', '#c8e0ff', '#ffe8e0'], horizonGlow: '#ffd8d0',
    celestial: { type: 'sun', x: 0.2, y: 0.2, r: 34, color: '#fffbe8', glow: '#ffe0b0' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'frTower', color: '#9aa8c0', base: 330, h: 240, f: 0.03, blur: true, at: 760, dyn: 'frPigeons' },
      { kind: 'frFacades', color: '#f0e4cc', base: 360, f: 0.14, roof: '#7a8aa0' },
      { kind: 'frAwnings', color: '#c8b8a0', base: 380, f: 0.4 }
    ],
    fog: '#ffe8e0', decor: ['frLamp', 'frCafe', 'frFlowers', 'frLamp', 'frBench']
  }),
  fr_seine: Object.assign({}, base, {
    rays: '#fff4dc',
    name: 'The Seine', music: 'tour_fr_chase', particles: 'leaves', ground: cobble,
    sky: ['#5a98e0', '#b8d8ff', '#fff0d8'], horizonGlow: '#ffe8c8',
    celestial: { type: 'sun', x: 0.75, y: 0.25, r: 38, color: '#fffbe8', glow: '#ffe0a0' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'frTower', color: '#a8b4cc', base: 300, h: 200, f: 0.02, blur: true, at: 300 },
      { kind: 'frFacades', color: '#f2e8d4', base: 330, f: 0.08, roof: '#8a98ae' },
      { kind: 'frSeine', color: '#d8ccb0', base: 325, f: 0.18 },
      { kind: 'frTrees', color: '#5a9a4a', base: 385, f: 0.42 }
    ],
    fog: '#e8f0ff', liquid: 'sea', decor: ['frLamp', 'frBench', 'frLamp']
  }),
  fr_night: Object.assign({}, base, {
    // no fireflies or sparkles: the tower on this skyline stays a plain unlit silhouette
    name: 'Rooftops by Moonlight', music: 'tour_fr_night', particles: 'none', ground: zinc,
    sky: ['#0a0e2a', '#1a2050', '#3a3a6a'], horizonGlow: '#8a7ac8',
    celestial: { type: 'moon', x: 0.72, y: 0.2, r: 30, color: '#fff8e0', glow: '#c8d0ff' }, stars: 1,
    layers: [
      { kind: 'frTower', color: '#1a1e3a', base: 330, h: 230, f: 0.03, at: 240 },
      { kind: 'frFacades', color: '#2a3050', base: 350, f: 0.1, night: true, roof: '#1e2440' },
      { kind: 'frRoofs', color: '#141830', base: 375, f: 0.3 }
    ],
    fog: '#4a4a8a', darkness: 0.5, hard: { c1: '#5a6478', c2: '#343a4a' }, decor: ['frChimney', 'frAntenna', 'frChimney']
  }),
  fr_tower: Object.assign({}, base, {
    name: 'The Iron Tower', music: 'tour_fr', particles: 'petals', ground: iron,
    sky: ['#4a90e8', '#a8d0ff', '#f0f8ff'], horizonGlow: '#ffffff',
    celestial: { type: 'sun', x: 0.8, y: 0.12, r: 30, color: '#fffbe8', glow: '#fff0c0' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'frFacades', color: '#e8dcc4', base: 450, f: 0.05, roof: '#8a98ae' }, { kind: 'clouds', color: '#ffffff', base: 260, f: 0.1 }],
    fog: '#ffffff', hard: { c1: '#8a6a4a', c2: '#5a4430', paint: ctx => { ctx.fillStyle = '#5a4430'; ctx.fillRect(0, 0, TS, TS); ctx.strokeStyle = '#a8805a'; ctx.lineWidth = 2; ctx.strokeRect(2, 2, TS - 4, TS - 4); ctx.beginPath(); ctx.moveTo(3, 3); ctx.lineTo(TS - 3, TS - 3); ctx.moveTo(TS - 3, 3); ctx.lineTo(3, TS - 3); ctx.stroke(); ctx.fillStyle = '#c8a070'; for (const [x, y] of [[5, 5], [TS - 5, 5], [5, TS - 5], [TS - 5, TS - 5]]) { ctx.beginPath(); ctx.arc(x, y, 1.4, 0, TAU); ctx.fill(); } } },
    semi: { style: 'truss', c1: '#8a6a4a', c2: '#5a4430' }
  }),
  fr_chateau: Object.assign({}, base, {
    rays: '#ffe8b0',
    name: 'Hall of Mirrors', music: 'tour_fr', particles: 'motes', ground: parquet,
    sky: ['#f2e6c8', '#e8d4a8', '#d8b888'], horizonGlow: '#fff0c0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'frMirrors', color: '#c8962a', base: 0, f: 0.15 }],
    fog: '#fff0c8', darkness: 0, hard: { c1: '#f0e0b8', c2: '#c8a870' }, brick: { style: 'stone', c1: '#f4e8cc', c2: '#d8c8a0', mortar: '#c8962a' },
    semi: { style: 'plank', c1: '#c8962a', c2: '#8a6418' }
  })
};

/* ---------------- the rest of the country (overhaul themes) ---------------- */
// Provence: lavender rows running to the hills, sunflowers, a stone farmhouse (mas) and cypresses
Object.assign(painters, {
  frHillsSoft(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 10) ctx.lineTo(x, L.base - (L.amp || 40) * (0.5 + 0.5 * Math.sin(x / BG_W * TAU * 2 + (L.ph || 0)) * Math.cos(x / BG_W * TAU * 3)));
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
  },
  frLavender(ctx, L, rng, H) {
    // the field: purple rows converging toward the horizon, green earth between
    ctx.fillStyle = '#7a9a4a'; ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let r = 0; r < 9; r++) {
      const y0 = L.base + r * r * 1.6 + r * 3, hh = 2 + r * 1.4;
      ctx.fillStyle = r % 2 ? '#8a6ac8' : '#9a7ad8';
      for (let x = (r % 2) * 6; x < BG_W; x += 12 + r) { ctx.beginPath(); ctx.ellipse(x, y0, 5 + r * 0.8, hh, 0, 0, TAU); ctx.fill(); }
    }
    // a stone mas with a terracotta roof and blue shutters, cypresses beside it
    for (const mx of [180, 690]) wrapDraw(mx, 120, xx => {
      ctx.fillStyle = '#e8d8b8'; ctx.fillRect(xx, L.base - 40, 90, 40); ctx.fillStyle = '#c86a3a'; ctx.beginPath(); ctx.moveTo(xx - 6, L.base - 40); ctx.lineTo(xx + 45, L.base - 60); ctx.lineTo(xx + 96, L.base - 40); ctx.fill();
      ctx.fillStyle = '#5a8ac8'; for (let k = 0; k < 3; k++) ctx.fillRect(xx + 12 + k * 26, L.base - 30, 9, 12);
      for (const cx of [xx + 104, xx + 116]) { ctx.fillStyle = '#2a5a2a'; ctx.beginPath(); ctx.ellipse(cx, L.base - 30, 5, 30, 0, 0, TAU); ctx.fill(); }
    });
  },
  frSunflowers(ctx, L, rng, H) {
    for (let x = 6; x < BG_W; x += 14 + rng() * 10) wrapDraw(x, 20, xx => {
      const h = 30 + rng() * 26, y = L.base - h;
      ctx.strokeStyle = '#4a8a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xx, L.base + 20); ctx.lineTo(xx, y); ctx.stroke();
      ctx.fillStyle = '#ffc828'; for (let k = 0; k < 8; k++) { const a = k * TAU / 8; ctx.beginPath(); ctx.ellipse(xx + Math.cos(a) * 6, y + Math.sin(a) * 6, 4, 2, a, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#6a3a1a'; ctx.beginPath(); ctx.arc(xx, y, 4, 0, TAU); ctx.fill();
    });
    ctx.fillStyle = '#5a8a2a'; ctx.fillRect(0, L.base + 18, BG_W, H);
  },
  // the bay: wet sand flats with a sheen, distant water, the abbey island as a plain far silhouette (background only)
  frBay(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, L.base - 4, H, '#b8c8d0', '#d8c8a0'); ctx.fillRect(0, L.base - 4, BG_W, H - L.base + 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1; for (let i = 0; i < 40; i++) { const x = rng() * BG_W, y = L.base + 6 + rng() * 60; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 2, x + 40, y); ctx.stroke(); }
    wrapDraw((L.at || 560) - 80, 160, xx => {
      const x = xx + 80, b = L.base;
      ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(x - 80, b); ctx.quadraticCurveTo(x - 60, b - 28, x - 30, b - 44); ctx.lineTo(x - 10, b - 70); ctx.lineTo(x - 4, b - 96); ctx.lineTo(x, b - 120); ctx.lineTo(x + 4, b - 96); ctx.lineTo(x + 10, b - 70); ctx.lineTo(x + 30, b - 44); ctx.quadraticCurveTo(x + 60, b - 28, x + 80, b); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(L.color, 0.12); for (let k = 0; k < 5; k++) ctx.fillRect(x - 40 + k * 16, b - 30 - (k % 2) * 8, 10, 4);
    });
  },
  // Périgord: oak and walnut woods over pale limestone cliffs with cave mouths
  frCliffs(ctx, L, rng, H) {
    let x = 0;
    while (x < BG_W) {
      const w = 80 + rng() * 80, top = L.base - 40 - rng() * 40;
      wrapDraw(x, w, xx => {
        ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(xx, H); ctx.lineTo(xx, top + 10); ctx.quadraticCurveTo(xx + w * 0.5, top - 6, xx + w, top + 10); ctx.lineTo(xx + w, H); ctx.fill();
        ctx.fillStyle = shade(L.color, -0.18); for (let k = 0; k < 3; k++) ctx.fillRect(xx + 6, top + 26 + k * 18, w - 12, 2);
        ctx.fillStyle = '#3a2a24'; ctx.beginPath(); ctx.ellipse(xx + w * 0.4, top + 44, 10, 8, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#4a7a3a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(xx + k * w / 4, top + 6 - (k % 2) * 6, 14, 0, TAU); ctx.fill(); }
      });
      x += w;
    }
  },
  frOaks(ctx, L, rng, H) {
    for (let x = 10; x < BG_W; x += 50 + rng() * 40) wrapDraw(x, 60, xx => {
      ctx.fillStyle = '#5a4030'; ctx.fillRect(xx - 4, L.base - 54, 8, 60);
      ctx.fillStyle = L.color; for (const [dx, dy, r] of [[0, -70, 26], [-20, -58, 18], [20, -58, 18], [-8, -86, 16], [12, -84, 15]]) { ctx.beginPath(); ctx.arc(xx + dx, L.base + dy, r, 0, TAU); ctx.fill(); }
      ctx.fillStyle = shade(L.color, 0.14); ctx.beginPath(); ctx.arc(xx - 8, L.base - 76, 9, 0, TAU); ctx.fill();
    });
  }
});
// the overhaul's theme keys. Where an existing Fiesta Toon atlas fits, the theme borrows it (its image strips and
// floor); where none fits (Provence, the bay, Périgord) the painters above draw it until its art exists.
const atlasLayers = (atlas, layers, shifts) => layers.map((L, i) => ({ kind: 'image', atlas, id: 'L' + i, f: L.f, base: L.base, dyn: L.dyn, color: L.color, fallback: L, shift: (shifts && shifts[i]) || (L.base > 340 ? -Math.min(60, L.base - 335) : 0) }));
const earth = {
  style: 'grass', cap: '#6aa83a', capHi: '#a8d870', dirt: '#a87a4a', dirt2: '#7a5430', rock: '#9a7a5a'
};
const chalk = { style: 'stone', cap: '#d8ccb0', capHi: '#f4ecd8', dirt: '#c8b890', dirt2: '#a89870', rock: '#b8a888' };
const sand = { style: 'playa', cap: '#e8d8a8', capHi: '#fff4d0', dirt: '#c8b080', dirt2: '#a89060', rock: '#b8a070' };
Object.assign(themes, {
  // the Paris plaza: the morning boulevard's strips and cobbles
  fr_place: Object.assign({}, themes.fr_morning, { name: 'Place du Marché', layers: atlasLayers('fr_morning', themes.fr_morning.layers), atlas: 'fr_morning', atlasBorrow: 'fr_morning' }),
  fr_provence: Object.assign({}, base, {
    rays: '#fff4c8', name: 'Provence', music: 'tour_fr', particles: 'petals', ground: earth,
    sky: ['#4a98e8', '#a8d8ff', '#fff4d8'], horizonGlow: '#ffe8b0',
    celestial: { type: 'sun', x: 0.78, y: 0.16, r: 36, color: '#fffbe0', glow: '#ffe090' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'frHillsSoft', color: '#a8b8d8', base: 300, amp: 34, f: 0.03 },
      { kind: 'frHillsSoft', color: '#8aa868', base: 330, amp: 24, ph: 2, f: 0.08 },
      { kind: 'frLavender', color: '#8a6ac8', base: 345, f: 0.16 },
      { kind: 'frSunflowers', color: '#ffc828', base: 392, f: 0.42 }
    ],
    fog: '#fff0d8', hard: { c1: '#d8c8a0', c2: '#a89870' }, brick: { style: 'stone', c1: '#e8d8b8', c2: '#c8b090', mortar: '#a89070' },
    semi: { style: 'plank', c1: '#a8805a', c2: '#6a4a2a' }, decor: ['frLavenderBush', 'frHive', 'frLavenderBush', 'frCypress']
  }),
  fr_baie: Object.assign({}, base, {
    rays: '#fff8e8', name: 'The Bay', music: 'tour_fr', particles: 'none', ground: sand, liquid: 'sea',
    sky: ['#6aa0d8', '#c0dcf0', '#f4f0e0'], horizonGlow: '#fff4e0',
    celestial: { type: 'sun', x: 0.25, y: 0.2, r: 32, color: '#fffbe8', glow: '#ffe8c0' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'frBay', color: '#8a96aa', base: 318, f: 0.04, at: 620 },
      { kind: 'frHillsSoft', color: '#b8b090', base: 372, amp: 10, f: 0.2 }
    ],
    fog: '#f0f4f8', hard: { c1: '#b8a888', c2: '#8a7a60' }, semi: { style: 'plank', c1: '#8a6a4a', c2: '#5a4430' }, decor: ['frShell', 'frPost', 'frShell']
  }),
  fr_perigord: Object.assign({}, base, {
    rays: '#fff0c8', name: 'Périgord', music: 'tour_fr', particles: 'leaves', ground: chalk,
    sky: ['#5a98d8', '#b0d8f0', '#f8f0d8'], horizonGlow: '#fff0d0',
    celestial: { type: 'sun', x: 0.3, y: 0.14, r: 30, color: '#fffbe8', glow: '#ffe8b0' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'frCliffs', color: '#d8ccb0', base: 300, f: 0.05 },
      { kind: 'frOaks', color: '#4a7a3a', base: 330, f: 0.18 }
    ],
    fog: '#f0ecd8', hard: { c1: '#a89878', c2: '#7a6a50' }, semi: { style: 'plank', c1: '#7a5a3a', c2: '#4a3420' }, decor: ['frWalnut', 'frMushroomRing']
  }),
  // the sky over France: the tower atlas (clouds, the city far below), the iron tower a daylight silhouette far off
  fr_ciel: Object.assign({}, themes.fr_tower, {
    name: 'Montgolfière Skies', particles: 'none', ground: Object.assign({}, themes.fr_tower.ground),
    layers: [{ kind: 'frTower', color: '#9aa8c8', base: 380, h: 200, f: 0.02, blur: true, at: 520 }].concat(atlasLayers('fr_tower', themes.fr_tower.layers, [40, 0])),
    atlasBorrow: 'fr_tower'
  }),
  // the rooftops by day (7-1): the morning boulevard's strips, zinc roofs underfoot
  fr_toits: Object.assign({}, themes.fr_morning, { name: 'Les Toits', ground: zinc, hard: { c1: '#8a98a8', c2: '#5a6474' }, layers: atlasLayers('fr_morning', themes.fr_morning.layers), atlas: 'fr_morning', atlasBorrow: 'fr_morning' }),
  // the quay: the Seine strips, a little greyer (the secret room under the bridge in 7-1)
  fr_quai: Object.assign({}, themes.fr_seine, { name: 'Quai', layers: atlasLayers('fr_seine', themes.fr_seine.layers), atlasBorrow: 'fr_seine' })
});
// a borrowed atlas also lends its floor (the procedural tiles draw until it is in)
if (typeof Atlas !== 'undefined') for (const k of ['fr_place', 'fr_ciel', 'fr_quai']) {
  const th = themes[k], G = th.ground || {};
  Atlas.applyTiles(th, th.atlasBorrow, { ground: 'ground', groundFallback: G.paint ? (c, r, s) => G.paint(c, r, s) : null, capFallback: G.paintCap ? (c, a, b, r, l, rt) => G.paintCap(c, a, b, r, l, rt) : null });
}

/* ---------------- decor ---------------- */
const decor = {
  frLamp(ctx, x, y) {
    ctx.fillStyle = '#2a3040'; ctx.fillRect(x - 2, y - 74, 4, 74); ctx.fillRect(x - 6, y - 5, 12, 5);
    ctx.beginPath(); ctx.moveTo(x - 8, y - 74); ctx.lineTo(x + 8, y - 74); ctx.lineTo(x + 5, y - 90); ctx.lineTo(x - 5, y - 90); ctx.fill();
    ctx.fillStyle = '#ffe8b0'; ctx.fillRect(x - 4, y - 88, 8, 12);
    ctx.fillStyle = '#2a3040'; ctx.beginPath(); ctx.moveTo(x - 7, y - 90); ctx.lineTo(x, y - 96); ctx.lineTo(x + 7, y - 90); ctx.fill();
  },
  frCafe(ctx, x, y, t, th, d) {
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(x - 1, y - 18, 2, 18); ctx.beginPath(); ctx.ellipse(x, y - 18, 9, 2.5, 0, 0, TAU); ctx.fill();
    for (const s of [-1, 1]) { ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + s * 12, y); ctx.lineTo(x + s * 12, y - 14); ctx.lineTo(x + s * 15, y - 24); ctx.stroke(); }
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 3, y - 23, 3, 4); ctx.fillStyle = '#8a4a2a'; ctx.fillRect(x - 2.5, y - 22, 2, 1);
  },
  frFlowers(ctx, x, y) { ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x - 12, y - 8, 24, 8); for (let k = 0; k < 6; k++) { ctx.fillStyle = ['#ff6a8a', '#ffd84a', '#ff9a3a', '#c86aff'][k % 4]; ctx.beginPath(); ctx.arc(x - 10 + k * 4, y - 10 - (k % 2) * 2, 2.6, 0, TAU); ctx.fill(); } },
  frBench(ctx, x, y) { ctx.fillStyle = '#2a5a3a'; ctx.fillRect(x - 14, y - 10, 28, 3); ctx.fillRect(x - 14, y - 18, 28, 3); ctx.fillStyle = '#1a2a24'; ctx.fillRect(x - 12, y - 10, 2, 10); ctx.fillRect(x + 10, y - 10, 2, 10); },
  frChimney(ctx, x, y, t) { ctx.fillStyle = '#8a4a3a'; ctx.fillRect(x - 6, y - 18, 12, 18); ctx.fillStyle = '#a85a4a'; ctx.fillRect(x - 7, y - 20, 14, 3); for (let k = 0; k < 3; k++) { const ph = (t * 0.6 + k / 3) % 1; ctx.fillStyle = `rgba(200,200,220,${0.3 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x + ph * 8, y - 24 - ph * 30, 3 + ph * 6, 0, TAU); ctx.fill(); } },
  frAntenna(ctx, x, y) { ctx.strokeStyle = '#3a3a4a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 34); for (let k = 0; k < 3; k++) { ctx.moveTo(x - 10 + k * 2, y - 30 + k * 6); ctx.lineTo(x + 10 - k * 2, y - 30 + k * 6); } ctx.stroke(); },
  // a café umbrella (its canopy is a one-way platform)
  frUmbrella(ctx, x, y, t, th, d) {
    const w = d.w, x0 = x - w / 2, c = ['#c8283a', '#2a6ac8', '#2a8a5a'][d.seed % 3];
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 1.5, y - d.h + 8, 3, d.h - 8);
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x0, y - d.h + 12); ctx.quadraticCurveTo(x, y - d.h - 6, x0 + w, y - d.h + 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff4e8'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x0 + k * w / 4 + w / 16, y - d.h + 11); ctx.lineTo(x0 + k * w / 4 + w / 8, y - d.h + 2); ctx.lineTo(x0 + k * w / 4 + w * 3 / 16, y - d.h + 11); ctx.fill(); }
    Decor.frCafe(ctx, x - 12, y, t, th, d); Decor.frCafe(ctx, x + 12, y, t, th, d);
  },
  // the bakery front with its oven glow
  frBakery(ctx, x, y, t, th, d) {
    const w = d.w, x0 = x - w / 2;
    ctx.fillStyle = '#3a5a8a'; ctx.fillRect(x0, y - d.h, w, d.h);
    ctx.fillStyle = '#f2d890'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('BOULANGERIE', x, y - d.h + 14);
    ctx.fillStyle = '#ffd890'; ctx.fillRect(x0 + 8, y - d.h + 22, w - 16, d.h - 30);
    ctx.fillStyle = '#c87a3a'; for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(x0 + 18 + k * (w - 36) / 4, y - 20); ctx.rotate(-0.4 + k * 0.2); ctx.beginPath(); ctx.ellipse(0, 0, 3, 13, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  },
  // a book box on the quay wall (its lid is a timed platform drawn by the beat pad)
  frBookbox(ctx, x, y) { ctx.fillStyle = '#2a6a4a'; ctx.fillRect(x - 30, y - 22, 60, 22); ctx.fillStyle = '#1a4a34'; ctx.fillRect(x - 30, y - 22, 60, 3); ctx.fillStyle = '#c8a070'; for (let k = 0; k < 5; k++) ctx.fillRect(x - 26 + k * 11, y - 18, 8, 12); },
  // a round advertising column
  frColumn(ctx, x, y, t, th, d) {
    const h = d.h, w = d.w;
    ctx.fillStyle = '#2a5a3a'; ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = '#f2e8d0'; ctx.fillRect(x - w / 2 + 3, y - h + 14, w - 6, h - 24);
    for (let k = 0; k < 3; k++) { ctx.fillStyle = MAC[k * 2]; ctx.fillRect(x - w / 2 + 6, y - h + 20 + k * 22, w - 12, 16); }
    ctx.fillStyle = '#2a5a3a'; ctx.beginPath(); ctx.ellipse(x, y - h, w / 2 + 4, 6, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - h - 4, w / 3, Math.PI, TAU); ctx.fill();
  },
  // a mirror door frame (the portal draws the glass)
  frChandelier(ctx, x, y, t) { ctx.strokeStyle = '#c8962a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - 60); ctx.lineTo(x, y - 34); ctx.stroke(); ctx.fillStyle = '#e8c870'; ctx.beginPath(); ctx.ellipse(x, y - 30, 14, 5, 0, 0, TAU); ctx.fill(); for (let k = -2; k <= 2; k++) { ctx.fillStyle = '#fff8e0'; ctx.fillRect(x + k * 6 - 1, y - 40, 2, 6); } }
};
const decorLights = { frLamp: [140, '#ffe0a0', -82], frChimney: [40, '#ffb070', -10] };
// the green book boxes on the quay: their lids open (a platform) and snap shut in time
const beatArt = {
  bookbox(ctx, k, on, warn, t) {
    ctx.fillStyle = '#1e5a3e'; ctx.fillRect(1, 2, 30, 14);
    ctx.fillStyle = '#c8a070'; for (let i = 0; i < 4; i++) ctx.fillRect(4 + i * 7, 5, 5, 10);
    ctx.save(); ctx.translate(1, 2); ctx.rotate(on ? 0 : -1.1);
    ctx.fillStyle = warn ? '#7ad0a0' : '#2a7a52'; ctx.fillRect(0, -3, 30, 4); ctx.fillStyle = '#4aa878'; ctx.fillRect(1, -3, 28, 1.2);
    ctx.restore();
  }
};

/* ---------------- enemies ---------------- */
const baguetteArt = (ctx, e, x, y, m) => {
  const sq = m === 'flat' ? 0.4 : 1;
  ctx.save(); ctx.translate(x, y);
  if (m !== 'flat' && m !== 'ko') K.feet(ctx, 0, 0, e.t * 1.4, '#6a4a2a', 3.5, 6, m === 'stun');
  ctx.translate(0, -5); ctx.rotate(Math.sin(e.t * 8) * 0.04);
  const g = ctx.createLinearGradient(-6, 0, 6, 0); g.addColorStop(0, '#c87a32'); g.addColorStop(0.5, '#f0b860'); g.addColorStop(1, '#b86a2a');
  ctx.fillStyle = g; rr(ctx, -6, -32 * sq, 12, 32 * sq, 6); ctx.fill();
  ctx.strokeStyle = '#fff0c8'; ctx.lineWidth = 1.4; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-3, (-27 + k * 7) * sq); ctx.lineTo(3, (-23 + k * 7) * sq); ctx.stroke(); }
  if (m !== 'flat' && m !== 'ko') { K.eyes(ctx, 0, -21, e.dir, 2.6, 2, true); }
  ctx.restore();
};
const croissantArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y);
  const rolling = m === 'roll' || m === 'curl';
  if (rolling) { ctx.translate(0, -11); ctx.rotate(e.t * 14 * e.dir); }
  else { ctx.translate(0, -8); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1); }
  const segs = 5;
  for (let k = 0; k < segs; k++) {
    const a = rolling ? k * TAU / segs : -Math.PI * 0.85 + k * Math.PI * 0.85 / (segs - 1) * 2;
    const r = rolling ? 7 : 10, px = Math.cos(a) * r * (rolling ? 1 : 1.2), py = Math.sin(a) * r * (rolling ? 1 : 0.6);
    ctx.fillStyle = k % 2 ? '#e8a84a' : '#d8903a'; ctx.beginPath(); ctx.ellipse(px, py, rolling ? 7 : 6, rolling ? 7 : 5.5, a, 0, TAU); ctx.fill();
  }
  if (!rolling && m !== 'flat' && m !== 'ko') { K.eyes(ctx, 2, -4, 1, 2.6, 2, false); ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(3, 0, 2, 0.2, Math.PI - 0.2); ctx.stroke(); }
  ctx.restore();
};
// the crêpe pan (frPoele, a walking cast-iron pan; it replaces the old street performer): a crêpe sits in it until
// it flings it out like a boomerang
const poeleArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.35 : 1);
  const still = m === 'idle' || m === 'stun' || m === 'ko';
  K.feet(ctx, 0, 0, e.t, '#2a2a32', 5, 6, still);
  ctx.translate(0, -7);
  // the handle sticks out behind
  ctx.fillStyle = '#6a4422'; rr(ctx, -26, -9, 14, 5, 2); ctx.fill(); ctx.fillStyle = '#9a6a3a'; rr(ctx, -25, -8.5, 10, 3, 1.5); ctx.fill();
  // the pan seen at three quarters: iron rim and a dark face
  ctx.fillStyle = '#2e2e38'; ctx.beginPath(); ctx.ellipse(0, -6, 14, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#4a4a58'; ctx.beginPath(); ctx.ellipse(0, -8, 12, 6, 0, 0, TAU); ctx.fill();
  if (m !== 'throw') { ctx.fillStyle = '#f2cc7a'; ctx.beginPath(); ctx.ellipse(0, -8.5, 10, 4.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8843a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(-5 + k * 3.4, -9 + (k % 2) * 1.6, 1, 0, TAU); ctx.fill(); } }
  // the face on the pan's belly
  if (m !== 'flat' && m !== 'ko') { K.eyes(ctx, 2, -3, 1, 3, 1.8, m === 'throw' || m === 'tell'); ctx.fillStyle = '#ff8a9a'; ctx.beginPath(); ctx.arc(-6, 0, 1.6, 0, TAU); ctx.arc(9, 0, 1.6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#e8586a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(2, 1, 2, 0.2, Math.PI - 0.2); ctx.stroke(); }
  ctx.restore();
};
// a flying crêpe (the boomerang): a wide golden disc, spinning flat, lacy brown spots; its top is a platform
const flyingCrepeArt = (c, s, t) => {
  c.save(); c.translate(s.cx, s.y + 6); const k = 0.85 + 0.15 * Math.sin(t * 16);
  c.fillStyle = '#e8b860'; c.beginPath(); c.ellipse(0, 1, s.w / 2, 6, 0, 0, TAU); c.fill();
  c.fillStyle = '#f6d48a'; c.beginPath(); c.ellipse(0, -1, s.w / 2 - 2, 5 * k, 0, 0, TAU); c.fill();
  c.fillStyle = '#c8843a'; for (let q = 0; q < 7; q++) { c.beginPath(); c.ellipse(-s.w / 2 + 10 + q * (s.w - 20) / 6, -1 + Math.sin(q * 2.1 + t * 10) * 1.5, 2.2, 1.2, 0, 0, TAU); c.fill(); }
  c.restore();
};
// the rooster: a big red comb, a proud chest, a tail of green and copper feathers
const coqArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1);
  const crow = m === 'notice' || m === 'tell' || m === 'call', bob = m === 'walk' ? Math.abs(Math.sin(e.t * 9)) * 1.5 : 0;
  ctx.strokeStyle = '#e8a020'; ctx.lineWidth = 2; for (const lx of [-3, 4]) { ctx.beginPath(); ctx.moveTo(lx, -9); ctx.lineTo(lx, 0); ctx.lineTo(lx + 3, 0); ctx.stroke(); }
  ctx.translate(0, -bob);
  for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#2a7a5a' : '#b8682a'; ctx.beginPath(); ctx.ellipse(-12 - k, -20 + k * 2, 4, 11, -0.7 + k * 0.25, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#c8562a'; ctx.beginPath(); ctx.ellipse(0, -14, 11, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f4e8d0'; ctx.beginPath(); ctx.ellipse(3, -12, 6, 6, 0, 0, TAU); ctx.fill();
  const hy = crow ? -30 : -27, hx = crow ? 9 : 7;
  ctx.fillStyle = '#d8783a'; ctx.beginPath(); ctx.arc(hx, hy, 6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8282a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(hx - 3 + k * 3, hy - 6 - (k === 1 ? 2 : 0), 3, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(hx + 3, hy + 6, 2, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffc828'; ctx.beginPath(); ctx.moveTo(hx + 5, hy - 1); ctx.lineTo(hx + (crow ? 13 : 10), hy + (crow ? -2 : 1)); ctx.lineTo(hx + 5, hy + 2); ctx.fill();
  if (crow) { ctx.beginPath(); ctx.moveTo(hx + 5, hy + 2); ctx.lineTo(hx + 12, hy + 5); ctx.lineTo(hx + 5, hy + 4); ctx.fill(); }
  if (m !== 'flat' && m !== 'ko') { ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(hx + 2, hy - 1, 1.3, 0, TAU); ctx.fill(); }
  ctx.restore();
};
// the wild boar: a bristly brown wedge, pale snout disc, curled tusks; asleep it lies low with its eyes shut
const boarArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1);
  const asleep = m === 'sleep' || m === 'idle', run = m === 'charge' ? Math.sin(e.t * 26) * 2 : 0;
  if (!asleep) { ctx.fillStyle = '#4a2e1e'; for (const lx of [-9, -4, 5, 10]) ctx.fillRect(lx - 1.5, -7 + (lx > 0 ? run : -run) * 0.5, 3, 7); }
  ctx.translate(0, asleep ? 3 : 0);
  ctx.fillStyle = '#6a4430'; ctx.beginPath(); ctx.moveTo(-15, -6); ctx.quadraticCurveTo(-14, -22, 0, -22); ctx.quadraticCurveTo(12, -21, 15, -11); ctx.lineTo(15, -5); ctx.quadraticCurveTo(0, -2, -15, -6); ctx.fill();
  ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 1.4; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-10 + k * 4, -21); ctx.lineTo(-11 + k * 4, -25); ctx.stroke(); }
  ctx.fillStyle = '#d8a890'; ctx.beginPath(); ctx.ellipse(16, -9, 3.6, 4.4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#6a3a2a'; ctx.beginPath(); ctx.arc(16.5, -10, 0.8, 0, TAU); ctx.arc(16.5, -7.5, 0.8, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#fff4e0'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(14, -5, 3, Math.PI * 0.9, Math.PI * 1.8); ctx.stroke();
  ctx.fillStyle = '#5a3424'; ctx.beginPath(); ctx.moveTo(5, -20); ctx.lineTo(8, -27); ctx.lineTo(10, -19); ctx.fill();
  if (asleep) { ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(9, -14, 2, 0.2, Math.PI - 0.2); ctx.stroke(); }
  else if (m !== 'flat' && m !== 'ko') { ctx.fillStyle = m === 'charge' || m === 'notice' ? '#ff4a3a' : '#1a1020'; ctx.beginPath(); ctx.arc(9, -15, 1.6, 0, TAU); ctx.fill(); }
  ctx.restore();
};
// the snail: a striped spiral shell; curled up it is just the shell
const snailArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1);
  const curl = m === 'curl' || m === 'ball';
  if (!curl) { ctx.fillStyle = '#c8b88a'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(0, -4, 12, -2); ctx.quadraticCurveTo(16, -8, 13, -12); ctx.lineTo(11, -4); ctx.lineTo(-12, 0); ctx.fill(); ctx.strokeStyle = '#a8986a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(13, -12); ctx.lineTo(15, -18); ctx.moveTo(12, -11); ctx.lineTo(11, -17); ctx.stroke(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(15, -18, 1.3, 0, TAU); ctx.arc(11, -17, 1.3, 0, TAU); ctx.fill(); }
  const sx = curl ? 0 : -2, sy = curl ? -9 : -11, r = curl ? 9 : 9.5;
  ctx.fillStyle = '#b8783a'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#f0d8a0'; ctx.lineWidth = 2; ctx.beginPath(); for (let a = 0; a < TAU * 2.2; a += 0.2) { const rr2 = r * (1 - a / (TAU * 2.6)); const px = sx + Math.cos(a + (curl ? e.t * 6 : 0)) * rr2 * 0.85, py = sy + Math.sin(a + (curl ? e.t * 6 : 0)) * rr2 * 0.85; a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.stroke();
  ctx.restore();
};
// the mole: velvet grey-brown, tiny round spectacles, a pink star nose, big pink digging paws
const moleArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1);
  const up = m === 'pop' ? -3 : 0;
  ctx.fillStyle = '#5a4a48'; ctx.beginPath(); ctx.ellipse(0, -10 + up, 11, 11, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#6e5c58'; ctx.beginPath(); ctx.ellipse(-2, -14 + up, 6, 4, -0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff9ab0'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 9, -5 + up + (m === 'pop' ? -6 : 0), 5, 3.4, s * 0.6, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ff7a9a'; ctx.beginPath(); TourKit.star(ctx, 9, -12 + up, 3.4, 1.6, 6); ctx.fill();
  if (m !== 'flat' && m !== 'ko') { ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 1.2; for (const ex of [1, 6]) { ctx.beginPath(); ctx.arc(ex, -15 + up, 2.6, 0, TAU); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(3.6, -15 + up); ctx.lineTo(3.4, -15 + up); ctx.stroke(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(1.4, -15 + up, 0.9, 0, TAU); ctx.arc(6.4, -15 + up, 0.9, 0, TAU); ctx.fill(); }
  ctx.restore();
};
// the magpie: black and white, a long glossy blue-green tail (the stamp thief of 7-2)
const magpieArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y - 12); ctx.scale(e.dir || 1, 1);
  const f = Math.sin((e.t || t) * (m === 'flee' ? 22 : 8));
  ctx.fillStyle = '#1e5a6a'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-24, 6 + f); ctx.lineTo(-22, 1 + f); ctx.lineTo(-6, -3); ctx.fill();
  ctx.fillStyle = '#18181e'; ctx.beginPath(); ctx.ellipse(0, -2, 10, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(1, 1, 7, 4.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a4a8a'; ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(-14, -12 - f * 6); ctx.lineTo(4, -5); ctx.fill();
  ctx.fillStyle = '#18181e'; ctx.beginPath(); ctx.arc(9, -6, 5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.moveTo(13, -7); ctx.lineTo(19, -5.5); ctx.lineTo(13, -4); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(10.5, -7, 1.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(11, -7, 0.8, 0, TAU); ctx.fill();
  if (m === 'grab') { ctx.fillStyle = '#ff6a8a'; rr(ctx, 14, -2, 7, 8, 1.5); ctx.fill(); }
  ctx.restore();
};
// the oyster: a rough grey shell; open, a pearl shows; it snaps shut with a clack
const oysterArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y);
  const open = e.openK != null ? e.openK : 0.5;
  ctx.fillStyle = '#8a8a90'; ctx.beginPath(); ctx.ellipse(0, -5, 15, 6, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#c8c0c8'; ctx.beginPath(); ctx.ellipse(0, -5, 13, 3.5, 0, 0, TAU); ctx.fill();
  if (open > 0.2 && m !== 'flat') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(2, -7, 3, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,220,240,0.8)'; ctx.beginPath(); ctx.arc(1, -8, 1, 0, TAU); ctx.fill(); }
  ctx.save(); ctx.translate(-13, -5); ctx.rotate(-open * 1.1);
  ctx.fillStyle = '#9a9aa2'; ctx.beginPath(); ctx.ellipse(13, 0, 15, 5.5, 0, Math.PI, TAU); ctx.fill();
  ctx.strokeStyle = '#6a6a74'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(13, 2, 5 + k * 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  if (open > 0.3 && m !== 'flat' && m !== 'ko') { ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(10, -2, 1.2, 0, TAU); ctx.arc(16, -2, 1.2, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.restore();
};
// the crab: a red shore crab that scuttles sideways, claws up
const crabArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); if (m === 'flat') ctx.scale(1.2, 0.4);
  const sc = Math.sin(e.t * 18) * 1.5;
  ctx.strokeStyle = '#a82a1a'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 6, -6); ctx.lineTo(s * (11 + k * 2), -4 + k * 2 + (k % 2 ? sc : -sc)); ctx.lineTo(s * (12 + k * 2), 0); ctx.stroke(); }
  ctx.fillStyle = '#d83a2a'; ctx.beginPath(); ctx.ellipse(0, -8, 10, 6.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff6a4a'; ctx.beginPath(); ctx.ellipse(-2, -10, 5, 2.4, 0, 0, TAU); ctx.fill();
  for (const s of [-1, 1]) { ctx.fillStyle = '#d83a2a'; ctx.beginPath(); ctx.ellipse(s * 12, -16 - (m === 'walk' ? Math.abs(sc) : 0), 4.4, 3.4, s * 0.5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#a82a1a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(s * 12, -15); ctx.lineTo(s * 15, -19); ctx.stroke(); }
  if (m !== 'flat' && m !== 'ko') { ctx.strokeStyle = '#a82a1a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-3, -13); ctx.lineTo(-3, -17); ctx.moveTo(3, -13); ctx.lineTo(3, -17); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-3, -18, 2, 0, TAU); ctx.arc(3, -18, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(-3 + (e.dir || 1) * 0.6, -18, 1, 0, TAU); ctx.arc(3 + (e.dir || 1) * 0.6, -18, 1, 0, TAU); ctx.fill(); }
  ctx.restore();
};
// the gull: white with grey wings, a yellow beak with a red spot
const gullArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); const f = Math.sin(e.t * (m === 'swoop' ? 9 : 5));
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#a8b0bc'; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.quadraticCurveTo(-10, -12 - f * 6, -22, -6 - f * 8); ctx.lineTo(0, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(10, -12 - f * 6, 20, -6 - f * 8); ctx.lineTo(4, 0); ctx.fill();
  ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.moveTo(-20, -6 - f * 8); ctx.lineTo(-23, -5 - f * 8); ctx.lineTo(-19, -4 - f * 8); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(10, -3, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffc81a'; ctx.beginPath(); ctx.moveTo(13, -3); ctx.lineTo(19, -1); ctx.lineTo(13, 0); ctx.fill(); ctx.fillStyle = '#e8322a'; ctx.beginPath(); ctx.arc(16, -1, 0.9, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(11, -4, 1, 0, TAU); ctx.fill();
  ctx.restore();
};
// a hopping macaron: two pastel shells and a cream filling, little feet
const macaronEnemyArt = (ctx, e, x, y, m) => {
  const c = MAC[(e.seed || 0) % MAC.length];
  ctx.save(); ctx.translate(x, y); if (m === 'flat') ctx.scale(1.3, 0.4);
  const sq = m === 'hop' ? 1.1 : 1;
  if (m !== 'flat' && m !== 'ko') K.feet(ctx, 0, 0, e.t, '#7a5a4a', 4, 4, m === 'hop');
  ctx.translate(0, -4);
  ctx.fillStyle = shade(c, -0.12); ctx.beginPath(); ctx.ellipse(0, -4, 11, 5 * sq, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff4e0'; ctx.fillRect(-10, -10, 20, 3);
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -13, 11, 6 * sq, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-4, -15, 4, 1.6, -0.2, 0, TAU); ctx.fill();
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 2, -13, e.dir || 1, 3, 1.5, true);
  ctx.restore();
};
const pigeonArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const f = Math.sin(e.t * (m === 'swoop' ? 20 : 12));
  ctx.fillStyle = '#8a8aa0'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#6a6a80'; ctx.beginPath(); ctx.moveTo(-3, -2); ctx.lineTo(-10, -10 - f * 7); ctx.lineTo(5, -3); ctx.fill();
  ctx.fillStyle = '#7a7a90'; ctx.beginPath(); ctx.arc(10, -5, 5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5ac8a0'; ctx.beginPath(); ctx.arc(8, -1, 3, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#ffb81a'; ctx.beginPath(); ctx.moveTo(14, -5); ctx.lineTo(18, -4); ctx.lineTo(14, -3); ctx.fill();
  ctx.fillStyle = '#ff6a3a'; ctx.beginPath(); ctx.arc(11.5, -6, 1.2, 0, TAU); ctx.fill();
  ctx.restore();
};
const poodleArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const b = m === 'charge' ? Math.abs(Math.sin(e.t * 24)) * 3 : 0;
  ctx.fillStyle = '#f4f0f8'; for (const lx of [-8, 7]) { ctx.fillRect(lx - 1.5, -10, 3, 10); ctx.beginPath(); ctx.arc(lx, -2, 3, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.arc(-4, -14 - b, 8, 0, TAU); ctx.arc(5, -14 - b, 7, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(11, -24 - b, 6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(11, -30 - b, 4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(-12, -20 - b, 3.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff9ac8'; ctx.beginPath(); ctx.arc(8, -26 - b, 2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(14, -24 - b, 1.2, 0, TAU); ctx.arc(17, -22 - b, 1.3, 0, TAU); ctx.fill();
  ctx.restore();
};
const catArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const crouch = m === 'notice' ? 3 : 0;
  ctx.fillStyle = '#2a2a3a'; for (const lx of [-8, -3, 5, 9]) ctx.fillRect(lx - 1.5, -8, 3, 8);
  rr(ctx, -11, -16 + crouch, 22, 10, 5); ctx.fill();
  ctx.beginPath(); ctx.arc(11, -18 + crouch, 6, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(7, -22 + crouch); ctx.lineTo(8, -29 + crouch); ctx.lineTo(11, -23 + crouch); ctx.lineTo(14, -29 + crouch); ctx.lineTo(15, -21 + crouch); ctx.fill();
  ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-11, -12); ctx.quadraticCurveTo(-20, -18, -16, -28 + Math.sin(e.t * 4) * 3); ctx.stroke();
  ctx.fillStyle = '#c8ff6a'; ctx.beginPath(); ctx.ellipse(10, -19 + crouch, 1.6, 2.2, 0, 0, TAU); ctx.ellipse(14, -19 + crouch, 1.6, 2.2, 0, 0, TAU); ctx.fill();
  ctx.restore();
};
const keychainArt = (ctx, e, x, y, m) => {
  // a walking miniature tower keychain: one of the Baron's souvenir minions
  ctx.save(); ctx.translate(x, y); ctx.scale(1, m === 'flat' ? 0.4 : 1);
  if (m !== 'flat' && m !== 'ko') K.feet(ctx, 0, 0, e.t, '#8a6a3a', 5, 4, m === 'stun');
  ctx.translate(0, -3);
  latticeTower(ctx, 0, 0, 30, '#c8a060', false);
  ctx.strokeStyle = '#d8d8e8'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -34, 3, 0, TAU); ctx.stroke();
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 0, -12, e.dir, 2.4, 1.8, true);
  ctx.restore();
};
const accordionArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.35 : 1);
  const sq = 1 + (m === 'throw' ? 0.25 : Math.sin(t * 4) * 0.08);
  K.feet(ctx, 0, 0, e.t, '#3a2a2a', 5, 5, true);
  ctx.fillStyle = '#c8283a'; rr(ctx, -12, -28, 7, 22, 2); ctx.fill(); rr(ctx, 5, -28, 7, 22, 2); ctx.fill();
  ctx.fillStyle = '#2a2a34'; for (let k = 0; k < 5; k++) ctx.fillRect(-5 + k * 2.5 * sq - (sq - 1) * 6, -27, 1.4, 20);
  ctx.fillStyle = '#fff4e0'; for (let k = 0; k < 3; k++) ctx.fillRect(7, -25 + k * 6, 4, 3);
  K.eyes(ctx, -8.5, -20, 1, 1.8, 1.6, true);
  ctx.restore();
};
// behaviour modes with no clip of their own draw the nearest clip of the atlas art (and the procedural art sees the
// same mapped mode): map = { behaviourMode: clipMode }
function modal(cls, map) {
  const M = class extends cls {
    paint(ctx, x, y, mode) { return super.paint(ctx, x, y, map[mode] || mode); }
    get artMode() { const m = super.artMode; return map[m] || m; }
  };
  return M;
}
// the boar's brain: the sleeper's until it wakes, then a snort (0.5 s) and a head-down charge
function boarThink(e, dt) {
  if (e.bst !== 'awake') { e.bt = (e.bt || 0) + dt; e.noWalk = false; TourBehave.sleeper.think(e, dt); if (e.bst === 'awake') { e.state = 'walk'; e.cool = 0.3; } return; }
  const p = e.g.player;
  if (e.state === 'walk') {
    e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed;
    if (e.cool <= 0 && p && !p.dead && Math.abs(p.cy - e.cy) < 2 * TS && Math.abs(p.cx - e.cx) < 7 * TS) { e.state = 'notice'; e.st = 0.5; e.vx = 0; e.dir = sign(p.cx - e.cx) || e.dir; K.say(e.g, e, 'SNORT!', '#ffd8a0'); K.sfx('snort', 'bump', { vol: 0.5, pitch: 0.6 }); }
  } else if (e.state === 'notice') { e.mode = 'notice'; e.vx = 0; e.st -= dt; if (e.st <= 0) { e.state = 'charge'; e.st = 1.3; } }
  else { e.mode = 'charge'; e.vx = e.dir * 6 * TS; e.st -= dt; if (Math.random() < 0.3) e.g.burst(e.cx - e.dir * 12, e.y + e.h, 1, '#c8a878', 'dust'); if (e.st <= 0 || e.hitWall) { e.state = 'walk'; e.cool = 2; e.vx = e.dir * e.speed; } }
}
class FrOyster extends TourEnemy.make({ w: 30, h: 14, speed: 0, behavior: 'still', art: oysterArt, burst: '#c8c0c8', inkPad: 6 }) {
  constructor(g, s) { super(g, s); this.ph = (s.phase != null ? s.phase : Math.random() * 1.8); this.openK = 1; this.shut = false; this.snap = 0; }
  think(dt) {
    this.vx = 0; this.mode = 'idle'; this.ph += dt;
    const k = this.ph % 1.8, was = this.shut;
    this.shut = k >= 1.2; this.openK = this.shut ? approach(this.openK, 0, dt * 12) : approach(this.openK, 1, dt * 3);
    this.trem = !this.shut && k > 0.85;   // the tell: the shell trembles before it snaps
    if (this.shut && !was) { this.snap = 0.15; if (this.g.onScreen(this, 60)) K.sfx('clack', 'bump', { vol: 0.4, pitch: 1.6 }); }
    if (this.snap > 0) this.snap -= dt;
  }
  touchPlayer(p) { if (this.dead || this.stunT > 0) return; if (this.snap > 0) p.hurt(this); }
  hit(kind, src) { if ((kind === 'stomp' || kind === 'spin') && this.shut) return 'bounce'; return super.hit(kind, src); }
  paint(ctx, x, y, mode) { if (this.trem) x += Math.sin(this.t * 60) * 1.2; return super.paint(ctx, x, y, mode); }
}
const enemies = {
  frBaguette: { cls: TourEnemy.make({ w: 14, h: 38, speed: 1.0, behavior: 'walk', art: baguetteArt, burst: '#f0b860', onDefeat: e => e.g.burst(e.cx, e.cy, 12, '#f0c070', 'debris') }), place: 'walk' },
  frCroissant: { cls: TourEnemy.make({ w: 24, h: 18, speed: 0.9, behavior: 'roll', range: 8, rollSpeed: 6.2, rollT: 2.6, art: croissantArt, burst: '#e8a84a' }), place: 'walk' },
  // the crêpe pan: winds up (spin, 0.5 s), flings a crêpe that curves out 5 tiles and back; the crêpe's top is a ride
  frPoele: { cls: modal(TourEnemy.make({ w: 26, h: 24, speed: 0.5, behavior: 'boomerang', out: 5, every: 2.4, art: poeleArt, projectileArt: flyingCrepeArt, burst: '#4a4a58',
    onDefeat: e => K.say(e.g, e, 'CLANG!', '#d8d8e8') }), { idle: 'idle', tell: 'throw', throw: 'throw' }), place: 'walk' },
  frPigeon: { cls: TourFlyer.make({ w: 24, h: 16, range: 3, speed: 1.1, swoop: true, art: pigeonArt }), place: 'fly' },
  frPoodle: { cls: TourEnemy.make({ w: 24, h: 22, speed: 1.3, behavior: 'charge', range: 7, chargeSpeed: 6.5, art: poodleArt, onNotice: e => K.say(e.g, e, 'WOOF', '#ffffff') }), place: 'walk' },
  frCat: { cls: TourEnemy.make({ w: 24, h: 16, speed: 1.2, behavior: 'charge', range: 6, chargeSpeed: 7.5, windup: 0.5, chargeT: 1, art: catArt, onNotice: e => K.say(e.g, e, 'MRRROW', '#c8ff6a') }), place: 'walk' },
  frKeychain: { cls: TourEnemy.make({ w: 16, h: 36, speed: 1.4, behavior: 'hop', hopV: 8, hopEvery: 1.6, art: keychainArt, burst: '#c8a060' }), place: 'walk' },
  frAccordion: { cls: TourEnemy.make({ w: 26, h: 30, speed: 0.4, behavior: 'throw', every: 2.6, range: 11, art: accordionArt, shoot: (e, p) => {
    // a wheezy musical note that bobs through the air
    tourFire(e.g, e.cx + e.dir * 12, e.y + 8, { kind: 'note', vx: e.dir * 3 * TS, w: 12, h: 14, life: 4.5, col: '#ffffff', art: (ctx, s, t) => { const yy = s.cy + Math.sin(t * 6 + s.x * 0.05) * 6; ctx.fillStyle = '#1a1a2a'; ctx.beginPath(); ctx.ellipse(s.cx - 2, yy + 4, 4, 3, -0.4, 0, TAU); ctx.fill(); ctx.fillRect(s.cx + 1, yy - 8, 1.6, 12); ctx.beginPath(); ctx.moveTo(s.cx + 2.6, yy - 8); ctx.quadraticCurveTo(s.cx + 8, yy - 6, s.cx + 6, yy - 1); ctx.lineWidth = 1.6; ctx.strokeStyle = '#1a1a2a'; ctx.stroke(); } });
    TourKit.sfx('select2', null, { pitch: 0.6, vol: 0.4 });
  } }), place: 'walk' },
  // the rooster: Brady in its cone, it inhales (0.5 s) and crows: every sleeping boar nearby wakes up facing him
  frCoq: { cls: modal(TourEnemy.make({ w: 22, h: 30, speed: 0, behavior: 'alarmCaller', cone: 5, wake: 12, art: coqArt, burst: '#c8562a' }), { idle: 'walk', tell: 'notice', call: 'notice' }), place: 'walk' },
  // the wild boar: asleep (stomp it for double coins) until a noise or the rooster; awake it snorts and charges
  frBoar: { cls: modal(TourEnemy.make({ w: 30, h: 22, speed: 0.9, behavior: 'sleeper', hear: 4, art: boarArt, burst: '#6a4430', think: boarThink }), { sleep: 'idle', wake: 'notice', awake: 'walk' }), place: 'walk' },
  // the snail: curls into its shell when Brady is in the air above it (stomps bounce); stomp it as it uncurls
  frSnail: { cls: modal(TourEnemy.make({ w: 24, h: 18, speed: 0.45, behavior: 'curlShield', curlT: 1.5, art: snailArt, burst: '#b8783a' }), { ball: 'curl', uncurl: 'stun' }), place: 'walk' },
  // the mole: a moving soil bump under Brady's feet; it pops up (tell 0.7 s), then sits stunned a moment
  frMole: { cls: modal(TourEnemy.make({ w: 24, h: 22, speed: 1.2, behavior: 'burrower', art: moleArt, burst: '#5a4a48' }), { pop: 'walk', exposed: 'stun', dig: 'idle' }), place: 'walk' },
  // the magpie: the stamp thief of 7-2 (TourThief draws it); as a plain enemy it is an item thief
  frMagpie: { cls: TourEnemy.make({ w: 26, h: 20, speed: 1.4, behavior: 'itemThief', flee: 8, art: magpieArt, burst: '#18181e' }), place: 'walk' },
  // the oyster: open 1.2 s (stomp it now), then it snaps shut (hurts if Brady is in it) and stays shut 0.6 s
  frOyster: { cls: FrOyster, place: 'walk' },
  frCrab: { cls: TourEnemy.make({ w: 26, h: 16, speed: 1.6, behavior: 'walk', edgeTurn: true, art: crabArt, burst: '#d83a2a' }), place: 'walk' },
  frGull: { cls: TourFlyer.make({ w: 30, h: 14, range: 4, speed: 0.9, swoop: true, art: gullArt, burst: '#ffffff' }), place: 'fly' },
  frMacaron: { cls: TourEnemy.make({ w: 22, h: 20, speed: 1.1, behavior: 'hop', hopV: 9, hopEvery: 1.1, art: macaronEnemyArt, burst: '#ff9ab8' }), place: 'walk' }
};
// a chandelier that drops when Brady passes underneath, then winches back up
class FrChandelier extends Ent {
  constructor(g, s) { super(g, s, 30, 26); this.hy = this.y; this.state = 'hang'; this.k = 0; }
  update(dt) {
    this.t += dt; const p = this.g.player;
    if (this.state === 'hang') { if (p && Math.abs(p.cx - this.cx) < 1.6 * TS && p.y > this.y) { this.state = 'shake'; this.k = 0.45; Sound.play('crumble', { vol: 0.5 }); } }
    else if (this.state === 'shake') { this.k -= dt; if (this.k <= 0) { this.state = 'fall'; this.vy = 0; } }
    else if (this.state === 'fall') { this.vy += PHYS.gDown * 0.8 * dt; this.y += this.vy * dt; const t2 = tileAt(this.g.area, Math.floor(this.cx / TS), Math.floor((this.y + this.h) / TS)); if (SOLID[t2]) { this.state = 'down'; this.k = 2.2; this.y = Math.floor((this.y + this.h) / TS) * TS - this.h; this.g.shake(4); Sound.play('break', { vol: 0.6 }); this.g.burst(this.cx, this.y + this.h, 12, '#fff8d0', 'spark'); } }
    else if (this.state === 'down') { this.k -= dt; if (this.k <= 0) this.state = 'up'; }
    else if (this.state === 'up') { this.y = approach(this.y, this.hy, 3 * TS * dt); if (this.y === this.hy) this.state = 'hang'; }
  }
  touchPlayer(p) { if (this.state === 'fall') p.hurt(this); }
  draw(ctx) {
    const x = this.cx, y = this.y, sx = this.state === 'shake' ? Math.sin(this.t * 60) * 1.5 : 0;
    ctx.strokeStyle = '#c8962a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, this.hy - 200); ctx.lineTo(x + sx, y); ctx.stroke();
    ctx.fillStyle = '#e8c870'; ctx.beginPath(); ctx.ellipse(x + sx, y + 14, 15, 6, 0, 0, TAU); ctx.fill();
    for (let k = -2; k <= 2; k++) { ctx.fillStyle = '#fff8e0'; ctx.fillRect(x + sx + k * 6 - 1, y + 2, 2, 8); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + sx + k * 6, y + 1, 1.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(220,240,255,0.8)'; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x + sx + k * 4, y + 18); ctx.lineTo(x + sx + k * 4 - 1.5, y + 24); ctx.lineTo(x + sx + k * 4 + 1.5, y + 24); ctx.fill(); }
  }
  get light() { return { r: 80, c: 'rgba(255,230,160,' }; }
}
// a street lamp that lights up the dark rooftops
class FrLampPost extends Ent {
  constructor(g, s) { super(g, s, 8, 90); }
  draw(ctx) { Decor.frLamp(ctx, this.cx, this.y + this.h); }
  get light() { return { r: 150, c: 'rgba(255,224,160,', x: this.cx, y: this.y + 8 }; }
}
/* ---------------- the ballroom's oven and mirrors (the boss mechanic) ---------------- */
// the soufflé itself, shared by the boss and its phase-3 decoys: o = { puff (0..1), flat, dir, face ('angry' | 'scared' | 'dizzy' | 'sad'), hat }
function souffleArt(ctx, x, by, t, o) {
  const puff = o.puff || 0, flat = !!o.flat, d = o.dir || 1;
  ctx.fillStyle = '#ffffff'; rr(ctx, x - 38, by - 30, 76, 30, 6); ctx.fill();
  ctx.fillStyle = '#e8e8f0'; for (let k = 0; k < 10; k++) ctx.fillRect(x - 36 + k * 7.6, by - 28, 3, 26);
  ctx.strokeStyle = '#c8c8d8'; ctx.lineWidth = 1.5; rr(ctx, x - 38, by - 30, 76, 30, 6); ctx.stroke();
  const h = flat ? 10 : 34 + puff * 30 + Math.sin(t * 3) * 2, top = by - 30 - h;
  const g = ctx.createLinearGradient(0, top, 0, by - 30); g.addColorStop(0, '#c8802a'); g.addColorStop(0.35, '#f0c060'); g.addColorStop(1, '#fff0b0');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 36, by - 30); ctx.quadraticCurveTo(x - 42 - puff * 8, top + h * 0.4, x - 26, top + 6); ctx.quadraticCurveTo(x, top - 10 - puff * 6, x + 26, top + 6); ctx.quadraticCurveTo(x + 42 + puff * 8, top + h * 0.4, x + 36, by - 30); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b86a1a'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x - 20 + k * 8, top + 8 + (k % 2) * 4, 2.5, 0, TAU); ctx.fill(); }
  if (flat) { ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 14, top + 2); ctx.lineTo(x + s * 8, top + 6); ctx.stroke(); } }
  else {
    const ey = top + h * 0.45;
    if (o.face === 'dizzy') { ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 11 - 4, ey - 4); ctx.lineTo(x + s * 11 + 4, ey + 4); ctx.moveTo(x + s * 11 + 4, ey - 4); ctx.lineTo(x + s * 11 - 4, ey + 4); ctx.stroke(); } }
    else if (o.face === 'scared') { K.eyes(ctx, x, ey, d, 11, 6, false); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.ellipse(x, top + h * 0.68, 5, 7, 0, 0, TAU); ctx.fill(); }
    else if (o.face === 'sad') { K.eyes(ctx, x, ey, d, 11, 5, false); ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, top + h * 0.72, 6, Math.PI + 0.2, TAU - 0.2); ctx.stroke(); }
    else { K.eyes(ctx, x, ey, d, 11, 5, true); ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, top + h * 0.62, 6, 0.2, Math.PI - 0.2); ctx.stroke(); }
    if (o.hat !== false) { const hy = top - 16 - puff * 6 + (o.hatSpin ? Math.sin(t * 30) * 2 : 0); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 8, hy, 16, 8); ctx.beginPath(); ctx.arc(x - 5, hy - 4, 6, 0, TAU); ctx.arc(x + 5, hy - 4, 6, 0, TAU); ctx.arc(x, hy - 8, 6, 0, TAU); ctx.fill(); }
  }
}
// a gilded mirror panel on the wall: hit it from below and it tilts up to catch the oven's light (for a while)
class FrMirror extends Ent {
  constructor(g, s) { super(g, s, 44, 60); this.aimed = false; this.aimT = 0; this.side = s.side || 'left'; this.wob = 0; }
  bump(p) {
    this.aimed = true; this.aimT = 9; this.wob = 0.5;
    if (p) p.vy = Math.max(p.vy, 2 * TS);
    K.sfx('glass', 'bump', { vol: 0.6, pitch: 1.3 }); this.g.burst(this.cx, this.y + this.h, 10, '#ffe8a0', 'spark'); this.g.parts.text(this.cx, this.y - 10, 'AIMED!', '#ffe8a0');
  }
  droop() { if (this.aimed) { this.aimed = false; this.aimT = 0; this.wob = 0.5; K.sfx('bump', null, { vol: 0.3, pitch: 0.7 }); } }
  update(dt) { this.t += dt; if (this.wob > 0) this.wob -= dt; if (this.aimed) { this.aimT -= dt; if (this.aimT <= 0) { this.droop(); this.g.parts.text(this.cx, this.y - 10, 'DROOPED', '#c8c8d8'); } } }
  touchPlayer(p) { if (p.dead) return; if (p.vy < 0 && p.prevBottom - p.h >= this.y + this.h - 12) this.bump(p); }
  draw(ctx) {
    const x = this.cx, y = this.y, w = this.w, h = this.h, g = this.g, b = g.boss, toward = this.side === 'left' ? 1 : -1;
    const tilt = (this.aimed ? -0.55 : 0) * toward + (this.wob > 0 ? Math.sin(this.t * 40) * 0.08 : 0);
    Ink.ent(ctx, this, c => {
      c.save(); c.translate(x, y + h / 2); c.rotate(tilt);
      c.fillStyle = '#c8962a'; rr(c, -w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 10); c.fill();
      const gl = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); gl.addColorStop(0, '#e8f0ff'); gl.addColorStop(0.5, this.aimed ? '#fff4c0' : '#8aa0c8'); gl.addColorStop(1, '#e8f0ff');
      c.fillStyle = gl; rr(c, -w / 2, -h / 2, w, h, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(-w / 2 + 6, -h / 2 + 6, 4, h - 12);
      // phase 3: the real soufflé shows in the glass (the decoys do not)
      if (b && !b.remove && b.state === 'fight' && (b.phase || 1) >= 3) { c.save(); c.beginPath(); rr(c, -w / 2, -h / 2, w, h, 7); c.clip(); const rx = clamp((b.cx - x) * 0.06, -12, 12); c.scale(0.3, 0.3); souffleArt(c, rx / 0.3, h / 2 / 0.3 - 6, this.t, { puff: 0.5, dir: 1, hat: true }); c.restore(); }
      c.fillStyle = '#e8c870'; for (const [fx, fy] of [[-w / 2 - 2, -h / 2 - 2], [w / 2 + 2, -h / 2 - 2], [-w / 2 - 2, h / 2 + 2], [w / 2 + 2, h / 2 + 2]]) { c.beginPath(); c.arc(fx, fy, 4, 0, TAU); c.fill(); }
      c.restore();
    });
    // the timer ring and the "hit me" arrow
    if (this.aimed) { ctx.strokeStyle = '#ffe8a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 14, 8, -Math.PI / 2, -Math.PI / 2 + TAU * (this.aimT / 9)); ctx.stroke(); }
    else { ctx.fillStyle = `rgba(255,232,160,${0.5 + 0.5 * Math.sin(this.t * 6)})`; ctx.font = `12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('▲', x, y + h + 16 + Math.sin(this.t * 6) * 3); }
  }
}
// the great oven at the back of the ballroom: when both mirrors aim at its window it charges and flashes, baking
// whatever stands in the column of light under it (the soufflé, a decoy... or Brady)
class FrOven extends Ent {
  constructor(g, s) { super(g, s, 76, 64); this.state = 'idle'; this.k = 0; this.cool = 0; this.heat = 0; this.flashes = 0; }
  mirrors() { return this.g.entities.filter(e => e instanceof FrMirror && !e.remove && Math.abs(e.cx - this.cx) < 20 * TS); }
  get focusW() { return 2.5 * TS; }
  inFocus(e) { return e.cx > this.cx - this.focusW && e.cx < this.cx + this.focusW; }
  update(dt) {
    this.t += dt; const g = this.g, b = g.boss, ms = this.mirrors(), both = ms.length >= 2 && ms.every(m => m.aimed);
    this.aimedN = ms.filter(m => m.aimed).length;
    if (this.cool > 0) this.cool -= dt;
    if (this.state === 'idle') { this.heat = approach(this.heat, 0, dt); if (both && this.cool <= 0 && b && b.state === 'fight') { this.state = 'charge'; this.k = 0; K.sfx('fire', null, { vol: 0.5, pitch: 0.6 }); g.toast('THE OVEN CHARGES! OUT OF THE LIGHT!'); } }
    else if (this.state === 'charge') {
      this.k += dt; this.heat = Math.min(1, this.k / 1.6);
      if (!both) { this.state = 'idle'; this.heat = 0; return; }
      if (this.k >= 1.6) this.flash();
    }
    else if (this.state === 'flash') { this.k -= dt; if (this.k <= 0) { this.state = 'idle'; this.cool = 2.4; this.heat = 0; } }
  }
  flash() {
    const g = this.g, b = g.boss, p = g.player;
    this.state = 'flash'; this.k = 0.4; this.flashes++; g.flash = 0.8; g.shake(8); K.sfx('neon_flash', 'laser', { vol: 0.7 });
    g.burst(this.cx, this.y + this.h, 24, '#fff4c0', 'spark');
    if (b && !b.remove && b.state === 'fight' && this.inFocus(b)) b.hit('hazard', this);
    for (const e of g.entities) if (e instanceof FrDecoy && !e.remove && this.inFocus(e)) e.pop('BAKED! A FAKE!');
    if (p && !p.dead && this.inFocus(p) && p.y + p.h > this.y) p.hurt(this);
    for (const m of this.mirrors()) m.droop();
  }
  draw(ctx) {
    const x = this.cx, y = this.y, h = this.h, g = this.g, t = this.t, fy = (g.boss ? g.boss.floorY : y + 10 * TS), heat = this.heat, fl = this.state === 'flash', fw = this.focusW;
    // the column of light on the floor: faint while one mirror is aimed, pulsing red as the oven charges, white at the flash
    if (fl) { ctx.fillStyle = 'rgba(255,250,220,0.85)'; ctx.fillRect(x - fw, y + h, fw * 2, fy - y - h); }
    else if (heat > 0) { ctx.fillStyle = `rgba(255,${120 + 100 * (1 - heat)},60,${0.18 + 0.3 * heat * (0.6 + 0.4 * Math.sin(t * (10 + heat * 20)))})`; ctx.fillRect(x - fw, y + h, fw * 2, fy - y - h); ctx.strokeStyle = `rgba(255,80,40,${0.5 + 0.5 * Math.sin(t * 20)})`; ctx.lineWidth = 3; ctx.strokeRect(x - fw, y + h, fw * 2, fy - y - h); ctx.fillStyle = '#ffffff'; ctx.font = `12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(Math.ceil((1.6 - this.k) / 0.53) + '...', x, fy - 70); }
    else if (this.aimedN) { ctx.fillStyle = 'rgba(255,232,160,0.08)'; ctx.fillRect(x - fw, y + h, fw * 2, fy - y - h); }
    // the beams: oven window to each aimed mirror, and from the mirrors down to the floor column
    for (const m of this.mirrors()) if (m.aimed) { ctx.strokeStyle = fl ? '#ffffff' : `rgba(255,232,160,${0.55 + 0.3 * Math.sin(t * 8)})`; ctx.lineWidth = fl ? 6 : 3; ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.lineTo(m.cx, m.cy); ctx.lineTo(x + (m.cx < x ? -1 : 1) * fw * 0.6, fy); ctx.stroke(); }
    Ink.ent(ctx, this, c => {
      // a brass oven set into the back wall, with a round window that glows with the charge
      c.fillStyle = '#5a4a3a'; rr(c, x - 38, y, 76, h, 8); c.fill(); c.fillStyle = '#c8962a'; rr(c, x - 34, y + 4, 68, h - 8, 6); c.fill();
      c.fillStyle = '#3a2a1a'; c.beginPath(); c.arc(x, y + 30, 20, 0, TAU); c.fill();
      c.fillStyle = fl ? '#ffffff' : `rgb(255,${Math.round(140 + 100 * (1 - heat))},${Math.round(60 + 60 * (1 - heat))})`; c.beginPath(); c.arc(x, y + 30, 16, 0, TAU); c.fill();
      c.fillStyle = '#ffe8a0'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x - 20 + k * 20, y + h - 8, 3, 0, TAU); c.fill(); }
      c.fillStyle = '#2a1a10'; c.font = `8px ${FONT_DISPLAY}`; c.textAlign = 'center'; c.fillText('FOUR', x, y + 14);
    });
  }
  get light() { return this.heat > 0 ? { r: 140, c: 'rgba(255,160,80,' } : null; }
}
// a phase-3 decoy: looks just like the soufflé, floats about, pops when stomped or baked
class FrDecoy extends Ent {
  constructor(g, s) { super(g, s, 76, 84); this.enemy = true; this.hx = this.x; this.hy = this.y; this.ph = s.phase || Math.random() * TAU; this.dir = -1; }
  update(dt) {
    this.t += dt; const g = this.g, b = g.boss, p = g.player;
    if (!b || b.remove || b.state !== 'fight') { this.remove = true; return; }
    // drifts around the real one's height, trailing Brady like the real one does
    const tx = clamp((p ? p.cx : this.cx) + Math.sin(this.t * 0.9 + this.ph) * 5 * TS, b.arenaX0 + 40, b.arenaX1 - 40);
    this.x = approach(this.x, tx - this.w / 2, 3.2 * TS * dt); this.y = b.floorY - this.h - 1.2 * TS + Math.sin(this.t * 2 + this.ph) * 10;
    if (p) this.dir = p.cx < this.cx ? -1 : 1;
  }
  pop(text) { if (this.remove) return; this.remove = true; this.g.burst(this.cx, this.cy, 24, '#fff4d0', 'confetti'); this.g.parts.text(this.cx, this.y - 10, text || 'POP! A FAKE!', '#ffffff'); K.sfx('splat', null, { vol: 0.5, pitch: 1.4 }); }
  hit(kind, src) { if (this.remove) return false; if (kind === 'stomp' || kind === 'spin' || kind === 'disc' || kind === 'star' || kind === 'laser') { this.pop(); return true; } return false; }
  touchPlayer(p) { if (!this.remove) p.hurt(this); }
  draw(ctx) { Ink.ent(ctx, this, c => souffleArt(c, this.cx, this.y + this.h, this.t, { puff: 0.5 + Math.sin(this.t * 2 + this.ph) * 0.2, dir: this.dir, face: 'angry' })); }
}
const entities = { frChandelier: FrChandelier, frLampPost: FrLampPost, frMirror: FrMirror, frOven: FrOven, frDecoy: FrDecoy };

/* ---------------- the signature power-up: THE MERINGUE PIPING BAG ---------------- */
// Tap THROW: on the ground, pipe a meringue wall in front of Brady (it blocks crêpes and enemies);
// in mid-air, pipe a meringue step under his feet. Up to three at once; each crumbles after a while.
class MeringueBlock extends Ent {
  constructor(g, cells, life) { super(g, null, TS, TS); this.cells = cells; this.life = life || 6; this.life0 = this.life; this.x = cells[0][0] * TS; this.y = Math.min(...cells.map(c => c[1])) * TS; this.h = cells.length * TS; this.meringue = true; this.grow = 0; }
  update(dt) {
    this.t += dt; this.life -= dt; this.grow = Math.min(1, this.grow + dt * 6);
    if (this.life <= 0) this.vanish();
  }
  vanish() {
    if (this.remove) return;
    const A = this.g.area;
    for (const [x, y] of this.cells) { const i = y * A.W + x; if (A.tiles[i] === T.HARD && A.hide[i] === 3) { A.tiles[i] = T.EMPTY; A.hide[i] = 0; } }
    this.remove = true; this.g.burst(this.cx, this.cy, 12, '#fff8ec', 'debris');
  }
  draw(ctx) {
    // a swirl of piped meringue per cell: a ridged dome with a curled peak, toasted at the edges; it cracks as it ages
    const k = this.grow, crack = this.life < 1.5 ? 1 - this.life / 1.5 : 0;
    for (const [x, y] of this.cells) {
      const cx = x * TS + TS / 2, by = y * TS + TS;
      ctx.save(); ctx.translate(cx, by); ctx.scale(k, k); if (crack) ctx.translate(Math.sin(this.t * 40) * crack, 0);
      ctx.fillStyle = '#e8c8a0'; ctx.beginPath(); ctx.ellipse(0, -2, 15, 4, 0, 0, TAU); ctx.fill();
      for (let r = 0; r < 3; r++) { ctx.fillStyle = r % 2 ? '#fff4e4' : '#fffaf2'; ctx.beginPath(); ctx.ellipse(0, -6 - r * 8, 15 - r * 4, 6, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#e8d0b0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(0, -6 - r * 8, 15 - r * 4, 6, 0, 0.2, Math.PI - 0.2); ctx.stroke(); }
      ctx.fillStyle = '#fffaf2'; ctx.beginPath(); ctx.moveTo(-4, -26); ctx.quadraticCurveTo(0, -34, 5, -31); ctx.quadraticCurveTo(2, -28, 3, -25); ctx.fill();
      ctx.fillStyle = 'rgba(200,140,70,0.35)'; ctx.beginPath(); ctx.arc(4, -30, 2, 0, TAU); ctx.fill();
      if (crack) { ctx.strokeStyle = 'rgba(160,120,80,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-2, -12); ctx.lineTo(-6, -18); ctx.moveTo(6, -4); ctx.lineTo(3, -14); ctx.stroke(); }
      ctx.restore();
    }
  }
}
// the piping bag: a striped cone of cloth with a star nozzle, a meringue curl coming out
function pipingIcon(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5 + Math.sin(t * 2) * 0.08);
  ctx.fillStyle = '#f4ecdc'; ctx.beginPath(); ctx.moveTo(-6, -11); ctx.lineTo(6, -11); ctx.lineTo(1.5, 6); ctx.lineTo(-1.5, 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a6ad8'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-5 + k * 1.2, -8 + k * 5); ctx.lineTo(5 - k * 1.2, -8 + k * 5); ctx.lineTo(4.6 - k * 1.2, -6 + k * 5); ctx.lineTo(-4.6 + k * 1.2, -6 + k * 5); ctx.fill(); }
  ctx.fillStyle = '#c8c8d8'; ctx.beginPath(); ctx.moveTo(-2, 6); ctx.lineTo(2, 6); ctx.lineTo(0, 10); ctx.fill();
  ctx.fillStyle = '#e8d0a0'; rr(ctx, -7, -14, 14, 4, 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 12, 2.6, 0, TAU); ctx.arc(2.5, 13.5, 1.8, 0, TAU); ctx.fill();
  ctx.restore();
}
const power = {
  id: 'piping', name: 'MERINGUE PIPING BAG', country: 'fr', hint: 'TAP THROW: PIPE A WALL AHEAD / A STEP IN MID-AIR', time: 0, cooldown: 0.28,
  icon: pipingIcon,
  action(p, g) {
    const A = g.area;
    const free = (x, y) => x >= 0 && y >= 0 && x < A.W && y < A.H && A.tiles[y * A.W + x] === T.EMPTY && !overlap({ x: x * TS, y: y * TS, w: TS, h: TS }, p);
    let cells = [];
    if (!p.onGround) {
      // a step right under Brady's feet
      const tx = Math.floor(p.cx / TS), ty = Math.floor((p.y + p.h + 2) / TS);
      if (free(tx, ty)) cells = [[tx, ty]];
    } else {
      // a wall in front of Brady, two blocks high
      const tx = Math.floor((p.facing > 0 ? p.x + p.w + 6 : p.x - 6) / TS), fy = Math.floor((p.y + p.h - 2) / TS);
      for (const y of [fy, fy - 1]) if (free(tx, y)) cells.push([tx, y]);
    }
    if (!cells.length) { TourKit.sfx('bump', null, { vol: 0.3 }); return false; }
    const mine = g.entities.filter(e => e instanceof MeringueBlock && !e.remove);
    if (mine.length >= 3) mine[0].vanish();
    for (const [x, y] of cells) { A.tiles[y * A.W + x] = T.HARD; A.hide[y * A.W + x] = 3; }
    g.spawn(new MeringueBlock(g, cells, 6));
    if (!p.onGround) { p.vy = Math.min(p.vy, 0); }
    TourKit.sfx('select2', 'pick', { pitch: 1.6, vol: 0.5 });
    g.parts.text(p.cx + p.facing * 20, p.y - 8, '*SQUISH*', '#ffffff');
    return true;
  },
  drawOn(p, ctx, t) {
    // the piping bag in Brady's hand
    const hx = p.cx + p.facing * (p.small ? 8 : 11), hy = p.y + (p.small ? 16 : 30);
    ctx.save(); ctx.translate(hx, hy); ctx.scale(0.7, 0.7); pipingIcon(ctx, 0, 0, t); ctx.restore();
  }
};

/* ---------------- set pieces ---------------- */
const P = {
  // a café terrace: tables to hop and umbrellas to stand on
  cafe(st, o) {
    const x = st.x, n = o.n || 3, B = st.B; st.floor(x, x + n * 6 + 1);
    for (let k = 0; k < n; k++) {
      const ux = x + 1 + k * 6, uy = st.gy - 4 - (k % 2);
      B.prop('frUmbrella', ux, uy, 4, st.gy - uy, 'none', {});
      for (let q = 0; q < 4; q++) { B.set(ux + q, uy, T.SEMI); B.setHide(ux + q, uy, 1); }
      st.coins(ux, ux + 3, uy - 2);
      if (k === n - 1) st.gold(ux + 2, uy - 4, 'high');
    }
    st.enemy('frPoodle', x + n * 6 - 1, st.gy);
    return x + n * 6 + 2;
  },
  // the bakery: its conveyor carries fresh loaves (and Brady) backward over a pit
  bakery(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 18);
    B.prop('frBakery', x + 1, st.gy - 5, 7, 5, 'none', {});
    // the bakery's delivery belt runs backward: walk (or run) against it
    for (let q = 9; q < 17; q++) B.set(x + q, st.gy, T.CONV_L);
    st.coins(x + 10, x + 15, st.gy - 3);
    st.block(x + 12, st.gy - 5, 'power');
    st.enemy('frBaguette', x + 6, st.gy);
    return x + 19;
  },
  // croissants roll down the hill toward Brady
  croissants(st, o) {
    const x = st.x; st.floor(x, x + 3);
    for (let i = 0; i < 4; i++) st.floor(x + 4 + i * 3, x + 6 + i * 3, st.gy - 1 - i);
    const top = st.gy - 4; st.floor(x + 16, x + 24, top);
    st.enemy('frCroissant', x + 20, top); st.enemy('frCroissant', x + 23, top);
    st.coins(x + 16, x + 23, top - 3);
    st.gy = top; return x + 25;
  },
  // a facade with balconies: crêpe pans fling crêpes from up high
  balconies(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 18);
    for (let k = 0; k < 3; k++) { const bx = x + 2 + k * 6, by = st.gy - 3 - k * 2; for (let q = 0; q < 4; q++) B.set(bx + q, by, T.SEMI); st.coins(bx, bx + 3, by - 2); if (k === 1) st.enemy('frPoele', bx + 2, by); }
    st.enemy('frPoele', x + 16, st.gy);
    st.gold(x + 15, st.gy - 9, 'risky');
    return x + 19;
  },
  // an advertising column and a kiosk to climb
  kiosk(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 12);
    B.prop('frColumn', x + 2, st.gy - 4, 2, 4, 'body', {});
    B.fill(x + 7, st.gy - 2, x + 10, st.gy - 1, T.HARD);
    st.block(x + 8, st.gy - 6, 'pick'); st.block(x + 9, st.gy - 6, o.content || 'oneup');
    st.coins(x + 2, x + 3, st.gy - 6);
    st.enemy('frBaguette', x + 11, st.gy);
    return x + 13;
  },
  // Seine chase: green book boxes on the quay wall; their lids open and close in time
  bookboxes(st, o) {
    const x = st.x, B = st.B, n = o.n || 3;
    st.floor(x, x + 1);
    let xx = x + 2;
    for (let k = 0; k < n; k++) {
      st.pit(xx, xx + 2);
      B.beat(xx, xx + 2, st.gy - 1 - (k % 2), k % 2, 'bookbox');
      B.decorAt('frBookbox', xx + 1, st.gy + 1, k);
      st.coins(xx, xx + 2, st.gy - 3 - (k % 2));
      xx += 3;
      st.floor(xx, xx); xx += 1;
    }
    st.floor(xx, xx + 1);
    return xx + 2;
  },
  // a barge drifting on the river through a gap in the quay
  barge(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 1);
    const span = 9;
    st.pit(x + 2, x + 2 + span - 1);
    for (let q = 0; q < span; q++) B.set(x + 2 + q, B.H - 1, T.LAVA);
    st.spawn('mplat', x + 3, st.gy, { pw: 3, ax: (span - 4) * TS, ay: 0, speed: 2.2, skin: 'frBarge' });
    for (let q = 0; q < span; q++) B.ghosts.push([x + 2 + q, st.gy + 1]);
    st.coins(x + 3, x + span, st.gy - 2);
    st.floor(x + 2 + span, x + 4 + span);
    return x + 5 + span;
  },
  // a stone bridge overhead with goodies on top
  bridge(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 10);
    const by = st.gy - 4;
    for (let q = 0; q < 9; q++) B.set(x + 1 + q, by, T.SEMI);
    st.coins(x + 2, x + 8, by - 2);
    if (o.gold) st.gold(x + 5, by - 3, 'high');
    st.enemy('frPigeon', x + 5, by - 1);
    return x + 11;
  },
  // quay steps up or down
  steps(st, o) {
    const x = st.x, dir = o.up ? -1 : 1; st.floor(x, x + 1);
    for (let i = 0; i < 3; i++) st.floor(x + 2 + i * 2, x + 3 + i * 2, st.gy + dir * (i + 1));
    st.gy += dir * 3; st.floor(x + 8, x + 10);
    return x + 11;
  },
  // rooftops: zinc roofs at different heights with alleys between
  roofs(st, o) {
    let x = st.x; const n = o.n || 3, B = st.B;
    for (let k = 0; k < n; k++) {
      const gap = 2 + (k % 2), h = clamp(st.gy + st.rng.int(-2, 1), 8, 14), w = 5 + st.rng.int(0, 3);
      st.pit(x, x + gap - 1); x += gap;
      st.gy = h; st.floor(x, x + w - 1);
      B.decorAt(k % 2 ? 'frChimney' : 'frAntenna', x + 1 + (k % 3), st.gy, k);
      st.coins(x + 1, x + w - 2, st.gy - 2);
      if (k === 1 && o.cat) st.enemy('frCat', x + w - 2, st.gy, { edgeTurn: true });
      x += w;
    }
    return x;
  },
  // a chimney puffs smoke that lifts Brady over a wide alley to a higher roof
  chimney(st, o) {
    const B = st.B; let x = st.x;
    // up on the high roofs already: take the fire escape down first
    while (st.gy < 12) { st.floor(x, x + 1); B.decorAt('frAntenna', x, st.gy, 0); x += 2; st.gy += 2; }
    st.floor(x, x + 4);
    B.fill(x + 3, st.gy - 2, x + 4, st.gy - 1, T.HARD);
    B.decorAt('frChimney', x + 4, st.gy - 2, 0);
    // the smoke column: too high to jump, so ride it up and drift over the alley
    const rise = Math.min(8, st.gy - 4), span = 3, ny = st.gy - 6;
    B.zone(x + 3, st.gy - 1 - rise, 3, rise, 1.4 * TS, -115 * TS, 6.8 * TS, 'smoke');
    st.pit(x + 5, x + 5 + span - 1);
    for (let y = st.gy - rise + 1; y < st.gy - 2; y += 2) B.pickAt(x + 4, y);
    st.gy = ny; st.floor(x + 5 + span, x + 11 + span);
    if (o.gold) st.gold(x + 9 + span, ny - 3, 'must');
    if (o.cat) st.enemy('frCat', x + 10 + span, ny, { edgeTurn: true });
    return x + 12 + span;
  },
  // a skylight and a clothesline over an alley
  clothesline(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 1);
    st.pit(x + 2, x + 9);
    for (let q = 0; q < 8; q++) B.set(x + 2 + q, st.gy - 1, T.SEMI);
    B.decorAt('frLaundry', x + 6, st.gy - 1, 0);
    st.coins(x + 3, x + 8, st.gy - 3);
    st.floor(x + 10, x + 12);
    return x + 13;
  },
  // a lamp post (light in the dark)
  lamp(st, o) { const x = st.x; st.floor(x, x + 3); st.spawn('frLampPost', x + 1, st.gy - 1, {}); return x + 4; },
  // tower climb: zig-zag girders
  girders(st, o) {
    const B = st.B, W = st.W, n = o.n || 4, mid = st.mid;
    let y = st.y;
    for (let k = 0; k < n; k++) {
      y = st.y - 3 * (k + 1);
      const left = (k + (o.flip ? 1 : 0)) % 2 === 0, x0 = left ? 3 : W - 9;
      for (let q = 0; q < 6; q++) B.set(x0 + q, y, T.SEMI);
      B.set(left ? x0 - 1 : x0 + 6, y, T.HARD);
      st.coins(x0 + 1, x0 + 4, y - 2);
      if (k === 1 && o.enemy) st.enemy(o.enemy, x0 + 3, y, { edgeTurn: true });
      if (k < n - 1) for (let q = -2; q < 2; q++) B.set(mid + q, y - 2, T.SEMI);
    }
    st.top(y - 3);
  },
  // an elevator cage rides up the middle of the tower
  elevator(st, o) {
    const B = st.B, W = st.W, mid = st.mid, h = o.h || 10;
    const y0 = st.y;
    st.spawn('mplat', mid - 1, y0 - 1, { pw: 3, ax: 0, ay: -h * TS, speed: 1.7, skin: 'frLift' });
    for (let y = y0 - h; y <= y0; y++) for (let k = -1; k < 2; k++) B.ghosts.push([mid + k, y]);
    // landings on both sides at the top
    B.fill(2, y0 - h, mid - 3, y0 - h, T.HARD); B.fill(mid + 3, y0 - h, W - 3, y0 - h, T.HARD);
    for (let y = y0 - h + 2; y < y0; y += 3) { B.pickAt(mid - 3, y); B.pickAt(mid + 3, y); }
    if (o.gold) st.gold(W - 4, y0 - h - 2, 'must');
    st.top(y0 - h - 3, [[mid - 1, mid + 1]]);
  },
  // a windy deck: gusts push Brady sideways while pigeons swoop
  windy(st, o) {
    const B = st.B, W = st.W, y = st.y - 3;
    for (let x = 3; x < W - 3; x++) if ((x % 7) !== 3) B.set(x, y, T.SEMI);
    B.zone(2, y - 6, W - 4, 6, (o.dir || 1) * 2.2 * TS, 0, 0, 'gust');
    st.enemy('frPigeon', Math.floor(W / 2), y - 2);
    st.coins(4, W - 5, y - 3);
    st.top(y - 3);
  },
  // the château: a wall you can only get past through a mirror door
  mirrors(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 16);
    B.fill(x + 7, 1, x + 8, st.gy - 1, T.HARD);
    const d1 = B.spawn('portal', x + 4, st.gy - 1, { kind: 'door', look: 'mirror', target: { area: 0, x: (x + 12) * TS + TS / 2, y: st.gy * TS } });
    B.spawn('portal', x + 12, st.gy - 1, { kind: 'door', look: 'mirror', target: { area: 0, x: (x + 4) * TS + TS / 2, y: st.gy * TS } });
    st.coins(x + 10, x + 14, st.gy - 3);
    if (o.fake) { B.fill(x + 14, st.gy - 4, x + 15, st.gy - 1, T.FAKE); st.gold(x + 15, st.gy - 2, 'hidden'); }
    return x + 17;
  },
  // chandeliers drop when Brady walks under them
  chandeliers(st, o) {
    const x = st.x, n = o.n || 3; st.floor(x, x + n * 4 + 2);
    for (let k = 0; k < n; k++) st.spawn('frChandelier', x + 2 + k * 4, st.gy - 6, {});
    st.coins(x + 1, x + n * 4, st.gy - 2);
    return x + n * 4 + 3;
  },
  // a gallery walkway above the hall
  gallery(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 14);
    B.fill(x + 2, st.gy - 3, x + 3, st.gy - 1, T.HARD);
    for (let q = 0; q < 9; q++) B.set(x + 4 + q, st.gy - 5, T.SEMI);
    st.block(x + 8, st.gy - 9, 'star');
    st.enemy('frAccordion', x + 9, st.gy - 5);
    st.coins(x + 5, x + 12, st.gy - 7);
    return x + 15;
  },
  // the boss arena: the ballroom (LEVEL_OVERHAUL §2, 7-5), reshaped for the oven-and-mirrors fight. The great oven
  // high in the back wall, top centre; a gilded mirror panel high on each side wall, too high to reach from the floor:
  // a balcony under each one (jump into the mirror from the balcony); two low café ledges to dodge crêpes from;
  // chandeliers, benches and flowers
  arena_ballroom(st, o) {
    const B = st.B, { x0, w, GY } = o, mid = x0 + Math.floor(w / 2);
    for (let q = 1; q <= 5; q++) { B.set(x0 + q, GY - 3, T.SEMI); B.set(x0 + w - 1 - q, GY - 3, T.SEMI); }
    for (let q = 0; q < 3; q++) { B.set(mid - 7 + q, GY - 5, T.SEMI); B.set(mid + 5 + q, GY - 5, T.SEMI); }
    B.decorAt('frChandelier', mid - 6, GY - 8, 0); B.decorAt('frChandelier', mid + 6, GY - 8, 1);
    B.decorAt('frBench', x0 + 8, GY, 0); B.decorAt('frBench', x0 + w - 9, GY, 1); B.decorAt('frFlowers', mid - 3, GY, 0); B.decorAt('frFlowers', mid + 3, GY, 1);
    B.decorAt('frFlowers', x0 + 3, GY - 3, 2); B.decorAt('frFlowers', x0 + w - 4, GY - 3, 3);
    st.spawn('frOven', mid, GY - 8, {});
    st.spawn('frMirror', x0 + 2, GY - 8, { side: 'left' }); st.spawn('frMirror', x0 + w - 3, GY - 8, { side: 'right' });
  }
};
Object.assign(decor, {
  frLaundry(ctx, x, y, t) { ctx.strokeStyle = '#d8d8e8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 120, y - 2); ctx.quadraticCurveTo(x, y + 6, x + 120, y - 2); ctx.stroke(); for (let k = 0; k < 4; k++) { ctx.fillStyle = MAC[k]; ctx.save(); ctx.translate(x - 60 + k * 36, y + 2); ctx.rotate(Math.sin(t * 2 + k) * 0.1); ctx.fillRect(-7, 0, 14, 16); ctx.restore(); } }
});
const platforms = {
  frBarge(ctx, p, t) { const x = p.x, y = p.y, w = p.w; ctx.fillStyle = '#2a3a5a'; ctx.beginPath(); ctx.moveTo(x - 10, y + 2); ctx.lineTo(x + w + 10, y + 2); ctx.lineTo(x + w + 2, y + 18); ctx.lineTo(x - 2, y + 18); ctx.fill(); ctx.fillStyle = '#c8283a'; ctx.fillRect(x - 6, y + 6, w + 12, 3); ctx.fillStyle = '#f2e8d0'; ctx.fillRect(x + 4, y - 14, w - 8, 12); ctx.fillStyle = '#4a6a9a'; for (let k = 0; k < 3; k++) ctx.fillRect(x + 8 + k * 10, y - 11, 6, 6); PlatformArt.deck(ctx, x - 6, y - 2, w + 12, '#8a6a4a'); },
  frLift(ctx, p, t) { const x = p.x, y = p.y, w = p.w; ctx.strokeStyle = '#5a4430'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w / 2, y - 300); ctx.lineTo(x + w / 2, y - 40); ctx.stroke(); ctx.strokeStyle = '#8a6a4a'; ctx.strokeRect(x, y - 40, w, 40); for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + k * w / 4, y - 40); ctx.lineTo(x + k * w / 4, y); ctx.stroke(); } PlatformArt.deck(ctx, x - 2, y - 2, w + 4, '#a8805a'); }
};

/* ---------------- the boss: LE GRAND SOUFFLÉ ---------------- */
// A towering cheese soufflé in its dish. It puffs up and floats, so stomps bounce; it flings crêpe frisbees,
// slams down to send cream waves along the floor, lobs macarons. THE OVEN AND THE MIRRORS: Brady hits the two
// mirror panels on the walls from below so they aim at the great oven's window; the oven charges and flashes,
// and whatever stands in the column of light is baked. The soufflé follows Brady, so lure it into the light and
// step out before the flash. Phase 2: it hides behind meringue walls it pipes itself. Phase 3: it splits into
// three; only the real one shows in the mirrors.
const crepeArt = (ctx, s, t) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.scale(1, 0.35 + 0.1 * Math.sin(t * 20)); ctx.fillStyle = '#f2d090'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#b8783a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(Math.cos(k * 1.3) * 6, Math.sin(k * 1.3) * 6, 1.6, 0, TAU); ctx.fill(); } ctx.restore(); };
const macaronArt = (ctx, s, t) => { ctx.fillStyle = s.col; ctx.beginPath(); ctx.ellipse(s.cx, s.cy - 3, 7, 3.5, 0, 0, TAU); ctx.ellipse(s.cx, s.cy + 3, 7, 3.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff4e0'; ctx.fillRect(s.cx - 6, s.cy - 1, 12, 2); };
const creamArt = (ctx, s, t) => { ctx.fillStyle = '#fff8e8'; ctx.beginPath(); ctx.moveTo(s.x, s.y + s.h); for (let k = 0; k <= 4; k++) ctx.lineTo(s.x + k * s.w / 4, s.y + s.h * (k % 2 ? 0.1 : 0.5) + Math.sin(t * 10 + k) * 2); ctx.lineTo(s.x + s.w, s.y + s.h); ctx.fill(); };
const boss = {
  id: 'fr_souffle', name: 'Le Grand Soufflé', hp: 5, dims: [76, 84], music: 'tour_fr_boss',
  brain: {
    guardText: 'TOO PUFFY',
    phases: [4, 2],
    oven(b) { if (!b.ovenRef || b.ovenRef.remove) b.ovenRef = b.g.entities.find(e => e instanceof FrOven && !e.remove && Math.abs(e.cx - (b.arenaX0 + b.arenaX1) / 2) < 14 * TS) || null; return b.ovenRef; },
    hoverY(b) { return b.floorY - b.h - 1.2 * TS; },
    wake(b) { b.puff = 0.5; b.decoyT = 0; say(b.g, b, 'OUI, OUI, I AM PERFECT!', '#ffd84a'); b.g.toast('HIT BOTH MIRRORS FROM BELOW, THEN LURE HIM INTO THE OVEN LIGHT'); },
    noDisc(b) { return b.act === 'deflate'; },
    hit(b, kind, src) {
      if (kind === 'stomp' || kind === 'spin') return 'bounce';
      if (kind === 'hazard') { b.damage(1, { text: 'BAKED!', col: '#ffb060' }); return true; }
      if (kind === 'bump' || kind === 'prop') return false;
      return undefined;
    },
    decoy(b, side) { const g = b.g, x = clamp(b.cx + side * 4 * TS, b.arenaX0 + 60, b.arenaX1 - 60); g.spawn(new FrDecoy(g, { x, y: b.y + b.h, phase: Math.random() * TAU })); g.burst(x, b.cy, 20, '#fff4d0', 'confetti'); g.parts.text(x, b.y - 10, 'ANOTHER ME!', '#ffffff'); K.sfx('portal', null, { vol: 0.4, pitch: 1.4 }); },
    // a meringue wall between him and Brady (two blocks high, five seconds)
    wall(b) {
      const g = b.g, p = g.player, A = g.area; if (!p || p.dead) return;
      const dir = p.cx < b.cx ? -1 : 1, tx = Math.floor((b.cx + dir * 2.5 * TS) / TS), fy = Math.floor((b.floorY - 2) / TS);
      const free = (x, y) => x >= 0 && y >= 0 && x < A.W && y < A.H && A.tiles[y * A.W + x] === T.EMPTY && !overlap({ x: x * TS, y: y * TS, w: TS, h: TS }, p);
      const cells = []; for (const y of [fy, fy - 1]) if (free(tx, y)) cells.push([tx, y]);
      if (!cells.length) return;
      for (const [x, y] of cells) { A.tiles[y * A.W + x] = T.HARD; A.hide[y * A.W + x] = 3; }
      g.spawn(new MeringueBlock(g, cells, 5)); say(g, b, pick(['A WALL OF MERINGUE!', 'PIPED TO PERFECTION!', 'TRÈS CHIC, NON?']), '#ffffff'); K.sfx('select2', 'pick', { pitch: 1.6, vol: 0.5 });
    },
    update(b, dt) {
      const g = b.g, p = g.player, ph = b.phase || 1, ov = this.oven(b), hy = this.hoverY(b);
      b.guard = 'bounce'; b.vuln = false; b.hatSpin = false;
      if (b.act === 'deflate') {
        // the finish: a long whistle, the puff goes out of him, he sinks into his dish
        b.pose = 'deflate'; b.vx = 0; b.puff = Math.max(0, 0.5 - b.at * 0.25); b.fall(dt);
        if (Math.floor(b.at * 3) !== Math.floor((b.at - dt) * 3) && b.at < 2) g.parts.text(b.cx + (Math.random() - 0.5) * 40, b.y - 10, 'pffffff...', '#ffffff');
        if (b.at > 2.1 && !b.sighed) { b.sighed = true; say(g, b, 'OH LÀ LÀ...', '#ffd84a'); }
        if (b.at > 3) b.die();
        return;
      }
      // phase 3: two decoys drift about with him, and come back when popped
      if (ph >= 3) {
        const n = g.entities.filter(e => e instanceof FrDecoy && !e.remove).length;
        if (n < 2) { b.decoyT = (b.decoyT || 0) - dt; if (b.decoyT <= 0) { b.decoyT = 3.5; this.decoy(b, pick([-1, 1])); } }
      }
      // the oven charges: he freezes in fear (if he is in the light, he is baked)
      const charging = ov && ov.state === 'charge';
      if (charging && b.act !== 'collapse' && b.act !== 'rise' && b.act !== 'panic') b.go('panic');
      if (b.act === 'panic') {
        b.pose = 'scared'; b.vx = 0; b.puff = approach(b.puff, 0.9, dt * 2); b.y = approach(b.y, hy, 4 * TS * dt);
        if (b.first) { say(g, b, pick(['NON NON NON!', 'NOT THE OVEN!', 'ZUT ALORS!']), '#ffffff'); if (ph >= 2) this.wall(b); }
        if ((!charging && b.at > 0.3) || b.at > 3) b.go('walk');
      }
      else if (b.act === 'walk') {
        b.face(); b.pose = 'float'; b.puff = approach(b.puff, 0.5, dt);
        b.hover(dt, hy + Math.sin(b.t * 2) * 8, p ? p.cx + (b.cx < p.cx ? -2 : 2) * TS : undefined);
        if (b.at > 1.3) { b.cycle++; const moves = ph >= 2 ? ['crepes', 'slam', 'macarons', 'crepes', 'wall'] : ['crepes', 'slam']; b.go(moves[b.cycle % moves.length]); }
      }
      else if (b.act === 'crepes') {
        // tell: the chef's hat spins, then three crêpes fly flat and true at Brady
        b.pose = 'float'; b.hover(dt, hy); b.hatSpin = b.at < 0.6;
        if (b.first) { b.n = 0; b.face(); }
        if (b.at > 0.6 && b.n < 3 && b.at > 0.6 + b.n * 0.35) { b.n++; const dy = p ? clamp((p.cy - b.cy) / 1.2, -3 * TS, 3 * TS) : 0; tourFire(g, b.cx + b.dir * 30, b.cy, { kind: 'crepe', vx: b.dir * 5 * TS, vy: dy, w: 22, h: 8, life: 3, stompable: true, col: '#f2d090', art: crepeArt }); TourKit.sfx('throw', null, { pitch: 1.4, vol: 0.4 }); }
        if (b.at > 2.0) b.go('walk');
      }
      else if (b.act === 'slam') {
        // tell: it puffs up and rises, then drops like a stone; cream waves run along the floor
        if (b.first) b.face();
        if (b.at < 0.8) { b.pose = 'puff'; b.puff = approach(b.puff, 1, dt * 2); b.y = approach(b.y, hy - 2.5 * TS, 6 * TS * dt); b.vx = 0; }
        else { b.pose = 'slam'; b.puff = approach(b.puff, 0.15, dt * 4); b.fall(dt); if (b.onGround) { g.shake(7); Sound.play('stomp', { pitch: 0.5 }); for (const d of [-1, 1]) tourFire(g, b.cx + d * (b.w / 2 + 8), b.floorY - 12, { kind: 'cream', vx: d * 4.4 * TS, w: 22, h: 22, ground: true, life: 3, col: '#fff8e8', art: creamArt }); b.go('down'); } }
        if (b.at > 3) b.go('walk');
      }
      else if (b.act === 'down') { b.pose = 'float'; b.vx = 0; b.fall(dt); if (b.at > 0.5) b.go('rise'); }
      else if (b.act === 'macarons') {
        b.pose = 'puff'; b.hover(dt, hy); b.puff = approach(b.puff, 0.9, dt * 2);
        if (b.first) { b.n = 0; say(g, b, 'MACARONS!', MAC[2]); }
        if (b.at > 0.5 + b.n * 0.4 && b.n < 4) { b.n++; const dx = p ? p.cx - b.cx : -100; tourFire(g, b.cx, b.y + 8, { kind: 'macaron', vx: clamp(dx * 0.9, -6 * TS, 6 * TS), vy: -9 * TS, grav: PHYS.gDown * 0.5, w: 14, h: 12, life: 3, thru: true, stompable: true, col: MAC[b.n % 6], art: macaronArt }); Sound.play('throw', { pitch: 0.8, vol: 0.5 }); }
        if (b.at > 2.3) b.go('walk');
      }
      else if (b.act === 'wall') { b.pose = 'float'; b.hover(dt, hy); if (b.first) this.wall(b); if (b.at > 0.8) b.go('walk'); }
      else if (b.act === 'collapse') { b.vx = 0; b.pose = 'flat'; b.puff = 0; b.fall(dt); if (b.at > 2.2) b.go('rise'); }
      else if (b.act === 'rise') { b.pose = 'float'; b.vx = 0; b.puff = approach(b.puff, 0.5, dt); b.hover(dt, hy); if (b.at > 0.8) b.go('walk'); }
    },
    hurt(b) { const g = b.g; b.go('collapse'); say(g, b, pick(['MON DIEU!', 'MY BEAUTIFUL CRUST!', 'SACRÉ SOUFFLÉ!']), '#ffd84a'); g.burst(b.cx, b.y, 24, '#fff4d0', 'confetti'); g.shake(5); Sound.play('splat', { pitch: 0.5 }); },
    phase(b, n) {
      const g = b.g; this.hurt(b);
      if (n === 2) { g.bannerText = 'MERINGUE WALLS GO UP!'; g.bannerT = 2.4; say(g, b, 'I PIPE MY OWN WALLS!', '#ffffff'); }
      else if (n === 3) { b.decoyT = 3.5; this.decoy(b, -1); this.decoy(b, 1); g.bannerText = 'THREE SOUFFLÉS! ONLY ONE IS REAL'; g.bannerT = 2.6; say(g, b, 'WHICH ONE IS ME? HA!', '#ffd84a'); g.toast('THE MIRRORS SHOW THE REAL ONE'); }
    },
    lastHit(b) { const g = b.g; b.go('deflate'); b.vuln = false; b.sighed = false; for (const e of g.entities) if (e instanceof FrDecoy) e.pop('POP!'); g.bannerText = 'LE GRAND DÉFLATION!'; g.bannerT = 2.6; K.sfx('whistle', 'powerdown', { vol: 0.7, pitch: 0.5 }); g.shake(6); return true; },
    draw(b, ctx, t) {
      const P = b.pose;
      souffleArt(ctx, b.cx, b.y + b.h, t, { puff: b.puff || 0, flat: P === 'flat', dir: b.dir, face: P === 'scared' ? 'scared' : P === 'deflate' ? 'sad' : 'angry', hatSpin: b.hatSpin, hat: P !== 'flat' });
      if (P === 'flat') TourKit.dizzy(ctx, b.cx, b.y + b.h - 50, t);
      if (P === 'scared') { ctx.fillStyle = '#8ad8ff'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(b.cx + 28 + k * 6, b.y + 10 + ((t * 40 + k * 13) % 30), 2.5, 4, 0, 0, TAU); ctx.fill(); } }
    }
  }
};

/* ---------------- music: a musette waltz (accordion, upright bass, brushes) ---------------- */
const tracks = {
  tour_fr: {
    bpm: 168, bpb: 3, bars: 16, rv: 0.25, dl: 0.06, hx: 0.06,
    ch: 'Am Am E7 E7 E7 E7 Am Am Dm Dm Am Am E7 E7 Am A7',
    ld: 'E5:4 A5:4 C6:4 | B5:6 A5:2 G#5:4 | B5:4 E5:4 G#5:4 | B5:12 | D6:4 C6:4 B5:4 | G#5:6 F#5:2 E5:4 | C6:4 B5:4 A5:4 | E5:12 |' +
        'F5:4 A5:4 D6:4 | F6:6 E6:2 D6:4 | C6:4 E6:4 A5:4 | C6:12 | B5:4 G#5:4 E5:4 | D6:6 C6:2 B5:4 | A5:4 C6:4 E6:4 | A6:8 .:4',
    li: 'reed', lv: 0.15,
    bp: 'r...f...f...', bi: 'pluckb', bv: 0.28,
    ap: '....c...c...', ai: 'reed', av: 0.04, ao: 57,
    dr: ['k...........', '....g...g...', '..n...n...n.'], dv: 0.35
  },
  tour_fr_chase: {
    bpm: 176, bars: 8, rv: 0.2, hx: 0.06,
    ch: 'Dm A7 Dm A7 Gm Dm A7 Dm',
    ld: 'A5:2 D6:2 F6:2 A6:2 G6:2 F6:2 E6:4 | C#6:2 E6:2 G6:2 A6:2 G6:4 E6:4 | F6:2 E6:2 D6:2 A5:2 D6:4 F6:4 | E6:8 A5:8 |' +
        'Bb5:2 D6:2 G6:2 Bb6:2 A6:2 G6:2 F6:4 | F6:2 E6:2 D6:2 A5:2 F5:4 A5:4 | G5:2 A5:2 C#6:2 E6:2 G6:4 E6:4 | D6:12 .:4',
    li: 'reed', lv: 0.15,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'pluckb', bv: 0.3,
    ap: '..c...c...c...c.', ai: 'pluck', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.42
  },
  tour_fr_night: {
    bpm: 92, bpb: 3, bars: 8, rv: 0.55, dl: 0.2, sw: 0.1,
    ch: 'Fmaj7 Em7 Dm7 G7 Cmaj7 Am7 Dm7 G7',
    ld: 'E5:6 A5:3 G5:3 | D5:9 .:3 | C5:3 F5:3 A5:3 C6:3 | B5:12 | E5:6 G5:3 B5:3 | C6:9 B5:3 | A5:3 F5:3 D5:3 F5:3 | G5:12',
    li: 'vibes', lv: 0.14,
    bp: 'r.....f.....', bi: 'sub', bv: 0.24,
    ap: '0..1..2..3..', ai: 'piano', av: 0.04, ao: 60,
    dr: ['k...........', '......g.....', '..n.....n...'], dv: 0.3
  },
  tour_fr_boss: {
    bpm: 150, bars: 8, rv: 0.2,
    ch: 'Gm D7 Gm D7 Eb Cm D7 D7',
    ld: 'G5:2 Bb5:2 D6:2 G6:2 F#6:2 D6:2 A5:4 | F#5:2 A5:2 C6:2 D6:2 C6:4 A5:4 | G5:2 D5:2 G5:2 Bb5:2 D6:4 G6:4 | F#6:8 D6:8 |' +
        'Eb6:2 D6:2 C6:2 Bb5:2 G5:4 Bb5:4 | C6:2 Bb5:2 G5:2 Eb5:2 C5:4 G5:4 | A5:2 C6:2 F#6:2 A6:2 G6:4 F#6:4 | D6:12 .:4',
    li: 'reed', lv: 0.16, hx: 0.08,
    bp: 'r-.r-.r-or-.r-o.', bi: 'sawb', bv: 0.28,
    ap: 'c-.c-.c-c-.c-.c-', ai: 'hpsi', av: 0.04, ao: 55,
    dr: ['k...k...k...k...', '....s.......s.s.', 'h.h.h.h.h.h.h.h.', 'x...............'], dv: 0.45
  }
};

/* ---------------- the country ---------------- */
Tour.country({
  id: 'fr', colors: COL, tagline: 'Croissants, crêpe pans and a tower made of iron lace',
  themes, painters, dyn, decor, decorLights, beatArt, platforms, enemies, entities, pieces: P, boss, power, tracks,
  music: { level: 'tour_fr', boss: 'tour_fr_boss' },
  landmark: 'the iron tower',
  arrival: 'Bonjour, Brady! The Baron wants the iron tower for his shelf. I hid his ladder. Find his soufflé chef! ♥ C',
  emblem(ctx, x, y, r) { ctx.save(); ctx.translate(x, y + r * 0.9); ctx.scale(r / 14, r / 14); latticeTower(ctx, 0, 0, 22, '#ffffff', false); ctx.restore(); },
  coin: { name: 'MACARON', draw(ctx, x, y) {
    const c = '#ff9ab8';
    ctx.fillStyle = shade(c, -0.15); ctx.beginPath(); ctx.ellipse(x, y + 3, 8, 3.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff4e0'; ctx.fillRect(x - 7, y - 1, 14, 3);
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y - 3, 8, 4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(x - 3, y - 4.5, 3, 1.2, -0.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffd86a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(x, y, 8.5, 7.5, 0, 0, TAU); ctx.stroke();
  } },
  star: { name: 'GOLDEN CROISSANT', draw(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y + 2); ctx.rotate(Math.sin(t * 3) * 0.2);
    for (let k = 0; k < 5; k++) { const a = -Math.PI * 0.85 + k * Math.PI * 0.425; ctx.fillStyle = k % 2 ? '#ffe070' : '#f0b830'; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 9, Math.sin(a) * 5, 5.5, 4.5, a, 0, TAU); ctx.fill(); }
    ctx.restore();
  } },
  // the levels are added by 29_tour_fr_levels.js (Tour.amend)
  levels: []
});
})();
