/* ============================================================
   THE UMBRELLA REPAIR DISTRICT: the open canopies (31-1 RIB INSPECTOR, arch 'ribcrawl').
   A repair canopy is a huge open umbrella hung up to dry across a gap, its tip in the clouds. It has two faces: the
   UNDERSIDE (Brady clings under it, the ink-blue ribs and the shaded fabric behind his knuckles) and the FABRIC SIDE
   (on top of the cloth: the marigold wedges pass in front of him and he shows through as a shadow).
     - PUSH UP into a canopy to grip its ribs (from the ground or in the air). Then the stick crawls in all four
       directions along the spokes.
     - JUMP at a coral RIVET flips Brady through to the other face.
     - JUMP anywhere else lets go with a real jump (hold DOWN as you press JUMP to just drop).
     - Rivet Ticks (and a Ferrule Ferret) crawl on one face. Only a critter on Brady's face can touch him: crawl round
       it, or flip at a rivet and pass it on the other face. A critter on the far face is one broad hatched shadow.
     - Late on, a big Rivet Tick sits wedged in the seat of a rib, legs braced across both faces (a wall). Its rib
       runs on to a coral ferrule end a few spokes away: crawl to that end, either face, and press THROW: the rib
       flexes and pops the tick out of its seat.
   The level checker sees a canopy as a grid of spots joined to their four neighbours (one-way edges: climbing), entered
   from the ground or by a jump of up to three rows. Letting go is the engine's own jump from that spot. The seated
   tick is a lock; the ferrule end a virtual key.
   The land's room tell (29_tour_y_umb.js UmbArt.ticket): a coral repair ticket pinned by a rivet near every secret.
   ============================================================ */
