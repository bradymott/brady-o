/* ============================================================
   BRAZIL (world 3)
   3-1 Copacabana Boardwalk  run    wavy mosaic promenade, beach-kiosk umbrellas, crumbling sandcastles, a beach-ball bounce
   3-2 Sambadrome Night      night  the whole street moves to the samba beat: drum platforms pop up on the beat, parade floats
   3-3 Iguaçu Falls          climb  wet slippery rocks beside the falls, tumbling logs, mist updrafts, coatis that steal coins
   3-4 Pantanal Wetlands     run    ride swimming capybaras, hop sinking caiman backs, piranhas leap, jaguars charge
   3-5 Carnival Warehouse    castle turntables, confetti cannons, drum platforms; boss O Tucanão
   ============================================================ */
(() => {
const COL = { a: '#ffd23a', b: '#1aa85a', c: '#2a6ad8' };
const K = TourKit;
const CARN = ['#ff3d8b', '#ffd23a', '#2ad8a0', '#3a8aff', '#ff7a2a', '#b84aff'];
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };
if (typeof LIQUIDS !== 'undefined') LIQUIDS.river = ['#8ab86a', '#4a7a4a', '#24402a', 'rgba(230,255,220,0.2)', null, 'rgba(240,255,230,0.5)'];

/* ---------------- background painters ---------------- */
const painters = {
  // Sugarloaf and its neighbour: two granite domes rising from the bay
  brSugarloaf(ctx, L, rng, H) {
    for (const [x, w, h] of [[700, 150, 250], [520, 170, 150], [880, 120, 110]]) wrapDraw(x, w, xx => {
      ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(xx - w * 0.6, L.base);
      ctx.bezierCurveTo(xx - w * 0.5, L.base - h * 0.7, xx - w * 0.25, L.base - h, xx, L.base - h);
      ctx.bezierCurveTo(xx + w * 0.3, L.base - h, xx + w * 0.45, L.base - h * 0.6, xx + w * 0.6, L.base); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(40,90,40,0.55)'; ctx.beginPath(); ctx.ellipse(xx, L.base - 10, w * 0.6, 18, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(xx - w * 0.15, L.base - h * 0.7, w * 0.08, h * 0.22, -0.2, 0, TAU); ctx.fill();
    });
  },
  // the bay with lines of surf
  brSea(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, L.base, H, L.color, shade(L.color, -0.3)); ctx.fillRect(0, L.base, BG_W, H - L.base);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
    for (let r = 0; r < 4; r++) { ctx.beginPath(); for (let x = 0; x <= BG_W; x += 12) ctx.lineTo(x, L.base + 8 + r * 14 + Math.sin(x * 0.04 + r) * 2); ctx.stroke(); }
  },
  brPalms(ctx, L, rng, H) {
    for (let x = 20; x < BG_W; x += 90 + rng() * 80) wrapDraw(x, 70, xx => {
      const h = 90 + rng() * 50, lean = (rng() - 0.5) * 30;
      ctx.strokeStyle = shade(L.color, -0.2); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(xx, L.base); ctx.quadraticCurveTo(xx + lean, L.base - h * 0.6, xx + lean * 1.5, L.base - h); ctx.stroke();
      ctx.fillStyle = L.color; for (let k = 0; k < 7; k++) { const a = -Math.PI + k * Math.PI / 6; ctx.save(); ctx.translate(xx + lean * 1.5, L.base - h); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(22, 0, 24, 5, 0.3, 0, TAU); ctx.fill(); ctx.restore(); }
    });
  },
  // a stylised night skyline with glowing windows and carnival lights
  brSkyline(ctx, L, rng, H) {
    let x = 0;
    while (x < BG_W) {
      const w = 40 + rng() * 50, h = 60 + rng() * 120;
      ctx.fillStyle = shade(L.color, rng() * 0.15); ctx.fillRect(x, L.base - h, w - 4, h + (H - L.base));
      for (let wy = L.base - h + 8; wy < L.base - 6; wy += 12) for (let wx = x + 5; wx < x + w - 10; wx += 9) if (rng() < 0.4) { ctx.fillStyle = rng() < 0.5 ? 'rgba(255,220,140,0.75)' : 'rgba(140,220,255,0.6)'; ctx.fillRect(wx, wy, 4, 5); }
      x += w;
    }
    for (let k = 0; k < 60; k++) { ctx.fillStyle = CARN[k % 6]; ctx.beginPath(); ctx.arc(k * BG_W / 60, L.base - 190 + Math.sin(k * 0.5) * 12, 3, 0, TAU); ctx.fill(); }
  },
  // the great curtain of the falls
  brFalls(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let x = 0; x < BG_W; x += 60 + rng() * 60) {
      const w = 30 + rng() * 50;
      const g = ctx.createLinearGradient(0, L.base - 220, 0, H); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(200,240,255,0.5)');
      ctx.fillStyle = g; ctx.fillRect(x, L.base - 220, w, H - L.base + 220);
      ctx.strokeStyle = 'rgba(160,210,230,0.6)'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + 4 + k * w / 4, L.base - 220); ctx.lineTo(x + 4 + k * w / 4, H); ctx.stroke(); }
    }
    ctx.fillStyle = shade(L.color, 0.1); for (let x = 0; x < BG_W; x += 40) { ctx.beginPath(); ctx.arc(x + rng() * 20, L.base - 220, 20 + rng() * 14, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, H - 60, BG_W, 60);
  },
  // flat green marsh with lone trees
  brMarsh(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let x = 30; x < BG_W; x += 120 + rng() * 120) wrapDraw(x, 60, xx => { ctx.fillStyle = shade(L.color, -0.25); ctx.fillRect(xx - 3, L.base - 60, 6, 60); ctx.beginPath(); ctx.ellipse(xx, L.base - 66, 44, 16, 0, 0, TAU); ctx.fill(); });
    ctx.fillStyle = 'rgba(160,210,230,0.45)'; for (let k = 0; k < 6; k++) ctx.fillRect(rng() * BG_W, L.base + 10 + rng() * 40, 80 + rng() * 80, 4);
  }
};

