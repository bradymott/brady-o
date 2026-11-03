/* ============================================================
   WORLD 22 (the hidden secret world): a dreamlike bonus land built around the number 22
   (a nod to the owner's novel "22"; nothing here retells the novel). Way in: door number 22
   in the 22nd level of the tour (Morocco 5-2), which opens once Brady has 22 postcards.
   22-1 The Station of Clocks   run    clock-face platforms drift in circles, your echo follows 1.4 s behind, things fall upward
   22-2 Mirror Lake             run    the whole level is mirrored (run left!), the lake reflects Brady upside down
   22-3 The Endless Corridor    night  corridors loop back on themselves until you find the way up; doors numbered 22
   22-4 The 22nd Door           castle the last room: the Other Brady copies your every move, mirrored, until the clock strikes 22:22
   ============================================================ */
(() => {
const COL = { a: '#ffd8a0', b: '#8a6ad8', c: '#5ad8c8' };
const K = TourKit;
const DREAM = ['#c8b8ff', '#ffc8d8', '#a8f0e8', '#ffe8b0', '#b8d8ff'];
if (typeof LIQUIDS !== 'undefined') LIQUIDS.dream = ['#d8c8ff', '#8a7ad8', '#3a2a6a', 'rgba(255,240,255,0.35)', '#b8a8ff', 'rgba(255,255,255,0.7)'];

/* ---------------- background painters ---------------- */
function clockFace(ctx, x, y, r, col, t) {
  ctx.fillStyle = col || '#f8f0e0'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(60,40,90,0.6)'; ctx.lineWidth = Math.max(1, r * 0.06); ctx.stroke();
  ctx.fillStyle = 'rgba(60,40,90,0.7)'; for (let k = 0; k < 12; k++) { const a = k * TAU / 12; ctx.fillRect(x + Math.cos(a) * r * 0.82 - 1, y + Math.sin(a) * r * 0.82 - 1, 2, 2); }
  // always 22:22 (the hour hand just past ten, the minute hand on 22)
  const hA = ((22 % 12) + 22 / 60) / 12 * TAU - Math.PI / 2, mA = 22 / 60 * TAU - Math.PI / 2;
  ctx.strokeStyle = '#3a2a5a'; ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.5, r * 0.09); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(hA) * r * 0.5, y + Math.sin(hA) * r * 0.5); ctx.stroke();
  ctx.lineWidth = Math.max(1, r * 0.06); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(mA) * r * 0.75, y + Math.sin(mA) * r * 0.75); ctx.stroke();
  ctx.lineCap = 'butt';
}
function door22(ctx, x, y, w, h, col) {
  ctx.fillStyle = col; rr(ctx, x - w / 2, y - h, w, h, w * 0.4); ctx.fill();
  ctx.fillStyle = '#f4ecd8'; rr(ctx, x - w * 0.3, y - h * 0.68, w * 0.6, h * 0.22, 2); ctx.fill();
  ctx.fillStyle = '#4a3a6a'; ctx.font = `bold ${Math.round(h * 0.17)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('22', x, y - h * 0.57); ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffd8a0'; ctx.beginPath(); ctx.arc(x + w * 0.28, y - h * 0.4, Math.max(1.5, w * 0.06), 0, TAU); ctx.fill();
}
const painters = {
  // great clocks hanging in the dusk, all stopped at 22:22
  w22Clocks(ctx, L, rng, H) { for (let k = 0; k < 6; k++) { const x = 80 + k * 170 + rng() * 40, y = L.base - 120 - rng() * 120, r = 26 + rng() * 34; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - r); ctx.stroke(); clockFace(ctx, x, y, r, rgba(L.color, 0.85)); } },
  // floating doors, each numbered 22, among soft clouds
  w22Doors(ctx, L, rng, H) {
    ctx.fillStyle = rgba('#ffffff', 0.18); for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.ellipse(rng() * BG_W, L.base - rng() * 80, 60 + rng() * 60, 14, 0, 0, TAU); ctx.fill(); }
    for (let k = 0; k < 5; k++) door22(ctx, 100 + k * 200 + rng() * 40, L.base - 20 - rng() * 70, 22 + rng() * 8, 40 + rng() * 14, DREAM[k % 5]);
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
  },
  // the corridor: patterned wallpaper, doors and clocks repeating forever
  w22Hall(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(L.color, 0.08); for (let x = 0; x < BG_W; x += 32) for (let y = 0; y < H; y += 32) if ((x + y) % 64 === 0) { ctx.beginPath(); ctx.arc(x + 16, y + 16, 5, 0, TAU); ctx.fill(); }
    for (let x = 64; x < BG_W; x += 256) { door22(ctx, x, L.base, 30, 54, shade(L.color, 0.2)); clockFace(ctx, x + 128, L.base - 90, 18, '#f4ecd8'); }
    ctx.fillStyle = shade(L.color, -0.2); ctx.fillRect(0, L.base, BG_W, H - L.base);
  },
  // a pale dream room for the last door
  w22White(ctx, L, rng, H) { ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H); clockFace(ctx, BG_W / 2, L.base - 150, 90, '#fffaf0'); for (let k = 0; k < 4; k++) door22(ctx, 120 + k * 260, L.base, 34, 64, DREAM[k]); }
};
const dyn = {
  // twenty-two postcards drifting through the sky
  w22Cards(ctx, L, camX, oy, S, W, t) {
    for (let k = 0; k < 22; k++) {
      const x = ((k * 173 + t * (8 + (k % 5) * 3) - camX * 0.05) % W + W) % W, y = oy + (30 + (k * 47) % 260 + Math.sin(t * 0.6 + k) * 10) * S;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 0.5 + k) * 0.4); ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#fff8ec'; ctx.fillRect(-7 * S, -5 * S, 14 * S, 10 * S); ctx.fillStyle = DREAM[k % 5]; ctx.fillRect(-6 * S, -4 * S, 6 * S, 8 * S); ctx.fillStyle = '#c86a8a'; ctx.fillRect(3 * S, -4 * S, 3 * S, 3 * S);
      ctx.restore();
    }
  }
};

/* ---------------- tiles ---------------- */
function dreamBox(ctx, th, f) {
  ctx.save(); ctx.shadowColor = 'rgba(255,220,180,0.9)'; ctx.shadowBlur = 5 + f * 1.5;
  const g = ctx.createLinearGradient(0, 0, TS, TS); g.addColorStop(0, '#d8c8ff'); g.addColorStop(1, '#ffc8d8');
  ctx.fillStyle = g; rr(ctx, 1, 2, TS - 2, TS - 3, 6); ctx.fill(); ctx.restore();
  clockFace(ctx, TS / 2, TS / 2 + 1, 10, '#fff8ec');
  ctx.fillStyle = '#4a3a6a'; ctx.font = `bold 7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('22', TS / 2, TS - 4 + Math.sin(f) * 0.5);
}
function dreamUsed(ctx) { ctx.fillStyle = '#b0a8c0'; rr(ctx, 1, 3, TS - 2, TS - 4, 6); ctx.fill(); }
const base = {
  ground: { style: 'marble', cap: '#e8dcff', capHi: '#ffffff', dirt: '#b8a8d8', dirt2: '#8a78b8', rock: '#c8b8e8' },
  brick: { style: 'stone', c1: '#d8c8f0', c2: '#a898c8', mortar: '#6a5a8a' }, hard: { c1: '#c8b8e8', c2: '#8a78b8' },
  semi: { style: 'plank', c1: '#ffe0b0', c2: '#c8a070' }, pillar: { c1: '#e8dcff', c2: '#b8a8d8', cap: '#ffffff', style: 'column' },
  accent: COL.a, qblockArt: dreamBox, usedArt: dreamUsed, tint: {}, bloom: 0.3, liquid: 'dream'
};
const themes = {
  w22_dusk: Object.assign({}, base, {
    name: 'The Station of Clocks', music: 'tour_w22', particles: 'motes', rays: '#ffe8d8',
    sky: ['#2a1a4a', '#8a6ab8', '#ffc8b8'], horizonGlow: '#ffd8c8', celestial: { type: 'moon', x: 0.72, y: 0.2, r: 34, color: '#fff4f0', glow: '#ffc8e0' }, stars: 0.5,
    layers: [{ kind: 'w22Clocks', color: '#fff0e0', base: 300, f: 0.04, dyn: 'w22Cards' }, { kind: 'w22Doors', color: '#6a5a9a', base: 350, f: 0.12 }],
    fog: '#ffd8e8', decor: ['w22Lamp', 'w22Bench']
  }),
  w22_lake: Object.assign({}, base, {
    name: 'Mirror Lake', music: 'tour_w22', particles: 'motes', rays: '#e8fff8',
    sky: ['#1a3a4a', '#6ab8b8', '#e8d8ff'], horizonGlow: '#e8f8ff', celestial: { type: 'moon', x: 0.3, y: 0.18, r: 30, color: '#f0fff8', glow: '#a8f0e8' }, stars: 0.4,
    layers: [{ kind: 'w22Clocks', color: '#e8fff8', base: 300, f: 0.04, dyn: 'w22Cards' }, { kind: 'w22Doors', color: '#3a6a7a', base: 345, f: 0.1 }],
    fog: '#c8f0e8', ground: { style: 'marble', cap: '#d8fff8', capHi: '#ffffff', dirt: '#8ab8c8', dirt2: '#5a8a9a', rock: '#a8d0d8' }, decor: ['w22Lamp']
  }),
  w22_corridor: Object.assign({}, base, {
    name: 'The Endless Corridor', music: 'tour_w22_hall', particles: 'motes',
    sky: ['#1a1024', '#2a1a3a', '#3a2848'], horizonGlow: '#ffc8a0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'w22Hall', color: '#4a3458', base: 360, f: 0.06 }],
    fog: '#ffc8a0', darkness: 0.3, ground: { style: 'wood', cap: '#8a5a4a', capHi: '#b88a6a', dirt: '#5a3a2e', dirt2: '#3a2420', rock: '#6a4a3a' }, decor: ['w22Lamp', 'w22Clock']
  }),
  w22_white: Object.assign({}, base, {
    name: 'The 22nd Door', music: 'tour_w22', particles: 'motes',
    sky: ['#e8e0ff', '#fff4f8', '#ffffff'], horizonGlow: '#ffffff', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'w22White', color: '#f4f0ff', base: 360, f: 0.06 }],
    fog: '#ffffff'
  })
};

