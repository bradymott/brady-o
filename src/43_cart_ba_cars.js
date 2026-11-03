/* ============================================================
   ART CART — more art cars (see 43_cart_b_models.js for the rig kit).
   All original designs: they nod to the playa's legends, never copy one.
   ============================================================ */

/* ---------------- 4. SIR SCORCHALOT: a scaly gentleman dragon ---------------- */
CART_BUILD.dragon = (K, C) => {
  const m = K.m, lo = K.lo, scale = BURNS_ATLAS.pattern('sequin');
  K.wheels({ x: 1.08, zf: 1.75, zr: -1.75, r: 0.5, w: 0.4, rim: '#ffd84a', col: '#141a14' });
  cartPlatform(K, { len: 4.7, w: 2.3, y: 0.66, h: 0.48, col: '#1a2a1e', led: ['#7aff5a', '#ffd84a'] });
  // body: long, scaly, gold belly
  const uvFn = (x, y, z) => [lerp(scale.u0, scale.u1, ((Math.atan2(x, y) / TAU + 1) * 4) % 1), lerp(scale.v0, scale.v1, ((z + 4) * 0.6) % 1)];
  m.color(C.col).shine(2); m.ellipsoid(0, 1.55, -0.1, 1.05, 0.85, 2.3, { seg: lo ? 12 : 20, rings: lo ? 8 : 14, uvFn, colFn: (x, y) => y < -0.45 ? C.col2 : null }); m.shine(0);
  // spikes down the back
  m.color('#ffd84a').shine(2); for (let i = 0; i < (lo ? 4 : 7); i++) { const z = 1.3 - i * (2.8 / (lo ? 3 : 6)); m.push(); m.tf(0, 2.32 - Math.abs(z) * 0.06, z, 0, -0.35, 0); m.lathe([[0.16, 0], [0.02, 0.42], [0, 0.44]], { seg: lo ? 5 : 8 }); m.pop(); } m.shine(0);
  // neck + head (bobs with speed, rears up when firing)
  K.part(0, 2.0, 1.6, (o, s) => { o.pitch = -0.1 + Math.sin(s.t * 2.4) * 0.06 - s.fire * 0.45; o.yaw = s.steer * 0.3 + Math.sin(s.t * 0.7) * 0.08; }, mm => {
    mm.color(C.col).shine(2); mm.limb(0, 0, 0, 0, 0.95, 0.75, 0.5, 0.38, { seg: lo ? 8 : 12 });
    mm.push(); mm.tf(0, 1.15, 1.05, 0, 0.25, 0);
    mm.ellipsoid(0, 0, 0, 0.5, 0.45, 0.62, { seg: lo ? 10 : 16, rings: lo ? 7 : 10 });
    mm.ellipsoid(0, -0.12, 0.62, 0.36, 0.26, 0.48, { seg: lo ? 8 : 12, rings: lo ? 6 : 8 });   // snout
    mm.color(C.col2).ellipsoid(0, -0.3, 0.55, 0.3, 0.1, 0.4, { seg: 8, rings: 5 }); mm.shine(0);
    for (const s of [1, -1]) {
      cartEye(mm, s * 0.3, 0.2, 0.32, 0.15, '#c84a1a', lo, [s * 0.4, 0]);
      mm.color('#ffe8b0').shine(2); mm.push(); mm.tf(s * 0.26, 0.35, -0.2, s * 0.4, -0.9, 0); mm.lathe([[0.1, 0], [0.02, 0.55], [0, 0.57]], { seg: lo ? 5 : 8 }); mm.pop();
      mm.color('#ff6a1a', 1); mm.ball(s * 0.14, -0.05, 1.05, 0.06, { seg: 6, rings: 4 }); mm.emissive(0);
    }
    if (!lo) { mm.color('#ffffff'); for (let k = 0; k < 6; k++) { const a = (k / 5 - 0.5) * 1.6; mm.push(); mm.tf(Math.sin(a) * 0.3, -0.24, 0.62 + Math.cos(a) * 0.4, 0, Math.PI, 0); mm.lathe([[0.04, 0], [0, 0.12]], { seg: 4 }); mm.pop(); } }
    mm.shine(0); mm.pop();
  });
  // wings (flap slowly; beat hard on boost / air)
  for (const s of [1, -1]) K.part(s * 0.75, 2.1, 0.1, (o, st) => { const k = 0.35 + 0.6 * Math.max(st.boost, st.air); o.roll = s * (0.25 + Math.sin(st.t * (3 + 9 * k)) * 0.45 * k); }, mm => {
    mm.color('#7a3ad8').shine(1); mm.push(); mm.tf(s * 0.9, 0.35, -0.2, 0, 0, s * -0.35); mm.ellipsoid(0, 0, 0, 1.0, 0.07, 0.75, { seg: lo ? 8 : 14, rings: lo ? 5 : 8 }); mm.pop();
    mm.color(C.col).shine(2); mm.limb(0, 0, 0, s * 1.65, 0.75, 0.0, 0.1, 0.05, { seg: 6 }); mm.limb(s * 1.65, 0.75, 0, s * 1.35, 0.1, -0.7, 0.05, 0.03, { seg: 5 }); mm.shine(0);
  });
  // tail with a spade tip (wags)
  K.part(0, 1.45, -2.25, (o, s) => { o.yaw = Math.sin(s.t * (2 + s.speed * 4)) * 0.35; }, mm => {
    mm.color(C.col).shine(2); mm.limb(0, 0, 0, 0, -0.2, -1.1, 0.42, 0.24, { seg: lo ? 8 : 10 }); mm.limb(0, -0.2, -1.1, 0, 0.1, -2.0, 0.24, 0.09, { seg: lo ? 6 : 8 });
    mm.color('#ffd84a'); mm.push(); mm.tf(0, 0.15, -2.15, 0, 0, Math.PI / 2); mm.ellipsoid(0, 0, 0, 0.36, 0.05, 0.28, { seg: 8, rings: 5 }); mm.pop(); mm.shine(0);
  });
  cartLamps(K, 0.85, 0.8, 2.36, -2.36, 0.85);
  K.light(0, 3.2, 2.7, 1.6, '#ff7a2a', { big: 1 });
  K.seat({ y: 2.5, z: -0.25, col: '#5a2a8a', accent: '#7aff5a', wheelY: 2.86, wheelZ: 0.4 });
  m.color('#c8ccd8').shine(3); m.limb(0, 2.25, 0.45, 0, 2.82, 0.55, 0.04, 0.04, { seg: 5 }); m.shine(0);
  Object.assign(K.info, { muzzle: [0, 3.0, 3.1], len: 5.6, w: 3.4, h: 3.8 });
};