/* ---------------- tiles ---------------- */
// the boardwalk's wavy black-and-white mosaic over warm sand
const boardwalk = {
  style: 'brWalk', cap: '#f0ead8', capHi: '#ffffff', dirt: '#e8c88a', dirt2: '#c8a060', rock: '#b8905a',
  paint(ctx, rng) { ctx.fillStyle = 'rgba(160,120,60,0.25)'; for (let k = 0; k < 10; k++) ctx.fillRect(rng() * TS, rng() * TS, 2, 2); },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#f4f0e4'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#1a1a20'; ctx.beginPath(); ctx.moveTo(x0, 9);
    for (let x = x0; x <= x1; x += 2) ctx.lineTo(x, 4.5 + Math.sin(x / TS * TAU) * 3);
    ctx.lineTo(x1, 9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x0, 8, x1 - x0, 1.5);
  }
};
function featherBox(ctx, th, f) {
  ctx.save(); ctx.shadowColor = 'rgba(255,120,200,0.9)'; ctx.shadowBlur = 4 + f * 1.5;
  const g = ctx.createLinearGradient(0, 4, 0, TS); g.addColorStop(0, '#ff5aa8'); g.addColorStop(1, '#b81a6a');
  ctx.fillStyle = g; rr(ctx, 1, 4, TS - 2, TS - 5, 4); ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; rr(ctx, 2, 5, TS - 4, TS - 7, 3); ctx.stroke();
  for (let k = 0; k < 5; k++) { ctx.fillStyle = CARN[(k + 1) % 6]; ctx.save(); ctx.translate(TS / 2, 8); ctx.rotate(-0.9 + k * 0.45 + Math.sin(f * 1.5 + k) * 0.05); ctx.beginPath(); ctx.ellipse(0, -7, 2.6, 8, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); K.star(ctx, TS / 2, 18, 6, 2.6, 5); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(5, 22 + Math.sin(f) * 0.5, 2, 2); ctx.fillRect(24, 13, 2, 2);
}
function featherUsed(ctx) { ctx.fillStyle = '#a07890'; rr(ctx, 1, 4, TS - 2, TS - 5, 4); ctx.fill(); ctx.strokeStyle = '#7a5a6a'; ctx.lineWidth = 1.2; ctx.stroke(); }
const base = {
  ground: boardwalk, brick: { style: 'stone', c1: '#e8d8b8', c2: '#c8b090', mortar: '#8a7050' }, hard: { c1: '#d8c8a8', c2: '#a08860' },
  semi: { style: 'plank', c1: '#c8884a', c2: '#8a5a2a' }, pillar: { c1: '#e8e0d0', c2: '#b8a888', cap: '#ffffff', style: 'column' },
  accent: COL.a, qblockArt: featherBox, usedArt: featherUsed, tint: {}, bloom: 0.2
};
const themes = {
  br_beach: Object.assign({}, base, {
    rays: '#fff0c0',
    name: 'Copacabana', music: 'tour_br', particles: 'dust',
    sky: ['#1a8ae8', '#7ad0ff', '#fff4d8'], horizonGlow: '#fff0c0',
    celestial: { type: 'sun', x: 0.78, y: 0.16, r: 40, color: '#fffbe0', glow: '#ffe8a0' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'brSugarloaf', color: '#5a7a6a', base: 330, f: 0.04 }, { kind: 'brSea', color: '#1aa8d8', base: 330, f: 0.06 }, { kind: 'brPalms', color: '#2a8a4a', base: 365, f: 0.3 }],
    fog: '#fff4e0', decor: ['brShell', 'brCooler', 'brShell']
  }),
  br_samba: Object.assign({}, base, {
    name: 'Sambadrome', music: 'tour_br_night', particles: 'confetti',
    sky: ['#140a2e', '#3a1a5a', '#8a2a6a'], horizonGlow: '#ff6ab8',
    celestial: { type: 'moon', x: 0.15, y: 0.15, r: 22, color: '#fff4e0', glow: '#ffb0e0' }, stars: 0.7,
    layers: [{ kind: 'brSkyline', color: '#2a1a40', base: 360, f: 0.08 }, { kind: 'brStands', color: '#3a2050', base: 350, f: 0.25 }],
    fog: '#ff8ad0', ground: { style: 'brWalk', cap: '#3a3a48', capHi: '#5a5a6a', dirt: '#4a4a58', dirt2: '#2a2a34', rock: '#5a5a68', paint: boardwalk.paint, paintCap(ctx, x0, x1) { ctx.fillStyle = '#4a4a58'; ctx.fillRect(x0, 0, x1 - x0, 8); ctx.fillStyle = '#ffffff'; for (let x = x0 + 4; x < x1; x += 16) ctx.fillRect(x, 3, 8, 2); } }
  }),
  br_falls: Object.assign({}, base, {
    rays: '#ffffff',
    name: 'Iguaçu Falls', music: 'tour_br_falls', particles: 'motes',
    sky: ['#3a8ad8', '#9ad8ff', '#e8fff8'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.2, y: 0.12, r: 30, color: '#fffbe8', glow: '#ffffff' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'brFalls', color: '#2a6a3a', base: 320, f: 0.05 }, { kind: 'brPalms', color: '#1e6a3a', base: 390, f: 0.2 }],
    fog: '#e8fff8', ground: { style: 'grass', cap: '#3aa85a', capHi: '#7ae08a', dirt: '#8a4a2a', dirt2: '#5a2a1a', rock: '#a85a3a' },
    semi: { style: 'plank', c1: '#8a8a9a', c2: '#5a5a6a' }, hard: { c1: '#5a6a5a', c2: '#2e3a30' }
  }),
  br_pantanal: Object.assign({}, base, {
    rays: '#ffe0a0',
    name: 'Pantanal', music: 'tour_br', particles: 'leaves', liquid: 'river',
    sky: ['#ff9a5a', '#ffd08a', '#fff4d0'], horizonGlow: '#ffe0a0', celestial: { type: 'sun', x: 0.7, y: 0.3, r: 46, color: '#fff0c0', glow: '#ffb070' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'brMarsh', color: '#6a9a4a', base: 360, f: 0.06 }, { kind: 'brPalms', color: '#3a6a2a', base: 370, f: 0.25 }],
    fog: '#ffe8c0', ground: { style: 'grass', cap: '#6aa83a', capHi: '#a8d86a', dirt: '#7a5a3a', dirt2: '#4a3a24', rock: '#8a6a4a' },
    semi: { style: 'log', c1: '#7a5230', c2: '#4a301a' }, decor: ['brReeds', 'brReeds', 'brFlowerBush']
  }),
  br_barracao: Object.assign({}, base, {
    name: 'Carnival Warehouse', music: 'tour_br_night', particles: 'confetti',
    sky: ['#1a1030', '#2a1a48', '#4a2a5a'], horizonGlow: '#ff5ab8', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'brStands', color: '#2a1a3a', base: 345, f: 0.1 }],
    fog: '#ff8ad0', ground: { style: 'metal', cap: '#5a5a6a', capHi: '#8a8a9a', dirt: '#3a3a48', dirt2: '#22222c', rock: '#4a4a58' }, decor: ['brMask'],
    hard: { c1: '#6a5a7a', c2: '#3a2a4a' }, semi: { style: 'plank', c1: '#ff5aa8', c2: '#b81a6a' }
  })
};
// the Sambadrome's grandstands (and the warehouse's racks of floats)
painters.brStands = function (ctx, L, rng, H) {
  for (let r = 0; r < 8; r++) { ctx.fillStyle = shade(L.color, r * 0.03); ctx.fillRect(0, L.base - 120 + r * 15, BG_W, 15); }
  for (let k = 0; k < 160; k++) { ctx.fillStyle = rgba(CARN[k % 6], 0.7); ctx.beginPath(); ctx.arc(rng() * BG_W, L.base - 114 + Math.floor(rng() * 8) * 15, 2.5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = shade(L.color, -0.2); ctx.fillRect(0, L.base, BG_W, H - L.base);
};

/* ---------------- decor ---------------- */
const decor = {
  brShell(ctx, x, y) { ctx.fillStyle = '#ffd0b8'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x, y - 9); ctx.lineTo(x + 6, y); ctx.fill(); ctx.strokeStyle = '#e8a088'; ctx.lineWidth = 1; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x + k * 4, y); ctx.stroke(); } },
  brCooler(ctx, x, y) { ctx.fillStyle = '#2a8aff'; rr(ctx, x - 10, y - 14, 20, 14, 2); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 10, y - 14, 20, 4); },
  brCoconutStand(ctx, x, y) {
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 18, y - 22, 36, 22); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 18, y - 22, 36, 4);
    ctx.fillStyle = '#3a8a3a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x - 12 + k * 8, y - 27, 5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ff3d8b'; ctx.fillRect(x - 2, y - 36, 2, 10);
  },
  // a striped beach umbrella (its canopy is a one-way platform)
  brUmbrella(ctx, x, y, t, th, d) {
    const w = d.w, top = y - d.h, col = CARN[d.seed % 6];
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x - 2, top + 6, 4, d.h - 6);
    ctx.save(); ctx.beginPath(); ctx.moveTo(x - w / 2 - 6, top + 10); ctx.quadraticCurveTo(x, top - 14, x + w / 2 + 6, top + 10); ctx.closePath(); ctx.clip();
    for (let k = -4; k < 5; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : col; ctx.beginPath(); ctx.moveTo(x, top - 14); ctx.lineTo(x + k * 16, top + 12); ctx.lineTo(x + (k + 1) * 16, top + 12); ctx.fill(); }
    ctx.restore();
  },
  brNet(ctx, x, y) {
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x - 2, y - 80, 4, 80);
    ctx.strokeStyle = 'rgba(30,30,40,0.7)'; ctx.lineWidth = 1; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x - 1, y - 78 + k * 5); ctx.lineTo(x + 1, y - 78 + k * 5); ctx.stroke(); }
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 3, y - 80, 6, 3);
  },
  brReeds(ctx, x, y) { ctx.strokeStyle = '#5a8a3a'; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 3, y); ctx.lineTo(x + k * 5, y - 16 - Math.abs(k) * 2); ctx.stroke(); } ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x - 1, y - 20, 3, 6); },
  brFlowerBush(ctx, x, y) { ctx.fillStyle = '#3a7a2a'; ctx.beginPath(); ctx.arc(x, y - 8, 10, Math.PI, TAU); ctx.fill(); ctx.fillStyle = '#ff7ac8'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x - 6 + k * 4, y - 12 + (k % 2) * 3, 2.2, 0, TAU); ctx.fill(); } },
  // a waterfall column (it pushes Brady down)
  brCascade(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, top = y - d.h;
    const g = ctx.createLinearGradient(x0, 0, x0 + d.w, 0); g.addColorStop(0, 'rgba(220,245,255,0.35)'); g.addColorStop(0.5, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(220,245,255,0.35)');
    ctx.fillStyle = g; ctx.fillRect(x0, top, d.w, d.h);
    ctx.strokeStyle = 'rgba(180,220,240,0.8)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 8; k++) { const sx = x0 + 6 + k * (d.w - 12) / 7, ph = (t * 3 + k * 0.37) % 1; ctx.beginPath(); ctx.moveTo(sx, top + ph * d.h); ctx.lineTo(sx, top + ph * d.h + 40); ctx.stroke(); }
  },
  // a rainbow arching through the mist
  brRainbow(ctx, x, y, t, th, d) {
    ctx.save(); ctx.globalAlpha = 0.45;
    ['#ff4a4a', '#ff9a2a', '#ffe02a', '#4ad84a', '#3a8aff', '#8a4aff'].forEach((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y + 20, d.w / 2 - k * 4, Math.PI, TAU); ctx.stroke(); });
    ctx.restore();
  },
  brNest(ctx, x, y) { ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.ellipse(x, y - 4, 22, 7, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x - 20, y - 4 + k); ctx.lineTo(x + 20, y - 6 - k); ctx.stroke(); } },
  brTree(ctx, x, y, t, th, d) { ctx.fillStyle = '#5a3a24'; ctx.fillRect(x - 10, y - d.h, 20, d.h); ctx.fillStyle = '#2a7a3a'; ctx.beginPath(); ctx.ellipse(x, y - d.h - 10, 70, 26, 0, 0, TAU); ctx.fill(); },
  // carnival masks and float heads stacked in the warehouse
  brMask(ctx, x, y, t) {
    const c = CARN[Math.floor(x / 97) % 6];
    ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y - 30, 26, 18, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.ellipse(x - 10, y - 32, 7, 4, -0.2, 0, TAU); ctx.ellipse(x + 10, y - 32, 7, 4, 0.2, 0, TAU); ctx.fill();
    for (let k = 0; k < 5; k++) { ctx.fillStyle = CARN[(k + 2) % 6]; ctx.save(); ctx.translate(x, y - 46); ctx.rotate(-0.8 + k * 0.4 + Math.sin(t * 2 + k) * 0.04); ctx.beginPath(); ctx.ellipse(0, -14, 4, 15, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = '#5a5a6a'; ctx.fillRect(x - 3, y - 14, 6, 14);
  },
  // spray rising off the falls
  brMist(ctx, x, y, t, th, d) {
    for (let k = 0; k < 12; k++) { const ph = (t * 0.5 + k / 12) % 1; ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x + Math.sin(k * 2.3 + t) * d.w * 0.3, y - ph * d.h, 8 + (k % 3) * 4, 0, TAU); ctx.fill(); }
  }
};
const decorLights = { brMask: [90, '#ff8ad0', -30] };
// samba drums: surdo heads that pop up on the beat
const beatArt = {
  brDrum(ctx, k, on, warn, t) {
    if (on) { ctx.fillStyle = '#c8c8d0'; ctx.fillRect(2, 2, 28, 14); ctx.fillStyle = '#f4f0e4'; ctx.fillRect(1, 0, 30, 4); ctx.fillStyle = CARN[(k.tx + k.grp) % 6]; ctx.fillRect(2, 6, 28, 5); ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(4 + i * 8, 4); ctx.lineTo(8 + i * 8, 16); ctx.stroke(); } }
    else { ctx.globalAlpha = warn ? 0.7 : 0.35; ctx.strokeStyle = '#f4f0e4'; ctx.setLineDash([3, 3]); ctx.strokeRect(2, 1, 28, 6); ctx.setLineDash([]); ctx.globalAlpha = 1; }
  }
};

