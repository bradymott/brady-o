/* ============================================================
   World tour: Pupo's rollout to Japan, Nepal, Antarctica and World 22
   (docs/design/PUPO.md §8.2, group P2-G4). New, generic mechanics on
   top of the shipped Pupo objects, by wrapping only (the engine files
   28_tour_p*.js and the G1 / G2 wrappers are not edited):
   - pupoClimb { bend: { to: [dx, dy], at, say } }: a bending stalk
     (11-3's bamboo). Once Pupo has climbed past `at` of its height
     (0.5), it bends under his weight and carries him in a slow arc to
     the landing spot `to` (tiles from the stalk's foot cell), then
     springs back up. e.bendA is its bend (radians, for the look)
   - pupoGrab { clock: { r, from, to, crawl, back, say } }: a clock's
     minute hand as a moving hook (22-1). It rests at minute `from`
     (2:22: 22), turns on toward `to` (60: the top) over `crawl` s only
     while Pupo hangs from it, and winds back to `from` in `back` s
     when he lets go. Letting go at the top: Pupo's line `say`
   - pupoFerry { g, dx, w, quay: [tx, ty] }: a floe that is a moving
     platform (13-3), at its spawn when toggle group g is on, dx tiles
     further out when it is off; a pupoHandle with the same g reels it
     in and pushes it out again. Whoever stands on it rides along; a wind
     zone tagged { ferry: g } is off for whoever stands on (or by) it
   - pupoTickle { bounce, slide: [dx, dy], dur }: Brady (on Pupo or not)
     walking into the sleeper bounces off it with `bounce` said; once
     tickled it takes `dur` s to slide away (12-3's yeti)
   - pupoGondola { g, drop, coins }: a hanging cradle of coins, lowered
     `drop` rows when toggle group g is on (a pull handle); touched when
     down, it pays out its coins once (11-4)
   - the level checker learns them (PupoVal.derive, wrapped, as G2's
     poke key): a bend is an edge from the stalk's upper half to its
     landing spot; a clock hand is a row of hanging spots along its
     turn, one edge to the next, entered from any riding spot in reach
     of it at rest; a ferry is an edge from every riding spot in reach
     of its handle to its quay. All only while riding.
   - PupoVal.probeRun: probes answered riding too (sbw_items_test)
   - the camera under a high Pupo object (s.camTop: a px row to keep on
     screen, s.camK of the view's height below its top edge, under the
     HUD) while Brady is within s.camX of it and no more than s.camD
     rows below that row (11-4's onigiri, seen from its ledge)
   Nothing here allocates per frame.
   ============================================================ */
const PupoG4 = {
  BEND_T: 1.6,
  // Pupo, ridden, in mode `mode` on entity e
  on(g, mode, e) {
    const p = g && g.player, R = g && g.pupo; if (!p || !p.pupoRide || p.dead || !R || R.mode !== mode) return false;
    if (mode === 'climb') return !!(R.cl && R.cl.e === e);
    if (mode === 'swing') return !!(R.sw && R.sw.e === e);
    if (mode === 'bend') return !!(R.bd && R.bd.e === e);
    return true;
  },
  // a clock hand's place for minute m (r tiles round its centre ax, ay)
  handAt(e, m) { const th = m / 60 * TAU, r = (e.s.clock.r || 3) * TS; e.hx = e.ax + Math.sin(th) * r; e.hy = e.ay - Math.cos(th) * r; e.x = e.hx - 10; e.y = e.hy - 10; },
  smooth(k) { return k * k * (3 - 2 * k); }
};

