/* ============================================================
   World tour: enemy toolkit.
   TourEnemy.make({...}) builds a stompable walker from a config:
   behavior (walk / hop / charge / throw / roll / still), size, speed,
   art(ctx, e, x, y, mode). TourFlyer / TourSwimmer / TourLeaper cover
   the air and the water. Every enemy can be stunned by salsa or
   tacos, knocked out by smoke puffs and rainbow lasers.
   ============================================================ */
class TourShot extends Shot {
  constructor(g, x, y, o) { super(g, x, y, o); this.art = o.art || null; this.spin = o.spin || 0; this.blockable = o.blockable !== false; }
  draw(ctx) { if (this.art) this.art(ctx, this, this.g.t); else super.draw(ctx); }
}
function tourFire(g, x, y, o) { const s = new TourShot(g, x, y, o); g.spawn(s); return s; }

class TourEnemy extends Walker {
  static make(cfg) {
    return class extends TourEnemy { constructor(g, s) { super(g, s, cfg); } };
  }
  constructor(g, s, cfg) {
    super(g, s, cfg.w || 22, cfg.h || 26, cfg.speed != null ? cfg.speed : 1.2);
    this.cfg = cfg; this.behavior = cfg.behavior || 'walk';
    this.edgeTurn = s.edgeTurn != null ? !!s.edgeTurn : !!cfg.edgeTurn;
    this.spiky = !!cfg.spiky; this.fiery = !!cfg.fiery; this.hp = cfg.hp || 1;
    this.stunT = 0; this.cool = 0.6 + Math.random() * 1.2; this.mode = 'walk'; this.seed = Math.floor(Math.random() * 999);
    this.homeX = this.x; this.state = 'walk'; this.st = 0;
    if (this.behavior === 'still' || this.behavior === 'throw') this.vx = 0;
    if (cfg.init) cfg.init(this, s);
  }
  stun(t) {
    if (this.dead) return;
    this.stunT = Math.max(this.stunT, t); this.vx = 0; this.state = 'walk';
    this.g.burst(this.cx, this.y, 6, '#ffd84a', 'spark');
  }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    if (this.dead) { this.flatT -= dt; if (this.flatT <= 0) this.remove = true; return; }
    if (this.stunT > 0) { this.stunT -= dt; this.vx = 0; this.mode = 'stun'; this.walk(dt); return; }
    if (this.cool > 0) this.cool -= dt;
    this.think(dt);
    if (this.behavior !== 'fly') this.walk(dt);
  }
  think(dt) {
    const c = this.cfg, p = this.g.player;
    if (c.think) { c.think(this, dt); return; }
    const sp = this.speed;
    switch (this.behavior) {
      case 'walk': if (!this.vx) this.vx = this.dir * sp; this.mode = 'walk'; break;
      case 'still': this.vx = 0; this.mode = 'idle'; if (p) this.dir = sign(p.cx - this.cx) || this.dir; break;
      case 'hop': {
        this.mode = this.onGround ? 'walk' : 'hop';
        if (this.onGround) {
          this.vx = this.dir * sp * 0.6;
          if (this.cool <= 0) { if (TourKit.near(this, p, 8, 4)) this.dir = sign(p.cx - this.cx) || this.dir; this.vy = -(c.hopV || 9) * TS; this.vx = this.dir * sp * 1.4; this.onGround = false; this.cool = c.hopEvery || 1.3; c.onHop && c.onHop(this); }
        }
        break;
      }
      case 'charge': {
        if (this.state === 'walk') {
          this.mode = 'walk'; if (!this.vx) this.vx = this.dir * sp;
          if (this.cool <= 0 && p && !p.dead && Math.abs(p.cy - this.cy) < 2 * TS && Math.abs(p.cx - this.cx) < (c.range || 7) * TS) { this.state = 'notice'; this.st = c.windup || 0.45; this.vx = 0; this.dir = sign(p.cx - this.cx) || this.dir; c.onNotice && c.onNotice(this); }
        } else if (this.state === 'notice') { this.mode = 'notice'; this.vx = 0; this.st -= dt; if (this.st <= 0) { this.state = 'charge'; this.st = c.chargeT || 1.4; } }
        else { this.mode = 'charge'; this.vx = this.dir * (c.chargeSpeed || 5.5) * TS; this.st -= dt; if (this.st <= 0 || this.hitWall) { this.state = 'walk'; this.cool = 2; this.vx = this.dir * sp; } }
        break;
      }
      case 'throw': {
        this.vx = c.pace ? (Math.sin(this.t * 0.8) > 0 ? 1 : -1) * sp * 0.5 : 0;
        if (p) this.dir = sign(p.cx - this.cx) || this.dir;
        this.mode = this.st > 0 ? 'throw' : 'idle'; if (this.st > 0) this.st -= dt;
        if (this.cool <= 0 && TourKit.near(this, p, c.range || 10, 5)) { this.cool = c.every || 2.4; this.st = 0.35; c.shoot ? c.shoot(this, p) : null; }
        break;
      }
      case 'roll': {
        // walks, then curls up and rolls fast when Brady is close
        if (this.state === 'walk') { this.mode = 'walk'; if (!this.vx) this.vx = this.dir * sp; if (this.cool <= 0 && TourKit.near(this, p, c.range || 8, 2)) { this.state = 'curl'; this.st = 0.4; this.vx = 0; this.dir = sign(p.cx - this.cx) || this.dir; } }
        else if (this.state === 'curl') { this.mode = 'curl'; this.st -= dt; if (this.st <= 0) { this.state = 'roll'; this.st = c.rollT || 2.6; } }
        else { this.mode = 'roll'; this.vx = this.dir * (c.rollSpeed || 6) * TS; this.st -= dt; if (this.hitWall) this.dir = -this.dir; if (this.st <= 0) { this.state = 'walk'; this.cool = 2.4; this.vx = this.dir * sp; } }
        break;
      }
    }
  }
  // spiky while rolling (for 'roll' enemies) or always (cfg.spiky)
  get prickly() { return this.spiky || (this.behavior === 'roll' && this.state === 'roll' && this.cfg.rollSpiky !== false); }
  hit(kind, src) {
    if (this.dead) return false;
    if (kind === 'taco') { this.stun(3.2); this.g.addScore(50, this.cx, this.y); return true; }
    if (kind === 'love' || kind === 'hug') return this.befriend();
    if (kind === 'stomp' || kind === 'spin') {
      if (this.stunT > 0) return this.stomp(src);
      if (this.prickly || this.fiery) return kind === 'spin' ? 'bounce' : false;
      if (this.hp > 1) { this.hp--; this.cfg.onHurt && this.cfg.onHurt(this); Sound.play('stomp', { pitch: 1.3 }); this.g.burst(this.cx, this.y, 6, '#ffffff', 'spark'); return 'bounce'; }
      return this.stomp(src);
    }
    this.knockOff(src && src.vx ? sign(src.vx) : (src && src.x < this.x ? 1 : -1));
    this.cfg.onDefeat && this.cfg.onDefeat(this, kind);
    return true;
  }
  stomp(p) {
    this.dead = true; this.flatT = 0.6; this.vx = 0;
    Sound.play('stomp');
    this.g.burst(this.cx, this.y + this.h, 8, this.cfg.burst || '#ffffff', 'dust');
    this.cfg.onDefeat && this.cfg.onDefeat(this, 'stomp');
    return true;
  }
  touchPlayer(p) { if (this.dead || this.stunT > 0) return; p.hurt(this); }
  paint(ctx, x, y, mode) { if (this.cfg.art) this.cfg.art(ctx, this, x, y, mode, this.g.t); }
  draw(ctx) {
    if (this.knocked) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(Math.PI + (this.spin || 0)); this.paint(ctx, 0, this.h / 2, 'ko'); ctx.restore(); return; }
    if (this.friendT) { this.drawFriend(ctx, c => this.paint(c, 0, 0, 'walk')); return; }
    if (this.dead) { ctx.save(); ctx.translate(this.cx, this.y + this.h); ctx.scale(1.25, 0.35); this.paint(ctx, 0, 0, 'flat'); ctx.restore(); return; }
    this.paint(ctx, this.cx, this.y + this.h, this.mode);
    if (this.stunT > 0) TourKit.dizzy(ctx, this.cx, this.y - 4, this.t);
  }
  get light() { return this.cfg.glow ? { r: 50, c: this.cfg.glow } : null; }
}

