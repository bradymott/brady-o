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
   game's own toon look (flat colour, hard edges, ink stays dark)
   that MOVE: the colours wave and the world itself undulates.
   - JOINT (about 1.35 s): a lazy green moment. The sky goes green,
     flat cream smoke curls drift up and curl, the world swells and
     sways slowly round Brady, time eases into a short slow-mo.
   - MAGIC MUSHROOM (dizzy, 4.2 s): MELTING CANDY STRIPES. Wide
     flat stripes (pink, yellow, mint, violet, sky) whose edges
     wave like kelp, their hues swaying to and fro, colour the sky
     and the level.
     The level and its backdrop sway in slow soft waves and breathe
     up and down (strongest far from Brady, almost still at his
     feet). Onset "whoa": for the first second a ripple runs out from
     Brady and the whole view leans, swings back and breathes in
     and out once or twice, then settles into the sway.
   - LSD TAB (the flight): KALEIDOSCOPE. A pinwheel of bold flat hues
     whose arms twist into spirals and fold back the other way, a
     pulsing star of other hues at its hub; for the strong first
     part the level's dark lines take deep cycling colours (colour
     bands running along the level's lines); the level shears in
     stepped, zig-zag bands
     (geometric, faster than the mushroom). Onset: a faster ripple,
     the view twists, shears and pumps; strongest for ~2.5 s, then
     a mild level while he flies (the colours keep turning and
     twisting, the level stops shearing), then out.
   Readability (non-negotiable): characters, projectiles, pickups and
   the HUD are drawn AFTER the colour and the sway (never recoloured
   or displaced); the colour goes on in ONE full-screen 'color' blend
   over the sky, backdrop and tiles by day ('hue' at night, so a night
   stays a night): each pixel keeps its own light, so the light/dark
   contrast that separates things is unchanged, ink stays black and
   white stays white; the sway moves rows of the level
   by whole pixels, about 2 device px at Brady's feet and up to a
   third of a tile far from him; the collision never moves. Only the
   onset's lean / breath moves everything together (characters with
   their floors, about Brady, who stays put), for about a second.
   No flashing: hue and pattern changes at any one point are slow
   (well under 3 Hz), the light of the scene never pulses.
   Graphics tiers (src/14_quality.js): HIGH everything; from cut 1
   (MEDIUM) no onset lean (the ripple stays), no cycling line
   colours, coarser sway bands, half the shapes, no inner petal ring;
   from cut 4 (LOW) one colour pass on the sky alone (behind the
   level; still waving), no sway, no shapes. FX CALM (Settings / pause): a still pattern at
   about half strength, nothing moves (no sway, no lean, no shapes,
   no slow-mo).
   Allocation-free per frame: the strengths object is reused, colour
   strings are cached per whole degree (bounded: 6 x 360), paths are
   drawn point by point, the scratch canvases are PostFX's fixed
   view-size ones (shroomWob for the sway, tripWarp for the lean),
   reused and counted by SessionStats.
   ============================================================ */
