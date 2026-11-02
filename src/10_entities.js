/* ============================================================
   Entities — enemies, items, platforms, hazards, props, boss
   Coordinates: x,y = top-left of hitbox (world logical px)
   ============================================================ */
class Ent {
  constructor(g, s, w, h) {
    this.g = g; this.s = s || {};
    this.w = w; this.h = h;
    this.x = (s ? s.x : 0) - w / 2; this.y = (s ? s.y : 0) - h;
    this.vx = 0; this.vy = 0; this.t = Math.random() * 10; this.dir = (s && s.dir) || -1;
    this.dead = false; this.remove = false; this.enemy = false; this.solidTop = false;
    this.onGround = false;
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  update(dt) { this.t += dt; }
  draw(ctx) { }
  touchPlayer(p) { }
  hit(kind, src) { return false; }
  // death by knock-off: flip and fall
  knockOff(dirx) {
    if (this.dead) return;
    this.dead = true; this.knocked = true; this.vy = -9 * TS; this.vx = (dirx || 1) * 2.5 * TS; this.spin = 0;
    this.g.addScore(200, this.cx, this.y);
    Sound.play('kick');
    this.g.burst(this.cx, this.cy, 10, '#ffffff', 'spark');
  }
  updateKnocked(dt) {
    this.vy += PHYS.gDown * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.spin = (this.spin || 0) + dt * 10;
    if (this.y > this.g.area.H * TS + 100) this.remove = true;
  }
}

/* ---------------- walkers ---------------- */
class Walker extends Ent {
  constructor(g, s, w, h, speed) {
    super(g, s, w, h);
    this.enemy = true; this.speed = speed * TS; this.vx = this.dir * this.speed;
    this.edgeTurn = !!s.edgeTurn; this.flatT = 0;
  }
  walk(dt) {
    const A = this.g.area;
    this.vy += PHYS.gDown * dt; if (this.vy > PHYS.maxFall) this.vy = PHYS.maxFall;
    if (this.edgeTurn && this.onGround) {
      const ahead = this.vx > 0 ? this.x + this.w + 2 : this.x - 2;
      const tx = Math.floor(ahead / TS), ty = Math.floor((this.y + this.h + 2) / TS);
      const t = tileAt(A, tx, ty);
      if (!SOLID[t] && t !== T.SEMI) { this.vx = -this.vx; }
    }
    const before = this.vx;
    moveBody(this, A, dt, { semis: true, platforms: this.g.platforms });
    if (this.hitWall) this.vx = -before;
    if (this.vx) this.dir = sign(this.vx);
    if (this.ride) { this.x += this.ride.dx || 0; this.y += this.ride.dy || 0; }
    if (this.y > A.H * TS + 64) this.remove = true;
    if (lavaContact(this, A)) { this.dead = true; this.remove = true; this.g.burst(this.cx, this.y + this.h, 8, '#ff8a2a', 'spark'); }
  }
  hit(kind, src) {
    if (this.dead) return false;
    if (kind === 'stomp') return this.stomp(src);
    this.knockOff(src && src.vx ? sign(src.vx) : (src && src.x < this.x ? 1 : -1));
    return true;
  }
  stomp(p) {
    this.dead = true; this.flatT = 0.5; this.vx = 0;
    Sound.play('stomp');
    this.g.burst(this.cx, this.y + this.h, 8, '#ffffff', 'dust');
    return true;
  }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
}

class Glump extends Walker {
  constructor(g, s) { super(g, s, 24, 24, 1.6); this.col = g.tint('glump'); }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    if (this.dead) { this.flatT -= dt; if (this.flatT <= 0) this.remove = true; return; }
    this.walk(dt);
  }
  draw(ctx) {
    if (this.knocked) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(Math.PI); Sprites.glump(ctx, 0, this.h / 2, this.t, this.col, this.dir, 0, false); ctx.restore(); return; }
    Sprites.glump(ctx, this.cx, this.y + this.h, this.t, this.col, this.dir, Math.sin(this.t * 10) * 0.5, this.dead);
  }
}

class Rollo extends Walker {
  constructor(g, s) { super(g, s, 24, 28, 1.4); this.col = g.tint('rollo'); this.edgeTurn = true; this.state = 'walk'; this.shellT = 0; this.spin = 0; this.kickGrace = 0; }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    if (this.kickGrace > 0) this.kickGrace -= dt;
    if (this.state === 'shell') {
      this.shellT += dt;
      if (this.shellT > 6) { this.state = 'walk'; this.h = 28; this.y -= 4; this.vx = this.dir * this.speed; this.edgeTurn = true; }
    }
    if (this.state === 'slide') {
      this.spin += dt * sign(this.vx) * 14;
      // knock out enemies in the way
      for (const e of this.g.entities) {
        if (e === this || !e.enemy || e.dead || e.boss) continue;
        if (overlap(this, e)) { e.hit('shell', this); this.g.chainScore(this); }
      }
      // break bricks it slams into
      if (this.hitWallTile) {
        const ht = this.hitWallTile; this.hitWallTile = null;
        this.g.bumpBlock(ht.tx, ht.ty, true, this);
      }
    }
    this.walk(dt);
    if (this.state === 'slide' && this.hitWall) {
      const tx = Math.floor((this.vx < 0 ? this.x + this.w + 2 : this.x - 2) / TS), ty = Math.floor(this.cy / TS);
      const t = tileAt(this.g.area, tx, ty);
      if (t === T.BRICK || t === T.QBLOCK || t === T.QBRICK) this.g.bumpBlock(tx, ty, true, this);
      if (this.g.onScreen(this)) Sound.play('bump', { vol: 0.5 });
    }
    if (this.state === 'shell') this.vx = 0;
  }
  stomp(p) {
    Sound.play('stomp');
    if (this.state === 'walk') {
      this.state = 'shell'; this.shellT = 0; this.vx = 0; this.y += 4; this.h = 24; this.edgeTurn = false;
      return true;
    }
    if (this.state === 'slide') { this.state = 'shell'; this.shellT = 0; this.vx = 0; return true; }
    // stomping a resting shell kicks it
    this.kick(p.cx < this.cx ? 1 : -1);
    return true;
  }
  kick(dir) {
    this.state = 'slide'; this.vx = dir * 9.5 * TS; this.kickGrace = 0.25; this.edgeTurn = false; this.g.chain = 0;
    Sound.play('kick');
    this.g.burst(this.cx, this.y + this.h, 6, '#ffffff', 'dust');
  }
  touchPlayer(p) {
    if (this.dead) return;
    if (this.state === 'shell') { this.kick(p.cx < this.cx ? 1 : -1); return; }
    if (this.state === 'slide' && this.kickGrace > 0) return;
    p.hurt(this);
  }
  draw(ctx) {
    if (this.knocked) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(Math.PI); Sprites.rollo(ctx, 0, this.h / 2, this.t, this.col, this.dir, true, 0); ctx.restore(); return; }
    let shake = 0;
    if (this.state === 'shell' && this.shellT > 4.5) shake = Math.sin(this.t * 40) * 1.5;
    Sprites.rollo(ctx, this.cx + shake, this.y + this.h, this.t, this.col, this.dir, this.state !== 'walk', this.spin);
  }
}

