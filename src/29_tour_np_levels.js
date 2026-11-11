/* ============================================================
   Nepal (world 12, the finale): the levels in the v2 format
   (LEVEL_OVERHAUL.md §2 "World 12", §3.2 graph). Loads after
   29_tour_np.js (the look, the cast, the Tin Yak, Baron Bric-a-Brac)
   and adds, with Tour.amend: the stamps, the skins, the overhaul's
   set pieces, the Souvenir Stand Pasal, the map graph and all seven
   levels. Monasteries, stupas and prayer flags stay far-off scenery
   in the backgrounds: never platforms, pickups, hazards or tells.
   ============================================================ */
(() => {
const C = Tour.countries.np;
if (!C) return;
const K = TourKit;

/* ---------------- helpers ---------------- */
function room(W, H, floor, marks, opts) {
  opts = opts || {};
  const wall = opts.wall || 'H', rows = [];
  for (let y = 0; y < H; y++) {
    let r;
    if (y >= floor) r = '#'.repeat(W);
    else if (y === 0 && !opts.open) r = '#'.repeat(W);
    else r = wall + '.'.repeat(W - 2) + wall;
    rows.push(r.split(''));
  }
  for (const [x, y, txt] of marks) for (let k = 0; k < txt.length; k++) if (txt[k] !== ' ' && x + k < W && y < H) rows[y][x + k] = txt[k];
  return rows.map(r => r.join(''));
}
const pond = (st, x0, x1, row) => { st.pit(x0, x1); st.B.fill(x0, row, x1, st.H - 1, T.LAVA); };

/* ---------------- objects of the overhaul ---------------- */
// the mountain wind (12-1): a gust every few seconds; a whistle and streaks of snow give a second's warning. In a gust
// Brady is pushed east and the loose planks of the gust bridges swing down out of the way
const GUST = { period: 5.6, warn: 1.1, len: 1.6 };
const gustPhase = t => { const k = t % GUST.period; return k < GUST.period - GUST.warn - GUST.len ? 'calm' : k < GUST.period - GUST.len ? 'warn' : 'gust'; };
class NpGustWind extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; this.x0 = s.x; this.was = 'calm'; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player; this.x = g.camX; this.y = g.camY; this.w = Game.viewW; this.h = Game.viewH;
    const ph = gustPhase(g.t); g.npGust = ph;
    if (ph !== this.was) { if (ph === 'warn' && p && p.cx > this.x0 - 4 * TS && g.onScreen(this, 400)) K.sfx('wind_warn', 'wind', { vol: 0.35, pitch: 1.5 }); if (ph === 'gust' && p && p.cx > this.x0 - 4 * TS) { K.sfx('gust', 'wind', { vol: 0.6, pitch: 0.8 }); if (!this.told) { this.told = true; g.toast('A GUST! LOOSE PLANKS SWING DOWN'); } } this.was = ph; }
    if (ph === 'gust' && p && !p.dead && p.cx > this.x0 - 4 * TS && !p.onGround) g.windForce = 3.2 * TS;
  }
  draw(ctx) {
    const ph = this.g.npGust; if (ph === 'calm') return;
    const a = ph === 'warn' ? 0.25 : 0.55, x = this.g.camX, y = this.g.camY, W = Game.viewW, H = Game.viewH;
    ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 2;
    for (let i = 0; i < (ph === 'warn' ? 12 : 30); i++) { const sx = x + ((i * 233 + this.t * 900) % (W + 200)) - 100, sy = y + ((i * 97) % H); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 60, sy + 4); ctx.stroke(); }
    ctx.restore();
  }
}
// a suspension bridge with loose planks (marked with red-painted ends): in a gust they swing down and come back after
class NpGustBridge extends ENTITY_TYPES.npBridge {
  constructor(g, s) { super(g, s); this.all = this.planks.slice(); this.loose = new Set(s.loose || []); for (const pl of this.all) if (this.loose.has(pl.i)) { pl.loose = true; const d = pl.draw.bind(pl); pl.draw = ctx => { if (pl.swing > 0.05) { ctx.save(); ctx.translate(pl.x + 2, pl.y + 3); ctx.rotate(pl.swing * 1.4); ctx.translate(-pl.x - 2, -pl.y - 3); d(ctx); ctx.restore(); } else d(ctx); ctx.fillStyle = '#d8322a'; ctx.fillRect(pl.x + 2, pl.y + 1, 4, 5); ctx.fillRect(pl.x + TS - 6, pl.y + 1, 4, 5); }; pl.swing = 0; } }
  update(dt) {
    const down = this.g.npGust === 'gust';
    for (const pl of this.all) if (pl.loose) { pl.swing = approach(pl.swing, down ? 1 : 0, dt * (down ? 6 : 2)); pl.isPlatform = pl.swing < 0.3; if (!pl.isPlatform && this.g.player && this.g.player.ride === pl) this.g.player.ride = null; }
    this.planks = this.all.filter(pl => pl.isPlatform);
    super.update(dt);
  }
}
// a snow pile that rolls out a fresh snowball whenever the last one is gone (fallen, lost, smashed): no snowball, no stuck
class NpBallChute extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, TS); this.friendly = true; this.ball = null; this.k = 0.5; this.sx = s.x; this.sy = s.y; this.range = (s.range || 40) * TS; }
  update(dt) {
    this.t += dt; const b = this.ball;
    const lost = !b || b.remove || b.y > this.g.area.H * TS || (Math.abs(b.cx - this.sx) > this.range && Math.abs(b.vx) < 10);
    if (lost && this.g.player && Math.abs(this.g.player.cx - this.sx) < 18 * TS) {
      this.k -= dt;
      if (this.k <= 0) { this.k = 2.2; const e = new ENTITY_TYPES.tourBall(this.g, { x: this.sx + TS, y: this.sy, kind: 'snow', r: 0.6, maxScale: 2.2 }); this.g.spawn(e); this.ball = e; this.g.burst(this.sx + TS, this.sy - 12, 10, '#ffffff', 'dust'); }
    }
  }
  draw(ctx) {
    const x = this.sx, y = this.sy;
    ctx.fillStyle = '#f4f8ff'; ctx.beginPath(); ctx.ellipse(x - 6, y - 4, 26, 12, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = 'rgba(160,190,230,0.5)'; ctx.beginPath(); ctx.ellipse(x - 2, y - 2, 18, 5, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 24, y - 40, 3, 36); ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(x - 21, y - 40); ctx.lineTo(x - 6, y - 35); ctx.lineTo(x - 21, y - 30); ctx.fill();
  }
}
// a snow wall a grown snowball smashes (a charging yak does too)
class NpBallWall extends ENTITY_TYPES.npSnowWall {
  update(dt) {
    super.update(dt); if (this.broken) return;
    const box = { x: this.x - 8, y: this.y, w: this.w + 16, h: this.h };
    for (const e of this.g.entities) if (e.ball && !e.remove && Math.abs(e.vx) > 2 * TS && e.scale >= 1.35 && overlap(box, e)) { this.smash(this.g.player); e.vx *= 0.4; K.say(this.g, e, 'CRUNCH!', '#ffffff'); break; }
  }
}
// the yeti on watch (12-3): it walks its beat with a lantern; in its light for a moment, it raises the alarm. In a
// white-out it can't see a thing
class NpYetiWatch extends ENTITY_TYPES.watcher {
  update(dt) {
    const g = this.g, p = g.player;
    if (g.npWhiteout && p) { g.player = null; super.update(dt); g.player = p; this.seen = 0; return; }
    super.update(dt);
  }
  draw(ctx) {
    const g = this.g, blind = g.npWhiteout;
    if (!blind) { const [a, b, c] = this.cone(), hot = this.seen > 0.05 || g.alarmT > 0; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createLinearGradient(a[0], a[1], (b[0] + c[0]) / 2, (b[1] + c[1]) / 2); gr.addColorStop(0, hot ? 'rgba(255,90,70,0.45)' : 'rgba(255,230,150,0.4)'); gr.addColorStop(1, 'rgba(255,230,150,0.04)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath(); ctx.fill(); ctx.restore(); }
    const x = this.cx, y = this.y + this.h, d = this.dir, t = this.t;
    Ink.around(ctx, this.x - 18, this.y - 34, this.w + 36, this.h + 38, k => {
      k.save(); k.translate(x, y); k.scale(d, 1);
      const bob = Math.abs(Math.sin(t * 6)) * 2;
      k.fillStyle = '#e8eef8'; for (const s of [-1, 1]) { rr(k, s * 8 - 5, -12, 10, 12, 4); k.fill(); }
      k.fillStyle = '#f4f8ff'; k.beginPath(); k.ellipse(0, -28 - bob, 17, 19, 0, 0, TAU); k.fill();
      k.fillStyle = '#d8322a'; rr(k, -11, -26 - bob, 24, 5, 2.5); k.fill(); k.fillRect(8, -22 - bob, 4, 10);
      k.fillStyle = '#8ab0d8'; k.beginPath(); k.ellipse(5, -35 - bob, 9, 8, 0, 0, TAU); k.fill();
      if (blind) { k.strokeStyle = '#3a4a6a'; k.lineWidth = 1.4; for (const ex of [2, 9]) { k.beginPath(); k.moveTo(ex - 2, -37 - bob); k.lineTo(ex + 2, -37 - bob); k.stroke(); } }
      else K.eyes(k, 6, -37 - bob, 1, 2.4, 1.8, this.seen > 0.05);
      // the lantern it holds out in front
      k.strokeStyle = '#5a4030'; k.lineWidth = 2; k.beginPath(); k.moveTo(14, -24 - bob); k.lineTo(20, -18 - bob); k.stroke();
      k.fillStyle = blind ? '#8a7a5a' : '#ffd890'; rr(k, 16, -18 - bob, 9, 11, 3); k.fill();
      k.restore();
    }, { pad: 6 });
    if (this.seen > 0.05 && !blind) { ctx.fillStyle = '#ff5a4a'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', this.cx, this.y - 30); }
    if (blind) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('???', this.cx, this.y - 30 + Math.sin(t * 4) * 2); }
  }
  get light() { return this.g.npWhiteout ? null : { r: 80, c: 'rgba(255,230,150,', y: this.y + 20 }; }
}
// 12-4: the icefall speeds up once Brady climbs into the serac field
class NpRiseRamp extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; this.ty = s.y; this.speed = s.speed || 1.25; this.done = false; }
  update(dt) {
    const g = this.g, p = g.player, A = g.area; if (this.done || !p || !A.autoscrollY) return;
    if (p.y + p.h < this.ty) { this.done = true; A.autoscrollY = Object.assign({}, A.autoscrollY, { speed: this.speed }); g.toast('THE ICE IS SHIFTING: FASTER!'); g.shake(4); K.sfx('rumble', 'crumble', { vol: 0.6, pitch: 0.6 }); }
  }
  draw() {}
}
// 12-6: an ice bridge across the crevasse: land on it from a long fall and it bursts; a gap at its end is always open
class NpIceBridge extends Ent {
  constructor(g, s) { super(g, s, s.n * TS, TS); this.x = s.x - TS / 2; this.y = s.y; this.tx0 = Math.floor(s.x / TS); this.ty = Math.floor(s.y / TS); this.n = s.n; this.broken = false; this.back = true; this.fall = 0; this.k = 0; }
  update(dt) {
    this.t += dt; const p = this.g.player; if (this.broken) { this.k += dt; return; }
    if (p && !p.dead) { if (!p.onGround) this.fall = Math.max(this.fall, p.vy); else if (overlap({ x: this.x, y: this.y - 6, w: this.w, h: 10 }, { x: p.x, y: p.y + p.h - 2, w: p.w, h: 4 })) { if (this.fall > 8 * TS) this.burst(); this.fall = 0; } else this.fall = 0; }
  }
  burst() {
    this.broken = true; const g = this.g;
    for (let q = 0; q < this.n; q++) { g.setTile(this.tx0 + q, this.ty, T.EMPTY); g.burst((this.tx0 + q) * TS + 16, this.ty * TS + 16, 6, '#c8f0ff', 'debris'); }
    g.shake(4); K.sfx('ice_break', 'break', { vol: 0.7, pitch: 1.3 }); g.addScore(200, this.cx, this.y);
  }
  draw(ctx) {
    if (this.broken) return;
    for (let q = 0; q < this.n; q++) { const x = this.x + q * TS, y = this.y; ctx.fillStyle = 'rgba(190,235,255,0.92)'; rr(ctx, x + 1, y + 2, TS - 2, TS - 6, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x + 4, y + 4, TS - 10, 3); ctx.strokeStyle = 'rgba(80,150,210,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 6 + (q * 7) % 12, y + 8); ctx.lineTo(x + 14, y + 16); ctx.lineTo(x + 10 + (q * 5) % 10, y + 24); ctx.stroke(); }
  }
}
// 12-7: the SUPPLY DEPOT banner as Brady comes in (a FORT)
class NpFortBanner extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; this.title = s.title || 'FORT'; this.done = false; }
  update(dt) { const p = this.g.player; if (!this.done && p && p.cx > this.x - 2 * TS) { this.done = true; this.g.bannerText = this.title; this.g.bannerT = 1.8; K.sfx('fanfare', 'checkpoint', { vol: 0.5 }); } }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h;
    ctx.fillStyle = '#3a3a48'; ctx.fillRect(x - 3, y - 110, 6, 110); ctx.fillStyle = '#7a2ac8'; ctx.beginPath(); ctx.moveTo(x + 3, y - 108); ctx.lineTo(x + 46, y - 100 + Math.sin(this.g.t * 3) * 3); ctx.lineTo(x + 3, y - 80); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + 18, y - 96, 6, 0, TAU); ctx.fill();
  }
}
// 12-5: the Baron's souvenir jar on the vault floor: kick it (run into it) and it shatters a crate wall (practice for
// the fight, where the stolen landmarks get kicked back at him)
const jarArtLead = (ctx, e, x, y, t) => {
  ctx.fillStyle = 'rgba(210,240,255,0.85)'; ctx.beginPath(); ctx.arc(x, y - 13, 12, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c8a03a'; ctx.fillRect(x - 9, y - 26, 18, 4); ctx.fillStyle = '#7a2ac8'; ctx.fillRect(x - 10, y - 4, 20, 4);
  ctx.fillStyle = '#5a8a3a'; ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x, y - 18); ctx.lineTo(x + 6, y - 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(x - 5, y - 17, 3, 5, -0.4, 0, TAU); ctx.fill();
};
const NpJarBase = TourProp.make({ w: 26, h: 28, kick: 8, bounce: 0.2, friction: 5, roll: false, hp: 0, burst: '#d8f0ff', art: jarArtLead });
class NpJar extends NpJarBase {
  update(dt) {
    super.update(dt);
    if (!this.remove && Math.abs(this.vx) > 2 * TS) { const box = { x: this.x - 8, y: this.y, w: this.w + 16, h: this.h }; for (const e of this.g.entities) if (e.breakWall && !e.remove && e.needs === 'ball' && overlap(box, e)) { e.smash(); this.break(); break; } }
  }
}
// the conveyor of supply crates (12-7): crates ride the belt tiles under them
class NpCrateBelt extends Ent {
  constructor(g, s) { super(g, s, s.n * TS, 30); this.x = s.x - TS / 2; this.y = s.y - 30; this.n = s.n; this.off = 0; this.friendly = true; this.back = true; this.tx0 = Math.floor(s.x / TS); this.ty = Math.floor(s.y / TS); }
  update(dt) { this.t += dt; const tl = tileAt(this.g.area, this.tx0, this.ty); this.off += (tl === T.CONV_L ? -1 : 1) * 2.2 * TS * dt; }
  draw(ctx) {
    ctx.save(); ctx.beginPath(); ctx.rect(this.x, this.y - 10, this.w, 44); ctx.clip();
    for (let k = -1; k < this.n / 3 + 1; k++) { const px = this.x + ((k * 96 + this.off) % (this.w + 96) + this.w + 96) % (this.w + 96) - 48, y = this.y + 4; ctx.fillStyle = k % 2 ? '#a8804a' : '#b88e54'; ctx.fillRect(px - 13, y, 26, 26); ctx.strokeStyle = '#6a4a24'; ctx.lineWidth = 1.5; ctx.strokeRect(px - 11, y + 2, 22, 22); ctx.fillStyle = '#7a2ac8'; ctx.fillRect(px - 7, y + 10, 14, 5); }
    ctx.restore();
  }
}
Object.assign(ENTITY_TYPES, { npGustWind: NpGustWind, npGustBridge: NpGustBridge, npBallChute: NpBallChute, npBallWall: NpBallWall, npYetiWatch: NpYetiWatch, npRiseRamp: NpRiseRamp, npIceBridge: NpIceBridge, npFortBanner: NpFortBanner, npJar: NpJar, npCrateBelt: NpCrateBelt });

Object.assign(PlatformArt, {
  // the Baron's crate lift: a pallet on chains
  npCrateLift(ctx, p, t) { const x = p.x, y = p.y, w = p.w; ctx.strokeStyle = '#5a5a6a'; ctx.lineWidth = 2; for (const cx of [x + 5, x + w - 5]) { ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y - 900); ctx.stroke(); } ctx.fillStyle = '#8a6a44'; rr(ctx, x, y, w, 12, 2); ctx.fill(); ctx.fillStyle = '#c8a070'; for (let q = x + 2; q < x + w - 2; q += 9) ctx.fillRect(q, y + 2, 6, 3); ctx.fillStyle = '#7a2ac8'; ctx.fillRect(x + w / 2 - 8, y + 6, 16, 4); }
});

