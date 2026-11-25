/* ============================================================
   ITALY: the moving parts of the land's five level types.
   SCOOT (14-1)  Brady rides a little scooter with no brand. It rolls on its own: no input = cruise, RIGHT = faster,
                 DOWN = brake (and stand still), LEFT = brake then push back slowly, ACTION = BOOST (a burst of speed that
                 smashes market crates), JUMP = hop. Ramps launch him onto the rooftops; washing lines are trampolines;
                 olive-oil spills mean no brakes.
   DOUGH (14-2)  Stretchy pizza dough pads sag under Brady: the longer he stands, the deeper they sag and the further the
                 next jump throws him (a gauge fills). Stand too long and the dough tears. Ovens ride conveyor belts and
                 breathe fire after a glow.
   LEAN (14-3)   The leaning tower tips left, then right, on a clock with a creak, a swinging plumb bob and falling dust
                 as the tell: crates and barrels slide to the low side (toggle group 0), the floor pushes Brady downhill
                 and loose barrels roll. Bells swing on their ropes.
   ARIA (14-4)   A blackbird diva sings: each long note is an updraft column (zones tied to a toggle group); she takes a
                 breath (a big inhale, the column flickers) and the columns stop.
   DOPPIO (14-6) An espresso cup puts Brady in fast-forward for a few seconds.
   Where the checker cannot work a mechanic out it is told with its own primitives: ramp and dough flings are B.edge
   (tools/sbw_it_shots.js plays every one of them in the game), the tilt and the duets are auto toggle groups, the
   espresso leaps are edges and the espresso shutter is a lock with its key at the lever.
   ============================================================ */
(function () {
const C = Tour.countries.it;
if (!C) return;
const K = TourKit, IK = Tour.itKit, INK = IK.INK, ItArt = IK.ItArt;

/* ---------------- area flags: an area spec's `it: { ... }` lands on the built area ---------------- */
{
  const gv0 = TourBuild.generateV2;
  TourBuild.generateV2 = function (Cc, spec) {
    const L = gv0.apply(this, arguments);
    if (Cc && Cc.id === 'it' && L && spec && spec.areas) spec.areas.forEach((A, k) => { if (A.it && L.areas[k]) Object.assign(L.areas[k], A.it); });
    return L;
  };
  const pa0 = Validator.proxyArea;
  Validator.proxyArea = function (area, mask) { const A = pa0.call(this, area, mask); if (area.scoot) A.scoot = true; return A; };
}
// extra liquids: tomato sauce (the pizzeria's pots), canal water (the alleys)
LIQUIDS.sauce = ['#ff6a4a', '#d8281a', '#8a1410', 'rgba(255,180,150,0.25)', null, 'rgba(255,220,200,0.55)'];
LIQUIDS.canal = ['#5ad0c8', '#2a8a9a', '#145a6a', 'rgba(220,255,250,0.25)', null, 'rgba(240,255,250,0.6)'];

/* ======================= SCOOT ======================= */
const SCOOT = { cruise: 7.2, fast: 10.6, back: 6.2, boostV: 13.5, boostT: 0.85, boostCool: 1.5, accel: 20, coast: 5, brake: 48 };
// the input: DOWN brakes (no crouch, no drop-through), ACTION boosts (the picker's chip hides)
{
  const pu0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const A = this.g && this.g.area;
    if (A && A.scoot && inp && this.state === 'play' && !this.dead) {
      this.itScoot = true;
      this.itBrake = !!inp.down;
      if (this.itBoostT > 0) this.itBoostT -= dt;
      if (this.itBoostCool > 0) this.itBoostCool -= dt;
      if (inp.actionPressed && !(this.itBoostCool > 0) && this.onGround) {
        this.itBoostT = SCOOT.boostT; this.itBoostCool = SCOOT.boostT + SCOOT.boostCool;
        K.sfx('vroom', 'fly', { vol: 0.5, pitch: 1.6 }); this.g.burst(this.cx - this.facing * 20, this.y + this.h - 8, 6, '#ffffff', 'dust');
        if (!this.g.itBoostTold) { this.g.itBoostTold = true; this.g.toast && this.g.toast('BOOST!'); }
      }
      inp = Object.assign({}, inp, { down: false, action: false, actionPressed: false });
    } else if (this.itScoot && !(A && A.scoot)) { this.itScoot = false; this.itBoostT = 0; }
    return pu0.call(this, dt, inp);
  };
  if (typeof TourPicker !== 'undefined') { const vis0 = TourPicker.visible; TourPicker.visible = function (play) { if (play && play.player && play.player.itScoot) return false; return vis0.call(this, play); }; }
}
// one physics step on the scooter: the horizontal speed is the scooter's; the engine does the jump, gravity and tiles
function scootStep(p, inp, area, dt, platforms, opts, ppf0) {
  const S = SCOOT, boosting = p.itBoostT > 0, ice = p.onGround && p.groundTile === T.ICE, grip = ice ? 0.22 : 1;
  if (p.onGround) {
    let target, acc;
    if (p.itBrake) { target = 0; acc = S.brake; }
    else if (boosting) { target = S.boostV; acc = 70; }
    else if (inp.left) { target = p.vx > 0.4 * TS ? 0 : -S.back; acc = p.vx > 0 ? S.brake * 0.75 : S.accel; }
    else if (inp.right) { target = S.fast; acc = p.vx > S.fast * TS ? S.coast : S.accel; }
    else { target = S.cruise; acc = p.vx > S.cruise * TS ? S.coast : S.accel * 0.8; }
    p.vx = approach(p.vx, target * TS, acc * TS * dt * (boosting ? 1 : grip));
  } else {
    const want = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (want > 0 && p.vx < S.fast * TS) p.vx = approach(p.vx, S.fast * TS, 12 * TS * dt);
    else if (want < 0) p.vx = approach(p.vx, -S.back * TS, PHYS.airAccel * dt);
  }
  // the engine keeps that speed: run at exactly |vx| in its direction
  const sp = Math.abs(p.vx), d = sign(p.vx);
  const inp2 = { left: d < 0, right: d > 0, jump: inp.jump, jumpPressed: inp.jumpPressed, down: false, up: inp.up, action: true };
  if (!p.onGround) p.airMax = sp;
  const s0 = opts.speedMul; opts.speedMul = sp > 0 ? sp / PHYS.run : 1;
  let ev;
  try { ev = ppf0(p, inp2, area, dt, platforms, opts); } finally { opts.speedMul = s0; }
  if (p.onGround) p.airMax = Math.max(PHYS.walk, Math.abs(p.vx));
  // a ramp launch flies like a held jump whether or not JUMP is held
  if (p.itRampT > 0) { p.itRampT -= dt; if (p.vy < 0 && !inp.jump) p.vy -= (PHYS.gDown - PHYS.gUp) * (area.gravity || 1) * dt; if (p.onGround) p.itRampT = 0; }
  return ev;
}

/* ======================= ESPRESSO (fast-forward) ======================= */
const ESP = { time: 4.6, mul: 1.85 };

/* ======================= DOUGH ======================= */
const DOUGH = { full: 1.15, tear: 2.7, regrow: 2.4, sag: 12 };

/* ---------------- the one physics wrapper (the game's bodies; the checker's sims keep the scooter's speed rule) ---------------- */
{
  const ppf0 = playerPhysicsFlip;
  playerPhysicsFlip = function (p, inp, area, dt, platforms, opts) {
    if (!opts) return ppf0(p, inp, area, dt, platforms, opts);
    if (area && area.scoot) {
      if (p.g) return scootStep(p, inp, area, dt, platforms, opts, ppf0);
      // the checker's simulated body: on a scooter Brady only pushes backwards at walking speed
      if (p.vx < -PHYS.walk) p.vx = -PHYS.walk;
      const ev = ppf0(p, inp, area, dt, platforms, opts);
      if (p.vx < -PHYS.walk) p.vx = -PHYS.walk;
      return ev;
    }
    if (!p.g) return ppf0(p, inp, area, dt, platforms, opts);
    // espresso: fast-forward legs
    if (p.itEsp > 0) {
      const s0 = opts.speedMul; opts.speedMul = (s0 == null ? 1 : s0) * ESP.mul;
      try { return ppf0(p, inp, area, dt, platforms, opts); } finally { opts.speedMul = s0; }
    }
    // dough: a jump off a dough pad is a fling, stronger the longer Brady stood on it
    const pad = p.ride && p.ride.itDough ? p.ride : null;
    const ev = ppf0(p, inp, area, dt, platforms, opts);
    if (pad && ev && ev.jump) pad.fling(p, inp);
    return ev;
  };
}
// the espresso clock and the dough pad's grip run with the player's own update
{
  const pu1 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    if (this.itEsp > 0 && this.state === 'play') {
      this.itEsp -= dt;
      if (this.itEsp <= 1.2 && this.itEsp + dt > 1.2) this.g.toast && this.g.toast('THE ESPRESSO IS WEARING OFF...');
      if (this.itEsp <= 0) { this.itEsp = 0; K.sfx('slowdown', 'float', { vol: 0.4, pitch: 0.7 }); }
      this.itTrail = this.itTrail || []; this.itTrail.unshift([this.cx, this.y + this.h, this.facing, this.anim.state]); if (this.itTrail.length > 6) this.itTrail.pop();
    } else if (this.itTrail && this.itTrail.length) this.itTrail.pop();
    return pu1.call(this, dt, inp);
  };
}
// drawing: the scooter under Brady; the espresso blur behind him
{
  const pd0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx, t) {
    if (this.itTrail && this.itTrail.length && !this.dead) {
      ctx.save(); for (let k = this.itTrail.length - 1; k >= 1; k -= 2) { const [x, y] = this.itTrail[k]; ctx.globalAlpha = 0.16 * (1 - k / 7); ctx.fillStyle = '#c8945a'; rr(ctx, x - 12, y - 52, 24, 52, 10); ctx.fill(); } ctx.restore();
    }
    if (!this.itScoot || this.dead || this.state === 'portal' || this.state === 'dying') return pd0.call(this, ctx, t);
    const a = this.anim, st = a.state;
    if (this.onGround && (st === 'run' || st === 'skid' || st === 'airguitar' || st === 'phone')) a.state = 'idle';
    const lean = this.onGround ? clamp(-this.vx / TS * 0.008, -0.1, 0.1) * this.facing * -1 : (this.vy < 0 ? -0.18 : 0.1);
    const fl = this.invuln > 0 && Math.floor(this.invuln * 16) % 2 === 0;
    if (!fl) Ink.around(ctx, this.cx - 34, this.y + this.h - 48, 68, 52, c => ItArt.scooter(c, this.cx, this.y + this.h + 1, this.facing, '#e8424a', lean, this.itBoostT > 0, t), { pad: 3, width: 1.0, color: INK });
    ctx.save(); ctx.translate(0, -7); pd0.call(this, ctx, t); ctx.restore();
    a.state = st;
    // the boost gauge: a little arc over the handlebars while it recharges
    if (this.itBoostCool > 0 && !fl) { const k = 1 - this.itBoostCool / (SCOOT.boostT + SCOOT.boostCool); ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(this.cx + this.facing * 18, this.y + this.h - 50, 6, -Math.PI / 2, -Math.PI / 2 + k * TAU); ctx.stroke(); ctx.restore(); }
  };
}

