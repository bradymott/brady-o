/* ============================================================
   ECUADOR & THE GALÁPAGOS (world 2)
   2-1 Middle of the World   run    low-gravity equator bubbles, banana plants, rolling cacao pods
   2-2 Cable Car Climb       ride   ride a gondola up the Andes: hop the cable junctions, dodge condors
   2-3 Amazon Canopy         night  swing on vines across the dark canopy; glowing frogs and mushrooms
   2-4 Galápagos Snorkel     swim   sea lions, puffers and penguins among lava-rock arches
   2-5 Ice Fort of Cotopaxi  castle slippery ice, falling icicles; boss El Tortugón
   ============================================================ */
(() => {
const COL = { a: '#ffd23a', b: '#2a6ad8', c: '#e8323a' };
const K = TourKit;
const WOVEN = ['#e8323a', '#ffd23a', '#2a6ad8', '#2aa85a', '#ff7a2a', '#8a3ab8'];
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };

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
  // banana plants along the plantation
  ecBananas(ctx, L, rng, H) {
    for (let x = 10; x < BG_W; x += 44 + rng() * 30) wrapDraw(x, 60, xx => {
      const h = 70 + rng() * 40;
      ctx.fillStyle = shade(L.color, -0.35); ctx.fillRect(xx - 3, L.base - h, 6, h);
      for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.5; ctx.fillStyle = shade(L.color, (k % 2) * 0.12); ctx.save(); ctx.translate(xx, L.base - h); ctx.rotate(a + Math.PI / 2); ctx.beginPath(); ctx.ellipse(0, -28, 9, 30, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = '#e8d84a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(xx + 6 + k * 2, L.base - h + 18 + k * 5, 2.5, 6, 0.4, 0, TAU); ctx.fill(); }
    });
  },
  // the dark rainforest canopy with hanging vines
  ecCanopy(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let x = 0; x < BG_W; x += 30 + rng() * 30) wrapDraw(x, 80, xx => { ctx.fillStyle = shade(L.color, rng() * 0.15); ctx.beginPath(); ctx.arc(xx, L.base, 30 + rng() * 40, Math.PI, TAU); ctx.fill(); });
    for (let x = 0; x < BG_W; x += 18 + rng() * 26) { ctx.strokeStyle = shade(L.color, 0.2); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 10, (L.base - 40) / 2, x + Math.sin(x) * 8, L.base - 20 - rng() * 120); ctx.stroke(); }
  },
  // volcanic islands on the horizon
  ecIslands(ctx, L, rng, H) {
    for (const [x, w, h] of [[120, 260, 70], [520, 180, 50], [800, 220, 90]]) wrapDraw(x, w, xx => { ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(xx, L.base); ctx.quadraticCurveTo(xx + w * 0.3, L.base - h, xx + w * 0.5, L.base - h); ctx.quadraticCurveTo(xx + w * 0.7, L.base - h, xx + w, L.base); ctx.fill(); });
    ctx.fillStyle = vgrad(ctx, L.base, H, '#3ac8e8', '#1a6ab8'); ctx.fillRect(0, L.base, BG_W, H - L.base);
  }
};
const dyn = {
  // cable-car lines strung across the sky
  ecCables(ctx, L, camX, oy, S, W, t) {
    ctx.strokeStyle = 'rgba(40,40,50,0.6)'; ctx.lineWidth = 1.4 * S;
    for (let k = 0; k < 2; k++) { const y0 = oy + (90 + k * 26) * S; ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(W, y0 - 60 * S); ctx.stroke(); }
    for (let i = 0; i < 3; i++) { const x = ((i * 380 + t * 20 - camX * L.f) % BG_W + BG_W) % BG_W * S, y = oy + 90 * S - x / W * 60 * S; ctx.fillStyle = ['#e8323a', '#ffd23a', '#2a6ad8'][i]; ctx.fillRect(x - 10 * S, y + 4 * S, 20 * S, 14 * S); ctx.fillStyle = 'rgba(200,230,255,0.8)'; ctx.fillRect(x - 7 * S, y + 7 * S, 14 * S, 6 * S); }
  }
};

