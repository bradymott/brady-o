/* ============================================================
   Brady Goes to Burning Man — shared kit for "The Temple" (id 12) and
   "The Workshops" (id 13).  Everything here is prefixed BW1213.
     BW1213.tex        custom textures painted into the per-world sign area
     BW1213.base       a cleared burner spec for hand-made characters
     custom gear       bw13mosaic, bw13fannypack, bw13flowercrown, bw13glasschain
     BW1213.M          rounded mesh helpers (cushions, lanterns, fabric
                       domes, striped tents, bells, cairns, a small plane…)
     BW1213 timers, quiet token award, sprite helpers
   New animations are registered as BURNS_ANIMS.bw1213_* .
   ============================================================ */

const BW1213 = {
  SURF: { y: 0, col: null },
  HAND: '"Noteworthy", "Bradley Hand", "Segoe Print", "Marker Felt", "Comic Neue", "Comic Sans MS", cursive',
  /* ---------------- timers (game time, paused with the game) ---------------- */
  after(S, sec, fn) { (S.timers || (S.timers = [])).push({ t: sec, fn }); },
  tick(S, dt) {
    if (!S.timers || !S.timers.length) return;
    for (const t of S.timers.slice()) { t.t -= dt; if (t.t <= 0 && !t.done) { t.done = true; try { t.fn(); } catch (e) { console.error(e); } } }
    S.timers = S.timers.filter(t => !t.done);
  },
  /* ---------------- custom textures ----------------
     Allocates a transparent block in the per-world sign area of the shared atlas and paints
     into it (premultiplied over the vertex colour like every decal). Call at the start of
     build() so the shelf layout is the same every visit. */
  tex(key, w, h, paint) {
    const reg = BURNS_ATLAS.sign('⁣' + key, { w, h, pad: 0, size: 6, fg: 'rgba(0,0,0,0)' });
    if (reg === BURNS_ATLAS.white || reg._bw) return reg;
    const x = BURNS_ATLAS.ctx;
    // the atlas may rasterise blocks smaller than asked (it packs signs at a fraction of their size):
    // paint in the requested w x h space and let the context scale it into the block we really got
    x.save(); x.beginPath(); x.rect(reg.px, reg.py, reg.pw, reg.ph); x.clip(); x.translate(reg.px, reg.py);
    x.clearRect(0, 0, reg.pw, reg.ph); x.scale(reg.pw / w, reg.ph / h);
    try { paint(x, w, h); } catch (e) { console.error(e); }
    x.restore();
    reg._bw = true;
    if (BURNS_ATLAS.T) BURNS_ATLAS.T.dirty = true;
    return reg;
  },
  // a sub-rectangle of a region (u, v, w, h in 0..1 of the region)
  sub(reg, u, v, w, h) {
    const du = reg.u1 - reg.u0, dv = reg.v1 - reg.v0;
    return { u0: reg.u0 + du * u, v0: reg.v0 + dv * v, u1: reg.u0 + du * (u + w), v1: reg.v0 + dv * (v + h), aspect: (reg.aspect || 1) * w / h };
  },
  /* ---------------- painters ---------------- */
  // gentle handwritten messages, doodles, taped notes and photos (all invented, generic)
  MSGS: ['miss you', 'love you always', 'thank you', 'see you in the dust', 'for Dad', 'Grandma Rose ♥', 'my best friend', 'you\'d love it here',
    'until next year', 'rest easy, Max', 'I forgive you', 'I forgive me', 'safe travels', 'always with me', 'we danced', 'ride on', 'dear Mom',
    'Sam ♥ Jo', 'home', 'keep shining', 'for every dog I loved', 'go gently', 'I\'ll carry you', 'still laughing at your jokes', 'sunrise for you',
    'for Ellie', 'Theo, we made it', 'you were here', 'letting go', 'thank you for everything', 'little brother', 'Ana ♥', 'one more dance', 'to the old me'],
  paintMessages(x, w, h, seed) {
    const r = mulberry32(seed || 7);
    const inks = ['rgba(24,18,30,0.86)', 'rgba(30,40,110,0.82)', 'rgba(90,20,70,0.8)', 'rgba(140,30,40,0.78)', 'rgba(20,70,60,0.8)'];
    // taped paper notes + photos first (underneath the writing)
    for (let i = 0; i < 9; i++) {
      const px = r.range(4, w - 44), py = r.range(4, h - 50), pw = r.range(26, 44), ph = r.range(30, 46), a = r.range(-0.25, 0.25);
      x.save(); x.translate(px + pw / 2, py + ph / 2); x.rotate(a);
      if (r() < 0.5) {
        x.fillStyle = r.pick(['rgba(255,244,190,0.95)', 'rgba(255,210,220,0.95)', 'rgba(210,235,255,0.95)', 'rgba(250,250,240,0.95)']);
        x.fillRect(-pw / 2, -ph / 2, pw, ph);
        x.strokeStyle = 'rgba(40,30,50,0.6)'; x.lineWidth = 1;
        for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(-pw / 2 + 4, -ph / 2 + 8 + k * 7); for (let q = 0; q < 6; q++) x.lineTo(-pw / 2 + 4 + q * (pw - 8) / 5, -ph / 2 + 8 + k * 7 + r.range(-1.5, 1.5)); x.stroke(); }
      } else {
        x.fillStyle = 'rgba(250,248,240,0.97)'; x.fillRect(-pw / 2, -ph / 2, pw, ph);
        const gr = x.createLinearGradient(0, -ph / 2, 0, ph / 2); const hue = r.int(0, 360);
        gr.addColorStop(0, `hsla(${hue},55%,62%,1)`); gr.addColorStop(1, `hsla(${(hue + 40) % 360},55%,38%,1)`);
        x.fillStyle = gr; x.fillRect(-pw / 2 + 3, -ph / 2 + 3, pw - 6, ph - 12);
        x.fillStyle = 'rgba(30,20,30,0.75)'; x.beginPath(); x.arc(0, -ph / 2 + ph * 0.38, pw * 0.13, 0, TAU); x.fill(); x.fillRect(-pw * 0.18, -ph / 2 + ph * 0.48, pw * 0.36, ph * 0.22);
      }
      x.fillStyle = 'rgba(240,230,200,0.6)'; x.fillRect(-7, -ph / 2 - 3, 14, 6);
      x.restore();
    }
    // handwriting
    for (let i = 0; i < 26; i++) {
      const msg = r.pick(this.MSGS), sz = r.range(13, 24);
      x.save(); x.translate(r.range(6, w - 60), r.range(16, h - 6)); x.rotate(r.range(-0.22, 0.22));
      x.font = `${Math.round(sz)}px ${this.HAND}`; x.fillStyle = r.pick(inks); x.fillText(msg, 0, 0);
      x.restore();
    }
    // scribbled lines (handwriting too small to read) + doodles
    for (let i = 0; i < 40; i++) {
      const sx = r.range(0, w - 50), sy = r.range(6, h - 4), len = r.range(24, 70);
      x.strokeStyle = r.pick(inks); x.lineWidth = r.range(0.8, 1.4); x.beginPath(); x.moveTo(sx, sy);
      for (let q = 1; q <= len / 3; q++) x.lineTo(sx + q * 3, sy + Math.sin(q * 1.7 + i) * r.range(1, 3));
      x.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const cx = r.range(10, w - 10), cy = r.range(10, h - 10), s = r.range(4, 9), k = r.int(0, 2);
      x.strokeStyle = r.pick(inks); x.fillStyle = 'rgba(200,40,80,0.7)'; x.lineWidth = 1.2;
      if (k === 0) { x.beginPath(); x.moveTo(cx, cy + s * 0.8); x.bezierCurveTo(cx - s * 1.4, cy - s * 0.3, cx - s * 0.5, cy - s * 1.2, cx, cy - s * 0.4); x.bezierCurveTo(cx + s * 0.5, cy - s * 1.2, cx + s * 1.4, cy - s * 0.3, cx, cy + s * 0.8); x.fill(); }
      else if (k === 1) { x.beginPath(); for (let q = 0; q < 10; q++) { const a = q / 10 * TAU - Math.PI / 2, rr2 = q % 2 ? s * 0.45 : s; x.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } x.closePath(); x.stroke(); }
      else { x.beginPath(); for (let q = 0; q < 24; q++) { const a = q * 0.5, rr2 = q * s / 24; x.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } x.stroke(); }
    }
  },
  // carved wood relief (a repeating frieze of rings, leaves and lattice)
  paintCarving(x, w, h) {
    const dark = 'rgba(70,40,20,0.55)', lite = 'rgba(255,235,200,0.35)';
    const n = Math.round(w / h);
    for (let i = 0; i < n; i++) {
      const cx = (i + 0.5) * w / n, cy = h / 2, R = h * 0.36;
      for (const [col, off] of [[lite, -1.2], [dark, 1.2]]) {
        x.strokeStyle = col; x.lineWidth = h * 0.06;
        x.beginPath(); x.arc(cx + off, cy + off, R, 0, TAU); x.stroke();
        x.beginPath(); x.arc(cx + off, cy + off, R * 0.45, 0, TAU); x.stroke();
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; x.beginPath(); x.ellipse(cx + off + Math.cos(a) * R * 0.72, cy + off + Math.sin(a) * R * 0.72, R * 0.22, R * 0.1, a, 0, TAU); x.stroke(); }
        x.beginPath(); x.moveTo(cx + off - w / n / 2, cy + off); x.lineTo(cx + off - R, cy + off); x.moveTo(cx + off + R, cy + off); x.lineTo(cx + off + w / n / 2, cy + off); x.stroke();
      }
    }
    x.fillStyle = 'rgba(60,34,16,0.45)'; x.fillRect(0, 0, w, h * 0.06); x.fillRect(0, h * 0.94, w, h * 0.06);
  },
  // four generic polaroids (dog, two people at sunset, mountains, a flower) in a 4 x 1 strip
  paintPhotos(x, w, h) {
    const pw = w / 4;
    for (let i = 0; i < 4; i++) {
      const ox = i * pw;
      x.fillStyle = '#f8f4ea'; x.fillRect(ox + 2, 2, pw - 4, h - 4);
      const ix = ox + 7, iy = 7, iw = pw - 14, ih = h - 26;
      const sky = x.createLinearGradient(0, iy, 0, iy + ih);
      const pal = [['#7ab8e8', '#f0d8a8'], ['#4a3a7a', '#ff9a6a'], ['#9ac8f0', '#e8f0f8'], ['#cfe8c0', '#7aa868']][i];
      sky.addColorStop(0, pal[0]); sky.addColorStop(1, pal[1]); x.fillStyle = sky; x.fillRect(ix, iy, iw, ih);
      x.fillStyle = 'rgba(30,20,30,0.85)';
      if (i === 0) { x.fillStyle = '#d8c090'; x.fillRect(ix, iy + ih * 0.7, iw, ih * 0.3); x.fillStyle = '#5a3a2a'; x.beginPath(); x.ellipse(ix + iw * 0.5, iy + ih * 0.68, iw * 0.22, ih * 0.1, 0, 0, TAU); x.fill(); x.beginPath(); x.arc(ix + iw * 0.7, iy + ih * 0.55, iw * 0.1, 0, TAU); x.fill(); x.fillRect(ix + iw * 0.32, iy + ih * 0.7, iw * 0.05, ih * 0.14); x.fillRect(ix + iw * 0.6, iy + ih * 0.7, iw * 0.05, ih * 0.14); }
      else if (i === 1) { x.fillStyle = '#ffd890'; x.beginPath(); x.arc(ix + iw * 0.5, iy + ih * 0.66, iw * 0.18, 0, TAU); x.fill(); x.fillStyle = 'rgba(30,16,30,0.9)'; x.fillRect(ix, iy + ih * 0.74, iw, ih * 0.26); for (const sx of [0.38, 0.6]) { x.beginPath(); x.arc(ix + iw * sx, iy + ih * 0.42, iw * 0.07, 0, TAU); x.fill(); x.fillRect(ix + iw * (sx - 0.07), iy + ih * 0.49, iw * 0.14, ih * 0.28); } }
      else if (i === 2) { x.fillStyle = '#6a7a9a'; x.beginPath(); x.moveTo(ix, iy + ih); x.lineTo(ix + iw * 0.35, iy + ih * 0.35); x.lineTo(ix + iw * 0.6, iy + ih * 0.7); x.lineTo(ix + iw * 0.8, iy + ih * 0.45); x.lineTo(ix + iw, iy + ih); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(ix + iw * 0.27, iy + ih * 0.45); x.lineTo(ix + iw * 0.35, iy + ih * 0.35); x.lineTo(ix + iw * 0.43, iy + ih * 0.45); x.fill(); }
      else { x.strokeStyle = '#3a7a3a'; x.lineWidth = 2; x.beginPath(); x.moveTo(ix + iw * 0.5, iy + ih); x.lineTo(ix + iw * 0.5, iy + ih * 0.45); x.stroke(); x.fillStyle = '#ff7ab0'; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; x.beginPath(); x.arc(ix + iw * 0.5 + Math.cos(a) * iw * 0.12, iy + ih * 0.38 + Math.sin(a) * iw * 0.12, iw * 0.09, 0, TAU); x.fill(); } x.fillStyle = '#ffe24a'; x.beginPath(); x.arc(ix + iw * 0.5, iy + ih * 0.38, iw * 0.07, 0, TAU); x.fill(); }
      x.fillStyle = 'rgba(40,30,60,0.7)'; x.font = `${Math.round(h * 0.1)}px ${this.HAND}`; x.textAlign = 'center'; x.fillText(['good boy', 'us', 'the trip', 'for you'][i], ox + pw / 2, h - 7);
    }
  },
  // a paper note with handwritten lines (opaque)
  paintNote(x, w, h, lines, o) {
    o = o || {};
    x.fillStyle = o.paper || '#fbf3dc'; x.fillRect(0, 0, w, h);
    const g = x.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(120,80,30,0.18)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(80,120,200,0.18)'; x.lineWidth = 1; for (let y = h * 0.16; y < h; y += h / (lines.length + 1.6)) { x.beginPath(); x.moveTo(8, y + 4); x.lineTo(w - 8, y + 4); x.stroke(); }
    x.fillStyle = o.ink || '#22305a'; x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    const lh = h / (lines.length + 1.2);
    // one font size for every line, shrunk until the longest line fits the paper
    let fs = Math.round(lh * (o.k || 0.72));
    x.font = `${fs}px ${this.HAND}`;
    const widest = Math.max(...lines.map(l => x.measureText(l).width));
    if (widest > w * 0.84) fs = Math.max(8, Math.floor(fs * w * 0.84 / widest));
    lines.forEach((l, i) => { x.save(); x.translate(w * 0.08, lh * (i + 1.05)); x.rotate(-0.02 + (i % 2) * 0.012); x.font = `${fs}px ${this.HAND}`; x.fillText(l, i === lines.length - 1 && o.signRight ? w * 0.4 : 0, 0); x.restore(); });
    if (o.heart) { const cx = w * 0.86, cy = h * 0.84, s = h * 0.05; x.fillStyle = '#e8306a'; x.beginPath(); x.moveTo(cx, cy + s); x.bezierCurveTo(cx - s * 1.6, cy - s * 0.2, cx - s * 0.6, cy - s * 1.5, cx, cy - s * 0.5); x.bezierCurveTo(cx + s * 0.6, cy - s * 1.5, cx + s * 1.6, cy - s * 0.2, cx, cy + s); x.fill(); }
  },
  // tileable floral print (Klaus's sundress)
  paintFloral(x, w, h) {
    x.fillStyle = '#ffe9f0'; x.fillRect(0, 0, w, h);
    const r = mulberry32(31);
    for (let i = 0; i < 26; i++) {
      const cx = r() * w, cy = r() * h, s = r.range(5, 11), col = r.pick(['#ff6aa0', '#ffb040', '#7a8aff', '#ff4f6a', '#f0d040']);
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        x.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.beginPath(); x.arc(cx + ox + Math.cos(a) * s * 0.6, cy + oy + Math.sin(a) * s * 0.6, s * 0.5, 0, TAU); x.fill(); }
        x.fillStyle = '#fff4b0'; x.beginPath(); x.arc(cx + ox, cy + oy, s * 0.32, 0, TAU); x.fill();
        x.fillStyle = '#5aa860'; x.beginPath(); x.ellipse(cx + ox + s, cy + oy + s * 0.6, s * 0.5, s * 0.22, 0.6, 0, TAU); x.fill();
      }
    }
  },
  // gated pickups (only visible while their mission is active) also hide their floating labels
  gateLabels(g) {
    for (const P of g.pickups.items) { if (!P.gate) continue; if (P._label === undefined) P._label = P.label; P.label = g.missions.state(P.mission) === 'active' ? P._label : null; }
  },
  /* ---------------- quiet token award (no cheering, no confetti) ---------------- */
  quietToken(g, missionId, o) {
    o = o || {};
    const isNew = BurnsSave.addToken(g.worldId, missionId);
    const m = g.missions.get(missionId);
    g.banner('BURN TOKEN', m ? m.def.name : '', { col: o.col || '#ffe0a8', big: true, icon: 'token' });
    burnsSfx('token_get', { vol: 0.55 });
    const p = g.player;
    for (let i = 0; i < 18; i++) g.fx.glint(p.x + (Math.random() - 0.5) * 1.6, p.y + 0.8 + Math.random() * 1.8, p.z + (Math.random() - 0.5) * 1.6, '#ffe8b0');
    g.saveRun();
    return isNew;
  },
  /* ---------------- characters ---------------- */
  // a plain burner spec with every figure extra cleared, then your fields (always give a unique key)
  base(seed, fields) {
    return Object.assign(BurnsRig.npcSpec('burner', seed || 0), { hat: null, goggles: false, glasses: null, beard: null, hood: false, acc: [], led: null, paint: null, coat: null, vest: null, prop: null, prop2: null, tattoos: false, gloves: null, socks: null }, fields || {});
  }
};

