/* ============================================================
   BRADY GOES TO BURNING MAN — World 16 kit (2/3): RHYTHM WAVE geometry
   The bamboo dance floor, the Wave (a bamboo-and-fabric breaking wave
   over the floor), the camp (lounge with shade sails, kitchen, DJ booth,
   speaker stacks, bike tree, Sky Hammock), the street, the playa ride
   and the hallucinations that only appear after Bam Bam's pill.
   All builders take (api, g, S) and return handles in S.
   ============================================================ */

/* ---------------- bamboo ---------------- */
// a bamboo pole between two points: alternating culm tones and darker node rings
function burnsW16Bamboo(m, x0, y0, z0, x1, y1, z1, r, o) {
  o = o || {};
  const L = Math.hypot(x1 - x0, y1 - y0, z1 - z0); if (L < 0.01) return;
  const n = Math.max(1, Math.round(L / (o.seg || 1.1))), col = o.col || '#d8b46a', node = o.node || '#9c7434', sg = o.sides || (m.lo ? 5 : 8);
  for (let i = 0; i < n; i++) {
    const a = i / n, b = (i + 1) / n;
    m.color(i % 2 ? col : shade(col, 0.05));
    m.limb(lerp(x0, x1, a), lerp(y0, y1, a), lerp(z0, z1, a), lerp(x0, x1, b), lerp(y0, y1, b), lerp(z0, z1, b), r, r * 0.97, { seg: sg, ends: i === 0 || i === n - 1 });
    if (i > 0 && !o.noNodes) {
      const d = Math.min(0.05 / L, 0.2 / n);
      m.color(node); m.limb(lerp(x0, x1, a - d), lerp(y0, y1, a - d), lerp(z0, z1, a - d), lerp(x0, x1, a + d), lerp(y0, y1, a + d), lerp(z0, z1, a + d), r * 1.14, r * 1.14, { seg: sg, ends: false });
    }
  }
}
// lashing: a few turns of rope where two poles cross
function burnsW16Lash(m, x, y, z, r) { m.color('#b0864a'); for (let i = -1; i <= 1; i++) { m.push(); m.tf(x, y + i * r * 0.55, z); m.torus(0, 0, 0, r * 1.25, r * 0.28, { seg: m.lo ? 6 : 10, tseg: 4 }); m.pop(); } }

/* ---------------- the Wave: rib profile ---------------- */
// rib control points: [dz from the floor centre, height as a fraction of the crest]
BW16.RIB = [[-21, 0], [-18.5, 0.28], [-16, 0.55], [-13.5, 0.79], [-11, 0.95], [-9, 1.0], [-7, 0.96], [-5.4, 0.86], [-4.6, 0.72], [-5.2, 0.6], [-6.4, 0.55]];
BW16.hc = x => (8.2 - 0.08 * x) * (1 - 0.2 * BurnsM.smoothstep(7.2, 11.2, Math.abs(x)));   // peels down toward +x, tapers at both ends
BW16.ribX = i => BW16.WAVE.x0 + i * (BW16.WAVE.x1 - BW16.WAVE.x0) / (BW16.WAVE.n - 1);
BW16.MISSING = [1, 3, 6, 8];                          // ribs still lying in the bamboo pile on arrival
// Catmull-Rom samples of the rib: [[dz, f], ...]
BW16.ribCurve = function (per) {
  const P = BW16.RIB, out = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t, f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(P[P.length - 1].slice());
  return out;
};
// height fraction of the back slope at dz (the rising part of the curve)
BW16.slopeF = function (dz) {
  const C = BW16._curve || (BW16._curve = BW16.ribCurve(8));
  for (let i = 0; i < C.length - 1; i++) { const a = C[i], b = C[i + 1]; if (b[0] < a[0]) break; if (dz >= a[0] && dz <= b[0]) return lerp(a[1], b[1], (dz - a[0]) / Math.max(1e-6, b[0] - a[0])); }
  return dz < C[0][0] ? 0 : 1;
};
BW16.waveY = (x, dz) => BW16.slopeF(dz) * BW16.hc(x);
// the climbing route up the Wave's back (plank tops), then the crest walkway
BW16.route = function () {
  const F = BW16.F, R = [];
  const steps = [[-8.2, -20.0], [-5.2, -18.85], [-2.2, -17.7], [0.8, -16.55], [3.8, -15.4], [1.0, -14.25], [-2.0, -13.1], [-5.0, -11.95]];
  for (const [x, dz] of steps) R.push({ x, z: F.z + dz, y: BW16.waveY(x, dz) + 0.26, crest: false });
  return R;
};
BW16.crestTop = x => BW16.hc(x) + 0.26;
BW16.HOOKS = function () {   // lantern hooks: [x, walkway y, z of the hook, lantern hang position]
  const F = BW16.F, R = BW16.route(), out = [];
  for (const i of [2, 5]) { const q = R[i]; out.push({ x: q.x, y: q.y, z: q.z, lx: q.x, ly: q.y - 1.05, lz: q.z - 0.9 }); }
  for (const x of [-8, -3, 2, 7]) { const y = BW16.crestTop(x); out.push({ x, y, z: F.z - 9.0, lx: x, ly: y - 1.15, lz: F.z - 7.3 }); }
  return out;
};