// flyers: drift on a sine path around home; some swoop at Brady
class TourFlyer extends Ent {
  static make(cfg) { return class extends TourFlyer { constructor(g, s) { super(g, s, cfg); } }; }
  constructor(g, s, cfg) {
    super(g, s, cfg.w || 24, cfg.h || 18); this.cfg = cfg; this.enemy = true; this.hx = this.x; this.hy = this.y;
    this.range = (s.range || cfg.range || 3) * TS; this.stunT = 0; this.state = 'drift'; this.st = 0; this.cool = 1 + Math.random() * 2; this.mode = 'fly';
    this.ph = Math.random() * TAU;
  }
  stun(t) { this.stunT = Math.max(this.stunT, t); }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    if (this.dead) { this.vy += PHYS.gDown * dt; this.y += this.vy * dt; if (this.y > this.g.area.H * TS + 60) this.remove = true; return; }
    if (this.stunT > 0) { this.stunT -= dt; this.vy = 1.5 * TS; this.y += this.vy * dt * 0.2; return; }
    const c = this.cfg, p = this.g.player;
    if (c.think) { c.think(this, dt); return; }
    if (this.cool > 0) this.cool -= dt;
    if (this.state === 'drift') {
      const nx = this.hx + Math.sin(this.t * (c.speed || 0.9) + this.ph) * this.range;
      this.dir = sign(nx - this.x) || this.dir; this.x = nx; this.y = this.hy + Math.sin(this.t * 2.4 + this.ph) * 8;
      if (c.swoop && this.cool <= 0 && TourKit.near(this, p, 6, 7) && p.y > this.y) { this.state = 'swoop'; this.st = 0; this.sx = this.x; this.sy = this.y; this.tx = p.cx - this.w / 2; this.ty = p.y; c.onSwoop && c.onSwoop(this); }
    } else {
      this.st += dt; const k = Math.min(1, this.st / 0.9), arc = Math.sin(k * Math.PI);
      this.x = lerp(this.sx, this.tx + (this.tx - this.sx) * 0.6, k); this.y = lerp(this.sy, this.sy, k) + arc * (this.ty - this.sy);
      this.dir = sign(this.tx - this.sx) || this.dir; this.mode = 'swoop';
      if (k >= 1) { this.state = 'drift'; this.cool = 2.5; this.hx = this.x; this.hy = this.sy; this.mode = 'fly'; }
    }
  }
  hit(kind, src) {
    if (this.dead) return false;
    if (kind === 'taco') { this.stun(2.5); return true; }
    if (kind === 'stomp' || kind === 'spin') { if (this.cfg.spiky) return kind === 'spin' ? 'bounce' : false; this.dead = true; this.vy = 0; Sound.play('stomp'); this.g.burst(this.cx, this.cy, 10, this.cfg.burst || '#ffffff', 'dust'); this.cfg.onDefeat && this.cfg.onDefeat(this); return true; }
    this.knockOff(src && src.vx ? sign(src.vx) : 1); this.cfg.onDefeat && this.cfg.onDefeat(this); return true;
  }
  touchPlayer(p) { if (!this.dead && this.stunT <= 0) p.hurt(this); }
  draw(ctx) {
    ctx.save();
    if (this.knocked) { ctx.translate(this.cx, this.cy); ctx.rotate(Math.PI + (this.spin || 0)); this.cfg.art(ctx, this, 0, 0, 'ko', this.g.t); ctx.restore(); return; }
    this.cfg.art(ctx, this, this.cx, this.cy, this.dead ? 'ko' : this.stunT > 0 ? 'stun' : this.mode, this.g.t);
    ctx.restore();
    if (this.stunT > 0) TourKit.dizzy(ctx, this.cx, this.y - 4, this.t);
  }
}

