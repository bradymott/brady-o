/* ============================================================
   THE SPARE BONE QUARRY: the land's mechanics (world 37).
   Shared: the area system `bone` (rides onto the built area and the checker's copy), the THROW claim (a prop takes
   the action button only while Brady touches it or stands on its mark: no puffs or lasers fly then), the land's
   secret tell (a hollow bone end in the rock with a mouse's whiskers twitching in it).
   37-1 TRACKWAY  footprint trackways: a plinth shows the creature's next foot; JUMP onto the print that fits; each
                  finished pair raises giant stone steps. The last trackway walked backwards: follow the toes.
   37-2 ASSEMBLY  a vertebra on a socket: THROW at its crank turns it one notch; only one angle lays its rib(s) flat
                  as a bridge over the scree. Late on, one vertebra turns two unequal ribs.
                  The replica-rib RUNGS: a climbable surface. Push UP into it to grip, steer all four ways, JUMP at a
                  persimmon collar to cross to the far face, JUMP elsewhere to let go. Critters climb it too, each on
                  its own face: climb round them (cross faces at a collar).
   37-3 MOULD     a clay tray under a plaster press: crouch or stand as the press comes down and the cast that pops
                  out is low and broad or tall; only the right one fits where it lands.
   37-4 CHISEL    a cracked replica: hold THROW on its mark to draw the chisel along the seam, release at the fork
                  (generous window) and the unwanted half falls away. The last cut ends just before the joint.
   The checker: each puzzle's result is a toggle group (B tiles: the steps, the bridge, the cast; A tiles: the half
   that falls away) with its switch where the puzzle is solved; the game sets the tiles itself when it is solved.
   The rungs are the checker's ghosts (one-way rungs every other row), and in the game a full jump can be made from
   any grip, so every rung the checker stands on is a grip Brady can jump from.
   ============================================================ */
(function () {
const K = Tour.boneKit, INK = K.INK, BA = K.BoneArt, BONE = K.BONE, PERS = K.PERS, PETROL = K.PETROL;

/* ---------------- the `bone` area system ---------------- */
if (TourBuild.SYSTEMS.indexOf('bone') < 0) TourBuild.SYSTEMS.push('bone');
{
  const px0 = Validator.proxyArea;
  Validator.proxyArea = function (area, mask) { const A = px0.call(this, area, mask); if (area.bone) A.bone = area.bone; return A; };
}
const inBone = g => !!(g && g.area && g.area.bone);
// standing on tile (x, floor row y)?
const standsOn = (p, x, y, r) => p && !p.dead && p.onGround && p.groundTy === y && Math.abs(p.cx - (x * TS + TS / 2)) < TS * (r || 0.6);
// set a rect of tiles at run time (only cells that are not already something else when making solid)
const setRect = (g, r, t, onlyEmpty) => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) { if (onlyEmpty && t !== T.EMPTY && tileAt(g.area, x, y) !== T.EMPTY) continue; g.setTile(x, y, t); } };
const bbox = pts => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return [x0, y0, x1, y1]; };

/* ---------------- the THROW claim ---------------- */
// every frame in a bone area: if a prop wants the action button (Brady touches it / stands on its mark), the press and
// the hold go to g.boneIn and Brady's own action (puffs, lasers, gear) does not fire
{
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g;
    if (inBone(g) && inp && this.state === 'play' && !this.dead) {
      let claim = null;
      for (const e of g.entities) if (e.boneClaim && !e.remove && e.boneClaim(this)) { claim = e; break; }
      g.boneIn = claim ? { pressed: !!inp.actionPressed, held: !!inp.action, by: claim } : null;
      g.boneClaimT = claim ? (g.boneClaimT || 0) + dt : 0;
      if (claim) inp = Object.assign({}, inp, { actionPressed: false, action: false });
    }
    return up0.call(this, dt, inp);
  };
  if (typeof TourPicker !== 'undefined') {
    const vis0 = TourPicker.visible;
    TourPicker.visible = function (play) { if (play && play.boneIn) return false; return vis0.call(this, play); };
  }
}
// the THROW hint over a prop Brady stands at (once per prop until used)
const throwHint = (e, ctx, x, y, word) => {
  const g = e.g; if (!g.boneIn || g.boneIn.by !== e) return;
  ctx.save(); ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(word).width + 14; ctx.fillStyle = 'rgba(36,22,14,0.8)'; rr(ctx, x - w / 2, y - 9 + Math.sin(e.t * 5) * 1.5, w, 18, 9); ctx.fill();
  ctx.fillStyle = '#ffd88a'; ctx.fillText(word, x, y + Math.sin(e.t * 5) * 1.5); ctx.restore();
};

/* ---------------- the land's secret tell ---------------- */
// a hollow bone end sticking out of the rock with a socket mouse's whiskers twitching in it: there is room behind
const tell = (ctx, x, y, t, rot) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.fillStyle = BONE; ctx.beginPath(); ctx.ellipse(0, -5, 8, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a200e'; ctx.beginPath(); ctx.ellipse(0, -5, 4.5, 3.4, 0, 0, TAU); ctx.fill();
  const k = Math.sin(t * 7) > 0.3 ? Math.sin(t * 40) * 1.5 : 0;
  ctx.strokeStyle = '#f4ead2'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(1.5, -5); ctx.lineTo(9, -8 + k); ctx.moveTo(1.5, -4); ctx.lineTo(9, -3 - k); ctx.moveTo(-1.5, -5); ctx.lineTo(-9, -8 - k); ctx.stroke();
  ctx.fillStyle = '#ff9aa0'; ctx.beginPath(); ctx.arc(0, -4.5, 1.2, 0, TAU); ctx.fill();
  ctx.restore();
};
Object.assign(Decor, {
  // on a floor (the letter stands on it), under a ceiling (the letter hangs from the tile above), in a wall (the letter
  // is the cell left of the wall)
  boneTell(ctx, x, y, t) { tell(ctx, x, y + 2, t, 0); },
  boneTellCeil(ctx, x, y, t) { tell(ctx, x, y - TS - 2, t, Math.PI); },
  boneTellWall(ctx, x, y, t) { tell(ctx, x + TS / 2 + 2, y - TS / 2, t, -Math.PI / 2); },
  boneTellWallR(ctx, x, y, t) { tell(ctx, x - TS / 2 - 2, y - TS / 2, t, Math.PI / 2); }
});