(function () {
const UK = Tour.umbKit, INK = UK.INK, UA = UK.UmbArt;
const CAN = { climb: 3.6 * TS, climbRun: 4.6 * TS, grip: 8, cross: 0.34, holeR: 0.8 * TS, cool: 0.32 };

/* ---------------- the canopy's geometry ---------------- */
const cansOf = A => { if (!A || !A.zones) return null; if (A.__umbCans && A.__umbCansN === A.zones.length) return A.__umbCans; A.__umbCans = A.zones.filter(z => z.kind === 'umbCanopy'); A.__umbCansN = A.zones.length; return A.__umbCans; };
const gripY = p => p.y + CAN.grip;
const canAt = (A, x, y) => { const L = cansOf(A); if (!L) return null; for (const z of L) if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z; return null; };
const rivetAt = (z, x, y) => { let best = null, bd = CAN.holeR; for (const [hx, hy] of z.holes || []) { const cx = hx * TS + TS / 2, cy = hy * TS + TS / 2, d = Math.hypot(cx - x, cy - y); if (d < bd) { bd = d; best = [hx, hy]; } } return best; };
const umbOf = p => p.umb || (p.umb = { grip: null, face: 0, crossT: 0, cool: 0, ph: 0 });

/* ---------------- the physics (the game: Brady only; the checker's sims never grip) ---------------- */
{
  const ppf = playerPhysicsFlip;
  const quiet = () => ({ jump: false, bonks: null, landed: false, swim: false });
  playerPhysicsFlip = function (p, inp, A, dt, platforms, opts) {
    if (!(opts && opts.live) || !A || !cansOf(A) || !cansOf(A).length) { if (p.umb) p.umb.grip = null; return ppf(p, inp, A, dt, platforms, opts); }
    const W = umbOf(p);
    if (W.area !== A) { W.area = A; W.grip = null; W.face = 0; W.crossT = 0; }
    if (W.cool > 0) W.cool -= dt;
    if (!W.grip) {
      const z = W.cool <= 0 && inp.up && !p.inWater ? canAt(A, p.x + p.w / 2, gripY(p)) : null;
      if (!z) return ppf(p, inp, A, dt, platforms, opts);
      W.grip = z; W.face = 0; p.vx = 0; p.vy = 0; p.onGround = false; p.jumping = false; p.ride = null;
      TourKit.sfx('grip', 'select', { vol: 0.3, pitch: 1.5 });
    }
    const z = W.grip, ev = quiet();
    if (W.crossT > 0) {
      W.crossT -= dt; p.vx = 0; p.vy = 0;
      if (W.crossT <= 0) { W.face ^= 1; W.crossT = 0; W.justCrossed = 0.4; }
      return ev;
    }
    if (W.justCrossed > 0) W.justCrossed -= dt;
    if (inp.jumpPressed) {
      const h = rivetAt(z, p.x + p.w / 2, gripY(p));
      if (h) {
        W.crossT = CAN.cross; W.hole = h;
        p.x = h[0] * TS + TS / 2 - p.w / 2; p.y = h[1] * TS + TS / 2 - CAN.grip - 6;
        if (!regionFree(A, p.x, p.y, p.w, p.h)) p.y = h[1] * TS + TS / 2 - CAN.grip;
        TourKit.sfx('flip', 'kick', { vol: 0.35, pitch: 1.9 });
        return ev;
      }
      W.grip = null; W.cool = CAN.cool; W.face = 0;
      if (inp.down) { p.onGround = false; p.vy = 0; p.coyote = 0; return ppf(p, Object.assign({}, inp, { jumpPressed: false, jump: false }), A, dt, platforms, opts); }
      p.onGround = true; p.coyote = PHYS.coyote; p.jumpBuf = 0;
      return ppf(p, inp, A, dt, platforms, opts);
    }
    const dx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), dy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    const sp = inp.action ? CAN.climbRun : CAN.climb;
    if (dx) p.facing = dx;
    p.vx = dx * sp; p.vy = dy * sp;
    const x0 = p.x, y0 = p.y;
    moveBody(p, A, dt, { semis: false, hidden: true });
    const gx = clamp(p.x + p.w / 2, z.x + 3, z.x + z.w - 3), gy = clamp(gripY(p), z.y + 2, z.y + z.h - 2);
    const nx = gx - p.w / 2, ny = gy - CAN.grip;
    if (regionFree(A, nx, ny, p.w, p.h)) { p.x = nx; p.y = ny; } else if (!regionFree(A, p.x, p.y, p.w, p.h)) { p.x = x0; p.y = y0; }
    W.ph += (Math.abs(p.x - x0) + Math.abs(p.y - y0)) * 0.12;
    if (dy > 0 && (gy >= z.y + z.h - 3 || p.onGround)) { W.grip = null; W.cool = CAN.cool; W.face = 0; }
    if (W.grip) { p.onGround = false; p.jumping = false; p.coyote = 0; p.jumpBuf = 0; p.vy = 0; }
    return ev;
  };
}
// the crawling pose: hand over hand, knees bent
{
  const bp0 = bradyPose;
  bradyPose = function (anim, small) {
    if (anim.state !== 'umbClimb') return bp0(anim, small);
    const P = bp0(Object.assign({}, anim, { state: 'hang' }), small), s = Math.sin(anim.phase || 0);
    P.uaF = 2.75 + s * 0.35; P.faF = 3.05 + s * 0.3; P.uaB = 2.75 - s * 0.35; P.faB = 3.05 - s * 0.3;
    P.thF = 0.55 + s * 0.35; P.shF = -0.45; P.thB = 0.55 - s * 0.35; P.shB = -0.45; P.lean = 0; P.bob = 0;
    if (anim.cross) P.mouth = 'o';
    return P;
  };
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    up0.call(this, dt, inp);
    const W = this.umb;
    if (W && W.grip && this.state === 'play' && !this.dead) { this.anim.state = 'umbClimb'; this.anim.phase = W.ph; this.anim.cross = W.crossT > 0; }
  };
  const dr0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx, t) {
    const W = this.umb;
    if (!(W && W.grip) || this.dead) return dr0.call(this, ctx, t);
    if (W.crossT > 0) {
      const k = W.crossT / CAN.cross, sx = Math.max(0.08, Math.abs(k * 2 - 1));
      ctx.save(); ctx.translate(this.cx, this.cy); ctx.scale(sx, 1); ctx.translate(-this.cx, -this.cy); dr0.call(this, ctx, t); ctx.restore();
      return;
    }
    // on the fabric side the cloth is in front of him: he shows through as a soft shadow (his bun and glasses still
    // read), a marigold glaze over him; any underside critter close by is drawn over him too
    if (W.face === 1) {
      ctx.save(); ctx.globalAlpha = 0.6; dr0.call(this, ctx, t); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = UA.GOLD; ctx.beginPath(); ctx.ellipse(this.cx, this.cy - 4, this.w * 0.9 + 6, this.h * 0.62 + 6, 0, 0, TAU); ctx.fill(); ctx.restore();
      const x = this.x - 22, y = this.y - 26, w = this.w + 44, h = this.h + 30;
      for (const e of this.g.entities) if (e.isUmbCrawler && e.face === 0 && !e.remove && overlap(e, { x, y, w, h })) e.draw(ctx);
    } else dr0.call(this, ctx, t);
  };
}

