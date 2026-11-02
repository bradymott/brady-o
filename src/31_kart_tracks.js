/* ============================================================
   ART CAR KART — track definitions and track painting
   (ground albedo, light map, road / barrier textures, sky band,
   prop placement). Everything here runs at race load time.
   ============================================================ */

// points along a circular arc (degrees; z points down the map, so angles run clockwise)
function kartArc(cx, cz, r, a0, a1, step, w) {
  const out = [], n = Math.max(1, Math.round(Math.abs(a1 - a0) / step));
  for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; out.push(w ? [cx + Math.cos(a) * r, cz + Math.sin(a) * r, w] : [cx + Math.cos(a) * r, cz + Math.sin(a) * r]); }
  return out;
}
// closed polyline with rounded (filleted) corners: true circular arcs of radius r
function kartFillet(poly, r, w) {
  const out = [], n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[(i - 1 + n) % n], c = poly[i], q = poly[(i + 1) % n];
    const ax = p[0] - c[0], az = p[1] - c[1], bx = q[0] - c[0], bz = q[1] - c[1];
    const la = Math.hypot(ax, az), lb = Math.hypot(bx, bz);
    const ux = ax / la, uz = az / la, vx = bx / lb, vz = bz / lb;
    const ang = Math.acos(clamp(ux * vx + uz * vz, -1, 1));
    let rr0 = c[2] || r, t = rr0 / Math.tan(ang / 2);
    const tmax = Math.min(la, lb) * 0.48;
    if (t > tmax) { t = tmax; rr0 = t * Math.tan(ang / 2); }
    const sx = c[0] + ux * t, sz = c[1] + uz * t, ex = c[0] + vx * t, ez = c[1] + vz * t;
    const hx = ux + vx, hz = uz + vz, hl = Math.hypot(hx, hz) || 1, dC = rr0 / Math.sin(ang / 2);
    const cx = c[0] + hx / hl * dC, cz = c[1] + hz / hl * dC;
    const a0 = Math.atan2(sz - cz, sx - cx);
    let da = Math.atan2(ez - cz, ex - cx) - a0;
    while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
    const steps = Math.max(2, Math.ceil(Math.abs(da) * rr0 / 7));
    for (let k = 0; k <= steps; k++) { const a = a0 + da * k / steps; out.push(w ? [cx + Math.cos(a) * rr0, cz + Math.sin(a) * rr0, w] : [cx + Math.cos(a) * rr0, cz + Math.sin(a) * rr0]); }
  }
  return out;
}
function kartPolar(cx, cz, fn, step) {
  const out = [];
  for (let a = 0; a < 360; a += step) { const r = fn(a * Math.PI / 180); const t = a * Math.PI / 180; out.push([cx + Math.cos(t) * r, cz + Math.sin(t) * r]); }
  return out;
}

const KART_TRACKS = {
  esplanade: {
    id: 'esplanade', name: 'Esplanade Loop', cup: 'dust', tod: 'night', music: 'kart1', width: 17, shoulder: 7,
    blurb: 'Neon camps line the inner ring street',
    pts: [].concat(
      kartArc(0, 0, 150, 90, 220, 13).map(([x, z], i) => [x * (1 + 0.05 * Math.sin(i * 1.3)), z * (1 + 0.05 * Math.sin(i * 1.3))]),
      [[-80, -136], [-40, -116], [0, -138], [40, -116], [80, -136]],
      kartArc(0, 0, 150, 320, 437, 13).slice(0, -1).map(([x, z], i) => [x * (1 + 0.05 * Math.sin(i * 1.7 + 1)), z * (1 + 0.05 * Math.sin(i * 1.7 + 1))])
    )
  },
  gateroad: {
    id: 'gateroad', name: 'Gate Road Grind', cup: 'dust', tod: 'sunset', music: 'kart2', width: 16, shoulder: 10,
    blurb: 'Long straights, slow dust shoulders',
    pts: [].concat(
      [[0, 0], [100, 0], [190, 0]],
      kartArc(215, 62, 62, -66, 66, 22),
      [[190, 124], [140, 124], [104, 112], [70, 134], [30, 122], [-60, 124], [-150, 124], [-190, 124]],
      kartArc(-215, 62, 62, 114, 246, 22),
      [[-190, 0], [-100, 0]]
    )
  },
  deepplaya: {
    id: 'deepplaya', name: 'Deep Playa Dash', cup: 'dust', tod: 'night', music: 'kart3', width: 19, shoulder: 8,
    blurb: 'Weave between giant glowing sculptures',
    pts: [[0, 0], [80, -12], [150, 6], [205, 58], [200, 130], [146, 170], [86, 150], [40, 196], [-30, 214], [-104, 184], [-150, 120], [-214, 74], [-206, 0], [-136, -40], [-62, -26]]
  },
  temple: {
    id: 'temple', name: 'Temple Run', cup: 'dust', tod: 'dawn', music: 'kart4', width: 17, shoulder: 8,
    blurb: 'Loop the wooden temple at sunrise',
    pts: kartFillet([[-30, 182], [110, 160], [178, 62], [152, -62], [62, -152], [-62, -162], [-158, -92], [-66, -36], [-58, 34], [4, 66], [-12, 124]], 34)
  },
  reno: {
    id: 'reno', name: 'Reno Neon Strip', cup: 'fire', tod: 'night', music: 'kart1', width: 15, shoulder: 4, surface: 'asphalt',
    blurb: 'Casino neon and tight city corners',
    pts: kartFillet([[0, 100], [0, -160], [110, -160], [110, -60], [205, -60], [205, 165], [92, 165], [92, 100]], 26)
  },
  hotsprings: {
    id: 'hotsprings', name: 'Hot Springs Hairpin', cup: 'fire', tod: 'day', music: 'kart2', width: 16, shoulder: 6, surface: 'gravel',
    blurb: 'Steaming pools slow you down',
    pts: kartFillet([[-100, 0], [96, 0], [96, 74], [-62, 74], [-62, 148], [104, 148], [146, 206], [-150, 206], [-150, 0]], 36)
  },
  duststorm: {
    id: 'duststorm', name: 'Dust Storm Derby', cup: 'fire', tod: 'day', music: 'kart3', width: 19, shoulder: 11,
    blurb: 'Whiteouts roll in without warning',
    pts: [[0, 0], [110, -22], [205, 14], [244, 100], [190, 178], [104, 186], [34, 124], [-40, 180], [-138, 190], [-220, 126], [-232, 32], [-158, -28], [-74, -20]]
  },
  manburn: {
    id: 'manburn', name: 'The Man Burn Circuit', cup: 'fire', tod: 'night', music: 'kart4', width: 17, shoulder: 7,
    blurb: 'Race around the burning Man',
    pts: [[-46, 236], [-36, 160], [-50, 86], [-68, 18], [-46, -48], [16, -70], [66, -30], [62, 36], [44, 96], [56, 166], [46, 236], [96, 304], [40, 366], [-62, 356], [-104, 296]]
  }
};
const KART_TRACK_ORDER = ['esplanade', 'gateroad', 'deepplaya', 'temple', 'reno', 'hotsprings', 'duststorm', 'manburn'];

/* ---------------- time of day palettes ---------------- */
const KART_TOD = {
  night: { zen: '#03041a', hor: '#2b1d50', gnd: '#0b0a18', sunAz: 140, sunEl: 34, sunCol: '#cfd9ff', sunR: 0.99945, stars: 1, amb: [0.42, 0.42, 0.66], fog: '#1c1636', fogD: 0.0042, glow: 1, haze: 0.25, shadow: 0.28, mtn: ['#2a2350', '#16122c'], label: 'NIGHT' },
  sunset: { zen: '#2a2a70', hor: '#ff9258', gnd: '#4a2e34', sunAz: -96, sunEl: 5, sunCol: '#ffae66', sunR: 0.99935, stars: 0, amb: [1.02, 0.8, 0.68], fog: '#eaa07c', fogD: 0.0030, glow: 0.5, haze: 0.5, shadow: 0.36, mtn: ['#9a5a7a', '#5a3058'], label: 'SUNSET' },
  dawn: { zen: '#3a4c96', hor: '#ffc2a0', gnd: '#5a4a56', sunAz: 70, sunEl: 7, sunCol: '#ffd2a0', sunR: 0.99935, stars: 0.25, amb: [0.94, 0.85, 0.9], fog: '#e8bdb6', fogD: 0.0030, glow: 0.45, haze: 0.5, shadow: 0.32, mtn: ['#a07a9a', '#6a5078'], label: 'DAWN' },
  day: { zen: '#2c7ae0', hor: '#d4e8f4', gnd: '#c8b898', sunAz: 30, sunEl: 58, sunCol: '#fff6dc', sunR: 0.9994, stars: 0, amb: [1.08, 1.04, 0.98], fog: '#e6dccb', fogD: 0.0026, glow: 0.2, haze: 0.55, shadow: 0.4, mtn: ['#9aa6c0', '#7a86a6'], label: 'DAY' }
};
const KART_SURF = {
  playa: { base: '#d6c4a0', light: '#e6d6b6', dark: '#bfa880', dust: '#e8dbbd', bed: '#c4ab80', road: '#c9ae82', rut: '#a88e66', detail: 0.8, roadDetail: 0.3 },
  gravel: { base: '#c2ad8a', light: '#d6c4a2', dark: '#a8916c', dust: '#d8c8a6', bed: '#9e8a6c', road: '#a38d70', rut: '#86725a', detail: 0.85, roadDetail: 0.45 },
  asphalt: { base: '#8c8478', light: '#a09888', dark: '#6e675e', dust: '#9a9284', bed: '#3a3840', road: '#3e3c46', rut: '#34323a', detail: 0.35, roadDetail: 0.15 }
};

