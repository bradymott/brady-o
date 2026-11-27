/* ============================================================
   BELOW THE CHEAP SEATS: the scaffold (33-1 TWO WAYS ROUND A POLE, arch 'roundpole').
   A scaffold is a big frame of rust-orange tubes and cream rope lashings under the grandstand. It has two faces: the
   near one (Brady climbs in front of it, the tubes behind his hands) and the far one (Brady behind it, the tubes in
   front of him, the whole frame shaded).
     - PUSH UP into a scaffold to grip it (from the ground or in the air). The stick climbs in all four directions.
     - JUMP at a COLLAR (an upright pole with a big gold collar clamp, glowing when in reach) swings Brady round the
       pole onto the other face.
     - JUMP anywhere else lets go with a real jump (hold DOWN as you press JUMP to just drop).
     - Bolt Crabs and Seat Shrews crawl on one face. Only a critter on Brady's face can touch him: climb round it, or
       swing round a pole and pass it on the other face. A critter on the far face shows as one broad hatched shape.
     - The LATE BOLT CRAB guards a bolted board across the way. It MIRRORS Brady's climb about its collar (he goes up,
       it comes down at him), so on the near face it always meets him. Go round to the far face, climb down behind it
       to the collar, and when it arrives on the other side of the pole tap THROW through the collar: its spanner is
       knocked loose, it drops off, and the bolted board swings open.
   The checker: an area's scaffolds are one grid of spots joined to their four neighbours, entered from the ground
   or by a jump of up to three rows. The bolted board is a lock whose key is standing (gripping) at the collar.
   ============================================================ */
