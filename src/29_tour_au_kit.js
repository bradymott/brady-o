/* ============================================================
   AUSTRALIA: the moving parts, the pieces, the validator's models of them, and the boss.
   - POUCH (16-1): Brady rides in a kangaroo's pouch. Hold JUMP to wind up a hop (the kangaroo crouches, a ring fills
     over Brady's head), let go to leap: the longer the hold, the higher and further. No ordinary jump, no running:
     distance comes from the wind-up, not a run-up. Steering in the air is weak (the hop is committed).
     The physics is one step function shared by the game and the validator (playerPhysicsFlip is wrapped); the
     validator tries a spread of wind-ups from every standing spot, each one a hold the player can really do.
   - CONVOY (16-2): a road train at speed. A steady headwind blows Brady back down the trailers; LOW BRIDGES sweep
     the convoy from the front (a warning sign first, then crouch or be small); utes overtake beside the trailers
     and are the only way over the widest gaps. The wind is a zone (the validator searches with it).
   - SONAR (16-3): the creek at dusk. The platypus on Brady's hat sends a PING (the action button): a ring of light
     spreads out and shows the light-only logs, stones, snags and drifting rafts for two seconds.
   - WEB (16-4): the canopy's webs are trampolines (bounce surfaces) and ladders; every landing sends a tremor along
     the strand. A tremor that reaches the huntsman brings him scuttling over. Holding DOWN as you land clings
     quietly (no bounce, a small tremor).
   - GIANT (16-6): giant rolling fruit to ride across the gaps and giant fruit rolling down at you.
   - THE DROP BEAR (16-5): watch for the shadow.
   ============================================================ */
