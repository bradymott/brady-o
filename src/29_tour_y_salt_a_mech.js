/* ============================================================
   THE TABLE SALT SEA: the props of 34-1 to 34-4 (and the weighing spoon of 34-5's lead-in). Every prop takes the
   button only while Brady stands on its pulsing gold mark (29_tour_y_salt.js: saltProp).
   34-1 ANGLE OF REPOSE (repose): a salt heap by a notch in the tread. Hold RUN on the heap's mark to scuff it: the
        top layer slides downhill into the notch, which fills from the bottom up to the gold FULL line at its lip and
        sets hard. The last heap feeds two notches with only just enough salt: a scuff that starts while the first
        notch is short fills the first; keep scuffing past its FULL line and the extra spills away. Stop at FULL,
        then scuff again for the second. A heap that runs dry is topped up by the shaker over it (it shakes first).
   34-2 GRAIN ELEVATOR (brinefloat): a basin of brine with a weighted cork in a cradle at the bottom. Jump on the salt
        spoon by the basin: it tips a dose in, the brine thickens a band (the density gauge on the basin's wall) and
        the cork's float line rises: at the gauge's top band the cork floats up and rides at the surface; stand on it
        and it drifts across. The last basin has a low stone lip and a spoon under the shaker that refills itself:
        after the first dose the cork rides half-afloat at the surface; board it before the spoon tips again by
        itself, or the cork lifts past the lip and floats off (it comes back to its cradle).
   34-3 CRYSTAL HABIT (cubegrow): a salt crystal with a flat face. Stand on it and hold THROW: a new cube grows out of
        the face shown by the dashed preview. Late on the crystal needs a corner (sideways, then down) and the brine
        rises in the trough under it once it starts growing: finish before the brine reaches the stem, or the new
        cubes dissolve.
   34-4 THE SHAKER TEST (shakercap): inside a perforated cap: Brady walks on the cap's inner disc, its holes at his
        feet. The cap shakes (the tell), then pours: salt goes down through every hole he isn't standing on into the
        bowls below. The gold bowl must get enough in one pour to sink and lift the cellar gate. The last bowl is
        narrow: stand astride two neighbouring holes so the whole pour goes down the one left.
   The checker: filled notches, grown cubes and floating corks are in the level for it from the start (the game hides
   them until made); a shaker gate is a lock whose key is standing on its plug spot.
   ============================================================ */
