/* ============================================================
   Gimmicks: the set-piece machinery that makes each level its own.
   ============================================================ */
const springLaunch = (p, mul) => { p.vy = -((Input.jump || (p.inp && p.inp.jump)) ? PHYS.springV : PHYS.springVLow * 1.15) * (mul || 1); p.jumping = true; p.onGround = false; p.coyote = 0; p.springT = 0.1; p.ride = null; };

/* geyser: a mineral cone that erupts on a timer and launches whoever stands on it */
class Geyser extends Ent {
  constructor(g, s) { super(g, s, 60, 32); this.x = s.x - TS / 2; this.y = s.y - TS; this.period = s.period || 3; this.phase = s.phase || 0; this.solidTop = true; this.dx = 0; this.dy = 0; this.stage = 'idle'; }
  update(dt) {
    this.t += dt;
    const k = (this.t + this.phase) % this.period, P = this.period, old = this.stage;
    this.stage = k < P - 1.7 ? 'idle' : k < P - 0.9 ? 'warn' : 'erupt';
    if (this.stage === 'erupt' && old !== 'erupt' && this.g.onScreen(this, 80)) { Sound.play('splash', { vol: 0.7 }); this.g.shake(2); }
    if (this.stage === 'erupt') {
      const col = { x: this.x + 6, y: this.y - 6 * TS, w: this.w - 12, h: 6 * TS + 4 };
      const p = this.g.player;
      if (p && !p.dead && overlap(p, col) && p.vy > -PHYS.springVLow) { springLaunch(p, 1.05); this.g.burst(p.cx, p.y + p.h, 10, '#c8f4ff', 'bubble'); }
      for (const e of this.g.entities) if (e.enemy && !e.dead && overlap(e, col) && e.vy !== undefined) e.vy = -14 * TS;
    }
  }
  touchPlayer(p) { }
  draw(ctx) { GimmickArt.geyser(ctx, this, this.g.t); }
  get light() { return this.stage === 'erupt' ? { r: 90, c: 'rgba(200,255,255,', y: this.y - 60 } : null; }
}
/* a stack of pancakes on the griddle: every few seconds the top one flips and flings the rider */
class Pancake extends Ent {
  constructor(g, s) { super(g, s, 60, 30); this.x = s.x - TS / 2 + 2; this.y = s.y - 30; this.period = s.period || 3; this.phase = s.phase || 0; this.solidTop = true; this.dx = 0; this.dy = 0; this.flipT = 0; }
  update(dt) {
    this.t += dt;
    if (this.flipT > 0) this.flipT -= dt;
    const k = (this.t + this.phase) % this.period;
    this.warn = k > this.period - 0.7;
    if (this.lastK !== undefined && k < this.lastK) {
      this.flipT = 0.7;
      const p = this.g.player;
      if (p && !p.dead && p.ride === this) { springLaunch(p, 1); Sound.play('spring', { vol: 0.6 }); this.g.burst(p.cx, p.y + p.h, 8, '#ffd08a', 'spark'); }
      else if (this.g.onScreen(this)) Sound.play('jump', { vol: 0.25, pitch: 0.7 });
    }
    this.lastK = k;
  }
  draw(ctx) { GimmickArt.pancake(ctx, this, this.g.t); }
}
/* bubble machine: blows giant bubbles that float up (ride them) and pop */
class Bubbler extends Ent {
  constructor(g, s) { super(g, s, 32, 20); this.period = s.period || 1.6; this.rise = s.rise || 8; this.spawnT = 0; }
  update(dt) {
    this.t += dt; this.spawnT -= dt;
    if (this.spawnT <= 0 && this.g.onScreen(this, 500)) { this.spawnT = this.period; this.g.spawn(new Bubble(this.g, this.x + this.w / 2, this.y + this.h - 6, this.rise)); }
  }
  draw(ctx) { GimmickArt.bubbler(ctx, this, this.g.t); }
}
class Bubble extends Ent {
  constructor(g, cx, y, rise) { super(g, null, 64, 14); this.x = cx - 16 - 8; this.y = y; this.y0 = y; this.rise = rise * TS; this.isPlatform = true; this.dx = 0; this.dy = 0; this.age = 0; this.r = 4; }
  update(dt) {
    this.t += dt; this.age += dt;
    this.r = Math.min(26, this.r + dt * 60);
    const oy = this.y, ox = this.x;
    const life = this.rise / (2 * TS);
    this.y = this.y0 - Math.min(this.rise, this.age * 2 * TS);
    this.x += Math.sin(this.age * 3) * 0.4;
    this.dx = this.x - ox; this.dy = this.y - oy;
    if (this.age > life + 0.6) { this.remove = true; this.dead = true; this.g.burst(this.cx, this.y, 12, '#e8f8ff', 'bubble'); if (this.g.onScreen(this)) Sound.play('splat', { vol: 0.3, pitch: 1.6 }); }
  }
  draw(ctx) { GimmickArt.bubble(ctx, this, this.g.t); }
}
/* tumbleweeds and boulders roll in from the right */
class Roller extends Ent {
  constructor(g, s) { super(g, s, 8, 8); this.kind = s.kind || 'tumbleweed'; this.period = s.period || 3; this.dir = s.dir || -1; this.spawnT = s.delay || 0.6; }
  update(dt) {
    this.t += dt;
    const near = this.x > this.g.camX - 100 && this.x < this.g.camX + this.g.viewW + 6 * TS;
    if (!near) return;
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = this.period * (0.8 + Math.random() * 0.4); this.g.spawn(new Rolling(this.g, this.x, this.y, this.kind, this.dir)); }
  }
}
class Rolling extends Ent {
  constructor(g, x, y, kind, dir) {
    const big = kind === 'boulder';
    super(g, null, big ? 40 : 28, big ? 40 : 26); this.x = x - this.w / 2; this.y = y - this.h; this.kind = kind; this.dir = dir; this.enemy = true; this.spinA = 0;
    this.vx = dir * (big ? 3.4 : 3.0) * TS; this.boulder = big;
  }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    this.vy += PHYS.gDown * (this.boulder ? 1 : 0.6) * dt; if (this.vy > PHYS.maxFall) this.vy = PHYS.maxFall;
    const vx = this.vx;
    moveBody(this, this.g.area, dt, { semis: true });
    if (this.hitWall) { if (this.boulder) { this.remove = true; this.g.burst(this.cx, this.cy, 14, '#8a6a4a', 'debris'); if (this.g.onScreen(this)) { Sound.play('break', { vol: 0.5 }); this.g.shake(3); } return; } this.vx = -vx; this.dir = -this.dir; }
    else this.vx = vx;
    if (this.onGround && !this.boulder) this.vy = -(5 + Math.random() * 3) * TS;
    this.spinA += this.vx / (this.w / 2) * dt;
    if (this.y > this.g.area.H * TS + 60 || this.x < this.g.camX - 400) this.remove = true;
  }
  hit(kind, src) {
    if (this.dead) return false;
    if (this.boulder) return (kind === 'stomp' || kind === 'spin') ? 'bounce' : false;
    if (kind === 'stomp' || kind === 'spin' || kind === 'disc' || kind === 'star' || kind === 'love') { this.dead = true; this.remove = true; this.g.burst(this.cx, this.cy, 14, '#c8a060', 'debris'); Sound.play('crumble', { vol: 0.5 }); return true; }
    return false;
  }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) { GimmickArt.rolling(ctx, this, this.g.t); }
}
/* fuel barrel: touch it and the fuse lights; it blows a moment later */
class Barrel extends Ent {
  constructor(g, s) { super(g, s, 26, 30); this.solidTop = true; this.dx = 0; this.dy = 0; this.fuse = 0; this.gone = 0; this.hx = this.x; this.hy = this.y; }
  update(dt) {
    this.t += dt;
    if (this.gone > 0) { this.gone -= dt; if (this.gone <= 0) { this.dead = false; this.solidTop = true; this.fuse = 0; } return; }
    const p = this.g.player;
    if (!this.fuse && p && !p.dead && (p.ride === this || overlap(p, { x: this.x - 2, y: this.y - 2, w: this.w + 4, h: this.h + 4 }))) { this.fuse = 1.5; sfx('firework_launch', 'fire', { vol: 0.4 }); }
    if (this.fuse > 0) { this.fuse -= dt; if (this.fuse <= 0) this.boom(); }
  }
  boom() {
    const g = this.g, cx = this.cx, cy = this.cy, R = 62;
    this.dead = true; this.solidTop = false; this.gone = 8;
    sfx('firework_burst', 'break'); g.shake(9); g.burst(cx, cy, 30, '#ff8a2a', 'spark'); g.burst(cx, cy, 16, '#ffd84a', 'firework');
    const p = g.player;
    if (p && !p.dead && Math.hypot(p.cx - cx, p.cy - cy) < R + 10) p.hurt(this);
    for (const e of g.entities) if (e !== this && e.enemy && !e.dead && !e.boss && Math.hypot(e.cx - cx, e.cy - cy) < R + 10) e.hit('star', this);
    for (let ty = Math.floor((cy - R) / TS); ty <= Math.floor((cy + R) / TS); ty++) for (let tx = Math.floor((cx - R) / TS); tx <= Math.floor((cx + R) / TS); tx++) if (tileAt(g.area, tx, ty) === T.BRICK) g.bumpBlock(tx, ty, true, this);
  }
  draw(ctx) { if (this.gone > 0 && this.dead) return; GimmickArt.barrel(ctx, this, this.g.t); }
  get light() { return this.fuse > 0 ? { r: 50 + Math.sin(this.t * 30) * 10, c: 'rgba(255,90,40,' } : null; }
}
/* laser gate: a vertical beam that switches with the beat */
class Laser extends Ent {
  constructor(g, s) { super(g, s, 10, (s.h || 5) * TS); this.x = s.x - 5; this.y = s.y - this.h; this.grp = s.grp || 0; this.every = s.every || 2; this.on = false; this.warn = false; }
  update(dt) {
    this.t += dt;
    const b = this.g.beatNow(), slot = Math.floor(b / this.every), frac = (b / this.every) % 1;
    const wasOn = this.on;
    this.on = slot % 2 === this.grp;
    this.warn = !this.on && frac > 0.7;
    if (this.on && !wasOn && this.g.onScreen(this, 40)) Sound.play('laser', { vol: 0.25 });
  }
  touchPlayer(p) { if (this.on) p.hurt(this); }
  draw(ctx) { GimmickArt.laser(ctx, this, this.g.t); }
  get light() { return this.on ? { r: 70, c: 'rgba(255,60,200,', y: this.y + this.h / 2 } : null; }
}
/* a sweeping laser on a pedestal */
class Sweeper extends Ent {
  constructor(g, s) { super(g, s, 8, 8); this.ox = s.x; this.oy = s.y - TS / 2; this.len = (s.len || 5) * TS; this.speed = s.speed || 1.2; this.a = Math.random() * TAU; this.customCollide = true; this.x = this.ox - this.len; this.w = this.len * 2; this.y = this.oy - this.len; this.h = this.len * 2; }
  update(dt) { this.t += dt; this.a += this.speed * dt; }
  collidePlayer(p) {
    for (let d = 14; d < this.len; d += 8) {
      const x = this.ox + Math.cos(this.a) * d, y = this.oy + Math.sin(this.a) * d;
      if (x > p.x && x < p.x + p.w && y > p.y && y < p.y + p.h) { p.hurt(this); return; }
    }
  }
  draw(ctx) { GimmickArt.sweeper(ctx, this, this.g.t); }
  get light() { return { r: 60, c: 'rgba(56,242,255,' }; }
}
/* subwoofer: a bass wave rolls along the ground on every other beat */
class Subwoofer extends Ent {
  constructor(g, s) { super(g, s, 64, 96); this.x = s.x - 16; this.y = s.y - 96; this.every = s.every || 2; this.dir = s.dir || -1; this.last = -1; this.pulse = 0; }
  update(dt) {
    this.t += dt; this.pulse = Math.max(0, this.pulse - dt * 3);
    const slot = Math.floor(this.g.beatNow() / this.every);
    if (slot !== this.last) {
      this.last = slot; this.pulse = 1;
      if (this.g.onScreen(this, 120)) { fire(this.g, this.dir < 0 ? this.x - 6 : this.x + this.w + 6, this.y + this.h - 14, { kind: 'bass', vx: this.dir * 4.6 * TS, w: 16, h: 26, ground: true, life: 3, col: '#ff4fd8' }); Sound.play('stomp', { vol: 0.35, pitch: 0.5 }); }
    }
  }
  draw(ctx) { GimmickArt.subwoofer(ctx, this, this.g.t); }
}
/* an RV horn: honk blasts shove Brady back */
class Horn extends Ent {
  constructor(g, s) { super(g, s, 8, 8); this.dir = s.dir || -1; this.period = s.period || 3; this.phase = s.phase || 0; this.len = (s.len || 6) * TS; this.ox = s.x - TS / 2; this.oy = s.y; this.honk = false; this.x = this.ox - this.len; this.w = this.len + 8; this.y = this.oy - 3 * TS; this.h = 3 * TS; }
  update(dt) {
    this.t += dt;
    const k = (this.t + this.phase) % this.period, was = this.honk;
    this.honk = k > this.period - 1.0;
    if (this.honk && !was && this.g.onScreen(this, 60)) { Sound.play('artcarHorn', { vol: 0.5 }); this.g.parts.text(this.ox - 20, this.oy - 70, 'HONK!', '#ffd84a'); }
    if (this.honk) { const p = this.g.player; if (p && !p.dead && overlap(p, this)) p.pushX = (p.pushX || 0) + this.dir * 6.5 * TS; }
  }
  draw(ctx) { if (this.honk) GimmickArt.honk(ctx, this, this.g.t); }
}
/* a ring of fire poi spinning around a hub */
class PoiRing extends Ent {
  constructor(g, s) {
    super(g, s, 2, 2); this.ox = s.x; this.oy = s.y - TS / 2; this.len = s.len || 3; this.arms = s.arms || 2; this.speed = s.speed || 1.6; this.a = Math.random() * TAU;
    this.x = this.ox - this.len * 16; this.y = this.oy - this.len * 16; this.w = this.len * 32; this.h = this.len * 32; this.customCollide = true; this.fiery = true;
  }
  update(dt) { this.t += dt; this.a += this.speed * dt; }
  orbs() { const r = []; for (let k = 0; k < this.arms; k++) { const a = this.a + k / this.arms * TAU; for (let i = 1; i <= this.len; i++) r.push([this.ox + Math.cos(a) * i * 15, this.oy + Math.sin(a) * i * 15, i === this.len]); } return r; }
  collidePlayer(p) {
    for (const [x, y] of this.orbs()) {
      const nx = clamp(x, p.x, p.x + p.w), ny = clamp(y, p.y, p.y + p.h);
      if ((nx - x) ** 2 + (ny - y) ** 2 < 7.5 * 7.5) {
        if (p.spin && p.vy > 0 && p.y + p.h < y + 6) { p.vy = -PHYS.stompV; p.jumping = true; this.g.burst(x, y, 6, '#ffb84a', 'spark'); return; }
        p.hurt(this); return;
      }
    }
  }
  draw(ctx) { GimmickArt.poiring(ctx, this, this.g.t); }
  get light() { return { r: 90, c: 'rgba(255,150,50,', x: this.ox, y: this.oy }; }
}
/* keys and the doors they open */
class Key extends Ent {
  constructor(g, s) { super(g, s, 24, 30); this.id = s.id || 'exit'; this.silver = !!s.silver; this.hy = this.y; if (g.keys && g.keys.has(this.id)) this.remove = true; }
  update(dt) { this.t += dt; this.y = this.hy + Math.sin(this.t * 2.4) * 4; }
  touchPlayer(p) {
    if (this.remove) return;
    this.remove = true; this.g.keys.add(this.id);
    sfx('key', 'oneup'); this.g.burst(this.cx, this.cy, 18, this.silver ? '#e8f0ff' : '#ffd84a', 'confetti');
    this.g.toast(this.silver ? 'A SILVER KEY! WHAT DOES IT OPEN?' : 'KEY! FIND THE LOCKED DOOR');
  }
  draw(ctx) { GimmickArt.key(ctx, this, this.g.t); }
  get light() { return { r: 60, c: this.silver ? 'rgba(220,235,255,' : 'rgba(255,220,100,' }; }
}
class Lock extends Ent {
  constructor(g, s) { super(g, s, TS + 12, (s.h || 3) * TS); this.x = s.x - TS / 2 - 6; this.y = s.y - this.h; this.id = s.id || 'exit'; this.lookName = s.look || 'door'; this.open = false; this.msgT = 0; this.tiles = []; for (let i = 0; i < (s.h || 3); i++) this.tiles.push([Math.floor(s.x / TS), Math.floor(s.y / TS) - 1 - i]); }
  update(dt) { this.t += dt; if (this.msgT > 0) this.msgT -= dt; if (this.openT > 0) { this.openT -= dt; if (this.openT <= 0) this.remove = true; } }
  touchPlayer(p) {
    if (this.open) return;
    if (this.g.keys.has(this.id)) {
      this.open = true; this.openT = 0.6;
      for (const [x, y] of this.tiles) this.g.setTile(x, y, T.EMPTY);
      sfx('door', 'secret'); this.g.burst(this.cx, this.cy, 16, this.id === 'secret' ? '#7affd8' : '#ffd84a', 'confetti');
      this.g.toast(this.id === 'secret' ? 'THE VIP ROPE OPENS...' : 'UNLOCKED!');
    } else if (this.msgT <= 0) { this.msgT = 2; this.g.parts.text(this.cx, this.y - 10, this.id === 'secret' ? 'NEEDS A SILVER KEY' : 'LOCKED', '#ffd84a'); Sound.play('bump', { vol: 0.4 }); }
  }
  draw(ctx) { GimmickArt.lock(ctx, this, this.g.t); }
}
/* lamplighter posts: touch to light, and the dark camp lights up around them */
class Lamp extends Ent {
  constructor(g, s) { super(g, s, 20, 80); this.lit = false; this.glow = 0; }
  update(dt) { this.t += dt; this.glow = approach(this.glow, this.lit ? 1 : 0, dt * 2); }
  touchPlayer(p) {
    if (this.lit) return;
    this.lit = true; this.g.lampsLit = (this.g.lampsLit || 0) + 1;
    Sound.play('checkpoint', { vol: 0.6 }); this.g.burst(this.cx, this.y + 10, 16, '#ffc860', 'spark');
    this.g.parts.text(this.cx, this.y - 6, 'LIT!', '#ffd84a');
  }
  draw(ctx) { GimmickArt.lamp(ctx, this, this.g.t); }
  get light() { return { r: 40 + this.glow * 230, c: 'rgba(255,200,110,', y: this.y + 12 }; }
}
/* neon flash trap: a countdown, then a blinding flash. Hide behind something solid */
class FlashTrap extends Ent {
  constructor(g, s) { super(g, s, 44, 30); this.period = s.period || 4; this.phase = s.phase || 0; this.range = (s.range || 16) * TS; this.stage = 'idle'; this.count = 0; }
  update(dt) {
    this.t += dt;
    const k = (this.t + this.phase) % this.period, P = this.period, old = this.stage;
    this.stage = k < P - 1.8 ? 'idle' : k < P - 0.2 ? 'count' : 'flash';
    this.count = Math.ceil((P - 0.2 - k) / 0.53);
    const on = this.g.onScreen(this, 260);
    if (this.stage === 'count' && on && this.count !== this.lastCount) { this.lastCount = this.count; Sound.play('select', { vol: 0.4, pitch: 1 + (3 - this.count) * 0.2 }); }
    if (this.stage === 'flash' && old !== 'flash' && on) {
      const g = this.g, p = g.player;
      sfx('neon_flash', 'laser', { vol: 0.8 }); g.flash = Math.max(g.flash, 1);
      if (p && !p.dead && Math.abs(p.cx - this.cx) < this.range && lineOfSight(g, this.cx, this.y + this.h / 2, p.cx, p.y + 10) && lineOfSight(g, this.cx, this.y + this.h / 2, p.cx, p.y + p.h - 6)) p.hurt(this);
    }
  }
  draw(ctx) { GimmickArt.flashtrap(ctx, this, this.g.t); }
  get light() { return this.stage === 'flash' ? { r: 400, c: 'rgba(255,255,255,' } : this.stage === 'count' ? { r: 80, c: 'rgba(255,79,216,' } : { r: 40, c: 'rgba(56,242,255,' }; }
}
/* the gift booth at the end of a gift camp: a permanent gift */
const GIFTS = {
  kandi: { name: 'KANDI BRACELETS', desc: 'Start every level with one extra hit', col: '#ff7ad8' },
  lantern: { name: 'LAMPLIGHTER LANTERN', desc: 'Lights up dark and dusty levels', col: '#ffc860' },
  bike: { name: 'TUNED-UP BIKE', desc: 'Brady runs faster', col: '#7affd8' },
  hydration: { name: 'HYDRATION PACK', desc: 'Start every level big (one more health step)', col: '#5ad0ff' }
};
class GiftBooth extends Ent {
  constructor(g, s) { super(g, s, 120, 100); this.x = s.x - 60; this.gift = s.gift || 'kandi'; this.given = !!(Save.data.gifts && Save.data.gifts[this.gift]); }
  update(dt) { this.t += dt; }
  touchPlayer(p) {
    if (this.taken) return;
    this.taken = true;
    const G = GIFTS[this.gift] || GIFTS.kandi;
    Save.data.gifts = Save.data.gifts || {};
    const fresh = !Save.data.gifts[this.gift];
    Save.data.gifts[this.gift] = true; Save.save();
    sfx('gift', 'powerup'); this.g.burst(this.cx, this.y + 20, 40, '#fff', 'firework'); this.g.burst(p.cx, p.cy, 24, G.col, 'confetti');
    this.g.bannerText = G.name + '!'; this.g.bannerT = 2.6;
    this.g.toast(G.desc.toUpperCase());
    this.g.giftNow = this.gift; this.g.giftFresh = fresh;
    if (this.gift === 'kandi') p.kandi = Math.max(p.kandi || 0, 1);
    if (this.gift === 'hydration' && p.power === 0) p.setPower(1);
  }
  draw(ctx) { }
  get light() { return { r: 120, c: 'rgba(255,220,150,' }; }
}
/* visuals for updraft zones: steam vents, port tubes, misters, thermals, bubble columns */
class Vent extends Ent {
  constructor(g, s) { super(g, s, (s.w || 2) * TS, 10); this.x = s.x - TS / 2; this.y = s.y - 10; this.lookName = s.look || 'steam'; this.puffs = []; }
  update(dt) {
    this.t += dt;
    if (!this.g.onScreen(this, 200)) return;
    if (Math.random() < dt * 14) this.puffs.push({ x: this.x + Math.random() * this.w, y: this.y, vy: -(3 + Math.random() * 3) * TS, life: 1.4, a: 0.6 });
    for (const q of this.puffs) { q.y += q.vy * dt; q.life -= dt; q.x += Math.sin(q.life * 6) * 0.3; }
    this.puffs = this.puffs.filter(q => q.life > 0);
  }
  draw(ctx) { GimmickArt.vent(ctx, this, this.g.t); }
}
class DevilZone extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, (s.h || 7) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; }
  update(dt) { this.t += dt; }
  draw(ctx) { BurnerArt.draw(ctx, 'devil', this.cx, this.y + this.h, this.t, 1, 'tall', this); }
}
/* flying MOOP in the wind tunnel */
class Moop extends Ent {
  constructor(g, s) { super(g, s, 8, 8); this.dir = s.dir || -1; this.wTiles = s.w || 14; this.period = s.period || 1.6; this.spawnT = 0.5; }
  update(dt) {
    this.t += dt; this.spawnT -= dt;
    if (this.spawnT <= 0 && this.g.onScreen(this, 300)) {
      this.spawnT = this.period * (0.7 + Math.random() * 0.6);
      fire(this.g, this.x, this.y - Math.random() * 2.5 * TS, { kind: 'moop', vx: this.dir * (5 + Math.random() * 2) * TS, vy: (Math.random() - 0.5) * TS, w: 14, h: 12, life: this.wTiles * TS / (5 * TS) + 0.5, thru: true, col: '#c8c8d0' });
    }
  }
}
/* overhead luggage in the stowaway RV */
class Dropper extends Ent {
  constructor(g, s) { super(g, s, 28, 20); this.y = s.y - TS; this.period = s.period || 3; this.k = Math.random() * this.period; this.lookName = s.look || 'luggage'; }
  update(dt) {
    this.t += dt; this.k += dt;
    this.shake = this.k > this.period - 0.5;
    if (this.k > this.period) { this.k = 0; if (this.g.onScreen(this, 60)) fire(this.g, this.cx, this.y + this.h + 8, { kind: 'luggage', vy: 0, grav: PHYS.gDown * 0.7, w: 24, h: 20, life: 3, col: '#c8a070' }); }
  }
  draw(ctx) { GimmickArt.dropper(ctx, this, this.g.t); }
}
/* the disco bus ride: low banners, swinging disco balls, crowd surfers */
class Banner extends Ent {
  constructor(g, s) { super(g, s, (s.len || 3) * TS, 26); this.x = s.x - TS / 2; this.y = s.y - TS - 4; }
  update(dt) { this.t += dt; }
  touchPlayer(p) { if (p.y < this.y + this.h - 6) p.hurt(this); }
  draw(ctx) { GimmickArt.banner(ctx, this, this.g.t); }
}
class DiscoBall extends Ent {
  constructor(g, s) { super(g, s, 30, 30); this.ax = s.x; this.ay = s.y; this.len = (s.len || 5) * TS; this.amp = s.amp || 0.8; this.speed = s.speed || 1.6; this.place(); }
  place() { const th = this.amp * Math.sin(this.t * this.speed); this.bx = this.ax + Math.sin(th) * this.len; this.by = this.ay + Math.cos(th) * this.len; this.x = this.bx - 15; this.y = this.by - 15; }
  update(dt) { this.t += dt; this.place(); }
  touchPlayer(p) { p.hurt(this); }
  draw(ctx) { GimmickArt.discoball(ctx, this, this.g.t); }
  get light() { return { r: 110, c: 'rgba(255,255,255,' }; }
}
class Surfer extends Ent {
  constructor(g, s) { super(g, s, 8, 8); this.period = s.period || 2.5; this.k = s.phase || 0; }
  update(dt) {
    this.t += dt; this.k += dt;
    if (this.k > this.period) { this.k = 0; if (this.g.onScreen(this, 120)) { const s = fire(this.g, this.x, this.y, { kind: 'surfer', vx: (Math.random() - 0.5) * 2 * TS, vy: -15 * TS, grav: PHYS.gDown * 0.6, w: 30, h: 18, life: 2.4, thru: true, stompable: true, col: '#ffd84a' }); s.seed = Math.floor(Math.random() * 9); sfx('crowd', null, { vol: 0.3 }); } }
  }
}
/* LED jellyfish pads: float in place, bounce Brady up off their bells */
class JellyPad extends Ent {
  constructor(g, s) { super(g, s, 34, 24); this.x = s.x - 17; this.y = s.y - TS; this.hy = this.y; this.bob = s.bob || 0.5; this.t = s.phase || 0; this.comp = 0; this.col = ['#38f2ff', '#ff4fd8', '#7aff6a', '#c87aff'][Math.floor(Math.abs(s.x) / 97) % 4]; }
  update(dt) { this.t += dt; this.comp = Math.max(0, this.comp - dt * 4); this.y = this.hy + Math.sin(this.t * this.bob * 3) * 3; }
  touchPlayer(p) {
    if (p.vy >= 0 && p.y + p.h <= this.y + 14) { p.y = this.y + 6 - p.h; springLaunch(p, 1); this.comp = 1; sfx('lsd', 'spring', { vol: 0.5 }); this.g.burst(this.cx, this.y + 4, 8, this.col, 'spark'); }
  }
  draw(ctx) { BurnerArt.draw(ctx, 'ledjelly', this.cx, this.y + this.h, this.t, 1, this.comp > 0 ? 'flash' : 'pad', this); }
  get light() { return { r: 90, c: 'rgba(' + hexToRgb(this.col).join(',') + ',' }; }
}

Object.assign(ENTITY_TYPES, {
  geyser: Geyser, pancake: Pancake, bubbler: Bubbler, roller: Roller, barrel: Barrel, laser: Laser, sweeper: Sweeper, subwoofer: Subwoofer,
  horn: Horn, poiring: PoiRing, key: Key, lock: Lock, lamp: Lamp, flashtrap: FlashTrap, giftbooth: GiftBooth, vent: Vent, devilzone: DevilZone,
  moop: Moop, dropper: Dropper, banner: Banner, discoball: DiscoBall, surfer: Surfer, jellypad: JellyPad
});
