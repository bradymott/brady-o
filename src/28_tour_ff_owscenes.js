/* ============================================================
   World tour: the little scene around each stop of a land's
   overworld (the market stalls by 1-1, the canal boats by 1-2, the
   cenote, the volcano smoke, ...). TOUR_OW_MAPS[cc].scenes says
   which scene a stop gets; props are placed in free spots around the
   stop (clear of trails, labels, other stops and water), painted once
   into the map, and a few parts move every frame. A stop not cleared
   yet shows its scene a little greyed under the Baron's gloom; a
   cleared one brightens and flies a string of pennants. Night levels
   sit under a small patch of night sky.
   ============================================================ */
const TourOWScenes = {
  INK: '#1c1426',
  P(c, pts, fill) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = fill; c.fill(); c.stroke(); },
  O(c, x, y, r, fill, ry) { c.beginPath(); c.ellipse(x, y, r, ry || r, 0, 0, TAU); c.fillStyle = fill; c.fill(); c.stroke(); },
  R(c, x, y, w, h, fill) { c.fillStyle = fill; c.fillRect(x, y, w, h); c.strokeRect(x, y, w, h); },
  shadow(c, x, y, r) { c.fillStyle = 'rgba(20,14,30,0.25)'; c.beginPath(); c.ellipse(x, y + 1, r, r * 0.3, 0, 0, TAU); c.fill(); },
  // a night level: its stop sits under a patch of night (by theme: a moon or a dark sky)
  night(n) {
    if (!n || n.kind !== 'level') return false;
    const L = n.L, th = THEMES[L.theme || (L.areas && L.areas[0] && L.areas[0].theme)];
    if (L.mapNight != null) return !!L.mapNight;
    if (!th) return false;
    if (th.celestial && th.celestial.type === 'moon') return true;
    const sky = th.sky && th.sky[0]; if (!sky || sky[0] !== '#') return false;
    const [r, g, b] = hexToRgb(sky); return (r * 0.3 + g * 0.59 + b * 0.11) < 50;
  },
  // the scenes of a land: [{ key, n, kind, o, x, y }] for stops that are visible
  list(ow) {
    const M = ow.G.M, sc = M.scenes || {}, out = [];
    for (const key in sc) {
      const n = ow.by[key], p = ow.G.pos[key]; if (!n || !p || !n.visible) continue;
      const d = Array.isArray(sc[key]) ? sc[key] : [sc[key]];
      if (!this.kinds[d[0]]) continue;
      out.push({ key, n, kind: d[0], o: d[1] || {}, x: p.x, y: p.y });
    }
    return out;
  },
  // free spots around a stop, best first (behind it, then the sides), clear of trails, labels, stops and water
  slots(ow, s, wet) {
    const G = ow.G, curves = this.curves(ow), out = [];
    const lb = ow.labelBox(s.n);
    for (const r of [46, 66, 88, 112]) for (let q = 0; q < 18; q++) {
      const a = -Math.PI / 2 + (q % 2 ? 1 : -1) * Math.ceil(q / 2) * (TAU / 18), x = s.x + Math.cos(a) * r * 1.1, y = s.y + Math.sin(a) * r * 0.78;
      if (y > s.y + 6 && Math.abs(x - s.x) < 50) continue;
      if (lb && x > lb.x - 14 && x < lb.x + lb.w + 14 && y > lb.y - 12 && y < lb.y + lb.h + 14) continue;
      const dry = TourOWPaint.dry(G, x, y); if (wet ? dry : !dry) continue;
      if (curves.some(pts => OWGeo.distPoly(x, y, pts) < 20)) continue;
      let ok = true; for (const k in G.pos) { if (k === s.key) continue; const p = G.pos[k]; if (Math.hypot(p.x - x, p.y - y) < 48) { ok = false; break; } if (Math.abs(p.x - x) < 52 && y > p.y && y - p.y < 44) { ok = false; break; } }
      if (ok) out.push({ x, y, a, r });
    }
    return out;
  },
  // the best spot for a scene of radius R near its stop: clear of trails, stops, labels and (unless wet) water
  anchor(ow, s, R, wet) {
    const G = ow.G, curves = this.curves(ow), lbs = ow.nodes.map(n => ow.labelBox(n)).filter(Boolean);
    let best = null, bs = -1e9;
    for (const r of [R + 34, R + 50, R + 70, R + 95]) for (let q = 0; q < 24; q++) {
      const a = q / 24 * TAU, x = s.x + Math.cos(a) * r, y = s.y + Math.sin(a) * r * 0.75;
      if (x < R + 20 || y < R + 30 || x > G.w - R - 20 || y > G.h - R * 0.6 - 30) continue;
      let ok = true;
      for (const pts of curves) if (OWGeo.distPoly(x, y, pts) < R * 0.72 + 12) { ok = false; break; }
      if (!ok) continue;
      for (const k in G.pos) { const p = G.pos[k]; if (Math.hypot(p.x - x, (p.y - y) * 1.2) < R + 30) { ok = false; break; } }
      if (!ok) continue;
      for (const b of lbs) if (x + R > b.x && x - R < b.x + b.w && y + R * 0.5 > b.y && y - R * 0.9 < b.y + b.h) { ok = false; break; }
      if (!ok) continue;
      let wetN = 0; for (let k = 0; k < 8; k++) { const aa = k / 8 * TAU; if (!TourOWPaint.dry(G, x + Math.cos(aa) * R * 0.8, y + Math.sin(aa) * R * 0.45)) wetN++; }
      if (!wet && wetN) continue;
      // behind the stop (above it on the map) first, then the sides, nearer is better
      const score = -Math.sin(a) * 30 - r * 0.6 - Math.abs(Math.cos(a)) * 8 + (wet ? wetN * 4 : 0);
      if (score > bs) { bs = score; best = { x, y, a, r }; }
    }
    return best;
  },
  curves(ow) { if (!ow._curves) ow._curves = TourOW.allCurves(ow.C).map(x => x.P.pts); return ow._curves; },
  // painted into the map (the overworld redoes the map when a stop is cleared or revealed)
  paint(c, ow) {
    const list = this.list(ow); ow.sceneMem = {};
    for (const s of list) {
      const K = this.kinds[s.kind], used = [], wetSlots = K.wet ? this.slots(ow, s, true) : null, slots = this.slots(ow, s, false);
      const S = Object.assign({ ow, look: ow.look, cols: ow.C.colors, dim: s.n.kind === 'level' && !s.n.done, night: this.night(s.n), mem: {}, rng: TourOWPaint.rng(ow.cc + s.key) }, s);
      S.anchor = (R, wet) => { const p = this.anchor(ow, s, R, wet); if (p) used.push({ x: p.x, y: p.y, big: R }); return p; };
      S.take = (gap, wet) => { const L = wet ? wetSlots : slots; for (const p of L) if (used.every(u => Math.hypot(u.x - p.x, u.y - p.y) >= (gap || 24))) { used.push(p); return p; } return null; };
      S.col = col => S.dim ? mix(col, '#8a86a0', 0.32) : col;
      c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = this.INK; c.lineWidth = 1.7;
      K.paint.call(this, c, S);
      if (s.n.kind === 'level' && s.n.done && !K.noPennants) this.pennants(c, S);
      c.restore();
      ow.sceneMem[s.key] = S;
    }
    if (TourOWScenes.landPaint[ow.cc]) TourOWScenes.landPaint[ow.cc].call(this, c, ow);
  },
  live(ctx, ow, vr) {
    const t = ow.t, mem = ow.sceneMem || {};
    for (const key in mem) {
      const S = mem[key], K = this.kinds[S.kind];
      if (S.x < vr.x0 - 160 || S.x > vr.x1 + 160 || S.y < vr.y0 - 160 || S.y > vr.y1 + 200) continue;
      ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = this.INK; ctx.lineWidth = 1.6;
      if (S.night) this.stars(ctx, S, t);
      if (K.live) K.live.call(this, ctx, S, t);
      ctx.restore();
    }
    // the Baron's blimp hangs over a boss fort until the boss falls
    for (const n of ow.nodes) if (n.boss && n.visible && !n.done) { const p = ow.G.pos[n.key]; if (p && p.x > vr.x0 - 80 && p.x < vr.x1 + 80 && p.y > vr.y0 - 40 && p.y < vr.y1 + 140) TourPanelFx.airship(ctx, p.x + 34, p.y - 74 + Math.sin(t * 1.3) * 3, t); }
    const L = ow.G.M.live || [];
    for (const l of L) { const f = this.liveKinds[l[0]]; if (f) { ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = this.INK; ctx.lineWidth = 1.6; f.call(this, ctx, ow, l, t, vr); ctx.restore(); } }
  },
  over(ctx, ow, vr) {},
  landPaint: {},

  /* ---------- shared bits ---------- */
  // a night level's scene sits on a dusk-blue ground with a moon over it; its stars twinkle
  nightDome(c, S, p, R) {
    S.mem.dome = { x: p.x, y: p.y, R };
    const g = c.createRadialGradient(p.x, p.y - R * 0.3, R * 0.2, p.x, p.y - R * 0.3, R * 1.25);
    g.addColorStop(0, 'rgba(30,34,96,0.42)'); g.addColorStop(0.7, 'rgba(30,34,96,0.26)'); g.addColorStop(1, 'rgba(30,34,96,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(p.x, p.y - R * 0.3, R * 1.3, R * 1.05, 0, 0, TAU); c.fill();
    c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(p.x + R * 0.75, p.y - R * 1.05, 7, 0, TAU); c.fill(); c.fillStyle = 'rgba(40,44,110,0.95)'; c.beginPath(); c.arc(p.x + R * 0.75 + 3.5, p.y - R * 1.05 - 2.5, 6.2, 0, TAU); c.fill();
  },
  stars(ctx, S, t) {
    const d = S.mem.dome; if (!d) return; const R = TourOWPaint.rng(S.key + 'stars');
    for (let i = 0; i < 8; i++) { const x = d.x + (R() - 0.5) * d.R * 2.2, y = d.y - d.R * 0.6 - R() * d.R * 0.7, a = 0.35 + 0.65 * Math.abs(Math.sin(t * 2 + i * 1.7)); ctx.fillStyle = `rgba(255,250,220,${a})`; ctx.beginPath(); TourKit.star(ctx, x, y, 2.4, 0.9, 4); ctx.fill(); }
  },
  // a scene's ground: a flat disc of plaza / sand / moss with an ink rim
  base(c, S, p, rx, ry, col, rim) {
    c.fillStyle = 'rgba(20,14,30,0.18)'; c.beginPath(); c.ellipse(p.x, p.y + 3, rx + 2, ry + 1, 0, 0, TAU); c.fill();
    c.fillStyle = S.col(col); c.beginPath(); c.ellipse(p.x, p.y, rx, ry, 0, 0, TAU); c.fill(); c.lineWidth = 1.5; c.stroke(); c.lineWidth = 1.7;
    if (rim) { c.strokeStyle = rgba(S.col(rim), 0.6); c.lineWidth = 1.2; c.beginPath(); c.ellipse(p.x, p.y, rx - 4, ry - 3, 0, 0, TAU); c.stroke(); c.strokeStyle = this.INK; c.lineWidth = 1.7; }
  },
  // a cleared stop: a string of pennants in the land's colours between two poles
  pennants(c, S) {
    const p = S.take(40); if (!p) return;
    const cols = [S.cols.a, S.cols.b, S.cols.c], x0 = p.x - 18, x1 = p.x + 18, y = p.y - 20;
    c.lineWidth = 1.4; c.beginPath(); c.moveTo(x0, p.y); c.lineTo(x0, y); c.moveTo(x1, p.y); c.lineTo(x1, y); c.stroke();
    c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo(p.x, y + 8, x1, y); c.stroke();
    for (let i = 1; i < 6; i++) { const u = i / 6, x = x0 + (x1 - x0) * u, yy = y + 8 * 2 * u * (1 - u) * 2; c.fillStyle = cols[i % 3]; c.beginPath(); c.moveTo(x - 2.6, yy); c.lineTo(x + 2.6, yy); c.lineTo(x, yy + 6); c.closePath(); c.fill(); c.lineWidth = 0.8; c.stroke(); }
  },
  // smoke puffs rising from (x, y)
  smoke(ctx, x, y, t, s, col) {
    s = s || 1;
    for (let i = 0; i < 5; i++) {
      const k = ((t * 0.35 + i / 5) % 1), r = (4 + k * 10) * s;
      ctx.fillStyle = col ? rgba(col, 0.75 * (1 - k)) : `rgba(240,236,232,${0.8 * (1 - k)})`;
      ctx.beginPath(); ctx.arc(x + Math.sin(t * 1.3 + i * 2) * 4 * s + k * 10 * s, y - k * 46 * s, r, 0, TAU); ctx.fill();
    }
  },
  bird(ctx, x, y, f, s) { s = s || 1; ctx.beginPath(); ctx.moveTo(x - 5 * s, y - f); ctx.quadraticCurveTo(x - 2.5 * s, y - 2.5 * s, x, y); ctx.quadraticCurveTo(x + 2.5 * s, y - 2.5 * s, x + 5 * s, y - f); ctx.stroke(); },

  /* ---------- props ---------- */
  prop: {
    // a market stall: two poles, a counter, a striped awning (scalloped)
    stall(c, x, y, a, b, S, w) {
      w = w || 24; const T = TourOWScenes, h = 18;
      T.shadow(c, x, y, w * 0.6);
      T.R(c, x - w / 2 + 2, y - 9, w - 4, 9, S.col('#c88a52'));
      c.fillStyle = S.col('#a86a3a'); c.fillRect(x - w / 2 + 2, y - 9, w - 4, 2.5);
      c.beginPath(); c.moveTo(x - w / 2 + 2, y - 9); c.lineTo(x - w / 2 + 2, y - h); c.moveTo(x + w / 2 - 2, y - 9); c.lineTo(x + w / 2 - 2, y - h); c.stroke();
      const n = 4, sw = (w + 4) / n;
      for (let i = 0; i < n; i++) { c.fillStyle = S.col(i % 2 ? b : a); c.beginPath(); c.moveTo(x - w / 2 - 2 + i * sw, y - h - 6); c.lineTo(x - w / 2 - 2 + (i + 1) * sw, y - h - 6); c.lineTo(x - w / 2 - 2 + (i + 1) * sw, y - h); c.arc(x - w / 2 - 2 + (i + 0.5) * sw, y - h, sw / 2, 0, Math.PI); c.closePath(); c.fill(); }
      c.beginPath(); c.rect(x - w / 2 - 2, y - h - 6, w + 4, 6); c.stroke();
      // goods on the counter
      const goods = [S.col('#ff8a2a'), S.col('#e8323a'), S.col('#7ac850'), S.col('#ffd23a')];
      c.lineWidth = 0.9; for (let i = 0; i < 4; i++) T.O(c, x - w / 2 + 6 + i * (w - 10) / 3, y - 10.5, 2.4, goods[(i + Math.floor(x)) % 4]); c.lineWidth = 1.7;
    },
    crate(c, x, y, fruit, S) { const T = TourOWScenes; T.shadow(c, x, y, 7); T.R(c, x - 6, y - 8, 12, 8, S.col('#c08850')); c.lineWidth = 0.9; for (let i = 0; i < 3; i++) T.O(c, x - 3.5 + i * 3.5, y - 9.5, 2.2, S.col(fruit)); c.lineWidth = 1.7; },
    // a house: walls, a roof, a door and windows (lit at night)
    house(c, x, y, w, h, wall, roof, S, flat) {
      const T = TourOWScenes; T.shadow(c, x, y, w * 0.55);
      c.fillStyle = S.col(shade(wall, -0.2)); c.fillRect(x + w / 2 - 3, y - h, 3, h);
      T.R(c, x - w / 2, y - h, w, h, S.col(wall));
      if (flat) { T.R(c, x - w / 2 - 1.5, y - h - 2.5, w + 3, 2.5, S.col(shade(wall, -0.12))); }
      else T.P(c, [[x - w / 2 - 2.5, y - h], [x, y - h - h * 0.55], [x + w / 2 + 2.5, y - h]], S.col(roof));
      c.fillStyle = '#3a2a3a'; c.fillRect(x - 2, y - 6, 4, 6);
      c.fillStyle = S.night ? '#ffd86a' : S.col('#5a7aa8'); if (w > 12) { c.fillRect(x - w / 2 + 2.5, y - h + 3, 3, 3); c.fillRect(x + w / 2 - 5.5, y - h + 3, 3, 3); }
    },
    // a flat-bottomed boat; opts: arch of flowers (a trajinera), sail
    boat(c, x, y, col, o) {
      o = o || {}; const T = TourOWScenes, w = o.w || 22;
      c.beginPath(); c.moveTo(x - w / 2, y - 5); c.lineTo(x + w / 2, y - 5); c.lineTo(x + w / 2 - 4, y); c.lineTo(x - w / 2 + 4, y); c.closePath(); c.fillStyle = col; c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(x - w / 2 + 3, y - 4, w - 6, 1.4);
      if (o.arch) { c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - w / 2 + 3, y - 5); c.lineTo(x - w / 2 + 3, y - 13); c.lineTo(x + w / 2 - 3, y - 13); c.lineTo(x + w / 2 - 3, y - 5); c.stroke(); c.fillStyle = o.arch; c.fillRect(x - w / 2 + 1, y - 16, w - 2, 4); c.strokeRect(x - w / 2 + 1, y - 16, w - 2, 4); c.fillStyle = '#ffd23a'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x - w / 2 + 4 + i * (w - 8) / 3, y - 14, 1.6, 0, TAU); c.fill(); } c.lineWidth = 1.6; }
      if (o.sail) { c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x, y - 24); c.stroke(); T.P(c, [[x + 1, y - 23], [x + 1, y - 8], [x + 12, y - 8]], o.sail); }
    },
    dog(c, x, y, S) { const T = TourOWScenes; T.shadow(c, x, y, 6); T.O(c, x, y - 5, 5.5, S.col('#4a4458'), 3.6); T.O(c, x + 5, y - 9, 3.4, S.col('#4a4458')); c.beginPath(); c.moveTo(x + 4, y - 12); c.lineTo(x + 5, y - 16); c.lineTo(x + 7, y - 12); c.fillStyle = S.col('#4a4458'); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x - 5, y - 6); c.quadraticCurveTo(x - 9, y - 10, x - 8, y - 13); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 6, y - 9.5, 0.9, 0, TAU); c.fill(); },
    // a hanging piñata (a little star with streamers)
    pinata(c, x, y, t, S) { c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 30); c.lineTo(x, y - 22); c.stroke(); c.lineWidth = 1.4; c.save(); c.translate(x, y - 16); c.rotate(Math.sin(t * 2) * 0.15); c.fillStyle = S.col('#ff4f8a'); c.beginPath(); TourKit.star(c, 0, 0, 7, 3.2, 5); c.fill(); c.stroke(); c.fillStyle = '#ffd23a'; c.beginPath(); c.arc(0, 0, 2, 0, TAU); c.fill(); c.restore(); },
    agave(c, x, y, s, S) { c.fillStyle = S.col('#6aa08a'); for (let i = 0; i < 7; i++) { const a = -Math.PI + 0.25 + i * 0.44; c.beginPath(); c.moveTo(x - 1.6, y); c.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s * 1.1 - 1); c.lineTo(x + 1.6, y); c.closePath(); c.fill(); c.stroke(); } },
    fern(c, x, y, s, S) { c.fillStyle = S.col('#3f8a4a'); for (let i = 0; i < 5; i++) { const a = -Math.PI + 0.5 + i * 0.55; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * s * 0.6, y + Math.sin(a) * s - 4, x + Math.cos(a) * s, y + Math.sin(a) * s * 0.7); c.quadraticCurveTo(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.4, x, y); c.fill(); c.stroke(); } },
    rock(c, x, y, s, col, S) { TourOWScenes.P(c, [[x - s, y], [x - s * 0.7, y - s * 0.7], [x, y - s * 0.95], [x + s * 0.7, y - s * 0.6], [x + s, y]], S.col(col || '#9a96a8')); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x - s * 0.4, y - s * 0.7, s * 0.4, 1.5); },
    pole(c, x, y, h) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.stroke(); }
  },

  /* ---------- scene kinds ---------- */
  kinds: {
    // 1-1 the market: a plaza with three stalls, crates of fruit, a line of paper flags and a piñata
    market: {
      paint(c, S) {
        const p = S.anchor(46); if (!p) return; S.mem.p = p; const P = this.prop;
        if (S.night) this.nightDome(c, S, p, 46);
        this.base(c, S, p, 50, 27, '#e8cfa0', '#c8a878');
        c.fillStyle = rgba(S.col('#c8a878'), 0.5); for (let i = 0; i < 14; i++) { const R = S.rng(); c.fillRect(p.x - 40 + (i * 37 % 80), p.y - 14 + (i * 13 % 26), 5, 3); }
        P.stall(c, p.x + 2, p.y - 9, '#18c2c2', '#fff4e0', S, 26);
        P.stall(c, p.x - 25, p.y - 1, '#ff3d8b', '#fff4e0', S, 26);
        P.stall(c, p.x + 27, p.y + 1, '#ffb81a', '#e8323a', S, 26);
        P.crate(c, p.x - 9, p.y + 15, '#ff8a2a', S); P.crate(c, p.x + 10, p.y + 17, '#e8323a', S); P.crate(c, p.x + 1, p.y + 21, '#7ac850', S);
        P.pole(c, p.x - 46, p.y + 6, 40); P.pole(c, p.x + 46, p.y + 6, 40);
      },
      live(ctx, S, t) {
        const p = S.mem.p; if (!p) return;
        const y0 = p.y - 34, sag = 9 + Math.sin(t * 2) * 1.5, cols = ['#ff3d8b', '#18c2c2', '#ffb81a', '#7ac850', '#a86ad8'];
        ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x - 46, y0); ctx.quadraticCurveTo(p.x, y0 + sag * 2, p.x + 46, y0); ctx.stroke();
        for (let i = 1; i < 10; i++) { const u = i / 10, x = p.x - 46 + 92 * u, y = y0 + sag * 4 * u * (1 - u), sw = Math.sin(t * 3 + i) * 1.2; ctx.fillStyle = S.col(cols[i % 5]); ctx.beginPath(); ctx.moveTo(x - 3.5, y); ctx.lineTo(x + 3.5, y); ctx.lineTo(x + 3 + sw, y + 7); ctx.lineTo(x - 3 + sw, y + 7); ctx.closePath(); ctx.fill(); ctx.lineWidth = 0.7; ctx.stroke(); }
        ctx.lineWidth = 1.5; this.prop.pinata(ctx, p.x, p.y - 2 + sag, t, S);
      }
    },
    // 1-2 the canals: flower boats along the canal, garden plots on the water
    canals: {
      paint(c, S) {
        const p = S.anchor(40); if (!p) return; S.mem.p = p;
        this.base(c, S, p, 44, 24, '#3aa8b8', '#8ad8e0');
        const plot = (x, y, w, h, crop) => { c.fillStyle = S.col('#6a4a30'); c.beginPath(); c.rect(x - w / 2, y - h / 2, w, h); c.fill(); c.stroke(); for (let i = 0; i < 3; i++) { c.fillStyle = S.col(crop[i % crop.length]); for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x - w / 2 + 4 + k * (w - 8) / 3, y - h / 2 + 3 + i * (h - 6) / 2, 1.8, 0, TAU); c.fill(); } } };
        plot(p.x - 22, p.y - 6, 22, 14, ['#ff3d8b', '#ffd23a']); plot(p.x + 12, p.y - 9, 24, 13, ['#7ac850', '#e8323a']); plot(p.x - 2, p.y + 10, 26, 12, ['#ffb81a', '#ff8ad0']);
        this.prop.boat(c, p.x + 30, p.y + 9, S.col('#ff3d8b'), { arch: S.col('#ffd23a'), w: 18 });
      },
      live(ctx, S, t) {
        const R = S.ow.G.rivers[S.o.river || 0]; if (!R) return;
        const P = S.mem.P || (S.mem.P = OWGeo.resample(R.pts, 6));
        const boats = [['#ff3d8b', '#ffd23a'], ['#18c2c2', '#ff8ad0'], ['#ffb81a', '#7ac850']];
        boats.forEach((b, i) => { const k = (Math.sin(t * 0.07 + i * 2.1) * 0.5 + 0.5) * 0.76 + 0.12, p = OWGeo.at(P, P.len * k); this.prop.boat(ctx, p.x, p.y + 4, b[0], { arch: b[1], w: 18 }); });
      }
    },
    // 1-3 the cenote: a round limestone sinkhole with deep blue water, vines and a beam of light
    cenote: {
      paint(c, S) {
        const p = S.anchor(42); if (!p) return; S.mem.p = p; const P = this.prop;
        this.base(c, S, p, 46, 26, '#4f8a4a');
        c.fillStyle = S.col('#e2d4b2'); c.beginPath(); c.ellipse(p.x, p.y, 32, 16, 0, 0, TAU); c.fill(); c.stroke();
        const g = c.createLinearGradient(0, p.y - 10, 0, p.y + 12); g.addColorStop(0, S.col('#0a4a6a')); g.addColorStop(1, S.col('#2ac0d0'));
        c.fillStyle = g; c.beginPath(); c.ellipse(p.x, p.y + 3, 25, 10, 0, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(p.x + 6, p.y + 6, 9, 2.2, 0, 0, TAU); c.fill();
        c.lineWidth = 1.3; c.strokeStyle = S.col('#2f7a3a'); for (const dx of [-20, -9, 4, 16]) { c.beginPath(); c.moveTo(p.x + dx, p.y - 13 + Math.abs(dx) * 0.15); c.bezierCurveTo(p.x + dx + 3, p.y - 7, p.x + dx - 2, p.y - 2, p.x + dx + 1, p.y + 3); c.stroke(); } c.strokeStyle = this.INK; c.lineWidth = 1.7;
        P.fern(c, p.x - 36, p.y + 4, 10, S); P.fern(c, p.x + 36, p.y + 2, 9, S); P.fern(c, p.x - 14, p.y + 21, 8, S);
        c.save(); c.translate(p.x + 30, p.y - 10); TourOWPaint.art.palm.call(TourOWPaint, c, 18, { v: 0.2 }); c.restore();
      },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,250,200,${0.18 + 0.07 * Math.sin(t * 1.5)})`; ctx.beginPath(); ctx.moveTo(p.x - 8, p.y - 70); ctx.lineTo(p.x + 4, p.y - 70); ctx.lineTo(p.x + 16, p.y + 4); ctx.lineTo(p.x - 6, p.y + 4); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < 4; i++) { const k = (t * 0.5 + i / 4) % 1; ctx.beginPath(); ctx.arc(p.x - 10 + i * 7, p.y + 5 - k * 7, 1.5 * (1 - k) + 0.4, 0, TAU); ctx.fill(); } }
    },
    // 1-4 the volcano: lava runs down its side, smoke and a glow from the crater
    volcano: {
      paint(c, S) {
        const v = (S.ow.G.M.feat || []).find(f => f[0] === 'volcano'); if (!v) return;
        const r = v[3], h = r * 1.2, x = v[1], y = v[2];
        c.lineWidth = 1.4; c.fillStyle = S.col('#ff7a2a');
        for (const [dx, bend] of [[-0.12, -0.35], [0.08, 0.3]]) { c.beginPath(); c.moveTo(x + dx * r - 3, y - h + 4); c.quadraticCurveTo(x + (dx + bend) * r, y - h * 0.5, x + (dx + bend * 1.3) * r - 3, y - 4); c.lineTo(x + (dx + bend * 1.3) * r + 4, y - 4); c.quadraticCurveTo(x + (dx + bend) * r + 6, y - h * 0.5, x + dx * r + 3, y - h + 4); c.closePath(); c.fill(); c.stroke(); }
        c.lineWidth = 1.7; const P = this.prop; for (let i = 0; i < 4; i++) { const q = S.take(18); if (q) P.rock(c, q.x, q.y, 5 + (i % 3) * 2, '#7a6464', S); }
        S.mem.v = { x, y: y - h };
      },
      live(ctx, S, t) {
        const v = S.mem.v; if (!v) return;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,120,40,${0.28 + 0.15 * Math.sin(t * 3)})`; ctx.beginPath(); ctx.ellipse(v.x, v.y, 18, 8, 0, 0, TAU); ctx.fill(); ctx.restore();
        this.smoke(ctx, v.x, v.y - 4, t, 1.4, S.n.done ? null : '#8a8090');
        // lava bombs
        for (let i = 0; i < 2; i++) { const k = (t * 0.7 + i * 0.5) % 1, dx = (i ? 1 : -1) * k * 30, dy = -Math.sin(k * Math.PI) * 34; ctx.fillStyle = '#ffb04a'; ctx.beginPath(); ctx.arc(v.x + dx, v.y - 4 + dy, 2.4 * (1 - k * 0.5), 0, TAU); ctx.fill(); ctx.stroke(); }
      }
    },
    // 1-5 the hacienda: adobe walls behind the fort, rows of agave, a cart; string lights at night
    hacienda: {
      paint(c, S) {
        const P = this.prop;
        if (S.night) this.nightDome(c, S, { x: S.x, y: S.y - 8 }, 56);
        // a wall arc behind the fort
        c.fillStyle = S.col('#d8a878'); c.lineWidth = 1.5;
        for (let i = -3; i <= 3; i++) { if (Math.abs(i) < 1) continue; const x = S.x + i * 15, y = S.y - 28 + Math.abs(i) * 6; c.fillRect(x - 7.5, y - 9, 15, 9); c.strokeRect(x - 7.5, y - 9, 15, 9); c.fillStyle = S.col('#c89868'); c.fillRect(x - 7.5, y - 9, 15, 2.5); c.fillStyle = S.col('#d8a878'); }
        c.lineWidth = 1.7;
        for (let i = 0; i < 6; i++) { const q = S.take(16); if (q) P.agave(c, q.x, q.y, 7, S); }
        const q = S.take(30); if (q) { this.shadow(c, q.x, q.y, 12); this.R(c, q.x - 10, q.y - 9, 20, 7, S.col('#b07a46')); this.O(c, q.x - 6, q.y - 1, 4, S.col('#7a5434')); this.O(c, q.x + 6, q.y - 1, 4, S.col('#7a5434')); c.fillStyle = S.col('#ff8a2a'); c.beginPath(); c.arc(q.x - 2, q.y - 11, 3, 0, TAU); c.arc(q.x + 3, q.y - 11, 3, 0, TAU); c.fill(); }
      },
      live(ctx, S, t) { if (!S.n.done) return; const k = (t * 0.6) % 1, x = S.x + Math.sin(Math.floor(t * 0.6) * 2.3) * 40, y = S.y - 90 - k * 30; const cols = [S.cols.a, S.cols.b, S.cols.c]; ctx.globalAlpha = 1 - k; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ctx.fillStyle = cols[i % 3]; ctx.fillRect(x + Math.cos(a) * k * 24 - 1.5, y + Math.sin(a) * k * 24 - 1.5, 3, 3); } ctx.globalAlpha = 1; },
      noPennants: true
    },
    // 1-6 a deep pit in the jungle with swallows circling out of it
    pit: {
      paint(c, S) {
        const p = S.anchor(42); if (!p) return; S.mem.p = p;
        this.base(c, S, p, 46, 26, '#4f8a4a');
        c.fillStyle = S.col('#9a8a72'); c.beginPath(); c.ellipse(p.x, p.y, 32, 16, 0, 0, TAU); c.fill(); c.stroke();
        const g = c.createRadialGradient(p.x, p.y + 2, 2, p.x, p.y + 2, 26); g.addColorStop(0, '#04020a'); g.addColorStop(1, S.col('#3a2e3a'));
        c.fillStyle = g; c.beginPath(); c.ellipse(p.x, p.y + 2, 26, 11, 0, 0, TAU); c.fill(); c.stroke();
        this.prop.fern(c, p.x - 36, p.y + 4, 10, S); this.prop.fern(c, p.x + 35, p.y + 2, 10, S);
      },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; ctx.lineWidth = 1.4; for (let i = 0; i < 5; i++) { const a = t * (0.9 + i * 0.12) + i * 1.3, x = p.x + Math.cos(a) * (14 + i * 5), y = p.y - 14 - i * 5 + Math.sin(a) * 6; this.bird(ctx, x, y, Math.sin(t * 12 + i) * 2.4, 0.85); } }
    },
    // a souvenir stand: its keeper sits by the stall (Xolo the dog in Mexico)
    keeper: {
      paint(c, S) { const p = S.take(22); if (p) this.prop.dog(c, p.x, p.y, Object.assign({}, S, { dim: false })); },
      noPennants: true
    },
    // the airstrip: fuel drums and a hangar
    airstrip: {
      paint(c, S) {
        const p = S.take(36); if (p) { this.shadow(c, p.x, p.y, 16); this.R(c, p.x - 14, p.y - 13, 28, 13, '#c8c8d4'); c.beginPath(); c.moveTo(p.x - 14, p.y - 13); c.quadraticCurveTo(p.x, p.y - 26, p.x + 14, p.y - 13); c.fillStyle = '#a8a8b8'; c.fill(); c.stroke(); c.fillStyle = '#3a3a4a'; c.fillRect(p.x - 6, p.y - 9, 12, 9); }
        const q = S.take(16); if (q) { for (let i = 0; i < 2; i++) { this.R(c, q.x - 7 + i * 7, q.y - 9, 6, 9, i ? '#e8423a' : '#3a8ad8'); } }
      },
      noPennants: true
    }
  },
  // land-wide moving bits: ['sail', [[x, y], ...]] a boat sailing a loop offshore, ['birds', x, y]
  liveKinds: {
    sail(ctx, ow, l, t, vr) {
      const pts = l[1], P = l.P || (l.P = OWGeo.resample(OWGeo.spline(TourOW.pairs(pts), true, 8), 6)), k = (t * (l[2] || 12) / P.len) % 1, p = OWGeo.at(P, P.len * k);
      if (p.x < vr.x0 - 40 || p.x > vr.x1 + 40 || p.y < vr.y0 - 40 || p.y > vr.y1 + 40) return;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x - (p.dx > 0 ? 14 : -14), p.y + 1); ctx.lineTo(p.x, p.y + 1); ctx.stroke(); ctx.strokeStyle = TourOWScenes.INK;
      ctx.save(); ctx.translate(p.x, p.y); if (p.dx < 0) ctx.scale(-1, 1); this.prop.boat(ctx, 0, 0, l[3] || '#f4ede0', { sail: l[4] || ow.C.colors.a, w: 20 }); ctx.restore();
    },
    smoke(ctx, ow, l, t) { this.smoke(ctx, l[1], l[2], t, l[3] || 1); }
  }
};
