/* ============================================================
   ART CART — 3D models: the art cars (rigid multi-bone rigs built with
   the engine's BurnsMesh), drivers (the engine's rounded cast), the
   cheering crowd (baked cast poses in shared skinned groups) and props.

   Car rig (one draw call per car; bones are rigid):
     0 body · 1 front-left wheel · 2 front-right · 3 rear-left · 4 rear-right
     5 steering wheel · 6.. animated parts (tails, wings, tentacles, hearts…)
   Each part is authored with its joint at the origin; pose = body · T(joint) · R · S.
   A model: { geo, nb, J (rest joints), parts:[{b, fn}], seat, lights, muzzle, len, w, h, wheelR }
   part fn(o, s): o = {yaw, pitch, roll, sx, sy, sz, x, y, z} offsets to fill,
     s = {t, speed, steer, fire (0..1 recent weapon use), boost, air, beat (0..1 music pulse), night}
   ============================================================ */
const CART_BONES = { BODY: 0, FL: 1, FR: 2, RL: 3, RR: 4, STEER: 5, P0: 6 };
const CART_BUILD = {};          // id -> builder(K) (filled here and in 43_cart_ba_cars.js)
const CartModels = {
  cache: {},
  // hi + lo detail models for a car id
  get(id, lo) {
    const key = id + (lo ? ':lo' : '');
    let M = this.cache[key];
    if (!M) { M = this.build(id, lo); this.cache[key] = M; }
    return M;
  },
  build(id, lo) {
    const K = cartKit(lo), fn = CART_BUILD[id] || CART_BUILD.heart;
    fn(K, cartCar(id));
    const m = K.m;
    // baked ambient occlusion in the rest pose (wheel wells, under the sculpture, seams)
    if (!window.__burnsNoAO && !lo) { try { BurnsAO.bake(m.buf, 0, m.nv, m.ind, 0, m.ind.length, { joints: K.J, res: 30, k: 0.85 }); } catch (e) { /* AO is cosmetic */ } }
    const info = K.info;
    return {
      id, geo: m.geo(), nb: K.nb, J: K.J, parts: K.parts, seat: info.seat || [0, 1.3, 0.8], seatYaw: info.seatYaw || 0,
      lights: K.lights, muzzle: info.muzzle || [0, 1.6, 2.6], len: info.len || 5, w: info.w || 2.5, h: info.h || 3,
      wheelR: info.wheelR || 0.48, steerTilt: info.steerTilt === undefined ? 0.45 : info.steerTilt, driverScale: info.driverScale || 1,
      extra: info.extra || {}
    };
  }
};
function cartKit(lo) {
  const m = new BurnsMesh(8192); m.lo = !!lo;
  const J = new Float32Array(16 * 3);
  const K = { m, lo: !!lo, J, nb: CART_BONES.P0, parts: [], lights: [], info: {} };
  K.joint = (b, x, y, z) => { J[b * 3] = x; J[b * 3 + 1] = y; J[b * 3 + 2] = z; };
  // build geometry on bone b, joint-relative
  K.on = (b, build) => { m.push(); m.identity(); m.setBone(b); build(m); m.pop(); };
  // a new animated part: joint (x,y,z), animation fn(o, s), geometry build(m) around the joint
  K.part = (x, y, z, fn, build) => { const b = K.nb++; if (b > 15) throw new Error('cart: too many parts'); K.joint(b, x, y, z); K.parts.push({ b, fn }); K.on(b, build); return b; };
  K.light = (x, y, z, s, c, o) => { K.lights.push(Object.assign({ x, y, z, s, c, cc: burnsRGBf(c) }, o || {})); };
  // four wheels on bones 1..4 (axle along X). o: { x, zf, zr, r, w, col, rim, hub }
  K.wheels = (o) => {
    const r = o.r || 0.48, w = o.w || 0.36, spots = [[o.x, o.zf], [-o.x, o.zf], [o.x, o.zr], [-o.x, o.zr]];
    spots.forEach((p, i) => {
      const b = CART_BONES.FL + i; K.joint(b, p[0], r, p[1]);
      K.on(b, mm => cartWheel(mm, r, w, o.col || '#18181c', o.rim || '#c8ccd8', p[0] > 0 ? 1 : -1, K.lo));
    });
    K.info.wheelR = r;
  };
  // driver seat (hips point) + steering wheel on bone 5. o: { col, x, y, z, wheelY, wheelZ, tilt }
  K.seat = (o) => {
    const x = o.x || 0, y = o.y, z = o.z, col = o.col || '#2a1a2a';
    m.push(); m.color(col).shine(1);
    m.roundBox(x, y - 0.14, z - 0.05, 0.62, 0.16, 0.58, 0.07);            // cushion
    m.roundBox(x, y + 0.26, z - 0.36, 0.6, 0.7, 0.14, 0.06);             // backrest
    m.color(shade(col, -0.3)); m.roundBox(x, y - 0.32, z - 0.05, 0.5, 0.22, 0.5, 0.05);
    m.shine(0); m.pop();
    const wy = o.wheelY === undefined ? y + 0.42 : o.wheelY, wz = o.wheelZ === undefined ? z + 0.62 : o.wheelZ;
    m.push(); m.color('#2a2a30').shine(2); m.limb(x, wy - 0.05, wz + 0.05, x, y - 0.1, wz + 0.36, 0.035, 0.05, { seg: 6 }); m.shine(0); m.pop();
    K.joint(CART_BONES.STEER, x, wy, wz);
    K.on(CART_BONES.STEER, mm => {
      mm.color('#1a1a1e').shine(2); mm.push(); mm.tf(0, 0, 0, 0, Math.PI / 2, 0); mm.torus(0, 0, 0, 0.19, 0.03, { seg: K.lo ? 10 : 16, tseg: K.lo ? 4 : 6 }); mm.pop();
      mm.color('#c8ccd8').shine(3); mm.limb(-0.17, 0, 0, 0.17, 0, 0, 0.018, 0.018, { seg: 5 }); mm.ball(0, 0, 0, 0.05, { seg: 8, rings: 5 });
      mm.color(o.accent || '#ff4fd8', 1); mm.ball(0, 0, 0.03, 0.025, { seg: 6, rings: 4 }); mm.emissive(0).shine(0);
    });
    K.info.seat = [x, y, z]; K.info.steerTilt = o.tilt === undefined ? 0.45 : o.tilt;
  };
  return K;
}
// a rounded tyre + chrome hub around the origin (axle along X); side = +1 left / -1 right (hub cap faces out)
function cartWheel(m, r, w, col, rim, side, lo) {
  m.push(); m.tf(0, 0, 0, 0, 0, Math.PI / 2);
  const tr = Math.min(w * 0.5, r * 0.32);
  m.color(col).shine(1);
  if (lo) m.cyl(0, -w / 2, 0, r, r, w, 9, { smooth: true });
  else { m.push(); m.tf(0, 0, 0, 0, 0, 0, 1, w / (2 * tr), 1); m.torus(0, 0, 0, r - tr, tr, { seg: 16, tseg: 6 }); m.pop(); m.color('#202024'); m.cyl(0, -w * 0.42, 0, r - tr, r - tr, w * 0.84, 12, { caps: false }); }
  m.color(rim).shine(3); m.cyl(0, -w * 0.38, 0, r * 0.56, r * 0.56, w * 0.76, lo ? 7 : 12, { smooth: true });
  if (!lo) { m.color(shade(rim, -0.35)); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; m.limb(Math.sin(a) * r * 0.12, side * w * 0.39, Math.cos(a) * r * 0.12, Math.sin(a) * r * 0.48, side * w * 0.39, Math.cos(a) * r * 0.48, 0.03, 0.03, { seg: 4, ends: false }); } }
  m.color('#ff4fd8', 0.9); m.cyl(0, side > 0 ? w * 0.38 : -w * 0.42, 0, r * 0.14, r * 0.14, 0.04, lo ? 6 : 8, { smooth: true }); m.emissive(0);
  m.shine(0); m.pop();
}
// a row of glowing LED bulbs from a to b
function cartLeds(K, a, b, n, cols, size, lightEvery) {
  const m = K.m; size = size || 0.07;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1), c = Array.isArray(cols) ? cols[i % cols.length] : cols;
    const x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t), z = lerp(a[2], b[2], t);
    m.color(c, 1); m.ball(x, y, z, size, { seg: K.lo ? 4 : 6, rings: K.lo ? 3 : 4 });
    if (lightEvery && i % lightEvery === 0) K.light(x, y, z, size * 9, c, { led: 1 });
  }
  m.emissive(0);
}
// headlights + tail lights on a front face at z (zb at the back)
function cartLamps(K, x, y, z, zb, yb) {
  const m = K.m;
  for (const s of [1, -1]) {
    m.color('#2a2a30').shine(3); m.push(); m.tf(s * x, y, z, 0, Math.PI / 2, 0); m.roundCyl(0, -0.06, 0, 0.17, 0.08, 0.03); m.pop();
    m.color('#fff6d8', 1); m.push(); m.tf(s * x, y, z + 0.02, 0, Math.PI / 2, 0); m.cyl(0, 0, 0, 0.13, 0.13, 0.04, 10, { smooth: true }); m.pop();
    K.light(s * x, y, z + 0.1, 1.3, '#fff2c8', { head: 1 });
    m.color('#ff1a2a', 1); m.roundBox(s * x, yb === undefined ? y : yb, zb - 0.02, 0.32, 0.12, 0.06, 0.03);
    K.light(s * x, yb === undefined ? y : yb, zb - 0.1, 0.9, '#ff2a3a', { tail: 1 });
  }
  m.emissive(0).shine(0);
}
// puffy 3D heart (two lobes + a rounded point), centred at the origin, facing +Z; size ~ s
function cartHeart(m, s, lo) {
  const seg = lo ? 10 : 18, rings = lo ? 7 : 12;
  m.ellipsoid(-0.48 * s, 0.22 * s, 0, 0.56 * s, 0.56 * s, 0.42 * s, { seg, rings });
  m.ellipsoid(0.48 * s, 0.22 * s, 0, 0.56 * s, 0.56 * s, 0.42 * s, { seg, rings });
  m.push(); m.tf(0, 0.18 * s, 0, 0, Math.PI, 0); m.lathe([[0, -0.0], [0.72 * s, 0.02 * s], [0.66 * s, 0.38 * s], [0.4 * s, 0.72 * s], [0.12 * s, 0.94 * s], [0, 1.0 * s]], { seg, sz: 0.62 }); m.pop();
}
// googly cartoon eye looking +Z at (x,y,z), radius r
function cartEye(m, x, y, z, r, iris, lo, look) {
  m.color('#ffffff').shine(2); m.ball(x, y, z, r, { seg: lo ? 8 : 14, rings: lo ? 6 : 10 });
  const lx = (look && look[0]) || 0, ly = (look && look[1]) || 0;
  m.color(iris || '#1a1a2a').shine(3); m.ball(x + lx * r * 0.5, y + ly * r * 0.5 + r * 0.05, z + r * 0.72, r * 0.45, { seg: lo ? 6 : 10, rings: lo ? 4 : 7 });
  if (!lo) { m.color('#ffffff', 1); m.ball(x + lx * r * 0.5 + r * 0.16, y + r * 0.25, z + r * 0.98, r * 0.12, { seg: 6, rings: 4 }); m.emissive(0); }
  m.shine(0);
}
// a low skirt/platform chassis with LED strips; o: { len, w, y0, h, col, led }
function cartPlatform(K, o) {
  const m = K.m, L = o.len, W = o.w, y = o.y || 0.62, h = o.h || 0.5;
  m.color(o.col || '#1c1a22').shine(2); m.roundBox(0, y, 0, W, h, L, Math.min(0.2, h * 0.4)); m.shine(0);
  m.color('#0e0e12'); m.roundBox(0, y - h * 0.42, 0, W - 0.3, h * 0.3, L - 0.5, 0.08);
  if (o.led) { cartLeds(K, [W / 2 + 0.01, y, L / 2 - 0.3], [W / 2 + 0.01, y, -L / 2 + 0.3], K.lo ? 6 : 12, o.led, 0.06, 4); cartLeds(K, [-W / 2 - 0.01, y, L / 2 - 0.3], [-W / 2 - 0.01, y, -L / 2 + 0.3], K.lo ? 6 : 12, o.led, 0.06, 4); }
}

