/* ============================================================
   Ink: the Fiesta Toon outline. Anything drawn through Ink.around
   gets a thick dark line around its silhouette, so characters,
   enemies, items and bosses pop off the background. The thing is
   painted into a scratch canvas at the screen's scale, its
   silhouette is stamped in ink around it, then the colour goes on
   top: existing art needs no changes.
   ============================================================ */
/* how much larger than their hitboxes characters are drawn (the physics never changes): Brady and enemies */
const ART_SCALE = { brady: 1.24, enemy: 1.3 };
const Ink = {
  on: true,
  color: '#1c1426',
  width: 1.3,            // logical px (about 4 device px on an iPhone)
  keyline: 'rgba(255,247,230,0.62)',   // the light line outside the ink that enemies and hazards get (opts.rim)
  /* Scratch canvases, one per slot and EXACT size (a few sizes per thing as it moves by sub-pixels), least recently
     used dropped past a pixel budget. PERFORMANCE: the old shared set only ever grew. A single big inked thing (a boss,
     a large Brazil prop baked into InkCache) grew it to about 1000 x 1100 px, and from then on every inked sprite,
     Brady included, worked on a sub-rectangle of a big surface: Safari's slow path (a sub-image copy per draw, and
     the full-surface clears of 'source-in' / 'destination-in'). Brady's line went from ~4 to ~9 ms a frame on a Mac.
     A canvas exactly the size of the work is drawn whole, the fast path. */
  scratch: new Map(), scratchPx: 0, scratchBudget: 4e6,
  canvas(i, w, h) {
    const k = i * 1e8 + w * 1e4 + h, m = this.scratch;
    let c = m.get(k);
    if (c) { m.delete(k); m.set(k, c); return c; }
    c = makeCanvas(w, h); m.set(k, c); this.scratchPx += w * h;
    for (const [k2, c2] of m) {
      if (this.scratchPx <= this.scratchBudget || m.size <= 8) break;
      if (k2 === k) continue;
      m.delete(k2); this.scratchPx -= c2.width * c2.height; c2.width = c2.height = 1;   // free the surface now (iOS)
    }
    return c;
  },
  /* opts.owner + Ink.every > 1 (the Medium / Low graphics tiers): the finished inked picture of that owner (an enemy,
     a boss) is kept in its own canvas and redrawn only every `every` frames; the frames between blit it where the
     owner now is. Brady never passes an owner: he is inked every frame at every tier. */
  every: 1, frame: 0, held: new WeakMap(),
  /* around(ctx, x, y, w, h, fn, opts): fn(ctx) draws in the current (world) coordinates; x,y,w,h is the box it
     stays inside (plus opts.pad logical px of slack, default 16). opts.width overrides the line width. */
  around(ctx, x, y, w, h, fn, opts) {
    if (!this.on || !ctx.getTransform) { fn(ctx); return; }
    const o = opts || {}, pad = o.pad != null ? o.pad : 16;
    const m = ctx.getTransform();
    const S = Math.hypot(m.a, m.b);
    if (!(S > 0)) { fn(ctx); return; }
    // Holding a finished picture (opts.owner, or for an inked thing without one its world box) and blitting it where
    // the owner now is, instead of inking again:
    //  - opts.key: the caller's description of everything its art depends on; reused while the key stays the same
    //  - Ink.statics (every tier): the art's own drawing commands are fingerprinted while it paints its colour pass;
    //    a thing whose commands did not change since the last frame (a lever, a crate, a sign, a prop) gets its ink
    //    pass once and the picture is reused until they change. Animated art never matches and is inked as before.
    //  - Ink.every > 1 (MEDIUM / LOW tiers): animated owners are re-inked every `every` frames, blitted between.
    // Brady (opts.hero) is always inked live.
    // MEDIUM / LOW tiers (Ink.fit): an owner's scratch area shrinks to what its kind of art was seen to reach
    let fitRec = null, fitSample = false;
    if (this.fit && o.owner && !o.fitted && !m.b && !m.c && !o.hero && w * h * m.a * m.d > 2500) {
      const fk = (o.owner.constructor.name || '?') + ':' + (o.owner.style || o.owner.kind || '') + ':' + Math.round(w) + 'x' + Math.round(h);
      fitRec = this.reach.get(fk); if (!fitRec) { fitRec = { l: 0, r: 0, t: 0, b: 0, n: 0, k: 0 }; this.reach.set(fk, fitRec); }
      fitRec.k++;
      fitSample = fitRec.n < 8 ? fitRec.k % 3 === 1 : fitRec.k % 240 === 0;
      if (!fitSample && fitRec.n >= 8) {
        const L = Math.min(pad, fitRec.l * 1.3 + 8), R = Math.min(pad, fitRec.r * 1.3 + 8), T = Math.min(pad, fitRec.t * 1.3 + 8), B = Math.min(pad, fitRec.b * 1.3 + 8);
        return this.around(ctx, x - L, y - T, w + L + R, h + T + B, fn, Object.assign({}, o, { pad: 0, fitted: true }));
      }
    }
    const plain = !m.b && !m.c && !o.hero && !o.noHold, keyed = plain && o.key != null && !!o.owner;
    let own = keyed ? o.owner : plain && (this.every > 1 || this.statics) ? (o.owner || this.boxOwner(x, y, w, h)) : null;
    let hd = own ? this.held.get(own) : null;
    // the same owner inked twice in one frame (two parts of one thing): never held
    if (hd && (hd.shared || hd.seen === this.frame)) { hd.shared = true; own = null; hd = null; }
    if (own && !hd) { hd = { c: null, seed: (Math.random() * 1000) | 0, pic: false, last: -1 }; this.held.set(own, hd); }
    if (hd) {
      hd.seen = this.frame;
      const same = hd.pic && hd.a === m.a && hd.d === m.d && hd.w === w && hd.h === h;
      if (same && (keyed ? hd.key === o.key : !hd.hash && this.every > 1 && ((this.frame + hd.seed) % this.every) !== 0 && this.frame - hd.f < this.every)) { this.blitHeld(ctx, hd, m, x, y); return; }
    }
    // the box in device space
    const ax = m.a * (x - pad), cx0 = m.c * (y - pad), ax1 = m.a * (x + w + pad), cy1 = m.c * (y + h + pad);
    const bx0 = m.b * (x - pad), dy0 = m.d * (y - pad), bx1 = m.b * (x + w + pad), dy1 = m.d * (y + h + pad);
    const x0 = Math.min(ax + cx0, ax1 + cx0, ax + cy1, ax1 + cy1) + m.e, x1 = Math.max(ax + cx0, ax1 + cx0, ax + cy1, ax1 + cy1) + m.e;
    const y0 = Math.min(bx0 + dy0, bx1 + dy0, bx0 + dy1, bx1 + dy1) + m.f, y1 = Math.max(bx0 + dy0, bx1 + dy0, bx0 + dy1, bx1 + dy1) + m.f;
    const r = Math.max(1, (o.width || this.width) * S);
    const bx = Math.floor(x0 - r - 1), by = Math.floor(y0 - r - 1);
    const bw = Math.ceil(x1 - x0 + 2 * r + 2), bh = Math.ceil(y1 - y0 + 2 * r + 2);
    if (bw > 2048 || bh > 2048 || bw <= 0 || bh <= 0) { fn(ctx); return; }
    // 1. the colour pass (fingerprinted when its owner may hold a picture)
    const c0 = this.canvas(0, bw, bh), s0 = c0.getContext('2d');
    s0.setTransform(1, 0, 0, 1, 0, 0); s0.globalCompositeOperation = 'source-over'; s0.globalAlpha = 1; s0.clearRect(0, 0, bw, bh);
    s0.setTransform(m.a, m.b, m.c, m.d, m.e - bx, m.f - by);
    // (a pass nested inside another's colour pass is not fingerprinted, and the outer one is not reusable)
    if (this.fpOn) this.fpOk = false;
    const fp = hd && !keyed && this.statics && !this.fpOn;
    if (fp) { this.hashCtx(s0); this.fpStart(); }
    s0.save(); try { fn(s0); } finally { s0.restore(); if (fp) this.fpEnd(); }
    if (fitSample) this.measureReach(fitRec, s0, bw, bh, bx, by, m, x, y, w, h);
    let keep = false;
    if (hd) {
      if (keyed) keep = true;
      else {
        const h0 = fp && this.fpOk ? this.fpHash : 0;
        // unchanged since the picture was made: blit it (the colour pass just drawn is simply not used)
        if (h0 && hd.pic && hd.hash === h0 && hd.a === m.a && hd.d === m.d && hd.w === w && hd.h === h && hd.bw === bw && hd.bh === bh) { hd.last = h0; this.blitHeld(ctx, hd, m, x, y); return; }
        // unchanged since the last frame: make a picture to reuse from now on; changing every frame: draw directly
        const prev = hd.last; hd.last = h0;
        keep = !!(h0 && h0 === prev) || this.every > 1;
        hd.hash = h0 && h0 === prev ? h0 : 0;
        if (!keep) hd.pic = false;
      }
    }
    // 2. the ink silhouette
    const c1 = this.canvas(1, bw, bh), s1 = c1.getContext('2d');
    s1.setTransform(1, 0, 0, 1, 0, 0); s1.globalCompositeOperation = 'source-over'; s1.globalAlpha = 1; s1.clearRect(0, 0, bw, bh);
    // only solid paint gets a line: stamp the colour pass three times (alpha saturates), then square the alpha
    // twice so soft glows, shadows and sparkle (alpha below about 0.5) fade out of the silhouette
    s1.drawImage(c0, 0, 0); s1.drawImage(c0, 0, 0); s1.drawImage(c0, 0, 0);
    s1.globalCompositeOperation = 'destination-in'; s1.drawImage(c1, 0, 0); s1.drawImage(c1, 0, 0);
    s1.globalCompositeOperation = 'source-in'; s1.fillStyle = o.color || this.color; s1.fillRect(0, 0, bw, bh);
    s1.globalCompositeOperation = 'source-over';
    // 2b. form: flat code-drawn art gets volume from its own silhouette (opts.form === false skips it): a soft
    // light-to-shade ramp down the shape, a bright rim where the light (upper left) meets the edge and a shade band
    // along the lower right edge. All of it stays inside the silhouette, on the scratch canvases already in use.
    if (o.form !== false && this.form) this.shade(c0, s0, c1, bw, bh, m.d * y + m.f - by, m.d * (y + h) + m.f - by, S);
    // 3. stamp the ink around, then the colour on top: straight onto the target, or (a held picture) into the
    // owner's own canvas first, which is then blitted
    let out = ctx, ox = bx, oy = by;
    if (keep) {
      if (!hd.c) { hd.c = makeCanvas(bw, bh); this.heldPx += bw * bh; }
      else if (hd.c.width !== bw || hd.c.height !== bh) { this.heldPx += bw * bh - hd.c.width * hd.c.height; hd.c.width = bw; hd.c.height = bh; }
      out = hd.c.getContext('2d'); out.setTransform(1, 0, 0, 1, 0, 0); out.globalAlpha = 1; out.globalCompositeOperation = 'source-over'; out.clearRect(0, 0, bw, bh);
      ox = 0; oy = 0;
      hd.a = m.a; hd.d = m.d; hd.e = m.e; hd.f2 = m.f; hd.x = x; hd.y = y; hd.w = w; hd.h = h; hd.bx = bx; hd.by = by; hd.bw = bw; hd.bh = bh; hd.f = this.frame; hd.key = keyed ? o.key : null; hd.pic = true;
      this.touchHeld(hd);
    } else { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); }
    // A quiet light keyline keeps the black hero (and, with opts.rim, enemies and hazards) readable in caves, at
    // night and on busy backgrounds: the silhouette recoloured on its own scratch canvas (the ink one stays as it is)
    if (o.rim && (this.rims || o.hero)) {
      const c3 = this.canvas(3, bw, bh), s3 = c3.getContext('2d');
      s3.setTransform(1, 0, 0, 1, 0, 0); s3.globalAlpha = 1; s3.globalCompositeOperation = 'copy'; s3.drawImage(c1, 0, 0);
      s3.globalCompositeOperation = 'source-in'; s3.fillStyle = o.rim; s3.fillRect(0, 0, bw, bh);
      s3.globalCompositeOperation = 'source-over';
      const rimR = r + (o.rimWidth || 0.8) * S;
      for (let k = 0; k < 8; k++) out.drawImage(c3, ox + this.ring8[2 * k] * rimR, oy + this.ring8[2 * k + 1] * rimR);
    }
    const n = r > 3 ? 16 : 8, ring = n === 16 ? this.ring16 : this.ring8;
    for (let k = 0; k < n; k++) out.drawImage(c1, ox + ring[2 * k] * r, oy + ring[2 * k + 1] * r);
    if (r > 2.5) for (let k = 0; k < 8; k++) out.drawImage(c1, ox + this.ring8h[2 * k] * r * 0.55, oy + this.ring8h[2 * k + 1] * r * 0.55);
    out.drawImage(c0, ox, oy);
    if (keep) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(hd.c, bx, by); }
    ctx.restore();
  },
  blitHeld(ctx, hd, m, x, y) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(hd.c, Math.round(hd.bx + (m.e - hd.e) + (x - hd.x) * m.a), Math.round(hd.by + (m.f - hd.f2) + (y - hd.y) * m.d));
    ctx.restore();
    this.touchHeld(hd);
  },
  /* held pictures: least recently used dropped past a pixel budget (about 12 MB) */
  statics: true, heldPx: 0, heldBudget: 3e6, heldLru: new Set(),
  // a new level: drop every held picture (their owners are gone)
  flushHeld() { for (const hd of this.heldLru) { if (hd.c) { hd.c.width = hd.c.height = 1; hd.c = null; } hd.pic = false; } this.heldLru.clear(); this.heldPx = 0; this.boxes.clear(); },
  touchHeld(hd) {
    const L = this.heldLru; L.delete(hd); L.add(hd);
    if (this.heldPx > this.heldBudget) for (const old of L) { if (this.heldPx <= this.heldBudget * 0.8 || old === hd) break; L.delete(old); if (old.c) { this.heldPx -= old.c.width * old.c.height; old.c.width = old.c.height = 1; old.c = null; } old.pic = false; }
  },
  /* the fingerprint of a colour pass: every drawing call and style set on the scratch context, with its arguments
     (numbers to 1/1024 px), folded into a 32-bit FNV hash while recording. Anything the hash cannot vouch for (a
     canvas as an image source, pixel reads, paths built elsewhere) marks the pass as not reusable. */
  fpOn: false, fpOk: true, fpHash: 0,
  fpStart() { this.fpOn = true; this.fpOk = true; this.fpHash = 2166136261; },
  fpEnd() { this.fpOn = false; },
  fpMix(v) { this.fpHash = Math.imul(this.fpHash ^ (v | 0), 16777619) >>> 0; },
  fpVal(v) {
    const t = typeof v;
    if (t === 'number') this.fpMix(Math.round(v * 1024));
    else if (t === 'string') { for (let i = 0; i < v.length; i++) this.fpMix(v.charCodeAt(i)); this.fpMix(v.length + 7); }
    else if (t === 'boolean') this.fpMix(v ? 3 : 5);
    else if (v == null) this.fpMix(11);
    else if (Array.isArray(v)) { for (const q of v) this.fpVal(q); this.fpMix(v.length + 13); }
    else if (typeof HTMLImageElement !== 'undefined' && v instanceof HTMLImageElement) {
      // an image: which one, and whether it has decoded yet (an atlas arriving changes the picture)
      let n = this.fpIds.get(v); if (!n) { n = ++this.fpNext; this.fpIds.set(v, n); }
      this.fpMix(n); this.fpMix(v.complete ? v.naturalWidth + 1 : 0);
    }
    else { const id = this.fpIds.get(v); if (id) this.fpMix(id); else this.fpOk = false; }
  },
  fpIds: new WeakMap(), fpNext: 1, fpNames: {},
  hashCtx(s) {
    if (s.__inkFp) return; s.__inkFp = true;
    const self = this, P = Object.getPrototypeOf(s);
    const name = k => self.fpNames[k] || (self.fpNames[k] = Object.keys(self.fpNames).length + 101);
    const calls = ['save', 'restore', 'translate', 'rotate', 'scale', 'transform', 'setTransform', 'resetTransform', 'beginPath', 'closePath', 'moveTo', 'lineTo',
      'quadraticCurveTo', 'bezierCurveTo', 'arc', 'arcTo', 'ellipse', 'rect', 'roundRect', 'fill', 'stroke', 'fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText', 'drawImage', 'setLineDash', 'clip'];
    for (const k of calls) {
      const f = P[k]; if (typeof f !== 'function') continue; const id = name(k);
      s[k] = function () { if (self.fpOn) { self.fpMix(id); for (let i = 0; i < arguments.length; i++) { const a = arguments[i]; if (a && typeof a === 'object' && !Array.isArray(a) && !self.fpIds.has(a) && !(typeof HTMLImageElement !== 'undefined' && a instanceof HTMLImageElement)) { if (typeof DOMMatrix !== 'undefined' && a instanceof DOMMatrix) { for (const q of [a.a, a.b, a.c, a.d, a.e, a.f]) self.fpVal(q); continue; } self.fpOk = false; continue; } self.fpVal(a); } } return f.apply(this, arguments); };
    }
    for (const k of ['getImageData', 'putImageData', 'isPointInPath']) { const f = P[k]; if (typeof f === 'function') s[k] = function () { if (self.fpOn) self.fpOk = false; return f.apply(this, arguments); }; }
    for (const k of ['createLinearGradient', 'createRadialGradient', 'createConicGradient', 'createPattern']) {
      const f = P[k]; if (typeof f !== 'function') continue; const id = name(k);
      s[k] = function () {
        const g = f.apply(this, arguments);
        if (self.fpOn && g) {
          // a gradient is identified by its arguments and colour stops, added to the hash when it is used
          let gh = id; const mixG = v => { gh = Math.imul(gh ^ (v | 0), 16777619) >>> 0; };
          for (let i = 0; i < arguments.length; i++) { const a = arguments[i]; if (typeof a === 'number') mixG(Math.round(a * 1024)); else if (typeof HTMLImageElement !== 'undefined' && a instanceof HTMLImageElement) { self.fpVal(a); mixG(self.fpIds.get(a)); } else if (typeof a === 'string') for (let j = 0; j < a.length; j++) mixG(a.charCodeAt(j)); else self.fpOk = false; }
          const add = g.addColorStop;
          if (add) g.addColorStop = function (o2, c2) { mixG(Math.round(o2 * 1024)); for (let j = 0; j < c2.length; j++) mixG(c2.charCodeAt(j)); self.fpIds.set(g, gh || 1); return add.call(this, o2, c2); };
          self.fpIds.set(g, gh || 1);
        }
        return g;
      };
    }
    const props = ['fillStyle', 'strokeStyle', 'lineWidth', 'lineCap', 'lineJoin', 'miterLimit', 'globalAlpha', 'globalCompositeOperation', 'font', 'textAlign', 'textBaseline',
      'shadowBlur', 'shadowColor', 'shadowOffsetX', 'shadowOffsetY', 'filter', 'imageSmoothingEnabled', 'lineDashOffset', 'direction', 'letterSpacing'];
    for (const k of props) {
      let d = null; for (let pr = P; pr && !d; pr = Object.getPrototypeOf(pr)) d = Object.getOwnPropertyDescriptor(pr, k);
      if (!d || !d.set) continue; const id = name(k);
      Object.defineProperty(s, k, { configurable: true, get() { return d.get.call(this); }, set(v) { if (self.fpOn) { self.fpMix(id); self.fpVal(v); } d.set.call(this, v); } });
    }
  },
  /* the reach of an owner's art past its box, from the colour pass's own pixels (a read-back: a few times per kind of
     thing, then every 240th drawing), in logical px */
  fit: false, reach: new Map(),
  measureReach(rec, s0, bw, bh, bx, by, m, x, y, w, h) {
    try {
      const d = s0.getImageData(0, 0, bw, bh).data; let x0 = bw, x1 = -1, y0 = bh, y1 = -1;
      for (let yy = 0; yy < bh; yy++) { const o = yy * bw * 4; for (let xx = 0; xx < bw; xx++) if (d[o + xx * 4 + 3] > 8) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; y1 = yy; } }
      rec.n++;
      if (x1 < 0) return;
      const S = m.a, L = (m.a * x + m.e - bx - x0) / S, R = (bx + x1 + 1 - (m.a * (x + w) + m.e)) / S, T = (m.d * y + m.f - by - y0) / m.d, B = (by + y1 + 1 - (m.d * (y + h) + m.f)) / m.d;
      rec.l = Math.max(rec.l, L); rec.r = Math.max(rec.r, R); rec.t = Math.max(rec.t, T); rec.b = Math.max(rec.b, B);
    } catch (e) { rec.n = 99; rec.l = rec.r = rec.t = rec.b = 1e4; }   // no read-back (a tainted canvas): never shrink
  },
  boxes: new Map(),
  boxOwner(x, y, w, h) {
    const k = Math.round(x) + ',' + Math.round(y) + ',' + Math.round(w) + ',' + Math.round(h);
    let b = this.boxes.get(k);
    if (!b) {
      if (this.boxes.size > 256) { for (const [k2, b2] of this.boxes) if (this.frame - b2.used > 120) this.boxes.delete(k2); if (this.boxes.size > 256) this.boxes.clear(); }
      b = { used: 0 }; this.boxes.set(k, b);
    }
    b.used = this.frame; return b;
  },
  /* cached(ctx, key, x0, y0, w, h, fn, opts): the finished inked picture of fn kept by key (and the screen scale), for
     art that repeats exactly (a spinning record's quantized frames): drawn once, then one blit per frame. The box is
     in the current coordinates and must not depend on where the thing is (draw it about a translated origin). */
  memo: new Map(), memoPx: 0, memoBudget: 2e6,
  cached(ctx, key, x0, y0, w, h, fn, opts) {
    const m = ctx.getTransform ? ctx.getTransform() : null, S = m ? m.a : 0;
    if (!this.on || !m || !(S > 0) || m.b || m.c || m.d !== S) { this.around(ctx, x0, y0, w, h, fn, opts); return; }
    const k = key + '@' + S.toFixed(3);
    let e = this.memo.get(k);
    if (e) { this.memo.delete(k); this.memo.set(k, e); }
    else {
      const pad = (opts && opts.pad != null ? opts.pad : 16) + 2 + 2 * ((opts && opts.width) || this.width) + ((opts && opts.rim) ? 1 : 0);
      const cw = Math.ceil((w + pad * 2) * S), ch = Math.ceil((h + pad * 2) * S), c = makeCanvas(cw, ch), cx = c.getContext('2d');
      cx.setTransform(S, 0, 0, S, -(x0 - pad) * S, -(y0 - pad) * S);
      this.around(cx, x0, y0, w, h, fn, Object.assign({ noHold: true }, opts));
      e = { c, ox: x0 - pad, oy: y0 - pad };
      this.memo.set(k, e); this.memoPx += cw * ch;
      for (const [k2, e2] of this.memo) { if (this.memoPx <= this.memoBudget || this.memo.size <= 8) break; this.memo.delete(k2); this.memoPx -= e2.c.width * e2.c.height; }
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(e.c, Math.round(m.e + e.ox * S), Math.round(m.f + e.oy * S));
    ctx.restore();
  },
  rims: true,   // the light keylines (Brady, enemies, hazards); the Low tier keeps only Brady's
  ring8: [], ring16: [], ring8h: [],
  /* The form pass (see around, step 2b). c0/s0: the colour pass, c1: its silhouette, all bw x bh device px; ty0..ty1:
     the art's box top and bottom in the scratch canvas. Light from the upper left, like the Blender sprites. */
  form: true,
  formLight: 'rgba(255,250,236,1)', formShade: 'rgba(36,16,58,1)',
  shade(c0, s0, c1, bw, bh, ty0, ty1, S) {
    const c2 = this.canvas(2, bw, bh), s2 = c2.getContext('2d');
    const d = Math.max(1, 1.1 * S);
    const crescent = (dx, dy, col) => {
      s2.setTransform(1, 0, 0, 1, 0, 0); s2.globalAlpha = 1; s2.globalCompositeOperation = 'source-over'; s2.clearRect(0, 0, bw, bh);
      s2.drawImage(c1, 0, 0);
      s2.globalCompositeOperation = 'destination-out'; s2.drawImage(c1, dx, dy);
      s2.globalCompositeOperation = 'source-in'; s2.fillStyle = col; s2.fillRect(0, 0, bw, bh);
      s2.globalCompositeOperation = 'source-over';
    };
    s0.setTransform(1, 0, 0, 1, 0, 0); s0.globalCompositeOperation = 'source-atop';
    // the ramp: lit at the top, a cool shade toward the feet
    const g = s0.createLinearGradient(0, ty0, 0, ty1);
    g.addColorStop(0, 'rgba(255,250,236,0.10)'); g.addColorStop(0.45, 'rgba(255,250,236,0)'); g.addColorStop(1, 'rgba(36,16,58,0.24)');
    s0.globalAlpha = 1; s0.fillStyle = g; s0.fillRect(0, 0, bw, bh);
    // shade band along the lower right edge, then the bright rim along the upper left edge
    crescent(-d * 1.3, -d * 1.6, this.formShade); s0.globalAlpha = 0.26; s0.drawImage(c2, 0, 0);
    crescent(d * 0.8, d, this.formLight); s0.globalAlpha = 0.5; s0.drawImage(c2, 0, 0);
    s0.globalAlpha = 1; s0.globalCompositeOperation = 'source-over';
  },
  /* around an entity (x, y, w, h), with slack for art that spills past the hitbox. opts.scale: how much larger than
     the hitbox the art is drawn (default ART_SCALE.enemy); the slack grows with it so tails, hats and raised arms
     are never cut off at the edge of the scratch canvas. opts.extra: more slack for unusually far-reaching art. */
  ent(ctx, e, fn, opts) {
    const k = opts && opts.scale || ART_SCALE.enemy, big = Math.max(e.w, e.h);
    const pad = Math.max(16, e.w * 0.6, e.h * 0.4) * k + (k - 1) * big + (opts && opts.extra || 0);
    this.around(ctx, e.x, e.y, e.w, e.h, fn, Object.assign({ pad, owner: e }, opts || {}));
  }
};
for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, b = (k + 0.5) / 8 * TAU; Ink.ring8.push(Math.cos(a), Math.sin(a)); Ink.ring8h.push(Math.cos(b), Math.sin(b)); }
for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; Ink.ring16.push(Math.cos(a), Math.sin(a)); }
