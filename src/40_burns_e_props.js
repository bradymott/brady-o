/* ============================================================
   BRADY GOES TO BURNING MAN — prop library
   Every builder appends geometry to a BurnsMesh at its current transform
   (origin = prop footprint centre on the ground, front = +Z) and returns
     { cols: [collider descriptors, local space], lights: [glow points], top }
   Collider descriptor (local): { t:'box', x, z, hx, hz, y0, y1, yaw? } |
     { t:'cyl', x, z, r, y0, y1 } | { t:'dome', x, z, r, y0 } |
     { t:'ramp', x, z, hx, hz, y0, ya, yb, yaw? }   (ramp rises from ya at -z to yb at +z)
   Optional flags on a collider: walk (default true), solid (default true),
   cover (blocks the Man's neon flash), camPass (camera ignores it), spring.
   Light point (local): { x, y, z, s (size), c (hex), beam: yaw (ground headlight pool) }
   ============================================================ */

const BurnsProps = {
  rngFor(o) { return mulberry32(o && o.seed !== undefined ? o.seed : 1234); },
  // a real tyre: rounded rubber torus, sidewall, shiny hub with a cap (axle along X)
  wheel(m, x, y, z, r, w, col) {
    m.push(); m.tf(x, y, z, 0, 0, Math.PI / 2);
    if (m.lo) {   // distant / LOD: a smooth tyre drum and a hub disc (~60 triangles)
      m.color(col || '#1c1c20'); m.cyl(0, -w / 2, 0, r, r, w, 8, { smooth: true });
      m.color('#9a9ea8'); m.cyl(0, -w / 2 - 0.01, 0, r * 0.5, r * 0.5, w + 0.02, 6, { smooth: true });
      m.pop(); return;
    }
    const tr = Math.min(w * 0.5, r * 0.3);
    m.color(col || '#1c1c20').shine(1);
    m.push(); m.tf(0, 0, 0, 0, 0, 0, 1, w / (2 * tr), 1); m.torus(0, 0, 0, r - tr, tr, { seg: 14, tseg: 6 }); m.pop();
    m.shine(0); m.color('#26262c'); m.cyl(0, -w * 0.4, 0, r - tr, r - tr, w * 0.8, 10, { caps: false });
    m.color('#b8bcc8').shine(3); m.cyl(0, -w * 0.36, 0, r * 0.52, r * 0.52, w * 0.72, 10, { smooth: true });
    m.color('#6a6e78'); m.cyl(0, -w * 0.4, 0, r * 0.17, r * 0.17, w * 0.8, 6, { smooth: true });
    m.shine(0); m.pop();
  },
  win(m, x, y, z, w, h, side, lit, rng) {
    // a window on an X-facing side (side = +1 / -1), slightly proud of the surface; glass is glossy
    const glow = lit && rng && rng() < 0.55;
    if (!m.lo) { m.color('#1e1e24').shine(1); m.box(x + side * 0.006, y, z, 0.03, h + 0.08, w + 0.08); }   // rubber frame
    m.color(glow ? '#ffc070' : '#243650', glow ? 0.85 : 0.0).shine(glow ? 0 : 3);
    if (m.lo) m.box(x + side * 0.012, y, z, 0.03, h, w); else m.roundBox(x + side * 0.02, y, z, 0.03, h, w, 0.012, { k: 1, m: 1 });
    m.emissive(0).shine(0);
  },
  // flush wheels with dark wheel-well arches cut into the body sides. zs: axle positions; o: { y0 (body bottom), col, well: false }
  wheels(m, W, zs, r, w, o) {
    o = o || {}; const xo = W / 2 - w * 0.42, y0 = o.y0 === undefined ? r * 0.9 : o.y0, R = r * 1.22;
    for (const z of zs) for (const sd of [1, -1]) {
      if (o.well !== false && y0 < r + R * 0.92) {
        const a0 = Math.asin(clamp((y0 - r) / R, -0.3, 0.92)), n = m.lo ? 4 : 10, x = sd * (W / 2 + 0.006), pts = [];
        for (let i = 0; i <= n; i++) { const a = a0 + (Math.PI - 2 * a0) * i / n; pts.push([x, r + Math.sin(a) * R, z + Math.cos(a) * R]); }
        m.color('#0e0e12'); m.poly(pts, null, [0, r, z]);
      }
      this.wheel(m, sd * xo, r, z, r, w, o.col);
    }
  },
  // rounded bumper bar across the front (z > 0) or back, with a chrome strip
  bumper(m, W, y, z, col) {
    m.color(col || '#26262c').shine(2);
    if (m.lo) m.box(0, y, z, W + 0.04, 0.2, 0.16);
    else { m.roundBox(0, y, z, W + 0.06, 0.24, 0.2, 0.09, { seg: 3 }); m.color('#c8ccd6').shine(3); m.box(0, y + 0.03, z + Math.sign(z || 1) * 0.1, W * 0.86, 0.05, 0.025); }
    m.shine(0);
  },
  // a softly curved roof cap over a boxy body (a flattened capsule along Z)
  roofCap(m, W, y, z0, z1, col, k) { if (m.lo) return; m.color(col).shine(1); m.push(); m.tf(0, y, 0, 0, 0, 0, 1, k || 0.22, 1); m.limb(0, 0, z0, 0, 0, z1, W / 2 - 0.06, W / 2 - 0.06, { seg: 8 }); m.pop(); m.shine(0); },
  // a thin accent stripe along both sides
  trim(m, W, y, z0, z1, col) { if (m.lo) return; m.color(col).shine(2); for (const sd of [1, -1]) m.roundBox(sd * (W / 2 + 0.008), y, (z0 + z1) / 2, 0.02, 0.09, z1 - z0, 0.01); m.shine(0); },
  // swoosh decal along a side
  sideDecal(m, x, y, z, len, h, side, reg) {
    const hw = len / 2, hh = h / 2, sx = x + side * 0.02;
    if (side > 0) m.poly([[sx, y - hh, z + hw], [sx, y + hh, z + hw], [sx, y + hh, z - hw], [sx, y - hh, z - hw]], [[reg.u0, reg.v1], [reg.u0, reg.v0], [reg.u1, reg.v0], [reg.u1, reg.v1]]);
    else m.poly([[sx, y - hh, z - hw], [sx, y + hh, z - hw], [sx, y + hh, z + hw], [sx, y - hh, z + hw]], [[reg.u0, reg.v1], [reg.u0, reg.v0], [reg.u1, reg.v0], [reg.u1, reg.v1]]);
  },
  bikeShape(m, x, y, z, yaw, col) {
    // a little parked bicycle (frame + wheels), y = ground under the wheels
    m.push(); m.tf(x, y, z, yaw);
    m.color('#1a1a1a');
    for (const wz of [-0.5, 0.5]) {
      m.push(); m.tf(0, 0.34, wz, 0, 0, Math.PI / 2);
      if (m.lo) m.cyl(0, -0.025, 0, 0.34, 0.34, 0.05, 8, { caps: true });
      else {
        // near LOD: an open rim (double-sided ring) and two crossing spokes, so the wheel reads as a bicycle wheel
        for (let k = 0; k < 10; k++) {
          const a0 = k / 10 * TAU, a1 = (k + 1) / 10 * TAU, o0 = [Math.sin(a0) * 0.34, 0, Math.cos(a0) * 0.34], o1 = [Math.sin(a1) * 0.34, 0, Math.cos(a1) * 0.34];
          const i0 = [o0[0] * 0.86, 0, o0[2] * 0.86], i1 = [o1[0] * 0.86, 0, o1[2] * 0.86];
          m.poly([o0, o1, i1, i0]); m.poly([i0, i1, o1, o0]);
        }
        m.color('#9a9a96'); m.beam(-0.3, 0, 0, 0.3, 0, 0, 0.014); m.beam(0, 0, -0.3, 0, 0, 0.3, 0.014); m.color('#1a1a1a');
      }
      m.pop();
    }
    m.color(col || '#ff4fd8');
    m.beam(0, 0.36, -0.5, 0, 0.72, 0.02, 0.05); m.beam(0, 0.36, -0.5, 0, 0.62, 0.35, 0.05); m.beam(0, 0.72, 0.02, 0, 0.62, 0.35, 0.05); m.beam(0, 0.62, 0.35, 0, 0.36, 0.5, 0.045);
    m.color('#2a2a2a'); m.box(0, 0.78, 0.02, 0.1, 0.04, 0.2); m.beam(-0.25, 0.86, 0.4, 0.25, 0.86, 0.4, 0.035);
    m.pop();
  },
  /* ---------------- vehicles (front = +Z) ---------------- */
  rv(m, o) {
    o = o || {}; const r = this.rngFor(o);
    const L = o.len || 9 + r() * 1.5, W = 2.5, H = o.h || 3.3, col = o.col || r.pick(['#f2ece0', '#ece6da', '#f4f4f0', '#e8e0cc']);
    const zf = L / 2, zb = -L / 2, cab = zf - 2.2;
    m.color('#26262c'); m.box(0, 0.48, 0, W - 0.25, 0.32, L - 0.5);
    m.color(col).shine(1); m.bbox(0, (0.72 + H) / 2, (cab + zb) / 2, W, H - 0.72, cab - zb, 0.42);
    m.bbox(0, (2.3 + H) / 2, (cab + zf - 0.6) / 2, W - 0.06, H - 2.3, zf - 0.6 - cab, 0.38);
    m.color(o.cabCol || col); m.bbox(0, 1.5, cab + 0.65, W - 0.1, 1.6, 1.3, 0.4);
    m.bbox(0, 1.08, zf - 0.45, W - 0.2, 0.72, 0.9, 0.28); m.shine(0);
    m.color('#1a2232', 0.05); m.box(0, 1.85, cab + 1.31, W - 0.35, 0.7, 0.04); m.box(W / 2 + 0.005, 1.85, cab + 0.8, 0.03, 0.6, 0.8); m.box(-W / 2 - 0.005, 1.85, cab + 0.8, 0.03, 0.6, 0.8); m.emissive(0);
    m.color('#2a2a30'); m.box(0, 1.05, zf + 0.01, 1.2, 0.35, 0.04); m.box(0, 0.62, zf + 0.05, W - 0.1, 0.22, 0.12);
    m.color('#fff4d0', 1); m.box(0.85, 1.12, zf + 0.02, 0.32, 0.18, 0.04); m.box(-0.85, 1.12, zf + 0.02, 0.32, 0.18, 0.04);
    m.color('#ff2a2a', 1); m.box(1.0, 1.0, zb - 0.01, 0.2, 0.35, 0.04); m.box(-1.0, 1.0, zb - 0.01, 0.2, 0.35, 0.04); m.emissive(0);
    // stripes / swoosh
    const reg = BURNS_ATLAS.pattern('swoosh');
    this.sideDecal(m, W / 2, 1.6, (cab + zb) / 2, cab - zb - 0.3, 1.4, 1, reg);
    this.sideDecal(m, -W / 2, 1.6, (cab + zb) / 2, cab - zb - 0.3, 1.4, -1, reg);
    // windows
    for (let i = 0; i < 3; i++) { const z = zb + 1.4 + i * (cab - zb - 2) / 2.2; this.win(m, W / 2, 2.2, z, 1.0, 0.55, 1, true, r); this.win(m, -W / 2, 2.2, z, 1.0, 0.55, -1, true, r); }
    this.win(m, W / 2, 2.6, (cab + zf - 0.6) / 2, 0.8, 0.35, 1, true, r); this.win(m, -W / 2, 2.6, (cab + zf - 0.6) / 2, 0.8, 0.35, -1, true, r);
    // door (right side = -X) + step
    m.color(shade(col, -0.08)); m.box(-W / 2 - 0.01, 1.6, cab - 1.0, 0.03, 1.8, 0.75);
    this.win(m, -W / 2 - 0.005, 2.1, cab - 1.0, 0.4, 0.45, -1, true, r);
    m.color('#3a3a40'); m.box(-W / 2 - 0.2, 0.5, cab - 1.0, 0.4, 0.08, 0.7);
    // wheels
    this.wheels(m, W, [zf - 1.0, zb + 1.9, zb + 2.6], 0.46, 0.3, { y0: 0.72 });
    this.bumper(m, W - 0.1, 0.6, zf + 0.06); this.bumper(m, W - 0.1, 0.62, zb - 0.02);
    this.roofCap(m, W, H, zb + 0.45, cab - 0.25, col, 0.2);
    this.trim(m, W, 1.12, zb + 0.3, zf - 0.4, r.pick(['#c83a2a', '#2a5aa8', '#d8a020', '#3a8a5a']));
    if (!m.lo) { m.color('#e8e8ec').shine(1); m.limb(-W / 2 - 0.09, H - 0.32, zb + 1.0, -W / 2 - 0.09, H - 0.32, cab - 1.6, 0.075, 0.075, { seg: 8 }); m.color('#9a9aa2'); for (const zz of [zb + 1.0, cab - 1.6]) m.roundBox(-W / 2 - 0.04, H - 0.32, zz, 0.08, 0.14, 0.06, 0.02); m.shine(0); }
    // roof
    const acz = (cab + zb) / 2 + 0.5;
    if (m.lo) { m.color('#e8e8e8'); m.box(0, H + 0.16, acz, 0.8, 0.32, 0.9); }
    else {   // rooftop AC: a rounded shroud, a dark fan grille on top and louvres down one side
      m.color('#ececf0').shine(1); m.roundBox(0, H + 0.16, acz, 0.8, 0.32, 0.9, 0.07, { k: 1, m: 1 });
      m.color('#3a3a42').shine(0); m.cyl(0, H + 0.315, acz, 0.22, 0.22, 0.02, 10, {});
      for (let k = -2; k <= 2; k++) m.box(0.405, H + 0.16, acz + k * 0.15, 0.02, 0.16, 0.06);
    }
    m.color('#c8c8c8'); m.box(0.6, H + 0.07, zb + 1.2, 0.4, 0.14, 0.4);
    if (o.solar || r() < 0.35) { m.color('#1a2a5a', 0.05); m.box(0, H + 0.08, zb + 2.6, 1.6, 0.06, 1.2); m.emissive(0); }
    // rear ladder + bike rack
    if (m.lo) { m.color('#9a9aa2'); m.box(0.7, (H + 0.9) / 2, zb - 0.06, 0.04, H - 0.9, 0.04); m.box(0.35, (H + 0.9) / 2, zb - 0.06, 0.04, H - 0.9, 0.04); for (let y = 1.2; y < H; y += 0.35) m.box(0.525, y, zb - 0.06, 0.35, 0.03, 0.03); }
    else {   // round aluminium rails and rungs
      m.color('#b4b4bc').shine(2);
      for (const lx of [0.35, 0.7]) m.limb(lx, 0.9, zb - 0.07, lx, H - 0.02, zb - 0.07, 0.022, 0.022, { seg: 6 });
      for (let y = 1.2; y < H; y += 0.35) m.limb(0.35, y, zb - 0.07, 0.7, y, zb - 0.07, 0.016, 0.016, { seg: 5, ends: false });
      m.shine(0);
    }
    m.color('#2a2a30'); m.box(-0.2, 0.95, zb - 0.32, 1.7, 0.08, 0.5);
    if (o.bikes !== false) { this.bikeShape(m, -0.55, 0.98, zb - 0.3, Math.PI / 2, r.pick(BURNS_NEON)); this.bikeShape(m, 0.15, 0.98, zb - 0.38, Math.PI / 2, r.pick(BURNS_NEON)); }
    const cols = [
      { t: 'box', x: 0, z: (zb + zf - 0.6) / 2, hx: W / 2, hz: (zf - 0.6 - zb) / 2, y0: 0, y1: H, cover: true },
      { t: 'box', x: 0, z: zf - 0.45, hx: W / 2 - 0.1, hz: 0.48, y0: 0, y1: 1.45 },
      { t: 'box', x: -0.2, z: zb - 0.3, hx: 0.9, hz: 0.3, y0: 0, y1: 1.05 }
    ];
    const lights = [{ x: 0.85, y: 1.12, z: zf + 0.1, s: 1.1, c: '#fff0c8', beam: 0 }, { x: -0.85, y: 1.12, z: zf + 0.1, s: 1.1, c: '#fff0c8', beam: 0 }, { x: 1.0, y: 1.0, z: zb - 0.1, s: 0.8, c: '#ff3020' }, { x: -1.0, y: 1.0, z: zb - 0.1, s: 0.8, c: '#ff3020' }];
    return { cols, lights, top: H, len: L, w: W };
  },
  camper(m, o) {
    o = o || {}; const r = this.rngFor(o);
    const L = 6.2, W = 2.2, col = o.col || r.pick(['#a83a2a', '#2a4a8a', '#e8e0d0', '#3a6a3a', '#5a5a64']), shell = o.shell || r.pick(['#e8e4dc', '#d8d0c0', '#f4f0e8']);
    const zf = L / 2, zb = -L / 2;
    m.color('#26262c'); m.box(0, 0.42, 0, W - 0.2, 0.3, L - 0.4);
    m.color(col).shine(1); m.bbox(0, 0.95, zf - 0.9, W, 0.75, 1.8, 0.28); m.bbox(0, 1.45, zf - 2.3, W - 0.05, 1.3, 1.4, 0.32);
    m.color('#1a2232', 0.04); m.box(0, 1.75, zf - 1.62, W - 0.3, 0.5, 0.05); m.emissive(0);
    m.color(col); m.box(0, 0.95, (zb + zf - 3) / 2, W, 0.75, zf - 3 - zb);
    m.color(shell); m.bbox(0, 1.95, (zb + zf - 2.95) / 2, W + 0.15, 1.6, zf - 2.95 - zb + 0.2, 0.4); m.shine(0);
    this.win(m, (W + 0.15) / 2, 2.1, (zb + zf - 3) / 2, 1.2, 0.5, 1, true, r); this.win(m, -(W + 0.15) / 2, 2.1, (zb + zf - 3) / 2, 1.2, 0.5, -1, true, r);
    m.color('#fff4d0', 1); m.box(0.7, 1.0, zf + 0.01, 0.3, 0.16, 0.04); m.box(-0.7, 1.0, zf + 0.01, 0.3, 0.16, 0.04);
    m.color('#ff2a2a', 1); m.box(0.85, 1.0, zb - 0.01, 0.18, 0.25, 0.04); m.box(-0.85, 1.0, zb - 0.01, 0.18, 0.25, 0.04); m.emissive(0);
    this.wheels(m, W, [zf - 1.0, zb + 1.2], 0.42, 0.28, { y0: 0.58 });
    this.bumper(m, W - 0.1, 0.5, zf + 0.04); this.bumper(m, W - 0.1, 0.52, zb - 0.02, '#9a9ea8');
    if (r() < 0.6) { m.color('#3a3a40'); m.box(0, 2.82, -0.6, 1.4, 0.06, 2.0); this.bikeShape(m, 0.35, 2.85, -0.6, 0, r.pick(BURNS_NEON)); this.bikeShape(m, -0.35, 2.85, -0.6, 0, r.pick(BURNS_NEON)); }
    const cols = [
      { t: 'box', x: 0, z: zf - 0.9, hx: W / 2, hz: 0.9, y0: 0, y1: 1.33 },
      { t: 'box', x: 0, z: zf - 2.3, hx: W / 2, hz: 0.7, y0: 0, y1: 2.1 },
      { t: 'box', x: 0, z: (zb + zf - 2.95) / 2, hx: (W + 0.15) / 2, hz: (zf - 2.95 - zb + 0.2) / 2, y0: 0, y1: 2.75, cover: true }
    ];
    return { cols, lights: [{ x: 0.7, y: 1.0, z: zf + 0.1, s: 1.0, c: '#fff0c8', beam: 0 }, { x: -0.7, y: 1.0, z: zf + 0.1, s: 1.0, c: '#fff0c8', beam: 0 }, { x: 0.85, y: 1.0, z: zb - 0.1, s: 0.7, c: '#ff3020' }, { x: -0.85, y: 1.0, z: zb - 0.1, s: 0.7, c: '#ff3020' }], top: 2.75, len: L, w: W };
  },
  boxtruck(m, o) {
    o = o || {}; const r = this.rngFor(o);
    const L = o.len || 8.2, W = 2.5, H = 3.8, col = o.col || r.pick(['#f4f4f0', '#ff8a1a', '#f4f4f0', '#e8e8e0']), cabCol = o.cabCol || r.pick(['#f4f4f0', '#c8202a', '#2a4a9a']);
    const zf = L / 2, zb = -L / 2, boxF = zf - 2.5;
    m.color('#26262c'); m.box(0, 0.5, 0, W - 0.3, 0.32, L - 0.4);
    m.color(col); m.bbox(0, (0.8 + H) / 2, (boxF + zb) / 2, W, H - 0.8, boxF - zb, 0.2);
    m.color(cabCol).shine(1); m.bbox(0, 1.55, boxF + 1.15, W - 0.1, 1.9, 1.9, 0.45); m.shine(0);
    m.color('#1a2232', 0.04); m.box(0, 2.05, boxF + 2.11, W - 0.4, 0.75, 0.04); m.box(W / 2 - 0.04, 2.0, boxF + 1.4, 0.04, 0.6, 0.8); m.box(-W / 2 + 0.04, 2.0, boxF + 1.4, 0.04, 0.6, 0.8); m.emissive(0);
    m.color('#2a2a30'); m.box(0, 0.75, zf + 0.02, W - 0.2, 0.25, 0.12); m.box(0, 1.15, zf - 0.03, 1.2, 0.4, 0.04);
    m.color('#fff4d0', 1); m.box(0.85, 1.2, zf + 0.01, 0.3, 0.2, 0.04); m.box(-0.85, 1.2, zf + 0.01, 0.3, 0.2, 0.04);
    m.color('#ff2a2a', 1); m.box(1.05, 1.0, zb - 0.01, 0.15, 0.3, 0.04); m.box(-1.05, 1.0, zb - 0.01, 0.15, 0.3, 0.04); m.emissive(0);
    // roll-up door stripes
    m.color(shade(col, -0.15)); for (let y = 1.0; y < H - 0.2; y += 0.28) m.box(0, y, zb - 0.015, W - 0.4, 0.06, 0.03);
    // side graphic: big text-free stripes
    const sc = r.pick(BURNS_NEON); m.color(sc); m.box(W / 2 + 0.01, 2.3, (boxF + zb) / 2, 0.02, 0.5, boxF - zb - 0.6); m.box(-W / 2 - 0.01, 2.3, (boxF + zb) / 2, 0.02, 0.5, boxF - zb - 0.6);
    this.wheels(m, W, [zf - 1.2, zb + 1.3], 0.48, 0.32, { y0: 0.62 });
    this.bumper(m, W - 0.1, 0.55, zf + 0.06);
    // lift gate step at the back
    m.color('#5a5a62'); m.box(0, 0.95, zb - 0.35, W - 0.3, 0.1, 0.7);
    if (o.cargo !== false && r() < 0.5) { m.color('#3a3a40'); m.box(0, H + 0.05, zb + 2, 1.8, 0.1, 2.5); m.color(r.pick(BURNS_NEON)); m.box(0.4, H + 0.35, zb + 2, 0.7, 0.5, 0.9); m.color('#c8a060'); m.box(-0.5, H + 0.3, zb + 1.6, 0.7, 0.4, 0.7); }
    const cols = [
      { t: 'box', x: 0, z: (boxF + zb) / 2, hx: W / 2, hz: (boxF - zb) / 2, y0: 0, y1: H, cover: true },
      { t: 'box', x: 0, z: boxF + 1.15, hx: W / 2 - 0.05, hz: 0.98, y0: 0, y1: 2.5 },
      { t: 'box', x: 0, z: zb - 0.35, hx: W / 2 - 0.15, hz: 0.35, y0: 0, y1: 1.0 }
    ];
    return { cols, lights: [{ x: 0.85, y: 1.2, z: zf + 0.1, s: 1.1, c: '#fff0c8', beam: 0 }, { x: -0.85, y: 1.2, z: zf + 0.1, s: 1.1, c: '#fff0c8', beam: 0 }, { x: 1.05, y: 1.0, z: zb - 0.1, s: 0.7, c: '#ff3020' }, { x: -1.05, y: 1.0, z: zb - 0.1, s: 0.7, c: '#ff3020' }], top: H, len: L, w: W };
  },
  car(m, o) {
    o = o || {}; const r = this.rngFor(o);
    const L = 4.6, W = 1.9, col = o.col || r.pick(['#c8202a', '#2a5ac8', '#f4f4f0', '#1a1a1e', '#8a8a92', '#e8b020', '#3a8a5a', '#6a2a8a']);
    const zf = L / 2, zb = -L / 2;
    m.color(col).shine(2); m.bbox(0, 0.68, 0, W, 0.62, L, 0.26);
    m.bbox(0, 1.22, -0.25, W - 0.2, 0.5, 2.3, 0.26); m.shine(0);
    m.color('#1a2232', 0.05); m.box(0, 1.22, 0.92, W - 0.35, 0.4, 0.05); m.box(0, 1.22, -1.42, W - 0.35, 0.36, 0.05); m.box(W / 2 - 0.09, 1.24, -0.25, 0.03, 0.34, 2.0); m.box(-W / 2 + 0.09, 1.24, -0.25, 0.03, 0.34, 2.0); m.emissive(0);
    m.color('#fff4d0', 1); m.box(0.65, 0.78, zf + 0.01, 0.35, 0.14, 0.04); m.box(-0.65, 0.78, zf + 0.01, 0.35, 0.14, 0.04);
    m.color('#ff2a2a', 1); m.box(0.7, 0.8, zb - 0.01, 0.3, 0.14, 0.04); m.box(-0.7, 0.8, zb - 0.01, 0.3, 0.14, 0.04); m.emissive(0);
    this.wheels(m, W, [zf - 0.85, zb + 0.85], 0.34, 0.24, { y0: 0.38 });
    this.bumper(m, W - 0.15, 0.48, zf + 0.04, col === '#1a1a1e' ? '#3a3a40' : '#2a2a30'); this.bumper(m, W - 0.15, 0.5, zb - 0.04);
    let top = 1.47;
    if (o.roofBikes || r() < 0.4) { m.color('#2a2a30'); m.box(0.3, 1.5, -0.25, 0.05, 0.06, 2.0); m.box(-0.3, 1.5, -0.25, 0.05, 0.06, 2.0); this.bikeShape(m, 0.3, 1.52, -0.25, 0, r.pick(BURNS_NEON)); this.bikeShape(m, -0.3, 1.52, -0.25, 0, r.pick(BURNS_NEON)); }
    else { m.color('#2a2a30'); m.box(0, 0.8, zb - 0.35, 1.3, 0.06, 0.5); this.bikeShape(m, -0.3, 0.83, zb - 0.32, Math.PI / 2, r.pick(BURNS_NEON)); this.bikeShape(m, 0.3, 0.83, zb - 0.4, Math.PI / 2, r.pick(BURNS_NEON)); }
    if (r() < 0.4) { m.color(r.pick(['#3a3a40', '#c8a060'])); m.bbox(0, 1.6, -0.3, 1.0, 0.28, 1.6, 0.12); top = 1.74; }
    const cols = [
      { t: 'box', x: 0, z: 0, hx: W / 2, hz: L / 2, y0: 0, y1: 0.99 },
      { t: 'box', x: 0, z: -0.25, hx: W / 2 - 0.1, hz: 1.15, y0: 0, y1: top }
    ];
    return { cols, lights: [{ x: 0.65, y: 0.78, z: zf + 0.1, s: 0.9, c: '#fff0c8', beam: 0 }, { x: -0.65, y: 0.78, z: zf + 0.1, s: 0.9, c: '#fff0c8', beam: 0 }, { x: 0.7, y: 0.8, z: zb - 0.1, s: 0.6, c: '#ff3020' }, { x: -0.7, y: 0.8, z: zb - 0.1, s: 0.6, c: '#ff3020' }], top, len: L, w: W };
  },
  bus(m, o) {
    o = o || {}; const r = this.rngFor(o);
    const L = 11, W = 2.5, H = 3.1, zf = L / 2, zb = -L / 2;
    const base = o.col || r.pick(['#e8b020', '#9a6bff', '#3aa0a0', '#ff4f8a']);
    m.color('#26262c'); m.box(0, 0.5, 0, W - 0.3, 0.3, L - 0.5);
    m.color(base).shine(1); m.bbox(0, (0.75 + H) / 2, -0.4, W, H - 0.75, L - 0.8, 0.45);
    m.bbox(0, 1.1, zf - 0.6, W - 0.1, 0.75, 1.2, 0.3); m.shine(0);
    // psychedelic panels
    for (let i = 0; i < 7; i++) { const z = zb + 0.9 + i * 1.35; m.color(BURNS_NEON[(i + (o.seed || 0)) % 7]); m.box(W / 2 + 0.01, 1.3, z, 0.02, 0.55, 1.1); m.box(-W / 2 - 0.01, 1.3, z, 0.02, 0.55, 1.1); }
    for (let i = 0; i < 7; i++) { const z = zb + 0.9 + i * 1.35; this.win(m, W / 2, 2.25, z, 1.0, 0.6, 1, true, r); this.win(m, -W / 2, 2.25, z, 1.0, 0.6, -1, true, r); }
    m.color('#1a2232', 0.04); m.box(0, 2.1, zf - 1.21, W - 0.3, 0.9, 0.04); m.emissive(0);
    m.color('#fff4d0', 1); m.box(0.85, 1.15, zf + 0.01, 0.3, 0.2, 0.04); m.box(-0.85, 1.15, zf + 0.01, 0.3, 0.2, 0.04); m.color('#ff2a2a', 1); m.box(1.0, 1.0, zb + 0.39, 0.2, 0.35, 0.04); m.box(-1.0, 1.0, zb + 0.39, 0.2, 0.35, 0.04); m.emissive(0);
    this.wheels(m, W, [zf - 1.4, zb + 2.0], 0.48, 0.3, { y0: 0.75 });
    this.bumper(m, W + 0.02, 0.62, zf + 0.06, '#1a1a1e'); this.bumper(m, W + 0.02, 0.66, zb - 0.06, '#1a1a1e');
    this.roofCap(m, W, H, zb + 0.5, zf - 1.4, base, 0.24);
    // roof deck with railing + couch
    m.color('#5a3a2a'); m.box(0, H + 0.05, -0.8, W - 0.2, 0.1, 6);
    m.color('#2a2a30'); for (const sx of [1, -1]) { m.box(sx * (W / 2 - 0.12), H + 0.55, -0.8, 0.05, 0.05, 6); for (let k = 0; k < 5; k++) m.box(sx * (W / 2 - 0.12), H + 0.3, -3.6 + k * 1.4, 0.05, 0.5, 0.05); }
    m.color(r.pick(['#a02a5a', '#2a6a8a', '#8a6a2a'])); m.box(0, H + 0.35, -2.4, 1.8, 0.5, 0.7); m.box(0, H + 0.6, -2.7, 1.8, 0.6, 0.18);
    for (let i = 0; i < 8; i++) { m.color(BURNS_NEON[i % 7], 1); m.box(W / 2 - 0.12, H + 0.6, -3.8 + i * 0.85, 0.06, 0.06, 0.06); m.box(-W / 2 + 0.12, H + 0.6, -3.8 + i * 0.85, 0.06, 0.06, 0.06); } m.emissive(0);
    const cols = [
      { t: 'box', x: 0, z: -0.4, hx: W / 2, hz: (L - 0.8) / 2, y0: 0, y1: H + 0.1, cover: true },
      { t: 'box', x: 0, z: zf - 0.6, hx: W / 2 - 0.05, hz: 0.6, y0: 0, y1: 1.47 },
      { t: 'box', x: 0, z: -2.4, hx: 0.9, hz: 0.45, y0: H, y1: H + 0.6 }
    ];
    return { cols, lights: [{ x: 0.85, y: 1.15, z: zf + 0.1, s: 1.1, c: '#fff0c8', beam: 0 }, { x: -0.85, y: 1.15, z: zf + 0.1, s: 1.1, c: '#fff0c8', beam: 0 }], top: H + 0.1, len: L, w: W };
  },
  trailer(m, o) {
    // pickup truck towing a silver travel trailer (total ~12.5m)
    o = o || {}; const r = this.rngFor(o);
    const tL = 7, W = 2.4, H = 2.9;
    m.push(); m.tf(0, 0, -2.6);
    m.color('#c8ccd4').shine(3); m.bbox(0, (0.5 + H) / 2 + 0.1, 0, W, H - 0.5, tL, 0.8); m.shine(0);
    m.color('#9aa0aa'); for (let y = 1.0; y < H; y += 0.45) m.box(0, y, 0, W + 0.02, 0.03, tL - 1.2);
    this.win(m, W / 2, 2.0, 1.5, 1.2, 0.5, 1, true, r); this.win(m, -W / 2, 2.0, 1.5, 1.2, 0.5, -1, true, r); this.win(m, W / 2, 2.0, -1.5, 1.0, 0.5, 1, true, r);
    m.color('#26262c'); m.box(0, 0.35, 0, W - 0.3, 0.2, tL - 1);
    this.wheels(m, W, [0], 0.36, 0.25, { y0: 0.6 });
    m.color('#5a5a62'); m.box(0, 0.45, tL / 2 + 0.6, 0.15, 0.12, 1.4);
    m.color('#ff2a2a', 1); m.box(0.9, 0.8, -tL / 2 - 0.01, 0.2, 0.15, 0.04); m.box(-0.9, 0.8, -tL / 2 - 0.01, 0.2, 0.15, 0.04); m.emissive(0);
    m.pop();
    m.push(); m.tf(0, 0, 3.6);
    const tc = r.pick(['#2a2a30', '#8a1a1a', '#e8e8e8', '#2a4a7a']);
    m.color(tc).shine(2); m.bbox(0, 0.85, 0, 2.1, 0.7, 5.2, 0.26); m.bbox(0, 1.55, 0.35, 1.95, 0.7, 2.0, 0.28); m.shine(0);
    m.color('#1a2232', 0.04); m.box(0, 1.6, 1.36, 1.7, 0.5, 0.04); m.emissive(0);
    m.color('#fff4d0', 1); m.box(0.7, 0.95, 2.61, 0.3, 0.15, 0.04); m.box(-0.7, 0.95, 2.61, 0.3, 0.15, 0.04); m.emissive(0);
    this.wheels(m, 2.1, [1.7, -1.7], 0.4, 0.28, { y0: 0.5 });
    m.pop();
    const cols = [
      { t: 'box', x: 0, z: -2.6, hx: W / 2, hz: tL / 2, y0: 0, y1: H, cover: true },
      { t: 'box', x: 0, z: 3.6, hx: 1.05, hz: 2.6, y0: 0, y1: 1.2 },
      { t: 'box', x: 0, z: 3.95, hx: 0.98, hz: 1.0, y0: 0, y1: 1.9 }
    ];
    return { cols, lights: [{ x: 0.7, y: 0.95, z: 6.3, s: 1.0, c: '#fff0c8', beam: 0 }, { x: -0.7, y: 0.95, z: 6.3, s: 1.0, c: '#fff0c8', beam: 0 }, { x: 0.9, y: 0.8, z: -6.2, s: 0.6, c: '#ff3020' }, { x: -0.9, y: 0.8, z: -6.2, s: 0.6, c: '#ff3020' }], top: H, len: 12.6, w: W };
  },
  van(m, o) {
    o = o || {}; const r = this.rngFor(o);
    const L = 5.8, W = 2.05, H = 2.6, col = o.col || r.pick(['#f4f4f0', '#8a9aa0', '#3a3a40', '#c8a878']), zf = L / 2, zb = -L / 2;
    m.color(col).shine(1); m.bbox(0, (0.5 + H) / 2, -0.35, W, H - 0.5, L - 0.7, 0.42); m.bbox(0, 0.9, zf - 0.45, W - 0.1, 0.8, 0.9, 0.32); m.shine(0);
    m.color('#1a2232', 0.04); m.box(0, 1.75, zf - 0.72, W - 0.3, 0.7, 0.04); this.win(m, W / 2, 1.85, 0.2, 1.4, 0.5, 1, true, r); this.win(m, -W / 2, 1.85, 0.2, 1.4, 0.5, -1, true, r); m.emissive(0);
    m.color('#fff4d0', 1); m.box(0.7, 0.95, zf + 0.01, 0.28, 0.14, 0.04); m.box(-0.7, 0.95, zf + 0.01, 0.28, 0.14, 0.04); m.color('#ff2a2a', 1); m.box(0.85, 1.2, zb + 0.34, 0.12, 0.4, 0.04); m.box(-0.85, 1.2, zb + 0.34, 0.12, 0.4, 0.04); m.emissive(0);
    this.wheels(m, W, [zf - 1.0, zb + 1.2], 0.38, 0.24, { y0: 0.5 });
    this.bumper(m, W - 0.1, 0.45, zf + 0.04); this.bumper(m, W - 0.1, 0.47, zb - 0.04);
    this.roofCap(m, W, H, zb + 0.4, zf - 1.0, col, 0.16);
    m.color('#2a2a30'); m.box(0, H + 0.08, -0.4, 1.7, 0.08, 3.5); m.color('#1a2a5a', 0.05); m.box(0, H + 0.14, -0.4, 1.5, 0.04, 2.6); m.emissive(0);
    const cols = [{ t: 'box', x: 0, z: -0.35, hx: W / 2, hz: (L - 0.7) / 2, y0: 0, y1: H + 0.12, cover: true }, { t: 'box', x: 0, z: zf - 0.45, hx: W / 2 - 0.05, hz: 0.45, y0: 0, y1: 1.3 }];
    return { cols, lights: [{ x: 0.7, y: 0.95, z: zf + 0.1, s: 0.9, c: '#fff0c8', beam: 0 }, { x: -0.7, y: 0.95, z: zf + 0.1, s: 0.9, c: '#fff0c8', beam: 0 }, { x: 0.85, y: 1.2, z: zb + 0.2, s: 0.6, c: '#ff3020' }, { x: -0.85, y: 1.2, z: zb + 0.2, s: 0.6, c: '#ff3020' }], top: H + 0.12, len: L, w: W };
  },
  // pick a random vehicle type
  vehicle(m, o) {
    const r = this.rngFor(o);
    const kind = o.kind || r.weighted([['rv', 4], ['camper', 2], ['boxtruck', 2], ['car', 3], ['bus', 0.7], ['trailer', 1], ['van', 2]]);
    const out = this[kind](m, o); out.kind = kind; return out;
  },
  /* ---------------- camp & gate furniture ---------------- */
  portapotty(m, o) {
    o = o || {}; const col = o.col || '#2a6ac8';
    m.color(col); m.bbox(0, 1.15, 0, 1.2, 2.3, 1.2, 0.08);
    m.color('#e8e8e8'); m.bbox(0, 2.38, 0, 1.3, 0.16, 1.3, 0.06);
    m.color(shade(col, -0.18)); m.box(0, 1.1, 0.61, 0.9, 2.0, 0.03);
    m.color('#ffffff'); m.box(0, 1.95, 0.635, 0.16, 0.16, 0.01);
    m.color(o.occupied ? '#c82a2a' : '#2ac84a', 0.6); m.box(0.32, 1.25, 0.635, 0.14, 0.06, 0.01); m.emissive(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.62, hz: 0.62, y0: 0, y1: 2.46, cover: true }], lights: [], top: 2.46 };
  },
  booth(m, o) {
    o = o || {};
    const col = o.col || '#8a5a3a';
    m.color('#5a4a3a'); m.box(0, 0.1, 0, 2.8, 0.2, 2.8);
    m.color(col); m.box(0, 0.6, 0, 2.4, 0.8, 2.4);
    m.color('#2a2a34'); for (const [x, z] of [[1.15, 1.15], [-1.15, 1.15], [1.15, -1.15], [-1.15, -1.15]]) m.box(x, 1.6, z, 0.12, 1.3, 0.12);
    m.color('#ffd890', 0.5); m.box(0, 1.6, 1.16, 2.2, 1.1, 0.03); m.box(1.16, 1.6, 0, 0.03, 1.1, 2.2); m.box(-1.16, 1.6, 0, 0.03, 1.1, 2.2); m.emissive(0);
    m.color(col); m.box(0, 2.35, 0, 2.6, 0.25, 2.6);
    m.color(o.roof || '#ff4fd8'); m.box(0, 2.6, 0, 3.2, 0.2, 3.2, { taper: 0.8 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; m.color(BURNS_NEON[i % 7], 1); m.box(Math.sin(a) * 1.65, 2.45, Math.cos(a) * 1.65, 0.08, 0.08, 0.08); } m.emissive(0);
    const lights = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; lights.push({ x: Math.sin(a) * 1.65, y: 2.45, z: Math.cos(a) * 1.65, s: 0.35, c: BURNS_NEON[i % 7] }); }
    lights.push({ x: 0, y: 1.5, z: 0, s: 3, c: '#ffc070', pool: 7 });
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.4, hz: 1.4, y0: 0, y1: 2.72, cover: true }], lights, top: 2.72 };
  },
  // big entrance arch: two towers + banner. o.w = opening width, o.text
  gateArch(m, o) {
    o = o || {}; const W = o.w || 16, H = o.h || 8;
    const cols = [], lights = [];
    for (const sx of [-1, 1]) {
      const x = sx * (W / 2 + 1.2);
      m.color('#8a6a4a');
      for (let lvl = 0; lvl < 4; lvl++) { const y = lvl * H / 4; m.color(lvl % 2 ? '#9a7a54' : '#7a5a3a'); m.box(x, y + H / 8, 0, 2.4 - lvl * 0.12, H / 4, 2.4 - lvl * 0.12); }
      m.color('#3a2a1a'); m.box(x, H + 0.15, 0, 2.8, 0.3, 2.8);
      for (let i = 0; i < 6; i++) { m.color(BURNS_NEON[(i + (sx > 0 ? 3 : 0)) % 7], 1); m.box(x + (i % 2 ? 1.25 : -1.25), 0.8 + i * 1.2, 1.25, 0.1, 0.1, 0.1); lights.push({ x: x + (i % 2 ? 1.25 : -1.25), y: 0.8 + i * 1.2, z: 1.25, s: 0.5, c: BURNS_NEON[(i + (sx > 0 ? 3 : 0)) % 7] }); }
      m.emissive(0);
      cols.push({ t: 'box', x, z: 0, hx: 1.3, hz: 1.3, y0: 0, y1: H + 0.3, cover: true });
    }
    // banner beam + sign
    m.color('#3a2a1a'); m.box(0, H - 0.3, 0, W + 2.4, 0.3, 0.3);
    if (o.text) { const reg = BURNS_ATLAS.sign(o.text, { bg: '#2a0a2a', fg: '#ffe0f4', glow: '#ff4fd8', size: 56, border: '#ff4fd8', pad: 30 }); const bw = Math.min(W, 2.2 * reg.aspect); m.color('#ffffff', 0.85); m.decal(0, H - 1.6, 0.18, bw, bw / reg.aspect, reg); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, H - 1.6, 0.18, bw, bw / reg.aspect, reg); m.pop(); m.emissive(0); m.color('#2a0a2a'); m.box(0, H - 1.6, 0, bw + 0.2, bw / reg.aspect + 0.2, 0.3); }
    // string lights across
    for (let i = 0; i <= 16; i++) { const x = -W / 2 + i / 16 * W, y = H - 0.6 - Math.sin(i / 16 * Math.PI) * 1.2; m.color(BURNS_NEON[i % 7], 1); m.box(x, y, 0.3, 0.12, 0.12, 0.12); lights.push({ x, y, z: 0.3, s: 0.45, c: BURNS_NEON[i % 7] }); }
    m.emissive(0);
    return { cols, lights, top: H };
  },
  cone(m, o) {
    m.color('#ff6a1a'); m.cyl(0, 0, 0, 0.2, 0.03, 0.72, 7, {}); m.color('#f4f4f0'); m.cyl(0, 0.36, 0, 0.115, 0.085, 0.12, 7, { caps: false });
    m.color('#ff6a1a'); m.box(0, 0.02, 0, 0.42, 0.04, 0.42);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.2, y0: 0, y1: 0.72, camPass: true }], lights: [], top: 0.72 };
  },
  barrel(m, o) {
    o = o || {};
    m.color('#6a3a2a'); m.cyl(0, 0, 0, 0.34, 0.34, 0.92, 9, { top: '#1a0a05' });
    m.color('#4a2a1a'); m.cyl(0, 0.2, 0, 0.35, 0.35, 0.05, 9, { caps: false }); m.cyl(0, 0.7, 0, 0.35, 0.35, 0.05, 9, { caps: false });
    m.color('#ff8a2a', 0.9); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; m.box(Math.sin(a) * 0.3, 0.45, Math.cos(a) * 0.3, 0.07, 0.07, 0.07); } m.emissive(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.36, y0: 0, y1: 0.95 }], lights: [{ x: 0, y: 1.2, z: 0, s: 2.2, c: '#ff8a2a', pool: 6, fire: true }], top: 0.95, fire: { x: 0, y: 0.95, z: 0, r: 0.3 } };
  },
  fence(m, o) {
    // orange trash-fence panel along local X, length o.len
    o = o || {}; const L = o.len || 10, H = o.h || 1.3;
    m.color('#5a4a3a'); for (let x = -L / 2; x <= L / 2 + 0.01; x += 2.5) m.box(x, H / 2, 0, 0.1, H + 0.2, 0.1);
    m.color('#ff7a1a'); for (let y = 0.2; y < H; y += 0.22) m.box(0, y, 0, L, 0.08, 0.025);
    m.color('#e86a10'); for (let x = -L / 2 + 0.3; x < L / 2; x += 0.6) m.box(x, H / 2, 0, 0.05, H - 0.1, 0.02);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: L / 2, hz: 0.08, y0: 0, y1: H, walk: false }], lights: [], top: H };
  },
  pennants(m, o) {
    // string of flags from (x0,y0,z0) to (x1,y1,z1) in local coords (no colliders)
    const n = o.n || 14;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 0.55) / n, sag = (t) => -Math.sin(t * Math.PI) * (o.sag || 0.8);
      const ax = lerp(o.x0, o.x1, t0), ay = lerp(o.y0, o.y1, t0) + sag(t0), az = lerp(o.z0, o.z1, t0);
      const bx = lerp(o.x0, o.x1, t1), by = lerp(o.y0, o.y1, t1) + sag(t1), bz = lerp(o.z0, o.z1, t1);
      m.color(BURNS_NEON[i % 7]);
      const mx = (ax + bx) / 2, mz = (az + bz) / 2, drop = o.drop || 0.32;
      m.poly([[ax, ay, az], [bx, by, bz], [mx, (ay + by) / 2 - drop, mz]]);
      m.poly([[bx, by, bz], [ax, ay, az], [mx, (ay + by) / 2 - drop, mz]]);
    }
    return { cols: [], lights: [], top: 0 };
  },
  lightTower(m, o) {
    o = o || {};
    m.color('#e8c020'); m.bbox(0, 0.7, 0, 1.6, 1.0, 2.6, 0.1); m.color('#2a2a2a'); m.box(0, 0.2, 0, 1.4, 0.3, 2.4);
    this.wheel(m, 0.85, 0.3, 0, 0.3, 0.2); this.wheel(m, -0.85, 0.3, 0, 0.3, 0.2);
    m.color('#9a9aa2'); m.box(0, 4.6, 0.8, 0.16, 7.2, 0.16);
    const yaw = o.aim || 0, lights = [];
    m.push(); m.tf(0, 8.2, 0.8, yaw);
    m.color('#3a3a40'); m.box(0, 0, 0, 2.0, 0.1, 0.1);
    for (let i = 0; i < 4; i++) { const lx = i % 2 ? 0.55 : -0.55, ly = i < 2 ? 0.35 : -0.25; m.color('#2a2a30'); m.box(lx, ly, 0.1, 0.5, 0.45, 0.2); m.color('#fff8e0', 1); m.box(lx, ly, 0.205, 0.42, 0.36, 0.02); m.emissive(0); }
    m.pop();
    lights.push({ x: Math.sin(yaw) * 0.3, y: 8.2, z: 0.8 + Math.cos(yaw) * 0.3, s: 4, c: '#fff4d8' });
    lights.push({ x: Math.sin(yaw) * 10, y: 0, z: 0.8 + Math.cos(yaw) * 10, s: 0, c: '#fff0d0', pool: 16 });
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.8, hz: 1.3, y0: 0, y1: 1.2 }, { t: 'cyl', x: 0, z: 0.8, r: 0.12, y0: 0, y1: 8.2, camPass: true }], lights, top: 1.2 };
  },
  shade(m, o) {
    o = o || {}; const w = o.w || 5, d = o.d || 5, h = o.h || 2.9, col = o.col || '#d8c8a8';
    m.color('#5a5a62'); for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) m.box(sx * (w / 2 - 0.1), h / 2, sz * (d / 2 - 0.1), 0.1, h, 0.1);
    m.color(col); m.box(0, h + 0.03, 0, w + 0.2, 0.06, d + 0.2, { uv: BURNS_ATLAS.pattern('canvas'), uvFaces: ['py', 'ny'] });
    if (o.lights !== false) { for (let i = 0; i < 10; i++) { const t = i / 9; m.color(BURNS_NEON[i % 7], 1); m.box(-w / 2 + t * w, h - 0.15 - Math.sin(t * Math.PI) * 0.3, d / 2, 0.09, 0.09, 0.09); } m.emissive(0); }
    const lights = []; if (o.lights !== false) for (let i = 0; i < 10; i += 2) { const t = i / 9; lights.push({ x: -w / 2 + t * w, y: h - 0.15 - Math.sin(t * Math.PI) * 0.3, z: d / 2, s: 0.4, c: BURNS_NEON[i % 7] }); }
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ffb070', pool: Math.max(w, d) * 0.9 });
    return { cols: [{ t: 'box', x: 0, z: 0, hx: w / 2 + 0.1, hz: d / 2 + 0.1, y0: h - 0.02, y1: h + 0.06 }, ...[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => ({ t: 'cyl', x: sx * (w / 2 - 0.1), z: sz * (d / 2 - 0.1), r: 0.08, y0: 0, y1: h, camPass: true }))], lights, top: h + 0.06 };
  },
  dome(m, o) {
    o = o || {}; const r = o.r || 5, col = o.col || '#e8e0d0';
    m.color(col); m.dome(0, 0, 0, r, o.freq || 2, { alt: o.alt, lights: o.lights ? BURNS_NEON : null, e: 0, frame: o.frame !== false, frameCol: o.frameCol });
    m.color('#2a1a2a'); m.box(0, 0.9, r - 0.15, 1.2, 1.8, 0.3);
    return { cols: [{ t: 'dome', x: 0, z: 0, r: r, y0: 0, cover: true }], lights: [{ x: 0, y: 0, z: 0, s: 0, c: typeof o.glow === 'string' ? o.glow : (o.glow === true && typeof o.col === 'string' ? o.col : '#ff70c0'), pool: r * 1.6 }], top: r };
  },
  tent(m, o) {
    o = o || {}; const col = o.col || '#3a8a5a';
    m.color(col); m.push(); m.tf(0, 0, 0);
    m.poly([[-1.2, 0, 1.2], [1.2, 0, 1.2], [0, 1.4, 0]]); m.poly([[1.2, 0, -1.2], [-1.2, 0, -1.2], [0, 1.4, 0]]);
    m.color(shade(col, -0.15)); m.poly([[1.2, 0, 1.2], [1.2, 0, -1.2], [0, 1.4, 0]]); m.poly([[-1.2, 0, -1.2], [-1.2, 0, 1.2], [0, 1.4, 0]]);
    m.pop();
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.1, hz: 1.1, y0: 0, y1: 1.0 }], lights: [], top: 1.0 };
  },
  chair(m, o) {
    o = o || {}; const col = o.col || '#2a6ac8';
    m.color('#9a9aa2'); for (const [x, z] of [[0.25, 0.25], [-0.25, 0.25], [0.25, -0.25], [-0.25, -0.25]]) m.box(x, 0.22, z, 0.03, 0.44, 0.03);
    m.color(col); m.box(0, 0.45, 0, 0.55, 0.05, 0.5); m.box(0, 0.75, -0.26, 0.55, 0.6, 0.04);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.3, hz: 0.3, y0: 0, y1: 0.48, camPass: true }], lights: [], top: 0.48 };
  },
  cooler(m, o) {
    o = o || {}; const col = o.col || '#2a8ac8';
    m.color(col); m.bbox(0, 0.28, 0, 0.8, 0.5, 0.45, 0.05); m.color('#f4f4f0'); m.bbox(0, 0.57, 0, 0.82, 0.1, 0.47, 0.03);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.41, hz: 0.24, y0: 0, y1: 0.62 }], lights: [], top: 0.62 };
  },
  couch(m, o) {
    o = o || {}; const col = o.col || '#8a2a5a';
    m.color(col); m.bbox(0, 0.3, 0, 2.0, 0.4, 0.85, 0.08); m.bbox(0, 0.7, -0.35, 2.0, 0.55, 0.2, 0.06); m.bbox(0.95, 0.55, 0, 0.18, 0.4, 0.85, 0.05); m.bbox(-0.95, 0.55, 0, 0.18, 0.4, 0.85, 0.05);
    return { cols: [{ t: 'box', x: 0, z: 0.05, hx: 1.0, hz: 0.42, y0: 0, y1: 0.5 }, { t: 'box', x: 0, z: -0.35, hx: 1.0, hz: 0.1, y0: 0, y1: 0.98 }], lights: [], top: 0.5 };
  },
  // multi-level scaffold tower: platforms every 2m, climbable by jumping
  scaffold(m, o) {
    o = o || {}; const w = o.w || 3, d = o.d || 3, levels = o.levels || 4, lh = o.lh || 2.0;
    const cols = [], lights = [];
    m.color('#9a9aa2');
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) m.box(sx * w / 2, levels * lh / 2, sz * d / 2, 0.08, levels * lh, 0.08);
    for (let l = 1; l <= levels; l++) {
      const y = l * lh, off = (l % 2 ? 1 : -1) * w * 0.25;
      m.color('#8a6a3a'); m.box(off, y, 0, w * 0.6, 0.12, d, { uv: BURNS_ATLAS.pattern('wood'), uvFaces: ['py'] });
      m.color('#9a9aa2'); m.beam(-w / 2, y - lh, d / 2, w / 2, y, d / 2, 0.05); m.beam(w / 2, y - lh, -d / 2, -w / 2, y, -d / 2, 0.05);
      cols.push({ t: 'box', x: off, z: 0, hx: w * 0.3, hz: d / 2, y0: y - 0.12, y1: y + 0.06 });
      m.color(BURNS_NEON[l % 7], 1); m.box(off + w * 0.3, y + 0.1, d / 2, 0.08, 0.08, 0.08); m.emissive(0);
      lights.push({ x: off + w * 0.3, y: y + 0.1, z: d / 2, s: 0.5, c: BURNS_NEON[l % 7] });
    }
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) cols.push({ t: 'cyl', x: sx * w / 2, z: sz * d / 2, r: 0.06, y0: 0, y1: levels * lh, camPass: true });
    return { cols, lights, top: levels * lh };
  },
  sign(m, o) {
    o = o || {};
    const reg = BURNS_ATLAS.sign(o.text || 'SIGN', Object.assign({ bg: '#f4ead0', fg: '#2a1a10', size: 44, border: '#2a1a10', pad: 24 }, o.style || {}));
    const h = o.h || 0.9, w = Math.min(o.maxW || 4, h * reg.aspect), y = o.y || 1.6;
    m.color('#5a4a3a'); if (o.post !== false) { m.box(-w * 0.4, y / 2, -0.02, 0.1, y, 0.1); m.box(w * 0.4, y / 2, -0.02, 0.1, y, 0.1); }
    m.color(o.board || '#3a2a1a'); m.box(0, y + h / 2 - 0.05, -0.04, w + 0.12, h + 0.12, 0.06);
    m.color('#ffffff', o.glow ? 0.9 : 0); m.decal(0, y + h / 2 - 0.05, 0, w, h, reg); m.push(); m.tf(0, 0, -0.08, Math.PI); m.decal(0, y + h / 2 - 0.05, 0, w, h, reg); m.pop(); m.emissive(0);
    return { cols: o.post !== false ? [{ t: 'box', x: 0, z: -0.02, hx: w / 2 + 0.06, hz: 0.08, y0: y - 0.1, y1: y + h, walk: false, camPass: true }] : [], lights: o.glow ? [{ x: 0, y: y + h / 2, z: 0.4, s: w * 0.8, c: o.glow }] : [], top: y + h };
  },
  campFlag(m, o) {
    o = o || {};
    m.color('#3a3a40'); m.cyl(0, 0, 0, 0.06, 0.05, 3.4, 6, {});
    m.color('#5a5a62'); m.cyl(0, 0, 0, 0.35, 0.3, 0.12, 8, {});
    m.color(o.col || '#ff4fd8'); m.poly([[0.05, 3.3, 0], [1.3, 2.95, 0.02], [0.05, 2.55, 0]]); m.poly([[1.3, 2.95, -0.02], [0.05, 3.3, 0], [0.05, 2.55, 0]]);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.1, y0: 0, y1: 3.4, camPass: true, walk: false }], lights: [], top: 3.4 };
  },
  crate(m, o) {
    o = o || {}; const s = o.s || 1;
    m.color(o.col || '#a07a4a'); m.box(0, s / 2, 0, s, s, s, { uv: BURNS_ATLAS.pattern('wood'), uvFaces: 'all' });
    m.color('#6a4a2a'); m.box(0, s / 2, 0, s + 0.02, 0.08, s + 0.02);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: s / 2, hz: s / 2, y0: 0, y1: s }], lights: [], top: s };
  },
  trampoline(m, o) {
    o = o || {}; const r = o.r || 1.4;
    m.color('#3a3a40'); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; m.box(Math.sin(a) * r, 0.25, Math.cos(a) * r, 0.08, 0.5, 0.08); }
    m.color(o.col || '#ff4fd8'); m.cyl(0, 0.45, 0, r + 0.1, r + 0.1, 0.12, 12, {});
    m.color('#1a1a22'); m.cyl(0, 0.5, 0, r - 0.1, r - 0.1, 0.1, 12, {});
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: r + 0.1, y0: 0, y1: 0.6, spring: o.power || 19 }], lights: [], top: 0.6 };
  },
  /* ---------------- art car (generic mutant vehicle; W6 authors build their own) ---------------- */
  artcar(m, o) {
    o = o || {}; const L = o.len || 9, W = o.w || 4, col = o.col || '#2a1a3a', H = 1.6;
    m.color('#1a1a1e'); m.box(0, 0.55, 0, W - 0.6, 0.4, L - 0.8);
    m.color(col); m.bbox(0, 1.1, 0, W, 0.8, L, 0.25);
    m.color('#5a3a2a'); m.box(0, H, 0, W - 0.2, 0.1, L - 0.4, { uv: BURNS_ATLAS.pattern('wood'), uvFaces: ['py'] });
    for (let i = 0; i < 18; i++) { const t = i / 17; m.color(BURNS_NEON[i % 7], 1); m.box(W / 2 + 0.02, 1.1, -L / 2 + 0.4 + t * (L - 0.8), 0.05, 0.12, 0.2); m.box(-W / 2 - 0.02, 1.1, -L / 2 + 0.4 + t * (L - 0.8), 0.05, 0.12, 0.2); } m.emissive(0);
    for (const wz of [L / 2 - 1.5, -L / 2 + 1.5]) { this.wheel(m, W / 2 - 0.35, 0.55, wz, 0.55, 0.4); this.wheel(m, -W / 2 + 0.35, 0.55, wz, 0.55, 0.4); }
    m.color('#2a2a30'); for (const sx of [1, -1]) { m.box(sx * (W / 2 - 0.15), H + 0.5, 0, 0.06, 0.06, L - 0.6); for (let k = 0; k < 6; k++) m.box(sx * (W / 2 - 0.15), H + 0.27, -L / 2 + 0.6 + k * (L - 1.2) / 5, 0.06, 0.5, 0.06); }
    // sculpture: a big glowing fish
    m.color(o.sculpt || '#38c8ff', 0.35); m.push(); m.tf(0, H + 2.2, -0.5); m.sphere(0, 0, 0, 1.6, 8, 6, { squash: 0.7 }); m.cyl(0, -0.5, -2.2, 0, 1.3, 1.0, 4, {}); m.pop(); m.emissive(0);
    m.color('#1a1a1a'); m.box(1.2, H + 0.6, L / 2 - 1.2, 0.8, 1.0, 0.8); m.box(-1.2, H + 0.6, L / 2 - 1.2, 0.8, 1.0, 0.8);
    m.color('#ff4fd8', 0.7); m.cyl(1.2, H + 0.6, L / 2 - 0.79, 0.25, 0.25, 0.02, 8, {}); m.emissive(0);
    m.color('#6a6a72'); m.cyl(W / 2 - 0.5, H, -L / 2 + 0.8, 0.12, 0.08, 1.4, 6, {}); m.cyl(-W / 2 + 0.5, H, -L / 2 + 0.8, 0.12, 0.08, 1.4, 6, {});
    const cols = [{ t: 'box', x: 0, z: 0, hx: W / 2, hz: L / 2, y0: 0, y1: H + 0.05, cover: true }, { t: 'box', x: 0, z: -0.5, hx: 1.4, hz: 1.6, y0: H, y1: H + 3.2 }];
    return { cols, lights: [{ x: 0, y: H + 2.2, z: -0.5, s: 4, c: o.sculpt || '#38c8ff' }], top: H + 0.05, len: L, w: W, poofers: [[W / 2 - 0.5, H + 1.4, -L / 2 + 0.8], [-W / 2 + 0.5, H + 1.4, -L / 2 + 0.8]], seat: [0, H + 0.1, L / 2 - 1.6] };
  },
  // the RED LIGHT DISTRICT camp's RV: hot pink, 3D hearts, feather trim, marquee bulbs, red lanterns, roof deck.
  // Door on the RV's right (-X) side; returns door: [x, z] just outside it (prop-local). o: { lit (default true), len }
  redlightRV(m, o) {
    o = o || {}; const lit = o.lit !== false;
    const R = this.rv(m, { seed: 77, len: o.len || 10, col: '#ff7ac4', cabCol: '#ff5ab4', bikes: false, solar: false });
    const L = R.len, W = R.w, H = R.top, zf = L / 2, zb = -L / 2, cab = zf - 2.2;
    const hpts = []; for (let i = 0; i < 18; i++) { const t = i / 18 * TAU; hpts.push([16 * Math.pow(Math.sin(t), 3) * 0.022, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.022]); }
    const heart = (x, y, z, s, side, col, e) => { m.color(col, e).shine(2); m.push(); m.tf(x, y, z, side * Math.PI / 2, 0, 0, s, s, 1); m.extrude(hpts.slice().reverse(), 0.06, { convex: false }); m.pop(); m.emissive(0).shine(0); };
    // big hearts on both flanks, little ones between
    for (const sd of [1, -1]) {
      heart(sd * (W / 2 + 0.02), 1.9, (cab + zb) / 2 - 0.4, 1.0, sd, '#e0103a', lit ? 0.35 : 0);
      for (let k = 0; k < 4; k++) heart(sd * (W / 2 + 0.015), 1.2 + (k % 2) * 0.35, zb + 1.0 + k * 1.15, 0.38, sd, k % 2 ? '#ffffff' : '#ff2a6a', lit ? 0.25 : 0);
    }
    // fluffy feather trim along the skirt line
    m.color('#ffb0dc'); const fu = BURNS_ATLAS.pattern('fur');
    for (const sd of [1, -1]) { m.push(); m.tf(sd * (W / 2 + 0.03), 0.78, (zf + zb) / 2 - 0.3); m.limb(0, 0, -(L / 2 - 0.4), 0, 0, L / 2 - 0.9, 0.07, 0.07, { seg: 7, uv: fu, rMod: th => 1 + 0.18 * Math.sin(th * 7) }); m.pop(); }
    // marquee bulbs around the roof edge
    const bulbs = [];
    for (let z = zb + 0.3; z < cab; z += 0.55) for (const sd of [1, -1]) bulbs.push([sd * (W / 2 - 0.05), H + 0.04, z]);
    for (let x = -W / 2 + 0.25; x < W / 2; x += 0.5) { bulbs.push([x, H + 0.04, zb + 0.08]); bulbs.push([x, H + 0.04, cab - 0.05]); }
    bulbs.forEach((b, i) => { m.color(i % 3 ? '#fff0c0' : '#ff4f8a', lit ? 1 : 0.1); m.ball(b[0], b[1], b[2], 0.05, { seg: 6, rings: 4 }); });
    m.emissive(0);
    // roof deck rail + a heart-shaped marquee sign frame
    m.color('#2a1418').shine(2);
    for (const sd of [1, -1]) { m.limb(sd * (W / 2 - 0.1), H + 0.75, zb + 0.2, sd * (W / 2 - 0.1), H + 0.75, cab - 0.2, 0.025, 0.025, { seg: 5 }); for (let z = zb + 0.2; z <= cab - 0.15; z += 1.2) m.limb(sd * (W / 2 - 0.1), H, z, sd * (W / 2 - 0.1), H + 0.75, z, 0.02, 0.02, { seg: 4 }); }
    m.shine(0);
    heart(0, H + 0.95, cab - 0.3, 1.6, 0, '#ff2a5a', lit ? 0.6 : 0.05);
    // striped awning over the door (on -X) + red paper lanterns
    const dz = cab - 1.0;
    m.color('#ff5ab4'); m.roundBox(-W / 2 - 0.7, 2.95, dz, 1.4, 0.08, 1.6, 0.03);
    m.color('#ffffff'); for (let k = -2; k <= 2; k += 2) m.roundBox(-W / 2 - 0.7, 2.99, dz + k * 0.28, 1.42, 0.05, 0.26, 0.02);
    m.color('#3a2a30'); m.limb(-W / 2 - 1.36, 0, dz - 0.75, -W / 2 - 1.36, 2.95, dz - 0.75, 0.025, 0.025, { seg: 5 }); m.limb(-W / 2 - 1.36, 0, dz + 0.75, -W / 2 - 1.36, 2.95, dz + 0.75, 0.025, 0.025, { seg: 5 });
    const lights = R.lights.slice();
    for (const k of [-0.55, 0.55]) { m.color('#e0102a', lit ? 0.8 : 0.1); m.ellipsoid(-W / 2 - 1.2, 2.55, dz + k, 0.16, 0.2, 0.16, { seg: 10, rings: 7 }); m.color('#1a0a0a'); m.roundCyl(-W / 2 - 1.2, 2.73, dz + k, 0.07, 0.05, 0.01); if (lit) lights.push({ x: -W / 2 - 1.2, y: 2.55, z: dz + k, s: 1.1, c: '#ff2a3a' }); }
    m.emissive(0);
    if (lit) { lights.push({ x: 0, y: H + 0.95, z: cab - 0.3, s: 2.2, c: '#ff3a7a' }); lights.push({ x: W / 2 + 0.2, y: 1.9, z: (cab + zb) / 2 - 0.4, s: 1.6, c: '#ff2a5a' }); lights.push({ x: -W / 2 - 0.2, y: 1.9, z: (cab + zb) / 2 - 0.4, s: 1.6, c: '#ff2a5a' }); }
    const cols = R.cols.concat([{ t: 'box', x: -W / 2 - 0.7, z: dz, hx: 0.7, hz: 0.8, y0: 2.9, y1: 3.05, solid: false }]);
    return Object.assign({}, R, { cols, lights, door: [-W / 2 - 1.0, dz], sign: [0, H + 1.9, cab - 0.3] });
  },
  // a cork quest board on two posts with pinned notes (api.questBoard makes it interactive)
  questBoard(m, o) {
    o = o || {}; const wd = BURNS_ATLAS.pattern('wood'), col = o.col || '#8a5a32';
    m.color(col); for (const sd of [1, -1]) m.roundBox(sd * 0.95, 1.1, 0, 0.12, 2.2, 0.12, 0.03, { uv: wd });
    m.color(shade(col, -0.15)); m.roundBox(0, 1.45, 0, 2.0, 1.3, 0.1, 0.03, { uv: wd });
    m.color('#c8925a'); m.roundBox(0, 1.45, 0.04, 1.8, 1.1, 0.04, 0.01);
    m.color(shade(col, -0.25)); m.roundBox(0, 2.25, 0.05, 2.3, 0.1, 0.4, 0.03, { uv: wd });
    const notes = ['#fff8e0', '#ffd0e8', '#d0f0ff', '#e0ffd0', '#fff0a0', '#ffe0c8', '#f0e0ff'], rng = this.rngFor(o);
    for (let i = 0; i < 9; i++) { const x = -0.7 + (i % 3) * 0.7 + (rng() - 0.5) * 0.15, y = 1.1 + Math.floor(i / 3) * 0.34 + (rng() - 0.5) * 0.06; m.color(notes[i % notes.length]); m.push(); m.tf(x, y, 0.07, 0, 0, (rng() - 0.5) * 0.3); m.box(0, 0, 0, 0.42, 0.26, 0.01); m.color(['#e02a3a', '#2a6ae0', '#e0b02a'][i % 3]); m.ball(0, 0.1, 0.012, 0.018, { seg: 6, rings: 4 }); m.color('#5a4a4a'); for (let l = 0; l < 3; l++) m.box(-0.02, 0.02 - l * 0.055, 0.007, 0.3, 0.012, 0.004); m.pop(); }
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.05, hz: 0.12, y0: 0, y1: 2.3 }], top: 2.3 };
  },
  // a sticker-covered old wooden trunk (crusty's camp)
  trunk(m, o) {
    o = o || {}; const W = 0.95, H = 0.6, D = 0.55, st = BURNS_ATLAS.pattern('stickers'), wd = BURNS_ATLAS.pattern('wood');
    m.color('#7a5230'); m.roundBox(0, H * 0.42, 0, W, H * 0.84, D, 0.04, { uv: st });
    m.color('#6a4426'); m.push(); m.tf(0, H * 0.84, 0); m.lathe([[D / 2, 0], [D / 2 - 0.01, 0.08], [D * 0.38, 0.14], [0, 0.16]], { seg: 12, sx: W / D, theta0: -Math.PI / 2, theta1: Math.PI / 2, caps: true }); m.lathe([[D / 2, 0], [D / 2 - 0.01, 0.08], [D * 0.38, 0.14], [0, 0.16]], { seg: 12, sx: W / D, theta0: Math.PI / 2, theta1: Math.PI * 1.5, caps: true }); m.pop();
    m.color('#b8a070').shine(3); for (const x of [-W / 2 + 0.08, W / 2 - 0.08]) m.roundBox(x, H * 0.5, 0, 0.05, H, D + 0.02, 0.01); m.roundBox(0, H * 0.78, D / 2 + 0.01, 0.1, 0.1, 0.02, 0.01); m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: W / 2, hz: D / 2, y0: 0, y1: H + 0.12 }], top: H + 0.12 };
  },
  // a crooked, climbable TOWER OF STACKED JUNK CARS with lashed ladders and planks.
  // o: { levels (default 8), seed }. Every car roof is a ledge within mantle reach of the one below. Returns { top, topPos }
  junktower(m, o) {
    o = o || {}; const r = this.rngFor(Object.assign({ seed: 777 }, o)), N = o.levels || 8, cols = [], lights = [];
    const cars = ['#8a3a2a', '#3a5a8a', '#6a6a52', '#9a7a3a', '#5a3a5a', '#3a6a5a', '#8a8a92', '#a85a2a'];
    let y = 0, x = 0, z = 0, yaw = 0;
    const H = 1.32;   // per level: a beater's height
    for (let i = 0; i < N; i++) {
      // each car is offset so part of the roof below stays exposed as a step
      const ang = i * 2.1 + r() * 0.6, off = i ? 1.15 : 0, tilt = (r() - 0.5) * 0.08;
      x = i ? Math.sin(ang) * off * 0.9 : 0; z = i ? Math.cos(ang) * off * 0.9 : 0; yaw = r() * Math.PI;
      const col = cars[i % cars.length], L = 4.0, W = 1.8;
      m.push(); m.tf(x, y, z, yaw, tilt, (r() - 0.5) * 0.06);
      // rusty rounded beater body
      m.color(col).shine(1); m.roundBox(0, 0.62, 0, W, 0.62, L, 0.22); m.roundBox(0, 1.05, -0.2, W - 0.22, 0.48, 2.1, 0.2); m.shine(0);
      m.color('#1c2433', 0.03).shine(3); m.roundBox(0, 1.08, 0.88, W - 0.42, 0.34, 0.04, 0.02); m.roundBox(0, 1.08, -1.27, W - 0.42, 0.3, 0.04, 0.02); m.shine(0).emissive(0);
      m.color('#7a4a2a'); for (let k = 0; k < 3; k++) { m.push(); m.tf((r() - 0.5) * W * 0.8, 0.65 + r() * 0.3, (r() - 0.5) * L * 0.7, r() * 3); m.ellipsoid(0, 0, W / 2 + 0.002, 0.18 + r() * 0.12, 0.1 + r() * 0.08, 0.02, { seg: 8, rings: 4 }); m.pop(); }   // rust patches
      if (i === 0 || r() < 0.5) for (const wz of [1.3, -1.3]) { this.wheel(m, W / 2 - 0.1, 0.32, wz, 0.32, 0.22); this.wheel(m, -W / 2 + 0.1, 0.32, wz, 0.32, 0.22); }
      m.pop();
      // colliders: car body + cabin as one walkable roof box at this level
      cols.push({ t: 'box', x, z, hx: W / 2, hz: L / 2, yaw, y0: y, y1: y + 0.93 });
      cols.push({ t: 'box', x: x - Math.sin(yaw) * 0.2, z: z - Math.cos(yaw) * 0.2, hx: (W - 0.22) / 2, hz: 1.05, yaw, y0: y, y1: y + H });
      // lashed ladder + plank toward the next car
      if (i < N - 1) {
        const a2 = (i + 1) * 2.1, nx = Math.sin(a2) * 1.04, nz = Math.cos(a2) * 1.04;
        m.color('#9a7a4a'); const lx = (x + nx) / 2 + 0.9 * Math.sin(a2 + 1.2), lz = (z + nz) / 2 + 0.9 * Math.cos(a2 + 1.2);
        for (const sd of [-0.22, 0.22]) m.limb(lx + sd * Math.cos(a2), y + 0.1, lz - sd * Math.sin(a2), lx + sd * Math.cos(a2) - Math.sin(a2) * 0.3, y + H + 0.5, lz - sd * Math.sin(a2) - Math.cos(a2) * 0.3, 0.035, 0.035, { seg: 6 });
        for (let k = 1; k < 5; k++) { const t = k / 5; m.limb(lx - 0.22 * Math.cos(a2) - Math.sin(a2) * 0.3 * t, y + 0.1 + (H + 0.4) * t, lz + 0.22 * Math.sin(a2) - Math.cos(a2) * 0.3 * t, lx + 0.22 * Math.cos(a2) - Math.sin(a2) * 0.3 * t, y + 0.1 + (H + 0.4) * t, lz - 0.22 * Math.sin(a2) - Math.cos(a2) * 0.3 * t, 0.025, 0.025, { seg: 5 }); }
        m.color('#3a2a1a'); m.limb(lx, y + H * 0.6, lz, x, y + 0.9, z, 0.012, 0.012, { seg: 4 });   // lashing rope
        if (i % 2 === 0) { m.color('#b08a5a'); m.push(); m.tf((x + nx) / 2, y + H + 0.02, (z + nz) / 2, a2 + 0.4); m.roundBox(0, 0, 0, 0.5, 0.06, 2.2, 0.02); m.pop(); cols.push({ t: 'box', x: (x + nx) / 2, z: (z + nz) / 2, hx: 0.25, hz: 1.1, yaw: a2 + 0.4, y0: y + H - 0.03, y1: y + H + 0.05 }); }
      }
      if (i % 2 === 1) lights.push({ x: x, y: y + 1.4, z: z, s: 0.5, c: BURNS_NEON[i % 7], blink: 3 });
      y += H;
    }
    // a little flag + plank deck on the top car
    m.color('#5a4a3a'); m.limb(x, y, z, x, y + 1.6, z, 0.03, 0.025, { seg: 6 }); m.color('#ff4fd8'); m.push(); m.tf(x, y + 1.3, z); m.roundBox(0.3, 0, 0, 0.6, 0.35, 0.02, 0.01); m.pop();
    lights.push({ x, y: y + 1.7, z, s: 0.9, c: '#ff4fd8', blink: 2 });
    return { cols, lights, top: y, topPos: [x, y, z] };
  },
  saucer(m, o) {
    // flying-saucer-like platform for the final Man encounter (top deck walkable)
    o = o || {}; const R = o.r || 14, H = o.h || 4;
    m.color('#9aa0b0'); m.cyl(0, H - 1.2, 0, R * 0.55, R, 1.2, 24, {}); m.cyl(0, H, 0, R, R * 0.92, 0.5, 24, { top: '#6a6a7a' });
    m.color('#7a8090'); m.sphere(0, H + 0.5, 0, R * 0.35, 12, 6, { hemi: true, squash: 0.45 });
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; m.color(BURNS_NEON[i % 7], 1); m.box(Math.sin(a) * R * 0.98, H - 0.4, Math.cos(a) * R * 0.98, 0.35, 0.25, 0.35); } m.emissive(0);
    m.color('#4a4a52'); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; m.beam(Math.sin(a) * R * 0.5, H - 1.2, Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.8, 0, Math.cos(a) * R * 0.8, 0.4); }
    const lights = []; for (let i = 0; i < 24; i += 2) { const a = i / 24 * TAU; lights.push({ x: Math.sin(a) * R, y: H - 0.4, z: Math.cos(a) * R, s: 1.2, c: BURNS_NEON[i % 7] }); }
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: R, y0: H - 1.2, y1: H + 0.5 }, { t: 'dome', x: 0, z: 0, r: R * 0.35, y0: H + 0.5 }], lights, top: H + 0.5 };
  }
};

