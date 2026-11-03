/* ============================================================
   MEXICO (world 1) — reference country for the world tour.
   1-1 Mercado Mayhem      run    bouncy market awnings, rolling watermelons, fountain jets
   1-2 Xochimilco Float    ride   ride a painted trajinera: posts to hop, axolotls, herons
   1-3 Cenote Dive         swim   a flooded limestone cave: roots, currents, light shafts
   1-4 Volcán Escape       climb  climb out of a volcano while the lava rises
   1-5 Hacienda Fiesta     castle swinging piñatas, candy cannons; boss El Gran Piñatón
   ============================================================ */
(() => {
const COL = { a: '#ff3d8b', b: '#18c2c2', c: '#ffb81a' };
const PAPEL = ['#ff3d8b', '#ffb81a', '#18c2c2', '#8a4aff', '#5ad04a', '#ff6a3a'];
const K = TourKit;

/* ---------------- background painters (seamless 1024-wide tiles) ---------------- */
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };
const painters = {
  // a snow-capped volcano on the horizon (or an active one when L.active)
  mxVolcano(ctx, L, rng, H) {
    for (const cx of [L.at || 620]) wrapDraw(cx - 360, 720, ox => {
      const x = ox + 360, b = L.base, top = b - (L.h || 150);
      ctx.fillStyle = vgrad(ctx, top, H, shade(L.color, 0.12), shade(L.color, -0.3));
      ctx.beginPath(); ctx.moveTo(x - 360, H); ctx.lineTo(x - 360, b); ctx.quadraticCurveTo(x - 140, b - 20, x - 44, top + 6); ctx.lineTo(x - 30, top); ctx.lineTo(x + 30, top); ctx.lineTo(x + 46, top + 8); ctx.quadraticCurveTo(x + 150, b - 16, x + 360, b); ctx.lineTo(x + 360, H); ctx.closePath(); ctx.fill();
      if (L.snow) { ctx.fillStyle = 'rgba(250,252,255,0.9)'; ctx.beginPath(); ctx.moveTo(x - 46, top + 9); ctx.lineTo(x - 30, top); ctx.lineTo(x + 30, top); ctx.lineTo(x + 47, top + 9); ctx.lineTo(x + 30, top + 26); ctx.lineTo(x + 14, top + 16); ctx.lineTo(x, top + 30); ctx.lineTo(x - 18, top + 18); ctx.lineTo(x - 32, top + 28); ctx.closePath(); ctx.fill(); }
      if (L.active) { const g = ctx.createRadialGradient(x, top, 4, x, top, 70); g.addColorStop(0, 'rgba(255,180,60,0.85)'); g.addColorStop(1, 'rgba(255,80,20,0)'); ctx.fillStyle = g; ctx.fillRect(x - 70, top - 70, 140, 120); ctx.strokeStyle = 'rgba(255,120,40,0.8)'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 10 + k * 10, top); ctx.quadraticCurveTo(x - 20 + k * 14, top + 50, x - 40 + k * 30, b - 10); ctx.stroke(); } }
    });
  },
  // two-story colonial facades in bright colors: arches, balconies, the odd tiled dome
  mxTown(ctx, L, rng, H) {
    const cols = ['#ff7a9a', '#ffc04a', '#4ac8c0', '#9a7aff', '#ff8a4a', '#7ad06a', '#f2e2c8'];
    let x = 0;
    while (x < BG_W) {
      const w = 60 + Math.floor(rng() * 50), h = 70 + Math.floor(rng() * 60), c = cols[Math.floor(rng() * cols.length)], top = L.base - h;
      const dome = rng() < 0.18;
      wrapDraw(x, w, xx => {
        ctx.fillStyle = shade(c, -0.08); ctx.fillRect(xx, top, w - 2, H - top);
        ctx.fillStyle = shade(c, 0.18); ctx.fillRect(xx, top, w - 2, 5);
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(xx + w - 8, top, 6, H - top);
        // windows with arches and little balconies
        for (let r = 0; r < 2; r++) for (let k = 0; k < Math.floor((w - 10) / 22); k++) {
          const wx = xx + 8 + k * 22, wy = top + 14 + r * 34;
          ctx.fillStyle = shade(c, -0.45); ctx.beginPath(); ctx.moveTo(wx, wy + 18); ctx.lineTo(wx, wy + 6); ctx.arc(wx + 6, wy + 6, 6, Math.PI, TAU); ctx.lineTo(wx + 12, wy + 18); ctx.fill();
          if (r === 0) { ctx.fillStyle = '#3a2a2a'; ctx.fillRect(wx - 2, wy + 17, 16, 2); for (let q = 0; q < 4; q++) ctx.fillRect(wx - 1 + q * 4, wy + 12, 1, 6); }
          if (rng() < 0.3) { ctx.fillStyle = PAPEL[Math.floor(rng() * PAPEL.length)]; ctx.beginPath(); ctx.arc(wx + 6, wy + 19, 3, 0, TAU); ctx.fill(); }
        }
        if (dome) { const dx = xx + w / 2; ctx.fillStyle = '#e8b838'; ctx.beginPath(); ctx.arc(dx, top, w * 0.32, Math.PI, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(120,60,20,0.5)'; ctx.lineWidth = 1.5; for (let q = -2; q <= 2; q++) { ctx.beginPath(); ctx.moveTo(dx + q * w * 0.12, top); ctx.quadraticCurveTo(dx + q * w * 0.05, top - w * 0.25, dx, top - w * 0.32); ctx.stroke(); } ctx.fillStyle = '#e8b838'; ctx.fillRect(dx - 1.5, top - w * 0.32 - 10, 3, 10); }
      });
      x += w;
    }
  },
  // strings of papel picado: cut-paper flags across the street
  mxPapel(ctx, L, rng, H) {
    for (let s = 0; s < 2; s++) {
      const y0 = L.base + s * 46, sag = 16 + rng() * 10;
      for (let x = s * 40; x < BG_W + s * 40; x += 96 + s * 32) {
        const yy = k => y0 + Math.sin(k * Math.PI) * sag;
        ctx.strokeStyle = 'rgba(60,40,60,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + 32, y0 + sag * 2, x + 64, y0); ctx.stroke();
        for (let k = 0; k < 4; k++) {
          const fx = x + 6 + k * 14, fy = yy((fx - x) / 64), c = PAPEL[(k + s * 2 + Math.floor(x / 64)) % PAPEL.length];
          ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 12, fy); ctx.lineTo(fx + 12, fy + 14); ctx.lineTo(fx + 9, fy + 12); ctx.lineTo(fx + 6, fy + 15); ctx.lineTo(fx + 3, fy + 12); ctx.lineTo(fx, fy + 14); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(fx + 3, fy + 4, 2, 2); ctx.fillRect(fx + 7, fy + 4, 2, 2); ctx.fillRect(fx + 5, fy + 8, 2, 2);
        }
      }
    }
  },
  // market stall roofs
  mxStalls(ctx, L, rng, H) {
    let x = 0;
    while (x < BG_W) {
      const w = 50 + rng() * 40, c = PAPEL[Math.floor(rng() * PAPEL.length)], top = L.base - 40 - rng() * 14;
      wrapDraw(x, w, xx => {
        ctx.fillStyle = shade(L.color, -0.1); ctx.fillRect(xx + 4, top + 12, w - 8, H - top);
        for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#fff4e0' : c; ctx.beginPath(); ctx.moveTo(xx + k * w / 5, top); ctx.lineTo(xx + (k + 1) * w / 5, top); ctx.lineTo(xx + (k + 1) * w / 5 + 2, top + 14); ctx.lineTo(xx + k * w / 5 + 2, top + 14); ctx.fill(); }
        for (let k = 0; k < 6; k++) { ctx.fillStyle = ['#ff6a3a', '#ffd84a', '#5ad04a', '#ff3d8b'][k % 4]; ctx.beginPath(); ctx.arc(xx + 10 + k * (w - 20) / 5, top + 30, 4, 0, TAU); ctx.fill(); }
      });
      x += w + 10 + rng() * 30;
    }
  },
  // slender ahuejote trees along the canal, with their reflections
  mxWillows(ctx, L, rng, H) {
    for (let x = 6; x < BG_W; x += 26 + rng() * 22) {
      const h = 120 + rng() * 80, top = L.base - h, w = 10 + rng() * 6;
      wrapDraw(x, w, xx => {
        ctx.fillStyle = shade(L.color, rng() * 0.15); ctx.beginPath(); ctx.ellipse(xx, top + h * 0.45, w, h * 0.5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = shade(L.color, -0.35); ctx.fillRect(xx - 1.5, L.base - 30, 3, 30);
        ctx.globalAlpha = 0.25; ctx.fillStyle = L.color; ctx.beginPath(); ctx.ellipse(xx, L.base + h * 0.25, w, h * 0.25, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      });
    }
    ctx.fillStyle = rgba(L.water || '#3ab0a0', 0.85); ctx.fillRect(0, L.base, BG_W, H - L.base);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; for (let i = 0; i < 40; i++) { const x = rng() * BG_W, y = L.base + 6 + rng() * 40; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10 + rng() * 20, y); ctx.stroke(); }
  },
  // parked trajineras with flower arches spelling nothing in particular
  mxBoats(ctx, L, rng, H) {
    for (let x = 0; x < BG_W; x += 150 + rng() * 60) {
      const c = PAPEL[Math.floor(rng() * PAPEL.length)];
      wrapDraw(x, 110, xx => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(xx, L.base - 14); ctx.lineTo(xx + 110, L.base - 14); ctx.lineTo(xx + 100, L.base); ctx.lineTo(xx + 10, L.base); ctx.fill();
        ctx.fillStyle = '#fff4d8'; ctx.fillRect(xx + 8, L.base - 46, 94, 8);
        ctx.fillStyle = shade(c, -0.2); ctx.fillRect(xx + 10, L.base - 40, 4, 26); ctx.fillRect(xx + 96, L.base - 40, 4, 26);
        for (let k = 0; k < 7; k++) { ctx.fillStyle = PAPEL[k % PAPEL.length]; ctx.beginPath(); ctx.arc(xx + 14 + k * 14, L.base - 48, 4, 0, TAU); ctx.fill(); }
      });
    }
  },
  // agave fields in rows
  mxAgave(ctx, L, rng, H) {
    ctx.fillStyle = shade(L.color, -0.15); ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let row = 0; row < 3; row++) for (let x = (row * 13) % 30; x < BG_W; x += 30) {
      const y = L.base + row * 12, s = 0.6 + row * 0.2;
      ctx.fillStyle = shade(L.color, row * 0.08);
      for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x - 2 * s, y); ctx.lineTo(x + k * 5 * s, y - (16 - Math.abs(k) * 3) * s); ctx.lineTo(x + 2 * s, y); ctx.fill(); }
    }
  },
  // the hacienda's arcade: arches, pillars and bougainvillea
  mxArches(ctx, L, rng, H) {
    const top = L.base - 120;
    ctx.fillStyle = L.color; ctx.fillRect(0, top, BG_W, H - top);
    for (let x = 0; x < BG_W; x += 64) {
      ctx.fillStyle = shade(L.color, -0.45); ctx.beginPath(); ctx.moveTo(x + 10, L.base); ctx.lineTo(x + 10, top + 50); ctx.arc(x + 32, top + 50, 22, Math.PI, TAU); ctx.lineTo(x + 54, L.base); ctx.fill();
      ctx.fillStyle = 'rgba(255,190,120,0.18)'; ctx.fillRect(x + 12, top + 60, 40, L.base - top - 60);
      for (let k = 0; k < 10; k++) { ctx.fillStyle = ['#ff3d8b', '#ff6ab0', '#c82a6a'][k % 3]; ctx.beginPath(); ctx.arc(x + 4 + rng() * 56, top + 12 + rng() * 22, 3 + rng() * 3, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#4a8a3a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + rng() * 64, top + 6 + rng() * 10, 4, 0, TAU); ctx.fill(); }
    }
    ctx.fillStyle = shade(L.color, 0.15); ctx.fillRect(0, top, BG_W, 6);
  },
  // limestone cenote walls with roots hanging down from the jungle above
  mxCenote(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, 0, H, shade(L.color, 0.1), shade(L.color, -0.4)); ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 12 + rng() * 24) { ctx.strokeStyle = rgba('#2a1a10', 0.5); ctx.lineWidth = 1 + rng() * 2; ctx.beginPath(); ctx.moveTo(x, 0); let yy = 0; const len = 60 + rng() * 160; while (yy < len) { yy += 8; ctx.lineTo(x + Math.sin(yy * 0.08 + x) * 4, yy); } ctx.stroke(); }
    for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.ellipse(rng() * BG_W, rng() * H, 10 + rng() * 30, 4 + rng() * 10, 0, 0, TAU); ctx.fill(); }
  }
};
const dyn = {
  // god rays slanting into the water
  mxShafts(ctx, L, camX, oy, S, W, t) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const x = ((i * 230 + 80 - camX * L.f) % BG_W + BG_W) % BG_W * S, a = 0.06 + 0.04 * Math.sin(t * 0.6 + i);
      const g = ctx.createLinearGradient(x, 0, x + 120 * S, 448 * S); g.addColorStop(0, `rgba(200,255,240,${a})`); g.addColorStop(1, 'rgba(200,255,240,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 50 * S, 0); ctx.lineTo(x + 170 * S, 448 * S); ctx.lineTo(x + 80 * S, 448 * S); ctx.closePath(); ctx.fill();
    }
  },
  // smoke rising from the volcano
  mxSmoke(ctx, L, camX, oy, S, W, t) {
    const cx = ((620 - camX * L.f) % BG_W + BG_W) % BG_W * S, ty = oy + (L.base - (L.h || 150) - L.top) * S;
    for (let i = 0; i < 9; i++) { const k = (t * 0.08 + i / 9) % 1; ctx.fillStyle = `rgba(70,50,60,${0.35 * (1 - k)})`; ctx.beginPath(); ctx.arc(cx + Math.sin(i * 2 + t * 0.3) * 30 * k * S + k * 60 * S, ty - k * 220 * S, (16 + k * 60) * S, 0, TAU); ctx.fill(); }
  }
};

