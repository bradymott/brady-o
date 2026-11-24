/* ============================================================
   BRADY GOES TO BURNING MAN — the Super Art Kart cars as Black Rock City's art cars
   The twelve Blender-made cars of Super Art Kart (assets/models/art-cart/<stem>.glb and <stem>_lo.glb) drive,
   park and give rides here, scaled up from kart size to art-car size (a small truck to a bus).
   - Reuse, not copies: the models load through Art Kart's own CartGLB.build (src/43_cart_bb_glb.js: the same bones,
     part animations, lights and baked AO), and are posed by its cartPoseCar (spinning wheels, the beating heart, the
     octopus arms with live fire, the swishing fish...). tools/build.js bundles 43_cart_a_data, 43_cart_b_models and
     43_cart_bb_glb into this app (read only: those files belong to the Art Kart agent) and ships the car files.
   - Placement: BurnsArtCars.mover / .vehicle / .park put a car on a world mover (api.mover) or a drivable art car
     (api.artCar), so colliders, riding on the deck, DRIVE, paths and the shadow pass all work as before. The mover
     carries no triangles of its own: the car is drawn here, one draw call (plus one in the shadow pass) per car.
   - Phone budget: models load lazily, only for cars near the camera, race (_lo, 6-7k triangles) by default and the
     showroom model (26-30k) only up close on the tiers that afford it; loaded models, full-detail cars and drawn
     cars are capped per tier (BURNS_ARTCARS.TIER), unused models are freed, and leaving a world frees its cars.
   - Fallback: on file:// pages (no fetch) or without the Art Kart modules the procedural BurnsProps.artcar is built
     into the mover instead, exactly as before.
   See docs/BURNS_GUIDE.md §8.3.
   ============================================================ */
const BURNS_ARTCARS = {
  // stem -> Art Kart car id, scale (kart -> art car), rest bounds [x0, z0, x1, z1, top] in kart metres, glow colour.
  // Scales put every car at about 8-11 m long (bounds include fins, tails and wings).
  CARS: {
    bass_valentine:   { id: 'heart',   s: 1.6,  b: [-1.33, -2.93, 1.33, 2.87, 3.46], col: '#ff3a6a' },
    calamari_inferno: { id: 'octo',    s: 1.5,  b: [-1.31, -2.75, 1.31, 3.59, 4.37], col: '#ff8a2a' },
    dune_chomper:     { id: 'shark',   s: 1.4,  b: [-1.92, -4.1, 1.92, 3.07, 3.17], col: '#38c8ff' },
    dusty_doubloon:   { id: 'galleon', s: 1.45, b: [-1.89, -3.18, 1.89, 3.68, 5.19], col: '#ffb84a' },
    frosted_fury:     { id: 'cupcake', s: 1.85, b: [-1.15, -2.22, 1.15, 2.13, 3.9], col: '#ff9ad8' },
    glitterfin:       { id: 'fish',    s: 1.5,  b: [-1.89, -3.66, 1.89, 2.72, 3.69], col: '#9ad8ff' },
    jelly_jolt:       { id: 'jelly',   s: 1.7,  b: [-1.64, -2.38, 1.76, 2.38, 4.25], col: '#5af2ff' },
    pyramid_scheme:   { id: 'pyramid', s: 1.65, b: [-1.33, -2.81, 1.33, 2.83, 3.12], col: '#3aff8a' },
    quackzilla:       { id: 'duck',    s: 1.7,  b: [-1.37, -2.43, 1.37, 2.71, 4.44], col: '#ffe24a' },
    sir_scorchalot:   { id: 'dragon',  s: 1.25, b: [-2.83, -4.88, 2.83, 3.87, 4.18], col: '#7aff5a' },
    turbo_escargot:   { id: 'snail',   s: 1.6,  b: [-1.2, -2.75, 1.2, 3.16, 3.91], col: '#b07aff' },
    whale_of_a_time:  { id: 'whale',   s: 1.5,  b: [-2.45, -4.22, 2.45, 2.99, 3.73], col: '#4ab0ff' }
  },
  // per graphics tier: hiD full-detail distance (m), maxHi full-detail cars at once, maxLo race models kept loaded,
  // maxVis cars drawn at once (nearest first), drawD draw distance, shadowD shadow casters within this of the camera
  TIER: {
    ultra:  { hiD: 30, maxHi: 3, maxLo: 12, maxVis: 9, drawD: 320, shadowD: 90 },
    high:   { hiD: 24, maxHi: 2, maxLo: 10, maxVis: 7, drawD: 280, shadowD: 75 },
    medium: { hiD: 16, maxHi: 1, maxLo: 7, maxVis: 5, drawD: 230, shadowD: 55 },
    low:    { hiD: 0, maxHi: 0, maxLo: 5, maxVis: 4, drawD: 170, shadowD: 0 },
    legacy: { hiD: 0, maxHi: 0, maxLo: 4, maxVis: 3, drawD: 150, shadowD: 0 }
  },
  HEAD_COL: [1, 0.86, 0.62],
  LOAD_PAD: 90,        // a race model starts loading this far beyond the draw distance
  HI_PAD: 10,          // ...and a full-detail model this far beyond hiD
  KEEP_LO: 20, KEEP_HI: 8   // seconds an unused model stays loaded
};

