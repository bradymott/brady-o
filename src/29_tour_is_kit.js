/* ============================================================
   ICELAND: the moving parts (world 17). Each level type's own mechanic, coded here:
   17-1 AURORA  isRibbon: a ribbon of the northern lights is walkable light. It ripples (a travelling wave lifts and
                lowers it) and it fades and returns: a 'pulse' ribbon blinks as a whole; a 'sweep' ribbon relights
                from one end in a flash, holds, then fades from that same end at a steady pace, so Brady runs ahead
                of the fade. The fade's front sparkles 0.7 s before it starts and as it travels (the tell).
   17-2 BERG    isBerg: a floating iceberg that tips under Brady's weight. Off-centre it tilts, and on a tilt Brady
                slides downhill; held at full tilt for a moment (it creaks and cracks: the tell) it rolls over and
                dunks him. A seal lying on one end is a counterweight: balance against it.
   17-3 QUAKE   isPlate: a slab of the rift that slides between two spots on a slow clock (closed / open). Before
                each move the ground rumbles, dust falls and the crack glows (1 s); a slab carries Brady standing on
                it and crushes him if it closes on him. Its two spots are a toggle group the checker searches.
   17-4 BASALT  isPipe: a hexagonal basalt column that sinks under Brady's weight like an organ key (each at its own
                speed, each with its own note) and rises again when he steps off; some sink into the lava. 'lift'
                columns rise under weight instead. isEmber: a lava blob that bubbles (the tell) and leaps.
   17-6 SHY     isShyPlat / isShyWall / isShyEye: the hidden folk's planks exist only while Brady looks away from
                them; their gates block him only while he looks at them. THROW (the action button) makes Brady
                look back over his shoulder: he walks one way, facing the other.
   ============================================================ */