/* ---------------- track painting ---------------- */
const KartPaint = {
  _detail: null,
  // tileable cracked-playa detail texture (centred on mid grey)
  detail() {
    if (this._detail) return this._detail;
    const S = 512, c = makeCanvas(S, S), x = c.getContext('2d');
    const img = x.createImageData(S, S), d = img.data;
    const G = 14, cell = S / G, rng = mulberry32(77), pts = [], tint = [];
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { pts.push([(i + 0.1 + rng() * 0.8) * cell, (j + 0.1 + rng() * 0.8) * cell]); tint.push(0.95 + rng() * 0.09); }
    const nz = new Float32Array(S * S); for (let i = 0; i < nz.length; i++) nz[i] = rng();
    for (let y = 0; y < S; y++) for (let xx = 0; xx < S; xx++) {
      const ci = Math.floor(xx / cell), cj = Math.floor(y / cell);
      let d1 = 1e9, d2 = 1e9, k1 = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const cx = ci + di, cy = cj + dj, wx = cx < 0 ? cx + G : cx >= G ? cx - G : cx, wy = cy < 0 ? cy + G : cy >= G ? cy - G : cy;
        const p = pts[wy * G + wx], ex = xx - p[0] - (cx - wx) * cell, ey = y - p[1] - (cy - wy) * cell;
        const dd = ex * ex + ey * ey;
        if (dd < d1) { d2 = d1; d1 = dd; k1 = wy * G + wx; } else if (dd < d2) d2 = dd;
      }
      d1 = Math.sqrt(d1); d2 = Math.sqrt(d2);
      const e = d2 - d1;
      const crack = 1 - clamp(e / 2.4, 0, 1);
      const lip = clamp(1 - Math.abs(e - 3.5) / 2, 0, 1) * 0.05;
      const dome = 1 - (d1 / cell) * 0.1;
      const n = (nz[y * S + xx] - 0.5) * 0.1 + (nz[((y >> 1) * S + (xx >> 1)) % (S * S)] - 0.5) * 0.06;
      const v = clamp(tint[k1] * dome * (1 - crack * 0.3) + lip + n, 0, 2) * 0.5;
      const o = (y * S + xx) * 4;
      d[o] = clamp(v * 262, 0, 255); d[o + 1] = clamp(v * 255, 0, 255); d[o + 2] = clamp(v * 246, 0, 255); d[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return (this._detail = c);
  },
  ringPath(x, T, offA, offB, tx, tz) {
    // closed strip between lateral offsets offA(i) (left, negative) and offB(i) (right, positive), even-odd ring
    x.beginPath();
    for (let i = 0; i < T.N; i += 2) { const o = offA(i), px = tx(T.X[i] + T.NX[i] * o), pz = tz(T.Z[i] + T.NZ[i] * o); i ? x.lineTo(px, pz) : x.moveTo(px, pz); }
    x.closePath();
    for (let i = 0; i < T.N; i += 2) { const o = offB(i), px = tx(T.X[i] + T.NX[i] * o), pz = tz(T.Z[i] + T.NZ[i] * o); i ? x.lineTo(px, pz) : x.moveTo(px, pz); }
    x.closePath();
  },
  linePath(x, T, off, tx, tz) {
    x.beginPath();
    for (let i = 0; i <= T.N; i += 2) { const j = i % T.N, o = off(j), px = tx(T.X[j] + T.NX[j] * o), pz = tz(T.Z[j] + T.NZ[j] * o); i ? x.lineTo(px, pz) : x.moveTo(px, pz); }
  },
  ground(T, R) {
    const S = 2048, c = makeCanvas(S, S), x = c.getContext('2d');
    const M = T.map, k = S / M.size, sf = R.surf, rng = mulberry32(hashStr(T.id) ^ 0x5151);
    const tx = wx => (wx - M.x) * k, tz = wz => (wz - M.z) * k;
    x.fillStyle = sf.base; x.fillRect(0, 0, S, S);
    // big soft colour variation
    for (let i = 0; i < 120; i++) {
      const px = rng() * S, py = rng() * S, r = 30 + rng() * 240;
      const g = x.createRadialGradient(px, py, 0, px, py, r);
      const col = rng() < 0.5 ? sf.light : sf.dark;
      g.addColorStop(0, rgba(col, 0.18 + rng() * 0.25)); g.addColorStop(1, rgba(col, 0));
      x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
    }
    // tyre and bike tracks wandering across the playa
    x.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      let px = rng() * S, py = rng() * S, a = rng() * TAU;
      x.strokeStyle = rgba(sf.dark, 0.1 + rng() * 0.12); x.lineWidth = 0.8 + rng() * 2.2;
      x.beginPath(); x.moveTo(px, py);
      const seg = 6 + Math.floor(rng() * 12);
      for (let s2 = 0; s2 < seg; s2++) { a += (rng() - 0.5) * 0.6; px += Math.cos(a) * 40; py += Math.sin(a) * 40; x.lineTo(px, py); }
      x.stroke();
    }
    if (R.paintBase) R.paintBase(x, tx, tz, k, rng);
    // soft dust shoulders out to the barriers
    this.ringPath(x, T, i => -T.WL[i] - 1.5, i => T.WR[i] + 1.5, tx, tz);
    x.fillStyle = sf.dust; x.fill('evenodd');
    // ripples in the shoulder dust
    x.lineWidth = Math.max(1, k * 0.35);
    for (let r = 0; r < 7; r++) {
      const f = (r + 0.5) / 7;
      x.strokeStyle = rgba(r % 2 ? sf.light : sf.dark, 0.22);
      x.setLineDash([k * (2 + rng() * 6), k * (1 + rng() * 4)]);
      this.linePath(x, T, i => -(T.HW[i] + (T.WL[i] - T.HW[i]) * f), tx, tz); x.stroke();
      this.linePath(x, T, i => T.HW[i] + (T.WR[i] - T.HW[i]) * f, tx, tz); x.stroke();
    }
    x.setLineDash([]);
    // contact shadow along barriers
    x.strokeStyle = 'rgba(40,24,10,0.22)'; x.lineWidth = k * 1.6;
    this.linePath(x, T, i => -T.WL[i] - 0.6, tx, tz); x.stroke();
    this.linePath(x, T, i => T.WR[i] + 0.6, tx, tz); x.stroke();
    // road bed (under the road mesh, shows through at the very edge)
    this.ringPath(x, T, i => -T.HW[i] - 0.5, i => T.HW[i] + 0.5, tx, tz);
    x.fillStyle = sf.bed; x.fill('evenodd');
    if (R.paintGround) R.paintGround(x, tx, tz, k, rng);
    return c;
  },
  lightmap(T, R) {
    const S = 512, c = makeCanvas(S, S), x = c.getContext('2d');
    const M = T.map, k = S / M.size;
    x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
    x.globalCompositeOperation = 'lighter';
    for (const L of R.lights) {
      const px = (L.x - M.x) * k, py = (L.z - M.z) * k, r = Math.max(2, L.r * k);
      const g = x.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, rgba(L.col, Math.min(1, L.i * 1.3))); g.addColorStop(0.35, rgba(L.col, L.i * 0.6)); g.addColorStop(1, rgba(L.col, 0));
      x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
    }
    return c;
  },
  // road texture: u across the road, v along it. alpha = emissive mask
  road(R) {
    const W = 256, H = 512, c = makeCanvas(W, H), x = c.getContext('2d'), e = makeCanvas(W, H), ex = e.getContext('2d');
    const sf = R.surf, rng = mulberry32(991);
    ex.fillStyle = '#000'; ex.fillRect(0, 0, W, H);
    x.fillStyle = sf.road; x.fillRect(0, 0, W, H);
    // grain
    for (let i = 0; i < 2600; i++) { x.fillStyle = rgba(rng() < 0.5 ? sf.dark : sf.light, 0.08 + rng() * 0.12); const s = 1 + rng() * 3; x.fillRect(rng() * W, rng() * H, s, s * (1 + rng() * 2)); }
    // tyre ruts (compacted lines)
    for (const u of [0.3, 0.38, 0.62, 0.7]) {
      const g = x.createLinearGradient(u * W - 10, 0, u * W + 10, 0);
      g.addColorStop(0, rgba(sf.rut, 0)); g.addColorStop(0.5, rgba(sf.rut, 0.32)); g.addColorStop(1, rgba(sf.rut, 0));
      x.fillStyle = g; x.fillRect(u * W - 10, 0, 20, H);
    }
    if (R.roadStyle === 'asphalt') {
      // patched asphalt + lane markings
      for (let i = 0; i < 14; i++) { x.fillStyle = rgba(i % 2 ? '#2e2c34' : '#4a4852', 0.5); x.fillRect(rng() * W, rng() * H, 20 + rng() * 60, 10 + rng() * 50); }
      x.fillStyle = '#ffd84a'; for (let v = 0; v < H; v += 128) x.fillRect(W / 2 - 3, v + 16, 6, 64);
      x.fillStyle = '#f2f2f2'; x.fillRect(10, 0, 5, H); x.fillRect(W - 15, 0, 5, H);
    }
    // painted / lit edges
    const e1 = R.edge[0], e2 = R.edge[1], n = 4, seg = H / n;
    for (let i = 0; i < n; i++) {
      const col = i % 2 ? e2 : e1;
      x.fillStyle = col; x.fillRect(0, i * seg, 9, seg); x.fillRect(W - 9, i * seg, 9, seg);
      if (R.edgeGlow) { ex.fillStyle = i % 2 ? '#ffffff' : '#bbbbbb'; ex.fillRect(0, i * seg, 9, seg); ex.fillRect(W - 9, i * seg, 9, seg); }
    }
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(9, 0, 2, H); x.fillRect(W - 11, 0, 2, H);
    return this.packEmissive(c, e);
  },
  // barrier texture: u along (repeats), v down from the top edge. alpha = emissive mask
  wall(R) {
    const W = 512, H = 128, c = makeCanvas(W, H), x = c.getContext('2d'), e = makeCanvas(W, H), ex = e.getContext('2d');
    ex.fillStyle = '#000'; ex.fillRect(0, 0, W, H);
    const rng = mulberry32(31337), st = R.wall;
    if (st === 'hay') {
      for (let b = 0; b < 4; b++) {
        const bx = b * 128;
        const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f2d27a'); g.addColorStop(0.5, '#d8b050'); g.addColorStop(1, '#8a6a2a');
        x.fillStyle = g; rr(x, bx + 2, 4, 124, H - 6, 10); x.fill();
        x.strokeStyle = 'rgba(120,80,20,0.6)'; x.lineWidth = 2;
        for (let i = 0; i < 40; i++) { const sx = bx + 6 + rng() * 116, sy = 8 + rng() * (H - 20); x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + (rng() - 0.5) * 14, sy + 4 + rng() * 8); x.stroke(); }
        x.fillStyle = '#7a4a1a'; x.fillRect(bx + 30, 4, 4, H - 6); x.fillRect(bx + 94, 4, 4, H - 6);
      }
    } else if (st === 'rock') {
      x.fillStyle = '#6a5a4a'; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 26; i++) {
        const rx = (i / 26) * W + rng() * 10, ry = 10 + rng() * 40, rw = 30 + rng() * 30, rh = H - ry;
        const g = x.createLinearGradient(0, ry, 0, H); g.addColorStop(0, '#b8a48a'); g.addColorStop(1, '#5a4a3c');
        x.fillStyle = g; x.beginPath(); x.ellipse(rx, ry + rh * 0.6, rw * 0.6, rh * 0.7, 0, 0, TAU); x.fill();
        x.strokeStyle = 'rgba(40,30,20,0.5)'; x.lineWidth = 2; x.stroke();
      }
      x.fillRect(0, 0, 0, 0);
    } else if (st === 'jersey') {
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#d8d6dc'); g.addColorStop(0.55, '#a6a4ae'); g.addColorStop(1, '#5a5866');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < 4; i++) x.fillRect(i * 128, 0, 3, H);
      const nc = R.neon || ['#ff4fd8', '#38f2ff'];
      for (let i = 0; i < 4; i++) { x.fillStyle = nc[i % nc.length]; x.fillRect(i * 128, 26, 128, 12); ex.fillStyle = '#fff'; ex.fillRect(i * 128, 26, 128, 12); }
    } else { // 'led': black padded barrier with an LED strip
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a3448'); g.addColorStop(0.5, '#1c1826'); g.addColorStop(1, '#0c0a12');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 8; i++) x.fillRect(i * 64, 0, 2, H);
      const nc = R.neon || ['#ff4fd8', '#38f2ff', '#ffd84a', '#7aff8a'];
      for (let i = 0; i < 32; i++) {
        const col = nc[i % nc.length], lx = i * 16 + 8;
        x.fillStyle = col; x.beginPath(); x.arc(lx, 30, 5, 0, TAU); x.fill();
        ex.fillStyle = '#fff'; ex.beginPath(); ex.arc(lx, 30, 6, 0, TAU); ex.fill();
      }
      x.fillStyle = R.wallStripe || '#ff4fd8'; x.fillRect(0, H - 22, W, 6); ex.fillStyle = '#888'; ex.fillRect(0, H - 22, W, 6);
    }
    return this.packEmissive(c, e);
  },
  packEmissive(c, e) {
    const W = c.width, H = c.height;
    const a = c.getContext('2d').getImageData(0, 0, W, H), b = e.getContext('2d').getImageData(0, 0, W, H);
    const out = new Uint8Array(W * H * 4);
    for (let i = 0; i < out.length; i += 4) { out[i] = a.data[i]; out[i + 1] = a.data[i + 1]; out[i + 2] = a.data[i + 2]; out[i + 3] = b.data[i]; }
    return { width: W, height: H, data: out };
  },
  // panoramic horizon band: 360 degrees x [-1.5, 11] degrees elevation; premultiplied colours
  band(T, R) {
    const W = 4096, H = 256, c = makeCanvas(W, H), x = c.getContext('2d');
    const tod = R.tod, rng = mulberry32(hashStr(T.id) ^ 0xabc);
    const elToY = el => H - (el + 1.5) / 12.5 * H;
    const per = (amp, terms) => { const ph = []; for (let i = 0; i < terms; i++) ph.push([1 + Math.floor(rng() * (6 + i * 5)), rng() * TAU, amp / (1 + i * 0.9)]); return u => { let v = 0; for (const p of ph) v += Math.sin(u * TAU * p[0] + p[1]) * p[2]; return v; }; };
    const ridge = (base, amp, col, top, seed) => {
      const f = per(amp, 7);
      const g = x.createLinearGradient(0, elToY(base + amp * 1.6), 0, elToY(-1));
      g.addColorStop(0, top); g.addColorStop(1, col);
      x.fillStyle = g; x.beginPath(); x.moveTo(0, H);
      for (let i = 0; i <= W; i += 8) { const u = i / W; x.lineTo(i, elToY(Math.max(-0.5, base + Math.abs(f(u)) * 0.8 + f(u * 1.0) * 0.3))); }
      x.lineTo(W, H); x.closePath(); x.fill();
    };
    if (R.band) R.band(x, W, H, elToY, rng, ridge);
    else {
      ridge(1.6, 2.4, mix(tod.mtn[0], tod.fog, 0.45), mix(tod.mtn[0], tod.hor, 0.25));
      ridge(0.6, 1.5, mix(tod.mtn[1], tod.fog, 0.25), tod.mtn[1]);
    }
    // soft clouds for daylight skies
    if (tod.glow < 0.6) {
      for (let i = 0; i < 26; i++) {
        const cx = rng() * W, cy = elToY(4.5 + rng() * 6), w = 60 + rng() * 160, h = w * (0.18 + rng() * 0.1);
        for (let k = 0; k < 7; k++) {
          const px = cx + (rng() - 0.5) * w, py = cy + (rng() - 0.5) * h * 0.6, r = h * (0.4 + rng() * 0.5);
          const g = x.createRadialGradient(px, py - r * 0.2, 1, px, py, r);
          g.addColorStop(0, rgba(mix('#ffffff', tod.hor, 0.25), 0.55)); g.addColorStop(1, rgba(mix('#ffffff', tod.hor, 0.5), 0));
          x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
        }
      }
    }
    // the Man on the horizon (when not part of the track itself)
    if (R.manOnHorizon) {
      const u = (Math.atan2(R.manOnHorizon[0], -R.manOnHorizon[1]) / TAU + 0.5) * W, base = elToY(0.1);
      const s = 1.15;
      x.save(); x.translate(u, base); x.scale(s, s);
      if (tod.glow > 0.6) { x.shadowColor = '#38f2ff'; x.shadowBlur = 14; }
      x.strokeStyle = tod.glow > 0.6 ? '#7af6ff' : mix(tod.mtn[1], '#000000', 0.3); x.lineWidth = 2.2; x.lineCap = 'round';
      x.beginPath(); x.moveTo(-6, 0); x.lineTo(-3, -22); x.lineTo(-5, -38); x.lineTo(-16, -52); x.moveTo(6, 0); x.lineTo(3, -22); x.lineTo(5, -38); x.lineTo(16, -52);
      x.moveTo(-5, -38); x.lineTo(5, -38); x.moveTo(0, -38); x.lineTo(-4, -44); x.lineTo(0, -52); x.lineTo(4, -44); x.closePath(); x.stroke();
      x.restore();
    }
    // distant camp lights along the horizon at night
    if (tod.glow > 0.6 && !R.noCampLights) {
      x.globalCompositeOperation = 'lighter';
      const cols = ['#ff4fd8', '#38f2ff', '#ffd84a', '#7aff8a', '#ff8a3a'];
      for (let i = 0; i < 520; i++) {
        const px = rng() * W, py = elToY(-0.4 + rng() * 0.9), r = 0.6 + rng() * 1.6;
        x.fillStyle = rgba(cols[i % cols.length], 0.5 + rng() * 0.5); x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
      }
      x.globalCompositeOperation = 'source-over';
    }
    return c;
  }
};

