/* ============================================================
   BRAZIL (world 3): the six levels in the v2 format
   (docs/design/LEVEL_OVERHAUL.md §2 World 3, §3.2, §4.3).
   3-1 Samba Sunrise       BEAT    the avenue at dawn moves to 124 bpm: drums, stepping floats, light floor
   3-2 Coati Caper         THIEF   Quati grabs the stamps and runs through the Pantanal
   3-3 Iguaçu Falls        TOWER   facade climb beside three falls; rainbow bridges in the mist
   3-4 Lençóis Lagoons     TIDE    white dunes, rain lagoons rise and fall
   3-5 Estádio do Tucanão  LAIR    the players' tunnel teaches the ball, then O Tucanão's pitch
   3-6 Rio Hang-Glide      GLIDE   (secret) thermals over Copacabana, Sugarloaf behind (no statue)
   Loads after 29_tour_br.js (art, old pieces, enemies, the boss) and
   replaces its level list with Tour.amend. New themes, enemies,
   pieces, skins and stamps for these levels live here.
   ============================================================ */
(() => {
const C = Tour.countries.br;
if (!C) return;
const K = TourKit;
const CARN = ['#ff3d8b', '#ffd23a', '#2ad8a0', '#3a8aff', '#ff7a2a', '#b84aff'];
const BRF = ['#1aa85a', '#ffd23a', '#2a5ad8'];   // green, yellow, blue
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };

/* ================= themes ================= */
// a theme that reuses another theme's pre-rendered strips (same layer order) with its own sky and light
const borrow = (srcKey, atlas, over, extraFar, extraNear) => {
  const src = THEMES[srcKey];
  const lay = (src.layers || []).map((L, i) => L.kind === 'image' ? L : ({ kind: 'image', atlas, id: 'L' + i, f: L.f, base: L.base, dyn: L.dyn, color: L.color, fallback: L, shift: L.base > 340 ? -Math.min(60, L.base - 335) : 0 }));
  const th = Object.assign({}, src, over, { layers: (extraFar || []).concat(lay, extraNear || []) });
  if (typeof Atlas !== 'undefined') Atlas.applyTiles(th, atlas, { ground: 'ground' });
  return th;
};
const painters = {
  // dawn over the Sambadrome: a pale band of sky with long pink clouds
  brDawnClouds(ctx, L, rng, H) {
    for (let k = 0; k < 9; k++) {
      const x = rng() * BG_W, y = L.base - 40 - rng() * 120, w = 120 + rng() * 160;
      wrapDraw(x - w / 2, w, xx => { ctx.fillStyle = rgba(L.color, 0.35 + rng() * 0.25); ctx.beginPath(); ctx.ellipse(xx + w / 2, y, w / 2, 7 + rng() * 5, 0, 0, TAU); ctx.fill(); });
    }
  },
  // Lençóis: rows of white dune ridges with blue rain lagoons in the troughs
  brLencoisFar(ctx, L, rng, H) {
    ctx.fillStyle = L.color;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 8) ctx.lineTo(x, L.base - 26 - Math.sin(x / BG_W * TAU * 3) * 14 - Math.sin(x / BG_W * TAU * 7 + 1) * 6);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    for (let k = 0; k < 6; k++) { const x = (k + 0.3) * BG_W / 6; wrapDraw(x - 60, 120, xx => { const g = ctx.createLinearGradient(0, L.base - 10, 0, L.base + 8); g.addColorStop(0, '#5ad0f0'); g.addColorStop(1, '#1a8ac8'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(xx + 60, L.base, 60, 8, 0, 0, TAU); ctx.fill(); }); }
  },
  brLencoisNear(ctx, L, rng, H) {
    for (let k = 0; k < 5; k++) {
      const x0 = k * BG_W / 5 + rng() * 40, w = 260 + rng() * 120, h = 60 + rng() * 40;
      wrapDraw(x0, w, xx => {
        const g = ctx.createLinearGradient(xx, 0, xx + w, 0); g.addColorStop(0, '#fffaf0'); g.addColorStop(0.55, '#f4ecd8'); g.addColorStop(1, '#d8ccb0');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(xx, L.base + 30); ctx.quadraticCurveTo(xx + w * 0.4, L.base - h, xx + w * 0.62, L.base - h * 0.9); ctx.quadraticCurveTo(xx + w * 0.8, L.base - h * 0.4, xx + w, L.base + 30); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(200,180,140,0.5)'; ctx.lineWidth = 1.2; for (let r = 1; r < 4; r++) { ctx.beginPath(); ctx.moveTo(xx + w * 0.2, L.base + 20 - r * 12); ctx.quadraticCurveTo(xx + w * 0.45, L.base - h * 0.6 + r * 10, xx + w * 0.6, L.base - h * 0.75 + r * 14); ctx.stroke(); }
      });
    }
    ctx.fillStyle = shade(L.color, -0.05); ctx.fillRect(0, L.base + 26, BG_W, H - L.base);
  },
  // a sea-breeze sky band of puffy clouds (Rio)
  brPuffs(ctx, L, rng, H) {
    for (let k = 0; k < 7; k++) { const x = rng() * BG_W, y = L.base - rng() * 80; wrapDraw(x - 80, 160, xx => { ctx.fillStyle = rgba('#ffffff', 0.75); for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.arc(xx + 30 + q * 25, y - Math.sin(q) * 12, 22 + (q % 2) * 8, 0, TAU); ctx.fill(); } }); }
  },
  // floodlight towers over the stadium
  brFloodlights(ctx, L, rng, H) {
    for (let x = 60; x < BG_W; x += 340) wrapDraw(x - 30, 60, xx => {
      ctx.fillStyle = L.color; ctx.fillRect(xx + 26, L.base - 230, 8, 230);
      ctx.fillStyle = '#3a3a48'; rr(ctx, xx, L.base - 262, 60, 34, 4); ctx.fill();
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.arc(xx + 9 + c * 14, L.base - 253 + r * 15, 5, 0, TAU); ctx.fill(); }
      const g = ctx.createLinearGradient(0, L.base - 260, 0, L.base); g.addColorStop(0, 'rgba(255,248,210,0.35)'); g.addColorStop(1, 'rgba(255,248,210,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(xx + 4, L.base - 236); ctx.lineTo(xx - 70, L.base); ctx.lineTo(xx + 130, L.base); ctx.lineTo(xx + 56, L.base - 236); ctx.fill();
    });
  }
};
Object.assign(BGPaint, painters);
const sambaGround = THEMES.br_samba.ground;
const T_ = {};
// 3-1: the Sambadrome avenue at sunrise, the night's lights still on
T_.br_samba_dawn = borrow('br_samba', 'br_samba', {
  name: 'Samba Sunrise', music: 'tour_br_night', particles: 'confetti',
  sky: ['#ff8a6a', '#ffc08a', '#fff0c8'], horizonGlow: '#ffd890',
  celestial: { type: 'sun', x: 0.82, y: 0.62, r: 46, color: '#fff2c0', glow: '#ffb070' }, stars: 0.06,
  fog: '#ffc8a0'
}, [{ kind: 'brDawnClouds', color: '#ff9aa8', base: 220, f: 0.02 }]);
T_.br_samba_dawn.layers[2] = Object.assign({}, T_.br_samba_dawn.layers[2], { shift: 70 });
// 3-4: the white dunes of Lençóis Maranhenses with their rain lagoons
T_.br_lencois = Object.assign({}, THEMES.br_beach, {
  name: 'Lençóis Maranhenses', music: 'tour_br', particles: 'dust', liquid: null,
  sky: ['#3a9ae8', '#8ad4ff', '#f0fbff'], horizonGlow: '#ffffff',
  celestial: { type: 'sun', x: 0.25, y: 0.14, r: 36, color: '#fffbe8', glow: '#fff0b0' }, stars: 0, cloudsDyn: true,
  layers: [{ kind: 'brLencoisFar', color: '#e8e0cc', base: 320, f: 0.05 }, { kind: 'brLencoisNear', color: '#f4ecd8', base: 360, f: 0.22 }],
  fog: '#e8f6ff', decor: ['brDuneGrass', 'brShell', 'brDuneGrass'],
  ground: { style: 'grass', cap: '#fbf4e2', capHi: '#ffffff', dirt: '#eadcb8', dirt2: '#d6c49a', rock: '#c8b488',
    paint(ctx, rng) { ctx.fillStyle = 'rgba(190,160,110,0.25)'; for (let k = 0; k < 9; k++) ctx.fillRect(rng() * TS, rng() * TS, 2, 1.5); },
    paintCap(ctx, x0, x1) { ctx.fillStyle = '#fffaf0'; ctx.fillRect(x0, 0, x1 - x0, 8); ctx.strokeStyle = 'rgba(200,170,120,0.55)'; ctx.lineWidth = 1; for (let r = 0; r < 2; r++) { ctx.beginPath(); for (let x = x0; x <= x1; x += 2) ctx.lineTo(x, 4 + r * 3 + Math.sin(x * 0.3 + r) * 1); ctx.stroke(); } } },
  semi: { style: 'plank', c1: '#c89a5a', c2: '#8a5e2a' }, hard: { c1: '#e0d0a8', c2: '#b8a070' }
});
// 3-6: Rio from the air: Sugarloaf (no statue anywhere), the bay and the beach palms
T_.br_rio_sky = borrow('br_beach', 'br_beach', {
  name: 'Rio Hang-Glide', music: 'tour_br', particles: 'motes',
  sky: ['#1a7ae0', '#6ac4ff', '#e8f8ff'], horizonGlow: '#fff6d8',
  celestial: { type: 'sun', x: 0.7, y: 0.1, r: 38, color: '#fffbe0', glow: '#ffe8a0' }, stars: 0, cloudsDyn: true, fog: '#e0f4ff'
}, [{ kind: 'brPuffs', color: '#ffffff', base: 150, f: 0.015 }]);
// 3-5 arena: the stadium at golden hour, stands full, floodlights coming on
T_.br_estadio = borrow('br_samba', 'br_samba', {
  name: 'Estádio do Tucanão', music: 'tour_br_boss', particles: 'confetti',
  sky: ['#3a2a7a', '#e86a6a', '#ffd08a'], horizonGlow: '#ffb070',
  celestial: { type: 'sun', x: 0.15, y: 0.55, r: 40, color: '#ffe0a0', glow: '#ff8a5a' }, stars: 0.15, fog: '#ffb890',
  ground: { style: 'grass', cap: '#3ab84a', capHi: '#7ae07a', dirt: '#5a8a3a', dirt2: '#3a6a2a', rock: '#6a5a3a',
    paintCap(ctx, x0, x1) { ctx.fillStyle = '#34a844'; ctx.fillRect(x0, 0, x1 - x0, 9); ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = x0; x < x1; x += 16) ctx.fillRect(x, 0, 8, 9); ctx.fillStyle = '#f4fff0'; ctx.fillRect(x0, 1, x1 - x0, 1.5); } }
}, [{ kind: 'brFloodlights', color: '#4a4a5a', base: 330, f: 0.06 }]);
// the stadium keeps its own grass (no atlas floor)
delete T_.br_estadio.atlas;
T_.br_estadio.ground = { style: 'grass', cap: '#3ab84a', capHi: '#7ae07a', dirt: '#5a8a3a', dirt2: '#3a6a2a', rock: '#6a5a3a',
  paintCap(ctx, x0, x1) { ctx.fillStyle = '#34a844'; ctx.fillRect(x0, 0, x1 - x0, 9); ctx.fillStyle = 'rgba(255,255,255,0.16)'; for (let x = x0; x < x1; x += 16) ctx.fillRect(x, 0, 8, 9); ctx.fillStyle = '#f4fff0'; ctx.fillRect(x0, 1, x1 - x0, 1.5); } };
T_.br_estadio.atlas = 'br_samba';   // the stands strip still comes from the Sambadrome atlas
// interiors: the float workshop, the coati's den, the cave behind the falls, the raft, the locker room, the kiosk
const room = (base, over) => Object.assign({}, THEMES[caveVariant(base)], over);
T_.br_workshop = Object.assign({}, THEMES.br_barracao, { name: 'Barracão', music: 'secret', decor: ['brMask'], particles: 'confetti' });
T_.br_toca = room('br_pantanal', { name: 'Quati\'s Den', ground: Object.assign({}, THEMES.br_pantanal.ground, { cap: '#7a5a34', capHi: '#9a7a4a' }), accent: '#ffd23a' });
T_.br_garganta = room('br_falls', { name: 'Behind the Falls', particles: 'bubbles', sky: ['#0a1a2a', '#123a4a', '#1a5a6a'] });
T_.br_jangada = Object.assign({}, THEMES.br_barracao, { name: 'Jangada', music: 'secret', sky: ['#2a1a10', '#4a3020', '#6a4a2a'], decor: [], ground: { style: 'plank', cap: '#b8844a', capHi: '#d8a466', dirt: '#8a5a2a', dirt2: '#6a4220', rock: '#5a3a1a' }, hard: { c1: '#a07040', c2: '#6a4220' } });
T_.br_vestiario = Object.assign({}, THEMES.br_barracao, { name: 'Vestiário', music: 'secret', decor: [], sky: ['#1a2a3a', '#2a3a4a', '#3a4a5a'], ground: { style: 'metal', cap: '#8a9aa8', capHi: '#c8d4e0', dirt: '#5a6a78', dirt2: '#3a4a58', rock: '#6a7a88' } });
T_.br_quiosque = Object.assign({}, THEMES.br_barracao, { name: 'Quiosque', music: 'secret', decor: ['brCooler'], sky: ['#1a4a6a', '#2a6a8a', '#4a8aa8'], ground: Object.assign({}, THEMES.br_beach.ground) });
Object.assign(THEMES, T_);
THEMES.br_falls.semi = { style: 'plank', c1: '#8a5a32', c2: '#4a2c16' };