/* ---------------- the Man (boss model; original design) ----------------
   The classic lattice "stick man" that stands at the centre of the city: a tall, slender figure of open timber truss
   work (legs apart, a narrow waist under broad shoulders, long arms, a faceted lantern head), outlined in neon tubes,
   with a glowing heart in his chest (he is very much in love). Built on the shared 16-bone layout so BurnsChar drives
   it (city landmark, the bosses, Art Cart's driver and landmark all use this one model). Height ~13m.
   Night neon: the tubes are white emissive vertices and the heart is red; the skinned shader turns them into a
   rainbow that travels outward from the heart in slow waves, with a gentle heartbeat (geo.rainbow, R.skin, uRain).
   By day the tubes are unlit glass and the heart is painted red. */
const BurnsManModel = {
  cache: null,
  body() {
    return {
      h: 1, w: 1,
      off: [
        [0, 5.8, 0], [0, 0.35, 0], [0, 4.0, 0],
        [1.75, 3.75, 0], [0, -2.6, 0], [-1.75, 3.75, 0], [0, -2.6, 0],
        [0.6, -0.25, 0], [0.55, -2.85, 0], [0.45, -2.6, 0], [-0.6, -0.25, 0], [-0.55, -2.85, 0], [-0.45, -2.6, 0],
        [0, -2.4, 0], [0, 2.4, 0], [0, 0, -0.9]
      ],
      headY: 11.4, height: 13
    };
  },
  // the hue of the neon at figure distance d (metres from the heart, unscaled) and time t: the same palette as the
  // shader, for the coloured light the Man casts on his base at night
  hue(d, t, out) {
    const h = ((d * 0.11 - t * 0.07) % 1 + 1) % 1; out = out || [0, 0, 0];
    for (let k = 0; k < 3; k++) out[k] = 0.18 + 0.82 * (0.5 + 0.5 * Math.cos(TAU * (h + k / 3)));
    return out;
  },
  // queue his coloured glow on the base (night only; one light, it only wins when the camera is close)
  light(g, x, y, z, scale) {
    const R = g.R, night = R ? R.night || 0 : 0; if (night < 0.3 || !g.plights) return;
    const c = this._lc || (this._lc = [0, 0, 0]); this.hue(4, g.time || 0, c);
    g.plights.push({ x, y: y + 3.5 * scale, z, r: 16 * scale, c, i: 0.9 * night });
  },
  build(o) {
    if (this.cache && !o) return this.cache;
    o = o || {};
    const m = new BurnsMesh(16384), B = BURNS_BONES;
    const wood = o.wood || '#c99a64', dark = o.dark || '#8a5c38', heart = '#ff2050';
    const rod = (a, b, r, seg) => m.limb(a[0], a[1], a[2], b[0], b[1], b[2], r, r, { seg, ends: false });
    const neon = (a, b) => { m.color('#ffffff', 1); rod(a, b, 0.085, 5); m.emissive(0); };
    // an open truss between two centre points: 4 timber rails, crossed diagonals on every face of every bay and a
    // ring of ties per bay; the two front corners carry the neon outline. w/d: width/depth at a (0) and b (1)
    const truss = (a, b, w0, w1, d0, d1, bays, lit) => {
      const C = (t, k) => { const w = lerp(w0, w1, t) / 2, d = lerp(d0, d1, t) / 2, sx = k === 0 || k === 3 ? 1 : -1, sz = k < 2 ? 1 : -1; return [lerp(a[0], b[0], t) + sx * w, lerp(a[1], b[1], t), lerp(a[2], b[2], t) + sz * d]; };
      m.color(wood).shine(1);
      for (let k = 0; k < 4; k++) rod(C(0, k), C(1, k), 0.13, 6);
      m.color(dark).shine(0);
      for (let i = 0; i < bays; i++) {
        const t0 = i / bays, t1 = (i + 1) / bays;
        for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; rod(C(t0, k), C(t1, k2), 0.055, 4); rod(C(t1, k), C(t0, k2), 0.055, 4); rod(C(t1, k), C(t1, k2), 0.055, 4); }
      }
      for (let k = 0; k < 4; k++) rod(C(0, k), C(0, (k + 1) % 4), 0.055, 4);
      if (lit !== false) for (const k of [0, 1]) { const p = C(0, k), q = C(1, k), dz = 0.1; neon([p[0], p[1], p[2] + dz], [q[0], q[1], q[2] + dz]); }
    };
    // hips: a short truss across the tops of the legs
    m.setBone(B.HIPS); truss([0, -0.35, 0], [0, 0.45, 0], 2.3, 2.3, 1.0, 1.0, 1, false);
    m.color('#ffffff', 1); rod([-1.15, -0.35, 0.6], [1.15, -0.35, 0.6], 0.085, 5); m.emissive(0);
    // torso: narrow at the waist, broad at the shoulders, with a shoulder beam and the heart inside
    m.setBone(B.CHEST); truss([0, 0, 0], [0, 3.85, 0], 1.35, 3.3, 0.95, 1.15, 5);
    m.color(wood).shine(1); rod([-2.0, 3.85, 0], [2.0, 3.85, 0], 0.17, 6); m.shine(0);
    neon([-1.75, 3.98, 0.68], [1.75, 3.98, 0.68]);
    m.color(heart, 1); m.push(); m.tf(0, 2.35, 0.1);
    const hp = []; for (let i = 0; i < 24; i++) { const t = i / 24 * TAU; const x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); hp.push([x * 0.05, y * 0.05]); }
    m.extrude(hp.slice().reverse(), 0.45, { convex: false });
    m.pop(); m.emissive(0);
    // neck and the faceted lantern head: six timber ribs over a pale core, neon on every rib and both rings
    m.setBone(B.HEAD); truss([0, -0.1, 0], [0, 0.7, 0], 0.5, 0.45, 0.5, 0.45, 1, false);
    const hy = 1.9, prof = [[0, -1.25], [0.95, -0.15], [0.78, 0.6], [0, 1.4]];
    m.color('#fffaf0', 0.75); m.push(); m.tf(0, hy, 0); m.lathe(prof.map(p => [p[0] * 0.9, p[1] * 0.92]), { seg: 6 }); m.pop(); m.emissive(0);
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * TAU + Math.PI / 6, s = Math.sin(a), c = Math.cos(a), P = prof.map(p => [s * p[0], hy + p[1], c * p[0]]);
      for (let i = 0; i < 3; i++) { m.color(wood).shine(1); rod(P[i], P[i + 1], 0.07, 4); neon([P[i][0] * 1.04, P[i][1], P[i][2] * 1.04], [P[i + 1][0] * 1.04, P[i + 1][1], P[i + 1][2] * 1.04]); }
      const a2 = a + TAU / 6, s2 = Math.sin(a2), c2 = Math.cos(a2);
      for (const i of [1, 2]) neon([s * prof[i][0] * 1.04, hy + prof[i][1], c * prof[i][0] * 1.04], [s2 * prof[i][0] * 1.04, hy + prof[i][1], c2 * prof[i][0] * 1.04]);
    }
    m.shine(0);
    // arms (they hang at his sides by default; the bosses raise them), hands, legs and feet
    for (const side of [1, -1]) {
      m.setBone(side > 0 ? B.UARM_L : B.UARM_R); truss([0, 0.2, 0], [0, -2.6, 0], 0.62, 0.55, 0.6, 0.52, 3);
      m.setBone(side > 0 ? B.FARM_L : B.FARM_R); truss([0, 0, 0], [0, -2.4, 0], 0.55, 0.45, 0.52, 0.44, 3);
      truss([0, -2.4, 0], [0, -3.3, 0], 0.5, 0.62, 0.36, 0.3, 1);
      const off = this.body().off, sh = off[side > 0 ? B.SHIN_L : B.SHIN_R], ft = off[side > 0 ? B.FOOT_L : B.FOOT_R];
      m.setBone(side > 0 ? B.THIGH_L : B.THIGH_R); truss([0, 0.15, 0], sh, 1.0, 0.82, 0.85, 0.75, 4);
      m.setBone(side > 0 ? B.SHIN_L : B.SHIN_R); truss([0, 0, 0], ft, 0.82, 0.66, 0.75, 0.62, 4);
      m.setBone(side > 0 ? B.FOOT_L : B.FOOT_R); m.color(dark); m.roundBox(0, -0.18, 0.2, 0.95, 0.36, 1.35, 0.08);
      m.color('#ffffff', 1); m.push(); m.tf(0, -0.02, 0.2); for (const [a, b] of [[[-0.5, 0, 0.7], [0.5, 0, 0.7]], [[0.5, 0, 0.7], [0.5, 0, -0.7]], [[0.5, 0, -0.7], [-0.5, 0, -0.7]], [[-0.5, 0, -0.7], [-0.5, 0, 0.7]]]) rod(a, b, 0.07, 4); m.pop(); m.emissive(0);
    }
    const geo = m.geo(); geo.rainbow = { bone: B.CHEST, at: [0, 2.35, 0.1] };
    const model = { geo, nb: BURNS_NB, body: this.body(), headY: 11.4, height: 13, man: true };
    if (!o || !Object.keys(o).length) this.cache = model;
    return model;
  }
};

