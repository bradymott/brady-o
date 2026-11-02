/* ============================================================
   BRADY-O BURNS — the Man, extended for Worlds 9 and 10.
   BurnsW8910Man extends the engine's BurnsManBoss (same rules: combo of
   attacks, then he collapses and only his glowing head can be bonked) and
   adds attacks:
     devil   arms whirl, dust devils spin off and chase Brady (W9)
     vanish  he dissolves into the storm and reappears elsewhere (W9)
     bombs   fire rain lobbed from the top of his saucer (W10 phase 1)
     sweep   the saucer's neon rim beam sweeps the ground: jump it (W10 phase 1)
     fan     giant face-fire: volleys of rolling fireballs in a fan (W10 phase 2)
   plus green "SAFE" rings behind cover during the neon flash, per-world
   lines, and a proxy for the HUD bar / boss camera framing.
   ============================================================ */

const BURNS_W8910_MANLINES = {
  devil: ['DANCE WITH MY DUST DEVILS!', 'TWIRL, SMALL MAN, TWIRL!'],
  vanish: ['NOW YOU SEE ME...', 'I AM ONE WITH THE DUST!'],
  bombs: ['MY LOVE BURNS HOT! LITERALLY!', 'CATCH, BUN BOY!'],
  sweep: ['ROUND AND ROUND MY LOVE GOES!', 'THE SAUCER SWEEPS! JUMP!'],
  fan: ['FEEL MY FIERY GAZE!', 'FACE FIRE! IT IS A LOOK!']
};
const burnsW8910Pick = L => L[Math.floor(Math.random() * L.length)];