/* ---------------- 7. FROSTED FURY: a tiny furious cupcake ---------------- */
CART_BUILD.cupcake = (K, C) => {
  const m = K.m, lo = K.lo;
  K.wheels({ x: 0.85, zf: 1.45, zr: -1.45, r: 0.38, w: 0.32, rim: '#ffffff', col: '#2a1a24' });
  m.color('#ffffff').shine(2); m.roundBox(0, 0.55, 0, 1.9, 0.36, 3.9, 0.16); m.shine(0);
  cartLeds(K, [0.96, 0.55, 1.75], [0.96, 0.55, -1.7], lo ? 4 : 8, ['#ff8ac8', '#ffe24a', '#5ac8ff'], 0.05, 3);
  cartLeds(K, [-0.96, 0.55, 1.75], [-0.96, 0.55, -1.7], lo ? 4 : 8, ['#ff8ac8', '#ffe24a', '#5ac8ff'], 0.05, 3);
  // the pleated wrapper (up front)
  m.push(); m.tf(0, 0.7, 0.75);
  m.color(C.col).shine(2); m.lathe([[0.82, 0], [1.02, 0.9], [1.05, 0.92]], { seg: lo ? 14 : 32, rMod: th => 1 + 0.045 * Math.cos(th * 16) }); m.shine(0);
  // frosting swirl, the cherry bounces
  m.color(C.col2).shine(2);
  m.lathe([[1.1, 0.88], [1.16, 1.1], [1.0, 1.35], [0.85, 1.42], [0.88, 1.62], [0.66, 1.85], [0.52, 1.9], [0.55, 2.1], [0.3, 2.35], [0.12, 2.48], [0, 2.52]], { seg: lo ? 14 : 28, rMod: (th, t) => 1 + 0.06 * Math.sin(th * 3 + t * 12) });
  m.shine(0);
  if (!lo) for (let i = 0; i < 40; i++) { const a = i * 2.39996, h = 1.0 + (i % 10) * 0.14, r = 1.08 - (h - 0.9) * 0.55; m.color(BURNS_NEON[i % 7], 0.15); m.push(); m.tf(Math.sin(a) * r, h, Math.cos(a) * r, a, 0.4, i); m.limb(0, 0, -0.06, 0, 0, 0.06, 0.025, 0.025, { seg: 4 }); m.pop(); }
  m.emissive(0); m.pop();
  K.part(0, 3.25, 0.75, (o, s) => { const b = Math.abs(Math.sin(s.t * 7)) * (0.05 + 0.15 * s.speed); o.y = b; o.roll = Math.sin(s.t * 5) * 0.1; }, mm => {
    mm.color('#e8102a', 0.15).shine(3); mm.ball(0, 0, 0, 0.3, { seg: lo ? 10 : 16, rings: lo ? 7 : 12 }); mm.shine(0).emissive(0);
    mm.color('#3a6a1a'); mm.limb(0, 0.25, 0, 0.12, 0.6, -0.08, 0.025, 0.02, { seg: 5 });
  });
  cartLamps(K, 0.6, 0.62, 1.97, -1.97, 0.62);
  K.light(0, 3.25, 0.75, 1.4, '#ff2a4a', { big: 1 });
  K.seat({ y: 1.12, z: -1.3, col: '#ff4fa8', accent: '#ffe24a', wheelZ: -0.72 });
  Object.assign(K.info, { muzzle: [0, 0.8, -2.2], len: 4.2, w: 2.0, h: 3.5, driverScale: 1 });
};

