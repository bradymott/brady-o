/* ============================================================
   THE DEPARTMENT OF UNCLAIMED SHADOWS: the land's mechanics (world 35).
   Shared: the area system `shad` (rides onto the built area and the checker's copy), the THROW claim (a prop takes the
   action button only while Brady stands on its mark), the claims grille (a lock: a salmon filing grille that rolls up),
   the filing wall (a two-faced climbing surface: the drying-net physics of 29_tour_y_wash_a_net.js, re-dressed as a wall
   of salmon drawers whose pulls and their grape shadow rungs are the holds; an open drawer is where Brady crosses to
   the far face, the dark inside of the cabinets).
   35-1 CLAIM     shadows pinned on the wall, each with one notch, each over a pair of chalk heel marks; an owner (an
                  umbrella, a teapot, a rabbit...) waits by a grille with an empty dashed outline where its shadow belongs.
                  Stand with your heels on the matching shadow's heels and THROW: it unpins and flies home; the grille
                  rolls up. The last two umbrella shadows look the same until Brady stands on one: it opens and shows
                  (or doesn't show) the missing spoke.
   35-2 LAMPLEN   a floor lamp throws Brady's own shadow up the wall, leaning away from it: the nearer the lamp, the
                  taller the shadow. Its raised hand must meet a folded shelf's handle: a REACH tick, and the shelf
                  folds down into a ledge. The last handle sits over a tall lip: only a jump at the right distance
                  lifts the shadow's hand to it.
   35-3 OVERLAP   two wall shadows (a fixed one and one thrown by a folding screen on castors) are solid only where they
                  overlap (drawn dark with a bright edge). Stand at the screen and walk: it rolls, and the solid patch
                  grows, shrinks or climbs. The last one: slide it further to give up half the patch for a taller step.
   35-4 TRIM      a tailor's station: a floor lamp lays Brady's shadow out long behind him, under a paper cutter. Stand on
                  the chalk mark (the shadow's excess lies under the blade) and THROW: trimmed to fit. A mail slot in a
                  wall takes a shadow of the right size only: walk into it and the wall opens. The last slot wants a long
                  arm and a short body: JUMP on the mark and THROW in the air (the arm is up, clear of the blade).
   35-5 SPLIT     two clerks' lamps throw two shadows of Brady, one each way. Stand where both shadows' feet are on their
                  claim slots for a breath: both claims stamp and the grille rolls up. The last desk: the hat marks line
                  up one spot early (a decoy); only the feet count.
   The checker: each puzzle's result is a lock (the grille; its key the spot that solves it) or a toggle group (B tiles:
   the shelf, the overlap step) switched where it is solved.
   ============================================================ */
(function () {
const K = Tour.shadKit, INK = K.INK, SA = K.ShadArt;
const BUT = K.BUT, BUT_HI = K.BUT_HI, GRA = K.GRA, GRA_HI = K.GRA_HI, GRA_LO = K.GRA_LO, GRA_DK = K.GRA_DK, SAL = K.SAL, SAL_HI = K.SAL_HI, SAL_LO = K.SAL_LO, WHITE = K.WHITE;
const BREATH = 0.8;

/* ---------------- the `shad` area system ---------------- */
if (TourBuild.SYSTEMS.indexOf('shad') < 0) TourBuild.SYSTEMS.push('shad');
{
  const px0 = Validator.proxyArea;
  Validator.proxyArea = function (area, mask) { const A = px0.call(this, area, mask); if (area.shad) A.shad = area.shad; return A; };
}
const inShad = g => !!(g && g.area && g.area.shad);
const setRect = (g, r, t) => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) g.setTile(x, y, t); };
const hideRect = (g, r, v) => { const A = g.area; if (!A.hide) return; for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) if (x >= 0 && y >= 0 && x < A.W && y < A.H) A.hide[y * A.W + x] = v; };
const say = (g, x, y, text, col) => K.pill(g, x, y, text, col);
const ring = (ctx, x, y, k, r) => { ctx.save(); ctx.strokeStyle = 'rgba(28,20,38,0.7)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, r || 14, 0, TAU); ctx.stroke(); ctx.strokeStyle = BUT_HI; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r || 14, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(k, 0, 1)); ctx.stroke(); ctx.restore(); };
const onRow = (p, row) => p && !p.dead && p.onGround && p.groundTy === row;
// a big bold tick on a dark disc (REACH! / FITS / MATCH): readable on a phone at a glance
const tick = (ctx, x, y, k) => { ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = 'rgba(28,20,38,0.88)'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8af07a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-1, 5); ctx.lineTo(7, -6); ctx.stroke(); ctx.restore(); };
// chalk heel marks on the floor (a pair of little U's)
const heels = (ctx, x, y, lit) => { ctx.save(); ctx.strokeStyle = lit ? '#fff8c0' : 'rgba(255,253,242,0.9)'; ctx.lineWidth = lit ? 3.5 : 2.5; for (const dx of [-7, 7]) { ctx.beginPath(); ctx.arc(x + dx, y - 3, 4.5, 0, Math.PI); ctx.stroke(); } ctx.restore(); };

/* ---------------- the THROW claim ---------------- */
{
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g;
    if (inShad(g) && inp && this.state === 'play' && !this.dead) {
      let claim = null;
      for (const e of g.entities) if (e.shadClaim && !e.remove && e.shadClaim(this)) { claim = e; break; }
      g.shadIn = claim ? { pressed: !!inp.actionPressed, held: !!inp.action, by: claim } : null;
      if (claim) inp = Object.assign({}, inp, { actionPressed: false, action: false });
    } else if (g && g.shadIn) g.shadIn = null;
    return up0.call(this, dt, inp);
  };
  if (typeof TourPicker !== 'undefined') { const vis0 = TourPicker.visible; TourPicker.visible = function (play) { if (play && play.shadIn) return false; return vis0.call(this, play); }; }
}
// a word on a dark pill over a prop Brady stands at (THROW's meaning there), kept above his head
const hint = (e, ctx, x, y, word) => {
  const p = e.g.player; if (p) { y = Math.min(y, p.y - 30); x = clamp(x, p.cx - 70, p.cx + 70); }
  ctx.save(); ctx.font = '10px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(word).width + 16, yy = y + Math.sin(e.t * 5) * 1.5; ctx.fillStyle = 'rgba(28,20,38,0.9)'; rr(ctx, x - w / 2, yy - 10, w, 20, 10); ctx.fill();
  ctx.fillStyle = '#ffe08a'; ctx.fillText(word, x, yy + 1); ctx.restore();
};