/* ---------------- tiles ---------------- */
const andesGround = { style: 'grass', cap: '#5ab84a', capHi: '#a8e86a', dirt: '#8a5a3a', dirt2: '#5a3a24', rock: '#a87a5a' };
function wovenBlock(ctx, th, f) {
  ctx.save(); ctx.shadowColor = 'rgba(255,220,120,0.8)'; ctx.shadowBlur = 4 + f * 1.5;
  ctx.fillStyle = WOVEN[0]; rr(ctx, 1, 2, TS - 2, TS - 3, 3); ctx.fill(); ctx.restore();
  ctx.save(); rr(ctx, 1, 2, TS - 2, TS - 3, 3); ctx.clip();
  for (let r = 0; r < 7; r++) { ctx.fillStyle = WOVEN[r % 6]; ctx.fillRect(1, 2 + r * 4.4, TS - 2, 4.4); }
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; for (let r = 1; r < 7; r += 2) for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(4 + k * 7, 4 + r * 4.4); ctx.lineTo(7.5 + k * 7, 2 + r * 4.4); ctx.lineTo(11 + k * 7, 4 + r * 4.4); ctx.lineTo(7.5 + k * 7, 6 + r * 4.4); ctx.fill(); }
  const sx = -8 + f * 12; ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + 5, 0); ctx.lineTo(sx - 5, TS); ctx.lineTo(sx - 10, TS); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#5a1a1a'; ctx.lineWidth = 1.2; rr(ctx, 1, 2, TS - 2, TS - 3, 3); ctx.stroke();
}
function wovenUsed(ctx) { ctx.fillStyle = '#a89078'; rr(ctx, 1, 3, TS - 2, TS - 4, 3); ctx.fill(); ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let r = 0; r < 6; r++) ctx.fillRect(2, 5 + r * 4.4, TS - 4, 1.4); }
const base = {
  ground: andesGround, brick: { style: 'stone', c1: '#b8a890', c2: '#8a7a64', mortar: '#5a4a3a' }, hard: { c1: '#a8987e', c2: '#6a5a48' },
  semi: { style: 'log', c1: '#7a5230', c2: '#4a301a' }, pillar: { c1: '#8a7a64', c2: '#5a4a3a', cap: '#c8b898', style: 'column' },
  accent: COL.a, qblockArt: wovenBlock, usedArt: wovenUsed, tint: {}, bloom: 0.15
};
const themes = {
  ec_equator: Object.assign({}, base, {
    name: 'Middle of the World', music: 'tour_ec', particles: 'leaves',
    sky: ['#2a8ae8', '#8ad0ff', '#f0fff0'], horizonGlow: '#e8ffd8',
    celestial: { type: 'sun', x: 0.5, y: 0.12, r: 40, color: '#fffbe0', glow: '#ffe8a0' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'mountains', color: '#8aa0c8', base: 290, amp: 150, f: 0.03, blur: true, snow: true }, { kind: 'ecAndes', color: '#4a9a4a', base: 360, f: 0.1 }, { kind: 'ecBananas', color: '#3a8a3a', base: 440, f: 0.35 }],
    fog: '#e8fff0', decor: ['ecAgave', 'ecFlowers', 'ecAgave']
  }),
  ec_andes: Object.assign({}, base, {
    name: 'The Andes', music: 'tour_ec', particles: 'dust',
    sky: ['#3a7ad8', '#a8d0ff', '#ffffff'], horizonGlow: '#ffffff',
    celestial: { type: 'sun', x: 0.25, y: 0.18, r: 34, color: '#fffbe8', glow: '#ffffff' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'mountains', color: '#9ab0d8', base: 300, amp: 170, f: 0.03, blur: true, snow: true, dyn: 'ecCables' }, { kind: 'clouds', color: '#ffffff', base: 360, f: 0.1 }, { kind: 'ecAndes', color: '#5aa85a', base: 420, f: 0.2 }],
    fog: '#ffffff', liquid: 'sea'
  }),
  ec_amazon: Object.assign({}, base, {
    name: 'Amazon Canopy', music: 'tour_ec_night', particles: 'fireflies', ground: { style: 'grass', cap: '#2a7a3a', capHi: '#5ab86a', dirt: '#3a2a1a', dirt2: '#1a120a', rock: '#4a3a2a' },
    sky: ['#06120e', '#0e2a1e', '#1a3a2a'], horizonGlow: '#3a8a5a',
    celestial: { type: 'moon', x: 0.8, y: 0.15, r: 24, color: '#f8fff0', glow: '#b8ffd0' }, stars: 0.6,
    layers: [{ kind: 'ecCanopy', color: '#0e2a1a', base: 300, f: 0.08 }, { kind: 'ecCanopy', color: '#081a10', base: 400, f: 0.25 }],
    fog: '#3a8a6a', darkness: 0.55, liquid: 'canal', semi: { style: 'log', c1: '#5a4028', c2: '#3a2818' }
  }),
  ec_galapagos: Object.assign({}, base, {
    name: 'Galápagos', music: 'tour_ec_deep', particles: 'bubbles', underwater: true,
    sky: ['#3ad8f0', '#1a8ac8', '#0a3a7a'], horizonGlow: '#8affff', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'rocks', color: '#0e4a6a', base: 330, amp: 60, f: 0.08 }, { kind: 'kelp', color: '#0a5a5a', base: 400, f: 0.2 }],
    fog: '#5ae8ff', ground: { style: 'basalt', cap: '#3a3a44', capHi: '#6a6a78', dirt: '#2a2a32', dirt2: '#14141a', rock: '#4a4a56' }, hard: { c1: '#4a4a56', c2: '#22222a' }
  }),
  ec_cotopaxi: Object.assign({}, base, {
    name: 'Ice Fort', music: 'tour_ec', particles: 'snow', ground: { style: 'snow', cap: '#f0f8ff', capHi: '#ffffff', dirt: '#6a8aaa', dirt2: '#3a5a7a', rock: '#8aa8c8' },
    sky: ['#3a5a9a', '#9ac0f0', '#e8f4ff'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.75, y: 0.2, r: 30, color: '#ffffff', glow: '#d8f0ff' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'mountains', color: '#b8c8e8', base: 300, amp: 190, f: 0.03, snow: true }, { kind: 'pines', color: '#4a6a8a', base: 420, f: 0.2, snow: true }],
    fog: '#e8f4ff', hard: { c1: '#c8e0f8', c2: '#7aa0c8' }, brick: { style: 'ice', c1: '#9fdcff', c2: '#5aa6d6', mortar: '#e6f8ff' }, semi: { style: 'ice', c1: '#c8f0ff', c2: '#7ab8dc' }
  })
};

