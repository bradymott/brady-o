/* ============================================================
   BRADY-O BURNS — prop library
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
  wheel(m, x, y, z, r, w, col) {
    m.push(); m.tf(x, y, z, 0, 0, Math.PI / 2);
    m.color(col || '#18181c'); m.cyl(0, -w / 2, 0, r, r, w, 7, {});
    m.color('#8a8a92'); m.cyl(0, -w / 2 - 0.01, 0, r * 0.45, r * 0.45, w + 0.02, 6, {});
    m.pop();
  },
  win(m, x, y, z, w, h, side, lit, rng) {
    // a window on an X-facing side (side = +1 / -1), slightly proud of the surface
    const glow = lit && rng && rng() < 0.55;
    m.color(glow ? '#ffc070' : '#1c2433', glow ? 0.85 : 0.04);
    m.box(x + side * 0.012, y, z, 0.03, h, w);
    m.emissive(0);
  },
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
    for (const wz of [-0.5, 0.5]) { m.push(); m.tf(0, 0.34, wz, 0, 0, Math.PI / 2); m.cyl(0, -0.025, 0, 0.34, 0.34, 0.05, 8, { caps: true }); m.pop(); }
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
    m.color(col); m.bbox(0, (0.72 + H) / 2, (cab + zb) / 2, W, H - 0.72, cab - zb, 0.14);
    m.bbox(0, (2.3 + H) / 2, (cab + zf - 0.6) / 2, W - 0.06, H - 2.3, zf - 0.6 - cab, 0.3);
    m.color(o.cabCol || col); m.bbox(0, 1.5, cab + 0.65, W - 0.1, 1.6, 1.3, 0.14);
    m.bbox(0, 1.08, zf - 0.45, W - 0.2, 0.72, 0.9, 0.18);
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
    for (const wz of [zf - 1.0, zb + 1.9, zb + 2.6]) { this.wheel(m, W / 2 - 0.2, 0.46, wz, 0.46, 0.3); this.wheel(m, -W / 2 + 0.2, 0.46, wz, 0.46, 0.3); }
    // roof
    m.color('#e8e8e8'); m.box(0, H + 0.16, (cab + zb) / 2 + 0.5, 0.8, 0.32, 0.9);
    m.color('#c8c8c8'); m.box(0.6, H + 0.07, zb + 1.2, 0.4, 0.14, 0.4);
    if (o.solar || r() < 0.35) { m.color('#1a2a5a', 0.05); m.box(0, H + 0.08, zb + 2.6, 1.6, 0.06, 1.2); m.emissive(0); }
    // rear ladder + bike rack
    m.color('#9a9aa2'); m.box(0.7, (H + 0.9) / 2, zb - 0.06, 0.04, H - 0.9, 0.04); m.box(0.35, (H + 0.9) / 2, zb - 0.06, 0.04, H - 0.9, 0.04);
    for (let y = 1.2; y < H; y += 0.35) m.box(0.525, y, zb - 0.06, 0.35, 0.03, 0.03);
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
    m.color(col); m.bbox(0, 0.95, zf - 0.9, W, 0.75, 1.8, 0.15); m.bbox(0, 1.45, zf - 2.3, W - 0.05, 1.3, 1.4, 0.15);
    m.color('#1a2232', 0.04); m.box(0, 1.75, zf - 1.62, W - 0.3, 0.5, 0.05); m.emissive(0);
    m.color(col); m.box(0, 0.95, (zb + zf - 3) / 2, W, 0.75, zf - 3 - zb);
    m.color(shell); m.bbox(0, 1.95, (zb + zf - 2.95) / 2, W + 0.15, 1.6, zf - 2.95 - zb + 0.2, 0.2);
    this.win(m, (W + 0.15) / 2, 2.1, (zb + zf - 3) / 2, 1.2, 0.5, 1, true, r); this.win(m, -(W + 0.15) / 2, 2.1, (zb + zf - 3) / 2, 1.2, 0.5, -1, true, r);
    m.color('#fff4d0', 1); m.box(0.7, 1.0, zf + 0.01, 0.3, 0.16, 0.04); m.box(-0.7, 1.0, zf + 0.01, 0.3, 0.16, 0.04);
    m.color('#ff2a2a', 1); m.box(0.85, 1.0, zb - 0.01, 0.18, 0.25, 0.04); m.box(-0.85, 1.0, zb - 0.01, 0.18, 0.25, 0.04); m.emissive(0);
    for (const wz of [zf - 1.0, zb + 1.2]) { this.wheel(m, W / 2 - 0.15, 0.42, wz, 0.42, 0.28); this.wheel(m, -W / 2 + 0.15, 0.42, wz, 0.42, 0.28); }
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
    m.color(col); m.bbox(0, (0.8 + H) / 2, (boxF + zb) / 2, W, H - 0.8, boxF - zb, 0.08);
    m.color(cabCol); m.bbox(0, 1.55, boxF + 1.15, W - 0.1, 1.9, 1.9, 0.2);
    m.color('#1a2232', 0.04); m.box(0, 2.05, boxF + 2.11, W - 0.4, 0.75, 0.04); m.box(W / 2 - 0.04, 2.0, boxF + 1.4, 0.04, 0.6, 0.8); m.box(-W / 2 + 0.04, 2.0, boxF + 1.4, 0.04, 0.6, 0.8); m.emissive(0);
    m.color('#2a2a30'); m.box(0, 0.75, zf + 0.02, W - 0.2, 0.25, 0.12); m.box(0, 1.15, zf - 0.03, 1.2, 0.4, 0.04);
    m.color('#fff4d0', 1); m.box(0.85, 1.2, zf + 0.01, 0.3, 0.2, 0.04); m.box(-0.85, 1.2, zf + 0.01, 0.3, 0.2, 0.04);
    m.color('#ff2a2a', 1); m.box(1.05, 1.0, zb - 0.01, 0.15, 0.3, 0.04); m.box(-1.05, 1.0, zb - 0.01, 0.15, 0.3, 0.04); m.emissive(0);
    // roll-up door stripes
    m.color(shade(col, -0.15)); for (let y = 1.0; y < H - 0.2; y += 0.28) m.box(0, y, zb - 0.015, W - 0.4, 0.06, 0.03);
    // side graphic: big text-free stripes
    const sc = r.pick(BURNS_NEON); m.color(sc); m.box(W / 2 + 0.01, 2.3, (boxF + zb) / 2, 0.02, 0.5, boxF - zb - 0.6); m.box(-W / 2 - 0.01, 2.3, (boxF + zb) / 2, 0.02, 0.5, boxF - zb - 0.6);
    for (const wz of [zf - 1.2, zb + 1.3]) { this.wheel(m, W / 2 - 0.2, 0.48, wz, 0.48, 0.32); this.wheel(m, -W / 2 + 0.2, 0.48, wz, 0.48, 0.32); }
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
    m.color(col); m.bbox(0, 0.68, 0, W, 0.62, L, 0.18);
    m.bbox(0, 1.22, -0.25, W - 0.2, 0.5, 2.3, 0.2);
    m.color('#1a2232', 0.05); m.box(0, 1.22, 0.92, W - 0.35, 0.4, 0.05); m.box(0, 1.22, -1.42, W - 0.35, 0.36, 0.05); m.box(W / 2 - 0.09, 1.24, -0.25, 0.03, 0.34, 2.0); m.box(-W / 2 + 0.09, 1.24, -0.25, 0.03, 0.34, 2.0); m.emissive(0);
    m.color('#fff4d0', 1); m.box(0.65, 0.78, zf + 0.01, 0.35, 0.14, 0.04); m.box(-0.65, 0.78, zf + 0.01, 0.35, 0.14, 0.04);
    m.color('#ff2a2a', 1); m.box(0.7, 0.8, zb - 0.01, 0.3, 0.14, 0.04); m.box(-0.7, 0.8, zb - 0.01, 0.3, 0.14, 0.04); m.emissive(0);
    for (const wz of [zf - 0.85, zb + 0.85]) { this.wheel(m, W / 2 - 0.12, 0.34, wz, 0.34, 0.24); this.wheel(m, -W / 2 + 0.12, 0.34, wz, 0.34, 0.24); }
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
    m.color(base); m.bbox(0, (0.75 + H) / 2, -0.4, W, H - 0.75, L - 0.8, 0.2);
    m.bbox(0, 1.1, zf - 0.6, W - 0.1, 0.75, 1.2, 0.2);
    // psychedelic panels
    for (let i = 0; i < 7; i++) { const z = zb + 0.9 + i * 1.35; m.color(BURNS_NEON[(i + (o.seed || 0)) % 7]); m.box(W / 2 + 0.01, 1.3, z, 0.02, 0.55, 1.1); m.box(-W / 2 - 0.01, 1.3, z, 0.02, 0.55, 1.1); }
    for (let i = 0; i < 7; i++) { const z = zb + 0.9 + i * 1.35; this.win(m, W / 2, 2.25, z, 1.0, 0.6, 1, true, r); this.win(m, -W / 2, 2.25, z, 1.0, 0.6, -1, true, r); }
    m.color('#1a2232', 0.04); m.box(0, 2.1, zf - 1.21, W - 0.3, 0.9, 0.04); m.emissive(0);
    m.color('#fff4d0', 1); m.box(0.85, 1.15, zf + 0.01, 0.3, 0.2, 0.04); m.box(-0.85, 1.15, zf + 0.01, 0.3, 0.2, 0.04); m.color('#ff2a2a', 1); m.box(1.0, 1.0, zb + 0.39, 0.2, 0.35, 0.04); m.box(-1.0, 1.0, zb + 0.39, 0.2, 0.35, 0.04); m.emissive(0);
    for (const wz of [zf - 1.4, zb + 2.0]) { this.wheel(m, W / 2 - 0.2, 0.48, wz, 0.48, 0.3); this.wheel(m, -W / 2 + 0.2, 0.48, wz, 0.48, 0.3); }
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
    m.color('#c8ccd4'); m.bbox(0, (0.5 + H) / 2 + 0.1, 0, W, H - 0.5, tL, 0.7);
    m.color('#9aa0aa'); for (let y = 1.0; y < H; y += 0.45) m.box(0, y, 0, W + 0.02, 0.03, tL - 1.2);
    this.win(m, W / 2, 2.0, 1.5, 1.2, 0.5, 1, true, r); this.win(m, -W / 2, 2.0, 1.5, 1.2, 0.5, -1, true, r); this.win(m, W / 2, 2.0, -1.5, 1.0, 0.5, 1, true, r);
    m.color('#26262c'); m.box(0, 0.35, 0, W - 0.3, 0.2, tL - 1);
    this.wheel(m, W / 2 - 0.15, 0.36, 0, 0.36, 0.25); this.wheel(m, -W / 2 + 0.15, 0.36, 0, 0.36, 0.25);
    m.color('#5a5a62'); m.box(0, 0.45, tL / 2 + 0.6, 0.15, 0.12, 1.4);
    m.color('#ff2a2a', 1); m.box(0.9, 0.8, -tL / 2 - 0.01, 0.2, 0.15, 0.04); m.box(-0.9, 0.8, -tL / 2 - 0.01, 0.2, 0.15, 0.04); m.emissive(0);
    m.pop();
    m.push(); m.tf(0, 0, 3.6);
    const tc = r.pick(['#2a2a30', '#8a1a1a', '#e8e8e8', '#2a4a7a']);
    m.color(tc); m.bbox(0, 0.85, 0, 2.1, 0.7, 5.2, 0.15); m.bbox(0, 1.55, 0.35, 1.95, 0.7, 2.0, 0.2);
    m.color('#1a2232', 0.04); m.box(0, 1.6, 1.36, 1.7, 0.5, 0.04); m.emissive(0);
    m.color('#fff4d0', 1); m.box(0.7, 0.95, 2.61, 0.3, 0.15, 0.04); m.box(-0.7, 0.95, 2.61, 0.3, 0.15, 0.04); m.emissive(0);
    for (const wz of [1.7, -1.7]) { this.wheel(m, 0.95, 0.4, wz, 0.4, 0.28); this.wheel(m, -0.95, 0.4, wz, 0.4, 0.28); }
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
    m.color(col); m.bbox(0, (0.5 + H) / 2, -0.35, W, H - 0.5, L - 0.7, 0.2); m.bbox(0, 0.9, zf - 0.45, W - 0.1, 0.8, 0.9, 0.25);
    m.color('#1a2232', 0.04); m.box(0, 1.75, zf - 0.72, W - 0.3, 0.7, 0.04); this.win(m, W / 2, 1.85, 0.2, 1.4, 0.5, 1, true, r); this.win(m, -W / 2, 1.85, 0.2, 1.4, 0.5, -1, true, r); m.emissive(0);
    m.color('#fff4d0', 1); m.box(0.7, 0.95, zf + 0.01, 0.28, 0.14, 0.04); m.box(-0.7, 0.95, zf + 0.01, 0.28, 0.14, 0.04); m.color('#ff2a2a', 1); m.box(0.85, 1.2, zb + 0.34, 0.12, 0.4, 0.04); m.box(-0.85, 1.2, zb + 0.34, 0.12, 0.4, 0.04); m.emissive(0);
    for (const wz of [zf - 1.0, zb + 1.2]) { this.wheel(m, W / 2 - 0.12, 0.38, wz, 0.38, 0.24); this.wheel(m, -W / 2 + 0.12, 0.38, wz, 0.38, 0.24); }
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
      const t0 = i / n, t1 = (i + 0.7) / n, sag = (t) => -Math.sin(t * Math.PI) * (o.sag || 0.8);
      const ax = lerp(o.x0, o.x1, t0), ay = lerp(o.y0, o.y1, t0) + sag(t0), az = lerp(o.z0, o.z1, t0);
      const bx = lerp(o.x0, o.x1, t1), by = lerp(o.y0, o.y1, t1) + sag(t1), bz = lerp(o.z0, o.z1, t1);
      m.color(BURNS_NEON[i % 7]);
      const mx = (ax + bx) / 2, mz = (az + bz) / 2;
      m.poly([[ax, ay, az], [bx, by, bz], [mx, (ay + by) / 2 - 0.45, mz]]);
      m.poly([[bx, by, bz], [ax, ay, az], [mx, (ay + by) / 2 - 0.45, mz]]);
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
    for (let i = 0; i < 4; i++) { const x = (i % 2 ? 0.5 : -0.5) + (i < 2 ? -0.35 : 0.35) * 0; const y = i < 2 ? 0.35 : -0.25; m.color('#2a2a30'); m.box((i % 2 ? 0.55 : -0.55), y, 0.1, 0.5, 0.45, 0.2); m.color('#fff8e0', 1); m.box((i % 2 ? 0.55 : -0.55), y, 0.205, 0.42, 0.36, 0.02); m.emissive(0); void x; }
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
    m.color(col); m.dome(0, 0, 0, r, o.freq || 2, { alt: o.alt, lights: o.lights ? BURNS_NEON : null, e: 0 });
    m.color('#2a1a2a'); m.box(0, 0.9, r - 0.15, 1.2, 1.8, 0.3);
    return { cols: [{ t: 'dome', x: 0, z: 0, r: r, y0: 0, cover: true }], lights: [{ x: 0, y: 0, z: 0, s: 0, c: o.glow || '#ff70c0', pool: r * 1.6 }], top: r };
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
   A tall wooden lattice figure with raised arms, a glowing diamond head,
   a neon outline and a glowing heart (he is very much in love).
   Built on the shared 16-bone layout so BurnsChar can drive it. Height ~13m. */
