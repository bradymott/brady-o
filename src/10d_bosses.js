/* ============================================================
   Bosses: one framework, a different brain for every boss.
   Each brain cycles its own attacks and opens one window where
   the boss can be stomped (puke balls chip away at any time).
   ============================================================ */
const BOSS_INFO = {
  greeter: { name: 'Head Greeter', hp: 3, dims: [64, 84] },
  camplead: { name: 'Head Camp Lead', hp: 3, dims: [56, 80] },
  barista: { name: 'Barista Bot', hp: 4, dims: [64, 80] },
  dj: { name: 'DJ Wub-Lord', hp: 4, dims: [72, 96] },
  witch: { name: 'Grand Witch Moonbeam', hp: 4, dims: [60, 100], floats: true },
  geyser: { name: 'Geyser Guardian', hp: 4, dims: [80, 74] },
  dustdevil: { name: 'Dust Devil Diablo', hp: 5, dims: [64, 100], floats: true },
  forklift: { name: 'Forklift Frank', hp: 3, dims: [88, 64] },
  rusty: { name: 'DPW Foreman Rusty', hp: 5, dims: [62, 96] },
  pony: { name: 'The Glitter Queen', hp: 3, dims: [72, 72] },
  bouncer: { name: 'Bouncer Brutus', hp: 6, dims: [68, 92] },
  archivist: { name: 'The Archivist', hp: 6, dims: [60, 80], floats: true },
  man: { name: 'THE MAN', hp: 7, dims: [44, 110], floats: true }
};
function bossDisplayName(style) { return (BOSS_INFO[style] || BOSS_INFO.greeter).name; }

/* Hurt flash: the boss is painted into a scratch canvas and tinted there, so only its own pixels light up
   (never a box over the background). Returns false when the scratch canvas is unavailable. */
const BossFx = {
  scratch: null,
  tinted(ctx, b, paint, col, alpha) {
    const m = ctx.getTransform ? ctx.getTransform() : null;
    if (!m) return false;
    const S = m.a, pad = Math.max(80, b.w);
    const w = Math.ceil((b.w + pad * 2) * S), h = Math.ceil((b.h + pad * 2) * S);
    if (!this.scratch) this.scratch = makeCanvas(w, h);
    const c = this.scratch;
    if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); }
    const sc = c.getContext('2d');
    sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, w, h);
    sc.setTransform(S, 0, 0, S, -(b.x - pad) * S, -(b.y - pad) * S);
    paint(sc);
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.globalCompositeOperation = 'source-atop'; sc.globalAlpha = alpha; sc.fillStyle = col; sc.fillRect(0, 0, w, h);
    sc.globalCompositeOperation = 'source-over'; sc.globalAlpha = 1;
    ctx.drawImage(c, 0, 0, w, h, b.x - pad, b.y - pad, w / S, h / S);
    return true;
  }
};