class Spiker extends Walker {
  constructor(g, s) { super(g, s, 24, 22, 1.2); this.col = g.tint('spiker'); this.edgeTurn = !!s.edgeTurn; }
  update(dt) { this.t += dt; if (this.knocked) return this.updateKnocked(dt); this.walk(dt); }
  stomp(p) { return false; }
  hit(kind, src) { if (kind === 'stomp') return false; return super.hit(kind, src); }
  draw(ctx) {
    if (this.knocked) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(Math.PI); Sprites.spiker(ctx, 0, this.h / 2, this.t, this.col, this.dir); ctx.restore(); return; }
    Sprites.spiker(ctx, this.cx, this.y + this.h, this.t, this.col, this.dir);
  }
}

class Hopper extends Walker {
  constructor(g, s) { super(g, s, 22, 22, 1.0); this.col = g.tint('hopper'); this.jt = 1 + Math.random(); }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    if (this.dead) { this.flatT -= dt; if (this.flatT <= 0) this.remove = true; return; }
    if (this.onGround) {
      this.vx = 0;
      this.jt -= dt;
      if (this.jt <= 0) {
        const p = this.g.player;
        const d = p ? sign(p.cx - this.cx) || this.dir : this.dir;
        this.dir = d; this.vy = -13 * TS; this.vx = d * 2.6 * TS; this.jt = 1.1 + Math.random() * 0.9; this.onGround = false;
      }
    }
    const vx = this.vx;
    this.walk(dt);
    if (!this.onGround && this.hitWall) this.vx = -vx;
  }
  draw(ctx) {
    if (this.knocked) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(Math.PI); Sprites.hopper(ctx, 0, this.h / 2, this.t, this.col, this.dir, false); ctx.restore(); return; }
    if (this.dead) { ctx.save(); ctx.translate(this.cx, this.y + this.h); ctx.scale(1.3, 0.35); Sprites.hopper(ctx, 0, 0, this.t, this.col, this.dir, false); ctx.restore(); return; }
    Sprites.hopper(ctx, this.cx, this.y + this.h, this.t, this.col, this.dir, !this.onGround);
  }
}

/* ---------------- flyers & floaters ---------------- */
class Flapper extends Ent {
  constructor(g, s) {
    super(g, s, 24, 18); this.enemy = true; this.col = g.tint('flapper');
    this.hx = this.x; this.hy = this.y; this.range = (2 + Math.random() * 2) * TS; this.state = 'patrol'; this.cool = 2;
    this.swoops = g.level.d > 0.3;
  }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    const p = this.g.player;
    if (this.state === 'patrol') {
      const nx = this.hx + Math.sin(this.t * 0.9) * this.range;
      this.dir = sign(nx - this.x) || this.dir;
      this.x = nx; this.y = this.hy + Math.sin(this.t * 2.6) * 10;
      this.cool -= dt;
      if (this.swoops && this.cool <= 0 && p && !p.dead && Math.abs(p.cx - this.cx) < 5 * TS && p.y > this.y + TS && p.y < this.y + 7 * TS) {
        this.state = 'swoop'; this.sx = this.x; this.sy = this.y; this.tx = p.cx - this.w / 2; this.ty = p.y; this.st = 0;
      }
    } else if (this.state === 'swoop') {
      this.st += dt * 0.9;
      const k = Math.min(1, this.st);
      // dive along an arc down to the player's old position and back up
      this.x = lerp(this.sx, this.tx + (this.tx - this.sx), k);
      this.y = this.sy + Math.sin(k * Math.PI) * (this.ty - this.sy);
      this.dir = sign(this.tx - this.sx) || this.dir;
      if (k >= 1) { this.state = 'patrol'; this.hx = this.x - Math.sin(this.t * 0.9) * this.range; this.hy = this.y; this.cool = 2.5; }
    }
  }
  hit(kind, src) {
    if (this.dead) return false;
    if (kind === 'stomp') { this.knockOff(0); Sound.play('stomp'); return true; }
    this.knockOff(src && src.vx ? sign(src.vx) : 1); return true;
  }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) {
    if (this.knocked) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(this.spin || 0); Sprites.flapper(ctx, 0, 10, this.t, this.col, this.dir); ctx.restore(); return; }
    Sprites.flapper(ctx, this.cx, this.y + this.h, this.t, this.col, this.dir);
  }
}

class Wisp extends Ent {
  constructor(g, s) { super(g, s, 22, 26); this.enemy = true; this.col = g.tint('flapper') ; this.col = '#c8a8ff'; this.hx = this.x; this.hy = this.y; }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    const p = this.g.player;
    if (p && !p.dead && Math.abs(p.cx - this.cx) < 8 * TS && Math.abs(p.cy - this.cy) < 6 * TS) {
      const dx = p.cx - this.cx, dy = p.cy - this.cy, d = Math.hypot(dx, dy) || 1;
      const sp = 1.3 * TS;
      this.x += dx / d * sp * dt; this.y += dy / d * sp * dt + Math.sin(this.t * 3) * 0.3;
    } else {
      this.x += (this.hx - this.x) * dt * 0.5; this.y += (this.hy + Math.sin(this.t * 2) * 12 - this.y) * dt;
    }
  }
  hit(kind, src) { if (this.dead || kind === 'stomp') return false; this.knockOff(1); return true; }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) { Sprites.wisp(ctx, this.cx, this.cy, this.t, this.col); }
  get light() { return { r: 70, c: 'rgba(200,170,255,' }; }
}

class Jelly extends Ent {
  constructor(g, s) { super(g, s, 22, 24); this.enemy = true; this.hy = this.y; this.range = (s.range || 3) * TS; this.col = ['#ff7ad8', '#7ad8ff', '#c87aff'][Math.floor(Math.random() * 3)]; }
  update(dt) { this.t += dt; if (this.knocked) return this.updateKnocked(dt); this.y = this.hy + Math.sin(this.t * 1.1) * this.range * 0.5; }
  hit(kind, src) { if (this.dead || kind === 'stomp') return false; this.knockOff(1); return true; }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) { Sprites.jelly(ctx, this.cx, this.y + 10, this.t, this.col); }
}

