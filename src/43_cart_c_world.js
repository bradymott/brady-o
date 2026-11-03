/* ============================================================
   ART CART — worlds: the track runtime (centre line, walls, racing line),
   terrain features (ramps, tabletops, whoops, berms, quarter pipes, bowls,
   half-pipes, funboxes, dunes), scenery (camps, crowds, art, lights) and
   the track + arena definitions. Static scenery is built into the engine's
   BurnsWorld (merged chunks, painted ground, baked light pools); our own
   terrain is a set of analytic height features rendered as smooth meshes.
   ============================================================ */

/* ---------------- track runtime (closed centre line; d > 0 = right of travel) ---------------- */
class CartTrack {
  constructor(def) {
    this.def = def;
    const pts = def.pts, n = pts.length, dense = [];
    const dd = (a, b) => Math.max(1e-3, Math.hypot(b[0] - a[0], b[1] - a[1]));
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const t0 = 0, t1 = t0 + Math.sqrt(dd(p0, p1)), t2 = t1 + Math.sqrt(dd(p1, p2)), t3 = t2 + Math.sqrt(dd(p2, p3));
      const steps = Math.max(6, Math.ceil(dd(p1, p2) / 1.5)), w1 = p1[2] || 1, w2 = p2[2] || 1;
      for (let k = 0; k < steps; k++) {
        const t = t1 + (t2 - t1) * k / steps;
        const L = (a, b, ta, tb) => [(tb - t) / (tb - ta) * a[0] + (t - ta) / (tb - ta) * b[0], (tb - t) / (tb - ta) * a[1] + (t - ta) / (tb - ta) * b[1]];
        const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3), B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3), C = L(B1, B2, t1, t2);
        const u = k / steps, sm = u * u * (3 - 2 * u);
        dense.push([C[0], C[1], lerp(w1, w2, sm)]);
      }
    }
    const m = dense.length, cum = new Float64Array(m + 1);
    for (let i = 0; i < m; i++) { const a = dense[i], b = dense[(i + 1) % m]; cum[i + 1] = cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1]); }
    const L = cum[m], N = Math.max(64, Math.round(L / 1.0)), ds = L / N;
    this.L = L; this.N = N; this.ds = ds;
    const F = () => new Float32Array(N);
    this.X = F(); this.Z = F(); this.TX = F(); this.TZ = F(); this.NX = F(); this.NZ = F();
    this.HW = F(); this.K = F(); this.WL = F(); this.WR = F(); this.O = F(); this.VP = F();
    let j = 0;
    for (let i = 0; i < N; i++) {
      const s = i * ds;
      while (j < m - 1 && cum[j + 1] < s) j++;
      const a = dense[j], b = dense[(j + 1) % m], seg = cum[j + 1] - cum[j] || 1, f = (s - cum[j]) / seg;
      this.X[i] = lerp(a[0], b[0], f); this.Z[i] = lerp(a[1], b[1], f);
      this.HW[i] = (def.width || 20) * 0.5 * lerp(a[2], b[2], f);
    }
    const wrap = i => (i % N + N) % N; this.wrap = wrap;
    for (let i = 0; i < N; i++) {
      const a = wrap(i - 1), b = wrap(i + 1);
      let tx = this.X[b] - this.X[a], tz = this.Z[b] - this.Z[a]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      this.TX[i] = tx; this.TZ[i] = tz; this.NX[i] = -tz; this.NZ[i] = tx;
    }
    const K0 = F();
    for (let i = 0; i < N; i++) { const a = wrap(i - 2), b = wrap(i + 2); K0[i] = cartWrap(Math.atan2(this.TZ[b], this.TX[b]) - Math.atan2(this.TZ[a], this.TX[a])) / (4 * ds); }
    for (let i = 0; i < N; i++) { let s = 0; for (let k = -4; k <= 4; k++) s += K0[wrap(i + k)]; this.K[i] = s / 9; }
    // walls: road half-width + a soft dust shoulder, pulled in on the inside of tight bends
    const sh = def.shoulder === undefined ? 6 : def.shoulder, WL0 = F(), WR0 = F();
    for (let i = 0; i < N; i++) {
      const base = this.HW[i] + sh, k = this.K[i], lim = Math.abs(k) > 1e-4 ? 0.82 / Math.abs(k) : 1e9;
      WR0[i] = k > 0 ? Math.max(this.HW[i] + 1.0, Math.min(base, lim)) : base;
      WL0[i] = k < 0 ? Math.max(this.HW[i] + 1.0, Math.min(base, lim)) : base;
    }
    const minf = (src, dst, r) => { for (let i = 0; i < N; i++) { let v = 1e9; for (let k = -r; k <= r; k++) v = Math.min(v, src[wrap(i + k)]); dst[i] = v; } };
    const avgf = (src, dst, r) => { for (let i = 0; i < N; i++) { let v = 0; for (let k = -r; k <= r; k++) v += src[wrap(i + k)]; dst[i] = v / (2 * r + 1); } };
    const tmp = F(); minf(WL0, tmp, 14); avgf(tmp, this.WL, 6); minf(WR0, tmp, 14); avgf(tmp, this.WR, 6);
    this.obstacles = [];
    this.buildLine();
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < N; i++) { x0 = Math.min(x0, this.X[i]); x1 = Math.max(x1, this.X[i]); z0 = Math.min(z0, this.Z[i]); z1 = Math.max(z1, this.Z[i]); }
    this.bounds = { x0, x1, z0, z1 }; this.cx = (x0 + x1) / 2; this.cz = (z0 + z1) / 2;
  }
  buildLine() {
    const N = this.N, wrap = this.wrap, O = this.O, X = this.X, Z = this.Z, NX = this.NX, NZ = this.NZ, HW = this.HW;
    const lim = i => Math.max(0, HW[i] - 3.2);
    const qx = i => X[i] + NX[i] * O[i], qz = i => Z[i] + NZ[i] * O[i];
    O.fill(0);
    for (const [k, it] of [[36, 50], [18, 60], [9, 60], [4, 40]]) for (let r = 0; r < it; r++) for (let i = 0; i < N; i++) {
      const a = wrap(i - k), b = wrap(i + k), mx = (qx(a) + qx(b)) / 2, mz = (qz(a) + qz(b)) / 2;
      const t = (mx - X[i]) * NX[i] + (mz - Z[i]) * NZ[i];
      O[i] = clamp(O[i] + (t - O[i]) * 0.55, -lim(i), lim(i));
    }
    for (const ob of this.obstacles) for (let k = -40; k <= 40; k++) {
      const i = wrap(ob.i + k), fall = Math.cos(k / 40 * Math.PI / 2), want = ob.d > 0 ? ob.d - ob.r - 3.5 : ob.d + ob.r + 3.5;
      if (Math.abs(O[i] - ob.d) < ob.r + 3.5) O[i] = clamp(lerp(O[i], want, fall), -lim(i), lim(i));
    }
    const RK = new Float32Array(N), ds = this.ds;
    for (let i = 0; i < N; i++) { const a = wrap(i - 4), b = wrap(i + 4), ax = qx(i) - qx(a), az = qz(i) - qz(a), bx = qx(b) - qx(i), bz = qz(b) - qz(i); RK[i] = Math.abs(cartWrap(Math.atan2(bz, bx) - Math.atan2(az, ax))) / (8 * ds); }
    const VP = this.VP, RAD = this.RAD = new Float32Array(N);
    for (let i = 0; i < N; i++) { let k = 0; for (let j = -3; j <= 3; j++) k = Math.max(k, RK[wrap(i + j)]); RAD[i] = Math.min(400, 1 / Math.max(1e-4, k)); VP[i] = Math.min(60, 1.95 / Math.max(1e-4, k)); }
    for (let pass = 0; pass < 2; pass++) for (let i = N - 1; i >= 0; i--) { const nx = VP[wrap(i + 1)]; VP[i] = Math.min(VP[i], Math.sqrt(nx * nx + 2 * 26 * ds)); }
  }
  locate(x, z, hint, out) {
    const N = this.N, X = this.X, Z = this.Z;
    let best = hint | 0, bd = 1e18; if (best < 0 || best >= N) best = 0;
    const h = best;
    for (let k = -16; k <= 16; k++) { const i = (h + k + N) % N, dx = x - X[i], dz = z - Z[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } }
    const dx = x - X[best], dz = z - Z[best], along = dx * this.TX[best] + dz * this.TZ[best];
    out.i = best; out.s = ((best * this.ds + along) % this.L + this.L) % this.L; out.d = dx * this.NX[best] + dz * this.NZ[best];
    return out;
  }
  locateGlobal(x, z, out) { const N = this.N; let best = 0, bd = 1e18; for (let i = 0; i < N; i++) { const dx = x - this.X[i], dz = z - this.Z[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } } return this.locate(x, z, best, out); }
  nearest(x, z) { const N = this.N; let bd = 1e18, bi = 0; for (let i = 0; i < N; i += 2) { const dx = x - this.X[i], dz = z - this.Z[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } } return { d: Math.sqrt(bd), i: bi }; }
  idx(s) { return ((Math.floor(s / this.ds) % this.N) + this.N) % this.N; }
  at(s, out) {
    const N = this.N, f0 = ((s / this.ds) % N + N) % N, i = Math.floor(f0), f = f0 - i, j = (i + 1) % N;
    out = out || {};
    out.i = i; out.x = lerp(this.X[i], this.X[j], f); out.z = lerp(this.Z[i], this.Z[j], f);
    let tx = lerp(this.TX[i], this.TX[j], f), tz = lerp(this.TZ[i], this.TZ[j], f); const l = Math.hypot(tx, tz) || 1;
    out.tx = tx / l; out.tz = tz / l; out.nx = -out.tz; out.nz = out.tx; out.yaw = Math.atan2(out.tx, out.tz);
    out.hw = lerp(this.HW[i], this.HW[j], f); out.wl = lerp(this.WL[i], this.WL[j], f); out.wr = lerp(this.WR[i], this.WR[j], f);
    out.o = lerp(this.O[i], this.O[j], f); out.v = lerp(this.VP[i], this.VP[j], f); out.k = lerp(this.K[i], this.K[j], f);
    return out;
  }
}

/* ---------------- terrain: analytic height features (all above the playa floor) ----------------
   feature: { x0, z0, x1, z1, h(x,z) >= 0, kind, col, res, mesh: false } */