/* ---------------- 1. BASS VALENTINE: a sound truck crowned with a beating heart ---------------- */
CART_BUILD.heart = (K, C) => {
  const m = K.m, lo = K.lo, B = CART_BONES;
  K.wheels({ x: 1.12, zf: 1.7, zr: -1.75, r: 0.5, w: 0.42, rim: '#ffb0c8' });
  // body: glossy black sound truck
  m.color('#16121a').shine(2); m.roundBox(0, 1.0, -0.1, 2.5, 1.0, 5.0, 0.28); m.shine(0);
  m.color('#0a080c'); m.roundBox(0, 0.5, -0.1, 2.2, 0.3, 4.6, 0.1);
  // speaker cones along both flanks (chrome rim + pink glow ring)
  for (const s of [1, -1]) for (let i = 0; i < 3; i++) {
    const z = -1.6 + i * 1.25;
    m.push(); m.tf(s * 1.26, 1.05, z, s * Math.PI / 2, 0, 0);
    m.color('#2a2630').shine(2); m.roundCyl(0, -0.02, 0, 0.36, 0.06, 0.02);
    m.color('#0c0a10').shine(1); m.lathe([[0.3, 0.02], [0.18, -0.05], [0.06, -0.09], [0, -0.1]], { seg: lo ? 8 : 14 });
    m.color('#c8ccd8').shine(3); m.ball(0, -0.06, 0, 0.07, { seg: 8, rings: 5 });
    m.color(C.light, 0.9); m.push(); m.tf(0, 0.045, 0); m.torus(0, 0, 0, 0.36, 0.025, { seg: lo ? 10 : 18, tseg: 4 }); m.pop(); m.emissive(0).shine(0);
    m.pop();
  }
  // front grille with pink LEDs + lamps
  m.color('#2a2230').shine(3); m.roundBox(0, 1.0, 2.42, 1.9, 0.62, 0.12, 0.05); m.shine(0);
  for (let r = 0; r < 3; r++) cartLeds(K, [-0.8, 0.82 + r * 0.18, 2.5], [0.8, 0.82 + r * 0.18, 2.5], lo ? 5 : 9, ['#ff3a6a', '#ff9ac8'], 0.045, r === 1 ? 4 : 0);
  cartLamps(K, 0.95, 1.18, 2.42, -2.62, 1.05);
  // rear sub stack facing back
  m.color('#1e1a24').shine(1); m.roundBox(0, 2.0, -1.95, 2.2, 1.0, 0.9, 0.12); m.shine(0);
  for (const s of [1, -1]) { m.push(); m.tf(s * 0.55, 2.0, -2.42, Math.PI, 0, 0); m.color('#0c0a10'); m.lathe([[0.38, 0.0], [0.24, -0.08], [0.08, -0.12], [0, -0.13]], { seg: lo ? 8 : 14 }); m.color(C.light, 0.9); m.torus(0, 0.01, 0, 0.4, 0.03, { seg: lo ? 10 : 18, tseg: 4 }); m.emissive(0); m.pop(); }
  // deck rail with pink bulbs
  m.color('#3a2a3a').shine(2);
  for (const s of [1, -1]) m.limb(s * 1.15, 1.85, 1.6, s * 1.15, 1.85, -1.4, 0.035, 0.035, { seg: 5 });
  m.shine(0);
  cartLeds(K, [1.15, 1.9, 1.6], [1.15, 1.9, -1.4], lo ? 4 : 8, ['#ff3a6a', '#ffffff'], 0.05);
  cartLeds(K, [-1.15, 1.9, 1.6], [-1.15, 1.9, -1.4], lo ? 4 : 8, ['#ff3a6a', '#ffffff'], 0.05);
  // pedestal for the heart
  m.color('#c8ccd8').shine(3); m.roundCyl(0, 1.5, -0.7, 0.42, 0.55, 0.08); m.shine(0);
  // the heart (pulses to the beat)
  K.part(0, 3.15, -0.7, (o, s) => { const p = 1 + 0.07 * s.beat + 0.12 * s.fire; o.sx = p; o.sy = p; o.sz = p; o.yaw = Math.sin(s.t * 0.9) * 0.18; }, mm => {
    mm.color(C.col, 0.32).shine(2); cartHeart(mm, 1.35, lo); mm.shine(0);
    mm.color('#ffffff', 1); if (!lo) for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; mm.ball(Math.sin(a) * 1.25, Math.cos(a) * 0.95 + 0.15, 0.62, 0.05, { seg: 5, rings: 3 }); }
    mm.emissive(0);
  });
  K.light(0, 3.2, -0.7, 4.2, C.light, { big: 1 });
  K.seat({ y: 1.62, z: 1.15, col: '#5a1a2a', accent: '#ff3a6a' });
  Object.assign(K.info, { muzzle: [0, 3.0, -0.7], len: 5.2, w: 2.6, h: 4.5 });
};

