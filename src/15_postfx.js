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
    if (bloom > 0.02) {
      const sw = Math.max(8, Math.round(W / 6)), sh = Math.max(8, Math.round(H / 6));
      const a = this.ensure('bloomA', sw, sh), b = this.ensure('bloomB', Math.max(4, sw >> 1), Math.max(4, sh >> 1));
      const ax = a.getContext('2d'), bx = b.getContext('2d');
      ax.globalCompositeOperation = 'copy'; ax.drawImage(Game.canvas, gx, gy, W, H, 0, 0, sw, sh);
      ax.globalCompositeOperation = 'multiply'; ax.drawImage(a, 0, 0); ax.drawImage(a, 0, 0); // roughly x^3: keeps only highlights
      bx.globalCompositeOperation = 'copy'; bx.drawImage(a, 0, 0, b.width, b.height);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = Math.min(1, bloom * 1.6); ctx.drawImage(b, 0, 0, W, H);
      ctx.globalAlpha = Math.min(1, bloom); ctx.drawImage(a, 0, 0, W, H);
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
   Trip moments (world tour pickups), one family of effects:
   - JOINT (about 1.35 s): the world washes green, slow smoke
     wisps drift across, time eases into a short slow-mo, then
     it all clears;
   - LSD TAB (the flight): fractal kaleidoscope patterns bloom
     through the background, the colours shift, the world
     "breathes" in and out; strongest for the first ~2.5 s, then
     a subtle level while he flies, then it fades out;
   - MAGIC MUSHROOM (dizzy, ~4 s): the same family in purples
     and pinks, a gentler breath, soft glowing sparkles.
   Budget: the fractal is a Julia set computed at 224 x 126 into
   a cache of 40 frames (a few rows per frame until the cache is
   full, once per session), coloured each frame through a
   256-entry palette (28k pixels) and scaled up by drawImage.
   The breath is one copy of the game view drawn back scaled
   about Brady (he stays put, the HUD is drawn later). Gameplay
   stays readable: the strong fractal goes behind the tiles and
   characters, only a faint tint lies over them, nothing flashes.
   Reduced motion (Settings / pause: EFFECTS CALM): no breath,
   no slow-mo, no spin, a still fractal at half strength.
   Game.quality 0 (the adaptive switch): no breath, no fractal
   (a gradient wash instead).
   ============================================================ */
const TripFX = {
  FW: 224, FH: 126, N: 40,
  frames: [], gen: null,
  calm() { return typeof TourKit !== 'undefined' && TourKit.reduceMotion(); },
  // per-source strengths (0..1) for this frame
  levels(play) {
    const jr = play.tripJoint || 0, JD = 1.35;
    const joint = jr > 0 ? clamp((JD - jr) / 0.15, 0, 1) * clamp(jr / 0.55, 0, 1) : 0;
    const dz = play.dizzy || 0;
    const shroom = dz > 0 ? clamp(Math.min(dz, (4.2 - dz) / 0.35), 0, 1) : 0;
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
    if (this.active(play) && Game.quality >= 1) this.build(0.9);
  },
  active(play) { const L = this.levels(play); return L.joint > 0.001 || L.lsd > 0.001 || L.shroom > 0.001; },
  // slow-mo during the joint moment (world dt multiplier)
  timeScale(play) { if (this.calm()) return 1; const j = this.levels(play).joint; return 1 - 0.42 * j; },

  /* ---------- the fractal cache ---------- */
  build(budgetMs) {
    if (this.frames.length >= this.N) return;
    const W = this.FW, H = this.FH, t0 = performance.now();
    if (!this.gen) this.gen = { f: this.frames.length, row: 0, buf: new Uint8Array(W * H) };
    const G = this.gen;
    const a = G.f / this.N * TAU, cr = 0.7885 * Math.cos(a), ci = 0.7885 * Math.sin(a), sx = 3.3 / W, sy = 1.86 / H, MAX = 40;
    while (G.row < H) {
      const y0 = (G.row - H / 2) * sy;
      for (let x = 0; x < W; x++) {
        let zr = (x - W / 2) * sx, zi = y0, n = 0, m = 0;
        while (n < MAX && (m = zr * zr + zi * zi) < 16) { const t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; n++; }
        let v = 0;
        if (n < MAX) { const nu = n + 1 - Math.log2(Math.max(1.0001, Math.log2(m) / 2)); v = clamp(Math.round(nu * 6), 1, 254); }
        else v = 255;
        G.buf[G.row * W + x] = v;
      }
      G.row++;
      if (performance.now() - t0 > budgetMs) return;
    }
    this.frames.push(G.buf); this.gen = null;
  },
  frame(t) {
    const n = this.frames.length; if (!n) return null;
    // ping-pong through the frames we have at 10 fps
    const k = Math.floor(t * 10) % (2 * n), i = k < n ? k : 2 * n - 1 - k;
    return this.frames[i];
  },
  // colour a cached frame into the small canvas: bands of rotating hue, the far outside and the deep inside transparent
  paint(buf, hue, sat, alpha, tint) {
    const W = this.FW, H = this.FH, c = PostFX.ensure('tripSmall', W, H), x = c.getContext('2d');
    if (!this.img) this.img = x.createImageData(W, H);
    const pal = this.pal || (this.pal = new Uint32Array(256)), d = new Uint32Array(this.img.data.buffer);
    // cel-shaded bands (about one per 1.7 iterations) with a dark ink line between them; the filled inside of the set
    // is a deep complementary colour, so the shapes read as shapes and not as noise
    for (let i = 0; i < 256; i++) {
      let r, g, b, a;
      if (i >= 96) { [r, g, b] = hsl2rgb(((hue + 180) % 360) / 360, sat, tint ? 0.3 : 0.34); a = 0.78; }
      else {
        const band = Math.floor(i / 10), edge = i % 10 === 0 && i < 90;
        [r, g, b] = edge ? [24, 14, 34] : hsl2rgb(((hue + band * 47) % 360) / 360, sat, (band % 2 ? 0.6 : 0.5) + (tint ? -0.06 : 0));
        a = clamp((i - 14) / 22, 0, 1) * (edge ? 0.7 : 0.85);
      }
      pal[i] = (Math.round(255 * alpha * a) << 24) | (b << 16) | (g << 8) | r;
    }
    for (let i = 0; i < W * H; i++) d[i] = pal[buf[i]];
    x.putImageData(this.img, 0, 0);
    return c;
  },

  /* ---------- behind the tiles and characters: the strong part ---------- */
  back(ctx, play, W, H) {
    const L = this.levels(play); if (L.lsd <= 0.001 && L.shroom <= 0.001 && L.joint <= 0.001) return;
    const calm = this.calm(), t = calm ? 0 : play.t;
    ctx.save();
    if (L.joint > 0.001) {
      // a green haze settles over the background
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(120,230,120,${0.28 * L.joint})`); g.addColorStop(1, `rgba(60,160,80,${0.4 * L.joint})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    const k = Math.max(L.lsd, L.shroom * 0.7);
    if (k > 0.001) {
      const buf = Game.quality >= 1 ? this.frame(calm ? 0 : t) : null;
      if (buf) {
        const lsd = L.lsd >= L.shroom * 0.7, hue = lsd ? (t * 70) % 360 : 260 + Math.sin(t * 0.8) * 40;
        const c = this.paint(buf, hue, lsd ? 0.95 : 0.8, 1, !lsd);
        // a kaleidoscope: the frame and its mirror image turning against each other, scaled to cover the view
        const R = Math.hypot(W, H) * (1.08 + 0.1 * Math.sin(t * 0.7)), cx = W / 2, cy = H / 2;
        ctx.imageSmoothingEnabled = true;
        ctx.save(); ctx.globalAlpha = 0.8 * k * (calm ? 0.5 : 1); ctx.translate(cx, cy); ctx.rotate(t * 0.1);
        ctx.drawImage(c, -R / 2, -R * 0.28, R, R * 0.5625); ctx.restore();
      } else {
        // the cheap version: a slow rainbow gradient
        const g = ctx.createLinearGradient(0, 0, W, H);
        for (let i = 0; i <= 4; i++) g.addColorStop(i / 4, `hsla(${(t * 60 + i * 72) % 360},90%,60%,${0.35 * k})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
    }
    ctx.restore();
  },

  /* ---------- over the whole game view (before the HUD): breath, colour, smoke ---------- */
  post(ctx, play, W, H) {
    const L = this.levels(play); if (L.lsd <= 0.001 && L.shroom <= 0.001 && L.joint <= 0.001) return;
    const calm = this.calm(), t = play.t, S = Game.S, p = play.player;
    ctx.save();
    // the breath: the world swells and settles around Brady (never below 1: no empty edges)
    const amp = calm || Game.quality < 1 ? 0 : 0.045 * L.lsd + 0.025 * L.shroom + 0.012 * L.joint;
    if (amp > 0.002 && p) {
      const tmp = PostFX.ensure('tripWarp', W, H), tx = tmp.getContext('2d');
      tx.globalCompositeOperation = 'copy'; tx.drawImage(ctx.canvas, Game.gameRect.x * Game.dpr, Game.gameRect.y * Game.dpr, W, H, 0, 0, W, H);
      const br = 0.5 + 0.5 * Math.sin(t * TAU / 2.6), sx = 1 + amp * (0.35 + 0.65 * br), sy = 1 + amp * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * TAU / 2.6 + 0.9)));
      const px = clamp((p.cx - play.camX) * S, W * 0.2, W * 0.8), py = clamp((p.cy - play.camY) * S, H * 0.2, H * 0.8);
      ctx.translate(px, py); ctx.scale(sx, sy); ctx.translate(-px, -py);
      ctx.drawImage(tmp, 0, 0);
      ctx.setTransform(1, 0, 0, 1, Game.gameRect.x * Game.dpr, Game.gameRect.y * Game.dpr);
    }
    // LSD: weird colours over everything (a hue wash), and a faint fractal sheen so it is "in" the tiles too
    if (L.lsd > 0.001) {
      ctx.globalCompositeOperation = 'hue'; ctx.globalAlpha = 0.22 * L.lsd;
      const g = ctx.createLinearGradient(0, 0, W, H);
      for (let i = 0; i <= 4; i++) g.addColorStop(i / 4, `hsl(${((calm ? 200 : t * 90) + i * 80) % 360},100%,55%)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const c = PostFX.tripSmall;
      if (c && Game.quality >= 1 && L.lsd > 0.4) { ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.3 * L.lsd; ctx.drawImage(c, 0, 0, W, H); }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    // the mushroom: a softer purple-pink colour shift and slow glowing sparkles
    if (L.shroom > 0.001) {
      const hue = calm ? 300 : (t * 80) % 360;
      ctx.globalCompositeOperation = 'color'; ctx.globalAlpha = 0.2 * L.shroom;
      const g = ctx.createLinearGradient(0, 0, W, H);
      for (let i = 0; i <= 4; i++) g.addColorStop(i / 4, `hsl(${(hue + i * 60) % 360},90%,62%)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const n = calm ? 6 : 16;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + (calm ? 0 : t * 0.35), r = (0.3 + ((i * 37) % 10) / 16) * Math.min(W, H) * 0.62;
        const x = W / 2 + Math.cos(a) * r * 1.3, y = H / 2 + Math.sin(a) * r * 0.75, sz = (16 + (i % 3) * 8) * S * (0.7 + 0.3 * Math.sin(t * 3 + i));
        ctx.globalAlpha = 0.5 * L.shroom; ctx.drawImage(PostFX.glow(`hsl(${(hue + i * 40) % 360},100%,70%)`), x - sz, y - sz, sz * 2, sz * 2);
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    }
    // the joint: a green wash, then the smoke wisps and a hazy green rim composed at quarter resolution and laid over
    // the view with one scaled draw (fill-rate friendly on a phone)
    if (L.joint > 0.001) {
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
    }
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
function hsl2rgb(h, s, l) {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t % 1 + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}
try { window.BRADY_POWERS = Object.assign(window.BRADY_POWERS || {}, { TripFX, PostFX }); } catch (e) { /* not in a browser */ }