/* ---------------- the claims grille: a lock drawn as a salmon roll-up grille with a ticket window ---------------- */
{
  const L = ENTITY_TYPES.lock, d0 = L.prototype.draw;
  L.prototype.draw = function (ctx) {
    if (this.lookName !== 'shadGrille') return d0.call(this, ctx);
    const x = this.x, y = this.y, w = this.w, h = this.h, k = this.open ? 1 - Math.max(0, this.openT || 0) / 0.6 : 0, hh = h * (1 - k);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = SAL_LO; ctx.fillRect(x - 3, y - 8, w + 6, 8); ctx.strokeRect(x - 3, y - 8, w + 6, 8);
    if (hh > 2) {
      ctx.fillStyle = SAL; ctx.fillRect(x + 2, y, w - 4, hh); ctx.strokeRect(x + 2, y, w - 4, hh);
      ctx.strokeStyle = SAL_LO; ctx.lineWidth = 2; for (let yy = y + 8; yy < y + hh - 2; yy += 9) { ctx.beginPath(); ctx.moveTo(x + 4, yy); ctx.lineTo(x + w - 4, yy); ctx.stroke(); }
      ctx.fillStyle = BUT; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillRect(x + 6, y + hh - 10, w - 12, 6); ctx.strokeRect(x + 6, y + hh - 10, w - 12, 6);
    }
    ctx.restore();
  };
}
const openGrilles = (g, id) => {
  for (const e of g.entities) if (e instanceof ENTITY_TYPES.lock && e.id === id && !e.open) { e.open = true; e.openT = 0.6; for (const [x, y] of e.tiles) g.setTile(x, y, T.EMPTY); g.burst(e.cx, e.cy, 14, BUT_HI, 'confetti'); }
  TourKit.sfx('grille', 'secret', { vol: 0.5, pitch: 1.2 });
};
// a grille h tiles tall, its bottom on the letter's row: { id, h }
Tour.pieces['shad.grille'] = function (st, o) { st.B.lock(st.x, st.gy - (o.h || 4), st.gy - 1, o.id, 'shadGrille'); return st.x; };

/* ======================= 35-1 CLAIM: reunite a pinned shadow with its owner ======================= */
// { owner: [kind, notch, dx, spoke?], pins: [[kind, notch, dx, spoke?], ...] (dx: tiles right of the letter),
//   right: index, lock, umb: true (the umbrellas: closed until Brady stands on the heels) }
class ShadBoard extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s; this.row = Math.round(s.y / TS); this.tx = Math.round((s.x - TS / 2) / TS);
    const xs = s.pins.map(q => q[2]).concat([s.owner[2]]);
    this.x = (this.tx + Math.min(...xs)) * TS - 30; this.w = (Math.max(...xs) - Math.min(...xs) + 1) * TS + 60; this.y = (this.row - 4) * TS; this.h = 4 * TS;
    this.done = false; this.fly = -1;
  }
  markX(k) { return (this.tx + this.s.pins[k][2] + 0.5) * TS; }
  at() { const p = this.g.player; if (!onRow(p, this.row)) return -1; for (let k = 0; k < this.s.pins.length; k++) if (Math.abs(p.cx - this.markX(k)) < 16) return k; return -1; }
  shadClaim(p) { return !this.done && this.at() >= 0; }
  update(dt) {
    this.t += dt; const g = this.g;
    if (this.done) { this.fly = Math.min(1, this.fly + dt * 1.4); return; }
    const I = g.shadIn; if (!I || I.by !== this || !I.pressed) return;
    const k = this.at(); if (k < 0) return;
    if (k === this.s.right) {
      this.done = true; this.fly = 0; this.won = k; openGrilles(g, this.s.lock);
      say(g, this.markX(k), this.row * TS - 110, 'CLAIMED! A PERFECT FIT', '#ffe08a'); Sound.play('secret', { vol: 0.5 });
      g.burst(this.markX(k), this.row * TS - 40, 18, BUT_HI, 'confetti');
    } else { say(g, this.markX(k), this.row * TS - 110, 'NOT THEIRS: WRONG NOTCH', '#ffb0a0'); TourKit.sfx('fizz', 'bump', { vol: 0.4, pitch: 0.7 }); }
  }
  touchPlayer() {}
  draw(ctx) {
    const s = this.s, t = this.t, fy = this.row * TS, k0 = this.at(), sc = 1.45;
    ctx.save();
    // the owner, by its grille: its colour self, and the dashed outline where its shadow belongs
    const O = s.owner, ox = (this.tx + O[2] + 0.5) * TS;
    SA.owner(ctx, O[0], ox, fy, sc, t, { notch: O[1], spoke: O[3], happy: this.done });
    s.pins.forEach((q, k) => {
      if (this.done && k === this.won) return;
      const x = this.markX(k), open = s.umb && k0 === k, kind = open ? 'umbOpen' : q[0];
      // the pins at the top and the shadow itself, flat against the wall, with its one notch
      SA.shape(ctx, kind, x + 4, fy - 2, sc, { fill: GRA, notch: open ? null : q[1], spoke: open ? q[3] : null, hole: BUT, lw: 2 });
      const top = { umb: -46, umbOpen: -38, pot: -30, rab: -42, can: -30, ket: -34 }[kind] || -30;
      SA.pin(ctx, x + 4, fy + top * sc + 4, t);
      heels(ctx, x, fy, k0 === k);
    });
    // the reunited shadow flying home to its owner, then lying behind it
    if (this.done) {
      const q = s.pins[this.won], f = this.fly, x = lerp(this.markX(this.won) + 4, ox + 10 * sc, f), y = fy - Math.sin(f * Math.PI) * 40;
      SA.shape(ctx, f >= 1 && s.umb ? 'umbOpen' : q[0], x, y, sc, { fill: GRA, notch: f >= 1 && s.umb ? null : q[1], spoke: q[3], lw: 2 });
      if (f >= 1) SA.owner(ctx, O[0], ox, fy, sc, t, { notch: O[1], spoke: O[3], happy: true });
    }
    if (k0 >= 0 && !this.done) hint(this, ctx, this.markX(k0), fy - 100, 'THROW: CLAIM IT');
    ctx.restore();
  }
}
ENTITY_TYPES.shadBoard = ShadBoard;
Tour.pieces['shad.board'] = function (st, o) {
  const B = st.B; B.spawn('shadBoard', st.x, st.gy - 1, o);
  if (o.lock) B.vkey(o.lock, [[st.x + o.pins[o.right][2], st.gy - 1]]);
  return st.x;
};