/* ---------------- 2. GLITTERFIN: a mirror-tiled fish (ride on its back) ---------------- */
CART_BUILD.fish = (K, C) => {
  const m = K.m, lo = K.lo, disco = BURNS_ATLAS.pattern('disco');
  K.wheels({ x: 1.0, zf: 1.6, zr: -1.6, r: 0.44, w: 0.36, rim: '#c8d4ec' });
  cartPlatform(K, { len: 4.3, w: 2.1, y: 0.62, h: 0.42, col: '#1a1c28', led: ['#9ad8ff', '#ff6ad8'] });
  m.color('#c8ccd8').shine(3); m.roundCyl(0, 0.8, 0, 0.5, 0.35, 0.06); m.shine(0);
  // mirror-tiled body (sky reflections on every tile)
  const uvFn = (x, y, z) => [lerp(disco.u0, disco.u1, ((Math.atan2(x, z) / TAU + 1) * 3) % 1), lerp(disco.v0, disco.v1, ((y + 2) * 0.9) % 1)];
  m.color('#dfe6f4').shine(3); m.ellipsoid(0, 1.95, 0.1, 1.22, 1.1, 2.35, { seg: lo ? 12 : 22, rings: lo ? 8 : 14, uvFn }); m.shine(0);
  // pink lips + big eyes
  m.color('#ff4fb0').shine(2); m.push(); m.tf(0, 1.75, 2.38, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.28, 0.11, { seg: lo ? 10 : 16, tseg: lo ? 4 : 6, sy: 0.9 }); m.pop(); m.shine(0);
  for (const s of [1, -1]) cartEye(m, s * 0.8, 2.25, 1.55, 0.3, '#3a1a5a', lo, [s * 0.4, 0]);
  // fins: dorsal (body), side fins + tail (animated)
  m.color(C.col2).shine(2); m.push(); m.tf(0, 2.95, -0.4); m.ellipsoid(0, 0, 0, 0.12, 0.55, 0.9, { seg: 8, rings: 6 }); m.pop(); m.shine(0);
  for (const s of [1, -1]) K.part(s * 1.1, 1.75, 0.6, (o, st) => { o.roll = s * (0.25 + Math.sin(st.t * 6 + s) * 0.25 * (0.4 + st.speed)); }, mm => { mm.color(C.col2).shine(2); mm.ellipsoid(s * 0.32, -0.05, -0.2, 0.42, 0.06, 0.32, { seg: 8, rings: 5 }); mm.shine(0); });
  K.part(0, 1.95, -2.2, (o, st) => { o.yaw = Math.sin(st.t * (3 + st.speed * 7)) * (0.25 + 0.25 * st.speed); }, mm => {
    mm.color(C.col2).shine(2); mm.push(); mm.tf(0, 0, -0.25); mm.limb(0, 0, 0, 0, 0, -0.5, 0.32, 0.18, { seg: 8 }); mm.pop();
    for (const s of [1, -1]) { mm.push(); mm.tf(0, s * 0.42, -0.95, 0, s * 0.55, 0); mm.ellipsoid(0, 0, 0, 0.07, 0.62, 0.5, { seg: 8, rings: 6 }); mm.pop(); }
    mm.shine(0);
  });
  // a small mirror ball hanging under the chin (the beam comes out of it)
  m.color('#c8ccd8').shine(3); m.limb(0, 1.35, 1.9, 0, 1.15, 2.2, 0.02, 0.02, { seg: 4 }); m.ball(0, 0.98, 2.3, 0.22, { seg: lo ? 8 : 14, rings: lo ? 6 : 10, uvFn: (x, y, z) => [lerp(disco.u0, disco.u1, (x + 1) * 0.5 % 1), lerp(disco.v0, disco.v1, (y + 1) % 1)] }); m.shine(0);
  K.light(0, 1.0, 2.3, 2.2, '#bfe8ff', { big: 1 });
  K.seat({ y: 3.08, z: 0.05, col: '#ff4fb0', accent: '#9ad8ff', wheelY: 3.42, wheelZ: 0.7 });
  m.color('#c8ccd8').shine(3); m.limb(0, 2.6, 0.75, 0, 3.0, 0.92, 0.04, 0.04, { seg: 5 }); m.shine(0);
  Object.assign(K.info, { muzzle: [0, 1.0, 2.5], len: 5.0, w: 2.6, h: 3.4 });
};