class CartTerrain {
  constructor() { this.feats = []; this.cells = new Map(); this.C = 24; }
  add(f) {
    this.feats.push(f);
    const C = this.C;
    for (let ix = Math.floor(f.x0 / C); ix <= Math.floor(f.x1 / C); ix++) for (let iz = Math.floor(f.z0 / C); iz <= Math.floor(f.z1 / C); iz++) { const k = ix * 65536 + iz; let a = this.cells.get(k); if (!a) { a = []; this.cells.set(k, a); } a.push(f); }
    return f;
  }
  height(x, z) {
    const a = this.cells.get(Math.floor(x / this.C) * 65536 + Math.floor(z / this.C)); if (!a) return 0;
    let h = 0;
    for (const f of a) { if (x < f.x0 || x > f.x1 || z < f.z0 || z > f.z1) continue; const v = f.h(x, z); if (v > h) h = v; }
    return h;
  }
  // which feature kind is under (x, z) (for surface sounds/dust)
  kindAt(x, z) { const a = this.cells.get(Math.floor(x / this.C) * 65536 + Math.floor(z / this.C)); if (!a) return null; let best = null, h = 0.02; for (const f of a) { if (x < f.x0 || x > f.x1 || z < f.z0 || z > f.z1) continue; const v = f.h(x, z); if (v > h) { h = v; best = f; } } return best; }
}
// local frame helper: world (x, z) -> (u along yaw, v to the left)
const cartLocal = (x, z, cx, cz, yaw) => { const dx = x - cx, dz = z - cz, s = Math.sin(yaw), c = Math.cos(yaw); return [dx * s + dz * c, dx * c - dz * s]; };
const cartBox = (cx, cz, r) => ({ x0: cx - r, z0: cz - r, x1: cx + r, z1: cz + r });
const CartFeat = {
  // straight kicker ramp: rises over len to h, then a vertical lip (drawn as a solid wedge)
  ramp(cx, cz, yaw, len, w, h, o) { o = o || {}; const R = Math.hypot(len, w) / 2 + 1; return Object.assign(cartBox(cx, cz, R), { kind: 'ramp', cx, cz, yaw, len, w, hgt: h, col: o.col || '#8a5a3a', stripe: o.stripe, h(x, z) { const [u, v] = cartLocal(x, z, cx, cz, yaw); if (Math.abs(v) > w / 2 || u < -len / 2 || u > len / 2) return 0; const t = (u + len / 2) / len; return h * (t * 0.7 + t * t * 0.3); }, mesh: 'wedge' }); },
  // tabletop: up-ramp, flat top, down-ramp (landing)
  table(cx, cz, yaw, up, top, down, w, h, o) { o = o || {}; const L = up + top + down, R = Math.hypot(L, w) / 2 + 2; return Object.assign(cartBox(cx, cz, R), { kind: 'dirt', col: o.col || '#a8784e', res: 0.7, h(x, z) { const [u, v] = cartLocal(x, z, cx, cz, yaw); const e = clamp((w / 2 + 1.2 - Math.abs(v)) / 1.2, 0, 1); if (e <= 0) return 0; const s = u + L / 2; let y = 0; if (s < 0 || s > L) return 0; if (s < up) y = h * BurnsM.smoothstep(0, 1, s / up) ** 0.85; else if (s < up + top) y = h; else y = h * (1 - BurnsM.smoothstep(0, 1, (s - up - top) / down)); return y * BurnsM.smoothstep(0, 1, e); } }); },
  // whoops: a row of rounded bumps
  whoops(cx, cz, yaw, n, gap, w, h, o) { o = o || {}; const L = n * gap, R = Math.hypot(L, w) / 2 + 2; return Object.assign(cartBox(cx, cz, R), { kind: 'dirt', col: o.col || '#a8784e', res: 0.5, h(x, z) { const [u, v] = cartLocal(x, z, cx, cz, yaw); const e = clamp((w / 2 + 1 - Math.abs(v)) / 1, 0, 1); const s = u + L / 2; if (e <= 0 || s < 0 || s > L) return 0; const k = s / gap; return h * Math.pow(Math.sin(Math.PI * (k - Math.floor(k))), 1.5) * BurnsM.smoothstep(0, 1, e); } }); },
  // berm: an arc of banked dirt rising toward the outside of a turn
  berm(cx, cz, r0, r1, a0, a1, h, o) { o = o || {}; return Object.assign(cartBox(cx, cz, r1 + 2), { kind: 'dirt', col: o.col || '#9a6a42', res: 0.7, stripe: '#e8483a', H: h, stripeFn: (x, z) => Math.floor(Math.atan2(x - cx, z - cz) * (r1 + 1) / 2.4) % 2 === 0, h(x, z) { const dx = x - cx, dz = z - cz, r = Math.hypot(dx, dz); if (r < r0 || r > r1 + 2.2) return 0; let a = Math.atan2(dx, dz), d0 = cartWrap(a - a0), span = cartWrap(a1 - a0); if (span < 0) { span = -span; d0 = -d0; } if (d0 < -0.25 || d0 > span + 0.25) return 0; const ea = Math.min(BurnsM.smoothstep(-0.25, 0.1, d0), BurnsM.smoothstep(span + 0.25, span - 0.1, d0)); const t = r <= r1 ? Math.pow((r - r0) / (r1 - r0), 1.6) : 1 - (r - r1) / 2.2; return h * t * ea; } }); },
  // quarter pipe along a wall segment facing yaw (rises toward the wall), deck behind
  qpipe(cx, cz, yaw, len, R, H, deck, o) { o = o || {}; const D = R + deck + 2.5, B = Math.hypot(len, D * 2) / 2 + 1; return Object.assign(cartBox(cx, cz, B), { kind: 'concrete', col: o.col || '#bdb8b0', res: 0.45, coping: true, H, h(x, z) { const [u, v] = cartLocal(x, z, cx, cz, yaw); if (Math.abs(v) > len / 2) return 0; const e = Math.min(1, (len / 2 - Math.abs(v)) / 0.8); if (u < -R) return 0; let y; if (u < 0) y = H * Math.pow((u + R) / R, 2.1); else if (u < deck) y = H; else if (u < deck + 2.5) y = H * (1 - (u - deck) / 2.5); else return 0; return y * clamp(e * 1.2, 0, 1); } }); },
  // an above-ground bowl: flat floor ringed by a quarter-pipe wall (ellipse rx, rz), deck, outer slope
  bowl(cx, cz, rx, rz, R, H, o) { o = o || {}; const deck = (o.deck || 2.2), out = (o.out || 3.5), M = Math.max(rx, rz) + deck + out + 1; return Object.assign(cartBox(cx, cz, M), { kind: 'concrete', col: o.col || '#c4bfb6', res: 0.5, coping: true, H, h(x, z) { const dx = (x - cx) / rx, dz = (z - cz) / rz, q = Math.hypot(dx, dz), rr = Math.min(rx, rz); const d = (q - 1) * rr; if (d < -R) return 0; if (d < 0) return H * Math.pow((d + R) / R, 2.0); if (d < deck) return H; if (d < deck + out) return H * (1 - (d - deck) / out); return 0; } }); },
  // half-pipe along yaw: flat bottom, two walls, decks
  halfpipe(cx, cz, yaw, len, flat, R, H, o) { o = o || {}; const half = flat / 2 + R + 2.2 + 2.5, B = Math.hypot(len, half * 2) / 2 + 1; return Object.assign(cartBox(cx, cz, B), { kind: 'concrete', col: o.col || '#b8b2a8', res: 0.45, coping: true, H, h(x, z) { const [u, v] = cartLocal(x, z, cx, cz, yaw); if (Math.abs(u) > len / 2) return 0; const a = Math.abs(v) - flat / 2; let y; if (a < 0) return 0; if (a < R) y = H * Math.pow(a / R, 2.1); else if (a < R + 2.2) y = H; else if (a < R + 4.7) y = H * (1 - (a - R - 2.2) / 2.5); else return 0; const e = clamp((len / 2 - Math.abs(u)) / 1.0, 0, 1); return y * e; } }); },
  // funbox / pyramid: flat top square + four slopes (the king-of-the-hill throne)
  funbox(cx, cz, top, slope, H, o) { o = o || {}; const M = top / 2 + slope + 1; return Object.assign(cartBox(cx, cz, M), { kind: 'concrete', col: o.col || '#c8c2b8', res: 0.45, H, h(x, z) { const a = Math.max(Math.abs(x - cx), Math.abs(z - cz)) - top / 2; if (a <= 0) return H; if (a < slope) return H * (1 - BurnsM.smoothstep(0, 1, a / slope) * 0.25 - (a / slope) * 0.75); return 0; } }); },
  // spine: two transitions back to back (a ridge)
  spine(cx, cz, yaw, len, R, H, o) { o = o || {}; const B = Math.hypot(len, R * 2) / 2 + 1; return Object.assign(cartBox(cx, cz, B), { kind: 'concrete', col: o.col || '#bdb8b0', res: 0.4, H, h(x, z) { const [u, v] = cartLocal(x, z, cx, cz, yaw); if (Math.abs(u) > len / 2) return 0; const a = R - Math.abs(v); if (a <= 0) return 0; return H * Math.pow(a / R, 2.0) * clamp((len / 2 - Math.abs(u)) / 1.0, 0, 1); } }); },
  // a smooth round hill / dune
  mound(cx, cz, r, H, o) { o = o || {}; return Object.assign(cartBox(cx, cz, r), { kind: o.kind || 'dirt', col: o.col || '#c49a72', res: o.res || 1.2, H, h(x, z) { const d = Math.hypot(x - cx, z - cz) / r; if (d >= 1) return 0; return H * 0.5 * (1 + Math.cos(d * Math.PI)); } }); }
};
// render a feature into a BurnsMesh (local to its centre): a heightfield grid, or a solid wedge for kickers
function cartFeatMesh(m, f, cx, cz) {
  if (f.mesh === 'wedge') return cartWedge(m, f, cx, cz);
  const res = f.res || 0.6, nx = Math.ceil((f.x1 - f.x0) / res), nz = Math.ceil((f.z1 - f.z0) / res);
  const idx = new Int32Array((nx + 1) * (nz + 1)).fill(-1), H = new Float32Array((nx + 1) * (nz + 1));
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) H[j * (nx + 1) + i] = f.h(f.x0 + i * res, f.z0 + j * res);
  const P = [0, 0, 0], N = [0, 0, 0], wr = BURNS_ATLAS.white, wu = (wr.u0 + wr.u1) / 2, wv = (wr.v0 + wr.v1) / 2, e = 0.2;
  const base = burnsRGB(f.col || '#b8b0a4'), stripe = f.stripe ? burnsRGB(f.stripe) : null;
  const vtx = (i, j) => {
    const k = j * (nx + 1) + i; if (idx[k] >= 0) return idx[k];
    const x = f.x0 + i * res, z = f.z0 + j * res, h = H[k];
    const hx = f.h(x + e, z) - f.h(x - e, z), hz = f.h(x, z + e) - f.h(x, z - e), l = Math.hypot(hx, 2 * e, hz);
    m.tp(x - cx, h > 0.004 ? h : -0.12, z - cz, P); m.tn(-hx / l, 2 * e / l, -hz / l, N);
    // colour: base, darker on steep walls, a painted coping / stripe near the top
    const steep = 1 - 2 * e / l, sh = 1 - steep * 0.18 - (f.kind === 'dirt' ? (BurnsM.noise2(x * 0.5, z * 0.5) - 0.5) * 0.16 : (BurnsM.noise2(x * 0.9, z * 0.9) - 0.5) * 0.06);
    let c = [base[0] * sh, base[1] * sh, base[2] * sh];
    if (f.coping && f.H && Math.abs(h - f.H) < 0.12 && steep > 0.01) c = [235, 235, 238];
    if (stripe && f.kind === 'dirt' && h > 0.82 * (f.H || 1.2)) c = (f.stripeFn ? f.stripeFn(x, z) : Math.floor((x + z) * 0.6) % 2 === 0) ? stripe : [240, 236, 228];
    const sv = m.c; m.c = [clamp(c[0], 0, 255) | 0, clamp(c[1], 0, 255) | 0, clamp(c[2], 0, 255) | 0];
    const v = m.vert(P[0], P[1], P[2], N[0], N[1], N[2], wu, wv); m.c = sv;
    idx[k] = v; return v;
  };
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = H[j * (nx + 1) + i], b = H[j * (nx + 1) + i + 1], c = H[(j + 1) * (nx + 1) + i + 1], d = H[(j + 1) * (nx + 1) + i];
    if (a <= 0.004 && b <= 0.004 && c <= 0.004 && d <= 0.004) continue;
    const va = vtx(i, j), vb = vtx(i + 1, j), vc = vtx(i + 1, j + 1), vd = vtx(i, j + 1);
    m.ind.push(va, vd, vc, va, vc, vb);
    if (m.nv > 60000) return;
  }
}
// a solid kicker wedge (sloped top, sides, vertical lip at the high end) with striped edges
function cartWedge(m, f, cx, cz) {
  const L = f.len, W = f.w, Hh = f.hgt;
  m.push(); m.tf(f.cx - cx, 0, f.cz - cz, f.yaw);
  const top = (u, v) => [v, Hh * ((u / L + 0.5) * 0.7 + Math.pow(u / L + 0.5, 2) * 0.3), u];
  const n = 8, rows = [];
  for (let k = 0; k <= n; k++) { const u = -L / 2 + L * k / n; rows.push([top(u, W / 2), top(u, -W / 2)]); }
  m.color(f.col).shine(1);
  for (let k = 0; k < n; k++) { const a = rows[k], b = rows[k + 1]; m.poly([a[0], b[0], b[1], a[1]], null, [0, -5, 0]); }
  m.color(shade(f.col, -0.25));
  for (const sd of [1, -1]) for (let k = 0; k < n; k++) { const a = rows[k][sd > 0 ? 0 : 1], b = rows[k + 1][sd > 0 ? 0 : 1]; m.poly([[a[0], 0, a[2]], [b[0], 0, b[2]], b, a], null, [0, Hh * 0.3, 0]); }
  m.poly([[W / 2, 0, L / 2], [-W / 2, 0, L / 2], [-W / 2, Hh, L / 2], [W / 2, Hh, L / 2]], null, [0, Hh * 0.5, 0]);
  // glowing lip + side stripes
  m.color(f.stripe || '#ffe24a', 0.7); m.roundBox(0, Hh - 0.02, L / 2 - 0.08, W + 0.08, 0.12, 0.16, 0.04);
  for (const sd of [1, -1]) m.limb(sd * (W / 2 + 0.02), 0.05, -L / 2, sd * (W / 2 + 0.02), Hh, L / 2 - 0.05, 0.05, 0.05, { seg: 4 });
  m.emissive(0).shine(0);
  m.pop();
  return { lights: [{ x: f.cx - cx, y: Hh, z: f.cz - cz, s: 0.8, c: f.stripe || '#ffe24a' }] };
}

