/* ============================================================
   Ink: the Fiesta Toon outline. Anything drawn through Ink.around
   gets a thick dark line around its silhouette, so characters,
   enemies, items and bosses pop off the background. The thing is
   painted into a scratch canvas at the screen's scale, its
   silhouette is stamped in ink around it, then the colour goes on
   top: existing art needs no changes.
   ============================================================ */
/* how much larger than their hitboxes characters are drawn (the physics never changes): Brady and enemies */
const ART_SCALE = { brady: 1.2, enemy: 1.15 };
const Ink = {
  on: true,
  color: '#1c1426',
  width: 1.3,            // logical px (about 4 device px on an iPhone)
  pool: [],
  canvas(i, w, h) {
    let c = this.pool[i];
    if (!c) { c = this.pool[i] = makeCanvas(w, h); }
    if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); }
    return c;
  },
  /* around(ctx, x, y, w, h, fn, opts): fn(ctx) draws in the current (world) coordinates; x,y,w,h is the box it
     stays inside (plus opts.pad logical px of slack, default 16). opts.width overrides the line width. */
  around(ctx, x, y, w, h, fn, opts) {
    if (!this.on || !ctx.getTransform) { fn(ctx); return; }
    const o = opts || {}, pad = o.pad != null ? o.pad : 16;
    const m = ctx.getTransform();
    const S = Math.hypot(m.a, m.b);
    if (!(S > 0)) { fn(ctx); return; }
    // the box in device space
    const px = [x - pad, x + w + pad], py = [y - pad, y + h + pad];
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const X of px) for (const Y of py) { const dx = m.a * X + m.c * Y + m.e, dy = m.b * X + m.d * Y + m.f; x0 = Math.min(x0, dx); y0 = Math.min(y0, dy); x1 = Math.max(x1, dx); y1 = Math.max(y1, dy); }
    const r = Math.max(1, (o.width || this.width) * S);
    const bx = Math.floor(x0 - r - 1), by = Math.floor(y0 - r - 1);
    const bw = Math.ceil(x1 - x0 + 2 * r + 2), bh = Math.ceil(y1 - y0 + 2 * r + 2);
    if (bw > 2048 || bh > 2048 || bw <= 0 || bh <= 0) { fn(ctx); return; }
    // 1. the colour pass
    const c0 = this.canvas(0, bw, bh), s0 = c0.getContext('2d');
    s0.setTransform(1, 0, 0, 1, 0, 0); s0.globalCompositeOperation = 'source-over'; s0.globalAlpha = 1; s0.clearRect(0, 0, bw, bh);
    s0.setTransform(m.a, m.b, m.c, m.d, m.e - bx, m.f - by);
    s0.save(); fn(s0); s0.restore();
    // 2. the ink silhouette
    const c1 = this.canvas(1, bw, bh), s1 = c1.getContext('2d');
    s1.setTransform(1, 0, 0, 1, 0, 0); s1.globalCompositeOperation = 'source-over'; s1.globalAlpha = 1; s1.clearRect(0, 0, bw, bh);
    // only solid paint gets a line: stamp the colour pass three times (alpha saturates), then square the alpha
    // twice so soft glows, shadows and sparkle (alpha below about 0.5) fade out of the silhouette
    s1.drawImage(c0, 0, 0, bw, bh, 0, 0, bw, bh); s1.drawImage(c0, 0, 0, bw, bh, 0, 0, bw, bh); s1.drawImage(c0, 0, 0, bw, bh, 0, 0, bw, bh);
    s1.globalCompositeOperation = 'destination-in'; s1.drawImage(c1, 0, 0, bw, bh, 0, 0, bw, bh); s1.drawImage(c1, 0, 0, bw, bh, 0, 0, bw, bh);
    s1.globalCompositeOperation = 'source-in'; s1.fillStyle = o.color || this.color; s1.fillRect(0, 0, bw, bh);
    s1.globalCompositeOperation = 'source-over';
    // 3. stamp the ink around, then the colour on top
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const n = r > 3 ? 16 : 8;
    for (let k = 0; k < n; k++) { const a = k / n * TAU; ctx.drawImage(c1, 0, 0, bw, bh, bx + Math.cos(a) * r, by + Math.sin(a) * r, bw, bh); }
    if (r > 2.5) for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * TAU; ctx.drawImage(c1, 0, 0, bw, bh, bx + Math.cos(a) * r * 0.55, by + Math.sin(a) * r * 0.55, bw, bh); }
    ctx.drawImage(c0, 0, 0, bw, bh, bx, by, bw, bh);
    ctx.restore();
  },
  // around an entity (x, y, w, h), with slack for art that spills past the hitbox
  ent(ctx, e, fn, opts) { this.around(ctx, e.x, e.y, e.w, e.h, fn, Object.assign({ pad: Math.max(16, e.w * 0.6, e.h * 0.4) }, opts || {})); }
};
