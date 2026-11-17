/* ============================================================
   World tour: what makes each land's overworld its own place.
   The painters a layout picks by name (TOUR_OW_MAPS[cc]):
     sea:    'clouds' | 'stars' | 'pack' | 'reef'          the water around the land
     coast:  'float' | 'ice' | 'dike' | 'rock'               the land's edge
     tufts:  'sand' | 'snow' | 'flowers' | 'none'            the little marks over the ground
     trail:  'planks' | 'stones' | 'rail' | 'prints' | 'bricks' | 'sand' | 'cobble' | 'sparkle'
     bridge: 'stone' | 'rope' | 'ice' | 'steps'
   ground features (in feat, painted once under the trails): terraces, contours, blocks, polders, cracks, checker,
   rail, wall, plaza, swirl; extra scenery sprites (TourOWPaint.art) and land-wide moving bits
   (TourOWScenes.liveKinds: mill, balloon, kite, train, walk, circle, flakes, fish, bob, lanterns, blink, glider,
   clock, plane, seal). Everything here is generic: a bonus land's layout can use any of it.
   The static parts are painted once into the overworld's map canvas; the moving bits are a few small shapes drawn
   each frame, skipped when out of view, with nothing allocated per frame beyond paths.
   ============================================================ */
const TourOWLands = {
  INK: '#1c1426',
  bbox(pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[0] > x1) x1 = p[0]; if (p[1] > y1) y1 = p[1]; } return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }; },
  centroid(pts) { let x = 0, y = 0; for (const p of pts) { x += p[0]; y += p[1]; } return [x / pts.length, y / pts.length]; },
  ring(f) { return OWGeo.spline(TourOW.pairs(f), true, 6); },
  // is (x, y) at least d from every land ring (open sea)?
  offshore(G, x, y, d) { if (G.land.some(r => OWGeo.inPoly(x, y, r))) return false; return !d || G.land.every(r => OWGeo.distPoly(x, y, r) > d); },

  /* ---------- seas ---------- */
  sea: {
    // a sea of clouds far below (the highlands): soft puffs, lighter on top
    clouds(c, ow) {
      const G = ow.G, R = this.rng(G.cc + 'clouds'), L = ow.look;
      for (let i = 0; i < Math.round(G.w * G.h / 14000); i++) {
        const x = R() * G.w, y = R() * G.h, s = 14 + R() * 22; if (!TourOWLands.offshore(G, x, y, s * 1.2)) continue;
        c.fillStyle = rgba(shade(L.sea, -0.12), 0.55); for (const [dx, dy, r] of [[-s, 3, 0.7], [0, 0, 1], [s * 0.9, 4, 0.65]]) { c.beginPath(); c.arc(x + dx, y + dy + 5, s * r, 0, TAU); c.fill(); }
        c.fillStyle = rgba('#ffffff', 0.85); for (const [dx, dy, r] of [[-s, 3, 0.7], [0, 0, 1], [s * 0.9, 4, 0.65]]) { c.beginPath(); c.arc(x + dx, y + dy, s * r, 0, TAU); c.fill(); }
      }
    },
    // the void between the islands: stars, faint nebulae, tiny drifting rocks
    stars(c, ow) {
      const G = ow.G, R = this.rng(G.cc + 'stars');
      for (let i = 0; i < 7; i++) { const x = R() * G.w, y = R() * G.h, r = 120 + R() * 200; c.fillStyle = rgba(['#a07ae0', '#e07ac8', '#7ab0e0'][i % 3], 0.1); c.beginPath(); c.ellipse(x, y, r, r * 0.45, R() * 3, 0, TAU); c.fill(); }
      for (let i = 0; i < Math.round(G.w * G.h / 2600); i++) { const x = R() * G.w, y = R() * G.h; if (!TourOWLands.offshore(G, x, y, 6)) continue; const s = R(); c.fillStyle = rgba('#fff6d8', 0.35 + s * 0.6); if (s > 0.85) { c.beginPath(); TourKit.star(c, x, y, 3.2, 1, 4); c.fill(); } else c.fillRect(x, y, 1.6, 1.6); }
      c.strokeStyle = TourOWLands.INK; c.lineWidth = 1.4;
      for (let i = 0; i < 14; i++) { const x = R() * G.w, y = R() * G.h, s = 5 + R() * 9; if (!TourOWLands.offshore(G, x, y, 40)) continue; this.P(c, [[x - s, y], [x - s * 0.5, y - s * 0.6], [x + s * 0.4, y - s * 0.7], [x + s, y - s * 0.1], [x + s * 0.3, y + s * 0.6], [x - s * 0.6, y + s * 0.5]], '#6a5a9a'); }
    },
    // dark polar water with plates of pack ice
    pack(c, ow) {
      const G = ow.G, R = this.rng(G.cc + 'pack');
      c.strokeStyle = TourOWLands.INK; c.lineWidth = 1.6;
      for (let i = 0; i < Math.round(G.w * G.h / 11000); i++) {
        const x = R() * G.w, y = R() * G.h, s = 10 + R() * 26; if (!TourOWLands.offshore(G, x, y, s + 14)) continue;
        const pts = []; for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + R() * 0.5, r = s * (0.7 + R() * 0.4); pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.5]); }
        c.save(); c.translate(0, 3); this.P(c, pts, '#9cc4dc'); c.restore(); this.P(c, pts, '#eef8fc');
        c.fillStyle = 'rgba(160,200,225,0.6)'; c.fillRect(x - s * 0.3, y, s * 0.5, 2);
      }
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2;
      for (let i = 0; i < Math.round(G.w * G.h / 16000); i++) { const x = R() * G.w, y = R() * G.h; if (!TourOWLands.offshore(G, x, y, 20)) continue; c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x + 9, y); c.stroke(); }
    },
    // warm water: wave marks, a turquoise lagoon and coral heads along every coast
    reef(c, ow) {
      const G = ow.G, R = this.rng(G.cc + 'reef'), L = ow.look;
      c.strokeStyle = rgba(mix(L.sea, '#ffffff', 0.5), 0.35); c.lineWidth = 2;
      for (let i = 0; i < Math.round(G.w * G.h / 9000); i++) { const x = R() * G.w, y = R() * G.h; if (!TourOWLands.offshore(G, x, y + 20, 60)) continue; c.beginPath(); c.arc(x, y, 6, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); c.beginPath(); c.arc(x + 11, y, 6, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
      for (const ring of G.land) { OWGeo.path(c, ring, true); c.strokeStyle = rgba('#7fe0d8', 0.45); c.lineWidth = 120; c.stroke(); }
      c.strokeStyle = TourOWLands.INK; c.lineWidth = 1;
      for (const ring of G.land) {
        const cen = TourOWLands.centroid(ring);
        for (let i = 0; i < ring.length; i += 3) {
          if (R() < 0.45) continue; const p = ring[i], dx = p[0] - cen[0], dy = p[1] - cen[1], d = Math.hypot(dx, dy) || 1, k = 44 + R() * 16, x = p[0] + dx / d * k, y = p[1] + dy / d * k;
          if (!TourOWLands.offshore(G, x, y, 30)) continue;
          const col = ['#ff8a7a', '#ffb05a', '#e86ab0', '#f4e0a0'][Math.floor(R() * 4)];
          c.fillStyle = col; for (let q = 0; q < 3; q++) { c.beginPath(); c.arc(x + (q - 1) * 4, y - (q % 2) * 3, 3 + R() * 1.5, 0, TAU); c.fill(); c.stroke(); }
        }
      }
    }
  },

  /* ---------- coasts (this = TourOWPaint; called once per land ring) ---------- */
  coast: {
    // a floating island: a rock underside tapering into the void, no beach, a lip of grass
    float(c, ow, ring) {
      const L = ow.look, ink = this.INK, b = TourOWLands.bbox(ring), hw = (b.x1 - b.x0) / 2, depth = Math.min(150, 50 + hw * 0.35);
      c.fillStyle = 'rgba(10,6,30,0.25)'; c.beginPath(); c.ellipse(b.cx, b.y1 + depth + 30, hw * 0.6, 14, 0, 0, TAU); c.fill();
      const under = ring.map(p => { const u = (p[0] - b.cx) / (hw || 1); return [p[0] * 0.97 + b.cx * 0.03, Math.max(p[1], b.cy) + depth * Math.max(0, 1 - u * u) * (p[1] > b.cy - 4 ? 1 : 0.2)]; });
      OWGeo.path(c, under, true); c.fillStyle = L.cliff; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke();
      c.save(); OWGeo.path(c, under, true); c.clip(); c.strokeStyle = rgba(shade(L.cliff, -0.35), 0.7); c.lineWidth = 1.4;
      for (let y = b.cy + 14; y < b.y1 + depth; y += 16) { c.beginPath(); c.moveTo(b.x0, y); for (let x = b.x0; x <= b.x1; x += 30) c.lineTo(x, y + Math.sin(x * 0.07 + y) * 3); c.stroke(); }
      c.fillStyle = rgba(shade(L.cliff, 0.25), 0.5); for (let x = b.x0 + 20; x < b.x1; x += 46) { c.beginPath(); c.ellipse(x, b.y1 + 10 + Math.sin(x) * 8, 9, 4, 0, 0, TAU); c.fill(); }
      c.restore();
      // roots dangling
      c.strokeStyle = '#5a4a6a'; c.lineWidth = 2;
      for (let x = b.x0 + hw * 0.5; x < b.x1 - hw * 0.4; x += hw * 0.3) { const y0 = b.y1 + depth * 0.5; c.beginPath(); c.moveTo(x, y0); c.quadraticCurveTo(x + 8, y0 + 30, x - 2, y0 + 52); c.stroke(); }
      OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
      c.save(); OWGeo.path(c, ring, true); c.clip(); c.strokeStyle = shade(L.land, -0.15); c.lineWidth = 12; OWGeo.path(c, ring, true); c.stroke(); c.restore();
      OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke();
    },
    // an ice shelf: a tall blue-white ice cliff with streaks, a snow lip
    ice(c, ow, ring) {
      const L = ow.look, ink = this.INK;
      OWGeo.path(c, ring, true); c.strokeStyle = rgba('#8fc4e0', 0.35); c.lineWidth = 50; c.stroke();
      c.save(); c.translate(0, 24); OWGeo.path(c, ring, true); c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 8; c.stroke(); c.fillStyle = '#9ccbe4'; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
      // streaks down the ice face
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2;
      for (let i = 0; i < ring.length; i += 2) { const p = ring[i]; c.beginPath(); c.moveTo(p[0], p[1] + 4); c.lineTo(p[0], p[1] + 18); c.stroke(); }
      c.strokeStyle = 'rgba(60,110,150,0.5)'; c.lineWidth = 1.2;
      for (let i = 1; i < ring.length; i += 3) { const p = ring[i]; c.beginPath(); c.moveTo(p[0], p[1] + 8); c.lineTo(p[0] + 1, p[1] + 22); c.stroke(); }
      OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
      c.save(); OWGeo.path(c, ring, true); c.clip(); c.strokeStyle = '#ffffff'; c.lineWidth = 16; OWGeo.path(c, ring, true); c.stroke(); c.restore();
      OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke();
    },
    // reclaimed land: a stone-faced dike with a grass bank and a road along its crest
    dike(c, ow, ring) {
      const L = ow.look, ink = this.INK;
      OWGeo.path(c, ring, true); c.strokeStyle = rgba(mix(L.sea, '#ffffff', 0.3), 0.45); c.lineWidth = 40; c.stroke();
      c.save(); c.translate(0, 9); OWGeo.path(c, ring, true); c.fillStyle = '#8a8a96'; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
      c.save(); c.translate(0, 9); OWGeo.path(c, ring, true); c.strokeStyle = 'rgba(40,40,60,0.45)'; c.lineWidth = 9; c.setLineDash([5, 4]); c.stroke(); c.setLineDash([]); c.restore();
      OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
      c.save(); OWGeo.path(c, ring, true); c.clip();
      c.strokeStyle = shade(L.land, -0.12); c.lineWidth = 30; OWGeo.path(c, ring, true); c.stroke();
      c.strokeStyle = '#c8b090'; c.lineWidth = 10; OWGeo.path(c, ring, true); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.2; c.setLineDash([6, 8]); OWGeo.path(c, ring, true); c.stroke(); c.setLineDash([]);
      c.restore();
      OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke();
    },
    // highland rock: a tall grey cliff with jagged strata, a band of scree instead of a beach
    rock(c, ow, ring) {
      const L = ow.look, ink = this.INK;
      c.save(); c.translate(0, 30); OWGeo.path(c, ring, true); c.fillStyle = L.cliff; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
      c.strokeStyle = rgba(shade(L.cliff, -0.35), 0.7); c.lineWidth = 1.4;
      for (const dy of [10, 19]) { c.beginPath(); ring.forEach((p, i) => { const y = p[1] + dy + (i % 3) * 2; if (i) c.lineTo(p[0], y); else c.moveTo(p[0], y); }); c.closePath(); c.stroke(); }
      c.strokeStyle = rgba(shade(L.cliff, 0.2), 0.6); c.lineWidth = 1.6;
      for (let i = 0; i < ring.length; i += 4) { const p = ring[i]; c.beginPath(); c.moveTo(p[0], p[1] + 4); c.lineTo(p[0] - 3, p[1] + 26); c.stroke(); }
      OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
      c.save(); OWGeo.path(c, ring, true); c.clip(); c.strokeStyle = L.beach; c.lineWidth = 22; OWGeo.path(c, ring, true); c.stroke();
      c.fillStyle = rgba(shade(L.beach, -0.25), 0.6); for (let i = 0; i < ring.length; i += 2) { const p = ring[i]; c.fillRect(p[0] - 2, p[1] - 2, 3, 3); } c.restore();
      OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke();
    }
  },

  /* ---------- ground marks (this = TourOWPaint, inside the land clip; R = the ground rng) ---------- */
  tufts: {
    sand(c, ow, R) { const G = ow.G; c.strokeStyle = rgba(shade(ow.look.land, -0.22), 0.5); c.lineWidth = 1.3; for (let i = 0; i < Math.round(G.w * G.h / 3200); i++) { const x = R() * G.w, y = R() * G.h; if (!this.dry(G, x, y)) continue; if (R() < 0.6) { c.beginPath(); c.moveTo(x - 6, y + 1); c.quadraticCurveTo(x, y - 3, x + 6, y + 1); c.stroke(); } else { c.fillStyle = c.strokeStyle; c.fillRect(x, y, 2, 2); } } },
    snow(c, ow, R) { const G = ow.G; c.strokeStyle = 'rgba(150,190,220,0.55)'; c.lineWidth = 1.4; for (let i = 0; i < Math.round(G.w * G.h / 3400); i++) { const x = R() * G.w, y = R() * G.h; if (!this.dry(G, x, y)) continue; if (R() < 0.5) { c.beginPath(); c.moveTo(x - 7, y); c.quadraticCurveTo(x, y - 2.5, x + 7, y); c.stroke(); } else { c.fillStyle = 'rgba(255,255,255,0.95)'; c.fillRect(x - 2, y - 0.5, 4, 1); c.fillRect(x - 0.5, y - 2, 1, 4); } } },
    flowers(c, ow, R) {
      const G = ow.G, cols = G.M.flowerCols || ['#ff6f91', '#ffd23a', '#ffffff'];
      c.strokeStyle = rgba(shade(ow.look.land, -0.25), 0.55); c.lineWidth = 1.4;
      for (let i = 0; i < Math.round(G.w * G.h / 2600); i++) { const x = R() * G.w, y = R() * G.h; if (!this.dry(G, x, y)) continue; if (R() < 0.3) { c.fillStyle = cols[i % cols.length]; c.beginPath(); c.arc(x, y - 2, 1.8, 0, TAU); c.fill(); } else { c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x - 1.5, y - 4); c.moveTo(x, y); c.lineTo(x + 0.5, y - 5); c.moveTo(x + 3, y); c.lineTo(x + 2, y - 3.5); c.stroke(); } }
    },
    none() {}
  },

  /* ---------- trail surfaces (this = TourOWPaint; the trail is already inked and coloured) ---------- */
  trail: {
    planks(c, ow, pts, col) { OWGeo.path(c, pts, false); c.lineCap = 'butt'; c.strokeStyle = rgba(shade(col, -0.35), 0.75); c.lineWidth = 8.5; c.setLineDash([1.5, 4]); c.stroke(); c.setLineDash([]); c.lineCap = 'round'; },
    stones(c, ow, pts, col) { OWGeo.path(c, pts, false); c.strokeStyle = rgba(shade(col, -0.3), 0.6); c.lineWidth = 5; c.setLineDash([0.1, 8]); c.stroke(); c.strokeStyle = rgba('#ffffff', 0.6); c.lineWidth = 2; c.stroke(); c.setLineDash([]); },
    rail(c, ow, pts, col) { OWGeo.path(c, pts, false); c.lineCap = 'butt'; c.strokeStyle = '#8a6a50'; c.lineWidth = 9; c.setLineDash([2.5, 4.5]); c.stroke(); c.setLineDash([]); c.strokeStyle = '#6a6a7a'; c.lineWidth = 6; c.stroke(); c.strokeStyle = col; c.lineWidth = 3.4; c.stroke(); c.lineCap = 'round'; },
    prints(c, ow, pts, col) { OWGeo.path(c, pts, false); c.strokeStyle = rgba(shade(col, -0.35), 0.6); c.lineWidth = 2.6; c.setLineDash([2.5, 7]); c.stroke(); c.setLineDash([]); },
    bricks(c, ow, pts, col) { OWGeo.path(c, pts, false); c.lineCap = 'butt'; c.strokeStyle = rgba(shade(col, -0.3), 0.55); c.lineWidth = 8.5; c.setLineDash([5, 1.4]); c.stroke(); c.strokeStyle = rgba(shade(col, -0.45), 0.5); c.lineWidth = 0.8; c.setLineDash([]); c.stroke(); c.lineCap = 'round'; },
    sand(c, ow, pts, col) { OWGeo.path(c, pts, false); c.strokeStyle = rgba(shade(col, -0.25), 0.55); c.lineWidth = 2; c.setLineDash([0.1, 5]); c.stroke(); c.setLineDash([]); },
    cobble(c, ow, pts, col) { OWGeo.path(c, pts, false); c.strokeStyle = rgba(shade(col, -0.2), 0.55); c.lineWidth = 6; c.setLineDash([3, 2.5]); c.stroke(); c.setLineDash([]); },
    sparkle(c, ow, pts, col) { OWGeo.path(c, pts, false); c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 2.2; c.setLineDash([0.1, 9]); c.stroke(); c.setLineDash([]); c.strokeStyle = rgba('#ff8ad0', 0.5); c.lineWidth = 1; c.setLineDash([4, 10]); c.stroke(); c.setLineDash([]); }
  },

  /* ---------- bridges (this = TourOWPaint; bp = the points over water) ---------- */
  bridge: {
    stone(c, ow, bp) { OWGeo.path(c, bp, false); c.lineCap = 'butt'; c.strokeStyle = this.INK; c.lineWidth = 16; c.stroke(); c.strokeStyle = '#b8b0a8'; c.lineWidth = 12; c.stroke(); c.strokeStyle = 'rgba(90,80,90,0.55)'; c.lineWidth = 12; c.setLineDash([1, 9]); c.stroke(); c.setLineDash([]); c.strokeStyle = '#d8d0c4'; c.lineWidth = 3; c.stroke(); },
    rope(c, ow, bp) {
      OWGeo.path(c, bp, false); c.lineCap = 'butt'; c.strokeStyle = this.INK; c.lineWidth = 9; c.stroke(); c.strokeStyle = '#c89a62'; c.lineWidth = 6; c.stroke(); c.strokeStyle = 'rgba(90,60,30,0.7)'; c.lineWidth = 6; c.setLineDash([1.2, 3]); c.stroke(); c.setLineDash([]);
      for (const side of [-1, 1]) { c.beginPath(); bp.forEach((p, i) => { const q = bp[Math.min(bp.length - 1, i + 1)], r = bp[Math.max(0, i - 1)], dx = q[0] - r[0], dy = q[1] - r[1], d = Math.hypot(dx, dy) || 1, x = p[0] - dy / d * 6 * side, y = p[1] + dx / d * 6 * side + 1.5; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.strokeStyle = '#7a5a3a'; c.lineWidth = 1.4; c.stroke(); }
    },
    ice(c, ow, bp) { OWGeo.path(c, bp, false); c.lineCap = 'butt'; c.strokeStyle = this.INK; c.lineWidth = 15; c.stroke(); c.strokeStyle = '#d8f0fa'; c.lineWidth = 11; c.stroke(); c.strokeStyle = 'rgba(120,180,215,0.6)'; c.lineWidth = 11; c.setLineDash([2, 14]); c.stroke(); c.setLineDash([]); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2; c.stroke(); },
    // floating stepping slabs over the void
    steps(c, ow, bp, gold) { OWGeo.path(c, bp, false); c.lineCap = 'butt'; c.strokeStyle = this.INK; c.lineWidth = 15; c.setLineDash([10, 6]); c.stroke(); c.strokeStyle = gold ? '#ffd84a' : '#e8d8ff'; c.lineWidth = 11; c.lineDashOffset = -1; c.setLineDash([8, 8]); c.stroke(); c.setLineDash([]); c.lineDashOffset = 0; }
  },

  /* ---------- ground features (this = TourOWPaint; inside the land clip) ---------- */
  ground: {
    // stepped terraces (rice, tea, vines): nested bands toward the middle, each with a bright lip of water or soil
    terraces(c, ow, f) {
      const pts = TourOWLands.ring(f[2]), col = f[1], n = f[3] || 6, cen = TourOWLands.centroid(pts), wet = f[4] !== false;
      for (let i = 0; i < n; i++) {
        const k = 1 - i / n * 0.85; c.save(); c.translate(cen[0], cen[1] + i * 1.5); c.scale(k, k); c.translate(-cen[0], -cen[1]);
        OWGeo.path(c, pts, true); c.fillStyle = shade(col, (i % 2 ? 0.05 : -0.04) + i * 0.025); c.fill(); c.restore();
        c.save(); c.translate(cen[0], cen[1] + i * 1.5); c.scale(k, k); c.translate(-cen[0], -cen[1]); OWGeo.path(c, pts, true); c.restore();
        c.strokeStyle = wet ? 'rgba(220,250,255,0.75)' : rgba(shade(col, -0.35), 0.6); c.lineWidth = 1.6; c.stroke();
      }
    },
    // contour lines (a hill or a plateau seen from above)
    contours(c, ow, f) {
      const pts = TourOWLands.ring(f[2]), n = f[3] || 4, cen = TourOWLands.centroid(pts);
      OWGeo.path(c, pts, true); c.fillStyle = f[1]; c.fill();
      c.strokeStyle = rgba(shade(f[1], -0.3), 0.55); c.lineWidth = 1.4;
      for (let i = 0; i < n; i++) { const k = 1 - (i + 1) / (n + 1); c.save(); c.translate(cen[0], cen[1]); c.scale(k, k * 0.95); c.translate(-cen[0], -cen[1]); OWGeo.path(c, pts, true); c.restore(); c.stroke(); }
    },
    // city blocks between streets: ['blocks', ring, { cols, step, ang, lit }]
    blocks(c, ow, f) {
      const pts = TourOWLands.ring(f[1]), o = f[2] || {}, b = TourOWLands.bbox(pts), step = o.step || 40, st = o.street || 11, cols = o.cols || ['#c8c0d8', '#d8c8b8', '#b8c8d8'], R = this.rng(ow.cc + 'blocks' + b.x0);
      c.save(); OWGeo.path(c, pts, true); c.clip();
      c.fillStyle = o.road || '#8a8698'; c.fillRect(b.x0 - 4, b.y0 - 4, b.x1 - b.x0 + 8, b.y1 - b.y0 + 8);
      c.translate(b.cx, b.cy); c.rotate(o.ang || 0); const d = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) / 2;
      c.strokeStyle = this.INK; c.lineWidth = 1.2;
      for (let y = -d; y < d; y += step) for (let x = -d; x < d; x += step) {
        const w = step - st, col = cols[Math.floor(R() * cols.length)];
        c.fillStyle = shade(col, -0.25); c.fillRect(x, y + 3, w, w - 3); c.fillStyle = col; c.fillRect(x, y, w, w - 5); c.strokeRect(x, y, w, w - 2);
        if (o.lit) { c.fillStyle = R() < 0.5 ? '#ffe070' : '#8ae0ff'; for (let q = 0; q < 3; q++) c.fillRect(x + 4 + q * (w - 10) / 2, y + w * 0.45, 2.5, 2.5); }
        else if (R() < 0.4) { c.fillStyle = '#5a9a5a'; c.beginPath(); c.arc(x + w / 2, y + w / 2 - 3, w * 0.22, 0, TAU); c.fill(); c.stroke(); }
      }
      c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 1; c.setLineDash([4, 5]);
      for (let y = -d; y < d; y += step) { c.beginPath(); c.moveTo(-d, y - st / 2 - 0.5); c.lineTo(d, y - st / 2 - 0.5); c.stroke(); }
      c.setLineDash([]); c.restore();
      OWGeo.path(c, pts, true); c.strokeStyle = this.INK; c.lineWidth = 2; c.stroke();
    },
    // polders: long strips of field in alternating greens with blue ditches: ['polders', ring, ang, cols]
    polders(c, ow, f) {
      const pts = TourOWLands.ring(f[1]), b = TourOWLands.bbox(pts), cols = f[3] || ['#8ac46a', '#7ab45a', '#9ad07a', '#b8d878'], d = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) / 2;
      c.save(); OWGeo.path(c, pts, true); c.clip(); c.translate(b.cx, b.cy); c.rotate(f[2] || 0);
      for (let x = -d, i = 0; x < d; x += 34, i++) { c.fillStyle = cols[i % cols.length]; c.fillRect(x, -d, 34, d * 2); }
      c.fillStyle = '#5aa8c8'; for (let x = -d; x < d; x += 34) c.fillRect(x - 1.5, -d, 3, d * 2);
      for (let y = -d; y < d; y += 120) c.fillRect(-d, y - 1.5, d * 2, 3);
      c.restore();
    },
    // crevasses in the ice: ['cracks', ring, n]
    cracks(c, ow, f) {
      const pts = TourOWLands.ring(f[1]), b = TourOWLands.bbox(pts), R = this.rng(ow.cc + 'cracks' + b.x0);
      c.save(); OWGeo.path(c, pts, true); c.clip();
      for (let i = 0; i < (f[2] || 10); i++) {
        const x = b.x0 + R() * (b.x1 - b.x0), y = b.y0 + R() * (b.y1 - b.y0), len = 30 + R() * 50, a = (R() - 0.5) * 0.6;
        c.beginPath(); c.moveTo(x, y); const top = [], bot = [];
        for (let s = 0; s <= 6; s++) { const u = s / 6, px = x + Math.cos(a) * len * u, py = y + Math.sin(a) * len * u + (s % 2 ? -2 : 2), w = Math.sin(u * Math.PI) * 4; top.push([px, py - w]); bot.push([px, py + w]); }
        this.P(c, top.concat(bot.reverse()), '#3a7ab0');
        c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(x + Math.cos(a) * len * 0.4, y + Math.sin(a) * len * 0.4 - 4, 6, 1.4);
      }
      c.restore();
    },
    // a chessboard floor: ['checker', ring, [colA, colB], size, ang]
    checker(c, ow, f) {
      const pts = TourOWLands.ring(f[1]), b = TourOWLands.bbox(pts), cols = f[2] || ['#e8e0f8', '#6a5aa8'], s = f[3] || 26, d = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) / 2;
      c.save(); OWGeo.path(c, pts, true); c.clip(); c.translate(b.cx, b.cy); c.rotate(f[4] || 0); c.scale(1, 0.6);
      for (let y = -d * 1.7, j = 0; y < d * 1.7; y += s, j++) for (let x = -d, i = 0; x < d; x += s, i++) { c.fillStyle = cols[(i + j) % 2]; c.fillRect(x, y, s, s); }
      c.restore();
      OWGeo.path(c, pts, true); c.strokeStyle = this.INK; c.lineWidth = 2; c.stroke();
    },
    // a decorative railway (not walkable): sleepers, two rails: ['rail', pts]
    rail(c, ow, f) {
      const pts = OWGeo.spline(TourOW.pairs(f[1]), false, 8);
      OWGeo.path(c, pts, false); c.lineCap = 'butt'; c.strokeStyle = 'rgba(28,20,38,0.25)'; c.lineWidth = 16; c.stroke();
      c.strokeStyle = '#7a5a40'; c.lineWidth = 13; c.setLineDash([3, 5]); c.stroke(); c.setLineDash([]);
      c.strokeStyle = this.INK; c.lineWidth = 8.5; c.stroke(); c.strokeStyle = '#b8bccb'; c.lineWidth = 6.5; c.stroke(); c.strokeStyle = this.INK; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = '#7a5a40'; c.lineWidth = 1.4; c.stroke(); c.lineCap = 'round';
    },
    // a town wall with crenels: ['wall', pts, colour]
    wall(c, ow, f) {
      const pts = OWGeo.resample(OWGeo.spline(TourOW.pairs(f[1]), !!f[3], 8), 9).pts, col = f[2] || '#d8a878';
      OWGeo.path(c, pts, !!f[3]); c.strokeStyle = this.INK; c.lineWidth = 9; c.stroke(); c.strokeStyle = col; c.lineWidth = 6; c.stroke();
      c.fillStyle = col; c.strokeStyle = this.INK; c.lineWidth = 1.2; for (let i = 0; i < pts.length; i += 2) { const p = pts[i]; c.fillRect(p[0] - 2.5, p[1] - 6, 5, 4); c.strokeRect(p[0] - 2.5, p[1] - 6, 5, 4); }
    },
    // a paved square: ['plaza', x, y, r, colour]
    plaza(c, ow, f) { const [, x, y, r, col] = f; c.fillStyle = col || '#e8d8b0'; c.beginPath(); c.ellipse(x, y, r, r * 0.6, 0, 0, TAU); c.fill(); c.strokeStyle = rgba(shade(col || '#e8d8b0', -0.3), 0.6); c.lineWidth = 1.2; for (let k = 0.35; k < 1; k += 0.3) { c.beginPath(); c.ellipse(x, y, r * k, r * k * 0.6, 0, 0, TAU); c.stroke(); } },
    // a painted spiral on the ground: ['swirl', x, y, r, colour]
    swirl(c, ow, f) { const [, x, y, r, col] = f; c.strokeStyle = col || '#c8a8ff'; c.lineWidth = 5; c.beginPath(); for (let a = 0; a < TAU * 3; a += 0.2) { const k = a / (TAU * 3) * r; const px = x + Math.cos(a) * k, py = y + Math.sin(a) * k * 0.6; a ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
  }
};

