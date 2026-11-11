/* ============================================================
   World tour: jump powers (a FEET slot, p.jumpPow). Pressing jump
   again in mid-air uses the one Brady holds:
   - SPRING SOCKS  (socks): a second, slightly lower jump, once per
     airtime: a tucked somersault and a dust ring underfoot;
   - POUND CAKE    (cake): he tucks into a ball, then slams straight
     down; the landing sends a shockwave that stuns enemies within
     3.5 tiles for 2.5 s (harmless, stompable, walk-through), breaks
     bricks, crumble and soil under his boots, with a short hit-pause
     and a gentle shake;
   - MAGIC BEANS   (beans): every mid-air tap he drops into a squat,
     trousers at his knees, heart-print boxers out, and a green puff
     fires downward and pops him up a little; the gas meter (6 puffs)
     refills on the ground; the puffs travel ~2.5 tiles down and
     knock out the ordinary enemies they touch (a normal hit for a
     boss); landing snaps the trousers back up.
   One jump power at a time (a new one replaces it); found in item
   blocks and gear stands like gear ('socks', 'cake', 'beans'); lost
   on a hit after the HANDS item (it floats for 2 s, re-grabbable);
   kept through doors for the level run. They are bonuses: the
   validator ignores them (every level is finishable without), they
   are off while Brady carries something (CARRY), and in a locked
   boss arena he cannot leave its bounds with them.
   ============================================================ */
const TourJump = {
  IDS: ['socks', 'cake', 'beans'],
  GAS: 6,                  // puffs per full meter
  is(id) { return this.IDS.indexOf(id) >= 0; },
  // falling and about to land: the press is a buffered jump, not a jump power
  nearGround(p) {
    const A = p.g.area, fy = Math.floor((p.y + p.h + 22) / TS);
    for (const tx of [Math.floor((p.x + 2) / TS), Math.floor((p.x + p.w - 2) / TS)]) { const t = tileAt(A, tx, fy); if (SOLID[t] || t === T.SEMI) return true; }
    return p.vy > 0 && p.g.platforms.some(pl => !pl.dead && p.x + p.w > pl.x && p.x < pl.x + pl.w && pl.y - (p.y + p.h) < 24 && pl.y > p.y);
  },
  sfx(name, fb, o) { if (typeof TourKit !== 'undefined') TourKit.sfx(name, fb, o); else Sound.play(fb, o); },
  tip: { socks: 'TAP JUMP AGAIN IN THE AIR: DOUBLE JUMP', cake: 'TAP JUMP AGAIN IN THE AIR: GROUND POUND', beans: 'TAP JUMP IN THE AIR AGAIN AND AGAIN: FART FLOAT' }
};

