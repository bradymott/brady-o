/* ============================================================
   Retro renderer for Brady-O Classic.
   The normal scene is drawn, shrunk so every 32px tile becomes a
   16-pixel retro tile, snapped to an original 48-colour palette with
   ordered dithering, then scaled back up with hard pixel edges and
   CRT scanlines on top.
   ============================================================ */
const Retro = {
  // an original palette tuned for desert sunsets, neon and night skies
  PALETTE: [
    '#000000', '#0a0a1c', '#14143a', '#1c1a28', '#3c3a4e', '#6c6a80', '#a4a2b4', '#dcdae4', '#ffffff',
    '#24184a', '#3a2460', '#5a3c78', '#3c1068', '#8434c4', '#c474fc', '#fc54d8',
    '#101c5c', '#2448b4', '#4c8cf4', '#8cc4fc', '#6a8ef0',
    '#0c4418', '#1c8830', '#4cc044', '#a4ec74',
    '#2a1408', '#4a2410', '#5c3018', '#8c4c1c', '#c87c34', '#f4ac64', '#fcdcac',
    '#b88a5c', '#d4a878', '#f4c890', '#a85848', '#e8906c',
    '#740c1c', '#d02c3c', '#fc6c7c', '#fcb4c4',
    '#c4a000', '#fcd834', '#fcf0a4',
    '#087878', '#24c8c8', '#a0fcf0', '#e86c1c'
  ],
  BAYER: [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5],
  lut: null, pr: null, pg: null, pb: null,
  build() {
    const n = this.PALETTE.length;
    this.pr = new Uint8Array(n); this.pg = new Uint8Array(n); this.pb = new Uint8Array(n);
    this.PALETTE.forEach((h, i) => { const v = parseInt(h.slice(1), 16); this.pr[i] = v >> 16; this.pg[i] = (v >> 8) & 255; this.pb[i] = v & 255; });
    // 15-bit colour -> nearest palette entry (weighted "redmean" distance)
    const lut = new Uint8Array(32768);
    for (let c = 0; c < 32768; c++) {
      const r = ((c >> 10) & 31) * 8.2258, g = ((c >> 5) & 31) * 8.2258, b = (c & 31) * 8.2258;
      let best = 0, bd = 1e12;
      for (let i = 0; i < n; i++) {
        const rm = (r + this.pr[i]) * 0.5, dr = r - this.pr[i], dg = g - this.pg[i], db = b - this.pb[i];
        const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
        if (d < bd) { bd = d; best = i; }
      }
      lut[c] = best;
    }
    this.lut = lut;
  },
  scanCanvas: null,
  scanlines(W, H, period) {
    const key = W + 'x' + H + ':' + period.toFixed(2);
    if (this.scanKey === key) return this.scanCanvas;
    const c = makeCanvas(W, H), x = c.getContext('2d');
    const th = Math.max(1, Math.round(period * 0.34));
    x.fillStyle = 'rgba(0,0,0,0.22)';
    for (let y = 0; y < H; y += period) x.fillRect(0, Math.round(y + period - th), W, th);
    // soft CRT edge darkening
    const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    this.scanCanvas = c; this.scanKey = key;
    return c;
  },
  // ctx is translated so (0,0) is the game view's top-left in device pixels
  apply(ctx, play, W, H, gx, gy) {
    const lw = Math.max(16, Math.round(Game.viewW / 2)), lh = Math.max(16, Math.round(Game.viewH / 2));
    const low = PostFX.ensure('retroLow', lw, lh);
    const lx = low.getContext('2d');
    lx.imageSmoothingEnabled = true;
    lx.globalCompositeOperation = 'copy';
    lx.drawImage(Game.canvas, gx, gy, W, H, 0, 0, lw, lh);
    lx.globalCompositeOperation = 'source-over';
    if (Game.quality >= 1) {
      if (!this.lut) this.build();
      let img;
      try { img = lx.getImageData(0, 0, lw, lh); } catch (e) { img = null; }
      if (img) {
        const d = img.data, lut = this.lut, pr = this.pr, pg = this.pg, pb = this.pb, bay = this.BAYER;
        for (let y = 0; y < lh; y++) {
          const row = (y & 3) * 4;
          for (let x = 0; x < lw; x++) {
            const i = (y * lw + x) * 4;
            const bias = (bay[row + (x & 3)] - 7.5) * 0.9;
            let r = d[i] + bias, g = d[i + 1] + bias, b = d[i + 2] + bias;
            r = r < 0 ? 0 : r > 255 ? 255 : r; g = g < 0 ? 0 : g > 255 ? 255 : g; b = b < 0 ? 0 : b > 255 ? 255 : b;
            const k = lut[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)];
            d[i] = pr[k]; d[i + 1] = pg[k]; d[i + 2] = pb[k]; d[i + 3] = 255;
          }
        }
        lx.putImageData(img, 0, 0);
      }
    }
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalCompositeOperation = 'copy';
    ctx.drawImage(low, 0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.scanlines(W, H, H / lh), 0, 0);
    ctx.restore();
  },
  // music for Classic: chiptune versions keyed by the kind of level
  track(play, name) {
    if (name === 'boss' || name === 'final' || name === 'buzzkill') return 'retro_boss';
    if (name === 'clear') return 'retro_clear';
    if (name === 'star' || name === 'sloth') return name;
    const ty = play.area && play.area.bonus ? 'under' : play.level.type;
    return ty === 'under' ? 'retro_under' : ty === 'sky' ? 'retro_sky' : ty === 'castle' ? 'retro_castle' : 'retro_over';
  }
};