/* ---------------- 8. DUSTY DOUBLOON: a landlocked pirate galleon ---------------- */
CART_BUILD.galleon = (K, C) => {
  const m = K.m, lo = K.lo, wood = BURNS_ATLAS.pattern('wood');
  K.wheels({ x: 1.05, zf: 1.9, zr: -1.9, r: 0.48, w: 0.4, rim: '#ffd06a', col: '#1a1410' });
  // hull: an oval lathe, stretched; gold rail; portholes glowing
  m.push(); m.tf(0, 0.55, 0);
  m.color('#6a4426').shine(1); m.lathe([[0.55, 0], [1.0, 0.25], [1.25, 0.7], [1.3, 1.2], [1.28, 1.3]], { seg: lo ? 14 : 26, sz: 2.35, uv: wood, uvRepeat: 6 }); m.shine(0);
  m.color('#3a2414'); m.lathe([[0, 0.02], [0.55, 0]], { seg: lo ? 10 : 18, sz: 2.35 });
  m.color(C.col2).shine(3); m.push(); m.tf(0, 1.3, 0, 0, 0, 0, 1, 1, 2.35); m.torus(0, 0, 0, 1.28, 0.05, { seg: lo ? 14 : 28, tseg: 4 }); m.pop(); m.shine(0);
  m.color('#9a6a3a'); m.lathe([[0, 1.24], [1.26, 1.24]], { seg: lo ? 14 : 26, sz: 2.35 });
  m.pop();
  for (const s of [1, -1]) for (let i = 0; i < 4; i++) { const z = -1.5 + i * 1.0; m.color('#ffd06a', 0.9); m.push(); m.tf(s * 1.27, 1.25, z, s * Math.PI / 2, 0, 0); m.cyl(0, 0, 0, 0.11, 0.11, 0.04, 10, { smooth: true }); m.pop(); } m.emissive(0);
  // cannons poking out both sides
  for (const s of [1, -1]) for (const z of [-0.7, 0.6]) { m.color('#1a1a1e').shine(3); m.push(); m.tf(s * 1.25, 1.55, z, s * Math.PI / 2, Math.PI / 2, 0); m.roundCyl(0, -0.1, 0, 0.13, 0.65, 0.03); m.pop(); m.shine(0); }
  // stern castle + lanterns
  m.color('#5a3a20'); m.roundBox(0, 2.1, -1.9, 2.0, 0.9, 1.2, 0.08, { uv: wood }); m.color(C.col2).shine(3); m.roundBox(0, 2.58, -1.9, 2.1, 0.08, 1.3, 0.03); m.shine(0);
  for (const s of [1, -1]) { m.color('#ffb84a', 1); m.ellipsoid(s * 0.95, 2.95, -2.45, 0.12, 0.17, 0.12, { seg: 8, rings: 6 }); K.light(s * 0.95, 2.95, -2.45, 1.4, '#ffb84a'); } m.emissive(0);
  // bowsprit + figurehead (a grinning sun)
  m.color('#6a4426'); m.limb(0, 1.9, 2.6, 0, 2.35, 3.6, 0.09, 0.05, { seg: 6 });
  m.color('#ffd06a', 0.3).shine(2); m.push(); m.tf(0, 1.85, 2.72, 0, Math.PI / 2, 0); m.cyl(0, -0.06, 0, 0.32, 0.32, 0.12, 14, { smooth: true }); m.pop(); m.shine(0).emissive(0);
  // masts with billowing sails (part bones), crow's nest, flag
  const mast = (z, h) => { m.color('#7a4e2a').shine(1); m.limb(0, 1.6, z, 0, 1.6 + h, z, 0.1, 0.07, { seg: lo ? 6 : 8 }); m.limb(-1.2, 1.6 + h * 0.62, z, 1.2, 1.6 + h * 0.62, z, 0.05, 0.05, { seg: 5 }); m.shine(0); };
  mast(0.9, 3.2); mast(-0.6, 3.6);
  m.color('#5a3a20'); m.roundCyl(0, 1.6 + 3.6 - 0.5, -0.6, 0.35, 0.3, 0.05);
  // square sails that billow forward with speed (a curved sheet, two-sided), a red band across the middle
  const sail = (z, y0, h, w) => K.part(0, y0 + h / 2, z + 0.05, (o, s) => { o.sz = 0.75 + 0.5 * s.speed + Math.sin(s.t * 3 + z) * 0.06; o.yaw = s.steer * 0.12; }, mm => {
    const sheet = (flip) => mm.surf(lo ? 6 : 10, lo ? 6 : 10, (u, v, out) => { const x = (u - 0.5) * w * (1 - (1 - v) * 0.12), y = (v - 0.5) * h; out[0] = x; out[1] = y; out[2] = 0.42 * Math.sin(u * Math.PI) * (0.55 + 0.45 * Math.sin(v * Math.PI)) + (flip ? -0.03 : 0); }, { flip, colFn: (u, v) => Math.abs(v - 0.5) < 0.07 ? '#c8302a' : null });
    mm.color('#f4ead2'); sheet(false); sheet(true);
    mm.color('#7a4e2a'); mm.limb(-w / 2, h / 2, 0, w / 2, h / 2, 0, 0.04, 0.04, { seg: 5 }); mm.limb(-w / 2, -h / 2, 0, w / 2, -h / 2, 0, 0.035, 0.035, { seg: 5 });
    mm.color('#ff4fd8', 0.5); mm.push(); mm.tf(0, 0.12, 0.45); mm.decal(0, 0, 0, w * 0.32, w * 0.32, BURNS_ATLAS.icon('heart') || BURNS_ATLAS.white, { both: true }); mm.pop(); mm.emissive(0);
  });
  sail(0.9, 2.3, 1.8, 2.2); sail(-0.6, 2.6, 2.0, 2.4);
  K.part(0, 5.3, -0.6, (o, s) => { o.yaw = Math.PI + Math.sin(s.t * 6) * 0.25; }, mm => { mm.color('#1a1a1e'); mm.box(0, 0, 0.45, 0.04, 0.42, 0.9); mm.color('#ffffff', 0.4); mm.decal(0.03, 0, 0.45, 0.3, 0.3, BURNS_ATLAS.icon('heart') || BURNS_ATLAS.white, { both: true }); mm.emissive(0); });
  // the ship's wheel on the stern deck turns with the steering
  m.color('#5a3a20'); m.roundBox(0, 2.55, -1.15, 0.2, 0.7, 0.2, 0.04);
  K.seat({ y: 3.02, z: -1.85, col: '#3a2414', accent: '#ffd06a', wheelY: 3.2, wheelZ: -1.2, tilt: 0.15 });
  Object.assign(K.info, { muzzle: [0, 1.55, 0], len: 6.4, w: 3.0, h: 5.6, extra: { cannons: [[1.6, 1.55, -0.7], [1.6, 1.55, 0.6], [-1.6, 1.55, -0.7], [-1.6, 1.55, 0.6]] } });
};