class Snapper extends Ent {
  constructor(g, s) { super(g, s, 28, 18); this.enemy = true; this.col = '#ff8a5a'; this.hx = this.x; this.vx = -1.6 * TS; }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    const p = this.g.player;
    if (p && !p.dead && Math.abs(p.cx - this.cx) < 5 * TS && Math.abs(p.cy - this.cy) < 3 * TS) {
      const dx = p.cx - this.cx, dy = p.cy - this.cy, d = Math.hypot(dx, dy) || 1;
      this.vx = approach(this.vx, dx / d * 2.4 * TS, 4 * TS * dt);
      this.vy = approach(this.vy, dy / d * 1.6 * TS, 4 * TS * dt);
    } else {
      if (Math.abs(this.x - this.hx) > 4 * TS) this.vx = -sign(this.x - this.hx) * 1.6 * TS;
      this.vy = approach(this.vy, 0, 2 * TS * dt);
    }
    moveBody(this, this.g.area, dt, { semis: false });
    if (this.hitWall) this.vx = -this.vx;
    if (this.vx) this.dir = sign(this.vx);
  }
  hit(kind, src) { if (this.dead || kind === 'stomp') return false; this.knockOff(1); return true; }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) { Sprites.snapper(ctx, this.cx, this.cy, this.t, this.col, this.dir); }
}

/* ---------------- turrets & projectiles ---------------- */
class Boomer extends Ent {
  constructor(g, s) { super(g, s, 26, 30); this.enemy = true; this.col = g.tint('glump'); this.cool = 1.5 + Math.random(); this.pulse = 0; }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    const p = this.g.player;
    this.pulse = Math.max(0, this.pulse - dt * 3);
    if (!p || p.dead) return;
    this.dir = p.cx < this.cx ? -1 : 1;
    const dx = Math.abs(p.cx - this.cx);
    this.cool -= dt;
    if (this.cool <= 0 && dx < 13 * TS && dx > 2 * TS && this.g.onScreen(this, 40)) {
      this.cool = 2.8 - this.g.level.d * 0.8;
      this.pulse = 1;
      const bb = new BassBall(this.g, this.cx + this.dir * 14, this.y + 12, this.dir, '#ff4fa8');
      bb.kind = enemyLook('boomer') === 'slot' ? 'coin' : 'heart';
      this.g.spawn(bb);
      Sound.play('fire', { vol: 0.6 });
    }
  }
  hit(kind, src) {
    if (this.dead) return false;
    if (kind === 'stomp') { this.knockOff(0); Sound.play('stomp'); return true; }
    this.knockOff(src && src.vx ? sign(src.vx) : 1); return true;
  }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) {
    if (this.knocked) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(this.spin || 0); Sprites.boomer(ctx, 0, 15, this.t, this.col, this.dir, 0); ctx.restore(); return; }
    Sprites.boomer(ctx, this.cx, this.y + this.h, this.t, this.col, this.dir, this.pulse);
  }
}

class BassBall extends Ent {
  constructor(g, x, y, dir, col) { super(g, null, 18, 18); this.x = x - 9; this.y = y - 9; this.vx = dir * 4.6 * TS; this.dir = dir; this.enemy = true; this.col = col || '#ff4fd8'; this.life = 6; }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    this.x += this.vx * dt;
    this.life -= dt;
    if (this.life <= 0 || !this.g.onScreen(this, 300)) this.remove = true;
    const tx = Math.floor((this.vx > 0 ? this.x + this.w : this.x) / TS), ty = Math.floor(this.cy / TS);
    if (SOLID[tileAt(this.g.area, tx, ty)]) { this.remove = true; this.g.burst(this.cx, this.cy, 8, this.col, 'spark'); }
  }
  hit(kind, src) { if (this.dead) return false; if (kind === 'stomp') Sound.play('stomp'); this.knockOff(0); this.vx = 0; return true; }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) { Sprites.bassball(ctx, this.cx, this.cy, this.t, this.dir, this.col, this.kind); }
}

class Leaper extends Ent {
  constructor(g, s) {
    super(g, s, 20, 24); this.enemy = true; this.lava = s.lava !== false; this.homeY = this.y; this.wait = 1 + Math.random() * 1.5; this.vy = 0; this.state = 'wait';
  }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    if (this.state === 'wait') { this.wait -= dt; if (this.wait <= 0) { this.state = 'jump'; this.vy = -16.5 * TS; } return; }
    this.vy += PHYS.gDown * 0.55 * dt;
    this.y += this.vy * dt;
    if (this.vy > 0 && this.y >= this.homeY) {
      this.y = this.homeY; this.state = 'wait'; this.wait = 1.4 + Math.random();
      if (this.g.onScreen(this)) { Sound.play('splash', { vol: 0.4 }); this.g.burst(this.cx, this.y, 8, this.lava ? '#ff8a2a' : '#8ad8ff', 'spark'); }
    }
  }
  hit(kind, src) { if (this.dead || kind === 'stomp') return false; this.knockOff(1); return true; }
  touchPlayer(p) { if (!this.dead && this.state !== 'wait') p.hurt(this); }
  draw(ctx) { if (this.state === 'wait') return; Sprites.leaper(ctx, this.cx, this.cy, this.t, this.lava, this.vy < 0 ? 1 : -1); }
  get light() { return this.lava && this.state !== 'wait' ? { r: 80, c: 'rgba(255,140,40,' } : null; }
}

