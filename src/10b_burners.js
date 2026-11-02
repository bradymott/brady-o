/* ============================================================
   The burner roster: every enemy has its own behaviour.
   Shared basics (6-day drivers, hippies, ravers, camp leads...)
   plus each land's specialists. All comedic, all original.
   ============================================================ */
const PITCHES = ['AI FOR AURAS', 'BLOCKCHAIN BURRITOS', 'UBER FOR SHADE', 'NFT KANDI', 'DISRUPT THE DUST', 'SEED ROUND?', 'WEB5', 'SYNERGY', 'APP FOR HUGS', 'DM ME'];
const RANTS = ["IT WAS BETTER IN '98!", 'BACK WHEN IT WAS FREE', "YOU SHOULD'VE SEEN '96", 'THIS ISNT THE REAL BURN', 'NO PLUG-IN ANYTHING', 'KIDS THESE DAYS', 'WE HAD GUNS. AND FUN.'];
const VERSES = ['AND YET', 'I AM DUST', 'SNAP', 'WE ARE', 'STARDUST', 'THE VOID', 'SNAP SNAP', 'MY SOUL', 'O PLAYA'];
const YELLS = ['WHO HAS THE ZIP TIES?!', 'SHIFT STARTS NOW!', 'WHERE IS THE GENERATOR?!', 'MOOP SWEEP AT 9!', 'NOBODY TOUCH THE SHADE!'];
const LUNGES = ['HEY... WANNA SEE OUR DOME?', 'NICE AURA', 'CUDDLE PUDDLE?', 'OPEN MINDED?'];
const near = (e, p, dx, dy) => p && !p.dead && Math.abs(p.cx - e.cx) < dx * TS && Math.abs(p.cy - e.cy) < dy * TS;
function lineOfSight(g, x0, y0, x1, y1) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 10);
  for (let i = 1; i < n; i++) { const k = i / n; if (SOLID[tileAt(g.area, Math.floor(lerp(x0, x1, k) / TS), Math.floor(lerp(y0, y1, k) / TS))]) return false; }
  return true;
}
function say(g, e, text, col) { g.parts.text(e.cx, e.y - 12, text, col || '#ffffff'); }
function sfx(name, fallback, opts) { if ((Sound.sfxNames || []).indexOf(name) >= 0) Sound.play(name, opts); else if (fallback) Sound.play(fallback, opts); }

/* ---------------- projectiles ---------------- */
class Shot extends Ent {
  // kinds: verse, rant, pitch, wrench, crystal, yell, bass, espresso, mud, firework, spark, moop, ember, ink
  constructor(g, x, y, o) {
    super(g, null, o.w || 16, o.h || 16);
    this.x = x - this.w / 2; this.y = y - this.h / 2;
    this.vx = o.vx || 0; this.vy = o.vy || 0; this.grav = o.grav || 0; this.life = o.life || 5; this.kind = o.kind || 'spark';
    this.text = o.text || ''; this.effect = o.effect || null; this.enemy = !o.platform; this.homing = o.homing || 0;
    this.ground = !!o.ground; this.stompable = !!o.stompable; this.col = o.col || '#ff4fa8'; this.dir = sign(this.vx) || 1;
    this.thru = !!o.thru; this.isPlatform = !!o.platform; this.dx = 0; this.dy = 0; this.fiery = !!o.fiery; this.safeTop = !!o.safeTop;
  }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    const ox = this.x, oy = this.y;
    if (this.homing) {
      const p = this.g.player;
      if (p && !p.dead) { const dx = p.cx - this.cx, dy = p.cy - this.cy, d = Math.hypot(dx, dy) || 1, sp = Math.hypot(this.vx, this.vy) || 1.5 * TS; this.vx = approach(this.vx, dx / d * sp, this.homing * TS * dt); this.vy = approach(this.vy, dy / d * sp, this.homing * TS * dt); }
    }
    this.vy += this.grav * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (this.kind === 'pitch' || this.kind === 'rantup') this.y += Math.sin(this.t * 3) * 0.3;
    this.dx = this.x - ox; this.dy = this.y - oy;
    this.life -= dt;
    if (this.life <= 0 || (!this.g.onScreen(this, 360) && !this.isPlatform)) { this.pop(true); return; }
    if (!this.thru && !this.ground) {
      const t = tileAt(this.g.area, Math.floor(this.cx / TS), Math.floor(this.cy / TS));
      if (SOLID[t]) { this.pop(); return; }
    }
    if (this.ground) {
      // ground waves fizzle at walls and ledges
      const ahead = Math.floor((this.vx > 0 ? this.x + this.w + 2 : this.x - 2) / TS), fy = Math.floor((this.y + this.h + 4) / TS);
      if (SOLID[tileAt(this.g.area, ahead, Math.floor(this.cy / TS))] || !(SOLID[tileAt(this.g.area, ahead, fy)] || tileAt(this.g.area, ahead, fy) === T.SEMI)) this.pop();
    }
  }
  pop(quiet) {
    if (this.remove) return;
    this.remove = true; this.dead = true;
    if (this.kind === 'firework') {
      // the Man's fireworks burst into a shower of falling sparks
      sfx('firework_burst', 'pick', { vol: 0.5, pitch: 0.6 }); this.g.burst(this.cx, this.cy, 30, '#fff', 'firework');
      for (let k = 0; k < 5; k++) fire(this.g, this.cx, this.cy, { kind: 'ember', vx: (k - 2) * 1.4 * TS, vy: -2 * TS, grav: PHYS.gDown * 0.35, w: 10, h: 10, life: 2.2, thru: true, fiery: true, col: '#ffd84a' });
      return;
    }
    if (!quiet) this.g.burst(this.cx, this.cy, 8, this.col, this.kind === 'pitch' || this.kind === 'rant' || this.kind === 'rantup' ? 'confetti' : 'spark');
  }
  hit(kind, src) {
    if (this.dead) return false;
    if (kind === 'stomp' || kind === 'spin') { if (this.stompable) { this.pop(); Sound.play('splat', { vol: 0.5 }); return true; } return this.fiery && kind === 'spin' ? 'bounce' : false; }
    if (kind === 'disc' || kind === 'star' || kind === 'love') { this.pop(); return true; }
    return false;
  }
  touchPlayer(p) {
    if (this.dead) return;
    if (this.isPlatform) { if (p.y + p.h <= this.y + 6) return; }
    if (this.safeTop && p.vy > 0 && p.y + p.h <= this.y + 8) return;
    if (this.effect === 'slow') { p.slowDown(2.6); say(this.g, p, 'UGH...', '#c8b89a'); this.pop(); return; }
    if (this.effect === 'push') { p.vx += this.dir * 6 * TS; p.vy = Math.min(p.vy, -4 * TS); this.pop(); return; }
    p.hurt(this);
  }
  draw(ctx) { ShotArt.draw(ctx, this, this.g.t); }
  get light() { return this.fiery || this.kind === 'firework' || this.kind === 'bass' || this.kind === 'ember' ? { r: 60, c: 'rgba(255,170,80,' } : null; }
}
function fire(g, x, y, o) { const s = new Shot(g, x, y, o); g.spawn(s); return s; }