/* ---------------- tiles ---------------- */
// warm cobblestones with a terracotta curb
const cobble = {
  style: 'mxCobble', cap: '#e86a3a', capHi: '#ffb07a', dirt: '#b8a088', dirt2: '#7a6450', rock: '#9a8470',
  paint(ctx, rng, o) {
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) {
      const x = k * 11 + (r % 2) * 5 - 3 + rng() * 2, y = 7 + r * 9 + rng() * 2;
      ctx.fillStyle = ['#c8b098', '#b09880', '#d0b8a0'][Math.floor(rng() * 3)]; ctx.beginPath(); ctx.ellipse(x + 5, y, 5, 3.6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 2, y - 2.5, 4, 1);
    }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#c84a2a'; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.fillStyle = '#ff8a5a'; ctx.fillRect(x0, 0, x1 - x0, 2);
    ctx.fillStyle = 'rgba(80,20,10,0.4)'; for (let x = x0 + 6; x < x1; x += 11) ctx.fillRect(x, 1, 1, 6);
  }
};
// a little paper piñata for the item block
function pinataBlock(ctx, th, f) {
  const cols = ['#ff3d8b', '#ffb81a', '#18c2c2', '#8a4aff'];
  ctx.save(); ctx.shadowColor = 'rgba(255,200,90,0.85)'; ctx.shadowBlur = 4 + f * 1.5;
  ctx.fillStyle = cols[0]; rr(ctx, 2, 3, TS - 4, TS - 5, 5); ctx.fill(); ctx.restore();
  // fringed paper stripes
  for (let r = 0; r < 4; r++) { ctx.fillStyle = cols[(r + 1) % 4]; for (let x = 3; x < TS - 3; x += 3) { ctx.beginPath(); ctx.moveTo(x, 5 + r * 6); ctx.lineTo(x + 3, 5 + r * 6); ctx.lineTo(x + 1.5, 10 + r * 6); ctx.fill(); } }
  ctx.strokeStyle = '#7a1a3a'; ctx.lineWidth = 1.2; rr(ctx, 2, 3, TS - 4, TS - 5, 5); ctx.stroke();
  // the little cones on top + streamers
  for (const cx of [9, 23]) { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(cx - 3, 4); ctx.lineTo(cx + 3, 4); ctx.lineTo(cx, -3); ctx.fill(); ctx.strokeStyle = cols[(cx + f) % 4]; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx, -3); ctx.quadraticCurveTo(cx + 3, -6 + f, cx + 5, -2); ctx.stroke(); }
  const sx = -8 + f * 12; ctx.save(); rr(ctx, 2, 3, TS - 4, TS - 5, 5); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + 5, 0); ctx.lineTo(sx - 5, TS); ctx.lineTo(sx - 10, TS); ctx.fill(); ctx.restore();
}
function pinataUsed(ctx) {
  ctx.fillStyle = '#c8a888'; rr(ctx, 2, 4, TS - 4, TS - 6, 5); ctx.fill();
  ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(8, 4); ctx.lineTo(14, 14); ctx.lineTo(10, 18); ctx.lineTo(18, 24); ctx.lineTo(13, 4); ctx.fill();
}
const terracottaBrick = { style: 'brick', c1: '#e07a42', c2: '#b04a24', mortar: '#f4dcbc' };
const adobe = { c1: '#e8be86', c2: '#b07a44' };

/* ---------------- themes ---------------- */
const baseTheme = {
  ground: cobble, brick: terracottaBrick, hard: adobe, semi: { style: 'wood', c1: '#c8783a', c2: '#8a4a1c' },
  pillar: { c1: '#f2a84a', c2: '#b8682a', cap: '#ffe0a0', style: 'column' }, accent: COL.a,
  qblockArt: pinataBlock, usedArt: pinataUsed, tint: {}, bloom: 0.16
};
const themes = {
  mx_mercado: Object.assign({}, baseTheme, {
    name: 'Mercado Mayhem', music: 'tour_mx', particles: 'confetti',
    sky: ['#2ab8e8', '#86dcf2', '#fff0c8'], horizonGlow: '#ffe0a0',
    celestial: { type: 'sun', x: 0.82, y: 0.18, r: 38, color: '#fff8dc', glow: '#ffd27a' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'mxVolcano', color: '#8aa0c8', base: 300, h: 150, f: 0.03, blur: true, snow: true },
      { kind: 'mxTown', color: '#ffb07a', base: 372, f: 0.14 },
      { kind: 'mxPapel', color: '#000000', base: 70, f: 0.32 },
      { kind: 'mxStalls', color: '#8a5a3a', base: 375, f: 0.45 }
    ],
    fog: '#ffe8d0', decor: ['mxNopal', 'mxPots', 'mxCrates', 'mxLamp', 'mxPots', 'mxAgaveP']
  }),
  mx_canal: Object.assign({}, baseTheme, {
    name: 'Xochimilco', music: 'tour_mx', particles: 'petals',
    sky: ['#48b8f0', '#a8e4ff', '#f8ffe8'], horizonGlow: '#e8ffd0',
    celestial: { type: 'sun', x: 0.2, y: 0.22, r: 34, color: '#fffbe8', glow: '#fff0a8' }, stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'mxVolcano', color: '#9ab0c8', base: 300, h: 120, f: 0.02, blur: true, snow: true, at: 300 },
      { kind: 'mxWillows', color: '#3a8a4a', base: 360, f: 0.12, water: '#3ab0a0' },
      { kind: 'mxBoats', color: '#000000', base: 400, f: 0.3 }
    ],
    fog: '#d8fff0', liquid: 'canal', decor: ['mxFlowers']
  }),
  mx_cenote: Object.assign({}, baseTheme, {
    name: 'Cenote', music: 'tour_mx_deep', particles: 'bubbles',
    sky: ['#2aa8b8', '#0a6a7a', '#04303a'], horizonGlow: '#5affe0', underwater: true,
    celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'mxCenote', color: '#2a7a7a', base: 0, f: 0.08, dyn: 'mxShafts' }, { kind: 'stalagmites', color: '#0e4a50', base: 420, f: 0.3, crystals: '#5affe0' }],
    fog: '#3ad8c8',
    ground: { style: 'mineral', cap: '#e8dcc0', capHi: '#ffffff', dirt: '#b8a888', dirt2: '#7a6a58', rock: '#d0c4a8' },
    hard: { c1: '#d8ccb0', c2: '#9a8a70' }, darkness: 0.18
  }),
  mx_volcan: Object.assign({}, baseTheme, {
    name: 'El Volcán', music: 'tour_mx_volcan', particles: 'embers',
    sky: ['#2a0a1a', '#8a2a1a', '#ff8a3a'], horizonGlow: '#ff6a2a',
    celestial: { type: 'none' }, stars: 0.3,
    layers: [
      { kind: 'mxVolcano', color: '#3a1a1a', base: 330, h: 190, f: 0.03, active: true, dyn: 'mxSmoke' },
      { kind: 'mxAgave', color: '#3a2a20', base: 372, f: 0.2 }
    ],
    fog: '#ff7a3a',
    ground: { style: 'basalt', cap: '#4a3a3a', capHi: '#8a6a5a', dirt: '#3a2a2a', dirt2: '#1a1010', rock: '#5a4040' },
    hard: { c1: '#5a4444', c2: '#2a1a1a' }, semi: { style: 'wood', c1: '#6a4a3a', c2: '#3a2418' }, liquid: 'lava', darkness: 0.12
  }),
  mx_hacienda: Object.assign({}, baseTheme, {
    name: 'Hacienda', music: 'tour_mx', particles: 'confetti',
    sky: ['#2a1a4a', '#c84a7a', '#ffb06a'], horizonGlow: '#ffb06a',
    celestial: { type: 'moon', x: 0.15, y: 0.18, r: 22, color: '#fff4e0', glow: '#ffc0a0' }, stars: 0.6,
    layers: [{ kind: 'mxVolcano', color: '#5a3a6a', base: 290, h: 110, f: 0.02, blur: true, snow: true, at: 760 }, { kind: 'mxArches', color: '#f2d8b0', base: 360, f: 0.15 }],
    fog: '#ff9a7a', darkness: 0.1, decor: ['mxPots', 'mxLamp', 'mxNopal', 'mxPots']
  })
};
themes.mx_hacienda_in = Object.assign({}, themes.mx_hacienda, { name: 'Hacienda Patio' });