/* ---------------- custom gear (official extension API, see guide §6.5) ---------------- */
(() => {
  const B = BURNS_BONES;
  // Flow's cartoon censor: a chunky pixel-mosaic block over the hips (front, back, sides, top, bottom)
  BurnsRig.defineAcc('bw13mosaic', (m, A) => {
    m.setBone(B.HIPS);
    const w = A.w || 1, x0 = -0.22 * w, x1 = 0.22 * w, y0 = -0.24, y1 = 0.07, z0 = -0.175, z1 = 0.175, c = [0, (y0 + y1) / 2, 0];
    const skin = A.skin || '#e0b090', pal = [skin, shade(skin, -0.18), shade(skin, 0.14), '#e4a4a8', '#c89a7e', shade(skin, -0.3)];
    const r = mulberry32(77);
    if (A.lo) { m.color(shade(skin, -0.1)); m.box(0, c[1], 0, x1 - x0, y1 - y0, z1 - z0); return; }
    const face = (P0, U, V, nu, nv) => { for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const q = (a, b) => [P0[0] + U[0] * a + V[0] * b, P0[1] + U[1] * a + V[1] * b, P0[2] + U[2] * a + V[2] * b]; m.color(pal[Math.floor(r() * pal.length)], 0.12); m.poly([q(i / nu, j / nv), q((i + 1) / nu, j / nv), q((i + 1) / nu, (j + 1) / nv), q(i / nu, (j + 1) / nv)], null, c); } };
    face([x0, y0, z1], [x1 - x0, 0, 0], [0, y1 - y0, 0], 6, 4); face([x0, y0, z0], [x1 - x0, 0, 0], [0, y1 - y0, 0], 6, 4);
    face([x0, y0, z0], [0, 0, z1 - z0], [0, y1 - y0, 0], 5, 4); face([x1, y0, z0], [0, 0, z1 - z0], [0, y1 - y0, 0], 5, 4);
    face([x0, y1, z0], [x1 - x0, 0, 0], [0, 0, z1 - z0], 6, 5); face([x0, y0, z0], [x1 - x0, 0, 0], [0, 0, z1 - z0], 6, 5);
    m.emissive(0);
  });
  // a neon fanny pack worn on the belly (for snacks)
  BurnsRig.defineAcc('bw13fannypack', (m, A) => {
    m.setBone(B.HIPS); const w = A.w || 1;
    m.color('#1a1a22'); m.push(); m.tf(0, 0.1, 0, 0, 0, 0, 1, 1, 0.76); m.torus(0, 0, 0, 0.19 * w, 0.014, { seg: A.lo ? 10 : 18, tseg: 4 }); m.pop();
    m.color('#ff4fb0').shine(2); m.roundBox(0, 0.1, 0.16 * w, 0.22, 0.11, 0.08, 0.035); m.color('#38f2ff'); if (!A.lo) m.roundBox(0, 0.13, 0.2 * w, 0.18, 0.012, 0.012, 0.005); m.shine(0);
  });
  // a crown of little flowers
  BurnsRig.defineAcc('bw13flowercrown', (m, A) => {
    m.setBone(B.HEAD);
    const n = A.lo ? 7 : 11, cols = ['#ff6aa0', '#ffe24a', '#ffffff', '#ff9a3a', '#c8a0ff'];
    for (let i = 0; i < n; i++) {
      const th = i / n * TAU, p = A.headPt ? A.headPt(th, 0.92, 0.028) : [Math.sin(th) * 0.19, 0.33, Math.cos(th) * 0.19];
      m.color(cols[i % cols.length]);
      if (A.lo) { m.ball(p[0], p[1], p[2], 0.04, { seg: 6, rings: 4 }); continue; }
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; m.ball(p[0] + Math.cos(a) * 0.026, p[1] + Math.sin(a) * 0.026, p[2], 0.019, { seg: 6, rings: 4 }); }
      m.color('#ffd84a'); m.ball(p[0], p[1], p[2] + 0.006, 0.014, { seg: 6, rings: 4 });
      m.color('#4a9a4a'); m.ball(p[0] * 0.98, p[1] - 0.025, p[2] * 0.98, 0.016, { seg: 5, rings: 3 });
    }
  });
  // big round 1970s glasses on a chain (Auntie Pearl)
  BurnsRig.defineAcc('bw13glasschain', (m, A) => {
    if (A.lo) return; m.setBone(B.HEAD);
    const a = A.headPt ? A.headPt(1.2, 1.6, 0.0) : [0.17, 0.2, 0.06], b = A.headPt ? A.headPt(-1.2, 1.6, 0.0) : [-0.17, 0.2, 0.06];
    m.color('#e8c040').shine(3); m.limb(a[0], a[1], a[2], 0, a[1] - 0.24, 0.14, 0.004, 0.004, { seg: 4 }); m.limb(b[0], b[1], b[2], 0, b[1] - 0.24, 0.14, 0.004, 0.004, { seg: 4 }); m.shine(0);
  });
})();