/* ---------------- enemies ---------------- */
const crabArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); if (m === 'flat') ctx.scale(1.2, 0.4);
  const w = Math.sin(e.t * 10) * 2;
  ctx.strokeStyle = '#c8321a'; ctx.lineWidth = 2; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(s * 6, -6); ctx.lineTo(s * (12 + k * 2), -2 + (k % 2 ? w : -w)); ctx.lineTo(s * (14 + k * 2), 0); ctx.stroke(); }
  ctx.fillStyle = '#e8422a'; ctx.beginPath(); ctx.ellipse(0, -8, 11, 7, 0, 0, TAU); ctx.fill();
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 14, -16 + (s > 0 ? w : -w), 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(s * 14 - 1, -20, 2, 4); ctx.fillStyle = '#e8422a'; }
  if (m !== 'flat' && m !== 'ko') { ctx.strokeStyle = '#c8321a'; ctx.beginPath(); ctx.moveTo(-3, -14); ctx.lineTo(-3, -18); ctx.moveTo(3, -14); ctx.lineTo(3, -18); ctx.stroke(); K.eyes(ctx, 0, -19, 1, 3, 2, true); }
  ctx.restore();
};
const coconutArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y - 11); if (m === 'roll' || m === 'curl') ctx.rotate(e.t * 12 * e.dir);
  ctx.fillStyle = '#3a8a3a'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5aaa4a'; ctx.beginPath(); ctx.arc(-3, -3, 5, 0, TAU); ctx.fill();
  if (m !== 'roll' && m !== 'curl' && m !== 'flat' && m !== 'ko') { K.eyes(ctx, e.dir * 3, -1, e.dir, 3, 2, true); ctx.fillStyle = '#ff3d8b'; ctx.fillRect(4, -16, 2, 9); }
  ctx.restore();
};
const gullArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const f = Math.sin(e.t * (m === 'swoop' ? 8 : 4));
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c8c8d0'; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.quadraticCurveTo(-10, -12 - f * 6, -22, -6 - f * 8); ctx.lineTo(0, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(10, -12 - f * 6, 20, -6 - f * 8); ctx.lineTo(4, 0); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(10, -3, 4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffb81a'; ctx.beginPath(); ctx.moveTo(13, -3); ctx.lineTo(19, -1); ctx.lineTo(13, 0); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(11, -4, 1, 0, TAU); ctx.fill();
  ctx.restore();
};
const brigadeiroArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); if (m === 'flat') ctx.scale(1.3, 0.4);
  ctx.fillStyle = '#ff8ac0'; ctx.beginPath(); ctx.moveTo(-11, -2); ctx.lineTo(11, -2); ctx.lineTo(8, 2); ctx.lineTo(-8, 2); ctx.fill();
  ctx.fillStyle = '#4a2416'; ctx.beginPath(); ctx.arc(0, -11, 10, 0, TAU); ctx.fill();
  for (let k = 0; k < 14; k++) { ctx.fillStyle = CARN[k % 6]; ctx.fillRect(-7 + ((k * 37) % 14), -19 + ((k * 23) % 14), 2, 1.2); }
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, e.dir * 2, -12, e.dir, 3, 2, false);
  ctx.restore();
};
const pandeiroArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y - 13); if (m !== 'flat') ctx.rotate(e.t * 8 * e.dir); else ctx.scale(1.3, 0.4);
  ctx.fillStyle = '#c8a060'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill();
  ctx.fillStyle = '#d8d8e0'; for (let k = 0; k < 5; k++) { const a = k * TAU / 5; ctx.beginPath(); ctx.arc(Math.cos(a) * 11.5, Math.sin(a) * 11.5, 2.2, 0, TAU); ctx.fill(); }
  ctx.restore();
  if (m !== 'flat' && m !== 'ko') { ctx.save(); ctx.translate(x, y - 13); K.eyes(ctx, e.dir * 2, -2, e.dir, 3, 2.2, true); ctx.restore(); }
};
const coatiArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.quadraticCurveTo(-22, -16, -18, -30); ctx.stroke();
  ctx.strokeStyle = '#e8d0a0'; ctx.lineWidth = 5; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(-10, -10); ctx.quadraticCurveTo(-22, -16, -18, -30); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
  ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.ellipse(0, -9, 12, 7, 0, 0, TAU); ctx.fill();
  for (const lx of [-7, 6]) ctx.fillRect(lx - 1.5, -4, 3, 4);
  ctx.beginPath(); ctx.moveTo(8, -13); ctx.lineTo(20, -9); ctx.lineTo(8, -6); ctx.fill();
  ctx.fillStyle = '#e8d0a0'; ctx.beginPath(); ctx.arc(9, -12, 2.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(10, -12, 1.2, 0, TAU); ctx.arc(20, -9, 1.3, 0, TAU); ctx.fill();
  if (e.loot) { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(-2, -18, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8901a'; ctx.fillRect(-3, -19, 2, 2); }
  ctx.restore();
};
const jaguarArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const run = m === 'charge' ? Math.sin(e.t * 20) * 3 : 0;
  ctx.strokeStyle = '#e8a83a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-18, -14); ctx.quadraticCurveTo(-30, -20, -28, -8); ctx.stroke();
  ctx.fillStyle = '#e8a83a'; ctx.beginPath(); ctx.ellipse(0, -14, 19, 9, 0, 0, TAU); ctx.fill();
  for (const [lx, d] of [[-12, run], [-5, -run], [6, run], [13, -run]]) ctx.fillRect(lx - 2.5 + d, -8, 5, 8);
  ctx.beginPath(); ctx.arc(19, -18, 8, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(16, -26, 3, 0, TAU); ctx.arc(23, -25, 3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a2410'; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(-14 + k * 3.8, -16 + (k % 3) * 3, 1.8, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#f4e8d0'; ctx.beginPath(); ctx.ellipse(23, -15, 4, 3, 0, 0, TAU); ctx.fill();
  K.eyes(ctx, 20, -20, 1, 2.5, 1.8, m === 'charge' || m === 'notice');
  ctx.restore();
};
const piranhaArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(m === 'up' ? -Math.PI / 2 : Math.PI / 2);
  ctx.fillStyle = '#8a9aa8'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8422a'; ctx.beginPath(); ctx.ellipse(2, 3, 8, 4, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#8a9aa8'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-17, -6); ctx.lineTo(-17, 6); ctx.fill();
  ctx.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(6 + k * 1.5, 2); ctx.lineTo(6.7 + k * 1.5, 4.5); ctx.lineTo(7.4 + k * 1.5, 2); ctx.fill(); }
  K.eyes(ctx, 5, -3, 1, 2, 1.8, true);
  ctx.restore();
};
// coatis really do snatch tourists' snacks: this one steals coins, then runs off with them
const COATI = { w: 26, h: 18, speed: 1.2, behavior: 'walk', art: coatiArt, burst: '#8a5a32', onDefeat: e => e.giveBack && e.giveBack() };
class BrCoati extends TourEnemy {
  constructor(g, s) { super(g, s, COATI); this.loot = 0; this.flee = 0; }
  update(dt) {
    if (this.flee > 0 && !this.dead && !this.knocked && this.stunT <= 0) { this.t += dt; this.flee -= dt; this.vx = this.dir * 5.5 * TS; this.mode = 'flee'; this.walk(dt); if (this.hitWall) this.dir = -this.dir; return; }
    super.update(dt);
  }
  touchPlayer(p) {
    if (this.dead || this.stunT > 0 || this.flee > 0) return;
    const g = this.g;
    if (g.picks > 0 && !p.star) {
      const n = Math.min(5, g.picks); g.picks -= n; Save.data.picks = g.picks; this.loot += n;
      this.flee = 3; this.dir = this.cx < p.cx ? -1 : 1; K.say(g, this, 'YOINK! −' + n, '#ffd84a'); Sound.play('pick', { pitch: 0.6 }); return;
    }
    p.hurt(this);
  }
  giveBack() { const g = this.g; for (let k = 0; k < this.loot; k++) { g.spawn(new PickPop(g, this.cx + (k - this.loot / 2) * 6, this.y)); g.addPick(); } if (this.loot) K.say(g, this, 'FINE, TAKE THEM!', '#ffd84a'); this.loot = 0; }
}
const enemies = {
  brCrab: { cls: TourEnemy.make({ w: 26, h: 16, speed: 1.3, behavior: 'walk', art: crabArt, burst: '#e8422a' }), place: 'walk' },
  brCoconut: { cls: TourEnemy.make({ w: 22, h: 22, speed: 0.7, behavior: 'roll', range: 8, rollSpeed: 6, art: coconutArt, burst: '#3a8a3a' }), place: 'walk' },
  brGull: { cls: TourFlyer.make({ w: 30, h: 14, range: 4, speed: 0.8, swoop: true, art: gullArt, burst: '#ffffff' }), place: 'fly' },
  brBrigadeiro: { cls: TourEnemy.make({ w: 20, h: 22, speed: 1.0, behavior: 'hop', hopV: 11, hopEvery: 1.2, art: brigadeiroArt, burst: '#4a2416' }), place: 'walk' },
  brPandeiro: { cls: TourEnemy.make({ w: 26, h: 26, speed: 2.0, behavior: 'walk', art: pandeiroArt, burst: '#c8a060' }), place: 'walk' },
  brCoati: { cls: BrCoati, place: 'walk' },
  brJaguar: { cls: TourEnemy.make({ w: 40, h: 26, speed: 1.0, behavior: 'charge', range: 8, chargeSpeed: 6.5, hp: 2, art: jaguarArt, burst: '#e8a83a', onNotice: e => K.say(e.g, e, 'RRRAWR!', '#ffd84a') }), place: 'walk' },
  brPiranha: { cls: TourLeaper.make({ w: 22, h: 18, jumpV: 15, every: 1.4, art: piranhaArt, splash: '#a8d88a' }), place: 'here' }
};
// a confetti cannon from the carnival floats
class BrCannon extends Ent {
  constructor(g, s) { super(g, s, 40, 40); this.dir = s.dir || -1; this.every = s.period || 2.2; this.cool = 1; this.recoil = 0; }
  update(dt) {
    this.t += dt; this.recoil = Math.max(0, this.recoil - dt * 4); this.cool -= dt;
    if (this.cool <= 0) { this.cool = this.every; this.recoil = 1; if (this.g.onScreen(this)) Sound.play('kick', { pitch: 1.4, vol: 0.4 });
      tourFire(this.g, this.cx + this.dir * 24, this.y + 14, { kind: 'confetti', vx: this.dir * 5 * TS, vy: 0, w: 16, h: 16, life: 4, col: CARN[Math.floor(this.t) % 6], stompable: true, art: (ctx, s, t) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(t * 8); for (let k = 0; k < 6; k++) { ctx.fillStyle = CARN[k]; ctx.fillRect(Math.cos(k) * 6 - 2, Math.sin(k) * 6 - 2, 4, 4); } ctx.restore(); } }); }
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, d = this.dir;
    ctx.fillStyle = '#5a3a6a'; rr(ctx, x - 18, y - 16, 36, 16, 4); ctx.fill();
    ctx.save(); ctx.translate(x, y - 22); ctx.scale(d, 1); ctx.translate(-this.recoil * 4, 0);
    ctx.fillStyle = '#ff3d8b'; rr(ctx, -10, -9, 34, 18, 6); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(20, -10, 5, 20); ctx.fillRect(-2, -9, 3, 18);
    ctx.restore();
  }
}
const entities = { brCannon: BrCannon };

