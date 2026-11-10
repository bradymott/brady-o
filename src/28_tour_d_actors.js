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

/* Pre-rendered enemies: an enemy config with sprite: 'kind' draws from its country's atlas (Tour.country atlas, or
   cfg.atlas) once that atlas is in: clips 'kind/<mode>' or single frames 'kind_<mode>_000'; modes without art fall
   back along FALLBACK lists; until the atlas loads the procedural art(...) draws as before. */
const TourSprite = {
  /* Art size over the hitbox, anchored at the feet/centre (collision never changes): ART_SCALE.enemy (1.24) for
     everyone, easing up to 1.3 only for the really tiny ones (longest side under 24 px). Keyed on the LONGEST side so
     wide, flat enemies are never stretched. */
  scale(e) { const big = Math.max(e.w, e.h); return big >= 24 ? ART_SCALE.enemy : ART_SCALE.enemy + 0.06 * Math.min(1, (24 - big) / 8); },
  FALLBACK: {
    walk: { walk: ['walk', 'idle'], idle: ['idle', 'walk'], hop: ['hop', 'walk', 'idle'], notice: ['notice', 'idle', 'walk'], charge: ['charge', 'walk'], throw: ['throw', 'idle', 'walk'], curl: ['curl', 'idle', 'walk'], roll: ['roll', 'curl', 'walk'], stun: ['stun', 'idle', 'walk'], flat: ['flat', 'ko', 'idle', 'walk'], ko: ['ko', 'stun', 'idle', 'walk'] },
    fly: { fly: ['fly'], swoop: ['swoop', 'fly'], stun: ['stun', 'fly'], ko: ['ko', 'stun', 'fly'] },
    swim: { swim: ['swim'], ko: ['ko', 'swim'] },
    leap: { up: ['up'], down: ['down', 'up'], ko: ['ko', 'down', 'up'] },
    friend: { idle: ['idle'], wave: ['wave', 'idle'] }
  },
  atlasOf(e) { const c = e.cfg; if (c.atlas) return c.atlas; const C = e.g && e.g.level && e.g.level.country ? Tour.countries[e.g.level.country] : null; return C ? C.atlas || C.id : null; },
  of(e) { const c = e.cfg; if (!c || !c.sprite || typeof Atlas === 'undefined') return null; const a = this.atlasOf(e); return a && Atlas.has(a) ? a : null; },
  hasFrame(e, mode) { const a = this.of(e); return !!(a && (Atlas.anim(a, e.cfg.sprite + '/' + mode) || Atlas.frame(a, e.cfg.sprite + '_' + mode + '_000'))); },
  /* pick(e, mode, fallback): the atlas clip ('kind/mode') or frame ('kind_mode_000') this enemy would draw for
     mode, or null when the atlas isn't in or has no art for that kind/mode (then the procedural art draws). */
  pick(e, mode, fallback) {
    const a = this.of(e); if (!a) return null;
    const k = e.cfg.sprite, list = (fallback && fallback[mode]) || [mode];
    for (const m of list) {
      const id = k + '/' + m; if (Atlas.anim(a, id)) return id;
      const f = k + '_' + m + '_000'; if (Atlas.frame(a, f)) return f;
    }
    return null;
  },
  /* atlas art has its outline baked in, so only the procedural fallback goes through Ink: decide per frame actually
     drawn (an atlas can be in yet lack this kind or mode) */
  inked(ctx, e, mode, fallback) {
    if (this.pick(e, mode, fallback)) e.drawArt(ctx);
    else Ink.ent(ctx, e, c => e.drawArt(c), { scale: this.scale(e), extra: e.cfg.inkPad || 0 });  // cfg.inkPad: extra slack for art that reaches far out
  },
  draw(ctx, e, x, y, mode, fallback) {
    const id = this.pick(e, mode, fallback); if (!id) return false;
    const a = this.of(e), o = { scale: this.scale(e) };
    return id.indexOf('/') >= 0 ? Atlas.animate(ctx, a, id, e.t, x, y, e.dir || 1, o) : Atlas.draw(ctx, a, id, x, y, e.dir || 1, o);
  },
  // procedural art, scaled about its origin point
  art(ctx, e, x, y, mode) { const k = this.scale(e); ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.translate(-x, -y); e.cfg.art(ctx, e, x, y, mode, e.g.t); ctx.restore(); }
};

