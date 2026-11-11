/* ============================================================
   World tour: power-ups.
   Core set (every country): magic mushroom (grow + dizzy colors),
   joint (blow smoke puffs, power 2), LSD tab (timed free flight with
   rainbow lasers), star (invincibility), water bottle (extra life).
   Plus one signature item per country (TourPowers.register).
   ============================================================ */
const TourPowers = {
  list: {},
  // P: { id, name, country, hint, time (seconds; 0 = until the level ends), icon(ctx,x,y,t),
  //      onCollect(p), action(p, g) -> true if it used the action button, update(p,dt,inp), drawOn(p,ctx,t) }
  register(P) { this.list[P.id] = P; },
  get(id) { return this.list[id] || null; },
  // what an item block holds in a tour level
  blockItem(it, play) {
    const p = play.player;
    if (it === 'power') return p && p.power > 0 ? 'joint' : 'mushroom';
    if (it === 'oneup') return 'oneup';
    if (it === 'eclipse' || it === 'star') return 'star';
    if (it === 'sig') { const C = Tour.countryOf(play.id); return C && C.power ? 'sig:' + C.power.id : 'mushroom'; }
    return it;
  },
  name(kind) {
    if (kind && kind.startsWith('sig:')) { const P = this.get(kind.slice(4)); return P ? P.name : 'SOUVENIR'; }
    return ({ mushroom: 'MAGIC MUSHROOM', joint: 'JOINT', lsd: 'LSD TAB', star: 'INVINCIBLE', oneup: 'WATER BOTTLE' })[kind] || kind.toUpperCase();
  }
};

/* ---------- the pickups ---------- */
class TourItem extends Ent {
  constructor(g, x, y, kind) {
    super(g, null, 24, 24); this.x = x - 12; this.y = y; this.kind = kind; this.emerge = 0.5; this.baseY = y; this.item = true;
    this.speedX = (kind === 'mushroom' || kind === 'oneup') ? 2.4 * TS : kind === 'star' ? 3.4 * TS : 0;
  }
  update(dt) {
    this.t += dt;
    if (this.emerge > 0) { this.emerge -= dt; this.y = this.baseY - (1 - Math.max(0, this.emerge) / 0.5) * TS; if (this.emerge <= 0) { this.vx = this.speedX ? (this.g.player && this.g.player.cx > this.cx ? -1 : 1) * this.speedX : 0; this.hoverY = this.y; } return; }
    // the joint, the LSD tab and souvenirs hover where they came out
    if (!this.speedX) { this.y = this.hoverY + Math.sin(this.t * 2.2) * 4; if (this.kind === 'lsd') this.x += Math.sin(this.t * 1.3) * 0.15; return; }
    this.vy += PHYS.gDown * 0.8 * dt; if (this.vy > 14 * TS) this.vy = 14 * TS;
    const vx = this.vx;
    moveBody(this, this.g.area, dt, { semis: true, platforms: this.g.platforms });
    if (this.hitWall) this.vx = -vx;
    if (this.kind === 'star' && this.onGround) this.vy = -11 * TS;
    if (this.y > this.g.area.H * TS + 50) this.remove = true;
  }
  touchPlayer(p) { if (this.emerge > 0.25) return; this.remove = true; p.collect(this.kind, this); }
  bounceFromBelow() { if (this.emerge <= 0 && this.speedX) this.vy = -9 * TS; }
  draw(ctx) { Ink.ent(ctx, this, c => this.drawArt(c)); }
  drawArt(ctx) {
    const x = this.cx, y = this.y + this.h;
    ctx.save();
    if (this.emerge > 0) { ctx.beginPath(); ctx.rect(this.x - 10, this.baseY - TS * 2, this.w + 20, TS * 2); ctx.clip(); }
    TourItemArt.draw(ctx, this.kind, x, y, this.t, this.g);
    ctx.restore();
  }
  get light() { return { r: 56, c: 'rgba(255,230,170,' }; }
}