/* ======================= 35-2 LAMPLEN: the shadow's hand meets the shelf's handle ======================= */
// Brady's shadow on the wall from a floor lamp: H0 tall at a distance, up to ~4x as tall right by the lamp, leaning away
// from it. The same numbers place each handle (shadHand) and draw the shadow, so a handle is exactly where the hand
// goes when Brady stands on (or jumps from) the spot the level means.
const H0 = 54, RANGE = 6 * TS;
const shadScale = d => 1 + 3.0 * clamp((RANGE - Math.max(0.5 * TS, d)) / RANGE, 0, 1);
// the hand of Brady's wall shadow: lamp at pixel x lx, Brady's centre cx, his feet `rise` px above the floor fy
const shadHand = (lx, cx, fy, rise) => {
  const d = Math.abs(cx - lx), s = shadScale(d), side = cx >= lx ? 1 : -1, H = H0 * s;
  const lean = side * H * 0.45, feetY = fy - (rise || 0) * s;
  return { x: cx + lean + side * H * 0.16, y: feetY - H * 1.08, H, s, side, lean, feetY };
};
// a level's handle for a lamp tile and a target tile (jump: the hand at a jump's apex there, one and a half tiles up)
const handleAt = (lampTx, atTx, floorRow, jump) => { const h = shadHand((lampTx + 0.5) * TS, (atTx + 0.5) * TS, floorRow * TS, jump ? 1.5 * TS : 0); return [h.x, h.y]; };
// the shelf a handle belongs to: folded up against the wall, its hinge w tiles under the handle; pulled, it swings down
// (toward dir) into a one-way ledge w tiles wide on the hinge's row
const shelfOf = (lampTx, atTx, floorRow, jump, w, dir) => {
  const [hx, hy] = handleAt(lampTx, atTx, floorRow, jump), hTx = Math.floor(hx / TS), R = Math.floor(hy / TS) + w;
  const x0 = dir > 0 ? hTx : hTx - w + 1;
  return { hx, hy, R, x0, x1: x0 + w - 1, px: dir > 0 ? hTx * TS : (hTx + 1) * TS, py: R * TS };
};
class ShadLamp extends Ent {
  // { lamp: tile, at: tile, row: floor row, jump, w (shelf tiles), dir (the way it swings down), g }
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s; this.fy = s.row * TS; this.lx = (s.lamp + 0.5) * TS;
    this.S = shelfOf(s.lamp, s.at, s.row, s.jump, s.w || 2, s.dir || 1); this.hx = this.S.hx; this.hy = this.S.hy; this.done = false; this.fold = 0;
    this.x = Math.min(this.lx, this.S.x0 * TS, this.hx) - 4 * TS; this.w = Math.max(this.lx, (this.S.x1 + 1) * TS, this.hx) + 4 * TS - this.x; this.y = this.hy - 3 * TS; this.h = this.fy - this.y + TS;
  }
  hand() { const p = this.g.player; if (!p || p.dead) return null; return shadHand(this.lx, p.cx, this.fy, Math.max(0, this.fy - (p.y + p.h))); }
  near() { const p = this.g.player; return p && !p.dead && Math.abs(p.cx - this.lx) < RANGE + 2 * TS && p.y + p.h > this.fy - 6 * TS && p.y + p.h <= this.fy + 4; }
  update(dt) {
    this.t += dt; if (this.done) { this.fold = Math.min(1, this.fold + dt * 2.5); return; }
    if (!this.near()) return;
    const h = this.hand(), p = this.g.player; if (!h) return;
    const dd = Math.hypot(h.x - this.hx, h.y - this.hy), ok = dd < 22 && (!this.s.jump || !p.onGround);
    if (ok) {
      this.done = true; const g = this.g, r = [this.S.x0, this.S.R, this.S.x1, this.S.R];
      setRect(g, r, T.SEMI); hideRect(g, r, 1); g.refreshPlatforms && g.refreshPlatforms();
      Sound.play('secret', { vol: 0.5 }); g.burst(this.hx, this.hy, 14, BUT_HI, 'spark');
      say(g, this.hx, this.hy - 30, 'REACH! THE SHELF COMES DOWN', '#ffe08a');
    } else if (this.s.jump && dd < 40 && p.onGround && !this.lipSaid) { this.lipSaid = true; say(this.g, this.hx, this.hy - 30, 'THE LIP\'S IN THE WAY: JUMP!', '#c8d8ff'); }
  }
  touchPlayer() {}
  draw(ctx) {
    const s = this.s, t = this.t, fy = this.fy, S = this.S, dir = s.dir || 1, len = (s.w || 2) * TS;
    ctx.save();
    // the lamp's cone, wide and pale, across the wall
    SA.cone(ctx, this.lx, fy - 3.1 * TS + 18, fy, 3.2 * TS, 0.9);
    // Brady's own shadow on the wall, leaning away from the lamp, its hand up
    if (this.near()) { const h = this.hand(); if (h) SA.bradyShadow(ctx, this.g.player.cx, h.feetY, h.H, h.lean, { armDir: h.side, col: 'rgba(58,24,72,0.88)' }); }
    // the shelf: a salmon board on its hinge, folded up to the handle, then swung down into a ledge
    const up = Math.atan2(this.hy - S.py, this.hx - S.px), down = dir > 0 ? 0 : Math.PI, a = lerp(up, down, this.done ? this.fold : 0);
    ctx.save(); ctx.translate(S.px, S.py); ctx.rotate(a); ctx.fillStyle = SAL; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(0, -6, len, 12); ctx.strokeRect(0, -6, len, 12); ctx.fillStyle = SAL_LO; ctx.fillRect(4, 2, len - 8, 3); ctx.restore();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(S.px, S.py, 3.5, 0, TAU); ctx.fill();
    if (!this.done) {
      // the handle: a big brass ring where the hand must go, its dashed halo bright when the hand comes near
      const h = this.near() ? this.hand() : null, dd = h ? Math.hypot(h.x - this.hx, h.y - this.hy) : 999, k = 0.5 + 0.5 * Math.sin(t * 6);
      ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(this.hx, this.hy, 10, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#e8c84a'; ctx.lineWidth = 4; ctx.stroke();
      ctx.strokeStyle = dd < 60 ? `rgba(255,248,180,${0.6 + 0.4 * k})` : 'rgba(255,253,242,0.7)'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(this.hx, this.hy, 20, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      if (s.jump) { ctx.fillStyle = GRA_LO; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(this.hx - 28, this.hy + 24, 56, 10); ctx.strokeRect(this.hx - 28, this.hy + 24, 56, 10); }
    } else if (this.fold < 1) tick(ctx, this.hx, this.hy - 24, 1);
    SA.floorLamp(ctx, this.lx, fy, 3.1 * TS, true, t);
    ctx.restore();
  }
}
ENTITY_TYPES.shadLamp = ShadLamp;
Tour.pieces['shad.lamp'] = function (st, o) {
  const B = st.B, row = st.gy, S = shelfOf(o.lamp, o.at, row, o.jump, o.w || 2, o.dir || 1); B.spawn('shadLamp', st.x, st.gy - 1, Object.assign({ row }, o));
  if (o.g != null) { B.toggle(o.g, [], [[S.x0, S.R, S.x1, S.R, T.SEMI]], { kind: 'shadLamp' }); B.switchAt(o.g, o.at, row - 1); }
  return st.x;
};

/* ======================= the carriage: a prop on a floor rail that rolls along with Brady ======================= */
// { rail: [x0, x1, y] (the carriage's left tile from x0 to x1; y the floor row), w (tiles), at (start tile) }
const carriage = {
  init(e, s) { e.rail = s.rail; e.cw = s.w || 2; e.cxF = ((s.at != null ? s.at : s.rail[0]) + e.cw / 2) * TS; e.holding = false; },
  sx(e) { return Math.round(e.cxF / TS - e.cw / 2); },
  update(e, dt) {
    const p = e.g.player, R = e.rail, lo = (R[0] + e.cw / 2) * TS, hi = (R[1] + e.cw / 2) * TS;
    e.holding = !!(p && !p.dead && p.onGround && p.groundTy === R[2] && Math.abs(p.cx - e.cxF) < e.cw * TS / 2 + 2);
    if (e.holding) { const nx = clamp(p.cx, lo, hi); if (Math.abs(nx - e.cxF) > 0.5) TourKit.sfx('roll', 'select', { vol: 0.1, pitch: 0.6 }); e.cxF = nx; }
    else { const tgt = (carriage.sx(e) + e.cw / 2) * TS; e.cxF = lerp(e.cxF, tgt, Math.min(1, dt * 10)); }
  },
  drawRail(ctx, e) {
    const R = e.rail, y = R[2] * TS, x0 = R[0] * TS + 4, x1 = (R[1] + e.cw) * TS - 4;
    ctx.save(); ctx.strokeStyle = 'rgba(28,20,38,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y + 4); ctx.lineTo(x1, y + 4); ctx.stroke();
    for (const xx of [x0, x1]) { ctx.fillStyle = SAL; ctx.beginPath(); ctx.arc(xx, y + 4, 3.5, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
};

/* ======================= 35-3 OVERLAP: solid only where two shadows overlap ======================= */
// { a: [[x0, y0, x1, y1], ...] the fixed shadow's cells, b: [...] the screen's shadow's cells with the screen at rail[0],
//   rail: [x0, x1, row], at: start tile, good: the tile the checker uses, g }
const cellsOf = (rects, dx) => { const S = new Set(); for (const r of rects) for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) S.add((x + dx) + ',' + y); return S; };
const overlapCells = (s, sx) => { const A = cellsOf(s.a, 0), B = cellsOf(s.b, sx - s.rail[0]), out = []; for (const k of B) if (A.has(k)) out.push(k.split(',').map(Number)); return out; };
class ShadOverlap extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s; carriage.init(this, s); this.cur = []; this.lastSx = null;
    const all = s.a.concat(s.b.map(r => [r[0], r[1], r[2] + s.rail[1] - s.rail[0], r[3]]));
    this.x = Math.min(...all.map(r => r[0]), s.rail[0]) * TS - 3 * TS; this.w = (Math.max(...all.map(r => r[2]), s.rail[1] + 2) + 4) * TS - this.x;
    this.y = Math.min(...all.map(r => r[1])) * TS - 3 * TS; this.h = (s.rail[2] + 1) * TS - this.y;
  }
  apply() {
    const g = this.g, sx = carriage.sx(this); if (sx === this.lastSx) return; this.lastSx = sx;
    const nu = overlapCells(this.s, sx), key = c => c[0] + ',' + c[1], keep = new Set(nu.map(key));
    for (const c of this.cur) if (!keep.has(key(c))) { g.setTile(c[0], c[1], T.EMPTY); hideRect(g, [c[0], c[1], c[0], c[1]], 0); }
    for (const c of nu) { g.setTile(c[0], c[1], T.SEMI); hideRect(g, [c[0], c[1], c[0], c[1]], 1); }
    this.cur = nu; g.refreshPlatforms && g.refreshPlatforms();
    if (this.started && nu.length) TourKit.sfx('click', 'select', { vol: 0.25, pitch: 1.2 + nu.length * 0.03 });
    this.started = true;
  }
  update(dt) { this.t += dt; carriage.update(this, dt); this.apply(); }
  touchPlayer() {}
  draw(ctx) {
    const s = this.s, t = this.t, sx = this.cxF / TS - this.cw / 2, dx = (sx - s.rail[0]) * TS, fy = s.rail[2] * TS;
    ctx.save();
    // the fixed lamp's shadow (A) and the screen's shadow (B): pale grape, see-through, dashed edges
    const paint = (rects, ox, fill) => { ctx.fillStyle = fill; for (const r of rects) ctx.fillRect(r[0] * TS + ox, r[1] * TS, (r[2] - r[0] + 1) * TS, (r[3] - r[1] + 1) * TS); };
    const edge = (rects, ox, col) => { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); for (const r of rects) ctx.strokeRect(r[0] * TS + ox + 1, r[1] * TS + 1, (r[2] - r[0] + 1) * TS - 2, (r[3] - r[1] + 1) * TS - 2); ctx.setLineDash([]); };
    paint(s.a, 0, 'rgba(124,74,140,0.32)'); paint(s.b, dx, 'rgba(124,74,140,0.32)');
    edge(s.a, 0, 'rgba(58,24,72,0.7)'); edge(s.b, dx, 'rgba(58,24,72,0.7)');
    // the overlap: solid, near-black grape with a bright butter edge on top (the step)
    for (const [x, y] of this.cur) {
      ctx.fillStyle = GRA_DK; ctx.fillRect(x * TS, y * TS, TS, TS);
      const up = this.cur.some(c => c[0] === x && c[1] === y - 1); if (!up) { ctx.fillStyle = BUT_HI; ctx.fillRect(x * TS, y * TS, TS, 4); ctx.fillStyle = INK; ctx.fillRect(x * TS, y * TS + 4, TS, 1.5); }
      const lf = this.cur.some(c => c[0] === x - 1 && c[1] === y), rt = this.cur.some(c => c[0] === x + 1 && c[1] === y);
      ctx.fillStyle = 'rgba(255,240,180,0.75)'; if (!lf) ctx.fillRect(x * TS, y * TS, 2.5, TS); if (!rt) ctx.fillRect(x * TS + TS - 2.5, y * TS, 2.5, TS);
    }
    // the folding screen on castors (it throws shadow B): three salmon panels, a little lamp clipped on top
    carriage.drawRail(ctx, this);
    const cx = this.cxF; ctx.translate(cx, fy);
    for (let k = -1; k <= 1; k++) { ctx.fillStyle = k ? SAL : SAL_HI; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(k * 18 - 9, -6); ctx.lineTo(k * 18 - 9, -78 + Math.abs(k) * 4); ctx.lineTo(k * 18 + 9, -78 + (k === 1 ? 4 : 0)); ctx.lineTo(k * 18 + 9, -6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = INK; for (const wx of [-22, 22]) { ctx.beginPath(); ctx.arc(wx, -4, 4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -84, 5, 0, TAU); ctx.fill(); ctx.stroke();
    if (this.holding) hint(this, ctx, 0, -110, '◀ WALK TO SLIDE IT ▶');
    ctx.restore();
  }
}
ENTITY_TYPES.shadOverlap = ShadOverlap;
Tour.pieces['shad.overlap'] = function (st, o) {
  const B = st.B; B.spawn('shadOverlap', st.x, st.gy - 1, o);
  if (o.g != null) { B.toggle(o.g, [], overlapCells(o, o.good).map(c => [c[0], c[1], c[0], c[1], T.SEMI]), { kind: 'shadOverlap' }); B.switchAt(o.g, o.good, o.rail[2] - 1); }
  return st.x;
};

/* ======================= 35-4 TRIM: cut the shadow to fit the mail slot ======================= */
// the station: { cutter: tile (the blade), mark: tile (the chalk mark), row, id (its slot), arm: true (the last one) };
// the lamp stands three tiles past the mark, so the shadow lies from Brady's heels back under the blade
const LONG = 6 * TS;
class ShadCutter extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s; this.fy = s.row * TS; this.dir = s.mark > s.cutter ? 1 : -1;
    this.bx = (s.cutter + 0.5) * TS; this.mx = (s.mark + 0.5) * TS; this.lx = this.mx + this.dir * 3 * TS;
    this.x = Math.min(this.bx, this.lx) - 7 * TS; this.w = Math.abs(this.lx - this.bx) + 14 * TS; this.y = this.fy - 5 * TS; this.h = 5 * TS + 8; this.chop = 0;
  }
  zone(p) { return p && !p.dead && Math.abs(p.y + p.h - this.fy) < 3.5 * TS && (p.cx - this.bx) * this.dir > 8 && (this.lx - p.cx) * this.dir > 8; }
  onMark(p) { return Math.abs(p.cx - this.mx) < 18; }
  shadClaim(p) { return this.zone(p) && (p.onGround ? p.groundTy === this.s.row : this.s.arm); }
  update(dt) {
    this.t += dt; if (this.chop > 0) this.chop -= dt;
    const g = this.g, p = g.player, I = g.shadIn; if (!I || I.by !== this || !I.pressed) return;
    const ok = this.onMark(p), arm = !p.onGround;
    this.chop = 0.4; TourKit.sfx('chop', 'bump', { vol: 0.5, pitch: 1.4 }); g.burst(this.bx, this.fy - 6, 10, GRA_HI, 'dust');
    p.shadTrim = { id: this.s.id, ok: ok && (!this.s.arm || arm), arm, len: Math.abs(p.cx - this.bx) };
    if (!ok) say(g, p.cx, p.y - 40, Math.abs(p.cx - this.bx) > Math.abs(this.mx - this.bx) ? 'CUT TOO LONG: STAND ON THE CHALK' : 'CUT TOO SHORT: STAND ON THE CHALK', '#ffb0a0');
    else if (this.s.arm && !arm) say(g, p.cx, p.y - 40, 'THE ARM GOT CUT TOO: JUMP, THEN CUT', '#ffb0a0');
    else say(g, p.cx, p.y - 40, 'TRIMMED TO FIT! TO THE SLOT', '#ffe08a');
  }
  touchPlayer() {}
  draw(ctx) {
    const s = this.s, t = this.t, fy = this.fy, p = this.g.player, d = this.dir;
    ctx.save();
    SA.cone(ctx, this.lx, fy - 2.6 * TS + 18, fy, 1.4 * TS, 0.7, -d);
    // the chalk mark: a bold white cross on the floor, a little chalk triangle beside it
    ctx.strokeStyle = WHITE; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(this.mx - 9, fy - 1); ctx.lineTo(this.mx + 9, fy - 1); ctx.moveTo(this.mx, fy - 8); ctx.lineTo(this.mx, fy + 2); ctx.stroke();
    // Brady's shadow, laid out flat on the floor behind him (from his heels back past the blade), when he is here
    if (this.zone(p)) {
      const hx = p.cx, rise = Math.max(0, fy - (p.y + p.h)), len = p.shadTrim && p.shadTrim.id === s.id ? p.shadTrim.len : LONG, x1 = hx - d * len;
      ctx.fillStyle = 'rgba(58,24,72,0.88)'; ctx.beginPath(); ctx.moveTo(hx, fy - 1); ctx.lineTo(x1 + d * 10, fy - 1); ctx.quadraticCurveTo(x1, fy - 6, x1 + d * 10, fy - 10); ctx.lineTo(hx, fy - 12); ctx.closePath(); ctx.fill();
      // the arm: lying flat with the body, or raised up off the floor while Brady is in the air
      ctx.strokeStyle = 'rgba(58,24,72,0.88)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); const ax = hx - d * Math.min(len, LONG) * 0.6;
      if (rise > 6) { ctx.moveTo(ax, fy - 8); ctx.lineTo(ax - d * 6, fy - 8 - Math.min(60, rise)); } else { ctx.moveTo(ax, fy - 8); ctx.lineTo(ax - d * 26, fy - 14); }
      ctx.stroke();
      if (this.onMark(p) && p.onGround) tick(ctx, this.mx, fy - 92, 0.8);
    }
    // the paper cutter: a salmon board with a long blade on a hinge (down for a moment after THROW)
    const up = this.chop > 0 ? 0.05 : 0.9;
    ctx.fillStyle = BUT; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(this.bx - 18, fy - 8, 36, 8); ctx.strokeRect(this.bx - 18, fy - 8, 36, 8);
    ctx.save(); ctx.translate(this.bx - d * 14, fy - 8); ctx.rotate(-d * up); ctx.fillStyle = '#d8dce4'; ctx.fillRect(d > 0 ? 0 : -64, -5, 64, 6); ctx.strokeRect(d > 0 ? 0 : -64, -5, 64, 6); ctx.fillStyle = SAL; ctx.fillRect(d > 0 ? 50 : -64, -7, 14, 10); ctx.strokeRect(d > 0 ? 50 : -64, -7, 14, 10); ctx.restore();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(this.bx - d * 14, fy - 8, 3, 0, TAU); ctx.fill();
    SA.floorLamp(ctx, this.lx, fy, 2.6 * TS, true, t);
    if (this.g.shadIn && this.g.shadIn.by === this) hint(this, ctx, p.cx, p.y - 34, s.arm ? 'JUMP, THEN THROW: CUT' : 'THROW: CUT');
    ctx.restore();
  }
}
ENTITY_TYPES.shadCutter = ShadCutter;
// the mail slot: a lock (a salmon wall with a brass slot) that opens when Brady walks into it with the right cut
class ShadSlot extends ENTITY_TYPES.lock {
  constructor(g, s) { super(g, s); this.lookName = 'shadSlot'; this.arm = !!s.arm; this.accept = s.accept || this.id; }
  touchPlayer() {}
  update(dt) {
    super.update && super.update(dt); this.t2 = (this.t2 || 0) + dt;
    const g = this.g, p = g.player; if (this.open || !p || p.dead) return;
    const touch = p.x < this.x + this.w + 6 && p.x + p.w > this.x - 6 && p.y < this.y + this.h && p.y + p.h > this.y;
    if (!touch) { this.told = false; return; }
    const tr = p.shadTrim;
    if (tr && tr.id === this.accept && tr.ok) { p.shadTrim = null; openGrilles(g, this.id); say(g, this.cx, this.y - 20, 'POSTED! IT FITS', '#ffe08a'); Sound.play('secret', { vol: 0.5 }); }
    else if (!this.told) { this.told = true; say(g, this.cx, this.y - 20, !tr || tr.id !== this.accept ? 'YOUR SHADOW\'S TOO LONG TO POST' : this.arm ? 'IT WANTS A LONG ARM, SHORT BODY' : 'WRONG SIZE: CUT IT ON THE CHALK', '#ffb0a0'); }
  }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h, k = this.open ? 1 - Math.max(0, this.openT || 0) / 0.6 : 0;
    if (k >= 1) return;
    ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = SAL; ctx.fillRect(x + 1, y, w - 2, h); ctx.strokeRect(x + 1, y, w - 2, h);
    const sy = y + h - 1.6 * TS; ctx.fillStyle = '#e8c84a'; ctx.fillRect(x + 4, sy, w - 8, 10); ctx.strokeRect(x + 4, sy, w - 8, 10); ctx.fillStyle = INK; ctx.fillRect(x + 7, sy + 3, w - 14, 4);
    // what fits: a little grape silhouette over the slot (short body; with a long raised arm for the last one)
    ctx.fillStyle = GRA; const cx = x + w / 2, by = sy - 6; ctx.fillRect(cx - 9, by - 14, 18, 14); ctx.beginPath(); ctx.arc(cx, by - 19, 5, 0, TAU); ctx.fill();
    if (this.arm) { ctx.fillRect(cx + 6, by - 40, 4, 28); ctx.beginPath(); ctx.arc(cx + 8, by - 42, 3.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = BUT; ctx.font = '7px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('POST', cx, y + 12);
    ctx.restore();
  }
}
ENTITY_TYPES.shadSlot = ShadSlot;
Tour.pieces['shad.cutter'] = function (st, o) {
  const B = st.B; B.spawn('shadCutter', st.x, st.gy - 1, Object.assign({ row: st.gy }, o));
  B.vkey(o.id, [[o.mark, st.gy - 1]]); for (const id of o.also || []) B.vkey(id, [[o.mark, st.gy - 1]]);
  return st.x;
};
// the slot's wall: { id, h, arm }
Tour.pieces['shad.slot'] = function (st, o) {
  const B = st.B, h = o.h || 4; B.lock(st.x, st.gy - h, st.gy - 1, o.id, 'shadSlot');
  const L = B.spawns[B.spawns.length - 1]; if (L && L.type === 'lock') { L.type = 'shadSlot'; L.arm = !!o.arm; L.accept = o.accept || null; }
  return st.x;
};

/* ======================= 35-5 SPLIT: both shadows' feet on their claim slots ======================= */
// { lamps: [l1, l2] tiles, at: tile (where both line up), decoy: tile (the hats line up there), row, lock }
const splitFeet = (l1, l2, cx) => [cx + (cx - l1) * 0.7, cx - (l2 - cx) * 0.7];
const splitHeads = (l1, l2, cx) => [cx + (cx - l1) * 1.25, cx - (l2 - cx) * 1.25];
class ShadSplit extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s; this.fy = s.row * TS;
    this.l1 = (s.lamps[0] + 0.5) * TS; this.l2 = (s.lamps[1] + 0.5) * TS; this.slots = splitFeet(this.l1, this.l2, (s.at + 0.5) * TS);
    this.hats = s.decoy != null ? splitHeads(this.l1, this.l2, (s.decoy + 0.5) * TS) : null;
    this.x = Math.min(this.l1, this.slots[0], this.slots[1]) - 3 * TS; this.w = Math.max(this.l2, this.slots[0], this.slots[1]) + 3 * TS - this.x; this.y = this.fy - 6 * TS; this.h = 6 * TS + 8;
    this.k = 0; this.done = false;
  }
  inside(p) { return onRow(p, this.s.row) && p.cx > this.l1 + 10 && p.cx < this.l2 - 10; }
  update(dt) {
    this.t += dt; if (this.done) return;
    const p = this.g.player, inn = this.inside(p);
    const f = inn ? splitFeet(this.l1, this.l2, p.cx) : null, ok = !!f && Math.abs(f[0] - this.slots[0]) < 14 && Math.abs(f[1] - this.slots[1]) < 14 && Math.abs(p.vx) < 40;
    this.k = ok ? this.k + dt / BREATH : Math.max(0, this.k - dt * 2);
    if (this.hats && inn && !this.hatSaid) { const h = splitHeads(this.l1, this.l2, p.cx); if (Math.abs(h[0] - this.hats[0]) < 14) { this.hatSaid = true; say(this.g, p.cx, p.y - 50, 'THE HATS MATCH... THE FEET DON\'T', '#c8d8ff'); } }
    if (this.k >= 1) { this.done = true; openGrilles(this.g, this.s.lock); say(this.g, p.cx, p.y - 50, 'BOTH CLAIMS STAMPED!', '#ffe08a'); Sound.play('secret', { vol: 0.5 }); }
  }
  touchPlayer() {}
  draw(ctx) {
    const s = this.s, t = this.t, fy = this.fy, p = this.g.player, inn = this.inside(p) || this.done;
    ctx.save();
    for (const [lx, d] of [[this.l1, 1], [this.l2, -1]]) SA.cone(ctx, lx, fy - 2.4 * TS + 16, fy, 2.4 * TS, 0.6, d);
    // the claim slots on the wall at floor level: salmon trays with a shoe drawn in each; lit when a foot is on one
    const f = inn && p ? splitFeet(this.l1, this.l2, p.cx) : null;
    this.slots.forEach((sx, k) => {
      const on = this.done || (f && Math.abs(f[k] - sx) < 14);
      ctx.fillStyle = on ? BUT_HI : SAL; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.fillRect(sx - 20, fy - 16, 40, 16); ctx.strokeRect(sx - 20, fy - 16, 40, 16);
      ctx.fillStyle = GRA_LO; ctx.beginPath(); ctx.moveTo(sx - 10, fy - 4); ctx.lineTo(sx - 10, fy - 12); ctx.lineTo(sx - 2, fy - 12); ctx.lineTo(sx + 2, fy - 7); ctx.lineTo(sx + 12 * (k ? -1 : 1), fy - 4); ctx.closePath(); ctx.fill();
      if (on) tick(ctx, sx, fy - 30, 0.75);
    });
    if (this.hats) for (const hx of this.hats) { ctx.strokeStyle = 'rgba(255,253,242,0.85)'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(hx, fy - 3.4 * TS, 16, 5, 0, 0, TAU); ctx.moveTo(hx - 9, fy - 3.4 * TS); ctx.lineTo(hx - 9, fy - 3.4 * TS - 10); ctx.lineTo(hx + 9, fy - 3.4 * TS - 10); ctx.lineTo(hx + 9, fy - 3.4 * TS); ctx.stroke(); ctx.setLineDash([]); }
    // the two shadows of Brady, one thrown each way (flat on the wall, leaning away from their lamps)
    if (inn && p && !this.done) {
      const fe = splitFeet(this.l1, this.l2, p.cx), he = splitHeads(this.l1, this.l2, p.cx);
      for (let k = 0; k < 2; k++) SA.bradyShadow(ctx, fe[k], fy, 2.1 * TS, he[k] - fe[k], { arm: false, col: 'rgba(58,24,72,0.75)' });
      if (this.k > 0) ring(ctx, p.cx, p.y - 26, this.k);
    }
    for (const lx of [this.l1, this.l2]) SA.floorLamp(ctx, lx, fy, 2.4 * TS, true, t);
    ctx.restore();
  }
}
ENTITY_TYPES.shadSplit = ShadSplit;
Tour.pieces['shad.split'] = function (st, o) {
  const B = st.B; B.spawn('shadSplit', st.x, st.gy - 1, Object.assign({ row: st.gy }, o));
  if (o.lock) B.vkey(o.lock, [[o.at, st.gy - 1]]);
  return st.x;
};

