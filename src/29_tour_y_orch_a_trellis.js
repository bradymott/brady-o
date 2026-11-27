/* ============================================================
   THE ORCHARD AFTER CLOSING: the espalier trellis (28-1 ELBOWS ON THE TRELLIS, arch 'espalier').
   A trellis is a big ivory lattice on stakes with a pear tree trained flat along it. It has two faces: the near one
   (Brady climbs in front of it, the slats behind his knuckles) and the far one (Brady behind it, the slats in front
   of him).
     - PUSH UP into a trellis to grip it (from the ground or in the air). The stick climbs in all four directions.
     - JUMP at a COLLAR (a stake with a big rust tie round it, marked and glowing when in reach) slips behind the
       stake to the other face.
     - JUMP anywhere else lets go with a real jump (hold DOWN as you press JUMP to just drop).
     - Pear Flies and Tie Worms crawl on one face. Only a critter on Brady's face can touch him: climb round it, or slip
       behind a stake and pass it on the other face. A critter on the far face shows as one broad hatched shape.
     - A BRANCH FORK at a trellis's edge hangs down over the gap. Hold the stick against it (toward the gap) and it
       bends up level: a new path across to the next trellis. A LATE fork springs back the moment you let it go,
       unless you bend it from the FAR face, where its tie hooks it in place (the tie is drawn round the back).
   The game and the level checker: the checker sees all of an area's trellises as one grid of spots joined to their
   four neighbours (one-way edges: climbing; a fork's branch only away from its root), entered from the ground or by a
   jump of up to three rows. Letting go is the engine's own jump from that spot.
   ============================================================ */
