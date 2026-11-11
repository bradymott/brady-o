/* ============================================================
   BRADY GOES TO BURNING MAN — Brady (player controller) + vehicles
   Moves: analog run, jump (variable height), double-jump flip, ground pound
   (ACTION in the air), spin attack (ACTION on the ground), enemy stomp,
   coyote time + jump buffer, ledge assist, springs, moving platforms,
   hazards (fire, flame jets, sinking mud), knockback + i-frames.
   Health = hydration drops. Power-ups from BURNS_POWERUPS.
   ============================================================ */

const BURNS_PHYS = {
  run: 7.6, accelG: 48, accelA: 20, decelG: 42, gravity: 32, jumpV: 11.2, djumpV: 10.2, cut: 0.5,
  coyote: 0.12, buffer: 0.14, step: 0.48, turnG: 15, turnA: 8, poundV: -30, spin: 0.45, stompV: 9.5, stompHi: 13.5
};

class BurnsPlayer {
  constructor(g) {
    this.g = g;
    this.x = 0; this.y = 0; this.z = 0; this.vx = 0; this.vy = 0; this.vz = 0; this.yaw = 0;
    this.r = 0.38; this.h = 1.8;
    this.grounded = true; this.groundCol = null; this.coyote = 0; this.jumpBuf = 0; this.jumps = 0; this.jumpCut = false;
    this.hydration = BURNS_HYDRATION_MAX; this.maxHydration = BURNS_HYDRATION_MAX;
    this.invT = 0; this.hurtT = 0; this.knockT = 0; this.landT = 0; this.spinT = 0; this.spinCd = 0;
    this.pound = 0; this.poundT = 0; this.climbT = 0; this.talkT = 0; this.victoryT = 0; this.danceT = 0;
    this.power = null; this.powerT = 0; this.giant = 0; this.ammo = 0; this.magnetT = 0; this.hiddenT = 0; this.mudSink = 0;
    this.grabbedBy = null; this.grabT = 0; this.mash = 0;
    this.vehicle = null; this.locked = false; this.dead = false;
    this.inp = { mx: 0, mz: 0, mag: 0, jump: false, jumpPressed: false, action: false, actionPressed: false };
    this.airT = 0; this.maxFallV = 0; this.stepT = 0; this.chatT = 0;
    this.rebuildModel();
  }
  // the mission item in Brady's right hand (third person: in his hand; first person: in view). null = empty hands.
  // Any held-prop name works (§6.5): ticket, zipties, glowstick, icebag, idcard, parcel, wrench, map, water, phone, camera...
  hold(item) { item = item || null; if (this.held === item) return; this.held = item; this.rebuildModel(); }
  rebuildModel() {
    const costume = BurnsSave.get().costume || 'none';
    const spec = BurnsRig.bradySpec(costume);
    if (this.held) spec.prop = BURNS_GEAR.prop[this.held] ? this.held : 'heldTag';
    spec.key = 'brady:' + JSON.stringify(spec);
    this.model = BurnsRig.model(spec);
    if (!this.ch) this.ch = new BurnsChar(this.model); else this.ch.setModel(this.model);
    this.ch.rim = 0.5;
  }
  get speedMul() { return (this.power === 'powder' && this.powerT > 0 ? 1.55 : 1) * (this.giant > 0 ? 1.2 : 1) * (this.mudSink > 0 ? 0.45 : 1) * (this.runK || 1); }   // runK: the RUN button / Shift (41_burns_nav.js)
  teleport(x, y, z, yaw) { this.x = x; this.y = y; this.z = z; this.vx = this.vy = this.vz = 0; if (yaw !== undefined) this.yaw = yaw; this.grounded = true; this.platform = null; }
  /* ---------- damage ---------- */
  hurt(n, fx, fz, kb, big) {
    if (this.invT > 0 || this.giant > 0 || this.dead || this.g.cine) return false;
    if (this.vehicle && this.vehicle.kind === 'bike') this.vehicle.dismount(this, true);
    this.hydration = Math.max(0, this.hydration - (n || 1));
    this.invT = 1.6; this.hurtT = 0.45;
    const dx = this.x - (fx === undefined ? this.x - Math.sin(this.yaw) : fx), dz = this.z - (fz === undefined ? this.z - Math.cos(this.yaw) : fz), d = Math.hypot(dx, dz) || 1;
    this.knock(dx / d * (kb || 6), 7, dz / d * (kb || 6));
    burnsSfx('hurt3d'); this.g.shake(big ? 0.5 : 0.25);
    this.g.fx.burst(this.x, this.y + 1.2, this.z, 'drop', 6, '#5ad0ff');
    this.say(['Ow!', 'My hydration!', 'Not the bun!', 'Dusty!'][Math.floor(Math.random() * 4)], 0.9);
    if (this.hydration <= 0) this.faint();
    return true;
  }
  heal(n) { const before = this.hydration; this.hydration = Math.min(this.maxHydration, this.hydration + n); return this.hydration > before; }
  knock(vx, vy, vz) { this.vx = vx; this.vy = vy; this.vz = vz; this.grounded = false; this.knockT = 0.35; this.platform = null; this.pound = 0; }
  faint() { if (this.dead) return; this.dead = true; this.ch.play('knocked'); this.g.onFaint(); }
  grab(by, dur) { this.grabbedBy = by; this.grabT = dur; this.mash = 0; this.vx = this.vz = 0; }
  release(hurt) { const by = this.grabbedBy; this.grabbedBy = null; if (hurt && by) { this.invT = 0; this.hurt(1, by.x, by.z, 7); } }
  say(text, dur) { this.g.playerBubble(text, dur); }
  /* ---------- power-ups ---------- */
  givePower(id) {
    const P = BURNS_POWERUPS[id]; if (!P) return;
    const g = this.g;
    const told = () => { if (g.missions) { g.missions.noteUse(id); g.missions.event('power', id); } };   // 'power' event + missions with use: id
    if (P.instant) { this.heal(P.heal || 1); g.fx.burst(this.x, this.y + 1.2, this.z, 'drop', 12, '#5ad0ff'); burnsSfx('hydrate', null, 'powerup'); g.banner(P.name, P.tip, { col: P.col, small: true }); told(); return; }
    this.endPower(true);
    this.power = id; this.powerT = P.dur; this.powerMax = P.dur;
    burnsSfx(P.sfx || 'pickup_bag');
    g.banner(P.name, P.tip, { col: P.col, small: true });
    if (id === 'molly') { this.heal(1); g.fx.hearts(this.x, this.y + 1.5, this.z, 14); this.say('I love everyone!', 1.6); }
    if (id === 'khole') { g.slow = 0.35; this.say('Whoooa... everything is... sloooow...', 2.2); }
    if (id === 'powder') { this.say('Let\'sgoLet\'sgoLet\'sGOOO!', 1.2); }
    if (id === 'lsd') { g.world.col.hiddenOn = true; this.say('The playa is... breathing...', 2); }
    if (id === 'shrooms') { this.giant = P.dur; this.say('I AM THE MAN NOW!', 1.8); g.shake(0.4); }
    if (id === 'weed') { this.say('Floatin\'...', 1.6); }
    if (id === 'bufo') { this.say('I can see the music!', 1.6); }
    if (id === 'liquor') { this.ammo = P.ammo || 8; this.say('Hold my bottle.', 1.4); }
    told();
  }
  endPower(silent) {
    const id = this.power; if (!id) return;
    this.power = null; this.powerT = 0;
    if (id === 'khole') this.g.slow = 1;
    if (id === 'lsd') this.g.world.col.hiddenOn = false;
    if (id === 'shrooms') this.giant = 0;
    if (id === 'liquor') this.ammo = 0;
    if (!silent) { burnsSfx('powerdown', { vol: 0.5 }); this.g.toast(BURNS_POWERUPS[id].name + ' WORE OFF'); }
  }
  /* ---------- per-step update ---------- */
  update(dt) {
    const g = this.g, W = g.world, I = this.inp, PH = BURNS_PHYS;
    if (this.invT > 0) this.invT -= dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    if (this.knockT > 0) this.knockT -= dt;
    if (this.spinCd > 0) this.spinCd -= dt;
    if (this.magnetT > 0) this.magnetT -= dt;
    if (this.hiddenT > 0) this.hiddenT -= dt;
    if (this.victoryT > 0) this.victoryT -= dt;
    if (this.powerT > 0) { this.powerT -= dt; if (this.giant > 0) this.giant = this.powerT; if (this.powerT <= 0) this.endPower(); }
    if (this.power === 'powder' && this.powerT > 0 && Math.random() < dt * 1.2 && this.grounded) this.say(['Wait wait wait—', 'Okay but hear me out—', 'I love this song!', 'Who wants to start a camp?', 'Let\'s go let\'s go!'][Math.floor(Math.random() * 5)], 0.8);
    if (this.dead) { this.ch.play('knocked'); return; }
    if (this.vehicle) { this.vehicle.ride(this, dt); return; }
    if (this.grabbedBy) {
      this.grabT -= dt;
      if (I.jumpPressed || I.actionPressed) { this.mash++; this.grabT -= 0.12; g.shake(0.05); }
      const b = this.grabbedBy; this.x = b.x + Math.sin(b.yaw) * 0.55; this.z = b.z + Math.cos(b.yaw) * 0.55; this.y = b.y; this.yaw = b.yaw + Math.PI;
      this.ch.play('hurt');
      if (this.mash >= 6) { this.grabbedBy = null; this.knock(Math.sin(b.yaw) * 6, 7, Math.cos(b.yaw) * 6); this.invT = 1; if (b.data) { b.data.mode = 'dizzy'; b.data.t = 2.4; } g.toast('BROKE FREE!'); }
      return;
    }
    const locked = this.locked || g.cine || g.dialog.open;
    let mx = locked ? 0 : I.mx, mz = locked ? 0 : I.mz;
    const mag = Math.min(1, Math.hypot(mx, mz));
    // ---- horizontal
    const control = this.knockT > 0 ? 0.15 : (this.pound ? 0 : (this.landT > 0 && this.pound === 0 && this.landHard ? 0.3 : 1));
    const maxSp = PH.run * this.speedMul * (this.spinT > 0 ? 0.85 : 1) * (this.talkT > 0 ? 0 : 1);
    const tx = mx * maxSp, tz = mz * maxSp;
    const acc = (this.grounded ? (mag > 0.05 ? PH.accelG : PH.decelG) : PH.accelA) * control * dt;
    let ddx = tx - this.vx, ddz = tz - this.vz; const dl = Math.hypot(ddx, ddz);
    if (dl > acc && dl > 0) { ddx *= acc / dl; ddz *= acc / dl; }
    if (this.knockT <= 0 || this.grounded) { this.vx += ddx; this.vz += ddz; }
    if (mag > 0.1 && control > 0.2 && this.spinT <= 0) this.yaw = BurnsM.dampAngle(this.yaw, Math.atan2(mx, mz), this.grounded ? PH.turnG : PH.turnA, dt);
    // ---- jump
    if (I.jumpPressed && !locked) this.jumpBuf = PH.buffer;
    if (this.jumpBuf > 0) this.jumpBuf -= dt;
    if (this.coyote > 0) this.coyote -= dt;
    const jumpMul = (this.power === 'powder' && this.powerT > 0 ? 1.18 : 1) * (this.giant > 0 ? 1.15 : 1);
    if (this.jumpBuf > 0 && !this.pound) {
      if (this.grounded || this.coyote > 0) {
        this.vy = PH.jumpV * jumpMul * (this.mudSink > 0 ? 0.75 : 1); this.grounded = false; this.coyote = 0; this.jumpBuf = 0; this.jumps = 1; this.jumpCut = false; this.platform = null;
        this.ch.play('jump', null, true); this.ch.kick(-3); burnsSfx('jump3d'); g.fx.dust(this.x, this.y + 0.05, this.z, 4);
        this.mudSink = 0;
      } else if (this.jumps < 2) {
        this.vy = PH.djumpV * jumpMul; this.jumps = 2; this.jumpBuf = 0; this.jumpCut = false;
        this.ch.play('flip', null, true); burnsSfx('doublejump'); g.fx.ring(this.x, this.y + 0.2, this.z, 0.8, '#ffffff', 0.35);
      }
    }
    if (!I.jump && this.vy > 0 && !this.jumpCut && this.jumps > 0 && this.knockT <= 0) { this.vy *= PH.cut; this.jumpCut = true; }
    // ---- action
    if (I.actionPressed && !locked) g.onAction();
    // ---- spin
    if (this.spinT > 0) {
      this.spinT -= dt;
      const R = this.giant > 0 ? 3.2 : 1.75;
      for (const a of g.actors) {
        if (a.hidden || a._spinHit === this.spinId) continue;
        if (Math.hypot(a.x - this.x, a.z - this.z) < R + a.r && Math.abs((a.y + a.h * 0.5) - (this.y + 0.9)) < 1.6) { a._spinHit = this.spinId; if (!a.friendly || a.def.hittable || a.behName === 'sleep') a.hit(this.power === 'molly' ? 'love' : 'spin', this.x, this.z); }
      }
      g.bossHit(this.x, this.y + 0.9, this.z, R * 0.8, 'spin');
      g.spinHit && g.spinHit(this.x, this.y, this.z, R);
      if (this.spinT <= 0) this.spinCd = 0.18;
    }
    // ---- gravity & special air movement
    let grav = PH.gravity;
    if (this.pound === 1) { this.poundT -= dt; this.vx = this.vz = 0; this.vy = 0; grav = 0; if (this.poundT <= 0) { this.pound = 2; this.vy = PH.poundV; burnsSfx('spin', { pitch: 0.6 }); } }
    if (this.power === 'weed' && this.powerT > 0 && I.jump && this.vy < 0) { grav = 4; this.vy = Math.max(this.vy, -1.6); if (Math.random() < dt * 8) g.fx.smoke(this.x, this.y + 0.3, this.z, 1, '#c8ffd0'); }
    if (this.power === 'bufo' && this.powerT > 0 && I.jump && !this.grounded) { this.vy = Math.min(this.vy + 46 * dt, 7.5); grav = 0; if (Math.random() < dt * 20) g.fx.burst(this.x, this.y + 0.2, this.z, 'star', 1, BURNS_NEON[Math.floor(Math.random() * 7)]); }
    if (this.knockT > 0 && this.grounded) { this.vx *= Math.exp(-6 * dt); this.vz *= Math.exp(-6 * dt); }
    this.vy -= grav * dt;
    if (this.vy < -40) this.vy = -40;
    // ---- integrate + collide
    const prevY = this.y;
    this.x += this.vx * dt; this.z += this.vz * dt;
    const R = this.giant > 0 ? this.r * 2.2 : this.r, H = this.giant > 0 ? this.h * 2.4 : this.h;
    const ox = this.x, oz = this.z;
    const wall = W.push(this, R, this.y, H, PH.step);
    if (wall && !this.grounded && this.vy < 6 && this.vy > -14 && mag > 0.3 && wall.walk) {
      // ledge assist: mantle onto tops within reach
      const top = W.col.topAt(wall, ox + Math.sin(this.yaw) * 0.4, oz + Math.cos(this.yaw) * 0.4, 0.3, [0, 0]);
      if (top !== -Infinity && top > this.y + PH.step && top < this.y + 1.45) { this.y = top; this.vy = 0; this.x = ox + Math.sin(this.yaw) * 0.45; this.z = oz + Math.cos(this.yaw) * 0.45; this.climbT = 0.25; this.ch.play('climb', null, true); }
    }
    this.y += this.vy * dt;
    const s = W.surface(this.x, this.z, Math.max(prevY, this.y) + PH.step, R * 0.55, BURNS_SURF);
    const was = this.grounded;
    if (this.vy <= 0 && this.y <= s.y + (was ? 0.3 : 0) && !(!was && this.onLand(s.col))) {
      this.y = s.y; this.vy = 0; this.grounded = true; this.groundCol = s.col; this.jumps = 0;
      this.platform = s.col && s.col.mover ? s.col.mover : null;
    } else if (this.sprung) { this.sprung = false; this.grounded = false; this.groundCol = null; this.platform = null; } else {
      if (was && this.vy <= 0) { this.coyote = PH.coyote; this.jumps = 1; }
      this.grounded = false; this.groundCol = null; this.platform = null;
    }
    // ceiling
    if (this.vy > 0) { const c = W.ceiling(this.x, this.z, this.y + H, this.y, R); if (c < this.y + H) { this.y = c - H; this.vy = 0; } }
    // stomp enemies while falling
    if (!this.grounded && this.vy < -2) {
      for (const a of g.actors) {
        if (a.hidden || a.defeated || (a.friendly && a.behName !== 'sleep')) continue;
        const top = a.y + a.h;
        if (Math.hypot(a.x - this.x, a.z - this.z) < a.r + R * 0.9 && this.y <= top + 0.25 && this.y >= top - 0.8) {
          a.hit(this.pound === 2 ? 'pound' : 'stomp', this.x, this.z);
          this.vy = I.jump ? PH.stompHi : PH.stompV; this.jumps = 1; this.pound = 0; this.jumpCut = false;
          this.ch.play('jump', null, true); burnsSfx('stomp'); g.fx.ring(this.x, top, this.z, 1.2, '#ffe24a', 0.3);
          break;
        }
      }
      if (g.bossHit(this.x, this.y, this.z, 0.6, this.pound === 2 ? 'pound' : 'stomp')) { this.vy = PH.stompHi; this.pound = 0; this.jumps = 1; }
    }
    // hazards
    this.hazards(dt, R);
    // world bounds (soft walls)
    const B = W.bounds;
    if (this.x < B.x0) { this.x = B.x0; this.vx = Math.max(0, this.vx); } if (this.x > B.x1) { this.x = B.x1; this.vx = Math.min(0, this.vx); }
    if (this.z < B.z0) { this.z = B.z0; this.vz = Math.max(0, this.vz); } if (this.z > B.z1) { this.z = B.z1; this.vz = Math.min(0, this.vz); }
    if (this.y < W.height(this.x, this.z) - 25) { this.hurt(1); this.g.respawn(true); }
    // timers & animation
    if (this.landT > 0) this.landT -= dt;
    if (this.climbT > 0) this.climbT -= dt;
    if (this.talkT > 0) this.talkT -= dt;
    this.airT = this.grounded ? 0 : this.airT + dt;
    if (!this.grounded) this.maxFallV = Math.min(this.maxFallV, this.vy);
    const hsp = Math.hypot(this.vx, this.vz);
    if (this.grounded && hsp > 1.5) { this.stepT -= dt * hsp; if (this.stepT <= 0) { this.stepT = 2.4; burnsSfx('footstep', { vol: 0.25 }); if (Math.random() < 0.5) g.fx.dust(this.x, this.y + 0.05, this.z, 1); } }
    this.animate(hsp);
  }
  onLand(col) {
    const g = this.g, fall = -this.maxFallV; this.maxFallV = 0;
    if (col && col.spring) { this.vy = col.spring; this.y = col.y1 + 0.01; this.grounded = false; this.jumps = 1; this.jumpCut = true; this.sprung = true; this.ch.play('flip', null, true); burnsSfx('spring', null, 'jumpBig'); g.fx.ring(this.x, col.y1, this.z, 1.5, '#ff4fd8', 0.4); g.missions.event('spring', col); return true; }
    if (this.pound === 2) {
      this.pound = 0; this.landT = 0.3; this.landHard = true;
      g.groundPound(this.x, this.y, this.z, this.giant > 0 ? 4.5 : 2.8);
      this.ch.play('land', null, true);
      return false;
    }
    this.landHard = fall > 18;
    if (fall > 8) { this.landT = 0.16; this.ch.play('land', null, true); burnsSfx('land', { vol: Math.min(1, fall / 25) }); g.fx.dust(this.x, this.y + 0.05, this.z, Math.min(12, Math.floor(fall / 3))); this.ch.kick(4); }
    if (this.giant > 0 && fall > 6) { g.shake(0.3); g.groundPound(this.x, this.y, this.z, 3.5, true); }
    return false;
  }
  hazards(dt, R) {
    const g = this.g, W = g.world;
    for (const f of W.fires) { if (!f.hazard) continue; if (Math.hypot(f.x - this.x, f.z - this.z) < f.r + R * 0.6 && this.y < f.y + 1.4 && this.y > f.y - 1.2) { if (this.hurt(1, f.x, f.z, 6)) { this.vy = 10; this.say('HOT HOT HOT!', 1); } } }
    for (const j of W.jets) { if (j.active && Math.hypot(j.x - this.x, j.z - this.z) < j.r + R * 0.6 && this.y < j.y + j.h && this.y > j.y - 0.6) { if (this.hurt(1, j.x, j.z, 7)) this.vy = 12; } }
    let inMud = false;
    for (const m of W.muds) { if (Math.hypot(m.x - this.x, m.z - this.z) < m.r && this.grounded && this.y < W.height(m.x, m.z) + 0.3) { inMud = true; break; } }
    if (inMud) { this.mudSink += dt; if (Math.random() < dt * 6) g.fx.dust(this.x, this.y, this.z, 1, '#6a5a5a'); if (this.mudSink > 3.2) { this.mudSink = 0; this.hurt(1); this.vy = 12; this.grounded = false; this.say('Gross! Grey water!', 1.2); } }
    else this.mudSink = Math.max(0, this.mudSink - dt * 2);
    for (const t of g.tempFires) { if (Math.hypot(t.x - this.x, t.z - this.z) < t.r + R * 0.5 && this.y < t.y + 1.0) { this.hurt(1, t.x, t.z, 5); } }
  }
  animate(hsp) {
    const ch = this.ch;
    if (this.animOverride) { ch.play(this.animOverride); return; }
    let a = ch.anim, k = null;
    if (this.dead) a = 'knocked';
    else if (this.hurtT > 0) a = 'hurt';
    else if (this.climbT > 0) a = 'climb';
    else if (this.spinT > 0) a = 'spin';
    else if (this.pound === 1) a = 'pound';
    else if (this.pound === 2) { a = 'pound'; k = { slam: true }; }
    else if (this.landT > 0 && this.landHard) a = 'land';
    else if (!this.grounded) {
      if (this.power === 'bufo' && this.powerT > 0 && this.inp.jump) a = 'fly';
      else if (this.power === 'weed' && this.powerT > 0 && this.inp.jump && this.vy <= 0) a = 'float';
      else if (ch.anim === 'flip' && ch.animT < 0.42) a = 'flip';
      else if (this.vy > 1.5) a = (ch.anim === 'flip' ? 'flip' : 'jump');
      else a = 'fall';
    }
    else if (this.landT > 0) a = 'land';
    else if (this.victoryT > 0) a = 'victory';
    else if (this.talkT > 0) a = 'talk';
    else if (hsp > 4.2) { a = 'run'; k = { rate: clamp(hsp / 7.6, 0.6, 1.5) }; }
    else if (hsp > 0.6) { a = hsp > 2.8 ? 'run' : 'walk'; k = { rate: clamp(hsp / (a === 'run' ? 7.6 : 2.2), 0.5, 1.4) }; }
    else { this.danceT += 1 / 120; a = this.danceT > 12 ? 'dance' : 'idle'; if (a === 'dance') k = { style: 1 }; }
    if (hsp > 0.6 || !this.grounded) this.danceT = 0;
    ch.play(a, k || ch.k);
    if (k) ch.k = k;
  }
}

