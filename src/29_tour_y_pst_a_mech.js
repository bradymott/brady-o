/* ============================================================
   PUPO STANDARD TIME: the land's mechanics (one per stage), each told to the level checker with its own
   primitives, and each played for real by tools/sbw_pst_shots.js.
   - DELAY (32-1 Hold That Thought): a dream cushion eats Brady's jump (surface PST_CUSH: the game's physics and the
     checker's both refuse a jump off it). Instead JUMP plants a thought bubble over his head; one full breath later
     (1.4 s) it stretches upward once (the tell) and pops, and the lift throws Brady about six tiles straight up from
     wherever he is standing then. The checker: B.edge from every cushion cell to each spot a lift reaches.
   - BLINK (32-2 The Long Blink): Pupo's eyes blink on a slow clock (two rhythms, toggle groups 0 and 1, auto). While an
     eye is shut its long inner lashes interlock into rungs and its lids meet into a bridge; a 0.8 s tremble before it
     opens. The short outer lashes are always there.
   - YAWN (32-3 Half a Yawn): a yawning mouth on a cushion; stand on a corner to stretch it that way; at the next yawn
     (an inhale tell) a feather floats out and settles as a foothold on that side. A stuck feather (the last mouth)
     only comes loose after the opposite cheek is stretched first. Toggle group per mouth (switches at both corners).
   - BORROW (32-4 Borrow a Second): hold THROW beside an hourglass flower to bank one second (one at a time); tap THROW
     on a moving thing to spend it there: a moving platform, a snapping cushion jaw or a folding ruler's near elbow
     holds still for a while. A held elbow lets the ruler's far end finish: a bridge (toggle group, switch at the
     elbow's mark, a flower beside it).
   - THOUGHT (32-5 One Thought at a Time): bump a picture bubble from below and its subject (a tub, a towel, a step
     stool, a ladder) occupies the next room until another bubble is bumped. Toggle group per subject.
   ============================================================ */