/* ---------------- skins ---------------- */
const skins = {
  // 12-1: a tea house on its ledge: a stone hut with a blue door, a kettle steaming on the step
  npTeaHouseDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#c8bca8'; ctx.fillRect(x - 40, y - 60, 80, 60); ctx.fillStyle = '#a89c88'; for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) ctx.fillRect(x - 38 + k * 20 + (r % 2) * 10, y - 58 + r * 15, 16, 11);
    ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.moveTo(x - 48, y - 58); ctx.lineTo(x, y - 82); ctx.lineTo(x + 48, y - 58); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a5aa8'; rr(ctx, x - 13, y - 46, 26, 46, 3); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x + 7, y - 22, 2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a3a48'; rr(ctx, x + 22, y - 12, 14, 12, 4); ctx.fill(); for (let q = 0; q < 3; q++) { const ph = (t * 0.7 + q / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x + 30 + ph * 6, y - 16 - ph * 26, 3 + ph * 5, 0, TAU); ctx.fill(); }
  },
  // 12-2: an ice cave in the crevasse wall, lit blue from inside, cold mist curling out
  npIceCaveDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#a8d8f4'; ctx.beginPath(); ctx.ellipse(x, y - 30, 30, 34, 0, Math.PI, TAU); ctx.lineTo(x + 30, y); ctx.lineTo(x - 30, y); ctx.fill();
    ctx.fillStyle = `rgba(90,170,255,${0.7 + 0.2 * Math.sin(t * 3)})`; ctx.beginPath(); ctx.ellipse(x, y - 24, 18, 24, 0, Math.PI, TAU); ctx.lineTo(x + 18, y); ctx.lineTo(x - 18, y); ctx.fill();
    for (let q = 0; q < 4; q++) { const ph = (t * 0.5 + q / 4) % 1; ctx.fillStyle = `rgba(230,245,255,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.ellipse(x - 12 + q * 8 + ph * 10, y - 4 - ph * 8, 6 + ph * 8, 3 + ph * 3, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#e8f8ff'; for (let q = -2; q <= 2; q++) { ctx.beginPath(); ctx.moveTo(x + q * 10 - 3, y - 56 + Math.abs(q) * 4); ctx.lineTo(x + q * 10 + 3, y - 56 + Math.abs(q) * 4); ctx.lineTo(x + q * 10, y - 44 + Math.abs(q) * 4); ctx.fill(); }
  },
  // 12-3: the Baron's supply shed at the end of a sled track
  npShedDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#4a4a5a'; ctx.fillRect(x - 44, y - 64, 88, 64); ctx.fillStyle = '#5a5a6a'; for (let q = -44; q < 44; q += 11) ctx.fillRect(x + q, y - 64, 2, 64);
    ctx.fillStyle = '#e8f0fa'; ctx.beginPath(); ctx.moveTo(x - 50, y - 62); ctx.lineTo(x, y - 80); ctx.lineTo(x + 50, y - 62); ctx.lineTo(x + 46, y - 58); ctx.lineTo(x - 46, y - 58); ctx.fill();
    ctx.fillStyle = '#7a2ac8'; ctx.fillRect(x - 14, y - 58, 28, 10); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x, y - 53, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a2a38'; rr(ctx, x - 15, y - 44, 30, 44, 2); ctx.fill(); ctx.fillStyle = `rgba(255,214,140,${0.5 + 0.2 * Math.sin(t * 4)})`; ctx.fillRect(x - 11, y - 40, 22, 6);
    ctx.fillStyle = '#a8804a'; ctx.fillRect(x + 22, y - 22, 20, 22); ctx.fillStyle = '#7a2ac8'; ctx.fillRect(x + 26, y - 14, 12, 4);
  },
  // 12-3: the ice gate that slams down on an alarm
  npIceGate(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w, h = e.h, k = e.k != null ? e.k : (e.open ? 1 : 0), hh = h * (1 - k);
    ctx.fillStyle = 'rgba(170,220,250,0.9)'; rr(ctx, x + 2, y, w - 4, hh, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let yy = y + 6; yy < y + hh - 4; yy += 14) ctx.fillRect(x + 6, yy, w - 12, 3);
    ctx.fillStyle = '#5a6a8a'; ctx.fillRect(x - 2, y - 6, w + 4, 6);
  },
  // 12-4: a tent pitched in a niche of the icefall
  npTentDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(x - 38, y); ctx.lineTo(x, y - 56); ctx.lineTo(x + 38, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffb05a'; ctx.beginPath(); ctx.moveTo(x - 38, y); ctx.lineTo(x, y - 56); ctx.lineTo(x - 8, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x, y - 34); ctx.lineTo(x + 12, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8a8a98'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 56); ctx.lineTo(x + 50, y); ctx.moveTo(x, y - 56); ctx.lineTo(x - 50, y); ctx.stroke();
    ctx.fillStyle = '#f4f8ff'; ctx.beginPath(); ctx.ellipse(x, y, 46, 4, 0, Math.PI, TAU); ctx.fill();
  },
  // 12-5: the jar archive behind the belt; the stairs up to the summit
  npArchiveDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#3a1460'; rr(ctx, x - 34, y - 70, 68, 70, 4); ctx.fill();
    for (let r = 0; r < 3; r++) { ctx.fillStyle = '#5a3a24'; ctx.fillRect(x - 30, y - 64 + r * 20 + 14, 60, 3); for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(210,240,255,0.7)'; ctx.beginPath(); ctx.arc(x - 22 + k * 15, y - 64 + r * 20 + 7, 6, 0, TAU); ctx.fill(); } }
    ctx.fillStyle = '#120c18'; rr(ctx, x - 12, y - 40, 24, 40, 10); ctx.fill(); ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 1.5; rr(ctx, x - 12, y - 40, 24, 40, 10); ctx.stroke();
  },
  npSummitStairs(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#4a1a6a'; ctx.fillRect(x - 30, y - 80, 60, 80); ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 30, y - 80, 60, 4);
    for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#7a4aa8' : '#6a3a98'; ctx.fillRect(x - 22 + k * 3, y - 10 - k * 11, 44 - k * 6, 10); }
    ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.3 * Math.sin(t * 3)})`; ctx.beginPath(); ctx.arc(x, y - 74, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('▲', x, y - 86);
  },
  // 12-6: a side cave in the crevasse wall, lit blue
  npBlueCave(ctx, e, t) { return skins.npIceCaveDoor(ctx, e, t); },
  // 12-7: the depot's door into the crate hall
  npDepotDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#3a3a48'; rr(ctx, x - 22, y - 60, 44, 60, 3); ctx.fill(); ctx.fillStyle = '#5a5a6a'; for (let q = 0; q < 6; q++) ctx.fillRect(x - 18, y - 56 + q * 9, 36, 5); ctx.fillStyle = '#ffd84a'; for (let q = -22; q < 22; q += 10) { ctx.beginPath(); ctx.moveTo(x + q, y - 64); ctx.lineTo(x + q + 5, y - 64); ctx.lineTo(x + q + 10, y - 60); ctx.lineTo(x + q + 5, y - 60); ctx.fill(); } },
  npBackDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#5a4030'; rr(ctx, x - 15, y - 52, 30, 52, 5); ctx.fill(); ctx.fillStyle = '#2a5aa8'; rr(ctx, x - 11, y - 48, 22, 44, 3); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('◀', x, y - 56); },
  // the crate hatch (12-7 trapdoor look)
  npHatch(ctx, e, t) { const x = e.x, y = e.y, w = e.w || 64; ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x, y + (e.h || 8) - 8, w, 8); ctx.fillStyle = '#ffd84a'; for (let q = 0; q < w; q += 12) ctx.fillRect(x + q, y + (e.h || 8) - 6, 6, 3); },
  // a snow bank / snow wall look (ball walls use the snow wall's own art)
  npSnowBank(ctx, e, t) {}
};