/* ---------------- vehicles: the yellow bike + drivable art cars ---------------- */
class BurnsVehicle {
  // kind: 'bike' | 'car'. car: { build(m) -> {cols, seat:[x,y,z], poofers:[[x,y,z]...] }, x, z, yaw }
  constructor(g, kind, o) {
    this.g = g; this.kind = kind; this.o = o || {};
    this.x = o.x || 0; this.y = o.y || 0; this.z = o.z || 0; this.yaw = o.yaw || 0; this.speed = 0; this.vy = 0; this.t = 0; this.grounded = true;
    this.rider = null; this.visible = o.visible !== false; this.hornT = 0; this.flameT = 0;
    if (kind === 'bike') {
      this.model = BurnsBikeModel.build(o.col);
      this.bones = new Float32Array(this.model.nb * 12);
      this.maxSpeed = 12.5; this.accel = 9; this.turn = 3.2; this.r = 0.5;
    } else {
      // art cars are world movers: drivable and walkable (deck is a moving platform)
      this.mv = g.world.addMover(o.build || (m => BurnsProps.artcar(m, o)), {});
      this.info = this.mv.info;
      this.maxSpeed = o.maxSpeed || 8.5; this.accel = o.accel || 3.5; this.turn = o.turn || 0.9; this.r = (this.info.w || 4) * 0.5;
      this.seat = this.info.seat || [0, 2, 2]; this.poofers = this.info.poofers || [];
      this.syncMover();
    }
  }
  syncMover() { if (this.mv) { this.mv.x = this.x; this.mv.y = this.y; this.mv.z = this.z; this.mv.yaw = this.yaw; } }
  seatPos(out) { const s = this.seat, c = Math.cos(this.yaw), sn = Math.sin(this.yaw); out = out || [0, 0, 0]; out[0] = this.x + s[0] * c + s[2] * sn; out[1] = this.y + s[1]; out[2] = this.z - s[0] * sn + s[2] * c; return out; }
  mount(p) {
    this.rider = p; p.vehicle = this; p.pound = 0; p.spinT = 0;
    if (this.kind === 'bike') { this.visible = true; this.x = p.x; this.z = p.z; this.y = p.y; this.yaw = p.yaw; this.speed = Math.hypot(p.vx, p.vz) * 0.6; burnsSfx('mount', null, 'pick'); }
    else { burnsSfx(this.o.horn || 'artcarHorn'); this.g.toast(this.o.driveHint || (this.poofers.length ? 'YOU\'RE DRIVING! JUMP = HORN · ACTION = FLAMES' : 'YOU\'RE DRIVING! JUMP = HORN')); }
    this.g.missions.event('mount', this);
  }
  dismount(p, crash) {
    this.rider = null; p.vehicle = null;
    if (this.kind === 'bike') {
      p.vx = Math.sin(this.yaw) * this.speed * 0.5; p.vz = Math.cos(this.yaw) * this.speed * 0.5; p.vy = crash ? 6 : 5; p.grounded = false;
      this.speed = 0; if (crash) this.g.fx.dust(this.x, this.y, this.z, 8);
      this.visible = !this.o.summoned || !crash ? true : true;
    } else {
      const sp = this.seatPos(); const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
      p.teleport(sp[0] + c * (this.r + 1.2), this.y, sp[2] - s * (this.r + 1.2), this.yaw); p.vy = 6; p.grounded = false;
      this.speed = 0; this.parked = true;
      if (Sound.engine) Sound.engine(false, 0);
    }
    burnsSfx('dismount', null, 'pick');
  }
  ride(p, dt) {
    const g = this.g, I = p.inp, W = g.world, locked = p.locked || g.cine || g.dialog.open;
    const mx = locked ? 0 : I.mx, mz = locked ? 0 : I.mz, mag = Math.min(1, Math.hypot(mx, mz));
    this.t += dt;
    // steer toward the stick direction (camera-relative), throttle by stick magnitude
    if (mag > 0.15) {
      const want = Math.atan2(mx, mz), diff = BurnsM.wrap(want - this.yaw);
      const tr = this.turn * (this.kind === 'car' ? clamp(Math.abs(this.speed) / 3, 0.25, 1) : 1);
      this.yaw += clamp(diff, -tr * dt * 2, tr * dt * 2);
      const facing = Math.cos(diff);
      this.speed = approach(this.speed, this.maxSpeed * mag * Math.max(0.25, facing), this.accel * dt * (facing < 0 ? 2 : 1));
    } else this.speed = approach(this.speed, 0, (this.kind === 'bike' ? 7 : (this.o.brake || 3)) * dt);
    if (this.kind === 'bike') {
      // hop + bell
      if (I.jumpPressed && this.grounded && !locked) { this.vy = 7.2; this.grounded = false; burnsSfx('jump3d', { pitch: 1.2 }); }
      if (I.actionPressed && !locked) { this.bell(); }
      this.vy -= 26 * dt;
      const e = { x: this.x + Math.sin(this.yaw) * this.speed * dt, z: this.z + Math.cos(this.yaw) * this.speed * dt };
      const hit = W.push(e, 0.45, this.y, 1.6, 0.42);
      if (hit && this.speed > 7) { this.speed *= 0.3; g.shake(0.2); burnsSfx('bump'); }
      this.x = e.x; this.z = e.z; this.y += this.vy * dt;
      const s = W.surface(this.x, this.z, this.y + 0.45, 0.25, BURNS_SURF);
      if (this.vy <= 0 && this.y <= s.y + (this.grounded ? 0.3 : 0)) { if (!this.grounded && this.vy < -6) g.fx.dust(this.x, s.y, this.z, 4); this.y = s.y; this.vy = 0; this.grounded = true; } else this.grounded = false;
      // bowl over enemies
      if (this.speed > 6) for (const a of g.actors) if (!a.friendly && !a.defeated && Math.hypot(a.x - this.x, a.z - this.z) < 1.1) a.hit('bike', this.x, this.z);
      if (this.speed > 1 && Math.random() < dt * this.speed * 0.5) burnsSfx('bike_pedal', { vol: 0.2 });
      p.x = this.x; p.y = this.y + 0.42; p.z = this.z; p.yaw = this.yaw; p.vx = Math.sin(this.yaw) * this.speed; p.vz = Math.cos(this.yaw) * this.speed; p.vy = this.vy; p.grounded = this.grounded;
      p.ch.play('bike', { rate: 4 + this.speed * 0.9 });
      p.hazards(dt, p.r);
    } else {
      if (I.jumpPressed && !locked) { burnsSfx(this.o.horn || 'artcarHorn'); this.hornT = 0.6; const HL = this.o.hornLines || ['WOOO!', 'ART CAR!', 'Can I get on?!']; for (const a of g.actors) if (Math.hypot(a.x - this.x, a.z - this.z) < 14 && a.friendly && !a.boss) a.say(HL[Math.floor(Math.random() * HL.length)], 1.2); if (this.o.onHorn) this.o.onHorn(g, this); }
      if (I.action && !locked) this.flames(dt); else this.flameT = 0;
      const e = { x: this.x + Math.sin(this.yaw) * this.speed * dt, z: this.z + Math.cos(this.yaw) * this.speed * dt };
      // keep the car out of static geometry (simple: push its centre)
      const hit = W.push(e, this.r * 0.8, this.y, 2.5, 0.6, this.mv);
      if (hit) this.speed *= 0.5;
      this.x = e.x; this.z = e.z; this.y = W.height(this.x, this.z);
      const B = W.bounds; this.x = clamp(this.x, B.x0 + 4, B.x1 - 4); this.z = clamp(this.z, B.z0 + 4, B.z1 - 4);
      this.syncMover();
      for (const a of g.actors) if (!a.friendly && !a.defeated && Math.hypot(a.x - this.x, a.z - this.z) < this.r + 1 && Math.abs(this.speed) > 3) a.hit('bike', this.x, this.z);
      const sp = this.seatPos(); p.x = sp[0]; p.y = sp[1]; p.z = sp[2]; p.yaw = this.yaw; p.vx = p.vz = p.vy = 0; p.grounded = true;
      p.ch.play('drive', { steer: clamp(BurnsM.wrap(Math.atan2(mx, mz) - this.yaw) * (mag > 0.15 ? 1 : 0), -1, 1) });
      if (Sound.engine) Sound.engine(true, clamp(Math.abs(this.speed) / this.maxSpeed, 0.05, 1));
    }
  }
  // unridden art cars: follow an optional autopilot loop (o.path), otherwise park
  idle(dt) {
    if (this.kind !== 'car' || this.rider) return;
    const P = this.o.path;
    if (P && P.length > 1 && !this.parked) {
      this.pi = this.pi || 0;
      const t = P[this.pi], dx = t[0] - this.x, dz = t[1] - this.z, d = Math.hypot(dx, dz);
      if (d < 3) this.pi = (this.pi + 1) % P.length;
      const want = Math.atan2(dx, dz); this.yaw += clamp(BurnsM.wrap(want - this.yaw), -0.6 * dt, 0.6 * dt);
      this.speed = approach(this.speed, this.o.pathSpeed || 3, dt);
      this.x += Math.sin(this.yaw) * this.speed * dt; this.z += Math.cos(this.yaw) * this.speed * dt;
      this.y = this.g.world.height(this.x, this.z);
    } else this.speed = approach(this.speed, 0, dt * 3);
    this.syncMover();
  }
  bell() {
    const g = this.g;
    burnsSfx('bike_bell');
    for (const a of g.actors) { const d = Math.hypot(a.x - this.x, a.z - this.z); if (d < 9 && a.friendly && !a.boss) { a.say(['Thanks!', 'Nice bike!', '*ding ding*', 'Where\'d you get that?'][Math.floor(Math.random() * 4)], 1.2); a.vx += (a.x - this.x) / (d || 1) * 2; a.vz += (a.z - this.z) / (d || 1) * 2; } }
    g.missions.event('bell', this);
  }
  flames(dt) {
    const g = this.g;
    this.flameT += dt;
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    for (const q of this.poofers) {
      const x = this.x + q[0] * c + q[2] * s, z = this.z - q[0] * s + q[2] * c, y = this.y + q[1];
      for (let i = 0; i < 2; i++) g.fx.add(x, y, z, (Math.random() - 0.5) * 1.5, 9 + Math.random() * 5, (Math.random() - 0.5) * 1.5, 0.5, 1.4, 0.6, [1, 0.55, 0.15], 1, 'flame', 1);
      for (const a of g.actors) if (!a.friendly && !a.defeated && Math.hypot(a.x - x, a.z - z) < 3) a.hit('fire', x, z);
      g.pointLight(x, y + 3, z, 14, [1, 0.5, 0.15], 1.5);
    }
    if (Math.floor(this.flameT * 4) !== Math.floor((this.flameT - dt) * 4)) burnsSfx('flame_jet', { vol: 0.6 });
    g.missions.event('flames', this);
  }
  // per-frame visuals for the bike (rigid bones)
  poseBike(dt) {
    if (this.kind !== 'bike') return;
    const B = this.bones, M = this.model, lean = this.rider ? clamp(-(this.turnRate || 0) * 0.08, -0.3, 0.3) : 0;
    const spin = (this.wheelA = (this.wheelA || 0) + this.speed * dt / M.wheelR);
    const f = new Float32Array(12); BurnsM.a34Set(f, 0, this.x, this.y, this.z, this.yaw, 0, lean, 1, 1, 1);
    const t = new Float32Array(12);
    B.set(f, 0);
    BurnsM.a34Set(t, 0, 0, M.wheelR, M.front, 0, spin, 0, 1, 1, 1); BurnsM.a34Mul(B, 12, f, 0, t, 0);
    BurnsM.a34Set(t, 0, 0, M.wheelR, M.rear, 0, spin, 0, 1, 1, 1); BurnsM.a34Mul(B, 24, f, 0, t, 0);
    BurnsM.a34Set(t, 0, 0, 0.42, 0.0, 0, spin * 0.5, 0, 1, 1, 1); BurnsM.a34Mul(B, 36, f, 0, t, 0);
    BurnsM.a34Set(t, 0, 0, 0.95, 0.4, 0, 0, 0, 1, 1, 1); BurnsM.a34Mul(B, 48, f, 0, t, 0);
  }
}