/* ---------------- 9. TURBO ESCARGOT: the fastest snail alive ---------------- */
CART_BUILD.snail = (K, C) => {
  const m = K.m, lo = K.lo;
  K.wheels({ x: 1.0, zf: 1.7, zr: -1.6, r: 0.44, w: 0.38, rim: '#7aff5a', col: '#14121a' });
  // the foot: a long glossy slug body that rises into the head
  m.color('#3ac8a0').shine(2); m.ellipsoid(0, 0.78, 0, 1.1, 0.42, 2.6, { seg: lo ? 12 : 18, rings: lo ? 6 : 10 });
  m.limb(0, 0.9, 1.7, 0, 1.75, 2.45, 0.48, 0.42, { seg: lo ? 8 : 12 }); m.ball(0, 1.95, 2.55, 0.46, { seg: lo ? 10 : 14, rings: lo ? 7 : 10 }); m.shine(0);
  cartLeds(K, [1.05, 0.72, 1.8], [1.05, 0.72, -2.0], lo ? 5 : 10, ['#7aff5a', '#b07aff'], 0.05, 3);
  cartLeds(K, [-1.05, 0.72, 1.8], [-1.05, 0.72, -2.0], lo ? 5 : 10, ['#7aff5a', '#b07aff'], 0.05, 3);
  m.color('#1a2a1a'); m.ellipsoid(0, 1.72, 2.98, 0.2, 0.08, 0.06, { seg: 8, rings: 4 });   // a smile
  // eye stalks (wobble)
  for (const s of [1, -1]) K.part(s * 0.22, 2.3, 2.55, (o, st) => { o.pitch = -0.3 + Math.sin(st.t * 4 + s) * 0.18 - st.speed * 0.3; o.roll = s * (0.2 + Math.sin(st.t * 3.1 + s * 2) * 0.15); }, mm => { mm.color('#3ac8a0').shine(2); mm.limb(0, 0, 0, 0, 0.9, 0, 0.07, 0.05, { seg: 6 }); mm.shine(0); cartEye(mm, 0, 1.0, 0, 0.17, '#2a1a3a', lo); });
  // the spiral shell (purple with a glowing spiral stripe), wobbles; twin turbo rockets
  K.part(0, 1.15, -0.55, (o, s) => { o.roll = Math.sin(s.t * 2.2) * 0.05; o.pitch = -s.boost * 0.06; }, mm => {
    const turns = 2.6, N = lo ? 26 : 56, ring = lo ? 8 : 12;
    mm.color(C.col).shine(2); mm.push(); mm.tf(0, 1.3, 0, Math.PI / 2, 0, 0);
    mm.surf(N, ring, (u, v, out) => {
      const a = u * turns * TAU, R = 1.25 * Math.exp(-0.22 * a), r = R * 0.62, cx = Math.cos(a) * R * 0.7, cy = Math.sin(a) * R * 0.7;
      const ang = v * TAU, nx = Math.cos(a), ny = Math.sin(a);
      out[0] = cx + nx * Math.cos(ang) * r; out[1] = cy + ny * Math.cos(ang) * r; out[2] = Math.sin(ang) * r * 1.15;
    }, { wrapV: true, out: true });
    mm.pop(); mm.shine(0);
    mm.color('#b07aff', 1); mm.push(); mm.tf(0, 1.3, 0, Math.PI / 2, 0, 0);
    for (let i = 0; i < (lo ? 10 : 22); i++) { const a = i / (lo ? 10 : 22) * turns * TAU, R = 1.25 * Math.exp(-0.22 * a), r = R * 0.62; mm.ball(Math.cos(a) * (R * 0.7 + r * 0.98), Math.sin(a) * (R * 0.7 + r * 0.98), 0, 0.06 + r * 0.04, { seg: 5, rings: 4 }); }
    mm.pop(); mm.emissive(0);
    for (const s of [1, -1]) { mm.color('#c8ccd8').shine(3); mm.push(); mm.tf(s * 0.95, 0.75, -0.6, 0, Math.PI / 2, 0); mm.roundCyl(0, -0.6, 0, 0.2, 1.1, 0.05); mm.color('#ff4a2a').lathe([[0.2, -0.7], [0.14, -0.6], [0.0, -0.6]], { seg: 10 }); mm.pop(); mm.shine(0); }
  });
  K.light(0, 2.45, -0.55, 2.4, C.light, { big: 1 });
  // the rider sits on a saddle on top of the shell (everyone can see who's driving)
  m.color('#3a2a1a'); m.roundBox(0, 3.98, -0.62, 0.7, 0.12, 0.8, 0.05);
  K.seat({ y: 4.2, z: -0.6, col: '#5a2a8a', accent: '#7aff5a', wheelY: 4.58, wheelZ: 0.02 });
  Object.assign(K.info, { muzzle: [0, 0.6, -2.6], len: 5.6, w: 2.3, h: 5.1, extra: { rockets: [[0.95, 1.9, -1.75], [-0.95, 1.9, -1.75]] } });
};

