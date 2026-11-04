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
  // Molly's love bomb (and Slothy's hug): a hostile burner becomes a dancing friend
  befriend() {
    if (this.dead || this.friendT) return false;
    this.friendT = 6; this.enemy = false; this.vx = 0;
    this.g.addScore(300, this.cx, this.y);
    this.g.burst(this.cx, this.cy, 14, '#ff9ad8', 'confetti');
    this.g.parts.text(this.cx, this.y - 6, '\u2665', '#ff7ab8');
    return true;
  }
  // returns true while the entity is a dancing friend (call at the top of update)
  updateFriend(dt) {
    if (!this.friendT) return false;
    this.friendT -= dt; this.t += dt;
    if (Math.random() < 0.05) this.g.burst(this.cx, this.y, 1, `hsl(${Math.random() * 360},100%,70%)`, 'spark');
    if (this.friendT <= 0) { this.remove = true; this.g.burst(this.cx, this.cy, 10, '#ff9ad8', 'confetti'); }
    return true;
  }
  drawFriend(ctx, fn) {
    // a little dance: bob and sway, hearts float up
    ctx.save(); ctx.translate(this.cx, this.y + this.h); ctx.rotate(Math.sin(this.t * 8) * 0.18); ctx.translate(0, -Math.abs(Math.sin(this.t * 8)) * 4);
    fn(ctx); ctx.restore();
    ctx.fillStyle = `rgba(255,120,190,${0.6 + 0.4 * Math.sin(this.t * 5)})`; ctx.font = `10px ${FONT_UI}`; ctx.textAlign = 'center';
    ctx.fillText('\u2665', this.cx + Math.sin(this.t * 3) * 6, this.y - 8 - (this.t * 20) % 20);
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
    if (kind === 'love' || kind === 'hug') return this.befriend();
    if (kind === 'stomp') return this.stomp(src);
    if (kind === 'spin') { if (this.spiky || this.fiery) return 'bounce'; return this.stomp(src); }
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

/* ---------------- flyers & floaters ---------------- */
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
  // motion: back-and-forth (ax/ay), pendulum swing (trapeze), orbit (saucer rings) or carrier (rides with the scroll)
  constructor(g, s) {
    super(g, s, (s.pw || 3) * TS, 14);
    this.x = s.x - TS / 2; this.y = s.y; this.hx = this.x; this.hy = this.y;
    this.ax = s.ax || 0; this.ay = s.ay || 0; this.speed = (s.speed || 2) * TS; this.rate = s.speed || 2;
    this.skin = s.skin || null; this.design = s.design || 0;
    this.swing = s.swing || null; this.orbit = s.orbit || 0; this.carrier = !!s.carrier; this.tilt = !!s.tilt;
    const dist = Math.hypot(this.ax, this.ay) || 1;
    this.period = dist / this.speed * 2 + 1.0;
    this.t = s.phase || 0; this.dx = 0; this.dy = 0; this.isPlatform = true; this.tiltT = 0; this.tiltDir = 1;
    if (this.swing) { this.ancX = s.x; this.ancY = s.y; this.place(); this.dx = this.dy = 0; }
    if (this.orbit) { this.place(); this.dx = this.dy = 0; }
    if (this.carrier) {
      this.stopX = s.stopX || 1e9;
      // after a checkpoint the bus pulls up wherever Brady respawns
      const cp = g.checkpoint, st = g.level && g.level.start;
      if (cp && st) { this.x += cp.x - st.x; this.hx = this.x; }
    }
  }
  place() {
    let nx, ny;
    if (this.swing) {
      const th = this.swing.amp * Math.sin(this.t * this.rate * 1.6);
      nx = this.ancX + Math.sin(th) * this.swing.len - this.w / 2; ny = this.ancY + Math.cos(th) * this.swing.len;
      this.swingTh = th;
    } else if (this.orbit) {
      const a = this.t * this.rate;
      nx = this.hx + Math.cos(a) * this.orbit; ny = this.hy + Math.sin(a) * this.orbit;
    } else {
      const k = 0.5 - 0.5 * Math.cos(this.t / this.period * TAU);
      nx = this.hx + this.ax * k; ny = this.hy + this.ay * k;
    }
    this.dx = nx - this.x; this.dy = ny - this.y; this.x = nx; this.y = ny;
  }
  update(dt) {
    if (this.carrier) {
      const go = this.g.state === 'play' && this.x < this.stopX;
      const nx = go ? Math.min(this.stopX, this.x + this.speed * dt) : this.x;
      this.dx = nx - this.x; this.dy = 0; this.x = nx; this.t += dt;
      return;
    }
    this.t += dt;
    this.place();
    // acro flyers: stand too long and they tip you off
    if (this.tilt) {
      const p = this.g.player;
      if (p && p.ride === this) {
        this.tiltT += dt;
        if (this.tiltT > 1.3) { this.tiltDir = p.cx < this.cx ? -1 : 1; p.x += this.tiltDir * 3.2 * TS * dt * Math.min(1, (this.tiltT - 1.3) * 2); }
      } else this.tiltT = Math.max(0, this.tiltT - dt * 2);
    }
  }
  draw(ctx) {
    if (this.skin && PlatformArt[this.skin]) PlatformArt[this.skin](ctx, this, this.g.t);
    else Sprites.platform(ctx, this.x, this.y, this.w, THEMES[this.g.area.theme], 'move', this.t);
  }
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
    if (this.s.skin && PlatformArt[this.s.skin]) PlatformArt[this.s.skin](ctx, { x: this.x + sx, y: this.y, w: this.w, h: this.h, t: this.t, design: Math.floor(this.hx / TS) % 3, tilt: this.state === 'shake' ? Math.sin(this.t * 40) * 0.08 : 0 }, this.g.t);
    else Sprites.platform(ctx, this.x + sx, this.y, this.w, THEMES[this.g.area.theme], 'fall', this.t);
    ctx.restore();
  }
}

