/* ============================================================
   WRONG SIDE OF THE WASH: the laundry that plays (26-2 to 26-5). Each is the game's physics plus one new thing, and
   the level checker is told exactly what a player can do with it (one-way edges between real standing spots):
   26-2 SWEATER  a wet sweater pegged on a line by its shoulders: Brady walks along it and his weight stretches the
                 sleeve on the side he walks toward (two tiles of sleeve for every tile walked across the body), flat
                 out like a plank. Walk on along it and jump off the cuff. Off the sweater, it springs back. A short
                 sleeve stretches less: start at the opposite shoulder for the whole run.
   26-3 UNZIP    a loose thread at the edge of a gap: hold THROW on it and walk, and the seam unzips into a strip of
                 floor ahead of him (up a step where the hem rises). Let go and the strip stays. A hem with two
                 threads: one runs along the bridge, the other back under his own feet (that one drops him to a
                 lower ledge to try again).
   26-4 CLING    a wool rug: scuff along it (any direction, 5 tiles of wool) and Brady's socks crackle with two
                 sparks. Leap at a felt patch while charged and he sticks where he lands (a spark used). JUMP springs
                 off, DOWN lets go. Bare washing labels don't hold. Landing on anything but wool loses the charge.
   26-5 POCKETS  hanging trousers with deep pockets: jump into one and pop out of the pocket with the matching lining
                 (its lip flops open now and then to show it). A wrong pocket drops you on a heap of Piwi's socks.
   ============================================================ */