/* ---------------- decor ---------------- */
const decor = {
  w22Lamp(ctx, x, y, t) { ctx.fillStyle = '#4a3a6a'; ctx.fillRect(x - 2, y - 58, 4, 58); ctx.fillStyle = `rgba(255,${226 + Math.sin(t * 2 + x) * 20},190,0.95)`; ctx.beginPath(); ctx.arc(x, y - 62, 7, 0, TAU); ctx.fill(); },
  w22Bench(ctx, x, y) { ctx.fillStyle = '#6a5a8a'; ctx.fillRect(x - 16, y - 12, 32, 4); ctx.fillRect(x - 14, y - 8, 3, 8); ctx.fillRect(x + 11, y - 8, 3, 8); ctx.fillRect(x - 16, y - 22, 32, 3); },
  w22Clock(ctx, x, y, t) { ctx.fillStyle = '#5a3a2e'; ctx.fillRect(x - 10, y - 70, 20, 70); clockFace(ctx, x, y - 56, 9, '#fff8ec'); ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.arc(x + Math.sin(t * 2) * 5, y - 24, 4, 0, TAU); ctx.fill(); },
  // a sign that says what everyone in World 22 says
  w22Sign(ctx, x, y, t, th, d) { ctx.fillStyle = '#4a3a6a'; ctx.fillRect(x - 2, y - 40, 4, 40); ctx.fillStyle = '#fff8ec'; rr(ctx, x - 46, y - 58, 92, 22, 4); ctx.fill(); ctx.fillStyle = '#4a3a6a'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(d.text || 'IT IS 22:22', x, y - 43); }
};
const decorLights = { w22Lamp: [110, '#ffe0c8', -62] };

