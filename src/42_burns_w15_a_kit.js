/* ============================================================
   BRADY-O BURNS — World 15 "EXODUS" (secret): kit
   Road spline, terrain, and the rounded models used by the world:
   the Party Barge RV (+ wings, unicorn form), patrol cars, the
   undercover convertible, jellyfish, rainbow arches, the ribbon road,
   talking-sign faces, gas station, diner, motel, hot springs, Gerlach.
   Everything here is our own design. Names are prefixed BW15.
   ============================================================ */

const BW15 = {
  // ---- the Exodus line (playa): four lanes heading +Z (south) toward the exit gate
  LANES: [-10.5, -3.5, 3.5, 10.5], PLAYER_LANE: 1, CORRIDORS: [-14, -7, 0, 7, 14],
  LINE_BACK: -800, LINE_END: -197, STOP_A: -452, STOP_B: -392, GATE_Z: -214, SPAWN_Z: -506, FENCE_X: 17.5,
  BIG_TIME: 38,           // seconds the gate stays open during THE BIG PULSE
  // ---- road (gate road + highway to Gerlach), s = metres from the dust bowl
  ROAD_CTRL: [[0, -205], [0, -120], [0, -30], [-4, 40], [-28, 105], [-74, 160], [-112, 228], [-112, 296], [-70, 348], [-10, 378], [52, 404], [100, 446], [116, 506], [92, 560], [42, 594], [4, 626], [-8, 680], [-10, 740], [-10, 820], [-10, 1000]],
  LANE_W: 3.7,
  S: { pave: 238, junction: 248, trap1: 352, gas: 462, furry: 548, check: 652, tailStart: 676, springsOut: 742, springsIn: 836, trap2: 962, welcome: 1030, diner: 1104, townEnd: 1170 },
  state: null
};
const BW15_RAINBOW = ['#ff3b5c', '#ff8a2a', '#ffe24a', '#7aff5a', '#38c8ff', '#6a6bff', '#c86bff'];

/* ---------------- small math helpers ---------------- */
function bw15Hsl(h, s, l) { return burnsHSL(((h % 360) + 360) % 360, s, l); }
function bw15Mix3(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
// float RGB straight from HSL (no hex cache: safe to call every frame with changing hues)
function bw15HslF(h, s, l, out) {
  h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  out = out || [0, 0, 0]; out[0] = r + m; out[1] = g + m; out[2] = b + m; return out;
}
function bw15Hash(x, z) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function bw15Noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = bw15Hash(ix, iz), b = bw15Hash(ix + 1, iz), c = bw15Hash(ix, iz + 1), d = bw15Hash(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
function bw15Fbm(x, z) { return bw15Noise(x, z) * 0.55 + bw15Noise(x * 2.07 + 5.3, z * 2.07 + 1.7) * 0.3 + bw15Noise(x * 4.3 + 9.1, z * 4.3 + 3.3) * 0.15; }

/* ---------------- the road: Catmull-Rom spline resampled every metre ---------------- */
const BW15_ROAD = {
  X: null, Z: null, TX: null, TZ: null, n: 0, len: 0,
  build() {
    if (this.X) return this;
    const C = BW15.ROAD_CTRL, dense = [];
    const cr = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t; return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); };
    for (let i = 0; i < C.length - 1; i++) {
      const p0 = C[Math.max(0, i - 1)], p1 = C[i], p2 = C[i + 1], p3 = C[Math.min(C.length - 1, i + 2)];
      for (let k = 0; k < 60; k++) { const t = k / 60; dense.push(cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t)); }
    }
    dense.push(C[C.length - 1][0], C[C.length - 1][1]);
    const nd = dense.length / 2, acc = new Float64Array(nd);
    for (let i = 1; i < nd; i++) acc[i] = acc[i - 1] + Math.hypot(dense[i * 2] - dense[i * 2 - 2], dense[i * 2 + 1] - dense[i * 2 - 1]);
    const len = acc[nd - 1], n = Math.floor(len) + 1;
    this.X = new Float32Array(n); this.Z = new Float32Array(n); this.TX = new Float32Array(n); this.TZ = new Float32Array(n);
    let j = 0;
    for (let i = 0; i < n; i++) {
      const s = Math.min(i, len);
      while (j < nd - 2 && acc[j + 1] < s) j++;
      const k = (s - acc[j]) / Math.max(1e-6, acc[j + 1] - acc[j]);
      this.X[i] = dense[j * 2] + (dense[j * 2 + 2] - dense[j * 2]) * k; this.Z[i] = dense[j * 2 + 1] + (dense[j * 2 + 3] - dense[j * 2 + 1]) * k;
    }
    for (let i = 0; i < n; i++) { const a = Math.max(0, i - 2), b = Math.min(n - 1, i + 2), dx = this.X[b] - this.X[a], dz = this.Z[b] - this.Z[a], l = Math.hypot(dx, dz) || 1; this.TX[i] = dx / l; this.TZ[i] = dz / l; }
    this.n = n; this.len = n - 1;
    return this;
  },
  // point on the road at arc length s, lateral offset lat (+ = left when facing along the road)
  at(s, lat, out) {
    this.build(); out = out || {};
    const f = clamp(s, 0, this.len), i = Math.min(this.n - 2, Math.floor(f)), k = f - i;
    const x = this.X[i] + (this.X[i + 1] - this.X[i]) * k, z = this.Z[i] + (this.Z[i + 1] - this.Z[i]) * k;
    let tx = this.TX[i] + (this.TX[i + 1] - this.TX[i]) * k, tz = this.TZ[i] + (this.TZ[i + 1] - this.TZ[i]) * k; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    lat = lat || 0;
    out.x = x + tz * lat; out.z = z - tx * lat; out.tx = tx; out.tz = tz; out.yaw = Math.atan2(tx, tz); out.s = f;
    return out;
  },
  // nearest road sample to (x,z): {s, lat, d}. hint = previous s (searches a window around it)
  project(x, z, hint, out) {
    this.build(); out = out || {};
    let best = -1, bd = Infinity;
    const scan = (a, b, step) => { for (let i = Math.max(0, a); i <= Math.min(this.n - 1, b); i += step) { const dx = x - this.X[i], dz = z - this.Z[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } } };
    if (hint !== undefined && hint !== null) scan(Math.floor(hint) - 60, Math.floor(hint) + 60, 1);
    if (best < 0 || bd > 900) { scan(0, this.n - 1, 6); const c = best; bd = Infinity; scan(c - 8, c + 8, 1); }
    const i = best, dx = x - this.X[i], dz = z - this.Z[i];
    const along = dx * this.TX[i] + dz * this.TZ[i];
    out.s = clamp(i + along, 0, this.len); out.lat = dx * this.TZ[i] - dz * this.TX[i]; out.d = Math.abs(out.lat); out.i = i;
    return out;
  },
  // gentle up-and-down of the paved highway (0 on the playa)
  height(s) {
    const ramp = BurnsM.smoothstep(BW15.S.junction - 10, BW15.S.junction + 80, s);
    const roll = 1.9 + 1.4 * Math.sin(s / 86 + 0.4) + 0.7 * Math.sin(s / 39 + 1.3);
    const town = BurnsM.smoothstep(BW15.S.welcome - 70, BW15.S.welcome - 10, s);
    return ramp * lerp(roll, 1.6, town);
  }
};

/* ---------------- terrain: playa in the north, dusty hills along the highway ----------------
   A height grid (3 m) baked once from distance-to-road, noise and flat pads (town, gas station,
   hot springs, the scenic hill). height(x,z) is a bilinear lookup. */
