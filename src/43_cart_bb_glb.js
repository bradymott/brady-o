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
const CART_GLB = { heart: 'bass_valentine' };   // car id -> file stem under models/
// part node name (without "part_") -> fn(o, s), same contract as K.part in 43_cart_b_models.js
const CART_GLB_PARTS = {
  heart: {
    heart: (o, s) => { const p = 1 + 0.07 * s.beat + 0.12 * s.fire; o.sx = p; o.sy = p; o.sz = p; o.yaw = Math.sin(s.t * 0.9) * 0.18; }
  }
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
    const jobs = [];
    for (const [id, stem] of Object.entries(CART_GLB)) {
      const one = (lo) => BurnsGLTF.fetch(this.base() + stem + (lo ? '_lo' : '') + '.glb')
        .then(doc => { const R = this.build(doc, lo); (this.rigs[id] = this.rigs[id] || {})[lo ? 'lo' : 'hi'] = R; })
        .catch(e => { console.warn('cart: no glb for ' + id + (lo ? ' (lo)' : '') + ': ' + (e && e.message || e)); });
      jobs.push(one(false), one(true));
    }
    this._p = Promise.all(jobs).then(() => { this.ready = true; });
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
      extra: X.extra || {}, glb: true, lo: R === rigs.lo
    };
    this.models[key] = M;
    return M;
  }
};
if (typeof window !== 'undefined') {
  window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { CartGLB, CART_CARS, CartModels });
  // declared later in the bundle: getters, so they resolve when asked for (tests drive the app through these)
  for (const k of ['CART_TRACK_ORDER', 'CART_ARENAS', 'CartRaceScene', 'KartMenuScene']) Object.defineProperty(window.BRADY_BURNS, k, { get: () => eval(k), configurable: true });
}
