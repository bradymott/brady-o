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