/* ---------------- a stompable burner on foot ---------------- */
class Burner extends Walker {
  constructor(g, s, w, h, speed, look) {
    super(g, s, w, h, speed);
    this.look = look; this.homeX = this.x; this.cool = 1 + Math.random() * 1.5; this.seed = Math.floor(Math.random() * 99);
    this.vx = this.dir * this.speed;
  }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    if (this.updateFriend(dt)) { this.vy += PHYS.gDown * dt; moveBody(this, this.g.area, dt, { semis: true, platforms: this.g.platforms }); return; }
    if (this.dead) { this.flatT -= dt; if (this.flatT <= 0) this.remove = true; return; }
    if (this.cool > 0) this.cool -= dt;
    this.think(dt);
    this.walk(dt);
  }
  think(dt) { }
  stomp(p) {
    this.dead = true; this.flatT = 0.6; this.vx = 0;
    Sound.play('stomp');
    this.g.burst(this.cx, this.y + this.h, 8, '#ffffff', 'dust');
    this.onDefeat && this.onDefeat();
    return true;
  }
  paint(ctx, x, y, mode) { BurnerArt.draw(ctx, this.look, x, y, this.t, this.dir, mode, this); }
  draw(ctx) {
    if (this.knocked) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(Math.PI + (this.spin || 0)); this.paint(ctx, 0, this.h / 2, 'ko'); ctx.restore(); return; }
    if (this.friendT) { this.drawFriend(ctx, c => this.paint(c, 0, 0, 'dance')); return; }
    if (this.dead) { ctx.save(); ctx.translate(this.cx, this.y + this.h); ctx.scale(1.3, 0.35); this.paint(ctx, 0, 0, 'flat'); ctx.restore(); return; }
    this.paint(ctx, this.cx, this.y + this.h, this.mode || 'walk');
  }
}