/* ---------------- the Wave ---------------- */
// one rib (local to x = rib x, z = floor centre) as a curved bamboo arch, foot to curl
function burnsW16Rib(m, x, o) {
  o = o || {};
  const C = BW16.ribCurve(2), hc = BW16.hc(x), r = 0.12;
  for (let i = 0; i < C.length - 1; i++) {
    const a = C[i], b = C[i + 1];
    m.color(i % 2 ? '#d8b46a' : '#cca65c');
    m.limb(0, a[1] * hc, a[0], 0, b[1] * hc, b[0], r, r, { seg: m.lo ? 5 : 8, ends: i === 0 || i === C.length - 2 });
    if (i > 0) { m.color('#9c7434'); const d = 0.06; const dz = b[0] - a[0], dy = (b[1] - a[1]) * hc, l = Math.hypot(dz, dy) || 1; m.limb(0, a[1] * hc - dy / l * d, a[0] - dz / l * d, 0, a[1] * hc + dy / l * d, a[0] + dz / l * d, r * 1.15, r * 1.15, { seg: m.lo ? 5 : 8, ends: false }); }
  }
  // a cross-brace foot so it reads as a structure
  m.color('#b08a4a'); m.limb(-0.5, 0, -21, 0, 1.6, -19.6, 0.06, 0.06, { seg: 6 }); m.limb(0.5, 0, -21, 0, 1.6, -19.6, 0.06, 0.06, { seg: 6 });
  if (o.led) { m.color('#38f2ff', 0.9); m.limb(0, hc * 1.0 + 0.14, -9.6, 0, hc * 0.96 + 0.14, -7.4, 0.025, 0.025, { seg: 4 }); m.emissive(0); }
}
BW16.buildWave = function (api, g, S) {
  const F = BW16.F, W = BW16.WAVE, n = W.n, C = BW16.ribCurve(3);
  // static ribs (all but the missing ones), purlins, LED strips, fabric skin
  api.mesh(F.x, F.z, m => {
    const cols = [], lights = [];
    for (let i = 0; i < n; i++) { if (BW16.MISSING.indexOf(i) >= 0) continue; const x = BW16.ribX(i); m.push(); m.tf(x, 0, 0); burnsW16Rib(m, x, { led: i % 3 === 0 }); m.pop(); }
    // purlins: straight poles across all ribs at fixed points of the curve
    for (const [dz, f] of [[-18.5, 0.28], [-16, 0.55], [-13.5, 0.79], [-11, 0.95], [-9, 1.0], [-7, 0.96], [-5.4, 0.86]]) {
      for (let k = 0; k < 6; k++) { const xa = lerp(W.x0 - 0.4, W.x1 + 0.4, k / 6), xb = lerp(W.x0 - 0.4, W.x1 + 0.4, (k + 1) / 6); burnsW16Bamboo(m, xa, f * BW16.hc(xa), dz, xb, f * BW16.hc(xb), dz, 0.085, { seg: 1.9, noNodes: m.lo }); }
      for (let i = 0; i < n; i++) if (BW16.MISSING.indexOf(i) < 0 && (i + Math.round(dz)) % 2 === 0) burnsW16Lash(m, BW16.ribX(i), f * BW16.hc(BW16.ribX(i)), dz, 0.1);
    }
    // LED strips along the crest and the lip (they glow and bloom at night)
    for (let k = 0; k < 8; k++) {
      const xa = lerp(W.x0, W.x1, k / 8), xb = lerp(W.x0, W.x1, (k + 1) / 8);
      m.color('#38f2ff', 0.95); m.limb(xa, BW16.hc(xa) + 0.16, -9, xb, BW16.hc(xb) + 0.16, -9, 0.035, 0.035, { seg: 5 });
      m.color('#ff5ad8', 0.95); m.limb(xa, BW16.hc(xa) * 0.6 - 0.1, -5.2, xb, BW16.hc(xb) * 0.6 - 0.1, -5.2, 0.03, 0.03, { seg: 5 });
    }
    m.emissive(0);
    // sea foam: soft white lumps along the curl's lip and over the crest
    const RF = mulberry32(77);
    for (let x = W.x0 + 0.3; x <= W.x1 - 0.3; x += 0.62) {
      const hc = BW16.hc(x), j = RF();
      m.color(j < 0.5 ? '#ffffff' : '#e8fbff').shine(1);
      m.ellipsoid(x, hc * 0.55 - 0.12, -6.4 + (j - 0.5) * 0.3, 0.42 + j * 0.2, 0.26, 0.34, { seg: m.lo ? 7 : 10, rings: m.lo ? 4 : 6 });
      if (RF() < 0.55) m.ellipsoid(x + 0.2, hc * 0.86 + 0.18, -5.6 + (RF() - 0.5) * 0.4, 0.3 + RF() * 0.2, 0.2, 0.26, { seg: m.lo ? 6 : 9, rings: 4 });
      m.shine(0);
    }
    // the fabric skin: deep teal at the foot to white foam at the curl (two-sided)
    const nu = m.lo ? 12 : 22, nv = C.length - 2;
    const pos = (u, v, o) => { const x = lerp(W.x0, W.x1, u), kf = 1 + clamp(v, 0, 1) * (C.length - 2.001), k0 = Math.floor(kf), t = kf - k0, a = C[k0], b = C[k0 + 1], hc = BW16.hc(x); const qz = lerp(a[0], b[0], t), qf = lerp(a[1], b[1], t), dz = b[0] - a[0], dy = (b[1] - a[1]) * hc, l = Math.hypot(dz, dy) || 1; o[0] = x; o[1] = qf * hc - dz / l * 0.18; o[2] = qz + dy / l * 0.18; };
    const colFn = (u, v) => { const k = clamp(v, 0, 1), T = [[0, '#06336e'], [0.3, '#0a6fa6'], [0.55, '#18b4c8'], [0.75, '#7ee8e0'], [0.9, '#dffcf6'], [1, '#ffffff']]; let i = 0; while (i < T.length - 2 && k > T[i + 1][0]) i++; const a = burnsRGB(T[i][1]), b = burnsRGB(T[i + 1][1]), t = (k - T[i][0]) / (T[i + 1][0] - T[i][0]), sh = 0.92 + 0.08 * Math.sin(u * 40); return [Math.round(lerp(a[0], b[0], t) * sh), Math.round(lerp(a[1], b[1], t) * sh), Math.round(lerp(a[2], b[2], t) * sh)]; };
    m.color('#ffffff').shine(1);
    m.surf(nu, nv, pos, { colFn });
    m.surf(nu, nv, pos, { colFn, flip: true });
    m.shine(0);
    // colliders: the ribs are climbable only via the planks; the fabric is a soft wall
    cols.push({ t: 'box', x: 0, z: -15, hx: 11.4, hz: 6, y0: 0, y1: 0.4, walk: false, solid: false });
    return { cols, lights };
  });
  // the missing ribs (delivered one by one in "Bamboo Haul"): movers that drop into place
  S.ribs = BW16.MISSING.map((i, k) => {
    const x = BW16.ribX(i);
    const mv = api.mover(m => { burnsW16Rib(m, x, {}); return { cols: [] }; });
    mv.x = x; mv.y = 0; mv.z = F.z; mv.yaw = 0; mv.visible = false; mv.ribIndex = k;
    return mv;
  });
  // the climbing route: lashed bamboo-mat planks
  const R = BW16.route(); S.route = R;
  R.forEach((q, i) => {
    api.mesh(q.x, q.z, m => {
      m.color('#b88a4a').shine(0); m.roundBox(0, -0.08, 0, 1.9, 0.16, 1.15, 0.05);
      m.color('#d8b46a'); for (let k = -3; k <= 3; k++) m.box(k * 0.26, 0.005, 0, 0.2, 0.02, 1.12);
      burnsW16Lash(m, -0.85, -0.12, 0, 0.06); burnsW16Lash(m, 0.85, -0.12, 0, 0.06);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.95, hz: 0.58, y0: -0.17, y1: 0.0 }] };
    }, { y: q.y });
  });
  // the crest walkway: short mats stepping down with the crest
  for (let x = BW16.WAVE.x0 + 0.6; x < BW16.WAVE.x1 - 0.4; x += 2.05) {
    const xc = x + 1.0, y = BW16.crestTop(xc);
    api.mesh(xc, F.z - 9.0, m => {
      m.color('#b88a4a'); m.roundBox(0, -0.08, 0, 2.1, 0.16, 1.15, 0.05);
      m.color('#d8b46a'); for (let k = -3; k <= 3; k++) m.box(k * 0.28, 0.005, 0, 0.22, 0.02, 1.12);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.06, hz: 0.58, y0: -0.17, y1: 0.0 }] };
    }, { y });
  }
  // the lip ledge at the curl (photo 2)
  const lx = -6.5, ly = BW16.hc(lx) * 0.86 + 0.22;
  api.mesh(lx, F.z - 5.7, m => { m.color('#c89a52'); m.roundBox(0, -0.08, 0, 2.6, 0.16, 1.9, 0.06); m.color('#d8b46a'); for (let k = -4; k <= 4; k++) m.box(k * 0.28, 0.005, 0, 0.22, 0.02, 1.85); burnsW16Lash(m, -1.1, -0.1, 0, 0.07); burnsW16Lash(m, 1.1, -0.1, 0, 0.07); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.3, hz: 0.95, y0: -0.17, y1: 0 }] }; }, { y: ly });
  S.lip = { x: lx, y: ly, z: F.z - 5.7 };
  // lantern hooks and the lanterns (hidden until hung)
  S.hooks = BW16.HOOKS().map((h, i) => {
    const mv = api.mover(m => {
      m.color('#3a2a1a'); m.limb(0, 0.42, 0, 0, 1.0, 0, 0.008, 0.008, { seg: 4 });
      const c = ['#ff7a3a', '#ffd04a', '#ff5a8a', '#ffb04a', '#ff9a3a', '#ffe06a'][i % 6];
      m.color(c, 0.85).shine(1); m.lathe([[0, -0.02], [0.18, 0.06], [0.26, 0.22], [0.25, 0.32], [0.17, 0.42], [0, 0.44]], { seg: m.lo ? 8 : 14, rMod: (th, t) => 1 + 0.035 * Math.cos(th * 8) * Math.sin(t * Math.PI) });
      m.emissive(0); m.color('#2a1a10'); m.roundCyl(0, 0.42, 0, 0.07, 0.04, 0.01); m.roundCyl(0, -0.05, 0, 0.06, 0.04, 0.01); m.shine(0);
      return { cols: [], lights: [] };
    });
    mv.x = h.lx; mv.y = h.ly; mv.z = h.lz; mv.visible = false;
    const gl = { x: h.lx, y: h.ly + 0.22, z: h.lz, s: 0, s0: 1.7, c: burnsRGBf(['#ff8a3a', '#ffd04a', '#ff6a9a', '#ffb04a', '#ff9a3a', '#ffe06a'][i % 6]), c0: null, ph: i, blink: 0, hidden: false };
    gl.c0 = gl.c.slice(); api.world.glows.push(gl);
    return Object.assign({ mv, glow: gl, hung: false, i }, h);
  });
};