/* ---------------- animations (shared, prefixed) ---------------- */
(() => {
  const B = BURNS_BONES;
  const S = (P, b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  const A = BURNS_ANIMS;
  // cross-legged on the ground, slow breathing
  A.bw1213_floorsit = (P, t) => {
    const br = Math.sin(t * 1.3);
    S(P, B.THIGH_L, -1.42, 0, 0.78); S(P, B.SHIN_L, 2.35, 0, -1.05); S(P, B.THIGH_R, -1.42, 0, -0.78); S(P, B.SHIN_R, 2.35, 0, 1.05);
    S(P, B.FOOT_L, 0.3); S(P, B.FOOT_R, 0.3);
    S(P, B.UARM_L, -0.5, 0, 0.32); S(P, B.FARM_L, -0.55); S(P, B.UARM_R, -0.5, 0, -0.32); S(P, B.FARM_R, -0.55);
    S(P, B.CHEST, 0.05 + br * 0.02); S(P, B.HEAD, 0.14 + br * 0.015, Math.sin(t * 0.21) * 0.12);
    P.y = -0.7;
  };
  // kneeling, head bowed (quiet moments at the Temple)
  A.bw1213_kneel = (P, t) => {
    S(P, B.THIGH_L, -0.25); S(P, B.SHIN_L, 2.6); S(P, B.THIGH_R, -0.25); S(P, B.SHIN_R, 2.6); S(P, B.FOOT_L, 0.7); S(P, B.FOOT_R, 0.7);
    S(P, B.UARM_L, -0.35, 0, 0.1); S(P, B.FARM_L, -0.9); S(P, B.UARM_R, -0.35, 0, -0.1); S(P, B.FARM_R, -0.9);
    S(P, B.CHEST, 0.2 + Math.sin(t * 1.1) * 0.02); S(P, B.HEAD, 0.35);
    P.y = -0.62;
  };
  // writing on a wall at chest height
  A.bw1213_write = (P, t) => {
    A.idle(P, t);
    S(P, B.UARM_R, -1.45 + Math.sin(t * 6) * 0.07, 0, -0.12 + Math.cos(t * 4.3) * 0.08); S(P, B.FARM_R, -0.55 + Math.sin(t * 8.5) * 0.1);
    S(P, B.UARM_L, -0.15, 0, 0.1); S(P, B.FARM_L, -0.4); S(P, B.HEAD, 0.08, 0.05);
  };
  // hands pressed together at the heart (eye gazing, gratitude)
  A.bw1213_heart = (P, t) => {
    A.idle(P, t);
    S(P, B.UARM_L, -0.42, 0.4, -0.22); S(P, B.FARM_L, -1.85, 0, 0); S(P, B.UARM_R, -0.42, -0.4, 0.22); S(P, B.FARM_R, -1.85, 0, 0);
    S(P, B.CHEST, 0.05); S(P, B.HEAD, -0.02 + Math.sin(t * 0.8) * 0.03);
  };
  // the stare: lean in, eyes wide
  A.bw1213_gaze = (P, t) => {
    A.bw1213_heart(P, t);
    S(P, B.CHEST, 0.16 + Math.sin(t * 2) * 0.02); S(P, B.HEAD, -0.18, Math.sin(t * 0.7) * 0.05);
    P.face = 3;
  };
  // arms spread wide in welcome, swaying
  A.bw1213_wide = (P, t) => {
    A.idle(P, t);
    const s = Math.sin(t * 1.6);
    S(P, B.UARM_L, -0.3, 0, 1.35 + s * 0.1); S(P, B.FARM_L, -0.25); S(P, B.UARM_R, -0.3, 0, -1.35 - s * 0.1); S(P, B.FARM_R, -0.25);
    S(P, B.CHEST, -0.1, s * 0.12); S(P, B.HEAD, -0.15, s * 0.15); P.face = 3;
  };
  // one finger to the sky
  A.bw1213_sky = (P, t) => { A.idle(P, t); S(P, B.UARM_R, -2.95, 0, -0.1); S(P, B.FARM_R, 0); S(P, B.UARM_L, -0.6, 0, 0.3); S(P, B.FARM_L, -1.7); S(P, B.HEAD, -0.35); P.face = 3; };
  // hands on hips, one arm in a cast pointing up (bad idea guy), finger-to-chin when thinking
  A.bw1213_dare = (P, t) => { A.idle(P, t); S(P, B.UARM_R, -2.7, 0, -0.25); S(P, B.FARM_R, -0.2); S(P, B.UARM_L, -0.5, 0, -0.1); S(P, B.FARM_L, -2.2 + Math.sin(t * 2) * 0.05); S(P, B.HEAD, -0.12, 0.2); };
  // contact improv: slow flowing weight shifts, arms circling (no contact needed for it to look committed)
  A.bw1213_flow = (P, t) => {
    const s = Math.sin(t * 1.9), c = Math.cos(t * 1.4), s2 = Math.sin(t * 2.6 + 1);
    S(P, B.THIGH_L, -0.45 + s * 0.3, 0, 0.12); S(P, B.SHIN_L, 0.75 + Math.max(0, s) * 0.4); S(P, B.THIGH_R, -0.45 - s * 0.3, 0, -0.12); S(P, B.SHIN_R, 0.75 + Math.max(0, -s) * 0.4);
    S(P, B.UARM_L, -1.3 + s2 * 0.9, 0.3, 0.9 + c * 0.5); S(P, B.FARM_L, -0.6 + c * 0.4); S(P, B.UARM_R, -1.3 - s2 * 0.9, -0.3, -0.9 + c * 0.5); S(P, B.FARM_R, -0.6 - c * 0.4);
    S(P, B.CHEST, 0.15 + c * 0.1, s * 0.3, s * 0.15); S(P, B.HEAD, -0.1 + s2 * 0.1, -s * 0.25);
    P.y = -0.18 + Math.abs(s) * 0.06; P.roll = s * 0.12; P.face = 3;
  };
  // the contact improv "rolling point of contact": a tucked forward roll (dash)
  A.bw1213_roll = (P, t) => {
    S(P, B.THIGH_L, -1.9); S(P, B.SHIN_L, 2.3); S(P, B.THIGH_R, -1.9); S(P, B.SHIN_R, 2.3);
    S(P, B.UARM_L, -1.2, 0, 0.5); S(P, B.FARM_L, -1.5); S(P, B.UARM_R, -1.2, 0, -0.5); S(P, B.FARM_R, -1.5);
    S(P, B.CHEST, 0.6); S(P, B.HEAD, 0.5);
    P.pitch = (t * 9) % TAU; P.pivot = 0.55; P.y = -0.35; P.face = 3;
  };
  // happy skipping with open arms (Klaus)
  A.bw1213_skip = (P, t, k) => {
    const sp = (k && k.rate) || 1, ph = t * 9 * sp, s = Math.sin(ph), c = Math.cos(ph);
    S(P, B.THIGH_L, -s * 0.8 - 0.2); S(P, B.SHIN_L, Math.max(0, -c) * 1.2 + 0.3); S(P, B.THIGH_R, s * 0.8 - 0.2); S(P, B.SHIN_R, Math.max(0, c) * 1.2 + 0.3);
    S(P, B.UARM_L, -1.6 + s * 0.4, 0, 1.0); S(P, B.FARM_L, -0.4); S(P, B.UARM_R, -1.6 - s * 0.4, 0, -1.0); S(P, B.FARM_R, -0.4);
    S(P, B.CHEST, 0.05, s * 0.1); S(P, B.HEAD, -0.15, -s * 0.1);
    P.y = Math.abs(c) * 0.22 - 0.02; P.face = 3;
  };
  // tantra partner breathing: seated, hands reaching forward, chest rising
  A.bw1213_breathe = (P, t) => {
    A.bw1213_floorsit(P, t);
    const br = Math.sin(t * 1.1);
    S(P, B.UARM_L, -1.0, 0, 0.18); S(P, B.FARM_L, -0.5); S(P, B.UARM_R, -1.0, 0, -0.18); S(P, B.FARM_R, -0.5);
    S(P, B.CHEST, 0.02 - br * 0.06); S(P, B.HEAD, -0.05 - br * 0.05); P.sq = 1 + br * 0.015;
  };
  // carrying something together (arms low and forward)
  A.bw1213_carry = (P, t, k) => {
    A.walk(P, t, k);
    S(P, B.UARM_L, -0.75, 0, 0.12); S(P, B.FARM_L, -0.65); S(P, B.UARM_R, -0.75, 0, -0.12); S(P, B.FARM_R, -0.65);
  };
  A.bw1213_carryIdle = (P, t) => {
    A.idle(P, t);
    S(P, B.UARM_L, -0.75, 0, 0.12); S(P, B.FARM_L, -0.65); S(P, B.UARM_R, -0.75, 0, -0.12); S(P, B.FARM_R, -0.65);
  };
  // crying happy tears (the healer, at the beauty of a passing trash truck)
  A.bw1213_cry = (P, t) => {
    A.idle(P, t);
    const q = Math.sin(t * 15) * 0.03;
    S(P, B.UARM_L, -1.05, 0, 0.2); S(P, B.FARM_L, -2.1); S(P, B.UARM_R, -1.05, 0, -0.2); S(P, B.FARM_R, -2.1);
    S(P, B.CHEST, 0.2 + q); S(P, B.HEAD, 0.3 + q); P.face = 2;
  };
  // lying on the back (napping)
  A.bw1213_lie = (P, t) => {
    S(P, B.UARM_L, -0.2, 0, 0.35); S(P, B.FARM_L, -0.2); S(P, B.UARM_R, -0.2, 0, -0.35); S(P, B.FARM_R, -0.2);
    S(P, B.CHEST, Math.sin(t * 1.2) * 0.03); S(P, B.HEAD, -0.1, 0.25);
    P.pitch = -1.5; P.pivot = 0.12; P.y = -0.02; P.face = 2;
  };
  // being held in a "partner dance" (Brady, rooted)
  A.bw1213_awkward = (P, t) => {
    A.idle(P, t);
    const w = Math.sin(t * 7) * 0.15;
    S(P, B.UARM_L, -0.4 + w, 0, 0.6); S(P, B.FARM_L, -0.5); S(P, B.UARM_R, -0.4 - w, 0, -0.6); S(P, B.FARM_R, -0.5);
    S(P, B.CHEST, -0.2); S(P, B.HEAD, -0.25, Math.sin(t * 3) * 0.3); P.face = 2;
  };
  // looking up at the sky (shading eyes)
  A.bw1213_lookup = (P, t) => { A.idle(P, t); S(P, B.UARM_R, -2.3, 0, 0.35); S(P, B.FARM_R, -1.6); S(P, B.HEAD, -0.55); S(P, B.CHEST, -0.12); };
  // reading something held in both hands
  A.bw1213_read = (P, t) => { A.idle(P, t); S(P, B.UARM_L, -0.85, 0, 0.12); S(P, B.FARM_L, -1.35); S(P, B.UARM_R, -0.85, 0, -0.12); S(P, B.FARM_R, -1.35); S(P, B.HEAD, 0.35); };
  // hugging (side-by-side comfort hug, gentle sway)
  A.bw1213_hug = (P, t) => { A.hug(P, t); P.roll = Math.sin(t * 1.2) * 0.05; };
})();

/* ---------------- rounded mesh helpers (local coordinates, y = bottom unless noted) ---------------- */
BW1213.M = {
  heartPts(s) { const out = []; for (let i = 0; i < 24; i++) { const t = i / 24 * TAU; out.push([s * 16 * Math.pow(Math.sin(t), 3) / 17, s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17]); } return out; },
  // puffy cushion / pillow
  cushion(m, x, y, z, w, h, d, col, yaw) { m.push(); m.tf(x, y, z, yaw || 0); m.color(col); m.roundBox(0, h / 2, 0, w, h, d, Math.min(h * 0.48, w * 0.3, d * 0.3)); m.color(shade(col, -0.12)); m.ball(0, h * 0.98, 0, Math.min(w, d) * 0.06); m.pop(); return m; },
  // round floor pouf
  pouf(m, x, y, z, r, h, col) { m.color(col); m.roundCyl(x, y, z, r, h, h * 0.45); return m; },
  // paper lantern (ellipsoid with dark caps); e = glow
  lantern(m, x, y, z, r, col, e) {
    m.color('#3a2a1a'); m.roundCyl(x, y - r * 0.92, z, r * 0.42, r * 0.16, r * 0.05); m.roundCyl(x, y + r * 0.78, z, r * 0.36, r * 0.16, r * 0.05);
    m.color(col, e || 0); m.ellipsoid(x, y, z, r, r * 0.86, r, { seg: m.segs(12, 7), rings: m.segs(8, 5) }); m.emissive(0);
    return m;
  },
  // a candle with a flame; returns the flame position (for a glow sprite)
  candle(m, x, y, z, r, h, col) {
    m.color(col || '#f4ecd8'); m.roundCyl(x, y, z, r, h, r * 0.3);
    m.color('#ffcf6a', 1); m.ellipsoid(x, y + h + r * 0.9, z, r * 0.42, r * 0.95, r * 0.42, { seg: 6, rings: 4 }); m.emissive(0);
    return [x, y + h + r * 0.9, z];
  },
  // bronze bell (open at the bottom)
  bell(m, x, y, z, r, col) {
    m.push(); m.tf(x, y, z); m.color(col || '#c89a3a').shine(3);
    m.lathe([[r, 0], [r * 0.98, 0.04 * r], [r * 0.72, 0.35 * r], [r * 0.58, 0.8 * r], [r * 0.5, 1.05 * r], [r * 0.3, 1.18 * r], [0, 1.22 * r]], { seg: m.segs(14, 8) });
    m.lathe([[r * 0.96, 0.02 * r], [r * 0.7, 0.33 * r], [r * 0.55, 0.8 * r], [0, 1.05 * r]], { seg: m.segs(14, 8), flip: true });
    m.color('#5a4020'); m.ball(0, -0.05 * r, 0, r * 0.18); m.pop(); m.shine(0);
    return m;
  },
  // stacked smooth stones; returns the top height (for the dome collider)
  cairn(m, x, z, top, rng, cols) {
    let y = 0; const n = Math.max(1, Math.round(top / 0.75));
    for (let i = 0; i < n; i++) {
      const last = i === n - 1, r = last ? 0.95 : 0.85 - i * 0.03 + rng() * 0.15, hh = last ? Math.max(0.35, top - y) : (top - 0.4) / Math.max(1, n - 1);
      m.color(cols ? cols[i % cols.length] : rng.pick(['#c8b8a8', '#b8a898', '#d8c8b8', '#a89888']));
      m.ellipsoid(x + (rng() - 0.5) * 0.12, y + hh * 0.5, z + (rng() - 0.5) * 0.12, r, hh * 0.58, r * (0.9 + rng() * 0.15), { seg: m.segs(12, 8), rings: m.segs(7, 5) });
      y += hh;
    }
    return y;
  },
  /* fabric dome shell (hollow, lined inside), radius R, height H, door gap facing local +Z (yaw 0),
     cols: [outer, alternate stripe] colours; returns colliders (wall ring, door gap left open) */
  domeShell(m, R, H, o) {
    o = o || {};
    const seg = o.seg || 28, door = o.door === undefined ? 0.42 : o.door, doorH = o.doorH || 3.2;
    // split the profile at the door height so the doorway is only cut into the lower band
    const ph0 = Math.acos(clamp(doorH / H, 0, 1)), rD = R * Math.sin(ph0);
    const low = [[R, 0]]; for (let i = 1; i <= 4; i++) { const ph = Math.PI / 2 - (Math.PI / 2 - ph0) * i / 4; low.push([R * Math.sin(ph), H * Math.cos(ph)]); }
    const high = [[rD, doorH]]; for (let i = 1; i <= 7; i++) { const ph = ph0 * (1 - i / 7); high.push([R * Math.sin(ph), H * Math.cos(ph)]); }
    const cols = o.cols || ['#f4f0ea', '#e8e0d8'], inner = o.inner || shade(cols[0], -0.25), stripes = o.stripes || 1;
    const t0 = door / 2, t1 = TAU - door / 2;
    for (const [P, full] of [[low, false], [high, true]]) {
      const tA = full ? 0 : t0, tB = full ? TAU : t1, n = stripes;
      for (let k = 0; k < n; k++) {
        const a = tA + (tB - tA) * k / n, b = tA + (tB - tA) * (k + 1) / n;
        const sg = Math.max(2, Math.round(seg / n));
        m.color(cols[k % cols.length], o.e || 0); m.lathe(P, { seg: sg, theta0: a, theta1: b });
        m.color(inner, o.ei === undefined ? 0.12 : o.ei); m.lathe(P.map(q => [q[0] * 0.985, q[1]]), { seg: sg, theta0: a, theta1: b, flip: true });
      }
    }
    m.emissive(0);
    // door frame
    m.color(o.frame || '#8a6a4a');
    const dx = Math.sin(t0) * R, dz = Math.cos(t0) * R;
    m.limb(dx, 0, dz, dx * 0.97, doorH, dz * 0.97, 0.09, 0.08); m.limb(-dx, 0, dz, -dx * 0.97, doorH, dz * 0.97, 0.09, 0.08); m.limb(dx * 0.97, doorH, dz * 0.97, -dx * 0.97, doorH, dz * 0.97, 0.08, 0.08);
    // colliders: stacked rings of boxes that follow the shell, so neither Brady nor the camera
    // can slip out through the fabric (the doorway stays open below the door height)
    const cols2 = [], N = o.colN || 22, bands = [];
    let yb = 0; while (yb < H * 0.86) { const yt = Math.min(H * 0.92, yb + Math.max(0.8, H / 7)); bands.push([yb, yt]); yb = yt; }
    for (const [y0, y1] of bands) {
      const rr = R * Math.sin(Math.acos(clamp(y1 / H, 0, 1))) - 0.3;
      if (rr < 1.2) continue;
      for (let i = 0; i < N; i++) {
        const a = (i + 0.5) / N * TAU; if (y0 < doorH - 0.2 && (a < t0 + 0.05 || a > t1 - 0.05)) continue;
        cols2.push({ t: 'box', x: Math.sin(a) * rr, z: Math.cos(a) * rr, hx: Math.PI * rr / N + 0.14, hz: 0.25, y0, y1, yaw: a, walk: false });
      }
    }
    cols2.push({ t: 'box', x: 0, z: 0, hx: 0.5, hz: 0.5, y0: H - 0.4, y1: H + 0.05, walk: true, camPass: true });
    return cols2;
  },
  /* peaked striped tent (lined), door gap toward local +Z; returns wall colliders */
  tent(m, R, H, o) {
    o = o || {};
    const cols = o.cols || ['#e83a3a', '#ff8a2a'], n = o.stripes || 12, door = o.door === undefined ? 0.9 : o.door, doorH = o.doorH || 2.6;
    const prof = [[R, 0], [R * 0.985, 0.6], [R * 0.9, H * 0.3], [R * 0.62, H * 0.6], [R * 0.3, H * 0.84], [0.18, H * 0.98], [0, H]];
    const split = (pts, yCut, below) => { const out = []; for (let i = 0; i < pts.length; i++) { const p = pts[i]; if (below ? p[1] <= yCut : p[1] >= yCut) out.push(p); if (i < pts.length - 1) { const q = pts[i + 1]; if ((p[1] - yCut) * (q[1] - yCut) < 0) { const k = (yCut - p[1]) / (q[1] - p[1]); out.push([lerp(p[0], q[0], k), yCut]); } } } return below ? out : out; };
    const lowP = split(prof, doorH, true), highP = split(prof, doorH, false);
    const scal = (th, t) => 1 + (t < 0.02 ? 0.035 * Math.sin(th * n) : 0);
    for (const [P, full] of [[lowP, false], [highP, true]]) {
      const tA = full ? 0 : door / 2, tB = full ? TAU : TAU - door / 2;
      for (let k = 0; k < n; k++) {
        const a = tA + (tB - tA) * k / n, b = tA + (tB - tA) * (k + 1) / n;
        m.color(cols[k % cols.length]); m.lathe(P, { seg: 4, theta0: a, theta1: b, rMod: full ? null : scal });
        m.color(shade(cols[k % cols.length], -0.35), o.ei === undefined ? 0.18 : o.ei); m.lathe(P.map(q => [q[0] * 0.98, q[1]]), { seg: 4, theta0: a, theta1: b, flip: true }); m.emissive(0);
      }
    }
    m.color(o.pole || '#6a4a2a'); m.limb(0, 0, 0, 0, H + 0.6, 0, 0.1, 0.07);
    m.color(o.flag || '#ffe24a'); m.push(); m.tf(0, H + 0.35, 0); m.extrude([[0, 0], [0.7, 0.12], [0, 0.25]], 0.02); m.pop();
    const cl = [], N = 20, rAt = y => { for (let i = 0; i < prof.length - 1; i++) { const p0 = prof[i], p1 = prof[i + 1]; if (y >= p0[1] && y <= p1[1]) return lerp(p0[0], p1[0], (y - p0[1]) / Math.max(1e-6, p1[1] - p0[1])); } return 0; };
    for (let yb = 0; yb < H * 0.82; yb += H / 7) {
      const y1 = Math.min(H * 0.86, yb + H / 7), rr = rAt(y1) - 0.3; if (rr < 1.0) continue;
      for (let i = 0; i < N; i++) {
        const a = (i + 0.5) / N * TAU; if (yb < doorH - 0.2 && (a < door / 2 + 0.05 || a > TAU - door / 2 - 0.05)) continue;
        cl.push({ t: 'box', x: Math.sin(a) * rr, z: Math.cos(a) * rr, hx: Math.PI * rr / N + 0.14, hz: 0.25, y0: yb, y1, yaw: a, walk: false });
      }
    }
    cl.push({ t: 'cyl', x: 0, z: 0, r: 0.12, y0: 0, y1: H, camPass: true });
    return cl;
  },
  // a soft tension sail between four corners [[x,y,z]x4] (double-sided)
  sail(m, A, Bc, C, D, col, sag) {
    const f = (u, v, o) => { for (let k = 0; k < 3; k++) o[k] = lerp(lerp(A[k], Bc[k], u), lerp(D[k], C[k], u), v); o[1] -= Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * (sag || 0.6); };
    m.color(col); m.surf(10, 10, f, { out: [0, 50, 0] }); m.color(shade(col, -0.18)); m.surf(10, 10, f, { out: [0, -50, 0] });
    return m;
  },
  // simple rounded bench along local X
  bench(m, len, col) { m.color(col || '#a07a50'); m.roundBox(0, 0.42, 0, len, 0.1, 0.42, 0.04); m.color(shade(col || '#a07a50', -0.25)); for (const sx of [-1, 1]) m.roundBox(sx * (len / 2 - 0.2), 0.19, 0, 0.12, 0.38, 0.36, 0.04); return [{ t: 'box', x: 0, z: 0, hx: len / 2, hz: 0.22, y0: 0, y1: 0.47 }]; },
  // rounded chair facing local +Z
  chair(m, col) { m.color(col || '#a07a50'); m.roundBox(0, 0.45, 0, 0.5, 0.08, 0.48, 0.03); m.roundBox(0, 0.82, -0.22, 0.5, 0.62, 0.07, 0.03); m.color(shade(col || '#a07a50', -0.25)); for (const [x, z] of [[0.2, 0.19], [-0.2, 0.19], [0.2, -0.19], [-0.2, -0.19]]) m.limb(x, 0, z, x, 0.42, z, 0.03, 0.03); return [{ t: 'box', x: 0, z: 0, hx: 0.26, hz: 0.25, y0: 0, y1: 0.49 }]; },
  // a little propeller plane flying along local +Z (W13 ending)
  plane(m) {
    m.color('#f4f0e8').shine(2); m.push(); m.tf(0, 0, 0, 0, Math.PI / 2, 0); m.lathe([[0, -3.2], [0.32, -2.6], [0.55, -1.2], [0.6, 0.2], [0.5, 1.4], [0.18, 2.6], [0, 2.75]], { seg: 12 }); m.pop();
    m.color('#ff4f6a'); m.roundBox(0, 0.05, 0.5, 6.4, 0.12, 1.1, 0.05); m.roundBox(0, 0.1, -2.4, 2.4, 0.08, 0.6, 0.03); m.roundBox(0, 0.5, -2.45, 0.08, 1.0, 0.7, 0.03);
    m.color('#5ab0ff', 0.2).shine(3); m.ellipsoid(0, 0.42, 1.0, 0.42, 0.3, 0.7); m.shine(0); m.emissive(0);
    m.color('#3a3a40'); m.roundCyl(0, -0.02, 3.2, 0.12, 0.08, 0.03); m.push(); m.tf(0, 0, 3.25, 0, Math.PI / 2, 0); m.roundBox(0, 0, 0, 1.8, 0.1, 0.05, 0.02); m.pop();
    m.color('#2a2a30'); for (const sx of [-0.9, 0.9]) { m.limb(sx, -0.1, 0.9, sx, -0.7, 0.9, 0.04, 0.04); m.push(); m.tf(sx, -0.75, 0.9, 0, 0, Math.PI / 2); m.roundCyl(0, -0.08, 0, 0.18, 0.16, 0.05); m.pop(); }
    m.color('#ff4f6a', 1); m.ball(-3.2, 0.05, 0.5, 0.08); m.color('#7aff5a', 1); m.ball(3.2, 0.05, 0.5, 0.08); m.emissive(0); m.shine(0);
    return { cols: [] };
  }
};

/* ---------------- sprite helpers ---------------- */
BW1213.FX = {
  // a soft beam between two points (stare beams, light shafts). blend: additive (default) or solid (alpha, shows on white)
  beam(R, a, b, w, col, alpha, solid, reg) {
    const B = R.bbs.B; if (!B) return;
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
    let px = dx * B.rx + dy * B.ry + dz * B.rz, py = dx * B.ux + dy * B.uy + dz * B.uz; const l = Math.hypot(px, py) || 1; px /= l; py /= l;
    const rg = reg || BURNS_SPRITES.R.streak, x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2, z = (a[2] + b[2]) / 2;
    R.bbs.quad(x, y, z, -py * w / 2, px * w / 2, px * L / 2, py * L / 2, rg, col[0] * alpha, col[1] * alpha, col[2] * alpha, solid ? alpha : 0);
  },
  // dots along a beam (sparkle trail)
  dots(R, a, b, n, size, col, alpha, phase) {
    const S = BURNS_SPRITES.R;
    for (let i = 0; i < n; i++) { const t = ((i + (phase || 0)) / n) % 1; R.bbs.bb(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), size, size, S.glow, col, alpha * Math.sin(t * Math.PI), true); }
  }
};