const BurnsManModel = {
  cache: null,
  body() {
    return {
      h: 1, w: 1,
      off: [
        [0, 5.6, 0], [0, 0.3, 0], [0, 4.3, 0],
        [1.9, 3.9, 0], [0, -2.6, 0], [-1.9, 3.9, 0], [0, -2.6, 0],
        [0.95, -0.2, 0], [0, -2.8, 0], [0, -2.5, 0], [-0.95, -0.2, 0], [0, -2.8, 0], [0, -2.5, 0],
        [0, -2.4, 0], [0, 2.4, 0], [0, 0, -0.9]
      ],
      headY: 11.4, height: 13
    };
  },
  build(o) {
    if (this.cache && !o) return this.cache;
    o = o || {};
    const m = new BurnsMesh(8192), B = BURNS_BONES;
    const wood = o.wood || '#c89a6a', dark = o.dark || '#8a5a3a', neon = o.neon || '#38f2ff', heart = o.heart || '#ff4fa8';
    // lattice limb: 4 rails + zig-zag braces between y0..y1 (local Y), widths w0 (top) w1 (bottom)
    const lattice = (y0, y1, w0, w1, d, n) => {
      const corners = (y, w) => [[w / 2, y, d / 2], [-w / 2, y, d / 2], [-w / 2, y, -d / 2], [w / 2, y, -d / 2]];
      const A = corners(y0, w0), Bc = corners(y1, w1);
      m.color(wood);
      for (let k = 0; k < 4; k++) m.beam(A[k][0], A[k][1], A[k][2], Bc[k][0], Bc[k][1], Bc[k][2], 0.22);
      m.color(dark);
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n;
        const P = (t, k) => { const a = A[k], b = Bc[k]; return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };
        for (let k = 0; k < 4; k++) { const p = P(i % 2 ? t0 : t1, k), q = P(i % 2 ? t1 : t0, (k + 1) % 4); m.beam(p[0], p[1], p[2], q[0], q[1], q[2], 0.14); }
        const ring = k => P(t0, k);
        for (let k = 0; k < 4; k++) { const p = ring(k), q = ring((k + 1) % 4); m.beam(p[0], p[1], p[2], q[0], q[1], q[2], 0.12); }
      }
    };
    const neonRail = (x0, y0, z0, x1, y1, z1) => { m.color(neon, 1); m.beam(x0, y0, z0, x1, y1, z1, 0.11); m.emissive(0); };
    // hips
    m.setBone(B.HIPS); lattice(-0.3, 0.4, 2.6, 2.6, 1.2, 1);
    m.color(dark); m.box(0, 0.05, 0, 2.8, 0.25, 1.3);
    // torso (wider at the shoulders)
    m.setBone(B.CHEST); lattice(0, 4.3, 3.2, 2.2, 1.3, 4);
    m.color(wood); m.box(0, 4.1, 0, 4.2, 0.35, 1.4); // shoulder beam
    neonRail(1.1, 0, 0.66, 2.0, 4.2, 0.66); neonRail(-1.1, 0, 0.66, -2.0, 4.2, 0.66);
    // the glowing heart in the chest
    m.color(heart, 1); m.push(); m.tf(0, 2.5, 0.2);
    const hp = []; for (let i = 0; i < 20; i++) { const t = i / 20 * TAU; const x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); hp.push([x * 0.045, y * 0.045]); }
    m.extrude(hp.reverse(), 0.5, { convex: false }); m.pop(); m.emissive(0);
    // head: elongated diamond (octahedron) with neon edges
    m.setBone(B.HEAD);
    m.color(wood); m.box(0, 0.3, 0, 0.6, 0.8, 0.6);
    const hy = 1.9, hh = 1.35, hw = 1.0;
    const top = [0, hy + hh, 0], bot = [0, hy - hh, 0], ring = [[hw, hy, 0], [0, hy, hw * 0.75], [-hw, hy, 0], [0, hy, -hw * 0.75]];
    m.color(o.headCol || '#ffd0f0', 0.85);
    for (let k = 0; k < 4; k++) { const a = ring[k], b = ring[(k + 1) % 4]; m.poly([a, b, top], null, [0, hy, 0]); m.poly([b, a, bot], null, [0, hy, 0]); }
    m.emissive(0);
    for (let k = 0; k < 4; k++) { const a = ring[k], b = ring[(k + 1) % 4]; neonRail(a[0] * 1.03, a[1], a[2] * 1.03, top[0], top[1] + 0.05, top[2]); neonRail(a[0] * 1.03, a[1], a[2] * 1.03, b[0] * 1.03, b[1], b[2] * 1.03); neonRail(a[0] * 1.03, a[1], a[2] * 1.03, bot[0], bot[1] - 0.05, bot[2]); }
    m.decal(0, hy, hw * 0.75 * 0.52 + 0.06, 0.9, 0.9, BURNS_ATLAS.face('man'));
    // arms (raised in the default pose via animation)
    for (const side of [1, -1]) {
      m.setBone(side > 0 ? B.UARM_L : B.UARM_R); lattice(0.2, -2.6, 0.75, 0.65, 0.75, 3); neonRail(side * 0.42, 0.1, 0.4, side * 0.36, -2.6, 0.38);
      m.setBone(side > 0 ? B.FARM_L : B.FARM_R); lattice(0, -2.4, 0.62, 0.5, 0.6, 3); neonRail(side * 0.34, 0, 0.32, side * 0.28, -2.4, 0.3);
      m.color(wood); m.box(0, -2.75, 0, 0.8, 0.7, 0.5); // hand block
      for (let f = 0; f < 3; f++) { m.color(dark); m.box((f - 1) * 0.25, -3.25, 0, 0.16, 0.6, 0.18); }
      m.setBone(side > 0 ? B.THIGH_L : B.THIGH_R); lattice(0, -2.8, 1.0, 0.85, 0.9, 3); neonRail(side * 0.53, 0, 0.47, side * 0.46, -2.8, 0.44);
      m.setBone(side > 0 ? B.SHIN_L : B.SHIN_R); lattice(0, -2.5, 0.85, 0.75, 0.8, 3); neonRail(side * 0.45, 0, 0.42, side * 0.4, -2.5, 0.4);
      m.setBone(side > 0 ? B.FOOT_L : B.FOOT_R); m.color(dark); m.bbox(0, -0.25, 0.35, 1.2, 0.5, 2.0, 0.12); m.color(neon, 1); m.box(0, -0.02, 0.35, 1.25, 0.06, 2.05); m.emissive(0);
    }
    const model = { geo: m.geo(), nb: BURNS_NB, body: this.body(), headY: 11.4, height: 13, man: true };
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
    const m = new BurnsMesh(2048);
    // bone 0 frame, 1 front wheel, 2 rear wheel, 3 cranks, 4 handlebar
    m.setBone(0); m.color(col);
    const fz = 0.55, rz = -0.52, wr = 0.36;
    m.beam(0, wr, rz, 0, 0.78, 0.05, 0.07); m.beam(0, wr, rz, 0, 0.42, 0.0, 0.07); m.beam(0, 0.42, 0.0, 0, 0.78, 0.05, 0.07); m.beam(0, 0.42, 0.0, 0, 0.82, 0.38, 0.07); m.beam(0, 0.82, 0.38, 0, wr, fz, 0.06);
    m.beam(0.1, wr, rz, 0.1, 0.62, -0.08, 0.04); m.beam(-0.1, wr, rz, -0.1, 0.62, -0.08, 0.04);
    m.color('#2a2a2a'); m.bbox(0, 0.86, -0.04, 0.14, 0.06, 0.26, 0.02);
    m.color('#c8c8d0'); m.box(0, 0.62, -0.62, 0.3, 0.04, 0.3); // rear rack
    m.color('#f4f0e8'); m.box(0, 0.75, 0.62, 0.3, 0.2, 0.22); // front basket
    m.color('#ff4fd8', 1); for (let i = 0; i < 5; i++) m.box(0, 0.3 + i * 0.1, -0.06 + i * 0.07, 0.09, 0.04, 0.04); m.emissive(0);
    for (const [b, z] of [[1, fz], [2, rz]]) {
      m.setBone(b); m.push(); m.tf(0, 0, 0, 0, 0, Math.PI / 2);
      m.color('#1a1a1a'); m.cyl(0, -0.03, 0, wr, wr, 0.06, 12, {});
      m.color(col); m.cyl(0, -0.035, 0, wr * 0.82, wr * 0.82, 0.07, 12, {});
      m.color('#1a1a1a'); m.cyl(0, -0.04, 0, wr * 0.7, wr * 0.7, 0.08, 12, {});
      m.color('#c8c8d0'); for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI; m.beam(Math.cos(a) * wr * 0.72, 0, Math.sin(a) * wr * 0.72, -Math.cos(a) * wr * 0.72, 0, -Math.sin(a) * wr * 0.72, 0.02); }
      m.pop(); void z;
    }
    m.setBone(3); m.color('#4a4a52'); m.box(0, 0, 0, 0.3, 0.05, 0.05); m.box(0.15, -0.08, 0, 0.03, 0.18, 0.04); m.box(-0.15, 0.08, 0, 0.03, 0.18, 0.04);
    m.color('#1a1a1a'); m.box(0.2, -0.17, 0, 0.1, 0.03, 0.06); m.box(-0.2, 0.17, 0, 0.1, 0.03, 0.06);
    m.setBone(4); m.color('#c8c8d0'); m.box(0, 0, 0, 0.6, 0.04, 0.04); m.color('#1a1a1a'); m.box(0.28, 0, 0, 0.1, 0.05, 0.05); m.box(-0.28, 0, 0, 0.1, 0.05, 0.05);
    m.color('#ffd84a'); m.cyl(0.2, 0.02, 0.03, 0.035, 0.03, 0.04, 6, {}); // the bell
    const model = { geo: m.geo(), nb: 5, wheelR: wr, front: fz, rear: rz, bones: { frame: 0, fw: 1, rw: 2, crank: 3, bar: 4 } };
    this.cache[col] = model;
    return model;
  }
};