/* ---------------- 10. JELLY JOLT: a floating jellyfish full of static ---------------- */
CART_BUILD.jelly = (K, C) => {
  const m = K.m, lo = K.lo;
  K.wheels({ x: 0.95, zf: 1.55, zr: -1.55, r: 0.42, w: 0.36, rim: '#5af2ff', col: '#14121a' });
  cartPlatform(K, { len: 4.2, w: 2.1, y: 0.6, h: 0.4, col: '#1a1028', led: ['#5af2ff', '#c86aff'] });
  m.color('#c8ccd8').shine(3); for (const s of [1, -1]) m.limb(s * 0.6, 0.8, 0.55, s * 0.45, 2.1, 0.45, 0.06, 0.05, { seg: 6 }); m.shine(0);
  // the bell pulses (squash + stretch); glowing rim; tentacles sway beneath
  K.part(0, 2.35, 0.5, (o, s) => { const p = Math.sin(s.t * 3.2); o.sy = 1 + p * 0.07 + s.fire * 0.15; o.sx = o.sz = 1 - p * 0.05 + s.fire * 0.08; }, mm => {
    mm.color(C.col, 0.28).shine(3); mm.lathe([[1.55, 0], [1.6, 0.18], [1.45, 0.75], [1.05, 1.25], [0.55, 1.52], [0, 1.6]], { seg: lo ? 14 : 28, rMod: (th, t) => 1 + (t < 0.2 ? 0.06 * Math.sin(th * 10) : 0) }); mm.shine(0);
    mm.color('#ff9af0', 0.55); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; mm.limb(Math.sin(a) * 1.5, 0.25, Math.cos(a) * 1.5, Math.sin(a) * 0.35, 1.48, Math.cos(a) * 0.35, 0.05, 0.03, { seg: 4 }); }
    mm.color('#5af2ff', 1); mm.push(); mm.tf(0, 0.1, 0); mm.torus(0, 0, 0, 1.58, 0.07, { seg: lo ? 14 : 28, tseg: 4 }); mm.pop();
    mm.color('#fff0ff', 0.9); mm.ball(0, 0.75, 0, 0.42, { seg: lo ? 8 : 12, rings: 8 }); mm.emissive(0);
  });
  K.light(0, 3.0, 0.5, 4.0, C.light, { big: 1 });
  for (let i = 0; i < 6; i++) {
    const a = (i + 0.5) / 6 * TAU + 0.3, x = Math.sin(a) * 1.25, z = 0.5 + Math.cos(a) * 1.25;
    if (Math.abs(x) < 0.5 && z < -0.3) continue;
    K.part(x, 2.3, z, (o, s) => { o.pitch = Math.sin(s.t * 2.2 + i) * 0.25 + s.speed * 0.5; o.roll = Math.sin(s.t * 1.7 + i * 2) * 0.2; }, mm => {
      for (let k = 0; k < 4; k++) { const y0 = -k * 0.42, y1 = -(k + 1) * 0.42, w = Math.sin(k * 1.3) * 0.12; mm.color(k % 2 ? '#c86aff' : '#ff9af0', 0.45); mm.limb(w, y0, 0, -w, y1, 0, 0.09 - k * 0.015, 0.075 - k * 0.015, { seg: lo ? 5 : 7 }); }
      mm.color('#5af2ff', 1); mm.ball(0, -1.7, 0, 0.08, { seg: 6, rings: 4 }); mm.emissive(0);
    });
  }
  cartLamps(K, 0.75, 0.66, 2.12, -2.12, 0.66);
  K.seat({ y: 1.2, z: -1.4, col: '#3a1a5a', accent: '#5af2ff', wheelZ: -0.82 });
  Object.assign(K.info, { muzzle: [0, 2.6, 0.5], len: 4.4, w: 3.3, h: 4.0 });
};