(function () {
const WK = Tour.washKit, INK = WK.INK, WA = WK.WashArt;
const washOf = p => p.wash || (p.wash = { grip: null, face: 0, crossT: 0, cool: 0, ph: 0 });
const standsAt = (A, x, y) => { const t = tileAt(A, x, y); return (SOLID[t] || t === T.SEMI) && t !== T.SPIKES && !SOLID[tileAt(A, x, y - 1)] && !SOLID[tileAt(A, x, y - 2)]; };
// a checker pass once per level area (the edges are added to the area itself, like the nets' and the moon's)
const onCheck = (flag, fn) => { const run0 = Validator.run; Validator.run = function (level, opts) { level.areas.forEach((a, ai) => { if (a[flag]) return; const r = fn.call(this, a, ai, level); if (r !== false) a[flag] = true; }); return run0.call(this, level, opts); }; };

/* ======================= 26-2 SWEATER ======================= */
// spawn: { tx0, tx1 (the body's tiles), y (its walking row), maxL, maxR, kL, kR, col }
class WashSweater extends Ent {
  constructor(g, s) {
    super(g, s, (s.tx1 - s.tx0 + 1) * TS, 3 * TS); this.back = true;
    this.tx0 = s.tx0; this.tx1 = s.tx1; this.ty = s.y; this.x = s.tx0 * TS; this.y = s.y * TS;
    this.max = [s.maxL || 0, s.maxR || 0]; this.k = [s.kL || 2, s.kR || 2]; this.len = [0, 0]; this.shown = [0, 0];
    this.col = s.col || '#5ab08a'; this.run = null; this.offT = 0; this.drip = 0;
  }
  on(p) { if (!p || !p.onGround || p.groundTy !== this.ty) return 0; const tx = Math.floor(p.cx / TS); if (tx >= this.tx0 && tx <= this.tx1) return 1; if (tx < this.tx0 && tx >= this.tx0 - this.len[0]) return 2; if (tx > this.tx1 && tx <= this.tx1 + this.len[1]) return 2; return 0; }
  setLen(side, L) {
    L = Math.max(0, Math.min(this.max[side], Math.floor(L)));
    if (L === this.len[side]) return;
    const g = this.g, y = this.ty;
    for (let k = 1; k <= Math.max(L, this.len[side]); k++) {
      const x = side ? this.tx1 + k : this.tx0 - k, want = k <= L;
      const t = tileAt(g.area, x, y);
      if (want && t === T.EMPTY) g.setTile(x, y, T.SEMI); else if (!want && t === T.SEMI) g.setTile(x, y, T.EMPTY);
    }
    if (L > this.len[side]) TourKit.sfx('stretch', 'select', { vol: 0.15, pitch: 0.6 + L * 0.05 });
    this.len[side] = L;
  }
  update(dt) {
    this.t += dt;
    const p = this.g.player, where = this.on(p);
    if (where === 1) {
      this.offT = 0;
      // the run across the body: the sleeve on the side he walks toward stretches with every tile walked
      const d = Math.abs(p.vx) > 20 ? sign(p.vx) : 0;
      if (d && (!this.run || this.run.d !== d)) this.run = { d, x0: p.cx };
      if (this.run && d === this.run.d) { const side = d > 0 ? 1 : 0, walked = Math.abs(p.cx - this.run.x0) / TS; this.setLen(side, Math.max(this.len[side], this.k[side] * walked)); }
    } else if (where === 2) { this.offT = 0; this.run = null; }
    else { this.run = null; this.offT += dt; if (this.offT > 0.9) { this.setLen(0, 0); this.setLen(1, 0); } }
    for (let s = 0; s < 2; s++) this.shown[s] = approach(this.shown[s], this.len[s], dt * 18);
    this.drip -= dt; if (this.drip <= 0) { this.drip = 0.35 + Math.random() * 0.4; if (this.g.onScreen(this)) this.g.burst(this.x + Math.random() * this.w, this.y + 2.6 * TS, 1, '#9ad0f0', 'drop'); }
  }
  touchPlayer() {}
  draw(ctx) {
    const x0 = this.tx0 * TS, x1 = (this.tx1 + 1) * TS, y = this.ty * TS, t = this.t, col = this.col, dark = shade(col, -0.22);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the line it hangs from, the pegs at its shoulders
    WA.line(ctx, x0 - 2.5 * TS, y - 4, x1 + 2.5 * TS, y - 4, 4, '#6a5a4a');
    // the body: a wet knitted sweater, a darker band of wet at the hem, ribbing, drips
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1 - 4, y + 2.5 * TS); ctx.lineTo(x0 + 4, y + 2.5 * TS); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = dark; ctx.fillRect(x0 + 5, y + 2.1 * TS, x1 - x0 - 10, 0.4 * TS - 2);
    ctx.strokeStyle = shade(col, 0.2); ctx.lineWidth = 1.4; for (let xx = x0 + 10; xx < x1 - 6; xx += 10) { ctx.beginPath(); ctx.moveTo(xx, y + 6); ctx.lineTo(xx - 2, y + 2.4 * TS); ctx.stroke(); }
    ctx.strokeStyle = WA.CREAM; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + 6, y + TS); ctx.lineTo(x1 - 6, y + TS); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the collar
    ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, y + 2, (x1 - x0) * 0.18, 6, 0, 0, Math.PI); ctx.fill(); ctx.stroke();
    // the sleeves: hanging down when slack, flat out like planks when stretched (a ribbed cuff at the end)
    for (let s = 0; s < 2; s++) {
      const L = this.shown[s], dir = s ? 1 : -1, sx = s ? x1 : x0, short = this.max[s] < 7;
      if (L < 0.4) {
        const hang = (short ? 1.0 : 1.8) * TS, sw = Math.sin(t * 2 + s) * 3;
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(sx, y + 2); ctx.lineTo(sx + dir * 16, y + 4); ctx.lineTo(sx + dir * 14 + sw, y + hang); ctx.lineTo(sx + dir * 2 + sw, y + hang); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = dark; ctx.fillRect(Math.min(sx + dir * 2, sx + dir * 14) + sw, y + hang - 8, 12, 8);
      } else {
        const ex = sx + dir * L * TS, sag = Math.sin(t * 3) * 1.5;
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(ex, y + sag); ctx.lineTo(ex, y + 12 + sag); ctx.quadraticCurveTo((sx + ex) / 2, y + 18 + L, sx, y + 22); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = shade(col, 0.2); ctx.lineWidth = 1.2; for (let k = 1; k < L * 3; k++) { const xx = sx + dir * k * TS / 3; ctx.beginPath(); ctx.moveTo(xx, y + 2); ctx.lineTo(xx, y + 10); ctx.stroke(); } ctx.strokeStyle = INK; ctx.lineWidth = 2;
        ctx.fillStyle = dark; ctx.fillRect(Math.min(ex, ex - dir * 12), y - 1 + sag, 12, 14); ctx.strokeRect(Math.min(ex, ex - dir * 12), y - 1 + sag, 12, 14);
      }
    }
    WA.peg(ctx, x0 + 6, y + 8, 0.8); WA.peg(ctx, x1 - 6, y + 8, 0.8);
    ctx.restore();
  }
}
ENTITY_TYPES.washSweater = WashSweater;
// the piece: the letter is the body's left end on its walking row; { w (body), maxL, maxR, kL, kR, col }
Tour.pieces['wash.sweater'] = function (st, o) {
  const B = st.B, x0 = st.x, y = st.gy - 1, w = o.w || 5, x1 = x0 + w - 1;
  for (let x = x0; x <= x1; x++) B.set(x, y, T.SEMI);
  const s = B.spawn('washSweater', x0, y, { tx0: x0, tx1: x1, y, maxL: o.maxL || 0, maxR: o.maxR || 0, kL: o.kL || 2, kR: o.kR || 2, col: o.col });
  return st.x;
};
// the checker: from a body tile, a run toward a side reaches that sleeve's spots out to k x (the run) tiles
onCheck('washSweaterEdges', function (a) {
  const L = (a.spawns || []).filter(s => s.type === 'washSweater'); if (!L.length) return;
  a.edges = a.edges || [];
  for (const s of L) for (let side = 0; side < 2; side++) {
    if (!s.maxL && !side) continue; if (!s.maxR && side) continue;
    const max = side ? s.maxR : s.maxL, k = side ? s.kR : s.kL;
    for (let b = s.tx0; b <= s.tx1; b++) {
      // standing on body tile b, walking toward the side: the run is from b's middle to the body's last tile's middle,
      // and the run goes on over the last half tile before he steps off; be stingy: count whole tiles only
      const run = side ? s.tx1 - b : b - s.tx0, reach = Math.min(max, Math.floor(k * run));
      for (let i = 1; i <= reach; i++) a.edges.push({ from: [b, s.y - 1], to: [side ? s.tx1 + i : s.tx0 - i, s.y] });
    }
    // along the stretched sleeve, both ways
    for (let i = 1; i < max; i++) { const xa = side ? s.tx1 + i : s.tx0 - i, xb = side ? xa + 1 : xa - 1; a.edges.push({ from: [xa, s.y - 1], to: [xb, s.y] }, { from: [xb, s.y - 1], to: [xa, s.y] }); }
  }
});