/* ---------------- items ---------------- */
class Item extends Ent {
  constructor(g, x, y, kind) {
    super(g, null, 24, 24); this.x = x - 12; this.y = y; this.kind = kind; this.emerge = 0.5; this.baseY = y; this.vx = 0;
    if (kind === 'coffee' || kind === 'cassette') this.speedX = 2.4 * TS;
    if (kind === 'eclipse') this.speedX = 3.6 * TS;
    if (kind === 'bufo') this.speedX = 2.0 * TS;
    if (BAG_KINDS[kind]) this.speedX = 1.2 * TS;
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
    if (BAG_KINDS[this.kind] && this.onGround) this.vy = -5 * TS;
    if (this.y > this.g.area.H * TS + 50) this.remove = true;
  }
  touchPlayer(p) {
    if (this.emerge > 0.25) return;
    this.remove = true;
    p.collect(this.kind, this);
  }
  bounceFromBelow() { if (this.emerge <= 0) { this.vy = -9 * TS; if (this.vx) this.vx = sign(this.vx) * Math.abs(this.vx); } }
  draw(ctx) { Ink.ent(ctx, this, c => this.drawArt(c)); }
  drawArt(ctx) {
    const x = this.cx, y = this.y + this.h;
    ctx.save();
    if (this.emerge > 0) { ctx.beginPath(); ctx.rect(this.x - 10, this.baseY - TS * 2, this.w + 20, TS * 2); ctx.clip(); }
    if (this.kind === 'coffee') Sprites.coffee(ctx, x, y, this.t);
    else if (this.kind === 'vinyl') Sprites.bottle(ctx, x, y + Math.sin(this.t * 3) * 1.5, this.t);
    else if (this.kind === 'bufo') Sprites.bufo(ctx, x, y, this.t, !this.onGround);
    else if (this.kind === 'joint') Sprites.joint(ctx, x, y, this.t);
    else if (this.kind === 'eclipse') Sprites.eclipse(ctx, x, this.cy, this.t);
    else if (this.kind === 'cassette') Sprites.cassette(ctx, x, y, this.t);
    else if (BAG_KINDS[this.kind]) Sprites.baggie(ctx, x, y, this.t, this.kind);
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
  draw(ctx) { Ink.ent(ctx, this, c => Sprites.goldRecord(c, this.cx, this.cy + Math.sin(this.t * 2) * 3, this.t, this.had)); }
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
  draw(ctx) { if (this.s.skin && PlatformArt[this.s.skin + 'Spring']) PlatformArt[this.s.skin + 'Spring'](ctx, this.cx, this.y + this.h, this.comp, this.t); else Sprites.spring(ctx, this.cx, this.y + this.h, this.comp); }
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
    if (this.kind === 'door') DoorArt.draw(ctx, this.cx, this.y + this.h, this.s.look || 'door', this.t, this.near);
    else Sprites.portal(ctx, this.cx, this.y + 22, this.t, this.kind);
    if (this.near) {
      const b = Math.sin(this.t * 6) * 3;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.beginPath(); ctx.moveTo(this.cx, this.y - 22 + b); ctx.lineTo(this.cx + 8, this.y - 12 + b); ctx.lineTo(this.cx - 8, this.y - 12 + b); ctx.fill();
      ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('UP', this.cx, this.y - 28 + b);
    }
  }
  get light() { return this.kind === 'door' ? { r: 60, c: 'rgba(255,220,150,' } : { r: 90, c: 'rgba(180,120,255,' }; }
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

// baggie power-ups (ground score): timed effects, never shown in use
const BAG_KINDS = { molly: { name: 'LOVE BOMB', col: '#ff7ab8', time: 9 }, khole: { name: 'K-HOLE', col: '#7ab8ff', time: 9 }, powder: { name: 'PARTY POWDER', col: '#ffffff', time: 10 }, lsd: { name: 'LSD', col: '#c87aff', time: 14 } };
const ENTITY_TYPES = {
  jelly: Jelly, snapper: Snapper, leaper: Leaper, emberchain: EmberChain, bolt: Bolt,
  mplat: MovingPlatform, fplat: FallingPlatform, gold: Gold, spring: Spring, checkpoint: Checkpoint, gate: Gate,
  portal: Portal, sign: Sign
};