/* ---------------- the floor, the DJ booth, the speakers ---------------- */
BW16.buildFloor = function (api, g, S) {
  const F = BW16.F;
  const wood = BURNS_ATLAS.pattern('wood');
  api.mesh(F.x, F.z, m => {
    const cols = [], lights = [];
    // step ring + frame skirt
    m.color('#6e4c2a'); m.lathe([[F.r + 0.95, 0], [F.r + 0.95, 0.24], [F.r + 0.85, 0.28], [F.r, 0.28]], { seg: 40 });
    m.color('#5a3c20'); m.lathe([[F.r + 0.05, 0.2], [F.r + 0.05, F.h - 0.08], [F.r - 0.1, F.h - 0.06], [0, F.h - 0.06]], { seg: 40 });
    // the deck: parallel planks clipped to the circle, three warm tones
    const tones = ['#e0b36a', '#d4a45a', '#e8bf78', '#cf9c52'];
    for (let z = -F.r + 0.32, k = 0; z < F.r - 0.2; z += 0.6, k++) {
      const half = Math.sqrt(Math.max(0, F.r * F.r - z * z)) - 0.15; if (half < 0.4) continue;
      m.color(tones[k % 4]); m.box(0, F.h - 0.035, z, half * 2, 0.07, 0.54, { uv: wood, uvFaces: ['py'] });
    }
    // a lashed bamboo rim
    m.color('#c99a52'); m.push(); m.tf(0, F.h - 0.02, 0); m.torus(0, 0, 0, F.r + 0.02, 0.1, { seg: 48, tseg: 7 }); m.pop();
    m.color('#9c7434'); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; m.push(); m.tf(Math.sin(a) * (F.r + 0.02), F.h - 0.02, Math.cos(a) * (F.r + 0.02), a + Math.PI / 2, Math.PI / 2); m.torus(0, 0, 0, 0.13, 0.025, { seg: 8, tseg: 3 }); m.pop(); }
    // short bamboo posts with paper-lantern caps (gaps for the DJ booth and the south entrance)
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * TAU; if (Math.abs(BurnsM.wrap(a - Math.PI)) < 0.5 || Math.abs(BurnsM.wrap(a)) < 0.3) continue;
      const x = Math.sin(a) * (F.r - 0.15), z = Math.cos(a) * (F.r - 0.15);
      burnsW16Bamboo(m, x, F.h - 0.1, z, x, F.h + 1.05, z, 0.06, { seg: 0.5 });
      m.color(i % 2 ? '#ff9a4a' : '#ffd36a', 0.85); m.ellipsoid(x, F.h + 1.24, z, 0.15, 0.19, 0.15, { seg: m.lo ? 8 : 12, rings: 6 }); m.emissive(0);
      lights.push({ x, y: F.h + 1.24, z, s: 0.9, c: i % 2 ? '#ffa04a' : '#ffd36a' });
      cols.push({ t: 'cyl', x, z, r: 0.08, y0: 0, y1: F.h + 1.4, camPass: true, walk: false });
    }
    cols.push({ t: 'cyl', x: 0, z: 0, r: F.r + 0.95, y0: 0, y1: 0.28 });
    cols.push({ t: 'cyl', x: 0, z: 0, r: F.r, y0: 0, y1: F.h });
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ffb06a', pool: 16, i: 0.55 });
    return { cols, lights };
  });
  // DJ booth under the curl
  const by = F.h, bz = F.z - 7.0;
  api.mesh(F.x, bz, m => {
    const cols = [];
    m.color('#7a5430'); m.roundBox(0, by + 0.35, 0, 6.4, 0.7, 2.6, 0.12);
    m.color('#d8b46a'); for (let k = -5; k <= 5; k++) m.box(k * 0.56, by + 0.71, 0, 0.5, 0.02, 2.5, { uv: BURNS_ATLAS.pattern('wood'), uvFaces: ['py'] });
    m.color('#6a4626'); m.roundBox(0, by + 0.18, 1.55, 2.2, 0.36, 0.55, 0.08);
    // the decks
    m.color('#1c1a22').shine(1); m.roundBox(0, by + 1.15, -0.3, 2.4, 0.9, 0.8, 0.08);
    m.color('#2a2833').shine(2); for (const sd of [-1, 1]) { m.push(); m.tf(sd * 0.62, by + 1.63, -0.3); m.roundCyl(0, 0, 0, 0.3, 0.05, 0.01, { seg: 18 }); m.pop(); }
    m.color('#ff5ad8', 1); m.roundBox(0, by + 1.0, 0.11, 2.3, 0.05, 0.02, 0.01); m.color('#38f2ff', 1); m.roundBox(0, by + 0.8, 0.11, 2.3, 0.04, 0.02, 0.01); m.emissive(0).shine(0);
    // a bamboo frame with a little thatch roof over the decks
    for (const sd of [-1, 1]) burnsW16Bamboo(m, sd * 1.5, by + 0.7, -1.0, sd * 1.5, by + 3.0, -1.0, 0.07, { seg: 0.6 });
    m.color('#c8a060'); m.push(); m.tf(0, by + 3.05, -0.8, 0, 0.18); m.roundBox(0, 0, 0, 3.6, 0.12, 1.6, 0.05); m.pop();
    m.color('#ffd36a', 0.9); for (let i = 0; i < 7; i++) m.ball(-1.5 + i * 0.5, by + 2.85, 0.0, 0.06, { seg: 6, rings: 4 }); m.emissive(0);
    cols.push({ t: 'box', x: 0, z: 0, hx: 3.2, hz: 1.3, y0: 0, y1: by + 0.7 });
    cols.push({ t: 'box', x: 0, z: 1.55, hx: 1.1, hz: 0.28, y0: 0, y1: by + 0.36 });
    cols.push({ t: 'box', x: 0, z: -0.3, hx: 1.2, hz: 0.4, y0: by + 0.7, y1: by + 1.6 });
    return { cols, lights: [{ x: 0, y: by + 2.85, z: 0, s: 1.6, c: '#ffd36a' }] };
  });
  S.booth = { x: F.x, y: by + 0.7, z: bz };
  // stepped speaker stacks (the east one hides photo 1 on top)
  S.speakers = [];
  for (const sd of [-1, 1]) {
    const sx = F.x + sd * 5.7, sz = F.z - 3.2;
    api.mesh(sx, sz, m => {
      const cols = [], C = [[1.6, 1.2, 1.3, 0], [1.4, 1.15, 1.05, -0.18], [1.15, 1.05, 0.85, -0.32]];
      let y = F.h;
      C.forEach(([w, h, d, oz], k) => {
        m.color('#18161c').shine(1); m.roundBox(0, y + h / 2, oz, w, h, d, 0.07);
        m.color('#2c2a34').shine(2); m.push(); m.tf(0, y + h * 0.5, oz + d / 2 + 0.005, 0, Math.PI / 2); m.lathe([[w * 0.36, 0], [w * 0.36, 0.03], [w * 0.1, -0.08], [0, -0.09]], { seg: 18 }); m.pop();
        m.color('#d8d8e0').shine(3); m.push(); m.tf(0, y + h * 0.5, oz + d / 2 + 0.01, 0, Math.PI / 2); m.torus(0, 0, 0, w * 0.37, 0.02, { seg: 18, tseg: 4 }); m.pop(); m.shine(0);
        cols.push({ t: 'box', x: 0, z: oz, hx: w / 2, hz: d / 2, y0: y, y1: y + h });
        y += h;
      });
      return { cols, lights: [] };
    });
    const top = F.h + 1.2 + 1.15 + 1.05;
    // the cone rings pulse at night (dynamic glows)
    const glows = [];
    for (let k = 0; k < 3; k++) { const yy = F.h + [0.6, 1.775, 2.875][k], zz = sz + [0.65, 0.345, 0.105][k] + 0.05; const gl = { x: sx, y: yy, z: zz, s: 0, s0: [1.4, 1.2, 1.0][k], c: [0, 0, 0], c0: burnsRGBf(sd > 0 ? '#38f2ff' : '#ff5ad8'), ph: k, blink: 0, hidden: false }; api.world.glows.push(gl); glows.push(gl); }
    S.speakers.push({ x: sx, z: sz, top, side: sd, glows });
  }
};