/* ---------------- environment props: painted once into the shared atlas ---------------- */
// each def: w,h (px), mw (world width, m), ay (anchor fraction from top), n (variants), frames, draw(x,w,h,v,f), glow(x,w,h,v,f)
const KART_NEON = ['#ff4fd8', '#38f2ff', '#ffd84a', '#7aff8a', '#ff8a3a', '#b98aff'];
const kOut = (x, col, w) => { x.strokeStyle = col || 'rgba(26,14,30,0.75)'; x.lineWidth = w || 2; x.lineJoin = 'round'; x.stroke(); };
const kGrad = (x, x0, y0, x1, y1, a, b) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
function kNeonText(x, txt, cx, cy, size, col, glow) {
  x.font = `${size}px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (glow) { x.shadowColor = col; x.shadowBlur = size * 0.5; x.fillStyle = col; x.fillText(txt, cx, cy); x.shadowBlur = size * 0.2; x.fillStyle = '#ffffff'; x.fillText(txt, cx, cy); x.shadowBlur = 0; return; }
  x.lineWidth = size * 0.16; x.strokeStyle = shade(col, -0.35); x.strokeText(txt, cx, cy); x.fillStyle = mix(col, '#ffffff', 0.55); x.fillText(txt, cx, cy);
}
function kFigure(x, cx, by, s, col, skin, armsUp, hat, v) {
  // a festival-goer: chunky friendly silhouette with costume colours
  const sk = skin || '#d8a07a';
  x.lineCap = 'round';
  x.strokeStyle = '#2a2230'; x.lineWidth = 7 * s;
  x.beginPath(); x.moveTo(cx - 5 * s, by); x.lineTo(cx - 3 * s, by - 26 * s); x.moveTo(cx + 5 * s, by); x.lineTo(cx + 3 * s, by - 26 * s); x.stroke();
  x.strokeStyle = shade(col, -0.3); x.lineWidth = 6 * s;
  x.beginPath(); x.moveTo(cx - 5 * s, by - 2); x.lineTo(cx - 3 * s, by - 26 * s); x.moveTo(cx + 5 * s, by - 2); x.lineTo(cx + 3 * s, by - 26 * s); x.stroke();
  x.fillStyle = kGrad(x, cx - 10 * s, 0, cx + 10 * s, 0, shade(col, 0.25), shade(col, -0.25));
  x.beginPath(); x.moveTo(cx - 9 * s, by - 24 * s); x.lineTo(cx - 10 * s, by - 50 * s); x.quadraticCurveTo(cx, by - 56 * s, cx + 10 * s, by - 50 * s); x.lineTo(cx + 9 * s, by - 24 * s); x.closePath(); x.fill(); kOut(x, null, 1.6 * s);
  x.strokeStyle = sk; x.lineWidth = 5 * s;
  for (const sg of [-1, 1]) {
    x.beginPath(); x.moveTo(cx + sg * 9 * s, by - 48 * s);
    if (armsUp) { x.lineTo(cx + sg * 15 * s, by - 62 * s); x.lineTo(cx + sg * 13 * s, by - 76 * s); }
    else { x.lineTo(cx + sg * 15 * s, by - 38 * s); x.lineTo(cx + sg * 17 * s, by - 28 * s); }
    x.stroke();
  }
  x.fillStyle = sk; x.beginPath(); x.arc(cx, by - 62 * s, 8.5 * s, 0, TAU); x.fill(); kOut(x, null, 1.4 * s);
  if (hat === 1) { x.fillStyle = '#2a1a14'; x.beginPath(); x.ellipse(cx, by - 68 * s, 13 * s, 3.5 * s, 0, 0, TAU); x.fill(); x.fillRect(cx - 7 * s, by - 78 * s, 14 * s, 10 * s); }
  else if (hat === 2) { x.fillStyle = KART_NEON[v % 6]; x.beginPath(); x.arc(cx, by - 70 * s, 7 * s, Math.PI, TAU); x.fill(); x.fillRect(cx - 9 * s, by - 72 * s, 18 * s, 3 * s); }
  else if (hat === 3) { x.fillStyle = '#ffd84a'; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(cx - 8 * s + i * 4 * s, by - 70 * s, 2.6 * s, 0, TAU); x.fill(); } }
  else { x.fillStyle = shade(col, -0.5); x.beginPath(); x.arc(cx, by - 65 * s, 8.8 * s, Math.PI * 1.05, TAU * 0.99); x.fill(); }
  x.fillStyle = '#16121c'; x.fillRect(cx - 6 * s, by - 64 * s, 12 * s, 3 * s);
}
const KART_PROP_DEFS = {
  tent: { w: 128, h: 84, mw: 3.4, n: 4, draw(x, w, h, v) {
    const col = ['#ff6a4a', '#4ab8ff', '#ffd84a', '#8ad86a'][v], by = h - 4;
    x.beginPath(); x.moveTo(6, by); x.quadraticCurveTo(10, 8, w / 2, 6); x.quadraticCurveTo(w - 10, 8, w - 6, by); x.closePath();
    x.fillStyle = kGrad(x, 0, 6, 0, by, shade(col, 0.3), shade(col, -0.25)); x.fill(); kOut(x);
    x.strokeStyle = rgba(shade(col, -0.45), 0.6); x.lineWidth = 2; x.beginPath(); x.moveTo(w / 2, 6); x.quadraticCurveTo(w * 0.3, h * 0.4, 14, by); x.moveTo(w / 2, 6); x.quadraticCurveTo(w * 0.7, h * 0.4, w - 14, by); x.stroke();
    x.fillStyle = '#2a1e2a'; x.beginPath(); x.moveTo(w / 2 - 16, by); x.quadraticCurveTo(w / 2, h * 0.3, w / 2 + 16, by); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.25)'; x.beginPath(); x.ellipse(w * 0.36, h * 0.3, 14, 7, -0.5, 0, TAU); x.fill();
  } },
  dome: { w: 256, h: 150, mw: 10, n: 2, draw(x, w, h, v) {
    const by = h - 4, r = w * 0.46, cx = w / 2;
    x.beginPath(); x.arc(cx, by, r, Math.PI, TAU); x.closePath();
    x.fillStyle = kGrad(x, 0, by - r, 0, by, v ? '#f4f0ea' : '#d8dce8', v ? '#b8b0a8' : '#8a90a8'); x.fill(); kOut(x, null, 2.5);
    x.save(); x.clip(); x.strokeStyle = 'rgba(60,60,80,0.55)'; x.lineWidth = 2;
    for (let i = 1; i < 5; i++) { const yy = by - r * Math.sin(i / 5 * Math.PI / 2); const rr0 = r * Math.cos(i / 5 * Math.PI / 2); x.beginPath(); x.moveTo(cx - rr0, yy); x.lineTo(cx + rr0, yy); x.stroke(); }
    for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; x.beginPath(); x.moveTo(cx + Math.cos(a) * r, by + Math.sin(a) * r); x.lineTo(cx + Math.cos(a) * r * 0.25, by - r * 0.97 + (i % 2) * 6); x.stroke(); }
    x.restore();
    x.fillStyle = '#1a141e'; x.beginPath(); x.moveTo(cx - 18, by); x.lineTo(cx - 18, by - 34); x.quadraticCurveTo(cx, by - 46, cx + 18, by - 34); x.lineTo(cx + 18, by); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.3)'; x.beginPath(); x.ellipse(cx - r * 0.45, by - r * 0.6, 22, 10, -0.6, 0, TAU); x.fill();
  }, glow(x, w, h, v) {
    const by = h - 4, r = w * 0.46, cx = w / 2;
    for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI; const col = KART_NEON[(i + v) % 6]; x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 8; x.beginPath(); x.arc(cx + Math.cos(a) * r * 0.98, by + Math.sin(a) * r * 0.98, 3, 0, TAU); x.fill(); }
    x.fillStyle = 'rgba(255,120,220,0.5)'; x.shadowColor = '#ff4fd8'; x.shadowBlur = 14; x.beginPath(); x.moveTo(cx - 16, by); x.lineTo(cx - 16, by - 32); x.quadraticCurveTo(cx, by - 44, cx + 16, by - 32); x.lineTo(cx + 16, by); x.fill();
  } },
  shade: { w: 256, h: 140, mw: 11, n: 1, draw(x, w, h) {
    const by = h - 4;
    x.fillStyle = '#5a3a5a'; x.fillRect(w * 0.3, by - 22, w * 0.4, 18); x.fillStyle = '#8a4a7a'; x.fillRect(w * 0.3, by - 30, w * 0.4, 10);
    x.strokeStyle = '#8a8a96'; x.lineWidth = 4; for (const px of [16, w * 0.38, w * 0.62, w - 16]) { x.beginPath(); x.moveTo(px, by); x.lineTo(px, 34); x.stroke(); }
    x.beginPath(); x.moveTo(4, 40); x.lineTo(w / 2, 14); x.lineTo(w - 4, 40); x.lineTo(w - 4, 52); x.lineTo(4, 52); x.closePath();
    x.fillStyle = kGrad(x, 0, 14, 0, 52, '#e8eef4', '#a8b0bc'); x.fill(); kOut(x, null, 2);
    x.strokeStyle = 'rgba(80,90,110,0.35)'; x.lineWidth = 1; for (let i = 0; i < 24; i++) { x.beginPath(); x.moveTo(8 + i * 10.4, 52); x.lineTo(w / 2, 16); x.stroke(); }
    x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 1; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(20 + i * 28, by); x.lineTo(16 + i * 30, 52); x.stroke(); }
    x.fillStyle = '#ffd84a'; x.beginPath(); x.ellipse(w * 0.75, by - 8, 14, 6, 0, 0, TAU); x.fill();
  }, glow(x, w, h) {
    for (let i = 0; i < 16; i++) { const px = 10 + i * (w - 20) / 15, py = 52 + Math.sin(i / 15 * Math.PI) * 10; const col = KART_NEON[i % 6]; x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 8; x.beginPath(); x.arc(px, py, 3, 0, TAU); x.fill(); }
  } },
  potty: { w: 56, h: 120, mw: 1.3, n: 2, draw(x, w, h, v) {
    const col = v ? '#3a7ad8' : '#e8e4dc';
    x.fillStyle = kGrad(x, 4, 0, w - 4, 0, shade(col, 0.15), shade(col, -0.25)); rr(x, 4, 10, w - 8, h - 12, 4); x.fill(); kOut(x);
    x.fillStyle = shade(col, 0.25); rr(x, 2, 4, w - 4, 12, 5); x.fill(); kOut(x);
    x.fillStyle = shade(col, -0.15); x.fillRect(10, 26, w - 20, h - 36);
    x.fillStyle = '#ff4a4a'; x.fillRect(w - 18, 50, 6, 8); x.fillStyle = '#fff'; x.fillRect(16, 32, w - 32, 6);
  } },
  bike: { w: 128, h: 84, mw: 1.9, n: 2, draw(x, w, h, v) {
    const by = h - 4;
    x.strokeStyle = '#26222c'; x.lineWidth = 5; x.beginPath(); x.arc(30, by - 22, 20, 0, TAU); x.arc(98, by - 22, 20, 0, TAU); x.stroke();
    x.strokeStyle = v ? '#ff6a9a' : '#4ad8c8'; x.lineWidth = 4; x.lineCap = 'round';
    x.beginPath(); x.moveTo(30, by - 22); x.lineTo(56, by - 52); x.lineTo(90, by - 52); x.lineTo(98, by - 22); x.moveTo(56, by - 52); x.lineTo(64, by - 22); x.lineTo(30, by - 22); x.moveTo(90, by - 52); x.lineTo(84, by - 66); x.lineTo(96, by - 68); x.moveTo(56, by - 52); x.lineTo(52, by - 62); x.stroke();
    x.fillStyle = '#26222c'; x.fillRect(44, by - 66, 18, 5);
    x.fillStyle = '#ffd84a'; x.beginPath(); x.arc(30, by - 22, 4, 0, TAU); x.fill();
  }, glow(x, w, h, v) {
    const by = h - 4, col = KART_NEON[v * 2 % 6]; x.strokeStyle = col; x.shadowColor = col; x.shadowBlur = 8; x.lineWidth = 3;
    x.beginPath(); x.arc(30, by - 22, 19, 0, TAU); x.stroke(); x.beginPath(); x.arc(98, by - 22, 19, 0, TAU); x.stroke();
    x.beginPath(); x.moveTo(30, by - 22); x.lineTo(56, by - 52); x.lineTo(90, by - 52); x.lineTo(98, by - 22); x.stroke();
  } },
  burner: { w: 64, h: 128, mw: 0.95, n: 8, frames: 2, draw(x, w, h, v, f) {
    const cols = ['#ff4fd8', '#38c8ff', '#ffd84a', '#7ad86a', '#ff8a3a', '#b98aff', '#f4f0e8', '#ff4a5a'];
    const skins = ['#f0c8a8', '#c98a5a', '#8a5a3a', '#e0b090', '#5a3a2a', '#d8a07a', '#f4d0b8', '#a86a4a'];
    kFigure(x, w / 2, h - 4, 1.45, cols[v], skins[v], f === 1 || (v % 3 === 0 && f === 0 && false), v % 5, v);
    if (v % 2) { x.strokeStyle = KART_NEON[(v + 2) % 6]; x.lineWidth = 2.5; x.beginPath(); x.moveTo(w / 2 - 14, h - 82); x.quadraticCurveTo(w / 2, h - 70, w / 2 + 14, h - 82); x.stroke(); }
  }, glow(x, w, h, v) { if (v % 2) { const col = KART_NEON[(v + 2) % 6]; x.strokeStyle = col; x.shadowColor = col; x.shadowBlur = 8; x.lineWidth = 3; x.beginPath(); x.moveTo(w / 2 - 14, h - 82); x.quadraticCurveTo(w / 2, h - 70, w / 2 + 14, h - 82); x.stroke(); } } },
  lamp: { w: 48, h: 192, mw: 1.0, n: 1, draw(x, w, h) {
    x.fillStyle = '#4a3a2a'; x.fillRect(w / 2 - 3, 40, 6, h - 44);
    x.strokeStyle = '#4a3a2a'; x.lineWidth = 4; x.beginPath(); x.moveTo(w / 2, 42); x.quadraticCurveTo(w / 2, 22, w / 2 + 14, 24); x.stroke();
    x.fillStyle = '#2a2018'; x.fillRect(w / 2 + 6, 26, 16, 4); x.fillStyle = '#ffe2a0'; rr(x, w / 2 + 8, 30, 12, 18, 3); x.fill(); kOut(x, '#2a2018', 2);
  }, glow(x, w, h) { x.fillStyle = '#ffd88a'; x.shadowColor = '#ffb84a'; x.shadowBlur = 16; x.beginPath(); x.arc(w / 2 + 14, 39, 9, 0, TAU); x.fill(); } },
  barrel: { w: 64, h: 64, mw: 1.0, n: 1, draw(x, w, h) {
    x.fillStyle = kGrad(x, 8, 0, w - 8, 0, '#8a6a5a', '#3a2a24'); rr(x, 10, 16, w - 20, h - 18, 6); x.fill(); kOut(x);
    x.fillStyle = '#2a1a14'; x.beginPath(); x.ellipse(w / 2, 17, w / 2 - 10, 6, 0, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.4)'; x.lineWidth = 2; x.beginPath(); x.moveTo(10, 30); x.lineTo(w - 10, 30); x.moveTo(10, 46); x.lineTo(w - 10, 46); x.stroke();
    x.fillStyle = '#ff8a2a'; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(18 + i * 9, 34 + (i % 2) * 8, 2, 0, TAU); x.fill(); }
  } },
  neon: { w: 256, h: 160, mw: 6.5, n: 11, draw(x, w, h, v) {
    const T = ["BRADY'S BAR", 'CAMP SNOOZE', 'FREE HUGS', 'DISCO DOME', 'PANCAKES', 'LUCKY 7', 'SLOTS', 'JACKPOT', 'BUFFET', 'CHAPEL', 'OPEN 24/7'][v];
    const col = KART_NEON[v % 6];
    x.fillStyle = '#2a2430'; x.fillRect(w / 2 - 5, 90, 10, h - 92); x.fillRect(w * 0.25 - 4, 90, 8, h - 92); x.fillRect(w * 0.75 - 4, 90, 8, h - 92);
    x.fillStyle = kGrad(x, 0, 6, 0, 92, '#2a2238', '#120e1a'); rr(x, 6, 6, w - 12, 86, 14); x.fill(); kOut(x, shade(col, -0.3), 3);
    x.strokeStyle = rgba(col, 0.7); x.lineWidth = 3; rr(x, 13, 13, w - 26, 72, 10); x.stroke();
    kNeonText(x, T, w / 2, 50, T.length > 9 ? 26 : 32, col, false);
  }, glow(x, w, h, v) {
    const T = ["BRADY'S BAR", 'CAMP SNOOZE', 'FREE HUGS', 'DISCO DOME', 'PANCAKES', 'LUCKY 7', 'SLOTS', 'JACKPOT', 'BUFFET', 'CHAPEL', 'OPEN 24/7'][v];
    const col = KART_NEON[v % 6];
    x.shadowColor = col; x.shadowBlur = 10; x.strokeStyle = col; x.lineWidth = 3; rr(x, 13, 13, w - 26, 72, 10); x.stroke();
    kNeonText(x, T, w / 2, 50, T.length > 9 ? 26 : 32, col, true);
  } },
  wsign: { w: 192, h: 128, mw: 3.4, n: 8, draw(x, w, h, v) {
    const T = ['HYDRATE!', 'LEAVE NO TRACE', 'TEMPLE →', 'GATE ROAD', 'SLOW: 5 MPH', 'WELCOME HOME', 'HOT SPRINGS', 'DUST AHEAD'][v];
    x.fillStyle = '#6a4a2a'; x.fillRect(30, 60, 10, h - 62); x.fillRect(w - 40, 60, 10, h - 62);
    x.fillStyle = kGrad(x, 0, 8, 0, 76, '#d8a868', '#a8743e'); x.beginPath(); x.moveTo(8, 12); x.lineTo(w - 6, 8); x.lineTo(w - 10, 74); x.lineTo(12, 78); x.closePath(); x.fill(); kOut(x, '#4a2e14', 3);
    x.strokeStyle = 'rgba(90,60,30,0.4)'; x.lineWidth = 1.5; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(12, 24 + i * 14); x.lineTo(w - 10, 20 + i * 14); x.stroke(); }
    x.font = `${T.length > 10 ? 17 : 22}px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = ['#2a6ad8', '#d82a4a', '#2a2a2a', '#d84a2a', '#2a8a3a', '#a82ad8', '#d86a2a', '#6a3a1a'][v];
    x.fillText(T, w / 2, 44);
  } },
  man: { w: 256, h: 512, mw: 13, n: 2, draw(x, w, h, v) {
    const cx = w / 2, by = h - 4, wood = v ? '#e8944a' : '#c8945a', woodD = v ? '#7a2e10' : '#8a5a2e';
    // pedestal
    x.fillStyle = kGrad(x, cx - 70, 0, cx + 70, 0, shade(wood, 0.1), woodD); x.beginPath(); x.moveTo(cx - 74, by); x.lineTo(cx - 54, by - 110); x.lineTo(cx + 54, by - 110); x.lineTo(cx + 74, by); x.closePath(); x.fill(); kOut(x, null, 3);
    x.strokeStyle = rgba(woodD, 0.8); x.lineWidth = 3; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(cx - 70 + i * 4, by - i * 22); x.lineTo(cx + 70 - i * 4, by - i * 22); x.stroke(); }
    x.beginPath(); for (let i = -3; i <= 3; i++) { x.moveTo(cx + i * 18, by); x.lineTo(cx + i * 14, by - 110); } x.stroke();
    // figure (lattice of beams)
    const L = (pts, wd) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(cx + p[0], by - 110 - p[1]) : x.moveTo(cx + p[0], by - 110 - p[1])); x.lineWidth = wd; x.stroke(); };
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (const pass of [0, 1]) {
      x.strokeStyle = pass ? wood : woodD;
      const k = pass ? 0 : 3;
      L([[-26, 0], [-14, 120], [-20, 200], [-80, 300]], 13 + k); L([[26, 0], [14, 120], [20, 200], [80, 300]], 13 + k);
      L([[-14, 120], [14, 120]], 10 + k); L([[-20, 200], [20, 200]], 10 + k); L([[-26, 0], [14, 120]], 6 + k); L([[26, 0], [-14, 120]], 6 + k);
      L([[-14, 120], [20, 200]], 6 + k); L([[14, 120], [-20, 200]], 6 + k);
      L([[0, 200], [-22, 250], [0, 300], [22, 250], [0, 200]], 9 + k);
      L([[-20, 200], [0, 230], [20, 200]], 5 + k);
    }
  }, glow(x, w, h, v) {
    const cx = w / 2, by = h - 4;
    const L = (pts) => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(cx + p[0], by - 110 - p[1]) : x.moveTo(cx + p[0], by - 110 - p[1])); x.stroke(); };
    const col = v ? '#ff8a3a' : '#38f2ff';
    x.strokeStyle = col; x.shadowColor = col; x.shadowBlur = 12; x.lineWidth = 5; x.lineCap = 'round';
    L([[-26, 0], [-14, 120], [-20, 200], [-80, 300]]); L([[26, 0], [14, 120], [20, 200], [80, 300]]); L([[0, 200], [-22, 250], [0, 300], [22, 250], [0, 200]]);
  } },
  temple: { w: 512, h: 384, mw: 44, n: 1, draw(x, w, h) {
    const cx = w / 2, by = h - 4, wood = '#d8a868', woodD = '#8a5a2e';
    const tower = (tx, tw, th) => {
      x.beginPath(); x.moveTo(tx - tw / 2, by); x.lineTo(tx - tw * 0.32, by - th * 0.55); x.lineTo(tx, by - th); x.lineTo(tx + tw * 0.32, by - th * 0.55); x.lineTo(tx + tw / 2, by); x.closePath();
      x.fillStyle = kGrad(x, tx - tw / 2, 0, tx + tw / 2, 0, '#f0c88a', '#a8743e'); x.fill(); kOut(x, '#5a3a1a', 3);
      x.strokeStyle = rgba(woodD, 0.75); x.lineWidth = 2;
      for (let i = 1; i < 9; i++) { const yy = by - th * i / 9 * 0.95, ww = tw / 2 * (1 - i / 9 * 0.9); x.beginPath(); x.moveTo(tx - ww, yy); x.lineTo(tx + ww, yy); x.stroke(); }
      for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(tx + i * tw * 0.1, by); x.lineTo(tx + i * tw * 0.01, by - th * 0.95); x.stroke(); }
      x.fillStyle = 'rgba(40,20,10,0.55)'; x.beginPath(); x.moveTo(tx - tw * 0.12, by); x.lineTo(tx - tw * 0.12, by - th * 0.22); x.quadraticCurveTo(tx, by - th * 0.3, tx + tw * 0.12, by - th * 0.22); x.lineTo(tx + tw * 0.12, by); x.fill();
    };
    tower(cx - 150, 110, 170); tower(cx + 150, 110, 170); tower(cx - 78, 120, 230); tower(cx + 78, 120, 230); tower(cx, 170, 370);
    x.strokeStyle = woodD; x.lineWidth = 4; x.beginPath(); x.moveTo(20, by - 60); x.lineTo(w - 20, by - 60); x.stroke();
  }, glow(x, w, h) { x.fillStyle = 'rgba(255,200,120,0.8)'; x.shadowColor = '#ffb84a'; x.shadowBlur = 12; for (let i = 0; i < 18; i++) { x.beginPath(); x.arc(30 + i * (w - 60) / 17, h - 64, 3.5, 0, TAU); x.fill(); } } },
  rock: { w: 128, h: 96, mw: 3.2, n: 3, draw(x, w, h, v) {
    const by = h - 4, rng = mulberry32(50 + v);
    for (let k = 0; k < 3; k++) {
      const cx = w * (0.3 + k * 0.2 + (rng() - 0.5) * 0.1), rw = 26 + rng() * 22, rh = 30 + rng() * 40;
      x.beginPath(); x.moveTo(cx - rw, by); x.lineTo(cx - rw * 0.8, by - rh * 0.6); x.lineTo(cx - rw * 0.2, by - rh); x.lineTo(cx + rw * 0.5, by - rh * 0.85); x.lineTo(cx + rw, by - rh * 0.3); x.lineTo(cx + rw * 0.9, by); x.closePath();
      x.fillStyle = kGrad(x, cx - rw, by - rh, cx + rw, by, '#c8b498', '#6a5a4a'); x.fill(); kOut(x, '#3a2e24', 2);
      x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - rw * 0.7, by - rh * 0.6); x.lineTo(cx - rw * 0.2, by - rh); x.stroke();
    }
  } },
  art: { w: 224, h: 288, mw: 7.5, n: 8, draw(x, w, h, v) {
    const cx = w / 2, by = h - 6;
    x.lineCap = 'round'; x.lineJoin = 'round';
    if (v === 0) { // jellyfish
      x.strokeStyle = '#8a7aa8'; x.lineWidth = 5; for (let i = 0; i < 7; i++) { x.beginPath(); x.moveTo(cx - 60 + i * 20, 120); x.bezierCurveTo(cx - 70 + i * 20, 170, cx - 40 + i * 20, 210, cx - 56 + i * 20 + (i % 2) * 10, by - 10); x.stroke(); }
      x.beginPath(); x.ellipse(cx, 112, 90, 80, 0, Math.PI, TAU); x.quadraticCurveTo(cx + 60, 140, cx, 128); x.quadraticCurveTo(cx - 60, 140, cx - 90, 112); x.fillStyle = kGrad(x, 0, 30, 0, 140, '#e8d0ff', '#8a5ad8'); x.fill(); kOut(x, '#4a2a7a', 3);
    } else if (v === 1) { // metal flower
      x.strokeStyle = '#5a7a4a'; x.lineWidth = 10; x.beginPath(); x.moveTo(cx, by); x.quadraticCurveTo(cx + 20, 160, cx, 90); x.stroke();
      x.fillStyle = '#6a9a5a'; x.beginPath(); x.ellipse(cx + 26, 190, 30, 10, -0.5, 0, TAU); x.fill();
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; x.fillStyle = i % 2 ? '#ff8ab8' : '#ff5a9a'; x.beginPath(); x.ellipse(cx + Math.cos(a) * 44, 80 + Math.sin(a) * 44, 40, 18, a, 0, TAU); x.fill(); kOut(x, '#8a1a4a', 2); }
      x.fillStyle = '#ffd84a'; x.beginPath(); x.arc(cx, 80, 26, 0, TAU); x.fill(); kOut(x, '#8a6a1a', 3);
    } else if (v === 2) { // big metal heart on a plinth
      x.fillStyle = '#5a5060'; x.fillRect(cx - 34, by - 50, 68, 50);
      KartFace.heart(x, cx, 150, 72); x.fillStyle = kGrad(x, cx - 90, 90, cx + 90, 230, '#ff8aa8', '#c01a4a'); x.fill(); kOut(x, '#5a0a20', 4);
      x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 4; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(cx - 60 + i * 30, 110); x.lineTo(cx - 40 + i * 30, 200); x.stroke(); }
    } else if (v === 3) { // crystal shards
      const shard = (sx, sw, sh, col) => { x.beginPath(); x.moveTo(sx - sw / 2, by); x.lineTo(sx - sw / 2, by - sh * 0.8); x.lineTo(sx, by - sh); x.lineTo(sx + sw / 2, by - sh * 0.8); x.lineTo(sx + sw / 2, by); x.closePath(); x.fillStyle = kGrad(x, sx - sw / 2, 0, sx + sw / 2, 0, mix(col, '#ffffff', 0.5), col); x.fill(); kOut(x, shade(col, -0.5), 3); };
      shard(cx - 50, 50, 160, '#4ad8ff'); shard(cx + 52, 46, 180, '#8a6aff'); shard(cx, 70, 270, '#38c8e8'); shard(cx + 20, 36, 110, '#c88aff');
    } else if (v === 4) { // giant hand
      x.fillStyle = kGrad(x, cx - 60, 0, cx + 60, 0, '#d8c0a8', '#8a7058'); x.beginPath(); x.moveTo(cx - 40, by); x.lineTo(cx - 44, 140); x.lineTo(cx + 44, 140); x.lineTo(cx + 40, by); x.closePath(); x.fill(); kOut(x, '#4a3a2a', 3);
      for (let i = 0; i < 4; i++) { x.beginPath(); rr(x, cx - 46 + i * 23, 30 + Math.abs(1.5 - i) * 18, 20, 120, 10); x.fill(); kOut(x, '#4a3a2a', 3); }
      x.beginPath(); x.save(); x.translate(cx - 46, 170); x.rotate(-0.7); rr(x, -10, -70, 20, 80, 10); x.restore(); x.fill(); kOut(x, '#4a3a2a', 3);
    } else if (v === 5) { // LED ring arch
      x.strokeStyle = '#2a2632'; x.lineWidth = 18; x.beginPath(); x.arc(cx, 150, 96, 0, TAU); x.stroke();
      x.strokeStyle = '#4a4458'; x.lineWidth = 8; x.stroke();
      x.fillStyle = '#2a2632'; x.fillRect(cx - 10, 240, 20, by - 240); x.fillRect(cx - 40, by - 10, 80, 10);
    } else if (v === 6) { // mushroom
      x.fillStyle = kGrad(x, cx - 30, 0, cx + 30, 0, '#f4ead8', '#b8a888'); x.beginPath(); x.moveTo(cx - 30, by); x.quadraticCurveTo(cx - 20, 160, cx - 26, 120); x.lineTo(cx + 26, 120); x.quadraticCurveTo(cx + 20, 160, cx + 30, by); x.closePath(); x.fill(); kOut(x, '#6a5a4a', 3);
      x.beginPath(); x.ellipse(cx, 120, 100, 80, 0, Math.PI, TAU); x.closePath(); x.fillStyle = kGrad(x, 0, 40, 0, 120, '#ff6aa8', '#8a2a8a'); x.fill(); kOut(x, '#4a0a4a', 3);
      x.fillStyle = 'rgba(255,255,255,0.85)'; for (const [dx, dy, r] of [[-50, 90, 12], [10, 64, 15], [56, 96, 10], [-14, 104, 8]]) { x.beginPath(); x.arc(cx + dx, dy, r, 0, TAU); x.fill(); }
    } else { // LED lattice tower
      x.strokeStyle = '#3a3448'; x.lineWidth = 5;
      x.beginPath(); x.moveTo(cx - 40, by); x.lineTo(cx - 8, 10); x.moveTo(cx + 40, by); x.lineTo(cx + 8, 10); x.stroke();
      for (let i = 0; i < 12; i++) { const y0 = by - i * 23, y1 = y0 - 23, k0 = 40 - i * 2.7, k1 = 40 - (i + 1) * 2.7; x.beginPath(); x.moveTo(cx - k0, y0); x.lineTo(cx + k1, y1); x.moveTo(cx + k0, y0); x.lineTo(cx - k1, y1); x.moveTo(cx - k1, y1); x.lineTo(cx + k1, y1); x.stroke(); }
    }
  }, glow(x, w, h, v) {
    const cx = w / 2, by = h - 6;
    x.lineCap = 'round';
    const neon = (col, blur) => { x.shadowColor = col; x.shadowBlur = blur || 14; x.strokeStyle = col; x.fillStyle = col; };
    if (v === 0) { neon('#c88aff'); x.lineWidth = 6; x.beginPath(); x.ellipse(cx, 112, 86, 76, 0, Math.PI, TAU); x.stroke(); x.lineWidth = 3; for (let i = 0; i < 7; i++) { x.beginPath(); x.moveTo(cx - 60 + i * 20, 120); x.bezierCurveTo(cx - 70 + i * 20, 170, cx - 40 + i * 20, 210, cx - 56 + i * 20 + (i % 2) * 10, by - 10); x.stroke(); } }
    else if (v === 1) { neon('#ff6ac8'); x.lineWidth = 4; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; x.beginPath(); x.ellipse(cx + Math.cos(a) * 44, 80 + Math.sin(a) * 44, 38, 16, a, 0, TAU); x.stroke(); } neon('#ffd84a'); x.beginPath(); x.arc(cx, 80, 22, 0, TAU); x.fill(); }
    else if (v === 2) { neon('#ff3a7a'); x.lineWidth = 6; KartFace.heart(x, cx, 150, 70); x.stroke(); }
    else if (v === 3) { neon('#4ae8ff'); x.globalAlpha = 0.7; x.beginPath(); x.moveTo(cx - 35, by); x.lineTo(cx, by - 270); x.lineTo(cx + 35, by); x.fill(); }
    else if (v === 4) { neon('#ffb84a'); for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(cx - 36 + i * 23, 40 + Math.abs(1.5 - i) * 18, 6, 0, TAU); x.fill(); } }
    else if (v === 5) { for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, col = KART_NEON[i % 6]; neon(col, 10); x.beginPath(); x.arc(cx + Math.cos(a) * 96, 150 + Math.sin(a) * 96, 6, 0, TAU); x.fill(); } }
    else if (v === 6) { neon('#ff6ac8'); x.lineWidth = 6; x.beginPath(); x.ellipse(cx, 120, 98, 78, 0, Math.PI, TAU); x.stroke(); neon('#ffffff', 8); for (const [dx, dy, r] of [[-50, 90, 10], [10, 64, 12], [56, 96, 8]]) { x.beginPath(); x.arc(cx + dx, dy, r, 0, TAU); x.fill(); } }
    else { for (let i = 0; i < 12; i++) { const col = KART_NEON[i % 6], y0 = by - i * 23; neon(col, 10); x.lineWidth = 4; x.beginPath(); x.moveTo(cx - (40 - i * 2.7), y0); x.lineTo(cx + (40 - i * 2.7), y0); x.stroke(); } }
  } },
  tower: { w: 192, h: 384, mw: 22, n: 3, draw(x, w, h, v) { // casino tower
    const col = ['#3a2a5a', '#5a2a3a', '#2a3a5a'][v];
    x.fillStyle = kGrad(x, 10, 0, w - 10, 0, shade(col, 0.2), shade(col, -0.3)); x.fillRect(16, 40, w - 32, h - 40); kOut(x);
    x.fillStyle = shade(col, -0.2); x.fillRect(26, 20, w - 52, 24);
    for (let j = 0; j < 22; j++) for (let i = 0; i < 7; i++) { x.fillStyle = ((i * 7 + j * 13 + v) % 5) ? 'rgba(255,220,140,0.75)' : 'rgba(40,30,60,0.8)'; x.fillRect(26 + i * 21, 60 + j * 14, 12, 8); }
    x.fillStyle = '#16121c'; x.fillRect(w / 2 - 24, h - 40, 48, 40);
  }, glow(x, w, h, v) {
    const col = KART_NEON[(v * 2 + 1) % 6]; x.shadowColor = col; x.shadowBlur = 12; x.strokeStyle = col; x.lineWidth = 5;
    x.strokeRect(18, 42, w - 36, h - 44); x.fillStyle = col; x.fillRect(26, 22, w - 52, 6);
    x.fillStyle = 'rgba(255,220,150,0.6)'; x.shadowColor = '#ffd88a'; x.shadowBlur = 6; for (let j = 0; j < 22; j += 2) for (let i = 0; i < 7; i++) if ((i * 7 + j * 13 + v) % 5) x.fillRect(26 + i * 21, 60 + j * 14, 12, 8);
  } },
  rv: { w: 192, h: 112, mw: 8, n: 2, draw(x, w, h, v) {
    const by = h - 4, col = v ? '#f0ece4' : '#e8e0d0';
    x.fillStyle = '#1a1a1e'; x.beginPath(); x.arc(44, by - 14, 14, 0, TAU); x.arc(148, by - 14, 14, 0, TAU); x.fill();
    x.fillStyle = kGrad(x, 0, 14, 0, by - 14, col, shade(col, -0.25)); rr(x, 8, 14, w - 16, by - 30, 12); x.fill(); kOut(x);
    x.fillStyle = v ? '#3a8ad8' : '#d8783a'; x.fillRect(8, by - 46, w - 16, 10);
    x.fillStyle = '#5a7a9a'; for (let i = 0; i < 4; i++) x.fillRect(24 + i * 40, 28, 28, 22); x.fillRect(w - 30, 26, 16, 34);
  } },
  flag: { w: 48, h: 192, mw: 1.6, n: 4, draw(x, w, h, v) {
    x.fillStyle = '#8a8a96'; x.fillRect(6, 8, 4, h - 10);
    const col = KART_NEON[v + 1];
    x.beginPath(); x.moveTo(10, 10); x.quadraticCurveTo(28, 40, 20, 90); x.quadraticCurveTo(36, 60, 44, 20); x.closePath(); x.fillStyle = kGrad(x, 10, 0, 44, 0, col, shade(col, -0.35)); x.fill(); kOut(x, null, 1.5);
  } },
  cone: { w: 32, h: 48, mw: 0.55, n: 1, draw(x, w, h) {
    x.fillStyle = '#ff7a1a'; x.beginPath(); x.moveTo(w / 2, 2); x.lineTo(w - 6, h - 8); x.lineTo(6, h - 8); x.closePath(); x.fill(); kOut(x, '#7a2a0a', 1.5);
    x.fillStyle = '#ffffff'; x.fillRect(10, 20, w - 20, 6); x.fillStyle = '#2a2622'; x.fillRect(2, h - 8, w - 4, 6);
  } },
  gate: { w: 512, h: 224, mw: 26, n: 1, draw(x, w, h) {
    const by = h - 2;
    for (const px of [22, w - 22]) { x.fillStyle = kGrad(x, px - 14, 0, px + 14, 0, '#3a3448', '#16121e'); x.fillRect(px - 14, 30, 28, by - 30); kOut(x); }
    x.fillStyle = kGrad(x, 0, 14, 0, 84, '#2a1a3a', '#120a1e'); rr(x, 4, 14, w - 8, 72, 18); x.fill(); kOut(x, '#ff4fd8', 4);
    kNeonText(x, 'ART CAR KART', w / 2, 51, 42, '#ff4fd8', false);
    x.fillStyle = '#ffd84a'; for (let i = 0; i < 24; i++) { x.beginPath(); x.arc(16 + i * (w - 32) / 23, 92, 4, 0, TAU); x.fill(); }
    for (let i = 0; i < 6; i++) { x.fillStyle = (i % 2) ? '#111' : '#eee'; x.fillRect(8 + i * 8, 100, 8, 8); x.fillRect(w - 56 + i * 8, 100, 8, 8); }
  }, glow(x, w, h) {
    x.shadowColor = '#ff4fd8'; x.shadowBlur = 12; x.strokeStyle = '#ff4fd8'; x.lineWidth = 4; rr(x, 4, 14, w - 8, 72, 18); x.stroke();
    kNeonText(x, 'ART CAR KART', w / 2, 51, 42, '#ff4fd8', true);
    x.fillStyle = '#ffd84a'; x.shadowColor = '#ffd84a'; for (let i = 0; i < 24; i++) { x.beginPath(); x.arc(16 + i * (w - 32) / 23, 92, 4, 0, TAU); x.fill(); }
  } }
};
// gameplay sprites + particles + decals
const KART_FX_DEFS = {
  gift: { w: 96, h: 96, n: 4, frames: 6, draw(x, w, h, v, f) {
    const cols = [['#ff4fd8', '#ffd84a'], ['#38c8ff', '#ff6a4a'], ['#7ad86a', '#ff4fd8'], ['#ffb84a', '#6a5aff']][v];
    // rotating wrapped present, drawn with the 2.5D projector
    KartProj.view(f / 6 * Math.PI / 2, 0.42, 34, w / 2, h * 0.76);
    KartProj.clear();
    KartProj.box(0, 0.5, 0, 1, 1, 1, cols[0], { line: 'rgba(40,10,40,0.6)', lw: 0.035,
      decalTop: k => { k.fillStyle = cols[1]; k.fillRect(0.4, 0, 0.2, 1); k.fillRect(0, 0.4, 1, 0.2); },
      decalFront: k => { k.fillStyle = cols[1]; k.fillRect(0.4, 0, 0.2, 1); }, decalBack: k => { k.fillStyle = cols[1]; k.fillRect(0.4, 0, 0.2, 1); },
      decalR: k => { k.fillStyle = cols[1]; k.fillRect(0.4, 0, 0.2, 1); }, decalL: k => { k.fillStyle = cols[1]; k.fillRect(0.4, 0, 0.2, 1); } });
    KartProj.at(0, 1.02, 0, (k, px, py, S) => {
      k.fillStyle = cols[1]; k.strokeStyle = shade(cols[1], -0.5); k.lineWidth = 1.5;
      for (const s of [-1, 1]) { k.beginPath(); k.ellipse(px + s * S * 0.2, py - S * 0.08, S * 0.2, S * 0.12, s * 0.5, 0, TAU); k.fill(); k.stroke(); }
      k.beginPath(); k.arc(px, py - S * 0.05, S * 0.08, 0, TAU); k.fill(); k.stroke();
    }, null, 5);
    KartProj.flush(x);
  } },
  glowball: { w: 64, h: 64, draw(x, w, h) { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } },
  puff: { w: 64, h: 64, draw(x, w, h) { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(w / 2, h / 2, w / 2, 0, TAU); x.fill(); } },
  spark: { w: 16, h: 48, draw(x, w, h) { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 2, 0, 0, TAU); x.fill(); } },
  flame: { w: 64, h: 96, draw(x, w, h) { const g = x.createRadialGradient(w / 2, h * 0.72, 2, w / 2, h * 0.6, h * 0.55); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.3, 'rgba(255,190,80,0.9)'); g.addColorStop(0.7, 'rgba(255,80,30,0.45)'); g.addColorStop(1, 'rgba(200,30,20,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(w / 2, 2); x.bezierCurveTo(w * 0.95, h * 0.45, w * 0.95, h - 4, w / 2, h - 4); x.bezierCurveTo(w * 0.05, h - 4, w * 0.05, h * 0.45, w / 2, 2); x.fill(); } },
  sparkle: { w: 64, h: 64, draw(x, w, h) { x.fillStyle = '#ffffff'; x.shadowColor = '#ffffff'; x.shadowBlur = 6; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = i % 2 ? 6 : 28; x.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } x.closePath(); x.fill(); } },
  confetti: { w: 16, h: 16, draw(x, w, h) { x.fillStyle = '#ffffff'; x.fillRect(2, 4, 12, 8); } },
  shadow: { w: 128, h: 128, draw(x, w, h) { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } },
  puke: { w: 64, h: 64, draw(x, w, h) {
    const g = x.createRadialGradient(w * 0.4, h * 0.38, 2, w / 2, h / 2, w * 0.46); g.addColorStop(0, '#e8ffb0'); g.addColorStop(0.5, '#7adf3a'); g.addColorStop(1, '#2a7a1a');
    x.fillStyle = g; x.beginPath(); x.arc(w / 2, h / 2, w * 0.42, 0, TAU); x.fill(); kOut(x, '#1a4a10', 2.5);
    x.fillStyle = 'rgba(40,120,20,0.6)'; for (const [dx, dy, r] of [[-8, 6, 5], [9, -4, 4], [4, 12, 3]]) { x.beginPath(); x.arc(w / 2 + dx, h / 2 + dy, r, 0, TAU); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.ellipse(w * 0.38, h * 0.34, 7, 4, -0.6, 0, TAU); x.fill();
  } },
  tumble: { w: 96, h: 96, draw(x, w, h) {
    const rng = mulberry32(9); x.strokeStyle = '#8a6a3a'; x.lineCap = 'round';
    for (let i = 0; i < 46; i++) { const a = rng() * TAU, r = 10 + rng() * 32; x.lineWidth = 1.5 + rng() * 2.5; x.strokeStyle = i % 3 ? '#9a7a48' : '#c8a46a'; x.beginPath(); x.arc(w / 2 + Math.cos(a) * 6, h / 2 + Math.sin(a) * 6, r, a, a + 1 + rng() * 2.5); x.stroke(); }
  } },
  dustcloud: { w: 128, h: 96, draw(x, w, h) {
    for (const [dx, dy, r] of [[-30, 10, 30], [0, -8, 38], [30, 8, 32], [-10, 18, 30], [16, 22, 26]]) { const g = x.createRadialGradient(w / 2 + dx, h / 2 + dy, 2, w / 2 + dx, h / 2 + dy, r); g.addColorStop(0, 'rgba(240,226,196,0.95)'); g.addColorStop(0.7, 'rgba(214,192,150,0.6)'); g.addColorStop(1, 'rgba(200,180,140,0)'); x.fillStyle = g; x.beginPath(); x.arc(w / 2 + dx, h / 2 + dy, r, 0, TAU); x.fill(); }
  } },
  mozzie: { w: 32, h: 32, draw(x, w, h) {
    x.fillStyle = 'rgba(220,235,255,0.6)'; x.beginPath(); x.ellipse(11, 10, 7, 4, -0.6, 0, TAU); x.ellipse(21, 10, 7, 4, 0.6, 0, TAU); x.fill();
    x.fillStyle = '#1a1418'; x.beginPath(); x.ellipse(16, 17, 4, 7, 0, 0, TAU); x.fill(); x.fillStyle = '#e0283c'; x.beginPath(); x.arc(14, 12, 2, 0, TAU); x.arc(18, 12, 2, 0, TAU); x.fill();
    x.strokeStyle = '#1a1418'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(16, 10); x.lineTo(16, 2); x.stroke();
  } },
  discoball: { w: 64, h: 64, draw(x, w, h) {
    x.save(); x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 3, 0, TAU); x.clip();
    for (let j = -5; j < 5; j++) for (let i = -5; i < 5; i++) { const hh = (i * 37 + j * 61 + 400) % 360; x.fillStyle = `hsl(${hh},60%,${60 + ((i + j) & 1) * 18}%)`; x.fillRect(w / 2 + i * 6.4 + (j % 2) * 3, h / 2 + j * 6.4, 5.6, 5.6); }
    const g = x.createRadialGradient(w * 0.35, h * 0.32, 2, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(30,20,50,0.5)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.restore(); x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 3, 0, TAU); kOut(x, '#2a1a3a', 2.5);
  } },
  bottle: { w: 40, h: 80, draw(x, w, h) { x.fillStyle = 'rgba(200,235,255,0.75)'; rr(x, 8, 18, w - 16, h - 22, 8); x.fill(); kOut(x, '#2a6a9a', 2); x.fillStyle = '#4ab8ff'; rr(x, 10, 40, w - 20, h - 46, 6); x.fill(); x.fillStyle = '#2a6aff'; x.fillRect(14, 8, w - 28, 12); } },
  checker: { w: 256, h: 32, draw(x, w, h) { for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#141018' : '#f4f0ea'; x.fillRect(i * 16, j * 16, 16, 16); } } },
  grid: { w: 64, h: 96, draw(x, w, h) { x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 5; x.beginPath(); x.moveTo(6, h - 6); x.lineTo(6, 6); x.lineTo(w - 6, 6); x.lineTo(w - 6, h - 6); x.stroke(); } },
  pool: { w: 256, h: 256, draw(x, w, h) {
    const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2 - 6); g.addColorStop(0, '#9af0f4'); g.addColorStop(0.6, '#3ac0c8'); g.addColorStop(0.92, '#2a8a9a'); g.addColorStop(1, '#d8c8a8');
    x.fillStyle = g; x.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = (w / 2 - 6) * (0.9 + Math.sin(i * 2.3) * 0.08); x.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } x.closePath(); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 4; for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(w / 2 - 20 + i * 18, h / 2 - 20 + i * 14, 30 + i * 10, 14 + i * 5, 0.3, 0, Math.PI); x.stroke(); }
    x.strokeStyle = '#efe4c8'; x.lineWidth = 8; x.stroke();
  } },
  slick: { w: 128, h: 128, draw(x, w, h) { // green puke splat on the road
    x.fillStyle = 'rgba(120,220,60,0.85)'; x.beginPath(); for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, r = 40 + (i % 3) * 14 + Math.sin(i * 5) * 6; x.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } x.closePath(); x.fill();
  } }
};
const KartProps = {
  // paint every prop / fx into the atlas (names: <prop><v>_<f>, glow: <prop><v>_<f>g)
  paintAll(atlas) {
    const items = [];
    for (const defs of [KART_PROP_DEFS, KART_FX_DEFS]) for (const name in defs) {
      const d = defs[name];
      for (let v = 0; v < (d.n || 1); v++) for (let f = 0; f < (d.frames || 1); f++) {
        const id = name + v + '_' + f;
        items.push({ id, w: d.w, h: d.h, fn: (x, w, h) => d.draw(x, w, h, v, f) });
        if (d.glow) items.push({ id: id + 'g', w: d.w / 2, h: d.h / 2, fn: (x, w, h) => { x.scale(0.5, 0.5); d.glow(x, w * 2, h * 2, v, f); } });
      }
    }
    items.sort((a, b) => b.h - a.h || b.w - a.w);
    for (const it of items) atlas.paint(it.id, it.w, it.h, it.fn, 2);
  },
  def(name) { return KART_PROP_DEFS[name] || KART_FX_DEFS[name]; }
};