/* ---------------- decor ---------------- */
Object.assign(Decor, {
  // sled tracks in the snow leading to the shed (12-3)
  npSledTracks(ctx, x, y, t, th, d) { const w = d.w || 200; ctx.strokeStyle = 'rgba(120,150,190,0.55)'; ctx.lineWidth = 2; for (const off of [0, 9]) { ctx.beginPath(); ctx.moveTo(x - w / 2, y - 3 + off * 0.2); for (let q = 0; q <= w; q += 16) ctx.lineTo(x - w / 2 + q, y - 3 + Math.sin(q / 40) * 1.5 + off * 0.2); ctx.stroke(); } },
  // a pillar of blue ice over the alarm's ice gate
  npIcePillar(ctx, x, y, t, th, d) { const w = d.w, h = d.h, x0 = x - w / 2 - 6; const g = ctx.createLinearGradient(x0, 0, x0 + w + 12, 0); g.addColorStop(0, '#a8d8f4'); g.addColorStop(0.5, '#e8f8ff'); g.addColorStop(1, '#7ab0d8'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 4, y - h); ctx.lineTo(x0 + w + 8, y - h - 6); ctx.lineTo(x0 + w + 12, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x0 + 6, y - h + 10, 3, h - 20); },
  // a herders' stone shelter (12-3): its roof is a ledge (the prop's 'top')
  npHerdHut(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2;
    ctx.fillStyle = '#8a8478'; ctx.fillRect(x0, y - h, w, h); ctx.fillStyle = '#7a766e'; for (let r = 0; r < Math.floor(h / 14); r++) for (let k = 0; k < Math.floor(w / 22); k++) ctx.fillRect(x0 + 2 + k * 22 + (r % 2) * 11, y - h + 2 + r * 14, 18, 10);
    ctx.fillStyle = '#e8f0fa'; rr(ctx, x0 - 6, y - h - 8, w + 12, 12, 5); ctx.fill();
    ctx.fillStyle = '#2a2a38'; rr(ctx, x - 12, y - 40, 24, 40, 10); ctx.fill(); ctx.fillStyle = `rgba(255,190,110,${0.5 + 0.2 * Math.sin(t * 5)})`; ctx.fillRect(x - 8, y - 30, 16, 8);
  },
  // the jar shelves of the Baron's archive and vault
  npJarShelf(ctx, x, y) { ctx.fillStyle = '#5a3a24'; ctx.fillRect(x - 30, y - 4, 60, 4); ctx.fillRect(x - 30, y - 34, 60, 4); for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(210,240,255,0.7)'; ctx.beginPath(); ctx.arc(x - 22 + k * 15, y - 12, 7, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x - 22 + k * 15, y - 42, 7, 0, TAU); ctx.fill(); } },
  // a tea-house table with a kettle and momo plates (the chiya room)
  npTeaTable(ctx, x, y, t) { ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 22, y - 18, 44, 5); ctx.fillRect(x - 18, y - 13, 4, 13); ctx.fillRect(x + 14, y - 13, 4, 13); ctx.fillStyle = '#3a3a48'; rr(ctx, x - 10, y - 30, 14, 12, 4); ctx.fill(); ctx.fillStyle = '#ffffff'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + 8 + k * 5, y - 20, 3, Math.PI, TAU); ctx.fill(); } for (let q = 0; q < 2; q++) { const ph = (t * 0.6 + q / 2) % 1; ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x - 3 + ph * 4, y - 34 - ph * 16, 2 + ph * 3, 0, TAU); ctx.fill(); } }
});