/* ---------------- hazards ---------------- */
class Slab extends Ent {
  constructor(g, s) { super(g, s, 56, 56); this.x = s.x - TS; this.y = s.y - 64; this.homeY = this.y; this.state = 'idle'; this.timer = 0; this.solidTop = true; this.dx = 0; this.dy = 0; this.enemy = false; }
  update(dt) {
    this.t += dt;
    const p = this.g.player;
    const oy = this.y;
    if (this.state === 'idle') {
      if (p && !p.dead && p.y > this.y + this.h - 4 && Math.abs(p.cx - this.cx) < 1.7 * TS) { this.state = 'shake'; this.timer = 0.3; }
    } else if (this.state === 'shake') {
      this.timer -= dt; if (this.timer <= 0) { this.state = 'fall'; this.vy = 0; }
    } else if (this.state === 'fall') {
      this.vy = Math.min(this.vy + 90 * TS * dt, 24 * TS);
      const probe = { x: this.x + 2, y: this.y, w: this.w - 4, h: this.h, vx: 0, vy: this.vy };
      moveBody(probe, this.g.area, dt, { semis: false });
      this.y = probe.y;
      if (probe.onGround) { this.state = 'land'; this.timer = 1.0; if (this.g.onScreen(this)) { this.g.shake(6); Sound.play('bump'); this.g.burst(this.cx, this.y + this.h, 14, '#c8c8d0', 'dust'); } }
      if (this.y > this.g.area.H * TS) { this.y = this.homeY; this.state = 'idle'; }
    } else if (this.state === 'land') {
      this.timer -= dt; if (this.timer <= 0) this.state = 'rise';
    } else if (this.state === 'rise') {
      this.y -= 2.4 * TS * dt; if (this.y <= this.homeY) { this.y = this.homeY; this.state = 'idle'; }
    }
    this.dy = this.y - oy; this.dx = 0;
  }
  touchPlayer(p) {
    // standing on top is safe; otherwise falling slabs crush, resting ones push
    if (p.y + p.h <= this.y + 6 && p.vy >= 0) return;
    if (this.state === 'fall' && p.y + p.h > this.y + this.h - 18) { p.hurt(this); return; }
    if (p.cx < this.cx) p.x = this.x - p.w; else p.x = this.x + this.w;
  }
  draw(ctx) {
    const sx = this.state === 'shake' ? Math.sin(this.t * 60) * 2 : 0;
    // chain to ceiling
    ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 2;
    for (let yy = this.homeY - 200; yy < this.y; yy += 10) { ctx.beginPath(); ctx.ellipse(this.cx, yy, 2.5, 4, 0, 0, TAU); ctx.stroke(); }
    Sprites.slab(ctx, this.x + sx, this.y, this.w, this.h, this.t, this.state === 'fall' || this.state === 'shake' || this.state === 'land', this.g.area.theme);
  }
}

class Icicle extends Ent {
  constructor(g, s) { super(g, s, 14, 26); this.x = s.x - 7; this.y = s.y - TS; this.state = 'hang'; this.timer = 0; this.enemy = false; }
  update(dt) {
    this.t += dt;
    const p = this.g.player;
    if (this.state === 'hang') {
      if (p && !p.dead && Math.abs(p.cx - this.cx) < 1.3 * TS && p.y > this.y) { this.state = 'shake'; this.timer = 0.35; if (this.g.onScreen(this)) Sound.play('crumble', { vol: 0.5 }); }
    } else if (this.state === 'shake') {
      this.timer -= dt; if (this.timer <= 0) { this.state = 'fall'; this.vy = 0; }
    } else if (this.state === 'fall') {
      this.vy = Math.min(this.vy + 60 * TS * dt, 20 * TS);
      moveBody(this, this.g.area, dt, { semis: false });
      if (this.onGround || this.y > this.g.area.H * TS) {
        this.remove = true; this.g.burst(this.cx, this.y + this.h, 12, '#c8f0ff', 'debris');
        if (this.g.onScreen(this)) Sound.play('break', { vol: 0.5 });
      }
    }
  }
  touchPlayer(p) { if (this.state === 'fall') p.hurt(this); }
  draw(ctx) { Sprites.icicle(ctx, this.cx, this.y, this.state === 'shake'); }
}

class EmberChain extends Ent {
  constructor(g, s) {
    super(g, s, 2, 2);
    this.ox = s.x; this.oy = s.y - TS / 2; this.len = s.len || 4; this.speed = s.speed || 1.8; this.a = Math.random() * TAU;
    this.x = this.ox - this.len * 14; this.y = this.oy - this.len * 14; this.w = this.len * 28; this.h = this.len * 28;
  }
  update(dt) { this.t += dt; this.a += this.speed * dt; }
  orbs() { const r = []; for (let i = 0; i <= this.len; i++) r.push([this.ox + Math.cos(this.a) * i * 14, this.oy + Math.sin(this.a) * i * 14]); return r; }
  touchPlayer(p) {
    for (const [x, y] of this.orbs()) {
      const nx = clamp(x, p.x, p.x + p.w), ny = clamp(y, p.y, p.y + p.h);
      if ((nx - x) ** 2 + (ny - y) ** 2 < 7 * 7) { p.hurt(this); return; }
    }
  }
  draw(ctx) { for (const [x, y] of this.orbs()) Sprites.ember(ctx, x, y, 6, this.t); }
  get light() { return { r: 70, c: 'rgba(255,150,50,', x: this.ox, y: this.oy }; }
}