(function () {
const SK = Tour.saltKit, INK = SK.INK, SA = SK.SaltArt, say = SK.say, onMark = SK.onMark;
const markOf = s => ({ tx: Math.round((s.x - TS / 2) / TS), fy: Math.round(s.y / TS) });
const hideTiles = (g, L) => { for (const [x, y] of L) g.setTile(x, y, T.EMPTY); };
const showTiles = (g, L, t) => { for (const [x, y] of L) g.setTile(x, y, t == null ? T.GROUND : t); };
const liftOut = (g, L) => { const p = g.player; if (!p || p.dead) return; for (const [x, y] of L) if (p.x < (x + 1) * TS && p.x + p.w > x * TS && p.y < (y + 1) * TS && p.y + p.h > y * TS) { p.y = y * TS - p.h; p.vy = Math.min(0, p.vy); } };
const byId = (g, cls, id) => g.entities.find(e => e instanceof cls && e.id === id && !e.remove);

/* a mark prop: subclasses define act(p) or hold(p, on, dt) */
class SaltMark extends Ent {
  constructor(g, s, w, h) { super(g, s, w || TS, h || TS); const m = markOf(s); this.tx = m.tx; this.fy = m.fy; this.friendly = true; this.back = true; this.saltProp = true; this.cue = 'THROW'; }
  live() { return true; }
  saltTouch(p) { return this.live() && onMark(p, this.tx, this.fy, 0.8); }
  saltInput(p, inp, dt) { if (inp.actionPressed && this.act) this.act(p); this.held = !!inp.action; this.heldT = this.g.t; }
  holding() { const p = this.g.player; return !!(this.held && this.g.t - this.heldT < 0.04 && p && this.saltTouch(p)); }
  touchPlayer() {}
  drawMark(ctx) { const p = this.g.player, hot = p && this.saltTouch(p); if (this.live()) SA.ring(ctx, (this.tx + 0.5) * TS, this.fy * TS, this.t, hot, 17); if (hot && !this.holding()) SA.cue(ctx, (this.tx + 0.5) * TS, this.fy * TS - 2.6 * TS, this.t, this.cue); }
}

/* ======================= 34-1: heaps and notches ======================= */
// a notch: columns x0..x1 of the tread's top row (gy); fill 0..1 (1: level with the lip, set hard)
class SaltNotch extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.id = s.id; this.x0 = s.x0; this.x1 = s.x1; this.gy = s.gy; this.cells = []; for (let x = s.x0; x <= s.x1; x++) this.cells.push([x, s.gy]); this.fill = 0; this.spill = 0; this.back = true; this.friendly = true; this.x = s.x0 * TS; this.y = s.gy * TS; this.w = (s.x1 - s.x0 + 1) * TS; this.h = 2 * TS; hideTiles(g, this.cells); }
  add(v) {
    if (this.fill >= 1) { this.spill = 0.4; return; }
    this.fill = Math.min(1, this.fill + v);
    if (this.fill >= 1) { showTiles(this.g, this.cells); liftOut(this.g, this.cells); this.g.burst(this.cx, this.y, 14, '#ffffff', 'dust'); TourKit.sfx('crunch', 'bump', { vol: 0.5, pitch: 1.4 }); say(this.g, this.cx, this.y - 20, 'FULL!', SA.GOLD); }
  }
  update(dt) { this.t += dt; if (this.spill > 0) this.spill -= dt; }
  touchPlayer() {}
  draw(ctx) {
    const x0 = this.x, x1 = this.x + this.w, lip = this.y, deep = lip + 2.2 * TS, top = lip + (1 - this.fill) * 2.2 * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the notch's dark walls (it falls away below)
    ctx.fillStyle = 'rgba(20,30,70,0.35)'; ctx.fillRect(x0, lip, this.w, deep - lip);
    // the salt in it, levelled
    if (this.fill > 0) { ctx.fillStyle = SA.CRYS; ctx.fillRect(x0, top, this.w, deep - top + 40); ctx.fillStyle = SA.CRYS_B; ctx.fillRect(x0, top, this.w, 4); ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x1, top); ctx.stroke(); }
    // the FULL line at the lip: a gold dashed bar with a tag, big while it is short
    if (this.fill < 1) {
      ctx.setLineDash([8, 6]); ctx.strokeStyle = SA.GOLD; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + 2, lip + 3); ctx.lineTo(x1 - 2, lip + 3); ctx.stroke(); ctx.setLineDash([]);
      SA.pill(ctx, (x0 + x1) / 2, lip + 1.3 * TS, Math.round(this.fill * 100) + '%  FULL AT THE LINE', '#ffffff', 0.9);
    }
    if (this.spill > 0) { for (let k = 0; k < 5; k++) { const u = (this.t * 3 + k / 5) % 1; ctx.fillStyle = SA.CRYS; ctx.fillRect(x1 - 6 + u * 30, lip - 6 + u * u * 50, 4, 4); } SA.pill(ctx, (x0 + x1) / 2, lip - 1.2 * TS, 'SPILLING!', '#ff9a8a'); }
    ctx.restore();
  }
}
// the heap: on its mark hold RUN to scuff; salt slides to its notches in order (see the header)
class SaltHeap extends SaltMark {
  constructor(g, s) { super(g, s, TS, TS); this.cap = s.cap || 1.6; this.salt = this.cap; this.notches = s.notches; this.rate = 0.8; this.target = null; this.refillT = 0; this.cue = 'HOLD RUN'; this.hx = (this.tx + 1.8) * TS; }
  live() { return this.salt > 0.02 && this.notchList().some(n => n.fill < 1); }
  notchList() { return this.notches.map(id => byId(this.g, SaltNotch, id)).filter(Boolean); }
  saltInput(p, inp, dt) {
    if (inp.action && !this.wasHeld) { const L = this.notchList(); this.target = L.find(n => n.fill < 1) || null; }
    this.wasHeld = !!inp.action; this.held = !!inp.action; this.heldT = this.g.t;
  }
  update(dt) {
    this.t += dt;
    const p = this.g.player, on = p && this.saltTouch(p) && this.holding();
    if (!on) this.wasHeld = this.held && this.g.t - this.heldT < 0.04;
    this.scuff = on && this.target && this.salt > 0;
    if (this.scuff) { const v = Math.min(this.salt, this.rate * dt); this.salt -= v; this.target.add(v); if (Math.random() < 0.3) TourKit.sfx('scuff', 'bump', { vol: 0.15, pitch: 1.8 + Math.random() * 0.3 }); }
    // run dry with a notch still short: the shaker overhead shakes (1.2 s), then pours the heap back
    if (this.salt <= 0.02 && this.notchList().some(n => n.fill < 1)) {
      this.refillT += dt;
      if (this.refillT > 0.1 && this.refillT < 0.2 && !this.toldR) { this.toldR = true; say(this.g, this.hx, this.fy * TS - 3 * TS, 'THE SHAKER WILL TOP IT UP', '#ffffff'); }
      if (this.refillT > 1.2) this.salt = Math.min(this.cap, this.salt + dt * 1.2);
      if (this.salt >= this.cap) { this.refillT = 0; this.toldR = false; }
    } else if (this.refillT > 0 && this.salt >= this.cap - 0.01) this.refillT = 0;
  }
  draw(ctx) {
    const gy = this.fy * TS, k = this.salt / this.cap, t = this.t;
    // the shaker over the heap (shaking while it is about to pour, pouring while it refills)
    const sy = gy - 5.4 * TS, shake = this.refillT > 0 && this.refillT <= 1.2 ? Math.sin(t * 40) * 3 : 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = SA.CHAR; ctx.beginPath(); ctx.ellipse(this.hx + shake, sy, 26, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SA.COBALT; ctx.fillRect(this.hx - 20 + shake, sy - 30, 40, 26); ctx.strokeRect(this.hx - 20 + shake, sy - 30, 40, 26);
    ctx.fillStyle = '#0a0a14'; for (let q = -1; q <= 1; q++) { ctx.beginPath(); ctx.arc(this.hx + q * 9 + shake, sy + 2, 2.4, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (this.refillT > 1.2) SA.stream(ctx, this.hx, sy + 6, gy - k * 40, t, 0.8);
    // the heap: two bands (top layer pale) so its size reads; while scuffed, the top layer slides downhill
    SA.heap(ctx, this.hx, gy, 18 + 44 * Math.sqrt(k), 8 + 46 * k);
    if (this.scuff && this.target) {
      const tx = this.target.cx, ty = this.target.y + 4, n = 10;
      for (let q = 0; q < n; q++) { const u = (t * 1.6 + q / n) % 1, x = lerp(this.hx, tx, u), y = lerp(gy - 30 * k, ty, u) - Math.sin(u * Math.PI) * 10; ctx.fillStyle = SA.CRYS; ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.fillRect(x - 3, y - 3, 6, 6); ctx.strokeRect(x - 3, y - 3, 6, 6); }
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t * 40; ctx.beginPath(); ctx.moveTo(this.hx + 10, gy - 34 * k); ctx.quadraticCurveTo((this.hx + tx) / 2, gy - 40, tx, ty); ctx.stroke(); ctx.restore();
    }
    this.drawMark(ctx);
  }
}

/* ======================= 34-2: basins, spoons and corks ======================= */
// the basin: columns x0..x1, its surface row sy (the row the cork's top rides at), its floor row by; need doses
// to float the cork; lip: the last basin's (a dose past need lifts the cork away); the cork's deck tiles are ghosts
class SaltBasin extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS); Object.assign(this, { id: s.id, x0: s.x0, x1: s.x1, sy: s.sy, by: s.by, need: s.need || 2, lip: !!s.lip, auto: s.auto || 0 });
    this.x = s.x0 * TS; this.y = s.sy * TS; this.w = (s.x1 - s.x0 + 1) * TS; this.h = (s.by - s.sy + 1) * TS; this.back = true; this.friendly = true;
    this.dose = 0; this.cork = null; this.goneT = 0;
  }
  // a dose of salt from the spoon
  addDose() {
    if (this.goneT > 0) return;
    this.dose++; this.g.burst(this.x + 2 * TS, this.y + 8, 10, '#ffffff', 'dust'); TourKit.sfx('plop', 'bump', { vol: 0.5, pitch: 0.8 });
    if (this.dose === this.need) say(this.g, this.cx, this.y - TS, 'THE CORK FLOATS!', SA.GOLD);
    else if (this.dose < this.need) say(this.g, this.cx, this.y - TS, 'THICKER... ' + this.dose + ' / ' + this.need, '#ffffff');
    if (this.lip && this.dose > this.need && this.cork && !this.cork.riding()) { this.cork.drift = 1; say(this.g, this.cx, this.y - TS, 'TOO SALTY! IT FLOATS OFF', '#ff9a8a'); this.goneT = 3.5; }
  }
  update(dt) {
    this.t += dt;
    if (!this.cork) { this.cork = new SaltCork(this.g, this); this.g.spawn(this.cork); }
    if (this.goneT > 0) { this.goneT -= dt; if (this.goneT <= 0) { this.dose = 0; this.cork.reset(); } }
  }
  level() { return Math.min(1, this.dose / this.need); }
  touchPlayer() {}
  draw(ctx) {
    const x0 = this.x, w = this.w, top = this.y + 10, bot = (this.by + 1) * TS, k = this.level();
    ctx.save();
    // brine: darker and greener when thin, deep cobalt when thick
    ctx.fillStyle = k >= 1 ? 'rgba(40,90,210,0.78)' : `rgba(${80 - 40 * k},${150 - 60 * k},${220 - 10 * k},0.66)`; ctx.fillRect(x0, top, w, bot - top);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = x0; x <= x0 + w; x += 8) ctx.lineTo(x, top + Math.sin(x * 0.08 + this.t * 3) * 2); ctx.stroke();
    // the density gauge on the near wall: bands, the filled ones white, the float band gold
    const gx = x0 + 8, gh = Math.min(bot - top - 16, 3 * TS), gy0 = top + 8;
    ctx.save(); ctx.fillStyle = 'rgba(10,20,50,0.75)'; rr(ctx, gx - 4, gy0 - 4, 22, gh + 8, 6); ctx.fill(); ctx.restore();
    if (this.cork) this.cork.drawBody(ctx);
    for (let q = 0; q < this.need + (this.lip ? 1 : 0); q++) { const bh = gh / (this.need + (this.lip ? 1 : 0)), yy = gy0 + gh - (q + 1) * bh; ctx.fillStyle = q < this.dose ? (q === this.need - 1 ? SA.GOLD : '#ffffff') : (q >= this.need ? 'rgba(255,120,110,0.5)' : 'rgba(255,255,255,0.18)'); ctx.fillRect(gx, yy + 1, 14, bh - 2); }
    ctx.restore();
  }
}
// the cork: a platform; in its cradle at the bottom until the brine is thick enough, then it rises to ride at the
// surface; with Brady on it, it drifts across to the far side (and back when he steps off)
class SaltCork extends Ent {
  constructor(g, basin) { super(g, null, 3 * TS, 26); this.B = basin; this.solidTop = true; this.isPlatform = true; this.dx = 0; this.dy = 0; this.friendly = true; this.reset(); }
  reset() { const B = this.B; this.drift = 0; this.x = B.x0 * TS + 4; this.home = this.x; this.far = (B.x1 - 2) * TS - 4; this.ry = (B.by + 1) * TS - this.h; this.y = 1e5; this.remove = false; this.dead = false; }
  afloat() { return this.B.dose >= this.B.need && !(this.drift > 2.5); }
  riding() { const p = this.g.player; return !!(p && p.ride === this && p.onGround); }
  update(dt) {
    this.t += dt; const B = this.B, px = this.x, py = this.y;
    const surf = B.sy * TS + 8, floor = (B.by + 1) * TS - this.h;
    let ty = B.dose >= B.need ? surf : lerp(floor, floor - 0.6 * TS, B.dose / B.need);
    if (this.drift > 0) { this.drift += dt; ty = surf - this.drift * 2.6 * TS; this.x += dt * 1.2 * TS; }
    this.ry = approach(this.ry, ty, dt * (this.ry > ty ? 2.2 : 3) * TS) + (B.dose >= B.need && !this.drift ? Math.sin(this.t * 2.4) * 0.15 : 0);
    if (B.dose >= B.need && !this.drift) { const goal = this.riding() ? this.far : this.home; this.x = approach(this.x, goal, dt * 1.6 * TS); }
    // sunk in its cradle it is no floor (the brine is deep): only a floating cork holds Brady
    this.y = this.afloat() ? this.ry : 1e5;
    this.dx = this.x - px; this.dy = py > 1e4 || this.y > 1e4 ? 0 : this.y - py;
  }
  touchPlayer() {}
  // the basin draws it (sunk, its hitbox is far below and the engine would not draw it)
  draw() {}
  drawBody(ctx) {
    const B = this.B, cx = this.cx, by = this.ry + this.h, k = B.level();
    if (this.drift > 3.4) return;
    // the cradle (until it floats)
    if (B.dose < B.need) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = SA.CHAR; ctx.fillRect(this.home - 6, (B.by + 1) * TS - 8, this.w + 12, 8); ctx.strokeRect(this.home - 6, (B.by + 1) * TS - 8, this.w + 12, 8); ctx.restore(); }
    SA.cork(ctx, cx, by, this.w, this.h + 8);
    // its weight (a little iron) and its float line: a white dashed line across it that climbs as the brine thickens
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = SA.CHAR; ctx.fillRect(cx - 8, by - 2, 16, 8); ctx.strokeRect(cx - 8, by - 2, 16, 8);
    const fl = by - (this.h + 8) * (0.15 + 0.6 * k); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(this.x - 4, fl); ctx.lineTo(this.x + this.w + 4, fl); ctx.stroke(); ctx.restore();
    if (B.dose >= B.need && !this.drift && !this.riding()) SA.ring(ctx, cx, this.ry + 2, this.t, false, 26);
  }
}
// the spoon: a long salt spoon on a pivot by the basin; land on its handle end and it tips a dose in. auto: the last
// spoon sits under a shaker and tips by itself `auto` seconds after a dose (it fills, then nods: the tell)
class SaltSpoon extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 14); this.x = s.x - TS / 2; this.y = s.y - 14; this.basin = s.basin; this.auto = s.auto || 0; this.solidTop = true; this.isPlatform = true; this.dx = 0; this.dy = 0; this.tip = 0; this.cool = 0; this.autoT = -1; this.friendly = true; }
  basinE() { return byId(this.g, SaltBasin, this.basin); }
  update(dt) {
    this.t += dt; if (this.cool > 0) this.cool -= dt; this.tip = approach(this.tip, 0, dt * 2.5);
    const p = this.g.player, B = this.basinE(); if (!B) return;
    const on = !!(p && !p.dead && p.ride === this);
    if (on && !this.rideWas && this.cool <= 0) this.fire(B);
    this.rideWas = on;
    if (this.autoT >= 0 && B.dose >= 1) { this.autoT += dt; if (this.autoT >= this.auto) { this.autoT = -1; this.fire(B, true); } }
  }
  fire(B, auto) { this.tip = 1; this.cool = 0.7; B.addDose(); if (this.auto && !auto && B.dose === B.need) this.autoT = 0; if (auto) this.autoT = -1; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y + this.h, k = this.tip, B = this.basinE();
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the pivot block
    ctx.fillStyle = SA.CRYS_D; ctx.fillRect(x + this.w / 2 - 8, y - 2, 16, 10); ctx.strokeRect(x + this.w / 2 - 8, y - 2, 16, 10);
    // the spoon: handle under Brady, bowl hanging out over the basin (it nods down into it when it tips)
    ctx.save(); ctx.translate(x + this.w / 2, y - 4); ctx.rotate(k * 0.5);
    ctx.fillStyle = '#d8dce8'; rr(ctx, -this.w / 2, -6, this.w, 8, 3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(this.w / 2 + 14, -2, 15, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // its load of salt (the auto spoon fills under its shaker before it nods)
    const full = this.auto ? (this.autoT >= 0 ? Math.min(1, this.autoT / this.auto) : (B && B.dose === 0 ? 1 : 0.2)) : 1;
    if (k < 0.3 && full > 0.05) { ctx.fillStyle = SA.CRYS; ctx.beginPath(); ctx.ellipse(this.w / 2 + 14, -6, 12 * full + 2, 5 * full + 1, 0, Math.PI, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    if (this.auto) {
      const sx = x + this.w / 2 + 14 + this.w / 2, sy = y - 4.5 * TS, shaking = this.autoT >= 0 && this.autoT > this.auto - 1.0;
      ctx.fillStyle = SA.COBALT; ctx.fillRect(sx - 14 + (shaking ? Math.sin(this.t * 40) * 3 : 0), sy - 26, 28, 22); ctx.strokeRect(sx - 14, sy - 26, 28, 22);
      ctx.fillStyle = SA.CHAR; ctx.beginPath(); ctx.ellipse(sx, sy - 2, 18, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
      if (this.autoT >= 0) { SA.stream(ctx, sx, sy + 4, y - 14, this.t, 0.5); SA.pill(ctx, sx, sy - 40, 'REFILLING: ' + Math.max(0, this.auto - this.autoT).toFixed(1) + 's', '#ffd84a'); }
    }
    ctx.restore();
    if (!this.told && this.g.player && Math.abs(this.g.player.cx - this.cx) < 4 * TS) { this.told = true; }
  }
}

/* ======================= 34-3: crystals that grow ======================= */
// a crystal: its stem cells (solid from the start) and its plan: the cells that grow, in order, one per hold; brine:
// { y0, y1, x0, x1, speed } the trough that rises once growth starts (reaching row y1 dissolves the grown cubes)
class SaltCrystal extends SaltMark {
  constructor(g, s) {
    super(g, s, TS, TS); this.id = s.id; this.stem = s.stem; this.plan = s.plan; this.n = 0; this.k = 0; this.hold = 0; this.brine = s.brine || null; this.lvl = 0; this.cue = 'HOLD THROW';
    hideTiles(g, this.plan);
  }
  live() { return this.n < this.plan.length; }
  // Brady stands on any cube of this crystal (stem or grown)
  saltTouch(p) {
    if (!this.live() || !p || p.dead || !p.onGround) return false;
    const fy = p.groundTy, cells = this.stem.concat(this.plan.slice(0, this.n));
    return cells.some(([x, y]) => y === fy && Math.abs(p.cx - (x * TS + TS / 2)) < TS * 0.9);
  }
  saltInput(p, inp) { this.held = !!inp.action; this.heldT = this.g.t; }
  update(dt) {
    this.t += dt; const g = this.g;
    if (this.k > 0) this.k = Math.max(0, this.k - dt * 3);
    if (this.live() && this.holding()) {
      this.hold += dt;
      if (this.hold >= 0.45) { const c = this.plan[this.n++]; showTiles(g, [c], T.HARD); liftOut(g, [c]); this.hold = 0; this.k = 1; g.burst((c[0] + 0.5) * TS, (c[1] + 0.5) * TS, 10, '#ffffff', 'spark'); TourKit.sfx('grow', 'select', { vol: 0.5, pitch: 1 + this.n * 0.12 }); if (this.brine && this.n === 1) say(g, this.cx, this.y - 2 * TS, 'THE BRINE IS RISING!', '#ff9a8a'); }
    } else this.hold = 0;
    // the brine rising in the trough under the last crystal: once it touches the stem's foot, the new cubes dissolve
    const B = this.brine;
    if (B) {
      if (this.n > 0 && this.n < this.plan.length) this.lvl = Math.min(1, this.lvl + dt / B.time);
      else if (this.n === 0 || this.n >= this.plan.length) this.lvl = Math.max(0, this.lvl - dt / 2);
      if (this.lvl >= 1) { hideTiles(g, this.plan.slice(0, this.n)); this.n = 0; this.lvl = 0.99; say(g, this.cx, this.y - 2 * TS, 'DISSOLVED! IT DRAINS... TRY AGAIN', '#ff9a8a'); this.lvl = 0.98; this.drain = true; }
      if (this.drain) { this.lvl = Math.max(0, this.lvl - dt / 1.5); if (this.lvl <= 0) this.drain = false; }
    }
  }
  draw(ctx) {
    const g = this.g, t = this.t;
    // the brine trough
    if (this.brine) {
      const B = this.brine, top = lerp((B.y1 + 1) * TS + 2 * TS, B.y1 * TS + TS, this.lvl);
      ctx.save(); ctx.fillStyle = 'rgba(58,120,216,0.7)'; ctx.fillRect(B.x0 * TS, top, (B.x1 - B.x0 + 1) * TS, (B.y1 + 4) * TS - top);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = B.x0 * TS; x <= (B.x1 + 1) * TS; x += 8) ctx.lineTo(x, top + Math.sin(x * 0.07 + t * 4) * 2); ctx.stroke();
      // the stem's danger line (where the brine touches it)
      ctx.setLineDash([6, 5]); ctx.strokeStyle = '#ff9a8a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(B.x0 * TS, B.y1 * TS + TS); ctx.lineTo((B.x1 + 1) * TS, B.y1 * TS + TS); ctx.stroke(); ctx.restore();
    }
    // the grown cubes (drawn over the hard tiles), the stem, and the dashed preview of the next one
    for (const [x, y] of this.stem) SA.cube(ctx, x * TS, (y + 1) * TS, TS);
    for (let q = 0; q < this.n; q++) { const [x, y] = this.plan[q], s = q === this.n - 1 && this.k > 0 ? TS * (1 - this.k * 0.4) : TS; SA.cube(ctx, x * TS + (TS - s) / 2, (y + 1) * TS - (TS - s) / 2, s); }
    if (this.live()) {
      const [x, y] = this.plan[this.n], p = g.player, hot = p && this.saltTouch(p), k = 0.5 + 0.5 * Math.sin(t * 5);
      ctx.save(); ctx.globalAlpha = hot ? 0.75 + 0.25 * k : 0.45; SA.cube(ctx, x * TS, (y + 1) * TS, TS, 1, true);
      if (this.hold > 0) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; const s = TS * this.hold / 0.45; ctx.fillRect(x * TS + (TS - s) / 2, y * TS + (TS - s) / 2, s, s); }
      ctx.restore();
      if (hot && !this.holding()) SA.cue(ctx, p.cx, p.y - 0.6 * TS, t, this.cue);
    }
  }
}

/* ======================= 34-4: the shaker cap ======================= */
// the cap: holes at columns `holes` on floor row fy (Brady walks on the cap's disc, row fy); a bowl under each
// hole; the gold bowl (index `gold`) needs `need` of one pour (1 = all of it); a cellar gate (a lock) opens when it
// gets it. The cap shakes (1.0 s tell) every `per` seconds, then pours for 1.2 s.
class SaltCap extends Ent {
  constructor(g, s) { super(g, s, TS, TS); Object.assign(this, { id: s.id, holes: s.holes, fy: s.fy, bowlY: s.bowlY, gold: s.gold, need: s.need, per: s.per || 4.2, lock: s.lock, narrow: !!s.narrow }); this.cyc = 1.0; this.got = s.holes.map(() => 0); this.done = false; this.back = true; this.friendly = true; this.x = (s.holes[0] - 2) * TS; this.w = (s.holes[s.holes.length - 1] - s.holes[0] + 5) * TS; this.y = (s.fy - 2) * TS; this.h = 2 * TS; }
  plugged(k) { const p = this.g.player; if (!p || p.dead || !p.onGround || p.groundTy !== this.fy + 1) return false; return Math.abs(p.cx - (this.holes[k] + 0.5) * TS) < TS * 0.66; }
  update(dt) {
    this.t += dt; if (this.done) return;
    const g = this.g, p = g.player; if (!p || Math.abs(p.cx - this.cx) > 14 * TS) return;
    this.cyc += dt;
    const shake = this.cyc >= this.per - 1.0 && this.cyc < this.per, pour = this.cyc >= this.per && this.cyc < this.per + 1.2;
    if (shake && !this.toldS) { this.toldS = true; TourKit.sfx('rattle', 'select', { vol: 0.3, pitch: 0.5 }); }
    if (pour) {
      if (!this.open) { this.open = this.holes.map((_, k) => !this.plugged(k)); this.got = this.holes.map(() => 0); }
      const n = this.open.filter(Boolean).length;
      // the plug can't change mid-pour: the shoe goes down as it starts
      this.open.forEach((o, k) => { if (o && n) this.got[k] += dt / 1.2 / n; });
    }
    if (this.cyc >= this.per + 1.2) {
      const gk = this.got[this.gold] || 0;
      if (gk >= this.need - 0.02) { this.done = true; g.keys.add(this.lock); say(g, (this.holes[this.gold] + 0.5) * TS, this.bowlY * TS - 2 * TS, 'THE GOLD BOWL SINKS! THE GATE LIFTS', SA.GOLD); TourKit.sfx('clunk', 'secret', { vol: 0.5 }); }
      else if (this.open) say(g, (this.holes[this.gold] + 0.5) * TS, this.bowlY * TS - 2 * TS, gk > 0 ? 'NOT ENOUGH IN THE GOLD BOWL' : 'NONE IN THE GOLD BOWL', '#ffffff');
      this.cyc = 0; this.open = null; this.toldS = false; if (!this.done) this.got = this.holes.map(() => 0);
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const t = this.t, fyp = (this.fy + 1) * TS, shake = !this.done && this.cyc >= this.per - 1.0 && this.cyc < this.per ? Math.sin(t * 46) * 2.5 : 0, pour = !this.done && this.cyc >= this.per && this.cyc < this.per + 1.2;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the holes in the disc: charcoal pinholes; the plugged ones under Brady's shoe; a pour drops from each open one
    this.holes.forEach((hx, k) => {
      const x = (hx + 0.5) * TS + shake, plug = this.plugged(k);
      ctx.fillStyle = '#05050a'; ctx.beginPath(); ctx.ellipse(x, fyp + 4, 9, 4, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = plug ? SA.GOLD : 'rgba(255,255,255,0.7)'; ctx.lineWidth = plug ? 3 : 1.5; ctx.beginPath(); ctx.ellipse(x, fyp + 4, 12, 5.5, 0, 0, TAU); ctx.stroke();
      if (pour && this.open && this.open[k]) SA.stream(ctx, x, fyp + 10, this.bowlY * TS - 12, t, 0.9);
      // the bowl under it (the gold one larger, with its fill line)
      const bx = (hx + 0.5) * TS, by = this.bowlY * TS, gold = k === this.gold, bw = gold && this.narrow ? 11 : gold ? 22 : 18;
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = gold ? SA.GOLD : '#c8ccd8';
      ctx.beginPath(); ctx.moveTo(bx - bw, by - 16); ctx.lineTo(bx + bw, by - 16); ctx.quadraticCurveTo(bx + bw, by, bx, by); ctx.quadraticCurveTo(bx - bw, by, bx - bw, by - 16); ctx.closePath(); ctx.fill(); ctx.stroke();
      const f = Math.min(1, this.done && gold ? 1 : this.got[k] || 0); if (f > 0) { ctx.fillStyle = SA.CRYS; ctx.fillRect(bx - bw + 3, by - 4 - f * 10, 2 * bw - 6, f * 10); }
      if (gold) { ctx.setLineDash([4, 3]); ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(bx - bw + 2, by - 4 - this.need * 10); ctx.lineTo(bx + bw - 2, by - 4 - this.need * 10); ctx.stroke(); ctx.setLineDash([]); }
    });
    ctx.restore();
    if (!this.done) { const gx = (this.holes[this.gold] + 0.5) * TS; SA.pill(ctx, gx, this.bowlY * TS + 16, this.need >= 1 ? 'GOLD BOWL: THE WHOLE POUR' : 'GOLD BOWL: HALF A POUR', SA.GOLD); }
    if (!this.done && this.cyc >= this.per - 1.0 && this.cyc < this.per) SA.pill(ctx, this.cx, this.y - 6, 'THE CAP SHAKES...', '#ffffff');
  }
}
// the cellar gate: a cobalt glass slab (a lock) that slides up when its cap's gold bowl sinks
class SaltCellarGate extends ENTITY_TYPES.lock {
  update(dt) { super.update(dt); if (!this.open && this.g.keys.has(this.id) && this.g.player) this.touchPlayer(this.g.player); }
  draw(ctx) {
    const k = this.open ? clamp((this.openT || 0) / 0.6, 0, 1) : 0, x = this.x, y = this.y - k * this.h, h = this.h;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.globalAlpha = 1 - k * 0.6;
    ctx.fillStyle = SA.COBALT; ctx.fillRect(x + 2, y, TS - 4, h); ctx.strokeRect(x + 2, y, TS - 4, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 6, y + 6, 5, h - 12);
    ctx.fillStyle = SA.GOLD; ctx.beginPath(); ctx.arc(x + TS / 2, y + h / 2, 7, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}


/* ======================= 34-5's lead-in: weighing spoons ======================= */
// a weighing spoon on the floor (columns x0..x1, Brady on row fy), its dial on a post, a shaker over its bowl and a
// pot past it with a lid (a lock). Stand on the spoon: the shaker shakes (0.8 s), then pours; the needle climbs. Step
// off (both feet) in the gold band: the spoon tips a pinch into the pot and its lid lifts. shoe: Brady's own weight
// counts on the needle while he stands there (step off at the shoe mark). A miss: the spoon empties, try again
class SaltWeigh extends Ent {
  constructor(g, s) { super(g, s, TS, TS); Object.assign(this, { id: s.id, x0: s.x0, x1: s.x1, fy: s.fy, lock: s.lock, shoe: !!s.shoe }); this.x = s.x0 * TS; this.w = (s.x1 - s.x0 + 1) * TS; this.y = (s.fy - 5) * TS; this.h = 6 * TS; this.S = 0; this.read = 0; this.state = 'wait'; this.st = 0; this.tip = 0; this.done = false; this.back = true; this.friendly = true; }
  on() { const p = this.g.player; return !!(p && !p.dead && p.onGround && p.groundTy === this.fy + 1 && p.cx > this.x && p.cx < this.x + this.w); }
  reading() { return this.S + (this.shoe && this.on() ? 0.4 : 0); }
  update(dt) {
    this.t += dt; this.tip = Math.max(0, this.tip - dt * 1.5);
    const g = this.g, on = this.on(); this.read = approach(this.read, this.reading(), dt * 2.5);
    if (this.done) return;
    this.st += dt;
    if (this.state === 'wait') { if (on && this.st > 0.3) { this.state = 'shake'; this.st = 0; } return; }
    if (this.state === 'shake') { if (!on) { this.state = 'wait'; this.st = 0; return; } if (this.st > 0.8) { this.state = 'pour'; this.st = 0; } return; }
    if (this.state === 'pour') {
      if (on && this.st < 4) this.S += 0.4 * dt;
      if (!on) { this.judge(); return; }
      if (this.S > 1.17) { this.S = 0; this.tip = 1; say(g, this.cx, this.y, 'TOO SALTY! STEP OFF SOONER', '#ffffff'); this.state = 'rest'; this.st = 0; }
      return;
    }
    if (this.state === 'rest') { if (this.st > 1.2 && !on) { this.state = 'wait'; this.st = 0; } }
  }
  judge() {
    const g = this.g, S = this.S; this.S = 0; this.tip = 1; this.st = 0;
    if (S >= 0.85 && S <= 1.15) { this.done = true; g.keys.add(this.lock); say(g, this.cx, this.y, 'A PINCH! THE LID LIFTS', SA.GOLD); TourKit.sfx('ding', 'secret', { vol: 0.5 }); this.state = 'done'; return; }
    say(g, this.cx, this.y, S < 0.05 ? 'STAY ON TILL IT POURS' : 'BLAND! STAY ON LONGER', '#ffffff'); this.state = 'rest';
  }
  touchPlayer() {}
  draw(ctx) {
    const fyp = (this.fy + 1) * TS, on = this.on(), x0 = this.x, x1 = this.x + this.w, t = this.t;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    // the spoon: level with Brady on it, tipped toward the pot when he's off
    ctx.save(); ctx.translate((x0 + x1) / 2, fyp - 5); ctx.rotate(on ? 0 : -0.06 - this.tip * 0.25);
    ctx.fillStyle = '#d8dce8'; rr(ctx, -this.w / 2, -4, this.w - 30, 8, 4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(this.w / 2 - 20, -2, 22, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    if (this.S > 0.02) { ctx.fillStyle = SA.CRYS; ctx.beginPath(); ctx.ellipse(this.w / 2 - 20, -7, Math.min(1.2, this.S) * 18, 4 + this.S * 4, 0, Math.PI, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    // the shaker over the bowl
    const sx = x1 - 20, sy = fyp - 4 * TS, sh = this.state === 'shake' ? Math.sin(t * 40) * 3 : 0;
    ctx.fillStyle = SA.COBALT; ctx.fillRect(sx - 14 + sh, sy - 26, 28, 22); ctx.strokeRect(sx - 14 + sh, sy - 26, 28, 22); ctx.fillStyle = SA.CHAR; ctx.beginPath(); ctx.ellipse(sx + sh, sy - 3, 17, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (this.state === 'pour' && on && this.st < 4) SA.stream(ctx, sx, sy + 3, fyp - 12, t, 0.55);
    // the dial on its post at the spoon's handle end
    const dx = x0 + 20, dy = fyp - 3.3 * TS, R = 30, ang = v => Math.PI + clamp(v / 1.6, 0, 1) * Math.PI;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.fillStyle = SA.CHAR; ctx.fillRect(dx - 3, dy, 6, fyp - dy - 8);
    ctx.fillStyle = '#f6f2e8'; ctx.beginPath(); ctx.arc(dx, dy, R, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 9; ctx.strokeStyle = SA.GOLD; ctx.beginPath(); ctx.arc(dx, dy, R - 7, ang(0.85), ang(1.15)); ctx.stroke();
    if (this.shoe) { const a = ang(1.4); ctx.fillStyle = '#c84a3a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; rr(ctx, dx + Math.cos(a) * (R - 7) - 6, dy + Math.sin(a) * (R - 7) - 4, 12, 8, 3); ctx.fill(); ctx.stroke(); }
    const a = ang(this.read); ctx.lineWidth = 4; ctx.strokeStyle = '#c8323a'; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + Math.cos(a) * (R - 4), dy + Math.sin(a) * (R - 4)); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(dx, dy, 4, 0, TAU); ctx.fill(); ctx.restore();
    if (!this.done && !on) SA.ring(ctx, (x0 + x1) / 2, fyp, t, false, this.w / 2);
  }
}
ENTITY_TYPES.saltWeigh = SaltWeigh;
Tour.pieces['salt.weigh'] = function (st, o) { const B = st.B, x = st.x, fy = st.gy - 1, w = o.w || 4; B.spawn('saltWeigh', x, fy, { id: o.id, x0: x, x1: x + w - 1, fy, lock: o.lock, shoe: !!o.shoe }); if (o.lock) B.vkey(o.lock, [[x + 1, fy]], 'any'); return st.x; };

/* ---------------- the land's tell by every secret: one cobalt grain ---------------- */
class SaltGrainTell extends Ent {
  constructor(g, s) { super(g, s, 10, 10); this.back = true; this.friendly = true; this.dy = s.dy || 0; }
  touchPlayer() {}
  draw(ctx) { SA.grain(ctx, this.cx, this.y + this.h - 4 + this.dy, this.t); }
}

Object.assign(ENTITY_TYPES, { saltNotch: SaltNotch, saltHeap: SaltHeap, saltBasin: SaltBasin, saltSpoon: SaltSpoon, saltCrystal: SaltCrystal, saltCap: SaltCap, saltCellarGate: SaltCellarGate, saltGrain: SaltGrainTell });
Object.assign(Tour.saltKit, { SaltWeigh });

/* ---------------- the pieces (the letter's cell: st.x, st.gy - 1) ---------------- */
Object.assign(Tour.pieces, {
  // a notch: the letter is its left column on the tread's top row; { w, id } (the stamp leaves the pit open)
  'salt.notch'(st, o) { const B = st.B, x0 = st.x, gy = st.gy - 1, w = o.w || 5; for (let q = 0; q < w; q++) B.set(x0 + q, gy, T.GROUND); B.spawn('saltNotch', x0, gy, { id: o.id, x0, x1: x0 + w - 1, gy }); return st.x; },
  // a heap: the letter is its mark (Brady stands there); { notches: [ids], cap }
  'salt.heap'(st, o) { st.B.spawn('saltHeap', st.x, st.gy - 1, { notches: o.notches, cap: o.cap }); return st.x; },
  // a basin: the letter is its top-left water cell; { w, d (rows of brine), need, lip, id }; the cork's deck: ghosts
  'salt.basin'(st, o) {
    const B = st.B, x0 = st.x, sy = st.gy - 1, w = o.w || 8, d = o.d || 4;
    B.spawn('saltBasin', x0, sy, { id: o.id, x0, x1: x0 + w - 1, sy, by: sy + d - 1, need: o.need || 2, lip: !!o.lip });
    // the checker: the cork's whole ride is one-way floor across the surface
    for (let q = 0; q < w; q++) B.ghosts.push([x0 + q, sy]);
    return st.x;
  },
  // a spoon: the letter is its handle (Brady lands there); { basin, auto }
  'salt.spoon'(st, o) { st.B.spawn('saltSpoon', st.x, st.gy - 1, { basin: o.basin, auto: o.auto || 0 }); return st.x; },
  // a crystal: the letter is its stem's top cell; { h (stem rows down), plan: [[dx, dy], ...] relative to the letter,
  // brine: { dx0, dx1, dy } relative (the row under which the brine must stay), time }
  'salt.crystal'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1, stem = [];
    for (let k = 0; k < (o.h || 1); k++) { B.set(x, y + k, T.HARD); stem.push([x, y + k]); }
    const plan = (o.plan || []).map(([dx, dy]) => [x + dx, y + dy]);
    // the checker: a cube that grows sideways or down is floor from the start; one that grows UP (lifting Brady) is a
    // one-way step (a column of hard cells would be a wall to it)
    plan.forEach(([px, py], i) => { const prev = i ? plan[i - 1] : [x, y]; if (py < prev[1]) B.ghosts.push([px, py]); else B.set(px, py, T.HARD); });
    const brine = o.brine ? { x0: x + o.brine.dx0, x1: x + o.brine.dx1, y1: y + o.brine.dy, time: o.brine.time || 9 } : null;
    B.spawn('saltCrystal', x, y - 1, { id: o.id, stem, plan, brine });
    return st.x;
  },
  // a cap: the letter is the cap's first hole's column on the disc's top row; { holes: [dx...], gold, need, bowlDy,
  // lock, narrow, per }; its gate is placed by 'salt.gate'; the checker's key: standing on the plug spot(s)
  'salt.cap'(st, o) {
    const B = st.B, x = st.x, fy = st.gy - 1, holes = o.holes.map(d => x + d);
    B.spawn('saltCap', x, fy, { id: o.id, holes, fy, bowlY: fy + (o.bowlDy || 5), gold: o.gold, need: o.need, lock: o.lock, narrow: !!o.narrow, per: o.per });
    const plug = (o.plug || []).map(d => [x + d, fy]); if (plug.length) B.vkey(o.lock, plug, 'any');
    return st.x;
  },
  // the cellar gate: a lock h rows tall whose foot is the letter
  'salt.gate'(st, o) { const B = st.B, x = st.x, y = st.gy - 1, n = B.spawns.length; B.lock(x, y - (o.h || 4) + 1, y, o.id, 'door'); for (let k = n; k < B.spawns.length; k++) if (B.spawns[k].type === 'lock') B.spawns[k].type = 'saltCellarGate'; return st.x; },
  // the cobalt grain (the land's tell by every secret)
  'salt.grain'(st, o) { st.B.spawn('saltGrain', st.x, st.gy - 1, { dy: o.dy || 0 }); return st.x; }
});

Object.assign(TourLandscape.ARCH_LABEL, { repose: 'HEAPS', brinefloat: 'CORKS', cubegrow: 'CRYSTALS', shakercap: 'THE CAP' });
Object.assign(Tour.saltKit, { SaltMark, SaltNotch, SaltHeap, SaltBasin, SaltCork, SaltSpoon, SaltCrystal, SaltCap, hideTiles, showTiles, liftOut, byId });
})();