/* ---------------- enemies: soft and strange ---------------- */
const alarmArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); if (m === 'flat') ctx.scale(1.3, 0.4);
  const ring = m === 'hop' ? Math.sin(t * 60) * 1.5 : 0; ctx.translate(ring, 0);
  ctx.fillStyle = '#c8a0e8'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 7, -22, 5, Math.PI, TAU); ctx.fill(); }
  clockFace(ctx, 0, -12, 10, '#fff8ec');
  ctx.strokeStyle = '#8a6ab8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -12, 10, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#8a6ab8'; ctx.fillRect(-7, -2, 3, 3); ctx.fillRect(4, -2, 3, 3);
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 0, -13, e.dir, 3, 1.6, false);
  ctx.restore();
};
const mothArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); const f = Math.sin(e.t * 10);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,220,180,0.25)'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#f0e0ff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 8, -2, 9, 6 + f * 2, s * 0.5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#c8a0e8'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 9, -2, 2.5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#6a5a8a'; ctx.beginPath(); ctx.ellipse(0, 0, 3, 7, 0, 0, TAU); ctx.fill();
  ctx.restore();
};
const envelopeArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  if (m !== 'flat' && m !== 'ko') K.feet(ctx, 0, 0, e.t, '#6a5a8a', 4, 5, m === 'stun');
  ctx.fillStyle = '#fff8ec'; ctx.fillRect(-12, -24, 24, 16);
  ctx.strokeStyle = '#c8a0c8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-12, -24); ctx.lineTo(0, -15); ctx.lineTo(12, -24); ctx.stroke();
  ctx.fillStyle = '#c86a8a'; ctx.fillRect(6, -22, 4, 4);
  ctx.fillStyle = '#4a3a6a'; ctx.font = `bold 6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('22', -5, -11);
  if (m !== 'flat' && m !== 'ko') K.eyes(ctx, 0, -19, 1, 3, 1.6, false);
  ctx.restore();
};
const hourglassArt = (ctx, e, x, y, m) => {
  ctx.save(); ctx.translate(x, y - 12); if (m === 'roll' || m === 'curl') ctx.rotate(e.t * 10 * e.dir);
  ctx.fillStyle = '#8a6a4a'; ctx.fillRect(-10, -13, 20, 3); ctx.fillRect(-10, 10, 20, 3);
  ctx.fillStyle = 'rgba(220,240,255,0.8)'; ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(8, -10); ctx.lineTo(1, 0); ctx.lineTo(8, 10); ctx.lineTo(-8, 10); ctx.lineTo(-1, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd8a0'; ctx.beginPath(); ctx.moveTo(-5, 10); ctx.lineTo(5, 10); ctx.lineTo(0, 4); ctx.fill();
  if (m !== 'roll' && m !== 'curl' && m !== 'flat' && m !== 'ko') K.eyes(ctx, 0, -5, e.dir, 3, 1.6, true);
  ctx.restore();
};
const enemies = {
  w22Alarm: { cls: TourEnemy.make({ w: 22, h: 26, speed: 1.0, behavior: 'hop', hopV: 10, hopEvery: 1.4, art: alarmArt, burst: '#c8a0e8', onHop: e => { if (e.g.onScreen(e)) Sound.play('bell', { pitch: 2, vol: 0.12 }); } }), place: 'walk' },
  w22Moth: { cls: TourFlyer.make({ w: 26, h: 16, range: 3, speed: 0.7, swoop: true, art: mothArt, burst: '#f0e0ff' }), place: 'fly' },
  w22Envelope: { cls: TourEnemy.make({ w: 24, h: 26, speed: 1.2, behavior: 'walk', art: envelopeArt, burst: '#fff8ec' }), place: 'walk' },
  w22Hourglass: { cls: TourEnemy.make({ w: 20, h: 26, speed: 0.6, behavior: 'roll', range: 8, rollSpeed: 5.5, art: hourglassArt, burst: '#ffd8a0' }), place: 'walk' }
};

/* ---------------- entities: the dream tricks ---------------- */
// your echo: it walks exactly where you walked, 1.4 seconds later. Don't let it catch you!
const drawShadowBrady = (ctx, x, y, f, t, col) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(f || 1, 1); ctx.globalAlpha = 0.72;
  ctx.fillStyle = col || '#5a3a8a';
  rr(ctx, -10, -40, 20, 30, 8); ctx.fill(); ctx.fillRect(-8, -12, 6, 12); ctx.fillRect(2, -12, 6, 12);
  ctx.beginPath(); ctx.arc(0, -48, 11, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(-1, -61, 6, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,255,0.85)'; ctx.fillRect(-2, -51, 12, 3);
  ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 4); ctx.strokeStyle = '#e8d8ff'; ctx.lineWidth = 2; rr(ctx, -12, -42, 24, 42, 9); ctx.stroke();
  ctx.restore();
};
class W22Echo extends Ent {
  constructor(g, s) { super(g, s, 20, 28); this.x0 = s.x - TS; this.x1 = s.x1; this.buf = []; this.on = false; this.home = { x: this.x, y: this.y }; }
  update(dt) {
    this.t += dt; const p = this.g.player; if (!p) return;
    if (p.dead || p.cx < this.x0 || p.cx > this.x1) { this.buf.length = 0; this.on = false; this.x = this.home.x; this.y = this.home.y; return; }
    this.buf.push({ t: this.t, x: p.x, y: p.y, w: p.w, h: p.h, f: p.facing });
    while (this.buf.length > 1 && this.buf[1].t <= this.t - 1.4) this.buf.shift();
    const b = this.buf[0];
    this.on = b.t <= this.t - 1.35;
    if (this.on) { this.x = b.x; this.y = b.y; this.w = b.w; this.h = b.h; this.f = b.f; } else { this.x = this.home.x; this.y = this.home.y; }
  }
  touchPlayer(p) { if (this.on) p.hurt(this); }
  draw(ctx) { if (this.on) drawShadowBrady(ctx, this.cx, this.y + this.h, this.f, this.t); }
}
// a looping corridor: walk on past the 22nd door and you are back where you started. The way on is above.
class W22Loop extends Ent {
  constructor(g, s) { super(g, s, 10, 10); this.span = (s.span || 12) * TS; this.floorY = s.y; this.loops = 0; }
  update(dt) {
    this.t += dt; const p = this.g.player; if (!p || p.dead || p.state !== 'play') return;
    if (p.cx > this.cx && p.cx < this.cx + TS && p.y + p.h > this.floorY - 2 * TS) {
      p.x -= this.span; this.g.camX -= this.span; this.loops++;
      K.say(this.g, p, ['déjà vu...', 'haven\'t I been here?', 'it is still 22:22', 'look up...'][Math.min(3, this.loops - 1)], '#e8d8ff');
      if (this.loops === 1) Sound.play('portal', { pitch: 1.6, vol: 0.4 });
    }
  }
  draw(ctx) { ctx.fillStyle = 'rgba(232,216,255,0.15)'; ctx.fillRect(this.cx - 4, this.floorY - 3 * TS, 8, 3 * TS); }
}
// a mirror-still lake: Brady's reflection hangs upside down beneath its surface
class W22Mirror extends Ent {
  constructor(g, s) { super(g, s, 10, 10); this.lineY = s.y; this.x0 = s.x - TS / 2; this.x1 = this.x0 + (s.len || 10) * TS; this.x = this.x0; this.w = this.x1 - this.x0; this.y = this.lineY - 5 * TS; this.h = 7 * TS; }
  draw(ctx) {
    const p = this.g.player; if (!p || p.dead || p.cx < this.x0 - 2 * TS || p.cx > this.x1 + 2 * TS) return;
    ctx.save(); ctx.beginPath(); ctx.rect(this.x0, this.lineY, this.x1 - this.x0, 6 * TS); ctx.clip();
    ctx.globalAlpha = 0.4; ctx.translate(0, 2 * this.lineY); ctx.scale(1, -1);
    try { p.draw(ctx); } catch (e) { }
    ctx.restore();
  }
}
const entities = { w22Echo: W22Echo, w22Loop: W22Loop, w22Mirror: W22Mirror };

/* ---------------- set pieces ---------------- */
const dreamPool = (st, x0, x1) => { st.pit(x0, x1); st.B.fill(x0, st.gy + 2, x1, st.H - 1, T.LAVA); };
const P = {
  // clock faces drift round in slow circles over the fog: ride them
  clocks(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const span = 10, cx = x + 3, cy = st.gy - 3, r = 2.5;
    dreamPool(st, x, x + span - 1);
    for (let k = 0; k < 2; k++) st.spawn('mplat', cx, cy, { pw: 3, orbit: r * TS, speed: 0.9, phase: k * Math.PI / 0.9, skin: 'w22ClockPlat' });
    for (let a = 0; a < 16; a++) { const th = a / 16 * TAU, gx = Math.round(cx + Math.cos(th) * r), gy2 = Math.round(cy + 1 + Math.sin(th) * r); for (let q = 0; q <= 2; q++) st.B.ghosts.push([gx + q, gy2]); }
    st.coins(cx, cx + 2, cy - 4);
    if (o.gold) st.gold(cx + 1, cy - 5, 'risky');
    x += span; st.floor(x, x + 2); return x + 3;
  },
  // your echo shadows you along this stretch
  echo(st, o) { const x = st.x, n = o.n || 18; st.floor(x, x + n); st.spawn('w22Echo', x + 1, st.gy - 1, { x1: (x + n) * TS }); st.B.prop('w22Sign', x + 1, st.gy - 1, 2, 1, 'none', { text: 'YOUR ECHO FOLLOWS' }); for (let k = 4; k < n; k += 5) st.semi(x + k, x + k + 2, st.gy - 3); st.coins(x + 2, x + n - 2, st.gy - 5); st.enemy('w22Envelope', x + n - 3, st.gy); return x + n + 1; },
  // a bubble where things fall upward (and every jump floats)
  upward(st, o) {
    const x = st.x, B = st.B, w = 10, gy = st.gy; st.floor(x, x + w + 1);
    const zh = Math.min(11, gy - 1);
    B.zone(x + 1, gy - zh, w, zh, 0, -58 * TS, 0, 'upward');
    B.prop('w22Rise', x + 1, gy - zh, w, zh, 'none', {});
    st.semi(x + 3, x + 4, gy - 5); st.semi(x + 7, x + 9, Math.max(3, gy - 9));
    st.coins(x + 7, x + 9, Math.max(1, gy - 11));
    if (o.gold) st.gold(x + 8, Math.max(1, gy - 12), 'must');
    return x + w + 2;
  },
  // stepping stones across the mirror lake; your reflection hangs below
  lake(st, o) {
    let x = st.x; st.floor(x, x + 1); x += 2;
    const n = o.n || 4, x0 = x;
    for (let k = 0; k < n; k++) { dreamPool(st, x, x + 1); x += 2; const h = k % 2; st.B.fill(x, st.gy - h, x + 1, st.H - 1, T.PILLAR); st.coins(x, x + 1, st.gy - h - 2); x += 2; }
    dreamPool(st, x, x + 1); x += 2;
    st.spawn('w22Mirror', x0, st.gy + 1, { len: x - x0 });
    st.floor(x, x + 2); return x + 3;
  },
  // three doors numbered 22: two of them lead back to where you came in
  doors(st, o) {
    const x = st.x, B = st.B, gy = st.gy; st.floor(x, x + 16);
    B.fill(x + 13, 1, x + 13, gy - 1, T.HARD);
    const pick = o.pick != null ? o.pick : 2;
    for (let k = 0; k < 3; k++) { const dx = x + 3 + k * 4; const pt = B.spawn('portal', dx, gy - 1, { kind: 'door', look: 'tourDoor22', target: k === pick ? { area: 0, x: (x + 15) * TS + TS / 2, y: gy * TS } : { area: 0, x: (x + 1) * TS + TS / 2, y: gy * TS } }); pt.x += 0; }
    B.prop('w22Sign', x + 1, gy - 1, 2, 1, 'none', { text: 'ONE DOOR IS TRUE' });
    st.coins(x + 3, x + 11, gy - 4);
    return x + 17;
  },
  // the endless corridor: the low road loops; climb up to the gallery to escape
  corridor(st, o) {
    const x = st.x, B = st.B, gy = st.gy, n = 14; st.floor(x, x + n + 3);
    B.fill(x, gy - 5, x + n + 3, gy - 5, T.HARD);
    for (let q = x + n + 1; q <= x + n + 3; q++) for (let y = gy - 4; y < gy; y++) B.set(q, y, T.HARD);
    st.spawn('w22Loop', x + n, gy - 1, { span: n - 2 });
    B.decorAt('w22Clock', x + 4, gy, 0); B.decorAt('w22Clock', x + 10, gy, 0);
    for (let q = x + 2; q <= x + n; q += 4) B.pickAt(q, gy - 2);
    // the way up: a gap in the ceiling near the start, then the gallery above
    B.set(x + 2, gy - 5, T.EMPTY); B.set(x + 3, gy - 5, T.EMPTY); B.set(x + 2, gy - 5, T.SEMI); B.set(x + 3, gy - 5, T.SEMI);
    B.fill(x + 1, gy - 2, x + 1, gy - 1, T.HARD);
    st.coins(x + 5, x + n + 2, gy - 7);
    if (o.gold) st.gold(x + n, gy - 8, 'high');
    st.enemy('w22Hourglass', x + 8, gy - 5);
    return x + n + 4;
  },
  arena_door(st, o) { const B = st.B, { x0, w, GY } = o; for (let q = 0; q < 4; q++) { B.set(x0 + 3 + q, GY - 4, T.SEMI); B.set(x0 + w - 7 + q, GY - 4, T.SEMI); } B.decorAt('w22Clock', x0 + Math.floor(w / 2), GY, 0); }
};
Object.assign(decor, {
  // inside the upward bubble: postcards, leaves and petals drift up instead of down
  w22Rise(ctx, x, y, t, th, d) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(232,216,255,0.12)'; ctx.fillRect(x - d.w / 2, y - d.h, d.w, d.h); for (let k = 0; k < 12; k++) { const ph = (t * 0.25 + k / 12) % 1; ctx.save(); ctx.translate(x - d.w / 2 + ((k * 53) % d.w), y - ph * d.h); ctx.rotate(t + k); ctx.fillStyle = `rgba(255,248,236,${0.6 * (1 - ph)})`; ctx.fillRect(-5, -3.5, 10, 7); ctx.restore(); } ctx.restore(); }
});
const platforms = {
  w22ClockPlat(ctx, p, t) { const x = p.x, y = p.y, w = p.w; ctx.fillStyle = '#8a6ab8'; rr(ctx, x, y, w, 10, 5); ctx.fill(); clockFace(ctx, x + w / 2, y + 24, 16, '#fff8ec'); ctx.strokeStyle = '#8a6ab8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + w / 2, y + 24, 16, 0, TAU); ctx.stroke(); }
};

/* ---------------- the final secret boss: THE OTHER BRADY ---------------- */
// Behind the 22nd door waits Brady's own reflection. It mirrors everything Brady does across the
// room. Nothing can touch it... except when the great clock strikes 22:22 and time stands still
// for it (and only for it). Stomp it then!
const boss = {
  id: 'w22_other', name: 'The Other Brady', hp: 4, dims: [26, 58], music: 'tour_w22_boss', country: 'w22',
  brain: {
    guardText: 'THAT\'S MY MOVE!',
    wake(b) { K.say(b.g, b, '...HELLO, ME.', '#e8d8ff'); b.clockT = 0; },
    update(b, dt) {
      const g = b.g, p = g.player, mid = (b.arenaX0 + b.arenaX1) / 2;
      b.guard = 'bounce'; b.clockT = (b.clockT || 0) + dt;
      if (b.act === 'walk') {
        b.pose = 'mirror';
        const tx = clamp(2 * mid - (p ? p.cx : mid), b.arenaX0 + b.w, b.arenaX1 - b.w);
        b.vx = clamp((tx - b.cx) * 6, -7 * TS, 7 * TS); b.dir = p && p.cx < b.cx ? -1 : 1;
        if (p && p.vy < -6 * TS && !p.onGround && b.onGround) b.vy = -15 * TS;
        if (b.at > 1.2 && Math.random() < dt * 0.5) { tourFire(g, b.cx, b.y + 20, { kind: 'shard', vx: b.dir * 5 * TS, vy: 0, w: 14, h: 8, life: 3, col: '#e8d8ff', art: (ctx, s) => { ctx.fillStyle = 'rgba(232,216,255,0.9)'; ctx.beginPath(); ctx.moveTo(s.x, s.cy); ctx.lineTo(s.cx, s.y); ctx.lineTo(s.x + s.w, s.cy); ctx.lineTo(s.cx, s.y + s.h); ctx.fill(); } }); }
        if (b.clockT > (b.hp <= 2 ? 6.5 : 5.5)) { b.clockT = 0; b.go('frozen'); }
      } else if (b.act === 'frozen') {
        // the clock strikes 22:22: time stands still, but only for the reflection
        if (b.first) { Sound.play('bell', { pitch: 0.5, vol: 0.6 }); K.say(g, b, '22:22', '#ffd8a0'); g.shake(3); }
        b.vx = 0; b.pose = 'frozen'; b.vuln = b.at > 0.1 && b.at < 2.2; b.guard = b.vuln ? 'hurt' : 'bounce';
        if (b.at > 2.2) b.go('walk');
      }
      b.fall(dt);
    },
    hurt(b) { b.go('walk'); b.clockT = 0; K.say(b.g, b, pick(['...OUCH, ME.', 'WE BOTH FELT THAT.', 'TIME IS ON YOUR SIDE.']), '#e8d8ff'); b.g.burst(b.cx, b.cy, 24, '#e8d8ff', 'confetti'); },
    draw(b, ctx, t) {
      const frozen = b.pose === 'frozen';
      drawShadowBrady(ctx, b.cx, b.y + b.h, b.dir, frozen ? 0 : t, frozen ? '#8a7ab8' : '#4a2a7a');
      if (frozen) { clockFace(ctx, b.cx, b.y - 30, 14, '#fff8ec'); ctx.fillStyle = 'rgba(255,216,160,0.35)'; ctx.fillRect(b.x - 6, b.y - 4, b.w + 12, b.h + 4); }
    }
  }
};

/* ---------------- music: a music-box waltz, a theremin corridor, a ticking finale ---------------- */
const tracks = {
  tour_w22: {
    bpm: 66, bpb: 3, bars: 8, rv: 0.7, dl: 0.3,
    ch: 'Fmaj7 Em7 Dm7 Cmaj7 Fmaj7 Em7 Dm7 E7',
    ld: 'A5:3 C6:3 E6:3 C6:3 | G5:6 B5:6 | F5:3 A5:3 C6:3 A5:3 | E5:12 | A5:3 C6:3 F6:3 E6:3 | D6:6 B5:6 | C6:3 A5:3 F5:3 D5:3 | E5:6 G#5:6',
    li: 'mbox', lv: 0.14,
    bp: 'r...........', bi: 'sub', bv: 0.2,
    ap: '0.2.4.1.3.5.', ai: 'glass', av: 0.035, ao: 72,
    pd: 'c-----------', pi: 'swell', pv: 0.05, po: 52,
    dr: ['u...........', '......l.....'], dv: 0.22
  },
  tour_w22_hall: {
    bpm: 80, bars: 8, rv: 0.65, dl: 0.3,
    ch: 'Am Am F E Am Am Dm E',
    ld: 'E5:8 C5:8 | A4:12 .:4 | F5:8 A5:8 | G#5:12 .:4 | E6:8 C6:8 | A5:12 .:4 | D6:8 F6:8 | E6:12 .:4',
    li: 'theremin', lv: 0.1,
    bp: 'r.......r.......', bi: 'sub', bv: 0.2,
    ap: '0...2...1...3...', ai: 'mbox', av: 0.04, ao: 70,
    dr: ['l...l...l...l...', '........u.......'], dv: 0.22
  },
  tour_w22_boss: {
    bpm: 132, bars: 8, rv: 0.4, dl: 0.15,
    ch: 'Dm Bb Gm A Dm Bb Gm A',
    ld: 'D6:2 A5:2 F5:2 A5:2 D6:4 E6:4 | F6:2 D6:2 Bb5:2 D6:2 F6:8 | G6:2 D6:2 Bb5:2 G5:2 D6:4 Bb5:4 | A5:4 C#6:4 E6:8 |' +
        'F6:2 E6:2 D6:2 C6:2 Bb5:4 A5:4 | D6:2 F6:2 Bb6:4 A6:8 | G6:2 F6:2 E6:2 D6:2 C#6:4 E6:4 | D6:12 .:4',
    li: 'theremin', lv: 0.13,
    bp: 'r.r.r.o.r.r.r.f.', bi: 'sawb', bv: 0.24,
    ap: '0.1.2.3.0.1.2.3.', ai: 'mbox', av: 0.05, ao: 68,
    dr: ['k...k...k...k...', 'l.l.l.l.l.l.l.l.', '....s.......s...'], dv: 0.4
  }
};

/* ---------------- the four levels ---------------- */
Tour.country({
  id: 'w22', secret: true, colors: COL, tagline: 'Where every clock says 22:22',
  themes, painters, dyn, decor, decorLights, platforms, enemies, entities, pieces: P, boss, tracks,
  music: { level: 'tour_w22', boss: 'tour_w22_boss' },
  landmark: 'the 22nd door',
  arrival: 'Brady... every clock here says 22:22. Twenty-two postcards are floating in the sky. I think we\'re dreaming. ♥ C',
  coin: { name: 'STAR', draw(ctx, x, y, t) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2) * 0.2); ctx.fillStyle = '#ffd8a0'; ctx.beginPath(); K.star(ctx, 0, 0, 9, 4, 5); ctx.fill(); ctx.fillStyle = '#fff8ec'; ctx.beginPath(); ctx.arc(-2, -2, 2, 0, TAU); ctx.fill(); ctx.restore(); } },
  star: { name: 'GOLDEN CLOCK', draw(ctx, x, y, t) { clockFace(ctx, x, y + 2, 11, '#ffd24a'); } },
  levels: [
    { name: 'The Station of Clocks', style: 'run', theme: 'w22_dusk', gimmick: 'Clock faces drift in slow circles, your echo follows 1.4 s behind you, and in the bubbles things fall upward',
      enemies: [['w22Alarm', 3], ['w22Moth', 1], ['w22Envelope', 2]],
      hint: 'Keep moving: your echo walks exactly where you walked',
      postcard: 'The station clock says 22:22. It said 22:22 an hour ago, too. ♥ C',
      script: [['flat', { n: 5 }], ['clocks', { gold: true }], 'echo', ['upward', { gold: true }], 'cp', ['clocks', {}], ['echo', { n: 22 }], 'upward', 'end'] },
    { name: 'Mirror Lake', style: 'run', theme: 'w22_lake', mirror: true, gimmick: 'The whole level is mirrored, so run left! The lake reflects Brady upside down; doors numbered 22 hide the way on',
      enemies: [['w22Moth', 2], ['w22Alarm', 2]],
      hint: 'Everything here is the other way round. Go LEFT.',
      postcard: 'My reflection waved at me before I waved at it. ♥ C',
      script: [['flat', { n: 5 }], ['lake', { n: 4 }], ['doors', { pick: 1 }], ['upward', { gold: true }], 'cp', ['lake', { n: 5 }], 'stairs', ['clocks', { gold: true }], 'end'] },
    { name: 'The Endless Corridor', style: 'night', theme: 'w22_corridor', gimmick: 'Corridors loop back on themselves until you find the way up, and doors numbered 22 shuffle you around',
      enemies: [['w22Hourglass', 2], ['w22Envelope', 2]], dark: true,
      hint: 'If it feels like you\'ve been here before... look up',
      postcard: 'I walked down the same hallway 22 times. Then I looked up. ♥ C',
      script: [['flat', { n: 5 }], ['corridor', { gold: true }], ['doors', { pick: 2 }], 'cp', ['corridor', {}], ['doors', { pick: 0 }], ['corridor', {}], 'end'] },
    { name: 'The 22nd Door', style: 'castle', theme: 'w22_white', gimmick: 'A quiet white dream room where the Other Brady mirrors your every move, until the great clock strikes 22:22',
      enemies: [['w22Moth', 2], ['w22Alarm', 1]], boss: 'w22_other', arena: 'door', arenaW: 26, roof: false,
      hint: 'When the clock strikes 22:22, time stops for your reflection: stomp it!',
      postcard: 'You found the 22nd door, and you were brave enough to open it. That was the whole secret. ♥ C',
      script: [['flat', { n: 4 }], ['upward', {}], ['echo', { n: 14 }], 'cp', ['clocks', {}], ['blocks', { content: 'power' }], 'arena'] }
  ]
});
})();
