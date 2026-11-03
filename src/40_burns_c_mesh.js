/* ============================================================
   BRADY GOES TO BURNING MAN — mesh builder + texture atlases
   BurnsMesh: low-poly geometry with a transform stack. Every primitive
   is emitted flat-shaded (or soft with opts.smooth) in the 24-byte format.
   Colours are vertex colours; an atlas "decal" (premultiplied RGBA) is
   composited over them: final = vertexColour * (1 - tex.a) + tex.rgb.
   Untextured faces sample a transparent texel, so they show the colour.
   ============================================================ */

/* ---------------- shared atlas (2048 x 2048) ----------------
   top-left:     pattern tiles, item icons, misc (Chinka photo)
   top-right:    per-world sign/banner text (shelf-packed, reset per world)
   bottom half:  faces, 16 cols x 4 expression rows of 128px (art inset 8px with a clear
                 margin, so faces wrap cleanly onto round heads) */
const BURNS_ATLAS = {
  W: 2048, H: 2048, canvas: null, T: null,
  faceV0: 1024 / 2048, faceV1: 2048 / 2048, faceRowV: 128 / 2048,   // two banks: y 1024..1536 and 1536..2048
  regions: {},
  white: { u0: 4 / 2048, v0: 4 / 2048, u1: 12 / 2048, v1: 12 / 2048 },
  FACES: ['brady', 'bradyClean', 'friendly', 'lashes', 'tired', 'stressed', 'greeter', 'beard', 'smug', 'chinka', 'stern', 'goofy', 'grumpy', 'sleepy', 'man', 'kid'],
  PATTERNS: ['tattoo', 'tattoo2', 'fur', 'disco', 'led', 'plaid', 'hivis', 'tiedye', 'wood', 'swoosh', 'canvas', 'sequin', 'leopard', 'flames', 'denim', 'rainbow'],
  ICONS: ['heart', 'k', 'flake', 'tab', 'shroom', 'leaf', 'toad', 'bottle', 'drop', 'ticket', 'map', 'www', 'token', 'glowstick', 'ziptie', 'camera'],
  init() {
    if (this.canvas) return;
    const c = makeCanvas(this.W, this.H), x = c.getContext('2d');
    this.canvas = c; this.ctx = x;
    x.clearRect(0, 0, this.W, this.H);
    this.FACES.forEach((f, i) => this.paintFaceCell(i, f));
    this.PATTERNS.forEach((p, i) => { const px = (i % 8) * 128, py = 320 + Math.floor(i / 8) * 128; this.paintPattern(x, px, py, p); this.regions['pat:' + p] = this.reg(px + 4, py + 4, 120, 120); });
    this.ICONS.forEach((p, i) => { const px = (i % 8) * 128, py = 576 + Math.floor(i / 8) * 128; this.paintIcon(x, px, py, p); this.regions['icon:' + p] = this.reg(px + 4, py + 4, 120, 120); });
    this.paintPhoto(x, 0, 832);
    this.regions.photo = this.reg(4, 836, 120, 152);
    this.extraPatterns.forEach((e, i) => this.paintExtra(i));
    this.T = { src: c, opts: { mips: true, premult: true, aniso: 4 }, tex: null, gen: -1 };
    this.signReset();
  },
  reg(x, y, w, h) { return { u0: x / this.W, v0: y / this.H, u1: (x + w) / this.W, v1: (y + h) / this.H, px: x, py: y, pw: w, ph: h }; },
  // ---- faces: 32 slots (two banks of 16 x 4 expression rows); add more with addFace ----
  faceRecipes: {},
  paintFaceCell(i, f) {
    const x = this.ctx, col = i % 16, bank = Math.floor(i / 16);
    for (let r = 0; r < 4; r++) {
      const X = col * 128, Y = 1024 + bank * 512 + r * 128;
      x.save(); x.clearRect(X, Y, 128, 128); x.beginPath(); x.rect(X + 6, Y + 6, 116, 116); x.clip(); x.translate(X + 8, Y + 8); x.scale(1.75, 1.75); this.paintFace(x, 0, 0, f, r); x.restore();
    }
    this.regions['face:' + f] = this.reg(col * 128 + 4, 1024 + bank * 512 + 4, 120, 120);
    if (this.T) this.T.dirty = true;
  },
  // new face: recipe { eyes, eyeSc, brows: {col, tilt, w, y}, mouth, stubble, beard, mustache, wrinkles, blush, lashes, lips, mask }
  // or a painter fn(ctx, row, H) drawing in a 64x64 box (H: the built-in eye/brow/mouth/stubble/blush/nose helpers)
  addFace(name, recipe) {
    this.faceRecipes[name] = recipe;
    let i = this.FACES.indexOf(name);
    if (i < 0) { if (this.FACES.length >= 32) { console.warn('burns: face slots full'); return; } this.FACES.push(name); i = this.FACES.length - 1; }
    if (this.canvas) this.paintFaceCell(i, name);
  },
  // ---- extra 128px pattern tiles (23 slots: y 64..320 and y 832..960): addPattern(name, fn(ctx, rng)) paints a tileable 128x128 decal ----
  extraPatterns: [],
  extraSlot(i) { return i < 16 ? [(i % 8) * 128, 64 + Math.floor(i / 8) * 128] : [128 + (i - 16) * 128, 832]; },
  addPattern(name, fn) {
    let i = this.extraPatterns.findIndex(e => e.name === name);
    if (i < 0) { if (this.extraPatterns.length >= 23) { console.warn('burns: pattern slots full: ' + name); return; } this.extraPatterns.push({ name, fn }); i = this.extraPatterns.length - 1; }
    else this.extraPatterns[i].fn = fn;
    if (this.canvas) this.paintExtra(i);
  },
  paintExtra(i) {
    const e = this.extraPatterns[i], x = this.ctx, [px, py] = this.extraSlot(i);
    x.save(); x.clearRect(px, py, 128, 128); x.beginPath(); x.rect(px, py, 128, 128); x.clip(); x.translate(px, py);
    try { e.fn(x, mulberry32(hashStr(e.name))); } catch (err) { console.error(err); }
    x.restore();
    this.regions['pat:' + e.name] = this.reg(px + 4, py + 4, 120, 120);
    if (this.T) this.T.dirty = true;
  },
  face(name) { return this.regions['face:' + name] || this.regions['face:friendly']; },
  pattern(name) { return this.regions['pat:' + name] || this.white; },   // unknown/unpainted -> transparent texel (shows the base colour)
  icon(name) { return this.regions['icon:' + name]; },
  // ---- per-world sign text (right half) ----
  signReset() {
    const x = this.ctx; x.clearRect(1024, 0, 1024, 1024);
    this.sx = 1024 + 4; this.sy = 4; this.srow = 0; this.signs = {};
    if (this.T) this.T.dirty = true;
  },
  // opts: { w, h (px), bg, fg, font, size, border, glow, pad, align, lines }
  sign(text, o) {
    o = o || {};
    const key = text + '|' + JSON.stringify(o);
    if (this.signs[key]) return this.signs[key];
    const x = this.ctx;
    const size = o.size || 40, font = o.font || FONT_DISPLAY;
    x.font = `${size}px ${font}`;
    const lines = String(text).split('\n');
    const tw = Math.max(...lines.map(l => x.measureText(l).width));
    const pad = o.pad === undefined ? size * 0.4 : o.pad;
    const w = Math.min(1000, Math.ceil(o.w || tw + pad * 2)), h = Math.min(500, Math.ceil(o.h || size * 1.25 * lines.length + pad * 1.4));
    // signs are rasterised at 72% (about twice as many fit); their size in the world is set by the caller, not by pixels
    const SC = 0.72, pw = Math.ceil(w * SC), ph = Math.ceil(h * SC);
    if (this.sx + pw + 4 > 2048) { this.sx = 1028; this.sy += this.srow + 4; this.srow = 0; }
    if (this.sy + ph + 4 > 1024) { console.warn('burns sign atlas full'); return this.white; }
    const px = this.sx, py = this.sy;
    this.sx += pw + 6; this.srow = Math.max(this.srow, ph);
    x.save(); x.beginPath(); x.rect(px, py, pw, ph); x.clip(); x.translate(px, py); x.scale(SC, SC);
    if (o.bg) { x.fillStyle = o.bg; if (o.round) { burnsRR(x, 0, 0, w, h, o.round); x.fill(); } else x.fillRect(0, 0, w, h); }
    if (o.border) { x.strokeStyle = o.border; x.lineWidth = o.borderW || Math.max(3, size * 0.1); if (o.round) { burnsRR(x, x.lineWidth / 2, x.lineWidth / 2, w - x.lineWidth, h - x.lineWidth, o.round); x.stroke(); } else x.strokeRect(x.lineWidth / 2, x.lineWidth / 2, w - x.lineWidth, h - x.lineWidth); }
    x.font = `${size}px ${font}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    if (o.glow) { x.shadowColor = o.glow; x.shadowBlur = size * 0.35; }
    x.fillStyle = o.fg || '#ffffff';
    lines.forEach((l, i) => x.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.18 + size * 0.04));
    x.restore();
    const r = this.reg(px, py, pw, ph); r.aspect = w / h;
    this.signs[key] = r;
    if (this.T) this.T.dirty = true;
    return r;
  },
  // ---------- painters ----------
  paintFace(x, X, Y, name, row) {
    x.save(); x.translate(X, Y);
    const ink = '#1b1418', white = '#fbf8f2';
    const eye = (cx, cy, kind, sc) => {
      sc = sc || 1;
      if (kind === 'closed') { x.strokeStyle = ink; x.lineWidth = 2.6; x.beginPath(); x.arc(cx, cy - 1, 4.2 * sc, 0.2, Math.PI - 0.2); x.stroke(); return; }
      if (kind === 'squint') { x.strokeStyle = ink; x.lineWidth = 2.8; x.beginPath(); x.moveTo(cx - 5, cy - 3); x.lineTo(cx + 3, cy); x.lineTo(cx - 5, cy + 3); x.stroke(); return; }
      if (kind === 'heart') { x.fillStyle = '#ff3b7a'; x.beginPath(); x.moveTo(cx, cy + 5); x.bezierCurveTo(cx - 9, cy - 1, cx - 4, cy - 8, cx, cy - 3); x.bezierCurveTo(cx + 4, cy - 8, cx + 9, cy - 1, cx, cy + 5); x.fill(); return; }
      if (kind === 'tired') {
        x.fillStyle = 'rgba(90,40,80,0.45)'; x.beginPath(); x.ellipse(cx, cy + 5, 6, 3, 0, 0, TAU); x.fill();
        x.fillStyle = white; x.beginPath(); x.ellipse(cx, cy + 1, 4.6, 2.6, 0, 0, TAU); x.fill();
        x.fillStyle = ink; x.beginPath(); x.arc(cx, cy + 1.6, 2.2, 0, TAU); x.fill();
        x.fillStyle = 'rgba(120,70,60,0.9)'; x.fillRect(cx - 5.5, cy - 2.4, 11, 2.6); return;
      }
      x.fillStyle = white; x.beginPath(); x.ellipse(cx, cy, 4.8 * sc, 5.6 * sc, 0, 0, TAU); x.fill();
      x.fillStyle = kind === 'blue' ? '#3a6aa0' : kind === 'green' ? '#3a8a50' : '#4a3020'; x.beginPath(); x.arc(cx + 0.6, cy + 0.6, 3.1 * sc, 0, TAU); x.fill();
      x.fillStyle = ink; x.beginPath(); x.arc(cx + 0.7, cy + 0.8, 1.7 * sc, 0, TAU); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx + 1.8, cy - 1.2, 1.1, 0, TAU); x.fill();
    };
    const brow = (cx, cy, tilt, w, col) => { x.strokeStyle = col || ink; x.lineWidth = 2.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx - (w || 6), cy + tilt); x.lineTo(cx + (w || 6), cy - tilt); x.stroke(); };
    const mouth = (kind, cx, cy, w) => {
      cx = cx || 32; cy = cy || 46; w = w || 10;
      x.lineCap = 'round';
      if (kind === 'open') { x.fillStyle = '#5a1a20'; x.beginPath(); x.ellipse(cx, cy + 1, w * 0.55, 5.5, 0, 0, TAU); x.fill(); x.fillStyle = '#ff7a8a'; x.beginPath(); x.ellipse(cx, cy + 3.5, w * 0.35, 2, 0, 0, TAU); x.fill(); return; }
      if (kind === 'shout') { x.fillStyle = '#4a1018'; x.beginPath(); x.ellipse(cx, cy + 1, w * 0.75, 7.5, 0, 0, TAU); x.fill(); x.fillStyle = '#ffffff'; x.fillRect(cx - w * 0.55, cy - 5.5, w * 1.1, 2.5); return; }
      if (kind === 'grin') { x.fillStyle = '#5a1a20'; x.beginPath(); x.moveTo(cx - w, cy - 2); x.quadraticCurveTo(cx, cy + 12, cx + w, cy - 2); x.closePath(); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(cx - w + 2, cy - 1.5); x.quadraticCurveTo(cx, cy + 3, cx + w - 2, cy - 1.5); x.closePath(); x.fill(); return; }
      if (kind === 'wavy') { x.strokeStyle = '#5a1a20'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(cx - w, cy); for (let i = 1; i <= 4; i++) x.lineTo(cx - w + i * w / 2, cy + (i % 2 ? -2.5 : 2.5)); x.stroke(); return; }
      if (kind === 'flat') { x.strokeStyle = '#5a1a20'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(cx - w * 0.7, cy); x.lineTo(cx + w * 0.7, cy); x.stroke(); return; }
      if (kind === 'frown') { x.strokeStyle = '#5a1a20'; x.lineWidth = 2.6; x.beginPath(); x.arc(cx, cy + 7, w * 0.8, -2.5, -0.64); x.stroke(); return; }
      if (kind === 'smirk') { x.strokeStyle = '#5a1a20'; x.lineWidth = 2.6; x.beginPath(); x.moveTo(cx - w * 0.6, cy + 1); x.quadraticCurveTo(cx + w * 0.3, cy + 3, cx + w * 0.9, cy - 3); x.stroke(); return; }
      if (kind === 'o') { x.fillStyle = '#4a1018'; x.beginPath(); x.ellipse(cx, cy + 1, 3.5, 4.5, 0, 0, TAU); x.fill(); return; }
      x.strokeStyle = '#5a1a20'; x.lineWidth = 2.6; x.beginPath(); x.arc(cx, cy - 5, w * 0.85, 0.5, Math.PI - 0.5); x.stroke();
    };
    const stubble = (alpha, full) => {
      const rng = mulberry32(77);
      x.fillStyle = `rgba(40,26,20,${alpha})`;
      for (let i = 0; i < (full ? 520 : 190); i++) {
        const a = rng() * Math.PI, r = 18 + rng() * 12;
        const px = 32 + Math.cos(a) * r * 1.05, py = 34 + Math.sin(a) * r * (full ? 1.0 : 0.95);
        if (py < 38 && !full) continue;
        x.fillRect(px, py, 1.4, 1.4);
      }
      for (let i = 0; i < 45; i++) { x.fillRect(22 + rng() * 20, 40 + rng() * 3, 1.2, 1.2); }
    };
    const blush = () => { x.fillStyle = 'rgba(255,90,110,0.28)'; x.beginPath(); x.ellipse(15, 40, 5, 3, 0, 0, TAU); x.ellipse(49, 40, 5, 3, 0, 0, TAU); x.fill(); };
    const nose = () => { x.fillStyle = 'rgba(120,60,40,0.35)'; x.beginPath(); x.moveTo(32, 30); x.lineTo(35, 38); x.lineTo(29, 38); x.closePath(); x.fill(); };
    const ek = row === 2 ? 'squint' : row === 3 ? 'heart' : null;
    const mk = (n, t, h, hap) => row === 1 ? t : row === 2 ? h : row === 3 ? hap : n;
    const E = (cx, cy, base, sc) => eye(cx, cy, ek || base, sc);
    const rec = this.faceRecipes[name];
    if (typeof rec === 'function') { rec(x, row, { eye, brow, mouth, stubble, blush, nose, ink, white, E, mk }); x.restore(); return; }
    if (rec) {
      const q = rec, ey = q.eyeY || 27, sc = q.eyeSc || 1;
      if (q.mask) { x.fillStyle = q.mask; x.beginPath(); x.ellipse(32, 30, 30, 26, 0, 0, TAU); x.fill(); }
      if (q.stubble) stubble(q.stubble, !!q.stubbleFull);
      if (q.nose !== false) nose();
      if (q.wrinkles) { x.strokeStyle = 'rgba(70,40,30,0.45)'; x.lineWidth = 1.1; for (const sx of [1, -1]) { for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(32 + sx * 15, ey - 2 + k * 3); x.lineTo(32 + sx * 19, ey - 4 + k * 4); x.stroke(); } } x.beginPath(); x.moveTo(25, 12); x.quadraticCurveTo(32, 10, 39, 12); x.moveTo(23, 15); x.quadraticCurveTo(32, 13, 41, 15); x.stroke(); }
      if (q.eyes !== 'none') { const base = q.eyes === 'squint' ? (row === 3 ? 'heart' : 'closed') : q.eyes === 'normal' ? null : q.eyes; eye(22, ey, row === 2 ? 'squint' : row === 3 ? 'heart' : base, sc); eye(42, ey, row === 2 ? 'squint' : row === 3 ? 'heart' : base, sc); }
      if (q.lashes) { x.strokeStyle = ink; x.lineWidth = 2; for (const ex of [22, 42]) for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(ex + k * 3, ey - 4.5); x.lineTo(ex + k * 4.5, ey - 8); x.stroke(); } }
      if (q.brows !== false) { const b = q.brows || {}; x.save(); x.lineWidth = b.thick || 2.6; brow(22, b.y || ey - 9, row === 2 ? -2 : (b.tilt || 0), b.w || 6, b.col); brow(42, b.y || ey - 9, row === 2 ? 2 : -(b.tilt || 0), b.w || 6, b.col); x.restore(); }
      if (q.beard) { x.fillStyle = q.beard; x.beginPath(); x.moveTo(6, 32); x.quadraticCurveTo(10, 58, 32, 63); x.quadraticCurveTo(54, 58, 58, 32); x.quadraticCurveTo(46, 41, 32, 40); x.quadraticCurveTo(18, 41, 6, 32); x.fill(); }
      if (q.mustache) { x.fillStyle = q.mustache; x.beginPath(); x.moveTo(20, 45); x.quadraticCurveTo(32, 36, 44, 45); x.quadraticCurveTo(32, 42, 20, 45); x.fill(); }
      mouth(mk(q.mouth || 'smile', 'open', 'wavy', 'grin'), 32, q.mouthY || 46, q.mouthW || 9);
      if (q.lips) { x.fillStyle = q.lips; x.beginPath(); x.ellipse(32, (q.mouthY || 46), 6, 2.4, 0, 0, TAU); x.fill(); }
      if (q.blush) blush();
      x.restore(); return;
    }
    switch (name) {
      case 'brady': case 'bradyClean':
        nose(); E(22, 27, null); E(42, 27, null);
        brow(22, 18, row === 2 ? -2 : 0.5, 6, '#2a1c14'); brow(42, 18, row === 2 ? 2 : -0.5, 6, '#2a1c14');
        if (name === 'brady') stubble(0.34, false);
        mouth(mk('smile', 'open', 'wavy', 'grin'), 32, 46, 9);
        break;
      case 'friendly': nose(); E(22, 28, null); E(42, 28, null); brow(22, 19, 0, 5); brow(42, 19, 0, 5); mouth(mk('smile', 'open', 'wavy', 'grin')); blush(); break;
      case 'lashes':
        nose(); E(22, 28, 'blue'); E(42, 28, 'blue');
        x.strokeStyle = ink; x.lineWidth = 2; for (const ex of [22, 42]) for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(ex + k * 3, 22.5); x.lineTo(ex + k * 4.5, 19); x.stroke(); }
        mouth(mk('smile', 'open', 'wavy', 'grin'), 32, 46, 8); x.fillStyle = 'rgba(220,40,90,0.55)'; x.beginPath(); x.ellipse(32, 46, 6, 2.6, 0, 0, TAU); x.fill(); blush(); break;
      case 'tired': nose(); eye(22, 28, row === 3 ? 'heart' : row === 2 ? 'squint' : 'tired'); eye(42, 28, row === 3 ? 'heart' : row === 2 ? 'squint' : 'tired'); mouth(mk('flat', 'open', 'wavy', 'smile'), 32, 47, 8); stubble(0.3, false); break;
      case 'stressed': nose(); E(22, 28, null, 0.9); E(42, 28, null, 0.9); brow(22, 19, -3, 6); brow(42, 19, 3, 6); mouth(mk('frown', 'shout', 'wavy', 'grin')); x.fillStyle = 'rgba(80,140,255,0.6)'; x.beginPath(); x.ellipse(52, 14, 2.5, 4, 0, 0, TAU); x.fill(); break;
      case 'greeter': nose(); E(22, 27, 'green', 1.1); E(42, 27, 'green', 1.1); brow(22, 17, 1.5, 6); brow(42, 17, -1.5, 6); mouth(mk('grin', 'shout', 'wavy', 'grin'), 32, 45, 12); blush(); break;
      case 'beard':
        nose(); E(22, 27, null, 0.9); E(42, 27, null, 0.9); brow(22, 19, -1, 7, '#6a6a6a'); brow(42, 19, 1, 7, '#6a6a6a');
        x.fillStyle = 'rgba(150,150,150,0.95)'; x.beginPath(); x.moveTo(8, 34); x.quadraticCurveTo(32, 74, 56, 34); x.quadraticCurveTo(44, 40, 32, 39); x.quadraticCurveTo(20, 40, 8, 34); x.fill();
        mouth(mk('flat', 'open', 'wavy', 'smile'), 32, 45, 7); break;
      case 'smug': nose(); E(22, 28, null); E(42, 28, null); x.fillStyle = 'rgba(200,170,150,0.9)'; x.fillRect(16, 23, 12, 3); x.fillRect(36, 23, 12, 3); brow(22, 19, 1, 6); brow(42, 18, -2, 6); mouth(mk('smirk', 'open', 'wavy', 'grin')); break;
      case 'chinka': nose(); E(22, 28, null); E(42, 28, null); x.strokeStyle = ink; x.lineWidth = 2; for (const ex of [22, 42]) { x.beginPath(); x.moveTo(ex + 4, 23); x.lineTo(ex + 7, 20); x.stroke(); } mouth(mk('grin', 'open', 'o', 'grin'), 32, 45, 10); x.fillStyle = 'rgba(200,60,80,0.4)'; x.beginPath(); x.ellipse(32, 46, 7, 2.5, 0, 0, TAU); x.fill(); blush(); break;
      case 'stern': nose(); E(22, 28, null, 0.85); E(42, 28, null, 0.85); brow(22, 20, -1.5, 7); brow(42, 20, 1.5, 7); mouth(mk('flat', 'open', 'frown', 'smile')); break;
      case 'goofy': nose(); E(20, 27, null, 1.2); E(44, 28, null, 0.9); brow(20, 16, 2, 6); brow(44, 18, -1, 6); mouth(mk('grin', 'open', 'wavy', 'grin'), 32, 46, 12); x.fillStyle = '#ff7a8a'; if (row !== 1) { x.beginPath(); x.ellipse(36, 50, 3.5, 4, 0, 0, TAU); x.fill(); } break;
      case 'grumpy': nose(); E(22, 28, null, 0.8); E(42, 28, null, 0.8); brow(22, 21, -3, 7, '#888'); brow(42, 21, 3, 7, '#888'); mouth(mk('frown', 'open', 'wavy', 'smile')); stubble(0.45, true); break;
      case 'sleepy': nose(); eye(22, 28, row === 3 ? 'heart' : 'closed'); eye(42, 28, row === 3 ? 'heart' : 'closed'); mouth(mk('o', 'shout', 'wavy', 'grin'), 32, 46, 8); break;
      case 'man': {
        // The Man has no face: a glowing heart-shaped visor slit (expression via row)
        x.fillStyle = row === 2 ? '#ff4040' : row === 3 ? '#ff4fa8' : '#ffd0f4';
        x.beginPath(); x.moveTo(32, 50); x.bezierCurveTo(10, 34, 18, 16, 32, 26); x.bezierCurveTo(46, 16, 54, 34, 32, 50); x.fill();
        break;
      }
      case 'kid': default: nose(); E(22, 29, null, 1.15); E(42, 29, null, 1.15); mouth(mk('smile', 'open', 'wavy', 'grin'), 32, 46, 8); blush(); break;
    }
    x.restore();
  },
  paintPattern(x, X, Y, name) {
    x.save(); x.beginPath(); x.rect(X, Y, 128, 128); x.clip(); x.translate(X, Y);
    const rng = mulberry32(hashStr(name));
    const ink = 'rgba(16,12,18,0.95)';
    switch (name) {
      case 'tattoo': case 'tattoo2': {
        // blackwork geometric sleeve: bands, triangles, dot rows, a mandala-ish diamond
        x.fillStyle = ink; x.strokeStyle = ink; x.lineCap = 'butt';
        x.fillRect(0, 0, 128, 7); x.fillRect(0, 121, 128, 7);
        if (name === 'tattoo') {
          for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(i * 16, 10); x.lineTo(i * 16 + 8, 26); x.lineTo(i * 16 + 16, 10); x.closePath(); x.fill(); }
          for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(i * 16 + 8, 64); x.lineTo(i * 16 + 15, 50); x.lineTo(i * 16 + 8, 36); x.lineTo(i * 16 + 1, 50); x.closePath(); x.fill(); x.beginPath(); x.moveTo(i * 16 + 8, 92); x.lineTo(i * 16 + 13, 78); x.lineTo(i * 16 + 8, 66); x.lineTo(i * 16 + 3, 78); x.closePath(); x.lineWidth = 2; x.stroke(); }
          for (let i = 0; i < 16; i++) { x.beginPath(); x.arc(i * 8 + 4, 100, 1.8, 0, TAU); x.fill(); }
          for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(i * 16, 118); x.lineTo(i * 16 + 8, 104); x.lineTo(i * 16 + 16, 118); x.closePath(); x.fill(); }
        } else {
          x.lineWidth = 3; for (let i = -2; i < 10; i++) { x.beginPath(); x.moveTo(i * 16, 12); x.lineTo(i * 16 + 32, 60); x.stroke(); }
          x.fillRect(0, 60, 128, 5);
          for (let r = 0; r < 4; r++) for (let i = 0; i < 16; i++) { x.beginPath(); x.arc(i * 8 + (r % 2) * 4, 72 + r * 10, 1.6, 0, TAU); x.fill(); }
          x.fillRect(0, 110, 128, 4);
        }
        break;
      }
      case 'fur': for (let i = 0; i < 900; i++) { const px = rng() * 128, py = rng() * 128, l = 6 + rng() * 10, a = 1.2 + rng() * 0.6; x.strokeStyle = rng() < 0.5 ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.22)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); } break;
      case 'disco': for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const v = 150 + Math.floor(rng() * 105); x.fillStyle = `rgb(${v},${v},${Math.min(255, v + 20)})`; x.fillRect(i * 16 + 1, j * 16 + 1, 14, 14); if (rng() < 0.15) { x.fillStyle = '#ffffff'; x.fillRect(i * 16 + 3, j * 16 + 3, 5, 5); } } x.fillStyle = '#5a5a6a'; for (let k = 0; k <= 8; k++) { x.fillRect(k * 16 - 1, 0, 2, 128); x.fillRect(0, k * 16 - 1, 128, 2); } break;
      case 'led': for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const h = (i * 30 + j * 20) % 360; x.fillStyle = burnsHSL(h, 1, 0.65); x.beginPath(); x.arc(i * 16 + 8, j * 16 + 8, 3.5, 0, TAU); x.fill(); } break;
      case 'plaid': x.fillStyle = 'rgba(0,0,0,0.28)'; for (let i = 0; i < 8; i++) { x.fillRect(i * 16, 0, 6, 128); x.fillRect(0, i * 16, 128, 6); } x.fillStyle = 'rgba(255,255,255,0.18)'; for (let i = 0; i < 8; i++) { x.fillRect(i * 16 + 10, 0, 2, 128); x.fillRect(0, i * 16 + 10, 128, 2); } break;
      case 'hivis': x.fillStyle = '#d8ff3a'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#c8c8d0'; x.fillRect(0, 40, 128, 16); x.fillRect(0, 84, 128, 16); x.fillStyle = 'rgba(255,255,255,0.8)'; x.fillRect(0, 44, 128, 4); x.fillRect(0, 88, 128, 4); break;
      case 'tiedye': for (let r = 90; r > 0; r -= 6) { x.fillStyle = burnsHSL(r * 9, 0.85, 0.6); x.beginPath(); x.arc(64 + Math.sin(r) * 4, 64 + Math.cos(r) * 4, r, 0, TAU); x.fill(); } break;
      case 'wood': x.strokeStyle = 'rgba(60,30,10,0.35)'; x.lineWidth = 2; for (let i = 0; i < 14; i++) { const y0 = i * 9 + rng() * 4; x.beginPath(); x.moveTo(0, y0); for (let k = 1; k <= 8; k++) x.lineTo(k * 16, y0 + Math.sin(k + i) * 2.5); x.stroke(); } x.fillStyle = 'rgba(60,30,10,0.4)'; x.beginPath(); x.ellipse(80, 50, 6, 3, 0, 0, TAU); x.fill(); break;
      case 'swoosh': { const g = x.createLinearGradient(0, 0, 128, 0); g.addColorStop(0, '#c83a2a'); g.addColorStop(0.5, '#ff8a2a'); g.addColorStop(1, '#ffd84a'); x.fillStyle = g; x.beginPath(); x.moveTo(0, 50); x.bezierCurveTo(40, 40, 80, 70, 128, 44); x.lineTo(128, 60); x.bezierCurveTo(80, 86, 40, 56, 0, 66); x.fill(); x.fillStyle = '#6a2a6a'; x.beginPath(); x.moveTo(0, 72); x.bezierCurveTo(40, 62, 80, 92, 128, 66); x.lineTo(128, 74); x.bezierCurveTo(80, 100, 40, 70, 0, 80); x.fill(); break; }
      case 'canvas': x.strokeStyle = 'rgba(0,0,0,0.12)'; x.lineWidth = 1; for (let i = 0; i < 64; i++) { x.beginPath(); x.moveTo(i * 2, 0); x.lineTo(i * 2, 128); x.stroke(); } x.strokeStyle = 'rgba(255,255,255,0.1)'; for (let i = 0; i < 64; i++) { x.beginPath(); x.moveTo(0, i * 2); x.lineTo(128, i * 2); x.stroke(); } break;
      case 'sequin': for (let j = 0; j < 12; j++) for (let i = 0; i < 12; i++) { const b = rng(); x.fillStyle = b > 0.85 ? 'rgba(255,255,255,0.95)' : `rgba(255,255,255,${0.15 + b * 0.3})`; x.beginPath(); x.arc(i * 11 + (j % 2) * 5 + 4, j * 11 + 4, 4, 0, TAU); x.fill(); } break;
      case 'leopard': for (let i = 0; i < 40; i++) { const px = rng() * 128, py = rng() * 128, r = 4 + rng() * 5; x.fillStyle = 'rgba(40,20,10,0.7)'; x.beginPath(); x.ellipse(px, py, r, r * 0.8, rng() * 3, 0, TAU); x.fill(); x.fillStyle = 'rgba(160,90,30,0.6)'; x.beginPath(); x.ellipse(px, py, r * 0.5, r * 0.4, 0, 0, TAU); x.fill(); } break;
      case 'flames': for (let i = 0; i < 6; i++) { const bx = i * 22 + 4; const g = x.createLinearGradient(0, 128, 0, 20); g.addColorStop(0, '#ff3a1a'); g.addColorStop(0.6, '#ffa020'); g.addColorStop(1, '#ffe24a'); x.fillStyle = g; x.beginPath(); x.moveTo(bx, 128); x.quadraticCurveTo(bx - 6, 70, bx + 10, 30 + rng() * 30); x.quadraticCurveTo(bx + 12, 80, bx + 22, 128); x.fill(); } break;
      case 'denim': x.strokeStyle = 'rgba(255,255,255,0.07)'; x.lineWidth = 1; for (let i = -128; i < 128; i += 3) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 128, 128); x.stroke(); } break;
      case 'rainbow': ['#ff3b5c', '#ff8a2a', '#ffe24a', '#7aff5a', '#38c8ff', '#9a6bff'].forEach((c, i) => { x.fillStyle = c; x.fillRect(0, i * 21.4, 128, 22); }); break;
    }
    x.restore();
  },
  paintIcon(x, X, Y, name) {
    x.save(); x.translate(X + 64, Y + 64);
    const lw = 6;
    x.lineJoin = 'round'; x.lineCap = 'round';
    const outline = () => { x.strokeStyle = 'rgba(20,12,30,0.9)'; x.lineWidth = lw; x.stroke(); };
    switch (name) {
      case 'heart': x.fillStyle = '#ff5fb8'; x.beginPath(); x.moveTo(0, 40); x.bezierCurveTo(-60, 0, -36, -50, 0, -18); x.bezierCurveTo(36, -50, 60, 0, 0, 40); x.closePath(); outline(); x.fill(); x.fillStyle = '#ffd0ec'; x.beginPath(); x.ellipse(-20, -14, 8, 5, -0.6, 0, TAU); x.fill(); break;
      case 'k': x.fillStyle = '#9a7bff'; x.beginPath(); x.arc(0, 0, 46, 0, TAU); outline(); x.fill(); x.fillStyle = '#ffffff'; x.font = `64px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('K', 0, 4); break;
      case 'flake': x.strokeStyle = '#ffffff'; x.lineWidth = 9; for (let i = 0; i < 6; i++) { x.save(); x.rotate(i * Math.PI / 3); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -44); x.moveTo(0, -26); x.lineTo(-12, -38); x.moveTo(0, -26); x.lineTo(12, -38); x.stroke(); x.restore(); } x.fillStyle = '#c8e8ff'; x.beginPath(); x.arc(0, 0, 8, 0, TAU); x.fill(); break;
      case 'tab': x.fillStyle = '#38f2ff'; x.fillRect(-40, -40, 80, 80); x.strokeStyle = '#1a1030'; x.lineWidth = 5; x.strokeRect(-40, -40, 80, 80); x.fillStyle = '#ffe24a'; x.beginPath(); x.arc(0, 0, 26, 0, TAU); x.fill(); x.fillStyle = '#1a1030'; x.beginPath(); x.arc(-9, -6, 4, 0, TAU); x.arc(9, -6, 4, 0, TAU); x.fill(); x.lineWidth = 4; x.beginPath(); x.arc(0, 2, 14, 0.3, Math.PI - 0.3); x.stroke(); break;
      case 'shroom': x.fillStyle = '#f4ead8'; x.fillRect(-12, -4, 24, 44); x.fillStyle = '#ff5a2a'; x.beginPath(); x.ellipse(0, -8, 48, 34, 0, Math.PI, TAU); x.closePath(); outline(); x.fill(); x.fillStyle = '#ffffff'; [[-24, -20, 8], [6, -30, 7], [26, -14, 6]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, TAU); x.fill(); }); break;
      case 'leaf': x.fillStyle = '#5ad84a'; for (let i = -3; i <= 3; i++) { x.save(); x.rotate(i * 0.42); x.beginPath(); x.ellipse(0, -26 + Math.abs(i) * 4, 8, 30 - Math.abs(i) * 5, 0, 0, TAU); x.fill(); x.restore(); } x.fillStyle = '#2a8a2a'; x.fillRect(-2, 0, 4, 40); break;
      case 'toad': x.fillStyle = '#c8a040'; x.beginPath(); x.ellipse(0, 10, 44, 30, 0, 0, TAU); outline(); x.fill(); x.fillStyle = '#e8d070'; x.beginPath(); x.arc(-22, -14, 12, 0, TAU); x.arc(22, -14, 12, 0, TAU); x.fill(); x.fillStyle = '#1a1010'; x.beginPath(); x.arc(-22, -14, 5, 0, TAU); x.arc(22, -14, 5, 0, TAU); x.fill(); x.fillStyle = '#8a6a20'; [[-10, 14], [12, 20], [0, 0]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 5, 0, TAU); x.fill(); }); break;
      case 'bottle': x.fillStyle = '#3a9a3a'; x.beginPath(); x.moveTo(-8, -48); x.lineTo(8, -48); x.lineTo(8, -22); x.quadraticCurveTo(22, -14, 22, 0); x.lineTo(22, 44); x.lineTo(-22, 44); x.lineTo(-22, 0); x.quadraticCurveTo(-22, -14, -8, -22); x.closePath(); outline(); x.fill(); x.fillStyle = '#f4ead8'; x.fillRect(-18, 2, 36, 24); x.fillStyle = '#c83a2a'; x.font = `14px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.fillText('XXX', 0, 20); break;
      case 'drop': x.fillStyle = '#5ad0ff'; x.beginPath(); x.moveTo(0, -48); x.quadraticCurveTo(38, 6, 30, 22); x.arc(0, 18, 31, 0.1, Math.PI - 0.1); x.quadraticCurveTo(-38, 6, 0, -48); outline(); x.fill(); x.fillStyle = '#e0f6ff'; x.beginPath(); x.ellipse(-12, 14, 6, 10, 0.3, 0, TAU); x.fill(); break;
      case 'ticket': x.fillStyle = '#ffd84a'; x.fillRect(-52, -30, 104, 60); x.strokeStyle = '#a06a10'; x.lineWidth = 4; x.setLineDash([6, 5]); x.strokeRect(-44, -22, 88, 44); x.setLineDash([]); x.fillStyle = '#a0400a'; x.font = `20px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ADMIT 1', 0, -4); x.font = `11px ${FONT_DISPLAY}`; x.fillText('★ BURN ★', 0, 14); break;
      case 'map': x.fillStyle = '#e8d8b0'; x.beginPath(); x.moveTo(-48, -36); x.lineTo(-16, -44); x.lineTo(16, -36); x.lineTo(48, -44); x.lineTo(48, 36); x.lineTo(16, 44); x.lineTo(-16, 36); x.lineTo(-48, 44); x.closePath(); outline(); x.fill(); x.strokeStyle = '#ff4fd8'; x.lineWidth = 4; x.beginPath(); x.arc(0, 8, 26, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); x.beginPath(); x.arc(0, 8, 16, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); x.fillStyle = '#c83a2a'; x.beginPath(); x.arc(0, 8, 5, 0, TAU); x.fill(); break;
      case 'www': x.fillStyle = '#ff9ad8'; x.fillRect(-36, -46, 72, 92); x.strokeStyle = '#3a1030'; x.lineWidth = 4; x.strokeRect(-36, -46, 72, 92); x.fillStyle = '#3a1030'; x.font = `22px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('W', 0, -24); x.fillText('W', 0, 0); x.fillText('W', 0, 24); break;
      case 'token': {
        const g = x.createRadialGradient(-12, -14, 4, 0, 0, 50); g.addColorStop(0, '#fff2a0'); g.addColorStop(0.6, '#ffb020'); g.addColorStop(1, '#c86a10');
        x.fillStyle = g; x.beginPath(); x.arc(0, 0, 48, 0, TAU); x.fill(); x.strokeStyle = '#8a4a08'; x.lineWidth = 5; x.stroke();
        // stylised effigy-with-flame emblem (a generic figure, arms up)
        x.fillStyle = '#8a3a08'; x.beginPath(); x.moveTo(0, -30); x.lineTo(8, -18); x.lineTo(0, -8); x.lineTo(-8, -18); x.closePath(); x.fill();
        x.lineWidth = 6; x.strokeStyle = '#8a3a08'; x.beginPath(); x.moveTo(0, -8); x.lineTo(0, 16); x.moveTo(0, 16); x.lineTo(-12, 34); x.moveTo(0, 16); x.lineTo(12, 34); x.moveTo(-22, -26); x.lineTo(-8, -2); x.lineTo(8, -2); x.lineTo(22, -26); x.stroke();
        break;
      }
      case 'glowstick': x.rotate(0.6); x.fillStyle = '#7aff5a'; x.fillRect(-9, -44, 18, 88); x.fillStyle = '#e0ffd0'; x.fillRect(-4, -40, 6, 80); x.fillStyle = '#2a2a2a'; x.fillRect(-10, -48, 20, 8); break;
      case 'ziptie': x.strokeStyle = '#f4f4f0'; x.lineWidth = 6; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(-40 + i * 3, -30 + i * 6); x.quadraticCurveTo(0, -42 + i * 6, 40 + i * 3, -24 + i * 6); x.stroke(); } x.fillStyle = '#ff4fd8'; x.fillRect(-10, -30, 20, 40); break;
      case 'camera': x.fillStyle = '#2a2a34'; x.fillRect(-46, -26, 92, 60); x.fillStyle = '#4a4a5a'; x.fillRect(-20, -38, 40, 14); x.fillStyle = '#9ad0ff'; x.beginPath(); x.arc(0, 4, 20, 0, TAU); x.fill(); x.fillStyle = '#1a1a2a'; x.beginPath(); x.arc(0, 4, 11, 0, TAU); x.fill(); break;
    }
    x.restore();
  },
  paintPhoto(x, X, Y) {
    x.save(); x.translate(X, Y);
    x.fillStyle = '#f8f4ec'; x.fillRect(4, 4, 120, 152);
    const g = x.createLinearGradient(0, 12, 0, 120); g.addColorStop(0, '#3a1a5a'); g.addColorStop(0.6, '#ff7a5a'); g.addColorStop(1, '#ffb070');
    x.fillStyle = g; x.fillRect(12, 12, 104, 108);
    x.fillStyle = '#c88a6a'; x.fillRect(12, 104, 104, 16);
    try { if (typeof drawChinka === 'function') drawChinka(x, { x: 64, y: 118, scale: 1.55, t: 0.4, pose: 'wave', facing: 1 }); } catch (e) { /* art from another module */ }
    x.fillStyle = '#ff4f8a'; x.font = `14px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.fillText('♥ CHINKA ♥', 64, 142);
    x.restore();
  }
};