/* ======================= 26-3 UNZIP ======================= */
// spawn: { tx (the thread's post tile), y (the near bank's floor row), cells: [[x, y], ...] (the strip's tiles, in
// order), trap: [[x, y], ...] (a second thread: the floor under Brady), col }
class WashSeam extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS); this.back = true; this.tx = s.tx; this.ty = s.y; this.x = s.tx * TS; this.y = (s.y - 1) * TS;
    this.cells = s.cells || []; this.trap = s.trap || null; this.n = 0; this.hold = false; this.trapped = false; this.col = s.col || WA.RED; this.msgT = 0;
  }
  // where the loose end is now: the post, or the last unzipped cell
  end() { return this.n ? this.cells[this.n - 1] : [this.tx, this.ty]; }
  near(p, at) { return p && p.onGround && Math.abs(p.cx - (at[0] * TS + TS / 2)) < TS * 0.95 && Math.abs((p.y + p.h) - at[1] * TS) < TS * 0.6; }
  update(dt) {
    this.t += dt; if (this.msgT > 0) this.msgT -= dt;
    const g = this.g, p = g.player, I = (p && p.inp) || {};
    if (!p || p.dead) { this.hold = false; return; }
    // the second thread (under his own feet): pull it and the floor here unzips: down to the ledge below
    if (this.trap && !this.trapped && I.actionPressed && this.near(p, [this.tx - 1, this.ty]) && !this.hold) {
      this.trapped = true; for (const [x, y] of this.trap) g.setTile(x, y, T.EMPTY);
      TourKit.sfx('rip', 'kick', { vol: 0.5, pitch: 0.8 }); g.parts.text(p.cx, p.y - 16, 'WRONG THREAD!', '#ffffff');
      return;
    }
    if (!this.hold) {
      if (this.n < this.cells.length && I.actionPressed && this.near(p, this.end())) { this.hold = true; TourKit.sfx('grip', 'select', { vol: 0.35, pitch: 1.3 }); }
      return;
    }
    if (!I.action || !p.onGround && p.vy > 4 * TS) { this.hold = false; return; }
    // holding the thread: the seam unzips two cells ahead of him as he walks along it
    const dir = this.cells.length && this.cells[0][0] < this.tx ? -1 : 1, front = p.cx / TS + dir * 2.2;
    while (this.n < this.cells.length && (dir > 0 ? this.cells[this.n][0] <= front : this.cells[this.n][0] >= front)) {
      const [x, y] = this.cells[this.n]; g.setTile(x, y, T.SEMI); this.n++;
      if (this.n % 2 === 0) TourKit.sfx('zip', 'select', { vol: 0.2, pitch: 1.6 + (this.n % 6) * 0.05 });
      g.burst(x * TS + 16, y * TS + 4, 2, WA.CREAM, 'spark');
    }
    if (this.n >= this.cells.length) this.hold = false;
  }
  touchPlayer() {}
  draw(ctx) {
    const t = this.t, g = this.g, p = g.player, col = this.col;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the strip: unzipped cells are flat fabric with a stitched edge; the rest is a tight rolled hem with tacking
    // stitches, the thread running along it
    this.cells.forEach(([x, y], k) => {
      const px = x * TS, py = y * TS;
      if (k < this.n) { WA.gingham(ctx, px, py, TS, 10, 4, 0.6, '#f4ead2'); ctx.strokeRect(px, py, TS, 10); ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(px, py + 8); ctx.lineTo(px + TS, py + 8); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = INK; ctx.lineWidth = 2; }
      else { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(px, py + 1, TS, 4); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath(); for (let q = 0; q < 4; q++) { ctx.moveTo(px + q * 8, py + 7); ctx.lineTo(px + q * 8 + 6, py - 1); } ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2; }
    });
    // the loose end: a thread with a little knot, wagging (it glows while he can take it)
    const [ex, ey] = this.end(), lx = ex * TS + (this.n ? TS : TS / 2), ly = ey * TS;
    if (this.n < this.cells.length) {
      const can = p && this.near(p, this.end()) && !this.hold, wag = Math.sin(t * 5) * 5;
      ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(lx + 6, ly - 14, lx + 2 + wag, ly - 24); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx + 2 + wag, ly - 25, 3.4, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
      if (can) { const k = 0.5 + 0.5 * Math.sin(t * 7); ctx.fillStyle = `rgba(255,216,74,${0.6 + 0.4 * k})`; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('HOLD THROW', lx, ly - 36); }
      if (this.hold && p) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo((lx + p.cx) / 2, ly + 6, p.cx + p.facing * 8, p.y + 26); ctx.stroke(); }
    }
    // the second thread (navy), running back under his feet
    if (this.trap && !this.trapped) {
      const tx = (this.tx - 1) * TS + TS / 2, ty = this.ty * TS, wag = Math.sin(t * 4 + 1) * 4;
      ctx.strokeStyle = WA.NAVY_L; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx - 6, ty - 12, tx - 2 + wag, ty - 22); ctx.stroke();
      ctx.fillStyle = WA.NAVY_L; ctx.beginPath(); ctx.arc(tx - 2 + wag, ty - 23, 3.4, 0, TAU); ctx.fill();
      ctx.setLineDash([3, 4]); ctx.beginPath(); for (const [x, y] of this.trap) { ctx.moveTo(x * TS, y * TS + 4); ctx.lineTo(x * TS + TS, y * TS + 4); } ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
  }
}
ENTITY_TYPES.washSeam = WashSeam;
// the piece: the letter is the thread's post (on the near bank's floor); { len, dir (1 right / -1 left), rise
// (every `rise` cells the strip steps up a row; 0: level), trap (the second thread: how many floor tiles under him
// it unzips) }
Tour.pieces['wash.seam'] = function (st, o) {
  const B = st.B, tx = st.x, y = st.gy, dir = o.dir || 1, len = o.len || 8, rise = o.rise || 0, cells = [];
  let cy = y;
  for (let i = 1; i <= len; i++) { if (rise && i > 1 && (i - 1) % rise === 0) cy--; cells.push([tx + dir * i, cy]); }
  for (const [x, yy] of cells) B.set(x, yy, T.EMPTY);
  const trap = o.trap ? Array.from({ length: o.trap }, (_, k) => [tx - 1 - k, y]) : null;
  B.spawn('washSeam', tx, y - 1, { tx, y, cells, trap, col: o.col });
  return st.x;
};
// the checker: from the post, the strip's cells one after another (it unzips as he walks it), and back
onCheck('washSeamEdges', function (a) {
  const L = (a.spawns || []).filter(s => s.type === 'washSeam'); if (!L.length) return;
  a.edges = a.edges || [];
  for (const s of L) {
    let prev = [s.tx, s.y];
    for (const c of s.cells) { a.edges.push({ from: [prev[0], prev[1] - 1], to: [c[0], c[1]] }); if (prev !== null && (prev[0] !== s.tx || prev[1] !== s.y)) a.edges.push({ from: [c[0], c[1] - 1], to: [prev[0], prev[1]] }); prev = c; }
  }
});