/* ---------------- decor ---------------- */
const decor = {
  mxNopal(ctx, x, y) {
    const pad = (px, py, w, h, a) => { ctx.save(); ctx.translate(px, py); ctx.rotate(a); ctx.fillStyle = '#4a9a4a'; ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 4; k++) ctx.fillRect(-w * 0.5 + k * w * 0.35, -h * 0.3 + (k % 2) * h * 0.4, 1, 1); ctx.restore(); };
    ctx.fillStyle = '#b06a3a'; ctx.fillRect(x - 9, y - 10, 18, 10);
    pad(x, y - 22, 8, 12, 0); pad(x - 9, y - 38, 6, 9, -0.5); pad(x + 8, y - 36, 6, 9, 0.5);
    ctx.fillStyle = '#ff3d8b'; ctx.beginPath(); ctx.arc(x + 9, y - 45, 2.5, 0, TAU); ctx.fill();
  },
  mxAgaveP(ctx, x, y) { ctx.fillStyle = '#6aa88a'; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + k * 7, y - 26 + Math.abs(k) * 5); ctx.lineTo(x + 3, y); ctx.fill(); } },
  mxPots(ctx, x, y) {
    for (const [dx, s, c] of [[-8, 1, '#c8642a'], [7, 0.8, '#a84a20']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + dx, y - 9 * s, 8 * s, 9 * s, 0, 0, TAU); ctx.fill(); ctx.fillRect(x + dx - 4 * s, y - 20 * s, 8 * s, 4 * s); ctx.fillStyle = '#fff2d8'; ctx.fillRect(x + dx - 7 * s, y - 11 * s, 14 * s, 2); }
  },
  mxCrates(ctx, x, y) {
    ctx.fillStyle = '#c8a06a'; ctx.fillRect(x - 13, y - 14, 26, 14); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1; ctx.strokeRect(x - 13, y - 14, 26, 14);
    const f = ['#ff6a3a', '#ffd84a', '#5ad04a', '#ff3d8b']; for (let k = 0; k < 5; k++) { ctx.fillStyle = f[k % 4]; ctx.beginPath(); ctx.arc(x - 9 + k * 4.5, y - 16, 3.2, 0, TAU); ctx.fill(); }
  },
  mxLamp(ctx, x, y, t) {
    ctx.fillStyle = '#2a2026'; ctx.fillRect(x - 2, y - 70, 4, 70); ctx.fillRect(x - 6, y - 4, 12, 4);
    ctx.fillStyle = '#3a3036'; ctx.beginPath(); ctx.moveTo(x - 7, y - 70); ctx.lineTo(x + 7, y - 70); ctx.lineTo(x + 5, y - 84); ctx.lineTo(x - 5, y - 84); ctx.fill();
    ctx.fillStyle = '#ffe2a0'; ctx.fillRect(x - 4, y - 82, 8, 10);
  },
  mxFlowers(ctx, x, y) { for (let k = 0; k < 6; k++) { ctx.fillStyle = PAPEL[k % PAPEL.length]; ctx.beginPath(); ctx.arc(x - 10 + k * 4, y - 4 - (k % 2) * 3, 3, 0, TAU); ctx.fill(); } },
  // a market stall: striped awning (its top is a bouncy one-way platform)
  mxStall(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2, c = PAPEL[d.seed % PAPEL.length];
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x0 + 4, y - h, 4, h); ctx.fillRect(x0 + w - 8, y - h, 4, h);
    ctx.fillStyle = '#c8945a'; ctx.fillRect(x0 + 2, y - 26, w - 4, 26); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x0 + 2, y - 26, w - 4, 3);
    for (let k = 0; k < 7; k++) { ctx.fillStyle = ['#ff6a3a', '#ffd84a', '#5ad04a', '#ff3d8b', '#ff9a2a'][(k + d.seed) % 5]; ctx.beginPath(); ctx.arc(x0 + 8 + k * (w - 16) / 6, y - 30, 4.5, 0, TAU); ctx.fill(); }
    const sq = d.squash || 0;
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#fff4e0' : c; ctx.beginPath(); ctx.moveTo(x0 + k * w / 6, y - h + sq); ctx.lineTo(x0 + (k + 1) * w / 6, y - h + sq); ctx.lineTo(x0 + (k + 1) * w / 6 + 3, y - h + 18); ctx.lineTo(x0 + k * w / 6 + 3, y - h + 18); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = shade(c, -0.25); for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x0 + k * w / 6 + w / 12 + 3, y - h + 18, w / 12, 0, Math.PI); ctx.fill(); }
  },
  // the plaza fountain
  mxFountain(ctx, x, y, t, th, d) {
    const w = d.w;
    ctx.fillStyle = '#d8c8a8'; rr(ctx, x - w / 2, y - 26, w, 26, 4); ctx.fill();
    ctx.fillStyle = '#5ac8e0'; ctx.fillRect(x - w / 2 + 6, y - 24, w - 12, 8);
    ctx.fillStyle = '#c8b898'; ctx.fillRect(x - 8, y - 60, 16, 36); ctx.beginPath(); ctx.ellipse(x, y - 60, 24, 6, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const jx of d.jets || []) for (let k = 0; k < 8; k++) { const ph = (t * 1.5 + k / 8) % 1; ctx.fillStyle = `rgba(180,240,255,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.arc(jx + Math.sin(k + t * 3) * 4, y - 26 - ph * d.jetH, 3 + ph * 4, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // a stone footbridge over the canal
  mxBridge(ctx, x, y, t, th, d) {
    const w = d.w, x0 = x - w / 2;
    ctx.fillStyle = '#c8b8a0'; ctx.beginPath(); ctx.moveTo(x0, y - d.h); ctx.lineTo(x0 + w, y - d.h); ctx.lineTo(x0 + w, y); ctx.lineTo(x0 + w - 14, y); ctx.quadraticCurveTo(x, y - d.h * 0.55, x0 + 14, y); ctx.lineTo(x0, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a89878'; ctx.fillRect(x0, y - d.h, w, 6);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = PAPEL[k % PAPEL.length]; ctx.beginPath(); ctx.arc(x0 + 10 + k * (w - 20) / 5, y - d.h - 4, 3, 0, TAU); ctx.fill(); }
  },
  // a flower arch over the canal
  mxArch(ctx, x, y, t, th, d) {
    const w = d.w, x0 = x - w / 2;
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x0, y - d.h, 4, d.h); ctx.fillRect(x0 + w - 4, y - d.h, 4, d.h);
    for (let k = 0; k <= 16; k++) { const a = Math.PI + k / 16 * Math.PI, fx = x + Math.cos(a) * w / 2, fy = y - d.h + Math.sin(a) * 18; ctx.fillStyle = PAPEL[k % PAPEL.length]; ctx.beginPath(); ctx.arc(fx, fy, 4.5, 0, TAU); ctx.fill(); }
  },
  // a mooring post sticking out of the canal
  mxPost(ctx, x, y) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 6, y - 32, 12, 80); ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x - 6, y - 32, 12, 4); ctx.fillStyle = '#d8c8a8'; ctx.fillRect(x - 7, y - 20, 14, 3); },
  // a candy cannon on the hacienda wall
  mxCannon(ctx, x, y, t, th, d) { ctx.fillStyle = '#3a2a3a'; rr(ctx, x - 14, y - 16, 28, 16, 4); ctx.fill(); ctx.fillStyle = '#5a3a5a'; ctx.save(); ctx.translate(x, y - 14); ctx.rotate(d.dir > 0 ? 0 : Math.PI); rr(ctx, 0, -6, 22, 12, 4); ctx.fill(); ctx.fillStyle = COL.a; ctx.fillRect(16, -6, 4, 12); ctx.restore(); }
};

/* ---------------- enemies ---------------- */
const pepperArt = (ctx, e, x, y, m) => {
  const sq = m === 'flat' ? 0.4 : 1, hop = m === 'hop';
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, 1);
  ctx.fillStyle = '#2a8a2a'; ctx.beginPath(); ctx.moveTo(-6, -22 * sq); ctx.quadraticCurveTo(-10, -8 * sq, -2, 0); ctx.quadraticCurveTo(10, -2 * sq, 8, -14 * sq); ctx.quadraticCurveTo(6, -24 * sq, -6, -22 * sq); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-3, -15 * sq, 1.5, 5 * sq, 0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5a7a2a'; ctx.fillRect(-4, -26 * sq, 4, 5); ctx.fillRect(-6, -27 * sq, 8, 2);
  if (m !== 'flat' && m !== 'ko') { K.eyes(ctx, 2, -15, 1, 3, 2.4, true); ctx.strokeStyle = '#1a3a1a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(3, -9, 2.5, 0.1, Math.PI - 0.1); ctx.stroke(); }
  if (hop) { ctx.fillStyle = 'rgba(255,120,40,0.8)'; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(0, 7 + Math.random() * 3); ctx.lineTo(3, 0); ctx.fill(); }
  ctx.restore();
};
const eloteArt = (ctx, e, x, y, m, t) => {
  const sq = m === 'flat' ? 0.35 : 1;
  ctx.save(); ctx.translate(x, y);
  if (m !== 'flat' && m !== 'ko') K.feet(ctx, 0, 0, e.t, '#3a6a2a', 4, 6, m === 'stun');
  ctx.translate(0, -6);
  ctx.fillStyle = '#7ab04a'; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.quadraticCurveTo(-12, -14 * sq, -4, -26 * sq); ctx.lineTo(-6, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(9, 0); ctx.quadraticCurveTo(12, -14 * sq, 4, -26 * sq); ctx.lineTo(6, 0); ctx.fill();
  ctx.fillStyle = '#ffd84a'; rr(ctx, -6, -24 * sq, 12, 24 * sq, 6); ctx.fill();
  ctx.fillStyle = '#f0b81a'; for (let r = 0; r < 6; r++) for (let k = 0; k < 3; k++) ctx.fillRect(-5 + k * 4, (-22 + r * 3.6) * sq, 2.6, 2.4 * sq);
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 0, -16, e.dir, 2.6, 2.1, false);
  ctx.restore();
};
const burroArt = (ctx, e, x, y, m) => {
  const sq = m === 'flat' ? 0.4 : 1, hurt = e.hp < 2;
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, sq);
  const body = hurt ? '#c8a0ff' : '#ff9ac8';
  // paper-fringe legs
  for (const lx of [-9, -3, 4, 10]) { ctx.fillStyle = PAPEL[(lx + 20) % 6]; ctx.fillRect(lx - 2, -9, 4, 9 - Math.max(0, Math.sin(e.t * 10 + lx)) * 2); }
  ctx.fillStyle = body; rr(ctx, -14, -22, 26, 14, 6); ctx.fill();
  for (let r = 0; r < 3; r++) { ctx.fillStyle = PAPEL[(r + 2) % 6]; for (let k = -12; k < 11; k += 3) { ctx.beginPath(); ctx.moveTo(k, -20 + r * 4); ctx.lineTo(k + 3, -20 + r * 4); ctx.lineTo(k + 1.5, -17 + r * 4); ctx.fill(); } }
  ctx.fillStyle = body; rr(ctx, 8, -32, 9, 14, 4); ctx.fill(); rr(ctx, 12, -30, 10, 8, 4); ctx.fill();
  ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(9, -32); ctx.lineTo(11, -42); ctx.lineTo(13, -32); ctx.fill(); ctx.beginPath(); ctx.moveTo(13, -32); ctx.lineTo(16, -41); ctx.lineTo(16, -31); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(16, -27, 1.6, 0, TAU); ctx.fill();
  ctx.strokeStyle = PAPEL[0]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -18); ctx.quadraticCurveTo(-20, -14, -18, -6); ctx.stroke();
  if (hurt) { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(-2, -15, 2, 0, TAU); ctx.fill(); }
  ctx.restore();
};
const xoloArt = (ctx, e, x, y, m, t) => {
  // a friendly hairless dog with a taco in its mouth (or wagging, once it's handed over)
  ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
  K.shadow(ctx, 0, 0, 14);
  ctx.fillStyle = '#4a4a5a';
  for (const lx of [-8, -3, 4, 9]) ctx.fillRect(lx - 1.5, -10, 3, 10);
  rr(ctx, -12, -20, 24, 11, 5); ctx.fill();
  ctx.beginPath(); ctx.ellipse(12, -24, 7, 6, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(9, -28); ctx.lineTo(8, -40); ctx.lineTo(14, -29); ctx.fill(); ctx.beginPath(); ctx.moveTo(14, -29); ctx.lineTo(18, -40); ctx.lineTo(17, -27); ctx.fill();
  ctx.strokeStyle = '#4a4a5a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-12, -16); ctx.quadraticCurveTo(-18, -24 + Math.sin(t * (m === 'wave' ? 18 : 6)) * 5, -16, -30); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(14, -26, 1.8, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(14.4, -26, 1, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff7a9a'; ctx.beginPath(); ctx.arc(18.5, -22, 1.5, 0, TAU); ctx.fill();
  ctx.fillStyle = COL.b; ctx.fillRect(4, -22, 10, 3);
  if (m !== 'wave') { ctx.save(); ctx.translate(22, -20); ctx.scale(0.55, 0.55); tacoShape(ctx, 0, 0, 0); ctx.restore(); }
  ctx.restore();
  if (m !== 'wave') { ctx.fillStyle = '#ffd84a'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', x, y - 46 + Math.sin(t * 5) * 2); }
};
const axolotlArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(m === 'up' ? -0.4 : 0.6);
  ctx.fillStyle = '#ffaacc'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 7, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-20, -6, -22, 2); ctx.quadraticCurveTo(-16, 4, -10, 3); ctx.fill();
  ctx.fillStyle = '#ff5a9a'; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(8 + k * 2, s * (6 + k * 1.5), 1.6, 4, s * (0.6 + k * 0.3), 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(9, -2, 1.4, 0, TAU); ctx.arc(9, 2, 1.4, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#c84a7a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(11, 0, 2, -1, 1); ctx.stroke();
  ctx.restore();
};
const heronArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const f = Math.sin(e.t * (m === 'swoop' ? 18 : 8));
  ctx.fillStyle = '#f4f4f8'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 6, m === 'swoop' ? 0.3 : 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(-14, -12 - f * 8); ctx.lineTo(4, -3); ctx.fill();
  ctx.strokeStyle = '#f4f4f8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, -2); ctx.quadraticCurveTo(16, -10, 14, -14); ctx.stroke();
  ctx.fillStyle = '#ffb81a'; ctx.beginPath(); ctx.moveTo(15, -15); ctx.lineTo(24, -13); ctx.lineTo(15, -12); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(14, -15, 1, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#3a3a4a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-6, 4); ctx.lineTo(-12, 12); ctx.moveTo(-3, 4); ctx.lineTo(-8, 12); ctx.stroke();
  ctx.restore();
};
const fishArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  ctx.fillStyle = '#e8e0f0'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 7, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-19, -7 + Math.sin(e.t * 10) * 2); ctx.lineTo(-19, 7 + Math.sin(e.t * 10) * 2); ctx.fill();
  ctx.fillStyle = 'rgba(160,140,200,0.5)'; for (let k = 0; k < 3; k++) ctx.fillRect(-6 + k * 5, -5, 2, 10);
  ctx.strokeStyle = '#a89ac8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10, 3); ctx.lineTo(16, 8); ctx.moveTo(10, 3); ctx.lineTo(17, 3); ctx.stroke();
  ctx.fillStyle = '#c8c0d8'; ctx.beginPath(); ctx.arc(8, -2, 2, 0, TAU); ctx.fill();
  ctx.restore();
};
const batArt = (ctx, e, x, y, m) => {
  // an alebrije-style bat: bright folk-art patterns
  ctx.save(); ctx.translate(x, y);
  const f = Math.sin(e.t * 14);
  for (const s of [-1, 1]) { ctx.fillStyle = s < 0 ? '#ff3d8b' : '#18c2c2'; ctx.beginPath(); ctx.moveTo(0, -2); ctx.quadraticCurveTo(s * 10, -10 - f * 6, s * 20, -4 - f * 8); ctx.quadraticCurveTo(s * 14, 0, s * 18, 4 - f * 4); ctx.quadraticCurveTo(s * 8, 2, 0, 3); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(s * 10, -2 - f * 3, 1.6, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#8a4aff'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffd84a'; for (let k = 0; k < 3; k++) ctx.fillRect(-1, -3 + k * 3, 2, 1.5);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-2.4, -3, 1.6, 0, TAU); ctx.arc(2.4, -3, 1.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(-2.4, -3, 0.8, 0, TAU); ctx.arc(2.4, -3, 0.8, 0, TAU); ctx.fill();
  ctx.restore();
};
const armadilloArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y);
  if (m === 'roll' || m === 'curl' || m === 'ko') {
    ctx.translate(0, -11); ctx.rotate(e.t * 14 * e.dir);
    ctx.fillStyle = '#9a8a7a'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1.4; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(0, 0, 11, k * 1.57, k * 1.57 + 1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(k * 1.57) * 11, Math.sin(k * 1.57) * 11); ctx.stroke(); }
  } else {
    ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
    ctx.fillStyle = '#c8a888'; ctx.fillRect(-10, -6, 3, 6); ctx.fillRect(6, -6, 3, 6);
    ctx.fillStyle = '#9a8a7a'; ctx.beginPath(); ctx.ellipse(0, -9, 13, 9, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(-13, -9, 26, 4);
    ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1.2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 4.5, -17); ctx.lineTo(k * 5, -5); ctx.stroke(); }
    ctx.fillStyle = '#c8a888'; ctx.beginPath(); ctx.moveTo(12, -10); ctx.lineTo(20, -6); ctx.lineTo(12, -5); ctx.fill();
    ctx.beginPath(); ctx.ellipse(11, -15, 2, 4, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(14, -8.5, 1.1, 0, TAU); ctx.fill();
  }
  ctx.restore();
};
const lavaBlobArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 2, x, y, 16); g.addColorStop(0, '#fff2a0'); g.addColorStop(0.5, '#ff8a2a'); g.addColorStop(1, 'rgba(255,60,10,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#ff6a1a'; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill();
  K.eyes(ctx, x, y - 1, 0, 3, 1.8, true);
};
const salsaArt = (ctx, e, x, y, m) => {
  // a grumpy hot-sauce bottle that squirts salsa
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.35 : 1);
  ctx.fillStyle = '#d8281a'; rr(ctx, -8, -24, 16, 24, 4); ctx.fill();
  ctx.fillStyle = '#ff5a3a'; ctx.fillRect(-6, -22, 3, 18);
  ctx.fillStyle = '#d8281a'; ctx.fillRect(-3.5, -32, 7, 9);
  ctx.fillStyle = '#ffd84a'; ctx.fillRect(-4.5, -36 - (m === 'throw' ? 2 : 0), 9, 5);
  ctx.fillStyle = '#fff4d8'; rr(ctx, -7, -16, 14, 8, 2); ctx.fill();
  ctx.fillStyle = '#2a8a2a'; ctx.beginPath(); ctx.moveTo(-3, -12); ctx.quadraticCurveTo(0, -16, 3, -12); ctx.quadraticCurveTo(0, -10, -3, -12); ctx.fill();
  if (m !== 'flat') K.eyes(ctx, 0, -27, 1, 2.2, 1.5, true);
  ctx.restore();
};
function tacoShape(ctx, x, y, a) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.fillStyle = '#f2c060'; ctx.beginPath(); ctx.arc(0, 2, 10, Math.PI, TAU); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5ad04a'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(k * 3.5, -1, 2.4, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#e83a2a'; ctx.beginPath(); ctx.arc(-3, -2, 1.6, 0, TAU); ctx.arc(3, -1.5, 1.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8a4a2a'; ctx.fillRect(-6, -1, 12, 2);
  ctx.strokeStyle = '#c8902a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 2, 10, Math.PI, TAU); ctx.stroke();
  ctx.restore();
}
const enemies = {
  mxPepper: { cls: TourEnemy.make({ w: 16, h: 24, speed: 1.1, behavior: 'hop', hopV: 9.5, hopEvery: 1.1, art: pepperArt, burst: '#5ad04a' }), place: 'walk' },
  mxElote: { cls: TourEnemy.make({ w: 18, h: 30, speed: 0.9, behavior: 'walk', art: eloteArt, burst: '#ffd84a', onDefeat: e => e.g.burst(e.cx, e.cy, 14, '#fff8e0', 'confetti') }), place: 'walk' },
  mxBurro: { cls: TourEnemy.make({ w: 30, h: 30, speed: 1.0, behavior: 'walk', hp: 2, art: burroArt, onDefeat: e => { for (let k = 0; k < 6; k++) e.g.spawn(new PickPop(e.g, e.cx + (k - 2.5) * 6, e.y)); e.g.addPick(); e.g.burst(e.cx, e.cy, 24, '#ff9ac8', 'confetti'); } }), place: 'walk' },
  mxChihuahua: { cls: TourEnemy.make({ w: 22, h: 16, speed: 1.5, behavior: 'charge', range: 7, chargeSpeed: 7, windup: 0.35, art: (ctx, e, x, y, m) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
    const run = m === 'charge' ? Math.sin(e.t * 30) * 2 : Math.sin(e.t * 12);
    ctx.fillStyle = '#d8a86a'; for (const lx of [-7, -3, 3, 7]) ctx.fillRect(lx - 1, -6, 2, 6 - Math.abs(run) * (lx % 2 ? 1 : 0.5));
    rr(ctx, -9, -13, 17, 8, 4); ctx.fill();
    ctx.beginPath(); ctx.arc(9, -14, 5.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, -18); ctx.lineTo(3, -27); ctx.lineTo(9, -19); ctx.fill(); ctx.beginPath(); ctx.moveTo(11, -18); ctx.lineTo(15, -26); ctx.lineTo(13, -16); ctx.fill();
    ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(11, -15, 1.3, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(14.5, -12.5, 1.1, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#d8a86a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-9, -11); ctx.lineTo(-13, -17 + run); ctx.stroke();
    ctx.restore();
    if (m === 'notice') { ctx.fillStyle = '#ffffff'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('YIP!', x, y - 30); }
  }, onNotice: e => K.sfx('bump', null, { pitch: 2.2, vol: 0.4 }) }), place: 'walk' },
  mxAxolotl: { cls: TourLeaper.make({ w: 22, h: 14, jumpV: 21, every: 1.8, art: axolotlArt, splash: '#7ae0d0' }), place: 'here' },
  mxHeron: { cls: TourFlyer.make({ w: 28, h: 16, range: 3, speed: 0.8, swoop: true, art: heronArt }), place: 'fly' },
  mxFish: { cls: TourSwimmer.make({ w: 28, h: 14, speed: 1.5, range: 4, art: fishArt }), place: 'swim' },
  mxBat: { cls: TourFlyer.make({ w: 26, h: 16, range: 2.5, speed: 1.4, swoop: true, art: batArt }), place: 'fly' },
  mxArmadillo: { cls: TourEnemy.make({ w: 24, h: 18, speed: 1.0, behavior: 'roll', range: 9, rollSpeed: 6.5, rollT: 3, art: armadilloArt }), place: 'walk' },
  mxLava: { cls: TourLeaper.make({ w: 18, h: 18, jumpV: 17, every: 1.5, fiery: true, art: lavaBlobArt, splash: '#ff8a2a', glow: 'rgba(255,140,40,' }), place: 'here' },
  mxSalsa: { cls: TourEnemy.make({ w: 16, h: 30, speed: 0.6, behavior: 'throw', every: 2.2, range: 11, art: salsaArt, shoot: (e, p) => {
    tourFire(e.g, e.cx + e.dir * 8, e.y + 4, { kind: 'salsa', vx: e.dir * 4.2 * TS, vy: -6 * TS, grav: PHYS.gDown * 0.45, w: 12, h: 12, life: 3, col: '#e8281a', stompable: true, art: (ctx, s) => { ctx.fillStyle = '#e8281a'; ctx.beginPath(); ctx.arc(s.cx, s.cy, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff8a6a'; ctx.beginPath(); ctx.arc(s.cx - 2, s.cy - 2, 2, 0, TAU); ctx.fill(); } });
    K.sfx('splat', null, { vol: 0.35, pitch: 1.4 });
  } }), place: 'walk' }
};
const entities = {
  mxXolo: TourFriend.make({ w: 30, h: 30, give: 'sig:taco', line: '¡TACOS! TAP THROW', art: xoloArt }),
  // a cart that rolls watermelons down the street toward Brady
  mxMelonCart: class extends Ent {
    constructor(g, s) { super(g, s, 30, 26); this.period = s.period || 2.6; this.k = s.phase || 0; }
    update(dt) {
      this.t += dt; if (!this.g.onScreen(this, 6 * TS)) return;
      this.k += dt; if (this.k > this.period) { this.k = 0; this.g.spawn(new MxMelon(this.g, this.x - 6, this.y + this.h, -1)); }
    }
    draw(ctx) {
      const x = this.cx, y = this.y + this.h;
      ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x - 16, y - 18, 32, 12);
      for (let k = 0; k < 4; k++) { ctx.fillStyle = '#2a8a3a'; ctx.beginPath(); ctx.arc(x - 10 + k * 7, y - 21, 5, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#3a2a1a'; for (const wx of [x - 10, x + 10]) { ctx.beginPath(); ctx.arc(wx, y - 5, 5, 0, TAU); ctx.fill(); }
      ctx.fillStyle = COL.a; ctx.fillRect(x - 18, y - 30, 4, 24); ctx.fillRect(x - 18, y - 30, 36, 3);
    }
  },
  // a piñata swinging on a rope: don't get bonked
  mxSwinger: class extends Ent {
    constructor(g, s) { super(g, s, 26, 26); this.ax = s.x; this.ay = s.y - (s.rope || 4) * TS - TS; this.len = (s.rope || 4) * TS; this.amp = s.amp || 0.9; this.sp = s.speed || 1.6; this.ph = s.phase || 0; this.place(); }
    place() { const a = Math.sin(this.t * this.sp + this.ph) * this.amp; this.x = this.ax + Math.sin(a) * this.len - this.w / 2; this.y = this.ay + Math.cos(a) * this.len - this.h / 2; this.a = a; }
    update(dt) { this.t += dt; this.place(); }
    touchPlayer(p) { p.hurt(this); }
    draw(ctx) {
      ctx.strokeStyle = '#e8d8b8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(this.ax, this.ay); ctx.lineTo(this.cx, this.cy - 10); ctx.stroke();
      ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(this.a * 0.6);
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * TAU / 5; ctx.fillStyle = PAPEL[k % PAPEL.length]; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.35) * 8, Math.sin(a - 0.35) * 8); ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); ctx.lineTo(Math.cos(a + 0.35) * 8, Math.sin(a + 0.35) * 8); ctx.fill(); ctx.strokeStyle = PAPEL[(k + 2) % 6]; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 17, Math.sin(a) * 17); ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22 + 4); ctx.stroke(); }
      ctx.fillStyle = '#ff9ac8'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
      ctx.restore();
    }
  },
  // a candy cannon: fires round candies along the floor
  mxCannon: class extends Ent {
    constructor(g, s) { super(g, s, 28, 18); this.dirC = s.dir || -1; this.period = s.period || 2.8; this.k = s.phase || 0; }
    update(dt) {
      this.t += dt; if (!this.g.onScreen(this, 3 * TS)) return;
      this.k += dt;
      if (this.k > this.period) { this.k = 0; K.sfx('kick', null, { pitch: 0.7, vol: 0.5 }); this.g.burst(this.cx + this.dirC * 16, this.y + 4, 6, '#ffffff', 'dust');
        tourFire(this.g, this.cx + this.dirC * 18, this.y + 6, { kind: 'candy', vx: this.dirC * 4.6 * TS, w: 14, h: 14, life: 5, stompable: true, col: '#ff9ac8', art: (ctx, s, t) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(t * 8); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill(); ctx.strokeStyle = COL.a; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, 4); ctx.stroke(); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-11, -4); ctx.lineTo(-11, 4); ctx.fill(); ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(11, -4); ctx.lineTo(11, 4); ctx.fill(); ctx.restore(); } });
      }
    }
    draw(ctx) { Decor.mxCannon(ctx, this.cx, this.y + this.h, this.t, null, { dir: this.dirC }); }
  }
};
class MxMelon extends Ent {
  constructor(g, x, y, dir) { super(g, null, 24, 22); this.x = x - 12; this.y = y - 22; this.vx = dir * 3.4 * TS; this.dir = dir; this.enemy = true; this.rot = 0; }
  update(dt) {
    this.t += dt; if (this.knocked) return this.updateKnocked(dt);
    this.vy += PHYS.gDown * dt; const vx = this.vx;
    moveBody(this, this.g.area, dt, { semis: true });
    if (this.hitWall) { this.split(); return; }
    this.vx = vx; this.rot += this.vx * dt / 11;
    if (this.y > this.g.area.H * TS + 40 || !this.g.onScreen(this, 8 * TS)) this.remove = true;
  }
  split() { this.remove = true; this.dead = true; Sound.play('splat', { vol: 0.5 }); this.g.burst(this.cx, this.cy, 14, '#ff4a5a', 'spark'); this.g.burst(this.cx, this.cy, 6, '#2a8a3a', 'debris'); }
  hit(kind, src) { if (this.dead) return false; this.split(); this.g.addScore(100, this.cx, this.y); return true; }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(this.rot); ctx.fillStyle = '#2a8a3a'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 11, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#7ad06a'; ctx.lineWidth = 2; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.ellipse(k * 5, 0, 2.5, 10, 0, 0, TAU); ctx.stroke(); } ctx.restore(); }
}

/* ---------------- the signature power-up: TACO TOSS ---------------- */
class TacoShot extends Ent {
  constructor(g, x, y, dir) { super(g, null, 16, 12); this.x = x - 8; this.y = y - 6; this.vx = dir * 7.2 * TS; this.vy = -5.5 * TS; this.dir = dir; this.friendly = true; this.life = 2; }
  update(dt) {
    this.t += dt; this.life -= dt;
    this.vy += PHYS.gDown * 0.55 * dt;
    const vx = this.vx;
    moveBody(this, this.g.area, dt, { semis: true, platforms: this.g.platforms });
    if (this.onGround) { this.splat(true); return; }
    if (this.hitWall || this.life <= 0 || this.y > this.g.area.H * TS) { this.splat(false); return; }
    this.vx = vx;
    for (const e of this.g.entities) {
      if (!e.enemy || e.dead || e.remove || e.boss) continue;
      if (overlap(this, e)) { const r = e.hit('taco', this); if (r && !e.stunT) this.g.addScore(100, e.cx, e.y); this.splat(false); return; }
    }
    const b = this.g.boss;
    if (b && !b.dead && overlap(this, b)) { b.hit('disc', this); this.splat(false); }
  }
  splat(onGround) {
    this.remove = true; Sound.play('splat', { vol: 0.5 }); this.g.burst(this.cx, this.cy, 10, '#e8281a', 'spark');
    if (onGround) this.g.spawn(new SalsaSplat(this.g, this.cx, this.y + this.h));
  }
  draw(ctx) { tacoShape(ctx, this.cx, this.cy, this.t * 9 * this.dir); }
}
// a salsa puddle: enemies who walk into it get stunned
class SalsaSplat extends Ent {
  constructor(g, x, y) { super(g, null, 44, 10); this.x = x - 22; this.y = y - 10; this.life = 5; }
  update(dt) {
    this.t += dt; this.life -= dt; if (this.life <= 0) { this.remove = true; return; }
    for (const e of this.g.entities) if (e.enemy && !e.dead && !e.boss && e.stun && !(e.stunT > 0) && overlap(this, e)) e.stun(2.6);
  }
  draw(ctx) {
    const a = Math.min(1, this.life);
    ctx.fillStyle = `rgba(220,40,26,${0.85 * a})`; ctx.beginPath(); ctx.ellipse(this.cx, this.y + 8, 20, 4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(90,208,74,${0.9 * a})`; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(this.x + 8 + k * 9, this.y + 7, 1.8, 0, TAU); ctx.fill(); }
  }
}
const power = {
  id: 'taco', name: 'TACO TOSS', country: 'mx', hint: 'TAP THROW TO TOSS TACOS', time: 0, cooldown: 0.32,
  icon(ctx, x, y, t) { tacoShape(ctx, x, y + 2, Math.sin(t * 3) * 0.15); },
  action(p, g) {
    const n = g.entities.filter(e => e instanceof TacoShot && !e.remove).length;
    if (n >= 2) return false;
    g.spawn(new TacoShot(g, p.cx + p.facing * 12, p.y + (p.small ? 10 : 18), p.facing));
    Sound.play('throw', { pitch: 1.2, vol: 0.6 });
    return true;
  },
  drawOn(p, ctx, t) { if (Math.random() < 0.02) p.g.burst(p.cx, p.y + 6, 1, '#ffd84a', 'spark'); }
};