/* ---------------- sprite atlas (512 x 512, premultiplied, soft shapes) ---------------- */
const BURNS_SPRITES = {
  canvas: null, T: null, R: {},
  init() {
    if (this.canvas) return;
    const N = 512, c = makeCanvas(N, N), x = c.getContext('2d');
    this.canvas = c;
    const cell = 64;
    let slot = 0;
    const add = (name, fn, w, h) => {
      w = w || 1; h = h || 1;
      const cols = N / cell;
      let col = slot % cols, row = Math.floor(slot / cols);
      if (col + w > cols) { slot += cols - col; col = 0; row++; }
      const px = col * cell, py = row * cell, pw = w * cell, ph = h * cell;
      x.save(); x.beginPath(); x.rect(px, py, pw, ph); x.clip(); x.translate(px, py); fn(x, pw, ph); x.restore();
      this.R[name] = { u0: (px + 1) / N, v0: (py + 1) / N, u1: (px + pw - 1) / N, v1: (py + ph - 1) / N };
      slot += w;
      if (h > 1) slot += 0; // tall cells only used at row ends
    };
    const radial = (x, w, h, stops) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) / 2); stops.forEach(s => g.addColorStop(s[0], s[1])); x.fillStyle = g; x.fillRect(0, 0, w, h); };
    add('glow', (x, w, h) => radial(x, w, h, [[0, 'rgba(255,255,255,1)'], [0.18, 'rgba(255,255,255,0.75)'], [0.45, 'rgba(255,255,255,0.22)'], [1, 'rgba(255,255,255,0)']]));
    add('core', (x, w, h) => radial(x, w, h, [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,0.9)'], [0.7, 'rgba(255,255,255,0.3)'], [1, 'rgba(255,255,255,0)']]));
    add('shadow', (x, w, h) => radial(x, w, h, [[0, 'rgba(0,0,0,0.85)'], [0.55, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0)']]));
    add('puff', (x, w, h) => { const rng = mulberry32(5); for (let i = 0; i < 9; i++) { const px = w / 2 + (rng() - 0.5) * w * 0.4, py = h / 2 + (rng() - 0.5) * h * 0.4, r = w * (0.18 + rng() * 0.16); const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } });
    add('spark', (x, w, h) => { radial(x, w, h, [[0, 'rgba(255,255,255,1)'], [0.12, 'rgba(255,255,255,0.8)'], [0.3, 'rgba(255,255,255,0)']]); x.fillStyle = 'rgba(255,255,255,0.85)'; x.beginPath(); x.moveTo(w / 2, 2); x.lineTo(w / 2 + 3, h / 2); x.lineTo(w / 2, h - 2); x.lineTo(w / 2 - 3, h / 2); x.closePath(); x.fill(); x.beginPath(); x.moveTo(2, h / 2); x.lineTo(w / 2, h / 2 + 3); x.lineTo(w - 2, h / 2); x.lineTo(w / 2, h / 2 - 3); x.closePath(); x.fill(); });
    add('ring', (x, w, h) => { x.strokeStyle = 'rgba(255,255,255,1)'; x.lineWidth = 5; x.shadowColor = '#fff'; x.shadowBlur = 6; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 6, 0, TAU); x.stroke(); });
    add('flame', (x, w, h) => { const g = x.createRadialGradient(w / 2, h * 0.62, 2, w / 2, h * 0.55, w * 0.48); g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.35, 'rgba(255,190,60,0.95)'); g.addColorStop(0.7, 'rgba(255,80,20,0.6)'); g.addColorStop(1, 'rgba(255,40,10,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(w / 2, 2); x.quadraticCurveTo(w * 0.95, h * 0.6, w / 2, h - 2); x.quadraticCurveTo(w * 0.05, h * 0.6, w / 2, 2); x.fill(); });
    add('heart', (x, w, h) => { x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(w / 2, h * 0.85); x.bezierCurveTo(-w * 0.1, h * 0.4, w * 0.25, -h * 0.05, w / 2, h * 0.3); x.bezierCurveTo(w * 0.75, -h * 0.05, w * 1.1, h * 0.4, w / 2, h * 0.85); x.fill(); });
    add('square', (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(w * 0.2, h * 0.2, w * 0.6, h * 0.6); });
    add('star', (x, w, h) => { x.fillStyle = '#ffffff'; x.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? w * 0.2 : w * 0.48, a = i / 10 * TAU - Math.PI / 2; x.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } x.closePath(); x.fill(); });
    add('note', (x, w, h) => { x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(w * 0.35, h * 0.72, 10, 8, -0.4, 0, TAU); x.fill(); x.fillRect(w * 0.47, h * 0.18, 5, h * 0.55); x.beginPath(); x.moveTo(w * 0.47, h * 0.18); x.quadraticCurveTo(w * 0.8, h * 0.25, w * 0.75, h * 0.48); x.lineTo(w * 0.7, h * 0.46); x.quadraticCurveTo(w * 0.72, h * 0.3, w * 0.52, h * 0.3); x.fill(); });
    add('z', (x, w, h) => { x.fillStyle = '#ffffff'; x.font = `${h * 0.8}px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Z', w / 2, h / 2 + 2); });
    add('drop', (x, w, h) => { x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(w / 2, 4); x.quadraticCurveTo(w * 0.9, h * 0.6, w / 2, h - 6); x.quadraticCurveTo(w * 0.1, h * 0.6, w / 2, 4); x.fill(); });
    add('smoke', (x, w, h) => radial(x, w, h, [[0, 'rgba(255,255,255,0.55)'], [0.6, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]));
    add('streak', (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(w * 0.38, 0, w * 0.24, h); });
    add('beam', (x, w, h) => { const g = x.createLinearGradient(0, h, 0, 0); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(w * 0.42, h); x.lineTo(w * 0.58, h); x.lineTo(w, 0); x.lineTo(0, 0); x.closePath(); x.fill(); });
    add('bubble', (x, w, h) => { x.fillStyle = 'rgba(255,255,255,0.25)'; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 4, 0, TAU); x.fill(); x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 3; x.stroke(); x.fillStyle = 'rgba(255,255,255,0.9)'; x.beginPath(); x.ellipse(w * 0.36, h * 0.34, 7, 4, -0.6, 0, TAU); x.fill(); });
    add('cross', (x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(w * 0.42, h * 0.1, w * 0.16, h * 0.8); x.fillRect(w * 0.1, h * 0.42, w * 0.8, h * 0.16); });
    add('dot', (x, w, h) => { x.fillStyle = '#ffffff'; x.beginPath(); x.arc(w / 2, h / 2, w * 0.3, 0, TAU); x.fill(); });
    add('arrow', (x, w, h) => { x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(w / 2, h - 4); x.lineTo(w - 6, h * 0.45); x.lineTo(w * 0.66, h * 0.45); x.lineTo(w * 0.66, 4); x.lineTo(w * 0.34, 4); x.lineTo(w * 0.34, h * 0.45); x.lineTo(6, h * 0.45); x.closePath(); x.fill(); });
    add('warn', (x, w, h) => { x.strokeStyle = '#ffffff'; x.lineWidth = 7; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 6, 0, TAU); x.stroke(); x.lineWidth = 3; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 16, 0, TAU); x.stroke(); });
    this.T = { src: c, opts: { mips: true, premult: true }, tex: null, gen: -1 };
  }
};
const BURNS_TMP3 = [0, 0, 0];

/* ---------------- mesh builder ---------------- */
class BurnsMesh {
  constructor(cap) {
    this.cap = 0; this.nv = 0; this.alloc(cap || 2048);
    this.ind = [];
    this.M = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]);
    this.stack = [];
    this.c = [255, 255, 255]; this.e = 0; this.bone = 0; this.gloss = 0; this.lo = false;
    this.uvr = BURNS_ATLAS.white;
    this.bmin = [Infinity, Infinity, Infinity]; this.bmax = [-Infinity, -Infinity, -Infinity];
    this._t = new Float32Array(12);
  }
  alloc(n) {
    const buf = new ArrayBuffer(n * 24);
    if (this.buf) new Uint8Array(buf).set(new Uint8Array(this.buf, 0, this.nv * 24));
    this.buf = buf; this.f = new Float32Array(buf); this.i8 = new Int8Array(buf); this.u8 = new Uint8Array(buf); this.u16 = new Uint16Array(buf);
    this.cap = n;
  }
  /* ---- state ---- */
  color(c, e) { this.c = burnsRGB(c); if (e !== undefined) this.e = e; return this; }
  emissive(e) { this.e = e; return this; }
  setBone(b) { this.bone = b; return this; }
  push() { this.stack.push(this.M.slice(), this.c, this.e, this.bone, this.gloss); return this; }
  pop() { this.gloss = this.stack.pop(); this.bone = this.stack.pop(); this.e = this.stack.pop(); this.c = this.stack.pop(); this.M = this.stack.pop(); return this; }
  // specular shine for following geometry: 0 matte .. 3 glossy (sunglasses, paint, chrome)
  shine(g) { this.gloss = clamp(g | 0, 0, 3); return this; }
  identity() { this.M.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]); return this; }
  // M = M * T(x,y,z) * R(yaw,pitch,roll) * S
  tf(x, y, z, yaw, pitch, roll, sx, sy, sz) {
    BurnsM.a34Set(this._t, 0, x || 0, y || 0, z || 0, yaw || 0, pitch || 0, roll || 0, sx === undefined ? 1 : sx, sy === undefined ? (sx === undefined ? 1 : sx) : sy, sz === undefined ? (sx === undefined ? 1 : sx) : sz);
    const m = new Float32Array(12); BurnsM.a34Mul(m, 0, this.M, 0, this._t, 0); this.M = m;
    return this;
  }
  translate(x, y, z) { return this.tf(x, y, z); }
  rotY(a) { return this.tf(0, 0, 0, a); }
  /* ---- raw emit ---- */
  vert(x, y, z, nx, ny, nz, u, v) {
    if (this.nv >= this.cap) this.alloc(this.cap * 2);
    const i = this.nv++, f = this.f, b = i * 24;
    f[i * 6] = x; f[i * 6 + 1] = y; f[i * 6 + 2] = z;
    this.i8[b + 12] = Math.round(nx * 127); this.i8[b + 13] = Math.round(ny * 127); this.i8[b + 14] = Math.round(nz * 127);
    this.u8[b + 15] = (this.bone & 63) | (this.gloss << 6);
    const c = this.c; this.u8[b + 16] = c[0]; this.u8[b + 17] = c[1]; this.u8[b + 18] = c[2]; this.u8[b + 19] = Math.round(clamp(this.e, 0, 1) * 255);
    this.u16[i * 12 + 10] = Math.round(clamp(u, 0, 1) * 65535); this.u16[i * 12 + 11] = Math.round(clamp(v, 0, 1) * 65535);
    if (x < this.bmin[0]) this.bmin[0] = x; if (y < this.bmin[1]) this.bmin[1] = y; if (z < this.bmin[2]) this.bmin[2] = z;
    if (x > this.bmax[0]) this.bmax[0] = x; if (y > this.bmax[1]) this.bmax[1] = y; if (z > this.bmax[2]) this.bmax[2] = z;
    return i;
  }
  // transform local point
  tp(x, y, z, o) { const M = this.M; o[0] = M[0] * x + M[1] * y + M[2] * z + M[3]; o[1] = M[4] * x + M[5] * y + M[6] * z + M[7]; o[2] = M[8] * x + M[9] * y + M[10] * z + M[11]; return o; }
  // transform local normal by the inverse-transpose (cofactors) of M, so non-uniform scales shade correctly
  tn(x, y, z, o) {
    const M = this.M, a = M[0], b = M[1], c = M[2], d = M[4], e = M[5], f = M[6], g = M[8], h = M[9], i = M[10];
    const c00 = e * i - f * h, c01 = f * g - d * i, c02 = d * h - e * g;
    let nx = c00 * x + c01 * y + c02 * z, ny = (c * h - b * i) * x + (a * i - c * g) * y + (b * g - a * h) * z, nz = (b * f - c * e) * x + (c * d - a * f) * y + (a * e - b * d) * z;
    if (a * c00 + b * c01 + c * c02 < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const l = Math.hypot(nx, ny, nz) || 1; o[0] = nx / l; o[1] = ny / l; o[2] = nz / l; return o;
  }
  /* polygon in LOCAL coords (array of [x,y,z]); uvs optional array of [u,v];
     orient: optional local point inside the solid -> winding fixed to face away from it;
     normals: optional per-vertex local normals (soft shading) */
  poly(pts, uvs, orient, normals) {
    const n = pts.length; if (n < 3) return;
    const W = [];
    for (let i = 0; i < n; i++) W.push(this.tp(pts[i][0], pts[i][1], pts[i][2], [0, 0, 0]));
    // Newell normal (world)
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < n; i++) { const a = W[i], b = W[(i + 1) % n]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); }
    let l = Math.hypot(nx, ny, nz); if (l < 1e-12) return;
    nx /= l; ny /= l; nz /= l;
    let flip = false;
    if (orient) {
      const o = this.tp(orient[0], orient[1], orient[2], [0, 0, 0]);
      let cx = 0, cy = 0, cz = 0; for (const w of W) { cx += w[0]; cy += w[1]; cz += w[2]; } cx /= n; cy /= n; cz /= n;
      if ((cx - o[0]) * nx + (cy - o[1]) * ny + (cz - o[2]) * nz < 0) flip = true;
    }
    if (flip) { nx = -nx; ny = -ny; nz = -nz; }
    const base = this.nv, wr = BURNS_ATLAS.white, wu = (wr.u0 + wr.u1) / 2, wv = (wr.v0 + wr.v1) / 2;
    const tmp = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      const w = W[i];
      let vx = nx, vy = ny, vz = nz;
      if (normals) { this.tn(normals[i][0], normals[i][1], normals[i][2], tmp); vx = tmp[0]; vy = tmp[1]; vz = tmp[2]; }
      this.vert(w[0], w[1], w[2], vx, vy, vz, uvs ? uvs[i][0] : wu, uvs ? uvs[i][1] : wv);
    }
    for (let i = 1; i < n - 1; i++) {
      if (flip) this.ind.push(base, base + i + 1, base + i); else this.ind.push(base, base + i, base + i + 1);
    }
  }
  quadUV(p0, p1, p2, p3, reg) { // p0 BR, p1 TR, p2 TL, p3 BL (CCW from the front)
    this.poly([p0, p1, p2, p3], [[reg.u1, reg.v1], [reg.u1, reg.v0], [reg.u0, reg.v0], [reg.u0, reg.v1]]);
  }
  /* ---- primitives (all in local coords of the current transform) ---- */
  // opts: { uv: region, uvFaces: 'front'|'sides'|'all'|['px','nz',...], top: colour, bottom: colour, faces: skip mask string e.g. '-y' }
  box(cx, cy, cz, w, h, d, o) {
    o = o || {};
    const hx = w / 2, hy = h / 2, hz = d / 2, tx = o.taper ? o.taper : 1, tz = o.taperZ !== undefined ? o.taperZ : tx;
    const P = (sx, sy, sz) => [cx + sx * hx * (sy > 0 ? tx : 1), cy + sy * hy, cz + sz * hz * (sy > 0 ? tz : 1)];
    const p000 = P(-1, -1, -1), p100 = P(1, -1, -1), p010 = P(-1, 1, -1), p110 = P(1, 1, -1), p001 = P(-1, -1, 1), p101 = P(1, -1, 1), p011 = P(-1, 1, 1), p111 = P(1, 1, 1);
    const faces = {
      px: [p100, p110, p111, p101], nx: [p001, p011, p010, p000], py: [p010, p011, p111, p110],
      ny: [p000, p100, p101, p001], pz: [p101, p111, p011, p001], nz: [p000, p010, p110, p100]
    };
    const col = this.c;
    for (const k in faces) {
      if (o.skip && o.skip.indexOf(k) >= 0) continue;
      if (k === 'py' && o.top) this.c = burnsRGB(o.top); else if (k === 'ny' && o.bottom) this.c = burnsRGB(o.bottom); else if (o.side && k !== 'py' && k !== 'ny') this.c = burnsRGB(o.side); else this.c = col;
      const useUV = o.uv && (o.uvFaces === 'all' || (o.uvFaces === 'sides' && k !== 'py' && k !== 'ny') || (Array.isArray(o.uvFaces) ? o.uvFaces.indexOf(k) >= 0 : (o.uvFaces || 'pz') === k));
      if (useUV) { const r = o.uv; this.poly(faces[k], [[r.u1, r.v1], [r.u1, r.v0], [r.u0, r.v0], [r.u0, r.v1]]); }
      else this.poly(faces[k]);
    }
    this.c = col;
    return this;
  }
  // chamfered box (soft low-poly look); b = bevel size
  // beveled box -> now a rounded box with smooth normals (same footprint; `b` = edge radius). o: { top, bottom, side, uv }
  bbox(cx, cy, cz, w, h, d, b, o) {
    o = o || {};
    b = Math.min(b === undefined ? Math.min(w, h, d) * 0.18 : b * 1.2, w * 0.48, h * 0.48, d * 0.48);
    const col = this.c;
    if (o.side) this.c = burnsRGB(o.side);
    this.roundBox(cx, cy, cz, w, h, d, Math.max(0.004, b), { top: o.top ? burnsRGB(o.top) : (o.side ? col : null), bottom: o.bottom ? burnsRGB(o.bottom) : (o.side ? col : null), uv: o.uv && (o.uvFaces || 'pz') === 'pz' ? o.uv : null, k: o.k, m: o.m });
    this.c = col;
    return this;
  }
  // vertical cylinder / frustum / cone. y = bottom. o: { caps:true, smooth:true, top colour, uv, yaw0 }
  cyl(cx, y, cz, r0, r1, h, seg, o) {
    o = o || {}; seg = seg || 8;
    // rounder by default: smooth-shaded sides, and enough segments that big cylinders don't look faceted
    if (o.smooth === undefined) o = Object.assign({}, o, { smooth: true });
    if (!o.stripes && !this.lo) { const R = Math.max(r0, r1); if (R > 0.6) seg = Math.max(seg, 18); else if (R > 0.25) seg = Math.max(seg, 12); else if (R > 0.08) seg = Math.max(seg, 9); }
    const a0 = o.yaw0 || 0, col = this.c;
    const ring = (r, yy) => { const a = []; for (let i = 0; i < seg; i++) { const t = a0 + i / seg * TAU; a.push([cx + Math.sin(t) * r, yy, cz + Math.cos(t) * r]); } return a; };
    const B = ring(r0, y), T = ring(r1, y + h), ctr = [cx, y + h / 2, cz];
    for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg;
      if (o.stripes) this.c = burnsRGB(o.stripes[i % o.stripes.length]);
      if (o.smooth) {
        const t0 = a0 + i / seg * TAU, t1 = a0 + j / seg * TAU, k = (r0 - r1) / Math.max(h, 0.001);
        const n0 = [Math.sin(t0), k, Math.cos(t0)], n1 = [Math.sin(t1), k, Math.cos(t1)];
        if (r1 < 1e-5) this.poly([B[i], B[j], T[i]], null, ctr, [n0, n1, [(n0[0] + n1[0]) / 2, k, (n0[2] + n1[2]) / 2]]);
        else this.poly([B[i], B[j], T[j], T[i]], null, ctr, [n0, n1, n1, n0]);
      } else {
        if (r1 < 1e-5) this.poly([B[i], B[j], T[i]], null, ctr);
        else if (r0 < 1e-5) this.poly([B[i], T[j], T[i]], null, ctr);
        else this.poly([B[i], B[j], T[j], T[i]], null, ctr);
      }
    }
    this.c = col;
    if (o.caps !== false) {
      if (r1 > 1e-5) { if (o.top) this.c = burnsRGB(o.top); this.poly(T.slice(), null, [cx, y - 1, cz]); this.c = col; }
      if (r0 > 1e-5 && o.bottomCap !== false) this.poly(B.slice().reverse(), null, [cx, y + h + 1, cz]);
    }
    return this;
  }
  // cylinder between two points (struts, tubes, limbs)
  rod(x0, y0, z0, x1, y1, z1, r, seg, o) {
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, L = Math.hypot(dx, dy, dz);
    if (L < 1e-5) return this;
    const yaw = Math.atan2(dx, dz), pitch = Math.acos(clamp(dy / L, -1, 1));
    this.push(); this.tf(x0, y0, z0, yaw, pitch, 0);
    this.cyl(0, 0, 0, r, o && o.r1 !== undefined ? o.r1 : r, L, seg || 6, o);
    this.pop();
    return this;
  }
  // rectangular beam between two points (lattice, scaffolds)
  beam(x0, y0, z0, x1, y1, z1, w, h, o) {
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, L = Math.hypot(dx, dy, dz);
    if (L < 1e-5) return this;
    const yaw = Math.atan2(dx, dz), pitch = Math.atan2(-dy, Math.hypot(dx, dz));
    this.push(); this.tf((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, yaw, pitch, 0);
    this.box(0, 0, 0, w, h === undefined ? w : h, L, o);
    this.pop();
    return this;
  }
  // low-poly sphere (lat/long). o.smooth for soft shading, o.squash y scale
  sphere(cx, cy, cz, r, seg, rings, o) {
    o = o || {}; seg = seg || 8; rings = rings || 5;
    if (o.smooth === undefined) o = Object.assign({}, o, { smooth: true });
    if (!this.lo && r > 0.3) { seg = Math.max(seg, 14); rings = Math.max(rings, 8); }
    if (o.hemi && rings % 2) rings++;
    const sy = o.squash || 1, ctr = [cx, cy, cz];
    const P = (i, j) => { const t = i / seg * TAU, p = j / rings * Math.PI; return [cx + Math.sin(p) * Math.sin(t) * r, cy + Math.cos(p) * r * sy, cz + Math.sin(p) * Math.cos(t) * r]; };
    const N = (i, j) => { const t = i / seg * TAU, p = j / rings * Math.PI; return [Math.sin(p) * Math.sin(t), Math.cos(p), Math.sin(p) * Math.cos(t)]; };
    const top = o.hemi ? rings / 2 : rings;
    for (let j = 0; j < top; j++) for (let i = 0; i < seg; i++) {
      const i1 = (i + 1) % seg;
      if (o.colors) this.c = burnsRGB(o.colors[(i + j) % o.colors.length]);
      const q = j === 0 ? [P(i, 0), P(i, 1), P(i1, 1)] : j === rings - 1 ? [P(i, j), P(i, j + 1), P(i1, j)] : [P(i, j), P(i, j + 1), P(i1, j + 1), P(i1, j)];
      const nq = j === 0 ? [N(i, 0), N(i, 1), N(i1, 1)] : j === rings - 1 ? [N(i, j), N(i, j + 1), N(i1, j)] : [N(i, j), N(i, j + 1), N(i1, j + 1), N(i1, j)];
      this.poly(q, null, ctr, o.smooth ? nq : null);
    }
    if (o.hemi && o.cap !== false) { const ring = []; for (let i = seg - 1; i >= 0; i--) ring.push(P(i, top)); this.poly(ring, null, [cx, cy + r, cz]); }
    return this;
  }
  // capsule along Y: bottom at y0, total height h (soft shading)
  capsule(cx, y0, cz, r, h, seg) {
    seg = seg || 8;
    const rings = 3, yA = y0 + r, yB = y0 + Math.max(h - r, r);
    const R = [];
    for (let k = 0; k <= rings; k++) R.push([-Math.PI / 2 + k / rings * Math.PI / 2, yA]);
    for (let k = 0; k <= rings; k++) R.push([k / rings * Math.PI / 2, yB]);
    const ctr = [cx, (yA + yB) / 2, cz];
    const P = (i, a, yc) => { const t = i / seg * TAU; return [cx + Math.sin(t) * Math.cos(a) * r, yc + Math.sin(a) * r, cz + Math.cos(t) * Math.cos(a) * r]; };
    const N = (i, a) => { const t = i / seg * TAU; return [Math.sin(t) * Math.cos(a), Math.sin(a), Math.cos(t) * Math.cos(a)]; };
    for (let k = 0; k < R.length - 1; k++) {
      const a0 = R[k][0], c0 = R[k][1], a1 = R[k + 1][0], c1 = R[k + 1][1];
      if (a0 === a1 && c0 === c1) continue;
      for (let i = 0; i < seg; i++) {
        const i1 = (i + 1) % seg;
        if (k === 0) this.poly([P(i, a0, c0), P(i1, a1, c1), P(i, a1, c1)], null, ctr, [N(i, a0), N(i1, a1), N(i, a1)]);
        else if (k === R.length - 2) this.poly([P(i, a0, c0), P(i1, a0, c0), P(i, a1, c1)], null, ctr, [N(i, a0), N(i1, a0), N(i, a1)]);
        else this.poly([P(i, a0, c0), P(i1, a0, c0), P(i1, a1, c1), P(i, a1, c1)], null, ctr, [N(i, a0), N(i1, a0), N(i1, a1), N(i, a1)]);
      }
    }
    return this;
  }
  // geodesic dome (icosphere upper half), alternating facet shades
  dome(cx, y, cz, r, freq, o) {
    o = o || {};
    const t = (1 + Math.sqrt(5)) / 2;
    let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v => { const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; });
    let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    // rotate so a vertex is not at the top (more dome-like ring at the base)
    const subdiv = clamp(freq === undefined ? 2 : freq, 0, 3);
    for (let s = 0; s < subdiv; s++) {
      const NF = [], cache = {};
      const mid = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (cache[k] !== undefined) return cache[k]; const p = V[a], q = V[b]; let m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2]; const l = Math.hypot(...m); m = [m[0] / l, m[1] / l, m[2] / l]; V.push(m); cache[k] = V.length - 1; return cache[k]; };
      for (const f of F) { const a = mid(f[0], f[1]), b = mid(f[1], f[2]), c = mid(f[2], f[0]); NF.push([f[0], a, c], [f[1], b, a], [f[2], c, b], [a, b, c]); }
      F = NF;
    }
    const col = this.c, col2 = o.alt ? burnsRGB(o.alt) : [Math.round(col[0] * 0.86), Math.round(col[1] * 0.86), Math.round(col[2] * 0.86)];
    let k = 0;
    for (const f of F) {
      const a = V[f[0]], b = V[f[1]], c = V[f[2]];
      const my = (a[1] + b[1] + c[1]) / 3;
      if (my < -0.02) continue;
      const P = p => [cx + p[0] * r, y + Math.max(0, p[1]) * r, cz + p[2] * r];
      this.c = (k++ % 3 === 0) ? col2 : col;
      if (o.lights && k % 7 === 0) { this.c = burnsRGB(o.lights[k % o.lights.length]); this.e = 1; }
      this.poly([P(a), P(b), P(c)], null, [cx, y, cz]);
      this.e = o.e || 0;
    }
    this.c = col;
    return this;
  }
  // extrude a 2D polygon (XY plane, CCW) along +Z by depth (centred)
  extrude(poly, depth, o) {
    o = o || {};
    const hz = depth / 2, n = poly.length;
    let cx = 0, cy = 0; for (const p of poly) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
    const ctr = [cx, cy, 0];
    const front = poly.map(p => [p[0], p[1], hz]), back = poly.map(p => [p[0], p[1], -hz]).reverse();
    if (o.convex !== false) { this.poly(front, null, ctr); this.poly(back, null, ctr); }
    else { for (const tri of BurnsMesh.earcut(poly)) { this.poly(tri.map(i => [poly[i][0], poly[i][1], hz]), null, [cx, cy, -1e3]); this.poly(tri.map(i => [poly[i][0], poly[i][1], -hz]), null, [cx, cy, 1e3]); } }
    if (o.side) this.c = burnsRGB(o.side);
    for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; this.poly([[a[0], a[1], -hz], [b[0], b[1], -hz], [b[0], b[1], hz], [a[0], a[1], hz]], null, o.convex === false ? null : ctr); }
    return this;
  }
  static earcut(P) {
    const idx = P.map((_, i) => i), out = [];
    const area = (a, b, c) => (P[b][0] - P[a][0]) * (P[c][1] - P[a][1]) - (P[c][0] - P[a][0]) * (P[b][1] - P[a][1]);
    let guard = 0;
    while (idx.length > 3 && guard++ < 500) {
      let clipped = false;
      for (let i = 0; i < idx.length; i++) {
        const a = idx[(i + idx.length - 1) % idx.length], b = idx[i], c = idx[(i + 1) % idx.length];
        if (area(a, b, c) <= 0) continue;
        let inside = false;
        for (const j of idx) { if (j === a || j === b || j === c) continue; if (area(a, b, j) >= 0 && area(b, c, j) >= 0 && area(c, a, j) >= 0) { inside = true; break; } }
        if (inside) continue;
        out.push([a, b, c]); idx.splice(i, 1); clipped = true; break;
      }
      if (!clipped) break;
    }
    if (idx.length === 3) out.push(idx.slice());
    return out;
  }
  // a flat textured quad facing +Z in local space (signs, faces, decals), centred at (x,y,z)
  decal(x, y, z, w, h, reg, o) {
    o = o || {};
    const hw = w / 2, hh = h / 2;
    this.poly([[x + hw, y - hh, z], [x + hw, y + hh, z], [x - hw, y + hh, z], [x - hw, y - hh, z]], [[reg.u1, reg.v1], [reg.u1, reg.v0], [reg.u0, reg.v0], [reg.u0, reg.v1]]);
    if (o.both) this.poly([[x - hw, y - hh, z], [x - hw, y + hh, z], [x + hw, y + hh, z], [x + hw, y - hh, z]], [[reg.u1, reg.v1], [reg.u1, reg.v0], [reg.u0, reg.v0], [reg.u0, reg.v1]]);
    return this;
  }
  // flat ring on the XZ plane (pads, rugs), y = height
  disc(cx, y, cz, r, seg, o) {
    o = o || {}; seg = seg || 12;
    const pts = []; for (let i = 0; i < seg; i++) { const t = i / seg * TAU; pts.push([cx + Math.sin(t) * r, y, cz + Math.cos(t) * r]); }
    this.poly(pts, null, [cx, y - 1, cz]);
    if (o.both) this.poly(pts.slice().reverse(), null, [cx, y + 1, cz]);
    return this;
  }
  /* ================= smooth (rounded) primitives =================
     All emit shared vertices with smooth normals. m.lo = true builds a low-detail version
     (fewer segments) for LOD models. Per-vertex colour/emissive can be set from callbacks. */
  // indexed grid: cols x rows vertices from fn(i, j, out) -> out.p, out.n (local), optional out.uv, out.col, out.e
  grid(cols, rows, wrapU, fn, wrapV) {
    const base = this.nv, P = [0, 0, 0], N = [0, 0, 0], o = { p: [0, 0, 0], n: [0, 1, 0], uv: null, col: null, e: undefined };
    const wr = BURNS_ATLAS.white, wu = (wr.u0 + wr.u1) / 2, wv = (wr.v0 + wr.v1) / 2;
    const col0 = this.c, e0 = this.e;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      o.uv = null; o.col = null; o.e = undefined;
      fn(i, j, o);
      this.tp(o.p[0], o.p[1], o.p[2], P); this.tn(o.n[0], o.n[1], o.n[2], N);
      if (o.col) this.c = o.col; if (o.e !== undefined) this.e = o.e;
      this.vert(P[0], P[1], P[2], N[0], N[1], N[2], o.uv ? o.uv[0] : wu, o.uv ? o.uv[1] : wv);
      this.c = col0; this.e = e0;
    }
    // orientation: compare a middle quad's winding with its supplied normal, flip if needed
    const f = this.f, i8 = this.i8;
    let flip = false, decided = false;
    const qs = wrapU ? cols : cols - 1, qr = wrapV ? rows : rows - 1;
    for (let jj = Math.floor(qr / 2); jj < qr && !decided; jj++) for (let ii = 0; ii < qs && !decided; ii++) {
      const a = base + jj * cols + ii, b = base + jj * cols + (ii + 1) % cols, c = base + ((jj + 1) % rows) * cols + (ii + 1) % cols;
      const ax = f[a * 6], ay = f[a * 6 + 1], az = f[a * 6 + 2];
      const ux = f[b * 6] - ax, uy = f[b * 6 + 1] - ay, uz = f[b * 6 + 2] - az, vx = f[c * 6] - ax, vy = f[c * 6 + 1] - ay, vz = f[c * 6 + 2] - az;
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      if (nx * nx + ny * ny + nz * nz < 1e-14) continue;
      const sx = i8[a * 24 + 12] + i8[b * 24 + 12] + i8[c * 24 + 12], sy = i8[a * 24 + 13] + i8[b * 24 + 13] + i8[c * 24 + 13], sz = i8[a * 24 + 14] + i8[b * 24 + 14] + i8[c * 24 + 14];
      flip = nx * sx + ny * sy + nz * sz < 0; decided = true;
    }
    for (let j = 0; j < qr; j++) for (let i = 0; i < qs; i++) {
      const i1 = (i + 1) % cols, j1 = (j + 1) % rows;
      const a = base + j * cols + i, b = base + j * cols + i1, c = base + j1 * cols + i1, d = base + j1 * cols + i;
      if (flip) this.ind.push(a, c, b, a, d, c); else this.ind.push(a, b, c, a, c, d);
    }
    return this;
  }
  segs(hi, lo) { return this.lo ? (this.far && lo > 4 ? Math.max(4, Math.round(lo * 0.7)) : lo) : hi; }
  // ellipsoid. o: { seg, rings, theta0, theta1 (longitude range, 0 = +Z), phi0, phi1 (0 = top, PI = bottom), uvFn(x,y,z)->[u,v], colFn(x,y,z,nx,ny,nz)->colour }
  ellipsoid(cx, cy, cz, rx, ry, rz, o) {
    o = o || {};
    const seg = o.seg || this.segs(14, 8), rings = o.rings || this.segs(10, 6);
    const t0 = o.theta0 === undefined ? 0 : o.theta0, t1 = o.theta1 === undefined ? TAU : o.theta1, full = o.theta0 === undefined && o.theta1 === undefined;
    const p0 = o.phi0 || 0, p1 = o.phi1 === undefined ? Math.PI : o.phi1;
    const cols = full ? seg : seg + 1;
    this.grid(cols, rings + 1, full, (i, j, out) => {
      const th = t0 + (t1 - t0) * i / seg, ph = p0 + (p1 - p0) * j / rings;
      const sx = Math.sin(ph) * Math.sin(th), sy = Math.cos(ph), sz = Math.sin(ph) * Math.cos(th);
      const x = sx * rx, y = sy * ry, z = sz * rz;
      out.p[0] = cx + x; out.p[1] = cy + y; out.p[2] = cz + z;
      let nx = sx / rx, ny = sy / ry, nz = sz / rz; const l = Math.hypot(nx, ny, nz) || 1; out.n[0] = nx / l; out.n[1] = ny / l; out.n[2] = nz / l;
      if (o.uvFn) out.uv = o.uvFn(x, y, z, out.n);
      if (o.colFn) { const c = o.colFn(x, y, z, out.n); if (c) out.col = burnsRGB(c); }
    });
    return this;
  }
  // surface of revolution around local Y. profile: [[r, y, colour?, emissive?], ...] (bottom -> top).
  // Repeat a point to make a hard crease. o: { seg, sx, sz (elliptical section), theta0, theta1, rMod(theta, t)->scale,
  //   uv: region (u around, ping-pong mirrored uvRepeat times (default 2), v along), caps, flip (face inward: linings) }
  lathe(profile, o) {
    o = o || {};
    // orientation-proof: open profiles may be given top -> bottom, closed loops either way round;
    // normalise to bottom -> top / counter-clockwise in (r, y) so the surface always faces outward
    {
      const N0 = profile.length, F = profile[0], L = profile[N0 - 1];
      if (N0 > 2 && Math.abs(F[0] - L[0]) < 1e-6 && Math.abs(F[1] - L[1]) < 1e-6) { let a2 = 0; for (let k = 0; k < N0 - 1; k++) a2 += profile[k][0] * profile[k + 1][1] - profile[k + 1][0] * profile[k][1]; if (a2 < 0) profile = profile.slice().reverse(); }
      else if (F[1] > L[1] + 1e-9) profile = profile.slice().reverse();
    }
    const seg = o.seg || this.segs(14, 8), n = profile.length;
    const full = o.theta0 === undefined && o.theta1 === undefined, t0 = o.theta0 || 0, t1 = o.theta1 === undefined ? TAU : o.theta1;
    const sx = o.sx || 1, sz = o.sz || 1;
    // profile normals: averaged unit tangents; a repeated point makes a hard crease; axis points face +/-Y
    const pn = [], same = (U, V) => Math.abs(U[0] - V[0]) < 1e-6 && Math.abs(U[1] - V[1]) < 1e-6;
    for (let k = 0; k < n; k++) {
      const P = profile[k], A = k > 0 ? profile[k - 1] : null, B = k < n - 1 ? profile[k + 1] : null;
      if (P[0] < 1e-6 && (k === 0 || k === n - 1)) { const up = k === 0 ? !(B && B[1] >= P[1] - 1e-9) : !!(A && A[1] <= P[1] + 1e-9); pn.push([0, up ? 1 : -1]); continue; }
      const prevSame = A && same(A, P), nextSame = B && same(B, P);
      let dr = 0, dy = 0;
      const addT = (U, V) => { const tr = V[0] - U[0], ty = V[1] - U[1], l = Math.hypot(tr, ty) || 1; dr += tr / l; dy += ty / l; };
      if (prevSame) { if (B) addT(P, B); }
      else if (nextSame) { if (A) addT(A, P); }
      else { if (A) addT(A, P); if (B) addT(P, B); }
      const l = Math.hypot(dr, dy) || 1; pn.push([dy / l, -dr / l]);
    }
    let len = 0; const acc = [0]; for (let k = 1; k < n; k++) { len += Math.hypot(profile[k][0] - profile[k - 1][0], profile[k][1] - profile[k - 1][1]); acc.push(len); }
    const cols = full ? seg : seg + 1;
    this.grid(cols, n, full, (i, j, out) => {
      const th = t0 + (t1 - t0) * i / seg, P = profile[j], m = o.rMod ? o.rMod(th, j / (n - 1)) : 1;
      const r = P[0] * m, s = Math.sin(th), c = Math.cos(th);
      out.p[0] = r * s * sx; out.p[1] = P[1]; out.p[2] = r * c * sz;
      let nx = pn[j][0] * s / sx, ny = pn[j][1], nz = pn[j][0] * c / sz; const l = (Math.hypot(nx, ny, nz) || 1) * (o.flip ? -1 : 1);
      out.n[0] = nx / l; out.n[1] = ny / l; out.n[2] = nz / l;
      if (P[2]) out.col = burnsRGB(P[2]);
      if (P[3] !== undefined) out.e = P[3];
      if (o.uv) { const R = o.uv, ur = o.uvRepeat || (full ? 2 : 1), tt = ((i / seg) * ur) % 2; out.uv = [lerp(R.u0, R.u1, tt <= 1 ? tt : 2 - tt), lerp(R.v0, R.v1, clamp(len ? acc[j] / len : 0, 0, 1))]; }
    });
    if (o.caps) {
      // flat caps where the profile ends away from the axis
      for (const k of [0, n - 1]) { const P = profile[k]; if (P[0] < 1e-5) continue; const pts = []; for (let i = 0; i < seg; i++) { const th = t0 + (t1 - t0) * i / seg; pts.push([P[0] * Math.sin(th) * sx, P[1], P[0] * Math.cos(th) * sz]); } if (k === 0) pts.reverse(); this.poly(pts, null, [0, P[1] + (k === 0 ? 1 : -1), 0]); }
    }
    return this;
  }
  // tapered capsule (limb) between two points, radii r0 -> r1. o: { seg, uv: region (wraps), uvRepeat, ends: false (open tube) }
  limb(x0, y0, z0, x1, y1, z1, r0, r1, o) {
    o = o || {};
    const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, L = Math.hypot(dx, dy, dz); if (L < 1e-5) return this;
    const yaw = Math.atan2(dx, dz), pitch = Math.acos(clamp(dy / L, -1, 1));
    const k = this.segs(3, 2), prof = [];
    if (o.ends !== false) for (let i = 0; i <= k; i++) { const a = -Math.PI / 2 + i / k * Math.PI / 2; prof.push([r0 * Math.cos(a), r0 * Math.sin(a)]); }
    else prof.push([r0, 0]);
    const mid = o.mid || 0; if (mid) prof.push([lerp(r0, r1, 0.5) * (1 + mid), L * 0.5]);
    if (o.ends !== false) for (let i = 0; i <= k; i++) { const a = i / k * Math.PI / 2; prof.push([r1 * Math.cos(a), L + r1 * Math.sin(a)]); }
    else prof.push([r1, L]);
    this.push(); this.tf(x0, y0, z0, yaw, pitch, 0);
    this.lathe(prof, { seg: o.seg || this.segs(10, 6), uv: o.uv, uvRepeat: o.uvRepeat, sx: o.sx, sz: o.sz });
    this.pop();
    return this;
  }
  // rounded box (Minkowski box + sphere): flat faces, round edges and corners. r = edge radius
  roundBox(cx, cy, cz, w, h, d, r, o) {
    o = o || {};
    r = Math.max(0.0005, Math.min(r === undefined ? Math.min(w, h, d) * 0.2 : r, w / 2, h / 2, d / 2));
    const ix = w / 2 - r, iy = h / 2 - r, iz = d / 2 - r;
    const k = o.k || this.segs(2, 1), mR = o.m || this.segs(2, 1);
    const cols = 4 * (k + 1), rows = 2 * (mR + 1);
    const tTop = o.top ? (Array.isArray(o.top) ? o.top : burnsRGB(o.top)) : null, tBot = o.bottom ? (Array.isArray(o.bottom) ? o.bottom : burnsRGB(o.bottom)) : null;
    const uvR = o.uv, uvFace = o.uvFace || 'pz';
    this.grid(cols, rows, true, (i, j, out) => {
      const q = Math.floor(i / (k + 1)), lon = (q + (i % (k + 1)) / k) * Math.PI / 2;
      const top = j < mR + 1, lat = top ? (j / mR) * Math.PI / 2 : Math.PI / 2 + ((j - mR - 1) / mR) * Math.PI / 2;
      const nx = Math.sin(lat) * Math.cos(lon), ny = Math.cos(lat), nz = Math.sin(lat) * Math.sin(lon);
      const sx = (q === 0 || q === 3) ? 1 : -1, sz = (q === 0 || q === 1) ? 1 : -1, sy = top ? 1 : -1;
      const x = sx * ix + r * nx, y = sy * iy + r * ny, z = sz * iz + r * nz;
      out.p[0] = cx + x; out.p[1] = cy + y; out.p[2] = cz + z; out.n[0] = nx; out.n[1] = ny; out.n[2] = nz;
      if (tTop && ny > 0.7) out.col = tTop; else if (tBot && ny < -0.7) out.col = tBot;
    });
    // flat top and bottom: the first/last rows are the four face corners
    const base = this.nv - cols * rows, K = k + 1, bot = base + (rows - 1) * cols;
    this.quadIdx(base, base + K, base + 2 * K, base + 3 * K);
    this.quadIdx(bot, bot + K, bot + 2 * K, bot + 3 * K);
    // a texture (o.uv) goes on the flat +Z face as a decal, so it never smears around the edges
    if (uvR && uvFace === 'pz') this.decal(cx, cy, cz + d / 2 + 0.002, Math.max(0.01, w - r * 1.1), Math.max(0.01, h - r * 1.1), uvR);
    return this;
  }
  // two triangles over existing vertices a,b,c,d (in ring order), wound to face along vertex a's normal
  quadIdx(a, b, c, d) {
    const f = this.f, i8 = this.i8;
    const ux = f[b * 6] - f[a * 6], uy = f[b * 6 + 1] - f[a * 6 + 1], uz = f[b * 6 + 2] - f[a * 6 + 2];
    const vx = f[c * 6] - f[a * 6], vy = f[c * 6 + 1] - f[a * 6 + 1], vz = f[c * 6 + 2] - f[a * 6 + 2];
    const s = (uy * vz - uz * vy) * i8[a * 24 + 12] + (uz * vx - ux * vz) * i8[a * 24 + 13] + (ux * vy - uy * vx) * i8[a * 24 + 14];
    if (s >= 0) this.ind.push(a, b, c, a, c, d); else this.ind.push(a, c, b, a, d, c);
    return this;
  }
  // torus around local Y (ring in the XZ plane). R = ring radius, r = tube radius
  torus(cx, cy, cz, R, r, o) {
    o = o || {};
    const seg = o.seg || this.segs(16, 10), tseg = o.tseg || this.segs(8, 5), sy = o.sy || 1;
    this.grid(seg, tseg, true, (i, j, out) => {
      const th = i / seg * TAU, ph = j / tseg * TAU, cp = Math.cos(ph), sp = Math.sin(ph);
      out.p[0] = cx + (R + r * cp) * Math.sin(th); out.p[1] = cy + r * sp * sy; out.p[2] = cz + (R + r * cp) * Math.cos(th);
      out.n[0] = cp * Math.sin(th); out.n[1] = sp / sy; out.n[2] = cp * Math.cos(th);
    }, true);
    return this;
  }
  // cylinder with rounded top/bottom edges (barrels, drums, posts). y = bottom
  roundCyl(cx, y, cz, rad, h, edge, o) {
    o = o || {};
    const e = Math.min(edge === undefined ? rad * 0.25 : edge, rad * 0.9, h / 2), k = this.segs(3, 1), prof = [[0, 0]];
    for (let i = 0; i <= k; i++) { const a = -Math.PI / 2 + i / k * Math.PI / 2; prof.push([rad - e + e * Math.cos(a), e + e * Math.sin(a)]); }
    for (let i = 0; i <= k; i++) { const a = i / k * Math.PI / 2; prof.push([rad - e + e * Math.cos(a), h - e + e * Math.sin(a)]); }
    prof.push([0, h]);
    this.push(); this.tf(cx, y, cz); this.lathe(prof, { seg: o.seg || this.segs(14, 8), sx: o.sx, sz: o.sz, uv: o.uv }); this.pop();
    return this;
  }
  // smooth sphere shortcut
  ball(cx, cy, cz, r, o) { return this.ellipsoid(cx, cy, cz, r, r, r, o); }
  // parametric surface: fn(u, v, out[3]) for u, v in 0..1 (local coords); smooth normals from finite differences.
  // o: { wrapU, wrapV, out: true | [x,y,z] (normals face away from the centroid / that point), flip, colFn(u,v), uvFn(u,v) }
  surf(nu, nv, fn, o) {
    o = o || {};
    const cols = o.wrapU ? nu : nu + 1, rows = o.wrapV ? nv : nv + 1, n = cols * rows;
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), t = [0, 0, 0], A = [0, 0, 0], Bp = [0, 0, 0], C = [0, 0, 0], D = [0, 0, 0];
    const eu = 0.35 / nu, ev = 0.35 / nv, cu = u => o.wrapU ? u : clamp(u, 0, 1), cv = v => o.wrapV ? v : clamp(v, 0, 1);
    let mx = 0, my = 0, mz = 0;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const u = i / nu, v = j / nv, k = (j * cols + i) * 3;
      fn(u, v, t); P[k] = t[0]; P[k + 1] = t[1]; P[k + 2] = t[2]; mx += t[0]; my += t[1]; mz += t[2];
      let nx = 0, ny = 0, nz = 0;
      for (let tr = 0; tr < 4; tr++) {
        const vv = tr === 0 ? v : cv(v + (v < 0.5 ? 1 : -1) * ev * tr), uu = tr === 0 ? u : cu(u + (u < 0.5 ? 1 : -1) * eu * tr * 0.5);
        fn(cu(uu + eu), vv, A); fn(cu(uu - eu), vv, Bp); fn(uu, cv(vv + ev), C); fn(uu, cv(vv - ev), D);
        const ux = A[0] - Bp[0], uy = A[1] - Bp[1], uz = A[2] - Bp[2], vx = C[0] - D[0], vy = C[1] - D[1], vz = C[2] - D[2];
        nx = uy * vz - uz * vy; ny = uz * vx - ux * vz; nz = ux * vy - uy * vx;
        if (nx * nx + ny * ny + nz * nz > 1e-18) break;
      }
      const l = Math.hypot(nx, ny, nz) || 1; N[k] = nx / l; N[k + 1] = ny / l; N[k + 2] = nz / l;
    }
    let sg = o.flip ? -1 : 1;
    if (o.out) {
      const Cx = o.out === true ? mx / n : o.out[0], Cy = o.out === true ? my / n : o.out[1], Cz = o.out === true ? mz / n : o.out[2];
      let dot = 0; for (let k = 0; k < n * 3; k += 3) dot += (P[k] - Cx) * N[k] + (P[k + 1] - Cy) * N[k + 1] + (P[k + 2] - Cz) * N[k + 2];
      if (dot < 0) sg = -sg;
    }
    this.grid(cols, rows, !!o.wrapU, (i, j, out) => {
      const k = (j * cols + i) * 3;
      out.p[0] = P[k]; out.p[1] = P[k + 1]; out.p[2] = P[k + 2]; out.n[0] = N[k] * sg; out.n[1] = N[k + 1] * sg; out.n[2] = N[k + 2] * sg;
      if (o.colFn) { const c = o.colFn(i / nu, j / nv); if (c) out.col = typeof c === 'string' ? burnsRGB(c) : c; }
      if (o.uvFn) out.uv = o.uvFn(i / nu, j / nv);
    }, !!o.wrapV);
    return this;
  }
  // merge another builder's vertices (already in world space) — used to combine prop meshes
  append(m) {
    const base = this.nv;
    while (this.nv + m.nv > this.cap) this.alloc(this.cap * 2);
    new Uint8Array(this.buf, this.nv * 24, m.nv * 24).set(new Uint8Array(m.buf, 0, m.nv * 24));
    this.nv += m.nv;
    for (const i of m.ind) this.ind.push(i + base);
    for (let k = 0; k < 3; k++) { this.bmin[k] = Math.min(this.bmin[k], m.bmin[k]); this.bmax[k] = Math.max(this.bmax[k], m.bmax[k]); }
    return this;
  }
  get empty() { return this.nv === 0; }
  // -> geometry for BurnsGL.geo(): {data, idx, count, bounds}
  geo() {
    if (this.nv > 65535) throw new Error('BurnsMesh too large: ' + this.nv + ' verts');
    return { data: this.buf.slice(0, this.nv * 24), idx: new Uint16Array(this.ind), count: this.ind.length, nv: this.nv, bounds: [this.bmin[0], this.bmin[1], this.bmin[2], this.bmax[0], this.bmax[1], this.bmax[2]], vbo: null, ibo: null, gen: -1 };
  }
}


/* ---------------- baked ambient occlusion ----------------
   Each object's own triangles (plus the ground under statics) are rasterised into a coarse occupancy grid,
   box-blurred, and every vertex reads how 'buried' the space just outside its surface is: dark corners,
   crevices, the gap under a shade or a couch, armpits, under the chin. Multiplies the vertex colour once at
   build time, so it costs nothing per frame. o: { joints (skinned rest pose, nb*3), ground(x,z), res, k } */
const BurnsAO = {
  _P: null, _G: null, _T: null,
  bake(buf, v0, v1, idx, i0, i1, o) {
    o = o || {};
    const n = v1 - v0; if (n < 8 || i1 - i0 < 6) return;
    const f = new Float32Array(buf), i8 = new Int8Array(buf), u8 = new Uint8Array(buf), J = o.joints;
    if (!this._P || this._P.length < n * 3) this._P = new Float32Array(Math.max(n * 3, 8192));
    const P = this._P;
    let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
    for (let k = 0; k < n; k++) {
      const i = v0 + k; let x = f[i * 6], y = f[i * 6 + 1], z = f[i * 6 + 2];
      if (J) { const b = (u8[i * 24 + 15] & 63) * 3; x += J[b]; y += J[b + 1]; z += J[b + 2]; }
      P[k * 3] = x; P[k * 3 + 1] = y; P[k * 3 + 2] = z;
      if (x < x0) x0 = x; if (y < y0) y0 = y; if (z < z0) z0 = z; if (x > x1) x1 = x; if (y > y1) y1 = y; if (z > z1) z1 = z;
    }
    const ext = Math.max(x1 - x0, y1 - y0, z1 - z0); if (!(ext > 0.04) || ext > 400) return;
    const pad = 3, CAP = 60;
    let cell = clamp(ext / (o.res || 34), 0.03, 0.75);
    cell = Math.max(cell, Math.max(x1 - x0, y1 - y0, z1 - z0) / (CAP - pad * 2));
    if (cell > (o.maxCell || 0.45)) return;   // huge merged meshes: too coarse to be worth it
    const nx = Math.ceil((x1 - x0) / cell) + pad * 2, ny = Math.ceil((y1 - y0) / cell) + pad * 2, nz = Math.ceil((z1 - z0) / cell) + pad * 2, N = nx * ny * nz;
    if (!this._G || this._G.length < N) { this._G = new Float32Array(N); this._T = new Float32Array(N); }
    const G = this._G, T = this._T; G.fill(0, 0, N);
    const gx0 = x0 - pad * cell, gy0 = y0 - pad * cell, gz0 = z0 - pad * cell, ic = 1 / cell;
    const mark = (x, y, z) => { const a = ((x - gx0) * ic) | 0, b = ((y - gy0) * ic) | 0, c = ((z - gz0) * ic) | 0; if (a >= 0 && b >= 0 && c >= 0 && a < nx && b < ny && c < nz) G[(b * nz + c) * nx + a] = 1; };
    for (let t = i0; t + 2 < i1; t += 3) {
      const a = idx[t] - v0, b = idx[t + 1] - v0, c = idx[t + 2] - v0;
      if (a < 0 || b < 0 || c < 0 || a >= n || b >= n || c >= n) continue;
      const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2], bx = P[b * 3] - ax, by = P[b * 3 + 1] - ay, bz = P[b * 3 + 2] - az, cx = P[c * 3] - ax, cy = P[c * 3 + 1] - ay, cz = P[c * 3 + 2] - az;
      const L = Math.max(Math.hypot(bx, by, bz), Math.hypot(cx, cy, cz), Math.hypot(cx - bx, cy - by, cz - bz));
      const st = Math.min(40, Math.ceil(L * ic * 1.4));
      if (st <= 1) { mark(ax, ay, az); mark(ax + bx, ay + by, az + bz); mark(ax + cx, ay + cy, az + cz); continue; }
      for (let s = 0; s <= st; s++) for (let r = 0; r <= st - s; r++) { const u = s / st, v = r / st; mark(ax + bx * u + cx * v, ay + by * u + cy * v, az + bz * u + cz * v); }
    }
    if (o.ground) for (let k = 0; k < nx; k++) for (let m = 0; m < nz; m++) {
      const gy = o.ground(gx0 + (k + 0.5) * cell, gz0 + (m + 0.5) * cell), top = Math.min(ny - 1, Math.floor((gy - gy0) * ic) - 1);
      for (let j = 0; j <= top; j++) G[(j * nz + m) * nx + k] = 1;
    }
    // separable 5-tap box blur along x, z, y
    const blur = (src, dst, sx, len, outer) => {
      for (let q = 0; q < N; q++) dst[q] = 0;
      for (let q = 0; q < N; q++) { const v = src[q]; if (!v) continue; const pos = Math.floor(q / sx) % len; for (let d = -2; d <= 2; d++) { const p2 = pos + d; if (p2 >= 0 && p2 < len) dst[q + d * sx] += v * 0.2; } }
      void outer;
    };
    blur(G, T, 1, nx); blur(T, G, nx * nz, ny); blur(G, T, nx, nz);
    const F = T, k0 = o.k === undefined ? 1 : o.k;
    const at = (a, b, c) => (a < 0 || b < 0 || c < 0 || a >= nx || b >= ny || c >= nz) ? 0 : F[(b * nz + c) * nx + a];
    for (let k = 0; k < n; k++) {
      const i = v0 + k, B = i * 24;
      if (u8[B + 19] > 110) continue;   // glowing surfaces stay bright
      const px = (P[k * 3] + i8[B + 12] / 127 * cell * 1.5 - gx0) * ic - 0.5, py = (P[k * 3 + 1] + i8[B + 13] / 127 * cell * 1.5 - gy0) * ic - 0.5, pz = (P[k * 3 + 2] + i8[B + 14] / 127 * cell * 1.5 - gz0) * ic - 0.5;
      const a = Math.floor(px), b = Math.floor(py), c = Math.floor(pz), fx = px - a, fy = py - b, fz = pz - c;
      const occ = ((at(a, b, c) * (1 - fx) + at(a + 1, b, c) * fx) * (1 - fz) + (at(a, b, c + 1) * (1 - fx) + at(a + 1, b, c + 1) * fx) * fz) * (1 - fy)
        + ((at(a, b + 1, c) * (1 - fx) + at(a + 1, b + 1, c) * fx) * (1 - fz) + (at(a, b + 1, c + 1) * (1 - fx) + at(a + 1, b + 1, c + 1) * fx) * fz) * fy;
      const ao = 1 - clamp((occ - 0.21) * 2.3, 0, 0.62) * k0;
      if (ao < 0.995) { u8[B + 16] = Math.round(u8[B + 16] * ao); u8[B + 17] = Math.round(u8[B + 17] * ao); u8[B + 18] = Math.round(u8[B + 18] * ao); }
    }
  },
  // rest-pose joint positions for a character model (bone origins: offsets summed along the parent chain)
  joints(body, parent, nb) {
    const J = new Float32Array(nb * 3), off = body.off, PAR = parent || BURNS_PARENT;
    for (let b = 0; b < nb; b++) { const o = off[b] || [0, 0, 0], p = PAR[b]; J[b * 3] = o[0] + (p >= 0 ? J[p * 3] : 0); J[b * 3 + 1] = o[1] + (p >= 0 ? J[p * 3 + 1] : 0); J[b * 3 + 2] = o[2] + (p >= 0 ? J[p * 3 + 2] : 0); }
    return J;
  }
};