/* ---------------- skies (engine palettes, tuned for racing: long sight lines) ---------------- */
const CART_SKIES = {
  day: () => Object.assign({}, BURNS_PALETTES.day, { fogD: 0.0042, clouds: 0.5 }),
  sunset: () => Object.assign({}, BURNS_PALETTES.dusk, { fogD: 0.0052, sun: [205, 7], key: '#ffd2a8', keyK: 1.0, sky: '#a8a0c4', hor: '#ff9a62', fog: '#d89a7c', clouds: 0.55, mid: '#c87a8a', midK: 0.3 }),
  dawn: () => Object.assign({}, BURNS_PALETTES.dawn, { fogD: 0.0055 }),
  night: () => Object.assign({}, BURNS_PALETTES.night, { fogD: 0.0075, emB: 1.7, cityK: 0.7, keyK: 0.55, sky: '#5a5a92' }),
  dust: () => Object.assign({}, BURNS_PALETTES.day, { fog: '#d8bc94', fogD: 0.0125, haze: 0.85, fogMax: 0.94, clouds: 0.2, sky: '#d8c8b0', key: '#ffe8c8', keyK: 0.75, dust: 1.2 })
};

/* ---------------- scenery helpers (all original designs) ---------------- */
const CART_CAMP_NAMES = ['CAMP SNOOZE BUTTON', 'SPICY PICKLE LOUNGE', 'THE DUSTY MUFFIN', 'GOGGLE FARM', 'CAMP NO REGRETS', 'BACON & BASS', 'THE LOST SOCK', 'HUG DEALERSHIP', 'TUTU OR NOT TUTU', 'CAMP SUNBURN', 'THE THIRSTY CAMEL', 'GLITTER BUNKER', 'NAP TRAP', 'PANCAKE PALACE', 'CAMP MAYBE TUESDAY', 'THE WOBBLY YURT', 'DISCO NAP', 'EL WIRE EMPORIUM', 'CAMP FOMO', 'SPARKLE SHACK', 'MISTING MAYHEM', 'THE DUST BUNNIES', 'BEATS & BURRITOS', 'CAMP SOCKS & SANDALS'];
const CART_JOKE_SIGNS = ['ART CAR\nCROSSING', 'HYDRATE OR\nDIE-DRATE', 'NO MOOP!', 'SPEED LIMIT\n5 MPH (LOL)', 'WELCOME\nHOME', 'RANGERS\nAHEAD', 'HONK IF\nYOU\'RE DUSTY', 'BRAKES ARE\nA SOCIAL\nCONSTRUCT', 'THIS WAY\nTO THE\nPARTY →'];
const CartScene = {
  // run fn(m) at (x, z, yaw) in the world's static chunks, low detail unless hi
  mesh(api, x, z, yaw, fn, o) { o = o || {}; return api.mesh(x, z, m => { const lo = m.lo; m.lo = !o.hi; const r = fn(m); m.lo = lo; return r; }, { yaw, y: o.y || 0, noAO: o.noAO, scale: o.scale }); },
  prop(api, kind, o) { return CartScene.mesh(api, o.x, o.z, o.yaw || 0, m => BurnsProps[kind].call(BurnsProps, m, o), { hi: o.hi, noAO: o.noAO, scale: o.scale }); },
  // a camp: shade + a vehicle (+ dome / tents), string lights, a sign facing the track
  camp(api, x, z, yaw, rng, night, nameIx) {
    const c = Math.cos(yaw), s = Math.sin(yaw), at = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
    const kind = rng();
    const shadeCol = rng.pick(['#e8e0d0', '#ffd0a0', '#c8e8f0', '#ffc8e0', '#d0f0c0']);
    CartScene.prop(api, 'shade', { x, z, yaw, w: 7, d: 6, h: 3, col: shadeCol, lights: night, seed: Math.floor(rng() * 999) });
    const v = at(rng() < 0.5 ? 7.5 : -7.5, -1.5);
    CartScene.prop(api, rng.pick(['rv', 'camper', 'van', 'bus', 'rv']), { x: v[0], z: v[1], yaw: yaw + Math.PI / 2 + (rng() - 0.5) * 0.3, seed: Math.floor(rng() * 999) });
    if (kind < 0.35) { const d = at(0, -9); CartScene.prop(api, 'dome', { x: d[0], z: d[1], r: 4 + rng() * 2, lights: night, glow: night, seed: Math.floor(rng() * 99) }); }
    else if (kind < 0.7) { for (let i = 0; i < 2; i++) { const p = at(-3 + i * 6, -7); CartScene.prop(api, 'tent', { x: p[0], z: p[1], yaw: yaw + rng() - 0.5, col: rng.pick(['#3a8a5a', '#8a3a5a', '#3a5a8a', '#c8a03a']) }); } }
    const ch = at(1.5, 0.5); CartScene.prop(api, 'couch', { x: ch[0], z: ch[1], yaw, col: rng.pick(['#8a3a5a', '#3a6a8a', '#c86a3a']) });
    if (rng() < 0.6) { const b = at(-2.5, 2.2); CartScene.prop(api, 'barrel', { x: b[0], z: b[1] }); if (night) { api.fire(b[0], 0.95, b[1], 0.35, { hazard: false }); } }
    const sp = at(0, 3.6); api.sign(CART_CAMP_NAMES[nameIx % CART_CAMP_NAMES.length], sp[0], sp[1], { yaw, h: 0.62, y: 2.5, post: true, maxW: 4.2, style: { bg: rng.pick(['#2a1a3a', '#3a1a1a', '#1a2a3a']), fg: rng.pick(['#ffe24a', '#ff9ad8', '#9af0ff', '#ffffff']), border: '#ffffff' }, glow: night ? rng.pick(BURNS_NEON) : null });
    if (night) { api.light(x, z, 11, rng.pick(['#ffb070', '#ff7ac8', '#7ac8ff']), 0.55); api.glow(sp[0], 3.3, sp[1], 1.2, rng.pick(BURNS_NEON)); }
  },
  // a lamp post (lightmap pool + glow); string of bulbs between posts at night
  lamp(api, x, z, col, night) {
    CartScene.mesh(api, x, z, 0, m => { m.color('#3a3640').shine(2); m.limb(0, 0, 0, 0, 4.2, 0, 0.09, 0.06, { seg: 6 }); m.color('#2a2630'); m.roundBox(0, 4.3, 0, 0.5, 0.18, 0.5, 0.06); m.color(col, night ? 1 : 0.4); m.ball(0, 4.1, 0, 0.18, { seg: 8, rings: 6 }); m.emissive(0).shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.25, y0: 0, y1: 4.4 }] }; }, { noAO: true });
    if (night) { api.light(x, z, 9, col, 0.6); api.glow(x, 4.1, z, 1.4, col); }
  },
  // giant original art pieces for infields and the art park; returns {x, z, r} (collider radius)
  art(api, kind, x, z, yaw, night, s) {
    s = s || 1;
    const glow = (gx, gy, gz, sz, c) => { if (night) api.glow(gx, gy, gz, sz, c); };
    if (kind === 'hand') {   // a giant open hand reaching out of the playa, fingertips glowing
      CartScene.mesh(api, x, z, yaw, m => {
        m.color('#c89a6a').shine(1); m.limb(0, -0.5, 0, 0, 5, 0, 1.6, 1.3, { seg: 14 }); m.roundBox(0, 6.4, 0, 3.4, 3.0, 1.4, 0.6);
        for (let i = 0; i < 4; i++) { const fx = -1.2 + i * 0.8, l = [3.2, 3.8, 3.6, 2.9][i]; m.limb(fx, 7.6, 0, fx * 1.15, 7.6 + l, (i - 1.5) * 0.1, 0.36, 0.3, { seg: 10 }); m.color('#ff4fd8', night ? 1 : 0.3); m.ball(fx * 1.15, 7.6 + l + 0.2, (i - 1.5) * 0.1, 0.3, { seg: 8, rings: 6 }); m.color('#c89a6a'); }
        m.limb(1.6, 6.0, 0, 2.9, 8.2, 0.3, 0.42, 0.34, { seg: 10 }); m.emissive(0).shine(0);
        return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.0 * s, y0: 0, y1: 14 }] };
      }, { hi: true, scale: s });
      glow(x, 12 * s, z, 3, '#ff4fd8'); if (night) api.light(x, z, 14 * s, '#ff4fd8', 0.5);
      return { x, z, r: 2.2 * s };
    }
    if (kind === 'lotus') {  // a huge steel lotus that glows from inside
      CartScene.mesh(api, x, z, yaw, m => {
        for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 8; i++) { const a = (i + ring * 0.5) / 8 * TAU; m.push(); m.tf(0, 0.4 + ring * 0.3, 0, a, -0.55 - ring * 0.35, 0); m.color(ring ? '#ff9ad8' : '#ff6ab0', night ? 0.35 : 0).shine(2); m.ellipsoid(0, 2.2, 1.6, 0.9, 2.4, 0.25, { seg: 10, rings: 8 }); m.pop(); }
        m.color('#ffe24a', night ? 1 : 0.4); m.ball(0, 1.4, 0, 1.0, { seg: 12, rings: 8 }); m.emissive(0).shine(0);
        return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.2 * s, y0: 0, y1: 4.5 }] };
      }, { hi: true, scale: s });
      glow(x, 1.6 * s, z, 6, '#ffb0e0'); if (night) api.light(x, z, 16 * s, '#ff7ac8', 0.6);
      return { x, z, r: 3.4 * s };
    }
    if (kind === 'ribs') {   // neon arches you can drive through
      for (let i = 0; i < 6; i++) { const lz = -10 + i * 4, c = BURNS_NEON[i % 7]; const px = x + Math.sin(yaw) * lz, pz = z + Math.cos(yaw) * lz;
        CartScene.mesh(api, px, pz, yaw, m => { m.color(c, night ? 1 : 0.5).shine(2); m.surf(14, 6, (u, v, out) => { const a = Math.PI * u, r = 7 * s + Math.cos(v * TAU) * 0.25; out[0] = Math.cos(a) * r; out[1] = Math.sin(a) * r * 1.15; out[2] = Math.sin(v * TAU) * 0.25; }, { wrapV: true, out: [0, 3, 0] }); m.emissive(0).shine(0); return { cols: [{ t: 'cyl', x: 7 * s, z: 0, r: 0.5, y0: 0, y1: 3 }, { t: 'cyl', x: -7 * s, z: 0, r: 0.5, y0: 0, y1: 3 }] }; }, { hi: true, noAO: true });
        glow(px, 7.5 * s, pz, 2.2, c); }
      return { x, z, r: 0 };
    }
    if (kind === 'spinner') {   // a tall wind spinner on a tripod
      CartScene.mesh(api, x, z, yaw, m => {
        m.color('#8a8a96').shine(3); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; m.limb(Math.sin(a) * 3, 0, Math.cos(a) * 3, 0, 9, 0, 0.18, 0.12, { seg: 8 }); }
        for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; m.color(BURNS_NEON[i], night ? 0.6 : 0.1); m.push(); m.tf(0, 9.5, 0, a, 0, 0.6); m.ellipsoid(0, 0, 2.2, 0.08, 0.9, 2.0, { seg: 8, rings: 6 }); m.pop(); }
        m.color('#ffe24a', night ? 1 : 0.4); m.ball(0, 9.5, 0, 0.6, { seg: 10, rings: 8 }); m.emissive(0).shine(0);
        return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.6 * s, y0: 0, y1: 4 }] };
      }, { hi: true, scale: s });
      glow(x, 9.5 * s, z, 3, '#ffe24a'); return { x, z, r: 2.6 * s };
    }
    if (kind === 'obelisk') {   // a mirrored obelisk
      CartScene.mesh(api, x, z, yaw, m => { m.color('#dfe6f4').shine(3); m.lathe([[1.6, 0], [1.4, 9], [0, 11.5]], { seg: 4 }); m.color('#38f2ff', night ? 1 : 0.3); m.ball(0, 11.8, 0, 0.5, { seg: 8, rings: 6 }); m.emissive(0).shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.7 * s, y0: 0, y1: 11 }] }; }, { hi: true, scale: s });
      glow(x, 11.8 * s, z, 3, '#38f2ff'); if (night) api.light(x, z, 10, '#38f2ff', 0.5);
      return { x, z, r: 1.8 * s };
    }
    if (kind === 'temple') {   // an original wooden temple: tiered rounded roofs on a ring of posts
      CartScene.mesh(api, x, z, yaw, m => {
        const wd = BURNS_ATLAS.pattern('wood');
        m.color('#c8a070'); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; m.limb(Math.sin(a) * 7, 0, Math.cos(a) * 7, Math.sin(a) * 6.4, 7, Math.cos(a) * 6.4, 0.35, 0.3, { seg: 8, uv: wd }); }
        for (let t = 0; t < 4; t++) { const r = 8.5 - t * 1.9, y = 7 + t * 2.6; m.color(t % 2 ? '#d8b080' : '#c8986a'); m.push(); m.tf(0, y, 0); m.lathe([[r, 0], [r * 0.98, 0.25], [r * 0.6, 1.5], [r * 0.55, 1.6]], { seg: 8, uv: wd }); m.pop(); }
        m.color('#e8c890'); m.limb(0, 17, 0, 0, 21, 0, 0.3, 0.05, { seg: 8 });
        m.color('#ffd890', night ? 0.6 : 0); m.ball(0, 4.5, 0, 1.2, { seg: 10, rings: 8 }); m.emissive(0);
        return { cols: [{ t: 'cyl', x: 0, z: 0, r: 8.6 * s, y0: 0, y1: 18 }] };
      }, { hi: true, scale: s });
      if (night) api.light(x, z, 18, '#ffc890', 0.5);
      return { x, z, r: 8.8 * s };
    }
    if (kind === 'gate') {   // a festival gate arch over the road
      CartScene.prop(api, 'gateArch', { x, z, yaw, w: 26 * s, h: 9, text: 'ART CART', hi: true });
      return { x, z, r: 0 };
    }
    return { x, z, r: 0 };
  },
  // a row of bleachers (stepped boxes) facing yaw; returns spectator spots on the steps
  bleachers(api, x, z, yaw, len, rows, rng) {
    const spots = [], c = Math.cos(yaw), s = Math.sin(yaw);
    CartScene.mesh(api, x, z, yaw, m => {
      const wd = BURNS_ATLAS.pattern('wood');
      for (let r = 0; r < rows; r++) { m.color(r % 2 ? '#9a7a5a' : '#8a6a4a'); m.roundBox(0, 0.3 + r * 0.55, -r * 1.0, len, 0.12, 1.0, 0.04, { uv: wd }); m.color('#5a5a66').shine(2); m.roundBox(0, 0.15 + r * 0.275, -r * 1.0 + 0.45, len, 0.3 + r * 0.55, 0.06, 0.02); m.shine(0); }
      m.color('#3a3a46').shine(2); for (let i = 0; i <= 4; i++) m.limb(-len / 2 + i * len / 4, 0, -rows + 0.2, -len / 2 + i * len / 4, rows * 0.55 + 1.1, -rows + 0.2, 0.06, 0.06, { seg: 5 }); m.shine(0);
      return { cols: [{ t: 'box', x: 0, z: -rows * 0.5 + 0.5, hx: len / 2, hz: rows * 0.5, y0: 0, y1: rows * 0.55 }] };
    }, { hi: true });
    for (let r = 0; r < rows; r++) for (let i = 0; i < Math.floor(len / 1.25); i++) {
      if (rng() < 0.32) continue;
      const lx = -len / 2 + 0.6 + i * 1.25 + (rng() - 0.5) * 0.3, lz = -r * 1.0;
      spots.push({ x: x + lx * c + lz * s, z: z - lx * s + lz * c, y: 0.36 + r * 0.55, yaw: yaw + (rng() - 0.5) * 0.4 });
    }
    return spots;
  }
};