/* ---------------- the lounge: three shade sails around a centre pole ---------------- */
BW16.SAILS = [
  { a: 0.35, col: '#ff7a3a', name: 'SAFFRON' },
  { a: 2.45, col: '#ff4fa8', name: 'MAGENTA' },
  { a: 4.55, col: '#22b8c4', name: 'TEAL' }
];
BW16.buildLounge = function (api, g, S) {
  const L = BW16.LOUNGE, CTOP = 8.0, MTOP = 6.6, MR = 8.2;
  const at = (a, r) => [L.x + Math.sin(a) * r, L.z + Math.cos(a) * r];
  // centre pole + masts
  api.mesh(L.x, L.z, m => {
    burnsW16Bamboo(m, 0, 0, 0, 0, CTOP + 0.3, 0, 0.17, { seg: 0.9 });
    m.color('#ffd36a', 0.9); m.ball(0, CTOP + 0.45, 0, 0.18); m.emissive(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.2, y0: 0, y1: CTOP + 0.3, walk: false, camPass: true }], lights: [{ x: 0, y: CTOP + 0.45, z: 0, s: 1.6, c: '#ffd36a' }] };
  });
  S.sails = BW16.SAILS.map((sl, i) => {
    const [mx, mz] = at(sl.a, MR), [wx, wz] = at(sl.a, MR + 1.3);
    api.mesh(mx, mz, m => { burnsW16Bamboo(m, 0, 0, 0, 0, MTOP + 0.2, 0, 0.13, { seg: 0.85 }); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.15, y0: 0, y1: MTOP + 0.2, walk: false, camPass: true }] }; });
    // the winch: a drum with a crank, rope up to the mast
    api.mesh(wx, wz, m => {
      m.color('#5a3c22'); m.roundBox(0, 0.35, 0, 0.9, 0.7, 0.7, 0.08);
      m.color('#c8c8d0').shine(3); m.push(); m.tf(0, 0.85, 0, 0, 0, Math.PI / 2); m.roundCyl(0, -0.35, 0, 0.18, 0.7, 0.03, { seg: 14 }); m.pop();
      m.color('#2a2a30'); m.limb(0.42, 0.85, 0, 0.42, 1.15, 0.18, 0.03, 0.03, { seg: 5 }); m.shine(0);
      m.color('#e8d8b0'); m.limb(0, 1.0, 0, 0, MTOP, Math.hypot(mx - wx, mz - wz), 0.018, 0.018, { seg: 4 });
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.45, hz: 0.35, y0: 0, y1: 0.7 }] };
    }, { yaw: Math.atan2(L.x - wx, L.z - wz) });
    // the raised sail (a fabric hypar between the centre pole, the mast and two low corners)
    const A = [L.x, CTOP - 0.15, L.z], Cm = [mx, MTOP - 0.1, mz], [b1x, b1z] = at(sl.a - 0.72, MR * 0.78), [b2x, b2z] = at(sl.a + 0.72, MR * 0.78);
    const Bq = [b1x, 3.0, b1z], Dq = [b2x, 3.0, b2z];
    const cx = (A[0] + Cm[0] + Bq[0] + Dq[0]) / 4, cy = (A[1] + Cm[1] + Bq[1] + Dq[1]) / 4, cz = (A[2] + Cm[2] + Bq[2] + Dq[2]) / 4;
    const mv = api.mover(m => {
      const P = (u, v, o) => { const p = [0, 1, 2].map(k => { const ab = lerp(A[k], Bq[k], u), dc = lerp(Dq[k], Cm[k], u); return lerp(ab, dc, v); }); const sag = Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 0.45; o[0] = p[0] - cx; o[1] = p[1] - cy - sag; o[2] = p[2] - cz; };
      const canvas = BURNS_ATLAS.pattern('canvas');
      const uvFn = (u, v) => [lerp(canvas.u0, canvas.u1, u), lerp(canvas.v0, canvas.v1, v)];
      m.color(sl.col).shine(1); m.surf(m.lo ? 6 : 12, m.lo ? 6 : 12, P, { uvFn }); m.surf(m.lo ? 6 : 12, m.lo ? 6 : 12, P, { uvFn, flip: true }); m.shine(0);
      // corner rings + ties
      m.color('#d8d8e0').shine(3); for (const q of [A, Bq, Cm, Dq]) { m.push(); m.tf(q[0] - cx, q[1] - cy, q[2] - cz); m.torus(0, 0, 0, 0.09, 0.02, { seg: 8, tseg: 3 }); m.pop(); } m.shine(0);
      return { cols: [] };
    });
    mv.x = cx; mv.y = cy; mv.z = cz; mv.visible = true;
    // the lowered bundle sits by the winch
    const low = { x: lerp(wx, mx, 0.4), y: 0.25, z: lerp(wz, mz, 0.4) };
    return { i, sl, mv, up: { x: cx, y: cy, z: cz }, low, k: 0, done: false, winch: { x: wx, z: wz }, mast: { x: mx, z: mz }, gustT: 2.5 + i * 1.3, gust: 0 };
  });
  // rugs, couches, poufs, bongos, a hammock
  api.paint((c, P, Sx) => {
    const rug = (x, z, rx, rz, a, c1, c2) => { const [px, pz] = P(x, z); c.save(); c.translate(px, pz); c.rotate(a); c.fillStyle = c1; c.beginPath(); c.ellipse(0, 0, rx * Sx, rz * Sx, 0, 0, TAU); c.fill(); c.strokeStyle = c2; c.lineWidth = 0.18 * Sx; for (let k = 0.3; k < 1; k += 0.22) { c.beginPath(); c.ellipse(0, 0, rx * Sx * k, rz * Sx * k, 0, 0, TAU); c.stroke(); } c.restore(); };
    rug(L.x, L.z, 6.2, 4.6, 0.3, 'rgba(150,40,60,0.75)', 'rgba(255,190,90,0.6)');
    rug(L.x + 3, L.z + 3.5, 2.6, 1.8, -0.4, 'rgba(40,110,130,0.7)', 'rgba(255,240,200,0.5)');
    rug(BW16.F.x, BW16.F.z, 13.5, 13.5, 0, 'rgba(120,80,50,0.25)', 'rgba(255,200,120,0.15)');
  });
  api.prop('couch', { x: L.x - 3.6, z: L.z + 1.2, yaw: 1.2, col: '#8a2a4a' });
  api.prop('couch', { x: L.x + 3.4, z: L.z - 2.2, yaw: -2.3, col: '#2a5a7a' });
  api.prop('couch', { x: L.x + 1.0, z: L.z + 4.4, yaw: Math.PI + 0.1, col: '#7a4a1a' });
  for (const [x, z, c] of [[L.x - 1.2, L.z - 3.0, '#ff9a3a'], [L.x + 4.8, L.z + 1.6, '#c84aa8'], [L.x - 4.6, L.z - 1.8, '#38a8b8']]) api.sphere(x, 0, z, 0.45, c, { squash: 0.6 });
  api.cylinder(L.x + 1.7, 0, L.z - 1.0, 0.24, 0.62, '#a8643a', { round: 0.04 }); api.cylinder(L.x + 2.25, 0, L.z - 0.7, 0.2, 0.55, '#c88a4a', { round: 0.04 });
  // a hammock between two short posts
  const hx = L.x - 5.5, hz = L.z - 5.6;
  api.mesh(hx, hz, m => {
    for (const sd of [-1, 1]) burnsW16Bamboo(m, sd * 1.9, 0, 0, sd * 1.9, 1.7, 0, 0.08, { seg: 0.6 });
    m.color('#ff8a5a'); m.surf(10, 4, (u, v, o) => { o[0] = (u - 0.5) * 3.6; o[1] = 1.45 - Math.sin(u * Math.PI) * 0.75 + (v - 0.5) * 0; o[2] = (v - 0.5) * 0.9 * Math.sin(0.3 + u * (Math.PI - 0.6)); }, {}); m.surf(10, 4, (u, v, o) => { o[0] = (u - 0.5) * 3.6; o[1] = 1.45 - Math.sin(u * Math.PI) * 0.75; o[2] = (v - 0.5) * 0.9 * Math.sin(0.3 + u * (Math.PI - 0.6)); }, { flip: true });
    return { cols: [{ t: 'cyl', x: -1.9, z: 0, r: 0.1, y0: 0, y1: 1.7, walk: false }, { t: 'cyl', x: 1.9, z: 0, r: 0.1, y0: 0, y1: 1.7, walk: false }] };
  }, { yaw: 0.6 });
  S.hammockSpot = { x: hx, z: hz };
  api.light(L.x, L.z, 14, '#ffb06a', 0.5);
};

/* ---------------- the Sky Hammock (photo 3: only Party Powder jumps reach it) ---------------- */
BW16.buildSkyHammock = function (api, g, S) {
  const H = BW16.HAMMOCK;
  api.mesh(H.x, H.z, m => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) burnsW16Bamboo(m, sx * 3.25, 0, sz * 1.95, sx * 3.25, H.y + 2.2, sz * 1.95, 0.12, { seg: 0.9 });
    // a bamboo sky-deck with a hammock slung over it (you can jump up through it from below)
    m.color('#8a5a32'); m.roundBox(0, H.y - 0.14, 0, 6.3, 0.24, 3.7, 0.08);
    m.color('#d8b46a'); for (let k = -5; k <= 5; k++) m.box(k * 0.56, H.y + 0.0, 0, 0.5, 0.03, 3.6, { uv: BURNS_ATLAS.pattern('wood'), uvFaces: ['py'] });
    m.color('#ff7a8a'); const hm = (u, v, o) => { o[0] = (u - 0.5) * 5.4; o[1] = H.y + 1.75 - Math.sin(u * Math.PI) * 1.2; o[2] = (v - 0.5) * 1.3 * (0.5 + 0.5 * Math.sin(u * Math.PI)); };
    m.surf(12, 4, hm, {}); m.surf(12, 4, hm, { flip: true });
    m.color('#ff4fa8', 0.9); for (let i = 0; i < 11; i++) { const x = -3.0 + i * 0.6; m.ball(x, H.y + 2.05 - Math.sin(i / 10 * Math.PI) * 0.35, 1.95, 0.07, { seg: 6, rings: 4 }); m.ball(x, H.y + 2.05 - Math.sin(i / 10 * Math.PI) * 0.35, -1.95, 0.07, { seg: 6, rings: 4 }); } m.emissive(0);
    const pc = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) pc.push({ t: 'cyl', x: sx * 3.25, z: sz * 1.95, r: 0.14, y0: 0, y1: H.y + 2.2, walk: false, camPass: true });
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 3.15, hz: 1.85, y0: H.y - 0.26, y1: H.y, solid: false }].concat(pc), lights: [{ x: 0, y: H.y + 1.9, z: 1.95, s: 2.0, c: '#ff4fa8' }, { x: 0, y: H.y + 1.9, z: -1.95, s: 2.0, c: '#ff4fa8' }] };
  }, { yaw: 0.3 });
  api.sign('SKY HAMMOCK\nNO LADDER.\nJUMP REAL HIGH. (ASK BAM BAM)', H.x - 3.2, H.z + 4.2, { yaw: Math.PI + 0.3, h: 1.1, style: { bg: '#f4ead0', fg: '#3a1a10', size: 34, border: '#8a5a32' } });
};