/* ======================= 26-4 CLING ======================= */
// zones: kind 'washWool' (the rug: charges), kind 'washFelt' (a patch: sticks). Brady: p.wash.charge (sparks, 0-2),
// p.wash.scuff (wool walked), p.wash.stick ({ z }) while stuck.
const CLING = { scuff: 5 * TS, sparks: 2, apex: 1 * TS };   // a leap sticks where it comes to rest: rising slower than apex, or falling
const zoneHit = (A, kind, b, pad) => { for (const z of A.zones || []) if (z.kind === kind && b.x + b.w + pad > z.x && b.x - pad < z.x + z.w && b.y + b.h + pad > z.y && b.y - pad < z.y + z.h) return z; return null; };
const onWool = (A, p) => { if (!p.onGround) return false; for (const z of A.zones || []) if (z.kind === 'washWool' && p.cx >= z.x && p.cx <= z.x + z.w && Math.abs(p.groundTy * TS - z.y) < 2) return true; return false; };
{
  const ppf = playerPhysicsFlip;
  playerPhysicsFlip = function (p, inp, A, dt, platforms, opts) {
    if (!A || !A.zones || !A.zones.some(z => z.kind === 'washFelt')) return ppf(p, inp, A, dt, platforms, opts);
    const live = !!(opts && opts.live), W = live ? washOf(p) : (p.washSim || (p.washSim = { charge: 0, scuff: 0 }));
    if (W.stick) {
      // stuck to the felt: JUMP springs off (a real jump from here), DOWN lets go
      p.vx = 0; p.vy = 0;
      if (inp.jumpPressed) { W.stick = null; p.onGround = true; p.coyote = PHYS.coyote; p.jumpBuf = 0; W.unstickT = 0.15; return ppf(p, inp, A, dt, platforms, opts); }
      if (inp.down) { W.stick = null; W.unstickT = 0.3; p.onGround = false; }
      else return { jump: false, bonks: null, landed: false, swim: false };
    }
    const wasG = p.onGround, ev = ppf(p, inp, A, dt, platforms, opts);
    if (W.unstickT > 0) W.unstickT -= dt;
    if (p.onGround) {
      if (onWool(A, p)) { W.scuff = (W.scuff || 0) + Math.abs(p.vx) * dt; if (W.scuff >= CLING.scuff && W.charge < CLING.sparks) { W.charge = CLING.sparks; W.fresh = 0.6; } }
      else if (!wasG || W.charge) { W.charge = 0; W.scuff = 0; }
    } else if (W.charge > 0 && !(W.unstickT > 0) && p.vy >= -CLING.apex && zoneHit(A, 'washFelt', p, 2)) {
      W.stick = { at: [p.x, p.y] }; W.charge--; p.vx = 0; p.vy = 0; p.jumping = false; W.stuckT = 0.3;
      if (live && p.g) { TourKit.sfx('zap', 'select', { vol: 0.4, pitch: 2 }); p.g.burst(p.cx, p.cy, 8, '#fff4a0', 'spark'); }
    }
    return ev;
  };
}
// the pose while stuck (arms out flat against the felt, a little static frizz), the sparks on the socks
{
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    up0.call(this, dt, inp);
    const W = this.wash;
    if (W && W.stick && this.state === 'play' && !this.dead) this.anim.state = 'hang';
    if (W && W.fresh > 0) W.fresh -= dt;
  };
  TourHooks.on('afterEntities', (play, ctx) => {
    const p = play.player, W = p && p.wash; if (!W || !(W.charge > 0) || p.dead) return;
    const t = play.t;
    ctx.save();
    for (let k = 0; k < W.charge; k++) {
      const x = p.cx - 10 + k * 20, y = p.y + p.h - 4, a = t * 9 + k * 2;
      ctx.strokeStyle = '#fff4a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 6, y); for (let q = 0; q < 4; q++) ctx.lineTo(x - 6 + q * 4, y - (q % 2 ? 7 : 1) - Math.sin(a + q) * 2); ctx.stroke();
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); TourKit.star(ctx, x, y - 12, 4.5, 2, 4); ctx.fill();
    }
    if (W.fresh > 0) { ctx.fillStyle = `rgba(255,244,160,${W.fresh})`; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('CRACKLE!', p.cx, p.y - 14); }
    ctx.restore();
  });
}
// the rug and the patches are drawn by one entity per area (spawned by the pieces)
class WashFeltArt extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.back = true; this.friendly = true; }
  update(dt) { this.t += dt; const g = this.g; this.x = g.camX; this.y = g.camY; this.w = Game.viewW; this.h = Game.viewH; }
  touchPlayer() {}
  draw(ctx) {
    const A = this.g.area, t = this.t;
    for (const z of A.zones || []) {
      if (z.x > this.x + this.w + 40 || z.x + z.w < this.x - 40 || z.y > this.y + this.h + 40 || z.y + z.h < this.y - 40) continue;
      if (z.kind === 'washFelt') {
        ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = z.col || '#4a9a6a';
        rr(ctx, z.x + 2, z.y + 2, z.w - 4, z.h - 4, 6); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.4; rr(ctx, z.x + 6, z.y + 6, z.w - 12, z.h - 12, 4); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; for (let k = 0; k < z.h / 9; k++) ctx.fillRect(z.x + 6, z.y + 6 + k * 9, z.w - 12, 2);
        ctx.restore();
      } else if (z.kind === 'washLabel') {
        ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#fbfaf6'; ctx.fillRect(z.x + 3, z.y + 3, z.w - 6, z.h - 6); ctx.strokeRect(z.x + 3, z.y + 3, z.w - 6, z.h - 6);
        ctx.strokeStyle = WA.NAVY_L; ctx.lineWidth = 1.4; const cx = z.x + z.w / 2;
        for (let k = 0; k < Math.floor((z.h - 10) / 28); k++) { const cy = z.y + 16 + k * 28; ctx.beginPath(); ctx.moveTo(cx - 8, cy + 6); ctx.lineTo(cx - 6, cy - 6); ctx.lineTo(cx + 6, cy - 6); ctx.lineTo(cx + 8, cy + 6); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - 9, cy + 9); ctx.lineTo(cx + 9, cy - 9); ctx.stroke(); }
        ctx.restore();
      } else if (z.kind === 'washWool') {
        ctx.save(); ctx.fillStyle = '#fff8ec'; ctx.strokeStyle = 'rgba(140,120,90,0.7)'; ctx.lineWidth = 1.2;
        for (let x = z.x + 6; x < z.x + z.w; x += 11) { const r = 7 + Math.sin(x * 0.3) * 1.5; ctx.beginPath(); ctx.arc(x, z.y - 2 + Math.sin(t * 2 + x) * 0.6, r, Math.PI, 0); ctx.fill(); ctx.stroke(); }
        ctx.restore();
      }
    }
  }
}
ENTITY_TYPES.washFeltArt = WashFeltArt;
const feltArt = B => { if (!B.spawns.some(s => s.type === 'washFeltArt')) B.spawn('washFeltArt', 0, 0, {}); };
Object.assign(Tour.pieces, {
  // a wool rug along the floor at the letter: { w } (the floor row is the one under the letter)
  'wash.wool'(st, o) { const B = st.B; B.zone(st.x, st.gy, o.w || 6, 1, 0, 0, 0, 'washWool', { pulse: true }); feltArt(B); return st.x; },
  // a felt patch: the letter is its top-left cell; { w, h, col } (on a wall's face: Brady sticks beside it)
  'wash.felt'(st, o) { const B = st.B; B.zone(st.x, st.gy - 1, o.w || 1, o.h || 3, 0, 0, 0, 'washFelt', { pulse: true, col: o.col }); feltArt(B); return st.x; },
  // a bare washing label (looks like a patch, holds nothing): { w, h }
  'wash.label'(st, o) { const B = st.B; B.zone(st.x, st.gy - 1, o.w || 1, o.h || 2, 0, 0, 0, 'washLabel', { pulse: true }); feltArt(B); return st.x; }
});
// the checker: wool spots charge; a jump from one that touches felt sticks there (a spark), a jump from that stick
// that touches felt sticks again (the second spark); every try is this same physics step by step
onCheck('washClingEdges', function (a, ai) {
  const felts = (a.zones || []).filter(z => z.kind === 'washFelt'); if (!felts.length) return;
  a.edges = a.edges || [];
  const A = this.proxyArea(a, 0); A.zones = (a.zones || []).slice(); const D = PLAYER_DIM.big;
  const wools = (a.zones || []).filter(z => z.kind === 'washWool');
  const tries = []; for (const dir of [-1, 0, 1]) for (const sp of [0, PHYS.walk, PHYS.run]) for (const hold of [0.1, 0.22, 2]) { if (!dir && sp) continue; tries.push({ dir, sp, hold }); }
  // one flight from a spot (feet at row ty): the first felt touched (a stick spot), or null
  const fly = (tx, ty, m) => {
    const b = { x: tx * TS + TS / 2 - D.w / 2, y: ty * TS - D.h, w: D.w, h: D.h, vx: m.dir * m.sp, vy: 0, onGround: true, coyote: PHYS.coyote, jumpBuf: 0, jumping: false, runT: m.sp >= PHYS.run ? 1 : 0, airMax: Math.max(PHYS.walk, m.sp), facing: m.dir || 1, crouch: false, inWater: false, stroke: 0, groundTile: T.GROUND, groundTx: tx, groundTy: ty, dropT: 0, washSim: { charge: 0 } };
    const inp = { left: m.dir < 0, right: m.dir > 0, jump: true, jumpPressed: true, down: false, action: m.sp >= PHYS.run };
    for (let t = 0; t < 2.4; t += STEP) {
      playerPhysics(b, inp, A, STEP, null, {}); inp.jumpPressed = false; inp.jump = t < m.hold;
      if (b.y > A.H * TS + 40 || spikeContact(b, A) || lavaContact(b, A)) return null;
      if (b.onGround && t > 0.05) return null;
      if (b.vy >= -CLING.apex && zoneHit(A, 'washFelt', b, 2)) { const fx = Math.floor((b.x + b.w / 2) / TS), fy = Math.ceil((b.y + b.h) / TS - 0.01); if (SOLID[tileAt(A, fx, fy - 1)] || SOLID[tileAt(A, fx, fy - 2)]) return null; return [fx, fy]; }
    }
    return null;
  };
  const key = c => c[0] + ',' + c[1];
  const first = new Map(), second = new Map();
  for (const z of wools) {
    const ty = Math.round(z.y / TS);
    for (let tx = Math.floor(z.x / TS); tx < Math.ceil((z.x + z.w) / TS); tx++) {
      if (!standsAt(A, tx, ty)) continue;
      for (const m of tries) { const s = fly(tx, ty, m); if (s) { a.edges.push({ from: [tx, ty - 1], to: s }); first.set(key(s), s); } }
    }
  }
  for (const s of first.values()) for (const m of tries) { const s2 = fly(s[0], s[1], m); if (s2 && key(s2) !== key(s)) second.set(key(s) + '>' + key(s2), [s, s2]); }
  // a spot reached as a first stick keeps its onward stick (one spark left); a second stick never lands on such a spot
  // (that edge is left out), so no spot is ever reached with no spark and then used as if it had one
  for (const [s, s2] of second.values()) if (!first.has(key(s2))) a.edges.push({ from: [s[0], s[1] - 1], to: s2 });
});