/* ================= decor ================= */
const decor = {
  // green-yellow-blue bunting strung between two poles
  brBunting(ctx, x, y, t) {
    const w = 150, x0 = x - w / 2, top = y - 120;
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x0 - 2, top, 4, 120); ctx.fillRect(x0 + w - 2, top, 4, 120);
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, top + 4); ctx.quadraticCurveTo(x, top + 26, x0 + w, top + 4); ctx.stroke();
    for (let k = 0; k < 10; k++) { const u = (k + 0.5) / 10, px = x0 + u * w, py = top + 4 + Math.sin(u * Math.PI) * 22 * 0.95, sw = Math.sin(t * 3 + k) * 1.5; ctx.fillStyle = BRF[k % 3]; ctx.beginPath(); ctx.moveTo(px - 6, py); ctx.lineTo(px + 6, py); ctx.lineTo(px + sw, py + 13); ctx.closePath(); ctx.fill(); }
  },
  // a surdo drum stack by the avenue
  brSurdos(ctx, x, y) {
    for (const [dx, dy, r] of [[-12, 0, 13], [12, 0, 13], [0, -22, 12]]) {
      ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x + dx - r, y + dy - 20, r * 2, 20); ctx.fillStyle = '#f4f0e4'; ctx.beginPath(); ctx.ellipse(x + dx, y + dy - 20, r, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = CARN[(dx + 20) % 6]; ctx.fillRect(x + dx - r, y + dy - 13, r * 2, 5);
    }
  },
  // the bell-gate arch: two striped posts and a crown of feathers over the gate column
  brBellArch(ctx, x, y, t, th, d) {
    const top = y - d.h, cx = x;
    ctx.fillStyle = '#ffd23a'; rr(ctx, cx - 18, top - 10, 36, 14, 6); ctx.fill();
    for (let k = 0; k < 7; k++) { ctx.fillStyle = CARN[k % 6]; ctx.save(); ctx.translate(cx, top - 6); ctx.rotate(-1.1 + k * 0.37 + Math.sin(t * 2 + k) * 0.05); ctx.beginPath(); ctx.ellipse(0, -16, 4, 16, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    for (let yy = top + 4; yy < y - 96; yy += 16) { ctx.fillStyle = (Math.floor(yy / 16) % 2) ? '#1aa85a' : '#ffd23a'; ctx.fillRect(cx - 14, yy, 28, 16); }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(cx + 8, top + 4, 6, d.h - 100);
  },
  // dune grass tufts
  brDuneGrass(ctx, x, y) { ctx.strokeStyle = '#8aa84a'; ctx.lineWidth = 1.6; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x + k * 2, y); ctx.quadraticCurveTo(x + k * 4, y - 10, x + k * 6, y - 14 - Math.abs(k)); ctx.stroke(); } },
  // a coati's stash of stolen snacks (the toca)
  brStash(ctx, x, y) {
    ctx.fillStyle = '#8a5a2a'; ctx.beginPath(); ctx.ellipse(x, y - 6, 22, 9, 0, Math.PI, TAU); ctx.fill();
    for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? '#e8b85a' : '#f8d88a'; ctx.beginPath(); ctx.arc(x - 15 + k * 5, y - 10 - (k % 3) * 4, 4.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ff3d8b'; ctx.fillRect(x + 8, y - 22, 9, 7); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 10, y - 20, 5, 1.5);
  },
  // a hanging root curtain in the den
  brRoots(ctx, x, y, t) { ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x - 20 + k * 10, y - 120); ctx.quadraticCurveTo(x - 18 + k * 10 + Math.sin(t + k) * 3, y - 80, x - 22 + k * 10, y - 40 - (k % 3) * 12); ctx.stroke(); } },
  // a ranger post sign by the finish (Pantanal)
  brRangerHut(ctx, x, y) {
    ctx.fillStyle = '#7a5230'; ctx.fillRect(x - 34, y - 46, 68, 46); ctx.fillStyle = '#5a3a1a'; for (let k = 0; k < 5; k++) ctx.fillRect(x - 34, y - 44 + k * 9, 68, 2);
    ctx.fillStyle = '#c8783a'; ctx.beginPath(); ctx.moveTo(x - 44, y - 44); ctx.lineTo(x, y - 70); ctx.lineTo(x + 44, y - 44); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 8, y - 30, 16, 30); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 28, y - 38, 14, 10);
  },
  // the overlook at the top of the falls: a railing and a little viewing deck
  brOverlook(ctx, x, y) {
    ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 80, y - 22); ctx.lineTo(x + 80, y - 22); ctx.stroke();
    ctx.lineWidth = 2; for (let k = -80; k <= 80; k += 16) { ctx.beginPath(); ctx.moveTo(x + k, y - 22); ctx.lineTo(x + k, y); ctx.stroke(); }
  },
  // a beach umbrella and cooler on the Copacabana landing
  brBeachSet(ctx, x, y, t) {
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x - 1.5, y - 48, 3, 48);
    ctx.save(); ctx.beginPath(); ctx.moveTo(x - 34, y - 40); ctx.quadraticCurveTo(x, y - 66, x + 34, y - 40); ctx.closePath(); ctx.clip();
    for (let k = -4; k < 5; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#ff3d8b'; ctx.beginPath(); ctx.moveTo(x, y - 66); ctx.lineTo(x + k * 10, y - 38); ctx.lineTo(x + (k + 1) * 10, y - 38); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = '#2a8aff'; rr(ctx, x + 10, y - 13, 20, 13, 2); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 10, y - 13, 20, 3);
  },
  // a wall of lockers (vestiário)
  brLockers(ctx, x, y) { for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#2a8a5a' : '#1a7a4a'; ctx.fillRect(x - 64 + k * 32, y - 92, 30, 92); ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let r = 0; r < 3; r++) ctx.fillRect(x - 58 + k * 32, y - 84 + r * 5, 18, 2); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 40 + k * 32, y - 50, 3, 8); } },
  // a kit hanger with a yellow shirt
  brKit(ctx, x, y) { ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(x - 14, y - 60); ctx.lineTo(x - 24, y - 50); ctx.lineTo(x - 18, y - 44); ctx.lineTo(x - 13, y - 48); ctx.lineTo(x - 13, y - 20); ctx.lineTo(x + 13, y - 20); ctx.lineTo(x + 13, y - 48); ctx.lineTo(x + 18, y - 44); ctx.lineTo(x + 24, y - 50); ctx.lineTo(x + 14, y - 60); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1aa85a'; ctx.fillRect(x - 13, y - 58, 26, 3); ctx.font = `bold 11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillStyle = '#1a5a2a'; ctx.fillText('10', x, y - 32); }
};
Object.assign(Decor, decor);
Object.assign(TOUR_DECOR_LIGHTS, { brBunting: [70, '#ffe0a0', -100] });

/* ================= enemies (new or reworked for the v2 levels) ================= */
// O pandeiro rolls on the beat: a burst of speed on every beat, an idle shimmy between
const pandeiroArt = ENTITY_TYPES.brPandeiro.cfg.art;
const brigadeiroArt = ENTITY_TYPES.brBrigadeiro.cfg.art;
const beatOf = g => (g.area && g.area.beat ? g.beatNow() : g.t * 2);
const PANDEIRO = { w: 26, h: 26, speed: 2.0, behavior: 'walk', art: pandeiroArt, burst: '#c8a060',
  think(e, dt) { const b = beatOf(e.g), ph = b % 1; e.mode = 'walk'; e.vx = e.dir * e.speed * (ph < 0.35 ? 2.2 : 0.25); if (e.hitWall) e.dir = -e.dir; } };
// brigadeiros: three truffles stack into a tower and topple toward Brady
const BRIGADEIRO = { w: 20, h: 22, speed: 1.0, behavior: 'stacker', n: 3, art: brigadeiroArt, burst: '#4a2416' };
// a scarlet macaw that patrols the sky and swoops
const parrotArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const f = Math.sin(e.t * (m === 'swoop' ? 14 : 8));
  ctx.fillStyle = '#2a6ad8'; ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(-24, 8); ctx.lineTo(-20, 2); ctx.lineTo(-26, 0); ctx.lineTo(-6, -2); ctx.fill();
  ctx.fillStyle = '#e8302a'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 7, -0.15, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(-2, -3); ctx.rotate(-0.4 - f * 0.7); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(-6, -4, 11, 5, -0.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a6ad8'; ctx.beginPath(); ctx.ellipse(-12, -8, 7, 3.5, -0.6, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#e8302a'; ctx.beginPath(); ctx.arc(9, -5, 6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff4e8'; ctx.beginPath(); ctx.ellipse(11, -5, 3.5, 3, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.moveTo(13, -6); ctx.quadraticCurveTo(19, -6, 17, 0); ctx.lineTo(13, -2); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(10.5, -6, 1.3, 0, TAU); ctx.fill();
  ctx.restore();
};
// the three-toed sloth: hangs from a branch, drops with a smug smile, climbs back comically slowly
const slothArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y);
  const hang = m === 'hang' || m === 'tell' || m === 'climb', flat = m === 'flat';
  if (flat) ctx.scale(1.3, 0.45);
  if (hang) { ctx.translate(0, -e.h); ctx.scale(1, -1); ctx.translate(0, -e.h * 0.2); }
  ctx.fillStyle = '#9a8060'; ctx.beginPath(); ctx.ellipse(0, -12, 13, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#7a6448'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(-9 + k * 3.6, -4 - (k % 2) * 3, 2, 5, 0.3, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#8a7052'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 8, -16); ctx.lineTo(s * 13, hang ? -28 : -2); ctx.stroke(); }
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.4; for (const s of [-1, 1]) for (let c = -1; c <= 1; c++) { ctx.beginPath(); ctx.moveTo(s * 13 + c * 1.5, hang ? -28 : -2); ctx.lineTo(s * 13 + c * 2.5, hang ? -33 : 2); ctx.stroke(); }
  ctx.lineCap = 'butt';
  // face: the mask and the smug smile (upright even while hanging)
  ctx.save(); ctx.translate(0, -13); if (hang) ctx.scale(1, -1);
  ctx.fillStyle = '#f0e0c0'; ctx.beginPath(); ctx.ellipse(0, -2, 8.5, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3a2a1a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 4, -3, 3.4, 2, s * -0.4, 0, TAU); ctx.fill(); }
  if (m === 'stuck' || m === 'flat') { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 4 - 1.5, -4.5); ctx.lineTo(s * 4 + 1.5, -1.5); ctx.moveTo(s * 4 + 1.5, -4.5); ctx.lineTo(s * 4 - 1.5, -1.5); ctx.stroke(); } }
  else { ctx.fillStyle = '#ffffff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 4 + 0.6, -3.2, 0.9, 0, TAU); ctx.fill(); } }
  ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.ellipse(0, 1, 1.8, 1.2, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(1, 2.5, 3.4, 0.15, Math.PI - 0.6); ctx.stroke();
  ctx.restore();
  ctx.restore();
};
// the sooty swift: hovers behind the water curtain, aims (a glint), darts
const swiftArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  const f = m === 'dart' ? -0.2 : Math.sin(e.t * 22);
  ctx.fillStyle = '#3a3a48'; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-12, -6 - f * 8, -24, -4 - f * 10); ctx.quadraticCurveTo(-12, 2, -4, 3); ctx.fill();
  ctx.beginPath(); ctx.moveTo(2, 0); ctx.quadraticCurveTo(10, -6 - f * 8, 20, -4 - f * 10); ctx.quadraticCurveTo(10, 2, 4, 3); ctx.fill();
  ctx.fillStyle = '#2a2a36'; ctx.beginPath(); ctx.ellipse(0, 1, 9, 4.5, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-8, 1); ctx.lineTo(-15, -2); ctx.lineTo(-13, 3); ctx.fill();
  ctx.fillStyle = '#c8c8d8'; ctx.beginPath(); ctx.ellipse(6, 2, 3, 2, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(7, -1, 1.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(7.4, -1, 0.8, 0, TAU); ctx.fill();
  ctx.restore();
};
// red-bellied piranhas: a leader and its school (swarm), in the lagoons
const piranhaSchoolArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || -1, 1);
  ctx.fillStyle = '#8a9aa8'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8422a'; ctx.beginPath(); ctx.ellipse(1, 3, 8, 4, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#8a9aa8'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-17, -6); ctx.lineTo(-17, 6); ctx.fill();
  ctx.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(6 + k * 1.5, 2); ctx.lineTo(6.7 + k * 1.5, 4.5); ctx.lineTo(7.4 + k * 1.5, 2); ctx.fill(); }
  K.eyes(ctx, 5, -3, 1, 2, 1.8, true);
  ctx.restore();
};
// a striped beach kite that drifts on the sea breeze (its tail stings)
const kiteArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y);
  ctx.rotate(Math.sin(e.t * 2) * 0.15);
  const c = CARN[(e.seedK || 0) % 6];
  ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(10, 0); ctx.lineTo(0, 14); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(10, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 14);
  for (let k = 1; k < 6; k++) ctx.lineTo(Math.sin(e.t * 5 + k) * 5, 14 + k * 6); ctx.stroke();
  for (let k = 1; k < 6; k += 2) { ctx.fillStyle = CARN[(k + 2) % 6]; ctx.beginPath(); ctx.moveTo(Math.sin(e.t * 5 + k) * 5 - 3, 14 + k * 6); ctx.lineTo(Math.sin(e.t * 5 + k) * 5 + 3, 14 + k * 6 - 2); ctx.lineTo(Math.sin(e.t * 5 + k) * 5 + 3, 14 + k * 6 + 2); ctx.fill(); }
  K.eyes(ctx, 0, -2, 1, 3, 1.8, m === 'swoop');
  ctx.restore();
};
ENTITY_TYPES.brPiranha.cfg.sprite = ENTITY_TYPES.brPiranha.cfg.sprite || 'piranha';
const enemies = {
  brPandeiro: { cls: TourEnemy.make(PANDEIRO), place: 'walk' },
  brBrigadeiro: { cls: TourEnemy.make(BRIGADEIRO), place: 'walk' },
  brParrot: { cls: TourFlyer.make({ w: 28, h: 16, range: 4, speed: 1.0, swoop: true, art: parrotArt, burst: '#e8302a' }), place: 'fly' },
  brSloth: { cls: TourEnemy.make({ w: 26, h: 26, speed: 0.5, behavior: 'ceilingDrop', tell: 0.6, stuckT: 2.5, climbSpeed: 0.6, art: slothArt, burst: '#9a8060' }), place: 'here' },
  brSwift: { cls: TourFlyer.make({ w: 26, h: 12, range: 7, speed: 1.0, behavior: 'hoverDart', art: swiftArt, burst: '#3a3a48' }), place: 'here' },
  brPiranha: { cls: TourSwimmer.make({ w: 22, h: 16, speed: 1.2, behavior: 'swarm', n: 4, range: 4, art: piranhaSchoolArt, burst: '#e8422a' }), place: 'swim' },
  brPiranhaLeap: { cls: ENTITY_TYPES.brPiranha, place: 'here' },
  brKite: { cls: TourFlyer.make({ w: 22, h: 30, range: 3, speed: 0.7, swoop: true, art: kiteArt, burst: '#ffd23a', init(e) { e.seedK = Math.floor(Math.random() * 6); } }), place: 'fly' }
};
for (const k in enemies) { ENTITY_TYPES[k] = enemies[k].cls; Tour.enemyInfo[k] = { place: enemies[k].place, country: 'br' }; }
// swifts start hidden behind the falls' curtain: a dark shape until Brady is close
{
  const S0 = ENTITY_TYPES.brSwift, dr = S0.prototype.draw;
  S0.prototype.draw = function (ctx) { const p = this.g.player, near = p && Math.abs(p.cx - this.cx) < 6 * TS && Math.abs(p.cy - this.cy) < 6 * TS; this.seen = this.seen || near; if (!this.seen && !this.dead) { ctx.save(); ctx.globalAlpha = 0.22; dr.call(this, ctx); ctx.restore(); return; } dr.call(this, ctx); };
}

