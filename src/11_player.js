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
    if (this.invuln > 0) return;
    if (this.mounted) { this.dismount(true); return; }
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

  collect(kind, src) {
    const g = this.g;
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
        this.star = 10; Sound.play('disco'); g.mus ? g.mus('star') : Sound.music('star'); g.addScore(1000, this.cx, this.y);
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
      case 'gold':
        g.collectGold(src.idx, src.cx, src.cy);
        break;
    }
    if (kind !== 'gold') g.flashText = null;
  }

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

    // ride moving platforms
    if (this.ride && !this.ride.dead) { this.x += this.ride.dx || 0; this.y += this.ride.dy || 0; }

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
    const windDx = g.windForce || 0;
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
    const floating = this.floaty > 0 && !this.inWater, flying = this.fly > 0 && !this.inWater;
    if (floating && !this.onGround) inp = Object.assign({}, inp, { jumpPressed: false });
    // a balloon doesn't stay on the ground: lift off unless Brady holds down
    if (floating && this.onGround && !inp.down) { this.vy = -3 * TS; this.onGround = false; }
    const gScale = floating ? 0.12 : (flying && inp.jump && !this.onGround) ? 0.25 : 1;
    const ev = playerPhysics(this, inp, A, dt, g.platforms, { windDx, noCrouchJump: false, jumpBoost: this.mounted ? 1.12 : 1, gScale });
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
    // throw green puke balls
    if (this.power === 2 && inp.actionPressed && this.discs < 2 && !this.crouch) {
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
    else if (this.floaty > 0 && !this.onGround) st = 'float';
    else if (this.fly > 0 && !this.onGround) st = 'fly';
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
    a.happy = this.star > 0 || this.g.happyT > 0;
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
    const o = { x: this.cx, y: this.y + this.h, facing: this.facing, small, power: this.power, anim: this.anim, hair: this.hair, look: Save.data.look, star: this.star > 0, time: t, fly: this.fly > 0, floaty: this.floaty > 0 };
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
    drawBrady(ctx, o);
  }
  get light() { return { r: this.g.area.water ? 150 : 170, c: 'rgba(255,240,220,' }; }
}