/* ======================= the filing wall: a climbing surface with two faces ======================= */
// the drying-net physics and checker (29_tour_y_wash_a_net.js) read any zone of kind 'washNet'; this draws it as a wall
// of salmon filing drawers: each pull and the grape shadow it throws make a rung; an open drawer is where Brady crosses
// to the far face (the dark inside of the cabinets, drawn as grape with the pulls' shadows in front of him)
let wallN = 0;
class ShadFiling extends Ent {
  constructor(g, s) { super(g, s, s.w * TS, s.h * TS); this.back = true; this.x = s.tx * TS; this.y = s.ty * TS; this.holes = s.holes || []; this.nid = s.nid; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  rungs(ctx, a) {
    const x = this.x, y = this.y, w = this.w, h = this.h;
    ctx.save(); ctx.globalAlpha = a;
    for (let yy = y + 10; yy < y + h; yy += 16) for (let xx = x + 4; xx < x + w - 8; xx += 32) { ctx.fillStyle = GRA; ctx.fillRect(xx + 6, yy + 4, 22, 4); }
    ctx.restore();
  }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h, t = this.t, g = this.g;
    ctx.save();
    ctx.fillStyle = SAL_LO; ctx.fillRect(x - 6, y - 6, w + 12, h + 12); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(x - 6, y - 6, w + 12, h + 12);
    ctx.fillStyle = BUT; ctx.fillRect(x - 10, y - 14, w + 20, 8); ctx.strokeRect(x - 10, y - 14, w + 20, 8);
    // drawer fronts, two rows per tile pair, each with its pull (a rung) and the pull's grape shadow (a second rung)
    for (let yy = y; yy < y + h; yy += 32) for (let xx = x; xx < x + w; xx += 32) {
      ctx.fillStyle = SAL; ctx.fillRect(xx + 1, yy + 1, 30, 30); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.strokeRect(xx + 1, yy + 1, 30, 30);
      ctx.fillStyle = WHITE; ctx.fillRect(xx + 11, yy + 4, 10, 5);
      for (const ry of [12, 26]) { ctx.fillStyle = GRA; ctx.fillRect(xx + 8, yy + ry + 3, 18, 3); ctx.fillStyle = '#e8c84a'; ctx.fillRect(xx + 6, yy + ry - 2, 18, 4); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(xx + 6, yy + ry - 2, 18, 4); }
    }
    // the open drawers (crossing places): a dark mouth with a pale card sticking out
    for (const [hx, hy] of this.holes) { const cx = hx * TS + TS / 2, cy = hy * TS + TS / 2; ctx.fillStyle = GRA_DK; ctx.fillRect(cx - 14, cy - 12, 28, 24); ctx.strokeStyle = BUT_HI; ctx.lineWidth = 3; ctx.strokeRect(cx - 14, cy - 12, 28, 24); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(cx - 16, cy - 14, 32, 28); ctx.fillStyle = WHITE; ctx.fillRect(cx - 6, cy - 16, 12, 6); }
    const p = g.player, W = p && p.wash;
    if (W && W.grip && W.grip.nid === this.nid && !(W.crossT > 0) && Tour.washKit && Tour.washKit.holeAt) {
      const hh = Tour.washKit.holeAt(W.grip, p.x + p.w / 2, p.y + 8);
      if (hh) { const k = 0.5 + 0.5 * Math.sin(t * 8); ctx.strokeStyle = `rgba(255,240,150,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hh[0] * TS + TS / 2, hh[1] * TS + TS / 2, 22 + k * 3, 0, TAU); ctx.stroke(); hint(this, ctx, hh[0] * TS + TS / 2, hh[1] * TS - 18, 'JUMP: THROUGH'); }
    }
    ctx.restore();
  }
}
ENTITY_TYPES.shadFiling = ShadFiling;
// on the far face Brady is inside the cabinets: a grape veil over him and the rungs in front
TourHooks.on('afterEntities', (play, ctx) => {
  const p = play.player, W = p && p.wash; if (!inShad(play) || !W || !W.grip || W.face !== 1) return;
  for (const e of play.entities) if (e instanceof ShadFiling && e.nid === W.grip.nid) { ctx.save(); ctx.fillStyle = 'rgba(42,16,54,0.45)'; ctx.fillRect(e.x, e.y, e.w, e.h); ctx.restore(); e.rungs(ctx, 0.95); }
});
// a flea on the filing wall (lazily made from the wash critter once every file has loaded)
let CrawlerReal = null;
const crawlerType = () => {
  if (CrawlerReal || !ENTITY_TYPES.washCrawler) return CrawlerReal;
  CrawlerReal = class ShadCrawler extends ENTITY_TYPES.washCrawler {
    art(c, x, y, mode) { c.save(); c.translate(x, y - 12); c.rotate(this.ay ? -Math.PI / 2 * Math.sign(this.dirU || 1) : 0); c.fillStyle = GRA; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 0, 13, 9, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = BUT; c.beginPath(); c.ellipse(-2, -2, 8, 5, 0, 0, TAU); c.fill(); c.fillStyle = WHITE; c.beginPath(); c.arc(8, -3, 3, 0, TAU); c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(8.8, -3, 1.3, 0, TAU); c.fill(); c.strokeStyle = GRA; c.lineWidth = 2; for (const k of [-6, 0, 6]) { const l = Math.sin(this.t * 16 + k) * 3; c.beginPath(); c.moveTo(k, 6); c.lineTo(k + l, 12); c.stroke(); } c.restore(); }
  };
  return CrawlerReal;
};
ENTITY_TYPES.shadCrawler = class ShadCrawlerShim extends Ent { constructor(g, s) { const C = crawlerType(); if (C) return new C(g, s); super(g, s, 26, 30); this.remove = true; } update() {} touchPlayer() {} draw() {} };
Object.assign(Tour.pieces, {
  // a filing wall with its top-left cell at the letter: { w, h, holes: [[dx, dy], ...] }
  'shad.filing'(st, o) {
    const B = st.B, x0 = st.x, y0 = st.gy - 1, nid = 'sf' + (++wallN), holes = (o.holes || []).map(([dx, dy]) => [x0 + dx, y0 + dy]);
    B.zone(x0, y0, o.w, o.h, 0, 0, 0, 'washNet', { holes, nid, pulse: true });
    B.spawn('shadFiling', x0, y0, { tx: x0, ty: y0, w: o.w, h: o.h, holes, nid });
    return st.x;
  },
  // { face, ax, ay, speed, phase }
  'shad.crawler'(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1;
    const z = B.zones.find(q => q.kind === 'washNet' && x * TS >= q.x && x * TS < q.x + q.w && y * TS >= q.y && y * TS < q.y + q.h);
    B.spawn('shadCrawler', x, y, { nid: z ? z.nid : null, face: o.face || 0, kind: 'moth', ax: o.ax || 0, ay: o.ay || 0, speed: o.speed || 1.0, phase: o.phase || 0 });
    return st.x;
  }
});

Object.assign(TourLandscape.ARCH_LABEL, { claim: 'LOST PROPERTY', lamplen: 'LONG DIVISION', overlap: 'OVERLAP ALLOWANCE', trim: 'ALTERATIONS' });
Object.assign(Tour.shadKit, { setRect, hideRect, carriage, openGrilles, hint, ring, tick, heels, BREATH, shadHand, handleAt, shelfOf, overlapCells, splitFeet, splitHeads, ShadBoard, ShadLamp, ShadOverlap, ShadCutter, ShadSlot, ShadSplit, ShadFiling, inShad });
try { if (typeof window !== 'undefined') window.BRADY_SHAD = { phys: (b, inp, A, dt, pl, o) => playerPhysicsFlip(b, inp, A, dt, pl, o), spikeContact: (b, A) => spikeContact(b, A), lavaContact: (b, A) => lavaContact(b, A), kit: Tour.shadKit }; } catch (e) { /* not in a browser */ }
})();