/* ---------------- set pieces ---------------- */
const P = {
  // the first street: Xolo the dog hands Brady a taco
  xolo(st, o) {
    const x = st.x; st.floor(x, x + 9);
    st.spawn('mxXolo', x + 6, st.gy - 1, {});
    st.decor('mxLamp', x + 1); st.decor('mxPots', x + 9);
    return x + 10;
  },
  // market stalls whose striped awnings bounce Brady high (hold jump to go higher)
  stalls(st, o) {
    const n = o.n || 3; let x = st.x;
    st.floor(x, x + n * 7 + 2);
    for (let k = 0; k < n; k++) {
      const sx = x + 1 + k * 7, ay = st.gy - 3;
      st.B.prop('mxStall', sx, ay, 5, 3, 'none', {});
      for (let q = 0; q < 5; q++) { st.B.set(sx + q, ay, T.SEMI); st.B.setHide(sx + q, ay, 1); st.B.setSurf(sx + q, ay, SURF.BOUNCE); }
      st.coins(sx + 1, sx + 3, ay - 6 - (k % 2) * 2);
      if (k === 1) st.gold(sx + 2, ay - 9, 'high');
      if (k < n - 1 && st.rng.chance(0.6)) st.enemy(st.pickEnemy(['mxBurro']), sx + 6, st.gy);
    }
    return x + n * 7 + 3;
  },
  // piñata blocks over the street with jalapeños hopping underneath
  pinatas(st, o) {
    const x = st.x, n = 9; st.floor(x, x + n);
    const y = st.gy - 4;
    st.block(x + 2, y, 'picks'); st.block(x + 3, y, null, T.BRICK); st.block(x + 4, y, 'power'); st.block(x + 5, y, null, T.BRICK); st.block(x + 6, y, 'pick');
    st.block(x + 4, y - 4, o.top || 'pick');
    st.enemy('mxPepper', x + 7, st.gy); st.enemy('mxPepper', x + 2, st.gy);
    return x + n + 1;
  },
  // a fruit cart up a short rise rolls watermelons at Brady
  melons(st, o) {
    const x = st.x; st.floor(x, x + 4);
    // a three-step rise
    for (let i = 0; i < 3; i++) { st.floor(x + 5 + i * 3, x + 7 + i * 3, st.gy - 1 - i); }
    const top = st.gy - 3;
    st.floor(x + 14, x + 26, top);
    st.spawn('mxMelonCart', x + 24, top - 1, { period: 2.4 });
    st.coins(x + 15, x + 22, top - 4);
    st.gold(x + 19, top - 5, 'risky');
    st.gy = top;
    return x + 27;
  },
  // the plaza: fountain jets lift Brady up to a balcony
  fountain(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 16);
    const fx = x + 3, w = 8, rise = Math.min(9, st.gy - 5);
    B.prop('mxFountain', fx, st.gy - 1, w, 1, 'none', { jets: [(fx + 2) * TS, (fx + 6) * TS], jetH: rise * TS * 0.9 });
    for (const jx of [fx + 1, fx + 5]) B.zone(jx, st.gy - rise, 2, rise - 1, 0, -120 * TS, 7.5 * TS, 'jet', { pull: 3 });
    // the balcony with goodies
    const by = st.gy - rise;
    for (let q = 0; q < 6; q++) B.set(x + 10 + q, by, T.SEMI);
    st.coins(x + 10, x + 15, by - 2); st.gold(x + 14, by - 3, 'must');
    st.decor('mxPots', x + 15);
    return x + 17;
  },
  // colorful flat rooftops with alleys between
  rooftops(st, o) {
    let x = st.x; const n = o.n || 3; st.floor(x, x + 1); x += 2;
    const cols = [T.HARD, T.HARD, T.HARD];
    for (let k = 0; k < n; k++) {
      const h = 2 + ((k + st.rng.int(0, 1)) % 3), w = 4 + st.rng.int(0, 2);
      st.pit(x, x + 1); x += 2;
      st.B.ground(x, x + w - 1, st.gy); st.B.fill(x, st.gy - h, x + w - 1, st.gy - 1, cols[k % 3]);
      st.coins(x, x + w - 1, st.gy - h - 2);
      if (k === 1) st.enemy('mxChihuahua', x + 2, st.gy - h, { edgeTurn: true });
      x += w;
    }
    st.pit(x, x + 1); x += 2;
    st.floor(x, x + 3);
    return x + 4;
  },
  // xochimilco: a mooring post to hop over
  posts(st, o) {
    const x = st.x; const B = st.B;
    B.fill(x, st.deck - 1, x, st.deck - 1, T.HARD); B.setHide(x, st.deck - 1, 1);
    B.decorAt('mxPost', x, st.deck, 0);
    st.arc(x - 1, x + 1, st.deck - 2, 1);
    return x + 6;
  },
  // a flower arch with coins up top
  arch(st, o) {
    const x = st.x, B = st.B, top = st.deck - 4;
    B.prop('mxArch', x, top + 1, 7, st.deck - top - 1, 'none', {});
    for (let q = 0; q < 7; q++) B.set(x + q, top, T.SEMI);
    st.coins(x + 1, x + 5, top - 2);
    if (o.gold) st.gold(x + 3, top - 3, 'high');
    return x + 8;
  },
  // axolotls leap out of the canal
  axolotls(st, o) {
    const x = st.x;
    for (let k = 0; k < (o.n || 2); k++) st.spawn('mxAxolotl', x + 2 + k * 4, st.H - 2, { delay: k * 0.7 });
    return x + (o.n || 2) * 4 + 2;
  },
  // herons swoop down from the trees
  herons(st, o) { const x = st.x; st.spawn('mxHeron', x + 4, st.deck - 6, { range: 3 }); st.coins(x + 1, x + 6, st.deck - 3); return x + 8; },
  // floating gardens: sinking flower rafts with goodies
  chinampa(st, o) {
    const x = st.x;
    st.spawn('fplat', x + 2, st.deck - 3, { pw: 3, skin: 'mxRaft' });
    st.coins(x + 1, x + 4, st.deck - 5);
    if (o.gold) st.gold(x + 3, st.deck - 6, 'risky');
    return x + 7;
  },
  // a stone footbridge to hop up onto
  bridge(st, o) {
    const x = st.x, B = st.B, by = st.deck - 4, w = 8;
    B.prop('mxBridge', x, by, w, st.deck - by, 'none', { h: (st.deck - by) * TS });
    for (let q = 0; q < w; q++) B.set(x + q, by, T.SEMI);
    st.coins(x + 1, x + w - 2, by - 2);
    if (o.enemy !== false) st.enemy('mxChihuahua', x + 4, by, { edgeTurn: true });
    if (o.gold) st.gold(x + w - 2, by - 3, 'high');
    return x + w + 2;
  },
  // a snack boat moored alongside: Xolo hands over tacos
  vendor(st, o) {
    const x = st.x, B = st.B, vy = st.deck - 3;
    for (let q = 0; q < 6; q++) B.set(x + q, vy, T.SEMI);
    B.prop('mxStall', x, vy - 3, 6, 3, 'none', {});
    st.spawn('mxXolo', x + 3, vy - 1, {});
    return x + 8;
  },
  // cenote: the ceiling drops into a low tunnel along the floor
  shaft(st, o) {
    const x = st.x, F = st.floorY;
    st.rock(x, 2, x + 11, F - 5);
    st.coins(x + 1, x + 10, F - 2);
    st.spawn('mxFish', x + 6, F - 2, { range: 3 });
    return x + 12;
  },
  // hanging roots: slip between them
  roots(st, o) {
    const x = st.x, B = st.B, F = st.floorY, n = o.n || 4;
    for (let k = 0; k < n; k++) { const rx = x + 2 + k * 4, len = 3 + ((k * 5) % 4); B.fill(rx, 2, rx, 2 + len, T.HARD); B.decorAt('mxRoot', rx, 3 + len, 0); st.coins(rx + 2, rx + 2, 4 + (k % 3) * 3); }
    st.rock(x + 3, F - 2, x + 5, F - 1); st.rock(x + 11, F - 3, x + 13, F - 1);
    if (o.fish !== false) st.spawn('mxFish', x + 8, F - 5, { range: 3 });
    return x + n * 4 + 3;
  },
  // a current pushes Brady along (or against him)
  current(st, o) {
    const x = st.x, B = st.B, F = st.floorY, w = o.w || 12, dir = o.dir || 1;
    B.zone(x, 5, w, 7, dir * 2.4 * TS, 0, 0, 'current');
    B.decorAt('mxCurrent', x + Math.floor(w / 2), 12, dir > 0 ? 1 : 2);
    st.coins(x + 1, x + w - 2, 8);
    st.rock(x, 2, x + w - 1, 3);
    st.rock(x, F - 2, x + w - 1, F - 1);
    return x + w + 1;
  },
  // a sunlit chamber with a postcard in a pocket up in the rock
  lightwell(st, o) {
    const x = st.x, B = st.B, F = st.floorY;
    B.decorAt('mxBeam', x + 5, F, 0);
    st.rock(x + 8, 2, x + 12, 9); st.water(x + 9, 4, x + 11, 6); st.water(x + 10, 7, x + 10, 9);
    st.gold(x + 10, 5, 'must');
    st.arc(x + 1, x + 7, 10, 4);
    st.spawn('mxFish', x + 4, 12, { range: 2 });
    return x + 13;
  },
  // stalagmites and stalactites in a slalom
  slalom(st, o) {
    const x = st.x, F = st.floorY;
    for (let k = 0; k < 4; k++) { const sx = x + 2 + k * 4; if (k % 2) st.rock(sx, 2, sx + 1, 9); else st.rock(sx, F - 6, sx + 1, F - 1); st.coins(sx, sx + 1, k % 2 ? 12 : 5); }
    return x + 19;
  },
  // volcano climb: ledges zig-zagging up the crater (each band ends on a full-width ledge)
  vledges(st, o) {
    const B = st.B, W = st.W, n = o.n || 4, mid = st.mid;
    let y = st.y;
    for (let k = 0; k < n; k++) {
      y = st.y - 3 * (k + 1);
      const left = (k + (o.flip ? 1 : 0)) % 2 === 0, x0 = left ? 2 : W - 9;
      if (o.crumble && k % 2) for (let q = 0; q < 7; q++) B.set(x0 + q, y, T.CRUMBLE); else B.fill(x0, y, x0 + 6, y, T.GROUND);
      st.coins(x0 + 1, x0 + 5, y - 2);
      if (k === 1 && o.enemy) st.enemy(o.enemy, x0 + 3, y, { edgeTurn: true });
      if (k < n - 1) for (let q = -2; q < 2; q++) B.set(mid + q, y - 2, T.SEMI);
    }
    st.top(y - 2);
  },
  // a steam vent carries Brady up a chimney; side ledges at the top
  vvent(st, o) {
    const B = st.B, W = st.W, h = o.h || 10, mid = st.mid;
    const y0 = st.y, y1 = y0 - h, cx = mid - 1;
    B.fill(2, y1, cx - 1, y1, T.GROUND); B.fill(cx + 3, y1, W - 3, y1, T.GROUND);
    B.zone(cx, y1 - 2, 3, h + 2, 0, -110 * TS, 7.2 * TS, 'steam', { pull: 3 });
    B.spawn('vent', cx + 1, y0 - 1, { w: 3, look: 'steam' });
    for (let y = y1 + 1; y < y0 - 1; y += 2) B.pickAt(cx + 1, y);
    st.gold(W - 5, y1 - 2, o.gold ? 'must' : 'high');
    st.top(y1 - 3, [[cx, cx + 2]]);
  },
  // armadillos roll along a long ledge
  vroll(st, o) {
    const B = st.B, W = st.W, mid = st.mid;
    const y = st.y - 3;
    B.fill(2, y, W - 3, y, T.GROUND);
    for (let q = mid - 2; q < mid + 2; q++) B.set(q, y, T.SEMI);
    st.enemy('mxArmadillo', W - 6, y, { edgeTurn: true });
    st.coins(4, W - 5, y - 2);
    st.top(y - 3);
  },
  // lava blobs leap from a basin between two ledges
  vblobs(st, o) {
    const B = st.B, W = st.W, mid = st.mid, y0 = st.y;
    for (let x = 8; x <= W - 9; x++) { B.set(x, y0 - 2, T.GROUND); B.set(x, y0 - 3, T.LAVA); }
    for (const x0 of [2, W - 7]) for (let q = 0; q < 5; q++) B.set(x0 + q, y0 - 3, T.SEMI);
    for (let x = 9; x <= W - 10; x += 3) B.set(x, y0 - 6, T.SEMI);
    st.spawn('mxLava', mid, y0 - 3, {});
    st.coins(9, W - 10, y0 - 8);
    st.top(y0 - 8);
  },
  // the hacienda: swinging piñatas over a long corridor
  swingers(st, o) {
    const x = st.x, n = o.n || 3; st.floor(x, x + n * 5 + 2);
    for (let k = 0; k < n; k++) st.spawn('mxSwinger', x + 3 + k * 5, st.gy - 1, { rope: 4, amp: 0.85, speed: 1.6 + k * 0.2, phase: k * 1.3 });
    st.coins(x + 1, x + n * 5, st.gy - 2);
    return x + n * 5 + 3;
  },
  // candy cannons fire along the floor: hop the candies or stomp them
  cannons(st, o) {
    const x = st.x; st.floor(x, x + 14);
    st.B.fill(x + 12, st.gy - 2, x + 13, st.gy - 1, T.HARD);
    st.spawn('mxCannon', x + 12, st.gy - 3, { dir: -1, period: 2.2 });
    st.semi(x + 4, x + 7, st.gy - 4); st.coins(x + 4, x + 7, st.gy - 6);
    st.enemy('mxSalsa', x + 9, st.gy);
    return x + 15;
  },
  // an upstairs balcony route with a hidden postcard
  balcony(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 14);
    B.fill(x + 2, st.gy - 3, x + 3, st.gy - 1, T.HARD);
    for (let q = 0; q < 8; q++) B.set(x + 4 + q, st.gy - 5, T.SEMI);
    st.block(x + 7, st.gy - 9, 'star');
    st.gold(x + 11, st.gy - 7, 'hidden');
    st.enemy('mxBurro', x + 9, st.gy);
    return x + 15;
  },
  // the boss courtyard: a fountain in the middle, two upper ledges
  arena_patio(st, o) {
    const B = st.B, { x0, w, GY } = o;
    for (let q = 0; q < 3; q++) { B.set(x0 + 4 + q, GY - 4, T.SEMI); B.set(x0 + w - 7 + q, GY - 4, T.SEMI); }
    B.prop('mxFountain', x0 + Math.floor(w / 2) - 2, GY - 1, 4, 1, 'none', { jets: [], jetH: 0 });
  }
};
// tiny extra decor used by the pieces
Object.assign(decor, {
  mxRoot(ctx, x, y) { ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + k * 3, y - 10); ctx.quadraticCurveTo(x + k * 6, y, x + k * 4, y + 12); ctx.stroke(); } },
  mxCurrent(ctx, x, y, t, th, d) { ctx.strokeStyle = 'rgba(220,255,250,0.35)'; ctx.lineWidth = 2; const dir = d.seed === 1 ? 1 : -1; for (let k = 0; k < 5; k++) { const ox = ((t * 80 * dir + k * 70) % 350 + 350) % 350 - 175; ctx.beginPath(); ctx.moveTo(x + ox, y - 80 - k * 18); ctx.lineTo(x + ox + 24 * dir, y - 80 - k * 18); ctx.lineTo(x + ox + 18 * dir, y - 84 - k * 18); ctx.stroke(); } },
  mxBeam(ctx, x, y, t) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(x, y - 420, x, y); g.addColorStop(0, 'rgba(220,255,240,0.35)'); g.addColorStop(1, 'rgba(220,255,240,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 30, y - 420); ctx.lineTo(x + 30, y - 420); ctx.lineTo(x + 90, y); ctx.lineTo(x - 50, y); ctx.fill(); ctx.restore(); }
});
const platforms = {
  // the painted trajinera with its flower arch
  mxTrajinera(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#2a7ad8'; ctx.beginPath(); ctx.moveTo(x - 10, y + 2); ctx.lineTo(x + w + 10, y + 2); ctx.lineTo(x + w - 4, y + 30); ctx.lineTo(x + 4, y + 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 6, y + 9, w + 12, 4); ctx.fillStyle = '#ff3d8b'; ctx.fillRect(x - 3, y + 16, w + 6, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x - 8 - i * 8 - (t * 40 % 8), y + 28 + Math.sin(t * 6 + i) * 1.5, 3 + i, 0, TAU); ctx.fill(); }
    // the arch
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x + 6, y - 74, 4, 74); ctx.fillRect(x + w - 10, y - 74, 4, 74);
    ctx.fillStyle = '#fff4d8'; rr(ctx, x + 2, y - 86, w - 4, 14, 4); ctx.fill();
    for (let k = 0; k < Math.floor(w / 10); k++) { ctx.fillStyle = PAPEL[k % PAPEL.length]; ctx.beginPath(); ctx.arc(x + 8 + k * 10, y - 79, 4.5, 0, TAU); ctx.fill(); }
    PlatformArt.deck(ctx, x - 6, y - 2, w + 12, '#c89a6a');
  },
  // a floating flower raft (sinks a moment after Brady lands on it)
  mxRaft(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#5a8a3a'; rr(ctx, x - 2, y, w + 4, 10, 4); ctx.fill();
    for (let k = 0; k < 6; k++) { ctx.fillStyle = PAPEL[k % PAPEL.length]; ctx.beginPath(); ctx.arc(x + 4 + k * (w - 8) / 5, y - 1, 3, 0, TAU); ctx.fill(); }
  }
};