/* ---------- the bending stalk (pupoClimb { bend }) ---------- */
if (typeof PupoClimb !== 'undefined' && typeof PupoRide !== 'undefined') {
  const C = PupoClimb.prototype, up0 = C.update;
  C.update = function (dt) {
    up0.call(this, dt);
    const s = this.s, b = s && s.bend; if (!b) return;
    const g = this.g, p = g.player;
    if (this.bendA === undefined) { this.bendA = 0; this.bendV = 0; }
    if (PupoG4.on(g, 'bend', this)) return;
    // springing back up: a damped wobble about upright
    this.bendV += (-60 * this.bendA - 7 * this.bendV) * dt; this.bendA += this.bendV * dt;
    if (Math.abs(this.bendA) < 0.002 && Math.abs(this.bendV) < 0.01) { this.bendA = 0; this.bendV = 0; }
    // Pupo climbing past the middle: it bends under his weight
    if (PupoG4.on(g, 'climb', this) && g.pupo.cl.up === 0 && Math.abs(this.bendA) < 0.2 && p.y + p.h <= this.bottom - (this.bottom - this.top) * (b.at || 0.5)) {
      PupoRide.leave(g, p); PupoRide.enter(g, p, 'bend', this);
    }
  };
  C.bendA = 0; C.bendV = 0;
  // the mode: a slow arc about the stalk's foot from where he holds it to the landing spot
  PupoRide.modes.bend = {
    enter(p, g, R, e) {
      const d = R.bd || (R.bd = { e: null, t: 0, px: 0, py: 0, r0: 0, a0: 0, rL: 0, aL: 0, lx: 0, ly: 0, dir: 1 });
      const to = e.s.bend.to || [8, 0];
      d.e = e; d.t = 0; d.px = e.cx; d.py = e.bottom;
      d.lx = (e.tx + to[0]) * TS + TS / 2; d.ly = e.bottom + (to[1] || 0) * TS; d.dir = to[0] >= 0 ? 1 : -1;
      const fx = p.cx - d.px, fy = d.py - (p.y + p.h); d.r0 = Math.max(TS, Math.sqrt(fx * fx + fy * fy)); d.a0 = Math.atan2(fx, fy);
      const lx = d.lx - d.px, ly = d.py - d.ly; d.rL = Math.sqrt(lx * lx + ly * ly); d.aL = Math.atan2(lx, ly);
      p.vx = 0; p.vy = 0; p.onGround = false; p.facing = d.dir;
      PupoRide.sfx('pupoBend', 'spring', { pitch: 0.5, vol: 0.45 });
      if (e.s.bend.say) PupoRide.say(g, p.cx, p.y - 18, e.s.bend.say);
    },
    update(p, dt, inp, g, R) {
      const d = R.bd, e = d.e;
      if (!e || e.remove) { PupoRide.leave(g, p); return; }
      d.t += dt; const k = Math.min(1, d.t / PupoG4.BEND_T), q = PupoG4.smooth(k);
      const a = d.a0 + (d.aL - d.a0) * q, r = d.r0 + (d.rL - d.r0) * q;
      e.bendA = a; e.bendV = 0; e.holdR = r;
      const fx = d.px + Math.sin(a) * r, fy = d.py - Math.cos(a) * r;
      p.x = fx - p.w / 2; p.y = fy - p.h; p.vx = 0; p.vy = 0; p.facing = d.dir;
      if (k >= 1) {
        // set down gently on the far bank; the stalk lets go and springs back up behind him
        p.x = d.lx - p.w / 2; p.y = d.ly - p.h; p.onGround = true;
        e.cool = 1.2; e.bendV = -1.5;
        PupoRide.leave(g, p); g.burst(p.cx, p.y + p.h - 4, 8, '#e8f0c8', 'dust');
        if (e.s.bend.land) PupoRide.say(g, p.cx, p.y - 18, e.s.bend.land);
      }
    },
    exit(p, g, R) { if (R.bd && R.bd.e) R.bd.e.holdR = 0; PupoReach.letGo(p, R); },
    pose(p, R, o) { const d = R.bd, a = d.e ? d.e.bendA : 0; o.pose = 'climb'; o.x = p.cx; o.y = p.y + p.h; o.phase = 0; o.armsOff = false; o.rot = clamp(a * 0.45, -0.6, 0.6); o.rotX = p.cx; o.rotY = p.y + p.h * 0.6; return o; }
  };
}

/* ---------- the clock's minute hand (pupoGrab { clock }) ---------- */
if (typeof PupoGrab !== 'undefined' && typeof PupoRide !== 'undefined') {
  const Gp = PupoGrab.prototype, pl0 = Gp.place, up0 = Gp.update;
  Gp.place = function () {
    const c = this.s && this.s.clock; if (!c) return pl0.call(this);
    if (this.cm === undefined) { this.cm = c.from != null ? c.from : 22; this.rode = false; }
    PupoG4.handAt(this, this.cm);
  };
  Gp.update = function (dt) {
    const c = this.s && this.s.clock; if (!c) return up0.call(this, dt);
    this.t += dt;
    const g = this.g, from = c.from != null ? c.from : 22, to = c.to != null ? c.to : 60, ridden = PupoG4.on(g, 'swing', this);
    if (ridden) { this.rode = true; this.cm = Math.min(to, this.cm + (to - from) / (c.crawl || 6) * dt); }
    else {
      // let go: at the top, Pupo's line; then the hand winds back to its rest
      if (this.rode) { this.rode = false; const p = g.player; if (c.say && this.cm >= to - 1 && p && p.pupoRide) PupoRide.say(g, p.cx, p.y - 18, c.say); }
      if (this.cm > from) this.cm = Math.max(from, this.cm - (to - from) / (c.back || 2) * dt);
    }
    // a tick each minute it passes (a tock while it winds back)
    const mm = Math.floor(this.cm); if (mm !== this.lastM) { if (this.lastM !== undefined && (ridden || mm % 4 === 0)) PupoRide.sfx('clockTick', 'pick', { pitch: ridden ? 2.6 : 3.2, vol: 0.12 }); this.lastM = mm; }
    PupoG4.handAt(this, this.cm);
  };
}

