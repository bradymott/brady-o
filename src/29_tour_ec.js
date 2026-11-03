/* ============================================================
   ECUADOR & THE GALÁPAGOS (world 2)
   2-1 Middle of the World   run     the equator line: low-gravity bubbles, banana-leaf platforms, rolling cacao pods
   2-2 Cable Car Climb       ride    a gondola up the Andes: duck the tower arms, hop the ridges, dodge condors
   2-3 Amazon Canopy         night   swing on vines across the dark canopy, sinking giant lily pads, glowing frogs
   2-4 Galápagos Snorkel     swim    a sunlit sea: rock arches, puffers that puff up, penguin currents, tidal surge
   2-5 Ice Fort of Cotopaxi  castle  slippery ice, dropping icicles, sinking ice floes; boss El Tortugón
   ============================================================ */
(() => {
const COL = { a: '#ffd23a', b: '#2a6ad8', c: '#e8323a' };
const K = TourKit;
const WOVEN = ['#e8323a', '#ffd23a', '#2a6ad8', '#2aa85a', '#ff7a2a', '#8a3ab8'];
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };
// glacier meltwater under the ice fort
if (typeof LIQUIDS !== 'undefined') LIQUIDS.icewater = ['#dff8ff', '#7ac8f0', '#2a6aa8', 'rgba(240,255,255,0.3)', null, 'rgba(255,255,255,0.75)'];

/* ---------------- background painters ---------------- */
const painters = {
  // green Andean ridges with patchwork fields
  ecAndes(ctx, L, rng, H) {
    for (let r = 0; r < 2; r++) {
      const base = L.base + r * 40, col = shade(L.color, -r * 0.15);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= BG_W; x += 16) ctx.lineTo(x, base - 50 * (0.5 + 0.5 * Math.sin(x * 0.006 * (r + 1) + r * 2)) - 20 * Math.sin(x * 0.02 + r));
      ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 40; i++) { const x = rng() * BG_W, y = base - 10 + rng() * 60; ctx.fillStyle = rgba(['#c8d870', '#8ac85a', '#e8c870', '#6aa84a'][i % 4], 0.5); ctx.save(); ctx.translate(x, y); ctx.rotate(-0.3 + rng() * 0.6); ctx.fillRect(-14, -5, 28, 10); ctx.restore(); }
    }
  },
  // the equator monument: a stone tower with a globe on top, the line painted toward it
  ecMonument(ctx, L, rng, H) {
    const x = 640, b = L.base;
    ctx.fillStyle = shade(L.color, -0.2); ctx.fillRect(x - 60, b - 12, 120, 12);
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(x - 34, b - 12); ctx.lineTo(x - 20, b - 132); ctx.lineTo(x + 20, b - 132); ctx.lineTo(x + 34, b - 12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(L.color, -0.18); ctx.lineWidth = 1.2;
    for (let k = 1; k < 7; k++) { const y = b - 12 - k * 17, hw = 34 - (k * 17) / 120 * 14; ctx.beginPath(); ctx.moveTo(x - hw, y); ctx.lineTo(x + hw, y); ctx.stroke(); }
    ctx.fillStyle = shade(L.color, 0.15); ctx.fillRect(x - 20, b - 138, 40, 6);
    ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(x, b - 156, 18, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8a6a30'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, b - 156, 18, 6, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, b - 156, 6, 18, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#e8323a'; ctx.fillRect(x - 2, b, 4, H - b);
  },
  // banana plants along the plantation
  ecBananas(ctx, L, rng, H) {
    for (let x = 10; x < BG_W; x += 44 + rng() * 30) wrapDraw(x, 60, xx => {
      const h = 70 + rng() * 40;
      ctx.fillStyle = shade(L.color, -0.35); ctx.fillRect(xx - 3, L.base - h, 6, h);
      for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.5; ctx.fillStyle = shade(L.color, (k % 2) * 0.12); ctx.save(); ctx.translate(xx, L.base - h); ctx.rotate(a + Math.PI / 2); ctx.beginPath(); ctx.ellipse(0, -28, 9, 30, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = '#e8d84a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(xx + 6 + k * 2, L.base - h + 18 + k * 5, 2.5, 6, 0.4, 0, TAU); ctx.fill(); }
    });
    ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(0, L.base, BG_W, H - L.base);
  },
  // a perfect snow-capped volcano cone with a wisp of steam
  ecCotopaxi(ctx, L, rng, H) {
    const x = 560, b = L.base, h = 250, w = 330;
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(x - w, b); ctx.lineTo(x - 28, b - h); ctx.lineTo(x + 28, b - h); ctx.lineTo(x + w, b); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 28, b - h); ctx.lineTo(x + 28, b - h);
    for (let k = 0; k <= 8; k++) { const t = k / 8, sx = x + 28 + 70 * (1 - t) - (56 + 140) * t; ctx.lineTo(sx + (k % 2 ? 6 : -6), b - h + 80 + (k % 2 ? 18 : 0) - Math.abs(t - 0.5) * 20); }
    ctx.lineTo(x - 98, b - h + 80); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + 10 + k * 16, b - h - 14 - k * 14, 12 + k * 4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = shade(L.color, -0.15); ctx.fillRect(0, b, BG_W, H - b);
  },
  // the dark rainforest canopy with hanging vines
  ecCanopy(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let x = 0; x < BG_W; x += 30 + rng() * 30) wrapDraw(x, 80, xx => { ctx.fillStyle = shade(L.color, rng() * 0.15); ctx.beginPath(); ctx.arc(xx, L.base, 30 + rng() * 40, Math.PI, TAU); ctx.fill(); });
    for (let x = 0; x < BG_W; x += 18 + rng() * 26) { ctx.strokeStyle = shade(L.color, 0.2); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 10, (L.base - 40) / 2, x + Math.sin(x) * 8, L.base - 20 - rng() * 120); ctx.stroke(); }
  }
};
const dyn = {
  // cable-car lines strung across the sky, little cabins gliding along them
  ecCables(ctx, L, camX, oy, S, W, t) {
    ctx.strokeStyle = 'rgba(40,40,50,0.55)'; ctx.lineWidth = 1.4 * S;
    for (let k = 0; k < 2; k++) { const y0 = oy + (90 + k * 26) * S; ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0 - 60 * S); ctx.stroke(); }
    for (let i = 0; i < 3; i++) {
      const x = ((i * 380 + t * 20 - camX * L.f) % BG_W + BG_W) % BG_W * S, y = oy + 90 * S - x / W * 60 * S;
      ctx.fillStyle = ['#e8323a', '#ffd23a', '#2a6ad8'][i]; ctx.fillRect(x - 10 * S, y + 4 * S, 20 * S, 14 * S);
      ctx.fillStyle = 'rgba(200,230,255,0.8)'; ctx.fillRect(x - 7 * S, y + 7 * S, 14 * S, 6 * S);
    }
  }
};

