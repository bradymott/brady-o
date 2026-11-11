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
    const M = ow.G.M, sc = Object.assign({ start: 'airstrip' }, M.scenes || {}), out = [];
    for (const n of ow.nodes) if (n.kind === 'house' && !sc[n.key]) sc[n.key] = 'keeper';
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
  groundPaint: {
    // Ecuador: the equator runs right across the island
    ec(c, ow) {
      const y = (ow.G.pos['2-1'] || { y: 700 }).y + 2;
      c.beginPath(); for (const r of ow.G.land) { c.moveTo(r[0][0], r[0][1]); for (const p of r) c.lineTo(p[0], p[1]); c.closePath(); } c.clip();
      c.fillStyle = 'rgba(232,50,58,0.85)'; c.fillRect(0, y - 3, ow.G.w, 6); c.fillStyle = 'rgba(255,210,58,0.9)'; for (let x = 0; x < ow.G.w; x += 24) c.fillRect(x, y - 1, 12, 2);
    }
  },

  /* ---------- shared bits ---------- */
  // a night level's scene sits on a dusk-blue ground with a moon over it; its stars twinkle
  nightDome(c, S, p, R) {
    // a dome of night sky behind the scene, fading into the ground at its foot
    S.mem.dome = { x: p.x, y: p.y, R };
    const g = c.createRadialGradient(p.x, p.y + R * 0.15, R * 0.2, p.x, p.y + R * 0.15, R * 1.5);
    g.addColorStop(0, 'rgba(26,28,80,0.88)'); g.addColorStop(0.7, 'rgba(34,38,100,0.62)'); g.addColorStop(1, 'rgba(34,38,100,0)');
    c.fillStyle = g; c.beginPath(); c.ellipse(p.x, p.y + R * 0.15, R * 1.5, R * 1.35, 0, Math.PI, 0); c.closePath(); c.fill();
    c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(p.x + R * 0.7, p.y - R * 1.05, 7, 0, TAU); c.fill(); c.fillStyle = 'rgba(28,30,84,1)'; c.beginPath(); c.arc(p.x + R * 0.7 + 3.5, p.y - R * 1.05 - 2.5, 6.2, 0, TAU); c.fill();
  },
  stars(ctx, S, t) {
    const d = S.mem.dome; if (!d) return; const R = TourOWPaint.rng(S.key + 'stars');
    for (let i = 0; i < 8; i++) { const x = d.x + (R() - 0.5) * d.R * 1.8, y = d.y - d.R * 0.7 - R() * d.R * 0.75, a = 0.35 + 0.65 * Math.abs(Math.sin(t * 2 + i * 1.7)); ctx.fillStyle = `rgba(255,250,220,${a})`; ctx.beginPath(); TourKit.star(ctx, x, y, 2.4, 0.9, 4); ctx.fill(); }
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

  /* ---------- little animals (keepers and passers-by), facing f (1 = right) ---------- */
  critter(c, kind, x, y, S, f) {
    f = f || 1; const T = this, col = S.col || (x2 => x2);
    c.save(); c.translate(x, y); c.scale(f, 1); T.shadow(c, 0, 0, 7);
    const eye = (ex, ey) => { c.fillStyle = '#1c1426'; c.beginPath(); c.arc(ex, ey, 1, 0, TAU); c.fill(); };
    switch (kind) {
      case 'dog': T.O(c, 0, -5, 5.5, col('#4a4458'), 3.6); T.O(c, 5, -9, 3.4, col('#4a4458')); T.P(c, [[4, -11.5], [5, -16], [7, -11.5]], col('#4a4458')); c.beginPath(); c.moveTo(-5, -6); c.quadraticCurveTo(-9, -10, -8, -13); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(6, -9.5, 0.9, 0, TAU); c.fill(); break;
      case 'booby': T.O(c, 0, -8, 4.5, '#f4eee0', 6); T.O(c, 2, -15, 3, '#8a7a6a'); T.P(c, [[4.5, -15.5], [9, -14.5], [4.5, -13.5]], '#5a6a8a'); c.fillStyle = '#3ab0e8'; c.fillRect(-3, -2, 3, 2); c.fillRect(1, -2, 3, 2); eye(3, -15.5); break;
      case 'coati': T.O(c, 0, -5, 6.5, '#a0704a', 4); T.P(c, [[5, -7], [11, -5], [5, -3]], '#a0704a'); c.lineWidth = 3; c.strokeStyle = '#7a5434'; c.beginPath(); c.moveTo(-6, -6); c.quadraticCurveTo(-10, -14, -6, -18); c.stroke(); c.lineWidth = 1.7; c.strokeStyle = T.INK; eye(7, -6); break;
      case 'hornbill': T.O(c, 0, -8, 4.5, '#2a2a3a', 6); T.P(c, [[3, -14], [11, -12], [3, -10]], '#ffb83a'); c.fillStyle = '#ffd23a'; c.fillRect(3, -16, 5, 2.5); eye(2, -13); break;
      case 'fennec': T.O(c, 0, -5, 5, '#f0d0a0', 3.6); T.O(c, 5, -9, 3.2, '#f0d0a0'); T.P(c, [[3, -11], [2, -19], [6, -11.5]], '#f0d0a0'); T.P(c, [[6, -11.5], [9, -18], [8, -10.5]], '#f0d0a0'); eye(6.5, -9.5); break;
      case 'stork': c.beginPath(); c.moveTo(-1, 0); c.lineTo(-1, -8); c.moveTo(1.5, 0); c.lineTo(1.5, -8); c.strokeStyle = '#e8503a'; c.stroke(); c.strokeStyle = T.INK; T.O(c, 0, -11, 5, '#ffffff', 3.4); c.fillStyle = '#1c1426'; c.fillRect(-5, -12, 4, 3); T.O(c, 3, -19, 2.4, '#ffffff'); c.beginPath(); c.moveTo(2, -14); c.lineTo(3, -17); c.stroke(); T.P(c, [[5, -19.5], [11, -18.5], [5, -18]], '#e8503a'); break;
      case 'hedgehog': c.fillStyle = '#7a5a40'; c.beginPath(); for (let i = 0; i <= 8; i++) { const a = Math.PI + i * Math.PI / 8, r = i % 2 ? 6 : 8.5; c.lineTo(Math.cos(a) * r, -3 + Math.sin(a) * r * 0.8); } c.closePath(); c.fill(); c.stroke(); T.O(c, 6, -3.5, 3, '#e8c8a0'); eye(7, -4.5); break;
      case 'goose': T.O(c, 0, -6, 6, '#ffffff', 4); c.lineWidth = 3; c.strokeStyle = '#ffffff'; c.beginPath(); c.moveTo(4, -8); c.quadraticCurveTo(6, -14, 5, -18); c.stroke(); c.lineWidth = 1.7; c.strokeStyle = T.INK; T.O(c, 5, -18, 2.6, '#ffffff'); T.P(c, [[7, -18.5], [11, -17.5], [7, -16.5]], '#ff8a2a'); eye(5.5, -18.5); break;
      case 'gecko': c.lineWidth = 2.6; c.strokeStyle = '#5ac87a'; c.beginPath(); c.moveTo(-9, -2); c.quadraticCurveTo(-4, -6, 2, -3); c.stroke(); c.lineWidth = 1.7; c.strokeStyle = T.INK; T.O(c, 4, -3.5, 3.4, '#5ac87a', 2.6); eye(5, -4.5); c.fillStyle = '#ff8a2a'; c.fillRect(-4, -5, 2, 2); break;
      case 'buffalo': T.O(c, 0, -7, 8, '#5a5a6a', 5); T.O(c, 8, -8, 4, '#5a5a6a', 3.4); c.lineWidth = 2; c.beginPath(); c.moveTo(6, -11); c.quadraticCurveTo(4, -16, 0, -15); c.moveTo(10, -11); c.quadraticCurveTo(13, -16, 16, -14); c.stroke(); c.lineWidth = 1.7; c.fillRect(-5, -3, 2.5, 3); c.fillRect(3, -3, 2.5, 3); eye(9, -8.5); break;
      case 'shiba': T.O(c, 0, -5, 5.5, '#e8a050', 3.6); T.O(c, 5, -9.5, 3.6, '#e8a050'); T.P(c, [[3.5, -12], [4, -16], [6.5, -12.5]], '#e8a050'); T.P(c, [[6.5, -12.5], [8.5, -15.5], [8.5, -11]], '#e8a050'); c.fillStyle = '#fff4e0'; c.beginPath(); c.arc(7, -8, 1.8, 0, TAU); c.fill(); c.beginPath(); c.arc(-5, -9, 3, Math.PI * 0.8, Math.PI * 2.3); c.stroke(); eye(6, -10.5); break;
      case 'redpanda': T.O(c, 0, -5, 5.5, '#c8502a', 3.6); T.O(c, 5, -9.5, 3.6, '#c8502a'); c.fillStyle = '#fff4e0'; c.beginPath(); c.arc(7, -9, 1.6, 0, TAU); c.fill(); c.lineWidth = 3; c.strokeStyle = '#a8402a'; c.beginPath(); c.moveTo(-5, -5); c.quadraticCurveTo(-11, -6, -10, -12); c.stroke(); c.lineWidth = 1.7; c.strokeStyle = T.INK; eye(6, -10.5); break;
      case 'penguin': T.O(c, 0, -8, 4.6, '#26283a', 7.4); c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(1, -7, 2.8, 5.6, 0, 0, TAU); c.fill(); T.P(c, [[3, -13], [7, -12.5], [3, -11.5]], '#ffb83a'); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(2.5, -13.5, 1, 0, TAU); c.fill(); break;
      case 'ostrich': c.beginPath(); c.moveTo(-1, 0); c.lineTo(-2, -9); c.moveTo(2, 0); c.lineTo(2, -9); c.stroke(); T.O(c, 0, -12, 6.5, '#2a2a34', 4.4); c.fillStyle = '#fff'; c.fillRect(-6, -13, 3, 3); c.lineWidth = 2.2; c.strokeStyle = '#e8b0a0'; c.beginPath(); c.moveTo(4, -14); c.quadraticCurveTo(6, -20, 5, -24); c.stroke(); c.lineWidth = 1.7; c.strokeStyle = T.INK; T.O(c, 5.5, -24.5, 2.2, '#e8b0a0'); eye(6, -25); break;
      case 'camel': c.beginPath(); for (const lx of [-6, -3, 4, 7]) { c.moveTo(lx, 0); c.lineTo(lx, -8); } c.stroke(); T.O(c, 0, -11, 9, '#d8a868', 4.5); T.O(c, -2, -15, 4.5, '#d8a868', 4); c.lineWidth = 2.6; c.strokeStyle = '#d8a868'; c.beginPath(); c.moveTo(8, -12); c.quadraticCurveTo(12, -16, 12, -19); c.stroke(); c.lineWidth = 1.7; c.strokeStyle = T.INK; T.O(c, 13, -19.5, 2.6, '#d8a868', 2); eye(13.5, -20); break;
      case 'yak': c.fillStyle = '#3a2a2a'; for (const lx of [-6, -2, 3, 6]) c.fillRect(lx - 1, -5, 2.4, 5); T.O(c, 0, -9, 9, '#4a3a34', 5.5); c.fillStyle = '#4a3a34'; c.beginPath(); for (let i = 0; i < 7; i++) c.lineTo(-8 + i * 2.6, -4 + (i % 2) * 2); c.lineTo(8, -9); c.fill(); T.O(c, 9, -10, 3.6, '#4a3a34'); c.lineWidth = 1.4; c.strokeStyle = '#f0e8d8'; c.beginPath(); c.moveTo(8, -13); c.quadraticCurveTo(7, -17, 5, -16.5); c.moveTo(11, -13); c.quadraticCurveTo(13, -17, 15, -16); c.stroke(); c.lineWidth = 1.7; c.strokeStyle = T.INK; c.fillStyle = S.col ? S.col('#e8423a') : '#e8423a'; c.fillRect(-4, -15, 7, 3); eye(10, -10.5); break;
      case 'monkey': T.O(c, 0, -6, 5, '#8a6a4a', 5.5); T.O(c, 1, -14, 4, '#8a6a4a'); c.fillStyle = '#e8c8a0'; c.beginPath(); c.arc(2.5, -13.5, 2.4, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-4, -4); c.quadraticCurveTo(-11, -4, -9, -12); c.stroke(); eye(3, -14.5); break;
      case 'turtle': T.O(c, 0, -3.5, 7, '#5a8a4a', 4); c.strokeStyle = 'rgba(28,20,38,0.5)'; c.beginPath(); c.moveTo(-3, -6); c.lineTo(3, -2); c.moveTo(3, -6); c.lineTo(-3, -2); c.stroke(); c.strokeStyle = T.INK; T.O(c, 8, -3, 2.4, '#8aa868'); eye(8.5, -3.5); break;
      case 'walrus': T.O(c, 0, -8, 12, '#a87a5a', 8); T.O(c, 9, -11, 5, '#a87a5a', 4.6); c.fillStyle = '#ffffff'; c.fillRect(8, -8, 1.6, 7); c.fillRect(11, -8, 1.6, 7); c.strokeRect(8, -8, 1.6, 7); c.strokeRect(11, -8, 1.6, 7); eye(10, -13); break;
      case 'pig': T.O(c, 0, -6, 7, '#f0a8b0', 4.6); T.O(c, 7, -7, 3, '#f0a8b0'); c.fillStyle = '#d8808a'; c.fillRect(9, -8, 2, 2); c.beginPath(); c.moveTo(-7, -7); c.quadraticCurveTo(-10, -9, -9, -6); c.stroke(); eye(7, -8.5); c.beginPath(); for (const lx of [-4, 3]) { c.moveTo(lx, -2); c.lineTo(lx, 0); } c.stroke(); break;
      case 'tortoise': T.O(c, 0, -5, 9, '#7a6a4a', 6); c.fillStyle = 'rgba(255,255,255,0.15)'; c.beginPath(); c.arc(-2, -7, 3, 0, TAU); c.fill(); T.O(c, 10, -4, 2.8, '#9a8a6a'); eye(11, -4.5); break;
      case 'caiman': T.O(c, 0, -2.5, 11, '#4a6a3a', 2.8); T.P(c, [[9, -3], [17, -2], [9, -0.5]], '#4a6a3a'); eye(8, -4); break;
      case 'swan': T.O(c, 0, -4, 6, '#ffffff', 3.4); c.lineWidth = 2.4; c.strokeStyle = '#ffffff'; c.beginPath(); c.moveTo(4, -5); c.quadraticCurveTo(8, -9, 5, -13); c.stroke(); c.lineWidth = 1.7; c.strokeStyle = T.INK; T.P(c, [[5, -13.5], [9, -13], [5, -12]], '#ff8a2a'); break;
    }
    c.restore();
  },

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
    // a souvenir stand: its keeper sits by the stall (Xolo the dog, a booby, a coati, a hornbill, a fennec, a stork,
    // a hedgehog, a goose, a gecko, a water buffalo, a shiba, a red panda, a penguin)
    keeper: {
      paint(c, S) { const p = S.take(22); if (!p) return; const K = { mx: 'dog', ec: 'booby', br: 'coati', mz: 'hornbill', ma: 'fennec', es: 'stork', fr: 'hedgehog', nl: 'goose', id: 'gecko', vn: 'buffalo', jp: 'shiba', np: 'redpanda', aq: 'penguin' }[S.ow.cc] || 'dog'; this.critter(c, K, p.x, p.y, Object.assign({}, S, { dim: false }), p.x < S.x ? 1 : -1); },
      noPennants: true
    },
    /* ----- Ecuador ----- */
    // 2-1 the equator: a striped post with a little globe and a 0° sign
    marker: {
      paint(c, S) {
        const p = S.anchor(26); if (!p) return; this.base(c, S, p, 28, 15, '#e8dcc0');
        this.R(c, p.x - 2.5, p.y - 40, 5, 40, S.col('#fff4e0')); c.fillStyle = S.col('#e8323a'); for (let i = 0; i < 4; i++) c.fillRect(p.x - 2.5, p.y - 38 + i * 10, 5, 4); c.strokeRect(p.x - 2.5, p.y - 40, 5, 40);
        this.O(c, p.x, p.y - 46, 7, S.col('#3a8ad8')); c.fillStyle = S.col('#5ac87a'); c.beginPath(); c.ellipse(p.x - 2, p.y - 48, 3, 2, 0.5, 0, TAU); c.ellipse(p.x + 3, p.y - 44, 2.5, 1.6, 0, 0, TAU); c.fill();
        c.strokeStyle = '#ffd23a'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(p.x, p.y - 46, 9.5, 2.6, 0, 0, TAU); c.stroke(); c.strokeStyle = this.INK; c.lineWidth = 1.7;
        this.R(c, p.x + 5, p.y - 26, 22, 10, S.col('#fff4e0')); c.fillStyle = '#1c1426'; c.font = `7px ${FONT_DISPLAY}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('0°', p.x + 16, p.y - 20.5);
      }
    },
    // 2-2 the canopy: giant trees with rope bridges between their crowns
    canopy: {
      paint(c, S) {
        const p = S.anchor(48); if (!p) return; S.mem.p = p;
        if (S.night) this.nightDome(c, S, p, 50);
        this.base(c, S, p, 50, 26, '#3f7a3a');
        const T = [[-30, 4, 34], [2, -6, 42], [32, 6, 32]], g = S.col('#2f7a3a');
        for (const [dx, dy, h] of T) { c.fillStyle = S.col('#6a4630'); c.fillRect(p.x + dx - 3, p.y + dy - h, 6, h); c.strokeRect(p.x + dx - 3, p.y + dy - h, 6, h); }
        c.lineWidth = 1.2; c.strokeStyle = S.col('#c8a878'); for (let i = 0; i < 2; i++) { const a = T[i], b = T[i + 1]; for (const off of [0, 3]) { c.beginPath(); c.moveTo(p.x + a[0], p.y + a[1] - a[2] * 0.7 + off); c.quadraticCurveTo(p.x + (a[0] + b[0]) / 2, p.y + (a[1] + b[1]) / 2 - (a[2] + b[2]) * 0.3 + off + 7, p.x + b[0], p.y + b[1] - b[2] * 0.7 + off); c.stroke(); } } c.strokeStyle = this.INK; c.lineWidth = 1.7;
        for (const [dx, dy, h] of T) { this.O(c, p.x + dx, p.y + dy - h - 4, 15, g, 10); this.O(c, p.x + dx - 7, p.y + dy - h + 2, 9, S.col('#3f8a4a'), 6); c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(p.x + dx - 4, p.y + dy - h - 8, 5, 3, 0, 0, TAU); c.fill(); }
      },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; for (let i = 0; i < 3; i++) { const a = t * 0.7 + i * 2.1; ctx.fillStyle = ['#e8323a', '#ffd23a', '#2a6ad8'][i]; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * 40, p.y - 55 + Math.sin(a * 1.7) * 8, 2.2, 0, TAU); ctx.fill(); } }
    },
    // 2-3 the booby race: a rocky beach, blue-footed boobies, checkered flags
    boobies: {
      paint(c, S) {
        const p = S.anchor(36); if (!p) return; this.base(c, S, p, 38, 20, '#d8c8a0');
        this.prop.rock(c, p.x - 24, p.y + 2, 9, '#8a8478', S); this.prop.rock(c, p.x + 22, p.y - 4, 11, '#8a8478', S);
        this.critter(c, 'booby', p.x - 8, p.y - 2, S, 1); this.critter(c, 'booby', p.x + 6, p.y + 6, S, -1); this.critter(c, 'booby', p.x + 22, p.y - 14, S, -1);
        for (const dx of [-34, 34]) { c.beginPath(); c.moveTo(p.x + dx, p.y + 4); c.lineTo(p.x + dx, p.y - 22); c.stroke(); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#1c1426' : '#ffffff'; c.fillRect(p.x + dx + i * 3, p.y - 22 + j * 3, 3, 3); } c.strokeRect(p.x + dx, p.y - 22, 9, 6); }
      }
    },
    // 2-4 the cacao works: a brick factory with two chimneys, cacao trees with pods
    factory: {
      paint(c, S) {
        const p = S.anchor(44); if (!p) return; S.mem.p = p; const wall = S.o.wall || '#b8604a';
        this.base(c, S, p, 46, 24, '#c8b090');
        this.R(c, p.x - 18, p.y - 30, 6, 22, S.col('#8a4a3a')); this.R(c, p.x - 6, p.y - 36, 6, 28, S.col('#8a4a3a'));
        this.prop.house(c, p.x - 4, p.y + 2, 40, 18, wall, '#6a4a5a', S, true);
        c.fillStyle = S.col('#fff4e0'); for (let i = 0; i < 4; i++) c.fillRect(p.x - 20 + i * 9, p.y - 10, 5, 4);
        for (const dx of [30, 40]) { c.fillStyle = S.col('#6a4630'); c.fillRect(p.x + dx - 1.5, p.y - 10, 3, 12); this.O(c, p.x + dx, p.y - 14, 7, S.col('#3f8a4a'), 6); c.lineWidth = 0.9; this.O(c, p.x + dx - 3, p.y - 10, 2, S.col('#d8802a'), 3); this.O(c, p.x + dx + 3, p.y - 12, 2, S.col('#e8a03a'), 3); c.lineWidth = 1.7; }
        S.mem.ch = [[p.x - 15, p.y - 32], [p.x - 3, p.y - 38]];
      },
      live(ctx, S, t) { for (const [x, y] of S.mem.ch || []) this.smoke(ctx, x, y, t + x * 0.01, 0.7, S.n.done ? null : '#7a7080'); }
    },
    // the boss crater: a snow cone behind the fort, smoking
    crater: {
      paint(c, S) {
        const x = S.x + 6, y = S.y - 26, r = 46, h = 50;
        this.P(c, [[x - r, y], [x - 12, y - h], [x + 12, y - h], [x + r, y]], S.col('#7a7090'));
        this.P(c, [[x - 12, y - h], [x + 12, y - h], [x + 20, y - h + 14], [x + 6, y - h + 10], [x - 4, y - h + 16], [x - 20, y - h + 12]], '#f6f7fb');
        S.mem.v = { x, y: y - h };
      },
      live(ctx, S, t) { const v = S.mem.v; if (v) this.smoke(ctx, v.x, v.y - 2, t, 1.1, S.n.done ? null : '#8a8090'); },
      noPennants: true
    },
    // a reef off the coast: coral, a turtle swimming circles, bubbles (in the water)
    reef: {
      wet: true,
      paint(c, S) {
        const p = S.anchor(32, true); if (!p) return; S.mem.p = p;
        c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(p.x, p.y, 36, 18, 0, 0, TAU); c.fill();
        const coral = (x, y, col) => { c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 8); c.moveTo(x, y - 4); c.lineTo(x - 5, y - 10); c.moveTo(x, y - 6); c.lineTo(x + 5, y - 11); c.stroke(); };
        coral(p.x - 18, p.y + 4, S.col('#ff6a8a')); coral(p.x + 2, p.y + 6, S.col('#ffb83a')); coral(p.x + 20, p.y + 2, S.col('#ff8ad0'));
        c.strokeStyle = this.INK; c.lineWidth = 1.7;
      },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; const a = t * 0.6; ctx.save(); ctx.globalAlpha = 0.85; this.critter(ctx, 'turtle', p.x + Math.cos(a) * 24, p.y + Math.sin(a) * 9 + 4, S, Math.sin(a) > 0 ? -1 : 1); ctx.restore(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 4; i++) { const k = (t * 0.6 + i / 4) % 1; ctx.beginPath(); ctx.arc(p.x - 6 + i * 5, p.y - 4 - k * 14, 1.6 * (1 - k) + 0.5, 0, TAU); ctx.fill(); } }
    },
    // a waterfall off a cliff into a pool, mist rising (opts: h height, wide: a horseshoe of falls)
    waterfall: {
      paint(c, S) {
        const W = S.o.wide ? 54 : 30, p = S.anchor(W + 6); if (!p) return; S.mem.p = p; const h = S.o.h || 40;
        // cliff
        c.fillStyle = S.col('#7a6a5a'); c.beginPath(); c.moveTo(p.x - W, p.y - 2); c.lineTo(p.x - W + 4, p.y - h); c.quadraticCurveTo(p.x, p.y - h - 8, p.x + W - 4, p.y - h); c.lineTo(p.x + W, p.y - 2); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = S.col('#3f8a4a'); c.beginPath(); c.moveTo(p.x - W + 4, p.y - h); c.quadraticCurveTo(p.x, p.y - h - 8, p.x + W - 4, p.y - h); c.quadraticCurveTo(p.x, p.y - h - 2, p.x - W + 4, p.y - h); c.fill(); c.stroke();
        // falls
        const n = S.o.wide ? 4 : 1; S.mem.falls = [];
        for (let i = 0; i < n; i++) { const fx = n === 1 ? p.x : p.x - W + 12 + i * (2 * W - 24) / (n - 1), fw = n === 1 ? 14 : 9; c.fillStyle = S.col('#dff4fa'); c.fillRect(fx - fw / 2, p.y - h - 2, fw, h - 2); c.strokeRect(fx - fw / 2, p.y - h - 2, fw, h - 2); S.mem.falls.push([fx, fw]); }
        // pool
        c.fillStyle = S.col('#3aa8c8'); c.beginPath(); c.ellipse(p.x, p.y + 2, W + 4, 9, 0, 0, TAU); c.fill(); c.stroke();
        S.mem.h = h;
      },
      live(ctx, S, t) {
        const p = S.mem.p; if (!p) return; const h = S.mem.h;
        ctx.strokeStyle = 'rgba(160,220,240,0.9)'; ctx.lineWidth = 1.2;
        for (const [fx, fw] of S.mem.falls) for (let k = 0; k < 3; k++) { const y = p.y - h + ((t * 40 + k * 13) % (h - 4)); ctx.beginPath(); ctx.moveTo(fx - fw / 2 + 2 + k * (fw - 4) / 2, y); ctx.lineTo(fx - fw / 2 + 2 + k * (fw - 4) / 2, y + 6); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < 5; i++) { const k = (t * 0.4 + i / 5) % 1; ctx.beginPath(); ctx.arc(p.x - 20 + i * 10, p.y - k * 16, 3 + k * 5, 0, TAU); ctx.fill(); }
        if (S.o.rainbow) { ctx.save(); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t); ctx.lineWidth = 2; ['#e8323a', '#ffb83a', '#ffd23a', '#5ac87a', '#3a8ad8'].forEach((col, i) => { ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(p.x, p.y + 4, 30 - i * 2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }); ctx.restore(); }
      }
    },
    /* ----- Brazil ----- */
    // 3-1 samba: a parade float with feathers, drums, confetti
    samba: {
      paint(c, S) {
        const p = S.anchor(42); if (!p) return; S.mem.p = p; this.base(c, S, p, 44, 22, '#e8d0a0');
        this.R(c, p.x - 26, p.y - 14, 44, 12, S.col('#ff3d8b')); this.O(c, p.x - 18, p.y - 1, 4, '#3a2a3a'); this.O(c, p.x + 10, p.y - 1, 4, '#3a2a3a');
        c.fillStyle = S.col('#ffd23a'); c.beginPath(); c.moveTo(p.x - 26, p.y - 14); c.quadraticCurveTo(p.x - 4, p.y - 40, p.x + 18, p.y - 14); c.fill(); c.stroke();
        for (let i = 0; i < 7; i++) { const a = Math.PI + 0.3 + i * 0.42; c.strokeStyle = S.col(['#1aa85a', '#2a6ad8', '#ff3d8b'][i % 3]); c.lineWidth = 3; c.beginPath(); c.moveTo(p.x - 4, p.y - 26); c.lineTo(p.x - 4 + Math.cos(a) * 22, p.y - 26 + Math.sin(a) * 16); c.stroke(); } c.strokeStyle = this.INK; c.lineWidth = 1.7;
        for (const dx of [26, 36]) { this.R(c, p.x + dx - 4, p.y - 8, 8, 8, S.col('#2a6ad8')); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(p.x + dx, p.y - 8, 4, 1.5, 0, 0, TAU); c.fill(); c.stroke(); }
      },
      live(ctx, S, t) { const p = S.mem.p; if (!p || !S.n.enter) return; const cols = ['#ff3d8b', '#ffd23a', '#1aa85a', '#2a6ad8']; for (let i = 0; i < 10; i++) { const k = (t * 0.5 + i / 10) % 1; ctx.fillStyle = cols[i % 4]; ctx.fillRect(p.x - 40 + (i * 37 % 80) + Math.sin(t * 3 + i) * 4, p.y - 60 + k * 50, 2.5, 3.5); } }
    },
    // a wetland: a pond with lily pads, reeds, a caiman and the land's critter
    wetland: {
      paint(c, S) {
        const p = S.anchor(40); if (!p) return; S.mem.p = p; this.base(c, S, p, 44, 23, '#5a8a4a');
        c.fillStyle = S.col('#3a98a8'); c.beginPath(); c.ellipse(p.x, p.y + 2, 30, 13, 0, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = S.col('#6ab45a'); for (const [dx, dy] of [[-14, 2], [8, 6], [18, -2]]) { c.beginPath(); c.arc(p.x + dx, p.y + dy, 3.4, 0.4, TAU); c.lineTo(p.x + dx, p.y + dy); c.fill(); }
        c.lineWidth = 1.4; c.strokeStyle = S.col('#4a7a3a'); for (let i = 0; i < 9; i++) { const x = p.x - 40 + i * 3 + (i > 4 ? 64 : 0); c.beginPath(); c.moveTo(x, p.y + 4); c.lineTo(x + (i % 2) * 2, p.y - 10 - (i % 3) * 3); c.stroke(); } c.strokeStyle = this.INK; c.lineWidth = 1.7;
        this.critter(c, 'caiman', p.x - 2, p.y + 6, S, 1);
        if (S.o.critter) this.critter(c, S.o.critter, p.x + 30, p.y - 12, S, -1);
      }
    },
    // the stadium: floodlight towers by the boss fort, confetti when won
    stadium: {
      paint(c, S) { for (const dx of [-44, 44]) { const x = S.x + dx, y = S.y - 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 46); c.stroke(); this.R(c, x - 6, y - 52, 12, 6, S.col('#e8e8f0')); c.fillStyle = '#ffd86a'; for (let i = 0; i < 3; i++) c.fillRect(x - 5 + i * 4, y - 51, 2.5, 4); } },
      live(ctx, S, t) { if (!S.n.done) return; const cols = [S.cols.a, S.cols.b, S.cols.c]; for (let i = 0; i < 14; i++) { const k = (t * 0.4 + i / 14) % 1; ctx.fillStyle = cols[i % 3]; ctx.fillRect(S.x - 50 + (i * 41 % 100), S.y - 90 + k * 70, 2.5, 3.5); } },
      noPennants: true
    },
    // lagoons in white dunes
    lagoons: {
      paint(c, S) { const p = S.anchor(40); if (!p) return; this.base(c, S, p, 44, 22, '#f6f2e6'); for (const [dx, dy, r] of [[-16, 2, 11], [12, -4, 9], [18, 8, 7]]) { c.fillStyle = S.col('#4ac0d8'); c.beginPath(); c.ellipse(p.x + dx, p.y + dy, r, r * 0.45, 0, 0, TAU); c.fill(); c.stroke(); } c.strokeStyle = rgba('#d8ccb0', 0.9); c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(p.x - 36 + i * 22, p.y - 10 + i * 4); c.quadraticCurveTo(p.x - 26 + i * 22, p.y - 18 + i * 4, p.x - 14 + i * 22, p.y - 9 + i * 4); c.stroke(); } c.strokeStyle = this.INK; c.lineWidth = 1.7; }
    },
    // a hilltop launch ramp with a hang-glider circling
    glider: {
      paint(c, S) { const p = S.anchor(36); if (!p) return; S.mem.p = p; c.beginPath(); c.moveTo(p.x - 38, p.y + 6); c.bezierCurveTo(p.x - 24, p.y - 34, p.x + 22, p.y - 34, p.x + 38, p.y + 6); c.closePath(); c.fillStyle = S.col('#5a9a4a'); c.fill(); c.stroke(); this.R(c, p.x - 4, p.y - 30, 22, 4, S.col('#b07a46')); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; const a = t * 0.45, x = p.x + Math.cos(a) * 54, y = p.y - 60 + Math.sin(a) * 14; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.cos(a) * 0.15); ctx.fillStyle = S.col(S.cols.a); ctx.beginPath(); ctx.moveTo(-14, 2); ctx.lineTo(0, -5); ctx.lineTo(14, 2); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 6); ctx.stroke(); ctx.fillStyle = '#1c1426'; ctx.beginPath(); ctx.arc(0, 7, 1.8, 0, TAU); ctx.fill(); ctx.restore(); }
    },
    /* ----- Mozambique ----- */
    // a herd of ostriches running back and forth
    herd: {
      paint(c, S) { const p = S.anchor(42); if (!p) return; S.mem.p = p; this.base(c, S, p, 46, 22, '#d8c47a'); for (let i = 0; i < 3; i++) { const q = { x: p.x - 30 + i * 12, y: p.y + 14 }; c.fillStyle = S.col('#8a9a4a'); c.beginPath(); c.arc(q.x, q.y, 3, 0, TAU); c.fill(); } },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; const kind = S.o.animal || 'ostrich'; for (let i = 0; i < 3; i++) { const u = Math.sin(t * 0.8 + i * 1.4), x = p.x + u * 26 + (i - 1) * 6, y = p.y - 4 + (i - 1) * 7; this.critter(ctx, kind, x, y + Math.abs(Math.sin(t * 9 + i)) * -2, S, Math.cos(t * 0.8 + i * 1.4) > 0 ? 1 : -1); } }
    },
    // dunes with dust devils whirling
    dustdunes: {
      paint(c, S) { const p = S.anchor(42); if (!p) return; S.mem.p = p; this.base(c, S, p, 46, 22, '#ecd08a'); c.strokeStyle = rgba('#b89050', 0.9); c.lineWidth = 1.6; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(p.x - 38 + i * 18, p.y + 4 - (i % 2) * 8); c.quadraticCurveTo(p.x - 28 + i * 18, p.y - 6 - (i % 2) * 8, p.x - 16 + i * 18, p.y + 3 - (i % 2) * 8); c.stroke(); } c.strokeStyle = this.INK; c.lineWidth = 1.7; this.prop.rock(c, p.x + 26, p.y + 6, 7, '#b89070', S); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; for (let i = 0; i < 2; i++) { const x = p.x + Math.sin(t * 0.5 + i * 3) * 26, y = p.y - 2 + i * 6; for (let k = 0; k < 5; k++) { ctx.fillStyle = `rgba(230,200,140,${0.5 - k * 0.08})`; ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 6 + k) * 3, y - k * 6, 4 + k * 2, 2 + k * 0.6, 0, 0, TAU); ctx.fill(); } } }
    },
    // giant baobabs with rope bridges between their crowns
    baobabs: {
      paint(c, S) {
        const p = S.anchor(48); if (!p) return; this.base(c, S, p, 50, 24, '#c8c070');
        const T = [[-30, 6, 30], [2, -4, 38], [32, 6, 30]];
        c.lineWidth = 1.2; c.strokeStyle = S.col('#c8a878'); for (let i = 0; i < 2; i++) { const a = T[i], b = T[i + 1]; c.beginPath(); c.moveTo(p.x + a[0], p.y + a[1] - a[2]); c.quadraticCurveTo(p.x + (a[0] + b[0]) / 2, p.y - 30, p.x + b[0], p.y + b[1] - b[2]); c.stroke(); } c.strokeStyle = this.INK; c.lineWidth = 1.7;
        for (const [dx, dy, h] of T) { c.save(); c.translate(p.x + dx, p.y + dy); TourOWPaint.art.baobab.call(TourOWPaint, c, h, {}); c.restore(); }
      }
    },
    // a turtle beach: nests in the sand, hatchlings heading for the sea
    turtlebeach: {
      paint(c, S) { const p = S.anchor(40); if (!p) return; S.mem.p = p; if (S.night) this.nightDome(c, S, p, 44); this.base(c, S, p, 44, 22, '#f0dca0'); for (const [dx, dy] of [[-18, -2], [6, -8], [20, 4]]) { c.fillStyle = S.col('#d8b878'); c.beginPath(); c.ellipse(p.x + dx, p.y + dy, 7, 3, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#fff8e8'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(p.x + dx - 3 + k * 3, p.y + dy - 1, 1.4, 0, TAU); c.fill(); } } },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; for (let i = 0; i < 4; i++) { const k = (t * 0.15 + i / 4) % 1; ctx.save(); ctx.translate(p.x - 20 + i * 12 + k * 10, p.y - 4 + k * 22); ctx.scale(0.5, 0.5); this.critter(ctx, 'turtle', 0, 0, S, 1); ctx.restore(); } }
    },
    // a sea fort: cannons on a stone wall
    seawall: {
      paint(c, S) { for (const dx of [-40, 40]) { const x = S.x + dx, y = S.y - 2; this.R(c, x - 10, y - 10, 20, 10, S.col('#c8b89a')); c.fillStyle = '#3a3a44'; c.beginPath(); c.ellipse(x + (dx > 0 ? 6 : -6), y - 12, 6, 2.4, 0, 0, TAU); c.fill(); c.stroke(); } },
      noPennants: true
    },
    // a dhow half buried in the sand, a shovel stuck beside it
    dhow: {
      paint(c, S) { const p = S.anchor(36); if (!p) return; this.base(c, S, p, 40, 20, '#e8d098'); c.save(); c.translate(p.x, p.y + 2); c.rotate(-0.25); c.beginPath(); c.moveTo(-24, -6); c.quadraticCurveTo(0, 6, 22, -10); c.lineTo(18, -2); c.quadraticCurveTo(0, 10, -20, 2); c.closePath(); c.fillStyle = S.col('#9a6a40'); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-2, -2); c.lineTo(4, -28); c.stroke(); this.P(c, [[4, -27], [16, -8], [2, -8]], S.col('#f4ede0')); c.restore(); c.fillStyle = S.col('#e8d098'); c.beginPath(); c.ellipse(p.x - 6, p.y + 6, 26, 6, 0, 0, Math.PI); c.fill(); c.beginPath(); c.moveTo(p.x + 26, p.y + 4); c.lineTo(p.x + 30, p.y - 14); c.stroke(); this.R(c, p.x + 27, p.y - 4, 5, 6, S.col('#8a8a9a')); }
    },
    /* ----- shared ----- */
    // a cluster of houses (opts: wall, roof, flat, n, R, lanterns)
    village: {
      paint(c, S) {
        const o = S.o, R = o.R || 44, p = S.anchor(R); if (!p) return; S.mem.p = p;
        if (S.night) this.nightDome(c, S, p, R + 4);
        this.base(c, S, p, R + 4, R * 0.52, o.ground || '#d8c8a8');
        const n = o.n || 6, hs = [];
        for (let i = 0; i < n; i++) { const a = i / n * TAU + 0.4, d = R * (i % 2 ? 0.55 : 0.3); hs.push([p.x + Math.cos(a) * d * 1.2, p.y + Math.sin(a) * d * 0.55]); }
        hs.sort((a, b) => a[1] - b[1]).forEach((h, i) => this.prop.house(c, h[0], h[1], o.tall ? 12 : 13 + (i % 3) * 3, o.tall ? 22 + (i % 3) * 5 : 11 + (i % 2) * 4, o.walls ? o.walls[i % o.walls.length] : (o.wall || S.look.wall), o.roof || S.look.roof, S, o.flat));
        S.mem.lan = o.lanterns ? hs : null;
      },
      live(ctx, S, t) { const L = S.mem.lan; if (!L) return; const cols = ['#ff4a3a', '#ffd23a', '#ff8ad0', '#ffb83a']; for (let i = 0; i + 1 < L.length; i++) { const a = L[i], b = L[i + 1]; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(a[0], a[1] - 18); ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 10, b[0], b[1] - 18); ctx.stroke(); for (let k = 1; k < 4; k++) { const u = k / 4, x = a[0] + (b[0] - a[0]) * u, y = a[1] - 18 + (b[1] - a[1]) * u + 8 * u * (1 - u) * 2; ctx.fillStyle = cols[(i + k) % 4]; ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 3 + i + k); ctx.beginPath(); ctx.ellipse(x, y + 3, 2.6, 3.4, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = 0.7; ctx.stroke(); } } }
    },
    // a grove of the land's trees with critters (opts: trees [kinds], critters [kinds], ground)
    grove: {
      paint(c, S) {
        const o = S.o, p = S.anchor(o.R || 44); if (!p) return; S.mem.p = p;
        if (S.night) this.nightDome(c, S, p, 48);
        this.base(c, S, p, 48, 24, o.ground || shade(S.look.land, -0.15));
        const k = o.trees || ['round'], pos = [[-28, -4, 18], [-6, -12, 22], [18, -6, 19], [32, 4, 15], [-18, 8, 14], [8, 8, 15]];
        pos.sort((a, b) => a[1] - b[1]).forEach((q, i) => { c.save(); c.translate(p.x + q[0], p.y + q[1]); TourOWPaint.art[k[i % k.length]].call(TourOWPaint, c, q[2], { v: i / 6 }, S.ow); c.restore(); });
        (o.critters || []).forEach((cr, i) => this.critter(c, cr, p.x - 12 + i * 22, p.y + 14 - i * 4, S, i % 2 ? -1 : 1));
      }
    },
    // windmills turning (opts: n)
    windmills: {
      paint(c, S) { const p = S.anchor(44); if (!p) return; S.mem.p = p; this.base(c, S, p, 46, 22, S.o.ground || '#d8c890'); const n = S.o.n || 3; S.mem.m = []; for (let i = 0; i < n; i++) { const x = p.x - 30 + i * 30, y = p.y + 4 - (i % 2) * 10; S.mem.m.push([x, y]); this.P(c, [[x - 7, y], [x - 5, y - 26], [x + 5, y - 26], [x + 7, y]], S.col(S.o.wall || '#f3e6cc')); this.P(c, [[x - 6.5, y - 26], [x, y - 34], [x + 6.5, y - 26]], S.col(S.o.roof || '#5a5a6a')); c.fillStyle = '#3a2a3a'; c.fillRect(x - 2, y - 7, 4, 7); } },
      live(ctx, S, t) { for (const [x, y] of S.mem.m || []) { ctx.save(); ctx.translate(x, y - 26); ctx.rotate(t * 1.2 + x); ctx.lineWidth = 1.2; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillStyle = '#fff8ea'; ctx.beginPath(); ctx.rect(1.5, -2.2, 16, 4.4); ctx.fill(); ctx.stroke(); } ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, TAU); ctx.fill(); ctx.restore(); } }
    },
    /* ----- Morocco ----- */
    // the souk: a maze of low walls, carpets on lines, brass lanterns
    souk: {
      paint(c, S) {
        const p = S.anchor(44); if (!p) return; S.mem.p = p; this.base(c, S, p, 48, 25, '#e8c898');
        c.lineWidth = 4.5; c.strokeStyle = this.INK; const walls = [[-38, -8, -10, -8], [-10, -8, -10, 10], [4, -16, 4, 2], [4, 2, 30, 2], [18, -12, 38, -12], [-28, 8, -28, 16], [16, 10, 16, 18]];
        for (const w of walls) { c.beginPath(); c.moveTo(p.x + w[0], p.y + w[1]); c.lineTo(p.x + w[2], p.y + w[3]); c.stroke(); }
        c.lineWidth = 3; c.strokeStyle = S.col('#d8a070'); for (const w of walls) { c.beginPath(); c.moveTo(p.x + w[0], p.y + w[1]); c.lineTo(p.x + w[2], p.y + w[3]); c.stroke(); }
        c.strokeStyle = this.INK; c.lineWidth = 1.7;
        const rug = (x, y, col) => { c.beginPath(); c.moveTo(x - 7, y - 16); c.lineTo(x + 7, y - 16); c.stroke(); this.R(c, x - 6, y - 16, 12, 14, S.col(col)); c.fillStyle = S.col('#ffd23a'); c.fillRect(x - 3, y - 12, 6, 6); };
        rug(p.x - 24, p.y - 6, '#c8323a'); rug(p.x + 22, p.y - 14, '#1a8a6a');
      },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; for (const [dx, dy] of [[-4, -22], [12, -26], [30, -20]]) { ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(p.x + dx, p.y + dy - 8); ctx.lineTo(p.x + dx, p.y + dy - 3); ctx.stroke(); ctx.fillStyle = `rgba(255,${200 + Math.round(30 * Math.sin(t * 4 + dx))},90,1)`; ctx.beginPath(); ctx.moveTo(p.x + dx - 3, p.y + dy - 3); ctx.lineTo(p.x + dx + 3, p.y + dy - 3); ctx.lineTo(p.x + dx + 2, p.y + dy + 3); ctx.lineTo(p.x + dx - 2, p.y + dy + 3); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1; ctx.stroke(); } }
    },
    // a camel caravan crossing the dunes, an oasis pool
    caravan: {
      paint(c, S) { const p = S.anchor(46); if (!p) return; S.mem.p = p; this.base(c, S, p, 50, 24, '#efc77a'); c.fillStyle = S.col('#3aa8b8'); c.beginPath(); c.ellipse(p.x + 26, p.y + 8, 13, 5, 0, 0, TAU); c.fill(); c.stroke(); for (const dx of [16, 36]) { c.save(); c.translate(p.x + dx, p.y + 4); TourOWPaint.art.palm.call(TourOWPaint, c, 15, { v: dx > 20 ? 0.8 : 0.2 }); c.restore(); } },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; for (let i = 0; i < 3; i++) { const u = ((t * 0.05 + i * 0.12) % 1), x = p.x - 46 + u * 60, y = p.y - 4 + Math.sin(u * 6) * 3; ctx.save(); ctx.globalAlpha = Math.min(1, Math.min(u, 1 - u) * 8); this.critter(ctx, 'camel', x, y, S, 1); ctx.restore(); } }
    },
    // flying carpets bobbing in the sky over a little rooftop
    carpets: {
      paint(c, S) { const p = S.anchor(36); if (!p) return; S.mem.p = p; this.prop.house(c, p.x, p.y, 26, 14, '#e8c8a0', '#c8a070', S, true); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; [['#c8323a', -24, 0], ['#1a8a6a', 14, 1.7], ['#5a3a9a', 34, 3.1]].forEach(([col, dx, ph]) => { const x = p.x + dx + Math.sin(t * 0.6 + ph) * 8, y = p.y - 40 + Math.sin(t * 1.4 + ph) * 5; ctx.save(); ctx.translate(x, y); ctx.transform(1, 0.12 * Math.sin(t * 2 + ph), 0, 1, 0, 0); ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i <= 8; i++) ctx.lineTo(-10 + i * 2.5, Math.sin(t * 5 + i + ph) * 1.4); for (let i = 8; i >= 0; i--) ctx.lineTo(-10 + i * 2.5, 5 + Math.sin(t * 5 + i + ph) * 1.4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(-4, 1.5, 8, 2); ctx.restore(); }); }
    },
    // a riad courtyard: a tiled floor, a fountain (live water), orange trees in pots
    riad: {
      paint(c, S) {
        for (const dx of [-46, 46]) { c.save(); c.translate(S.x + dx, S.y + 2); TourOWPaint.art.orange.call(TourOWPaint, c, 16, {}); c.restore(); }
        const x = S.x, y = S.y - 34; this.O(c, x - 42, y + 20, 9, S.col('#1a8a6a'), 4.5); S.mem.f = { x: x - 42, y: y + 20 };
      },
      live(ctx, S, t) { const f = S.mem.f; if (!f) return; ctx.strokeStyle = 'rgba(200,240,255,0.9)'; ctx.lineWidth = 1.4; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + t; ctx.beginPath(); ctx.moveTo(f.x, f.y - 4); ctx.quadraticCurveTo(f.x + Math.cos(a) * 6, f.y - 12, f.x + Math.cos(a) * 8, f.y - 1); ctx.stroke(); } },
      noPennants: true
    },
    /* ----- Spain ----- */
    // the tomato fight: crates of tomatoes, red splats, a little truck
    tomatina: {
      paint(c, S) {
        const p = S.anchor(42); if (!p) return; S.mem.p = p; this.base(c, S, p, 46, 23, '#e8d0b0');
        c.fillStyle = S.col('#e8323a'); for (let i = 0; i < 9; i++) { const R = S.rng(), x = p.x - 36 + R * 72, y = p.y - 12 + ((i * 37) % 24); c.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, r = 3 + (k % 2) * 2; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.5); } c.fill(); }
        this.R(c, p.x - 4, p.y - 16, 26, 12, S.col('#e8e0d0')); this.R(c, p.x + 18, p.y - 12, 10, 8, S.col('#3a8ad8')); this.O(c, p.x + 2, p.y - 3, 3.5, '#3a2a3a'); this.O(c, p.x + 22, p.y - 3, 3.5, '#3a2a3a'); c.lineWidth = 0.9; for (let i = 0; i < 6; i++) this.O(c, p.x - 1 + i * 4, p.y - 17, 2.3, S.col('#e8323a')); c.lineWidth = 1.7;
        this.prop.crate(c, p.x - 26, p.y + 6, '#e8323a', S); this.prop.crate(c, p.x - 14, p.y + 12, '#e8323a', S);
      },
      live(ctx, S, t) { const p = S.mem.p; if (!p || !S.n.enter) return; for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i / 3) % 1, x = p.x - 30 + k * 60, y = p.y - 20 - Math.sin(k * Math.PI) * 26; ctx.fillStyle = '#e8323a'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill(); ctx.stroke(); } }
    },
    // the pintxos bar: a counter, stools, little tables with umbrellas, a giant skewer of snacks
    pintxos: {
      paint(c, S) {
        const p = S.anchor(42); if (!p) return; this.base(c, S, p, 46, 22, '#d8c0a0');
        this.prop.house(c, p.x - 14, p.y - 2, 30, 16, '#f4e8d0', '#c8503a', S, true); c.fillStyle = S.col('#c8323a'); c.fillRect(p.x - 29, p.y - 16, 30, 4);
        for (const [dx, col] of [[16, '#ffd23a'], [32, '#c8323a']]) { c.beginPath(); c.moveTo(p.x + dx, p.y + 6); c.lineTo(p.x + dx, p.y - 14); c.stroke(); this.P(c, [[p.x + dx - 11, p.y - 12], [p.x + dx, p.y - 19], [p.x + dx + 11, p.y - 12]], S.col(col)); this.O(c, p.x + dx, p.y + 2, 5, S.col('#fff4e0'), 2); }
        c.beginPath(); c.moveTo(p.x - 36, p.y + 8); c.lineTo(p.x - 36, p.y - 30); c.stroke(); for (let i = 0; i < 3; i++) this.O(c, p.x - 36, p.y - 26 + i * 7, 4.5, S.col(['#ffd23a', '#e8a050', '#7ac850'][i]), 3);
      }
    },
    // the city of arts at night: white shell-shaped buildings over a long pool
    arts: {
      paint(c, S) {
        const p = S.anchor(48); if (!p) return; S.mem.p = p; if (S.night) this.nightDome(c, S, p, 52);
        this.base(c, S, p, 52, 22, '#c8d8e8'); c.fillStyle = S.col('#5ab8e8'); c.fillRect(p.x - 40, p.y + 2, 80, 8); c.strokeRect(p.x - 40, p.y + 2, 80, 8);
        c.fillStyle = S.col('#f4f8fb'); c.beginPath(); c.moveTo(p.x - 34, p.y + 2); c.bezierCurveTo(p.x - 34, p.y - 30, p.x - 4, p.y - 34, p.x + 4, p.y - 14); c.lineTo(p.x + 4, p.y + 2); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(p.x + 6, p.y + 2); c.quadraticCurveTo(p.x + 22, p.y - 40, p.x + 40, p.y - 22); c.quadraticCurveTo(p.x + 30, p.y - 10, p.x + 38, p.y + 2); c.closePath(); c.fill(); c.stroke();
        c.strokeStyle = rgba('#8aa8c8', 0.9); c.lineWidth = 1; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(p.x - 30 + i * 8, p.y); c.lineTo(p.x - 26 + i * 8, p.y - 22 + i * 2); c.stroke(); } c.strokeStyle = this.INK; c.lineWidth = 1.7;
      },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; ctx.fillStyle = `rgba(160,220,255,${0.3 + 0.2 * Math.sin(t * 2)})`; ctx.fillRect(p.x - 38, p.y + 4, 76, 3); }
    },
    // the aquarium: white domes and pools
    aquarium: {
      paint(c, S) { const p = S.anchor(42); if (!p) return; S.mem.p = p; this.base(c, S, p, 46, 22, '#c8d8e8'); c.fillStyle = S.col('#3aa8d8'); c.beginPath(); c.ellipse(p.x + 20, p.y + 6, 16, 6, 0, 0, TAU); c.fill(); c.stroke(); for (const [dx, r] of [[-18, 16], [6, 11]]) { c.fillStyle = S.col('#f4f8fb'); c.beginPath(); c.arc(p.x + dx, p.y + 2, r, Math.PI, 0); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = rgba('#8aa8c8', 0.9); c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); c.arc(p.x + dx, p.y + 2, r * i / 4, Math.PI, 0); c.stroke(); } c.strokeStyle = this.INK; c.lineWidth = 1.7; } },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; const k = (t * 0.7) % 1; ctx.save(); ctx.translate(p.x + 20 + Math.sin(t) * 8, p.y + 4 - Math.sin(k * Math.PI) * 12); ctx.rotate(-0.6 + k * 1.2); ctx.fillStyle = '#7a8aa8'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 2.4, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
    },
    /* ----- France ----- */
    // a Paris corner: tall cream houses with grey roofs, café tables, a street lamp
    paris: {
      paint(c, S) {
        const p = S.anchor(44); if (!p) return; this.base(c, S, p, 48, 22, '#d8d0c0');
        for (const [dx, w, h] of [[-30, 16, 26], [-12, 18, 30], [8, 16, 24]]) { const x = p.x + dx, y = p.y - 2; this.R(c, x - w / 2, y - h, w, h, S.col('#f0e4cc')); this.P(c, [[x - w / 2 - 1, y - h], [x - w / 2 + 3, y - h - 7], [x + w / 2 - 3, y - h - 7], [x + w / 2 + 1, y - h]], S.col('#7a8aa0')); c.fillStyle = S.col('#5a6a8a'); for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) c.fillRect(x - w / 2 + 3 + k * (w - 9), y - h + 4 + r * 7, 3, 4); }
        for (const dx of [24, 36]) { this.O(c, p.x + dx, p.y + 6, 5, S.col('#fff4e0'), 2); c.beginPath(); c.moveTo(p.x + dx, p.y + 6); c.lineTo(p.x + dx, p.y - 10); c.stroke(); this.P(c, [[p.x + dx - 8, p.y - 8], [p.x + dx, p.y - 14], [p.x + dx + 8, p.y - 8]], S.col('#c8323a')); }
        c.beginPath(); c.moveTo(p.x - 40, p.y + 6); c.lineTo(p.x - 40, p.y - 24); c.stroke(); this.O(c, p.x - 40, p.y - 26, 3, '#ffe08a');
      }
    },
    // the lavender fields: beehives, a magpie on a post
    lavender: {
      paint(c, S) { const p = S.anchor(40); if (!p) return; this.base(c, S, p, 44, 22, '#9a7ad0'); c.strokeStyle = rgba(S.col('#6a4aa8'), 0.9); c.lineWidth = 2; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(p.x + i * 10 - 8, p.y + 14); c.lineTo(p.x + i * 10 + 8, p.y - 14); c.stroke(); } c.strokeStyle = this.INK; c.lineWidth = 1.7; for (const dx of [-26, -14]) { this.R(c, p.x + dx, p.y - 4, 9, 9, S.col('#f0d8a0')); c.fillStyle = S.col('#c8a060'); c.fillRect(p.x + dx, p.y - 1, 9, 1.6); } c.beginPath(); c.moveTo(p.x + 26, p.y + 6); c.lineTo(p.x + 26, p.y - 14); c.stroke(); this.O(c, p.x + 26, p.y - 18, 4, '#1c1426', 3); c.fillStyle = '#fff'; c.fillRect(p.x + 23, p.y - 18, 4, 2); }
    },
    // a tidal islet: walls and stacked houses on a rock (no spire)
    islet: {
      paint(c, S) { const p = { x: S.x - 2, y: S.y - 18 }; c.fillStyle = S.col('#8a8478'); c.beginPath(); c.moveTo(p.x - 34, p.y + 10); c.quadraticCurveTo(p.x - 20, p.y - 30, p.x, p.y - 34); c.quadraticCurveTo(p.x + 22, p.y - 30, p.x + 34, p.y + 10); c.closePath(); c.fill(); c.stroke(); for (const [dx, dy, w, h] of [[-18, -6, 12, 10], [-4, -16, 12, 12], [10, -8, 12, 10], [2, -28, 9, 9]]) this.prop.house(c, p.x + dx, p.y + dy, w, h, '#e8dcc0', '#5a6a8a', S); },
      noPennants: true
    },
    // truffle woods: oaks, a pig sniffing, a basket
    truffle: {
      paint(c, S) { const p = S.anchor(42); if (!p) return; S.mem.p = p; this.base(c, S, p, 46, 22, '#6a8a4a'); for (const [dx, dy, r] of [[-26, -2, 20], [0, -10, 24], [26, 0, 19]]) { c.save(); c.translate(p.x + dx, p.y + dy); TourOWPaint.art.round.call(TourOWPaint, c, r, { col: '#3f7a3a' }, S.ow); c.restore(); } this.R(c, p.x - 26, p.y + 6, 9, 6, S.col('#b07a46')); c.fillStyle = '#3a2a2a'; c.beginPath(); c.arc(p.x - 21.5, p.y + 5, 2.6, 0, TAU); c.fill(); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; const x = p.x + Math.sin(t * 0.4) * 22; this.critter(ctx, 'pig', x, p.y + 12, S, Math.cos(t * 0.4) > 0 ? 1 : -1); }
    },
    // a formal garden by the château: hedges and a fountain
    garden: {
      paint(c, S) { for (const dx of [-48, 48]) { for (let k = 0; k < 2; k++) { c.fillStyle = S.col('#3f7a3a'); c.beginPath(); c.ellipse(S.x + dx, S.y - 10 + k * 14, 9, 4, 0, 0, TAU); c.fill(); c.stroke(); } } this.O(c, S.x - 40, S.y - 40, 8, S.col('#7ac8e8'), 3.6); S.mem.f = { x: S.x - 40, y: S.y - 40 }; },
      live(ctx, S, t) { const f = S.mem.f; if (!f) return; ctx.strokeStyle = 'rgba(200,240,255,0.9)'; ctx.lineWidth = 1.3; for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + t; ctx.beginPath(); ctx.moveTo(f.x, f.y - 3); ctx.quadraticCurveTo(f.x + Math.cos(a) * 5, f.y - 11, f.x + Math.cos(a) * 7, f.y - 1); ctx.stroke(); } },
      noPennants: true
    },
    // barges along the land's river
    barges: {
      paint(c, S) { const p = S.take(20); if (p) { this.R(c, p.x - 6, p.y - 5, 12, 5, S.col('#7a8aa0')); } },
      live(ctx, S, t) { const R = S.ow.G.rivers[S.o.river || 0]; if (!R) return; const P = S.mem.P || (S.mem.P = OWGeo.resample(R.pts, 6)); for (let i = 0; i < 2; i++) { const k = (Math.sin(t * 0.05 + i * 2.6) * 0.5 + 0.5) * 0.8 + 0.1, p = OWGeo.at(P, P.len * k); ctx.save(); ctx.translate(p.x, p.y + 3); ctx.rotate(Math.atan2(p.dy, p.dx) * 0.3); this.prop.boat(ctx, 0, 0, i ? '#3a5a8a' : '#2a6a4a', { w: 20 }); ctx.fillStyle = '#e8d8b8'; ctx.fillRect(-6, -9, 10, 4); ctx.strokeRect(-6, -9, 10, 4); ctx.restore(); } }
    },
    // hot-air balloons drifting over a field
    balloons: {
      paint(c, S) { const p = S.anchor(36); if (!p) return; S.mem.p = p; this.base(c, S, p, 40, 20, '#9ac87a'); this.R(c, p.x - 6, p.y - 6, 12, 7, S.col('#b07a46')); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; [['#e8323a', '#ffd23a', -20, 0], ['#3a6ad8', '#ffffff', 16, 2], ['#ff8aa8', '#ffd86a', 40, 4]].forEach(([a, b, dx, ph]) => { const x = p.x + dx + Math.sin(t * 0.3 + ph) * 10, y = p.y - 50 - ph * 6 + Math.sin(t * 0.8 + ph) * 6; ctx.fillStyle = a; ctx.beginPath(); ctx.ellipse(x, y, 9, 11, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = b; ctx.beginPath(); ctx.ellipse(x, y, 3.5, 11, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 6, y + 8); ctx.lineTo(x - 3, y + 15); ctx.moveTo(x + 6, y + 8); ctx.lineTo(x + 3, y + 15); ctx.stroke(); ctx.lineWidth = 1.6; ctx.fillStyle = '#b07a46'; ctx.fillRect(x - 3, y + 15, 6, 4); ctx.strokeRect(x - 3, y + 15, 6, 4); }); }
    },
    /* ----- the Netherlands ----- */
    // a glass greenhouse and carts of flowers
    greenhouse: {
      paint(c, S) { const p = S.anchor(42); if (!p) return; this.base(c, S, p, 46, 22, '#a8c890'); for (const dx of [-16, 8]) { c.fillStyle = S.col('#cfe8f0'); c.beginPath(); c.moveTo(p.x + dx - 12, p.y + 2); c.lineTo(p.x + dx - 12, p.y - 12); c.lineTo(p.x + dx, p.y - 20); c.lineTo(p.x + dx + 12, p.y - 12); c.lineTo(p.x + dx + 12, p.y + 2); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = rgba('#8ab0c0', 0.9); c.lineWidth = 1; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(p.x + dx - 12 + i * 6, p.y + 2); c.lineTo(p.x + dx - 12 + i * 6, p.y - 13); c.stroke(); } c.strokeStyle = this.INK; c.lineWidth = 1.7; } for (const [dx, col] of [[28, '#ff4a5a'], [38, '#ffd23a']]) { this.R(c, p.x + dx - 5, p.y + 2, 10, 5, S.col('#b07a46')); c.fillStyle = S.col(col); for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(p.x + dx - 3 + k * 3, p.y + 1, 2, 0, TAU); c.fill(); } } }
    },
    // a bike lane: bikes riding past
    bikes: {
      paint(c, S) { const p = S.anchor(40); if (!p) return; S.mem.p = p; this.base(c, S, p, 44, 18, '#c8b090'); c.fillStyle = S.col('#c8504a'); c.fillRect(p.x - 40, p.y - 3, 80, 7); c.strokeRect(p.x - 40, p.y - 3, 80, 7); c.strokeStyle = '#fff'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(p.x - 38, p.y + 0.5); c.lineTo(p.x + 38, p.y + 0.5); c.stroke(); c.setLineDash([]); c.strokeStyle = this.INK; },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; for (let i = 0; i < 3; i++) { const k = (t * 0.25 + i / 3) % 1, x = p.x - 38 + k * 76, y = p.y - 1; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x - 4, y, 2.6, 0, TAU); ctx.arc(x + 4, y, 2.6, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x, y - 5); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 5); ctx.lineTo(x, y - 11); ctx.stroke(); ctx.fillStyle = ['#ff7a1a', '#2a5ad8', '#e8322a'][i]; ctx.beginPath(); ctx.arc(x, y - 13, 2.4, 0, TAU); ctx.fill(); ctx.stroke(); } }
    },
    // a frozen canal with skaters and lamp posts
    skating: {
      paint(c, S) { const p = S.anchor(42); if (!p) return; S.mem.p = p; if (S.night) this.nightDome(c, S, p, 46); this.base(c, S, p, 46, 20, '#dff0f8', '#ffffff'); for (const dx of [-40, 40]) { c.beginPath(); c.moveTo(p.x + dx, p.y + 2); c.lineTo(p.x + dx, p.y - 26); c.stroke(); this.O(c, p.x + dx, p.y - 28, 3, '#ffe08a'); } },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; for (let i = 0; i < 3; i++) { const a = t * 0.8 + i * 2.1, x = p.x + Math.cos(a) * 26, y = p.y + Math.sin(a) * 7 - 2; ctx.fillStyle = ['#ff7a1a', '#2a5ad8', '#e8322a'][i]; ctx.beginPath(); ctx.ellipse(x, y - 6, 2.6, 5, Math.sin(a) * 0.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f0d0b0'; ctx.beginPath(); ctx.arc(x, y - 12.5, 2.2, 0, TAU); ctx.fill(); ctx.stroke(); } if (S.night) for (const dx of [-40, 40]) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,220,140,0.25)'; ctx.beginPath(); ctx.arc(p.x + dx, p.y - 28, 10 + Math.sin(t * 3) * 1.5, 0, TAU); ctx.fill(); ctx.restore(); } }
    },
    // tall narrow canal houses with stepped gables
    canalhouses: {
      paint(c, S) { const cols = ['#c8604a', '#7a4a3a', '#e8d8b8', '#3a5a6a']; for (let i = 0; i < 4; i++) { const x = S.x - 52 + i * 12 + (i > 1 ? 80 : 0), y = S.y + 2, w = 11, h = 26 + (i % 2) * 6; this.R(c, x - w / 2, y - h, w, h, S.col(cols[i])); this.P(c, [[x - w / 2, y - h], [x - 3, y - h - 5], [x, y - h - 9], [x + 3, y - h - 5], [x + w / 2, y - h]], S.col(cols[i])); c.fillStyle = '#fff4d8'; for (let r = 0; r < 3; r++) c.fillRect(x - 2.5, y - h + 4 + r * 7, 5, 3.5); } },
      noPennants: true
    },
    /* ----- Bali ----- */
    // the surf beach: boards in the sand, an umbrella, waves rolling in
    surf: {
      paint(c, S) { const p = S.anchor(38); if (!p) return; S.mem.p = p; this.base(c, S, p, 42, 20, '#f0dca0'); for (const [dx, col] of [[-20, '#ff5a8a'], [-12, '#14b4ac'], [-4, '#ffc23a']]) { c.save(); c.translate(p.x + dx, p.y + 2); c.rotate(0.12); c.fillStyle = S.col(col); c.beginPath(); c.ellipse(0, -11, 3.4, 12, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); } c.beginPath(); c.moveTo(p.x + 20, p.y + 6); c.lineTo(p.x + 20, p.y - 18); c.stroke(); this.P(c, [[p.x + 6, p.y - 14], [p.x + 20, p.y - 24], [p.x + 34, p.y - 14]], S.col('#ff5a8a')); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; for (let i = 0; i < 2; i++) { const k = (t * 0.3 + i / 2) % 1; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(p.x - 4, p.y + 30 - k * 8, 26 + k * 10, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); } ctx.globalAlpha = 1; }
    },
    // kites over a field, strings to the ground
    kites: {
      paint(c, S) { const p = S.anchor(36); if (!p) return; S.mem.p = p; this.base(c, S, p, 40, 20, '#9ccf6b'); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; [['#ff5a8a', -24, 0], ['#14b4ac', 4, 1.3], ['#ffc23a', 28, 2.6]].forEach(([col, dx, ph]) => { const x = p.x + dx + Math.sin(t * 0.9 + ph) * 8, y = p.y - 56 + Math.sin(t * 1.3 + ph) * 6; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(p.x + dx * 0.4, p.y + 2); ctx.quadraticCurveTo(p.x + dx * 0.6, p.y - 20, x, y + 8); ctx.stroke(); ctx.lineWidth = 1.5; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2 + ph) * 0.2); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(7, 0); ctx.lineTo(0, 9); ctx.lineTo(-7, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 9); ctx.quadraticCurveTo(4, 14, 0, 19); ctx.stroke(); ctx.restore(); }); }
    },
    // a jetty over the water with mantas gliding under it (night)
    manta: {
      wet: true,
      paint(c, S) { const p = S.anchor(32, true); if (!p) return; S.mem.p = p; if (S.night) this.nightDome(c, S, p, 40); for (let i = 0; i < 4; i++) { c.fillStyle = S.col('#b07a46'); c.fillRect(p.x - 30 + i * 9, p.y - 4, 8, 5); c.strokeRect(p.x - 30 + i * 9, p.y - 4, 8, 5); } c.beginPath(); c.moveTo(p.x + 6, p.y); c.lineTo(p.x + 6, p.y - 22); c.stroke(); this.O(c, p.x + 6, p.y - 24, 3, '#ffe08a'); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; for (let i = 0; i < 2; i++) { const a = t * 0.5 + i * 3, x = p.x + Math.cos(a) * 26, y = p.y + 14 + Math.sin(a) * 6, f = Math.sin(t * 4 + i) * 3; ctx.fillStyle = 'rgba(20,30,60,0.55)'; ctx.beginPath(); ctx.moveTo(x - 12, y - f); ctx.quadraticCurveTo(x, y - 6, x + 12, y - f); ctx.quadraticCurveTo(x, y + 6, x - 12, y - f); ctx.fill(); } }
    },
    // a crater with blue flames and a little rail cart
    bluefire: {
      paint(c, S) { const p = S.anchor(40); if (!p) return; S.mem.p = p; this.base(c, S, p, 44, 22, '#8a8494'); c.fillStyle = S.col('#3a3444'); c.beginPath(); c.ellipse(p.x, p.y, 26, 11, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = S.col('#e8e070'); c.fillRect(p.x - 34, p.y + 10, 12, 5); this.R(c, p.x + 22, p.y + 6, 12, 7, S.col('#7a6a5a')); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const x = p.x - 16 + i * 8, h = 10 + Math.sin(t * 7 + i * 1.7) * 4; ctx.fillStyle = 'rgba(80,160,255,0.75)'; ctx.beginPath(); ctx.moveTo(x - 3.5, p.y + 2); ctx.quadraticCurveTo(x - 4, p.y - h * 0.6, x, p.y - h); ctx.quadraticCurveTo(x + 4, p.y - h * 0.6, x + 3.5, p.y + 2); ctx.fill(); } ctx.restore(); }
    },
    /* ----- Vietnam ----- */
    // train street: narrow houses on both sides of a track, a train rolling through
    trainstreet: {
      paint(c, S) { const p = S.anchor(44); if (!p) return; S.mem.p = p; this.base(c, S, p, 48, 22, '#c8b8a0'); c.strokeStyle = S.col('#6a5a5a'); c.lineWidth = 1.4; for (const dy of [-3, 3]) { c.beginPath(); c.moveTo(p.x - 44, p.y + dy); c.lineTo(p.x + 44, p.y + dy); c.stroke(); } c.strokeStyle = this.INK; c.lineWidth = 1.7; const cols = ['#e8d070', '#7ac8a8', '#e89070', '#a8c8e8']; for (let i = 0; i < 4; i++) this.prop.house(c, p.x - 32 + i * 21, p.y - 8, 13, 16 + (i % 2) * 5, cols[i], '#a84a3a', S, true); for (let i = 0; i < 3; i++) this.prop.house(c, p.x - 22 + i * 22, p.y + 18, 13, 9, cols[(i + 2) % 4], '#a84a3a', S, true); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; const k = (t * 0.12) % 1.6; if (k > 1) return; const x = p.x - 70 + k * 140; ctx.save(); ctx.beginPath(); ctx.rect(p.x - 46, p.y - 20, 92, 30); ctx.clip(); for (let i = 0; i < 3; i++) { const cx = x - i * 24; ctx.fillStyle = i ? '#3a6a8a' : '#2a4a6a'; ctx.fillRect(cx - 11, p.y - 9, 22, 10); ctx.strokeRect(cx - 11, p.y - 9, 22, 10); ctx.fillStyle = '#ffe8a0'; ctx.fillRect(cx - 8, p.y - 7, 4, 3); ctx.fillRect(cx + 2, p.y - 7, 4, 3); } ctx.restore(); }
    },
    // junks with red sails among limestone towers (in the water)
    junks: {
      wet: true,
      paint(c, S) { const p = S.anchor(30, true); if (p) S.mem.p = p; },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; for (let i = 0; i < 2; i++) { const x = p.x + Math.sin(t * 0.15 + i * 2) * 30, y = p.y + i * 10; ctx.save(); ctx.translate(x, y); if (Math.cos(t * 0.15 + i * 2) < 0) ctx.scale(-1, 1); this.prop.boat(ctx, 0, 0, '#7a4a30', { w: 22 }); for (const sx of [-4, 4]) { ctx.beginPath(); ctx.moveTo(sx, -5); ctx.lineTo(sx, -22); ctx.stroke(); ctx.fillStyle = '#c8402a'; ctx.beginPath(); ctx.moveTo(sx + 1, -21); ctx.quadraticCurveTo(sx + 9, -15, sx + 1, -7); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.restore(); } }
    },
    // a cave mouth in a green mountain, a beam of light into it
    cave: {
      paint(c, S) { const p = S.anchor(44); if (!p) return; S.mem.p = p; c.beginPath(); c.moveTo(p.x - 46, p.y + 6); c.bezierCurveTo(p.x - 40, p.y - 50, p.x + 40, p.y - 56, p.x + 46, p.y + 6); c.closePath(); c.fillStyle = S.col('#6a9a6a'); c.fill(); c.stroke(); c.fillStyle = S.col('#3f7a4a'); c.beginPath(); c.ellipse(p.x - 6, p.y - 34, 26, 10, 0, 0, TAU); c.fill(); c.fillStyle = '#100a14'; c.beginPath(); c.moveTo(p.x - 18, p.y + 6); c.quadraticCurveTo(p.x - 16, p.y - 26, p.x + 2, p.y - 26); c.quadraticCurveTo(p.x + 20, p.y - 24, p.x + 20, p.y + 6); c.closePath(); c.fill(); c.stroke(); c.fillStyle = S.col('#3aa8c8'); c.beginPath(); c.ellipse(p.x + 1, p.y + 3, 17, 4, 0, 0, TAU); c.fill(); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,250,200,${0.14 + 0.05 * Math.sin(t)})`; ctx.beginPath(); ctx.moveTo(p.x - 4, p.y - 26); ctx.lineTo(p.x + 6, p.y - 26); ctx.lineTo(p.x + 12, p.y + 2); ctx.lineTo(p.x - 8, p.y + 2); ctx.closePath(); ctx.fill(); ctx.restore(); }
    },
    // a floating market: boats laden with fruit on the river
    floatmarket: {
      paint(c, S) { const p = S.take(20); if (p) this.prop.crate(c, p.x, p.y, '#ffd23a', S); },
      live(ctx, S, t) { const R = S.ow.G.rivers[S.o.river || 0]; if (!R) return; const P = S.mem.P || (S.mem.P = OWGeo.resample(R.pts, 6)); for (let i = 0; i < 3; i++) { const k = (Math.sin(t * 0.04 + i * 2.2) * 0.5 + 0.5) * 0.7 + 0.15, p = OWGeo.at(P, P.len * k); this.prop.boat(ctx, p.x, p.y + 3, '#6a4a30', { w: 18 }); ctx.lineWidth = 0.9; for (let q = 0; q < 4; q++) this.O(ctx, p.x - 5 + q * 3.4, p.y - 3, 2.2, ['#ffd23a', '#7ac850', '#ff8a2a', '#e8323a'][(q + i) % 4]); ctx.lineWidth = 1.6; this.P(ctx, [[p.x - 7, p.y - 4], [p.x, p.y - 9], [p.x + 7, p.y - 4]], '#e8d070'); } }
    },
    // a citadel moat with lotus pads
    moat: {
      paint(c, S) { c.fillStyle = S.col('#3a98a8'); c.beginPath(); c.ellipse(S.x, S.y + 4, 56, 14, 0, 0, Math.PI); c.lineTo(S.x - 56, S.y + 4); c.ellipse(S.x, S.y + 4, 46, 9, 0, Math.PI, 0, true); c.closePath(); c.fill(); c.stroke(); c.fillStyle = S.col('#6ab45a'); for (const dx of [-44, -30, 34, 46]) { c.beginPath(); c.arc(S.x + dx, S.y + 12, 3, 0.4, TAU); c.lineTo(S.x + dx, S.y + 12); c.fill(); } c.fillStyle = '#ff8ad0'; c.beginPath(); c.arc(S.x - 30, S.y + 11, 1.8, 0, TAU); c.arc(S.x + 46, S.y + 11, 1.8, 0, TAU); c.fill(); },
      noPennants: true
    },
    /* ----- Japan ----- */
    // a sushi bar with a conveyor belt of plates going round
    sushi: {
      paint(c, S) { const p = S.anchor(40); if (!p) return; S.mem.p = p; this.base(c, S, p, 44, 21, '#e8d8c0'); this.prop.house(c, p.x, p.y - 4, 34, 14, '#f4ecd8', '#3a4a6a', S); c.fillStyle = S.col('#e8384f'); c.fillRect(p.x - 17, p.y - 18, 34, 4); this.R(c, p.x - 30, p.y + 4, 60, 9, S.col('#c8b8a0')); c.fillStyle = S.col('#8a7a6a'); c.fillRect(p.x - 27, p.y + 7, 54, 3); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; for (let i = 0; i < 6; i++) { const k = (t * 0.15 + i / 6) % 1, x = p.x - 27 + k * 54; ctx.lineWidth = 0.9; this.O(ctx, x, p.y + 7, 3.4, '#ffffff', 1.6); ctx.fillStyle = ['#ff8a5a', '#ffd23a', '#e8384f'][i % 3]; ctx.fillRect(x - 2, p.y + 4.5, 4, 2); ctx.lineWidth = 1.6; } }
    },
    // a viaduct with the bullet train zooming across
    bullettrain: {
      paint(c, S) { const p = S.anchor(46); if (!p) return; S.mem.p = p; this.R(c, p.x - 50, p.y - 14, 100, 5, S.col('#c9c3b6')); for (const dx of [-40, -10, 20, 46]) this.R(c, p.x + dx - 2.5, p.y - 9, 5, 12, S.col('#b8b2a6')); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; const k = (t * 0.35) % 2.2; if (k > 1.4) return; const x = p.x - 90 + k * 130; ctx.save(); ctx.beginPath(); ctx.rect(p.x - 52, p.y - 40, 104, 30); ctx.clip(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 46, p.y - 14); ctx.lineTo(x - 46, p.y - 24); ctx.lineTo(x, p.y - 24); ctx.quadraticCurveTo(x + 14, p.y - 23, x + 16, p.y - 14); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2f6fb3'; ctx.fillRect(x - 46, p.y - 18, 58, 2); ctx.fillStyle = '#334f63'; for (let i = 0; i < 6; i++) ctx.fillRect(x - 42 + i * 7, p.y - 22.5, 4, 3); ctx.restore(); }
    },
    // bamboo at night with floating paper lanterns
    bamboonight: {
      paint(c, S) { const p = S.anchor(44); if (!p) return; S.mem.p = p; if (S.night) this.nightDome(c, S, p, 48); this.base(c, S, p, 48, 22, '#3f6a4a'); for (const [dx, dy, h] of [[-30, 0, 20], [-14, -8, 24], [6, -10, 26], [24, -4, 22], [36, 4, 18]]) { c.save(); c.translate(p.x + dx, p.y + dy); TourOWPaint.art.bamboo.call(TourOWPaint, c, h, {}); c.restore(); } },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; for (let i = 0; i < 4; i++) { const x = p.x - 30 + i * 20 + Math.sin(t * 0.8 + i) * 4, y = p.y - 44 + Math.sin(t * 1.1 + i * 1.7) * 5; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,190,90,0.3)'; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); ctx.restore(); ctx.fillStyle = '#ffd86a'; ctx.beginPath(); ctx.ellipse(x, y, 3, 4, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 0.8; ctx.stroke(); ctx.lineWidth = 1.6; } }
    },
    // tall towers with blinking neon signs
    neon: {
      paint(c, S) { const p = S.anchor(42); if (!p) return; S.mem.p = p; if (S.night) this.nightDome(c, S, p, 46); S.mem.b = []; for (const [dx, w, h] of [[-26, 16, 44], [-6, 18, 58], [16, 16, 48], [34, 12, 34]]) { const x = p.x + dx; this.R(c, x - w / 2, p.y - h, w, h, S.col('#3a3a5a')); c.fillStyle = '#ffe8a0'; for (let r = 0; r < h / 8 - 1; r++) for (let k = 0; k < 2; k++) if ((r + k + dx) % 3) c.fillRect(x - w / 2 + 3 + k * (w - 9), p.y - h + 4 + r * 8, 3, 3); S.mem.b.push([x, p.y - h + 10, w]); } },
      live(ctx, S, t) { const cols = ['#ff4fd8', '#38e8ff', '#ffe84a', '#7aff8a']; (S.mem.b || []).forEach(([x, y, w], i) => { const on = Math.sin(t * 3 + i * 1.7) > -0.3; ctx.fillStyle = on ? cols[i % 4] : 'rgba(80,80,100,0.8)'; ctx.fillRect(x - w / 2 + 2, y, 3, 14); ctx.strokeRect(x - w / 2 + 2, y, 3, 14); if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(cols[i % 4], 0.3); ctx.beginPath(); ctx.arc(x - w / 2 + 3.5, y + 7, 8, 0, TAU); ctx.fill(); ctx.restore(); } }); }
    },
    // the kappa pond: stepping stones, lily pads, a kappa peeking up
    kappapond: {
      paint(c, S) { const x = S.x - 46, y = S.y - 30; c.fillStyle = S.col('#3a98a8'); c.beginPath(); c.ellipse(x, y, 22, 9, 0, 0, TAU); c.fill(); c.stroke(); for (const [dx, dy] of [[-12, 1], [-2, -2], [8, 2]]) this.O(c, x + dx, y + dy, 3.4, S.col('#a8a4b0'), 2); S.mem.k = { x: x + 14, y: y - 1 }; },
      live(ctx, S, t) { const k = S.mem.k; if (!k) return; const up = Math.max(0, Math.sin(t * 0.7)) * 5; ctx.save(); ctx.beginPath(); ctx.rect(k.x - 8, k.y - 14, 16, 14); ctx.clip(); this.O(ctx, k.x, k.y + 2 - up, 4.5, '#5ab87a'); ctx.fillStyle = '#e8e4c8'; ctx.beginPath(); ctx.ellipse(k.x, k.y - 2 - up, 3, 1.2, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); },
      noPennants: true
    },
    // a giant capsule-toy machine
    gacha: {
      paint(c, S) { const p = S.anchor(32); if (!p) return; this.base(c, S, p, 34, 16, '#e8d8e0'); this.R(c, p.x - 12, p.y - 16, 24, 16, S.col('#e8384f')); c.fillStyle = S.col('#e8f4fb'); c.beginPath(); c.arc(p.x, p.y - 26, 13, 0, TAU); c.fill(); c.stroke(); c.lineWidth = 1; for (const [dx, dy, col] of [[-5, -24, '#ffd23a'], [4, -28, '#38c8ff'], [2, -20, '#7ac850'], [-6, -31, '#ff8ad0']]) this.O(c, p.x + dx, p.y + dy, 3.4, col); c.lineWidth = 1.7; this.O(c, p.x, p.y - 8, 3, '#ffd23a'); }
    },
    /* ----- Nepal ----- */
    // a gorge with a rope bridge
    gorge: {
      paint(c, S) { const p = S.anchor(42); if (!p) return; c.fillStyle = S.col('#6a5a52'); c.beginPath(); c.ellipse(p.x, p.y, 44, 16, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#2a2430'; c.beginPath(); c.ellipse(p.x, p.y + 1, 12, 13, 0, 0, TAU); c.fill(); c.fillStyle = S.col('#7ac8e8'); c.fillRect(p.x - 3, p.y - 2, 6, 14); c.lineWidth = 1.2; for (const off of [-4, 0]) { c.beginPath(); c.moveTo(p.x - 30, p.y + off - 6); c.quadraticCurveTo(p.x, p.y + off + 6, p.x + 30, p.y + off - 6); c.stroke(); } for (let i = 0; i < 8; i++) { const u = i / 7, x = p.x - 30 + 60 * u, y = p.y - 6 + 12 * u * (1 - u) * 2 - 2; c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x, y); c.stroke(); } c.lineWidth = 1.7; for (const dx of [-32, 32]) { c.beginPath(); c.moveTo(p.x + dx, p.y - 2); c.lineTo(p.x + dx, p.y - 16); c.stroke(); } }
    },
    // a snowy camp: tents, snow falling (night)
    camp: {
      paint(c, S) { const p = S.anchor(40); if (!p) return; S.mem.p = p; if (S.night) this.nightDome(c, S, p, 44); this.base(c, S, p, 44, 21, '#eef4f8'); for (const [dx, col] of [[-18, '#e8423a'], [6, '#ffd23a'], [26, '#2a5aa8']]) this.P(c, [[p.x + dx - 11, p.y + 4], [p.x + dx, p.y - 14], [p.x + dx + 11, p.y + 4]], S.col(col)); c.fillStyle = '#ffe08a'; c.fillRect(p.x - 20, p.y - 2, 4, 6); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < 14; i++) { const x = p.x - 46 + ((i * 37 + t * 12) % 92), y = p.y - 60 + ((i * 23 + t * 30) % 70); ctx.beginPath(); ctx.arc(x, y, 1.4, 0, TAU); ctx.fill(); } }
    },
    // ice seracs: blocky blue-white towers of ice
    seracs: {
      paint(c, S) { const p = S.anchor(42); if (!p) return; this.base(c, S, p, 46, 20, '#dff0f8'); for (const [dx, w, h] of [[-26, 14, 22], [-8, 16, 32], [12, 12, 26], [28, 14, 18]]) { this.P(c, [[p.x + dx - w / 2, p.y + 2], [p.x + dx - w / 2 + 2, p.y - h], [p.x + dx + w / 2 - 3, p.y - h + 4], [p.x + dx + w / 2, p.y + 2]], S.col('#e8f6fc')); c.fillStyle = S.col('#9ad0e8'); c.beginPath(); c.moveTo(p.x + dx + 2, p.y - h + 2); c.lineTo(p.x + dx + w / 2 - 3, p.y - h + 4); c.lineTo(p.x + dx + w / 2, p.y + 2); c.lineTo(p.x + dx + 3, p.y + 2); c.closePath(); c.fill(); } }
    },
    // a crack in the ice, deep blue
    crevasse: {
      paint(c, S) { const p = S.anchor(38); if (!p) return; this.base(c, S, p, 42, 18, '#eef6fa'); c.fillStyle = S.col('#2a6aa8'); c.beginPath(); c.moveTo(p.x - 34, p.y); for (let i = 1; i <= 8; i++) c.lineTo(p.x - 34 + i * 8.5, p.y + (i % 2 ? -4 : 3)); for (let i = 8; i >= 0; i--) c.lineTo(p.x - 34 + i * 8.5, p.y + (i % 2 ? 1 : 7)); c.closePath(); c.fill(); c.stroke(); }
    },
    // the Baron's supply depot: crates stamped B, barrels, a tarp
    depot: {
      paint(c, S) { const p = S.anchor(40); if (!p) return; this.base(c, S, p, 44, 20, '#c8c4b8'); for (const [dx, dy] of [[-22, 2], [-10, 4], [-16, -8]]) { this.R(c, p.x + dx - 6, p.y + dy - 10, 12, 10, S.col('#a8784a')); c.fillStyle = '#6a4a8a'; c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('B', p.x + dx, p.y + dy - 5); } for (const dx of [10, 18]) { this.R(c, p.x + dx - 3.5, p.y - 8, 7, 10, S.col('#4a4a5a')); } this.P(c, [[p.x + 22, p.y + 4], [p.x + 30, p.y - 12], [p.x + 40, p.y + 4]], S.col('#6a4a8a')); }
    },
    /* ----- Antarctica ----- */
    // penguins as bowling pins, a snowball rolling at them
    bowling: {
      paint(c, S) { const p = S.anchor(40); if (!p) return; S.mem.p = p; this.base(c, S, p, 44, 18, '#e8f4fa', '#ffffff'); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; const pins = [[18, -6], [26, -10], [26, -2], [34, -14], [34, -6], [34, 2]]; const k = (t * 0.3) % 1.4, x = p.x - 36 + Math.min(k, 1) * 60; pins.forEach(([dx, dy], i) => { const hit = k > 1 && k < 1.35, tilt = hit ? (i % 2 ? 0.6 : -0.6) * Math.min(1, (k - 1) * 6) : 0; ctx.save(); ctx.translate(p.x + dx, p.y + dy + 6); ctx.rotate(tilt); this.critter(ctx, 'penguin', 0, 0, S, -1); ctx.restore(); }); if (k <= 1.05) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, p.y - 2, 6, 0, TAU); ctx.fill(); ctx.stroke(); } }
    },
    // aurora curtains over the ice (night)
    aurora: {
      paint(c, S) { const p = S.anchor(40); if (!p) return; S.mem.p = p; if (S.night) this.nightDome(c, S, p, 50); this.base(c, S, p, 44, 18, '#e8f4fa'); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; ctx.save(); for (let b = 0; b < 3; b++) { const g = ctx.createLinearGradient(0, p.y - 90, 0, p.y - 40); g.addColorStop(0, 'rgba(120,255,180,0)'); g.addColorStop(1, b % 2 ? 'rgba(170,120,255,0.55)' : 'rgba(80,240,160,0.6)'); ctx.fillStyle = g; ctx.beginPath(); for (let i = 0; i <= 12; i++) { const x = p.x - 54 + i * 9, y = p.y - 44 + Math.sin(t * 1.2 + i * 0.7 + b) * 5 - b * 6; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } for (let i = 12; i >= 0; i--) { const x = p.x - 54 + i * 9 + Math.sin(t + i) * 2; ctx.lineTo(x, p.y - 90 - b * 6 + Math.sin(t * 0.8 + i) * 6); } ctx.closePath(); ctx.fill(); } ctx.restore(); }
    },
    // the station: huts on stilts, an antenna mast
    station: {
      paint(c, S) { const p = S.anchor(40); if (!p) return; S.mem.p = p; this.base(c, S, p, 44, 18, '#e8f4fa'); for (const [dx, col] of [[-16, '#e8423a'], [10, '#ffd23a']]) { for (const lx of [-8, 8]) { c.beginPath(); c.moveTo(p.x + dx + lx, p.y + 2); c.lineTo(p.x + dx + lx, p.y - 6); c.stroke(); } this.R(c, p.x + dx - 11, p.y - 16, 22, 10, S.col(col)); c.fillStyle = '#7ad8ff'; c.fillRect(p.x + dx - 6, p.y - 13, 4, 3); c.fillRect(p.x + dx + 2, p.y - 13, 4, 3); } c.beginPath(); c.moveTo(p.x + 32, p.y + 2); c.lineTo(p.x + 32, p.y - 34); c.moveTo(p.x + 26, p.y - 26); c.lineTo(p.x + 38, p.y - 26); c.stroke(); S.mem.a = { x: p.x + 32, y: p.y - 34 }; },
      live(ctx, S, t) { const a = S.mem.a; if (!a) return; if (Math.sin(t * 4) > 0) { ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.arc(a.x, a.y, 2.2, 0, TAU); ctx.fill(); } }
    },
    // the big floe: a walrus with great tusks lounging
    walrus: { paint(c, S) { const p = { x: S.x - 50, y: S.y - 14 }; this.critter(c, 'walrus', p.x, p.y, S, 1); }, noPennants: true },
    // a penguin colony with eggs
    colony: {
      paint(c, S) { const p = S.anchor(40); if (!p) return; S.mem.p = p; this.base(c, S, p, 44, 18, '#e8f4fa'); c.lineWidth = 0.9; for (const [dx, dy] of [[-20, 4], [16, 6], [2, -6]]) this.O(c, p.x + dx, p.y + dy, 2.6, '#fff8e0', 3.2); c.lineWidth = 1.7; },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; for (let i = 0; i < 4; i++) { const x = p.x - 30 + i * 18 + Math.sin(t * 0.7 + i) * 3, y = p.y + 2 - (i % 2) * 8; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 5 + i) * 0.08); this.critter(ctx, 'penguin', 0, 0, S, i % 2 ? -1 : 1); ctx.restore(); } }
    },
    /* ----- World 22 ----- */
    // giant clock faces, hands sweeping
    clocks: {
      paint(c, S) { const p = S.anchor(42); if (!p) return; S.mem.p = p; this.base(c, S, p, 46, 20, '#d8ccf0'); S.mem.cl = []; for (const [dx, dy, r] of [[-22, -16, 13], [8, -24, 16], [30, -8, 10]]) { c.beginPath(); c.moveTo(p.x + dx, p.y + dy + r); c.lineTo(p.x + dx, p.y + 2); c.stroke(); this.O(c, p.x + dx, p.y + dy, r, S.col('#fff4d8')); c.fillStyle = '#8a6ad8'; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.fillRect(p.x + dx + Math.cos(a) * r * 0.8 - 0.8, p.y + dy + Math.sin(a) * r * 0.8 - 0.8, 1.6, 1.6); } S.mem.cl.push([p.x + dx, p.y + dy, r]); } },
      live(ctx, S, t) { (S.mem.cl || []).forEach(([x, y, r], i) => { ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(t * (i + 1) * 0.7) * r * 0.75, y + Math.sin(t * (i + 1) * 0.7) * r * 0.75); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(t * 0.08 + i) * r * 0.5, y + Math.sin(t * 0.08 + i) * r * 0.5); ctx.stroke(); }); }
    },
    // free-standing doors in a row, one ajar and glowing
    doors: {
      paint(c, S) { const p = S.anchor(42); if (!p) return; S.mem.p = p; this.base(c, S, p, 46, 18, '#c8b8e8'); for (let i = 0; i < 4; i++) { const x = p.x - 30 + i * 20, y = p.y + 4 - i * 3; this.R(c, x - 6, y - 22, 12, 22, S.col(['#8a5a3a', '#5a6aa8', '#a84a5a', '#3a7a5a'][i])); c.fillStyle = '#ffd86a'; c.beginPath(); c.arc(x + 3.5, y - 10, 1.2, 0, TAU); c.fill(); } },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,230,150,${0.25 + 0.15 * Math.sin(t * 2)})`; ctx.beginPath(); ctx.moveTo(p.x + 24, p.y - 27); ctx.lineTo(p.x + 36, p.y - 27); ctx.lineTo(p.x + 46, p.y - 5); ctx.lineTo(p.x + 30, p.y - 5); ctx.closePath(); ctx.fill(); ctx.restore(); }
    },
    // the mirror lake: the land's lake shows the island upside down
    mirror: {
      paint(c, S) { const L = S.ow.G.lakes[0]; if (!L) return; const cx = L.reduce((s, q) => s + q[0], 0) / L.length, cy = L.reduce((s, q) => s + q[1], 0) / L.length; c.save(); OWGeo.path(c, L, true); c.clip(); c.globalAlpha = 0.5; for (const [dx, h] of [[-26, 24], [-4, 34], [20, 26]]) { c.fillStyle = '#c8a8ff'; c.beginPath(); c.moveTo(cx + dx - 10, cy - 6); c.lineTo(cx + dx, cy - 6 + h); c.lineTo(cx + dx + 10, cy - 6); c.closePath(); c.fill(); } c.restore(); S.mem.L = { cx, cy }; },
      live(ctx, S, t) { const L = S.mem.L; if (!L) return; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { const k = (t * 0.3 + i / 3) % 1; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(L.cx, L.cy, 8 + k * 30, 3 + k * 10, 0, 0, TAU); ctx.stroke(); } ctx.globalAlpha = 1; }
    },
    // a giant writing desk: paper, an inkpot, a pen
    desk: {
      paint(c, S) { const p = S.anchor(44); if (!p) return; S.mem.p = p; this.R(c, p.x - 40, p.y - 16, 80, 8, S.col('#8a5a3a')); for (const dx of [-34, 30]) this.R(c, p.x + dx - 2, p.y - 8, 6, 12, S.col('#6a4a2a')); c.save(); c.translate(p.x - 10, p.y - 20); c.rotate(-0.1); this.R(c, -12, -4, 24, 8, S.col('#fff8e8')); c.restore(); this.R(c, p.x + 14, p.y - 26, 9, 10, S.col('#2a2a4a')); },
      live(ctx, S, t) { const p = S.mem.p; if (!p) return; ctx.save(); ctx.translate(p.x - 8 + Math.sin(t * 2) * 8, p.y - 30 + Math.abs(Math.sin(t * 4)) * -2); ctx.rotate(0.6); ctx.fillStyle = '#fff4d8'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, -18, 2, -26); ctx.quadraticCurveTo(-2, -14, 0, 0); ctx.fill(); ctx.stroke(); ctx.restore(); }
    },
    // the 22nd door: a great door glowing behind the fort
    bigdoor: { paint(c, S) { const x = S.x - 48, y = S.y + 2; this.R(c, x - 12, y - 40, 24, 40, S.col('#7a5ab8')); c.fillStyle = S.col('#ffd86a'); c.fillRect(x - 8, y - 36, 16, 34); c.fillStyle = '#1c1426'; c.font = `9px ${FONT_DISPLAY}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('22', x, y - 20); }, noPennants: true },
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
    smoke(ctx, ow, l, t) { this.smoke(ctx, l[1], l[2], t, l[3] || 1); },
    // butterflies fluttering around a spot: ['flutter', x, y, colour]
    flutter(ctx, ow, l, t, vr) {
      const [, x, y, col] = l; if (x < vr.x0 - 60 || x > vr.x1 + 60 || y < vr.y0 - 60 || y > vr.y1 + 60) return;
      for (let i = 0; i < 4; i++) { const a = t * (0.6 + i * 0.13) + i * 1.6, px = x + Math.cos(a) * (24 + i * 6) + Math.sin(t * 2.3 + i) * 5, py = y + Math.sin(a * 1.3) * 12 - 10, f = Math.abs(Math.sin(t * 14 + i)); ctx.fillStyle = col || '#ff8a1a'; ctx.lineWidth = 0.8; for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.ellipse(px + s2 * 2.4 * f, py, 2.6 * f + 0.4, 2.2, s2 * 0.4, 0, TAU); ctx.fill(); ctx.stroke(); } }
    },
    // a whale (or dolphins) surfacing now and then: ['spout', x, y]
    spout(ctx, ow, l, t, vr) {
      const [, x, y] = l; if (x < vr.x0 - 60 || x > vr.x1 + 60 || y < vr.y0 - 60 || y > vr.y1 + 60) return;
      const k = (t * 0.25) % 1; if (k > 0.45) return; const u = k / 0.45;
      ctx.fillStyle = '#4a6a8a'; ctx.beginPath(); ctx.ellipse(x, y, 16, 5 * Math.sin(u * Math.PI), 0, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x - 3 + i * 2, y - 8 - u * 12 - (i % 2) * 3, 2.2 * (1 - u * 0.5), 0, TAU); ctx.fill(); }
    }
  }
};
