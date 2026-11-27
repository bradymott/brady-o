/* ============================================================
   WRONG SIDE OF THE WASH: the drying nets (26-1 PEG LEGWORK, arch 'netclimb'; the boss's lead-in uses them too).
   A drying net is a big checked cloth in a knotted cream frame, hung across a gap between two roofs. It has two
   faces: the near one (Brady climbs in front of it, the net behind his knuckles) and the far one (Brady behind it,
   the cloth in front of him, seen through the checks).
     - PUSH UP into a net to grip it (from the ground or in the air). Then the stick climbs in all four directions.
     - JUMP at a TORN SQUARE (a hole in the cloth) squeezes through to the other face.
     - JUMP anywhere else lets go with a real jump (hold DOWN as you press JUMP to just drop).
     - Critters crawl on one face. Only a critter on Brady's face can touch him: climb round it, or go through a
       hole to the other face and pass it there. A critter on the far face shows as one broad hatched silhouette.
     - A PEG BEETLE hung by his enormous trousers blocks both faces (a wall across the net). His peg is on the FAR
       side: go round the back, climb up to the peg and press THROW to squeeze it. Down he goes.
   The game and the level checker: the checker sees a net as a grid of spots joined to their four neighbours (one-way
   edges: climbing), entered from the ground or by a jump of up to three rows (Validator.run, below). Letting go is the
   engine's own jump from that spot, which is what the checker's searches start with. The beetle's trouser wall is a
   lock; its peg a virtual key at the spot beside it.
   ============================================================ */