/* ---------------- tiles: Andean stone, woven-textile item blocks ---------------- */
function wovenBlock(ctx, th, f) {
  ctx.save(); ctx.shadowColor = 'rgba(255,220,120,0.8)'; ctx.shadowBlur = 4 + f * 1.5;
  ctx.fillStyle = WOVEN[0]; rr(ctx, 1, 2, TS - 2, TS - 3, 3); ctx.fill(); ctx.restore();
  ctx.save(); rr(ctx, 1, 2, TS - 2, TS - 3, 3); ctx.clip();
  for (let r = 0; r < 7; r++) { ctx.fillStyle = WOVEN[r % 6]; ctx.fillRect(1, 2 + r * 4.4, TS - 2, 4.4); }
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let r = 1; r < 7; r += 2) for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(4 + k * 7, 4 + r * 4.4); ctx.lineTo(7.5 + k * 7, 2 + r * 4.4); ctx.lineTo(11 + k * 7, 4 + r * 4.4); ctx.lineTo(7.5 + k * 7, 6 + r * 4.4); ctx.fill(); }
  const sx = -8 + f * 12; ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + 5, 0); ctx.lineTo(sx - 5, TS); ctx.lineTo(sx - 10, TS); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#5a1a1a'; ctx.lineWidth = 1.2; rr(ctx, 1, 2, TS - 2, TS - 3, 3); ctx.stroke();
}
function wovenUsed(ctx) { ctx.fillStyle = '#a89078'; rr(ctx, 1, 3, TS - 2, TS - 4, 3); ctx.fill(); ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let r = 0; r < 6; r++) ctx.fillRect(2, 5 + r * 4.4, TS - 4, 1.4); }
const base = {
  ground: { style: 'grass', cap: '#5ab84a', capHi: '#a8e86a', dirt: '#8a5a3a', dirt2: '#5a3a24', rock: '#a87a5a' },
  brick: { style: 'stone', c1: '#b8a890', c2: '#8a7a64', mortar: '#5a4a3a' }, hard: { c1: '#a8987e', c2: '#6a5a48' },
  semi: { style: 'log', c1: '#7a5230', c2: '#4a301a' }, pillar: { c1: '#8a7a64', c2: '#5a4a3a', cap: '#c8b898', style: 'column' },
  accent: COL.a, qblockArt: wovenBlock, usedArt: wovenUsed, tint: {}, bloom: 0.15
};
const themes = {
  ec_equator: Object.assign({}, base, {
    rays: '#fff4c8',
    name: 'Middle of the World', music: 'tour_ec', particles: 'leaves',
    sky: ['#2a8ae8', '#8ad0ff', '#f0fff0'], horizonGlow: '#e8ffd8',
    celestial: { type: 'sun', x: 0.5, y: 0.1, r: 40, color: '#fffbe0', glow: '#ffe8a0' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'mountains', color: '#8aa0c8', base: 280, amp: 150, f: 0.03, blur: true, snow: true }, { kind: 'ecMonument', color: '#c8b898', base: 360, f: 0.08 }, { kind: 'ecAndes', color: '#4a9a4a', base: 330, f: 0.12 }, { kind: 'ecBananas', color: '#3a8a3a', base: 352, f: 0.35 }],
    fog: '#e8fff0', decor: ['ecAgave', 'ecFlowers', 'ecAgave']
  }),
  ec_andes: Object.assign({}, base, {
    rays: '#ffffff',
    name: 'The Andes', music: 'tour_ec', particles: 'dust',
    sky: ['#3a7ad8', '#a8d0ff', '#ffffff'], horizonGlow: '#ffffff',
    celestial: { type: 'sun', x: 0.25, y: 0.18, r: 34, color: '#fffbe8', glow: '#ffffff' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'mountains', color: '#9ab0d8', base: 300, amp: 170, f: 0.03, blur: true, snow: true, dyn: 'ecCables' }, { kind: 'ecCotopaxi', color: '#7a8ab0', base: 330, f: 0.05 }, { kind: 'clouds', color: '#ffffff', base: 360, f: 0.1 }, { kind: 'ecAndes', color: '#5aa85a', base: 380, f: 0.2 }],
    fog: '#ffffff'
  }),
  ec_amazon: Object.assign({}, base, {
    name: 'Amazon Canopy', music: 'tour_ec_night', particles: 'fireflies',
    ground: { style: 'grass', cap: '#2a7a3a', capHi: '#5ab86a', dirt: '#3a2a1a', dirt2: '#1a120a', rock: '#4a3a2a' },
    sky: ['#06120e', '#0e2a1e', '#1a3a2a'], horizonGlow: '#3a8a5a',
    celestial: { type: 'moon', x: 0.8, y: 0.15, r: 24, color: '#f8fff0', glow: '#b8ffd0' }, stars: 0.6,
    layers: [{ kind: 'ecCanopy', color: '#0e2a1a', base: 300, f: 0.08 }, { kind: 'ecCanopy', color: '#081a10', base: 355, f: 0.25 }],
    fog: '#3a8a6a', darkness: 0.55, liquid: 'canal', semi: { style: 'log', c1: '#5a4028', c2: '#3a2818' }, decor: ['ecFern', 'ecFern', 'ecMushroom']
  }),
  ec_galapagos: Object.assign({}, base, {
    rays: '#c8ffff',
    name: 'Galápagos', music: 'tour_ec_deep', particles: 'bubbles', underwater: true,
    sky: ['#5ae8ff', '#1a9ad8', '#0a4a8a'], horizonGlow: '#aaffff', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'rocks', color: '#16607a', base: 330, amp: 60, f: 0.08 }, { kind: 'kelp', color: '#0e6a5a', base: 400, f: 0.2 }],
    fog: '#7af0ff', ground: { style: 'coral', cap: '#ff8a6a', capHi: '#ffc8a0', dirt: '#2e3a48', dirt2: '#18202a', rock: '#3e4a5a' }, hard: { c1: '#4a4a56', c2: '#22222a' }
  }),
  ec_cotopaxi: Object.assign({}, base, {
    name: 'Ice Fort', music: 'tour_ec', particles: 'snow',
    ground: { style: 'snow', cap: '#f0f8ff', capHi: '#ffffff', dirt: '#6a8aaa', dirt2: '#3a5a7a', rock: '#8aa8c8' },
    sky: ['#3a5a9a', '#9ac0f0', '#e8f4ff'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.8, y: 0.16, r: 30, color: '#ffffff', glow: '#d8f0ff' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'ecCotopaxi', color: '#8a9ac0', base: 330, f: 0.04 }, { kind: 'pines', color: '#4a6a8a', base: 365, f: 0.2, snow: true }],
    fog: '#e8f4ff', liquid: 'icewater', decor: ['ecIceRock'],
    hard: { c1: '#c8e0f8', c2: '#7aa0c8' }, brick: { style: 'ice', c1: '#9fdcff', c2: '#5aa6d6', mortar: '#e6f8ff' }, semi: { style: 'ice', c1: '#c8f0ff', c2: '#7ab8dc' },
    pillar: { c1: '#b8dcf8', c2: '#6a9ac8', cap: '#ffffff', style: 'column' }
  })
};