const TripFX = {
  calm() { return typeof TourKit !== 'undefined' && TourKit.reduceMotion(); },
  // the graphics cut level (0 = HIGH .. 7); without the tiers: 0 at full quality, 1 after the old adaptive switch
  cut() { return typeof QualityTier !== 'undefined' ? QualityTier.level : (Game.quality >= 1 ? 0 : 1); },
  // per-source strengths (0..1) for this frame, plus the time since each pickup (s; -1 = none). One object, reused.
  L: { joint: 0, lsd: 0, shroom: 0, sAge: -1, aAge: -1 },
  levels(play) {
    const L = this.L, jr = play.tripJoint || 0, JD = 1.35;
    L.joint = jr > 0 ? clamp((JD - jr) / 0.15, 0, 1) * clamp(jr / 0.55, 0, 1) : 0;
    const dz = play.dizzy || 0;
    L.shroom = dz > 0 ? this.shroomK(dz) : 0;
    L.sAge = dz > 0 ? this.SD - dz : -1;
    L.lsd = play.lsdK || 0;
    const p = play.player;
    L.aAge = p && p.lsdT > 0 ? 10 - p.lsdT : -1;
    return L;
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
  SD: 4.2,
  // the mushroom's strength: in fast (0.35 s, so the onset lands), out slowly (1.4 s)
  shroomK(dz) { const D = this.SD, a = clamp((D - dz) / 0.35, 0, 1), b = clamp(dz / 1.4, 0, 1); return a * a * (3 - 2 * a) * b * b * (3 - 2 * b); },
  // the onset "whoa" (0..1) at a given time since the pickup: up in 0.15 s, held, gone by 1.4 s
  whoa(age) { if (age < 0 || age > 1.4) return 0; const u = clamp(age / 0.15, 0, 1), d = clamp((age - 0.6) / 0.8, 0, 1); return u * u * (3 - 2 * u) * (1 - d * d * (3 - 2 * d)); },
  sm(e0, e1, x) { const u = clamp((x - e0) / (e1 - e0), 0, 1); return u * u * (3 - 2 * u); },

  /* ---------- flat colours, cached per whole degree (bounded: 6 x 360 strings) ---------- */
  // 0 a pure hue (for the blends); 1, 2 the shapes' cream and soft line by day; 3, 4 their dusk fill and line at night;
  // 5 a deep dark hue (the LSD's cycling line colour, laid on with 'lighten': black ink becomes this, nothing lighter changes)
  TONES: ['100%,50%', '92%,90%', '45%,40%', '38%,30%', '50%,56%', '100%,15%'],
  col(h, v) {
    h = ((Math.round(h) % 360) + 360) % 360;
    const c = this.cols || (this.cols = [[], [], [], [], [], []]);
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

  /* ---------- the patterns (device px, view origin at 0,0); `wav` 0 = still and straight (FX CALM) ---------- */
  // the mushroom's candy stripes: wide diagonal bands sliding sideways, their edges waving like kelp (each edge is one wave,
  // shared by the two stripes it separates: no gaps); stripe i keeps its colour, the whole set sways round the colour wheel and back
  stripes(ctx, W, H, t, wav, tone) {
    const n = this.SHROOM_HUES.length, bw = Math.round(W / 4.6), D = Math.ceil(Math.hypot(W, H) / 2) + 2;
    const o = (t * 26 * Game.S) % (bw * n), amp = bw * 0.42 * wav, fq = TAU / (D * 0.95), SEG = 14, st = 2 * D / SEG;
    const drift = wav ? 34 * Math.sin(t * 0.5) + 12 * Math.sin(t * 1.3) : 0;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.42 + 0.07 * wav * Math.sin(t * 0.41));
    for (let i = Math.floor((-D - o - amp) / bw); i * bw + o - amp < D; i++) {
      const hue = this.SHROOM_HUES[((i % n) + n) % n];
      ctx.fillStyle = this.col(hue + drift, tone || 0);
      ctx.beginPath();
      for (let s = 0; s <= SEG; s++) { const v = -D + s * st, u = i * bw + o + amp * Math.sin(v * fq + t * 1.25 + i * 1.1); if (s) ctx.lineTo(u, v); else ctx.moveTo(u, v); }
      for (let s = SEG; s >= 0; s--) { const v = -D + s * st, u = (i + 1) * bw + o + amp * Math.sin(v * fq + t * 1.25 + (i + 1) * 1.1); ctx.lineTo(u, v); }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  },
  // one arm edge of the acid's pinwheel: angle at radius fraction u (twisted into a spiral, with a travelling wiggle)
  armA(j, u, rot, a, tw, wob, t) { return rot + j * a + tw * u + wob * u * Math.sin(u * 7 - t * 2.3); },
  // the acid's pinwheel: n (12) wedges about (cx, cy); neighbours 150 degrees of hue apart (bold flat panes, never a smooth
  // rainbow; 12 x 150 = 5 whole turns: the last wedge meets the first cleanly). The arms twist into spirals and fold back
  // the other way (tw swings), wiggling; a star of other hues at the hub pulses in and out.
  wheel(ctx, cx, cy, R, n, rot, h0, t, wav, tone) {
    const a = TAU / n, tw = wav * (0.9 + 1.2 * Math.sin(t * 0.55)), wob = wav * 0.4, M = 12;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = this.col(h0 + i * 150, tone || 0);
      ctx.beginPath(); ctx.moveTo(cx, cy);
      for (let s = 1; s <= M; s++) { const u = s / M, an = this.armA(i, u, rot, a, tw, wob, t); ctx.lineTo(cx + Math.cos(an) * R * u, cy + Math.sin(an) * R * u); }
      for (let s = M; s >= 1; s--) { const u = s / M, an = this.armA(i + 1, u, rot, a, tw, wob, t) + (s === M ? 0.002 : 0); ctx.lineTo(cx + Math.cos(an) * R * u, cy + Math.sin(an) * R * u); }
      ctx.closePath(); ctx.fill();
    }
    if (!wav) return;
    // the hub star: 12 points, twisting the other way, its points pumping in and out (a fold of the kaleidoscope)
    const r0 = Math.min(cx, cy, R) * 0.62, pump = 0.22 * Math.sin(t * 1.9), rot2 = -rot * 1.6 + 0.26;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = this.col(h0 + 75 + i * 150, tone || 0);
      const a0 = rot2 + i * a - tw * 0.5, a1 = rot2 + (i + 1) * a - tw * 0.5, rA = r0 * (1 + (i % 2 ? pump : -pump)), rB = r0 * (1 + (i % 2 ? -pump : pump));
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a0) * rA, cy + Math.sin(a0) * rA); ctx.lineTo(cx + Math.cos(a1) * rB, cy + Math.sin(a1) * rB); ctx.closePath(); ctx.fill();
    }
  },
  wheelAt(W, H) { const w = this.wa || (this.wa = { cx: 0, cy: 0, R: 0 }); w.cx = W / 2; w.cy = H * 0.32; w.R = Math.hypot(W, H) * 0.75; return w; },
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
  // a flat toon smoke puff (the joint): four overlapping lobes filled as ONE shape (one fill: see-through evenly, no seams)
  puff(ctx, x, y, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TAU);
    ctx.moveTo(x - r * 0.15 + r * 0.7, y - r * 0.55); ctx.arc(x - r * 0.15, y - r * 0.55, r * 0.7, 0, TAU);
    ctx.moveTo(x + r * 0.75 + r * 0.6, y - r * 0.2); ctx.arc(x + r * 0.75, y - r * 0.2, r * 0.6, 0, TAU);
    ctx.moveTo(x - r * 0.8 + r * 0.55, y + r * 0.1); ctx.arc(x - r * 0.8, y + r * 0.1, r * 0.55, 0, TAU);
    ctx.fill();
  },
  // shapes pop in and out by size (crisp at every moment), from 35 % strength to 80 %
  popK(k) { const u = clamp((k - 0.35) / 0.45, 0, 1); return u * u * (3 - 2 * u); },

  /* ---------- behind the tiles and characters: the sky's colour and the shapes ---------- */
  back(ctx, play, W, H) {
    const L = this.levels(play); if (L.lsd <= 0.001 && L.shroom <= 0.001 && L.joint <= 0.001) return;
    const calm = this.calm(), t = calm ? 0 : play.t, wav = calm ? 0 : 1, cut = this.cut(), S = Game.S, night = this.night(play), sky = night ? 'hue' : 'color';
    ctx.save();
    if (L.joint > 0.001) {
      // the sky goes green (flat: its own light, a green hue)
      ctx.globalCompositeOperation = sky; ctx.globalAlpha = 0.5 * L.joint; ctx.fillStyle = this.col(118, 0); ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    // the sky takes the pattern's colours at its own light ('color': hue and saturation from the pattern)
    // (from HIGH to MEDIUM the level pass in mid() colours the sky too, in the same single full-screen blend: the sky pass
    // here is LOW's only colour)
    const one = cut < 4;
    if (L.shroom > 0.001) {
      const k = L.shroom;
      if (!one) {
        ctx.globalCompositeOperation = sky; ctx.globalAlpha = (calm ? 0.45 : 0.85) * k;
        this.stripes(ctx, W, H, t, wav, 0);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
      const pk = calm || cut >= 4 ? 0 : this.popK(k);
      if (pk > 0.01) {
        // daisies and dizzy spirals hop and sway across the sky (half of them from MEDIUM); squash on each landing
        const n = cut >= 1 ? 3 : 6, r0 = 15 * S * pk;
        this.shapeStyle(ctx, 2.2 * S, night);
        for (let i = 0; i < n; i++) {
          const j = cut >= 1 ? i * 2 : i;
          const span = W + 8 * r0, x = (((j + 0.5) / 6 * span - t * 22 * S + j * 37) % span + span) % span - 4 * r0;
          const ph = t * 2.6 + j * 1.3, hop = Math.abs(Math.sin(ph)), land = Math.pow(1 - hop, 6);
          const y = H * (0.23 + 0.08 * (j % 3)) - hop * H * 0.08, r = r0 * (0.85 + 0.3 * ((j * 7) % 3) / 2);
          ctx.save(); ctx.translate(x, y + r); ctx.rotate(0.3 * Math.sin(t * 1.7 + j)); ctx.scale(1 + 0.22 * land, 1 - 0.22 * land); ctx.translate(0, -r);
          if (j % 2) this.spiral(ctx, 0, 0, r * 1.05, t * 1.6 + j); else this.daisy(ctx, 0, 0, r);
          ctx.restore();
        }
      }
    }
    if (L.lsd > 0.001) {
      const k = L.lsd, w = this.wheelAt(W, H), rot = t * 0.22, h0 = calm ? 280 : t * 25;
      if (!one) {
        ctx.globalCompositeOperation = sky; ctx.globalAlpha = (calm ? 0.45 : 0.9) * k;
        this.wheel(ctx, w.cx, w.cy, w.R, 12, rot, h0, t, wav, 0);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
      const pk = calm || cut >= 4 ? 0 : this.popK(k);
      if (pk > 0.01) {
        // the kaleidoscope's rings about the wheel's hub, turning against it and breathing in and out: 8 petals, and
        // (HIGH) 8 small ones inside turning the other way, round a hub disc
        this.shapeStyle(ctx, 2.2 * S, night);
        const r1 = H * (0.2 + 0.035 * Math.sin(t * 1.9)), pr = -t * 0.35;
        for (let i = 0; i < 8; i++) { const a = pr + i * TAU / 8, sw = 0.35 * Math.sin(t * 2.2 + i); this.petal(ctx, w.cx + Math.cos(a) * r1, w.cy + Math.sin(a) * r1, a + sw, H * 0.13 * pk, H * 0.06 * pk); }
        if (cut < 1) { const r0 = H * (0.095 - 0.02 * Math.sin(t * 1.9)), qr = t * 0.5 + 0.39; for (let i = 0; i < 8; i++) { const a = qr + i * TAU / 8; this.petal(ctx, w.cx + Math.cos(a) * r0, w.cy + Math.sin(a) * r0, a, H * 0.06 * pk, H * 0.03 * pk); } }
        ctx.beginPath(); ctx.arc(w.cx, w.cy, H * 0.035 * pk, 0, TAU); ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore();
  },

  /* ---------- over the backdrop, decor and tiles, BEFORE the characters (12_play.js): the level's colours and its sway ---------- */
  mid(ctx, play, W, H) {
    const L = this.levels(play); if (L.lsd <= 0.001 && L.shroom <= 0.001) return;
    const cut = this.cut(); if (cut >= 4) return;   // LOW: the sky pass alone
    const calm = this.calm(), t = calm ? 0 : play.t, wav = calm ? 0 : 1, night = this.night(play);
    ctx.save();
    // ONE full-screen blend colours the sky, backdrop, decor and tiles: by day 'color' (every pixel keeps its own light and
    // takes the pattern's hue and saturation: ink stays black, white stays white), at night 'hue' (a night stays a night)
    ctx.globalCompositeOperation = night ? 'hue' : 'color';
    if (L.shroom > 0.001) { ctx.globalAlpha = (calm ? 0.4 : 0.72) * L.shroom; this.stripes(ctx, W, H, t, wav, 0); }
    if (L.lsd > 0.001) { const w = this.wheelAt(W, H); ctx.globalAlpha = (calm ? 0.4 : 0.76) * L.lsd; this.wheel(ctx, w.cx, w.cy, w.R, 12, t * 0.22, calm ? 280 : t * 25, t, wav, 0); }
    // the LSD (HIGH, by day): the level's dark lines take deep colours from the same kaleidoscope, cycling with it ('lighten'
    // with a deep dark hue: black becomes that hue, anything lighter than it is untouched)
    if (L.lsd > 0.5 && !calm && cut === 0 && !night) {
      const w = this.wheelAt(W, H);
      ctx.globalCompositeOperation = 'lighten'; ctx.globalAlpha = clamp((L.lsd - 0.5) * 2, 0, 1);
      this.wheel(ctx, w.cx, w.cy, w.R, 12, t * 0.22, t * 25 + 40, t, wav, 5);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    if (!calm) this.sway(ctx, play, W, H, L, cut);
    ctx.restore();
  },
  // the level so far (backdrop, decor, tiles), copied once and drawn back in thin rows moved by WHOLE pixels (no resampling:
  // tile edges stay crisp). Mushroom: two slow waves sideways (kelp) and a slow up-and-down breath far from Brady.
  // LSD: zig-zag shears in stepped bands plus a quick wave, in its strong first part only (the long mild part of the flight
  // keeps its moving colours and drops this copy: it costs about a full-screen draw). Both: the onset ripple running up and
  // down from Brady's feet.
  // The rows at Brady's feet move about 2 device px at most (the sway grows over three tiles away from them).
  sway(ctx, play, W, H, L, cut) {
    const S = Game.S, T = TS * S, p = play.player, t = play.t;
    const ks = L.shroom, ka = L.lsd, ws = this.whoa(L.sAge) * ks, wa = this.whoa(L.aAge) * ka;
    const As = ks * T * 0.4, Bs = ks * T * 0.09, Aa = clamp((ka - 0.35) / 0.65, 0, 1) * T * 0.28, Rr = (ws * 0.24 + wa * 0.2) * T;
    if (As + Aa + Rr < 0.6) return;
    const gx = Game.gameRect.x * Game.dpr, gy = Game.gameRect.y * Game.dpr;
    const tmp = PostFX.ensure('shroomWob', W, H), tx = tmp.getContext('2d');
    tx.globalCompositeOperation = 'copy'; tx.drawImage(ctx.canvas, gx, gy, W, H, 0, 0, W, H);
    const py = p ? clamp((p.y + p.h - play.camY) * S, 0, H) : H * 0.7;
    const sh = Math.max(3, Math.round((cut ? 4 : 3) * Game.dpr)), band = Math.round(12 * Game.dpr);
    // the ripple's front (device px from Brady's feet): the mushroom's rolls out slower and wider than the acid's
    const fS = L.sAge >= 0 ? L.sAge * H * 0.9 : -1e4, fA = L.aAge >= 0 ? L.aAge * H * 1.4 : -1e4, lS = T * 3.4, lA = T * 2.6;
    const f1 = TAU * 1.25 / H, f2 = TAU * 2.6 / H, fv = TAU * 0.9 / H, fz = TAU * 1.7 / H, f4 = TAU * 3.3 / H;
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < H; y += sh) {
      const h = Math.min(sh, H - y), yc = y + h / 2, dist = Math.abs(yc - py), e = this.sm(0.4 * T, 3 * T, dist), en = 0.05 + 0.95 * e;
      let dx = 0, dy = 0;
      if (As > 0.05) { dx += As * en * (0.65 * Math.sin(yc * f1 + t * 1.6) + 0.35 * Math.sin(yc * f2 - t * 1.05 + 1.3)); dy += Bs * e * e * Math.sin(yc * fv - t * 1.3); }
      if (Aa > 0.05) {
        // stepped: whole bands of three rows share one zig-zag value (hard-edged shear blocks), plus a quicker ripple
        const yb = (y - (y % band)) + band / 2, z = (yb * fz + t * 0.95) / TAU, tri = 4 * Math.abs(z - Math.floor(z + 0.5)) - 1;
        dx += Aa * en * (0.62 * tri + 0.38 * Math.sin(yc * f4 + t * 3.1));
      }
      if (Rr > 0.05) {
        // the onset ripple: a wave packet (one long wave each side of its crest) running away from Brady's row, up and down
        const q1 = (dist - fS) / lS, q2 = (dist - fA) / lA;
        if (ws > 0.01 && q1 > -1 && q1 < 1) dx += ws * 0.24 * T * Math.max(en, 0.2) * Math.sin(q1 * Math.PI * 2) * (1 - Math.abs(q1));
        if (wa > 0.01 && q2 > -1 && q2 < 1) dx += wa * 0.2 * T * Math.max(en, 0.2) * Math.sin(q2 * Math.PI * 2) * (1 - Math.abs(q2));
      }
      const ix = Math.round(dx), iy = Math.round(dy);
      if (ix || iy) ctx.drawImage(tmp, 0, y, W, h, ix, y + iy, W, h);
    }
    ctx.imageSmoothingEnabled = true;
  },

  /* ---------- over the whole game view (before the HUD): the onset lean, the joint's breath, green and smoke ---------- */
  post(ctx, play, W, H) {
    const L = this.levels(play); if (L.joint <= 0.001 && L.shroom <= 0.001 && L.lsd <= 0.001) return;
    const calm = this.calm(), t = play.t, S = Game.S, p = play.player, cut = this.cut();
    ctx.save();
    // one transformed copy of the finished view about Brady (he stays put; everything moves with its floor), never below 1x:
    // the joint's lazy breath and sway; the mushroom's onset lean, swing back and breath; the LSD's onset twist, shear and pump
    if (!calm && cut === 0 && Game.quality >= 1 && p) {
      const ws = this.whoa(L.sAge) * L.shroom, wa = this.whoa(L.aAge) * L.lsd, j = L.joint, as = L.sAge, aa = L.aAge;
      let rot = 0, zx = 0, zy = 0, shx = 0;
      if (j > 0.001) { const br = 0.5 + 0.5 * Math.sin(t * TAU / 2.6); zx += 0.012 * j * (0.35 + 0.65 * br); zy += 0.012 * j * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * TAU / 2.6 + 0.9))); rot += 0.012 * j * Math.sin(t * 1.5); }
      if (ws > 0.001) { rot += 0.042 * ws * Math.sin(as * TAU * 0.8); const b = 0.03 + 0.022 * Math.sin(as * TAU * 1.3 - 1.2); zx += ws * b; zy += ws * (0.05 - b * 0.6); }
      if (wa > 0.001) { rot += 0.03 * wa * Math.sin(aa * TAU * 1.5); shx += 0.06 * wa * Math.sin(aa * TAU * 1.1 + 0.6); const b = 0.032 + 0.026 * Math.sin(aa * TAU * 2.4); zx += wa * b; zy += wa * b; }
      if (Math.abs(rot) + zx + zy + Math.abs(shx) > 0.0015) {
        const tmp = PostFX.ensure('tripWarp', W, H), tx = tmp.getContext('2d');
        tx.globalCompositeOperation = 'copy'; tx.drawImage(ctx.canvas, Game.gameRect.x * Game.dpr, Game.gameRect.y * Game.dpr, W, H, 0, 0, W, H);
        const px = clamp((p.cx - play.camX) * S, W * 0.2, W * 0.8), py = clamp((p.cy - play.camY) * S, H * 0.2, H * 0.8);
        ctx.translate(px, py); ctx.rotate(rot); ctx.transform(1, 0, shx, 1, 0, 0); ctx.scale(1 + zx + Math.abs(rot) * 1.2, 1 + zy + Math.abs(rot) * 1.2); ctx.translate(-px, -py);
        ctx.drawImage(tmp, 0, 0);
        ctx.setTransform(1, 0, 0, 1, Game.gameRect.x * Game.dpr, Game.gameRect.y * Game.dpr);
      }
    }
    if (L.joint > 0.001) {
      // the joint: a green wash, then flat toon smoke puffs (see-through pale green-cream silhouettes, hard edges) drifting
      // up and swaying, every other one with a lazy soft-green curl; they grow in and shrink out (crisp at every moment)
      ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = this.col(120, 0); ctx.globalAlpha = 0.5 * L.joint; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      const e = 1.35 - (play.tripJoint || 0), pk = this.popK(L.joint * 1.2), n = cut >= 1 ? 4 : 7;
      ctx.fillStyle = this.col(100, 1); ctx.strokeStyle = this.col(120, 2); ctx.lineWidth = 2.2 * S; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (pk > 0.01) for (let i = 0; i < n; i++) {
        const sd = i * 1.618, m = calm ? 0 : 1;
        const x = ((sd * 0.37 % 1) * 1.1 - 0.05) * W + m * (Math.sin(e * 1.3 + sd) * 0.04 * W + e * (i % 2 ? 14 : -11) * S);
        const y = ((sd * 0.61 % 1) * 0.55 + (i % 2 ? 0.05 : 0.6) * 0.5) * H - m * e * 22 * S;
        const r = (16 + (i % 3) * 6) * S * pk;
        ctx.globalAlpha = 0.55; this.puff(ctx, x, y, r);
        if (!calm && i % 2 === 0) { ctx.save(); ctx.globalAlpha = 0.8; ctx.lineWidth = 2.6 * S; ctx.beginPath(); for (let k = 0; k <= 14; k++) { const u = k / 14, a = e * 2.2 + i + u * TAU * 1.3, rr = r * (0.9 - 0.6 * u); const qx = x + r * 1.2 + Math.cos(a) * rr, qy = y - r * 0.9 + Math.sin(a) * rr; if (k) ctx.lineTo(qx, qy); else ctx.moveTo(qx, qy); } ctx.stroke(); ctx.restore(); }
      }
    }
    ctx.restore();
  }
};
try { window.BRADY_POWERS = Object.assign(window.BRADY_POWERS || {}, { TripFX, PostFX }); } catch (e) { /* not in a browser */ }