/* ---------------- the bike tree (an art piece of welded old bikes; the yellow bike is up top) ---------------- */
BW16.buildBikeTree = function (api, g, S) {
  const T = BW16.TREE;
  const bike = (m, x, y, z, yaw, roll, col) => {
    m.push(); m.tf(x, y, z, yaw, 0, roll);
    m.color('#2a2a30'); for (const sz of [-0.52, 0.52]) { m.push(); m.tf(0, 0.34, sz, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.34, 0.03, { seg: m.lo ? 10 : 16, tseg: 4 }); m.pop(); }
    m.color(col).shine(2); m.limb(0, 0.34, -0.52, 0, 0.72, -0.05, 0.03, 0.03, { seg: 5 }); m.limb(0, 0.72, -0.05, 0, 0.34, 0.52, 0.03, 0.03, { seg: 5 }); m.limb(0, 0.34, -0.52, 0, 0.36, 0.0, 0.03, 0.03, { seg: 5 }); m.limb(0, 0.36, 0.0, 0, 0.72, -0.05, 0.03, 0.03, { seg: 5 });
    m.color('#1a1a1a'); m.roundBox(0, 0.78, -0.12, 0.12, 0.05, 0.24, 0.02); m.limb(-0.25, 0.85, 0.42, 0.25, 0.85, 0.42, 0.015, 0.015, { seg: 4 }); m.shine(0);
    m.pop();
  };
  api.mesh(T.x, T.z, m => {
    const cols = [];
    // the trunk: three twisted rusty tubes
    m.color('#7a4a2a').shine(1);
    for (let k = 0; k < 3; k++) { let prev = null; for (let i = 0; i <= 8; i++) { const y = i * 0.62, a = k / 3 * TAU + y * 0.7, r = 0.28 - i * 0.012; const p = [Math.sin(a) * r, y, Math.cos(a) * r]; if (prev) m.limb(prev[0], prev[1], prev[2], p[0], p[1], p[2], 0.11 - i * 0.006, 0.105 - i * 0.006, { seg: 7 }); prev = p; } }
    m.shine(0);
    // branches with old bikes
    const cols2 = ['#38a8d8', '#ff5a5a', '#7ad84a', '#c86aff', '#ff9a2a', '#f4f4f0'];
    for (let i = 0; i < 6; i++) {
      const a = i * 1.07 + 0.4, y0 = 1.3 + i * 0.62, r = 1.6 + (i % 2) * 0.5;
      m.color('#6a3e22'); m.limb(0, y0, 0, Math.sin(a) * r, y0 + 0.7, Math.cos(a) * r, 0.07, 0.05, { seg: 6 });
      bike(m, Math.sin(a) * (r + 0.2), y0 + 0.35, Math.cos(a) * (r + 0.2), a + Math.PI / 2, (i % 2 ? 0.5 : -0.4), cols2[i]);
    }
    // the climb: tyre-ring steps spiralling up the trunk
    const st = [[1.9, 0.85, 0.2], [1.9, 1.75, 1.8], [1.95, 2.65, 3.4], [1.9, 3.5, 5.0]];
    for (const [r, y, a] of st) {
      const x = Math.sin(a) * r, z = Math.cos(a) * r;
      m.color('#1e1e22'); m.push(); m.tf(x, y - 0.11, z); m.torus(0, 0, 0, 0.62, 0.11, { seg: 18, tseg: 6 }); m.pop();
      m.color('#a87a42'); m.roundCyl(x, y - 0.12, z, 0.6, 0.12, 0.04, { seg: 16 });
      m.color('#6a3e22'); m.limb(x * 0.3, y - 0.3, z * 0.3, x, y - 0.12, z, 0.05, 0.05, { seg: 5 });
      cols.push({ t: 'cyl', x, z, r: 0.66, y0: y - 0.24, y1: y });
    }
    // the crown platform
    m.color('#8a5a32'); m.roundCyl(0, 4.1, 0, 1.25, 0.16, 0.05, { seg: 20 });
    m.color('#ffd36a', 0.9); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; m.ball(Math.sin(a) * 1.25, 4.32, Math.cos(a) * 1.25, 0.07, { seg: 6, rings: 4 }); } m.emissive(0);
    cols.push({ t: 'cyl', x: 0, z: 0, r: 1.25, y0: 4.0, y1: 4.26 });
    cols.push({ t: 'cyl', x: 0, z: 0, r: 0.42, y0: 0, y1: 4.0 });
    return { cols, lights: [{ x: 0, y: 4.4, z: 0, s: 2.0, c: '#ffd36a' }, { x: 0, y: 0, z: 0, s: 0, c: '#ffc070', pool: 8, i: 0.5 }] };
  });
  // the yellow community bike, sitting in the crown (a mover so it can leave)
  const mv = api.mover(m => { bike(m, 0, 0, 0, 0, 0, '#ffd21a'); m.color('#ffd21a').shine(2); m.roundBox(0, 0.6, 0.1, 0.06, 0.18, 0.5, 0.02); m.shine(0); return { cols: [] }; });
  mv.x = T.x + 0.2; mv.y = 4.26; mv.z = T.z - 0.1; mv.yaw = 0.8;
  S.treeBike = mv;
  api.sign('THE BIKE TREE\n"EVERY BIKE IS A COMMUNITY BIKE\nIF YOU BELIEVE"', T.x + 3.2, T.z + 1.6, { yaw: 0.9, h: 1.1, style: { bg: '#2a1a10', fg: '#ffd36a', size: 30, border: '#ffd36a' } });
};