class Boss extends Ent {
  constructor(g, s) {
    const style = s.style || 'greeter';
    const info = BOSS_INFO[style] || BOSS_INFO.greeter;
    super(g, s, info.dims[0], info.dims[1]);
    this.style = style; this.info = info; this.world = s.world; this.boss = true; this.enemy = true; this.mid = !!s.mid;
    this.arenaX0 = s.arenaX0 * TS; this.arenaX1 = (s.arenaX1 || s.doorX) * TS; this.doorX = s.doorX;
    this.floorY = s.y; this.hx = this.x;
    this.maxHp = info.hp; this.hp = this.maxHp;
    this.state = 'sleep'; this.timer = 0; this.hurtT = 0; this.dir = -1; this.squash = 0; this.hush = !!info.floats;
    this.name = info.name.toUpperCase();
    this.homeY = this.y; this.act = 'idle'; this.at = 0; this.cycle = 0; this.vuln = false; this.guard = 'hurt';
    this.brain = BOSS_BRAINS[style] || BOSS_BRAINS.greeter;
  }
  get aggression() { return 1 + (1 - this.hp / this.maxHp) * 0.6; }
  go(act) { this.act = act; this.at = 0; this.first = true; this.goN = (this.goN || 0) + 1; this.vuln = false; this.guard = 'hurt'; this.pose = act; }
  face() { const p = this.g.player; if (p) this.dir = p.cx < this.cx ? -1 : 1; }
  walk(sp) { this.vx = this.dir * sp * TS * this.aggression; }
  fall(dt) { this.vy += PHYS.gDown * 0.8 * dt; if (this.vy > PHYS.maxFall) this.vy = PHYS.maxFall; moveBody(this, this.g.area, dt, { semis: false }); }
  hover(dt, ty, tx) {
    this.y = approach(this.y, ty, 6 * TS * dt);
    if (tx !== undefined) this.x = approach(this.x, tx - this.w / 2, 5 * TS * dt * this.aggression);
  }
  clampArena() { this.x = clamp(this.x, this.arenaX0, this.arenaX1 - this.w); }
  shoot(o) { return fire(this.g, o.x, o.y, o); }
  update(dt) {
    this.t += dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    if (this.rings) { for (const r of this.rings) r.t += dt; this.rings = this.rings.filter(r => r.t < 0.45); if (!this.rings.length) this.rings = null; }
    this.squash = approach(this.squash, 0, dt * 4);
    const p = this.g.player;
    if (this.state === 'sleep') {
      const inside = p && p.x > this.arenaX0 + TS && p.x < this.arenaX1 && Math.abs(p.y + p.h - this.floorY) < 5 * TS;
      if (inside) { this.state = 'intro'; this.timer = 1.6; this.g.bossStart(this); this.brain.wake && this.brain.wake(this); }
      if (!this.hush) this.fall(dt);
      return;
    }
    if (this.state === 'dying') {
      this.timer -= dt;
      if (Math.random() < 0.4) this.g.burst(this.x + Math.random() * this.w, this.y + Math.random() * this.h, 6, '#ffd84a', 'spark');
      if (this.timer <= 0) { this.remove = true; this.g.bossDefeated(this); }
      return;
    }
    if (this.state === 'intro') { this.timer -= dt; this.face(); if (this.timer <= 0) { this.state = 'fight'; this.go('walk'); } if (!this.hush) this.fall(dt); return; }
    this.at += dt;
    // an act started (go) during this update keeps `first` for its own first update, so its setup runs
    const goN = this.goN;
    this.brain.update(this, dt);
    if (this.goN === goN) this.first = false;
    this.clampArena();
  }
  /* hit(kind, src): how the world reaches the boss.
     kinds: stomp / spin (Brady from above), bump (Brady's head from below), disc (smoke puffs), laser, star,
            prop (a kicked or thrown world object, src = the TourProp), hazard (the arena: lava, falling things, src = whatever),
            and any signature-item kind the country defines (taco, bell, tomato, ...).
     A brain may define hit(b, kind, src) and return true (took damage; it calls b.damage itself), 'bounce' (Brady bounces
     off safely), false (ignored) or undefined (fall through to the defaults below). The defaults: stomp/spin while
     b.vuln, disc chips, star hits; everything else is ignored unless the brain handles it. */
  hit(kind, src) {
    if (this.state !== 'fight' || this.hurtT > 0) return false;
    if (this.brain.hit) { const r = this.brain.hit(this, kind, src); if (r !== undefined) return r; }
    if (kind === 'stomp' || kind === 'spin') {
      if (this.vuln) { this.damage(1); return true; }
      return this.guard === 'bounce' ? 'bounce' : false;
    }
    if (kind === 'disc') { if (this.brain.noDisc && this.brain.noDisc(this)) return false; this.damage(0.34); return true; }
    if (kind === 'star') { this.damage(1); return true; }
    return false;
  }
  /* damage(n, o): o.quiet skips the hurt reaction, o.text floats a word, o.col tints the flash. Phases: a brain with
     phases: [hp, hp, ...] (descending thresholds) gets brain.phase(b, n) once each time hp drops to or below one. */
  damage(n, o) {
    o = o || {};
    const p = this.g.player;
    this.hp -= n; this.hurtT = n >= 1 ? 1.0 : 0.3; this.squash = 1; this.flashCol = o.col || null;
    Sound.play('bossHit'); this.g.shake(n >= 1 ? 7 : 3); this.g.burst(this.cx, this.cy, n >= 1 ? 22 : 8, '#ffffff', 'spark');
    if (n >= 1) { this.g.burst(this.cx, this.cy, 10, '#ffd84a', 'confetti'); this.g.hitStop = Math.max(this.g.hitStop || 0, 0.08); this.rings = (this.rings || []).concat([{ t: 0, x: this.cx, y: this.cy }]); }
    if (o.text) this.g.parts.text(this.cx, this.y - 14, o.text, o.col || '#ffffff');
    // landing a hit never costs Brady the hit back: a short grace period
    if (p && !p.dead) p.invuln = Math.max(p.invuln || 0, 0.7);
    if (this.hp <= 0.01) { if (this.brain.lastHit && this.brain.lastHit(this)) return; this.die(); return; }
    if (this.brain.phases) {
      const ph = this.phase || 1;
      let n2 = ph; for (let k = 0; k < this.brain.phases.length; k++) if (this.hp <= this.brain.phases[k] + 0.01) n2 = Math.max(n2, k + 2);
      if (n2 > ph) { this.phase = n2; if (this.brain.phase) { this.brain.phase(this, n2); return; } }
    }
    if (n >= 1 && !o.quiet) { this.brain.hurt ? this.brain.hurt(this) : this.go('walk'); }
  }
  die() { this.state = 'dying'; this.timer = 1.6; this.vx = 0; this.vuln = false; Sound.play('bossDie'); this.g.shake(14); }
  touchPlayer(p) {
    if (this.state === 'sleep' || this.state === 'dying' || this.state === 'intro') return;
    if (this.brain.touch && this.brain.touch(this, p)) return;
    if (p.vy > 0 && p.prevBottom <= this.y + this.h * 0.35) {
      const r = this.hit(p.spin ? 'spin' : 'stomp', p);
      if (r) { p.vy = -PHYS.stompVHeld; p.jumping = true; p.y = Math.min(p.y, this.y - p.h - 1); if (r === true) this.g.addScore(1000, this.cx, this.y); else this.g.parts.text(this.cx, this.y - 8, this.brain.guardText || 'NOPE', '#ffd84a'); return; }
    }
    // rising off the top after a bounce or a stomp: never a hit
    if (p.vy < 0 && p.y + p.h < this.y + 12) return;
    // a headbutt from below (the bottom of the boss) reaches brains that accept 'bump'
    if (p.vy < 0 && p.prevBottom - p.h >= this.y + this.h * 0.7) {
      const r = this.hit('bump', p);
      if (r) { p.vy = Math.max(p.vy, 2 * TS); if (r === true) this.g.addScore(1000, this.cx, this.y); return; }
    }
    // while the boss reels (or offers its weak spot) it is harmless: Brady just gets nudged off
    if (this.hurtT > 0 || this.vuln) { p.x += (p.cx < this.cx ? -1 : 1) * 2; return; }
    p.hurt(this);
  }
  draw(ctx) {
    ctx.save();
    if (this.state === 'dying') ctx.globalAlpha = Math.max(0, this.timer / 1.6);
    const art = c => { if (this.brain.draw) this.brain.draw(this, c, this.t); else BossArt.draw(c, this, this.t); };
    const paint = c => Ink.around(c, this.x, this.y, this.w, this.h, art, { pad: Math.max(60, this.w), width: 1.8 });
    const flashing = this.hurtT > 0 && this.state === 'fight' && Math.floor(this.hurtT * 24) % 2 === 0;
    if (flashing && !BossFx.tinted(ctx, this, paint, this.flashCol || '#ffffff', 0.85)) paint(ctx);
    else paint(ctx);
    // hit rings: a quick shockwave from each hit, the clear sign that it counted
    if (this.rings) {
      for (const r of this.rings) { const k = r.t / 0.45; ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - k)})`; ctx.lineWidth = 4 * (1 - k) + 1; ctx.beginPath(); ctx.arc(r.x, r.y, 10 + k * 70, 0, TAU); ctx.stroke(); }
    }
    if (this.vuln && this.state === 'fight') { ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(this.t * 10)})`; ctx.font = `12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('▼', this.cx, this.y - 12 + Math.sin(this.t * 6) * 3); }
    ctx.restore();
  }
  get light() { return { r: 150, c: 'rgba(220,180,255,' }; }
}
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const groundWave = (b, kind, sp, col) => { for (const d of [-1, 1]) b.shoot({ x: b.cx + d * (b.w / 2 + 8), y: b.floorY - 14, kind, vx: d * sp * TS, w: 20, h: 26, ground: true, life: 3, col }); };

const BOSS_BRAINS = {
  /* Head Greeter: hug lunges and bell shockwaves; when he flops down to make a dust angel, stomp his belly */
  greeter: {
    guardText: 'HUG FIRST!',
    update(b, dt) {
      const p = b.g.player;
      b.guard = 'bounce';
      if (b.act === 'walk') { b.face(); b.walk(1.5); b.pose = 'walk'; if (b.at > 1.4) { b.cycle++; b.go(b.cycle % 3 === 0 ? 'angel' : (b.cycle % 3 === 1 ? 'hug' : 'bell')); } }
      else if (b.act === 'hug') { if (b.at < 0.5) { b.vx = 0; b.pose = 'arms'; } else { b.walk(5.2); b.pose = 'hug'; } if (b.at > 1.4 || b.hitWall) b.go('walk'); }
      else if (b.act === 'bell') {
        b.vx = 0; b.pose = b.at < 0.7 ? 'bellup' : 'bell';
        if (b.first) b.rings = 0;
        if (b.at > 0.7 + b.rings * 0.45 && b.rings < 2) { b.rings++; groundWave(b, 'bellwave', 4.4, '#ffd84a'); sfx('greeter_bell', 'checkpoint'); b.g.shake(4); }
        if (b.at > 1.8) b.go('walk');
      }
      else if (b.act === 'angel') {
        b.vx = 0; b.pose = 'angel';
        if (b.first) { b.g.dustLevel = 1; say(b.g, b, 'DUST ANGEL!', '#ffe8c8'); b.g.burst(b.cx, b.y + b.h, 30, '#e8d8c0', 'dust'); }
        b.vuln = b.at > 0.4 && b.at < 2.8; b.guard = b.vuln ? 'hurt' : 'bounce';
        if (b.at > 3) b.go('walk');
      }
      b.fall(dt);
    },
    hurt(b) { b.go('walk'); b.vx = -b.dir * 5 * TS; say(b.g, b, 'OOF! WELCOME HOME!', '#ff9ad8'); },
    draw(b, ctx, t) { BossArt.draw(ctx, b, t); }
  },
  /* Head Camp Lead: clipboard charges into the walls (dazed = stomp time), yells, flings clipboards */
  camplead: {
    update(b, dt) {
      if (b.act === 'walk') { b.face(); b.walk(1.2); b.pose = 'walk'; if (b.at > 1.0) { b.cycle++; b.go(b.cycle % 2 ? 'charge' : 'yell'); } }
      else if (b.act === 'charge') { if (b.at < 0.5) { b.vx = 0; b.pose = 'notice'; if (b.first) say(b.g, b, 'YOU! IN THE LINE!', '#ffd84a'); } else { b.walk(6); b.pose = 'charge'; if (b.hitWall || b.x <= b.arenaX0 + 1 || b.x >= b.arenaX1 - b.w - 1) { b.g.shake(6); Sound.play('bump'); b.go('dazed'); } } if (b.at > 3) b.go('walk'); }
      else if (b.act === 'dazed') { b.vx = 0; b.pose = 'dazed'; b.vuln = true; if (b.at > 1.8) b.go('walk'); }
      else if (b.act === 'yell') {
        b.vx = 0; b.pose = 'yell';
        if (b.first) { groundWave(b, 'yell', 4.6, '#ffd84a'); say(b.g, b, pick(YELLS), '#ffd84a'); sfx('yell', 'crowd'); }
        if (b.at > 0.6 && !b.thrown) { b.thrown = true; b.face(); for (let k = 0; k < 2; k++) b.shoot({ x: b.cx, y: b.y + 10, kind: 'clipboard', vx: b.dir * (3 + k * 1.4) * TS, vy: -9 * TS, grav: PHYS.gDown * 0.5, w: 18, h: 18, life: 3, thru: true }); }
        if (b.at > 1.3) { b.thrown = false; b.go('walk'); }
      }
      b.fall(dt);
    }
  },
  /* Barista Bot: steam blasts, lobbed espresso, sticky foam; when it overheats, stomp the valve */
  barista: {
    guardText: 'TOO HOT',
    update(b, dt) {
      b.guard = 'hurt';
      if (b.act === 'walk') { b.face(); b.walk(1.3); b.pose = 'walk'; if (b.at > 1.2) { b.cycle++; b.go(b.cycle % 3 === 0 ? 'overheat' : (b.cycle % 3 === 1 ? 'steam' : 'cups')); } }
      else if (b.act === 'steam') {
        b.vx = 0; b.pose = b.at < 0.6 ? 'charge' : 'steam';
        if (b.at > 0.6 && b.at < 1.4 && Math.floor(b.at * 12) !== Math.floor((b.at - dt) * 12)) b.shoot({ x: b.cx + b.dir * 34, y: b.y + 30 + Math.sin(b.at * 20) * 6, kind: 'steam', vx: b.dir * 7 * TS, w: 22, h: 18, life: 0.8, thru: true, col: '#f0f0ff' });
        if (b.at > 1.8) b.go('walk');
      }
      else if (b.act === 'cups') {
        b.vx = 0; b.pose = 'pour';
        if (b.first) { const p = b.g.player; for (let k = 0; k < 3; k++) { const dx = (p ? p.cx - b.cx : 0) * (0.6 + k * 0.25); b.shoot({ x: b.cx, y: b.y + 8, kind: 'espresso', vx: dx / 1.1, vy: -11 * TS, grav: PHYS.gDown * 0.55, w: 16, h: 16, life: 3, thru: true, col: '#8a5a3a' }); } }
        if (b.at > 0.5 && !b.foamed) { b.foamed = true; for (let k = -1; k <= 1; k += 2) b.shoot({ x: b.cx + k * 70, y: b.floorY - 8, kind: 'foam', vx: k * 0.8 * TS, w: 50, h: 14, life: 4.5, effect: 'slow', ground: true, col: '#f4ecdc' }); }
        if (b.at > 1.4) { b.foamed = false; b.go('walk'); }
      }
      else if (b.act === 'overheat') { b.vx = 0; b.pose = 'overheat'; if (b.first) say(b.g, b, 'OVERHEATING...', '#ff6a3a'); b.vuln = b.at > 0.3 && b.at < 2.6; if (b.at > 2.8) b.go('walk'); }
      b.fall(dt);
    }
  },
  /* DJ Wub-Lord: bass drops and lasers from the booth, then he hops down to dance (stomp him) */
  dj: {
    wake(b) { b.boothX = b.x; b.boothY = b.y; },
    update(b, dt) {
      if (b.act === 'walk') { b.vx = 0; b.face(); b.pose = 'spin'; if (b.at > 1.0) { b.cycle++; b.go(['drop', 'lasers', 'drop', 'crowd', 'dance'][b.cycle % 5]); } }
      else if (b.act === 'drop') {
        b.vx = 0; b.pose = 'drop';
        if (b.first) { b.n = 0; say(b.g, b, 'DROP IT!', '#38f2ff'); }
        if (b.at > 0.5 + b.n * 0.45 && b.n < 3) { b.n++; b.shoot({ x: b.cx - b.w / 2 - 10, y: b.floorY - 14, kind: 'bass', vx: -4.8 * TS, w: 18, h: 26 + b.n * 4, ground: true, life: 3, col: '#ff4fd8' }); Sound.play('stomp', { pitch: 0.5 }); b.g.shake(3); }
        if (b.at > 2) b.go('walk');
      }
      else if (b.act === 'lasers') {
        b.vx = 0; b.pose = 'lasers';
        if (b.first) { b.sweep = new Sweeper(b.g, { x: b.cx - 10, y: b.y + 36, len: 9, speed: -1.4 }); b.g.spawn(b.sweep); }
        if (b.at > 2.6) { if (b.sweep) b.sweep.remove = true; b.go('walk'); }
      }
      else if (b.act === 'crowd') {
        b.vx = 0; b.pose = 'hype';
        if (b.first) { for (const x of [b.arenaX0 + 2 * TS, b.arenaX0 + 8 * TS]) { const r = new Raver(b.g, { x, y: b.floorY - 40, dir: 1 }); b.g.spawn(r); } say(b.g, b, 'MAKE SOME NOISE!', '#ff4fd8'); }
        if (b.at > 1.2) b.go('walk');
      }
      else if (b.act === 'dance') {
        // down off the riser onto the dance floor: open season
        b.pose = 'dance';
        if (b.first) { b.vy = -10 * TS; b.vx = -3 * TS; }
        if (b.onGround && b.at > 0.4) { b.vx = Math.sin(b.at * 3) * 2 * TS; b.vuln = true; }
        if (b.at > 3.6) { b.go('return'); }
      }
      else if (b.act === 'return') { b.pose = 'jump'; if (b.first) { b.vy = -15 * TS; } b.x = approach(b.x, b.boothX, 6 * TS * dt); if (b.at > 0.6 && b.onGround) b.go('walk'); }
      b.fall(dt);
    },
    hurt(b) { b.go('return'); }
  },
  /* Grand Witch Moonbeam: crystal rain, summoned broom witches, teleports, then a low swoop (stomp) */
  witch: {
    update(b, dt) {
      const p = b.g.player;
      b.face();
      if (b.act === 'walk') { b.hover(dt, b.floorY - b.h - 4 * TS + Math.sin(b.t * 2) * 12, p ? p.cx + Math.sin(b.t) * 3 * TS : undefined); if (b.at > 1.8) { b.cycle++; b.go(['rain', 'teleport', 'brooms', 'swoop'][b.cycle % 4]); } }
      else if (b.act === 'rain') {
        b.hover(dt, b.floorY - b.h - 4.5 * TS);
        if (b.first) b.n = 0;
        if (b.at > 0.3 + b.n * 0.22 && b.n < 6) { b.n++; const x = (p ? p.cx : b.cx) + (Math.random() - 0.5) * 6 * TS; b.shoot({ x, y: b.floorY - 11 * TS, kind: 'crystal', vy: 2 * TS, grav: PHYS.gDown * 0.4, w: 12, h: 18, life: 3, col: '#7affd8', thru: true }); }
        if (b.at > 2) b.go('walk');
      }
      else if (b.act === 'teleport') { b.alphaT = Math.min(1, b.at * 2); if (b.at > 0.7) { b.x = clamp((p ? p.cx : b.cx) + pick([-1, 1]) * 5 * TS - b.w / 2, b.arenaX0, b.arenaX1 - b.w); Sound.play('portal'); b.alphaT = 0; b.go('swoop'); } }
      else if (b.act === 'brooms') { b.hover(dt, b.floorY - b.h - 5 * TS); if (b.first) { for (const k of [-1, 1]) b.g.spawn(new Witch(b.g, { x: b.cx + k * 4 * TS, y: b.floorY - 6 * TS })); say(b.g, b, 'SISTERS! TO ME!', '#c8a0ff'); } if (b.at > 1.4) b.go('walk'); }
      else if (b.act === 'swoop') { b.vuln = b.at > 0.6 && b.at < 2.6; b.y = approach(b.y, b.floorY - b.h - (b.at < 2.2 ? 0.2 * TS : 3 * TS), 7 * TS * dt); b.x += b.dir * 2 * TS * dt; if (b.at > 2.8) b.go('walk'); }
    },
    draw(b, ctx, t) { ctx.save(); if (b.act === 'teleport') ctx.globalAlpha = Math.max(0.1, 1 - (b.alphaT || 0)); BossArt.draw(ctx, b, t); ctx.restore(); }
  },
  /* Geyser Guardian: geysers under your feet, hot mud, dives; stomp the head when it surfaces to roar */
  geyser: {
    update(b, dt) {
      const p = b.g.player;
      if (b.act === 'walk') { b.face(); b.vx = 0; b.pose = 'idle'; if (b.at > 1.0) { b.cycle++; b.go(['erupt', 'mud', 'dive', 'erupt', 'roar'][b.cycle % 5]); } }
      else if (b.act === 'erupt') {
        b.vx = 0; b.pose = 'summon';
        if (b.first) { b.n = 0; }
        if (b.at > 0.2 + b.n * 0.7 && b.n < 3 && p) { b.n++; b.g.spawn(new GeyserBurst(b.g, p.cx, b.floorY)); }
        if (b.at > 2.6) b.go('walk');
      }
      else if (b.act === 'mud') { b.vx = 0; b.pose = 'throw'; if (b.first) for (let k = 0; k < 3; k++) b.shoot({ x: b.cx, y: b.y + 10, kind: 'mud', vx: b.dir * (2.5 + k * 1.6) * TS, vy: -10 * TS, grav: PHYS.gDown * 0.5, w: 16, h: 16, life: 3, thru: true, col: '#8a5a3a' }); if (b.at > 1.2) b.go('walk'); }
      else if (b.act === 'dive') { b.pose = 'dive'; b.sink = Math.min(1, b.at * 2); if (b.at > 0.6 && !b.moved) { b.moved = true; b.x = clamp((p ? p.cx : b.cx) + pick([-1, 1]) * 6 * TS - b.w / 2, b.arenaX0, b.arenaX1 - b.w); } if (b.at > 1.2) { b.sink = Math.max(0, 1 - (b.at - 1.2) * 2); } if (b.at > 1.8) { b.moved = false; b.sink = 0; b.go('roar'); } }
      else if (b.act === 'roar') { b.vx = 0; b.pose = 'roar'; if (b.first) { say(b.g, b, 'GLUB-ROARRR', '#8af0ff'); b.g.shake(4); } b.vuln = b.at > 0.3 && b.at < 2.4; if (b.at > 2.6) b.go('walk'); }
      b.fall(dt);
    },
    noDisc(b) { return b.act === 'dive'; },
    draw(b, ctx, t) { ctx.save(); if (b.sink) { ctx.beginPath(); ctx.rect(b.x - 40, b.y - 60, b.w + 80, b.h + 60 - b.sink * b.h); ctx.clip(); ctx.translate(0, b.sink * b.h * 0.8); } BossArt.draw(ctx, b, t); ctx.restore(); }
  },
  /* Dust Devil Diablo: pulls you in, flings debris, splits; when he spins down, stomp his core */
  dustdevil: {
    update(b, dt) {
      const p = b.g.player;
      b.face();
      if (b.act === 'walk') { b.hover(dt, b.floorY - b.h - 0.5 * TS, p ? p.cx : undefined); if (b.at > 1.6) { b.cycle++; b.go(['pull', 'debris', 'split', 'tired'][b.cycle % 4]); } }
      else if (b.act === 'pull') { b.hover(dt, b.floorY - b.h); if (p && !p.dead) p.pushX = (p.pushX || 0) + sign(b.cx - p.cx) * 4.2 * TS; b.g.dustLevel = Math.max(b.g.dustLevel, 0.5); if (b.at > 2.4) b.go('walk'); }
      else if (b.act === 'debris') { b.hover(dt, b.floorY - b.h - TS); if (Math.floor(b.at * 6) !== Math.floor((b.at - dt) * 6) && b.at < 1.8) { const a = b.at * 5; b.shoot({ x: b.cx, y: b.cy, kind: 'moop', vx: Math.cos(a) * 4.5 * TS, vy: Math.sin(a) * 4.5 * TS - 2 * TS, grav: PHYS.gDown * 0.25, w: 14, h: 12, life: 2.4, thru: true }); } if (b.at > 2.2) b.go('walk'); }
      else if (b.act === 'split') { if (b.first) { for (const k of [-1, 1]) { const dv = new Devil(b.g, { x: b.cx + k * 3 * TS, y: b.floorY }); dv.dir = k; dv.life = 6; b.g.spawn(dv); } say(b.g, b, 'MORE OF ME!', '#e8d8c0'); } b.hover(dt, b.floorY - b.h - 3 * TS); if (b.at > 1.6) b.go('walk'); }
      else if (b.act === 'tired') { b.pose = 'tired'; b.hover(dt, b.floorY - b.h); b.vuln = b.at > 0.5 && b.at < 2.8; if (b.first) say(b.g, b, '*wheeze*', '#e8d8c0'); if (b.at > 3) b.go('walk'); }
    }
  },
  /* Forklift Frank: forks-first charges, pallet drops; climbs out to fix the forklift after a crash */
  forklift: {
    guardText: 'BEEP BEEP',
    update(b, dt) {
      b.guard = 'bounce';
      if (b.act === 'walk') { b.face(); b.walk(1.6); b.pose = 'drive'; if (b.at > 1.0) { b.cycle++; b.go(b.cycle % 2 ? 'charge' : 'pallets'); } }
      else if (b.act === 'charge') { if (b.at < 0.6) { b.vx = 0; b.pose = 'rev'; } else { b.walk(6.5); b.pose = 'charge'; if (b.hitWall || b.x <= b.arenaX0 + 1 || b.x >= b.arenaX1 - b.w - 1) { b.g.shake(7); Sound.play('break'); b.go('fix'); } } if (b.at > 3.5) b.go('walk'); }
      else if (b.act === 'pallets') { b.vx = 0; b.pose = 'lift'; if (b.first) { const p = b.g.player; for (let k = 0; k < 3; k++) b.shoot({ x: (p ? p.cx : b.cx) + (k - 1) * 3 * TS, y: b.floorY - 9 * TS, kind: 'pallet', vy: 0, grav: PHYS.gDown * 0.5, w: 40, h: 14, life: 3, thru: true }); say(b.g, b, 'HEADS UP!', '#f2c23a'); } if (b.at > 1.6) b.go('walk'); }
      else if (b.act === 'fix') { b.vx = 0; b.pose = 'fix'; b.vuln = b.at > 0.3 && b.at < 2.6; b.guard = b.vuln ? 'hurt' : 'bounce'; if (b.first) say(b.g, b, 'AW, COME ON...', '#f2c23a'); if (b.at > 2.8) b.go('walk'); }
      b.fall(dt);
    }
  },
  /* Foreman Rusty: wrench volleys, a long rebar sweep, kicked fuel barrels; stomp him while he radios in */
  rusty: {
    update(b, dt) {
      const p = b.g.player;
      if (b.act === 'walk') { b.face(); b.walk(1.4); b.pose = 'walk'; if (b.at > 1.1) { b.cycle++; b.go(['wrench', 'rebar', 'barrel', 'radio'][b.cycle % 4]); } }
      else if (b.act === 'wrench') { b.vx = 0; b.pose = 'throw'; if (b.first) b.n = 0; if (b.at > 0.3 + b.n * 0.35 && b.n < 3) { b.n++; b.face(); b.shoot({ x: b.cx, y: b.y + 20, kind: 'wrench', vx: b.dir * (2.6 + b.n) * TS, vy: -9 * TS, grav: PHYS.gDown * 0.45, w: 14, h: 14, life: 3, thru: true }); Sound.play('throw', { vol: 0.5 }); } if (b.at > 1.6) b.go('walk'); }
      else if (b.act === 'rebar') {
        b.vx = 0; b.pose = b.at < 0.7 ? 'windup' : 'sweep';
        if (b.at > 0.7 && b.at < 1.1 && p && !p.dead) { const zone = { x: b.dir > 0 ? b.x + b.w : b.x - 4 * TS, y: b.y + b.h - 40, w: 4 * TS, h: 34 }; if (overlap(zone, p)) p.hurt(b); }
        if (b.at > 1.5) b.go('walk');
      }
      else if (b.act === 'barrel') { b.vx = 0; b.pose = 'kick'; if (b.first) { b.face(); b.g.spawn(new RollingBarrel(b.g, b.cx + b.dir * 40, b.floorY, b.dir)); say(b.g, b, 'FORE!', '#ff8a1a'); } if (b.at > 1.2) b.go('walk'); }
      else if (b.act === 'radio') { b.vx = 0; b.pose = 'radio'; if (b.first) say(b.g, b, 'WHO TOOK MY GOLF CART?!', '#ff8a1a'); b.vuln = b.at > 0.3 && b.at < 2.4; if (b.at > 2.6) b.go('walk'); }
      b.fall(dt);
    }
  },
  /* The Glitter Queen: gallops, steals, and rears up for a glitter flash (hide behind cover) */
  pony: {
    update(b, dt) {
      const p = b.g.player;
      if (b.act === 'walk') { b.face(); b.walk(1.6); b.pose = 'walk'; if (b.at > 1.0) { b.cycle++; b.go(b.cycle % 2 ? 'gallop' : 'glitter'); } }
      else if (b.act === 'gallop') { if (b.at < 0.5) { b.vx = 0; b.pose = 'rear'; } else { b.walk(6); b.pose = 'gallop'; if (b.hitWall || b.x <= b.arenaX0 + 1 || b.x >= b.arenaX1 - b.w - 1) { b.g.shake(6); Sound.play('bump'); b.go('dizzy'); } } if (b.at > 3.2) b.go('walk'); }
      else if (b.act === 'glitter') {
        b.vx = 0; b.pose = 'rear';
        if (b.first) say(b.g, b, 'BEHOLD MY GLITTER!', '#ff9ad8');
        if (b.at > 1.6 && !b.flashed) { b.flashed = true; sfx('neon_flash', 'laser'); b.g.flash = 1; if (p && !p.dead && !lineOfSightBlocked(b.g, b.cx, b.y + 10, p)) p.hurt(b); }
        if (b.at > 2.2) { b.flashed = false; b.go('walk'); }
      }
      else if (b.act === 'dizzy') { b.vx = 0; b.pose = 'dizzy'; b.vuln = true; if (b.at > 1.8) b.go('walk'); }
      b.fall(dt);
    },
    draw(b, ctx, t) {
      if (b.act === 'glitter' && b.at < 1.6) { const k = b.at / 1.6; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(b.cx, b.y, 4, b.cx, b.y, 40 + k * 120); g.addColorStop(0, `rgba(255,200,240,${0.5 * k})`); g.addColorStop(1, 'rgba(255,120,220,0)'); ctx.fillStyle = g; ctx.fillRect(b.cx - 180, b.y - 180, 360, 360); ctx.restore(); ctx.fillStyle = '#fff'; ctx.font = `14px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('HIDE! ' + Math.ceil((1.6 - b.at) / 0.53), b.cx, b.y - 30); }
      BossArt.draw(ctx, b, t);
    }
  },
  /* Bouncer Brutus: velvet rope sweeps (jump or duck), shockwave stomps, thrown ravers, list charges */
  bouncer: {
    update(b, dt) {
      const p = b.g.player;
      if (b.act === 'walk') { b.face(); b.walk(1.7); b.pose = 'walk'; if (b.at > 0.9) { b.cycle++; b.go(['rope', 'stomp', 'throw', 'list', 'rope', 'list'][b.cycle % 6]); } }
      else if (b.act === 'rope') {
        b.vx = 0; b.pose = 'rope';
        if (b.first) { b.high = Math.random() < 0.5; say(b.g, b, b.high ? 'DUCK!' : 'JUMP!', '#ffd84a'); }
        if (b.at > 0.8 && b.at < 1.15 && p && !p.dead) { const y = b.high ? b.floorY - 2.1 * TS : b.floorY - 0.9 * TS; const zone = { x: b.dir > 0 ? b.x + b.w : b.x - 6 * TS, y: y - 10, w: 6 * TS, h: 20 }; if (overlap(zone, p)) p.hurt(b); }
        if (b.at > 1.5) b.go('walk');
      }
      else if (b.act === 'stomp') { b.pose = 'jump'; if (b.first) { b.vy = -15 * TS; b.face(); b.vx = b.dir * 3 * TS; } if (b.at > 0.3 && b.onGround) { groundWave(b, 'bellwave', 5.2, '#ffd84a'); b.g.shake(8); Sound.play('bump'); b.go('walk'); } }
      else if (b.act === 'throw') { b.vx = 0; b.pose = 'throw'; if (b.first) { b.face(); b.shoot({ x: b.cx, y: b.y + 10, kind: 'thrown', vx: b.dir * 4 * TS, vy: -10 * TS, grav: PHYS.gDown * 0.5, w: 24, h: 24, life: 3, thru: true, stompable: true }); say(b.g, b, 'OUT!', '#ffd84a'); } if (b.at > 1.0) b.go('walk'); }
      else if (b.act === 'list') { if (b.at < 0.45) { b.vx = 0; b.pose = 'point'; if (b.first) say(b.g, b, "YOU'RE NOT ON THE LIST", '#ffd84a'); } else { b.walk(6.4); b.pose = 'charge'; if (b.hitWall || b.x <= b.arenaX0 + 1 || b.x >= b.arenaX1 - b.w - 1) { b.g.shake(8); Sound.play('bump'); b.go('dizzy'); } } if (b.at > 3) b.go('walk'); }
      else if (b.act === 'dizzy') { b.vx = 0; b.pose = 'dizzy'; b.vuln = true; if (b.at > 1.4) b.go('walk'); }
      b.fall(dt);
    }
  },
  /* The Archivist: lines of text sweep the room (jump or duck), ink rains, then a low swoop */
  archivist: {
    update(b, dt) {
      const p = b.g.player;
      b.face();
      if (b.act === 'walk') { b.hover(dt, b.floorY - b.h - 4 * TS + Math.sin(b.t * 2) * 10, p ? p.cx - b.dir * 4 * TS : undefined); if (b.at > 1.5) { b.cycle++; b.go(['lines', 'ink', 'lines', 'swoop'][b.cycle % 4]); } }
      else if (b.act === 'lines') {
        b.hover(dt, b.floorY - b.h - 4 * TS);
        if (b.first) { b.n = 0; }
        if (b.at > 0.4 + b.n * 0.7 && b.n < 3) { b.n++; const low = (b.n + b.cycle) % 2; b.shoot({ x: b.cx, y: b.floorY - (low ? 0.6 : 2.2) * TS, kind: 'textline', text: pick(['THE END', 'ONCE UPON', 'CHAPTER 22', 'FOOTNOTE', 'ERRATA']), vx: b.dir * 3.2 * TS, w: 90, h: 16, life: 6, thru: true, col: '#2a2a3a' }); }
        if (b.at > 2.6) b.go('walk');
      }
      else if (b.act === 'ink') { b.hover(dt, b.floorY - b.h - 5 * TS); if (b.first) b.n = 0; if (b.at > 0.2 + b.n * 0.18 && b.n < 8) { b.n++; b.shoot({ x: b.arenaX0 + Math.random() * (b.arenaX1 - b.arenaX0), y: b.floorY - 11 * TS, kind: 'ink', vy: 3 * TS, grav: PHYS.gDown * 0.3, w: 12, h: 14, life: 3, thru: true, col: '#1a1a2a' }); } if (b.at > 2.2) b.go('walk'); }
      else if (b.act === 'swoop') { b.vuln = b.at > 0.6 && b.at < 2.5; b.y = approach(b.y, b.floorY - b.h - (b.at < 2.2 ? 0.2 * TS : 3 * TS), 7 * TS * dt); b.x += b.dir * 2.2 * TS * dt; if (b.at > 2.8) b.go('walk'); }
    }
  }
};
function lineOfSightBlocked(g, x0, y0, p) { return !lineOfSight(g, x0, y0, p.cx, p.y + 8) && !lineOfSight(g, x0, y0, p.cx, p.y + p.h - 8) ? true : !lineOfSight(g, x0, y0, p.cx, p.cy); }