/* ---------------- decor ---------------- */
const decor = {
  ecAgave(ctx, x, y) { ctx.fillStyle = '#7aa87a'; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + k * 6, y - 22 + Math.abs(k) * 4); ctx.lineTo(x + 2, y); ctx.fill(); } },
  ecFlowers(ctx, x, y) { for (let k = 0; k < 5; k++) { ctx.fillStyle = WOVEN[k]; ctx.beginPath(); ctx.arc(x - 8 + k * 4, y - 5 - (k % 2) * 3, 2.6, 0, TAU); ctx.fill(); } ctx.fillStyle = '#4a8a3a'; ctx.fillRect(x - 9, y - 3, 18, 3); },
  // the painted equator line across the ground
  ecLine(ctx, x, y, t, th, d) { ctx.fillStyle = '#e8323a'; ctx.fillRect(x - d.w / 2, y - 3, d.w, 3); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - d.w / 2, y - 6, d.w, 3); ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('0°00\'00"', x, y - 10); },
  // a shimmering low-gravity bubble
  ecBubble(ctx, x, y, t, th, d) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, y - d.h, 0, y); g.addColorStop(0, 'rgba(160,220,255,0)'); g.addColorStop(1, 'rgba(160,220,255,0.18)'); ctx.fillStyle = g; ctx.fillRect(x - d.w / 2, y - d.h, d.w, d.h); for (let k = 0; k < 8; k++) { const ph = (t * 0.4 + k / 8) % 1; ctx.fillStyle = `rgba(220,240,255,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x - d.w / 2 + ((k * 37) % d.w), y - ph * d.h, 2 + (k % 3), 0, TAU); ctx.fill(); } ctx.restore(); },
  ecMushroom(ctx, x, y, t) { for (const [dx, s] of [[-6, 1], [4, 0.7]]) { ctx.fillStyle = '#e8fff0'; ctx.fillRect(x + dx - 1.5 * s, y - 10 * s, 3 * s, 10 * s); ctx.fillStyle = `rgba(90,255,180,${0.7 + 0.3 * Math.sin(t * 2 + dx)})`; ctx.beginPath(); ctx.ellipse(x + dx, y - 10 * s, 7 * s, 4 * s, 0, Math.PI, TAU); ctx.fill(); } },
  ecPylon(ctx, x, y) { ctx.strokeStyle = '#5a5a6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 14, y + 200); ctx.lineTo(x - 3, y - 30); ctx.lineTo(x + 3, y - 30); ctx.lineTo(x + 14, y + 200); ctx.stroke(); ctx.lineWidth = 1.2; for (let k = 0; k < 10; k++) { ctx.beginPath(); ctx.moveTo(x - 4 - k, y - 20 + k * 20); ctx.lineTo(x + 4 + k, y - 10 + k * 20); ctx.stroke(); } },
  ecJunction(ctx, x, y) { ctx.fillStyle = '#3a3a48'; rr(ctx, x - 14, y - 30, 28, 28, 4); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 10, y - 12, 20, 4); ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 200, y - 34); ctx.lineTo(x + 200, y - 34); ctx.stroke(); },
  ecArch(ctx, x, y, t, th, d) { ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.moveTo(x - d.w / 2, y); ctx.lineTo(x - d.w / 2, y - d.h); ctx.lineTo(x + d.w / 2, y - d.h); ctx.lineTo(x + d.w / 2, y); ctx.lineTo(x + d.w / 2 - 20, y); ctx.quadraticCurveTo(x, y - d.h * 0.8, x - d.w / 2 + 20, y); ctx.fill(); }
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
  ctx.fillStyle = '#c8642a'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 9, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#8a3a1a'; ctx.lineWidth = 1.2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(k * 4, 0, 1.5, 8, 0, 0, TAU); ctx.stroke(); }
  if (m !== 'roll' && m !== 'curl' && m !== 'flat' && m !== 'ko') K.eyes(ctx, 3 * e.dir, -2, e.dir, 2.4, 1.8, false);
  ctx.restore();
};
const alpacaArt = (ctx, e, x, y, m, t) => {
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
  ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-16, -10 - f * 10, -30, -4 - f * 12); ctx.lineTo(-24, 2); ctx.lineTo(-30, 4); ctx.lineTo(-6, 4); ctx.fill();
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
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  ctx.fillStyle = '#8a6a5a'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 7, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-22, -6); ctx.lineTo(-22, 6); ctx.fill();
  ctx.beginPath(); ctx.arc(14, -3, 6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.ellipse(2, 5, 6, 2.5, 0.4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(16, -5, 1.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(20, -2, 1.3, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#c8b8a8'; ctx.lineWidth = 0.8; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(19, -1); ctx.lineTo(24, -1 + s * 2); ctx.stroke(); }
  ctx.restore();
};
const pufferArt = (ctx, e, x, y, m) => {
  const puff = TourKit.near(e, e.g.player, 3, 2) ? 1 : 0; e.cfg.spiky = !!puff;
  const r = 8 + puff * 5;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#f2d86a'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  if (puff) { ctx.strokeStyle = '#c8a03a'; ctx.lineWidth = 1.5; for (let k = 0; k < 12; k++) { const a = k * TAU / 12; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * (r + 4), Math.sin(a) * (r + 4)); ctx.stroke(); } }
  ctx.fillStyle = 'rgba(160,120,40,0.4)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(-4 + k * 2, -3 + (k % 2) * 4, 1.4, 0, TAU); ctx.fill(); }
  K.eyes(ctx, (e.dir || 1) * 3, -2, e.dir || 1, 2.4, 2, false);
  ctx.restore();
};
const penguinArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.rotate(Math.PI / 2 * 0.9);
  ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 13, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(1.5, 2, 4.5, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(1, -9, 1.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffb81a'; ctx.beginPath(); ctx.moveTo(-1, -13); ctx.lineTo(1, -18); ctx.lineTo(3, -13); ctx.fill();
  ctx.restore();
};
const enemies = {
  ecBanana: { cls: TourEnemy.make({ w: 16, h: 32, speed: 1.0, behavior: 'walk', art: bananaArt, burst: '#ffe04a' }), place: 'walk' },
  ecCacao: { cls: TourEnemy.make({ w: 24, h: 18, speed: 0.8, behavior: 'roll', range: 9, rollSpeed: 6.4, art: cacaoArt, burst: '#c8642a' }), place: 'walk' },
  ecAlpaca: { cls: TourEnemy.make({ w: 26, h: 46, speed: 0.5, behavior: 'throw', every: 2.4, range: 10, pace: true, hp: 2, art: alpacaArt, onNotice: null, shoot: (e, p) => {
    tourFire(e.g, e.cx + e.dir * 14, e.y + 6, { kind: 'spit', vx: e.dir * 4.5 * TS, vy: -4 * TS, grav: PHYS.gDown * 0.35, w: 10, h: 10, life: 3, col: '#c8e8f0', art: (ctx, s) => { ctx.fillStyle = 'rgba(220,240,250,0.9)'; ctx.beginPath(); ctx.arc(s.cx, s.cy, 4, 0, TAU); ctx.arc(s.cx - 3, s.cy + 2, 2.5, 0, TAU); ctx.fill(); } });
    K.say(e.g, e, 'PTOO!', '#ffffff'); TourKit.sfx('splat', null, { pitch: 1.8, vol: 0.4 });
  } }), place: 'walk' },
  ecCondor: { cls: TourFlyer.make({ w: 34, h: 16, range: 4, speed: 0.6, swoop: true, art: condorArt }), place: 'fly' },
  ecFrog: { cls: TourEnemy.make({ w: 18, h: 16, speed: 1.0, behavior: 'hop', hopV: 10, hopEvery: 1.4, art: frogArt, glow: 'rgba(120,255,200,' }), place: 'walk' },
  ecSeaLion: { cls: TourSwimmer.make({ w: 36, h: 16, speed: 2.0, range: 5, art: seaLionArt }), place: 'swim' },
  ecPuffer: { cls: TourSwimmer.make({ w: 20, h: 20, speed: 0.8, range: 2, chase: false, art: pufferArt }), place: 'swim' },
  ecPenguin: { cls: TourSwimmer.make({ w: 26, h: 14, speed: 3.2, range: 6, chase: false, art: penguinArt }), place: 'swim' }
};
// a booby on the path: it hands Brady its blue boots
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
// a stalactite of ice that drops when Brady passes under it
class EcIcicle extends Ent {
  constructor(g, s) { super(g, s, 16, 26); this.hy = this.y; this.state = 'hang'; this.k = 0; }
  update(dt) {
    this.t += dt; const p = this.g.player;
    if (this.state === 'hang') { if (p && Math.abs(p.cx - this.cx) < 1.4 * TS && p.y > this.y) { this.state = 'shake'; this.k = 0.4; } }
    else if (this.state === 'shake') { this.k -= dt; if (this.k <= 0) { this.state = 'fall'; this.vy = 0; } }
    else if (this.state === 'fall') { this.vy += PHYS.gDown * 0.8 * dt; this.y += this.vy * dt; if (SOLID[tileAt(this.g.area, Math.floor(this.cx / TS), Math.floor((this.y + this.h) / TS))] || this.y > this.g.area.H * TS) { this.state = 'gone'; this.k = 3; this.g.burst(this.cx, this.y + this.h, 10, '#d8f4ff', 'debris'); Sound.play('break', { vol: 0.4 }); } }
    else if (this.state === 'gone') { this.k -= dt; if (this.k <= 0) { this.state = 'hang'; this.y = this.hy; } }
  }
  touchPlayer(p) { if (this.state === 'fall') p.hurt(this); }
  draw(ctx) { if (this.state === 'gone') return; const sx = this.state === 'shake' ? Math.sin(this.t * 60) * 1.5 : 0; ctx.fillStyle = '#d8f4ff'; ctx.beginPath(); ctx.moveTo(this.x + sx, this.y); ctx.lineTo(this.x + this.w + sx, this.y); ctx.lineTo(this.cx + sx, this.y + this.h); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(this.x + 4 + sx, this.y + 2, 2, 10); }
}
const entities = { ecBooby: TourFriend.make({ w: 26, h: 44, give: 'sig:boots', line: 'BLUE BOOTS! BOUNCY!', art: boobyArt }), ecIcicle: EcIcicle };

/* ---------------- the signature power-up: BLUE-FOOTED BOOBY BOOTS ---------------- */
function bootsIcon(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y + 2);
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 6, Math.sin(t * 6 + s) * 1.5); ctx.fillStyle = '#3ab8ff'; ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(3, -8); ctx.lineTo(4, 0); ctx.lineTo(9, 4); ctx.lineTo(-9, 4); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#1a7ac8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(-1, 1); ctx.moveTo(3, 4); ctx.lineTo(1, 1); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
const power = {
  id: 'boots', name: 'BOOBY BOOTS', country: 'ec', hint: 'MEGA-BOUNCY JUMPS · BIG LANDINGS MAKE A SHOCKWAVE', time: 0, cooldown: 0.3, jumpBoost: 1.3,
  icon: bootsIcon,
  update(p, dt, inp, g) {
    if (!p.onGround) { p._bootAir = true; p._bootV = Math.max(p._bootV || 0, p.vy); return; }
    if (p._bootAir) {
      p._bootAir = false;
      if ((p._bootV || 0) > 10 * TS) {
        // the shockwave: enemies close by get knocked out, those further away get dizzy
        g.shake(5); Sound.play('stomp', { pitch: 0.5 }); g.burst(p.cx, p.y + p.h, 18, '#8ad8ff', 'dust');
        g.spawn(new EcRing(g, p.cx, p.y + p.h));
        for (const e of g.entities) {
          if (!e.enemy || e.dead || e.remove || e.boss) continue;
          const d = Math.hypot(e.cx - p.cx, (e.y + e.h) - (p.y + p.h));
          if (d < 2.6 * TS && Math.abs((e.y + e.h) - (p.y + p.h)) < TS) { if (e.hit('bump', p)) g.addScore(200, e.cx, e.y); }
          else if (d < 4.5 * TS && e.stun) e.stun(2.2);
        }
      }
      p._bootV = 0;
    }
  },
  drawOn(p, ctx, t) { for (const s of [-1, 1]) { ctx.fillStyle = '#3ab8ff'; ctx.beginPath(); ctx.ellipse(p.cx + s * 5 + p.facing * 2, p.y + p.h - 2, 5, 2.5, 0, 0, TAU); ctx.fill(); } }
};
class EcRing extends Ent {
  constructor(g, x, y) { super(g, null, 10, 10); this.x = x; this.y = y; this.life = 0.45; }
  update(dt) { this.life -= dt; if (this.life <= 0) this.remove = true; }
  draw(ctx) { const k = 1 - this.life / 0.45; ctx.strokeStyle = `rgba(140,220,255,${1 - k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(this.x, this.y - 2, 10 + k * 130, 4 + k * 16, 0, 0, TAU); ctx.stroke(); }
}

/* ---------------- set pieces ---------------- */
const P = {
  // a blue-footed booby hands over its boots
  booby(st, o) { const x = st.x; st.floor(x, x + 8); st.spawn('ecBooby', x + 5, st.gy - 1, {}); st.decor('ecFlowers', x + 1); return x + 9; },
  // the equator line: a bubble of low gravity sends every jump floating up high
  equator(st, o) {
    const x = st.x, B = st.B, w = o.w || 10; st.floor(x, x + w + 1);
    B.prop('ecLine', x + 1, st.gy - 1, w, 1, 'none', {});
    B.prop('ecBubble', x + 1, st.gy - 10, w, 10, 'none', {});
    B.zone(x + 1, st.gy - 11, w, 11, 0, -58 * TS, 0, 'lowgrav');
    const top = st.gy - 9;
    for (let q = 2; q < w - 1; q += 4) st.semi(x + 1 + q, x + 2 + q, top + (q % 8 ? 2 : 0));
    st.coins(x + 2, x + w - 1, top - 2);
    if (o.gold) st.gold(x + Math.floor(w / 2) + 1, top - 3, 'must');
    return x + w + 2;
  },
  // banana plants: their big leaves are one-way platforms
  bananas(st, o) {
    const x = st.x, B = st.B, n = o.n || 3; st.floor(x, x + n * 5 + 1);
    for (let k = 0; k < n; k++) { const lx = x + 1 + k * 5, ly = st.gy - 3 - (k % 2) * 2; B.prop('ecPlant', lx, ly, 4, st.gy - ly, 'none', {}); for (let q = 0; q < 4; q++) { B.set(lx + q, ly, T.SEMI); B.setHide(lx + q, ly, 1); } st.coins(lx, lx + 3, ly - 2); }
    st.enemy('ecBanana', x + n * 5 - 1, st.gy);
    return x + n * 5 + 2;
  },
  // a hill of cacao trees: pods roll down at Brady
  cacao(st, o) {
    const x = st.x; st.floor(x, x + 3);
    for (let i = 0; i < 3; i++) st.floor(x + 4 + i * 3, x + 6 + i * 3, st.gy - 1 - i);
    const top = st.gy - 3; st.floor(x + 13, x + 22, top);
    st.enemy('ecCacao', x + 18, top); st.enemy('ecCacao', x + 21, top);
    st.coins(x + 13, x + 21, top - 3);
    st.gy = top; return x + 23;
  },
  // alpacas on stone terraces: they spit
  terraces(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 18);
    for (let i = 0; i < 3; i++) B.fill(x + 3 + i * 4, st.gy - 1 - i * 2, x + 18, st.gy - 1 - i * 2, T.HARD);
    st.enemy('ecAlpaca', x + 16, st.gy - 6, { edgeTurn: true });
    st.coins(x + 4, x + 9, st.gy - 5);
    st.block(x + 12, st.gy - 9, 'power');
    return x + 19;
  },
  // cable car: a junction box hangs over the line — hop it (or crouch under it if you're small)
  junction(st, o) {
    const x = st.x, B = st.B;
    B.set(x, st.deck - 2, T.HARD); B.setHide(x, st.deck - 2, 1);
    B.decorAt('ecJunction', x, st.deck - 1, 0);
    st.coins(x - 1, x + 1, st.deck - 4);
    return x + 6;
  },
  // a pylon: the line dips over it, so the junction comes low
  pylon(st, o) { const x = st.x; st.B.decorAt('ecPylon', x, st.deck + 1, 0); st.B.set(x, st.deck - 1, T.HARD); st.B.setHide(x, st.deck - 1, 1); st.arc(x - 1, x + 1, st.deck - 2, 1); return x + 6; },
  // condors ride the thermals beside the line
  condors(st, o) { const x = st.x; st.spawn('ecCondor', x + 4, st.deck - 6, { range: 4 }); st.coins(x + 1, x + 6, st.deck - 3); return x + 9; },
  // another gondola passing above: hop onto its roof for goodies
  gondola(st, o) {
    const x = st.x, B = st.B, gy = st.deck - 4;
    for (let q = 0; q < 4; q++) B.set(x + q, gy, T.SEMI);
    B.prop('ecGondolaStill', x, gy, 4, 2, 'none', {});
    st.coins(x, x + 3, gy - 2);
    if (o.gold) st.gold(x + 2, gy - 3, 'high');
    return x + 7;
  },
  // canopy: swinging vines across a gap in the treetops
  vines(st, o) {
    const x = st.x, B = st.B, n = o.n || 2; st.floor(x, x + 1);
    let xx = x + 2;
    for (let k = 0; k < n; k++) {
      const span = 6; st.pit(xx, xx + span - 1);
      const ax = xx + 3, ay = st.gy - 6, len = 4.6, amp = 0.75;
      st.spawn('mplat', ax, ay - 1, { pw: 2, swing: { len: len * TS, amp }, speed: 1.4, phase: k * 1.2, skin: 'ecVine' });
      for (let a = -amp; a <= amp + 0.001; a += amp / 6) { const gx = Math.floor((ax * TS + TS / 2 + Math.sin(a) * len * TS) / TS), gyy = Math.floor((ay * TS + Math.cos(a) * len * TS) / TS); for (const dx of [-1, 0]) B.ghosts.push([gx + dx, gyy]); }
      B.decorAt('ecVineTop', ax, ay, 0);
      st.coins(xx + 1, xx + span - 2, st.gy - 5);
      xx += span; st.floor(xx, xx + 1); xx += 2;
    }
    return xx;
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
  // Galápagos: a lava-rock arch to swim through
  arches(st, o) {
    const x = st.x, F = st.floorY;
    st.rock(x, 2, x + 7, 6); st.rock(x, F - 3, x + 1, F - 1); st.rock(x + 6, F - 3, x + 7, F - 1);
    st.B.decorAt('ecArch', x + 4, F, 0);
    st.coins(x + 2, x + 5, 10);
    st.spawn('ecSeaLion', x + 4, 10, { range: 3 });
    return x + 9;
  },
  // puffers guard a field of coins
  puffers(st, o) { const x = st.x; for (let k = 0; k < 3; k++) { st.spawn('ecPuffer', x + 2 + k * 4, 6 + (k % 2) * 4, {}); } st.coins(x + 1, x + 11, 8); return x + 13; },
  // penguins zip past in a current
  penguins(st, o) { const x = st.x, w = o.w || 12; st.B.zone(x, 4, w, 6, 2.2 * TS, 0, 0, 'current'); st.spawn('ecPenguin', x + 3, 6, {}); st.spawn('ecPenguin', x + 8, 8, {}); st.coins(x + 1, x + w - 2, 6); return x + w + 1; },
  // a hidden grotto with a postcard
  grotto(st, o) { const x = st.x, F = st.floorY; st.rock(x, 2, x + 6, F - 1); st.water(x + 2, 5, x + 4, 7); st.water(x + 3, 8, x + 3, F - 1); st.water(x, F - 1, x + 6, F - 1); st.gold(x + 3, 6, 'must'); return x + 7; },
  // ice: slippery floors with icicles overhead
  ice(st, o) {
    const x = st.x, B = st.B, n = o.n || 12; st.floor(x, x + n);
    for (let q = 1; q < n; q++) B.set(x + q, st.gy, T.ICE);
    for (let k = 0; k < 3; k++) st.spawn('ecIcicle', x + 3 + k * 4, st.gy - 7, {});
    st.coins(x + 2, x + n - 2, st.gy - 3);
    return x + n + 1;
  },
  // ice pillars over a freezing pit
  icepillars(st, o) { return Tour.pieces.pillars(st, { n: 3 }); },
  arena_icecave(st, o) {
    const B = st.B, { x0, w, GY } = o;
    for (let q = 2; q < w - 2; q++) B.set(x0 + q, GY, T.ICE);
    for (let q = 0; q < 3; q++) { B.set(x0 + 4 + q, GY - 4, T.SEMI); B.set(x0 + w - 7 + q, GY - 4, T.SEMI); }
  }
};
Object.assign(decor, {
  ecPlant(ctx, x, y, t, th, d) { const w = d.w, h = d.h; ctx.fillStyle = '#4a7a2a'; ctx.fillRect(x - 3, y - h + 8, 6, h - 8); ctx.fillStyle = '#5ab84a'; ctx.beginPath(); ctx.ellipse(x - w * 0.25, y - h + 4, w * 0.35, 6, -0.2, 0, TAU); ctx.ellipse(x + w * 0.25, y - h + 4, w * 0.35, 6, 0.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffe04a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(x + 4 + k * 2, y - h + 14 + k * 4, 2, 5, 0.3, 0, TAU); ctx.fill(); } },
  ecVineTop(ctx, x, y) { ctx.fillStyle = '#2a5a2a'; ctx.beginPath(); ctx.ellipse(x, y - 4, 40, 10, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a7a3a'; ctx.beginPath(); ctx.ellipse(x - 14, y - 8, 20, 7, -0.2, 0, TAU); ctx.fill(); },
  ecGondolaStill(ctx, x, y, t, th, d) { const w = d.w; ctx.strokeStyle = '#3a3a48'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - d.h - 80); ctx.lineTo(x, y - d.h); ctx.stroke(); ctx.fillStyle = '#2a6ad8'; rr(ctx, x - w / 2, y - d.h, w, d.h, 6); ctx.fill(); ctx.fillStyle = 'rgba(200,230,255,0.85)'; ctx.fillRect(x - w / 2 + 6, y - d.h + 8, w - 12, d.h * 0.4); }
});
const platforms = {
  // the cable-car cabin carrying Brady (its roof bar and the cable above)
  ecGondola(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w;
    ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w / 2, y - 80); ctx.lineTo(x + w / 2, y - 60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 400, y - 82); ctx.lineTo(x + w + 400, y - 82); ctx.stroke();
    ctx.fillStyle = '#c8282a'; rr(ctx, x - 4, y - 62, w + 8, 10, 4); ctx.fill();
    ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 2; for (const px of [x + 2, x + w - 2]) { ctx.beginPath(); ctx.moveTo(px, y - 52); ctx.lineTo(px, y); ctx.stroke(); }
    ctx.fillStyle = '#e8323a'; rr(ctx, x - 6, y, w + 12, 22, 6); ctx.fill();
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 6, y + 8, w + 12, 3);
    PlatformArt.deck(ctx, x - 6, y - 2, w + 12, '#d8d8e0');
  },
  ecVine(ctx, p, t) {
    const ax = p.ancX, ay = p.ancY;
    ctx.strokeStyle = '#3a6a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + p.x + p.w / 2) / 2 + 6, (ay + p.y) / 2, p.x + p.w / 2, p.y); ctx.stroke();
    ctx.fillStyle = '#5ab84a'; for (let k = 1; k < 5; k++) { const kx = lerp(ax, p.x + p.w / 2, k / 5), ky = lerp(ay, p.y, k / 5); ctx.beginPath(); ctx.ellipse(kx + 4, ky, 4, 2, 0.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#6a4a2a'; rr(ctx, p.x, p.y, p.w, 8, 4); ctx.fill();
  }
};

/* ---------------- the boss: EL TORTUGÓN ---------------- */
// A giant grumpy tortoise in the Baron's pay. It shell-spins across the ice cave; when it
// bonks a wall it flips onto its back (stomp its belly!). It also stomps to drop icicles.
const boss = {
  id: 'ec_tortoise', name: 'El Tortugón', hp: 4, dims: [84, 58], music: 'tour_ec_boss',
  brain: {
    guardText: 'SHELL!',
    wake(b) { say(b.g, b, 'SLOW... BUT... GRUMPY!', '#ffd84a'); },
    update(b, dt) {
      const g = b.g; b.guard = 'bounce';
      if (b.act === 'walk') { b.face(); b.walk(0.8); b.pose = 'walk'; if (b.at > 1.6) { b.cycle++; b.go(b.cycle % 2 ? 'spin' : 'quake'); } }
      else if (b.act === 'spin') {
        if (b.at < 0.7) { b.vx = 0; b.pose = 'tuck'; }
        else { b.walk(6.5); b.pose = 'spin'; if (b.hitWall || b.x <= b.arenaX0 + 1 || b.x >= b.arenaX1 - b.w - 1) { g.shake(8); Sound.play('bump'); b.go('flipped'); } }
        if (b.at > 4) b.go('walk');
      }
      else if (b.act === 'flipped') { b.vx = 0; b.pose = 'flipped'; b.vuln = true; b.guard = 'hurt'; if (b.at > 2.4) b.go('walk'); }
      else if (b.act === 'quake') {
        if (b.first) { b.vy = -12 * TS; b.vx = 0; }
        b.pose = 'rear';
        if (b.onGround && b.at > 0.3) { g.shake(9); Sound.play('stomp', { pitch: 0.45 }); for (let k = 0; k < 5; k++) tourFire(g, b.arenaX0 + TS * 2 + Math.random() * (b.arenaX1 - b.arenaX0 - 4 * TS), b.floorY - 10 * TS, { kind: 'icicle', vy: 2 * TS, grav: PHYS.gDown * 0.5, w: 12, h: 20, life: 3, thru: true, col: '#d8f4ff', art: (ctx, s) => { ctx.fillStyle = '#d8f4ff'; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + s.w, s.y); ctx.lineTo(s.cx, s.y + s.h); ctx.fill(); } }); b.go('walk'); }
      }
      b.fall(dt);
    },
    hurt(b) { b.go('walk'); b.vx = -b.dir * 4 * TS; say(b.g, b, pick(['MY BELLY!', 'HMPH!', 'TOO FAST!']), '#ffd84a'); },
    draw(b, ctx, t) {
      const x = b.cx, y = b.y + b.h, d = b.dir, spin = b.pose === 'spin', flip = b.pose === 'flipped';
      ctx.save(); ctx.translate(x, y);
      if (spin) { ctx.translate(0, -28); ctx.rotate(t * 16 * d); ctx.translate(0, 28); }
      if (flip) { ctx.translate(0, -30); ctx.scale(1, -1); ctx.translate(0, -30); }
      // legs and head (tucked in while spinning)
      if (!spin) {
        ctx.fillStyle = '#7a7a5a'; for (const lx of [-30, -14, 14, 30]) rr(ctx, lx - 6, -14, 12, 14, 5), ctx.fill();
        ctx.save(); ctx.translate(d * (b.pose === 'tuck' ? 30 : 42), -26 + Math.sin(t * 2) * 2); ctx.fillStyle = '#8a8a6a'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 10, 0, 0, TAU); ctx.fill();
        if (!flip) { K.eyes(ctx, d * 4, -3, d, 3, 2.6, true); ctx.strokeStyle = '#3a3a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(d * 2, 5); ctx.lineTo(d * 10, 4); ctx.stroke(); } else TourKit.dizzy(ctx, 0, -14, t);
        ctx.restore();
      }
      // the shell
      const sg = ctx.createLinearGradient(0, -58, 0, -10); sg.addColorStop(0, '#6a8a4a'); sg.addColorStop(1, '#3a5a2a');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(0, -24, 40, 30, 0, Math.PI, TAU); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c8b878'; ctx.fillRect(-40, -26, 80, 6);
      ctx.strokeStyle = '#2a3a1a'; ctx.lineWidth = 2; for (const [cx, cy] of [[0, -40], [-20, -32], [20, -32]]) { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * TAU / 6; ctx.lineTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 7); } ctx.closePath(); ctx.stroke(); }
      if (flip) { ctx.fillStyle = '#e8d8a0'; ctx.beginPath(); ctx.ellipse(0, -24, 34, 10, 0, 0, TAU); ctx.fill(); }
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
  arrival: 'Brady! The Baron wants the Equator monument, line and all. I\'m hiding in his snack crate. ♥ C',
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
    { name: 'Middle of the World', style: 'run', theme: 'ec_equator', gimmick: 'Low-gravity bubbles on the equator line, banana-leaf platforms and rolling cacao pods',
      enemies: [['ecBanana', 3], ['ecCacao', 2], ['ecAlpaca', 1]],
      hint: 'On the equator line every jump floats. Blue boots bounce extra high!',
      postcard: 'Standing on the equator! Half of me is in the north, half in the south, all of me misses you. ♥ C',
      script: ['booby', ['flat', { n: 4 }], ['equator', { gold: true }], 'bananas', 'gap', 'cacao', 'cp', 'terraces', ['equator', { w: 8 }], ['enemies', { n: 2 }], 'bonus', ['bananas', { n: 2 }], 'end'] },
    { name: 'Cable Car Climb', style: 'ride', theme: 'ec_andes', gimmick: 'Ride a gondola up the Andes: hop the cable junctions and pylons, dodge condors',
      enemies: [['ecCondor', 1]], vehicle: 'ecGondola', vehicleW: 6, deck: 10, below: 'none', scroll: 2.4, len: 170,
      hint: 'Junction boxes hang low over the line: hop over them',
      postcard: 'The Baron\'s blimp is heading for the jungle. Bring bug spray. ♥ C',
      script: ['junction', 'condors', 'pylon', ['gondola', { gold: true }], 'junction', 'condors', 'pylon', 'junction', ['gondola', {}], 'condors', 'junction', 'pylon', ['gondola', { gold: true }], 'junction', 'condors', 'pylon'] },
    { name: 'Amazon Canopy', style: 'night', theme: 'ec_amazon', gimmick: 'Swing on vines across the dark canopy, lit by glowing frogs and mushrooms',
      enemies: [['ecFrog', 3]], dark: true,
      hint: 'Ride the swinging vines across the gaps',
      postcard: 'The jungle at night GLOWS. A frog winked at me. I think. ♥ C',
      script: [['glow', { n: 8 }], 'vines', ['branches', { gold: true }], ['glow', { n: 7, frogs: true }], ['vines', { n: 3 }], 'cp', ['glow', { n: 6 }], 'branches', ['vines', { n: 2 }], 'oneup', ['glow', { n: 8, frogs: true }], 'end'] },
    { name: 'Galápagos Snorkel', style: 'swim', theme: 'ec_galapagos', gimmick: 'Snorkel through lava-rock arches with sea lions, puffers and zooming penguins',
      enemies: [['ecSeaLion', 1]], H: 18, width: 220,
      hint: 'Tap jump to swim. Puffers puff up when you get close!',
      postcard: 'A sea lion stole my sunglasses and gave them back. Islands are magic. ♥ C',
      script: ['arches', 'puffers', ['penguins', { w: 12 }], 'grotto', 'arches', 'puffers', ['penguins', { w: 10 }], 'arches'] },
    { name: 'Ice Fort of Cotopaxi', style: 'castle', theme: 'ec_cotopaxi', gimmick: 'Slippery ice and falling icicles, then El Tortugón',
      enemies: [['ecAlpaca', 1], ['ecCacao', 2]], boss: 'ec_tortoise', arena: 'icecave', arenaW: 26,
      hint: 'When El Tortugón flips over, stomp his belly!',
      postcard: 'The Equator monument is back where it belongs! The Baron flew to Brazil. Samba time! ♥ C',
      script: [['ice', { n: 12 }], 'icepillars', ['enemies', { n: 2 }], 'cp', ['ice', { n: 14 }], ['blocks', { content: 'power' }], 'arena'] }
  ]
});
})();