class Bolt extends Ent {
  // a flame-cannon art piece: pilot light, then a column of fire
  constructor(g, s) { super(g, s, 24, 2); this.period = s.period || 3; this.phase = s.phase || 0; this.groundY = s.y; this.x = s.x - 12; this.y = s.y - 5 * TS; this.h = 5 * TS - 10; this.stage = 'idle'; this.flash = 0; }
  update(dt) {
    this.t += dt;
    const k = ((this.t + this.phase) % this.period);
    const old = this.stage;
    this.stage = k < this.period - 1.1 ? 'idle' : k < this.period - 0.25 ? 'warn' : 'strike';
    if (this.stage === 'strike' && old !== 'strike' && this.g.onScreen(this, 100)) { Sound.play('flame', { vol: 0.7 }); this.g.shake(3); this.g.burst(this.cx, this.groundY - 4 * TS, 16, '#ffb84a', 'spark'); }
  }
  touchPlayer(p) { if (this.stage === 'strike') p.hurt(this); }
  draw(ctx) {
    const x = this.cx, gy = this.groundY;
    // the cannon: a dark steel nozzle on a little base
    ctx.fillStyle = '#2a2a32'; rr(ctx, x - 12, gy - 8, 24, 8, 2); ctx.fill();
    ctx.fillStyle = '#4a4a56'; ctx.fillRect(x - 5, gy - 22, 10, 14);
    ctx.fillStyle = '#6a6a76'; ctx.fillRect(x - 7, gy - 24, 14, 4);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (this.stage === 'warn') {
      const a = 0.5 + 0.5 * Math.sin(this.t * 40);
      ctx.fillStyle = `rgba(80,160,255,${0.6 * a})`; ctx.beginPath(); ctx.ellipse(x, gy - 27, 3, 5, 0, 0, TAU); ctx.fill();
      const hg = ctx.createRadialGradient(x, gy - 26, 1, x, gy - 26, 24); hg.addColorStop(0, `rgba(255,140,40,${0.3 * a})`); hg.addColorStop(1, 'rgba(255,140,40,0)');
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(x, gy - 26, 24, 0, TAU); ctx.fill();
    } else if (this.stage === 'strike') {
      const top = this.y;
      for (let i = 0; i < 6; i++) {
        const w = 16 - i * 2, fl = Math.sin(this.t * 30 + i) * 4;
        const g = ctx.createLinearGradient(0, gy - 24, 0, top - 10);
        g.addColorStop(0, 'rgba(255,250,220,0.9)'); g.addColorStop(0.35, 'rgba(255,180,60,0.75)'); g.addColorStop(1, 'rgba(255,60,10,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, gy - 24); ctx.quadraticCurveTo(x - w + fl, (gy + top) / 2, x + fl * 0.5, top - 14 - i * 4); ctx.quadraticCurveTo(x + w - fl, (gy + top) / 2, x + w / 2, gy - 24); ctx.fill();
      }
    }
    ctx.restore();
  }
  get light() { return this.stage === 'strike' ? { r: 150, c: 'rgba(255,160,60,', col: '#ff8a2a', x: this.cx, y: this.groundY - 70 } : this.stage === 'warn' ? { r: 40, col: '#5aa0ff', x: this.cx, y: this.groundY - 26 } : null; }
}

/* ---------------- platforms ---------------- */
class MovingPlatform extends Ent {
  constructor(g, s) {
    super(g, s, (s.pw || 3) * TS, 14);
    this.x = s.x - TS / 2; this.y = s.y; this.hx = this.x; this.hy = this.y;
    this.ax = s.ax || 0; this.ay = s.ay || 0; this.speed = (s.speed || 2) * TS;
    const dist = Math.hypot(this.ax, this.ay) || 1;
    this.period = dist / this.speed * 2 + 1.0;
    this.t = 0; this.dx = 0; this.dy = 0; this.isPlatform = true;
  }
  update(dt) {
    this.t += dt;
    const k = 0.5 - 0.5 * Math.cos(this.t / this.period * TAU);
    const nx = this.hx + this.ax * k, ny = this.hy + this.ay * k;
    this.dx = nx - this.x; this.dy = ny - this.y; this.x = nx; this.y = ny;
  }
  draw(ctx) { Sprites.platform(ctx, this.x, this.y, this.w, THEMES[this.g.area.theme], 'move', this.t); }
}
class FallingPlatform extends Ent {
  constructor(g, s) {
    super(g, s, (s.pw || 2) * TS, 14);
    this.x = s.x - TS; this.y = s.y; this.hx = this.x; this.hy = this.y; this.state = 'idle'; this.timer = 0; this.dx = 0; this.dy = 0; this.isPlatform = true;
  }
  update(dt) {
    this.t += dt;
    const oy = this.y;
    const p = this.g.player;
    if (this.state === 'idle' && p && p.ride === this) { this.state = 'shake'; this.timer = 0.4; }
    if (this.state === 'shake') { this.timer -= dt; if (this.timer <= 0) { this.state = 'fall'; this.vy = 0; Sound.play('crumble', { vol: 0.5 }); } }
    if (this.state === 'fall') {
      this.vy = Math.min((this.vy || 0) + 40 * TS * dt, 16 * TS); this.y += this.vy * dt;
      if (this.y > this.hy + 22 * TS) { this.state = 'gone'; this.timer = 2.5; this.dead = true; }
    }
    if (this.state === 'gone') { this.timer -= dt; if (this.timer <= 0) { this.state = 'idle'; this.y = this.hy; this.dead = false; this.respawnT = 0.4; } }
    if (this.respawnT > 0) this.respawnT -= dt;
    this.dy = this.y - oy; this.dx = 0;
  }
  draw(ctx) {
    if (this.state === 'gone') return;
    const sx = this.state === 'shake' ? Math.sin(this.t * 70) * 1.5 : 0;
    ctx.save(); if (this.respawnT > 0) ctx.globalAlpha = 1 - this.respawnT / 0.4;
    Sprites.platform(ctx, this.x + sx, this.y, this.w, THEMES[this.g.area.theme], 'fall', this.t); ctx.restore();
  }
}

/* ---------------- items ---------------- */
class Item extends Ent {
  constructor(g, x, y, kind) {
    super(g, null, 24, 24); this.x = x - 12; this.y = y; this.kind = kind; this.emerge = 0.5; this.baseY = y; this.vx = 0;
    if (kind === 'coffee' || kind === 'cassette') this.speedX = 2.4 * TS;
    if (kind === 'eclipse') this.speedX = 3.6 * TS;
    if (kind === 'bufo') this.speedX = 2.0 * TS;
    this.item = true;
  }
  update(dt) {
    this.t += dt;
    if (this.emerge > 0) { this.emerge -= dt; this.y = this.baseY - (1 - Math.max(0, this.emerge) / 0.5) * TS; if (this.emerge <= 0) { this.vx = this.speedX ? (this.g.player && this.g.player.cx > this.cx ? -1 : 1) * this.speedX : 0; } return; }
    if (this.kind === 'vinyl' || this.kind === 'joint') { if (this.kind === 'joint') this.y = this.baseY - TS + Math.sin(this.t * 2) * 4; return; }
    this.vy += PHYS.gDown * 0.8 * dt; if (this.vy > 14 * TS) this.vy = 14 * TS;
    const vx = this.vx;
    moveBody(this, this.g.area, dt, { semis: true, platforms: this.g.platforms });
    if (this.hitWall) this.vx = -vx;
    if (this.kind === 'eclipse' && this.onGround) this.vy = -11 * TS;
    if (this.kind === 'bufo' && this.onGround) { this.vy = -8 * TS; if (this.g.onScreen(this) && Math.random() < 0.3) Sound.play('toad', { vol: 0.4 }); }
    if (this.y > this.g.area.H * TS + 50) this.remove = true;
  }
  touchPlayer(p) {
    if (this.emerge > 0.25) return;
    this.remove = true;
    p.collect(this.kind, this);
  }
  bounceFromBelow() { if (this.emerge <= 0) { this.vy = -9 * TS; if (this.vx) this.vx = sign(this.vx) * Math.abs(this.vx); } }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h;
    ctx.save();
    if (this.emerge > 0) { ctx.beginPath(); ctx.rect(this.x - 10, this.baseY - TS * 2, this.w + 20, TS * 2); ctx.clip(); }
    if (this.kind === 'coffee') Sprites.coffee(ctx, x, y, this.t);
    else if (this.kind === 'vinyl') Sprites.bottle(ctx, x, y + Math.sin(this.t * 3) * 1.5, this.t);
    else if (this.kind === 'bufo') Sprites.bufo(ctx, x, y, this.t, !this.onGround);
    else if (this.kind === 'joint') Sprites.joint(ctx, x, y, this.t);
    else if (this.kind === 'eclipse') Sprites.eclipse(ctx, x, this.cy, this.t);
    else if (this.kind === 'cassette') Sprites.cassette(ctx, x, y, this.t);
    ctx.restore();
  }
  get light() { return { r: 50, c: 'rgba(255,220,150,' }; }
}