/* ======================= 26-5 POCKETS ======================= */
const LININGS = {
  dots: { name: 'RED DOTS', base: '#f4ead2', paint(c, x, y, w, h) { c.fillStyle = '#e8442e'; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(x + 6 + i * (w - 12) / 3, y + 5 + j * (h - 8) / 2, 2.6, 0, TAU); c.fill(); } } },
  mint: { name: 'MINT STRIPES', base: '#bfe8d6', paint(c, x, y, w, h) { c.fillStyle = '#3a8a6a'; for (let i = 0; i < w; i += 8) c.fillRect(x + i, y, 4, h); } },
  check: { name: 'NAVY CHECK', base: '#f4ead2', paint(c, x, y, w, h) { WA.gingham(c, x, y, w, h, 5, 0.75); } },
  gold: { name: 'GOLD', base: '#ffd84a', paint(c, x, y, w, h) { c.fillStyle = '#ff9a2a'; for (let i = 0; i < w; i += 6) c.fillRect(x + i, y, 3, h); c.fillStyle = '#fff4c8'; c.fillRect(x, y + h / 2 - 1, w, 2); } },
  sock: { name: 'ODD SOCKS', base: '#c8b8a8', paint(c, x, y, w, h) { for (let i = 0; i < 3; i++) WA.sock(c, x + 8 + i * (w - 12) / 2, y - 6, 0.5, ['#f4ead2', '#f2c0b0', '#bfe8d6'][i], WA.NAVY, i % 2); } },
  sun: { name: 'YELLOW', base: '#ffd84a', paint(c, x, y, w, h) { c.fillStyle = '#ff9a2a'; for (let i = 0; i < w; i += 10) { c.beginPath(); c.moveTo(x + i, y + h); c.lineTo(x + i + 5, y); c.lineTo(x + i + 10, y + h); c.fill(); } } }
};
// spawn { lining, hem ('scallop' | 'straight'), targetRef, col (the garment), main (draws; the twin is the checker's
// second spot) }
class WashPocket extends Ent {
  constructor(g, s) {
    super(g, s, 2 * TS, 2 * TS); this.x = s.x - TS / 2; this.y = s.y - 2 * TS; this.back = true;
    this.target = s.target; this.lining = LININGS[s.lining] ? s.lining : 'dots'; this.hem = s.hem || 'straight'; this.col = s.col || WA.NAVY_L; this.main = s.main !== false; this.ph = (s.x * 0.013) % 3;
    this.cool = 0;
  }
  // the lip flops open for a moment every few seconds (the tell: its lining)
  lip() { const k = ((this.t + this.ph) % 3.4); return k < 0.9 ? Math.sin(k / 0.9 * Math.PI) : 0; }
  update(dt) {
    this.t += dt; if (this.cool > 0) this.cool -= dt;
    const p = this.g.player;
    if (!this.main || !p || p.dead || p.state !== 'play' || this.cool > 0 || this.g.state !== 'play') return;
    // in he goes: standing down in the pocket
    if (p.onGround && p.cx > this.x + 4 && p.cx < this.x + this.w - 4 && Math.abs(p.y + p.h - (this.y + this.h)) < 4 && this.target) {
      this.cool = 1.5; TourKit.sfx('pocket', 'pipe', { vol: 0.5 });
      this.g.burst(this.cx, this.y + 8, 10, LININGS[this.lining].base, 'confetti');
      this.g.enterPortal({ kind: 'pipe', target: this.target });
    }
  }
  touchPlayer() {}
  draw(ctx) {
    if (!this.main) return;
    const x = this.x, y = this.y, w = this.w, t = this.t, L = LININGS[this.lining], lip = this.lip();
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the trouser leg around it (hanging from the line above), the pocket stitched on
    ctx.fillStyle = this.col; ctx.fillRect(x - 10, y - 3 * TS, w + 20, 5 * TS); ctx.strokeRect(x - 10, y - 3 * TS, w + 20, 5 * TS);
    ctx.fillStyle = shade(this.col, 0.12); ctx.fillRect(x - 4, y - 4, w + 8, 2 * TS + 6); ctx.strokeRect(x - 4, y - 4, w + 8, 2 * TS + 6);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2; ctx.strokeRect(x, y, w, 2 * TS - 2); ctx.setLineDash([]); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the dark mouth
    ctx.fillStyle = '#1a1426'; ctx.fillRect(x + 2, y - 2, w - 4, 8);
    // the lip: folded down it shows the lining (and the hem's shape)
    const fh = 6 + lip * 18;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 4, y - 4, w + 8, fh + 2); ctx.clip();
    ctx.fillStyle = lip > 0.1 ? L.base : this.col; ctx.fillRect(x - 4, y - 4, w + 8, fh + 2);
    if (lip > 0.1) L.paint(ctx, x - 4, y - 4, w + 8, fh + 2);
    ctx.restore();
    ctx.beginPath();
    if (this.hem === 'scallop') { ctx.moveTo(x - 4, y - 4 + fh); for (let k = 0; k < 4; k++) ctx.arc(x - 4 + (k + 0.5) * (w + 8) / 4, y - 4 + fh, (w + 8) / 8, Math.PI, 0, true); }
    else { ctx.moveTo(x - 4, y - 4 + fh); ctx.lineTo(x + w + 4, y - 4 + fh); }
    ctx.stroke();
    ctx.strokeRect(x - 4, y - 4, w + 8, fh);
    ctx.restore();
  }
}
ENTITY_TYPES.washPocket = WashPocket;
VALIDATOR_PORTALS.washPocket = true;
// the piece: the letter is the pocket's left cell on its bottom row (Brady lands down in it); { lining, hem, to, col }
Tour.pieces['wash.pocket'] = function (st, o) {
  const B = st.B, x = st.x, y = st.gy - 1;
  // the pocket: two cells deep, two wide; its sides and bottom are solid (drawn as the cloth)
  for (let k = 0; k < 2; k++) { B.set(x + k, y, T.EMPTY); B.set(x + k, y - 1, T.EMPTY); B.set(x + k, y + 1, T.HARD); B.setHide(x + k, y + 1, 1); }
  for (const sx of [x - 1, x + 2]) for (let yy = y - 1; yy <= y + 1; yy++) { B.set(sx, yy, T.HARD); B.setHide(sx, yy, 1); }
  // two spots for the checker (a standing body is in one of the two cells); the first draws and acts
  const p = { lining: o.lining, hem: o.hem, col: o.col, targetRef: o.to };
  B.spawn('washPocket', x, y, Object.assign({}, p, { main: true }));
  B.spawn('washPocket', x + 1, y, Object.assign({}, p, { main: false }));
  return st.x;
};
// the spawn's box is the two cells; the twin is invisible (its x is a cell along)
{
  const C0 = WashPocket;
  ENTITY_TYPES.washPocket = class extends C0 { constructor(g, s) { super(g, s); if (s.main === false) { this.x = s.x - TS / 2 - TS; } } };
}