/* ---------------- pieces ---------------- */
const P = {
  /* ---- 12-1 bridges in the sky ---- */
  // a suspension bridge between two ridges over open sky: { n, holes, gold, monal }
  skyBridge(st, o) {
    const B = st.B, n = o.n || 10, holes = o.holes || []; let x = st.x; st.floor(x, x + 2); st.decor('npMarigolds', x + 1); x += 3;
    st.pit(x, x + n - 1);
    st.spawn(o.loose ? 'npGustBridge' : 'npBridge', x, st.gy - 1, { x0: x, n, holes, loose: o.loose || null });
    for (let i = 0; i < n; i++) if (holes.indexOf(i) < 0) B.ghosts.push([x + i, st.gy]);
    st.coins(x + 1, x + n - 2, st.gy - 3);
    if (o.monal) st.enemy('npMonal', x + Math.floor(n / 2), st.gy);
    if (o.gold) st.gold(x + (o.loose ? o.loose[0] : Math.floor(n / 2)), st.gy - 2, o.gold);
    x += n; st.floor(x, x + 2); st.decor('npStones', x + 1);
    st.gy = clamp(st.gy + (o.dy || 0), st.gyMin, st.gyMax);
    return x + 3;
  },
  // the mountain wind starts here (its controller; place it before the gust bridges)
  gustWind(st, o) { st.spawn('npGustWind', st.x, st.gy - 1, {}); if (o.sign) st.sign(st.x + 1, 'Red-painted planks are loose: a gust swings them down. Wait for the wind to drop!'); return st.x + (o.sign ? 3 : 0); },
  // the tea house on its ledge (the secret)
  teaHouse(st, o) { return Tour.pieces.door(st, { to: o.to, perch: 0, look: 'npTeaHouseDoor', back: o.back }); },

  /* ---- 12-2 the pass ---- */
  // a snow pile at the top of a slope that rolls out a snowball (and a fresh one whenever it's gone)
  snowball(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 4);
    B.spawn('npBallChute', x + 1, st.gy - 1, { range: o.range || 50 });
    B.vkey('ball', [[x + 1, st.gy - 1], [x + 2, st.gy - 1]]);
    if (o.sign) st.sign(x + 4, 'Push the snowball downhill: it grows as it rolls. A big one smashes snow walls!');
    return x + 5;
  },
  // a snow wall only a grown snowball (or a charging yak) breaks; packed snow fills the gully above it
  ballWall(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 8);
    B.fill(x + 5, 0, x + 6, st.gy - 6, T.GROUND);
    st.spawn('npBallWall', x + 5, st.gy - 1, { w: 2, h: 5, look: 'snow' });
    st.coins(x + 7, x + 8, st.gy - 2);
    if (o.first) st.sign(x + 1, 'Roll a big snowball into the wall to smash it. (A charging yak works too.)');
    return x + 9;
  },
  // a low snow bank to hop, P1 on its crest
  snowBank(st, o) { const B = st.B, x = st.x; st.floor(x, x + 8); B.fill(x + 3, st.gy - 3, x + 5, st.gy - 1, T.GROUND); st.decor('npSnowTuft', x + 4, st.gy - 3, 1); st.coins(x + 3, x + 5, st.gy - 5); if (o.gold) st.gold(x + 4, st.gy - 6, o.gold); return x + 9; },
  // the headline: a yeti on the trail (with a sign the first time)
  yetiMeet(st, o) {
    const x = st.x, n = 14; st.floor(x, x + n);
    st.enemy('npYeti', x + 10, st.gy);
    st.decor('npStones', x + 3, st.gy, 1);
    if (o.sign) st.sign(x + 1, 'A yeti! Its cheeks go blue before it breathes frost. Stomp it while it pants for breath');
    st.coins(x + 4, x + 8, st.gy - 3);
    return x + n + 1;
  },
  // an icy stretch where a big snowball rides fast; P3 hangs high over it (a ball ride, or a jump from the rock)
  ballRide(st, o) {
    const B = st.B, x = st.x, n = 14; st.floor(x, x + n + 1); for (let c = x + 1; c <= x + n; c++) B.set(c, st.gy, T.ICE);
    B.fill(x + n - 2, st.gy - 3, x + n, st.gy - 1, T.GROUND); st.decor('npSnowTuft', x + n - 1, st.gy - 3, 2);
    st.coins(x + 3, x + n - 4, st.gy - 3);
    if (o.gold) st.gold(x + n - 4, st.gy - 7, o.gold);
    return x + n + 2;
  },
  // a marmot on watch on a rock and a yeti asleep beyond it: get spotted and the marmot's whistle wakes the yeti
  sentinel(st, o) {
    const B = st.B, x = st.x, n = 18; st.floor(x, x + n);
    B.fill(x + 3, st.gy - 2, x + 5, st.gy - 1, T.GROUND); st.enemy('npMarmotWatch', x + 4, st.gy - 2, { dir: 1 });
    st.enemy('npYetiSleep', x + 12, st.gy);
    if (o.two) st.enemy('npYetiSleep', x + 16, st.gy);
    st.semi(x + 7, x + 9, st.gy - 4); st.coins(x + 7, x + 9, st.gy - 6);
    if (o.sign) st.sign(x + 1, 'Marmots keep watch. If one spots you it whistles, and every sleeping yeti wakes up!');
    return x + n + 1;
  },
  // the crevasse at the third snow wall: drop onto the ledge below the lip; an ice cave glows blue in its wall
  crevasseLip(st, o) {
    const B = st.B, x = st.x, w = 9; st.floor(x, x + 2);
    st.pit(x + 3, x + 2 + w); B.fill(x + 3, st.H - 2, x + 2 + w, st.H - 1, T.LAVA);
    // the ledge inside the crevasse, two rows under the lip, with the cave door in the far wall
    B.fill(x + 3, st.gy + 2, x + 6, st.gy + 2, T.GROUND);
    B.fill(x + 3 + w, st.gy - 1 + 0, x + 3 + w, st.gy + 3, T.GROUND);
    B.spawn('portal', x + 4, st.gy + 1, { kind: 'door', look: 'npIceCaveDoor', targetRef: o.to || null });
    if (o.back) B.anchor(o.back, x + 1, st.gy - 1);
    st.arc(x + 2, x + 3 + w, st.gy - 2, 3);
    st.floor(x + 3 + w, x + 6 + w);
    return x + 7 + w;
  },

  /* ---- 12-3 the blizzard ---- */
  // a yeti on watch with its lantern: hide in the box, behind a rock, or wait for a white-out. { first, two }
  yetiWatch(st, o) {
    const B = st.B, x = st.x, n = o.len || 16; st.floor(x, x + n - 1);
    B.spawn('npYetiWatch', x + Math.floor(n / 2) + 2, st.gy - 1, { kind: 'guard', sweep: 3, spawn: 'npSnowball', dir: -1 });
    if (o.two) B.spawn('npYetiWatch', x + n - 2, st.gy - 1, { kind: 'guard', sweep: 2, spawn: 'npSnowball', dir: -1 });
    B.spawn('hideSpot', x + 3, st.gy - 1, { look: 'rock' });
    if (o.first) st.sign(x + 1, 'A yeti on watch! Crouch behind a rock, use the box, or slip past in a white-out');
    st.coins(x + 5, x + n - 3, st.gy - 4);
    return x + n;
  },
  // a herders' stone shelter: its roof is a ledge (P1 on top)
  shelterHut(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 10);
    B.prop('npHerdHut', x + 2, st.gy - 4, 6, 4, 'body', {});
    for (let q = x + 1; q <= x + 8; q++) B.set(q, st.gy - 5, T.SEMI);
    st.coins(x + 3, x + 6, st.gy - 7);
    if (o.gold) st.gold(x + 5, st.gy - 8, o.gold);
    return x + 11;
  },
  // a sled track that leads to the Baron's supply shed (the secret)
  sledShed(st, o) {
    const x = st.x; st.floor(x, x + 12);
    st.B.prop('npSledTracks', x, st.gy, 8, 0, 'none', {});
    st.x = x + 6; const nx = Tour.pieces.door(st, { to: o.to, perch: 0, look: 'npShedDoor', back: o.back });
    return nx;
  },
  // the ice gate an alarm slams shut (the shutter), set in a pillar of blue ice
  iceGate(st, o) {
    const B = st.B, x = st.x, h = o.h || 3, nx = Tour.pieces.alarmShutter(st, { h, look: 'npIceGate' });
    const y0 = Math.max(0, st.gy - h - 7); for (let y = y0; y < st.gy - h; y++) B.setHide(x + 1, y, 1);
    B.prop('npIcePillar', x + 1, y0, 1, st.gy - h - y0, 'none', {});
    return nx;
  },
  // a yeti fast asleep across the trail, P3 right over it (and a marmot on watch if marmot: true)
  sleepYeti(st, o) {
    const B = st.B, x = st.x, n = 14; st.floor(x, x + n);
    st.enemy('npYetiSleep', x + 7, st.gy);
    if (o.marmot) { B.fill(x + 1, st.gy - 2, x + 2, st.gy - 1, T.GROUND); st.enemy('npMarmotWatch', x + 2, st.gy - 2, { dir: 1 }); }
    if (o.gold) st.gold(x + 7, st.gy - 4, o.gold);
    if (o.sign) st.sign(x + 1, 'Shh, a sleeping yeti. Walk, don\'t run: running and hard landings wake it');
    st.coins(x + 4, x + 10, st.gy - 5);
    return x + n + 1;
  },

  /* ---- 12-4 the icefall (climb bands: pieces move st.y up) ---- */
  // a tent pitched in a niche at the side of the icefall (the secret)
  tentNiche(st, o) {
    const B = st.B, W = st.W, y = st.y - 3, x0 = W - 11;
    B.fill(x0, y, W - 2, y, T.GROUND); B.fill(x0 + 2, y - 5, W - 2, y - 5, T.HARD);
    B.spawn('portal', x0 + 5, y - 1, { kind: 'door', look: 'npTentDoor', targetRef: o.to || null });
    if (o.back) B.anchor(o.back, x0 + 2, y - 1);
    B.fill(2, y - 2, 8, y - 2, T.GROUND); st.coins(3, 7, y - 4);
    for (let q = st.mid - 2; q < st.mid + 2; q++) B.set(q, y - 1, T.SEMI);
    st.top(y - 5);
  },
  // the serac field speeds the climb up (the controller at its foot)
  rampUp(st, o) { st.spawn('npRiseRamp', 2, st.y - 1, { speed: o.speed || 1.25 }); return st.x; },
  // a climb band with an item block on a ledge: { item, left, gold }
  blockLedge(st, o) {
    const B = st.B, W = st.W, y = st.y - 3, x0 = o.left ? 2 : W - 9;
    B.fill(x0, y, x0 + 6, y, T.GROUND); st.block(x0 + 3, y - 4, o.item || 'power');
    if (o.gold) st.gold(x0 + 1, y - 2, o.gold);
    for (let q = st.mid - 2; q < st.mid + 2; q++) B.set(q, y, T.SEMI);
    st.top(y - 3);
  },
  // seracs with P3 on the top block
  seracsP3(st, o) { const y0 = st.y; Tour.pieces['np.seracs'](st, {}); st.gold(10, y0 - 12, o.gold || 'risky'); },
  // the ladder band with P1 over the middle ladder
  laddersP1(st, o) { const y0 = st.y; Tour.pieces['np.ladders'](st, { n: o.n || 3 }); st.gold(st.mid, y0 - 6, o.gold || 'must'); },

  /* ---- 12-5 the vault ---- */
  // a souvenir jar and a crate wall: kick the jar into the wall (practice for the summit)
  jarKick(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 12);
    st.spawn('npJar', x + 4, st.gy - 1, {});
    B.vkey('ball', [[x + 4, st.gy - 1], [x + 3, st.gy - 1]]);
    st.x = x + 7; const nx = Tour.pieces.breakwall(st, { needs: 'ball', h: 4, skin: 'npCrateWallSkin' });
    if (o.sign) st.sign(x + 1, 'A jar of the Baron\'s! Run into it to kick it. Kicked things fly back hard...', st.gy);
    return nx;
  },
  // the gallery with P1 (must) and a star
  galleryP1(st, o) { const x = st.x, nx = Tour.pieces['np.gallery'](st, { item: o.item || 'star' }); st.gold(x + 9, st.gy - 7, 'must'); return nx; },
  // the jar archive's door at the end of a belt (the secret), P3 over the belt
  archiveBelt(st, o) {
    const B = st.B, x = st.x, n = 10; st.floor(x, x + n + 8);
    for (let c = x + 1; c <= x + n; c++) B.set(c, st.gy, T.CONV_R);
    st.semi(x + 3, x + 7, st.gy - 4); st.coins(x + 3, x + 7, st.gy - 6);
    if (o.gold) st.gold(x + 5, st.gy - 7, o.gold);
    st.enemy('npGlobe', x + 8, st.gy);
    B.decorAt('npJarShelf', x + n + 1, st.gy, 0);
    const s = B.spawn('portal', x + n + 4, st.gy - 1, { kind: 'door', look: 'npArchiveDoor', targetRef: o.to || null });
    if (o.back) B.anchor(o.back, x + n + 7, st.gy - 1);
    return x + n + 9;
  },

  /* ---- 12-6 the crevasse (shaft: pieces move st.y down) ---- */
  // the lip: a paper-plane stand and a first block
  lipStand(st, o) {
    const sx = st.x, sg = st.gy; st.x = 5; st.gy = 6; Tour.pieces.gearStand(st, { item: 'plane', here: true }); st.x = sx; st.gy = sg;
    st.B.set(8, 2, T.QBLOCK); st.B.item(8, 2, 'power');
    return st.x;
  },
  // a wide ice bridge: burst through it from a long fall (coins in it), or drop through the gap at its end
  iceBridge(st, o) {
    const B = st.B, W = st.W, y = st.down(o.gap || 9), left = !!o.left, g0 = left ? 1 : W - 5;
    // the bridge spans the shaft except a 4-wide gap at one end
    const x0 = left ? 5 : 1, n = W - 6;
    for (let q = 0; q < n; q++) B.set(x0 + q, y, T.GROUND);
    st.spawn('npIceBridge', x0, y - 1, { n });
    st.coins(x0 + 3, x0 + n - 4, y + 2);
    st.coins(g0, g0 + 3, y - 2);
    st.down(3); return st.x;
  },
  // ledges with icicles under them that snap as Brady drops past; P3 in the narrow gap between
  icicleGap(st, o) {
    const B = st.B, W = st.W, y = st.down(o.gap || 7);
    B.fill(1, y, Math.floor(W / 2) - 2, y, T.GROUND); B.fill(Math.floor(W / 2) + 2, y, W - 2, y, T.GROUND);
    for (const ix of [3, 6, W - 7, W - 4]) st.spawn('npIcicle', ix, y + 1, {});
    if (o.gold) st.gold(Math.floor(W / 2), y + 1, o.gold);
    st.enemy('npBat', Math.floor(W / 2), y + 5);
    st.down(5); return st.x;
  },
  // a mid ledge with P1
  midLedge(st, o) {
    const B = st.B, W = st.W, y = st.down(o.gap || 7), left = !!o.left, x0 = left ? 1 : W - 8;
    B.fill(x0, y, x0 + 6, y, T.GROUND); st.coins(x0 + 1, x0 + 5, y - 2);
    st.gold(x0 + 3, y - 3, o.gold || 'must');
    if (o.item) st.block(x0 + 3, y - 4, o.item);
    st.down(3); return st.x;
  },
  // a side cave in the crevasse wall, lit blue (the secret): a ledge and its door
  blueCave(st, o) {
    const B = st.B, W = st.W, y = st.down(o.gap || 7), x0 = o.left ? 1 : W - 8;
    B.fill(x0, y, x0 + 6, y, T.GROUND);
    B.spawn('portal', x0 + 3, y - 1, { kind: 'door', look: 'npBlueCave', targetRef: o.to || null });
    if (o.back) B.anchor(o.back, x0 + 5, y - 1);
    st.down(3); return st.x;
  },

  /* ---- 12-7 the supply depot ---- */
  depotBanner(st, o) { st.spawn('npFortBanner', st.x + 1, st.gy - 1, { title: o.title || 'FORT: SUPPLY DEPOT' }); return st.x; },
  // a conveyor carrying supply crates, a tin bot riding along
  crateBelt(st, o) {
    const B = st.B, x = st.x, n = o.n || 10, dir = o.dir || 1; st.floor(x, x + n + 1);
    for (let q = 1; q <= n; q++) B.set(x + q, st.gy, dir > 0 ? T.CONV_R : T.CONV_L);
    st.spawn('npCrateBelt', x + 1, st.gy - 1, { n });
    st.coins(x + 2, x + n - 1, st.gy - 3);
    if (o.enemy) st.enemy(o.enemy, x + n - 2, st.gy);
    return x + n + 2;
  },
  // the Baron's crate lift up to a gantry; P1 on the gantry
  crateLift(st, o) {
    const B = st.B, rise = o.rise || 5; let x = st.x;
    st.floor(x, x + 4);
    st.spawn('mplat', x + 1, st.gy - 1, { pw: 3, ax: 0, ay: -rise * TS, speed: 1.5, skin: 'npCrateLift' });
    for (let y = st.gy - rise; y <= st.gy; y++) for (let k = 0; k < 3; k++) B.ghosts.push([x + 1 + k, y]);
    const gy0 = st.gy; st.gy -= rise; x += 4;
    st.floor(x, x + 6); st.coins(x + 1, x + 5, st.gy - 2);
    if (o.gold) st.gold(x + 3, st.gy - 3, o.gold);
    st.enemy('npTinBot', x + 5, st.gy, { edgeTurn: true });
    x += 7; st.gy = gy0; st.floor(x, x + 2);
    return x + 3;
  }
};