/* ---------- more scenery sprites (drawn at their foot, ink set by TourOWPaint.sprite) ---------- */
Object.assign(TourOWPaint.art, {
  giraffe(c, r) { const col = '#e8b84a'; c.beginPath(); for (const lx of [-r * 0.3, -r * 0.15, r * 0.15, r * 0.3]) { c.moveTo(lx, 0); c.lineTo(lx, -r * 0.6); } c.stroke(); this.O(c, 0, -r * 0.7, r * 0.42, col, r * 0.22); c.lineWidth = 4; c.strokeStyle = col; c.beginPath(); c.moveTo(r * 0.3, -r * 0.8); c.lineTo(r * 0.55, -r * 1.6); c.stroke(); c.lineWidth = 1.6; c.strokeStyle = TourOWPaint.INK; this.O(c, r * 0.62, -r * 1.65, r * 0.16, col, r * 0.1); c.fillStyle = '#8a5a2a'; for (const [x, y] of [[-r * 0.15, -r * 0.72], [r * 0.12, -r * 0.65], [r * 0.4, -r * 1.1]]) { c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill(); } },
  termite(c, r) { this.P(c, [[-r * 0.45, 0], [-r * 0.3, -r * 0.8], [-r * 0.1, -r * 1.3], [r * 0.12, -r * 1.05], [r * 0.25, -r * 1.4], [r * 0.45, 0]], '#c88a5a'); c.fillStyle = '#3a2420'; c.beginPath(); c.arc(0, -r * 0.2, 2.2, 0, TAU); c.fill(); },
  hut(c, r, o) { this.P(c, [[-r * 0.55, 0], [-r * 0.55, -r * 0.55], [r * 0.55, -r * 0.55], [r * 0.55, 0]], o.col || '#d8b088'); this.P(c, [[-r * 0.75, -r * 0.5], [0, -r * 1.25], [r * 0.75, -r * 0.5]], '#c8a050'); c.fillStyle = '#3a2a2a'; c.fillRect(-2, -r * 0.4, 4, r * 0.4); },
  neon(c, r, o) { const cols = ['#ff4f8a', '#38c8ff', '#ffd23a', '#7af0a0'], v = o.v || 0, h = r * (1.6 + v), w = r * 0.7; this.P(c, [[-w / 2, 0], [-w / 2, -h], [w / 2, -h], [w / 2, 0]], '#4a4a6a'); c.fillStyle = '#ffe070'; for (let y = -h + 5; y < -4; y += 6) for (let x = -w / 2 + 3; x < w / 2 - 3; x += 5) if ((x * 7 + y * 3) % 3 > 0.5) c.fillRect(x, y, 2, 2.5); c.fillStyle = cols[Math.floor(v * 4) % 4]; c.fillRect(w / 2 - 1, -h + 6, 4, h * 0.4); c.strokeRect(w / 2 - 1, -h + 6, 4, h * 0.4); },
  lantern(c, r, o) { c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r); c.lineTo(r * 0.3, -r); c.stroke(); this.O(c, r * 0.3, -r * 0.82, r * 0.22, o.col || '#ff5a3a', r * 0.28); },
  stilt(c, r, o) { c.beginPath(); for (const lx of [-r * 0.45, 0, r * 0.45]) { c.moveTo(lx, 0); c.lineTo(lx, -r * 0.45); } c.stroke(); this.P(c, [[-r * 0.6, -r * 0.45], [-r * 0.6, -r * 0.9], [r * 0.6, -r * 0.9], [r * 0.6, -r * 0.45]], o.col || '#c8955a'); this.P(c, [[-r * 0.85, -r * 0.85], [0, -r * 1.45], [r * 0.85, -r * 0.85]], o.roof || '#a87a3a'); },
  tent(c, r, o) { this.P(c, [[-r * 0.8, 0], [0, -r * 0.85], [r * 0.8, 0]], o.col || '#e8d0a0'); c.fillStyle = '#5a3a2a'; c.beginPath(); c.moveTo(-2.5, 0); c.lineTo(0, -r * 0.45); c.lineTo(2.5, 0); c.fill(); c.strokeStyle = o.stripe || '#c8503a'; c.lineWidth = 2; c.beginPath(); c.moveTo(-r * 0.4, -r * 0.42); c.lineTo(r * 0.4, -r * 0.42); c.stroke(); },
  kasbah(c, r) { const col = '#d08a5a'; this.P(c, [[-r * 0.45, 0], [-r * 0.38, -r * 1.3], [r * 0.38, -r * 1.3], [r * 0.45, 0]], col); c.fillStyle = col; for (const dx of [-0.38, -0.12, 0.14]) { c.fillRect(dx * r, -r * 1.42, r * 0.22, r * 0.14); c.strokeRect(dx * r, -r * 1.42, r * 0.22, r * 0.14); } c.fillStyle = '#5a3020'; c.fillRect(-2, -r * 0.9, 4, 5); c.fillRect(-2, -r * 0.45, 4, r * 0.45); },
  tagine(c, r) { this.O(c, 0, -r * 0.18, r * 0.8, '#b8603a', r * 0.22); this.P(c, [[-r * 0.66, -r * 0.3], [0, -r * 1.35], [r * 0.66, -r * 0.3]], '#d87a4a'); this.O(c, 0, -r * 1.38, r * 0.12, '#ffd23a'); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-r * 0.3, -r * 0.55); c.lineTo(-r * 0.08, -r * 1.05); c.stroke(); },
  onigiri(c, r) { c.beginPath(); c.moveTo(-r * 0.85, 0); c.quadraticCurveTo(-r * 0.75, -r * 0.5, -r * 0.15, -r * 1.2); c.quadraticCurveTo(0, -r * 1.32, r * 0.15, -r * 1.2); c.quadraticCurveTo(r * 0.75, -r * 0.5, r * 0.85, 0); c.closePath(); c.fillStyle = '#fbfbf4'; c.fill(); c.stroke(); this.P(c, [[-r * 0.35, 0], [-r * 0.32, -r * 0.42], [r * 0.32, -r * 0.42], [r * 0.35, 0]], '#2a3a2a'); },
  momo(c, r) { c.beginPath(); c.moveTo(-r * 0.7, 0); c.bezierCurveTo(-r * 0.8, -r * 0.7, -r * 0.2, -r * 0.9, 0, -r * 1.05); c.bezierCurveTo(r * 0.2, -r * 0.9, r * 0.8, -r * 0.7, r * 0.7, 0); c.closePath(); c.fillStyle = '#f4ecd8'; c.fill(); c.stroke(); c.lineWidth = 1; for (const d of [-0.3, 0, 0.3]) { c.beginPath(); c.moveTo(d * r, -r * 0.95); c.quadraticCurveTo(d * r * 1.4, -r * 0.6, d * r * 1.8, -r * 0.3); c.stroke(); } },
  paella(c, r) { this.O(c, 0, -r * 0.2, r, '#3a3a44', r * 0.36); this.O(c, 0, -r * 0.25, r * 0.86, '#f0b830', r * 0.29); c.lineWidth = 1; for (const [x, y, col] of [[-r * 0.4, -r * 0.3, '#e8423a'], [r * 0.2, -r * 0.18, '#5aa04a'], [r * 0.45, -r * 0.32, '#e8423a'], [-r * 0.05, -r * 0.4, '#f4e4d0']]) this.O(c, x, y, r * 0.12, col, r * 0.07); },
  cheese(c, r) { this.P(c, [[-r * 0.8, 0], [-r * 0.8, -r * 0.55], [r * 0.8, -r * 0.3], [r * 0.8, 0]], '#ffc83a'); this.P(c, [[-r * 0.8, -r * 0.55], [r * 0.1, -r * 0.95], [r * 0.8, -r * 0.3]], '#ffe07a'); c.fillStyle = '#e8a82a'; for (const [x, y] of [[-r * 0.4, -r * 0.25], [r * 0.3, -r * 0.15], [-r * 0.05, -r * 0.6]]) { c.beginPath(); c.arc(x, y, 2.2, 0, TAU); c.fill(); } },
  wheel(c, r) { for (let i = 0; i < 3; i++) { this.O(c, 0, -r * 0.18 - i * r * 0.3, r * 0.6, i % 2 ? '#ffd23a' : '#ffb82a', r * 0.2); } c.fillStyle = '#e8423a'; c.fillRect(-3, -r * 0.82, 6, 3); },
  gable(c, r, o) { const cols = ['#a84a3a', '#5a3a2a', '#2a4a6a', '#e8d8b8', '#3a5a4a'], v = o.v || 0; for (let i = 0; i < 3; i++) { const x = (i - 1) * r * 0.5, h = r * (1.1 + ((v * 7 + i) % 3) * 0.15), col = cols[Math.floor(v * 5 + i) % 5]; this.P(c, [[x - r * 0.25, 0], [x - r * 0.25, -h], [x - r * 0.12, -h], [x, -h - r * 0.25], [x + r * 0.12, -h], [x + r * 0.25, -h], [x + r * 0.25, 0]], col); c.fillStyle = '#fff4d8'; c.fillRect(x - 3, -h + 5, 2.5, 3); c.fillRect(x + 0.5, -h + 5, 2.5, 3); c.fillRect(x - 3, -h * 0.5, 2.5, 3); c.fillRect(x + 0.5, -h * 0.5, 2.5, 3); } },
  igloo(c, r) { c.beginPath(); c.arc(0, 0, r * 0.7, Math.PI, 0); c.closePath(); c.fillStyle = '#f4fbff'; c.fill(); c.stroke(); c.strokeStyle = 'rgba(120,170,200,0.7)'; c.lineWidth = 1; for (const y of [-r * 0.22, -r * 0.45]) { c.beginPath(); c.moveTo(-Math.sqrt(Math.max(0, r * r * 0.49 - y * y)), y); c.lineTo(Math.sqrt(Math.max(0, r * r * 0.49 - y * y)), y); c.stroke(); } c.strokeStyle = TourOWPaint.INK; c.lineWidth = 1.6; c.fillStyle = '#2a3a4a'; c.beginPath(); c.arc(r * 0.25, 0, r * 0.2, Math.PI, 0); c.fill(); },
  snowman(c, r) { this.O(c, 0, -r * 0.35, r * 0.4, '#ffffff'); this.O(c, 0, -r * 0.95, r * 0.28, '#ffffff'); c.fillStyle = '#ff8a2a'; c.beginPath(); c.moveTo(r * 0.05, -r * 0.95); c.lineTo(r * 0.4, -r * 0.9); c.lineTo(r * 0.05, -r * 0.88); c.fill(); c.fillStyle = '#e8423a'; c.fillRect(-r * 0.3, -r * 0.72, r * 0.6, 3); },
  melt(c, r) { c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r * 1.1); c.lineTo(r * 0.7, -r * 1.25); c.stroke(); c.beginPath(); c.moveTo(-r * 0.1, -r * 1.25); c.quadraticCurveTo(r * 0.3, -r * 1.55, r * 0.75, -r * 1.25); c.quadraticCurveTo(r * 0.85, -r * 0.8, r * 0.6, -r * 0.55); c.quadraticCurveTo(r * 0.45, -r * 0.9, r * 0.25, -r * 1.0); c.quadraticCurveTo(0, -r * 0.95, -r * 0.1, -r * 1.25); c.fillStyle = '#fff4d8'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(r * 0.35, -r * 1.2); c.lineTo(r * 0.4, -r * 1.05); c.lineTo(r * 0.55, -r * 1.0); c.stroke(); },
  stairs(c, r) { for (let i = 0; i < 5; i++) this.P(c, [[-r * 0.6 + i * r * 0.22, -i * r * 0.28], [-r * 0.6 + i * r * 0.22, -(i + 1) * r * 0.28], [-r * 0.6 + (i + 1) * r * 0.22 + 2, -(i + 1) * r * 0.28], [-r * 0.6 + (i + 1) * r * 0.22 + 2, -i * r * 0.28 + 3]], i % 2 ? '#d8c8f0' : '#c0aee8'); },
  door(c, r, o) { this.P(c, [[-r * 0.32, 0], [-r * 0.32, -r * 1.2], [r * 0.32, -r * 1.2], [r * 0.32, 0]], o.col || ['#e8423a', '#38a8e8', '#ffd23a', '#7ac850'][Math.floor((o.v || 0) * 4)]); c.fillStyle = '#ffd86a'; c.beginPath(); c.arc(r * 0.18, -r * 0.6, 1.6, 0, TAU); c.fill(); },
  cup(c, r) { this.P(c, [[-r * 0.6, -r * 0.9], [-r * 0.45, -r * 0.1], [r * 0.45, -r * 0.1], [r * 0.6, -r * 0.9]], '#fff4f8'); c.beginPath(); c.arc(r * 0.68, -r * 0.55, r * 0.22, -Math.PI / 2, Math.PI / 2); c.stroke(); this.O(c, 0, -r * 0.05, r * 0.75, '#ffb8d0', r * 0.14); c.fillStyle = '#ff8ab0'; c.fillRect(-r * 0.5, -r * 0.6, r, 3); c.fillStyle = '#ffe070'; c.fillRect(-r * 0.12, -r * 0.6, 3, 3); },
  umbrella(c, r, o) { c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r); c.stroke(); const cols = [o.col || '#ff5a6a', '#fff4e0']; for (let i = 0; i < 4; i++) { c.fillStyle = cols[i % 2]; c.beginPath(); c.moveTo(0, -r * 1.25); c.lineTo(-r * 0.75 + i * r * 0.375, -r * 0.85); c.lineTo(-r * 0.75 + (i + 1) * r * 0.375, -r * 0.85); c.closePath(); c.fill(); c.stroke(); } },
  pineapple(c, r) { this.O(c, 0, -r * 0.45, r * 0.32, '#f0b83a', r * 0.45); c.strokeStyle = 'rgba(140,80,20,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-r * 0.25, -r * 0.7); c.lineTo(r * 0.25, -r * 0.2); c.moveTo(r * 0.25, -r * 0.7); c.lineTo(-r * 0.25, -r * 0.2); c.stroke(); c.strokeStyle = TourOWPaint.INK; c.lineWidth = 1.4; c.fillStyle = '#4a9a4a'; for (const a of [-0.5, 0, 0.5]) { c.beginPath(); c.moveTo(0, -r * 0.88); c.lineTo(Math.sin(a) * r * 0.45, -r * 1.35); c.lineTo(Math.sin(a) * r * 0.1 + 2, -r * 0.88); c.fill(); c.stroke(); } },
  cacao(c, r) { c.fillStyle = '#6a4630'; c.fillRect(-1.6, -r * 0.7, 3.2, r * 0.7); c.strokeRect(-1.6, -r * 0.7, 3.2, r * 0.7); this.O(c, 0, -r * 1.05, r * 0.6, '#3f7a3a', r * 0.48); for (const [x, y, col] of [[-r * 0.25, -r * 0.62, '#e8a03a'], [r * 0.2, -r * 0.55, '#c8402a']]) this.O(c, x, y, 2.2, col, 3.6); },
  banana(c, r) { c.fillStyle = '#7aa04a'; c.fillRect(-1.8, -r * 0.8, 3.6, r * 0.8); c.strokeRect(-1.8, -r * 0.8, 3.6, r * 0.8); c.fillStyle = '#5ab04a'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(0, -r * 0.8); c.quadraticCurveTo(s * r * 0.5, -r * 1.5, s * r * 0.95, -r * 0.9); c.quadraticCurveTo(s * r * 0.5, -r * 1.0, 0, -r * 0.8); c.fill(); c.stroke(); } this.O(c, r * 0.12, -r * 0.6, 2.4, '#ffd23a', 3.4); },
  kiteflag(c, r, o) { c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r * 1.5); c.stroke(); c.fillStyle = o.col || '#e8423a'; c.beginPath(); c.moveTo(0, -r * 1.5); c.quadraticCurveTo(r * 0.5, -r * 1.35, r * 0.25, -r * 0.7); c.lineTo(0, -r * 0.9); c.closePath(); c.fill(); c.stroke(); },
  surfboard(c, r, o) { c.save(); c.rotate(0.15); this.O(c, 0, -r * 0.6, r * 0.18, o.col || '#38c8ff', r * 0.6); c.fillStyle = '#ffffff'; c.fillRect(-0.8, -r * 1.1, 1.6, r * 0.95); c.restore(); },
  seal(c, r) { this.O(c, 0, -r * 0.3, r * 0.65, '#7a8a9a', r * 0.28); this.O(c, r * 0.5, -r * 0.55, r * 0.22, '#7a8a9a'); c.fillStyle = TourOWPaint.INK; c.beginPath(); c.arc(r * 0.58, -r * 0.6, 1, 0, TAU); c.fill(); },
  dragonfruit(c, r) { this.O(c, 0, -r * 0.5, r * 0.4, '#ff4f8a', r * 0.48); c.fillStyle = '#7ac850'; for (const a of [-0.9, 0, 0.9]) { c.beginPath(); c.moveTo(Math.sin(a) * r * 0.3, -r * 0.5 - Math.cos(a) * r * 0.4); c.lineTo(Math.sin(a) * r * 0.55, -r * 0.55 - Math.cos(a) * r * 0.65); c.lineTo(Math.sin(a) * r * 0.1 + 2, -r * 0.6 - Math.cos(a) * r * 0.35); c.fill(); c.stroke(); } },
  boatdock(c, r, o) { c.fillStyle = '#a07a50'; c.fillRect(-r * 0.8, -3, r * 1.6, 4); c.strokeRect(-r * 0.8, -3, r * 1.6, 4); TourOWScenes.prop.boat(c, 0, 6, o.col || '#e8d8b8', { w: r * 1.2 }); },
  balloonpost(c, r, o) { c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r * 0.7); c.stroke(); this.O(c, 0, -r * 1.05, r * 0.38, o.col || '#ff8a3a', r * 0.42); },
  hayroll(c, r) { this.O(c, 0, -r * 0.3, r * 0.42, '#e8c060', r * 0.32); c.strokeStyle = 'rgba(140,100,30,0.7)'; c.lineWidth = 1; c.beginPath(); c.arc(0, -r * 0.3, r * 0.2, 0, TAU); c.stroke(); },
  bigstone(c, r) { this.P(c, [[-r * 0.8, 0], [-r * 0.65, -r * 0.6], [-r * 0.1, -r * 0.85], [r * 0.5, -r * 0.65], [r * 0.85, 0]], '#a8a0a0'); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-r * 0.45, -r * 0.6, r * 0.4, 2); }
});