/* ---------------- 3. CALAMARI INFERNO: a riveted copper octopus with flame-tipped arms ---------------- */
CART_BUILD.octo = (K, C) => {
  const m = K.m, lo = K.lo;
  K.wheels({ x: 1.1, zf: 1.7, zr: -1.7, r: 0.5, w: 0.4, rim: '#ffd06a', col: '#1a1410' });
  cartPlatform(K, { len: 4.8, w: 2.4, y: 0.66, h: 0.5, col: '#3a2418', led: ['#ff8a2a', '#ffd06a'] });
  // brass deck + boiler drum under the head
  m.color('#b8863a').shine(3); m.roundBox(0, 0.98, -0.3, 2.3, 0.14, 4.0, 0.06); m.shine(0);
  m.color('#5a3a22').shine(2); m.roundCyl(0, 1.0, -0.5, 0.95, 0.6, 0.12); m.shine(0);
  // the head (mantle): copper with rivets, porthole eyes; bobs gently
  const headB = K.part(0, 2.75, -0.55, (o, s) => { o.y = Math.sin(s.t * 2.2) * 0.06; o.pitch = -0.12 + Math.sin(s.t * 1.1) * 0.05; o.yaw = s.steer * 0.12; }, mm => {
    mm.color(C.col).shine(3); mm.ellipsoid(0, 0.35, -0.2, 1.25, 1.45, 1.35, { seg: lo ? 12 : 20, rings: lo ? 8 : 14 }); mm.shine(0);
    mm.color('#8a4a22'); mm.ellipsoid(0, -0.5, 0.05, 1.05, 0.45, 1.05, { seg: lo ? 10 : 18, rings: 6, phi0: Math.PI / 2 });
    if (!lo) { mm.color('#ffd06a').shine(3); for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, ph = 0.6 + r * 0.45; mm.ball(Math.sin(a) * Math.sin(ph) * 1.27, 0.35 + Math.cos(ph) * 1.47, -0.2 + Math.cos(a) * Math.sin(ph) * 1.37, 0.045, { seg: 5, rings: 3 }); } mm.shine(0); }
    for (const s of [1, -1]) {
      mm.color('#ffd06a').shine(3); mm.push(); mm.tf(s * 0.62, 0.05, 0.98, s * 0.5, Math.PI / 2 - 0.15, 0); mm.torus(0, 0, 0, 0.3, 0.07, { seg: lo ? 10 : 16, tseg: 5 }); mm.pop(); mm.shine(0);
      mm.color('#ff9a2a', 0.85); mm.ellipsoid(s * 0.62, 0.05, 0.98, 0.26, 0.26, 0.12, { seg: 10, rings: 6 }); mm.emissive(0);
      mm.color('#1a0a04'); mm.ellipsoid(s * 0.66, 0.05, 1.08, 0.1, 0.14, 0.05, { seg: 8, rings: 5 });
    }
    // a little chimney that puffs smoke
    mm.color('#3a2a20').shine(2); mm.limb(0, 1.6, -0.6, 0, 2.05, -0.75, 0.12, 0.14, { seg: 8 }); mm.shine(0);
  });
  K.light(0, 2.8, 0.45, 2.4, '#ff9a2a', { big: 1 });
  // eight arms: copper segments curling out, flame nozzle at each tip
  for (let i = 0; i < 8; i++) {
    const a = (i + 0.5) / 8 * TAU, ca = Math.sin(a), sa = Math.cos(a);
    const jx = ca * 1.05, jz = -0.5 + sa * 1.1, ph = i * 0.8;
    K.part(jx, 1.55, jz, (o, s) => { const w = Math.sin(s.t * 2.6 + ph); o.yaw = a; o.pitch = -0.15 + w * 0.18 - s.fire * 0.5; o.roll = Math.sin(s.t * 1.9 + ph) * 0.15; }, mm => {
      // in part space: arm points along local +Z (out from the body) and curls down
      const pts = [[0, 0, 0], [0, -0.15, 0.5], [0, -0.45, 0.95], [0, -0.8, 1.25], [0, -1.0, 1.45]];
      for (let k = 0; k < pts.length - 1; k++) { const r0 = 0.24 - k * 0.045, r1 = 0.24 - (k + 1) * 0.045; mm.color(k % 2 ? '#b8682e' : C.col).shine(3); mm.limb(pts[k][0], pts[k][1], pts[k][2], pts[k + 1][0], pts[k + 1][1], pts[k + 1][2], r0, r1, { seg: lo ? 6 : 10 }); }
      if (!lo) { mm.color('#ffd06a'); for (let k = 1; k < 4; k++) mm.ball(0, pts[k][1] - 0.14, pts[k][2] + 0.04, 0.06, { seg: 6, rings: 4 }); }
      mm.color('#3a2a20').shine(3); mm.limb(0, -1.0, 1.45, 0, -0.98, 1.68, 0.07, 0.09, { seg: 6 });
      mm.color('#ff8a2a', 1); mm.ball(0, -0.98, 1.72, 0.07, { seg: 6, rings: 4 }); mm.emissive(0).shine(0);
    });
  }
  cartLamps(K, 0.85, 0.95, 2.42, -2.42, 0.85);
  K.seat({ y: 1.45, z: 1.55, col: '#5a2a14', accent: '#ff8a2a' });
  void headB;
  Object.assign(K.info, { muzzle: [0, 1.6, 0.2], len: 5.2, w: 3.6, h: 4.3, extra: { arms: 8 } });
};