/* helpers spawned by bosses */
class GeyserBurst extends Ent {
  constructor(g, x, floorY) { super(g, null, 44, 6 * TS); this.x = x - 22; this.y = floorY - this.h; this.k = 0; }
  update(dt) { this.t += dt; this.k += dt; if (this.k > 1.6) this.remove = true; if (this.k > 0.8 && !this.sounded) { this.sounded = true; Sound.play('splash'); this.g.shake(3); } }
  touchPlayer(p) { if (this.k > 0.8 && this.k < 1.5) p.hurt(this); }
  draw(ctx) { GimmickArt.geyserBurst(ctx, this, this.g.t); }
}
class RollingBarrel extends Ent {
  constructor(g, x, floorY, dir) { super(g, null, 26, 28); this.x = x - 13; this.y = floorY - 28; this.vx = dir * 4 * TS; this.enemy = true; this.fuse = 2.2; this.spinA = 0; }
  update(dt) {
    this.t += dt; this.fuse -= dt; this.vy += PHYS.gDown * dt; const vx = this.vx;
    moveBody(this, this.g.area, dt, { semis: true }); if (this.hitWall) this.vx = -vx * 0.6; this.spinA += this.vx / 13 * dt;
    if (this.fuse <= 0) { this.remove = true; const g = this.g; sfx('firework_burst', 'break'); g.shake(8); g.burst(this.cx, this.cy, 26, '#ff8a2a', 'spark'); const p = g.player; if (p && Math.hypot(p.cx - this.cx, p.cy - this.cy) < 70) p.hurt(this); }
  }
  hit(kind) { if (kind === 'stomp' || kind === 'spin') return 'bounce'; return false; }
  touchPlayer(p) { p.hurt(this); }
  draw(ctx) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(this.spinA); GimmickArt.barrelShape(ctx, -13, -14, this.fuse < 1 ? Math.sin(this.t * 30) > 0 : false); ctx.restore(); }
}