/* ---------------- camp props: arch, trailer, container, RV, limbo, kitchen, dome, judges ---------------- */
BW16.buildCamp = function (api, g, S) {
  const F = BW16.F, R = api.rng;
  // ---- the entrance arch
  const Ar = BW16.ARCH;
  api.mesh(Ar.x, Ar.z, m => {
    const cols = [];
    for (const sd of [-1, 1]) {
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; burnsW16Bamboo(m, sd * 4.2 + Math.sin(a) * 0.22, 0, Math.cos(a) * 0.22, sd * 4.2 + Math.sin(a) * 0.12, 5.8, Math.cos(a) * 0.12, 0.1, { seg: 0.8 }); }
      burnsW16Lash(m, sd * 4.2, 2.0, 0, 0.3); burnsW16Lash(m, sd * 4.2, 4.6, 0, 0.26);
      cols.push({ t: 'cyl', x: sd * 4.2, z: 0, r: 0.4, y0: 0, y1: 5.8 });
    }
    let prev = null; for (let i = 0; i <= 12; i++) { const t = i / 12, x = lerp(-4.6, 4.6, t), y = 5.4 + Math.sin(t * Math.PI) * 1.5, p = [x, y, 0]; if (prev) { m.color(i % 2 ? '#d8b46a' : '#c9a35c'); m.limb(prev[0], prev[1], prev[2], p[0], p[1], p[2], 0.13, 0.13, { seg: 8 }); } prev = p; }
    m.color('#ffd36a', 0.9); for (let i = 1; i < 12; i++) { const t = i / 12, x = lerp(-4.6, 4.6, t), y = 5.4 + Math.sin(t * Math.PI) * 1.5 - 0.45; m.limb(x, y + 0.3, 0, x, y + 0.05, 0, 0.006, 0.006, { seg: 3 }); m.ball(x, y, 0, 0.11, { seg: 8, rings: 5 }); } m.emissive(0);
    return { cols, lights: [{ x: 0, y: 6.2, z: 0.5, s: 2.5, c: '#ffd36a' }, { x: 0, y: 0, z: 2, s: 0, c: '#ffb06a', pool: 9, i: 0.5 }] };
  });
  api.sign('RHYTHM WAVE', Ar.x, Ar.z + 0.15, { y: 3.9, h: 1.2, post: false, style: { bg: '#2a160c', fg: '#ffd36a', size: 64, border: '#ffd36a', glow: '#ff9a3a', round: 18 }, glow: '#ffb04a' });
  api.sign('BAMBOO FLOOR · DANCE CONTEST TONIGHT\nNO SHOES ON THE LOTUS', Ar.x + 6.5, Ar.z - 1.5, { yaw: Math.PI, h: 0.9, style: { bg: '#f4ead0', fg: '#3a1a10', size: 34, border: '#8a5a32' } });
  // bamboo fence runs either side of the arch
  for (const sd of [-1, 1]) api.mesh(Ar.x + sd * 15, Ar.z, m => { for (let i = 0; i < 7; i++) { const x = (i - 3) * 2.0; burnsW16Bamboo(m, x, 0, 0, x, 1.4, 0, 0.07, { seg: 0.7, noNodes: true }); } burnsW16Bamboo(m, -6.2, 1.15, 0, 6.2, 1.15, 0, 0.06, { seg: 2.2, noNodes: true }); burnsW16Bamboo(m, -6.2, 0.55, 0, 6.2, 0.55, 0, 0.06, { seg: 2.2, noNodes: true }); return { cols: [{ t: 'box', x: 0, z: 0, hx: 6.3, hz: 0.12, y0: 0, y1: 1.4, walk: false }] }; });
  // ---- the bamboo trailer (pole 1 on top of the pile)
  const Tr = BW16.TRAILER;
  api.mesh(Tr.x, Tr.z, m => {
    m.color('#3a3a42').shine(2); m.roundBox(0, 0.62, 0, 2.5, 0.22, 6.2, 0.06);
    m.color('#2a2a30'); m.limb(0, 0.55, 3.1, 0, 0.5, 4.6, 0.05, 0.05, { seg: 6 });
    for (const sx of [-1, 1]) for (const sz of [-1.1, 1.1]) { m.color('#1a1a1e'); m.push(); m.tf(sx * 1.36, 0.36, sz, 0, 0, Math.PI / 2); m.roundCyl(0, -0.14, 0, 0.36, 0.28, 0.06, { seg: 16 }); m.pop(); }
    for (let row = 0; row < 3; row++) for (let k = 0; k < 4 - row; k++) { const x = (k - (3 - row) / 2) * 0.32, y = 0.86 + row * 0.27; burnsW16Bamboo(m, x, y, -2.9, x, y, 2.9, 0.13, { seg: 1.2 }); }
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.3, hz: 3.1, y0: 0, y1: 0.73 }, { t: 'box', x: 0, z: 0, hx: 0.7, hz: 3.0, y0: 0.73, y1: 1.5 }] };
  }, { yaw: Math.PI / 2 });
  // ---- the shipping container (pole 2 on the roof), with a crate staircase
  const Co = BW16.CONTAINER;
  api.mesh(Co.x, Co.z, m => {
    m.color('#2f7a74').shine(2); m.roundBox(0, Co.top / 2, 0, 6.1, Co.top, 2.45, 0.06);
    m.color('#276862'); for (let i = -14; i <= 14; i++) { m.box(i * 0.21, Co.top / 2, 1.235, 0.08, Co.top - 0.15, 0.03); m.box(i * 0.21, Co.top / 2, -1.235, 0.08, Co.top - 0.15, 0.03); }
    m.color('#c8c8d0').shine(3); for (const sd of [-1, 1]) m.limb(3.07, 0.2, sd * 0.4, 3.07, Co.top - 0.2, sd * 0.4, 0.025, 0.025, { seg: 5 }); m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 3.05, hz: 1.23, y0: 0, y1: Co.top }] };
  }, { yaw: 0.1 });
  api.prop('crate', { x: Co.x + 4.3, z: Co.z + 0.6, s: 1.0 });
  api.prop('crate', { x: Co.x + 4.2, z: Co.z - 0.5, s: 1.0 });
  api.prop('crate', { x: Co.x + 4.15, z: Co.z - 0.45, y: 1.0, s: 0.9 });
  api.sign('BAMBOO & DREAMS\nSTORAGE', Co.x, Co.z + 1.4, { y: 1.0, h: 0.8, post: false, style: { bg: '#f4ead0', fg: '#2a4a4a', size: 36, border: '#2a4a4a' } });
  // ---- the camp RV (pole 4 is its rooftop flagpole), with a cooler + barrel + crate staircase
  const Rv = BW16.RV;
  api.prop('rv', { x: Rv.x, z: Rv.z, yaw: Math.PI / 2, seed: 16, col: '#f2ead8' });
  api.prop('cooler', { x: Rv.x + 1.4, z: Rv.z + 3.1, yaw: 0.2, col: '#2a8ac8' });
  api.cylinder(Rv.x + 2.6, 0, Rv.z + 2.25, 0.4, 1.25, '#3a6aa8', { round: 0.05 });
  api.prop('crate', { x: Rv.x + 2.6, z: Rv.z + 1.65, y: 0, s: 0.9 });
  api.prop('crate', { x: Rv.x + 2.6, z: Rv.z + 1.65, y: 0.9, s: 0.9 });
  // ---- kitchen: shade, grill, long table
  const K = BW16.KITCHEN;
  api.prop('shade', { x: K.x, z: K.z, w: 7, d: 5.5, h: 2.9, col: '#f0d8a8' });
  api.roundBox(K.x - 1.5, 0, K.z - 1.4, 3.6, 0.85, 0.9, '#8a5a32', { r: 0.06 });
  api.mesh(K.x + 2.0, K.z - 1.4, m => { m.color('#2a2a30').shine(2); m.roundBox(0, 0.45, 0, 1.4, 0.9, 0.8, 0.06); m.color('#ff7a2a', 0.8); m.roundBox(0, 0.92, 0, 1.2, 0.04, 0.65, 0.02); m.emissive(0); m.color('#d8d8e0').shine(3); for (let i = 0; i < 6; i++) m.limb(-0.55, 0.95, -0.28 + i * 0.11, 0.55, 0.95, -0.28 + i * 0.11, 0.008, 0.008, { seg: 3 }); m.shine(0); m.color('#e8d8a0'); for (let i = 0; i < 4; i++) m.roundBox(-0.35 + i * 0.24, 0.98, 0.05, 0.18, 0.04, 0.18, 0.01); return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.7, hz: 0.4, y0: 0, y1: 0.95 }], lights: [{ x: 0, y: 1.0, z: 0, s: 1.2, c: '#ff7a2a' }] }; });
  api.sign('GRILLED CHEESE\nIS A HUG\nYOU CAN EAT', K.x - 3.6, K.z + 2.9, { yaw: 0.4, h: 1.0, style: { bg: '#ffd36a', fg: '#5a2a10', size: 34, border: '#5a2a10' } });
  // ---- the chill dome
  api.prop('dome', { x: BW16.DOME.x, z: BW16.DOME.z, r: 6, col: '#f4e8d8', alt: '#ffb0d8', lights: true, glow: '#ff8ad8' });
  // ---- the judges' table (south of the floor)
  const J = BW16.JUDGES;
  api.mesh(J.x, J.z, m => {
    m.color('#5a3a22'); m.roundBox(0, 0.75, 0, 5.4, 0.1, 1.0, 0.04);
    m.color('#ffd36a').shine(1); m.roundBox(0, 0.42, -0.48, 5.3, 0.62, 0.04, 0.02); m.shine(0);
    m.color('#5a3a22'); for (const sx of [-2.5, 2.5]) for (const sz of [-0.4, 0.4]) m.limb(sx, 0, sz, sx, 0.72, sz, 0.04, 0.04, { seg: 5 });
    m.color('#f4f4f0'); for (let i = 0; i < 3; i++) m.roundBox(-1.8 + i * 1.8, 0.82, 0.1, 0.4, 0.02, 0.3, 0.01);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.7, hz: 0.5, y0: 0, y1: 0.8 }] };
  }, { yaw: Math.PI });
  api.sign('JUDGES', J.x, J.z - 0.55, { y: 0.15, h: 0.45, post: false, yaw: 0, style: { bg: '#3a1a10', fg: '#ffd36a', size: 40, border: '#ffd36a' } });
  for (let i = 0; i < 3; i++) api.prop('chair', { x: J.x - 1.8 + i * 1.8, z: J.z + 1.0, yaw: Math.PI, col: ['#ff7a3a', '#ff4fa8', '#22b8c4'][i] });
  // ---- the limbo pole (pole 3) held at hip height between two campers
  const Li = BW16.LIMBO;
  const lp = api.mover(m => { burnsW16Bamboo(m, -2.0, 0, 0, 2.0, 0, 0, 0.07, { seg: 0.9 }); return { cols: [] }; });
  lp.x = Li.x; lp.y = 1.12; lp.z = Li.z; lp.yaw = Math.PI / 2;
  S.limboPole = lp;
  api.sign('LIMBO\nHOW LOW CAN\nYOUR CHAKRAS GO?', Li.x + 3.4, Li.z - 2.2, { yaw: -0.7, h: 0.9, style: { bg: '#38c8c8', fg: '#1a1a2a', size: 32, border: '#1a1a2a' } });
  // ---- camp tents, a porta-potty bank, pennants, string lights
  const tents = [[-44, -94], [-40, -100], [-34, -106], [36, -102], [42, -106], [44, -60], [46, -48]];
  tents.forEach(([x, z], i) => api.prop('tent', { x, z, yaw: R() * TAU, col: ['#3a8a5a', '#c84a3a', '#3a6aa8', '#d8a03a', '#8a4ac8'][i % 5] }));
  for (let i = 0; i < 3; i++) api.prop('portapotty', { x: 44 + i * 1.35, z: -114, yaw: Math.PI, col: ['#2a6ac8', '#3a8a3a', '#2a6ac8'][i] });
  api.prop('pennants', { x: 0, z: 0, x0: -4.2, y0: 5.4, z0: Ar.z, x1: -14, y1: 4.5, z1: F.z - 26, n: 26, sag: 0.8 });
  api.prop('pennants', { x: 0, z: 0, x0: 4.2, y0: 5.4, z0: Ar.z, x1: 14, y1: 4.5, z1: F.z - 26, n: 26, sag: 0.8 });
  api.prop('pennants', { x: 0, z: 0, x0: BW16.LOUNGE.x, y0: 8.0, z0: BW16.LOUNGE.z, x1: F.x + 9.6, y1: 4.2, z1: F.z - 3, n: 22, sag: 0.9 });
  // warm light pools all over camp (they only show once the sun is low)
  for (const [x, z, r, c] of [[F.x, F.z - 9, 12, '#38c8ff'], [K.x, K.z, 9, '#ffb06a'], [Ar.x, Ar.z + 3, 10, '#ffd36a'], [BW16.TREE.x, BW16.TREE.z, 8, '#ffd36a'], [Co.x, Co.z + 3, 8, '#ffb06a'], [Rv.x + 3, Rv.z, 8, '#ff9a6a'], [BW16.JUDGES.x, BW16.JUDGES.z + 1, 6, '#ffd36a']]) api.light(x, z, r, c, 0.45);
};

