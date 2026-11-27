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
    Object.assign(this, { x0: s.x0, wT: s.w, gy: s.gy, ta: s.ta, tb: s.tb, target: s.target * TS, win: s.win || 10, mid: s.mid, k: s.k || 0.9, tiles: s.tiles });
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


/* ================= 33-3: fold-up seats ================= */
// A seat: its pan (a one-way plank one row over the floor) folds down under Brady; a jump from a pressed pan rides
// its rising lip up (the lift a spring gives) over the next tall backrest. A PAIR shares one hinge: standing on the
// near pan only see-saws the far one up; the lip lifts only from the far pan, both feet on it.
// { px (pan column), py (pan row), back: [bx, top, bot] (the backrest's column and rows), pair: true (px is the far
// pan; px - 1 the near one), row: the seat's letter }
class SeatsSeat extends Ent {
  constructor(g, s) {
    super(g, s, TS * (s.pair ? 2 : 1), TS); this.back = true;
    Object.assign(this, { px: s.px, py: s.py, bk: s.bk, pair: !!s.pair, label: s.label || 'G' });
    this.x = (this.px - (this.pair ? 1 : 0)) * TS; this.y = this.py * TS; this.press = 0; this.nearT = 0; this.fold = 1; this.lift = 0; this.wasOn = false;
  }
  onPan(p, col) { return p && !p.dead && p.onGround && p.groundTy === this.py && Math.floor(p.cx / TS) === col; }
  update(dt) {
    this.t += dt;
    const p = this.g.player, on = this.onPan(p, this.px), onNear = this.pair && this.onPan(p, this.px - 1);
    this.press = on ? this.press + dt : 0; this.nearT = onNear ? this.nearT + dt : 0;
    this.fold = approach(this.fold, on || onNear ? 0 : 1, dt * 5);
    // the jump off a pressed pan: the lip springs up under him
    if (this.wasOn && p && !p.onGround && p.vy < 0 && p.jumping && !this.lift) { p.vy = -PHYS.springV; this.lift = 0.5; TourKit.sfx('lip', 'spring', { vol: 0.5, pitch: 1.1 }); this.g.burst(p.cx, this.py * TS, 8, SA.GOLD, 'dust'); }
    if (this.lift > 0) this.lift = Math.max(0, this.lift - dt);
    this.wasOn = on && this.press > 0.12;
    if (onNear && this.nearT > 0.3 && !(this.saidT > 0)) { this.saidT = 3; say(this.g, (this.px + 0.5) * TS, this.py * TS - 60, 'SHARED HINGE: BOTH FEET ON THE FAR SEAT', '#ffd84a'); }
    if (this.saidT > 0) this.saidT -= dt;
  }
  touchPlayer() {}
  pan(ctx, col, k, hot) {
    // a pan: hinged at the backrest side, folded up by k (0 flat .. 1 up)
    const hx = (col + 1) * TS - 2, y = this.py * TS + 4;
    ctx.save(); ctx.translate(hx, y); ctx.rotate(k * 1.1); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = SA.TEAL; rr(ctx, -TS + 2, -6, TS - 2, 11, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = hot ? '#ffe68a' : SA.TEAL_L; ctx.fillRect(-TS + 4, -6, 6, 9);
    ctx.restore();
  }
  draw(ctx) {
    const t = this.t, p = this.g.player, [bx, top, bot] = this.bk, gy = (bot + 1) * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the standard (a tin leg) under the pan and the backrest: a tall padded teal back with its seat plate
    ctx.fillStyle = SA.TIN_D; ctx.fillRect(this.px * TS + TS / 2 - 3, this.py * TS + 8, 6, gy - this.py * TS - 8); ctx.strokeRect(this.px * TS + TS / 2 - 3, this.py * TS + 8, 6, gy - this.py * TS - 8);
    ctx.fillStyle = SA.TEAL_D; rr(ctx, bx * TS - 2, top * TS - 6, TS + 4, gy - top * TS + 6, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SA.TEAL; rr(ctx, bx * TS + 3, top * TS, TS - 6, gy - top * TS - 10, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(bx * TS + 6, top * TS + 6, 5, gy - top * TS - 26);
    ctx.fillStyle = SA.GOLD; rr(ctx, bx * TS + 6, top * TS + 10, TS - 12, 12, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.label, bx * TS + TS / 2, top * TS + 17);
    ctx.restore();
    const hot = this.press > 0.12;
    if (this.pair) { this.pan(ctx, this.px - 1, this.nearT > 0 ? 0 : this.fold, false); ctx.save(); ctx.fillStyle = SA.GOLD; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(this.px * TS, this.py * TS + 6, 5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
    // the far pan of a pair see-saws up while Brady stands on the near one
    this.pan(ctx, this.px, this.pair && this.nearT > 0 ? 1 : this.fold, hot);
    if (hot && p && p.onGround) { const k = 0.5 + 0.5 * Math.sin(t * 8); ctx.save(); ctx.strokeStyle = `rgba(255,216,74,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(this.px * TS + TS / 2, this.py * TS + 2, 20 + k * 3, 6, 0, 0, TAU); ctx.stroke(); ctx.restore(); SA.pill(ctx, this.px * TS + TS / 2, this.py * TS - 2.6 * TS, 'JUMP: THE LIP LIFTS YOU', '#ffd84a'); }
    if (this.lift > 0) { ctx.save(); ctx.strokeStyle = `rgba(255,236,170,${this.lift * 2})`; ctx.lineWidth = 3; for (const d of [-10, 0, 10]) { ctx.beginPath(); ctx.moveTo(this.px * TS + TS / 2 + d, this.py * TS - 4); ctx.lineTo(this.px * TS + TS / 2 + d, this.py * TS - 26 - this.lift * 30); ctx.stroke(); } ctx.restore(); }
  }
}
ENTITY_TYPES.seatsSeat = SeatsSeat;

/* ================= 33-4: painted backdrops and the house's look ================= */
// A stage stretch [x0, x1] is watched by the house: every few seconds the eyes out front glint (1 s tell: THE HOUSE
// IS LOOKING), then the house lights come up for a moment. Anyone on the stage then who is not standing in a painted
// doorway (framed like part of the scenery) is SPOTTED (a hit). A backdrop flat runs on a floor track; standing in
// its doorway and walking pushes it along (the doorway stays round Brady). Twin flats are roped over one pulley: push
// the front one and the back one slides the other way; at the end their doorways overlap only shoulder-wide, and the
// finale's long look can only be borne standing in that overlap.
// { x0, x1 (px), period, tell, look (s), phase, finale (a long look; its lock opens after one is borne) }
class SeatsHouse extends Ent {
  constructor(g, s) { super(g, s, s.x1 - s.x0, TS); this.back = true; Object.assign(this, { x0: s.x0, x1: s.x1, per: s.period || 4.6, tellT: s.tell || 1.1, lookT: s.look || 0.9, ph: s.phase || 0, finale: !!s.finale, id: s.id, gy: s.gy }); this.x = this.x0; this.y = (this.gy - 6) * TS; this.c = 0; this.borne = false; }
  state() { const c = (this.t + this.ph) % this.per, a = this.per - this.tellT - this.lookT; return c < a ? 'idle' : c < a + this.tellT ? 'tell' : 'look'; }
  onStage(p) { return p.cx > this.x0 && p.cx < this.x1 && p.y + p.h > (this.gy - 6) * TS; }
  hidden(p) { return this.g.entities.some(e => e instanceof SeatsBackdrop && !e.remove && e.frames(p)); }
  update(dt) {
    this.t += dt;
    const p = this.g.player, st = this.state();
    if (st !== this.last) {
      if (st === 'tell' && p && Math.abs(p.cx - (this.x0 + this.x1) / 2) < 22 * TS) { TourKit.sfx('hush', 'select', { vol: 0.35, pitch: 0.5 }); }
      if (st === 'idle' && this.last === 'look' && this.finale && this.seen === false && !this.borne) { this.borne = true; this.g.keys.add(this.id); say(this.g, p ? p.cx : this.x1, (this.gy - 5) * TS, 'BRAVO! THEY THINK YOU ARE SCENERY', '#9aff8a'); Sound.play('secret', { vol: 0.5 }); }
      if (st === 'look') this.seen = !(p && this.onStage(p)) ? (this.finale ? true : false) : false;
      this.last = st;
    }
    if (st === 'look' && p && !p.dead && this.onStage(p)) {
      if (!this.hidden(p)) { if (!(p.invuln > 0)) { p.hurt(this); say(this.g, p.cx, p.y - 20, 'SPOTTED!', '#ffffff'); } this.seen = true; }
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const st = this.state(), c = (this.t + this.ph) % this.per, a = this.per - this.tellT - this.lookT, top = (this.gy - 9) * TS, gy = this.gy * TS;
    // the stage's edge marks: tape crosses at both ends of the watched stretch
    ctx.save(); ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.lineWidth = 3; for (const x of [this.x0, this.x1]) { ctx.beginPath(); ctx.moveTo(x - 8, gy - 4); ctx.lineTo(x + 8, gy + 4); ctx.moveTo(x + 8, gy - 4); ctx.lineTo(x - 8, gy + 4); ctx.stroke(); } ctx.restore();
    if (st === 'tell') {
      const k = (c - a) / this.tellT;
      ctx.save(); ctx.globalAlpha = 0.25 + 0.25 * Math.sin(this.t * 20); ctx.fillStyle = '#ffe8a0'; ctx.fillRect(this.x0, gy - 4, this.x1 - this.x0, 4); ctx.restore();
      // the eyes out front, glinting along the stage's lip
      ctx.save(); for (let x = this.x0 + 20; x < this.x1; x += 70) { const o = Math.sin(x * 0.07) * 6; ctx.fillStyle = `rgba(255,240,170,${0.4 + 0.5 * k})`; ctx.beginPath(); ctx.ellipse(x + o, gy + 18, 4, 3 * (0.3 + 0.7 * k), 0, 0, TAU); ctx.ellipse(x + o + 12, gy + 18, 4, 3 * (0.3 + 0.7 * k), 0, 0, TAU); ctx.fill(); } ctx.restore();
      const p = this.g.player; if (p && this.onStage(p)) SA.pill(ctx, clamp(p.cx, this.x0 + 120, this.x1 - 120), top + 20, this.finale ? 'THE BIG LOOK! STAND IN THE OVERLAP' : 'THE HOUSE IS LOOKING... STAND IN A DOORWAY', '#ffd84a');
    } else if (st === 'look') {
      ctx.save(); const gr = ctx.createLinearGradient(0, top, 0, gy); gr.addColorStop(0, 'rgba(255,236,180,0.05)'); gr.addColorStop(1, 'rgba(255,236,180,0.32)'); ctx.fillStyle = gr; ctx.fillRect(this.x0, top, this.x1 - this.x0, gy - top); ctx.restore();
    }
    if (this.finale && !this.borne) SA.pill(ctx, this.x1 - 60, top - 6, 'FINALE: ' + (st === 'look' ? 'LOOKING!' : 'NEXT LOOK SOON'), st === 'look' ? '#ffffff' : '#ffd84a', 0.9);
  }
}
// a painted backdrop flat on a floor track: { x (px, its left), w, h (tiles), dl, dw (the doorway: tiles from its left,
// its width), min, max (px: the track's ends), link (another flat's id: it slides the opposite way), id, back }
class SeatsBackdrop extends Ent {
  constructor(g, s) { super(g, s, s.w * TS, s.h * TS); this.back = true; Object.assign(this, { fx: s.fx, wT: s.w, hT: s.h, dl: s.dl, dw: s.dw, min: s.min, max: s.max, link: s.link, fid: s.fid, rear: !!s.rear, gy: s.gy, art: s.art || 0 }); this.x = this.fx; this.y = (this.gy - this.hT) * TS; this.lastCx = null; }
  doorL() { return this.x + this.dl * TS; }
  doorR() { return this.x + (this.dl + this.dw) * TS; }
  linked() { return this.link ? this.g.entities.find(e => e instanceof SeatsBackdrop && e.fid === this.link) : null; }
  inDoor(p) { return p.cx > this.doorL() + 4 && p.cx < this.doorR() - 4 && p.y + p.h > this.gy * TS - 6 && p.y + p.h <= this.gy * TS + 4; }
  // framed: in this doorway (a twin pair: in both doorways at once)
  frames(p) { if (this.rear) return false; const o = this.linked(); return this.inDoor(p) && (!o || o.inDoor(p)); }
  move(d) { const nx = clamp(this.x + d, this.min, this.max), got = nx - this.x; this.x = nx; const o = this.linked(); if (o && got) o.x = clamp(o.x - got, o.min, o.max); return got; }
  update(dt) {
    this.t += dt;
    const p = this.g.player; if (!p || p.dead || this.rear) { this.lastCx = null; return; }
    // standing in the doorway and walking out of it: the jamb carries the flat along (to the track's end)
    if (this.inDoorWide(p) && p.onGround) {
      if (this.lastCx != null) {
        const d = p.cx - this.lastCx;
        if (d > 0 && p.x + p.w > this.doorR() - 2) this.move(Math.min(d, p.x + p.w - (this.doorR() - 2)));
        else if (d < 0 && p.x < this.doorL() + 2) this.move(Math.max(d, p.x - (this.doorL() + 2)));
        if (Math.abs(d) > 0.2 && Math.floor(this.t * 6) !== Math.floor((this.t - dt) * 6)) TourKit.sfx('roll', 'select', { vol: 0.12, pitch: 0.5 });
      }
      this.lastCx = p.cx;
    } else this.lastCx = null;
  }
  inDoorWide(p) { return p.cx > this.doorL() - 2 && p.cx < this.doorR() + 2 && p.y + p.h > this.gy * TS - 6 && p.y + p.h <= this.gy * TS + 4; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.wT * TS, h = this.hT * TS, gy = this.gy * TS, dL = this.doorL(), dR = this.doorR(), dTop = gy - 3 * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the track and its wheels
    ctx.fillStyle = SA.TIN_D; ctx.fillRect(this.min - 4, gy - 4, this.max - this.min + w + 8, 4);
    // the canvas: painted (a garden, a palace wall, a seaside), the doorway cut out of it
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.rect(dR, dTop, dL - dR, gy - dTop); ctx.clip('evenodd');
    const pal = [['#7aa86a', '#a8c88a', '#5a7a4a'], ['#c8a07a', '#e8c8a0', '#a8805a'], ['#6a9ac8', '#a8c8e8', '#e8d8a0']][this.art % 3];
    ctx.globalAlpha = this.rear ? 0.75 : 1;
    ctx.fillStyle = pal[0]; ctx.fillRect(x, y, w, h); ctx.fillStyle = pal[1]; ctx.fillRect(x, y, w, h * 0.45);
    ctx.fillStyle = pal[2]; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + w * (k + 0.5) / 5, y + h * 0.5, w / 9, Math.PI, 0); ctx.fill(); }
    ctx.restore();
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.globalAlpha = this.rear ? 0.8 : 1;
    ctx.strokeRect(x, y, w, h); ctx.strokeStyle = SA.CREAM; ctx.lineWidth = 4; ctx.strokeRect(dL, dTop, dR - dL, gy - dTop); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(dL - 2, dTop - 2, dR - dL + 4, gy - dTop + 2);
    ctx.fillStyle = SA.TIN; for (const wx of [x + 10, x + w - 10]) { ctx.beginPath(); ctx.arc(wx, gy - 4, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    // the doorway glows while the house is about to look (and green when Brady stands framed in it)
    const p = this.g.player, hs = this.g.entities.find(e => e instanceof SeatsHouse && e.x0 <= dL && e.x1 >= dR), st = hs && hs.state();
    if (!this.rear && p && (st === 'tell' || st === 'look' || this.frames(p))) {
      const o = this.linked(), oL = o ? Math.max(dL, o.doorL()) : dL, oR = o ? Math.min(dR, o.doorR()) : dR;
      if (oR > oL) { ctx.save(); ctx.fillStyle = this.frames(p) ? 'rgba(154,255,138,0.28)' : `rgba(255,216,74,${0.18 + 0.12 * Math.sin(this.t * 10)})`; ctx.fillRect(oL, dTop, oR - oL, gy - dTop); ctx.restore(); }
    }
    // a push cue: arrows on both jambs while Brady stands in the doorway
    if (!this.rear && p && this.inDoor(p) && !(st === 'look')) SA.pill(ctx, (dL + dR) / 2, dTop - 22, '<  WALK: IT ROLLS  >', '#ffd84a', 0.9);
  }
}
Object.assign(ENTITY_TYPES, { seatsHouse: SeatsHouse, seatsBackdrop: SeatsBackdrop });
// the finale's curtain: a mulberry curtain down across the way; it flies out once the big look is borne
class SeatsCurtainLock extends ENTITY_TYPES.lock {
  update(dt) { super.update(dt); if (!this.open && this.g.keys.has(this.id) && this.g.player) this.touchPlayer(this.g.player); }
  touchPlayer(p) { if (this.open) return; if (this.g.keys.has(this.id)) return super.touchPlayer(p); if (this.msgT <= 0) { this.msgT = 2.5; say(this.g, this.cx, this.y - 10, 'BEAR THE BIG LOOK FIRST', '#ffd84a'); } }
  draw(ctx) { const k = this.open ? clamp(1 - (this.openT || 0) / 0.6, 0, 1) : 0, x = this.x + 2, y = this.y - k * this.h, w = TS + 8, h = this.h; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = SA.MUL; rr(ctx, x, y, w, h, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = SA.MUL_D; for (let xx = x + 6; xx < x + w; xx += 10) ctx.fillRect(xx, y + 4, 3, h - 8); ctx.fillStyle = SA.GOLD; ctx.fillRect(x, y + h - 8, w, 6); ctx.restore(); }
}
ENTITY_TYPES.seatsCurtainLock = SeatsCurtainLock;

/* ================= 33-5: the follow-spot ================= */
// A follow-spot on a stand at the near edge of a pit; across the pit, the stage, where Piwi's tin stagehands mill about,
// each with a numbered badge. The call board says whose bow it is. On the stand's mark the stick swings the spot along
// the stage and holding THROW focuses it (wide and dim -> tight and bright). Hold the focused spot on the right
// stagehand and he takes his bow and puts his plank down across the pit. The wrong one shrugs (NOT MY CUE). In the
// last scene the right stagehand walks behind two enormous false moustaches on sticks (scenery): the spot cannot find
// him there.
const BADGE = [['#e84a4a', '1'], ['#3a8ae0', '2'], ['#e8c040', '3']];
// { tx, fy (the stand's mark), sx0, sx1 (px: the stage the spot can reach), hands: [{ x0, x1 (px), sp, b }], right,
// plank (tiles), mous: [x px] }
class SeatsSpot extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS * 2); this.back = true; this.seatsProp = true; this.seatsStick = true;
    Object.assign(this, { tx: s.tx, fy: s.fy, sx0: s.sx0, sx1: s.sx1, right: s.right, plank: s.plank, mous: s.mous || [], sy: s.sy });
    this.x = this.tx * TS; this.y = (this.fy - 2) * TS; this.spot = (this.sx0 + this.sx1) / 2; this.focus = 0; this.lit = 0; this.done = false; this.cool = 0; this.res = null;
    this.hands = s.hands.map((h, k) => ({ x: h.x0, x0: h.x0, x1: h.x1, sp: h.sp || 0.8 * TS, d: k % 2 ? -1 : 1, b: h.b, pose: 'stand', t: 0 }));
    hideTiles(g, this.plank);
  }
  seatsTouch(p) { return !this.done && onMark(p, this.tx, this.fy, 0.8); }
  seatsInput(p, inp, dt) {
    const d = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    this.spot = clamp(this.spot + d * 5 * TS * dt, this.sx0, this.sx1);
    this.held = !!inp.action && this.cool <= 0;
  }
  hidden(h) { return this.mous.some(mx => Math.abs(h.x - mx) < 1.3 * TS); }
  update(dt) {
    this.t += dt;
    const p = this.g.player, on = p && p.seatsProp === this;
    if (!on) this.held = false;
    if (this.cool > 0) this.cool -= dt;
    this.focus = approach(this.focus, this.held ? 1 : 0, dt * (this.held ? 2.4 : 4));
    for (const h of this.hands) {
      h.t += dt;
      if (h.pose === 'shrug') { if (h.t > 1.2) h.pose = 'stand'; continue; }
      if (h.pose === 'bow' || h.pose === 'plank') continue;
      h.x += h.d * h.sp * dt; if (h.x > h.x1) { h.x = h.x1; h.d = -1; } if (h.x < h.x0) { h.x = h.x0; h.d = 1; }
    }
    if (this.done) { const h = this.hands[this.right]; if (h.pose === 'bow' && h.t > 0.7) { h.pose = 'plank'; h.t = 0; growTiles(this.g, this.plank); liftOut(this.g, this.plank); TourKit.sfx('plank', 'bump', { vol: 0.6, pitch: 0.8 }); this.g.burst((this.plank[0][0] + this.plank.length / 2) * TS, this.plank[0][1] * TS, 12, SA.CREAM, 'dust'); } return; }
    // the focused spot on a stagehand (not behind the moustaches) for half a second
    const H = this.focus > 0.9 ? this.hands.find(h => Math.abs(h.x - this.spot) < 20 && !this.hidden(h)) : null;
    if (H && H === this.litH) this.lit += dt; else { this.lit = 0; this.litH = H; }
    if (H && this.lit > 0.5) {
      const k = this.hands.indexOf(H); this.lit = 0;
      if (k === this.right) { this.done = true; this.seatsProp = false; H.pose = 'bow'; H.t = 0; Sound.play('select', { vol: 0.5, pitch: 1.5 }); say(this.g, H.x, this.sy - 3 * TS, 'No ' + BADGE[H.b][1] + ' TAKES A BOW!', '#9aff8a'); }
      else { H.pose = 'shrug'; H.t = 0; this.cool = 0.9; this.held = false; TourKit.sfx('nope', 'bump', { vol: 0.4, pitch: 1.4 }); say(this.g, H.x, this.sy - 3 * TS, 'NOT MY CUE!', '#ffffff'); }
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const t = this.t, p = this.g.player, on = p && p.seatsProp === this, sy = this.sy, f = this.focus;
    // the stand and its lamp, aimed at the spot
    const lx = (this.tx + 0.5) * TS, ly = this.fy * TS - 70, a = Math.atan2(sy - 20 - ly, this.spot - lx);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = SA.TIN_D; ctx.fillRect(lx - 3, ly, 6, 70); ctx.strokeRect(lx - 3, ly, 6, 70); ctx.beginPath(); ctx.moveTo(lx - 16, this.fy * TS); ctx.lineTo(lx, this.fy * TS - 20); ctx.lineTo(lx + 16, this.fy * TS); ctx.stroke();
    ctx.translate(lx, ly); ctx.rotate(a); ctx.fillStyle = '#3a3a4a'; rr(ctx, -12, -10, 34, 20, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff4c0'; ctx.fillRect(20, -7, 4, 14);
    ctx.restore();
    // the beam and the pool of light on the stage (wide and dim; tight and bright while THROW focuses it)
    if (!this.done) {
      const r = lerp(70, 26, f), al = lerp(0.18, 0.5, f);
      ctx.save(); ctx.fillStyle = `rgba(255,244,190,${al * 0.5})`; ctx.beginPath(); ctx.moveTo(lx + Math.cos(a) * 24, ly + Math.sin(a) * 24); ctx.lineTo(this.spot - r, sy - 10); ctx.lineTo(this.spot + r, sy - 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,248,200,${al})`; ctx.beginPath(); ctx.ellipse(this.spot, sy - 30, r, r * 1.1, 0, 0, TAU); ctx.fill();
      if (f > 0.9) { ctx.strokeStyle = '#ffe68a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(this.spot, sy - 30, r + 3, r * 1.1 + 3, 0, 0, TAU); ctx.stroke(); }
      ctx.restore();
    }
    // the stagehands with their badges
    for (const h of this.hands) {
      SA.hand(ctx, h.x, sy, t, BADGE[h.b][0], h.pose, h.d, 1.25);
      if (!this.hidden(h)) { ctx.save(); ctx.font = TourBackstage.F9; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(BADGE[h.b][1], h.x + h.d * 2.5, sy - 28); ctx.restore(); }
      if (h === this.litH && this.lit > 0) { ctx.save(); ctx.strokeStyle = '#9aff8a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(h.x, sy - 70, 9, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, this.lit / 0.5)); ctx.stroke(); ctx.restore(); }
    }
    // the false moustaches on their sticks, in front of anyone behind them
    for (const mx of this.mous) {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.fillStyle = '#8a6a4a'; ctx.fillRect(mx - 3, sy - 64, 6, 64); ctx.strokeRect(mx - 3, sy - 64, 6, 64);
      ctx.fillStyle = '#2a1a14'; ctx.beginPath(); ctx.moveTo(mx, sy - 74); ctx.bezierCurveTo(mx - 20, sy - 104, mx - 56, sy - 92, mx - 62, sy - 62); ctx.bezierCurveTo(mx - 50, sy - 76, mx - 26, sy - 70, mx, sy - 52); ctx.bezierCurveTo(mx + 26, sy - 70, mx + 50, sy - 76, mx + 62, sy - 62); ctx.bezierCurveTo(mx + 56, sy - 92, mx + 20, sy - 104, mx, sy - 74); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(mx - 30, sy - 80, 14, 4, -0.3, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // the call board over the stage: whose bow it is (its colour and number)
    if (!this.done) {
      const bx = (this.sx0 + this.sx1) / 2, by = sy - 5.2 * TS, B = BADGE[this.hands[this.right].b];
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#2a1a24'; rr(ctx, bx - 62, by - 18, 124, 36, 6); ctx.fill(); ctx.stroke();
      ctx.font = TourBackstage.F9; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.fillText('BOW: No', bx - 50, by);
      ctx.fillStyle = B[0]; ctx.beginPath(); ctx.arc(bx + 34, by, 13, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.fillText(B[1], bx + 34, by + 1);
      ctx.restore();
      SA.ring(ctx, (this.tx + 0.5) * TS, this.fy * TS, t, on, 17);
      if (on && !this.held) SA.cue(ctx, (this.tx + 0.5) * TS, this.fy * TS - 2.6 * TS, t, 'STICK AIMS, HOLD THROW');
    }
  }
}
ENTITY_TYPES.seatsSpot = SeatsSpot;

/* ---------------- the pieces (the letter's cell: st.x, st.gy - 1) ---------------- */
Object.assign(Tour.pieces, {
  // a fold-up seat: the letter is its pan (one row over the floor); the backrest stands in the next column, h rows
  // tall from the floor; { h, dir (+1: backrest to the right), pair (a shared-hinge pair: the letter is the near pan),
  // label }. The checker: the (far) pan is a spring
  'seats.seat'(st, o) {
    const B = st.B, x = st.x, py = st.gy - 1, d = o.dir || 1, far = o.pair ? x + d : x, bx = far + d, h = o.h || 5, bot = py, top = py - h + 1;
    if (o.pair) B.set(x, py, T.SEMI);
    B.set(far, py, T.SEMI); for (let y = top; y <= bot; y++) B.set(bx, y, T.HARD);
    B.springs.push([far, py]);
    B.spawn('seatsSeat', far, py, { px: far, py, bk: [bx, top, bot], pair: !!o.pair, label: o.label });
    return st.x;
  },
  // the house watching a stage stretch: the letter is its left end on the floor row; { w (tiles), period, tell, look,
  // phase, finale, id (a finale's lock id: the checker's key is standing at kx,ky... the overlap) }
  'seats.house'(st, o) {
    const B = st.B, x = st.x, gy = st.gy;
    B.spawn('seatsHouse', x, gy - 1, { x0: x * TS, x1: (x + o.w) * TS, period: o.period, tell: o.tell, look: o.look, phase: o.phase, finale: !!o.finale, id: o.id, gy });
    if (o.id) B.vkey(o.id, [[x + o.kx, gy - 1]], 'any');
    return st.x;
  },
  // a backdrop flat: the letter is its left column at its start on the floor row; { w, h, dl, dw, track (tiles it can
  // roll right; negative: left), fid, link, rear, art }
  'seats.backdrop'(st, o) {
    const B = st.B, x = st.x, gy = st.gy + 1, tr = o.track || 6, min = Math.min(x, x + tr) * TS, max = Math.max(x, x + tr) * TS;
    B.spawn('seatsBackdrop', x, gy - 1, { fx: x * TS, w: o.w || 6, h: o.h || 5, dl: o.dl == null ? 2 : o.dl, dw: o.dw || 2, min, max, link: o.link, fid: o.fid, rear: !!o.rear, gy, art: o.art || 0 });
    return st.x;
  },
  // the finale's curtain: a lowered curtain across the way (a lock) the letter's column, h rows
  'seats.curtain'(st, o) { const B = st.B, x = st.x, y = st.gy - 1, n = B.spawns.length; B.lock(x, y - (o.h || 4) + 1, y, o.id, 'door'); for (let k = n; k < B.spawns.length; k++) if (B.spawns[k].type === 'lock') B.spawns[k].type = 'seatsCurtainLock'; return st.x; },
  // a follow-spot: the letter is its mark on the floor row; { gap (tiles to the pit), pit (its width: the plank),
  // stage: [dx0, dx1] (tiles from the letter: where the hands walk and the spot reaches), hands: [[dx0, dx1, speed, badge]],
  // right (index), mous: [dx, ...] }
  'seats.spot'(st, o) {
    const B = st.B, x = st.x, fy = st.gy, p0 = x + 1 + (o.gap || 2), plank = [];
    for (let q = 0; q < o.pit; q++) { plank.push([p0 + q, fy]); B.set(p0 + q, fy, T.SEMI); }
    const X = d => (x + d + 0.5) * TS;
    B.spawn('seatsSpot', x, fy - 1, { tx: x, fy, sx0: X(o.stage[0]), sx1: X(o.stage[1]), sy: fy * TS, right: o.right || 0, plank, mous: (o.mous || []).map(X), hands: o.hands.map(([a, b, sp, bd]) => ({ x0: X(a), x1: X(b), sp: (sp || 0.8) * TS, b: bd })) });
    return st.x;
  },
  // a flat: the letter is the first pit column on the floor row; { w (pit width), tail (tiles of rope tail ending
  // `gap` tiles before the pit), gap, target, win, mid (offset of a middle support), k }
  'seats.flat'(st, o) {
    const B = st.B, x0 = st.x, gy = st.gy - 1, w = o.w || 6, tail = o.tail || 6, gap = o.gap == null ? 2 : o.gap, tiles = [];
    for (let q = 0; q < w; q++) { tiles.push([x0 + q, gy]); B.set(x0 + q, gy, T.SEMI); }
    const tb = x0 - 1 - gap, ta = tb - tail + 1;
    B.spawn('seatsFlat', x0, gy - 1, { x0, w, gy, ta, tb, target: o.target || 3, win: o.win || 10, mid: o.mid != null ? x0 + o.mid : null, k: o.k || 0.9, tiles });
    return st.x;
  }
});

Object.assign(TourLandscape.ARCH_LABEL, { slackline: 'FLATS', foldseat: 'SEATS', pushflat: 'SCENERY', followspot: 'FOLLOW-SPOT' });
Object.assign(Tour.seatsKit, { hideTiles, growTiles, liftOut, SeatsFlat });
})();