/* ---------------- tracks (Grand Prix + time trial) ----------------
   pts: centre line [x, z, widthScale] (closed). Features in track space: s = fraction of the lap, d = -1..1 of half-width. */
function cartArcPts(cx, cz, r, a0, a1, step) { const out = [], n = Math.max(1, Math.round(Math.abs(a1 - a0) / step)); for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; out.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } return out; }
function cartFillet(poly, r) {
  const out = [], n = poly.length;
  for (let i = 0; i < n; i++) {
    const p = poly[(i - 1 + n) % n], c = poly[i], q = poly[(i + 1) % n];
    const ax = p[0] - c[0], az = p[1] - c[1], bx = q[0] - c[0], bz = q[1] - c[1], la = Math.hypot(ax, az), lb = Math.hypot(bx, bz);
    const ux = ax / la, uz = az / la, vx = bx / lb, vz = bz / lb, ang = Math.acos(clamp(ux * vx + uz * vz, -1, 1));
    let rr = c[2] || r, t = rr / Math.tan(ang / 2); const tmax = Math.min(la, lb) * 0.48; if (t > tmax) { t = tmax; rr = t * Math.tan(ang / 2); }
    const sx = c[0] + ux * t, sz = c[1] + uz * t, ex = c[0] + vx * t, ez = c[1] + vz * t, hx = ux + vx, hz = uz + vz, hl = Math.hypot(hx, hz) || 1, dC = rr / Math.sin(ang / 2);
    const cx = c[0] + hx / hl * dC, cz = c[1] + hz / hl * dC, a0 = Math.atan2(sz - cz, sx - cx); let da = Math.atan2(ez - cz, ex - cx) - a0;
    while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
    const steps = Math.max(2, Math.ceil(Math.abs(da) * rr / 7));
    for (let k = 0; k <= steps; k++) { const a = a0 + da * k / steps; out.push([cx + Math.cos(a) * rr, cz + Math.sin(a) * rr]); }
  }
  return out;
}
const cartScalePts = (pts, k) => pts.map(p => [p[0] * k, p[1] * k, p[2]]);
const CART_TRACKS = {
  esplanade: { name: 'ESPLANADE LOOP', tod: 'sunset', music: 'kart1', width: 21, shoulder: 7, theme: 'camps', blurb: 'Camps and crowds line the inner ring',
    pts: cartScalePts([].concat(cartArcPts(0, 0, 150, 90, 220, 13).map(([x, z], i) => [x * (1 + 0.05 * Math.sin(i * 1.3)), z * (1 + 0.05 * Math.sin(i * 1.3))]), [[-80, -136], [-40, -116], [0, -138], [40, -116], [80, -136]], cartArcPts(0, 0, 150, 320, 437, 13).slice(0, -1).map(([x, z], i) => [x * (1 + 0.05 * Math.sin(i * 1.7 + 1)), z * (1 + 0.05 * Math.sin(i * 1.7 + 1))])), 1.2),
    gifts: [0.16, 0.48, 0.78], boosts: [[0.3, 0], [0.62, 0.3]], ramps: [[0.88, -0.2, 0.6]], art: [['lotus', 0, 0], ['spinner', -60, 40]] },
  gateroad: { name: 'GATE ROAD GRIND', tod: 'day', music: 'kart2', width: 20, shoulder: 9, theme: 'gate', blurb: 'Long straights past the line of RVs',
    pts: cartScalePts([].concat([[0, 0], [100, 0], [190, 0]], cartArcPts(215, 62, 62, -66, 66, 22), [[190, 124], [140, 124], [104, 112], [70, 134], [30, 122], [-60, 124], [-150, 124], [-190, 124]], cartArcPts(-215, 62, 62, 114, 246, 22), [[-190, 0], [-100, 0]]), 1.2),
    gifts: [0.08, 0.42, 0.7], boosts: [[0.18, 0], [0.55, 0], [0.9, 0]], ramps: [[0.6, 0.2, 0.6]], art: [['gate', 0, 0], ['obelisk', 0, 75]] },
  deepplaya: { name: 'DEEP PLAYA DASH', tod: 'night', music: 'kart3', width: 22, shoulder: 8, theme: 'art', blurb: 'Weave between giant glowing sculptures',
    pts: cartScalePts([[0, 0], [80, -12], [150, 6], [205, 58], [200, 130], [146, 170], [86, 150], [40, 196], [-30, 214], [-104, 184], [-150, 120], [-214, 74], [-206, 0], [-136, -40], [-62, -26]], 1.2),
    gifts: [0.12, 0.45, 0.75], boosts: [[0.35, 0], [0.6, -0.3]], ramps: [[0.2, 0, 0.7], [0.83, 0.3, 0.5]], art: [['hand', 0, 100], ['ribs', 140, 80], ['obelisk', -120, 110], ['spinner', 60, 220]] },
  dawn: { name: 'SUNRISE TEMPLE', tod: 'dawn', music: 'kart4', width: 20, shoulder: 8, theme: 'temple', blurb: 'Loop the wooden temple as the sun comes up',
    pts: cartScalePts(cartFillet([[-30, 182], [110, 160], [178, 62], [152, -62], [62, -152], [-62, -162], [-158, -92], [-66, -36], [-58, 34], [4, 66], [-12, 124]], 34), 1.2),
    gifts: [0.1, 0.4, 0.72], boosts: [[0.25, 0], [0.55, 0.2]], ramps: [[0.86, 0, 0.6]], art: [['temple', 60, 20], ['lotus', -110, -110]] },
  centercamp: { name: 'CENTER CAMP CIRCUIT', tod: 'day', music: 'kart2', width: 19, shoulder: 5, theme: 'camps', blurb: 'Tight corners around the big round tent',
    pts: cartScalePts(cartFillet([[0, 100], [0, -160], [110, -160], [110, -60], [205, -60], [205, 165], [92, 165], [92, 100]], 26), 1.25),
    gifts: [0.14, 0.46, 0.8], boosts: [[0.05, 0], [0.5, 0]], ramps: [[0.32, 0, 0.6]], art: [['spinner', 150, 50], ['obelisk', 55, -110]] },
  storm: { name: 'DUST STORM DRIFT', tod: 'dust', music: 'kart3', width: 22, shoulder: 10, theme: 'storm', blurb: 'Whiteouts roll in without warning', storm: true,
    pts: cartScalePts([[0, 0], [110, -22], [205, 14], [244, 100], [190, 178], [104, 186], [34, 124], [-40, 180], [-138, 190], [-220, 126], [-232, 32], [-158, -28], [-74, -20]], 1.15),
    gifts: [0.1, 0.4, 0.7], boosts: [[0.28, 0], [0.82, 0]], ramps: [[0.55, 0, 0.7]], art: [['spinner', 0, 90], ['hand', -130, 100]] },
  neon: { name: 'NEON NIGHTS', tod: 'night', music: 'kart1', width: 19, shoulder: 6, theme: 'neon', blurb: 'Sound camps, lasers and a sea of lights',
    pts: cartScalePts(cartFillet([[-100, 0], [96, 0], [96, 74], [-62, 74], [-62, 148], [104, 148], [146, 206], [-150, 206], [-150, 0]], 36), 1.2),
    gifts: [0.12, 0.44, 0.76], boosts: [[0.3, 0], [0.65, 0]], ramps: [[0.92, 0, 0.6]], art: [['ribs', -110, 110], ['lotus', 30, 110]] },
  burn: { name: 'BURN NIGHT', tod: 'night', music: 'kart4', width: 20, shoulder: 7, theme: 'burn', blurb: 'Race around the Man as he burns', fireworks: true,
    pts: cartScalePts([[-46, 236], [-36, 160], [-50, 86], [-68, 18], [-46, -48], [16, -70], [66, -30], [62, 36], [44, 96], [56, 166], [46, 236], [96, 304], [40, 366], [-62, 356], [-104, 296]], 1.25),
    gifts: [0.12, 0.42, 0.72], boosts: [[0.25, 0], [0.58, 0]], ramps: [[0.85, 0, 0.6]], art: [['man', 0, 160]] }
};
const CART_TRACK_ORDER = ['esplanade', 'gateroad', 'deepplaya', 'dawn', 'centercamp', 'storm', 'neon', 'burn'];