class TourEnemy extends Walker {
  static make(cfg) {
    const cls = class extends TourEnemy { constructor(g, s) { super(g, s, cfg); } }; cls.cfg = cfg; return cls;
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
    // slideT > 0: sliding helplessly (Spain's tomato puddles); a wall knocks it out, a ledge drops it
    if (this.slideT > 0) { this.slideT -= dt; this.vx = this.dir * 7 * TS; this.mode = 'stun'; this.walk(dt); if (this.hitWall) { this.slideT = 0; this.hit('bump', this); } return; }
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
  get sprite() { return TourSprite.of(this); }
  paint(ctx, x, y, mode) {
    if (this.sprite && TourSprite.draw(ctx, this, x, y, mode, TourSprite.FALLBACK.walk)) return;
    if (this.cfg.art) TourSprite.art(ctx, this, x, y, mode);
  }
  get artMode() { return this.knocked ? 'ko' : this.friendT ? 'walk' : this.dead ? 'flat' : this.mode; }
  draw(ctx) { TourSprite.inked(ctx, this, this.artMode, TourSprite.FALLBACK.walk); }
  drawArt(ctx) {
    if (this.knocked) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(Math.PI + (this.spin || 0)); this.paint(ctx, 0, this.h / 2, 'ko'); ctx.restore(); return; }
    if (this.friendT) { this.drawFriend(ctx, c => this.paint(c, 0, 0, 'walk')); return; }
    if (this.dead) {
      if (this.sprite && TourSprite.hasFrame(this, 'flat')) { this.paint(ctx, this.cx, this.y + this.h, 'flat'); return; }
      ctx.save(); ctx.translate(this.cx, this.y + this.h); ctx.scale(1.25, 0.35); this.paint(ctx, 0, 0, 'flat'); ctx.restore(); return;
    }
    this.paint(ctx, this.cx, this.y + this.h, this.mode);
    if (this.stunT > 0) TourKit.dizzy(ctx, this.cx, this.y - 4, this.t);
  }
  get light() { return this.cfg.glow ? { r: 50, c: this.cfg.glow } : null; }
}

// flyers: drift on a sine path around home; some swoop at Brady
class TourFlyer extends Ent {
  static make(cfg) { const cls = class extends TourFlyer { constructor(g, s) { super(g, s, cfg); } }; cls.cfg = cfg; return cls; }
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
  get sprite() { return TourSprite.of(this); }
  paint(ctx, x, y, mode) {
    if (this.sprite && TourSprite.draw(ctx, this, x, y, mode, TourSprite.FALLBACK.fly)) return;
    TourSprite.art(ctx, this, x, y, mode);
  }
  get artMode() { return this.knocked || this.dead ? 'ko' : this.stunT > 0 ? 'stun' : this.mode; }
  draw(ctx) { TourSprite.inked(ctx, this, this.artMode, TourSprite.FALLBACK.fly); }
  drawArt(ctx) {
    ctx.save();
    if (this.knocked) { ctx.translate(this.cx, this.cy); ctx.rotate(Math.PI + (this.spin || 0)); this.paint(ctx, 0, 0, 'ko'); ctx.restore(); return; }
    this.paint(ctx, this.cx, this.cy, this.dead ? 'ko' : this.stunT > 0 ? 'stun' : this.mode);
    ctx.restore();
    if (this.stunT > 0) TourKit.dizzy(ctx, this.cx, this.y - 4, this.t);
  }
}