/* ---------- the ferry floe (pupoFerry): a platform reeled in and pushed out by a pull handle ---------- */
class PupoFerry extends Ent {
  constructor(g, s) {
    const w = (s.w || 3) * TS;
    super(g, s, w, 14); this.x0 = Math.floor(s.x / TS) * TS; this.x1 = this.x0 + (s.dx || 8) * TS; this.y = s.y - TS;   // spawned in the water row: its top is flush with the dock
    this.gi = s.g || 0; this.look = s.look; this.isPlatform = true; this.dx = 0; this.dy = 0; this.friendly = true; this.back = true;
    this.x = this.x1; this.v = 0; this.moving = 0; this.huff = 0;
  }
  update(dt) {
    this.t += dt; if (this.huff > 0) this.huff -= dt;
    // a wind zone over the water tagged with this floe's group (zone.ferry === g): the floe and its penguins are a
    // windbreak for whoever stands on it (or steps on or off it), so only a jump over the water meets the wind
    if (this.zone === undefined) { this.zone = null; for (const z of this.g.area.zones || []) if (z.ferry === this.gi) this.zone = z; }
    if (this.zone) { const p = this.g.player; this.zone.off = !!(p && !p.dead && (p.ride === this || (p.onGround && Math.abs(p.y + p.h - this.y) < 6 && p.x + p.w > this.x - TS && p.x < this.x + this.w + TS))); }
    const tx = this.g.toggleBit(this.gi) ? this.x0 : this.x1, d = tx - this.x, a = 7 * TS;
    // ease toward its berth: speed up, cruise at 3.4 t/s, slow down to dock
    let v = Math.sign(d) * Math.min(3.4 * TS, Math.sqrt(2 * a * Math.abs(d)));
    if (Math.abs(d) < 0.5) { v = 0; this.dx = tx - this.x; this.x = tx; }
    else { this.v = approach(this.v, v, a * dt); const mv = clamp(this.v * dt, -Math.abs(d), Math.abs(d)); this.dx = mv; this.x += mv; }
    if (v !== 0 && !this.moving) { this.moving = 1; this.huff = 1.6; if (this.s.huff) this.g.parts.text(this.cx, this.y - 34, this.s.huff, '#ffffff'); }
    else if (v === 0 && this.moving) { this.moving = 0; this.v = 0; TourKit.sfx('floeDock', 'bump', { pitch: 0.6, vol: 0.4 }); }
    this.dy = 0;
  }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.look)) return;
    ctx.fillStyle = '#1c1426'; rr(ctx, this.x - 2, this.y - 2, this.w + 4, this.h + 6, 5); ctx.fill();
    ctx.fillStyle = '#e8f6ff'; rr(ctx, this.x, this.y, this.w, this.h + 2, 4); ctx.fill();
  }
}
ENTITY_TYPES.pupoFerry = PupoFerry;

/* ---------- the gondola of coins (pupoGondola): lowered by a pull handle, paid out once ---------- */
class PupoGondola extends Ent {
  constructor(g, s) {
    super(g, s, 3 * TS, 26); this.x = Math.floor(s.x / TS) * TS - TS; this.y0 = s.y - this.h; this.y = this.y0; this.drop = (s.drop || 6) * TS;
    this.gi = s.g || 0; this.n = s.coins || 10; this.paid = false; this.look = s.look; this.friendly = true; this.back = true; this.k = 0;
  }
  update(dt) {
    this.t += dt;
    const down = this.g.toggleBit(this.gi);
    this.k = approach(this.k, down ? 1 : 0, dt / 1.4);
    this.y = this.y0 + this.drop * PupoG4.smooth(this.k);
    if (this.k >= 1 && !this.paid) {
      const p = this.g.player;
      if (p && !p.dead && overlap(p, this)) {
        this.paid = true;
        for (let i = 0; i < this.n; i++) this.g.addPick(this.cx - 30 + (i % 5) * 15, this.y - 8 - Math.floor(i / 5) * 12);
        this.g.burst(this.cx, this.y, 14, '#ffd84a', 'confetti'); TourKit.sfx('gondolaCoins', 'oneup', { vol: 0.6 });
        if (this.s.say && p.pupoRide) PupoRide.say(this.g, p.cx, p.y - 18, this.s.say);
      }
    }
  }
  draw(ctx) {
    if (TourObj.skin(ctx, this, this.look)) return;
    ctx.fillStyle = '#1c1426'; ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = '#9ab0c8'; ctx.fillRect(this.x + 2, this.y + 2, this.w - 4, this.h - 4);
  }
}
ENTITY_TYPES.pupoGondola = PupoGondola;