/* ---------------- the street (Brady's way in) ---------------- */
BW16.buildStreet = function (api, g, S) {
  const R = api.rng;
  api.road([[-150, -150], [150, -150]], 11, { tracks: [-2, 2] });
  api.road([[0, -150], [0, -120]], 6, {});
  api.prop('rv', { x: -32, z: -160, yaw: Math.PI / 2, seed: 161 });
  api.prop('shade', { x: -22, z: -162, w: 6, d: 5, col: '#c8b8e8' });
  api.prop('couch', { x: -22, z: -163.5, yaw: 0, col: '#5a2a8a' });
  api.prop('dome', { x: 36, z: -162, r: 6.5, col: '#e0f0ff', alt: '#9ad8ff', lights: true, glow: '#38c8ff' });
  api.prop('van', { x: 22, z: -159, yaw: -Math.PI / 2, seed: 162 });
  api.prop('shade', { x: 52, z: -140, w: 5, d: 5, col: '#f0c8a8' });
  api.prop('tent', { x: -48, z: -138, yaw: 0.4, col: '#3a6aa8' }); api.prop('tent', { x: -54, z: -142, yaw: 1.2, col: '#c84a3a' });
  api.prop('rv', { x: 64, z: -160, yaw: Math.PI / 2, seed: 163 });
  api.prop('camper', { x: -64, z: -158, yaw: -Math.PI / 2, seed: 164 });
  // the street sign at the corner: Brady has been looking for 4:30 all day
  api.mesh(-6, -141, m => { burnsW16Bamboo(m, 0, 0, 0, 0, 3.4, 0, 0.06, { seg: 0.8, col: '#8a8a92', node: '#6a6a72' }); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.08, y0: 0, y1: 3.4, walk: false, camPass: true }] }; });
  api.sign('4:30', -6, -141, { y: 2.9, h: 0.45, post: false, yaw: Math.PI / 2, style: { bg: '#2a6a3a', fg: '#ffffff', size: 44, border: '#ffffff' } });
  api.sign('4:30 IS A TIME.\nNOT A STREET.\n(THE BASS IS THAT WAY)', -9, -136, { yaw: Math.PI * 0.85, h: 1.0, style: { bg: '#f4ead0', fg: '#3a1a10', size: 32, border: '#3a1a10' } });
  api.light(0, -150, 14, '#ffb06a', 0.35);
};

/* ---------------- the playa: lamp line, anemones, Uncle Barter, the donkey piñata ---------------- */
BW16.PATH = [[0, -28], [6, 0], [-4, 30], [8, 62], [-6, 96], [6, 128], [-4, 160], [4, 190], [0, 212]];
BW16.buildPlaya = function (api, g, S) {
  const P = BW16.PATH;
  // a faint bike track to the mushrooms
  api.road(P, 3.2, { col: 'rgba(150,115,90,0.35)', edge: 'rgba(120,90,70,0.12)', tracks: [-0.5, 0.5] });
  // paper-lantern posts along the way (they glow at night, a line to follow even while wonky)
  let side = 1;
  for (let i = 0; i < P.length - 1; i++) {
    const [x0, z0] = P[i], [x1, z1] = P[i + 1];
    for (let t = 0.25; t < 1; t += 0.5) {
      const x = lerp(x0, x1, t) + side * 4.5, z = lerp(z0, z1, t); side = -side;
      api.mesh(x, z, m => { burnsW16Bamboo(m, 0, 0, 0, 0, 2.6, 0, 0.06, { seg: 0.7 }); m.color('#3a2a1a'); m.limb(0, 2.55, 0, 0.5, 2.7, 0, 0.02, 0.02, { seg: 4 }); m.color(side > 0 ? '#ff9a4a' : '#ff6aa8', 0.85); m.ellipsoid(0.5, 2.3, 0, 0.17, 0.22, 0.17, { seg: 10, rings: 6 }); m.emissive(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.08, y0: 0, y1: 2.6, walk: false, camPass: true }], lights: [{ x: 0.5, y: 2.3, z: 0, s: 1.4, c: side > 0 ? '#ffa04a' : '#ff7ab0' }] }; });
      api.light(x, z, 6, side > 0 ? '#ffa04a' : '#ff7ab0', 0.4);
    }
  }
  // LED sea anemones: soft stalks with glowing tips
  const R = mulberry32(1616);
  api.mesh(0, 55, m => {
    const lights = [];
    for (let i = 0; i < 26; i++) {
      const sd = i % 2 ? 1 : -1, x = sd * (7 + R() * 14), z = (R() - 0.5) * 34, h = 2.0 + R() * 2.4, c = BURNS_NEON[i % 7];
      m.color('#3a2a4a'); m.limb(x, 0, z, x + (R() - 0.5) * 0.6, h, z + (R() - 0.5) * 0.6, 0.06, 0.03, { seg: 6 });
      m.color(c, 0.9); m.ball(x, h + 0.1, z, 0.18, { seg: 8, rings: 5 }); m.emissive(0);
      if (i % 3 === 0) lights.push({ x, y: h + 0.1, z, s: 1.1, c });
    }
    return { cols: [], lights };
  });
  // Uncle Barter's reciprocal-gifting emporium
  const U = BW16.BARTER;
  api.paint((c, Pp, Sx) => { const [px, pz] = Pp(U.x, U.z); c.save(); c.translate(px, pz); c.rotate(0.2); c.fillStyle = 'rgba(140,40,40,0.85)'; c.fillRect(-4.5 * Sx, -3 * Sx, 9 * Sx, 6 * Sx); c.strokeStyle = 'rgba(255,200,90,0.8)'; c.lineWidth = 0.3 * Sx; c.strokeRect(-4.1 * Sx, -2.6 * Sx, 8.2 * Sx, 5.2 * Sx); c.fillStyle = 'rgba(40,90,130,0.8)'; for (let i = -3; i <= 3; i++) c.fillRect(i * 1.1 * Sx - 0.2 * Sx, -2 * Sx, 0.4 * Sx, 4 * Sx); c.restore(); });
  api.mesh(U.x, U.z, m => {
    m.color('#6a4426'); m.roundBox(0, 0.32, -1.2, 3.4, 0.64, 1.0, 0.08);
    const goods = ['#ff4fa8', '#38c8ff', '#ffd36a', '#7ad84a', '#c86aff', '#ff9a3a'];
    for (let i = 0; i < 6; i++) { m.color(goods[i]).shine(2); m.roundBox(-1.3 + i * 0.52, 0.76, -1.2 + (i % 2) * 0.2, 0.3, 0.22, 0.3, 0.05); }
    m.shine(0);
    burnsW16Bamboo(m, 2.4, 0, -2.2, 2.4, 2.8, -2.2, 0.06, { seg: 0.7 });
    m.color('#ffb04a').shine(1); m.push(); m.tf(2.4, 2.75, -2.2); m.lathe([[0, -0.05], [1.9, -0.55], [1.9, -0.6], [0, -0.1]], { seg: 16, rMod: (th, t) => 1 - 0.06 * Math.abs(Math.sin(th * 4)) * t }); m.pop(); m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: -1.2, hx: 1.7, hz: 0.5, y0: 0, y1: 0.85 }, { t: 'cyl', x: 2.4, z: -2.2, r: 0.08, y0: 0, y1: 2.8, walk: false, camPass: true }] };
  }, { yaw: 0.2 });
  api.sign('UNCLE BARTER\'S\nRECIPROCAL GIFTING EMPORIUM\n(NOT BARTERING)', U.x - 3.6, U.z - 1.6, { yaw: 0.4, h: 1.2, style: { bg: '#3a1a10', fg: '#ffd36a', size: 30, border: '#ffd36a' }, glow: '#ffb04a' });
  api.light(U.x, U.z, 9, '#ffb04a', 0.5);
  // the giant donkey piñata: an art piece ("WONKY")
  const Pn = BW16.PINATA;
  api.mesh(Pn.x, Pn.z, m => {
    const stripes = ['#ff4fa8', '#ffd36a', '#38c8ff', '#7ad84a', '#ff7a3a', '#c86aff'];
    burnsW16Bamboo(m, 0, 0, 0, 0, 2.4, 0, 0.16, { seg: 0.8, col: '#8a8a92', node: '#5a5a62' });
    m.push(); m.tf(0, 4.0, 0);
    for (let i = 0; i < 6; i++) { const z0 = -2.1 + i * 0.7; m.color(stripes[i]); m.ellipsoid(0, 0, z0 + 0.35, 1.25 * Math.sin(0.35 + i / 5 * 2.4), 1.05 * Math.sin(0.4 + i / 5 * 2.3), 0.42, { seg: 14, rings: 7 }); }
    m.color(stripes[2]); m.limb(0, 0.4, 2.0, 0, 2.0, 3.0, 0.45, 0.4, { seg: 12 });
    m.color(stripes[0]); m.ellipsoid(0, 2.2, 3.5, 0.55, 0.5, 0.85, { seg: 12, rings: 8 });
    m.color(stripes[4]); for (const sd of [1, -1]) m.limb(sd * 0.25, 2.55, 3.2, sd * 0.45, 3.6, 3.0, 0.14, 0.07, { seg: 8 });
    m.color('#1a1a1e').shine(3); for (const sd of [1, -1]) m.ball(sd * 0.36, 2.45, 3.95, 0.09, { seg: 8, rings: 5 }); m.shine(0);
    for (let i = 0; i < 4; i++) { const sx = i % 2 ? 0.55 : -0.55, sz = i < 2 ? 1.4 : -1.4; m.color(stripes[(i + 3) % 6]); m.limb(sx, -0.6, sz, sx, -2.0, sz, 0.22, 0.2, { seg: 8 }); }
    m.color(stripes[5]); for (let i = 0; i < 7; i++) m.limb(0, 0.3, -2.3, Math.sin(i) * 0.4, -1.0, -2.6 - Math.cos(i) * 0.2, 0.05, 0.03, { seg: 4 });
    m.pop();
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.3, y0: 0, y1: 2.4 }, { t: 'box', x: 0, z: 0, hx: 1.1, hz: 2.2, y0: 2.0, y1: 5.1 }], lights: [{ x: 0, y: 0, z: 0, s: 0, c: '#ff8ad8', pool: 10, i: 0.45 }] };
  }, { yaw: -0.7 });
  api.sign('WONKY\n(A DONKEY)', Pn.x - 3, Pn.z + 3, { yaw: Math.PI - 0.6, h: 0.9, style: { bg: '#ff4fa8', fg: '#ffffff', size: 40, border: '#ffffff' } });
  // Pickle Pete's tiny shade
  api.prop('shade', { x: 12, z: 24, w: 3.5, d: 3, h: 2.4, col: '#7ad84a', lights: false });
  api.prop('cooler', { x: 12.6, z: 24.4, yaw: 0.4, col: '#2a8a4a' });
};