/* ---------------- 5. QUACKZILLA: a giant rubber duck (ride on its back) ---------------- */
CART_BUILD.duck = (K, C) => {
  const m = K.m, lo = K.lo;
  K.wheels({ x: 1.0, zf: 1.5, zr: -1.5, r: 0.42, w: 0.36, rim: '#ff8a1a' });
  // the bath-water skirt: glossy blue with bubbles
  m.color('#2a8ad8').shine(3); m.roundBox(0, 0.62, 0, 2.5, 0.42, 4.4, 0.2); m.shine(0);
  if (!lo) { m.color('#dff4ff', 0.25).shine(3); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; m.ball(Math.sin(a) * 1.25, 0.86, Math.cos(a) * 2.15, 0.09 + (i % 3) * 0.03, { seg: 6, rings: 4 }); } m.emissive(0).shine(0); }
  cartLeds(K, [1.26, 0.6, 1.9], [1.26, 0.6, -1.9], lo ? 5 : 10, ['#ffe24a', '#5ac8ff'], 0.055, 3);
  cartLeds(K, [-1.26, 0.6, 1.9], [-1.26, 0.6, -1.9], lo ? 5 : 10, ['#ffe24a', '#5ac8ff'], 0.055, 3);
  // body + upturned tail
  m.color(C.col).shine(2); m.ellipsoid(0, 1.55, -0.1, 1.32, 1.0, 2.05, { seg: lo ? 12 : 22, rings: lo ? 8 : 14 });
  m.push(); m.tf(0, 1.95, -1.95, 0, -0.75, 0); m.ellipsoid(0, 0, 0, 0.55, 0.32, 0.75, { seg: lo ? 8 : 12, rings: lo ? 6 : 8 }); m.pop(); m.shine(0);
  // wings (flap on boost)
  for (const s of [1, -1]) K.part(s * 1.18, 1.7, -0.2, (o, st) => { o.roll = s * (0.1 + Math.max(0, Math.sin(st.t * 14)) * 0.5 * Math.max(st.boost, st.air)); }, mm => { mm.color('#ffc81a').shine(2); mm.ellipsoid(s * 0.05, 0, 0, 0.18, 0.55, 0.95, { seg: lo ? 8 : 12, rings: lo ? 6 : 9 }); mm.shine(0); });
  // head: bobs, tilts, beak opens on fire
  K.part(0, 2.55, 1.35, (o, s) => { o.pitch = Math.sin(s.t * 3.1) * 0.08 - s.fire * 0.25; o.roll = Math.sin(s.t * 1.7) * 0.1; o.yaw = s.steer * 0.25; }, mm => {
    mm.color(C.col).shine(2); mm.ball(0, 0.65, 0.15, 0.92, { seg: lo ? 12 : 20, rings: lo ? 8 : 14 }); mm.shine(0);
    mm.color('#ff7a12').shine(2); mm.push(); mm.tf(0, 0.38, 1.0, 0, -0.1, 0); mm.ellipsoid(0, 0, 0.1, 0.48, 0.16, 0.45, { seg: lo ? 10 : 14, rings: lo ? 6 : 8 }); mm.ellipsoid(0, -0.14, 0.04, 0.4, 0.1, 0.38, { seg: lo ? 8 : 12, rings: 6 }); mm.pop(); mm.shine(0);
    for (const s of [1, -1]) cartEye(mm, s * 0.42, 0.95, 0.78, 0.2, '#1a1a2a', lo, [s * 0.3, 0.1]);
    // a tiny party hat
    mm.color('#ff4fd8').shine(2); mm.push(); mm.tf(0.15, 1.5, 0.05, 0, 0, -0.2); mm.lathe([[0.28, 0], [0.02, 0.62], [0, 0.64]], { seg: lo ? 8 : 12 }); mm.color('#ffffff'); mm.ball(0, 0.66, 0, 0.08, { seg: 6, rings: 4 }); mm.pop(); mm.shine(0);
  });
  K.light(0, 3.1, 2.3, 1.6, '#ffe24a', { big: 1 });
  K.seat({ y: 2.62, z: -0.25, col: '#ff8a1a', accent: '#5ac8ff', wheelY: 2.98, wheelZ: 0.38 });
  m.color('#c8ccd8').shine(3); m.limb(0, 2.45, 0.42, 0, 2.95, 0.5, 0.04, 0.04, { seg: 5 }); m.shine(0);
  Object.assign(K.info, { muzzle: [0, 3.0, 2.4], len: 4.6, w: 2.6, h: 4.2 });
};

/* ---------------- 6. PYRAMID SCHEME: a stepped laser pyramid on a sound truck ---------------- */
CART_BUILD.pyramid = (K, C) => {
  const m = K.m, lo = K.lo, gold = C.col2;
  K.wheels({ x: 1.12, zf: 1.75, zr: -1.75, r: 0.5, w: 0.42, rim: gold, col: '#141218' });
  m.color('#1a1622').shine(2); m.roundBox(0, 0.92, 0, 2.5, 0.8, 5.0, 0.22); m.shine(0);
  m.color('#0a080c'); m.roundBox(0, 0.48, 0, 2.2, 0.26, 4.6, 0.08);
  cartLamps(K, 0.95, 1.05, 2.48, -2.48, 1.0);
  // stepped pyramid: four tiers, gold edges with green LED lines
  const tiers = [[2.4, 3.5, 1.32], [1.9, 2.75, 1.82], [1.4, 2.0, 2.3], [0.9, 1.25, 2.76]];
  tiers.forEach(([w, d, y], i) => {
    m.color(i % 2 ? '#2a2236' : '#221c2c').shine(1); m.roundBox(0, y, -0.55, w, 0.5, d, 0.06); m.shine(0);
    m.color(gold).shine(3); m.roundBox(0, y + 0.26, -0.55, w + 0.04, 0.05, d + 0.04, 0.02); m.shine(0);
    if (!lo || i % 2 === 0) { cartLeds(K, [w / 2 + 0.02, y, -0.55 + d / 2 - 0.15], [w / 2 + 0.02, y, -0.55 - d / 2 + 0.15], lo ? 3 : 6, '#3aff8a', 0.05, i === 1 ? 2 : 0); cartLeds(K, [-w / 2 - 0.02, y, -0.55 + d / 2 - 0.15], [-w / 2 - 0.02, y, -0.55 - d / 2 + 0.15], lo ? 3 : 6, '#3aff8a', 0.05, i === 1 ? 2 : 0); }
    if (!lo) cartLeds(K, [-w / 2 + 0.15, y, -0.55 - d / 2 - 0.02], [w / 2 - 0.15, y, -0.55 - d / 2 - 0.02], 5, '#3aff8a', 0.05);
  });
  // speaker towers flanking the front of the pyramid
  for (const s of [1, -1]) {
    m.color('#141218').shine(1); m.roundBox(s * 0.95, 1.75, 1.55, 0.58, 1.0, 0.6, 0.06); m.shine(0);
    for (const yy of [1.5, 2.0]) { m.push(); m.tf(s * 0.95, yy, 1.86, 0, Math.PI / 2, 0); m.color('#0a080c'); m.lathe([[0.22, 0], [0.12, -0.05], [0, -0.06]], { seg: lo ? 8 : 12 }); m.color('#3aff8a', 0.8); m.torus(0, 0.005, 0, 0.23, 0.02, { seg: lo ? 8 : 14, tseg: 3 }); m.emissive(0); m.pop(); }
  }
  // the laser turret on top: spins; fires the sweep
  K.part(0, 3.08, -0.55, (o, s) => { o.yaw = s.t * (1.2 + s.fire * 9); }, mm => {
    mm.color(gold).shine(3); mm.roundCyl(0, 0, 0, 0.42, 0.22, 0.06); mm.shine(0);
    mm.color('#1a1622').shine(2); mm.ball(0, 0.42, 0, 0.36, { seg: lo ? 10 : 16, rings: lo ? 7 : 10, phi1: Math.PI * 0.55 }); mm.shine(0);
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; mm.color('#2a2a30').shine(3); mm.limb(Math.sin(a) * 0.2, 0.5, Math.cos(a) * 0.2, Math.sin(a) * 0.46, 0.55, Math.cos(a) * 0.46, 0.06, 0.05, { seg: 6 }); mm.color('#3aff8a', 1); mm.ball(Math.sin(a) * 0.5, 0.55, Math.cos(a) * 0.5, 0.06, { seg: 6, rings: 4 }); mm.emissive(0).shine(0); }
    mm.color('#7affb0', 1); mm.ball(0, 0.62, 0, 0.16, { seg: 8, rings: 6 }); mm.emissive(0);
  });
  K.light(0, 3.7, -0.55, 3.2, '#3aff8a', { big: 1 });
  K.seat({ y: 1.6, z: 1.45, col: '#2a2236', accent: '#3aff8a' });
  Object.assign(K.info, { muzzle: [0, 3.6, -0.55], len: 5.2, w: 2.6, h: 3.9 });
};

