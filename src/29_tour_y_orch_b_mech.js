/* ============================================================
   THE ORCHARD AFTER CLOSING: the growing things of 28-2 to 28-6. Every prop takes the THROW button only while Brady
   stands on its pulsing gold mark (29_tour_y_orch.js: orchProp).
   28-2 APPOINTMENT WITH A BEE (pollinate): a bell flower on a mark; THROW knocks it and the bee that was bumbling
        round it flies off to the blossom it points at. A blossom the bee reaches while open blooms into a big petal
        pad: a step. A SHY blossom shuts while Brady is near it and opens again 1.2 s after he walks off: send the bee
        from a bell farther away so it arrives as the petals open (too early: the bee bumps the bud and comes back).
   28-3 CUT ABOVE (pinch): a marked bud on a stem; THROW pinches it and its two side shoots grow out into steps. The
        last stem's lower bud is a knob to stand on: pinch the top bud FROM the lower one (pinch the lower one first
        and the knob is gone: it grows back in a few seconds).
   28-4 A PEAR IN A SLEEVE (unscrew): a paper-sleeved pear hangs from a branch; standing on its flat top, walking
        AGAINST the spiral seam unscrews it down (walking with the seam winds it back up). Brady stays put on it like
        on a log. A late sleeve changes handedness at a rust tie on its stalk: past the tie the seam (and its arrows)
        turn the other way, and walking on the old way winds him back up to the tie.
   28-5 THE GRAFT TAKES (graft): two cut branches across a gap, the far one swaying; stand on the near one's tip mark and
        THROW when the bark notches line up: they bind into a living arch. On the last one Brady's weight pulls the
        near cut down: wait for the far cut's low swing.
   28-6 the lead-in (pluck): a loaded branch over a mark; THROW from underneath plucks it and its spring flicks the pear
        into the voting basket. Three votes open the committee's gate. A branch that leans AWAY from the basket must
        first be persuaded: THROW at its far-side mark and it leans back.
   The checker: grown tiles (petal pads, shoots, arches) are in the level for it from the start (the game hides them
   until grown: their props stand before them on the way); a sleeve's whole travel is one-way floor (like a lift); the
   committee gate is a lock whose key is standing on the last pluck mark.
   ============================================================ */