(function () {
const OK = Tour.orchKit, INK = OK.INK, OA = OK.OrchArt;
const NET = { climb: 3.6 * TS, climbRun: 4.6 * TS, grip: 8, cross: 0.32, holeR: 0.8 * TS, cool: 0.32, bend: 0.3 };

/* ---------------- geometry ---------------- */
const zonesOf = A => { if (!A || !A.zones) return null; if (A.__orchTr && A.__orchTrN === A.zones.length) return A.__orchTr; A.__orchTr = A.zones.filter(z => z.kind === 'orchTrellis'); A.__orchTrN = A.zones.length; return A.__orchTr; };
const live = z => !z.fork || (z.forkE && z.forkE.bent);
const gripY = p => p.y + NET.grip;
const netAt = (A, x, y) => { const L = zonesOf(A); if (!L) return null; for (const z of L) if (live(z) && x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z; return null; };
const holeAt = (z, x, y) => { let best = null, bd = NET.holeR; for (const [hx, hy] of z.holes || []) { const cx = hx * TS + TS / 2, cy = hy * TS + TS / 2, d = Math.hypot(cx - x, cy - y); if (d < bd) { bd = d; best = [hx, hy]; } } return best; };
const trOf = p => p.orchTr || (p.orchTr = { grip: null, face: 0, crossT: 0, cool: 0, ph: 0 });
const forksOf = g => g.entities.filter(e => e instanceof OrchFork && !e.remove);

/* ---------------- the physics (the game: Brady only; the checker's sims never grip) ---------------- */
{
  const ppf = playerPhysicsFlip;
  const quiet = () => ({ jump: false, bonks: null, landed: false, swim: false });
  playerPhysicsFlip = function (p, inp, A, dt, platforms, opts) {
    if (!(opts && opts.live) || !A || !zonesOf(A) || !zonesOf(A).length) { if (p.orchTr) p.orchTr.grip = null; return ppf(p, inp, A, dt, platforms, opts); }
    const W = trOf(p);
    if (W.area !== A) { W.area = A; W.grip = null; W.face = 0; W.crossT = 0; }
    if (W.cool > 0) W.cool -= dt;
    if (W.grip && !live(W.grip)) { W.grip = null; W.cool = NET.cool; p.onGround = false; return ppf(p, inp, A, dt, platforms, opts); }
    if (!W.grip) {
      const z = W.cool <= 0 && inp.up && !p.inWater ? netAt(A, p.x + p.w / 2, gripY(p)) : null;
      if (!z) return ppf(p, inp, A, dt, platforms, opts);
      W.grip = z; W.face = 0; p.vx = 0; p.vy = 0; p.onGround = false; p.jumping = false; p.ride = null;
      TourKit.sfx('grip', 'select', { vol: 0.3, pitch: 1.6 });
    }
    const z = W.grip, ev = quiet();
    if (W.crossT > 0) { W.crossT -= dt; p.vx = 0; p.vy = 0; if (W.crossT <= 0) { W.face ^= 1; W.crossT = 0; } return ev; }
    if (inp.jumpPressed) {
      const h = holeAt(z, p.x + p.w / 2, gripY(p));
      if (h) {
        W.crossT = NET.cross; W.hole = h;
        p.x = h[0] * TS + TS / 2 - p.w / 2; p.y = h[1] * TS + TS / 2 - NET.grip - 6;
        if (!regionFree(A, p.x, p.y, p.w, p.h)) p.y = h[1] * TS + TS / 2 - NET.grip;
        TourKit.sfx('rustle', 'kick', { vol: 0.3, pitch: 1.6 });
        return ev;
      }
      W.grip = null; W.cool = NET.cool; W.face = 0;
      if (inp.down) { p.onGround = false; p.vy = 0; p.coyote = 0; return ppf(p, Object.assign({}, inp, { jumpPressed: false, jump: false }), A, dt, platforms, opts); }
      p.onGround = true; p.coyote = PHYS.coyote; p.jumpBuf = 0;
      return ppf(p, inp, A, dt, platforms, opts);
    }
    const dx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), dy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    const sp = inp.action ? NET.climbRun : NET.climb;
    if (dx) p.facing = dx;
    // a fork at the edge he is pushing against: the push bends it
    for (const f of forksOf(p.g)) f.push(p, W, dx, dt);
    p.vx = dx * sp; p.vy = dy * sp;
    const x0 = p.x, y0 = p.y;
    moveBody(p, A, dt, { semis: false, hidden: true });
    // the grip point stays on a trellis: onto a neighbouring one (a bent branch, the next panel) or clamped to this one
    let gx = p.x + p.w / 2, gy = gripY(p);
    const z2 = netAt(A, gx + dx * 5, gy + dy * 5);
    if (z2 && z2 !== z) { if (!z2.forkE || (gx + dx * 5 - z2.forkE.rootX) * z2.forkE.dir > 0 || z.forkE === z2.forkE) W.grip = z2; }
    const zz = W.grip;
    gx = clamp(gx, zz.x + 3, zz.x + zz.w - 3); gy = clamp(gy, zz.y + 2, zz.y + zz.h - 2);
    const nx = gx - p.w / 2, ny = gy - NET.grip;
    if (regionFree(A, nx, ny, p.w, p.h)) { p.x = nx; p.y = ny; } else if (!regionFree(A, p.x, p.y, p.w, p.h)) { p.x = x0; p.y = y0; }
    W.ph += (Math.abs(p.x - x0) + Math.abs(p.y - y0)) * 0.12;
    if (dy > 0 && (gy >= zz.y + zz.h - 3 || p.onGround) && !zz.fork) { W.grip = null; W.cool = NET.cool; W.face = 0; }
    if (W.grip) { p.onGround = false; p.jumping = false; p.coyote = 0; p.jumpBuf = 0; p.vy = 0; }
    return ev;
  };
}
// the climbing pose: hand over hand; on the far face the slats pass in front of him
{
  const bp0 = bradyPose;
  bradyPose = function (anim, small) {
    if (anim.state !== 'orchClimb') return bp0(anim, small);
    const P = bp0(Object.assign({}, anim, { state: 'hang' }), small), s = Math.sin(anim.phase || 0);
    P.uaF = 2.75 + s * 0.35; P.faF = 3.05 + s * 0.3; P.uaB = 2.75 - s * 0.35; P.faB = 3.05 - s * 0.3;
    P.thF = 0.55 + s * 0.35; P.shF = -0.45; P.thB = 0.55 - s * 0.35; P.shB = -0.45; P.lean = 0; P.bob = 0;
    return P;
  };
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    up0.call(this, dt, inp);
    const W = this.orchTr;
    if (W && W.grip && this.state === 'play' && !this.dead) { this.anim.state = 'orchClimb'; this.anim.phase = W.ph; }
  };
  const dr0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx, t) {
    const W = this.orchTr;
    if (!(W && W.grip) || this.dead) return dr0.call(this, ctx, t);
    if (W.crossT > 0) {
      const k = W.crossT / NET.cross, sx = Math.max(0.08, Math.abs(k * 2 - 1));
      ctx.save(); ctx.translate(this.cx, this.cy); ctx.scale(sx, 1); ctx.translate(-this.cx, -this.cy); dr0.call(this, ctx, t); ctx.restore();
      return;
    }
    dr0.call(this, ctx, t);
    if (W.face === 1) {
      // the lattice in front of him, then any near-face critter close by
      const x = this.x - 22, y = this.y - 26, w = this.w + 44, h = this.h + 30;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      for (const e of this.g.entities) if (e instanceof OrchTrellis && !e.remove && overlap(e, { x, y, w, h })) e.drawSlats(ctx, true);
      ctx.restore();
      for (const e of this.g.entities) if (e.isOrchCrawler && e.face === 0 && !e.remove && overlap(e, { x, y, w, h })) e.draw(ctx);
    }
  };
}