// swimmers: patrol the water, chase Brady when he's close
class TourSwimmer extends Ent {
  static make(cfg) { return class extends TourSwimmer { constructor(g, s) { super(g, s, cfg); } }; }
  constructor(g, s, cfg) { super(g, s, cfg.w || 28, cfg.h || 18); this.cfg = cfg; this.enemy = true; this.hx = this.x; this.vx = -(cfg.speed || 1.6) * TS; this.stunT = 0; }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    if (this.stunT > 0) { this.stunT -= dt; return; }
    const p = this.g.player, c = this.cfg, sp = (c.speed || 1.6) * TS;
    if (c.chase !== false && p && !p.dead && Math.abs(p.cx - this.cx) < 5 * TS && Math.abs(p.cy - this.cy) < 3 * TS) {
      const dx = p.cx - this.cx, dy = p.cy - this.cy, d = Math.hypot(dx, dy) || 1;
      this.vx = approach(this.vx, dx / d * sp * 1.5, 4 * TS * dt); this.vy = approach(this.vy, dy / d * sp, 4 * TS * dt);
    } else {
      if (Math.abs(this.x - this.hx) > (c.range || 4) * TS) this.vx = -sign(this.x - this.hx) * sp;
      this.vy = approach(this.vy, Math.sin(this.t * 1.5) * 0.6 * TS, 2 * TS * dt);
    }
    moveBody(this, this.g.area, dt, { semis: false });
    if (this.hitWall) this.vx = -this.vx;
    if (this.vx) this.dir = sign(this.vx);
  }
  hit(kind, src) { if (this.dead) return false; if (kind === 'taco') { this.stunT = 2.5; return true; } if (kind === 'stomp') return false; this.knockOff(1); return true; }
  touchPlayer(p) { if (!this.dead && this.stunT <= 0) p.hurt(this); }
  draw(ctx) { this.cfg.art(ctx, this, this.cx, this.cy, this.knocked ? 'ko' : 'swim', this.g.t); }
}

