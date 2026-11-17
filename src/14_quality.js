/* ============================================================
   Graphics tiers and the frame-rate readout (docs/PERFORMANCE.md).

   QualityTier: what the game draws, from "everything" down to
   "the essentials", in small steps (cut levels 0..7), cut in this
   order when frames run long:
     1  trip effects: no breathing copy, no colour sheen, no fractal
        (a gradient wash instead); the bloom is sampled less often
     2  ambient particles and weather at half density; code-drawn
        enemies and bosses re-inked at 30 Hz (the frame between
        blits the finished picture where the enemy now is), in a
        scratch area fitted to what their art was seen to reach
     3  the light keylines and the form shading of code-drawn art
        (Brady keeps his keyline; every dark ink line stays)
     4  the bloom, the vignette, the haze between backdrop layers, the sky's light rays
     5  the farthest parallax layer
     6  internal resolution 2x -> 1.75x
     7  internal resolution -> 1.5x (never lower on a hi-dpi screen)
   Named tiers (Settings and pause: GRAPHICS): HIGH = 0, MEDIUM = 2,
   LOW = 5. AUTO (the default) starts at the level the last session
   settled on (one step better, to re-check) and moves with
   hysteresis: down after two slow 1 s windows in a row (more than
   12 % of frames over 1.45x the display's frame period, measured on
   the real frame interval, so it sees the GPU too), up only after a
   long calm (15 s, doubled after every failed try, at most two tries
   per level per session). Brady, enemies, hazards and pickups keep
   their ink at every tier.
   ============================================================ */
const QualityTier = {
  level: 0, auto: true, NAMES: ['HIGH', 'MEDIUM', 'LOW'], NAMED: { high: 0, medium: 2, low: 5 }, MAX: 7,
  setting() { const s = Save.data && Save.data.settings && Save.data.settings.gfx; return s && (s === 'auto' || this.NAMED[s] != null) ? s : 'auto'; },
  label() { const s = this.setting(); return s === 'auto' ? 'AUTO' : s.toUpperCase(); },
  name() { return this.level >= 5 ? 'LOW' : this.level >= 2 ? 'MEDIUM' : 'HIGH'; },
  cycle() {
    const order = ['auto', 'high', 'medium', 'low'], st = Save.data.settings;
    st.gfx = order[(order.indexOf(this.setting()) + 1) % order.length]; Save.save(); this.init();
  },
  // the game's own settings decide; tests pin (tools/sbw_perf_test.js, the screenshot tools) through pin()
  init() {
    const s = this.setting();
    this.auto = s === 'auto';
    const saved = Save.data && Save.data.settings && Save.data.settings.gfxAuto || 0;
    this.reset();
    this.set(this.auto ? Math.max(0, Math.min(5, saved - 1)) : this.NAMED[s]);
  },
  pin(level) { this.auto = false; this.reset(); this.set(level || 0); },
  reset() { this.win = []; this.slowWins = 0; this.calm = 0; this.cool = 1; this.probe = null; this.fails = {}; this.upWait = 15; this.ivs = []; },
  // effective settings of the current cut level
  partK: 1, weatherK: 1, bloomEvery: 2, skipFar: 0, vignette: true, bloom: true, noFog: false,
  set(L) {
    L = Math.max(0, Math.min(this.MAX, L | 0));
    const prev = this.level; this.level = L;
    if (typeof Game !== 'undefined') Game.quality = L >= 1 ? 0 : 1;
    this.bloomEvery = L >= 1 ? 4 : 2;
    this.partK = L >= 2 ? 0.5 : 1; this.weatherK = L >= 2 ? 0.5 : 1;
    if (typeof Ink !== 'undefined') { Ink.every = L >= 2 ? 2 : 1; Ink.fit = L >= 2; Ink.rims = L < 3; Ink.form = L < 3; }
    this.bloom = L < 4; this.vignette = L < 4; this.noFog = L >= 4;
    this.skipFar = L >= 5 ? 1 : 0;
    const cap = L >= 7 ? 1.5 : L >= 6 ? 1.75 : null;
    if (typeof Game !== 'undefined' && Game.canvas && (Game.dprCap || null) !== cap) { Game.dprCap = cap; Game.resize(); }
    if (this.auto && L !== prev && Save.data && Save.data.settings) Save.data.settings.gfxAuto = L;
  },
  /* called by Game.frame with the real time since the last frame (s); returns true when it handled the adaptive
     quality (the old 2-step switch in 99_main.js then stays out of it) */
  frame(raw) {
    if (typeof Ink !== 'undefined') Ink.frame++;
    if (!this.auto) return true;
    if (typeof navigator !== 'undefined' && navigator.webdriver && !window.__sbwAutoTier) return true;   // tests pin the look
    const sc = Game.scene;
    const live = typeof Play !== 'undefined' && sc instanceof Play ? !sc.paused && sc.state === 'play' && !(sc.fade && sc.fade.a > 0.01) : !!(sc && sc.ow);
    const ms = raw * 1000;
    if (!live || ms <= 0 || ms > 250) { this.win.length = 0; return true; }
    // the display's frame period: the fast quarter of recent intervals (60 Hz: 16.7 ms; 120 Hz: 8.3 ms)
    const iv = this.ivs; iv.push(ms); if (iv.length > 240) iv.shift();
    if (!this.period || iv.length % 60 === 0) { const s = iv.slice().sort((a, b) => a - b); const q = s[Math.floor(s.length * 0.25)]; this.period = q < 11 ? 1000 / 120 : q < 14 ? 1000 / 90 : 1000 / 60; }
    if (this.cool > 0) { this.cool -= raw; this.win.length = 0; return true; }
    const w = this.win; w.push(ms);
    let span = 0; for (let i = 0; i < w.length; i++) span += w[i];
    if (span < 1000) return true;
    let slow = 0; const lim = this.period * 1.45; for (let i = 0; i < w.length; i++) if (w[i] > lim) slow++;
    const frac = slow / w.length, meanK = span / w.length / this.period; w.length = 0;
    if (frac > 0.12 || meanK > 1.18) {
      this.calm = 0;
      if (++this.slowWins >= 2 && this.level < this.MAX && !(Game.dpr <= ((window.devicePixelRatio || 1) >= 2 ? 1.5 : 1) && this.level >= 5)) {
        if (this.probe && this.probe.to === this.level) { this.fails[this.level] = (this.fails[this.level] || 0) + 1; this.upWait = Math.min(120, this.upWait * 2); }
        this.probe = null; this.slowWins = 0; this.cool = 1; this.set(this.level + 1);
      }
    } else {
      this.slowWins = 0;
      if (frac < 0.02 && meanK < 1.06) this.calm += span / 1000; else this.calm = 0;
      if (this.probe && this.calm > 4) this.probe = null;   // the better level held
      if (this.level > 0 && this.calm >= this.upWait && (this.fails[this.level - 1] || 0) < 2) { this.calm = 0; this.probe = { to: this.level - 1 }; this.cool = 2; this.set(this.level - 1); }
    }
    return true;
  }
};

