/* ============================================================
   THE MOON: the land's mechanics (docs/design/ENCORE_TOUR.md §4, world 18).
   Shared: an area's `moon` system (copied onto the built area and the level checker's copy of it), enemies that
   feel the low gravity too.
   18-1 LOWG   low gravity (the engine's area gravity: the game and the checker run the same physics), dust
               geysers (steady ones are lifts the checker knows; pulsing ones rumble first and are never needed),
               golf balls that rain down on a shadow, ceiling spikes that punish a full jump.
   (18-2 DRIFT, 18-3 ROVER, 18-4 MAG and 18-6 STARS follow below.)
   ============================================================ */
(function () {
const MK = Tour.moonKit, INK = MK.INK, MoonArt = MK.MoonArt;
const MOON_G = 0.55;   // the land's gravity (18-1, 18-3, 18-4, the stage)

/* ---------------- the `moon` area system ---------------- */
// an area spec's `moon: { ... }` rides along onto the built area (TourBuild.areaSystems) and onto the level checker's
// proxy of it, so the land's physics wrappers see it in both
if (TourBuild.SYSTEMS.indexOf('moon') < 0) TourBuild.SYSTEMS.push('moon');
{
  const px0 = Validator.proxyArea;
  Validator.proxyArea = function (area, mask) { const A = px0.call(this, area, mask); if (area.moon) A.moon = area.moon; return A; };
}
// walkers feel the area's gravity on the moon (the engine's Walker always falls at full gravity): a moon bunny hops
// sky-high and floats down
{
  const wk0 = Walker.prototype.walk;
  Walker.prototype.walk = function (dt) {
    const A = this.g && this.g.area;
    if (A && A.moon && A.gravity && A.gravity < 1 && !this.onGround) this.vy -= PHYS.gDown * (1 - A.gravity) * dt;
    return wk0.call(this, dt);
  };
}

/* ---------------- 18-1: dust geysers ---------------- */
// a geyser: a vent in the dust that blows a column of moon dust up to row `top`. Steady ones blow all the time (the
// checker rides them); pulsing ones rumble and spit for 1 s (the tell), blow for `on` seconds, rest for `off`
class MoonGeyser extends Ent {
  constructor(g, s) {
    super(g, s, (s.w || 2) * TS, (s.h || 10) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; this.back = true;
    this.steady = !!s.steady; this.on = s.on || 2.4; this.off = s.off || 2.2; this.ph = s.phase || 0; this.zi = s.zi;
    this.k = this.steady ? 1 : 0; this.faint = !!s.faint;
  }
  zone() { const A = this.g.area; return A && A.zones ? A.zones.find(z => z.moonGeyser === this.s.gid) : null; }
  cycle() { const P = this.on + this.off + 1, k = ((this.g.t + this.ph) % P + P) % P; return k < this.off ? 'rest' : k < this.off + 1 ? 'warn' : 'blow'; }
  update(dt) {
    this.t += dt;
    if (this.steady) return;
    const st = this.cycle(), z = this.zone();
    if (z) z.off = st !== 'blow';
    this.k = approach(this.k, st === 'blow' ? 1 : 0, dt * 4);
    if (st === 'warn' && this.st !== 'warn' && this.g.onScreen(this, 80)) TourKit.sfx('rumble', 'bump', { vol: 0.3, pitch: 0.5 });
    this.st = st;
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, w = this.w, bot = this.y + this.h, t = this.t, top = this.y, k = this.k;
    const warn = !this.steady && this.st === 'warn';
    ctx.save();
    // the vent: a little dark crater mouth on the floor
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#5a546a';
    ctx.beginPath(); ctx.ellipse(x + w / 2, bot - 2, w / 2 + 6, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1630'; ctx.beginPath(); ctx.ellipse(x + w / 2, bot - 2, w / 2 - 2, 3, 0, 0, TAU); ctx.fill();
    if (warn) {
      // the tell: the vent shudders and spits little puffs
      for (let q = 0; q < 4; q++) { const ph = (t * 3 + q / 4) % 1; ctx.fillStyle = `rgba(230,226,240,${0.8 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x + w / 2 + Math.sin(q * 2.3 + t * 9) * w * 0.3, bot - 6 - ph * 40, 4 + ph * 6, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#ffd84a'; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('!', x + w / 2, bot - 52 + Math.sin(t * 20) * 2);
    }
    if (k > 0.02) {
      const a = (this.faint ? 0.45 : 1) * k;
      ctx.fillStyle = `rgba(225,220,240,${0.16 * a})`; ctx.fillRect(x, top, w, this.h);
      ctx.fillStyle = `rgba(240,236,250,${0.12 * a})`; ctx.fillRect(x + w * 0.2, top, w * 0.6, this.h);
      // dust puffs rising up the column, thinning out at the top
      for (let q = 0; q < 9; q++) { const ph = (t * 0.9 + q / 9) % 1, yy = bot - ph * this.h, xx = x + w / 2 + Math.sin(t * 3 + q * 1.7) * w * 0.32, r = 5 + ph * 9; ctx.fillStyle = `rgba(236,232,246,${0.7 * a * (1 - ph * 0.8)})`; ctx.beginPath(); ctx.arc(xx, yy, r, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = `rgba(255,255,255,${0.55 * a})`; ctx.lineWidth = 2; for (let q = 0; q < 3; q++) { const ph = (t * 1.4 + q / 3) % 1, yy = bot - ph * this.h; ctx.beginPath(); ctx.moveTo(x + 4, yy + 8); ctx.lineTo(x + 4, yy - 6); ctx.moveTo(x + w - 4, yy + 2); ctx.lineTo(x + w - 4, yy - 12); ctx.stroke(); }
    }
    ctx.restore();
  }
}
// golf balls from the sky: a target ring on the ground (and a whistle) for WARN seconds, then a long-forgotten golf
// ball comes down on it, fast. { period, phase }
class MoonGolfRain extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, TS); this.x = s.x - TS; this.y = s.y - TS; this.back = true; this.period = s.period || 3.2; this.ph = s.phase || 0; this.WARN = 1.0; this.n = -1; }
  phaseK() { const P = this.period; return ((this.g.t + this.ph) % P + P) % P; }
  update(dt) {
    this.t += dt; const k = this.phaseK(), n = Math.floor((this.g.t + this.ph) / this.period);
    if (k > this.period - this.WARN && this.warned !== n) { this.warned = n; if (this.g.onScreen(this, 120)) TourKit.sfx('whistle', 'select', { vol: 0.25, pitch: 2.2 }); }
    if (n !== this.n) {
      if (this.n >= 0 && this.g.onScreen(this, 200)) {
        const top = this.g.camY - 30;
        tourFire(this.g, this.cx, Math.min(top, this.y - 6 * TS), { vx: 0, vy: 16 * TS, w: 16, h: 16, life: 3, col: '#ffffff', art: (c, s) => MoonArt.golf(c, s.x + s.w / 2, s.y + s.h / 2, 8) });
      }
      this.n = n;
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const k = this.phaseK(), warn = k > this.period - this.WARN, x = this.cx, y = this.y + this.h;
    if (!warn) return;
    const q = (k - (this.period - this.WARN)) / this.WARN;
    ctx.save(); ctx.strokeStyle = `rgba(255,90,90,${0.5 + 0.5 * q})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y - 3, 22 - q * 10, 6 - q * 2, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = `rgba(20,10,40,${0.25 + 0.35 * q})`; ctx.beginPath(); ctx.ellipse(x, y - 3, 6 + q * 6, 2 + q * 2, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 8, y - 3); ctx.lineTo(x + 8, y - 3); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 2); ctx.stroke();
    ctx.restore();
  }
}
// a sign card on a little crate (the land's tips, in Piwi's stage crew's voice)
Object.assign(ENTITY_TYPES, { moonGeyser: MoonGeyser, moonGolfRain: MoonGolfRain });

let geyserN = 0;
Object.assign(Tour.pieces, {
  // a dust geyser at the letter (the vent's floor is the row under it): { w, top (row the column reaches), steady,
  // on, off, phase, force, faint }
  'moon.geyser'(st, o) {
    const B = st.B, w = o.w || 2, x = st.x, bot = st.gy - 1, top = o.top != null ? o.top : bot - (o.up || 10), gid = 'g' + (++geyserN);
    const z = B.zone(x, top, w, bot - top + 1, 0, -(o.force || 95) * TS, (o.vmax || 7.6) * TS, 'updraft', { pull: o.pull != null ? o.pull : 3, moonGeyser: gid });
    if (o.jumpOnly) z.moonJump = true;
    if (!o.steady) z.pulse = true;
    B.spawn('moonGeyser', x, bot, { w, h: bot - top + 1, steady: !!o.steady, on: o.on, off: o.off, phase: o.phase || 0, gid, faint: !!o.faint });
    return st.x;
  },
  // golf balls rain on this spot: { period, phase }
  'moon.golfRain'(st, o) { st.B.spawn('moonGolfRain', st.x, st.gy - 1, { period: o.period || 3.2, phase: o.phase || 0 }); return st.x; }
});

/* ---------------- 18-2 DRIFT: the spacewalk ----------------
   No ground but hull plates, airlocks and debris; next to no gravity (the venue's faint pull). Jump pushes off a
   plate; every jump press in mid-air is a PUFF from the air canister (TANK puffs: up and the way the stick points,
   cancelling most of the fall); Brady keeps his momentum (no air drag), the stick only nudges him. Landing on any
   plate tops the canister up from the hull hose; floating VALVES top it up in mid-flight. Drifting off the bottom
   is the end of the tether (a life). The game and the level checker run this same function; the checker plays the
   DRIFT_PLANS (real button sequences: push off, puff at these moments, hold the stick so), the shots tool too. */
const DRIFT = { pull: 10 * TS, push: 9 * TS, pushX: 5 * TS, puffV: 7 * TS, puffX: 4 * TS, maxX: 6.5 * TS, nudge: 1.5 * TS, maxFall: 6.5 * TS, tank: 3, walk: 0.8 };
function driftPhysics(p, inp, A, dt, platforms) {
  const D = Object.assign({}, DRIFT, A.moon.drift), ev = { jump: false, bonks: null, landed: false, swim: false };
  const m = p.moon || (p.moon = { tank: D.tank, puffT: 0 });
  if (m.tank == null) m.tank = D.tank;
  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
  if (dir) p.facing = dir;
  p.inWater = false; p.flipped = false;
  if (m.puffT > 0) m.puffT -= dt;
  // the valves: a floating canister refills the tank as Brady passes through it
  for (const z of A.zones || []) if (z.kind === 'moonValve' && p.x + p.w > z.x && p.x < z.x + z.w && p.y + p.h > z.y && p.y < z.y + z.h) { if (m.tank < D.tank) { m.tank = D.tank; m.refill = 0.5; } }
  if (m.refill > 0) m.refill -= dt;
  if (p.onGround) {
    m.tank = D.tank;
    p.vx = approach(p.vx, dir * PHYS.walk * D.walk, (dir ? PHYS.accel : PHYS.decel) * dt);
    if (inp.jumpPressed) { p.vy = -D.push; p.vx = dir * D.pushX + p.vx * 0.3; p.onGround = false; p.jumping = true; ev.jump = true; m.puffT = 0; }
  } else {
    if (inp.jumpPressed && m.tank > 0 && !ev.jump) {
      m.tank--; m.puffT = 0.3; ev.puff = true;
      p.vy = Math.min(p.vy, 0) * 0.25 - D.puffV;
      p.vx = dir ? clamp(p.vx + dir * D.puffX, -D.maxX, D.maxX) : p.vx * 0.7;
    }
    if (dir) p.vx = clamp(p.vx + dir * D.nudge * dt, -D.maxX, D.maxX);
    p.vy = Math.min(p.vy + D.pull * dt, D.maxFall);
  }
  const zf = zoneForce(A, p);
  if (zf && zf.fy) { p.vy += zf.fy * dt; if (zf.vmax && p.vy < -zf.vmax) p.vy = -zf.vmax; }
  const wasGround = p.onGround;
  moveBody(p, A, dt, { semis: true, hidden: true, corner: true, platforms, extraDx: zf && zf.fx ? zf.fx * dt : 0 });
  if (p.hitWall) p.vx *= 0.3;
  if (p.bonks) p.vy = Math.max(p.vy, 0.5 * TS);
  ev.bonks = p.bonks; ev.landed = p.onGround && !wasGround;
  if (p.onGround) p.jumping = false;
  return ev;
}
// the button plans: push off (or step off), then puff at these moments; the stick: 'same' (the whole way), 'up'
// (straight up until the first puff, then the way), 'free' (let go after the push), 'rev' (back after the first puff)
const DRIFT_PLANS = [
  { push: true, puffs: [], stick: 'same' }, { push: true, puffs: [0.6], stick: 'same' }, { push: true, puffs: [0.6, 1.3], stick: 'same' },
  { push: true, puffs: [0.6, 1.3, 2.0], stick: 'same' }, { push: false, puffs: [0.35], stick: 'same' }, { push: false, puffs: [0.35, 1.0], stick: 'same' },
  { push: true, puffs: [1.0], stick: 'same' }, { push: true, puffs: [1.0, 2.0], stick: 'same' }, { push: true, puffs: [1.0, 2.0, 3.0], stick: 'same' },
  { push: true, puffs: [0.3, 0.6], stick: 'same' }, { push: true, puffs: [0.3, 0.6, 0.9], stick: 'same' }, { push: false, puffs: [0.35, 1.0, 1.7], stick: 'same' },
  { push: true, puffs: [0.6], stick: 'free' }, { push: true, puffs: [0.6, 1.3], stick: 'free' }, { push: true, puffs: [0.6, 1.3, 2.0], stick: 'free' },
  { push: true, puffs: [0.7], stick: 'up' }, { push: true, puffs: [0.7, 1.4], stick: 'up' }, { push: true, puffs: [0.7, 1.4, 2.1], stick: 'up' },
  { push: true, puffs: [0.7], stick: 'rev' }, { push: true, puffs: [0.7, 1.4], stick: 'rev' }, { push: false, puffs: [], stick: 'same' },
  { push: true, puffs: [1.5, 2.5], stick: 'same' }, { push: true, puffs: [1.5], stick: 'free' }, { push: true, puffs: [0.4, 1.6, 2.8], stick: 'same' },
  { push: true, puffs: [2.0, 2.6, 3.2], stick: 'same' }
];
const driftInput = (plan, dir, t) => {
  const f = Math.round(t * 120), at = s => Math.round(s * 120) === f, first = plan.puffs.length ? plan.puffs[0] : 99;
  const inp = { left: false, right: false, up: false, down: false, jump: false, jumpPressed: false, action: false };
  if (plan.push && f === 0) inp.jumpPressed = true;
  inp.jump = plan.push && t < 0.1;
  for (const s of plan.puffs) if (at(s)) { inp.jumpPressed = true; inp.jump = true; }
  let d = dir;
  if (plan.stick === 'up') d = t < first ? 0 : dir;
  else if (plan.stick === 'free') d = t < 0.2 ? dir : 0;
  else if (plan.stick === 'rev') d = t < first ? dir : -dir;
  inp.left = d < 0; inp.right = d > 0;
  return inp;
};
{
  const ppf = playerPhysicsFlip;
  playerPhysicsFlip = function (p, inp, area, dt, platforms, opts) {
    if (area && area.moon && area.moon.drift) return driftPhysics(p, inp, area, dt, platforms);
    return ppf(p, inp, area, dt, platforms, opts);
  };
  // the level checker: a drift area's crossings are the DRIFT_PLANS flown from every plate (one-way edges for the
  // search, worked out once per checked level with this same physics); and each of a spot's own tries plays the next
  // plan, so postcards hung out in the open are flown through as well
  const stands = (A, x, y) => { const t0 = tileAt(A, x, y); return (SOLID[t0] || t0 === T.SEMI) && t0 !== T.SPIKES && !SOLID[tileAt(A, x, y - 1)] && !SOLID[tileAt(A, x, y - 2)]; };
  const flyPlan = (A, tx, ty, plan, dir, D, mark) => {
    // a spot the search reached hanging over a plate's edge: Brady stands on the plate's last tile
    if (!stands(A, tx, ty)) { if (stands(A, tx - 1, ty)) tx--; else if (stands(A, tx + 1, ty)) tx++; else return null; }
    const b = { x: tx * TS + TS / 2 - D.w / 2, y: ty * TS - D.h, w: D.w, h: D.h, vx: 0, vy: 0, onGround: true, jumping: false, facing: dir || 1, groundTile: T.GROUND, groundTx: tx, groundTy: ty, dropT: 0, moon: null };
    let t = 0, air = false; const dt = STEP;
    while (t < 6) {
      driftPhysics(b, driftInput(plan, dir, t), A, dt, null);
      t += dt; if (mark) mark(b);
      if (b.y > A.H * TS + 40 || b.y + b.h < -80) return null;
      if (lavaContact(b, A) || spikeContact(b, A)) return null;
      if (!b.onGround) air = true;
      if (b.onGround && air) return [Math.floor((b.x + b.w / 2) / TS), b.groundTy, 0];
      if (b.onGround && !air && t > 0.5) return [Math.floor((b.x + b.w / 2) / TS), b.groundTy, 0];
    }
    return null;
  };
  const sim0 = Validator.simulate, count = new WeakMap();
  Validator.simulate = function (A, ai, tx, ty, m, D, markBox, jumpBoost, f) {
    if (!(A.moon && A.moon.drift)) return sim0.call(this, A, ai, tx, ty, m, D, markBox, jumpBoost, f);
    if (m.spring || f) return null;
    let C = count.get(A); if (!C) count.set(A, C = new Map());
    const key = tx + ',' + ty + ':' + m.dir, first = m.jump && m.sp === 0 && !m.off && m.hold === 0.1 && !m.delay && !m.reverseAt && !m.stopAt;
    if (first) C.set(key, 0);
    const n = C.get(key) || 0; C.set(key, n + 1);
    if (n >= DRIFT_PLANS.length) return null;
    return flyPlan(A, tx, ty, DRIFT_PLANS[n], m.dir, D, b => markBox(ai, b));
  };
  const run0 = Validator.run;
  Validator.run = function (level, opts) {
    level.areas.forEach((a, ai) => {
      if (!(a.moon && a.moon.drift) || a.driftEdges) return;
      a.driftEdges = true; a.edges = a.edges || [];
      const A = this.proxyArea(a, 0), D = PLAYER_DIM.big, seen = new Set();
      const st = (x, y) => { const t0 = tileAt(A, x, y); return (SOLID[t0] || t0 === T.SEMI) && t0 !== T.SPIKES && !SOLID[tileAt(A, x, y - 1)] && !SOLID[tileAt(A, x, y - 2)]; };
      for (let y = 2; y < A.H; y++) for (let x = 0; x < A.W; x++) {
        if (!st(x, y)) continue;
        const edge = !st(x - 1, y) || !st(x + 1, y);
        if (!edge && x % 3) continue;
        for (const dir of [-1, 0, 1]) for (const plan of DRIFT_PLANS) {
          const L = flyPlan(A, x, y, plan, dir, D, null);
          if (!L || (L[0] === x && L[1] === y)) continue;
          const k = x + ',' + y + '>' + L[0] + ',' + L[1]; if (seen.has(k)) continue; seen.add(k);
          a.edges.push({ from: [x, y - 1], to: [L[0], L[1]] });
        }
      }
    });
    return run0.call(this, level, opts);
  };
}
// a floating air valve: a canister on a little thruster, a gauge, a hose; it refills the tank (its zone does it)
class MoonValve extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.back = true; }
  update(dt) { this.t += dt; const p = this.g.player; if (p && p.moon && p.moon.refill > 0.45 && overlap(p, { x: this.x - 16, y: this.y - 16, w: this.w + 32, h: this.h + 32 })) { this.g.parts.text(this.cx, this.y - 10, 'AIR!', '#7affd8'); TourKit.sfx('valve', 'pick', { vol: 0.4, pitch: 1.6 }); p.moon.refill = 0.44; } }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.cy + Math.sin(this.t * 2) * 3, t = this.t;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = 'rgba(122,255,216,0.18)'; ctx.beginPath(); ctx.arc(x, y, 26 + Math.sin(t * 4) * 2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8ecf4'; rr(ctx, x - 9, y - 15, 18, 30, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3ac8a8'; ctx.fillRect(x - 9, y - 4, 18, 7); ctx.strokeRect(x - 9, y - 4, 18, 7);
    ctx.fillStyle = '#5a6276'; ctx.fillRect(x - 4, y - 20, 8, 6); ctx.strokeRect(x - 4, y - 20, 8, 6);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y + 9, 3.5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#e8424a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y + 9); ctx.lineTo(x + Math.cos(t * 3) * 3, y + 9 - 2.5); ctx.stroke();
    ctx.fillStyle = '#7affd8'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('AIR', x, y - 24);
    ctx.restore();
  }
}
// space junk drifting to and fro on a line: a lost spanner, a road case, a golf ball, a snapped mic stand (it hurts;
// its path is drawn as a faint dotted line, the tell)
class MoonJunk extends Ent {
  constructor(g, s) { super(g, s, 26, 26); this.x0 = s.x - 13; this.y0 = s.y - 26; this.ax = (s.ax || 0) * TS; this.ay = (s.ay || 0) * TS; this.sp = s.speed || 0.5; this.kind = s.kind || 0; this.ph = s.phase || 0; this.enemy = true; this.place(); }
  place() { const k = (Math.sin(this.t * this.sp + this.ph) + 1) / 2; this.x = this.x0 + this.ax * k; this.y = this.y0 + this.ay * k; }
  update(dt) { this.t += dt; this.place(); }
  hit(kind) { return kind === 'stomp' || kind === 'spin' ? 'bounce' : false; }
  touchPlayer(p) { if (p.vy > 0 && p.prevBottom <= this.y + 6) { p.vy = -6 * TS; if (p.moon) p.moon.tank = Math.max(p.moon.tank, 1); this.g.parts.text(this.cx, this.y - 8, 'BONK', '#ffffff'); return; } p.hurt(this); }
  draw(ctx) {
    const x = this.cx, y = this.cy, t = this.t;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.setLineDash([2, 7]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(this.x0 + 13, this.y0 + 13); ctx.lineTo(this.x0 + 13 + this.ax, this.y0 + 13 + this.ay); ctx.stroke(); ctx.setLineDash([]);
    ctx.translate(x, y); ctx.rotate(t * (0.8 + this.kind * 0.3)); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    if (this.kind % 3 === 0) { ctx.fillStyle = '#b8bec8'; ctx.fillRect(-13, -3, 22, 6); ctx.strokeRect(-13, -3, 22, 6); ctx.beginPath(); ctx.arc(11, 0, 6, 0.7, -0.7 + TAU); ctx.lineTo(9, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (this.kind % 3 === 1) { ctx.fillStyle = '#26263a'; ctx.fillRect(-12, -10, 24, 20); ctx.strokeRect(-12, -10, 24, 20); ctx.fillStyle = '#b8bec8'; ctx.fillRect(-12, -10, 24, 3); ctx.fillRect(-12, 7, 24, 3); ctx.fillStyle = Tour.moonKit.PIWI; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', 0, 1); }
    else { MoonArt.golf(ctx, 0, 0, 11); }
    ctx.restore();
  }
}
// the tether: a line from Brady back to the last plate he stood on, and his air gauge over his head in a drift area
TourHooks.on('afterEntities', (play, ctx) => {
  const A = play.area, p = play.player; if (!A || !A.moon || !A.moon.drift || !p || p.dead) return;
  const m = p.moon || {}, max = Object.assign({}, DRIFT, A.moon.drift).tank;
  if (p.onGround) m.anchor = [p.cx, p.y + p.h];
  if (m.anchor && !p.onGround) { ctx.save(); ctx.strokeStyle = 'rgba(255,216,74,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(m.anchor[0], m.anchor[1]); ctx.quadraticCurveTo((m.anchor[0] + p.cx) / 2, Math.max(m.anchor[1], p.cy) + 40, p.cx - p.facing * 6, p.cy); ctx.stroke(); ctx.restore(); }
  // the air gauge over his head: a dark pill with one big canister light per puff (readable at arm's length)
  ctx.save(); const x = p.cx, y = p.y - 42, n = m.tank == null ? max : m.tank, pw = max * 22 + 30;
  ctx.fillStyle = 'rgba(10,8,24,0.82)'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; rr(ctx, x - pw / 2, y - 12, pw, 24, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = n ? '#7affd8' : '#ff7a7a'; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('AIR', x - pw / 2 + 16, y + 1);
  for (let k = 0; k < max; k++) { const full = k < n, cx = x - pw / 2 + 36 + k * 22; ctx.fillStyle = full ? '#7affd8' : '#3a3a4a'; ctx.strokeStyle = full ? '#ffffff' : '#6a6a7a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, y, 7.5, 0, TAU); ctx.fill(); ctx.stroke(); if (full) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(cx - 2.5, y - 2.5, 2.2, 0, TAU); ctx.fill(); } }
  if (m.refill > 0) { ctx.strokeStyle = `rgba(122,255,216,${m.refill * 2})`; ctx.lineWidth = 3; rr(ctx, x - pw / 2 - 4, y - 16, pw + 8, 32, 15); ctx.stroke(); }
  if (m.puffT > 0) { ctx.fillStyle = `rgba(230,240,255,${m.puffT * 2.5})`; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(p.cx - p.facing * (8 + k * 5), p.y + p.h - 6 + k * 4, 5 + k * 2, 0, TAU); ctx.fill(); } }
  ctx.restore();
});
Object.assign(ENTITY_TYPES, { moonValve: MoonValve, moonJunk: MoonJunk });
Object.assign(Tour.pieces, {
  // a floating air valve at the letter (its zone refills the tank)
  'moon.valve'(st, o) { st.B.zone(st.x - 1, st.gy - 3, 3, 3, 0, 0, 0, 'moonValve'); st.B.spawn('moonValve', st.x, st.gy - 2, {}); return st.x; },
  // drifting junk: { ax, ay (tiles), speed, kind, phase }
  'moon.junk'(st, o) { st.B.spawn('moonJunk', st.x, st.gy - 1, { ax: o.ax || 0, ay: o.ay || 0, speed: o.speed || 0.6, kind: o.kind || 0, phase: o.phase || 0 }); return st.x; }
});
Tour.moonKit.DRIFT = DRIFT; Tour.moonKit.DRIFT_PLANS = DRIFT_PLANS; Tour.moonKit.driftInput = driftInput;

/* ---------------- 18-3 ROVER: the moon buggy ----------------
   Brady drives a springy six-wheeled buggy. On the ground the stick is the THROTTLE (towards the way you face) and the
   BRAKE (the other way, then reverse); the buggy keeps rolling when you let go. Jump is the buggy's hop (hold it for
   a higher one). In the air the stick does NOT steer: it LEANS the buggy (nose up, nose down). Land flat (NICE),
   or the buggy bumps and loses most of its speed; land on its nose or its back (CRASH) and Brady takes a hit.
   The wheels climb a one-tile rock by themselves. The level checker runs this same function (its tries hold the
   stick all flight, which only leans: the path is the same however the player leans). */
const ROVER = { accel: 20 * TS, brake: 46 * TS, roll: 2.6 * TS, top: 11 * TS, rev: 4.5 * TS, hop: 13.5 * TS, cut: 5.5 * TS, lean: 3.4, sag: 0.55, nice: 0.35, crash: 1.05 };
function roverPhysics(p, inp, A, dt, platforms) {
  const R = ROVER, ev = { jump: false, bonks: null, landed: false, swim: false };
  const m = p.moon || (p.moon = {}); if (m.ang == null) m.ang = 0;
  const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), gm = A.gravity || 1;
  p.inWater = false; p.flipped = false;
  if (m.stun > 0) m.stun -= dt;
  const ctl = m.stun > 0 ? 0 : dir;
  if (p.onGround) {
    m.ang = approach(m.ang, 0, dt * 8);
    if (ctl) {
      if (p.vx && sign(p.vx) !== ctl) p.vx = approach(p.vx, 0, R.brake * dt);
      else p.vx = approach(p.vx, ctl * R.top, R.accel * dt);
      p.facing = ctl;
    } else p.vx = approach(p.vx, 0, R.roll * dt);
    if (inp.jumpPressed && !(m.stun > 0)) { p.vy = -R.hop; p.onGround = false; p.jumping = true; ev.jump = true; }
  } else {
    // the stick leans the buggy; left alone, its nose sags slowly the way it is going
    if (ctl) m.ang += ctl * R.lean * dt * (p.facing || 1);
    else m.ang += R.sag * dt * (p.vx >= 0 ? 1 : -1) * (p.facing || 1) * 0.5;
    m.ang = clamp(m.ang, -2.6, 2.6);
  }
  if (p.jumping && !inp.jump && p.vy < -R.cut) p.vy = -R.cut;
  const g = (p.vy < 0 && inp.jump && p.jumping) ? PHYS.gUp : PHYS.gDown;
  p.vy = Math.min(p.vy + g * gm * dt, PHYS.maxFall);
  const zf = zoneForce(A, p);
  if (zf && zf.fy) { p.vy += zf.fy * dt; if (zf.vmax && p.vy < -zf.vmax) p.vy = -zf.vmax; if (zf.fy < 0) p.jumping = false; }
  if (p.vy >= 0) p.jumping = false;
  const wasGround = p.onGround, vx0 = p.vx, x0 = p.x, y0 = p.y;
  moveBody(p, A, dt, { semis: true, hidden: true, corner: true, platforms, extraDx: zf && zf.fx ? zf.fx * dt : 0 });
  // the springy wheels climb a one-tile rock by themselves
  if (p.hitWall && wasGround && vx0) {
    const d = sign(vx0), fx = Math.floor((d > 0 ? p.x + p.w + 1 : p.x - 1) / TS), fy = Math.floor((p.y + p.h - 1) / TS);
    const free = y => !SOLID[tileAt(A, fx, y)] && !SOLID[tileAt(A, Math.floor((p.x + 1) / TS), y)] && !SOLID[tileAt(A, Math.floor((p.x + p.w - 1) / TS), y)];
    if (SOLID[tileAt(A, fx, fy)] && free(fy - 1) && free(fy - 2) && (p.h < 40 || free(fy - 3))) { p.y -= TS; p.x = x0 + vx0 * dt; p.vx = vx0 * 0.85; p.onGround = true; m.bump = 0.25; }
    else p.vx = 0;
  } else if (p.hitWall) p.vx = 0;
  ev.bonks = p.bonks;
  if (p.bonks) p.vy = Math.max(p.vy, 0);
  ev.landed = p.onGround && !wasGround;
  if (ev.landed) {
    const a = Math.abs(m.ang);
    if (a < R.nice) { m.say = a < 0.15 ? 'PERFECT!' : 'NICE!'; if (a < 0.15) p.vx *= 1.05; }
    else if (a < R.crash) { m.say = 'BUMP!'; p.vx *= 0.4; m.stun = 0.25; }
    else { m.say = 'CRASH!'; p.vx = 0; m.stun = 0.6; m.crash = true; }
    m.ang = 0; m.bump = 0.3;
  }
  if (m.bump > 0) m.bump -= dt;
  return ev;
}
{
  const ppf = playerPhysicsFlip;
  playerPhysicsFlip = function (p, inp, area, dt, platforms, opts) {
    if (area && area.moon && area.moon.rover) return roverPhysics(p, inp, area, dt, platforms);
    return ppf(p, inp, area, dt, platforms, opts);
  };
  // the game: a crash costs a hit; the landing words; the engine hum
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt) {
    const r = up0.apply(this, arguments), m = this.moon, A = this.g && this.g.area;
    if (m && A && A.moon && A.moon.rover) {
      if (m.say) { if (this.g.onScreen(this)) this.g.parts.text(this.cx, this.y - 20, m.say, m.say === 'CRASH!' ? '#ff6a6a' : m.say === 'BUMP!' ? '#ffd84a' : '#7affd8'); if (m.say === 'CRASH!' || m.say === 'BUMP!') { this.g.shake(m.say === 'CRASH!' ? 6 : 2); this.g.burst(this.cx, this.y + this.h, 8, '#e8e2f2', 'dust'); } m.say = null; }
      if (m.crash) { m.crash = false; this.hurt({ x: this.x, y: this.y + this.h, w: this.w, h: 1, cx: this.cx, cy: this.cy }); }
    } else if (m) { m.ang = 0; m.stun = 0; }
    return r;
  };
}
// the buggy itself, drawn over Brady's legs: a six-wheeled tub with a dish antenna, a P on the side, the springs
// squashing on landings; leaning with m.ang
const Buggy = {
  draw(ctx, p, t) {
    const m = p.moon || {}, f = p.facing || 1, x = p.cx, y = p.y + p.h, ang = (m.ang || 0) * f, sq = m.bump > 0 ? Math.sin(m.bump / 0.3 * Math.PI) * 4 : 0;
    const roll = (p.x / 9) % TAU;
    ctx.save(); ctx.translate(x, y - 10); ctx.rotate(ang); ctx.scale(f, 1);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    // wheels on their springs
    for (const wx of [-24, 0, 24]) {
      const wy = (p.onGround ? 0 : 4) + (wx === 0 ? 1 : 0);
      ctx.strokeStyle = '#8a92a6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx, -10 + sq); for (let k = 1; k <= 4; k++) ctx.lineTo(wx + (k % 2 ? 3 : -3), -10 + sq + k * (wy + 10 - sq) / 4); ctx.stroke();
      ctx.strokeStyle = INK; ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.arc(wx, wy, 8, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.arc(wx, wy, 3.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#c8ccd4'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(wx + Math.cos(roll) * 6, wy + Math.sin(roll) * 6); ctx.lineTo(wx - Math.cos(roll) * 6, wy - Math.sin(roll) * 6); ctx.stroke();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the tub
    ctx.fillStyle = '#e8ecf4'; ctx.beginPath(); ctx.moveTo(-34, -12 + sq); ctx.lineTo(30, -12 + sq); ctx.lineTo(36, -24 + sq); ctx.lineTo(10, -26 + sq); ctx.lineTo(4, -34 + sq); ctx.lineTo(-30, -34 + sq); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(-32, -20 + sq, 60, 5); ctx.strokeRect(-32, -20 + sq, 60, 5);
    ctx.fillStyle = Tour.moonKit.PIWI; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', -18, -27 + sq);
    // the headlight and the dish antenna on its stalk
    ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(33, -18 + sq, 3.5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-28, -34 + sq); ctx.lineTo(-30, -50 + sq); ctx.stroke();
    ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.ellipse(-30, -52 + sq, 7, 3, -0.4 + Math.sin(t * 2) * 0.3, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
};
TourHooks.on('afterEntities', (play, ctx) => {
  const A = play.area, p = play.player; if (!A || !A.moon || !A.moon.rover || !p || p.dead) return;
  Buggy.draw(ctx, p, play.t);
});
// Brady sits in the buggy: the game's own seated (ride) pose, small or big, lifted so his hips are in the tub and his
// face and shades show over its rim; the tub (drawn after him) covers his legs
{
  const ua0 = Player.prototype.updateAnim;
  Player.prototype.updateAnim = function (dt, inp) { const r = ua0.call(this, dt, inp); const A = this.g && this.g.area; if (A && A.moon && A.moon.rover && !this.dead && this.state === 'play') this.anim.state = 'ride'; return r; };
  const dr0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx, t) {
    const A = this.g && this.g.area;
    if (!(A && A.moon && A.moon.rover) || this.dead || this.mounted) return dr0.call(this, ctx, t);
    const m = this.moon || {}, lift = this.small ? 20 : 14, ang = (m.ang || 0) * (this.facing || 1);
    ctx.save(); ctx.translate(this.cx, this.y + this.h - 10); ctx.rotate(ang); ctx.translate(-this.cx, -(this.y + this.h - 10));
    this.y -= lift; try { return dr0.call(this, ctx, t); } finally { this.y += lift; ctx.restore(); }
  };
}
Tour.moonKit.ROVER = ROVER;

/* ---------------- 18-4 MAG: the magnet boots ----------------
   The base's blue metal panels: with the boots ON (the action button switches them, anywhere, any time) Brady falls
   UP to the panels over his head and walks the ceiling (the engine's flip band, tied to toggle group 0); switch them
   OFF and he drops back down in the low gravity. The checker's search may switch the boots at any standing spot
   (an automatic toggle group); the player can do that and more (in mid-air too). */
const MAG_G = 0;
function magBoots(play) { return !!(play.area && play.area.toggleState && play.area.toggleState[MAG_G]); }
{
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g, A = g && g.area;
    if (A && A.moon && A.moon.mag && inp && inp.actionPressed && this.state === 'play' && !this.dead) {
      g.flipToggle(MAG_G, true);
      const on = magBoots(g);
      TourKit.sfx('mag', 'select', { vol: 0.5, pitch: on ? 1.6 : 0.8 });
      g.parts.text(this.cx, this.y - 14, on ? 'BOOTS ON' : 'BOOTS OFF', on ? '#7ad8ff' : '#c8c2d4');
      if (!this.magTold) { this.magTold = true; }
      inp = Object.assign({}, inp, { actionPressed: false, action: false });
    }
    return up0.call(this, dt, inp);
  };
  if (typeof TourPicker !== 'undefined') {
    const vis0 = TourPicker.visible;
    TourPicker.visible = function (play) { if (play && play.area && play.area.moon && play.area.moon.mag) return false; return vis0.call(this, play); };
  }
}
// a span of blue metal panels on the ceiling: drawn under the ceiling tiles, with field lines down into the band
// while the boots are on
class MoonMagPanel extends Ent {
  constructor(g, s) { super(g, s, (s.w || 4) * TS, (s.h || 10) * TS); this.x = s.x - TS / 2; this.y = s.top * TS; this.ceil = s.ceil; this.floor = !!s.floor; this.back = true; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    const on = magBoots(this.g), x = this.x, w = this.w, t = this.t, cy = this.ceil * TS;
    ctx.save();
    // the panels: blue steel with bolts and a magnet stripe, hung under the ceiling row
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = on ? '#4ab8ff' : '#2a7aff'; ctx.fillRect(x, cy - 2, w, 12); ctx.strokeRect(x, cy - 2, w, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x + 2, cy, w - 4, 2);
    ctx.fillStyle = '#e8424a'; for (let k = x + 6; k < x + w - 6; k += 32) ctx.fillRect(k, cy + 4, 10, 4);
    ctx.fillStyle = '#c8d8ff'; for (let k = x + 20; k < x + w - 4; k += 32) { ctx.beginPath(); ctx.arc(k, cy + 6, 1.6, 0, TAU); ctx.fill(); }
    // the field: faint arcs down into the band (bright and moving with the boots on)
    const a = on ? 0.35 : 0.1;
    ctx.strokeStyle = `rgba(120,200,255,${a})`; ctx.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) { const ph = on ? (t * 0.8 + k / 3) % 1 : k / 3, yy = cy + ph * this.h; ctx.beginPath(); ctx.moveTo(x + 4, yy); ctx.quadraticCurveTo(x + w / 2, yy + 10, x + w - 4, yy); ctx.stroke(); }
    ctx.restore();
  }
}
ENTITY_TYPES.moonMagPanel = MoonMagPanel;
// Brady's boots glow blue while they are on
TourHooks.on('afterEntities', (play, ctx) => {
  const A = play.area, p = play.player; if (!A || !A.moon || !A.moon.mag || !p || p.dead) return;
  const on = magBoots(play), y = p.flipped ? p.y : p.y + p.h;
  ctx.save(); ctx.fillStyle = on ? '#4ab8ff' : '#5a6276'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  for (const dx of [-6, 6]) { ctx.beginPath(); ctx.ellipse(p.cx + dx, y + (p.flipped ? 2 : -2), 6, 3.5, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  if (on) { ctx.fillStyle = 'rgba(80,180,255,0.3)'; ctx.beginPath(); ctx.ellipse(p.cx, y, 18, 7, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
});
Tour.pieces['moon.metal'] = function (st, o) {
  // metal panels under the ceiling row `ceil` from the letter, w wide; the band reaches down to row `bot`
  const B = st.B, x = st.x, w = o.w || 6, ceil = o.ceil, bot = o.bot;
  if (!B.toggles[MAG_G]) B.toggle(MAG_G, [], [], { kind: 'boots', auto: true });
  B.zone(x, ceil + 1, w, bot - ceil, 0, 0, 0, 'flip', { g: MAG_G });
  B.spawn('moonMagPanel', x, bot, { w, top: ceil + 1, ceil: ceil + 1, h: bot - ceil });
  return st.x;
};
Tour.moonKit.magBoots = magBoots;

/* ---------------- 18-6 STARS: connect the stars ----------------
   Star pads lie on the ground in little constellations. Step on them in order (each shows its number; the next
   one pulses, a dotted line shows the shape): each lit star draws a line of light from the one before. A wrong
   star puts the constellation out. The last star finishes it: the constellation becomes a BRIDGE OF LIGHT (toggle
   group c: its B tiles appear). The checker flips the group at the last star (a switch there); every
   constellation's stars are laid out on ground reachable from each other before its bridge, so that order exists. */
class MoonStarPad extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.c = s.c || 0; this.n = s.n || 0; this.of = s.of || 1; this.back = true; this.t = 0; }
  st() { const A = this.g.area; A.moonStars = A.moonStars || {}; return A.moonStars[this.c] || (A.moonStars[this.c] = { next: 0, done: false, lit: [] }); }
  update(dt) {
    this.t += dt; const p = this.g.player, S = this.st();
    if (!p || p.dead || S.done || !p.onGround) { this.on = false; return; }
    const here = p.groundTy === Math.floor(this.y / TS) + 1 && Math.abs(p.cx - this.cx) < TS * 0.7;
    if (here && !this.on) {
      if (S.lit.indexOf(this.n) >= 0) { /* already lit */ }
      else if (this.n === S.next) {
        S.lit.push(this.n); S.next++; TourKit.sfx('chime', 'pick', { vol: 0.5, pitch: 1 + this.n * 0.12 }); this.g.burst(this.cx, this.y + 10, 10, '#ffe8a0', 'spark');
        if (S.next >= this.of) { S.done = true; this.g.flipToggle(this.c, true); this.g.parts.text(this.cx, this.y - 30, 'A BRIDGE OF STARS!', '#ffe8a0'); TourKit.sfx('bridge', 'checkpoint', { vol: 0.6 }); this.g.shake(2); }
      } else if (S.lit.length) { S.lit.length = 0; S.next = 0; TourKit.sfx('fizz', 'bump', { vol: 0.5, pitch: 0.6 }); this.g.parts.text(this.cx, this.y - 20, 'WRONG STAR! START AGAIN', '#ff9a9a'); }
    }
    this.on = here;
  }
  touchPlayer() {}
  draw(ctx) {
    const S = this.st(), lit = S.done || S.lit.indexOf(this.n) >= 0, next = !S.done && S.next === this.n, x = this.cx, y = this.y + TS - 10, t = this.t;
    ctx.save();
    // the dotted line to the next star (the shape), or the line of light once both are lit
    const nx = this.g.entities.find(e => e instanceof MoonStarPad && e.c === this.c && e.n === this.n + 1);
    if (nx) {
      const both = S.done || (lit && S.lit.indexOf(nx.n) >= 0);
      ctx.strokeStyle = both ? 'rgba(255,240,180,0.95)' : 'rgba(200,210,255,0.35)'; ctx.lineWidth = both ? 3 : 1.5; if (!both) ctx.setLineDash([3, 6]);
      ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(nx.cx, nx.y + TS - 18); ctx.stroke(); ctx.setLineDash([]);
    }
    const r = 11 + (next ? Math.sin(t * 6) * 2.5 : 0);
    if (lit || next) { const g2 = ctx.createRadialGradient(x, y - 8, 2, x, y - 8, 30); g2.addColorStop(0, lit ? 'rgba(255,240,170,0.6)' : 'rgba(180,200,255,0.4)'); g2.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(x, y - 8, 30, 0, TAU); ctx.fill(); }
    ctx.fillStyle = lit ? '#ffe8a0' : '#6a6aa8'; ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.beginPath(); TourKit.star(ctx, x, y - 8, r, r * 0.45, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = lit ? '#5a3a10' : '#ffffff'; ctx.font = TourBackstage.F8; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(this.n + 1), x, y - 7);
    ctx.restore();
  }
}
// the bridge of starlight: drawn over its tiles once its constellation is finished (the tiles are one-way floors)
class MoonStarBridge extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.c = s.c || 0; this.r = s.r; this.x = s.r[0] * TS; this.y = s.r[1] * TS; this.w = (s.r[2] - s.r[0] + 1) * TS; this.h = (s.r[3] - s.r[1] + 1) * TS; this.back = true; this.k = 0; }
  update(dt) { this.t += dt; this.k = approach(this.k, this.g.toggleBit(this.c) ? 1 : 0, dt * 2); }
  touchPlayer() {}
  draw(ctx) {
    const k = this.k, x = this.x, y = this.y, w = this.w;
    ctx.save();
    if (k < 0.01) { ctx.strokeStyle = 'rgba(200,210,255,0.22)'; ctx.setLineDash([2, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x + w, y + 4); ctx.stroke(); ctx.restore(); return; }
    const ww = w * k;
    ctx.fillStyle = 'rgba(255,240,170,0.25)'; ctx.fillRect(x, y - 6, ww, 18);
    ctx.fillStyle = '#ffe8a0'; ctx.fillRect(x, y, ww, 6); ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, ww, 2);
    ctx.fillStyle = '#fff8d8'; for (let q = x + 8; q < x + ww; q += 24) { ctx.beginPath(); TourKit.star(ctx, q + Math.sin(this.t * 3 + q) * 2, y + 3, 4, 1.8, 4); ctx.fill(); }
    ctx.restore();
  }
}
Object.assign(ENTITY_TYPES, { moonStarPad: MoonStarPad, moonStarBridge: MoonStarBridge });
Object.assign(Tour.pieces, {
  // a star pad at the letter (it lies on the tile under it): { c, n, of }; the last one is the checker's switch
  'moon.star'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1;
    B.spawn('moonStarPad', x, y, { c: o.c || 0, n: o.n || 0, of: o.of || 1 });
    if (!B.toggles[o.c || 0]) B.toggle(o.c || 0, [], [], { kind: 'stars' });
    if ((o.n || 0) === (o.of || 1) - 1) B.switchAt(o.c || 0, x, y);
    return st.x;
  },
  // the bridge of constellation c: a row of one-way starlight from the letter, w long (dy: rows below the letter)
  'moon.bridge'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1 + (o.dy || 0), r = [x, y, x + (o.w || 6) - 1, y, T.SEMI];
    B.toggle(o.c || 0, [], [r], { kind: 'stars' });
    for (let q = r[0]; q <= r[2]; q++) B.set(q, y, T.EMPTY);
    B.spawn('moonStarBridge', x, y, { c: o.c || 0, r: r.slice(0, 4) });
    return st.x;
  }
});

Object.assign(TourLandscape.ARCH_LABEL, { lowg: 'LOW-G', drift: 'SPACEWALK', rover: 'BUGGY', mag: 'MAG BOOTS', stars: 'STARS' });
Tour.moonKit.MOON_G = MOON_G;
// a lift that only takes a FULL jump from below (zone flag moonJump): the ceiling gap in 18-1 never yanks Brady up
// from a hop or a stomp under it; once it has him it keeps him until he leaves it. The game and the checker share it.
{
  const zf0 = zoneForce;
  zoneForce = function (area, b) {
    const Z = area.zones;
    if (!Z || !Z.some(z => z.moonJump && !z.off)) return zf0(area, b);
    const cx = b.x + b.w / 2, cy = b.y + b.h * 0.6;
    let inJ = null; for (const z of Z) if (z.moonJump && !z.off && cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h) inJ = z;
    if (inJ && (b.moonCaught || b.vy < -6 * TS)) { b.moonCaught = true; return zf0(area, b); }
    if (!inJ) b.moonCaught = false;
    if (!inJ) return zf0(area, b);
    // inside a jump lift without the jump: the other zones only
    const keep = area.zones; area.zones = Z.filter(z => !z.moonJump); try { return zf0(area, b); } finally { area.zones = keep; }
  };
}
// the camera on the moon looks further UP (Brady's feet at 70 % of the view, not 55 %): the jumps go high and the
// spike overhangs and the gaps in them must be on screen before you jump
{
  const ct0 = Play.prototype.camTargetY;
  Play.prototype.camTargetY = function (snap) {
    const A = this.area, p = this.player;
    if (A && A.moon && A.camera === 'free' && p && !A.autoscrollY) return clamp(p.y + p.h - Game.viewH * 0.7, 0, Math.max(0, A.H * TS - Game.viewH));
    return ct0.call(this, snap);
  };
}
// for the shots tool's autopilot: the game's own physics, run on a copy of Brady's body
try { if (typeof window !== 'undefined') window.BRADY_MOON = { phys: (b, inp, A, dt, pl, o) => playerPhysicsFlip(b, inp, A, dt, pl, o), spikeContact: (b, A) => spikeContact(b, A), lavaContact: (b, A) => lavaContact(b, A), moveBody: (b, A, dt, o) => moveBody(b, A, dt, o), kit: Tour.moonKit, driftInput, DRIFT_PLANS }; } catch (e) { /* not in a browser */ }
})();
