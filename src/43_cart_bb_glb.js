/* ============================================================
   ART CART — Blender-made art cars (.glb) on the car rig.
   CartGLB loads models/<stem>.glb (showroom) and models/<stem>_lo.glb (race)
   through the engine's BurnsGLTF and hands CartModels a model in the same
   shape its procedural builders make, so the rest of the game can't tell.
   The procedural cars stay as fallbacks (no file, no network, no WebGL2).

   Rig convention (see docs/BURNS_GUIDE.md §6.8): root nodes named
     body · wheel_FL · wheel_FR · wheel_RL · wheel_RR · steer · part_<name>…
   are the bones (car faces +Z, +X is its left); empties `seat`, `muzzle`
   and `light_<n>` (extras: color, size, big/head/tail/led) are markers;
   extras on the scene or `body` node may set len, w, h, wheelR, steerTilt,
   driverScale, seatYaw. Part animations live here, in CART_GLB_PARTS.
   ============================================================ */
const CART_GLB = {   // car id -> file stem under models/ (hi: <stem>.glb, race: <stem>_lo.glb)
  heart: 'bass_valentine', fish: 'glitterfin', octo: 'calamari_inferno', dragon: 'sir_scorchalot', duck: 'quackzilla',
  pyramid: 'pyramid_scheme', cupcake: 'frosted_fury', galleon: 'dusty_doubloon', snail: 'turbo_escargot', jelly: 'jelly_jolt',
  shark: 'dune_chomper', whale: 'whale_of_a_time'
};
// part node name (without "part_") -> fn(o, s): the same pose functions as the procedural cars (43_cart_b_models.js,
// 43_cart_ba_cars.js), so a Blender part must be authored in the same local frame as the procedural K.part build.
const CART_GLB_PARTS = {
  heart: {
    heart: (o, s) => { const p = 1 + 0.07 * s.beat + 0.12 * s.fire; o.sx = p; o.sy = p; o.sz = p; o.yaw = Math.sin(s.t * 0.9) * 0.18; }
  },
  fish: {
    finL: (o, st) => { o.roll = 1 * (0.25 + Math.sin(st.t * 6 + 1) * 0.25 * (0.4 + st.speed)); },
    finR: (o, st) => { o.roll = -1 * (0.25 + Math.sin(st.t * 6 - 1) * 0.25 * (0.4 + st.speed)); },
    tail: (o, st) => { o.yaw = Math.sin(st.t * (3 + st.speed * 7)) * (0.25 + 0.25 * st.speed); }
  },
  octo: Object.assign({ head: (o, s) => { o.y = Math.sin(s.t * 2.2) * 0.06; o.pitch = -0.12 + Math.sin(s.t * 1.1) * 0.05; o.yaw = s.steer * 0.12; } },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = (i + 0.5) / 8 * TAU, ph = i * 0.8; return { ['arm' + i]: (o, s) => { const w = Math.sin(s.t * 2.6 + ph); o.yaw = a; o.pitch = -0.15 + w * 0.18 - s.fire * 0.5; o.roll = Math.sin(s.t * 1.9 + ph) * 0.15; } }; })),
  dragon: {
    neck: (o, s) => { o.pitch = -0.1 + Math.sin(s.t * 2.4) * 0.06 - s.fire * 0.45; o.yaw = s.steer * 0.3 + Math.sin(s.t * 0.7) * 0.08; },
    wingL: (o, st) => { const k = 0.35 + 0.6 * Math.max(st.boost, st.air); o.roll = 1 * (0.25 + Math.sin(st.t * (3 + 9 * k)) * 0.45 * k); },
    wingR: (o, st) => { const k = 0.35 + 0.6 * Math.max(st.boost, st.air); o.roll = -1 * (0.25 + Math.sin(st.t * (3 + 9 * k)) * 0.45 * k); },
    tail: (o, s) => { o.yaw = Math.sin(s.t * (2 + s.speed * 4)) * 0.35; }
  },
  duck: {
    wingL: (o, st) => { o.roll = 1 * (0.1 + Math.max(0, Math.sin(st.t * 14)) * 0.5 * Math.max(st.boost, st.air)); },
    wingR: (o, st) => { o.roll = -1 * (0.1 + Math.max(0, Math.sin(st.t * 14)) * 0.5 * Math.max(st.boost, st.air)); },
    head: (o, s) => { o.pitch = Math.sin(s.t * 3.1) * 0.08 - s.fire * 0.25; o.roll = Math.sin(s.t * 1.7) * 0.1; o.yaw = s.steer * 0.25; }
  },
  pyramid: { turret: (o, s) => { o.yaw = s.t * (1.2 + s.fire * 9); } },
  cupcake: { cherry: (o, s) => { const b = Math.abs(Math.sin(s.t * 7)) * (0.05 + 0.15 * s.speed); o.y = b; o.roll = Math.sin(s.t * 5) * 0.1; } },
  galleon: {
    sailFore: (o, s) => { o.sz = 0.75 + 0.5 * s.speed + Math.sin(s.t * 3 + 0.9) * 0.06; o.yaw = s.steer * 0.12; },
    sailMain: (o, s) => { o.sz = 0.75 + 0.5 * s.speed + Math.sin(s.t * 3 - 0.6) * 0.06; o.yaw = s.steer * 0.12; },
    flag: (o, s) => { o.yaw = Math.PI + Math.sin(s.t * 6) * 0.25; }
  },
  snail: {
    eyeL: (o, st) => { o.pitch = -0.3 + Math.sin(st.t * 4 + 1) * 0.18 - st.speed * 0.3; o.roll = 1 * (0.2 + Math.sin(st.t * 3.1 + 2) * 0.15); },
    eyeR: (o, st) => { o.pitch = -0.3 + Math.sin(st.t * 4 - 1) * 0.18 - st.speed * 0.3; o.roll = -1 * (0.2 + Math.sin(st.t * 3.1 - 2) * 0.15); },
    shell: (o, s) => { o.roll = Math.sin(s.t * 2.2) * 0.05; o.pitch = -s.boost * 0.06; }
  },
  jelly: Object.assign({ bell: (o, s) => { const p = Math.sin(s.t * 3.2); o.sy = 1 + p * 0.07 + s.fire * 0.15; o.sx = o.sz = 1 - p * 0.05 + s.fire * 0.08; } },
    ...[0, 1, 3, 4, 5].map(i => ({ ['tentacle' + i]: (o, s) => { o.pitch = Math.sin(s.t * 2.2 + i) * 0.25 + s.speed * 0.5; o.roll = Math.sin(s.t * 1.7 + i * 2) * 0.2; } }))),
  shark: {
    jaw: (o, s) => { o.pitch = 0.08 + s.fire * 0.75 + Math.max(0, Math.sin(s.t * 10)) * 0.05 * s.speed; },
    tail: (o, s) => { o.yaw = Math.sin(s.t * (3 + s.speed * 6)) * 0.4; }
  },
  whale: {
    flipperL: (o, st) => { o.roll = 1 * (-0.2 + Math.sin(st.t * 3 + 1) * 0.3); },
    flipperR: (o, st) => { o.roll = -1 * (-0.2 + Math.sin(st.t * 3 - 1) * 0.3); },
    tail: (o, s) => { o.pitch = Math.sin(s.t * (2 + s.speed * 3)) * 0.3; }
  }
};
// per-car points the race sim reads from M.extra (the procedural values; a glb's body extras.extra JSON overrides)
const CART_GLB_EXTRA = {
  octo: { arms: 8, armZ: 0.55, chimney: [0, 4.7, -0.15] },
  galleon: { cannons: [[1.6, 1.55, -0.7], [1.6, 1.55, 0.6], [-1.6, 1.55, -0.7], [-1.6, 1.55, 0.6]] },
  snail: { rockets: [[0.95, 1.9, -1.75], [-0.95, 1.9, -1.75]] }
};
const CartGLB = {
  rigs: {},          // id -> { hi, lo } (BurnsGLTF.rig results)
  models: {},        // id+':lo' -> model object (built once)
  ready: false,
  _p: null,
  base() { return 'models/'; },
  // bone index for a root node name: the fixed car bones, then the parts in sorted name order
  boneFn(partNames) {
    const fixed = { body: CART_BONES.BODY, wheel_FL: CART_BONES.FL, wheel_FR: CART_BONES.FR, wheel_RL: CART_BONES.RL, wheel_RR: CART_BONES.RR, steer: CART_BONES.STEER };
    return name => {
      if (fixed[name] !== undefined) return fixed[name];
      if (name.startsWith('part_')) { const i = partNames.indexOf(name.slice(5)); return i < 0 ? null : CART_BONES.P0 + i; }
      return null;
    };
  },
  partNames(doc) {
    const nodes = doc.json.nodes || [], out = [];
    for (const r of doc.roots) { const n = nodes[r].name || ''; if (n.startsWith('part_') && BurnsGLTF.subtreeHasMesh(doc, r)) out.push(n.slice(5)); }
    return out.sort();
  },
  build(doc, lo) {
    const parts = this.partNames(doc);
    if (CART_BONES.P0 + parts.length > 16) throw new Error('cart glb: too many parts');
    const R = BurnsGLTF.rig(doc, { bone: this.boneFn(parts), minBones: CART_BONES.P0 + parts.length, ao: !lo, aoRes: 30 });
    R.partNames = parts;
    return R;
  },
  preload() {
    if (this._p) return this._p;
    // no loader, no fetch, or a file:// page (fetch can't read files and logs an error): keep the procedural cars
    if (typeof BurnsGLTF === 'undefined' || typeof fetch !== 'function' || (typeof location !== 'undefined' && location.protocol === 'file:')) { this.ready = true; return (this._p = Promise.resolve()); }
    // models/index.json (written by tools/build.js) lists the files that exist, so nothing missing is requested
    this._p = fetch(this.base() + 'index.json').then(r => r.ok ? r.json() : []).catch(() => []).then(list => {
      const have = new Set(Array.isArray(list) ? list : []), jobs = [];
      for (const [id, stem] of Object.entries(CART_GLB)) {
        for (const lo of [false, true]) {
          const file = stem + (lo ? '_lo' : '') + '.glb';
          if (!have.has(file)) continue;
          jobs.push(BurnsGLTF.fetch(this.base() + file)
            .then(doc => { const R = this.build(doc, lo); (this.rigs[id] = this.rigs[id] || {})[lo ? 'lo' : 'hi'] = R; })
            .catch(e => { console.warn('cart: glb failed for ' + id + (lo ? ' (lo)' : '') + ': ' + (e && e.message || e)); }));
        }
      }
      return Promise.all(jobs);
    }).then(() => { this.ready = true; });
    return this._p;
  },
  // a model in CartModels.build's shape, or null (not loaded, or glb models switched off)
  model(id, lo) {
    if (typeof window !== 'undefined' && window.__cartNoGLB) return null;
    const rigs = this.rigs[id]; if (!rigs) return null;
    const R = lo ? (rigs.lo || rigs.hi) : (rigs.hi || rigs.lo); if (!R) return null;
    const key = id + (R === rigs.lo ? ':lo' : ':hi');
    if (this.models[key]) return this.models[key];
    const E = R.empties, X = R.extras || {}, b = R.bounds, fns = CART_GLB_PARTS[id] || {};
    const pt = (n, d) => E[n] ? [E[n].x, E[n].y, E[n].z] : d;
    const lights = [];
    for (const [n, e] of Object.entries(E)) {
      if (!n.startsWith('light')) continue;
      const x = e.extras || {}, c = x.color || '#ffffff', L = { x: e.x, y: e.y, z: e.z, s: +x.size || 1, c, cc: burnsRGBf(c) };
      for (const k of ['big', 'head', 'tail', 'led']) if (x[k]) L[k] = 1;
      lights.push(L);
    }
    const parts = R.partNames.map((n, i) => ({ b: CART_BONES.P0 + i, fn: fns[n] || (() => {}) }));
    const M = {
      id, geo: R.geo, nb: R.nb, J: R.J, parts, seat: pt('seat', [0, 1.3, 0.8]), seatYaw: +X.seatYaw || 0,
      lights, muzzle: pt('muzzle', [0, 1.6, 2.6]), len: +X.len || (b[5] - b[2]), w: +X.w || (b[3] - b[0]), h: +X.h || b[4],
      wheelR: +X.wheelR || 0.5, steerTilt: X.steerTilt === undefined ? 0.45 : +X.steerTilt, driverScale: +X.driverScale || 1,
      extra: (typeof X.extra === 'string' ? JSON.parse(X.extra) : X.extra) || CART_GLB_EXTRA[id] || {}, glb: true, lo: R === rigs.lo
    };
    this.models[key] = M;
    return M;
  }
};
if (typeof window !== 'undefined') {
  window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { CartGLB, CART_CARS, CartModels });
  // declared later in the bundle: getters, so they resolve when asked for (tests drive the app through these)
  for (const k of ['CART_TRACK_ORDER', 'CART_ARENAS', 'CART_CUPS', 'CartRaceScene', 'KartMenuScene']) Object.defineProperty(window.BRADY_BURNS, k, { get: () => eval(k), configurable: true });
}
