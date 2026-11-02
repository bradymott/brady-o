/* ============================================================
   BRADY-O BURNS — World 14: the flyover city + deep-playa art
   A simplified, original Black Rock City for the flight: clock streets
   painted on the playa, low-detail camps merged into a few long-range
   chunks (drawn past the normal 260 m chunk range while flying), Center
   Camp, the Temple (our own design), the Man's pavilion and eight
   monumental art pieces as landmark silhouettes (BurnsBigArt is used
   for close-up detail elsewhere; these stay cheap for the air).
   ============================================================ */

const BW14_City = {
  pool: null,
  begin() { this.pool = new Map(); this.obstacles = []; this.thermals = []; this.hot = []; },
  mesh(key, lo) {
    let L = this.pool.get(key);
    if (!L) { L = [new BurnsMesh(16384)]; this.pool.set(key, L); }
    let m = L[L.length - 1];
    if (m.nv > 44000) { m = new BurnsMesh(16384); L.push(m); }
    m.lo = !!lo;
    return m;
  },
  // fn(m) built at (x, y, z, yaw, scale) into the long-range pool `key`
  put(key, x, y, z, yaw, s, fn, lo) { const m = this.mesh(key, lo); m.push(); m.identity(); m.tf(x, y, z, yaw || 0, 0, 0, s || 1); fn(m); m.pop(); m.lo = false; },
  finish(W) {
    const out = [];
    for (const [, L] of this.pool) for (const m of L) if (!m.empty) { const g = m.geo(); g.bw14far = true; W.chunks.push(g); out.push(g); }
    this.pool = null;
    return out;
  },
  // obstacle the plane can bonk: capsule from (ax,ay,az) to (bx,by,bz) radius r
  obstacle(name, ax, ay, az, bx, by, bz, r) { this.obstacles.push({ name, ax, ay, az, bx, by, bz, r }); },
  // rising warm air over hot art (plane + canopy feel it)
  thermal(x, z, r, lift, top, name) { const t = { x, z, r, lift, top: top || 420, name: name || 'thermal' }; this.thermals.push(t); return t; },

  /* ---------------- ground paint: streets, plazas, the runway ---------------- */
  paint(api) {
    const C = BW14_CFG, R = api.rng;
    api.paint((c, P, S) => {
      const arc = (r, h0, h1, w, col) => { const [cx, cz] = P(0, 0); c.strokeStyle = col; c.lineWidth = w * S; c.beginPath(); c.arc(cx, cz, r * S, h0 / 12 * TAU - Math.PI / 2, h1 / 12 * TAU - Math.PI / 2, false); c.stroke(); };
      const line = (x0, z0, x1, z1, w, col) => { const a = P(x0, z0), b = P(x1, z1); c.strokeStyle = col; c.lineWidth = w * S; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
      const disc = (x, z, r, col) => { const [px, pz] = P(x, z); c.fillStyle = col; c.beginPath(); c.arc(px, pz, r * S, 0, TAU); c.fill(); };
      const soft = (x, z, r, col, a) => { const [px, pz] = P(x, z), rr2 = r * S; const g2 = c.createRadialGradient(px, pz, 0, px, pz, rr2); const k = burnsRGB(col); g2.addColorStop(0, `rgba(${k[0]},${k[1]},${k[2]},${a})`); g2.addColorStop(1, `rgba(${k[0]},${k[1]},${k[2]},0)`); c.fillStyle = g2; c.fillRect(px - rr2, pz - rr2, rr2 * 2, rr2 * 2); };
      c.lineCap = 'round';
      // playa blotches + tyre tracks everywhere
      for (let i = 0; i < 260; i++) soft(R.range(-640, 640), R.range(-640, 640), R.range(6, 30), R() < 0.5 ? '#8a6448' : '#f0d4b0', 0.2);
      c.lineWidth = 0.35 * S; c.strokeStyle = 'rgba(110,80,62,0.22)';
      for (let i = 0; i < 70; i++) { const [ax, az] = P(R.range(-560, 560), R.range(-560, 560)), ang = R() * TAU, len = R.range(40, 220) * S; c.beginPath(); c.moveTo(ax, az); c.quadraticCurveTo(ax + Math.cos(ang + 0.5) * len * 0.5, az + Math.sin(ang + 0.5) * len * 0.5, ax + Math.cos(ang) * len, az + Math.sin(ang) * len); c.stroke(); }
      // the city footprint: dustier, darker annulus with block tints
      const [ox, oz] = P(0, 0);
      c.fillStyle = 'rgba(120,88,70,0.22)'; c.beginPath(); c.arc(ox, oz, 334 * S, C.H0 / 12 * TAU - Math.PI / 2, C.H1 / 12 * TAU - Math.PI / 2); c.arc(ox, oz, 141 * S, C.H1 / 12 * TAU - Math.PI / 2, C.H0 / 12 * TAU - Math.PI / 2, true); c.closePath(); c.fill();
      // streets: Esplanade + lettered rings, radials every half hour
      const rings = [146].concat(C.STREETS.slice(1));
      rings.forEach((r, i) => { arc(r, C.H0, C.H1, i === 0 ? 11 : 6.5, 'rgba(236,212,180,0.75)'); arc(r, C.H0, C.H1, i === 0 ? 1.2 : 0.6, 'rgba(120,90,70,0.25)'); });
      for (let h = C.H0; h <= C.H1 + 1e-6; h += 0.5) { const a = bw14Clock(h, 141), b = bw14Clock(h, 334), main = Math.abs(h - 3) < 0.01 || Math.abs(h - 6) < 0.01 || Math.abs(h - 9) < 0.01; line(a.x, a.z, b.x, b.z, main ? 10 : 6, 'rgba(236,212,180,0.72)'); }
      // plazas (3:00, 4:30, 7:30, 9:00) + Center Camp
      for (const h of [3, 4.5, 7.5, 9]) { const p = bw14Clock(h, 248); disc(p.x, p.z, 17, 'rgba(236,212,180,0.75)'); }
      { const p = bw14Clock(6, 182); disc(p.x, p.z, 34, 'rgba(236,212,180,0.8)'); soft(p.x, p.z, 44, '#c89a70', 0.35); }
      // the inner playa: the Man's circle, the keyhole road to 6:00, the Temple's court
      soft(0, 0, 60, '#e8c8a0', 0.45); disc(0, 0, 22, 'rgba(150,108,84,0.55)'); disc(0, 0, 17, 'rgba(236,212,180,0.75)');
      line(0, 22, 0, 141, 8, 'rgba(236,212,180,0.5)');
      soft(C.TEMPLE.x, C.TEMPLE.z, 44, '#f4e0c0', 0.5); disc(C.TEMPLE.x, C.TEMPLE.z, 24, 'rgba(236,212,180,0.65)');
      // bike paths across the open playa
      c.strokeStyle = 'rgba(120,90,70,0.22)'; c.lineWidth = 1.2 * S;
      for (let i = 0; i < 26; i++) { const a = R() * TAU, r0 = R.range(30, 120), r1 = R.range(160, 480); const [x0, z0] = P(Math.sin(a) * r0, -Math.cos(a) * r0), [x1, z1] = P(Math.sin(a + R.range(-0.4, 0.4)) * r1, -Math.cos(a + R.range(-0.4, 0.4)) * r1); c.beginPath(); c.moveTo(x0, z0); c.lineTo(x1, z1); c.stroke(); }
      // the trash fence (pentagon)
      c.strokeStyle = 'rgba(255,120,40,0.55)'; c.lineWidth = 1.4 * S; c.beginPath();
      for (let i = 0; i <= 5; i++) { const a = i / 5 * TAU + 0.31, [px, pz] = P(Math.sin(a) * 575, -Math.cos(a) * 575); i ? c.lineTo(px, pz) : c.moveTo(px, pz); } c.stroke();
      // the airstrip: compacted runway, threshold bars, centre dashes, numbers, the apron and taxiway
      const W2 = C.RWY;
      soft(C.APRON.x + 20, C.APRON.z - 10, 140, '#e6c8a2', 0.28);
      { const [x0, z0] = P(W2.x - W2.w / 2, W2.z1 - 8), [x1, z1] = P(W2.x + W2.w / 2, W2.z0 + 8); c.fillStyle = 'rgba(140,112,94,0.85)'; c.fillRect(x0, z0, x1 - x0, z1 - z0); c.fillStyle = 'rgba(110,86,72,0.5)'; for (const o of [-6, -2.5, 2.5, 6]) { const [a, b] = P(W2.x + o - 0.35, W2.z1), [a2, b2] = P(W2.x + o + 0.35, W2.z0); c.fillRect(a, b, a2 - a, b2 - b); } }
      for (const zt of [W2.z0 - 4, W2.z1 + 4]) for (let k = -3; k <= 3; k++) { const [a, b] = P(W2.x + k * 2.4 - 0.7, zt - 3), [a2, b2] = P(W2.x + k * 2.4 + 0.7, zt + 3); c.fillStyle = 'rgba(250,246,236,0.85)'; c.fillRect(a, b, a2 - a, b2 - b); }
      for (let z = W2.z1 + 16; z < W2.z0 - 16; z += 14) { const [a, b] = P(W2.x - 0.4, z), [a2, b2] = P(W2.x + 0.4, z + 7); c.fillStyle = 'rgba(250,246,236,0.75)'; c.fillRect(a, b, a2 - a, b2 - b); }
      c.save(); c.fillStyle = 'rgba(250,246,236,0.85)'; c.font = `${Math.round(9 * S)}px ${FONT_DISPLAY}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      { const [a, b] = P(W2.x, W2.z0 - 16); c.save(); c.translate(a, b); c.fillText('36', 0, 0); c.restore(); }
      { const [a, b] = P(W2.x, W2.z1 + 16); c.save(); c.translate(a, b); c.rotate(Math.PI); c.fillText('18', 0, 0); c.restore(); }
      c.restore();
      { const [x0, z0] = P(W2.x + W2.w / 2, 96), [x1, z1] = P(C.APRON.x + 52, 214); c.fillStyle = 'rgba(214,186,152,0.6)'; c.fillRect(x0, z0, x1 - x0, z1 - z0); }
      line(C.SPAWN.x, 300, C.SPAWN.x - 4, 210, 8, 'rgba(214,186,152,0.6)');
      line(C.SPAWN.x, 300, 380, 600, 8, 'rgba(214,186,152,0.4)');
      // the landing zone: a big bullseye laid out by the Glow Crew
      const L = C.LZ; soft(L.x, L.z, 30, '#f4e4c8', 0.6);
      { const [px, pz] = P(L.x, L.z); c.fillStyle = 'rgba(255,79,216,0.28)'; c.beginPath(); c.arc(px, pz, 4 * S, 0, TAU); c.fill(); }
      for (const [r, col] of [[18, 'rgba(255,79,216,0.5)'], [9, 'rgba(255,226,74,0.65)'], [4, 'rgba(255,79,216,0.9)']]) { const [px, pz] = P(L.x, L.z); c.strokeStyle = col; c.lineWidth = 1.1 * S; c.beginPath(); c.arc(px, pz, r * S, 0, TAU); c.stroke(); }
      { const [px, pz] = P(L.x, L.z); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 0.9 * S; c.beginPath(); c.moveTo(px - 3 * S, pz - 3 * S); c.lineTo(px + 3 * S, pz + 3 * S); c.moveTo(px + 3 * S, pz - 3 * S); c.lineTo(px - 3 * S, pz + 3 * S); c.stroke(); }
    });
  },

  /* ---------------- low-detail camps ---------------- */
  camps(api, avoid) {
    const C = BW14_CFG, R = mulberry32(1414);
    const canv = ['#e8dcc4', '#d8c8a8', '#c8b8e8', '#e8c8a8', '#a8d8c8', '#f4e8d0', '#ffb0c8', '#b0d0ff', '#e0e0d0'];
    const rvCol = ['#f4f0e8', '#e8e4dc', '#d8dce4', '#f4f0e8', '#c8ccd4', '#f0e0c8'];
    const rings = [146].concat(C.STREETS.slice(1));
    const blocked = (x, z, pad) => avoid.some(a => Math.hypot(x - a.x, z - a.z) < a.r + (pad || 0));
    for (let ri = 0; ri < rings.length - 1; ri++) {
      const r0 = rings[ri] + (ri === 0 ? 6.5 : 3.5), r1 = rings[ri + 1] - 3.5;
      for (let h = C.H0; h < C.H1 - 1e-6; h += 0.5) {
        const key = 'camp' + Math.floor(h / 2);   // four big quadrants: fewer draw calls, still frustum-culled
        const n = ri === 0 ? 4 : 7 + Math.floor(R() * 3);
        for (let k = 0; k < n; k++) {
          const r = lerp(r0, r1, R()), hh = h + 0.04 + R() * 0.42, p = bw14Clock(hh, r);
          if (blocked(p.x, p.z, 4)) continue;
          const yaw = Math.atan2(-p.x, -p.z) + R.range(-0.3, 0.3);   // face the Man-ish
          this.put(key, p.x, 0, p.z, yaw, 1, m => {
            const roll = R();
            if (roll < 0.55) { // RV / trailer / box truck
              const len = R.range(6, 10), col = R.pick(rvCol);
              m.color(col); m.box(0, 1.55, 0, 2.5, 3.1, len, { top: shade(col, -0.06) });
              m.color(R.pick(BURNS_NEON), 0.6); m.box(1.26, 1.6, 0, 0.05, 0.25, len * 0.8); m.emissive(0);
            } else if (roll < 0.72) { // geodesic-ish dome
              const dr = R.range(3, 6); m.color(R.pick(['#e8e0d0', '#d8c8e8', '#f4f0e8', '#c8d8e8'])); m.ellipsoid(0, 0, 0, dr, dr * 0.95, dr, { phi1: Math.PI / 2, seg: 10, rings: 4 });
            } else { // tents
              for (let t = 0; t < 2 + Math.floor(R() * 2); t++) { m.color(R.pick(['#3a8a5a', '#2a6ac8', '#c83a3a', '#e8a83a', '#8a5ac8'])); m.cyl(R.range(-3, 3), 0, R.range(-3, 3), 1.3, 0, 1.4, 4, {}); }
            }
            if (R() < 0.6) { // shade structure (posts on the near side only)
              const w = R.range(5, 9), d = R.range(5, 8), sx = R.range(-5, 5), sz = R.range(3, 7) * (R() < 0.5 ? -1 : 1), col = R.pick(canv);
              m.color(col); m.box(sx, 2.95, sz, w, 0.12, d);
              if (R() < 0.5) { m.color('#6a6a72'); for (const [a, b] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) m.box(sx + a * (w / 2 - 0.1), 1.45, sz + b * (d / 2 - 0.1), 0.12, 2.9, 0.12); }
            }
            if (R() < 0.18) { m.color('#5a5a62'); m.box(R.range(-4, 4), 3.5, R.range(-4, 4), 0.12, 7, 0.12); m.color(R.pick(BURNS_NEON), 1); m.box(0, 7, 0, 1.2, 0.8, 0.06); m.emissive(0); }
          }, true);
        }
      }
    }
  },
  /* big theme camps along the Esplanade (landmarks you can spot from the air) */
  landmarks(api, avoid) {
    const R = mulberry32(777), C = BW14_CFG;
    const kinds = ['dome', 'tower', 'disco', 'pyramid', 'wheel', 'tent', 'speakers', 'castle'];
    let i = 0;
    for (let h = 2.25; h < 10; h += 0.5) {
      const p = bw14Clock(h, 162);
      if (avoid.some(a => Math.hypot(p.x - a.x, p.z - a.z) < a.r + 8)) continue;
      const kind = kinds[i++ % kinds.length], yaw = Math.atan2(-p.x, -p.z);
      this.put('esp' + Math.floor(h / 2), p.x, 0, p.z, yaw, 1, m => {
        if (kind === 'dome') { m.color('#e8e4f0'); m.dome(0, 0, 0, 10, 2, { alt: '#c8c0e0' }); m.color('#ff4fd8', 1); m.torus(0, 0.3, 0, 10.2, 0.25, { seg: 24, tseg: 4 }); m.emissive(0); }
        else if (kind === 'tower') { m.color('#4a4a56'); m.lathe([[3, 0], [2.4, 4], [1.6, 14], [1.2, 22], [0, 24]], { seg: 10 }); m.color('#38f2ff', 1); for (let k = 0; k < 5; k++) m.torus(0, 4 + k * 4, 0, lerp(2.5, 1.3, k / 5), 0.18, { seg: 14, tseg: 4 }); m.ball(0, 24.5, 0, 1.1, { seg: 8, rings: 5 }); m.emissive(0); }
        else if (kind === 'disco') { m.color('#6a6a72'); m.limb(0, 0, 0, 0, 12, 0, 0.35, 0.3, { seg: 6 }); m.color('#d8e0f0', 0.25).shine(3); m.ball(0, 15, 0, 4, { seg: 14, rings: 10 }); m.emissive(0).shine(0); }
        else if (kind === 'pyramid') { m.color('#e8c870'); m.cyl(0, 0, 0, 11, 0.6, 13, 4, {}); m.color('#ff7a2a', 1); m.ball(0, 13.6, 0, 1.2, { seg: 8, rings: 5 }); m.emissive(0); }
        else if (kind === 'wheel') { m.color('#5a5a62'); m.limb(-3, 0, 0, 0, 11, 0, 0.3, 0.3, { seg: 5 }); m.limb(3, 0, 0, 0, 11, 0, 0.3, 0.3, { seg: 5 }); m.push(); m.tf(0, 11, 0, 0, 0, Math.PI / 2); m.color('#ff4fd8', 1); m.torus(0, 0, 0, 9, 0.3, { seg: 28, tseg: 4 }); m.color('#ffe24a', 1); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; m.limb(0, 0, 0, Math.sin(a) * 9, 0, Math.cos(a) * 9, 0.12, 0.12, { seg: 3 }); m.ball(Math.sin(a) * 9, 0, Math.cos(a) * 9, 0.9, { seg: 8, rings: 5 }); } m.pop(); m.emissive(0); }
        else if (kind === 'tent') { m.color('#f4f0e8'); m.lathe([[12, 0], [12, 3], [9, 4.5], [3, 9], [0, 10.5]], { seg: 16 }); m.color('#ff3b5c'); m.lathe([[12.05, 2.6], [12.05, 3.0]], { seg: 16 }); }
        else if (kind === 'speakers') { m.color('#1a1a20'); for (let k = -2; k <= 2; k++) m.box(k * 3.1, 3.5, 0, 3, 7 + Math.abs(k) * -1, 3); m.color('#7aff5a', 1); m.box(0, 7.4, 1.6, 15, 0.4, 0.2); m.emissive(0); m.color('#2a2a30'); m.box(0, 1.2, 6, 10, 2.4, 6); }
        else { m.color('#c8a878'); for (const sx of [-1, 1]) { m.box(sx * 7, 5, 0, 3, 10, 3); m.color('#ff7a2a', 1); m.cyl(sx * 7, 10, 0, 2, 0, 3, 4, {}); m.emissive(0); m.color('#c8a878'); } m.box(0, 3, 0, 11, 6, 1.5); }
      }, true);
    }
  },
  /* Center Camp: a big round shade with a ring of banner poles */
  centerCamp() {
    const p = bw14Clock(6, 182);
    this.put('center', p.x, 0, p.z, 0, 1, m => {
      m.color('#f4ecd8'); m.lathe([[30, 6.5], [30, 7.2], [20, 10.5], [6, 15], [0, 16]], { seg: 24 });
      m.color('#e0d4bc'); m.lathe([[29.5, 6.5], [0, 6.6]], { seg: 24, flip: true });
      m.color('#6a5a4a'); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; m.box(Math.sin(a) * 28.5, 3.3, Math.cos(a) * 28.5, 0.4, 6.6, 0.4); }
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + 0.13; m.color(BURNS_NEON[k % 7]); m.box(Math.sin(a) * 32, 5, Math.cos(a) * 32, 0.12, 10, 0.12); m.box(Math.sin(a) * 32 + 0.8, 9, Math.cos(a) * 32, 1.6, 1.8, 0.05); }
    }, true);
    this.obstacle('Center Camp', p.x, 0, p.z, p.x, 12, p.z, 30);
  },
  /* the Temple at 12:00: an original tiered wooden temple with a spire and a ring of gate arches */
  temple() {
    const T = BW14_CFG.TEMPLE;
    this.put('temple', T.x, 0, T.z, 0, 1, m => {
      const wood = '#c8a070', dark = '#8a6440', light = '#e8c898';
      m.color(dark); m.cyl(0, 0, 0, 13, 12.5, 1.2, 8, {});
      m.color(wood); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + Math.PI / 8; m.push(); m.tf(Math.sin(a) * 9.6, 4.6, Math.cos(a) * 9.6, a); m.roundBox(0, 0, 0, 7.4, 7, 0.6, 0.2); m.pop(); }
      m.color(light); m.lathe([[12, 8], [12.4, 8.6], [9.5, 10.2], [9.5, 10.6], [10.2, 11.0], [7.2, 13.0], [7.2, 13.4], [7.8, 13.8], [5, 16], [5, 16.4], [5.5, 16.8], [3, 19.4], [1.2, 24], [0.5, 27.5], [0, 29]], { seg: 8 });
      m.color('#ffd28a', 0.85); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; m.ball(Math.sin(a) * 12.2, 8.1, Math.cos(a) * 12.2, 0.45, { seg: 6, rings: 4 }); m.ball(Math.sin(a) * 7.6, 13.2, Math.cos(a) * 7.6, 0.35, { seg: 6, rings: 4 }); } m.ball(0, 29.2, 0, 0.6, { seg: 8, rings: 5 }); m.emissive(0);
      // gate arches around the court
      m.color(wood); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.26, x = Math.sin(a) * 22, z = Math.cos(a) * 22; m.push(); m.tf(x, 0, z, a); m.box(-1.8, 3, 0, 0.5, 6, 0.5); m.box(1.8, 3, 0, 0.5, 6, 0.5); m.box(0, 6.2, 0, 4.6, 0.5, 0.7); m.box(0, 6.9, 0, 3.2, 0.4, 0.5); m.pop(); }
    }, false);
    this.obstacle('the Temple', T.x, 0, T.z, T.x, 22, T.z, 11);
    this.obstacle('the Temple spire', T.x, 22, T.z, T.x, 29, T.z, 3);
  },
  /* the trash fence: a thin orange line far out (sold as "the edge of the world") */
  fence() {
    for (let i = 0; i < 5; i++) {
      const a0 = i / 5 * TAU + 0.31, a1 = (i + 1) / 5 * TAU + 0.31, x0 = Math.sin(a0) * 575, z0 = -Math.cos(a0) * 575, x1 = Math.sin(a1) * 575, z1 = -Math.cos(a1) * 575;
      const n = 14; for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = lerp(x0, x1, t), z = lerp(z0, z1, t), len = Math.hypot(x1 - x0, z1 - z0) / n, yaw = Math.atan2(x1 - x0, z1 - z0); this.put('fence', x, 0, z, yaw, 1, m => { m.color('#ff7a2a'); m.box(0, 1.1, 0, 0.08, 1.2, len - 0.3); m.color('#6a6a72'); m.box(0, 1, len / 2 - 0.15, 0.12, 2.0, 0.12); }, true); }
    }
  },

  /* ---------------- the eight monumental deep-playa pieces (original designs) ---------------- */
  ART: [
    { id: 'rocket', name: 'the Retro Rocket', x: 330, z: -300 },
    { id: 'giant', name: 'the Sleeping Giant', x: 150, z: -250 },
    { id: 'pumpjack', name: 'the Pump Jack Colossus', x: 212, z: -420 },
    { id: 'semi', name: 'the Knotted Semi', x: 60, z: -470 },
    { id: 'lighthouses', name: 'the Leaning Lighthouses', x: -130, z: -420 },
    { id: 'galleon', name: 'the Landlocked Galleon', x: -190, z: -250 },
    { id: 'cathedral', name: 'the Stick Cathedral', x: -278, z: -332 },
    { id: 'shrooms', name: 'the Glowshroom Grove', x: -370, z: -190 }
  ],
  art(api, g) {
    for (const A of this.ART) { const fn = this['art_' + A.id]; if (fn) fn.call(this, api, g, A); }
  },
  art_rocket(api, g, A) {
    this.put('art:rocket', A.x, 0, A.z, 0.4, 1, m => {
      m.color('#f4f0e8').shine(2);
      m.lathe([[0, 3.2], [2.6, 3.2], [3.3, 7], [3.4, 14], [3.1, 21], [2.3, 27], [1.2, 31.5], [0.3, 34.5], [0, 35]], { seg: 18 });
      m.color('#e8342a'); m.lathe([[3.32, 12.5], [3.38, 12.5], [3.38, 14.6], [3.32, 14.6]], { seg: 18 }); m.lathe([[1.4, 30.9], [1.45, 30.9], [0.3, 34.5], [0, 35]], { seg: 18 });
      m.color('#3a3a44'); m.lathe([[2.6, 3.2], [2.2, 1.2], [1.6, 0.6], [1.5, 1.4], [2.0, 3.2]], { seg: 14 });
      m.color('#e8342a'); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; m.push(); m.tf(Math.sin(a) * 3.6, 6, Math.cos(a) * 3.6, a); m.roundBox(0, 0, 0, 0.4, 9, 3.4, 0.18); m.roundBox(0, -4.4, 0.9, 0.5, 1.2, 1.8, 0.2); m.pop(); }
      m.color('#38f2ff', 0.7).shine(3); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.5; m.push(); m.tf(Math.sin(a) * 3.3, 19, Math.cos(a) * 3.3, a); m.torus(0, 0, 0, 0.7, 0.14, { seg: 12, tseg: 4 }); m.pop(); m.ball(Math.sin(a) * 3.25, 19, Math.cos(a) * 3.25, 0.62, { seg: 8, rings: 6 }); }
      m.color('#ffb040', 1); m.ball(0, 1.0, 0, 1.4, { seg: 10, rings: 6, squash: 0.6 }); m.emissive(0).shine(0);
      // the gantry (like BurnsBigArt's): a red lattice tower with decks, an arm to the capsule, the big red button
      m.color('#c8302a').shine(1);
      for (const [x, z] of [[7, -3], [13, -3], [7, 3], [13, 3]]) m.limb(x, 0, z, x, 27, z, 0.3, 0.3, { seg: 6 });
      for (const y of [5, 10, 15, 20, 25]) { m.color('#c8302a'); m.roundBox(10, y, 0, 6.6, 0.3, 6.6, 0.1); m.color('#5a606c'); m.limb(7, y - 4.5, -3, 13, y - 0.4, -3, 0.12, 0.12, { seg: 3 }); m.limb(7, y - 4.5, 3, 13, y - 0.4, 3, 0.12, 0.12, { seg: 3 }); }
      m.color('#d8dce4').shine(3); m.roundBox(5.2, 25.3, 0, 4.6, 0.6, 1.6, 0.2);
      m.color('#ff2a2a', 0.9); m.roundCyl(11.5, 25.15, 0, 0.6, 0.4, 0.15, { seg: 10 }); m.emissive(0).shine(0);
    });
    this.obstacle(A.name, A.x, 0, A.z, A.x, 31, A.z, 4.2);
    { const c = Math.cos(0.4), sn = Math.sin(0.4); this.obstacle('the gantry', A.x + 10 * c, 0, A.z - 10 * sn, A.x + 10 * c, 27, A.z - 10 * sn, 5); }
    this.thermal(A.x + 18, A.z + 30, 12, 9, 220, 'rocket exhaust');
  },
  art_giant(api, g, A) {
    // matches BurnsBigArt's wooden Sleeping Giant: carved wood, plaid shirt, denim, boots, a big beard
    this.put('art:giant', A.x, 0, A.z, -0.5, 1, m => {
      const wood = '#c8905a', woodD = '#a8723e', denim = '#3a5a8a', boot = '#4a2e1e', beard = '#9a5a2e';
      m.color('#f2ead8'); m.ellipsoid(-16, 2.2, 0, 6.5, 2.4, 5.2, { seg: 12, rings: 6 });                // pillow
      m.color(wood).shine(1); m.ellipsoid(-13.5, 7.4, 0, 5.4, 5.8, 5.2, { seg: 14, rings: 9 });         // head
      m.color(beard); m.ellipsoid(-9.6, 6.4, 0.4, 3.0, 4.6, 4.4, { seg: 12, rings: 7 });                 // beard
      m.color(woodD); m.ellipsoid(-8.6, 9.2, 0.6, 1.1, 1.0, 1.1, { seg: 8, rings: 5 });                   // nose
      m.color('#3a2416'); for (const zz of [-1.6, 2.6]) m.limb(-9.4, 10.6, zz, -9.3, 10.4, zz + 1.4, 0.18, 0.18, { seg: 4 }); // closed eyes
      m.color('#b8322a'); m.ellipsoid(0, 5.6, 0, 11, 6.0, 6.4, { seg: 16, rings: 9, colFn: (x, y, z) => ((Math.floor((x + 50) / 2.2) + Math.floor((z + 50) / 2.2)) % 2) ? '#b8322a' : '#3a1616' }); // plaid shirt (breathing chest)
      m.color(denim); m.limb(8, 4, 2.6, 16, 8.2, 2.0, 2.7, 2.4, { seg: 10 }); m.limb(16, 8.2, 2.0, 22, 2.6, 2.4, 2.4, 2.2, { seg: 10 }); // knee up
      m.limb(9, 2.6, -2.6, 23, 2.3, -3.0, 2.5, 2.1, { seg: 10 });
      m.color(boot); m.ellipsoid(24, 2.6, 2.6, 1.8, 2.4, 3.6, { seg: 10, rings: 6 }); m.ellipsoid(25, 2.4, -3.0, 1.8, 2.4, 3.6, { seg: 10, rings: 6 });
      m.color(wood); m.limb(-4, 9.4, 3.6, 4, 11, 5.2, 1.8, 1.6, { seg: 8 }); m.ball(5, 11.1, 5.4, 1.8, { seg: 8, rings: 6 });     // hand on the belly
      m.color('#9a7aff', 0.7); for (let k = 0; k < 3; k++) { m.push(); m.tf(-13 + k * 2.6, 17 + k * 4, -2, 0.3); m.roundBox(0, 0, 0, 2 + k * 0.6, 0.5, 0.3, 0.12); m.pop(); } m.emissive(0).shine(0);
    });
    { const c = Math.cos(-0.5), sn = Math.sin(-0.5), W = lx => [A.x + lx * c, A.z - lx * sn]; const a = W(-15), b = W(22); this.obstacle(A.name, a[0], 4, a[1], b[0], 4, b[1], 7); }
  },
  art_pumpjack(api, g, A) {
    const yaw = 1.2;
    // matches BurnsBigArt's steel Pump Jack Colossus (steel frame, yellow beam, maroon counterweight)
    this.put('art:pumpjack', A.x, 0, A.z, yaw, 1, m => {
      m.color('#3a3e48'); m.roundBox(0, 0.8, 0, 9, 1.6, 34, 0.4);
      m.color('#5a606c').shine(2); for (const sd of [1, -1]) { m.limb(sd * 3.2, 1.6, -7, sd * 0.7, 22, 0, 0.8, 0.6, { seg: 8 }); m.limb(sd * 3.2, 1.6, 7, sd * 0.7, 22, 0, 0.8, 0.6, { seg: 8 }); m.limb(sd * 3, 8, -4.5, sd * 3, 8, 4.5, 0.35, 0.35, { seg: 6 }); }
      m.color('#3a3e48'); m.roundCyl(0, 21.5, 0, 1.6, 1.4, 0.3, { seg: 12 });
      m.color('#5a606c'); m.roundBox(0, 3.5, -11, 3.4, 5, 3.4, 0.4); m.color('#d8a84a').shine(3); m.push(); m.tf(9, 0, 6); m.roundCyl(0, 0, 0, 4.2, 15, 0.8, { seg: 14 }); m.pop(); m.shine(2);
      m.color('#2a2a30'); m.limb(0, 1.6, 12.6, 0, 6, 12.6, 0.5, 0.5, { seg: 8 });
      m.shine(0);
    });
    // the rocking walking beam + horse head + the spinning counterweight are movers
    const c = Math.cos(yaw), s = Math.sin(yaw), W = (lx, lz) => [A.x + lx * c + lz * s, A.z - lx * s + lz * c];
    const beam = api.mover(m => { m.color('#ffc21a').shine(2); m.roundBox(0, 0, -1, 2.4, 2.6, 26, 0.5); m.color('#3a3a44'); m.push(); m.tf(0, -2.6, 12.6, 0, 0, 0); m.lathe([[0, -3], [2.8, -2.6], [3.4, 0], [2.8, 2.6], [0, 3]], { seg: 10, sx: 0.5 }); m.pop(); m.color('#ff4fd8', 1); m.limb(0, 1.4, -13, 0, 1.4, 11, 0.12, 0.12, { seg: 4 }); m.emissive(0).shine(0); m.color('#2a2a30'); m.limb(0, -5, 12.6, 0, -18, 12.6, 0.12, 0.12, { seg: 4 }); return { cols: [] }; });
    const crank = api.mover(m => { m.color('#3a3e48'); m.roundBox(0, 0, 0, 1.6, 9, 3.4, 0.5); m.color('#8a2a3a'); m.roundBox(0, -3.8, 0, 2.2, 3.6, 5.2, 0.6); return { cols: [] }; });
    const [bx, bz] = W(0, 0), [cx, cz] = W(0, -11);
    beam.noCollide = crank.noCollide = true;
    api.update((g2, dt) => {
      const t = g2.time * 0.9, rock = Math.sin(t) * 0.22;
      beam.x = bx; beam.z = bz; beam.y = 22.3; beam.yaw = yaw; beam.pitch = rock;
      crank.x = cx; crank.z = cz; crank.y = 6; crank.yaw = yaw; crank.roll = 0;
      crank.pitch = t; // rotates about its local X (the crank axle)
    });
    this.obstacle(A.name, A.x, 0, A.z, A.x, 24, A.z, 5);
    { const p = W(0, 12.6); this.obstacle('the horse head', p[0], 8, p[1], p[0], 26, p[1], 4); }
  },
  art_semi(api, g, A) {
    // matches BurnsBigArt's Knotted Semi: the trailer loops the loop, the cab parks on top of the knot
    this.put('art:semi', A.x, 0, A.z, -0.3, 1, m => {
      const R0 = 6.8, white = '#f4f0e8';
      // the looping trailer: a flat box-section strip swept around a vertical loop that drifts sideways
      m.color(white).shine(2);
      const N = 40; let prev = null;
      for (let i = 0; i <= N; i++) {
        const a = i / N * TAU, x = (i / N - 0.5) * 4.8, y = R0 - Math.cos(a) * R0 + 0.4, z = Math.sin(a) * R0, q = [x, y, z];
        if (prev) m.limb(prev[0], prev[1], prev[2], q[0], q[1], q[2], 1.35, 1.35, { seg: 8, ends: i === 1 || i === N, sz: 0.55 });
        prev = q;
      }
      m.color('#ff4fd8', 1); for (let i = 0; i < N; i += 3) { const a = i / N * TAU; m.ball((i / N - 0.5) * 4.8, R0 - Math.cos(a) * (R0 - 1.4) + 0.4, Math.sin(a) * (R0 - 1.4), 0.25, { seg: 6, rings: 4 }); } m.emissive(0);
      // ramps in and out + the cradle deck on top
      m.color('#c8c8d0'); m.roundBox(-2.4, 0.4, 13, 3, 0.5, 12, 0.2); m.roundBox(2.4, 0.4, -13, 3, 0.5, 12, 0.2);
      m.color('#5a606c'); m.roundBox(0, 14.6, 0, 3.8, 0.8, 9, 0.3);
      // the cab, parked on top
      m.color('#3a6ad8').shine(2); m.roundBox(0, 17.2, 1.2, 3.2, 3.6, 3.6, 0.5); m.roundBox(0, 16.2, 3.6, 3.0, 1.8, 1.6, 0.4);
      m.color('#1c2a46', 0.05).shine(3); m.roundBox(0, 17.9, 3.0, 2.7, 1.2, 0.1, 0.06); m.emissive(0);
      m.color('#c8c8d0'); for (const sd of [1, -1]) m.limb(sd * 1.5, 16, 0.2, sd * 1.5, 21.4, 0.2, 0.18, 0.18, { seg: 6 });
      m.color('#1a1a1e'); for (const [x, z] of [[1.4, 3], [-1.4, 3], [1.4, 0], [-1.4, 0]]) { m.push(); m.tf(x, 15.9, z, 0, 0, Math.PI / 2); m.roundCyl(0, -0.35, 0, 0.9, 0.7, 0.2, { seg: 12 }); m.pop(); }
    });
    this.obstacle(A.name, A.x, 0, A.z, A.x, 20, A.z, 8.5);
  },
  // the two lighthouses lean into each other: an arch you can (secretly) fly through
  LH: { half: 20, tilt: 0.47, h: 38 },
  art_lighthouses(api, g, A) {
    const L = this.LH;
    const yaw = A.yaw || 0;
    this.put('art:lighthouses', A.x, 0, A.z, yaw, 1, m => {
      const tower = (h, stripe, base) => { const prof = []; const n = 8; for (let k = 0; k < n; k++) { const y0 = k / n * h, y1 = (k + 1) / n * h, c = k % 2 ? base : stripe; prof.push([lerp(3.4, 2.2, y0 / h), y0, c], [lerp(3.4, 2.2, y1 / h), y1, c]); } return [[0, 0]].concat(prof).concat([[0, h]]); };
      // the third one, Crooked Kip, leans on the other two from behind
      m.push(); m.tf(-27, 0, 0, 0, 0, -0.55); m.lathe(tower(20, '#2a9a6a', '#f8e8b8'), { seg: 14 }); m.color('#2a2a30'); m.roundCyl(0, 20, 0, 2.6, 0.5, 0.2, { seg: 12 }); m.color('#ffe8a0', 1); m.roundCyl(0, 20.5, 0, 1.5, 2.6, 0.3, { seg: 12 }); m.emissive(0); m.color('#2a2a30'); m.lathe([[1.9, 23.1], [1.9, 23.4], [0.3, 25.4], [0, 25.6]], { seg: 12 }); m.pop();
      for (const sd of [-1, 1]) {
        m.push(); m.tf(sd * L.half, 0, 0, 0, 0, sd * L.tilt);
        const prof = tower(31, sd < 0 ? '#d23a30' : '#2a8ac8', '#f4f0e8').slice(1, -1);
        m.lathe([[0, 0]].concat(prof).concat([[0, 31]]), { seg: 16 });
        m.color('#2a2a30'); m.roundCyl(0, 31, 0, 2.8, 0.6, 0.2, { seg: 14 });
        m.color('#ffe8a0', 1); m.roundCyl(0, 31.6, 0, 1.7, 3.2, 0.3, { seg: 14 }); m.emissive(0);
        m.color('#2a2a30'); m.lathe([[2.1, 34.8], [2.1, 35.1], [0.3, 37.4], [0, 37.6]], { seg: 14 });
        m.color('#c8c8d0'); m.torus(0, 31.6, 0, 2.9, 0.08, { seg: 18, tseg: 4 });
        m.pop();
      }
    });
    const ax = Math.cos(yaw), az = -Math.sin(yaw);
    for (const sd of [-1, 1]) { const b = sd * L.half, t = sd * (L.half - Math.sin(L.tilt) * L.h), ty = Math.cos(L.tilt) * L.h; this.obstacle(A.name, A.x + ax * b, 0, A.z + az * b, A.x + ax * t, ty, A.z + az * t, 3.3); }
    { const b = -27, t = -27 + Math.sin(0.55) * 22, ty = Math.cos(0.55) * 22; this.obstacle(A.name, A.x + ax * b, 0, A.z + az * b, A.x + ax * t, ty, A.z + az * t, 3.0); }
  },
  art_galleon(api, g, A) {
    this.put('art:galleon', A.x, 0, A.z, 0.8, 1, m => {
      m.push(); m.tf(0, 1.2, 0, 0, 0, 0.12);
      // hull: lathe along +Z, squashed into a boat section, half sunk
      m.push(); m.tf(0, 0, -16, 0, Math.PI / 2, 0); m.color('#7a4a2a').shine(1);
      m.lathe([[0.5, 0], [4.5, 2], [6.2, 8], [6.4, 18], [5.6, 26], [3.4, 31], [0.6, 34]], { seg: 16, sx: 1, sz: 0.62 }); m.pop();
      m.color('#5a3218'); m.roundBox(0, 3.6, -1, 11.8, 0.6, 30, 0.3);
      m.color('#e8c870', 0.4); for (let k = 0; k < 6; k++) for (const sd of [1, -1]) m.ball(sd * 5.9, 1.6, -10 + k * 4, 0.45, { seg: 6, rings: 4 }); m.emissive(0);
      m.color('#4a2a14'); m.roundBox(0, 6.4, -12.5, 9, 5, 6, 0.5);
      // masts + sails
      for (const [z, h] of [[-6, 22], [3, 25], [11, 18]]) {
        m.color('#5a3a20'); m.limb(0, 3.6, z, 0, h, z, 0.42, 0.3, { seg: 8 });
        m.color('#f4ecd8').shine(1); for (let k = 0; k < 2; k++) { const y = 8 + k * (h - 10) / 2, w = 11 - k * 3; m.push(); m.tf(0, y + 3, z + 0.6); m.surf(6, 4, (u, v, o) => { o[0] = (u - 0.5) * w; o[1] = (v - 0.5) * 5.5; o[2] = Math.sin(u * Math.PI) * 1.2 * Math.sin(v * Math.PI * 0.9 + 0.2); }, {}); m.surf(6, 4, (u, v, o) => { o[0] = (0.5 - u) * w; o[1] = (v - 0.5) * 5.5; o[2] = Math.sin(u * Math.PI) * 1.2 * Math.sin(v * Math.PI * 0.9 + 0.2) - 0.05; }, {}); m.pop(); }
        m.color('#ff3b5c', 0.4); m.roundBox(0, h + 0.8, z, 0.1, 1.4, 2.4, 0.05); m.emissive(0);
      }
      m.color('#3a2a1e'); m.limb(0, 6, 16, 0, 9.5, 24, 0.3, 0.15, { seg: 6 });
      m.color('#e8c870', 0.3); m.ball(0, 4.4, 17.4, 1.2, { seg: 8, rings: 6 }); m.emissive(0);
      m.pop();
      // the pier it "sailed" up to (like BurnsBigArt's)
      m.color('#a87a4e'); m.roundBox(9, 1.2, -20, 3, 0.4, 24, 0.12); m.color('#6a4a2a'); for (let k = 0; k < 7; k++) for (const sd of [1, -1]) m.limb(9 + sd * 1.4, 0, -31 + k * 3.8, 9 + sd * 1.4, 2.4, -31 + k * 3.8, 0.18, 0.18, { seg: 5 });
    });
    this.obstacle(A.name, A.x - 9, 6, A.z - 11, A.x + 9, 6, A.z + 11, 7);
    this.obstacle('the masts', A.x, 6, A.z, A.x, 25, A.z, 3);
  },
  art_cathedral(api, g, A) {
    this.put('art:cathedral', A.x, 0, A.z, 0.25, 1, m => {
      const wood = '#b08858', dark = '#7a5a38';
      m.color(dark); m.roundBox(0, 0.4, 0, 18, 0.8, 34, 0.3);
      // nave: pairs of pointed arches made of bundled sticks
      for (let k = 0; k < 7; k++) {
        const z = -14 + k * 4.4;
        for (const sd of [1, -1]) { m.color(k % 2 ? wood : dark); m.limb(sd * 7.5, 0.8, z, sd * 6.2, 11, z, 0.35, 0.3, { seg: 5 }); m.limb(sd * 6.2, 11, z, 0, 17, z, 0.3, 0.26, { seg: 5 }); }
        if (k % 2 === 0) { m.color(wood); m.limb(-7.5, 5, z, 7.5, 5, z, 0.15, 0.15, { seg: 3 }); }
      }
      m.color(wood); for (const y of [4, 9]) for (const sd of [1, -1]) m.limb(sd * (y > 5 ? 6.6 : 7.2), y, -14, sd * (y > 5 ? 6.6 : 7.2), y, 14.6, 0.14, 0.14, { seg: 3 });
      // twin front spires (stick lattice cones) + a rose window
      for (const sd of [1, -1]) {
        m.color(dark); m.lathe([[3.4, 0], [3.0, 12], [2.6, 18]], { seg: 6 });
        m.push(); m.tf(sd * 6.5, 0, 17); m.color(dark); m.lathe([[3.4, 0.6], [3.0, 14], [2.6, 18], [0, 37]], { seg: 6 });
        m.color(wood); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; m.limb(Math.sin(a) * 3.5, 0.6, Math.cos(a) * 3.5, Math.sin(a + 1.2) * 0.4, 36, Math.cos(a + 1.2) * 0.4, 0.16, 0.12, { seg: 3 }); }
        m.pop();
      }
      m.push(); m.tf(0, 12, 17.6, 0, Math.PI / 2, 0); m.color(dark); m.torus(0, 0, 0, 4, 0.5, { seg: 20, tseg: 5 });
      m.color('#ff4fd8', 0.85); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; m.color(BURNS_NEON[k % 7], 0.85); m.ball(Math.sin(a) * 2.4, 0, Math.cos(a) * 2.4, 1.05, { seg: 8, rings: 5, squash: 0.3 }); } m.color('#ffe24a', 0.9); m.ball(0, 0, 0, 1.2, { seg: 8, rings: 5 }); m.emissive(0); m.pop();
    });
    this.obstacle(A.name, A.x, 0, A.z, A.x, 17, A.z, 10);
    for (const sd of [1, -1]) { const c = Math.cos(0.25), s = Math.sin(0.25), lx = sd * 6.5, lz = 17; this.obstacle('a spire', A.x + lx * c + lz * s, 0, A.z - lx * s + lz * c, A.x + lx * c + lz * s, 37, A.z - lx * s + lz * c, 3.2); }
  },
  art_shrooms(api, g, A) {
    const R = mulberry32(4242), caps = ['#9a6bff', '#38f2ff', '#ff4fd8', '#7aff5a', '#ff7a2a'];
    for (let k = 0; k < 9; k++) {
      const a = k / 9 * TAU + R() * 0.5, d = k === 0 ? 0 : 9 + R() * 14, x = A.x + Math.sin(a) * d, z = A.z + Math.cos(a) * d, h = k === 0 ? 19 : 6 + R() * 10, cr = h * (0.45 + R() * 0.15), col = caps[k % caps.length];
      this.put('art:shrooms', x, 0, z, R() * TAU, 1, m => {
        m.color('#f0e8dc').shine(1); m.lathe([[h * 0.13, 0], [h * 0.11, h * 0.15], [h * 0.08, h * 0.6], [h * 0.1, h * 0.92]], { seg: 10 });
        m.color(col, 0.55).shine(2); m.ellipsoid(0, h * 0.9, 0, cr, cr * 0.55, cr, { phi1: Math.PI / 2, seg: 16, rings: 6 });
        m.color(shade(col, -0.35), 0.2); m.ellipsoid(0, h * 0.9, 0, cr * 0.98, cr * 0.12, cr * 0.98, { phi0: Math.PI / 2, phi1: Math.PI * 0.62, seg: 16, rings: 2 });
        m.color('#ffffff', 0.9); for (let s = 0; s < 6; s++) { const b = s / 6 * TAU + R(), rr = cr * (0.35 + R() * 0.45); m.ball(Math.sin(b) * rr, h * 0.9 + Math.sqrt(Math.max(0, 1 - (rr / cr) * (rr / cr))) * cr * 0.55, Math.cos(b) * rr, cr * 0.09, { seg: 6, rings: 4 }); }
        m.emissive(0).shine(0);
      });
      this.obstacle('a glowshroom', x, 0, z, x, h * 0.95, z, k === 0 ? cr * 0.8 : cr * 0.7);
    }
  },
  /* hot art for thermals: fire sculptures with a column of warm air */
  hotArt(api, g, x, z, name, lift, r) {
    this.put('hot', x, 0, z, 0, 1, m => {
      m.color('#3a3a44').shine(2); m.roundCyl(0, 0, 0, 3.2, 1.2, 0.3, { seg: 12 });
      m.color('#6a4a3a'); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; m.limb(0, 1.2, 0, Math.sin(a) * 4.2, 9 + (k % 2) * 3, Math.cos(a) * 4.2, 0.45, 0.2, { seg: 6 }); }
      m.color('#ff7a2a', 0.9); m.ball(0, 2, 0, 1.6, { seg: 8, rings: 5 }); m.emissive(0).shine(0);
    });
    api.fire(x, 1.6, z, 1.1);
    api.light(x, z, 16, '#ff8a3a', 0.6);
    this.hot.push({ x, z, name });
    return this.thermal(x, z, r || 11, lift || 7, 460, name);
  },
  /* art cars cruising the inner playa and the Esplanade (original designs, low detail, one shared draw) */
  artCars(api, g) {
    const designs = {
      duck(m) { m.color('#ffe24a').shine(2); m.ellipsoid(0, 2.2, -0.5, 2.6, 1.6, 3.6, { seg: 12, rings: 7 }); m.ball(0, 4.6, 2.0, 1.5, { seg: 12, rings: 8 }); m.color('#ff7a1a'); m.ellipsoid(0, 4.4, 3.6, 0.8, 0.3, 0.7, { seg: 8, rings: 4 }); m.color('#1a1a1e'); m.ball(0.7, 5.0, 3.1, 0.18, { seg: 6, rings: 4 }); m.ball(-0.7, 5.0, 3.1, 0.18, { seg: 6, rings: 4 }); },
      snail(m) { m.color('#7ae85a').shine(1); m.roundBox(0, 0.9, 0, 2.4, 1.2, 7, 0.5); m.limb(0, 1.4, 3.2, 0, 3.6, 3.8, 0.6, 0.45, { seg: 8 }); m.color('#9a6bff', 0.5); m.push(); m.tf(0, 3.4, -0.6, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 1.8, 0.9, { seg: 14, tseg: 8 }); m.pop(); m.emissive(0); m.color('#ff4fd8', 1); m.ball(0.4, 4.3, 4.0, 0.2, { seg: 6, rings: 4 }); m.ball(-0.4, 4.3, 4.0, 0.2, { seg: 6, rings: 4 }); m.emissive(0); },
      dragon(m) { m.color('#c83a3a').shine(2); m.roundBox(0, 1.6, 0, 3.0, 2.4, 9, 0.6); m.color('#ffd84a'); for (let k = 0; k < 6; k++) m.cyl(0, 2.8, -3.5 + k * 1.4, 0.5, 0, 1.2, 4, {}); m.color('#a82a2a'); m.limb(0, 2.6, 4.2, 0, 4.6, 6.0, 1.2, 0.9, { seg: 10 }); m.color('#ffe24a', 1); m.ball(0.5, 5.0, 6.4, 0.25, { seg: 6, rings: 4 }); m.ball(-0.5, 5.0, 6.4, 0.25, { seg: 6, rings: 4 }); m.emissive(0); },
      disco(m) { m.color('#3a3a44'); m.roundBox(0, 0.8, 0, 3.2, 1.2, 6, 0.4); m.color('#d8e0f0', 0.35).shine(3); m.ball(0, 3.8, 0, 2.4, { seg: 14, rings: 10 }); m.emissive(0).shine(0); },
      cupcake(m) { m.color('#f4e8d0'); m.lathe([[2.6, 0.4], [3.0, 2.2], [3.1, 2.4]], { seg: 14 }); m.color('#ff9ad0').shine(1); m.lathe([[3.2, 2.4], [3.0, 3.4], [2.0, 4.6], [0.8, 5.4], [0, 5.6]], { seg: 14 }); m.color('#ff3b5c', 0.4); m.ball(0, 5.9, 0, 0.6, { seg: 8, rings: 5 }); m.emissive(0); },
      bus(m) { m.color('#38c8ff').shine(2); m.roundBox(0, 2.0, 0, 2.6, 2.8, 10, 0.5); m.color('#ff4fd8'); m.roundBox(0, 3.6, 0, 2.7, 0.3, 10.1, 0.12); m.color('#1c2a46', 0.1).shine(3); for (const sd of [1, -1]) m.roundBox(sd * 1.31, 2.5, 0, 0.05, 0.8, 8, 0.05); m.emissive(0); m.color('#ffe24a', 1); for (let k = 0; k < 6; k++) m.ball(0, 4.0, -4 + k * 1.6, 0.25, { seg: 6, rings: 4 }); m.emissive(0); }
    };
    const cars = [];
    const add = (kind, path, speed, ph) => {
      const mv = api.mover(m => { m.color('#1a1a1e'); for (const [x, z] of [[1.2, 2.4], [-1.2, 2.4], [1.2, -2.4], [-1.2, -2.4]]) { m.push(); m.tf(x, 0.45, z, 0, 0, Math.PI / 2); m.roundCyl(0, -0.2, 0, 0.45, 0.4, 0.1, { seg: 8 }); m.pop(); } designs[kind](m); m.color(BURNS_NEON[cars.length % 7], 1); m.torus(0, 0.25, 0, 3.0, 0.08, { seg: 16, tseg: 3 }); m.emissive(0).shine(0); return { cols: [] }; });
      mv.noCollide = true; cars.push({ mv, path, speed, ph });
    };
    const ring = (r, h0, h1) => t => { const h = lerp(h0, h1, t); const a = bw14Clock(h, r); return [a.x, a.z]; };
    add('duck', ring(80, 0, 12), 0.012, 0.0);
    add('snail', ring(105, 0, 12), -0.006, 0.4);
    add('dragon', ring(62, 0, 12), 0.016, 0.7);
    add('disco', t => { const h = 2.2 + (Math.sin(t * TAU) * 0.5 + 0.5) * 7.6, a = bw14Clock(h, 146); return [a.x, a.z]; }, 0.01, 0.2);
    add('cupcake', t => { const h = 2.2 + (Math.sin(t * TAU + 2) * 0.5 + 0.5) * 7.6, a = bw14Clock(h, 146); return [a.x, a.z]; }, 0.008, 0.5);
    add('bus', t => [Math.sin(t * TAU) * 160, -260 + Math.cos(t * TAU) * 110], 0.01, 0.1);
    api.update((g2, dt) => {
      const T = g2.time;
      for (const c of cars) { const t = ((T * c.speed + c.ph) % 1 + 1) % 1, p = c.path(t), q = c.path((t + 0.002) % 1); c.mv.x = p[0]; c.mv.z = p[1]; c.mv.y = 0; c.mv.yaw = Math.atan2(q[0] - p[0], q[1] - p[1]) + (c.speed < 0 ? Math.PI : 0); }
    });
    return cars;
  },
  /* the Man on his pavilion, Chinka in his hand (her beacon shows from anywhere) */
  man(api, g) {
    api.prop('saucer', { x: 0, z: 0, r: 16, h: 5 });
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; api.fire(Math.sin(a) * 26, 0.4, Math.cos(a) * 26, 0.6); api.box(Math.sin(a) * 26, 0, Math.cos(a) * 26, 0.9, 0.5, 0.9, '#3a3a44', { noCol: true }); }
    api.light(0, 0, 40, '#ff6ad0', 0.4);
    let man = null;
    try {
      man = new BurnsManBoss(g, { x: 0, z: 0, y: 5.5, yaw: 0.7, scale: 1.25, hp: 3, holdChinka: true, attacks: ['stomp'], name: 'THE MAN' });
      man.y = 5.5; g.addBoss(man);
    } catch (e) { man = null; }
    this.obstacle('the Man', 0, 0, 0, 0, 24, 0, 7);
    this.obstacle('the pavilion', 0, 0, 0, 0, 5.5, 0, 16.5);
    return man;
  }
};