/* ---------------- the signature power-up: THE FOOTBALL ---------------- */
// kick a ball that ricochets off walls and enemies (one ball on the pitch at a time)
function ballIcon(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1a20'; ctx.beginPath(); K.star(ctx, 0, 0, 3.6, 3.6, 5); ctx.fill();
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * TAU / 5; ctx.beginPath(); ctx.arc(Math.cos(a) * 8, Math.sin(a) * 8, 2.2, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#1a1a20'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.stroke();
  ctx.restore();
}
class BrBall extends Ent {
  constructor(g, x, y, dir) { super(g, null, 18, 18); this.x = x - 9; this.y = y - 9; this.vx = dir * 8 * TS; this.vy = -4 * TS; this.life = 4; this.hits = 0; this.friendly = true; }
  update(dt) {
    this.t += dt; this.life -= dt;
    this.vy += PHYS.gDown * 0.7 * dt;
    moveBody(this, this.g.area, dt, { semis: true });
    if (this.onGround) { this.vy = -7.5 * TS; Sound.play('bump', { pitch: 1.8, vol: 0.25 }); }
    if (this.hitWall) { this.vx = -this.vx; this.hits++; Sound.play('kick', { pitch: 1.6, vol: 0.35 }); }
    if (this.bonks && this.bonks.length) this.vy = Math.abs(this.vy) * 0.5;
    for (const e of this.g.entities) {
      if (!e.enemy || e.dead || e.remove || !overlap(this, e)) continue;
      if (e.boss) { if (e.state === 'fight' && e.hit('disc', this)) { this.vx = -this.vx; this.hits += 2; } continue; }
      if (e.hit('kick', this)) { this.g.addScore(200, e.cx, e.y); this.g.burst(e.cx, e.cy, 10, '#ffd23a', 'confetti'); }
      this.vx = -this.vx; this.vy = -6 * TS; this.hits++;
    }
    if (this.life <= 0 || this.hits > 5 || this.y > this.g.area.H * TS) { this.remove = true; this.g.burst(this.cx, this.cy, 8, '#ffffff', 'spark'); }
  }
  draw(ctx) { ballIcon(ctx, this.cx, this.cy, this.t * 4 * sign(this.vx)); }
}
const power = {
  id: 'ball', name: 'FOOTBALL', country: 'br', hint: 'PRESS ACTION TO KICK · IT RICOCHETS OFF WALLS AND ENEMIES', time: 0, cooldown: 0.35,
  icon: ballIcon,
  action(p, g) {
    if (g.entities.some(e => e instanceof BrBall && !e.remove)) return false;
    g.spawn(new BrBall(g, p.cx + p.facing * 16, p.y + p.h - 12, p.facing));
    Sound.play('kick'); K.say(g, p, pick(['GOOOL!', 'OLÉ!', 'BICYCLE KICK!']), '#ffd23a');
    return true;
  },
  drawOn(p, ctx, t) { if (!p.g.entities.some(e => e instanceof BrBall && !e.remove)) ballIcon(ctx, p.cx + p.facing * 10, p.y + p.h - 8, 0); }
};

/* ---------------- set pieces ---------------- */
const P = {
  /* 3-1: the beach */
  // beach kiosks: their striped umbrellas are one-way platforms
  kiosks(st) {
    const x = st.x, B = st.B; st.floor(x, x + 13);
    [[x + 2, st.gy - 3], [x + 8, st.gy - 6]].forEach(([ux, uy], k) => {
      for (let q = 0; q < 4; q++) { B.set(ux + q, uy, T.SEMI); B.setHide(ux + q, uy, 1); }
      B.prop('brUmbrella', ux, uy, 4, st.gy - uy, 'none', { seed: k * 2 + 1 });
      st.coins(ux, ux + 3, uy - 2);
    });
    st.decor('brCoconutStand', x + 6);
    st.enemy('brCoconut', x + 12, st.gy);
    return x + 14;
  },
  // sandcastle towers crumble under Brady's feet
  sandcastle(st) {
    const x = st.x, B = st.B; st.floor(x, x + 11);
    B.fill(x + 2, st.gy - 2, x + 3, st.gy - 1, T.CRUMBLE); B.fill(x + 5, st.gy - 4, x + 6, st.gy - 1, T.CRUMBLE); B.fill(x + 8, st.gy - 2, x + 9, st.gy - 1, T.CRUMBLE);
    st.coins(x + 5, x + 6, st.gy - 6);
    return x + 12;
  },
  crabs(st, o) { const x = st.x, n = o.n || 2; st.floor(x, x + 4 * n + 3); for (let k = 0; k < n; k++) { st.enemy('brCrab', x + 3 + k * 4, st.gy); st.decor('brShell', x + 1 + k * 4); } st.coins(x + 2, x + 4 * n, st.gy - 3); return x + 4 * n + 4; },
  gulls(st) { const x = st.x; st.floor(x, x + 11); st.enemy('brGull', x + 6, st.gy); st.decor('brCooler', x + 3); st.coins(x + 2, x + 9, st.gy - 2); return x + 12; },
  // a beach ball by the volleyball net: bounce on it up to the high ledge
  volley(st, o) { const x = st.x; st.decor('brNet', x + 1); return Tour.pieces.spring(st, { skin: 'brBall', gold: o.gold }); },

  /* 3-2: the Sambadrome (st.R.bpm keeps the beat) */
  // surdo drums pop up on the beat over the gaps
  drums(st, o) {
    const x = st.x, B = st.B, n = o.n || 4; st.floor(x, x + 1);
    let xx = x + 2;
    for (let k = 0; k < n; k++) { st.pit(xx, xx + 2); B.beat(xx, xx + 2, st.gy - 1 - (k % 2) * 2, k % 2, 'brDrum'); st.coins(xx, xx + 2, st.gy - 3 - (k % 2) * 2); xx += 3; if (k < n - 1) { st.floor(xx, xx); xx += 1; } }
    st.floor(xx, xx + 2);
    return xx + 3;
  },
  // a parade float glides back and forth over the avenue's gap
  float(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const span = o.span || 9;
    st.pit(x, x + span - 1);
    st.spawn('mplat', x + 1, st.gy - 1, { pw: 4, ax: (span - 5) * TS, ay: 0, speed: 1.6, skin: 'brFloat' });
    for (let k = 0; k < span; k++) st.B.ghosts.push([x + k, st.gy]);
    st.coins(x + 2, x + span - 3, st.gy - 4);
    if (o.gold) st.gold(x + Math.floor(span / 2), st.gy - 5, 'risky');
    x += span; st.floor(x, x + 2);
    return x + 3;
  },
  // living tambourines roll down the avenue
  parade(st, o) { const x = st.x, n = o.n || 2; st.floor(x, x + 12); for (let k = 0; k < n; k++) st.enemy('brPandeiro', x + 5 + k * 5, st.gy); st.coins(x + 2, x + 10, st.gy - 4); st.block(x + 6, st.gy - 4, o.item || null, o.item ? T.QBLOCK : T.BRICK); return x + 13; },
  // the bleachers: steps up into the stands and back down
  stands(st) { return Tour.pieces.stairs(st, { n: 4 }); },

  /* 3-3: the falls (a climb: st.y is the floor row the next band starts from) */
  // wet, slippery rocks zigzag up both sides of a waterfall that pushes Brady down
  wetrocks(st, o) {
    const B = st.B, W = st.W, mid = st.mid, n = o.n || 4, y0 = st.y;
    const top = y0 - 3 * n - 3;
    B.zone(mid - 2, top, 4, y0 - top, 0, 80 * TS, 0, 'falls');
    B.prop('brCascade', mid - 2, top, 4, y0 - top, 'none', {});
    for (let k = 0; k < n; k++) {
      const y = y0 - 3 * (k + 1), sh = k % 2 ? 4 : 0;
      for (let x = 2 + sh; x <= 5 + sh; x++) B.set(x, y, T.ICE);
      for (let x = W - 6 - sh; x <= W - 3 - sh; x++) B.set(x, y, T.ICE);
      st.coins(mid - 1, mid, y - 1);
    }
    if (o.gold) st.gold(mid, y0 - 3 * n - 1, 'risky');
    st.top(top);
  },
  // logs tumble down a chute: time the climb across it
  logs(st, o) {
    const B = st.B, W = st.W, n = o.n || 4, y0 = st.y, chute = o.left ? 7 : W - 9;
    const top = y0 - 3 * n - 3;
    st.spawn('brLogDrop', chute, top - 1, { every: 1.9, h: (y0 - top + 2) });
    for (let k = 0; k < n; k++) {
      const y = y0 - 3 * (k + 1), left = k % 2 === 0;
      const x0 = left ? 2 : W - 12, x1 = left ? 11 : W - 3;
      for (let x = x0; x <= x1; x++) B.set(x, y, T.SEMI);
      st.coins(x0 + 2, x0 + 4, y - 2);
    }
    st.top(top);
  },
  // spray from the falls lifts Brady up a mist column
  mist(st, o) {
    const B = st.B, W = st.W, y0 = st.y, rise = o.rise || 10, x = o.left ? 3 : W - 7, ly = y0 - rise;
    B.zone(x, ly - 2, 3, rise + 2, 0, -110 * TS, 7 * TS, 'mist', { pull: 3 });
    B.prop('brMist', x, ly - 2, 3, rise + 2, 'none', {});
    B.prop('brRainbow', x - 2, ly + 1, 7, 4, 'none', {});
    for (let y = ly + 1; y < y0 - 1; y += 2) B.pickAt(x + 1, y);
    for (let q = 2; q < W - 2; q++) if (q < x - 1 || q > x + 3) B.set(q, ly, T.SEMI);
    st.enemy('brCoati', o.left ? W - 6 : 5, ly, { edgeTurn: true });
    st.top(ly - 3);
  },
  // the Devil's Throat walkway: long catwalks with snack-thieving coatis
  walkway(st, o) {
    const B = st.B, W = st.W, n = o.n || 3, y0 = st.y;
    for (let k = 0; k < n; k++) {
      const y = y0 - 3 * (k + 1), gapLeft = k % 2 === 0;
      for (let x = 2; x <= W - 3; x++) if (gapLeft ? x > 4 : x < W - 5) B.set(x, y, T.SEMI);
      st.coins(8, W - 9, y - 2);
      if (k === 1) st.enemy('brCoati', gapLeft ? W - 6 : 6, y, { edgeTurn: true });
    }
    st.top(y0 - 3 * n - 3);
  },

  /* 3-4: the Pantanal */
  // capybaras swim back and forth across the river: ride them
  capybaras(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const span = o.span || 10;
    st.pit(x, x + span - 1); st.B.fill(x, st.gy + 1, x + span - 1, st.H - 1, T.LAVA);
    st.spawn('mplat', x + 1, st.gy - 1, { pw: 3, ax: (span - 4) * TS, ay: 0, speed: 1.3, skin: 'brCapybara' });
    for (let k = 0; k < span; k++) st.B.ghosts.push([x + k, st.gy]);
    st.coins(x + 2, x + span - 3, st.gy - 3);
    x += span; st.floor(x, x + 2);
    return x + 3;
  },
  // caimans float like logs... until Brady stands on one
  caimans(st, o) {
    const n = o.n || 3; let x = st.x; st.floor(x, x + 1); x += 2;
    const span = n * 3 + 1;
    st.pit(x, x + span - 1); st.B.fill(x, st.gy + 1, x + span - 1, st.H - 1, T.LAVA);
    for (let i = 0; i < n; i++) { st.spawn('fplat', x + 2 + i * 3, st.gy - 1, { pw: 2, skin: 'brCaiman' }); st.B.ghosts.push([x + 1 + i * 3, st.gy], [x + 2 + i * 3, st.gy]); }
    st.coins(x + 1, x + span - 2, st.gy - 3);
    x += span; st.floor(x, x + 2);
    return x + 3;
  },
  // a log bridge over a piranha river
  piranhas(st) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const span = 9;
    st.pit(x, x + span - 1); st.B.fill(x, st.gy + 1, x + span - 1, st.H - 1, T.LAVA);
    for (let q = 0; q < span; q++) if (q % 3 !== 1) st.B.set(x + q, st.gy, T.SEMI);
    for (const q of [1, 4, 7]) st.spawn('brPiranha', x + q, st.gy + 1, { delay: q * 0.3 });
    st.coins(x, x + span - 1, st.gy - 2);
    x += span; st.floor(x, x + 2);
    return x + 3;
  },
  // a jaguar prowls the tall grass
  jaguar(st) { const x = st.x; st.floor(x, x + 14); st.enemy('brJaguar', x + 11, st.gy); for (let k = 1; k < 14; k += 3) st.decor('brReeds', x + k); st.semi(x + 4, x + 8, st.gy - 4); st.coins(x + 4, x + 8, st.gy - 6); return x + 15; },
  // a tall tree with a jabiru nest (and a postcard) at the top
  nest(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 12);
    B.prop('brTree', x + 5, st.gy - 9, 2, 9, 'none', {});
    for (const [bx, by] of [[x + 1, st.gy - 3], [x + 7, st.gy - 6], [x + 2, st.gy - 9]]) { for (let q = 0; q < 4; q++) B.set(bx + q, by, T.SEMI); st.coins(bx, bx + 3, by - 2); }
    B.decorAt('brNest', x + 4, st.gy - 9, 0);
    if (o.gold) st.gold(x + 4, st.gy - 11, 'high');
    return x + 13;
  },

  /* 3-5: the carnival warehouse */
  // two turntables orbit over a pit
  turntable(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const span = 9, cx = x + 4, cy = st.gy - 3, r = 2.5;
    st.pit(x, x + span - 1);
    for (let k = 0; k < 2; k++) st.spawn('mplat', cx, cy, { pw: 3, orbit: r * TS, speed: 1.1, phase: k * Math.PI / 1.1, skin: 'brTurntable' });
    for (let a = 0; a < 16; a++) { const th = a / 16 * TAU, gx = Math.round(cx + Math.cos(th) * r), gy2 = Math.round(cy + 1 + Math.sin(th) * r); for (let q = 0; q <= 2; q++) st.B.ghosts.push([gx + q, gy2]); }
    st.coins(cx, cx + 2, cy - 4);
    if (o.gold) st.gold(cx + 1, cy - 5, 'risky');
    x += span; st.floor(x, x + 2);
    return x + 3;
  },
  // confetti cannons fire along the floor: hop the confetti (or stomp it)
  cannons(st, o) {
    const x = st.x; st.floor(x, x + 14);
    st.spawn('brCannon', x + 13, st.gy - 1, { dir: -1, period: 2.2 });
    st.semi(x + 3, x + 7, st.gy - 4); st.coins(x + 3, x + 7, st.gy - 6);
    st.decor('brMask', x + 9);
    if (o.gold) st.gold(x + 5, st.gy - 7, 'high');
    return x + 15;
  },
  // the bateria: rows of drums pop up on the beat
  bateria(st, o) { return P.drums(st, { n: o.n || 5 }); },
  arena_barracao(st, o) {
    const B = st.B, { x0, w, GY } = o;
    for (let q = 0; q < 4; q++) { B.set(x0 + 3 + q, GY - 4, T.SEMI); B.set(x0 + w - 7 + q, GY - 4, T.SEMI); }
    for (let q = 0; q < 6; q++) B.set(x0 + Math.floor(w / 2) - 3 + q, GY - 7, T.SEMI);
    for (const dx of [2, w - 3]) B.decorAt('brMask', x0 + dx, GY, 0);
  }
};
// logs tumbling down the falls' chute
class BrLogDrop extends Ent {
  constructor(g, s) { super(g, s, 10, 10); this.every = s.every || 2; this.cool = 0.6; const rows = s.h || 12; this.life = (-3 + Math.sqrt(9 + 75.6 * rows)) / 37.8; }
  update(dt) {
    this.t += dt; this.cool -= dt;
    if (this.cool <= 0) { this.cool = this.every; tourFire(this.g, this.cx, this.y, { kind: 'log', vy: 3 * TS, grav: PHYS.gDown * 0.45, w: 40, h: 14, life: this.life, thru: true, col: '#6a4a2a', art: (ctx, s, t) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(Math.sin(t * 6) * 0.3); ctx.fillStyle = '#6a4a2a'; rr(ctx, -20, -7, 40, 14, 6); ctx.fill(); ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.ellipse(18, 0, 3, 6, 0, 0, TAU); ctx.fill(); ctx.restore(); } }); }
  }
  draw(ctx) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(this.cx - 24, this.y + this.h, 48, 4); }
}
entities.brLogDrop = BrLogDrop;
const platforms = {
  // a carnival float: feathers, glitter and a giant fruit bowl
  brFloat(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#ff3d8b'; rr(ctx, x - 6, y, w + 12, 30, 6); ctx.fill();
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 6, y + 10, w + 12, 4);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.arc(x + 10 + k * (w - 20) / 3, y + 30, 6, 0, TAU); ctx.fill(); }
    for (let k = 0; k < 7; k++) { ctx.fillStyle = CARN[k % 6]; ctx.save(); ctx.translate(x + w - 8, y); ctx.rotate(-1.2 + k * 0.3 + Math.sin(t * 3 + k) * 0.05); ctx.beginPath(); ctx.ellipse(0, -20, 4, 20, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    PlatformArt.deck(ctx, x - 6, y - 2, w + 12, '#ffd23a');
  },
  // a capybara swimming with a little bird riding on its head
  brCapybara(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w, d = p.dx < 0 ? -1 : 1, cx = x + w / 2;
    ctx.save(); ctx.translate(cx, y); ctx.scale(d, 1);
    ctx.fillStyle = '#9a6a3a'; ctx.beginPath(); ctx.ellipse(0, 6, w / 2 + 4, 13, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(-w / 2 - 4, 6, w + 8, 5);
    ctx.beginPath(); ctx.ellipse(w / 2, 2, 14, 10, 0.1, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.arc(w / 2 - 6, -6, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(w / 2 + 3, -1, 1.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(w / 2 + 2, -11, 3.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff7a2a'; ctx.fillRect(w / 2 + 5, -11, 3, 1.5);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx - d * (w / 2 + 8 + k * 7), y + 10 + Math.sin(t * 6 + k) * 1.5, 2 + k, 0, TAU); ctx.fill(); }
  },
  // a caiman's knobbly back
  brCaiman(ctx, p) {
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#4a5a2a'; rr(ctx, x - 6, y, w + 12, 10, 5); ctx.fill();
    ctx.fillStyle = '#3a4a1a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + 2 + k * (w - 4) / 4, y + 1, 3, Math.PI, TAU); ctx.fill(); }
    ctx.fillStyle = '#4a5a2a'; ctx.beginPath(); ctx.ellipse(x + w + 12, y + 6, 12, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8d870'; ctx.beginPath(); ctx.arc(x + w + 6, y + 1, 2.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.fillRect(x + w + 5.5, y - 0.5, 1, 3);
  },
  brTurntable(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#5a3a6a'; rr(ctx, x - 2, y, w + 4, 12, 6); ctx.fill();
    ctx.save(); rr(ctx, x - 2, y, w + 4, 12, 6); ctx.clip(); for (let k = 0; k < 8; k++) { ctx.fillStyle = CARN[(k + Math.floor(t * 4)) % 6]; ctx.fillRect(x - 2 + k * (w + 4) / 8, y, (w + 4) / 8, 4); } ctx.restore();
  },
  brBallSpring(ctx, x, y, comp, t) {
    const r = 15 * (1 - comp * 0.25), sq = 1 + comp * 0.3;
    ctx.save(); ctx.translate(x, y - r); ctx.scale(sq, 1 / sq);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ['#ff3d8b', '#ffd23a', '#2a8aff'].forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, k * TAU / 3 + t, k * TAU / 3 + t + 0.8); ctx.closePath(); ctx.fill(); });
    ctx.restore();
  }
};

/* ---------------- the boss: O TUCANÃO ---------------- */
// The Baron's giant toucan circles the warehouse, drops cashew fruit and dive-bombs Brady
// beak first... which gets stuck in the floor. That's the moment to stomp him!
const boss = {
  id: 'br_toucan', name: 'O Tucanão', hp: 4, dims: [70, 56], floats: true, music: 'tour_br_boss', country: 'br',
  brain: {
    guardText: 'TOO FLOATY!',
    wake(b) { K.say(b.g, b, 'BOM DIA! NOW GO HOME!', '#ffd84a'); },
    update(b, dt) {
      const g = b.g, p = g.player, skyY = b.floorY - b.h - 6 * TS;
      b.guard = 'bounce'; b.vx = 0;
      if (b.act === 'walk') {
        b.pose = 'fly'; b.face(); b.hover(dt, skyY, p ? p.cx : b.cx);
        if (b.at > 1.8) { b.cycle++; b.go(b.cycle % 2 ? 'dive' : 'fruit'); }
      } else if (b.act === 'fruit') {
        b.pose = 'fly'; b.hover(dt, skyY);
        if (b.at > 0.4 && !b.fired) {
          b.fired = true; Sound.play('throw');
          const n = b.hp <= 2 ? 5 : 3;
          for (let k = 0; k < n; k++) tourFire(g, b.cx + b.dir * 30, b.cy, { kind: 'cashew', vx: (k - (n - 1) / 2) * 2.2 * TS, vy: -3 * TS, grav: PHYS.gDown * 0.4, w: 14, h: 14, life: 3, thru: true, stompable: true, col: '#ff7a2a', art: (ctx, s) => { ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.ellipse(s.cx, s.cy - 2, 6, 7, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.ellipse(s.cx + 1, s.cy + 6, 4, 3, 0.4, 0, TAU); ctx.fill(); } });
        }
        if (b.at > 1.3) { b.fired = false; b.go('walk'); }
      } else if (b.act === 'dive') {
        if (b.first) { b.tx = p ? p.cx : b.cx; b.face(); }
        if (b.at < 0.7) { b.pose = 'aim'; b.hover(dt, skyY - TS); }
        else {
          b.pose = 'dive';
          const sp = (b.hp <= 2 ? 11 : 9) * TS * dt, dx = b.tx - b.cx;
          b.x += clamp(dx, -sp, sp); b.y += 12 * TS * dt;
          if (b.y + b.h >= b.floorY) { b.y = b.floorY - b.h; g.shake(8); Sound.play('stomp', { pitch: 0.6 }); g.burst(b.cx + b.dir * 30, b.floorY, 16, '#c8a070', 'debris'); b.go('stuck'); }
        }
      } else if (b.act === 'stuck') {
        b.pose = 'stuck'; if (b.first) K.say(g, b, 'MY BEAK! IT\'S STUCK!', '#ffd84a');
        b.vuln = b.at > 0.15 && b.at < 2.2; b.guard = b.vuln ? 'hurt' : 'bounce';
        if (b.at > 2.2) b.go('rise');
      } else if (b.act === 'rise') {
        b.pose = 'fly'; b.hover(dt, skyY); if (b.at > 0.9) b.go('walk');
      }
    },
    hurt(b) { b.go('rise'); K.say(b.g, b, pick(['AI, AI, AI!', 'MY FEATHERS!', 'NOT THE BEAK!']), '#ffd84a'); b.g.burst(b.cx, b.cy, 24, '#ffd23a', 'confetti'); },
    draw(b, ctx, t) {
      const x = b.cx, y = b.cy, d = b.dir, P = b.pose;
      ctx.save(); ctx.translate(x, y);
      if (P === 'dive') ctx.rotate(d * 0.9);
      if (P === 'stuck') { ctx.translate(0, 6); ctx.rotate(d * 1.1 + Math.sin(t * 14) * 0.08); }
      ctx.scale(d, 1);
      const flap = P === 'dive' ? -0.2 : P === 'aim' ? 1 : Math.sin(t * 10);
      // wings and tail
      ctx.fillStyle = '#14141c'; ctx.beginPath(); ctx.moveTo(-26, 6); ctx.lineTo(-44, 20); ctx.lineTo(-30, 22); ctx.fill();
      ctx.save(); ctx.translate(-6, -6); ctx.rotate(-0.6 - flap * 0.6); ctx.fillStyle = '#1e1e28'; ctx.beginPath(); ctx.ellipse(-16, 0, 26, 10, 0, 0, TAU); ctx.fill(); ctx.restore();
      // body, throat and eye
      ctx.fillStyle = '#14141c'; ctx.beginPath(); ctx.ellipse(0, 4, 26, 22, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.ellipse(12, -4, 12, 12, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff3d3d'; ctx.beginPath(); ctx.ellipse(10, 20, 10, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3a8aff'; ctx.beginPath(); ctx.arc(16, -12, 6, 0, TAU); ctx.fill();
      if (P === 'stuck') K.dizzy(ctx, 4, -30, t); else { ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(17, -12, 2.6, 0, TAU); ctx.fill(); }
      // the enormous beak
      const bg = ctx.createLinearGradient(20, -18, 70, 0); bg.addColorStop(0, '#ffd23a'); bg.addColorStop(0.6, '#ff8a2a'); bg.addColorStop(1, '#e8422a');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(20, -18); ctx.quadraticCurveTo(56, -22, 72, -2); ctx.quadraticCurveTo(50, -4, 20, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.moveTo(64, -8); ctx.quadraticCurveTo(70, -6, 72, -2); ctx.lineTo(62, -3); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(22, -8); ctx.quadraticCurveTo(46, -10, 70, -3); ctx.stroke();
      ctx.restore();
    }
  }
};

/* ---------------- music: samba (cavaquinho, surdo, tamborim, agogô), batucada, bossa for the falls ---------------- */
const tracks = {
  tour_br: {
    bpm: 104, bars: 8, rv: 0.25, dl: 0.1, hx: 0.06,
    ch: 'C A7 Dm G7 C A7 Dm G7',
    ld: 'E5:2 G5:1 E5:1 C6:2 A5:2 G5:4 E5:4 | C#5:2 E5:2 A5:2 G5:2 E5:8 | F5:2 A5:1 F5:1 D6:2 C6:2 A5:4 F5:4 | B4:2 D5:2 G5:2 F5:2 D5:8 |' +
        'G5:2 C6:1 G5:1 E6:2 D6:2 C6:4 G5:4 | A5:2 C#6:2 E6:2 D6:2 C#6:8 | D6:2 F6:2 A5:2 C6:2 B5:2 A5:2 G5:4 | C6:12 .:4',
    li: 'pluck', lv: 0.17,
    bp: 'r.......r.r.....', bi: 'pluckb', bv: 0.3,
    ap: '0.2.10.20.2.10.2', ai: 'pluck', av: 0.05, ao: 60,
    dr: ['k.......K.......', 'r..r..r...r..r..', 'n.n.n.n.n.n.n.n.', '..b...d...b.b.d.'], dv: 0.42
  },
  tour_br_night: {
    bpm: 124, bars: 8, rv: 0.25, hx: 0.08,
    ch: 'Am D7 G C Am D7 E7 Am',
    ld: 'A5:2 C6:2 E6:2 C6:2 A5:4 E5:4 | F#5:2 A5:2 D6:2 A5:2 F#5:8 | G5:2 B5:2 D6:2 B5:2 G5:4 D5:4 | E5:2 G5:2 C6:2 G5:2 E5:8 |' +
        'A5:2 C6:2 E6:4 D6:2 C6:2 A5:4 | D6:2 C6:2 A5:2 F#5:2 D5:8 | E5:2 G#5:2 B5:2 D6:2 E6:4 B5:4 | A5:12 .:4',
    li: 'whistle', lv: 0.13,
    bp: 'r...r.r.r...r.f.', bi: 'sub', bv: 0.3,
    ap: 'c-..c.c-..c.c-..', ai: 'pluck', av: 0.05, ao: 60,
    dr: ['K...k...K...k.k.', 'r.rr.r.rr.r.r.rr', 'n.nnn.nnn.nnn.nn', 'b..d..b...d.b..d', '..s.......s.....'], dv: 0.45
  },
  tour_br_falls: {
    bpm: 92, bars: 8, rv: 0.45, dl: 0.18,
    ch: 'Dm7 G7 Cmaj7 Am7 Dm7 G7 Cmaj7 Cmaj7',
    ld: 'A5:3 F5:1 A5:2 C6:2 D6:8 | B5:3 G5:1 B5:2 D6:2 F6:8 | E6:4 D6:2 C6:2 B5:4 G5:4 | A5:12 .:4 | F5:2 A5:2 C6:2 E6:2 D6:8 | B5:2 D6:2 F6:2 A6:2 G6:8 | E6:4 G6:2 E6:2 C6:4 G5:4 | C6:12 .:4',
    li: 'ep', lv: 0.13,
    bp: 'r..r....r..r....', bi: 'sub', bv: 0.24,
    ap: '0.2.1.3.0.2.1.3.', ai: 'pluck', av: 0.035, ao: 64,
    dr: ['k.....k.k.......', '..r..r....r..r..', 'n.n.n.n.n.n.n.n.'], dv: 0.3
  },
  tour_br_boss: {
    bpm: 164, bars: 8, rv: 0.2, hx: 0.1,
    ch: 'Dm Dm Gm A7 Dm Dm Bb A7',
    ld: 'D6:2 F6:2 A6:2 F6:2 D6:2 A5:2 F5:4 | D5:2 F5:2 A5:2 D6:2 C#6:8 | Bb5:2 D6:2 G6:2 D6:2 Bb5:2 G5:2 D5:4 | E5:2 G5:2 A5:2 C#6:2 E6:8 |' +
        'F6:2 E6:2 D6:2 C6:2 A5:4 F5:4 | D5:2 F5:2 A5:4 D6:8 | Bb5:2 A5:2 G5:2 F5:2 E5:4 C#5:4 | D5:12 .:4',
    li: 'brass', lv: 0.16,
    bp: 'r.r.r.o.r.r.r.f.', bi: 'sawb', bv: 0.28,
    ap: 'c-.c-.c-c-.c-.c-', ai: 'pluck', av: 0.05, ao: 58,
    dr: ['K...k...K...k...', 'r.rr.r.rr.r.r.rr', 'n.n.n.n.n.n.n.n.', '....s.......s...'], dv: 0.45
  }
};

/* ---------------- the five levels ---------------- */
Tour.country({
  id: 'br', colors: COL, tagline: 'Beaches, carnival, waterfalls and wetlands',
  themes, painters, decor, decorLights, beatArt, platforms, enemies, entities, pieces: P, boss, power, tracks,
  music: { level: 'tour_br', boss: 'tour_br_boss' },
  landmark: 'Sugarloaf Mountain',
  arrival: 'Brady! The Baron is trying to fit Sugarloaf Mountain into a carnival float. Hurry! ♥ C',
  coin: { name: 'PÃO DE QUEIJO', draw(ctx, x, y) {
    ctx.fillStyle = '#e8b85a'; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f8d88a'; ctx.beginPath(); ctx.arc(x - 1, y - 1.5, 6.5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(160,100,30,0.45)'; for (const [dx, dy] of [[-3, -2], [2, 1], [-1, 3], [3, -3]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.1, 0, TAU); ctx.fill(); }
  } },
  star: { name: 'GOLDEN TOUCAN', draw(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(Math.cos(t * 3) > 0 ? 1 : -1, 1);
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.ellipse(-2, 2, 8, 9, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, -4); ctx.quadraticCurveTo(14, -6, 16, 0); ctx.quadraticCurveTo(10, 0, 4, 1); ctx.fill();
    ctx.fillStyle = '#c8901a'; ctx.beginPath(); ctx.arc(1, -3, 1.6, 0, TAU); ctx.fill();
    ctx.restore();
  } },
  levels: [
    { name: 'Copacabana Boardwalk', style: 'run', theme: 'br_beach', gimmick: 'The wavy mosaic boardwalk: kiosk umbrellas to bounce up, crumbling sandcastles, a beach-ball bounce and snack-stealing gulls',
      enemies: [['brCrab', 3], ['brCoconut', 2], ['brBrigadeiro', 2]],
      hint: 'Kick the football at crabs and coconuts. It bounces off walls!',
      postcard: 'Copacabana! The sidewalk waves look like the sea. I bought you a coconut. I drank it. ♥ C',
      script: [['flat', { n: 5 }], 'sig', 'kiosks', 'gap', 'sandcastle', 'crabs', 'cp', ['volley', { gold: true }], 'kiosks', 'gulls', 'sandcastle', 'bonus', ['crabs', { n: 3 }], 'end'] },
    { name: 'Sambadrome Night', style: 'night', theme: 'br_samba', gimmick: 'The whole avenue moves to the samba beat: surdo drums pop up on the beat, parade floats glide over gaps, tambourines roll',
      enemies: [['brPandeiro', 3], ['brBrigadeiro', 1]], bpm: 124,
      hint: 'The drums pop up on the beat: listen and jump!',
      postcard: 'The Baron hid in a parade float. Everyone thought he was part of the show. ♥ C',
      script: [['flat', { n: 6 }], 'drums', ['parade', { item: 'power' }], ['float', { gold: true }], ['drums', { n: 5 }], 'stands', 'cp', 'parade', 'float', ['drums', { n: 6 }], 'lsd', ['parade', { n: 3 }], 'end'] },
    { name: 'Iguaçu Falls', style: 'climb', theme: 'br_falls', gimmick: 'Climb beside the roaring falls: slippery wet rocks, tumbling logs, mist that lifts you, and coatis that steal your coins',
      enemies: [['brCoati', 2]], W: 24, H: 100,
      hint: 'Coatis steal coins! Stomp them to get your coins back',
      postcard: 'Iguaçu is so loud I can\'t hear myself think. A coati took my sandwich. ♥ C',
      script: [['wetrocks', { gold: true }], ['walkway', {}], ['logs', {}], ['mist', { left: true }], ['wetrocks', { n: 3 }], ['logs', { left: true }], ['walkway', { n: 2 }], ['mist', {}], ['wetrocks', {}]] },
    { name: 'Pantanal Wetlands', style: 'run', theme: 'br_pantanal', gimmick: 'Ride swimming capybaras, hop sinking caiman backs, dodge leaping piranhas and charging jaguars',
      enemies: [['brJaguar', 1], ['brCoati', 1], ['brCrab', 1]],
      hint: 'Capybaras are the best boats. Caimans are NOT boats.',
      postcard: 'A capybara gave me a ride. A bird was riding on IT. We were a tower of friends. ♥ C',
      script: [['flat', { n: 5 }], 'capybaras', 'jaguar', 'caimans', ['nest', { gold: true }], 'piranhas', 'cp', ['capybaras', { span: 12 }], 'sig', ['caimans', { n: 4 }], 'jaguar', 'piranhas', 'oneup', 'end'] },
    { name: 'Carnival Warehouse', style: 'castle', theme: 'br_barracao', gimmick: 'The float workshop: spinning turntables, confetti cannons and drum platforms on the beat, then O Tucanão',
      enemies: [['brPandeiro', 2], ['brBrigadeiro', 2]], boss: 'br_toucan', arena: 'barracao', arenaW: 26, bpm: 124,
      hint: 'When O Tucanão\'s beak gets stuck in the floor, stomp him!',
      postcard: 'Sugarloaf is back by the bay, full size! The Baron sailed for Africa. Next stop: Mozambique! ♥ C',
      script: [['flat', { n: 4 }], ['turntable', { gold: true }], 'cannons', ['bateria', { n: 4 }], 'cp', 'turntable', ['enemies', { n: 2 }], ['cannons', { gold: true }], ['blocks', { content: 'power' }], 'arena'] }
  ]
});
})();