/* ---------------- stamps ---------------- */
const stamps = {
  // 12-1 (s): the tea house: tables, a kettle, momos on plates; the back room's door is the secret gate (the Pasal)
  chiya: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'], [9, 10, 't'], [18, 10, 't'],
      [8, 7, '-----'], [15, 5, '-----'],
      [8, 6, 'o.o.o'], [17, 3, '*'], [21, 7, '?'],
      [26, 10, 'g']
    ]),
    legend: { t: ['decor', 'npTeaTable'] },
    items: ['power'],
    doors: [{ to: 'pul@teaBack', look: 'npBackDoor' }],
    gold: { '*': 'hidden' }
  },
  // 12-2 (s): the ice cave in the crevasse: blue light, icicles, the way on to the deep crevasse (secret gate)
  khadal: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'],
      [7, 8, '----'], [13, 6, '----'], [19, 8, '----'],
      [7, 7, 'o.o.o'], [14, 4, '*'], [20, 5, '?'],
      [26, 10, 'g']
    ]),
    legend: {},
    items: ['oneup'],
    doors: [{ to: 'bhanjyang@lipBack', look: 'npBackDoor' }],
    gold: { '*': 'hidden' }
  },
  // 12-3 (s): the Baron's supply shed: crates, sleds, the way to his depot (secret gate)
  depotShed: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'], [8, 10, 'k'], [14, 10, 'k'],
      [9, 7, '-----'], [16, 5, '----'],
      [9, 6, 'o.o.o'], [17, 3, '*'], [21, 7, '?'],
      [26, 10, 'g']
    ]),
    legend: { k: ['decor', 'npCrateStack'] },
    items: ['oneup'],
    doors: [{ to: 'himpat@shedBack', look: 'npBackDoor' }],
    gold: { '*': 'hidden' }
  },
  // 12-4 (s): inside the tent: sleeping bags, a stove, a star in the stuff sack
  tent: {
    floor: 11,
    rows: room(28, 14, 11, [
      [2, 10, '@.D'],
      [8, 8, '----'], [14, 6, '----'],
      [8, 7, 'o.o.o'], [15, 4, '*'], [20, 7, '?']
    ]),
    legend: {},
    items: ['star'],
    doors: [{ to: 'icefall@tentBack', look: 'npBackDoor' }],
    gold: { '*': 'hidden' }
  },
  // 12-5 (s): the jar archive: shelves of the Baron's stolen souvenirs, a 1-up behind the jars
  archive: {
    floor: 11,
    rows: room(30, 14, 11, [
      [2, 10, '@.D'], [9, 10, 'j'], [16, 10, 'j'], [23, 10, 'j'],
      [8, 7, '------'], [17, 5, '----'],
      [8, 6, 'o.o.o.o'], [18, 3, '*'], [13, 3, 'h']
    ]),
    legend: { j: ['decor', 'npJarShelf'] },
    hidden: ['oneup'],
    doors: [{ to: 'vault@archiveBack', look: 'npBackDoor' }],
    gold: { '*': 'hidden' }
  },
  // 12-6 (s): the blue side cave
  blueCave: {
    floor: 11,
    rows: room(28, 14, 11, [
      [2, 10, '@.D'],
      [8, 8, '----'], [14, 6, '----'], [20, 4, '---'],
      [8, 7, 'o.o.o'], [21, 2, '*'], [15, 3, '?']
    ]),
    legend: {},
    items: ['oneup'],
    doors: [{ to: 'khadal@caveBack', look: 'npBackDoor' }],
    gold: { '*': 'hidden' }
  },
  // 12-7 (s): under the crate hatch: a stash of the Baron's coins
  hatch: {
    floor: 11,
    rows: room(28, 14, 11, [
      [2, 10, '@.D'], [10, 10, 'k'],
      [8, 7, '------'], [16, 5, '----'],
      [8, 6, 'o.o.o.o'], [17, 3, '*'], [13, 3, '?']
    ]),
    legend: { k: ['decor', 'npCrateStack'] },
    items: ['oneup'],
    doors: [{ to: 'depot@hatchBack', look: 'npBackDoor' }],
    gold: { '*': 'hidden' }
  },
  // 12-7: the crate hall between the depot and the Tin Yak's bay
  crateHall: {
    floor: 13,
    rows: room(40, 16, 13, [
      [2, 12, '@'], [6, 12, 'k'], [24, 12, 'k'],
      [8, 10, '----'], [13, 8, '----'], [19, 6, '-----'], [26, 8, '----'],
      [9, 9, 'o.o.o'], [20, 5, 'o.o.o'], [21, 3, '?'],
      [12, 12, 'n'], [30, 12, 'n'], [35, 12, 'D']
    ]),
    legend: { k: ['decor', 'npCrateStack'], n: ['enemy', 'npTinBot'] },
    items: ['star'],
    doors: [{ to: 'tinyak', look: 'npDepotDoor' }]
  },
  // the Souvenir Stand Pasal (a red panda's shop)
  stand: {
    floor: 10,
    rows: room(28, 12, 10, [
      [2, 9, '@'], [5, 9, 'k'], [8, 9, 'l'], [11, 9, '$'], [21, 9, 'l'], [24, 9, 'G']
    ]),
    legend: { k: ['decor', 'npTeaTable'], l: ['decor', 'npRhodoBush'] }
  }
};

