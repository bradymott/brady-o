/* ============================================================
   ANTARCTICA (secret land, world 13): found through a cracked ice wall in Amsterdam's Frozen Canals (8-4)
   13-1 The Ice Shelf        run    a penguin teaches the belly-slide: bowl through snowballs, leopard seals leap from ice holes
   13-2 Iceberg Drift        ride   drift on an iceberg: hop the growlers, dodge leaping orcas and skuas
   13-3 Aurora Station       night  a research station under the aurora: heater vents, radio masts, wandering rovers
   13-4 The Blizzard Palace  castle blizzard gusts come in waves over cracking ice; Big Tusk the walrus: icicles and ice blocks
   ============================================================ */
(() => {
const COL = { a: '#8ae8ff', b: '#2a6ad8', c: '#ffffff' };
const K = TourKit;
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };
if (typeof LIQUIDS !== 'undefined' && !LIQUIDS.icewater) LIQUIDS.icewater = ['#dff8ff', '#7ac8f0', '#2a6aa8', 'rgba(240,255,255,0.3)', null, 'rgba(255,255,255,0.75)'];

/* ---------------- background painters ---------------- */
const painters = {
  // tabular icebergs drifting on a dark polar sea
  aqBergs(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, L.base, H, L.sea || '#1a4a7a', '#0a1e3a'); ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let x = 30; x < BG_W; x += 150 + rng() * 120) wrapDraw(x, 120, xx => {
      const w = 60 + rng() * 70, h = 20 + rng() * 40;
      ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(xx, L.base); ctx.lineTo(xx + 6, L.base - h); ctx.lineTo(xx + w - 8, L.base - h - 4); ctx.lineTo(xx + w, L.base); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(120,180,230,0.35)'; ctx.fillRect(xx + 4, L.base - h * 0.4, w - 8, h * 0.4);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(xx, L.base + 2, w, 3);
    });
  },
  // the ice shelf's sheer blue cliffs
  aqShelf(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= BG_W; x += 24) ctx.lineTo(x, L.base - 30 - (x % 96 < 48 ? 0 : 8)); ctx.lineTo(BG_W, H); ctx.fill();
    ctx.strokeStyle = 'rgba(90,150,210,0.45)'; ctx.lineWidth = 2; for (let x = 10; x < BG_W; x += 22 + rng() * 20) { ctx.beginPath(); ctx.moveTo(x, L.base - 24); ctx.lineTo(x + rng() * 8 - 4, H); ctx.stroke(); }
  },
  // the research station: domed huts, a radio mast, warm windows
  aqStation(ctx, L, rng, H) {
    for (let x = 40; x < BG_W; x += 260) wrapDraw(x, 200, xx => {
      ctx.fillStyle = L.color; ctx.fillRect(xx, L.base - 50, 120, 50); ctx.beginPath(); ctx.ellipse(xx + 170, L.base, 40, 46, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#e8422a'; ctx.fillRect(xx, L.base - 56, 120, 8);
      for (let k = 0; k < 5; k++) { ctx.fillStyle = rng() < 0.7 ? '#ffd890' : '#2a3040'; ctx.fillRect(xx + 10 + k * 22, L.base - 40, 12, 10); }
      ctx.strokeStyle = shade(L.color, -0.3); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xx + 60, L.base - 56); ctx.lineTo(xx + 60, L.base - 140); ctx.stroke();
      ctx.fillStyle = '#ff5a4a'; ctx.beginPath(); ctx.arc(xx + 60, L.base - 142, 3, 0, TAU); ctx.fill();
    });
    ctx.fillStyle = shade(L.color, -0.15); ctx.fillRect(0, L.base, BG_W, H - L.base);
  }
};
const dyn = {
  // the blizzard: snow streaks blowing sideways
  aqBlizzard(ctx, L, camX, oy, S, W, t) {
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5 * S;
    for (let k = 0; k < 40; k++) { const x = ((k * 131 - t * 420 - camX * 0.5) % W + W) % W, y = oy + ((k * 61 + t * 30) % 320) * S; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 26 * S, y + 4 * S); ctx.stroke(); }
  }
};

/* ---------------- tiles ---------------- */
function iceCrate(ctx, th, f) {
  ctx.save(); ctx.shadowColor = 'rgba(160,240,255,0.9)'; ctx.shadowBlur = 5 + f * 1.5;
  const g = ctx.createLinearGradient(0, 0, TS, TS); g.addColorStop(0, '#e8faff'); g.addColorStop(1, '#7ac8f0');
  ctx.fillStyle = g; rr(ctx, 1, 2, TS - 2, TS - 3, 4); ctx.fill(); ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(TS / 2, TS / 2 + 1); ctx.lineTo(TS / 2 + Math.cos(a) * 9, TS / 2 + 1 + Math.sin(a) * 9); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(5, 5 + Math.sin(f) * 0.5, 6, 2);
  ctx.strokeStyle = '#4a8ac8'; ctx.lineWidth = 1.2; rr(ctx, 1, 2, TS - 2, TS - 3, 4); ctx.stroke();
}
function iceCrateUsed(ctx) { ctx.fillStyle = '#a8b8c8'; rr(ctx, 1, 3, TS - 2, TS - 4, 4); ctx.fill(); }
const base = {
  ground: { style: 'snow', cap: '#f4faff', capHi: '#ffffff', dirt: '#a8c8e8', dirt2: '#6a9ac8', rock: '#8ab0d8' },
  brick: { style: 'ice', c1: '#bfe8ff', c2: '#7ab8e0', mortar: '#e8f8ff' }, hard: { c1: '#c8e8ff', c2: '#7aa8d8' },
  semi: { style: 'ice', c1: '#d8f4ff', c2: '#8ac0e0' }, pillar: { c1: '#c8e8ff', c2: '#7aa8d8', cap: '#ffffff', style: 'column' },
  accent: COL.a, qblockArt: iceCrate, usedArt: iceCrateUsed, tint: {}, bloom: 0.2, liquid: 'icewater'
};
const themes = {
  aq_shelf: Object.assign({}, base, {
    name: 'The Ice Shelf', music: 'tour_aq', particles: 'snow', rays: '#e8faff',
    sky: ['#6aa8e8', '#c8e8ff', '#ffffff'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.7, y: 0.3, r: 30, color: '#fffbe8', glow: '#ffffff' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'mountains', color: '#b8d0e8', base: 290, amp: 120, f: 0.03, snow: true, blur: true }, { kind: 'aqBergs', color: '#e8f6ff', base: 320, f: 0.08 }, { kind: 'aqShelf', color: '#d0eaff', base: 360, f: 0.2 }],
    fog: '#ffffff', decor: ['aqPenguins', 'aqFlag', 'aqPenguins']
  }),
  aq_sea: Object.assign({}, base, {
    name: 'The Southern Ocean', music: 'tour_aq_ride', particles: 'snow', rays: '#ffffff',
    sky: ['#4a7ab8', '#a8c8e8', '#f0f8ff'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.25, y: 0.28, r: 28, color: '#fffbe8', glow: '#ffffff' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'mountains', color: '#a8c0d8', base: 300, amp: 100, f: 0.03, snow: true, blur: true }, { kind: 'aqBergs', color: '#f0f8ff', base: 340, f: 0.12, sea: '#1a3a6a' }],
    fog: '#e8f4ff'
  }),
  aq_station: Object.assign({}, base, {
    name: 'Aurora Station', music: 'tour_aq_night', particles: 'snow', aurora: true,
    sky: ['#040a1a', '#0a1a34', '#1a2a48'], horizonGlow: '#3affa0', celestial: { type: 'moon', x: 0.15, y: 0.16, r: 18, color: '#f8f8ff', glow: '#a0ffd0' }, stars: 1,
    layers: [{ kind: 'mountains', color: '#1a2a40', base: 300, amp: 90, f: 0.03, snow: true }, { kind: 'aqStation', color: '#c8d0d8', base: 345, f: 0.12 }],
    fog: '#3affa0', darkness: 0.4, decor: ['aqLamp', 'aqCrates']
  }),
  aq_storm: Object.assign({}, base, {
    name: 'The Blizzard Palace', music: 'tour_aq', particles: 'snow',
    sky: ['#8a9ab0', '#c8d4e0', '#f0f4f8'], horizonGlow: '#ffffff', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'mountains', color: '#c8d4e4', base: 300, amp: 140, f: 0.03, snow: true, blur: true, dyn: 'aqBlizzard' }, { kind: 'aqShelf', color: '#d8e8f8', base: 350, f: 0.15 }],
    fog: '#ffffff'
  })
};