const BurnsArtCars = {
  models: {},          // file key (<stem> | <stem>_lo) -> { key, stem, hi, state: 'loading'|'ready'|'failed', M, cols, used, ms, bytes }
  cars: [],            // every live car (all scenes): { g, stem, D, S, mv, veh, bones, st, car, lit, ... }
  inflight: 0,
  _index: null,
  stats: { loads: 0, frees: 0, failed: 0, drawn: 0, hi: 0, shadow: 0, tris: 0 },
  tier() { const t = typeof BurnsGL !== 'undefined' && BurnsGL.tier; return BURNS_ARTCARS.TIER[t] || BURNS_ARTCARS.TIER.medium; },
  // can the Art Kart models be loaded here? (the modules are bundled, fetch works, the page isn't a file)
  canLoad() {
    if (typeof window !== 'undefined' && window.__burnsNoArtKart) return false;
    if (typeof BurnsGLTF === 'undefined' || typeof CartGLB === 'undefined' || typeof cartPoseCar !== 'function' || typeof fetch !== 'function') return false;
    return !(typeof location !== 'undefined' && location.protocol === 'file:');
  },
  index() {
    if (this._index) return this._index;
    return (this._index = fetch('models/index.json').then(r => r.ok ? r.json() : []).catch(() => []).then(l => new Set(Array.isArray(l) ? l : [])));
  },

  /* ---------- placing cars ---------- */
  // a car on a world mover the world moves itself (mv.x/z/yaw each step): cruisers, parade cars. o: { x, z, yaw, lit }
  mover(api, stem, o) {
    o = o || {};
    const mv = api.mover(this.build(stem, o), {});
    mv.x = o.x || 0; mv.z = o.z || 0; mv.yaw = o.yaw || 0; mv.y = api.world.height(mv.x, mv.z);
    mv.px = mv.x; mv.pz = mv.z; mv.py = mv.y; mv.pyaw = mv.yaw;
    return this.track(api.world.game, stem, mv, null, o);
  },
  // a parked car (a mover that never moves): walk round it, climb on it
  park(api, stem, x, z, yaw, o) { return this.mover(api, stem, Object.assign({}, o || {}, { x, z, yaw })); },
  // a drivable art car (api.artCar: DRIVE, honk, flames, an optional autopilot path). o: the usual artCar options
  vehicle(api, stem, o) {
    o = o || {};
    const v = api.artCar(Object.assign({}, o, { build: this.build(stem, o) }));
    v.y = api.world.height(v.x, v.z); v.syncMover();
    const c = this.track(api.world.game, stem, v.mv, v, o);
    v.artKart = c;
    return v;
  },
  // the mover's build: colliders and seat at the car's scaled size; no triangles when the model will be drawn here,
  // the procedural art car (sized to match) when it can't be
  build(stem, o) {
    const D = BURNS_ARTCARS.CARS[stem], S = D.s, b = D.b;
    const L = (b[3] - b[1]) * S, W = (b[2] - b[0]) * S, zc = (b[1] + b[3]) / 2 * S, top = b[4] * S;
    return m => {
      let lights = [];
      if (!this.canLoad()) {
        m.push(); m.tf(0, 0, zc); const r = BurnsProps.artcar(m, { len: L, w: Math.min(4.4, W), col: o.col || shade(D.col, -0.45), sculpt: D.col }); m.pop();
        lights = (r.lights || []).map(q => Object.assign({}, q, { z: (q.z || 0) + zc }));
      }
      // until the race model arrives: one box for the body and one for the top (refined from the model on load)
      const cols = [{ t: 'box', x: 0, z: zc, hx: W * 0.4, hz: L * 0.45, y0: 0, y1: top * 0.45, cover: true }, { t: 'box', x: 0, z: zc, hx: W * 0.25, hz: L * 0.3, y0: top * 0.45, y1: top * 0.95 }];
      // seat: Art Kart's driver hip point (hips about 0.88 m above Brady's feet when sitting), scaled
      const seat = this.seatOf(stem);
      return { cols, lights, top: top * 0.45, len: L, w: Math.min(W, 4.8), seat, poofers: [[W * 0.32, top * 0.55, b[1] * S * 0.6], [-W * 0.32, top * 0.55, b[1] * S * 0.6]], artKart: stem };
    };
  },
  // Art Kart's seat empties, measured from the race models (kart metres); refined from the loaded model if it differs
  SEATS: { heart: [-0.6, 1.62, -1.25], octo: [0, 1.6, -1.75], shark: [0, 2.55, 0.3], galleon: [0, 3.02, -1.85], cupcake: [0, 1.12, -1.3], fish: [0, 3.08, 0.05],
    jelly: [0, 1.12, -0.4], pyramid: [0, 1.62, -1.75], duck: [0, 2.48, -0.3], dragon: [0, 2.5, -0.25], snail: [0, 1.86, 0.95], whale: [0, 3.11, -0.55] },
  seatOf(stem, M) {
    const D = BURNS_ARTCARS.CARS[stem], S = D.s, s = (M && M.seat) || this.SEATS[D.id] || [0, 1.3, 0];
    return [s[0] * S, s[1] * S - 0.88, s[2] * S];
  },
  track(g, stem, mv, veh, o) {
    const D = BURNS_ARTCARS.CARS[stem];
    const c = {
      g, stem, D, S: D.s, mv, veh, o, lit: o.lit === undefined ? 1 : (o.lit ? 1 : 0), litK: o.lit === false ? 0 : 1,
      bones: new Float32Array(16 * 12), car: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, scale: D.s, wheelA: 0, steerVis: 0, bob: 0 },
      st: { t: Math.random() * 10, speed: 0, steer: 0, fire: 0, boost: 0, air: 0, beat: 0, night: 0 },
      M: null, lod: null, d2: 1e9, inView: false, drawn: false, colsSet: false, lastT: null, px: mv.x, pz: mv.z, pyaw: mv.yaw,
      rad: Math.hypot(D.b[2] - D.b[0], D.b[3] - D.b[1]) * 0.5 * D.s
    };
    this.cars.push(c);
    this.hook(g);
    // start fetching the race model now, so it is usually there by the time the world fades in
    if (this.canLoad()) this.load(stem, false);
    return c;
  },
  // set a car dark or lit (World 10's sleeping cars): the lights, LEDs and glow fade over a second
  setLit(c, on) { if (c) c.lit = on ? 1 : 0; },

  /* ---------- models ---------- */
  load(stem, hi) {
    const key = stem + (hi ? '' : '_lo');
    let E = this.models[key];
    if (E) return E;
    E = this.models[key] = { key, stem, hi: !!hi, state: 'loading', M: null, cols: null, used: performance.now(), ms: 0 };
    if (!this.canLoad()) { E.state = 'failed'; return E; }
    this.inflight++;
    this.index().then(have => {
      let file = key + '.glb';
      if (have.has(file + '.gz') && BurnsGLTF.canInflate()) file += '.gz';
      else if (!have.has(file)) throw new Error('not in this build: ' + file);
      return BurnsGLTF.fetch('models/' + file);
    }).then(doc => {
      if (E.dropped) return;
      const t0 = performance.now(), D = BURNS_ARTCARS.CARS[stem], R = CartGLB.build(doc, !hi);
      E.M = this.modelOf(D.id, R, !hi);
      E.ms = Math.round(performance.now() - t0);
      E.tris = R.tris || (E.M.geo.count / 3); E.nv = R.nv || 0;
      E.bytes = (E.M.geo.data ? E.M.geo.data.byteLength : 0) + (E.M.geo.idx ? E.M.geo.idx.byteLength : 0);
      if (!hi) E.cols = this.collidersOf(E.M);
      E.state = 'ready'; E.used = performance.now(); this.stats.loads++;
    }).catch(e => { E.state = 'failed'; this.stats.failed++; console.warn('art cars: ' + key + ': ' + (e && e.message || e)); })
      .then(() => { this.inflight--; });
    return E;
  },
  // Art Kart's model object (as CartGLB.model makes it) from a rig result
  modelOf(id, R, lo) {
    const E = R.empties, X = R.extras || {}, b = R.bounds, fns = (X.rigV && CART_GLB_PARTS[id + ':' + X.rigV]) || CART_GLB_PARTS[id] || {};
    const pt = (n, d) => E[n] ? [E[n].x, E[n].y, E[n].z] : d;
    const lights = [];
    for (const [n, e] of Object.entries(E)) {
      if (!n.startsWith('light')) continue;
      const x = e.extras || {}, c = x.color || '#ffffff', L = { x: e.x, y: e.y, z: e.z, s: +x.size || 1, c, cc: burnsRGBf(c) };
      for (const k of ['big', 'head', 'tail', 'led']) if (x[k]) L[k] = 1;
      lights.push(L);
    }
    const parts = R.partNames.map((n, i) => ({ b: CART_BONES.P0 + i, fn: fns[n] || (() => {}) }));
    return {
      id, geo: R.geo, nb: R.nb, J: R.J, parts, seat: pt('seat', null), seatYaw: +X.seatYaw || 0, lights, muzzle: pt('muzzle', [0, 1.6, 2.6]),
      len: +X.len || (b[5] - b[2]), w: +X.w || (b[3] - b[0]), h: +X.h || b[4], wheelR: +X.wheelR || 0.5,
      steerTilt: X.steerTilt === undefined ? 0.45 : +X.steerTilt, extra: (typeof X.extra === 'string' ? JSON.parse(X.extra) : X.extra) || CART_GLB_EXTRA[id] || {}, glb: true, lo
    };
  },
  // colliders from the race model at rest: a height grid over the footprint (3 bands across, 0.4 m rows), rows of
  // about the same height merged into one box. Kart metres; scaled per car when applied.
  collidersOf(M) {
    const G = M.geo, J = M.J, f32 = new Float32Array(G.data), u8 = new Uint8Array(G.data), nv = G.data.byteLength / 24;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    const P = new Float32Array(nv * 3);
    for (let i = 0; i < nv; i++) {
      const b = u8[i * 24 + 15] & 63, x = f32[i * 6] + J[b * 3], y = f32[i * 6 + 1] + J[b * 3 + 1], z = f32[i * 6 + 2] + J[b * 3 + 2];
      P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
      if (y < 0.12) continue;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
    }
    if (!(x1 > x0 && z1 > z0)) return null;
    const NX = 3, dz = 0.4, NZ = Math.max(1, Math.ceil((z1 - z0) / dz)), H = [0, 1, 2].map(() => new Float32Array(NZ));
    for (let i = 0; i < nv; i++) {
      const y = P[i * 3 + 1]; if (y < 0.12) continue;
      const a = Math.min(NX - 1, Math.floor((P[i * 3] - x0) / (x1 - x0) * NX)), j = Math.min(NZ - 1, Math.floor((P[i * 3 + 2] - z0) / dz));
      if (a >= 0 && j >= 0 && y > H[a][j]) H[a][j] = y;
    }
    const out = [], bx = i => x0 + (x1 - x0) * i / NX;
    for (let a = 0; a < NX; a++) for (let j = 0; j < NZ;) {
      if (H[a][j] <= 0) { j++; continue; }
      let k = j, hi = H[a][j], lo = H[a][j];
      while (k + 1 < NZ && H[a][k + 1] > 0 && Math.max(hi, H[a][k + 1]) - Math.min(lo, H[a][k + 1]) < 0.6) { k++; hi = Math.max(hi, H[a][k]); lo = Math.min(lo, H[a][k]); }
      const za = z0 + j * dz, zb = Math.min(z1, z0 + (k + 1) * dz);
      out.push({ x: (bx(a) + bx(a + 1)) / 2, z: (za + zb) / 2, hx: (bx(a + 1) - bx(a)) / 2, hz: (zb - za) / 2, y1: hi });
      j = k + 1;
    }
    return out;
  },
  // swap a car's placeholder colliders for the model's (the mover's dynamic colliders, as addMover makes them)
  applyCols(c, cols) {
    const S = c.S, mv = c.mv;
    mv.dcols = cols.map(q => ({ t: 'box', mover: mv, lx: q.x * S, lz: q.z * S, lyaw: 0, ly0: 0, ly1: q.y1 * S, hx: q.hx * S, hz: q.hz * S, x: 0, z: 0, yaw: 0, y0: 0, y1: q.y1 * S, cover: q.y1 * S > 1.2 }));
    c.colsSet = true;
  },
  free(E) {
    E.dropped = true;
    if (E.M && E.M.geo) try { BurnsGL.freeGeo(E.M.geo); } catch (e) { /* ignore */ }
    for (const c of this.cars) if (c.M === E.M) { c.M = null; c.lod = null; }
    delete this.models[E.key];
    if (E.state === 'ready') this.stats.frees++;
  },
  memory() {
    let bytes = 0, lo = 0, hi = 0;
    for (const E of Object.values(this.models)) if (E.state === 'ready') { bytes += E.bytes || 0; if (E.hi) hi++; else lo++; }
    // the JS copy (kept for context loss) and the GPU buffers: twice the geometry
    return { lo, hi, mb: +(bytes * 2 / 1048576).toFixed(2) };
  },

  /* ---------- per frame (from the play scene's light gathering, before both render passes) ---------- */
  frame(g) {
    const list = this.cars; if (!list.length) return;
    const R = g.R, cam = g.cam, T = this.tier(), now = performance.now(), mine = this._mine || (this._mine = []);
    mine.length = 0;
    const W = g.world;
    for (const c of list) if (c.g === g && !c.gone) mine.push(c);
    if (!mine.length) return;
    // cars whose tile was freed go away with it
    if (!this._chk || now - this._chk > 2000) { this._chk = now; for (const c of mine) if (W.movers.indexOf(c.mv) < 0) c.gone = true; this.cars = this.cars.filter(c => !c.gone); }
    const night = R ? (R.night || 0) : 0, t = g.time, P = R && R.planes;
    const beat = Math.pow(Math.max(0, Math.sin(t * 2.1 * Math.PI)), 6);
    const can = this.canLoad();
    // distances, view test, movement
    for (const c of mine) {
      if (c.gone) continue;
      const mv = c.mv, car = c.car;
      const dt = c.lastT === null ? 0 : Math.max(0, Math.min(0.25, t - c.lastT)); c.lastT = t;
      const dx = mv.x - c.px, dz = mv.z - c.pz; c.px = mv.x; c.pz = mv.z;
      const dist = Math.hypot(dx, dz), fwd = dx * Math.sin(mv.yaw) + dz * Math.cos(mv.yaw);
      const sp = c.veh ? c.veh.speed : (dt > 0 ? (fwd >= 0 ? 1 : -1) * dist / dt : 0);
      c.speed = BurnsM.damp(c.speed || 0, sp, 6, dt || 0.016);
      const turn = dt > 0 ? BurnsM.wrap(mv.yaw - c.pyaw) / dt : 0; c.pyaw = mv.yaw;
      car.x = mv.x; car.y = mv.y; car.z = mv.z; car.yaw = mv.yaw; car.scale = c.S;
      car.steerVis = BurnsM.damp(car.steerVis, clamp(turn * 2.5, -1, 1), 4, dt || 0.016);
      car.wheelA += c.speed * dt / ((c.M ? c.M.wheelR : 0.48) * c.S);
      const st = c.st; st.t += dt; st.speed = clamp(Math.abs(c.speed) / 14, 0, 1.2); st.steer = car.steerVis; st.beat = beat * c.litK; st.night = night;
      st.fire = c.veh && c.veh.flameT > 0 ? 1 : BurnsM.damp(st.fire, 0, 3, dt || 0.016);
      c.litK = BurnsM.damp(c.litK, c.lit, 1.6, dt || 0.016);
      const cx = mv.x - cam.x, cz = mv.z - cam.z; c.d2 = cx * cx + cz * cz;
      c.inView = !!P && c.d2 < T.drawD * T.drawD && BurnsM.sphereVisible(P, mv.x, mv.y + c.D.b[4] * c.S * 0.5, mv.z, c.rad + 1);
      c.drawn = false;
    }
    if (!can) return;
    // which cars draw (nearest first, capped), which of them get the full-detail model
    const order = this._order || (this._order = []); order.length = 0;
    for (const c of mine) if (!c.gone && c.d2 < T.drawD * T.drawD) order.push(c);
    order.sort((a, b) => a.d2 - b.d2);
    let vis = 0, hiN = 0;
    for (const c of order) {
      // a car's race model is wanted while it is drawable or near it; the full-detail one only close up
      const lo = this.load(c.stem, false); lo.used = now;
      const wantHi = T.maxHi > 0 && hiN < T.maxHi && c.d2 < (c.lod === 'hi' ? (T.hiD * 1.2) ** 2 : T.hiD * T.hiD);
      let M = null, lod = null;
      if (wantHi) { hiN++; const hi = this.load(c.stem, true); hi.used = now; if (hi.state === 'ready') { M = hi.M; lod = 'hi'; } }
      if (!M && lo.state === 'ready') { M = lo.M; lod = 'lo'; }
      if (lo.state === 'ready' && !c.colsSet && lo.cols) this.applyCols(c, lo.cols);
      if (c.veh && M && M.seat && !c.seatSet) { c.veh.seat = this.seatOf(c.stem, M); c.seatSet = true; }
      c.M = M; c.lod = lod;
      if (M && (c.inView || c.d2 < T.shadowD * T.shadowD) && vis < T.maxVis) {
        if (c.inView) vis++;
        cartPoseCar(M, c.car, c.st, c.bones);
        c.drawn = true;
      }
    }
    // warm up the race models of cars just beyond the draw distance (so they don't pop in when you turn round)
    const pad = (T.drawD + BURNS_ARTCARS.LOAD_PAD) ** 2;
    for (const c of mine) if (!c.gone && c.d2 >= T.drawD * T.drawD && c.d2 < pad) { const E = this.models[c.stem + '_lo']; if (E) E.used = now; else if (this.inflight < 2) this.load(c.stem, false); }
    // lights: the big feature light and the headlights' pool, at dusk and night, for the cars near the camera
    if (night > 0.15) for (const c of mine) {
      if (!c.drawn || c.d2 > 70 * 70 || !c.M) continue;
      const k = night * c.litK; if (k < 0.05) continue;
      const big = c.M.lights.find(L => L.big), car = c.car, S = c.S, s = Math.sin(car.yaw), co = Math.cos(car.yaw);
      if (big) g.pointLight(car.x + (big.x * co + big.z * s) * S, car.y + big.y * S, car.z + (-big.x * s + big.z * co) * S, (7 + big.s) * S, big.cc, 0.9 * k);
      else g.pointLight(car.x, car.y + c.D.b[4] * S * 0.7, car.z, 9 * S, burnsRGBf(c.D.col), 0.8 * k);
      const f = (c.D.b[3] * S) + 5;
      if (Math.abs(c.speed) > 0.3 || c.veh) g.pointLight(car.x + s * f, car.y + 1.3, car.z + co * f, 10, BURNS_ARTCARS.HEAD_COL, 0.7 * k);
      if (typeof cartOctoLight === 'function' && c.M.extra && c.M.extra.flames) g.pointLight(car.x, car.y + 2.2 * S, car.z, 7 * S, [1, 0.5, 0.16], (0.45 + 0.65 * night) * c.litK);
    }
    this.gc(now);
  },
  // free what nobody has wanted for a while, and keep the loaded models under the tier's caps
  gc(now) {
    if (this._gcT && now - this._gcT < 1000) return; this._gcT = now;
    const T = this.tier(), K = BURNS_ARTCARS;
    const ready = Object.values(this.models).filter(E => E.state === 'ready' || E.state === 'failed');
    for (const E of ready) if (E.state === 'ready' && now - E.used > (E.hi ? K.KEEP_HI : K.KEEP_LO) * 1000) this.free(E);
    for (const hi of [false, true]) {
      const L = Object.values(this.models).filter(E => E.hi === hi && E.state === 'ready').sort((a, b) => a.used - b.used), cap = hi ? T.maxHi + 1 : T.maxLo;
      while (L.length > cap && now - L[0].used > 500) this.free(L.shift());
    }
  },
  // the scene's def hooks are wrapped (on a per-scene copy of the def) to draw the cars in the shadow and main passes
  hook(g) {
    if (!g || g._artKartHooked) return;
    g._artKartHooked = true;
    const base = g.def, d = Object.create(base), self = this;
    d.drawShadows = function (gg, R) { if (base.drawShadows) base.drawShadows.call(base, gg, R); self.draw(gg, R, true); };
    d.drawSkinned = function (gg, R) { if (base.drawSkinned) base.drawSkinned.call(base, gg, R); self.draw(gg, R, false); };
    d.drawSprites = function (gg, R) { if (base.drawSprites) base.drawSprites.call(base, gg, R); self.sprites(gg, R); };
    g.def = d;
  },
  draw(g, R, shadow) {
    if (!shadow) { this.stats.drawn = 0; this.stats.hi = 0; this.stats.tris = 0; } else this.stats.shadow = 0;
    for (const c of this.cars) {
      if (c.g !== g || !c.drawn || !c.M) continue;
      if (shadow) { if (!R.shadowNear(c.car.x, c.car.y, c.car.z, c.rad)) continue; R.skin(c.M.geo, c.bones, c.M.nb, null, 0, 0); this.stats.shadow++; continue; }
      if (!c.inView) continue;
      const dark = c.litK < 0.98 ? [0.04, 0.035, 0.06, 0.42 * (1 - c.litK)] : null;
      R.skin(c.M.geo, c.bones, c.M.nb, dark, 0, 0.3);
      this.stats.drawn++; if (c.lod === 'hi') this.stats.hi++; this.stats.tris += c.M.geo.count / 3;
    }
  },
  // contact shadow, and at dusk and night the lights: LEDs, head and tail lights, underglow, headlight beams; and
  // Calamari Inferno's live fire
  sprites(g, R) {
    const SP = BURNS_SPRITES.R, night = R.night || 0, t = g.time, ck = R.shadowOn ? 0.5 : 1, p = this._p || (this._p = [0, 0, 0]);
    for (const c of this.cars) {
      if (c.g !== g || !c.drawn || !c.inView || !c.M) continue;
      const M = c.M, car = c.car, S = c.S, k = night * c.litK, gy = car.y;
      const L0 = (c.D.b[3] - c.D.b[1]) * S, W0 = (c.D.b[2] - c.D.b[0]) * S, zc = (c.D.b[1] + c.D.b[3]) / 2 * S, s = Math.sin(car.yaw), co = Math.cos(car.yaw);
      R.flat.flat(car.x + s * zc, gy + 0.04, car.z + co * zc, W0 * 0.85, L0 * 1.05, car.yaw, SP.shadow, [0, 0, 0], 0.5 * ck, false);
      if (k > 0.12) {
        R.flat.flat(car.x + s * zc, gy + 0.06, car.z + co * zc, W0 + 3.5, L0 + 4, car.yaw, SP.glow, burnsRGBf(c.D.col), 0.36 * k, true);   // underglow
        if (c.d2 < 130 * 130) for (const L of M.lights) {
          if (c.d2 > 55 * 55 && !L.big && !L.head) continue;
          BurnsM.a34Pt(c.bones, 0, L.x, L.y, L.z, p);
          const fl = L.led ? 0.6 + 0.4 * Math.sin(t * 6 + L.x * 3 + L.z) : 1, sz = L.s * S * (L.big ? 1.4 : 1);
          R.bbs.bb(p[0], p[1], p[2], sz, sz, SP.glow, L.cc, (L.big ? 0.55 : 0.8) * k * fl, true);
          if (L.head && c.d2 < 90 * 90 && (Math.abs(c.speed) > 0.3 || c.veh)) R.flat.flat(car.x + s * (c.D.b[3] * S + 6), gy + 0.05, car.z + co * (c.D.b[3] * S + 6), 4.6, 12, car.yaw + Math.PI, SP.beam, [1, 0.92, 0.75], 0.28 * k, true);
        }
      }
      if (c.litK > 0.3 && typeof cartOctoFlames === 'function') cartOctoFlames(R, M, c.bones, c.st, c.d2, Math.sin(car.yaw) * c.speed, Math.cos(car.yaw) * c.speed, night);
    }
  },
  // a world being left: its cars go, and their models with them (unless another live scene still uses them)
  release(scene) {
    this.cars = this.cars.filter(c => c.g !== scene);
    const live = new Set(this.cars.map(c => c.stem));
    for (const E of Object.values(this.models)) if (!live.has(E.stem)) this.free(E);
  },
  info() {
    const m = this.memory();
    return { cars: this.cars.length, drawn: this.stats.drawn, hi: this.stats.hi, shadow: this.stats.shadow, tris: this.stats.tris, loaded: Object.values(this.models).filter(E => E.state === 'ready').map(E => ({ key: E.key, tris: E.tris, mb: +((E.bytes || 0) / 1048576).toFixed(2), ms: E.ms })),
      loading: Object.values(this.models).filter(E => E.state === 'loading').map(E => E.key), lo: m.lo, hi: m.hi, mb: m.mb, loads: this.stats.loads, frees: this.stats.frees, failed: this.stats.failed, canLoad: this.canLoad(), tier: typeof BurnsGL !== 'undefined' ? BurnsGL.tier : null };
  }
};
// hooks into the play scene (this file is in the Burning Man app only; Art Kart's build never sees it)
if (typeof BurnsPlayScene !== 'undefined') {
  const P = BurnsPlayScene.prototype, cl = P.collectLights;
  P.collectLights = function (env) { try { BurnsArtCars.frame(this); } catch (e) { if (!BurnsArtCars._warned) { BurnsArtCars._warned = true; console.warn('art cars: ' + (e && e.stack || e)); } } return cl.apply(this, arguments); };
}
if (typeof BurnsScenes !== 'undefined') {
  const rel = BurnsScenes.releaseWorld;
  BurnsScenes.releaseWorld = function (scene) { const r = rel.apply(this, arguments); try { BurnsArtCars.release(scene); } catch (e) { /* ignore */ } return r; };
}
if (typeof window !== 'undefined') window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsArtCars, BURNS_ARTCARS });