// swimmers: patrol the water, chase Brady when he's close
class TourSwimmer extends Ent {
  static make(cfg) { const cls = class extends TourSwimmer { constructor(g, s) { super(g, s, cfg); } }; cls.cfg = cfg; return cls; }
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
  get sprite() { return TourSprite.of(this); }
  draw(ctx) { TourSprite.inked(ctx, this, this.knocked ? 'ko' : 'swim', TourSprite.FALLBACK.swim); }
  drawArt(ctx) {
    const mode = this.knocked ? 'ko' : 'swim';
    if (this.sprite && TourSprite.draw(ctx, this, this.cx, this.cy, mode, TourSprite.FALLBACK.swim)) return;
    TourSprite.art(ctx, this, this.cx, this.cy, mode);
  }
}

// leapers: jump out of water or lava in an arc, then dive back in
class TourLeaper extends Ent {
  static make(cfg) { const cls = class extends TourLeaper { constructor(g, s) { super(g, s, cfg); } }; cls.cfg = cfg; return cls; }
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
  get sprite() { return TourSprite.of(this); }
  draw(ctx) { if (this.state === 'wait' && !this.knocked) return; TourSprite.inked(ctx, this, this.knocked ? 'ko' : this.vy < 0 ? 'up' : 'down', TourSprite.FALLBACK.leap); }
  drawArt(ctx) {
    if (this.state === 'wait' && !this.knocked) return;
    const mode = this.knocked ? 'ko' : this.vy < 0 ? 'up' : 'down';
    if (this.sprite && TourSprite.draw(ctx, this, this.cx, this.cy, mode, TourSprite.FALLBACK.leap)) return;
    TourSprite.art(ctx, this, this.cx, this.cy, mode);
  }
  get light() { return this.cfg.glow && this.state !== 'wait' ? { r: 70, c: this.cfg.glow } : null; }
}

// a friendly local who hands Brady something when touched (once)
class TourFriend extends Ent {
  static make(cfg) { const cls = class extends TourFriend { constructor(g, s) { super(g, s, cfg); } }; cls.cfg = cfg; return cls; }
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
  get sprite() { return TourSprite.of(this); }
  draw(ctx) { TourSprite.inked(ctx, this, this.given ? 'wave' : 'idle', TourSprite.FALLBACK.friend); }
  drawArt(ctx) {
    const mode = this.given ? 'wave' : 'idle';
    if (this.sprite && TourSprite.draw(ctx, this, this.cx, this.y + this.h, mode, TourSprite.FALLBACK.friend)) return;
    TourSprite.art(ctx, this, this.cx, this.y + this.h, mode);
  }
}

/* TourProp: a world object Brady can push, kick and stomp-launch, and that bosses can fling. While it moves fast it
   hits what it meets: the boss gets b.hit('prop', prop) (its brain decides what that does), ordinary enemies are
   knocked out, and (when cfg.hurts) Brady is hurt unless he threw it himself.
   cfg: { w, h, art(ctx, e, x, y, t) (x, y = feet centre), kick (speed in tiles/s, 7), bounce (wall restitution, 0.6),
          friction (tiles/s², 6), roll (true: it rolls; e.rot is the angle), hurts, hp (boss hits before it breaks, 1;
          0 = never breaks), life (seconds, optional), breakOnWall, burst (colour), onBreak(e), onHitBoss(e, b), gravity (1) }
   Spawn one with g.spawn(new TourProp(g, { x, y }, cfg)), or register TourProp.make(cfg) as an entity type. */