/* ---------------- SCOOT entities ---------------- */
// a ramp (a plank on two crates): rolling up it at speed launches Brady high (the checker knows the landing as an edge)
class ItRamp extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, TS); this.x = s.x - TS * 1.5; this.y = s.y - TS; this.back = true; this.used = 0; }
  update(dt) {
    this.t += dt; if (this.used > 0) this.used -= dt;
    const p = this.g.player; if (!p || p.dead || p.state !== 'play') return;
    const feet = p.y + p.h, fx = p.cx;
    if (p.itScoot && p.onGround && p.vx > 4 * TS && fx > this.x + 6 && fx < this.x + this.w && feet > this.y + this.h - 6 && feet < this.y + this.h + 4 && !(this.used > 0)) {
      const boost = p.itBoostT > 0;
      p.vy = -(boost ? 27 : 25) * TS; p.onGround = false; p.jumping = false; p.coyote = 0; p.jumpBuf = 0; p.itRampT = 1.6; p.ride = null;
      this.used = 0.5; K.sfx('ramp', 'spring', { vol: 0.6, pitch: 0.8 }); this.g.burst(this.cx, this.y + this.h, 8, '#ffffff', 'dust');
      this.g.parts.text(this.cx, this.y - 10, boost ? 'WHEEEE!' : 'HOP!', '#ffe28a');
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y + this.h, w = this.w;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.fillStyle = '#c89058'; ctx.fillRect(x + w - 20, y - 26, 18, 26); ctx.strokeRect(x + w - 20, y - 26, 18, 26);
    ctx.fillStyle = '#e8bc6a'; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + w + 2, y - 30); ctx.lineTo(x + w + 2, y - 24); ctx.lineTo(x + 6, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a4a24'; for (let k = 1; k < 4; k++) ctx.fillRect(x + k * w / 4, y - k * 7.5 - 3, 2, 5);
    // a chevron sign: speed up!
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(x - 20, y - 34); ctx.lineTo(x - 10, y - 28); ctx.lineTo(x - 20, y - 22); ctx.lineTo(x - 16, y - 28); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}
// a wall of market crates across the alley: a BOOST smashes it (a lock the checker opens at its key, the run-up)
class ItCrates extends Ent {
  constructor(g, s) {
    super(g, s, 2 * TS, (s.h || 3) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; this.id = s.id;
    this.tiles = []; for (let i = 0; i < (s.h || 3); i++) for (let q = 0; q < 2; q++) this.tiles.push([Math.floor(s.x / TS) + q, Math.floor(s.y / TS) - 1 - i]);
    this.back = true; this.told = false;
  }
  update(dt) {
    this.t += dt; const p = this.g.player; if (!p || this.remove) return;
    const box = { x: this.x - 6, y: this.y, w: this.w + 12, h: this.h };
    if (overlap(box, p)) {
      if (p.itBoostT > 0 || Math.abs(p.vx) > SCOOT.boostV * TS * 0.9 || p.star > 0) this.smash();
      else if (!this.told || this.toldT < this.t) { this.told = true; this.toldT = this.t + 2.5; this.g.parts.text(this.cx, this.y - 12, 'BOOST TO SMASH!', '#ffd24a'); Sound.play('bump', { vol: 0.4 }); }
    }
  }
  hit(kind) { if (kind === 'star' || kind === 'prop') { this.smash(); return true; } return false; }
  smash() {
    if (this.remove) return; this.remove = true;
    for (const [x, y] of this.tiles) { this.g.setTile(x, y, T.EMPTY); this.g.burst(x * TS + 16, y * TS + 16, 8, '#d8a050', 'debris'); }
    for (let k = 0; k < 8; k++) this.g.burst(this.cx, this.cy, 2, ['#e83a2a', '#ffe04a', '#7ac84a'][k % 3], 'confetti');
    Sound.play('break'); this.g.shake(5); this.g.keys.add('wall:' + this.id); this.g.parts.text(this.cx, this.y - 8, 'CRASH!', '#ffffff');
  }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    for (let r = 0; r < h / TS; r++) for (let q = 0; q < 2; q++) {
      const cx = x + q * TS + (r % 2 ? 3 : 0), cy = y + h - (r + 1) * TS;
      ctx.fillStyle = '#d8a050'; ctx.fillRect(cx + 1, cy + 1, TS - 2, TS - 2); ctx.strokeRect(cx + 1, cy + 1, TS - 2, TS - 2);
      ctx.fillStyle = '#b07a2a'; ctx.fillRect(cx + 3, cy + 8, TS - 6, 2);
      const fr = (r + q) % 3; ctx.fillStyle = fr === 0 ? '#ffe04a' : fr === 1 ? '#e83a2a' : '#7ac84a';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx + 8 + k * 8, cy + 4, 4, Math.PI, 0); ctx.fill(); ctx.stroke(); }
    }
    // the stencilled boost arrows
    ctx.fillStyle = '#ffffff'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center';
    ctx.fillText('»»', x + w / 2, y + h / 2 + 3);
    ctx.restore();
  }
}
// an olive-oil spill (the tiles under it are ice): drawn as a glossy green-gold puddle with a tipped can
class ItOil extends Ent {
  constructor(g, s) { super(g, s, (s.n || 4) * TS, 8); this.x = s.x - TS / 2; this.y = s.y - 4; this.back = true; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y + 4, w = this.w;
    ctx.save(); ctx.fillStyle = 'rgba(190,190,60,0.75)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y, w / 2 + 4, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,200,0.8)'; ctx.beginPath(); ctx.ellipse(x + w * 0.35, y - 1, w * 0.12, 1.4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#7a9a2a'; ctx.save(); ctx.translate(x + 6, y - 6); ctx.rotate(1.3); rr(ctx, -6, -9, 12, 18, 3); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#ffd24a'; ctx.font = TourBackstage.F6; ctx.textAlign = 'center'; ctx.fillText('SLIPPERY!', x + w / 2, y - 14);
    ctx.restore();
  }
}

/* ---------------- DOUGH entities ---------------- */
// a dough pad stretched between two hooks: a platform that sags as Brady stands; a jump off it flings him (charge:
// the gauge under it); stand too long and it tears (back in a moment)
class ItDough extends Ent {
  constructor(g, s) {
    super(g, s, (s.pw || 3) * TS, 14); this.x = s.x - TS / 2; this.y = s.y; this.hy = this.y; this.isPlatform = true; this.itDough = true;
    this.charge = 0; this.stand = 0; this.state = 'ok'; this.st = 0; this.dx = 0; this.dy = 0; this.sag = 0; this.boing = 0; this.fwd = s.fwd != null ? s.fwd : 1;
  }
  update(dt) {
    this.t += dt; const p = this.g.player, oy = this.y;
    const on = p && p.ride === this && !p.dead;
    if (this.state === 'ok') {
      if (on) { this.stand += dt; this.charge = Math.min(1, this.stand / DOUGH.full); if (this.stand > DOUGH.tear) this.tearUp(); else if (this.stand > DOUGH.tear - 0.8 && !this.warned) { this.warned = true; K.sfx('stretch', 'crumble', { vol: 0.3, pitch: 1.8 }); } }
      else { this.stand = Math.max(0, this.stand - dt * 3); this.charge = Math.min(1, this.stand / DOUGH.full); this.warned = false; }
    } else if (this.state === 'torn') { this.st -= dt; if (this.st <= 0) { this.state = 'ok'; this.dead = false; this.stand = 0; this.charge = 0; this.g.burst(this.cx, this.y, 6, '#f8f0dc', 'dust'); } }
    this.sag = approach(this.sag, this.charge * DOUGH.sag, dt * 40);
    this.boing = Math.max(0, this.boing - dt * 3);
    this.y = this.hy + this.sag - Math.sin(this.boing * 12) * this.boing * 8;
    this.dy = this.y - oy; this.dx = 0;
  }
  tearUp() {
    this.state = 'torn'; this.st = DOUGH.regrow; this.dead = true; this.charge = 0; this.stand = 0;
    const p = this.g.player; if (p && p.ride === this) { p.ride = null; p.onGround = false; p.vy = 2 * TS; }
    K.sfx('rip', 'crumble', { vol: 0.6, pitch: 1.2 }); this.g.parts.text(this.cx, this.y - 16, 'RRRIP!', '#ffffff'); this.g.burst(this.cx, this.y, 10, '#f8f0dc', 'dust');
  }
  // the jump that leaves the pad: a stronger throw the deeper the sag; it throws forward too
  fling(p, inp) {
    const k = this.charge, v = lerp(PHYS.jumpV * 1.0, 26 * TS, k);
    p.vy = -v; p.jumping = true;
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0) || 0;
    if (dir) { const fv = lerp(PHYS.walk, 10.5 * TS, k); p.vx = dir * Math.max(Math.abs(p.vx), fv); p.airMax = Math.max(p.airMax || 0, fv); }
    if (k > 0.25) { K.sfx('boing', 'spring', { vol: 0.5 + k * 0.3, pitch: 1.4 - k * 0.6 }); this.g.parts.text(this.cx, this.y - 10, k >= 1 ? 'SUPER FLING!' : 'FLING!', '#ffe28a'); }
    this.boing = 1; this.stand = 0; this.charge = 0;
  }
  touchPlayer() {}
  draw(ctx) {
    if (this.state === 'torn') {
      // two flaps hanging from the hooks, regrowing
      const k = 1 - this.st / DOUGH.regrow;
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillStyle = '#f4e8c8';
      for (const s of [0, 1]) { const hx = s ? this.x + this.w : this.x; ctx.beginPath(); ctx.moveTo(hx, this.hy); ctx.quadraticCurveTo(hx + (s ? -1 : 1) * 10 * (0.4 + k), this.hy + 22, hx + (s ? -1 : 1) * this.w * 0.45 * k, this.hy + 6); ctx.lineTo(hx, this.hy + 8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      this.hooks(ctx); ctx.restore(); return;
    }
    const x = this.x, y = this.y, w = this.w, sag = this.sag, thin = this.stand > DOUGH.tear - 0.8 ? 1 - (DOUGH.tear - this.stand) / 0.8 : 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    // the dough: a thick creamy sheet sagging in the middle, flour dusting, a few air bubbles
    ctx.fillStyle = '#f4e8c8';
    ctx.beginPath(); ctx.moveTo(x, this.hy); ctx.quadraticCurveTo(x + w / 2, y + sag * 1.2, x + w, this.hy); ctx.lineTo(x + w, this.hy + 12 - thin * 6); ctx.quadraticCurveTo(x + w / 2, y + 12 + sag * 1.3 - thin * 6, x, this.hy + 12 - thin * 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.arc(x + k * w / 5, this.hy + 4 + Math.sin(k / 5 * Math.PI) * sag, 1.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(200,170,120,0.6)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x + w * (0.25 + k * 0.25), this.hy + 8 + Math.sin((0.25 + k * 0.25) * Math.PI) * sag, 2.2, 0, TAU); ctx.fill(); }
    if (thin > 0) { ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.4; for (let k = 0; k < 3; k++) { const cx = x + w * (0.35 + k * 0.15); ctx.beginPath(); ctx.moveTo(cx, y + 2 + sag); ctx.lineTo(cx + 3, y + 8 + sag); ctx.stroke(); } }
    this.hooks(ctx);
    // the fling gauge: a little arc of flour that fills while Brady stands
    if (this.charge > 0.02) { ctx.strokeStyle = this.charge >= 1 ? '#ffd24a' : '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.cx, y + sag + 30, 9, -Math.PI / 2, -Math.PI / 2 + this.charge * TAU); ctx.stroke(); if (this.charge >= 1) { ctx.fillStyle = '#ffd24a'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('MAX!', this.cx, y + sag + 52); } }
    ctx.restore();
  }
  hooks(ctx) { ctx.fillStyle = '#9aa0ac'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; for (const hx of [this.x, this.x + this.w]) { ctx.beginPath(); ctx.arc(hx, this.hy + 2, 5, 0, TAU); ctx.fill(); ctx.stroke(); } }
}
// a little wood-fired oven on wheels riding a conveyor belt: it glows for 0.7 s, then puffs fire out of its mouth
class ItOven extends Ent {
  constructor(g, s) {
    super(g, s, 2 * TS, 2 * TS - 6); this.enemy = true; this.x0 = s.x0 * TS; this.x1 = s.x1 * TS; this.dirx = s.dir || -1; this.speed = (s.speed || 2.6) * TS;
    this.x = s.x - TS / 2; this.y = s.y - this.h; this.per = s.per || 2.6; this.ph = s.ph || 0; this.fireBox = null; this.always = true;
  }
  phaseOf() { const k = (this.t + this.ph) % this.per; return k < this.per - 1.3 ? 'cold' : k < this.per - 0.6 ? 'glow' : 'fire'; }
  update(dt) {
    this.t += dt;
    this.x += this.dirx * this.speed * dt;
    if (this.dirx < 0 && this.x < this.x0 - this.w) this.x = this.x1;
    if (this.dirx > 0 && this.x > this.x1) this.x = this.x0 - this.w;
    const ph = this.phaseOf();
    if (ph === 'fire' && this.was !== 'fire' && this.g.onScreen(this)) K.sfx('whoosh', 'fire', { vol: 0.4 });
    this.was = ph;
    this.fireBox = ph === 'fire' ? { x: this.dirx < 0 ? this.x - 1.6 * TS : this.x + this.w, y: this.y + 8, w: 1.6 * TS, h: this.h - 16 } : null;
    const p = this.g.player;
    if (this.fireBox && p && !p.dead && overlap(this.fireBox, p)) p.hurt(this);
  }
  touchPlayer(p) { p.hurt(this); }
  // its brick dome is only warm: a stomp bounces off it; the star knocks it over
  hit(kind) { if (kind === 'stomp' || kind === 'spin') return 'bounce'; if (kind === 'star') { this.knockOff(1); return true; } return false; }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h, d = this.dirx, ph = this.phaseOf(), t = this.t;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#a84a32'; ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, y + 16); ctx.quadraticCurveTo(x + w / 2, y - 10, x + w, y + 16); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c85a3a'; for (let k = 0; k < 4; k++) ctx.fillRect(x + 6 + k * 13, y + 20 + (k % 2) * 8, 10, 5);
    ctx.fillStyle = '#7a2a1a'; ctx.fillRect(x + w / 2 - 6, y - 8, 12, 12); ctx.strokeRect(x + w / 2 - 6, y - 8, 12, 12);
    // the mouth (on the side it travels toward)
    const mx = d < 0 ? x + 4 : x + w - 22;
    const glow = ph === 'glow' ? 0.5 + 0.5 * Math.sin(t * 30) : ph === 'fire' ? 1 : 0.15;
    ctx.fillStyle = `rgba(255,${120 + glow * 100},40,${0.5 + glow * 0.5})`; ctx.beginPath(); ctx.moveTo(mx, y + h - 4); ctx.lineTo(mx, y + h - 20); ctx.arc(mx + 9, y + h - 20, 9, Math.PI, 0); ctx.lineTo(mx + 18, y + h - 4); ctx.fill(); ctx.stroke();
    // wheels
    ctx.fillStyle = '#2a2a34'; for (const wx of [x + 10, x + w - 10]) { ctx.beginPath(); ctx.arc(wx, y + h, 4.5, 0, TAU); ctx.fill(); }
    if (ph === 'glow') { ctx.fillStyle = '#ffd24a'; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('!', x + w / 2, y - 14); }
    if (this.fireBox) {
      const b = this.fireBox;
      for (let k = 0; k < 6; k++) { const ph2 = (t * 5 + k / 6) % 1, fx = d < 0 ? b.x + b.w - ph2 * b.w : b.x + ph2 * b.w, fy = b.y + b.h / 2 + Math.sin(k * 2 + t * 20) * 8; ctx.fillStyle = k % 2 ? '#ffd24a' : '#ff6a1a'; ctx.beginPath(); ctx.arc(fx, fy, 9 * (1 - ph2 * 0.5), 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }
  get light() { return { r: 70, c: 'rgba(255,150,60,' }; }
}

/* ======================= LEAN: the tilt clock ======================= */
// every TILT.period / 2 seconds the tower swings to its other lean; TILT.warn seconds before, the creak (the tell)
const TILT = { period: 9.0, warn: 1.4, push: 1.7 };
const tiltSide = t => (Math.floor(t / (TILT.period / 2)) % 2 ? 1 : -1);     // -1 leaning left, +1 right
class ItTilt extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; this.gi = s.g || 0; this.lean = -1; this.k = -1; this.always = true; this.warned = -1; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    this.x = g.camX; this.y = g.camY;
    const side = tiltSide(g.t), n = Math.floor(g.t / (TILT.period / 2)), into = g.t % (TILT.period / 2), warn = into > TILT.period / 2 - TILT.warn;
    g.itTiltWarn = warn;
    if (warn && this.warned !== n) {
      this.warned = n; K.sfx('creak', 'bump', { vol: 0.5, pitch: 0.45 });
      if (!this.told) { this.told = true; g.toast && g.toast('THE TOWER CREAKS... IT IS ABOUT TO TIP!'); }
      for (let k = 0; k < 6; k++) g.burst(g.camX + Math.random() * Game.viewW, g.camY + 4, 1, '#d8ccb0', 'dust');
    }
    // the toggle group follows the lean: bit set = leaning right (things slid right)
    const on = side > 0;
    if (on !== !!g.toggleBit(this.gi)) this.tip(on);
    this.lean = side; this.k = approach(this.k, side, dt * 2.2);
    g.itLean = this.k;
    // the floor slopes: Brady is pushed downhill on the ground
    if (p && !p.dead && p.onGround && p.state === 'play') p.pushX = (p.pushX || 0) + side * TILT.push * TS * Math.min(1, Math.abs(this.k));
  }
  tip(on) {
    const g = this.g, A = g.area, G = A.toggles && A.toggles[this.gi], p = g.player;
    if (!G) return;
    const from = on ? G.A : G.B, to = on ? G.B : G.A;
    let carry = null;
    if (p && !p.dead && p.onGround) { const fx = Math.floor(p.cx / TS), fy = Math.floor((p.y + p.h + 2) / TS); from.forEach((r, i) => { if (fx >= r[0] && fx <= r[2] && fy >= r[1] && fy <= r[3] && to[i]) carry = [r, to[i]]; }); }
    g.flipToggle(this.gi, true);
    if (p && !p.dead) {
      if (carry) { p.x += (carry[1][0] - carry[0][0]) * TS; p.y = carry[1][1] * TS - p.h - 0.5; p.vy = 0; }
      for (const r of to) if (overlap(p, { x: r[0] * TS, y: r[1] * TS, w: (r[2] - r[0] + 1) * TS, h: (r[3] - r[1] + 1) * TS })) {
        // a slider that lands on Brady: onto its top if there's room, else pushed out of its way
        const top = { x: p.x, y: r[1] * TS - p.h - 1, w: p.w, h: p.h };
        if (regionFree(A, top.x, top.y, top.w, top.h)) { p.y = top.y; p.vy = Math.min(p.vy, 0); }
        else p.x = (on ? r[0] * TS - p.w - 1 : (r[2] + 1) * TS + 1);
      }
    }
    for (const e of g.entities) if (e.itRack) e.release(on ? 1 : -1);
    g.shake(5); K.sfx('tip', 'stomp', { vol: 0.6, pitch: 0.45 });
  }
  draw(ctx) {
    // the tilt gauge at the top of the view: a plumb bob on a string, swinging with the lean; red while it creaks
    const g = this.g, x = g.camX + Game.viewW / 2, y = g.camY + (Game.cssH > Game.cssW ? 96 : 10), warn = g.itTiltWarn;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = warn ? 'rgba(80,20,20,0.82)' : 'rgba(40,30,24,0.72)'; rr(ctx, x - 52, y, 104, 34, 8); ctx.fill(); ctx.stroke();
    const a = -this.k * 0.5 + (warn ? Math.sin(g.t * 22) * 0.08 : 0);
    ctx.strokeStyle = '#f2ecdc'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x + Math.sin(a) * 22, y + 4 + Math.cos(a) * 22); ctx.stroke();
    ctx.fillStyle = warn ? '#ff6a4a' : '#ffd24a'; ctx.beginPath(); ctx.arc(x + Math.sin(a) * 24, y + 4 + Math.cos(a) * 24, 4.5, 0, TAU); ctx.fill();
    ctx.fillStyle = warn ? '#ffb0a0' : '#f2ecdc'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('◀', x - 38, y + 17); ctx.fillText('▶', x + 38, y + 17);
    ctx.fillStyle = '#ffd24a'; if (this.lean < 0) ctx.fillText('◀', x - 38, y + 17); else ctx.fillText('▶', x + 38, y + 17);
    if (warn) { ctx.fillStyle = '#ffb0a0'; ctx.fillText('CREAK!', x, y + 44); }
    ctx.restore();
  }
}
// a slider for the tilt: a stack of crates or a long plank or a barrel row easing between its two spots
class ItSlider extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.gi = s.g || 0; this.A = s.A; this.B = s.B; this.look = s.look || 'crates'; this.k = 0; this.back = true; this.always = true; this.place(); }
  place() { const a = this.A, b = this.B, k = this.k; this.x = lerp(a[0], b[0], k) * TS; this.y = lerp(a[1], b[1], k) * TS; this.w = (a[2] - a[0] + 1) * TS; this.h = (a[3] - a[1] + 1) * TS; }
  update(dt) { this.t += dt; const on = this.g.toggleBit(this.gi) ? 1 : 0; this.k = approach(this.k, on, dt * 4); this.place(); }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h, moving = this.k > 0.02 && this.k < 0.98, warn = this.g.itTiltWarn;
    const sh = warn ? Math.sin(this.t * 50) * 1.2 : 0;
    ctx.save(); ctx.translate(sh, 0); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    if (this.look === 'plank') {
      ctx.fillStyle = '#c8945a'; ctx.fillRect(x, y, w, 12); ctx.strokeRect(x, y, w, 12);
      ctx.fillStyle = '#7a5430'; for (let k = x + 8; k < x + w; k += 24) ctx.fillRect(k, y + 4, 3, 3);
    } else if (this.look === 'barrels') {
      for (let r = 0; r < h / TS; r++) for (let q = 0; q < w / TS; q++) { const bx = x + q * TS, by = y + r * TS; ctx.fillStyle = '#b07a40'; rr(ctx, bx + 2, by + 1, TS - 4, TS - 2, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#6a6a72'; ctx.fillRect(bx + 2, by + 7, TS - 4, 3); ctx.fillRect(bx + 2, by + TS - 10, TS - 4, 3); }
    } else {
      for (let r = 0; r < h / TS; r++) for (let q = 0; q < w / TS; q++) { const bx = x + q * TS, by = y + r * TS; ctx.fillStyle = '#c89058'; ctx.fillRect(bx + 1, by + 1, TS - 2, TS - 2); ctx.strokeRect(bx + 1, by + 1, TS - 2, TS - 2); ctx.strokeStyle = '#7a4a24'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + 4, by + 4); ctx.lineTo(bx + TS - 4, by + TS - 4); ctx.stroke(); ctx.strokeStyle = INK; }
    }
    if (moving) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; const d = sign(this.B[0] - this.A[0]) * (this.g.toggleBit(this.gi) ? 1 : -1) || 1; for (let k = 0; k < 3; k++) { const yy = y + 6 + k * 8; ctx.beginPath(); ctx.moveTo(x + (d > 0 ? 0 : w) - d * (6 + k * 4), yy); ctx.lineTo(x + (d > 0 ? 0 : w) - d * (18 + k * 4), yy); ctx.stroke(); } }
    ctx.restore();
  }
}
// a barrel rack on a wall: when the tower tips toward its open side, it lets one barrel go; the barrel rolls along the
// floor downhill (a hazard: jump it) and breaks at the far wall
class ItRack extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.side = s.side || 1; this.itRack = true; this.back = true; this.always = true; }
  release(dir) { if (dir !== this.side) return; const p = this.g.player; if (!p || Math.abs(p.cy - this.cy) > 10 * TS) return; const B = ENTITY_TYPES.itBarrel; this.g.spawn(new B(this.g, { x: this.cx + this.side * TS, y: this.y + TS, dir: this.side })); }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, s = this.side, warn = this.g.itTiltWarn && tiltSide(this.g.t + TILT.warn + 0.05) === s, sh = warn ? Math.sin(this.t * 60) * 1.5 : 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#7a5430'; ctx.fillRect(x - 4, y + TS - 6, TS + 8, 6); ctx.strokeRect(x - 4, y + TS - 6, TS + 8, 6);
    ctx.fillStyle = '#b07a40'; rr(ctx, x + 3 + sh, y + 1, TS - 6, TS - 8, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a6a72'; ctx.fillRect(x + 3 + sh, y + 6, TS - 6, 2.5);
    if (warn) { ctx.fillStyle = '#ffd24a'; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('!', x + TS / 2, y - 6); }
    ctx.restore();
  }
}
class ItBarrel extends Ent {
  constructor(g, s) { super(g, s, 26, 26); this.enemy = true; this.dir = s.dir || 1; this.vx = this.dir * 5.2 * TS; this.life = 7; this.spin = 0; }
  update(dt) {
    this.t += dt; this.life -= dt;
    this.vy += PHYS.gDown * dt; if (this.vy > PHYS.maxFall) this.vy = PHYS.maxFall;
    moveBody(this, this.g.area, dt, { semis: true });
    this.spin += this.vx / 13 * dt;
    if (this.hitWall || this.life <= 0 || this.y > this.g.area.H * TS) { this.remove = true; this.g.burst(this.cx, this.cy, 10, '#b07a40', 'debris'); if (this.g.onScreen(this)) Sound.play('break', { vol: 0.4 }); }
  }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  hit(kind) { if (kind === 'stomp' || kind === 'spin') return 'bounce'; if (kind === 'star') { this.remove = true; return true; } return false; }
  draw(ctx) {
    ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(this.spin); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#b07a40'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#6a6a72'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#7a5430'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 8, Math.sin(a) * 8); ctx.stroke(); }
    ctx.restore();
  }
}
// a bronze bell swinging on its rope: the platform's art (mplat swing skin) and its rope
const bellSkin = (ctx, e, t) => {
  const x = e.x, y = e.y, w = e.w, ax = e.ancX, ay = e.ancY;
  ctx.save(); ctx.strokeStyle = '#7a5430'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(x + w / 2, y - 26); ctx.stroke();
  ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.arc(ax, ay, 5, 0, TAU); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillStyle = '#d8a83a'; ctx.beginPath(); ctx.moveTo(x + w / 2 - 12, y - 26); ctx.quadraticCurveTo(x + w / 2, y - 34, x + w / 2 + 12, y - 26); ctx.quadraticCurveTo(x + w - 4, y - 8, x + w + 2, y); ctx.lineTo(x - 2, y); ctx.quadraticCurveTo(x + 4, y - 8, x + w / 2 - 12, y - 26); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2d070'; ctx.fillRect(x + 8, y - 18, 4, 14);
  ctx.fillStyle = '#b8861a'; ctx.fillRect(x - 2, y, w + 4, 7); ctx.strokeRect(x - 2, y, w + 4, 7);
  ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.arc(x + w / 2 + Math.sin(e.swingTh || 0) * -6, y + 12, 5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
};
PlatformArt.itBell = bellSkin;

/* ======================= ARIA: the blackbird diva ======================= */
// the diva on her box: sings for `sing` seconds (her zones on), takes a breath for `breath` seconds (zones off). The
// last ARIA.tell seconds of a note she runs out of air: her chest heaves, the column's notes fade and flicker.
// Two divas in one toggle group sing in turn (a duet): state A = the first, state B = the second.
const ARIA = { sing: 3.8, breath: 1.7, tell: 0.9 };
class ItDiva extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 2 * TS); this.gi = s.g || 0; this.who = s.who || 0; this.duet = !!s.duet; this.off = s.off || 0; this.friendly = true; this.always = true; this.dir = s.dir || 1; }
  // where in the cycle we are: { singing, tell } for this diva
  phase() {
    const per = ARIA.sing + ARIA.breath, T0 = this.g.t + this.off;
    if (this.duet) {
      const n = Math.floor(T0 / per), k = T0 % per, mine = n % 2 === this.who;
      return { singing: mine && k < ARIA.sing, tell: mine && k > ARIA.sing - ARIA.tell && k < ARIA.sing, k };
    }
    const k = T0 % per; return { singing: k < ARIA.sing, tell: k > ARIA.sing - ARIA.tell && k < ARIA.sing, k };
  }
  update(dt) {
    this.t += dt; const g = this.g, ph = this.phase(), A = g.area;
    for (const z of A.zones) if (z.itAria === this.gi && z.itWho === this.who) z.off = !ph.singing;
    if (ph.singing && !this.wasSing && g.onScreen(this, 300)) K.sfx('aria', 'gold', { vol: 0.3, pitch: 0.8 + this.who * 0.25 });
    if (!ph.singing && this.wasSing && g.onScreen(this, 300)) g.parts.text(this.cx, this.y - 30, 'HHHAAH!', '#fff2c8');
    this.wasSing = ph.singing; this.ph = ph;
  }
  touchPlayer() {}
  draw(ctx) {
    const ph = this.ph || this.phase(), x = this.cx, y = this.y + this.h, t = this.t, d = this.dir;
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    const heave = ph.tell ? Math.sin(t * 26) * 2 : 0, puff = ph.singing ? 1 + Math.sin(t * 6) * 0.04 : 1.1;
    // the gown: a sweeping red dress with gold trim; a feather boa
    ctx.fillStyle = '#c8283a'; ctx.beginPath(); ctx.moveTo(-22, 0); ctx.quadraticCurveTo(-16, -30, -8, -36); ctx.lineTo(8, -36); ctx.quadraticCurveTo(16, -30, 24, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(-21, -4, 44, 3);
    // the body: a glossy blackbird with a round chest
    ctx.fillStyle = '#1a1426'; ctx.save(); ctx.translate(0, -44); ctx.scale(puff, puff + heave * 0.02); ctx.beginPath(); ctx.ellipse(0, 0, 14, 16, 0, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#ff9a8a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(-14 + k * 7, -34 + Math.sin(k + t * 3) * 1.2, 4, 0, TAU); ctx.fill(); }
    // the head, thrown back while she sings; the yellow beak wide open; a tiara
    ctx.save(); ctx.translate(4, -62); ctx.rotate(ph.singing ? -0.35 : 0.1);
    ctx.fillStyle = '#1a1426'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffb02a'; if (ph.singing) { ctx.beginPath(); ctx.moveTo(7, -3); ctx.lineTo(20, -8); ctx.lineTo(9, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(8, 1); ctx.lineTo(19, 5); ctx.lineTo(7, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(7, -2); ctx.lineTo(17, 0); ctx.lineTo(7, 3); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(2, -3, 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(2.6, -3, 1.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.moveTo(-7, -8); ctx.lineTo(-4, -15); ctx.lineTo(0, -10); ctx.lineTo(4, -16); ctx.lineTo(7, -9); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // a wing raised in song
    ctx.fillStyle = '#2a2236'; ctx.beginPath(); ctx.moveTo(-8, -50); ctx.quadraticCurveTo(-28, ph.singing ? -76 : -50, -30, ph.singing ? -66 : -40); ctx.quadraticCurveTo(-18, -44, -6, -40); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // out of breath: a gasp bubble
    if (ph.tell) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; rr(ctx, x - 22, y - 104, 44, 18, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8283a'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('...HH', x, y - 92); ctx.restore(); }
  }
}
// an updraft column of song: golden notes rising; it fades and flickers in the diva's last breath; gone while she rests
class ItSong extends Ent {
  constructor(g, s) { super(g, s, (s.w || 2) * TS, (s.h || 10) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; this.gi = s.g || 0; this.who = s.who || 0; this.back = true; this.always = true; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    const A = this.g.area, z = A.zones.find(q => q.itAria === this.gi && q.itWho === this.who && Math.abs(q.x - this.x) < 2), on = z && !z.off;
    const diva = this.g.entities.find(e => e instanceof ItDiva && e.gi === this.gi && e.who === this.who), tell = diva && diva.ph && diva.ph.tell;
    const x = this.x, y = this.y, w = this.w, h = this.h, t = this.t;
    ctx.save();
    if (!on) { ctx.strokeStyle = 'rgba(255,230,160,0.25)'; ctx.setLineDash([4, 8]); ctx.lineWidth = 2; ctx.strokeRect(x + 4, y, w - 8, h); ctx.restore(); return; }
    const a = tell ? 0.4 + 0.4 * (Math.sin(t * 30) > 0 ? 1 : 0) : 1;
    const gr = ctx.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(255,220,120,0)'); gr.addColorStop(0.5, `rgba(255,230,150,${0.32 * a})`); gr.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = a;
    for (let k = 0; k < 7; k++) { const ph = (t * 0.9 + k / 7) % 1, nx = x + w / 2 + Math.sin(t * 3 + k * 1.7) * w * 0.3, ny = y + h - ph * h; ItArt.note(ctx, nx, ny, 0.9, k % 2 ? '#ffd24a' : '#fff2c8'); }
    ctx.restore();
  }
  get light() { return { r: 60, c: 'rgba(255,220,140,' }; }
}
// a chandelier on a long chain swinging over the stalls: the platform's art (mplat swing skin)
PlatformArt.itChandelier = (ctx, e, t) => {
  const x = e.x, y = e.y, w = e.w, ax = e.ancX, ay = e.ancY;
  ctx.save(); ctx.strokeStyle = '#b8861a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(x + w / 2, y - 18); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(x + w / 2, y - 22); ctx.lineTo(x + w - 6, y - 4); ctx.lineTo(x + 6, y - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d8a83a'; ctx.fillRect(x - 4, y, w + 8, 8); ctx.strokeRect(x - 4, y, w + 8, 8);
  for (let k = 0; k <= 4; k++) { const cx = x - 2 + k * (w + 4) / 4; ctx.fillStyle = '#fff8e0'; ctx.fillRect(cx - 2, y - 10, 4, 10); ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(cx, y - 13 + Math.sin(t * 9 + k) * 0.8, 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(220,240,255,0.9)'; ctx.beginPath(); ctx.moveTo(cx, y + 8); ctx.lineTo(cx - 3, y + 15); ctx.lineTo(cx, y + 20); ctx.lineTo(cx + 3, y + 15); ctx.closePath(); ctx.fill(); }
  ctx.restore();
};

/* ======================= DOPPIO entities ======================= */
// an espresso cup on a little marble counter: drink it (walk into it) and the world goes double-time for Brady; the
// barista bird refills it after a moment
class ItCup extends Ent {
  constructor(g, s) { super(g, s, 28, 28); this.x = s.x - 14; this.y = s.y - 28; this.full = true; this.st = 0; this.back = true; this.always = true; }
  update(dt) { this.t += dt; if (!this.full) { this.st -= dt; if (this.st <= 0) { this.full = true; this.g.burst(this.cx, this.y + 6, 5, '#ffffff', 'dust'); } } }
  touchPlayer(p) {
    if (!this.full || p.dead) return;
    this.full = false; this.st = 2.2; p.itEsp = ESP.time;
    K.sfx('sip', 'powerup', { vol: 0.6, pitch: 1.4 }); this.g.parts.text(this.cx, this.y - 14, 'DOPPIO!', '#ffd24a'); this.g.burst(this.cx, this.y, 10, '#c8945a', 'confetti');
    if (!this.g.itEspTold) { this.g.itEspTold = true; this.g.toast && this.g.toast('ESPRESSO! DOUBLE SPEED FOR A FEW SECONDS'); }
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#ece6d6'; ctx.fillRect(x - 16, y - 8, 32, 8); ctx.strokeRect(x - 16, y - 8, 32, 8);
    ItArt.cup(ctx, x, y - 9, 1.1, this.full);
    if (this.full) { ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2; for (let k = 0; k < 2; k++) { const ph = (this.t * 0.8 + k * 0.5) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.moveTo(x - 3 + k * 6, y - 26 - ph * 16); ctx.quadraticCurveTo(x + 3 + k * 6, y - 32 - ph * 16, x - 1 + k * 6, y - 38 - ph * 16); ctx.stroke(); } ctx.globalAlpha = 1; }
    else { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = TourBackstage.F6; ctx.textAlign = 'center'; ctx.fillText('...', x, y - 30); }
    ctx.restore();
  }
}
// the coffee flood (14-6's chase front: TourDoom with look 'coffee')
{
  const dd0 = TourDoom.prototype.draw;
  TourDoom.prototype.draw = function (ctx) {
    if (this.look !== 'coffee') return dd0.call(this, ctx);
    const g = this.g, x = this.front, y0 = g.camY - 20, y1 = g.camY + Game.viewH + 20;
    if (x < g.camX - 200) return;
    ctx.save();
    const gr = ctx.createLinearGradient(x - 220, 0, x + 30, 0); gr.addColorStop(0, '#3a2010'); gr.addColorStop(0.8, '#7a4a26'); gr.addColorStop(1, 'rgba(200,150,100,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - 400, y0);
    for (let y = y0; y <= y1; y += 18) ctx.lineTo(x + Math.sin(this.t * 6 + y * 0.05) * 14 + Math.sin(this.t * 2.3 + y * 0.013) * 10, y);
    ctx.lineTo(x - 400, y1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(240,220,190,0.75)'; for (let k = 0; k < 14; k++) { const yy = y0 + ((k * 61 + this.t * 90) % (y1 - y0)), r = 8 + (k % 4) * 6; ctx.beginPath(); ctx.arc(x - 10 + Math.sin(k + this.t * 4) * 12, yy, r, 0, TAU); ctx.fill(); }
    ctx.restore();
  };
}

/* ======================= pieces ======================= */
const P = {
  /* ---- SCOOT ---- */
  // a stretch of cobbles: { n, enemy, enemies: [kind...], coins, pigeons }
  cobbles(st, o) {
    const x = st.x, n = o.n || 10; st.floor(x, x + n - 1);
    if (o.coins !== false) st.coins(x + 2, x + n - 3, st.gy - 2);
    (o.enemies || (o.enemy ? [o.enemy] : [])).forEach((k, i, L) => st.enemy(k, x + 3 + Math.floor((i + 1) * (n - 5) / (L.length + 1)), st.gy));
    st.dress(x, x + n - 1, 0.18);
    if (o.sign) st.sign(x + 1, o.sign);
    if (o.item) st.block(x + Math.floor(n / 2), st.gy - 4, o.item, o.hidden ? T.HIDDEN : T.QBLOCK);
    return x + n;
  },
  // an open trench across the road (a pit), optionally a canal with water at the bottom: { n, canal }
  trench(st, o) {
    const x = st.x, n = o.n || 4; st.floor(x, x + 2);
    st.pit(x + 3, x + 2 + n);
    if (o.canal) { st.B.fill(x + 3, st.H - 2, x + 2 + n, st.H - 1, T.LAVA); st.decor('itCanalRail', x + 2, st.gy, n); }
    st.arc(x + 2, x + 3 + n, st.gy - 3, 2);
    st.floor(x + 3 + n, x + 6 + n);
    return x + 7 + n;
  },
  // the ramp onto the rooftops: a run-up, the ramp, the house wall; returns with st.gy on the roof
  ramp(st, o) {
    const B = st.B, x = st.x, up = o.up || 6, run = o.run || 8, rx = x + run;
    st.floor(x, rx + 3);
    B.spawn('itRamp', rx, st.gy - 1, {});
    const wx = rx + 4, roof = st.gy - up;
    // the house: stone walls down to the street, its flat roof terrace on top
    B.fill(wx, roof + 1, wx + (o.roofN || 14), st.H - 1, T.HARD);
    for (let xx = wx; xx <= wx + (o.roofN || 14); xx++) B.set(xx, roof, T.GROUND);
    B.edge([rx, st.gy - 1], [wx + (o.land || 4), roof]);
    if (o.sign) st.sign(x + 1, o.sign);
    st.coins(rx + 1, wx + 2, roof - 3);
    st.gy = roof;
    return wx + (o.roofN || 14) + 1;
  },
  // rooftops: roofs separated by alleys (pits down to the street, which is safe ground far below), chimneys:
  // { gaps: [w...], chimney, cat, pigeon, gold }
  roofs(st, o) {
    const B = st.B; let x = st.x;
    for (let k = 0; k < (o.gaps || []).length; k++) {
      const n = 4 + (k % 2) * 2; st.floor(x, x + n - 1); for (let xx = x; xx < x + n; xx++) B.fill(xx, st.gy, xx, st.H - 1, T.HARD), B.set(xx, st.gy, T.GROUND);
      if (o.chimney === k) { B.fill(x + 1, st.gy - 2, x + 1, st.gy - 1, T.HARD); st.decor('itChimney', x + 1, st.gy - 2); }
      x += n;
      const w = o.gaps[k]; st.pit(x, x + w - 1); st.B.fill(x, st.H - 2, x + w - 1, st.H - 1, T.LAVA);
      st.arc(x - 1, x + w, st.gy - 3, 2);
      if (o.gold && o.gold[0] === k) st.gold(x + Math.floor(w / 2), st.gy - (o.gold[2] || 6), o.gold[1]);
      x += w;
    }
    st.floor(x, x + 5); for (let xx = x; xx < x + 6; xx++) B.fill(xx, st.gy, xx, st.H - 1, T.HARD), B.set(xx, st.gy, T.GROUND);
    if (o.cat) st.enemy('itCat', x + 3, st.gy);
    if (o.pigeon) st.enemy('itPigeon', x - 3, st.gy);
    return x + 6;
  },
  // a washing line strung across a wide alley between two roofs: a bouncy line (hold JUMP to fly) : { n, gold }
  washing(st, o) {
    const B = st.B, x = st.x, n = o.n || 9; st.floor(x, x + 3); for (let xx = x; xx < x + 4; xx++) B.fill(xx, st.gy, xx, st.H - 1, T.HARD), B.set(xx, st.gy, T.GROUND);
    const lx = x + 4; st.pit(lx, lx + n - 1); B.fill(lx, st.H - 2, lx + n - 1, st.H - 1, T.LAVA);
    for (let xx = lx + 1; xx < lx + n - 1; xx++) { B.set(xx, st.gy + 1, T.SEMI); B.setSurf(xx, st.gy + 1, SURF.BOUNCE); }
    B.spawn('itLine', lx + 1, st.gy + 1, { n: n - 2 });
    if (o.gold) st.gold(lx + Math.floor(n / 2), st.gy - 7, o.gold);
    st.coins(lx + 2, lx + n - 3, st.gy - 5);
    const ex = lx + n; st.floor(ex, ex + 3); for (let xx = ex; xx < ex + 4; xx++) B.fill(xx, st.gy, xx, st.H - 1, T.HARD), B.set(xx, st.gy, T.GROUND);
    return ex + 4;
  },
  // back down to the street: a drop off the end of the roofs: { down }
  drop(st, o) {
    const x = st.x; st.gy = st.gy + (o.down || 6); st.floor(x, x + 7);
    st.coins(x + 1, x + 4, st.gy - 2);
    return x + 8;
  },
  // a wall of market crates under a stone arch: BOOST through it: { h, sign }
  crates(st, o) {
    const B = st.B, x = st.x, h = o.h || 3, id = 'itCrates' + x;
    st.floor(x, x + 8);
    const cx = x + 5, tiles = [];
    for (let y = st.gy - h; y < st.gy; y++) for (let q = 0; q < 2; q++) { B.set(cx + q, y, T.HARD); B.setHide(cx + q, y, 1); tiles.push([cx + q, y]); }
    B.fill(cx, Math.max(0, st.gy - h - 6), cx + 1, st.gy - h - 1, T.HARD);
    B.locks.push({ id, tiles });
    B.vkey(id, [[cx - 1, st.gy - 1], [cx - 2, st.gy - 1]]);
    B.spawn('itCrates', cx, st.gy - 1, { h, id });
    st.decor('itArch', cx, st.gy - h, 1);
    if (o.sign) st.sign(x + 1, o.sign);
    return x + 9;
  },
  // an olive-oil spill: ice under a puddle, a gap right after it (no brakes: hop it): { n, gap }
  oil(st, o) {
    const B = st.B, x = st.x, n = o.n || 5; st.floor(x, x + n + 1);
    for (let xx = x + 1; xx <= x + n; xx++) B.set(xx, st.gy, T.ICE);
    B.spawn('itOil', x + 1, st.gy - 1, { n });
    let ex = x + n + 2;
    if (o.gap) { st.pit(ex, ex + o.gap - 1); st.arc(ex - 1, ex + o.gap, st.gy - 3, 2); ex += o.gap; st.floor(ex, ex + 3); ex += 4; }
    return ex;
  },
  // steps down (the scooter bumps down a flight of stairs): { n }
  stepsDown(st, o) {
    let x = st.x; const n = o.n || 3;
    for (let k = 0; k < n; k++) { st.floor(x, x + 1); x += 2; st.gy = Math.min(st.gyMax, st.gy + 1); }
    st.floor(x, x + 2); return x + 3;
  },

  /* ---- DOUGH ---- */
  // a dough pad over a pot of sauce, flinging up to a high shelf: { pw, up, ahead, shelf, gold, enemy, sign }
  // edges: from each pad column to the shelf's landing (tools/sbw_it_shots.js flings from every pad)
  pad(st, o) {
    const B = st.B, x = st.x, pw = o.pw || 3, up = o.up || 6, ahead = o.ahead != null ? o.ahead : 3, sw = o.shelf || 6;
    st.floor(x, x + 1);
    const px = x + 2; st.pit(px, px + pw - 1); B.fill(px, st.H - 2, px + pw - 1, st.H - 1, T.LAVA);
    B.spawn('itDough', px, st.gy - 1, { pw }); for (let q = 0; q < pw; q++) B.ghosts.push([px + q, st.gy]);
    const sx = px + pw + ahead, sy = st.gy - up;
    // the far side: a pit under the shelf up to its counter
    st.pit(px + pw, sx + sw + 1); B.fill(px + pw, st.H - 2, sx + sw + 1, st.H - 1, T.LAVA);
    for (let xx = sx; xx < sx + sw; xx++) B.set(xx, sy, T.SEMI);
    const ex = sx + sw + 2;
    // the shelf drops back down to a counter at the old floor height
    st.floor(ex, ex + 3);
    for (let q = 0; q < pw; q++) B.edge([px + q, st.gy - 1], [sx + Math.min(2, sw - 1), sy]);
    st.coins(sx + 1, sx + sw - 2, sy - 2);
    if (o.gold) st.gold(sx + Math.floor(sw / 2), sy - 3, o.gold);
    if (o.enemy) st.enemy(o.enemy, ex + 2, st.gy);
    if (o.sign) st.sign(x, o.sign);
    st.decor('itSaucePot', px, st.H - 2, pw);
    return ex + 4;
  },
  // a dough pad flinging far across a long pot of sauce to a counter: { pw, far, gold }
  padFar(st, o) {
    const B = st.B, x = st.x, pw = o.pw || 3, far = o.far || 8;
    st.floor(x, x + 1);
    const px = x + 2; st.pit(px, px + pw + far - 1); B.fill(px, st.H - 2, px + pw + far - 1, st.H - 1, T.LAVA);
    B.spawn('itDough', px, st.gy - 1, { pw }); for (let q = 0; q < pw; q++) B.ghosts.push([px + q, st.gy]);
    const lx = px + pw + far; st.floor(lx, lx + 6);
    for (let q = 0; q < pw; q++) B.edge([px + q, st.gy - 1], [lx + 2, st.gy]);
    st.arc(px + pw, lx, st.gy - 6, 3);
    if (o.gold) st.gold(px + pw + Math.floor(far / 2), st.gy - 8, o.gold);
    st.decor('itSaucePot', px, st.H - 2, pw + far);
    return lx + 7;
  },
  // a staircase of dough pads, each higher than the last (a chain of charged flings): { n, step }
  padChain(st, o) {
    const B = st.B, n = o.n || 2, stepUp = o.step || 4, pw = 3; let x = st.x, gy = st.gy;
    st.floor(x, x + 1); x += 2;
    const pitX0 = x;
    for (let k = 0; k < n; k++) {
      B.spawn('itDough', x, gy - 1, { pw }); for (let q = 0; q < pw; q++) B.ghosts.push([x + q, gy]);
      const nx = x + pw + (o.gap || 4), ngy = gy - stepUp;
      for (let q = 0; q < pw; q++) B.edge([x + q, gy - 1], [nx + 1, ngy]);
      st.coins(x, x + pw - 1, gy - 2);
      x = nx; gy = ngy;
    }
    st.pit(pitX0, x - 1); B.fill(pitX0, st.H - 2, x - 1, st.H - 1, T.LAVA);
    st.decor('itSaucePot', pitX0, st.H - 2, x - pitX0);
    // the top shelf: a counter at the new height, back down after it
    for (let xx = x; xx < x + 8; xx++) B.fill(xx, gy, xx, st.H - 1, T.GROUND);
    if (o.gold) st.gold(x + 4, gy - 3, o.gold);
    st.gy = gy;
    return x + 8;
  },
  // a conveyor belt with ovens riding it toward Brady: { n, ovens, dir }
  ovens(st, o) {
    const B = st.B, x = st.x, n = o.n || 16, dir = o.dir || -1;
    st.floor(x, x + n + 1);
    for (let xx = x + 1; xx <= x + n; xx++) B.set(xx, st.gy, dir < 0 ? T.CONV_L : T.CONV_R);
    const k = o.ovens || 2;
    for (let i = 0; i < k; i++) B.spawn('itOven', x + 1 + Math.floor((i + 0.5) * n / k), st.gy - 1, { x0: x + 1, x1: x + n, dir, speed: PHYS.conveyor / TS, per: 2.6, ph: i * 1.3 });
    if (o.sign) st.sign(x, o.sign);
    st.coins(x + 2, x + n - 1, st.gy - 5);
    return x + n + 2;
  },

  /* ---- DOPPIO ---- */
  // an espresso cup on its counter
  cup(st, o) { const x = st.x; st.floor(x, x + 3); st.B.spawn('itCup', x + 1, st.gy - 1, {}); if (o.sign) st.sign(x + 3, o.sign); return x + 4; },
  // a leap only an espresso makes: a cup on the run-up, then a long gap (an edge for the checker): { gap, up }
  leap(st, o) {
    const B = st.B, x = st.x, gap = o.gap || 13, run = o.run || 9;
    st.floor(x, x + run);
    B.spawn('itCup', x + 1, st.gy - 1, {});
    const ex = x + run + 1; st.pit(ex, ex + gap - 1);
    if (o.liquid) B.fill(ex, st.H - 2, ex + gap - 1, st.H - 1, T.LAVA);
    const lgy = st.gy - (o.up || 0);
    for (let xx = ex + gap; xx < ex + gap + 7; xx++) B.fill(xx, lgy, xx, st.H - 1, T.GROUND);
    B.edge([ex - 1, st.gy - 1], [ex + gap + 2, lgy]);
    st.arc(ex - 1, ex + gap, st.gy - 4, 3);
    if (o.gold) st.gold(ex + Math.floor(gap / 2), st.gy - 6, o.gold);
    B.decorAt('itLeapSign', ex - 2, st.gy, gap);
    st.gy = lgy;
    return ex + gap + 7;
  },
  // a shutter that a lever opens for a moment: too far to reach on foot in time, easy at double speed: { n, t }
  rushDoor(st, o) {
    const B = st.B, x = st.x, n = o.n || 20, id = 'itRush' + x, t = o.t || 2.2;
    st.floor(x, x + n + 4);
    B.spawn('itCup', x + 1, st.gy - 1, {});
    B.spawn('lever', x + 3, st.gy - 1, { opens: id, timed: t, look: null });
    B.vkey(id, [[x + 3, st.gy - 1]]);
    const dx = x + n; const tiles = [];
    for (let y = st.gy - 3; y < st.gy; y++) { B.set(dx, y, T.HARD); B.setHide(dx, y, 1); tiles.push([dx, y]); }
    B.locks.push({ id, tiles }); B.spawn('shutter', dx, st.gy - 1, { id, h: 3 });
    B.fill(dx, 0, dx, st.gy - 4, T.HARD);
    st.coins(x + 6, dx - 2, st.gy - 2);
    if (o.sign) st.sign(x, o.sign);
    return dx + 4;
  }
};
for (const k in P) Tour.pieces['it.' + k] = P[k];

/* small scenery the pieces drop */
Object.assign(Decor, {
  // a washing line's poles are the roofs; the line itself is an entity (it bounces)
  itArch(ctx, x, y) {
    // the market lane's stone pier (the crates stand under it; y = the top of the crates): a striped awning each
    // side and the MERCATO sign on the pier
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    for (const s of [-1, 1]) { const ax = s < 0 ? x - 16 - 70 : x + 48; for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? '#ffffff' : '#e8424a'; ctx.beginPath(); ctx.moveTo(ax + k * 10, y - 70); ctx.lineTo(ax + k * 10 + 10, y - 70); ctx.lineTo(ax + k * 10 + 10 + s * 2, y - 50); ctx.lineTo(ax + k * 10 + s * 2, y - 50); ctx.closePath(); ctx.fill(); } ctx.strokeRect(ax, y - 70, 70, 20); }
    ctx.fillStyle = '#3a8a5a'; rr(ctx, x - 26, y - 150, 84, 22, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = TourBackstage.F8; ctx.textAlign = 'center'; ctx.fillText('MERCATO', x + 16, y - 135);
    ctx.restore();
  },
  itCanalRail(ctx, x, y, t, th, d) {
    const n = (d && d.seed) || 4; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#e8dcc0'; for (const s of [0, n + 1]) { ctx.fillRect(x - 6 + s * TS, y - 22, 6, 22); ctx.strokeRect(x - 6 + s * TS, y - 22, 6, 22); }
    ctx.restore();
  },
  itSaucePot(ctx, x, y, t, th, d) {
    // the rim of a big pot whose sauce fills the pit (y = the sauce's top row)
    const n = (d && d.seed) || 3, x0 = x - TS / 2, w = n * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#9aa0ac'; ctx.fillRect(x0 - 6, y - 14, 8, 30); ctx.strokeRect(x0 - 6, y - 14, 8, 30); ctx.fillRect(x0 + w - 2, y - 14, 8, 30); ctx.strokeRect(x0 + w - 2, y - 14, 8, 30);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; for (let k = 0; k < Math.min(6, n); k++) { const ph = (t * 0.7 + k / 6) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(x0 + (k + 0.5) * w / Math.min(6, n), y - 4 - ph * 26, 3 + ph * 4, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  itLeapSign(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#3a2a1e'; ctx.fillRect(x - 2, y - 40, 4, 40);
    ctx.fillStyle = '#ffd24a'; rr(ctx, x - 26, y - 62, 52, 24, 5); ctx.fill(); ctx.stroke();
    ItArt.cup(ctx, x - 12, y - 44, 0.55, true);
    ctx.fillStyle = INK; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('x2!', x + 10, y - 47);
    ctx.restore();
  }
});
// the washing line: draws the clothes on the bouncy line (the tiles do the bouncing)
class ItLine extends Ent {
  constructor(g, s) { super(g, s, (s.n || 7) * TS, 10); this.x = s.x - TS / 2; this.y = s.y - (s.y % TS === 0 ? 0 : 0) - TS; this.back = true; this.sq = 0; }
  update(dt) { this.t += dt; const p = this.g.player; if (p && p.vy < -10 * TS && Math.abs(p.y + p.h - (this.y + TS)) < 30 && p.cx > this.x && p.cx < this.x + this.w) this.sq = 1; this.sq = Math.max(0, this.sq - dt * 3); }
  touchPlayer() {}
  draw(ctx) {
    const x0 = this.x - TS / 2, x1 = this.x + this.w + TS / 2, y = this.y + TS + 2, sag = 6 + this.sq * 12 * Math.sin(this.t * 30);
    ctx.save(); ctx.strokeStyle = '#f2ecdc'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + sag, x1, y); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    const n = Math.max(2, Math.floor((x1 - x0) / 34));
    for (let k = 0; k < n; k++) {
      const f = (k + 0.5) / n, cx = x0 + f * (x1 - x0), cy = y + Math.sin(f * Math.PI) * sag, col = ['#ffffff', '#8ac8f0', '#e8424a', '#ffd24a', '#a8e08a'][k % 5], sw = Math.sin(this.t * 2 + k) * 2;
      ctx.fillStyle = col;
      if (k % 3 === 0) { ctx.beginPath(); ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy); ctx.lineTo(cx + 12 + sw, cy + 10); ctx.lineTo(cx + 7 + sw, cy + 10); ctx.lineTo(cx + 7 + sw, cy + 22); ctx.lineTo(cx - 7 + sw, cy + 22); ctx.lineTo(cx - 7 + sw, cy + 10); ctx.lineTo(cx - 12 + sw, cy + 10); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else if (k % 3 === 1) { ctx.fillRect(cx - 4 + sw, cy, 8, 16); ctx.strokeRect(cx - 4 + sw, cy, 8, 16); ctx.fillRect(cx - 4 + sw, cy + 12, 12, 5); ctx.strokeRect(cx - 4 + sw, cy + 12, 12, 5); }
      else { ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.lineTo(cx + 12 + sw, cy + 18); ctx.lineTo(cx - 12 + sw, cy + 18); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#e8424a'; ctx.beginPath(); ctx.moveTo(cx - 6 + sw * 0.5, cy + 2); ctx.lineTo(cx - 6 + sw, cy + 16); ctx.moveTo(cx + 6 + sw * 0.5, cy + 2); ctx.lineTo(cx + 6 + sw, cy + 16); ctx.stroke(); ctx.strokeStyle = INK; }
      ctx.fillStyle = '#c8945a'; ctx.fillRect(cx - 2, cy - 3, 4, 5);
    }
    ctx.restore();
  }
}
// TILT and ARIA pieces work inside the code-drawn rooms (14-3, 14-4) through stamp legends:
Object.assign(P, {
  tilt(st, o) { st.B.spawn('itTilt', st.x, st.gy - 1, { g: o.g || 0 }); return st.x; },
  // a slider for the tilt (toggle group g, auto): the letter is rect A's top-left; B is A moved by (dx, dy)
  slide(st, o) {
    const B = st.B, w = o.w || 2, h = o.h || 2, x = st.x, y = st.gy - 1, g = o.g || 0, tile = T[o.tile || 'HARD'];
    const A = [x, y, x + w - 1, y + h - 1, tile], Bt = [x + (o.dx || 0), y + (o.dy || 0), x + (o.dx || 0) + w - 1, y + (o.dy || 0) + h - 1, tile];
    for (let yy = A[1]; yy <= A[3]; yy++) for (let xx = A[0]; xx <= A[2]; xx++) { B.set(xx, yy, tile); B.setHide(xx, yy, 1); }
    for (let yy = Bt[1]; yy <= Bt[3]; yy++) for (let xx = Bt[0]; xx <= Bt[2]; xx++) B.set(xx, yy, T.EMPTY);
    B.toggle(g, [A], [Bt], { kind: 'tilt', auto: true });
    B.spawn('itSlider', x, y, { g, A: A.slice(0, 4), B: Bt.slice(0, 4), look: o.look || 'crates' });
    // a plank carries Brady along with it when the tower tips (ItTilt.tip): for the checker, its whole track is a shelf
    if (o.ride) for (let xx = Math.min(A[0], Bt[0]); xx <= Math.max(A[2], Bt[2]); xx++) B.ghosts.push([xx, A[1]]);
    return st.x;
  },
  rack(st, o) { st.B.spawn('itRack', st.x, st.gy - 1, { side: o.side || 1 }); return st.x; },
  // a bell swinging from a beam: { len (tiles), amp (radians), pw, rate } (the checker's ghosts along its arc)
  bell(st, o) {
    const B = st.B, len = (o.len || 4) * TS, amp = o.amp || 0.7, pw = o.pw || 2, ax = st.x, ay = st.gy - 1;
    B.spawn('mplat', ax, ay, { pw, swing: { amp, len }, speed: o.rate || 0.9, skin: o.skin || 'itBell', phase: o.phase || 0 });
    // the ghosts: the platform's top along its swing (sampled)
    const seen = {};
    for (let k = -10; k <= 10; k++) { const th = amp * k / 10, px = ax * TS + TS / 2 + Math.sin(th) * len, py = (ay + 1) * TS + Math.cos(th) * len; for (let q = 0; q < pw; q++) { const gx = Math.floor((px - pw * TS / 2) / TS) + q, gy = Math.floor(py / TS); const key = gx + ',' + gy; if (!seen[key]) { seen[key] = 1; B.ghosts.push([gx, gy]); } } }
    return st.x;
  },
  // an updraft column of song for a diva: { g, who, w, h (rows above the letter's row) }
  song(st, o) {
    const B = st.B, w = o.w || 3, h = o.h || 10, g = o.g || 0, who = o.who || 0, x = st.x, bot = st.gy - 1, top = bot - h + 1;
    const z = B.zone(x, top, w, h, 0, -150 * TS, 7.4 * TS, 'updraft', { pull: 3 }); z.g = g; z.gOn = who === 0; z.itAria = g; z.itWho = who;
    if (!B.toggles[g]) B.toggle(g, [], [], { kind: 'aria', auto: true });
    B.spawn('itSong', x, bot, { w, h, g, who });
    return st.x;
  },
  diva(st, o) { st.B.spawn('itDiva', st.x, st.gy - 1, { g: o.g || 0, who: o.who || 0, duet: !!o.duet, dir: o.dir || 1, off: o.off || 0 }); return st.x; }
});
// a secret door for the code-drawn rooms (no floor of its own): a fake wall section with the dust tell ('fake'), or a
// velvet curtain ('curtain'); the door inside it: { to, back, look, h }
P.hideDoor = (st, o) => {
  const B = st.B, x = st.x, y = st.gy - 1, look = o.look || 'fake';
  if (look === 'fake') { B.fill(x, y - (o.h || 3) + 1, x, y, T.FAKE); B.spawn('tourDraft', x, y, { look }); }
  else B.spawn('tourCurtain', x, y, { look, skin: o.skin || look, h: o.h || 3 });
  B.spawn('portal', x, y, { kind: 'door', look: 'tourDoorHidden', targetRef: o.to || null, secretDoor: true });
  if (o.back) B.anchor(o.back, x + (o.backDx || 2), y);
  return st.x;
};
for (const k of ['tilt', 'slide', 'rack', 'bell', 'song', 'diva', 'hideDoor']) Tour.pieces['it.' + k] = P[k];

Object.assign(ENTITY_TYPES, { itRamp: ItRamp, itCrates: ItCrates, itOil: ItOil, itDough: ItDough, itOven: ItOven, itTilt: ItTilt, itSlider: ItSlider, itRack: ItRack, itBarrel: ItBarrel, itDiva: ItDiva, itSong: ItSong, itCup: ItCup, itLine: ItLine });
Tour.itMech = { SCOOT, ESP, DOUGH, TILT, ARIA, tiltSide };
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.itMech = Tour.itMech; } } catch (e) { /* not in a browser */ }
})();
