/* ============================================================
   World tour: painting a land's overworld in the Fiesta Toon look
   (flat cel colours, dark ink outlines). TourOWPaint.map paints the
   static island once into the overworld's offscreen canvas; live and
   over add the few animated details each frame; node, trail and
   roadblock draw the stops and the paths. Scenery sprites: mountains,
   hills, trees of each land, towns, rocks, the landmark.
   ============================================================ */
const TourOWPaint = {
  INK: '#1c1426',
  rng(seed) { return mulberry32(hashStr(String(seed))); },

  /* ---------- the static map ---------- */
  map(c, ow) {
    const G = ow.G, L = ow.look, M = G.M, ink = this.INK;
    c.lineJoin = 'round'; c.lineCap = 'round';
    // the sea: a soft gradient and little wave marks
    const sg = c.createLinearGradient(0, 0, 0, G.h); sg.addColorStop(0, mix(L.sea, '#ffffff', 0.08)); sg.addColorStop(1, L.deep);
    c.fillStyle = sg; c.fillRect(0, 0, G.w, G.h);
    const R = this.rng(G.cc + 'sea');
    c.strokeStyle = rgba(mix(L.sea, '#ffffff', 0.5), 0.35); c.lineWidth = 2;
    for (let i = 0; i < Math.round(G.w * G.h / 9000); i++) {
      const x = R() * G.w, y = R() * G.h; if (G.land.some(r => OWGeo.inPoly(x, y + 20, r))) continue;
      c.beginPath(); c.arc(x, y, 6, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); c.beginPath(); c.arc(x + 11, y, 6, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    }
    // the islands: shallows, foam, the cliff side, the top, a beach band, the ink line
    for (const ring of G.land) {
      OWGeo.path(c, ring, true); c.strokeStyle = rgba(mix(L.sea, '#ffffff', 0.3), 0.5); c.lineWidth = 64; c.stroke();
      c.strokeStyle = rgba(mix(L.sea, '#ffffff', 0.45), 0.55); c.lineWidth = 34; c.stroke();
      c.save(); c.translate(0, 13); OWGeo.path(c, ring, true); c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 9; c.stroke();
      c.fillStyle = L.cliff; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
      // cliff strata
      c.save(); c.translate(0, 6.5); OWGeo.path(c, ring, true); c.strokeStyle = rgba(shade(L.cliff, -0.3), 0.6); c.lineWidth = 1.4; c.stroke(); c.restore();
      OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
      c.save(); OWGeo.path(c, ring, true); c.clip();
      c.strokeStyle = L.beach; c.lineWidth = 26; OWGeo.path(c, ring, true); c.stroke();
      c.restore();
      OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke();
    }
    // ground: light meadows and grass tufts, inside the land
    c.save(); c.beginPath(); for (const ring of G.land) { c.moveTo(ring[0][0], ring[0][1]); for (const p of ring) c.lineTo(p[0], p[1]); c.closePath(); } c.clip();
    const R2 = this.rng(G.cc + 'ground');
    for (let i = 0; i < 26; i++) { const x = R2() * G.w, y = R2() * G.h, r = 50 + R2() * 110; c.fillStyle = rgba(L.light, 0.35); c.beginPath(); c.ellipse(x, y, r, r * 0.55, 0, 0, TAU); c.fill(); }
    for (const f of M.feat || []) this.ground(c, ow, f);
    c.strokeStyle = rgba(shade(L.land, -0.25), 0.55); c.lineWidth = 1.4;
    for (let i = 0; i < Math.round(G.w * G.h / 2600); i++) { const x = R2() * G.w, y = R2() * G.h; if (!this.dry(G, x, y)) continue; c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x - 1.5, y - 4); c.moveTo(x, y); c.lineTo(x + 0.5, y - 5); c.moveTo(x + 3, y); c.lineTo(x + 2, y - 3.5); c.stroke(); }
    c.restore();
    // water inside the land: rivers, then lakes
    for (const f of M.feat || []) if (f[0] === 'river') this.river(c, ow, OWGeo.spline(TourOW.pairs(f[1]), false, 6), f[2] || 14);
    for (const f of M.feat || []) if (f[0] === 'lake') this.lake(c, ow, OWGeo.spline(TourOW.pairs(f[1]), true, 6));
    // the trails
    for (const e of ow.edges) { if (!e.visible) continue; const P = TourOW.curve(G, e); if (!P) continue; if (e.open && !e.fresh) this.trail(c, ow, P, e.gold, [0, P.len], true); else this.dots(c, ow, P); }
    // scenery sprites, back to front
    const sprites = this.sprites(ow);
    sprites.sort((a, b) => a.y - b.y);
    for (const s of sprites) { c.save(); c.translate(s.x, s.y); this.sprite(c, ow, s); c.restore(); }
    if (typeof TourOWScenes !== 'undefined') TourOWScenes.paint(c, ow);
  },
  // inside the land, away from water
  dry(G, x, y) { return G.land.some(r => OWGeo.inPoly(x, y, r)) && !G.lakes.some(r => OWGeo.inPoly(x, y, r)) && !G.rivers.some(R => OWGeo.distPoly(x, y, R.pts) < R.w / 2 + 4); },
  // ground features: biome patches, dunes, fields, snow
  ground(c, ow, f) {
    const L = ow.look, k = f[0];
    if (k === 'patch' || k === 'dunes' || k === 'snow' || k === 'fields' || k === 'paddies') {
      const pts = OWGeo.spline(TourOW.pairs(f[2] || f[1]), true, 6), col = k === 'snow' ? '#f4f8fb' : k === 'dunes' ? (f[1] || '#e8c27a') : f[1];
      OWGeo.path(c, pts, true); c.fillStyle = typeof col === 'string' ? col : L.light; c.fill(); c.strokeStyle = c.fillStyle; c.lineWidth = 12; c.stroke();
      c.save(); OWGeo.path(c, pts, true); c.clip();
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
      if (k === 'dunes') { c.strokeStyle = rgba(shade(col, -0.25), 0.7); c.lineWidth = 2; for (let y = y0 + 14; y < y1; y += 22) for (let x = x0 + ((y / 22) % 2) * 26; x < x1; x += 52) { c.beginPath(); c.moveTo(x, y + 6); c.quadraticCurveTo(x + 16, y - 6, x + 34, y + 4); c.stroke(); } }
      if (k === 'fields') {
        // rows of crops on the soil ('bands': solid stripes of colour, like tulip fields)
        const cols = f[3] || [shade(col, 0.15), shade(col, -0.12)], a = f[4] || 0.35, bands = f[5] === 'bands';
        c.save(); c.translate((x0 + x1) / 2, (y0 + y1) / 2); c.rotate(a); const d = Math.hypot(x1 - x0, y1 - y0);
        for (let i = -d, r = 0; i < d; i += 11, r++) {
          const cc = cols[r % cols.length];
          if (bands) { c.fillStyle = cc; c.fillRect(-d, i, d * 2, 7); continue; }
          c.fillStyle = rgba(shade(col, -0.25), 0.5); c.fillRect(-d, i + 5, d * 2, 1.5);
          c.fillStyle = cc; for (let x = -d + (r % 2) * 4; x < d; x += 8) { c.beginPath(); c.arc(x, i + 3, 2.3, 0, TAU); c.fill(); }
        }
        c.restore();
      }
      if (k === 'paddies') { c.strokeStyle = rgba('#ffffff', 0.45); c.lineWidth = 1.5; for (let y = y0 + 8; y < y1; y += 16) { c.beginPath(); c.moveTo(x0, y); for (let x = x0; x <= x1; x += 20) c.lineTo(x, y + Math.sin(x * 0.05) * 3); c.stroke(); } c.fillStyle = rgba('#9adfe8', 0.35); for (let y = y0 + 10; y < y1; y += 16) for (let x = x0 + 6; x < x1; x += 34) c.fillRect(x, y, 14, 3); }
      if (k === 'snow') { c.fillStyle = 'rgba(190,220,240,0.5)'; for (let y = y0; y < y1; y += 18) for (let x = x0 + ((y / 18) % 2) * 12; x < x1; x += 24) c.fillRect(x, y, 8, 1.5); }
      c.restore();
    }
  },
  river(c, ow, pts, w) {
    const L = ow.look;
    OWGeo.path(c, pts, false); c.strokeStyle = this.INK; c.lineWidth = w + 5; c.stroke();
    c.strokeStyle = L.beach; c.lineWidth = w + 2; c.stroke();
    c.strokeStyle = mix(L.sea, '#ffffff', 0.12); c.lineWidth = w - 1; c.stroke();
    c.strokeStyle = rgba('#ffffff', 0.35); c.lineWidth = 1.5; c.setLineDash([8, 14]); c.stroke(); c.setLineDash([]);
  },
  lake(c, ow, pts) {
    const L = ow.look;
    OWGeo.path(c, pts, true); c.fillStyle = L.beach; c.fill(); c.strokeStyle = this.INK; c.lineWidth = 2.4; c.stroke();
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    c.save(); c.translate(cx, cy); c.scale(0.9, 0.86); c.translate(-cx, -cy); OWGeo.path(c, pts, true); c.fillStyle = mix(L.sea, '#ffffff', 0.12); c.fill(); c.restore();
    c.save(); c.translate(cx, cy); c.scale(0.6, 0.5); c.translate(-cx, -cy); OWGeo.path(c, pts, true); c.fillStyle = rgba(L.deep, 0.35); c.fill(); c.restore();
  },
  // an open trail: an ink edge, the trail colour, little stepping marks; a bridge over water, gold when secret
  trail(c, ow, P, gold, span, cached) {
    const s0 = span[0], s1 = span[1]; if (s1 - s0 < 1) return;
    const pts = this.sub(P, s0, s1), L = ow.look, ink = this.INK;
    const col = gold ? '#ffd84a' : L.path;
    OWGeo.path(c, pts, false);
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = rgba('#1c1426', 0.18); c.lineWidth = 15; c.save(); c.translate(0, 2.5); c.stroke(); c.restore();
    c.strokeStyle = ink; c.lineWidth = 12.5; c.stroke();
    c.strokeStyle = col; c.lineWidth = 8.5; c.stroke();
    c.strokeStyle = rgba(gold ? '#fff8c0' : mix(col, '#ffffff', 0.55), 0.85); c.lineWidth = 2; c.setLineDash([3, 9]); c.stroke(); c.setLineDash([]);
    // bridges over water
    for (const [w0, w1] of P.water || []) {
      const a = Math.max(s0, w0 - 6), b = Math.min(s1, w1 + 6); if (b - a < 4) continue;
      const bp = this.sub(P, a, b);
      OWGeo.path(c, bp, false); c.lineCap = 'butt'; c.strokeStyle = ink; c.lineWidth = 15; c.stroke(); c.strokeStyle = '#b8814c'; c.lineWidth = 11; c.stroke();
      c.strokeStyle = rgba('#6a4426', 0.8); c.lineWidth = 11; c.setLineDash([1.6, 4.4]); c.stroke(); c.setLineDash([]);
      // rails
      for (const side of [-1, 1]) { c.beginPath(); bp.forEach((p, i) => { const q = bp[Math.min(bp.length - 1, i + 1)], r = bp[Math.max(0, i - 1)], dx = q[0] - r[0], dy = q[1] - r[1], d = Math.hypot(dx, dy) || 1, x = p[0] - dy / d * 7 * side, y = p[1] + dx / d * 7 * side; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.strokeStyle = ink; c.lineWidth = 3; c.stroke(); c.strokeStyle = '#e0b07a'; c.lineWidth = 1.4; c.stroke(); }
      c.lineCap = 'round';
    }
  },
  sub(P, s0, s1) { const out = []; const n = Math.max(2, Math.ceil((s1 - s0) / 4)); for (let i = 0; i <= n; i++) { const p = OWGeo.at(P, s0 + (s1 - s0) * i / n); out.push([p.x, p.y]); } return out; },
  // a closed trail: stepping stones
  dots(c, ow, P) {
    const L = ow.look;
    for (let s = 14; s < P.len - 12; s += 15) { const p = OWGeo.at(P, s); c.fillStyle = rgba('#1c1426', 0.25); c.beginPath(); c.ellipse(p.x, p.y + 1.5, 4, 2.6, 0, 0, TAU); c.fill(); c.fillStyle = mix(L.path, L.land, 0.25); c.strokeStyle = rgba(this.INK, 0.7); c.lineWidth = 1.3; c.beginPath(); c.ellipse(p.x, p.y, 3.6, 2.4, 0, 0, TAU); c.fill(); c.stroke(); }
  },

  /* ---------- scenery sprites: explicit features plus flora scattered over the free land ---------- */
  sprites(ow) {
    const G = ow.G, M = G.M, out = [], R = this.rng(G.cc + 'flora');
    const curves = TourOW.allCurves(ow.C).map(x => x.P.pts);
    const nodes = Object.keys(G.pos).map(k => G.pos[k]);
    const clear = (x, y, r, sea) => {
      if (sea ? this.dry(G, x, y) || G.land.some(q => OWGeo.distPoly(x, y, q) < r) : !this.dry(G, x, y)) return false;
      for (const p of nodes) { if (Math.hypot(p.x - x, p.y - y) < r + 34) return false; if (Math.abs(p.x - x) < 40 + r * 0.5 && y > p.y && y - p.y < 46 + r) return false; }
      for (const pts of curves) if (OWGeo.distPoly(x, y, pts) < r * 0.6 + 12) return false;
      for (const s of out) if (Math.hypot(s.x - x, s.y - y) < (s.r + r) * 0.62) return false;
      return true;
    };
    const fe = M.feat || [];
    for (const f of fe) {
      const k = f[0];
      if (k === 'mtn' || k === 'hill' || k === 'volcano' || k === 'karst' || k === 'mesa' || k === 'berg') { const s = f[3] || 40; if (clear(f[1], f[2], s * 0.8)) out.push({ k, x: f[1], y: f[2], r: s, o: f[4] || {} }); }
      else if (k === 'range') { for (const q of f[2]) { const s = q[2] || 40; if (clear(q[0], q[1], s * 0.7)) out.push({ k: f[1] || 'mtn', x: q[0], y: q[1], r: s, o: f[3] || {} }); } }
      else if (k === 'town') { const n = f[3] || 5; let n2 = n; const R3 = this.rng(G.cc + 'town' + f[1]); for (let i = 0; i < n * 3 && n > 0; i++) { const a = R3() * TAU, d = Math.sqrt(R3()) * (f[4] || 40), x = f[1] + Math.cos(a) * d, y = f[2] + Math.sin(a) * d * 0.7; if (clear(x, y, 9)) { out.push({ k: 'house', x, y, r: 10, o: { v: R3(), style: f[5] } }); if (--n2 <= 0) break; } } }
      else if (k === 'sprite') { if (clear(f[2], f[3], f[4] || 12, f[5] && f[5].sea)) out.push({ k: f[1], x: f[2], y: f[3], r: f[4] || 12, o: f[5] || {} }); }
      else if (k === 'landmark') out.push({ k: 'landmark', x: f[1], y: f[2], r: f[3] || 50, o: {} });
      else if (k === 'trees') { const [, kind, cx, cy, rad, n] = f, R3 = this.rng(G.cc + 'trees' + cx + ',' + cy); let made = 0; for (let i = 0; i < n * 6 && made < n; i++) { const a = R3() * TAU, d = Math.sqrt(R3()) * rad, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.75, s = 10 + R3() * 6; if (clear(x, y, s)) { out.push({ k: Array.isArray(kind) ? kind[i % kind.length] : kind, x, y, r: s, o: { v: R3() } }); made++; } } }
    }
    // flora over the rest of the land
    const flora = M.flora || ['round'], n = M.density != null ? M.density : Math.round(G.w * G.h / 16000);
    let made = 0;
    for (let i = 0; i < n * 8 && made < n; i++) {
      const x = R() * G.w, y = R() * G.h, s = 9 + R() * 6;
      if (!clear(x, y, s)) continue;
      out.push({ k: flora[Math.floor(R() * flora.length)], x, y, r: s, o: { v: R() } }); made++;
    }
    return out;
  },
  sprite(c, ow, s) {
    const fn = this.art[s.k]; if (!fn) return;
    c.fillStyle = 'rgba(28,20,38,0.22)'; c.beginPath(); c.ellipse(0, 1, s.r * (s.k === 'mtn' || s.k === 'volcano' ? 0.95 : 0.7), s.r * 0.22, 0, 0, TAU); c.fill();
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = this.INK; c.lineWidth = 1.8;
    fn.call(this, c, s.r, s.o, ow);
  },
  // flat shapes with an ink line
  P(c, pts, fill) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = fill; c.fill(); c.stroke(); },
  O(c, x, y, r, fill, ry) { c.beginPath(); c.ellipse(x, y, r, ry || r, 0, 0, TAU); c.fillStyle = fill; c.fill(); c.stroke(); },
  art: {
    mtn(c, r, o, ow) {
      const col = o.col || mix(ow.look.hills, '#7d7a8c', 0.35), h = r * 1.45;
      this.P(c, [[-r, 0], [-r * 0.25, -h], [r * 0.08, -h * 0.82], [r, 0]], col);
      c.lineWidth = 0; c.fillStyle = shade(col, -0.22); c.beginPath(); c.moveTo(-r * 0.25, -h); c.lineTo(r * 0.08, -h * 0.82); c.lineTo(r, 0); c.lineTo(r * 0.05, 0); c.lineTo(-r * 0.05, -h * 0.4); c.closePath(); c.fill();
      c.lineWidth = 1.8; c.beginPath(); c.moveTo(-r, 0); c.lineTo(-r * 0.25, -h); c.lineTo(r * 0.08, -h * 0.82); c.lineTo(r, 0); c.stroke();
      if (o.snow !== false) { this.P(c, [[-r * 0.25, -h], [r * 0.08, -h * 0.82], [r * 0.2, -h * 0.66], [r * 0.02, -h * 0.7], [-r * 0.14, -h * 0.6], [-r * 0.32, -h * 0.72], [-r * 0.45, -h * 0.66]], '#f6f7fb'); }
    },
    hill(c, r, o, ow) {
      const col = o.col || shade(ow.look.land, -0.08);
      c.beginPath(); c.moveTo(-r, 0); c.bezierCurveTo(-r * 0.8, -r * 0.9, r * 0.8, -r * 0.9, r, 0); c.closePath(); c.fillStyle = col; c.fill(); c.stroke();
      c.fillStyle = rgba('#ffffff', 0.25); c.beginPath(); c.ellipse(-r * 0.3, -r * 0.5, r * 0.3, r * 0.12, -0.3, 0, TAU); c.fill();
    },
    volcano(c, r, o, ow) {
      const h = r * 1.2, col = o.col || '#8a6a6a';
      this.P(c, [[-r, 0], [-r * 0.28, -h], [r * 0.28, -h], [r, 0]], col);
      c.fillStyle = shade(col, -0.25); c.beginPath(); c.moveTo(r * 0.05, -h); c.lineTo(r * 0.28, -h); c.lineTo(r, 0); c.lineTo(r * 0.15, 0); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-r, 0); c.lineTo(-r * 0.28, -h); c.lineTo(r * 0.28, -h); c.lineTo(r, 0); c.stroke();
      if (o.lava !== false) { c.fillStyle = '#ff7a2a'; c.beginPath(); c.moveTo(-r * 0.24, -h); c.lineTo(-r * 0.05, -h * 0.6); c.lineTo(r * 0.05, -h * 0.78); c.lineTo(r * 0.24, -h); c.closePath(); c.fill(); c.stroke(); }
      else this.P(c, [[-r * 0.28, -h], [r * 0.28, -h], [r * 0.42, -h * 0.78], [r * 0.1, -h * 0.84], [-r * 0.1, -h * 0.74], [-r * 0.44, -h * 0.8]], '#f6f7fb');
      this.O(c, 0, -h, r * 0.28, '#4a3a3a', r * 0.07);
    },
    karst(c, r, o, ow) {
      const col = o.col || '#7aa688', h = r * 2.1, w = r * 0.55;
      c.beginPath(); c.moveTo(-w, 0); c.bezierCurveTo(-w - 4, -h * 0.5, -w * 0.8, -h, 0, -h); c.bezierCurveTo(w * 0.8, -h, w + 4, -h * 0.5, w, 0); c.closePath(); c.fillStyle = col; c.fill(); c.stroke();
      c.fillStyle = shade(col, -0.2); c.beginPath(); c.moveTo(w * 0.2, -h * 0.95); c.bezierCurveTo(w * 0.9, -h * 0.9, w + 3, -h * 0.5, w, 0); c.lineTo(w * 0.3, 0); c.closePath(); c.fill();
      c.fillStyle = '#4f8f5f'; c.beginPath(); c.ellipse(0, -h + 3, w * 0.9, 5, 0, 0, TAU); c.fill(); c.stroke();
    },
    mesa(c, r, o, ow) { const col = o.col || '#c98a5a', h = r * 0.9; this.P(c, [[-r, 0], [-r * 0.7, -h], [r * 0.7, -h], [r, 0]], col); c.fillStyle = shade(col, -0.2); c.fillRect(-r * 0.62, -h * 0.55, r * 1.3, 3); c.fillStyle = shade(col, 0.15); c.beginPath(); c.ellipse(0, -h, r * 0.7, 3, 0, 0, TAU); c.fill(); c.stroke(); },
    berg(c, r, o) { this.P(c, [[-r, 0], [-r * 0.7, -r * 0.7], [-r * 0.2, -r * 1.1], [r * 0.3, -r * 0.8], [r * 0.8, -r * 0.9], [r, 0]], '#eef8fb'); c.fillStyle = 'rgba(120,180,210,0.45)'; c.beginPath(); c.moveTo(-r * 0.2, -r * 1.1); c.lineTo(r * 0.3, -r * 0.8); c.lineTo(r * 0.1, 0); c.lineTo(-r * 0.4, 0); c.closePath(); c.fill(); },
    round(c, r, o, ow) { const g = o.col || mix(shade(ow.look.land, -0.25), '#3f8a4a', 0.5); c.fillStyle = '#7a5434'; c.fillRect(-1.6, -r * 0.6, 3.2, r * 0.6); c.strokeRect(-1.6, -r * 0.6, 3.2, r * 0.6); this.O(c, 0, -r * 0.95, r * 0.62, g, r * 0.58); c.fillStyle = rgba('#ffffff', 0.22); c.beginPath(); c.arc(-r * 0.2, -r * 1.12, r * 0.22, 0, TAU); c.fill(); },
    bush(c, r, o, ow) { const g = mix(shade(ow.look.land, -0.2), '#4a8a4a', 0.4); this.O(c, -r * 0.3, -r * 0.3, r * 0.36, g); this.O(c, r * 0.25, -r * 0.32, r * 0.4, g); },
    pine(c, r, o) { const g = o.col || '#2f6a4a'; c.fillStyle = '#6a4630'; c.fillRect(-1.5, -r * 0.4, 3, r * 0.4); for (let i = 0; i < 3; i++) { const y = -r * (0.35 + i * 0.4), w = r * (0.62 - i * 0.14); this.P(c, [[-w, y], [0, y - r * 0.62], [w, y]], i % 2 ? shade(g, 0.1) : g); } if (o.snow) { c.fillStyle = '#f6f8fb'; c.beginPath(); c.moveTo(-r * 0.2, -r * 1.35); c.lineTo(0, -r * 1.55); c.lineTo(r * 0.2, -r * 1.35); c.closePath(); c.fill(); } },
    palm(c, r, o) { c.strokeStyle = '#8b6a45'; c.lineWidth = 3.4; const lean = (o.v || 0.5) > 0.5 ? 1 : -1; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(lean * r * 0.4, -r * 0.7, lean * r * 0.15, -r * 1.35); c.stroke(); c.strokeStyle = TourOWPaint.INK; c.lineWidth = 1.2; c.stroke(); const tx = lean * r * 0.15, ty = -r * 1.35; c.lineWidth = 1.6; for (let i = 0; i < 5; i++) { const a = -Math.PI + 0.25 + i * 0.66; c.fillStyle = i % 2 ? '#3c9a5a' : '#2f8650'; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * r * 0.6, ty + Math.sin(a) * r * 0.5 - 4, tx + Math.cos(a) * r * 0.9, ty + Math.sin(a) * r * 0.3 + 6); c.quadraticCurveTo(tx + Math.cos(a) * r * 0.45, ty + Math.sin(a) * r * 0.2, tx, ty); c.fill(); c.stroke(); } this.O(c, tx, ty + 2, 2.4, '#7a5a30'); },
    cactus(c, r, o) { const g = '#4f9a62'; c.fillStyle = g; const arm = (x0, d, h) => { c.beginPath(); c.moveTo(x0, -r * 0.45); c.lineTo(x0 + d * r * 0.32, -r * 0.45); c.lineTo(x0 + d * r * 0.32, -r * h); c.stroke(); }; c.lineWidth = 5.5; c.strokeStyle = TourOWPaint.INK; arm(0, -1, 0.85); arm(0, 1, 1.0); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r * 1.3); c.stroke(); c.lineWidth = 3.2; c.strokeStyle = g; arm(0, -1, 0.85); arm(0, 1, 1.0); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r * 1.3); c.stroke(); c.strokeStyle = rgba('#ffffff', 0.35); c.lineWidth = 0.8; c.beginPath(); c.moveTo(-0.6, -2); c.lineTo(-0.6, -r * 1.25); c.stroke(); if ((o.v || 0) > 0.6) { c.fillStyle = '#ff6f91'; c.strokeStyle = TourOWPaint.INK; c.lineWidth = 1; c.beginPath(); c.arc(0, -r * 1.36, 2.2, 0, TAU); c.fill(); c.stroke(); } },
    agave(c, r) { c.fillStyle = '#6aa08a'; for (let i = 0; i < 7; i++) { const a = -Math.PI + 0.25 + i * 0.44; c.beginPath(); c.moveTo(-2, 0); c.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.9 - 1); c.lineTo(2, 0); c.closePath(); c.fill(); c.stroke(); } },
    baobab(c, r) { c.fillStyle = '#9a7a62'; c.beginPath(); c.moveTo(-r * 0.32, 0); c.quadraticCurveTo(-r * 0.4, -r * 0.6, -r * 0.18, -r * 1.05); c.lineTo(r * 0.18, -r * 1.05); c.quadraticCurveTo(r * 0.4, -r * 0.6, r * 0.32, 0); c.closePath(); c.fill(); c.stroke(); c.lineWidth = 2.2; for (const d of [-1, 0, 1]) { c.beginPath(); c.moveTo(d * r * 0.1, -r * 1.02); c.lineTo(d * r * 0.42, -r * 1.3); c.stroke(); } c.lineWidth = 1.6; for (const [x, y] of [[-r * 0.45, -r * 1.32], [0, -r * 1.42], [r * 0.45, -r * 1.32]]) this.O(c, x, y, r * 0.24, '#4f8a4a', r * 0.14); },
    acacia(c, r) { c.strokeStyle = '#6a4a30'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r * 0.8); c.lineTo(-r * 0.3, -r * 1.05); c.moveTo(0, -r * 0.8); c.lineTo(r * 0.35, -r * 1.05); c.stroke(); c.strokeStyle = TourOWPaint.INK; c.lineWidth = 1.6; this.O(c, 0, -r * 1.1, r * 0.85, '#6a9a4a', r * 0.2); },
    cypress(c, r, o) { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-r * 0.4, -r * 0.4, -r * 0.3, -r * 1.4, 0, -r * 1.9); c.bezierCurveTo(r * 0.3, -r * 1.4, r * 0.4, -r * 0.4, 0, 0); c.fillStyle = o.col || '#2f5a3a'; c.fill(); c.stroke(); },
    olive(c, r) { c.fillStyle = '#7a5a40'; c.fillRect(-1.5, -r * 0.55, 3, r * 0.55); this.O(c, 0, -r * 0.85, r * 0.6, '#8aa07a', r * 0.42); c.fillStyle = '#a8bc96'; c.beginPath(); c.arc(-r * 0.2, -r * 0.98, r * 0.18, 0, TAU); c.fill(); },
    orange(c, r) { c.fillStyle = '#7a5434'; c.fillRect(-1.5, -r * 0.5, 3, r * 0.5); this.O(c, 0, -r * 0.9, r * 0.6, '#4c9a58', r * 0.55); c.lineWidth = 0.8; for (const [x, y] of [[-r * 0.25, -r * 0.95], [r * 0.2, -r * 0.75], [r * 0.05, -r * 1.2], [-r * 0.3, -r * 0.65]]) this.O(c, x, y, 1.9, '#ff9a2e'); },
    cherry(c, r) { c.fillStyle = '#6a4434'; c.fillRect(-1.5, -r * 0.55, 3, r * 0.55); this.O(c, 0, -r * 0.92, r * 0.62, '#ffb7c9', r * 0.5); c.fillStyle = '#ffd9e3'; c.beginPath(); c.arc(-r * 0.22, -r * 1.05, r * 0.2, 0, TAU); c.fill(); },
    bonsai(c, r) { c.strokeStyle = '#5a3a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-r * 0.3, -r * 0.5, r * 0.1, -r * 0.9); c.stroke(); c.strokeStyle = TourOWPaint.INK; c.lineWidth = 1.6; for (const [x, y, w] of [[-r * 0.4, -r * 0.7, 0.45], [r * 0.3, -r * 0.95, 0.5], [0, -r * 1.25, 0.4]]) this.O(c, x, y, r * w, '#2f6a4a', r * 0.14); },
    bamboo(c, r) { for (const dx of [-r * 0.3, 0, r * 0.28]) { c.fillStyle = '#7bbf6a'; c.fillRect(dx - 1.6, -r * 1.6, 3.2, r * 1.6); c.strokeRect(dx - 1.6, -r * 1.6, 3.2, r * 1.6); for (let y = -r * 0.4; y > -r * 1.5; y -= r * 0.4) { c.beginPath(); c.moveTo(dx - 1.6, y); c.lineTo(dx + 1.6, y); c.stroke(); } } c.fillStyle = '#5c9c55'; for (const [x, y, a] of [[-r * 0.3, -r * 1.5, -0.6], [r * 0.28, -r * 1.4, 0.6], [0, -r * 1.65, -0.3]]) { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.ellipse(0, 0, r * 0.32, 2.4, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); } },
    willow(c, r) { c.fillStyle = '#6a4a30'; c.fillRect(-1.6, -r * 0.7, 3.2, r * 0.7); c.beginPath(); c.moveTo(-r * 0.7, -r * 0.2); c.quadraticCurveTo(-r * 0.8, -r * 1.3, 0, -r * 1.3); c.quadraticCurveTo(r * 0.8, -r * 1.3, r * 0.7, -r * 0.2); c.quadraticCurveTo(0, -r * 0.6, -r * 0.7, -r * 0.2); c.fillStyle = '#7aaa5a'; c.fill(); c.stroke(); },
    poplar(c, r) { c.beginPath(); c.ellipse(0, -r * 1.05, r * 0.32, r * 0.9, 0, 0, TAU); c.fillStyle = '#5a8a4a'; c.fill(); c.stroke(); c.fillStyle = '#6a4a30'; c.fillRect(-1.2, -r * 0.18, 2.4, r * 0.18); },
    rock(c, r) { this.P(c, [[-r * 0.6, 0], [-r * 0.45, -r * 0.4], [-r * 0.05, -r * 0.55], [r * 0.4, -r * 0.35], [r * 0.6, 0]], '#9a9aa8'); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(-r * 0.3, -r * 0.4, r * 0.25, 2); },
    tulips(c, r, o) { const cols = ['#ff4a5a', '#ffd23a', '#ff8ad0', '#ffffff', '#ff7a1a']; c.lineWidth = 1; for (let i = 0; i < 6; i++) { const x = (i % 3 - 1) * r * 0.45, y = -Math.floor(i / 3) * r * 0.35; c.strokeStyle = '#3a7a3a'; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 5); c.stroke(); c.strokeStyle = TourOWPaint.INK; this.O(c, x, y - 6, 2.4, cols[(i + Math.floor((o.v || 0) * 5)) % cols.length]); } },
    lavender(c, r) { c.lineWidth = 1; for (let i = -2; i <= 2; i++) { c.strokeStyle = '#5a7a4a'; c.beginPath(); c.moveTo(i * 2.5, 0); c.lineTo(i * 3.5, -r * 0.8); c.stroke(); c.fillStyle = '#9a6ad8'; c.beginPath(); c.ellipse(i * 3.6, -r * 0.9, 1.6, 3.4, 0, 0, TAU); c.fill(); } },
    snowpine(c, r, o) { TourOWPaint.art.pine.call(this, c, r, { col: '#2f5a4a', snow: true }); },
    penguin(c, r) { this.O(c, 0, -r * 0.55, r * 0.35, '#26283a', r * 0.55); c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(0, -r * 0.48, r * 0.22, r * 0.4, 0, 0, TAU); c.fill(); c.fillStyle = '#ffb83a'; c.beginPath(); c.moveTo(-2, -r * 0.9); c.lineTo(3, -r * 0.86); c.lineTo(-1, -r * 0.8); c.fill(); },
    crystal(c, r) { this.P(c, [[-r * 0.3, 0], [-r * 0.4, -r * 0.8], [0, -r * 1.4], [r * 0.4, -r * 0.8], [r * 0.3, 0]], '#c8a8ff'); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(0, -r * 1.4); c.lineTo(r * 0.12, -r * 0.6); c.lineTo(-r * 0.1, -r * 0.5); c.closePath(); c.fill(); },
    clock(c, r) { c.fillStyle = '#8a6ad8'; c.fillRect(-1.5, -r * 0.8, 3, r * 0.8); c.strokeRect(-1.5, -r * 0.8, 3, r * 0.8); this.O(c, 0, -r * 1.1, r * 0.45, '#fff4d8'); c.beginPath(); c.moveTo(0, -r * 1.1); c.lineTo(0, -r * 1.35); c.moveTo(0, -r * 1.1); c.lineTo(r * 0.2, -r * 1.05); c.stroke(); },
    house(c, r, o, ow) {
      const L = ow.look, v = o.v || 0, w = 8 + Math.floor(v * 3) * 2, h = 7 + (v * 10 % 3), wall = o.style === 'blue' ? '#7ab4e8' : L.wall, roof = o.style === 'flat' ? null : (v > 0.5 ? L.roof : shade(L.roof, -0.15));
      c.fillStyle = shade(wall, -0.18); c.fillRect(w / 2 - 3, -h, 3, h);
      this.P(c, [[-w / 2, 0], [-w / 2, -h], [w / 2, -h], [w / 2, 0]], wall);
      if (roof) this.P(c, [[-w / 2 - 2, -h], [0, -h - 6], [w / 2 + 2, -h]], roof); else { c.fillStyle = shade(wall, -0.1); c.fillRect(-w / 2 - 1, -h - 2, w + 2, 2); c.strokeRect(-w / 2 - 1, -h - 2, w + 2, 2); }
      c.fillStyle = '#3a2a3a'; c.fillRect(-1.5, -4.5, 3, 4.5);
    },
    // a hat-shaped butte: wide brim, round crown, a red band
    sombrero(c, r) {
      c.fillStyle = '#c99a5a'; c.beginPath(); c.ellipse(0, -r * 0.18, r, r * 0.3, 0, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-r * 0.42, -r * 0.22); c.bezierCurveTo(-r * 0.42, -r * 1.05, r * 0.42, -r * 1.05, r * 0.42, -r * 0.22); c.closePath(); c.fillStyle = '#d8aa66'; c.fill(); c.stroke();
      c.fillStyle = '#e8423a'; c.beginPath(); c.moveTo(-r * 0.43, -r * 0.3); c.lineTo(r * 0.43, -r * 0.3); c.lineTo(r * 0.41, -r * 0.42); c.lineTo(-r * 0.41, -r * 0.42); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.ellipse(-r * 0.15, -r * 0.7, r * 0.1, r * 0.2, -0.3, 0, TAU); c.fill();
    },
    windmill(c, r, o, ow) {
      this.P(c, [[-r * 0.32, 0], [-r * 0.24, -r * 1.1], [r * 0.24, -r * 1.1], [r * 0.32, 0]], o.col || '#f3e6cc');
      this.P(c, [[-r * 0.32, -r * 1.1], [0, -r * 1.45], [r * 0.32, -r * 1.1]], '#a8503a');
      c.fillStyle = '#3a2a3a'; c.fillRect(-2, -r * 0.35, 4, r * 0.35);
      c.save(); c.translate(0, -r * 1.12); c.rotate(0.35 + (o.v || 0)); c.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.fillStyle = '#fff8ea'; c.beginPath(); c.rect(1, -2.5, r * 0.95, 5); c.fill(); c.stroke(); }
      c.fillStyle = '#5a4a3a'; c.beginPath(); c.arc(0, 0, 2.2, 0, TAU); c.fill(); c.restore();
    },
    landmark(c, r, o, ow) { TourLandscape.landmark(c, ow.look.landmark, 0, 0, r, TourOWPaint.INK, ow.look.path); }
  },

  /* ---------- per-frame layers ---------- */
  live(ctx, ow, vr) {
    const G = ow.G, t = ow.t;
    // foam laps at the cliffs
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.setLineDash([10, 16]); ctx.lineDashOffset = -t * 9;
    for (const ring of G.land) { ctx.save(); ctx.translate(0, 13 + Math.sin(t * 1.3) * 1.5); OWGeo.path(ctx, ring, true); ctx.stroke(); ctx.restore(); }
    ctx.setLineDash([]); ctx.restore();
    // sea glints
    const R = this.rng(G.cc + 'glint');
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 40; i++) {
      const x = R() * G.w, y = R() * G.h, ph = R() * TAU; if (x < vr.x0 - 20 || x > vr.x1 + 20 || y < vr.y0 - 20 || y > vr.y1 + 20) continue;
      const a = Math.max(0, Math.sin(t * 1.6 + ph)); if (a < 0.05 || G.land.some(r => OWGeo.inPoly(x, y + 18, r))) continue;
      ctx.globalAlpha = a * 0.8; ctx.beginPath(); ctx.moveTo(x - 5 * a, y); ctx.lineTo(x + 5 * a, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (typeof TourOWScenes !== 'undefined') TourOWScenes.live(ctx, ow, vr);
  },
  over(ctx, ow, vr) {
    const G = ow.G, t = ow.t;
    // birds
    ctx.strokeStyle = 'rgba(30,24,44,0.75)'; ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      const x = ((t * (22 + i * 6) + i * 520) % (G.w + 200)) - 100, y = 120 + i * 210 + Math.sin(t * 0.7 + i) * 30, f = Math.sin(t * 9 + i * 2) * 3;
      if (x < vr.x0 - 20 || x > vr.x1 + 20 || y < vr.y0 - 20 || y > vr.y1 + 20) continue;
      for (const [dx, dy] of [[0, 0], [12, 6], [-10, 7]]) { ctx.beginPath(); ctx.moveTo(x + dx - 6, y + dy - f); ctx.quadraticCurveTo(x + dx - 3, y + dy - 3, x + dx, y + dy); ctx.quadraticCurveTo(x + dx + 3, y + dy - 3, x + dx + 6, y + dy - f); ctx.stroke(); }
    }
    // cloud shadows drift over everything
    ctx.fillStyle = 'rgba(20,30,60,0.075)';
    for (let i = 0; i < 4; i++) {
      const x = ((t * 9 + i * 470) % (G.w + 600)) - 300, y = (i * 263) % G.h;
      if (x + 260 < vr.x0 || x - 260 > vr.x1 || y + 160 < vr.y0 || y - 160 > vr.y1) continue;
      for (const [dx, dy, r] of [[0, 0, 110], [90, 20, 80], [-90, 25, 70], [30, -40, 70]]) { ctx.beginPath(); ctx.ellipse(x + dx, y + dy, r, r * 0.55, 0, 0, TAU); ctx.fill(); }
    }
    if (typeof TourOWScenes !== 'undefined' && TourOWScenes.over) TourOWScenes.over(ctx, ow, vr);
  },

  /* ---------- stops ---------- */
  node(c, ow, n, here) {
    const t = ow.t, C = ow.C, cols = C.colors, ink = this.INK;
    c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = ink; c.lineWidth = 2;
    const shadow = (rx) => { c.fillStyle = 'rgba(20,14,30,0.3)'; c.beginPath(); c.ellipse(0, 7, rx, rx * 0.32, 0, 0, TAU); c.fill(); };
    if (n.kind === 'level' && n.boss) return this.fort(c, ow, n, here);
    if (n.kind === 'level') {
      const done = n.done, open = n.enter;
      const top = done ? '#ffd23a' : open ? (n.secret ? '#ffe9a0' : cols.a) : '#a3a7b4', side = shade(top, -0.35);
      shadow(19);
      // a pulse around the next stop to play
      if (open && !done && !here) { const k = (t * 1.2) % 1; c.strokeStyle = rgba('#fff8d8', 0.8 * (1 - k)); c.lineWidth = 2.5; c.beginPath(); c.ellipse(0, 0, 17 + k * 12, (17 + k * 12) * 0.55, 0, 0, TAU); c.stroke(); c.strokeStyle = ink; c.lineWidth = 2; }
      c.fillStyle = side; c.beginPath(); c.ellipse(0, 4.5, 16, 8.8, 0, 0, Math.PI); c.lineTo(-16, 0); c.ellipse(0, 0, 16, 8.8, 0, Math.PI, 0, true); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = top; c.beginPath(); c.ellipse(0, 0, 16, 8.8, 0, 0, TAU); c.fill(); c.stroke();
      c.strokeStyle = rgba('#ffffff', done ? 0.75 : 0.55); c.lineWidth = 1.4; c.beginPath(); c.ellipse(0, 0, 11.5, 6, 0, 0, TAU); c.stroke();
      if (n.secret) { c.strokeStyle = '#ffd84a'; c.lineWidth = 2.6; c.beginPath(); c.ellipse(0, 1.5, 20, 11, 0, 0, TAU); c.stroke(); c.strokeStyle = ink; c.lineWidth = 1; c.stroke(); }
      if (n.fort) { // a mini-fort: a little tower on the stop
        c.strokeStyle = ink; c.lineWidth = 1.8; c.fillStyle = open ? '#e8d6b8' : '#b8b8c4'; c.fillRect(-6, -18, 12, 16); c.strokeRect(-6, -18, 12, 16);
        for (const dx of [-6, -1, 4]) { c.fillRect(dx, -22, 3, 4); c.strokeRect(dx, -22, 3, 4); }
        c.fillStyle = ink; c.beginPath(); c.arc(0, -6, 2.6, Math.PI, 0); c.lineTo(2.6, -2); c.lineTo(-2.6, -2); c.fill();
      } else {
        c.fillStyle = done ? '#5a3a10' : open ? '#fff8e8' : '#5a5e6a'; c.font = `10px ${FONT_DISPLAY}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        if (!open) TourLandscape.lock(c, 0, -2.5, 11, '#4a4e5a'); else c.fillText(String(n.k + 1), 0, 0.8);
      }
      if (n.secret && !n.fort) { c.fillStyle = '#ffd84a'; c.strokeStyle = ink; c.lineWidth = 1.2; c.beginPath(); TourKit.star(c, 15, -8, 5.5, 2.4, 5); c.fill(); c.stroke(); }
      if (done) this.flag(c, 13, -2, cols.a, t, ink);
      if (open) this.postcards(c, n, ow, done ? -6 : 0);
      if (done) this.pips(c, n);
      const T = TourProgress.data();
      if (T.lighthouse && done) { const E = TourProgress.exitsFound(n.id); if (E.found < E.total) TourPanelFx.flag(c, -20, -10, t); }
      return;
    }
    if (n.kind === 'house') {
      shadow(18);
      c.fillStyle = mix(ow.look.beach, '#ffffff', 0.2); c.beginPath(); c.ellipse(0, 2, 18, 8, 0, 0, TAU); c.fill(); c.stroke();
      TourPanelFx.house(c, 0, -8, 13, cols.a, t);
      return;
    }
    if (n.kind === 'start' || n.kind === 'port') {
      const port = n.kind === 'port', open = n.enter;
      shadow(28);
      // the strip
      c.save(); c.rotate(-0.12);
      c.fillStyle = '#6a6a78'; rr(c, -30, -7, 60, 14, 6); c.fill(); c.stroke();
      c.strokeStyle = '#fff4d0'; c.lineWidth = 2; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(-24, 0); c.lineTo(24, 0); c.stroke(); c.setLineDash([]);
      c.restore();
      c.strokeStyle = ink; c.lineWidth = 1.8;
      if (port) { // a little tower
        c.fillStyle = open ? '#fff4e0' : '#c8c8d0'; c.fillRect(20, -26, 9, 22); c.strokeRect(20, -26, 9, 22);
        c.fillStyle = open ? '#7ad8ff' : '#8a8aa0'; c.fillRect(18, -32, 13, 7); c.strokeRect(18, -32, 13, 7);
        c.fillStyle = cols.a; c.beginPath(); c.moveTo(18, -32); c.lineTo(24.5, -37); c.lineTo(31, -32); c.closePath(); c.fill(); c.stroke();
      } else { // the windsock
        c.beginPath(); c.moveTo(-26, -2); c.lineTo(-26, -26); c.stroke();
        const f = Math.sin(t * 5) * 2; c.fillStyle = '#ff7a3a'; c.beginPath(); c.moveTo(-26, -26); c.lineTo(-12, -24 + f); c.lineTo(-12, -19 + f); c.lineTo(-26, -20); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#fff'; c.fillRect(-21, -24.5 + f * 0.5, 3, 4.5);
      }
      // the parked plane (on the airstrip while Brady walks the land; on the port once it opens)
      if (!port || open) { c.save(); c.translate(port ? -8 : 6, -6); c.scale(0.62, 0.62); ow.scene.drawPlane(c, 0, 16, 0); c.restore(); }
      return;
    }
    if (n.kind === 'bottle') {
      shadow(14);
      c.fillStyle = ow.look.beach; c.beginPath(); c.ellipse(0, 2, 15, 7, 0, 0, TAU); c.fill(); c.stroke();
      c.save(); c.translate(0, -2); c.rotate(0.5 + Math.sin(t * 2) * 0.08);
      c.fillStyle = 'rgba(120,220,200,0.95)'; rr(c, -5, -14, 10, 16, 4); c.fill(); c.stroke(); c.fillStyle = '#a0703a'; c.fillRect(-2.5, -19, 5, 5); c.strokeRect(-2.5, -19, 5, 5);
      c.fillStyle = '#fff4d0'; c.fillRect(-3, -10, 6, 8); c.restore();
    }
  },
  flag(c, x, y, col, t, ink) {
    c.strokeStyle = ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 24); c.stroke();
    const f = Math.sin(t * 6 + x) * 1.6;
    c.fillStyle = col; c.beginPath(); c.moveTo(x, y - 24); c.quadraticCurveTo(x + 6, y - 25 + f, x + 12, y - 22 + f); c.lineTo(x + 12, y - 15 + f); c.quadraticCurveTo(x + 6, y - 18 + f, x, y - 16); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ffd84a'; c.beginPath(); TourKit.star(c, x + 6, y - 19.5 + f * 0.6, 2.6, 1.1, 5); c.fill();
  },
  // three little postcard stamps over a stop (filled when found)
  postcards(c, n, ow, dx) {
    const g = Save.data.gold[n.id] || [], cols = ow.C.colors;
    for (let q = 0; q < 3; q++) {
      const x = dx + (q - 1) * 9 - 3.5, y = -21;
      c.fillStyle = g[q] ? '#fff4d8' : 'rgba(255,255,255,0.28)'; c.strokeStyle = g[q] ? this.INK : 'rgba(28,20,38,0.45)'; c.lineWidth = 1.1;
      c.beginPath(); c.rect(x, y, 7, 5.5); c.fill(); c.stroke();
      if (g[q]) { c.fillStyle = cols.a; c.fillRect(x + 4.2, y + 1, 2, 2); }
    }
  },
  pips(c, n) {
    const E = TourProgress.exitsFound(n.id); if (E.total < 2) return;
    for (let q = 0; q < E.total; q++) { c.fillStyle = q < E.found ? '#7ae0ff' : 'rgba(28,20,38,0.35)'; c.strokeStyle = this.INK; c.lineWidth = 0.9; c.beginPath(); c.arc((q - (E.total - 1) / 2) * 7, 13.5, 2.3, 0, TAU); c.fill(); c.stroke(); }
  },
  // the boss fort: walls, towers, a gate, the land's roof motif and a flag (the Baron's until the boss falls)
  fort(c, ow, n, here) {
    const C = ow.C, t = ow.t, ink = this.INK, done = n.done, open = n.enter;
    const wall = open ? (done ? '#f3e2c0' : '#e2cfae') : '#b8b4c0', dark = shade(wall, -0.25);
    c.fillStyle = 'rgba(20,14,30,0.32)'; c.beginPath(); c.ellipse(0, 8, 32, 9, 0, 0, TAU); c.fill();
    c.strokeStyle = ink; c.lineWidth = 2;
    // base mound
    c.fillStyle = mix(ow.look.cliff, ow.look.land, 0.4); c.beginPath(); c.ellipse(0, 4, 30, 9, 0, 0, TAU); c.fill(); c.stroke();
    // towers and wall
    for (const s of [-1, 1]) { c.fillStyle = s > 0 ? dark : wall; c.fillRect(s * 19 - 6, -34, 12, 36); c.strokeRect(s * 19 - 6, -34, 12, 36); for (const dx of [-6, -1, 4]) { c.fillRect(s * 19 + dx, -38, 3, 4); c.strokeRect(s * 19 + dx, -38, 3, 4); } }
    c.fillStyle = wall; c.fillRect(-14, -24, 28, 26); c.strokeRect(-14, -24, 28, 26);
    for (const dx of [-14, -7, 0, 7]) { c.fillRect(dx + 1, -28, 5, 4); c.strokeRect(dx + 1, -28, 5, 4); }
    c.fillStyle = rgba(dark, 0.6); c.fillRect(5, -22, 8, 23);
    // the gate
    c.fillStyle = ink; c.beginPath(); c.moveTo(-6, 2); c.lineTo(-6, -8); c.arc(0, -8, 6, Math.PI, 0); c.lineTo(6, 2); c.closePath(); c.fill();
    if (!open) TourLandscape.lock(c, 0, -7, 11, '#d8d4e0');
    if (C.map && C.map.fort) TourLandscape.fortRoof(c, C.map.fort, 0, -20, 14, ink);
    // windows
    c.fillStyle = done ? '#ffd84a' : '#3a2a3a'; for (const s of [-1, 1]) { c.fillRect(s * 19 - 2, -26, 4, 6); }
    // flag on the right tower
    const fx = 19, fy = -38, f = Math.sin(t * 5) * 2;
    c.strokeStyle = ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx, fy - 18); c.stroke();
    c.fillStyle = done ? C.colors.a : '#6a4a8a'; c.beginPath(); c.moveTo(fx, fy - 18); c.lineTo(fx + 14, fy - 15 + f); c.lineTo(fx, fy - 10); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = done ? '#ffd84a' : '#e8d8ff'; c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    if (done) { c.beginPath(); TourKit.star(c, fx + 5, fy - 14.5 + f * 0.5, 2.6, 1.1, 5); c.fill(); } else c.fillText('B', fx + 5, fy - 14 + f * 0.5);
    if (open) this.postcards(c, n, ow, -28);
    if (done) this.pips(c, Object.assign({}, n));
  },
  // the Baron's roadblock: striped posts and a plank with his B
  roadblock(c, ow, x, y, ang, port) {
    const ink = this.INK, t = ow.t;
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(20,14,30,0.3)'; c.beginPath(); c.ellipse(0, 4, 17, 4.5, 0, 0, TAU); c.fill();
    c.strokeStyle = ink; c.lineWidth = 1.8; c.lineJoin = 'round';
    for (const s of [-1, 1]) { c.fillStyle = '#8a5a3a'; c.fillRect(s * 12 - 2, -16, 4, 19); c.strokeRect(s * 12 - 2, -16, 4, 19); }
    c.save(); c.rotate(Math.sin(t * 2) * 0.02);
    c.fillStyle = '#ffd23a'; c.fillRect(-16, -13, 32, 7); c.strokeRect(-16, -13, 32, 7);
    c.fillStyle = '#6a4a8a'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-14 + i * 8, -13); c.lineTo(-10 + i * 8, -13); c.lineTo(-14 + i * 8 + 1, -6); c.lineTo(-18 + i * 8 + 1, -6); c.closePath(); c.fill(); }
    c.strokeRect(-16, -13, 32, 7);
    c.restore();
    // the Baron's sign
    c.fillStyle = '#6a4a8a'; c.beginPath(); c.arc(0, -19, 6, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#ffe8a8'; c.font = `7px ${FONT_DISPLAY}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(port ? '✈' : 'B', 0, -18.5);
    c.restore();
  }
};