/* ---------------- 11. DUNE CHOMPER: a land shark with a snapping jaw ---------------- */
CART_BUILD.shark = (K, C) => {
  const m = K.m, lo = K.lo;
  K.wheels({ x: 1.0, zf: 1.75, zr: -1.75, r: 0.46, w: 0.4, rim: '#38c8ff', col: '#14161a' });
  cartPlatform(K, { len: 4.6, w: 2.2, y: 0.62, h: 0.42, col: '#1a2230', led: ['#38c8ff', '#ffffff'] });
  // streamlined body: blue-grey back, white belly
  m.color(C.col).shine(2); m.ellipsoid(0, 1.55, 0, 1.05, 0.9, 2.75, { seg: lo ? 12 : 22, rings: lo ? 8 : 14, colFn: (x, y) => y < -0.25 ? '#eef2f8' : null }); m.shine(0);
  // gills, eyes, dorsal + pectoral fins
  m.color('#2a3a50'); for (const s of [1, -1]) for (let i = 0; i < 3; i++) { m.push(); m.tf(s * 0.98, 1.6, 1.0 - i * 0.22, s * 0.25, 0, 0); m.roundBox(0, 0, 0, 0.04, 0.42, 0.05, 0.02); m.pop(); }
  for (const s of [1, -1]) { m.color('#0a0a10').shine(3); m.ellipsoid(s * 0.72, 1.85, 1.75, 0.13, 0.15, 0.1, { seg: 10, rings: 7 }); m.color('#ffffff', 0.6); m.ball(s * 0.74, 1.9, 1.84, 0.035, { seg: 5, rings: 3 }); m.emissive(0).shine(0); }
  m.color(C.col).shine(2); m.push(); m.tf(0, 2.35, -0.55, 0, -0.5, 0); m.ellipsoid(0, 0.5, 0, 0.1, 0.75, 0.55, { seg: 8, rings: 6 }); m.pop();
  for (const s of [1, -1]) { m.push(); m.tf(s * 0.95, 1.15, 0.5, 0, 0.4, s * 0.6); m.ellipsoid(s * 0.4, 0, -0.2, 0.55, 0.07, 0.38, { seg: 8, rings: 5 }); m.pop(); } m.shine(0);
  // upper teeth on the snout
  m.color('#ffffff').shine(2); for (let i = 0; i < (lo ? 5 : 9); i++) { const a = (i / ((lo ? 5 : 9) - 1) - 0.5) * 2.2; m.push(); m.tf(Math.sin(a) * 0.55, 1.18, 2.15 + Math.cos(a) * 0.35, 0, Math.PI, 0); m.lathe([[0.07, 0], [0, 0.18]], { seg: 5 }); m.pop(); } m.shine(0);
  // the jaw: snaps open when chomping, chatters at speed
  K.part(0, 1.12, 1.25, (o, s) => { o.pitch = 0.08 + s.fire * 0.75 + Math.max(0, Math.sin(s.t * 10)) * 0.05 * s.speed; }, mm => {
    mm.color('#eef2f8').shine(2); mm.ellipsoid(0, -0.05, 0.75, 0.7, 0.2, 0.85, { seg: lo ? 10 : 16, rings: lo ? 5 : 8, phi0: Math.PI / 2 });
    mm.color('#c82a4a'); mm.ellipsoid(0, 0.0, 0.7, 0.55, 0.06, 0.7, { seg: 10, rings: 3, phi1: Math.PI / 2 });
    mm.color('#ffffff'); for (let i = 0; i < (lo ? 5 : 8); i++) { const a = (i / ((lo ? 5 : 8) - 1) - 0.5) * 2.2; mm.push(); mm.tf(Math.sin(a) * 0.55, 0.02, 0.85 + Math.cos(a) * 0.6); mm.lathe([[0.06, 0], [0, 0.16]], { seg: 5 }); mm.pop(); }
    mm.shine(0);
  });
  // the tail fin wags side to side
  K.part(0, 1.6, -2.6, (o, s) => { o.yaw = Math.sin(s.t * (3 + s.speed * 6)) * 0.4; }, mm => {
    mm.color(C.col).shine(2); mm.limb(0, 0, 0, 0, 0.05, -0.7, 0.42, 0.18, { seg: lo ? 8 : 10 });
    mm.push(); mm.tf(0, 0.55, -0.95, 0, -0.55, 0); mm.ellipsoid(0, 0, 0, 0.08, 0.75, 0.32, { seg: 8, rings: 6 }); mm.pop();
    mm.push(); mm.tf(0, -0.35, -0.85, 0, 0.6, 0); mm.ellipsoid(0, 0, 0, 0.08, 0.5, 0.25, { seg: 8, rings: 6 }); mm.pop(); mm.shine(0);
  });
  cartLamps(K, 0.8, 0.72, 2.32, -2.32, 0.72);
  K.light(0, 1.2, 2.9, 1.8, '#38c8ff', { big: 1 });
  K.seat({ y: 2.55, z: 0.3, col: '#1a2a40', accent: '#38c8ff', wheelY: 2.92, wheelZ: 0.95 });
  m.color('#c8ccd8').shine(3); m.limb(0, 2.35, 0.95, 0, 2.88, 1.02, 0.04, 0.04, { seg: 5 }); m.shine(0);
  Object.assign(K.info, { muzzle: [0, 1.3, 3.0], len: 5.8, w: 2.6, h: 3.4 });
};