/* ---------------- decor ---------------- */
const penguin = (ctx, x, y, t, s, belly) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (belly) { ctx.rotate(-Math.PI / 2 * 0.92); ctx.translate(0, 4); }
  const w = Math.sin(t * 6) * (belly ? 0 : 0.12); ctx.rotate(w);
  ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.ellipse(0, -12, 8, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(1.5, -10, 5, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffb81a'; ctx.beginPath(); ctx.moveTo(4, -19); ctx.lineTo(9, -18); ctx.lineTo(4, -17); ctx.fill(); ctx.fillRect(-4, -1, 4, 2); ctx.fillRect(1, -1, 4, 2);
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(-2, -18, 3, 1.5, 0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(3, -19, 1.2, 0, TAU); ctx.fill();
  ctx.restore();
};
const decor = {
  aqPenguins(ctx, x, y, t) { for (let k = 0; k < 3; k++) penguin(ctx, x - 12 + k * 12, y, t + k, 0.8 + (k % 2) * 0.15, false); },
  aqFlag(ctx, x, y, t) { ctx.fillStyle = '#5a5a68'; ctx.fillRect(x - 1, y - 40, 2, 40); ctx.fillStyle = '#e8422a'; ctx.beginPath(); ctx.moveTo(x + 1, y - 40); ctx.lineTo(x + 18 + Math.sin(t * 6) * 2, y - 35); ctx.lineTo(x + 1, y - 30); ctx.fill(); },
  aqLamp(ctx, x, y, t) { ctx.fillStyle = '#3a3a48'; ctx.fillRect(x - 2, y - 50, 4, 50); ctx.fillStyle = `rgba(255,${220 + Math.sin(t * 4 + x) * 20},160,0.95)`; ctx.beginPath(); ctx.arc(x, y - 54, 6, 0, TAU); ctx.fill(); },
  aqCrates(ctx, x, y) { ctx.fillStyle = '#e8422a'; ctx.fillRect(x - 14, y - 14, 14, 14); ctx.fillStyle = '#2a5ad8'; ctx.fillRect(x, y - 10, 12, 10); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 14, y - 16, 14, 3); },
  aqHole(ctx, x, y, t) { ctx.fillStyle = 'rgba(20,60,110,0.85)'; ctx.beginPath(); ctx.ellipse(x, y - 2, 18, 5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.stroke(); },
  // a heater vent blowing warm air (it lifts Brady)
  aqVent(ctx, x, y, t, th, d) {
    ctx.fillStyle = '#5a5a68'; ctx.fillRect(x - d.w / 2, y - 12, d.w, 12); ctx.fillStyle = '#ff8a3a'; ctx.fillRect(x - d.w / 2 + 4, y - 14, d.w - 8, 3);
    for (let k = 0; k < 10; k++) { const ph = (t * 0.7 + k / 10) % 1; ctx.fillStyle = `rgba(255,220,180,${0.3 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x + Math.sin(k * 1.7 + t * 2) * d.w * 0.3, y - 16 - ph * (d.h - 16), 6 + ph * 8, 0, TAU); ctx.fill(); }
  },
  // a station module (its body is solid; the roof is the platform)
  aqModule(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2;
    ctx.fillStyle = '#e8422a'; rr(ctx, x0, y - h, w, h, 6); ctx.fill();
    ctx.fillStyle = '#c8d0d8'; ctx.fillRect(x0, y - h, w, 6);
    for (let k = 0; k < Math.floor(w / 26); k++) { ctx.fillStyle = (Math.floor(t * 0.5 + k) % 4) ? '#ffd890' : '#ffe8b0'; rr(ctx, x0 + 8 + k * 26, y - h + 14, 14, 10, 3); ctx.fill(); }
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(x0 + w - 18, y - 22, 12, 22);
  },
  aqMast(ctx, x, y, t, th, d) { ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x, y - d.h); ctx.lineTo(x + 6, y); ctx.stroke(); for (let k = 1; k < d.h / 24; k++) { ctx.beginPath(); ctx.moveTo(x - 6 + k * 0.2, y - k * 24); ctx.lineTo(x + 6 - k * 0.2, y - k * 24 - 12); ctx.stroke(); } ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ff4a3a' : '#7a2a2a'; ctx.beginPath(); ctx.arc(x, y - d.h - 3, 4, 0, TAU); ctx.fill(); }
};
const decorLights = { aqLamp: [110, '#ffe0a0', -54], aqVent: [70, '#ff8a3a', -12] };

/* ---------------- enemies ---------------- */
const skuaArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); const f = Math.sin(e.t * (m === 'swoop' ? 9 : 5));
  ctx.fillStyle = '#6a5040'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 6, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, -2); ctx.quadraticCurveTo(-12, -14 - f * 7, -24, -6 - f * 9); ctx.lineTo(0, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(12, -14 - f * 7, 22, -6 - f * 9); ctx.lineTo(4, 0); ctx.fill();
  ctx.beginPath(); ctx.arc(11, -3, 4.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.moveTo(14, -4); ctx.lineTo(20, -2); ctx.lineTo(14, -1); ctx.fill();
  K.eyes(ctx, 12, -4, 1, 1.5, 1.4, true);
  ctx.restore();
};
const sealArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(m === 'up' ? -1.2 : 1.2);
  ctx.fillStyle = '#7a8a9a'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#4a5a6a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(-8 + k * 4, -3 + (k % 2) * 3, 1.5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#7a8a9a'; ctx.beginPath(); ctx.ellipse(14, -1, 8, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(16 + k * 1.6, 2); ctx.lineTo(16.8 + k * 1.6, 5); ctx.lineTo(17.6 + k * 1.6, 2); ctx.fill(); }
  K.eyes(ctx, 15, -4, 1, 2.2, 1.6, true);
  ctx.restore();
};
const snowballArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y - 11); if (m === 'roll' || m === 'curl') ctx.rotate(e.t * 12 * e.dir);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(160,200,230,0.5)'; ctx.beginPath(); ctx.arc(3, 3, 6, 0, TAU); ctx.fill();
  if (m !== 'roll' && m !== 'curl' && m !== 'flat' && m !== 'ko') K.eyes(ctx, e.dir * 3, -2, e.dir, 3, 2, true);
  ctx.restore();
};
const roverArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  ctx.fillStyle = '#c8d0d8'; rr(ctx, -14, -18, 28, 12, 3); ctx.fill(); ctx.fillStyle = '#e8422a'; ctx.fillRect(-14, -18, 28, 3);
  ctx.fillStyle = '#2a2a34'; for (const wx of [-9, 0, 9]) { ctx.beginPath(); ctx.arc(wx, -4, 4, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(6, -18); ctx.lineTo(8, -28); ctx.stroke();
  ctx.fillStyle = Math.floor(e.t * 3) % 2 ? '#3affa0' : '#1a8a5a'; ctx.beginPath(); ctx.arc(8, -30, 3, 0, TAU); ctx.fill();
  if (m !== 'flat' && m !== 'ko') { ctx.fillStyle = '#1a1a22'; rr(ctx, 4, -16, 9, 6, 2); ctx.fill(); ctx.fillStyle = '#3affa0'; ctx.fillRect(7, -14, 3, 2); }
  ctx.restore();
};
const orcaArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(m === 'up' ? -1.3 : 1.3);
  ctx.fillStyle = '#14141c'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 10, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(2, -24); ctx.lineTo(8, -8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-30, -8); ctx.lineTo(-28, 0); ctx.lineTo(-30, 8); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(12, -3, 5, 3, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(4, 6, 12, 3, 0, 0, Math.PI); ctx.fill();
  ctx.restore();
};
const enemies = {
  aqSkua: { cls: TourFlyer.make({ w: 32, h: 14, range: 4, speed: 0.9, swoop: true, art: skuaArt, burst: '#6a5040' }), place: 'fly' },
  aqSeal: { cls: TourLeaper.make({ w: 30, h: 16, jumpV: 14, every: 1.6, art: sealArt, splash: '#bfe8ff' }), place: 'here' },
  aqSnowball: { cls: TourEnemy.make({ w: 22, h: 22, speed: 0.8, behavior: 'roll', range: 9, rollSpeed: 6.4, art: snowballArt, burst: '#ffffff' }), place: 'walk' },
  aqRover: { cls: TourEnemy.make({ w: 28, h: 26, speed: 1.1, behavior: 'walk', hp: 2, art: roverArt, burst: '#c8d0d8', glow: 'rgba(60,255,160,' }), place: 'walk' },
  aqOrca: { cls: TourLeaper.make({ w: 40, h: 20, jumpV: 17, every: 1.8, drift: 1.2, art: orcaArt, splash: '#bfe8ff' }), place: 'here' }
};
// the penguin who teaches Brady to belly-slide
const penguinFriend = (ctx, e, x, y, m, t) => { penguin(ctx, x, y, t, 1.5, m === 'wave'); if (m !== 'wave') { ctx.fillStyle = '#ffd84a'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', x, y - 42 + Math.sin(t * 5) * 2); } };
// the blizzard comes in waves: gusts blow Brady back, then ease off
class AqStorm extends Ent {
  constructor(g, s) { super(g, s, 10, 10); this.zone = null; }
  update(dt) { this.t += dt; if (!this.zone) this.zone = (this.g.area.zones || []).find(z => z.kind === 'blizzard' && Math.abs(z.x - this.s.zx) < 2) || null; this.on = (this.t % 4.6) < 2.4; if (this.zone) this.zone.off = !this.on; }
  draw(ctx) { const z = this.zone; if (!z || !this.on) return; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; for (let k = 0; k < 20; k++) { const ph = (this.t * 1.6 + k * 0.13) % 1, sx = z.x + z.w - ph * z.w, sy = z.y + 8 + ((k * 41) % Math.max(20, z.h - 16)); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 30, sy - 3); ctx.stroke(); } }
}
const entities = { aqPenguin: TourFriend.make({ w: 26, h: 40, give: 'sig:slide', line: 'SLIDE LIKE ME!', art: penguinFriend }), aqStorm: AqStorm };

/* ---------------- the signature power-up: THE PENGUIN BELLY-SLIDE ---------------- */
// press action on the ground to whoosh along on your belly: it bowls enemies over (and lasts longer on ice)
function slideIcon(ctx, x, y, t) { penguin(ctx, x, y + 9, t, 0.75, true); ctx.strokeStyle = 'rgba(160,230,255,0.9)'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 14, y + 2 + k * 3); ctx.lineTo(x - 6, y + 2 + k * 3); ctx.stroke(); } }
let slideT = 0;
const power = {
  id: 'slide', name: 'PENGUIN SLIDE', country: 'aq', hint: 'ACTION ON THE GROUND: BELLY-SLIDE AND BOWL ENEMIES OVER', time: 0, cooldown: 0.8,
  icon: slideIcon,
  action(p, g) { if (!p.onGround || p.inWater) return false; slideT = p.groundTile === T.ICE ? 1.3 : 0.85; Sound.play('swim', { pitch: 0.7 }); g.burst(p.cx, p.y + p.h, 10, '#e8faff', 'dust'); return true; },
  update(p, dt, inp, g) {
    if (slideT <= 0) return;
    slideT -= dt; if (p.inWater || p.dead) { slideT = 0; return; }
    p.vx = p.facing * 12 * TS;
    if (Math.random() < 0.5) g.burst(p.cx - p.facing * 10, p.y + p.h, 1, '#e8faff', 'dust');
    const box = { x: p.x - 14, y: p.y, w: p.w + 28, h: p.h };
    for (const e of g.entities) {
      if (!e.enemy || e.dead || e.remove || !overlap(box, e)) continue;
      if (e.boss) { if (e.state === 'fight' && !e.slideHit) { e.slideHit = 0.6; e.hit('disc', p); } continue; }
      if (e.hit('kick', p)) g.addScore(200, e.cx, e.y);
    }
  },
  drawOn(p, ctx, t) { if (slideT <= 0) return; ctx.strokeStyle = 'rgba(200,240,255,0.8)'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(p.cx - p.facing * (14 + k * 8), p.y + p.h - 4 - k * 5); ctx.lineTo(p.cx - p.facing * (34 + k * 10), p.y + p.h - 4 - k * 5); ctx.stroke(); } }
};

/* ---------------- set pieces ---------------- */
const icePool = (st, x0, x1) => { st.pit(x0, x1); st.B.fill(x0, st.gy + 2, x1, st.H - 1, T.LAVA); };
const P = {
  /* 13-1: the ice shelf */
  penguin(st) { const x = st.x; st.floor(x, x + 8); st.spawn('aqPenguin', x + 5, st.gy - 1, {}); st.decor('aqPenguins', x + 2); return x + 9; },
  // a long sheet of ice with a line of snowballs: belly-slide bowling!
  bowling(st, o) { const x = st.x, B = st.B, n = o.n || 16; st.floor(x, x + n); for (let q = 1; q < n; q++) B.set(x + q, st.gy, T.ICE); for (let k = 0; k < (o.pins || 3); k++) st.enemy('aqSnowball', x + 8 + k * 2, st.gy); st.coins(x + 2, x + n - 2, st.gy - 2); return x + n + 1; },
  // ice holes: leopard seals leap out of them
  holes(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const n = o.n || 3;
    for (let k = 0; k < n; k++) { icePool(st, x, x + 1); st.spawn('aqSeal', x + 1, st.gy + 1, { delay: k * 0.5 }); x += 2; st.floor(x, x + 2); st.coins(x, x + 2, st.gy - 2); x += 3; }
    return x;
  },
  // crevasse bridges of snow that collapse under Brady
  crevasse(st) { let x = st.x; st.floor(x, x + 1); x += 2; st.pit(x, x + 6); st.B.fill(x, st.gy, x + 6, st.gy, T.CRUMBLE); st.coins(x + 1, x + 5, st.gy - 2); x += 7; st.floor(x, x + 2); return x + 3; },
  // seracs: tumbled ice blocks to climb
  seracs(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 12);
    [[x + 2, 2], [x + 4, 4], [x + 7, 3], [x + 9, 1]].forEach(([sx, h]) => B.fill(sx, st.gy - h, sx + 1, st.gy - 1, T.HARD));
    st.coins(x + 4, x + 5, st.gy - 6);
    if (o.gold) st.gold(x + 5, st.gy - 8, 'high');
    st.enemy('aqSkua', x + 8, st.gy);
    return x + 13;
  },

  /* 13-2: iceberg drift (st.deck is the iceberg's top) */
  growler(st) { const x = st.x, B = st.B; B.set(x, st.deck - 1, T.HARD); B.setHide(x, st.deck - 1, 1); B.prop('aqGrowler', x, st.deck - 1, 1, 1, 'none', {}); st.arc(x - 1, x + 1, st.deck - 2, 2); return x + 6; },
  orcas(st) { const x = st.x; st.spawn('aqOrca', x + 3, st.H - 2, { delay: 0 }); st.spawn('aqOrca', x + 7, st.H - 2, { delay: 0.9 }); st.coins(x + 1, x + 8, st.deck - 3); return x + 10; },
  floe(st, o) { const x = st.x, B = st.B, fy = st.deck - 4; for (let q = 0; q < 4; q++) B.set(x + q, fy, T.SEMI); B.prop('aqFloeArt', x, fy, 4, 1, 'none', {}); st.coins(x, x + 3, fy - 2); if (o.gold) st.gold(x + 2, fy - 3, 'high'); return x + 7; },
  skuas(st) { const x = st.x; st.spawn('aqSkua', x + 4, st.deck - 6, { range: 4 }); st.coins(x + 1, x + 6, st.deck - 3); return x + 9; },

  /* 13-3: the research station */
  // station modules: climb onto their roofs
  modules(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 15);
    B.prop('aqModule', x + 1, st.gy - 3, 5, 3, 'body', {}); B.prop('aqModule', x + 8, st.gy - 5, 6, 5, 'body', {});
    st.coins(x + 1, x + 5, st.gy - 5); st.coins(x + 8, x + 13, st.gy - 7);
    if (o.gold) st.gold(x + 11, st.gy - 9, 'high');
    st.enemy('aqRover', x + 7, st.gy);
    return x + 16;
  },
  // a heater vent: the warm air lifts Brady to the gantry
  vent(st, o) {
    const x = st.x, B = st.B, gy = st.gy; st.floor(x, x + 12);
    const ty = gy - 8;
    B.zone(x + 2, ty - 2, 3, gy - ty + 2, 0, -110 * TS, 7 * TS, 'vent', { pull: 3 });
    B.prop('aqVent', x + 2, ty - 2, 3, gy - ty + 2, 'none', {});
    for (let q = 5; q <= 12; q++) B.set(x + q, ty, T.SEMI);
    st.coins(x + 6, x + 11, ty - 2);
    st.decor('aqLamp', x + 8);
    return x + 13;
  },
  // a radio mast with service ledges
  mast(st) { const x = st.x, B = st.B; st.floor(x, x + 10); B.prop('aqMast', x + 5, st.gy - 10, 1, 10, 'none', {}); [[x + 2, st.gy - 3], [x + 6, st.gy - 6], [x + 2, st.gy - 9]].forEach(([lx, ly]) => { for (let q = 0; q < 3; q++) B.set(lx + q, ly, T.SEMI); st.coins(lx, lx + 2, ly - 2); }); return x + 11; },

  /* 13-4: the blizzard palace */
  // the blizzard blows Brady back in waves: move in the lulls
  blizzard(st) { const x = st.x, B = st.B, w = 16; st.floor(x, x + w); for (let q = 1; q < w; q++) B.set(x + q, st.gy, T.ICE); B.zone(x, st.gy - 8, w, 8, -4.4 * TS, 0, 0, 'blizzard'); st.spawn('aqStorm', x + 8, st.gy - 8, { zx: x * TS }); B.fill(x + 6, st.gy - 2, x + 7, st.gy - 1, T.HARD); B.fill(x + 12, st.gy - 2, x + 13, st.gy - 1, T.HARD); st.coins(x + 2, x + 5, st.gy - 2); return x + w + 1; },
  // the floe: an ice floor under an ice ceiling hung with icicles, two ice blocks, ledges at the sides
  arena_glacier(st, o) {
    const B = st.B, { x0, w, GY } = o;
    for (let q = 2; q < w - 2; q++) B.set(x0 + q, GY, T.ICE);
    for (let q = 0; q < 4; q++) { B.set(x0 + 3 + q, GY - 4, T.SEMI); B.set(x0 + w - 7 + q, GY - 4, T.SEMI); }
    B.fill(x0 + 1, GY - 7, x0 + w - 2, GY - 7, T.HARD);
    for (const q of [8, 10, 12, 14, 16, 18]) st.spawn('aqIcicle', x0 + q, GY - 7, {});   // over the open floor, clear of the ledges
    st.spawn('aqBlock', x0 + 8, GY - 1, {}); st.spawn('aqBlock', x0 + 17, GY - 1, {});
    st.spawn('aqFloe', x0, GY - 1, { x0, w });
    B.decorAt('aqPenguins', x0 + 1, GY, 0); B.decorAt('aqCrates', x0 + 2, GY, 0); B.decorAt('aqFlag', x0 + w - 1, GY, 0);
  }
};
Object.assign(decor, {
  aqGrowler(ctx, x, y, t, th, d) { ctx.fillStyle = '#e8faff'; ctx.beginPath(); ctx.moveTo(x - 20, y + 30); ctx.lineTo(x - 14, y - 30); ctx.lineTo(x + 4, y - 34); ctx.lineTo(x + 18, y - 22); ctx.lineTo(x + 22, y + 30); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(120,190,240,0.5)'; ctx.fillRect(x - 16, y - 10, 34, 40); },
  aqFloeArt(ctx, x, y, t, th, d) { ctx.fillStyle = '#e8faff'; ctx.beginPath(); ctx.moveTo(x - d.w / 2 - 6, y - d.h + 2); ctx.lineTo(x + d.w / 2 + 6, y - d.h); ctx.lineTo(x + d.w / 2, y - d.h + 22); ctx.lineTo(x - d.w / 2, y - d.h + 20); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(120,190,240,0.5)'; ctx.fillRect(x - d.w / 2, y - d.h + 10, d.w, 10); }
});
const platforms = {
  // a section of the cracked floe (phase 3): it sinks when stood on
  aqFloePlat(ctx, p, t) { const x = p.x, y = p.y, w = p.w; ctx.fillStyle = '#e8faff'; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + w + 4, y); ctx.lineTo(x + w - 2, y + 18); ctx.lineTo(x + 2, y + 20); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(120,190,240,0.5)'; ctx.fillRect(x, y + 8, w, 8); ctx.strokeStyle = 'rgba(40,90,140,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + w * 0.4, y); ctx.lineTo(x + w * 0.5, y + 10); ctx.stroke(); },
  // the iceberg carrying Brady across the Southern Ocean
  aqBerg(ctx, p, t) {
    const x = p.x, y = p.y, w = p.w;
    ctx.fillStyle = '#e8faff'; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + w + 18, y - 2); ctx.lineTo(x + w + 6, y + 50); ctx.lineTo(x + 4, y + 56); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(90,170,230,0.45)'; ctx.beginPath(); ctx.moveTo(x - 6, y + 20); ctx.lineTo(x + w + 10, y + 18); ctx.lineTo(x + w + 6, y + 50); ctx.lineTo(x + 4, y + 56); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x - 10 - i * 8 - (t * 30 % 8), y + 22 + Math.sin(t * 6 + i) * 1.5, 2 + i, 0, TAU); ctx.fill(); }
    penguin(ctx, x + w - 10, y, t, 0.8, false);
  }
};

/* ---------------- the boss: BIG TUSK ---------------- */
// ICICLES AND ICE BLOCKS. A huge grumpy walrus who belly-slides across the floe. Stomps bounce off his blubber. Two
// things hurt him: an ICICLE from the ice ceiling (jump and bump one with your head: it shivers, then drops) and an
// ICE BLOCK kicked into him while he slides (he tumbles). Phase 1 (hp 6-5): slides, tusk spikes, belly flops.
// Phase 2 (hp 4-3): he bellows and penguins skid across the ice. Phase 3 (hp 2-1): the big flop cracks the floe:
// three floor sections become sinking floes over the water. Finish: he slides off into the water hole, thumbs up.
const iceBlockArt = (ctx, e, x, y, t) => {
  ctx.save(); ctx.translate(x, y - 13);
  const g = ctx.createLinearGradient(-13, -13, 13, 13); g.addColorStop(0, '#f4fcff'); g.addColorStop(1, '#8ac8f0');
  ctx.fillStyle = g; rr(ctx, -13, -13, 26, 26, 4); ctx.fill();
  ctx.strokeStyle = 'rgba(70,140,200,0.8)'; ctx.lineWidth = 1.5; rr(ctx, -13, -13, 26, 26, 4); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(-9, -9, 7, 3); ctx.fillRect(-9, -4, 3, 6);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2, -12); ctx.lineTo(8, 2); ctx.lineTo(4, 11); ctx.stroke();
  ctx.restore();
  if (e.onGround && !e.fast && e.g.boss && e.g.boss.state === 'fight') { ctx.fillStyle = `rgba(200,240,255,${0.5 + 0.4 * Math.sin(t * 7)})`; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('KICK', x, y - 32 + Math.sin(t * 6) * 2); }
};
// a block of ice: Brady kicks it (it slides a long way on the ice); it tumbles the walrus if it hits him mid-slide
const AqBlock = TourProp.make({
  w: 26, h: 26, kick: 9, bounce: 0.7, friction: 1.0, hurts: true, hp: 1, burst: '#d8f4ff', art: iceBlockArt,
  init(e) { e.iceBlock = true; },
  think(e, dt) { const b = e.g.boss; if (b && e.y > b.floorY + TS) { e.remove = true; Sound.play('splash', { vol: 0.4 }); e.g.burst(e.cx, b.floorY + 2 * TS, 10, '#bfe8ff', 'spark'); } }
});
// an icicle under the ice ceiling: bump it with your head and it shivers, then drops; it hurts whoever it lands on
class AqIcicle extends Ent {
  constructor(g, s) { super(g, s, 14, 40); this.aqIcicle = true; this.x = s.x - 7; this.hy = s.y; this.y = this.hy; this.state = 'hang'; this.k = 0; this.vy = 0; this.shiver = 0; }
  drop() { if (this.state !== 'hang') return; this.state = 'shake'; this.k = 0.35; Sound.play('crumble', { pitch: 2, vol: 0.4 }); }
  update(dt) {
    this.t += dt; const g = this.g, b = g.boss;
    if (this.shiver > 0) this.shiver -= dt;
    if (this.state === 'shake') { this.k -= dt; if (this.k <= 0) { this.state = 'fall'; this.vy = 0; } }
    else if (this.state === 'fall') {
      this.vy += PHYS.gDown * 0.8 * dt; this.y += this.vy * dt;
      if (b && b.state === 'fight' && b.hurtT <= 0 && overlap(this, b)) { b.hit('hazard', this); this.shatter(); return; }
      const t = tileAt(g.area, Math.floor(this.cx / TS), Math.floor((this.y + this.h) / TS));
      if (SOLID[t] || t === T.SEMI || this.y > this.hy + 12 * TS) this.shatter();
    }
    else if (this.state === 'gone') { this.k -= dt; if (this.k <= 0) { this.state = 'hang'; this.y = this.hy; this.vy = 0; } }
  }
  shatter() { this.g.burst(this.cx, this.y + this.h, 14, '#d8f0ff', 'spark'); Sound.play('break', { pitch: 1.8, vol: 0.4 }); this.state = 'gone'; this.k = 5; this.y = this.hy; }
  touchPlayer(p) {
    if (this.state === 'fall') { p.hurt(this); return; }
    if (this.state === 'hang' && p.vy < 0 && p.y <= this.y + this.h && p.prevBottom - p.h > this.y + 4) { this.drop(); p.vy = 2 * TS; Sound.play('bump', { vol: 0.5 }); this.g.burst(this.cx, this.y + this.h, 5, '#ffffff', 'spark'); }
  }
  draw(ctx) {
    let a = 1; if (this.state === 'gone') { const k = 1 - this.k / 5; if (k < 0.75) return; a = (k - 0.75) / 0.25; }
    ctx.save(); ctx.globalAlpha = a;
    const x = this.cx + (this.state === 'shake' || this.shiver > 0 ? Math.sin(this.t * 60) * 1.8 : 0), y = this.y;
    const g = ctx.createLinearGradient(x - 7, 0, x + 7, 0); g.addColorStop(0, '#f0faff'); g.addColorStop(1, '#8ac8f0');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.lineTo(x + 1, y + 40); ctx.lineTo(x - 1, y + 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x - 4, y + 2, 2, 18);
    if (this.state === 'shake') { ctx.fillStyle = '#ffffff'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', x, y - 4); }
    ctx.restore();
  }
}
// the floe: keeps two ice blocks on the ice (new ones drop from the ceiling), cracks open in phase 3, and holds the
// water hole Big Tusk leaves by
class AqFloe extends Ent {
  constructor(g, s) { super(g, s, 10, 10); this.aqFloe = true; this.friendly = true; this.x0 = s.x0 * TS; this.w = s.w * TS; this.x = this.x0; this.x1 = this.x0 + this.w; this.floorY = s.y; this.GY = Math.floor(s.y / TS); this.y = this.floorY - 7 * TS; this.h = 8 * TS; this.cool = 0; this.drops = []; this.cracked = false; this.gaps = [s.x0 + 6, s.x0 + 12, s.x0 + 18]; this.crackT = 0; }
  blocks() { return this.g.entities.filter(e => e.iceBlock && !e.remove); }
  update(dt) {
    this.t += dt; const g = this.g, b = g.boss; if (this.crackT > 0) this.crackT -= dt;
    if (!b || b.state !== 'fight') return;
    if (this.cool > 0) this.cool -= dt;
    for (let i = this.drops.length - 1; i >= 0; i--) { const d = this.drops[i]; d.t -= dt; if (d.t <= 0) { this.drops.splice(i, 1); g.spawn(new AqBlock(g, { x: d.x, y: this.floorY - 5 * TS })); Sound.play('crumble', { pitch: 1.4, vol: 0.4 }); } }
    if (this.blocks().length + this.drops.length < 2 && this.cool <= 0) {
      this.cool = 2.2; const p = g.player; let x = this.x0 + 3 * TS + Math.random() * (this.w - 6 * TS);
      if (p && Math.abs(x - p.cx) < 2 * TS) x = p.cx + (p.cx < (this.x0 + this.x1) / 2 ? 3 : -3) * TS;
      this.drops.push({ x, t: 0.8 });
    }
  }
  crack() {
    if (this.cracked) return; this.cracked = true; this.crackT = 1.2; const g = this.g, A = g.area, GY = this.GY;
    for (const gx of this.gaps) {
      for (let x = gx; x < gx + 2; x++) for (let y = GY; y < A.H; y++) g.setTile(x, y, y < GY + 2 ? T.EMPTY : T.LAVA);
      g.spawn(new FallingPlatform(g, { x: (gx + 1) * TS, y: GY * TS, pw: 2, skin: 'aqFloePlat' }));
      g.burst((gx + 1) * TS, GY * TS, 20, '#d8f0ff', 'debris');
    }
    g.refreshPlatforms(); g.dirtyVariants = true; g.shake(12); Sound.play('break', { pitch: 0.5, vol: 1 });
  }
  draw(ctx) {
    const t = this.t, fy = this.floorY;
    decor.aqHole(ctx, this.x1 - 2.5 * TS, fy, t);
    for (const d of this.drops) { const k = 1 - d.t / 0.8; ctx.fillStyle = `rgba(20,60,110,${0.2 + 0.4 * k})`; ctx.beginPath(); ctx.ellipse(d.x, fy - 2, 12 + k * 6, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', d.x, fy - 5 * TS - 6 + Math.sin(t * 20) * 2); }
    if (this.cracked) {
      ctx.strokeStyle = 'rgba(40,90,140,0.7)'; ctx.lineWidth = 2;
      for (const gx of this.gaps) for (const s of [-1, 1]) { const x = s < 0 ? gx * TS : (gx + 2) * TS; ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x + s * 14, fy + 10); ctx.lineTo(x + s * 8, fy + 24); ctx.lineTo(x + s * 20, fy + 40); ctx.stroke(); }
    }
  }
}
// penguins that skid across the ice on their bellies (phase 2): stompable, bowled over by a block
const skidderArt = (ctx, e, x, y, m, t) => {
  if (m === 'flat' || m === 'ko') { ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.5 : 1); penguin(ctx, 0, 0, t, 1.1, false); ctx.restore(); return; }
  ctx.save(); ctx.translate(x, y - 2); ctx.scale(e.dir, 1); penguin(ctx, 4, 0, t, 1.15, true); ctx.restore();
  ctx.strokeStyle = 'rgba(220,245,255,0.8)'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - e.dir * (16 + k * 6), y - 3 - k * 4); ctx.lineTo(x - e.dir * (30 + k * 8), y - 3 - k * 4); ctx.stroke(); }
};
const AqSkidder = TourEnemy.make({
  w: 30, h: 18, speed: 6.5, art: skidderArt, burst: '#ffffff',
  init(e) { e.passes = 0; e.aqSkidder = true; },
  think(e, dt) { e.mode = 'walk'; const sp = 6.5 * TS; e.life = (e.life || 0) + dt; if (e.hitWall) { e.passes++; Sound.play('bump', { vol: 0.3, pitch: 1.5 }); } e.vx = sign(e.vx || e.dir) * sp; if (e.passes >= 2 || e.life > 9) { e.remove = true; Sound.play('splash', { vol: 0.35 }); e.g.burst(e.cx, e.y + e.h, 8, '#bfe8ff', 'spark'); } if (Math.random() < 0.3) e.g.burst(e.cx - e.dir * 14, e.y + e.h, 1, '#e8faff', 'dust'); }
});
class AqWave extends Ent {
  constructor(g, x, floorY, dir) { super(g, null, 26, 16); this.x = x - 13; this.y = floorY - 16; this.dir = dir; this.life = 1.4; }
  update(dt) { this.t += dt; this.life -= dt; this.x += this.dir * 6 * TS * dt; const g = this.g, tx = Math.floor((this.cx + this.dir * 14) / TS); const under = tileAt(g.area, tx, Math.floor((this.y + this.h + 4) / TS)); if (this.life <= 0 || SOLID[tileAt(g.area, tx, Math.floor((this.y + 4) / TS))] || !(SOLID[under] || under === T.SEMI)) this.remove = true; }
  touchPlayer(p) { p.hurt(this); }
  draw(ctx) { ctx.fillStyle = '#e8faff'; for (let k = 0; k < 4; k++) { const sx = this.x + k * 7, h = 8 + ((k + Math.floor(this.t * 20)) % 3) * 4; ctx.beginPath(); ctx.moveTo(sx, this.y + this.h); ctx.lineTo(sx + 3.5, this.y + this.h - h); ctx.lineTo(sx + 7, this.y + this.h); ctx.fill(); } }
}
const spikeArt = (ctx, s) => { ctx.fillStyle = '#e8faff'; ctx.beginPath(); ctx.moveTo(s.x, s.y + s.h); ctx.lineTo(s.cx, s.y); ctx.lineTo(s.x + s.w, s.y + s.h); ctx.fill(); };
function tuskFloe(b) { if (!b.floe) b.floe = b.g.entities.find(e => e.aqFloe) || null; return b.floe; }
function tuskFlop(b, big) {
  const g = b.g; g.shake(big ? 16 : 10); Sound.play('stomp', { pitch: 0.4 });
  for (const d of [-1, 1]) g.spawn(new AqWave(g, b.cx + d * (b.w / 2 + 12), b.floorY, d));
  for (const e of g.entities) if (e.aqIcicle) e.shiver = 0.5;
  g.burst(b.cx, b.floorY, 24, '#e8faff', 'dust');
}
function tuskCall(b) {
  const g = b.g; let n = 0; for (const e of g.entities) if (e.aqSkidder && !e.remove && !e.dead) n++;
  for (let k = 0; k < 2 - n; k++) { const left = (k + b.cycle) % 2 === 0; const e = new AqSkidder(g, { x: left ? b.arenaX0 + 20 : b.arenaX1 - 20, y: b.floorY, dir: left ? 1 : -1 }); e.vx = e.dir * 6.5 * TS; g.spawn(e); g.burst(e.cx, e.y + e.h, 8, '#ffffff', 'dust'); }
}
const boss = {
  id: 'aq_walrus', name: 'Big Tusk', hp: 6, dims: [100, 54], music: 'tour_aq_boss', country: 'aq',
  brain: {
    guardText: 'BLUBBER!',
    phases: [4, 2],
    noDisc(b) { return true; },
    wake(b) { b.phase = 1; b.passes = 2; b.callT = 0; K.say(b.g, b, 'HARRUMPH! MY ICE!', '#bfe8ff'); },
    hit(b, kind, src) {
      if (b.act === 'exit') return false;
      if (kind === 'hazard' && src && src.aqIcicle) { b.damage(1, { text: 'ICICLE!', col: '#d8f4ff' }); return true; }
      if (kind === 'prop' && src && src.iceBlock) {
        // only a block Brady kicked counts (one he shoved himself just skids off him)
        if (src.thrownBy !== b.g.player) return false;
        if (b.act === 'slide' && b.at > 0.6) { b.damage(1, { text: 'TUMBLE!', col: '#d8f4ff' }); return true; }
        // not sliding: the block just bounces off his blubber
        K.say(b.g, b, pick(['BLUBBER!', 'TICKLES.', 'WAIT TILL I SLIDE.']), '#bfe8ff'); src.vx = -src.vx * 0.5; src.vy = -3 * TS; return false;
      }
      if (kind === 'stomp' || kind === 'spin') return 'bounce';
      if (kind === 'bump' || kind === 'disc' || kind === 'laser' || kind === 'prop' || kind === 'hazard') return false;
      return undefined;
    },
    // after a bounce off his back Brady is still a pixel inside the box for a frame: that is never contact
    touch(b, p) { if (b.act === 'exit') return true; if (p.vy < 0 && p.y + p.h < b.y + 12) return true; return false; },
    phase(b, n) {
      const g = b.g;
      if (n === 2) { b.hurtT = 1.4; b.passes = 3; K.say(g, b, 'PENGUINS! TO ME!', '#bfe8ff'); g.bannerText = 'THE PENGUIN SQUAD'; g.bannerT = 2; b.go('call'); }
      if (n === 3) { b.hurtT = 1.6; b.passes = 3; K.say(g, b, 'ENOUGH! THE BIG ONE!', '#bfe8ff'); g.bannerText = 'THE FLOE CRACKS'; g.bannerT = 2; b.go('bigflop'); }
    },
    lastHit(b) { if (b.act !== 'exit') { b.vuln = false; b.go('exit'); } return true; },
    update(b, dt) {
      const g = b.g, p = g.player, first = b.first, ph = b.phase || 1;
      b.guard = 'bounce';
      if (b.act === 'walk') {
        b.face(); b.walk(0.7); b.pose = 'walk';
        if (ph >= 2) { b.callT += dt; let n = 0; for (const e of g.entities) if (e.aqSkidder && !e.remove && !e.dead) n++; if (n === 0 && b.callT > 7) { b.callT = 0; b.go('call'); } }
        if (b.at > 1.4 && b.act === 'walk') { b.cycle++; b.go(['slide', 'tusks', 'flop', 'slide'][b.cycle % 4]); }
      }
      else if (b.act === 'slide') {
        if (first) { b.face(); b.turns = 0; K.say(g, b, pick(['HARRUMPH!', 'BELLY SLIDE!', 'OUT OF MY WAY!']), '#bfe8ff'); Sound.play('bump', { pitch: 0.5, vol: 0.5 }); }
        b.pose = b.at < 0.6 ? 'wind' : 'slide';
        if (b.at < 0.6) b.vx = -b.dir * 1.2 * TS;
        else {
          b.vx = b.dir * (7 + (ph >= 2 ? 1.5 : 0) + (ph >= 3 ? 1 : 0)) * TS;
          if (Math.random() < 0.6) g.burst(b.cx - b.dir * 40, b.floorY, 2, '#e8faff', 'dust');
          // stationary ice blocks in his path get shoved ahead of him (mind them: they hurt)
          for (const e of g.entities) if (e.iceBlock && !e.remove && !e.fast && overlap(e, b)) { e.fling(b.dir * 8 * TS, -4 * TS, b); Sound.play('kick', { vol: 0.4 }); }
          if (b.hitWall || (b.dir < 0 && b.x <= b.arenaX0 + 2) || (b.dir > 0 && b.x >= b.arenaX1 - b.w - 2)) { b.dir = -b.dir; b.turns++; g.shake(5); Sound.play('bump'); if (b.turns >= b.passes) b.go('walk'); }
        }
        if (b.at > 7) b.go('walk');
      }
      else if (b.act === 'tusks') {
        b.vx = 0; b.pose = 'tusks';
        if (first) { b.tx = p ? p.cx : b.cx; b.face(); K.say(g, b, 'TUSKS!', '#bfe8ff'); }
        if (b.at > 0.2 && b.at < 0.9 && Math.random() < 0.4) g.burst(b.tx + (Math.random() - 0.5) * 60, b.floorY, 2, '#e8faff', 'spark');
        if (b.at > 0.9 && !b.fired) { b.fired = true; g.shake(6); Sound.play('break', { pitch: 0.7 }); for (let k = -1; k <= 1; k++) tourFire(g, b.tx + k * 34, b.floorY - 4, { kind: 'spike', vy: -9 * TS, grav: PHYS.gDown * 0.6, w: 14, h: 26, life: 0.7, thru: true, col: '#e8faff', art: spikeArt }); }
        if (b.at > 1.5) { b.fired = false; b.go('walk'); }
      }
      else if (b.act === 'flop' || b.act === 'bigflop') {
        const big = b.act === 'bigflop';
        b.pose = b.at < 0.5 ? 'rear' : 'flop';
        if (first) { b.face(); b.vx = 0; if (!big) K.say(g, b, 'BELLY FLOP!', '#bfe8ff'); }
        if (b.at >= 0.5 && !b.fired) { b.fired = true; b.vy = -(big ? 15 : 13) * TS; b.vx = b.dir * 2 * TS; }
        if (b.fired && b.onGround && b.at > 0.8) { b.fired = false; tuskFlop(b, big); if (big) { const f = tuskFloe(b); if (f) f.crack(); K.say(g, b, 'OOPS.', '#bfe8ff'); } b.go('walk'); b.at = 0.6; }
      }
      else if (b.act === 'call') { b.vx = 0; b.pose = 'call'; if (first) { b.face(); Sound.play('bump', { pitch: 0.4, vol: 0.6 }); } if (b.at > 0.8 && !b.fired) { b.fired = true; tuskCall(b); K.say(g, b, 'SKID THEM OVER!', '#bfe8ff'); } if (b.at > 1.4) { b.fired = false; b.go('walk'); } }
      else if (b.act === 'tumble') { b.pose = 'tumble'; b.vx = -b.dir * 5 * TS * Math.max(0, 1 - b.at / 1.2); if (b.at > 1.3) b.go('walk'); }
      else if (b.act === 'exit') {
        b.pose = 'exit';
        if (first) { K.say(g, b, 'OKAY. OKAY. YOU WIN. HAVE THE ICE.', '#bfe8ff'); b.splashed = false; b.sunk = 0; }
        const hx = b.arenaX1 - 2.5 * TS;
        if (b.at > 1.2 && !b.splashed) { b.dir = sign(hx - b.cx) || 1; b.vx = b.dir * 5 * TS; if (Math.random() < 0.5) g.burst(b.cx - b.dir * 40, b.floorY, 2, '#e8faff', 'dust'); if (Math.abs(b.cx - hx) < 12) { b.splashed = true; b.vx = 0; Sound.play('splash'); g.burst(hx, b.floorY, 40, '#bfe8ff', 'spark'); g.shake(6); } }
        if (b.splashed) { b.vx = 0; b.sunk = Math.min(1, b.sunk + dt * 1.2); if (b.sunk >= 1 && !b.thumbed) { b.thumbed = true; K.say(g, { cx: hx, y: b.floorY - 30 }, 'THUMBS UP. GOOD FIGHT.', '#bfe8ff'); } }
        if (b.at > 5) b.die();
      }
      else b.go('walk');
      b.fall(dt);
    },
    hurt(b) { K.say(b.g, b, pick(['MY WHISKERS!', 'HARRUMPH!', 'BRRR-UTAL!']), '#bfe8ff'); b.g.burst(b.cx, b.cy, 22, '#e8faff', 'confetti'); b.go('tumble'); },
    draw(b, ctx, t) {
      const x = b.cx, y = b.y + b.h, d = b.dir, P = b.pose;
      if (P === 'exit' && b.splashed) { ctx.save(); ctx.beginPath(); ctx.rect(b.x - 40, b.y - 60, b.w + 80, b.h + 60); ctx.clip(); ctx.translate(0, b.sunk * 70); }
      ctx.save(); ctx.translate(x, y); ctx.scale(d, 1);
      if (P === 'slide') ctx.rotate(Math.sin(t * 30) * 0.03);
      if (P === 'wind') { ctx.translate(-Math.sin(t * 25) * 2, 0); ctx.scale(0.96, 1.04); }
      if (P === 'rear') ctx.rotate(-0.35);
      if (P === 'tumble') { ctx.rotate(-Math.min(1, b.at) * TAU * Math.max(0, 1 - b.at * 0.2)); ctx.scale(1, 0.95); }
      if (P === 'flop') ctx.scale(1.06, 0.9);
      if (P === 'call') ctx.rotate(-0.25);
      ctx.fillStyle = '#9a6a4a'; ctx.beginPath(); ctx.ellipse(-6, -24, 48, 24, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-50, -18); ctx.lineTo(-66, -26); ctx.lineTo(-62, -8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7a4a32'; ctx.beginPath(); ctx.ellipse(20, -6, 12, 6, 0.3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9a6a4a'; ctx.beginPath(); ctx.arc(34, -34, 18, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c89a7a'; ctx.beginPath(); ctx.ellipse(44, -28, 10, 8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff8e8'; for (const tx of [40, 48]) { ctx.beginPath(); ctx.moveTo(tx - 2, -24); ctx.lineTo(tx + (P === 'tusks' ? 2 : 0), -4 + (P === 'tusks' ? 8 : 0)); ctx.lineTo(tx + 2, -24); ctx.fill(); }
      ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(44, -30 + k * 2); ctx.lineTo(56, -32 + k * 3); ctx.stroke(); }
      if (P === 'tumble') K.dizzy(ctx, 34, -56, t); else if (P === 'exit') { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(36, -42, 3.5, 0.1, Math.PI - 0.1, true); ctx.stroke(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(32, -40, 1.6, 0, TAU); ctx.arc(40, -40, 1.6, 0, TAU); ctx.fill(); } else K.eyes(ctx, 36, -40, 1, 3, 2.6, P !== 'walk');
      if (P === 'call') { ctx.fillStyle = '#3a1a10'; ctx.beginPath(); ctx.ellipse(46, -22, 5, 7, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
      if (P === 'exit' && b.splashed) { ctx.restore(); const hx = b.arenaX1 - 2.5 * TS; ctx.fillStyle = 'rgba(190,232,255,0.9)'; ctx.beginPath(); ctx.ellipse(hx, b.floorY - 2, 22, 6, 0, 0, TAU); ctx.fill(); if (b.sunk >= 1) { ctx.save(); ctx.translate(hx, b.floorY); ctx.rotate(Math.sin(t * 3) * 0.1); ctx.fillStyle = '#9a6a4a'; rr(ctx, -6, -30, 12, 28, 5); ctx.fill(); rr(ctx, -2, -44, 6, 18, 3); ctx.fill(); ctx.restore(); } }
      if (P === 'wind') { ctx.fillStyle = '#ffffff'; ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(d > 0 ? '▶ ▶ ▶' : '◀ ◀ ◀', x + d * 70, y - 40); }
      if (P === 'call') { ctx.strokeStyle = `rgba(255,255,255,${0.6 + 0.4 * Math.sin(t * 20)})`; ctx.lineWidth = 2; const a0 = d > 0 ? 0 : Math.PI; for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(x + d * 50, y - 30, 8 + k * 7, a0 - 0.6, a0 + 0.6); ctx.stroke(); } }
    }
  }
};
Object.assign(entities, { aqIcicle: AqIcicle, aqBlock: AqBlock, aqFloe: AqFloe });
Object.assign(enemies, { aqSkidder: { cls: AqSkidder, place: 'walk' } });

/* ---------------- music: glassy bells and a drifting pad; brisk for the iceberg ---------------- */
const tracks = {
  tour_aq: {
    bpm: 96, bars: 8, rv: 0.6, dl: 0.25,
    ch: 'Dmaj7 Bm7 Gmaj7 A Dmaj7 F#m7 Gmaj7 A',
    ld: 'F#5:4 A5:4 D6:4 C#6:4 | B5:8 F#5:8 | G5:4 B5:4 D6:4 F#6:4 | E6:12 .:4 | F#6:4 E6:4 D6:4 A5:4 | C#6:8 F#5:8 | G5:4 A5:4 B5:4 D6:4 | A5:12 .:4',
    li: 'glass', lv: 0.14,
    bp: 'r.......r...r...', bi: 'sub', bv: 0.24,
    ap: '0.2.4.1.3.5.2.4.', ai: 'bell', av: 0.04, ao: 72,
    dr: ['k.......k.......', '....n.......n...'], dv: 0.26
  },
  tour_aq_ride: {
    bpm: 132, bars: 8, rv: 0.3, dl: 0.12,
    ch: 'G D Em C G D C D',
    ld: 'B5:2 D6:2 G6:2 D6:2 B5:4 G5:4 | A5:2 D6:2 F#6:2 D6:2 A5:8 | G5:2 B5:2 E6:2 B5:2 G5:4 E5:4 | C6:4 E6:4 G6:8 |' +
        'D6:2 B5:2 G5:2 B5:2 D6:4 G6:4 | F#6:2 D6:2 A5:2 D6:2 F#6:8 | E6:2 C6:2 G5:2 C6:2 E6:4 G6:4 | F#6:12 .:4',
    li: 'sq2', lv: 0.12,
    bp: 'r.r.r.o.r.r.r.f.', bi: 'pluckb', bv: 0.28,
    ap: '0.1.2.1.0.1.2.1.', ai: 'bell', av: 0.04, ao: 72,
    dr: ['k...k...k...k...', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.4
  },
  tour_aq_night: {
    bpm: 72, bars: 8, rv: 0.7, dl: 0.3,
    ch: 'Am7 Fmaj7 Cmaj7 G Am7 Fmaj7 Dm7 E',
    ld: 'E5:8 A5:8 | C6:8 A5:8 | G5:8 E6:8 | D6:12 .:4 | E6:8 C6:8 | A5:8 F5:8 | A5:4 C6:4 D6:4 F6:4 | E6:12 .:4',
    li: 'theremin', lv: 0.1,
    bp: 'r...............', bi: 'sub', bv: 0.22,
    ap: '0..2..4..1..3..5', ai: 'glass', av: 0.04, ao: 74,
    pd: 'c---------------', pi: 'pad', pv: 0.05, po: 52,
    dr: ['u...............', '........n.......'], dv: 0.22
  },
  tour_aq_boss: {
    bpm: 150, bars: 8, rv: 0.25, hx: 0.08,
    ch: 'Bm Bm G A Bm Bm G F#',
    ld: 'B5:2 D6:2 F#6:2 B6:2 A6:4 F#6:4 | D6:2 F#6:2 B5:4 D6:8 | G5:2 B5:2 D6:2 G6:2 F#6:4 D6:4 | E6:4 C#6:4 A5:8 |' +
        'F#6:2 E6:2 D6:2 C#6:2 B5:4 F#5:4 | B5:2 D6:2 F#6:4 B6:8 | G6:2 F#6:2 E6:2 D6:2 C#6:4 A#5:4 | B5:12 F#6:4',
    li: 'brass', lv: 0.15,
    bp: 'r.r.r.o.r.r.r.f.', bi: 'sawb', bv: 0.28,
    ap: 'c-..c-..c-..c-..', ai: 'bell', av: 0.05, ao: 64,
    dr: ['K...k...K...k.k.', '....s.......s...', 'h.h.h.h.h.h.h.h.', 'x...............'], dv: 0.45
  }
};

/* ---------------- the four levels ---------------- */
Tour.country({
  id: 'aq', secret: true, colors: COL, tagline: 'The secret land at the bottom of the world',
  themes, painters, dyn, decor, decorLights, platforms, enemies, entities, pieces: P, boss, power, tracks,
  music: { level: 'tour_aq', boss: 'tour_aq_boss' },
  landmark: 'the penguins\' snow castle',
  arrival: 'Brady, you found it! A whole secret continent. The penguins say hi. Actually they say "squawk". ♥ C',
  coin: { name: 'SNOWFLAKE', draw(ctx, x, y, t) { ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.8); ctx.strokeStyle = '#e8faff'; ctx.lineWidth = 2.2; for (let k = 0; k < 6; k++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -8); ctx.moveTo(0, -5); ctx.lineTo(-3, -7); ctx.moveTo(0, -5); ctx.lineTo(3, -7); ctx.stroke(); } ctx.restore(); } },
  star: { name: 'GOLDEN PENGUIN', draw(ctx, x, y, t) { ctx.save(); ctx.translate(x, y + 10); ctx.scale(Math.cos(t * 3) > 0 ? 1 : -1, 1); ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.ellipse(0, -11, 8, 11, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.ellipse(1.5, -9, 5, 8, 0, 0, TAU); ctx.fill(); ctx.restore(); } },
  levels: [
    { name: 'The Ice Shelf', style: 'run', theme: 'aq_shelf', gimmick: 'A penguin teaches the belly-slide: bowl through snowballs on long ice sheets, hop ice holes where leopard seals leap',
      enemies: [['aqSnowball', 3], ['aqSkua', 1]],
      hint: 'Belly-slide on the ice: it goes further and bowls enemies over!',
      postcard: 'Penguins slide on their tummies everywhere. I tried it. I am a natural. ♥ C',
      script: ['penguin', ['bowling', { n: 16 }], 'holes', ['seracs', { gold: true }], 'crevasse', 'cp', ['bowling', { n: 18, pins: 4 }], ['holes', { n: 4 }], 'seracs', 'crevasse', 'end'] },
    { name: 'Iceberg Drift', style: 'ride', theme: 'aq_sea', gimmick: 'Drift on an iceberg across the Southern Ocean: hop the growlers, grab goodies on passing floes, dodge orcas and skuas',
      enemies: [['aqSkua', 1]], vehicle: 'aqBerg', vehicleW: 6, deck: 10, below: 'liquid', scroll: 2.3, len: 160,
      hint: 'Growlers (small ice chunks) poke up from the sea: hop them!',
      postcard: 'An orca jumped right over our iceberg. It was showing off. It worked. ♥ C',
      script: ['growler', 'orcas', ['floe', { gold: true }], 'skuas', 'growler', 'orcas', 'floe', 'growler', 'skuas', ['floe', { gold: true }], 'orcas', 'growler'] },
    { name: 'Aurora Station', style: 'night', theme: 'aq_station', gimmick: 'A research station under the aurora: climb the modules, ride the heater vents, scale the radio mast, dodge the rovers',
      enemies: [['aqRover', 3], ['aqSnowball', 1]], dark: true,
      hint: 'Warm air from the heater vents lifts you up',
      postcard: 'The sky is dancing green. The scientists gave me cocoa and a very serious hat. ♥ C',
      script: [['flat', { n: 5 }], ['modules', { gold: true }], 'vent', 'mast', 'cp', 'modules', ['vent', {}], 'lsd', ['enemies', { n: 2 }], 'mast', 'end'] },
    { name: 'The Blizzard Palace', style: 'castle', theme: 'aq_storm', gimmick: 'Blizzard gusts come in waves over cracking ice, then Big Tusk the walrus: drop icicles on him and trip his belly-slides with kicked ice blocks until the floe cracks',
      enemies: [['aqSnowball', 2], ['aqRover', 1]], boss: 'aq_walrus', arena: 'glacier', arenaW: 26, roof: false,
      hint: 'Bump the icicles down on Big Tusk, and kick ice blocks into his belly-slide',
      postcard: 'You beat Big Tusk! He says sorry and offers you a fish. Just say no thank you. ♥ C',
      script: [['flat', { n: 4 }], 'blizzard', 'crevasse', ['seracs', {}], 'cp', 'sig', ['blizzard', {}], ['bowling', { n: 12, pins: 2 }], ['blocks', { content: 'power' }], 'arena'] }
  ]
});
})();