const TourItemArt = {
  draw(ctx, kind, x, y, t, g) {
    if (kind && kind.startsWith('sig:')) { const P = TourPowers.get(kind.slice(4)); if (P && P.icon) { this.glow(ctx, x, y - 12, t, '#ffe08a'); P.icon(ctx, x, y - 12, t); return; } }
    if (kind === 'star') { const C = g && Tour.countryOf(g.id); if (C && C.star && C.star.draw) { this.glow(ctx, x, y - 12, t, '#fff2a0'); C.star.draw(ctx, x, y - 12, t); return; } }
    const f = this[kind]; if (f) f.call(this, ctx, x, y, t);
  },
  glow(ctx, x, y, t, col) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const r = 22 + Math.sin(t * 4) * 2, gr = ctx.createRadialGradient(x, y, 2, x, y, r);
    gr.addColorStop(0, rgba(col, 0.45)); gr.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  },
  // a tall, wavy cap with swirling rainbow stripes on a cream stem (no spots, no face)
  mushroom(ctx, x, y, t) {
    this.glow(ctx, x, y - 14, t, '#c8a0ff');
    // stem
    const sg = ctx.createLinearGradient(x - 5, 0, x + 5, 0); sg.addColorStop(0, '#e8dcc0'); sg.addColorStop(0.5, '#fff8ea'); sg.addColorStop(1, '#d8c8a8');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.quadraticCurveTo(x - 6, y - 8, x - 3.5, y - 13); ctx.lineTo(x + 3.5, y - 13); ctx.quadraticCurveTo(x + 6, y - 8, x + 4, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,90,60,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 1, y - 2); ctx.quadraticCurveTo(x - 2, y - 7, x, y - 12); ctx.stroke();
    // the cap: tall and wavy-edged
    const w = 11, top = y - 30;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x - w, y - 13);
    for (let k = 0; k <= 6; k++) { const xx = x - w + k * (w * 2 / 6); ctx.lineTo(xx, y - 13 + (k % 2 ? 2.2 : -0.6) + Math.sin(t * 3 + k) * 0.5); }
    ctx.quadraticCurveTo(x + w + 1, y - 22, x + 2, top);
    ctx.quadraticCurveTo(x - 1, top - 2, x - 3, top + 1);
    ctx.quadraticCurveTo(x - w - 2, y - 21, x - w, y - 13);
    ctx.closePath();
    ctx.clip();
    // swirling rainbow stripes
    const cols = ['#ff4f6a', '#ff9a3a', '#ffe14a', '#5ae07a', '#38c8ff', '#8a5aff'];
    ctx.translate(x, y - 21); ctx.rotate(-0.5 + Math.sin(t * 1.5) * 0.08);
    for (let k = -8; k < 8; k++) { ctx.fillStyle = cols[((k % 6) + 6) % 6]; ctx.beginPath(); const s = k * 4 + (t * 6) % 24; ctx.moveTo(s - 30, -20); ctx.quadraticCurveTo(s - 8, 0, s - 30, 20); ctx.lineTo(s - 26, 20); ctx.quadraticCurveTo(s - 4, 0, s - 26, -20); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // a soft highlight on the cap
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x - 4, y - 24, 2.2, 4.5, -0.4, 0, TAU); ctx.fill();
    // little sparkles
    for (let k = 0; k < 3; k++) { const a = t * 2 + k * 2.1; ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 6 + k)})`; ctx.fillRect(x + Math.cos(a) * 15, y - 20 + Math.sin(a) * 9, 1.6, 1.6); }
  },
  // a hand-rolled cartoon joint: paper cone, twisted end, glowing tip and a lazy curl of smoke
  joint(ctx, x, y, t) {
    this.glow(ctx, x, y - 12, t, '#ffb070');
    ctx.save(); ctx.translate(x, y - 12); ctx.rotate(-0.35);
    ctx.fillStyle = '#fbf6ea'; ctx.beginPath(); ctx.moveTo(-12, -2.2); ctx.lineTo(10, -3.6); ctx.lineTo(10, 3.6); ctx.lineTo(-12, 2.2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(150,130,100,0.6)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.strokeStyle = 'rgba(160,140,110,0.45)'; for (let k = -8; k < 8; k += 4) { ctx.beginPath(); ctx.moveTo(k, -3); ctx.lineTo(k + 2, 3); ctx.stroke(); }
    ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.moveTo(10, -3.6); ctx.quadraticCurveTo(14, -1, 13, 0); ctx.quadraticCurveTo(14, 1, 10, 3.6); ctx.fill();
    // the lit end
    const pulse = 0.6 + 0.4 * Math.sin(t * 6);
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-13, -2.2, 2, 4.4);
    ctx.fillStyle = `rgba(255,${120 + 60 * pulse},40,1)`; ctx.beginPath(); ctx.arc(-13.5, 0, 2.2, 0, TAU); ctx.fill();
    ctx.restore();
    // smoke curl
    for (let k = 0; k < 4; k++) { const ph = (t * 0.7 + k * 0.25) % 1; ctx.fillStyle = `rgba(235,235,240,${0.45 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x - 12 + Math.sin(ph * 6 + k) * 3, y - 10 - ph * 22, 2 + ph * 4, 0, TAU); ctx.fill(); }
  },
  // a little paper tab printed with a rainbow and a smiley
  lsd(ctx, x, y, t) {
    this.glow(ctx, x, y - 12, t, '#a0f0ff');
    ctx.save(); ctx.translate(x, y - 12); ctx.rotate(Math.sin(t * 2) * 0.15);
    ctx.fillStyle = '#fffdf6'; rr(ctx, -10, -10, 20, 20, 1.5); ctx.fill();
    ctx.strokeStyle = 'rgba(160,150,140,0.7)'; ctx.lineWidth = 0.8; ctx.setLineDash([1.5, 1.5]); rr(ctx, -10, -10, 20, 20, 1.5); ctx.stroke(); ctx.setLineDash([]);
    const cols = ['#ff4f6a', '#ff9a3a', '#ffe14a', '#5ae07a', '#38c8ff', '#8a5aff'];
    ctx.lineWidth = 1.6;
    cols.forEach((c, k) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(0, 4, 8.5 - k * 1.5, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); });
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(0, 4.5, 3.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a2a10'; ctx.fillRect(-1.6, 3.2, 1, 1.2); ctx.fillRect(0.7, 3.2, 1, 1.2);
    ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(0, 4.8, 1.8, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.restore();
  },
  // invincibility (countries can re-skin it): a spinning golden globe
  star(ctx, x, y, t) {
    this.glow(ctx, x, y - 12, t, '#fff2a0');
    const cy = y - 12, k = Math.cos(t * 4);
    const g2 = ctx.createRadialGradient(x - 3, cy - 4, 1, x, cy, 11); g2.addColorStop(0, '#fff8c8'); g2.addColorStop(1, '#e0a81a');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(x, cy, 10, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(140,90,10,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x, cy, Math.abs(k) * 10, 10, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 10, cy); ctx.lineTo(x + 10, cy); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, cy, 10, 4, 0, 0, TAU); ctx.stroke();
  },
  // extra life: a big reusable water bottle
  oneup(ctx, x, y, t) {
    this.glow(ctx, x, y - 12, t, '#8ad8ff');
    const g2 = ctx.createLinearGradient(x - 7, 0, x + 7, 0); g2.addColorStop(0, '#3aa8ff'); g2.addColorStop(0.5, '#a8e4ff'); g2.addColorStop(1, '#2a88e0');
    ctx.fillStyle = g2; rr(ctx, x - 7, y - 22, 14, 21, 4); ctx.fill();
    ctx.fillStyle = '#ffffff'; rr(ctx, x - 4, y - 27, 8, 5, 1.5); ctx.fill();
    ctx.fillStyle = '#1a6ab8'; ctx.fillRect(x - 7, y - 14, 14, 6);
    ctx.fillStyle = '#ff5a8a'; ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.bezierCurveTo(x - 4, y - 12, x - 2, y - 15, x, y - 13); ctx.bezierCurveTo(x + 2, y - 15, x + 4, y - 12, x, y - 9); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 5, y - 21, 2, 8);
  }
};