/* ---------------- per-track setup: decor, gameplay features, textures ---------------- */
function kartTrackBuilder(T, R, rng) {
  const B = {
    T, R, rng,
    s: f => ((f % 1) + 1) % 1 * T.L,
    frame: (f, out) => T.at(B.s(f), out || {}),
    // world position at lap fraction f, lateral offset d (m, + = right)
    pos(f, d) { const a = T.at(B.s(f), {}); return [a.x + a.nx * d, a.z + a.nz * d, a]; },
    // clear of every part of the track (optionally ignoring the stretch around sample `skip`)
    clearOf(x, z, r, skip) {
      const N = T.N;
      for (let i = 0; i < N; i += 2) {
        if (skip !== undefined) { const di = Math.abs(i - skip), dd = Math.min(di, N - di); if (dd < 30) continue; }
        const dx = x - T.X[i], dz = z - T.Z[i], lim = Math.max(T.WL[i], T.WR[i]) + r + 1.2;
        if (dx * dx + dz * dz < lim * lim) return false;
      }
      return true;
    },
    prop(kind, v, x, z, o) {
      const d = KartProps.def(kind); if (!d) return null;
      const p = Object.assign({ kind, v: v || 0, x, z, w: d.mw, h: d.mw * d.h / d.w, ay: d.ay || 1, glow: !!d.glow, frames: d.frames || 1, phase: rng() * 10 }, o || {});
      if (p.scale) { p.w *= p.scale; p.h *= p.scale; }
      R.props.push(p);
      return p;
    },
    light(x, z, r, col, i) { R.lights.push({ x, z, r, col, i: i === undefined ? 0.8 : i }); },
    mark(type, x, z, w, h, col, ang, a) { R.marks.push({ type, x, z, w, h, col, ang: ang || 0, a: a === undefined ? 1 : a }); },
    // prop beside the track: f lap fraction, side -1 left / +1 right, gap metres beyond the barrier
    side(kind, v, f, side, gap, o) {
      const a = T.at(B.s(f), {}), w = side < 0 ? a.wl : a.wr, d = side * (w + gap);
      const x = a.x + a.nx * d, z = a.z + a.nz * d;
      const def = KartProps.def(kind), rad = def ? def.mw * (o && o.scale || 1) * 0.5 : 1;
      if (!B.clearOf(x, z, rad * 0.8, a.i)) return null;
      return B.prop(kind, v, x, z, o);
    },
    boost(f, df) { const a = T.at(B.s(f), {}); R.boosts.push({ s: B.s(f), d: df * Math.max(0, a.hw - 2.4), w: 3.6, len: 5.5 }); },
    ramp(f, d0, d1, h) { const a = T.at(B.s(f), {}); R.ramps.push({ s: B.s(f), d0: d0 * a.hw, d1: d1 * a.hw, h: h || 1.05, len: 4.6 }); },
    gifts(f, n) { const a = T.at(B.s(f), {}); n = n || 4; for (let i = 0; i < n; i++) R.gifts.push({ s: B.s(f), d: lerp(-a.hw + 2.6, a.hw - 2.6, n > 1 ? i / (n - 1) : 0.5), t: 0 }); },
    obstacle(f, df, r, kind, v, o) {
      const a = T.at(B.s(f), {}), d = df * a.hw, x = a.x + a.nx * d, z = a.z + a.nz * d;
      R.obstacles.push({ x, z, r, i: T.idx(B.s(f)), d });
      B.mark('shadow', x, z, r * 2.6, r * 2.6, '#000000', 0, 0.35);
      return B.prop(kind, v, x, z, Object.assign({ solid: true }, o || {}));
    },
    pool(f, df, r) {
      const a = T.at(B.s(f), {}), d = df * a.hw, x = a.x + a.nx * d, z = a.z + a.nz * d;
      R.slow.push({ x, z, r, k: 0.55, kind: 'pool' });
      R.decals.push({ reg: 'pool0_0', x, z, w: r * 2.2, l: r * 2.2, dx: a.tx, dz: a.tz });
      R.steam.push({ x, z, r });
    },
    camp(f, side, gap, sign) {
      const a = T.at(B.s(f), {}), w = side < 0 ? a.wl : a.wr;
      const base = side * (w + gap);
      const cx = a.x + a.nx * base, cz = a.z + a.nz * base;
      if (!B.clearOf(a.x + a.nx * (base + side * 9), a.z + a.nz * (base + side * 9), 7, a.i)) return;
      const out = [a.nx * side, a.nz * side], along = [a.tx, a.tz];
      const at = (u, v) => [cx + along[0] * u + out[0] * v, cz + along[1] * u + out[1] * v];
      const col = KART_NEON[Math.floor(rng() * 6)];
      B.mark('carpet', ...at(0, 6), 16, 11, ['#a83a5a', '#3a6aa8', '#c8843a', '#5a3a8a'][Math.floor(rng() * 4)], Math.atan2(along[1], along[0]), 0.75);
      if (sign !== undefined) B.prop('neon', sign, ...at(0, 0.5), { light: col, glowI: 1.2 });
      const kind = rng();
      if (kind < 0.45) B.prop('dome', rng() < 0.5 ? 1 : 0, ...at(-3 + rng() * 6, 13), {});
      else if (kind < 0.8) B.prop('shade', 0, ...at(rng() * 4 - 2, 10), {});
      else for (let i = 0; i < 3; i++) B.prop('tent', Math.floor(rng() * 4), ...at(-6 + i * 6, 10 + rng() * 4), {});
      const nb = 1 + Math.floor(rng() * 3);
      for (let i = 0; i < nb; i++) B.prop('burner', Math.floor(rng() * 8), ...at(-6 + rng() * 12, 3 + rng() * 5), { anim: 'cheer' });
      if (rng() < 0.5) B.prop('bike', Math.floor(rng() * 2), ...at(7 + rng() * 3, 2.5 + rng() * 3), {});
      if (R.tod.glow > 0.6) { B.light(...at(0, 3), 22, col, 0.55); B.light(...at(0, 11), 16, KART_NEON[Math.floor(rng() * 6)], 0.35); }
    },
    // random scatter in the open area around the track
    scatter(n, pick, minGap, maxGap, o) {
      const tries = n * 8;
      for (let k = 0; k < tries && n > 0; k++) {
        const i = Math.floor(rng() * T.N), side = rng() < 0.5 ? -1 : 1, gap = minGap + rng() * (maxGap - minGap);
        const w = side < 0 ? T.WL[i] : T.WR[i], d = side * (w + gap);
        const x = T.X[i] + T.NX[i] * d, z = T.Z[i] + T.NZ[i] * d;
        const [kind, v] = pick(rng);
        const def = KartProps.def(kind); if (!def) continue;
        if (!B.clearOf(x, z, def.mw * 0.4, i)) continue;
        if (!B.clearOf(x, z, def.mw * 0.4 - gap * 0.5 + 0.5)) continue;
        B.prop(kind, v, x, z, typeof o === 'function' ? o(kind, v) : o);
        n--;
      }
    }
  };
  return B;
}

