/* ============================================================
   Post-processing (Canvas 2D): bloom, color grading, psychedelic
   trip distortion, dust storms, and colored glow sprites.
   ============================================================ */
const PostFX = {
  glowCache: {},
  glow(col) {
    // a soft radial light sprite tinted with `col`, cached per colour
    let c = this.glowCache[col];
    if (c) return c;
    c = makeCanvas(64, 64);
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, rgba(col, 0.9)); g.addColorStop(0.25, rgba(col, 0.45)); g.addColorStop(0.6, rgba(col, 0.12)); g.addColorStop(1, rgba(col, 0));
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    this.glowCache[col] = c;
    return c;
  },
  ensure(name, w, h) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    let c = this[name];
    if (!c || c.width !== w || c.height !== h) { c = makeCanvas(w, h); this[name] = c; }
    return c;
  },
  // called with ctx transformed so (0,0) is the game view's top-left in device px
  apply(ctx, play, W, H, gx, gy) {
    const th = THEMES[play.themeKey] || {};
    const hq = Game.quality >= 1;
    // --- psychedelic trip: wavy strips + rainbow overlay
    const trip = Math.min(1, (play.trip || 0)) + (th.trippy ? 0.25 : 0);
    if (trip > 0.02 && hq) {
      const tmp = this.ensure('tmp', W, H);
      const tx = tmp.getContext('2d');
      tx.clearRect(0, 0, W, H);
      tx.drawImage(Game.canvas, gx, gy, W, H, 0, 0, W, H);
      const strip = Math.max(4, Math.round(10 * Game.S));
      const amp = 9 * Game.S * trip;
      for (let y = 0; y < H; y += strip) {
        const off = Math.sin(y * 0.012 / Game.S * 2 + play.t * 5) * amp;
        ctx.drawImage(tmp, 0, y, W, strip, off, y, W, strip);
      }
    }
    // --- bloom: blur a darkened, squared copy and add it back with 'screen'
    const bloom = (th.bloom || 0.15) * (Game.quality >= 1 ? 1 : 0.6);
    const QT = typeof QualityTier !== 'undefined' ? QualityTier : null;
    if (bloom > 0.02 && (!QT || QT.bloom)) {
      const sw = Math.max(8, Math.round(W / 6)), sh = Math.max(8, Math.round(H / 6));
      const fresh = !this.bloomA || this.bloomA.width !== sw || this.bloomA.height !== sh || this.bloomTheme !== play.themeKey || this.bloomK !== bloom;
      const a = this.ensure('bloomA', sw, sh), b = this.ensure('bloomB', Math.max(4, sw >> 1), Math.max(4, sh >> 1)), c = this.ensure('bloomC', sw, sh);
      const ax = a.getContext('2d'), bx = b.getContext('2d'), cx = c.getContext('2d');
      // PERFORMANCE: reading the game canvas back (a copy of the whole frame on iOS) is the costly part; the glow is a
      // 1/6-size blur, so it is sampled every second frame (every fourth from the MEDIUM tier) and reused between
      this.bloomN = (this.bloomN || 0) + 1;
      if (fresh || this.bloomN % (QT ? QT.bloomEvery : 1) === 0) {
        this.bloomTheme = play.themeKey; this.bloomK = bloom;
        ax.globalCompositeOperation = 'copy'; ax.drawImage(Game.canvas, gx, gy, W, H, 0, 0, sw, sh);
        ax.globalCompositeOperation = 'multiply'; ax.drawImage(a, 0, 0); ax.drawImage(a, 0, 0); // roughly x^3: keeps only highlights
        bx.globalCompositeOperation = 'copy'; bx.drawImage(a, 0, 0, b.width, b.height);
        // the two glows (the 1/6 copy at alpha k, the softer 1/12 one at 1.6 k) are screened together into one small
        // canvas first (screen with alpha k is screen with the colour scaled by k, so this is the same sum), and
        // that goes over the view in ONE full-screen pass instead of two
        cx.globalCompositeOperation = 'copy'; cx.globalAlpha = 1; cx.fillStyle = '#000'; cx.fillRect(0, 0, sw, sh);
        cx.globalCompositeOperation = 'source-over'; cx.globalAlpha = Math.min(1, bloom); cx.drawImage(a, 0, 0);
        cx.globalCompositeOperation = 'screen'; cx.globalAlpha = Math.min(1, bloom * 1.6); cx.drawImage(b, 0, 0, sw, sh);
        cx.globalCompositeOperation = 'source-over'; cx.globalAlpha = 1;
      }
      ctx.save();
      ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 1; ctx.drawImage(c, 0, 0, W, H);
      ctx.restore();
    }
    if (trip > 0.02) {
      ctx.save();
      const g = ctx.createLinearGradient(0, 0, W, H);
      for (let i = 0; i <= 6; i++) g.addColorStop(i / 6, `hsla(${(i * 60 + play.t * 90) % 360},100%,55%,1)`);
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.32 * trip;
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    // --- per-world grade
    if (th.grade) {
      ctx.save(); ctx.globalCompositeOperation = th.grade.mode || 'soft-light'; ctx.globalAlpha = th.grade.a || 0.15;
      ctx.fillStyle = th.grade.color; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    // --- dust storm whiteout (driven by gusts)
    const dust = (play.dustLevel || 0);
    if (dust > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(226,206,178,${dust * 0.55})`; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = dust * 0.6; ctx.strokeStyle = 'rgba(255,245,225,0.5)'; ctx.lineWidth = 2 * Game.S;
      const dir = sign(play.windForce || 1);
      for (let i = 0; i < 26; i++) {
        const y = ((i * 97 + play.t * 40) % 100) / 100 * H, x = ((i * 211 + play.t * 900 * dir) % (W + 400) + W + 400) % (W + 400) - 200;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - dir * 160 * Game.S, y + 10 * Game.S); ctx.stroke();
      }
      ctx.restore();
    }
  }
};

/* ============================================================
   Trip moments (world tour pickups), one family of effects in the
   game's own toon look: flat colour, hard edges, ink stays ink.
   - JOINT (about 1.35 s): the world washes green, slow smoke
     wisps drift across, time eases into a short slow-mo, then
     it all clears;
   - MAGIC MUSHROOM (dizzy, 4.2 s): CANDY STRIPES. Wide hard-edged
     diagonal stripes (pink, yellow, mint, violet, sky) slide
     across the sky and colour the level's tiles, chunky cream
     daisies and dizzy spirals hop in the sky with a squash on
     every landing, and the level jiggles in whole-pixel bands;
   - LSD TAB (the flight): KALEIDOSCOPE. A 12-pane pinwheel of
     bold flat hues (neighbours far apart on the colour wheel)
     turns about a hub high in the middle of the screen, colouring
     the sky and the tiles, with two rings of petals turning
     against it behind the level, the hues drifting;
     strongest for the first ~2.5 s, then a mild level while he
     flies (no shapes), then it fades out.
   Playable through it: the colour goes on with the 'color' blend
   (behind the level) and the 'hue' blend (over the backdrop, decor
   and tiles, BEFORE the characters are drawn): both keep every
   pixel's own light, so ink stays black, white stays white, and
   the light/dark contrast that separates Brady, enemies, pickups,
   hazards and platform edges from what is behind them is the same
   as without the trip. Brady, enemies, pickups, projectiles and
   the HUD are never recoloured, washed, blurred or scaled. The
   shapes are drawn behind the level, cream with a soft violet
   line (no black ink, no keyline), so they never read as
   gameplay; they pop in and out by size, never fade to mush.
   At night (a dark sky or a dark area) the sky takes the 'hue'
   blend instead of 'color' (a night stays a night) and the
   shapes go dusky instead of cream.
   No gradients, no soft sprites, no resampled copies (the jiggle
   moves bands by whole pixels). Nothing full-screen changes
   faster than ~0.5 times a second (a stripe edge passes a point
   every few seconds; the hue drift is 25 degrees a second).
   Graphics tiers (src/14_quality.js): HIGH everything; from cut 1
   (MEDIUM) no jiggle copy, half the daisies, no inner petal ring;
   from cut 4 (LOW) the sky pass alone (one full-screen blend), no
   shapes. FX CALM (Settings / pause): a still pattern at about
   half strength, no shapes, no jiggle, no slow-mo.
   Budget at HIGH: two full-screen blend fills (as before) plus the
   mushroom's band copy (as before); nothing is allocated per
   frame (colour strings are cached per whole degree, at most 5 x
   360; the scratch canvas is reused).
   ============================================================ */
const TripFX = {
  calm() { return typeof TourKit !== 'undefined' && TourKit.reduceMotion(); },
  // the graphics cut level (0 = HIGH .. 7); without the tiers: 0 at full quality, 1 after the old adaptive switch
  cut() { return typeof QualityTier !== 'undefined' ? QualityTier.level : (Game.quality >= 1 ? 0 : 1); },
  // per-source strengths (0..1) for this frame
  levels(play) {
    const jr = play.tripJoint || 0, JD = 1.35;
    const joint = jr > 0 ? clamp((JD - jr) / 0.15, 0, 1) * clamp(jr / 0.55, 0, 1) : 0;
    const dz = play.dizzy || 0;
    const shroom = dz > 0 ? this.shroomK(dz) : 0;
    return { joint, lsd: play.lsdK || 0, shroom };
  },
  // called from Play.update: the LSD envelope (strong first, then subtle while he flies, then out) and the joint timer
  tick(play, dt) {
    const p = play.player;
    if (play.tripJoint > 0) play.tripJoint = Math.max(0, play.tripJoint - dt);
    let target = 0;
    if (p && p.lsdT > 0) target = (10 - p.lsdT) < 2.6 ? 1 : 0.3;
    else if (p && p.glideT > 0) target = 0.12;
    const k = play.lsdK || 0;
    play.lsdK = target > k ? Math.min(target, k + dt * 4) : Math.max(target, k - dt * (k > 0.35 ? 0.55 : 0.4));
  },
  active(play) { const L = this.levels(play); return L.joint > 0.001 || L.lsd > 0.001 || L.shroom > 0.001; },
  // slow-mo during the joint moment (world dt multiplier)
  timeScale(play) { if (this.calm()) return 1; const j = this.levels(play).joint; return 1 - 0.42 * j; },
  shroomK(dz) { const D = 4.2, a = clamp((D - dz) / 0.6, 0, 1), b = clamp(dz / 1.4, 0, 1); return a * a * (3 - 2 * a) * b * b * (3 - 2 * b); },

  /* ---------- flat colours, cached per whole degree (bounded: 3 x 360 strings) ---------- */
  // 0 a pure hue (for the blends); 1, 2 the shapes' cream and soft line by day; 3, 4 their dusk fill and line at night
  TONES: ['100%,50%', '92%,90%', '45%,40%', '38%,30%', '50%,56%'],
  col(h, v) {
    h = ((Math.round(h) % 360) + 360) % 360;
    const c = this.cols || (this.cols = [[], [], [], [], []]);
    return c[v][h] || (c[v][h] = `hsl(${h},${this.TONES[v]})`);
  },
  SHROOM_HUES: [330, 48, 160, 275, 196],
  // a night scene (a dark top of the sky, or a dark area): the sky keeps its darkness (the 'hue' blend instead of 'color', which
  // would light a night sky up to day) and the shapes go dusky instead of cream. Cached per theme.
  night(play) {
    const key = play.themeKey, c = this.nightC || (this.nightC = {});
    if (c[key] == null) {
      // the top of the sky decides (a night sky often has a bright glow at the horizon)
      const top = THEMES[key] && THEMES[key].sky && THEMES[key].sky[0];
      if (top) { const [r, g, b] = hexToRgb(top); c[key] = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.22; } else c[key] = false;
    }
    return c[key] || !!(play.area && play.area.dark);
  },

  /* ---------- the patterns (device px, view origin at 0,0) ---------- */
  // the mushroom's candy stripes: wide diagonal bands sliding sideways; stripe i always has the same colour
  stripes(ctx, W, H, t) {
    const n = this.SHROOM_HUES.length, bw = Math.round(W / 4.6), D = Math.ceil(Math.hypot(W, H) / 2) + 2;
    const o = (t * 26 * Game.S) % (bw * n);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.42);
    for (let i = Math.floor((-D - o) / bw); i * bw + o < D; i++) {
      ctx.fillStyle = this.col(this.SHROOM_HUES[((i % n) + n) % n], 0);
      ctx.fillRect(i * bw + o, -D, bw, 2 * D);
    }
    ctx.restore();
  },
  // the acid's pinwheel: n (12) wedges about (cx, cy); neighbours 150 degrees of hue apart, so it reads as bold flat
  // panes and never as a smooth rainbow (12 x 150 = 5 whole turns: the last wedge meets the first cleanly)
  wheel(ctx, cx, cy, R, n, rot, h0) {
    const a = TAU / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = this.col(h0 + i * 150, 0);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, rot + i * a, rot + (i + 1) * a + 0.002); ctx.closePath(); ctx.fill();
    }
  },
  wheelAt(W, H) { return { cx: W / 2, cy: H * 0.32, R: Math.hypot(W, H) * 0.75 }; },
  // the shapes' look: cream fill, a soft violet line (no black ink, no keyline: never mistaken for gameplay)
  shapeStyle(ctx, lw, night) { ctx.fillStyle = this.col(night ? 268 : 48, night ? 3 : 1); ctx.strokeStyle = this.col(night ? 285 : 272, night ? 4 : 2); ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; },
  daisy(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6, px = x + Math.cos(a) * r * 0.58, py = y + Math.sin(a) * r * 0.58; ctx.moveTo(px + r * 0.42, py); ctx.arc(px, py, r * 0.42, 0, TAU); }
    ctx.fill(); ctx.stroke();
    const f = ctx.fillStyle; ctx.beginPath(); ctx.arc(x, y, r * 0.36, 0, TAU); ctx.fillStyle = this.col(44, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = f;
  },
  spiral(ctx, x, y, r, spin) {
    const lw = ctx.lineWidth;
    ctx.beginPath();
    for (let i = 0; i <= 28; i++) { const u = i / 28, a = spin + u * TAU * 2.2, rr = r * (0.12 + 0.88 * u); if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.lineWidth = r * 0.34 + lw * 2; ctx.stroke();                            // the soft line
    const s = ctx.strokeStyle; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = r * 0.34; ctx.stroke(); ctx.strokeStyle = s; ctx.lineWidth = lw;
  },
  petal(ctx, x, y, a, len, wid) {
    const c = Math.cos(a), s = Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(x - c * len * 0.5, y - s * len * 0.5);
    ctx.lineTo(x - s * wid * 0.5, y + c * wid * 0.5);
    ctx.lineTo(x + c * len * 0.5, y + s * len * 0.5);
    ctx.lineTo(x + s * wid * 0.5, y - c * wid * 0.5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  },
  // shapes pop in and out by size (crisp at every moment), from 35 % strength to 80 %
  popK(k) { const u = clamp((k - 0.35) / 0.45, 0, 1); return u * u * (3 - 2 * u); },

  /* ---------- behind the tiles and characters ---------- */
  back(ctx, play, W, H) {
    const L = this.levels(play); if (L.lsd <= 0.001 && L.shroom <= 0.001 && L.joint <= 0.001) return;
    const calm = this.calm(), t = calm ? 0 : play.t, cut = this.cut(), S = Game.S, night = this.night(play), sky = night ? 'hue' : 'color';
    ctx.save();
    if (L.joint > 0.001) {
      // a green haze settles over the background
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(120,230,120,${0.28 * L.joint})`); g.addColorStop(1, `rgba(60,160,80,${0.4 * L.joint})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // the sky takes the pattern's colours at its own light ('color': hue and saturation from the pattern)
    if (L.shroom > 0.001) {
      const k = L.shroom;
      ctx.globalCompositeOperation = sky; ctx.globalAlpha = (calm ? 0.45 : 0.85) * k;
      this.stripes(ctx, W, H, t);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      const pk = calm || cut >= 4 ? 0 : this.popK(k);
      if (pk > 0.01) {
        // daisies and dizzy spirals hop across the sky (half of them from MEDIUM); squash on each landing
        const n = cut >= 1 ? 3 : 6, r0 = 15 * S * pk;
        this.shapeStyle(ctx, 2.2 * S, night);
        for (let i = 0; i < n; i++) {
          const j = cut >= 1 ? i * 2 : i;
          const span = W + 8 * r0, x = (((j + 0.5) / 6 * span - t * 22 * S + j * 37) % span + span) % span - 4 * r0;
          const ph = t * 2.6 + j * 1.3, hop = Math.abs(Math.sin(ph)), land = Math.pow(1 - hop, 6);
          const y = H * (0.23 + 0.08 * (j % 3)) - hop * H * 0.08, r = r0 * (0.85 + 0.3 * ((j * 7) % 3) / 2);
          ctx.save(); ctx.translate(x, y + r); ctx.scale(1 + 0.22 * land, 1 - 0.22 * land); ctx.translate(0, -r);
          if (j % 2) this.spiral(ctx, 0, 0, r * 1.05, t * 1.6 + j); else this.daisy(ctx, 0, 0, r);
          ctx.restore();
        }
      }
    }
    if (L.lsd > 0.001) {
      const k = L.lsd, w = this.wheelAt(W, H), rot = t * 0.22, h0 = calm ? 280 : t * 25;
      ctx.globalCompositeOperation = sky; ctx.globalAlpha = (calm ? 0.45 : 0.9) * k;
      this.wheel(ctx, w.cx, w.cy, w.R, 12, rot, h0);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      const pk = calm || cut >= 4 ? 0 : this.popK(k);
      if (pk > 0.01) {
        // the kaleidoscope's rings about the wheel's hub, turning against it: 8 petals, and (HIGH) 8 small ones inside
        // turning the other way, round a hub disc
        this.shapeStyle(ctx, 2.2 * S, night);
        const r1 = H * 0.2, pr = -t * 0.35;
        for (let i = 0; i < 8; i++) { const a = pr + i * TAU / 8; this.petal(ctx, w.cx + Math.cos(a) * r1, w.cy + Math.sin(a) * r1, a, H * 0.13 * pk, H * 0.06 * pk); }
        if (cut < 1) { const r0 = H * 0.095, qr = t * 0.5 + 0.39; for (let i = 0; i < 8; i++) { const a = qr + i * TAU / 8; this.petal(ctx, w.cx + Math.cos(a) * r0, w.cy + Math.sin(a) * r0, a, H * 0.06 * pk, H * 0.03 * pk); } }
        ctx.beginPath(); ctx.arc(w.cx, w.cy, H * 0.035 * pk, 0, TAU); ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore();
  },

  /* ---------- over the backdrop, decor and tiles, BEFORE the characters (12_play.js): the level's colours ---------- */
  mid(ctx, play, W, H) {
    const L = this.levels(play); if (L.lsd <= 0.001 && L.shroom <= 0.001) return;
    const cut = this.cut(); if (cut >= 4) return;   // LOW: the sky pass alone
    const calm = this.calm(), t = calm ? 0 : play.t;
    ctx.save();
    // 'hue': the tiles keep their own light and saturation, only the hue follows the pattern (ink stays black)
    ctx.globalCompositeOperation = 'hue';
    if (L.shroom > 0.001) { ctx.globalAlpha = (calm ? 0.35 : 0.7) * L.shroom; this.stripes(ctx, W, H, t); }
    if (L.lsd > 0.001) { const w = this.wheelAt(W, H); ctx.globalAlpha = (calm ? 0.35 : 0.75) * L.lsd; this.wheel(ctx, w.cx, w.cy, w.R, 12, t * 0.22, calm ? 280 : t * 25); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    // the mushroom's jiggle (HIGH, full effects): the level so far, copied once and drawn back in bands moved by WHOLE
    // pixels on a slow wave (no resampling: the tile edges stay crisp); the characters are drawn after, untouched
    if (L.shroom > 0.001 && !calm && cut === 0 && Game.quality >= 1) {
      const gx = Game.gameRect.x * Game.dpr, gy = Game.gameRect.y * Game.dpr;
      const tmp = PostFX.ensure('shroomWob', W, H), tx = tmp.getContext('2d');
      tx.globalCompositeOperation = 'copy'; tx.drawImage(ctx.canvas, gx, gy, W, H, 0, 0, W, H);
      const A = 4 * Game.S * L.shroom, sh = Math.max(4, Math.round(6 * Game.dpr));
      ctx.imageSmoothingEnabled = false;
      for (let y = 0; y < H; y += sh) {
        const h = Math.min(sh, H - y), dx = Math.round(A * Math.sin((y + h / 2) / H * TAU * 1.2 + play.t * 3.2));
        if (dx) ctx.drawImage(tmp, 0, y, W, h, dx, y, W, h);
      }
    }
    ctx.restore();
  },

  /* ---------- over the whole game view (before the HUD): the joint's breath, green and smoke ---------- */
  post(ctx, play, W, H) {
    const L = this.levels(play); if (L.joint <= 0.001) return;
    const calm = this.calm(), t = play.t, S = Game.S, p = play.player;
    ctx.save();
    // the breath: the world swells and settles around Brady (never below 1: no empty edges)
    const amp = calm || Game.quality < 1 ? 0 : 0.012 * L.joint;
    if (amp > 0.002 && p) {
      const tmp = PostFX.ensure('tripWarp', W, H), tx = tmp.getContext('2d');
      tx.globalCompositeOperation = 'copy'; tx.drawImage(ctx.canvas, Game.gameRect.x * Game.dpr, Game.gameRect.y * Game.dpr, W, H, 0, 0, W, H);
      const br = 0.5 + 0.5 * Math.sin(t * TAU / 2.6), sx = 1 + amp * (0.35 + 0.65 * br), sy = 1 + amp * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * TAU / 2.6 + 0.9)));
      const px = clamp((p.cx - play.camX) * S, W * 0.2, W * 0.8), py = clamp((p.cy - play.camY) * S, H * 0.2, H * 0.8);
      ctx.translate(px, py); ctx.scale(sx, sy); ctx.translate(-px, -py);
      ctx.drawImage(tmp, 0, 0);
      ctx.setTransform(1, 0, 0, 1, Game.gameRect.x * Game.dpr, Game.gameRect.y * Game.dpr);
    }
    // the joint: a green wash, then the smoke wisps and a hazy green rim composed at quarter resolution and laid over
    // the view with one scaled draw (fill-rate friendly on a phone)
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = `rgba(80,220,90,${0.55 * L.joint})`; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    const qw = Math.max(32, Math.round(W / 4)), qh = Math.max(16, Math.round(H / 4)), q = PostFX.ensure('tripSmoke', qw, qh), qx = q.getContext('2d');
    qx.globalCompositeOperation = 'copy'; qx.fillStyle = `rgba(150,230,140,${0.1 * L.joint})`; qx.fillRect(0, 0, qw, qh);
    qx.globalCompositeOperation = 'source-over';
    const wisp = this.wisp(), e = 1.35 - (play.tripJoint || 0);
    for (let i = 0; i < 9; i++) {
      const sd = i * 1.618, ww = (0.36 + (i % 4) * 0.1) * qw;
      const x = ((sd * 0.37 % 1) * 1.3 - 0.15) * qw + (calm ? 0 : Math.sin(e * 0.9 + sd) * 0.05 * qw + e * (i % 2 ? 5.5 : -4) * S);
      const y = ((sd * 0.61 % 1) * 1.1 - 0.05) * qh - (calm ? 0 : e * 4.5 * S);
      qx.globalAlpha = (0.55 + (i % 3) * 0.12) * L.joint;
      qx.drawImage(wisp, x - ww / 2, y - ww * 0.32, ww, ww * 0.64);
    }
    qx.globalAlpha = 1;
    const g = qx.createRadialGradient(qw / 2, qh / 2, qh * 0.3, qw / 2, qh / 2, qw * 0.62);
    g.addColorStop(0, 'rgba(120,220,120,0)'); g.addColorStop(1, `rgba(90,190,100,${0.45 * L.joint})`);
    qx.fillStyle = g; qx.fillRect(0, 0, qw, qh);
    ctx.drawImage(q, 0, 0, W, H);
    ctx.restore();
  },
  // a soft lumpy smoke sprite, made once
  wisp() {
    if (this.wispC) return this.wispC;
    const c = makeCanvas(160, 104), x = c.getContext('2d');
    const blobs = [[80, 56, 40], [52, 60, 30], [110, 58, 32], [70, 40, 26], [98, 42, 24], [35, 66, 20], [128, 66, 20]];
    for (const [bx, by, r] of blobs) { const g = x.createRadialGradient(bx, by, 2, bx, by, r); g.addColorStop(0, 'rgba(240,252,236,0.7)'); g.addColorStop(0.55, 'rgba(215,242,210,0.32)'); g.addColorStop(1, 'rgba(200,235,200,0)'); x.fillStyle = g; x.fillRect(0, 0, 160, 104); }
    return (this.wispC = c);
  }
};
try { window.BRADY_POWERS = Object.assign(window.BRADY_POWERS || {}, { TripFX, PostFX }); } catch (e) { /* not in a browser */ }