/* ---------- land-wide moving bits: [kind, ...] in TOUR_OW_MAPS[cc].live (this = TourOWScenes) ---------- */
const OWL_IN = (vr, x, y, m) => x > vr.x0 - m && x < vr.x1 + m && y > vr.y0 - m && y < vr.y1 + m;
Object.assign(TourOWScenes.liveKinds, {
  // turning windmill sails over a 'windmill' sprite placed with { spin: 1 }: ['mill', x, y, size]
  mill(ctx, ow, l, t, vr) {
    const [, x, y, r] = l; if (!OWL_IN(vr, x, y, 40) || !(ow.G.placed && ow.G.placed[x + ',' + y])) return;
    ctx.save(); ctx.translate(x, y - r * 1.12); ctx.rotate(t * 1.4 + x); ctx.lineWidth = 1.3;
    for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillStyle = '#fff8ea'; ctx.beginPath(); ctx.rect(1, -2.5, r * 0.95, 5); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, TAU); ctx.fill(); ctx.restore();
  },
  // a hot-air balloon drifting on a small loop: ['balloon', x, y, colour, colour2]
  balloon(ctx, ow, l, t, vr) {
    const x = l[1] + Math.sin(t * 0.13 + l[1]) * 40, y = l[2] + Math.sin(t * 0.37 + l[2]) * 10; if (!OWL_IN(vr, x, y, 60)) return;
    ctx.fillStyle = 'rgba(20,14,30,0.15)'; ctx.beginPath(); ctx.ellipse(x + 10, y + 70, 9, 2.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = l[3] || '#ff5a6a'; ctx.beginPath(); ctx.ellipse(x, y, 12, 14, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = l[4] || '#ffd23a'; ctx.beginPath(); ctx.ellipse(x, y, 4.5, 14, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 8, y + 10); ctx.lineTo(x - 3, y + 20); ctx.moveTo(x + 8, y + 10); ctx.lineTo(x + 3, y + 20); ctx.stroke();
    ctx.lineWidth = 1.4; ctx.fillStyle = '#a8784a'; ctx.fillRect(x - 3.5, y + 19, 7, 5); ctx.strokeRect(x - 3.5, y + 19, 7, 5);
  },
  // a kite on a string, swaying: ['kite', x, y, colour]
  kite(ctx, ow, l, t, vr) {
    const [, gx, gy, col] = l, x = gx + 20 + Math.sin(t * 1.1 + gx) * 8, y = gy - 60 + Math.sin(t * 1.7 + gy) * 5; if (!OWL_IN(vr, x, y, 50)) return;
    ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgba(28,20,38,0.6)'; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.quadraticCurveTo(gx + 20, gy - 20, x, y + 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + 8); for (let i = 1; i <= 4; i++) ctx.lineTo(x - i * 4 + Math.sin(t * 6 + i) * 2, y + 8 + i * 5); ctx.stroke();
    ctx.strokeStyle = TourOWScenes.INK; ctx.lineWidth = 1.4; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2 + gx) * 0.2);
    ctx.fillStyle = col || '#ff4f8a'; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(7, 0); ctx.lineTo(0, 9); ctx.lineTo(-7, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff4d8'; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(7, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.restore();
  },
  // a little train running along a line: ['train', pts, speed, colour, cars, loop]
  train(ctx, ow, l, t, vr) {
    const P = l.P || (l.P = OWGeo.resample(OWGeo.spline(TourOW.pairs(l[1]), !!l[5], 8), 4)), n = l[4] || 3, sp = l[2] || 60;
    let s = (t * sp) % (l[5] ? P.len : P.len * 2); if (!l[5] && s > P.len) s = P.len * 2 - s;
    const head = OWGeo.at(P, s); if (!OWL_IN(vr, head.x, head.y, 120)) return;
    for (let i = n - 1; i >= 0; i--) {
      let u = s - i * 15; if (l[5]) u = (u + P.len) % P.len; const p = OWGeo.at(P, clamp(u, 0, P.len)), a = Math.atan2(p.dy, p.dx);
      ctx.save(); ctx.translate(p.x, p.y - 4); ctx.rotate(a);
      ctx.fillStyle = i === 0 ? (l[3] || '#f4f8fb') : '#f4f8fb'; rr(ctx, -7, -4, 14, 8, i === 0 ? 4 : 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#38a8e8'; ctx.fillRect(-4, -2, 8, 2); if (i === 0) { ctx.fillStyle = l[3] || '#38a8e8'; ctx.fillRect(3, -4, 4, 8); }
      ctx.restore();
    }
  },
  // an animal (or a goose on a bike) ambling back and forth along a path: ['walk', kind, pts, speed]
  walk(ctx, ow, l, t, vr) {
    const P = l.P || (l.P = OWGeo.resample(OWGeo.spline(TourOW.pairs(l[2]), false, 8), 4)), sp = l[3] || 14;
    const k = (t * sp) % (P.len * 2), back = k > P.len, s = back ? P.len * 2 - k : k, p = OWGeo.at(P, s); if (!OWL_IN(vr, p.x, p.y, 40)) return;
    const f = (p.dx >= 0) !== back ? 1 : -1, bob = Math.abs(Math.sin(t * 7)) * 1.5;
    if (l[1] === 'bike') { this.liveKinds.bikeAt.call(this, ctx, p.x, p.y - bob * 0.3, f, t); return; }
    this.critter(ctx, l[1], p.x, p.y - bob, { col: x => x }, f);
  },
  bikeAt(ctx, x, y, f, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1); ctx.lineWidth = 1.3;
    for (const wx of [-6, 6]) { ctx.beginPath(); ctx.arc(wx, -4, 4, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(wx, -4); ctx.lineTo(wx + Math.cos(t * 9) * 3.5, -4 + Math.sin(t * 9) * 3.5); ctx.stroke(); }
    ctx.strokeStyle = '#e8423a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-1, -10); ctx.lineTo(5, -10); ctx.lineTo(6, -4); ctx.moveTo(-1, -10); ctx.lineTo(1, -4); ctx.stroke();
    ctx.strokeStyle = TourOWScenes.INK; ctx.lineWidth = 1.4; ctx.fillStyle = '#c89a5a'; ctx.fillRect(4, -14, 6, 4); ctx.strokeRect(4, -14, 6, 4); ctx.fillStyle = '#ff4a5a'; ctx.beginPath(); ctx.arc(6, -15, 1.6, 0, TAU); ctx.arc(8.5, -15.5, 1.6, 0, TAU); ctx.fill();
    // the rider: a goose
    TourOWScenes.O(ctx, -2, -14, 4.5, '#ffffff', 3.2); ctx.lineWidth = 2.6; ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(1, -16); ctx.quadraticCurveTo(3, -20, 2, -23); ctx.stroke(); ctx.lineWidth = 1.4; ctx.strokeStyle = TourOWScenes.INK; TourOWScenes.O(ctx, 2, -23, 2.2, '#ffffff'); ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(4, -23.5); ctx.lineTo(7, -22.5); ctx.lineTo(4, -21.5); ctx.fill();
    ctx.restore();
  },
  // a big bird circling high up, its shadow on the ground: ['circle', x, y, radius, size]
  circle(ctx, ow, l, t, vr) {
    const [, cx, cy, r, s] = l, a = t * 0.35 + cx, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.5; if (!OWL_IN(vr, x, y, 60)) return;
    ctx.fillStyle = 'rgba(20,14,30,0.12)'; ctx.beginPath(); ctx.ellipse(x + 20, y + 60, 8 * (s || 1), 2.5, 0, 0, TAU); ctx.fill();
    ctx.lineWidth = 2.2; this.bird(ctx, x, y, Math.sin(t * 2.4 + cx) * 3, 2 * (s || 1)); ctx.lineWidth = 1.6;
  },
  // falling flakes or petals over an area: ['flakes', x0, y0, x1, y1, n, colour, petals]
  flakes(ctx, ow, l, t, vr) {
    const [, x0, y0, x1, y1, n, col, petal] = l, ax = Math.max(x0, vr.x0), bx = Math.min(x1, vr.x1), ay = Math.max(y0, vr.y0), by = Math.min(y1, vr.y1); if (ax >= bx || ay >= by) return;
    ctx.fillStyle = col || 'rgba(255,255,255,0.9)';
    for (let i = 0; i < n; i++) {
      const x = x0 + ((i * 97.13 + Math.sin(t * 0.8 + i) * 14) % (x1 - x0) + (x1 - x0)) % (x1 - x0), y = y0 + ((i * 53.7 + t * (petal ? 18 : 28)) % (y1 - y0));
      if (x < ax || x > bx || y < ay || y > by) continue;
      if (petal) { ctx.save(); ctx.translate(x, y); ctx.rotate(t * 2 + i); ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.4, 0, 0, TAU); ctx.fill(); ctx.restore(); } else { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill(); }
    }
  },
  // a fish leaping out of the water now and then: ['fish', x, y, colour]
  fish(ctx, ow, l, t, vr) {
    const [, x, y, col] = l; if (!OWL_IN(vr, x, y, 40)) return; const k = (t * 0.45 + x * 0.01) % 1; if (k > 0.35) return; const u = k / 0.35;
    const px = x - 14 + u * 28, py = y - Math.sin(u * Math.PI) * 22;
    ctx.save(); ctx.translate(px, py); ctx.rotate(-Math.cos(u * Math.PI) * 0.9); ctx.fillStyle = col || '#ff9a3a'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-10, -3.5); ctx.lineTo(-10, 3.5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    if (u < 0.15 || u > 0.85) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(u < 0.5 ? x - 14 : x + 14, y, 6, 2, 0, 0, TAU); ctx.stroke(); }
  },
  // something floating and bobbing: ['bob', kind, x, y] kind: duck | buoy | rock | lantern
  bob(ctx, ow, l, t, vr) {
    const [, kind, x, y0] = l; if (!OWL_IN(vr, x, y0, 40)) return; const y = y0 + Math.sin(t * 1.6 + x) * (kind === 'rock' ? 5 : 1.2);
    if (kind === 'rock') { ctx.fillStyle = 'rgba(10,6,30,0.2)'; ctx.beginPath(); ctx.ellipse(x, y0 + 26, 10, 3, 0, 0, TAU); ctx.fill(); TourOWScenes.P(ctx, [[x - 12, y], [x - 6, y - 7], [x + 5, y - 8], [x + 12, y - 1], [x + 3, y + 9], [x - 6, y + 7]], '#6a5a9a'); ctx.fillStyle = '#9ba5c2'; ctx.fillRect(x - 7, y - 7, 12, 3); return; }
    if (kind === 'duck') { TourOWScenes.O(ctx, x, y, 6, '#ffd23a', 3.4); TourOWScenes.O(ctx, x + 4, y - 5, 2.8, '#ffd23a'); ctx.fillStyle = '#ff8a2a'; ctx.fillRect(x + 6, y - 5.5, 3, 1.6); return; }
    if (kind === 'lantern') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,170,60,0.35)'; ctx.beginPath(); ctx.arc(x, y - 3, 9, 0, TAU); ctx.fill(); ctx.restore(); TourOWScenes.O(ctx, x, y - 3, 3.6, '#ff6a3a', 4.4); return; }
    ctx.fillStyle = '#ff5a3a'; ctx.beginPath(); ctx.arc(x, y - 3, 4, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 4, y - 3, 8, 2);
  },
  // paper lanterns drifting down a river: ['lanterns', riverIndex, n]
  lanterns(ctx, ow, l, t, vr) {
    const R = ow.G.rivers[l[1] || 0]; if (!R) return; const P = l.P || (l.P = OWGeo.resample(R.pts, 6));
    for (let i = 0; i < (l[2] || 4); i++) { const p = OWGeo.at(P, ((t * 9 + i * P.len / (l[2] || 4)) % P.len)); if (!OWL_IN(vr, p.x, p.y, 20)) continue; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,170,60,0.4)'; ctx.beginPath(); ctx.arc(p.x, p.y - 2, 8, 0, TAU); ctx.fill(); ctx.restore(); TourOWScenes.O(ctx, p.x, p.y - 2, 3, ['#ff5a3a', '#ffd23a', '#ff8ad0'][i % 3], 3.6); }
  },
  // a light blinking (a mast, a beacon): ['blink', x, y, colour]
  blink(ctx, ow, l, t, vr) { const [, x, y, col] = l; if (!OWL_IN(vr, x, y, 20) || Math.sin(t * 4 + x) < 0) return; ctx.fillStyle = col || '#ff4a3a'; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill(); },
  // a hang-glider riding the thermals: ['glider', x, y, radius]
  glider(ctx, ow, l, t, vr) {
    const [, cx, cy, r] = l, a = t * 0.3 + cx, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.4 + Math.sin(t) * 6; if (!OWL_IN(vr, x, y, 50)) return;
    ctx.fillStyle = 'rgba(20,14,30,0.12)'; ctx.beginPath(); ctx.ellipse(x + 16, y + 70, 10, 2.5, 0, 0, TAU); ctx.fill();
    const f = Math.sin(a) > 0 ? -1 : 1; ctx.save(); ctx.translate(x, y); ctx.scale(f, 1);
    ctx.fillStyle = '#ff8a3a'; ctx.beginPath(); ctx.moveTo(-14, 2); ctx.lineTo(0, -5); ctx.lineTo(14, 2); ctx.lineTo(0, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(14, 2); ctx.lineTo(0, -1); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0, 7); ctx.stroke();
    // the pilot: a toucan
    ctx.lineWidth = 1.4; TourOWScenes.O(ctx, 0, 9, 2.8, '#26283a', 3.4); ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.moveTo(1.5, 7.5); ctx.lineTo(7, 9); ctx.lineTo(1.5, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // a clock floating and turning: ['clock', x, y, r]
  clock(ctx, ow, l, t, vr) {
    const [, x, y0, r] = l; if (!OWL_IN(vr, x, y0, r + 30)) return; const y = y0 + Math.sin(t * 0.9 + x) * 4;
    ctx.fillStyle = 'rgba(10,6,30,0.18)'; ctx.beginPath(); ctx.ellipse(x, y0 + r + 26, r * 0.7, 3, 0, 0, TAU); ctx.fill();
    TourOWScenes.O(ctx, x, y, r, '#fff4d8'); ctx.fillStyle = '#8a6ad8'; for (let i = 0; i < 12; i += 3) { const a = i / 12 * TAU; ctx.fillRect(x + Math.cos(a) * r * 0.78 - 1, y + Math.sin(a) * r * 0.78 - 1, 2, 2); }
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(-t * 1.3) * r * 0.75, y + Math.sin(-t * 1.3) * r * 0.75); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(-t * 0.11) * r * 0.5, y + Math.sin(-t * 0.11) * r * 0.5); ctx.stroke();
  },
  // a paper plane looping: ['plane', x, y, r]
  plane(ctx, ow, l, t, vr) {
    const [, cx, cy, r] = l, a = t * 0.5 + cx, x = cx + Math.sin(a) * r, y = cy + Math.sin(a * 2) * r * 0.3; if (!OWL_IN(vr, x, y, 30)) return;
    const dx = Math.cos(a) * r, dy = Math.cos(a * 2) * r * 0.6; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(dy, dx)); ctx.lineWidth = 1.2;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-7, -6); ctx.lineTo(-4, 0); ctx.lineTo(-7, 5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  },
  // a seal popping out of a hole in the ice: ['seal', x, y]
  seal(ctx, ow, l, t, vr) {
    const [, x, y] = l; if (!OWL_IN(vr, x, y, 30)) return; ctx.fillStyle = '#1f4a74'; ctx.beginPath(); ctx.ellipse(x, y, 10, 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    const k = (t * 0.3 + x * 0.003) % 1; if (k > 0.5) return; const h = Math.sin(k / 0.5 * Math.PI) * 9;
    ctx.save(); ctx.beginPath(); ctx.rect(x - 12, y - 30, 24, 30); ctx.clip(); TourOWScenes.O(ctx, x, y - h + 4, 5, '#7a8a9a', 7); ctx.fillStyle = TourOWScenes.INK; ctx.fillRect(x - 2.5, y - h, 1.5, 1.5); ctx.fillRect(x + 1, y - h, 1.5, 1.5); ctx.restore();
  }
});
TourMapScene.Lands = TourOWLands;