(function () {
const SK = Tour.seatsKit, INK = SK.INK, SA = SK.SeatsArt;
const NET = { climb: 3.6 * TS, climbRun: 4.6 * TS, grip: 8, cross: 0.32, holeR: 0.8 * TS, cool: 0.32 };

/* ---------------- geometry ---------------- */
const zonesOf = A => { if (!A || !A.zones) return null; if (A.__seatsSc && A.__seatsScN === A.zones.length) return A.__seatsSc; A.__seatsSc = A.zones.filter(z => z.kind === 'seatsScaf'); A.__seatsScN = A.zones.length; return A.__seatsSc; };
const gripY = p => p.y + NET.grip;
const netAt = (A, x, y) => { const L = zonesOf(A); if (!L) return null; for (const z of L) if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z; return null; };
const holeAt = (z, x, y) => { let best = null, bd = NET.holeR; for (const [hx, hy] of z.holes || []) { const cx = hx * TS + TS / 2, cy = hy * TS + TS / 2, d = Math.hypot(cx - x, cy - y); if (d < bd) { bd = d; best = [hx, hy]; } } return best; };
const scOf = p => p.seatsSc || (p.seatsSc = { grip: null, face: 0, crossT: 0, cool: 0, ph: 0 });

/* ---------------- the physics (the game: Brady only; the checker's sims never grip) ---------------- */
{
  const ppf = playerPhysicsFlip;
  const quiet = () => ({ jump: false, bonks: null, landed: false, swim: false });
  playerPhysicsFlip = function (p, inp, A, dt, platforms, opts) {
    if (!(opts && opts.live) || !A || !zonesOf(A) || !zonesOf(A).length) { if (p.seatsSc) p.seatsSc.grip = null; return ppf(p, inp, A, dt, platforms, opts); }
    const W = scOf(p);
    if (W.area !== A) { W.area = A; W.grip = null; W.face = 0; W.crossT = 0; }
    if (W.cool > 0) W.cool -= dt;
    if (!W.grip) {
      const z = W.cool <= 0 && inp.up && !p.inWater ? netAt(A, p.x + p.w / 2, gripY(p)) : null;
      if (!z) return ppf(p, inp, A, dt, platforms, opts);
      W.grip = z; W.face = 0; W.crossT = 0; p.vx = 0; p.vy = 0; p.onGround = false; p.jumping = false; p.ride = null;
      TourKit.sfx('grip', 'select', { vol: 0.3, pitch: 1.4 });
    }
    const z = W.grip, ev = quiet();
    if (W.crossT > 0) { W.crossT -= dt; p.vx = 0; p.vy = 0; if (W.crossT <= 0) { W.face ^= 1; W.crossT = 0; } return ev; }
    if (inp.jumpPressed) {
      const h = holeAt(z, p.x + p.w / 2, gripY(p));
      if (h) {
        W.crossT = NET.cross; W.hole = h;
        p.x = h[0] * TS + TS / 2 - p.w / 2; p.y = h[1] * TS + TS / 2 - NET.grip - 6;
        if (!regionFree(A, p.x, p.y, p.w, p.h)) p.y = h[1] * TS + TS / 2 - NET.grip;
        TourKit.sfx('clang', 'kick', { vol: 0.3, pitch: 1.2 });
        return ev;
      }
      W.grip = null; W.cool = NET.cool; W.face = 0;
      if (inp.down) { p.onGround = false; p.vy = 0; p.coyote = 0; return ppf(p, Object.assign({}, inp, { jumpPressed: false, jump: false }), A, dt, platforms, opts); }
      p.onGround = true; p.coyote = PHYS.coyote; p.jumpBuf = 0;
      return ppf(p, inp, A, dt, platforms, opts);
    }
    const dx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), dy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    const sp = NET.climb;
    if (dx) p.facing = dx;
    p.vx = dx * sp; p.vy = dy * sp;
    const x0 = p.x, y0 = p.y;
    moveBody(p, A, dt, { semis: false, hidden: true });
    let gx = p.x + p.w / 2, gy = gripY(p);
    const z2 = netAt(A, gx + dx * 5, gy + dy * 5);
    if (z2 && z2 !== z) W.grip = z2;
    const zz = W.grip;
    gx = clamp(gx, zz.x + 3, zz.x + zz.w - 3); gy = clamp(gy, zz.y + 2, zz.y + zz.h - 2);
    const nx = gx - p.w / 2, ny = gy - NET.grip;
    if (regionFree(A, nx, ny, p.w, p.h)) { p.x = nx; p.y = ny; } else if (!regionFree(A, p.x, p.y, p.w, p.h)) { p.x = x0; p.y = y0; }
    W.ph += (Math.abs(p.x - x0) + Math.abs(p.y - y0)) * 0.12;
    if (dy > 0 && (gy >= zz.y + zz.h - 3 || p.onGround)) { W.grip = null; W.cool = NET.cool; W.face = 0; }
    if (W.grip) { p.onGround = false; p.jumping = false; p.coyote = 0; p.jumpBuf = 0; p.vy = 0; }
    return ev;
  };
}
// the climbing pose: hand over hand; on the far face the tubes pass in front of him
{
  const bp0 = bradyPose;
  bradyPose = function (anim, small) {
    if (anim.state !== 'seatsClimb') return bp0(anim, small);
    const P = bp0(Object.assign({}, anim, { state: 'hang' }), small), s = Math.sin(anim.phase || 0);
    P.uaF = 2.75 + s * 0.35; P.faF = 3.05 + s * 0.3; P.uaB = 2.75 - s * 0.35; P.faB = 3.05 - s * 0.3;
    P.thF = 0.55 + s * 0.35; P.shF = -0.45; P.thB = 0.55 - s * 0.35; P.shB = -0.45; P.lean = 0; P.bob = 0;
    return P;
  };
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    up0.call(this, dt, inp);
    const W = this.seatsSc;
    if (W && W.grip && this.state === 'play' && !this.dead) { this.anim.state = 'seatsClimb'; this.anim.phase = W.ph; }
  };
  const dr0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx, t) {
    const W = this.seatsSc;
    if (!(W && W.grip) || this.dead) return dr0.call(this, ctx, t);
    if (W.crossT > 0) {
      const k = W.crossT / NET.cross, sx = Math.max(0.08, Math.abs(k * 2 - 1));
      ctx.save(); ctx.translate(this.cx, this.cy); ctx.scale(sx, 1); ctx.translate(-this.cx, -this.cy); dr0.call(this, ctx, t); ctx.restore();
      return;
    }
    if (W.face === 1) { ctx.save(); ctx.globalAlpha *= 0.92; dr0.call(this, ctx, t); ctx.restore(); } else dr0.call(this, ctx, t);
    if (W.face === 1) {
      // the frame in front of him (a shaded band over him says "behind"), then any near-face critter close by
      const x = this.x - 22, y = this.y - 26, w = this.w + 44, h = this.h + 30;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      for (const e of this.g.entities) if (e instanceof SeatsScaffold && !e.remove && overlap(e, { x, y, w, h })) e.drawTubes(ctx, true);
      ctx.restore();
      for (const e of this.g.entities) if (e.isSeatsCrawler && e.face === 0 && !e.remove && overlap(e, { x, y, w, h })) e.draw(ctx);
    }
  };
}