/* ---------- the tickle gate's extras: Brady bounces off the sleeper; a slower slide away ---------- */
if (typeof PupoTickle !== 'undefined') {
  const Tk = PupoTickle.prototype, up0 = Tk.update;
  Tk.update = function (dt) {
    const s = this.s || {}, wasAwake = this.awake;
    up0.call(this, dt);
    // the slide away takes s.dur seconds instead of 1.2 (the base adds dt / 1.2)
    if (s.dur && this.awake && wasAwake && this.k < 1) { this.k -= dt / 1.2 - dt / s.dur; if (this.k < 0) this.k = 0; }
    if (this.bounceT > 0) this.bounceT -= dt;
    if (!s.bounce || this.awake || this.giggle > 0) return;
    const p = this.g.player; if (!p || p.dead || p.state !== 'play') return;
    // walking (or jumping) into the big soft sleeper: Brady bounces back off it
    if (p.x + p.w > this.x - 6 && p.x < this.x + this.w + 6 && p.y + p.h > this.y + 4 && p.y < this.y + this.h) {
      const side = p.cx < this.cx ? -1 : 1;
      p.vx = side * 5.5 * TS; if (p.onGround) { p.vy = -7 * TS; p.onGround = false; } p.x += side * 2;
      if (!(this.bounceT > 0)) { this.bounceT = 1.2; this.g.parts.text(this.cx, this.y - 8, s.bounce, '#e8e4ff'); TourKit.sfx('yetiBounce', 'bump', { pitch: 0.5, vol: 0.5 }); }
    }
  };
  Tk.bounceT = 0;
}

/* ---------- the level checker: bends, clock hands and ferries, while riding ---------- */
if (typeof PupoVal !== 'undefined') {
  const d0 = PupoVal.derive;
  PupoVal.derive = function (level) {
    // a clock hand is not a fixed hook: the base model would hang it at the clock's centre, so it is left out of that
    const isClock = s => s.type === 'pupoGrab' && s.clock;
    const has = level.areas.some(a => a.spawns.some(isClock));
    const L = has ? Object.assign({}, level, { areas: level.areas.map(a => a.spawns.some(isClock) ? Object.assign({}, a, { spawns: a.spawns.filter(s => !isClock(s)) }) : a) }) : level;
    const D = d0.call(this, L), K = PupoReach.K;
    level.areas.forEach((a, ai) => {
      const c = D.areas[ai];
      let gr = null;
      const grilles = () => { if (!gr) { gr = []; for (const q of a.spawns) if (q.type === 'pupoGrille') { const tx = Math.floor(q.x / TS), ty1 = Math.floor(q.y / TS) - 1; gr.push({ x0: tx, y0: ty1 - (q.h || 1) + 1, x1: tx + (q.w || 1) - 1, y1: ty1 }); } } return gr; };
      const empty = (x, y) => x >= 0 && y >= 0 && x < a.W && y < a.H && a.tiles[y * a.W + x] === T.EMPTY;
      for (const s of a.spawns) {
        if (s.type === 'pupoClimb' && s.bend) {
          // the bend: from a riding spot on the stalk's upper part (its climb ghosts) to the landing spot
          const tx = Math.floor(s.x / TS), bot = Math.floor(s.y / TS) - 1, h = s.h || 4, to = s.bend.to || [8, 0];
          const dest = [tx + to[0], Math.floor(s.y / TS) + (to[1] || 0)], rTop = bot - h + 1, rMid = bot - Math.floor(h * (s.bend.at || 0.5));
          for (let r = rTop; r <= rMid; r++) c.edges.push({ from: [tx, r - 1], to: dest, area: ai });
        } else if (isClock(s)) {
          // the minute hand: hanging spots along its turn from rest to the top, each leading to the next
          const cl = s.clock, from = cl.from != null ? cl.from : 22, to = cl.to != null ? cl.to : 60, R = (cl.r || 3) * TS, ax = s.x, ay = s.y - TS / 2;
          let prev = null, first = true;
          const n = Math.max(2, Math.ceil((to - from) / 4));
          for (let i = 0; i <= n; i++) {
            const m = from + (to - from) * i / n, th = m / 60 * TAU, hx = ax + Math.sin(th) * R, hy = ay - Math.cos(th) * R;
            const gx = Math.floor(hx / TS), gy = Math.round((hy + K.HOOK_LEN + 29) / TS);
            if (!empty(gx, gy)) continue;
            c.ghosts.push([gx, gy]);
            if (first) { first = false; for (const q of this.reachCells(a, grilles(), hx, hy, K.REACH)) c.edges.push({ from: [q[0], q[1] - 1], to: [gx, gy], area: ai }); }
            if (prev) c.edges.push({ from: [prev[0], prev[1] - 1], to: [gx, gy], area: ai });
            prev = [gx, gy];
          }
        } else if (s.type === 'pupoFerry' && s.quay) {
          // the ferry: from any riding spot in reach of its handle (reel it in, step on, pull again) to its quay
          for (const h of a.spawns) if (h.type === 'pupoHandle' && h.g === s.g) for (const q of this.reachCells(a, grilles(), h.x, h.y - TS / 2 + 6, K.REACH)) c.edges.push({ from: [q[0], q[1] - 1], to: s.quay.slice(), area: ai });
        }
      }
    });
    return D;
  };
}

