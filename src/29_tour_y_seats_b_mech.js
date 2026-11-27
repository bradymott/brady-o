/* ============================================================
   BELOW THE CHEAP SEATS: the stage machinery of 33-2 to 33-6. Every prop takes the THROW button only while Brady
   stands on its marked spot (29_tour_y_seats.js: seatsProp).
   33-2 SLACK DEPARTMENT (slackline): a painted flat lies over a pit, hinged on a short trestle at the near edge, its far
        end hung from the flies on a rope whose tail lies along the boards before the pit. Stand on the rope tail and
        HOLD THROW: walking forward pays out line (the far end comes down), walking back hauls it in. The flat's tilt
        shows live (a spirit level on it, a dashed level line to the far support). Let go of THROW while it reads
        LEVEL and the stagehands clamp it: a bridge. The last flat spans three supports and its window is narrow: pay
        out too much and it slips off the middle support (its painted door dips below the boards), swings, and is
        hauled back to start.
   The checker: a flat's bridge tiles are in the level from the start (the game hides them until it is clamped).
   ============================================================ */
(function () {
const SK = Tour.seatsKit, INK = SK.INK, SA = SK.SeatsArt, say = SK.say, onMark = SK.onMark;
// tiles a prop makes: hidden at load (the checker sees them from the start), shown when made
const hideTiles = (g, L) => { for (const [x, y] of L) g.setTile(x, y, T.EMPTY); };
const growTiles = (g, L, t) => { for (const [x, y] of L) g.setTile(x, y, t == null ? T.SEMI : t); };
const liftOut = (g, L) => { const p = g.player; if (!p || p.dead) return; for (const [x, y] of L) if (p.x < (x + 1) * TS && p.x + p.w > x * TS && p.y < (y + 1) * TS && p.y + p.h > y * TS) { p.y = y * TS - p.h; p.vy = Math.min(0, p.vy); } };

/* ================= 33-2: a flat on a rope ================= */
// { x0 (first pit column), w (pit width), gy (floor row), ta, tb (the rope tail's columns), target (tiles the far end
// starts above level), win (px either side of level that counts), mid (a middle support's column, or null), k (line
// per px walked) }
class SeatsFlat extends Ent {
  constructor(g, s) {
    super(g, s, s.w * TS, TS); this.back = true; this.seatsProp = true;
    Object.assign(this, { x0: s.x0, wT: s.w, gy: s.gy, ta: s.ta, tb: s.tb, target: s.target * TS, win: s.win || 7, mid: s.mid, k: s.k || 0.6, tiles: s.tiles });
    this.x = this.x0 * TS; this.y = (this.gy - 1) * TS; this.line = 0; this.done = false; this.tipT = 0; this.lastCx = null; this.levelT = 0;
    hideTiles(g, this.tiles);
  }
  hingeX() { return this.x0 * TS; }
  endX() { return (this.x0 + this.wT) * TS; }
  // the far end's drop below its starting height, and its height above level (px; + is above)
  above() { return this.done ? 0 : this.target - this.line; }
  level() { return Math.abs(this.above()) <= this.win; }
  seatsTouch(p) { return !this.done && !(this.tipT > 0) && p.onGround && p.groundTy === this.gy && p.cx >= this.ta * TS && p.cx <= (this.tb + 1) * TS; }
  seatsInput(p, inp, dt) {
    if (inp.action) {
      if (this.lastCx == null) this.lastCx = p.cx;
      const d = p.cx - this.lastCx; this.lastCx = p.cx;
      const max = this.mid != null ? this.target + 3 * TS : this.target + 1.4 * TS;
      const l0 = this.line; this.line = clamp(this.line + d * this.k, 0, max);
      if (Math.abs(this.line - l0) > 0.5 && Math.floor(this.line / 18) !== Math.floor(l0 / 18)) TourKit.sfx('rope', 'select', { vol: 0.2, pitch: 0.6 + this.line / this.target * 0.4 });
      this.holding = true;
    } else {
      if (this.holding && this.level()) this.settle();
      this.holding = false; this.lastCx = null;
    }
  }
  settle() {
    this.done = true; this.seatsProp = false; growTiles(this.g, this.tiles); liftOut(this.g, this.tiles);
    TourKit.sfx('clamp', 'kick', { vol: 0.5, pitch: 1.1 }); Sound.play('select', { vol: 0.5, pitch: 1.5 });
    this.g.burst((this.hingeX() + this.endX()) / 2, this.gy * TS, 14, SA.GOLD, 'confetti');
    say(this.g, (this.hingeX() + this.endX()) / 2, this.gy * TS - 50, 'LEVEL! CLAMPED', '#9aff8a');
  }
  update(dt) {
    this.t += dt;
    const p = this.g.player;
    if (!(p && p.seatsProp === this)) { if (this.holding && this.level() && !this.done) this.settle(); this.holding = false; this.lastCx = null; }
    // the last flat: too much slack and it slips off its middle support, swings, and is hauled back to start
    if (this.mid != null && !this.done && !(this.tipT > 0) && this.above() < -this.win - 14) {
      this.tipT = 1.6; TourKit.sfx('tip', 'powerdown', { vol: 0.5 }); say(this.g, (this.hingeX() + this.endX()) / 2, this.gy * TS - 40, 'TOO MUCH SLACK! IT TIPPED', '#ffffff');
    }
    if (this.tipT > 0) { this.tipT -= dt; if (this.tipT <= 0) { this.line = 0; this.holding = false; this.lastCx = null; } }
    this.levelT = this.level() && !this.done ? this.levelT + dt : 0;
  }
  touchPlayer() {}
  draw(ctx) {
    const t = this.t, hx = this.hingeX(), ex = this.endX(), ly = this.gy * TS, p = this.g.player;
    const tip = this.tipT > 0 ? 1 - Math.max(0, this.tipT - 1.2) / 0.4 : 0;
    const ey = ly - this.above(), L = ex - hx;
    let ang = Math.atan2(ey - ly, L);
    if (tip > 0) ang = lerp(ang, 1.25, Math.min(1, tip)) + Math.sin(t * 9) * 0.05 * tip;
    const fx = hx + Math.cos(ang) * L, fy = ly + Math.sin(ang) * L;
    ctx.save();
    // the supports: a short trestle at the near edge, a tall post from the pit floor at the far edge (and the middle one)
    const post = (x, h, w) => { ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillStyle = SA.RUST_D; ctx.fillRect(x - w / 2, ly + 4, w, h); ctx.strokeRect(x - w / 2, ly + 4, w, h); ctx.fillStyle = SA.TEAL; ctx.fillRect(x - w / 2 - 4, ly, w + 8, 6); ctx.strokeRect(x - w / 2 - 4, ly, w + 8, 6); };
    post(hx - 4, TS * 1.2, 16); post(ex - 6, TS * 8, 12); if (this.mid != null) post((this.mid + 0.5) * TS, TS * 8, 10);
    // the dashed level line (where the flat must lie) while it is not clamped
    if (!this.done) { ctx.setLineDash([8, 7]); ctx.strokeStyle = this.level() ? 'rgba(154,255,138,0.9)' : 'rgba(255,236,170,0.6)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(hx, ly + 2); ctx.lineTo(ex, ly + 2); ctx.stroke(); ctx.setLineDash([]); }
    // the rope: from the far end up to the pulley, across the flies, down to the cleat at the tail's start, and the tail
    const px = ex - 6, py = ly - 9 * TS, cx0 = this.ta * TS + 6, ty = ly - 3;
    const holdX = p && p.seatsProp === this && this.holding ? p.cx + p.facing * 8 : null;
    SA.rope(ctx, fx, fy, px, py, 0); SA.rope(ctx, px, py, cx0, py, 6);
    SA.rope(ctx, cx0, py, holdX != null ? holdX : cx0, holdX != null ? p.y + p.h * 0.45 : ty - 30, 0);
    SA.rope(ctx, holdX != null ? holdX : cx0, holdX != null ? p.y + p.h * 0.45 : ty - 30, (this.tb + 1) * TS, ty, 10);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = SA.TIN_D; ctx.beginPath(); ctx.arc(px, py, 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(cx0, py, 7, 0, TAU); ctx.fill(); ctx.stroke();
    SA.clamp(ctx, cx0, ty - 30, 0.9);
    // the flat: a painted board, its face a landscape with a door (the last one a big painted door)
    ctx.save(); ctx.translate(hx, ly); ctx.rotate(ang);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#e8d8b0'; rr(ctx, 0, -12, L, 14, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SA.TEAL_L; ctx.fillRect(2, -10, L - 4, 5); ctx.fillStyle = '#8ab86a'; ctx.fillRect(2, -5, L - 4, 5);
    const dX = this.mid != null ? L * 0.66 : L * 0.5; ctx.fillStyle = SA.MUL; rr(ctx, dX - 9, -11, 18, 12, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = SA.GOLD; ctx.beginPath(); ctx.arc(dX + 5, -5, 1.6, 0, TAU); ctx.fill();
    // the spirit level riding on it: the bubble runs to the high end
    if (!this.done) {
      const bx = L * 0.3, a = clamp(-ang * 160, -14, 14);
      ctx.fillStyle = SA.GOLD; rr(ctx, bx - 20, -22, 40, 10, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c8ffb0'; rr(ctx, bx - 16, -20, 32, 6, 3); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx - 4, -20); ctx.lineTo(bx - 4, -14); ctx.moveTo(bx + 4, -20); ctx.lineTo(bx + 4, -14); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(bx + a, -17, 4, 2.4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    } else { SA.clamp(ctx, 8, -4, 0.9); SA.clamp(ctx, L - 8, -4, 0.9); }
    ctx.restore();
    ctx.restore();
    // the reading on a pill over the middle of the pit; the mark at the tail's start
    if (!this.done) {
      const lv = this.level(), mx = (hx + ex) / 2, near = p && Math.abs(p.cx - mx) < 16 * TS;
      if (near) SA.pill(ctx, mx, ly - 2.6 * TS, this.tipT > 0 ? 'TIPPED!' : lv ? 'LEVEL! LET GO' : this.above() > 0 ? 'HIGH: PAY OUT' : 'LOW: HAUL IN', lv ? '#9aff8a' : '#ffd84a');
      const hot = p && p.seatsProp === this;
      SA.ring(ctx, (this.ta + 0.5) * TS, ly, t, hot, 17);
      if (hot && !this.holding) SA.cue(ctx, (this.ta + 1.5) * TS, ly - 2.4 * TS, t, 'HOLD THROW, WALK');
    }
  }
}
ENTITY_TYPES.seatsFlat = SeatsFlat;

/* ---------------- the pieces (the letter's cell: st.x, st.gy - 1) ---------------- */
Object.assign(Tour.pieces, {
  // a flat: the letter is the first pit column on the floor row; { w (pit width), tail (tiles of rope tail ending
  // `gap` tiles before the pit), gap, target, win, mid (offset of a middle support), k }
  'seats.flat'(st, o) {
    const B = st.B, x0 = st.x, gy = st.gy - 1, w = o.w || 6, tail = o.tail || 6, gap = o.gap == null ? 2 : o.gap, tiles = [];
    for (let q = 0; q < w; q++) { tiles.push([x0 + q, gy]); B.set(x0 + q, gy, T.SEMI); }
    const tb = x0 - 1 - gap, ta = tb - tail + 1;
    B.spawn('seatsFlat', x0, gy - 1, { x0, w, gy, ta, tb, target: o.target || 3, win: o.win || 7, mid: o.mid != null ? x0 + o.mid : null, k: o.k || 0.6, tiles });
    return st.x;
  }
});

Object.assign(TourLandscape.ARCH_LABEL, { slackline: 'FLATS' });
Object.assign(Tour.seatsKit, { hideTiles, growTiles, liftOut, SeatsFlat });
})();