/* ---------- Brady's projectiles ---------- */
// joint: a soft billowing smoke puff that drifts forward and knocks enemies out
class SmokePuff extends Ent {
  constructor(g, x, y, dir) {
    super(g, null, 18, 18); this.x = x - 9; this.y = y - 9; this.vx = dir * 5.6 * TS; this.vy = -0.4 * TS; this.dir = dir; this.life = 1.25; this.friendly = true; this.r = 7; this.seed = Math.random() * 10;
  }
  update(dt) {
    this.t += dt; this.life -= dt;
    this.vx *= Math.pow(0.32, dt); this.vy -= 0.6 * TS * dt;
    this.x += this.vx * dt; this.y += this.vy * dt; this.r = 7 + this.t * 14;
    const cx = this.cx, cy = this.cy;
    if (SOLID[tileAt(this.g.area, Math.floor(cx / TS), Math.floor(cy / TS))]) this.life = Math.min(this.life, 0.15);
    if (this.life <= 0) { this.remove = true; return; }
    if (this.life < 0.3) return;   // a fading puff doesn't hit anymore
    const box = { x: cx - this.r * 0.7, y: cy - this.r * 0.7, w: this.r * 1.4, h: this.r * 1.4 };
    for (const e of this.g.entities) {
      if (!e.enemy || e.dead || e.remove || e.boss) continue;
      if (overlap(box, e)) { if (e.hit('disc', this)) { this.g.addScore(100, e.cx, e.y); this.g.burst(e.cx, e.cy, 8, '#e8e8f0', 'dust'); } this.life = Math.min(this.life, 0.3); return; }
    }
    const b = this.g.boss;
    if (b && !b.dead && overlap(box, b)) { b.hit('disc', this); this.life = Math.min(this.life, 0.3); }
  }
  draw(ctx) {
    const a = clamp(this.life / 0.6, 0, 1), cx = this.cx, cy = this.cy;
    for (let k = 0; k < 5; k++) {
      const ang = this.seed + k * 1.3 + this.t * 2, rr2 = this.r * (0.45 + (k % 3) * 0.12);
      ctx.fillStyle = `rgba(${226 + k * 5},${226 + k * 5},${232 + k * 4},${0.55 * a})`;
      ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * this.r * 0.35, cy + Math.sin(ang) * this.r * 0.3, rr2, 0, TAU); ctx.fill();
    }
    if (this.seed > 5) { ctx.strokeStyle = `rgba(245,245,250,${0.6 * a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx + this.dir * this.r * 0.8, cy - 3, this.r * 0.45, this.r * 0.3, 0, 0, TAU); ctx.stroke(); }
  }
}
// LSD: a rainbow laser bolt
class RainbowLaser extends Ent {
  constructor(g, x, y, dir, vy) { super(g, null, 26, 6); this.x = x - 13; this.y = y - 3; this.vx = dir * 15 * TS; this.vy = vy || 0; this.dir = dir; this.life = 0.8; this.friendly = true; this.trail = []; }
  update(dt) {
    this.t += dt; this.life -= dt;
    this.trail.unshift([this.cx, this.cy]); if (this.trail.length > 7) this.trail.pop();
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.life <= 0 || SOLID[tileAt(this.g.area, Math.floor(this.cx / TS), Math.floor(this.cy / TS))]) { this.remove = true; this.g.burst(this.cx, this.cy, 6, `hsl(${(this.t * 600) % 360},100%,70%)`, 'spark'); return; }
    for (const e of this.g.entities) {
      if (!e.enemy || e.dead || e.remove || e.boss) continue;
      if (overlap(this, e)) { if (e.hit('laser', this) || e.hit('disc', this)) this.g.addScore(200, e.cx, e.y); this.remove = true; this.g.burst(e.cx, e.cy, 12, '#ffffff', 'confetti'); return; }
    }
    const b = this.g.boss;
    if (b && !b.dead && overlap(this, b)) { b.hit('disc', this); this.remove = true; }
  }
  draw(ctx) {
    const cols = ['#ff4f6a', '#ff9a3a', '#ffe14a', '#5ae07a', '#38c8ff', '#8a5aff'];
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    const pts = this.trail; if (pts.length < 2) { ctx.restore(); return; }
    cols.forEach((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = 1.6; ctx.beginPath(); pts.forEach(([px, py], i) => { const yy = py - 4 + k * 1.6; if (i) ctx.lineTo(px, yy); else ctx.moveTo(px, yy); }); ctx.stroke(); });
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], 3, 0, TAU); ctx.fill();
    ctx.restore();
  }
  get light() { return { r: 50, c: 'rgba(255,255,255,' }; }
}

/* ---------- screen effects ---------- */
// the magic mushroom's dizzy colours now belong to the trip family in 15_postfx.js (TripFX); kept for old callers
const TourFx = { apply(ctx, play, W, H) { TripFX.post(ctx, play, W, H); } };
