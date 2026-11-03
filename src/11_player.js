/* ============================================================
   Player — Brady
   ============================================================ */
class Player {
  constructor(g, x, y, power) {
    this.g = g;
    Object.assign(this, newPlayerBody(x, y, power > 0));
    this.power = power || 0; // 0 small, 1 big (psychedelic mushroom), 2 liquor (puke balls)
    this.fly = 0; this.floaty = 0; this.mounted = false; this.hang = false; this.hugT = 0;
    this.star = 0; this.invuln = 0; this.dead = false; this.state = 'play';
    this.anim = { state: 'idle', t: 0, phase: 0, speed: 0, blink: false, stroke: 0, happy: false };
    this.idleT = 0; this.blinkT = 2; this.throwT = 0; this.discs = 0; this.deathT = 0; this.growT = 0;
    this.prevBottom = this.y + this.h; this.inp = {}; this.springT = 0; this.hurtFlash = 0;
    // Super Brady-O World extras
    this.spin = false; this.spinVis = 0; this.pack = (g.packCarry !== undefined ? g.packCarry : null);
    this.fx = { molly: 0, khole: 0, powder: 0, lsd: 0 }; this.stunT = 0; this.slowT = 0; this.grabbedBy = null; this.grabMash = 0;
    this.carryVx = 0; this.rideVx = 0; this.pushX = 0;
    // world tour: signature item, LSD flight (then a glide down), the rainbow trail, smoke puffs
    this.sig = (g.sigCarry && g.level && g.level.tour) ? Object.assign({}, g.sigCarry) : null;
    this.lsdT = 0; this.glideT = 0; this.trail = []; this.puffs = 0; this.shotT = 0;
    const gifts = (Save.data && Save.data.gifts) || {};
    this.kandi = gifts.kandi ? 1 : 0;
    const ha = hairAnchor(this.x + this.w / 2, this.y + this.h, this.facing, this.power === 0, null);
    this.hair = makeHair(this.power === 0 ? BRADY_DIM.small.hairN : BRADY_DIM.big.hairN, ha.x, ha.y);
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get small() { return this.power === 0; }

  setPower(n, quiet) {
    const was = this.power;
    this.power = n;
    if ((was === 0) !== (n === 0)) {
      // resize hitbox keeping the feet planted
      const d = n === 0 ? PLAYER_DIM.small : PLAYER_DIM.big;
      const bottom = this.y + this.h, cx = this.cx;
      this.w = d.w; this.h = d.h; this.x = cx - d.w / 2; this.y = bottom - d.h;
      this.crouch = false;
      if (n > 0 && !regionFree(this.g.area, this.x, this.y, this.w, this.h)) {
        // not enough headroom: crouch until there is
        this.crouch = true; this.h = PLAYER_DIM.crouch.h; this.y = bottom - this.h;
      }
      const ha = hairAnchor(this.cx, this.y + this.h, this.facing, n === 0, null);
      this.hair = makeHair(n === 0 ? BRADY_DIM.small.hairN : BRADY_DIM.big.hairN, ha.x, ha.y);
      if (!quiet) { this.growT = 0.6; this.growFrom = was; }
    }
    if (!quiet) Sound.play(n > was ? 'powerup' : 'powerdown');
  }

  hurt(src) {
    if (this.dead || this.state !== 'play') return;
    if (this.star > 0) { if (src && src.enemy && !src.boss && src.hit) { if (src.hit('star', this)) this.g.chainScore(src); } return; }
    if (this.fx.molly > 0) { if (src && src.enemy && !src.boss && src.hit) { if (src.hit('love', this)) this.g.chainScore(src); } return; }
    if (this.invuln > 0) return;
    if (this.grabbedBy) { const gb = this.grabbedBy; this.grabbedBy = null; if (gb.release) gb.release(true); }
    if (this.mounted) { this.dismount(true); return; }
    if (this.kandi > 0) {
      // kandi bracelets snap instead of Brady taking the hit
      this.kandi--; this.invuln = 1.6; this.hurtFlash = 0.3;
      Sound.play('powerdown', { vol: 0.6 }); this.g.shake(3);
      this.g.burst(this.cx, this.cy, 18, '#ff7ad8', 'confetti'); this.g.parts.text(this.cx, this.y - 8, 'KANDI SNAPPED!', '#ff9ad8');
      if (src && src.x !== undefined) this.vx = (this.cx < (src.x + (src.w || 0) / 2) ? -1 : 1) * 4 * TS;
      this.vy = Math.min(this.vy, -6 * TS);
      return;
    }
    if (this.power > 0) {
      this.setPower(this.power === 2 ? 1 : 0, true);
      Sound.play('powerdown');
      this.invuln = 2.0; this.hurtFlash = 0.3;
      this.g.shake(4);
      this.g.burst(this.cx, this.cy, 12, '#ff4fd8', 'spark');
      if (src && src.x !== undefined) this.vx = (this.cx < (src.x + (src.w || 0) / 2) ? -1 : 1) * 4 * TS;
      this.vy = Math.min(this.vy, -6 * TS);
    } else this.die();
  }

  die(reason) {
    if (this.dead) return;
    this.dead = true; this.state = 'dying'; this.deathT = 0;
    this.vy = -12 * TS; this.vx = 0; this.star = 0;
    Sound.stopMusic(); Sound.play('die');
    this.g.shake(8);
    this.g.onPlayerDying(reason);
  }

  // timed effects already running? the new power-up goes to the pack instead (if it's empty)
  busy(kind) {
    if (kind === 'coffee') return this.power > 0;
    if (kind === 'vinyl') return this.power === 2;
    return this.star > 0 || this.fly > 0 || this.floaty > 0 || this.fx.molly > 0 || this.fx.khole > 0 || this.fx.powder > 0 || this.fx.lsd > 0;
  }
  collect(kind, src) {
    const g = this.g;
    if (g.level && g.level.tour) return this.collectTour(kind, src);
    const packable = kind !== 'gold' && kind !== 'cassette';
    if (packable && !this.usingPack && this.busy(kind) && !this.pack) {
      this.pack = kind; Sound.play('appear'); sfx('pickup_bag', null, { vol: 0.5 });
      g.addScore(500, this.cx, this.y); g.toast('SAVED TO YOUR PACK \u2014 TAP IT TO USE');
      return;
    }
    switch (kind) {
      case 'coffee': // psychedelic mushroom
        if (this.power === 0) this.setPower(1); else { Sound.play('powerup'); }
        Sound.play('mushroom'); g.trip = Math.max(g.trip || 0, 1.8);
        g.addScore(1000, this.cx, this.y); g.burst(this.cx, this.cy, 20, '#ffcf7a', 'confetti');
        g.toast('WHOA. THE COLORS.');
        break;
      case 'vinyl': // a bottle of liquor: green puke balls
        this.setPower(2); g.addScore(1000, this.cx, this.y); g.burst(this.cx, this.cy, 16, '#8ae84a', 'confetti');
        g.toast('LIQUID COURAGE! TAP THROW TO PUKE');
        break;
      case 'eclipse': // disco ball
        this.star = 10; Sound.play('disco'); g.mus('star'); g.addScore(1000, this.cx, this.y);
        g.toast('DISCO FEVER!');
        break;
      case 'cassette': // water bottle
        Sound.play('hydrate'); g.addLife(this.cx, this.y); g.toast('HYDRATE OR DIE-DRATE');
        break;
      case 'bufo': // the toad that lets Brady fly
        this.fly = 12; this.floaty = 0; Sound.play('bufo'); g.trip = Math.max(g.trip || 0, 0.9);
        g.addScore(1000, this.cx, this.y); g.burst(this.cx, this.cy, 24, '#c08aff', 'confetti'); g.toast('TOAD TRIP! HOLD JUMP TO FLY');
        break;
      case 'joint': // floats like a balloon
        this.floaty = 9; this.fly = 0; Sound.play('float'); this.vy = Math.min(this.vy, -2 * TS);
        g.addScore(500, this.cx, this.y); g.burst(this.cx, this.cy, 10, '#e8e8f0', 'dust'); g.toast('FLOATY... HOLD DOWN TO SINK');
        break;
      case 'molly': // Love Bomb: burners you touch become dancing friends
        this.fx.molly = BAG_KINDS.molly.time; this.invuln = Math.max(this.invuln, 1.2); sfx('molly', 'disco');
        g.addScore(1000, this.cx, this.y); g.burst(this.cx, this.cy, 30, '#ff7ab8', 'confetti'); g.toast('LOVE BOMB! EVERYONE IS YOUR FRIEND');
        break;
      case 'khole': // K-Hole: the world slows down around Brady
        this.fx.khole = BAG_KINDS.khole.time; sfx('khole', 'portal');
        g.addScore(1000, this.cx, this.y); g.burst(this.cx, this.cy, 20, '#7ab8ff', 'bubble'); g.toast('K-HOLE... EVERYTHING... SLOWS... DOWN');
        break;
      case 'powder': // Party Powder: faster legs, higher jumps
        this.fx.powder = BAG_KINDS.powder.time; sfx('powder', 'powerup');
        g.addScore(1000, this.cx, this.y); g.burst(this.cx, this.cy, 24, '#ffffff', 'spark'); g.toast('PARTY POWDER! GO GO GO');
        break;
      case 'lsd': // LSD: hidden blocks and secret ledges show up; the colors melt
        this.fx.lsd = BAG_KINDS.lsd.time; sfx('lsd', 'mushroom'); g.trip = Math.max(g.trip || 0, 1.2);
        g.addScore(1000, this.cx, this.y); g.burst(this.cx, this.cy, 24, '#c87aff', 'confetti'); g.toast('LSD: THE HIDDEN STUFF SHOWS UP');
        break;
      case 'gold':
        g.collectGold(src.idx, src.cx, src.cy);
        break;
    }
    if (kind !== 'gold') g.flashText = null;
  }
  // the world tour's pickups: magic mushroom, joint, LSD tab, star, water bottle, signature items
  collectTour(kind, src) {
    const g = this.g;
    if (kind === 'coffee') kind = 'mushroom'; else if (kind === 'vinyl') kind = 'joint'; else if (kind === 'eclipse') kind = 'star'; else if (kind === 'cassette') kind = 'oneup'; else if (kind === 'bufo') kind = 'lsd';
    if (kind && kind.startsWith('sig:')) {
      const P = TourPowers.get(kind.slice(4));
      if (!P) return;
      this.sig = { id: P.id, t: P.time || 0, n: 0 };
      Sound.play('powerup'); g.addScore(1000, this.cx, this.y); g.burst(this.cx, this.cy, 24, '#ffe08a', 'confetti');
      g.toast(P.name + '! ' + (P.hint || ''));
      if (P.onCollect) P.onCollect(this, g);
      return;
    }
    switch (kind) {
      case 'mushroom': // grow, and the whole screen goes colorful and dizzy for a few seconds
        if (this.power === 0) this.setPower(1); else Sound.play('powerup');
        Sound.play('mushroom'); g.dizzy = 4.2;
        g.addScore(1000, this.cx, this.y); g.burst(this.cx, this.cy, 24, '#c8a0ff', 'confetti');
        g.toast('MAGIC MUSHROOM! WHOA... THE COLORS');
        break;
      case 'joint': // power 2: blow smoke puffs
        this.setPower(2); g.addScore(1000, this.cx, this.y); g.burst(this.cx, this.cy, 14, '#e8e8f0', 'dust');
        Sound.play('float', { vol: 0.6 });
        g.toast('PUFF PUFF! TAP THROW TO BLOW SMOKE');
        break;
      case 'lsd': // timed free flight with a rainbow trail and rainbow lasers
        this.lsdT = 10; this.glideT = 0; this.fly = 0; this.floaty = 0; this.trail.length = 0; this.vy = Math.min(this.vy, -3 * TS);
        TourKit.sfx('lsd', 'mushroom'); g.addScore(1000, this.cx, this.y); g.burst(this.cx, this.cy, 30, '#ffffff', 'confetti');
        g.toast('LSD TAB! FLY ANYWHERE  ·  THROW = RAINBOW LASERS');
        break;
      case 'star':
        this.star = 10; Sound.play('disco'); g.mus('star'); g.addScore(1000, this.cx, this.y);
        { const C = Tour.countryOf(g.id); g.toast((C && C.star && C.star.name ? C.star.name : 'GOLDEN GLOBE') + '! INVINCIBLE'); }
        break;
      case 'oneup':
        Sound.play('hydrate'); g.addLife(this.cx, this.y); g.toast('WATER BOTTLE! STAY HYDRATED');
        break;
      case 'gold':
        g.collectGold(src.idx, src.cx, src.cy);
        break;
    }
  }
  usePack() {
    const k = this.pack;
    if (!k || this.dead || this.state !== 'play') return false;
    if (k === 'coffee' && this.power > 0) { this.g.toast('ALREADY BIG'); Sound.play('bump', { vol: 0.4 }); return false; }
    if (k === 'vinyl' && this.power === 2) { this.g.toast('ALREADY HOLDING A BOTTLE'); Sound.play('bump', { vol: 0.4 }); return false; }
    this.pack = null;
    if (BAG_KINDS[k] || k === 'bufo' || k === 'joint' || k === 'eclipse') { this.star = Math.min(this.star, 0.01); this.fly = 0; this.floaty = 0; for (const f in this.fx) this.fx[f] = 0; }
    this.usingPack = true; this.collect(k); this.usingPack = false;
    this.g.burst(this.cx, this.cy, 12, '#ffd84a', 'spark');
    return true;
  }
  stun(t) { if (this.star > 0 || this.fx.molly > 0) return; this.stunT = Math.max(this.stunT, t); this.vx *= 0.3; this.g.parts.text(this.cx, this.y - 10, 'DAZED', '#ffffff'); }
  slowDown(t) { if (this.star > 0 || this.fx.molly > 0) return; this.slowT = Math.max(this.slowT, t); }

  update(dt, inp) {
    const g = this.g, A = g.area;
    this.inp = inp;
    this.anim.t += dt;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    if (this.state === 'dying') {
      this.deathT += dt;
      if (this.deathT > 0.45) { this.vy += PHYS.gDown * 0.55 * dt; this.y += this.vy * dt; }
      this.anim.state = 'die';
      if (this.deathT > 2.4) g.onPlayerDead();
      return;
    }
    if (this.growT > 0) { this.growT -= dt; this.updateHair(dt); return; }
    if (this.state === 'portal') { this.portalT += dt; this.updateHair(dt); return; }
    if (this.state === 'clear') { this.updateClear(dt); return; }

    if (this.invuln > 0) this.invuln -= dt;
    for (const f in this.fx) if (this.fx[f] > 0) { this.fx[f] -= dt; if (this.fx[f] <= 0) { this.fx[f] = 0; Sound.play('float', { pitch: 0.7, vol: 0.4 }); } }
    if (this.stunT > 0) { this.stunT -= dt; inp = { left: false, right: false, up: false, down: false, jump: false, action: false, jumpPressed: false, actionPressed: false }; }
    if (this.slowT > 0) this.slowT -= dt;
    if (this.spinVis > 0) this.spinVis -= dt;
    // a greeter's hug: wriggle (jump / left / right) to break free
    if (this.grabbedBy) {
      const gb = this.grabbedBy;
      if (gb.dead || gb.remove) this.grabbedBy = null;
      else {
        if (inp.jumpPressed || inp.actionPressed || (inp.left && !this.lastL) || (inp.right && !this.lastR)) { this.grabMash++; this.g.burst(this.cx, this.y + 6, 2, '#ff9ad8', 'spark'); }
        this.lastL = inp.left; this.lastR = inp.right;
        if (this.grabMash >= 5) { this.grabbedBy = null; gb.release(false); }
        this.vx = 0; this.vy = 0; this.anim.state = 'fall'; this.updateHair(dt);
        return;
      }
    }
    if (this.star > 0) {
      this.star -= dt;
      if (Math.random() < 0.5) g.burst(this.x + Math.random() * this.w, this.y + Math.random() * this.h, 1, `hsl(${Math.random() * 360},100%,70%)`, 'spark');
      if (this.star <= 0) { this.star = 0; g.resumeMusic(); }
    }
    if (this.dropT > 0) this.dropT -= dt;
    if (this.throwT > 0) this.throwT -= dt;
    if (this.hugT > 0) this.hugT -= dt;
    if (this.fly > 0) { this.fly -= dt; if (this.fly <= 0) { this.fly = 0; this.g.toast('THE TOAD WORE OFF'); } }
    if (this.floaty > 0) { this.floaty -= dt; if (this.floaty <= 0) { this.floaty = 0; Sound.play('float', { pitch: 0.7, vol: 0.5 }); } }
    if (this.springT > 0) this.springT -= dt;

    // ride moving platforms (and keep their momentum when jumping off)
    if (this.ride && !this.ride.dead) { this.x += this.ride.dx || 0; this.y += this.ride.dy || 0; this.rideVx = (this.ride.dx || 0) / dt; }
    else if (this.onGround) this.rideVx = 0;

    // crouch (big only)
    const wantCrouch = inp.down && this.onGround && this.power > 0 && !this.inWater;
    if (wantCrouch && !this.crouch) { this.crouch = true; const b = this.y + this.h; this.h = PLAYER_DIM.crouch.h; this.y = b - this.h; }
    else if (!wantCrouch && this.crouch && this.power > 0) {
      const b = this.y + this.h;
      if (regionFree(A, this.x, b - PLAYER_DIM.big.h, this.w, PLAYER_DIM.big.h)) { this.crouch = false; this.h = PLAYER_DIM.big.h; this.y = b - this.h; }
    }
    // drop through one-way platforms
    if (inp.down && inp.jumpPressed && this.onGround && this.groundTile === T.SEMI) { this.dropT = 0.22; this.y += 2; this.onGround = false; inp = Object.assign({}, inp, { jumpPressed: false }); }

    this.prevBottom = this.y + this.h;
    const windDx = (g.windForce || 0) + (this.pushX || 0);
    this.pushX = 0;
    // hanging from a ceiling with Slothy: shuffle along, jump to let go
    if (this.hang) {
      const head = tileAt(A, Math.floor(this.cx / TS), Math.floor((this.y - 3) / TS));
      const still = SOLID[head] || head === T.SEMI;
      if (!still || inp.jumpPressed || inp.down) { this.hang = false; this.vy = 1 * TS; }
      else {
        this.vy = 0; const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
        if (dir) this.facing = dir;
        this.vx = dir * 2.6 * TS;
        moveBody(this, A, dt, { semis: false });
        this.vy = 0; this.updateAnim(dt, inp); this.updateHair(dt);
        return;
      }
    }
    // LSD flight: steer freely (stick / jump to rise, down to sink); then a gentle glide down
    // a signature item with { flight: true } (Morocco's flying carpet) steers like the LSD flight
    const sigFly = !!(this.sig && typeof TourPowers !== 'undefined' && (TourPowers.get(this.sig.id) || {}).flight);
    const tripping = (this.lsdT > 0 || sigFly) && !this.inWater;
    if (this.lsdT > 0) {
      this.lsdT -= dt;
      if (this.lsdT <= 2 && this.lsdT + dt > 2) g.toast('COMING DOWN...');
      if (this.lsdT <= 0) { this.lsdT = 0; this.glideT = this.onGround ? 0 : 3; Sound.play('float', { pitch: 0.8, vol: 0.4 }); }
    }
    if (this.glideT > 0) { this.glideT -= dt; if (this.onGround || this.inWater) this.glideT = 0; }
    if (this.lsdT > 0 || this.glideT > 0) { this.trail.unshift([this.cx - this.facing * 6, this.y + this.h * 0.55]); if (this.trail.length > 28) this.trail.pop(); }
    else if (this.trail.length) this.trail.pop();
    if (tripping) {
      const up = inp.up || inp.jump, dn = inp.down;
      this.vy = approach(this.vy, up && !dn ? -6.8 * TS : dn && !up ? 6.8 * TS : 0, 42 * TS * dt);
      this.jumping = false;
      inp = Object.assign({}, inp, { jump: false, jumpPressed: false, down: false });
      if (this.y < -TS * 2) { this.y = -TS * 2; this.vy = Math.max(this.vy, 0); }
    }
    const floating = this.floaty > 0 && !this.inWater, flying = this.fly > 0 && !this.inWater;
    if (floating && !this.onGround) inp = Object.assign({}, inp, { jumpPressed: false });
    // a balloon doesn't stay on the ground: lift off unless Brady holds down
    if (floating && this.onGround && !inp.down) { this.vy = -3 * TS; this.onGround = false; }
    const gScale = tripping ? 0 : this.glideT > 0 ? 0.18 : floating ? 0.12 : (flying && inp.jump && !this.onGround) ? 0.25 : 1;
    // headbang spin: tap jump again in mid-air
    const nearGround = () => { const fy = Math.floor((this.y + this.h + 22) / TS); for (const tx of [Math.floor((this.x + 2) / TS), Math.floor((this.x + this.w - 2) / TS)]) { const t = tileAt(A, tx, fy); if (SOLID[t] || t === T.SEMI) return true; } return this.vy > 0 && g.platforms.some(pl => !pl.dead && this.x + this.w > pl.x && this.x < pl.x + pl.w && pl.y - (this.y + this.h) < 24 && pl.y > this.y); };
    if (inp.jumpPressed && !this.onGround && !this.spin && !this.mounted && !this.inWater && !(this.fly > 0) && !(this.floaty > 0) && !tripping && !(this.glideT > 0) && this.coyote <= 0 && !(this.vy > 0 && nearGround())) {
      this.spin = true; this.spinVis = 0.3; inp = Object.assign({}, inp, { jumpPressed: false });
      if (this.vy > -2.4 * TS) this.vy = -2.4 * TS;
      sfx('spin', 'headbang', { vol: 0.6 }); g.burst(this.cx, this.y + 8, 6, '#ffffff', 'spark');
    }
    const gifts = Save.data.gifts || {};
    const sigP = this.sig ? TourPowers.get(this.sig.id) : null;
    const speedMul = (this.slowT > 0 ? 0.55 : 1) * (this.fx.powder > 0 ? 1.3 : 1) * (gifts.bike ? 1.12 : 1) * (tripping ? 1.25 : 1) * (sigP && sigP.speedMul ? sigP.speedMul : 1);
    const jumpBoost = (this.mounted ? 1.12 : 1) * (this.fx.powder > 0 ? 1.14 : 1) * (sigP && sigP.jumpBoost ? sigP.jumpBoost : 1);
    const wasGround = this.onGround, rideWas = this.ride;
    const ev = playerPhysics(this, inp, A, dt, g.platforms, { windDx, noCrouchJump: false, jumpBoost, gScale, speedMul });
    if (this.glideT > 0 && this.vy > 2.2 * TS) this.vy = 2.2 * TS;
    if (ev.jump && rideWas && !rideWas.carrier) this.carryVx = this.rideVx * 0.85;
    if (ev.jump && rideWas && rideWas.carrier) this.carryVx = this.rideVx;
    if (ev.bounce) { Sound.play('spring', { vol: 0.45, pitch: 1.3 }); g.burst(this.cx, this.y + this.h, 4, '#ffffff', 'dust'); }
    // a spin landing breaks bricks and pops blocks under Brady's boots
    if (this.spin && ev.landed) {
      let broke = false;
      const ty = Math.floor((this.y + this.h + 2) / TS);
      for (const tx of [Math.floor((this.x + 3) / TS), Math.floor((this.x + this.w - 3) / TS)]) {
        const t = tileAt(A, tx, ty);
        if (t === T.BRICK) { g.bumpBlock(tx, ty, true, this); broke = true; }
        else if (t === T.QBLOCK || t === T.QBRICK) { g.bumpBlock(tx, ty, true, this); }
      }
      if (broke) { this.onGround = false; this.vy = 3 * TS; g.shake(3); }
      else { this.spin = false; }
    }
    if (this.onGround || this.inWater || this.fly > 0 || this.floaty > 0 || this.hang) this.spin = false;
    // bufo flight: hold jump to climb, let go to glide
    if (this.fly > 0 && !this.inWater) {
      if (inp.jump && !this.onGround) this.vy = approach(this.vy, -7.5 * TS, 70 * TS * dt);
      else if (inp.jump && this.onGround && inp.jumpPressed) this.vy = -9 * TS;
      else if (this.vy > 2.4 * TS) this.vy = 2.4 * TS;
      if (this.y < -TS * 3) { this.y = -TS * 3; this.vy = Math.max(this.vy, 0); }
      if (Math.random() < 0.6) g.burst(this.cx - this.facing * 8, this.cy + 6, 1, `hsl(${(this.anim.t * 300) % 360},100%,65%)`, 'spark');
    }
    // joint float: drift upward like a balloon
    if (this.floaty > 0 && !this.inWater) {
      const target = inp.down ? 2.6 * TS : -1.5 * TS;
      this.vy = approach(this.vy, target, 30 * TS * dt);
      this.jumping = false;
      if (this.y < -TS * 2) { this.y = -TS * 2; this.vy = Math.max(this.vy, 0); }
      if (Math.random() < 0.12) g.burst(this.cx + this.facing * 6, this.y + 6, 1, '#e8e8f0', 'dust');
    }
    // Slothy can grab ceilings: press up while touching one
    if (this.mounted && ev.bonks && (inp.up || inp.jump)) { this.hang = true; this.vy = 0; Sound.play('sloth', { vol: 0.5 }); }

    if (ev.jump) { Sound.play(this.power ? 'jumpBig' : 'jump'); g.burst(this.cx, this.y + this.h, 5, '#ffffff', 'dust'); this.idleT = 0; }
    if (ev.swim) { Sound.play('swim', { vol: 0.5 }); g.burst(this.cx, this.y + 6, 3, '#bfefff', 'bubble'); }
    if (ev.landed) {
      g.chain = 0;
      if (this.vyBeforeLand > 9 * TS) g.burst(this.cx, this.y + this.h, 6, '#ffffff', 'dust');
    }
    this.vyBeforeLand = this.vy;
    if (ev.bonks) for (const b of ev.bonks) g.bumpBlock(b.tx, b.ty, this.power > 0, this);

    // Slothy's hug turns a hostile burner into a friend
    if (this.mounted && inp.actionPressed && this.hugT <= 0 && this.power !== 2) {
      this.hugT = 0.5; Sound.play('slothHug');
      const zone = { x: this.facing > 0 ? this.x + this.w - 4 : this.x - 30, y: this.y, w: 34, h: this.h };
      for (const e of g.entities) if (e.enemy && !e.dead && !e.boss && overlap(zone, e)) { e.hit('hug', this); g.addScore(200, e.cx, e.y); g.burst(e.cx, e.cy, 10, '#ff9ad8', 'confetti'); }
    }
    // world tour actions: rainbow lasers while tripping, then the signature item, then smoke puffs
    if (this.shotT > 0) this.shotT -= dt;
    if (this.sig) {
      const P = sigP;
      if (P && P.update) P.update(this, dt, inp, g);
      if (this.sig && this.sig.t > 0) { this.sig.t -= dt; if (this.sig.t <= 0) { this.sig = null; g.toast('THE SOUVENIR WORE OFF'); } }
    }
    let acted = false;
    if (g.level && g.level.tour && inp.actionPressed && !this.crouch) {
      if (this.lsdT > 0 && this.shotT <= 0) {
        this.shotT = 0.16; acted = true;
        g.spawn(new RainbowLaser(g, this.cx + this.facing * 14, this.y + (this.small ? 12 : 20), this.facing, (inp.up ? -4 : inp.down ? 4 : 0) * TS));
        Sound.play('laser', { pitch: 1.5, vol: 0.4 }); this.throwT = 0.12;
      } else if (this.sig && sigP && sigP.action && this.shotT <= 0) {
        if (sigP.action(this, g)) { acted = true; this.shotT = sigP.cooldown || 0.3; this.throwT = 0.18; }
      }
      if (!acted && this.power === 2 && this.puffs < 3 && this.shotT <= 0) {
        this.puffs++; this.shotT = 0.22; acted = true;
        const pf = new SmokePuff(g, this.cx + this.facing * 14, this.y + (this.small ? 10 : 16), this.facing);
        pf.onRemove = () => { this.puffs--; };
        g.spawn(pf); this.throwT = 0.2;
        Sound.play('fly', { pitch: 0.55, vol: 0.5 });
      }
    }
    // throw green puke balls
    if (!(g.level && g.level.tour) && this.power === 2 && inp.actionPressed && this.discs < 2 && !this.crouch) {
      this.discs++;
      const d = new Disc(g, this.cx + this.facing * 12, this.y + (this.small ? 12 : 22), this.facing);
      d.onRemove = () => { this.discs--; };
      g.spawn(d);
      this.throwT = 0.18;
      Sound.play('puke');
    }

    // pick tiles
    const px0 = Math.floor(this.x / TS), px1 = Math.floor((this.x + this.w - 0.01) / TS);
    const py0 = Math.floor(this.y / TS), py1 = Math.floor((this.y + this.h - 0.01) / TS);
    for (let ty = py0; ty <= py1; ty++) for (let tx = px0; tx <= px1; tx++) {
      if (tileAt(A, tx, ty) === T.PICK) { g.setTile(tx, ty, T.EMPTY); g.addPick(tx * TS + TS / 2, ty * TS + TS / 2); }
    }
    // hazards
    if (lavaContact(this, A)) { this.die('lava'); return; }
    if (A.risingLava && this.y + this.h > g.lavaY + 6) { this.die('lava'); return; }
    if (spikeContact(this, A)) this.hurt({ x: this.x, w: this.w, spikes: true });
    if (this.y > A.H * TS + 20) { this.die('pit'); return; }
    // autoscroll: the screen edge pushes Brady along
    if (A.autoscroll) {
      const minX = g.camX + 4;
      if (this.x < minX) {
        this.x = minX;
        if (!regionFree(A, this.x, this.y, this.w, this.h)) this.die('crush');
      }
      const maxX = g.camX + g.viewW - this.w - 4;
      if (this.x > maxX) this.x = maxX;
    }
    if (this.x < 0) this.x = 0;

    this.updateAnim(dt, inp);
    this.updateHair(dt);
  }

  updateClear(dt) {
    // walk to the gate's centre, then strike a pose
    const gate = this.clearGate;
    this.vy += PHYS.gDown * dt; if (this.vy > PHYS.maxFall) this.vy = PHYS.maxFall;
    const tx = gate ? gate.cx - this.w / 2 : this.x;
    if (Math.abs(this.x - tx) > 2 && this.clearT < 1.6) { this.vx = sign(tx - this.x) * PHYS.walk * 0.7; this.facing = sign(this.vx); }
    else this.vx = 0;
    moveBody(this, this.g.area, dt, { semis: true, platforms: this.g.platforms });
    this.clearT = (this.clearT || 0) + dt;
    if (this.vx) { this.anim.state = 'run'; this.anim.speed = 0.7; this.anim.phase += dt * 14; }
    else { this.anim.state = 'victory'; if (!this.victoryStart) { this.victoryStart = true; this.anim.t = 0; this.facing = 1; } }
    this.updateHair(dt);
  }

  updateAnim(dt, inp) {
    const a = this.anim;
    const moving = Math.abs(this.vx) > 8;
    let st;
    if (this.hang) st = 'hang';
    else if (this.mounted) st = 'ride';
    else if (this.spin && !this.onGround) st = 'headbang';
    else if (this.floaty > 0 && !this.onGround) st = 'float';
    else if ((this.fly > 0 || this.lsdT > 0) && !this.onGround) st = 'fly';
    else if (this.glideT > 0 && !this.onGround) st = 'float';
    else if (this.inWater) st = 'swim';
    else if (!this.onGround) st = this.vy < 0 ? 'jump' : 'fall';
    else if (this.crouch) st = 'crouch';
    else if (moving && inp && ((inp.left && this.vx > 30) || (inp.right && this.vx < -30))) st = 'skid';
    else if (moving) st = 'run';
    else st = 'idle';
    // idle easter eggs: air guitar, then phone scrolling
    if (st === 'idle' && !inp.left && !inp.right && !inp.jump && !inp.down && !inp.up) {
      this.idleT += dt;
      if (this.idleT > 7 && this.idleT < 20) {
        st = 'airguitar';
        if (!this.riffPlayed) { this.riffPlayed = true; Sound.play('airguitar'); this.g.egg('airguitar'); }
      } else if (this.idleT >= 20) st = 'phone';
    } else { this.idleT = 0; this.riffPlayed = false; }
    if (st === 'skid' && a.state !== 'skid' && Math.abs(this.vx) > PHYS.walk * 0.8) this.g.burst(this.cx + this.facing * 8, this.y + this.h, 4, '#ffffff', 'dust');
    if (this.throwT > 0) { a.base = st; st = 'throw'; }
    if (st !== a.state && (st === 'airguitar' || st === 'phone')) a.t = 0;
    a.state = st;
    a.speed = Math.abs(this.vx) / PHYS.walk;
    if (st === 'run' || (st === 'throw' && a.base === 'run')) {
      const prev = a.phase;
      a.phase += dt * (8 + Math.abs(this.vx) / TS * 1.4);
      // footstep dust when running fast
      if (Math.abs(this.vx) > PHYS.walk * 1.1 && Math.floor(prev / Math.PI) !== Math.floor(a.phase / Math.PI)) this.g.burst(this.cx - this.facing * 6, this.y + this.h, 1, '#ffffff', 'dust');
    }
    a.stroke = this.stroke;
    this.blinkT -= dt;
    if (this.blinkT < 0) { a.blink = true; if (this.blinkT < -0.12) { a.blink = false; this.blinkT = 2 + Math.random() * 3; } }
    a.happy = this.star > 0 || this.g.happyT > 0 || this.lsdT > 0;
  }

  updateHair(dt) {
    const pose = bradyPose(this.anim, this.small);
    const ha = hairAnchor(this.cx, this.y + this.h, this.facing, this.small, pose);
    const D = this.small ? BRADY_DIM.small : BRADY_DIM.big;
    let wind = -this.vx * 6;
    if (this.anim.state === 'headbang' || this.anim.state === 'airguitar') wind += Math.sin(this.anim.t * 16) * 9000;
    if (this.inWater) wind += Math.sin(this.anim.t * 2) * 2000;
    // two sub-steps keeps the hair smooth at 120 Hz
    stepHair(this.hair, ha.x, ha.y, this.facing, D.hairL, dt, wind);
  }

  draw(ctx, t) {
    if (this.state === 'portal') {
      const k = clamp(this.portalT / 0.4, 0, 1);
      ctx.save(); ctx.globalAlpha = 1 - k;
      drawBrady(ctx, { x: this.cx, y: this.y + this.h, facing: this.facing, small: this.small, power: this.power, anim: this.anim, hair: this.hair, look: Save.data.look, time: t, scale: 1 - k * 0.6 });
      ctx.restore(); return;
    }
    if (this.invuln > 0 && !this.dead && Math.floor(this.invuln * 16) % 2 === 0) return;
    let small = this.small;
    if (this.growT > 0) small = Math.floor(this.growT * 14) % 2 === 0 ? (this.growFrom === 0) : (this.power === 0);
    const o = { x: this.cx, y: this.y + this.h, facing: this.facing, small, power: this.power, anim: this.anim, hair: this.hair, look: Save.data.look, star: this.star > 0, time: t, fly: this.fly > 0 || this.lsdT > 0, floaty: this.floaty > 0 || (this.power === 2 && this.g.level && this.g.level.tour && !this.inWater) };
    if (this.lsdT > 0 && this.lsdT < 2 && Math.floor(this.lsdT * 10) % 2 === 0) o.alpha = 0.45;
    if (this.g.level && this.g.level.tour) { o.trip = this.lsdT > 0; o.held = 'joint'; }
    if (this.mounted) {
      const moving = Math.abs(this.vx) > 10;
      if (this.hang) {
        drawSlothy(ctx, { x: this.cx, y: this.y - 2, facing: this.facing, t, pose: 'hang' });
        o.y = this.y + 44; o.rot = 0;
      } else {
        drawSlothy(ctx, { x: this.cx - this.facing * 4, y: this.y + this.h, facing: this.facing, t: moving ? t : 0, pose: this.hugT > 0 ? 'hug' : moving ? 'walk' : 'idle' });
        o.y = this.y + this.h - 26; o.x = this.cx - this.facing * 8;
      }
    }
    if (!this.dead) {
      // a faint stage spotlight so the all-black outfit always reads
      const r = small ? 26 : 40, cy = this.y + this.h * 0.45;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(this.cx, cy, 2, this.cx, cy, r);
      g.addColorStop(0, 'rgba(190,170,255,0.16)'); g.addColorStop(1, 'rgba(190,170,255,0)');
      ctx.fillStyle = g; ctx.fillRect(this.cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
    }
    if (this.dead) o.rot = 0;
    if (small !== this.small) o.hair = null;
    if (this.spin && !this.onGround) o.rot = Math.sin(this.anim.t * 26) * 0.25;
    PlayerFx.under(ctx, this, t);
    drawBrady(ctx, o);
    PlayerFx.over(ctx, this, t);
  }
  get light() { return { r: this.g.area.water ? 150 : 170, c: 'rgba(255,240,220,' }; }
}