(function () {
const C = Tour.countries.is;
if (!C) return;
const KIT = Tour.isKit, IsArt = KIT.IsArt, INK = KIT.INK;
const riding = (p, e) => p && !p.dead && p.ride === e && p.onGround;
// the engine keeps p.ride while Brady stays on the ground, even after he walked off onto tiles: a platform that
// later moves (or comes back to life) would drag him along. Each of ours lets go of a stale rider first.
const unride = e => { const p = e.g.player; if (p && p.ride === e && (e.dead || p.x + p.w <= e.x + 1 || p.x >= e.x + e.w - 1 || Math.abs(p.y + p.h - e.y) > 6)) p.ride = null; };

/* ======================= 17-1: the aurora ribbons ======================= */
const AURORA = { relight: 16, tell: 0.7 };
class IsRibbon extends Ent {
  constructor(g, s) {
    super(g, s, (s.len || 8) * TS, 12);
    this.len = s.len || 8; this.x0 = s.x - TS / 2; this.base = s.y - TS; this.mode = s.mode || 'sweep'; this.dir = s.dir || 1;
    this.amp = s.amp != null ? s.amp : 8; this.wave = s.wave || 10; this.ph = s.phase || 0; this.hue = s.hue || 0;
    this.hold = s.hold != null ? s.hold : 1.4; this.dark = s.dark != null ? s.dark : 1.4; this.vf = s.speed || 4.4;
    this.isPlatform = true; this.dx = 0; this.dy = 0; this.always = true; this.back = true;
    this.s0 = 0; this.s1 = this.len; this.tellK = 0; this.wasLit = true;
    this.x = this.x0; this.y = this.base;
    this.calc();
  }
  // the cycle: returns { s0, s1 } (the lit span along the ribbon, in tiles from its start end) and the tell (0..1)
  span(T) {
    const L = this.len;
    if (this.mode === 'pulse') {
      const P = this.hold + this.dark, k = ((T % P) + P) % P;
      return { s0: 0, s1: k < this.hold ? L : 0, tell: k < this.hold && k > this.hold - AURORA.tell ? 1 : 0, front: -1 };
    }
    const tr = L / AURORA.relight, tf = L / this.vf, P = tr + this.hold + tf + this.dark, k = ((T % P) + P) % P;
    if (k < tr) return { s0: 0, s1: k * AURORA.relight, tell: 0, front: -1, head: k * AURORA.relight };
    if (k < tr + this.hold) { const left = tr + this.hold - k; return { s0: 0, s1: L, tell: left < AURORA.tell ? 1 : 0, front: left < AURORA.tell ? 0 : -1 }; }
    if (k < tr + this.hold + tf) { const f = (k - tr - this.hold) * this.vf; return { s0: f, s1: L, tell: 1, front: f }; }
    return { s0: 0, s1: 0, tell: 0, front: -1 };
  }
  cycle() { const L = this.len; return this.mode === 'pulse' ? this.hold + this.dark : L / AURORA.relight + this.hold + L / this.vf + this.dark; }
  // the world x of a point u tiles along the ribbon (from its start end)
  wx(u) { return this.dir > 0 ? this.x0 + u * TS : this.x0 + (this.len - u) * TS; }
  // the ribbon's top at world x (the travelling ripple)
  yAt(x) { return this.base + this.amp * Math.sin(this.g.t * 2.2 + this.ph - ((x - this.x0) / TS) * TAU / this.wave); }
  calc() {
    const S = this.span(this.g.t + this.ph); this.S = S;
    const a = this.wx(S.s0), b = this.wx(S.s1), x0 = Math.min(a, b), x1 = Math.max(a, b);
    const p = this.g.player, px = p ? clamp(p.cx, x0, x1) : (x0 + x1) / 2;
    const ny = this.yAt(px);
    this.dy = ny - this.y; this.dx = 0; this.y = ny; this.x = x0; this.w = Math.max(1, x1 - x0);
    const lit = x1 - x0 > TS * 0.35;
    if (lit && !this.wasLit && this.g.onScreen && this.g.onScreen(this, 80)) TourKit.sfx('chime', 'select', { vol: 0.25, pitch: 1.6 + this.hue * 0.2 });
    this.dead = !lit; this.wasLit = lit;
  }
  update(dt) { unride(this); this.t += dt; this.calc(); }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, S = this.S || this.span(g.t + this.ph), L = this.len, t = g.t;
    if (this.x0 + L * TS < g.camX - 40 || this.x0 > g.camX + Game.viewW + 40) return;
    const pal = [['#5affb0', '#2ad8a0', '#b07aff'], ['#7ae8ff', '#3ab8f0', '#ff7ad8'], ['#c8ff7a', '#6ad84a', '#7ab0ff']][this.hue % 3];
    const lo = Math.min(S.s0, S.s1), hi = Math.max(S.s0, S.s1);
    const lit = u => u >= lo && u <= hi && hi - lo > 0.05;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // 1. the curtain hanging above the ribbon: soft vertical streaks, lit parts only
    for (let u = 0; u < L; u += 0.5) {
      if (!lit(u + 0.25)) continue;
      const x = this.wx(u + 0.25), y = this.yAt(x), h = 34 + 16 * Math.sin(t * 1.3 + u * 1.7);
      const gr = ctx.createLinearGradient(0, y - h, 0, y); gr.addColorStop(0, rgba(pal[2], 0)); gr.addColorStop(1, rgba(pal[0], 0.28));
      ctx.fillStyle = gr; ctx.fillRect(x - TS * 0.26, y - h, TS * 0.52, h);
    }
    // 2. the ribbon: a ghost line where it is dark, a bright inked band where it is lit
    const path = (u0, u1) => { ctx.beginPath(); const n = Math.max(2, Math.ceil((u1 - u0) * 3)); for (let k = 0; k <= n; k++) { const u = u0 + (u1 - u0) * k / n, x = this.wx(u); k ? ctx.lineTo(x, this.yAt(x) + 4) : ctx.moveTo(x, this.yAt(x) + 4); } };
    ctx.setLineDash([4, 6]); ctx.strokeStyle = rgba(pal[0], 0.35); ctx.lineWidth = 2; path(0, L); ctx.stroke(); ctx.setLineDash([]);
    if (hi - lo > 0.05) {
      path(lo, hi); ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.stroke();
      ctx.strokeStyle = pal[1]; ctx.lineWidth = 9; ctx.stroke();
      ctx.strokeStyle = pal[0]; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = '#f4fff8'; ctx.lineWidth = 1.6; ctx.beginPath(); { const n = Math.max(2, Math.ceil((hi - lo) * 3)); for (let k = 0; k <= n; k++) { const u = lo + (hi - lo) * k / n, x = this.wx(u); k ? ctx.lineTo(x, this.yAt(x) + 1.5) : ctx.moveTo(x, this.yAt(x) + 1.5); } } ctx.stroke();
      // the glow (additive)
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba(pal[0], 0.18); ctx.lineWidth = 22; path(lo, hi); ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
    }
    // 3. the tells: the fade front sparkles (before it moves and while it moves); a pulse ribbon flickers
    if (S.tell) {
      if (this.mode === 'pulse') { if (Math.floor(t * 14) % 2 === 0) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; path(0, L); ctx.stroke(); } }
      else if (S.front >= 0) {
        for (let k = 0; k < 7; k++) {
          const u = S.front + ((k * 0.37 + t * 1.7) % 1.6), x = this.wx(Math.min(L, u)), y = this.yAt(x) + 4 - ((t * 40 + k * 13) % 26);
          ctx.fillStyle = k % 2 ? '#ffffff' : pal[2]; ctx.globalAlpha = 0.9; ctx.beginPath(); TourKit.star(ctx, x, y, 4, 1.4, 4); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }
    if (S.head != null) { const x = this.wx(S.head), y = this.yAt(x) + 4; ctx.fillStyle = '#ffffff'; ctx.beginPath(); TourKit.star(ctx, x, y, 9, 3, 4); ctx.fill(); }
    ctx.restore();
  }
}
// a short drifting plank of aurora light (an mplat skin): slides along its path, always lit
const platforms = {
  isRibbonPlank(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w;
    ctx.save(); ctx.lineCap = 'round';
    const gr = ctx.createLinearGradient(0, y - 40, 0, y); gr.addColorStop(0, 'rgba(176,122,255,0)'); gr.addColorStop(1, 'rgba(90,255,176,0.3)');
    ctx.fillStyle = gr; ctx.fillRect(x + 4, y - 40, w - 8, 40);
    ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x + 6, y + 4); ctx.lineTo(x + w - 6, y + 4); ctx.stroke();
    ctx.strokeStyle = '#2ad8a0'; ctx.lineWidth = 9; ctx.stroke(); ctx.strokeStyle = '#5affb0'; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = '#f4fff8'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + 6, y + 1.5); ctx.lineTo(x + w - 6, y + 1.5); ctx.stroke();
    ctx.restore();
  },
  // an ice floe (an mplat skin) for the lagoon's current
  isFloe(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#4ab8e0'; ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x + w, y + 2); ctx.lineTo(x + w - 6, y + 16); ctx.lineTo(x + 6, y + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#eef8fc'; ctx.fillRect(x + 1, y, w - 2, 5); ctx.strokeRect(x + 1, y, w - 2, 5);
    ctx.restore();
  }
};