class TourProp extends Ent {
  static make(cfg) { return class extends TourProp { constructor(g, s) { super(g, s, cfg); } }; }
  constructor(g, s, cfg) {
    super(g, s, cfg.w || 24, cfg.h || 24); this.cfg = cfg; this.prop = true; this.hp = cfg.hp != null ? cfg.hp : 1;
    this.rot = 0; this.life = cfg.life || 0; this.hot = 0; this.thrownBy = null; this.fast = false;
    if (cfg.init) cfg.init(this, s);
  }
  get moving() { return Math.abs(this.vx) > 2.5 * TS || Math.abs(this.vy) > 4 * TS; }
  fling(vx, vy, by) { this.vx = vx; this.vy = vy; this.thrownBy = by || null; this.hot = 0.3; this.onGround = false; }
  kick(dir, p) { this.vx = dir * (this.cfg.kick || 7) * TS; this.vy = Math.min(this.vy, -2 * TS); this.thrownBy = p; Sound.play('kick', { vol: 0.5 }); this.g.burst(this.cx, this.y + this.h, 5, '#ffffff', 'spark'); }
  update(dt) {
    this.t += dt; const c = this.cfg, g = this.g;
    if (this.dead) { this.updateKnocked(dt); return; }
    if (this.life) { this.life -= dt; if (this.life <= 0) { this.break(); return; } }
    if (this.hot > 0) this.hot -= dt;
    if (c.think) c.think(this, dt);
    this.vy += PHYS.gDown * (c.gravity != null ? c.gravity : 1) * dt; if (this.vy > PHYS.maxFall) this.vy = PHYS.maxFall;
    const before = this.vx;
    moveBody(this, g.area, dt, { semis: c.semis !== false });
    if (this.hitWall) { this.vx = -before * (c.bounce != null ? c.bounce : 0.6); if (Math.abs(before) > 3 * TS) { Sound.play('bump', { vol: 0.4 }); if (c.breakOnWall) { this.break(); return; } } }
    if (this.onGround) this.vx = approach(this.vx, 0, (c.friction != null ? c.friction : 6) * TS * dt);
    if (c.roll) this.rot += this.vx * dt / (this.w / 2);
    this.fast = this.moving;
    if (this.fast) {
      const b = g.boss;
      if (b && !b.remove && b.state === 'fight' && overlap(this, b)) {
        const r = b.hit('prop', this);
        if (r) { c.onHitBoss && c.onHitBoss(this, b); this.hp--; if (this.hp <= 0 && c.hp !== 0) { this.break(); } else { this.vx = -sign(this.vx || 1) * 4 * TS; this.vy = -5 * TS; this.thrownBy = null; } return; }
      }
      for (const e of g.entities) if (e.enemy && !e.boss && !e.dead && !e.remove && e !== this && overlap(this, e)) { if (e.hit('bump', this)) g.addScore(200, e.cx, e.y); }
    }
    if (this.y > g.area.H * TS + 100) this.remove = true;
  }
  break() { const c = this.cfg; this.remove = true; this.g.burst(this.cx, this.cy, 14, c.burst || '#ffffff', 'debris'); Sound.play('break', { vol: 0.6 }); c.onBreak && c.onBreak(this); }
  hit(kind, src) { return false; }
  touchPlayer(p) {
    const c = this.cfg;
    if (p.dead || c.ghost) return;
    if (p.vy > 0 && p.prevBottom <= this.y + Math.max(8, this.h * 0.4)) {
      // a stomp launches it up and forward
      p.vy = -(p.inp.jump ? PHYS.stompVHeld : PHYS.stompV); p.jumping = true; p.y = Math.min(p.y, this.y - p.h + 2);
      this.fling(p.facing * (c.kick || 7) * 0.7 * TS, -7 * TS, p); Sound.play('stomp', { vol: 0.5 }); return;
    }
    if (this.fast && c.hurts && this.thrownBy !== p) { p.hurt(this); return; }
    // push or kick from the side
    const side = p.cx < this.cx ? 1 : -1;
    if (Math.abs(p.vx) > 2 * TS && sign(p.vx) === side) this.kick(side, p);
    else { this.x += side * 1.5; p.x -= side; }
  }
  draw(ctx) { Ink.ent(ctx, this, c => this.drawArt(c)); }
  drawArt(ctx) {
    if (this.dead && this.knocked) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(this.spin || 0); this.cfg.art(ctx, this, 0, this.h / 2, this.g.t); ctx.restore(); return; }
    ctx.save();
    if (this.cfg.roll) { ctx.translate(this.cx, this.cy); ctx.rotate(this.rot); ctx.translate(-this.cx, -this.cy); }
    this.cfg.art(ctx, this, this.cx, this.y + this.h, this.g.t);
    ctx.restore();
  }
}