/* ---------------- the Grove's vibe field + gate ---------------- */
BW16.buildGroveGate = function (api, g, S) {
  const G = BW16.GROVE, Rf = BW16.FIELD_R, n = 30;
  // little mushroom posts around the field with glowing caps; the field itself is a tall invisible wall
  api.mesh(G.x, G.z, m => {
    const cols = [], lights = [];
    for (let i = 0; i < n; i++) {
      const a = Math.PI + (i + 0.5) / n * TAU; const gateGap = Math.abs(BurnsM.wrap(a - Math.PI)) < 0.12;
      const x = Math.sin(a) * Rf, z = Math.cos(a) * Rf, hue = (i * 37) % 360, c = burnsHSL(hue, 0.85, 0.62);
      if (!gateGap) {
        m.color('#efe6d4'); m.limb(x, 0, z, x, 0.85, z, 0.11, 0.09, { seg: 7 });
        m.color(c, 0.75); m.push(); m.tf(x, 0.8, z); m.lathe([[0.1, 0], [0.42, 0.08], [0.4, 0.2], [0.22, 0.34], [0, 0.38]], { seg: 10 }); m.pop(); m.emissive(0);
        if (i % 3 === 0) lights.push({ x, y: 1.0, z, s: 1.0, c });
      }
      // the wall segment (all but the gate)
      const a2 = Math.PI + (i + 1) / n * TAU, x2 = Math.sin(a2) * Rf, z2 = Math.cos(a2) * Rf, mx = (x + x2) / 2, mz = (z + z2) / 2;
      const isGate = Math.abs(BurnsM.wrap(Math.PI + (i + 1) / n * TAU - Math.PI)) < 0.01 || Math.abs(BurnsM.wrap(a - Math.PI)) < 0.12;
      if (!isGate) cols.push({ t: 'box', x: mx, z: mz, hx: Math.hypot(x2 - x, z2 - z) / 2 + 0.15, hz: 0.25, y0: 0, y1: 40, yaw: Math.atan2(x2 - x, z2 - z) + Math.PI / 2, walk: false, camPass: true, tag: 'bw16Field' });
    }
    return { cols, lights };
  });
  // the gate: two big mushroom posts and a rope; its collider switches off when Doug says so
  const gz = G.z - Rf;
  api.mesh(G.x, gz, m => {
    for (const sd of [-1, 1]) { m.color('#efe6d4'); m.limb(sd * 2.4, 0, 0, sd * 2.4, 2.4, 0, 0.22, 0.17, { seg: 9 }); m.color('#b07aff', 0.8); m.push(); m.tf(sd * 2.4, 2.3, 0); m.lathe([[0.15, 0], [0.8, 0.14], [0.78, 0.36], [0.45, 0.6], [0, 0.66]], { seg: 14 }); m.pop(); m.emissive(0); }
    return { cols: [{ t: 'cyl', x: -2.4, z: 0, r: 0.25, y0: 0, y1: 2.4 }, { t: 'cyl', x: 2.4, z: 0, r: 0.25, y0: 0, y1: 2.4 }], lights: [{ x: -2.4, y: 2.6, z: 0, s: 1.6, c: '#b07aff' }, { x: 2.4, y: 2.6, z: 0, s: 1.6, c: '#b07aff' }] };
  });
  const rope = api.mover(m => { m.color('#ff4fa8', 0.6); m.limb(-2.2, 0, 0, 0, -0.35, 0, 0.05, 0.05, { seg: 6 }); m.limb(0, -0.35, 0, 2.2, 0, 0, 0.05, 0.05, { seg: 6 }); m.emissive(0); m.color('#f4f4f0'); m.roundBox(0, -0.75, 0.05, 1.5, 0.55, 0.05, 0.03); return { cols: [] }; });
  rope.x = G.x; rope.y = 1.3; rope.z = gz;
  S.gateRope = rope;
  S.gateCol = api.collider({ t: 'box', x: G.x, z: gz, hx: 2.3, hz: 0.3, y0: 0, y1: 40, walk: false, camPass: true, tag: 'bw16Gate' });
  api.sign('SHROOM SECURITY\nWAIVERS: CLOSED', G.x + 4.2, gz - 1.2, { yaw: Math.PI + 0.3, h: 1.0, style: { bg: '#2a1a40', fg: '#e0c8ff', size: 36, border: '#b07aff' }, glow: '#b07aff' });
  api.light(G.x, gz - 3, 9, '#b07aff', 0.55);
};

/* ---------------- hallucinations: only there while the sassafras is working ---------------- */
BW16.buildVisions = function (api, g, S) {
  api.hidden(() => {
    // Wonky the sky donkey, floating over the playa
    api.mesh(28, 70, m => {
      const pal = ['#ff9ad8', '#9ad8ff', '#ffe08a', '#b8ff9a'];
      m.color(pal[0]); m.ellipsoid(0, 0, 0, 3.4, 2.6, 6.2, { seg: 16, rings: 10 });
      m.color(pal[1]); m.limb(0, 1.0, 4.8, 0, 5.2, 8.0, 1.6, 1.2, { seg: 12 });
      m.color(pal[2]); m.ellipsoid(0, 5.6, 9.6, 1.8, 1.6, 2.6, { seg: 14, rings: 9 });
      m.color(pal[3]); for (const sd of [1, -1]) m.limb(sd * 0.9, 6.6, 8.6, sd * 1.8, 10.6, 7.6, 0.55, 0.2, { seg: 9 });
      m.color('#ffffff'); for (const sd of [1, -1]) m.ball(sd * 1.1, 6.4, 11.2, 0.5, { seg: 10, rings: 7 });
      m.color('#2a1a3a'); for (const sd of [1, -1]) m.ball(sd * 1.1, 6.35, 11.65, 0.22, { seg: 8, rings: 5 });
      m.color(pal[1]); for (let i = 0; i < 4; i++) { const sx = i % 2 ? 1.8 : -1.8, sz = i < 2 ? 3.6 : -3.6; m.limb(sx, -1.6, sz, sx * 1.2, -6.0, sz * 1.1, 0.8, 0.6, { seg: 9 }); }
      m.color(pal[2]); m.limb(0, 1.2, -6.0, 0, -2.0, -8.4, 0.3, 0.2, { seg: 6 });
      return { cols: [] };
    }, { y: 30, yaw: -0.5 });
    // spiral lollipops along the ride
    const R = mulberry32(4242);
    for (let i = 0; i < 9; i++) {
      const sd = i % 2 ? 1 : -1, z = -10 + i * 24, x = sd * (12 + R() * 10), h = 4 + R() * 3, c = BURNS_NEON[i % 7], c2 = BURNS_NEON[(i + 3) % 7];
      api.mesh(x, z, m => {
        m.color('#ffffff'); m.limb(0, 0, 0, 0, h, 0, 0.12, 0.12, { seg: 6 });
        m.push(); m.tf(0, h + 1.4, 0, R() * TAU, Math.PI / 2);
        for (let k = 0; k < 4; k++) { m.color(k % 2 ? c : c2); m.torus(0, 0, 0, 0.35 + k * 0.32, 0.17, { seg: 18, tseg: 6, sy: 0.6 }); }
        m.pop();
        return { cols: [] };
      });
    }
    // floating jelly orbs
    for (let i = 0; i < 12; i++) {
      const x = (R() - 0.5) * 90, z = R() * 220 - 20, y = 6 + R() * 10, c = BURNS_NEON[(i + 1) % 7];
      api.mesh(x, z, m => { m.color(c); m.ellipsoid(0, 0, 0, 1.2, 0.9, 1.2, { phi1: Math.PI * 0.6, seg: 14, rings: 7 }); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; m.limb(Math.sin(a) * 0.7, -0.2, Math.cos(a) * 0.7, Math.sin(a) * 0.9, -2.6, Math.cos(a) * 0.9, 0.08, 0.03, { seg: 4 }); } return { cols: [] }; }, { y });
    }
    // a rainbow arch over the bike track
    api.mesh(0, 118, m => { const rb = ['#ff4a4a', '#ff9a3a', '#ffe24a', '#7ad84a', '#38c8ff', '#9a6bff']; rb.forEach((c, k) => { m.color(c); m.push(); m.tf(0, 0, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 14 - k * 0.7, 0.36, { seg: 40, tseg: 6 }); m.pop(); }); return { cols: [] }; });
  });
};
