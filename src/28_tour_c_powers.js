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
    // the pop (ItemSpace picks the open side when the block has a solid over it)
    if (this.emerge > 0) { if (ItemSpace.emergeStep(this, dt)) { this.vx = this.speedX ? ItemSpace.walkDir(this, this.g) * this.speedX : 0; this.hoverY = this.y; ItemSpace.keepFree(this, !this.speedX); } return; }
    // the joint, the LSD tab and souvenirs hover where they came out (never inside a solid, bob included). The LSD tab
    // sways about 14 px either side of where it came out, on its own clock from the pop (it used to step 0.15 px a frame
    // from the entity's random clock, so its swing was centred up to 14 px off to one side, differently every time)
    if (!this.speedX) { if (this.kind === 'lsd') { this.swayT = (this.swayT || 0) + dt; this.x += Math.cos(this.swayT * 1.3) * 18 * dt; } ItemSpace.keepFree(this, true); this.y = this.hoverY + Math.sin(this.t * 2.2) * 4; return; }
    ItemSpace.keepFree(this, false);
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
    if (this.emerge > 0) ItemSpace.clip(ctx, this);
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
  // the magic mushroom, drawn round: a plump dome lit from the upper left (a gradient, not flat bands), swirling
  // colour bands that wrap round the dome, the gilled underside showing beneath the rim, a barrel stem with a
  // little skirt, a rim light and a glossy highlight. No spots, no face. Ink outline as the cast.
  mushroom(ctx, x, y, t) {
    const bob = Math.sin(t * 9) * 0.8, sq = 1 + Math.sin(t * 9) * 0.035, INKC = '#2a1630';
    ctx.fillStyle = 'rgba(30,14,40,0.26)'; ctx.beginPath(); ctx.ellipse(x, y - 0.5, 11, 2.8, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(x, y); ctx.scale(1 / sq, sq); ctx.translate(-x, -y);
    // stem: a barrel, light on the left, shaded on the right, a darker foot
    const stem = () => { ctx.beginPath(); ctx.moveTo(x - 5.2, y); ctx.bezierCurveTo(x - 7.5, y - 5, x - 5.5, y - 10, x - 4, y - 14); ctx.lineTo(x + 4, y - 14); ctx.bezierCurveTo(x + 5.5, y - 10, x + 7.5, y - 5, x + 5.2, y); ctx.quadraticCurveTo(x, y + 1.8, x - 5.2, y); ctx.closePath(); };
    let gr = ctx.createLinearGradient(x - 7, 0, x + 7, 0);
    gr.addColorStop(0, '#fff8ea'); gr.addColorStop(0.35, '#fff1d6'); gr.addColorStop(0.75, '#e2c096'); gr.addColorStop(1, '#b98e68');
    stem(); ctx.fillStyle = gr; ctx.fill();
    ctx.save(); stem(); ctx.clip();
    ctx.fillStyle = 'rgba(120,70,60,0.22)'; ctx.fillRect(x - 8, y - 2.4, 16, 4);                                   // the foot in shade
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(x - 3.2, y - 6.5, 1.1, 3.6, 0.12, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = INKC; ctx.lineWidth = 1.4; stem(); ctx.stroke();
    const cy = y - 12.5 + bob, w = 13.5, top = cy - 17;
    // the underside: a dark ellipse of gills seen from below, and the skirt where the stem meets it
    ctx.fillStyle = '#7a2a66'; ctx.beginPath(); ctx.ellipse(x, cy + 1.4, w - 1.2, 5, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,190,220,0.55)'; ctx.lineWidth = 0.8;
    for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(x + k * 1.1, cy + 1); ctx.lineTo(x + k * 2.8, cy + 5.8 - Math.abs(k) * 0.45); ctx.stroke(); }
    ctx.strokeStyle = INKC; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, cy + 1.4, w - 1.2, 5, 0, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = '#fff1d6'; ctx.beginPath(); ctx.ellipse(x, cy + 3, 5.8, 1.9, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 1.1; ctx.stroke();
    // the cap: a dome
    const cap = () => {
      ctx.beginPath(); ctx.moveTo(x - w, cy);
      ctx.bezierCurveTo(x - w - 1.5, cy - 10, x - 7, top, x, top);
      ctx.bezierCurveTo(x + 7, top, x + w + 1.5, cy - 10, x + w, cy);
      ctx.bezierCurveTo(x + w * 0.5, cy + 2.6, x - w * 0.5, cy + 2.6, x - w, cy);
      ctx.closePath();
    };
    gr = ctx.createRadialGradient(x - 5, cy - 12, 1.5, x - 1, cy - 7, 19);
    gr.addColorStop(0, '#ff9ccb'); gr.addColorStop(0.4, '#ff4f9a'); gr.addColorStop(0.8, '#d22a86'); gr.addColorStop(1, '#8e1a78');
    cap(); ctx.fillStyle = gr; ctx.fill();
    ctx.save(); cap(); ctx.clip();
    // bands that wrap the dome (each an arc of an ellipse, wider at the middle, so they read as going round it)
    const band = (yy, rx, ry, lw, a, b) => { const g2 = ctx.createLinearGradient(x - w, 0, x + w, 0); g2.addColorStop(0, a); g2.addColorStop(1, b); ctx.strokeStyle = g2; ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(x, yy, rx, ry, 0, 0.08 * Math.PI, 0.92 * Math.PI); ctx.stroke(); };
    band(cy - 8.4, 14.5, 4.4, 3.6, '#ffd35a', '#e8892a');
    band(cy - 14.6, 9.6, 3.2, 3.0, '#b79aff', '#6a3fe0');
    ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.ellipse(x - 0.5, top + 1.6, 3.4, 1.7, 0, 0, TAU); ctx.fill();   // the crown
    // form shadow down the right and under the rim, rim light along the left edge
    gr = ctx.createLinearGradient(x - 2, 0, x + w + 2, 0); gr.addColorStop(0, 'rgba(70,10,90,0)'); gr.addColorStop(1, 'rgba(70,10,90,0.42)');
    ctx.fillStyle = gr; ctx.fillRect(x - 2, top - 2, w + 6, 24);
    gr = ctx.createLinearGradient(0, cy - 5, 0, cy + 3); gr.addColorStop(0, 'rgba(60,10,70,0)'); gr.addColorStop(1, 'rgba(60,10,70,0.38)');
    ctx.fillStyle = gr; ctx.fillRect(x - w - 3, cy - 5, w * 2 + 6, 9);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - w + 1.6, cy - 2.5); ctx.bezierCurveTo(x - w + 0.6, cy - 9, x - 7.5, top + 2.6, x - 3, top + 1.6); ctx.stroke();
    // the gloss: a soft patch and a hard little glint
    ctx.fillStyle = 'rgba(255,255,255,0.42)'; ctx.beginPath(); ctx.ellipse(x - 5.6, cy - 11.4, 3.3, 4.6, -0.6, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.ellipse(x - 6.4, cy - 12.8, 1.3, 2, -0.6, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = INKC; ctx.lineWidth = 1.6; cap(); ctx.stroke();
    ctx.restore();
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