/* ---------------- the yellow community bike (rigged: frame, wheels, cranks) ---------------- */
const BurnsBikeModel = {
  cache: {},
  build(col) {
    col = col || '#ffd21a';
    if (this.cache[col]) return this.cache[col];
    const m = new BurnsMesh(4096);
    // bone 0 frame, 1 front wheel, 2 rear wheel, 3 cranks, 4 handlebar
    m.setBone(0); m.color(col).shine(2);
    const fz = 0.55, rz = -0.52, wr = 0.36, tube = (a, b, r) => m.limb(a[0], a[1], a[2], b[0], b[1], b[2], r, r, { seg: 8 });
    tube([0, wr, rz], [0, 0.78, 0.05], 0.032); tube([0, wr, rz], [0, 0.42, 0.0], 0.03); tube([0, 0.42, 0.0], [0, 0.78, 0.05], 0.034); tube([0, 0.42, 0.0], [0, 0.82, 0.38], 0.034); tube([0, 0.82, 0.38], [0, wr, fz], 0.03);
    tube([0.08, wr, rz], [0.04, 0.68, -0.06], 0.018); tube([-0.08, wr, rz], [-0.04, 0.68, -0.06], 0.018);
    m.shine(1); m.color('#2a2a2a'); m.ellipsoid(0, 0.87, -0.04, 0.08, 0.035, 0.14, { seg: 10, rings: 6 }); // saddle
    m.color('#c8c8d0').shine(3); m.roundBox(0, 0.62, -0.62, 0.3, 0.035, 0.3, 0.015); // rear rack
    m.shine(0);
    m.push(); m.tf(0, 0.65, 0.62); m.color('#f4f0e8'); m.lathe([[0, 0], [0.13, 0.0], [0.16, 0.2], [0.15, 0.215]], { seg: 10, sz: 0.75 }); m.pop(); // front basket
    m.color('#ff4fd8', 1); for (let i = 0; i < 5; i++) m.ball(0, 0.3 + i * 0.1, -0.06 + i * 0.07, 0.025, { seg: 6, rings: 4 }); m.emissive(0);
    for (const b of [1, 2]) {
      m.setBone(b); m.push(); m.tf(0, 0, 0, 0, 0, Math.PI / 2);
      m.color('#1a1a1c').shine(1); m.torus(0, 0, 0, wr - 0.035, 0.035, { seg: 20, tseg: 6 });
      m.color(col).shine(2); m.torus(0, 0, 0, wr * 0.86, 0.012, { seg: 18, tseg: 4 });
      m.color('#c8c8d0').shine(3); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; m.limb(0, 0, 0, Math.cos(a) * wr * 0.84, 0, Math.sin(a) * wr * 0.84, 0.005, 0.005, { seg: 3, ends: false }); }
      m.roundCyl(0, -0.03, 0, 0.035, 0.06, 0.01, { seg: 8 });
      m.shine(0); m.pop();
    }
    m.setBone(3); m.color('#4a4a52').shine(2); m.limb(-0.15, 0, 0, 0.15, 0, 0, 0.022, 0.022, { seg: 6 }); m.limb(0.15, 0, 0, 0.15, -0.16, 0, 0.016, 0.016, { seg: 5 }); m.limb(-0.15, 0, 0, -0.15, 0.16, 0, 0.016, 0.016, { seg: 5 });
    m.color('#1a1a1a'); m.roundBox(0.2, -0.17, 0, 0.1, 0.03, 0.06, 0.01); m.roundBox(-0.2, 0.17, 0, 0.1, 0.03, 0.06, 0.01); m.shine(0);
    m.setBone(4); m.color('#c8c8d0').shine(3); m.limb(-0.3, 0, 0, 0.3, 0, 0, 0.016, 0.016, { seg: 6 }); m.color('#1a1a1a').shine(1); m.limb(0.22, 0, 0, 0.33, 0, 0, 0.026, 0.026, { seg: 6 }); m.limb(-0.22, 0, 0, -0.33, 0, 0, 0.026, 0.026, { seg: 6 });
    m.color('#ffd84a').shine(3); m.push(); m.tf(0.2, 0.03, 0.03); m.lathe([[0.035, 0], [0.03, 0.025], [0.012, 0.04], [0, 0.045]], { seg: 8 }); m.pop(); m.shine(0); // the bell
    const model = { geo: m.geo(), nb: 5, wheelR: wr, front: fz, rear: rz, bones: { frame: 0, fw: 1, rw: 2, crank: 3, bar: 4 } };
    this.cache[col] = model;
    return model;
  }
};