/* ---------------- the scaffold entity: the frame, its far-face critters, its collars ---------------- */
class SeatsScaffold extends Ent {
  constructor(g, s) {
    super(g, s, s.w * TS, s.h * TS); this.back = true;
    this.x = s.tx * TS; this.y = s.ty * TS; this.holes = s.holes || []; this.nid = s.nid; this.cache = null; this.seed = s.tx * 7 + s.ty;
  }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  // the tubes: a standard every tile, a ledger every tile, thick rust with an ink edge; in front: the same, dimmer
  drawTubes(c, front) {
    const x = this.x, y = this.y, w = this.w, h = this.h;
    c.save(); c.lineCap = 'round';
    for (const pass of [0, 1]) {
      c.strokeStyle = pass ? (front ? 'rgba(200,86,42,0.9)' : SA.RUST) : INK; c.lineWidth = pass ? 3.6 : 6.2;
      c.beginPath();
      for (let xx = x + TS / 2; xx < x + w; xx += 2 * TS) { c.moveTo(xx, y + 2); c.lineTo(xx, y + h - 2); }
      for (let yy = y + TS / 2; yy < y + h; yy += 2 * TS) { c.moveTo(x + 2, yy); c.lineTo(x + w - 2, yy); }
      c.stroke();
    }
    c.restore();
  }
  paint(c) {
    const x = this.x, y = this.y, w = this.w, h = this.h, R = mulberry32(this.seed);
    c.fillStyle = 'rgba(20,10,20,0.22)'; c.fillRect(x, y, w, h);
    this.drawTubes(c, false);
    // braces across some squares, rope lashings at some crossings, clamps at the joints
    c.save(); c.lineCap = 'round';
    for (let k = 0; k < Math.floor(w * h / (TS * TS * 16)); k++) {
      const cx = x + (Math.floor(R() * (w / TS - 2) / 2) * 2 + 0.5) * TS, cy = y + (Math.floor(R() * (h / TS - 2) / 2) * 2 + 0.5) * TS, d = R() < 0.5 ? 1 : -1;
      c.strokeStyle = INK; c.lineWidth = 4.6; c.beginPath(); c.moveTo(cx, cy + (d > 0 ? 2 * TS : 0)); c.lineTo(cx + 2 * TS, cy + (d > 0 ? 0 : 2 * TS)); c.stroke(); c.strokeStyle = SA.RUST_D; c.lineWidth = 2.6; c.stroke();
    }
    c.restore();
    for (let k = 0; k < Math.floor(w * h / (TS * TS * 10)); k++) { const cx = x + (Math.floor(R() * w / TS / 2) * 2 + 0.5) * TS, cy = y + (Math.floor(R() * h / TS / 2) * 2 + 0.5) * TS; if (R() < 0.5) SA.clamp(c, cx, cy, 0.7); else { c.save(); c.lineWidth = 4.4; c.strokeStyle = INK; c.beginPath(); c.ellipse(cx, cy, 7, 5, 0.6, 0, TAU); c.stroke(); c.lineWidth = 2.4; c.strokeStyle = SA.CREAM; c.stroke(); c.restore(); } }
    // the frame: two heavier standards, a top ledger with teal toe boards
    c.save(); c.strokeStyle = INK; c.lineWidth = 1.8; c.fillStyle = SA.RUST_D;
    c.fillRect(x - 3, y - 6, 9, h + 6); c.strokeRect(x - 3, y - 6, 9, h + 6); c.fillRect(x + w - 6, y - 6, 9, h + 6); c.strokeRect(x + w - 6, y - 6, 9, h + 6);
    c.fillStyle = SA.TEAL; c.fillRect(x - 4, y - 10, w + 8, 8); c.strokeRect(x - 4, y - 10, w + 8, 8);
    c.restore();
  }
  draw(ctx) {
    const g = this.g, t = this.t, x = this.x, y = this.y, w = this.w, h = this.h;
    // the far-face critters behind the frame: broad hatched shapes
    for (const e of g.entities) if (e.isSeatsCrawler && e.face === 1 && e.nid === this.nid && !e.remove && !e.dead) e.drawFar(ctx);
    if (typeof document !== 'undefined') {
      if (!this.cache) { const c = document.createElement('canvas'); c.width = Math.ceil(w + 24); c.height = Math.ceil(h + 32); const c2 = c.getContext('2d'); c2.translate(12 - x, 20 - y); this.paint(c2); this.cache = c; }
      ctx.drawImage(this.cache, x - 12, y - 20);
    } else this.paint(ctx);
    // the collars: an upright pole through the square with a big gold collar clamp; the one in reach glows
    const p = g.player, W = p && p.seatsSc, held = W && W.grip && W.grip.nid === this.nid;
    const hh = held && !(W.crossT > 0) ? holeAt(W.grip, p.x + p.w / 2, gripY(p)) : null;
    for (const [hx, hy] of this.holes) {
      const cx = hx * TS + TS / 2, cy = hy * TS + TS / 2, hot = hh && hh[0] === hx && hh[1] === hy;
      SA.tube(ctx, cx, cy - TS * 1.1, cx, cy + TS * 1.1, 9, SA.RUST_L);
      const k = 0.5 + 0.5 * Math.sin(t * 4 + hx);
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillStyle = SA.GOLD; rr(ctx, cx - 11, cy - 6, 22, 12, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = SA.TIN; ctx.beginPath(); ctx.arc(cx + 8, cy, 2.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
      if (hot) { ctx.save(); ctx.strokeStyle = `rgba(255,216,74,${0.6 + 0.4 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 21 + k * 3, 0, TAU); ctx.stroke(); ctx.restore(); g.__seatsPole = { x: cx, y: cy - 40, txt: p.seatsProp ? 'THROW: KNOCK THE SPANNER' : 'JUMP: ROUND THE POLE' }; }
      else { ctx.save(); ctx.strokeStyle = `rgba(255,236,170,${0.25 + 0.25 * k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, TAU); ctx.stroke(); ctx.restore(); }
    }
    // the ticket stubs stay in front of the frame
    const A = g.area, cd = Tour.countries.seats && Tour.countries.seats.coin;
    if (A && cd) for (let ty = Math.floor(y / TS); ty < Math.ceil((y + h) / TS); ty++) for (let tx = Math.floor(x / TS); tx < Math.ceil((x + w) / TS); tx++) if (A.tiles[ty * A.W + tx] === T.PICK) cd.draw(ctx, tx * TS + TS / 2, ty * TS + TS / 2 + Math.sin(t * 3 + tx) * 1.5);
  }
}

/* ---------------- critters on a scaffold: one face each ---------------- */
// { nid, face, kind: 'crab' | 'shrew', ax / ay (tiles), speed (tiles/s), phase }
class SeatsCrawler extends Ent {
  constructor(g, s) {
    super(g, s, 26, 26); this.enemy = true; this.customCollide = true; this.isSeatsCrawler = true;
    this.nid = s.nid; this.face = s.face || 0; this.kind = s.kind || 'crab';
    this.x0 = s.x - 13; this.y0 = s.y - TS - 10; this.ax = (s.ax || 0) * TS; this.ay = (s.ay || 0) * TS; this.sp = s.speed || 1.2; this.ph = s.phase || 0;
    this.len = Math.max(1, Math.abs(this.ax) + Math.abs(this.ay)); this.u = 0; this.dirU = 1; this.dir = this.ax < 0 ? -1 : 1; this.stop = 0; this.place();
  }
  place() { this.x = this.x0 + this.ax * this.u; this.y = this.y0 + this.ay * this.u; }
  update(dt) {
    this.t += dt;
    if (this.dead) { this.vy = (this.vy || 0) + PHYS.gDown * dt; this.y += this.vy * dt; if (this.y > this.g.area.H * TS + 60) this.remove = true; return; }
    // a crab stops to bolt itself to a tube (the tell: its spanner turns); a shrew folds itself into a seat
    if (this.stop > 0) { this.stop -= dt; return; }
    if (Math.floor((this.t + this.ph) / 3.6) !== Math.floor((this.t + this.ph - dt) / 3.6)) { this.stop = this.kind === 'shrew' ? 1.4 : 1.2; if (this.g.onScreen(this) && this.face === 0) SK.say(this.g, this.cx, this.y - 6, this.kind === 'shrew' ? 'IS THIS SEAT TAKEN?' : 'TIGHT AS A NUT.', SA.CREAM); return; }
    this.u += this.dirU * this.sp * TS * dt / this.len;
    if (this.u >= 1) { this.u = 1; this.dirU = -1; } if (this.u <= 0) { this.u = 0; this.dirU = 1; }
    if (this.ax) this.dir = sign(this.ax) * this.dirU;
    this.place();
  }
  collidePlayer(p) {
    if (this.dead || !overlap(p, this)) return;
    const W = p.seatsSc, onNet = !!(W && W.grip), face = onNet ? W.face : 0;
    if (face !== this.face || (W && W.crossT > 0)) return;
    if (p.star > 0) { this.knock(); return; }
    if (!onNet && p.vy > 0 && p.prevBottom <= this.y + 12) { this.knock(); p.vy = -PHYS.stompV; p.jumping = true; this.g.addScore(100, this.cx, this.y); return; }
    p.hurt(this);
  }
  knock() { if (this.dead) return; this.dead = true; this.vy = -4 * TS; Sound.play('stomp'); this.g.burst(this.cx, this.cy, 8, '#ffffff', 'dust'); }
  hit(kind) { if (this.face === 1 && kind !== 'star') return false; this.knock(); return true; }
  touchPlayer() {}
  art(c, x, y, mode) { if (this.kind === 'shrew') SK.shrewArt(c, this, x, y, mode === 'notice' ? 'seat' : 'walk', this.t); else SK.crabArt(c, this, x, y, mode, this.t); }
  draw(ctx) {
    if (this.face === 1 && !this.dead) return;
    const x = this.cx, y = this.y + this.h, mode = this.stop > 0 ? 'notice' : 'walk';
    Ink.around(ctx, this.x - 22, this.y - 30, this.w + 44, this.h + 40, c => { c.save(); if (this.dead) { c.translate(x, this.cy); c.rotate(Math.PI); c.translate(-x, -this.cy); } this.art(c, x, y, mode); c.restore(); }, { pad: 4 });
  }
  // behind the frame: one broad hatched shape, its eyes white, its spanner (or its tail) large
  drawFar(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t;
    ctx.save();
    const body = () => { ctx.beginPath(); if (this.kind === 'shrew') ctx.ellipse(x, y - 10, 18, 10, 0, 0, TAU); else { ctx.ellipse(x, y - 12, 17, 12, 0, 0, TAU); } };
    ctx.fillStyle = 'rgba(30,14,30,0.6)'; body(); ctx.fill();
    ctx.save(); body(); ctx.clip(); ctx.strokeStyle = 'rgba(30,14,30,0.65)'; ctx.lineWidth = 2; for (let k = -40; k < 40; k += 5) { ctx.beginPath(); ctx.moveTo(x + k, y - 36); ctx.lineTo(x + k + 30, y + 6); ctx.stroke(); } ctx.restore();
    if (this.kind !== 'shrew') { ctx.strokeStyle = 'rgba(30,14,30,0.75)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 12, y - 16); ctx.lineTo(x + 26, y - 26 + Math.sin(t * 3) * 2); ctx.stroke(); }
    ctx.fillStyle = '#ffffff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + 6 + s * 3, y - (this.kind === 'shrew' ? 13 : 20), 2.6, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

/* ---------------- the late bolt crab: it mirrors Brady's climb about its collar ---------------- */
// { nid, hx, hy (the collar), id (the board it holds), rx, ry (how far it may go, tiles) }
class SeatsMirrorCrab extends Ent {
  constructor(g, s) {
    super(g, s, 30, 26); this.enemy = true; this.customCollide = true; this.isSeatsCrawler = true; this.face = 0; this.kind = 'crab';
    this.nid = s.nid; this.hx = s.hx; this.hy = s.hy; this.id = s.id; this.rx = (s.rx || 3) * TS; this.ry = (s.ry || 3) * TS;
    this.ccx = (this.hx + 0.5) * TS; this.ccy = (this.hy + 0.5) * TS; this.home = [this.ccx + this.rx * 0.6, this.ccy - this.ry * 0.7];
    this.px = this.home[0]; this.py = this.home[1]; this.dir = -1; this.seatsProp = true; this.place();
  }
  place() { this.x = this.px - this.w / 2; this.y = this.py - this.h / 2 - 6; }
  zone() { const A = this.g.area; return (zonesOf(A) || []).find(z => z.nid === this.nid); }
  update(dt) {
    this.t += dt;
    if (this.dead) { this.vy = (this.vy || 0) + PHYS.gDown * dt; this.y += this.vy * dt; this.sx = (this.sx || 0) + dt; if (this.y > this.g.area.H * TS + 60) this.remove = true; return; }
    const p = this.g.player, W = p && p.seatsSc, on = W && W.grip && W.grip.nid === this.nid;
    // its target: the point mirror of Brady's hands about the collar (while he holds this scaffold); home otherwise
    let tx = this.home[0], ty = this.home[1];
    if (on) { tx = clamp(2 * this.ccx - p.cx, this.ccx - this.rx, this.ccx + this.rx); ty = clamp(2 * this.ccy - gripY(p), this.ccy - this.ry, this.ccy + this.ry); }
    const z = this.zone(); if (z) { tx = clamp(tx, z.x + 12, z.x + z.w - 12); ty = clamp(ty, z.y + 12, z.y + z.h - 12); }
    const sp = 3.4 * TS * dt, ox = this.px;
    this.px = approach(this.px, tx, sp); this.py = approach(this.py, ty, sp);
    if (Math.abs(this.px - ox) > 0.1) this.dir = this.px > ox ? 1 : -1;
    this.place();
    this.atCollar = Math.hypot(this.px - this.ccx, this.py - this.ccy) < TS * 1.0;
        if (this.saidT > 0) this.saidT -= dt;
  }
  // THROW: Brady on the far face, his hands at the collar, the crab right there on the other side of the pole
  seatsTouch(p) { const W = p.seatsSc; if (this.dead || !(W && W.grip && W.face === 1 && !(W.crossT > 0))) return false; const h = holeAt(W.grip, p.cx, gripY(p)); return !!h && h[0] === this.hx && h[1] === this.hy && this.atCollar; }
  seatsInput(p, inp) { if (inp.actionPressed) this.knock(); }
  knock() {
    if (this.dead) return; this.dead = true; this.vy = -3 * TS; this.seatsProp = false;
    Sound.play('stomp'); TourKit.sfx('clang', 'kick', { vol: 0.6, pitch: 0.8 }); this.g.burst(this.ccx, this.ccy, 14, SA.GOLD, 'spark');
    SK.say(this.g, this.ccx, this.ccy - 40, 'SPANNER KNOCKED LOOSE!', '#ffd84a');
    this.g.keys.add(this.id); this.g.addScore(500, this.cx, this.y);
  }
  collidePlayer(p) {
    if (this.dead || !overlap(p, this)) return;
    const W = p.seatsSc, face = W && W.grip ? W.face : 0;
    if (face !== 0 || (W && W.crossT > 0)) return;
    p.hurt(this);
  }
  hit(kind) { return false; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t;
    const p = this.g.player, W = p && p.seatsSc, far = W && W.grip && W.face === 1;
    // its line of mirroring: a faint dashed line from Brady through the collar to it (only while he climbs this one)
    if (!this.dead && W && W.grip && W.grip.nid === this.nid) {
      ctx.save(); ctx.setLineDash([5, 6]); ctx.strokeStyle = 'rgba(255,216,74,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.cx, gripY(p)); ctx.lineTo(this.px, this.py); ctx.stroke(); ctx.restore();
    }
    if (far && !this.dead) {
      // seen through the frame from behind: still the crab, a little shaded; its spanner big and gold
      ctx.save(); ctx.globalAlpha = 0.85; SK.crabArt(ctx, this, x, y, 'walk', t); ctx.restore();
      if (this.atCollar) { const k = 0.5 + 0.5 * Math.sin(t * 8); ctx.save(); ctx.strokeStyle = `rgba(255,216,74,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 14, y - 14, 12 + k * 3, 0, TAU); ctx.stroke(); ctx.restore(); }
      return;
    }
    Ink.around(ctx, this.x - 22, this.y - 30, this.w + 44, this.h + 40, c => { c.save(); if (this.dead) { c.translate(x, this.cy); c.rotate(Math.PI); c.translate(-x, -this.cy); } SK.crabArt(c, this, x, y, this.dead ? 'walk' : (this.atCollar ? 'notice' : 'walk'), t); c.restore(); }, { pad: 4 });
    // a gold M on its shell: the mirroring crab
    if (!this.dead) SA.pill(ctx, x, this.y - 18, 'MIRROR', '#ffd84a', 0.85);
    else { ctx.save(); ctx.translate(x + 18, this.y - 10 + (this.sx || 0) * 60); ctx.rotate((this.sx || 0) * 9); ctx.fillStyle = SA.TIN_D; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillRect(-8, -2, 16, 4); ctx.strokeRect(-8, -2, 16, 4); ctx.restore(); }
  }
}
// the bolted board across the way: a teal scaffold board on two clamps; swings open once the crab is knocked off
class SeatsBoltBoard extends ENTITY_TYPES.lock {
  update(dt) { super.update(dt); if (!this.open && this.g.keys.has(this.id) && this.g.player) this.touchPlayer(this.g.player); }
  touchPlayer(p) { if (this.open) return; if (this.g.keys.has(this.id)) return super.touchPlayer(p); if (this.msgT <= 0) { this.msgT = 2.5; SK.say(this.g, this.cx, this.y - 10, 'BOLTED. THE CRAB HAS THE SPANNER', '#ffd84a'); Sound.play('bump', { vol: 0.4 }); } }
  draw(ctx) {
    const k = this.open ? clamp(1 - (this.openT || 0) / 0.6, 0, 1) : 0, x = this.x + 6, y = this.y, w = TS, h = this.h;
    ctx.save(); ctx.translate(x + w / 2, y); ctx.rotate(-k * 1.4); ctx.translate(-(x + w / 2), -y);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = SA.TEAL; rr(ctx, x, y, w, h, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SA.TEAL_D; for (let yy = y + 10; yy < y + h - 6; yy += 18) ctx.fillRect(x + 3, yy, w - 6, 3);
    SA.clamp(ctx, x + w / 2, y + 14, 1.1); SA.clamp(ctx, x + w / 2, y + h - 14, 1.1);
    ctx.restore();
  }
}
// the collar's prompt, drawn over Brady and the frame (never under the tubes)
TourHooks.on('afterEntities', (play, ctx) => { const q = play.__seatsPole; if (!q) return; play.__seatsPole = null; SA.pill(ctx, q.x, q.y, q.txt, '#ffd84a'); });
Object.assign(ENTITY_TYPES, { seatsScaffold: SeatsScaffold, seatsCrawler: SeatsCrawler, seatsMirrorCrab: SeatsMirrorCrab, seatsBoltBoard: SeatsBoltBoard });

/* ---------------- the land's tell: one little seat that faces the floor, by every secret ---------------- */
class SeatsTell extends Ent {
  constructor(g, s) { super(g, s, 26, 30); this.x = s.x - 13; this.y = s.y - 30; this.back = true; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) { SA.wrongSeat(ctx, this.cx, this.y + this.h, this.t); }
}
ENTITY_TYPES.seatsTell = SeatsTell;
if (typeof TourSeams !== 'undefined' && TourSeams.TELLS) TourSeams.TELLS.seatsTell = true;

/* ---------------- the pieces ---------------- */
let netN = 0;
Object.assign(Tour.pieces, {
  // a scaffold with its top-left cell at the letter: { w, h, holes: [[dx, dy], ...] (the collars, relative) }
  'seats.scaffold'(st, o) {
    const B = st.B, x0 = st.x, y0 = st.gy - 1, nid = 's' + (++netN), holes = (o.holes || []).map(([dx, dy]) => [x0 + dx, y0 + dy]);
    B.zone(x0, y0, o.w, o.h, 0, 0, 0, 'seatsScaf', { holes, nid, pulse: true });
    B.spawn('seatsScaffold', x0, y0, { tx: x0, ty: y0, w: o.w, h: o.h, holes, nid });
    return st.x;
  },
  // a critter on the scaffold it sits on: { face, kind, ax, ay, speed, phase }
  'seats.crawler'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1;
    const z = B.zones.find(q => q.kind === 'seatsScaf' && x * TS >= q.x && x * TS < q.x + q.w && y * TS >= q.y && y * TS < q.y + q.h);
    B.spawn('seatsCrawler', x, y, { nid: z ? z.nid : null, face: o.face || 0, kind: o.kind || 'crab', ax: o.ax || 0, ay: o.ay || 0, speed: o.speed || 1.2, phase: o.phase || 0 });
    return st.x;
  },
  // the late bolt crab: the letter is its collar (a collar of the scaffold there); { id, rx, ry }. The checker's key:
  // Brady gripping at the collar (any face)
  'seats.mirrorCrab'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1;
    const z = B.zones.find(q => q.kind === 'seatsScaf' && x * TS >= q.x && x * TS < q.x + q.w && y * TS >= q.y && y * TS < q.y + q.h);
    B.spawn('seatsMirrorCrab', x, y, { nid: z ? z.nid : null, hx: x, hy: y, id: o.id, rx: o.rx || 3, ry: o.ry || 3 });
    B.vkey(o.id, [[x, y + 2]], 'any');
    return st.x;
  },
  // the bolted board: the letter's column, h rows up from the floor; { id, h }
  'seats.board'(st, o) { const B = st.B, x = st.x, y = st.gy - 1, n = B.spawns.length; B.lock(x, y - (o.h || 4) + 1, y, o.id, 'door'); for (let k = n; k < B.spawns.length; k++) if (B.spawns[k].type === 'lock') B.spawns[k].type = 'seatsBoltBoard'; return st.x; },
  // the tell by a secret: { dy (rows up from the letter) }
  'seats.tell'(st, o) { st.B.spawn('seatsTell', st.x, st.gy - 1 - (o.dy || 0), {}); return st.x; }
});

/* ---------------- the level checker: an area's scaffolds are one grid of climbing spots ---------------- */
{
  const run0 = Validator.run;
  Validator.run = function (level, opts) {
    level.areas.forEach((a, ai) => {
      if (a.seatsScEdges) return;
      const nets = (a.zones || []).filter(z => z.kind === 'seatsScaf'); if (!nets.length) return;
      a.seatsScEdges = true; a.edges = a.edges || []; a.seatsCells = a.seatsCells || new Set();
      const A = this.proxyArea(a, 0), sol = (x, y) => !!SOLID[tileAt(A, x, y)];
      // node (x, gr) = Brady holding a scaffold with his hands in row gr: his feet are at row gr + 2
      const cell = new Set();
      for (const z of nets) {
        const tx0 = Math.round(z.x / TS), tx1 = Math.round((z.x + z.w) / TS) - 1, gy0 = Math.round(z.y / TS), gy1 = Math.round((z.y + z.h) / TS) - 1;
        for (let gr = gy0; gr <= gy1; gr++) for (let x = tx0; x <= tx1; x++) cell.add(x + ',' + gr);
      }
      for (const key of cell) {
        const [x, gr] = key.split(',').map(Number), fy = gr + 2; a.seatsCells.add(x + ',' + fy);
        for (const [dx, dg] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const k2 = (x + dx) + ',' + (gr + dg); if (!cell.has(k2)) continue;
          a.edges.push({ from: [x, fy - 1], to: [x + dx, fy + dg] });
        }
      }
      // in from below: standing under a scaffold or a jump of up to three rows
      for (const z of nets) {
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
  Validator.proxyArea = function (area, mask) { const A = px0.call(this, area, mask); if (area.seatsCells) A.seatsCells = area.seatsCells; return A; };
  const sim0 = Validator.simulate;
  Validator.simulate = function (A, ai, tx, ty, m, D, markBox, jumpBoost, f) {
    if (A.seatsCells && A.seatsCells.has(tx + ',' + ty) && !SOLID[tileAt(A, tx, ty)] && tileAt(A, tx, ty) !== T.SEMI && (m.off || m.mash || m.delay || m.reverseAt || m.stopAt || m.hold === 0.22)) return null;
    return sim0.call(this, A, ai, tx, ty, m, D, markBox, jumpBoost, f);
  };
}

Object.assign(TourLandscape.ARCH_LABEL, { roundpole: 'SCAFFOLD' });
Object.assign(Tour.seatsKit, { NET, netAt, holeAt, gripY, SeatsScaffold, SeatsMirrorCrab });
})();