/* ---------------- 12. WHALE OF A TIME: a happy whale party bus ---------------- */
CART_BUILD.whale = (K, C) => {
  const m = K.m, lo = K.lo;
  K.wheels({ x: 1.15, zf: 1.85, zr: -1.85, r: 0.5, w: 0.42, rim: '#bfe8ff', col: '#141a24' });
  m.color('#0e1a2e').shine(2); m.roundBox(0, 0.65, 0, 2.4, 0.4, 4.9, 0.16); m.shine(0);
  // the whale: blue back, pale grooved belly, cheeky smile
  m.color(C.col).shine(2); m.ellipsoid(0, 1.75, 0.1, 1.45, 1.22, 2.85, { seg: lo ? 14 : 24, rings: lo ? 9 : 16, colFn: (x, y, z) => y < -0.3 ? (Math.floor((x + 3) * 6) % 2 ? '#d8eefc' : '#bfe0f4') : null }); m.shine(0);
  m.color('#0a1a3a'); m.push(); m.tf(0, 1.45, 2.55, 0, 0.1, 0); m.torus(0, 0, 0, 0.7, 0.04, { seg: lo ? 10 : 18, tseg: 4, sy: 0.6 }); m.pop();
  for (const s of [1, -1]) { cartEye(m, s * 1.02, 1.95, 1.75, 0.2, '#0a1a3a', lo, [s * 0.5, 0]); m.color('#ff9ab8', 0.15); m.ellipsoid(s * 1.1, 1.55, 2.0, 0.22, 0.12, 0.1, { seg: 8, rings: 5 }); m.emissive(0); }
  m.color('#1a3a7a'); m.ellipsoid(0, 2.98, 1.0, 0.18, 0.06, 0.12, { seg: 8, rings: 4 });   // blowhole
  // flippers + tail flukes
  for (const s of [1, -1]) K.part(s * 1.3, 1.25, 0.9, (o, st) => { o.roll = s * (-0.2 + Math.sin(st.t * 3 + s) * 0.3); }, mm => { mm.color(C.col).shine(2); mm.ellipsoid(s * 0.5, -0.1, -0.15, 0.62, 0.09, 0.32, { seg: 10, rings: 6 }); mm.shine(0); });
  K.part(0, 1.7, -2.75, (o, s) => { o.pitch = Math.sin(s.t * (2 + s.speed * 3)) * 0.3; }, mm => {
    mm.color(C.col).shine(2); mm.limb(0, 0, 0, 0, 0.25, -0.9, 0.5, 0.25, { seg: lo ? 8 : 10 });
    for (const s of [1, -1]) { mm.push(); mm.tf(s * 0.55, 0.32, -1.15, s * 0.35, 0, 0); mm.ellipsoid(0, 0, 0, 0.7, 0.07, 0.38, { seg: 10, rings: 6 }); mm.pop(); }
    mm.shine(0);
  });
  // a little party deck on its back with string lights
  m.color('#e8d8b8'); m.roundBox(0, 3.0, -0.6, 1.5, 0.08, 2.2, 0.03, { uv: BURNS_ATLAS.pattern('wood') });
  m.color('#3a3a46').shine(2); for (const s of [1, -1]) { m.limb(s * 0.72, 3.0, 0.45, s * 0.72, 3.5, 0.45, 0.03, 0.03, { seg: 4 }); m.limb(s * 0.72, 3.0, -1.65, s * 0.72, 3.5, -1.65, 0.03, 0.03, { seg: 4 }); m.limb(s * 0.72, 3.5, 0.45, s * 0.72, 3.5, -1.65, 0.025, 0.025, { seg: 4 }); } m.shine(0);
  cartLeds(K, [0.72, 3.52, 0.45], [0.72, 3.52, -1.65], lo ? 4 : 8, ['#ffe24a', '#ff4fd8', '#38f2ff'], 0.05, 3);
  cartLeds(K, [-0.72, 3.52, 0.45], [-0.72, 3.52, -1.65], lo ? 4 : 8, ['#ffe24a', '#ff4fd8', '#38f2ff'], 0.05, 3);
  cartLamps(K, 0.95, 0.75, 2.45, -2.45, 0.75);
  K.seat({ y: 3.42, z: -0.55, col: '#1a3a7a', accent: '#bfe8ff', wheelY: 3.78, wheelZ: 0.1 });
  m.color('#c8ccd8').shine(3); m.limb(0, 3.05, 0.12, 0, 3.74, 0.16, 0.04, 0.04, { seg: 5 }); m.shine(0);
  Object.assign(K.info, { muzzle: [0, 3.0, 1.0], len: 6.0, w: 3.2, h: 4.4 });
};