/* ======================= 17-2: the icebergs ======================= */
const BERG = { max: 0.36, rate: 0.75, roll: 0.9, under: 1.3, rise: 0.7, slide: 3.4 };
class IsBerg extends Ent {
  constructor(g, s) {
    super(g, s, (s.w || 4) * TS, 14);
    this.hx = s.x - TS / 2; this.x = this.hx; this.top = s.y - TS; this.y = this.top; this.ax = (s.ax || 0) * TS; this.sp = s.speed || 0.6; this.ph = s.phase || 0;
    this.seal = s.seal || 0; this.th = this.seal * BERG.max * 0.5; this.state = 'float'; this.st = 0; this.maxT = 0;
    this.isPlatform = true; this.dx = 0; this.dy = 0; this.always = true; this.back = true; this.seed = Math.floor(s.x / TS) % 7;
    this.bob = 0;
  }
  surfY(x) { return this.top + this.bob + Math.tan(this.th) * (x - (this.x + this.w / 2)); }
  update(dt) {
    unride(this); this.t += dt; const g = this.g, p = g.player;
    const ox = this.x, oy = this.y;
    // the current drifts it along (a slow there-and-back)
    if (this.ax) { const k = 0.5 - 0.5 * Math.cos((this.t * this.sp * TS / Math.abs(this.ax)) * Math.PI + this.ph); this.x = this.hx + this.ax * k; }
    this.bob = Math.sin(this.t * 1.6 + this.seed) * 2;
    const on = riding(p, this);
    if (this.state === 'float') {
      // the torque: Brady's weight about the middle, the seal's at its end
      let tq = this.seal * 0.55;
      if (on) tq += (p.cx - (this.x + this.w / 2)) / (this.w / 2) * 1.05;
      const target = clamp(tq * 1.2, -1, 1) * BERG.max;
      this.th = approach(this.th, clamp(target, -BERG.max, BERG.max), BERG.rate * dt);
      const full = Math.abs(this.th) >= BERG.max * 0.9;
      this.maxT = full ? this.maxT + dt : Math.max(0, this.maxT - dt * 2);
      if (full && this.maxT > 0 && this.maxT - dt <= 0) { TourKit.sfx('creak', 'crumble', { vol: 0.5, pitch: 0.6 }); g.parts.text(this.x + this.w / 2, this.top - 30, 'CREAK!', '#c8f0ff'); }
      // on a tilt, Brady slides downhill
      if (on && Math.abs(this.th) > 0.1) p.x += Math.sin(this.th) * BERG.slide * TS * dt * (p.crouch ? 0.5 : 1);
      if (this.maxT > BERG.roll) { this.state = 'roll'; this.st = 0; this.rollDir = sign(this.th) || 1; Sound.play('splash', { vol: 0.7, pitch: 0.7 }); g.shake(4); g.burst(this.x + this.w / 2, this.top + 10, 14, '#c8f4ff', 'spark'); }
    } else if (this.state === 'roll') {
      this.st += dt; if (this.st > BERG.under) { this.state = 'rise'; this.st = 0; this.th = -this.rollDir * 0.2; }
    } else if (this.state === 'rise') {
      this.st += dt; this.th = approach(this.th, 0, dt * 0.6); if (this.st > BERG.rise) { this.state = 'float'; this.maxT = 0; }
    }
    this.dead = this.state !== 'float';
    // the platform's top under Brady (the tilted surface at his x)
    const px = p ? clamp(p.cx, this.x, this.x + this.w) : this.x + this.w / 2;
    this.y = this.surfY(px) + (this.state === 'rise' ? (1 - this.st / BERG.rise) * 14 : 0);
    this.dx = this.x - ox; this.dy = this.y - oy;
  }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, x = this.x, w = this.w, cx = x + w / 2, top = this.top + this.bob, t = this.t;
    if (x + w < g.camX - 60 || x > g.camX + Game.viewW + 60) return;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    let ang = this.th, dip = 0;
    if (this.state === 'roll') { const k = clamp(this.st / 0.5, 0, 1); ang = this.th + this.rollDir * k * Math.PI * 0.9; dip = k * 26; }
    else if (this.state === 'rise') dip = (1 - this.st / BERG.rise) * 14;
    ctx.translate(cx, top + dip); ctx.rotate(ang);
    // the berg: a flat white top, a blue body going down into the water, a deep blue underside
    const hw = w / 2, d = 34 + (this.seed % 3) * 6;
    ctx.fillStyle = '#2a8ac0'; ctx.beginPath(); ctx.moveTo(-hw + 4, 4); ctx.lineTo(-hw + 12, d); ctx.lineTo(hw - 16, d + 6); ctx.lineTo(hw - 4, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7ad0ee'; ctx.beginPath(); ctx.moveTo(-hw, 0); ctx.lineTo(hw, 0); ctx.lineTo(hw - 6, 16); ctx.lineTo(-hw + 6, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f4fcff'; ctx.beginPath(); ctx.moveTo(-hw, 0); ctx.lineTo(-hw + 6, -6); ctx.lineTo(hw - 8, -6); ctx.lineTo(hw, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-hw + 10, 4, 10, 3); ctx.fillRect(hw - 30, 8, 14, 2);
    // the crack, growing as it creaks at full tilt
    if (this.maxT > 0 && this.state === 'float') { const k = clamp(this.maxT / BERG.roll, 0, 1), sx = sign(this.th) * hw * 0.3; ctx.strokeStyle = '#14507a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, -6); ctx.lineTo(sx + 5, 2 + k * 6); ctx.lineTo(sx - 3, 6 + k * 14); ctx.lineTo(sx + 4, 10 + k * 22); ctx.stroke(); ctx.translate(Math.sin(t * 60) * k * 1.5, 0); }
    // the seal lying on its end (a counterweight)
    if (this.seal) {
      const sx = this.seal * (hw - 16);
      ctx.save(); ctx.translate(sx, -6); ctx.scale(-this.seal, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
      ctx.fillStyle = '#8a8a96'; ctx.beginPath(); ctx.ellipse(0, -7, 15, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-13, -11, 6.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6a6a76'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(-2 + k * 4, -9 + (k % 2) * 2, 1.2, 0, TAU); ctx.fill(); }
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-15, -12, 1.4, 0, TAU); ctx.arc(-11, -12, 1.4, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(21, -10); ctx.lineTo(20, -3); ctx.closePath(); ctx.fillStyle = '#7a7a86'; ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    // ripples on the water at its waterline
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 2; k++) { const ph = (t * 0.8 + k * 0.5) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.ellipse(cx, this.top + TS + 4, hw + 6 + ph * 16, 4 + ph * 2, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
}

/* ======================= 17-3: the rift's sliding slabs ======================= */
const RIFT = { tell: 1.0, slide: 0.8 };
class IsPlate extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS);
    this.A = s.A; this.B = s.B; this.gi = s.g || 0; this.tile = s.tile != null ? s.tile : T.GROUND; this.period = s.period || 5; this.ph = s.phase || 0; this.look = s.look || 'slab';
    this.isPlatform = true; this.dx = 0; this.dy = 0; this.always = true; this.back = true; this.solidTop = false;
    this.k = this.atB() ? 1 : 0; this.at = this.k; this.state = 'rest';
    this.setRect(this.at ? this.A : null, this.at ? this.B : this.A, true);
    this.place();
  }
  // which spot the clock says (the first half of the period at A, the second at B)
  phaseT() { const P = this.period; return (((this.g.t + this.ph) % P) + P) % P; }
  atB() { return this.phaseT() >= this.period / 2; }
  // time until the next move starts (the tell runs before it)
  toNext() { const k = this.phaseT(), h = this.period / 2; return (k < h ? h : this.period) - k; }
  setRect(clearR, fillR, quiet) {
    const g = this.g, f = (r, t) => { for (let y = r[1]; y <= r[3]; y++) for (let x = r[0]; x <= r[2]; x++) g.setTile(x, y, t); };
    if (clearR) f(clearR, T.EMPTY);
    if (fillR) f(fillR, this.tile);
    const A = g.area; A.toggleState = A.toggleState || {}; A.toggleState[this.gi] = this.at === 1;
  }
  rectPx(r) { return { x: r[0] * TS, y: r[1] * TS, w: (r[2] - r[0] + 1) * TS, h: (r[3] - r[1] + 1) * TS }; }
  place() { const a = this.rectPx(this.A), b = this.rectPx(this.B), k = this.k; const nx = lerp(a.x, b.x, k), ny = lerp(a.y, b.y, k); this.dx = nx - this.x; this.dy = ny - this.y; this.x = nx; this.y = ny; this.w = a.w; this.h = a.h; }
  update(dt) {
    unride(this); this.t += dt; const g = this.g, p = g.player;
    const want = this.atB() ? 1 : 0;
    this.tellOn = this.state === 'rest' && this.toNext() < RIFT.tell;
    if (this.tellOn && !this.rumbled && g.onScreen(this, 200)) { this.rumbled = true; TourKit.sfx('rumble', 'crumble', { vol: 0.45, pitch: 0.5 }); }
    if (this.state === 'rest' && want !== this.at) {
      // start the slide: the tiles go, the slab itself carries whoever stands on it
      this.state = 'slide'; this.st = 0; this.rumbled = false;
      this.setRect(this.at ? this.B : this.A, null);
      this.dead = false;
    }
    if (this.state === 'slide') {
      this.st += dt; const u = clamp(this.st / RIFT.slide, 0, 1), e = u * u * (3 - 2 * u);
      this.k = want ? e : 1 - e; this.place();
      if (g.onScreen(this, 100) && Math.random() < 0.4) g.burst(this.x + Math.random() * this.w, this.y, 1, '#8a8a7a', 'dust');
      if (u >= 1) {
        this.state = 'rest'; this.at = want; this.k = want; this.place(); this.dx = this.dy = 0;
        const R = want ? this.B : this.A; this.setRect(null, R);
        if (g.onScreen(this, 100)) { g.shake(3); TourKit.sfx('slam', 'stomp', { vol: 0.5, pitch: 0.5 }); }
        // closing on Brady: a foot's depth lifts him on top; deeper crushes
        if (p && !p.dead && p.state === 'play') {
          const r = this.rectPx(R);
          if (overlap(p, r)) { if (p.y + p.h - r.y < 14) { p.y = r.y - p.h - 0.5; p.vy = Math.min(p.vy, 0); } else p.die('crush'); }
        }
      }
    }
    this.dead = this.state !== 'slide';
  }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, R = this.at ? this.B : this.A, x = this.x, y = this.y, w = this.w, h = this.h, t = this.t;
    if (x + w < g.camX - 80 || x > g.camX + Game.viewW + 80) return;
    ctx.save();
    const sh = this.tellOn ? Math.sin(t * 70) * 2 : 0;
    // while resting the tiles draw the slab; this draws its moving body, the glowing seam and the rumble tell
    if (this.state === 'slide') {
      ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.fillStyle = '#34323c'; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
      if (this.tile === T.HARD) { for (let k = 0; k < w / TS; k++) { ctx.fillStyle = '#44444f'; ctx.fillRect(x + k * TS + 3, y, 10, h); ctx.fillRect(x + k * TS + 18, y, 10, h); } ctx.fillStyle = '#5a5a68'; for (let k = 0; k < w / TS; k++) ctx.fillRect(x + k * TS + 2, y + h - 6, TS - 4, 4); }
      else { ctx.fillStyle = KIT.MOSS; ctx.fillRect(x, y, w, 8); ctx.fillStyle = KIT.MOSS_HI; ctx.fillRect(x, y, w, 3); }
      ctx.fillStyle = '#24222a'; for (let k = 1; k < w / TS; k++) ctx.fillRect(x + k * TS - 1, y + 10, 2, h - 12);
    }
    if (this.tellOn || this.state === 'slide') {
      // the crack's edge glows red-orange, dust trickles
      const r = this.rectPx(this.state === 'slide' ? (this.at ? this.B : this.A) : R);
      const k = this.state === 'slide' ? 1 : 1 - this.toNext() / RIFT.tell;
      ctx.fillStyle = 'rgba(255,120,40,' + (0.35 + 0.35 * Math.sin(t * 20)) * k + ')';
      ctx.fillRect(r.x - 3 + sh, r.y + 6, 4, r.h - 6); ctx.fillRect(r.x + r.w - 1 + sh, r.y + 6, 4, r.h - 6);
      if (Math.random() < 0.5) g.burst(r.x + Math.random() * r.w, r.y + 2, 1, '#a89a80', 'dust');
      if (this.tellOn && Math.floor(t * 8) % 2 === 0) { ctx.fillStyle = '#ffd84a'; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('!', r.x + r.w / 2, r.y - 10); }
    }
    ctx.restore();
  }
}

/* ======================= 17-4: the organ-pipe columns ======================= */
const NOTES = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16];
class IsPipe extends Ent {
  constructor(g, s) {
    super(g, s, (s.w || 2) * TS, TS);
    this.x = s.x - TS / 2; this.rest = s.y - TS; this.y = this.rest; this.travel = (s.lo || 3) * TS; this.kind = s.kind || 'sink';
    this.sink = (s.speed || 1.6) * TS; this.riseV = (s.rise || 2.4) * TS; this.note = s.note != null ? s.note : Math.floor(s.x / TS) % NOTES.length;
    this.h = (g.area.H + 2) * TS - this.rest; this.isPlatform = true; this.dx = 0; this.dy = 0; this.always = true; this.customCollide = true; this.back = true;
    this.pressed = false; this.glow = 0;
  }
  update(dt) {
    unride(this); this.t += dt; const p = this.g.player, on = riding(p, this), oy = this.y;
    if (on && !this.pressed) { this.glow = 1; Sound.play('select', { vol: 0.35, pitch: Math.pow(2, NOTES[this.note % NOTES.length] / 12) * 0.5 }); }
    this.pressed = on;
    const lo = this.kind === 'lift' ? this.rest - this.travel : this.rest + this.travel;
    if (on) this.y = approach(this.y, lo, (this.kind === 'lift' ? this.riseV : this.sink) * dt);
    else this.y = approach(this.y, this.rest, (this.kind === 'lift' ? this.sink : this.riseV) * dt);
    this.dy = this.y - oy; this.dx = 0; this.h = (this.g.area.H + 2) * TS - this.y;
    this.glow = Math.max(0, this.glow - dt * 1.5);
  }
  // its sides are solid: Brady is pushed out sideways (never stands inside a column)
  collidePlayer(p) {
    if (p.x + p.w <= this.x || p.x >= this.x + this.w || p.y + p.h <= this.y + 10 || p.y >= this.y + this.h) return null;
    const l = p.x + p.w - this.x, r = this.x + this.w - p.x;
    if (l < r) { p.x = this.x - p.w; if (p.vx > 0) p.vx = 0; } else { p.x = this.x + this.w; if (p.vx < 0) p.vx = 0; }
    return null;
  }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, x = this.x, y = this.y, w = this.w, bot = g.camY + Game.viewH + 40;
    if (x + w < g.camX - 20 || x > g.camX + Game.viewW + 20 || y > bot) return;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    const n = Math.max(1, Math.round(w / (TS * 0.7)));
    // the column: n faceted prisms side by side, darker toward the base, the hexagonal tops
    for (let k = 0; k < n; k++) {
      const cx0 = x + k * w / n, cw = w / n;
      const gr = ctx.createLinearGradient(0, y, 0, Math.min(bot, y + 400)); gr.addColorStop(0, '#5a5664'); gr.addColorStop(1, '#1e1a22');
      ctx.fillStyle = gr; ctx.fillRect(cx0, y + 4, cw, bot - y);
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(cx0 + 3, y + 6, cw * 0.25, bot - y);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(cx0 + cw * 0.72, y + 6, cw * 0.28, bot - y);
      ctx.strokeRect(cx0, y + 4, cw, bot - y);
      IsArt.hexCap(ctx, cx0, y, cw, this.glow > 0 ? '#ffd890' : this.kind === 'lift' ? '#7ab0c8' : '#8a8494');
      ctx.beginPath(); ctx.moveTo(cx0, y + 4); ctx.lineTo(cx0 + cw * 0.22, y); ctx.lineTo(cx0 + cw * 0.78, y); ctx.lineTo(cx0 + cw, y + 4); ctx.stroke();
    }
    // a 'lift' column has an up-arrow carved in it; a sink column shows how far it can go (a notch)
    if (this.kind === 'lift') { ctx.fillStyle = '#9ad0e8'; ctx.beginPath(); ctx.moveTo(x + w / 2, y + 16); ctx.lineTo(x + w / 2 - 6, y + 26); ctx.lineTo(x + w / 2 + 6, y + 26); ctx.closePath(); ctx.fill(); }
    if (this.glow > 0) { ctx.fillStyle = 'rgba(255,220,150,' + (this.glow * 0.8).toFixed(3) + ')'; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('♪', x + w / 2 + Math.sin(this.t * 6) * 4, y - 14 - (1 - this.glow) * 20); }
    ctx.restore();
  }
}
// a lava blob: it bubbles in the lake (the tell, 0.8 s: bubbles and a glow), leaps up in an arc and falls back in
class IsEmber extends Ent {
  constructor(g, s) {
    super(g, s, 22, 22); this.enemy = true; this.fiery = true; this.homeY = s.y - 14; this.y = this.homeY; this.x = s.x - 11;
    this.jumpV = (s.jump || 15) * TS; this.every = s.every || 2.6; this.wait = (s.delay || 0) + 1; this.state = 'wait'; this.hx = this.x; this.drift = (s.drift || 0) * TS;
  }
  update(dt) {
    this.t += dt;
    if (this.state === 'wait') { this.wait -= dt; if (this.wait <= 0.8 && !this.told) { this.told = true; if (this.g.onScreen(this, 60)) TourKit.sfx('bubble', 'select', { vol: 0.3, pitch: 0.5 }); } if (this.wait <= 0) { this.state = 'jump'; this.vy = -this.jumpV; this.vx = this.drift; this.told = false; } return; }
    this.vy += PHYS.gDown * 0.5 * dt; this.y += this.vy * dt; this.x += this.vx * dt;
    if (this.vy > 0 && this.y >= this.homeY) { this.y = this.homeY; this.x = this.hx; this.state = 'wait'; this.wait = this.every; if (this.g.onScreen(this)) this.g.burst(this.cx, this.y + 10, 8, '#ff8a2a', 'spark'); }
  }
  hit(kind) { return kind === 'spin' ? 'bounce' : false; }
  touchPlayer(p) { if (this.state !== 'wait') p.hurt(this); }
  draw(ctx) {
    const x = this.cx, y = this.cy, t = this.t;
    if (this.state === 'wait') {
      if (this.wait < 0.8) { const k = 1 - this.wait / 0.8; ctx.save(); ctx.fillStyle = 'rgba(255,200,80,' + (0.3 + 0.4 * k) + ')'; ctx.beginPath(); ctx.ellipse(x, this.homeY + 16, 14 + k * 6, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffd23f'; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.arc(x - 8 + q * 8, this.homeY + 14 - ((t * 30 + q * 7) % 10), 2.5 * k + 1, 0, TAU); ctx.fill(); } ctx.restore(); }
      return;
    }
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(255,120,30,0.35)'; ctx.beginPath(); ctx.arc(x, y, 18, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(x, y, 11, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x - 3, y - 3, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x - 4, y - 1, 1.6, 0, TAU); ctx.arc(x + 3, y - 1, 1.6, 0, TAU); ctx.fill();
    if (this.vy > 0) { ctx.fillStyle = '#ff9a3a'; ctx.beginPath(); ctx.moveTo(x - 8, y - 6); ctx.quadraticCurveTo(x, y - 26, x + 8, y - 6); ctx.fill(); }
    ctx.restore();
  }
  get light() { return this.state !== 'wait' ? { r: 70, c: 'rgba(255,140,40,' } : null; }
}

/* ======================= 17-6: the hidden folk ======================= */
// does Brady look away from the thing at world x (its centre)? (on it counts as not looking)
const lookingAway = (p, x) => p && (x - p.cx) * p.facing < 0;
class IsShyEye extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; this.always = true; this.told = false; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player; this.x = g.camX; this.y = g.camY;
    if (!p) return;
    g.isShyOn = true;
    if (Input.actionPressed && p.state === 'play' && !p.dead) {
      Input.actionPressed = false; p.isLookBack = !p.isLookBack; if (p.isLookBack) p.isShyFace = -p.facing; else p.facing = -(p.isShyFace || -1);
      TourKit.sfx('glance', 'select', { vol: 0.35, pitch: p.isLookBack ? 1.4 : 1.1 });
      g.parts.text(p.cx, p.y - 16, p.isLookBack ? 'LOOKING BACK' : 'LOOKING AHEAD', '#ffe28a');
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, p = g.player; if (!p || !p.isLookBack) return;
    // a little eye over his head looking the other way
    const x = p.cx, y = p.y - 26 + Math.sin(this.t * 4) * 2;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, y, 8, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + p.facing * 3, y, 2.4, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
// Brady walks either way while he looks back over his shoulder (in an area with the eye): his gaze stays put
{
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g, shy = g && g.isShyOn && this.isLookBack;
    const r = up0.call(this, dt, inp);
    // looking back, his gaze stays fixed the way he turned it, whichever way he walks
    if (shy && this.state === 'play' && !this.dead) this.facing = this.isShyFace || -1;
    return r;
  };
}
class IsShyPlat extends Ent {
  constructor(g, s) {
    super(g, s, (s.w || 3) * TS, 12); this.x = s.x - TS / 2; this.y = s.y - TS; this.isPlatform = true; this.dx = 0; this.dy = 0; this.always = true; this.back = true;
    this.k = 0; this.bold = !!s.bold; this.col = this.bold ? '#f4f0e8' : ['#d83a2a', '#3a7ad8', '#2a8a4a', '#f2c84a'][Math.floor(s.x / TS) % 4];
  }
  update(dt) {
    unride(this); this.t += dt; const p = this.g.player;
    const on = riding(p, this) || (this.bold ? !!p && !lookingAway(p, this.cx) : lookingAway(p, this.cx));
    this.dead = !on; this.k = approach(this.k, on ? 1 : 0, dt * 8);
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, k = this.k, t = this.t;
    ctx.save();
    if (k < 0.99) { ctx.strokeStyle = 'rgba(255,240,200,' + (0.5 * (1 - k)).toFixed(3) + ')'; ctx.setLineDash([3, 5]); ctx.lineWidth = 2; ctx.strokeRect(x + 2, y, w - 4, 10); ctx.setLineDash([]); for (let q = 0; q < 3; q++) { ctx.fillStyle = 'rgba(255,240,200,' + (0.7 * (1 - k)).toFixed(3) + ')'; ctx.beginPath(); TourKit.star(ctx, x + ((q * 37 + t * 20) % w), y - 4 - ((t * 15 + q * 9) % 14), 3, 1, 4); ctx.fill(); } }
    if (k > 0.01) {
      ctx.globalAlpha = k; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      // painted planks on little stone legs, the folk's colours
      ctx.fillStyle = this.col; rr(ctx, x + 1, y, w - 2, 11, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 4, y + 2, w - 8, 2);
      ctx.fillStyle = INK; for (let q = x + TS; q < x + w - 4; q += TS) ctx.fillRect(q, y + 2, 1.5, 8);
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + 6, y + 6, 1.6, 0, TAU); ctx.arc(x + w - 6, y + 6, 1.6, 0, TAU); ctx.fill();
      if (this.bold) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 5.5, 7, 4, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#3a7ad8'; ctx.beginPath(); ctx.arc(x + w / 2, y + 5.5, 2.2, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }
}
// a folk gate: a little wall of painted boards that is only there while Brady looks AT it (walk through backwards)
class IsShyWall extends Ent {
  constructor(g, s) {
    super(g, s, TS, (s.h || 3) * TS); this.tx = Math.floor(s.x / TS); this.ty1 = Math.floor((s.y - 1) / TS); this.ty0 = this.ty1 - (s.h || 3) + 1;
    this.x = this.tx * TS; this.y = this.ty0 * TS; this.always = true; this.back = true; this.solid = null; this.k = 1;
  }
  setSolid(on) {
    if (this.solid === on) return; this.solid = on;
    const p = this.g.player;
    for (let y = this.ty0; y <= this.ty1; y++) this.g.setTile(this.tx, y, on ? T.HARD : T.EMPTY);
    // never closes on Brady: if he is inside it when he turns to face it, he is nudged out the way he came
    if (on && p && overlap(p, this)) p.x = p.facing > 0 ? this.x - p.w - 0.5 : this.x + this.w + 0.5;
  }
  update(dt) { this.t += dt; const p = this.g.player; const on = !(p && lookingAway(p, this.cx)); this.setSolid(on); this.k = approach(this.k, on ? 1 : 0, dt * 8); }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, h = this.h, k = this.k;
    ctx.save(); ctx.globalAlpha = 0.25 + 0.75 * k; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    for (let q = 0; q < h / TS; q++) { ctx.fillStyle = ['#2a8a4a', '#d83a2a', '#3a7ad8'][q % 3]; rr(ctx, x + 3, y + q * TS + 2, TS - 6, TS - 4, 3); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + TS / 2, y + 10, 3, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

/* ======================= pieces (legend ['piece', name, opts]: st.x / st.gy = the letter's column / the row under it) ======================= */
const pieces = {
  // an aurora ribbon starting at the letter: { len, mode, dir, hold, dark, speed, phase, amp, wave, hue }
  ribbon(st, o) {
    const B = st.B, y = st.gy - 1, len = o.len || 8;
    B.spawn('isRibbon', st.x, y, Object.assign({}, o, { len }));
    for (let k = 0; k < len; k++) B.ghosts.push([st.x + k, y]);
    return st.x;
  },
  // a drifting plank of light: { ax, ay, w, speed, phase }
  plank(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1, ax = o.ax || 0, ay = o.ay || 0, pw = o.w || 3;
    B.spawn('mplat', x, y - 1, { pw, ax: ax * TS, ay: ay * TS, speed: o.speed || 1.4, skin: o.skin || 'isRibbonPlank', phase: o.phase || 0 });
    const n = Math.max(Math.abs(ax), Math.abs(ay));
    for (let q = 0; q <= n; q++) { const gx = x + Math.round(ax * q / (n || 1)), gy = y + Math.round(ay * q / (n || 1)); for (let k = 0; k < pw; k++) B.ghosts.push([gx + k, gy]); }
    return st.x;
  },
  // an iceberg whose top is on the letter's row: { w, seal: -1 | 0 | 1, ax (drift tiles), speed, phase }
  berg(st, o) {
    const B = st.B, y = st.gy - 1, w = o.w || 4, ax = o.ax || 0;
    B.spawn('isBerg', st.x, y, Object.assign({}, o, { w }));
    const lo = Math.min(0, ax), hi = Math.max(0, ax);
    for (let q = lo; q <= hi; q++) for (let k = 0; k < w; k++) B.ghosts.push([st.x + q + k, y]);
    return st.x;
  },
  // a rift slab: the letter is rect A's top-left (w x h); B is A moved by (dx, dy). { g, period, phase, tile }
  plate(st, o) {
    const B = st.B, w = o.w || 3, h = o.h || 1, x = st.x, y = st.gy - 1, g = o.g || 0, tile = T[o.tile || 'GROUND'];
    const A = [x, y, x + w - 1, y + h - 1, tile], Bt = [x + (o.dx || 0), y + (o.dy || 0), x + (o.dx || 0) + w - 1, y + (o.dy || 0) + h - 1, tile];
    for (let yy = A[1]; yy <= A[3]; yy++) for (let xx = A[0]; xx <= A[2]; xx++) B.set(xx, yy, tile);
    for (let yy = Bt[1]; yy <= Bt[3]; yy++) for (let xx = Bt[0]; xx <= Bt[2]; xx++) if (!(xx >= A[0] && xx <= A[2] && yy >= A[1] && yy <= A[3])) B.set(xx, yy, T.EMPTY);
    const G = B.toggles && B.toggles[g];
    if (G) { G.A.push(A); G.B.push(Bt); } else B.toggle(g, [A], [Bt], { kind: 'rift', auto: true });
    B.spawn('isPlate', x, y, { g, A: A.slice(0, 4), B: Bt.slice(0, 4), tile, period: o.period || 5, phase: o.phase || 0 });
    // the checker rides it: one-way edges from each cell on top at one spot to the same cell at the other
    if (o.ride !== false) for (let k = 0; k < w; k++) { B.edge([x + k, y - 1], [x + k + (o.dx || 0), y - 1 + (o.dy || 0)]); B.edge([x + k + (o.dx || 0), y - 1 + (o.dy || 0)], [x + k, y - 1]); }
    return st.x;
  },
  // an organ-pipe column whose rest top is the letter's row: { w, lo, speed, rise, kind: 'sink' | 'lift', note }
  pipe(st, o) {
    const B = st.B, y = st.gy - 1, w = o.w || 2;
    B.spawn('isPipe', st.x, y, Object.assign({}, o, { w }));
    for (let k = 0; k < w; k++) { B.ghosts.push([st.x + k, y]); if (o.kind === 'lift') { const up = y - (o.lo || 3); B.ghosts.push([st.x + k, up]); B.edge([st.x + k, y - 1], [st.x + k, up - 1]); } }
    return st.x;
  },
  ember(st, o) { st.B.spawn('isEmber', st.x, st.gy - 1, o); return st.x; },
  // the hidden folk's plank (exists only while Brady looks away from it): { w }
  shy(st, o) { const B = st.B, y = st.gy - 1, w = o.w || 3; B.spawn('isShyPlat', st.x, y, { w, bold: !!o.bold }); for (let k = 0; k < w; k++) B.ghosts.push([st.x + k, y]); return st.x; },
  // a folk gate h rows high whose bottom is the letter (blocks only while Brady looks at it)
  shyWall(st, o) { st.B.spawn('isShyWall', st.x, st.gy - 1, { h: o.h || 3 }); return st.x; },
  shyEye(st, o) { st.B.spawn('isShyEye', st.x, st.gy - 1, {}); return st.x; }
};
for (const k in pieces) Tour.pieces['is.' + k] = pieces[k];
Object.assign(PlatformArt, platforms);
Object.assign(ENTITY_TYPES, { isRibbon: IsRibbon, isBerg: IsBerg, isPlate: IsPlate, isPipe: IsPipe, isEmber: IsEmber, isShyEye: IsShyEye, isShyPlat: IsShyPlat, isShyWall: IsShyWall });
Object.assign(Tour.isKit, { AURORA, BERG, RIFT, IsRibbon, IsBerg, IsPlate, IsPipe, lookingAway });
})();