(function () {
const WK = Tour.washKit, INK = WK.INK, WA = WK.WashArt;
const NET = { climb: 3.6 * TS, climbRun: 4.6 * TS, grip: 8, cross: 0.32, holeR: 0.8 * TS, cool: 0.32 };

/* ---------------- the net's geometry ---------------- */
const netsOf = A => { if (!A || !A.zones) return null; if (A.__washNets && A.__washNetsN === A.zones.length) return A.__washNets; A.__washNets = A.zones.filter(z => z.kind === 'washNet'); A.__washNetsN = A.zones.length; return A.__washNets; };
const gripY = p => p.y + NET.grip;
const netAt = (A, x, y) => { const L = netsOf(A); if (!L) return null; for (const z of L) if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z; return null; };
// the torn square nearest the grip point (within reach), or null
const holeAt = (z, x, y) => { let best = null, bd = NET.holeR; for (const [hx, hy] of z.holes || []) { const cx = hx * TS + TS / 2, cy = hy * TS + TS / 2, d = Math.hypot(cx - x, cy - y); if (d < bd) { bd = d; best = [hx, hy]; } } return best; };
const washOf = p => p.wash || (p.wash = { grip: null, face: 0, crossT: 0, cool: 0, ph: 0 });

/* ---------------- the physics (the game: Brady only; the checker's sims never grip) ---------------- */
{
  const ppf = playerPhysicsFlip;
  const quiet = () => ({ jump: false, bonks: null, landed: false, swim: false });
  playerPhysicsFlip = function (p, inp, A, dt, platforms, opts) {
    if (!(opts && opts.live) || !A || !netsOf(A) || !netsOf(A).length) { if (p.wash) p.wash.grip = null; return ppf(p, inp, A, dt, platforms, opts); }
    const W = washOf(p);
    if (W.area !== A) { W.area = A; W.grip = null; W.face = 0; W.crossT = 0; }
    if (W.cool > 0) W.cool -= dt;
    if (!W.grip) {
      // push up into a net to grip it (not in water, not mid-cross)
      const z = W.cool <= 0 && inp.up && !p.inWater ? netAt(A, p.x + p.w / 2, gripY(p)) : null;
      if (!z) return ppf(p, inp, A, dt, platforms, opts);
      W.grip = z; W.face = 0; p.vx = 0; p.vy = 0; p.onGround = false; p.jumping = false; p.ride = null;
      TourKit.sfx('grip', 'select', { vol: 0.3, pitch: 1.6 });
    }
    const z = W.grip, ev = quiet();
    // squeezing through a torn square to the other face
    if (W.crossT > 0) {
      W.crossT -= dt; p.vx = 0; p.vy = 0;
      if (W.crossT <= 0) { W.face ^= 1; W.crossT = 0; W.justCrossed = 0.4; }
      return ev;
    }
    if (W.justCrossed > 0) W.justCrossed -= dt;
    if (inp.jumpPressed) {
      const h = holeAt(z, p.x + p.w / 2, gripY(p));
      if (h) {
        W.crossT = NET.cross; W.hole = h;
        p.x = h[0] * TS + TS / 2 - p.w / 2; p.y = h[1] * TS + TS / 2 - NET.grip - 6;
        if (!regionFree(A, p.x, p.y, p.w, p.h)) p.y = h[1] * TS + TS / 2 - NET.grip;
        TourKit.sfx('rip', 'kick', { vol: 0.35, pitch: 1.8 });
        return ev;
      }
      // let go: a real jump from right here (or, holding DOWN, just drop)
      W.grip = null; W.cool = NET.cool; W.face = 0;
      if (inp.down) { p.onGround = false; p.vy = 0; p.coyote = 0; return ppf(p, Object.assign({}, inp, { jumpPressed: false, jump: false }), A, dt, platforms, opts); }
      p.onGround = true; p.coyote = PHYS.coyote; p.jumpBuf = 0;
      return ppf(p, inp, A, dt, platforms, opts);
    }
    // climbing: the stick, four ways (RUN climbs a little faster)
    const dx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), dy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    const sp = inp.action ? NET.climbRun : NET.climb;
    if (dx) p.facing = dx;
    p.vx = dx * sp; p.vy = dy * sp;
    const x0 = p.x, y0 = p.y;
    moveBody(p, A, dt, { semis: false, hidden: true });
    // the grip point stays on the cloth
    const gx = clamp(p.x + p.w / 2, z.x + 3, z.x + z.w - 3), gy = clamp(gripY(p), z.y + 2, z.y + z.h - 2);
    const nx = gx - p.w / 2, ny = gy - NET.grip;
    if (regionFree(A, nx, ny, p.w, p.h)) { p.x = nx; p.y = ny; } else if (!regionFree(A, p.x, p.y, p.w, p.h)) { p.x = x0; p.y = y0; }
    W.ph += (Math.abs(p.x - x0) + Math.abs(p.y - y0)) * 0.12;
    // down at the bottom edge (or feet on the floor) lets go
    if (dy > 0 && (gy >= z.y + z.h - 3 || p.onGround)) { W.grip = null; W.cool = NET.cool; W.face = 0; }
    if (W.grip) { p.onGround = false; p.jumping = false; p.coyote = 0; p.jumpBuf = 0; p.vy = 0; }
    return ev;
  };
}
// the climbing pose: hand over hand, knees bent
{
  const bp0 = bradyPose;
  bradyPose = function (anim, small) {
    if (anim.state !== 'washClimb') return bp0(anim, small);
    const P = bp0(Object.assign({}, anim, { state: 'hang' }), small), s = Math.sin(anim.phase || 0);
    P.uaF = 2.75 + s * 0.35; P.faF = 3.05 + s * 0.3; P.uaB = 2.75 - s * 0.35; P.faB = 3.05 - s * 0.3;
    P.thF = 0.55 + s * 0.35; P.shF = -0.45; P.thB = 0.55 - s * 0.35; P.shB = -0.45; P.lean = 0; P.bob = 0;
    if (anim.cross) { P.mouth = 'o'; }
    return P;
  };
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    up0.call(this, dt, inp);
    const W = this.wash;
    if (W && W.grip && this.state === 'play' && !this.dead) { this.anim.state = 'washClimb'; this.anim.phase = W.ph; this.anim.cross = W.crossT > 0; }
  };
  const dr0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx, t) {
    const W = this.wash;
    if (!(W && W.grip) || this.dead) return dr0.call(this, ctx, t);
    // squeezing through: he narrows to a sliver and widens on the other side
    if (W.crossT > 0) {
      const k = W.crossT / NET.cross, sx = Math.max(0.08, Math.abs(k * 2 - 1));
      ctx.save(); ctx.translate(this.cx, this.cy); ctx.scale(sx, 1); ctx.translate(-this.cx, -this.cy); dr0.call(this, ctx, t); ctx.restore();
      return;
    }
    // on the far face the cloth passes in front of him: he shows through the checks (his bun and glasses still read),
    // and any near-face critter is in front of him too
    if (W.face === 1) { ctx.save(); ctx.globalAlpha = 0.58; dr0.call(this, ctx, t); ctx.restore(); }
    else dr0.call(this, ctx, t);
    if (W.face === 1) {
      const x = this.x - 22, y = this.y - 26, w = this.w + 44, h = this.h + 30;
      for (const e of this.g.entities) if (e.isWashCrawler && e.face === 0 && !e.remove && overlap(e, { x, y, w, h })) e.draw(ctx);
    }
  };
}