class BurnsW8910Man extends BurnsManBoss {
  constructor(g, cfg) {
    super(g, cfg);
    this.safe = null; this.beam2 = null; this.lastHead = [this.x, this.y + 10, this.z];
  }
  pickAttack() {
    const pc = this.phaseCfg;
    if (pc.first && this.combo === 1) { this.lastAtk = pc.first; return pc.first; }
    return super.pickAttack();
  }
  setState(st) {
    super.setState(st);
    if (st === 'flash') this.safe = null;
    if (st === 'sweep') { const A = this.cfg.arena || this, p = this.g.player; this.sweepDir = Math.random() < 0.5 ? 1 : -1; this.sweepA0 = Math.atan2(p.x - A.x, p.z - A.z) - this.sweepDir * 1.7; }
    else this.beam2 = null;
  }
  announce() {
    const L = (this.cfg.lines && this.cfg.lines[this.st]) || BURNS_W8910_MANLINES[this.st];
    if (!L) { super.announce(); return; }
    this.g.bossSay(this, burnsW8910Pick(L));
    if (this.st === 'flash') this.g.warn(this.cfg.flashWarn || 'TAKE COVER!', this.cfg.flashCharge || 2.6);
  }
  hurt(kind) {
    super.hurt(kind);
    if (!this.defeated && this.cfg.hitLines) this.g.bossSay(this, burnsW8910Pick(this.cfg.hitLines));
  }
  update(dt) {
    const g = this.g, p = g.player, st0 = this.st, fired0 = this.fired, hy0 = p.hydration;
    if (this.active && !this.defeated) this.custom(dt);
    super.update(dt);
    if (this.st === 'stunned' && st0 !== 'stunned' && this.cfg.stunLines) g.bossSay(this, burnsW8910Pick(this.cfg.stunLines));
    if (this.active && !this.defeated && this.st === 'flash' && !this.safe && this.cfg.covers) this.safe = BurnsW8910.safeSpots(g, this.head(), this.cfg.covers);
    if (st0 === 'flash' && !fired0 && this.fired && p.hydration < hy0 && p.hydration <= 0 && this.cfg.flashWipe) g.banner('WIPED OUT!', 'The green rings behind cover are safe from the flash.', { col: '#ff4fd8' });
    if (!this.hidden) { const h = this.head(); this.lastHead[0] = h[0]; this.lastHead[1] = h[1]; this.lastHead[2] = h[2]; }
    if (this.cfg.onUpdate) this.cfg.onUpdate(g, this, dt);
  }
  // the extra attacks (run before the engine's update each step)
  custom(dt) {
    const g = this.g, p = g.player, u = this.stT, A = this.cfg.arena || { x: this.x, z: this.z, r: 30 };
    const face = (k) => { this.yaw = BurnsM.dampAngle(this.yaw, Math.atan2(p.x - this.x, p.z - this.z), k || 1.1, dt); };
    switch (this.st) {
      case 'devil': {
        face();
        if (u > 0.9 && !this.fired) {
          this.fired = 1;
          const n = this.cfg.devils || 2;
          for (let i = 0; i < n; i++) {
            const a = this.yaw + (i - (n - 1) / 2) * 1.2, r = 3.6 * this.scale;
            BurnsW8910Haz.devil(g, this.x + Math.sin(a) * r, this.z + Math.cos(a) * r, { dir: a, speed: (this.cfg.devilSpeed || 4.3) + i * 0.4, life: this.cfg.devilLife || 7, r: 1.5, h: 10, turn: 0.75, bounds: { x: A.x, z: A.z, r: A.r + 4 }, avoid: this.cfg.avoid });
          }
          g.shake(0.35); burnsSfx('wind', { vol: 0.9 }, 'dust'); g.fx.dust(this.x, this.y + 0.3, this.z, 30, '#c8a888');
        }
        if (u > 2.0) this.setState('idle');
        break;
      }
      case 'vanish': {
        if (u > 0.55 && this.fired === 0) {
          this.fired = 1; this.hidden = true;
          for (let i = 0; i < 5; i++) g.fx.dust(this.x + (Math.random() - 0.5) * 7, this.y + Math.random() * 9 * this.scale, this.z + (Math.random() - 0.5) * 7, 14, '#b89a80');
          burnsSfx('wind', { vol: 1 }, 'dust'); g.shake(0.25);
        }
        if (u > 1.9 && this.fired === 1) {
          this.fired = 2;
          let best = null;
          for (let k = 0; k < 20; k++) {
            const a = Math.random() * TAU, d = A.r * (0.25 + Math.random() * 0.5), x = A.x + Math.sin(a) * d, z = A.z + Math.cos(a) * d, dp = Math.hypot(x - p.x, z - p.z);
            if (dp < 13) continue;
            if ((this.cfg.covers || []).some(c => Math.hypot(c.x - x, c.z - z) < c.r + 3.5 * this.scale)) continue;
            best = [x, z]; if (dp > 17) break;
          }
          if (best) { this.x = best[0]; this.z = best[1]; }
          this.yaw = Math.atan2(p.x - this.x, p.z - this.z); this.hidden = false;
          for (let i = 0; i < 5; i++) g.fx.dust(this.x + (Math.random() - 0.5) * 7, this.y + Math.random() * 6, this.z + (Math.random() - 0.5) * 7, 14, '#b89a80');
          burnsSfx('man_roar', { vol: 0.7, pitch: 0.9 }); g.shake(0.45); g.bossSay(this, burnsW8910Pick(['BOO!', 'MISS ME?', 'SURPRISE, BUN BOY!']));
        }
        if (u > 2.6) this.setState('idle');
        break;
      }
      case 'bombs': {
        face();
        const n = this.cfg.bombs || 7, gap = this.cfg.bombGap || 0.34;
        if (u > 0.55 && this.fired < n && u > 0.55 + this.fired * gap) {
          this.fired++;
          const h = this.head(), lead = 0.55, spread = this.cfg.bombSpread || 7;
          let tx = p.x + p.vx * lead + (Math.random() - 0.5) * spread, tz = p.z + p.vz * lead + (Math.random() - 0.5) * spread;
          if (this.fired === 1) { tx = p.x; tz = p.z; }
          const d = Math.hypot(tx - h[0], tz - h[2]);
          BurnsW8910Haz.bomb(g, h[0], h[1] + 0.6, h[2], tx, tz, { T: clamp(0.9 + d * 0.022, 1.1, 1.8), blast: 2.3, fire: 2.0, grav: 22 });
          burnsSfx('flame_jet', { vol: 0.5, pitch: 1.2 });
        }
        if (u > 0.9 + n * gap + 1.0) this.setState('idle');
        break;
      }
      case 'sweep': {
        face(0.6);
        const start = 0.9, dur = this.cfg.sweepDur || 3.0, cx = A.x, cz = A.z, r0 = this.cfg.sweepR0 || 12, len = this.cfg.sweepLen || 30;
        if (u >= start && u < start + dur) {
          const k = (u - start) / dur, ang = this.sweepA0 + this.sweepDir * k * (this.cfg.sweepArc || 3.4);
          this.beam2 = { ang, cx, cz, r0, len, y: 0.55, live: true };
          const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz), pa = Math.atan2(dx, dz);
          if (d > r0 - 0.6 && d < r0 + len && Math.abs(BurnsM.wrap(pa - ang)) < 0.04 + 0.9 / Math.max(3, d) && p.y < g.world.height(p.x, p.z) + 1.0) p.hurt(1, cx, cz, 8);
          if (this.fired === 0) { this.fired = 1; burnsSfx('neon_flash', { pitch: 1.5, vol: 0.5 }); }
        } else if (u < start) this.beam2 = { ang: this.sweepA0, cx, cz, r0, len, y: 0.55, live: false };
        else this.beam2 = null;
        if (u > start + dur + 0.4) { this.beam2 = null; this.setState('idle'); }
        break;
      }
      case 'fan': {
        face(1.4);
        const vols = this.cfg.fanVolleys || [0.7, 1.45, 2.2], n = this.cfg.fanN || 4;
        if (this.fired < vols.length && u > vols[this.fired]) {
          const h = this.head(), i = this.fired, base = Math.atan2(p.x - h[0], p.z - h[2]), dist = Math.max(8, Math.hypot(p.x - h[0], p.z - h[2]));
          this.fired++;
          for (let k = 0; k < n; k++) {
            const a = base + (k - (n - 1) / 2) * (this.cfg.fanSpread || 0.17) + (i % 2 ? 0.085 : 0), T = clamp(dist / 24, 0.75, 1.9);
            const tx = h[0] + Math.sin(a) * dist, tz = h[2] + Math.cos(a) * dist, ty = g.world.height(tx, tz) + 0.4;
            g.projectile({ kind: 'fireball', x: h[0], y: h[1] - 0.8 * this.scale, z: h[2], vx: (tx - h[0]) / T, vy: (ty - h[1]) / T, vz: (tz - h[2]) / T, life: T + 1.5, r: 1.1, dmg: 1, trail: 1.5 });
          }
          g.fx.burst(h[0], h[1], h[2], 'spark', 20, '#ffb040'); burnsSfx('flame_jet', { vol: 0.9, pitch: 0.7 }); g.shake(0.25);
        }
        if (u > (vols[vols.length - 1] || 2) + 1.0) this.setState('idle');
        break;
      }
    }
  }
  pose(P, t) {
    const st = this.st, alias = { bombs: 'fire', fan: 'fire', sweep: 'flash', devil: 'fireworks', vanish: 'idle' }[st];
    if (alias) { this.st = alias; super.pose(P, t); this.st = st; } else super.pose(P, t);
    const B = BURNS_BONES, S = (b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; }, u = this.stT;
    if (st === 'devil') { const w = t * 9; S(B.UARM_L, -0.4 + Math.sin(w) * 0.6, 0, 1.6 + Math.cos(w) * 0.6); S(B.UARM_R, -0.4 + Math.cos(w) * 0.6, 0, -1.6 - Math.sin(w) * 0.6); S(B.CHEST, 0.1, Math.sin(t * 6) * 0.25, 0); }
    else if (st === 'vanish') { const k = clamp(u / 0.55, 0, 1); P.yaw = k * k * TAU * 1.5; S(B.UARM_L, -0.2, 0, 1.3); S(B.UARM_R, -0.2, 0, -1.3); }
    else if (st === 'sweep') { const k = clamp(u / 0.9, 0, 1); S(B.UARM_L, -0.1, 0, lerp(2.55, 1.55, k)); S(B.UARM_R, -0.1, 0, lerp(-2.55, -1.55, k)); S(B.CHEST, 0, Math.sin(t * 3) * 0.2 * k, 0); }
    else if (st === 'stunned' && this.cfg.stunDrop !== undefined) P.y *= this.cfg.stunDrop;
    if (this.cfg.posePatch) this.cfg.posePatch(P, t, this);
  }
  draw(R) {
    super.draw(R);
    const S = BURNS_SPRITES.R, t = this.t, g = this.g;
    const b = this.beam2;
    if (b) {
      const c = Math.sin(b.ang), s = Math.cos(b.ang), n = 30, col = b.live ? [0.3, 0.95, 1] : [0.3, 0.6, 1];
      for (let i = 0; i <= n; i++) {
        const d = b.r0 + i / n * b.len, x = b.cx + c * d, z = b.cz + s * d, y = g.world.height(x, z) + b.y + Math.sin(t * 30 + i) * 0.1;
        if (b.live) { R.bbs.bb(x, y, z, 2.1, 2.1, S.glow, col, 0.95, true); R.bbs.bb(x, y, z, 0.75, 0.75, S.core, [0.85, 1, 1], 1, true); }
        else if (i % 3 === 0) R.bbs.bb(x, y, z, 1.2, 1.2, S.glow, col, 0.35 + 0.3 * Math.sin(t * 20), true);
      }
      if (b.live) {
        R.flat.flat(b.cx + c * (b.r0 + b.len / 2), 0.06, b.cz + s * (b.r0 + b.len / 2), 2.6, b.len, b.ang, S.glow, [0.2, 0.8, 1], 0.7, true);
        if (Math.random() < 0.8) { const d = b.r0 + Math.random() * b.len; g.fx.spark(b.cx + c * d, b.y, b.cz + s * d, 2, '#7af2ff', 4); }
      }
    }
    if (this.st === 'flash' && this.safe && this.flashK < 1) {
      const pul = 0.55 + 0.45 * Math.sin(t * 10);
      for (const q of this.safe) {
        R.flat.flat(q.x, q.y + 0.08, q.z, 3.4, 3.4, t * 1.5, S.ring, [0.35, 1, 0.55], 0.95 * pul, true);
        R.flat.flat(q.x, q.y + 0.07, q.z, 2.6, 2.6, 0, S.glow, [0.3, 1, 0.5], 0.55, true);
        R.bbs.streak(q.x, q.y + 2.2, q.z, 0, 1, 0, 4.4, 1.0, S.streak, [0.4, 1, 0.6], 0.5 * pul);
      }
    }
    if (this.st === 'devil' && this.stT < 0.95) for (const side of [1, -1]) { const hp = this.hand(side); if (Math.random() < 0.7) g.fx.dust(hp[0], hp[1], hp[2], 1, '#c8a888'); }
  }
}

/* a stand-in for g.boss: drives the HUD bar and the boss camera (which can aim lower than a giant's head) */
function burnsW8910Proxy(man, o) {
  o = o || {};
  return {
    get name() { return o.name ? o.name() : man.name; }, get hp() { return man.hp; }, get maxHp() { return man.maxHp; },
    get active() { return man.active; }, get defeated() { return man.defeated; }, get st() { return man.st; },
    head() { const h = man.hidden ? man.lastHead : man.head(); return o.camY === undefined ? h : [h[0], Math.min(h[1], man.y + o.camY * man.scale), h[2]]; },
    update() {}
  };
}