(function () {
const C = Tour.countries.au;
if (!C) return;
const { AuArt, INK, GUM } = Tour.auKit;
const P = (name, fn) => { Tour.pieces['au.' + name] = fn; };

/* ---------- plumbing: the area's own settings (area spec `au: {...}`) reach the built area and the validator ---------- */
{
  const gv0 = TourBuild.generateV2;
  TourBuild.generateV2 = function (Cc, spec, w, i, attempt) {
    const L = gv0.apply(this, arguments);
    if (Cc && Cc.id === 'au' && L && L.areas) spec.areas.forEach((A, k) => { if (A.au && L.areas[k]) L.areas[k].au = A.au; });
    return L;
  };
  const px0 = Validator.proxyArea;
  Validator.proxyArea = function (area, mask) { const A = px0.call(this, area, mask); if (area.au) A.au = area.au; return A; };
}

/* ================= POUCH: the kangaroo hop ================= */
const AuRoo = {
  WIND0: 0.06, WIND: 0.84,                // the wind-up: a tap is charge 0, full at 0.9 s
  V0: 13.5, V1: 9.5, H0: 4.5, H1: 9.5,    // take-off speed (tiles/s): up V0 + V1*c, along H0 + H1*c
  charge(T) { return clamp((T - this.WIND0) / this.WIND, 0, 1); },
  holdFor(c) { return this.WIND0 + this.WIND * c + 0.004; },
  on(area, p) { return !!(area && area.au && area.au.pouch) && !p.inWater; },
  step(p, inp, A, dt, plats, opts, base) {
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (p.rooC == null) { p.rooC = -1; p.rooAir = false; p.rooVx = 0; }
    if (p.rooAir) {
      // in a hop: committed. Holding back only lets the speed bleed away; holding on keeps it
      const hs = sign(p.rooVx), steer = hs === 0 ? dir : (dir === -hs ? 0 : hs);
      p.jumping = p.vy < 0;
      const ev = base(p, { left: steer < 0, right: steer > 0, jump: p.vy < 0, jumpPressed: false, down: false, action: false }, A, dt, plats, opts);
      if (hs) p.facing = hs;
      if (p.onGround) { p.rooAir = false; ev.rooLand = true; }
      return ev;
    }
    if (p.onGround && inp.jump && !inp.down) {
      // winding up: the kangaroo crouches and stops
      if (p.rooC < 0) p.rooC = 0;
      p.rooC += dt;
      if (dir) p.facing = dir;
      const f = p.facing, ev = base(p, { left: false, right: false, jump: false, jumpPressed: false, down: false, action: false }, A, dt, plats, opts);
      p.facing = f; ev.rooWind = this.charge(p.rooC);
      return ev;
    }
    if (p.rooC >= 0) {
      const c = this.charge(p.rooC); p.rooC = -1;
      if (p.onGround || p.coyote > 0) {
        p.vy = -(this.V0 + this.V1 * c) * TS; p.vx = dir * (this.H0 + this.H1 * c) * TS; p.rooVx = p.vx;
        p.airMax = Math.max(Math.abs(p.vx), 3 * TS); p.rooAir = true; p.onGround = false; p.coyote = 0; p.jumping = true; p.jumpBuf = 0; p.ride = null; p.runT = 0;
        if (dir) p.facing = dir;
        const ev = base(p, { left: dir < 0, right: dir > 0, jump: true, jumpPressed: false, down: false, action: false }, A, dt, plats, opts);
        ev.jump = true; ev.rooHop = c;
        return ev;
      }
    }
    // on foot (on paw): a lope at walking pace, never a run
    p.runT = 0;
    return base(p, { left: inp.left, right: inp.right, jump: false, jumpPressed: false, down: inp.down, action: false }, A, dt, plats, opts);
  },
  /* the validator's hops: every jump manoeuvre the search tries becomes a wind-up of its own length (a spread from a
     tap to a full hop, straight up too), simulated with the same step as the game */
  CH: { 0.1: [0, 0.15, 0.3], 0.22: [0.4, 0.5, 0.6], 2: [1, 0.8, 0.7] },
  chargeOf(m) {
    if (m.reverseAt) return 0.9;
    if (m.delay) return m.delay < 0.2 ? 0.25 : m.delay < 0.5 ? 0.65 : m.delay < 1 ? 0.55 : m.delay < 1.5 ? 0.85 : 0.95;
    if (m.stopAt) return 0.75;
    const row = this.CH[m.hold] || this.CH[2], k = !m.sp ? 0 : m.sp >= PHYS.run ? 2 : 1;
    return row[k];
  },
  sim(A, ai, tx, ty, m, D, markBox) {
    const b = { x: 0, y: ty * TS - D.h, w: D.w, h: D.h, vx: 0, vy: 0, onGround: true, coyote: PHYS.coyote, jumpBuf: 0, jumping: false, runT: 0, airMax: PHYS.walk, facing: m.dir || 1, crouch: false, inWater: false, stroke: 0, groundTile: T.GROUND, groundTx: tx, groundTy: ty, dropT: 0, rooC: -1, rooAir: false, rooVx: 0 };
    const cx = tx * TS + TS / 2;
    b.x = m.off ? (m.dir > 0 ? tx * TS + TS - b.w / 2 - 1 : tx * TS + b.w / 2 + 1) - b.w / 2 : cx - b.w / 2;
    const c = this.chargeOf(m), hold = this.holdFor(c), dt = STEP, inp = { left: false, right: false, jump: false, jumpPressed: false, down: false, action: false };
    let t = 0, air = false, tL = -1;
    while (t < hold + 3) {
      const winding = t < hold;
      let dir = m.dir;
      if (!winding && m.reverseAt && tL >= 0 && t - tL > 0.3) dir = -m.dir;
      inp.left = dir < 0; inp.right = dir > 0; inp.jump = winding;
      const wasAir = b.rooAir;
      playerPhysicsFlip(b, inp, A, dt, null, {});
      if (!wasAir && b.rooAir) tL = t;
      t += dt;
      markBox(ai, b);
      if (A.seams) { const s = TourSeams.hit(A, b, dir); if (s) return { seam: s }; }
      if (b.y > A.H * TS + 40 || b.y + b.h < -40) return null;
      if (lavaContact(b, A) || spikeContact(b, A)) return null;
      if (b.inWater) return null;
      if (!b.onGround) air = true;
      if (b.onGround && air) return [Math.floor((b.x + b.w / 2) / TS), b.groundTy, 0];
      if (!winding && !air && t > hold + 0.3) return [Math.floor((b.x + b.w / 2) / TS), b.groundTy, 0];
    }
    return null;
  }
};
{
  const ppf0 = playerPhysicsFlip;
  playerPhysicsFlip = function (p, inp, area, dt, platforms, opts) {
    if (area && area.au) {
      if (area.au.pouch && AuRoo.on(area, p)) return AuRoo.step(p, inp, area, dt, platforms, opts || {}, ppf0);
      if (area.au.web) return AuWeb.step(p, inp, area, dt, platforms, opts || {}, ppf0);
    }
    return ppf0(p, inp, area, dt, platforms, opts);
  };
  const sim0 = Validator.simulate;
  Validator.simulate = function (A, ai, tx, ty, m, D, markBox, jumpBoost, f) {
    if (A.au && A.au.pouch && m.jump && !m.spring && !A.water && !f) return AuRoo.sim(A, ai, tx, ty, m, D, markBox);
    return sim0.apply(this, arguments);
  };
}

/* ================= SONAR: the platypus ping ================= */
class AuPing extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.always = true; this.ox = s.x; this.oy = s.y; this.age = 0; this.R = s.R || 330; this.back = true; this.light = { x: this.ox, y: this.oy, r: 1, col: '#9affe8', a: 0.55 }; }
  get k() { const a = this.age; return a < 0.5 ? a / 0.5 : a < 2.4 ? 1 : Math.max(0, 1 - (a - 2.4) / 0.6); }
  update(dt) {
    this.age += dt; const A = this.g.area; this.x = 0; this.y = 0; this.w = A.W * TS; this.h = A.H * TS;
    const k = this.k; this.light.r = this.R * (this.age < 0.5 ? k : 1) * (this.age > 2.4 ? 0.6 + 0.4 * k : 1); this.light.a = 0.55 * (this.age > 2.4 ? k : 1);
    if (this.age > 3) this.remove = true;
  }
  touchPlayer() {}
  draw(ctx) {
    // the ring going out, then the faint shimmer while the light holds
    const a = this.age;
    ctx.save();
    if (a < 0.9) { const r = this.R * Math.min(1, a / 0.5) * (1 + (a > 0.5 ? (a - 0.5) * 0.3 : 0)); ctx.strokeStyle = `rgba(160,255,232,${(0.9 * (1 - a / 0.9)).toFixed(3)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(this.ox, this.oy, r, 0, TAU); ctx.stroke(); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(this.ox, this.oy, r * 0.8, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
}
const AuSonar = {
  COOL: 0.9,
  on(g) { const A = g && g.area; return !!(A && A.au && A.au.sonar); },
  // how lit a point is by the pings alive now (0..1): the drifting rafts and the snag tells use it
  litAt(g, x, y) {
    let k = 0;
    for (const e of g.entities) if (e instanceof AuPing && !e.remove) { const d = Math.hypot(e.ox - x, e.oy - y); k = Math.max(k, clamp((e.light.r * 0.95 - d) / 60, 0, 1) * Math.min(1, e.light.a / 0.4)); }
    return k;
  },
  ping(p) {
    const g = p.g;
    g.spawn(new AuPing(g, { x: p.cx, y: p.y + 10 }));
    TourKit.sfx('ping', 'select', { vol: 0.5, pitch: 2.2 }); p.auPingCd = this.COOL; p.auPingT = 0.35;
    g.auPings = (g.auPings || 0) + 1;
  }
};
/* the platypus on Brady's hat (sonar areas): drawn on his head; its bill glows on a ping */
const platypusHat = (ctx, p, t) => {
  const D = p.small ? 28 : 48, x = p.cx - p.facing * 2, y = p.y + p.h - D * ART_SCALE.brady - 2 + Math.sin(t * 3) * 0.8;
  ctx.save(); ctx.translate(x, y); ctx.scale(p.facing, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.ellipse(-2, 0, 10, 5.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-17, -2); ctx.lineTo(-17, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  const glow = p.auPingT > 0 ? 1 : 0;
  ctx.fillStyle = glow ? '#bafff0' : '#3a3a3a'; ctx.beginPath(); ctx.ellipse(11, 0, 6, 3, 0, 0, TAU); ctx.fill(); ctx.stroke();
  if (glow) { ctx.fillStyle = 'rgba(160,255,232,0.4)'; ctx.beginPath(); ctx.arc(11, 0, 10, 0, TAU); ctx.fill(); }
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(5, -2, 1.2, 0, TAU); ctx.fill();
  ctx.restore();
};

/* ================= WEB: trampolines, tremors and the huntsman ================= */
const AuWeb = {
  // the physics: bounce as the trampoline says, unless Brady holds DOWN as he lands (he clings, quietly)
  step(p, inp, A, dt, plats, opts, base) {
    const vy0 = p.vy, wasGround = p.onGround;
    const ev = base(p, inp, A, dt, plats, opts);
    if (!p.g) return ev;   // the validator's bodies never cling (they never hold DOWN)
    const k = A.auWebAt && A.auWebAt[(p.groundTy | 0) * A.W + (p.groundTx | 0)];
    if (ev.bounce && k && inp.down) { p.vy = 0; p.onGround = true; p.jumping = false; ev.bounce = false; ev.cling = true; }
    if (k && (ev.bounce || ev.cling || (ev.landed && !wasGround))) {
      const s = ev.cling ? (wasGround ? 0 : 0.22) : ev.bounce ? (inp.jump ? 1 : 0.8) : clamp(vy0 / (18 * TS), 0.2, 0.9);
      if (s > 0) AuWeb.tremor(p.g, k, p.cx, s);
    }
    return ev;
  },
  // a tremor runs both ways along its strand from x; strength s reaches s * REACH tiles
  REACH: 15, SPEED: 13,
  tremor(g, webId, x, s) {
    const W = (g.auWebs || {})[webId]; if (!W) return;
    W.waves.push({ x, s, t: 0 });
    for (const sp of W.spiders) sp.hear(x, s);
  }
};
class AuWebEnt extends Ent {
  // one web: tiles [x0..x1] on row y (their tops are the strand), anchored at both ends; drawn as a slung net
  constructor(g, s) {
    super(g, s, 4, 4); this.back = true; this.id = s.id; this.x0 = s.x0; this.x1 = s.x1; this.ty = s.ty; this.ladder = !!s.ladder; this.h0 = s.h || 0;
    this.x = s.x0 * TS; this.y = s.ty * TS - (this.ladder ? this.h0 * TS : 40); this.w = (s.x1 - s.x0 + 1) * TS; this.h = this.ladder ? (this.h0 + 1) * TS : 80;
    this.waves = []; this.spiders = [];
    (g.auWebs || (g.auWebs = {}))[this.id] = this;
  }
  update(dt) { this.t += dt; for (const w of this.waves) w.t += dt; this.waves = this.waves.filter(w => w.t * AuWeb.SPEED < w.s * AuWeb.REACH + 2); }
  touchPlayer() {}
  wobble(px) {
    let d = 0;
    for (const w of this.waves) { const front = w.t * AuWeb.SPEED * TS, dx = Math.abs(px - w.x), reach = w.s * AuWeb.REACH * TS; if (dx > reach) continue; const near = Math.abs(dx - front); if (near < 40) d += (1 - near / 40) * 7 * w.s * (1 - dx / reach); }
    return d;
  }
  draw(ctx) {
    const t = this.t;
    ctx.save(); ctx.lineCap = 'round';
    if (this.ladder) {
      // a hanging web ladder: two side strands and rungs at every one-way row
      const x0 = this.x + 6, x1 = this.x + this.w - 6, yTop = this.ty * TS - this.h0 * TS, yBot = this.ty * TS + 6;
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, yTop); ctx.lineTo(x0 + 3, yBot); ctx.moveTo(x1, yTop); ctx.lineTo(x1 - 3, yBot); ctx.stroke();
      ctx.lineWidth = 1.3; for (let y = yTop; y <= yBot; y += 16) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1) / 2, y + 5, x1, y); ctx.stroke(); }
      for (let y = this.ty * TS; y >= yTop; y -= 2 * TS) { ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x0, y + 1); ctx.lineTo(x1, y + 1); ctx.stroke(); }
      ctx.restore(); return;
    }
    const y = this.ty * TS + 2, xa = this.x - 4, xb = this.x + this.w + 4, n = Math.max(3, Math.round(this.w / 26));
    // the anchor threads up to the branches, the main strand (wobbling with tremors), the sagging net under it
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xa - 18, y - 70); ctx.moveTo(xb, y); ctx.lineTo(xb + 18, y - 70); ctx.stroke();
    const pts = []; for (let k = 0; k <= n; k++) { const px = xa + (xb - xa) * k / n; pts.push([px, y + this.wobble(px) * Math.sin(t * 30 + k)]); }
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
    for (let r = 1; r <= 3; r++) { ctx.beginPath(); for (let k = 0; k <= n; k++) { const sag = Math.sin(Math.PI * k / n) * 10 * r; const X = pts[k][0], Y = pts[k][1] + 8 * r + sag; k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.stroke(); }
    for (let k = 0; k <= n; k++) { ctx.beginPath(); ctx.moveTo(pts[k][0], pts[k][1]); ctx.lineTo(pts[k][0] + (k - n / 2) * 3, pts[k][1] + 30 + Math.sin(Math.PI * k / n) * 30); ctx.stroke(); }
    // the strand Brady stands on: thick and bright so it reads as ground, dew drops along it
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); pts.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
    ctx.strokeStyle = '#f4f8ff'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(200,240,255,0.9)'; for (let k = 1; k < n; k += 2) { ctx.beginPath(); ctx.arc(pts[k][0], pts[k][1] + 2, 1.8, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
// the huntsman: big, fuzzy, eight googly eyes, a striped jumper of a body. He sits at his end of the web; a tremor
// that reaches him makes him look up ('!' and WHO'S THAT?), then he scuttles along the strand to where it came from,
// looks about, and goes home. Bumping into him while he hunts hurts; a stomp on his back sends him home in a huff.
class AuHuntsman extends Ent {
  constructor(g, s) {
    super(g, s, 46, 22); this.webId = s.web; this.homeX = s.x - this.w / 2; this.ty = s.ty; this.y = s.ty * TS - this.h + 4; this.state = 'wait'; this.st = 0; this.tx = this.homeX; this.dir = s.dir || -1;
    this.reachMul = s.reach || 1;
    const W = (g.auWebs || {})[this.webId]; if (W) W.spiders.push(this); else this.lost = true;
  }
  hear(x, s) {
    if (this.state !== 'wait' && this.state !== 'home') return;
    const d = Math.abs(x - this.cx) / TS;
    if (d > s * AuWeb.REACH * this.reachMul) return;
    this.state = 'notice'; this.st = 0.8; this.tx = clamp(x - this.w / 2, this.minX(), this.maxX()); this.dir = sign(this.tx - this.x) || this.dir;
    this.g.parts.text(this.cx, this.y - 20, "WHO'S THAT?", '#ffe28a'); TourKit.sfx('huntsman', 'select', { vol: 0.4, pitch: 0.7 });
  }
  minX() { const W = this.g.auWebs && this.g.auWebs[this.webId]; return W ? W.x - 10 : this.homeX - 200; }
  maxX() { const W = this.g.auWebs && this.g.auWebs[this.webId]; return W ? W.x + W.w - this.w + 10 : this.homeX + 200; }
  update(dt) {
    this.t += dt;
    if (this.lost) { const W = (this.g.auWebs || {})[this.webId]; if (W) { W.spiders.push(this); this.lost = false; } }
    const p = this.g.player;
    if (this.state === 'notice') { this.st -= dt; if (this.st <= 0) { this.state = 'hunt'; this.st = 4; } }
    else if (this.state === 'hunt') {
      this.x = approach(this.x, this.tx, 6 * TS * dt); this.st -= dt;
      if (Math.abs(this.x - this.tx) < 2) { this.state = 'look'; this.st = 1.2; }
      if (this.st <= 0) this.state = 'home';
    } else if (this.state === 'look') { this.st -= dt; if (this.st <= 0) this.state = 'home'; }
    else if (this.state === 'home') { this.x = approach(this.x, this.homeX, 3 * TS * dt); this.dir = sign(this.homeX - this.x) || this.dir; if (Math.abs(this.x - this.homeX) < 1) this.state = 'wait'; }
    // a stomp on his back while he hunts: Brady bounces, the spider goes home in a huff
    if (p && !p.dead && (this.state === 'hunt' || this.state === 'look' || this.state === 'notice') && p.vy > 0 && p.prevBottom <= this.y + 8 && p.y + p.h >= this.y && p.x + p.w > this.x + 4 && p.x < this.x + this.w - 4) {
      p.vy = -PHYS.stompVHeld; p.jumping = true; p.y = this.y - p.h - 1; this.state = 'home'; this.g.parts.text(this.cx, this.y - 16, 'OI! RUDE!', '#ffffff'); Sound.play('stomp', { pitch: 1.4 });
    }
  }
  touchPlayer(p) { if (this.state === 'hunt' || this.state === 'look') p.hurt(this); }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t, moving = this.state === 'hunt' || this.state === 'home', alert = this.state !== 'wait';
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    // the thread he hangs his home from
    if (this.state === 'wait') { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -this.h); ctx.lineTo(0, -this.h - 60); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2; }
    // eight long, bendy, fuzzy legs
    ctx.strokeStyle = '#6a4a2e'; ctx.lineWidth = 3.4;
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
      const ph = moving ? Math.sin(t * 18 + k * 1.6 + (s > 0 ? 1 : 0)) * 4 : Math.sin(t * 2 + k) * 1;
      const kx = s * (12 + k * 4), ky = -22 - k * 2 + ph, fx = s * (22 + k * 5), fy = 0;
      ctx.beginPath(); ctx.moveTo(s * 6, -12); ctx.quadraticCurveTo(kx, ky, fx, fy); ctx.stroke();
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the body: a fuzzy round abdomen with stripes, a head with eight googly eyes
    ctx.fillStyle = '#8a6a48'; ctx.beginPath(); ctx.ellipse(-this.dir * 6, -12, 13, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#5a3e26'; ctx.lineWidth = 2; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(-this.dir * 6 + k * 5, -20); ctx.lineTo(-this.dir * 6 + k * 5, -4); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#a07a52'; ctx.beginPath(); ctx.ellipse(this.dir * 8, -12, 9, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
    const eye = (ex, ey, r) => { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex, ey, r, 0, TAU); ctx.fill(); ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + this.dir * r * 0.35, ey + (alert ? -r * 0.3 : r * 0.3), r * 0.45, 0, TAU); ctx.fill(); };
    const hx = this.dir * 10;
    eye(hx - 3, -16, alert ? 3.8 : 3); eye(hx + 4, -16, alert ? 3.8 : 3); eye(hx - 6, -10, 2); eye(hx + 7, -10, 2);
    eye(hx - 1, -21, 1.6); eye(hx + 3, -21, 1.6); eye(hx - 8, -15, 1.3); eye(hx + 10, -15, 1.3);
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(hx + 1, -6, 3, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
    if (this.state === 'notice') { ctx.save(); ctx.fillStyle = '#ffd84a'; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('!', this.cx, this.y - 30 + Math.sin(t * 20) * 2); ctx.restore(); }
  }
}

/* ================= CONVOY: the road, the headwind, the low bridges ================= */
// the road under the convoy and everything the convoy passes: the bitumen racing by, guide posts, the odd sign.
// It also runs the convoy's clock: gusts of headwind (the wind zone's strength swells for a moment, with dust
// streaks first) and LOW BRIDGES in the stretches the level marks (a warning, then the bridge sweeps past)
class AuRoad extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.back = true; this.always = true; this.roadY = s.road * TS; this.speed = (s.speed || 22) * TS; this.wind = s.wind || 1.8;
    this.spans = s.bridges || []; this.bridgeY = (s.bridgeY || 0) * TS; this.every = s.every || 5.5; this.clock = 1.5; this.bridge = null; this.warn = 0; this.gust = 0; this.gustT = 6;
  }
  zone() { const Z = this.g.area.zones; return Z && Z.find(z => z.kind === 'auWind'); }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    // off the back of a trailer onto the bitumen: the convoy is gone (a life)
    if (p && !p.dead && p.state === 'play' && p.y + p.h > this.roadY + 12) { g.parts.text(p.cx, this.roadY - 30, 'LEFT BEHIND!', '#ffffff'); p.die('pit'); }
    this.x = 0; this.y = 0; this.w = g.area.W * TS; this.h = g.area.H * TS;   // (the whole area: always in the active window)
    // gusts: 1 s of streaks, then 1.4 s of double wind
    const z = this.zone();
    this.gustT -= dt;
    if (this.gustT <= 0 && !this.gust) { this.gust = 2.4; this.gustT = 7 + Math.random() * 3; if (!this.toldGust) { this.toldGust = true; g.toast && g.toast('GUSTS! HOLD ON (KEEP PUSHING RIGHT)'); } }
    if (this.gust > 0) { this.gust -= dt; if (this.gust <= 0) this.gust = 0; }
    if (z) z.fx = -this.wind * TS * (this.gust > 0 && this.gust < 1.4 ? 2 : 1);
    // bridges: only in the marked stretches, on a clock
    const ptx = p ? p.cx / TS : 0, inSpan = this.spans.some(r => ptx >= r[0] && ptx <= r[1]);
    if (!this.bridge && inSpan) {
      this.clock -= dt;
      if (this.clock <= 0 && !this.warn) { this.warn = 1.6; TourKit.sfx('horn', 'bump', { vol: 0.5, pitch: 0.5 }); if (!this.toldBridge) { this.toldBridge = true; g.toast && g.toast('LOW BRIDGE! GET DOWN ON THE DECK (HOLD DOWN)'); } }
    }
    if (this.warn > 0) { this.warn -= dt; if (this.warn <= 0) { this.warn = 0; this.bridge = { x: g.camX + Game.viewW + 60, w: 3.5 * TS }; } }
    if (this.bridge) {
      const b = this.bridge; b.x -= this.speed * dt;
      if (p && !p.dead && p.x + p.w > b.x && p.x < b.x + b.w && p.y < this.bridgeY) p.hurt({ x: b.x, w: b.w, enemy: false });
      if (b.x + b.w < g.camX - 40) { this.bridge = null; this.clock = this.every; }
    } else if (!inSpan) this.clock = Math.min(this.clock, 1.5);
  }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, x0 = g.camX - 10, W = Game.viewW + 20, y = this.roadY, t = this.t, sc = (t * this.speed) % 128;
    ctx.save();
    // the bitumen and its lines, the red dirt shoulder, guide posts flashing past
    ctx.fillStyle = '#3a3a42'; ctx.fillRect(x0, y, W, Game.viewH + 400);
    ctx.fillStyle = '#c8683a'; ctx.fillRect(x0, y - 6, W, 6);
    ctx.fillStyle = '#4a4a54'; ctx.fillRect(x0, y, W, 4);
    ctx.fillStyle = '#f2ece0'; for (let x = x0 - sc; x < x0 + W; x += 128) ctx.fillRect(x, y + 40, 64, 6);
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(x0, y + 12, W, 3);
    for (let x = x0 - ((t * this.speed * 1.2) % 360); x < x0 + W; x += 360) { ctx.fillStyle = '#f2f2f2'; ctx.fillRect(x, y - 34, 5, 34); ctx.fillStyle = '#e8423a'; ctx.fillRect(x, y - 34, 5, 6); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(x, y - 34, 5, 34); }
    // speed lines and dust
    ctx.strokeStyle = 'rgba(255,240,220,0.5)'; ctx.lineWidth = 2;
    for (let k = 0; k < 8; k++) { const yy = y - 80 - ((k * 53) % 260), xx = x0 + W - ((t * this.speed * 1.6 + k * 197) % (W + 200)); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 50 + (k % 3) * 20, yy); ctx.stroke(); }
    // the gust's dust streaks (its tell)
    if (this.gust > 0) { ctx.strokeStyle = 'rgba(232,154,74,0.55)'; ctx.lineWidth = 3; for (let k = 0; k < 14; k++) { const yy = g.camY + 30 + ((k * 71) % (Game.viewH - 60)), xx = x0 + W - ((t * 900 + k * 233) % (W + 200)); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + 30, yy - 6, xx + 70, yy + 2); ctx.stroke(); } }
    ctx.restore();
  }
  // the bridge and its warning are drawn over everything (afterEntities)
  drawOver(ctx) {
    const g = this.g;
    if (this.warn > 0) {
      const x = g.camX + Game.viewW - 70, y = g.camY + (Game.cssH > Game.cssW ? 170 : 120), on = Math.sin(this.t * 16) > -0.2;
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = on ? '#ffd23a' : '#c8a020'; ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x + 30, y); ctx.lineTo(x, y + 30); ctx.lineTo(x - 30, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('LOW', x, y - 4); ctx.fillText('BRIDGE', x, y + 6);
      ctx.fillRect(x - 14, y + 12, 28, 3);
      // a line across the screen at the bridge's height: everything above it gets swept
      ctx.strokeStyle = 'rgba(255,210,58,0.7)'; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(g.camX, this.bridgeY); ctx.lineTo(g.camX + Game.viewW, this.bridgeY); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    const b = this.bridge; if (!b) return;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    const top = g.camY - 20;
    ctx.fillStyle = '#9a9aa4'; ctx.fillRect(b.x, top, b.w, this.bridgeY - top); ctx.strokeRect(b.x, top, b.w, this.bridgeY - top);
    ctx.fillStyle = '#b8b8c2'; ctx.fillRect(b.x + 4, top, 8, this.bridgeY - top);
    ctx.fillStyle = '#7a7a84'; ctx.fillRect(b.x, this.bridgeY - 14, b.w, 14); ctx.strokeRect(b.x, this.bridgeY - 14, b.w, 14);
    ctx.fillStyle = '#ffd23a'; for (let x = b.x; x < b.x + b.w; x += 20) { ctx.beginPath(); ctx.moveTo(x, this.bridgeY - 14); ctx.lineTo(x + 10, this.bridgeY - 14); ctx.lineTo(x, this.bridgeY); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#2a7a3a'; rr(ctx, b.x + 10, this.bridgeY - 56, b.w - 20, 30, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('CLEARANCE', b.x + b.w / 2, this.bridgeY - 44); ctx.fillText('4.3 m', b.x + b.w / 2, this.bridgeY - 33);
    ctx.restore();
  }
}
TourHooks.on('afterEntities', (play, ctx) => { if (play.area && play.area.au && play.area.au.convoy) for (const e of play.entities) if (e instanceof AuRoad && !e.remove) e.drawOver(ctx); });
// the wheels under a trailer, spinning (front layer: drawn over the road)
class AuWheels extends Ent {
  constructor(g, s) { super(g, s, (s.n || 3) * 34, 30); this.x = s.x - TS / 2; this.y = s.y - 30; this.n = s.n || 3; this.back = true; this.always = true; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    const t = this.t;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    for (let k = 0; k < this.n; k++) {
      const cx = this.x + 17 + k * 34, cy = this.y + 15;
      ctx.fillStyle = '#1e1e22'; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#6a6a70'; ctx.lineWidth = 2; for (let q = 0; q < 3; q++) { const a = -t * 22 + q * TAU / 3; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6); ctx.lineTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12); ctx.stroke(); }
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
    }
    ctx.fillStyle = '#2a2a2e'; ctx.fillRect(this.x + this.w - 4, this.y - 2, 4, 26);
    ctx.restore();
    // a little dust behind the last wheel
    if (Math.random() < 0.2) this.g.burst(this.x - 4, this.y + 26, 1, '#d8884a', 'dust');
  }
}

/* the creek's deep mud (16-3): a dark, slow surface across every open column from row y down; sinking into it is a
   life. (Drawn by an entity, not as liquid tiles, so it stays dark: lava-type tiles glow.) */
class AuMud extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.back = true; this.my = s.my;
    const A = g.area; this.spans = []; let x0 = -1;
    for (let x = 0; x <= A.W; x++) { const open = x < A.W && !SOLID[tileAt(A, x, this.my)] && !SOLID[tileAt(A, x, A.H - 1)]; if (open && x0 < 0) x0 = x; if (!open && x0 >= 0) { this.spans.push([x0, x - 1]); x0 = -1; } }
  }
  update(dt) {
    this.t += dt; const A = this.g.area, p = this.g.player; this.x = 0; this.y = 0; this.w = A.W * TS; this.h = A.H * TS;
    if (p && !p.dead && p.state === 'play' && p.y + p.h > this.my * TS + 18) { this.g.parts.text(p.cx, this.my * TS - 20, 'SPLOOSH!', '#c8d8a8'); this.g.burst(p.cx, this.my * TS, 10, '#5a5a32', 'dust'); p.die('pit'); }
  }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, y = this.my * TS, t = this.t, bot = g.area.H * TS + 60;
    ctx.save();
    for (const [a, b] of this.spans) {
      const x0 = a * TS, x1 = (b + 1) * TS; if (x1 < g.camX - 40 || x0 > g.camX + Game.viewW + 40) continue;
      ctx.fillStyle = '#2a2818'; ctx.fillRect(x0, y + 6, x1 - x0, bot - y);
      ctx.fillStyle = '#5a5430'; ctx.beginPath(); ctx.moveTo(x0, bot); ctx.lineTo(x0, y + 6);
      for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, y + 4 + Math.sin(t * 1.4 + x * 0.05) * 2);
      ctx.lineTo(x1, bot); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(220,230,160,0.8)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = x0; x <= x1; x += 8) { const yy = y + 4 + Math.sin(t * 1.4 + x * 0.05) * 2; x === x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke();
      ctx.fillStyle = 'rgba(140,150,90,0.5)'; for (let k = 0; k < (b - a + 1) / 3; k++) { const ph = (t * 0.4 + k * 0.37) % 1, bx = x0 + ((k * 53) % Math.max(8, x1 - x0)); ctx.beginPath(); ctx.arc(bx, y + 8 - ph * 4, 2.5 * (1 - ph) + 0.5, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }
}

/* ================= platforms: skins for moving platforms ================= */
const platforms = {
  // an overtaking ute: a flat tray (the platform), the cab in front, wheels down to the road
  auUte(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#2a6a9a'; ctx.fillRect(x + 4, y + 20, w + 36, 22); ctx.strokeRect(x + 4, y + 20, w + 36, 22);
    ctx.fillStyle = '#3a8ac8'; ctx.fillRect(x, y, w, 20); ctx.strokeRect(x, y, w, 20);
    ctx.fillStyle = '#5aaae8'; ctx.fillRect(x + 2, y + 2, w - 4, 4);
    ctx.fillStyle = '#3a8ac8'; ctx.beginPath(); ctx.moveTo(x + w, y + 40); ctx.lineTo(x + w, y - 26); ctx.lineTo(x + w + 26, y - 26); ctx.lineTo(x + w + 40, y); ctx.lineTo(x + w + 46, y + 40); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#bfe4ff'; ctx.beginPath(); ctx.moveTo(x + w + 6, y - 20); ctx.lineTo(x + w + 24, y - 20); ctx.lineTo(x + w + 34, y - 2); ctx.lineTo(x + w + 6, y - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    // a dog in the back, ears flapping (it loves this)
    const ear = Math.sin(t * 20) * 3;
    ctx.fillStyle = '#c8884a'; ctx.beginPath(); ctx.ellipse(x + w - 18, y - 8, 9, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - 22, y - 13); ctx.lineTo(x + w - 34, y - 16 + ear); ctx.lineTo(x + w - 24, y - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e85a8a'; ctx.beginPath(); ctx.ellipse(x + w - 10, y - 4, 3, 4, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + w - 14, y - 10, 1.4, 0, TAU); ctx.fill();
    for (const wx of [x + 18, x + w + 24]) { ctx.fillStyle = '#1e1e22'; ctx.beginPath(); ctx.arc(wx, y + 50, 14, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.arc(wx, y + 50, 5, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // a drifting log on the dark creek: only shows in a ping's light (and faintly in Brady's own glow)
  auRaft(ctx, e, t) {
    const g = e.g, lit = Math.max(AuSonar.litAt(g, e.cx, e.y), g.player ? clamp(1 - Math.hypot(g.player.cx - e.cx, g.player.cy - e.y) / 110, 0, 0.6) : 0);
    if (lit < 0.03) return;
    ctx.save(); ctx.globalAlpha = lit; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#7a5a3a'; rr(ctx, e.x, e.y, e.w, 14, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a07a50'; ctx.fillRect(e.x + 6, e.y + 3, e.w - 12, 3);
    ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.ellipse(e.x + e.w - 3, e.y + 7, 4, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(160,255,232,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(e.x - 6, e.y + 16); ctx.lineTo(e.x + e.w + 6, e.y + 16); ctx.stroke();
    ctx.restore();
  },
  // a giant rolling orange (16-6): it rolls as it moves; Brady rides on top
  auOrange(ctx, e, t) {
    const r = e.w / 2 + 6, cx = e.cx, cy = e.y + r, rot = (e.x - (e.hx || 0)) / r;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffc06a'; ctx.beginPath(); ctx.ellipse(cx - r * 0.35, cy - r * 0.4, r * 0.3, r * 0.18, -0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d8761a'; for (let k = 0; k < 9; k++) { const a = rot + k * 0.7; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, 2, 0, TAU); ctx.fill(); }
    const la = rot - Math.PI / 2; ctx.fillStyle = '#4aa83a'; ctx.beginPath(); ctx.ellipse(cx + Math.cos(la) * r * 0.9, cy + Math.sin(la) * r * 0.9, 8, 4, la, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
};
Object.assign(PlatformArt, platforms);

/* ================= GIANT: giant fruit rolling down the lay-by ================= */
// a stall of giant fruit that rolls one out every few seconds (a wobble and a TUMBLE! first): mangoes roll along the
// ground and drop off ledges; a stomp on one bounces Brady high. They break against a wall.
class AuFruit extends Ent {
  constructor(g, s) { super(g, s, 44, 44); this.dir = s.dir || -1; this.kind = s.kind || 0; this.enemy = true; this.vx = this.dir * (s.speed || 4.5) * TS; this.rot = 0; this.life = s.life || 12; }
  update(dt) {
    this.t += dt; this.life -= dt; this.rot += this.vx * dt / 22;
    this.vy += PHYS.gDown * 0.8 * dt; if (this.vy > PHYS.maxFall) this.vy = PHYS.maxFall;
    moveBody(this, this.g.area, dt, { semis: true });
    if (this.hitWall || this.life <= 0 || this.y > this.g.area.H * TS + 40) { this.remove = true; this.g.burst(this.cx, this.cy, 12, ['#ffb03a', '#ff5a3a', '#ffd84a'][this.kind % 3], 'confetti'); }
  }
  hit(kind, src) { if (kind === 'stomp' || kind === 'spin') { this.g.parts.text(this.cx, this.y - 6, 'BOING!', '#ffffff'); Sound.play('spring', { vol: 0.5 }); return 'bounce'; } return false; }
  touchPlayer(p) {
    if (p.vy > 0 && p.prevBottom <= this.y + 12) { p.vy = -PHYS.bounceHi * 0.95; p.jumping = true; p.y = this.y - p.h - 1; this.g.parts.text(this.cx, this.y - 6, 'BOING!', '#ffffff'); Sound.play('spring', { vol: 0.5, pitch: 1.2 }); return; }
    p.hurt(this);
  }
  draw(ctx) {
    const r = 22, cx = this.cx, cy = this.y + r, cols = [['#ffb03a', '#ffd86a'], ['#e8423a', '#ff8a7a'], ['#ffe04a', '#fff09a']], c = cols[this.kind % 3];
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(this.rot); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    if (this.kind % 3 === 2) { ctx.fillStyle = c[0]; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.85, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#c8a020'; ctx.lineWidth = 1.4; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 8 - 10, -r); ctx.lineTo(k * 8 + 10, r); ctx.stroke(); } }
    else { ctx.fillStyle = c[0]; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.9, 0.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = c[1]; ctx.beginPath(); ctx.ellipse(-6, -7, 7, 4, -0.5, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#4aa83a'; ctx.beginPath(); ctx.ellipse(0, -r, 6, 3, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    // its face (it is having a lovely time)
    ctx.save(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx - 6 * this.dir, cy - 3, 2, 0, TAU); ctx.arc(cx + 2 * this.dir, cy - 3, 2, 0, TAU); ctx.fill(); ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(cx - 2 * this.dir, cy + 3, 4, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.restore();
  }
}
class AuFruitStall extends Ent {
  // the giant fruit pile that rolls them out: { every, dir, speed }
  constructor(g, s) { super(g, s, 3 * TS, 3 * TS); this.every = s.every || 3.6; this.clock = s.delay || 1.5; this.dir = s.dir || -1; this.speed = s.speed || 4.5; this.back = true; this.always = true; this.n = 0; }
  update(dt) {
    this.t += dt; const p = this.g.player;
    if (!p || Math.abs(p.cx - this.cx) > 24 * TS) return;
    this.clock -= dt;
    if (this.clock <= 0) { this.clock = this.every; const f = new AuFruit(this.g, { x: this.cx + this.dir * 20, y: this.y + this.h - 4, dir: this.dir, speed: this.speed, kind: this.n++ }); this.g.spawn(f); this.g.parts.text(this.cx, this.y - 10, 'TUMBLE!', '#ffffff'); }
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y + this.h, wob = this.clock < 0.7 ? Math.sin(this.t * 40) * 2 : 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x, y - 30, this.w, 30); ctx.strokeRect(x, y - 30, this.w, 30);
    ctx.fillStyle = '#e8423a'; ctx.beginPath(); ctx.moveTo(x - 8, y - 70); ctx.lineTo(x + this.w + 8, y - 70); ctx.lineTo(x + this.w, y - 86); ctx.lineTo(x, y - 86); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) ctx.fillRect(x + 4 + k * 24, y - 84, 10, 12);
    const cols = ['#ffb03a', '#e8423a', '#ffe04a'];
    for (let k = 0; k < 3; k++) { ctx.fillStyle = cols[k]; ctx.beginPath(); ctx.arc(x + 16 + k * 32 + (k === 1 ? wob : 0), y - 44, 15, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = INK; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('GIANT FRUIT', x + this.w / 2, y - 12);
    ctx.restore();
  }
}

/* ================= the player wrappers: the kangaroo, the ping, the platypus ================= */
{
  const PU = Player.prototype, up0 = PU.update, dr0 = PU.draw;
  PU.update = function (dt, inp) {
    const g = this.g, A = g && g.area;
    if (A && A.au && A.au.sonar) {
      if (this.auPingCd > 0) this.auPingCd -= dt;
      if (this.auPingT > 0) this.auPingT -= dt;
      if (inp && inp.actionPressed && this.state === 'play' && !this.dead && !(this.auPingCd > 0)) { AuSonar.ping(this); inp = Object.assign({}, inp, { actionPressed: false }); }
    }
    const r = up0.call(this, dt, inp);
    if (A && A.au && A.au.pouch && !this.dead && this.state === 'play') {
      // dust and a THUMP on a big landing, a puff on take-off
      if (this.rooAir && !this.auWasAir) { g.burst(this.cx, this.y + this.h, 6, '#e8a87a', 'dust'); this.auHopN = (this.auHopN || 0) + 1; }
      if (!this.rooAir && this.auWasAir) { g.burst(this.cx, this.y + this.h, 8, '#e8a87a', 'dust'); this.rooSquash = 0.25; }
      this.auWasAir = !!this.rooAir;
      if (this.rooSquash > 0) this.rooSquash -= dt;
    }
    return r;
  };
  PU.draw = function (ctx, t) {
    const A = this.g && this.g.area;
    if (A && A.au && A.au.pouch && !this.dead && this.state !== 'portal' && !this.inWater && this.state !== 'clear') {
      const k = this.rooC >= 0 ? AuRoo.charge(this.rooC) : (this.rooSquash > 0 ? this.rooSquash * 2 : 0), air = !this.onGround, s = this.small ? 1 : 1.3;
      const fx = this.cx - this.facing * 3, fy = this.y + this.h;
      if (!(this.invuln > 0 && Math.floor(this.invuln * 16) % 2 === 0)) Ink.around(ctx, fx - 70, fy - 110, 140, 116, c => AuArt.roo(c, fx, fy, this.facing, k, air, t, false, s), { pad: 0, width: 1.0 });
      const lift = Math.round((this.small ? 20 : 27) + k * 8);
      this.y -= lift; dr0.call(this, ctx, t); this.y += lift;
      if (!(this.invuln > 0 && Math.floor(this.invuln * 16) % 2 === 0)) AuArt.roo(ctx, fx, fy, this.facing, k, air, t, true, s);
      // the wind-up ring over his head
      if (this.rooC >= 0) {
        const c = AuRoo.charge(this.rooC), rx = this.cx, ry = this.y - lift - (this.small ? 22 : 34), full = c >= 1;
        ctx.save(); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(30,20,16,0.55)'; ctx.beginPath(); ctx.arc(rx, ry, 11, 0, TAU); ctx.stroke();
        ctx.strokeStyle = full ? (Math.sin(t * 30) > 0 ? '#ffffff' : '#ff5a2a') : c > 0.66 ? '#ff8a2a' : c > 0.33 ? '#ffc83a' : '#9ae06a';
        ctx.beginPath(); ctx.arc(rx, ry, 11, -Math.PI / 2, -Math.PI / 2 + TAU * Math.max(0.02, c)); ctx.stroke();
        if (full) { ctx.fillStyle = '#ffffff'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('MAX!', rx, ry - 16); }
        ctx.restore();
      }
      return;
    }
    dr0.call(this, ctx, t);
    if (A && A.au && A.au.sonar && !this.dead && this.state !== 'portal' && !(this.invuln > 0 && Math.floor(this.invuln * 16) % 2 === 0)) platypusHat(ctx, this, t);
  };
}
// the kangaroo drawing takes a size (the ride is bigger under big Brady)
{
  const roo0 = AuArt.roo;
  AuArt.roo = function (ctx, x, y, f, k, air, t, front, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s || 1, s || 1); roo0(ctx, 0, 0, f, k, air, t, front); ctx.restore(); };
}

/* ================= pieces (stamp legend ['piece', name, opts]; st.x / st.gy = the letter's column / the row under it) ================= */
// an item block at the letter
P('box', (st, o) => { st.B.set(st.x, st.gy - 1, o.hidden ? T.HIDDEN : T.QBLOCK); st.B.item(st.x, st.gy - 1, o.item || 'power'); return st.x; });
// a web trampoline: w tiles from the letter (its row is the strand); { w, spider: 'left'|'right'|null, id, reach }
let webN = 0;
P('web', (st, o) => {
  const B = st.B, y = st.gy - 1, x0 = st.x, w = o.w || 6, id = o.id || ('w' + (++webN));
  for (let k = 0; k < w; k++) { B.set(x0 + k, y, T.SEMI); B.setSurf(x0 + k, y, SURF.BOUNCE); B.setHide(x0 + k, y, 1); }
  B.spawn('auWeb', x0, y - 1, { id, x0, x1: x0 + w - 1, ty: y });
  (B.auWebs || (B.auWebs = [])).push({ id, x0, x1: x0 + w - 1, y });
  for (const side of o.spider === 'both' ? ['left', 'right'] : o.spider ? [o.spider] : []) { const sx = side === 'left' ? x0 : x0 + w - 1; B.spawn('auHuntsman', sx, y - 1, { web: id, ty: y, dir: side === 'left' ? 1 : -1, reach: o.reach || 1 }); }
  return st.x;
});
// a web ladder: one-way strands every 2 rows, h rows up from the letter's row, w wide (quiet: no spider listens)
P('webLadder', (st, o) => {
  const B = st.B, y = st.gy - 1, x0 = st.x, w = o.w || 2, h = o.h || 6, id = 'l' + (++webN);
  for (let yy = y; yy >= y - h; yy -= 2) for (let k = 0; k < w; k++) { B.set(x0 + k, yy, T.SEMI); B.setHide(x0 + k, yy, 1); }
  B.spawn('auWeb', x0, y - 1, { id, x0, x1: x0 + w - 1, ty: y, ladder: true, h });
  return st.x;
});
// an overtaking ute: a moving platform beside the trailers { ax (tiles), w, speed, phase }
P('ute', (st, o) => {
  const B = st.B, x = st.x, y = st.gy - 1, ax = o.ax || 8, pw = o.w || 4;
  B.spawn('mplat', x, y - 1, { pw, ax: ax * TS, ay: 0, speed: o.speed || 1.6, skin: 'auUte', phase: o.phase || 0 });
  for (let q = 0; q <= ax; q++) for (let k = 0; k < pw; k++) B.ghosts.push([x + q + k, y]);
  return st.x;
});
// a drifting log on the creek (only seen by ping light) { ax, w, speed }
P('raft', (st, o) => {
  const B = st.B, x = st.x, y = st.gy - 1, ax = o.ax || 6, pw = o.w || 3;
  B.spawn('mplat', x, y - 1, { pw, ax: ax * TS, ay: 0, speed: o.speed || 1.1, skin: 'auRaft', phase: o.phase || 0 });
  for (let q = 0; q <= ax; q++) for (let k = 0; k < pw; k++) B.ghosts.push([x + q + k, y]);
  return st.x;
});
// a giant orange rolling back and forth across a gap { ax, w, speed }
P('orange', (st, o) => {
  const B = st.B, x = st.x, y = st.gy - 1, ax = o.ax || 8, pw = o.w || 3;
  B.spawn('mplat', x, y - 1, { pw, ax: ax * TS, ay: 0, speed: o.speed || 1.5, skin: 'auOrange', phase: o.phase || 0 });
  for (let q = 0; q <= ax; q++) for (let k = 0; k < pw; k++) B.ghosts.push([x + q + k, y]);
  return st.x;
});
// the convoy's controller and the wind zone { road (row), wind, bridges: [[x0, x1]], bridgeY (row), every }
P('convoy', (st, o) => {
  const B = st.B;
  B.zone(0, 0, B.W, B.H, -(o.wind || 1.8) * TS, 0, 0, 'auWind');
  B.spawn('auRoad', st.x, st.gy - 1, { road: o.road, wind: o.wind || 1.8, bridges: o.bridges || [], bridgeY: o.bridgeY, every: o.every || 5.5, speed: o.speed || 22 });
  return st.x;
});
P('mud', (st, o) => { st.B.spawn('auMud', st.x, st.gy - 1, { my: o.y }); return st.x; });
P('wheels', (st, o) => { st.B.spawn('auWheels', st.x, st.gy - 1, { n: o.n || 3 }); return st.x; });
P('stall', (st, o) => { st.B.spawn('auFruitStall', st.x + 1, st.gy - 1, { every: o.every, dir: o.dir || -1, speed: o.speed, delay: o.delay }); return st.x; });

/* the web map (tile -> web id) on the built area, for the physics and the tremors */
{
  const gv1 = TourBuild.generateV2;
  TourBuild.generateV2 = function (Cc, spec, w, i, attempt) {
    const L = gv1.apply(this, arguments);
    if (Cc && Cc.id === 'au' && L && L.areas) for (const a of L.areas) {
      const webs = a.spawns.filter(s => s.type === 'auWeb' && !s.ladder);
      if (!webs.length) continue;
      a.auWebAt = {}; for (const s of webs) for (let x = s.x0; x <= s.x1; x++) a.auWebAt[s.ty * a.W + x] = s.id;
    }
    return L;
  };
}

/* ================= THE DROP BEAR (16-5) =================
   The tall tale, real after all: a big grey koala-ish bear with a gumleaf behind his ear and a cheeky overbite. He
   lurks up in the gum tree's crown (out of reach, a pair of eyes in the leaves). His SHADOW on the ground is the tell:
   it follows Brady, then stops and darkens for a moment, and then he DROPS. If he lands on Brady it hurts; if he
   misses, he lands flat on his tum, winded (stomp him!), then scrambles back up the trunk.
   Phase 2 (4 hp left): after he lands he curls up and BOUNCES at Brady twice, and gumnuts rain in the lurk (each
   with its own little shadow). Phase 3 (2 hp left): DOUBLE DROP: two drops in a row, the second shadow right after
   the first. Six stomps in all. */
const BEAR = { lurkY: 7.2, dropV: 22 };
const bearSays = ['G\'DAY, SNACK!', 'NOTHIN\' UP HERE, MATE...', 'WHO\'S A TOURIST, THEN?', 'HEHEHE...'];
const bearBrain = {
  phases: [4, 2],
  guardText: 'TOO HIGH!',
  skyY(b) { return b.floorY - BEAR.lurkY * TS - b.h; },
  wake(b) { b.phase = 1; b.drops = 0; K.say(b.g, b, 'DROP BEARS AREN\'T REAL, EH? ...SURPRISE!', '#ffffff'); },
  hit(b, kind) {
    if (kind === 'stomp' || kind === 'spin') { if (b.vuln) { b.damage(1, { text: 'OOF!', col: '#ffd84a' }); return true; } return 'bounce'; }
    return undefined;
  },
  phase(b, n) {
    const g = b.g;
    if (n === 2) { g.bannerText = 'BOUNCY BEAR!'; g.bannerT = 2.2; K.say(g, b, 'RIGHT. NOW I\'M CROSS.', '#ffffff'); }
    if (n === 3) { g.bannerText = 'DOUBLE DROP!'; g.bannerT = 2.2; K.say(g, b, 'TWO DROPS! NO WAITING!', '#ffffff'); }
    b.go('climb');
  },
  hurt(b) { K.say(b.g, b, pick(['STRUTH!', 'ME TUM!', 'NOT THE FUR!']), '#ffffff'); b.go('climb'); },
  touch(b, p) { if (b.act === 'lurk' || b.act === 'aim') return true; return false; },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1, sky = this.skyY(b);
    b.guard = 'bounce';
    if (b.act === 'walk') { b.go('climb'); }
    if (b.act === 'climb') {
      // scramble back up into the crown (at the nearer side, then along the branches)
      b.pose = 'climb'; b.vuln = false;
      b.y = approach(b.y, sky, 11 * TS * dt);
      if (b.y <= sky + 1) b.go('lurk');
    } else if (b.act === 'lurk') {
      // up in the leaves, following Brady; gumnuts in phase 2+
      b.pose = 'lurk'; b.y = sky; b.face();
      const tx = p ? p.cx : (b.arenaX0 + b.arenaX1) / 2;
      b.x = approach(b.x, clamp(tx - b.w / 2, b.arenaX0, b.arenaX1 - b.w), (3 + ph) * TS * dt);
      if (b.first) { b.nut = 0.8; if (Math.random() < 0.5) K.say(g, b, pick(bearSays), '#ffffff'); }
      if (ph >= 2) { b.nut -= dt; if (b.nut <= 0) { b.nut = 1.1; AuBoss.nut(g, clamp((p ? p.cx : b.cx) + (Math.random() - 0.5) * 6 * TS, b.arenaX0 + TS, b.arenaX1 - TS), sky + b.h, b.floorY); } }
      if (b.at > (ph >= 3 ? 1.2 : 1.8)) b.go('aim');
    } else if (b.act === 'aim') {
      // the tell: the shadow stops and darkens; leaves shake; he grins
      b.pose = 'aim'; b.y = sky + Math.sin(b.at * 40) * 2;
      if (b.first) { TourKit.sfx('rustle', 'bump', { vol: 0.4, pitch: 0.6 }); }
      if (b.at > 0.85) { b.go('drop'); b.vy = 6 * TS; }
    } else if (b.act === 'drop') {
      b.pose = 'drop'; b.vy = Math.min(b.vy + PHYS.gDown * dt, BEAR.dropV * TS); b.y += b.vy * dt;
      if (b.y + b.h >= b.floorY) {
        b.y = b.floorY - b.h; b.vy = 0; g.shake(9); Sound.play('stomp', { pitch: 0.5 }); g.burst(b.cx, b.floorY, 16, '#c8a070', 'dust');
        b.drops++;
        if (ph >= 3 && !b.second) { b.second = true; b.go('hop'); }
        else if (ph >= 2) { b.second = false; b.go('bounce'); b.bn = 0; }
        else { b.go('winded'); b.vuln = true; }
      }
    } else if (b.act === 'hop') {
      // phase 3: straight back up for the second drop
      b.pose = 'climb'; b.y = approach(b.y, sky, 16 * TS * dt);
      if (b.y <= sky + 1) { b.go('aim'); b.at = 0.35; }
    } else if (b.act === 'bounce') {
      // phase 2+: curled up, two bounces at Brady, then winded
      b.pose = 'ball';
      if (b.first) { b.face(); b.vy = -12 * TS; b.vx = b.dir * 5 * TS; b.bn = (b.bn || 0); K.say(g, b, 'BOING! BOING!', '#ffffff'); }
      b.vy += PHYS.gDown * 0.7 * dt; b.y += b.vy * dt; b.x += b.vx * dt;
      if (b.x <= b.arenaX0 || b.x + b.w >= b.arenaX1) b.vx = -b.vx;
      if (b.y + b.h >= b.floorY && b.vy > 0) { b.y = b.floorY - b.h; b.bn++; g.shake(4); if (b.bn >= 2) { b.go('winded'); b.vuln = true; } else { b.face(); b.vy = -12 * TS; b.vx = b.dir * 5 * TS; } }
    } else if (b.act === 'winded') {
      b.pose = 'winded'; b.vuln = true; b.vx = 0;
      if (b.first) K.say(g, b, pick(['OOF... WINDED...', 'THE GROUND MOVED!', 'WHO PUT THAT THERE?']), '#ffe28a');
      if (b.at > (ph >= 3 ? 1.8 : 2.4)) b.go('climb');
    } else b.go('climb');
    b.clampArena();
  },
  draw(b, ctx, t) {
    const P = b.pose, x = b.cx, y = b.y + b.h;
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
    if (P === 'lurk' || P === 'aim') {
      // in the crown: just the eyes and ears peeping out of a clump of leaves
      ctx.fillStyle = '#3a5a3a'; for (const [dx, dy, r] of [[-30, -30, 26], [26, -34, 28], [0, -48, 26], [-8, -16, 22], [18, -12, 20]]) { ctx.beginPath(); ctx.arc(dx + (P === 'aim' ? Math.sin(t * 50 + dx) * 2 : 0), dy, r, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#8a8a96'; ctx.beginPath(); ctx.arc(-18, -44, 10, 0, TAU); ctx.arc(18, -44, 10, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(-8, -30, 6, 7, 0, 0, TAU); ctx.ellipse(8, -30, 6, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; const lx = b.g.player ? sign(b.g.player.cx - b.cx) * 2 : 0, ly = 2; ctx.beginPath(); ctx.arc(-8 + lx, -30 + ly, 2.6, 0, TAU); ctx.arc(8 + lx, -30 + ly, 2.6, 0, TAU); ctx.fill();
      if (P === 'aim') { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-8, -18); ctx.lineTo(8, -18); ctx.lineTo(0, -14); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.restore(); return;
    }
    if (P === 'ball') { ctx.rotate(t * 12 * (b.vx >= 0 ? 1 : -1)); ctx.fillStyle = '#9a9aa6'; ctx.beginPath(); ctx.arc(0, -b.h / 2, b.h / 2, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8c8d2'; ctx.beginPath(); ctx.arc(-6, -b.h / 2 - 8, 10, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(10, -b.h / 2, 6, 4, 0, 0, TAU); ctx.fill(); ctx.restore(); return; }
    const flat = P === 'winded', s = flat ? 0.75 : 1, d = b.dir;
    ctx.scale(d, s);
    // the body: a big grey bear-shaped koala, white chest, claws (cartoon), a gumleaf behind his ear
    const arms = P === 'drop' ? -1 : P === 'climb' ? Math.sin(t * 14) : 0.3;
    ctx.fillStyle = '#9a9aa6';
    ctx.beginPath(); ctx.ellipse(-26, -40 - arms * 16, 9, 18, -0.6 - arms * 0.5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -30, 30, 30, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2f0ea'; ctx.beginPath(); ctx.ellipse(4, -24, 16, 20, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#9a9aa6'; ctx.beginPath(); ctx.ellipse(26, -40 - arms * 16, 9, 18, 0.6 + arms * 0.5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2f0ea'; for (const cx of [-30, 30]) for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(cx + k * 4, -52 - arms * 22); ctx.lineTo(cx + k * 4, -58 - arms * 22); ctx.stroke(); }
    // the head: big fluffy ears, the big black nose, a cheeky overbite
    const hy = -70;
    ctx.fillStyle = '#9a9aa6'; ctx.beginPath(); ctx.arc(-24, hy - 10, 14, 0, TAU); ctx.arc(24, hy - 10, 14, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2f0ea'; ctx.beginPath(); ctx.arc(-24, hy - 10, 8, 0, TAU); ctx.arc(24, hy - 10, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = '#9a9aa6'; ctx.beginPath(); ctx.ellipse(0, hy, 26, 22, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a3a42'; ctx.beginPath(); ctx.ellipse(6, hy + 4, 9, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, hy + 16, 5, 6); ctx.fillRect(7, hy + 16, 5, 6); ctx.strokeRect(0, hy + 16, 5, 6); ctx.strokeRect(7, hy + 16, 5, 6);
    if (flat) { ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, hy - 6); ctx.lineTo(-6, hy); ctx.moveTo(-6, hy - 6); ctx.lineTo(-14, hy); ctx.moveTo(14, hy - 6); ctx.lineTo(22, hy); ctx.moveTo(22, hy - 6); ctx.lineTo(14, hy); ctx.stroke(); }
    else { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-9, hy - 6, 3, 0, TAU); ctx.arc(17, hy - 6, 3, 0, TAU); ctx.fill(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-15, hy - 14); ctx.lineTo(-4, hy - 11); ctx.moveTo(23, hy - 14); ctx.lineTo(12, hy - 11); ctx.stroke(); }
    ctx.lineWidth = 1.6; ctx.fillStyle = GUM; ctx.save(); ctx.translate(-30, hy - 20); ctx.rotate(-0.8); ctx.beginPath(); ctx.ellipse(0, -8, 4, 10, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    // feet
    ctx.lineWidth = 2.4; ctx.fillStyle = '#7a7a86'; ctx.beginPath(); ctx.ellipse(-14, -3, 12, 5, 0, 0, TAU); ctx.ellipse(16, -3, 12, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (P === 'winded') K.dizzy(ctx, b.cx, b.y - 30, t);
  }
};
const K = TourKit;
// his shadow and the gumnut shadows are drawn on the floor under everything (afterEntities draws over the actors,
// so the shadow is an entity in the back layer instead): AuShadow follows the bear
class AuShadow extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.back = true; }
  update(dt) { this.t += dt; const A = this.g.area; this.x = 0; this.y = 0; this.w = A.W * TS; this.h = A.H * TS; this.b = this.g.entities.find(e => e.boss && e.style === 'au_dropbear' && !e.remove); }
  touchPlayer() {}
  draw(ctx) {
    const b = this.b; if (!b || b.state === 'dying' || b.state === 'sleep') return;
    const up = (b.floorY - (b.y + b.h)) / TS; if (up < 0.4 && b.act !== 'drop') return;
    const aim = b.act === 'aim', drop = b.act === 'drop', k = aim ? 0.55 + 0.35 * Math.min(1, b.at / 0.85) : drop ? 0.9 : 0.32;
    const r = b.w * (aim || drop ? 0.9 : 0.75) * (drop ? 0.7 + 0.3 * clamp(1 - up / 8, 0, 1) : 1);
    ctx.save(); ctx.fillStyle = `rgba(10,6,20,${k.toFixed(3)})`; ctx.beginPath(); ctx.ellipse(b.cx, b.floorY - 2, r, 9, 0, 0, TAU); ctx.fill();
    if (aim) { ctx.strokeStyle = `rgba(255,90,60,${(0.5 + 0.5 * Math.sin(b.at * 30)).toFixed(3)})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(b.cx, b.floorY - 2, r + 4, 11, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
}
const AuBoss = {
  // a gumnut dropped from the crown: its little shadow first (0.6 s), then it falls
  nut(g, x, y0, floorY) {
    const s = tourFire(g, x, y0, { vx: 0, vy: 0, grav: 0, w: 14, h: 14, life: 3, col: '#8a6a3a', art: (c, sh) => { AuArt.gumnut(c, sh.x + sh.w / 2, sh.y + sh.h / 2, 6); } });
    s.auNut = { wait: 0.7, floorY }; s.vy = 0;
    return s;
  }
};
// the gumnuts' wait-then-fall, and their shadows
TourHooks.on('playUpdate', (play, dt) => {
  if (!play.boss || play.boss.style !== 'au_dropbear') return;
  for (const e of play.entities) if (e.auNut && !e.remove) { const n = e.auNut; if (n.wait > 0) { n.wait -= dt; e.vy = 0; e.y = e.y; if (n.wait <= 0) e.vy = 4 * TS; } else e.vy += PHYS.gDown * 0.6 * dt; if (e.y > n.floorY) e.remove = true; }
});
TourHooks.on('afterEntities', (play, ctx) => {
  if (!play.boss || play.boss.style !== 'au_dropbear') return;
  for (const e of play.entities) if (e.auNut && !e.remove) { const n = e.auNut, k = n.wait > 0 ? 0.6 - n.wait * 0.4 : 0.6; ctx.save(); ctx.fillStyle = `rgba(10,6,20,${clamp(k, 0.15, 0.6).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(e.x + e.w / 2, n.floorY - 2, 10, 4, 0, 0, TAU); ctx.fill(); ctx.restore(); }
});
const boss = { id: 'au_dropbear', name: 'The Drop Bear', hp: 6, dims: [64, 64], floats: true, music: 'tour_au_boss', country: 'au', brain: bearBrain };
Tour.boss(boss);
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.au_dropbear = [44, 44, 70, 12];
// the arena: a clearing under the gum tree's crown; two low limbs to stand on at the sides, the trunk behind
P('arena_gum', (st, o) => {
  const B = st.B, { x0, w, GY } = o;
  for (let q = 0; q < 4; q++) { B.set(x0 + 2 + q, GY - 3, T.SEMI); B.set(x0 + w - 6 + q, GY - 3, T.SEMI); }
  B.spawn('auShadow', x0 + 2, GY - 1, {});
  B.decorAt('auGum', x0 + 1, GY, 1); B.decorAt('auGum', x0 + w - 2, GY, 2);
  B.decorAt('auGumLeaves', x0 + Math.floor(w / 2), GY, 3);
});

/* a sheep peering through the slats of its van (the sheep van's tell, and its insides) */
Object.assign(Decor, {
  auSheep(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x - 20, y - 44, 40, 44); ctx.strokeRect(x - 20, y - 44, 40, 44);
    ctx.fillStyle = '#f4f0e6'; for (const [dx, dy] of [[-8, -30], [0, -34], [8, -30], [-4, -24], [6, -22]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 8, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#2a2a2e'; ctx.beginPath(); ctx.ellipse(x + 2, y - 24, 6, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y - 26, 1.6, 0, TAU); ctx.arc(x + 5, y - 26, 1.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a4a2a'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 20, y - 40 + k * 11, 40, 3);
    if (Math.sin(t * 1.3 + x) > 0.6) { ctx.fillStyle = '#ffffff'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('BAA?', x, y - 52); }
    ctx.restore();
  }
});

/* ================= registration ================= */
Object.assign(ENTITY_TYPES, { auPing: AuPing, auWeb: AuWebEnt, auHuntsman: AuHuntsman, auRoad: AuRoad, auWheels: AuWheels, auFruit: AuFruit, auFruitStall: AuFruitStall, auShadow: AuShadow, auMud: AuMud });
Object.assign(TourLandscape.ARCH_LABEL, { pouch: 'POUCH', convoy: 'CONVOY', sonar: 'SONAR', web: 'WEB', giant: 'GIANT' });
Tour.auKit.AuRoo = AuRoo; Tour.auKit.AuSonar = AuSonar; Tour.auKit.AuWeb = AuWeb; Tour.auKit.bearBrain = bearBrain; Tour.auKit.BEAR = BEAR;
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.auKit = Tour.auKit; } } catch (e) { /* not in a browser */ }
})();
