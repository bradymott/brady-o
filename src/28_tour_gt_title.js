/* ============================================================
   Super Brady-O World: the title show and the home-screen icon.
   Brady jogs around a little toon globe while landmarks from every
   land pop up over its rim, the plane loops the sky, the Baron's
   blimp drifts past with a bottled landmark, postcards flutter.
   The logo is lettered in canvas (inked letters, a highlight band,
   a chunky extrusion, a spinning globe for the O) and drops in with
   a bounce. Tap: Brady hops into his plane and it takes off into
   the map.
   Everything still is painted once into offscreen canvases (at the
   screen's pixel density) when the layout is built; a frame is
   mostly blits plus a few flat paths. No shadowBlur, no filters, no
   allocations per frame. Reduced motion: a calm version.
   Only the world app uses it (it replaces TitleScene there, at the
   end of this file); the combined test build keeps its game picker.
   ============================================================ */
const SBWT = {
  INK: '#1c1426',
  CREAM: '#fff4dc',
  CONF: ['#ffd23a', '#ff4f8a', '#22c4b4', '#ff9a2e', '#7a5af0', '#7ad84a', '#ffffff'],
  // an offscreen sprite: a canvas at device scale k for a logical w x h box with its anchor at (ax, ay)
  sprite(w, h, ax, ay, k, draw) {
    const c = makeCanvas(Math.ceil(w * k), Math.ceil(h * k)), x = c.getContext('2d');
    x.setTransform(k, 0, 0, k, ax * k, ay * k); x.lineJoin = 'round'; x.lineCap = 'round';
    draw(x);
    return { c, w, h, ax, ay, u: k / (Game.dpr || 1) };   // u: points per unit when drawn at scale 1
  },
  // draw a sprite at logical (x, y) with a uniform scale (and optionally a rotation)
  blit(ctx, s, x, y, sc, rot, sx) {
    if (!s) return;
    sc *= s.u;
    const d = Game.dpr, cs = Math.cos(rot || 0) * sc, sn = Math.sin(rot || 0) * sc, fx = sx == null ? 1 : sx;
    ctx.setTransform(d * cs * fx, d * sn * fx, -d * sn, d * cs, d * x, d * y);
    ctx.drawImage(s.c, -s.ax, -s.ay, s.w, s.h);
  },
  // the Fiesta Toon outline (Ink) around anything drawn in fn, into a sprite
  inked(w, h, ax, ay, k, fn, opts) {
    return this.sprite(w, h, ax, ay, k, x => Ink.around(x, -ax + 4, -ay + 4, w - 8, h - 8, fn, Object.assign({ pad: 2 }, opts || {})));
  },
  ease: {
    outBack(u) { const s = 1.7; u = clamp(u, 0, 1) - 1; return u * u * ((s + 1) * u + s) + 1; },
    out(u) { u = clamp(u, 0, 1); return 1 - (1 - u) * (1 - u) * (1 - u); },
    inOut(u) { u = clamp(u, 0, 1); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
  },
  reduce() { return typeof TourKit !== 'undefined' && TourKit.reduceMotion ? TourKit.reduceMotion() : false; },
  look() { return (Save.data && Save.data.look) || { hair: 0, skin: 1 }; },

  /* ---------- Brady, drawn by the game's own function with the in-game ink ---------- */
  brady(k, anim, flip) {
    // feet at (0, 0); the box covers the bun and raised arms
    return this.sprite(84, 118, 42, 108, k, x => Ink.around(x, -34, -98, 68, 100, c => drawBrady(c, { x: 0, y: 0, facing: flip ? -1 : 1, small: false, power: 0, anim, hair: null, look: this.look(), time: anim.t || 0 }), { pad: 6, width: 1.0, color: '#120e16', rim: '#e7e3d7' }));
  },

  /* ---------- props ---------- */
  cloud(k, w) {
    const h = w * 0.5;
    return this.inked(w + 16, h + 16, (w + 16) / 2, h + 8, k, x => {
      x.fillStyle = '#ffffff';
      x.beginPath(); x.ellipse(-w * 0.25, -h * 0.32, w * 0.24, h * 0.32, 0, 0, TAU); x.ellipse(w * 0.05, -h * 0.55, w * 0.27, h * 0.45, 0, 0, TAU); x.ellipse(w * 0.3, -h * 0.3, w * 0.2, h * 0.3, 0, 0, TAU); x.fill();
      x.beginPath(); x.moveTo(-w * 0.47, 0); x.lineTo(w * 0.47, 0); x.quadraticCurveTo(w * 0.5, -h * 0.3, w * 0.3, -h * 0.3); x.lineTo(-w * 0.3, -h * 0.3); x.quadraticCurveTo(-w * 0.5, -h * 0.2, -w * 0.47, 0); x.fill();
      x.fillStyle = '#d6ecfb'; x.beginPath(); x.moveTo(-w * 0.46, -1); x.lineTo(w * 0.46, -1); x.quadraticCurveTo(w * 0.4, -h * 0.2, w * 0.2, -h * 0.16); x.quadraticCurveTo(0, -h * 0.24, -w * 0.25, -h * 0.14); x.quadraticCurveTo(-w * 0.42, -h * 0.14, -w * 0.46, -1); x.fill();
    }, { width: 1.6, form: false });
  },
  // the plane, with Brady in the open cockpit (or empty); nose to the right, wheels at y = 0
  plane(k, withBrady) {
    return this.inked(112, 100, 52, 76, k, x => {
      const I = this.INK; x.strokeStyle = I; x.lineWidth = 1.6;
      // tail and back wing
      x.fillStyle = '#22c4b4'; x.beginPath(); x.moveTo(-40, -14); x.lineTo(-50, -36); x.lineTo(-38, -36); x.lineTo(-26, -16); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#e8336e'; x.beginPath(); x.ellipse(-4, -10, 20, 5, -0.15, 0, TAU); x.fill(); x.stroke();
      // Brady sitting in the cockpit
      if (withBrady) { x.save(); x.translate(2, -6); x.scale(0.66, 0.66); drawBrady(x, { x: 0, y: 0, facing: 1, small: false, power: 0, anim: { state: 'fall', t: 0, phase: 0, happy: true }, hair: null, look: this.look(), time: 0 }); x.restore(); }
      // fuselage
      x.fillStyle = '#fff4dc'; x.beginPath(); x.moveTo(-44, -18); x.quadraticCurveTo(-10, -32, 30, -24); x.quadraticCurveTo(44, -20, 44, -12); x.quadraticCurveTo(40, -2, 20, -2); x.quadraticCurveTo(-20, 0, -44, -14); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#ffd23a'; x.beginPath(); x.moveTo(-36, -12); x.quadraticCurveTo(0, -10, 40, -12); x.lineTo(40, -8); x.quadraticCurveTo(0, -5, -34, -8); x.closePath(); x.fill();
      // nose cone and windscreen
      x.fillStyle = '#ff4f8a'; x.beginPath(); x.moveTo(34, -24); x.quadraticCurveTo(48, -20, 47, -12); x.quadraticCurveTo(46, -4, 34, -3); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#9ae6ff'; x.beginPath(); x.moveTo(14, -26); x.quadraticCurveTo(18, -36, 26, -25); x.closePath(); x.fill(); x.stroke();
      // front wing, wheels
      x.fillStyle = '#ff4f8a'; x.beginPath(); x.moveTo(-10, -12); x.lineTo(16, -12); x.lineTo(12, 4); x.lineTo(-18, 4); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(-2, -4, 3, 0, TAU); x.fill();
      x.beginPath(); x.moveTo(8, -2); x.lineTo(10, 6); x.stroke(); x.fillStyle = '#3a2a3a'; x.beginPath(); x.arc(10, 8, 4, 0, TAU); x.fill(); x.stroke();
      x.fillStyle = '#ffd23a'; x.beginPath(); x.arc(47, -12, 2.6, 0, TAU); x.fill(); x.stroke();
    }, { width: 1.4 });
  },
  // the Baron's blimp with a bottled landmark slung under it (a little windmill in a jar)
  blimp(k) {
    return this.inked(170, 150, 85, 60, k, x => {
      const I = this.INK; x.strokeStyle = I; x.lineWidth = 1.8;
      for (const s of [-1, 1]) { x.fillStyle = '#4a1a8a'; x.beginPath(); x.moveTo(-58, s * 6 - 8); x.lineTo(-78, s * 22 - 8); x.lineTo(-66, s * 2 - 8); x.closePath(); x.fill(); x.stroke(); }
      x.fillStyle = '#7a3ad8'; x.beginPath(); x.ellipse(0, -8, 66, 34, 0, 0, TAU); x.fill(); x.stroke();
      x.fillStyle = '#9a5af0'; x.beginPath(); x.ellipse(-8, -20, 46, 14, 0, 0, TAU); x.fill();
      x.fillStyle = '#ffd23a'; x.beginPath(); x.ellipse(0, -8, 66, 6, 0, 0, TAU); x.fill(); x.stroke();
      x.fillStyle = '#ffd23a'; x.beginPath(); x.arc(26, -8, 11, 0, TAU); x.fill(); x.stroke();
      x.fillStyle = '#4a1a8a'; x.font = `bold 13px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('B', 26, -7);
      // gondola with the Baron's top hat poking out
      x.fillStyle = '#5a2a2a'; rr(x, -20, 24, 36, 12, 4); x.fill(); x.stroke();
      x.fillStyle = '#1a1020'; x.fillRect(-6, 13, 10, 11); x.strokeRect(-6, 13, 10, 11); x.fillStyle = '#ff4f8a'; x.fillRect(-6, 20, 10, 3);
      x.beginPath(); x.moveTo(-12, 24); x.lineTo(-6, 26); x.moveTo(10, 24); x.lineTo(4, 26); x.stroke();
      // the jar on two ropes
      x.lineWidth = 1.2; x.beginPath(); x.moveTo(-14, 36); x.lineTo(-10, 58); x.moveTo(10, 36); x.lineTo(6, 58); x.stroke(); x.lineWidth = 1.8;
      x.fillStyle = '#c9f2ff'; rr(x, -22, 58, 32, 34, 8); x.fill(); x.stroke();
      x.fillStyle = '#a8703a'; rr(x, -18, 54, 24, 7, 2); x.fill(); x.stroke();
      // the bottled windmill
      x.save(); x.translate(-6, 88); x.scale(0.5, 0.5); x.lineWidth = 2.4;
      TourOWPaint.P(x, [[-9, 0], [-7, -32], [7, -32], [9, 0]], '#f3e6cc'); TourOWPaint.P(x, [[-9, -32], [0, -42], [9, -32]], '#a8503a');
      x.translate(0, -32); x.rotate(0.4); for (let i = 0; i < 4; i++) { x.rotate(Math.PI / 2); x.fillStyle = '#fff8ea'; x.fillRect(1, -3, 22, 6); x.strokeRect(1, -3, 22, 6); }
      x.restore();
      x.fillStyle = 'rgba(255,255,255,0.7)'; rr(x, -18, 62, 5, 22, 2.5); x.fill();
    }, { width: 1.5 });
  },
  postcard(k, back) {
    return this.inked(64, 46, 32, 23, k, x => {
      x.strokeStyle = this.INK; x.lineWidth = 1.4;
      x.fillStyle = '#fffaf0'; rr(x, -28, -19, 56, 38, 3); x.fill(); x.stroke();
      if (!back) {
        const g = ['#ff9a2e', '#ffd23a', '#ff4f8a'];
        for (let i = 0; i < 3; i++) { x.fillStyle = g[i]; x.fillRect(-24, -15 + i * 10, 48, 10); }
        x.fillStyle = '#fff3c0'; x.beginPath(); x.arc(-6, 5, 9, Math.PI, TAU); x.fill();
        x.fillStyle = '#22c4b4'; x.beginPath(); x.moveTo(-24, 15); x.lineTo(-10, 2); x.lineTo(2, 10); x.lineTo(12, 0); x.lineTo(24, 15); x.closePath(); x.fill(); x.stroke();
        x.strokeRect(-24, -15, 48, 30);
      } else {
        x.fillStyle = '#ff4f8a'; x.fillRect(12, -14, 12, 14); x.strokeRect(12, -14, 12, 14);
        x.lineWidth = 1.2; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-22, -4 + i * 7); x.lineTo(6, -4 + i * 7); x.stroke(); }
        x.beginPath(); x.moveTo(9, -16); x.lineTo(9, 15); x.stroke();
        x.fillStyle = '#ff4f8a'; x.beginPath(); x.moveTo(-15, 13); x.bezierCurveTo(-21, 8, -18, 3, -15, 6); x.bezierCurveTo(-12, 3, -9, 8, -15, 13); x.fill();
      }
    }, { width: 1.3, form: false });
  },

  /* ---------- landmarks around the globe: one per land (no temples, shrines, churches or minarets) ---------- */
  LANDS: [
    { id: 'mx', crust: '#e8b85a', art: 'cactus', r: 22 },
    { id: 'ec', crust: '#7aa24a', art: 'volcano', r: 30, o: { lava: false, col: '#8a7a9a' } },
    { id: 'br', crust: '#4fae5a', art: 'sugarloaf', r: 30 },
    { id: 'mz', crust: '#d8a45a', art: 'baobab', r: 26 },
    { id: 'ma', crust: '#f0c070', art: 'palm', r: 28, o: { v: 0.8 } },
    { id: 'es', crust: '#c8b062', art: 'orange', r: 28 },
    { id: 'fr', crust: '#8ac86a', art: 'tower', r: 30 },
    { id: 'nl', crust: '#6ac85a', art: 'windmill', r: 30 },
    { id: 'id', crust: '#5ab85a', art: 'terraces', r: 30 },
    { id: 'vn', crust: '#4a9e6a', art: 'karst', r: 22, o: { col: '#6aa688' } },
    { id: 'jp', crust: '#7ac26a', art: 'train', r: 30 },
    { id: 'np', crust: '#b8c8d8', art: 'ridge', r: 32 },
    { id: 'aq', crust: '#f2f8fb', art: 'berg', r: 28 },
    { id: 'w22', crust: '#a88ae8', art: 'crystal', r: 26 }
  ],
  // extra painters in the overworld's style (TourOWPaint.art has the rest)
  art: {
    sugarloaf(c, r) {
      const T = TourOWPaint;
      T.P(c, [[-r * 1.1, 0], [-r * 1.05, -r * 0.6], [-r * 0.8, -r * 0.95], [-r * 0.5, -r * 0.7], [-r * 0.3, 0]], '#7a9a7a');
      c.beginPath(); c.moveTo(-r * 0.2, 0); c.bezierCurveTo(-r * 0.25, -r * 1.2, r * 0.05, -r * 1.75, r * 0.35, -r * 1.7); c.bezierCurveTo(r * 0.7, -r * 1.6, r * 0.75, -r * 0.8, r * 0.8, 0); c.closePath(); c.fillStyle = '#8a8aa0'; c.fill(); c.stroke();
      c.fillStyle = '#4f9a62'; c.beginPath(); c.moveTo(-r * 0.2, 0); c.quadraticCurveTo(-r * 0.15, -r * 0.5, r * 0.1, -r * 0.55); c.quadraticCurveTo(r * 0.5, -r * 0.6, r * 0.8, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(r * 0.15, -r * 1.35, r * 0.1, r * 0.28, 0.3, 0, TAU); c.fill();
      c.lineWidth = 1; c.beginPath(); c.moveTo(-r * 0.8, -r * 0.95); c.lineTo(r * 0.35, -r * 1.68); c.stroke(); c.lineWidth = 1.8;
      c.fillStyle = '#e8423a'; rr(c, -r * 0.3, -r * 1.42, r * 0.3, r * 0.2, 2); c.fill(); c.stroke();
    },
    tower(c, r) {
      const col = '#8a5a3a', h = r * 2.1;
      c.fillStyle = col;
      c.beginPath(); c.moveTo(-r * 0.62, 0); c.quadraticCurveTo(-r * 0.3, -h * 0.35, -r * 0.08, -h * 0.9); c.lineTo(0, -h); c.lineTo(r * 0.08, -h * 0.9); c.quadraticCurveTo(r * 0.3, -h * 0.35, r * 0.62, 0);
      c.lineTo(r * 0.36, 0); c.quadraticCurveTo(0, -h * 0.3, -r * 0.36, 0); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#c88a5a'; c.fillRect(-r * 0.42, -h * 0.3, r * 0.84, r * 0.14); c.strokeRect(-r * 0.42, -h * 0.3, r * 0.84, r * 0.14);
      c.fillRect(-r * 0.2, -h * 0.6, r * 0.4, r * 0.1); c.strokeRect(-r * 0.2, -h * 0.6, r * 0.4, r * 0.1);
      c.lineWidth = 0.9; c.beginPath(); for (let i = 1; i < 6; i++) { const y = -h * 0.3 - i * h * 0.1, w = r * (0.3 - i * 0.045); c.moveTo(-w, y); c.lineTo(w, y - h * 0.05); c.moveTo(w, y); c.lineTo(-w, y - h * 0.05); } c.stroke(); c.lineWidth = 1.8;
      c.fillStyle = '#ffd23a'; c.beginPath(); c.moveTo(0, -h); c.lineTo(9, -h + 3); c.lineTo(0, -h + 6); c.closePath(); c.fill(); c.stroke();
    },
    terraces(c, r) {
      const cols = ['#9ad85a', '#6ab84a', '#9ad85a', '#6ab84a', '#9ad85a'];
      for (let i = 0; i < 5; i++) { const w = r * (1.15 - i * 0.2), y = -i * r * 0.3; c.fillStyle = cols[i]; c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(-w * 0.9, y - r * 0.32, -w * 0.6, y - r * 0.32); c.lineTo(w * 0.6, y - r * 0.32); c.quadraticCurveTo(w * 0.9, y - r * 0.32, w, y); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(160,230,255,0.75)'; c.fillRect(-w * 0.5, y - r * 0.29, w * 0.7, 2.2); }
      c.fillStyle = '#4f8a4a'; c.beginPath(); c.arc(r * 0.05, -r * 1.75, r * 0.2, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#7a5434'; c.fillRect(r * 0.02, -r * 1.58, 3, r * 0.12);
    },
    train(c, r) {
      const L = r * 2.4;
      c.fillStyle = '#9a7a62'; c.fillRect(-L / 2, -4, L, 4); c.strokeRect(-L / 2, -4, L, 4);
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(-L / 2, -5); c.lineTo(-L / 2, -r * 0.62); c.lineTo(L * 0.18, -r * 0.62); c.quadraticCurveTo(L * 0.5, -r * 0.55, L * 0.52, -5); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#2a6ad8'; c.beginPath(); c.moveTo(-L / 2, -r * 0.24); c.lineTo(L * 0.42, -r * 0.24); c.lineTo(L * 0.47, -r * 0.14); c.lineTo(-L / 2, -r * 0.14); c.closePath(); c.fill();
      c.fillStyle = '#3a4a6a'; for (let i = 0; i < 5; i++) { rr(c, -L / 2 + 5 + i * L * 0.13, -r * 0.5, L * 0.08, r * 0.16, 2); c.fill(); }
      c.beginPath(); c.moveTo(L * 0.26, -r * 0.5); c.quadraticCurveTo(L * 0.4, -r * 0.48, L * 0.45, -r * 0.34); c.lineTo(L * 0.26, -r * 0.34); c.closePath(); c.fill();
      c.lineWidth = 1; c.beginPath(); c.moveTo(-L * 0.12, -r * 0.6); c.lineTo(-L * 0.12, -6); c.stroke(); c.lineWidth = 1.8;
    },
    ridge(c, r) {
      const pk = (x0, w, h, col) => { TourOWPaint.P(c, [[x0 - w, 0], [x0, -h], [x0 + w, 0]], col); TourOWPaint.P(c, [[x0 - w * 0.36, -h * 0.64], [x0, -h], [x0 + w * 0.36, -h * 0.64], [x0 + w * 0.12, -h * 0.7], [x0 - w * 0.06, -h * 0.6]], '#f6f8fb'); };
      pk(-r * 0.6, r * 0.55, r * 1.1, '#7a7ab8'); pk(r * 0.55, r * 0.5, r * 1.0, '#7a7ab8'); pk(0, r * 0.75, r * 1.65, '#6a6aa8');
      c.lineWidth = 1; const fl = ['#3a7ad8', '#ffffff', '#e8483a', '#4ab05a', '#ffd84a']; c.beginPath(); c.moveTo(-r * 1.1, -r * 0.4); c.quadraticCurveTo(-r * 0.6, -r * 0.2, -r * 0.2, -r * 0.35); c.stroke();
      for (let i = 0; i < 5; i++) { c.fillStyle = fl[i]; c.fillRect(-r * 1.0 + i * r * 0.17, -r * 0.36 + Math.abs(i - 2) * 1.2, 4, 5); } c.lineWidth = 1.8;
    },
    berg(c, r) { TourOWPaint.art.berg.call(TourOWPaint, c, r); TourOWPaint.art.penguin.call(TourOWPaint, c, r * 0.55); }
  },
  landmark(k, L) {
    const r = L.r, S = 1.35;
    return this.inked(r * 3.4 * S, r * 2.6 * S, r * 1.7 * S, r * 2.3 * S, k, x => {
      x.save(); x.scale(S, S); x.lineJoin = 'round'; x.lineCap = 'round'; x.strokeStyle = TourOWPaint.INK; x.lineWidth = 1.8;
      const fn = this.art[L.art] || TourOWPaint.art[L.art];
      if (fn) fn.call(this.art[L.art] ? this.art : TourOWPaint, x, r, L.o || {}, null);
      if (L.art === 'windmill') { x.translate(r * 0.75, 0); TourOWPaint.art.tulips.call(TourOWPaint, x, r * 0.5, { v: 0.2 }); }
      if (L.art === 'cactus') { x.translate(r * 0.8, 0); TourOWPaint.art.agave.call(TourOWPaint, x, r * 0.45); }
      x.restore();
    }, { width: 1.3 });
  },

  /* ---------- lettering ---------- */
  // one inked letter with a two-tone face, a cream highlight band, a deep extrusion and a cream keyline
  letter(ch, size, st, k) {
    const font = `${size}px ${FONT_DISPLAY}`;
    const mc = makeCanvas(4, 4).getContext('2d'); mc.font = font;
    const m = mc.measureText(ch), cap = this.capH(size);
    const L = size * 0.15, K = size * 0.075, ex = size * 0.04, ey = size * 0.1;
    const w = m.width + L + 2 * K + ex + 4, h = cap + L + 2 * K + ey + 4;
    const ax = (L / 2 + K + 2) + m.width / 2, ay = (L / 2 + K + 2) + cap;   // anchor: centre of the advance, on the baseline
    return this.sprite(w, h, ax, ay, k, x => {
      x.font = font; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      const steps = Math.max(2, Math.ceil(Math.hypot(ex, ey) * k / 1.2));
      x.strokeStyle = st.key || this.CREAM; x.lineWidth = L + 2 * K;
      for (let i = 0; i <= steps; i++) x.strokeText(ch, ex * i / steps, ey * i / steps);
      x.strokeStyle = this.INK; x.lineWidth = L;
      for (let i = 0; i <= steps; i++) x.strokeText(ch, ex * i / steps, ey * i / steps);
      x.fillStyle = st.ext;
      for (let i = 1; i <= steps; i++) x.fillText(ch, ex * i / steps, ey * i / steps);
      // the face, on its own canvas so the highlight stays inside the letter
      const f = makeCanvas(Math.ceil(w * k), Math.ceil(h * k)), fx = f.getContext('2d');
      fx.setTransform(k, 0, 0, k, ax * k, ay * k); fx.font = font; fx.textAlign = 'center'; fx.textBaseline = 'alphabetic';
      const g = fx.createLinearGradient(0, -cap, 0, 0);
      g.addColorStop(0, st.top); g.addColorStop(0.56, st.top); g.addColorStop(0.56, st.bot); g.addColorStop(1, st.bot);
      fx.fillStyle = g; fx.fillText(ch, 0, 0);
      fx.globalCompositeOperation = 'source-atop';
      fx.fillStyle = st.hi || 'rgba(255,250,236,0.85)'; rr(fx, -m.width / 2 + size * 0.06, -cap + size * 0.06, m.width - size * 0.12, cap * 0.16, cap * 0.08); fx.fill();
      fx.fillStyle = 'rgba(40,10,60,0.16)'; fx.fillRect(-m.width, -cap * 0.14, m.width * 2, cap * 0.14);
      x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(f, 0, 0);
    });
  },
  // the width of SUPER BRADY-O's main line at a font size: BRADY, the hyphen, the globe O, plus the ink
  logoW(f) { return this.width('BRADY', f) + this.width('-', f) * 0.9 + this.capH(f) * 1.24 + f * 0.3 + f * 0.16; },
  capH(size) {
    const mc = makeCanvas(4, 4).getContext('2d'); mc.font = `${size}px ${FONT_DISPLAY}`;
    const m = mc.measureText('B');
    return (m.actualBoundingBoxAscent || size * 0.72);
  },
  width(txt, size) { const mc = makeCanvas(4, 4).getContext('2d'); mc.font = `${size}px ${FONT_DISPLAY}`; return mc.measureText(txt).width; },
  // the "SUPER" ribbon: a pink banner with folded, notched ends
  ribbon(text, size, k, col, colD) {
    const tw = this.width(text, size), cap = this.capH(size), bw = tw + size * 1.0, bh = cap + size * 0.62, tail = size * 0.9;
    const W2 = bw + tail * 2 + 12, H2 = bh + size * 0.6 + 12;
    return this.sprite(W2, H2, W2 / 2, H2 / 2, k, x => {
      const I = this.INK, hw = bw / 2, hh = bh / 2, dy = size * 0.24;
      x.strokeStyle = I; x.lineWidth = size * 0.12;
      for (const s of [-1, 1]) {
        // tail behind
        x.fillStyle = colD; x.beginPath(); x.moveTo(s * (hw - size * 0.2), -hh + dy); x.lineTo(s * (hw + tail), -hh + dy); x.lineTo(s * (hw + tail * 0.62), dy); x.lineTo(s * (hw + tail), hh + dy); x.lineTo(s * (hw - size * 0.2), hh + dy); x.closePath(); x.fill(); x.stroke();
        x.fillStyle = shade(colD, -0.3); x.beginPath(); x.moveTo(s * hw, hh); x.lineTo(s * (hw - size * 0.2), hh + dy); x.lineTo(s * (hw - size * 0.2), hh); x.closePath(); x.fill(); x.stroke();
      }
      x.fillStyle = col; x.beginPath(); x.moveTo(-hw, -hh); x.quadraticCurveTo(0, -hh - size * 0.16, hw, -hh); x.lineTo(hw, hh); x.quadraticCurveTo(0, hh - size * 0.16, -hw, hh); x.closePath(); x.fill(); x.stroke();
      x.fillStyle = 'rgba(255,255,255,0.32)'; x.beginPath(); x.moveTo(-hw + 4, -hh + size * 0.12); x.quadraticCurveTo(0, -hh - size * 0.02, hw - 4, -hh + size * 0.12); x.lineTo(hw - 4, -hh + size * 0.24); x.quadraticCurveTo(0, -hh + size * 0.1, -hw + 4, -hh + size * 0.24); x.closePath(); x.fill();
      x.font = `${size}px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      x.lineWidth = size * 0.2; x.strokeStyle = I; x.strokeText(text, 0, cap / 2 - size * 0.04);
      x.fillStyle = this.CREAM; x.fillText(text, 0, cap / 2 - size * 0.04);
    });
  },
  // a chunky inked pill (the buttons): face colours, lip, label, optional icon painter
  pill(w, h, k, st, label, size, icon) {
    const lip = st.lip == null ? h * 0.14 : st.lip, L = Math.max(2.4, h * 0.07);
    const mk = (part) => this.sprite(w + L * 2 + 4, h + lip + L * 2 + 4, w / 2 + L + 2, h / 2 + L + 2, k, x => {
      const r = h / 2;
      if (part === 'lip') { x.fillStyle = this.INK; rr(x, -w / 2 - L / 2, -h / 2 + lip - L / 2, w + L, h + L, r + L / 2); x.fill(); x.fillStyle = st.lipCol; rr(x, -w / 2 + L / 2, -h / 2 + lip + L / 2, w - L, h - L, r - L / 2); x.fill(); return; }
      x.fillStyle = this.INK; rr(x, -w / 2 - L / 2, -h / 2 - L / 2, w + L, h + L, r + L / 2); x.fill();
      x.save(); rr(x, -w / 2 + L / 2, -h / 2 + L / 2, w - L, h - L, r - L / 2); x.clip();
      x.fillStyle = st.bot; x.fillRect(-w, -h, w * 2, h * 2);
      x.fillStyle = st.top; x.fillRect(-w, -h, w * 2, h * 0.5 + h * 0.04);
      x.fillStyle = 'rgba(255,255,255,0.38)'; rr(x, -w / 2 + h * 0.3, -h / 2 + h * 0.13, w - h * 0.6, h * 0.17, h * 0.085); x.fill();
      x.restore();
      x.font = `${size}px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle';
      const tw = x.measureText(label).width, iw = icon ? size * 1.25 : 0, tx = iw / 2;
      if (icon) { x.save(); x.translate(-tw / 2 - iw / 2 + tx - size * 0.15, 0); icon(x, size * 0.5, st); x.restore(); }
      if (st.textInk) { x.lineWidth = size * 0.2; x.strokeStyle = this.INK; x.strokeText(label, tx, size * 0.06); }
      x.fillStyle = st.text; x.fillText(label, tx, size * 0.06);
    });
    return { lip: mk('lip'), face: mk('face'), lipH: lip };
  },
  icons: {
    gear(x, r, st) {
      x.fillStyle = st.text; x.beginPath();
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, R = i % 2 ? r * 0.72 : r; x.lineTo(Math.cos(a - 0.12) * R, Math.sin(a - 0.12) * R); x.lineTo(Math.cos(a + 0.12) * R, Math.sin(a + 0.12) * R); }
      x.closePath(); x.fill(); x.fillStyle = st.bot; x.beginPath(); x.arc(0, 0, r * 0.32, 0, TAU); x.fill();
    },
    shirt(x, r, st) {
      x.fillStyle = st.text; x.beginPath(); x.moveTo(-r * 0.35, -r * 0.85); x.lineTo(-r, -r * 0.45); x.lineTo(-r * 0.7, -r * 0.05); x.lineTo(-r * 0.5, -r * 0.2); x.lineTo(-r * 0.5, r * 0.9); x.lineTo(r * 0.5, r * 0.9); x.lineTo(r * 0.5, -r * 0.2); x.lineTo(r * 0.7, -r * 0.05); x.lineTo(r, -r * 0.45); x.lineTo(r * 0.35, -r * 0.85); x.quadraticCurveTo(0, -r * 0.45, -r * 0.35, -r * 0.85); x.fill();
    },
    star(x, r, st) { x.fillStyle = st.text; x.beginPath(); TourKit.star(x, 0, r * 0.08, r, r * 0.45, 5); x.fill(); }
  },
  // the progress chip under CONTINUE: a little plane + lands, a postcard + postcards found
  chip(lands, cards, size, k) {
    const t1 = lands + (lands === 1 ? ' LAND' : ' LANDS'), t2 = cards + (cards === 1 ? ' POSTCARD' : ' POSTCARDS');
    const f = `${size}px ${FONT_DISPLAY}`, mc = makeCanvas(4, 4).getContext('2d'); mc.font = f;
    const w1 = mc.measureText(t1).width, w2 = mc.measureText(t2).width, ic = size * 1.5, gap = size * 1.2;
    const w = ic + w1 + gap + ic + w2 + size * 1.6, h = size * 2.1;
    return this.sprite(w + 4, h + 4, w / 2 + 2, h / 2 + 2, k, x => {
      x.fillStyle = 'rgba(28,20,38,0.72)'; rr(x, -w / 2, -h / 2, w, h, h / 2); x.fill();
      x.font = f; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = this.CREAM;
      let px = -w / 2 + size * 0.8;
      // plane glyph
      x.save(); x.translate(px + ic * 0.45, 0); x.fillStyle = '#ffd23a'; x.beginPath(); x.ellipse(0, 0, ic * 0.45, ic * 0.14, 0, 0, TAU); x.fill(); x.fillStyle = '#ff4f8a'; x.beginPath(); x.moveTo(-ic * 0.05, 0); x.lineTo(ic * 0.08, -ic * 0.38); x.lineTo(ic * 0.2, -ic * 0.38); x.lineTo(ic * 0.15, 0); x.lineTo(ic * 0.2, ic * 0.38); x.lineTo(ic * 0.08, ic * 0.38); x.closePath(); x.fill(); x.restore();
      px += ic; x.fillStyle = this.CREAM; x.fillText(t1, px, size * 0.06); px += w1 + gap;
      x.save(); x.translate(px + ic * 0.45, 0); x.fillStyle = '#fffaf0'; rr(x, -ic * 0.45, -ic * 0.32, ic * 0.9, ic * 0.64, 2); x.fill(); x.fillStyle = '#ff4f8a'; x.fillRect(ic * 0.12, -ic * 0.24, ic * 0.24, ic * 0.26); x.fillStyle = '#ff9a2e'; x.fillRect(-ic * 0.36, -ic * 0.24, ic * 0.38, ic * 0.48); x.restore();
      px += ic; x.fillStyle = this.CREAM; x.fillText(t2, px, size * 0.06);
    });
  },
  text(txt, size, k, col, font) {
    const f = `${size}px ${font || FONT_UI}`, mc = makeCanvas(4, 4).getContext('2d'); mc.font = f;
    const w = mc.measureText(txt).width + 4, h = size * 1.4;
    return this.sprite(w, h, w / 2, h / 2, k, x => { x.font = f; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.fillText(txt, 0, 0); });
  }
};

/* ============================================================ the scene ============================================================ */
class SBWTitleScene {
  constructor() {
    this.t = 0; this.taps = 0; this.headbang = 0; this.toastMsg = ''; this.toastT = 0; this.toastShown = '';
    this.go = null; this.press = 0; this.resume = true; this.focus = 0;
    this.spin = 0; this.mode = 'run'; this.modeT = 0; this.hop = 0;
    this.calm = SBWT.reduce();
    Input.setMode('ui');
    Sound.setRetro && Sound.setRetro(false);
    Sound.music('title');
    // pools (no allocations per frame)
    this.conf = []; for (let i = 0; i < 64; i++) this.conf.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, w: 0, h: 0, ph: 0, c: '#fff', life: 0 });
    this.puffs = []; for (let i = 0; i < 18; i++) this.puffs.push({ on: false, x: 0, y: 0, age: 0, r: 0 });
    this.cards = []; for (let i = 0; i < 3; i++) this.cards.push({ x: 0, y: 0, ph: i * 2.1, sp: 0.6 + i * 0.17, back: false });
    this.puffT = 0; this.confT = 0; this.landed = false;
    this.build();
  }
  get hasSave() { const d = Save.data; return !!(d && (d.seenTourIntro || Object.keys(d.done || {}).length)); }
  progress() {
    let lands = 0, cards = 0;
    try { const T = TourProgress.data(); for (const id in (T.seen || {})) if (T.seen[id] && Tour.countries[id]) lands++; cards = TourProgress.totals().gold; } catch (e) { /* no tour */ }
    return { lands, cards };
  }
  build() {
    const W = Game.cssW, H = Game.cssH, k = Game.dpr, portrait = H > W * 1.05;
    this.bW = W; this.bH = H; this.bK = k; this.portrait = portrait;
    const side = Math.max(16, insets.l + 10), sideR = Math.max(16, insets.r + 10), top = Math.max(12, insets.t + 8), bot = Math.max(10, insets.b + 6);
    const L = this.L = {};
    // the globe and Brady
    if (portrait) {
      L.R = W * 0.8; L.gx = W / 2; L.gTop = H * 0.665; L.gy = L.gTop + L.R; L.bh = Math.min(H * 0.2, W * 0.46);
    } else {
      L.R = Math.min(H * 0.56, W * 0.3); L.gx = Math.max(side + L.R * 0.55, W * 0.25); L.gTop = H * 0.71; L.gy = L.gTop + L.R; L.bh = H * 0.34;
    }
    L.bs = L.bh / 72;                        // Brady's scale (his units to points)
    L.bx = L.gx; L.by = L.gTop + 2;
    // the logo
    const colX0 = portrait ? side : Math.max(W * 0.48, L.gx + L.R * 0.62), colX1 = W - sideR, colW = colX1 - colX0;
    L.cx = (colX0 + colX1) / 2;
    const fw = colW * 0.97 / (SBWT.logoW(100) / 100);
    L.f = Math.max(30, Math.min(fw, portrait ? W * 0.2 : H * 0.23));
    L.logoTop = top + L.f * 0.1;
    // the call to action and the small buttons
    const ctaH = Math.max(52, Math.min(66, (portrait ? H : H) * 0.15)), ctaW = Math.min(colW * 0.86, portrait ? 300 : 300, Math.max(220, colW * 0.7));
    const smH = 44, gap = 10;
    const labels = [['LOOK', 'shirt'], ['SETTINGS', 'gear'], ['CREDITS', 'star']];
    const smSize = 12.5, smW = labels.map(([l]) => SBWT.width(l, smSize) + smSize * 1.25 + 34);
    const rowW = smW.reduce((a, b) => a + b, 0) + gap * 2;
    let rowX = portrait ? (W - rowW) / 2 : colX1 - rowW, rowY = H - bot - smH - 4;
    if (!portrait && rowX < colX0 - 30) { rowX = W - sideR - rowW; }
    this.small = labels.map(([l, ic], i) => { const x = rowX + smW.slice(0, i).reduce((a, b) => a + b, 0) + gap * i; return { x, y: rowY, w: smW[i], h: smH, label: l, icon: ic }; });
    const logoH = L.f * 2.3;
    const ctaY = portrait ? Math.max(L.gTop + (rowY - L.gTop) * 0.34 - ctaH / 2, L.gTop + 30) : Math.min(L.logoTop + logoH + 10, rowY - ctaH - 44);
    this.cta = { x: L.cx - ctaW / 2, y: ctaY, w: ctaW, h: ctaH };
    if (portrait) this.cta.x = W / 2 - ctaW / 2;
    this.chipY = this.cta.y + ctaH + 10 + 13;
    // Brady's tap box (easter egg)
    this.bradyBox = { x: L.bx - L.bh * 0.3, y: L.by - L.bh, w: L.bh * 0.6, h: L.bh };
    // which part of the rim is on screen (for the landmarks' pop)
    let a0 = -Math.PI, a1 = Math.PI;
    for (let a = 0; a < Math.PI; a += 0.01) { const x = L.gx + Math.sin(a) * L.R, y = L.gy - Math.cos(a) * L.R; if (x > W + 30 || y > H + 10) { a1 = a; break; } }
    for (let a = 0; a > -Math.PI; a -= 0.01) { const x = L.gx + Math.sin(a) * L.R, y = L.gy - Math.cos(a) * L.R; if (x < -30 || y > H + 10) { a0 = a; break; } }
    L.a0 = a0; L.a1 = a1;
    L.spin = (this.calm ? 9 : 34) / L.R;   // radians per second: the rim moves about 34 pt/s
    this.buildCaches();
  }
  buildCaches() {
    const L = this.L, k = Game.dpr;
    const bk = L.bs * k;
    // Brady: an 8-frame jog, the victory pose and an idle frame
    this.run = []; for (let i = 0; i < 8; i++) this.run.push(SBWT.brady(bk, { state: 'run', t: i * 0.07, phase: i / 8 * TAU, speed: 0.8, happy: true }));
    this.vic = SBWT.brady(bk, { state: 'fall', t: 0, phase: 0, happy: true });      // both fists up: woo!
    this.reach = SBWT.brady(bk, { state: 'fly', t: 0, phase: 0, happy: true });     // leaning in to catch the plane
    this.idle = SBWT.brady(bk, { state: 'idle', t: 0.6, phase: 0, happy: true });
    // landmarks at the globe's scale
    const lk = (L.bh / 118) * k;
    this.lands = SBWT.LANDS.map((d, i) => ({ d, s: SBWT.landmark(lk * 1.0, d), a: i / SBWT.LANDS.length * TAU, sc: L.bh / 92 }));
    // continents on the globe face (wheel-rotating blobs) as one path
    const p = new Path2D(), R = L.R;
    // blobs sit just inside the crust ring, where the face shows on screen
    const blob = (a, d, rx, ry) => { const x = Math.sin(a) * d * R, y = -Math.cos(a) * d * R; p.moveTo(x + Math.cos(a) * rx * R, y + Math.sin(a) * rx * R); p.ellipse(x, y, rx * R, ry * R, a, 0, TAU); };
    for (let i = 0; i < 11; i++) { const a = i / 11 * TAU + (i % 2) * 0.2; blob(a, 0.72 - (i % 3) * 0.05, 0.09 + (i % 3) * 0.035, 0.05 + (i % 2) * 0.025); if (i % 2) blob(a + 0.22, 0.55, 0.05, 0.035); }
    this.cont = p;
    const sh = new Path2D(); sh.arc(0, 0, R, 0, TAU); sh.arc(-R * 0.16, -R * 0.2, R * 0.98, 0, TAU, true); this.globeShade = sh;
    const hi = new Path2D(); hi.arc(0, 0, R * 0.965, Math.PI * 1.08, Math.PI * 1.55); hi.arc(R * 0.04, R * 0.06, R * 0.93, Math.PI * 1.55, Math.PI * 1.08, true); hi.closePath(); this.globeHi = hi;
    // clouds, props
    this.cloudS = [SBWT.cloud(k, 120), SBWT.cloud(k, 90), SBWT.cloud(k, 64)];
    const ps = Math.max(0.75, L.bh / 120);
    this.planeS = SBWT.plane(k * ps * 0.95, false); this.planeB = SBWT.plane(k * ps * 1.5, true); this.planeScale = ps;
    this.blimpS = SBWT.blimp(k * ps * (this.portrait ? 0.62 : 0.72));
    this.cardF = SBWT.postcard(k * ps, false); this.cardB = SBWT.postcard(k * ps, true);
    // lettering
    const f = L.f;
    const yel = { top: '#ffe04a', bot: '#ff9a2e', ext: '#b0245e' }, tea = { top: '#5ae8d8', bot: '#16a8b0', ext: '#1a3a7a' };
    const brady = 'BRADY'.split('').map(ch => ({ ch, s: SBWT.letter(ch, f, yel, k), w: SBWT.width(ch, f) }));
    const dash = { ch: '-', s: SBWT.letter('-', f, yel, k), w: SBWT.width('-', f) * 0.9 };
    const oW = SBWT.capH(f) * 1.24 + f * 0.3;
    const world = 'WORLD'.split('').map(ch => ({ ch, s: SBWT.letter(ch, f * 0.56, tea, k), w: SBWT.width(ch, f * 0.56) }));
    const totalW = brady.reduce((a, b) => a + b.w, 0) + dash.w + oW;
    let x = L.cx - totalW / 2 + f * 0.08; const capB = SBWT.capH(f), base1 = L.logoTop + f * 0.55 + capB;
    this.letters = [];
    brady.forEach((g, i) => { this.letters.push({ s: g.s, x: x + g.w / 2, y: base1, i, rot: (i % 2 ? 0.05 : -0.045) }); x += g.w; });
    this.letters.push({ s: dash.s, x: x + dash.w / 2, y: base1 - capB * 0.02, i: 5, rot: 0 }); x += dash.w;
    this.globeO = { x: x + oW / 2, y: base1 - capB / 2, r: capB * 0.62, i: 6 };
    L.logoL = L.cx - totalW / 2; L.logoR = L.cx + totalW / 2;
    // WORLD on a gentle arch, under the right half
    const ww = world.reduce((a, b) => a + b.w, 0) + f * 0.1 * 4, wx0 = Math.min(L.cx + totalW * 0.5 - ww, L.cx - ww / 2 + totalW * 0.14), base2 = base1 + f * 0.72;
    let wx = wx0; this.world = [];
    world.forEach((g, i) => { const u = (i - 2) / 2; this.world.push({ s: g.s, x: wx + g.w / 2, y: base2 + u * u * f * 0.08, i: 7 + i, rot: u * 0.1 }); wx += g.w + f * 0.1; });
    this.super = { s: SBWT.ribbon('SUPER', f * 0.32, k, '#ff4f8a', '#c42a62'), x: L.logoL + totalW * 0.3, y: L.logoTop + f * 0.18, rot: -0.07 };
    this.logoBottom = base2 + f * 0.2;
    // keep the CTA below the logo in landscape
    if (!this.portrait) { const room = this.small[0].y - this.logoBottom, need = this.cta.h + (this.hasSave ? 34 : 0); this.cta.y = this.logoBottom + Math.max(8, (room - need) * 0.42); }
    this.chipY = this.cta.y + this.cta.h + 10 + 13;
    // buttons
    const ctaLabel = this.hasSave ? 'CONTINUE' : 'TAP TO PLAY';
    this.ctaLabel = ctaLabel;
    this.ctaS = SBWT.pill(this.cta.w, this.cta.h, k, { top: '#ff6a9a', bot: '#ff3d7a', lipCol: '#9a1a4a', text: SBWT.CREAM, textInk: true }, ctaLabel, Math.min(this.cta.h * 0.4, (this.cta.w - 40) / (SBWT.width(ctaLabel, 10) / 10)));
    this.smallS = this.small.map(b => SBWT.pill(b.w, b.h, k, { top: '#fffaf0', bot: '#ffe7c4', lipCol: '#b8946a', text: SBWT.INK, lip: 5 }, b.label, 12.5, SBWT.icons[b.icon]));
    const pr = this.progress();
    this.chipS = this.hasSave ? SBWT.chip(pr.lands, pr.cards, 11, k) : null;
    this.verS = SBWT.text('v' + (typeof GAME_VERSION !== 'undefined' ? GAME_VERSION : '1') + ' · an original game', 10, k, 'rgba(28,20,38,0.6)');
    // the sky
    this.sky = null;
    this.fontOK = !(document.fonts && document.fonts.check) || document.fonts.check(`20px Bungee`);
    // clouds and postcards: starting spots
    const W = Game.cssW, H = Game.cssH;
    this.clouds = [
      { s: 0, x: W * 0.12, y: H * 0.16, sp: 6, sc: 1 }, { s: 1, x: W * 0.62, y: H * 0.1, sp: 4, sc: 1 }, { s: 2, x: W * 0.86, y: H * 0.34, sp: 3, sc: 1 },
      { s: 2, x: W * 0.35, y: H * 0.42, sp: 9, sc: 0.8 }, { s: 1, x: W * 0.95, y: H * 0.58, sp: 12, sc: 0.9 }
    ];
    if (this.portrait) { this.clouds[3].y = H * 0.38; this.clouds[4].y = H * 0.48; }
    this.blimp = { x: this.portrait ? W * 0.75 : W * 0.3, y: this.portrait ? H * 0.4 : H * 0.17 };
  }
  resize() { this.build(); }

  /* ---------- update ---------- */
  update(dt) {
    this.t += dt;
    if (this.toastT > 0) this.toastT -= dt;
    if (this.toastMsg) { this.toastT = 2.4; this.toastShown = this.toastMsg; this.toastMsg = ''; }
    if (this.press > 0) this.press = Math.max(0, this.press - dt);
    if (!this.fontOK && (this.t % 0.5) < dt && document.fonts.check(`20px Bungee`)) this.buildCaches();
    // the motion setting may change in Settings (which comes back to this same scene)
    if ((this.t % 0.5) < dt && SBWT.reduce() !== this.calm) { this.calm = SBWT.reduce(); this.build(); }
    // the globe and Brady's routine: jog, stop at the top for a fist pump, jog on
    const calm = this.calm;
    if (this.go) {
      this.go.t += dt; this.spin += this.L.spin * dt * Math.max(0, 1 - this.go.t * 2);
    } else if (calm) { this.spin += this.L.spin * dt; this.mode = 'idle'; }
    else {
      this.modeT += dt;
      if (this.headbang > 0) { this.headbang -= dt; }
      if (this.mode === 'run' && this.modeT > 6.5) { this.mode = 'stop'; this.modeT = 0; }
      else if (this.mode === 'stop' && this.modeT > 1.8) { this.mode = 'run'; this.modeT = 0; }
      const v = this.mode === 'run' ? Math.min(1, this.modeT * 2.5 + (this.t < 1 ? 1 : 0)) : Math.max(0, 1 - this.modeT * 4);
      this.spin += this.L.spin * dt * v;
      if (this.mode === 'stop' && this.modeT > 0.25 && this.modeT - dt <= 0.25) { this.burst(this.L.bx, this.L.by - this.L.bh * 0.95, 16, 140); }
    }
    if (this.hop > 0) this.hop = Math.max(0, this.hop - dt);
    // the logo lands
    if (!this.landed && this.t > 1.05) { this.landed = true; if (!calm) this.burst(this.L.cx, this.L.logoTop + this.L.f * 0.8, 28, 260); }
    // particles
    if (!calm && !this.go) { this.confT += dt; if (this.confT > 0.22) { this.confT = 0; this.drop(); } }
    for (const p of this.conf) if (p.on) {
      p.life -= dt; p.vy += 260 * dt; p.vx *= (1 - 1.5 * dt); p.vy *= (1 - 1.6 * dt); p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt; p.ph += dt * 9;
      if (p.life <= 0 || p.y > Game.cssH + 20) p.on = false;
    }
    for (const q of this.puffs) if (q.on) { q.age += dt; if (q.age > 1.1) q.on = false; }
    // the plane's trail
    const pl = this.planePos(this.t);
    this.puffT += dt;
    if (pl.on && this.puffT > 0.07) { this.puffT = 0; this.puff(pl.tx, pl.ty, 4 * this.planeScale); }
    // input
    if (this.go) { if (this.go.t >= this.go.end) this.leave(); return; }
    this.input();
  }
  input() {
    const taps = Input.taps, k = Input.uiKey;
    for (let i = 0; i < taps.length; i++) {
      const tp = taps[i];
      for (let j = 0; j < this.small.length; j++) { const b = this.small[j]; if (tp.x >= b.x - 4 && tp.x <= b.x + b.w + 4 && tp.y >= b.y - 6 && tp.y <= b.y + b.h + 6) { b.press = 0.15; this.openSmall(j); return; } }
      const bb = this.bradyBox;
      if (!this.calm && tp.x >= bb.x && tp.x <= bb.x + bb.w && tp.y >= bb.y && tp.y <= bb.y + bb.h) { this.tapBrady(); continue; }
      this.play(); return;
    }
    if (k === 'left' || k === 'up') { this.focus = (this.focus + 3) % 4; Sound.play('select', { vol: 0.4 }); }
    if (k === 'right' || k === 'down') { this.focus = (this.focus + 1) % 4; Sound.play('select', { vol: 0.4 }); }
    if (k === 'enter' || k === 'jump' || (Input.jumpPressed && !Input.usingTouch)) { if (this.focus === 0) this.play(); else this.openSmall(this.focus - 1); return; }
    const sw = Input.swipes.join('');
    if (sw.endsWith('UUDDLRLR')) {
      Input.swipes.length = 0;
      Save.data.lives = Math.min(99, Save.data.lives + 30); Save.data.eggs.code = true; Save.data.look.hair = HAIR_COLORS.length - 1; Save.save();
      Sound.play('oneup'); this.toastShown = '+30 LIVES + NEON VIOLET HAIR. ROCK ON.'; this.toastT = 2.6; this.buildCaches();
    }
  }
  tapBrady() {
    this.taps++; this.hop = 0.35;
    if (this.taps >= 5) { this.taps = 0; this.headbang = 3; Sound.play('headbang'); Save.data.eggs.headbang = true; Save.save(); }
    else Sound.play('select', { pitch: 1 + this.taps * 0.15 });
  }
  openSmall(j) {
    Sound.play('select');
    if (j === 0) Game.setScene(new LookScene());
    else if (j === 1) Game.setScene(new SettingsScene(this));
    else {
      // the credits from the title: no spoilers, and watching them doesn't count as beating the game
      const was = !!Save.data.beatGame, c = new CreditsScene('world');
      if (!was) { Save.data.beatGame = false; Save.save(); c.lines = c.lines.filter(l => !/Chinka is home|Baron is a snow globe/.test(l[0])); }
      Game.setScene(c);
    }
  }
  play() {
    if (this.go) return;
    this.press = 0.18; Sound.play('select');
    const calm = this.calm;
    this.go = { t: 0, end: calm ? 0.3 : 1.45 };
    if (!calm) this.burst(this.cta.x + this.cta.w / 2, this.cta.y, 20, 240);
  }
  leave() {
    const fresh = !Save.data.seenTourIntro;
    let next;
    if (fresh) next = new StoryScene(TourIntroPanels(), () => { Save.data.seenTourIntro = true; Save.save(); goToMap('world'); }, (Sound.trackNames || []).indexOf('tour_title') >= 0 ? 'tour_title' : 'story');
    else { goToMap('world'); next = Game.scene; }
    if (fresh) Game.setScene(next);
    // a short fade from the cream wipe into the next scene
    if (Game.scene === next && next) Game.scene = new SBWFadeIn(next, this.calm ? 0.25 : 0.35);
  }
  // particles
  burst(x, y, n, sp) {
    if (this.calm) return;
    for (const p of this.conf) {
      if (n <= 0) break; if (p.on) continue; n--;
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = sp * (0.4 + Math.random() * 0.7);
      p.on = true; p.x = x + (Math.random() - 0.5) * 40; p.y = y; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v; p.a = Math.random() * TAU; p.va = (Math.random() - 0.5) * 10;
      p.w = 5 + Math.random() * 4; p.h = 3 + Math.random() * 2.5; p.ph = Math.random() * TAU; p.c = SBWT.CONF[(Math.random() * SBWT.CONF.length) | 0]; p.life = 2.6;
    }
  }
  drop() {
    for (const p of this.conf) if (!p.on) {
      p.on = true; p.x = Math.random() * Game.cssW; p.y = -10; p.vx = (Math.random() - 0.5) * 30; p.vy = 20 + Math.random() * 30; p.a = Math.random() * TAU; p.va = (Math.random() - 0.5) * 6;
      p.w = 5 + Math.random() * 3; p.h = 3 + Math.random() * 2; p.ph = Math.random() * TAU; p.c = SBWT.CONF[(Math.random() * SBWT.CONF.length) | 0]; p.life = 9; return;
    }
  }
  puff(x, y, r) { for (const q of this.puffs) if (!q.on) { q.on = true; q.x = x; q.y = y; q.age = 0; q.r = r; return; } }
  // the plane's loop-the-loop across the sky (every 11 s), or its swoop to Brady and take-off after a tap
  planePos(t) {
    const P = this._pp || (this._pp = { on: false, x: 0, y: 0, a: 0, tx: 0, ty: 0, brady: false, sc: 1 });
    const W = Game.cssW, H = Game.cssH, L = this.L;
    P.on = false; P.brady = false; P.sc = 1;
    if (this.go && !this.calm) {
      const g = this.go.t;
      if (g < 0.55) {   // swoop in from the left, low, to Brady
        const u = SBWT.ease.out(g / 0.55), x0 = -60, y0 = L.by - L.bh * 0.2, x1 = L.bx - 6, y1 = L.by - L.bh * 0.15;
        P.x = lerp(x0, x1, u); P.y = lerp(y0, y1, u) - Math.sin(u * Math.PI) * L.bh * 0.5; P.a = -Math.cos(u * Math.PI) * 0.35;
      } else {           // with Brady aboard: up and away to the top right
        const u = clamp((g - 0.55) / 0.8, 0, 1), e = u * u;
        const x0 = L.bx - 6, y0 = L.by - L.bh * 0.15;
        P.x = x0 + e * (W + 160 - x0); P.y = y0 - Math.sin(u * Math.PI * 0.5) * (y0 + 120) + Math.sin(u * TAU) * 20 * (1 - u); P.a = -0.5 - u * 0.2; P.brady = true; P.sc = 1 + u * 0.6;
      }
      P.on = true;
    } else {
      const per = this.calm ? 30 : 11, u = ((t + 3) % per) / (this.calm ? 12 : 6.5);
      if (u <= 1) {
        const xc = this.portrait ? W * 0.42 : L.gx, yc = this.portrait ? Math.max(this.logoBottom + W * 0.14, H * 0.3) : H * 0.3, r = this.portrait ? W * 0.12 : H * 0.14;
        const x0 = W + 70, x1 = -70, d1 = x0 - xc, loop = TAU * r, d2 = xc - x1, tot = d1 + loop + d2;
        const s = u * tot;
        if (this.calm || s < d1) { P.x = x0 - s; P.y = yc + r; P.a = Math.PI; if (this.calm) { P.x = x0 - u * (x0 - x1); } }
        else if (s < d1 + loop) { const th = (s - d1) / r; P.x = xc - Math.sin(th) * r; P.y = yc + Math.cos(th) * r; P.a = Math.PI + th; }
        else { P.x = xc - (s - d1 - loop); P.y = yc + r; P.a = Math.PI; }
        P.on = true;
      }
    }
    // the tail, for the puff trail
    const back = 40 * this.planeS.u * P.sc;
    P.tx = P.x - Math.cos(P.a) * back; P.ty = P.y - Math.sin(P.a) * back - 10 * this.planeScale;
    return P;
  }

  /* ---------- draw ---------- */
  draw(ctx) {
    if (Game.cssW !== this.bW || Game.cssH !== this.bH || Game.dpr !== this.bK) this.build();
    const W = Game.cssW, H = Game.cssH, d = Game.dpr, t = this.t, L = this.L, calm = this.calm;
    const intro = calm ? 1 : SBWT.ease.outBack(clamp(t / 0.7, 0, 1));
    // sky
    ctx.setTransform(d, 0, 0, d, 0, 0);
    if (!this.sky || this.skyH !== H) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2c9cf0'); g.addColorStop(0.55, '#8ad6ff'); g.addColorStop(1, '#ffe2b4'); this.sky = g; this.skyH = H; }
    ctx.fillStyle = this.sky; ctx.fillRect(0, 0, W, H);
    // sun rays from behind Brady
    const rx = L.bx, ry = L.by - L.bh * 0.55, rot = calm ? 0 : t * 0.08, RR = Math.hypot(W, H);
    ctx.fillStyle = 'rgba(255,250,230,0.16)'; ctx.beginPath();
    for (let i = 0; i < 14; i++) { const a = rot + i * TAU / 14; ctx.moveTo(rx, ry); ctx.lineTo(rx + Math.cos(a) * RR, ry + Math.sin(a) * RR); ctx.lineTo(rx + Math.cos(a + 0.2) * RR, ry + Math.sin(a + 0.2) * RR); }
    ctx.fill();
    // far clouds
    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i], s = this.cloudS[c.s], span = W + 260;
      const x = ((c.x - t * c.sp * (calm ? 0.3 : 1)) % span + span) % span - 130;
      SBWT.blit(ctx, s, x, c.y, c.sc);
    }
    // the Baron's blimp drifting with a bottled landmark
    {
      const b = this.blimp, span = W + 400, x = ((b.x + t * (calm ? 4 : 11)) % span + span) % span - 200;
      SBWT.blit(ctx, this.blimpS, x, b.y + Math.sin(t * 1.3) * 5, 1, Math.sin(t * 0.9) * 0.03);
    }
    // the plane and its puff trail
    ctx.setTransform(d, 0, 0, d, 0, 0);
    for (const q of this.puffs) if (q.on) { const u = q.age / 1.1; ctx.globalAlpha = 0.85 * (1 - u); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1 + u * 1.6), 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    const pl = this.planePos(t);
    const planeBehind = pl.on && !pl.brady;
    if (planeBehind) this.drawPlane(ctx, pl);
    // postcards fluttering across
    if (!calm) for (let i = 0; i < this.cards.length; i++) {
      const c = this.cards[i], per = 14 + i * 3, u = ((t * 0.07 * c.sp + i * 0.37) % 1);
      const x = W + 60 - u * (W + 120), y = H * (0.12 + i * 0.2) + Math.sin(t * 1.3 + c.ph) * 22 + u * H * 0.12;
      const flip = Math.cos(t * 2.2 * c.sp + c.ph);
      SBWT.blit(ctx, flip > 0 ? this.cardF : this.cardB, x, y, 0.55, Math.sin(t * 1.7 + c.ph) * 0.4, Math.max(0.08, Math.abs(flip)) * (flip > 0 ? 1 : -1));
      if (per < 0) break;
    }
    // the globe
    const gy = L.gy + (1 - intro) * L.R * 0.6;
    this.drawGlobe(ctx, L.gx, gy);
    // Brady
    this.drawBrady(ctx, gy - L.R + 2);
    // confetti
    this.drawConfetti(ctx);
    // the logo
    this.drawLogo(ctx);
    // the plane in front, with Brady aboard
    if (pl.on && pl.brady) this.drawPlane(ctx, pl);
    // buttons
    this.drawButtons(ctx);
    // the wipe into the next scene
    if (this.go) {
      ctx.setTransform(d, 0, 0, d, 0, 0);
      if (calm) { ctx.globalAlpha = clamp(this.go.t / 0.25, 0, 1); ctx.fillStyle = SBWT.CREAM; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
      else {
        const u = clamp((this.go.t - 0.95) / 0.45, 0, 1);
        if (u > 0) { const e = SBWT.ease.inOut(u); ctx.fillStyle = SBWT.CREAM; ctx.beginPath(); ctx.arc(W * 0.92, -20, e * Math.hypot(W, H) * 1.1, 0, TAU); ctx.fill(); }
      }
    }
    // toast (easter eggs)
    if (this.toastT > 0) {
      ctx.setTransform(d, 0, 0, d, 0, 0); ctx.font = `13px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(28,20,38,0.8)'; const tw = ctx.measureText(this.toastShown).width + 24; rr(ctx, W / 2 - tw / 2, H * 0.5 - 15, tw, 30, 15); ctx.fill();
      ctx.fillStyle = '#7aff9a'; ctx.fillText(this.toastShown, W / 2, H * 0.5 + 1);
    }
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  drawPlane(ctx, pl) {
    const flip = Math.cos(pl.a) < 0, s = pl.brady ? this.planeB : this.planeS, sc = s.u * pl.sc * (pl.brady ? 1 : 0.85);
    const d = Game.dpr;
    // the sprite faces right: flip it (not upside down) when flying left
    SBWT.blit(ctx, s, pl.x, pl.y, pl.sc * (pl.brady ? 1 : 0.85), flip ? pl.a - Math.PI : pl.a, flip ? -1 : 1);
    // the propeller: a quick flicker at the nose
    const nx = pl.x + Math.cos(pl.a) * 48 * sc - Math.sin(pl.a) * -12 * sc * (flip ? -1 : 1), ny = pl.y + Math.sin(pl.a) * 48 * sc + Math.cos(pl.a) * -12 * sc;
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.ellipse(nx, ny, 2.2 * sc, (10 + Math.sin(this.t * 60) * 4) * sc, pl.a, 0, TAU); ctx.fill();
  }
  drawGlobe(ctx, gx, gy) {
    const d = Game.dpr, L = this.L, R = L.R, rot = -this.spin;
    if (gy - R > Game.cssH) return;
    ctx.setTransform(d, 0, 0, d, d * gx, d * gy);
    // body: ocean, continents turning with the wheel, a land crust per country around the rim
    ctx.fillStyle = SBWT.INK; ctx.beginPath(); ctx.arc(0, 0, R + 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a8ae0'; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    const cs = Math.cos(rot), sn = Math.sin(rot);
    ctx.setTransform(d * cs, d * sn, -d * sn, d * cs, d * gx, d * gy);
    ctx.strokeStyle = SBWT.INK; ctx.lineWidth = 4; ctx.stroke(this.cont); ctx.fillStyle = '#5cc85a'; ctx.fill(this.cont);
    // the crust band (a ring of land under the landmarks)
    const n = this.lands.length, band = Math.max(10, R * 0.07);
    ctx.lineWidth = band; ctx.lineCap = 'butt';
    for (let i = 0; i < n; i++) {
      const a = this.lands[i].a - Math.PI / 2;
      ctx.strokeStyle = this.lands[i].d.crust; ctx.beginPath(); ctx.arc(0, 0, R - band / 2, a - Math.PI / n - 0.01, a + Math.PI / n + 0.01); ctx.stroke();
    }
    ctx.lineWidth = 2; ctx.strokeStyle = SBWT.INK; ctx.beginPath(); ctx.arc(0, 0, R - band, 0, TAU); ctx.stroke();
    ctx.lineCap = 'round';
    // light and shade stay put while it turns
    ctx.setTransform(d, 0, 0, d, d * gx, d * gy);
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(30,14,70,0.2)'; ctx.fill(this.globeShade);
    ctx.fillStyle = 'rgba(255,255,240,0.35)'; ctx.fill(this.globeHi);
    ctx.restore();
    ctx.strokeStyle = SBWT.INK; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
    // landmarks on the rim: they pop up as they come over the edge of the screen and sink as they leave
    for (let i = 0; i < n; i++) {
      const lm = this.lands[i];
      let a = ((lm.a + rot) % TAU + TAU) % TAU; if (a > Math.PI) a -= TAU;
      if (a < L.a0 - 0.2 || a > L.a1 + 0.2) continue;
      const edge = Math.min(a - L.a0, L.a1 - a), top = Math.abs(a);
      let s = SBWT.ease.outBack(clamp(edge / 0.32, 0, 1));
      if (top < 0.16 && !this.go) s *= 0.55 + 0.45 * clamp((top - 0.06) / 0.1, 0, 1);   // duck a little behind Brady
      if (s <= 0.02) continue;
      const x = gx + Math.sin(a) * (R - 4), y = gy - Math.cos(a) * (R - 4);
      SBWT.blit(ctx, lm.s, x, y, s, a);
    }
  }
  drawBrady(ctx, footY) {
    const L = this.L, t = this.t;
    if (this.go && !this.calm && this.go.t > 0.55) return;   // aboard the plane
    let s = this.idle, sx = 1, sy = 1, lift = 0;
    if (this.headbang > 0) {
      // the easter egg: drawn live (rare), with the in-game ink
      const d = Game.dpr; ctx.setTransform(d * L.bs, 0, 0, d * L.bs, d * L.bx, d * footY);
      Ink.around(ctx, -34, -98, 68, 100, c => drawBrady(c, { x: 0, y: 0, facing: 1, small: false, power: Save.data.eggs.headbang ? 2 : 0, anim: { state: 'headbang', t, phase: 0, happy: true }, hair: null, look: SBWT.look(), time: t }), { pad: 6, width: 1.0, color: '#120e16', rim: '#e7e3d7' });
      return;
    }
    if (this.go) { s = this.go.t < 0.3 ? this.vic : this.reach; const g = this.go.t; lift = Math.sin(clamp(g / 0.55, 0, 1) * Math.PI) * L.bh * 0.25; }
    else if (this.calm) { s = this.idle; }
    else if (this.mode === 'run') { s = this.run[Math.floor(this.spin * L.R / (L.bh * 0.62) * 8) & 7]; }
    else { s = this.modeT > 0.2 && this.modeT < 1.6 ? this.vic : this.idle; const u = this.modeT - 0.25; if (u > 0 && u < 0.5) lift = Math.sin(u / 0.5 * Math.PI) * L.bh * 0.16; }
    if (this.hop > 0) lift += Math.sin(this.hop / 0.35 * Math.PI) * L.bh * 0.12;
    if (!this.calm && s !== this.run[0]) { const br = Math.sin(t * 2.4) * 0.012; sy = 1 + br; sx = 1 - br; }
    // contact shadow
    const d = Game.dpr; ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.fillStyle = 'rgba(28,20,38,0.28)'; ctx.beginPath(); ctx.ellipse(L.bx, footY, L.bh * 0.2 * (1 - lift / L.bh), L.bh * 0.035, 0, 0, TAU); ctx.fill();
    ctx.setTransform(d * sx * s.u, 0, 0, d * sy * s.u, d * L.bx, d * (footY - lift));
    ctx.drawImage(s.c, -s.ax, -s.ay, s.w, s.h);
  }
  drawConfetti(ctx) {
    const d = Game.dpr;
    for (const p of this.conf) {
      if (!p.on) continue;
      const c = Math.cos(p.a), s = Math.sin(p.a), fl = Math.cos(p.ph);
      ctx.setTransform(d * c, d * s, -d * s * fl, d * c * fl, d * p.x, d * p.y);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
  }
  drawLogo(ctx) {
    const t = this.t, calm = this.calm, L = this.L, f = L.f;
    const fade = calm ? clamp(t / 0.4, 0, 1) : 1;
    ctx.globalAlpha = fade;
    // SUPER ribbon unfurls
    {
      const r = this.super, u = calm ? 1 : clamp((t - 0.75) / 0.35, 0, 1);
      if (u > 0) { const sxk = calm ? 1 : SBWT.ease.outBack(u); const d = Game.dpr, c = Math.cos(r.rot), s = Math.sin(r.rot), wob = calm ? 0 : Math.sin(t * 2) * 0.02;
        const u2 = r.s.u; ctx.setTransform(d * c * sxk * u2, d * s * sxk * u2, -d * s * u2, d * c * u2, d * r.x, d * (r.y + Math.sin(t * 1.6) * (calm ? 0 : 1.5)));
        if (wob) ctx.rotate(wob);
        ctx.drawImage(r.s.c, -r.s.ax, -r.s.ay, r.s.w, r.s.h); }
    }
    // BRADY-O: letters drop in and squash, then bob in a little wave
    for (let i = 0; i < this.letters.length; i++) this.drawLetter(ctx, this.letters[i], f, 0.12 + i * 0.07);
    this.drawGlobeO(ctx, f, 0.12 + 6 * 0.07);
    for (let i = 0; i < this.world.length; i++) this.drawLetter(ctx, this.world[i], f * 0.56, 0.9 + i * 0.05, true);
    ctx.globalAlpha = 1;
    // twinkles on the letters
    if (!calm && t > 1.2) {
      const d = Game.dpr;
      for (let i = 0; i < 3; i++) {
        const u = ((t * 0.5 + i * 0.33) % 1), le = this.letters[(Math.floor(t * 0.5 + i * 0.33) * 3 + i * 2) % this.letters.length];
        const s = Math.sin(u * Math.PI) * f * 0.11;
        if (s <= 0.5) continue;
        ctx.setTransform(d, 0, 0, d, d * (le.x + f * 0.18), d * (le.y - f * 0.62));
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(0, 0, s, 0); ctx.quadraticCurveTo(0, 0, 0, s); ctx.quadraticCurveTo(0, 0, -s, 0); ctx.quadraticCurveTo(0, 0, 0, -s); ctx.fill();
      }
    }
  }
  letterAnim(delay, size, pop) {
    const A = this._la || (this._la = { y: 0, sx: 1, sy: 1, vis: true });
    A.y = 0; A.sx = 1; A.sy = 1; A.vis = true;
    if (this.calm) return A;
    const tau = this.t - delay;
    if (tau < 0) { A.vis = false; return A; }
    if (pop) { const e = SBWT.ease.outBack(clamp(tau / 0.35, 0, 1)); A.sx = A.sy = e; }
    else {
      const fd = 0.3;
      if (tau < fd) { const u = tau / fd; A.y = -(1 - u * u) * (this.L.logoTop + size * 2); A.sx = 0.9; A.sy = 1.12; }
      else { const u = tau - fd, k = Math.exp(-7 * u) * Math.cos(20 * u); A.sy = 1 - 0.26 * k; A.sx = 1 + 0.2 * k; }
    }
    return A;
  }
  drawLetter(ctx, le, size, delay, pop) {
    const A = this.letterAnim(delay, size, pop);
    if (!A.vis || A.sx <= 0.01) return;
    const d = Game.dpr, bob = this.calm ? 0 : Math.sin(this.t * 2.6 - le.i * 0.55) * size * 0.03;
    const c = Math.cos(le.rot), s = Math.sin(le.rot);
    const u = le.s.u; ctx.setTransform(d * c * A.sx * u, d * s * A.sx * u, -d * s * A.sy * u, d * c * A.sy * u, d * le.x, d * (le.y + A.y + bob));
    ctx.drawImage(le.s.c, -le.s.ax, -le.s.ay, le.s.w, le.s.h);
  }
  // the O of BRADY-O: a little globe with a plane circling it
  drawGlobeO(ctx, f, delay) {
    const A = this.letterAnim(delay, f, false);
    if (!A.vis) return;
    const g = this.globeO, d = Game.dpr, r = g.r, t = this.t, bob = this.calm ? 0 : Math.sin(t * 2.6 - g.i * 0.55) * f * 0.03;
    const L2 = f * 0.15, K = f * 0.075, ex = f * 0.04, ey = f * 0.1;
    ctx.setTransform(d * A.sx, 0, 0, d * A.sy, d * g.x, d * (g.y + A.y + bob));
    ctx.fillStyle = SBWT.CREAM; ctx.beginPath(); ctx.arc(ex / 2, ey / 2, r + L2 / 2 + K + Math.hypot(ex, ey) / 2, 0, TAU); ctx.fill();
    ctx.fillStyle = SBWT.INK; ctx.beginPath(); ctx.arc(ex, ey, r + L2 / 2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, r + L2 / 2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b0245e'; ctx.beginPath(); ctx.arc(ex * 0.8, ey * 0.8, r, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2a9ae8'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    // continents slide across the face
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();
    const off = ((this.calm ? t * 0.1 : t * 0.35) % 2) * r * 2;
    ctx.fillStyle = '#5cd85a';
    for (let k = -1; k <= 0; k++) {
      const ox = off + k * r * 4 - r;
      ctx.beginPath(); ctx.ellipse(ox - r * 0.3, -r * 0.35, r * 0.45, r * 0.3, 0.3, 0, TAU); ctx.ellipse(ox + r * 0.15, r * 0.35, r * 0.28, r * 0.42, -0.2, 0, TAU); ctx.ellipse(ox + r * 1.4, -r * 0.1, r * 0.4, r * 0.55, 0.2, 0, TAU); ctx.ellipse(ox + r * 2.3, r * 0.45, r * 0.3, r * 0.2, 0, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = 'rgba(30,14,70,0.25)'; ctx.beginPath(); ctx.arc(r * 0.3, r * 0.35, r * 1.1, 0, TAU); ctx.arc(-r * 0.1, -r * 0.1, r * 1.05, 0, TAU, true); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,250,236,0.85)'; rr(ctx, -r * 0.55, -r * 0.78, r * 0.6, r * 0.2, r * 0.1); ctx.fill();
    ctx.strokeStyle = SBWT.INK; ctx.lineWidth = Math.max(1.5, f * 0.035);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.98, r * 0.3, 0, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.4, r * 0.98, 0, 0, TAU); ctx.stroke();
    // a little plane orbiting the O
    const a = this.calm ? 0.8 : t * 2.2, px = Math.cos(a) * r * 1.25, py = Math.sin(a) * r * 0.42 - r * 0.25;
    if (Math.sin(a) > -0.25 || true) {
      ctx.translate(px, py); ctx.rotate(Math.cos(a) > 0 ? -0.2 : 0.2); const k2 = f * 0.012, dir = -Math.sin(a) > 0 ? 1 : -1;
      ctx.scale(k2 * dir, k2);
      ctx.fillStyle = SBWT.INK; ctx.beginPath(); ctx.ellipse(0, 0, 15, 6.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff4dc'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 4.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff4f8a'; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(2, -11); ctx.lineTo(6, -11); ctx.lineTo(5, 0); ctx.lineTo(6, 11); ctx.lineTo(2, 11); ctx.closePath(); ctx.fill();
    }
  }
  drawButtons(ctx) {
    const t = this.t, d = Game.dpr, calm = this.calm;
    const showU = calm ? 1 : clamp((t - 1.15) / 0.35, 0, 1);
    if (showU <= 0) return;
    // the call to action: pops in, then breathes; a press sinks it onto its lip
    const c = this.cta, S = this.ctaS, cx = c.x + c.w / 2, cy = c.y + c.h / 2;
    const pop = calm ? 1 : SBWT.ease.outBack(showU), pulse = (calm || this.go) ? 1 : 1 + Math.sin(t * 4.2) * 0.03;
    const pr = this.press > 0 ? 1 : 0, sc = pop * pulse;
    ctx.setTransform(d * sc, 0, 0, d * sc, d * cx, d * cy);
    ctx.drawImage(S.lip.c, -S.lip.ax, -S.lip.ay, S.lip.w, S.lip.h);
    const dy = pr * S.lipH * 0.8;
    ctx.drawImage(S.face.c, -S.face.ax, -S.face.ay + dy, S.face.w, S.face.h);
    // a shine sweeping across now and then
    if (!calm && !this.go) {
      const u = (t % 2.6) / 0.6;
      if (u < 1) {
        ctx.save(); rr(ctx, -c.w / 2 + 2, -c.h / 2 + 2 + dy, c.w - 4, c.h - 4, c.h / 2 - 2); ctx.clip();
        const sx = -c.w / 2 - 40 + u * (c.w + 80);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(sx, -c.h); ctx.lineTo(sx + 22, -c.h); ctx.lineTo(sx - 8, c.h); ctx.lineTo(sx - 30, c.h); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    if (this.focus === 0 && !Input.usingTouch) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; rr(ctx, -c.w / 2 - 7, -c.h / 2 - 7, c.w + 14, c.h + 14 + S.lipH, c.h / 2 + 7); ctx.stroke(); }
    // progress
    if (this.chipS) SBWT.blit(ctx, this.chipS, cx, this.chipY, pop);
    // the small buttons
    for (let i = 0; i < this.small.length; i++) {
      const b = this.small[i], P = this.smallS[i], pr2 = b.press > 0 ? 1 : 0;
      if (b.press > 0) b.press -= 0.016;
      ctx.setTransform(d * pop, 0, 0, d * pop, d * (b.x + b.w / 2), d * (b.y + b.h / 2));
      ctx.drawImage(P.lip.c, -P.lip.ax, -P.lip.ay, P.lip.w, P.lip.h);
      ctx.drawImage(P.face.c, -P.face.ax, -P.face.ay + pr2 * P.lipH * 0.8, P.face.w, P.face.h);
      if (this.focus === i + 1 && !Input.usingTouch) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; rr(ctx, -b.w / 2 - 5, -b.h / 2 - 5, b.w + 10, b.h + 10 + P.lipH, b.h / 2 + 5); ctx.stroke(); }
    }
    // version, small, bottom left
    if (this.portrait) SBWT.blit(ctx, this.verS, Game.cssW / 2, this.small[0].y - 12, 1);
  }
}

// a short fade from the title's cream wipe into the next scene (it hands over to that scene when done)
class SBWFadeIn {
  constructor(inner, dur) { this.inner = inner; this.dur = dur; this.t = 0; }
  update(dt) { this.t += dt; this.inner.update(dt); if (this.t >= this.dur && Game.scene === this) Game.scene = this.inner; }
  draw(ctx) {
    this.inner.draw(ctx);
    const d = Game.dpr; ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.globalAlpha = clamp(1 - this.t / this.dur, 0, 1); ctx.fillStyle = SBWT.CREAM; ctx.fillRect(0, 0, Game.cssW, Game.cssH); ctx.globalAlpha = 1;
  }
  resize() { if (this.inner.resize) this.inner.resize(); }
}

// the world app's title is the show above (the scene keeps the name TitleScene; the combined build keeps its picker)
if (typeof BRADY_APP !== 'undefined' && BRADY_APP === 'world') TitleScene = class TitleScene extends SBWTitleScene {};

/* ============================================================ the home-screen icon ============================================================
   window.__sbwIcon(ctx, N, maskable, variant): drawn at N x N px; tools/make_icon.js renders it for the world app.
   'head' (the one shipped): Brady's grinning face front on, man bun, square shades and stubble, with a toon globe
   as his halo on a fiesta sunburst and the little plane zipping past. Two other candidates stay for comparison:
   'face' (the in-game Brady sprite, close up) and 'globehead' (the globe itself wearing his shades and bun).
   maskable: the same art pulled into the middle 80 % (Android's safe zone). */
window.__sbwIcon = (x, N, maskable, variant) => {
  variant = variant || 'head';
  const k = N / 512, INK = SBWT.INK;
  x.save(); x.scale(k, k); x.lineJoin = 'round'; x.lineCap = 'round';
  const cx = 256, cy = 256;
  const burst = (c1, c2, n, ox, oy) => {
    x.fillStyle = c1; x.fillRect(0, 0, 512, 512);
    x.fillStyle = c2; x.beginPath();
    for (let i = 0; i < n; i++) { const a = i * TAU / n - Math.PI / 2; x.moveTo(ox, oy); x.lineTo(ox + Math.cos(a) * 800, oy + Math.sin(a) * 800); x.lineTo(ox + Math.cos(a + TAU / n / 2) * 800, oy + Math.sin(a + TAU / n / 2) * 800); }
    x.fill();
  };
  const brady = (bx, by, s, anim) => {
    // the game's own Brady, inked as in play, at icon scale (drawn through Ink at device scale)
    const m = x.getTransform(); x.save(); x.translate(bx, by); x.scale(s, s);
    Ink.around(x, -34, -98, 68, 100, c => drawBrady(c, { x: 0, y: 0, facing: 1, small: false, power: 0, anim, hair: null, look: { hair: 0, skin: 1 }, time: anim.t || 0 }), { pad: 6, width: 1.0, color: '#120e16', rim: '#fff4dc', rimWidth: 1.2 });
    x.restore(); return m;
  };
  const plane = (px, py, s, rot) => {
    x.save(); x.translate(px, py); x.rotate(rot); x.scale(s, s); x.strokeStyle = INK; x.lineWidth = 4;
    x.fillStyle = '#22c4b4'; x.beginPath(); x.moveTo(-34, -6); x.lineTo(-44, -26); x.lineTo(-32, -26); x.lineTo(-20, -8); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#fff4dc'; x.beginPath(); x.ellipse(0, 0, 40, 14, 0, 0, TAU); x.fill(); x.stroke();
    x.fillStyle = '#ff4f8a'; x.beginPath(); x.moveTo(-8, 0); x.lineTo(6, -30); x.lineTo(18, -30); x.lineTo(12, 0); x.lineTo(18, 30); x.lineTo(6, 30); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#ff4f8a'; x.beginPath(); x.arc(40, 0, 7, 0, TAU); x.fill(); x.stroke();
    x.restore();
  };
  if (variant === 'head') {
    // Brady's face, front on and big: man bun, clean sides, square shades, stubble, a big grin; a toon globe as his halo
    const m = maskable ? 0.8 : 1, hx = 256, hy = 256 + 30 * m;
    const T = (px, py) => [hx + px * m, hy + py * m];
    burst('#ff9a2e', '#ffc84a', 18, hx, hy);
    // the globe behind his head
    const [gx, gy] = T(0, -38), GR = 196 * m;
    x.fillStyle = INK; x.beginPath(); x.arc(gx, gy, GR + 9 * m, 0, TAU); x.fill();
    x.fillStyle = '#2a9ae8'; x.beginPath(); x.arc(gx, gy, GR, 0, TAU); x.fill();
    x.save(); x.beginPath(); x.arc(gx, gy, GR, 0, TAU); x.clip();
    x.fillStyle = '#5cd85a'; x.strokeStyle = INK; x.lineWidth = 8 * m;
    for (const [ox, oy, rx, ry, a] of [[-150, -70, 70, 50, 0.4], [150, -90, 60, 70, -0.3], [-160, 90, 50, 60, 0.2], [160, 80, 46, 40, 0]]) { x.beginPath(); x.ellipse(gx + ox * m, gy + oy * m, rx * m, ry * m, a, 0, TAU); x.fill(); x.stroke(); }
    x.restore();
    x.strokeStyle = INK; x.lineWidth = 10 * m; x.beginPath(); x.arc(gx, gy, GR, 0, TAU); x.stroke();
    const skin = '#e8b996', skinSh = '#c98e6b', hair = '#a7835a', hairSh = '#7a5a3c', hairHi = '#d6b384';
    x.lineWidth = 11 * m; x.strokeStyle = INK;
    // shoulders in the black tee
    x.fillStyle = '#25252f'; x.beginPath(); x.moveTo(...T(-210, 260)); x.quadraticCurveTo(...T(-200, 150), ...T(-70, 140)); x.lineTo(...T(70, 140)); x.quadraticCurveTo(...T(200, 150), ...T(210, 260)); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = skin; x.beginPath(); x.moveTo(...T(-46, 100)); x.lineTo(...T(-50, 150)); x.quadraticCurveTo(...T(0, 182), ...T(50, 150)); x.lineTo(...T(46, 100)); x.closePath(); x.fill(); x.stroke();
    // the bun and its loose ends, then the head
    const [bx, by] = T(0, -168);
    x.fillStyle = hair;
    for (const [dx, a] of [[-24, -0.7], [2, -0.05], [26, 0.65]]) { x.save(); x.translate(bx + dx * m, by - 30 * m); x.rotate(a); x.beginPath(); x.moveTo(-11 * m, 12 * m); x.bezierCurveTo(-16 * m, -14 * m, -2 * m, -30 * m, 10 * m, -36 * m); x.bezierCurveTo(22 * m, -40 * m, 26 * m, -24 * m, 14 * m, -20 * m); x.bezierCurveTo(6 * m, -16 * m, 8 * m, 0, 11 * m, 12 * m); x.closePath(); x.fill(); x.stroke(); x.restore(); }
    x.beginPath(); x.arc(bx, by, 46 * m, 0, TAU); x.fill(); x.stroke();
    x.fillStyle = hairHi; x.beginPath(); x.ellipse(bx - 14 * m, by - 14 * m, 16 * m, 9 * m, -0.5, 0, TAU); x.fill();
    // ears
    x.fillStyle = skin; for (const sx of [-1, 1]) { x.beginPath(); x.ellipse(hx + sx * 118 * m, hy + 6 * m, 22 * m, 30 * m, 0, 0, TAU); x.fill(); x.stroke(); }
    // face
    x.fillStyle = skin; x.beginPath(); x.ellipse(hx, hy, 116 * m, 128 * m, 0, 0, TAU); x.fill(); x.stroke();
    // stubble: a darker jaw with flecks
    x.save(); x.beginPath(); x.ellipse(hx, hy, 110 * m, 122 * m, 0, 0, TAU); x.clip();
    x.fillStyle = 'rgba(90,60,50,0.28)'; x.beginPath(); x.moveTo(...T(-120, 20)); x.quadraticCurveTo(...T(-60, 60), ...T(0, 52)); x.quadraticCurveTo(...T(60, 60), ...T(120, 20)); x.lineTo(...T(120, 140)); x.lineTo(...T(-120, 140)); x.closePath(); x.fill();
    x.fillStyle = 'rgba(70,46,40,0.32)'; for (let i = 0; i < 90; i++) { const u = (i * 0.618) % 1, v = (i * 0.377) % 1, px = (u - 0.5) * 210, py = 40 + v * 90 - Math.abs(px) * 0.12; x.fillRect(...T(px, py), 2.6 * m, 2.6 * m); }
    x.restore();
    // hair: pulled back tight over the top, a clean hairline
    x.fillStyle = hair; x.beginPath(); x.moveTo(...T(-116, -6)); x.bezierCurveTo(...T(-122, -110), ...T(-60, -136), ...T(0, -136)); x.bezierCurveTo(...T(60, -136), ...T(122, -110), ...T(116, -6)); x.quadraticCurveTo(...T(106, -60), ...T(72, -82)); x.quadraticCurveTo(...T(0, -104), ...T(-72, -82)); x.quadraticCurveTo(...T(-106, -60), ...T(-116, -6)); x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = hairSh; x.lineWidth = 6 * m; for (const dx of [-64, -22, 22, 64]) { x.beginPath(); x.moveTo(...T(dx * 1.12, -106 + Math.abs(dx) * 0.3)); x.quadraticCurveTo(...T(dx * 0.75, -124), ...T(dx * 0.25, -134)); x.stroke(); }
    x.strokeStyle = hairHi; x.lineWidth = 7 * m; x.beginPath(); x.moveTo(...T(-70, -96)); x.quadraticCurveTo(...T(-40, -124), ...T(0, -128)); x.stroke();
    x.strokeStyle = INK; x.lineWidth = 11 * m;
    // the square shades
    x.fillStyle = '#16141c';
    rr(x, ...T(-112, -44), 100 * m, 74 * m, 16 * m); x.fill(); x.stroke(); rr(x, ...T(12, -44), 100 * m, 74 * m, 16 * m); x.fill(); x.stroke();
    x.fillRect(...T(-16, -34), 32 * m, 14 * m);
    x.fillStyle = 'rgba(255,255,255,0.5)'; for (const ox of [-92, 32]) { x.beginPath(); x.moveTo(...T(ox, -32)); x.lineTo(...T(ox + 22, -32)); x.lineTo(...T(ox + 8, -2)); x.lineTo(...T(ox - 14, -2)); x.closePath(); x.fill(); }
    // eyebrows peeking over the frames, a big grin
    x.fillStyle = '#4a3428'; for (const sx of [-1, 1]) { x.beginPath(); x.ellipse(hx + sx * 62 * m, hy - 54 * m, 34 * m, 7 * m, sx * -0.12, 0, TAU); x.fill(); }
    x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(...T(-62, 50)); x.quadraticCurveTo(...T(0, 64), ...T(62, 50)); x.quadraticCurveTo(...T(50, 112), ...T(0, 114)); x.quadraticCurveTo(...T(-50, 112), ...T(-62, 50)); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#e25a6a'; x.beginPath(); x.moveTo(...T(-30, 100)); x.quadraticCurveTo(...T(0, 88), ...T(30, 100)); x.quadraticCurveTo(...T(0, 114), ...T(-30, 100)); x.fill();
    x.fillStyle = 'rgba(201,142,107,0.9)'; x.beginPath(); x.ellipse(...T(0, 24), 16 * m, 10 * m, 0, 0, TAU); x.fill();
    plane(maskable ? 352 : 420, maskable ? 156 : 90, maskable ? 0.8 : 1.2, 0.3);
  } else if (variant === 'face') {
    // the face fills the icon: head and bun big, the shoulders running off the bottom edge
    const m = maskable ? 0.8 : 1, hx = 256, hy = maskable ? 300 : 300;
    burst('#ff9a2e', '#ffc23a', 16, hx, hy - 40);
    x.fillStyle = '#fff4dc'; x.beginPath(); x.arc(hx, hy - 30 * m, 205 * m, 0, TAU); x.fill();
    x.strokeStyle = INK; x.lineWidth = 12 * m; x.stroke();
    const s = 11.2 * m;
    brady(hx - 14 * s * 0.1, hy + 52 * s, s, { state: 'idle', t: 0, phase: 0, happy: true });
    plane(maskable ? 372 : 418, maskable ? 132 : 92, maskable ? 0.95 : 1.25, 0.3);
  } else {
    burst('#ff4f8a', '#ff7aa8', 16, cx, cy);
    const R = maskable ? 140 : 172, gy = cy + 26;
    x.strokeStyle = INK; x.lineWidth = 12;
    // the man bun on top, with its loose ends
    x.fillStyle = '#8a6a44'; x.beginPath(); x.arc(cx - 6, gy - R - 22, 50, 0, TAU); x.fill(); x.stroke();
    x.lineWidth = 10; x.fillStyle = '#a8845a'; for (const [dx, dy, a] of [[-24, -64, -0.6], [6, -74, 0.1], [32, -60, 0.7]]) { x.save(); x.translate(cx - 6 + dx, gy - R - 22 + dy * 0.7); x.rotate(a); x.beginPath(); x.ellipse(0, -12, 11, 22, 0, 0, TAU); x.fill(); x.stroke(); x.restore(); }
    x.fillStyle = INK; x.beginPath(); x.arc(cx, gy, R + 6, 0, TAU); x.fill();
    x.fillStyle = '#2a8ae0'; x.beginPath(); x.arc(cx, gy, R, 0, TAU); x.fill();
    x.save(); x.beginPath(); x.arc(cx, gy, R, 0, TAU); x.clip();
    x.fillStyle = '#5cc85a'; x.strokeStyle = INK; x.lineWidth = 7;
    for (const [ox, oy, rx, ry] of [[-110, 40, 50, 70], [110, 60, 50, 46], [-20, 140, 70, 30], [130, -40, 30, 40]]) { x.beginPath(); x.ellipse(cx + ox, gy + oy, rx, ry, 0.3, 0, TAU); x.fill(); x.stroke(); }
    // hair swept back over the top of the globe to the bun
    x.fillStyle = '#8a6a44'; x.beginPath(); x.ellipse(cx, gy - R * 0.92, R * 0.95, R * 0.42, 0, 0, TAU); x.fill(); x.stroke();
    x.restore();
    // the shades
    x.fillStyle = INK; rr(x, cx - 134, gy - 60, 124, 78, 14); x.fill(); rr(x, cx + 10, gy - 60, 124, 78, 14); x.fill(); x.fillRect(cx - 24, gy - 50, 48, 16);
    x.fillStyle = 'rgba(255,255,255,0.4)'; x.beginPath(); x.moveTo(cx - 116, gy - 44); x.lineTo(cx - 92, gy - 44); x.lineTo(cx - 108, gy - 12); x.lineTo(cx - 124, gy - 12); x.fill(); x.beginPath(); x.moveTo(cx + 28, gy - 44); x.lineTo(cx + 52, gy - 44); x.lineTo(cx + 36, gy - 12); x.lineTo(cx + 20, gy - 12); x.fill();
    // stubble and a big grin
    x.fillStyle = 'rgba(28,20,38,0.55)'; for (let i = 0; i < 26; i++) { const a = 0.35 + (i / 26) * (Math.PI - 0.7), rr2 = R * (0.62 + (i % 3) * 0.07); x.beginPath(); x.arc(cx + Math.cos(a) * rr2, gy + 30 + Math.sin(a) * rr2 * 0.55, 4, 0, TAU); x.fill(); }
    x.fillStyle = '#fff'; x.strokeStyle = INK; x.lineWidth = 10; x.beginPath(); x.moveTo(cx - 70, gy + 40); x.quadraticCurveTo(cx, gy + 118, cx + 70, gy + 40); x.closePath(); x.fill(); x.stroke();
    x.lineWidth = 12; x.beginPath(); x.arc(cx, gy, R, 0, TAU); x.stroke();
    plane(maskable ? 392 : 418, maskable ? 132 : 96, maskable ? 0.95 : 1.2, 0.2);
  }
  x.restore();
};