const BW15_TERR = {
  G: null, x0: -260, z0: -650, cell: 3, nx: 0, nz: 0,
  pads: [],     // {x, z, r, h, edge}  flatten to h within r (soft edge)
  bumps: [],    // {x, z, r, h}        extra hills (the scenic hill)
  tracks: [],   // [{pts:[[x,z,h]...], w}] flattened dirt tracks
  bounds: [-190, -580, 190, 800],
  build() {
    if (this.G) return this;
    const R = BW15_ROAD.build(), c = this.cell;
    const x1 = this.bounds[2] + 70, z1 = this.bounds[3] + 70;
    this.x0 = this.bounds[0] - 70; this.z0 = this.bounds[1] - 70;
    this.nx = Math.ceil((x1 - this.x0) / c) + 1; this.nz = Math.ceil((z1 - this.z0) / c) + 1;
    const N = this.nx * this.nz, D = new Float32Array(N).fill(999), SS = new Float32Array(N);
    // stamp distance-to-road from samples every 1.5 m
    const rad = 66, rc = Math.ceil(rad / c);
    for (let s = 0; s <= R.len; s += 1.5) {
      const i0 = Math.floor(s), x = R.X[i0], z = R.Z[i0];
      const cx = Math.round((x - this.x0) / c), cz = Math.round((z - this.z0) / c);
      for (let j = cz - rc; j <= cz + rc; j++) { if (j < 0 || j >= this.nz) continue; for (let i = cx - rc; i <= cx + rc; i++) { if (i < 0 || i >= this.nx) continue; const px = this.x0 + i * c, pz = this.z0 + j * c, d = Math.hypot(px - x, pz - z); const k = j * this.nx + i; if (d < D[k]) { D[k] = d; SS[k] = s; } } }
    }
    const G = this.G = new Float32Array(N);
    const B = this.bounds, ex0 = B[0] - 66, ex1 = B[2] + 66, ez0 = B[1] - 66, ez1 = B[3] + 66;
    for (let j = 0; j < this.nz; j++) for (let i = 0; i < this.nx; i++) {
      const k = j * this.nx + i, x = this.x0 + i * c, z = this.z0 + j * c;
      const d = D[k], s = SS[k];
      const hz = BurnsM.smoothstep(-25, 110, z);                        // hills only past the playa
      const rh = d < 900 ? R.height(s) : R.height(BW15.S.welcome);
      const rough = 4 + 13 * bw15Fbm(x / 85, z / 85);
      let hill = rough * BurnsM.smoothstep(11, 48, d) + 12 * BurnsM.smoothstep(55, 170, d) * bw15Fbm(x / 140 + 7, z / 140 + 3);
      let h = rh * BurnsM.smoothstep(-40, 20, z) + hill * hz;
      for (const b of this.bumps) { const dd = Math.hypot(x - b.x, z - b.z); if (dd < b.r) { const t = 1 - dd / b.r; h = Math.max(h, b.h * (t * t * (3 - 2 * t)) + (b.base || 0)); } }
      for (const T of this.tracks) {
        const P = T.pts; let bd = 1e9, bh = 0;
        for (let q = 0; q < P.length - 1; q++) { const ax = P[q][0], az = P[q][1], bx = P[q + 1][0], bz = P[q + 1][1], vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz || 1; const t = clamp(((x - ax) * vx + (z - az) * vz) / L2, 0, 1), qx = ax + vx * t, qz = az + vz * t, dd = Math.hypot(x - qx, z - qz); if (dd < bd) { bd = dd; bh = lerp(P[q][2], P[q + 1][2], t); } }
        const w = T.w || 5; if (bd < w + 14) h = lerp(bh, h, BurnsM.smoothstep(w, w + 14, bd));
      }
      for (const p of this.pads) { const dd = Math.hypot(x - p.x, z - p.z); if (dd < p.r + (p.edge || 18)) h = lerp(p.h, h, BurnsM.smoothstep(p.r, p.r + (p.edge || 18), dd)); }
      // fade back to playa level at the far edges (the horizon skirt is flat)
      const e = Math.min(x - ex0, ex1 - x, z - ez0, ez1 - z);
      h *= BurnsM.smoothstep(0, 46, e);
      G[k] = h;
    }
    return this;
  },
  h(x, z) {
    if (!this.G) this.build();
    const c = this.cell, fx = (x - this.x0) / c, fz = (z - this.z0) / c;
    const i = clamp(Math.floor(fx), 0, this.nx - 2), j = clamp(Math.floor(fz), 0, this.nz - 2), u = clamp(fx - i, 0, 1), v = clamp(fz - j, 0, 1);
    const G = this.G, k = j * this.nx + i;
    return (G[k] * (1 - u) + G[k + 1] * u) * (1 - v) + (G[k + this.nx] * (1 - u) + G[k + this.nx + 1] * u) * v;
  }
};

/* ---------------- characters: the cast (engine types when present, stand-ins otherwise) ---------------- */
const BW15_CAST = {
  known(type) { try { return !!(typeof BURNS_NPC_TYPES !== 'undefined' && BURNS_NPC_TYPES[type]); } catch (e) { return false; } },
  // returns actor-def fields {type, seed} or {type, spec}
  who(type, seed, extra) {
    if (this.known(type) && !extra) return { type, seed };
    const base = this.known(type) ? type : this.baseOf(type);
    const s = Object.assign(BurnsRig.npcSpec(base, seed || 0), this.known(type) ? {} : this.standIn(type, seed || 0), extra || {});
    s.key = 'bw15:' + type + ':' + (seed || 0) + (extra ? ':' + hashStr(JSON.stringify(extra)) : '');
    return { type: this.known(type) ? type : base, spec: s };
  },
  baseOf(type) { return ({ partiedtoohard: 'burner', burnermom: 'burner', burnerkid: 'burner', healer: 'burner', cop: 'ranger', soaker: 'burner', diner: 'burner', trucker: 'driver' })[type] || (this.known(type) ? type : 'burner'); },
  standIn(type, seed) {
    const r = mulberry32(hashStr('bw15si:' + type + ':' + seed));
    switch (type) {
      case 'partiedtoohard': return { face: 'tired', hair: { style: 'long', col: '#8a8478', hi: '#b8b2a8' }, top: { kind: 'button', col: '#f0c0d8', pattern: 'tiedye' }, bottom: { kind: 'cargo', col: '#7a6a5a' }, shoes: { kind: 'boots', col: '#6a5040' }, hat: null, goggles: false, glasses: null, coat: null, vest: null, led: null, paint: null, prop: 'water', acc: ['ledNecklace', 'bracelets', 'lei'] };
      case 'burnermom': return { face: 'greeter', hair: { style: 'bun', col: '#c8c8d0', hi: '#ffffff' }, hat: { kind: 'cowboy', col: '#e8d8a8' }, glasses: 'clear', goggles: false, top: { kind: 'button', col: '#ff9ac8' }, vest: 'fleece', vestCol: '#5aa05a', coat: null, bottom: { kind: 'jeans', col: '#6a8ac8' }, shoes: { kind: 'sneakers', col: '#f4f4f4', sole: '#d8d8d8' }, led: null, paint: null, acc: ['lei', 'bracelets'], prop: 'phone', body: { h: 0.94, w: 1.05 } };
      case 'burnerkid': return { face: 'kid', hat: { kind: 'furhat', col: '#38c8c8' }, glasses: 'shades', goggles: false, top: { kind: 'none' }, paint: 'rainbow', bottom: { kind: 'cargo', col: '#c8a878' }, shoes: { kind: 'furboots', col: '#ff9ad0' }, coat: null, vest: null, led: null, prop: null, acc: ['ledNecklace', 'bracelets', 'lei'], body: { h: 0.92, w: 0.9 } };
      case 'healer': return { skin: '#e8c0a0', skinSh: '#c89a7a', face: 'sleepy', top: { kind: 'tee', col: '#f8f6f0' }, coat: { kind: 'kimono', col: '#fbf8f2', trim: '#e8e0ff' }, bottom: { kind: 'leggings', col: '#f4f0e8' }, shoes: { kind: 'sneakers', col: '#e8c0a0', sole: '#d8a888' }, hat: null, goggles: false, glasses: null, hair: { style: 'long', col: '#c8a878', hi: '#f0d8a8' }, led: null, paint: null, vest: null, prop: null, acc: ['bracelets', 'lei'] };
      case 'soaker': return { top: { kind: 'none' }, paint: r.pick(['rainbow', 'tiedye', null]), bottom: { kind: 'shorts', col: r.pick(['#ff4fd8', '#38c8ff', '#ffe24a']) }, hat: r.chance(0.5) ? { kind: 'cowboy', col: '#e8d8a8' } : null, goggles: false, glasses: r.chance(0.6) ? 'shades' : null, coat: null, vest: null, led: null, prop: null, acc: ['lei'] };
      case 'cop': return { face: 'stern', hair: { style: 'buzz', col: r.pick(['#3a2a1a', '#5a4a3a', '#1a1412']), hi: '#6a5a4a' }, top: { kind: 'button', col: '#2c3a5a' }, vest: null, coat: null, bottom: { kind: 'cargo', col: '#1e2638' }, shoes: { kind: 'boots', col: '#121214', sole: '#0a0a0c' }, hat: { kind: 'ranger', col: '#5a4630' }, glasses: 'aviator', goggles: false, led: null, paint: null, prop: 'radio', acc: ['dutyBelt', 'badge', 'toolbelt'], body: { h: 1.02, w: 1.12 } };
      case 'diner': return { face: 'friendly', top: { kind: 'tee', col: '#ffffff' }, coat: null, vest: null, bottom: { kind: 'jeans', col: '#2a3a5a' }, shoes: { kind: 'sneakers', col: '#2a2a30' }, hat: { kind: 'cap', col: '#c83a3a' }, goggles: false, glasses: null, led: null, paint: null, prop: 'coffee', acc: [] };
      case 'trucker': return { face: 'beard', top: { kind: 'button', col: '#8a3a2a', pattern: 'plaid' }, bottom: { kind: 'jeans', col: '#2a3a5a' }, shoes: { kind: 'boots', col: '#3a2a1a' }, hat: { kind: 'cap', col: '#2a5a3a' }, glasses: null, goggles: false, coat: null, vest: null, led: null, paint: null, prop: 'coffee', acc: [] };
      default: return {};
    }
  }
};