/* ---------------- the boss: EL GRAN PIÑATÓN ---------------- */
// A giant star piñata. It spin-dashes across the courtyard (dizzy when it hits a wall:
// stomp its top), hops to make it rain candy, and later fires its cone tips.
const boss = {
  id: 'mx_pinata', name: 'El Gran Piñatón', hp: 4, dims: [70, 70], music: 'tour_mx_boss',
  brain: {
    guardText: 'TOO SPINNY',
    wake(b) { say(b.g, b, '¡NADIE ROMPE A PIÑATÓN!', '#ffd84a'); },
    update(b, dt) {
      const g = b.g;
      b.guard = 'bounce';
      if (b.act === 'walk') { b.face(); b.walk(1.2); b.pose = 'walk'; if (b.at > 1.3) { b.cycle++; b.go(b.cycle % 3 === 1 ? 'spin' : b.cycle % 3 === 2 ? 'hop' : (b.hp <= 2 ? 'cones' : 'spin')); } }
      else if (b.act === 'spin') {
        if (b.at < 0.6) { b.vx = 0; b.pose = 'windup'; }
        else { b.walk(6.2); b.pose = 'spin'; if (b.hitWall || b.x <= b.arenaX0 + 1 || b.x >= b.arenaX1 - b.w - 1) { g.shake(8); Sound.play('bump'); g.burst(b.cx, b.cy, 20, '#ffd84a', 'confetti'); b.go('dizzy'); } }
        if (b.at > 4) b.go('walk');
      }
      else if (b.act === 'dizzy') { b.vx = 0; b.pose = 'dizzy'; b.vuln = true; b.guard = 'hurt'; if (b.at > 2.2) b.go('walk'); }
      else if (b.act === 'hop') {
        if (b.first) { b.vy = -15 * TS; b.vx = 0; b.face(); }
        b.pose = 'hop';
        if (b.onGround && b.at > 0.3) {
          g.shake(6); Sound.play('stomp', { pitch: 0.6 });
          for (let k = 0; k < 6; k++) tourFire(g, b.arenaX0 + TS * 2 + Math.random() * (b.arenaX1 - b.arenaX0 - 4 * TS), b.floorY - 9 * TS - Math.random() * 3 * TS, { kind: 'candy', vy: 1 * TS, grav: PHYS.gDown * 0.35, w: 12, h: 12, life: 3, thru: true, stompable: true, col: PAPEL[k % 6], art: (ctx, s, t) => { ctx.fillStyle = s.col; ctx.beginPath(); ctx.arc(s.cx, s.cy, 6, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(s.cx - 2, s.cy - 2, 2, 0, TAU); ctx.fill(); } });
          b.go('walk');
        }
      }
      else if (b.act === 'cones') {
        b.vx = 0; b.pose = 'cones';
        if (b.at > 0.7 && !b.fired) { b.fired = true; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.45; tourFire(g, b.cx, b.cy - 10, { kind: 'cone', vx: Math.cos(a) * 5 * TS, vy: Math.sin(a) * 5 * TS, grav: PHYS.gDown * 0.35, w: 14, h: 14, life: 3, thru: true, col: PAPEL[k], art: (ctx, s, t) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(t * 6); ctx.fillStyle = s.col; ctx.beginPath(); ctx.moveTo(-6, 5); ctx.lineTo(6, 5); ctx.lineTo(0, -8); ctx.fill(); ctx.restore(); } }); } Sound.play('kick', { pitch: 1.3 }); }
        if (b.at > 1.6) { b.fired = false; b.go('walk'); }
      }
      b.fall(dt);
    },
    hurt(b) { b.go('walk'); b.vx = -b.dir * 5 * TS; say(b.g, b, pick(['¡AY, MIS DULCES!', 'NOT THE CANDY!', '¡OYE!']), '#ffd84a'); for (let k = 0; k < 8; k++) b.g.spawn(new PickPop(b.g, b.cx + (k - 4) * 6, b.y + 10)); b.g.burst(b.cx, b.cy, 30, '#ff9ac8', 'confetti'); },
    draw(b, ctx, t) {
      const x = b.cx, y = b.y + b.h / 2, sq = 1 + b.squash * 0.15;
      const spin = b.pose === 'spin' ? t * 18 : b.pose === 'windup' ? Math.sin(t * 20) * 0.2 : Math.sin(t * 2) * 0.08;
      ctx.save(); ctx.translate(x, y); ctx.scale(sq, 1 / sq); ctx.rotate(spin);
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + k * TAU / 5;
        ctx.fillStyle = PAPEL[k % PAPEL.length];
        ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.3) * 22, Math.sin(a - 0.3) * 22); ctx.lineTo(Math.cos(a) * 46, Math.sin(a) * 46); ctx.lineTo(Math.cos(a + 0.3) * 22, Math.sin(a + 0.3) * 22); ctx.fill();
        for (let q = 0; q < 3; q++) { ctx.strokeStyle = PAPEL[(k + q + 1) % 6]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 46, Math.sin(a) * 46); ctx.lineTo(Math.cos(a + 0.2 * (q - 1)) * 56 + Math.sin(t * 6 + q) * 2, Math.sin(a + 0.2 * (q - 1)) * 56 + 6); ctx.stroke(); }
      }
      ctx.fillStyle = '#ff9ac8'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill();
      for (let r = 0; r < 4; r++) { ctx.fillStyle = PAPEL[(r + 2) % 6]; for (let q = -24; q < 24; q += 4) { const yy = -18 + r * 10; if (q * q + yy * yy > 600) continue; ctx.beginPath(); ctx.moveTo(q, yy); ctx.lineTo(q + 4, yy); ctx.lineTo(q + 2, yy + 5); ctx.fill(); } }
      ctx.restore();
      // the face never spins with the body
      if (b.pose !== 'spin') {
        if (b.pose === 'dizzy') { ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * 9, y - 4, 4, t * 8, t * 8 + 4.5); ctx.stroke(); } TourKit.dizzy(ctx, x, b.y - 6, t); }
        else { K.eyes(ctx, x, y - 5, b.dir, 9, 5, true); ctx.fillStyle = '#7a1a3a'; ctx.beginPath(); ctx.arc(x, y + 8, 6, 0, Math.PI); ctx.fill(); }
      }
    }
  }
};

