/* ============================================================
   KENYA (world 15, cc 'ke'): the Encore Tour's second date. The savannah: golden grass, red earth, flat-topped
   acacias and a sky as big as the plain. Piwi shrank the snow cap of the great mountain and posted it ahead as
   scenery; the mountain on the skyline stands bare until Big Kiboko's show is cancelled.
   The humour is all animals and landscape: wildebeest, giraffes, flamingos, elephants, meerkats, hippos, dung
   beetles, weaver birds, termite mounds. No people anywhere.
   This file: the looks (tiles, themes, painted backdrops, props), the critters, the moving parts of the four new
   level types (the herd, the giraffes, the flamingos, the noon sun and its shade, the warren's sentries and the
   eagle), music, the route pin and the country itself. The boss: 29_tour_ke_boss.js. The levels and the land's map:
   29_tour_ke_levels.js.
   ============================================================ */
(function () {
const COL = { a: '#e8642a', b: '#2a7ac8', c: '#ffc83a' };
const INK = '#1c1426';
const GOLD = '#e8b84a', GOLD2 = '#c8902a', RED = '#b8502a', RED2 = '#8a3418', CLAY = '#c8683a';
const K = TourKit;

/* ---------------- tiles ---------------- */
// the plain: red earth under a thick cap of golden grass (the tufts poke up over the edge)
const groundOf = (cap, capHi, dirt, dirt2, blades) => ({
  style: 'savanna', cap, capHi, dirt, dirt2, rock: shade(dirt, -0.2),
  paint(ctx, rng) {
    ctx.fillStyle = dirt; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = shade(dirt, -0.12); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(4 + rng() * 24, 6 + rng() * 22, 3 + rng() * 3, 1.6, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = shade(dirt, 0.14); for (let k = 0; k < 3; k++) ctx.fillRect(2 + rng() * 26, 4 + rng() * 24, 2, 2);
    if (rng() < 0.22) { ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.ellipse(8 + rng() * 16, 12 + rng() * 12, 3, 2, rng(), 0, TAU); ctx.fill(); }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = shade(cap, -0.25); ctx.fillRect(x0, 0, x1 - x0, 11);
    ctx.fillStyle = cap; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = capHi; ctx.fillRect(x0, 0, x1 - x0, 2.5);
    // the grass blades over the edge
    ctx.strokeStyle = blades; ctx.lineWidth = 1.6;
    for (let x = x0 + 2; x < x1; x += 4) { const h = 3 + ((x * 7) % 5); ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x + ((x % 3) - 1), 4 - h); ctx.stroke(); }
    ctx.fillStyle = shade(cap, -0.35); for (let x = x0 + 5; x < x1; x += 9) ctx.fillRect(x, 8, 2, 3);
  }
});
// the acacia's flat crown as a one-way shelf: a slab of leaves, the dark underside, a few thorns
const acaciaSemi = (leaf, leaf2) => ({
  style: 'acacia', c1: leaf, c2: leaf2,
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = shade(leaf2, -0.2); rr(ctx, x0, 3, x1 - x0, 9, 4); ctx.fill();
    ctx.fillStyle = leaf; rr(ctx, x0, 0, x1 - x0, 8, 4); ctx.fill();
    ctx.fillStyle = shade(leaf, 0.22); for (let x = x0 + 3; x < x1 - 2; x += 7) { ctx.beginPath(); ctx.arc(x, 2.5, 2.4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = INK; ctx.fillRect(x0, 11, x1 - x0, 1.4);
    ctx.strokeStyle = '#f4ead0'; ctx.lineWidth = 1; for (let x = x0 + 6; x < x1; x += 11) { ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x + 1.5, 15); ctx.stroke(); }
  }
});
// a termite-mound clay brick
const clayBrick = {
  style: 'mound', c1: CLAY, c2: RED2, mortar: '#5a2210',
  paint(ctx) {
    ctx.fillStyle = CLAY; rr(ctx, 1, 1, TS - 2, TS - 2, 6); ctx.fill();
    ctx.fillStyle = shade(CLAY, 0.18); ctx.beginPath(); ctx.ellipse(10, 9, 6, 3, -0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = RED2; for (const [x, y] of [[20, 10], [9, 20], [22, 23], [15, 15]]) { ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; rr(ctx, 1, 1, TS - 2, TS - 2, 6); ctx.stroke();
  }
};
// the thorn thicket (whistling-thorn tangle): too tall to jump, the herd leaps it
const thornHard = {
  c1: '#5a6a2a', c2: '#3a4418',
  paint(ctx) {
    ctx.fillStyle = '#4a3a22'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = '#6a5034'; ctx.lineWidth = 2.6;
    for (const [a, b, c, d] of [[0, 6, 32, 20], [0, 26, 30, 4], [4, 0, 20, 32], [32, 12, 10, 32]]) { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
    ctx.fillStyle = '#6a7a2a'; for (const [x, y] of [[8, 8], [24, 6], [16, 18], [6, 26], [26, 25]]) { ctx.beginPath(); ctx.ellipse(x, y, 4, 2.6, x * 0.3, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#fff4dc'; ctx.lineWidth = 1.2;
    for (const [x, y, d] of [[5, 13, 1], [18, 9, -1], [22, 17, 1], [11, 24, -1], [28, 28, 1], [14, 3, 1]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + d * 4, y - 3); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(28,20,38,0.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// a kopje boulder (granite outcrop): warm grey stone
const kopjeHard = {
  c1: '#b8a08a', c2: '#7a6a5a',
  paint(ctx) {
    ctx.fillStyle = '#9a8670'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#b8a48c'; rr(ctx, 2, 2, TS - 4, TS - 8, 7); ctx.fill();
    ctx.fillStyle = '#d4c2a8'; ctx.beginPath(); ctx.ellipse(11, 8, 7, 3, -0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a6a58'; ctx.fillRect(4, TS - 6, TS - 8, 3);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const rootSemi = { style: 'root', c1: '#c8905a', c2: '#7a4a24', paint(ctx, part, x0, x1) { ctx.fillStyle = '#7a4a24'; rr(ctx, x0, 2, x1 - x0, 9, 4); ctx.fill(); ctx.fillStyle = '#c8905a'; rr(ctx, x0, 0, x1 - x0, 6, 3); ctx.fill(); ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 1.4; for (let x = x0 + 4; x < x1; x += 9) { ctx.beginPath(); ctx.moveTo(x, 10); ctx.quadraticCurveTo(x + 2, 14, x - 1, 17); ctx.stroke(); } ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.4); } };
const savanna = (o) => Object.assign({
  ground: groundOf(GOLD, '#ffe08a', RED, RED2, '#f0c860'), semi: acaciaSemi('#7a9a3a', '#4a6a24'), brick: clayBrick, hard: kopjeHard,
  pillar: { c1: '#c8784a', c2: '#8a4422', cap: GOLD, style: 'column' }, accent: COL.a, tint: {}, bloom: 0.12, liquid: null
}, o);

/* ---------------- painted backdrops ---------------- */
const painters = {
  // the great mountain far off: a long blue massif with a jagged peak; its snow cap is GONE (Piwi took it), only a
  // bare dark summit and a little "?" of cloud where it should be. L.cap = true paints it back (after the boss)
  keMountain(ctx, L, rng, H) {
    const b = L.base, cx = BG_W * 0.42, k = (L.h || 150) / 232, kx = (L.wide || 0.75);
    const P = (dx, dy) => [cx + dx * kx, b - dy * k];
    const ridge = [[-420, 30], [-70, 190], [-40, 215], [-18, 205], [0, 232], [22, 210], [46, 222], [70, 186], [440, 28]];
    ctx.fillStyle = L.color;
    ctx.beginPath(); ctx.moveTo(0, b);
    ridge.forEach(([dx, dy], i) => { const [x, y] = P(dx, dy); if (i === 1 || i === 8) { const [qx, qy] = P(i === 1 ? -200 : 220, 90); ctx.quadraticCurveTo(qx, qy, x, y); } else ctx.lineTo(x, y); });
    ctx.lineTo(BG_W, b - 10 * k); ctx.lineTo(BG_W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    // the shadowed flank
    ctx.fillStyle = shade(L.color, -0.12); ctx.beginPath(); { const pts = [[0, 232], [22, 210], [46, 222], [70, 186]]; pts.forEach(([dx, dy], i) => { const [x, y] = P(dx, dy); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); const [qx, qy] = P(220, 90), [ex, ey] = P(440, 28), [fx, fy] = P(60, 0); ctx.quadraticCurveTo(qx, qy, ex, ey); ctx.lineTo(fx, fy); } ctx.closePath(); ctx.fill();
    const cap = [[-70, 190], [-40, 215], [-18, 205], [0, 232], [22, 210], [46, 222], [70, 186], [40, 176], [20, 190], [-6, 172], [-30, 188], [-50, 174]];
    if (L.cap) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); cap.forEach(([dx, dy], i) => { const [x, y] = P(dx, dy); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill(); }
    else {
      // where the snow was: a pale dashed outline, like a sticker peeled off
      ctx.strokeStyle = shade(L.color, 0.3); ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); [[-70, 190], [-50, 174], [-30, 188], [-6, 172], [20, 190], [40, 176], [70, 186]].forEach(([dx, dy], i) => { const [x, y] = P(dx, dy); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.setLineDash([]);
    }
    // soft cloud bands across the foothills
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let q = 0; q < 5; q++) { const x = rng() * BG_W, y = b - (30 + rng() * 50) * k * 1.4; wrapDraw(x - 90, 180, X => { ctx.beginPath(); ctx.ellipse(X + 90, y, 90, 7, 0, 0, TAU); ctx.fill(); }); }
  },
  // the far plain: a flat horizon, acacia silhouettes like little tables, the herd as a dark dotted line
  keFarPlain(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    ctx.fillStyle = shade(L.color, 0.1); ctx.fillRect(0, b, BG_W, 3);
    const tree = shade(L.color, -0.32);
    for (let k = 0; k < 14; k++) {
      const x = rng() * BG_W, s = 0.5 + rng() * 0.7;
      wrapDraw(x - 40, 80, X => {
        const cx = X + 40; ctx.fillStyle = tree;
        ctx.fillRect(cx - 1.5 * s, b - 22 * s, 3 * s, 22 * s);
        ctx.beginPath(); ctx.ellipse(cx, b - 24 * s, 26 * s, 6 * s, 0, 0, TAU); ctx.fill();
      });
    }
    if (L.herd) { ctx.fillStyle = shade(L.color, -0.45); for (let x = 0; x < BG_W; x += 7 + rng() * 9) { if (Math.sin(x * 0.006) < -0.2) continue; ctx.fillRect(x, b - 3 - rng() * 2, 4, 3); } }
    if (L.lake) { ctx.fillStyle = L.lake; ctx.fillRect(0, b + 6, BG_W, H); ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 30; k++) { const x = rng() * BG_W; ctx.fillRect(x, b + 10 + rng() * 30, 14 + rng() * 30, 1.5); } ctx.fillStyle = '#ff8ab0'; for (let x = 0; x < BG_W; x += 3 + rng() * 6) { if (Math.sin(x * 0.01) < 0.1) continue; ctx.fillRect(x, b + 4 + rng() * 6, 2, 2); } }
  },
  // the near grass: a golden band with tall tufts, a termite mound or two and an umbrella acacia now and then
  keNearGrass(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, b);
    for (let x = 0; x <= BG_W; x += 32) ctx.lineTo(x, b - 6 - Math.sin(x * 0.02) * 5);
    ctx.lineTo(BG_W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(c, 0.15); ctx.lineWidth = 2;
    for (let x = 0; x < BG_W; x += 6) { const h = 8 + rng() * 14; ctx.beginPath(); ctx.moveTo(x, b + 2); ctx.quadraticCurveTo(x + 2, b - h * 0.5, x + 4 - rng() * 6, b - h); ctx.stroke(); }
    for (let k = 0; k < 3; k++) {
      const x = 80 + k * 330 + rng() * 120;
      if (L.trees !== false) {
        ctx.fillStyle = shade(c, -0.4); ctx.beginPath(); ctx.moveTo(x - 4, b); ctx.lineTo(x - 2, b - 56); ctx.lineTo(x - 26, b - 76); ctx.lineTo(x - 22, b - 79); ctx.lineTo(x, b - 62); ctx.lineTo(x + 24, b - 80); ctx.lineTo(x + 27, b - 77); ctx.lineTo(x + 4, b - 56); ctx.lineTo(x + 5, b); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(L.leaf || '#5a7a2a', -0.1); ctx.beginPath(); ctx.ellipse(x, b - 84, 62, 13, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = L.leaf || '#5a7a2a'; ctx.beginPath(); ctx.ellipse(x - 4, b - 88, 56, 9, 0, 0, TAU); ctx.fill();
      }
      const mx = x + 150 + rng() * 40;
      ctx.fillStyle = shade(L.mound || CLAY, -0.15); ctx.beginPath(); ctx.moveTo(mx - 16, b + 2); ctx.quadraticCurveTo(mx - 12, b - 30, mx - 4, b - 52); ctx.lineTo(mx + 2, b - 58); ctx.quadraticCurveTo(mx + 8, b - 30, mx + 18, b + 2); ctx.closePath(); ctx.fill();
    }
  },
  // the soda lake's far shore and the pink haze of a thousand flamingos
  keLakeShore(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.6; for (let k = 0; k < 40; k++) { const x = rng() * BG_W; ctx.fillRect(x, b + 4 + rng() * 60, 20 + rng() * 40, 2); } ctx.globalAlpha = 1;
    for (let k = 0; k < 160; k++) {
      const x = rng() * BG_W, y = b + 6 + rng() * 26, s = 0.6 + rng() * 0.5;
      ctx.strokeStyle = '#e8708a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 6 * s); ctx.stroke();
      ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.ellipse(x, y - 7 * s, 3 * s, 2 * s, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 1.5 * s, y - 11 * s, 1.2 * s, 0, TAU); ctx.fill();
    }
  },
  // the warren underground: red earth with roots hanging down, little side burrows, pebbles
  keWarrenWall(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let k = 0; k < 60; k++) { ctx.fillStyle = k % 2 ? shade(L.color, 0.08) : shade(L.color, -0.1); ctx.beginPath(); ctx.ellipse(rng() * BG_W, rng() * H, 10 + rng() * 30, 4 + rng() * 8, rng(), 0, TAU); ctx.fill(); }
    ctx.strokeStyle = shade(L.color, -0.3); ctx.lineWidth = 2;
    for (let k = 0; k < 18; k++) { const x = rng() * BG_W; ctx.beginPath(); ctx.moveTo(x, 0); let y = 0; for (let s = 0; s < 6; s++) { y += 12 + rng() * 14; ctx.lineTo(x + (rng() - 0.5) * 16, y); } ctx.stroke(); }
    for (let k = 0; k < 10; k++) { const x = rng() * BG_W, y = 80 + rng() * (H - 160); ctx.fillStyle = shade(L.color, -0.45); ctx.beginPath(); ctx.ellipse(x, y, 16, 11, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,220,150,0.18)'; ctx.beginPath(); ctx.arc(x - 3, y - 2, 2, 0, TAU); ctx.arc(x + 4, y - 2, 2, 0, TAU); ctx.fill(); }
  },
  // heat shimmer over the noon plain: pale wavering bands near the horizon
  keHeatHaze(ctx, L, rng, H) {
    const b = L.base;
    for (let k = 0; k < 8; k++) { ctx.fillStyle = `rgba(255,255,240,${0.08 + k * 0.02})`; const y = b - 30 + k * 8; ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= BG_W; x += 24) ctx.lineTo(x, y + Math.sin(x * 0.05 + k) * 3); ctx.lineTo(BG_W, y + 10); ctx.lineTo(0, y + 10); ctx.closePath(); ctx.fill(); }
  }
};

const sky = { big: ['#3a7ad8', '#7ab8f0', '#ffe2a8'], noon: ['#8ac8ff', '#d8f0ff', '#fff8e0'], lake: ['#5a9ae8', '#a8d8f8', '#ffd8d0'], dusk: ['#3a4a9a', '#e8805a', '#ffd08a'] };
const sun = (x, y, r) => ({ type: 'sun', x, y, r, color: '#fff6d0', glow: '#ffd070' });
const themes = {
  ke_mara: savanna({
    name: 'The Great Migration', music: 'tour_ke', particles: 'dust', rays: '#fff0c0',
    sky: sky.big, horizonGlow: '#ffe8b0', celestial: sun(0.78, 0.18, 32), stars: 0, cloudsDyn: true,
    layers: [{ kind: 'keMountain', color: '#8a9ac8', base: 236, h: 150, f: 0.02 }, { kind: 'keFarPlain', color: '#d8a856', base: 236, f: 0.07, herd: true }, { kind: 'keNearGrass', color: '#d89a3a', base: 266, f: 0.26 }],
    fog: '#ffe2b0', decor: ['keGrass', 'keGrass', 'keTermite', 'keSkullRock', 'keGrass']
  }),
  ke_grove: savanna({
    name: 'Giraffe Grove', music: 'tour_ke_grove', particles: 'leaves', rays: '#fff4c8',
    semi: acaciaSemi('#8aaa3a', '#5a7a26'),
    sky: sky.big, horizonGlow: '#fff0c0', celestial: sun(0.2, 0.16, 28), stars: 0, cloudsDyn: true,
    layers: [{ kind: 'keMountain', color: '#9aa4cc', base: 226, h: 140, f: 0.02 }, { kind: 'keFarPlain', color: '#c8a85a', base: 230, f: 0.07 }, { kind: 'keNearGrass', color: '#b8943a', base: 262, f: 0.24, leaf: '#6a8a2a' }],
    fog: '#fff0c8', decor: ['keGrass', 'keBush', 'keGrass', 'keTermite']
  }),
  ke_lake: savanna({
    name: 'Flamingo Lake', music: 'tour_ke_lake', particles: 'none', rays: '#ffe8f0',
    ground: groundOf('#f0e8d8', '#ffffff', '#c89a7a', '#a87a5a', '#e0d0b0'), semi: acaciaSemi('#7a9a3a', '#4a6a24'), hard: kopjeHard,
    sky: sky.lake, horizonGlow: '#ffd8e0', celestial: sun(0.7, 0.2, 30), stars: 0, cloudsDyn: true,
    layers: [{ kind: 'keMountain', color: '#a0a8d0', base: 216, h: 130, f: 0.02 }, { kind: 'keFarPlain', color: '#c8b088', base: 216, f: 0.06, lake: '#e8a0a8' }, { kind: 'keLakeShore', color: '#f0b0b8', base: 250, f: 0.14 }],
    fog: '#ffe0e8', decor: ['keSodaCrust', 'keGrass', 'keSodaCrust']
  }),
  ke_noon: savanna({
    name: 'High Noon', music: 'tour_ke_noon', particles: 'dust', rays: '#ffffff',
    ground: groundOf('#f0d070', '#fff4b0', '#c86a3a', '#9a4422', '#ffe08a'),
    sky: sky.noon, horizonGlow: '#ffffff', celestial: sun(0.5, 0.06, 44), stars: 0,
    layers: [{ kind: 'keMountain', color: '#c0c8e0', base: 236, h: 150, f: 0.02 }, { kind: 'keFarPlain', color: '#e8c87a', base: 240, f: 0.07 }, { kind: 'keHeatHaze', color: '#ffffff', base: 246, f: 0.1 }, { kind: 'keNearGrass', color: '#e0b04a', base: 270, f: 0.26, trees: false }],
    fog: '#fffbe8', decor: ['keGrass', 'keSkullRock', 'keGrass', 'keTermite']
  }),
  ke_hole: savanna({
    name: 'The Waterhole', music: 'tour_ke', particles: 'none', rays: '#ffd8a0',
    sky: sky.dusk, horizonGlow: '#ffb070', celestial: sun(0.82, 0.3, 40), stars: 0,
    layers: [{ kind: 'keMountain', color: '#6a6aa8', base: 236, h: 150, f: 0.02 }, { kind: 'keFarPlain', color: '#b8784a', base: 238, f: 0.07, herd: true }, { kind: 'keNearGrass', color: '#a8702a', base: 266, f: 0.24, leaf: '#4a5a2a' }],
    fog: '#ffc890', decor: ['keGrass', 'keReeds', 'keGrass']
  }),
  ke_stage: savanna({
    semi: { style: 'lily', c1: '#6aa83a', c2: '#3a6a24', paint(ctx, part, x0, x1) { ctx.fillStyle = '#3a6a24'; ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, 6, (x1 - x0) / 2 + 1, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#7ab83a'; ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, 4, (x1 - x0) / 2, 5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke(); ctx.strokeStyle = '#4a7a2a'; ctx.beginPath(); ctx.moveTo((x0 + x1) / 2, 4); ctx.lineTo(x1 - 3, 2); ctx.stroke(); if (part === 'R' || part === 'S') { ctx.fillStyle = '#ffb8d8'; ctx.beginPath(); ctx.arc(x1 - 8, 2, 3, 0, TAU); ctx.fill(); ctx.stroke(); } } },
    name: 'Big Kiboko\'s Pool', music: 'tour_ke_boss', particles: 'none', rays: '#ffd8a0',
    sky: sky.dusk, horizonGlow: '#ffb070', celestial: sun(0.82, 0.3, 40), stars: 0,
    layers: [{ kind: 'keMountain', color: '#6a6aa8', base: 236, h: 160, f: 0.02 }, { kind: 'keFarPlain', color: '#b8784a', base: 246, f: 0.07 }],
    fog: '#ffc890', decor: ['keReeds']
  }),
  ke_warren: savanna({
    semi: rootSemi,
    name: 'Meerkat Manor', music: 'tour_ke_burrow', particles: 'dust', rays: '#fff0c0',
    ground: groundOf('#e0b050', '#ffe08a', '#b0482a', '#7a2a14', '#f0c860'),
    sky: sky.big, horizonGlow: '#ffe8b0', celestial: sun(0.3, 0.14, 30), stars: 0, cloudsDyn: true,
    layers: [{ kind: 'keMountain', color: '#8a9ac8', base: 200, h: 120, f: 0.02 }, { kind: 'keFarPlain', color: '#d8a856', base: 204, f: 0.07 }, { kind: 'keNearGrass', color: '#c8903a', base: 236, f: 0.22, trees: false }],
    fog: '#ffe2b0', decor: ['keGrass', 'keGrass', 'keSkullRock']
  }),
  ke_den: savanna({
    semi: rootSemi,
    name: 'The Warren', music: 'tour_ke_burrow', particles: 'dust', rays: null,
    ground: groundOf('#8a3a1e', '#a84a28', '#7a2e16', '#5a1e0c', '#a85030'),
    sky: ['#3a1a10', '#5a2a18', '#6a3420'], horizonGlow: '#a85030', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'keWarrenWall', color: '#6a2c16', base: 400, f: 0.15 }],
    fog: '#8a4a2a', darkness: 0.18, decor: ['keRoots', 'kePebbles']
  })
};

/* ---------------- props (Decor: x = the tile's centre, y = the ground's top) ---------------- */
const decor = {
  // a clump of tall golden grass, swaying
  keGrass(ctx, x, y, t, th, d) {
    const s = (d && d.seed) || 0, n = 5 + (s % 4);
    ctx.save(); ctx.lineCap = 'round';
    for (let k = 0; k < n; k++) { const ox = (k - n / 2) * 3.4, h = 16 + ((s * 7 + k * 13) % 14), sw = Math.sin(t * 1.6 + x * 0.05 + k) * 3; ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(x + ox, y); ctx.quadraticCurveTo(x + ox + sw * 0.4, y - h * 0.5, x + ox + sw, y - h); ctx.stroke(); ctx.strokeStyle = k % 2 ? '#f0c858' : '#d8a038'; ctx.lineWidth = 1.8; ctx.stroke(); }
    ctx.restore();
  },
  // a termite mound: a clay spire with vents
  keTermite(ctx, x, y, t, th, d) {
    const h = 44 + (((d && d.seed) || 0) % 3) * 12;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = CLAY; ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.quadraticCurveTo(x - 16, y - h * 0.5, x - 6, y - h); ctx.quadraticCurveTo(x, y - h - 8, x + 5, y - h + 2); ctx.quadraticCurveTo(x + 14, y - h * 0.5, x + 22, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(CLAY, 0.2); ctx.beginPath(); ctx.ellipse(x - 8, y - h * 0.5, 4, h * 0.3, 0.1, 0, TAU); ctx.fill();
    ctx.fillStyle = RED2; for (const [ox, oy] of [[4, 0.3], [-4, 0.65], [8, 0.75]]) { ctx.beginPath(); ctx.ellipse(x + ox, y - h * oy, 2.2, 3.2, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // a sun-bleached rock with a lizard on it (it does push-ups)
  keSkullRock(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#c8b49a'; ctx.beginPath(); ctx.ellipse(x, y - 8, 20, 10, 0, Math.PI, 0); ctx.lineTo(x + 20, y); ctx.lineTo(x - 20, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    const up = Math.max(0, Math.sin(t * 3)) * 2;
    ctx.fillStyle = '#e8702a'; ctx.beginPath(); ctx.ellipse(x + 2, y - 19 - up, 7, 2.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a6ad8'; ctx.beginPath(); ctx.arc(x + 9, y - 20 - up, 2.6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // a small thorn bush
  keBush(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#6a8a2a'; ctx.beginPath(); ctx.arc(x - 9, y - 10, 10, 0, TAU); ctx.arc(x + 8, y - 12, 12, 0, TAU); ctx.arc(x, y - 20, 9, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8aaa3a'; ctx.beginPath(); ctx.arc(x - 2, y - 22, 4, 0, TAU); ctx.arc(x + 10, y - 15, 4, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // white soda crust on the lakeshore
  keSodaCrust(ctx, x, y) { ctx.save(); ctx.fillStyle = '#ffffff'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x - 20 + k * 10, y + 1, 6, 2, 0, 0, TAU); ctx.fill(); } ctx.restore(); },
  // waterhole reeds
  keReeds(ctx, x, y, t) {
    ctx.save(); ctx.lineCap = 'round';
    for (let k = 0; k < 6; k++) { const ox = (k - 3) * 4, h = 22 + (k * 9) % 14, sw = Math.sin(t * 1.3 + k) * 2; ctx.strokeStyle = INK; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(x + ox, y); ctx.lineTo(x + ox + sw, y - h); ctx.stroke(); ctx.strokeStyle = '#6a8a3a'; ctx.lineWidth = 2; ctx.stroke(); if (k % 2) { ctx.fillStyle = '#7a4a2a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; rr(ctx, x + ox + sw - 2.5, y - h - 2, 5, 11, 2.5); ctx.fill(); ctx.stroke(); } }
    ctx.restore();
  },
  // roots hanging from the warren's roof (y is the floor: they hang from 5 rows up)
  keRoots(ctx, x, y, t) { ctx.save(); ctx.strokeStyle = '#c8905a'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 8 + k * 8, y - 128); ctx.quadraticCurveTo(x - 4 + k * 8 + Math.sin(t + k) * 2, y - 110, x - 6 + k * 8, y - 96 + k * 6); ctx.stroke(); } ctx.restore(); },
  // a flamingo's mud nest: a little cone with an egg on top
  keMudNest(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x - 9, y - 16); ctx.lineTo(x + 9, y - 16); ctx.lineTo(x + 16, y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff8ec'; ctx.beginPath(); ctx.ellipse(x, y - 20, 6, 5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); },
  // a heap of sleeping meerkat pups
  kePups(ctx, x, y, t) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; for (const [ox, oy] of [[-12, 0], [0, -2], [12, 0], [-6, -10], [6, -10]]) { ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.ellipse(x + ox, y - 6 + oy, 8, 6, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.ellipse(x + ox + 3, y - 7 + oy, 2, 1.2, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = TourBackstage.F8; ctx.textAlign = 'center'; const ph = (t * 0.4) % 1; ctx.globalAlpha = 1 - ph; ctx.fillText('z', x + 14, y - 22 - ph * 16); ctx.restore(); },
  kePebbles(ctx, x, y) { ctx.save(); ctx.fillStyle = '#c8a888'; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; for (const [ox, r] of [[-8, 3], [0, 4], [7, 2.5]]) { ctx.beginPath(); ctx.ellipse(x + ox, y - r, r * 1.3, r, 0, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.restore(); },
  // a big flat-topped acacia growing out of the ground: the trunk and branches up to its crown (the crown itself is
  // the one-way tiles laid by the piece: { w } in the decor's seed is the crown's row count above the ground)
  keAcacia(ctx, x, y, t, th, d) {
    const h = (((d && d.seed) || 5) % 20) * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.fillStyle = '#6a4a2a';
    ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x - 5, y - h * 0.55); ctx.lineTo(x - 40, y - h + 10); ctx.lineTo(x - 33, y - h + 12); ctx.lineTo(x - 2, y - h * 0.62); ctx.lineTo(x + 2, y - h + 12); ctx.lineTo(x + 8, y - h + 12); ctx.lineTo(x + 5, y - h * 0.6); ctx.lineTo(x + 38, y - h + 12); ctx.lineTo(x + 44, y - h + 10); ctx.lineTo(x + 7, y - h * 0.5); ctx.lineTo(x + 8, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a6a44'; ctx.fillRect(x - 3, y - h * 0.5, 2, h * 0.45);
    ctx.restore();
  },
  // a weaver-bird colony: a dead branch hung with round grass nests (one swings)
  keWeaverNests(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    const top = y - 6 * TS;
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 50, top); ctx.lineTo(x + 50, top + 6); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = INK;
    for (let k = 0; k < 4; k++) { const nx = x - 36 + k * 24, sw = k === 1 ? Math.sin(t * 2) * 4 : 0; ctx.beginPath(); ctx.moveTo(nx, top + 2); ctx.lineTo(nx + sw, top + 14); ctx.stroke(); ctx.fillStyle = '#d8b860'; ctx.beginPath(); ctx.ellipse(nx + sw, top + 22, 8, 10, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#3a2a14'; ctx.beginPath(); ctx.arc(nx + sw, top + 28, 2.6, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // the river bank's mud and the crocodile warning: a heap of bleached bones? no: a sign with a croc on it (a card)
  keCrocSign(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 2, y - 40, 4, 40); ctx.strokeRect(x - 2, y - 40, 4, 40);
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(x, y - 66); ctx.lineTo(x + 18, y - 40); ctx.lineTo(x - 18, y - 40); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a6a2a'; ctx.beginPath(); ctx.ellipse(x, y - 47, 9, 3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.fillRect(x + 4, y - 51, 2, 2); ctx.fillRect(x - 4, y - 51, 2, 2);
    ctx.restore();
  },
  // the meerkats' sand mound around a burrow mouth (the hole itself is the one-way tile)
  keBurrowMound(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#d8984a'; ctx.beginPath(); ctx.moveTo(x - 34, y + 1); ctx.quadraticCurveTo(x - 24, y - 12, x - 14, y - 2); ctx.lineTo(x + 14, y - 2); ctx.quadraticCurveTo(x + 24, y - 12, x + 34, y + 1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a1408'; ctx.beginPath(); ctx.ellipse(x, y, 14, 4, 0, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a trail of hoof prints and a weathered arrow carved on a rock pointing DOWN a hole (the hidden-exit hint)
  keArrowRock(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#b8a48c'; ctx.beginPath(); ctx.ellipse(x, y - 12, 16, 13, 0, Math.PI, 0); ctx.lineTo(x + 16, y); ctx.lineTo(x - 16, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    const b = Math.sin(t * 4) * 2;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 5, y - 20 + b); ctx.lineTo(x + 5, y - 20 + b); ctx.lineTo(x + 5, y - 14 + b); ctx.lineTo(x + 9, y - 14 + b); ctx.lineTo(x, y - 6 + b); ctx.lineTo(x - 9, y - 14 + b); ctx.lineTo(x - 5, y - 14 + b); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
};
// the crack in a big termite mound: dust puffs out of it now and then (the secret-wall tell)
decor.keMoundCrack = function (ctx, x, y, t) {
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 4, y - 70); ctx.lineTo(x + 2, y - 56); ctx.lineTo(x - 3, y - 44); ctx.lineTo(x + 3, y - 30); ctx.stroke();
  const ph = (t * 0.7) % 1; if (ph < 0.5) { ctx.fillStyle = `rgba(240,210,170,${0.7 * (1 - ph * 2)})`; ctx.beginPath(); ctx.arc(x + 6 + ph * 20, y - 52 - ph * 10, 4 + ph * 8, 0, TAU); ctx.fill(); }
  ctx.restore();
};

/* ---------------- door looks: a burrow, a hollow in a baobab, a reed curtain ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'keBurrow') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = '#d8984a'; ctx.beginPath(); ctx.ellipse(x, y - 16, 26, 22, 0, Math.PI, 0); ctx.lineTo(x + 26, y); ctx.lineTo(x - 26, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#2a1408'; ctx.beginPath(); ctx.ellipse(x, y - 12, 15, 13, 0, Math.PI, 0); ctx.lineTo(x + 15, y); ctx.lineTo(x - 15, y); ctx.closePath(); ctx.fill();
      if (near) { ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.arc(x - 5, y - 13, 2, 0, TAU); ctx.arc(x + 5, y - 13, 2, 0, TAU); ctx.fill(); }
      ctx.restore(); return;
    }
    if (look === 'keMoundDoor') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = CLAY; ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.quadraticCurveTo(x - 24, y - 60, x - 4, y - 92); ctx.lineTo(x + 6, y - 96); ctx.quadraticCurveTo(x + 24, y - 60, x + 30, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = shade(CLAY, 0.2); ctx.beginPath(); ctx.ellipse(x - 10, y - 50, 5, 26, 0.1, 0, TAU); ctx.fill();
      ctx.fillStyle = RED2; for (const [ox, oy] of [[8, 70], [-6, 30], [12, 40]]) { ctx.beginPath(); ctx.ellipse(x + ox, y - oy, 2.4, 3.4, 0, 0, TAU); ctx.fill(); }
      // the crack (the tell): dust puffs out of it; up close it opens into a dark gap
      if (near) { ctx.fillStyle = '#2a1408'; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x - 7, y - 30); ctx.lineTo(x - 1, y - 48); ctx.lineTo(x + 6, y - 30); ctx.lineTo(x + 5, y); ctx.closePath(); ctx.fill(); }
      else { ctx.beginPath(); ctx.moveTo(x - 1, y - 2); ctx.lineTo(x - 5, y - 22); ctx.lineTo(x + 2, y - 36); ctx.lineTo(x - 3, y - 50); ctx.stroke(); }
      const ph = (t * 0.7) % 1; if (ph < 0.5) { ctx.fillStyle = `rgba(240,210,170,${0.7 * (1 - ph * 2)})`; ctx.beginPath(); ctx.arc(x + 6 + ph * 22, y - 40 - ph * 12, 4 + ph * 8, 0, TAU); ctx.fill(); }
      ctx.restore(); return;
    }
    if (look === 'keReedCurtain') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; const sw = near ? 7 : Math.sin(t * 2) * 2;
      ctx.fillStyle = '#7a5a2a'; ctx.fillRect(x - 30, y - 78, 60, 6); ctx.strokeRect(x - 30, y - 78, 60, 6);
      for (const s of [-1, 1]) { ctx.fillStyle = '#9aaa4a'; ctx.beginPath(); ctx.moveTo(x + s * 28, y - 72); ctx.lineTo(x + s * 3, y - 72); ctx.quadraticCurveTo(x + s * (6 + sw), y - 36, x + s * (8 + sw), y); ctx.lineTo(x + s * 28, y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#6a7a2a'; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + s * (3 + k * 6), y - 70); ctx.lineTo(x + s * (6 + k * 6 + sw * 0.5), y - 2); ctx.stroke(); } ctx.strokeStyle = INK; }
      ctx.fillStyle = '#ff9ac8'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('TONIGHT!', x, y - 84);
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// a dung beetle pushing its ball (head down, back legs on the ball): stomp the beetle; the ball rolls on a bit
const beetleArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  const roll = (e.x || 0) * 0.12;
  // the ball in front
  ctx.fillStyle = '#7a5a34'; ctx.beginPath(); ctx.arc(9, -11, 11, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#5a3e20'; ctx.lineWidth = 1.4; for (let k = 0; k < 3; k++) { const a = roll + k * 2.1; ctx.beginPath(); ctx.arc(9 + Math.cos(a) * 5, -11 + Math.sin(a) * 5, 2.4, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  // the beetle, upside-down-ish behind it: shiny green-black shell
  const st = Math.sin(t * 16) * 2;
  ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-11, 0 + st * 0.3); ctx.moveTo(-2, -4); ctx.lineTo(-3, 0 - st * 0.3); ctx.moveTo(-4, -12); ctx.lineTo(2, -17 + st); ctx.stroke();
  ctx.fillStyle = '#2a3a2a'; ctx.beginPath(); ctx.ellipse(-6, -9, 8, 6, -0.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6ac87a'; ctx.beginPath(); ctx.ellipse(-8, -11, 3, 1.6, -0.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a3a2a'; ctx.beginPath(); ctx.arc(-1, -4, 3.4, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-1, -4, 1.3, 0, TAU); ctx.fill();
  ctx.restore();
};
// a warthog: tusks, a mane, the tail straight up like an aerial when it charges
const warthogArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  const run = m === 'charge', st = run ? Math.sin(t * 24) * 3 : Math.sin(t * 9) * 1.5;
  ctx.fillStyle = '#5a4a44'; for (const lx of [-10, -4, 5, 10]) ctx.fillRect(lx - 1.6 + (lx > 0 ? st : -st) * 0.5, -8, 3.2, 8);
  // the tail
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -16); if (run || m === 'notice') { ctx.lineTo(-15, -32); } else ctx.quadraticCurveTo(-20, -14, -19, -8); ctx.stroke();
  ctx.fillStyle = INK; if (run || m === 'notice') { ctx.beginPath(); ctx.ellipse(-15, -34, 2, 3.5, 0, 0, TAU); ctx.fill(); }
  ctx.lineWidth = 1.8;
  ctx.fillStyle = '#8a7a72'; ctx.beginPath(); ctx.ellipse(-2, -15, 14, 9, run ? 0.1 : 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4a3a34'; ctx.beginPath(); ctx.moveTo(-10, -23); for (let k = 0; k < 6; k++) ctx.lineTo(-8 + k * 3, -27 + (k % 2) * 3); ctx.lineTo(6, -21); ctx.closePath(); ctx.fill();
  // the head with warts and tusks
  ctx.fillStyle = '#8a7a72'; ctx.beginPath(); ctx.moveTo(8, -20); ctx.lineTo(20, -14); ctx.lineTo(20, -6); ctx.lineTo(9, -7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d8b8a8'; ctx.beginPath(); ctx.ellipse(20, -9, 3, 3.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff8e8'; ctx.beginPath(); ctx.moveTo(16, -9); ctx.quadraticCurveTo(21, -16, 19, -18); ctx.lineTo(18, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6a5a52'; ctx.beginPath(); ctx.arc(13, -12, 2, 0, TAU); ctx.fill();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(12, -16, 1.5, 0, TAU); ctx.fill();
  if (m === 'notice') { ctx.fillRect(9, -20, 6, 1.4); }
  ctx.fillStyle = '#8a7a72'; ctx.beginPath(); ctx.moveTo(6, -21); ctx.lineTo(3, -27); ctx.lineTo(10, -22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
};
// a vulture: bald pink head, a ruff, broad brown wings
const vultureArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  const f = m === 'swoop' ? 0.2 : Math.sin(t * 6);
  ctx.fillStyle = '#5a3e2a'; ctx.beginPath(); ctx.moveTo(-6, -2); ctx.quadraticCurveTo(-16, -16 * f - 4, -30, -12 * f - 2); ctx.lineTo(-22, 2); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7a5a3e'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f4ead8'; ctx.beginPath(); ctx.ellipse(9, -4, 5, 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8a0a0'; ctx.beginPath(); ctx.arc(14, -7, 4.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8d8a8'; ctx.beginPath(); ctx.moveTo(17, -8); ctx.quadraticCurveTo(23, -7, 21, -3); ctx.lineTo(17, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.fillRect(14, -9, 2, 2);
  ctx.fillStyle = '#6a4a30'; ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(-8, -18 * f - 4, -20, -14 * f - 2); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
};
// a weaver bird: bright yellow, a black mask, carrying a blade of grass for its nest
const weaverArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const f = Math.sin(t * (m === 'drop' ? 30 : 16));
  ctx.fillStyle = '#e8b81a'; ctx.beginPath(); ctx.moveTo(-2, -2); ctx.quadraticCurveTo(-10, -12 * f - 2, -16, -8 * f); ctx.lineTo(-2, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd82a'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(6, -3, 4, 3.4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff5a2a'; ctx.beginPath(); ctx.arc(6.5, -4, 1.4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.moveTo(9, -3); ctx.lineTo(14, -1); ctx.lineTo(9, 0); ctx.closePath(); ctx.fill();
  if (m !== 'drop') { ctx.strokeStyle = '#8aaa3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, -1); ctx.quadraticCurveTo(16, 4, 12, 10); ctx.stroke(); }
  ctx.restore();
};
// a crocodile in the river: only the eyes and nostrils show until it lunges out, jaws wide
const crocHead = (ctx, x, y, dir, open, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
  const a = open * 0.75;
  ctx.fillStyle = '#4a7a3a';
  // lower jaw
  ctx.save(); ctx.rotate(a * 0.5); ctx.beginPath(); ctx.moveTo(-18, 6); ctx.lineTo(34, 4); ctx.quadraticCurveTo(38, 8, 32, 12); ctx.lineTo(-18, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff8e8'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-6 + k * 6, 5); ctx.lineTo(-3 + k * 6, -1); ctx.lineTo(0 + k * 6, 5); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // upper jaw and head
  ctx.save(); ctx.rotate(-a * 0.5);
  ctx.fillStyle = '#ff8a8a'; if (open > 0.1) { ctx.beginPath(); ctx.moveTo(-14, 6); ctx.lineTo(30, 4); ctx.lineTo(-14, 12); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#5a8a44'; ctx.beginPath(); ctx.moveTo(-22, 6); ctx.quadraticCurveTo(-20, -10, -6, -10); ctx.lineTo(30, -4); ctx.quadraticCurveTo(40, -2, 36, 5); ctx.lineTo(-22, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff8e8'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-4 + k * 6, 5); ctx.lineTo(-1 + k * 6, 11); ctx.lineTo(2 + k * 6, 5); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#3a6a2a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(-14 + k * 7, -6, 2, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ffe85a'; ctx.beginPath(); ctx.arc(-8, -11, 4.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.fillRect(-8.6, -14, 1.6, 6);
  ctx.beginPath(); ctx.arc(31, -4, 1.4, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.restore();
};

/* a weaver bird: flits over the path with a blade of grass; when Brady is under it, it chatters (0.6 s tell) and drops
   a twig bundle straight down (a hit) */
const weaverThink = (e, dt) => {
  const p = e.g.player, c = e.cfg;
  if (e.cool > 0) e.cool -= dt;
  if (e.state === 'drift') {
    const nx = e.hx + Math.sin(e.t * 0.8 + e.ph) * e.range;
    e.dir = sign(nx - e.x) || e.dir; e.x = nx; e.y = e.hy + Math.sin(e.t * 3 + e.ph) * 5; e.mode = 'fly';
    if (e.cool <= 0 && p && !p.dead && Math.abs(p.cx - e.cx) < 1.6 * TS && p.y > e.y && p.y - e.y < 8 * TS) { e.state = 'tell'; e.st = 0.6; e.g.parts.text(e.cx, e.y - 10, 'CHIRR!', '#ffe28a'); }
  } else if (e.state === 'tell') {
    e.mode = 'drop'; e.st -= dt; e.y = e.hy + Math.sin(e.t * 40) * 1.5;
    if (e.st <= 0) {
      e.state = 'drift'; e.cool = 2.6;
      tourFire(e.g, e.cx, e.y + e.h, { vx: 0, vy: 2 * TS, grav: PHYS.gDown * 0.45, w: 16, h: 14, life: 2.2, col: '#c8a050', art: (cx, s) => { cx.save(); cx.strokeStyle = INK; cx.lineWidth = 1.4; cx.fillStyle = '#d8b860'; cx.beginPath(); cx.ellipse(s.x + s.w / 2, s.y + s.h / 2, 8, 6, 0, 0, TAU); cx.fill(); cx.stroke(); cx.strokeStyle = '#8a6a2a'; for (let k = -1; k <= 1; k++) { cx.beginPath(); cx.moveTo(s.x + 2, s.y + s.h / 2 + k * 3); cx.lineTo(s.x + s.w - 2, s.y + s.h / 2 - k * 2); cx.stroke(); } cx.restore(); } });
    }
  }
};
const enemies = {
  keBeetle: { cls: TourEnemy.make({ w: 30, h: 22, speed: 0.9, behavior: 'walk', edgeTurn: true, art: beetleArt, burst: '#7a5a34' }), place: 'walk' },
  keWarthog: { cls: TourEnemy.make({ w: 32, h: 26, speed: 1.0, behavior: 'charge', range: 8, chargeSpeed: 6.6, windup: 0.55, chargeT: 1.3, edgeTurn: true, art: warthogArt, burst: '#8a7a72',
    onNotice: e => { e.g.parts.text(e.cx, e.y - 12, 'SNORT!', '#ffe28a'); K.sfx('snort', 'bump', { vol: 0.5, pitch: 0.6 }); } }), place: 'walk' },
  keVulture: { cls: TourFlyer.make({ w: 30, h: 20, range: 3, speed: 0.7, swoop: true, art: vultureArt, burst: '#7a5a3e',
    onSwoop: e => { e.g.parts.text(e.cx, e.y - 10, 'SKRAAA!', '#ffffff'); } }), place: 'fly' },
  keWeaver: { cls: TourFlyer.make({ w: 22, h: 16, range: 2, speed: 0.9, art: weaverArt, burst: '#ffd82a', think: weaverThink }), place: 'fly' }
};

/* ---------------- THE HERD (15-1): the wildebeest migration as the level's moving floor ----------------
   A herd zone (pieces herdOn ... herdOff) gets a KeHerd: it sends wildebeest running right through the zone every
   second or so. Their backs are one-way platforms that follow a path worked out when the level is built: along the
   plain, swimming low through the rivers (only their backs and horns show), and LEAPING over the thorn thickets that
   are too tall to jump. The validator walks the same path as one-way ghosts. The path never drops faster than one row
   per column, so a rider stays on his gnu all the way down. */
const GNU = { W: 80, H: 30, SPEED: 7.2, SNAP: 22 };
class KeGnu extends Ent {
  constructor(g, s) {
    super(g, s, GNU.W, 14); this.herd = s.herd; this.isPlatform = true; this.x = s.x; this.speed = s.speed || GNU.SPEED;
    this.seed = Math.floor(Math.random() * 99); this.y = this.herd.backAt(this.cx); this.dx = 0; this.dy = 0; this.leg = Math.random() * 6; this.prevY = this.y;
  }
  update(dt) {
    this.t += dt; const H = this.herd;
    const nx = this.x + this.speed * TS * dt, ny = H.backAt(nx + this.w / 2);
    this.dx = nx - this.x; this.dy = ny - this.y; this.x = nx; this.y = ny;
    this.leg += dt * this.speed * 2.2;
    // forgiving boarding (a thumb on a phone): Brady dropping onto a back within a few pixels of it, or just past its
    // ends, is snapped onto it; and a back that runs out from under him keeps him for a moment (coyote: the next gnu
    // behind usually arrives inside that time)
    const p = this.g.player;
    if (p && !p.dead && p.state === 'play' && !p.onGround && p.vy >= 0 && !p.inWater) {
      const feet = p.y + p.h, S = GNU.SNAP;
      if (feet >= this.y - 14 && feet <= this.y + 12 && p.x + p.w > this.x - S && p.x < this.x + this.w + S) {
        p.x = clamp(p.x, this.x - p.w + 8, this.x + this.w - 8); p.y = this.y - p.h + 1; p.vy = Math.max(p.vy, TS);
      }
    }
    this.air = H.modeAt(this.cx) === 'leap'; this.swim = H.modeAt(this.cx) === 'swim';
    if (this.swim && Math.random() < 0.25) this.g.burst(this.x + 4, this.y + 12, 1, '#ffffff', 'bubble');
    if (!this.swim && !this.air && Math.random() < 0.15) this.g.burst(this.x + 6, this.y + GNU.H, 1, '#e8c890', 'dust');
    if (this.x > H.x1 * TS) this.remove = true;
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.y, t = this.t, sw = this.swim, air = this.air, L = this.leg;
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    const bob = sw ? Math.sin(t * 5) * 1.5 : air ? 0 : Math.abs(Math.sin(L)) * -2.5;
    ctx.translate(0, bob);
    // legs (galloping, tucked in a leap, hidden in the water)
    if (!sw) {
      ctx.strokeStyle = '#3a3438'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      const legs = air ? [[-18, 0.9], [-12, 0.9], [14, -0.9], [20, -0.9]] : [[-18, Math.sin(L)], [-12, Math.sin(L + 1.6)], [14, Math.sin(L + 3.1)], [20, Math.sin(L + 4.7)]];
      for (const [lx, a] of legs) { ctx.beginPath(); ctx.moveTo(lx, 14); ctx.lineTo(lx + a * 9, 28 + (air ? -6 : 0)); ctx.stroke(); }
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
    }
    // the body: grey-brown with darker stripes on the shoulders
    ctx.fillStyle = '#6a6470'; ctx.beginPath(); ctx.moveTo(-28, 4); ctx.quadraticCurveTo(-26, -2, -12, 0); ctx.lineTo(14, -4); ctx.quadraticCurveTo(24, -6, 26, 4); ctx.lineTo(24, 18); ctx.lineTo(-26, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#4a4450'; ctx.lineWidth = 1.6; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(6 + k * 4, -2); ctx.lineTo(4 + k * 4, 12); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the mane along the back (Brady stands on it), the tail
    ctx.fillStyle = '#2a2428'; ctx.beginPath(); ctx.moveTo(-6, 1); for (let k = 0; k < 7; k++) ctx.lineTo(-4 + k * 4, -3 - (k % 2) * 3); ctx.lineTo(24, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2a2428'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-27, 5); ctx.quadraticCurveTo(-36, 6 + Math.sin(t * 10) * 3, -38, 14); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the head: long face, a beard, curved horns
    ctx.save(); ctx.translate(24, 2); ctx.rotate(air ? -0.3 : sw ? -0.5 : 0.25 + Math.sin(L) * 0.08);
    ctx.fillStyle = '#5a5460'; ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(18, 6); ctx.quadraticCurveTo(22, 12, 16, 14); ctx.lineTo(-4, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a2428'; ctx.beginPath(); ctx.moveTo(4, 6); ctx.lineTo(8, 18); ctx.lineTo(12, 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e8dcc8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(-8, -12, -2, -16); ctx.moveTo(4, -4); ctx.quadraticCurveTo(10, -14, 4, -17); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(6, -1, 1.6, 0, TAU); ctx.fill();
    ctx.restore();
    // the water around a swimmer
    if (sw) { ctx.fillStyle = '#9a6a3e'; ctx.fillRect(-40, 15 - bob, 80, 18); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-38, 16 - bob); ctx.quadraticCurveTo(-26, 12 - bob, -14, 16 - bob); ctx.moveTo(12, 16 - bob); ctx.quadraticCurveTo(26, 11 - bob, 38, 16 - bob); ctx.stroke(); }
    ctx.restore();
  }
}
class KeHerd extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.x0 = s.x0; this.x1 = s.x1; this.prof = s.prof; this.modes = s.modes; this.every = s.every || 1.25; this.cool = 0.2; this.x = s.x0 * TS; this.y = 0;
  }
  // the gnu's back height at world x (px): the profile is per column, eased between column centres
  backAt(px) {
    const f = px / TS - 0.5 - this.x0, i = Math.floor(f), P = this.prof;
    if (i < 0) return P[0]; if (i >= P.length - 1) return P[P.length - 1];
    const k = f - i; return P[i] + (P[i + 1] - P[i]) * k;
  }
  modeAt(px) { const i = Math.floor(px / TS) - this.x0; return this.modes[clamp(i, 0, this.modes.length - 1)] || 'run'; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    // only while Brady is near the zone; gnus come in from the left edge of the view (or the zone's start)
    const vx0 = g.camX, vx1 = g.camX + Game.viewW;
    if (vx1 < this.x0 * TS - 2 * TS || vx0 > this.x1 * TS) return;
    this.cool -= dt;
    if (this.cool <= 0) {
      this.cool = this.every * (0.85 + Math.random() * 0.3);
      const sx = Math.max(this.x0 * TS, vx0 - GNU.W - TS);
      if (sx < this.x1 * TS - 3 * TS) { const e = new KeGnu(g, { x: sx, y: 0, herd: this, speed: GNU.SPEED * (0.95 + Math.random() * 0.1) }); g.spawn(e); }
    }
  }
}

/* the thorn thicket drawn over its tiles: a tangle of whistling-thorn branches, white thorns, a few galls */
class KeThicket extends Ent {
  constructor(g, s) { super(g, s, (s.w || 2) * TS, (s.h || 6) * TS); this.x = s.x - TS / 2; this.y = s.y + TS - this.h; this.friendly = true; this.seed = s.x; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x = this.x - 8, y = this.y - 6, w = this.w + 16, h = this.h + 6, R = mulberry32(this.seed | 0);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
    ctx.fillStyle = '#4a3a22'; ctx.beginPath(); ctx.moveTo(x, y + h);
    for (let k = 0; k <= 8; k++) { const yy = y + h - (h * k / 8); ctx.lineTo(x + (k % 2 ? -6 : 2), yy); }
    ctx.quadraticCurveTo(x + w / 2, y - 14, x + w, y + 6);
    for (let k = 8; k >= 0; k--) { const yy = y + h - (h * k / 8); ctx.lineTo(x + w + (k % 2 ? 6 : -2), yy); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 3;
    for (let k = 0; k < this.h / 14; k++) { const yy = y + 10 + R() * (h - 16), x0 = x + R() * w * 0.3; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + w * (0.5 + R() * 0.5), yy + (R() - 0.5) * 24); ctx.stroke(); }
    ctx.fillStyle = '#6a8a2a'; for (let k = 0; k < this.h / 10; k++) { ctx.beginPath(); ctx.ellipse(x + 4 + R() * (w - 8), y + 6 + R() * (h - 12), 5, 3, R() * 3, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#fff4dc'; ctx.lineWidth = 1.6;
    for (let k = 0; k < this.h / 6; k++) { const tx = x + R() * w, ty = y + R() * h, d = R() < 0.5 ? -1 : 1; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + d * 5, ty - 4); ctx.stroke(); }
    ctx.fillStyle = '#2a1a0e'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + 6 + R() * (w - 12), y + 12 + R() * (h - 24), 3.5, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

/* a gully: a pit drawn as a deep red ravine (so an open gap never reads as more plain) */
class KeGap extends Ent {
  constructor(g, s) { super(g, s, (s.w || 4) * TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, H = this.g.area.H * TS;
    ctx.save();
    const gr = ctx.createLinearGradient(0, y, 0, y + 5 * TS); gr.addColorStop(0, '#7a2e16'); gr.addColorStop(1, '#2a0e06');
    ctx.fillStyle = gr; ctx.fillRect(x, y + 6, w, H - y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x, y + 6, 8, H - y); ctx.fillRect(x + w - 8, y + 6, 8, H - y);
    ctx.strokeStyle = '#5a1e0a'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { const yy = y + 30 + k * 34; ctx.beginPath(); ctx.moveTo(x + 4, yy); ctx.lineTo(x + 16, yy + 8); ctx.moveTo(x + w - 4, yy + 14); ctx.lineTo(x + w - 18, yy + 20); ctx.stroke(); }
    ctx.restore();
  }
}

/* the warren's shafts: dark earth behind the root ledges (the engine darkens only empty tunnel cells) */
class KeShaft extends Ent {
  constructor(g, s) { super(g, s, (s.w || 4) * TS, (s.h || 5) * TS); this.x = s.x - TS / 2; this.y = s.y + TS - this.h; this.friendly = true; this.back = true; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x = this.x, y = this.y;
    ctx.save(); ctx.fillStyle = '#4a1e0e'; ctx.fillRect(x, y, 2 * TS, 6 * TS); ctx.fillRect(x + 2 * TS, y + TS, 2 * TS, 5 * TS);
    // the root ledges (the one-way tiles under the hole and beside it), drawn again over the dark
    for (const [lx, ly] of [[0, 3], [2, 5]]) { ctx.save(); ctx.translate(x + lx * TS, y + ly * TS); rootSemi.paint(ctx, 'S', 2, 2 * TS - 2); ctx.restore(); }
    ctx.restore();
  }
}

/* ---------------- the crocodiles (15-1's rivers) ---------------- */
/* KeRiver draws a river over a pit (muddy brown water, ripples), so the pit reads as a river; a fall in is the end of a
   life (the crocs). KeCroc lurks in it: only its eyes show, drifting; when Brady (on a gnu or on the bank) comes
   within reach, bubbles rise and the eyes lift (0.9 s), then it LUNGES out of the water, jaws wide, for 0.6 s. A
   stomp on its snout while it is up sends it under for good. */
class KeRiver extends Ent {
  constructor(g, s) { super(g, s, (s.w || 8) * TS, 4 * TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.back = true; this.wl = s.y - TS + 10; this.friendly = true; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x = this.x, w = this.w, y = this.wl, t = this.t, H = this.g.area.H * TS;
    ctx.save();
    ctx.fillStyle = '#9a6a3e'; ctx.fillRect(x - 2, y, w + 4, H - y);
    ctx.fillStyle = '#7a5230'; ctx.fillRect(x - 2, y + 26, w + 4, H - y);
    ctx.fillStyle = 'rgba(255,240,210,0.55)';
    for (let k = 0; k < w / 24; k++) { const ph = (t * 0.6 + k * 0.37) % 1; const rx = x + ((k * 47 + t * 30) % w); ctx.fillRect(rx, y + 6 + (k % 3) * 7, 14 * (1 - ph) + 4, 1.6); }
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let xx = x; xx <= x + w; xx += 8) ctx.lineTo(xx, y + Math.sin(xx * 0.08 + t * 3) * 1.6); ctx.stroke();
    ctx.restore();
  }
}
class KeCroc extends Ent {
  constructor(g, s) {
    super(g, s, 64, 26); this.enemy = true; this.hx = s.x - 32; this.x = this.hx; this.wl = s.y - TS + 10; this.y = this.wl - 6;
    this.span = (s.span || 3) * TS; this.state = 'under'; this.st = 1 + Math.random() * 1.5; this.dir = -1; this.open = 0; this.mode = 'under';
  }
  update(dt) {
    this.t += dt; const p = this.g.player;
    if (this.state === 'gone') { this.mode = 'gone'; this.y = this.wl + 40; return; }
    this.st -= dt;
    if (this.state === 'under') {
      this.mode = 'under'; this.open = 0;
      this.x = this.hx + Math.sin(this.t * 0.5) * this.span; this.y = this.wl - 4;
      if (this.st <= 0 && p && !p.dead && Math.abs(p.cx - this.cx) < 4.5 * TS && p.y < this.wl + TS) { this.state = 'tell'; this.st = 0.9; this.dir = p.cx < this.cx ? -1 : 1; this.lockX = clamp(p.cx - this.w / 2, this.hx - this.span, this.hx + this.span); K.sfx('bubble', 'swim', { vol: 0.4, pitch: 0.6 }); }
    } else if (this.state === 'tell') {
      this.mode = 'under'; this.x = approach(this.x, this.lockX, 3 * TS * dt); this.y = this.wl - 8 - Math.sin(this.t * 30) * 1;
      if (Math.random() < 0.6) this.g.burst(this.cx + (Math.random() - 0.5) * 40, this.wl + 2, 1, '#ffffff', 'bubble');
      if (this.st <= 0) { this.state = 'snap'; this.st = 0.65; this.g.parts.text(this.cx, this.wl - 70, 'SNAP!', '#ffffff'); K.sfx('chomp', 'stomp', { vol: 0.5, pitch: 0.7 }); this.g.burst(this.cx, this.wl, 10, '#ffffff', 'bubble'); }
    } else if (this.state === 'snap') {
      this.mode = 'snap'; const k = 1 - this.st / 0.65; this.open = Math.sin(Math.min(1, k * 1.4) * Math.PI);
      this.y = this.wl - 6 - Math.sin(Math.min(1, k * 1.2) * Math.PI) * 2.2 * TS;
      if (this.st <= 0) { this.state = 'under'; this.st = 2.2 + Math.random() * 1.2; }
    }
  }
  hit(kind, src) {
    if (this.state !== 'snap' && this.state !== 'tell') return false;
    if (kind === 'stomp' || kind === 'spin' || kind === 'star') { this.state = 'gone'; Sound.play('stomp'); this.g.burst(this.cx, this.wl, 14, '#ffffff', 'bubble'); this.g.addScore(400, this.cx, this.y); this.g.parts.text(this.cx, this.y - 10, 'GLUB...', '#ffffff'); return true; }
    return false;
  }
  touchPlayer(p) { if (this.state === 'snap') p.hurt(this); }
  draw(ctx) {
    if (this.state === 'gone') return;
    const x = this.cx, y = this.y + this.h * 0.5, wl = this.wl;
    ctx.save(); ctx.beginPath(); ctx.rect(this.cx - 80, this.y - 80, 160, wl - this.y + 82); ctx.clip();
    if (this.state === 'snap') crocHead(ctx, x - this.dir * 6, y + 4, this.dir, this.open, this.t);
    else {
      // just the eyes and the nostrils over the water
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#4a7a3a';
      const ey = wl - (this.state === 'tell' ? 9 : 4);
      for (const ox of [-10, 0]) { ctx.beginPath(); ctx.ellipse(x + ox * this.dir - this.dir * 6, ey, 5, 5, 0, Math.PI, 0); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffe85a'; ctx.beginPath(); ctx.arc(x + ox * this.dir - this.dir * 6, ey - 2, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a7a3a'; }
      ctx.beginPath(); ctx.ellipse(x + this.dir * 24, wl - 2, 4, 3, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    if (this.state === 'tell') { ctx.save(); ctx.fillStyle = '#ffffff'; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('!', this.cx, wl - 24 + Math.sin(this.t * 20) * 2); ctx.restore(); }
  }
}

/* ---------------- THE GIRAFFES (15-2): living lifts and bridges ----------------
   Brady picks up a bunch of acacia leaves from a sapling (KeLeafBush) and keeps it. A giraffe's head is a platform
   on a path of the level's design (low by its feet, up high, out across a gap: path points in tiles relative to the
   giraffe). The giraffe follows the leaves: standing on its head, Brady holds them UP (hold up) and the head climbs
   the path; DOWN brings it back. Off the head, a giraffe whose path end Brady stands near bends that end down to
   him. Without leaves a giraffe just browses. The validator walks the path as one-way ghosts. */
const GIR = { HW: 2.5, SPEED: 3.0 };
class KeGiraffe extends Ent {
  constructor(g, s) {
    super(g, s, GIR.HW * TS, 14); this.isPlatform = true; this.bx = s.x; this.by = s.y; this.dir = s.dir || 1;
    this.path = s.path.map(([a, b]) => [s.x + a * TS, s.y + b * TS]);
    this.k = s.k0 || 0; this.seg = []; let L = 0; for (let i = 1; i < this.path.length; i++) { const d = Math.hypot(this.path[i][0] - this.path[i - 1][0], this.path[i][1] - this.path[i - 1][1]); this.seg.push(d); L += d; }
    this.len = L; this.pos = this.k * L; this.place(true); this.chew = 0; this.spot = s.spot || 0;
  }
  at(d) {
    let i = 0; d = clamp(d, 0, this.len);
    while (i < this.seg.length - 1 && d > this.seg[i]) { d -= this.seg[i]; i++; }
    const a = this.path[i], b = this.path[i + 1], k = this.seg[i] ? clamp(d / this.seg[i], 0, 1) : 0;
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  }
  place(first) {
    const [hx, hy] = this.at(this.pos), nx = hx - this.w / 2, ny = hy - TS + 2;
    this.dx = first ? 0 : nx - this.x; this.dy = first ? 0 : ny - this.y; this.x = nx; this.y = ny;
  }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player, leaf = !!g.keLeaf;
    let v = 0;
    if (p && !p.dead && leaf) {
      const riding = p.ride === this && p.onGround;
      if (riding) { const inp = p.inp || {}; v = inp.up ? 1 : inp.down ? -1 : 0; if (v) this.chew = 0.3; }
      else {
        // bend the nearer end down to Brady when he stands near it with the leaves
        const a = this.path[0], b = this.path[this.path.length - 1];
        const da = Math.hypot(p.cx - a[0], p.y + p.h - a[1]), db = Math.hypot(p.cx - b[0], p.y + p.h - b[1]);
        if (Math.min(da, db) < 6 * TS) v = da < db ? -1 : 1;
      }
    }
    const step = v * GIR.SPEED * TS * dt;
    this.pos = clamp(this.pos + step, 0, this.len);
    this.place(false);
    if (this.chew > 0) this.chew -= dt;
  }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, t = this.t, bx = this.bx, by = this.by, d = this.dir, hx = this.cx, hy = this.y + 10;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // legs and body (the body stands at the base point, facing dir)
    const shx = bx + d * 26, shy = by - 4.4 * TS;
    ctx.fillStyle = '#e8b04a';
    for (const lx of [-34, -24, 18, 28]) { ctx.beginPath(); ctx.moveTo(bx + d * lx - 4, by - 2.6 * TS); ctx.lineTo(bx + d * lx - 3, by); ctx.lineTo(bx + d * lx + 3, by); ctx.lineTo(bx + d * lx + 4, by - 2.6 * TS); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#5a3a1a'; for (const lx of [-34, -24, 18, 28]) ctx.fillRect(bx + d * lx - 4, by - 6, 8, 6);
    ctx.fillStyle = '#e8b04a'; ctx.beginPath(); ctx.moveTo(bx - d * 42, by - 2.6 * TS); ctx.quadraticCurveTo(bx - d * 44, by - 3.9 * TS, bx - d * 20, by - 3.9 * TS); ctx.lineTo(shx, shy); ctx.quadraticCurveTo(bx + d * 42, by - 3.6 * TS, bx + d * 34, by - 2.5 * TS); ctx.closePath(); ctx.fill(); ctx.stroke();
    // the neck: a thick tube from the shoulder to the head, bending with it
    const mx = (shx + hx) / 2 + d * 10, my = Math.min(shy, hy) - 20;
    ctx.lineWidth = 22; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(shx, shy + 8); ctx.quadraticCurveTo(mx, my, hx - d * 6, hy + 6); ctx.stroke();
    ctx.lineWidth = 18; ctx.strokeStyle = '#e8b04a'; ctx.stroke();
    // the patches along the neck and on the body
    ctx.fillStyle = '#a85a24';
    for (let k = 0.15; k < 0.95; k += 0.17) { const q = 1 - k, px = q * q * shx + 2 * q * k * mx + k * k * (hx - d * 6), py = q * q * (shy + 8) + 2 * q * k * my + k * k * (hy + 6); ctx.beginPath(); ctx.ellipse(px, py, 5, 4, k * 3, 0, TAU); ctx.fill(); }
    for (const [ox, oy] of [[-30, -3.4], [-14, -3.1], [2, -3.5], [18, -3.0], [-22, -2.8]]) { ctx.beginPath(); ctx.ellipse(bx + d * ox, by + oy * TS, 7, 5, ox, 0, TAU); ctx.fill(); }
    // the mane
    ctx.strokeStyle = '#8a4a1a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(shx - d * 6, shy); ctx.quadraticCurveTo(mx - d * 12, my - 6, hx - d * 18, hy - 2); ctx.stroke();
    // the tail
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - d * 42, by - 3.4 * TS); ctx.quadraticCurveTo(bx - d * 52, by - 3 * TS + Math.sin(t * 2) * 6, bx - d * 50, by - 2.4 * TS); ctx.stroke();
    // the head: flat on top (Brady stands on it), ossicones, ears, long lashes; munching when it has the leaves
    ctx.save(); ctx.translate(hx, hy); ctx.scale(d, 1); ctx.lineWidth = 2.2; ctx.strokeStyle = INK;
    ctx.fillStyle = '#f0bc58'; ctx.beginPath(); ctx.moveTo(-36, -8); ctx.lineTo(28, -8); ctx.quadraticCurveTo(44, -6, 42, 6); ctx.quadraticCurveTo(38, 14, 22, 12); ctx.lineTo(-30, 8); ctx.quadraticCurveTo(-40, 2, -36, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8784a'; ctx.beginPath(); ctx.ellipse(36, 4, 7, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(38, 1, 1.4, 0, TAU); ctx.fill();
    const chew = this.chew > 0 ? Math.sin(t * 30) * 2 : 0;
    ctx.beginPath(); ctx.moveTo(26, 10 + chew); ctx.lineTo(38, 10 + chew); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(4, -1, 4.5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(5.5, -1, 2.2, 0, TAU); ctx.fill();
    ctx.lineWidth = 1.6; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(1 + k * 3, -5); ctx.lineTo(0 + k * 4, -9); ctx.stroke(); }
    ctx.lineWidth = 2.2; ctx.fillStyle = '#f0bc58'; ctx.beginPath(); ctx.ellipse(-16, -12, 9, 4, -0.5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a85a24'; for (const ox of [-6, 2]) { ctx.fillRect(ox - 2, -18, 4, 10); ctx.strokeRect(ox - 2, -18, 4, 10); ctx.beginPath(); ctx.arc(ox, -19, 3.6, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    // a hint: the leaves draw it; a small arrow over the head while Brady rides it with leaves
    const p = g.player;
    if (p && p.ride === this && g.keLeaf && this.len > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center';
      const up = this.pos < this.len - 2, dn = this.pos > 2;
      if (up) ctx.fillText('▲ UP', hx, this.y - 62 + Math.sin(t * 6) * 2);
      if (dn) ctx.fillText('▼ DOWN', hx, this.y + 34);
    }
    ctx.restore();
  }
}
// an acacia sapling with bunches of leaves within reach: touch it to take a bunch (the giraffes follow it)
class KeLeafBush extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 2 * TS); this.back = true; this.wig = 0; }
  update(dt) { this.t += dt; if (this.wig > 0) this.wig -= dt; }
  touchPlayer(p) {
    const g = this.g;
    if (!g.keLeaf) { g.keLeaf = true; this.wig = 0.6; Sound.play('coin', { pitch: 0.8 }); g.burst(this.cx, this.y + 10, 10, '#8aca4a', 'confetti'); if (!g.keLeafTold) { g.keLeafTold = true; g.toast && g.toast('ACACIA LEAVES! ON A GIRAFFE\'S HEAD, HOLD UP OR DOWN'); } g.parts.text(this.cx, this.y - 8, 'LEAVES!', '#c8ff8a'); }
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t, w = this.wig > 0 ? Math.sin(t * 40) * 3 : 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x - 2, y - 40); ctx.lineTo(x - 20, y - 52); ctx.lineTo(x - 17, y - 55); ctx.lineTo(x, y - 46); ctx.lineTo(x + 16, y - 56); ctx.lineTo(x + 19, y - 53); ctx.lineTo(x + 3, y - 40); ctx.lineTo(x + 4, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8aca4a'; ctx.beginPath(); ctx.ellipse(x + w, y - 58, 30, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#aae86a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x - 20 + k * 10 + w, y - 61, 3, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
// the bunch of leaves in Brady's hand once he has it (drawn over him; held high while a giraffe climbs)
TourHooks.on('afterEntities', (play, ctx) => {
  if (!play.keLeaf) return; const p = play.player; if (!p || p.dead || p.state === 'dying') return;
  const up = p.inp && p.inp.up, hx = p.cx + p.facing * 10, hy = p.y + (up ? -10 : 12) + Math.sin(play.t * 5) * 1.5;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx, hy + 8); ctx.lineTo(hx, hy - 2); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillStyle = '#8aca4a';
  for (const [ox, oy, a] of [[-5, -4, -0.6], [5, -4, 0.6], [0, -8, 0], [-3, 1, -1], [4, 1, 1]]) { ctx.beginPath(); ctx.ellipse(hx + ox, hy + oy, 4, 2.2, a, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
});

/* ---------------- THE FLAMINGOS (15-3) ----------------
   KeFlamingo stands on one leg in the soda lake: its back is a stepping post. Land on it and it panics: it wobbles
   and squawks (0.75 s), then flaps off; it circles and lands back on its spot 2.6 s later (or on its second spot, for
   the ones that hop between two: `alt`). Startled birds startle their neighbours (`chain`). KeFlock: a skein of three
   flamingos flying a fixed route as one platform (a moving platform skin, 'keFlock'). The lake itself (KeLake) is
   drawn over the pits: deep, caustic soda water: a fall is the end of a life. */
class KeFlamingo extends Ent {
  constructor(g, s) {
    super(g, s, 1.6 * TS, 14); this.isPlatform = true; this.home = [s.x - this.w / 2, s.y - 3 * TS]; this.alt = s.alt ? [s.x - this.w / 2 + s.alt * TS, s.y - 3 * TS] : null;
    this.x = this.home[0]; this.y = this.home[1]; this.spot = this.home; this.state = 'stand'; this.st = 0; this.dx = this.dy = 0; this.chain = !!s.chain; this.dir = s.dir || (Math.random() < 0.5 ? -1 : 1); this.fx = 0; this.fy = 0; this.wl = s.y - TS + 10;
    this.calm = s.calm || 0.75;
  }
  startle(delay) { if (this.state === 'stand') { this.state = 'alarm'; this.st = delay != null ? delay + this.calm : this.calm; } }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    this.dx = this.dy = 0;
    if (this.state === 'stand') {
      this.isPlatform = true;
      if (p && p.ride === this && p.onGround) this.startle();
    } else if (this.state === 'alarm') {
      this.isPlatform = true; this.st -= dt;
      if (this.st <= 0) {
        this.state = 'fly'; this.st = 2.6; this.isPlatform = false; K.sfx('flap', 'jump', { vol: 0.35, pitch: 1.6 }); g.parts.text(this.cx, this.y - 30, 'HONK!', '#ffd0e0');
        if (this.chain) for (const e of g.entities) if (e !== this && e instanceof KeFlamingo && Math.abs(e.cx - this.cx) < 5 * TS) e.startle(0.25);
        if (this.alt) this.spot = this.spot === this.home ? this.alt : this.home;
      }
    } else if (this.state === 'fly') {
      this.isPlatform = false; this.st -= dt;
      const k = this.st / 2.6; this.fx = Math.sin(k * Math.PI) * this.dir * 2 * TS; this.fy = -Math.sin(k * Math.PI) * 5 * TS;
      this.x = this.spot[0] + this.fx * (k > 0.5 ? 1 : 1); this.y = this.spot[1] + this.fy;
      if (this.st <= 0) { this.state = 'stand'; this.x = this.spot[0]; this.y = this.spot[1]; this.fx = this.fy = 0; g.burst(this.cx, this.wl, 6, '#ffffff', 'bubble'); }
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const st = this.state, t = this.t, x = this.cx, y = this.y, d = this.dir, fly = st === 'fly';
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const wob = st === 'alarm' ? Math.sin(t * 50) * 2.5 : 0;
    ctx.translate(x + wob, y);
    if (!fly) {
      // the leg down into the water, the other tucked up
      ctx.strokeStyle = '#e8607a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, this.wl - y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, 14); ctx.lineTo(10, 26); ctx.lineTo(3, 32); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    } else { ctx.strokeStyle = '#e8607a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-d * 10, 8); ctx.lineTo(-d * 34, 12); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2; }
    ctx.scale(d, 1);
    // body (the flat back is the post's top)
    ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.quadraticCurveTo(-8, -4, 18, 0); ctx.quadraticCurveTo(24, 10, 10, 16); ctx.quadraticCurveTo(-12, 20, -26, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-26, 2); ctx.lineTo(-34, 0); ctx.lineTo(-28, 8); ctx.closePath(); ctx.fill();
    // the wing: folded, raised in alarm, flapping in flight
    const wa = fly ? Math.sin(t * 14) * 0.9 : st === 'alarm' ? -0.6 + Math.sin(t * 30) * 0.3 : 0;
    ctx.save(); ctx.translate(-4, 4); ctx.rotate(wa); ctx.fillStyle = '#ff6a90'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-14, -8, -24, 2); ctx.quadraticCurveTo(-10, 8, 0, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-18, -1); ctx.lineTo(-25, 2); ctx.lineTo(-18, 4); ctx.closePath(); ctx.fill(); ctx.restore();
    // the S-neck and the bent beak
    const nx = fly ? 34 : 14, ny = fly ? 2 : -34;
    ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(14, 2); if (fly) ctx.lineTo(nx, ny); else ctx.bezierCurveTo(30, -4, 0, -20, nx, ny); ctx.stroke();
    ctx.lineWidth = 4.4; ctx.strokeStyle = '#ff9ab8'; ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = INK;
    ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.arc(nx, ny, 5.5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff4f4'; ctx.beginPath(); ctx.moveTo(nx + 4, ny - 2); ctx.lineTo(nx + 14, ny + 2); ctx.lineTo(nx + 12, ny + 8); ctx.lineTo(nx + 4, ny + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(nx + 10, ny + 1); ctx.lineTo(nx + 14, ny + 2); ctx.lineTo(nx + 12, ny + 8); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(nx + 1, ny - 1.5, 1.4, 0, TAU); ctx.fill();
    ctx.restore();
    if (st === 'alarm') { ctx.save(); ctx.fillStyle = '#ffffff'; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('!', this.cx, this.y - 46); ctx.restore(); }
    // ripples at the foot
    if (!fly) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.4; const r = 6 + (t * 6) % 10; ctx.beginPath(); ctx.ellipse(x, this.wl + 2, r, r * 0.3, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
  }
}
class KeLake extends Ent {
  constructor(g, s) { super(g, s, (s.w || 8) * TS, 4 * TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.back = true; this.wl = s.y - TS + 10; this.friendly = true; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x = this.x, w = this.w, y = this.wl, t = this.t, H = this.g.area.H * TS;
    ctx.save();
    ctx.fillStyle = '#d0587e'; ctx.fillRect(x - 2, y, w + 4, H - y);
    ctx.fillStyle = '#a03a62'; ctx.fillRect(x - 2, y + 30, w + 4, H - y);
    ctx.fillStyle = '#7a2448'; ctx.fillRect(x - 2, y + 70, w + 4, H - y);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let k = 0; k < w / 28; k++) { const rx = x + ((k * 53 + t * 18) % w); ctx.fillRect(rx, y + 8 + (k % 4) * 6, 18, 1.6); }
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let k = 0; k < w / 40; k++) { const rx = x + ((k * 71) % w); ctx.beginPath(); ctx.ellipse(rx, y + 2, 9, 2, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); for (let xx = x; xx <= x + w; xx += 8) ctx.lineTo(xx, y + Math.sin(xx * 0.06 + t * 2) * 1.4); ctx.stroke();
    ctx.restore();
  }
}
// the skein: three flamingos in a row flying a route as one moving platform
const platforms = {
  keFlock(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const d = e.dx < -0.01 ? -1 : 1;
    for (let k = 0; k < 3; k++) {
      const cx = x + w * (k + 0.5) / 3, f = Math.sin(t * 10 + k * 1.3), by = y + 6;
      ctx.save(); ctx.translate(cx, by); ctx.scale(d, 1);
      ctx.strokeStyle = '#e8607a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, 4); ctx.lineTo(-26, 7); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = '#ff6a90'; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.quadraticCurveTo(-10, -12 * f - 2, -20, -8 * f - 6); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.ellipse(0, 2, 13, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 5.6; ctx.beginPath(); ctx.moveTo(10, 1); ctx.lineTo(26, 0); ctx.stroke(); ctx.lineWidth = 3.4; ctx.strokeStyle = '#ff9ab8'; ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.arc(27, 0, 4, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(30, -1); ctx.lineTo(38, 2); ctx.lineTo(31, 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff6a90'; ctx.beginPath(); ctx.moveTo(2, 0); ctx.quadraticCurveTo(-6, -14 * f - 2, -14, -10 * f - 6); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  },
  // a hippo's back as a bridge in the waterhole (15-5's lead-in): it sinks and rises slowly (a lift skin)
  keHippoBack(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    ctx.fillStyle = '#8a7a9a'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 16, w / 2 + 6, 18, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a89ab8'; ctx.beginPath(); ctx.ellipse(x + w / 2 - 6, y + 6, w / 2 - 12, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a7a9a'; ctx.beginPath(); ctx.ellipse(x + w + 10, y + 10, 14, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + w + 8, y + 4, 2, 0, TAU); ctx.arc(x + w + 18, y + 8, 1.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a7a9a'; ctx.beginPath(); ctx.arc(x + w + 2, y, 3.5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(150,110,70,0.9)'; ctx.fillRect(x - 10, y + 16, w + 34, 10);
    ctx.restore();
  }
};

/* ---------------- HIGH NOON (15-4): the sun, the heat gauge and the shade ----------------
   KeSun (once per area) runs the heat: out in the sun the gauge fills (full in HEAT.FILL s); in shade it empties
   twice as fast. Shade is anything solid or leafy over Brady's head (an acacia's crown, a rock overhang), a cloud's
   shadow drifting over the plain (KeCloud), the shadow of the walking elephant (KeElephant), or a cool waterhole
   (the elephant's trunk spray resets the gauge too). A full gauge makes Brady wilt: it costs a hit, and the gauge
   drops back to half. The gauge sits at the top of the view, with the sun on it; it flashes and the sun glares
   as it nears full (the tell, from 70 %). */
const HEAT = { FILL: 3.4, COOL: 1.4, WILT: 1 };
class KeSun extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; g.keHeat = 0; this.wiltT = 0; this.shadeK = 0; this.told = false; }
  shaded(p) {
    const g = this.g, A = g.area, cx = Math.floor(p.cx / TS), top = Math.floor(p.y / TS);
    for (let y = top - 1; y >= Math.max(0, top - 9); y--) for (const xx of [cx, Math.floor((p.x + 3) / TS), Math.floor((p.x + p.w - 3) / TS)]) { const t = tileAt(A, xx, y); if (SOLID[t] || t === T.SEMI) return 'tree'; }
    for (const e of g.entities) if (e.shadeOf && !e.remove) { const s = e.shadeOf(); if (s && p.cx > s[0] && p.cx < s[1] && p.y + p.h > s[2]) return e.shadeKind || 'cloud'; }
    return null;
  }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    this.x = g.camX; this.y = g.camY;
    if (!p || p.dead || p.state !== 'play') return;
    if (!this.told) { this.told = true; g.toast && g.toast('HIGH NOON! KEEP TO THE SHADE OR YOU WILT'); }
    const sh = this.shaded(p); this.shadeK = sh ? 1 : 0; this.kind = sh;
    if (p.inWater) g.keHeat = 0;
    else if (sh) g.keHeat = Math.max(0, g.keHeat - dt / HEAT.COOL);
    else if (p.star > 0) { /* the star keeps him cool */ }
    else g.keHeat = Math.min(1, g.keHeat + dt / HEAT.FILL);
    if (this.wiltT > 0) this.wiltT -= dt;
    if (g.keHeat >= 1 && this.wiltT <= 0) {
      this.wiltT = 1; g.keHeat = 0.5; g.parts.text(p.cx, p.y - 16, 'TOO HOT!', '#ff8a3a');
      if (!(p.invuln > 0)) p.hurt({ x: p.x + p.facing * 4, w: p.w, cx: p.cx + p.facing * 4, y: p.y, h: p.h, heat: true });
    }
    if (g.keHeat > 0.7 && Math.random() < 0.15) g.burst(p.cx + (Math.random() - 0.5) * 16, p.y, 1, '#ffffff', 'dust');
  }
  draw(ctx) {
    const g = this.g, h = g.keHeat || 0, port = Game.cssH > Game.cssW;
    const W = 150, x = g.camX + Game.viewW / 2 - W / 2, y = g.camY + (port ? 150 : 44);
    const hot = h > 0.7, fl = hot && Math.sin(g.t * 16) > 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(28,20,38,0.7)'; rr(ctx, x - 26, y - 4, W + 40, 22, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a4a3a'; rr(ctx, x, y + 2, W, 10, 5); ctx.fill();
    const gr = ctx.createLinearGradient(x, 0, x + W, 0); gr.addColorStop(0, '#ffe05a'); gr.addColorStop(0.6, '#ff9a2a'); gr.addColorStop(1, '#ff3a2a');
    ctx.fillStyle = gr; rr(ctx, x, y + 2, Math.max(6, W * h), 10, 5); ctx.fill();
    ctx.strokeStyle = INK; rr(ctx, x, y + 2, W, 10, 5); ctx.stroke();
    // the sun at the left: it glares as the gauge fills; a little leaf when Brady is in shade
    const sx = x - 14, sy = y + 7, r = 7 + h * 3 + (fl ? 2 : 0);
    ctx.fillStyle = fl ? '#ffffff' : '#ffd23a'; ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + g.t; ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * (r + 2), sy + Math.sin(a) * (r + 2)); ctx.lineTo(sx + Math.cos(a) * (r + 5), sy + Math.sin(a) * (r + 5)); ctx.stroke(); }
    ctx.fillStyle = INK; ctx.font = TourBackstage.F7; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = this.shadeK ? '#aef08a' : (hot ? '#ffffff' : '#ffe8b0'); ctx.fillText(this.shadeK ? 'SHADE' : 'HEAT', x + W + 4, y + 7);
    ctx.restore();
    // Brady's own glow of heat when it is high (a red rim round the view)
    if (hot) { ctx.save(); ctx.fillStyle = `rgba(255,90,40,${0.12 + 0.08 * Math.sin(g.t * 10)})`; const vx = g.camX, vy = g.camY, vw = Game.viewW, vh = Game.viewH; ctx.fillRect(vx, vy, vw, 10); ctx.fillRect(vx, vy + vh - 10, vw, 10); ctx.fillRect(vx, vy, 10, vh); ctx.fillRect(vx + vw - 10, vy, 10, vh); ctx.restore(); }
  }
}
// a cloud drifting slowly over the plain, its shadow sliding along the ground below it
class KeCloud extends Ent {
  constructor(g, s) { super(g, s, (s.w || 6) * TS, 2 * TS); this.hx = s.x - this.w / 2; this.x = this.hx; this.y = s.y - TS - (5 + (s.sky || 3)) * TS; this.ax = (s.ax || 10) * TS; this.speed = s.speed || 0.12; this.gy = s.y - TS; this.friendly = true; this.back = true; this.ph = s.phase || 0; }
  update(dt) { this.t += dt; this.x = this.hx + (0.5 - 0.5 * Math.cos(this.t * this.speed * TAU + this.ph)) * this.ax; }
  shadeOf() { return [this.x + 6, this.x + this.w - 6, this.y]; }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, gy = this.gy;
    ctx.save();
    // the shadow on the ground (and as a soft column, so it reads which ground is shaded)
    ctx.fillStyle = 'rgba(40,40,90,0.14)'; ctx.fillRect(x + 6, y + 30, w - 12, gy - y - 30);
    ctx.fillStyle = 'rgba(30,30,70,0.32)'; ctx.beginPath(); ctx.ellipse(x + w / 2, gy + 2, w / 2 - 4, 7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(x, y + 30); for (let k = 0; k <= 4; k++) { const cx = x + (k + 0.5) * w / 5; ctx.arc(cx, y + 22 - (k % 2) * 8, w / 9 + (k % 2) * 6, Math.PI, 0); } ctx.lineTo(x + w, y + 30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#dce8f8'; ctx.fillRect(x + 4, y + 24, w - 8, 5);
    ctx.restore();
  }
}
// the elephant: a big old matriarch walking the plain at an easy pace (back and forth between two points); her body
// throws a pool of shade on the ground ahead of the sun; now and then she showers herself (and anyone close) with water
class KeElephant extends Ent {
  constructor(g, s) {
    super(g, s, 4.4 * TS, 3.8 * TS); this.ax = s.x; this.bx = s.x + (s.ax || 30) * TS; this.x = this.ax - this.w / 2; this.y = s.y - TS - this.h; this.dir = 1; this.speed = (s.speed || 2.6) * TS; this.friendly = true; this.back = true; this.spray = 0; this.cool = 3 + Math.random() * 2; this.shadeKind = 'elephant'; this.wait = 0;
  }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    if (this.wait > 0) { this.wait -= dt; }
    else { this.x += this.dir * this.speed * dt; if (this.dir > 0 && this.cx >= this.bx) { this.dir = -1; this.wait = 1.2; } if (this.dir < 0 && this.cx <= this.ax) { this.dir = 1; this.wait = 1.2; } }
    this.cool -= dt;
    if (this.cool <= 0 && this.spray <= 0) { this.spray = 1.4; this.cool = 6; K.sfx('trumpet', 'horn', { vol: 0.4 }); g.parts.text(this.cx + this.dir * 60, this.y - 10, 'PFFRRRT!', '#bfefff'); }
    if (this.spray > 0) {
      this.spray -= dt;
      for (let k = 0; k < 2; k++) g.burst(this.cx + this.dir * (this.w / 2 + 20) + (Math.random() - 0.5) * 30, this.y - 10 - Math.random() * 30, 1, '#9adcff', 'bubble');
      if (p && !p.dead && Math.abs(p.cx - this.cx) < this.w * 0.9) { g.keHeat = 0; }
    }
  }
  shadeOf() { return [this.x - 6, this.x + this.w + 6, this.y + this.h * 0.3]; }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h, t = this.t, d = this.dir, cx = this.cx;
    ctx.save();
    ctx.fillStyle = 'rgba(30,30,70,0.32)'; ctx.beginPath(); ctx.ellipse(cx, y + h + 2, w / 2 + 14, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(30,30,70,0.12)'; ctx.fillRect(x - 6, y + h * 0.35, w + 12, h * 0.65);
    ctx.translate(cx, y + h); ctx.scale(d, 1); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
    const L = this.wait > 0 ? 0 : t * 4;
    ctx.fillStyle = '#9a96a8';
    for (const [lx, ph] of [[-46, 0], [-26, 2], [22, 1], [42, 3]]) { const s = Math.sin(L + ph) * 6; ctx.beginPath(); rr(ctx, lx - 10 + s, -44, 20, 44, 6); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-64, -50); ctx.quadraticCurveTo(-70, -112, -10, -118); ctx.quadraticCurveTo(46, -118, 58, -76); ctx.lineTo(56, -40); ctx.quadraticCurveTo(0, -30, -60, -36); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#aeaabb'; ctx.beginPath(); ctx.ellipse(-12, -100, 34, 9, -0.1, 0, TAU); ctx.fill();
    // head, the big ear, the trunk (raised while spraying), tusks
    ctx.fillStyle = '#9a96a8'; ctx.beginPath(); ctx.ellipse(62, -84, 26, 28, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a86a0'; ctx.beginPath(); ctx.moveTo(48, -108); ctx.quadraticCurveTo(14, -112, 16, -74); ctx.quadraticCurveTo(22, -50, 46, -60); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c89aa8'; ctx.beginPath(); ctx.ellipse(30, -84, 9, 14, 0.2, 0, TAU); ctx.fill();
    ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(80, -76);
    if (this.spray > 0) ctx.quadraticCurveTo(104, -90, 96, -132); else ctx.quadraticCurveTo(96, -40 + Math.sin(t * 2) * 4, 86, -14);
    ctx.stroke(); ctx.lineWidth = 8.4; ctx.strokeStyle = '#9a96a8'; ctx.stroke();
    ctx.lineWidth = 2.4; ctx.strokeStyle = INK; ctx.fillStyle = '#fff8e8'; ctx.beginPath(); ctx.moveTo(72, -66); ctx.quadraticCurveTo(84, -50, 92, -54); ctx.lineTo(74, -60); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(66, -92, 2.6, 0, TAU); ctx.fill();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-64, -60); ctx.quadraticCurveTo(-74, -50, -70, -36); ctx.stroke();
    if (this.spray > 0) { ctx.fillStyle = 'rgba(140,210,255,0.6)'; for (let k = 0; k < 8; k++) { const a = -1.4 + k * 0.2, r = 30 + ((t * 120 + k * 17) % 60); ctx.beginPath(); ctx.arc(96 + Math.cos(a) * r * 0.5 - 40, -132 + Math.sin(a) * -r * 0.2 + r * 0.6, 4, 0, TAU); ctx.fill(); } }
    ctx.restore();
  }
}
// a puddle / small waterhole on the noon plain: standing in it cools Brady at once (drawn over sunk ground)
class KePuddle extends Ent {
  constructor(g, s) { super(g, s, (s.w || 3) * TS, 12); this.x = s.x - TS / 2; this.y = s.y - TS - 6; this.friendly = true; this.back = true; this.shadeKind = 'water'; }
  update(dt) { this.t += dt; }
  shadeOf() { return [this.x, this.x + this.w, this.y - 2 * TS]; }
  draw(ctx) { const x = this.x, y = this.y + 6, w = this.w; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#6ab8e8'; ctx.beginPath(); ctx.ellipse(x + w / 2, y, w / 2 + 4, 6, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x + w / 2 - 10 + Math.sin(this.t * 2) * 6, y - 2, 12, 1.6); ctx.restore(); }
}

/* ---------------- THE WARREN (15-6): the sentries and the eagle ----------------
   KeSentry: a meerkat standing guard on a mound. If Brady is above ground (row <= the area's surface, s.surf) within
   its sight (9 tiles) it WHISTLES: a shadow appears on the ground under Brady and locks there after 0.5 s; at 1.1 s a
   martial eagle stoops through the shadow's column. Out of the shadow (or down a burrow) Brady is safe. The sentry
   then needs 3 s to whistle again. A stomp sends a sentry ducking down its hole for a while. */
class KeSentry extends Ent {
  constructor(g, s) { super(g, s, 20, 30); this.enemy = false; this.friendly = true; this.surf = s.surf; this.state = 'watch'; this.st = 0; this.cool = 0.5; this.dir = s.dir || 1; this.mode = 'watch'; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    if (this.cool > 0) this.cool -= dt;
    if (this.state === 'watch') {
      this.mode = 'watch';
      if (p) this.dir = p.cx < this.cx ? -1 : 1;
      const above = p && !p.dead && p.y + p.h <= (this.surf + 0.2) * TS && p.state === 'play';
      if (above && this.cool <= 0 && Math.abs(p.cx - this.cx) < 9 * TS && !g.entities.some(e => e instanceof KeEagle && !e.remove)) {
        this.state = 'whistle'; this.st = 0.6; K.sfx('whistle', 'select', { vol: 0.5, pitch: 2.2 }); g.parts.text(this.cx, this.y - 12, 'WHEEEP!', '#ffffff');
        g.spawn(new KeEagle(g, { x: p.cx, y: this.surf * TS }));
      }
    } else if (this.state === 'whistle') { this.mode = 'whistle'; this.st -= dt; if (this.st <= 0) { this.state = 'watch'; this.cool = 3.2; } }
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t, d = this.dir, wh = this.state === 'whistle';
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
    const bob = wh ? Math.sin(t * 30) * 1 : Math.sin(t * 2) * 0.6;
    ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-14, 2, -16, 8); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -12 + bob, 7, 13, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f0dcb8'; ctx.beginPath(); ctx.ellipse(1.5, -10 + bob, 4, 9, 0, 0, TAU); ctx.fill();
    // paws held up on the chest, the head looking out
    ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.ellipse(4, -16 + bob, 3, 2, 0.4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(2, -29 + bob, 6, 5.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -30 + bob); ctx.lineTo(11, -28 + bob); ctx.lineTo(6, -26 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.ellipse(3, -30 + bob, 2.6, 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(3.6, -30.4 + bob, 0.8, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(11, -28 + bob, 1, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(-3, -32 + bob, 2, 0, TAU); ctx.fill();
    if (wh) { ctx.beginPath(); ctx.arc(10, -25 + bob, 2, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
}
class KeEagle extends Ent {
  constructor(g, s) { super(g, s, 40, 30); this.enemy = true; this.gx = s.x; this.gy = s.y; this.state = 'shadow'; this.st = 0; this.x = s.x - 20; this.y = -60; this.mode = 'hide'; this.dir = 1; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player; this.st += dt;
    if (this.state === 'shadow') {
      this.mode = 'hide'; this.y = g.camY - 80;
      // the shadow follows Brady for half a second, then locks
      if (this.st < 0.5 && p && !p.dead) this.gx = approach(this.gx, p.cx, 10 * TS * dt);
      this.x = this.gx - this.w / 2;
      if (this.st >= 1.1) { this.state = 'stoop'; this.st = 0; this.y0 = g.camY - 60; K.sfx('screech', 'wind', { vol: 0.5, pitch: 1.6 }); g.parts.text(this.gx, this.gy - 3 * TS, 'KYAAA!', '#ffffff'); }
    } else if (this.state === 'stoop') {
      this.mode = 'stoop'; const k = Math.min(1, this.st / 0.45);
      this.y = lerp(this.y0, this.gy - this.h - 4, k * k); this.x = this.gx - this.w / 2;
      if (k >= 1) { this.state = 'up'; this.st = 0; g.burst(this.gx, this.gy, 10, '#e8c890', 'dust'); g.shake(3); }
    } else if (this.state === 'up') {
      this.mode = 'gone'; this.y -= 16 * TS * dt; this.x += 8 * TS * dt;
      if (this.st > 1.2) this.remove = true;
    }
  }
  hit(kind) { return false; }
  touchPlayer(p) { if (this.state === 'stoop') p.hurt(this); }
  draw(ctx) {
    const g = this.g, t = this.t;
    // the shadow on the ground (grows and darkens: the tell)
    if (this.state !== 'up') {
      const k = this.state === 'shadow' ? Math.min(1, this.st / 1.1) : 1;
      ctx.save(); ctx.fillStyle = `rgba(20,10,30,${0.2 + 0.35 * k})`; ctx.beginPath(); ctx.ellipse(this.gx, this.gy + 2, 18 + 14 * k, 5 + 2 * k, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(255,80,60,${0.5 * k})`; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(this.gx, this.gy - 4); ctx.lineTo(this.gx, g.camY); ctx.stroke(); ctx.restore();
    }
    if (this.state === 'shadow') return;
    const x = this.cx, y = this.cy;
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    const f = this.state === 'stoop' ? -0.6 : Math.sin(t * 12);
    ctx.fillStyle = '#5a4a3a';
    ctx.beginPath(); ctx.moveTo(-4, -4); ctx.quadraticCurveTo(-24, -20 * f - 8, -40, -10 * f - 16); ctx.lineTo(-10, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, -4); ctx.quadraticCurveTo(24, -20 * f - 8, 40, -10 * f - 16); ctx.lineTo(10, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a6a5a'; ctx.beginPath(); ctx.ellipse(0, 0, 9, 14, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4ecdc'; ctx.beginPath(); ctx.ellipse(0, 4, 5, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a3a2a'; ctx.beginPath(); ctx.arc(0, -14, 7, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(-3, -10); ctx.lineTo(0, -3); ctx.lineTo(3, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(-3, -15, 1.8, 0, TAU); ctx.arc(3, -15, 1.8, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-5, 12); ctx.lineTo(-7, 20); ctx.moveTo(5, 12); ctx.lineTo(7, 20); ctx.stroke();
    ctx.restore();
  }
}

/* ---------------- a little sign card in the land's voice (a painted board on a post; no person) ---------------- */

/* ---------------- pieces (strip areas: st.x is the cursor, st.gy the ground row) ---------------- */
const herdOf = B => (B.keHerd = B.keHerd || { on: null, leaps: [], swims: [], zones: [] });
const pieces = {
  // a level's opening sign (the land's voice: a painted board)
  tip(st, o) { const x = st.x; st.floor(x, x + 3); st.sign(x + 1, o.text); return x + 4; },
  // an item block over flat ground
  box(st, o) { const x = st.x; st.floor(x, x + 4); st.block(x + 2, st.gy - (o.y || 4), o.item || 'power', o.hidden ? T.HIDDEN : T.QBLOCK); if (o.coins !== false) st.coins(x + 1, x + 3, st.gy - 2); return x + 5; },
  // decor on flat ground: { kind, n }
  plain(st, o) { const x = st.x, n = o.n || 8; st.floor(x, x + n - 1); if (o.coins) st.coins(x + 2, x + n - 3, st.gy - 2); st.dress(x, x + n - 1, o.dense || 0.2); if (o.decor) st.decor(o.decor, x + Math.floor(n / 2), st.gy, o.seed || 0); return x + n; },
  // THE HERD: from here to herdOff, wildebeest run through
  herdOn(st, o) { const H = herdOf(st.B); H.on = { x0: st.x, every: o.every || 1.25 }; st.floor(st.x, st.x + (o.n || 6) - 1); st.dress(st.x, st.x + (o.n || 6) - 1, 0.15); return st.x + (o.n || 6); },
  herdOff(st, o) {
    const B = st.B, H = herdOf(B), x1 = st.x + (o.n || 6);
    st.floor(st.x, x1 - 1);
    const x0 = H.on.x0, prof = [], modes = [];
    // the floor top under each column: the top of the solid run from the bottom up
    const floorTop = x => { let y = B.H - 1; if (!SOLID[B.get(x, y)]) return null; while (y > 0 && SOLID[B.get(x, y - 1)]) y--; return y; };
    let last = st.gy;
    for (let x = x0; x < x1; x++) {
      const sw = H.swims.find(s => x >= s[0] && x <= s[1]), lp = H.leaps.find(s => x >= s[0] && x <= s[1]);
      let back, mode = 'run';
      if (lp) { mode = 'leap'; back = lp[3][x - lp[0]]; }
      else if (sw) { mode = 'swim'; back = sw[2] * TS - 6; }
      else { const ft = floorTop(x); if (ft != null) last = ft; back = last * TS - GNU.H; }
      prof.push(back); modes.push(mode);
    }
    // never drop faster than one row per column (a rider stays on)
    for (let i = 1; i < prof.length; i++) if (prof[i] > prof[i - 1] + TS) prof[i] = prof[i - 1] + TS;
    // the validator's view: the backs as one-way ghosts along the way
    for (let i = 0; i < prof.length; i++) { const r = Math.round(prof[i] / TS); B.ghosts.push([x0 + i, r]); if (modes[i] === 'leap') B.ghosts.push([x0 + i, r + 1]); }
    B.spawn('keHerd', x0, st.gy - 1, { x0, x1, prof, modes, every: H.on.every });
    H.zones.push([x0, x1]); H.on = null; H.leaps.length = 0; H.swims.length = 0;
    st.dress(st.x, x1 - 1, 0.15);
    return x1;
  },
  // a river: a pit with brown water and n crocodiles (they lurk in the herd's path); { w, crocs }
  river(st, o) {
    const B = st.B, w = o.w || 10, x = st.x;
    st.floor(x, x + 1); st.decor('keCrocSign', x, st.gy, 1);
    const a = x + 2, b = a + w - 1;
    st.pit(a, b); herdOf(B).swims.push([a, b, st.gy]);
    B.spawn('keRiver', a, st.gy, { w });
    const n = o.crocs || 0; for (let k = 0; k < n; k++) B.spawn('keCroc', a + Math.round((k + 1) * w / (n + 1)), st.gy, { span: Math.min(3, w / (n + 1) / 2) });
    if (o.coins !== false) st.coins(a + 1, b - 1, st.gy - 3);
    if (o.gold) st.gold(a + Math.floor(w / 2), st.gy - (o.goldDy || 5), o.gold);
    if (o.fly) B.spawn(o.fly, a + Math.floor(w / 2), st.gy - (o.flyDy || 6), { range: 3 });
    st.floor(b + 1, b + 3);
    return b + 4;
  },
  // a thorn thicket too tall to jump: { h (rows), w } — the herd leaps it (a high arc, gentle on the way down)
  thicket(st, o) {
    const B = st.B, h = o.h || 6, w = o.w || 2, x = st.x;
    st.floor(x, x + w + 13);
    const a = x + 6, b = a + w - 1, top = st.gy - h;
    B.fill(a, top, b, st.gy - 1, T.HARD);
    B.spawn('keThicket', a, st.gy - 1, { w, h });
    // the leap: up over 5 columns, over the top 2 rows clear, down at one row per column
    const peak = (top - 2) * TS - 2, base = st.gy * TS - GNU.H, up = 5, L0 = a - up, prof = [];
    const down = Math.ceil((base - peak) / TS);
    for (let c = L0; c <= b + down; c++) {
      let v;
      if (c < a) { const k = (c - L0 + 1) / (up + 1); v = base + (peak - base) * Math.sin(k * Math.PI / 2); }
      else if (c <= b) v = peak;
      else v = Math.min(base, peak + (c - b) * TS * 0.98);
      prof.push(v);
    }
    herdOf(B).leaps.push([L0, b + down, 0, prof]);
    if (o.gold) st.gold(a + Math.floor(w / 2), top - 4, o.gold);
    else st.coins(a - 1, b + 1, top - 3);
    return x + w + 14;
  },
  // a gorge the herd jumps: a pit w wide (no water) with a leap arc over it
  gorge(st, o) {
    const B = st.B, w = o.w || 9, x = st.x;
    st.floor(x, x + 5); const a = x + 6, b = a + w - 1; st.pit(a, b); B.spawn('keGap', a, st.gy, { w }); st.floor(b + 1, b + 8);
    const base = st.gy * TS - GNU.H, peak = base - (o.h || 3) * TS, L0 = a - 3, R1 = b + 4, prof = [];
    for (let c = L0; c <= R1; c++) { const k = (c - L0 + 0.5) / (R1 - L0 + 1); prof.push(base + (peak - base) * Math.sin(k * Math.PI)); }
    herdOf(B).leaps.push([L0, R1, 0, prof]);
    st.coins(a + 1, b - 1, st.gy - (o.h || 3) - 3);
    if (o.gold) st.gold(a + Math.floor(w / 2), st.gy - (o.h || 3) - 5, o.gold);
    return b + 9;
  },
  // a termite mound with a crack (dust puffs out): it is a fake wall into a secret room: { to, back }
  moundDoor(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 7);
    B.spawn('portal', x + 4, st.gy - 1, { kind: 'door', look: 'keMoundDoor', targetRef: o.to });
    if (o.back) B.anchor(o.back, x + 6, st.gy - 1);
    return x + 8;
  },
  // a burrow down to a secret room: a sand mound and a hole you press DOWN at: { to, back }
  burrowDoor(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 6);
    B.spawn('portal', x + 3, st.gy - 1, { kind: 'door', look: 'keBurrow', targetRef: o.to });
    if (o.sign) st.decor('keArrowRock', x + 1, st.gy, 0);
    if (o.back) B.anchor(o.back, x + 5, st.gy - 1);
    return x + 7;
  },

  /* ---- 15-2 the giraffes ---- */
  // an acacia sapling with leaves to take
  leaves(st, o) { const x = st.x; st.floor(x, x + 4); st.B.spawn('keLeafBush', x + 2, st.gy - 1, {}); return x + 5; },
  // a big acacia: a trunk from the ground and a flat crown of one-way leaves at h rows up, w wide
  acacia(st, o) {
    const B = st.B, x = st.x, h = o.h || 6, w = o.w || 7; st.floor(x, x + w + 1);
    const y = st.gy - h; for (let q = 0; q < w; q++) B.set(x + 1 + q, y, T.SEMI);
    st.decor('keAcacia', x + 1 + Math.floor(w / 2), st.gy, h);
    if (o.coins !== false) st.coins(x + 2, x + w - 1, y - 2);
    if (o.gold) st.gold(x + 1 + Math.floor(w / 2), y - 3, o.gold);
    if (o.item) st.block(x + 1 + Math.floor(w / 2), y - 4, o.item, o.hidden ? T.HIDDEN : T.QBLOCK);
    return x + w + 2;
  },
  /* a giraffe: { path: [[dx,dy], ...] the head's way in tiles from the giraffe's feet (the first point is the end
     Brady meets first), dir, k0 (0..1 start), pit: [a, b] columns relative to x to clear for a gap, ground: [dx, gyDelta]
     to raise the far ground } — returns past the giraffe + o.after */
  giraffe(st, o) {
    const B = st.B, x = st.x, n = o.n || 8; st.floor(x, x + n - 1);
    if (o.pit) { st.pit(x + o.pit[0], x + o.pit[1]); B.spawn('keGap', x + o.pit[0], st.gy, { w: o.pit[1] - o.pit[0] + 1 }); }
    const gx = x + (o.at || 3);
    const path = o.path;
    B.spawn('keGiraffe', gx, st.gy - 1, { path, dir: o.dir || 1, k0: o.k0 || 0 });
    // the ghosts along the head's path (2-3 tiles wide), sampled every half tile
    const P = path.map(([a, b]) => [gx * TS + TS / 2 + a * TS, st.gy * TS + b * TS]);
    for (let i = 1; i < P.length; i++) {
      const L = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]), n2 = Math.max(1, Math.ceil(L / (TS / 2)));
      for (let k = 0; k <= n2; k++) { const px = P[i - 1][0] + (P[i][0] - P[i - 1][0]) * k / n2, py = P[i - 1][1] + (P[i][1] - P[i - 1][1]) * k / n2; const r = Math.round((py - TS + 2) / TS); for (const ox of [-1, 0, 1]) B.ghosts.push([Math.floor(px / TS) + ox, r]); }
    }
    if (o.fly) B.spawn(o.fly, gx + (o.flyDx || 6), st.gy - (o.flyDy || 9), { range: 2 });
    if (o.gold) st.gold(gx + o.gold[0], st.gy + o.gold[1], o.gold[2]);
    if (o.coins) for (const [a2, b2, y2] of o.coins) st.coins(gx + a2, gx + b2, st.gy + y2);
    // the ground after the giraffe rises by o.rise rows (a cliff only the giraffe reaches) or drops by o.drop
    if (o.rise) st.gy -= o.rise;
    if (o.drop) st.gy += o.drop;
    return x + n;
  },

  // a kopje ledge floating h rows up over the plain (a giraffe or the herd reaches it): { h, w, at (dx), burrow: {to, back} }
  ledge(st, o) {
    const B = st.B, x = st.x, n = o.n || (o.at || 0) + (o.w || 6) + 1; st.floor(x, x + n - 1);
    const lx = x + (o.at || 0), w = o.w || 6, y = st.gy - (o.h || 5);
    B.fill(lx, y, lx + w - 1, y + 1, T.HARD);
    if (o.burrow) { B.spawn('portal', lx + Math.floor(w / 2), y - 1, { kind: 'door', look: 'keBurrow', targetRef: o.burrow.to }); if (o.burrow.back) B.anchor(o.burrow.back, lx + 1, y - 1); B.decorAt('keArrowRock', lx + w - 1, y, 0); }
    if (o.gold) st.gold(lx + Math.floor(w / 2), y - 3, o.gold);
    if (o.coins !== false && !o.burrow) st.coins(lx + 1, lx + w - 2, y - 2);
    return x + n;
  },

  /* ---- 15-3 the lake ---- */
  // the lake: a pit w wide with soda water; posts: [[dx, {alt, chain, calm}], ...] flamingos standing in it
  lake(st, o) {
    const B = st.B, w = o.w || 12, x = st.x;
    st.floor(x, x + 1); const a = x + 2, b = a + w - 1; st.pit(a, b);
    B.spawn('keLake', a, st.gy, { w });
    for (const [dx, po] of o.posts || []) {
      B.spawn('keFlamingo', a + dx, st.gy, Object.assign({}, po || {}));
      const r = st.gy - 2; for (const ox of [-1, 0]) B.ghosts.push([a + dx + ox, r]);
      if (po && po.alt) for (const ox of [-1, 0]) B.ghosts.push([a + dx + po.alt + ox, r]);
    }
    if (o.coins) st.coins(a + 1, b - 1, st.gy - 6);
    if (o.gold) st.gold(a + o.gold[0], st.gy - o.gold[1], o.gold[2]);
    if (o.island) for (const [dx, wd] of o.island) st.floor(a + dx, a + dx + wd - 1);
    if (o.fly) B.spawn(o.fly, a + Math.floor(w / 2), st.gy - (o.flyDy || 8), { range: 3 });
    st.floor(b + 1, b + 3);
    return b + 4;
  },
  // a skein of flamingos flying a route over the lake: { ax, ay (tiles), speed, w (pit width), y (rows above ground) }
  flock(st, o) {
    const B = st.B, x = st.x, w = o.w || 14; st.floor(x, x + 1);
    const a = x + 2, b = a + w - 1; st.pit(a, b); B.spawn('keLake', a, st.gy, { w });
    const y0 = st.gy - (o.y || 1), ax = o.ax != null ? o.ax : w - 5, ay = o.ay || 0;
    B.spawn('mplat', a + 1, y0 - 1, { pw: 4, ax: ax * TS, ay: ay * TS, speed: o.speed || 1.6, skin: 'keFlock', phase: o.phase || 0 });
    const n = Math.max(Math.abs(ax), Math.abs(ay));
    for (let q = 0; q <= n; q++) { const gx = a + 1 + Math.round(ax * q / (n || 1)), gy = y0 + Math.round(ay * q / (n || 1)); for (let k = 0; k < 4; k++) B.ghosts.push([gx + k, gy]); }
    if (o.coins !== false) st.coins(a + 3, b - 3, y0 - 3 + Math.min(0, ay));
    if (o.gold) st.gold(a + Math.floor(w / 2), y0 + Math.min(0, ay) - 4, o.gold);
    st.floor(b + 1, b + 3);
    return b + 4;
  },

  /* ---- 15-4 noon ---- */
  // a gully in the plain: a pit drawn as a red ravine: { n }
  gully(st, o) { const x = st.x, n = o.n || 3; st.floor(x, x + 1); st.pit(x + 2, x + n + 1); st.B.spawn('keGap', x + 2, st.gy, { w: n }); if (o.coins !== false) st.arc(x + 1, x + n + 2, st.gy - 2, 2); st.floor(x + n + 2, x + n + 4); return x + n + 5; },
  sun(st, o) { st.B.spawn('keSun', st.x, st.gy - 1, {}); return st.x; },
  // an open sunny stretch: n columns of flat plain, decor
  open(st, o) { const x = st.x, n = o.n || 12; st.floor(x, x + n - 1); st.dress(x, x + n - 1, 0.1); if (o.coins !== false) st.coins(x + 2, x + n - 3, st.gy - 2); return x + n; },
  // a shade tree: an acacia whose crown is high enough to walk under (shade) and to stand on (sun)
  shadeTree(st, o) { return pieces.acacia(st, Object.assign({ h: 4, w: o.w || 6 }, o)); },
  // a rock overhang (kopje) to shelter under: { w, h }
  overhang(st, o) {
    const B = st.B, x = st.x, w = o.w || 6, h = o.h || 3; st.floor(x, x + w + 1);
    B.fill(x, st.gy - h - 1, x + w, st.gy - h, T.HARD); B.fill(x, st.gy - h, x, st.gy - 1, T.HARD);
    if (o.coins !== false) st.coins(x + 1, x + w - 1, st.gy - h - 3);
    return x + w + 2;
  },
  cloud(st, o) { st.B.spawn('keCloud', st.x + (o.dx || 0), st.gy, { w: o.w || 6, ax: o.ax || 14, speed: o.speed || 0.06, sky: o.sky || 3, phase: o.phase || 0 }); return st.x; },
  elephant(st, o) { st.B.spawn('keElephant', st.x + (o.dx || 0), st.gy, { ax: o.ax || 30, speed: o.speed || 2.6 }); return st.x; },
  puddle(st, o) { const x = st.x, w = o.w || 3; st.floor(x, x + w + 1); st.B.spawn('kePuddle', x + 1, st.gy, { w }); return x + w + 2; },

  /* ---- 15-5 the lead-in: hippos' backs across the waterhole's channel ---- */
  hippos(st, o) {
    const B = st.B, w = o.w || 14, x = st.x; st.floor(x, x + 1);
    const a = x + 2, b = a + w - 1; st.pit(a, b); B.spawn('keRiver', a, st.gy, { w });
    const n = o.n || 1, span = Math.floor(w / n);
    for (let k = 0; k < n; k++) {
      const hx = a + k * span, ax = Math.max(2, span - 4);
      B.spawn('mplat', hx + 1, st.gy - 1, { pw: 3, ax: ax * TS, ay: 0, speed: o.speed || 1.2, skin: 'keHippoBack', phase: k * 1.7 });
      for (let q = 0; q <= ax + 2; q++) B.ghosts.push([hx + 1 + q, st.gy]);
    }
    if (o.crocs) B.spawn('keCroc', a + Math.floor(w / 2), st.gy, { span: 2 });
    if (o.gold) st.gold(a + Math.floor(w / 2), st.gy - (o.goldDy || 5), o.gold);
    else st.coins(a + 2, b - 2, st.gy - 3);
    st.floor(b + 1, b + 3);
    return b + 4;
  },

  /* ---- 15-6 the warren ---- */
  /* the warren: n columns of plain over a tunnel. The crust is 3 rows; the tunnel 4 rows tall under it.
     { n, mouths: [dx] (a burrow mouth: a hole in the crust, a root ledge just under it and another to the side: drop
       in and step off; climb out the same way),
       rocks: [[dx, w]] (rock plugs that close the tunnel), thorns: [[dx, w, h]] (thickets that close the surface),
       enemies: [[kind, dx]] (in the tunnel), sentries: [dx], gold: [[dx, 'top' | 'tunnel', kind]], coins: true } */
  warren(st, o) {
    const B = st.B, x = st.x, n = o.n || 20, gy = st.gy, t0 = gy + 4, t1 = gy + 7;
    st.floor(x, x + n - 1);
    B.keWarren = gy;
    for (let c = x; c < x + n; c++) for (let y = t0; y <= t1; y++) B.set(c, y, T.EMPTY);
    for (const dx of o.mouths || []) {
      const c = x + dx;
      for (let cc = c; cc <= c + 3; cc++) for (let y = gy + 1; y < t0; y++) B.set(cc, y, T.EMPTY);
      B.set(c, gy, T.EMPTY); B.set(c + 1, gy, T.EMPTY);
      B.set(c, gy + 3, T.SEMI); B.set(c + 1, gy + 3, T.SEMI);
      B.set(c + 2, gy + 5, T.SEMI); B.set(c + 3, gy + 5, T.SEMI);
      B.decorAt('keBurrowMound', c + 0.5, gy, 0);
      B.spawn('keShaft', c, gy + 5, { w: 4, h: 6 });
    }
    for (const [dx, w] of o.rocks || []) B.fill(x + dx, t0, x + dx + w - 1, t1, T.HARD);
    for (const [dx, w, h] of o.thorns || []) { B.fill(x + dx, gy - h, x + dx + w - 1, gy - 1, T.HARD); B.spawn('keThicket', x + dx, gy - 1, { w, h }); }
    for (const [kind, dx] of o.enemies || []) st.enemy(kind, x + dx, t1 + 1);
    for (const dx of o.sentries || []) { B.decorAt('keBurrowMound', x + dx, gy, 0); B.spawn('keSentry', x + dx, gy - 1, { surf: gy }); }
    for (const [dx, where, kind] of o.gold || []) st.gold(x + dx, where === 'tunnel' ? t1 - 1 : gy - 4, kind);
    if (o.coins !== false) { st.coins(x + 2, x + n - 3, t1 - 1); }
    if (o.box) st.block(x + o.box[0], o.box[1] === 'tunnel' ? t0 : gy - 4, o.box[2] || 'power');
    st.dress(x, x + n - 1, 0.08);
    return x + n;
  },
  sentry(st, o) { const x = st.x; st.floor(x, x + 3); st.decor('keBurrowMound', x + 1, st.gy, 0); st.B.spawn('keSentry', x + 1, st.gy - 1, { surf: st.gy }); return x + 4; }
};

/* ---------------- music: a bright savannah groove, a lilting grove waltz, a shimmering lake, a slow hot noon, a
   bouncy warren, and the hippo's ballet ---------------- */
const tracks = {
  tour_ke: {
    bpm: 118, bars: 8, rv: 0.3, hx: 0.05, sw: 0.08,
    ch: 'C F G C Am F G C',
    ld: 'E5:2 G5:2 C6:4 B5:2 A5:2 | G5:4 E5:4 F5:4 A5:4 | G5:2 B5:2 D6:4 C6:2 B5:2 | C6:8 G5:8 |' +
        'A5:2 C6:2 E6:4 D6:2 C6:2 | A5:4 F5:4 A5:4 C6:4 | B5:2 D6:2 G6:4 F6:2 D6:2 | C6:12 .:4',
    li: 'mbox', lv: 0.14,
    bp: 'r..r..r.r..r..r.', bi: 'pluckb', bv: 0.3,
    ap: 'c.c.c.c.c.c.c.c.', ai: 'pluck', av: 0.05, ao: 60,
    dr: ['k..k..k.k..k....', '....s.......s...', 'h.hhh.hhh.hhh.hh'], dv: 0.34
  },
  tour_ke_grove: {
    bpm: 132, bpb: 3, bars: 8, rv: 0.35, hx: 0.04,
    ch: 'G G C D G Em C D',
    ld: 'D5:4 G5:4 B5:4 | A5:8 G5:4 | E5:4 G5:4 C6:4 | B5:8 A5:4 | B5:4 D6:4 G6:4 | E6:8 D6:4 | C6:4 B5:4 A5:4 | G5:12',
    li: 'whistle', lv: 0.13,
    bp: 'r...f...f...', bi: 'pluckb', bv: 0.28,
    ap: '....c...c...', ai: 'vibes', av: 0.06, ao: 60,
    dr: ['k...........', '....s...s...', 'h.h.h.h.h.h.'], dv: 0.3
  },
  tour_ke_lake: {
    bpm: 96, bars: 8, rv: 0.5, dl: 0.2, hx: 0.04,
    ch: 'Dmaj7 Gmaj7 Dmaj7 A Bm7 Gmaj7 Em7 A',
    ld: 'F#5:4 A5:4 C#6:8 | B5:4 G5:4 D5:8 | F#5:4 A5:4 E6:8 | C#6:8 A5:8 |' +
        'D6:4 B5:4 F#5:8 | G5:4 B5:4 D6:8 | E6:4 D6:4 B5:4 G5:4 | A5:12 .:4',
    li: 'vibes', lv: 0.13,
    bp: 'r.......r...f...', bi: 'sub', bv: 0.26,
    ap: 'c.c.c.c.c.c.c.c.', ai: 'harp', av: 0.05, ao: 64,
    dr: ['k.......k.......', '........s.......', 'h...h...h...h...'], dv: 0.22
  },
  tour_ke_noon: {
    bpm: 88, bars: 8, rv: 0.45, dl: 0.25, hx: 0.06, sw: 0.1,
    ch: 'Em Em Am Am Em Em B7 B7',
    ld: 'B5:6 G5:2 E5:8 | B5:4 C6:4 B5:8 | A5:6 C6:2 E6:8 | D6:4 C6:4 A5:8 | G5:6 B5:2 E6:8 | D6:4 B5:4 G5:8 | F#5:4 A5:4 D#6:4 F#6:4 | E6:12 .:4',
    li: 'whistle', lv: 0.12,
    bp: 'r.......r.......', bi: 'pluckb', bv: 0.28,
    ap: '..c...c...c...c.', ai: 'pluck', av: 0.05, ao: 55,
    dr: ['k.......k...k...', '....s.......s...', 'h...h...h...h.h.'], dv: 0.26
  },
  tour_ke_burrow: {
    bpm: 150, bars: 8, rv: 0.2, hx: 0.06,
    ch: 'F C Dm C Bb F C F',
    ld: 'A5:2 C6:2 A5:2 F5:2 C6:4 A5:4 | G5:2 E5:2 C5:4 G5:8 | F5:2 A5:2 D6:2 A5:2 F5:8 | E5:2 G5:2 C6:4 .:8 |' +
        'D6:2 F6:2 D6:2 Bb5:2 F5:8 | C6:2 A5:2 F5:4 C6:8 | E6:2 C6:2 G5:2 E5:2 C6:8 | F6:8 .:8',
    li: 'pluck', lv: 0.15,
    bp: 'r.r.r.r.r.r.r.r.', bi: 'pluckb', bv: 0.3,
    ap: 'c...c...c...c...', ai: 'vibes', av: 0.06, ao: 60,
    dr: ['k...k...k...k...', '....s.......s..s', 'h.h.h.h.h.h.h.h.'], dv: 0.38
  },
  tour_ke_boss: {
    bpm: 108, bpb: 3, bars: 8, rv: 0.4, hx: 0.05,
    ch: 'C G7 G7 C C F G7 C',
    ld: 'E5:4 G5:4 C6:4 | B5:8 G5:4 | F5:4 D5:4 B5:4 | G5:12 | E6:4 D6:4 C6:4 | A5:8 F5:4 | D6:4 B5:4 G5:4 | C6:12',
    li: 'brass', lv: 0.15,
    bp: 'r...f...f...', bi: 'pluckb', bv: 0.34,
    ap: '....c...c...', ai: 'vibes', av: 0.06, ao: 60,
    dr: ['k...........', '....s...s...', 'h.h.h.h.h.h.'], dv: 0.36
  }
};

/* ---------------- the route-map pin: an acacia against a big sun ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(r * 0.3, -r * 0.15, r * 0.55, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = r * 0.12;
  ctx.beginPath(); ctx.moveTo(0, r * 0.75); ctx.lineTo(0, -r * 0.05); ctx.lineTo(-r * 0.45, -r * 0.35); ctx.moveTo(0, -r * 0.05); ctx.lineTo(r * 0.4, -r * 0.35); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -r * 0.42, r * 0.85, r * 0.2, 0, 0, TAU); ctx.fill();
  ctx.restore();
};

const entities = { keShaft: KeShaft, keGap: KeGap, keThicket: KeThicket, keHerd: KeHerd, keGnu: KeGnu, keRiver: KeRiver, keCroc: KeCroc, keGiraffe: KeGiraffe, keLeafBush: KeLeafBush, keFlamingo: KeFlamingo, keLake: KeLake, keSun: KeSun, keCloud: KeCloud, keElephant: KeElephant, kePuddle: KePuddle, keSentry: KeSentry, keEagle: KeEagle };

Tour.country({
  id: 'ke', colors: COL, tagline: 'The savannah: wildebeest, giraffes, flamingos and one very theatrical hippo',
  themes, painters, decor, platforms, enemies, entities, pieces, tracks,
  music: { level: 'tour_ke', boss: 'tour_ke_boss' },
  landmark: 'the snow cap of the great mountain', emblem,
  arrival: 'Jambo, Brady! Piwi took the mountain\'s SNOW CAP for his scenery. It\'s bare up there! The wildebeest say the hippo\'s show is still on at the waterhole. ♥ C',
  star: { name: 'GOLDEN ACACIA', draw(ctx, x, y, t) { ctx.save(); ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, y - 3, 9, 3.5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillRect(x - 1, y - 1, 2, 8); ctx.restore(); } },
  levels: []
});
// the land's map: the flamingo lake (the stop 15-3's lake, east of the grove) is pink, with a flamingo haze on it
if (typeof TourOWPaint !== 'undefined' && TourOWPaint.lake) {
  const l0 = TourOWPaint.lake;
  TourOWPaint.lake = function (c, ow, pts) {
    const cx = pts.reduce((s2, q) => s2 + q[0], 0) / pts.length, cy = pts.reduce((s2, q) => s2 + q[1], 0) / pts.length;
    if (!(ow && ow.G && ow.G.cc === 'ke' && cx > 800)) return l0.call(this, c, ow, pts);
    const ow2 = Object.create(ow); ow2.look = Object.assign({}, ow.look, { sea: '#ec86a8', deep: '#b84a78', beach: '#f6efe4' });
    l0.call(this, c, ow2, pts);
    const R = mulberry32(1503); c.save(); c.fillStyle = '#ff6a9a'; for (let k = 0; k < 40; k++) { const a = R() * TAU, r = R(); const x = cx + Math.cos(a) * r * 70, y = cy + Math.sin(a) * r * 34; c.fillRect(x, y, 2.4, 2.4); } c.restore();
  };
}
Object.assign(TourLandscape.ARCH_LABEL, { stampede: 'HERD', necks: 'NECKS', flock: 'FLOCK', shade: 'SHADE', burrow: 'BURROW' });
TourLandscape.looks.ke = ['#f2dcae', '#4a9ad0', '#9a8ab8', '#d8a850', '#ecd08a', '#fff0c8', 'peaks'];
Tour.keKit = { GNU, GIR, HEAT, KeHerd, KeGnu, KeCroc, KeGiraffe, KeFlamingo, KeSun, KeElephant, KeCloud, KeSentry, KeEagle, INK, COL, CLAY, RED, GOLD };
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.keKit = Tour.keKit; } } catch (e) { /* not in a browser */ }
})();