const KART_DECOR = {
  esplanade(B) {
    const { R, rng } = B;
    B.prop('man', 0, 0, 0, { light: '#38f2ff', glowI: 1.4, scale: 1.1 });
    B.light(0, 0, 40, '#38f2ff', 0.5);
    const signs = [0, 1, 2, 3, 4];
    for (let f = 0.03; f < 0.98; f += 0.042) if (f < 0.43 || f > 0.66) B.camp(f + rng() * 0.01, -1, 4 + rng() * 3, rng() < 0.6 ? signs[Math.floor(rng() * signs.length)] : undefined);
    for (let f = 0.02; f < 1; f += 0.025) { const p = B.side('lamp', 0, f, 1, 1.5, { light: '#ffcf8a', glowI: 1 }); if (p) B.light(p.x, p.z, 7, '#ffb860', 0.5); }
    B.scatter(14, r => ['art', Math.floor(r() * 8)], 25, 90, { glowI: 1 });
    B.scatter(16, r => r() < 0.5 ? ['bike', Math.floor(r() * 2)] : ['burner', Math.floor(r() * 8)], 4, 30, { anim: 'cheer' });
    B.scatter(6, () => ['potty', 1], 20, 40);
    for (const f of [0.12, 0.37, 0.62, 0.86]) B.boost(f, (rng() - 0.5) * 1.4);
    B.ramp(0.53, -0.45, 0.45);
    for (const f of [0.2, 0.47, 0.75]) B.gifts(f, 4);
    R.edge = ['#ff4fd8', '#38f2ff']; R.edgeGlow = true; R.wall = 'led'; R.manOnHorizon = null;
  },
  gateroad(B) {
    const { R, rng } = B;
    for (let f = 0.0; f < 1; f += 0.018) { B.side('flag', Math.floor(rng() * 4), f, -1, 1.2); if (rng() < 0.5) B.side('flag', Math.floor(rng() * 4), f + 0.009, 1, 1.2); }
    for (let f = 0.04; f < 1; f += 0.06) B.side('wsign', [3, 4, 5, 0][Math.floor(rng() * 4)], f, rng() < 0.5 ? -1 : 1, 2.5);
    for (let f = 0.02; f < 0.98; f += 0.03) B.side('rv', Math.floor(rng() * 2), f, -1, 9 + rng() * 6);
    B.scatter(18, r => r() < 0.3 ? ['potty', Math.floor(r() * 2)] : r() < 0.6 ? ['tent', Math.floor(r() * 4)] : ['burner', Math.floor(r() * 8)], 6, 40, { anim: 'cheer' });
    B.scatter(5, () => ['shade', 0], 10, 30);
    for (let f = 0.1; f < 1; f += 0.05) B.side('cone', 0, f, rng() < 0.5 ? -1 : 1, -2.5 - rng() * 3);
    for (const f of [0.08, 0.2, 0.55, 0.68, 0.84]) B.boost(f, (rng() - 0.5) * 1.6);
    B.ramp(0.13, -0.4, 0.4); B.ramp(0.6, -0.4, 0.4);
    for (const f of [0.3, 0.5, 0.78]) B.gifts(f, 4);
    R.edge = ['#ffffff', '#ff7a2a']; R.edgeGlow = false; R.wall = 'hay'; R.manOnHorizon = [0, -900];
  },
  deepplaya(B) {
    const { R, rng } = B;
    B.obstacle(0.1, 0.05, 2.6, 'art', 3, { glowI: 1.3, light: '#4ae8ff' });
    B.obstacle(0.3, -0.35, 2.4, 'art', 6, { glowI: 1.3, light: '#ff6ac8' });
    B.obstacle(0.48, 0.3, 2.4, 'art', 0, { glowI: 1.3, light: '#c88aff' });
    B.obstacle(0.66, -0.1, 2.6, 'art', 5, { glowI: 1.3, light: '#ffd84a', scale: 1.15 });
    B.obstacle(0.85, 0.35, 2.4, 'art', 1, { glowI: 1.3, light: '#ff6ac8' });
    for (const o of R.obstacles) B.light(o.x, o.z, 20, '#c88aff', 0.6);
    B.scatter(18, r => ['art', Math.floor(r() * 8)], 8, 45, { glowI: 1.1 });
    B.scatter(14, r => ['art', Math.floor(r() * 8)], 45, 160, { glowI: 1.1, scale: 1.4 });
    B.scatter(26, r => r() < 0.6 ? ['bike', Math.floor(r() * 2)] : ['burner', Math.floor(r() * 8)], 2, 30, { anim: 'cheer' });
    B.scatter(8, r => ['lamp', 0], 1, 6, { glowI: 1 });
    for (const p of R.props) if (p.kind === 'art' && !p.solid) B.light(p.x, p.z, 16, KART_NEON[p.v % 6], 0.45);
    for (const f of [0.2, 0.4, 0.58, 0.77]) B.boost(f, (rng() - 0.5) * 1.2);
    B.ramp(0.93, -0.5, 0.5);
    for (const f of [0.17, 0.53, 0.73]) B.gifts(f, 4);
    R.edge = ['#7a6aff', '#38f2ff']; R.edgeGlow = true; R.wall = 'led'; R.neon = ['#7a6aff', '#38f2ff', '#c88aff']; R.wallStripe = '#7a6aff'; R.manOnHorizon = [-60, 900];
  },
  temple(B) {
    const { R, rng } = B;
    B.prop('temple', 0, 0, 0, { glowI: 0.8, light: '#ffb84a' });
    B.mark('shadow', 0, 0, 60, 24, '#000000', 0, 0.3);
    B.scatter(30, r => ['burner', Math.floor(r() * 8)], 3, 45, { anim: 'cheer' });
    B.scatter(14, r => r() < 0.5 ? ['bike', Math.floor(r() * 2)] : ['lamp', 0], 3, 30, { glowI: 0.8 });
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; B.prop('flag', k % 4, Math.cos(a) * 34, Math.sin(a) * 34, {}); }
    B.scatter(10, () => ['shade', 0], 20, 70);
    B.scatter(10, r => ['art', [1, 2, 4, 6][Math.floor(r() * 4)]], 30, 90, { glowI: 0.5 });
    for (let f = 0.05; f < 1; f += 0.1) B.side('wsign', 2, f, -1, 3);
    for (const f of [0.1, 0.36, 0.62, 0.88]) B.boost(f, (rng() - 0.5) * 1.4);
    B.ramp(0.76, -0.45, 0.45);
    for (const f of [0.22, 0.5, 0.8]) B.gifts(f, 4);
    R.edge = ['#ffffff', '#ff9a5a']; R.edgeGlow = false; R.wall = 'hay'; R.manOnHorizon = [0, 700];
  },
  reno(B) {
    const { R, rng } = B;
    for (let f = 0.0; f < 1; f += 0.034) for (const side of [-1, 1]) if (rng() < 0.75) B.side('tower', Math.floor(rng() * 3), f + rng() * 0.01, side, 14 + rng() * 8, { glowI: 1, light: KART_NEON[Math.floor(rng() * 6)] });
    for (let f = 0.01; f < 1; f += 0.028) { const side = rng() < 0.5 ? -1 : 1; const p = B.side('neon', 5 + Math.floor(rng() * 6), f, side, 3, { glowI: 1.3, scale: 1.2 }); if (p) B.light(p.x, p.z, 14, KART_NEON[(p.v) % 6], 0.6); }
    for (let f = 0.0; f < 1; f += 0.02) for (const side of [-1, 1]) { const p = B.side('lamp', 0, f + (side > 0 ? 0.01 : 0), side, 1.0, { glowI: 1 }); if (p) B.light(p.x, p.z, 8, '#ffcf8a', 0.45); }
    for (const p of R.props) if (p.kind === 'tower') B.light(p.x, p.z, 26, KART_NEON[(p.v * 2 + 1) % 6], 0.35);
    B.scatter(14, r => ['burner', Math.floor(r() * 8)], 2, 8, { anim: 'cheer' });
    for (const f of [0.07, 0.3, 0.55, 0.8]) B.boost(f, (rng() - 0.5) * 1.2);
    B.ramp(0.18, -0.45, 0.45);
    for (const f of [0.14, 0.45, 0.7]) B.gifts(f, 4);
    R.edge = ['#ffffff', '#ffd84a']; R.edgeGlow = true; R.wall = 'jersey'; R.neon = ['#ff4fd8', '#38f2ff', '#ffd84a']; R.roadStyle = 'asphalt'; R.noCampLights = true;
    R.band = (x, W, H, elToY, r, ridge) => {
      ridge(1.2, 2.0, '#2a2048', '#3a2a5a');
      for (let i = 0; i < 240; i++) { // city skyline
        const bx = r() * W, bw = 14 + r() * 40, bh = 1 + r() * 6.5 * (0.5 + 0.5 * Math.sin(bx / W * TAU * 2));
        x.fillStyle = mix('#1a1428', '#2a2040', r()); x.fillRect(bx, elToY(bh), bw, elToY(-1) - elToY(bh));
        x.fillStyle = rgba(['#ffd88a', '#ff7ae0', '#7ae8ff'][i % 3], 0.75);
        for (let k = 0; k < bh * 3; k++) if (r() < 0.5) x.fillRect(bx + 3 + r() * (bw - 6), elToY(bh) + 4 + r() * (elToY(-0.5) - elToY(bh)), 2, 2);
      }
    };
  },
  hotsprings(B) {
    const { R, rng } = B;
    B.pool(0.16, 0.45, 3.6); B.pool(0.24, -0.5, 3.3); B.pool(0.42, 0.42, 3.6); B.pool(0.5, -0.1, 3.2); B.pool(0.66, -0.45, 3.5); B.pool(0.83, 0.5, 3.4);
    B.scatter(40, r => ['rock', Math.floor(r() * 3)], 1, 30);
    for (let k = 0; k < 14; k++) {
      for (let t = 0; t < 10; t++) {
        const i = Math.floor(rng() * B.T.N), side = rng() < 0.5 ? -1 : 1, gap = 5 + rng() * 25, w = side < 0 ? B.T.WL[i] : B.T.WR[i];
        const x = B.T.X[i] + B.T.NX[i] * side * (w + gap), z = B.T.Z[i] + B.T.NZ[i] * side * (w + gap), r = 3 + rng() * 4;
        if (!B.clearOf(x, z, r + 1, i)) continue;
        R.decals.push({ reg: 'pool0_0', x, z, w: r * 2.2, l: r * 2.2, dx: 1, dz: 0, off: true }); R.steam.push({ x, z, r }); break;
      }
    }
    B.scatter(12, r => ['burner', Math.floor(r() * 8)], 2, 20, { anim: 'cheer' });
    for (let f = 0.03; f < 1; f += 0.12) B.side('wsign', 6, f, rng() < 0.5 ? -1 : 1, 2);
    B.scatter(6, () => ['shade', 0], 12, 40);
    for (const f of [0.06, 0.32, 0.58, 0.9]) B.boost(f, (rng() - 0.5) * 1.2);
    B.ramp(0.74, -0.4, 0.4);
    for (const f of [0.1, 0.36, 0.62, 0.86]) B.gifts(f, 4);
    R.edge = ['#e8e0d0', '#8a7a6a']; R.edgeGlow = false; R.wall = 'rock'; R.manOnHorizon = [400, -900];
    R.band = (x, W, H, elToY, r, ridge) => { ridge(3.2, 4.2, mix('#8a8aa8', R.tod.fog, 0.45), mix('#9a9ab8', R.tod.hor, 0.2)); ridge(1.4, 2.6, '#7a6a68', '#8a7a70'); };
  },
  duststorm(B) {
    const { R, rng } = B;
    B.scatter(12, r => ['art', Math.floor(r() * 8)], 20, 110, { glowI: 0.3 });
    B.scatter(14, r => r() < 0.5 ? ['bike', Math.floor(r() * 2)] : ['burner', Math.floor(r() * 8)], 4, 40, { anim: 'cheer' });
    B.scatter(8, () => ['shade', 0], 14, 60);
    B.scatter(10, r => ['flag', Math.floor(r() * 4)], 2, 12);
    for (let f = 0.05; f < 1; f += 0.15) B.side('wsign', 7, f, rng() < 0.5 ? -1 : 1, 2);
    for (const f of [0.08, 0.3, 0.52, 0.72, 0.9]) B.boost(f, (rng() - 0.5) * 1.4);
    B.ramp(0.4, -0.45, 0.45); B.ramp(0.82, -0.45, 0.45);
    for (const f of [0.18, 0.46, 0.64, 0.86]) B.gifts(f, 5);
    R.edge = ['#ffffff', '#ff4a4a']; R.edgeGlow = false; R.wall = 'hay'; R.manOnHorizon = [200, -800]; R.storm = true;
  },
  manburn(B) {
    const { R, rng } = B;
    B.prop('man', 1, 0, 0, { glowI: 1.5, burning: true, scale: 1.25 });
    B.light(0, 0, 70, '#ff7a2a', 1.0); B.light(0, 0, 28, '#ffd08a', 0.8);
    B.mark('scorch', 0, 0, 26, 26, '#2a1a10', 0, 0.8);
    for (let k = 0; k < 56; k++) { const a = k / 56 * TAU + rng() * 0.05, r = 17 + rng() * 10; B.prop('burner', Math.floor(rng() * 8), Math.cos(a) * r, Math.sin(a) * r, { anim: 'cheer' }); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.2; B.prop('barrel', 0, Math.cos(a) * 14, Math.sin(a) * 14, { fire: true }); B.light(Math.cos(a) * 14, Math.sin(a) * 14, 8, '#ff8a3a', 0.5); }
    for (let f = 0.02; f < 1; f += 0.06) B.camp(f + rng() * 0.01, -1, 5 + rng() * 6, rng() < 0.4 ? Math.floor(rng() * 5) : undefined);
    B.scatter(20, r => ['burner', Math.floor(r() * 8)], 3, 20, { anim: 'cheer' });
    B.scatter(10, r => ['art', Math.floor(r() * 8)], 30, 100, { glowI: 1 });
    for (const f of [0.1, 0.34, 0.6, 0.84]) B.boost(f, (rng() - 0.5) * 1.4);
    B.ramp(0.47, -0.45, 0.45);
    for (const f of [0.22, 0.52, 0.74]) B.gifts(f, 4);
    R.edge = ['#ff7a2a', '#ffd84a']; R.edgeGlow = true; R.wall = 'led'; R.neon = ['#ff7a2a', '#ffd84a', '#ff3a3a']; R.wallStripe = '#ff7a2a'; R.fireworks = true; R.embers = true;
  }
};