/* ---------------- building a race world ----------------
   returns E: { world, track, terrain, sky, music, gifts[], boosts[], pads, crowds[], heroes[], spawn[], bounds,
                walls (arena polygon), zones, orbSpots, flagSpots, capture, objectsR, man, dust, night } */
const CartWorlds = {
  base(id, bounds, groundCol, crack) {
    const def = { id, bounds, ground: { base: groundCol || '#c9a27e', crack: crack === undefined ? 0.26 : crack, mottle: 0.35, res: 0.5 } };
    const W = new BurnsWorld(def, null);
    W.chunkSize = 64;
    return { world: W, api: W.api, terrain: new CartTerrain(), gifts: [], boosts: [], crowds: [], heroes: [], spots: [], zones: [], orbSpots: [], flagSpots: [], capture: null, walls: null, fires: [], art: [], lamps: [] };
  },
  finish(E) {
    // terrain feature meshes into the static chunks
    for (const f of E.terrain.feats) { if (f.noMesh) continue; const cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2; E.api.mesh(cx, cz, m => { m.lo = false; return cartFeatMesh(m, f, cx, cz) || {}; }, { noAO: true }); }
    E.world.finish();
    E.crowds = CartCrowd.groups(E.spots, mulberry32(77));
    E.spots = null;
    return E;
  },
  track(id) {
    const D = CART_TRACKS[id] || CART_TRACKS.esplanade, T = new CartTrack(D), night = D.tod === 'night', rng = mulberry32(hashStr(id));
    const pad = 70, b = T.bounds;
    const E = this.base(1000 + CART_TRACK_ORDER.indexOf(id), [b.x0 - pad, b.z0 - pad, b.x1 + pad, b.z1 + pad], D.theme === 'storm' ? '#d4b48c' : '#c9a27e');
    Object.assign(E, { id, def: D, track: T, sky: CART_SKIES[D.tod](), tod: D.tod, music: D.music, night, storm: !!D.storm, fireworks: !!D.fireworks });
    const api = E.api, A = (f, out) => T.at(((f % 1) + 1) % 1 * T.L, out || {});
    // obstacles (art on the road) register before the racing line is final
    // ground paint: compacted road band, tyre ruts, edge lines, the start grid
    api.paint((ctx, P, S) => {
      const path = (off) => { ctx.beginPath(); for (let i = 0; i <= T.N; i += 2) { const k = i % T.N, x = T.X[k] + T.NX[k] * off, z = T.Z[k] + T.NZ[k] * off, q = P(x, z); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } ctx.closePath(); };
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(120,88,64,0.28)'; ctx.lineWidth = (T.HW[0] * 2 + 9) * S; path(0); ctx.stroke();
      ctx.strokeStyle = D.theme === 'storm' ? 'rgba(150,118,86,0.5)' : 'rgba(156,120,92,0.55)'; ctx.lineWidth = T.HW[0] * 2 * S; path(0); ctx.stroke();
      ctx.strokeStyle = 'rgba(96,70,52,0.22)'; ctx.lineWidth = 0.5 * S; for (const o of [-6, -3.4, 3.4, 6]) { path(o); ctx.stroke(); }
      ctx.setLineDash([4 * S, 5 * S]); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.35 * S; path(0); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = night ? 'rgba(255,79,216,0.55)' : 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.5 * S; path(T.HW[0] - 0.4); ctx.stroke(); path(-T.HW[0] + 0.4); ctx.stroke();
      // checkered start line
      const a = T.at(0, {}), sq = 1.2;
      for (let i = -Math.ceil(a.hw / sq); i < Math.ceil(a.hw / sq); i++) for (let r = 0; r < 2; r++) {
        const x = a.x + a.nx * (i + 0.5) * sq + a.tx * (r - 0.5) * sq, z = a.z + a.nz * (i + 0.5) * sq + a.tz * (r - 0.5) * sq, q = P(x, z);
        ctx.fillStyle = (i + r) % 2 ? '#1a1a1a' : '#f4f4f4'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(a.tz, a.tx)); ctx.fillRect(-sq * S / 2, -sq * S / 2, sq * S, sq * S); ctx.restore();
      }
      // grid boxes
      for (let k = 0; k < 8; k++) { const g = T.at(T.L - 12 - k * 7.5, {}), d = (k % 2 ? 1 : -1) * g.hw * 0.42; const q = P(g.x + g.nx * d, g.z + g.nz * d); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.3 * S; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.strokeRect(-2.6 * S, -1.5 * S, 5.2 * S, 3 * S); ctx.restore(); }
    });
    // barriers along both walls: posts + a rounded rail; LED strips glow at night; tyre stacks on tight bends
    const step = 7;
    for (let s = 0; s < T.L; s += step) {
      const g = T.at(s, {}), tight = Math.abs(g.k) > 0.012;
      for (const side of [1, -1]) {
        const off = side > 0 ? g.wr : -g.wl, x = g.x + g.nx * off, z = g.z + g.nz * off;
        const col = tight ? (Math.floor(s / step) % 2 ? '#e8e8f0' : '#ff3a4a') : D.theme === 'neon' || night ? BURNS_NEON[Math.floor(s / step) % 7] : '#ff8a2a';
        CartScene.mesh(api, x, z, g.yaw, m => {
          if (tight) { for (let k = 0; k < 3; k++) { m.color(k % 2 ? '#1a1a1e' : '#26262c').shine(1); m.push(); m.tf(0, 0.18 + k * 0.32, 0); m.torus(0, 0, 0, 0.5, 0.16, { seg: 10, tseg: 5 }); m.pop(); } m.color(col, night ? 0.6 : 0).shine(2); m.torus(0, 0.98, 0, 0.5, 0.06, { seg: 10, tseg: 4 }); }
          else { m.color('#2a2a32').shine(2); m.limb(0, 0, 0, 0, 1.0, 0, 0.07, 0.07, { seg: 6 }); m.color(col, night ? 0.9 : 0.15).shine(2); m.limb(0, 0.85, -step / 2, 0, 0.85, step / 2, 0.08, 0.08, { seg: 6 }); m.color('#f4f4f4', 0).limb(0, 0.45, -step / 2, 0, 0.45, step / 2, 0.06, 0.06, { seg: 5 }); }
          m.emissive(0).shine(0);
        }, { noAO: true });
        if (night && Math.floor(s / step) % 3 === 0) api.glow(x, 0.95, z, 0.9, col);
      }
    }
    // lamp posts at night; flags by day
    for (let s = 3; s < T.L; s += 38) { const g = T.at(s, {}), side = Math.floor(s / 38) % 2 ? 1 : -1, off = side > 0 ? g.wr + 2.5 : -g.wl - 2.5; const x = g.x + g.nx * off, z = g.z + g.nz * off; if (night || D.tod === 'sunset' || D.tod === 'dawn') CartScene.lamp(api, x, z, BURNS_NEON[Math.floor(s / 38) % 7], night || D.tod === 'sunset'); else CartScene.mesh(api, x, z, 0, m => { m.color('#c8ccd8').shine(3); m.limb(0, 0, 0, 0, 5, 0, 0.06, 0.05, { seg: 6 }); m.shine(0); m.color(BURNS_NEON[Math.floor(s / 38) % 7]); m.box(0.6, 4.4, 0, 1.2, 0.8, 0.04); }, { noAO: true }); }
    // start/finish arch + grandstand + crowd + hero cast
    { const g = T.at(0, {}); CartScene.prop(api, 'gateArch', { x: g.x, z: g.z, yaw: g.yaw, w: (g.wl + g.wr) + 2, h: 8, text: 'ART CART', hi: true });
      for (const side of [1, -1]) { const off = side > 0 ? g.wr + 6 : -g.wl - 6, x = g.x + g.nx * off + g.tx * 4, z = g.z + g.nz * off + g.tz * 4; E.spots.push(...CartScene.bleachers(api, x, z, g.yaw + (side > 0 ? Math.PI / 2 : -Math.PI / 2), 22, 4, rng)); if (night) api.light(x, z, 16, '#ffb0e0', 0.5); }
      const heroes = ['greeter_f', 'burney', 'firespinner', 'annoyingdj', 'furry', 'sparklepony', 'burnermom', 'greeter_m'];
      heroes.forEach((type, i) => { const side = i % 2 ? 1 : -1, off = side > 0 ? g.wr + 2.4 : -g.wl - 2.4, along = -10 + Math.floor(i / 2) * 7; E.heroes.push({ type, x: g.x + g.nx * off + g.tx * along, z: g.z + g.nz * off + g.tz * along, yaw: Math.atan2(-g.nx * side, -g.nz * side), anim: type === 'firespinner' ? 'firespin' : type === 'annoyingdj' ? 'dj' : type === 'burney' ? 'photo' : i % 3 === 0 ? 'cheer' : 'wave' }); });
    }
    // camps along the outside, crowds at corners
    let nameIx = Math.floor(rng() * 10);
    for (let s = 40; s < T.L - 30; s += D.theme === 'art' ? 70 : D.theme === 'storm' ? 60 : 44) {
      const g = T.at(s, {}), side = g.k > 0 ? -1 : 1, off = side > 0 ? g.wr + 15 : -g.wl - 15;
      const x = g.x + g.nx * off, z = g.z + g.nz * off, yaw = Math.atan2(-g.nx * side, -g.nz * side);
      if (this.clear(T, x, z, 9)) CartScene.camp(api, x, z, yaw, rng, night || D.tod === 'sunset', nameIx++);
      if (Math.abs(g.k) > 0.008 && rng() < 0.75) { const n = 10 + Math.floor(rng() * 8), w0 = side > 0 ? g.wr : -g.wl; for (let k = 0; k < n; k++) { const a = rng() - 0.5, dd = w0 + side * (2.6 + rng() * 4), cx = g.x + g.nx * dd + g.tx * a * 16, cz = g.z + g.nz * dd + g.tz * a * 16; if (this.clear(T, cx, cz, 1.5)) E.spots.push({ x: cx, z: cz, yaw: yaw + (rng() - 0.5) * 0.6 }); } }
    }
    // joke signs
    for (let k = 0; k < 6; k++) { const s = T.L * (0.1 + k * 0.15), g = T.at(s, {}), side = k % 2 ? 1 : -1, off = side > 0 ? g.wr + 3.5 : -g.wl - 3.5; api.sign(CART_JOKE_SIGNS[(k + nameIx) % CART_JOKE_SIGNS.length], g.x + g.nx * off, g.z + g.nz * off, { yaw: g.yaw + Math.PI, h: 1.0, y: 1.6, post: true, maxW: 2.6, style: { bg: '#ffe24a', fg: '#1a1a1a', border: '#1a1a1a' }, glow: night ? '#ffe24a' : null }); }
    // infield art pieces
    for (const [kind, ax, az] of D.art) {
      if (kind === 'man') { if (!this.clear(T, ax * 1.25, az * 1.25, 17)) continue; E.man = { x: ax * 1.25, z: az * 1.25 }; CartScene.mesh(api, E.man.x, E.man.z, 0, m => { m.color('#6a4a32').shine(1); m.lathe([[16, 0], [14, 2.2], [9, 2.4], [8.5, 5.2], [0, 5.4]], { seg: 8, uv: BURNS_ATLAS.pattern('wood') }); m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 15, y0: 0, y1: 5.3 }] }; }, { hi: true }); E.art.push({ x: E.man.x, z: E.man.z, r: 15.5 }); api.light(E.man.x, E.man.z, 40, '#ff8a3a', 0.8); continue; }
      const kx = kind === 'gate' ? T.at(T.L * 0.5).x : ax * 1.2, kz = kind === 'gate' ? T.at(T.L * 0.5).z : az * 1.2;
      const yaw = kind === 'gate' ? T.at(T.L * 0.5).yaw : rng() * TAU;
      if (kind !== 'gate' && !this.clear(T, kx, kz, kind === 'temple' ? 14 : kind === 'ribs' ? 12 : 7)) continue;
      const r = CartScene.art(api, kind, kx, kz, yaw, night || D.tod === 'dawn', kind === 'temple' ? 1 : 1.2);
      if (r.r) E.art.push(r);
    }
    // gift boxes (rows across the road), boost pads, ramps
    for (const f of D.gifts) { const g = A(f); for (let k = -2; k <= 2; k++) E.gifts.push({ x: g.x + g.nx * k * g.hw * 0.33, z: g.z + g.nz * k * g.hw * 0.33 }); }
    for (const [f, d] of D.boosts) { const g = A(f); E.boosts.push({ x: g.x + g.nx * d * g.hw, z: g.z + g.nz * d * g.hw, yaw: g.yaw, w: 4.2, l: 6.5, s: f * T.L }); }
    for (const [f, d, h] of D.ramps) { const g = A(f); E.terrain.add(CartFeat.ramp(g.x + g.nx * d * g.hw, g.z + g.nz * d * g.hw, g.yaw, 6, 7, h * 2.2, { col: '#7a5a3a', stripe: night ? '#ff4fd8' : '#ffe24a' })); }
    if (D.theme === 'gate') this.gateRoad(E, T, rng);
    if (D.theme === 'storm') { for (let k = 0; k < 6; k++) { const g = A(0.08 + k * 0.16), side = k % 2 ? 1 : -1; E.terrain.add(CartFeat.mound(g.x + g.nx * side * (g.hw + 30), g.z + g.nz * side * (g.hw + 30), 18, 4.5, { col: '#d8b48a' })); } }
    // grid
    E.spawn = []; for (let k = 0; k < 8; k++) { const g = T.at(T.L - 12 - k * 7.5, {}), d = (k % 2 ? 1 : -1) * g.hw * 0.42; E.spawn.push({ x: g.x + g.nx * d, z: g.z + g.nz * d, yaw: g.yaw }); }
    return this.finish(E);
  },
  // is (x,z) at least r metres outside the road walls?
  clear(T, x, z, r) { const n = T.nearest(x, z); const L = T.locate(x, z, n.i, {}); const w = L.d > 0 ? T.WR[L.i] : T.WL[L.i]; return Math.abs(L.d) > w + r; },
  // Gate Road: a line of vehicles parked along the far side + the gate booths
  gateRoad(E, T, rng) {
    const api = E.api;
    for (let s = 60; s < T.L * 0.42; s += 13) { const g = T.at(s, {}), off = -g.wl - 9; if (!this.clear(T, g.x + g.nx * off, g.z + g.nz * off, 4)) continue; CartScene.prop(api, rng.pick(['rv', 'car', 'van', 'camper', 'boxtruck']), { x: g.x + g.nx * off, z: g.z + g.nz * off, yaw: g.yaw, seed: Math.floor(rng() * 999) }); }
    const g = T.at(T.L * 0.25, {}); for (const side of [1, -1]) { const off = side > 0 ? g.wr + 4 : -g.wl - 4; CartScene.prop(api, 'booth', { x: g.x + g.nx * off, z: g.z + g.nz * off, yaw: g.yaw + Math.PI / 2 }); }
  },

  /* ---------------- battle arenas ---------------- */
  arena(id) {
    const A = cartArena(id), night = A.tod === 'night';
    const fn = this['arena_' + id] || this.arena_skate;
    return fn.call(this, A, night);
  },
  // arena perimeter: a closed polygon (walls) drawn as a barrier
  perimeter(E, poly, style) {
    E.walls = poly;
    const api = E.api, n = poly.length;
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(L / 6));
      for (let j = 0; j < k; j++) {
        const t0 = j / k, t1 = (j + 1) / k, x = lerp(a[0], b[0], (t0 + t1) / 2), z = lerp(a[1], b[1], (t0 + t1) / 2), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]), seg = L / k;
        CartScene.mesh(api, x, z, yaw, m => {
          if (style === 'fence') { m.color('#ff7a2a'); m.box(0, 0.75, 0, 0.05, 1.5, seg); m.color('#5a5a62').shine(2); m.limb(0, 0, -seg / 2, 0, 1.7, -seg / 2, 0.05, 0.05, { seg: 5 }); m.shine(0); }
          else if (style === 'hay') { m.color('#d8b860'); m.roundBox(0, 0.45, 0, 1.0, 0.9, seg - 0.2, 0.12, { uv: BURNS_ATLAS.pattern('canvas') }); m.color('#b8983a'); m.roundBox(0, 0.45, 0, 1.02, 0.12, seg - 0.25, 0.04); }
          else { m.color('#8a8a92').shine(2); m.limb(0, 0, -seg / 2, 0, 2.0, -seg / 2, 0.06, 0.06, { seg: 5 }); m.limb(0, 1.95, -seg / 2, 0, 1.95, seg / 2, 0.04, 0.04, { seg: 4 }); m.limb(0, 1.0, -seg / 2, 0, 1.0, seg / 2, 0.035, 0.035, { seg: 4 }); m.shine(0); m.color('#9a9aa6'); m.box(0, 1.0, 0, 0.02, 1.9, seg); }
        }, { noAO: true });
      }
    }
  },
  arena_skate(A, night) {
    const E = this.base(2001, [-95, -95, 95, 95], '#9a948a', 0.05);
    Object.assign(E, { id: 'skate', arena: A, sky: CART_SKIES[A.tod](), tod: A.tod, music: 'kart2', night: night || A.tod === 'sunset', R: 78 });
    const api = E.api, T = E.terrain, rng = mulberry32(9);
    api.paint((ctx, P, S) => {
      const q = P(-80, -80); ctx.fillStyle = '#b4aea4'; ctx.fillRect(q[0], q[1], 160 * S, 160 * S);
      ctx.strokeStyle = 'rgba(60,56,52,0.25)'; ctx.lineWidth = 0.15 * S; for (let i = -80; i <= 80; i += 5) { let a = P(i, -80), b = P(i, 80); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); a = P(-80, i); b = P(80, i); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      // graffiti blobs
      for (let i = 0; i < 18; i++) { const x = (rng() - 0.5) * 140, z = (rng() - 0.5) * 140, p = P(x, z); ctx.fillStyle = `rgba(${[255, 79, 216].join(',')},0.0)`; ctx.strokeStyle = BURNS_NEON[i % 7]; ctx.globalAlpha = 0.35; ctx.lineWidth = 0.6 * S; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * 1.1, r = (2 + rng() * 3) * S; ctx.lineTo(p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r); } ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 1; }
    });
    // the features: a big bowl, a half-pipe, quarter pipes on the edges, the central funbox (throne), a spine, kickers
    T.add(CartFeat.bowl(-38, -34, 15, 12, 4.2, 3.0, { deck: 2.6 }));
    T.add(CartFeat.halfpipe(38, -36, 0, 34, 7, 4.0, 3.2));
    T.add(CartFeat.funbox(0, 6, 9, 6, 2.2));
    T.add(CartFeat.spine(-40, 38, Math.PI / 2, 22, 4.5, 2.2));
    T.add(CartFeat.qpipe(46, 48, Math.PI * 0.25, 18, 4.5, 2.8, 2.5));
    T.add(CartFeat.qpipe(0, -64, Math.PI, 30, 4.0, 2.6, 2.5));
    T.add(CartFeat.qpipe(-66, 4, -Math.PI / 2, 26, 4.0, 2.6, 2.5));
    T.add(CartFeat.qpipe(66, 6, Math.PI / 2, 26, 4.0, 2.6, 2.5));
    T.add(CartFeat.ramp(-14, -14, Math.PI * 0.75, 5, 5, 1.6, { col: '#8a8a92', stripe: '#38f2ff' }));
    T.add(CartFeat.ramp(16, 26, -Math.PI * 0.25, 5, 5, 1.6, { col: '#8a8a92', stripe: '#ff4fd8' }));
    T.add(CartFeat.ramp(22, -10, Math.PI / 2, 5, 5, 1.5, { col: '#8a8a92', stripe: '#ffe24a' }));
    // grind rails (decor + low obstacles you hop over)
    E.rails = [];
    for (const [x0, z0, x1, z1] of [[-20, 30, 8, 30], [26, 2, 26, -22], [-30, -8, -12, -8]]) {
      E.rails.push({ x0, z0, x1, z1 });
      T.add(Object.assign({ x0: Math.min(x0, x1) - 1, z0: Math.min(z0, z1) - 1, x1: Math.max(x0, x1) + 1, z1: Math.max(z0, z1) + 1 }, { kind: 'rail', noMesh: true, h(x, z) { const dx = x1 - x0, dz = z1 - z0, L2 = dx * dx + dz * dz, t = clamp(((x - x0) * dx + (z - z0) * dz) / L2, 0, 1), d = Math.hypot(x - x0 - dx * t, z - z0 - dz * t); return d < 0.7 ? 0.5 * (1 - d / 0.7) : 0; } }));
      const yaw = Math.atan2(x1 - x0, z1 - z0), L = Math.hypot(x1 - x0, z1 - z0);
      CartScene.mesh(api, (x0 + x1) / 2, (z0 + z1) / 2, yaw, m => { m.color('#d8dce8').shine(3); m.limb(0, 0.55, -L / 2, 0, 0.55, L / 2, 0.07, 0.07, { seg: 8 }); for (let i = 0; i <= Math.floor(L / 4); i++) m.limb(0, 0, -L / 2 + i * 4, 0, 0.55, -L / 2 + i * 4, 0.05, 0.05, { seg: 5 }); m.shine(0); m.color('#ff4fd8', night ? 1 : 0.3); m.limb(0, 0.04, -L / 2, 0, 0.04, L / 2, 0.04, 0.04, { seg: 4 }); m.emissive(0); }, { noAO: true, hi: true });
    }
    // perimeter, light towers, bleachers + crowd, graffiti walls
    const poly = []; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; poly.push([Math.sin(a) * 78, Math.cos(a) * 78]); }
    this.perimeter(E, poly, 'chain');
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; CartScene.prop(api, 'lightTower', { x: Math.sin(a) * 74, z: Math.cos(a) * 74, aim: a + Math.PI }); if (E.night) api.light(Math.sin(a) * 60, Math.cos(a) * 60, 26, '#fff0d8', 0.45); }
    for (const a of [0.45, 2.6, 4.2]) { const x = Math.sin(a) * 84, z = Math.cos(a) * 84; E.spots.push(...CartScene.bleachers(api, x, z, a + Math.PI, 20, 4, rng)); }
    const tags = ['SHRED\nOR\nDEAD', 'NO\nSKATING\n(JK)', 'GNAR\nZONE', 'BOWL-O-\nRAMA'];
    tags.forEach((t, i) => { const a = 1.2 + i * 1.5, x = Math.sin(a) * 72, z = Math.cos(a) * 72; CartScene.mesh(api, x, z, a + Math.PI, m => { m.color('#8a8a92'); m.roundBox(0, 1.6, 0, 6, 3.2, 0.5, 0.1); }, { hi: true }); api.sign(t, x + Math.sin(a + Math.PI) * 0.3, z + Math.cos(a + Math.PI) * 0.3, { yaw: a + Math.PI, h: 2.4, y: 0.4, post: false, maxW: 5.4, style: { bg: BURNS_NEON[i * 2 % 7], fg: '#1a1a1a', border: '#ffffff' }, glow: E.night ? BURNS_NEON[i * 2 % 7] : null }); });
    E.heroes.push({ type: 'badideaguy', x: 6, z: -70, yaw: 0, anim: 'dare' }, { type: 'sparklepony', x: -10, z: 70, yaw: Math.PI, anim: 'cheer' }, { type: 'burnerkid', x: 70, z: -20, yaw: -Math.PI / 2, anim: 'wave' });
    // objective spots
    E.zones = [{ x: 0, z: 6, r: 6.5, name: 'THE THRONE' }, { x: -38, z: -34, r: 8, name: 'THE BOWL' }, { x: 38, z: -36, r: 7, name: 'THE PIPE' }, { x: -40, z: 38, r: 7, name: 'THE SPINE' }];
    for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 10 + rng() * 58; E.orbSpots.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
    E.flagSpots = [{ x: 0, z: 6 }, { x: -38, z: -34 }, { x: 38, z: -36 }];
    E.captures = [{ x: -50, z: 54, r: 7 }, { x: 52, z: 50, r: 7 }, { x: 0, z: -52, r: 7 }];
    E.gifts.push(...[[0, -30], [-20, 10], [20, 12], [0, 40], [-50, -6], [50, -6], [30, 52], [-30, 56]].map(p => ({ x: p[0], z: p[1] })));
    E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; E.spawn.push({ x: Math.sin(a) * 50, z: Math.cos(a) * 50, yaw: a + Math.PI }); }
    return this.finish(E);
  },
  arena_mx(A, night) {
    const E = this.base(2002, [-150, -120, 150, 120], '#b07a4e', 0.12);
    Object.assign(E, { id: 'mx', arena: A, sky: CART_SKIES[A.tod](), tod: A.tod, music: 'kart3', night });
    const api = E.api, T = E.terrain, rng = mulberry32(21);
    // the scramble track: a winding loop (also the race line for the SCRAMBLE objective)
    const pts = cartFillet([[-110, -70], [20, -84], [118, -60], [124, 10], [40, 20], [10, 70], [100, 86], [60, 100], [-60, 96], [-120, 60], [-60, 10], [-128, -10]], 22);
    const TR = new CartTrack({ pts, width: 18, shoulder: 6 }); E.track = TR;
    api.paint((ctx, P, S) => {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const path = () => { ctx.beginPath(); for (let i = 0; i <= TR.N; i += 2) { const k = i % TR.N, q = P(TR.X[k], TR.Z[k]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } ctx.closePath(); };
      ctx.strokeStyle = 'rgba(90,56,34,0.6)'; ctx.lineWidth = 22 * S; path(); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,74,44,0.7)'; ctx.lineWidth = 17 * S; path(); ctx.stroke();
      for (let i = 0; i < 200; i++) { const x = (rng() - 0.5) * 300, z = (rng() - 0.5) * 240, q = P(x, z); ctx.fillStyle = `rgba(70,46,30,${0.08 + rng() * 0.1})`; ctx.beginPath(); ctx.arc(q[0], q[1], (1 + rng() * 4) * S, 0, TAU); ctx.fill(); }
    });
    // features along the course: tabletops, doubles, whoops, berms on the hairpins
    const at = f => TR.at(f * TR.L, {});
    const feat = (f, fn) => { const g = at(f); T.add(fn(g)); };
    feat(0.05, g => CartFeat.table(g.x, g.z, g.yaw, 7, 8, 7, 14, 2.4));
    feat(0.16, g => CartFeat.whoops(g.x, g.z, g.yaw, 8, 3.4, 15, 0.75));
    feat(0.3, g => CartFeat.table(g.x, g.z, g.yaw, 6, 5, 8, 14, 3.0));
    feat(0.42, g => CartFeat.whoops(g.x, g.z, g.yaw, 6, 3.6, 15, 0.85));
    feat(0.55, g => CartFeat.table(g.x, g.z, g.yaw, 7, 10, 7, 14, 2.2));
    feat(0.7, g => CartFeat.ramp(g.x, g.z, g.yaw, 7, 10, 2.6, { col: '#7a4a2a', stripe: '#ff4a3a' }));
    feat(0.82, g => CartFeat.whoops(g.x, g.z, g.yaw, 7, 3.2, 15, 0.7));
    // berms: on the outside of every tight bend
    for (let s = 0; s < TR.L; s += 4) {
      const g = TR.at(s, {});
      if (Math.abs(g.k) < 0.022) continue;
      const r = 1 / Math.abs(g.k), side = g.k > 0 ? 1 : -1, cx = g.x + g.nx * side * r, cz = g.z + g.nz * side * r;
      const a = Math.atan2(g.x - cx, g.z - cz);
      T.add(CartFeat.berm(cx, cz, r + g.hw * 0.3, r + g.hw + 3, a - 0.18, a + 0.18, 2.4, { col: '#9a6a42' }));
      s += 10;
    }
    // hay bales lining the course, tyre stacks, flags, start gate, crowds
    for (let s = 0; s < TR.L; s += 9) { const g = TR.at(s, {}); for (const side of [1, -1]) { const off = side > 0 ? g.wr : -g.wl, x = g.x + g.nx * off, z = g.z + g.nz * off; if (E.terrain.height(x, z) > 0.3) continue; CartScene.mesh(api, x, z, g.yaw, m => { m.color('#d8b860'); m.roundBox(0, 0.42, 0, 0.9, 0.84, 2.0, 0.12, { uv: BURNS_ATLAS.pattern('canvas') }); m.color('#b8983a'); m.roundBox(0, 0.42, 0.55, 0.92, 0.86, 0.06, 0.02); m.roundBox(0, 0.42, -0.55, 0.92, 0.86, 0.06, 0.02); }, { noAO: true }); } }
    for (let s = 20; s < TR.L; s += 50) { const g = TR.at(s, {}), side = Math.floor(s / 50) % 2 ? 1 : -1, off = side > 0 ? g.wr + 3 : -g.wl - 3; CartScene.mesh(api, g.x + g.nx * off, g.z + g.nz * off, 0, m => { m.color('#c8ccd8').shine(3); m.limb(0, 0, 0, 0, 5.5, 0, 0.06, 0.05, { seg: 6 }); m.shine(0); m.color(BURNS_NEON[Math.floor(s / 50) % 7]); m.box(0.7, 5.0, 0, 1.4, 0.9, 0.04); }, { noAO: true }); }
    { const g = TR.at(0, {}); CartScene.prop(api, 'gateArch', { x: g.x, z: g.z, yaw: g.yaw, w: (g.wl + g.wr) + 2, h: 7, text: 'WHOOP-DE-DOO', hi: true }); }
    for (const [x, z, yaw] of [[0, -112, 0], [-140, 30, Math.PI / 2], [140, 40, -Math.PI / 2], [0, 115, Math.PI]]) E.spots.push(...CartScene.bleachers(api, x, z, yaw, 22, 4, rng));
    E.heroes.push({ type: 'dpw', x: -20, z: -100, yaw: 0, anim: 'cheer' }, { type: 'badideaguy', x: 20, z: -100, yaw: 0, anim: 'dare' }, { type: 'ranger', x: 130, z: 0, yaw: -Math.PI / 2, anim: 'wave' });
    for (let i = 0; i < 6; i++) { const x = -120 + i * 48, z = rng() < 0.5 ? -105 : 108; CartScene.prop(api, rng.pick(['rv', 'boxtruck', 'camper']), { x, z, yaw: Math.PI / 2, seed: i }); }
    const poly = [[-140, -110], [140, -110], [140, 110], [-140, 110]]; this.perimeter(E, poly, 'fence');
    E.zones = [{ x: at(0.3).x, z: at(0.3).z, r: 7, name: 'THE TABLETOP' }, { x: 40, z: 20, r: 8, name: 'THE INFIELD' }, { x: -60, z: 10, r: 8, name: 'THE HAIRPIN' }];
    for (let i = 0; i < 40; i++) { const g = TR.at(rng() * TR.L, {}); E.orbSpots.push({ x: g.x + g.nx * (rng() - 0.5) * 14, z: g.z + g.nz * (rng() - 0.5) * 14 }); }
    E.flagSpots = [{ x: 40, z: 20 }, { x: -60, z: 10 }, { x: 10, z: -40 }];
    E.captures = [{ x: -70, z: -60, r: 9 }, { x: 80, z: -40, r: 9 }, { x: 40, z: 75, r: 9 }, { x: -85, z: 55, r: 9 }];
    for (let f = 0.1; f < 1; f += 0.25) { const g = at(f); for (let k = -1; k <= 1; k++) E.gifts.push({ x: g.x + g.nx * k * 5, z: g.z + g.nz * k * 5 }); }
    E.spawn = []; for (let k = 0; k < 8; k++) { const g = TR.at(TR.L - 12 - k * 7.5, {}), d = (k % 2 ? 1 : -1) * g.hw * 0.42; E.spawn.push({ x: g.x + g.nx * d, z: g.z + g.nz * d, yaw: g.yaw }); }
    return this.finish(E);
  },
  arena_playa(A, night) {
    const E = this.base(2003, [-130, -130, 130, 130], '#c4a07c', 0.3);
    Object.assign(E, { id: 'playa', arena: A, sky: CART_SKIES[A.tod](), tod: A.tod, music: 'kart3', night: true });
    const api = E.api, T = E.terrain, rng = mulberry32(33);
    api.paint((ctx, P, S) => { for (let i = 0; i < 260; i++) { const x = (rng() - 0.5) * 250, z = (rng() - 0.5) * 250, q = P(x, z); ctx.fillStyle = `rgba(${rng() < 0.5 ? '90,64,50' : '230,200,170'},${0.05 + rng() * 0.08})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (2 + rng() * 8) * S, (1 + rng() * 4) * S, rng() * 3, 0, TAU); ctx.fill(); } });
    // giant art: the hand in the middle (the hill around it), ribs, lotus, spinner, obelisk
    T.add(CartFeat.mound(0, 0, 26, 3.4, { col: '#c8a682' }));
    const pieces = [['hand', 0, 0], ['lotus', -62, -48], ['spinner', 66, -44], ['obelisk', 58, 62], ['ribs', -60, 58]];
    for (const [k, x, z] of pieces) { const r = CartScene.art(api, k, x, z, k === 'ribs' ? 0.6 : rng() * TAU, true, 1.1); if (r.r) E.art.push(r); }
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.4, r = 70 + rng() * 25; T.add(CartFeat.mound(Math.sin(a) * r, Math.cos(a) * r, 12 + rng() * 6, 1.6 + rng() * 1.6, { col: '#c4a07c' })); }
    T.add(CartFeat.ramp(-28, 20, 2.2, 6, 7, 1.9, { col: '#6a4a32', stripe: '#ff4fd8' }));
    T.add(CartFeat.ramp(30, -24, -1.0, 6, 7, 1.9, { col: '#6a4a32', stripe: '#38f2ff' }));
    // fire barrels + lamps around the edge, the trash fence perimeter, camps outside it
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, x = Math.sin(a) * 96, z = Math.cos(a) * 96; CartScene.prop(api, 'barrel', { x, z }); api.fire(x, 0.95, z, 0.35, { hazard: false }); }
    const poly = []; for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; poly.push([Math.sin(a) * 108, Math.cos(a) * 108]); }
    this.perimeter(E, poly, 'fence');
    let ni = 3; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.2; CartScene.camp(api, Math.sin(a) * 122, Math.cos(a) * 122, a + Math.PI, rng, true, ni++); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.8, x = Math.sin(a) * 101, z = Math.cos(a) * 101; for (let k = 0; k < 14; k++) E.spots.push({ x: x + (rng() - 0.5) * 16, z: z + (rng() - 0.5) * 6, yaw: a + Math.PI + (rng() - 0.5) * 0.5 }); }
    E.heroes.push({ type: 'firespinner', x: 0, z: -40, yaw: 0, anim: 'firespin' }, { type: 'lamplighter', x: 40, z: 10, yaw: -1, anim: 'lantern' }, { type: 'deathguild', x: -40, z: 0, yaw: 1, anim: 'cheer' }, { type: 'fencebot_a', x: 90, z: 30, yaw: -1.5, anim: 'robot' }, { type: 'fencebot_b', x: 92, z: 34, yaw: -1.5, anim: 'robot' });
    E.zones = [{ x: 0, z: 0, r: 9, name: 'THE BIG HAND' }, { x: -62, z: -48, r: 8, name: 'THE LOTUS' }, { x: 66, z: -44, r: 8, name: 'THE SPINNER' }, { x: 58, z: 62, r: 8, name: 'THE OBELISK' }];
    for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 12 + rng() * 80; E.orbSpots.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
    E.flagSpots = [{ x: 0, z: 30 }, { x: -40, z: 0 }, { x: 40, z: 10 }];
    E.captures = [{ x: -62, z: -48, r: 9 }, { x: 66, z: -44, r: 9 }, { x: 58, z: 62, r: 9 }, { x: -60, z: 58, r: 9 }];
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.3, r = 45 + (i % 2) * 22; E.gifts.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
    E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; E.spawn.push({ x: Math.sin(a) * 80, z: Math.cos(a) * 80, yaw: a + Math.PI }); }
    return this.finish(E);
  }
};