/* ---------------- model kit (BurnsMesh builders; front = +Z, origin on the ground) ---------------- */
const BW15M = {
  DECK: 3.34,   // top of the Party Barge roof deck
  wheel(m, x, y, z, r, w) {
    m.push(); m.tf(x, y, z, 0, 0, Math.PI / 2);
    m.color('#1c1c22').shine(1); m.torus(0, 0, 0, r * 0.7, r * 0.3, { seg: m.segs(14, 8), tseg: m.segs(6, 4), sy: (w * 0.5) / (r * 0.3) });
    m.color('#c8c8d0').shine(2); m.roundCyl(0, -w * 0.32, 0, r * 0.45, w * 0.64, w * 0.2, { seg: m.segs(10, 6) });
    m.shine(0); m.pop();
  },
  // a flat decal on a side face: side = +1 (faces +X) | -1 (faces -X) | 2 (faces +Z) | -2 (faces -Z)
  sideDecal(m, side, x, y, z, w, h, reg) {
    m.push(); m.tf(x, y, z, side === 1 ? Math.PI / 2 : side === -1 ? -Math.PI / 2 : side === -2 ? Math.PI : 0); m.decal(0, 0, 0, w, h, reg); m.pop();
  },
  // the roof-deck furniture shared by the RV and the unicorn. The captain's helm and Chinka's chair sit in
  // the rear third so the chase camera always sees the two of them; the party lounge is up front.
  SEAT_Z: -2.0,
  deckKit(m, o) {
    const D = this.DECK, lights = [], SZ = this.SEAT_Z;
    o = o || {};
    // captain's chair (driver, +X side) and the helm
    m.color('#3a2a3e').shine(1); m.roundCyl(0.62, D, SZ, 0.12, 0.2, 0.04, { seg: 8 });
    m.color('#ff4fa8').shine(1); m.roundBox(0.62, D + 0.33, SZ, 0.64, 0.2, 0.62, 0.08); m.roundBox(0.62, D + 0.72, SZ - 0.31, 0.64, 0.6, 0.16, 0.08);
    m.color('#ffe24a'); m.roundBox(0.62, D + 1.05, SZ - 0.31, 0.5, 0.12, 0.14, 0.05);
    m.color('#5a3a26').shine(1); m.roundCyl(0.62, D, SZ + 0.77, 0.09, 0.72, 0.04, { seg: 8 });
    m.push(); m.tf(0.62, D + 0.86, SZ + 0.61, 0, -1.05); m.color('#2a1a10').shine(2); m.torus(0, 0, 0, 0.3, 0.04, { seg: 18, tseg: 6 });
    m.color('#c89a3a').shine(3); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; m.limb(0, 0, 0, Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3, 0.018, 0.018, { seg: 5 }); } m.ball(0, 0, 0, 0.07, { seg: 8, rings: 5 }); m.pop();
    // Chinka's striped beach chair (-X side) with her map holder
    m.color('#38c8c8').shine(1); m.roundBox(-0.62, D + 0.32, SZ, 0.62, 0.12, 0.6, 0.05);
    m.push(); m.tf(-0.62, D + 0.62, SZ - 0.27, 0, -0.35); m.roundBox(0, 0, 0, 0.62, 0.62, 0.1, 0.05); m.color('#ffffff'); m.roundBox(0, 0.12, 0.02, 0.63, 0.12, 0.1, 0.04); m.roundBox(0, -0.14, 0.02, 0.63, 0.12, 0.1, 0.04); m.pop();
    m.color('#d8d8de').shine(2); for (const sx of [-0.88, -0.36]) for (const sz of [SZ - 0.25, SZ + 0.25]) m.limb(sx, D, sz, sx, D + 0.3, sz, 0.025, 0.025, { seg: 5 });
    m.shine(0);
    // rails + string lights
    const L = o.deckLen || 7.6, z0 = o.deckZ0 === undefined ? -4.3 : o.deckZ0, W2 = 1.2;
    m.color('#e8e0d0').shine(2);
    const posts = [];
    for (let i = 0; i <= 6; i++) { const z = z0 + i * L / 6; posts.push([W2, z], [-W2, z]); }
    for (const [x, z] of posts) m.limb(x, D, z, x, D + 0.5, z, 0.035, 0.035, { seg: 6 });
    m.limb(W2, D + 0.5, z0, W2, D + 0.5, z0 + L, 0.03, 0.03, { seg: 6 }); m.limb(-W2, D + 0.5, z0, -W2, D + 0.5, z0 + L, 0.03, 0.03, { seg: 6 });
    m.limb(-W2, D + 0.5, z0, W2, D + 0.5, z0, 0.03, 0.03, { seg: 6 }); m.limb(-W2, D + 0.5, z0 + L, W2, D + 0.5, z0 + L, 0.03, 0.03, { seg: 6 });
    m.shine(0);
    for (let i = 0; i < 9; i++) { const z = z0 + 0.3 + i * (L - 0.6) / 8; lights.push({ x: W2, y: D + 0.46, z, s: 0.32, c: BURNS_NEON[i % 7] }, { x: -W2, y: D + 0.46, z, s: 0.32, c: BURNS_NEON[(i + 3) % 7] }); }
    // the party lounge up front: a couch facing back toward the helm, speakers, the disco ball
    const zf = z0 + L;
    m.color('#8a2a8a').shine(1); m.roundBox(0, D + 0.22, zf - 0.85, 1.9, 0.36, 0.75, 0.13); m.roundBox(0, D + 0.5, zf - 0.38, 1.9, 0.5, 0.2, 0.09);
    m.roundBox(0.9, D + 0.38, zf - 0.85, 0.2, 0.36, 0.75, 0.08); m.roundBox(-0.9, D + 0.38, zf - 0.85, 0.2, 0.36, 0.75, 0.08);
    m.color('#1a1a22').shine(1); for (const sx of [0.86, -0.86]) { m.roundBox(sx, D + 0.4, zf - 1.75, 0.42, 0.78, 0.4, 0.08); m.color('#3a3a46'); m.push(); m.tf(sx, D + 0.55, zf - 1.97, 0, -Math.PI / 2); m.roundCyl(0, -0.02, 0, 0.14, 0.04, 0.02, { seg: 10 }); m.pop(); m.color('#1a1a22'); }
    m.color('#9a9aa6').shine(2); m.limb(0, D, zf - 1.6, 0, D + 1.85, zf - 1.6, 0.03, 0.03, { seg: 6 });
    m.color('#e8eef8').shine(3); m.ball(0, D + 2.05, zf - 1.6, 0.28, { seg: m.segs(14, 8), rings: m.segs(10, 6), colFn: (x, y, z) => { const v = 0.75 + 0.25 * bw15Hash(Math.floor((x + 1) * 20), Math.floor((y + z + 2) * 20)); return rgbToHex(255 * v, 255 * v, 255 * Math.min(1, v + 0.05)); } });
    lights.push({ x: 0, y: D + 2.05, z: zf - 1.6, s: 1.1, c: '#ffffff' });
    // a rainbow flag on the back corner
    m.color('#7a6a5a').shine(1); m.limb(-W2 + 0.1, D + 0.5, z0 + 0.1, -W2 + 0.1, D + 2.5, z0 + 0.1, 0.03, 0.025, { seg: 6 });
    BW15_RAINBOW.forEach((c, i) => { m.color(c, 0.2); m.roundBox(-W2 + 0.1, D + 2.4 - i * 0.09, z0 - 0.35, 0.02, 0.09, 0.8, 0.01); });
    m.emissive(0).shine(0);
    return lights;
  },
  /* ---- the Party Barge: a beat-up, dusty, sticker-covered party RV ---- */
  rv(m) {
    const W = 2.6, D = this.DECK, r = mulberry32(1515);
    const body = '#efe4cc', dust = '#c9ad88';
    // chassis + wheels
    m.color('#2a2a30').shine(1); m.roundBox(0, 0.62, -0.2, W - 0.34, 0.44, 9.2, 0.16);
    for (const z of [3.3, -2.35, -3.25]) { this.wheel(m, 1.12, 0.46, z, 0.46, 0.32); this.wheel(m, -1.12, 0.46, z, 0.46, 0.32); }
    // the house (main box) + cab-over bunk + cab + hood
    m.color(body).shine(1); m.roundBox(0, 2.0, -1.25, W, 2.7, 7.1, 0.34);
    m.roundBox(0, 2.78, 2.85, W - 0.04, 1.08, 2.2, 0.42);
    m.roundBox(0, 1.42, 3.55, W - 0.08, 1.56, 2.3, 0.34);
    m.roundBox(0, 1.02, 4.42, W - 0.18, 0.78, 0.9, 0.3);
    // dusty skirt + dust smudges
    m.color(dust).shine(0); m.roundBox(0, 0.98, -1.25, W + 0.02, 0.58, 7.12, 0.22); m.roundBox(0, 0.86, 3.55, W - 0.06, 0.4, 2.32, 0.16);
    for (let i = 0; i < 9; i++) { const sd = i % 2 ? 1 : -1, z = -4.2 + r() * 7.6, y = 1.3 + r() * 1.2, s = 0.3 + r() * 0.5; m.color(shade(dust, r() * 0.1)); m.roundBox(sd * (W / 2 + 0.006), y, z, 0.02, s * 0.6, s, 0.05); }
    // rainbow swoosh stripes down both sides + across the back
    const stripes = ['#ff4fa8', '#ff9a2a', '#ffe24a', '#2ac8c8'];
    stripes.forEach((c, i) => { m.color(c).shine(1); const y = 1.48 + i * 0.15; m.roundBox(0, y, -1.25, W + 0.03, 0.12, 7.0, 0.05); m.roundBox(0, y - 0.05, 3.56, W - 0.05, 0.12, 2.2, 0.05); });
    m.shine(0);
    // windows (dark gloss), windshield, door
    m.color('#18202e').shine(3);
    for (const sd of [1, -1]) { for (const z of [-3.6, -1.6, 0.6]) m.roundBox(sd * (W / 2 + 0.005), 2.42, z, 0.04, 0.62, 1.0, 0.1); m.roundBox(sd * (W / 2 - 0.02), 1.95, 3.6, 0.06, 0.62, 1.05, 0.12); m.roundBox(sd * (W / 2 + 0.01), 2.85, 2.6, 0.04, 0.32, 0.8, 0.08); }
    m.push(); m.tf(0, 1.92, 4.55, 0, -0.32); m.roundBox(0, 0, 0, W - 0.4, 0.72, 0.08, 0.1); m.pop();
    m.color('#f4f0e6').shine(1); m.roundBox(-W / 2 - 0.01, 1.7, 1.3, 0.04, 1.85, 0.8, 0.1);
    m.color('#18202e').shine(3); m.roundBox(-W / 2 - 0.03, 2.25, 1.3, 0.03, 0.4, 0.45, 0.06);
    // bumpers, a cheeky grille grin, headlights + tail lights
    m.color('#3a3a44').shine(2); m.roundBox(0, 0.62, 4.82, W - 0.1, 0.26, 0.24, 0.1); m.roundBox(0, 0.68, -4.75, W - 0.1, 0.24, 0.24, 0.1);
    m.color('#2a2a30').shine(2); for (let i = 0; i < 9; i++) { const a = (i - 4) / 4; m.ball(a * 0.5, 0.96 - Math.cos(a * 1.2) * 0.12 + 0.12, 4.9, 0.055, { seg: 6, rings: 4 }); }
    m.color('#fff6d8', 1); for (const sx of [0.84, -0.84]) m.ball(sx, 1.08, 4.86, 0.15, { seg: 10, rings: 6, squash: 1 });
    m.color('#ff2a2a', 1); for (const sx of [1.05, -1.05]) m.roundBox(sx, 1.15, -4.79, 0.22, 0.42, 0.06, 0.04);
    m.emissive(0);
    // stickers (our own little designs) all over the sides and the back
    for (let i = 0; i < 34; i++) {
      const sd = i % 3 === 0 ? 2 : (i % 2 ? 1 : -1), s = 0.2 + r() * 0.26, c = r.pick(BURNS_NEON.concat(['#ffffff', '#ff9ad0']));
      m.color(c).shine(1);
      if (sd === 2) { const x = -1.0 + r() * 2.0, y = 1.4 + r() * 1.7; if (Math.abs(x - 0.5) < 0.35 && y > 1.2) continue; if (r() < 0.5) m.roundBox(x, y, -4.79, s, s, 0.02, s * 0.3); else { m.push(); m.tf(x, y, -4.79, 0, Math.PI / 2); m.roundCyl(0, -0.01, 0, s * 0.55, 0.02, 0.005, { seg: 10 }); m.pop(); } }
      else { const z = -4.3 + r() * 7.8, y = 1.2 + r() * 1.9; if (Math.abs(y - 2.42) < 0.38 && (Math.abs(z + 3.6) < 0.6 || Math.abs(z + 1.6) < 0.6 || Math.abs(z - 0.6) < 0.6)) continue; if (z > 2.3) continue; if (r() < 0.5) m.roundBox(sd * (W / 2 + 0.012), y, z, 0.02, s, s, s * 0.3); else { m.push(); m.tf(sd * (W / 2 + 0.012), y, z, 0, 0, Math.PI / 2); m.roundCyl(0, -0.01, 0, s * 0.55, 0.02, 0.005, { seg: 10 }); m.pop(); } }
    }
    m.shine(0);
    const nameReg = BURNS_ATLAS.sign('PARTY BARGE', { bg: '#2a1440', fg: '#ffe24a', size: 46, border: '#ff4fd8', round: 22, glow: '#ff4fd8' });
    m.color('#ffffff', 0.35); this.sideDecal(m, 1, W / 2 + 0.025, 2.98, -1.6, 2.7, 2.7 / nameReg.aspect, nameReg); this.sideDecal(m, -1, -W / 2 - 0.025, 2.98, -1.6, 2.7, 2.7 / nameReg.aspect, nameReg); m.emissive(0);
    const back1 = BURNS_ATLAS.sign('HONK IF\nYOU\'RE DUSTY', { bg: '#ffe24a', fg: '#2a1440', size: 34, round: 16 });
    const back2 = BURNS_ATLAS.sign('MY OTHER CAR\nIS AN ART CAR', { bg: '#38c8ff', fg: '#ffffff', size: 30, round: 14 });
    m.color('#ffffff'); this.sideDecal(m, -2, -0.55, 2.55, -4.81, 1.0, 1.0 / back1.aspect, back1); this.sideDecal(m, -2, 0.1, 1.55, -4.81, 1.1, 1.1 / back2.aspect, back2);
    // rear ladder + bike rack with two bikes + spare tyre cover
    m.color('#a8a8b2').shine(2); for (const sx of [0.62, 0.95]) m.limb(sx, 1.0, -4.84, sx, 3.36, -4.84, 0.03, 0.03, { seg: 5 }); for (let y = 1.25; y < 3.3; y += 0.35) m.limb(0.62, y, -4.86, 0.95, y, -4.86, 0.022, 0.022, { seg: 5 });
    m.shine(0); BurnsProps.bikeShape(m, -0.65, 0.95, -5.05, Math.PI / 2, '#ff4fd8'); BurnsProps.bikeShape(m, -0.05, 0.95, -5.15, Math.PI / 2, '#38f2ff');
    m.push(); m.tf(0.2, 2.15, -4.95, 0, Math.PI / 2); m.color('#ff4fa8').shine(1); m.roundCyl(0, -0.12, 0, 0.42, 0.24, 0.1, { seg: 16 }); m.color('#ffe24a', 0.3); m.torus(0, 0.125, 0, 0.3, 0.035, { seg: 16, tseg: 4 }); m.color('#2a1440'); m.ball(0, 0.12, 0, 0.12, { seg: 8, rings: 5 }); m.emissive(0).shine(0); m.pop();
    // roof AC unit + solar panel + the deck
    m.color('#e8e8ec').shine(1); m.roundBox(0, D - 0.02, -1.6, 0.9, 0.28, 0.9, 0.1);
    m.color('#a87a4a').shine(1); m.roundBox(0, D - 0.04, -0.6, W - 0.12, 0.1, 7.7, 0.04);
    m.color('#8a6038'); for (let z = -4.3; z < 3.3; z += 0.48) m.roundBox(0, D + 0.012, z, W - 0.16, 0.012, 0.04, 0.006);
    const lights = this.deckKit(m, {});
    m.shine(0).emissive(0);
    lights.push({ x: 0.84, y: 1.08, z: 4.95, s: 1.1, c: '#fff4d0', beam: 0 }, { x: -0.84, y: 1.08, z: 4.95, s: 1.1, c: '#fff4d0', beam: 0 }, { x: 1.05, y: 1.15, z: -4.9, s: 0.7, c: '#ff3020' }, { x: -1.05, y: 1.15, z: -4.9, s: 0.7, c: '#ff3020' });
    return {
      cols: [{ t: 'box', x: 0, z: -0.25, hx: W / 2, hz: 4.75, y0: 0.3, y1: D - 0.05, cover: true }],
      seat: [0.62, D - 0.42, this.SEAT_Z], poofers: [], w: W, len: 9.6, top: D, lights
    };
  },
  /* ---- unicorn form: a giant galloping unicorn with the same deck on its back ---- */
  unicorn(m) {
    const D = this.DECK;
    m.color('#fbf4ff').shine(2);
    m.ellipsoid(0, 2.12, -0.6, 1.5, 1.2, 4.0, { seg: m.segs(20, 12), rings: m.segs(14, 8) });
    m.ellipsoid(0, 2.25, 2.3, 1.35, 1.28, 1.6, { seg: m.segs(18, 10), rings: m.segs(12, 7) });
    m.limb(0, 2.9, 2.9, 0, 4.85, 4.35, 0.92, 0.62, { seg: m.segs(16, 10) });
    m.push(); m.tf(0, 5.05, 4.75, 0, 0.55);
    m.ellipsoid(0, 0, 0.35, 0.66, 0.72, 1.2, { seg: m.segs(18, 10), rings: m.segs(12, 7) });
    m.color('#ffd8ec'); m.ellipsoid(0, -0.18, 1.18, 0.55, 0.52, 0.55, { seg: m.segs(14, 8), rings: m.segs(10, 6) });
    m.color('#c86a9a'); for (const sx of [0.2, -0.2]) m.ellipsoid(sx, -0.12, 1.66, 0.07, 0.09, 0.05, { seg: 8, rings: 5 });
    m.color('#ffffff').shine(2); for (const sx of [0.52, -0.52]) m.ellipsoid(sx, 0.2, 0.55, 0.16, 0.24, 0.24, { seg: 12, rings: 8 });
    m.color('#2a1a3a').shine(3); for (const sx of [0.62, -0.62]) m.ellipsoid(sx, 0.18, 0.6, 0.08, 0.16, 0.15, { seg: 10, rings: 6 });
    m.color('#ffffff', 0.6); for (const sx of [0.68, -0.68]) m.ball(sx, 0.26, 0.66, 0.04, { seg: 6, rings: 4 }); m.emissive(0);
    m.color('#2a1a3a'); for (const sx of [1, -1]) for (let i = 0; i < 3; i++) m.limb(sx * 0.62, 0.42, 0.5 + i * 0.08, sx * 0.78, 0.55 + i * 0.03, 0.42 + i * 0.12, 0.018, 0.008, { seg: 4 });
    m.color('#fbf4ff').shine(1); for (const sx of [1, -1]) { m.push(); m.tf(sx * 0.36, 0.62, -0.25, 0, -0.35, -sx * 0.35); m.lathe([[0.17, 0], [0.13, 0.25], [0, 0.48]], { seg: 10, sz: 0.5 }); m.pop(); }
    m.push(); m.tf(0, 0.72, 0.45, 0, 0.45); m.color('#ffd24a', 0.4).shine(3); m.lathe([[0.16, 0], [0.14, 0.2], [0.11, 0.5], [0.07, 0.85], [0.03, 1.15], [0, 1.32]], { seg: 12 });
    m.color('#fff4b0', 0.6); for (let i = 0; i < 5; i++) { const y = 0.12 + i * 0.22, R0 = 0.155 - i * 0.026; m.torus(0, y, 0, R0, 0.022, { seg: 12, tseg: 4 }); } m.pop();
    m.pop();
    // rainbow mane + tail
    BW15_RAINBOW.forEach((c, i) => { const t = i / 6; m.color(c, 0.18).shine(1); m.ellipsoid(0, lerp(5.55, 3.25, t) + 0.3, lerp(4.55, 2.6, t) - 0.35, 0.3, 0.42, 0.5, { seg: 10, rings: 6 }); });
    BW15_RAINBOW.forEach((c, i) => { const a = (i - 3) * 0.16; m.color(c, 0.2).shine(1); m.limb(0, 2.75, -4.35, Math.sin(a) * 1.4, 1.2 - Math.abs(a) * 0.6, -5.6 - Math.cos(a) * 0.5, 0.2, 0.08, { seg: 8, mid: 0.2 }); });
    m.emissive(0);
    // saddle deck + the same furniture as the RV (Brady keeps driving from the helm)
    m.color('#ff4fa8').shine(1); m.roundBox(0, D - 0.12, 0.2, 2.5, 0.18, 6.0, 0.08);
    m.color('#a87a4a'); m.roundBox(0, D - 0.04, 0.2, 2.42, 0.1, 5.9, 0.04);
    const lights = this.deckKit(m, { deckLen: 5.6, deckZ0: -2.6 });
    for (let i = 0; i < 6; i++) lights.push({ x: (i % 2 ? 1 : -1) * 1.6, y: 2.2 + (i % 3) * 0.6, z: -3 + i, s: 0.5, c: '#ffffff', blink: 6 });
    m.shine(0).emissive(0);
    return { cols: [], lights };
  },
  unicornLeg(m) {
    m.color('#fbf4ff').shine(2); m.limb(0, 0, 0, 0, -1.05, 0.1, 0.46, 0.3, { seg: m.segs(12, 8), mid: 0.1 }); m.limb(0, -1.05, 0.1, 0, -1.85, -0.02, 0.3, 0.22, { seg: m.segs(12, 8) });
    m.color('#ff9ad0', 0.15); m.torus(0, -1.88, 0, 0.24, 0.07, { seg: 12, tseg: 5 });
    m.color('#ffd24a', 0.35).shine(3); m.roundCyl(0, -2.16, 0.03, 0.26, 0.28, 0.08, { seg: 12 });
    m.emissive(0).shine(0); return { cols: [] };
  },
  // feathered wing, pivot at the root, extends along +X (side = 1) or -X (side = -1)
  wing(m, side) {
    m.color('#fbf8ff', 0.25).shine(2);
    m.limb(0, 0, 0, side * 1.3, 0.45, -0.15, 0.2, 0.14, { seg: 10 }); m.limb(side * 1.3, 0.45, -0.15, side * 2.9, 0.85, -0.55, 0.14, 0.08, { seg: 10 });
    for (let i = 0; i < 7; i++) {
      const t = i / 6, x = side * lerp(0.4, 2.95, t), y = lerp(0.1, 0.8, t), len = lerp(1.2, 2.3, Math.sin(t * Math.PI * 0.85)) + 0.3;
      const col = BW15_RAINBOW[i];
      m.push(); m.tf(x, y - 0.2, -0.55 - len * 0.35, side * lerp(0.05, 0.35, t), 0.25);
      m.ellipsoid(0, 0, 0, 0.26, 0.07, len * 0.55, { seg: 10, rings: 6, colFn: (px, py, pz) => pz < -len * 0.2 ? col : '#fbf8ff' });
      m.pop();
    }
    m.emissive(0).shine(0); return { cols: [], lights: [{ x: side * 1.6, y: 0.5, z: -0.8, s: 2.2, c: '#fff0ff' }] };
  },
  /* ---- highway patrol car (our own generic design: no real agency names or insignia) ---- */
  patrolCar(m, o) {
    o = o || {}; const W = 2.0, L = 4.9;
    m.color('#f6f6fa').shine(2); m.roundBox(0, 0.72, 0, W, 0.72, L, 0.3);
    m.color('#1c2a4c').shine(2); m.roundBox(0, 1.02, 1.62, W - 0.12, 0.18, 1.55, 0.1); m.roundBox(0, 1.02, -1.78, W - 0.12, 0.18, 1.3, 0.1);
    m.roundBox(0, 0.52, 0, W + 0.02, 0.3, L - 0.3, 0.12);
    m.color('#f6f6fa').shine(2); m.roundBox(0, 1.34, -0.28, W - 0.24, 0.6, 2.45, 0.26);
    m.color('#141a28').shine(3); m.roundBox(0, 1.38, -0.28, W - 0.2, 0.36, 2.28, 0.14);
    m.color('#1a1a20').shine(1); m.roundBox(0, 1.72, -0.15, 1.36, 0.13, 0.34, 0.06);
    m.color('#ff2a3a', 0.65); m.roundBox(0.36, 1.8, -0.15, 0.58, 0.12, 0.28, 0.05);
    m.color('#2a5aff', 0.65); m.roundBox(-0.36, 1.8, -0.15, 0.58, 0.12, 0.28, 0.05); m.emissive(0);
    m.color('#1a1a20').shine(1); m.roundBox(0, 0.8, 2.56, W - 0.3, 0.42, 0.14, 0.06); for (const sx of [0.55, -0.55]) m.limb(sx, 0.55, 2.62, sx, 1.08, 2.62, 0.04, 0.04, { seg: 5 });
    const tag = BURNS_ATLAS.sign('PATROL', { bg: '#f6f6fa', fg: '#1c2a4c', size: 38, pad: 6 });
    this.sideDecal(m, 1, W / 2 + 0.012, 0.86, 0.25, 1.5, 1.5 / tag.aspect, tag); this.sideDecal(m, -1, -W / 2 - 0.012, 0.86, 0.25, 1.5, 1.5 / tag.aspect, tag);
    m.color('#d8b040').shine(3); for (const sd of [1, -1]) { m.push(); m.tf(sd * (W / 2 + 0.02), 0.9, -0.95, 0, 0, Math.PI / 2); m.roundCyl(0, -0.012, 0, 0.17, 0.024, 0.008, { seg: 10 }); m.pop(); }
    m.color('#fff6d8', 1); for (const sx of [0.65, -0.65]) m.roundBox(sx, 0.86, L / 2 - 0.02, 0.36, 0.16, 0.06, 0.05);
    m.color('#ff2a2a', 1); for (const sx of [0.7, -0.7]) m.roundBox(sx, 0.9, -L / 2 + 0.02, 0.32, 0.16, 0.06, 0.05); m.emissive(0).shine(0);
    for (const z of [1.5, -1.5]) { this.wheel(m, 0.92, 0.36, z, 0.36, 0.26); this.wheel(m, -0.92, 0.36, z, 0.36, 0.26); }
    return {
      cols: [{ t: 'box', x: 0, z: 0, hx: W / 2, hz: L / 2, y0: 0, y1: 1.65, cover: true }],
      lights: [{ x: 0.36, y: 1.86, z: -0.15, s: 1.6, c: '#ff2030' }, { x: -0.36, y: 1.86, z: -0.15, s: 1.6, c: '#2050ff' }, { x: 0.65, y: 0.86, z: L / 2 + 0.1, s: 0.9, c: '#fff0c8', beam: 0 }, { x: -0.65, y: 0.86, z: L / 2 + 0.1, s: 0.9, c: '#fff0c8', beam: 0 }],
      len: L, w: W, top: 1.65
    };
  },
  /* ---- the undercover cop's beige convertible (subtle, he thinks) ---- */
  unmarked(m) {
    const W = 2.0, L = 4.8;
    m.color('#cdb98e').shine(2); m.roundBox(0, 0.7, 0, W, 0.66, L, 0.28);
    m.color('#b8a47a'); m.roundBox(0, 0.98, 1.55, W - 0.12, 0.14, 1.5, 0.08); m.roundBox(0, 0.98, -1.7, W - 0.12, 0.14, 1.2, 0.08);
    m.color('#6a1a1a').shine(1); m.roundBox(0, 0.98, -0.2, W - 0.3, 0.2, 2.2, 0.08); for (const z of [0.55, -0.85]) m.roundBox(0, 1.25, z - 0.35, W - 0.4, 0.55, 0.16, 0.07);
    m.color('#1a2232').shine(3); m.push(); m.tf(0, 1.32, 0.98, 0, -0.45); m.roundBox(0, 0, 0, W - 0.25, 0.5, 0.06, 0.05); m.pop();
    m.color('#2a2a30').shine(1); m.push(); m.tf(0.55, 1.12, 0.62, 0, -1.0); m.torus(0, 0, 0, 0.18, 0.025, { seg: 12, tseg: 4 }); m.pop();
    m.color('#8a8a92').shine(2); m.limb(-0.8, 1.0, -2.2, -0.8, 2.3, -2.25, 0.012, 0.008, { seg: 4 });
    m.color('#ff2a3a', 0.9); m.roundBox(0.25, 1.06, 1.0, 0.18, 0.08, 0.08, 0.03); m.emissive(0);
    m.color('#fff6d8', 1); for (const sx of [0.62, -0.62]) m.roundBox(sx, 0.82, L / 2 - 0.02, 0.32, 0.14, 0.06, 0.05); m.emissive(0).shine(0);
    for (const z of [1.5, -1.5]) { this.wheel(m, 0.92, 0.36, z, 0.36, 0.26); this.wheel(m, -0.92, 0.36, z, 0.36, 0.26); }
    return { cols: [{ t: 'box', x: 0, z: 0, hx: W / 2, hz: L / 2, y0: 0, y1: 1.1, cover: true }], lights: [{ x: 0.25, y: 1.1, z: 1.05, s: 0.6, c: '#ff2030' }], len: L, w: W, top: 1.1 };
  },
  /* ---- trip visions ---- */
  jellyfish(m, o) {
    const hue = o.hue || 300, c1 = bw15Hsl(hue, 0.85, 0.78), c2 = bw15Hsl(hue + 40, 0.9, 0.62), c3 = bw15Hsl(hue - 50, 0.9, 0.7);
    m.color(c1, 0.55).shine(3); m.ellipsoid(0, 0, 0, 3.2, 2.3, 3.2, { seg: m.segs(20, 12), rings: m.segs(10, 6), phi1: Math.PI * 0.55 });
    m.color(c2, 0.7); m.ellipsoid(0, -0.2, 0, 1.6, 1.4, 1.6, { seg: 14, rings: 8 });
    m.color(c3, 0.6); m.torus(0, -0.35, 0, 3.05, 0.28, { seg: m.segs(24, 14), tseg: 6 });
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU, x = Math.sin(a) * 2.6, z = Math.cos(a) * 2.6, len = 5 + (i % 3) * 1.6;
      m.color(i % 2 ? c1 : c3, 0.55); m.limb(x, -0.4, z, x * 1.08, -len * 0.5, z * 1.08, 0.12, 0.08, { seg: 6 }); m.limb(x * 1.08, -len * 0.5, z * 1.08, x * 0.9, -len, z * 0.9, 0.08, 0.03, { seg: 6 });
    }
    m.color(c2, 0.65); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; m.limb(0, -0.6, 0, Math.sin(a) * 0.9, -4.2, Math.cos(a) * 0.9, 0.42, 0.12, { seg: 8, mid: 0.25 }); }
    m.emissive(0).shine(0);
    return { cols: [], lights: [{ x: 0, y: -0.4, z: 0, s: 7, c: c1 }] };
  },
  rainbowArch(m, o) {
    const R = o.R || 34;
    BW15_RAINBOW.forEach((c, i) => { m.color(c, 0.85); m.push(); m.tf(0, 0, 0, 0, Math.PI / 2); m.torus(0, 0, 0, R - i * 1.1, 0.62, { seg: m.segs(56, 30), tseg: 6 }); m.pop(); });
    m.emissive(0); return { cols: [] };
  },
  // a 6 m slab of the highway for the rippling-ribbon effect (trim colour per segment)
  ribbonSeg(m, o) {
    const L = 6.4;
    m.color('#3c3c46').shine(1); m.roundBox(0, -0.12, 0, 7.6, 0.24, L, 0.08);
    m.color('#f2f2ea', 0.25); for (const sx of [3.45, -3.45]) m.roundBox(sx, 0.005, 0, 0.14, 0.03, L - 0.1, 0.01);
    m.color('#ffd23a', 0.35); m.roundBox(0, 0.005, -1.4, 0.14, 0.03, 3.0, 0.01);
    m.color(o.col, 0.95); for (const sx of [3.9, -3.9]) m.roundBox(sx, -0.12, 0, 0.32, 0.26, L, 0.1);
    m.emissive(0).shine(0); return { cols: [] };
  },
  eye(m) { m.color('#ffffff').shine(2); m.ball(0, 0, 0, 0.26, { seg: 12, rings: 8 }); m.color('#141018').shine(3); m.ball(0, 0, 0.2, 0.12, { seg: 10, rings: 6 }); m.color('#ffffff', 0.8); m.ball(0.04, 0.05, 0.3, 0.035, { seg: 6, rings: 4 }); m.emissive(0).shine(0); return { cols: [] }; },
  mouthOpen(m) { m.color('#5a0a1a').shine(1); m.ellipsoid(0, 0, 0, 0.42, 0.26, 0.08, { seg: 14, rings: 6 }); m.color('#ff7a9a'); m.ellipsoid(0, -0.1, 0.05, 0.22, 0.09, 0.05, { seg: 10, rings: 5 }); m.shine(0); return { cols: [] }; },
  mouthShut(m) { m.color('#2a0a12'); for (let i = 0; i < 7; i++) { const a = (i - 3) / 3; m.ball(a * 0.36, -Math.cos(a * 1.1) * 0.08 + 0.04, 0, 0.055, { seg: 6, rings: 4 }); } return { cols: [] }; },
  barrier(m) { m.color('#2a2a30').shine(1); m.roundBox(0, -0.55, 0, 0.42, 1.1, 0.42, 0.1); m.color('#f4f4f0'); m.roundBox(2.5, 0, 0, 5.0, 0.2, 0.18, 0.08); m.color('#e82a3a'); for (let k = 0; k < 3; k++) m.roundBox(1.1 + k * 1.4, 0, 0, 0.7, 0.22, 0.2, 0.08); m.color('#ff3030', 1); m.ball(4.9, 0.16, 0, 0.1, { seg: 8, rings: 5 }); m.emissive(0).shine(0); return { cols: [] }; },
  lamp(m, o) { m.color(o.col, 1).shine(3); m.ball(0, 0, 0, 0.42, { seg: 12, rings: 8 }); m.emissive(0).shine(0); return { cols: [], lights: [{ x: 0, y: 0, z: 0.3, s: 2.6, c: o.col }] }; },
  /* ---- static scenery helpers (used through api.mesh) ---- */
  pulseTower(m, o) {
    m.color('#5a5a64').shine(1); m.roundCyl(0, 0, 0, 0.22, 7.2, 0.06, { seg: 10 });
    m.color('#1a1a22').shine(1); m.roundBox(0, 6.4, 0.3, 1.2, 2.3, 0.9, 0.22);
    m.color('#2a0a0a').shine(3); m.ball(0, 6.95, 0.75, 0.4, { seg: 10, rings: 6 }); m.color('#0a2a0a'); m.ball(0, 5.85, 0.75, 0.4, { seg: 10, rings: 6 });
    m.color('#ffe24a', 0.4); m.roundBox(0, 7.75, 0.3, 1.25, 0.28, 0.95, 0.12); m.emissive(0).shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.3, y0: 0, y1: 7.2 }] };
  },
  booth(m, o) {
    m.color(o.col || '#ff4fd8').shine(1); m.roundBox(0, 1.25, 0, 1.6, 2.5, 2.4, 0.3);
    m.color('#18202e').shine(3); for (const sx of [0.81, -0.81]) m.roundBox(sx, 1.65, 0, 0.04, 0.8, 1.6, 0.1);
    m.color('#f4f0e6').shine(1); m.roundBox(0, 2.62, 0, 2.0, 0.24, 2.8, 0.12);
    m.color(o.col || '#ff4fd8', 0.9); m.roundBox(0, 2.82, 0, 1.4, 0.16, 2.2, 0.08); m.emissive(0).shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.85, hz: 1.25, y0: 0, y1: 2.7, cover: true }], lights: [{ x: 0, y: 2.9, z: 0, s: 1.6, c: o.col || '#ff4fd8', pool: 5, i: 0.3 }] };
  },
  billboard(m, o) {
    m.color('#6a4a2e').shine(1); for (const sx of [-2.6, 2.6]) m.roundCyl(sx, 0, 0, 0.18, 4.4, 0.05, { seg: 8 });
    m.color('#f4ecd8').shine(1); m.roundBox(0, 4.6, 0, 7.4, 3.2, 0.3, 0.14);
    const reg = BURNS_ATLAS.sign(o.text, Object.assign({ bg: '#2a1440', fg: '#ffe24a', size: 40, round: 14, border: '#ff4fd8' }, o.style || {}));
    const w = 6.9, h = Math.min(2.8, w / reg.aspect); m.color('#ffffff'); m.decal(0, 4.6, 0.16, w, h, reg); m.push(); m.tf(0, 0, 0, Math.PI); m.color('#c8b898'); m.roundBox(0, 4.6, 0.02, 7.2, 3.0, 0.1, 0.08); m.pop();
    m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 3.7, hz: 0.25, y0: 3.0, y1: 6.2, cover: true }, { t: 'cyl', x: -2.6, z: 0, r: 0.25, y0: 0, y1: 4.4 }, { t: 'cyl', x: 2.6, z: 0, r: 0.25, y0: 0, y1: 4.4 }] };
  },
  roadSign(m, o) {
    const reg = BURNS_ATLAS.sign(o.text, Object.assign({ bg: '#f4f4ee', fg: '#1a1a22', size: 40, round: 10, border: '#1a1a22', pad: 14 }, o.style || {}));
    const w = o.w || 2.2, h = w / reg.aspect, y = o.y || 2.0;
    m.color('#8a8a92').shine(2); m.roundCyl(0, 0, -0.08, 0.06, y + h / 2, 0.02, { seg: 8 });
    m.color(o.back || '#9a9aa2').shine(1); m.roundBox(0, y + h / 2, 0, w + 0.1, h + 0.1, 0.08, 0.04);
    m.color('#ffffff', o.e || 0); m.decal(0, y + h / 2, 0.045, w, h, reg); m.emissive(0).shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: -0.08, r: 0.12, y0: 0, y1: y + h, camPass: true }], top: y + h, h };
  },
  sage(m, rng, n, spread) {
    m.lo = true;
    for (let i = 0; i < n; i++) {
      const a = rng() * TAU, d = Math.sqrt(rng()) * spread, x = Math.sin(a) * d, z = Math.cos(a) * d, s = 0.45 + rng() * 0.6;
      m.color(rng.pick(['#8a9a78', '#7a8a6a', '#9aa888', '#a8a88a'])); m.ellipsoid(x, s * 0.55, z, s, s * 0.7, s);
      m.color(rng.pick(['#9aaa88', '#8a9a7a'])); m.ellipsoid(x + s * 0.35, s * 0.75, z - s * 0.2, s * 0.6, s * 0.5, s * 0.6);
    }
    m.lo = false; return { cols: [] };
  },
  rock(m, rng, s) { m.color(rng.pick(['#8a7a6a', '#7a6a5e', '#9a8a78'])).shine(0); m.ellipsoid(0, s * 0.35, 0, s, s * 0.62, s * 0.85, { seg: 10, rings: 6 }); m.ellipsoid(s * 0.4, s * 0.25, s * 0.3, s * 0.55, s * 0.45, s * 0.5, { seg: 8, rings: 5 }); return { cols: [{ t: 'dome', x: 0, z: 0, r: s * 0.9, y0: -s * 0.2 }] }; },
  pole(m) { m.color('#6a5038').shine(0); m.roundCyl(0, 0, 0, 0.16, 8.4, 0.04, { seg: 8 }); m.color('#5a4030'); m.roundBox(0, 7.9, 0, 2.4, 0.16, 0.16, 0.05); m.color('#d8e0e8').shine(2); for (const sx of [-1, 0, 1]) m.roundCyl(sx, 7.98, 0, 0.06, 0.2, 0.02, { seg: 6 }); m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.22, y0: 0, y1: 8.4, camPass: true }] }; },
  reflector(m) { m.color('#f4f4f0').shine(1); m.roundBox(0, 0.55, 0, 0.12, 1.1, 0.08, 0.04); m.color('#ff9a2a', 0.85); m.roundBox(0, 0.92, 0.045, 0.08, 0.16, 0.02, 0.01); m.emissive(0).shine(0); return { cols: [] }; },
  cone(m) { m.color('#ff6a1a').shine(1); m.lathe([[0.3, 0], [0.3, 0.06], [0.05, 0.85], [0, 0.88]], { seg: 10 }); m.color('#f4f4f0', 0.4); m.lathe([[0.17, 0.42], [0.12, 0.56]], { seg: 10 }); m.color('#1a1a1e'); m.roundBox(0, 0.03, 0, 0.62, 0.06, 0.62, 0.03); m.emissive(0).shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.3, y0: 0, y1: 0.8 }] }; },
  gasStation(m) {
    // canopy over two pump islands + a tiny shop + the tall GAS sign
    m.color('#e8e8ec').shine(1); for (const [x, z] of [[-4.5, -3], [4.5, -3], [-4.5, 3], [4.5, 3]]) m.roundCyl(x, 0, z, 0.25, 4.6, 0.06, { seg: 10 });
    m.color('#f6f4ee').shine(1); m.roundBox(0, 4.85, 0, 12.5, 0.6, 9.5, 0.25); m.color('#e83a3a'); m.roundBox(0, 4.85, 0, 12.6, 0.24, 9.6, 0.1);
    for (const x of [-3, 3]) { m.color('#8a8a92').shine(1); m.roundBox(x, 0.12, 0, 1.6, 0.24, 5.2, 0.1); m.color('#e83a3a').shine(2); m.roundBox(x, 1.0, -1.2, 0.8, 1.8, 0.5, 0.15); m.roundBox(x, 1.0, 1.2, 0.8, 1.8, 0.5, 0.15); m.color('#7aff9a', 0.9); m.roundBox(x, 1.45, -0.94, 0.5, 0.3, 0.04, 0.03); m.roundBox(x, 1.45, 1.46, 0.5, 0.3, 0.04, 0.03); m.emissive(0); m.color('#2a2a30'); m.limb(x + 0.42, 1.2, -1.2, x + 0.6, 0.6, -1.0, 0.035, 0.035, { seg: 5 }); m.limb(x + 0.42, 1.2, 1.2, x + 0.6, 0.6, 1.4, 0.035, 0.035, { seg: 5 }); }
    // shop
    m.color('#efe0c0').shine(1); m.roundBox(-0.5, 1.7, -11.5, 10, 3.4, 6, 0.3); m.color('#c83a2a'); m.roundBox(-0.5, 3.5, -11.5, 10.3, 0.3, 6.3, 0.12);
    m.color('#18202e').shine(3); m.roundBox(-1.2, 1.5, -8.48, 5.5, 1.9, 0.06, 0.1); m.color('#5a3a26').shine(1); m.roundBox(3, 1.15, -8.47, 1.2, 2.3, 0.06, 0.08);
    const shopSign = BURNS_ATLAS.sign('GAS · ICE · COFFEE', { bg: '#c83a2a', fg: '#ffffff', size: 36, round: 10, pad: 10 });
    m.color('#ffffff', 0.4); m.decal(-0.5, 3.0, -8.4, 6.5, 6.5 / shopSign.aspect, shopSign); m.emissive(0);
    m.color('#f4f4f8').shine(1); m.roundBox(-5.6, 0.75, -8.0, 1.6, 1.5, 0.9, 0.15); m.color('#38a8ff'); m.roundBox(-5.6, 1.3, -7.54, 1.0, 0.3, 0.04, 0.04);
    // tall GAS sign
    m.color('#8a8a92').shine(2); m.roundCyl(7.8, 0, -6, 0.2, 7.5, 0.05, { seg: 10 });
    const gs = BURNS_ATLAS.sign('GAS', { bg: '#ffe24a', fg: '#c83a2a', size: 70, round: 18, pad: 14 });
    m.color('#ffe24a', 0.3).shine(1); m.roundBox(7.8, 8.2, -6, 3.2, 3.2 / gs.aspect + 0.2, 0.4, 0.15); m.color('#ffffff', 0.5); m.decal(7.8, 8.2, -5.78, 3.0, 3.0 / gs.aspect, gs); m.push(); m.tf(7.8, 0, -6, Math.PI); m.decal(0, 8.2, 0.22, 3.0, 3.0 / gs.aspect, gs); m.pop(); m.emissive(0).shine(0);
    return {
      cols: [{ t: 'box', x: -0.5, z: -11.5, hx: 5.1, hz: 3.1, y0: 0, y1: 3.6, cover: true }, { t: 'box', x: -3, z: 0, hx: 0.5, hz: 1.6, y0: 0, y1: 1.9 }, { t: 'box', x: 3, z: 0, hx: 0.5, hz: 1.6, y0: 0, y1: 1.9 }, { t: 'cyl', x: 7.8, z: -6, r: 0.3, y0: 0, y1: 7.5 }].concat([[-4.5, -3], [4.5, -3], [-4.5, 3], [4.5, 3]].map(([x, z]) => ({ t: 'cyl', x, z, r: 0.3, y0: 0, y1: 4.6 }))),
      lights: [{ x: 0, y: 4.4, z: 0, s: 3, c: '#fff4d8', pool: 12, i: 0.35 }, { x: 7.8, y: 8.2, z: -5.6, s: 4, c: '#ffe24a' }]
    };
  },
  diner(m) {
    // a rounded, chrome-and-red roadside diner (our own design)
    m.color('#d8dce6').shine(3); m.roundBox(0, 2.1, 0, 18, 3.8, 7.4, 1.2);
    m.color('#e8303a').shine(2); m.roundBox(0, 1.25, 0, 18.1, 0.7, 7.5, 0.3); m.roundBox(0, 3.95, 0, 18.1, 0.3, 7.5, 0.15);
    m.color('#ffe8b0', 0.55).shine(3); m.roundBox(0, 2.55, 3.66, 15.4, 1.3, 0.12, 0.1); m.roundBox(0, 2.55, -3.66, 15.4, 1.3, 0.12, 0.1); m.emissive(0);
    m.color('#5a5a66').shine(2); for (let x = -7; x <= 7; x += 1.4) m.roundBox(x, 2.55, 3.74, 0.08, 1.3, 0.05, 0.02);
    m.color('#d8dce6').shine(3); m.roundBox(0, 2.0, 4.5, 3, 3.4, 1.8, 0.4); m.color('#2a1a14'); m.roundBox(0, 1.3, 5.42, 1.4, 2.4, 0.06, 0.1);
    m.color('#f4f0e8').shine(1); m.roundBox(0, 4.35, 0, 18.4, 0.5, 7.8, 0.25);
    const ds = BURNS_ATLAS.sign('DINER', { bg: '#1a0a14', fg: '#ff4f6a', size: 80, round: 20, pad: 16, glow: '#ff2a4a', border: '#ff4f6a' });
    m.color('#ffffff', 0.9); m.push(); m.tf(-2.5, 6.2, 0.4); m.decal(0, 0, 0, 6.5, 6.5 / ds.aspect, ds); m.tf(0, 0, -0.3, Math.PI); m.decal(0, 0, 0, 6.5, 6.5 / ds.aspect, ds); m.pop(); m.emissive(0);
    m.color('#1a0a14').shine(1); m.roundBox(-2.5, 6.2, 0.25, 6.7, 6.7 / ds.aspect + 0.15, 0.24, 0.1); m.color('#8a8a92').shine(2); for (const sx of [-4.5, -0.5]) m.limb(sx, 4.5, 0.25, sx, 5.6, 0.25, 0.06, 0.06, { seg: 6 });
    const bs = BURNS_ATLAS.sign('BREAKFAST\nALL DAY', { bg: '#ffe24a', fg: '#c8303a', size: 44, round: 14, pad: 12 });
    m.color('#ffffff', 0.4); m.decal(5.5, 5.4, 0.3, 3.4, 3.4 / bs.aspect, bs); m.emissive(0); m.color('#c8a020'); m.roundBox(5.5, 5.4, 0.18, 3.6, 3.4 / bs.aspect + 0.2, 0.16, 0.08); m.color('#8a8a92'); m.limb(5.5, 4.5, 0.2, 5.5, 5.0, 0.2, 0.06, 0.06, { seg: 6 });
    m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 9.1, hz: 3.8, y0: 0, y1: 4.6, cover: true }, { t: 'box', x: 0, z: 4.5, hx: 1.5, hz: 0.9, y0: 0, y1: 3.7 }], lights: [{ x: -2.5, y: 6.2, z: 0.6, s: 5, c: '#ff4f6a', pool: 14, i: 0.4 }, { x: 0, y: 2.6, z: 4.4, s: 2.4, c: '#ffe8b0' }] };
  },
  motel(m) {
    m.color('#f0d8b8').shine(1); m.roundBox(0, 1.6, 0, 22, 3.2, 6, 0.3); m.color('#2ac8a8'); m.roundBox(0, 3.35, 0, 22.4, 0.3, 6.4, 0.12);
    for (let i = 0; i < 7; i++) { const x = -9 + i * 3; m.color(BURNS_NEON[i % 7]).shine(1); m.roundBox(x, 1.1, 3.02, 1.0, 2.1, 0.06, 0.08); m.color('#18202e').shine(3); m.roundBox(x + 1.15, 1.7, 3.02, 0.9, 0.8, 0.05, 0.06); }
    const ms = BURNS_ATLAS.sign('MOTEL', { bg: '#2ac8a8', fg: '#ffffff', size: 64, round: 16, pad: 12 }), vs = BURNS_ATLAS.sign('VACANCY', { bg: '#1a0a14', fg: '#ff4fd8', size: 40, round: 10, pad: 8, glow: '#ff4fd8' });
    m.color('#8a8a92').shine(2); m.roundCyl(13, 0, 2, 0.18, 6, 0.05, { seg: 8 }); m.color('#ffffff', 0.3); m.decal(13, 6.6, 2.25, 3.4, 3.4 / ms.aspect, ms); m.color('#ffffff', 0.9); m.decal(13, 5.2, 2.25, 2.6, 2.6 / vs.aspect, vs); m.emissive(0); m.color('#2ac8a8'); m.roundBox(13, 6.0, 2.05, 3.6, 2.6, 0.3, 0.12);
    m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 11.1, hz: 3.1, y0: 0, y1: 3.5, cover: true }, { t: 'cyl', x: 13, z: 2, r: 0.3, y0: 0, y1: 6 }], lights: [{ x: 13, y: 5.2, z: 2.6, s: 3, c: '#ff4fd8', pool: 8, i: 0.3 }] };
  },
  house(m, rng) {
    const w = 7 + rng() * 3, d = 6 + rng() * 2, col = rng.pick(['#e8d8b8', '#d8e0e8', '#f0e0c8', '#c8d8c0', '#e8c8b8']);
    m.color(col).shine(1); m.roundBox(0, 1.4, 0, w, 2.8, d, 0.22);
    const rc = rng.pick(['#7a4a3a', '#5a5a6a', '#8a5a2a']); m.color(rc);
    for (const sd of [1, -1]) { m.push(); m.tf(0, 3.2, sd * d / 4, 0, sd * 0.5); m.roundBox(0, 0, 0, w + 0.5, 0.2, d / 2 + 0.6, 0.08); m.pop(); }
    m.color('#5a3a26'); m.roundBox(-w / 4, 1.05, d / 2 + 0.03, 1.0, 2.1, 0.06, 0.06); m.color('#18202e').shine(3); m.roundBox(w / 5, 1.6, d / 2 + 0.03, 1.4, 1.0, 0.05, 0.06);
    m.color('#e8e0d0').shine(1); m.roundBox(0, 0.15, d / 2 + 1.0, w * 0.8, 0.3, 2.0, 0.08); m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: w / 2, hz: d / 2, y0: 0, y1: 4.2, cover: true }] };
  },
  waterTower(m) {
    m.color('#8a8a92').shine(2); for (const [x, z] of [[2, 2], [-2, 2], [2, -2], [-2, -2]]) m.limb(x, 0, z, x * 0.6, 12, z * 0.6, 0.18, 0.14, { seg: 6 });
    m.color('#e8e8ee').shine(2); m.roundCyl(0, 12, 0, 3.4, 4.6, 0.8, { seg: 18 }); m.color('#c8c8d0'); m.lathe([[3.5, 16.5], [2.2, 17.6], [0.3, 18.4], [0, 18.5]], { seg: 18 });
    const ws = BURNS_ATLAS.sign('GERLACH', { bg: null, fg: '#2a4a8a', size: 56, pad: 6 });
    m.color('#ffffff'); m.push(); m.tf(0, 14.3, 0); for (const a of [0, Math.PI]) { m.push(); m.tf(0, 0, 0, a); m.decal(0, 0, 3.42, 4.6, 4.6 / ws.aspect, ws); m.pop(); } m.pop();
    m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.6, y0: 0, y1: 2 }] };
  },
  welcomeSign(m) {
    m.color('#6a4a2e').shine(1); for (const sx of [-3.4, 3.4]) m.roundCyl(sx, 0, 0, 0.26, 4.6, 0.08, { seg: 10 });
    m.color('#8a5a34').shine(1); m.roundBox(0, 3.0, 0, 8.4, 3.4, 0.4, 0.3);
    const s1 = BURNS_ATLAS.sign('WELCOME TO\nGERLACH', { bg: '#f4e8c8', fg: '#5a2a1a', size: 56, round: 18, pad: 16 });
    const s2 = BURNS_ATLAS.sign('POP: SMALL · VIBES: HUGE', { bg: '#ff9a4a', fg: '#ffffff', size: 30, round: 12, pad: 8 });
    m.color('#ffffff'); m.decal(0, 3.35, 0.21, 7.4, Math.min(2.6, 7.4 / s1.aspect), s1); m.decal(0, 1.62, 0.21, 6.2, 6.2 / s2.aspect, s2);
    m.color('#ffe24a', 0.6); for (let i = 0; i < 9; i++) m.ball(-3.9 + i * 0.975, 4.85, 0.2, 0.12, { seg: 8, rings: 5 }); m.emissive(0).shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 4.3, hz: 0.3, y0: 1.2, y1: 4.8, cover: true }, { t: 'cyl', x: -3.4, z: 0, r: 0.3, y0: 0, y1: 4.6 }, { t: 'cyl', x: 3.4, z: 0, r: 0.3, y0: 0, y1: 4.6 }], lights: [{ x: 0, y: 4.9, z: 0.4, s: 2.5, c: '#ffe24a' }] };
  },
  picnic(m, o) {
    m.color('#b07a4a').shine(1); m.roundBox(0, 0.78, 0, 2.2, 0.1, 0.9, 0.04); for (const sz of [0.75, -0.75]) m.roundBox(0, 0.45, sz, 2.2, 0.08, 0.32, 0.03);
    m.color('#8a5a34'); for (const sx of [0.85, -0.85]) { m.limb(sx, 0, 0.6, sx, 0.75, 0, 0.04, 0.04, { seg: 5 }); m.limb(sx, 0, -0.6, sx, 0.75, 0, 0.04, 0.04, { seg: 5 }); }
    if (o && o.food) {
      for (const sx of [0.45, -0.45]) { m.color('#f4f4f0').shine(2); m.roundCyl(sx, 0.83, 0, 0.24, 0.03, 0.01, { seg: 12 }); m.color('#d8a050').shine(1); for (let k = 0; k < 4; k++) m.roundCyl(sx, 0.86 + k * 0.045, 0, 0.17 - k * 0.006, 0.04, 0.015, { seg: 12 }); m.color('#ffe8a0', 0.3); m.roundBox(sx, 1.05, 0, 0.07, 0.03, 0.07, 0.01); m.color('#6a2a10').shine(3); m.roundCyl(sx, 1.04, 0, 0.12, 0.012, 0.004, { seg: 10 }); m.emissive(0); }
      for (const sx of [0.8, -0.8]) { m.color('#f4f4f0').shine(2); m.roundCyl(sx, 0.83, 0.22, 0.06, 0.13, 0.015, { seg: 10 }); m.color('#3a1a0a'); m.roundCyl(sx, 0.95, 0.22, 0.05, 0.01, 0.003, { seg: 8 }); }
      m.shine(0);
    }
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.1, hz: 0.45, y0: 0, y1: 0.83 }] };
  },
  pool(m, o) {
    const r = o.r || 5;
    m.color('#8a7a6a').shine(1); m.lathe([[r + 1.2, -0.3], [r + 1.0, 0.25], [r + 0.4, 0.42], [r, 0.2], [r * 0.7, -0.6], [0, -0.8]], { seg: m.segs(24, 14), rMod: (th) => 1 + Math.sin(th * 3 + r) * 0.06 + Math.sin(th * 7) * 0.03 });
    m.color('#38d8d0', 0.4).shine(3); m.lathe([[0, 0.08], [r * 0.98, 0.08]], { seg: m.segs(24, 14), rMod: (th) => 1 + Math.sin(th * 3 + r) * 0.06 + Math.sin(th * 7) * 0.03 });
    m.emissive(0).shine(0);
    return { cols: [], lights: [{ x: 0, y: 0.3, z: 0, s: r * 1.2, c: '#7affe8', pool: r * 2, i: 0.25 }] };
  }
};