// build everything for a race on track id: returns { T, R, jobs[] } (textures are painted by the jobs)
function kartSetupTrack(id) {
  const def = KART_TRACKS[id];
  const T = new KartTrack(def);
  const tod = KART_TOD[def.tod];
  const R = { id, def, tod, surf: KART_SURF[def.surface || 'playa'], props: [], lights: [], marks: [], boosts: [], ramps: [], gifts: [], obstacles: [], slow: [], decals: [], steam: [], edge: ['#ffffff', '#ff4fd8'], wall: 'led' };
  const rng = mulberry32(hashStr(id) ^ 0x1234);
  const B = kartTrackBuilder(T, R, rng);
  KART_DECOR[id](B);
  T.obstacles = R.obstacles; T.buildLine();
  // ground marks under props
  for (const p of R.props) {
    if (p.kind === 'dome') B.mark('shadow', p.x, p.z, p.w * 1.1, p.w * 1.1, '#000000', 0, 0.3);
    else if (p.kind === 'shade') B.mark('shade', p.x, p.z, p.w, p.w * 0.6, '#000000', rng() * 3, 0.32);
    else if (p.kind === 'tower') B.mark('shadow', p.x, p.z, p.w * 1.2, p.w * 1.2, '#000000', 0, 0.45);
    else if (p.kind === 'art' || p.kind === 'man' || p.kind === 'temple') B.mark('shadow', p.x, p.z, p.w * 1.1, p.w * 1.1, '#000000', 0, 0.3);
    if (p.light && R.tod.glow > 0.6) B.light(p.x, p.z, p.w * 2.4, p.light, 0.55);
  }
  if (R.edgeGlow && tod.glow > 0.6) for (let i = 0; i < T.N; i += 8) for (const s of [-1, 1]) { const o = s * T.HW[i]; R.lights.push({ x: T.X[i] + T.NX[i] * o, z: T.Z[i] + T.NZ[i] * o, r: 6.5, col: R.edge[(i >> 3) % 2], i: 0.26 }); }
  R.paintGround = (x, tx, tz, k) => {
    for (const m of R.marks) {
      x.save(); x.translate(tx(m.x), tz(m.z)); x.rotate(m.ang); x.globalAlpha = m.a;
      const w = m.w * k, h = m.h * k;
      if (m.type === 'carpet') { x.fillStyle = m.col; x.fillRect(-w / 2, -h / 2, w, h); x.strokeStyle = shade(m.col, 0.4); x.lineWidth = Math.max(1, k * 0.4); x.strokeRect(-w / 2 + k, -h / 2 + k, w - 2 * k, h - 2 * k); x.fillStyle = shade(m.col, -0.3); x.fillRect(-w / 2, -h * 0.1, w, h * 0.2); }
      else if (m.type === 'shade') { x.fillStyle = 'rgba(40,30,20,1)'; x.fillRect(-w / 2, -h / 2, w, h); }
      else { const g = x.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h) / 2); g.addColorStop(0, rgba(m.col, 0.9)); g.addColorStop(1, rgba(m.col, 0)); x.fillStyle = g; x.scale(1, h / Math.max(1, w)); x.beginPath(); x.arc(0, 0, w / 2, 0, TAU); x.fill(); }
      x.restore();
    }
  };
  const jobs = [
    () => { R.albedo = KartPaint.ground(T, R); },
    () => { R.light = KartPaint.lightmap(T, R); R.lightData = R.light.getContext('2d').getImageData(0, 0, R.light.width, R.light.height).data; },
    () => { R.roadTex = KartPaint.road(R); R.wallTex = KartPaint.wall(R); },
    () => { R.band = KartPaint.band(T, R); },
    () => { KartPaint.detail(); }
  ];
  return { T, R, jobs };
}

// debug / test hooks (not used by the game itself)
KartRaceScene.dev = { KartTrack, KART_TRACKS, KART_TRACK_ORDER, kartSetupTrack, KartArt, KartGL };