/* ===================== THE MAN ===================== */
// Phase 1: he rides a flying saucer that drops burning planks and fires neon rings; stomp his head when it swoops low.
// Phase 2: he grows giant. Neon flashes (hide behind the plywood), fire from his face, firework arms,
// and when he leans down to look for Brady, stomp the glowing diamond head.
class ManSaucer extends Ent {
  constructor(g, boss) { super(g, null, 5 * TS, 16); this.boss = boss; this.isPlatform = true; this.dx = 0; this.dy = 0; }
  update(dt) { }
  moveTo(x, y) { this.dx = x - this.x; this.dy = y - this.y; this.x = x; this.y = y; }
  draw(ctx) { if (!this.dead) ManArt.saucer(ctx, this.x + this.w / 2, this.y, this.g.t, this.boss.pose === 'crash'); }
}
class TheMan extends Boss {
  constructor(g, s) {
    super(g, Object.assign({}, s, { style: 'man' }));
    this.phase = 1; this.hp1 = 3; this.maxHp = 7; this.hp = 7; this.giant = 0; this.tall = true;
    this.saucer = null; this.sx = 0; this.sy = 0;
    this.headX = 0; this.headY = 0; this.lean = 0;
  }
  update(dt) {
    if (!this.saucer && this.state !== 'dying') { this.saucer = new ManSaucer(this.g, this); this.g.spawn(this.saucer); this.sx = this.x + this.w / 2; this.sy = this.floorY - 6 * TS; this.placeOnSaucer(); }
    super.update(dt);
  }
  placeOnSaucer() {
    const s = this.saucer; s.moveTo(this.sx - s.w / 2, this.sy);
    this.x = this.sx - this.w / 2; this.y = this.sy - this.h + (this.pose === 'crouch' ? 40 : 0);
  }
  hit(kind, src) {
    if (this.state !== 'fight' || this.hurtT > 0) return false;
    if (kind === 'disc') { if (this.phase === 2 && !this.vuln) return false; this.damage(0.34); return true; }
    return super.hit(kind, src);
  }
  damage(n) {
    super.damage(n);
    if (this.state !== 'dying' && this.phase === 1 && this.hp <= this.maxHp - this.hp1 + 0.01) this.toPhase2();
  }
  toPhase2() {
    this.phase = 2; this.go('grow'); this.hurtT = 2.5;
    this.g.mus(trackOr('man_giant', 'final'));
  }
  die() {
    super.die(); this.timer = 3.2;
    if (this.saucer) this.saucer.remove = true;
    this.g.bannerText = 'THE MAN BURNS!'; this.g.bannerT = 3;
  }
  get brainUpdate() { return null; }
  phase1(dt) {
    const p = this.g.player, g = this.g;
    const midX = (this.arenaX0 + this.arenaX1) / 2;
    const hoverY = this.floorY - 6 * TS;
    if (this.act === 'walk') {
      this.pose = 'stand';
      this.sx = approach(this.sx, (p ? p.cx : midX) + Math.sin(this.t * 0.7) * 3 * TS, 3.4 * TS * dt * this.aggression);
      this.sy = approach(this.sy, hoverY + Math.sin(this.t * 2) * 10, 3 * TS * dt);
      if (this.at > 1.6) { this.cycle++; this.go(['planks', 'ring', 'planks', 'swoop'][this.cycle % 4]); }
    } else if (this.act === 'planks') {
      this.pose = 'throw';
      if (this.first) this.n = 0;
      this.sx = approach(this.sx, p ? p.cx : midX, 4 * TS * dt);
      if (this.at > 0.3 + this.n * 0.5 && this.n < 3) { this.n++; this.shoot({ x: this.sx + (Math.random() - 0.5) * 60, y: this.sy + 20, kind: 'plank', vx: (Math.random() - 0.5) * 2 * TS, vy: -2 * TS, grav: PHYS.gDown * 0.45, w: 34, h: 12, life: 3, thru: true, fiery: true, col: '#ff8a2a' }); Sound.play('fire', { vol: 0.5 }); }
      if (this.at > 2) this.go('walk');
    } else if (this.act === 'ring') {
      this.pose = 'arms';
      if (this.at > 0.6 && !this.fired) { this.fired = true; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; this.shoot({ x: this.sx, y: this.sy + 6, kind: 'neonball', vx: Math.cos(a) * 3.6 * TS, vy: Math.sin(a) * 3.6 * TS, w: 14, h: 14, life: 3, thru: true, col: k % 2 ? '#38f2ff' : '#ff4fd8' }); } sfx('neon_flash', 'laser', { vol: 0.5 }); }
      if (this.at > 1.4) { this.fired = false; this.go('walk'); }
    } else if (this.act === 'swoop') {
      // the saucer dives low and glides across the pavilion: the Man crouches, his head in reach
      this.pose = this.at > 0.5 ? 'crouch' : 'stand';
      if (this.first) { this.swDir = (p && p.cx < midX) ? 1 : -1; this.sx = this.swDir > 0 ? this.arenaX0 + 3 * TS : this.arenaX1 - 3 * TS; }
      this.sy = approach(this.sy, this.floorY - 1.6 * TS, 8 * TS * dt);
      if (this.at > 0.6) this.sx += this.swDir * 2.6 * TS * dt;
      this.vuln = this.at > 0.7 && this.at < 3.6;
      if (this.at > 3.8 || this.sx < this.arenaX0 + 2 * TS || this.sx > this.arenaX1 - 2 * TS) this.go('rise');
    } else if (this.act === 'rise') { this.pose = 'stand'; this.sy = approach(this.sy, hoverY, 5 * TS * dt); if (this.at > 1) this.go('walk'); }
    this.sx = clamp(this.sx, this.arenaX0 + 2.5 * TS, this.arenaX1 - 2.5 * TS);
    this.placeOnSaucer();
  }
  phase2(dt) {
    const p = this.g.player, g = this.g;
    // giant stance on the right of the pavilion
    const footX = this.arenaX1 - 3.5 * TS, H = this.floorY;
    this.focusX = footX + 2 * TS;  // the camera keeps the giant in frame
    const scale = 1 + this.giant * 1.4;
    // same geometry ManArt.figure draws: the torso pivots at the hips, he kneels as he leans
    const lean = this.lean * 1.2, hipY = H - 48 * (1 - this.lean * 0.45) * scale;
    this.headX = footX - 52 * scale * Math.sin(lean); this.headY = hipY - 52 * scale * Math.cos(lean);
    const box = (hx, hy) => { this.w = 44; this.h = 46; this.x = hx - 22; this.y = hy - 23; };
    if (this.act === 'grow') {
      this.giant = Math.min(1, this.at / 2.2);
      if (this.saucer && !this.saucer.dead) { this.saucer.moveTo(this.saucer.x, this.saucer.y + 6 * TS * dt); if (this.at > 0.8) { this.saucer.dead = true; this.saucer.remove = true; g.burst(this.saucer.cx, this.saucer.y, 30, '#38f2ff', 'spark'); g.shake(10); } }
      if (this.first) { g.bannerText = 'THE MAN GROWS!'; g.bannerT = 2.2; g.shake(12); }
      g.shake(3);
      if (this.at > 2.6) this.go('neon');
    } else if (this.act === 'neon') {
      this.pose = 'neon';
      if (this.first) { g.toast('HIDE BEHIND THE PLYWOOD!'); }
      this.charge = Math.min(1, this.at / 1.9);
      if (this.at > 1.9 && !this.flashed) {
        this.flashed = true; g.flash = 1; sfx('neon_flash', 'laser'); g.shake(6);
        if (p && !p.dead && lineOfSight(g, this.headX, this.headY, p.cx, p.cy)) p.hurt(this);
      }
      if (this.at > 2.5) { this.flashed = false; this.charge = 0; this.cycle++; this.go(this.cycle % 2 ? 'facefire' : 'fireworks'); }
    } else if (this.act === 'facefire') {
      this.pose = 'fire';
      if (this.first) say(g, { cx: this.headX, y: this.headY - 40 }, 'MINE!!', '#ff8a2a');
      if (this.at > 0.6 && Math.floor(this.at * 8) !== Math.floor((this.at - dt) * 8) && this.at < 1.6) {
        // a flame column rolls along the floor toward Brady: jump it or get up on a platform
        this.shoot({ x: footX - 2 * TS, y: H - 22, kind: 'flame', vx: -5.2 * TS, w: 22, h: 44, ground: true, life: 3.5, fiery: true, col: '#ff8a2a' });
      }
      if (this.at > 2.4) this.go('lean');
    } else if (this.act === 'fireworks') {
      this.pose = 'arms';
      if (this.first) this.n = 0;
      if (this.at > 0.4 + this.n * 0.32 && this.n < 6) {
        this.n++; sfx('firework_launch', 'fire', { vol: 0.5 });
        const side = this.n % 2 ? -1 : 1, ax = footX + side * 30 * scale, ay = H - 110 * scale;
        const tx = this.arenaX0 + 2 * TS + Math.random() * (footX - this.arenaX0 - 6 * TS);
        const s = this.shoot({ x: ax, y: ay, kind: 'firework', vx: (tx - ax) / 1.1, vy: -6 * TS, grav: PHYS.gDown * 0.12, w: 12, h: 12, life: 1.1, thru: true, col: '#ffd84a' });
        s.onPop = true;
      }
      if (this.at > 2.8) this.go('lean');
    } else if (this.act === 'lean') {
      // leaning down to look for Brady: the diamond head comes into reach
      this.pose = 'lean';
      this.lean = Math.min(1, this.at / 0.8) * (this.at < 3.2 ? 1 : Math.max(0, 1 - (this.at - 3.2) * 2));
      this.vuln = this.at > 0.8 && this.at < 3.2;
      if (this.at > 3.7) { this.lean = 0; this.go('neon'); }
    } else if (this.act === 'walk') this.go('neon');
    box(this.headX, this.headY);
  }
  update2(dt) { }
}
// the Man's own brain wires into the Boss framework
BOSS_BRAINS.man = {
  update(b, dt) { if (b.phase === 1) b.phase1(dt); else b.phase2(dt); },
  hurt(b) { if (b.phase === 1) { b.go('rise'); say(b.g, b, pick(['MY SAUCER!', 'SHE LOVES ME!', 'BURN THIS!']), '#ffd84a'); } else { b.lean = 0; b.go('neon'); say(b.g, { cx: b.headX, y: b.headY - 30 }, 'OW! MY HEAD!', '#ffd84a'); } },
  noDisc(b) { return b.phase === 2 && !b.vuln; },
  guardText: 'TOO HIGH',
  draw(b, ctx, t) { ManArt.draw(ctx, b, t); }
};
ENTITY_TYPES.boss = function (g, s) { return s.style === 'man' ? new TheMan(g, s) : new Boss(g, s); };
function trackOr(name, fallback) { return (Sound.trackNames || []).indexOf(name) >= 0 ? name : fallback; }