class PickPop extends Ent {
  constructor(g, x, y) { super(g, null, 16, 16); this.x = x - 8; this.y = y; this.vy = -11 * TS; this.life = 0.5; }
  update(dt) { this.t += dt; this.vy += PHYS.gDown * 0.6 * dt; this.y += this.vy * dt; this.life -= dt; if (this.life <= 0) { this.remove = true; this.g.burst(this.cx, this.cy, 5, '#ffd84a', 'spark'); } }
  draw(ctx) { Sprites.pick(ctx, this.cx, this.cy, this.t, Math.cos(this.t * 22)); }
}

class Gold extends Ent {
  constructor(g, s) { super(g, s, 28, 28); this.y = s.y - 16 - 14; this.idx = s.idx; this.had = g.goldHad(this.idx); }
  update(dt) { this.t += dt; }
  touchPlayer(p) { this.remove = true; p.collect('gold', this); }
  draw(ctx) { Sprites.goldRecord(ctx, this.cx, this.cy + Math.sin(this.t * 2) * 3, this.t, this.had); }
  get light() { return { r: 60, c: 'rgba(255,220,100,' }; }
}

class Spring extends Ent {
  constructor(g, s) { super(g, s, 28, 24); this.comp = 0; this.solidTop = true; this.dx = 0; this.dy = 0; }
  update(dt) { this.t += dt; this.comp = Math.max(0, this.comp - dt * 4); }
  touchPlayer(p) {
    if (p.vy >= 0 && p.y + p.h <= this.y + 14) {
      p.y = this.y + 8 - p.h;
      p.vy = -(Input.jump || p.inp.jump ? PHYS.springV : PHYS.springVLow);
      p.jumping = true; p.onGround = false; p.coyote = 0; this.comp = 1; p.springT = 0.1;
      Sound.play('spring'); this.g.burst(this.cx, this.y + 4, 6, '#ff7ab0', 'spark');
    } else if (p.y + p.h > this.y + 10) {
      if (p.cx < this.cx) p.x = Math.min(p.x, this.x - p.w); else p.x = Math.max(p.x, this.x + this.w);
    }
  }
  draw(ctx) { Sprites.spring(ctx, this.cx, this.y + this.h, this.comp); }
}

class Checkpoint extends Ent {
  constructor(g, s) { super(g, s, 30, 70); this.active = false; }
  update(dt) { this.t += dt; }
  touchPlayer(p) {
    if (this.active) return;
    this.active = true;
    this.g.setCheckpoint(this.cx, this.y + this.h);
    Sound.play('checkpoint');
    this.g.burst(this.cx, this.y + 6, 20, '#ff4fd8', 'confetti');
    if (p.power === 0) p.setPower(1, true);
  }
  draw(ctx) { Sprites.checkpoint(ctx, this.cx, this.y + this.h, this.active || this.g.checkpointReached(this), this.t); }
}

class Gate extends Ent {
  constructor(g, s) { super(g, s, 40, 140); this.secret = !!s.secret; this.secretWorld = s.secretWorld; this.used = false; }
  update(dt) { this.t += dt; }
  touchPlayer(p) {
    if (this.used || p.dead) return;
    this.used = true;
    this.g.levelClear(this);
  }
  draw(ctx) { Sprites.gate(ctx, this.cx, this.y + this.h, this.t, this.used, this.secret); }
  get light() { return { r: 120, c: this.secret ? 'rgba(0,255,154,' : 'rgba(255,90,220,', x: this.cx, y: this.y + 40 }; }
}