/* ---------------- the net entity: draws the cloth, its far-face critters, its torn squares ---------------- */
class WashNet extends Ent {
  constructor(g, s) {
    super(g, s, s.w * TS, s.h * TS); this.back = true;
    this.x = s.tx * TS; this.y = s.ty * TS; this.holes = s.holes || []; this.nid = s.nid; this.cache = null; this.posts = s.posts !== false;
  }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  // the cloth, painted once in world coordinates (cream with navy checks sewn in panels, a knotted cream rope frame,
  // the torn squares cut out)
  paintCloth(c, x, y, w, h) {
    c.save();
    c.beginPath(); c.rect(x, y, w, h);
    for (const [hx, hy] of this.holes) this.tornPath(c, hx * TS + TS / 2, hy * TS + TS / 2, hx * 7 + hy);
    c.clip('evenodd');
    // panels about six squares wide, each a slightly different cream, the checks lined up across the whole net
    const PW = 6 * TS;
    for (let px = x, k = 0; px < x + w; px += PW, k++) {
      c.globalAlpha = 0.84; WA.gingham(c, px, y, Math.min(PW, x + w - px), h, 12, k % 2 ? 0.44 : 0.52, k % 2 ? '#ece0c4' : '#f4ead2');
    }
    c.globalAlpha = 1;
    // the seams between the panels: a stitched line
    c.lineWidth = 1.6;
    for (let px = x + PW; px < x + w - 8; px += PW) { c.strokeStyle = 'rgba(26,20,38,0.45)'; c.beginPath(); c.moveTo(px, y); c.lineTo(px, y + h); c.stroke(); c.strokeStyle = '#fff4dc'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(px + 3, y); c.lineTo(px + 3, y + h); c.stroke(); c.setLineDash([]); }
    // soft folds
    c.strokeStyle = 'rgba(140,120,90,0.18)'; c.lineWidth = 2; for (let xx = x + 40; xx < x + w; xx += 70) { c.beginPath(); c.moveTo(xx, y); c.quadraticCurveTo(xx + 10, y + h / 2, xx - 6, y + h); c.stroke(); }
    c.restore();
    // the torn edges: a dark gap, a frayed cream rim
    for (const [hx, hy] of this.holes) {
      const cx = hx * TS + TS / 2, cy = hy * TS + TS / 2;
      c.save(); c.beginPath(); this.tornPath(c, cx, cy, hx * 7 + hy); c.strokeStyle = 'rgba(30,20,40,0.35)'; c.lineWidth = 7; c.stroke();
      c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
      c.strokeStyle = '#fff8ea'; c.lineWidth = 1.4; c.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, r = 17; c.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); c.lineTo(cx + Math.cos(a) * (r + 5), cy + Math.sin(a) * (r + 5)); } c.stroke();
      c.restore();
    }
    // the knotted cream rope frame
    c.save(); c.strokeStyle = INK; c.lineWidth = 7; c.strokeRect(x + 2, y + 2, w - 4, h - 4);
    c.strokeStyle = '#efe2c4'; c.lineWidth = 4.5; c.strokeRect(x + 2, y + 2, w - 4, h - 4);
    c.strokeStyle = 'rgba(160,130,90,0.6)'; c.lineWidth = 1; c.setLineDash([3, 4]); c.strokeRect(x + 2, y + 2, w - 4, h - 4); c.setLineDash([]);
    c.fillStyle = '#efe2c4'; c.strokeStyle = INK; c.lineWidth = 1.6;
    for (const [kx, ky] of [[x + 3, y + 3], [x + w - 3, y + 3], [x + 3, y + h - 3], [x + w - 3, y + h - 3]]) { c.beginPath(); c.arc(kx, ky, 7, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(kx + 2, ky - 1, 3, 0, TAU); c.stroke(); }
    c.restore();
  }
  tornPath(c, cx, cy, seed) {
    c.moveTo(cx + 15, cy);
    for (let k = 1; k <= 12; k++) { const a = k / 12 * TAU, r = (k % 2 ? 11 : 16) + ((seed * 13 + k * 7) % 5) - 2; c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    c.closePath();
  }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h, g = this.g, t = this.t;
    // the posts the net hangs from, and the lines from its top corners
    if (this.posts) {
      ctx.save(); ctx.strokeStyle = '#8a7a62'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x - 10, y - 26); ctx.moveTo(x + w - 4, y + 4); ctx.lineTo(x + w + 10, y - 26); ctx.stroke();
      WA.peg(ctx, x - 10, y - 18, 0.7, -0.3); WA.peg(ctx, x + w + 10, y - 18, 0.7, 0.3);
      ctx.restore();
    }
    // the cloth (cached)
    if (typeof document !== 'undefined') {
      if (!this.cache) { const c = document.createElement('canvas'); c.width = Math.ceil(w + 24); c.height = Math.ceil(h + 24); const cx2 = c.getContext('2d'); cx2.translate(12 - x, 12 - y); this.paintCloth(cx2, x, y, w, h); this.cache = c; }
      ctx.drawImage(this.cache, x - 12, y - 12);
    } else this.paintCloth(ctx, x, y, w, h);
    // the far-face critters show through the cloth: one broad hatched silhouette each, their peg in colour
    for (const e of g.entities) if (e.isWashCrawler && e.face === 1 && e.nid === this.nid && !e.remove && !e.dead) e.drawFar(ctx);
    // the buttons sewn on the cloth (coins) stay in front of it
    const A = g.area, cd = Tour.countries.wash && Tour.countries.wash.coin;
    if (A && cd) for (let ty = Math.floor(y / TS); ty < Math.ceil((y + h) / TS); ty++) for (let tx = Math.floor(x / TS); tx < Math.ceil((x + w) / TS); tx++) if (A.tiles[ty * A.W + tx] === T.PICK) cd.draw(ctx, tx * TS + TS / 2, ty * TS + TS / 2 + Math.sin(t * 3 + tx) * 1.5);
    // the torn square Brady could squeeze through glows while he holds the net near it
    const p = g.player, W = p && p.wash;
    if (W && W.grip && W.grip.nid === this.nid && !(W.crossT > 0)) {
      const hh = holeAt(W.grip, p.x + p.w / 2, gripY(p));
      if (hh) { const cx = hh[0] * TS + TS / 2, cy = hh[1] * TS + TS / 2, k = 0.5 + 0.5 * Math.sin(t * 8); ctx.save(); ctx.strokeStyle = `rgba(255,216,74,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 20 + k * 3, 0, TAU); ctx.stroke(); ctx.restore(); }
    }
  }
}

/* ---------------- critters on a net: one face each ---------------- */
// { nid, face, kind: 'beetle' | 'moth', ax / ay (tiles to patrol along x / y), speed (tiles/s), phase }
class WashCrawler extends Ent {
  constructor(g, s) {
    super(g, s, 26, 30); this.enemy = true; this.customCollide = true; this.isWashCrawler = true;
    this.nid = s.nid; this.face = s.face || 0; this.kind = s.kind || 'beetle';
    this.x0 = s.x - 13; this.y0 = s.y - TS - 14; this.ax = (s.ax || 0) * TS; this.ay = (s.ay || 0) * TS; this.sp = s.speed || 1.2; this.ph = s.phase || 0;
    this.len = Math.max(1, Math.abs(this.ax) + Math.abs(this.ay)); this.u = 0; this.dirU = 1; this.dir = this.ax < 0 ? -1 : 1; this.nib = 0; this.place();
  }
  place() { this.x = this.x0 + this.ax * this.u; this.y = this.y0 + this.ay * this.u; }
  update(dt) {
    this.t += dt;
    if (this.dead) { this.vy = (this.vy || 0) + PHYS.gDown * dt; this.y += this.vy * dt; if (this.y > this.g.area.H * TS + 60) this.remove = true; return; }
    // a moth stops now and then to nibble a peephole and peer through it (the pause is the tell that it moves on)
    if (this.kind === 'moth') {
      if (this.nib > 0) { this.nib -= dt; return; }
      if (Math.floor((this.t + this.ph) / 3.2) !== Math.floor((this.t + this.ph - dt) / 3.2)) { this.nib = 1.0; if (this.g.onScreen(this) && this.face === 0) this.g.parts.text(this.cx, this.y - 6, 'NIBBLE...', WK.WashArt.CREAM); return; }
    }
    this.u += this.dirU * this.sp * TS * dt / this.len;
    if (this.u >= 1) { this.u = 1; this.dirU = -1; } if (this.u <= 0) { this.u = 0; this.dirU = 1; }
    if (this.ax) this.dir = sign(this.ax) * this.dirU;
    this.place();
  }
  // only a critter on Brady's face can touch him (Brady off the net is on the near face)
  collidePlayer(p) {
    if (this.dead || !overlap(p, this)) return;
    const W = p.wash, onNet = !!(W && W.grip), face = onNet ? W.face : 0;
    if (face !== this.face || (W && W.crossT > 0)) return;
    if (p.star > 0) { this.knock(); return; }
    if (!onNet && p.vy > 0 && p.prevBottom <= this.y + 12) { this.knock(); p.vy = -PHYS.stompV; p.jumping = true; this.g.addScore(100, this.cx, this.y); return; }
    p.hurt(this);
  }
  knock() { if (this.dead) return; this.dead = true; this.vy = -4 * TS; Sound.play('stomp'); this.g.burst(this.cx, this.cy, 8, '#ffffff', 'dust'); if (this.kind === 'beetle') this.g.parts.text(this.cx, this.y - 8, 'MY TROUSERS!', '#ffffff'); }
  hit(kind) { if (this.face === 1 && kind !== 'star') return false; this.knock(); return true; }
  touchPlayer() {}
  art(c, x, y, mode) { const A = this.kind === 'moth' ? WK.mothArt : WK.beetleArt; A(c, this, x, y, mode, this.t); }
  draw(ctx) {
    if (this.face === 1 && !this.dead) return;   // drawn by its net, behind the cloth
    const x = this.cx, y = this.y + this.h, mode = this.nib > 0 ? 'notice' : 'walk';
    Ink.around(ctx, this.x - 22, this.y - 30, this.w + 44, this.h + 40, c => { c.save(); if (this.dead) { c.translate(x, this.cy); c.rotate(Math.PI); c.translate(-x, -this.cy); } this.art(c, x, y, mode); c.restore(); }, { pad: 4 });
    if (this.nib > 0 && !this.dead) WA.peephole(ctx, this.cx + this.dir * 10, this.y + 6, this.t, true);
  }
  // behind the cloth: one broad hatched silhouette, the peg (beetle) in colour so it can be picked out
  drawFar(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t;
    ctx.save();
    const body = () => { ctx.beginPath(); ctx.ellipse(x, y - 15, 18, 17, 0, 0, TAU); if (this.kind === 'moth') { ctx.moveTo(x - 6, y - 18); ctx.ellipse(x - 16, y - 20, 12, 7, -0.5 + Math.sin(t * 8) * 0.2, 0, TAU); ctx.moveTo(x + 26, y - 20); ctx.ellipse(x + 16, y - 20, 12, 7, 0.5 - Math.sin(t * 8) * 0.2, 0, TAU); } else { ctx.moveTo(x + 18, y - 30); ctx.ellipse(x + 12, y - 33, 6, 9, 0.5, 0, TAU); } };
    ctx.fillStyle = 'rgba(28,24,52,0.5)'; body(); ctx.fill();
    ctx.save(); body(); ctx.clip();
    ctx.strokeStyle = 'rgba(28,24,52,0.55)'; ctx.lineWidth = 2; for (let k = -50; k < 50; k += 5) { ctx.beginPath(); ctx.moveTo(x + k, y - 40); ctx.lineTo(x + k + 34, y + 6); ctx.stroke(); }
    ctx.restore();
    if (this.kind === 'beetle') WA.peg(ctx, x - 12, y - 6, 0.8, -1.1); else { ctx.fillStyle = '#ffffff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * 4, y - 22, 2.6, 0, TAU); ctx.fill(); } }
    ctx.restore();
  }
}

/* ---------------- the Peg Beetle's trouser wall (both faces), squeezed from behind ---------------- */
// a lock spawn (B.lock) turned into this: { id, h, side (-1: Brady comes from the left), clipY (tile row of the peg) }
class WashBeetleGate extends Ent {
  constructor(g, s) {
    super(g, s, TS, (s.h || 4) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; this.id = s.id; this.side = s.side || -1;
    this.tiles = []; const tx = Math.floor(s.x / TS), ty1 = Math.floor((s.y - 1) / TS); for (let k = 0; k < (s.h || 4); k++) this.tiles.push([tx, ty1 - k]);
    this.clipY = s.clipY != null ? s.clipY : ty1 - (s.h || 4) + 1; this.open = false; this.fall = 0; this.vy = 0; this.msgT = 0;
  }
  // the peg (on the far face, at the top of the trousers): where Brady squeezes it from
  clipBox() { return { x: this.x + this.side * TS * 1.2 - 6, y: this.clipY * TS - TS * 0.5, w: TS + 12, h: TS * 2 }; }
  update(dt) {
    this.t += dt; if (this.msgT > 0) this.msgT -= dt;
    const g = this.g, p = g.player;
    if (this.open) { this.vy += PHYS.gDown * 0.6 * dt; this.fall += this.vy * dt; return; }
    if (g.keys && g.keys.has(this.id)) { this.release(); return; }
    if (!p || p.dead) return;
    const W = p.wash, near = overlap(p, this.clipBox());
    if (near && W && W.grip && W.face === 1 && p.inp && p.inp.actionPressed) { g.keys.add(this.id); this.release(); return; }
    // the near face: he says where the peg is
    if (near && (!W || W.face !== 1) && this.msgT <= 0) { this.msgT = 3; g.parts.text(this.cx, this.y - 10, 'MY PEG IS ROUND THE BACK!', WK.WashArt.CREAM); }
  }
  release() {
    if (this.open) return; this.open = true; this.vy = -3 * TS;
    for (const [x, y] of this.tiles) this.g.setTile(x, y, T.EMPTY);
    Sound.play('door', { vol: 0.6 }); TourKit.sfx('snap', 'kick', { vol: 0.5, pitch: 1.4 });
    this.g.burst(this.cx, this.y, 16, WK.WashArt.CREAM, 'confetti'); this.g.parts.text(this.cx, this.y - 12, 'MY TROUSERS!', '#ffffff');
    this.g.addScore(500, this.cx, this.y);
  }
  touchPlayer(p) {}
  draw(ctx) {
    const x = this.cx, top = this.y + this.fall, h = this.h, t = this.t, g = this.g, p = g.player, W = p && p.wash, far = !!(W && W.grip && W.face === 1);
    if (top > g.camY + Game.viewH + 200) return;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the trousers: two enormous cream legs hanging the whole height of the net, braces up to the beetle
    const sway = this.open ? 0 : Math.sin(t * 1.6) * 2;
    ctx.fillStyle = WK.WashArt.CREAM;
    ctx.beginPath(); ctx.moveTo(x - 17, top + 8); ctx.lineTo(x + 17, top + 8); ctx.lineTo(x + 16 + sway, top + h); ctx.lineTo(x + 2 + sway, top + h); ctx.lineTo(x, top + h * 0.45); ctx.lineTo(x - 2 + sway, top + h); ctx.lineTo(x - 16 + sway, top + h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(140,120,90,0.4)'; ctx.lineWidth = 1.4; for (let k = 1; k < 6; k++) { ctx.beginPath(); ctx.moveTo(x - 14, top + 8 + k * h / 6); ctx.quadraticCurveTo(x - 8, top + 12 + k * h / 6, x - 4, top + 6 + k * h / 6); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the beetle at the top (upside down in his own trousers, waving)
    ctx.save(); ctx.translate(x, top + 6); if (!this.open) ctx.rotate(Math.sin(t * 2) * 0.1);
    WK.beetleArt(ctx, { dir: 1, fleece: 0 }, 0, 26, this.open ? 'walk' : 'notice', t);
    ctx.restore();
    // the peg on the far side, clipping the waistband to the net: through the cloth from the near face, bright from behind
    const py = this.clipY * TS + 10 + this.fall;
    if (!this.open) {
      ctx.save(); ctx.globalAlpha = far ? 1 : 0.45;
      WA.peg(ctx, x + this.side * 4, py + 22, 1.3, 0);
      ctx.restore();
      if (far && p && overlap(p, this.clipBox())) { const k = 0.5 + 0.5 * Math.sin(t * 8); ctx.fillStyle = `rgba(255,216,74,${0.6 + 0.4 * k})`; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('THROW!', x, py - 14); }
    }
    ctx.restore();
  }
}

/* ---------------- the land's tell: a sock moth peering out of a nibbled peephole by every secret ---------------- */
class WashPeep extends Ent {
  constructor(g, s) { super(g, s, 24, 24); this.x = s.x - 12; this.y = s.y - 24 - (s.dy || 0) * TS; this.back = true; this.shy = 0; this.hanky = s.hanky !== false; }
  update(dt) { this.t += dt; const p = this.g.player; if (p && Math.abs(p.cx - this.cx) < 2.2 * TS && Math.abs(p.cy - this.cy) < 2.5 * TS) this.shy = 1.2; else if (this.shy > 0) this.shy -= dt; }
  touchPlayer() {}
  draw(ctx) {
    // a little hanky pegged up (where there is no wall to nibble), the peephole in it
    if (this.hanky) { const x = this.cx, y = this.cy; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = WK.WashArt.CREAM; ctx.beginPath(); ctx.moveTo(x - 17, y - 17); ctx.lineTo(x + 17, y - 17); ctx.lineTo(x + 15, y + 17); ctx.quadraticCurveTo(x, y + 20, x - 15, y + 17); ctx.closePath(); ctx.fill(); ctx.stroke(); WA.peg(ctx, x - 12, y - 12, 0.5); WA.peg(ctx, x + 12, y - 12, 0.5); ctx.restore(); }
    WA.peephole(ctx, this.cx, this.cy, this.t, this.shy > 0);
  }
}
Object.assign(ENTITY_TYPES, { washNet: WashNet, washCrawler: WashCrawler, washBeetleGate: WashBeetleGate, washPeep: WashPeep });

/* ---------------- the pieces ---------------- */
let netN = 0;
Object.assign(Tour.pieces, {
  // a drying net with its top-left cell at the letter: { w, h, holes: [[dx, dy], ...] (relative), posts }
  'wash.net'(st, o) {
    const B = st.B, x0 = st.x, y0 = st.gy - 1, nid = 'n' + (++netN), holes = (o.holes || []).map(([dx, dy]) => [x0 + dx, y0 + dy]);
    B.zone(x0, y0, o.w, o.h, 0, 0, 0, 'washNet', { holes, nid, pulse: true });   // pulse: the checker's search leaves it out of its zone list (no force, and no extra hover tries per spot)
    B.spawn('washNet', x0, y0, { tx: x0, ty: y0, w: o.w, h: o.h, holes, nid, posts: o.posts });
    return st.x;
  },
  // a critter on the net it sits on: { face, kind, ax, ay, speed, phase }
  'wash.crawler'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1;
    const z = B.zones.find(q => q.kind === 'washNet' && x * TS >= q.x && x * TS < q.x + q.w && y * TS >= q.y && y * TS < q.y + q.h);
    B.spawn('washCrawler', x, y, { nid: z ? z.nid : null, face: o.face || 0, kind: o.kind || 'beetle', ax: o.ax || 0, ay: o.ay || 0, speed: o.speed || 1.2, phase: o.phase || 0 });
    return st.x;
  },
  // the Peg Beetle's trouser wall: the letter is its top cell; { h, side, id } (the lock: 'wash:<id>', the key: the
  // spot beside the peg on Brady's side)
  'wash.beetle'(st, o) {
    const B = st.B, x = st.x, y0 = st.gy - 1, h = o.h || 5, id = 'wash:' + (o.id || 'beetle' + x), side = o.side || -1;
    B.lock(x, y0, y0 + h - 1, id, 'washTrousers');
    const s = B.spawns[B.spawns.length - 1]; s.type = 'washBeetleGate'; s.side = side; s.clipY = y0 + (o.clip || 1);
    // the checker: the peg is squeezed from the spot beside it (the far face is reached through the net's holes)
    const cy = y0 + (o.clip || 1);
    B.vkey(id, [[x + side, cy], [x + side, cy + 1]], 'any');
    return st.x;
  },
  // the tell by a secret: { dy (rows up from the letter) }
  'wash.peep'(st, o) { st.B.spawn('washPeep', st.x, st.gy - 1, { dy: o.dy || 0, hanky: o.hanky }); return st.x; }
});

/* ---------------- the level checker: a net is a grid of climbing spots ---------------- */
{
  const run0 = Validator.run;
  Validator.run = function (level, opts) {
    level.areas.forEach((a, ai) => {
      if (a.washNetEdges) return;
      const nets = (a.zones || []).filter(z => z.kind === 'washNet'); if (!nets.length) return;
      a.washNetEdges = true; a.edges = a.edges || []; a.washCells = a.washCells || new Set();
      const A = this.proxyArea(a, 0), sol = (x, y) => !!SOLID[tileAt(A, x, y)];
      for (const z of nets) {
        const tx0 = Math.round(z.x / TS), tx1 = Math.round((z.x + z.w) / TS) - 1, gy0 = Math.round(z.y / TS), gy1 = Math.round((z.y + z.h) / TS) - 1;
        const isNode = (x, gr) => x >= tx0 && x <= tx1 && gr >= gy0 && gr <= gy1;
        // node (x, gr) = Brady holding the net with his hands in row gr: his feet are at row gr + 2
        for (let gr = gy0; gr <= gy1; gr++) for (let x = tx0; x <= tx1; x++) {
          const fy = gr + 2; a.washCells.add(x + ',' + fy);
          for (const [dx, dg] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (isNode(x + dx, gr + dg)) a.edges.push({ from: [x, fy - 1], to: [x + dx, fy + dg] });
        }
        // in from below: standing under the net (his hands already in it is the same spot) or a jump of up to three rows
        // (or from a roof beside it: a hop of up to two columns sideways)
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
  // the proxy keeps the climbing spots; from one, the search tries the ways a player lets go of a net (a jump short or
  // long, any way, or a drop) and leaves out the ground-only tries (run-ups, edge nudges, delayed jumps): fewer tries,
  // never more than the player can do
  const px0 = Validator.proxyArea;
  Validator.proxyArea = function (area, mask) { const A = px0.call(this, area, mask); if (area.washCells) A.washCells = area.washCells; return A; };
  const sim0 = Validator.simulate;
  Validator.simulate = function (A, ai, tx, ty, m, D, markBox, jumpBoost, f) {
    if (A.washCells && A.washCells.has(tx + ',' + ty) && !SOLID[tileAt(A, tx, ty)] && tileAt(A, tx, ty) !== T.SEMI && (m.off || m.mash || m.delay || m.reverseAt || m.stopAt || m.hold === 0.22)) return null;
    return sim0.call(this, A, ai, tx, ty, m, D, markBox, jumpBoost, f);
  };
}

/* ---------------- 26-1's level type ---------------- */
Object.assign(TourLandscape.ARCH_LABEL, { netclimb: 'NETS' });
Tour.washKit.NET = NET; Tour.washKit.netAt = netAt; Tour.washKit.holeAt = holeAt;
})();