/* ---------------- music: mariachi-inspired (trumpets, violins, guitarrón, vihuela) ---------------- */
const tracks = {
  tour_mx: {
    bpm: 148, bpb: 3, bars: 16, rv: 0.22, dl: 0.08, hx: 0.08,
    ch: 'D A A D D G A D Bm Em A D G D A D',
    ld: 'F#5:4 A5:4 D6:4 | E6:6 C#6:2 A5:4 | G5:4 E5:4 C#5:4 | D5:8 F#5:4 |' +
        'A5:4 F#5:4 A5:4 | B5:6 D6:2 B5:4 | A5:4 G5:4 E5:4 | F#5:8 .:4 |' +
        'D6:4 C#6:4 B5:4 | G5:6 B5:2 E6:4 | E6:4 D6:4 C#6:4 | D6:8 A5:4 |' +
        'B5:4 D6:4 G6:4 | F#6:6 E6:2 D6:4 | E6:4 C#6:4 A5:4 | D6:12',
      li: 'brass', lv: 0.15,
      l2: 'D5:12 | C#5:12 | E5:12 | F#5:12 | A4:12 | D5:12 | C#5:12 | D5:12 | F#5:12 | E5:12 | E5:12 | F#5:12 | D5:12 | A5:12 | G5:12 | F#5:12', l2i: 'strings', l2v: 0.06,
      bp: 'r...f...o...', bi: 'pluckb', bv: 0.3,
      ap: '....c-..c-..', ai: 'pluck', av: 0.06, ao: 55,
      dr: ['k...........', '....g...g...', 'l.....l.....', '..n...n...n.'], dv: 0.4
  },
  tour_mx_boss: {
    bpm: 168, bars: 8, rv: 0.2, hx: 0.1,
    ch: 'Dm Dm Bb A Dm Gm A A',
    ld: 'D5:2 F5:2 A5:2 D6:2 C#6:2 A5:2 F5:4 | E5:2 F5:2 G5:2 A5:2 Bb5:4 A5:4 | F5:2 D5:2 Bb4:2 D5:2 F5:4 G5:4 | A5:8 C#6:4 E6:4 |' +
        'F6:2 E6:2 D6:2 C#6:2 D6:4 A5:4 | Bb5:2 A5:2 G5:2 F5:2 G5:4 D5:4 | E5:2 F5:2 G5:2 A5:2 C#6:4 E6:4 | D6:12 .:4',
    li: 'brass', lv: 0.16,
    bp: 'r-..r-.or-..r-o.', bi: 'pluckb', bv: 0.3,
    ap: 'c-.c-.c-c-.c-.c-', ai: 'pluck', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s.s.', 'h.h.h.h.h.h.h.h.', 'w.....w.....w...'], dv: 0.45
  },
  tour_mx_deep: {
    bpm: 84, bpb: 3, bars: 8, rv: 0.65, dl: 0.25,
    ch: 'Em C Am B7 Em C Am B7',
    ld: 'B5:6 G5:3 E5:3 | E6:9 D6:3 | C6:6 A5:6 | B5:12 | G5:6 B5:3 E6:3 | G6:9 F#6:3 | E6:6 C6:3 A5:3 | B5:12',
    li: 'vibes', lv: 0.13,
    bp: 'r...........', bi: 'sub', bv: 0.24,
    ap: '0.2.4.1.3.5.', ai: 'harp', av: 0.04, ao: 64,
    pd: 'c-----------', pi: 'pad', pv: 0.04, po: 52,
    dr: ['u.....u.....', '......n.....'], dv: 0.3
  },
  tour_mx_volcan: {
    bpm: 132, bars: 8, rv: 0.25,
    ch: 'Em Em C D Em Em C B',
    ld: 'E5:2 G5:2 B5:4 A5:2 G5:2 E5:4 | F#5:2 G5:2 A5:4 B5:8 | C6:2 B5:2 A5:2 G5:2 E5:4 G5:4 | F#5:4 A5:4 D6:8 |' +
        'E6:2 D6:2 B5:4 G5:2 A5:2 B5:4 | E5:4 G5:4 B5:8 | C6:4 E6:4 C6:4 A5:4 | B5:8 D#6:8',
    li: 'brass', lv: 0.14,
    bp: 'r.r.r.o.r.r.r.f.', bi: 'sawb', bv: 0.28,
    ap: 'c-..c-..c-..c-..', ai: 'twang', av: 0.05, ao: 52,
    dr: ['k.......k.k.....', '....s.......s...', 'h.h.h.h.h.h.h.h.', 'd...d...d.d.d...'], dv: 0.45
  }
};