/* ---------------- the canopy entity: the cloth, its ribs, the far-face critters, the rivets ---------------- */
class UmbCanopy extends Ent {
  constructor(g, s) {
    super(g, s, s.w * TS, s.h * TS); this.back = true;
    this.x = s.tx * TS; this.y = s.ty * TS; this.holes = s.holes || []; this.cid = s.cid; this.cache = null; this.seed = s.tx;
  }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  // the cloth seen from underneath: wedges between ink-blue ribs fanning from a hub above, a scalloped hem with coral
  // ferrules at the rib tips; the rivets are coral studs where two spokes cross (painted once, world coordinates)
  paintCloth(c, x, y, w, h) {
    c.save();
    const n = Math.max(4, Math.round(w / (3 * TS))), hubX = x + w / 2, hubY = y - h * 0.55, tips = [];
    for (let k = 0; k <= n; k++) tips.push([x + (w * k) / n, y + h]);
    const edge = (c2) => { c2.moveTo(x, y + h); for (let k = 0; k < n; k++) { const [ax] = tips[k], [bx] = tips[k + 1]; c2.quadraticCurveTo((ax + bx) / 2, y + h - 16, bx, y + h); } };
    // the dome: a shallow arc over the top
    c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + 6); c.quadraticCurveTo(x + w / 2, y - 18, x + w, y + 6); c.lineTo(x + w, y + h);
    for (let k = n; k > 0; k--) { const [ax] = tips[k], [bx] = tips[k - 1]; c.quadraticCurveTo((ax + bx) / 2, y + h - 16, bx, y + h); }
    c.closePath(); c.save(); c.clip();
    // the wedges (shaded: the underside), alternating
    for (let k = 0; k < n; k++) {
      const [ax] = tips[k], [bx] = tips[k + 1];
      c.fillStyle = k % 2 ? '#d99a24' : '#e9ac36';
      c.beginPath(); c.moveTo(hubX, hubY); c.lineTo(ax, y + h + 4); c.lineTo(bx, y + h + 4); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,240,200,0.18)'; c.beginPath(); c.moveTo(hubX, hubY); c.lineTo((ax * 2 + bx) / 3, y + h); c.lineTo((ax + bx * 2) / 3, y + h); c.closePath(); c.fill();
    }
    // a soft shadow toward the top (under the dome) and patches sewn on here and there
    const gr = c.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(40,30,70,0.32)'); gr.addColorStop(0.5, 'rgba(40,30,70,0.08)'); gr.addColorStop(1, 'rgba(40,30,70,0)');
    c.fillStyle = gr; c.fillRect(x, y - 20, w, h + 20);
    for (let k = 0; k < Math.floor(w / 140); k++) { const px = x + 40 + ((this.seed * 37 + k * 113) % Math.max(1, w - 80)), py = y + 30 + ((this.seed * 17 + k * 71) % Math.max(1, h - 60)); c.fillStyle = 'rgba(239,111,90,0.5)'; c.fillRect(px, py, 18, 14); c.strokeStyle = 'rgba(26,24,48,0.5)'; c.lineWidth = 1; c.setLineDash([3, 2]); c.strokeRect(px, py, 18, 14); c.setLineDash([]); }
    // the ribs (spokes) from the hub, and the stretchers across them (rungs to grip)
    c.strokeStyle = INK; c.lineWidth = 5.5; for (const [tx] of tips) { c.beginPath(); c.moveTo(hubX, hubY); c.lineTo(tx, y + h); c.stroke(); }
    c.strokeStyle = UA.NAVY_L; c.lineWidth = 3; for (const [tx] of tips) { c.beginPath(); c.moveTo(hubX, hubY); c.lineTo(tx, y + h); c.stroke(); }
    for (let yy = y + 2.5 * TS; yy < y + h - TS; yy += 3 * TS) { const k = (yy - hubY) / (y + h - hubY); c.strokeStyle = 'rgba(31,42,86,0.55)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(hubX + (tips[0][0] - hubX) * k, yy); c.lineTo(hubX + (tips[n][0] - hubX) * k, yy); c.stroke(); }
    c.restore();
    // the hem: ink edge, the ferrules
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); edge(c); c.stroke();
    c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + 6); c.quadraticCurveTo(x + w / 2, y - 18, x + w, y + 6); c.lineTo(x + w, y + h); c.stroke();
    for (const [tx, ty] of tips) { c.fillStyle = UA.CORAL; c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(tx - 4, ty - 2); c.lineTo(tx + 4, ty - 2); c.lineTo(tx, ty + 10); c.closePath(); c.fill(); c.stroke(); }
    // the rivets: big coral studs, a ring of stitching round each
    for (const [hx, hy] of this.holes) {
      const cx = hx * TS + TS / 2, cy = hy * TS + TS / 2;
      c.fillStyle = 'rgba(26,24,48,0.35)'; c.beginPath(); c.arc(cx, cy, 16, 0, TAU); c.fill();
      c.strokeStyle = '#fff4dc'; c.lineWidth = 1.6; c.setLineDash([3, 3]); c.beginPath(); c.arc(cx, cy, 14, 0, TAU); c.stroke(); c.setLineDash([]);
      UA.rivet(c, cx, cy, 9);
    }
    c.restore();
  }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h, g = this.g, t = this.t;
    // the shaft above the hub, up out of the top of the view, a cord to the sky
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + w / 2, y - 14); ctx.lineTo(x + w / 2, y - 140); ctx.stroke();
    ctx.strokeStyle = '#a0a8c0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w / 2, y - 14); ctx.lineTo(x + w / 2, y - 140); ctx.stroke(); ctx.restore();
    if (typeof document !== 'undefined') {
      if (!this.cache) { const c = document.createElement('canvas'); c.width = Math.ceil(w + 24); c.height = Math.ceil(h + 44); const cx2 = c.getContext('2d'); cx2.translate(12 - x, 32 - y); this.paintCloth(cx2, x, y, w, h); this.cache = c; }
      ctx.drawImage(this.cache, x - 12, y - 32);
    } else this.paintCloth(ctx, x, y, w, h);
    // far-face critters: one broad hatched shadow each, seen through the cloth
    for (const e of g.entities) if (e.isUmbCrawler && e.face === 1 && e.cid === this.cid && !e.remove && !e.dead) e.drawFar(ctx);
    // the rivets (coins) stay in front of the cloth
    const A = g.area, cd = Tour.countries.umb && Tour.countries.umb.coin;
    if (A && cd) for (let ty = Math.floor(y / TS); ty < Math.ceil((y + h) / TS); ty++) for (let tx = Math.floor(x / TS); tx < Math.ceil((x + w) / TS); tx++) if (A.tiles[ty * A.W + tx] === T.PICK) cd.draw(ctx, tx * TS + TS / 2, ty * TS + TS / 2 + Math.sin(t * 3 + tx) * 1.5);
    // the rivet Brady could flip through glows while he holds the canopy near it
    const p = g.player, W = p && p.umb;
    if (W && W.grip && W.grip.cid === this.cid && !(W.crossT > 0)) {
      const hh = rivetAt(W.grip, p.x + p.w / 2, gripY(p));
      if (hh) { const cx = hh[0] * TS + TS / 2, cy = hh[1] * TS + TS / 2, k = 0.5 + 0.5 * Math.sin(t * 8); ctx.save(); ctx.strokeStyle = `rgba(255,216,74,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 20 + k * 3, 0, TAU); ctx.stroke(); ctx.restore(); }
    }
    // on the fabric side, the top of the cloth (lighter, its stitched seams) is laid over the whole canopy faintly
    if (W && W.grip && W.grip.cid === this.cid && W.face === 1) { ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#fff2c0'; ctx.fillRect(x, y, w, h); ctx.restore(); }
  }
}

/* ---------------- critters on a canopy: one face each ---------------- */
// { cid, face, kind: 'tick' | 'ferret', ax / ay (tiles to patrol along x / y), speed (tiles/s), phase }
class UmbCrawler extends Ent {
  constructor(g, s) {
    super(g, s, 26, 26); this.enemy = true; this.customCollide = true; this.isUmbCrawler = true;
    this.cid = s.cid; this.face = s.face || 0; this.kind = s.kind || 'tick';
    this.x0 = s.x - 13; this.y0 = s.y - TS - 10; this.ax = (s.ax || 0) * TS; this.ay = (s.ay || 0) * TS; this.sp = s.speed || 1.2; this.ph = s.phase || 0;
    this.len = Math.max(1, Math.abs(this.ax) + Math.abs(this.ay)); this.u = 0; this.dirU = 1; this.dir = this.ax < 0 ? -1 : 1; this.cnt = 0; this.place();
  }
  place() { this.x = this.x0 + this.ax * this.u; this.y = this.y0 + this.ay * this.u; }
  update(dt) {
    this.t += dt;
    if (this.dead) { this.vy = (this.vy || 0) + PHYS.gDown * dt; this.y += this.vy * dt; if (this.y > this.g.area.H * TS + 60) this.remove = true; return; }
    // a tick stops now and then to count the spoke it's on (the pause is the tell that it moves on), loses count and
    // turns round to start again
    if (this.kind === 'tick') {
      if (this.cnt > 0) { this.cnt -= dt; if (this.cnt <= 0) this.dirU = -this.dirU; return; }
      if (Math.floor((this.t + this.ph) / 3.4) !== Math.floor((this.t + this.ph - dt) / 3.4)) { this.cnt = 1.0; if (this.g.onScreen(this) && this.face === 0) UK.say(this.g, this.cx, this.y - 6, pick(['ONE... TWO... ONE?', 'START AGAIN.']), UA.CHALK); return; }
    }
    this.u += this.dirU * this.sp * TS * dt / this.len;
    if (this.u >= 1) { this.u = 1; this.dirU = -1; } if (this.u <= 0) { this.u = 0; this.dirU = 1; }
    if (this.ax) this.dir = sign(this.ax) * this.dirU;
    this.place();
  }
  collidePlayer(p) {
    if (this.dead || !overlap(p, this)) return;
    const W = p.umb, onCan = !!(W && W.grip), face = onCan ? W.face : 0;
    if (face !== this.face || (W && W.crossT > 0)) return;
    if (p.star > 0) { this.knock(); return; }
    if (!onCan && p.vy > 0 && p.prevBottom <= this.y + 12) { this.knock(); p.vy = -PHYS.stompV; p.jumping = true; this.g.addScore(100, this.cx, this.y); return; }
    p.hurt(this);
  }
  knock() { if (this.dead) return; this.dead = true; this.vy = -4 * TS; Sound.play('stomp'); this.g.burst(this.cx, this.cy, 8, '#ffffff', 'dust'); UK.say(this.g, this.cx, this.y - 8, this.kind === 'tick' ? 'I HAD IT AT NINE!' : 'MY SHINIES!', '#ffffff'); }
  hit(kind) { if (this.face === 1 && kind !== 'star') return false; this.knock(); return true; }
  touchPlayer() {}
  art(c, x, y, mode) { const A = this.kind === 'ferret' ? UK.ferretArt : UK.tickArt; A(c, this, x, y, mode, this.t); }
  draw(ctx) {
    if (this.face === 1 && !this.dead) return;
    const x = this.cx, y = this.y + this.h, mode = this.cnt > 0 ? 'notice' : 'walk';
    Ink.around(ctx, this.x - 22, this.y - 30, this.w + 44, this.h + 40, c => { c.save(); if (this.dead) { c.translate(x, this.cy); c.rotate(Math.PI); c.translate(-x, -this.cy); } this.art(c, x, y, mode); c.restore(); }, { pad: 4 });
  }
  // through the cloth: one broad hatched shadow, the antennae tips (tick) or the shiny toes (ferret) in colour
  drawFar(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t;
    ctx.save();
    const body = () => { ctx.beginPath(); ctx.ellipse(x, y - 13, 19, 14, 0, 0, TAU); ctx.moveTo(x + 22, y - 18); ctx.ellipse(x + 15 * this.dir, y - 18, 7, 7, 0, 0, TAU); };
    ctx.fillStyle = 'rgba(40,24,60,0.5)'; body(); ctx.fill();
    ctx.save(); body(); ctx.clip();
    ctx.strokeStyle = 'rgba(40,24,60,0.6)'; ctx.lineWidth = 2; for (let k = -50; k < 50; k += 5) { ctx.beginPath(); ctx.moveTo(x + k, y - 40); ctx.lineTo(x + k + 34, y + 6); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = UA.CORAL; ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    if (this.kind === 'tick') { for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + 15 * this.dir + s * 5, y - 32 + Math.sin(t * 6 + s) * 2, 3.4, 0, TAU); ctx.fill(); ctx.stroke(); } }
    else for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x - 12 + k * 8, y + 1, 3, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
}

/* ---------------- the seated Rivet Tick (both faces), popped by flexing its rib from the far end ---------------- */
// a lock spawn (B.lock) turned into this: { id, h, side (-1: the ferrule end is to the left), reach (tiles from the
// seat to the ferrule end), markY (tile row of the rib) }
class UmbTickSeat extends Ent {
  constructor(g, s) {
    super(g, s, TS, (s.h || 4) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; this.id = s.id; this.side = s.side || -1; this.reach = s.reach || 4;
    this.tiles = []; const tx = Math.floor(s.x / TS), ty1 = Math.floor((s.y - 1) / TS); for (let k = 0; k < (s.h || 4); k++) this.tiles.push([tx, ty1 - k]);
    this.tx = tx; this.markY = s.markY != null ? s.markY : ty1 - (s.h || 4) + 2; this.open = false; this.fly = 0; this.vy = 0; this.vx = 0; this.msgT = 0; this.flex = 0;
  }
  markX() { return this.tx + this.side * this.reach; }
  markBox() { return { x: this.markX() * TS - 10, y: this.markY * TS - TS, w: TS + 20, h: TS * 2.4 }; }
  update(dt) {
    this.t += dt; if (this.msgT > 0) this.msgT -= dt; if (this.flex > 0) this.flex -= dt;
    const g = this.g, p = g.player;
    if (this.open) { this.vy += PHYS.gDown * 0.6 * dt; this.fly += this.vy * dt; this.flyX = (this.flyX || 0) + this.vx * dt; return; }
    if (g.keys && g.keys.has(this.id)) { this.release(); return; }
    if (!p || p.dead) return;
    const W = p.umb, atMark = !!(W && W.grip && overlap(p, this.markBox())), I = p.inp || {};
    if (atMark && I.actionPressed) { this.flex = 0.5; g.keys.add(this.id); this.release(); return; }
    // beside the tick: he tells you where to push from
    if (W && W.grip && Math.abs(p.cx - this.cx) < 2 * TS && this.msgT <= 0) { this.msgT = 3.2; UK.say(g, this.cx, this.y - 10, 'I\'M COUNTING THIS RIB! (FROM THE OTHER END, IF YOU MUST)', UA.CHALK); }
  }
  release() {
    if (this.open) return; this.open = true; this.vy = -6 * TS; this.vx = -this.side * 2.5 * TS;
    for (const [x, y] of this.tiles) this.g.setTile(x, y, T.EMPTY);
    Sound.play('door', { vol: 0.6 }); TourKit.sfx('boing', 'spring', { vol: 0.5, pitch: 1.3 });
    this.g.burst(this.cx, this.markY * TS, 16, UA.CORAL, 'confetti'); UK.say(this.g, this.cx, this.y - 12, 'POP! NOW I\'VE LOST COUNT!', '#ffffff');
    this.g.addScore(500, this.cx, this.y);
  }
  touchPlayer(p) {}
  draw(ctx) {
    const g = this.g, p = g.player, t = this.t, my = this.markY * TS + TS / 2, sx = this.cx, ex = this.markX() * TS + TS / 2;
    ctx.save(); ctx.lineCap = 'round';
    // the rib from the seat to its ferrule end (it bows when flexed)
    const bow = this.flex > 0 ? Math.sin(this.flex * 30) * 10 * this.flex * 2 : 0;
    ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(sx, my); ctx.quadraticCurveTo((sx + ex) / 2, my + bow, ex, my); ctx.stroke();
    ctx.strokeStyle = UA.NAVY_L; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx, my); ctx.quadraticCurveTo((sx + ex) / 2, my + bow, ex, my); ctx.stroke();
    // the ferrule end: a coral cap that pulses (the THROW mark)
    if (!this.open) {
      const near = !!(p && p.umb && p.umb.grip && overlap(p, this.markBox()));
      UA.ring(ctx, ex, my, t, near, 18);
      ctx.fillStyle = UA.CORAL; ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(ex + this.side * 4, my, 7, 0, TAU); ctx.fill(); ctx.stroke();
      if (near) { const k = 0.5 + 0.5 * Math.sin(t * 8); UA.pill(ctx, ex, my - 44, 'THROW: FLEX THE RIB!', UA.GOLD_L, 0.7 + 0.3 * k); }
    }
    // the seat (a bracket on a vertical spoke) and the big tick wedged in it, legs braced up and down the spoke
    const top = this.y, h = this.h;
    ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(sx, top); ctx.lineTo(sx, top + h); ctx.stroke();
    ctx.strokeStyle = UA.NAVY; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(sx, top); ctx.lineTo(sx, top + h); ctx.stroke();
    if (!this.open) {
      ctx.strokeStyle = UA.NAVY; ctx.lineWidth = 3.5;
      for (let k = 0; k < 4; k++) { const ly = top + 10 + k * (h - 20) / 3, s = k % 2 ? 1 : -1; ctx.beginPath(); ctx.moveTo(sx, my); ctx.quadraticCurveTo(sx + s * 18, (my + ly) / 2, sx + s * 6, ly); ctx.stroke(); }
      ctx.save(); ctx.translate(sx, my + 14 + Math.sin(t * 3) * 1.5); ctx.scale(1.6, 1.6); UK.tickArt(ctx, { dir: -this.side }, 0, 0, Math.sin(t * 1.3) > 0.3 ? 'notice' : 'walk', t); ctx.restore();
    } else {
      ctx.save(); ctx.translate(sx + (this.flyX || 0), my + this.fly); ctx.rotate(this.fly * 0.02); ctx.scale(1.6, 1.6); UK.tickArt(ctx, { dir: 1 }, 0, 0, 'notice', t); ctx.restore();
    }
    ctx.restore();
  }
}

/* ---------------- the land's tell: a coral repair ticket pinned by a rivet near every secret ---------------- */
class UmbTicket extends Ent {
  constructor(g, s) { super(g, s, 20, 30); this.x = s.x - 10; this.y = s.y - 30 - (s.dy || 0) * TS; this.back = true; this.shy = 0; }
  update(dt) { this.t += dt; const p = this.g.player; if (p && Math.abs(p.cx - this.cx) < 2.2 * TS && Math.abs(p.cy - this.cy) < 2.5 * TS) this.shy = 1; else if (this.shy > 0) this.shy -= dt; }
  touchPlayer() {}
  draw(ctx) { UA.ticket(ctx, this.cx, this.y + 4, this.t, this.shy > 0); }
}
Object.assign(ENTITY_TYPES, { umbCanopy: UmbCanopy, umbCrawler: UmbCrawler, umbTickSeat: UmbTickSeat, umbTicket: UmbTicket });
if (typeof TourSeams !== 'undefined' && TourSeams.TELLS) TourSeams.TELLS.umbTicket = true;

/* ---------------- the pieces ---------------- */
let canN = 0;
Object.assign(Tour.pieces, {
  // a canopy with its top-left cell at the letter: { w, h, holes: [[dx, dy], ...] (rivets, relative) }
  'umb.canopy'(st, o) {
    const B = st.B, x0 = st.x, y0 = st.gy - 1, cid = 'c' + (++canN), holes = (o.holes || []).map(([dx, dy]) => [x0 + dx, y0 + dy]);
    B.zone(x0, y0, o.w, o.h, 0, 0, 0, 'umbCanopy', { holes, cid, pulse: true });
    B.spawn('umbCanopy', x0, y0, { tx: x0, ty: y0, w: o.w, h: o.h, holes, cid });
    return st.x;
  },
  // a critter on the canopy it sits on: { face, kind, ax, ay, speed, phase }
  'umb.crawler'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1;
    const z = B.zones.find(q => q.kind === 'umbCanopy' && x * TS >= q.x && x * TS < q.x + q.w && y * TS >= q.y && y * TS < q.y + q.h);
    B.spawn('umbCrawler', x, y, { cid: z ? z.cid : null, face: o.face || 0, kind: o.kind || 'tick', ax: o.ax || 0, ay: o.ay || 0, speed: o.speed || 1.2, phase: o.phase || 0 });
    return st.x;
  },
  // the seated tick: the letter is the seat column's top cell; { h, side, reach, mark (rows down from the top to the
  // rib), id }. The lock: 'umb:<id>'; the key: the ferrule end's spots (either face: the checker's grid is one)
  'umb.seat'(st, o) {
    const B = st.B, x = st.x, y0 = st.gy - 1, h = o.h || 6, id = 'umb:' + (o.id || 'seat' + x), side = o.side || -1, reach = o.reach || 4, my = y0 + (o.mark || 2);
    B.lock(x, y0, y0 + h - 1, id, 'umbSeat');
    const s = B.spawns[B.spawns.length - 1]; s.type = 'umbTickSeat'; s.side = side; s.reach = reach; s.markY = my;
    const mx = x + side * reach;
    B.vkey(id, [[mx, my], [mx, my + 1], [mx, my + 2]], 'any');
    return st.x;
  },
  // the tell by a secret: { dy (rows up from the letter) }
  'umb.ticket'(st, o) { st.B.spawn('umbTicket', st.x, st.gy - 1, { dy: o.dy || 0 }); return st.x; }
});

/* ---------------- the level checker: a canopy is a grid of climbing spots ---------------- */
{
  const run0 = Validator.run;
  Validator.run = function (level, opts) {
    level.areas.forEach((a) => {
      if (a.umbCanEdges) return;
      const cans = (a.zones || []).filter(z => z.kind === 'umbCanopy'); if (!cans.length) return;
      a.umbCanEdges = true; a.edges = a.edges || []; a.umbCells = a.umbCells || new Set();
      const A = this.proxyArea(a, 0), sol = (x, y) => !!SOLID[tileAt(A, x, y)];
      for (const z of cans) {
        const tx0 = Math.round(z.x / TS), tx1 = Math.round((z.x + z.w) / TS) - 1, gy0 = Math.round(z.y / TS), gy1 = Math.round((z.y + z.h) / TS) - 1;
        const isNode = (x, gr) => x >= tx0 && x <= tx1 && gr >= gy0 && gr <= gy1;
        for (let gr = gy0; gr <= gy1; gr++) for (let x = tx0; x <= tx1; x++) {
          const fy = gr + 2; a.umbCells.add(x + ',' + fy);
          for (const [dx, dg] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (isNode(x + dx, gr + dg)) a.edges.push({ from: [x, fy - 1], to: [x + dx, fy + dg] });
        }
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
  Validator.proxyArea = function (area, mask) { const A = px0.call(this, area, mask); if (area.umbCells) A.umbCells = area.umbCells; return A; };
  const sim0 = Validator.simulate;
  Validator.simulate = function (A, ai, tx, ty, m, D, markBox, jumpBoost, f) {
    if (A.umbCells && A.umbCells.has(tx + ',' + ty) && !SOLID[tileAt(A, tx, ty)] && tileAt(A, tx, ty) !== T.SEMI && (m.off || m.mash || m.delay || m.reverseAt || m.stopAt || m.hold === 0.22)) return null;
    return sim0.call(this, A, ai, tx, ty, m, D, markBox, jumpBoost, f);
  };
}

Object.assign(TourLandscape.ARCH_LABEL, { ribcrawl: 'RIBS' });
Object.assign(UK, { CAN, canAt, rivetAt });
})();