/* ---------------- drivers ---------------- */
const CartDrivers = {
  // the engine's rounded character model for a driver id (+ the scale it rides at)
  model(id) {
    const d = cartDriver(id);
    if (d.type === 'man') return { model: BurnsManModel.build(), scale: 0.165, man: true };
    if (d.type === 'brady') return { model: BurnsRig.model(BurnsRig.bradySpec('none')), scale: 1 };
    if (d.type === 'chinka') return { model: BurnsRig.model(BurnsRig.chinkaSpec()), scale: 1 };
    // riders keep both hands free for the wheel (no held props)
    const spec = BurnsRig.npcSpec(d.type, 3, { prop: null });
    return { model: BurnsRig.model(spec), scale: 1 };
  }
};
// extra driver animations (added to the engine's animation table under our own names)
(() => {
  const B = BURNS_BONES;
  const S = (P, b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  const legs = P => { S(P, B.THIGH_L, -1.45); S(P, B.SHIN_L, 1.45); S(P, B.THIGH_R, -1.45); S(P, B.SHIN_R, 1.45); };
  // k.steer -1..1 (right = +1), k.lean
  BURNS_ANIMS.cartDrive = (P, t, k) => {
    const st = (k && k.steer) || 0, bump = Math.sin(t * 11) * 0.02 * ((k && k.speed) || 0);
    S(P, B.HIPS, -0.08); S(P, B.CHEST, 0.12 + bump, 0, st * 0.18); S(P, B.HEAD, -0.06, -st * 0.35, st * 0.1);
    legs(P);
    S(P, B.UARM_L, -1.15 - st * 0.35, 0, 0.32); S(P, B.FARM_L, -0.75); S(P, B.UARM_R, -1.15 + st * 0.35, 0, -0.32); S(P, B.FARM_R, -0.75);
    S(P, B.HAIR, 0.3 + bump * 4);
  };
  // firing the signature weapon: punch the air, yell
  BURNS_ANIMS.cartFire = (P, t, k) => {
    BURNS_ANIMS.cartDrive(P, t, k); const u = Math.min(1, t * 6);
    S(P, B.UARM_R, -1.2 - 1.6 * u, 0.2, -0.2); S(P, B.FARM_R, -0.2); S(P, B.CHEST, 0.0, -0.25 * u); S(P, B.HEAD, -0.25 * u, -0.2);
    P.face = 1;
  };
  // getting hit: flail, dizzy face
  BURNS_ANIMS.cartHit = (P, t) => {
    const w = Math.sin(t * 22) * 0.45; legs(P);
    S(P, B.UARM_L, -2.0 + w, 0, 0.9); S(P, B.FARM_L, -0.5); S(P, B.UARM_R, -2.0 - w, 0, -0.9); S(P, B.FARM_R, -0.5);
    S(P, B.CHEST, -0.3, Math.sin(t * 9) * 0.3); S(P, B.HEAD, -0.3, Math.sin(t * 13) * 0.4, Math.sin(t * 7) * 0.2); S(P, B.HAIR, w);
    P.face = 2;
  };
  // celebrating: both arms up, bounce
  BURNS_ANIMS.cartCheer = (P, t) => {
    const s = Math.sin(t * 9), b = Math.abs(Math.sin(t * 6)); legs(P);
    S(P, B.UARM_L, -2.85 + s * 0.2, 0, 0.35); S(P, B.FARM_L, -0.25); S(P, B.UARM_R, -2.85 - s * 0.2, 0, -0.35); S(P, B.FARM_R, -0.25);
    S(P, B.CHEST, -0.15, s * 0.15); S(P, B.HEAD, -0.3 + b * 0.1, s * 0.3); P.y = b * 0.1; S(P, B.HAIR, b * 0.5);
    P.face = 3;
  };
  // sulking after losing: slumped, head down
  BURNS_ANIMS.cartSulk = (P, t) => {
    legs(P); S(P, B.UARM_L, -0.5, 0, 0.2); S(P, B.FARM_L, -0.6); S(P, B.UARM_R, -0.5, 0, -0.2); S(P, B.FARM_R, -0.6);
    S(P, B.CHEST, 0.45); S(P, B.HEAD, 0.45 + Math.sin(t * 0.8) * 0.05, Math.sin(t * 0.5) * 0.2); P.face = 2;
  };
})();

/* ---------------- posing: car bones + its driver riding it ---------------- */
const CART_TMP = { a: new Float32Array(12), b: new Float32Array(12) };
// fills car.bones (nb*12) from car.x,y,z,yaw,pitch,roll + parts; st = animation state
function cartPoseCar(M, car, st, out) {
  const A = CART_TMP.a, Bm = CART_TMP.b, J = M.J;
  BurnsM.a34Set(out, 0, car.x, car.y + (car.bob || 0), car.z, car.yaw, car.pitch || 0, car.roll || 0, car.scale || 1, car.scale || 1, car.scale || 1);
  // wheels: spin around X, the front pair steers
  const spin = car.wheelA || 0, steer = -(car.steerVis || 0) * 0.45;
  for (let i = 0; i < 4; i++) {
    const b = CART_BONES.FL + i;
    BurnsM.a34Set(A, 0, J[b * 3], J[b * 3 + 1] + (car.susp ? car.susp[i] : 0), J[b * 3 + 2], i < 2 ? steer : 0, spin, 0, 1, 1, 1);
    BurnsM.a34Mul(out, b * 12, out, 0, A, 0);
  }
  { const b = CART_BONES.STEER; BurnsM.a34Set(A, 0, J[b * 3], J[b * 3 + 1], J[b * 3 + 2], 0, -M.steerTilt, (car.steerVis || 0) * 1.6, 1, 1, 1); BurnsM.a34Mul(out, b * 12, out, 0, A, 0); }
  const o = CART_TMP.o || (CART_TMP.o = {});
  for (const p of M.parts) {
    o.yaw = 0; o.pitch = 0; o.roll = 0; o.sx = 1; o.sy = 1; o.sz = 1; o.x = 0; o.y = 0; o.z = 0;
    p.fn(o, st);
    BurnsM.a34Set(A, 0, J[p.b * 3] + o.x, J[p.b * 3 + 1] + o.y, J[p.b * 3 + 2] + o.z, o.yaw, o.pitch, o.roll, o.sx, o.sy, o.sz);
    BurnsM.a34Mul(out, p.b * 12, out, 0, A, 0);
  }
  void Bm;
  return out;
}
// driver bones in the car's frame: ch.compute() at the seat, then body · bone
function cartPoseDriver(car, M, ch, out) {
  const seat = M.seat, sc = car.driverScale || 1;
  ch.x = seat[0]; ch.z = seat[2]; ch.y = seat[1] - (car.driverMan ? 5.6 : 0.88) * sc; ch.yaw = M.seatYaw || 0; ch.scale = sc;
  ch.compute();
  for (let b = 0; b < ch.nb; b++) BurnsM.a34Mul(out, b * 12, car.bones, 0, ch.bones, b * 12);
  return out;
}
// a world point from a car-local point, using the posed body (pitch, roll, bob): for rendering
function cartLocalToWorld(car, x, y, z, out) {
  const B = car.bones; out = out || [0, 0, 0];
  if (!B || !B[0] && !B[1] && !B[2]) return cartCarPoint(car, x, y, z, out);
  return BurnsM.a34Pt(B, 0, x, y, z, out);
}
// the same from the simulation state alone (position + heading): for gameplay (weapon origins, drops)
function cartCarPoint(car, x, y, z, out) {
  out = out || [0, 0, 0]; const c = Math.cos(car.yaw), s = Math.sin(car.yaw);
  out[0] = car.x + x * c + z * s; out[1] = car.y + y; out[2] = car.z - x * s + z * c;
  return out;
}

/* ---------------- the crowd: baked poses of the engine's cast in shared groups ---------------- */
const CartCrowd = {
  looks: null,
  // 24 low-poly spectator looks (~500 triangles each): festival outfits, hats, tutus, LED necklaces, a cheering pose
  init() {
    if (this.looks) return this.looks;
    const rng = mulberry32(4242), faces = ['friendly', 'goofy', 'lashes', 'greeter', 'smug', 'kid'];
    this.looks = [];
    for (let i = 0; i < 24; i++) {
      const m = new BurnsMesh(1024); m.lo = true; m.setBone(0);
      this.spectator(m, rng, faces[i % faces.length], i);
      this.looks.push({ src: m });
    }
    return this.looks;
  },
  spectator(m, rng, face, i) {
    const skin = SKIN_TONES[Math.floor(rng() * SKIN_TONES.length)].base, hair = HAIR_COLORS[Math.floor(rng() * 8)].base;
    const top = rng.pick(BURNS_NEON.concat(['#f4f0e8', '#1a1a22', '#3a6ad8', '#e8a040'])), bot = rng.pick(['#1a1a22', '#3a4a6a', '#6a4a3a', '#e8e0d0', '#2a2a3a']);
    const h = 0.92 + rng() * 0.16, pose = i % 4, fem = rng() < 0.5;
    // legs + shoes
    m.color(bot); for (const s of [1, -1]) m.limb(s * 0.09, 0.82 * h, 0, s * 0.11, 0.08, 0.02, 0.075, 0.06, { seg: 5 });
    m.color(rng.pick(['#1a1a1e', '#f4f4f0', '#8a5a3a', '#ff4fd8'])); for (const s of [1, -1]) m.ellipsoid(s * 0.11, 0.05, 0.06, 0.07, 0.05, 0.12, { seg: 6, rings: 4 });
    // torso (shirt), optional tutu / fur coat
    m.color(top).shine(1); m.ellipsoid(0, 1.12 * h, 0, fem ? 0.17 : 0.2, 0.3 * h, 0.13, { seg: 8, rings: 6 }); m.shine(0);
    if (rng() < 0.3) { m.color(rng.pick(['#ff9ad8', '#9af0ff', '#ffe24a', '#c8a0ff'])); m.push(); m.tf(0, 0.86 * h, 0); m.lathe([[0.16, 0], [0.34, -0.1], [0.3, -0.14], [0.12, -0.04]], { seg: 9 }); m.pop(); }
    else if (rng() < 0.25) { m.color(rng.pick(['#e8dcc8', '#c87ab0', '#7ab0c8', '#2a2a2a'])); m.ellipsoid(0, 1.0 * h, 0, 0.26, 0.42 * h, 0.18, { seg: 8, rings: 6 }); }
    // arms: cheering up, waving, or one fist pumping
    m.color(rng() < 0.5 ? top : skin);
    const up = [[0.36, 1.78, 0.06], [0.34, 1.82, 0.02]], wave = [[0.4, 1.7, 0.1], [0.32, 1.0, 0.08]], pump = [[0.3, 1.86, 0.08], [0.3, 1.05, 0.12]];
    const hands = pose === 0 ? up : pose === 1 ? wave : pose === 2 ? pump : [[0.42, 1.55, 0.18], [0.42, 1.55, 0.18]];
    m.limb(0.19, 1.34 * h, 0, hands[0][0], hands[0][1] * h, hands[0][2], 0.05, 0.042, { seg: 5 });
    m.limb(-0.19, 1.34 * h, 0, -hands[1][0], hands[1][1] * h, hands[1][2], 0.05, 0.042, { seg: 5 });
    m.color(skin); m.ball(hands[0][0], hands[0][1] * h + 0.03, hands[0][2], 0.05, { seg: 5, rings: 4 }); m.ball(-hands[1][0], hands[1][1] * h + 0.03, hands[1][2], 0.05, { seg: 5, rings: 4 });
    // head, face, hair or hat, shades
    const hy = 1.58 * h;
    m.color(skin).shine(1); m.ball(0, hy, 0, 0.14, { seg: 9, rings: 7 }); m.shine(0);
    m.color('#ffffff'); m.decal(0, hy - 0.01, 0.135, 0.2, 0.2, BURNS_ATLAS.face(face));
    m.color(hair).shine(1); m.ellipsoid(0, hy + 0.04, -0.02, 0.15, 0.12, 0.15, { seg: 8, rings: 4, phi1: Math.PI * 0.55 });
    if (fem && rng() < 0.6) m.limb(0, hy, -0.08, 0, hy - 0.28, -0.12, 0.09, 0.06, { seg: 5 });
    m.shine(0);
    const hat = rng();
    if (hat < 0.2) { m.color(rng.pick(['#e8d8a0', '#8a5a3a', '#ff4fd8'])); m.push(); m.tf(0, hy + 0.09, 0); m.cyl(0, 0, 0, 0.3, 0.3, 0.02, 10, {}); m.lathe([[0.14, 0], [0.12, 0.13], [0, 0.15]], { seg: 8 }); m.pop(); }
    else if (hat < 0.35) { m.color(rng.pick(['#f4f0e8', '#ffb0d8', '#c8a0ff'])).ellipsoid(0, hy + 0.1, 0, 0.17, 0.12, 0.17, { seg: 8, rings: 5 }); }
    else if (hat < 0.45) { m.color('#ffd84a'); m.push(); m.tf(0, hy + 0.1, 0); m.lathe([[0.12, 0], [0.01, 0.3], [0, 0.31]], { seg: 7 }); m.pop(); }
    if (rng() < 0.55) { m.color('#14141a').shine(3); m.roundBox(0, hy + 0.02, 0.13, 0.22, 0.06, 0.03, 0.015); m.shine(0); }
    // a glowing LED necklace (shows at night)
    if (rng() < 0.6) { m.color(rng.pick(BURNS_NEON), 1); m.push(); m.tf(0, 1.36 * h, 0.01, 0, 0.25, 0); m.torus(0, 0, 0, 0.12, 0.018, { seg: 10, tseg: 3 }); m.pop(); m.emissive(0); }
  },
  // spectators [{x, z, y, yaw}] -> skinned groups (one draw call per group of up to 60)
  groups(spots, rng) {
    const looks = this.init(), out = [], cap = Math.min(60, BurnsGL.maxBones || 32);
    let G = null;
    for (const s of spots) {
      const L = looks[Math.floor(rng() * looks.length)];
      if (!G || G.objs.length >= cap || G.mesh.nv + L.src.nv > 60000) { if (G) G.finish(); G = new BurnsGroup(cap); G.crowd = true; out.push(G); }
      const o = G.addBuilt(L.src, {}, { x: s.x, y: s.y || 0, z: s.z, yaw: s.yaw, baseY: s.y || 0, baseYaw: s.yaw, ph: rng() * 10, hop: 0.5 + rng() * 0.8, scale: 0.95 + rng() * 0.12 });
      o.cx = s.x; o.cz = s.z;
    }
    if (G) G.finish();
    for (const g of out) { let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9; for (const o of g.objs) { x0 = Math.min(x0, o.x); z0 = Math.min(z0, o.z); x1 = Math.max(x1, o.x); z1 = Math.max(z1, o.z); } g.cx = (x0 + x1) / 2; g.cz = (z0 + z1) / 2; g.rad = Math.hypot(x1 - x0, z1 - z0) / 2 + 2; }
    return out;
  },
  // per frame: bounce, sway, jump when cars roar past (excite 0..1 per group)
  animate(G, t, excite) {
    for (const o of G.objs) {
      const e = excite || 0, b = Math.abs(Math.sin(t * (4 + o.hop * 3) + o.ph));
      o.y = o.baseY + b * (0.05 + 0.32 * e * o.hop);
      o.yaw = o.baseYaw + Math.sin(t * 1.3 + o.ph) * 0.25;
    }
  }
};

/* ---------------- small props drawn in groups: gift boxes, glow orbs, flags, mines ---------------- */
const CartPropMesh = {
  // a gift box with a ribbon and a big bow (gifting culture!)
  gift(m, col) {
    m.color(col).shine(2); m.roundBox(0, 0, 0, 1.1, 1.1, 1.1, 0.12); m.shine(0);
    m.color('#ffffff', 0.35); m.roundBox(0, 0, 0, 1.14, 1.14, 0.2, 0.05); m.roundBox(0, 0, 0, 0.2, 1.14, 1.14, 0.05);
    m.color('#ffe24a', 0.4).shine(2); m.ellipsoid(-0.2, 0.68, 0, 0.24, 0.14, 0.12, { seg: 8, rings: 5 }); m.ellipsoid(0.2, 0.68, 0, 0.24, 0.14, 0.12, { seg: 8, rings: 5 }); m.ball(0, 0.64, 0, 0.1, { seg: 6, rings: 4 });
    m.color('#ffffff', 0.9); m.decal(0, 0, 0.58, 0.5, 0.5, BURNS_ATLAS.icon('heart') || BURNS_ATLAS.white, { both: false }); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, 0, 0.58, 0.5, 0.5, BURNS_ATLAS.icon('heart') || BURNS_ATLAS.white); m.pop();
    m.emissive(0).shine(0);
  },
  orb(m) { m.color('#9afff0', 1); m.ball(0, 0, 0, 0.42, { seg: 10, rings: 8 }); m.color('#ffffff', 1); m.ball(0, 0, 0, 0.24, { seg: 8, rings: 6 }); m.emissive(0); },
  flag(m) {
    m.color('#c8ccd8').shine(3); m.limb(0, 0, 0, 0, 3.2, 0, 0.06, 0.05, { seg: 8 }); m.ball(0, 3.25, 0, 0.12, { seg: 8, rings: 6 }); m.shine(0);
    m.color('#ff4fd8', 0.5); m.push(); m.tf(0, 2.55, 0); m.box(0.55, 0, 0, 1.1, 0.75, 0.05); m.pop();
    m.color('#ffe24a', 0.8); m.push(); m.tf(0.55, 2.55, 0.03); m.decal(0, 0, 0, 0.5, 0.5, BURNS_ATLAS.icon('heart') || BURNS_ATLAS.white, { both: true }); m.pop(); m.emissive(0);
  },
  mine(m) { m.color('#ff8ac8').shine(2); m.ellipsoid(0, 0.2, 0, 0.45, 0.28, 0.45, { seg: 10, rings: 6, phi1: Math.PI * 0.55 }); m.shine(0); for (let i = 0; i < 9; i++) { const a = i * 2.4; m.color(BURNS_NEON[i % 7], 0.6); m.limb(Math.sin(a) * 0.3, 0.35, Math.cos(a) * 0.3, Math.sin(a) * 0.3 + 0.06, 0.38, Math.cos(a) * 0.3, 0.03, 0.03, { seg: 4 }); } m.emissive(0); },
  potty(m) {
    m.color('#3a7ad8').shine(2); m.roundBox(0, 1.2, 0, 1.2, 2.4, 1.2, 0.08); m.shine(0);
    m.color('#e8eef8'); m.roundBox(0, 2.48, 0, 1.3, 0.16, 1.3, 0.06);
    m.color('#2a5ab8'); m.roundBox(0, 1.15, 0.61, 0.9, 2.0, 0.04, 0.03);
    m.color('#ffffff', 0.4); m.decal(0, 1.9, 0.64, 0.4, 0.2, BURNS_ATLAS.white); m.emissive(0);
  },
  tumble(m) { m.color('#b8894a'); for (let i = 0; i < 7; i++) { m.push(); m.tf(0, 0, 0, i * 0.9, i * 0.7, i * 0.4); m.torus(0, 0, 0, 0.7, 0.05, { seg: 12, tseg: 3 }); m.pop(); } m.color('#8a6a3a'); m.ball(0, 0, 0, 0.45, { seg: 8, rings: 6 }); },
  shieldBall(m) { m.color('#dfe6f4', 0.25).shine(3); m.ball(0, 0, 0, 0.5, { seg: 12, rings: 8 }); m.shine(0).emissive(0); }
};