(function () {
const OK = Tour.orchKit, INK = OK.INK, OA = OK.OrchArt, say = OK.say, onMark = OK.onMark;
const markOf = s => ({ tx: Math.round((s.x - TS / 2) / TS), fy: Math.round(s.y / TS) });
// tiles a prop grows: hidden at load (the checker sees them from the start), shown when grown
const hideTiles = (g, L) => { for (const [x, y] of L) g.setTile(x, y, T.EMPTY); };
const growTiles = (g, L, t) => { for (const [x, y] of L) g.setTile(x, y, t == null ? T.SEMI : t); };
const liftOut = (g, L) => { const p = g.player; if (!p || p.dead) return; for (const [x, y] of L) if (p.x < (x + 1) * TS && p.x + p.w > x * TS && p.y < (y + 1) * TS && p.y + p.h > y * TS) { p.y = y * TS - p.h; p.vy = Math.min(0, p.vy); } };

/* a mark prop: subclasses define act(p) */
class OrchMark extends Ent {
  constructor(g, s, w, h) { super(g, s, w || TS, h || TS); const m = markOf(s); this.tx = m.tx; this.fy = m.fy; this.friendly = true; this.back = true; this.orchProp = true; this.cue = 'THROW'; }
  live() { return true; }
  orchTouch(p) { return this.live() && onMark(p, this.tx, this.fy, 0.8); }
  orchInput(p, inp) { if (inp.actionPressed) this.act(p); }
  touchPlayer() {}
  drawMark(ctx) { const p = this.g.player, hot = p && this.orchTouch(p); if (this.live()) OA.ring(ctx, (this.tx + 0.5) * TS, this.fy * TS, this.t, hot, 17); if (hot) OA.cue(ctx, (this.tx + 0.5) * TS, this.fy * TS - 2.4 * TS, this.t, this.cue); }
}

/* ======================= 28-2: the bee, the bells, the blossoms ======================= */
const byId = (g, cls, id) => g.entities.find(e => e instanceof cls && e.id === id && !e.remove);
class OrchBlossom extends Ent {
  // { id, pad: [[x, y], ...] (the petal pad's tiles), shy }
  constructor(g, s) { super(g, s, TS * 2, TS * 2); this.id = s.id; this.pad = s.pad; this.shy = !!s.shy; this.open = this.shy ? 0 : 1; this.away = 0; this.done = false; this.back = true; this.hx = s.x; this.hy = s.y; hideTiles(g, this.pad); }
  update(dt) {
    this.t += dt;
    if (this.done) { this.open = 1; return; }
    if (this.shy) {
      const p = this.g.player, near = p && Math.abs(p.cx - this.hx) < 4.5 * TS && Math.abs(p.cy - this.hy) < 5 * TS;
      if (near) { this.away = 0; this.open = Math.max(0, this.open - dt * 3); } else { this.away += dt; if (this.away > 0.6) this.open = Math.min(1, this.open + dt / 0.6); }
    }
  }
  isOpen() { return this.done || this.open > 0.85; }
  pollinate() {
    if (this.done) return; this.done = true; growTiles(this.g, this.pad); liftOut(this.g, this.pad);
    Sound.play('coin', { vol: 0.5, pitch: 0.8 }); this.g.burst(this.hx, this.hy - TS, 18, '#ffe070', 'confetti');
    say(this.g, this.hx, this.hy - 2 * TS, 'IN FULL BLOOM!', '#ffd84a');
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.hx, by = this.hy, t = this.t, o = this.open;
    // the stem up to the head (the head sits where the pad grows)
    const pad = this.pad, px0 = Math.min(...pad.map(q => q[0])), px1 = Math.max(...pad.map(q => q[0])), py = pad[0][1];
    const hx = (px0 + px1 + 1) / 2 * TS, hy = py * TS + 6;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, by); ctx.quadraticCurveTo(x + 8, (by + hy) / 2, hx, hy + 6); ctx.stroke(); ctx.strokeStyle = '#5a8a3a'; ctx.lineWidth = 4.5; ctx.stroke(); ctx.restore();
    OA.leaf(ctx, x + 4, (by + hy) / 2 + 10, 1.3, -0.4); OA.leaf(ctx, x - 2, (by + hy) / 2 + 30, 1.2, -2.6);
    if (this.done) {
      // the open bloom: a wide flat ring of cream petals (the pad), a gold heart
      const w = (px1 - px0 + 1) * TS / 2 + 6;
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; ctx.fillStyle = k % 2 ? '#fff4f8' : '#f8d8e8'; ctx.beginPath(); ctx.ellipse(hx + Math.cos(a) * w * 0.55, hy + 4 + Math.sin(a) * 6, w * 0.5, 7, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#f0c040'; ctx.beginPath(); ctx.ellipse(hx, hy + 2, 12, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore(); return;
    }
    // a bud opening to o (0 shut, 1 open), five petals
    ctx.save(); ctx.translate(hx, hy); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * (0.25 + o * 0.5); ctx.save(); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = k % 2 ? '#fff4f8' : '#f8d8e8'; ctx.beginPath(); ctx.ellipse(0, -14 - o * 6, 8 + o * 3, 15, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (o > 0.5) { ctx.fillStyle = '#f0c040'; ctx.beginPath(); ctx.arc(0, -4, 6 * o, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    // a shy one shows it: a little Zzz while shut
    if (this.shy && o < 0.3) OA.pill(ctx, hx, hy - 46, 'SHY... STAND BACK', '#ffffff', 0.8);
  }
}
class OrchBee extends Ent {
  constructor(g, bell) { super(g, null, 20, 18); this.bell = bell; this.hx = bell.cx; this.hy = bell.fy * TS - 3 * TS; this.x = this.hx; this.y = this.hy; this.state = 'idle'; this.friendly = true; }
  send(bl) { if (this.state !== 'idle' || !bl || bl.done) return false; this.target = bl; this.state = 'go'; this.sx = this.x; this.sy = this.y; this.k = 0; const tx = bl.hx0(), ty = bl.hy0(); this.dur = Math.max(0.5, Math.hypot(tx - this.sx, ty - this.sy) / (4 * TS)); return true; }
  update(dt) {
    this.t += dt;
    if (this.state === 'idle') { this.x = this.hx + Math.sin(this.t * 1.7) * 26 - this.w / 2; this.y = this.hy + Math.sin(this.t * 3.1) * 8; return; }
    const bl = this.target, tx = bl.hx0(), ty = bl.hy0();
    if (this.state === 'go') {
      this.k += dt / this.dur; const k = Math.min(1, this.k);
      this.x = lerp(this.sx, tx, k) - this.w / 2; this.y = lerp(this.sy, ty, k) - Math.sin(k * Math.PI) * 40;
      if (k >= 1) {
        if (bl.isOpen()) { bl.pollinate(); this.state = 'home'; this.k = 0; this.sx = this.x; this.sy = this.y; }
        else { say(this.g, tx, ty - 30, 'BUMP! TOO EARLY', '#ffffff'); TourKit.sfx('bump', 'bump', { vol: 0.3, pitch: 1.8 }); this.state = 'home'; this.k = 0; this.sx = this.x; this.sy = this.y; }
      }
    } else if (this.state === 'home') {
      this.k += dt / 0.9; const k = Math.min(1, this.k); this.x = lerp(this.sx, this.hx - this.w / 2, k); this.y = lerp(this.sy, this.hy, k) - Math.sin(k * Math.PI) * 20;
      if (k >= 1) this.state = 'idle';
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.cy, t = this.t, d = this.state === 'go' ? sign(this.target.hx0() - this.sx) || 1 : 1;
    if (this.state === 'go') { ctx.save(); ctx.strokeStyle = 'rgba(255,230,120,0.7)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.sx + this.w / 2, this.sy); ctx.lineTo(x, y); ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    const f = Math.sin(t * 50) * 0.5 + 0.5; ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.ellipse(-2, -9 - f * 3, 7, 4, -0.5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(3, -9 - f * 2, 6, 3.5, 0.4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f0c040'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 7.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.fillRect(-4, -7, 3, 14); ctx.fillRect(2, -7, 3, 14);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7, -2, 2.8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(7.8, -2, 1.3, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
OrchBlossom.prototype.hx0 = function () { const pad = this.pad, px0 = Math.min(...pad.map(q => q[0])), px1 = Math.max(...pad.map(q => q[0])); return (px0 + px1 + 1) / 2 * TS; };
OrchBlossom.prototype.hy0 = function () { return this.pad[0][1] * TS; };
class OrchBell extends OrchMark {
  // { to: the blossom's id }
  constructor(g, s) { super(g, s); this.to = s.to; this.bee = null; this.knockT = 0; }
  live() { const bl = this.blossom(); return !!bl && !bl.done; }
  blossom() { return byId(this.g, OrchBlossom, this.to); }
  act(p) {
    if (!this.bee) { this.bee = new OrchBee(this.g, this); this.g.spawn(this.bee); }
    this.knockT = 0.5; TourKit.sfx('ding', 'select', { vol: 0.5, pitch: 1.5 });
    if (this.bee.send(this.blossom())) say(this.g, this.cx, this.fy * TS - 3 * TS, 'OFF YOU GO, BEE', '#ffffff');
  }
  update(dt) { this.t += dt; if (this.knockT > 0) this.knockT -= dt; if (!this.bee && this.g.onScreen(this, 400)) { this.bee = new OrchBee(this.g, this); this.g.spawn(this.bee); } }
  draw(ctx) {
    const x = (this.tx + 0.5) * TS + 18, y = this.fy * TS, sw = this.knockT > 0 ? Math.sin(this.knockT * 40) * 0.3 : Math.sin(this.t * 1.5) * 0.05;
    // a foxglove: a curved stem with a row of hanging purple bells
    ctx.save(); ctx.translate(x, y); ctx.rotate(sw); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-4, -40, 8, -72); ctx.stroke(); ctx.strokeStyle = '#5a8a3a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.lineWidth = 1.4; for (let k = 0; k < 5; k++) { const yy = -26 - k * 10, xx = -2 + k * 2; ctx.strokeStyle = INK; ctx.fillStyle = k % 2 ? '#b85ab0' : '#c86ac0'; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 11, yy - 2); ctx.lineTo(xx + 13, yy + 7); ctx.quadraticCurveTo(xx + 6, yy + 11, xx, yy + 7); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    // the line to its blossom (faint), so the player can see where this bell sends the bee
    const bl = this.blossom(); if (bl && !bl.done && this.live()) { ctx.save(); ctx.strokeStyle = 'rgba(255,240,170,0.28)'; ctx.setLineDash([3, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 3 * TS); ctx.lineTo(bl.hx0(), bl.hy0()); ctx.stroke(); ctx.restore(); }
    this.drawMark(ctx);
  }
}

/* ======================= 28-3: buds that pinch into shoots ======================= */
class OrchBud extends OrchMark {
  // { bx, by (the bud on the stem), shoots: [[x, y], ...], knob: [x, y] (a bud to stand on: pinched, it's gone) }
  constructor(g, s) {
    super(g, s); this.bx = s.bx; this.by = s.by; this.shoots = s.shoots; this.knob = s.knob || null; this.done = false; this.grow = 0; this.backT = 0; this.cue = 'PINCH';
    hideTiles(g, this.shoots);
  }
  live() { return !this.done; }
  act(p) {
    if (this.done) return; this.done = true; this.grow = 0;
    growTiles(this.g, this.shoots); liftOut(this.g, this.shoots); TourKit.sfx('snip', 'kick', { vol: 0.4, pitch: 1.7 });
    if (this.knob) { this.g.setTile(this.knob[0], this.knob[1], T.EMPTY); this.backT = 4; say(this.g, this.bx * TS, this.by * TS - 40, 'OOPS, THAT WAS YOUR FOOTHOLD', '#ffffff'); }
    else say(this.g, this.bx * TS + 16, this.by * TS - 40, 'SNIP! SHOOTS!', '#ffd84a');
  }
  update(dt) {
    this.t += dt; if (this.done) this.grow = Math.min(1, this.grow + dt * 2.5);
    // a knob bud grows back (and its stray shoots wither) a few seconds after a wrong pinch
    if (this.knob && this.done && this.backT > 0) { this.backT -= dt; if (this.backT <= 0) { this.done = false; hideTiles(this.g, this.shoots); this.g.setTile(this.knob[0], this.knob[1], T.SEMI); liftOut(this.g, [this.knob]); say(this.g, this.bx * TS, this.by * TS - 40, 'IT GREW BACK', '#ffffff'); } }
  }
  draw(ctx) {
    const x = this.bx * TS + TS / 2 + (this.tx < this.bx ? -TS / 2 - 4 : TS / 2 + 4), y = this.by * TS - 4, t = this.t;
    // the shoots growing out along their tiles
    if (this.done) for (const [sx, sy] of this.shoots) { const k = this.grow; const cx = (sx + 0.5) * TS, w = TS * k; OA.branch(ctx, cx - w / 2, sy * TS + 5, cx + w / 2, sy * TS + 5, 8, 0, OA.PEAR_D); if (k > 0.9 && (sx + sy) % 2) OA.leaf(ctx, cx, sy * TS + 2, 0.9, -1.3); }
    // the knob (a fat bud to stand on)
    if (this.knob && !this.done) { const kx = (this.knob[0] + 0.5) * TS, ky = this.knob[1] * TS; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillStyle = '#9aac34'; ctx.beginPath(); ctx.ellipse(kx, ky + 7, 17, 8, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c0d860'; ctx.beginPath(); ctx.ellipse(kx - 4, ky + 4, 6, 3, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    if (!this.done) {
      // the bud: a plump green tip with a rust marking ring (pinch here)
      const k = 0.5 + 0.5 * Math.sin(t * 4);
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#7aac3a'; ctx.beginPath(); ctx.ellipse(x, y, 9, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a8d060'; ctx.beginPath(); ctx.ellipse(x - 3, y - 4, 3, 5, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(192,70,42,${0.6 + 0.4 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 14 + k * 2, 17 + k * 2, 0, 0, TAU); ctx.stroke(); ctx.restore();
    } else { ctx.save(); ctx.fillStyle = '#e8dca0'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, y + 4, 6, 3, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
    this.drawMark(ctx);
  }
}
// a stem: a pale trunk column (its tiles are solid, drawn as bark)
Object.assign(Decor, {
  orchStem(ctx, x, y, t, th, d) { const h = (d && d.h) || 6 * TS; OA.branch(ctx, x, y, x, y - h + 6, 18, 0, OA.BARK); for (let k = 1; k < h / TS - 1; k += 2) OA.leaf(ctx, x + 8, y - k * TS, 1, -0.6); }
});

/* ======================= 28-4: the paper sleeves ======================= */
class OrchSleeve extends Ent {
  // { x0 (left col), top, bot (rows Brady stands in at the top and bottom of the travel), hand (+1: walking LEFT
  //   unscrews it down), join (a row: past it the seam turns the other way), hangY (the branch row) }
  constructor(g, s) {
    super(g, s, 3 * TS, 14); this.x = s.x0 * TS; this.top = s.top; this.bot = s.bot; this.hand = s.hand || 1; this.join = s.join != null ? s.join : null; this.hangY = s.hangY;
    this.y = ((s.start === 'bot' ? this.bot : this.top) + 1) * TS; this.isPlatform = true; this.dx = 0; this.dy = 0; this.turn = 0; this.spin = 0; this.flipT = 0;
  }
  // the handedness at the sleeve's present depth
  hd() { return this.join != null && this.y >= (this.join + 1) * TS - 2 ? -this.hand : this.hand; }
  update(dt) {
    this.t += dt; if (this.flipT > 0) this.flipT -= dt;
    const p = this.g.player, on = p && p.ride === this && !p.dead;
    let walk = 0;
    if (on && p.inp) walk = (p.inp.right ? 1 : 0) - (p.inp.left ? 1 : 0);
    const h0 = this.hd();
    // walking against the seam (-hand) unscrews it down; with it, winds it up
    const dir = walk === 0 ? 0 : walk === -h0 ? 1 : -1, sp = 2.2 * TS;
    const y0 = this.y; this.y = clamp(this.y + dir * sp * dt, (this.top + 1) * TS, (this.bot + 1) * TS);
    this.dy = this.y - y0; this.spin += dir * dt * 6;
    // Brady walks on the spot (the sleeve turns under him)
    this.dx = on ? -(p.vx || 0) * dt : 0;
    if (this.hd() !== h0) { this.flipT = 1.2; say(this.g, this.cx, this.y - 50, 'THE SEAM TURNS THE OTHER WAY!', '#ffd84a'); TourKit.sfx('rip', 'kick', { vol: 0.3, pitch: 1.4 }); }
    if (dir && Math.floor(this.spin * 2) !== Math.floor((this.spin - dir * dt * 6) * 2)) TourKit.sfx('crinkle', 'select', { vol: 0.12, pitch: 2.2 });
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, w = this.w, cx = this.cx, y = this.y, t = this.t, hy = this.hangY * TS + 6, H = 2.2 * TS, h = this.hd();
    // the branch it hangs from, the unwound paper ribbon (a helix) from the branch to the sleeve
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, hy); ctx.lineTo(cx, y); ctx.stroke(); ctx.strokeStyle = OA.BARK; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = 3; ctx.beginPath(); for (let yy = hy + 10; yy < y - 4; yy += 3) ctx.lineTo(cx + Math.sin(yy * 0.12 + this.spin) * 9, yy); ctx.stroke(); ctx.restore();
    // the join: a rust tie on the stalk (past it the seam turns the other way)
    if (this.join != null) { const jy = (this.join + 1) * TS - 2; OA.tie(ctx, cx, jy - 10, 1.3); if (y < jy - 4) { ctx.save(); ctx.strokeStyle = 'rgba(192,70,42,0.7)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 10, jy); ctx.lineTo(x + w + 10, jy); ctx.stroke(); ctx.restore(); } }
    // the sleeve: a paper cone round a pear, a flat top (the platform); the seam's stripes slant one way or the other
    const col = h === this.hand ? '#f4ead2' : '#e8b8a0', st = h === this.hand ? '#a8987a' : OA.RUST;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    const path = () => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - 10, y + H); ctx.quadraticCurveTo(cx, y + H + 16, x + 10, y + H); ctx.closePath(); };
    ctx.fillStyle = col; path(); ctx.fill();
    ctx.save(); path(); ctx.clip(); ctx.strokeStyle = st; ctx.lineWidth = 5;
    const off = (this.spin * 14) % 22;
    for (let k = -6; k < 10; k++) { const xx = x + k * 22 + off * h; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + h * 40, y + H + 16); ctx.stroke(); }
    ctx.restore(); path(); ctx.stroke();
    // the top cap (where Brady stands)
    ctx.fillStyle = '#d8ccaa'; rr(ctx, x - 2, y - 2, w + 4, 10, 4); ctx.fill(); ctx.stroke();
    // the way down: chevrons painted on the sleeve, pointing the way to walk (against the seam)
    const k = 0.5 + 0.5 * Math.sin(t * 5);
    ctx.fillStyle = `rgba(30,20,40,${0.55 + 0.35 * k})`;
    for (let q = 0; q < 2; q++) { const ax = cx - h * (q * 14 - 6), ay = y + H * 0.5; ctx.beginPath(); ctx.moveTo(ax + h * 7, ay - 8); ctx.lineTo(ax - h * 3, ay); ctx.lineTo(ax + h * 7, ay + 8); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    if (this.flipT > 0) OA.pill(ctx, cx, y + H + 30, h < 0 ? '>> NOW WALK RIGHT >>' : '<< NOW WALK LEFT <<', '#ffd84a');
    const p = this.g.player; if (p && p.ride === this && this.flipT <= 0 && Math.abs(this.y - (this.top + 1) * TS) < 4) OA.pill(ctx, cx, y + H + 30, h > 0 ? '<< WALK TO UNSCREW' : 'WALK TO UNSCREW >>', '#ffffff', 0.85);
  }
}

/* ======================= 28-5: grafting two cut branches ======================= */
class OrchGraft extends OrchMark {
  // { arch: [[x, y], ...] (the arch's tiles), fx, fy2 (the far cut's tip), amp (px), period, sag (px: Brady's weight on the near cut) }
  constructor(g, s) {
    super(g, s); this.arch = s.arch; this.fx = s.fx; this.fy2 = s.fy2; this.amp = s.amp || 18; this.per = s.period || 2.6; this.sag = s.sag || 0; this.done = false; this.k = 0; this.cue = 'GRAFT';
    this.nx = s.nx; this.ny2 = s.ny2; this.ph = s.phase || 0; hideTiles(g, this.arch);
  }
  live() { return !this.done; }
  // the far cut's height offset now (px), and the near cut's (its sag while Brady stands on it)
  far() { return Math.sin((this.t + this.ph) / this.per * TAU) * this.amp; }
  near() { const p = this.g.player; return this.sag && p && onMark(p, this.tx, this.fy, 1.2) ? this.sag : 0; }
  lined() { return Math.abs(this.far() - this.near()) < 7; }
  act(p) {
    if (this.done) return;
    if (this.lined()) { this.done = true; growTiles(this.g, this.arch); liftOut(this.g, this.arch); Sound.play('secret', { vol: 0.5 }); say(this.g, this.cx + 3 * TS, this.fy * TS - 2 * TS, 'THE GRAFT TAKES!', '#ffd84a'); this.g.burst(this.fx * TS, this.fy2 * TS, 16, '#c8e070', 'confetti'); }
    else { TourKit.sfx('scrape', 'bump', { vol: 0.35, pitch: 0.7 }); say(this.g, this.cx + 3 * TS, this.fy * TS - 2 * TS, 'THE NOTCHES DON\'T MEET', '#ffffff'); }
  }
  update(dt) { this.t += dt; if (this.done) this.k = Math.min(1, this.k + dt * 2); }
  draw(ctx) {
    const t = this.t, nx = this.nx * TS, ny = this.ny2 * TS + this.near(), fx = this.fx * TS, fy = this.fy2 * TS + (this.done ? 0 : this.far());
    if (this.done) {
      // the living arch: both cuts grown together, bound in a rust tie, leaves sprouting
      const ax0 = Math.min(...this.arch.map(q => q[0])) * TS, ax1 = (Math.max(...this.arch.map(q => q[0])) + 1) * TS, ay = this.arch[0][1] * TS + 5;
      OA.branch(ctx, ax0 - 8, ay, ax1 + 8, ay, 11, 0, OA.PEAR_D);
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#9aac34'; ctx.beginPath(); ctx.moveTo(ax0, ay + 4); ctx.quadraticCurveTo((ax0 + ax1) / 2, ay + 50, ax1, ay + 4); ctx.lineWidth = 5; ctx.strokeStyle = OA.BARK; ctx.stroke(); ctx.restore();
      OA.tie(ctx, (ax0 + ax1) / 2, ay - 1, 1.2); for (let q = ax0 + 20; q < ax1 - 10; q += 40) OA.leaf(ctx, q, ay - 3, 1, -1.4);
      return;
    }
    // the near cut (from its cliff to its tip) and the far cut (swaying), each tip a pale cut face with a bark notch
    OA.branch(ctx, nx - 2.5 * TS * Math.sign(fx - nx), ny + 10, nx, ny, 12, 0, OA.PEAR_D);
    OA.branch(ctx, fx + 2.5 * TS * Math.sign(fx - nx), this.fy2 * TS + 10, fx, fy, 12, 0, OA.PEAR_D);
    const lined = this.lined(), k = 0.5 + 0.5 * Math.sin(t * 8);
    for (const [cx, cy, s] of [[nx, ny, 1], [fx, fy, -1]]) {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#f0e4b0'; ctx.beginPath(); ctx.ellipse(cx, cy, 5, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = OA.BARK_D; ctx.beginPath(); ctx.moveTo(cx - 4, cy - 2); ctx.lineTo(cx + s * 4, cy); ctx.lineTo(cx - 4, cy + 2); ctx.fill();
      if (lined) { ctx.strokeStyle = `rgba(255,216,74,${0.6 + 0.4 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 13 + k * 2, 0, TAU); ctx.stroke(); }
      ctx.restore();
    }
    // the guide: a dotted line between the notches, gold when they meet
    ctx.save(); ctx.strokeStyle = lined ? 'rgba(255,216,74,0.95)' : 'rgba(255,255,255,0.35)'; ctx.setLineDash([4, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(fx, fy); ctx.stroke(); ctx.restore();
    this.drawMark(ctx);
  }
}

/* ======================= 28-6 lead-in: loaded branches, the voting basket, the committee gate ======================= */
class OrchLoaded extends OrchMark {
  // { basket: px x of the basket, lean: true (it leans away until persuaded from its far mark), lx: the far mark's col }
  constructor(g, s) { super(g, s); this.basket = s.basket; this.lean = !!s.lean; this.persuaded = !this.lean; this.done = false; this.fly = -1; this.cue = 'PLUCK'; this.lx = s.lx; this.ang = this.lean ? 1 : 0; }
  live() { return !this.done; }
  orchTouch(p) { if (this.done) return false; if (this.lean && !this.persuaded && this.lx != null && onMark(p, this.lx, this.fy, 0.8)) return true; return onMark(p, this.tx, this.fy, 0.8); }
  act(p) {
    if (this.done) return;
    if (this.lean && !this.persuaded) {
      if (this.lx != null && onMark(p, this.lx, this.fy, 0.8)) { this.persuaded = true; say(this.g, this.cx, this.fy * TS - 4 * TS, 'HMM. FAIR POINT.', '#ffffff'); TourKit.sfx('creak', 'select', { vol: 0.4, pitch: 0.8 }); return; }
      // plucked while leaning away: the pear flies off the wrong way and bounces back onto its branch
      this.fly = 0; this.wrong = true; say(this.g, this.cx, this.fy * TS - 4 * TS, 'I LEAN AWAY FROM THAT BASKET.', '#ffffff'); return;
    }
    this.fly = 0; this.wrong = false; TourKit.sfx('twang', 'spring', { vol: 0.5, pitch: 1.2 });
  }
  update(dt) {
    this.t += dt; this.ang = approach(this.ang, this.persuaded ? 0 : 1, dt * 3);
    if (this.fly >= 0) {
      this.fly += dt;
      if (this.fly > 0.9) {
        this.fly = -1;
        if (!this.wrong) { this.done = true; const B = this.g.entities.find(e => e instanceof OrchBasket && !e.remove); if (B) B.vote(); }
      }
    }
  }
  pearPos() {
    const x = (this.tx + 0.5) * TS, y = (this.fy - 4) * TS + 30;
    if (this.fly < 0) return [x + (this.lean && !this.persuaded ? -this.dirAway() * 22 * this.ang : 0), y];
    const k = Math.min(1, this.fly / 0.9), tx = this.wrong ? x - this.dirAway() * 4 * TS : this.basket, ty = this.wrong ? y : (this.fy - 1.4) * TS;
    return [lerp(x, tx, k), lerp(y, ty, k) - Math.sin(k * Math.PI) * 3 * TS];
  }
  dirAway() { return this.basket > this.cx ? 1 : -1; }
  draw(ctx) {
    const x = (this.tx + 0.5) * TS, by = (this.fy - 4) * TS, t = this.t, lean = this.lean && !this.persuaded ? this.ang : 0, d = this.dirAway();
    // the sprung branch: from the tree trunk at the side, bowed down under its pear
    const bow = this.done ? -6 : this.fly >= 0 && !this.wrong ? -18 * Math.sin(Math.min(1, this.fly * 4) * Math.PI) : 10;
    OA.branch(ctx, x - 3 * TS, by - 10, x + 0.6 * TS, by + bow - lean * d * 12, 9, 0.3, OA.PEAR_D);
    OA.leaf(ctx, x - TS, by - 8, 1.1, -1.0); OA.leaf(ctx, x + 10, by + bow - 6, 1, -0.4);
    if (!this.done) { const [px, py] = this.pearPos(); OA.pear(ctx, px, py, 1.15, OA.PEAR, true, lean * -d * 0.4); if (lean > 0.5 && this.fly < 0) OA.pill(ctx, x, by - 26, 'LEANS AWAY', '#ffffff', 0.85); }
    else if (this.fly >= 0) { const [px, py] = this.pearPos(); OA.pear(ctx, px, py, 1.1, OA.PEAR, true, this.fly * 8); }
    if (this.lean && !this.persuaded && this.lx != null) { const p = this.g.player, hot = p && onMark(p, this.lx, this.fy, 0.8); OA.ring(ctx, (this.lx + 0.5) * TS, this.fy * TS, t, hot, 16); if (hot) OA.cue(ctx, (this.lx + 0.5) * TS, this.fy * TS - 2.4 * TS, t, 'PERSUADE'); }
    if (this.fly >= 0) { const [px, py] = this.pearPos(); OA.pear(ctx, px, py, 1.1, OA.PEAR, true, this.fly * 8); }
    this.drawMark(ctx);
  }
}
// the voting basket: n votes open the committee's gate (a lock)
class OrchBasket extends Ent {
  constructor(g, s) { super(g, s, 3 * TS, TS * 1.5); this.n = s.n || 3; this.votes = 0; this.lock = s.lock; this.back = true; }
  vote() {
    this.votes++; Sound.play('coin', { vol: 0.6 }); say(this.g, this.cx, this.y - 30, this.votes >= this.n ? 'MOTION CARRIED!' : 'ONE VOTE: AYE', '#ffd84a');
    if (this.votes >= this.n && this.lock) { this.g.keys.add(this.lock); }
  }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.y + this.h;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    for (let k = 0; k < this.votes; k++) OA.pear(ctx, x - 16 + k * 14, y - 30 - (k % 2) * 4, 0.9, OA.PEAR, true, (k - 1) * 0.3);
    ctx.fillStyle = '#c8a06a'; ctx.beginPath(); ctx.moveTo(x - 40, y - 34); ctx.lineTo(x + 40, y - 34); ctx.lineTo(x + 32, y); ctx.lineTo(x - 32, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.2; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x + k * 11, y - 33); ctx.lineTo(x + k * 9, y - 1); ctx.stroke(); }
    ctx.restore();
    OA.pill(ctx, x, y - 54, 'VOTES ' + this.votes + ' / ' + this.n, '#ffd84a');
  }
}
Object.assign(ENTITY_TYPES, { orchBlossom: OrchBlossom, orchBell: OrchBell, orchBud: OrchBud, orchSleeve: OrchSleeve, orchGraft: OrchGraft, orchLoaded: OrchLoaded, orchBasket: OrchBasket });

/* ---------------- the pieces (the letter's cell: st.x, st.gy - 1) ---------------- */
let bN = 0;
Object.assign(Tour.pieces, {
  // a blossom whose stem rises from the letter; its pad: w tiles at dy rows up (centred on dx); { id, shy, w, dy, dx }
  'orch.blossom'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1, w = o.w || 3, py = y - (o.dy || 3), px0 = x + (o.dx || 0) - Math.floor(w / 2);
    const pad = []; for (let k = 0; k < w; k++) { pad.push([px0 + k, py]); B.set(px0 + k, py, T.SEMI); }
    B.spawn('orchBlossom', x, y, { id: o.id, pad, shy: !!o.shy });
    return st.x;
  },
  // a bell flower on its mark: { to }
  'orch.bell'(st, o) { st.B.spawn('orchBell', st.x, st.gy - 1, { to: o.to }); return st.x; },
  // a stem with buds: the letter is the stem's foot; { h (rows), buds: [[dy, side], ...] (bud dy rows up; Brady pinches
  // it from side; its shoots grow two rows over the bud, `len` tiles each side), len, knob: index of a knob bud (a
  // foothold two rows up instead of shoots) }
  'orch.stem'(st, o) {
    const B = st.B, x = st.x, y0 = st.gy - 1, h = o.h || 9, len = o.len || 3;
    for (let k = 0; k < h; k++) B.set(x, y0 - k, T.HARD);
    B.decor.push({ kind: 'orchStem', x: x * TS + TS / 2, y: (y0 + 1) * TS, seed: 0, h: h * TS });
    (o.buds || []).forEach(([dy, side, ln], i) => {
      const by = y0 - dy, L = ln || len, shoots = [];
      if (o.knob !== i) for (let q = 1; q <= L; q++) { shoots.push([x - q, by - 2]); shoots.push([x + q, by - 2]); }
      for (const [sx, sy] of shoots) B.set(sx, sy, T.SEMI);
      const props = { bx: x, by, shoots };
      if (o.knob === i) { props.knob = [x + side, by - 2]; B.set(x + side, by - 2, T.SEMI); }
      B.spawn('orchBud', x + side, by, props);
    });
    return st.x;
  },
  // a sleeve: the letter is its left column at the TOP stop (the row Brady stands in); { bot (rows down), hand, join
  // (rows down from the top: past it the seam turns), hang (rows up to its branch) }
  'orch.sleeve'(st, o) {
    const B = st.B, x0 = st.x, top = st.gy - 1, bot = top + (o.bot || 6), hang = top - (o.hang || 3);
    for (let y = top + 1; y <= bot + 1; y++) for (let q = 0; q < 3; q++) B.ghosts.push([x0 + q, y]);
    for (let q = -2; q < 5; q++) B.set(x0 + q, hang, T.SEMI);
    B.spawn('orchSleeve', x0, top, { x0, top, bot, hand: o.hand || 1, join: o.join != null ? top + o.join : null, hangY: hang, start: o.start });
    return st.x;
  },
  // a graft: the letter is the near cut's tip mark (Brady stands there); { gap (tiles to the far cut), dir, sag,
  // amp, period, phase }
  'orch.graft'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1, d = o.dir || 1, gap = o.gap || 5, arch = [];
    for (let q = 1; q <= gap; q++) { arch.push([x + d * q, y + 1]); B.set(x + d * q, y + 1, T.SEMI); }
    B.spawn('orchGraft', x, y, { arch, nx: x + 0.5 + d * 0.5, ny2: y + 1, fx: x + 0.5 + d * (gap + 0.5), fy2: y + 1, sag: o.sag || 0, amp: o.amp || 18, period: o.period || 2.6, phase: o.phase || 0 });
    return st.x;
  },
  // a loaded branch over the letter (its pluck mark); { basket: the basket's column, lean, lx: the persuade mark's col
  // offset, last: the gate's key spot }
  'orch.loaded'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1;
    B.spawn('orchLoaded', x, y, { basket: (o.basket + 0.5) * TS, lean: !!o.lean, lx: o.lx != null ? x + o.lx : null });
    if (o.key) B.vkey(o.key, o.lx != null ? [[x, y], [x + o.lx, y]] : [[x, y]], o.lx != null ? 'all' : 'any');
    return st.x;
  },
  // the voting basket; { n, lock }
  'orch.basket'(st, o) { st.B.spawn('orchBasket', st.x + 1, st.gy - 1, { n: o.n || 3, lock: o.lock }); return st.x; },
  // the committee gate: a tall hedge door (a lock) the letter's column, h rows up from the floor
  'orch.gate'(st, o) { const B = st.B, x = st.x, y = st.gy - 1, n = B.spawns.length; B.lock(x, y - (o.h || 4) + 1, y, o.id, 'door'); for (let k = n; k < B.spawns.length; k++) if (B.spawns[k].type === 'lock') B.spawns[k].type = 'orchHedgeGate'; return st.x; }
});
// the committee's gate: a clipped hedge with a rust-tied wicket that swings up once the motion is carried
class OrchHedgeGate extends ENTITY_TYPES.lock {
  draw(ctx) {
    const k = this.open ? clamp((this.openT || 0) / 0.6, 0, 1) : 0, x = this.x, y = this.y, w = TS, h = this.h;
    ctx.save(); ctx.globalAlpha = 1 - k * 0.85;
    Ink.around(ctx, x - 8, y - 8, w + 16, h + 12, c => {
      c.fillStyle = '#3e6a2a'; rr(c, x - 4, y - 4 - k * h, w + 8, h + 4, 8); c.fill();
      c.fillStyle = '#5a8a3a'; for (let yy = y + 6; yy < y + h; yy += 14) for (let xx = x + 2; xx < x + w; xx += 12) { c.beginPath(); c.arc(xx + ((yy / 14) % 2) * 6, yy - k * h, 6, 0, TAU); c.fill(); }
      c.fillStyle = OA.IVORY; c.fillRect(x + 4, y + h * 0.3 - k * h, w - 8, 6); c.fillRect(x + 4, y + h * 0.65 - k * h, w - 8, 6);
    }, { pad: 4 });
    OA.tie(ctx, x + w / 2, y + h * 0.3 - k * h, 1.1);
    ctx.restore();
  }
}
ENTITY_TYPES.orchHedgeGate = OrchHedgeGate;

Object.assign(TourLandscape.ARCH_LABEL, { pollinate: 'BEES', pinch: 'PRUNING', unscrew: 'SLEEVES', graft: 'GRAFTS' });
Object.assign(Tour.orchKit, { OrchMark, OrchBlossom, OrchBell, OrchBee, OrchBud, OrchSleeve, OrchGraft, OrchLoaded, OrchBasket, growTiles, hideTiles, liftOut });
})();