/* ---------------- the trellis entity: the lattice, the trained tree, its far-face critters, its collars ---------------- */
class OrchTrellis extends Ent {
  constructor(g, s) {
    super(g, s, s.w * TS, s.h * TS); this.back = true;
    this.x = s.tx * TS; this.y = s.ty * TS; this.holes = s.holes || []; this.nid = s.nid; this.cache = null; this.seed = s.tx * 7 + s.ty;
  }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  // the slats: ivory laths every tile, a heavier frame, little rust ties at some crossings
  drawSlats(c, front) {
    const x = this.x, y = this.y, w = this.w, h = this.h;
    c.save(); c.lineCap = 'butt';
    for (const pass of [0, 1]) {
      c.strokeStyle = pass ? (front ? 'rgba(244,236,212,0.92)' : OA.IVORY) : INK; c.lineWidth = pass ? 3.2 : 5.4;
      c.beginPath();
      for (let xx = x + TS / 2; xx < x + w; xx += TS) { c.moveTo(xx, y + 2); c.lineTo(xx, y + h - 2); }
      for (let yy = y + TS / 2; yy < y + h; yy += TS) { c.moveTo(x + 2, yy); c.lineTo(x + w - 2, yy); }
      c.stroke();
    }
    c.restore();
  }
  paint(c) {
    const x = this.x, y = this.y, w = this.w, h = this.h, R = mulberry32(this.seed);
    // the dark gaps behind (a soft shadow on the wall/ air behind the lattice)
    c.fillStyle = 'rgba(40,30,50,0.16)'; c.fillRect(x, y, w, h);
    this.drawSlats(c, false);
    // the trained pear tree: a trunk up the middle, arms along every third row, leaves and pears
    const mid = x + Math.floor(w / TS / 2) * TS + TS / 2;
    OA.branch(c, mid, y + h - 4, mid, y + 10, 10, 0, OA.BARK);
    for (let yy = y + h - TS * 1.5; yy > y + TS; yy -= TS * 3) {
      OA.branch(c, mid, yy + 6, x + 16, yy, 7, 0.1, OA.PEAR_D); OA.branch(c, mid, yy + 6, x + w - 16, yy, 7, -0.1, OA.PEAR_D);
      for (let xx = x + 30; xx < x + w - 20; xx += 42) { OA.leaf(c, xx, yy - 3, 0.9, -0.8 - R() * 0.6); if (R() < 0.4) OA.pear(c, xx + 10, yy + 26, 0.7, R() < 0.5 ? OA.PEAR : '#c8d050', true); }
    }
    // ties at a few crossings
    for (let k = 0; k < Math.floor(w * h / (TS * TS * 9)); k++) OA.tie(c, x + (Math.floor(R() * w / TS) + 0.5) * TS, y + (Math.floor(R() * h / TS) + 0.5) * TS, 0.55);
    // the frame: two stakes and a top rail
    c.save(); c.strokeStyle = INK; c.lineWidth = 1.8; c.fillStyle = OA.IVORY;
    c.fillRect(x - 2, y - 6, 10, h + 6); c.strokeRect(x - 2, y - 6, 10, h + 6); c.fillRect(x + w - 8, y - 6, 10, h + 6); c.strokeRect(x + w - 8, y - 6, 10, h + 6);
    c.fillRect(x - 4, y - 8, w + 8, 8); c.strokeRect(x - 4, y - 8, w + 8, 8);
    c.restore();
  }
  draw(ctx) {
    const g = this.g, t = this.t, x = this.x, y = this.y, w = this.w, h = this.h;
    // the far-face critters behind the lattice: broad hatched shapes
    for (const e of g.entities) if (e.isOrchCrawler && e.face === 1 && e.nid === this.nid && !e.remove && !e.dead) e.drawFar(ctx);
    if (typeof document !== 'undefined') {
      if (!this.cache) { const c = document.createElement('canvas'); c.width = Math.ceil(w + 24); c.height = Math.ceil(h + 32); const c2 = c.getContext('2d'); c2.translate(12 - x, 20 - y); this.paint(c2); this.cache = c; }
      ctx.drawImage(this.cache, x - 12, y - 20);
    } else this.paint(ctx);
    // the collars: a stake down the square, a big rust tie round it; the one in reach glows
    const p = g.player, W = p && p.orchTr, held = W && W.grip && (W.grip === this.zone || (W.grip.nid === this.nid));
    const hh = held && !(W.crossT > 0) ? holeAt(W.grip, p.x + p.w / 2, gripY(p)) : null;
    for (const [hx, hy] of this.holes) {
      const cx = hx * TS + TS / 2, cy = hy * TS + TS / 2, hot = hh && hh[0] === hx && hh[1] === hy;
      ctx.save(); ctx.fillStyle = 'rgba(30,20,40,0.4)'; ctx.fillRect(cx - TS / 2 + 3, cy - TS / 2 + 3, TS - 6, TS - 6); ctx.restore();
      OA.stake(ctx, cx, cy + TS * 0.8, TS * 1.6, 9);
      const k = 0.5 + 0.5 * Math.sin(t * 4 + hx);
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(cx, cy, 12, 6, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = OA.RUST; ctx.lineWidth = 3.6; ctx.stroke(); ctx.restore();
      OA.tie(ctx, cx + 9, cy - 2, 0.7);
      if (hot) { ctx.save(); ctx.strokeStyle = `rgba(255,216,74,${0.6 + 0.4 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 21 + k * 3, 0, TAU); ctx.stroke(); ctx.restore(); OA.pill(ctx, cx, cy - 34, 'JUMP: ROUND THE BACK', '#ffd84a'); }
      else { ctx.save(); ctx.strokeStyle = `rgba(255,236,170,${0.25 + 0.25 * k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, TAU); ctx.stroke(); ctx.restore(); }
    }
    // the pips sewn... (coins) stay in front of the lattice
    const A = g.area, cd = Tour.countries.orch && Tour.countries.orch.coin;
    if (A && cd) for (let ty = Math.floor(y / TS); ty < Math.ceil((y + h) / TS); ty++) for (let tx = Math.floor(x / TS); tx < Math.ceil((x + w) / TS); tx++) if (A.tiles[ty * A.W + tx] === T.PICK) cd.draw(ctx, tx * TS + TS / 2, ty * TS + TS / 2 + Math.sin(t * 3 + tx) * 1.5);
  }
}

/* ---------------- a branch fork at a trellis's edge ---------------- */
// { rootX (px: the root's x), rowY (tile row), len (tiles), dir (+1 right / -1 left), late }
class OrchFork extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS); this.back = true; this.dir = s.dir || 1; this.len = s.len; this.late = !!s.late; this.rowY = s.rowY;
    this.rootX = s.rootX; this.x = this.rootX - TS / 2; this.y = this.rowY * TS; this.bent = false; this.tied = false; this.ang = 0; this.pushT = 0; this.relT = 0;
    const A = g.area; this.zone = (A.zones || []).find(z => z.kind === 'orchTrellis' && z.fork === s.fid); if (this.zone) this.zone.forkE = this;
  }
  // Brady on the trellis with his grip near the root, pushing toward the gap
  push(p, W, dx, dt) {
    const near = W.grip && W.grip !== this.zone && Math.abs(p.cx - this.rootX) < TS * 1.1 && Math.abs(gripY(p) - (this.rowY + 0.5) * TS) < TS * 0.9;
    if (!this.bent) {
      if (near && dx === this.dir) { this.pushT += dt; if (this.pushT >= NET.bend) this.bend(W.face); } else this.pushT = Math.max(0, this.pushT - dt * 2);
      return;
    }
    if (this.late && !this.tied) {
      // a late fork bent from the near face springs back as soon as he stops pushing on it
      const onIt = W.grip === this.zone;
      if (near && dx === this.dir) this.relT = 0; else this.relT += dt;
      if (this.relT > (onIt ? 0.05 : 0.25)) this.spring();
    }
  }
  bend(face) {
    this.bent = true; this.pushT = 0; this.relT = 0;
    if (this.late && face === 1) { this.tied = true; OK.say(this.g, this.rootX + this.dir * 2 * TS, this.y - 10, 'TIED ROUND THE BACK!', '#ffd84a'); }
    else if (this.late) OK.say(this.g, this.rootX + this.dir * 2 * TS, this.y - 10, 'IT WANTS TO SPRING BACK...', '#ffffff');
    TourKit.sfx('creak', 'select', { vol: 0.4, pitch: 0.7 });
  }
  spring() {
    this.bent = false; this.relT = 0; TourKit.sfx('boing', 'spring', { vol: 0.4, pitch: 1.3 });
    OK.say(this.g, this.rootX + this.dir * 2 * TS, this.y - 10, 'BOING! FROM BEHIND, WITH THE TIE', '#ffffff');
    const p = this.g.player, W = p && p.orchTr; if (W && W.grip === this.zone) { W.grip = null; W.cool = NET.cool; W.face = 0; }
  }
  update(dt) { this.t += dt; this.ang = approach(this.ang, this.bent ? 0 : 1, dt * (this.bent ? 5 : 7)); }
  touchPlayer() {}
  draw(ctx) {
    const x = this.rootX, y = (this.rowY + 0.5) * TS, L = this.len * TS + TS * 0.6, a = this.ang * 1.0, d = this.dir, t = this.t;
    const ex = x + d * Math.cos(a) * L, ey = y + Math.sin(a) * L;
    const p = this.g.player, W = p && p.orchTr, far = W && W.grip && W.face === 1;
    // the far-side tie: dashed when seen through the lattice, solid once it holds the branch
    if (this.late) { ctx.save(); if (!this.tied) { ctx.setLineDash([3, 3]); ctx.globalAlpha = far ? 1 : 0.6; } OA.tie(ctx, x + d * 6, y - 4, 1.1); ctx.restore(); }
    OA.branch(ctx, x, y, ex, ey, 9, 0.15 * (1 - this.ang) * d, this.late ? '#9a8a2a' : OA.PEAR_D);
    // a fork at the tip, leaves along it
    OA.branch(ctx, ex - d * 10 * Math.cos(a), ey - 10 * Math.sin(a), ex + d * 6, ey - 14, 5, 0, OA.PEAR_D);
    for (let k = 0.25; k < 1; k += 0.25) OA.leaf(ctx, x + d * Math.cos(a) * L * k, y + Math.sin(a) * L * k - 4, 0.9, d > 0 ? -1.2 : -1.9);
    // the tell when it can be bent: the root pulses and an arrow points across
    if (!this.bent && p && W && W.grip && W.grip !== this.zone && Math.abs(p.cx - x) < TS * 4) {
      const k = 0.5 + 0.5 * Math.sin(t * 6);
      ctx.save(); ctx.strokeStyle = `rgba(255,216,74,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 14 + k * 3, 0, TAU); ctx.stroke(); ctx.restore();
      if (Math.abs(p.cx - x) < TS * 1.5) OA.pill(ctx, x + d * 40, y - 30, d > 0 ? 'PUSH  >>' : '<<  PUSH', '#ffd84a');
    }
  }
}

/* ---------------- critters on a trellis: one face each ---------------- */
// { nid, face, kind: 'fly' | 'worm', ax / ay (tiles), speed (tiles/s), phase }
class OrchCrawler extends Ent {
  constructor(g, s) {
    super(g, s, 26, 26); this.enemy = true; this.customCollide = true; this.isOrchCrawler = true;
    this.nid = s.nid; this.face = s.face || 0; this.kind = s.kind || 'fly';
    this.x0 = s.x - 13; this.y0 = s.y - TS - 10; this.ax = (s.ax || 0) * TS; this.ay = (s.ay || 0) * TS; this.sp = s.speed || 1.2; this.ph = s.phase || 0;
    this.len = Math.max(1, Math.abs(this.ax) + Math.abs(this.ay)); this.u = 0; this.dirU = 1; this.dir = this.ax < 0 ? -1 : 1; this.bite = 0; this.back = 0; this.place();
  }
  place() { this.x = this.x0 + this.ax * this.u; this.y = this.y0 + this.ay * this.u; }
  update(dt) {
    this.t += dt;
    if (this.dead) { this.vy = (this.vy || 0) + PHYS.gDown * dt; this.y += this.vy * dt; if (this.y > this.g.area.H * TS + 60) this.remove = true; return; }
    // a fly stops to take a bite (the tell), then flies backwards to admire the hole; a worm stops to tie a knot
    if (this.bite > 0) { this.bite -= dt; if (this.bite <= 0 && this.kind === 'fly') { this.back = 0.6; if (this.g.onScreen(this) && this.face === 0) OK.say(this.g, this.cx, this.y - 6, 'LOVELY HOLE.', '#ffffff'); } return; }
    if (Math.floor((this.t + this.ph) / 3.4) !== Math.floor((this.t + this.ph - dt) / 3.4)) { this.bite = this.kind === 'worm' ? 1.4 : 0.8; if (this.g.onScreen(this) && this.face === 0) OK.say(this.g, this.cx, this.y - 6, this.kind === 'worm' ? 'TIGHTER... OOPS' : 'CHOMP', OK.OrchArt.PEAR_L); return; }
    const back = this.back > 0 ? -1.6 : 1; if (this.back > 0) this.back -= dt;
    this.u += this.dirU * back * this.sp * TS * dt / this.len;
    if (this.u >= 1) { this.u = 1; this.dirU = -1; } if (this.u <= 0) { this.u = 0; this.dirU = 1; }
    if (this.ax) this.dir = sign(this.ax) * this.dirU;
    this.place();
  }
  collidePlayer(p) {
    if (this.dead || !overlap(p, this)) return;
    const W = p.orchTr, onNet = !!(W && W.grip), face = onNet ? W.face : 0;
    if (face !== this.face || (W && W.crossT > 0)) return;
    if (p.star > 0) { this.knock(); return; }
    if (!onNet && p.vy > 0 && p.prevBottom <= this.y + 12) { this.knock(); p.vy = -PHYS.stompV; p.jumping = true; this.g.addScore(100, this.cx, this.y); return; }
    p.hurt(this);
  }
  knock() { if (this.dead) return; this.dead = true; this.vy = -4 * TS; Sound.play('stomp'); this.g.burst(this.cx, this.cy, 8, '#ffffff', 'dust'); }
  hit(kind) { if (this.face === 1 && kind !== 'star') return false; this.knock(); return true; }
  touchPlayer() {}
  art(c, x, y, mode) { if (this.kind === 'worm') OK.wormArt(c, this, x, y, mode === 'notice' ? 'notice' : 'walk', this.t); else OK.flyArt(c, this, x, y - 4, mode, this.t); }
  draw(ctx) {
    if (this.face === 1 && !this.dead) return;
    const x = this.cx, y = this.y + this.h, mode = this.bite > 0 ? 'notice' : 'walk';
    Ink.around(ctx, this.x - 22, this.y - 30, this.w + 44, this.h + 40, c => { c.save(); if (this.dead) { c.translate(x, this.cy); c.rotate(Math.PI); c.translate(-x, -this.cy); } this.art(c, x, y, mode); c.restore(); }, { pad: 4 });
  }
  // behind the lattice: one broad hatched shape, its eyes white
  drawFar(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t;
    ctx.save();
    const body = () => { ctx.beginPath(); if (this.kind === 'worm') { ctx.ellipse(x, y - 9, 20, 9, 0, 0, TAU); } else { ctx.ellipse(x, y - 14, 15, 13, 0, 0, TAU); ctx.moveTo(x - 4, y - 24); ctx.ellipse(x - 8, y - 28, 11, 6, -0.6 + Math.sin(t * 30) * 0.2, 0, TAU); } };
    ctx.fillStyle = 'rgba(40,20,50,0.55)'; body(); ctx.fill();
    ctx.save(); body(); ctx.clip(); ctx.strokeStyle = 'rgba(40,20,50,0.6)'; ctx.lineWidth = 2; for (let k = -40; k < 40; k += 5) { ctx.beginPath(); ctx.moveTo(x + k, y - 36); ctx.lineTo(x + k + 30, y + 6); ctx.stroke(); } ctx.restore();
    ctx.fillStyle = '#ffffff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + 6 + s * 3, y - (this.kind === 'worm' ? 12 : 18), 2.6, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

/* ---------------- the land's tell: a bitten pear by every secret, a tiny Pear Fly admiring the hole ---------------- */
class OrchBite extends Ent {
  constructor(g, s) { super(g, s, 26, 30); this.x = s.x - 13; this.y = s.y - 30; this.back = true; this.shy = 0; }
  update(dt) { this.t += dt; const p = this.g.player; if (p && Math.abs(p.cx - this.cx) < 2.2 * TS && Math.abs(p.cy - this.cy) < 2.5 * TS) this.shy = 1.2; else if (this.shy > 0) this.shy -= dt; }
  touchPlayer() {}
  draw(ctx) { OA.bitten(ctx, this.cx, this.y + this.h, this.t, this.shy > 0); }
}
Object.assign(ENTITY_TYPES, { orchTrellis: OrchTrellis, orchFork: OrchFork, orchCrawler: OrchCrawler, orchBite: OrchBite });
if (typeof TourSeams !== 'undefined' && TourSeams.TELLS) TourSeams.TELLS.orchBite = true;

/* ---------------- the pieces ---------------- */
let netN = 0, forkN = 0;
Object.assign(Tour.pieces, {
  // a trellis with its top-left cell at the letter: { w, h, holes: [[dx, dy], ...] (the collars, relative) }
  'orch.trellis'(st, o) {
    const B = st.B, x0 = st.x, y0 = st.gy - 1, nid = 'o' + (++netN), holes = (o.holes || []).map(([dx, dy]) => [x0 + dx, y0 + dy]);
    B.zone(x0, y0, o.w, o.h, 0, 0, 0, 'orchTrellis', { holes, nid, pulse: true });
    B.spawn('orchTrellis', x0, y0, { tx: x0, ty: y0, w: o.w, h: o.h, holes, nid });
    return st.x;
  },
  // a fork: the letter is the trellis's edge cell it grows from; { len, dir, late }
  'orch.fork'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1, d = o.dir || 1, len = o.len || 3, fid = 'f' + (++forkN);
    const zx = d > 0 ? x + 1 : x - len;
    B.zone(zx, y, len, 1, 0, 0, 0, 'orchTrellis', { holes: [], nid: fid, fork: fid, dir: d, pulse: true });
    B.spawn('orchFork', x, y, { rootX: (x + (d > 0 ? 1 : 0)) * TS, rowY: y, len, dir: d, late: !!o.late, fid });
    return st.x;
  },
  // a critter on the trellis it sits on: { face, kind, ax, ay, speed, phase }
  'orch.crawler'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1;
    const z = B.zones.find(q => q.kind === 'orchTrellis' && !q.fork && x * TS >= q.x && x * TS < q.x + q.w && y * TS >= q.y && y * TS < q.y + q.h);
    B.spawn('orchCrawler', x, y, { nid: z ? z.nid : null, face: o.face || 0, kind: o.kind || 'fly', ax: o.ax || 0, ay: o.ay || 0, speed: o.speed || 1.2, phase: o.phase || 0 });
    return st.x;
  },
  // the tell by a secret: { dy (rows up from the letter) }
  'orch.bite'(st, o) { const s = st.B.spawn('orchBite', st.x, st.gy - 1 - (o.dy || 0), {}); return st.x; }
});

/* ---------------- the level checker: an area's trellises are one grid of climbing spots ---------------- */
{
  const run0 = Validator.run;
  Validator.run = function (level, opts) {
    level.areas.forEach((a, ai) => {
      if (a.orchTrEdges) return;
      const nets = (a.zones || []).filter(z => z.kind === 'orchTrellis'); if (!nets.length) return;
      a.orchTrEdges = true; a.edges = a.edges || []; a.orchCells = a.orchCells || new Set();
      const A = this.proxyArea(a, 0), sol = (x, y) => !!SOLID[tileAt(A, x, y)];
      // node (x, gr) = Brady holding a trellis with his hands in row gr: his feet are at row gr + 2
      const cell = new Map();
      for (const z of nets) {
        const tx0 = Math.round(z.x / TS), tx1 = Math.round((z.x + z.w) / TS) - 1, gy0 = Math.round(z.y / TS), gy1 = Math.round((z.y + z.h) / TS) - 1;
        for (let gr = gy0; gr <= gy1; gr++) for (let x = tx0; x <= tx1; x++) cell.set(x + ',' + gr, z.fork ? z.dir : 0);
      }
      for (const [key, fd] of cell) {
        const [x, gr] = key.split(',').map(Number), fy = gr + 2; a.orchCells.add(x + ',' + fy);
        for (const [dx, dg] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const k2 = (x + dx) + ',' + (gr + dg); if (!cell.has(k2)) continue;
          const fd2 = cell.get(k2);
          // along a fork's branch only away from its root (it is bent from the root's side); never up or down on it
          if ((fd || fd2) && (dg !== 0 || dx !== (fd || fd2))) continue;
          a.edges.push({ from: [x, fy - 1], to: [x + dx, fy + dg] });
        }
      }
      // in from below: standing under a trellis (not a fork's branch) or a jump of up to three rows
      for (const z of nets) {
        if (z.fork) continue;
        const tx0 = Math.round(z.x / TS), tx1 = Math.round((z.x + z.w) / TS) - 1, gy0 = Math.round(z.y / TS), gy1 = Math.round((z.y + z.h) / TS) - 1;
        const isNode = (x, gr) => x >= tx0 && x <= tx1 && gr >= gy0 && gr <= gy1;
        for (let x = tx0 - 2; x <= tx1 + 2; x++) for (let y = gy0 + 2; y <= Math.min(A.H - 1, gy1 + 6); y++) {
          const t = tileAt(A, x, y); if (!(SOLID[t] || t === T.SEMI) || t === T.SPIKES || sol(x, y - 1) || sol(x, y - 2)) continue;
          for (let dx = -2; dx <= 2; dx++) for (let k = dx ? 0 : 1; k <= 3; k++) {
            const nx = x + dx, fy = y - k, gr = fy - 2; if (!isNode(nx, gr)) continue;
            let clear = true;
            for (let yy = fy - 2; yy < y; yy++) for (let xx = Math.min(x, nx); xx <= Math.max(x, nx); xx++) if (sol(xx, yy)) clear = false;
            if (clear) a.edges.push({ from: [x, y - 1], to: [nx, fy] });
          }
        }
      }
    });
    return run0.call(this, level, opts);
  };
  const px0 = Validator.proxyArea;
  Validator.proxyArea = function (area, mask) { const A = px0.call(this, area, mask); if (area.orchCells) A.orchCells = area.orchCells; return A; };
  const sim0 = Validator.simulate;
  Validator.simulate = function (A, ai, tx, ty, m, D, markBox, jumpBoost, f) {
    if (A.orchCells && A.orchCells.has(tx + ',' + ty) && !SOLID[tileAt(A, tx, ty)] && tileAt(A, tx, ty) !== T.SEMI && (m.off || m.mash || m.delay || m.reverseAt || m.stopAt || m.hold === 0.22)) return null;
    return sim0.call(this, A, ai, tx, ty, m, D, markBox, jumpBoost, f);
  };
}

Object.assign(TourLandscape.ARCH_LABEL, { espalier: 'TRELLIS' });
Object.assign(Tour.orchKit, { NET, netAt, holeAt, OrchTrellis, OrchFork });
})();