class Portal extends Ent {
  constructor(g, s) { super(g, s, 28, 52); this.kind = s.kind || 'normal'; this.target = s.target; this.warpWorld = s.warpWorld; this.near = false; }
  update(dt) { this.t += dt; this.near = false; }
  touchPlayer(p) {
    this.near = true;
    if (p.dead || p.state !== 'play') return;
    if (Input.upPressed || Input.downPressed || (Input.up && p.onGround)) this.g.enterPortal(this);
  }
  draw(ctx) {
    Sprites.portal(ctx, this.cx, this.y + 22, this.t, this.kind);
    if (this.near) {
      const b = Math.sin(this.t * 6) * 3;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath(); ctx.moveTo(this.cx, this.y - 22 + b); ctx.lineTo(this.cx + 8, this.y - 12 + b); ctx.lineTo(this.cx - 8, this.y - 12 + b); ctx.fill();
      ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('UP', this.cx, this.y - 28 + b);
    }
    if (this.warpWorld) {
      ctx.fillStyle = '#ffd84a'; ctx.font = `13px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(WORLDS[this.warpWorld].label || String(this.warpWorld), this.cx, this.y - 40);
    }
  }
  get light() { return { r: 90, c: this.kind === 'glitch' ? 'rgba(0,255,154,' : 'rgba(180,120,255,' }; }
}

class Sign extends Ent {
  constructor(g, s) { super(g, s, 26, 36); this.text = s.text || ''; this.hidden = !!s.hidden; this.show = 0; }
  update(dt) { this.t += dt; this.show = Math.max(0, this.show - dt * 3); }
  touchPlayer(p) { this.show = Math.min(1, this.show + 0.2); if (!this.read) { this.read = true; } }
  draw(ctx) { if (!this.hidden) Sprites.sign(ctx, this.cx, this.y + this.h, this.t); }
  drawBubble(ctx) {
    if (this.show <= 0.05) return;
    ctx.save(); ctx.globalAlpha = Math.min(1, this.show * 1.5);
    ctx.font = `11px ${FONT_UI}`;
    const words = this.text.split(' '); const lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > 170) { lines.push(line); line = w; } else line = t; }
    lines.push(line);
    const bw = 190, bh = lines.length * 14 + 14, bx = this.cx - bw / 2, by = this.y - bh - 20;
    ctx.fillStyle = 'rgba(12,10,20,0.88)'; rr(ctx, bx, by, bw, bh, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(this.cx - 6, by + bh); ctx.lineTo(this.cx, by + bh + 8); ctx.lineTo(this.cx + 6, by + bh); ctx.fillStyle = 'rgba(12,10,20,0.88)'; ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, this.cx, by + 7 + i * 14));
    ctx.restore();
  }
}

/* ---------------- player projectile ---------------- */
class Disc extends Ent {
  constructor(g, x, y, dir) { super(g, null, 14, 14); this.x = x - 7; this.y = y - 7; this.vx = dir * 8.5 * TS; this.vy = 2 * TS; this.life = 2.4; this.dir = dir; this.friendly = true; }
  update(dt) {
    this.t += dt; this.life -= dt;
    this.vy += PHYS.gDown * 0.7 * dt;
    const vx = this.vx;
    moveBody(this, this.g.area, dt, { semis: true, platforms: this.g.platforms });
    if (this.onGround) { this.vy = -6.5 * TS; if (Math.random() < 0.4) this.g.burst(this.cx, this.y + this.h, 2, '#8ae84a', 'spark'); }
    if (this.hitWall || this.life <= 0 || this.y > this.g.area.H * TS || !this.g.onScreen(this, 60)) { this.pop(); return; }
    this.vx = vx;
    for (const e of this.g.entities) {
      if (!e.enemy || e.dead || e.remove) continue;
      if (overlap(this, e)) { if (e.hit('disc', this)) { this.g.addScore(100, e.cx, e.y); } this.pop(); return; }
    }
    if (this.g.boss && !this.g.boss.dead && overlap(this, this.g.boss)) { this.g.boss.hit('disc', this); this.pop(); }
  }
  pop() { this.remove = true; this.g.burst(this.cx, this.cy, 8, '#8ae84a', 'spark'); if (this.g.onScreen(this)) Sound.play('splat', { vol: 0.5 }); }
  draw(ctx) { Sprites.pukeball(ctx, this.cx, this.cy, this.t, 7); }
}

/* ---------------- boss ---------------- */
class Boss extends Ent {
  constructor(g, s) {
    const style = (typeof BOSS_STYLE !== 'undefined' && BOSS_STYLE[s.world]) || 'raccoon';
    const hush = !!(typeof BOSS_FLOATERS !== 'undefined' && BOSS_FLOATERS[style]);
    super(g, s, hush ? 64 : 72, hush ? 100 : 70);
    this.style = style;
    this.world = s.world; this.boss = true; this.enemy = true;
    this.arenaX0 = s.arenaX0 * TS; this.arenaX1 = s.doorX * TS; this.doorX = s.doorX;
    const tier = s.world <= 12 ? s.world : s.world <= 38 ? (s.world - 30) * 1.25 : s.world <= 49 ? (s.world - 40) * 1.4 : 10;
    this.tier = tier;
    this.maxHp = style === 'buzzkill' ? (s.world === 10 ? 9 : 7) : hush ? 6 : clamp(3 + Math.floor(tier / 3), 3, 6);
    if (s.world === 11 || s.world === 12 || s.world === 22) this.maxHp = 6;
    this.hp = this.maxHp; this.state = 'sleep'; this.timer = 0; this.hurtT = 0; this.dir = -1; this.squash = 0; this.hush = hush;
    this.name = typeof bossName === 'function' ? bossName(s.world).toUpperCase() : 'BOSS';
    this.homeY = this.y;
  }
  get aggression() { return 1 + (1 - this.hp / this.maxHp) * 0.8 + Math.min(this.tier || 1, 10) * 0.04; }
  shotKind() { return { hardhat: 'cone', dj: 'wave', buzzkill: 'skeeter', cart: 'coin', raccoon: 'coin', tumbleweed: 'cone', geyser: 'wave', bouncer: 'heart', barista: 'wave', mutant: 'wave', pony: 'heart', archivist: 'wave', triplord: 'heart', witch: 'wave', guru: 'coin', dustdevil: 'cone' }[this.style] || 'heart'; }
  shotCol() { return { dj: '#38f2ff', geyser: '#8af0ff', witch: '#7affd8', buzzkill: '#ff3a5a', triplord: '#ff3ab8' }[this.style] || '#ff4fa8'; }
  update(dt) {
    this.t += dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    this.squash = approach(this.squash, 0, dt * 4);
    const p = this.g.player;
    if (this.state === 'sleep') {
      if (p && p.x > this.arenaX0 + TS) { this.state = 'intro'; this.timer = 1.6; this.g.bossStart(this); }
      if (!this.hush) this.fall(dt);
      return;
    }
    if (this.state === 'dying') {
      this.timer -= dt;
      if (Math.random() < 0.4) this.g.burst(this.x + Math.random() * this.w, this.y + Math.random() * this.h, 6, '#ffd84a', 'spark');
      if (this.timer <= 0) { this.remove = true; this.g.bossDefeated(this); }
      return;
    }
    if (this.state === 'intro') { this.timer -= dt; if (this.timer <= 0) { this.state = 'walk'; this.timer = 2; } if (!this.hush) this.fall(dt); return; }
    if (this.hush) return this.updateHush(dt);
    this.dir = p && p.cx < this.cx ? -1 : 1;
    this.timer -= dt * this.aggression;
    if (this.state === 'walk') {
      this.vx = this.dir * (1.5 + this.world * 0.08) * TS * this.aggression;
      if (this.timer <= 0) {
        const r = Math.random();
        if (r < 0.4) { this.state = 'jump'; this.vy = -16 * TS; this.vx = this.dir * 3.5 * TS; }
        else if (r < 0.75 && this.world >= 2) { this.state = 'shoot'; this.timer = 0.9; this.vx = 0; this.shots = this.world >= 6 ? 3 : 2; }
        else { this.state = 'charge'; this.timer = 0.45; this.vx = 0; }
      }
    } else if (this.state === 'jump') {
      if (this.onGround && this.vy >= 0) { this.state = 'walk'; this.timer = 1.4 + Math.random(); this.g.shake(5); Sound.play('bump'); this.squash = 1; this.g.burst(this.cx, this.y + this.h, 14, '#ffffff', 'dust'); this.shockwave(); }
    } else if (this.state === 'shoot') {
      if (this.timer <= 0) {
        { const bb = new BassBall(this.g, this.cx + this.dir * 30, this.y + 24 + (this.shots % 2) * 18, this.dir, this.shotCol()); bb.kind = this.shotKind(); this.g.spawn(bb); }
        Sound.play('fire'); this.shots--;
        this.timer = 0.4;
        if (this.shots <= 0) { this.state = 'walk'; this.timer = 1.6; }
      }
    } else if (this.state === 'charge') {
      if (this.timer > 0) this.vx = 0;
      else { this.vx = this.dir * 8 * TS; if (this.hitWall || this.timer < -1.0) { this.state = 'walk'; this.timer = 1.5; if (this.hitWall) { this.g.shake(5); Sound.play('bump'); } } }
    }
    this.fall(dt);
    this.x = clamp(this.x, this.arenaX0, this.arenaX1 - this.w);
  }
  shockwave() {
    if ((this.tier || 1) < 4) return;
    for (const d of [-1, 1]) { const b = new BassBall(this.g, this.cx + d * 40, this.y + this.h - 10, d, this.shotCol()); b.kind = 'wave'; b.vx *= 0.8; this.g.spawn(b); }
  }
  updateHush(dt) {
    // The Hush floats, teleports, rains silent notes and swoops low (vulnerable) between volleys
    const p = this.g.player;
    this.timer -= dt * this.aggression;
    this.dir = p && p.cx < this.cx ? -1 : 1;
    if (!this.mode) { this.mode = 'float'; this.timer = 2; }
    const groundY = this.homeY;
    if (this.mode === 'float') {
      this.y = approach(this.y, groundY - 4 * TS + Math.sin(this.t * 2) * 12, 6 * TS * dt);
      this.x += this.dir * 1.5 * TS * dt;
      if (this.timer <= 0) { this.mode = Math.random() < 0.5 ? 'volley' : 'teleport'; this.timer = 1.2; this.shots = 5; }
    } else if (this.mode === 'volley') {
      this.y = approach(this.y, groundY - 4 * TS, 6 * TS * dt);
      if (this.timer <= 0 && this.shots > 0) {
        this.shots--; this.timer = 0.28;
        const b = new BassBall(this.g, this.cx, this.y + 40, this.dir, this.shotCol()); b.kind = this.shotKind();
        const dx = p.cx - this.cx, dy = p.cy - (this.y + 40), d = Math.hypot(dx, dy) || 1;
        b.vx = dx / d * 5 * TS; b.vy = dy / d * 5 * TS; b.update = function (dt2) { this.t += dt2; if (this.knocked) return this.updateKnocked(dt2); this.x += this.vx * dt2; this.y += this.vy * dt2; this.life -= dt2; if (this.life <= 0) this.remove = true; };
        this.g.spawn(b); Sound.play('laser', { vol: 0.6 });
      }
      if (this.shots <= 0 && this.timer <= 0) { this.mode = 'swoop'; this.timer = 2.4; }
    } else if (this.mode === 'teleport') {
      this.alphaT = (this.alphaT || 0) + dt * 3;
      if (this.timer <= 0) {
        this.x = clamp(p.cx + (Math.random() < 0.5 ? -1 : 1) * 5 * TS - this.w / 2, this.arenaX0, this.arenaX1 - this.w);
        this.mode = 'swoop'; this.timer = 2.4; this.alphaT = 0; Sound.play('portal');
      }
    } else if (this.mode === 'swoop') {
      this.state = this.timer > 1.6 ? 'charge' : 'walk';
      this.y = approach(this.y, groundY - (this.timer > 0.6 ? 0 : 3 * TS), 7 * TS * dt);
      this.x += this.dir * 2.4 * TS * dt;
      if (this.timer <= 0) { this.mode = 'float'; this.timer = 2.2; }
    }
    this.x = clamp(this.x, this.arenaX0, this.arenaX1 - this.w);
  }
  fall(dt) {
    this.vy += PHYS.gDown * 0.8 * dt; if (this.vy > PHYS.maxFall) this.vy = PHYS.maxFall;
    moveBody(this, this.g.area, dt, { semis: false });
  }
  hit(kind, src) {
    if (this.state === 'sleep' || this.state === 'intro' || this.state === 'dying' || this.hurtT > 0) return false;
    if (kind === 'stomp') {
      if (this.hush && this.mode !== 'swoop') return false;
      this.damage(1);
      return true;
    }
    if (kind === 'disc') { this.damage(0.34); return true; }
    if (kind === 'star' || kind === 'shell') { this.damage(1); return true; }
    return false;
  }
  damage(n) {
    this.hp -= n; this.hurtT = n >= 1 ? 1.0 : 0.25; this.squash = 1;
    Sound.play('bossHit'); this.g.shake(6); this.g.burst(this.cx, this.cy, 16, '#ffffff', 'spark');
    if (this.hp <= 0.01) { this.state = 'dying'; this.timer = 1.6; this.vx = 0; Sound.play('bossDie'); this.g.shake(14); }
    else if (n >= 1 && !this.hush) { this.state = 'walk'; this.timer = 0.8; this.vx = -this.dir * 6 * TS; }
    if (this.style === 'buzzkill' && this.g.onScreen(this)) Sound.play('mosquito', { vol: 0.6 });
  }
  touchPlayer(p) {
    if (this.state === 'sleep' || this.state === 'dying' || this.state === 'intro') return;
    // stomp from above
    if (p.vy > 0 && p.prevBottom <= this.y + this.h * 0.35) {
      if (this.hit('stomp', p)) { p.vy = -PHYS.stompVHeld; p.jumping = true; this.g.addScore(1000, this.cx, this.y); return; }
    }
    if (this.hurtT > 0.5) return;
    p.hurt(this);
  }
  draw(ctx) {
    ctx.save();
    if (this.hush && this.mode === 'teleport') ctx.globalAlpha = Math.max(0.1, 1 - (this.alphaT || 0));
    if (this.state === 'dying') ctx.globalAlpha = Math.max(0, this.timer / 1.6);
    drawBoss(ctx, this, this.t);
    ctx.restore();
  }
  get light() { return { r: 150, c: 'rgba(200,160,255,' }; }
}

const ENTITY_TYPES = {
  glump: Glump, rollo: Rollo, spiker: Spiker, hopper: Hopper, flapper: Flapper, wisp: Wisp, jelly: Jelly, snapper: Snapper,
  boomer: Boomer, leaper: Leaper, slab: Slab, icicle: Icicle, emberchain: EmberChain, bolt: Bolt,
  mplat: MovingPlatform, fplat: FallingPlatform, gold: Gold, spring: Spring, checkpoint: Checkpoint, gate: Gate,
  portal: Portal, sign: Sign, boss: Boss
};