/* ---------------- decor ---------------- */
const decor = {
  ecAgave(ctx, x, y) { ctx.fillStyle = '#7aa87a'; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + k * 6, y - 22 + Math.abs(k) * 4); ctx.lineTo(x + 2, y); ctx.fill(); } },
  ecFlowers(ctx, x, y) { for (let k = 0; k < 5; k++) { ctx.fillStyle = WOVEN[k]; ctx.beginPath(); ctx.arc(x - 8 + k * 4, y - 5 - (k % 2) * 3, 2.6, 0, TAU); ctx.fill(); } ctx.fillStyle = '#4a8a3a'; ctx.fillRect(x - 9, y - 3, 18, 3); },
  ecFern(ctx, x, y) { ctx.strokeStyle = '#2a6a3a'; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + k * 6, y - 18, x + k * 12, y - 10 - Math.abs(k) * 2); ctx.stroke(); } },
  ecIceRock(ctx, x, y) { ctx.fillStyle = '#d8f0ff'; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 6, y - 14); ctx.lineTo(x + 2, y - 10); ctx.lineTo(x + 8, y - 18); ctx.lineTo(x + 13, y); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x - 5, y - 11, 2, 7); },
  // the painted equator line across the ground
  ecLine(ctx, x, y, t, th, d) {
    ctx.fillStyle = '#e8323a'; ctx.fillRect(x - d.w / 2, y - 3, d.w, 3); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - d.w / 2, y - 6, d.w, 3);
    ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('0°00\'00"  LATITUDE ZERO  0°00\'00"', x, y - 10);
  },
  // a shimmering low-gravity bubble over the line
  ecBubble(ctx, x, y, t, th, d) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, y - d.h, 0, y); g.addColorStop(0, 'rgba(160,220,255,0)'); g.addColorStop(1, 'rgba(160,220,255,0.2)');
    ctx.fillStyle = g; ctx.fillRect(x - d.w / 2, y - d.h, d.w, d.h);
    for (let k = 0; k < 10; k++) { const ph = (t * 0.35 + k / 10) % 1; ctx.fillStyle = `rgba(220,240,255,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x - d.w / 2 + ((k * 37) % d.w), y - ph * d.h, 2 + (k % 3), 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  ecPlant(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h;
    ctx.fillStyle = '#4a7a2a'; ctx.fillRect(x - 3, y - h + 8, 6, h - 8);
    ctx.fillStyle = '#5ab84a'; ctx.beginPath(); ctx.ellipse(x - w * 0.25, y - h + 4, w * 0.36, 6, -0.15, 0, TAU); ctx.ellipse(x + w * 0.25, y - h + 4, w * 0.36, 6, 0.15, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a8a2a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - w / 2 + 4, y - h + 4); ctx.lineTo(x + w / 2 - 4, y - h + 4); ctx.stroke();
    ctx.fillStyle = '#ffe04a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(x + 5 + k * 2, y - h + 15 + k * 4, 2, 5, 0.3, 0, TAU); ctx.fill(); }
  },
  ecCacaoTree(ctx, x, y) {
    ctx.fillStyle = '#5a3a24'; ctx.fillRect(x - 3, y - 40, 6, 40);
    ctx.fillStyle = '#2a7a3a'; ctx.beginPath(); ctx.arc(x, y - 48, 20, 0, TAU); ctx.arc(x - 14, y - 40, 12, 0, TAU); ctx.arc(x + 14, y - 40, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8902a'; for (const [dx, dy] of [[-5, -22], [5, -16], [-4, -10]]) { ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 3.5, 6, 0, 0, TAU); ctx.fill(); }
  },
  // cable-car tower: its sheave arm swings out at head height (duck or hop)
  ecTower(ctx, x, y, t) {
    ctx.strokeStyle = '#5a5a6a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 24, y + 330); ctx.lineTo(x - 7, y - 150); ctx.moveTo(x + 24, y + 330); ctx.lineTo(x + 7, y - 150); ctx.stroke();
    ctx.lineWidth = 1.3; for (let k = 0; k < 12; k++) { const yy = y - 140 + k * 40, hw = 7 + (k * 40 / 480) * 17; ctx.beginPath(); ctx.moveTo(x - hw, yy); ctx.lineTo(x + hw + 2, yy + 40); ctx.moveTo(x + hw, yy); ctx.lineTo(x - hw - 2, yy + 40); ctx.stroke(); }
    ctx.fillStyle = '#3a3a48'; ctx.fillRect(x - 30, y - 160, 60, 8);
    for (const dx of [-20, 0, 20]) { ctx.save(); ctx.translate(x + dx, y - 166); ctx.rotate(t * 4); ctx.fillStyle = '#8a8a9a'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a3a48'; ctx.fillRect(-1, -6, 2, 12); ctx.restore(); }
    // the arm at head height
    ctx.fillStyle = '#2a2a34'; rr(ctx, x - 16, y - 30, 32, 26, 4); ctx.fill();
    ctx.save(); rr(ctx, x - 16, y - 30, 32, 26, 4); ctx.clip();
    for (let k = -3; k < 6; k++) { ctx.fillStyle = k % 2 ? '#ffd23a' : '#1a1a20'; ctx.beginPath(); ctx.moveTo(x - 16 + k * 8, y - 4); ctx.lineTo(x - 8 + k * 8, y - 4); ctx.lineTo(x + k * 8, y - 12); ctx.lineTo(x - 8 + k * 8, y - 12); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = `rgba(255,80,60,${0.6 + 0.4 * Math.sin(t * 6)})`; ctx.beginPath(); ctx.arc(x, y - 22, 4, 0, TAU); ctx.fill();
  },
  // a snowy rock spire poking up at foot height (hop it)
  ecRidge(ctx, x, y, t, th, d) {
    const w = d.w;
    ctx.fillStyle = '#6a6a7a'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 20, y + 260); ctx.lineTo(x - w / 2 - 4, y - 10); ctx.lineTo(x - 4, y - 34); ctx.lineTo(x + 6, y - 26); ctx.lineTo(x + w / 2 + 4, y - 6); ctx.lineTo(x + w / 2 + 22, y + 260); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 4, y - 10); ctx.lineTo(x - 4, y - 34); ctx.lineTo(x + 6, y - 26); ctx.lineTo(x + w / 2 + 4, y - 6); ctx.lineTo(x + 6, y - 18); ctx.lineTo(x - 6, y - 22); ctx.closePath(); ctx.fill();
  },
  // a maintenance catwalk hanging from the cable
  ecCatwalk(ctx, x, y, t, th, d) {
    const w = d.w, x0 = x - w / 2, top = y - d.h;
    ctx.strokeStyle = '#3a3a48'; ctx.lineWidth = 2; for (const px of [x0 + 8, x0 + w - 8]) { ctx.beginPath(); ctx.moveTo(px, top - 150); ctx.lineTo(px, top); ctx.stroke(); }
    ctx.fillStyle = '#5a5a6a'; ctx.fillRect(x0, top, w, 7);
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(x0, top + 7, w, 2);
    ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, top - 14); ctx.lineTo(x0 + w, top - 14); ctx.stroke();
    for (let k = 0; k <= w; k += 16) { ctx.beginPath(); ctx.moveTo(x0 + k, top - 14); ctx.lineTo(x0 + k, top); ctx.stroke(); }
  },
  // the cable car's mid-station: a slab on stilts with a canopy
  ecStation(ctx, x, y, t, th, d) {
    const w = d.w, x0 = x - w / 2, fl = y - TS, top = y - d.h;
    ctx.fillStyle = '#7a7a8a'; for (const px of [x0 + 16, x0 + w - 24]) ctx.fillRect(px, fl + 10, 8, 320);
    ctx.fillStyle = '#9a9aa8'; ctx.fillRect(x0 - 6, fl, w + 12, 12); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x0 - 6, fl + 12, w + 12, 3);
    ctx.fillStyle = '#5a5a6a'; for (const px of [x0 + 2, x0 + w - 8]) ctx.fillRect(px, top + 14, 6, fl - top - 14);
    ctx.fillStyle = '#e8323a'; ctx.beginPath(); ctx.moveTo(x0 - 14, top + 18); ctx.lineTo(x0 + w / 2, top); ctx.lineTo(x0 + w + 14, top + 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffffff'; rr(ctx, x - 44, top + 22, 88, 16, 4); ctx.fill();
    ctx.fillStyle = '#2a2a34'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('MID-STATION', x, top + 34);
  },
  ecMushroom(ctx, x, y, t) { for (const [dx, s] of [[-6, 1], [4, 0.7]]) { ctx.fillStyle = '#e8fff0'; ctx.fillRect(x + dx - 1.5 * s, y - 10 * s, 3 * s, 10 * s); ctx.fillStyle = `rgba(90,255,180,${0.7 + 0.3 * Math.sin(t * 2 + dx)})`; ctx.beginPath(); ctx.ellipse(x + dx, y - 10 * s, 7 * s, 4 * s, 0, Math.PI, TAU); ctx.fill(); } },
  ecVineTop(ctx, x, y) { ctx.fillStyle = '#123a1e'; ctx.beginPath(); ctx.ellipse(x, y - 6, 54, 14, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#1e5a2e'; ctx.beginPath(); ctx.ellipse(x - 18, y - 12, 26, 9, -0.2, 0, TAU); ctx.ellipse(x + 20, y - 10, 22, 8, 0.2, 0, TAU); ctx.fill(); },
  // the sunlit sea surface overhead (and light rays slanting down)
  ecSurface(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, top = y - d.h;
    const g = ctx.createLinearGradient(0, top - 60, 0, y); g.addColorStop(0, '#f0ffff'); g.addColorStop(1, 'rgba(140,230,255,0.55)');
    ctx.fillStyle = g; ctx.fillRect(x0, top - 400, d.w, d.h + 400);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.moveTo(x0, y - 10);
    for (let k = 0; k <= d.w; k += 16) ctx.lineTo(x0 + k, y - 8 + Math.sin((x0 + k) * 0.03 + t * 2) * 4);
    ctx.lineTo(x0 + d.w, y - 18); ctx.lineTo(x0, y - 18); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 4; k++) { const rx = x0 + ((k * 137 + d.seed * 31) % d.w), a = 0.06 + 0.04 * Math.sin(t * 1.3 + k); ctx.fillStyle = `rgba(200,255,255,${a})`; ctx.beginPath(); ctx.moveTo(rx, y); ctx.lineTo(rx + 30, y); ctx.lineTo(rx + 110, y + 420); ctx.lineTo(rx + 50, y + 420); ctx.fill(); }
    ctx.restore();
  },
  // a current: streaks show which way it pushes
  ecStream(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, top = y - d.h, dir = d.dir || 1;
    ctx.strokeStyle = 'rgba(220,255,255,0.35)'; ctx.lineWidth = 2;
    for (let k = 0; k < 10; k++) { const ph = ((t * 0.8 * dir + k * 0.37) % 1 + 1) % 1, sx = x0 + ph * d.w, sy = top + 12 + ((k * 53) % (d.h - 24)); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - dir * 26, sy); ctx.stroke(); }
  },
  ecCoral(ctx, x, y, t) { for (let k = -2; k <= 2; k++) { ctx.strokeStyle = ['#ff7a8a', '#ffb84a', '#ff5aa0'][(k + 3) % 3]; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + k * 6, y); ctx.quadraticCurveTo(x + k * 9 + Math.sin(t + k) * 2, y - 14, x + k * 11, y - 22 - (k % 2) * 6); ctx.stroke(); } }
};
const decorLights = { ecMushroom: [90, '#5affb4', -10] };

/* ---------------- enemies ---------------- */
const bananaArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y);
  if (m !== 'flat' && m !== 'ko') K.feet(ctx, 0, 0, e.t, '#6a5a2a', 4, 6, m === 'stun');
  ctx.translate(0, -6); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#ffe04a'; ctx.beginPath(); ctx.moveTo(-4, -26); ctx.quadraticCurveTo(-12, -12, -4, 0); ctx.lineTo(4, 0); ctx.quadraticCurveTo(-3, -12, 4, -26); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a4a2a'; ctx.fillRect(-1, -30, 4, 5); ctx.beginPath(); ctx.arc(0, 0, 2, 0, TAU); ctx.fill();
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, -2, -16, 1, 2.2, 1.8, true);
  ctx.restore();
};
const cacaoArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y - 10);
  if (m === 'roll' || m === 'curl') ctx.rotate(e.t * 12 * e.dir);
  ctx.fillStyle = '#e8902a'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 9, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#a8501a'; ctx.lineWidth = 1.2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(k * 4, 0, 1.5, 8, 0, 0, TAU); ctx.stroke(); }
  if (m !== 'roll' && m !== 'curl' && m !== 'flat' && m !== 'ko') K.eyes(ctx, 3 * e.dir, -2, e.dir, 2.4, 1.8, false);
  ctx.restore();
};
const alpacaArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#f2e8d8';
  for (const lx of [-8, -3, 4, 9]) ctx.fillRect(lx - 1.5, -12, 3, 12);
  ctx.beginPath(); ctx.ellipse(0, -18, 13, 9, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, -32, 5, 12, 0.15, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(12, -42, 6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8323a'; ctx.fillRect(7, -36, 8, 3);
  ctx.fillStyle = '#f2e8d8'; ctx.beginPath(); ctx.moveTo(9, -47); ctx.lineTo(10, -54); ctx.lineTo(12, -47); ctx.fill(); ctx.beginPath(); ctx.moveTo(13, -47); ctx.lineTo(15, -53); ctx.lineTo(15, -46); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(15, -43, 1.3, 0, TAU); ctx.fill();
  ctx.fillStyle = m === 'throw' ? '#8a5a4a' : '#c8a090'; ctx.beginPath(); ctx.ellipse(17, -39, 2.5, m === 'throw' ? 2.4 : 1.4, 0, 0, TAU); ctx.fill();
  ctx.restore();
};
const condorArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const f = Math.sin(e.t * (m === 'swoop' ? 6 : 3));
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-16, -10 - f * 10, -30, -4 - f * 12); ctx.lineTo(-24, 2); ctx.lineTo(-30, 4); ctx.lineTo(-6, 4); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(14, -10 - f * 10, 28, -4 - f * 12); ctx.lineTo(24, 2); ctx.lineTo(4, 4); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 2, 10, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(8, -2, 4, 2.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c86a5a'; ctx.beginPath(); ctx.arc(12, -4, 3.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8d870'; ctx.beginPath(); ctx.moveTo(14, -4); ctx.lineTo(19, -2); ctx.lineTo(14, -2); ctx.fill();
  ctx.restore();
};
const frogArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const glow = 0.6 + 0.4 * Math.sin(t * 3 + e.seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, -8, 1, 0, -8, 18); g.addColorStop(0, `rgba(120,255,200,${0.35 * glow})`); g.addColorStop(1, 'rgba(120,255,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -8, 18, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#2ae88a'; ctx.beginPath(); ctx.ellipse(0, -7, 10, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a5aff'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-5 + k * 5, -8 + (k % 2) * 3, 1.8, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#2ae88a'; ctx.beginPath(); ctx.arc(-4, -13, 3.5, 0, TAU); ctx.arc(4, -13, 3.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(-4, -13.5, 1.6, 0, TAU); ctx.arc(4, -13.5, 1.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff7a2a'; for (const s of [-1, 1]) ctx.fillRect(s * 9 - 2, -2, 4, 2);
  ctx.restore();
};
const seaLionArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); if (m === 'ko') ctx.scale(1, -1);
  ctx.fillStyle = '#8a6a5a'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 7, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-22, -6); ctx.lineTo(-22, 6); ctx.fill();
  ctx.beginPath(); ctx.arc(14, -3, 6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.ellipse(2, 5, 6, 2.5, 0.4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(16, -5, 1.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(20, -2, 1.3, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#c8b8a8'; ctx.lineWidth = 0.8; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(19, -1); ctx.lineTo(24, -1 + s * 2); ctx.stroke(); }
  ctx.restore();
};
const pufferArt = (ctx, e, x, y) => {
  const pf = e.puff || 0, r = 8 + pf * 7;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#f2d86a'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  if (pf > 0.3) { ctx.strokeStyle = '#c8a03a'; ctx.lineWidth = 1.5; for (let k = 0; k < 12; k++) { const a = k * TAU / 12; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * (r + 4 * pf), Math.sin(a) * (r + 4 * pf)); ctx.stroke(); } }
  ctx.fillStyle = 'rgba(160,120,40,0.4)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(-4 + k * 2, -3 + (k % 2) * 4, 1.4, 0, TAU); ctx.fill(); }
  K.eyes(ctx, (e.dir || 1) * 3, -2, e.dir || 1, 2.4, 2 + pf, false);
  ctx.fillStyle = '#c8603a'; ctx.beginPath(); ctx.arc((e.dir || 1) * (r - 1), 3, 1.6 + pf, 0, TAU); ctx.fill();
  ctx.restore();
};
const penguinArt = (ctx, e, x, y) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.rotate(Math.PI / 2 * 0.9);
  ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 13, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(1.5, 2, 4.5, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(1, -9, 1.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffb81a'; ctx.beginPath(); ctx.moveTo(-1, -13); ctx.lineTo(1, -18); ctx.lineTo(3, -13); ctx.fill();
  ctx.restore();
};
// marine iguanas really do sneeze out salt
const iguanaArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.moveTo(-26, -3); ctx.quadraticCurveTo(-16, -6, -8, -6); ctx.lineTo(-8, -2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -7, 12, 6, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(13, -10, 6, 4.5, 0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8a3a3a'; ctx.beginPath(); ctx.ellipse(0, -6, 8, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#6a6a7a'; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(-10 + k * 3.5, -12); ctx.lineTo(-8.5 + k * 3.5, -16 - (k % 2) * 2); ctx.lineTo(-7 + k * 3.5, -12); ctx.fill(); }
  for (const lx of [-7, 6]) ctx.fillRect(lx - 1.5, -3, 3, 3);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(14, -12, 1.8, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(14.5, -12, 0.9, 0, TAU); ctx.fill();
  if (m === 'throw') { ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(20 + k * 3, -10 - k, 1.2, 0, TAU); ctx.fill(); } }
  ctx.restore();
};
// puffers inflate (and get bigger) when Brady swims close
class EcPuffer extends TourSwimmer {
  constructor(g, s) { super(g, s, { w: 20, h: 20, speed: 0.8, range: 2, chase: false, art: pufferArt }); this.puff = 0; }
  update(dt) {
    super.update(dt);
    if (this.knocked) return;
    const want = K.near(this, this.g.player, 3.4, 2.6) ? 1 : 0;
    const np = approach(this.puff, want, dt * (want ? 4 : 1.2));
    if (np !== this.puff) { const cx = this.cx, cy = this.cy, s = 20 + np * 14; this.puff = np; this.w = this.h = s; this.x = cx - s / 2; this.y = cy - s / 2; }
  }
}
// living ice blocks, cut from the glacier: they skate along the ice
const iceCubeArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); if (m === 'flat') ctx.scale(1.2, 0.4);
  ctx.fillStyle = 'rgba(200,240,255,0.92)'; rr(ctx, -12, -24, 24, 24, 4); ctx.fill();
  ctx.strokeStyle = '#7ab8dc'; ctx.lineWidth = 1.5; rr(ctx, -12, -24, 24, 24, 4); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(-8, -20, 4, 9); ctx.fillRect(-2, -20, 2, 4);
  if (m !== 'flat' && m !== 'ko') { K.eyes(ctx, e.dir * 3, -13, e.dir, 3, 2.2, true); ctx.fillStyle = '#5a8ab0'; for (const s of [-1, 1]) ctx.fillRect(s * 6 - 4 + Math.sin(e.t * 12 + s) * 2, -1, 8, 2); }
  ctx.restore();
};
const salt = (ctx, s) => { ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fillRect(s.cx - 3, s.cy - 3, 6, 6); ctx.fillStyle = 'rgba(200,230,255,0.9)'; ctx.fillRect(s.cx - 1, s.cy - 1, 2, 2); };
const enemies = {
  ecBanana: { cls: TourEnemy.make({ w: 16, h: 32, speed: 1.0, behavior: 'walk', art: bananaArt, burst: '#ffe04a' }), place: 'walk' },
  ecCacao: { cls: TourEnemy.make({ w: 24, h: 18, speed: 0.8, behavior: 'roll', range: 9, rollSpeed: 6.4, art: cacaoArt, burst: '#e8902a' }), place: 'walk' },
  ecAlpaca: { cls: TourEnemy.make({ w: 26, h: 46, speed: 0.5, behavior: 'throw', every: 2.4, range: 10, pace: true, hp: 2, art: alpacaArt, burst: '#f2e8d8', shoot: (e) => {
    tourFire(e.g, e.cx + e.dir * 14, e.y + 6, { kind: 'spit', vx: e.dir * 4.5 * TS, vy: -4 * TS, grav: PHYS.gDown * 0.35, w: 10, h: 10, life: 3, col: '#c8e8f0', art: (ctx, s) => { ctx.fillStyle = 'rgba(220,240,250,0.9)'; ctx.beginPath(); ctx.arc(s.cx, s.cy, 4, 0, TAU); ctx.arc(s.cx - 3, s.cy + 2, 2.5, 0, TAU); ctx.fill(); } });
    K.say(e.g, e, 'PTOO!', '#ffffff'); Sound.play('throw', { pitch: 1.6, vol: 0.4 });
  } }), place: 'walk' },
  ecCondor: { cls: TourFlyer.make({ w: 34, h: 16, range: 4, speed: 0.6, swoop: true, art: condorArt, burst: '#1a1a22' }), place: 'fly' },
  ecFrog: { cls: TourEnemy.make({ w: 18, h: 16, speed: 1.0, behavior: 'hop', hopV: 10, hopEvery: 1.4, art: frogArt, glow: 'rgba(120,255,200,', burst: '#2ae88a' }), place: 'walk' },
  ecIguana: { cls: TourEnemy.make({ w: 30, h: 18, speed: 0.4, behavior: 'throw', every: 2.2, range: 7, pace: true, art: iguanaArt, burst: '#3a3a44', shoot: (e) => {
    for (let k = -1; k <= 1; k++) tourFire(e.g, e.cx + e.dir * 16, e.y + 4, { kind: 'salt', vx: e.dir * (2.4 + k * 0.6) * TS, vy: (-2.6 + k) * TS, grav: PHYS.gDown * 0.12, w: 8, h: 8, life: 2.2, col: '#ffffff', art: salt });
    K.say(e.g, e, 'ACHOO!', '#ffffff'); Sound.play('throw', { pitch: 2, vol: 0.3 });
  } }), place: 'walk' },
  ecIceCube: { cls: TourEnemy.make({ w: 24, h: 24, speed: 1.5, behavior: 'walk', art: iceCubeArt, burst: '#d8f4ff' }), place: 'walk' },
  ecSeaLion: { cls: TourSwimmer.make({ w: 36, h: 16, speed: 2.0, range: 5, art: seaLionArt }), place: 'swim' },
  ecPuffer: { cls: EcPuffer, place: 'swim' },
  ecPenguin: { cls: TourSwimmer.make({ w: 26, h: 14, speed: 3.2, range: 6, chase: false, art: penguinArt }), place: 'swim' }
};
// a blue-footed booby on the path: it hands Brady its boots
const boobyArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
  const dance = m === 'idle' ? Math.sin(t * 6) * 2 : 0;
  ctx.fillStyle = '#3ab8ff'; ctx.beginPath(); ctx.ellipse(-5, -2 + dance, 6, 3, 0, 0, TAU); ctx.ellipse(6, -2 - dance, 6, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.ellipse(0, -18, 11, 13, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(2, -15, 7, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f2ece0'; ctx.beginPath(); ctx.arc(4, -32, 7, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5a7a9a'; ctx.beginPath(); ctx.moveTo(9, -32); ctx.lineTo(20, -29); ctx.lineTo(9, -28); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(6, -33, 1.4, 0, TAU); ctx.fill();
  ctx.restore();
  if (m !== 'wave') { ctx.fillStyle = '#ffd84a'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', x, y - 46 + Math.sin(t * 5) * 2); }
};
// an icicle hanging under an icy ledge: it shakes, then drops, when Brady comes close
class EcIcicle extends Ent {
  constructor(g, s) { super(g, s, 16, 26); this.y = s.y - TS; this.hy = this.y; this.state = 'hang'; this.k = 0; }
  update(dt) {
    this.t += dt; const p = this.g.player;
    if (this.state === 'hang') { if (p && !p.dead && p.y > this.y && Math.abs(p.cx - this.cx) < 3 * TS) { this.state = 'shake'; this.k = 0.35; } }
    else if (this.state === 'shake') { this.k -= dt; if (this.k <= 0) { this.state = 'fall'; this.vy = 0; } }
    else if (this.state === 'fall') {
      this.vy += PHYS.gDown * 0.8 * dt; this.y += this.vy * dt;
      if (SOLID[tileAt(this.g.area, Math.floor(this.cx / TS), Math.floor((this.y + this.h) / TS))] || this.y > this.g.area.H * TS) { this.state = 'gone'; this.k = 3; this.g.burst(this.cx, this.y + this.h, 10, '#d8f4ff', 'debris'); Sound.play('break', { vol: 0.4 }); }
    }
    else if (this.state === 'gone') { this.k -= dt; if (this.k <= 0) { this.state = 'hang'; this.y = this.hy; } }
  }
  touchPlayer(p) { if (this.state === 'fall') p.hurt(this); }
  draw(ctx) {
    if (this.state === 'gone') return;
    const sx = this.state === 'shake' ? Math.sin(this.t * 60) * 1.5 : 0;
    ctx.fillStyle = '#d8f4ff'; ctx.beginPath(); ctx.moveTo(this.x + sx, this.y); ctx.lineTo(this.x + this.w + sx, this.y); ctx.lineTo(this.cx + sx, this.y + this.h); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(this.x + 4 + sx, this.y + 2, 2, 10);
  }
}
// the tidal surge: flips its current back and forth (bubbles show the way)
class EcSurge extends Ent {
  constructor(g, s) { super(g, s, 10, 10); this.zone = null; }
  update(dt) {
    this.t += dt;
    if (!this.zone) this.zone = (this.g.area.zones || []).find(z => z.kind === 'surge' && Math.abs(z.x - this.s.zx) < 2) || null;
    if (this.zone) this.zone.fx = Math.sin(this.t * 1.3) * 2.8 * TS;
  }
  draw(ctx) {
    const z = this.zone; if (!z) return;
    const d = sign(z.fx) || 1, k = Math.min(1, Math.abs(z.fx) / (2.8 * TS));
    ctx.strokeStyle = `rgba(230,255,255,${0.15 + 0.35 * k})`; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { const ph = ((this.t * 0.9 * d + i * 0.29) % 1 + 1) % 1, sx = z.x + ph * z.w, sy = z.y + 20 + ((i * 61) % Math.max(40, z.h - 40)); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - d * 22 * k, sy); ctx.stroke(); }
  }
}
const entities = { ecBooby: TourFriend.make({ w: 26, h: 44, give: 'sig:boots', line: 'BLUE BOOTS! BOUNCY!', art: boobyArt }), ecIcicle: EcIcicle, ecSurge: EcSurge };

/* ---------------- the signature power-up: BOOBY BOOTS ---------------- */
// bright blue boots (like a blue-footed booby's feet): super-bouncy jumps; a big landing sends out a shockwave
function bootsIcon(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y + 2);
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(s * 6, Math.sin(t * 6 + s) * 1.5);
    ctx.fillStyle = '#3ab8ff'; ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(3, -8); ctx.lineTo(4, 0); ctx.lineTo(9, 4); ctx.lineTo(-9, 4); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1a7ac8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(-1, 1); ctx.moveTo(3, 4); ctx.lineTo(1, 1); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
class EcRing extends Ent {
  constructor(g, x, y) { super(g, null, 10, 10); this.x = x; this.y = y; this.life = 0.45; }
  update(dt) { this.life -= dt; if (this.life <= 0) this.remove = true; }
  draw(ctx) { const k = 1 - this.life / 0.45; ctx.strokeStyle = `rgba(140,220,255,${1 - k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(this.x, this.y - 2, 10 + k * 110, 4 + k * 14, 0, 0, TAU); ctx.stroke(); }
}
const power = {
  id: 'boots', name: 'BOOBY BOOTS', country: 'ec', hint: 'SUPER-BOUNCY JUMPS · BIG LANDINGS SEND OUT A SHOCKWAVE', time: 0, cooldown: 0.3, jumpBoost: 1.2,
  icon: bootsIcon,
  update(p, dt, inp, g) {
    if (p.inWater || p.lsdT > 0) { p._bootAir = false; return; }
    if (!p.onGround) { if (!p._bootAir) { p._bootAir = true; p._bootTop = p.y; } p._bootTop = Math.min(p._bootTop, p.y); return; }
    if (!p._bootAir) return;
    p._bootAir = false;
    if (p.y - p._bootTop < 3.5 * TS) return;
    // a big landing: enemies close by are knocked out, the ones further off get dizzy
    g.shake(5); Sound.play('stomp', { pitch: 0.5 }); g.burst(p.cx, p.y + p.h, 18, '#8ad8ff', 'dust');
    g.spawn(new EcRing(g, p.cx, p.y + p.h));
    for (const e of g.entities) {
      if (!e.enemy || e.dead || e.remove || e.boss) continue;
      const dx = Math.abs(e.cx - p.cx), dy = Math.abs((e.y + e.h) - (p.y + p.h));
      if (dy > TS) continue;
      if (dx < 2.6 * TS) { if (e.hit('bump', p)) g.addScore(200, e.cx, e.y); }
      else if (dx < 4.5 * TS && e.stun) e.stun(2.2);
    }
  },
  drawOn(p, ctx) { for (const s of [-1, 1]) { ctx.fillStyle = '#3ab8ff'; ctx.beginPath(); ctx.ellipse(p.cx + s * 5 + p.facing * 2, p.y + p.h - 2, 5.5, 2.6, 0, 0, TAU); ctx.fill(); } }
};

/* ---------------- set pieces ---------------- */
const P = {
  /* 2-1: the equator */
  // a blue-footed booby hands over its boots
  booby(st) { const x = st.x; st.floor(x, x + 8); st.spawn('ecBooby', x + 5, st.gy - 1, {}); st.decor('ecFlowers', x + 2); return x + 9; },
  // the equator line: inside its bubble every jump floats twice as high
  equator(st, o) {
    const x = st.x, B = st.B, w = o.w || 12, gy = st.gy;
    st.floor(x, x + w + 1);
    const zh = Math.min(11, gy - 1);
    B.prop('ecLine', x + 1, gy - 1, w, 1, 'none', {});
    B.prop('ecBubble', x + 1, gy - zh, w, zh, 'none', {});
    B.zone(x + 1, gy - zh, w, zh, 0, -58 * TS, 0, 'lowgrav');
    // stepping stones only a floaty jump reaches
    const y1 = gy - 5, y2 = Math.max(3, gy - 9);
    st.semi(x + 3, x + 4, y1); st.semi(x + 7, x + 9, y2);
    st.arc(x + 1, x + 6, gy - 2, 5);
    st.coins(x + 7, x + 9, y2 - 2);
    if (o.gold) st.gold(x + 8, Math.max(1, y2 - 3), 'must');
    return x + w + 2;
  },
  // banana plants: their big leaves are one-way platforms
  bananas(st, o) {
    const x = st.x, B = st.B, n = o.n || 3; st.floor(x, x + n * 5 + 1);
    for (let k = 0; k < n; k++) {
      const lx = x + 1 + k * 5, ly = st.gy - 3 - (k % 2) * 2;
      B.prop('ecPlant', lx, ly, 4, st.gy - ly, 'none', {});
      for (let q = 0; q < 4; q++) { B.set(lx + q, ly, T.SEMI); B.setHide(lx + q, ly, 1); }
      st.coins(lx, lx + 3, ly - 2);
    }
    st.enemy('ecBanana', x + n * 5 - 1, st.gy);
    return x + n * 5 + 2;
  },
  // a hill of cacao trees: ripe pods roll down at Brady
  cacao(st) {
    const x = st.x; st.floor(x, x + 3);
    for (let i = 0; i < 3; i++) st.floor(x + 4 + i * 3, x + 6 + i * 3, st.gy - 1 - i);
    const top = st.gy - 3; st.floor(x + 13, x + 22, top);
    st.decor('ecCacaoTree', x + 15, top); st.decor('ecCacaoTree', x + 20, top);
    st.enemy('ecCacao', x + 18, top); st.enemy('ecCacao', x + 21, top);
    st.coins(x + 13, x + 21, top - 3);
    st.gy = top; return x + 23;
  },
  // stone terraces with a spitting alpaca on top
  terraces(st) {
    const x = st.x, B = st.B; st.floor(x, x + 18);
    for (let i = 0; i < 3; i++) B.fill(x + 3 + i * 4, st.gy - 1 - i * 2, x + 18, st.gy - 1, T.HARD);
    st.enemy('ecAlpaca', x + 16, st.gy - 5, { edgeTurn: true });
    st.coins(x + 4, x + 9, st.gy - 5);
    st.block(x + 12, st.gy - 9, 'power');
    return x + 19;
  },

  /* 2-2: the cable car (st.deck is the gondola's floor row) */
  // on the cable car the checkpoint is a mid-station the gondola glides through
  cp(st, o) {
    if (st.mode !== 'ride') return Tour.pieces.cp(st, o);
    const x = st.x, B = st.B;
    for (let q = 0; q < 6; q++) { B.set(x + q, st.deck, T.HARD); B.setHide(x + q, st.deck, 1); }
    B.prop('ecStation', x, st.deck - 5, 6, 6, 'none', {});
    st.spawn('checkpoint', x + 3, st.deck - 1);
    return x + 6;
  },
  // a tower's sheave arm at head height: duck under it or hop over it
  tower(st) {
    const x = st.x, B = st.B;
    B.set(x, st.deck - 2, T.HARD); B.setHide(x, st.deck - 2, 1);
    B.decorAt('ecTower', x, st.deck - 1, 0);
    st.coins(x - 1, x + 1, st.deck - 1);
    return x + 6;
  },
  // a snowy ridge pokes up at foot height: hop it
  ridge(st, o) {
    const x = st.x, B = st.B, w = o.w || 1;
    for (let q = 0; q < w; q++) { B.set(x + q, st.deck - 1, T.HARD); B.setHide(x + q, st.deck - 1, 1); }
    B.prop('ecRidge', x, st.deck - 1, w, 1, 'none', {});
    st.arc(x - 1, x + w, st.deck - 2, 2);
    return x + w + 5;
  },
  // condors ride the thermals beside the line
  condors(st) { const x = st.x; st.spawn('ecCondor', x + 4, st.deck - 6, { range: 4 }); st.coins(x + 1, x + 6, st.deck - 3); return x + 9; },
  // a maintenance catwalk overhead: hop up for goodies, then drop back into the gondola
  catwalk(st, o) {
    const x = st.x, B = st.B, cy = st.deck - 4, w = o.w || 5;
    for (let q = 0; q < w; q++) { B.set(x + q, cy, T.SEMI); B.setHide(x + q, cy, 1); }
    B.prop('ecCatwalk', x, cy, w, 1, 'none', {});
    st.coins(x, x + w - 1, cy - 2);
    if (o.gold) st.gold(x + Math.floor(w / 2), cy - 3, 'high');
    return x + w + 3;
  },

  /* 2-3: the canopy */
  // swinging vines over gaps in the treetops
  vines(st, o) {
    const B = st.B, n = o.n || 2; let x = st.x;
    st.floor(x, x + 2); x += 3;
    for (let k = 0; k < n; k++) {
      st.pit(x, x + 6);
      const ax = x + 3, ay = st.gy - 6, len = 5, amp = 0.55;
      st.spawn('mplat', ax, ay, { pw: 3, swing: { len: len * TS, amp }, speed: 1.1 + st.d * 0.4, skin: 'ecVine', phase: k * 1.3 });
      for (let a = -10; a <= 10; a++) { const th = a / 10 * amp; const gx = Math.round(ax + Math.sin(th) * len), gy2 = Math.round(ay + 1 + Math.cos(th) * len); for (let q = -1; q <= 1; q++) B.ghosts.push([gx + q, gy2]); }
      B.decorAt('ecVineTop', ax, ay + 1, 0);
      st.arc(ax - 2, ax + 2, ay + len - 2, 1);
      x += 7;
      if (k < n - 1) { st.floor(x, x + 1); x += 2; }
    }
    st.floor(x, x + 2);
    if (o.gold) st.gold(x - 4, st.gy - 6, 'risky');
    return x + 3;
  },
  // giant branches: up through the canopy
  branches(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 14);
    for (let k = 0; k < 3; k++) { const by = st.gy - 3 - k * 3, bx = x + 2 + (k % 2) * 6; for (let q = 0; q < 5; q++) B.set(bx + q, by, T.SEMI); st.coins(bx, bx + 4, by - 2); }
    st.decor('ecMushroom', x + 12);
    st.enemy('ecFrog', x + 10, st.gy);
    if (o.gold) st.gold(x + 10, st.gy - 12, 'high');
    return x + 15;
  },
  // glowing mushrooms light the forest floor
  glow(st, o) { const x = st.x, n = o.n || 8; st.floor(x, x + n); for (let k = 1; k < n; k += 3) st.decor('ecMushroom', x + k); if (o.frogs) { st.enemy('ecFrog', x + 3, st.gy); st.enemy('ecFrog', x + 6, st.gy); } return x + n + 1; },
  // giant lily pads on a jungle river: they sink a moment after Brady lands
  lilies(st, o) {
    const n = o.n || 3; let x = st.x; st.floor(x, x + 1); x += 2;
    const span = n * 3 + 1;
    st.pit(x, x + span - 1);
    st.B.fill(x, st.gy + 2, x + span - 1, st.H - 1, T.LAVA);
    for (let i = 0; i < n; i++) { st.spawn('fplat', x + 2 + i * 3, st.gy - 1, { pw: 2, skin: 'ecLily' }); st.B.ghosts.push([x + 1 + i * 3, st.gy], [x + 2 + i * 3, st.gy]); }
    st.coins(x + 1, x + span - 2, st.gy - 3);
    x += span; st.floor(x, x + 2);
    return x + 3;
  },

  /* 2-4: the Galápagos (rows 0-1 are the sea surface, st.floorY the sea bed) */
  surface(st) {
    const B = st.B;
    for (let x = 0; x < B.W; x++) { B.setHide(x, 0, 1); B.setHide(x, 1, 1); }
    for (let x = 0; x < B.W; x += 16) B.prop('ecSurface', x, 0, 16, 2, 'none', {});
    return st.x;
  },
  // a lava-rock arch: swim under it or over it
  arches(st, o) {
    const x = st.x, F = st.floorY;
    st.rock(x, 5, x + 9, 7);
    st.rock(x, 8, x + 1, F - 1); st.rock(x + 8, 8, x + 9, F - 1);
    st.coins(x + 3, x + 6, 11); st.coins(x + 2, x + 7, 3);
    st.spawn('ecSeaLion', x + 5, 10, { range: 3 });
    if (o.gold) st.gold(x + 5, 3, 'high');
    return x + 11;
  },
  // puffers guard a field of coins: they puff up when you get close
  puffers(st) {
    const x = st.x, F = st.floorY;
    for (let k = 0; k < 3; k++) st.spawn('ecPuffer', x + 2 + k * 4, 5 + (k % 2) * 5, {});
    st.coins(x + 1, x + 12, 8);
    st.rock(x + 5, F - 2, x + 7, F - 1); st.B.decorAt('ecCoral', x + 6, F - 2, 0);
    return x + 14;
  },
  // penguins zip along a current
  penguins(st, o) {
    const x = st.x, w = o.w || 12, d = o.dir || 1;
    st.B.zone(x, 3, w, 6, d * 2.6 * TS, 0, 0, 'current');
    st.B.prop('ecStream', x, 3, w, 6, 'none', { dir: d });
    st.spawn('ecPenguin', x + 3, 5, {}); st.spawn('ecPenguin', x + 8, 7, {});
    st.coins(x + 1, x + w - 2, 5);
    return x + w + 1;
  },
  // the tidal surge pushes back and forth between rocks
  surge(st) {
    const x = st.x, F = st.floorY, w = 12;
    st.B.zone(x, 2, w, F - 2, 2.8 * TS, 0, 0, 'surge');
    st.spawn('ecSurge', x + 6, 2, { zx: x * TS });
    st.rock(x + 3, 2, x + 4, 6); st.rock(x + 8, F - 5, x + 9, F - 1);
    st.coins(x + 1, x + 2, 10); st.coins(x + 6, x + 7, 4); st.coins(x + 10, x + 11, 9);
    return x + w + 1;
  },
  // marine iguanas on the rocks sneeze salt
  iguanas(st) {
    const x = st.x, F = st.floorY;
    st.rock(x + 2, F - 3, x + 5, F - 1); st.rock(x + 9, F - 2, x + 11, F - 1);
    st.enemy('ecIguana', x + 3, F - 3); st.enemy('ecIguana', x + 10, F - 2);
    st.coins(x + 1, x + 12, 7);
    return x + 14;
  },
  // a big rock with a hidden pocket (a postcard) up a narrow chimney from the tunnel below
  grotto(st) {
    const x = st.x, F = st.floorY;
    st.rock(x, 2, x + 6, F - 4);
    st.water(x + 2, 5, x + 4, 7); st.water(x + 3, 8, x + 3, F - 4);
    st.gold(x + 3, 6, 'must');
    st.coins(x + 1, x + 5, F - 2);
    return x + 7;
  },

  /* 2-5: the ice fort */
  // slippery ice under an icy ledge: its icicles drop when Brady comes close
  ice(st, o) {
    const x = st.x, B = st.B, n = o.n || 12, gy = st.gy;
    st.floor(x, x + n);
    for (let q = 1; q < n; q++) B.set(x + q, gy, T.ICE);
    B.fill(x + 2, gy - 8, x + n - 2, gy - 7, T.HARD);
    for (let k = 0; k < Math.floor((n - 4) / 4); k++) st.spawn('ecIcicle', x + 4 + k * 4, gy - 6, {});
    st.coins(x + 2, x + n - 2, gy - 3);
    return x + n + 1;
  },
  // ice floes on glacier meltwater: they sink a moment after Brady lands
  floes(st, o) {
    const n = o.n || 4; let x = st.x; st.floor(x, x + 1); x += 2;
    const span = n * 3 + 1;
    st.pit(x, x + span - 1);
    st.B.fill(x, st.gy + 2, x + span - 1, st.H - 1, T.LAVA);
    for (let i = 0; i < n; i++) { st.spawn('fplat', x + 2 + i * 3, st.gy - 1, { pw: 2, skin: 'ecFloe' }); st.B.ghosts.push([x + 1 + i * 3, st.gy], [x + 2 + i * 3, st.gy]); }
    st.coins(x + 1, x + span - 2, st.gy - 3);
    x += span; st.floor(x, x + 2);
    return x + 3;
  },
  arena_icecave(st, o) {
    const B = st.B, { x0, w, GY } = o;
    for (let q = 2; q < w - 2; q++) B.set(x0 + q, GY, T.ICE);
    for (let q = 0; q < 3; q++) { B.set(x0 + 4 + q, GY - 4, T.SEMI); B.set(x0 + w - 7 + q, GY - 4, T.SEMI); }
  }
};
const platforms = {
  // the open cable-car cabin carrying Brady (hung from the haul cable by its rear arm)
  ecGondola(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w, cx = x + w / 2;
    ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 700, y - 170); ctx.lineTo(x + w + 700, y - 170); ctx.stroke();
    ctx.fillStyle = '#3a3a48'; rr(ctx, cx - 16, y - 178, 32, 12, 4); ctx.fill();
    ctx.fillStyle = '#5a5a6a'; for (const dx of [-8, 8]) { ctx.beginPath(); ctx.arc(cx + dx, y - 172, 4, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#4a4a5a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, y - 168); ctx.lineTo(x + 10, y - 66); ctx.lineTo(x + 10, y + 4); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#e8323a'; rr(ctx, x - 6, y - 2, w + 12, 34, 7); ctx.fill();
    ctx.fillStyle = 'rgba(200,230,255,0.85)'; for (let k = 0; k < Math.floor(w / 28); k++) { rr(ctx, x + 2 + k * 28, y + 6, 22, 12, 3); ctx.fill(); }
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 6, y + 22, w + 12, 3);
    ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w + 2, y - 18); ctx.lineTo(x + w + 2, y); ctx.moveTo(x + w - 30, y - 18); ctx.lineTo(x + w + 2, y - 18); ctx.stroke();
    PlatformArt.deck(ctx, x - 6, y - 2, w + 12, '#d8d8e0');
  },
  // a vine with a knotted wooden swing-seat
  ecVine(ctx, p, t) {
    const ax = p.ancX, ay = p.ancY, mx = p.x + p.w / 2;
    ctx.strokeStyle = '#3a6a2a'; ctx.lineWidth = 3;
    for (const dx of [-p.w / 2 + 6, p.w / 2 - 6]) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + mx + dx) / 2 + 6, (ay + p.y) / 2, mx + dx, p.y); ctx.stroke(); }
    ctx.fillStyle = '#5ab84a'; for (let k = 1; k < 6; k++) { const kx = lerp(ax, mx, k / 6), ky = lerp(ay, p.y, k / 6); ctx.beginPath(); ctx.ellipse(kx + 4, ky, 4, 2, 0.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#6a4a2a'; rr(ctx, p.x, p.y, p.w, 9, 4); ctx.fill();
    ctx.fillStyle = '#8a6a3a'; ctx.fillRect(p.x + 4, p.y + 2, p.w - 8, 2);
  },
  // a giant Amazon water lily with its upturned rim
  ecLily(ctx, p) {
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#2a7a3a'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 5, w / 2 + 8, 8, p.tilt || 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c84a5a'; ctx.fillRect(x - 8, y, w + 16, 3);
    ctx.fillStyle = '#4aa85a'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 3, w / 2 + 4, 5, p.tilt || 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(20,60,30,0.5)'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + w / 2, y + 3); ctx.lineTo(x + w / 2 + k * (w / 5), y + 7); ctx.stroke(); }
    if ((p.design || 0) === 1) { ctx.fillStyle = '#fff0f4'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x + w - 6 + Math.cos(k * 1.26) * 4, y - 3 + Math.sin(k * 1.26) * 2, 4, 2.4, k * 1.26, 0, TAU); ctx.fill(); } }
  },
  // an ice floe
  ecFloe(ctx, p) {
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#e8f8ff'; ctx.beginPath(); ctx.moveTo(x - 4, y + 2); ctx.lineTo(x + 6, y - 2); ctx.lineTo(x + w - 4, y - 1); ctx.lineTo(x + w + 4, y + 3); ctx.lineTo(x + w, y + 12); ctx.lineTo(x, y + 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9ad0f0'; ctx.fillRect(x, y + 8, w, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x + 6, y + 1, w * 0.4, 2);
  }
};