// leapers: jump out of water or lava in an arc, then dive back in
class TourLeaper extends Ent {
  static make(cfg) { return class extends TourLeaper { constructor(g, s) { super(g, s, cfg); } }; }
  constructor(g, s, cfg) { super(g, s, cfg.w || 20, cfg.h || 24); this.cfg = cfg; this.enemy = true; this.homeY = this.y; this.wait = (s.delay || 0) + 1 + Math.random() * 1.5; this.state = 'wait'; }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    if (this.state === 'wait') { this.wait -= dt; if (this.wait <= 0) { this.state = 'jump'; this.vy = -(this.cfg.jumpV || 15.5) * TS; this.vx = (this.cfg.drift || 0) * TS * (Math.random() < 0.5 ? -1 : 1); } return; }
    this.vy += PHYS.gDown * 0.55 * dt; this.y += this.vy * dt; this.x += this.vx * dt;
    if (this.vy > 0 && this.y >= this.homeY) {
      this.y = this.homeY; this.state = 'wait'; this.wait = (this.cfg.every || 1.6) + Math.random(); this.vx = 0;
      if (this.g.onScreen(this)) { Sound.play('splash', { vol: 0.35 }); this.g.burst(this.cx, this.y, 8, this.cfg.splash || '#8ad8ff', 'spark'); }
    }
  }
  hit(kind, src) { if (this.dead || this.state === 'wait') return false; if (kind === 'stomp' && this.cfg.stompable) { this.knockOff(1); return true; } if (kind === 'stomp' || kind === 'spin') return this.cfg.fiery && kind === 'spin' ? 'bounce' : false; this.knockOff(1); return true; }
  touchPlayer(p) { if (!this.dead && this.state !== 'wait') p.hurt(this); }
  draw(ctx) { if (this.state === 'wait' && !this.knocked) return; this.cfg.art(ctx, this, this.cx, this.cy, this.vy < 0 ? 'up' : 'down', this.g.t); }
  get light() { return this.cfg.glow && this.state !== 'wait' ? { r: 70, c: this.cfg.glow } : null; }
}

// a friendly local who hands Brady something when touched (once)
class TourFriend extends Ent {
  static make(cfg) { return class extends TourFriend { constructor(g, s) { super(g, s, cfg); } }; }
  constructor(g, s, cfg) { super(g, s, cfg.w || 24, cfg.h || 40); this.cfg = cfg; this.given = false; this.give = s.give || cfg.give || 'mushroom'; }
  update(dt) { this.t += dt; }
  touchPlayer(p) {
    if (this.given || p.dead) return;
    this.given = true;
    const g = this.g;
    g.parts.text(this.cx, this.y - 12, this.cfg.line || 'A GIFT FOR YOU!', '#7affd8');
    TourKit.sfx('gift', 'appear');
    g.spawn(new TourItem(g, this.cx + (p.cx < this.cx ? -20 : 20), this.y + 6, this.give));
  }
  draw(ctx) { this.cfg.art(ctx, this, this.cx, this.y + this.h, this.given ? 'wave' : 'idle', this.g.t); }
}