/* ================= entities ================= */
// 3-1: a parade float that steps on the bar (one step per bar, eased over half a beat), back and forth
const MPlat = ENTITY_TYPES.mplat;
class BrBeatFloat extends MPlat {
  constructor(g, s) { super(g, Object.assign({}, s, { ax: 0, ay: 0 })); this.steps = s.steps || 3; this.step = (s.stepT || 3) * TS; this.ph = s.ph || 0; }
  place() {
    const g = this.g, b = beatOf(g) + this.ph * 4, bar = Math.floor(b / 4), u = clamp((b % 4) / 0.5, 0, 1), n = this.steps, per = 2 * n;
    const at = i => { const m = ((i % per) + per) % per; return m <= n ? m : per - m; };
    const k = lerp(at(bar - 1), at(bar), u * u * (3 - 2 * u));
    const nx = this.hx + k * this.step;
    this.dx = nx - this.x; this.dy = 0; this.x = nx; this.y = this.hy;
  }
}
// 3-1: a confetti cannon that fires on beat 4 of every bar (it shakes on beat 3: the tell)
class BrBeatCannon extends ENTITY_TYPES.brCannon {
  update(dt) {
    this.t += dt; this.recoil = Math.max(0, this.recoil - dt * 4);
    const b = beatOf(this.g), bar = Math.floor(b / 4), beat = Math.floor(b % 4);
    this.warn = beat === 2;
    if (beat === 3 && this.lastBar !== bar) {
      this.lastBar = bar; this.recoil = 1; if (this.g.onScreen(this)) Sound.play('kick', { pitch: 1.4, vol: 0.4 });
      tourFire(this.g, this.cx + this.dir * 24, this.y + 14, { kind: 'confetti', vx: this.dir * 5 * TS, vy: 0, w: 16, h: 16, life: 4, stompable: true, art: (ctx, s, t) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(t * 8); for (let k = 0; k < 6; k++) { ctx.fillStyle = CARN[k]; ctx.fillRect(Math.cos(k) * 6 - 2, Math.sin(k) * 6 - 2, 4, 4); } ctx.restore(); } });
    }
  }
  draw(ctx) { if (this.warn) { ctx.save(); ctx.translate(Math.sin(this.t * 60) * 1.5, 0); super.draw(ctx); ctx.restore(); } else super.draw(ctx); }
}
// 3-2: the tell for Quati's den. When the second stamp is caught, a coati tail-flick and a burst of leaves at the
// hollow tree: a second coati dives in (Quati's cousin keeps the stash). The tail keeps wiggling out of the hole.
class BrHollowTell extends Ent {
  constructor(g, s) { super(g, s, 3 * TS, 4 * TS); this.x = s.x - 1.5 * TS; this.y = s.y - 4 * TS; this.back = false; this.k = -1; }
  update(dt) {
    this.t += dt; const g = this.g;
    if (this.k < 0 && g.keys && g.keys.has('stamp2')) { this.k = 0; g.burst(this.cx, this.y + 40, 18, '#4a9a3a', 'leaf'); Sound.play('pick', { pitch: 0.6 }); g.parts.text(this.cx, this.y - 6, 'RUSTLE!', '#ffd84a'); }
    if (this.k >= 0) this.k += dt;
    if (this.k > 0 && Math.random() < 0.02) g.burst(this.cx, this.y + 40, 1, '#4a9a3a', 'leaf');
  }
  draw(ctx) {
    if (this.k < 0) return;
    const x = this.cx, hy = this.y + 44, k = this.k;
    // the dive: a coati arcs into the hole during the first 0.7 s
    if (k < 0.7) { const u = k / 0.7, ax = x - 90 + u * 90, ay = hy - Math.sin(u * Math.PI) * 50; ctx.save(); ctx.translate(ax, ay + 18); ctx.rotate(u * 1.4); ENTITY_TYPES.brCoati.cfg.art(ctx, { dir: 1, t: this.t, loot: 1 }, 0, 0, 'flee'); ctx.restore(); return; }
    // the tail sticking out of the hollow
    const w = Math.sin(this.t * 6) * 6;
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 4, hy + 4); ctx.quadraticCurveTo(x + 16, hy - 6, x + 14 + w, hy - 20); ctx.stroke();
    ctx.strokeStyle = '#e8d0a0'; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x + 4, hy + 4); ctx.quadraticCurveTo(x + 16, hy - 6, x + 14 + w, hy - 20); ctx.stroke(); ctx.restore();
  }
}
// 3-5: a kick target (a goal frame with a bullseye). A football rolling or flying into it opens lock `id`.
class BrKickTarget extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, (s.high ? 2 : 2) * TS); this.x = s.x - TS; this.y = s.y - this.h - (s.lift || 0) * TS; this.id = s.id; this.done = false; this.back = true; this.hitT = 0; }
  update(dt) {
    this.t += dt; if (this.hitT > 0) this.hitT -= dt; if (this.done) return;
    const g = this.g; if (g.keys && g.keys.has(this.id)) { this.done = true; return; }
    for (const e of g.entities) if (e.prop && e.isBall && !e.remove && (e.fast || Math.abs(e.vy) > 3 * TS) && overlap(this, e)) {
      this.done = true; this.hitT = 1; TourLock.open(g, this.id); g.burst(this.cx, this.cy, 30, '#ffd23a', 'confetti'); g.parts.text(this.cx, this.y - 10, pick(['GOL!', 'GOLAÇO!', 'NA GAVETA!']), '#ffd23a'); K.sfx('crowd', 'clear', { vol: 0.5 }); g.shake(3); e.vx *= -0.4; break;
    }
  }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h;
    Ink.around(ctx, x - 4, y - 4, w + 8, h + 8, c => {
      c.fillStyle = '#ffffff'; c.fillRect(x, y, 4, h); c.fillRect(x + w - 4, y, 4, h); c.fillRect(x, y, w, 4);
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(x + k * w / 5, y + 4); c.lineTo(x + k * w / 5, y + h); c.stroke(); c.beginPath(); c.moveTo(x + 4, y + k * h / 5); c.lineTo(x + w - 4, y + k * h / 5); c.stroke(); }
      const cx = x + w / 2, cy = y + h / 2 + 2, r = this.done ? 0 : 13;
      if (r) for (let k = 3; k > 0; k--) { c.fillStyle = k % 2 ? '#ff3d3d' : '#ffffff'; c.beginPath(); c.arc(cx, cy, r * k / 3, 0, TAU); c.fill(); }
      else { c.fillStyle = '#1aa85a'; c.font = `bold 12px ${FONT_DISPLAY}`; c.textAlign = 'center'; c.fillText('✓', cx, cy + 4); }
    }, { pad: 6 });
    if (!this.done) { const k = 0.5 + 0.5 * Math.sin(this.t * 4); ctx.fillStyle = `rgba(255,216,74,${0.4 + 0.5 * k})`; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('KICK!', this.cx, this.y - 6); }
  }
}
// the training football in the tunnel: a ball you kick by running into it; stomp it to volley it straight up.
// If it goes astray (or out of the tunnel) a new one rolls out of the kit bag after 2 s.
function ballIcon(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1a20'; ctx.beginPath(); K.star(ctx, 0, 0, 3.6, 3.6, 5); ctx.fill();
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * TAU / 5; ctx.beginPath(); ctx.arc(Math.cos(a) * 8, Math.sin(a) * 8, 2.2, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#1a1a20'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.stroke();
  ctx.restore();
}
class BrTrainingBall extends TourProp {
  constructor(g, s) {
    super(g, s, { w: 18, h: 18, kick: 9, bounce: 0.8, roll: true, gravity: 0.45, friction: 2.2, hp: 0, burst: '#ffffff',
      art(ctx, p, x, y) { ballIcon(ctx, x, y - p.h / 2, 0); },
      think(ball, dt) {
        if (ball.thrownBy && ball.hot > 0.2 && !ball.volley && ball.vy < -6 * TS) { ball.volley = true; ball.vy = -22 * TS; ball.vx *= 0.4; ball.g.parts.text(ball.cx, ball.y - 10, 'VOLLEY!', '#ffd23a'); Sound.play('kick', { pitch: 1.5 }); }
        if (ball.onGround) ball.volley = false;
      } });
    this.isBall = true; this.homeX = this.x; this.homeY = this.y;
  }
  update(dt) {
    super.update(dt);
    const g = this.g, p = g.player;
    const lost = this.y > g.area.H * TS || (p && Math.abs(this.cx - p.cx) > 16 * TS && Math.abs(this.cx - this.homeX) > 4 * TS);
    if (lost && !this.respawnT) this.respawnT = 2;
    if (this.respawnT > 0 && (this.respawnT -= dt) <= 0) { this.respawnT = 0; this.x = this.homeX; this.y = this.homeY - 20; this.vx = this.vy = 0; this.remove = false; g.burst(this.cx, this.cy, 10, '#ffffff', 'spark'); }
    if (this.remove) { this.remove = false; this.respawnT = this.respawnT || 2; this.y = -999; }
  }
}
Object.assign(ENTITY_TYPES, { brBeatFloat: BrBeatFloat, brBeatCannon: BrBeatCannon, brHollowTell: BrHollowTell, brKickTarget: BrKickTarget, brTrainingBall: BrTrainingBall });

/* ================= country looks for library objects (skins) ================= */
const skins = {
  // a gate of hanging brass bells across the avenue (the kazoo's honk rings them and it swings open)
  brBellGate(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w, h = e.h, cx = x + w / 2;
    ctx.fillStyle = '#7a3a8a'; ctx.fillRect(x + 4, y, w - 8, h);
    for (let yy = y + 6; yy < y + h - 4; yy += 24) {
      const sw = Math.sin(t * 5 + yy) * 2;
      ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.moveTo(cx - 8 + sw, yy + 14); ctx.quadraticCurveTo(cx - 8 + sw, yy, cx + sw, yy); ctx.quadraticCurveTo(cx + 8 + sw, yy, cx + 8 + sw, yy + 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c8902a'; ctx.fillRect(cx - 9 + sw, yy + 12, 18, 3); ctx.beginPath(); ctx.arc(cx + sw, yy + 17, 2.5, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(cx - 5 + sw, yy + 3, 2, 8);
    }
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.strokeRect(x + 4, y, w - 8, h);
    const k = 0.5 + 0.5 * Math.sin(t * 4); ctx.fillStyle = `rgba(255,240,170,${0.35 + 0.4 * k})`; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('HONK!', cx, y - 4);
  },
  // the painted panel under the grandstand: a slightly different stripe pattern, confetti drifting from its crack
  brStandsPanel(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = 'rgba(255,210,58,0.18)'; ctx.fillRect(x - 46, y - 96, 92, 96);
    ctx.strokeStyle = 'rgba(40,10,40,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 10, y - 96); ctx.lineTo(x - 6, y - 60); ctx.lineTo(x - 12, y - 30); ctx.lineTo(x - 7, y); ctx.stroke();
    if (Math.random() < 0.06 && e.g) e.g.burst(x - 8, y - 40, 1, CARN[Math.floor(t * 5) % 6], 'confetti');
  },
  // a hollow in a strangler fig: a dark knothole between the roots, leaves around it
  brHollowTree(ctx, e, t) {
    const x = e.x + e.w / 2, y = e.y + e.h;
    ctx.save(); ctx.globalAlpha = 1 - (e.part || 0) * 0.5;
    ctx.fillStyle = '#5a3a24'; ctx.beginPath(); ctx.moveTo(x - 46, y); ctx.quadraticCurveTo(x - 30, y - 30, x - 26, y - 150); ctx.lineTo(x + 26, y - 150); ctx.quadraticCurveTo(x + 30, y - 30, x + 46, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3a2414'; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 10, y - 140); ctx.quadraticCurveTo(x + k * 12, y - 70, x + k * 16, y); ctx.stroke(); }
    ctx.fillStyle = '#1a0e08'; ctx.beginPath(); ctx.ellipse(x, y - 30, 17, 30, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a7a3a'; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.ellipse(x - 50 + k * 12.5, y - 160 + Math.sin(k * 2) * 8, 24, 14, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // the way back up out of the den: roots like a ladder
  brRootStairs(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = 'rgba(30,18,8,0.7)'; rr(ctx, x - 16, y - 56, 32, 56, 12); ctx.fill(); ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 3; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x - 14, y - 8 - k * 11); ctx.quadraticCurveTo(x, y - 12 - k * 11, x + 14, y - 8 - k * 11); ctx.stroke(); } },
  // Quati: a coati in a bandit mask with a satchel of stamps
  brQuati(ctx, e, t) {
    const x = e.cx, y = e.y + e.h, d = e.dir || 1, b = e.hop ? Math.sin(t * 20) * 2 : 0;
    Ink.around(ctx, e.x - 14, e.y - 18, e.w + 28, e.h + 20, c => {
      c.save(); c.translate(x, y + b); ENTITY_TYPES.brCoati.cfg.art(c, { dir: d, t, loot: 0 }, 0, 0, e.hop ? 'flee' : 'walk'); c.restore();
      c.fillStyle = '#1a1020'; c.fillRect(x + d * 6, y - 15 + b, d * 9, 3);
      c.fillStyle = '#c8902a'; rr(c, x - d * 4 - 5, y - 20 + b, 10, 8, 2); c.fill(); c.strokeStyle = '#8a5a14'; c.lineWidth = 1; c.beginPath(); c.moveTo(x - d * 4 - 5, y - 20 + b); c.lineTo(x + d * 6, y - 12 + b); c.stroke();
    }, { pad: 8 });
  },
  // a water curtain in the falls with a rainbow on it (3-3)
  brFallsCurtain(ctx, e, t) {
    const x0 = e.x, y0 = e.y, w = e.w, h = e.h;
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, 'rgba(200,240,255,0.55)'); g.addColorStop(0.5, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(200,240,255,0.55)');
    ctx.save(); ctx.globalAlpha = 1 - (e.part || 0) * 0.55; ctx.fillStyle = g; ctx.fillRect(x0, y0 - 6, w, h + 6);
    ctx.strokeStyle = 'rgba(170,215,240,0.9)'; ctx.lineWidth = 1.4; for (let k = 0; k < 7; k++) { const xx = x0 + 4 + k * (w - 8) / 6, off = (t * 160 + k * 37) % (h + 20); ctx.beginPath(); ctx.moveTo(xx, y0 + Math.max(0, off - 30)); ctx.lineTo(xx, y0 + Math.min(h, off)); ctx.stroke(); }
    ctx.restore();
  },
  // a beach kiosk roof hatch (3-6): a little square trapdoor in the thatch
  brKioskHatch(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w, k = e.open || 0;
    ctx.fillStyle = '#2a160c'; rr(ctx, x - 2, y - 1, w + 4, 9, 2); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.scale(1, Math.cos(k * Math.PI / 2)); TourObj.plank(ctx, 0, -1, w, 7, ['#e8c070', '#b88a3a', '#7a5a24', '#fff0b0']); ctx.restore();
    if (e.crate) e.crateArt(ctx);
  },
  // the raft hatch on the stranded jangada (3-4)
  brRaftHatch(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w, k = e.open || 0;
    ctx.fillStyle = '#5a3a1a'; rr(ctx, x - 26, y - 4, w + 52, 12, 4); ctx.fill(); for (let q = 0; q < 6; q++) { ctx.fillStyle = q % 2 ? '#a0703a' : '#b88048'; ctx.fillRect(x - 24 + q * (w + 48) / 6, y - 3, (w + 48) / 6 - 1, 9); }
    ctx.fillStyle = '#1a0e08'; ctx.fillRect(x + 1, y - 2, w - 2, 7);
    ctx.save(); ctx.translate(x, y - 2); ctx.scale(1, Math.cos(k * Math.PI / 2)); TourObj.plank(ctx, 0, 0, w, 6, ['#c8945a', '#8a5a2a', '#5a3a1a', '#f0c088']); ctx.restore();
    // the mast and a furled sail
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x + w + 14, y - 70, 4, 66); ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.moveTo(x + w + 18, y - 66); ctx.quadraticCurveTo(x + w + 34, y - 40, x + w + 18, y - 14); ctx.closePath(); ctx.fill();
    if (e.crate) e.crateArt(ctx);
  },
  // a locker door painted on the tunnel wall (the fake one is a shade off and creaks open)
  brLocker(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#1f8a52'; ctx.fillRect(x - 15, y - 92, 30, 92); ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let r = 0; r < 3; r++) ctx.fillRect(x - 9, y - 84 + r * 5, 18, 2);
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(x + 8, y - 50, 3, 8);
    if (e.g && Math.random() < 0.04) e.g.burst(x + 12, y - 46, 1, '#ffffff', 'dust');
  },
  // the tunnel's end: floodlit stadium steps
  brTunnelExit(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    const g = ctx.createRadialGradient(x, y - 40, 4, x, y - 40, 60); g.addColorStop(0, 'rgba(255,250,220,0.95)'); g.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 60, y - 100, 120, 100);
    ctx.fillStyle = '#1aa85a'; rr(ctx, x - 22, y - 66, 44, 66, 18); ctx.fill(); ctx.fillStyle = '#fffbe0'; rr(ctx, x - 16, y - 60, 32, 60, 14); ctx.fill();
    ctx.fillStyle = '#ffd23a'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('CAMPO', x, y - 70);
  },
  // the plane gear stand dressed as a hang-glider rack (3-6)
  brGliderRack(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#8a8a9a'; ctx.fillRect(x - 2, y - 56, 4, 56); ctx.fillRect(x - 14, y - 2, 28, 3);
    ctx.save(); ctx.translate(x, y - 50); ctx.rotate(Math.sin(t * 1.5) * 0.05);
    ctx.fillStyle = e.hangT > 0 ? 'rgba(255,61,139,0.35)' : '#ff3d8b'; ctx.beginPath(); ctx.moveTo(-26, 6); ctx.lineTo(0, -6); ctx.lineTo(26, 6); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = e.hangT > 0 ? 'rgba(255,210,58,0.35)' : '#ffd23a'; ctx.beginPath(); ctx.moveTo(-26, 6); ctx.lineTo(-10, 0); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
};

/* ================= stamps ================= */
const stamps = {
  // 3-1: the float workshop under the stands (secret): a 1-up, the postcard on the top shelf, masks on the walls
  barracao: {
    floor: 10,
    rows: [
      '##############################',
      '#............................#',
      '#............................#',
      '#..m........m........m.......#',
      '#............*...............#',
      '#.......o.o.o.....o.o.o......#',
      '#....--------..---------.....#',
      '#............................#',
      '#..............?.............#',
      '#.@.D....f..........f...o.o..#',
      '##############################',
      '##############################'
    ],
    legend: { m: ['decor', 'brMask'], f: ['decor', 'brSurdos'] },
    items: ['oneup'], doors: [{ to: 'avenida@standsBack', look: 'tourDoor' }], gold: { '*': 'hidden' }
  },
  // 3-2: Quati's den in the roots of the hollow tree (secret): the stash, the postcard, the way to the Banca
  toca: {
    floor: 11,
    rows: [
      '##############################',
      '#####.............r......#####',
      '###..........................#',
      '#............................#',
      '#.....o.o.o..................#',
      '#....-------.......*.........#',
      '#.................---........#',
      '#.........?..................#',
      '#............................#',
      '#...........................##',
      '#.@.D.......k....k.......g..##',
      '##############################',
      '##############################'
    ],
    legend: { r: ['decor', 'brRoots'], k: ['decor', 'brStash'] },
    items: ['oneup'], doors: [{ to: 'pantanal@tocaBack', look: 'brRootStairs' }], gold: { '*': 'hidden' }
  },
  // 3-3: the cave behind the curtain (secret): a misty grotto with the way to the hang-glide
  garganta: {
    floor: 12,
    rows: [
      '##########################',
      '#........................#',
      '#..o.o.o.o...............#',
      '#........................#',
      '#..----..................#',
      '#..........*.............#',
      '#........------..........#',
      '#........................#',
      '#..................---...#',
      '#........................#',
      '#..............h.........#',
      '#.@.D...............g....#',
      '##########################',
      '##########################'
    ],
    hidden: ['oneup'], doors: [{ to: 'cataratas@gargantaBack', look: 'tourDoor' }], gold: { '*': 'hidden' }
  },
  // 3-4: inside the stranded raft (secret): Bottle #2, the 1-up
  jangada: {
    floor: 10,
    rows: [
      '############################',
      '#..........................#',
      '#..........................#',
      '#....o.o.o.o...............#',
      '#...........*..............#',
      '#...--------......?........#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#.@.D..................n...#',
      '############################',
      '############################'
    ],
    legend: { n: ['piece', 'bottle', { n: 2 }] },
    items: ['oneup'], doors: [{ to: 'dunas@raftBack', look: 'tourDoor' }], gold: { '*': 'hidden' }
  },
  // 3-5: the kit room behind the fake locker (secret)
  vestiario: {
    floor: 10,
    rows: [
      '############################',
      '#..........................#',
      '#..........................#',
      '#...o.o.o.o................#',
      '#.............*............#',
      '#...-------..-----.........#',
      '#..........................#',
      '#.........?.........k......#',
      '#..........................#',
      '#.@.D..........l...........#',
      '############################',
      '############################'
    ],
    legend: { k: ['decor', 'brKit'], l: ['decor', 'brLockers'] },
    items: ['star'], doors: [{ to: 'tunel@lockerBack', look: 'tourDoor' }], gold: { '*': 'hidden' }
  },
  // 3-6: inside the beach kiosk (secret)
  quiosque: {
    floor: 10,
    rows: [
      '############################',
      '#..........................#',
      '#..........................#',
      '#.....o.o.o.o..............#',
      '#..........................#',
      '#....-------.....*.........#',
      '#...............---........#',
      '#..........?...............#',
      '#..........................#',
      '#.@.D.........u......u.....#',
      '############################',
      '############################'
    ],
    legend: { u: ['decor', 'brCooler'] },
    items: ['magnet'], doors: [{ to: 'ceu@kioskBack', look: 'tourDoor' }], gold: { '*': 'hidden' }
  },
  // the Banca do Quati (Souvenir Stand): the coati keeper behind the counter, his stash on display
  stand: {
    floor: 10,
    rows: [
      '############################',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#...........q..............#',
      '#.@........$.....k......G..#',
      '############################',
      '############################'
    ],
    legend: { q: ['decor', 'brKeeperQuati'], k: ['decor', 'brStash'] }
  }
};
// the keeper of the Banca do Quati: a coati in a straw hat leaning on the counter
Decor.brKeeperQuati = (ctx, x, y, t) => {
  ctx.save(); ctx.translate(x + 20, y + 30); ctx.scale(1.4, 1.4); ENTITY_TYPES.brCoati.cfg.art(ctx, { dir: -1, t, loot: 0 }, 0, 0, 'walk'); ctx.restore();
  ctx.fillStyle = '#e8c870'; ctx.beginPath(); ctx.ellipse(x + 8, y + 2, 16, 4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 8, y - 2, 8, 6, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = '#ff3d8b'; ctx.fillRect(x, y - 3, 16, 2);
};

/* ================= pieces ================= */
const P = {};
// the start of a level dressed for its place (over the builder's start pad, x 0..11)
P.opening = (st, o) => {
  const B = st.B, gy = st.gy;
  for (const [k, tx, dy] of o.decor || []) B.decorAt(k, tx, gy + (dy || 0), tx * 7);
  if (o.sign) st.sign(o.signX || 9, o.sign);
  return st.x;
};
// a gear stand with a sign the first time
P.standSign = (st, o) => {
  const x = st.x; st.floor(x, x + 7);
  Tour.pieces.gearStand(st, { item: o.item, skin: o.skin || null });
  st.sign(x + 5, o.text);
  return x + 8;
};
// 3-1: the bell gate (a kazoo wall) under a carnival arch that stays after the gate swings open
P.bellGate = (st, o) => {
  const x = st.x, B = st.B, h = 3;
  const nx = Tour.pieces.breakwall(st, { needs: 'kazoo', h, skin: 'brBellGate' });
  const top = Math.max(0, st.gy - h - 6);
  for (let y = top; y < st.gy - h; y++) B.setHide(x + 2, y, 1);
  B.prop('brBellArch', x + 2, top, 1, st.gy - top, 'none', {});
  return nx;
};
// 3-1: two parade floats that step one stretch per bar across the avenue's gap, a macaw over them
P.beatFloats = (st, o) => {
  let x = st.x; const B = st.B, span = o.span || 16, step = 3, steps = Math.floor((span - 5) / step);
  st.floor(x, x + 1); x += 2;
  st.pit(x, x + span - 1);
  st.spawn('brBeatFloat', x + 1, st.gy - 1, { pw: 4, steps, stepT: step, skin: 'brFloat', ph: 0 });
  for (let k = 0; k < span; k++) B.ghosts.push([x + k, st.gy]);
  st.coins(x + 2, x + span - 3, st.gy - 3);
  if (o.parrot) st.enemy('brParrot', x + Math.floor(span / 2), st.gy - 2);
  if (o.gold) st.gold(x + Math.floor(span / 2), st.gy - 5, o.gold);
  x += span; st.floor(x, x + 2);
  return x + 3;
};
// 3-1: a confetti cannon on the bar's fourth beat, a float deck to hop onto over its shots
P.beatCannons = (st, o) => {
  const x = st.x, n = o.n || 16; st.floor(x, x + n - 1);
  st.spawn('brBeatCannon', x + n - 2, st.gy - 1, { dir: -1 });
  st.semi(x + 3, x + 7, st.gy - 3); st.semi(x + 9, x + 12, st.gy - 5);
  st.coins(x + 3, x + 7, st.gy - 5);
  if (o.enemy) st.enemy(o.enemy, x + 6, st.gy);
  st.decor('brSurdos', x + 1);
  return x + n;
};
// 3-1: the grandstand: steps up and down, a painted panel at its foot that is a fake (the barracão)
P.stands = (st, o) => {
  const B = st.B, x = st.x; st.floor(x, x + 20);
  // tiers of seats 3, 4, 5 high, a top deck, steps down; the front of the first tier is a painted panel (a fake)
  const tiers = [[x + 2, x + 4, 3], [x + 5, x + 7, 4], [x + 8, x + 13, 5], [x + 14, x + 14, 4], [x + 15, x + 15, 3], [x + 16, x + 16, 2], [x + 17, x + 17, 1]];
  for (const [a, b, h] of tiers) for (let xx = a; xx <= b; xx++) for (let y = st.gy - h; y < st.gy; y++) { B.set(xx, y, T.HARD); B.setHide(xx, y, 1); }
  // the panel: two rows of fake wall at the foot of the first tier, the door behind it
  for (let xx = x + 2; xx <= x + 4; xx++) for (let y = st.gy - 2; y < st.gy; y++) { B.set(xx, y, T.FAKE); B.setHide(xx, y, 1); }
  B.prop('brGrandstand', x + 2, st.gy - 5, 16, 5, 'none', { tiers: tiers.map(([a, b, h]) => [a - x - 2, b - x - 2, h]) });
  B.spawn('tourDraft', x + 3, st.gy - 1, { look: 'painted', skin: 'brStandsPanel' });
  B.spawn('portal', x + 3, st.gy - 1, { kind: 'door', look: 'tourDoorHidden', targetRef: o.to || null, secretDoor: true });
  if (o.back) B.anchor(o.back, x + 1, st.gy - 1);
  st.coins(x + 8, x + 13, st.gy - 7);
  return x + 21;
};
// 3-1: the off-beat light floor: panels that light in two alternating groups over a gap, with a stepping float above
P.lightFloor = (st, o) => {
  let x = st.x; const B = st.B, n = o.n || 12; st.floor(x, x + 1); x += 2;
  st.pit(x, x + n * 2 - 1);
  for (let k = 0; k < n; k++) B.beat(x + k * 2, x + k * 2 + 1, st.gy, k % 2, 'brLightPad');
  if (o.float) { st.spawn('brBeatFloat', x + 2, st.gy - 5, { pw: 4, steps: Math.floor((n * 2 - 6) / 3), stepT: 3, skin: 'brFloat', ph: 0.5 }); for (let k = 0; k < n * 2; k++) B.ghosts.push([x + k, st.gy - 4]); }
  st.coins(x + 1, x + n * 2 - 2, st.gy - 2);
  if (o.gold) st.gold(x + n, st.gy - 7, o.gold);
  x += n * 2; st.floor(x, x + 2);
  if (o.cannon) st.spawn('brBeatCannon', x + 2, st.gy - 1, { dir: -1 });
  return x + 3;
};
// 3-1: the drum chain (risky): longer runs of surdos on the beat with a postcard over the middle
P.drumChain = (st, o) => { const x0 = st.x, nx = Tour.pieces['br.drums'](st, { n: o.n || 6 }); if (o.gold) st.gold(x0 + 2 + Math.floor((nx - x0 - 5) / 2), st.gy - 7, o.gold); return nx; };
// 3-1: the finish: the parade stage, a drum riser, the gate under a feather arch
P.sambaFinale = (st, o) => {
  const B = st.B; let x = st.x; st.floor(x, x + 22);
  B.prop('brStage', x + 3, st.gy - 4, 7, 4, 'none', {});
  for (let xx = x + 3; xx <= x + 9; xx++) for (let y = st.gy - (xx >= x + 6 ? 4 : 2); y < st.gy; y++) { B.set(xx, y, T.HARD); B.setHide(xx, y, 1); }
  st.coins(x + 6, x + 9, st.gy - 6);
  st.decor('brSurdos', x + 1); st.decor('brBunting', x + 16);
  Tour.pieces.gate(Object.assign(st, { x: x + 11 }), { exit: 'main' });
  return x + 23;
};
// 3-2: a jungle canopy of branches with sloths hanging under them (the headline: a sign the first time)
P.slothGrove = (st, o) => {
  const B = st.B, x = st.x, n = o.n || 2, w = 6 + n * 6; st.floor(x, x + w);
  const by = st.gy - 6;
  for (let k = 0; k < n; k++) {
    const bx = x + 3 + k * 6;
    B.fill(bx, by, bx + 4, by, T.SEMI); for (let q = 0; q < 5; q++) B.setHide(bx + q, by, 1);
    st.spawn('brSloth', bx + 2, by + 1, {});
    st.coins(bx, bx + 4, st.gy - 2);
  }
  B.prop('brCanopy', x + 2, by - 3, w - 2, 4, 'none', {});
  if (o.sign) st.sign(x + 1, o.sign);
  return x + w + 1;
};
// 3-2: the river bridge with leaping piranhas (the old Pantanal piece, on its own leaper)
P.leapers = (st, o) => {
  let x = st.x; st.floor(x, x + 1); x += 2;
  const span = o.span || 9;
  st.pit(x, x + span - 1); st.B.fill(x, st.gy + 1, x + span - 1, st.H - 1, T.LAVA);
  for (let q = 0; q < span; q++) if (q % 3 !== 1) st.B.set(x + q, st.gy, T.SEMI);
  for (let q = 1; q < span; q += 3) st.spawn('brPiranhaLeap', x + q, st.gy + 1, { delay: q * 0.3 });
  st.coins(x, x + span - 1, st.gy - 2);
  x += span; st.floor(x, x + 2);
  return x + 3;
};
// 3-2: the hollow tree where Quati's cousin keeps the stash (a curtain door) and the tell that animates at stamp 2
P.hollowTree = (st, o) => {
  const x = st.x, nx = Tour.pieces.secretDoor(st, { to: o.to, look: 'curtain', skin: 'brHollowTree', back: o.back, h: 5 });
  st.spawn('brHollowTell', x + 4, st.gy - 1, {});
  return nx;
};
// 3-2: the nest tree: Quati waits at the top for the third catch (stop 3)
P.nestStop = (st, o) => {
  const B = st.B, x = st.x; st.floor(x, x + 13);
  B.prop('brTree', x + 6, st.gy - 9, 2, 9, 'none', {});
  for (const [bx, by] of [[x + 1, st.gy - 3], [x + 8, st.gy - 6], [x + 3, st.gy - 9]]) { for (let q = 0; q < 4; q++) B.set(bx + q, by, T.SEMI); st.coins(bx, bx + 3, by - 2); }
  B.decorAt('brNest', x + 5, st.gy - 9, 0);
  B.route.push([x + 5, st.gy - 10, 3]); B.vkey('stamp3', [[x + 5, st.gy - 10], [x + 4, st.gy - 10]]);
  if (o.gold) st.gold(x + 10, st.gy - 9, o.gold);
  return x + 14;
};
// 3-2: the stamp gate (opens with all three stamps) and the ranger post at the end of the Pantanal
P.stampFinale = (st, o) => {
  const B = st.B, x = st.x; st.floor(x, x + 24);
  tourShutterLock(B, x + 3, st.gy - 3, st.gy - 1, 'stamp3', 'brStampGate');
  B.fill(x + 3, Math.max(0, st.gy - 9), x + 3, st.gy - 4, T.HARD);
  for (let y = Math.max(0, st.gy - 9); y < st.gy - 3; y++) B.setHide(x + 3, y, 1);
  B.prop('brStampArch', x + 3, st.gy - 9, 1, 9, 'none', {});
  st.decor('brRangerHut', x + 20);
  st.B.spawn('gate', x + 12, st.gy - 1, { exit: 'main' });
  st.decor('brReeds', x + 7); st.decor('brFlowerBush', x + 9);
  return x + 25;
};
// 3-3 climb bands: three falls that push down beside a zigzag of wet rocks
P.threeFalls = (st, o) => {
  const W = st.W, h = o.h || 13;
  for (const fx of [11, W - 13]) Tour.pieces.waterfall(st, { x: fx, w: 2, h, force: o.force || 40 });
  Tour.pieces['br.wetrocks'](st, { n: Math.floor(h / 3), gold: o.gold });
};
// 3-3: catwalks zig-zag across the falls' chute; logs tumble down the chute between them (time the jump across)
P.chute = (st, o) => {
  const B = st.B, W = st.W, n = o.n || 4, y0 = st.y, m = st.mid;
  const top = y0 - 3 * n - 3;
  st.spawn('brLogDrop', m, top - 1, { every: o.every || 1.9, h: y0 - top + 2 });
  B.prop('brCascade', m - 1, top, 2, y0 - top, 'none', {});
  for (let k = 0; k < n; k++) {
    const y = y0 - 3 * (k + 1), left = k % 2 === 0;
    const x0 = left ? 2 : m + 2, x1 = left ? m - 3 : W - 3;
    for (let x = x0; x <= x1; x++) B.set(x, y, T.SEMI);
    st.coins(left ? m - 6 : m + 3, left ? m - 4 : m + 5, y - 2);
    if (k === 1 && o.coati) st.enemy('brCoati', left ? 5 : W - 6, y, { edgeTurn: true });
  }
  st.top(top);
};
// 3-3: a ledge with a sloth on the branch above it
P.slothBand = (st, o) => {
  const B = st.B, W = st.W, y0 = st.y, m = st.mid;
  const y1 = y0 - 3, y2 = y0 - 6, y3 = y0 - 9, by = y0 - 11;
  B.fill(2, y1, 9, y1, T.SEMI); B.fill(m - 5, y2, m + 4, y2, T.SEMI); B.fill(W - 10, y3, W - 3, y3, T.SEMI);
  // a branch over the middle ledge: the sloth hangs under it and drops on whoever stops below
  B.fill(m - 4, by, m + 3, by, T.SEMI); for (let x = m - 4; x <= m + 3; x++) B.setHide(x, by, 1);
  B.prop('brCanopy', m - 5, by - 3, 10, 4, 'none', {});
  st.spawn('brSloth', m, by + 1, {});
  st.coins(3, 8, y1 - 2); st.coins(W - 9, W - 4, y3 - 2);
  st.top(y0 - 13);
};
// 3-3: the curtain ledge: a ledge at the side behind a water curtain (the door to the garganta), a rainbow on it
P.curtainLedge = (st, o) => {
  const B = st.B, W = st.W, y0 = st.y, left = !!o.left;
  const y1 = y0 - 3, y2 = y0 - 6;
  B.fill(st.mid - 3, y1, st.mid + 2, y1, T.SEMI);
  const lx = left ? 1 : W - 9; B.fill(lx, y2, lx + 7, y2, T.GROUND);
  const dx = left ? 3 : W - 4;
  B.spawn('tourCurtain', dx, y2 - 1, { look: 'curtain', skin: 'brFallsCurtain', h: 4 });
  B.spawn('portal', dx, y2 - 1, { kind: 'door', look: 'tourDoorHidden', targetRef: o.to, secretDoor: true });
  B.anchor(o.back, left ? 7 : W - 8, y2 - 1);
  B.decorAt('brRainbow', dx, y2 - 2, 3);
  B.prop('brRainbow', dx - 3, y2 - 5, 7, 4, 'none', {});
  st.coins(st.mid - 2, st.mid + 1, y1 - 2);
  st.top(y2 - 3);
};
// 3-3: rainbow bridges: one-way planks across the falls, drawn as rainbows where the sun hits the mist
P.rainbowBridges = (st, o) => {
  const B = st.B, W = st.W, y0 = st.y, n = o.n || 3;
  let y = y0;
  for (let k = 0; k < n; k++) {
    y = y0 - 3 * (k + 1);
    const x0 = k % 2 ? 6 : W - 18, x1 = x0 + 11;
    for (let x = x0; x <= x1; x++) { B.set(x, y, T.SEMI); B.setHide(x, y, 1); }
    B.spawn('brRainbowBridge', x0, y, { w: x1 - x0 + 1 });
    st.coins(x0 + 2, x1 - 2, y - 2);
    if (k === 1 && o.swift) st.spawn('brSwift', k % 2 ? W - 6 : 6, y - 2, {});
  }
  if (o.gold) st.gold(st.mid, y - 3, o.gold);
  st.top(y - 3);
};
// 3-3: a ledge with a gear stand (the hang-glider near the top)
P.standBand = (st, o) => {
  const B = st.B, W = st.W, y = st.y - 3, x0 = o.left ? 2 : W - 10;
  B.fill(x0, y, x0 + 7, y, T.GROUND);
  B.spawn('gearStand', x0 + 4, y - 1, { item: o.item, skin: o.skin || null });
  B.vkey('gear:' + o.item, [[x0 + 4, y - 1], [x0 + 4, y - 2]]);
  for (let q = -2; q < 2; q++) B.set(st.mid + q, y, T.SEMI);
  st.top(y - 3);
};
// 3-3: a catwalk band with a star block in the middle of it
P.catwalkStar = (st, o) => {
  const B = st.B, W = st.W, y = st.y - 3;
  for (let x = 2; x <= W - 3; x++) if (x < st.mid - 2 || x > st.mid + 1) B.set(x, y, T.SEMI);
  st.block(st.mid + 5, y - 4, 'star');
  st.enemy('brCoati', 6, y, { edgeTurn: true });
  st.coins(4, W - 5, y - 2);
  st.top(y - 3);
};
// 3-3: the overlook at the summit (dressing for the climb's summit)
P.climbCard = (st, o) => { st.gold(o.x != null ? o.x : st.W - 5, st.y + (o.dy != null ? o.dy : -2), o.kind || 'high'); };
P.overlook = (st, o) => { st.B.decorAt('brOverlook', Math.floor(st.W / 2), Math.max(6, st.y - 6), 0); };

// 3-4: Lençóis: a dune with a crumbling crest
P.dune = (st, o) => {
  const B = st.B, x = st.x, w = o.w || 10, h = o.h || 3; st.floor(x, x + w - 1);
  for (let i = 0; i < w; i++) { const k = Math.sin((i + 0.5) / w * Math.PI), hh = Math.round(k * h); if (hh > 0) B.fill(x + i, st.gy - hh, x + i, st.gy - 1, T.GROUND); }
  if (o.crumble) { const c = Math.floor(w / 2); for (let q = -1; q <= 1; q++) { const hh = Math.round(Math.sin((c + q + 0.5) / w * Math.PI) * h); B.set(x + c + q, st.gy - hh, T.CRUMBLE); } }
  st.arc(x + 1, x + w - 2, st.gy - h - 2, 1);
  if (o.decor !== false) st.decor('brDuneGrass', x + 1);
  if (o.gold) st.gold(x + Math.floor(w / 2), st.gy - h - 3, o.gold);
  return x + w;
};
// 3-4: a lagoon: a pit with a sandy bed `depth` rows down; at low tide you walk its bed, at high tide you swim over it
P.lagoon = (st, o) => {
  const B = st.B, x = st.x, w = o.w || 10, bed = o.bed || 6; st.floor(x, x + 1);
  st.pit(x + 2, x + w + 1);
  B.fill(x + 2, st.gy + bed, x + w + 1, B.H - 1, T.GROUND);
  // sandy steps up both walls, so a low tide never traps you on the bed
  for (let y = st.gy + bed - 3; y > st.gy + 1; y -= 3) { B.fill(x + 2, y, x + 3, y, T.SEMI); B.fill(x + w, y, x + w + 1, y, T.SEMI); }
  for (let q = 4; q <= w - 1; q++) if ((q * 7) % 5 === 0) B.decorAt('brShell', x + q, st.gy + bed, q);
  if (o.crabs) for (let k = 0; k < o.crabs; k++) st.enemy('brCrab', x + 5 + k * 4, st.gy + bed);
  if (o.fish) st.spawn('brPiranha', x + Math.floor(w / 2) + 2, st.gy + bed - 2, {});
  st.coins(x + 4, x + w - 1, st.gy + bed - 2);
  if (o.gold) st.gold(x + 2 + Math.floor(w / 2), st.gy + bed - 2, o.gold);
  st.floor(x + w + 2, x + w + 3);
  return x + w + 4;
};
// 3-4: the stranded raft on a lagoon bed: its hatch opens at low tide (stomp the crate on it, press down)
P.raftLagoon = (st, o) => {
  const B = st.B, x = st.x, w = 12, bed = o.bed || 6; st.floor(x, x + 1);
  st.pit(x + 2, x + w + 1); B.fill(x + 2, st.gy + bed, x + w + 1, B.H - 1, T.GROUND);
  B.spawn('trapdoor', x + 7, st.gy + bed - 1, { targetRef: o.to, crate: true, look: 'brRaftHatch' });
  B.anchor(o.back, x + 11, st.gy + bed - 1);
  st.floor(x + w + 2, x + w + 3);
  return x + w + 4;
};
// 3-4: a deep pocket under a dune overhang (P3): a ledge you only reach along the bed at low tide
P.lowPocket = (st, o) => {
  const B = st.B, x = st.x, w = 10, bed = o.bed || 7; st.floor(x, x + 1);
  st.pit(x + 2, x + w + 1); B.fill(x + 2, st.gy + bed, x + w + 1, B.H - 1, T.GROUND);
  // a dune overhang: the pocket under it is dry only at low tide
  B.fill(x + 6, st.gy, x + w + 1, st.gy + bed - 3, T.GROUND);
  B.fill(x + 2, st.gy + bed - 3, x + 3, st.gy + bed - 3, T.SEMI); B.fill(x + 4, st.gy + bed - 6, x + 5, st.gy + bed - 6, T.SEMI);
  st.coins(x + 7, x + w, st.gy + bed - 1);
  st.gold(x + w - 1, st.gy + bed - 1, 'risky');
  st.floor(x + w + 2, x + w + 3);
  return x + w + 4;
};
// 3-4: the finish on a high dune with a fishermen's shack
P.duneFinale = (st, o) => {
  const B = st.B, x = st.x; st.floor(x, x + 20);
  B.fill(x + 2, st.gy - 2, x + 6, st.gy - 1, T.GROUND); B.fill(x + 3, st.gy - 3, x + 5, st.gy - 3, T.GROUND);
  st.decor('brDuneGrass', x + 8); st.decor('brBeachSet', x + 17);
  B.spawn('gate', x + 12, st.gy - 1, { exit: 'main' });
  return x + 21;
};
// 3-5: the kick target: a training ball at the start of a stretch, the target before a shutter `id`
P.kickTarget = (st, o) => {
  const B = st.B, x = st.x, id = o.id, n = o.n || 14; st.floor(x, x + n + 2);
  st.spawn('brTrainingBall', x + 3, st.gy - 1, {});
  B.vkey(id, [[x + 3, st.gy - 1], [x + 2, st.gy - 1], [x + 4, st.gy - 1]]);
  st.spawn('brKickTarget', x + n - 2, st.gy - 1, { id, lift: o.high ? 4 : 0 });
  tourShutterLock(B, x + n, st.gy - 3, st.gy - 1, id, null);
  B.fill(x + n, 1, x + n, st.gy - 4, T.HARD);
  if (o.sign) st.sign(x + 1, o.sign);
  if (o.gold) st.gold(x + n - 6, st.gy - 4, o.gold);
  return x + n + 3;
};
// 3-6 sky: the granite launch peak (Brady starts on its top); a gear stand of hang-gliders
P.launchPeak = (st, o) => {
  const B = st.B, gy = st.gy;
  for (let x = 0; x <= 12; x++) { const d = Math.abs(x - 6), y1 = Math.min(B.H - 1, gy + 3 + Math.round(d * 0.4) + 9 - d); for (let y = gy + 3; y <= y1; y++) { B.set(x, y, T.GROUND); B.setHide(x, y, 1); } }
  B.prop('brGranite', 0, gy + 2, 13, B.H - gy - 2, 'none', {});
  return st.x;
};
// 3-6 sky: an island of promenade at row gy (o.gy), o.gap empty columns before it; extras: a hang-glider rack
// (stand), a kiosk with a roof hatch (kiosk, to, back), an item block, a coconut palm, an enemy, a coin ring over the gap
P.isle = (st, o) => {
  const B = st.B; if (o.gy != null) st.gy = o.gy;
  const gap = o.gap || 0, x = st.x + gap, w = o.w || 8; st.floor(x, x + w - 1);
  if (gap >= 4 && o.ring !== false) { const cx = st.x + Math.floor(gap / 2), cy = st.gy - 4; for (let a = 0; a < 8; a++) B.pickAt(Math.round(cx + Math.cos(a * TAU / 8) * 2), Math.round(cy + Math.sin(a * TAU / 8) * 2)); }
  if (o.stand) { B.spawn('gearStand', x + 1, st.gy - 1, { item: 'plane', skin: 'brGliderRack' }); B.vkey('gear:plane', [[x + 1, st.gy - 1], [x + 1, st.gy - 2]]); }
  if (o.kiosk) {
    for (let q = x + w - 6; q <= x + w - 2; q++) { B.set(q, st.gy - 3, T.HARD); B.setHide(q, st.gy - 3, 1); }
    B.prop('brKiosk', x + w - 6, st.gy - 3, 5, 3, 'none', {});
    if (o.to) { B.spawn('trapdoor', x + w - 5, st.gy - 4, { targetRef: o.to, crate: false, look: 'brKioskHatch' }); B.anchor(o.back, x + 2, st.gy - 1); }
  }
  if (o.item) st.block(x + Math.floor(w / 2), st.gy - 4, o.item);
  if (o.coconut) st.spawn('dropper', x + Math.floor(w / 2) + 1, st.gy - 6, { period: 2.6, look: 'brCoconutDrop' });
  if (o.decor) st.decor(o.decor, x + w - 2);
  if (o.enemy) st.enemy(o.enemy, x + Math.floor(w / 2), st.gy);
  if (o.gold) st.gold(x + (o.gold[1] != null ? o.gold[1] : 2), st.gy + (o.gold[2] != null ? o.gold[2] : -3), o.gold[0]);
  if (o.cp) st.spawn('checkpoint', x + w - 2, st.gy - 1);
  return x + w;
};
// a thermal: an updraft column w wide from row `bottom` up to row `top` (heat shimmer and circling gulls show it)
P.thermalLift = (st, o) => {
  const B = st.B, x = st.x + (o.gap || 0), w = o.w || 3, top = o.top, bottom = o.bottom;
  B.zone(x, top, w, bottom - top, 0, -(o.force || 100) * TS, (o.vmax || 6.5) * TS, 'updraft', { pull: 3 });
  B.spawn('brThermal', x, bottom - 1, { w, h: bottom - top });
  for (let y = top + 2; y < bottom - 2; y += 3) B.pickAt(x + Math.floor(w / 2), y);
  if (o.gold) st.gold(x + Math.floor(w / 2), o.gold[1], o.gold[0]);
  return x + w;
};
// the volleyball net island: a ball pad that bounces you high (a spring for the validator)
P.volleyIsland = (st, o) => {
  const B = st.B; if (o.gy != null) st.gy = o.gy;
  const x = st.x + (o.gap || 0); st.floor(x, x + 8);
  st.decor('brNet', x + 6);
  for (let q = 2; q <= 4; q++) B.setSurf(x + q, st.gy, SURF.BOUNCE);
  B.spawn('surfaceSkin', x + 2, st.gy - 1, { n: 3, kind: 'bounce', look: 'brBallPad' });
  B.springs.push([x + 3, st.gy - 1]);
  st.arc(x + 3, x + 12, st.gy - 4, 5);
  return x + 9;
};
// the landing on Copacabana: the wave promenade, umbrellas, the gate
P.beachFinale = (st, o) => {
  const B = st.B; if (o.gy != null) st.gy = o.gy;
  const x = st.x + (o.gap || 0); st.floor(x, x + 20);
  B.fill(x, st.gy + 3, x + 20, B.H - 1, T.GROUND);
  st.decor('brBeachSet', x + 4); st.decor('brCoconutStand', x + 16);
  B.spawn('gate', x + 11, st.gy - 1, { exit: 'main' });
  return x + 21;
};
for (const k in P) Tour.pieces['br.' + k] = P[k];
// the boss pitch, reshaped for the v2 lair (34 wide, open sky): the bateria's drums pop up on the beat (phase 2 he
// dives on them), two stands to stand on, the ball cannon on the left, goal nets at both ends; phase 3 cracks the
// floor at x0 + 9 and x0 + 15 (the brain); P3 sits over the ball cannon
Tour.pieces['br.arena_estadio'] = (st, o) => {
  const B = st.B, { x0, w, GY } = o;
  B.beat(x0 + 7, x0 + 9, GY - 3, 0, 'brDrum'); B.beat(x0 + w - 10, x0 + w - 8, GY - 3, 1, 'brDrum'); B.beat(x0 + 15, x0 + 18, GY - 6, 0, 'brDrum');
  for (let q = 0; q < 3; q++) { B.set(x0 + 2 + q, GY - 5, T.SEMI); B.set(x0 + w - 6 + q, GY - 5, T.SEMI); }
  B.spawn('brBallCannon', x0 + 1, GY - 1, { dir: 1 });
  B.prop('brGoal', x0, GY - 4, 3, 4, 'none', {}); B.prop('brGoal', x0 + w - 4, GY - 4, 3, 4, 'none', {});
  B.decorAt('brCornerFlag', x0 + 5, GY, 1); B.decorAt('brCornerFlag', x0 + w - 7, GY, 2);
  B.decorAt('brCoconutStand', x0 + 12, GY, 0); B.decorAt('brCooler', x0 + 21, GY, 0);
  B.gold(x0 + 1, GY - 5, 'risky');
};
Decor.brCornerFlag = (ctx, x, y, t) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 40, 2, 40); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(x + 1, y - 40); ctx.lineTo(x + 16 + Math.sin(t * 4) * 2, y - 34); ctx.lineTo(x + 1, y - 28); ctx.closePath(); ctx.fill(); };


// a few more pieces of art the pieces above use
Object.assign(Decor, {
  // the grandstand's painted front: tiers of seats with confetti-coloured spectator dots
  brStandsFront(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, top = y - d.h;
    for (let r = 0; r < 5; r++) { ctx.fillStyle = r % 2 ? '#4a2a6a' : '#5a3a7a'; ctx.fillRect(x0 + (4 - r) * 8 + 4, top + 32 + r * 0, d.w - (4 - r) * 16 - 8, 4); }
    for (let k = 0; k < 26; k++) { ctx.fillStyle = CARN[k % 6]; ctx.beginPath(); ctx.arc(x0 + 30 + ((k * 37) % (d.w - 60)), top + 22 - (k % 3) * 6, 4, 0, TAU); ctx.fill(); }
  },
  // the parade stage at the finish: a low step and a high riser, skirted in carnival bunting
  brStage(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, s3 = 3 * TS;
    const step = (sx, w, h) => {
      ctx.fillStyle = '#5a2a6a'; ctx.fillRect(sx, y - h, w, h);
      ctx.fillStyle = '#ffd23a'; ctx.fillRect(sx, y - h, w, 6); ctx.fillStyle = '#c8901a'; ctx.fillRect(sx, y - h + 6, w, 2);
      for (let k = 0; k < Math.floor(w / 16); k++) { ctx.fillStyle = CARN[k % 6]; ctx.beginPath(); ctx.moveTo(sx + k * 16, y - h + 8); ctx.lineTo(sx + k * 16 + 16, y - h + 8); ctx.lineTo(sx + k * 16 + 8, y - h + 20); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let k = 0; k < w; k += 12) ctx.fillRect(sx + k, y - h + 24, 2, h - 24);
    };
    step(x0, s3, 2 * TS); step(x0 + s3, d.w - s3, d.h);
    ctx.fillStyle = '#ffffff'; ctx.font = `bold 10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('FIM DO DESFILE', x0 + s3 + (d.w - s3) / 2, y - d.h + 46);
  },
  // the grandstand: tiers of bright seats with a rail; d.tiers = [[from, to, height], ...] in tiles from its left edge
  brGrandstand(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2;
    for (const [a, b, h] of d.tiers) {
      const sx = x0 + a * TS, w = (b - a + 1) * TS, top = y - h * TS;
      ctx.fillStyle = '#4a2a66'; ctx.fillRect(sx, top, w, h * TS);
      ctx.fillStyle = '#6a3a8a'; ctx.fillRect(sx, top, w, 7);
      for (let r = 0; r < h; r++) for (let c = 0; c < (b - a + 1) * 2; c++) { ctx.fillStyle = CARN[(c + r * 3 + a) % 6]; rr(ctx, sx + 3 + c * 16, top + 12 + r * TS, 11, 9, 3); ctx.fill(); }
    }
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.beginPath();
    for (const [a, b, h] of d.tiers) { ctx.moveTo(x0 + a * TS, y - h * TS - 6); ctx.lineTo(x0 + (b + 1) * TS, y - h * TS - 6); }
    ctx.stroke();
  },
  // a jungle bough with its canopy: the branch the sloths hang from runs along the bottom row of the prop
  brCanopy(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, by = y - TS;
    for (let k = 0; k < d.w / 26; k++) { ctx.fillStyle = k % 2 ? '#2a7a3a' : '#3a8a3a'; ctx.beginPath(); ctx.ellipse(x0 + 13 + k * 26, by - 22 + Math.sin(k * 1.7) * 7, 22, 15, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#4a9a3a'; for (let k = 0; k < d.w / 26; k++) { ctx.beginPath(); ctx.ellipse(x0 + 20 + k * 26, by - 30 + Math.cos(k * 2.1) * 6, 12, 8, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#5a3a24'; rr(ctx, x0 - 6, by + 2, d.w + 12, 11, 5); ctx.fill();
    ctx.fillStyle = '#7a5434'; ctx.fillRect(x0, by + 3, d.w, 3);
    ctx.strokeStyle = '#5a7a2a'; ctx.lineWidth = 1.5; for (let k = 0; k < d.w / 44; k++) { ctx.beginPath(); ctx.moveTo(x0 + 22 + k * 44, by + 10); ctx.quadraticCurveTo(x0 + 28 + k * 44 + Math.sin(t + k) * 3, by + 34, x0 + 20 + k * 44, by + 52); ctx.stroke(); }
  },
  // the stamp arch over the shutter at the end of 3-2
  brStampArch(ctx, x, y, t, th, d) { const top = y - d.h; ctx.fillStyle = '#7a5230'; ctx.fillRect(x - 14, top, 28, d.h - 96); ctx.fillStyle = '#c8783a'; rr(ctx, x - 30, top - 6, 60, 16, 5); ctx.fill(); for (let k = 0; k < 3; k++) { ctx.fillStyle = ['#ff6a8a', '#5ac8ff', '#ffd84a'][k]; rr(ctx, x - 24 + k * 17, top - 2, 13, 9, 2); ctx.fill(); } },
  // a granite peak (3-6 launch)
  brGranite(ctx, x, y, t, th, d) { const x0 = x - d.w / 2, top = y - d.h; ctx.fillStyle = '#7a7a72'; ctx.beginPath(); ctx.moveTo(x0 - 20, y); ctx.quadraticCurveTo(x0 + 20, top + 40, x0 + d.w * 0.35, top); ctx.lineTo(x0 + d.w * 0.65, top); ctx.quadraticCurveTo(x0 + d.w - 20, top + 40, x0 + d.w + 20, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(x0 + d.w * 0.4, top + 80, 18, 60, -0.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a7a3a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x0 + 20 + k * 80, top + 140 + (k % 2) * 60, 30, 14, 0, 0, TAU); ctx.fill(); } },
  // a beach kiosk (thatched roof, a striped awning, a counter of green coconuts)
  brKiosk(ctx, x, y, t, th, d) {
    const x0 = x - d.w / 2, top = y - d.h;
    ctx.fillStyle = '#f4ecd8'; ctx.fillRect(x0 + 4, top + 8, d.w - 8, d.h - 8);
    ctx.fillStyle = '#1aa85a'; for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#1aa85a'; ctx.beginPath(); ctx.moveTo(x0 + 2 + k * (d.w - 4) / 6, top + 8); ctx.lineTo(x0 + 2 + (k + 1) * (d.w - 4) / 6, top + 8); ctx.lineTo(x0 + 2 + (k + 0.5) * (d.w - 4) / 6, top + 22); ctx.fill(); }
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x0 + 4, y - 26, d.w - 8, 26); ctx.fillStyle = '#a8744a'; ctx.fillRect(x0 + 2, y - 28, d.w - 4, 5);
    ctx.fillStyle = '#3a8a3a'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x0 + 14 + k * (d.w - 28) / 5, y - 32, 6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(x - 22, top + 28, 44, 20); ctx.fillStyle = '#ffd23a'; ctx.font = `7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('ÁGUA DE', x, top + 37); ctx.fillText('COCO', x, top + 45);
    ctx.fillStyle = '#e8c070'; ctx.beginPath(); ctx.moveTo(x0 - 8, top + 8); ctx.lineTo(x, top - 14); ctx.lineTo(x0 + d.w + 8, top + 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#b88a3a'; ctx.lineWidth = 1; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(x, top - 12); ctx.lineTo(x0 - 6 + k * (d.w + 12) / 7, top + 8); ctx.stroke(); }
  }
});
// a thermal: heat shimmer and a pair of circling gulls show where it lifts
class BrThermal extends Ent {
  constructor(g, s) { super(g, s, (s.w || 3) * TS, (s.h || 12) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; this.back = true; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h;
    ctx.save(); ctx.globalAlpha = 0.5;
    const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(0.5, 'rgba(255,240,200,0.28)'); g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) { const ph = (this.t * 0.6 + k / 4) % 1, yy = y + h - ph * h; ctx.beginPath(); ctx.moveTo(x + w * 0.2, yy); ctx.quadraticCurveTo(x + w * 0.5, yy - 10, x + w * 0.8, yy); ctx.stroke(); }
    ctx.restore();
    for (let k = 0; k < 2; k++) { const a = this.t * 1.4 + k * Math.PI, bx = x + w / 2 + Math.cos(a) * 30, by = y + 30 + Math.sin(a) * 10; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - 7, by); ctx.quadraticCurveTo(bx - 3, by - 4, bx, by); ctx.quadraticCurveTo(bx + 3, by - 4, bx + 7, by); ctx.stroke(); }
  }
}
// rainbow bridge planks: solid one-way planks drawn as a rainbow that glows where the sunbeam crosses the mist
class BrRainbowBridge extends Ent {
  constructor(g, s) { super(g, s, (s.w || 10) * TS, 10); this.x = s.x - TS / 2; this.y = s.y - TS; this.back = true; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, sun = (Math.sin(this.t * 0.7) * 0.5 + 0.5) * w;
    const cols = ['#ff4a4a', '#ff9a2a', '#ffe02a', '#4ad84a', '#3a8aff', '#8a4aff'];
    for (let k = 0; k < 6; k++) { ctx.fillStyle = cols[k]; ctx.globalAlpha = 0.85; ctx.fillRect(x, y + k * 1.6, w, 1.8); }
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(x + sun, y + 5, 2, x + sun, y + 5, 70); g.addColorStop(0, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x + sun - 70, y - 10, 140, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let q = 0; q < w; q += TS) ctx.fillRect(x + q + 2, y + 9, TS - 4, 2);
  }
}
// the coconut dropper skin: a coconut under a palm frond
TOUR_SKINS.brCoconutDrop = (ctx, e, t) => { const x = e.cx, y = e.y; ctx.fillStyle = '#2a8a4a'; for (let k = 0; k < 5; k++) { ctx.save(); ctx.translate(x, y - 6); ctx.rotate(-1.2 + k * 0.6); ctx.beginPath(); ctx.ellipse(18, 0, 20, 5, 0.2, 0, TAU); ctx.fill(); ctx.restore(); } ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.arc(x - 5, y, 6, 0, TAU); ctx.arc(x + 5, y + 1, 6, 0, TAU); ctx.fill(); };
TOUR_SKINS.brBallPad = (ctx, e, t) => { const x = e.x, y = e.y + 4, w = e.w, k = e.squash || 0; ctx.save(); ctx.translate(x + w / 2, y - 14 + k * 4); ctx.scale(1 + k * 0.2, 1 - k * 0.3); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill(); ['#ff3d8b', '#ffd23a', '#2a8aff'].forEach((c, q) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 14, q * TAU / 3 + t, q * TAU / 3 + t + 0.8); ctx.closePath(); ctx.fill(); }); ctx.restore(); };
TOUR_SKINS.brStampGate = (ctx, e, t) => { const x = e.x, y = e.y, h = e.h * (1 - e.k * 0.92); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 2, y - 6, e.w + 4, 6); for (let yy = 0; yy < h; yy += 8) { ctx.fillStyle = yy % 16 ? '#a0703a' : '#8a5a2a'; ctx.fillRect(x + 2, y + yy, e.w - 4, Math.min(8, h - yy)); } if (h > 20) for (let k = 0; k < 3; k++) { ctx.fillStyle = e.g && e.g.keys && e.g.keys.has('stamp' + (k + 1)) ? ['#ff6a8a', '#5ac8ff', '#ffd84a'][k] : 'rgba(0,0,0,0.35)'; rr(ctx, x + 6, y + 6 + k * 12, e.w - 12, 9, 2); ctx.fill(); } };
Object.assign(ENTITY_TYPES, { brThermal: BrThermal, brRainbowBridge: BrRainbowBridge });
Object.assign(TOUR_BEAT_ART, {
  // the Sambadrome's light floor: glass panels lit from below, two colours for the two groups
  brLightPad(ctx, k, on, warn, t) {
    const col = k.grp ? '#38f2ff' : '#ffd23a';
    if (!on) { ctx.globalAlpha = warn ? 0.7 : 0.3; ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.strokeRect(2, 1, 28, 8); ctx.globalAlpha = 1; return; }
    ctx.fillStyle = '#2a2040'; ctx.fillRect(1, 0, 30, 10);
    ctx.fillStyle = warn ? rgba(col, 0.35) : col; ctx.fillRect(3, 2, 26, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(5, 3, 10, 1.5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(col, 0.25 * (k.glow || 0.3)); ctx.fillRect(-4, -12, 40, 22); ctx.restore();
  }
});

/* ================= houses and the country panel ================= */
const houses = [{ id: 'br-quati', kind: 'stand', name: 'Banca do Quati', keeper: 'coati', theme: 'br_pantanal', stock: ['kazoo', 'plane', 'fins', 'magnet', 'oneup', 'sundial', 'sig:ball'], mapCell: [0, 2], mapFrom: 1 }];
const map = { fort: 'stadium', start: [0, 0] };

/* ================= the levels ================= */
const levels = [
  // 3-1 BEAT: the Sambadrome at sunrise. ① surdos pop up on the beat ② floats step per bar, cannons on beat 4
  // ③ the off-beat light floor with a float and cannons together. The barracão hides behind the grandstand panel.
  { n: 1, name: 'Samba Sunrise', arch: 'beat', theme: 'br_samba_dawn', bpm: 124,
    gimmick: 'The avenue moves to 124 bpm: surdo drums pop up on the beat, floats step once a bar, cannons fire on beat four',
    hint: 'Count to four with the music: drums pop up on the beat, the floats move on ONE, the cannons fire on FOUR',
    postcard: 'The parade ran all night. At sunrise the drums are still going. So am I. ♥ C',
    enemies: [['brPandeiro', 3], ['brBrigadeiro', 1], ['brParrot', 1]],
    mapCell: [0, 0], mapFrom: -1,
    exits: { main: { to: '3-2' } },
    areas: [
      { id: 'avenida', gen: 'strip', W: 230, H: 18, bpm: 124, script: [
        ['opening', { decor: [['brBunting', 6], ['brSurdos', 1]] }],
        ['itemBlock', { item: 'power', y: 4 }],
        ['standSign', { item: 'kazoo', text: 'KAZOO! THROW = HONK. BELL GATES OPEN TO A HONK' }],
        // ① the beat
        ['drums', { n: 3 }],
        ['bellGate'],
        ['enemies', { kind: 'brPandeiro', n: 2, len: 12 }],
        ['postcard', { kind: 'must', dx: 6, dy: -5 }],
        ['float', { span: 10 }],
        ['enemies', { kind: 'brBrigadeiro', n: 1, len: 12 }],
        'cp',
        // ② floats step per bar, cannons fire on four
        ['beatFloats', { span: 16, parrot: true }],
        ['beatCannons', { n: 16, enemy: 'brPandeiro' }],
        ['stands', { to: 'barracao@in', back: 'standsBack' }],
        ['bellGate'],
        // ③ everything at once
        ['lightFloor', { n: 9, float: true, cannon: true }],
        'lsd',
        ['beatFloats', { span: 13 }],
        ['drumChain', { n: 6, gold: 'risky' }],
        ['enemies', { kind: 'brBrigadeiro', n: 1, len: 10 }],
        ['sambaFinale']
      ] },
      { id: 'barracao', gen: 'room', role: 'secret', theme: 'br_workshop', stamp: 'barracao' }
    ] },

  // 3-2 THIEF: Quati snatches Chinka's stamps and runs through the Pantanal
  { n: 2, name: 'Coati Caper', arch: 'thief', theme: 'br_pantanal',
    gimmick: 'Quati the coati grabs the passport stamps: chase him on capybaras and caimans, catch him three times',
    hint: 'Stomp Quati (or kick the football at him) while he waits: three catches open the ranger gate',
    postcard: 'A coati stole my stamps. A different coati stole my sandwich. They work as a team. ♥ C',
    enemies: [['brJaguar', 1], ['brSloth', 2], ['brCrab', 1]],
    mapCell: [1, 0], mapFrom: 0,
    exits: { main: { to: '3-3' }, secret: { to: 'house:br-quati', hint: 'A hollow tree rustles when Quati drops the second stamp...' } },
    areas: [
      { id: 'pantanal', gen: 'strip', W: 230, H: 20, script: [
        ['opening', { decor: [['brReeds', 2], ['brFlowerBush', 4], ['brReeds', 9]] }],
        ['itemBlock', { item: 'power', y: 4 }],
        ['thief', { type: 'brCoati', look: 'brQuati' }],
        'sig',
        // ① the snatch, the chase on capybara rides
        ['capybaras', { span: 12 }],
        ['thiefStop', { n: 1 }],
        ['postcard', { kind: 'must', dx: 3, dy: -4 }],
        // ② sloths drop from branches, caimans float like logs
        ['slothGrove', { n: 2, sign: 'SLOTHS DROP WHEN YOU WALK UNDER. WAIT FOR THE SHAKE!' }],
        ['caimans', { n: 3 }],
        'cp',
        ['leapers', { span: 9 }],
        ['slothGrove', { n: 3 }],
        ['thiefStop', { n: 2 }],
        ['hollowTree', { to: 'toca@in', back: 'tocaBack' }],
        // ③ the jaguar prowls while Quati hides up a nest tree
        ['capybaras', { span: 10 }],
        'jaguar',
        ['caimans', { n: 4 }],
        ['nestStop', { gold: 'risky' }],
        ['enemies', { kind: 'brCrab', n: 2, len: 10 }],
        ['stampFinale']
      ] },
      { id: 'toca', gen: 'room', role: 'secret', theme: 'br_toca', stamp: 'toca' }
    ] },

  // 3-3 TOWER (b) facade: three falls push you down; catwalks, logs, a sloth; rainbow bridges and swifts up top
  { n: 3, name: 'Iguaçu Falls', arch: 'tower', theme: 'br_falls',
    gimmick: 'Climb the face of the falls: three cascades push you down, logs tumble, rainbows bridge the mist',
    hint: 'Waterfalls push you down: climb beside them, not in them. Rainbows in the mist are solid!',
    postcard: 'Iguaçu is so loud I can\'t hear myself think. A rainbow held me up. True story. ♥ C',
    enemies: [['brCoati', 2], ['brSloth', 1]],
    mapCell: [2, 0], mapFrom: 1,
    exits: { main: { to: '3-4' }, secret: { to: '3-6', hint: 'A rainbow sits on one water curtain halfway up the falls...' } },
    areas: [
      { id: 'cataratas', gen: 'climb', variant: 'facade', W: 34, H: 118, script: [
        ['blockBand', { item: 'power' }],
        // ① wet rocks beside three falls that push you down
        ['threeFalls', { h: 12 }],
        ['walkway', { n: 3 }],
        ['climbCard', { kind: 'must', x: 29, dy: -2 }],
        ['slothBand'],
        // ② catwalks while logs tumble down the chutes; a rainbow on one curtain marks the way behind it
        ['chute', { n: 4, coati: true }],
        ['curtainLedge', { to: 'garganta@in', back: 'gargantaBack', left: true }],
        ['catwalkStar'],
        // ③ rainbow bridges in the mist, swifts darting out of the curtains, the glider near the top
        ['rainbowBridges', { n: 3, swift: true }],
        ['standBand', { item: 'plane', left: false }],
        ['mist', { left: true, rise: 9 }],
        ['climbCard', { kind: 'risky', x: 4, dy: -2 }],
        ['overlook']
      ] },
      { id: 'garganta', gen: 'room', role: 'secret', theme: 'br_garganta', stamp: 'garganta' }
    ] },

  // 3-4 TIDE: rain squalls fill the lagoons every 14 s; walk the beds at low water, swim over the dunes at high
  { n: 4, name: 'Lençóis Lagoons', arch: 'tide', theme: 'br_lencois',
    gimmick: 'White dunes and rain lagoons: the water rises and falls every 14 seconds',
    hint: 'Low water: walk the lagoon beds. High water: swim over the dunes. Fins swim faster!',
    postcard: 'Sand like sugar and lagoons like glass. A crab pinched me. It was worth it. ♥ C',
    enemies: [['brCrab', 2], ['brGull', 2]],
    mapCell: [2, 1], mapFrom: 2,
    exits: { main: { to: '3-5' } },
    areas: [
      { id: 'dunas', gen: 'strip', W: 210, H: 22, GY: 12, tide: { low: 18, high: 11, period: 14, hold: 3 }, script: [
        ['opening', { decor: [['brDuneGrass', 2], ['brShell', 5]] }],
        ['standSign', { item: 'fins', text: 'FLIPPER FINS: THE LAGOONS FILL EVERY 14 SECONDS' }],
        ['itemBlock', { item: 'power', y: 4 }],
        // ① the water climbs: walk the bed or swim over
        ['lagoon', { w: 10, bed: 6 }],
        ['dune', { w: 10, h: 3 }],
        ['lagoon', { w: 12, bed: 6, crabs: 1 }],
        ['postcard', { kind: 'must', dx: -6, dy: -6 }],
        // ② dune crests crumble under you
        ['dune', { w: 12, h: 4, crumble: true }],
        ['lagoon', { w: 14, bed: 7, fish: true, ledge: true }],
        ['dune', { w: 10, h: 3, crumble: true }],
        'cp',
        ['raftLagoon', { to: 'jangada@in', back: 'raftBack', bed: 6 }],
        ['dune', { w: 12, h: 5, crumble: true }],
        // ③ crabs on the beds, piranhas in the water, timed against the tide
        ['lagoon', { w: 12, bed: 6, crabs: 2 }],
        ['enemies', { kind: 'brGull', n: 1, len: 8 }],
        ['lagoon', { w: 16, bed: 8, fish: true, ledge: true }],
        ['lowPocket', { bed: 7 }],
        ['dune', { w: 10, h: 4 }],
        ['duneFinale']
      ] },
      { id: 'jangada', gen: 'room', role: 'secret', theme: 'br_jangada', stamp: 'jangada' }
    ] },

  // 3-5 LAIR: the players' tunnel teaches the ball (kick it into targets to roll up shutters), then the pitch
  { n: 5, name: 'Estádio do Tucanão', arch: 'lair', theme: 'br_barracao',
    gimmick: 'The players\' tunnel: kick footballs into targets to open the shutters, then O Tucanão\'s pitch',
    hint: 'Only a football reaches O Tucanão: run into a ball to kick it, stomp a ball to volley it up!',
    postcard: 'Sugarloaf is back by the bay, full size! The Baron sailed for Africa. Next stop: Mozambique! ♥ C',
    enemies: [['brPandeiro', 2], ['brBrigadeiro', 1]], boss: 'br_toucan',
    mapCell: [1, 2], mapFrom: [3, 5],
    exits: { main: { to: 'country:next' } },
    areas: [
      { id: 'tunel', gen: 'strip', mode: 'castle', W: 76, H: 18, ceil: 3, script: [
        ['opening', { decor: [['brMask', 3], ['brMask', 9]] }],
        ['itemBlock', { item: 'power', y: 4 }],
        ['kickTarget', { id: 'shA', n: 13, sign: 'RUN INTO THE BALL TO KICK IT AT THE TARGET', gold: 'must' }],
        ['enemies', { kind: 'brPandeiro', n: 2, len: 10 }],
        'sig',
        ['kickTarget', { id: 'shB', n: 12, high: true, sign: 'STOMP THE BALL TO VOLLEY IT UP' }],
        ['secretDoor', { to: 'vestiario@in', look: 'painted', skin: 'brLocker', back: 'lockerBack' }],
        ['enemies', { kind: 'brBrigadeiro', n: 1, len: 10 }],
        ['door', { to: 'estadio@in', perch: 0, look: 'brTunnelExit' }]
      ] },
      { id: 'vestiario', gen: 'room', role: 'secret', theme: 'br_vestiario', stamp: 'vestiario' },
      { id: 'estadio', gen: 'arena', role: 'arena', layout: 'estadio', arenaW: 34, roof: false, theme: 'br_estadio' }
    ] },

  // 3-6 GLIDE (secret): launch from a granite peak, ride thermals over Copacabana, re-launch off the volleyball net
  { n: 6, name: 'Rio Hang-Glide', arch: 'glide', secret: true, theme: 'br_rio_sky',
    gimmick: 'Hang-glide over Rio: thermals lift you, gulls and kites drift, every landing has a fresh glider',
    hint: 'Hold jump while falling to glide. Thermals (the shimmering columns) lift you up',
    postcard: 'Sugarloaf from above! I waved at a cable car. A gull waved back. Probably. ♥ C',
    enemies: [['brGull', 2], ['brKite', 2], ['brSwift', 1]],
    mapCell: [1, 1], mapFrom: 2,
    exits: { main: { to: 'node:3-5' } },
    areas: [
      { id: 'ceu', gen: 'islands', W: 226, H: 34, GY: 10, script: [
        ['launchPeak'],
        // ① off the granite peak: the first glide, a thermal back up, coin rings over the gaps
        ['isle', { w: 6, stand: true, decor: 'brCoconutStand', tight: true }],
        ['isle', { gap: 6, gy: 16, w: 8, item: 'power', tight: true }],
        ['thermalLift', { w: 3, top: 5, bottom: 27, tight: true }],
        ['isle', { gy: 10, w: 6, stand: true, gold: ['must', 3, -3], tight: true }],
        ['isle', { gap: 7, gy: 15, w: 10, kiosk: true, to: 'quiosque@in', back: 'kioskBack', coconut: true, tight: true }],
        // ② gulls and kites; dive to the low sandbar, ride the thermal back up
        ['isle', { gap: 4, gy: 13, w: 6, enemy: 'brGull', tight: true }],
        ['isle', { gap: 7, gy: 26, w: 5, gold: ['risky', 2, -2], ring: false, tight: true }],
        ['thermalLift', { w: 3, top: 8, bottom: 32, tight: true }],
        ['isle', { gy: 14, w: 8, stand: true, decor: 'brBeachSet', cp: true, tight: true }],
        ['isle', { gap: 4, gy: 12, w: 7, enemy: 'brKite', tight: true }],
        // ③ the volleyball net throws you high; a long glide through the rings to the beach
        ['volleyIsland', { gap: 2, gy: 12, tight: true }],
        ['isle', { gap: 1, gy: 5, w: 6, enemy: 'brKite', tight: true }],
        ['isle', { gap: 7, gy: 14, w: 7, coconut: true, item: 'lsd', stand: true, tight: true }],
        ['thermalLift', { w: 3, top: 5, bottom: 24, tight: true }],
        ['isle', { gy: 10, w: 5, enemy: 'brSwift', tight: true }],
        ['beachFinale', { gap: 6, gy: 13, tight: true }]
      ] },
      { id: 'quiosque', gen: 'room', role: 'secret', theme: 'br_quiosque', stamp: 'quiosque' }
    ] }
];

Tour.amend('br', { stamps, skins, houses, map, levels });
})();