/* ---------------- the boss: EL TORTUGÓN ---------------- */
// The Baron's giant grumpy tortoise, guarding the ice fort. His shell is too hard to stomp,
// he sneezes rolling snowballs and skids across the ice in his shell. But when he rears up
// to roar, his head is exposed: stomp it! Then he slams down: icicles and a ground quake.
class EcSnowball extends Ent {
  constructor(g, x, y, dir) { super(g, null, 20, 20); this.x = x - 10; this.y = y - 20; this.vx = dir * 4.2 * TS; this.dir = dir; this.r = 10; this.life = 6; }
  update(dt) {
    this.t += dt; this.life -= dt;
    this.vy += PHYS.gDown * dt;
    moveBody(this, this.g.area, dt, { semis: false });
    if (this.r < 22) { const cx = this.cx, by = this.y + this.h; this.r = Math.min(22, this.r + dt * 6); this.w = this.h = this.r * 2; this.x = cx - this.r; this.y = by - this.h; }
    if (this.hitWall || this.life <= 0) this.pop();
  }
  pop() { if (this.remove) return; this.remove = true; this.g.burst(this.cx, this.cy, 14, '#ffffff', 'debris'); Sound.play('break', { vol: 0.35 }); }
  touchPlayer(p) { p.hurt(this); }
  hit(kind) { if (kind === 'stomp') return false; this.pop(); return true; }
  draw(ctx) {
    ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(this.t * 6 * this.dir);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, this.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c8e0f0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, this.r * 0.6, 0.4, 2.2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, this.r * 0.75, 3.4, 4.6); ctx.stroke();
    ctx.restore();
  }
}
// the slam's quake: a ridge of ice shards racing along the floor
class EcQuake extends Ent {
  constructor(g, x, floorY, dir) { super(g, null, 26, 18); this.x = x - 13; this.y = floorY - 18; this.dir = dir; this.life = 1.5; }
  update(dt) { this.t += dt; this.life -= dt; this.x += this.dir * 6 * TS * dt; if (this.life <= 0 || SOLID[tileAt(this.g.area, Math.floor((this.cx + this.dir * 14) / TS), Math.floor((this.y + 4) / TS))]) this.remove = true; }
  touchPlayer(p) { p.hurt(this); }
  draw(ctx) { ctx.fillStyle = '#d8f4ff'; for (let k = 0; k < 4; k++) { const sx = this.x + k * 7, h = 10 + ((k + Math.floor(this.t * 20)) % 3) * 4; ctx.beginPath(); ctx.moveTo(sx, this.y + this.h); ctx.lineTo(sx + 3.5, this.y + this.h - h); ctx.lineTo(sx + 7, this.y + this.h); ctx.fill(); } }
}
const boss = {
  id: 'ec_tortoise', name: 'El Tortugón', hp: 4, dims: [84, 58], music: 'tour_ec_boss', country: 'ec',
  brain: {
    guardText: 'HARD SHELL!',
    noDisc(b) { return b.act === 'slide'; },
    wake(b) { K.say(b.g, b, 'SLOW... BUT... GRUMPY!', '#ffd84a'); },
    update(b, dt) {
      const g = b.g;
      b.guard = 'bounce';
      if (b.act === 'walk') {
        b.face(); b.walk(0.7); b.pose = 'walk';
        if (b.at > 1.7) { b.cycle++; b.go(['sneeze', 'slide', 'rear'][b.cycle % 3]); }
      } else if (b.act === 'sneeze') {
        b.vx = 0; b.pose = b.at < 0.9 ? 'ahh' : 'choo';
        if (b.first) { b.face(); K.say(g, b, 'AH... AHH...', '#cfefff'); }
        if (b.at > 0.9 && !b.fired) {
          b.fired = true; K.say(g, b, 'ACHÚÚ!', '#ffffff'); g.shake(4); Sound.play('kick', { pitch: 0.6 });
          const n = b.hp <= 2 ? 2 : 1;
          for (let k = 0; k < n; k++) g.spawn(new EcSnowball(g, b.cx + b.dir * (b.w / 2 + 14 + k * 30), b.y + b.h - 2, b.dir));
          g.burst(b.cx + b.dir * b.w / 2, b.y + 20, 14, '#ffffff', 'spark');
        }
        if (b.at > 1.6) { b.fired = false; b.go('walk'); }
      } else if (b.act === 'slide') {
        // tucks into his shell and skids across the ice, bouncing off the walls
        if (b.first) { b.face(); b.bounces = 0; b.bonkT = 0; }
        if (b.at < 0.5) { b.vx = 0; b.pose = 'tuck'; }
        else {
          b.pose = 'shell'; b.vx = b.dir * (6 + (b.hp <= 2 ? 1.5 : 0)) * TS;
          const atWall = b.hitWall || (b.dir < 0 && b.x <= b.arenaX0 + 2) || (b.dir > 0 && b.x >= b.arenaX1 - b.w - 2);
          if (atWall && b.at - b.bonkT > 0.3) { b.bonkT = b.at; b.dir = -b.dir; b.bounces++; g.shake(5); Sound.play('bump'); g.burst(b.cx - b.dir * b.w / 2, b.cy, 10, '#d8f4ff', 'debris'); if (b.bounces >= 2) b.go('peek'); }
        }
        if (b.at > 5) b.go('peek');
      } else if (b.act === 'peek') {
        b.vx = 0; b.pose = 'peek'; if (b.at > 0.7) b.go('walk');
      } else if (b.act === 'rear') {
        // he rears up to roar: his head is exposed
        b.vx = 0; b.pose = 'rear';
        if (b.first) { b.face(); K.say(g, b, '¡SOY EL REY DEL HIELO!', '#ffd84a'); }
        b.vuln = b.at > 0.25 && b.at < 1.7; b.guard = b.vuln ? 'hurt' : 'bounce';
        if (b.at > 1.7) b.go('slam');
      } else if (b.act === 'slam') {
        b.vx = 0; b.pose = 'slam';
        if (b.first) {
          g.shake(10); Sound.play('stomp', { pitch: 0.4 });
          for (const d of [-1, 1]) g.spawn(new EcQuake(g, b.cx + d * (b.w / 2 + 14), b.floorY, d));
          for (let k = 0; k < 4 + (b.hp <= 2 ? 2 : 0); k++) tourFire(g, b.arenaX0 + TS * 2 + Math.random() * (b.arenaX1 - b.arenaX0 - 4 * TS), b.floorY - 10 * TS - Math.random() * 2 * TS, { kind: 'icicle', vy: 2 * TS, grav: PHYS.gDown * 0.5, w: 12, h: 20, life: 3, thru: true, col: '#d8f4ff', art: (ctx, s) => { ctx.fillStyle = '#d8f4ff'; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + s.w, s.y); ctx.lineTo(s.cx, s.y + s.h); ctx.fill(); } });
        }
        if (b.at > 0.9) b.go('walk');
      }
      b.fall(dt);
    },
    hurt(b) { b.go('walk'); b.vx = 0; K.say(b.g, b, pick(['¡MI CABEZA!', 'HMPH! RUDE!', 'TOO... FAST...']), '#ffd84a'); b.g.burst(b.cx, b.y, 20, '#d8f4ff', 'confetti'); },
    draw(b, ctx, t) {
      const x = b.cx, y = b.y + b.h, d = b.dir, P = b.pose, inShell = P === 'shell' || P === 'tuck';
      ctx.save(); ctx.translate(x, y);
      if (P === 'rear') { ctx.translate(-d * 34, 0); ctx.rotate(-d * 0.5); ctx.translate(d * 34, 0); }
      if (P === 'shell') ctx.rotate(Math.sin(t * 40) * 0.04);
      if (P === 'slam' && b.at < 0.2) ctx.scale(1.08, 0.9);
      // legs
      if (!inShell) { ctx.fillStyle = '#7a7a5a'; for (const lx of [-30, -14, 14, 30]) { rr(ctx, lx - 7, -15, 14, 15, 5); ctx.fill(); } }
      // the head on its long neck, with a striped scarf
      if (!inShell) {
        const hx = d * (P === 'peek' ? 34 : P === 'rear' ? 46 : 44), hy = P === 'ahh' ? -40 : P === 'peek' ? -24 : -30 + Math.sin(t * 2) * 2;
        ctx.strokeStyle = '#8a8a6a'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(d * 24, -22); ctx.lineTo(hx - d * 6, hy + 4); ctx.stroke(); ctx.lineCap = 'butt';
        for (let k = 0; k < 4; k++) { ctx.fillStyle = WOVEN[k]; ctx.beginPath(); ctx.arc(d * (26 + k * 3), -24 - k * 2, 6.5, 0, TAU); ctx.fill(); }
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(P === 'ahh' ? -d * 0.4 : P === 'choo' ? d * 0.3 : 0);
        ctx.fillStyle = '#9a9a7a'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 10, 0, 0, TAU); ctx.fill();
        if (P === 'ahh') { ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(d * 3, -3, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a2a2a'; ctx.beginPath(); ctx.ellipse(d * 9, 4, 3, 4, 0, 0, TAU); ctx.fill(); }
        else if (P === 'choo') { ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(d * 1, -4); ctx.lineTo(d * 6, -2); ctx.stroke(); }
        else { K.eyes(ctx, d * 4, -3, d, 3, 2.6, true); ctx.strokeStyle = '#3a3a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(d * 2, 5); ctx.lineTo(d * 11, 4); ctx.stroke(); }
        ctx.restore();
      }
      // the shell
      const sg = ctx.createLinearGradient(0, -60, 0, -10); sg.addColorStop(0, '#7a9a5a'); sg.addColorStop(1, '#3a5a2a');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(0, -16, 42, 40, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c8b878'; ctx.fillRect(-42, -18, 84, 6);
      ctx.strokeStyle = '#2a3a1a'; ctx.lineWidth = 2;
      for (const [cx, cy] of [[0, -40], [-22, -30], [22, -30]]) { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * TAU / 6; ctx.lineTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 8); } ctx.closePath(); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(-12, -50, 14, 4, -0.2, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
};

/* ---------------- music: Andean panpipes and charango; a marimba for the islands ---------------- */
const tracks = {
  tour_ec: {
    bpm: 126, bars: 8, rv: 0.3, dl: 0.12, hx: 0.08,
    ch: 'Am G C E Am G E Am',
    ld: 'E5:2 A5:2 C6:2 B5:2 A5:4 E5:4 | D5:2 G5:2 B5:4 A5:2 G5:2 D5:4 | E5:2 G5:2 C6:4 E6:4 C6:4 | B5:2 G#5:2 E5:4 B5:8 |' +
        'A5:2 C6:2 E6:4 D6:2 C6:2 A5:4 | G5:2 B5:2 D6:4 B5:4 G5:4 | E5:2 G#5:2 B5:4 D6:2 B5:2 G#5:4 | A5:12 .:4',
    li: 'whistle', lv: 0.15,
    bp: 'r...r.r.r...o...', bi: 'pluckb', bv: 0.28,
    ap: '0.2.1.3.0.2.1.3.', ai: 'pluck', av: 0.05, ao: 64,
    dr: ['d.......d.d.....', '....t.......t...', 'n.n.n.n.n.n.n.n.'], dv: 0.42
  },
  tour_ec_night: {
    bpm: 96, bars: 8, rv: 0.55, dl: 0.2,
    ch: 'Em D C B7 Em D C B7',
    ld: 'B4:4 E5:4 G5:4 F#5:4 | E5:8 D5:8 | C5:4 E5:4 G5:4 A5:4 | B5:12 .:4 | E6:4 D6:4 B5:4 G5:4 | A5:8 F#5:8 | G5:4 E5:4 C5:4 E5:4 | D#5:12 .:4',
    li: 'tri', lv: 0.12,
    bp: 'r.......f.......', bi: 'sub', bv: 0.24,
    ap: '0..2..1..3..0..2', ai: 'mbox', av: 0.04, ao: 68,
    dr: ['d.......d.......', '....u.......u...', '..v...v...v...v.'], dv: 0.3
  },
  tour_ec_deep: {
    bpm: 88, bars: 8, rv: 0.6, dl: 0.25,
    ch: 'Dmaj7 Bm7 Gmaj7 A Dmaj7 Bm7 Gmaj7 A',
    ld: 'F#5:6 A5:2 C#6:8 | B5:4 A5:4 F#5:8 | G5:4 B5:4 D6:4 B5:4 | A5:12 .:4 | D6:6 C#6:2 A5:8 | F#5:4 A5:4 B5:8 | G5:4 F#5:4 E5:4 D5:4 | E5:12 .:4',
    li: 'vibes', lv: 0.14,
    bp: 'r.......r...f...', bi: 'sub', bv: 0.24,
    ap: '0.2.4.1.3.5.2.4.', ai: 'mbox', av: 0.035, ao: 72,
    dr: ['u.....u..u......', '...u.......u..u.'], dv: 0.3
  },
  tour_ec_boss: {
    bpm: 150, bars: 8, rv: 0.2, hx: 0.08,
    ch: 'Em Em C D Em Em C B7',
    ld: 'E5:2 G5:2 B5:2 E6:2 D6:4 B5:4 | G5:2 B5:2 E6:4 F#6:8 | E6:2 C6:2 G5:2 C6:2 E6:4 C6:4 | D6:4 F#6:4 A6:8 |' +
        'G6:2 F#6:2 E6:2 D6:2 B5:4 G5:4 | E5:2 G5:2 B5:4 E6:8 | C6:2 E6:2 G6:4 E6:4 C6:4 | B5:12 D#6:4',
    li: 'whistle', lv: 0.16,
    bp: 'r.r.r.o.r.r.r.f.', bi: 'sawb', bv: 0.28,
    ap: 'c-..c-..c-..c-..', ai: 'pluck', av: 0.05, ao: 60,
    dr: ['d...d...d.d.d...', '....t.......t...', 'n.n.n.n.n.n.n.n.', 'x...............'], dv: 0.45
  }
};

/* ---------------- the five levels ---------------- */
Tour.country({
  id: 'ec', colors: COL, tagline: 'The middle of the world, the Andes and the Galápagos',
  themes, painters, dyn, decor, decorLights, platforms, enemies, entities, pieces: P, boss, power, tracks,
  music: { level: 'tour_ec', boss: 'tour_ec_boss' },
  landmark: 'the Equator monument',
  arrival: 'Brady! The Baron wants the Equator monument, globe and all. I\'m riding along in his snack crate. ♥ C',
  coin: { name: 'CACAO BEAN', draw(ctx, x, y) {
    ctx.fillStyle = '#c8901a'; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7a3a1a'; ctx.beginPath(); ctx.ellipse(x, y, 5.5, 7.5, 0.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c8642a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 2, y - 6); ctx.quadraticCurveTo(x + 2, y, x - 1, y + 6); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 3, y - 4, 1.5, 3);
  } },
  star: { name: 'GOLDEN TORTOISE', draw(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y + 3); ctx.scale(Math.cos(t * 3) > 0 ? 1 : -1, 1);
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.ellipse(0, -2, 11, 8, 0, Math.PI, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(12, -3, 4, 0, TAU); ctx.fill();
    for (const lx of [-8, 6]) ctx.fillRect(lx - 2, -2, 4, 4);
    ctx.strokeStyle = '#c8901a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, -4, 4, 0, TAU); ctx.stroke();
    ctx.restore();
  } },
  levels: [
    { name: 'Middle of the World', style: 'run', theme: 'ec_equator', gimmick: 'The equator line\'s low-gravity bubbles, banana-leaf platforms and rolling cacao pods; a booby lends its blue boots',
      enemies: [['ecBanana', 3], ['ecCacao', 2], ['ecAlpaca', 1]],
      hint: 'On the equator line every jump floats. The blue boots bounce extra high!',
      postcard: 'Standing on the equator! Half of me is in the north, half in the south, all of me misses you. ♥ C',
      script: ['booby', ['flat', { n: 4 }], ['equator', { gold: true }], 'bananas', 'gap', 'cacao', 'cp', 'terraces', ['equator', { w: 10 }], ['enemies', { n: 2 }], 'bonus', ['bananas', { n: 2 }], 'end'] },
    { name: 'Cable Car Climb', style: 'ride', theme: 'ec_andes', gimmick: 'Ride an open gondola up the Andes: duck the tower arms, hop the snowy ridges, dodge swooping condors',
      enemies: [['ecCondor', 1]], vehicle: 'ecGondola', vehicleW: 6, deck: 10, below: 'none', scroll: 2.4, len: 170,
      hint: 'Tower arms come at head height: duck (or hop) them!',
      postcard: 'The Baron\'s blimp is heading for the jungle. Bring bug spray. ♥ C',
      script: ['tower', 'condors', 'ridge', ['catwalk', { gold: true }], 'tower', 'condors', ['ridge', { w: 2 }], 'tower', 'catwalk', 'condors', 'tower', 'ridge', ['catwalk', { gold: true }], 'tower', 'condors', ['ridge', { w: 2 }]] },
    { name: 'Amazon Canopy', style: 'night', theme: 'ec_amazon', gimmick: 'Swing on vines across the dark canopy and hop sinking giant lily pads, lit by glowing frogs and mushrooms',
      enemies: [['ecFrog', 3]], dark: true,
      hint: 'Ride the swinging vines across the gaps',
      postcard: 'The jungle at night GLOWS. A frog winked at me. I think. ♥ C',
      script: [['glow', { n: 8 }], 'vines', ['branches', { gold: true }], ['glow', { n: 7, frogs: true }], 'lilies', ['vines', { n: 2, gold: true }], 'cp', ['glow', { n: 6 }], 'branches', ['lilies', { n: 4 }], ['vines', { n: 2 }], 'oneup', ['glow', { n: 8, frogs: true }], 'end'] },
    { name: 'Galápagos Snorkel', style: 'swim', theme: 'ec_galapagos', gimmick: 'Snorkel a sunlit sea: lava-rock arches, puffers that puff up, penguins in a current and a tidal surge',
      enemies: [['ecSeaLion', 1]], H: 18, width: 240,
      hint: 'Tap jump to swim. Puffers puff up when you get close!',
      postcard: 'A sea lion stole my sunglasses and gave them back. Islands are magic. ♥ C',
      script: ['surface', ['arches', { gold: true }], 'puffers', ['penguins', { w: 12 }], 'iguanas', 'surge', 'grotto', 'arches', 'puffers', 'surge', ['penguins', { w: 10, dir: -1 }], 'iguanas', 'arches'] },
    { name: 'Ice Fort of Cotopaxi', style: 'castle', theme: 'ec_cotopaxi', gimmick: 'Slippery ice, dropping icicles and sinking ice floes, then El Tortugón',
      enemies: [['ecAlpaca', 1], ['ecIceCube', 3]], boss: 'ec_tortoise', arena: 'icecave', arenaW: 26, roof: false,
      hint: 'El Tortugón\'s shell is too hard. Stomp his head when he rears up!',
      postcard: 'The Equator monument is back where it belongs! The Baron flew to Brazil. Samba time! ♥ C',
      script: [['ice', { n: 12 }], 'floes', ['enemies', { n: 2 }], 'cp', ['ice', { n: 14 }], ['pillars', { n: 3 }], ['blocks', { content: 'power' }], 'arena'] }
  ]
});
})();