// probes (tools/sbw_items_test.js asks whether Brady touches the spot under a box): the plain search, then, for what it
// left unanswered, a riding search from every Nap Box it reached (a box past a Pupo obstacle is opened riding him)
if (typeof PupoVal !== 'undefined') PupoVal.probeRun = function (level, opts) {
  const boxes = this.boxes(level), bp = boxes.map(b => ({ ai: b.ai, x: (b.tx - 1) * TS, y: (b.ty - 1) * TS, w: 3 * TS, h: 3 * TS, hit: false }));
  const until = opts.untilProbes, r = Validator.run(level, Object.assign({}, opts, { probes: opts.probes.concat(bp), untilProbes: until ? () => until() && bp.every(q => q.hit) : null }));
  if (until ? until() : opts.probes.every(q => q.hit)) return r;
  const D = this.derive(level);
  for (let i = 0; i < boxes.length; i++) {
    if (!bp[i].hit) continue;
    const st = this.spotOf(level, boxes[i]); if (!st) continue;
    PupoRide.simRide = true;
    try { Validator.run(D, Object.assign({}, opts, { dim: this.DIM, start: st, earlyExit: false })); } finally { PupoRide.simRide = false; }
    if (until ? until() : opts.probes.every(q => q.hit)) break;
  }
  return r;
};

/* ---------- the camera under a high Pupo object (s.camTop: a px row kept s.camK (0.2) of the view below its top, clear of the HUD; s.camX px) ---------- */
if (typeof TourHooks !== 'undefined') TourHooks.on('camera', (play, dt) => {
  const p = play.player, A = play.area; if (!p || p.dead || !A) return;
  if (A.g4Cam === undefined) {
    A.g4Cam = null;
    for (const e of A.entities) if (e.s && e.s.camTop != null) (A.g4Cam || (A.g4Cam = [])).push(e);
  }
  const L = A.g4Cam; let ay = null, kk = 0.2;
  if (L) for (let i = 0; i < L.length; i++) { const e = L[i], s = e.s, x = s.x; if (Math.abs(p.cx - x) < (s.camX || 6 * TS) && p.y > s.camTop - 2 * TS && p.y < s.camTop + (s.camD || 12) * TS && (!s.camRide || p.pupoRide)) { ay = s.camTop; if (s.camK != null) kk = s.camK; break; } }
  if (ay == null) { play.g4CamLim = null; return; }
  const ty = clamp(ay - Game.viewH * kk, 0, Math.max(0, A.H * TS - Game.viewH));
  let lim = play.g4CamLim == null ? Math.max(play.camY, ty) : play.g4CamLim;
  lim += (ty - lim) * (1 - Math.exp(-dt * 5)); play.g4CamLim = lim;
  if (play.camY > lim) play.camY = lim;
});
try { window.BRADY_PUPO = Object.assign(window.BRADY_PUPO || {}, { PupoG4, PupoFerry, PupoGondola }); } catch (e) { /* not in a browser */ }