/* ---------------- the five levels ---------------- */
Tour.country({
  id: 'mx', colors: COL, tagline: 'Tacos, piñatas and a volcano with a temper',
  themes, painters, dyn, decor, platforms, enemies, entities, pieces: P, boss, power, tracks,
  music: { level: 'tour_mx', boss: 'tour_mx_boss' },
  landmark: 'the Palace of Fine Arts',
  coin: { name: 'GOLDEN LIME', draw(ctx, x, y) {
    ctx.fillStyle = '#c8901a'; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7ad04a'; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8ffb0'; ctx.beginPath(); ctx.arc(x, y, 5.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#a8d870'; ctx.lineWidth = 0.9; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(k * 1.047) * 5, y + Math.sin(k * 1.047) * 5); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x - 4, y - 5, 2, 2);
  } },
  star: { name: 'GOLDEN ALEBRIJE', draw(ctx, x, y, t) {
    // a little golden folk-art jaguar, swirls painted on
    ctx.save(); ctx.translate(x, y + 2); ctx.scale(Math.cos(t * 3) > 0 ? 1 : -1, 1);
    ctx.fillStyle = '#ffd24a'; rr(ctx, -10, -6, 18, 9, 4); ctx.fill(); ctx.beginPath(); ctx.arc(9, -6, 5, 0, TAU); ctx.fill();
    ctx.fillRect(-9, 2, 3, 5); ctx.fillRect(4, 2, 3, 5); ctx.beginPath(); ctx.moveTo(-10, -4); ctx.quadraticCurveTo(-16, -10, -13, -14); ctx.lineWidth = 2; ctx.strokeStyle = '#ffd24a'; ctx.stroke();
    ctx.strokeStyle = '#ff3d8b'; ctx.lineWidth = 1; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-5 + k * 5, -2, 2, 0, 4); ctx.stroke(); }
    ctx.fillStyle = '#18c2c2'; ctx.beginPath(); ctx.arc(10, -7, 1.2, 0, TAU); ctx.fill();
    ctx.restore();
  } },
  levels: [
    { name: 'Mercado Mayhem', style: 'run', theme: 'mx_mercado', gimmick: 'Bouncy market awnings, rolling watermelons and fountain jets',
      enemies: [['mxPepper', 3], ['mxElote', 3], ['mxBurro', 1]],
      hint: 'Hold jump on an awning to bounce sky-high',
      postcard: 'Brady! The Baron shrank the Palace of Fine Arts into a snow globe and flew south. Follow my postcards! ♥ C',
      script: ['xolo', ['flat', { n: 5 }], 'stalls', 'gap', 'pinatas', 'melons', 'cp', 'fountain', 'rooftops', ['enemies', { n: 2 }], 'bonus', ['stalls', { n: 2 }], 'end'] },
    { name: 'Xochimilco Float', style: 'ride', theme: 'mx_canal', gimmick: 'Ride a painted trajinera: hop the posts, dodge axolotls and herons',
      enemies: [['mxHeron', 1]], vehicle: 'mxTrajinera', vehicleW: 9, below: 'liquid', scroll: 2.6, len: 175,
      hint: 'Jump the mooring posts or you\'ll fall in the canal',
      postcard: 'The Baron\'s blimp smells like churros. I followed it along the canals. ♥ C',
      script: [['arch', {}], 'posts', 'axolotls', ['chinampa', { gold: true }], 'posts', 'herons', ['bridge', { gold: true }], 'axolotls', 'vendor', 'posts', ['chinampa', {}], ['arch', { gold: true }], 'posts', 'herons', 'bridge', 'axolotls', 'posts'] },
    { name: 'Cenote Dive', style: 'swim', theme: 'mx_cenote', gimmick: 'Swim a flooded limestone cave: hanging roots, currents and light shafts',
      enemies: [['mxFish', 1]], H: 18, width: 220,
      hint: 'Tap jump to swim. Currents carry you along',
      postcard: 'Underwater, the cenote glows like a jewel. The Baron dropped a souvenir map here! ♥ C',
      script: ['shaft', ['roots', { n: 4 }], ['current', { w: 12, dir: 1 }], 'lightwell', 'slalom', ['roots', { n: 3 }], ['current', { w: 10, dir: 1 }], 'slalom'] },
    { name: 'Volcán Escape', style: 'climb', theme: 'mx_volcan', gimmick: 'Climb out of a volcano while the lava rises; ride the steam vents',
      enemies: [['mxArmadillo', 1]], W: 24, H: 100, risingLava: { delay: 5, speed: 0.42 },
      hint: 'Up, up, up! The lava is rising',
      postcard: 'The Baron tried to bottle the volcano. It did not agree. ♥ C',
      script: [['vledges', { n: 4 }], 'vvent', ['vledges', { n: 3, crumble: true, enemy: 'mxArmadillo' }], 'vroll', 'vblobs', ['vledges', { n: 3, flip: true }], ['vvent', { h: 10, gold: true }], ['vledges', { n: 4, crumble: true }], 'vblobs', ['vledges', { n: 3 }]] },
    { name: 'Hacienda Fiesta', style: 'castle', theme: 'mx_hacienda', gimmick: 'Swinging piñatas, candy cannons, then El Gran Piñatón',
      enemies: [['mxSalsa', 2], ['mxBurro', 2], ['mxPepper', 1]], boss: 'mx_pinata', arena: 'patio', arenaW: 26,
      hint: 'When the big piñata gets dizzy, stomp it!',
      postcard: 'You did it! The Palace of Fine Arts popped back to full size. Next stop: Ecuador! ♥ C',
      script: [['swingers', { n: 3 }], 'cannons', ['enemies', { n: 2 }], 'cp', 'balcony', ['swingers', { n: 4 }], 'cannons', 'arena'] }
  ]
});
})();