/* ======================= 37-1 TRACKWAY ======================= */
// one trackway: { prints: [[x, y, kind, toes]] (y: the floor row it is pressed into), order: [print index...],
// mode: 'shape' (the plinth shows the next foot) | 'toes' (follow the toes), plinth: [x, y], raise: [[n, rects]...]
// (after n correct prints those rects rise as stone steps) }
class BoneTrack extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true;
    this.prints = s.prints; this.order = s.order; this.mode = s.mode || 'shape'; this.plinth = s.plinth; this.raise = s.raise || [];
    const pts = this.prints.map(q => [q[0], q[1]]).concat(this.plinth ? [this.plinth] : []);
    for (const [, R] of this.raise) for (const r of R) pts.push([r[0], r[1]], [r[2], r[3]]);
    const b = bbox(pts); this.x = (b[0] - 2) * TS; this.y = (b[1] - 4) * TS; this.w = (b[2] - b[0] + 5) * TS; this.h = (b[3] - b[1] + 6) * TS;
    this.next = 0; this.base = 0; this.lit = []; this.glow = {}; this.risen = this.raise.map(() => 0); this.done = false; this.wasG = true; this.failT = 0;
  }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    for (const k in this.glow) this.glow[k] = Math.max(0, this.glow[k] - dt);
    if (this.failT > 0) this.failT -= dt;
    this.raise.forEach(([n], i) => { if (this.next >= n) this.risen[i] = Math.min(1, this.risen[i] + dt * 2.5); });
    if (!p || p.dead || this.done) { this.wasG = p ? p.onGround : true; return; }
    const landed = p.onGround && !this.wasG; this.wasG = p.onGround;
    if (!landed) return;
    const i = this.prints.findIndex(([x, y]) => standsOn(p, x, y, 0.7));
    if (i < 0 || this.lit.indexOf(i) >= 0) return;
    if (i === this.order[this.next]) {
      this.lit.push(i); this.next++; this.glow[i] = 0.6;
      TourKit.sfx('chime', 'pick', { vol: 0.5, pitch: 1 + this.next * 0.12 });
      g.burst(p.cx, p.y + p.h, 8, '#ffd88a', 'spark');
      for (const [n, R] of this.raise) if (this.next === n) {
        for (const r of R) setRect(g, r, T.HARD, true);
        this.base = n; g.shake(3); Sound.play('stomp', { pitch: 0.5, vol: 0.6 });
        g.parts.text(p.cx, p.y - 26, n >= this.order.length ? (this.mode === 'toes' ? 'IT WALKED BACKWARDS!' : 'THE STEPS RISE!') : 'A PAIR!', '#ffd88a');
      }
      if (this.next >= this.order.length) this.done = true;
    } else {
      // the wrong foot: back to the start of this pair (steps already raised stay)
      this.lit = this.lit.filter(k => this.order.indexOf(k) < this.base); this.next = this.base; this.failT = 1.2;
      TourKit.sfx('fizz', 'bump', { vol: 0.5, pitch: 0.6 });
      g.burst(p.cx, p.y + p.h, 10, '#e8c898', 'dust');
      g.parts.text(p.cx, p.y - 22, this.mode === 'toes' ? 'NOT THAT WAY! FOLLOW THE TOES' : 'THAT FOOT DOESN\'T FIT!', '#ffb0a0');
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const t = this.t;
    ctx.save();
    // the stone steps: a faint chalk outline until they rise, then the stones slide up out of the ground
    this.raise.forEach(([n, R], ri) => {
      const k = this.risen[ri];
      for (const r of R) {
        const x = r[0] * TS, y = r[1] * TS, w = (r[2] - r[0] + 1) * TS, h = (r[3] - r[1] + 1) * TS;
        if (k <= 0) { ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.setLineDash([4, 5]); ctx.lineWidth = 2; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4); ctx.setLineDash([]); continue; }
        const hh = h * k, yy = y + h - hh;
        ctx.fillStyle = '#c8a070'; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(ctx, x + 1, yy, w - 2, hh, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e8c890'; ctx.fillRect(x + 3, yy + 2, w - 6, Math.min(6, hh - 2));
        if (hh > 20) BA.print(ctx, x + w / 2, yy + Math.min(hh / 2, 18), 2 + (ri % 2), 0, 1.1, '#8a6a3a');
      }
    });
    // the prints
    this.prints.forEach(([x, y, kind, toes], i) => {
      const cx = x * TS + TS / 2, cy = y * TS + 5, lit = this.lit.indexOf(i) >= 0;
      // a pad of wet clay pressed into the ground, the print in it seen from a little above
      ctx.fillStyle = lit ? '#ffc078' : '#b8906a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(cx, cy, 17, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = lit ? '#ffd8a0' : '#cca480'; ctx.beginPath(); ctx.ellipse(cx, cy - 1.5, 14, 4.5, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(cx, cy - 1); ctx.scale(1.15, 0.5);
      BA.print(ctx, 0, 0, kind, toes || 0, 1.15, lit ? '#f06a2a' : PETROL);
      ctx.restore();
      if (this.glow[i]) { ctx.strokeStyle = `rgba(255,216,138,${this.glow[i]})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, 16 + (0.6 - this.glow[i]) * 20, 6, 0, 0, TAU); ctx.stroke(); }
    });
    // the plinth: a stone pedestal with a card showing the next foot (or, backwards, the toes)
    if (this.plinth) {
      const [px, py] = this.plinth, x = px * TS + TS / 2, y = py * TS;
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#b8743a'; rr(ctx, x - 10, y - 26, 20, 26, 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e0a060'; ctx.fillRect(x - 12, y - 30, 24, 6); ctx.strokeRect(x - 12, y - 30, 24, 6);
      const bob = Math.sin(t * 3) * 1.5, shake = this.failT > 0 ? Math.sin(t * 50) * 2 : 0;
      ctx.fillStyle = '#fbf4e0'; rr(ctx, x - 20 + shake, y - 74 + bob, 40, 42, 4); ctx.fill(); ctx.stroke();
      if (this.done) { ctx.fillStyle = '#3a8a4a'; ctx.font = '14px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('✓', x + shake, y - 47 + bob); }
      else if (this.mode === 'toes') { BA.print(ctx, x - 6 + shake, y - 54 + bob, 4, -1, 0.9, PETROL); ctx.fillStyle = PERS; ctx.font = '7px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('TOES?', x + shake, y - 37 + bob); }
      else { const q = this.prints[this.order[this.next]]; BA.print(ctx, x + shake, y - 55 + bob, q[2], 0, 1.35, PETROL); ctx.fillStyle = INK; ctx.font = '6px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('NEXT FOOT', x + shake, y - 37 + bob); }
    }
    ctx.restore();
  }
}
ENTITY_TYPES.boneTrack = BoneTrack;
let toggleN = {};
// the piece: absolute tiles in o (the letter only says where the controller lives); the checker: toggle group o.gs[k]
// for each raise, its switch on the print that finishes it
Tour.pieces['bone.track'] = function (st, o) {
  const B = st.B;
  B.spawn('boneTrack', st.x, st.gy - 1, o);
  (o.raise || []).forEach(([n, R], k) => {
    const g = o.gs[k]; B.toggle(g, [], R.map(r => r.slice(0, 4)), { kind: 'boneTrack' });
    for (const r of R) for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) B.set(x, y, T.EMPTY);
    const q = o.prints[o.order[n - 1]]; B.switchAt(g, q[0], q[1] - 1);
  });
  return st.x;
};

/* ======================= 37-2 ASSEMBLY: the vertebra on its socket ======================= */
// { socket: [x, y] (the crank's floor tile: stand there and THROW), pivot: [x, y] (the vertebra's tile), ribs: [[len,
// off]] (tiles long; off: notches from the first rib), notch (start), good (the notch that bridges), g }
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
class BoneVert extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s;
    this.notch = s.notch || 0; this.ang = this.notch; this.from = this.notch; this.turnT = 0; this.set = [];
    const [px, py] = s.pivot, L = Math.max(...s.ribs.map(r => r[0]));
    this.x = (Math.min(px - L, s.socket[0]) - 1) * TS; this.y = (py - L - 1) * TS; this.w = (Math.max(px + L, s.socket[0]) - Math.min(px - L, s.socket[0]) + 3) * TS; this.h = (2 * L + 3) * TS;
    this.placed = false;
  }
  boneClaim(p) { return standsOn(p, this.s.socket[0], this.s.socket[1], 0.9); }
  ribTiles(n) {
    const out = [], [px, py] = this.s.pivot;
    for (const [len, off] of this.s.ribs) { const [dx, dy] = DIRS[(n + off) % 4]; if (dy) continue; for (let k = 1; k <= len; k++) out.push([px + dx * k, py]); }
    return out;
  }
  settle() {
    const g = this.g;
    for (const [x, y] of this.set) g.setTile(x, y, T.EMPTY);
    this.set = [];
    for (const [x, y] of this.ribTiles(this.notch)) if (tileAt(g.area, x, y) === T.EMPTY) { g.setTile(x, y, T.SEMI); this.set.push([x, y]); }
  }
  update(dt) {
    this.t += dt; const g = this.g;
    if (!this.placed) { this.placed = true; this.settle(); }
    if (this.turnT > 0) { this.turnT = Math.max(0, this.turnT - dt); const k = 1 - this.turnT / 0.3; this.ang = this.from + k; if (this.turnT === 0) { this.ang = this.notch; this.settle(); if (this.notch === this.s.good) { g.parts.text(this.s.pivot[0] * TS + 16, this.s.pivot[1] * TS - 20, 'CLICK! A BRIDGE', '#ffd88a'); TourKit.sfx('click', 'select', { vol: 0.6, pitch: 0.8 }); } } }
    const I = g.boneIn;
    if (I && I.by === this && I.pressed && this.turnT === 0) {
      this.from = this.notch; this.notch = (this.notch + 1) % 4; this.turnT = 0.3;
      for (const [x, y] of this.set) g.setTile(x, y, T.EMPTY); this.set = [];
      TourKit.sfx('crank', 'select', { vol: 0.5, pitch: 1.4 }); this.used = true;
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const s = this.s, [sx, sy] = s.socket, [px, py] = s.pivot, cx = px * TS + TS / 2, cy = py * TS + TS / 2;
    ctx.save();
    // the crank on its post (the mark): a bone lever with a persimmon knob, turned with the vertebra
    const kx = sx * TS + 4, ky = sy * TS;
    ctx.fillStyle = 'rgba(240,106,42,0.5)'; ctx.beginPath(); ctx.ellipse(sx * TS + TS / 2, ky + 2, 15, 4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#8a5a2a'; ctx.fillRect(kx - 3, ky - 30, 6, 30); ctx.strokeRect(kx - 3, ky - 30, 6, 30);
    const a = this.ang * Math.PI / 2;
    BA.bone(ctx, kx, ky - 30, kx + Math.cos(a - Math.PI / 2) * 16, ky - 30 + Math.sin(a - Math.PI / 2) * 16, 6, false);
    BA.joint(ctx, kx, ky - 30, 5);
    // notch marks on the crank's dial: the current one lit
    for (let n = 0; n < 4; n++) { const aa = n * Math.PI / 2 - Math.PI / 2; ctx.fillStyle = n === this.notch ? PERS : '#5a3a1a'; ctx.beginPath(); ctx.arc(kx + Math.cos(aa) * 10, ky - 30 + Math.sin(aa) * 10, 2, 0, TAU); ctx.fill(); }
    // a dotted line from crank to vertebra (they turn together)
    ctx.strokeStyle = 'rgba(255,240,200,0.45)'; ctx.setLineDash([3, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(kx, ky - 30); ctx.lineTo(cx, cy); ctx.stroke(); ctx.setLineDash([]);
    // the ribs (long bones with persimmon caps), then the vertebra itself
    for (const [len, off] of s.ribs) {
      const aa = (this.ang + off) * Math.PI / 2 - Math.PI / 2, ex = cx + Math.cos(aa) * (len * TS + 12), ey = cy + Math.sin(aa) * (len * TS + 12);
      // lying flat: its top is the walkable edge of the bridge row
      const lift = Math.abs(Math.sin(aa)) < 0.05 ? -8 : 0;
      BA.bone(ctx, cx, cy + lift, ex, ey + lift, 14, true);
    }
    ctx.fillStyle = BONE; ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    ctx.beginPath(); for (let k = 0; k < 6; k++) { const aa = this.ang * Math.PI / 2 + k * TAU / 6; ctx.lineTo(cx + Math.cos(aa) * 20, cy + Math.sin(aa) * 20); ctx.lineTo(cx + Math.cos(aa + 0.5) * 13, cy + Math.sin(aa + 0.5) * 13); } ctx.closePath(); ctx.fill(); ctx.stroke();
    BA.joint(ctx, cx, cy, 8);
    throwHint(this, ctx, kx, ky - 86, 'THROW: TURN');
    ctx.restore();
  }
}
ENTITY_TYPES.boneVert = BoneVert;
Tour.pieces['bone.vert'] = function (st, o) {
  const B = st.B; B.spawn('boneVert', st.x, st.gy - 1, o);
  const [px, py] = o.pivot, R = [];
  for (const [len, off] of o.ribs) { const [dx, dy] = DIRS[(o.good + off) % 4]; if (dy) continue; for (let k = 1; k <= len; k++) { const x = px + dx * k; if (B.get(x, py) === T.EMPTY) R.push([x, py, x, py, T.SEMI]); } }
  B.toggle(o.g, [], R, { kind: 'boneVert' }); B.switchAt(o.g, o.socket[0], o.socket[1] - 1);
  return st.x;
};

/* ---------------- the replica-rib rungs (climbing) ---------------- */
// { x0, y0, x1, y1 (tiles), collars: [[x, y]] }: the near face's rungs every other row; the far face drawn behind,
// darker and hatched. The checker: ghost rungs every other row.
class BoneRibs extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s; this.x = s.x0 * TS; this.y = s.y0 * TS; this.w = (s.x1 - s.x0 + 1) * TS; this.h = (s.y1 - s.y0 + 1) * TS; this.collars = s.collars || []; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  rungs(ctx, far) {
    const s = this.s, x0 = this.x, x1 = this.x + this.w, o = far ? -7 : 0;
    ctx.save(); ctx.lineCap = 'round';
    for (let y = s.y0 + 1; y <= s.y1; y += 2) {
      const yy = y * TS + 6 + o;
      ctx.strokeStyle = far ? '#5a3a22' : INK; ctx.lineWidth = far ? 9 : 11; ctx.beginPath(); ctx.moveTo(x0 + 6 + o, yy + 4); ctx.quadraticCurveTo((x0 + x1) / 2 + o, yy - 6, x1 - 6 + o, yy + 4); ctx.stroke();
      ctx.strokeStyle = far ? '#a8906a' : BONE; ctx.lineWidth = far ? 5 : 7; ctx.stroke();
    }
    for (const xx of [x0 + 6, x1 - 6]) {
      ctx.strokeStyle = far ? '#5a3a22' : INK; ctx.lineWidth = far ? 9 : 11; ctx.beginPath(); ctx.moveTo(xx + o, this.y + 4 + o); ctx.lineTo(xx + o, this.y + this.h - 2 + o); ctx.stroke();
      ctx.strokeStyle = far ? '#a8906a' : BONE; ctx.lineWidth = far ? 5 : 7; ctx.stroke();
      for (let y = s.y0 + 1; y <= s.y1; y += 2) { ctx.fillStyle = far ? '#a85a32' : PERS; ctx.strokeStyle = far ? '#5a3a22' : INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(xx + o, y * TS + 8 + o, far ? 5 : 6.5, 0, TAU); ctx.fill(); ctx.stroke(); }
    }
    if (far) { ctx.strokeStyle = 'rgba(60,36,20,0.35)'; ctx.lineWidth = 1.5; for (let x = x0; x < x1; x += 10) { ctx.beginPath(); ctx.moveTo(x, this.y + 4); ctx.lineTo(x - 8, this.y + this.h); ctx.stroke(); } }
    ctx.restore();
  }
  drawCollars(ctx) {
    for (const [x, y] of this.collars) {
      const cx = x * TS + TS / 2, cy = y * TS + TS / 2, k = 0.5 + 0.5 * Math.sin(this.t * 4);
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.fillStyle = 'rgba(40,20,10,0.55)'; ctx.beginPath(); ctx.ellipse(cx, cy, 15, 11, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = PERS; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(cx, cy, 18, 14, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(255,220,150,${0.4 + 0.4 * k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, 21 + k * 3, 17 + k * 2, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
  }
  draw(ctx) { this.rungs(ctx, true); this.drawCollars(ctx); this.rungs(ctx, false); }
}
ENTITY_TYPES.boneRibs = BoneRibs;
Tour.pieces['bone.ribs'] = function (st, o) {
  const B = st.B;
  B.spawn('boneRibs', st.x, st.gy - 1, o);
  B.zone(o.x0, o.y0, o.x1 - o.x0 + 1, o.y1 - o.y0 + 1, 0, 0, 0, 'boneClimb', { collars: o.collars || [] });
  for (let y = o.y0 + 1; y <= o.y1; y += 2) for (let x = o.x0; x <= o.x1; x++) B.ghosts.push([x, y]);
  return st.x;
};
// the climb itself (the game only): Brady grips when he pushes UP inside a rib zone
const CLIMB = 3.8 * TS;
const climbZone = (A, p) => (A.zones || []).find(z => z.kind === 'boneClimb' && p.cx >= z.x && p.cx <= z.x + z.w && p.cy >= z.y && p.cy <= z.y + z.h);
{
  const pu = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g, A = g && g.area;
    if (!(A && A.bone && A.bone.ribs) || this.state !== 'play' || this.dead || !inp) { if (this.boneGrip) this.boneGrip = null; return pu.call(this, dt, inp); }
    const z = climbZone(A, this);
    if (!this.boneGrip && z && inp.up && !(this.boneLetGo > 0)) { this.boneGrip = z; this.boneFace = 0; this.vx = 0; this.vy = 0; this.jumping = false; TourKit.sfx('grip', 'select', { vol: 0.3, pitch: 1.8 }); }
    if (this.boneLetGo > 0) this.boneLetGo -= dt;
    if (!this.boneGrip) return pu.call(this, dt, inp);
    // climbing: the stick steers all four ways; a collar swaps faces; JUMP elsewhere lets go with a full jump
    this.inp = inp;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.faceT > 0) { this.faceT -= dt; if (this.faceT <= 0) this.boneFace = 1 - this.boneFace; }
    const Z = this.boneGrip;
    if (inp.jumpPressed && !(this.faceT > 0)) {
      const col = (Z.collars || []).find(([x, y]) => Math.abs(this.cx - (x * TS + TS / 2)) < TS * 1.0 && Math.abs(this.cy - (y * TS + TS / 2)) < TS * 1.5);
      if (col) { this.faceT = 0.3; this.x = col[0] * TS + TS / 2 - this.w / 2; TourKit.sfx('swish', 'jump', { vol: 0.4, pitch: 0.7 }); g.burst(this.cx, this.cy, 6, '#ffd88a', 'spark'); }
      else { this.boneGrip = null; this.boneFace = 0; this.boneLetGo = 0.25; this.vy = -PHYS.jumpV; this.jumping = true; this.onGround = false; Sound.play('jump', { vol: 0.5 }); return pu.call(this, dt, Object.assign({}, inp, { jumpPressed: false })); }
    }
    const dx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), dy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    if (dx) this.facing = dx;
    const sp = this.faceT > 0 ? 0 : CLIMB;
    this.vx = dx * sp; this.vy = dy * sp;
    moveBody(this, A, dt, { semis: false });
    this.onGround = false;
    // off the edge of the cage: let go (out of the top with a little hop so he lands on what is up there)
    if (!climbZone(A, this)) {
      const top = this.cy < Z.y + 4; this.boneGrip = null; this.boneFace = 0; this.boneLetGo = 0.3;
      if (top) { this.vy = -7 * TS; this.jumping = true; }
    }
    this.anim.t += dt; this.anim.state = 'hang'; this.updateHair(dt);
  };
  // on the far face Brady is behind the near rungs: dimmer, and the near face is redrawn over him
  const dr0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx, t) {
    if (this.boneGrip && this.boneFace === 1) { ctx.save(); ctx.globalAlpha *= 0.62; const r = dr0.call(this, ctx, t); ctx.restore(); return r; }
    return dr0.call(this, ctx, t);
  };
  TourHooks.on('afterEntities', (play, ctx) => {
    const p = play.player; if (!p || !p.boneGrip || p.boneFace !== 1) return;
    for (const e of play.entities) if (e instanceof BoneRibs && overlap(p, e)) { ctx.save(); ctx.beginPath(); ctx.rect(p.x - 20, p.y - 20, p.w + 40, p.h + 40); ctx.clip(); e.rungs(ctx, false); ctx.restore(); }
  });
  // a hit while climbing: he lets go
  const hu0 = Player.prototype.hurt;
  Player.prototype.hurt = function (src) { const inv0 = this.invuln || 0, r = hu0.apply(this, arguments); if (this.boneGrip && inv0 <= 0 && (this.invuln > 0 || this.dead)) { this.boneGrip = null; this.boneFace = 0; this.boneLetGo = 0.6; } return r; };
}
// a critter that climbs the rungs, up and down one column, on one face (it only meets Brady on its own face)
const climberArt = (ctx, e, x, y, far, t) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(e.vy > 0 ? Math.PI : 0); if (far) ctx.globalAlpha = 0.7;
  ctx.strokeStyle = far ? '#3a2412' : INK; ctx.lineWidth = 1.7; ctx.fillStyle = far ? '#2a5a4a' : '#3e8a6a';
  const st = Math.sin(t * 12) * 3;
  for (const [lx, ly] of [[-7, -4], [7, -4], [-7, 6], [7, 6]]) { ctx.beginPath(); ctx.moveTo(lx * 0.5, ly); ctx.lineTo(lx, ly + (lx * ly > 0 ? st : -st)); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, 8); ctx.quadraticCurveTo(-4 + Math.sin(t * 5) * 3, 18, 0, 22); ctx.lineTo(2, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, 6, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, -11, 5, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = BONE; for (const [sx, sy] of [[-2, -3], [2, 2], [-1, 5]]) { ctx.beginPath(); ctx.arc(sx, sy, 1.3, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-2.5, -13, 2, 0, TAU); ctx.arc(2.5, -13, 2, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-2.5, -13.5, 1, 0, TAU); ctx.arc(2.5, -13.5, 1, 0, TAU); ctx.fill();
  ctx.restore();
};
class BoneClimber extends Ent {
  constructor(g, s) {
    super(g, s, 20, 28); this.enemy = true; this.customCollide = true; this.face = s.face || 0;
    this.y0 = s.y0 * TS; this.y1 = s.y1 * TS; this.x = s.x - this.w / 2; this.y = this.y0; this.vy = (s.speed || 1.6) * TS; this.wait = 0; this.ph = s.phase || 0; this.y += ((this.y1 - this.y0) * this.ph) | 0;
    this.back = this.face === 1;
  }
  update(dt) {
    this.t += dt; if (this.dead) { this.flatT -= dt; if (this.flatT <= 0) this.remove = true; return; }
    if (this.wait > 0) { this.wait -= dt; return; }
    this.y += this.vy * dt;
    if (this.y < this.y0) { this.y = this.y0; this.vy = Math.abs(this.vy); this.wait = 0.6; }
    if (this.y > this.y1) { this.y = this.y1; this.vy = -Math.abs(this.vy); this.wait = 0.6; }
  }
  collidePlayer(p) { const pf = p.boneGrip ? p.boneFace : 0; return !this.dead && pf === this.face && !(p.faceT > 0) ? 'body' : null; }
  hit(kind, src) {
    if (this.dead) return false;
    if (kind === 'stomp' || kind === 'spin' || kind === 'star' || kind === 'disc' || kind === 'laser') { this.dead = true; this.flatT = 0.5; Sound.play('stomp'); this.g.burst(this.cx, this.cy, 8, '#3e8a6a', 'dust'); return true; }
    return false;
  }
  touchPlayer(p) { if (!this.dead) p.hurt(this); }
  draw(ctx) { if (this.dead) { ctx.save(); ctx.globalAlpha = Math.max(0, this.flatT * 2); climberArt(ctx, this, this.cx, this.cy, this.face === 1, this.t); ctx.restore(); return; } climberArt(ctx, this, this.cx, this.cy, this.face === 1, this.t); }
}
ENTITY_TYPES.boneClimber = BoneClimber;
Tour.pieces['bone.climber'] = function (st, o) { st.B.spawn('boneClimber', o.x != null ? o.x : st.x, 0, { y0: o.y0, y1: o.y1, face: o.face || 0, speed: o.speed, phase: o.phase || 0 }); return st.x; };

/* ======================= 37-3 MOULD: the clay press ======================= */
// { tray: [x0, x1, y] (clay tiles, floor row y), need: 'low' | 'tall', casts: { low: rect, tall: rect } (where the
// cast lands; only `need` fits), g, phase }
class BonePress extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.s = s;
    const [x0, x1, y] = s.tray; this.x = (x0 - 1) * TS; this.y = (y - 9) * TS; this.w = (x1 - x0 + 3) * TS; this.h = 10 * TS;
    const all = [[x0, y], [x1, y]]; for (const k in s.casts) { const r = s.casts[k]; all.push([r[0], r[1]], [r[2], r[3]]); }
    const b = bbox(all); this.x = (b[0] - 1) * TS; this.w = (b[2] - b[0] + 3) * TS; this.y = Math.min(this.y, (b[1] - 2) * TS); this.h = (b[3] + 2) * TS - this.y;
    this.st = 'idle'; this.at = (s.phase || 0); this.done = false; this.cast = null; this.castK = 0; this.bad = null; this.badT = 0;
  }
  // the press's bottom edge, rows above the tray floor: up 5 rows, down to just over Brady's head as he stands / crouches
  update(dt) {
    this.t += dt; this.at += dt; const g = this.g, p = g.player, [x0, x1, y] = this.s.tray;
    const inTray = p && !p.dead && p.onGround && p.groundTy === y && p.cx >= x0 * TS && p.cx <= (x1 + 1) * TS;
    if (this.st === 'idle' && this.at > 1.8) { this.st = 'tell'; this.at = 0; if (g.onScreen(this, 60)) TourKit.sfx('creak', 'select', { vol: 0.35, pitch: 0.5 }); }
    else if (this.st === 'tell' && this.at > 0.9) { this.st = 'down'; this.at = 0; }
    else if (this.st === 'down' && this.at > 0.22) {
      this.st = 'hold'; this.at = 0; g.shake(3); Sound.play('stomp', { pitch: 0.4, vol: 0.6 }); g.burst((x0 + x1 + 1) * TS / 2, y * TS, 10, '#c8aa86', 'dust');
      if (inTray && !this.done) {
        const mould = p.crouch ? 'low' : 'tall';
        p.stunT = Math.max(p.stunT || 0, 0.35);
        if (mould === this.s.need) { this.done = true; this.cast = mould; this.castK = 0; setRect(g, this.s.casts[mould], T.HARD, true); g.parts.text(p.cx, p.y - 30, mould === 'low' ? 'LOW AND BROAD: A PERFECT FIT!' : 'TALL: A PERFECT FIT!', '#ffd88a'); TourKit.sfx('chime', 'pick', { vol: 0.6 }); }
        else { this.bad = mould; this.badT = 1.4; g.parts.text(p.cx, p.y - 30, mould === 'low' ? 'TOO FLAT! IT CRUMBLES' : 'TOO TALL! IT JAMS', '#ffb0a0'); TourKit.sfx('fizz', 'bump', { vol: 0.5, pitch: 0.6 }); }
      }
    }
    else if (this.st === 'hold' && this.at > 0.5) { this.st = 'up'; this.at = 0; }
    else if (this.st === 'up' && this.at > 0.6) { this.st = 'idle'; this.at = 0; }
    if (this.cast) this.castK = Math.min(1, this.castK + dt * 2);
    if (this.badT > 0) this.badT -= dt;
  }
  touchPlayer() {}
  pressY() {
    // its resting height: a little over Brady's head; it comes down onto whatever shape is in the tray
    const y = this.s.tray[2] * TS, top = y - 4.4 * TS, p = this.g.player, [x0, x1] = this.s.tray;
    const inTray = p && !p.dead && p.cx >= x0 * TS && p.cx <= (x1 + 1) * TS && p.y + p.h > y - 4;
    const low = inTray ? Math.max(p.y - 2, y - 2.2 * TS) : y - 0.6 * TS;
    if (this.st === 'idle') return top;
    if (this.st === 'tell') return top + Math.sin(this.t * 40) * 2.5 + this.at * 8;
    if (this.st === 'down') return lerp(top + 7, low, this.at / 0.22);
    if (this.st === 'hold') return this.holdY != null ? this.holdY : (this.holdY = low);
    this.holdY = null; return lerp(low, top, this.at / 0.6);
  }
  draw(ctx) {
    const s = this.s, [x0, x1, y] = s.tray, X0 = x0 * TS, X1 = (x1 + 1) * TS, by = this.pressY();
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the tray of wet clay (a mould-shaped dip when a cast was taken)
    ctx.fillStyle = '#8a6a50'; ctx.fillRect(X0 - 4, y * TS - 6, X1 - X0 + 8, 10); ctx.strokeRect(X0 - 4, y * TS - 6, X1 - X0 + 8, 10);
    ctx.fillStyle = '#b89a78'; ctx.fillRect(X0, y * TS - 4, X1 - X0, 5);
    // the gantry and the press block (a plaster slab with a persimmon handle); its shadow grows on the tray
    const gx = (X0 + X1) / 2, gTop = y * TS - 5.6 * TS;
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(X0 - 10, gTop, 8, 5.6 * TS - 6); ctx.strokeRect(X0 - 10, gTop, 8, 5.6 * TS - 6); ctx.fillRect(X1 + 2, gTop, 8, 5.6 * TS - 6); ctx.strokeRect(X1 + 2, gTop, 8, 5.6 * TS - 6);
    ctx.fillRect(X0 - 14, gTop - 8, X1 - X0 + 28, 10); ctx.strokeRect(X0 - 14, gTop - 8, X1 - X0 + 28, 10);
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(gx, gTop + 2); ctx.lineTo(gx, by - 20); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    const tell = this.st === 'tell' || this.st === 'down';
    ctx.fillStyle = `rgba(30,15,5,${tell || this.st === 'hold' ? 0.4 : 0.15})`; ctx.beginPath(); ctx.ellipse(gx, y * TS - 2, (X1 - X0) / 2, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#efe6d2'; rr(ctx, X0 - 2, by - 22, X1 - X0 + 4, 22, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d8ccb0'; ctx.fillRect(X0, by - 7, X1 - X0, 5);
    BA.joint(ctx, gx, by - 24, 6);
    if (tell) { ctx.fillStyle = '#ffd84a'; ctx.font = '12px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('!', gx, by - 36 + Math.sin(this.t * 20) * 2); }
    // where the cast goes: a chalk outline of the shape that fits, then the cast slides into place
    const r = s.casts[s.need], rx = r[0] * TS, ry = r[1] * TS, rw = (r[2] - r[0] + 1) * TS, rh = (r[3] - r[1] + 1) * TS;
    if (!this.cast) { ctx.strokeStyle = 'rgba(255,245,220,0.6)'; ctx.setLineDash([4, 5]); ctx.lineWidth = 2; ctx.strokeRect(rx + 2, ry + 2, rw - 4, rh - 4); ctx.setLineDash([]); ctx.fillStyle = 'rgba(255,245,220,0.7)'; ctx.font = '7px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(s.need === 'low' ? 'LOW & BROAD' : 'TALL', rx + rw / 2, ry + rh / 2 + 3); }
    else {
      const k = this.castK; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = '#efe6d2'; rr(ctx, rx + 1, ry + rh * (1 - k), rw - 2, rh * k, 5); ctx.fill(); ctx.stroke();
      if (k > 0.6) { ctx.fillStyle = '#c8b898'; if (this.cast === 'low') { for (let q = rx + 14; q < rx + rw - 8; q += 28) { ctx.beginPath(); ctx.ellipse(q, ry + rh / 2, 8, 4, 0, 0, TAU); ctx.fill(); } } else { ctx.beginPath(); ctx.ellipse(rx + rw / 2, ry + 14, 6, 6, 0, 0, TAU); ctx.fill(); ctx.fillRect(rx + rw / 2 - 5, ry + 22, 10, rh - 30); } }
    }
    // a cast that doesn't fit: it pops out over the tray and crumbles
    if (this.badT > 0) { const k = this.badT / 1.4, h = this.bad === 'low' ? 18 : 60, w = this.bad === 'low' ? 60 : 24; ctx.globalAlpha = k; ctx.fillStyle = '#efe6d2'; rr(ctx, gx - w / 2 + (1 - k) * 30, y * TS - 8 - h - (1 - k) * 20, w, h, 4); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.restore();
  }
}
ENTITY_TYPES.bonePress = BonePress;
Tour.pieces['bone.press'] = function (st, o) {
  const B = st.B, [x0, x1, y] = o.tray;
  B.spawn('bonePress', st.x, st.gy - 1, o);
  const r = o.casts[o.need]; for (let yy = r[1]; yy <= r[3]; yy++) for (let x = r[0]; x <= r[2]; x++) B.set(x, yy, T.EMPTY);
  // the checker: a toggle group (the cast's tiles) switched in the tray, or (o.g null) a one-way edge from the tray
  // to o.edge, the tile the cast lets Brady reach
  if (o.g != null) { B.toggle(o.g, [], [r.slice(0, 4)], { kind: 'bonePress' }); B.switchAt(o.g, Math.floor((x0 + x1) / 2), y - 1); }
  else if (o.edge) B.edge([Math.floor((x0 + x1) / 2), y - 1], o.edge);
  return st.x;
};
// a soft patch of plaster floor: press DOWN on it (crouch) and it gives way: { x, y (the floor row), w, to: [x, y] the
// tile where Brady lands below (the checker's one-way edge) }
class BoneSoft extends Ent {
  constructor(g, s) { super(g, s, s.w * TS, TS); this.x = s.tx * TS; this.y = s.ty * TS; this.friendly = true; this.k = 0; this.gone = false; this.press = 0; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    if (this.gone) { this.k = Math.min(1, this.k + dt * 2); return; }
    const on = p && !p.dead && p.onGround && p.groundTy === this.s.ty && p.cx > this.x && p.cx < this.x + this.w;
    this.press = on && p.inp && p.inp.down ? this.press + dt : Math.max(0, this.press - dt * 2);
    if (this.press > 0.35) {
      this.gone = true; for (let k = 0; k < this.s.w; k++) g.setTile(this.s.tx + k, this.s.ty, T.EMPTY);
      g.burst(this.cx, this.y + 8, 14, '#efe6d2', 'dust'); Sound.play('stomp', { pitch: 0.7, vol: 0.6 }); g.parts.text(p.cx, p.y - 20, 'IT GIVES WAY!', '#ffd88a');
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, sh = this.press > 0 ? Math.sin(this.t * 50) * 1.5 : 0;
    ctx.save();
    if (this.gone) { ctx.globalAlpha = 1 - this.k; ctx.translate(0, this.k * 60); }
    // the patch looks like the floor around it, with a faint plaster seam
    ctx.strokeStyle = 'rgba(80,40,10,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 4 + sh, y + 3); ctx.lineTo(x + w * 0.4 + sh, y + 7); ctx.lineTo(x + w * 0.6 + sh, y + 4); ctx.lineTo(x + w - 4 + sh, y + 8); ctx.stroke();
    ctx.restore();
  }
}
ENTITY_TYPES.boneSoft = BoneSoft;
Tour.pieces['bone.soft'] = function (st, o) {
  const B = st.B; B.spawn('boneSoft', st.x, st.gy - 1, { tx: o.x, ty: o.y, w: o.w || 2 });
  B.edge([o.x, o.y - 1], o.to);
  return st.x;
};

/* ======================= 37-4 CHISEL: a clean break ======================= */
// { mark: [x, y] (stand here), body: [rects] (the whole replica, hidden solid tiles drawn by the entity), drop: [rects]
// (the half that falls away), seam: [[x, y]...] (pixels, absolute), stop: d (px along the seam to release at), tol (px),
// fork: { d, to: [x, y] } (the drawn fork: where it splits; to = its branch end), joint: [x, y] (a persimmon joint on
// the seam: the twist), g }
class BoneChisel extends Ent {
  constructor(g, s) {
    super(g, s, 4, 4); this.friendly = true; this.back = true; this.s = s;
    const pts = []; for (const r of s.body) pts.push([r[0], r[1]], [r[2], r[3]]); pts.push(s.mark);
    const b = bbox(pts); this.x = (b[0] - 1) * TS; this.y = (b[1] - 2) * TS; this.w = (b[2] - b[0] + 3) * TS; this.h = (b[3] - b[1] + 4) * TS;
    this.seam = s.seam; this.lens = [0]; for (let k = 1; k < this.seam.length; k++) this.lens.push(this.lens[k - 1] + Math.hypot(this.seam[k][0] - this.seam[k - 1][0], this.seam[k][1] - this.seam[k - 1][1]));
    this.L = this.lens[this.lens.length - 1]; this.prog = 0; this.done = false; this.fallK = 0; this.failT = 0; this.wasHeld = false;
  }
  boneClaim(p) { return !this.done && standsOn(p, this.s.mark[0], this.s.mark[1], 0.9); }
  at(d) { d = clamp(d, 0, this.L); let k = 1; while (k < this.lens.length - 1 && this.lens[k] < d) k++; const a = this.seam[k - 1], b = this.seam[k], q = (d - this.lens[k - 1]) / Math.max(1, this.lens[k] - this.lens[k - 1]); return [lerp(a[0], b[0], q), lerp(a[1], b[1], q)]; }
  update(dt) {
    this.t += dt; const g = this.g, I = g.boneIn, s = this.s;
    if (this.done) { this.fallK = Math.min(1, this.fallK + dt * 1.2); return; }
    if (this.failT > 0) { this.failT -= dt; if (this.failT <= 0) this.prog = 0; this.wasHeld = false; return; }
    const held = !!(I && I.by === this && I.held);
    if (held) {
      if (!this.wasHeld) TourKit.sfx('scrape', 'select', { vol: 0.3, pitch: 0.6 });
      this.prog += (s.speed || 2.4) * TS * dt;
      if (Math.random() < 0.4) { const [x, y] = this.at(this.prog); g.burst(x, y, 1, '#f4ead2', 'dust'); }
      if (this.prog >= this.L) { this.fail('TOO FAR! START AGAIN'); }
    } else if (this.wasHeld) {
      if (Math.abs(this.prog - s.stop) <= (s.tol || 0.75 * TS)) this.split();
      else this.fail(this.prog < s.stop ? 'CRUNCH! NOT THERE YET' : (s.joint ? 'CRUNCH! THAT TOOK THE ANKLE' : 'CRUNCH! PAST THE FORK'));
    }
    this.wasHeld = held;
  }
  fail(text) { const g = this.g, p = g.player; this.failT = 0.7; TourKit.sfx('fizz', 'bump', { vol: 0.5, pitch: 0.5 }); g.shake(2); if (p) g.parts.text(p.cx, p.y - 24, text, '#ffb0a0'); }
  split() {
    const g = this.g, p = g.player; this.done = true;
    for (const r of this.s.drop) setRect(g, r, T.EMPTY);
    g.shake(5); Sound.play('stomp', { pitch: 0.6 }); TourKit.sfx('crack', 'bump', { vol: 0.7, pitch: 0.8 });
    if (p) g.parts.text(p.cx, p.y - 26, 'A CLEAN BREAK!', '#ffd88a');
    for (const r of this.s.drop) g.burst((r[0] + r[2] + 1) * TS / 2, (r[1] + r[3] + 1) * TS / 2, 12, '#f4ead2', 'dust');
  }
  touchPlayer() {}
  inDrop(x, y) { return this.s.drop.some(r => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]); }
  draw(ctx) {
    const s = this.s, t = this.t;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    // the replica: its kept part, and the dropped half (shaking loose, then tumbling away)
    const paint = (r, off, rot) => {
      const x = r[0] * TS, y = r[1] * TS, w = (r[2] - r[0] + 1) * TS, h = (r[3] - r[1] + 1) * TS;
      ctx.save(); ctx.translate(x + w / 2 + off[0], y + h / 2 + off[1]); ctx.rotate(rot);
      ctx.fillStyle = BONE; rr(ctx, -w / 2, -h / 2, w, h, 9); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8dcc0'; ctx.fillRect(-w / 2 + 4, h / 2 - 9, w - 8, 5);
      ctx.fillStyle = '#d8c8a4'; for (let q = -w / 2 + 10; q < w / 2 - 6; q += 22) { ctx.beginPath(); ctx.arc(q, -h / 2 + 10 + (q % 3), 2.4, 0, TAU); ctx.fill(); }
      ctx.restore();
    };
    for (const r of s.body) { if (this.inDrop(r[0], r[1])) continue; paint(r, [0, 0], 0); }
    if (this.fallK < 1) for (const r of s.drop) { const k = this.fallK; paint(r, [k * 40, k * k * 260], k * 1.2); }
    // the seam: a dark dashed crack along the replica, its fork, and the persimmon joint (37-4's twist)
    if (!this.done) {
      ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]); ctx.beginPath(); this.seam.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
      if (s.fork) { const [fx, fy] = this.at(s.fork.d); ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(s.fork.to[0], s.fork.to[1]); ctx.stroke(); }
      ctx.setLineDash([]);
      if (s.end) { const [ex, ey] = this.at(s.stop); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ex - 5, ey - 6); ctx.lineTo(ex + 5, ey + 6); ctx.stroke(); }
      if (s.joint) BA.joint(ctx, s.joint[0], s.joint[1], 9);
      // the carved part behind the chisel, and the chisel itself
      if (this.prog > 0) {
        ctx.strokeStyle = '#2a1408'; ctx.lineWidth = 4; ctx.beginPath(); let d = 0; ctx.moveTo(this.seam[0][0], this.seam[0][1]); for (d = 6; d < this.prog; d += 6) { const [x, y] = this.at(d); ctx.lineTo(x, y); } const [cx, cy] = this.at(this.prog); ctx.lineTo(cx, cy); ctx.stroke();
        const sh = this.failT > 0 ? Math.sin(t * 60) * 3 : 0;
        ctx.save(); ctx.translate(cx + sh, cy); ctx.rotate(-0.7); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillStyle = '#c8ccd4'; ctx.fillRect(-2.5, -18, 5, 14); ctx.strokeRect(-2.5, -18, 5, 14); ctx.fillStyle = PERS; rr(ctx, -4, -34, 8, 17, 3); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    }
    // the mark where Brady stands to chisel
    const mx = s.mark[0] * TS + TS / 2, my = s.mark[1] * TS;
    if (!this.done) { ctx.fillStyle = 'rgba(240,106,42,0.5)'; ctx.beginPath(); ctx.ellipse(mx, my + 2, 14, 4, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = PERS; ctx.lineWidth = 2; ctx.stroke(); }
    throwHint(this, ctx, mx, my - 70, 'HOLD THROW, LET GO AT THE MARK');
    ctx.restore();
  }
}
ENTITY_TYPES.boneChisel = BoneChisel;
Tour.pieces['bone.chisel'] = function (st, o) {
  const B = st.B;
  B.spawn('boneChisel', st.x, st.gy - 1, o);
  for (const r of o.body) for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) { B.set(x, y, T.HARD); B.setHide(x, y, 1); }
  B.toggle(o.g, o.drop.map(r => r.slice(0, 4)), [], { kind: 'boneChisel' }); B.switchAt(o.g, o.mark[0], o.mark[1] - 1);
  return st.x;
};

Object.assign(TourLandscape.ARCH_LABEL, { trackway: 'TRACKWAY', vertebra: 'ASSEMBLY', mould: 'MOULD', chisel: 'CHISEL' });
Object.assign(Tour.boneKit, { standsOn, setRect, throwHint, BoneTrack, BoneVert, BoneRibs, BonePress, BoneChisel, BoneClimber });
// for the shots tool: the game's own physics on a copy of Brady's body
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.TourMap = TourMap; } } catch (e) { /* not in a browser */ }
try { if (typeof window !== 'undefined') window.BRADY_BONE = { phys: (b, inp, A, dt, pl, o) => playerPhysicsFlip(b, inp, A, dt, pl, o), spikeContact: (b, A) => spikeContact(b, A), lavaContact: (b, A) => lavaContact(b, A), kit: Tour.boneKit }; } catch (e) { /* not in a browser */ }
})();