/* 6-day driver: shuffles like a zombie, lurches when Brady gets close, then yawns */
class Driver extends Burner {
  constructor(g, s) { super(g, s, 22, 28, 0.7, 'driver'); this.lurchT = 0; this.yawnT = 0; }
  think(dt) {
    const p = this.g.player;
    if (this.lurchT > 0) { this.lurchT -= dt; this.vx = this.dir * 3.0 * TS; this.mode = 'lurch'; if (this.lurchT <= 0) { this.yawnT = 1.3; } return; }
    if (this.yawnT > 0) { this.yawnT -= dt; this.vx = 0; this.mode = 'yawn'; if (this.yawnT <= 0) this.vx = this.dir * this.speed; return; }
    this.mode = 'walk';
    if (!this.vx) this.vx = this.dir * this.speed;
    if (this.cool <= 0 && near(this, p, 5, 2)) { this.dir = sign(p.cx - this.cx) || this.dir; this.lurchT = 0.75; this.cool = 3.2; say(this.g, this, '...COFFEE...', '#c8b89a'); }
  }
}
/* hippie: wanders, stops to meditate and float a little */
class Hippie extends Burner {
  constructor(g, s) { super(g, s, 24, 24, 1.0, 'hippie'); this.medT = 0; this.nextMed = 3 + Math.random() * 4; this.col = g.tint('glump'); }
  think(dt) {
    if (this.medT > 0) { this.medT -= dt; this.vx = 0; this.mode = 'meditate'; if (this.medT <= 0) this.vx = this.dir * this.speed; return; }
    this.mode = 'walk';
    this.nextMed -= dt;
    if (this.nextMed <= 0 && this.onGround) { this.medT = 2; this.nextMed = 5 + Math.random() * 4; if (this.g.onScreen(this)) say(this.g, this, 'OMMM', '#c8f0a0'); }
    if (!this.vx) this.vx = this.dir * this.speed;
  }
  paint(ctx, x, y, mode) {
    if (mode === 'flat') { Sprites.glump(ctx, x, y, this.t, this.col, this.dir, 0, true); return; }
    const lift = mode === 'meditate' ? 4 + Math.sin(this.t * 3) * 2 : 0;
    if (lift) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(200,255,160,0.18)'; ctx.beginPath(); ctx.ellipse(x, y - 14 - lift, 18, 22, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    Sprites.glump(ctx, x, y - lift, this.t, this.col, this.dir, 0, false);
  }
}
/* half-dressed raver: hops on the beat, edging toward Brady */
class Raver extends Burner {
  constructor(g, s) { super(g, s, 22, 28, 1.6, 'raver'); this.lastBeat = -1; }
  think(dt) {
    const p = this.g.player;
    if (!this.onGround) return;
    this.vx = 0;
    const b = Math.floor(this.g.beatNow() + this.seed * 0.01);
    if (b !== this.lastBeat) {
      this.lastBeat = b;
      if (near(this, p, 8, 3)) this.dir = sign(p.cx - this.cx) || this.dir;
      const big = b % 4 === 0;
      this.vy = -(big ? 10 : 6.5) * TS; this.vx = this.dir * (big ? 2.4 : 1.4) * TS; this.onGround = false;
    }
  }
}
/* stressed camp lead: patrols, spots Brady, charges, then yells a shockwave */
class CampLead extends Burner {
  constructor(g, s) { super(g, s, 22, 30, 1.1, 'camplead'); this.state = 'patrol'; this.st = 0; this.edgeTurn = true; }
  think(dt) {
    const p = this.g.player;
    this.st -= dt;
    if (this.state === 'patrol') {
      this.mode = 'walk'; if (!this.vx) this.vx = this.dir * this.speed;
      if (this.cool <= 0 && p && !p.dead && Math.abs(p.cy - this.cy) < 1.6 * TS && Math.abs(p.cx - this.cx) < 7 * TS && sign(p.cx - this.cx) === this.dir) { this.state = 'notice'; this.st = 0.45; this.vx = 0; say(this.g, this, '!', '#ffd84a'); }
    } else if (this.state === 'notice') {
      this.vx = 0; this.mode = 'notice';
      if (this.st <= 0) { this.state = 'charge'; this.st = 1.3; this.edgeTurn = false; }
    } else if (this.state === 'charge') {
      this.mode = 'charge'; this.vx = this.dir * 5.0 * TS;
      const ahead = Math.floor((this.vx > 0 ? this.x + this.w + 4 : this.x - 4) / TS), ty = Math.floor((this.y + this.h + 2) / TS);
      const edge = !(SOLID[tileAt(this.g.area, ahead, ty)] || tileAt(this.g.area, ahead, ty) === T.SEMI);
      if (this.st <= 0 || this.hitWall || edge) { this.state = 'yell'; this.st = 0.6; this.vx = 0; }
    } else if (this.state === 'yell') {
      this.vx = 0; this.mode = 'yell';
      if (this.st <= 0.3 && !this.yelled) {
        this.yelled = true;
        for (const d of [-1, 1]) fire(this.g, this.cx + d * 14, this.y + this.h - 12, { kind: 'yell', vx: d * 4.2 * TS, w: 18, h: 22, ground: true, life: 2.2, col: '#ffd84a' });
        say(this.g, this, YELLS[this.seed % YELLS.length], '#ffd84a'); sfx('yell', 'crowd', { vol: 0.6 }); this.g.shake(2);
      }
      if (this.st <= 0) { this.state = 'patrol'; this.cool = 2.2; this.yelled = false; this.edgeTurn = true; this.vx = this.dir * this.speed; }
    }
  }
}
/* greeter: wants to hug. Mash jump to wriggle out, or get squeezed */
class Greeter extends Burner {
  constructor(g, s) { super(g, s, 24, 30, 0.9, 'greeter'); this.grabT = 0; this.stunT = 0; }
  think(dt) {
    const p = this.g.player;
    if (this.stunT > 0) { this.stunT -= dt; this.vx = 0; this.mode = 'dizzy'; return; }
    if (this.grabbing) {
      this.vx = 0; this.mode = 'hug';
      this.grabT += dt;
      if (!p || p.grabbedBy !== this) { this.release(false); return; }
      p.x = this.cx + this.dir * 14 - p.w / 2; p.vx = 0; p.vy = 0;
      if (this.grabT > 1.5) { this.release(true); p.grabbedBy = null; p.hurt(this); }
      return;
    }
    this.mode = 'walk';
    if (near(this, p, 8, 2)) { this.dir = sign(p.cx - this.cx) || this.dir; this.vx = this.dir * 1.5 * TS; }
    else if (!this.vx) this.vx = this.dir * this.speed;
  }
  touchPlayer(p) {
    if (this.dead || this.friendT) return;
    if (this.stunT > 0 || this.grabbing) return;
    if (p.invuln > 0 || p.star > 0 || p.grabbedBy || p.mounted) { if (p.mounted) p.hurt(this); return; }
    this.grabbing = true; this.grabT = 0; p.grabbedBy = this; p.grabMash = 0; this.dir = sign(p.cx - this.cx) || 1;
    say(this.g, this, 'WELCOME HOME!', '#ff9ad8'); sfx('greeter_bell', 'gift', { vol: 0.6 });
  }
  release(squeezed) {
    this.grabbing = false; this.stunT = squeezed ? 0.6 : 1.4; this.cool = 1.5;
    const p = this.g.player;
    if (p && p.grabbedBy === this) { p.grabbedBy = null; p.vx = -this.dir * 4 * TS; p.vy = -6 * TS; p.invuln = Math.max(p.invuln, 0.8); }
    if (!squeezed) say(this.g, this, 'OK BYE!', '#ff9ad8');
  }
  stomp(p) { if (this.grabbing) return false; return super.stomp(p); }
}
/* fire spinner: two poi orbit on chains. Headbang (spin jump) bounces off the fire safely */
class Spinner extends Burner {
  constructor(g, s) { super(g, s, 22, 30, 0.8, 'spinner'); this.ang = Math.random() * TAU; this.customCollide = true; this.edgeTurn = true; this.fiery = true; }
  think(dt) { this.ang += 4.4 * dt; if (!this.vx) this.vx = this.dir * this.speed; }
  poi() { const cx = this.cx, cy = this.y + 10, r = 30; return [[cx + Math.cos(this.ang) * r, cy + Math.sin(this.ang) * r], [cx - Math.cos(this.ang) * r, cy - Math.sin(this.ang) * r]]; }
  collidePlayer(p) {
    if (this.dead || this.knocked || this.friendT) return;
    for (const [x, y] of this.poi()) {
      const nx = clamp(x, p.x, p.x + p.w), ny = clamp(y, p.y, p.y + p.h);
      if ((nx - x) ** 2 + (ny - y) ** 2 < 9 * 9) {
        if (p.spin && p.vy > 0 && p.y + p.h < y + 6) { p.vy = -PHYS.stompV; p.jumping = true; this.g.burst(x, y, 6, '#ffb84a', 'spark'); sfx('spin', 'kick', { vol: 0.5 }); return; }
        p.hurt(this); return;
      }
    }
    return 'body';
  }
  paint(ctx, x, y, mode) {
    BurnerArt.draw(ctx, 'spinner', x, y, this.t, this.dir, mode, this);
    if (mode === 'walk' || mode === 'dance') for (const [px, py] of this.poi()) {
      const dx = px - this.cx, dy = py - (this.y + 10);
      ctx.strokeStyle = 'rgba(200,200,210,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - this.h + 10); ctx.lineTo(x + dx, y - this.h + 10 + dy); ctx.stroke();
      Sprites.ember(ctx, x + dx, y - this.h + 10 + dy, 7, this.t);
    }
  }
  get light() { return this.dead ? null : { r: 90, c: 'rgba(255,150,50,' }; }
}
/* sparkle pony: steals your power-up and gallops off. Stomp it to get it back */
class Pony extends Burner {
  constructor(g, s) { super(g, s, 22, 22, 1.2, 'pony'); this.loot = null; this.hopT = 0.4; }
  think(dt) {
    const p = this.g.player;
    if (this.loot) { this.vx = this.fleeDir * 3.8 * TS; this.dir = this.fleeDir; }
    else if (near(this, p, 9, 3)) { this.dir = sign(p.cx - this.cx) || this.dir; this.vx = this.dir * 2.0 * TS; }
    else if (!this.vx) this.vx = this.dir * this.speed;
    if (this.onGround) { this.hopT -= dt; if (this.hopT <= 0) { this.vy = -5.5 * TS; this.onGround = false; this.hopT = 0.35 + Math.random() * 0.3; } }
    if (this.hitWall && this.loot) this.fleeDir = -this.fleeDir;
  }
  touchPlayer(p) {
    if (this.dead || this.friendT || this.loot) { if (this.loot && !this.dead) return; return; }
    if (p.invuln > 0 || p.star > 0) return;
    if (p.mounted) { p.hurt(this); return; }
    let loot = null;
    if (p.power > 0) { loot = p.power === 2 ? 'vinyl' : 'coffee'; p.setPower(p.power - 1, true); Sound.play('powerdown'); }
    else if (p.pack) { loot = p.pack; p.pack = null; }
    if (!loot) { p.hurt(this); return; }
    p.invuln = 1.2; this.loot = loot; this.fleeDir = sign(this.cx - p.cx) || 1;
    say(this.g, this, 'MINE! ✨', '#ff9ad8'); this.g.burst(p.cx, p.cy, 14, '#ffd0f0', 'confetti');
  }
  onDefeat() { if (this.loot) { this.g.spawn(new Item(this.g, this.cx, this.y, this.loot)); say(this.g, this, 'FINE.', '#ff9ad8'); this.loot = null; } }
  hit(kind, src) { const r = super.hit(kind, src); if (r && this.loot && (this.dead || this.friendT)) this.onDefeat(); return r; }
  paint(ctx, x, y, mode) {
    if (mode === 'flat') { Sprites.hopper(ctx, x, y, this.t, '#ff7ad8', this.dir, false); return; }
    Sprites.hopper(ctx, x, y, this.t, '#ff7ad8', this.dir, !this.onGround);
    if (this.loot) { ctx.save(); ctx.globalAlpha = 0.9; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x, y - 36, 11, 0, TAU); ctx.stroke(); ctx.translate(x, y - 26); ctx.scale(0.7, 0.7); Sprites.itemIcon(ctx, 0, 0, this.t, this.loot); ctx.restore(); }
  }
}
/* influencer: ring light warms up, counts down, then a camera flash dazes Brady */
class Influencer extends Burner {
  constructor(g, s) { super(g, s, 22, 30, 0, 'influencer'); this.phase = 'idle'; this.st = 1 + Math.random() * 2; this.vx = 0; }
  think(dt) {
    const p = this.g.player;
    this.vx = 0; this.st -= dt;
    if (p) this.dir = sign(p.cx - this.cx) || this.dir;
    if (this.phase === 'idle') { this.mode = 'pose'; if (this.st <= 0 && near(this, p, 9, 4)) { this.phase = 'charge'; this.st = 0.9; } }
    else if (this.phase === 'charge') { this.mode = 'charge'; if (this.st <= 0) this.flash(); }
    else if (this.phase === 'after') { this.mode = 'pose'; if (this.st <= 0) { this.phase = 'idle'; this.st = 2.2; } }
  }
  flash() {
    const g = this.g, p = g.player;
    this.phase = 'after'; this.st = 0.8;
    sfx('camera_flash', 'laser', { vol: 0.7 }); g.flash = Math.max(g.flash, 0.7);
    g.burst(this.cx + this.dir * 12, this.y + 8, 14, '#ffffff', 'spark');
    if (near(this, p, 7, 3) && lineOfSight(g, this.cx, this.y + 8, p.cx, p.cy) && !p.star) { p.stun(0.9); say(g, this, 'CONTENT!', '#ffffff'); }
  }
  get light() { return this.phase === 'charge' ? { r: 70 + (0.9 - this.st) * 90, c: 'rgba(255,255,255,' } : { r: 46, c: 'rgba(255,240,220,' }; }
}
/* tech bro on an electric unicycle: rushes at Brady, pitches startups in floating bubbles */
class TechBro extends Burner {
  constructor(g, s) {
    super(g, s, 24, 30, 1.5, 'techbro'); this.edgeTurn = !s.chaser; this.state = 'ride'; this.st = 0; this.pitchT = 2 + Math.random() * 2;
    this.chaser = !!s.chaser;
    if (this.chaser) { this.dir = 1; this.vx = s.speed || 7 * TS; this.groundY = this.y; }
  }
  update(dt) {
    if (this.chaser && !this.dead && !this.knocked && !this.friendT) {
      // a chaser rides straight through on his own lane
      this.t += dt; this.x += this.vx * dt; this.y = this.groundY; this.mode = 'rush';
      if (Math.random() < 0.5) this.g.burst(this.x, this.y + this.h, 1, '#38f2ff', 'spark');
      if (this.x > this.g.camX + this.g.viewW + 200) this.remove = true;
      return;
    }
    super.update(dt);
  }
  think(dt) {
    const p = this.g.player;
    this.st -= dt; this.pitchT -= dt;
    if (this.state === 'ride') {
      this.mode = 'ride'; if (!this.vx) this.vx = this.dir * this.speed;
      if (this.cool <= 0 && near(this, p, 8, 1.5) && sign(p.cx - this.cx) === this.dir) { this.state = 'rev'; this.st = 0.4; this.vx = 0; say(this.g, this, 'LETS GOOO', '#38f2ff'); }
      if (this.pitchT <= 0 && near(this, p, 10, 5)) { this.pitchT = 3.6; fire(this.g, this.cx + this.dir * 14, this.y + 4, { kind: 'pitch', text: PITCHES[(this.seed + Math.floor(this.t)) % PITCHES.length], vx: this.dir * 1.2 * TS, vy: -0.6 * TS, homing: 0.5, w: 30, h: 22, life: 6, stompable: true, col: '#38f2ff' }); sfx('pitch_blah', 'select', { vol: 0.4 }); }
    } else if (this.state === 'rev') { this.vx = 0; this.mode = 'rev'; if (this.st <= 0) { this.state = 'rush'; this.st = 1.2; } }
    else if (this.state === 'rush') { this.mode = 'rush'; this.vx = this.dir * 6.5 * TS; if (this.st <= 0 || this.hitWall) { this.state = 'ride'; this.cool = 2.4; this.vx = this.dir * this.speed; } }
  }
  stomp(p) {
    // the bro tumbles off; the unicycle zips away on its own and fizzles
    this.g.spawn(new Shot(this.g, this.cx, this.y + this.h - 8, { kind: 'unicycle', vx: this.dir * 6 * TS, w: 18, h: 18, life: 1.2, thru: true, platform: true }));
    return super.stomp(p);
  }
}
/* crusty old burner: rants slow you down ("it was better in '98") */
class Crusty extends Burner {
  constructor(g, s) { super(g, s, 24, 30, 0.7, 'crusty'); this.perch = !!s.perch; this.edgeTurn = true; this.rantT = 1.5 + Math.random(); if (this.perch) { this.speed = 0; this.vx = 0; } }
  think(dt) {
    const p = this.g.player;
    this.rantT -= dt;
    if (this.perch) { this.vx = 0; if (p) this.dir = sign(p.cx - this.cx) || this.dir; }
    else if (!this.vx) this.vx = this.dir * this.speed;
    if (this.rantT <= 0 && near(this, p, this.perch ? 12 : 9, this.perch ? 8 : 2.5)) {
      this.rantT = this.perch ? 2.4 : 3.0;
      if (!this.perch) this.dir = sign(p.cx - this.cx) || this.dir;
      const txt = RANTS[(this.seed + Math.floor(this.t * 3)) % RANTS.length];
      if (this.perch) fire(this.g, this.cx + this.dir * 20, this.y - 6, { kind: 'rantup', text: txt, vx: this.dir * 0.5 * TS, vy: -1.1 * TS, w: 64, h: 18, life: 6, platform: true, effect: 'slow', thru: true });
      else fire(this.g, this.cx + this.dir * 16, this.y + 8, { kind: 'rant', text: txt, vx: this.dir * 2.6 * TS, w: 50, h: 16, life: 4, effect: 'slow', col: '#e8d0a0' });
      this.mode = 'rant'; this.rantShow = 0.5;
    }
    if (this.rantShow > 0) { this.rantShow -= dt; this.mode = 'rant'; } else this.mode = 'walk';
  }
}
/* orgy-dome creeper: lurks in the dark, lunges when you get close (all bark) */
class Creeper extends Burner {
  constructor(g, s) { super(g, s, 24, 28, 0, 'creeper'); this.state = 'lurk'; this.st = 0; this.vx = 0; this.homeX = this.x; }
  think(dt) {
    const p = this.g.player;
    this.st -= dt;
    if (this.state === 'lurk') { this.vx = 0; if (this.cool <= 0 && near(this, p, 4.5, 2) && this.onGround) { this.state = 'lunge'; this.dir = sign(p.cx - this.cx) || 1; this.vy = -8 * TS; this.vx = this.dir * 4.6 * TS; this.onGround = false; say(this.g, this, LUNGES[this.seed % LUNGES.length], '#ff9ad8'); } }
    else if (this.state === 'lunge') { if (this.onGround && this.vy >= 0) { this.state = 'pause'; this.st = 1.2; this.vx = 0; } }
    else if (this.state === 'pause') { this.vx = 0; if (this.st <= 0) this.state = 'back'; }
    else if (this.state === 'back') { const d = this.homeX - this.x; if (Math.abs(d) < 4 || this.hitWall) { this.state = 'lurk'; this.cool = 1.6; this.vx = 0; } else { this.dir = sign(d); this.vx = this.dir * 1.0 * TS; } }
  }
  paint(ctx, x, y, mode) {
    if (this.state === 'lurk' && mode === 'walk') {
      ctx.save(); ctx.globalAlpha = 0.45; Sprites.wisp(ctx, x, y - 14, this.t, '#ff9ad8'); ctx.restore();
      ctx.fillStyle = '#ffd84a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * 3 + this.dir, y - 24, 1.4, 0, TAU); ctx.fill(); }
      return;
    }
    Sprites.wisp(ctx, x, y - 14, this.t, '#ff9ad8');
  }
  get light() { return this.state === 'lurk' ? null : { r: 40, c: 'rgba(255,150,220,' }; }
}
/* DPW worker: two stomps (hat first), throws wrenches, swings rebar up close */
class Dpw extends Burner {
  constructor(g, s) { super(g, s, 24, 30, 1.0, 'dpw'); this.hat = true; this.edgeTurn = true; this.swingT = 0; this.windT = 0; this.throwT = 1.5 + Math.random(); this.safeT = 0; }
  think(dt) {
    const p = this.g.player;
    this.throwT -= dt; if (this.safeT > 0) this.safeT -= dt;
    if (this.windT > 0) { this.windT -= dt; this.vx = 0; this.mode = 'windup'; if (this.windT <= 0) this.swingT = 0.28; return; }
    if (this.swingT > 0) {
      this.swingT -= dt; this.vx = 0; this.mode = 'swing';
      const zone = { x: this.dir > 0 ? this.x + this.w : this.x - 36, y: this.y - 6, w: 36, h: this.h + 6 };
      if (p && !p.dead && overlap(zone, p)) p.hurt(this);
      return;
    }
    this.mode = this.hat ? 'walk' : 'angry';
    const sp = this.hat ? this.speed : 1.7 * TS;
    if (!this.vx || Math.abs(this.vx) < sp * 0.9) this.vx = this.dir * sp;
    if (near(this, p, 1.6, 1) && this.cool <= 0) { this.dir = sign(p.cx - this.cx) || this.dir; this.windT = 0.35; this.cool = 1.6; return; }
    if (this.throwT <= 0 && near(this, p, 8, 4)) {
      this.throwT = this.hat ? 2.6 : 1.8; this.dir = sign(p.cx - this.cx) || this.dir;
      fire(this.g, this.cx + this.dir * 10, this.y + 4, { kind: 'wrench', vx: this.dir * 3.4 * TS, vy: -8.5 * TS, grav: PHYS.gDown * 0.45, w: 14, h: 14, life: 3, thru: true });
      Sound.play('throw', { vol: 0.5 });
    }
  }
  stomp(p) {
    if (this.safeT > 0) return true;
    if (this.hat) {
      this.hat = false; this.safeT = 0.3; Sound.play('bump'); say(this.g, this, 'HEY!', '#ff8a1a');
      this.g.burst(this.cx, this.y, 6, '#f2c23a', 'debris'); this.dir = sign(p.cx - this.cx) || this.dir; return true;
    }
    return super.stomp(p);
  }
  hit(kind, src) { if (kind === 'spin' && !this.dead) { this.hat = false; return super.stomp(src); } return super.hit(kind, src); }
}
/* pagan witch on a broom: sways overhead and drops crystals */
class Witch extends Ent {
  constructor(g, s) {
    super(g, s, 26, 20); this.enemy = true; this.hx = this.x; this.hy = this.y; this.range = (2.5 + Math.random() * 2) * TS; this.dropT = 1.5 + Math.random();
  }
  update(dt) {
    this.t += dt;
    if (this.knocked) return this.updateKnocked(dt);
    if (this.updateFriend(dt)) { this.y -= 20 * dt; return; }
    const nx = this.hx + Math.sin(this.t * 0.8) * this.range;
    this.dir = sign(nx - this.x) || this.dir; this.x = nx; this.y = this.hy + Math.sin(this.t * 2.4) * 10;
    const p = this.g.player;
    this.dropT -= dt;
    if (this.dropT <= 0 && p && !p.dead && Math.abs(p.cx - this.cx) < 1.6 * TS && p.y > this.y) {
      this.dropT = 2.2;
      fire(this.g, this.cx, this.y + this.h, { kind: 'crystal', vy: 1 * TS, grav: PHYS.gDown * 0.5, w: 12, h: 16, life: 3, col: '#7affd8' });
      sfx('lsd', 'appear', { vol: 0.25 });
    }
  }
  hit(kind, src) {
    if (this.dead) return false;
    if (kind === 'love' || kind === 'hug') return this.befriend();
    if (kind === 'stomp' || kind === 'spin') { this.knockOff(0); Sound.play('stomp'); return true; }
    this.knockOff(src && src.vx ? sign(src.vx) : 1); return true;
  }
  touchPlayer(p) { if (!this.dead && !this.friendT) p.hurt(this); }
  draw(ctx) {
    if (this.knocked) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(this.spin || 0); Sprites.flapper(ctx, 0, 10, this.t, '#5a2a8a', this.dir); ctx.restore(); return; }
    if (this.friendT) { this.drawFriend(ctx, c => Sprites.flapper(c, 0, 0, this.t, '#ff7ab8', this.dir)); return; }
    Sprites.flapper(ctx, this.cx, this.y + this.h, this.t, '#5a2a8a', this.dir);
  }
}
/* LED jellyfish: its bell is a safe, bouncy top; the tentacles sting */
class LedJelly extends Ent {
  constructor(g, s) { super(g, s, 28, 26); this.enemy = true; this.hx = this.x; this.hy = this.y; this.col = ['#38f2ff', '#ff4fd8', '#7aff6a', '#c87aff'][Math.floor(Math.random() * 4)]; this.flashT = 0; this.fiery = true; }
  update(dt) { this.t += dt; if (this.flashT > 0) this.flashT -= dt; this.y = this.hy + Math.sin(this.t * 1.2) * 18; this.x = this.hx + Math.sin(this.t * 0.5) * 20; }
  hit(kind, src) { if (kind === 'stomp' || kind === 'spin') { this.flashT = 0.3; sfx('lsd', 'spring', { vol: 0.4 }); return 'bounce'; } if (kind === 'disc' || kind === 'star' || kind === 'love') { this.knockOff(1); return true; } return false; }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) { BurnerArt.draw(ctx, 'ledjelly', this.cx, this.y + this.h, this.t, 1, this.flashT > 0 ? 'flash' : 'walk', this); }
  get light() { return { r: 80, c: 'rgba(' + hexToRgb(this.col).join(',') + ',' }; }
}
/* dust devil: a little whirlwind that scoops Brady up and tosses him (no harm, just chaos) */
class Devil extends Ent {
  constructor(g, s) { super(g, s, 30, 56); this.enemy = false; this.dir = Math.random() < 0.5 ? -1 : 1; this.cool = 0; this.turnT = 2 + Math.random() * 2; }
  update(dt) {
    this.t += dt; this.cool -= dt; this.turnT -= dt;
    if (this.turnT <= 0) { this.dir = -this.dir; this.turnT = 2 + Math.random() * 2.5; }
    this.vx = this.dir * 1.6 * TS; this.vy += PHYS.gDown * dt;
    const vx = this.vx; moveBody(this, this.g.area, dt, { semis: true }); if (this.hitWall) { this.dir = -sign(vx); }
    if (this.y > this.g.area.H * TS + 60) this.remove = true;
  }
  touchPlayer(p) {
    if (this.cool > 0 || p.dead) return;
    this.cool = 1.0; p.vy = -15 * TS; p.vx = (Math.random() < 0.5 ? -1 : 1) * 4 * TS; p.jumping = false; p.onGround = false; p.spinVis = 0.8;
    say(this.g, this, 'WHOOSH', '#e8d8c0'); sfx('wind', null, { vol: 0.5 }); this.g.burst(this.cx, this.cy, 12, '#e8d8c0', 'dust');
  }
  hit() { return false; }
  draw(ctx) { BurnerArt.draw(ctx, 'devil', this.cx, this.y + this.h, this.t, this.dir, 'walk', this); }
}
/* bike thief: pedals fast, snatches ten glow sticks and flees */
class Thief extends Burner {
  constructor(g, s) { super(g, s, 26, 28, 3.0, 'thief'); this.loot = 0; this.edgeTurn = true; }
  think(dt) {
    if (this.loot) { this.vx = this.fleeDir * 5 * TS; this.dir = this.fleeDir; if (this.hitWall) this.fleeDir = -this.fleeDir; return; }
    if (!this.vx || Math.abs(this.vx) < this.speed * 0.9) this.vx = this.dir * this.speed;
  }
  touchPlayer(p) {
    if (this.dead || this.friendT || this.loot) return;
    if (p.invuln > 0 || p.star > 0) return;
    const n = Math.min(10, this.g.picks);
    if (n < 3 || p.mounted) { p.hurt(this); return; }
    this.g.picks -= n; Save.data.picks = this.g.picks; this.loot = n; this.fleeDir = sign(this.cx - p.cx) || 1; p.invuln = 1;
    say(this.g, this, '-' + n + ' GLOW STICKS', '#ffd84a'); Sound.play('powerdown', { vol: 0.5 });
  }
  onDefeat() { if (this.loot) { for (let i = 0; i < this.loot; i++) setTimeout(() => { if (Game.scene === this.g) { this.g.spawn(new PickPop(this.g, this.cx + (Math.random() - 0.5) * 20, this.y)); this.g.addPick(); } }, i * 60); this.loot = 0; } }
  hit(kind, src) { const r = super.hit(kind, src); if (r && this.loot && (this.dead || this.friendT)) this.onDefeat(); return r; }
}
/* slam poet: fires a fan of verse */
class Poet extends Burner {
  constructor(g, s) { super(g, s, 22, 30, 0, 'poet'); this.vx = 0; this.volT = 1 + Math.random() * 2; }
  think(dt) {
    const p = this.g.player;
    this.vx = 0; if (p) this.dir = sign(p.cx - this.cx) || this.dir;
    this.volT -= dt;
    if (this.volT <= 0 && near(this, p, 10, 5)) {
      this.volT = 3.1; this.mode = 'recite'; this.reciteT = 0.5;
      for (let k = -1; k <= 1; k++) fire(this.g, this.cx + this.dir * 14, this.y + 6, { kind: 'verse', text: VERSES[(this.seed + k + 1 + Math.floor(this.t)) % VERSES.length], vx: this.dir * 3.1 * TS, vy: k * 1.3 * TS, w: 34, h: 14, life: 4, col: '#ffd84a' });
      sfx('pitch_blah', 'select', { vol: 0.35 });
    }
    if (this.reciteT > 0) this.reciteT -= dt; else this.mode = 'snap';
  }
}
/* World 22: walking letters and ink blots */
class Glyph extends Burner {
  constructor(g, s) { super(g, s, 22, 28, 1.3, 'glyph'); this.letter = 'ABCDEFGHJKMNPRSTWXYZ'[Math.floor(Math.random() * 20)]; }
  think(dt) {
    if (!this.vx) this.vx = this.dir * this.speed;
    // hop over gaps instead of falling in
    if (this.onGround) {
      const ahead = Math.floor((this.vx > 0 ? this.x + this.w + 3 : this.x - 3) / TS), ty = Math.floor((this.y + this.h + 2) / TS);
      if (!(SOLID[tileAt(this.g.area, ahead, ty)] || tileAt(this.g.area, ahead, ty) === T.SEMI)) { this.vy = -10 * TS; this.onGround = false; }
    }
  }
}
class Inkblot extends Burner {
  constructor(g, s) { super(g, s, s.small ? 16 : 26, s.small ? 12 : 18, s.small ? 2 : 1.3, 'inkblot'); this.small = !!s.small; this.edgeTurn = true; }
  think(dt) { if (!this.vx) this.vx = this.dir * this.speed; }
  stomp(p) {
    if (!this.small) { for (const d of [-1, 1]) { const b = new Inkblot(this.g, { x: this.cx + d * 10, y: this.y + this.h, small: true, dir: d }); b.vy = -6 * TS; this.g.spawn(b); } }
    return super.stomp(p);
  }
}
/* gift-giving burner: touch them and they hand over a power-up */
class Gifter extends Ent {
  constructor(g, s) { super(g, s, 24, 34); this.give = s.give || 'coffee'; this.lookName = s.look || 'kandi'; this.given = false; this.waveT = 0; }
  update(dt) { this.t += dt; if (this.waveT > 0) this.waveT -= dt; }
  touchPlayer(p) {
    if (this.given || p.dead) return;
    this.given = true; this.waveT = 2;
    const it = new Item(this.g, this.cx, this.y - 6, this.give); it.emerge = 0.01; it.vy = -6 * TS; this.g.spawn(it);
    say(this.g, this, 'A GIFT FOR YOU!', '#7affd8'); sfx('gift', 'appear');
    this.g.burst(this.cx, this.y, 16, '#fff', 'confetti');
  }
  draw(ctx) { BurnerArt.draw(ctx, 'gifter', this.cx, this.y + this.h, this.t, -1, this.given ? 'wave' : 'offer', this); }
  get light() { return { r: 60, c: 'rgba(170,255,220,' }; }
}

Object.assign(ENTITY_TYPES, {
  driver: Driver, hippie: Hippie, raver: Raver, camplead: CampLead, greeter: Greeter, spinner: Spinner, pony: Pony,
  influencer: Influencer, techbro: TechBro, crusty: Crusty, creeper: Creeper, dpw: Dpw, witch: Witch, ledjelly: LedJelly,
  devil: Devil, thief: Thief, poet: Poet, glyph: Glyph, inkblot: Inkblot, gifter: Gifter
});
