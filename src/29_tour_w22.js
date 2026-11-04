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
  // the last room: a mirror pane down the middle; Brady's side has a ledge, the Other Brady's side has the spike pits
  // and the great clock's pendulum
  arena_door(st, o) {
    const B = st.B, { x0, w, GY } = o, mid = x0 + Math.floor(w / 2);
    for (let q = 0; q < 4; q++) B.set(x0 + 4 + q, GY - 4, T.SEMI);
    const pits = [];
    for (const gx of [mid + 3, mid + 9]) { for (let x = gx; x < gx + 2; x++) { B.set(x, GY, T.EMPTY); B.set(x, GY + 1, T.EMPTY); B.set(x, GY + 2, T.SPIKES); } pits.push([gx * TS, (gx + 2) * TS]); }
    B.decorAt('w22Clock', x0 + 1, GY, 0); B.decorAt('w22Bench', x0 + 2, GY, 0); B.decorAt('w22Lamp', x0 + w - 2, GY, 0);
    const midPx = (x0 + w / 2) * TS;
    st.spawn('w22Pane', mid, GY - 1, { mid: midPx }); st.spawn('w22Strike', mid, GY - 1, { pits, mid: midPx }); st.spawn('w22Pendulum', mid + 6, GY - 1, {});
  }
};
Object.assign(decor, {
  // inside the upward bubble: postcards, leaves and petals drift up instead of down
  w22Rise(ctx, x, y, t, th, d) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(232,216,255,0.12)'; ctx.fillRect(x - d.w / 2, y - d.h, d.w, d.h); for (let k = 0; k < 12; k++) { const ph = (t * 0.25 + k / 12) % 1; ctx.save(); ctx.translate(x - d.w / 2 + ((k * 53) % d.w), y - ph * d.h); ctx.rotate(t + k); ctx.fillStyle = `rgba(255,248,236,${0.6 * (1 - ph)})`; ctx.fillRect(-5, -3.5, 10, 7); ctx.restore(); } ctx.restore(); }
});
const platforms = {
  w22ClockPlat(ctx, p, t) { const x = p.x, y = p.y, w = p.w; ctx.fillStyle = '#8a6ab8'; rr(ctx, x, y, w, 10, 5); ctx.fill(); clockFace(ctx, x + w / 2, y + 24, 16, '#fff8ec'); ctx.strokeStyle = '#8a6ab8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + w / 2, y + 24, 16, 0, TAU); ctx.stroke(); }
};

/* ---------------- the final secret boss: THE OTHER BRADY ---------------- */
// THE MIRROR. Behind the 22nd door a mirror pane splits the room. The Other Brady mirrors Brady's every move across it:
// walks when Brady walks, jumps when Brady jumps. He cannot be stomped (he stomps back) and the pane will not let
// Brady through. His side has the hazards: two spike pits (their mirror spots are marked on Brady's floor) and, from
// phase 2, the great clock's pendulum. Walk so that the mirror walks HIM into them. Every 22 seconds the clock strikes
// 22:22 and time stops for 2.2 seconds: the pane opens and Brady may cross and stomp him once.
//   Phase 1 (hp 6-5): the plain mirror.  Phase 2 (hp 4-3): the mirror inverts (he copies instead of reflecting) and the
//   pendulum swings.  Phase 3 (hp 2-1): two mirrors: a second copy appears. Finish: the mirror cracks, he waves goodbye.
const OTHER_HP = 6;
function otherMirrorX(b, px, mode) { const mid = (b.arenaX0 + b.arenaX1) / 2, half = (b.arenaX1 - b.arenaX0) / 2; const x = mode === 'invert' ? px + half : 2 * mid - px; return clamp(x, b.arenaX0 + 20, b.arenaX1 - 20); }
// a figure painted with Brady's own sprite, then tinted (the boss hurt-flash uses the same scratch canvas: never nest)
function tintedDraw(ctx, e, paint, col, a) {
  if (BossFx.scratch && ctx.canvas === BossFx.scratch) { paint(ctx); return; }
  if (!BossFx.tinted(ctx, e, paint, col, a)) paint(ctx);
}
function otherFigure(ctx, e, facing, frozen, alpha, t) {
  const anim = { state: !e.onGround && !frozen ? 'jump' : Math.abs(e.vx) > 20 && !frozen ? 'run' : 'idle', t: frozen ? 0.4 : t, phase: 0 };
  const paint = c => { c.save(); if (alpha < 1) c.globalAlpha = alpha; drawBrady(c, { x: e.cx, y: e.y + e.h, facing, small: false, anim, look: Save.data.look, time: frozen ? 0.4 : t }); c.restore(); };
  tintedDraw(ctx, e, paint, frozen ? '#ffd8a0' : e.boss ? '#7a4ad8' : '#2aa8a0', frozen ? 0.5 : 0.55);
  if (frozen) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,216,160,${0.5 + 0.4 * Math.sin(t * 10)})`; ctx.lineWidth = 2; rr(ctx, e.x - 5, e.y - 5, e.w + 10, e.h + 8, 8); ctx.stroke(); ctx.restore(); }
}
const shardArt = (ctx, s) => { ctx.save(); ctx.translate(s.cx, s.cy); ctx.rotate(s.t * 8); ctx.fillStyle = 'rgba(232,216,255,0.95)'; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(0, -5); ctx.lineTo(8, 0); ctx.lineTo(0, 5); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(-3, -1, 4, 1.5); ctx.restore(); };
// a mirror shard: a shot that stands still while time stands still
class W22Shard extends TourShot {
  update(dt) { const b = this.g.boss; if (b && b.act === 'frozen' && b.state === 'fight') return; super.update(dt); }
}
// the mirror pane: a wall for Brady, except while the clock strikes (and after the fight it is a heap of glass)
class W22Pane extends Ent {
  constructor(g, s) { super(g, s, 8, 8 * TS); this.w22Pane = true; this.mid = s.mid != null ? s.mid : s.x; this.x = this.mid - 4; this.floorY = s.y; this.y = this.floorY - 8 * TS; this.h = 8 * TS; this.shatterT = 0; this.gone = false; this.told = false; }
  get open() { const b = this.g.boss; return this.gone || !b || b.state !== 'fight' || (b.gateT || 0) > 0 || b.act === 'crack'; }
  shatter() { if (this.gone) return; this.gone = true; this.shatterT = 1.2; Sound.play('break', { vol: 0.9 }); this.g.shake(10); for (let k = 0; k < 7; k++) this.g.burst(this.mid, this.floorY - 20 - k * 34, 10, '#e8d8ff', 'debris'); }
  update(dt) { this.t += dt; if (this.shatterT > 0) this.shatterT -= dt; }
  touchPlayer(p) {
    if (this.open || p.dead) return;
    if (p.cx < this.mid) { p.x = Math.min(p.x, this.x - p.w - 0.5); if (p.vx > 0) p.vx = 0; } else { p.x = Math.max(p.x, this.x + this.w + 0.5); if (p.vx < 0) p.vx = 0; }
    if (!this.told) { this.told = true; this.g.toast('THE MIRROR ONLY OPENS AT 22:22'); }
  }
  draw(ctx) {
    if (this.gone && this.shatterT <= 0) return;
    const b = this.g.boss, x = this.mid, y0 = this.y, y1 = this.floorY, t = this.t, open = this.open;
    const flip = b && b.flipT > 0 ? Math.cos((0.8 - b.flipT) / 0.8 * Math.PI) : 1;
    ctx.save(); ctx.translate(x, 0); ctx.scale(Math.max(0.08, Math.abs(flip)), 1);
    const g = ctx.createLinearGradient(-4, y0, 4, y1); g.addColorStop(0, 'rgba(232,216,255,0.6)'); g.addColorStop(0.5, 'rgba(255,255,255,0.3)'); g.addColorStop(1, 'rgba(200,180,255,0.6)');
    ctx.fillStyle = open ? 'rgba(255,216,160,0.18)' : g; ctx.fillRect(-4, y0, 8, y1 - y0);
    ctx.strokeStyle = '#c8a03a'; ctx.lineWidth = 3; ctx.strokeRect(-6, y0, 12, y1 - y0);
    ctx.fillStyle = '#ffd8a0'; ctx.font = `bold 9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('22', 0, y0 - 5);
    if (!open) { ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.3 * Math.sin(t * 3)})`; const sy = y0 + ((t * 70) % (y1 - y0 - 20)); ctx.fillRect(-3, sy, 6, 20); }
    else { ctx.strokeStyle = `rgba(255,216,160,${0.5 + 0.5 * Math.sin(t * 12)})`; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.strokeRect(-4, y0, 8, y1 - y0); ctx.setLineDash([]); ctx.fillStyle = '#ffd8a0'; ctx.font = `bold 10px ${FONT_DISPLAY}`; ctx.fillText('GO', 0, y0 + 26 + Math.sin(t * 8) * 3); }
    if (this.gone) { ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, this.shatterT)})`; ctx.lineWidth = 2; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(0, y0 + k * 50); ctx.lineTo((k % 2 ? 1 : -1) * 22, y0 + k * 50 + 30); ctx.stroke(); } }
    ctx.restore();
  }
}
// the great clock on the back wall: it counts the 22 seconds, strikes 22:22, and marks on Brady's floor where the
// mirror would put the Other Brady into a spike pit
class W22Strike extends Ent {
  constructor(g, s) { super(g, s, 10, 10); this.friendly = true; this.w22Strike = true; this.cx0 = s.mid != null ? s.mid : s.x; this.floorY = s.y; this.pits = s.pits || []; this.lastTick = -1; this.glazed = []; }
  // a pit that just caught the reflection glazes over with dream-ice for a while: the other pit is the next trap
  glaze(px) {
    const pit = this.pits.find(([a, c]) => px >= a - 4 && px <= c + 4); if (!pit || this.glazed.some(z => z.pit === pit)) return;
    const g = this.g, GY = Math.floor(this.floorY / TS), gx = Math.floor(pit[0] / TS);
    for (let x = gx; x < gx + 2; x++) g.setTile(x, GY, T.ICE);
    this.glazed.push({ pit, gx, t: 14 }); g.burst((pit[0] + pit[1]) / 2, this.floorY, 16, '#d8f0ff', 'spark'); Sound.play('crumble', { pitch: 1.6, vol: 0.4 });
    g.parts.text((pit[0] + pit[1]) / 2, this.floorY - 40, 'GLAZED OVER', '#a8f0e8');
  }
  update(dt) {
    this.t += dt;
    for (let i = this.glazed.length - 1; i >= 0; i--) { const z = this.glazed[i]; z.t -= dt; if (z.t <= 0) { const GY = Math.floor(this.floorY / TS); for (let x = z.gx; x < z.gx + 2; x++) this.g.setTile(x, GY, T.EMPTY); this.g.burst((z.pit[0] + z.pit[1]) / 2, this.floorY, 10, '#d8f0ff', 'spark'); this.glazed.splice(i, 1); } }
    const b = this.g.boss; if (!b || b.state !== 'fight') return; const left = 22 - (b.clockT || 0), sec = Math.ceil(left); if (left < 5.5 && sec !== this.lastTick && b.act !== 'frozen') { this.lastTick = sec; K.sfx('tick', 'bump', { vol: 0.25, pitch: 2.2 }); } }
  draw(ctx) {
    const b = this.g.boss, x = this.cx0, y = this.floorY - 5.6 * TS, r = 44, t = this.t;
    const live = b && b.state === 'fight', k = live ? (b.clockT || 0) / 22 : 0, frozen = live && b.act === 'frozen';
    // the mirror spots: where standing would send the reflection into a pit (two colours when there are two mirrors)
    if (live && b.act !== 'crack') {
      const modes = [[b.mode || 'reflect', '#c86a8a']]; if (b.copies) modes.push([b.mode === 'invert' ? 'reflect' : 'invert', '#2aa8a0']);
      for (const [mode, col] of modes) for (const pit of this.pits) {
        const [px0, px1] = pit; const a = otherMirrorX(b, px0, mode), c = otherMirrorX(b, px1, mode), m0 = Math.min(a, c), m1 = Math.max(a, c);
        if (m1 - m0 < 10 || this.glazed.some(z => z.pit === pit)) continue;
        ctx.fillStyle = `rgba(${mode === 'invert' ? '42,168,160' : '200,106,138'},${0.2 + 0.12 * Math.sin(t * 5)})`; ctx.fillRect(m0, this.floorY - 3, m1 - m0, 3);
        ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.strokeRect(m0, this.floorY - 3, m1 - m0, 3); ctx.setLineDash([]);
        ctx.fillStyle = col; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('▲ ▲', (m0 + m1) / 2, this.floorY - 7 + Math.sin(t * 4) * 1.5);
      }
    }
    for (const z of this.glazed) { const [a, c] = z.pit; ctx.fillStyle = `rgba(216,240,255,${0.5 + 0.2 * Math.sin(t * 6)})`; ctx.fillRect(a, this.floorY, c - a, 6); ctx.fillStyle = '#4a3a6a'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(Math.ceil(z.t) + '', (a + c) / 2, this.floorY - 6); }
    ctx.fillStyle = '#5a3a2e'; ctx.fillRect(x - 5, y - r - 26, 10, 26);
    ctx.fillStyle = frozen ? '#fff0c8' : '#fff8ec'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a6ab8'; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = 'rgba(60,40,90,0.7)'; for (let q = 0; q < 12; q++) { const a = q * TAU / 12; ctx.fillRect(x + Math.cos(a) * r * 0.84 - 1.5, y + Math.sin(a) * r * 0.84 - 1.5, 3, 3); }
    const hA = (10 + (22 * k) / 60) / 12 * TAU - Math.PI / 2, mA = (22 * k) / 60 * TAU - Math.PI / 2;
    ctx.strokeStyle = '#3a2a5a'; ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(hA) * r * 0.5, y + Math.sin(hA) * r * 0.5); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(mA) * r * 0.78, y + Math.sin(mA) * r * 0.78); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = frozen ? '#c86a8a' : '#4a3a6a'; ctx.font = `bold 12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(frozen ? '22:22' : '22:' + String(Math.floor(22 * k)).padStart(2, '0'), x, y + r * 0.6);
    if (live && !frozen && b.act !== 'crack') { const left = Math.ceil(22 - (b.clockT || 0)); ctx.fillStyle = left <= 5 ? '#c86a8a' : 'rgba(60,40,90,0.6)'; ctx.font = `bold 10px ${FONT_DISPLAY}`; ctx.fillText(left + ' S', x, y - r * 0.35); }
    if (frozen) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,216,160,${0.22 + 0.18 * Math.sin(t * 20)})`; ctx.beginPath(); ctx.arc(x, y, r + 16, 0, TAU); ctx.fill(); ctx.restore(); }
  }
}
// the clock's pendulum over the Other Brady's side (from phase 2): it swings low enough to catch a jumping reflection
class W22Pendulum extends Ent {
  constructor(g, s) { super(g, s, 32, 32); this.w22Pendulum = true; this.ax = s.x; this.ay = s.y - 8 * TS; this.len = 5 * TS; this.on = false; this.k = 0; this.cool = 0; this.a = 0; this.x = this.ax - 16; this.y = this.ay + this.len - 16; }
  update(dt) {
    this.t += dt; const g = this.g, b = g.boss, frozen = b && b.act === 'frozen';
    if (this.on && !frozen) this.k += dt;
    if (this.cool > 0) this.cool -= dt;
    this.a = this.on ? 0.95 * Math.sin(this.k * 2.1) : 0;
    this.x = this.ax + Math.sin(this.a) * this.len - 16; this.y = this.ay + Math.cos(this.a) * this.len - 16;
    if (!this.on || frozen) return;
    const bob = { x: this.x + 4, y: this.y + 4, w: 24, h: 24 };
    if (b && b.state === 'fight' && b.hurtT <= 0 && this.cool <= 0 && overlap(bob, b)) { this.cool = 1; if (b.hit('hazard', this)) g.burst(this.cx, this.cy, 12, '#ffd8a0', 'spark'); }
    for (const e of g.entities) if (e.w22Copy && !e.dead && overlap(bob, e)) e.knock(this);
  }
  touchPlayer(p) { if (this.on && this.g.boss && this.g.boss.act !== 'frozen') p.hurt(this); }
  draw(ctx) {
    const bx = this.cx, by = this.cy, t = this.t;
    ctx.strokeStyle = '#8a6ab8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(this.ax, this.ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.fillStyle = '#5a3a2e'; ctx.fillRect(this.ax - 8, this.ay - 6, 16, 8);
    const g = ctx.createRadialGradient(bx - 5, by - 5, 2, bx, by, 16); g.addColorStop(0, '#ffe8a0'); g.addColorStop(1, '#c8a03a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, 16, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#4a3a6a'; ctx.font = `bold 10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('22', bx, by + 4);
    if (this.on) { ctx.strokeStyle = `rgba(255,216,160,${0.3 + 0.3 * Math.sin(t * 9)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by, 21, 0, TAU); ctx.stroke(); }
  }
}
// the third copy (phase 3): another reflection, through the other mirror
class W22Copy extends Ent {
  constructor(g, s) { super(g, s, 22, 54); this.enemy = true; this.w22Copy = true; this.mode = s.mode || 'reflect'; this.facing = 1; this.jumped = false; }
  update(dt) {
    this.t += dt; const g = this.g, b = g.boss, p = g.player;
    if (this.knocked) return this.updateKnocked(dt);
    if (this.dead) { this.remove = true; return; }
    if (b && b.act === 'frozen') { this.vx = 0; this.vy = 0; return; }
    if (p && !p.dead && b) {
      const tx = otherMirrorX(b, p.cx, this.mode), dx = tx - this.cx; this.vx = Math.abs(dx) < 2 ? 0 : clamp(dx * 12, -10 * TS, 10 * TS);
      this.facing = this.mode === 'invert' ? p.facing : -p.facing;
      if (p.vy < -5 * TS && !p.onGround && this.onGround && !this.jumped) { this.jumped = true; this.vy = p.vy; }
      if (this.jumped && !this.onGround && !p.onGround && p.vy < 0) this.vy = p.vy;
      if (p.onGround) this.jumped = false;
    } else this.vx = 0;
    this.vy += PHYS.gDown * 0.8 * dt; if (this.vy > PHYS.maxFall) this.vy = PHYS.maxFall;
    moveBody(this, g.area, dt, { semis: false }); otherUnstick(this);
    if (b) this.x = clamp(this.x, b.arenaX0, b.arenaX1 - this.w);
    if (this.onGround && otherOnSpikes(this)) this.knock({ spikes: true });
  }
  knock(src) { if (this.dead) return; K.say(this.g, this, 'OOF. ALSO ME.', '#a8f0e8'); this.knockOff(1); }
  hit(kind, src) {
    if (this.dead) return false; const b = this.g.boss;
    if (kind === 'stomp' || kind === 'spin') { if (b && b.act === 'frozen') { this.knock(src); return true; } return 'bounce'; }
    if (kind === 'star') { this.knock(src); return true; }
    return false;
  }
  touchPlayer(p) {
    if (this.dead || p.dead) return; const b = this.g.boss;
    if (p.vy < 0 && p.y + p.h < this.y + 12) return;
    if (b && b.act === 'frozen') return;
    p.hurt(this);
  }
  draw(ctx) {
    const b = this.g.boss, frozen = b && b.act === 'frozen';
    if (this.knocked) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(this.spin || 0); ctx.translate(-this.cx, -this.cy); otherFigure(ctx, this, this.facing, false, 0.7, this.t); ctx.restore(); return; }
    otherFigure(ctx, this, this.facing, frozen, 0.82, this.t);
    if (frozen) { ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(this.t * 10)})`; ctx.font = `12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('▼', this.cx, this.y - 12); }
  }
}
// he is not that stupid: on his feet he stops at the edge of a pit (only a mirrored jump lands him in one)
function otherRefuse(b, dt) {
  if (!b.onGround || !b.vx) return; const g = b.g;
  const ahead = Math.floor((b.cx + sign(b.vx) * (b.w / 2 + 4)) / TS), fy = Math.floor((b.y + b.h + 2) / TS);
  if (SOLID[tileAt(g.area, ahead, fy)]) return;
  b.vx = 0; b.refuseT = (b.refuseT || 0) + dt;
  if (b.refuseT > 1.5) { b.refuseT = -3; K.say(g, b, pick(['NICE TRY, ME.', 'I SEE THE SPIKES, ME.', 'NOT WALKING INTO THAT.']), '#e8d8ff'); }
}
// spikes under any part of his feet
function otherOnSpikes(b) { const A = b.g.area, y = Math.floor((b.y + b.h + 2) / TS); for (let x = Math.floor((b.x + 3) / TS); x <= Math.floor((b.x + b.w - 3) / TS); x++) if (tileAt(A, x, y) === T.SPIKES) return true; return false; }
// never stuck inside the floor: if his feet end up in solid tiles he is lifted onto them
function otherUnstick(e) { const A = e.g.area; let n = 0; while (n < 4 && !regionFree(A, e.x + 3, e.y + e.h - 6, e.w - 6, 5)) { e.y -= TS; n++; } if (n) { e.y = Math.floor((e.y + e.h) / TS) * TS - e.h; e.vy = Math.min(e.vy, 0); } }
function otherCopy(b) { const g = b.g, p = g.player; const mode = b.mode === 'invert' ? 'reflect' : 'invert'; const x = otherMirrorX(b, p ? p.cx : b.cx, mode); const c = new W22Copy(g, { x, y: b.floorY, mode }); g.spawn(c); g.burst(c.cx, c.cy, 20, '#a8f0e8', 'spark'); Sound.play('portal', { pitch: 1.4, vol: 0.4 }); return c; }
const boss = {
  id: 'w22_other', name: 'The Other Brady', hp: OTHER_HP, dims: [26, 58], music: 'tour_w22_boss', country: 'w22',
  brain: {
    guardText: 'THAT\'S MY MOVE!',
    phases: [4, 2],
    noDisc(b) { return true; },
    wake(b) {
      b.clockT = 0; b.freezeT = 0; b.gateT = 0; b.mode = 'reflect'; b.copies = 0; b.copyT = 0; b.shardT = 0; b.told = false;
      // he steps out of the mirror exactly where Brady's reflection would stand
      const p = b.g.player; if (p) b.x = otherMirrorX(b, p.cx, 'reflect') - b.w / 2; b.y = b.floorY - b.h; b.vx = 0; b.vy = 0;
      b.g.burst(b.cx, b.cy, 24, '#e8d8ff', 'spark'); Sound.play('portal', { pitch: 1.2, vol: 0.4 }); K.say(b.g, b, '...HELLO, ME.', '#e8d8ff');
    },
    hit(b, kind, src) {
      if (b.act === 'crack') return false;
      if (kind === 'hazard') { if (b.act === 'frozen') return false; b.damage(1, { text: src && src.spikes ? 'OUCH, ME.' : 'TICK. TOCK.', col: '#ffd8a0' }); return true; }
      if (kind === 'stomp' || kind === 'spin') { if (b.act === 'frozen') return undefined; b.counterT = 0.3; return 'bounce'; }
      if (kind === 'bump' || kind === 'disc' || kind === 'laser' || kind === 'prop') return false;
      return undefined;
    },
    // after a bounce Brady is still a pixel inside the box for a frame: that is never contact; frozen, he is harmless
    touch(b, p) { if (b.act === 'crack') return true; if (b.act === 'frozen') return !(p.vy > 0 && p.prevBottom <= b.y + b.h * 0.35); if (p.vy < 0 && p.y + p.h < b.y + 12) return true; return false; },
    phase(b, n) {
      const g = b.g;
      if (n === 2) { b.mode = 'invert'; b.hurtT = 1.6; b.flipT = 0.8; Sound.play('bell', { pitch: 0.7, vol: 0.6 }); K.say(g, b, 'THE MIRROR TURNS.', '#ffd8a0'); g.bannerText = 'THE MIRROR INVERTS'; g.bannerT = 2.2; g.flash = Math.max(g.flash || 0, 0.4); const pd = g.entities.find(e => e.w22Pendulum); if (pd) pd.on = true; g.toast('HE COPIES YOU NOW. AND THE PENDULUM SWINGS'); b.go('free'); }
      if (n === 3) { b.hurtT = 1.6; b.copies = 1; Sound.play('bell', { pitch: 0.6, vol: 0.6 }); K.say(g, b, 'TWO MIRRORS. THREE OF US.', '#ffd8a0'); g.bannerText = 'TWO MIRRORS'; g.bannerT = 2.2; g.flash = Math.max(g.flash || 0, 0.5); otherCopy(b); b.go('free'); }
    },
    lastHit(b) { if (b.act !== 'crack') { b.vuln = false; b.go('crack'); } return true; },
    update(b, dt) {
      const g = b.g, p = g.player, first = b.first, mid = (b.arenaX0 + b.arenaX1) / 2;
      b.guard = 'bounce';
      if (b.flipT > 0) b.flipT -= dt;
      if (b.gateT > 0) b.gateT -= dt;
      if (b.act === 'crack') {
        b.vx = 0; b.vy = 0; b.pose = 'wave';
        if (first) { const pane = g.entities.find(e => e.w22Pane); if (pane) pane.shatter(); for (const e of g.entities) if (e.w22Copy && !e.dead) e.knock(b); K.say(g, b, '...BYE, ME.', '#e8d8ff'); g.bannerText = 'THE MIRROR CRACKS'; g.bannerT = 2.5; b.face(); b.waved = false; }
        if (b.at > 1.4 && !b.waved) { b.waved = true; K.say(g, b, 'SEE YOU AT 22:22.', '#e8d8ff'); }
        if (b.at > 3.2) b.die();
        return;
      }
      if (b.act === 'frozen') {
        if (first) { b.freezeT = 2.2; b.gateT = 3.4; b.vx = 0; b.vy = 0; Sound.play('bell', { pitch: 0.5, vol: 0.7 }); g.shake(3); g.flash = Math.max(g.flash || 0, 0.35); g.parts.text(b.cx, b.y - 30, '22:22', '#ffd8a0'); g.bannerText = '22:22'; g.bannerT = 1.4; if (!b.told) { b.told = true; g.toast('TIME STOPS: THROUGH THE MIRROR AND STOMP HIM!'); } }
        b.freezeT -= dt; b.vx = 0; b.vy = 0; b.pose = 'frozen'; b.vuln = true; b.guard = 'hurt';
        if (b.freezeT <= 0) { b.vuln = false; b.clockT = 0; b.go('walk'); }
        return;
      }
      // the clock
      b.clockT += dt; if (b.clockT >= 22) { b.clockT = 22; b.go('frozen'); return; }
      // the third copy comes back a few seconds after it falls
      if (b.copies) { const alive = g.entities.some(e => e.w22Copy && !e.dead && !e.remove); if (!alive) { b.copyT += dt; if (b.copyT > 3) { b.copyT = 0; otherCopy(b); } } else b.copyT = 0; }
      if (b.counterT > 0 && b.act === 'walk') { b.counterT = 0; b.go('counter'); }
      if (b.act === 'walk') {
        b.pose = 'mirror';
        if (p && !p.dead) {
          const tx = otherMirrorX(b, p.cx, b.mode), dx = tx - b.cx;
          b.vx = Math.abs(dx) < 2 ? 0 : clamp(dx * 12, -10 * TS, 10 * TS);
          b.dir = b.mode === 'invert' ? p.facing : -p.facing;
          otherRefuse(b, dt);
          // his jump is Brady's jump: he leaves the ground when Brady does and rises exactly as Brady rises
          if (p.vy < -5 * TS && !p.onGround && b.onGround && !b.jumped) { b.jumped = true; b.vy = p.vy; }
          if (b.jumped && !b.onGround && !p.onGround && p.vy < 0) b.vy = p.vy;
          if (p.onGround) b.jumped = false;
        } else b.vx = 0;
        b.shardT += dt;
        if (b.shardT > 3.4 - (b.phase || 1) * 0.4) { b.shardT = 0; b.go('shard'); }
      } else if (b.act === 'shard') {
        b.pose = 'arm'; b.vx = 0;
        if (first) { b.face(); Sound.play('throw', { pitch: 1.6, vol: 0.3 }); }
        if (b.at > 0.55 && !b.fired) { b.fired = true; const sx = b.cx + b.dir * 14, sy = b.y + 18; const dx = p ? p.cx - sx : b.dir * 100, dy = p ? p.cy - sy : 0, d = Math.hypot(dx, dy) || 1; g.spawn(new W22Shard(g, sx, sy, { kind: 'shard', vx: dx / d * 6 * TS, vy: dy / d * 6 * TS, w: 14, h: 12, life: 4, thru: true, col: '#e8d8ff', art: shardArt })); Sound.play('throw', { pitch: 1.3, vol: 0.4 }); }
        if (b.at > 0.85) { b.fired = false; b.go('walk'); }
      } else if (b.act === 'climb') {
        b.pose = 'mirror';
        if (first) { b.vy = -20 * TS; b.vx = sign(otherMirrorX(b, p ? p.cx : mid, b.mode) - b.cx) * 3 * TS; }
        if (b.onGround && b.at > 0.3) b.go('free');
      } else if (b.act === 'free') {
        // for a moment he refuses the mirror: he walks his own side on his own, hunting Brady
        b.pose = 'mirror'; if (first) { b.side = b.cx < mid ? -1 : 1; b.face(); }
        b.face(); b.walk(1.8); otherRefuse(b, dt);
        if (b.side > 0) b.x = Math.max(b.x, mid + 8); else b.x = Math.min(b.x, mid - 8 - b.w);
        if (b.at > 2.2) b.go('walk');
      } else if (b.act === 'counter') {
        b.pose = 'mirror';
        if (first) { b.face(); b.vy = -12 * TS; b.vx = b.dir * 3 * TS; K.say(g, b, 'MY MOVE!', '#e8d8ff'); }
        if (b.onGround && b.at > 0.3) b.go('walk');
      } else b.go('walk');
      b.fall(dt); otherUnstick(b);
      // the spike pits on his side
      if (b.onGround && b.hurtT <= 0 && otherOnSpikes(b)) b.hit('hazard', { spikes: true });
    },
    hurt(b) {
      const g = b.g; b.gateT = Math.max(b.gateT || 0, 1.5);
      if (b.act === 'frozen') { b.clockT = 0; b.freezeT = 0; } else b.clockT = Math.min(b.clockT, 21);
      const onSpikes = otherOnSpikes(b);
      K.say(g, b, pick(['...OUCH, ME.', 'WE BOTH FELT THAT.', 'NOT FAIR, ME.', 'I HATE THIS SIDE.', 'TIME IS ON YOUR SIDE.']), '#e8d8ff');
      g.burst(b.cx, b.cy, 24, '#e8d8ff', 'confetti');
      if (onSpikes) { const st = g.entities.find(e => e.w22Strike); if (st) st.glaze(b.cx); b.go('climb'); } else { b.vx = 0; b.go('free'); }
    },
    draw(b, ctx, t) {
      const frozen = b.act === 'frozen', alpha = b.act === 'crack' ? Math.max(0, 1 - b.at / 2.6) : 1;
      if (alpha <= 0) return;
      otherFigure(ctx, b, b.dir, frozen, alpha, t);
      if (b.act === 'shard' || b.act === 'crack') {
        // the raised arm: the throwing tell, or the goodbye wave
        const wave = b.act === 'crack' ? Math.sin(t * 10) * 0.5 : 0, ax = b.cx + b.dir * 8, ay = b.y + 22;
        ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + b.dir * 10 + wave * 8, ay - 22); ctx.stroke(); ctx.lineCap = 'butt';
        ctx.fillStyle = '#f2c8a8'; ctx.beginPath(); ctx.arc(ax + b.dir * 10 + wave * 8, ay - 25, 4, 0, TAU); ctx.fill();
        if (b.act === 'shard' && b.at < 0.55) { ctx.save(); ctx.translate(ax + b.dir * 10, ay - 32); ctx.rotate(t * 8); ctx.fillStyle = `rgba(232,216,255,${0.5 + b.at})`; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(0, -5); ctx.lineTo(8, 0); ctx.lineTo(0, 5); ctx.fill(); ctx.restore(); }
        ctx.restore();
      }
      if (frozen) { clockFace(ctx, b.cx, b.y - 34, 14, '#fff8ec'); ctx.fillStyle = '#ffd8a0'; ctx.font = `bold 9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('22:22', b.cx, b.y - 52); }
      if (b.act === 'crack' && b.at > 0.3) { ctx.fillStyle = `rgba(255,120,190,${alpha * (0.6 + 0.4 * Math.sin(t * 5))})`; ctx.font = `10px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('♥', b.cx + Math.sin(t * 3) * 8, b.y - 16 - (t * 20) % 24); }
    }
  }
};
Object.assign(entities, { w22Pane: W22Pane, w22Strike: W22Strike, w22Pendulum: W22Pendulum, w22Copy: W22Copy });

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
    { name: 'The 22nd Door', style: 'castle', theme: 'w22_white', gimmick: 'A quiet white dream room split by a mirror: the Other Brady mirrors your every move, so walk him into the spike pits on his side; at 22:22 time stops and the mirror opens for one stomp',
      enemies: [['w22Moth', 2], ['w22Alarm', 1]], boss: 'w22_other', arena: 'door', arenaW: 26, roof: false,
      hint: 'Your reflection copies you: walk him into the spikes on HIS side. At 22:22 the mirror opens: stomp him!',
      postcard: 'You found the 22nd door, and you were brave enough to open it. That was the whole secret. ♥ C',
      script: [['flat', { n: 4 }], ['upward', {}], ['echo', { n: 14 }], 'cp', ['clocks', { gold: true }], ['blocks', { content: 'power' }], 'arena'] }
  ]
});
})();