/* ---------- the three items (registered as gear in the FEET slot: blocks, stands, names and icons for free) ---------- */
const JumpArt = {
  socks(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * 5.5, -1 + (s > 0 ? Math.sin(t * 6) : Math.cos(t * 6)) * 0.8);
      // a coil spring under each sock
      ctx.strokeStyle = '#9aa0b0'; ctx.lineWidth = 1.4; ctx.beginPath(); for (let k = 0; k <= 6; k++) { const yy = 6 + k * 1.1; ctx.lineTo((k % 2 ? 2.6 : -2.6), yy); } ctx.stroke();
      // the sock: a tube with a foot, stripes in red, white and teal
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-3, -9); ctx.lineTo(3, -9); ctx.lineTo(3, 2); ctx.quadraticCurveTo(3, 6, s * 6 + 1, 5.5); ctx.lineTo(s * 6, 7.5); ctx.quadraticCurveTo(-4, 8, -3, 3); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.clip();
      ['#ff4f6a', '#38c8c8', '#ff4f6a'].forEach((c, k) => { ctx.fillStyle = c; ctx.fillRect(-6, -8 + k * 3.4, 14, 1.7); });
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(-6, 4, 14, 4);
      ctx.restore();
      ctx.strokeStyle = 'rgba(40,20,40,0.55)'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  },
  cake(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y + 1);
    // a golden loaf with a domed, cracked top and white icing drizzle, sitting heavy on a little "1 LB" weight tag
    ctx.fillStyle = '#c87a2a'; rr(ctx, -11, -4, 22, 12, 3); ctx.fill();
    ctx.fillStyle = '#e8a848'; ctx.beginPath(); ctx.moveTo(-11, -2); ctx.quadraticCurveTo(-10, -11, 0, -11); ctx.quadraticCurveTo(10, -11, 11, -2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a85a1a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(-2, -6); ctx.lineTo(2, -8.5); ctx.lineTo(6, -6.5); ctx.stroke();
    ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.moveTo(-10, -3); for (let k = 0; k <= 8; k++) { const xx = -10 + k * 2.5; ctx.lineTo(xx, -3 + (k % 2 ? 3 + (k % 3) : 0)); } ctx.lineTo(10, -4); ctx.quadraticCurveTo(0, -7, -10, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a5a66'; rr(ctx, 4, 3, 10, 7, 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `bold 5px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('1LB', 9, 8.4);
    // a little "heavy" wobble line under it
    ctx.strokeStyle = `rgba(255,255,255,${0.4 + 0.3 * Math.sin(t * 8)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-12, 10.5); ctx.lineTo(-4, 10.5); ctx.stroke();
    ctx.restore();
  },
  beans(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y + 2);
    // a green gas cloud rising out of the open tin
    for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k / 3) % 1; ctx.fillStyle = `rgba(150,220,90,${0.75 * (1 - ph)})`; ctx.beginPath(); ctx.arc(-3 + k * 3 + Math.sin(ph * 6 + k) * 2, -11 - ph * 9, 3 + ph * 3, 0, TAU); ctx.fill(); }
    // the tin: silver rim, a green label with three beans
    ctx.fillStyle = '#b8bcc8'; rr(ctx, -8, -8, 16, 16, 2); ctx.fill();
    ctx.fillStyle = '#4aa83a'; ctx.fillRect(-8, -4, 16, 9);
    ctx.fillStyle = '#c86a3a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(-4.5 + k * 4.5, 0.5, 1.9, 1.3, 0.4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#e8ecf4'; ctx.beginPath(); ctx.ellipse(0, -8, 8, 2.4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.ellipse(0, -8, 6.5, 1.6, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
};
TourGear.register({ id: 'socks', name: 'SPRING SOCKS', hint: 'TAP JUMP AGAIN IN THE AIR: DOUBLE JUMP', slot: 'feet', glow: '#ffb0c8', icon(ctx, x, y, t) { JumpArt.socks(ctx, x, y, t); } });
TourGear.register({ id: 'cake', name: 'POUND CAKE', hint: 'TAP JUMP AGAIN IN THE AIR: GROUND POUND', slot: 'feet', glow: '#ffd890', icon(ctx, x, y, t) { JumpArt.cake(ctx, x, y, t); } });
TourGear.register({ id: 'beans', name: 'MAGIC BEANS', hint: 'TAP JUMP IN THE AIR, AGAIN AND AGAIN: FART FLOAT', slot: 'feet', glow: '#b8f080', icon(ctx, x, y, t) { JumpArt.beans(ctx, x, y, t); } });

/* ---------- effects ---------- */
// the double jump's dust ring: an expanding ellipse at Brady's feet
class JumpRing extends Ent {
  constructor(g, x, y, col, r1) { super(g, null, 8, 8); this.x = x - 4; this.y = y - 4; this.friendly = true; this.life = 0.34; this.col = col || '#ffffff'; this.r1 = r1 || 26; this.t = 0; }
  update(dt) { this.t += dt; if (this.t >= this.life) this.remove = true; }
  draw(ctx) {
    const k = clamp(this.t / this.life, 0, 1), e = 1 - (1 - k) * (1 - k), r = 6 + e * this.r1;
    ctx.save(); ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = 'rgba(60,36,70,0.45)'; ctx.lineWidth = 3 * (1 - k) + 3; ctx.beginPath(); ctx.ellipse(this.cx, this.cy, r, r * 0.3, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = this.col; ctx.lineWidth = 3 * (1 - k) + 1;
    ctx.beginPath(); ctx.ellipse(this.cx, this.cy, r, r * 0.3, 0, 0, TAU); ctx.stroke();
    // two little puffs flung out sideways
    ctx.fillStyle = 'rgba(255,250,240,0.85)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(this.cx + s * r * 1.05, this.cy - 2 - e * 4, 3.5 * (1 - k) + 1.5, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 0.5 * (1 - k); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(this.cx, this.cy, r * 0.62, r * 0.2, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }
}
// the ground pound's shockwave along the floor
class PoundWave extends Ent {
  constructor(g, x, y, R) { super(g, null, 8, 8); this.x = x - 4; this.y = y - 4; this.friendly = true; this.life = 0.5; this.R = R; this.t = 0; }
  update(dt) { this.t += dt; if (this.t >= this.life) this.remove = true; }
  draw(ctx) {
    const k = clamp(this.t / this.life, 0, 1), e = 1 - Math.pow(1 - k, 3), r = 10 + e * this.R, x = this.cx, y = this.cy;
    ctx.save();
    ctx.globalAlpha = (1 - k) * 0.9;
    ctx.strokeStyle = 'rgba(70,40,30,0.5)'; ctx.lineWidth = 7 * (1 - k) + 3; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.26, 0, Math.PI, TAU); ctx.stroke();
    ctx.strokeStyle = '#fff3c8'; ctx.lineWidth = 6 * (1 - k) + 1.5;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.26, 0, Math.PI, TAU); ctx.stroke();
    // a flash of light where he hit
    if (k < 0.35) { ctx.globalAlpha = (0.35 - k) * 2; ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.ellipse(x, y - 2, 26 * (0.5 + k), 9 * (0.5 + k), 0, 0, TAU); ctx.fill(); ctx.globalAlpha = (1 - k) * 0.9; }
    ctx.strokeStyle = '#ffb83a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, r * 0.75, r * 0.16, 0, Math.PI, TAU); ctx.stroke();
    // little shock spikes on both sides
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const xx = x + s * (r - 4 - i * 9), h = (10 - i * 3) * (1 - k); ctx.beginPath(); ctx.moveTo(xx, y - 2); ctx.lineTo(xx + s * 3, y - 2 - h); ctx.stroke(); }
    ctx.restore();
  }
}
// a green fart puff: falls ~2.5 tiles, swells, knocks out the ordinary enemies it touches
class GasPuff extends Ent {
  constructor(g, x, y, dir) {
    super(g, null, 20, 20); this.x = x - 10; this.y = y - 10; this.vy = 7.5 * TS; this.vx = -dir * 0.9 * TS; this.friendly = true; this.life = 0.55; this.r = 6; this.seed = Math.random() * 10; this.hitSet = new Set(); this.flat = 0; this.t = 0;
  }
  update(dt) {
    this.t += dt; this.life -= dt; const g = this.g;
    if (!this.flat) { this.vy *= Math.pow(0.18, dt); this.x += this.vx * dt; this.y += this.vy * dt; }
    this.r = 6 + Math.min(1, this.t / 0.35) * 12 + this.flat * 8;
    if (!this.flat && SOLID[tileAt(g.area, Math.floor(this.cx / TS), Math.floor((this.cy + 6) / TS))]) { this.flat = 1; this.life = Math.min(this.life, 0.3); }
    if (this.life <= 0) { this.remove = true; return; }
    if (this.life < 0.12) return;
    const box = { x: this.cx - this.r * 0.75, y: this.cy - this.r * 0.7, w: this.r * 1.5, h: this.r * 1.4 };
    for (const e of g.entities) {
      if (!e.enemy || e.dead || e.remove || e.boss || this.hitSet.has(e) || !overlap(box, e)) continue;
      this.hitSet.add(e);
      if (e.hit('disc', this)) { g.addScore(200, e.cx, e.y); g.burst(e.cx, e.cy, 10, '#a8e85a', 'dust'); g.parts.text(e.cx, e.y - 10, 'PEE-YEW!', '#b8f080'); }
    }
    const b = g.boss; if (b && !b.dead && !this.hitSet.has(b) && overlap(box, b)) { this.hitSet.add(b); b.hit('disc', this); }
  }
  draw(ctx) {
    const a = clamp(this.life / 0.3, 0, 1), cx = this.cx, cy = this.cy, r = this.r;
    ctx.save();
    // an outlined cartoon cloud in two greens, flattened when it hits the floor
    ctx.translate(cx, cy); ctx.scale(1 + this.flat * 0.6, 1 - this.flat * 0.35);
    const lumps = [[0, 0, 0.62], [-0.45, 0.15, 0.45], [0.45, 0.12, 0.48], [-0.15, -0.38, 0.42], [0.25, -0.32, 0.4]];
    ctx.globalAlpha = 0.9 * a; ctx.fillStyle = '#3e7a22';
    for (const [lx, ly, lr] of lumps) { ctx.beginPath(); ctx.arc(lx * r, ly * r, lr * r + 1.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#8fdc4a';
    for (const [lx, ly, lr] of lumps) { ctx.beginPath(); ctx.arc(lx * r, ly * r, lr * r, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(220,255,170,0.75)'; ctx.beginPath(); ctx.arc(-0.2 * r, -0.3 * r, 0.22 * r, 0, TAU); ctx.fill();
    ctx.restore();
    // stink lines
    ctx.save(); ctx.globalAlpha = 0.7 * a; ctx.strokeStyle = '#6ab83a'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) { const x = cx + i * r * 0.55, w = Math.sin(this.t * 14 + i + this.seed) * 2; ctx.beginPath(); ctx.moveTo(x, cy + r * 0.6); ctx.quadraticCurveTo(x + w + 2, cy + r * 0.9, x - w, cy + r * 1.2); ctx.stroke(); }
    ctx.restore();
  }
}

/* ---------- Brady ---------- */
Object.assign(Player.prototype, {
  // called by Player.update on a mid-air jump press (11_player.js); true = the press was used
  airJump(inp) {
    const J = this.jumpPow, g = this.g;
    if (!J || !(g.level && g.level.tour) || this.carrying || this.state !== 'play') return false;
    if (this.vy > 0 && TourJump.nearGround(this)) return false;     // about to land: keep it as a buffered jump
    if (J.id === 'socks') {
      if (J.used) return false;
      J.used = true; this.vy = -14.2 * TS; this.jumping = true; this.flipT = 0.42; this.pound = null;
      g.spawn(new JumpRing(g, this.cx, this.y + this.h + 2, '#ffffff', 28)); g.burst(this.cx, this.y + this.h, 8, '#ffffff', 'dust');
      TourJump.sfx('boing', 'jump', { pitch: 1.35, vol: 0.7 });
      return true;
    }
    if (J.id === 'cake') {
      if (this.pound) return false;
      this.pound = { phase: 'tuck', t: 0, y: this.y }; this.vx = 0; this.vy = 0; this.jumping = false;
      TourJump.sfx('poundTuck', 'fly', { pitch: 1.3, vol: 0.6 });
      return true;
    }
    if (J.id === 'beans') {
      const need = 1 / TourJump.GAS;
      if (J.gas < need - 1e-6) { J.emptyT = 0.6; g.burst(this.cx - this.facing * 6, this.y + this.h - 8, 3, '#b8e890', 'dust'); TourJump.sfx('fartEmpty', 'bump', { pitch: 1.6, vol: 0.35 }); return true; }
      J.gas = Math.max(0, J.gas - need); J.puffT = 0; J.down = true;
      // the lift (none near the top of the view: he never floats off screen)
      if (this.y > g.camY + 1.5 * TS) this.vy = Math.min(this.vy, -7.4 * TS); else this.vy = Math.max(this.vy, 0);
      this.jumping = false;
      g.spawn(new GasPuff(g, this.cx - this.facing * 6, this.y + this.h - 6, this.facing));
      TourJump.sfx('fart', 'splat', { pitch: 0.7 + Math.random() * 0.25, vol: 0.7 });
      return true;
    }
    return false;
  },
  // after the physics step: the pound's tuck and slam, the fart float, landings, the arena bounds
  jumpAfter(dt, inp) {
    const J = this.jumpPow, g = this.g, A = g.area;
    if (this.squashT > 0) this.squashT -= dt;
    if (this.flipT > 0) { this.flipT -= dt; if (this.onGround || this.inWater) this.flipT = 0; }
    if (!J) { this.pound = null; return; }
    if (this.onGround || this.inWater || this.hang || this.mounted) {
      if (J.id === 'socks') J.used = false;
    }
    // the ground pound
    const pd = this.pound;
    if (pd) {
      pd.t += dt;
      if (this.inWater || this.hang || this.mounted || this.dead || this.carrying) this.pound = null;
      else if (pd.phase === 'tuck') {
        this.y = pd.y; this.vy = 0; this.vx = 0;
        if (pd.t >= 0.17) { pd.phase = 'slam'; pd.t = 0; this.vy = 21 * TS; TourJump.sfx('poundDrop', 'fly', { pitch: 0.6, vol: 0.5 }); }
      } else {
        if (this.vy < 0) this.pound = null;              // bounced off an enemy (a stomp): the pound ends there
        else if (this.onGround) this.poundLand();
        else { this.vy = Math.max(this.vy, 21 * TS); this.vx *= Math.pow(0.02, dt); if (Math.random() < 0.6) g.burst(this.cx + (Math.random() - 0.5) * 10, this.y - 2, 1, '#ffffff', 'dust'); }
      }
    }
    // the fart float: lighter gravity while squatting, a capped fall, the meter refills on the ground
    if (J.id === 'beans') {
      J.puffT = (J.puffT || 0) + dt; if (J.emptyT > 0) J.emptyT -= dt;
      if (this.onGround || this.inWater || this.hang || this.mounted) {
        if (J.pants > 0.5) { J.snapT = 0.35; TourJump.sfx('pantsSnap', 'select', { pitch: 1.6, vol: 0.55 }); g.parts.text(this.cx, this.y - 8, '*SNAP*', '#ffffff'); }
        J.down = false; if (this.onGround) J.gas = Math.min(1, (J.gas || 0) + dt * 1.25);
      } else if (J.down && !this.carrying) {
        this.vy -= PHYS.gDown * 0.5 * dt; if (this.vy > 4.2 * TS) this.vy = 4.2 * TS;
        if (Math.random() < 0.12) g.burst(this.cx - this.facing * 6, this.y + this.h - 6, 1, '#b8e890', 'dust');
      }
      J.pants = J.down ? Math.min(1, (J.pants || 0) + dt / 0.12) : Math.max(0, (J.pants || 0) - dt / 0.14);
      if (J.snapT > 0) J.snapT -= dt;
    }
    // a locked boss arena keeps Brady inside it
    if (g.bossLock) { const L = g.bossLock; if (this.x < L.x0) this.x = L.x0; if (this.x + this.w > L.x1) this.x = L.x1 - this.w; }
    if (this.y < -TS * 2) { this.y = -TS * 2; this.vy = Math.max(this.vy, 0); }
  },
  poundLand() {
    const g = this.g, A = g.area, R = 3.5 * TS, x = this.cx, y = this.y + this.h;
    // the floor under his boots: bricks break, ?-blocks pop, crumble falls, soil is dug; then he keeps falling
    let broke = false;
    const ty = Math.floor((y + 2) / TS);
    for (const tx of [Math.floor((this.x + 3) / TS), Math.floor((this.x + this.w - 3) / TS)]) {
      const t = tileAt(A, tx, ty);
      if (t === T.BRICK) { g.bumpBlock(tx, ty, true, this); broke = true; }
      else if (t === T.QBLOCK || t === T.QBRICK) g.bumpBlock(tx, ty, true, this);
      else if (t === T.CRUMBLE) { g.setTile(tx, ty, T.EMPTY); A.crumbles.push({ tx, ty, t: 5, state: 'gone' }); g.burst(tx * TS + 16, ty * TS + 16, 8, '#d8b080', 'debris'); broke = true; }
      else if (t === T.SOIL) { g.setTile(tx, ty, T.EMPTY); g.burst(tx * TS + 16, ty * TS + 16, 8, '#8a6040', 'debris'); broke = true; }
    }
    // the shockwave: every ordinary enemy within 3.5 tiles (and 2 tiles up or down) is stunned for 2.5 s
    let n = 0;
    for (const e of g.entities) {
      if (!e.enemy || e.dead || e.remove || e.boss || e.friendly) continue;
      if (Math.abs(e.cx - x) > R || Math.abs((e.y + e.h) - y) > 2 * TS) continue;
      if (e.stun) { e.stun(2.5); n++; } else if ('stunT' in e) { e.stunT = 2.5; n++; }
      e.poundT = 2.5;
    }
    g.spawn(new PoundWave(g, x, y, R)); g.burst(x, y, 14, '#ffffff', 'dust'); g.burst(x, y, 10, '#ffd84a', 'spark');
    for (const s of [-1, 1]) for (let k = 1; k <= 3; k++) g.burst(x + s * k * TS * 0.9, y - 2, 4, '#f4ead8', 'dust');
    g.hitStop = Math.max(g.hitStop || 0, 0.07); g.shake(5);
    TourJump.sfx('poundLand', 'stomp', { pitch: 0.6, vol: 0.9 });
    if (n) g.parts.text(x, this.y - 14, n > 1 ? 'STUNNED x' + n : 'STUNNED!', '#ffd84a');
    this.squashT = 0.18;
    if (broke) { this.onGround = false; this.vy = 4 * TS; this.pound.phase = 'slam'; }
    else this.pound = null;
  },
  takeJump(G) {
    const g = this.g, had = this.jumpPow && this.jumpPow.id;
    if (had === G.id) { this.jumpPow.gas = 1; Sound.play('pick', { pitch: 1.4 }); return; }
    this.jumpPow = { id: G.id, gas: 1, used: false, pants: 0 }; this.pound = null;
    Sound.play('powerup'); g.burst(this.cx, this.cy, 20, G.glow || '#fff2c0', 'confetti');
    g.toast(G.name + '! ' + (G.hint || ''));
    // the first time ever: a one-line tip over the jump button
    const tips = Save.data.tips || (Save.data.tips = {});
    if (!tips[G.id]) { tips[G.id] = true; g.jumpTip = { text: TourJump.tip[G.id], t: 5.5 }; Save.save(); }
  }
});
{
  // FEET items go to their own slot (they never touch HANDS or the Backpack)
  const tg = Player.prototype.takeGear;
  Player.prototype.takeGear = function (G, src) { if (G.slot === 'feet') return this.takeJump(G); return tg.call(this, G, src); };
  // the hit order (§5.2 + this slot): star, hard hat, the HANDS item, then the jump power, then FORM
  const hurt0 = Player.prototype.hurt;
  Player.prototype.hurt = function (src) {
    if (this.jumpPow && this.g.level && this.g.level.tour && !this.dead && this.state === 'play' && !(this.star > 0) && !(this.invuln > 0) && !this.grabbedBy && !this.mounted && !(this.kandi > 0) && !(this.fx.molly > 0) && !this.handsKind() && !this.carrying) {
      const k = 'gear:' + this.jumpPow.id; this.jumpPow = null; this.pound = null; this.dropKind(k, 2);
      this.invuln = 1.8; this.hurtFlash = 0.3; this.g.shake(4); if (src && src.x !== undefined) this.vx = (this.cx < (src.x + (src.w || 0) / 2) ? -1 : 1) * 4 * TS; this.vy = Math.min(this.vy, -6 * TS);
      Sound.play('powerdown', { vol: 0.6 }); this.g.parts.text(this.cx, this.y - 10, 'DROPPED IT!', '#ffffff');
      return;
    }
    return hurt0.call(this, src);
  };
  // the update: the jump power acts after the physics step; the pose follows
  const up = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const r = up.call(this, dt, inp);
    if (this.state === 'play' && !this.dead && this.g.level && this.g.level.tour) this.jumpAfter(dt, inp || {});
    return r;
  };
  const ua = Player.prototype.updateAnim;
  Player.prototype.updateAnim = function (dt, inp) {
    ua.call(this, dt, inp);
    const J = this.jumpPow, a = this.anim;
    if (this.onGround || this.inWater || this.hang || this.mounted || this.state !== 'play') return;
    if (this.pound) a.state = this.pound.phase === 'tuck' ? 'tuck' : 'pound';
    else if (this.flipT > 0) a.state = 'flip';
    else if (J && J.id === 'beans' && J.pants > 0.3) { a.state = 'squat'; a.phase = J.puffT || 0; }
  };
  // the carry, the doors and a respawn: the slot travels with the other carries
  const ep = Play.prototype.enterPortal;
  Play.prototype.enterPortal = function (portal) { if (this.player) this.jumpCarry = this.player.jumpPow ? Object.assign({}, this.player.jumpPow, { pants: 0, down: false }) : null; return ep.call(this, portal); };
  const la = Play.prototype.loadArea;
  Play.prototype.loadArea = function (idx, x, y, power) { const r = la.call(this, idx, x, y, power); if (this.jumpCarry && this.player) { this.player.jumpPow = this.jumpCarry; } return r; };
  // drawing: the trousers come down for the fart float; the somersault and the tuck spin about his middle
  const dr = Player.prototype.draw;
  Player.prototype.draw = function (ctx, t) {
    const J = this.jumpPow;
    this.drawPants = J && J.id === 'beans' ? J.pants || 0 : 0;
    return dr.call(this, ctx, t);
  };
}
// drawBrady gets the trousers and the spin from the player (one small hook in the options object)
{
  const db = drawBrady;
  drawBrady = function (ctx, o) {
    const sc = typeof Game !== 'undefined' ? Game.scene : null, p = sc && sc.player;
    if (p && o && o.anim === p.anim) {
      if (p.drawPants > 0) o = Object.assign({}, o, { pants: p.drawPants });
      let rot = 0;
      if (p.flipT > 0) rot = (1 - p.flipT / 0.42) * TAU * p.facing;
      else if (p.pound && p.pound.phase === 'tuck') rot = Math.min(1, p.pound.t / 0.17) * TAU * p.facing;
      if (p.squashT > 0) {
        // the landing squash after a ground pound
        const k = p.squashT / 0.18; ctx.save(); ctx.translate(o.x, o.y); ctx.scale(1 + 0.16 * k, 1 - 0.18 * k); ctx.translate(-o.x, -o.y); db(ctx, o); ctx.restore(); return;
      }
      if (rot) {
        // spin about his middle, not his feet
        const D = o.small ? BRADY_DIM.small : BRADY_DIM.big, mid = D.hip * 0.9 * (o.scale || 1);
        ctx.save(); ctx.translate(o.x, o.y - mid); ctx.rotate(rot); ctx.translate(-o.x, -(o.y - mid));
        db(ctx, o); ctx.restore(); return;
      }
    }
    return db(ctx, o);
  };
}

/* ---------- HUD: the badge on the jump button, the gas meter, the first-time tip ---------- */
const JumpHud = {
  badge(ctx, b) {
    const play = Game.scene; if (!(play instanceof Play) || !play.level || !play.level.tour || !play.player) return;
    const p = play.player, J = p.jumpPow;
    if (J) {
      const r = Math.max(11, b.r * 0.36), x = b.x + b.r * 0.72, y = b.y - b.r * 0.72;
      const off = !!p.carrying || (J.id === 'socks' && J.used && !p.onGround) || (J.id === 'beans' && J.gas < 1 / TourJump.GAS - 1e-6);
      ctx.save();
      ctx.fillStyle = 'rgba(14,10,26,0.8)'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.globalAlpha = off ? 0.45 : 1; ctx.save(); ctx.translate(x, y); ctx.scale(r / 15, r / 15); TourGear.icon(ctx, 'gear:' + J.id, 0, 0, play.t, play); ctx.restore(); ctx.globalAlpha = 1;
      if (J.id === 'beans') this.meter(ctx, x, y, r + 3, J.gas, J.emptyT > 0);
      ctx.restore();
    }
    const tip = play.jumpTip;
    if (tip && tip.t > 0 && play.state === 'play') {
      const a = clamp(Math.min(tip.t, 5.5 - tip.t) * 2, 0, 1);
      if (typeof TourPicker !== 'undefined') TourPicker.label(ctx, tip.text, b.x - b.r * 1.4, b.y - b.r - 58 + Math.sin(play.t * 4) * 2, a, true);
    }
  },
  // the HUD icon (12_play.js drawHUD calls it in the row of running effects): the item, its gas meter
  hudIcon(ctx, x, y, play) {
    const J = play.player && play.player.jumpPow; if (!J) return;
    ctx.save(); ctx.fillStyle = 'rgba(10,8,18,0.55)'; ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fill();
    ctx.globalAlpha = play.player.carrying ? 0.45 : 1; ctx.translate(x, y); ctx.scale(0.6, 0.6); TourGear.icon(ctx, 'gear:' + J.id, 0, 0, play.t, play); ctx.restore();
    if (J.id === 'beans') { ctx.save(); this.meter(ctx, x, y, 14, J.gas, J.emptyT > 0); ctx.restore(); }
  },
  // six segments around the badge, green while there is gas
  meter(ctx, x, y, r, gas, flash) {
    const n = TourJump.GAS, full = gas * n;
    ctx.lineCap = 'butt';
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i * TAU / n + 0.08, a1 = a0 + TAU / n - 0.16, k = clamp(full - i, 0, 1);
      ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke();
      if (k > 0) { ctx.strokeStyle = k >= 1 ? '#8fdc4a' : 'rgba(143,220,74,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, a0, a0 + (a1 - a0) * k); ctx.stroke(); }
      else if (flash) { ctx.strokeStyle = 'rgba(255,90,90,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke(); }
    }
  }
};
{
  const ja = Input.jumpArt;
  Input.jumpArt = (ctx, b) => { if (ja) ja(ctx, b); JumpHud.badge(ctx, b); };
  const u0 = Play.prototype.update;
  Play.prototype.update = function (dt) { if (this.jumpTip && this.jumpTip.t > 0 && !this.paused) this.jumpTip.t -= dt; return u0.call(this, dt); };
}
try { window.BRADY_POWERS = Object.assign(window.BRADY_POWERS || {}, { TourJump, JumpHud, GasPuff, PoundWave, JumpRing }); } catch (e) { /* not in a browser */ }