/* ======================= the land's hazard: spring-loaded peg jaws (hung on a wire, they snap down) ======================= */
// spawn { period, phase, reach (tiles down) }: open, a tell (they gape and rattle, 0.7 s), snap (hurts below), back
class WashJaws extends Ent {
  constructor(g, s) { super(g, s, 40, (s.reach || 3) * TS); this.x = s.x - 20; this.y = s.y - TS; this.hang = s.y - TS; this.period = s.period || 2.8; this.ph = s.phase || 0; this.reach = (s.reach || 3) * TS; this.enemy = true; this.customCollide = true; }
  cyc() { const P = this.period, k = ((this.g.t + this.ph) % P + P) % P; return k < P - 1.3 ? ['open', 0] : k < P - 0.6 ? ['tell', (k - (P - 1.3)) / 0.7] : ['snap', (k - (P - 0.6)) / 0.6]; }
  update(dt) { this.t += dt; const [st] = this.cyc(); if (st === 'snap' && this.st !== 'snap' && this.g.onScreen(this, 60)) TourKit.sfx('snap', 'kick', { vol: 0.4, pitch: 1.2 }); this.st = st; }
  drop() { const [st, k] = this.cyc(); return st === 'snap' ? Math.sin(Math.min(1, k * 2.2) * Math.PI / 2) * (k > 0.75 ? (1 - k) * 4 : 1) : 0; }
  collidePlayer(p) {
    const d = this.drop(); if (d < 0.35) return;
    const box = { x: this.cx - 16, y: this.hang + 20, w: 32, h: 20 + d * (this.reach - 30) };
    if (overlap(p, box)) p.hurt(this);
  }
  hit() { return false; }
  touchPlayer() {}
  draw(ctx) {
    const [st, k] = this.cyc(), x = this.cx, y = this.hang, d = this.drop(), t = this.t;
    const gape = st === 'tell' ? 0.55 + Math.sin(t * 40) * 0.05 : st === 'snap' ? 0.05 : 0.3, shake = st === 'tell' ? Math.sin(t * 50) * 1.5 : 0;
    ctx.save(); ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, this.g.camY - 20 < y - 3 * TS ? y - 3 * TS : this.g.camY - 20); ctx.lineTo(x, y); ctx.stroke();
    ctx.translate(x + shake, y + 4 + d * (this.reach - 40));
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = WA.RED;
    // the spring
    ctx.fillStyle = st === 'tell' ? '#ffe0a0' : '#e8e2d4'; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.ellipse(-10 + q * 4, 0, 3, 6, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
    // the two jaws, toothed, hinged at the back
    ctx.fillStyle = WA.RED;
    for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * gape); ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(26, s * 2); for (let q = 0; q < 4; q++) { ctx.lineTo(24 - q * 6, s * 9); ctx.lineTo(21 - q * 6, s * 4); } ctx.lineTo(-6, s * 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.restore();
    // the tell: a warning mark under them, where they'll come down
    if (st === 'tell') { ctx.save(); ctx.strokeStyle = `rgba(232,68,46,${0.5 + k * 0.5})`; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.lineTo(x, y + this.reach); ctx.stroke(); ctx.restore(); }
  }
}
ENTITY_TYPES.washJaws = WashJaws;
Tour.pieces['wash.jaws'] = function (st, o) { st.B.spawn('washJaws', st.x, st.gy - 1, { period: o.period || 2.8, phase: o.phase || 0, reach: o.reach || 3 }); return st.x; };

Object.assign(TourLandscape.ARCH_LABEL, { sweater: 'SWEATER', unzip: 'UNZIP', cling: 'CLING', pockets: 'POCKETS' });
Tour.washKit.LININGS = LININGS; Tour.washKit.CLING = CLING;
})();