/* ---------------- the levels ---------------- */
const levels = [
  // 12-1 SKY: suspension bridges from ridge to ridge
  { n: 1, name: 'Suspension Bridges', arch: 'sky', theme: 'np_hills',
    gimmick: 'Swaying suspension bridges between the ridges over open sky; then the wind rises and red-painted loose planks swing down in every gust',
    hint: 'The bridges sag where you stand. Red planks are loose: cross them between gusts',
    postcard: 'These bridges bounce when you walk on them! I closed my eyes on the long one. Don\'t tell anyone. ♥ C',
    enemies: [['npMomo', 2], ['npMonal', 2], ['npRoti', 1]],
    mapCell: [0, 0], mapFrom: -1,
    exits: { main: { to: '12-2' }, secret: { to: 'house:np-pasal', hint: 'A tea house on a ledge: its back room...' } },
    areas: [
      { id: 'pul', gen: 'islands', W: 220, H: 30,
        script: [
          ['pen', { first: true }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['itemBlock', { item: 'cake', y: 4 }],   // a jump power (bonus)
          // ① the swaying bridges
          'terrace',
          ['skyBridge', { n: 10 }],
          'momos',
          ['skyBridge', { n: 14, holes: [4, 9], gold: 'must', dy: -1 }],
          // ② monals and wind
          ['gearStand', { item: 'plane' }],
          ['teaHouse', { to: 'chiya@in', back: 'teaBack' }],
          'cp',
          ['skyBridge', { n: 9, monal: true, dy: 1 }],
          ['gustWind', { sign: true }],
          ['enemies', { kind: 'npMonal', n: 1, len: 6 }],
          // ③ planks that drop in a gust
          ['skyBridge', { n: 12, loose: [3, 4, 8], gold: 'risky' }],
          ['enemies', { kind: 'npRoti', n: 1, len: 6 }],
          ['skyBridge', { n: 14, loose: [2, 3, 7, 10, 11], monal: true }],
          ['skyBridge', { n: 8 }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'chiya', gen: 'room', role: 'secret', theme: 'np_hills', stamp: 'chiya' }
    ] },
  // 12-2 ROLL: the yak caravan pass, snowballs and snow walls
  { n: 2, name: 'Yak Caravan Pass', arch: 'roll', theme: 'np_pass',
    gimmick: 'Push snowballs down the pass until they are big enough to smash the snow walls; ride one over the ice; marmots keep watch for the yetis',
    hint: 'Push a snowball downhill to grow it, then roll it into a snow wall. The yak can charge walls too',
    postcard: 'The yak and I have an understanding now. He grunts, I say thank you. The pass is beautiful. ♥ C',
    enemies: [['npSnowball', 2], ['npYeti', 1], ['npMarmot', 1]],
    mapCell: [1, 0], mapFrom: 0,
    exits: { main: { to: '12-3' }, secret: { to: '12-6', hint: 'Blue light glows from a crevasse at the third snow wall...' } },
    areas: [
      { id: 'bhanjyang', gen: 'strip', W: 220, H: 22,
        script: [
          ['pen', { first: true }],
          ['itemBlock', { item: 'power', y: 4 }],
          ['itemBlock', { item: 'socks', y: 4 }],   // a jump power (bonus)
          // ① a snowball that grows as you push it
          ['snowBank', { gold: 'must' }],
          ['snowball', { sign: true }],
          ['slope', { n: 5, down: true }],
          ['ballWall', { first: true }],
          ['yetiMeet', { sign: true }],
          // ② ride it over the ice
          ['snowball', {}],
          'icy',
          ['ballRide', { gold: 'risky' }],
          ['ballWall', {}],
          'cp',
          // ③ full-size balls and the marmots' whistles
          ['sentinel', { sign: true }],
          ['itemBlock', { item: 'globe', y: 4 }],
          ['slope', { n: 5 }],
          ['crevasseLip', { to: 'khadal@in', back: 'lipBack' }],
          ['snowball', {}],
          ['slope', { n: 4, down: true }],
          ['ballWall', {}],
          ['sentinel', { two: true }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'khadal', gen: 'room', role: 'secret', theme: 'np_khadal', stamp: 'khadal' }
    ] },
  // 12-3 SNEAK: the blizzard night, yetis on watch
  { n: 3, name: 'Blizzard Night', arch: 'sneak', theme: 'np_blizzard',
    gimmick: 'Yetis keep watch with lanterns in the storm: hide behind rocks, in the box, or slip by in a white-out; marmots whistle the sleepers awake',
    hint: 'In a white-out the yetis can\'t see you. Crouch behind a rock to hide. Walk past sleepers, don\'t run',
    postcard: 'I can\'t see a thing up here, Brady. But I can hear a yeti humming. It\'s a nice tune. ♥ C',
    enemies: [['npYeti', 1], ['npMarmot', 1], ['npSnowball', 2]],
    mapCell: [2, 0], mapFrom: 1,
    exits: { main: { to: '12-4' }, secret: { to: '12-7', hint: 'A sled track leads off the trail to a shed with the Baron\'s badge...' } },
    areas: [
      { id: 'himpat', gen: 'strip', W: 230, H: 20,
        script: [
          'storm',
          ['itemBlock', { item: 'power', y: 4 }],
          ['gearStand', { item: 'box' }],
          // ① the gusts hide you from the yeti on watch
          ['shelterHut', { gold: 'must' }],
          ['yetiWatch', { first: true }],
          'shelter',
          ['iceGate', {}],
          // ② boulders to hide behind
          ['yetiWatch', {}],
          'cp',
          ['shelter', { n: 3 }],
          ['sledShed', { to: 'depotShed@in', back: 'shedBack' }],
          // ③ sleeping yetis and marmot sentinels together
          ['sleepYeti', { gold: 'risky', sign: true }],
          ['yetiWatch', { two: true }],
          ['iceGate', {}],
          ['sleepYeti', { marmot: true }],
          ['itemBlock', { item: 'globe', y: 4 }],
          ['shelter', { n: 2 }],
          ['gate', { exit: 'main' }]
        ] },
      { id: 'depotShed', gen: 'room', role: 'secret', theme: 'np_depot', stamp: 'depotShed' }
    ] },
  // 12-4 RISE: up the Khumbu icefall while the floor falls away beneath
  { n: 4, name: 'Khumbu Icefall', arch: 'rise', theme: 'np_icefall',
    gimmick: 'The icefall gives way below you: climb! Ladders bridge the crevasses, icicles drop, seracs crumble, and in the serac field the ice moves faster',
    hint: 'Keep climbing: the bottom of the screen is the end. Icicles shiver before they drop',
    postcard: 'The ice up here groans like an old house. The Baron\'s fortress is right at the top. ♥ C',
    enemies: [['npChough', 2], ['npSnowball', 1]],
    mapCell: [2, 1], mapFrom: [2, 5],
    exits: { main: { to: '12-5' } },
    areas: [
      { id: 'icefall', gen: 'rise', W: 28, H: 120, rise: { speed: 0.85, delay: 3.5 },
        script: [
          'cstart',
          ['blockLedge', { item: 'power' }],
          ['iledges', { n: 4 }],
          ['laddersP1', { n: 3 }],
          'ccp',
          'icicles',
          ['tentNiche', { to: 'tent@in', back: 'tentBack' }],
          ['blockLedge', { item: 'star', left: true }],
          ['iledges', { n: 3, flip: true }],
          ['rampUp', { speed: 1.2 }],
          ['seracsP3', {}],
          ['ladders', { n: 3 }],
          'seracs',
          'icicles',
          ['iledges', { n: 3 }]
        ] },
      { id: 'tent', gen: 'room', role: 'secret', theme: 'np_icefall', stamp: 'tent' }
    ] },
  // 12-5 LAIR: the Baron's fortress and the summit (the finale)
  { n: 5, name: "Baron's Fortress", arch: 'lair', theme: 'np_fortress', boss: 'np_baron',
    gimmick: 'The Baron\'s vault: shrink-ray cameras, a jar to kick through a crate wall, the archive of stolen things; then Baron Bric-a-Brac on the summit, throwing the landmarks',
    hint: 'Stay out of the camera beams! The Baron throws the stolen landmarks: kick them right back at him',
    postcard: 'WE DID IT, BRADY! Every landmark is back to size and the Baron is a snow globe. Let\'s go home. ♥ C',
    enemies: [['npTinBot', 2], ['npBobble', 2], ['npGlobe', 1]],
    mapCell: [1, 2], mapFrom: 3,
    exits: { main: { to: 'country:next' } },
    areas: [
      { id: 'vault', gen: 'strip', W: 90, H: 18,
        script: [
          ['pen', {}],
          ['itemBlock', { item: 'power', y: 4 }],
          ['cameras', { n: 2 }],
          ['jarKick', { sign: true }],
          ['galleryP1', { item: 'star' }],
          ['archiveBelt', { to: 'archive@in', back: 'archiveBack', gold: 'risky' }],
          'cp',
          ['snowwall', { look: 'crates' }],
          ['cameras', { n: 2 }],
          'belts',
          ['door', { to: 'summit', perch: 0, look: 'npSummitStairs' }]
        ] },
      { id: 'archive', gen: 'room', role: 'secret', stamp: 'archive' },
      { id: 'summit', gen: 'arena', role: 'arena', layout: 'summit', arenaW: 30, H: 20, roof: false, theme: 'np_pass' }
    ] },
  // 12-6 FALL (secret): down the blue-ice crevasse
  { n: 6, name: 'Crevasse Drop', arch: 'fall', secret: true, theme: 'np_khadal',
    gimmick: 'Fall through the blue-ice crevasse: icicles snap as you drop past, ice bridges burst under a long fall, bats flit in the dark',
    hint: 'The paper plane lets you glide down slowly. Land on an ice bridge from high up to burst through',
    postcard: 'I looked down into the crevasse and it was blue all the way down. Bluer than the sky! ♥ C',
    enemies: [['npChough', 1], ['npBat', 2]],
    mapCell: [0, 2], mapFrom: 1,
    exits: { main: { to: 'node:12-4' } },
    areas: [
      { id: 'khadal', gen: 'shaft', W: 22, H: 160,
        script: [
          'lipStand',
          ['ledges', { n: 3, enemy: 'npBat' }],
          ['iceBridge', { left: true }],
          ['midLedge', { left: true }],
          ['icicleGap', { gold: 'risky' }],
          ['shelf', { cp: true }],
          ['blueCave', { to: 'blueCave@in', back: 'caveBack' }],
          ['ringFall', { n: 2 }],
          ['iceBridge', { left: false, gap: 8 }],
          ['icicleGap', {}],
          ['updraft', { h: 8 }],
          ['iceBridge', {}],
          ['ledges', { n: 2 }]
        ] },
      { id: 'blueCave', gen: 'room', role: 'secret', theme: 'np_khadal', stamp: 'blueCave' }
    ] },
  // 12-7 FORT (secret): the Baron's supply depot and the Tin Yak
  { n: 7, name: "Baron's Supply Depot", arch: 'fort', secret: true, theme: 'np_depot', boss: 'np_tinyak', mid: true,
    gimmick: 'Crate conveyors, the Baron\'s crate lifts, a crate with a hatch; then the Tin Yak, a clockwork yak that charges: let it ram the crate walls',
    hint: 'Dodge the Tin Yak\'s charge so it rams the crate walls, then stomp it while it\'s stuck',
    postcard: 'The Baron keeps ALL his stolen stuff in crates. Labelled. In alphabetical order. ♥ C',
    enemies: [['npTinBot', 3]],
    mapCell: [1, 1], mapFrom: 2,
    exits: { main: { to: null } },
    areas: [
      { id: 'depot', gen: 'strip', W: 80, H: 20,
        script: [
          ['depotBanner', {}],
          ['itemBlock', { item: 'power', y: 4 }],
          ['crateBelt', { n: 9, enemy: 'npTinBot' }],
          ['crateLift', { rise: 5, gold: 'must' }],
          ['trapdoor', { to: 'hatch@in', crate: true, back: 'hatchBack' }],
          ['crateBelt', { n: 10, dir: -1 }],
          'cp',
          ['crateLift', { rise: 6 }],
          ['door', { to: 'crateHall@in', perch: 0, look: 'npDepotDoor' }]
        ] },
      { id: 'hatch', gen: 'room', role: 'secret', theme: 'np_depot', stamp: 'hatch' },
      { id: 'crateHall', gen: 'room', role: 'sub', theme: 'np_depot', stamp: 'crateHall' },
      { id: 'tinyak', gen: 'arena', role: 'arena', layout: 'tinyak', arenaW: 26, H: 16, roof: false, theme: 'np_depot' }
    ] }
];

/* the crate wall a kicked jar breaks (12-5's breakwall skin) */
skins.npCrateWallSkin = (ctx, e, t) => {
  const x = e.x, y = e.y, h = e.h;
  for (let r = 0; r < Math.round(h / TS); r++) { const yy = y + r * TS; ctx.fillStyle = r % 2 ? '#a8804a' : '#b88e54'; ctx.fillRect(x + 1, yy + 1, TS - 2, TS - 2); ctx.strokeStyle = '#6a4a24'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 3, yy + 3, TS - 6, TS - 6); ctx.fillStyle = '#7a2ac8'; ctx.fillRect(x + 8, yy + 12, 16, 6); }
};

for (const k in P) Tour.pieces['np.' + k] = P[k];
Tour.amend('np', {
  stamps, skins,
  map: { fort: 'summit', start: [0, 0] },
  houses: [{ id: 'np-pasal', kind: 'stand', name: 'Pasal', keeper: 'red panda', stock: ['plane', 'box', 'globe', 'magnet', 'oneup', 'sundial'], mapCell: [0, 1], mapFrom: 0 }],
  levels
});
})();