/* PerfHud: an optional frame-rate readout (Settings: FPS COUNTER), off by default, so Brady can read numbers off his
   phone (bottom centre of the screen): frames per second over the last second, the slowest frame in it, the game's own work per frame (JS: update +
   drawing commands; Safari draws them on another thread, so a low FPS with low work means the drawing is the cost),
   the graphics tier and the canvas resolution. The text is drawn into a small canvas twice a second. */
const PerfHud = {
  on: false, t0: 0, t1: 0, t2: 0, n: 0, sum: 0, work: 0, worst: 0, last: 0, txt: '', c: null,
  sync() { this.on = !!(Save.data && Save.data.settings && Save.data.settings.fps); if (typeof Game !== 'undefined') { if (this.on && !Game.perf) Game.perf = this; else if (!this.on && Game.perf === this) Game.perf = null; } },
  frame(raw, steps) {
    const ms = raw * 1000; if (ms > 0 && ms < 1000) { this.n++; this.sum += ms; if (ms > this.worst) this.worst = ms; }
    this.work += this.t2 - this.t0;
    const now = this.t2;
    if (now - this.last >= 500 && this.n) {
      const fps = 1000 / (this.sum / this.n);
      this.txt = `${Math.round(fps)} FPS  ·  worst ${Math.round(this.worst)} ms  ·  work ${(this.work / this.n).toFixed(1)} ms  ·  ${typeof QualityTier !== 'undefined' ? QualityTier.name() + (QualityTier.auto ? ' (AUTO ' + QualityTier.level + ')' : '') : ''}  ·  ${Game.dpr}x`;
      this.n = 0; this.sum = 0; this.work = 0; this.worst = 0; this.last = now; this.dirty = true;
    }
  },
  draw(ctx) {
    if (!this.on || !this.txt) return;
    if (!this.c) this.c = makeCanvas(1, 1);
    const k = Game.dpr;
    if (this.dirty) {
      const x = this.c.getContext('2d'); x.font = `${11 * k}px ${FONT_UI}`;
      const w = Math.ceil(x.measureText(this.txt).width + 14 * k), h = Math.ceil(18 * k);
      if (this.c.width !== w || this.c.height !== h) { this.c.width = w; this.c.height = h; }
      x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h);
      x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(0, 0, w, h);
      x.font = `${11 * k}px ${FONT_UI}`; x.textBaseline = 'middle'; x.fillStyle = '#9dffb0'; x.fillText(this.txt, 7 * k, h / 2);
      this.dirty = false;
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    // bottom centre: between the stick and the buttons, clear of the HUD
    ctx.drawImage(this.c, Math.round((Game.canvas.width - this.c.width) / 2), Math.round(Game.canvas.height - this.c.height - (Math.max(4, typeof insets !== 'undefined' ? insets.b : 0) + 4) * k));
    ctx.restore();
  }
};