(function () {
const PSAY = (...a) => Tour.pstKit.say(...a);
const K = Tour.pstKit; if (!K) return;
const { PstArt, INK, HONEY, HONEY_HI, HONEY_LO, PLUM, PLUM_HI, PLUM_LO, MINT, MINT_HI, MINT_LO, CREAM, CREAM_LO } = K;
const PST_CUSH = SURF.PST_CUSH = 9;
const LIFT_T = 1.4, STRETCH_T = 0.9, LIFT_V = 36 * TS;   // a breath, its tell, a lift of about six tiles
const FREEZE_T = 3.2, BANK_T = 0.6;

/* ======================= DELAY: the dream cushion ======================= */
// the cushion under a body's middle (a standing body only; never upside down)
const onCushion = (p, A) => {
  if (!p || !p.onGround || p.flipped || !A || !A.surf) return false;
  const y = Math.floor((p.y + p.h + 1) / TS), x = Math.floor((p.x + p.w / 2) / TS);
  return surfAt(A, x, y) === PST_CUSH;
};
// the one physics wrapper: a cushion eats a jump (the game's body and the checker's sims alike)
{
  const ppf0 = playerPhysicsFlip;
  playerPhysicsFlip = function (p, inp, area, dt, platforms, opts) {
    if (inp && area && area.surf && (inp.jumpPressed || p.jumpBuf > 0) && onCushion(p, area)) {
      p.jumpBuf = 0;
      return ppf0(p, Object.assign({}, inp, { jumpPressed: false }), area, dt, platforms, opts);
    }
    return ppf0(p, inp, area, dt, platforms, opts);
  };
}
// the thought bubble: rises over Brady's head and follows him; stretches up once; pops; lifts him if he stands
class PstThought extends Ent {
  constructor(g, p) { super(g, { x: p.cx, y: p.y - 10 }, 30, 24); this.friendly = true; this.t = 0; this.k = 0; this.popped = false; }
  update(dt) {
    const g = this.g, p = g.player;
    this.t += dt;
    if (!this.area0) this.area0 = g.area;
    if (!p || p.dead || p.state !== 'play' || g.area !== this.area0) { this.remove = true; if (p) p.pstThought = null; return; }
    this.x = approach(this.x, p.cx - this.w / 2, 14 * TS * dt); this.y = p.y - 46 - Math.min(1, this.t / 0.4) * 14;
    if (this.t >= LIFT_T && !this.popped) {
      this.popped = true; this.remove = true; p.pstThought = null;
      g.burst(this.cx, this.cy - 10, 14, CREAM, 'confetti');
      if (p.onGround) {
        p.vy = -LIFT_V; p.onGround = false; p.jumping = false; p.coyote = 0; p.jumpBuf = 0; p.ride = null; p.pstLifted = 0.6;
        Sound.play('spring', { vol: 0.6, pitch: 0.8 }); PSAY(g, p.cx, p.y - 14, 'HUP!', '#fff4dc');
      } else PSAY(g, this.cx, this.cy, '...WHERE WAS I?', '#fff4dc');
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const p = this.g.player; if (!p) return;
    const t = this.t, grow = Math.min(1, t / 0.45);
    // the tell: it stretches upward once (tall and thin), then pops
    const st = t > STRETCH_T ? Math.sin(clamp((t - STRETCH_T) / (LIFT_T - STRETCH_T), 0, 1) * Math.PI * 0.5) : 0;
    const w = (22 + grow * 22) * (1 - st * 0.25), h = (14 + grow * 12) * (1 + st * 1.1);
    const x = this.cx - w / 2, y = this.y + 20 - h;
    PstArt.tail(ctx, p.cx + 4, p.y - 6, x + w * 0.35, y + h + 4, 3, 4);
    PstArt.bubble(ctx, x, y, w, h);
    // what Pupo is thinking: an up arrow (where the thought will take Brady)
    ctx.save(); ctx.strokeStyle = PLUM; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(this.cx, y + h * 0.75); ctx.lineTo(this.cx, y + h * 0.25); ctx.moveTo(this.cx - 5, y + h * 0.42); ctx.lineTo(this.cx, y + h * 0.25); ctx.lineTo(this.cx + 5, y + h * 0.42); ctx.stroke(); ctx.restore();
    // the breath: a little ring of dots that fills up
    ctx.save(); const n = 6, q = Math.min(1, t / LIFT_T); for (let k = 0; k < n; k++) { ctx.fillStyle = k / n < q ? HONEY : 'rgba(42,20,38,0.25)'; ctx.beginPath(); ctx.arc(this.cx + Math.cos(k / n * TAU - Math.PI / 2) * (w * 0.5 + 6), y + h / 2 + Math.sin(k / n * TAU - Math.PI / 2) * (h * 0.5 + 6), 2, 0, TAU); ctx.fill(); } ctx.restore();
  }
}
ENTITY_TYPES.pstThought = PstThought;
// the cushion itself: a fat honey cushion over the floor tiles (it sinks where Brady stands)
class PstCushionPad extends Ent {
  constructor(g, s) { super(g, s, (s.n || 3) * TS, 10); this.x = s.x - TS / 2; this.y = s.y; this.n = s.n || 3; this.back = false; this.friendly = true; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    const p = this.g.player, x0 = this.x, y0 = this.y, w = this.n * TS;
    const on = p && p.onGround && p.cx > x0 && p.cx < x0 + w && Math.abs(p.y + p.h - y0) < 6;
    const sink = on ? 5 : 0, pulse = Math.sin(this.t * 1.6) * 1.2;
    ctx.save();
    PstArt.cushion(ctx, x0 + 1, y0 - 12 + sink * 0.6 + pulse, w - 2, 16 - sink * 0.6, HONEY, HONEY_LO, HONEY_HI);
    ctx.fillStyle = CREAM; for (let x = x0 + 6; x < x0 + w - 4; x += 10) { ctx.beginPath(); ctx.arc(x, y0 + 4, 2.4, 0, TAU); ctx.fill(); }
    // a tiny thought rises from it now and then (the cushion that thinks for you)
    const q = (this.t * 0.35 + x0 * 0.01) % 1; ctx.globalAlpha = 0.6 * (1 - q); ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(x0 + w * 0.7, y0 - 16 - q * 28, 2 + q * 3, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
ENTITY_TYPES.pstCushionPad = PstCushionPad;
// JUMP on a cushion plants the thought (one at a time); the physics wrapper eats the jump itself
{
  const pu0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g;
    if (this.pstLifted > 0) this.pstLifted -= dt;
    if (inp && inp.jumpPressed && this.state === 'play' && !this.dead && g && g.area && g.area.surf && !this.pstThought && onCushion(this, g.area)) {
      const e = new PstThought(g, this); e.area0 = g.area; this.pstThought = e; g.spawn(e);
      Sound.play('select', { vol: 0.5, pitch: 0.7 }); g.burst(this.cx, this.y + this.h, 5, CREAM, 'dust');
    }
    // the borrowed second: bank it at a flower, spend it on a moving thing (THROW, the prop's own button)
    if (inp && this.state === 'play' && !this.dead && g && g.pstBorrow) inp = pstBorrowInput(this, g, inp, dt);
    return pu0.call(this, dt, inp);
  };
}
// the piece: { n, lifts: [[dx, dy], ...] } at the letter: n cushion tiles on the floor row under it; every lift is a
// spot (relative to the letter's cell, a standing cell) the thought's lift reaches from anywhere on the cushion
Tour.pieces['pst.cushion'] = function (st, o) {
  const B = st.B, n = o.n || 3, y = st.gy;
  for (let q = 0; q < n; q++) { if (B.get(st.x + q, y) === T.EMPTY) B.set(st.x + q, y, T.GROUND); B.setSurf(st.x + q, y, PST_CUSH); }
  B.spawn('pstCushionPad', st.x, y - 1, { n });
  for (const [dx, dy] of o.lifts || []) for (let q = 0; q < n; q++) B.edge([st.x + q, y - 1], [st.x + dx, y - 1 + dy]);
  return st.x;
};
// a lift target that is not on the same cushion (the shelf trick: plant, walk under the shelf, lift on the far side)
Tour.pieces['pst.lift'] = function (st, o) { for (const [fx, fy] of o.from || []) st.B.edge([st.x + fx, st.gy - 1 + fy], [st.x, st.gy - 1]); return st.x; };

/* ======================= BLINK: Pupo's eyes ======================= */
// one clock per area: group g shut for `shut` s, open for `open` s, phase `ph`; a 0.8 s tremble before each change
const BLINK = { 0: { open: 2.6, shut: 3.6, ph: 0 }, 1: { open: 2.6, shut: 3.6, ph: 3.1 } };
const TELL = 0.8;
const blinkState = (A, gi, t) => {
  const c = (A.pstBlinkDef && A.pstBlinkDef[gi]) || BLINK[gi] || BLINK[0], P = c.open + c.shut, q = ((t + c.ph) % P + P) % P;
  // q < shut: shut; else open. warn: the last TELL s of either
  const shut = q < c.shut, left = shut ? c.shut - q : P - q;
  return { shut, warn: left < TELL, k: shut ? 1 - clamp((left - (c.shut - 0.5)) / 0.5, 0, 1) : 0, q };
};
TourHooks.on('playUpdate', (play, dt) => {
  const A = play.area; if (!A || !A.toggles || !A.pstBlink) return;
  A.pstBlinkT = (A.pstBlinkT || 0) + dt;
  for (const gi of A.pstBlink) {
    const s = blinkState(A, gi, A.pstBlinkT), on = play.toggleBit(gi);
    if (s.shut !== on) play.flipToggle(gi, true);
  }
});
// the lash ladder: rungs every 2 rows from y0 up to y1 (x0..x0+1); inner rungs only while shut, outer always
class PstLashes extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 4); this.friendly = true; this.back = true; const o = s; this.x = o.x - TS / 2; this.gi = o.g || 0; this.rungs = o.rungs || []; this.y = Math.min(...this.rungs.map(r => r[0])) * TS - 40; this.h = (Math.max(...this.rungs.map(r => r[0])) + 2) * TS - this.y; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  get hasIn() { return this.rungs.some(r => r[1] === 'in'); }
  get topRung() { return Math.min(...this.rungs.map(r => r[0])); }
  get botRung() { return Math.max(...this.rungs.map(r => r[0])); }
  // grippable: an eye's meshed lashes only while it is shut; an outer-lash ladder always
  grippable() { return !this.hasIn || blinkState(this.g.area, this.gi, this.g.area.pstBlinkT || 0).shut; }
  // how open the eye is, 0 (shut) .. 1 (wide): the lids slide shut over half a second, slide open over 0.35 s,
  // and in the tremble before opening they part a crack and shiver
  openness(s) {
    const A = this.g.area, c = (A.pstBlinkDef && A.pstBlinkDef[this.gi]) || BLINK[this.gi] || BLINK[0];
    if (s.shut) return s.warn ? 0.07 + 0.05 * Math.sin(this.t * 40) : 1 - s.k;
    return clamp((s.q - c.shut) / 0.35, 0, 1);
  }
  draw(ctx) {
    const A = this.g.area, s = blinkState(A, this.gi, A.pstBlinkT || 0), x = this.x, t = this.t;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const ys = this.rungs.map(r => r[0] * TS), top = Math.min(...ys) - 26, bot = Math.max(...ys) + 30, cxm = x + TS, cym = (top + bot) / 2, H = bot - top;
    if (this.hasIn) {
      // Pupo's enormous sleepy eye, standing on its side: two plum lids meet down the middle; open, they slide
      // apart over a cream eye with a honey iris and a big dark pupil; shut, their two combs of lashes mesh into rungs
      const o = this.openness(s), W = TS * 1.55, sh = s.shut && s.warn ? Math.sin(t * 55) * 3 : 0;
      const almond = (w) => { ctx.beginPath(); ctx.moveTo(cxm, top); ctx.quadraticCurveTo(cxm + 2 * w, cym, cxm, bot); ctx.quadraticCurveTo(cxm - 2 * w, cym, cxm, top); ctx.closePath(); };
      // the socket's soft shadow and the eye white
      ctx.fillStyle = 'rgba(42,12,40,0.35)'; almond(W + 12); ctx.fill();
      ctx.fillStyle = '#fff6ea'; almond(W); ctx.fill();
      // iris and pupil, drifting sleepily (only what the lids uncover shows: the lids are drawn over it)
      const iy = cym + Math.sin(t * 0.6) * H * 0.12, ix = cxm + Math.sin(t * 0.37) * 6;
      ctx.save(); almond(W); ctx.clip();
      ctx.fillStyle = HONEY; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ix, iy, TS * 0.95, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = HONEY_LO; ctx.beginPath(); ctx.arc(ix, iy, TS * 0.62, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a0a14'; ctx.beginPath(); ctx.arc(ix, iy, TS * 0.42, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ix - 9, iy - 10, 6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(ix + 8, iy + 8, 2.5, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = INK; ctx.lineWidth = 3.5; almond(W); ctx.stroke();
      // the two lids: from the eye's outer rim to their sliding edge (open: out at the rim; shut: the middle)
      for (const sd of [-1, 1]) {
        const e = W * o, jig = sh * sd;
        ctx.beginPath(); ctx.moveTo(cxm, top - 4); ctx.quadraticCurveTo(cxm + sd * 2 * (W + 14), cym, cxm, bot + 4); ctx.quadraticCurveTo(cxm + sd * 2 * e + jig, cym, cxm, top - 4); ctx.closePath();
        ctx.fillStyle = PLUM; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
        // a crease and a sheen along the lid
        ctx.strokeStyle = PLUM_HI; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cxm, top + 8); ctx.quadraticCurveTo(cxm + sd * (2 * (W + 6) + 2 * e) / 2, cym, cxm, bot - 8); ctx.stroke();
      }
      // the lashes: a comb on each lid edge at every inner rung, three long curved lashes each; shut they reach
      // across and mesh with the other comb (the rung); open they curl back along the lid
      const edgeX = (sd, y) => { const u = (y - top) / H, w = 2 * W * o * 2 * u * (1 - u); return cxm + sd * w + sd * sh; };
      for (const r of this.rungs) {
        if (r[1] !== 'in') continue;
        const y0 = r[0] * TS + 5;
        for (const sd of [-1, 1]) for (let q = 0; q < 3; q++) {
          const y = y0 - 7 + q * 6 + (sd > 0 ? 3 : 0), ex = edgeX(sd, y), reach = (1 - o) * (TS * 1.15) + o * 12;
          const tx = ex - sd * reach, curl = o * 16 + (s.shut && s.warn ? Math.sin(t * 60 + q) * 3 : 0);
          ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ex, y); ctx.quadraticCurveTo((ex + tx) / 2, y - 7 - curl * 0.4, tx, y - 2 - curl); ctx.stroke();
          ctx.strokeStyle = '#c86a9a'; ctx.lineWidth = 3; ctx.stroke();
        }
      }
      // the tremble before it opens: little shivers off the lid seam and a sliver of honey light
      if (s.shut && s.warn) { ctx.strokeStyle = 'rgba(255,214,115,0.9)'; ctx.lineWidth = 2.5; for (const sd of [-1, 1]) for (let q = 0; q < 3; q++) { const yy = top + H * (0.25 + q * 0.25); ctx.beginPath(); ctx.moveTo(cxm + sd * (W + 18), yy); ctx.lineTo(cxm + sd * (W + 28 + Math.sin(t * 50) * 3), yy - 6); ctx.stroke(); } }
    }
    // the short dark outer lashes: they never move (always a rung)
    for (const r of this.rungs) {
      if (r[1] !== 'out') continue;
      const y = r[0] * TS + 4;
      ctx.strokeStyle = INK; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(x - 6, y - 10); ctx.quadraticCurveTo(x + TS * 0.85, y - 2, x + 2 * TS * 0.85 + 2, y + 2); ctx.moveTo(x + 2 * TS + 6, y - 10); ctx.quadraticCurveTo(x + 2 * TS - TS * 0.85, y - 2, x + 2 * TS - 2 * TS * 0.85 - 2, y + 2); ctx.stroke();
      ctx.strokeStyle = PLUM_LO; ctx.lineWidth = 5.5; ctx.stroke(); ctx.strokeStyle = CREAM_LO; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.restore();
  }
}
ENTITY_TYPES.pstLashes = PstLashes;
// climbing the lashes (the game only): push UP inside a ladder to grip; the stick steers up and down (and a little
// sideways); JUMP lets go with a full jump; at the top he steps off with a little hop. An eye that opens under him
// lets him drop (the tremble warns first); a hit makes him let go. The rungs stay one-way floors for the checker,
// and every rung the checker stands on is one he can climb to and jump from.
const LCLIMB = 4.2 * TS;
const lashAt = (g, p) => g.entities.find(e => e instanceof PstLashes && !e.remove && p.cx >= e.x + 2 && p.cx <= e.x + 2 * TS - 2 && p.y + p.h <= (e.botRung + 2) * TS + 4 && p.y + p.h >= (e.topRung - 2) * TS - 2);
{
  const pu = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g, A = g && g.area;
    if (!(A && A.pstBlink) || this.state !== 'play' || this.dead || !inp) { if (this.pstGrip) this.pstGrip = null; return pu.call(this, dt, inp); }
    if (this.pstLetGo > 0) this.pstLetGo -= dt;
    if (!this.pstGrip && inp.up && !(this.pstLetGo > 0)) { const L = lashAt(g, this); if (L && L.grippable()) { this.pstGrip = L; this.vx = 0; this.vy = 0; this.jumping = false; TourKit.sfx('grip', 'select', { vol: 0.3, pitch: 1.8 }); } }
    if (!this.pstGrip) return pu.call(this, dt, inp);
    const L = this.pstGrip;
    const letGo = (vy, t) => { this.pstGrip = null; this.pstLetGo = t || 0.3; if (vy != null) { this.vy = vy; this.jumping = vy < 0; } this.onGround = false; };
    if (L.remove || !L.grippable()) { letGo(0, 0.4); this.pstRel = 'open'; return pu.call(this, dt, inp); }
    if (inp.jumpPressed) { letGo(-PHYS.jumpV, 0.25); Sound.play('jump', { vol: 0.5 }); return pu.call(this, dt, Object.assign({}, inp, { jumpPressed: false })); }
    this.inp = inp;
    if (this.invuln > 0) this.invuln -= dt;
    const dx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), dy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    if (dx) this.facing = dx;
    this.vx = dx * LCLIMB * 0.6; this.vy = dy * LCLIMB;
    moveBody(this, A, dt, { semis: false });
    this.onGround = false;
    const feet = this.y + this.h, topY = (L.topRung - 2) * TS;
    if (feet <= topY + 1) { this.y = topY - this.h - 6; letGo(-8 * TS, 0.35); this.jumping = false; this.vx = dx * 5 * TS; this.pstRel = 'top'; }
    else if (this.cx < L.x - 2 || this.cx > L.x + 2 * TS + 2) { letGo(0, 0.3); this.pstRel = 'side'; }
    else if (dy > 0 && SOLID[tileAt(A, Math.floor(this.cx / TS), Math.floor((feet + 2) / TS))]) { letGo(0, 0.3); this.pstRel = 'floor'; }
    this.anim.t += dt; this.anim.state = 'hang'; this.updateHair(dt);
  };
  const hu0 = Player.prototype.hurt;
  Player.prototype.hurt = function () { const inv0 = this.invuln || 0, r = hu0.apply(this, arguments); if (this.pstGrip && inv0 <= 0 && (this.invuln > 0 || this.dead)) { this.pstGrip = null; this.pstLetGo = 0.6; } return r; };
}
// a lid bridge: an eyelid lying across a gap; shut it is one smooth walkway (one-way), open it parts in the middle
class PstLid extends Ent {
  constructor(g, s) { super(g, s, (s.n || 6) * TS, 12); this.x = s.x - TS / 2; this.y = s.y - 6; this.n = s.n || 6; this.gi = s.g || 0; this.friendly = true; this.back = true; this.open0 = s.open || 0; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    // an eye lying on its back across the gap: shut, its two plum lids meet in the middle (the walkway, lashes
    // hanging under it); open, they slide back to the ends over a big cream eye with a honey iris looking up
    const A = this.g.area, s = blinkState(A, this.gi, A.pstBlinkT || 0), w = this.n * TS, x = this.x, y = this.y + 6, t = this.t;
    const o = PstLashes.prototype.openness.call(this, s), sh = s.shut && s.warn ? Math.sin(t * 55) * 2 : 0, cx = x + w / 2, R = TS * 1.15;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const almond = () => { ctx.beginPath(); ctx.moveTo(x + 4, y + 6); ctx.quadraticCurveTo(cx, y + 6 - 2 * R * 0.55, x + w - 4, y + 6); ctx.quadraticCurveTo(cx, y + 6 + 2 * R, x + 4, y + 6); ctx.closePath(); };
    if (o > 0.02 || s.warn) {
      ctx.fillStyle = 'rgba(42,12,40,0.4)'; ctx.save(); ctx.translate(0, 4); almond(); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#fff6ea'; almond(); ctx.fill();
      ctx.save(); almond(); ctx.clip();
      const ix = cx + Math.sin(t * 0.5) * w * 0.2, iy = y + 10;
      ctx.fillStyle = HONEY; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ix, iy, R * 0.8, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = HONEY_LO; ctx.beginPath(); ctx.arc(ix, iy, R * 0.52, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a0a14'; ctx.beginPath(); ctx.arc(ix, iy, R * 0.36, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ix - 8, iy - 8, 5, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = INK; ctx.lineWidth = 3; almond(); ctx.stroke();
    }
    // the two lids slide from the ends to the middle
    const half = w / 2 * (1 - o * 0.85);
    for (const sd of [-1, 1]) {
      const xa = sd < 0 ? x - 4 : x + w - half, xb = sd < 0 ? x + half : x + w + 4, j = sh * sd;
      ctx.fillStyle = PLUM; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(xa + j, y - 2); ctx.lineTo(xb + j, y - 2); ctx.quadraticCurveTo(xb + j + 6 * -sd, y + 8, xb + j, y + 14); ctx.quadraticCurveTo((xa + xb) / 2 + j, y + 20, xa + j, y + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = PLUM_HI; ctx.fillRect(Math.min(xa, xb) + 4 + j, y + 1, Math.abs(xb - xa) - 8, 3);
      // curved lashes along the lid's lower edge, the longest at its leading edge (where the two lids meet)
      for (let lx = xa + 10; lx < xb - 4; lx += 13) {
        const lead = sd < 0 ? (lx - xa) / Math.max(1, xb - xa) : (xb - lx) / Math.max(1, xb - xa), L = 8 + 10 * lead;
        ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(lx + j, y + 15); ctx.quadraticCurveTo(lx + j + 2 * sd, y + 15 + L * 0.7, lx + j - 5 * sd, y + 15 + L); ctx.stroke();
        ctx.strokeStyle = '#c86a9a'; ctx.lineWidth = 2; ctx.stroke();
      }
    }
    if (s.shut && s.warn) { ctx.strokeStyle = 'rgba(255,214,115,0.95)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, y - 4); ctx.lineTo(cx, y + 16); ctx.stroke(); for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * 8, y - 8); ctx.lineTo(cx + sd * 16, y - 16 - Math.sin(t * 50) * 3); ctx.stroke(); } }
    ctx.restore();
  }
}
ENTITY_TYPES.pstLid = PstLid;
// the pieces: lashes { g, rows: [[dy, 'in'|'out'], ...] } (rows relative to the letter's floor row, negative up),
// a 2-wide ladder at the letter; lid { g, n } a bridge of n tiles on the letter's row
Tour.pieces['pst.lashes'] = function (st, o) {
  const B = st.B, gi = o.g || 0, rungs = [];
  for (const [dy, kind] of o.rows) {
    const y = st.gy + dy; rungs.push([y, kind]);
    if (kind === 'in') { B.toggle(gi, [], [[st.x, y, st.x + 1, y, T.SEMI]], { kind: 'blink', auto: true }); }
    else { B.set(st.x, y, T.SEMI); B.set(st.x + 1, y, T.SEMI); B.setHide(st.x, y, 1); B.setHide(st.x + 1, y, 1); }
  }
  B.spawn('pstLashes', st.x, st.gy - 1, { g: gi, rungs });
  return st.x;
};
Tour.pieces['pst.lid'] = function (st, o) {
  const B = st.B, gi = o.g || 0, n = o.n || 6, y = st.gy - 1;
  B.toggle(gi, [], [[st.x, y, st.x + n - 1, y, T.SEMI]], { kind: 'blink', auto: true });
  B.spawn('pstLid', st.x, y - 1, { g: gi, n });
  return st.x;
};
// toggle tiles that are drawn by their entity: hide them from the tile painter once the area is built
TourHooks.on('areaLoaded', (play, A) => {
  if (!A || !A.toggles || A.pstHid) return;
  A.pstHid = true;
  for (const gi in A.toggles) { const G = A.toggles[gi]; if (['blink', 'feather', 'ruler', 'thing'].indexOf(G.kind) < 0) continue; for (const r of G.A.concat(G.B)) for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) if (A.hide) A.hide[y * A.W + x] = 1; }
  if (A.pstBlinkGroups) A.pstBlink = A.pstBlinkGroups;
});

/* ======================= YAWN: the mouth and its feather ======================= */
class PstMouth extends Ent {
  constructor(g, s) {
    super(g, s, (s.n || 5) * TS, 2 * TS); this.x = s.x - TS / 2; this.y = s.y - 2 * TS + 4; this.n = s.n || 5; this.gi = s.g || 0; this.friendly = true;
    this.spots = [s.a, s.b]; this.stuck = !!s.stuck; this.sel = s.stuck ? -1 : 0; this.free = !s.stuck; this.stretch = 0; this.own = s.stuck ? null : 0;
    this.period = s.period || 3.2; this.cyc = 1.2; this.fly = null; this.wide = 0; this.floorY = s.y; this.lx = s.lx; this.rx = s.rx; this.stuckFree = s.stuckFree || 0;
  }
  // the feather is where the toggle says (0: spot a, 1: spot b), unless it is still caught on the tooth
  at() { return this.own; }
  update(dt) {
    const g = this.g, p = g.player; this.t += dt;
    // groups are shared by mouths far apart: the one Brady is near keeps the tiles matching its own feather
    if (p && Math.abs(p.cx - this.cx) < 16 * TS && g.toggleBit(this.gi) !== (this.own === 1)) g.flipToggle(this.gi, true);
    // which corner is Brady standing on?
    if (p && p.onGround && !p.dead && Math.abs(p.y + p.h - this.floorY) < 6) {
      const tx = Math.floor(p.cx / TS);
      if (tx === this.lx || tx === this.rx) {
        const side = tx === this.lx ? 0 : 1;
        if (this.stuck && !this.free) {
          if (side === (this.stuckFree || 0)) { if (!this.freedT) { this.freedT = 1; this.free = true; PSAY(g, this.cx, this.y - 8, 'IT CAME LOOSE!', '#fff4dc'); Sound.play('pick', { vol: 0.5, pitch: 0.6 }); } }
          else if (!(this.toldT > this.t)) { this.toldT = this.t + 2.5; PSAY(g, this.cx, this.y - 8, 'IT\'S CAUGHT ON A TOOTH...', '#fff4dc'); }
        }
        if (this.free && this.sel !== side && !(this.stuck && side === this.stuckFree)) { this.sel = side; Sound.play('select', { vol: 0.35, pitch: side ? 1.2 : 0.9 }); }
      }
    }
    this.stretch = approach(this.stretch, this.sel < 0 ? 0 : this.sel ? 1 : -1, dt * 3);
    // the yawn: an inhale (the tell, 0.8 s: the mouth opens wide), a puff that sends the feather on its way
    this.cyc -= dt;
    if (this.cyc < 0.8) this.wide = approach(this.wide, 1, dt * 2.5); else this.wide = approach(this.wide, 0, dt * 1.5);
    if (this.cyc <= 0) {
      this.cyc = this.period;
      const cur = this.at();
      if (this.free && this.sel >= 0 && cur !== this.sel) { this.fly = { from: cur == null ? null : cur, to: this.sel, t: 0 }; if (g.onScreen(this, 200)) { PSAY(g, this.cx, this.y - 4, 'HAAAWM...', '#fff4dc'); TourKit.sfx('yawn', 'float', { vol: 0.4, pitch: 0.7 }); } }
    }
    if (this.fly) {
      this.fly.t += dt;
      // the new feather settles; the old one puffs away as it lands
      if (this.fly.t >= 1.0) { this.own = this.fly.to; if (g.toggleBit(this.gi) !== (this.own === 1)) g.flipToggle(this.gi, true); if (this.fly.from != null) { const o = this.spotXY(this.fly.from); g.burst(o.x, o.y, 8, CREAM, 'dust'); } this.fly = null; Sound.play('land', { vol: 0.3, pitch: 1.6 }); }
    }
  }
  spotXY(k) { const s = this.spots[k]; return { x: (s[0] + s[2] / 2) * TS, y: s[1] * TS }; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, w = this.n * TS, y = this.floorY, t = this.t;
    ctx.save(); ctx.lineJoin = 'round';
    // the lips on the cushion: stretched toward the selected corner
    const cx = x + w / 2 + this.stretch * w * 0.12, mw = w * (0.78 + Math.abs(this.stretch) * 0.12), mh = 14 + this.wide * 22;
    ctx.fillStyle = PLUM; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(cx, y - 14, mw / 2 + 6, mh / 2 + 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a0e24'; ctx.beginPath(); ctx.ellipse(cx, y - 14, mw / 2, mh / 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#e0789e'; ctx.beginPath(); ctx.ellipse(cx, y - 14 + mh * 0.22, mw * 0.3, mh * 0.22, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#b04a70'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, y - 14 + mh * 0.05); ctx.lineTo(cx, y - 14 + mh * 0.38); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    // cream teeth top and bottom
    ctx.fillStyle = CREAM; ctx.lineWidth = 1.4;
    for (let k = 0; k < 4; k++) { const tx = cx - mw * 0.36 + k * mw * 0.24; ctx.beginPath(); ctx.moveTo(tx - 5, y - 14 - mh / 2); ctx.lineTo(tx + 5, y - 14 - mh / 2); ctx.lineTo(tx, y - 14 - mh / 2 + 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(tx - 5, y - 14 + mh / 2); ctx.lineTo(tx + 5, y - 14 + mh / 2); ctx.lineTo(tx, y - 14 + mh / 2 - 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    // the corners: two soft plum cheek pads (a pressed one dips)
    for (const [cxk, side] of [[this.lx, 0], [this.rx, 1]]) { const px = cxk * TS + TS / 2, on = this.sel === side; ctx.fillStyle = on ? PLUM_HI : PLUM; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, y - 4 + (on ? 2 : 0), 14, 6, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,170,200,0.6)'; ctx.beginPath(); ctx.ellipse(px, y - 6 + (on ? 2 : 0), 8, 3, 0, 0, TAU); ctx.fill(); }
    // the stuck feather on its tooth
    if (this.stuck && !this.free) { PstArt.feather(ctx, cx + mw * 0.2, y - 14 - mh / 2 + 4, 30, 0.6 + Math.sin(t * 6) * 0.15); }
    // the feather in flight or on its spot
    if (this.fly && this.fly.from != null) { const s = this.spots[this.fly.from], b = this.spotXY(this.fly.from); PstArt.feather(ctx, b.x, b.y + 4 + Math.sin(t * 9) * 2, s[2] * TS + 10, Math.sin(t * 7) * 0.08); }
    if (this.fly) {
      const a = { x: cx, y: y - 20 }, b = this.spotXY(this.fly.to), k = clamp(this.fly.t / 1.0, 0, 1);
      const fx = lerp(a.x, b.x, k), fy = lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * 60;
      PstArt.feather(ctx, fx, fy, this.spots[this.fly.to][2] * TS, Math.sin(t * 9) * 0.35);
    } else {
      const at = this.at();
      if (at != null) { const s = this.spots[at], b = this.spotXY(at); PstArt.feather(ctx, b.x, b.y + 4 + Math.sin(t * 2) * 1.5, s[2] * TS + 10, Math.sin(t * 1.5) * 0.04); }
    }
    // the faint dotted guide from the mouth to where the feather would go (it reads the stretch)
    if (this.sel >= 0 && this.free) { const b = this.spotXY(this.sel); ctx.fillStyle = 'rgba(255,244,220,0.5)'; for (let k = 1; k < 6; k++) { const q = k / 6; ctx.beginPath(); ctx.arc(lerp(cx, b.x, q), lerp(y - 20, b.y, q) - Math.sin(q * Math.PI) * 60, 2, 0, TAU); ctx.fill(); } }
    ctx.restore();
  }
}
ENTITY_TYPES.pstMouth = PstMouth;
// the piece: { g, n, a: [dx, dy, w], b: [dx, dy, w], stuck, free: 0|1 (the corner that frees a stuck feather) }
// at the letter: the mouth sits on the floor from the letter's column, n wide; its corners are the end columns.
// a / b: the feather's two spots (left column, standing row of the feather's top tile, width) relative to the letter
Tour.pieces['pst.mouth'] = function (st, o) {
  const B = st.B, gi = o.g || 0, n = o.n || 5, y = st.gy;
  const spot = s => [st.x + s[0], y + s[1], s[2] || 2];
  const b = spot(o.b), a = o.a ? spot(o.a) : b.slice();
  const rect = s => [[s[0], s[1], s[0] + s[2] - 1, s[1], T.SEMI]];
  B.toggle(gi, o.stuck ? [] : rect(a), rect(b), { kind: 'feather' });
  if (!o.stuck) for (let q = 0; q < a[2]; q++) B.set(a[0] + q, a[1], T.SEMI);   // state 0 is the area as built: the feather starts on spot a
  if (!o.stuck) B.switchAt(gi, st.x, y - 1);
  B.switchAt(gi, st.x + n - 1, y - 1);
  B.spawn('pstMouth', st.x, y - 1, { g: gi, n, a, b, stuck: !!o.stuck, stuckFree: o.free || 0, lx: st.x, rx: st.x + n - 1, period: o.period || 3.2 });
  return st.x;
};

/* ======================= BORROW: the hourglass flower and borrowed seconds ======================= */
// the flower: hold THROW beside it to bank a second (the petals fold round a grain of honey sand)
class PstFlower extends Ent {
  constructor(g, s) { super(g, s, 30, 56); this.friendly = true; this.fill = 0; this.used = 0; }
  update(dt) { this.t += dt; if (this.used > 0) this.used -= dt; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t, p = this.g.player, k = this.fill;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.strokeStyle = MINT_LO; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.sin(t) * 4, y - 20, x, y - 36); ctx.stroke();
    ctx.fillStyle = MINT; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * 9, y - 14, 9, 4, s * 0.5, 0, TAU); ctx.fill(); ctx.stroke(); }
    // petals around a small hourglass head
    const open = 1 - k * 0.7;
    ctx.fillStyle = PLUM_HI; for (let q = 0; q < 6; q++) { const a = q / 6 * TAU + t * 0.3; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 10 * open, y - 46 + Math.sin(a) * 10 * open, 8, 5, a, 0, TAU); ctx.fill(); ctx.stroke(); }
    PstArt.hourglass(ctx, x, y - 46, 11, this.used > 0 ? 0 : 1 - k);
    if (p && Math.abs(p.cx - x) < 40 && !(p.pstSecond) && this.used <= 0 && Math.abs(p.y + p.h - y) < 20) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('HOLD THROW', x, y - 66); }
    ctx.restore();
  }
}
ENTITY_TYPES.pstFlower = PstFlower;
// a snapping cushion jaw: hangs over the path, opens wide and trembles (0.7 s), snaps down, rises again
class PstJaw extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 2 * TS); this.x = s.x - TS / 2; this.top = s.y - (s.h || 4) * TS; this.floor = s.y; this.y = this.top; this.period = s.period || 2.6; this.c = (s.phase || 0); this.drop = 0; this.freeze = 0; this.enemy = false; }
  get freezable() { return true; }
  update(dt) {
    this.t += dt;
    if (this.freeze > 0) { this.freeze -= dt; return; }
    this.c = (this.c + dt) % this.period;
    const P = this.period, q = this.c;
    // 0..P-1.3 up and resting; then the tell (0.7 s); the snap (0.15 s); held shut (0.25 s); back up
    if (q < P - 1.3) this.drop = approach(this.drop, 0, dt * 3);
    else if (q < P - 0.6) this.drop = 0;
    else if (q < P - 0.45) this.drop = clamp((q - (P - 0.6)) / 0.15, 0, 1);
    else this.drop = 1;
    this.tell = q >= P - 1.3 && q < P - 0.6;
    const span = this.floor - this.top - 2 * TS;
    this.y = this.top + span * this.drop;
  }
  touchPlayer(p) { if (this.drop > 0.3 && this.freeze <= 0 && !p.dead) p.hurt(this); else if (this.drop > 0.3 && !p.dead && p.y < this.y + this.h - 6) { /* frozen down: it is a soft block */ } }
  draw(ctx) {
    const x = this.x, w = this.w, y = this.y, tr = this.tell ? Math.sin(this.t * 60) * 2 : 0, open = this.tell ? 1 : 0.3;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the rope it hangs from
    ctx.strokeStyle = CREAM_LO; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + w / 2, this.top - 2 * TS); ctx.lineTo(x + w / 2, y + 4); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the upper and lower plum cushion jaws with cream teeth
    ctx.fillStyle = PLUM; rr(ctx, x - 4 + tr, y, w + 8, 22, 10); ctx.fill(); ctx.stroke();
    rr(ctx, x - 4 + tr, y + 30 + open * 8, w + 8, 18, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CREAM; ctx.lineWidth = 1.4; for (let k = 0; k < 4; k++) { const tx = x + 4 + k * 14 + tr; ctx.beginPath(); ctx.moveTo(tx, y + 20); ctx.lineTo(tx + 10, y + 20); ctx.lineTo(tx + 5, y + 30); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(tx, y + 32 + open * 8); ctx.lineTo(tx + 10, y + 32 + open * 8); ctx.lineTo(tx + 5, y + 24 + open * 8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    if (this.freeze > 0) { PstArt.hourglass(ctx, x + w / 2, y - 16, 10, this.freeze / FREEZE_T); }
    ctx.restore();
  }
}
ENTITY_TYPES.pstJaw = PstJaw;
// the folding ruler: a cream carpenter's ruler hinged at the near ledge. It unfolds over the gap segment by segment,
// but its near elbow always folds back before the far end gets there. Held at the elbow, the far end finishes.
class PstRuler extends Ent {
  constructor(g, s) { super(g, s, (s.n || 8) * TS, 16); this.x = s.x - TS / 2; this.y = s.ty * TS; this.n = s.n || 8; this.gi = s.g || 0; this.friendly = true; this.c = 0; this.k = 0; this.freeze = 0; this.markX = s.markX; }
  get freezable() { return true; }
  update(dt) {
    const g = this.g; this.t += dt;
    if (this.freeze > 0) {
      this.freeze -= dt; this.k = approach(this.k, 1, dt * 2.2);
      if (this.k >= 1 && !g.toggleBit(this.gi)) { g.flipToggle(this.gi, true); Sound.play('land', { vol: 0.4, pitch: 1.4 }); PSAY(g, this.x + this.n * TS, this.y - 10, 'CLICK!', '#fff4dc'); }
      if (this.freeze <= 0 && g.toggleBit(this.gi)) { this.hold = 1.0; }
      return;
    }
    // after a held reach the bridge stays one more second (trembling), then folds
    if (this.hold > 0) { this.hold -= dt; if (this.hold <= 0 && g.toggleBit(this.gi)) g.flipToggle(this.gi, true); return; }
    this.c = (this.c + dt) % 4;
    // reach out to 70 % (the far end never gets there: the elbow folds back first), then fold
    this.k = this.c < 2.2 ? Math.min(0.7, this.c / 2.2 * 0.9) : Math.max(0, 0.7 - (this.c - 2.2) / 1.8 * 0.7);
    if (g.toggleBit(this.gi)) g.flipToggle(this.gi, true);
  }
  touchPlayer() {}
  draw(ctx) {
    const x0 = this.x, y = this.y + 6, n = this.n, L = n * TS, k = this.k, segs = 6, sl = L / segs;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    // the segments: laid flat as far as k reaches, the rest folded up in a zig-zag at the reach's end
    const flat = Math.floor(k * segs), rem = k * segs - flat;
    let x = x0;
    const seg = (xa, ya, xb, yb) => { const a = Math.atan2(yb - ya, xb - xa), len = Math.hypot(xb - xa, yb - ya); ctx.save(); ctx.translate(xa, ya); ctx.rotate(a); ctx.fillStyle = '#fff4c8'; ctx.fillRect(0, -6, len, 12); ctx.strokeRect(0, -6, len, 12); ctx.fillStyle = INK; for (let q = 4; q < len - 2; q += 6) ctx.fillRect(q, -6, 1, q % 24 < 6 ? 6 : 3); ctx.restore(); ctx.fillStyle = HONEY_LO; ctx.beginPath(); ctx.arc(xb, yb, 3, 0, TAU); ctx.fill(); ctx.stroke(); };
    for (let q = 0; q < flat; q++) { seg(x, y, x + sl, y); x += sl; }
    if (flat < segs) { const a = -(1 - rem) * 1.3; seg(x, y, x + Math.cos(a) * sl, y + Math.sin(a) * sl); const x2 = x + Math.cos(a) * sl, y2 = y + Math.sin(a) * sl; for (let q = flat + 1; q < segs; q++) { const s2 = (q - flat) % 2 ? 1 : -1; seg(x2 + (s2 > 0 ? 0 : 3), y2 - (q - flat) * 2, x2 + (s2 > 0 ? 3 : 0), y2 - (q - flat) * 2 - sl * 0.9); } }
    // the elbow's mark on the near ledge: a little clock face (stand here, tap THROW)
    const mx = this.markX * TS + TS / 2, my = this.y - 5; ctx.fillStyle = CREAM; ctx.beginPath(); ctx.ellipse(mx, my, 11, 5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = MINT_LO; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + 6, my - 2); ctx.moveTo(mx, my); ctx.lineTo(mx - 2, my - 3); ctx.stroke();
    if (this.freeze > 0) PstArt.hourglass(ctx, x0 + 10, y - 22, 10, this.freeze / FREEZE_T);
    ctx.restore();
  }
}
ENTITY_TYPES.pstRuler = PstRuler;
// a moving platform holds still while it has a borrowed second
{
  const MP = ENTITY_TYPES.mplat, up0 = MP.prototype.update;
  MP.prototype.update = function (dt) { if (this.freeze > 0) { this.freeze -= dt; this.dx = 0; this.dy = 0; return; } return up0.call(this, dt); };
  const d0 = MP.prototype.draw;
  MP.prototype.draw = function (ctx) { d0.call(this, ctx); if (this.freeze > 0) PstArt.hourglass(ctx, this.cx, this.y - 14, 9, this.freeze / FREEZE_T); };
  Object.defineProperty(MP.prototype, 'freezable', { get() { return !!(this.g && this.g.pstBorrow); }, configurable: true });
}
// the input side: bank at a flower (THROW held, 0.6 s, standing still beside it), spend on a moving thing in reach
// (standing on a platform, under or beside a jaw, on a ruler's elbow mark): the button is the prop's while he's there
function pstBorrowInput(p, g, inp, dt) {
  const B = g.pstBorrow;
  const fl = g.entities.find(e => e instanceof PstFlower && !e.remove && Math.abs(e.cx - p.cx) < 36 && Math.abs(e.y + e.h - (p.y + p.h)) < 20);
  if (fl && !p.pstSecond && fl.used <= 0) {
    if (inp.action && p.onGround) {
      fl.fill = Math.min(1, fl.fill + dt / BANK_T);
      if (fl.fill >= 1) { p.pstSecond = true; fl.fill = 0; fl.used = 1.2; Sound.play('coin', { vol: 0.6, pitch: 0.7 }); PSAY(g, p.cx, p.y - 16, 'A SECOND, BORROWED', '#fff4dc'); g.burst(fl.cx, fl.y + 10, 10, HONEY, 'spark'); }
    } else fl.fill = Math.max(0, fl.fill - dt * 2);
    return Object.assign({}, inp, { action: false, actionPressed: false });
  }
  if (p.pstSecond && inp.actionPressed) {
    const T0 = pstFreezeTarget(p, g);
    if (T0) {
      p.pstSecond = false; T0.freeze = FREEZE_T + (T0 instanceof PstRuler ? 0.4 : 0);
      Sound.play('select', { vol: 0.6, pitch: 0.5 }); PSAY(g, T0.cx, T0.y - 12, 'HOLD ON...', '#fff4dc'); g.burst(T0.cx, T0.cy, 10, HONEY, 'spark');
      return Object.assign({}, inp, { action: false, actionPressed: false });
    }
  }
  return inp;
}
function pstFreezeTarget(p, g) {
  if (p.ride && p.ride.freezable) return p.ride;
  let best = null, bd = 1e9;
  for (const e of g.entities) {
    if (e.remove || !e.freezable) continue;
    let d;
    if (e instanceof PstRuler) d = Math.abs(p.cx - (e.markX * TS + TS / 2)) < 26 && Math.abs(p.y + p.h - e.y) < 10 ? 0 : 1e9;
    else if (e instanceof PstJaw) d = Math.abs(p.cx - e.cx) < 2 * TS && p.y < e.floor && p.y + p.h > e.floor - 4 * TS ? Math.abs(p.cx - e.cx) : 1e9;
    else d = Math.abs(p.cx - e.cx) < e.w / 2 + 20 && p.y + p.h <= e.y + 6 && p.y + p.h > e.y - 40 ? 0 : 1e9;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
// the banked second rides over Brady's head (a small hourglass), so it is always clear whether he has one
TourHooks.on('afterEntities', (play, ctx) => {
  const p = play.player; if (!p || !p.pstSecond || !play.pstBorrow) return;
  PstArt.hourglass(ctx, p.cx + 18, p.y - 8 + Math.sin(play.t * 3) * 2, 8, 1);
});
TourHooks.on('areaLoaded', (play, A) => { play.pstBorrow = !!(A && A.pstBorrow); if (!play.pstBorrow && play.player) play.player.pstSecond = false; });
// the pieces: flower; jaw { h (rows above the floor), period, phase }; ruler { g, n, mark (dx of the elbow mark) };
// mover { pw, ax, ay, speed } (a moving platform with its path as one-way floor for the checker)
Tour.pieces['pst.flower'] = function (st, o) { st.B.spawn('pstFlower', st.x, st.gy - 1, {}); return st.x; };
Tour.pieces['pst.jaw'] = function (st, o) { st.B.spawn('pstJaw', st.x, st.gy - 1, { h: o.h || 4, period: o.period || 2.6, phase: o.phase || 0 }); return st.x; };
Tour.pieces['pst.ruler'] = function (st, o) {
  const B = st.B, gi = o.g || 0, n = o.n || 8, y = st.gy;
  B.toggle(gi, [], [[st.x, y, st.x + n - 1, y, T.SEMI]], { kind: 'ruler' });
  const mark = st.x + (o.mark != null ? o.mark : -2);
  B.switchAt(gi, mark, y - 1);
  B.spawn('pstRuler', st.x, y - 1, { g: gi, n, markX: mark, ty: y });
  return st.x;
};
Tour.pieces['pst.mover'] = function (st, o) {
  const B = st.B, pw = o.pw || 3, ax = o.ax || 0, ay = o.ay || 0, x = st.x, y = st.gy - 1;
  B.spawn('mplat', x, y, { pw, ax: ax * TS, ay: ay * TS, speed: o.speed || 2, skin: 'pstBubble', phase: o.phase || 0 });
  for (let i = Math.min(0, ax); i <= Math.max(0, ax); i++) for (let j = 0; j < pw; j++) for (let k = Math.min(0, ay); k <= Math.max(0, ay); k++) B.ghosts.push([x + i + j, y + 1 + k]);
  return st.x;
};
// the land's moving platforms are cream thought bubbles
if (typeof PlatformArt !== 'undefined') PlatformArt.pstBubble = function (ctx, e) { PstArt.bubble(ctx, e.x - 2, e.y - 4, e.w + 4, 20); PstArt.tail(ctx, e.x + e.w * 0.3, e.y + 18, e.x + e.w * 0.1, e.y + 34, 3, 3); };

/* ======================= THOUGHT: picture bubbles and their subjects ======================= */
const THINGS = {
  tub(ctx, x, y, w, h, t) {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; rr(ctx, x + 2, y + 6, w - 4, h - 10, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9ad8f0'; ctx.fillRect(x + 8, y + 6, w - 16, 7); ctx.fillStyle = '#ffffff'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + 12 + k * (w - 24) / 4, y + 4 + Math.sin(t * 3 + k) * 2, 6, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = HONEY; for (const fx of [x + 10, x + w - 18]) { ctx.beginPath(); ctx.arc(fx + 4, y + h - 2, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
  },
  towel(ctx, x, y, w, h, t) {
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#c8a040'; ctx.fillRect(x - 6, y - 4, w + 12, 6); ctx.strokeRect(x - 6, y - 4, w + 12, 6);
    ctx.fillStyle = MINT; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - 2, y + 14 + Math.sin(t * 2) * 2); ctx.lineTo(x + 2, y + 14 + Math.sin(t * 2 + 1) * 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 2, y + 9, w - 4, 3);
  },
  stool(ctx, x, y, w, h) { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = HONEY; rr(ctx, x, y, w, 12, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9a6a40'; ctx.fillRect(x + 4, y + 12, 6, h - 12); ctx.strokeRect(x + 4, y + 12, 6, h - 12); ctx.fillRect(x + w - 10, y + 12, 6, h - 12); ctx.strokeRect(x + w - 10, y + 12, 6, h - 12); },
  ladder(ctx, x, y, w, h) { ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + 4, y + h); ctx.moveTo(x + w - 4, y); ctx.lineTo(x + w - 4, y + h); ctx.stroke(); ctx.strokeStyle = '#c8a060'; ctx.lineWidth = 3; ctx.stroke(); for (let yy = y + 4; yy < y + h; yy += 2 * TS) { ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); ctx.strokeStyle = '#e8c080'; ctx.lineWidth = 3.5; ctx.stroke(); } }
};
// a subject: drawn while its group is on (it pops in and out with a puff); its tiles are the toggle's B rects
class PstThing extends Ent {
  constructor(g, s) { super(g, s, s.w * TS, s.h * TS); this.x = s.tx * TS; this.y = s.ty * TS; this.kind = s.kind; this.gi = s.g; this.friendly = true; this.back = true; this.vis = 0; }
  update(dt) { this.t += dt; const on = this.g.toggleBit(this.gi); if (on && this.vis < 1 && this.vis === 0) this.g.burst(this.cx, this.cy, 12, CREAM, 'dust'); this.vis = approach(this.vis, on ? 1 : 0, dt * 6); }
  touchPlayer() {}
  draw(ctx) {
    if (this.vis <= 0.01) { ctx.save(); ctx.globalAlpha = 0.25; ctx.setLineDash([4, 5]); ctx.strokeStyle = CREAM; ctx.lineWidth = 2; ctx.strokeRect(this.x + 2, this.y + 2, this.w - 4, this.h - 4); ctx.restore(); return; }
    ctx.save(); ctx.globalAlpha = this.vis; const k = 0.7 + 0.3 * this.vis; ctx.translate(this.cx, this.y + this.h); ctx.scale(k, k); ctx.translate(-this.cx, -(this.y + this.h));
    (THINGS[this.kind] || THINGS.stool)(ctx, this.x, this.y, this.w, this.h, this.t); ctx.restore();
  }
}
ENTITY_TYPES.pstThing = PstThing;
// a picture bubble: bump it from below and its subject is the one Pupo is thinking of
class PstPic extends Ent {
  constructor(g, s) { super(g, s, 64, 50); this.y = s.y - 4 * TS - 16; this.kind = s.kind; this.gi = s.g; this.set = s.set || [s.g]; this.friendly = false; this.bumpT = 0; }
  update(dt) { this.t += dt; if (this.bumpT > 0) this.bumpT -= dt; }
  touchPlayer(p) {
    if (p.dead || this.bumpT > 0) return;
    if (p.vy < 0) {
      this.bumpT = 0.6;
      const g = this.g;
      for (const gi of this.set) { const want = gi === this.gi; if (g.toggleBit(gi) !== want) g.flipToggle(gi, true); }
      Sound.play('bump', { vol: 0.5 }); Sound.play('select', { vol: 0.5, pitch: 1.3 }); PSAY(g, this.cx, this.y - 6, 'A ' + this.kind.toUpperCase() + '!', '#fff4dc');
    }
  }
  draw(ctx) {
    const on = this.g.toggleBit(this.gi), b = this.bumpT > 0 ? -Math.sin(this.bumpT / 0.4 * Math.PI) * 6 : Math.sin(this.t * 2) * 2;
    ctx.save(); ctx.translate(0, b);
    ctx.globalAlpha = on ? 1 : 0.6;
    if (on) { ctx.fillStyle = 'rgba(255,214,115,0.35)'; ctx.beginPath(); ctx.ellipse(this.cx, this.cy, this.w * 0.75, this.h * 0.8, 0, 0, TAU); ctx.fill(); }
    PstArt.bubble(ctx, this.x, this.y, this.w, this.h, on ? '#fff8e0' : '#d8ccd8');
    PstArt.tail(ctx, this.x + 10, this.y + this.h + 4, this.x - 6, this.y + this.h + 22, 3, 4);
    ctx.save(); ctx.beginPath(); ctx.rect(this.x + 6, this.y + 4, this.w - 12, this.h - 8); ctx.clip();
    const sz = this.kind === 'ladder' ? [22, 40] : this.kind === 'towel' ? [44, 24] : this.kind === 'stool' ? [28, 32] : [48, 28];
    (THINGS[this.kind] || THINGS.stool)(ctx, this.cx - sz[0] / 2, this.cy - sz[1] / 2 + 2, sz[0], sz[1], this.t); ctx.restore();
    if (on) { ctx.strokeStyle = HONEY; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.strokeRect(this.x - 4, this.y - 4, this.w + 8, this.h + 8); ctx.setLineDash([]); }
    ctx.restore();
  }
}
ENTITY_TYPES.pstPic = PstPic;
// the pieces: pic { g, kind, set } at the letter (the bubble floats 4 rows over the floor; the checker's switch is
// the floor cell under it); thing { g, kind, w, h, solid: 'SEMI'|'HARD' } with its top-left at the letter
Tour.pieces['pst.pic'] = function (st, o) { const B = st.B; B.switchAt(o.g, st.x, st.gy - 1); if (!B.toggles[o.g]) B.toggle(o.g, [], [], { kind: 'thing' }); B.spawn('pstPic', st.x, st.gy - 1, { g: o.g, kind: o.kind, set: o.set }); return st.x; };
Tour.pieces['pst.thing'] = function (st, o) {
  const B = st.B, x = st.x, y = st.gy - 1, w = o.w || 3, h = o.h || 1, tt = T[o.solid || 'SEMI'];
  const rects = o.kind === 'ladder' ? Array.from({ length: Math.ceil(h / 2) }, (_, k) => [x, y + 2 * k, x + w - 1, y + 2 * k, T.SEMI]) : [o.solid === 'HARD' ? [x, y, x + w - 1, y + h - 1, tt] : [x, y, x + w - 1, y, tt]];
  B.toggle(o.g, [], rects, { kind: 'thing' });
  B.spawn('pstThing', x, y, { g: o.g, kind: o.kind, w, h, tx: x, ty: y });
  return st.x;
};
Tour.pstKit.onCushion = onCushion; Tour.pstKit.blinkState = blinkState; Tour.pstKit.LIFT_T = LIFT_T; Tour.pstKit.FREEZE_T = FREEZE_T;
try { if (typeof window !== 'undefined') window.BRADY_PST = { phys: (b, inp, A, dt, pl, o) => playerPhysicsFlip(b, inp, A, dt, pl, o), spikeContact: (b, A) => spikeContact(b, A), lavaContact: (b, A) => lavaContact(b, A), kit: Tour.pstKit }; } catch (e) { /* not in a browser */ }
})();
/* the land's one tell for a hidden way: a lone sleepy z drifting up out of a gap, a wall or a floor */
(function () {
  const K = Tour.pstKit; if (!K) return;
  class PstZ extends Ent {
    constructor(g, s) { super(g, s, 20, 20); this.friendly = true; this.back = true; this.t = (s.x * 0.013) % 3; }
    update(dt) { this.t += dt; }
    touchPlayer() {}
    draw(ctx) { const q = (this.t / 3.2) % 1; if (q > 0.7) return; const k = q / 0.7; K.PstArt.z(ctx, this.cx + Math.sin(k * 7) * 5, this.y + this.h - k * 70, 6 + k * 4, 0.85 * Math.sin(k * Math.PI), '#ffffff'); }
  }
  ENTITY_TYPES.pstZ = PstZ;
  Tour.pieces['pst.z'] = function (st, o) { st.B.spawn('pstZ', st.x, st.gy - 1 + (o.dy || 0), {}); const s = st.B.spawns[st.B.spawns.length - 1]; s.x += (o.dx || 0) * TS; return st.x; };
})();
