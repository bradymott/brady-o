/* ============================================================
   BRADY GOES TO BURNING MAN — world runtime
   BurnsCollide  colliders + spatial hash (static) + per-step dynamic grid
   BurnsGroup    rigid-skinned group (vehicles, movers, pickups): 1 draw
   BurnsWorld    terrain, painted ground, lightmap, static chunks, glows,
                 movers, traffic, triggers, checkpoints, hazards
   The world's build(api) receives BurnsWorld.api (see docs/BURNS_GUIDE.md).
   ============================================================ */

/* ---------------- collision ---------------- */
class BurnsCollide {
  constructor() { this.statics = []; this.grid = new Map(); this.dgrid = new Map(); this.dyn = []; this.cell = 8; this.q = 1; this.hiddenOn = false; }
  key(ix, iz) { return (ix + 4096) * 8192 + (iz + 4096); }
  prep(c) {
    c.t = c.t || 'box';
    if (c.walk === undefined) c.walk = true;
    if (c.solid === undefined) c.solid = true;
    const yaw = c.yaw || 0; c.cy = Math.cos(yaw); c.sy = Math.sin(yaw);
    if (c.t === 'box' || c.t === 'ramp') { c.ex = Math.abs(c.cy) * c.hx + Math.abs(c.sy) * c.hz; c.ez = Math.abs(c.sy) * c.hx + Math.abs(c.cy) * c.hz; }
    else { c.ex = c.ez = c.r; }
    if (c.t === 'dome') c.y1 = c.y0 + c.r;
    if (c.t === 'ramp') { c.y1 = Math.max(c.ya, c.yb); }
    if (c.y0 === undefined) c.y0 = 0;
    c._q = 0;
    return c;
  }
  insert(c, grid) {
    const C = this.cell, x0 = Math.floor((c.x - c.ex) / C), x1 = Math.floor((c.x + c.ex) / C), z0 = Math.floor((c.z - c.ez) / C), z1 = Math.floor((c.z + c.ez) / C);
    for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) { const k = this.key(ix, iz); let a = grid.get(k); if (!a) { a = []; grid.set(k, a); } a.push(c); }
  }
  add(c) { this.prep(c); this.statics.push(c); this.insert(c, this.grid); return c; }
  // remove a batch of static colliders (a streaming tile freeing its own)
  removeMany(list) {
    if (!list || !list.length) return;
    const S = new Set(list), C = this.cell;
    this.statics = this.statics.filter(c => !S.has(c));
    for (const c of list) {
      const x0 = Math.floor((c.x - c.ex) / C), x1 = Math.floor((c.x + c.ex) / C), z0 = Math.floor((c.z - c.ez) / C), z1 = Math.floor((c.z + c.ez) / C);
      for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) { const k = this.key(ix, iz), a = this.grid.get(k); if (!a) continue; const j = a.indexOf(c); if (j >= 0) { a[j] = a[a.length - 1]; a.pop(); } if (!a.length) this.grid.delete(k); }
    }
  }
  // dynamic colliders: call beginDyn(), addDyn(c) for each (already in world coords), each step
  beginDyn() { this.dgrid.clear(); this.dyn.length = 0; }
  addDyn(c) { const yaw = c.yaw || 0; c.cy = Math.cos(yaw); c.sy = Math.sin(yaw); if (c.t === 'box' || c.t === 'ramp') { c.ex = Math.abs(c.cy) * c.hx + Math.abs(c.sy) * c.hz; c.ez = Math.abs(c.sy) * c.hx + Math.abs(c.cy) * c.hz; } else { c.ex = c.ez = c.r; } this.dyn.push(c); this.insert(c, this.dgrid); }
  near(x, z, r, out) {
    out.length = 0; const q = ++this.q, C = this.cell;
    const x0 = Math.floor((x - r) / C), x1 = Math.floor((x + r) / C), z0 = Math.floor((z - r) / C), z1 = Math.floor((z + r) / C);
    for (const grid of [this.grid, this.dgrid]) for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
      const a = grid.get(this.key(ix, iz)); if (!a) continue;
      for (let i = 0; i < a.length; i++) {
        const c = a[i]; if (c._q === q) continue; c._q = q;
        if (c.hidden && !this.hiddenOn) continue;
        if (c.off) continue;
        if (Math.abs(c.x - x) > c.ex + r || Math.abs(c.z - z) > c.ez + r) continue;
        out.push(c);
      }
    }
    return out;
  }
  local(c, x, z, o) { const dx = x - c.x, dz = z - c.z; o[0] = dx * c.cy - dz * c.sy; o[1] = dx * c.sy + dz * c.cy; return o; }
  // top surface height of collider c at (x,z) with footprint margin m; -Infinity if outside
  topAt(c, x, z, m, L) {
    if (c.t === 'box' || c.t === 'ramp') {
      this.local(c, x, z, L);
      if (Math.abs(L[0]) > c.hx + m || Math.abs(L[1]) > c.hz + m) return -Infinity;
      if (c.t === 'ramp') return c.ya + (clamp(L[1], -c.hz, c.hz) + c.hz) / (2 * c.hz) * (c.yb - c.ya);
      return c.y1;
    }
    const dx = x - c.x, dz = z - c.z, d2 = dx * dx + dz * dz;
    if (c.t === 'cyl') return d2 <= (c.r + m) * (c.r + m) ? c.y1 : -Infinity;
    if (c.t === 'dome') { const rr = c.r; if (d2 >= rr * rr) return d2 < (rr + m) * (rr + m) ? c.y0 + 0.05 : -Infinity; return c.y0 + Math.sqrt(rr * rr - d2); }
    return -Infinity;
  }
}

/* ---------------- rigid-skinned group ---------------- */
const BURNS_GROUP_LOD = 38;   // metres: traffic vehicles switch to their low-detail twin beyond this
class BurnsGroup {
  constructor(max) { this.max = max || BurnsGL.maxBones || 32; this.mesh = new BurnsMesh(4096); this.objs = []; this.geo = null; this.bones = null; }
  get full() { return this.objs.length >= this.max || this.mesh.nv > 40000; }
  // add an object already built into its own mesh (bone 0); its bone index is remapped to the slot
  addBuilt(src, info, o) {
    const idx = this.objs.length, m = this.mesh, base = m.nv, i0 = m.ind.length;
    m.append(src);
    const u8 = m.u8; for (let i = base; i < m.nv; i++) { const b = i * 24 + 15; u8[b] = (u8[b] & 0xC0) | (idx & 63); }
    const obj = Object.assign({ idx, group: this, x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, scale: 1, visible: true, info, cols: info.cols || [], lights: info.lights || [] }, o || {});
    obj.tris = (src.ind.length / 3) | 0;
    obj.i0 = i0; obj.i1 = m.ind.length;   // its index range (the shadow pass draws only nearby objects)
    this.objs.push(obj);
    return obj;
  }
  // build(m) appends geometry in object-local space; returns info (cols/lights...)
  add(build, o) {
    const idx = this.objs.length, m = this.mesh, i0 = m.ind.length;
    m.setBone(idx); m.identity();
    const info = build(m) || {};
    const obj = Object.assign({ idx, group: this, x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, scale: 1, visible: true, info, cols: info.cols || [], lights: info.lights || [] }, o || {});
    obj.i0 = i0; obj.i1 = m.ind.length;
    this.objs.push(obj);
    return obj;
  }
  finish() { this.geo = this.mesh.geo(); this.bones = new Float32Array(this.objs.length * 12); this.mesh = null; return this; }
  // cam: objects with a LOD twin show their low-detail copy beyond BURNS_GROUP_LOD metres
  pose(cam) {
    const B = this.bones; if (!B) return;
    const hide = i => { B.fill(0, i * 12, i * 12 + 12); B[i * 12 + 7] = -999; };
    let eff = 0, twins = false;
    for (const o of this.objs) {
      if (o.twinOf) continue;                    // posed through its owner
      let slot = o.idx, tris = o.tris || 0;
      if (o.twin !== undefined) {
        twins = true;
        const far = cam && (o.x - cam.x) * (o.x - cam.x) + (o.z - cam.z) * (o.z - cam.z) > BURNS_GROUP_LOD * BURNS_GROUP_LOD;
        hide(far ? o.idx : o.twin); slot = far ? o.twin : o.idx; if (far) tris = this.objs[o.twin].tris || 0;
      }
      if (!o.visible) { hide(slot); continue; }
      eff += tris;
      BurnsM.a34Set(B, slot * 12, o.x, o.y, o.z, o.yaw, o.pitch, o.roll, o.scale, o.scale, o.scale);
    }
    this.effTris = twins ? eff : undefined;    // triangles actually rasterised (hidden twins collapse to nothing)
  }
}

/* ---------------- traffic: vehicles following each other along lanes ----------------
   lanes: [{ points: [[x,z],...] (direction of travel), vehicles: n, gap: [min,max], speed, wave }]
   Vehicles recycle from the end of a lane back to its start (hidden in the dust). */
class BurnsTraffic {
  constructor(world, def) {
    this.world = world; this.def = def; this.lanes = [];
    const rng = mulberry32(def.seed || 77);
    for (const L of def.lanes) {
      const pts = L.points, seg = []; let total = 0;
      for (let i = 0; i < pts.length - 1; i++) { const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dz); seg.push({ x: pts[i][0], z: pts[i][1], dx: dx / l, dz: dz / l, l, s0: total }); total += l; }
      const lane = { def: L, seg, len: total, cars: [], speed: L.speed || 1.2, phase: rng() * 10, stopped: false };
      // place vehicles from the front (s = len) backwards
      let s = total - (L.frontGap || 4);
      const kinds = L.kinds || null;
      for (let i = 0; i < (L.vehicles || 20) && s > 0; i++) {
        const seed = (def.seed || 1) * 1000 + this.lanes.length * 100 + i;
        const kind = kinds ? kinds[i % kinds.length] : null;
        const mv = world.addMover(m => BurnsProps.vehicle(m, { seed, kind: (L.kindAt && L.kindAt(i)) || kind }), { traffic: true, lodTwin: true });
        const len = mv.info.len || 6;
        s -= len / 2;
        const car = { mv, s, len, v: 0, sleep: false, id: (L.id || 'lane' + this.lanes.length) + ':' + i, lane };
        lane.cars.push(car);
        s -= len / 2 + lerp((L.gap || [1.5, 3])[0], (L.gap || [1.5, 3])[1], rng());
        this.place(lane, car);
      }
      this.lanes.push(lane);
    }
  }
  at(lane, s, out) {
    const seg = lane.seg; let k = 0;
    while (k < seg.length - 1 && s > seg[k].s0 + seg[k].l) k++;
    const g = seg[k], t = s - g.s0;
    out.x = g.x + g.dx * t; out.z = g.z + g.dz * t; out.yaw = Math.atan2(g.dx, g.dz);
    return out;
  }
  place(lane, car) { const p = this.at(lane, clamp(car.s, 0, lane.len), {}); car.mv.x = p.x; car.mv.z = p.z; car.mv.yaw = p.yaw; car.mv.y = 0; }
  update(dt, time) {
    for (const lane of this.lanes) {
      const L = lane.def, cars = lane.cars;
      // stop-and-go wave: the lane leader creeps forward, then waits
      const wave = L.wave === false ? 1 : (Math.sin((time + lane.phase) * (L.waveRate || 0.35)) > -0.2 ? 1 : 0);
      for (let i = 0; i < cars.length; i++) {
        const c = cars[i];
        let target = c.sleep || lane.stopped ? 0 : lane.speed * wave;
        if (i > 0) {
          const ahead = cars[i - 1], gap = (ahead.s - ahead.len / 2) - (c.s + c.len / 2);
          target = Math.min(target, Math.max(0, (gap - 1.2) * 0.8));
          if (gap < 1.0) target = 0;
        }
        c.v = approach(c.v, target, dt * 1.5);
        c.s += c.v * dt;
        if (c.s > lane.len - c.len / 2 && i === 0 && L.recycle !== false) {
          // recycle to the back of the line
          const last = cars[cars.length - 1];
          c.s = Math.min(last.s - last.len / 2 - c.len / 2 - 3, 0);
          cars.shift(); cars.push(c);
          i--;
          this.place(lane, c);
          continue;
        }
        this.place(lane, c);
        // gentle suspension bob while moving
        c.mv.pitch = Math.sin(time * 6 + c.s) * 0.004 * Math.min(1, c.v);
      }
    }
  }
}

/* ---------------- world ---------------- */
// what a streaming tile owns (arrays on BurnsWorld; see tileBegin)
const BURNS_TILE_OWNED = ['glows', 'beams', 'fires', 'jets', 'muds', 'lights', 'vehicles', 'actorDefs', 'movers', 'groups', 'interacts'];
class BurnsWorld {
  constructor(def, game) {
    this.def = def; this.game = game; this.id = def.id;
    this.col = new BurnsCollide();
    // def.chunkSize (default 48 m): static geometry is merged per cell this size (bigger: fewer draws, coarser culling).
    // def.ao: true (default) | 'fast' (coarser baked AO, about 6x quicker to build) | false (no baked AO: huge worlds)
    this.cells = new Map(); this.chunkSize = def.chunkSize || 48;
    this.aoMode = def.ao === undefined ? true : def.ao;
    this.ghostMesh = null; this.chunks = []; this.ghosts = [];
    this.groups = []; this.movers = []; this.traffic = [];
    this.glows = []; this.beams = []; this.fires = []; this.jets = []; this.muds = []; this.triggers = []; this.checkpoints = []; this.markers = []; this.regions = {};
    this.pickupDefs = []; this.actorDefs = []; this.updaters = []; this.vehicles = [];
    this.lights = []; // lightmap pools (painted at finish)
    const b = def.bounds || [-150, -150, 150, 150];
    this.bounds = { x0: b[0], z0: b[1], x1: b[2], z1: b[3] };
    this.heightFn = (def.ground && def.ground.height) || null;
    BURNS_ATLAS.init(); BURNS_SPRITES.init();
    BURNS_ATLAS.signReset();
    this.initCanvases();
    this.api = this.makeApi();
    // streaming tiles: while a tile is being built (this.cur), everything it adds belongs to it
    this.cur = null;
    const add0 = this.col.add.bind(this.col);
    this.col.add = c => { const r = add0(c); if (this.cur) this.cur.cols.push(r); return r; };
  }
  /* ---------- streaming tiles (def.tiles; driven by BurnsTiles in 40_burns_m_open.js) ----------
     tileBegin(t) ... the tile's builder runs (any api call) ... tileEnd(t) bakes its chunks; tileFree(t) drops all of it.
     A tile owns its static chunks, colliders, glows, beams, fires, flame jets, mud, light pools, drivable vehicles,
     actors (from api.npc), movers and their groups, ACTION prompts, LSD-ghost geometry and instanced props. Updaters,
     triggers, markers, checkpoints and pickups stay world-wide (build those in def.build). */
  tileBegin(t) {
    t.cells = new Map(); t.cols = []; t.chunks = []; t.snap = {};
    for (const k of BURNS_TILE_OWNED) t.snap[k] = new Set(this[k] || []);
    this._cells0 = this.cells; this.cells = t.cells;
    this._ghost0 = this.ghostMesh; this.ghostMesh = null;
    this.cur = t;
  }
  tileEnd(t) {
    for (const [, e] of t.cells) for (const m of e.list) if (!m.empty) { const c = m.geo(); c.tile = t; t.chunks.push(c); this.chunks.push(c); }
    if (this.ghostMesh && !this.ghostMesh.empty) { const c = this.ghostMesh.geo(); c.tile = t; c.ghost = true; t.chunks.push(c); this.ghosts.push(c); }
    this.ghostMesh = this._ghost0; this.cells = this._cells0; this.cur = null;
    t.own = {};
    for (const k of BURNS_TILE_OWNED) { const S = t.snap[k], a = this[k] || []; t.own[k] = S.size || a.length ? a.filter(x => !S.has(x)) : []; }
    t.snap = null; t.cells = null;
    for (const G of t.own.groups) if (!G.geo) G.finish();
    if (t.own.lights.length && this.lightmap) this.repaintLights(t.x0, t.z0, t.x1, t.z1, t.own.lights);
  }
  tileFree(t) {
    const own = t.own || {};
    for (const k of BURNS_TILE_OWNED) { const L = own[k]; if (!L || !L.length || !this[k]) continue; const S = new Set(L); this[k] = this[k].filter(x => !S.has(x)); }
    const CS = new Set(t.chunks);
    for (const c of t.chunks) BurnsGL.freeGeo(c);
    if (CS.size) { this.chunks = this.chunks.filter(c => !CS.has(c)); this.ghosts = this.ghosts.filter(c => !CS.has(c)); }
    for (const G of own.groups || []) BurnsGL.freeGeo(G.geo);
    this.col.removeMany(t.cols);
    if (own.lights && own.lights.length && this.lightmap) this.repaintLights(t.x0, t.z0, t.x1, t.z1, own.lights);
    t.chunks = []; t.cols = []; t.own = null;
  }
  // instanced props (BurnsInstancer, 40_burns_m_open.js), made on first use
  instancer() { return this.inst || (this.inst = new BurnsInstancer(this)); }
  // repaint the lightmap where some pools appeared or went away (the pools' own extent), then upload just that part
  repaintLights(x0, z0, x1, z1, pools) {
    for (const L of pools || []) { x0 = Math.min(x0, L.x - L.r); z0 = Math.min(z0, L.z - L.r); x1 = Math.max(x1, L.x + L.r); z1 = Math.max(z1, L.z + L.r); }
    const lx = this.lightX, f = this.lightXf, C = this.lightC;
    const px0 = clamp(Math.floor((x0 - f.x0) * f.sx) - 1, 0, C.width), pz0 = clamp(Math.floor((z0 - f.z0) * f.sz) - 1, 0, C.height);
    const px1 = clamp(Math.ceil((x1 - f.x0) * f.sx) + 1, 0, C.width), pz1 = clamp(Math.ceil((z1 - f.z0) * f.sz) + 1, 0, C.height);
    if (px1 <= px0 || pz1 <= pz0) return;
    lx.save(); lx.beginPath(); lx.rect(px0, pz0, px1 - px0, pz1 - pz0); lx.clip();
    lx.fillStyle = '#000'; lx.fillRect(px0, pz0, px1 - px0, pz1 - pz0);
    const wx0 = f.x0 + px0 / f.sx, wz0 = f.z0 + pz0 / f.sz, wx1 = f.x0 + px1 / f.sx, wz1 = f.z0 + pz1 / f.sz;
    this.paintPools(this.lights.filter(L => L.x + L.r > wx0 && L.x - L.r < wx1 && L.z + L.r > wz0 && L.z - L.r < wz1));
    lx.restore();
    if (!BurnsGL.texRegion(this.lightmap.T, px0, pz0, px1 - px0, pz1 - pz0)) this.lightmap.T.dirty = true;
  }
  paintPools(list) {
    const lx = this.lightX, f = this.lightXf;
    lx.globalCompositeOperation = 'lighter';
    for (const L of list) {
      const cx = (L.x - f.x0) * f.sx, cz = (L.z - f.z0) * f.sz, r = L.r * f.sx;
      if (typeof L.c !== 'string' && !Array.isArray(L.c)) { if (!this._warnedL) { this._warnedL = true; console.warn('burns: light pool without a colour', JSON.stringify(L)); } L.c = '#ffb070'; }
      const c = burnsRGB(L.c);
      const g = lx.createRadialGradient(cx, cz, 0, cx, cz, Math.max(1, r));
      g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${L.i})`); g.addColorStop(0.45, `rgba(${c[0]},${c[1]},${c[2]},${L.i * 0.4})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      lx.fillStyle = g; lx.fillRect(cx - r, cz - r, r * 2, r * 2);
    }
    lx.globalCompositeOperation = 'source-over';
  }
  height(x, z) { return this.heightFn ? this.heightFn(x, z) : 0; }
  /* ---------- painted ground + lightmap canvases ---------- */
  initCanvases() {
    const B = this.bounds, pad = 40;
    const x0 = B.x0 - pad, z0 = B.z0 - pad, w = B.x1 - B.x0 + pad * 2, d = B.z1 - B.z0 + pad * 2;
    const g = this.def.ground || {};
    const res = g.res || 0.5;
    const pw = Math.min(2048, Math.ceil(w / res)), pd = Math.min(2048, Math.ceil(d / res));
    this.paintC = makeCanvas(pw, pd); this.paintX = this.paintC.getContext('2d');
    this.paintXf = { x0, z0, w, d, sx: pw / w, sz: pd / d };
    const lw = Math.min(1024, Math.ceil(w / 0.75)), ld = Math.min(1024, Math.ceil(d / 0.75));
    this.lightC = makeCanvas(lw, ld); this.lightX = this.lightC.getContext('2d');
    this.lightX.fillStyle = '#000'; this.lightX.fillRect(0, 0, lw, ld);
    this.lightXf = { x0, z0, w, d, sx: lw / w, sz: ld / d };
  }
  toPaint(x, z) { const f = this.paintXf; return [(x - f.x0) * f.sx, (z - f.z0) * f.sz]; }
  /* ---------- static geometry per cell ---------- */
  cellMesh(x, z) {
    const C = this.chunkSize, k = Math.floor(x / C) + ':' + Math.floor(z / C);
    let e = this.cells.get(k);
    if (!e) { e = { list: [new BurnsMesh(8192)] }; this.cells.set(k, e); }
    let m = e.list[e.list.length - 1];
    if (m.nv > 50000) { m = new BurnsMesh(8192); e.list.push(m); }
    return m;
  }
  // run builder fn(m) with m transformed to (x,y,z,yaw,scale); returns builder result with world colliders/lights
  place(fn, x, y, z, yaw, scale, opts) {
    opts = opts || {};
    const m = opts.hidden ? (this.ghostMesh || (this.ghostMesh = new BurnsMesh(4096))) : opts.mesh || this.cellMesh(x, z);
    m.push(); m.identity(); m.tf(x, y || 0, z, yaw || 0, 0, 0, scale || 1);
    const v0 = m.nv, i0 = m.ind.length, lo0 = m.lo;
    if (opts.lo) m.lo = true;   // { lo: true }: the low-detail build (background rows, far-off camps)
    const info = fn(m) || {};
    m.lo = lo0;
    m.pop();
    // baked AO for this object (its own corners + contact with the ground)
    if (!opts.noAO && !window.__burnsNoAO && this.aoMode !== false && m.nv - v0 >= 8) { const W0 = this; BurnsAO.bake(m.buf, v0, m.nv, m.ind, i0, m.ind.length, { ground: (gx, gz) => W0.height(gx, gz), res: this.aoMode === 'fast' ? 18 : undefined }); }
    const s = scale || 1, c = Math.cos(yaw || 0), sn = Math.sin(yaw || 0);
    const W = (lx, lz) => [x + (lx * c + lz * sn) * s, z + (-lx * sn + lz * c) * s];
    const cols = [];
    for (const d of info.cols || []) {
      const [wx, wz] = W(d.x || 0, d.z || 0);
      const cc = Object.assign({}, d, { x: wx, z: wz, yaw: (yaw || 0) + (d.yaw || 0), y0: (y || 0) + (d.y0 || 0) * s, y1: d.y1 !== undefined ? (y || 0) + d.y1 * s : undefined });
      if (d.hx !== undefined) { cc.hx = d.hx * s; cc.hz = d.hz * s; }
      if (d.r !== undefined) cc.r = d.r * s;
      if (d.ya !== undefined) { cc.ya = (y || 0) + d.ya * s; cc.yb = (y || 0) + d.yb * s; }
      if (opts.hidden) cc.hidden = true;
      if (opts.tag) cc.tag = opts.tag;
      if (opts.cover !== undefined) cc.cover = opts.cover;
      cols.push(this.col.add(cc));
    }
    for (const L of info.lights || []) {
      const [wx, wz] = W(L.x || 0, L.z || 0), wy = (y || 0) + (L.y || 0) * s;
      if (L.s > 0) this.glows.push({ x: wx, y: wy, z: wz, s: L.s * s, c: burnsRGBf(L.c), ph: Math.random() * 10, blink: L.blink || 0, hidden: !!opts.hidden });
      if (L.pool) this.lights.push({ x: wx, z: wz, r: L.pool * s, c: L.c, i: L.i || 0.55 });
      if (L.beam !== undefined) this.lights.push({ x: wx + Math.sin((yaw || 0) + L.beam) * 4 * s, z: wz + Math.cos((yaw || 0) + L.beam) * 4 * s, r: 5 * s, c: L.c, i: 0.45 });
      if (L.fire) this.fires.push({ x: wx, y: wy - 0.25, z: wz, r: 0.3 * s, hazard: !opts.noHazard, t: Math.random() * 10 });
    }
    info.wcols = cols;
    return info;
  }
  /* ---------- movers (dynamic rigid objects with colliders + lights) ---------- */
  addMover(build, o) {
    // build into a scratch mesh first, so a big object never overflows a group's 16-bit index range
    const src = new BurnsMesh(4096); src.setBone(0); src.identity();
    const info = build(src) || {};
    if (!window.__burnsNoAO && !(o && o.noAO) && this.aoMode !== false) BurnsAO.bake(src.buf, 0, src.nv, src.ind, 0, src.ind.length, { res: this.aoMode === 'fast' ? 18 : undefined });
    // o.lodTwin: the builder is deterministic, so also build a low-detail copy (engine traffic)
    let lo = null; if (o && o.lodTwin) { lo = new BurnsMesh(2048); lo.setBone(0); lo.identity(); lo.lo = true; build(lo); }
    const need = src.nv + (lo ? lo.nv : 0), slots = lo ? 2 : 1;
    let g = this.groups.find(G => !G.geo && !G.pickups && G.objs.length + slots <= G.max && G.mesh.nv + need <= 64000);
    if (!g) { g = new BurnsGroup(); this.groups.push(g); }
    const obj = g.addBuilt(src, info, o);
    if (lo) { const tw = g.addBuilt(lo, {}, { twinOf: obj }); tw.cols = []; tw.lights = []; obj.twin = tw.idx; }
    obj.mover = true;
    obj.dcols = (obj.cols || []).map(d => Object.assign({}, d, { mover: obj, lx: d.x || 0, lz: d.z || 0, lyaw: d.yaw || 0, ly0: d.y0 || 0, ly1: d.y1, lya: d.ya, lyb: d.yb }));
    obj.px = obj.x; obj.py = obj.y; obj.pz = obj.z; obj.pyaw = obj.yaw;
    this.movers.push(obj);
    return obj;
  }
  // per physics step: refresh mover colliders into the dynamic grid
  stepMovers() {
    const C = this.col; C.beginDyn();
    const p = this.game && this.game.player, cr = this.moverCollideR || 110;
    for (const o of this.movers) {
      if (!o.visible || o.noCollide) continue;
      if (p && (Math.abs(o.x - p.x) > cr || Math.abs(o.z - p.z) > cr)) continue;
      const c = Math.cos(o.yaw), s = Math.sin(o.yaw);
      for (const d of o.dcols) {
        d.x = o.x + d.lx * c + d.lz * s; d.z = o.z - d.lx * s + d.lz * c; d.yaw = o.yaw + d.lyaw;
        d.y0 = o.y + d.ly0; if (d.ly1 !== undefined) d.y1 = o.y + d.ly1; if (d.lya !== undefined) { d.ya = o.y + d.lya; d.yb = o.y + d.lyb; }
        if (d.walk === undefined) d.walk = true; if (d.solid === undefined) d.solid = true;
        if (d.t === 'dome') d.y1 = d.y0 + d.r;
        C.addDyn(d);
      }
    }
  }
  saveMoverPrev() { for (const o of this.movers) { o.px = o.x; o.py = o.y; o.pz = o.z; o.pyaw = o.yaw; } }
  /* ---------- finish: bake geometry, ground, textures ---------- */
  finish() {
    // chunks
    for (const [, e] of this.cells) for (const m of e.list) if (!m.empty) this.chunks.push(m.geo());
    this.cells.clear();
    if (this.ghostMesh && !this.ghostMesh.empty) this.ghosts.push(this.ghostMesh.geo());
    this.ghostMesh = null;
    for (const g of this.groups) if (!g.geo) g.finish();
    this.buildGround();
    // lightmap pools
    const f = this.lightXf;
    this.paintPools(this.lights);
    this.lightmap = { T: { src: this.lightC, opts: {} }, x0: f.x0, z0: f.z0, w: f.w, d: f.d };
    this.ground.paintT = { src: this.paintC, opts: { mips: true, premult: true, aniso: 8 } };
    this.ground.detT = { src: BurnsWorld.detailTexture(), opts: { mips: true, repeat: true, aniso: 8 } };
    this.minimap = this.buildMinimap();
  }
  buildGround() {
    const B = this.bounds, g = this.def.ground || {};
    const inner = g.step || 6, pad = 60;   // ground.step: grid spacing (m); a flat open world can use 20-30
    const x0 = B.x0 - pad, z0 = B.z0 - pad, x1 = B.x1 + pad, z1 = B.z1 + pad;
    const nx = Math.ceil((x1 - x0) / inner), nz = Math.ceil((z1 - z0) / inner);
    const geos = [];
    const H = (x, z) => this.height(x, z);
    const N = (x, z) => { const e = 0.5, hx = H(x + e, z) - H(x - e, z), hz = H(x, z + e) - H(x, z - e); const l = Math.hypot(hx, 2 * e, hz); return [-hx / l, 2 * e / l, -hz / l]; };
    // strip the grid into geos of < 65k verts
    const rowsPer = Math.max(1, Math.floor(60000 / (nx + 1)) - 1);
    for (let r0 = 0; r0 < nz; r0 += rowsPer) {
      const r1 = Math.min(nz, r0 + rowsPer), rows = r1 - r0 + 1, cols = nx + 1;
      const buf = new ArrayBuffer(rows * cols * 16), f = new Float32Array(buf), i8 = new Int8Array(buf);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const x = x0 + i * inner, z = z0 + (r0 + j) * inner, v = j * cols + i, n = N(x, z);
        f[v * 4] = x; f[v * 4 + 1] = H(x, z); f[v * 4 + 2] = z; i8[v * 16 + 12] = Math.round(n[0] * 127); i8[v * 16 + 13] = Math.round(n[1] * 127); i8[v * 16 + 14] = Math.round(n[2] * 127);
      }
      const idx = new Uint16Array((rows - 1) * (cols - 1) * 6); let o = 0;
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) { const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1; idx[o++] = a; idx[o++] = c; idx[o++] = b; idx[o++] = b; idx[o++] = c; idx[o++] = d; }
      geos.push({ data: buf, idx, count: idx.length, gen: -1 });
    }
    // far skirt out to the horizon (flat at the edge height)
    const F = 2600, sk = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], out = [[-F, -F], [F, -F], [F, F], [-F, F]];
    const buf = new ArrayBuffer(8 * 16), f = new Float32Array(buf), i8 = new Int8Array(buf);
    const pv = (v, x, z) => { f[v * 4] = x; f[v * 4 + 1] = -0.02; f[v * 4 + 2] = z; i8[v * 16 + 13] = 127; };
    for (let k = 0; k < 4; k++) { pv(k, sk[k][0], sk[k][1]); pv(4 + k, out[k][0], out[k][1]); }
    const idx = []; for (let k = 0; k < 4; k++) { const a = k, b = (k + 1) % 4, c = 4 + k, d = 4 + (k + 1) % 4; idx.push(a, b, c, b, d, c); }
    geos.push({ data: buf, idx: new Uint16Array(idx), count: idx.length, gen: -1 });
    const pf = this.paintXf;
    this.ground = {
      geos, px0: pf.x0, pz0: pf.z0, pw: pf.w, pd: pf.d,
      base: burnsRGBf(g.base || '#c9a27e'), crackScale: g.crackScale || 0.16, crackK: g.crack === undefined ? 0.28 : g.crack,
      mottleScale: g.mottleScale || 0.012, mottleK: g.mottle === undefined ? 0.35 : g.mottle
    };
  }
  buildMinimap() {
    const S = 256, c = makeCanvas(S, S), x = c.getContext('2d');
    const B = this.bounds, w = B.x1 - B.x0, d = B.z1 - B.z0, sc = Math.min(S / w, S / d);
    x.fillStyle = '#3a2a2a'; x.fillRect(0, 0, S, S);
    // ground paint, scaled
    const pf = this.paintXf;
    x.drawImage(this.paintC, (B.x0 - pf.x0) * pf.sx, (B.z0 - pf.z0) * pf.sz, w * pf.sx, d * pf.sz, (S - w * sc) / 2, (S - d * sc) / 2, w * sc, d * sc);
    x.fillStyle = 'rgba(30,20,40,0.25)'; x.fillRect(0, 0, S, S);
    x.fillStyle = 'rgba(30,24,40,0.85)';
    for (const col of this.col.statics) { if (col.hidden || col.camPass || (col.y1 - col.y0) < 0.8) continue; const px = (S - w * sc) / 2 + (col.x - B.x0) * sc, pz = (S - d * sc) / 2 + (col.z - B.z0) * sc; x.fillRect(px - col.ex * sc, pz - col.ez * sc, Math.max(1, col.ex * 2 * sc), Math.max(1, col.ez * 2 * sc)); }
    return { canvas: c, S, sc, ox: (S - w * sc) / 2 - B.x0 * sc, oz: (S - d * sc) / 2 - B.z0 * sc };
  }
  static detailTexture() {
    if (BurnsWorld._det) return BurnsWorld._det;
    // R: playa crack network (jittered-grid Voronoi edges), G: mottling, B: grain. Tileable 256px.
    const N = 256, G = 9, cs = N / G, c = makeCanvas(N, N), x = c.getContext('2d'), img = x.createImageData(N, N), D = img.data;
    const rng = mulberry32(99), P = [];
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) P.push([(i + 0.15 + rng() * 0.7) * cs, (j + 0.15 + rng() * 0.7) * cs]);
    const mot = (X, Y) => { // tileable value noise
      const f = (u, v, p) => { const a = Math.floor(u), b = Math.floor(v), fu = u - a, fv = v - b; const h = (i, j) => BurnsM.hash(((i % p) + p) % p * 131 + ((j % p) + p) % p * 977); const su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv); return lerp(lerp(h(a, b), h(a + 1, b), su), lerp(h(a, b + 1), h(a + 1, b + 1), su), sv); };
      return f(X / 32, Y / 32, 8) * 0.6 + f(X / 16, Y / 16, 16) * 0.4;
    };
    for (let y = 0; y < N; y++) for (let X = 0; X < N; X++) {
      const ci = Math.floor(X / cs), cj = Math.floor(y / cs);
      let d1 = 1e9, d2 = 1e9;
      for (let oj = -1; oj <= 1; oj++) for (let oi = -1; oi <= 1; oi++) {
        const ii = ci + oi, jj = cj + oj, wi = ((ii % G) + G) % G, wj = ((jj % G) + G) % G;
        const p = P[wj * G + wi], px = p[0] + (ii - wi) * cs, py = p[1] + (jj - wj) * cs;
        const dx = X - px, dy = y - py, d = dx * dx + dy * dy;
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
      }
      const e = Math.sqrt(d2) - Math.sqrt(d1);
      const crack = clamp(1 - e / 2.4, 0, 1);
      const o = (y * N + X) * 4;
      const lip = clamp(e / 4, 0, 1), cup = clamp((e - 6) / 14, 0, 1);
      const hgt = clamp(0.55 + 0.35 * lip * lip * (3 - 2 * lip) - 0.18 * cup - 0.55 * crack, 0, 1);
      D[o] = crack * 255; D[o + 1] = mot(X, y) * 255; D[o + 2] = rng() * 255; D[o + 3] = 128 + Math.round(hgt * 127);
    }
    x.putImageData(img, 0, 0);
    BurnsWorld._det = c;
    return c;
  }
  /* ---------- the build API handed to world.build(api) ---------- */
  makeApi() {
    const W = this;
    const api = {
      world: W, game: W.game, rng: mulberry32(W.id * 7919 + 1),
      M: BurnsMesh, props: BurnsProps, atlas: BURNS_ATLAS,
      // ground painting: fn(ctx, P) where P(x,z) -> [px,py], S = px per metre
      paint(fn) { const f = W.paintXf; fn(W.paintX, (x, z) => W.toPaint(x, z), f.sx); },
      road(points, width, o) {
        o = o || {}; const x = W.paintX, f = W.paintXf;
        x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
        const path = () => { x.beginPath(); points.forEach((p, i) => { const q = W.toPaint(p[0], p[1]); i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); }); };
        x.strokeStyle = o.edge || 'rgba(120,90,70,0.35)'; x.lineWidth = (width + 2) * f.sx; path(); x.stroke();
        x.strokeStyle = o.col || 'rgba(150,115,90,0.55)'; x.lineWidth = width * f.sx; path(); x.stroke();
        if (o.tracks) { x.strokeStyle = 'rgba(90,65,50,0.28)'; x.lineWidth = 0.35 * f.sx; for (const off of o.tracks) { x.save(); x.translate(off * f.sx, 0); path(); x.stroke(); x.restore(); } }
        if (o.dash) { x.setLineDash([3 * f.sx, 4 * f.sx]); x.strokeStyle = o.dash; x.lineWidth = 0.25 * f.sx; path(); x.stroke(); x.setLineDash([]); }
        x.restore();
      },
      patch(x0, z0, r, col, a) { const x = W.paintX, [cx, cz] = W.toPaint(x0, z0), R = r * W.paintXf.sx; const g = x.createRadialGradient(cx, cz, 0, cx, cz, R); const c = burnsRGB(col); g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a === undefined ? 0.5 : a})`); g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`); x.fillStyle = g; x.fillRect(cx - R, cz - R, R * 2, R * 2); },
      // lightmap pool (warm light on the ground)
      light(x, z, r, col, i) { W.lights.push({ x, z, r, c: col || '#ffb070', i: i === undefined ? 0.5 : i }); },
      glow(x, y, z, s, col, o) { W.glows.push({ x, y, z, s, c: burnsRGBf(col || '#ffffff'), ph: Math.random() * 10, blink: (o && o.blink) || 0, hidden: !!((o && o.hidden) || W._hidden) }); },
      // custom static geometry: fn(m) in local space at (x, y, z, yaw)
      mesh(x, z, fn, o) { o = o || {}; return W.place(fn, x, o.y || 0, z, o.yaw || 0, o.scale || 1, o); },
      prop(kind, o) {
        o = o || {};
        const fn = BurnsProps[kind]; if (!fn) throw new Error('unknown prop ' + kind);
        return W.place(m => fn.call(BurnsProps, m, o), o.x || 0, o.y || 0, o.z || 0, o.yaw || 0, o.scale || 1, o);
      },
      // visible box with a matching collider (platforms, walls)
      box(x, y, z, w, h, d, col, o) {
        o = o || {};
        return W.place(m => { m.color(col || '#8a7a6a', o.e || 0); if (o.bevel) m.bbox(0, h / 2, 0, w, h, d, o.bevel, o); else m.box(0, h / 2, 0, w, h, d, o); m.emissive(0); return { cols: o.noCol ? [] : [Object.assign({ t: 'box', x: 0, z: 0, hx: w / 2, hz: d / 2, y0: 0, y1: h }, o.col || {})] }; }, x, y, z, o.yaw || 0, 1, o);
      },
      /* smooth, rounded primitives with matching colliders (y = bottom). Common opts:
         { yaw, e (emissive 0..1), gloss (0..3 shine), noCol, col: {collider overrides}, seg } */
      roundBox(x, y, z, w, h, d, col, o) {
        o = o || {};
        return W.place(m => { m.color(col || '#8a7a6a', o.e || 0).shine(o.gloss || 0); m.roundBox(0, h / 2, 0, w, h, d, o.r === undefined ? Math.min(w, h, d) * 0.22 : o.r, o); m.emissive(0).shine(0); return { cols: o.noCol ? [] : [Object.assign({ t: 'box', x: 0, z: 0, hx: w / 2, hz: d / 2, y0: 0, y1: h }, o.col || {})] }; }, x, y, z, o.yaw || 0, 1, o);
      },
      sphere(x, y, z, r, col, o) {
        o = o || {}; const sq = o.squash || 1;
        return W.place(m => { m.color(col || '#c8b8a8', o.e || 0).shine(o.gloss || 0); m.ellipsoid(0, r * sq, 0, r, r * sq, r, o); m.emissive(0).shine(0); return { cols: o.noCol ? [] : [Object.assign({ t: 'dome', x: 0, z: 0, r, y0: r * sq }, o.col || {})] }; }, x, y, z, o.yaw || 0, 1, o);
      },
      capsule(x, y, z, r, h, col, o) {
        o = o || {};
        return W.place(m => { m.color(col || '#c8b8a8', o.e || 0).shine(o.gloss || 0); m.limb(0, 0, 0, 0, Math.max(0.001, h - 2 * r), 0, r, o.r1 || r, o); m.emissive(0).shine(0); return { cols: o.noCol ? [] : [Object.assign({ t: 'cyl', x: 0, z: 0, r, y0: -r, y1: h - r }, o.col || {})] }; }, x, y + r, z, o.yaw || 0, 1, o);
      },
      cylinder(x, y, z, r, h, col, o) {
        o = o || {};
        return W.place(m => { m.color(col || '#8a8a92', o.e || 0).shine(o.gloss || 0); if (o.r1 !== undefined && o.r1 !== r) m.cyl(0, 0, 0, r, o.r1, h, o.seg || m.segs(16, 8), { smooth: true }); else m.roundCyl(0, 0, 0, r, h, o.round === undefined ? Math.min(r, h) * 0.15 : o.round, o); m.emissive(0).shine(0); return { cols: o.noCol ? [] : [Object.assign({ t: 'cyl', x: 0, z: 0, r: Math.max(r, o.r1 || 0), y0: 0, y1: h }, o.col || {})] }; }, x, y, z, o.yaw || 0, 1, o);
      },
      cone(x, y, z, r, h, col, o) {
        o = o || {};
        return W.place(m => { m.color(col || '#ff7a1a', o.e || 0).shine(o.gloss || 0); m.lathe([[0, 0], [r, 0], [r, 0], [r * 0.06, h * 0.96], [0, h]], o); m.emissive(0).shine(0); return { cols: o.noCol ? [] : [Object.assign({ t: 'cyl', x: 0, z: 0, r: r * 0.6, y0: 0, y1: h * 0.75 }, o.col || {})] }; }, x, y, z, o.yaw || 0, 1, o);
      },
      // profile: [[radius, height, colour?, emissive?], ...] bottom -> top (repeat a point for a hard edge)
      lathe(x, y, z, profile, col, o) {
        o = o || {};
        let rmax = 0, ymax = 0; for (const p of profile) { rmax = Math.max(rmax, p[0]); ymax = Math.max(ymax, p[1]); }
        return W.place(m => { m.color(col || '#c8b8a8', o.e || 0).shine(o.gloss || 0); m.lathe(profile, o); m.emissive(0).shine(0); return { cols: o.noCol ? [] : [Object.assign({ t: 'cyl', x: 0, z: 0, r: rmax * (o.colScale || 0.9), y0: 0, y1: ymax }, o.col || {})] }; }, x, y, z, o.yaw || 0, 1, o);
      },
      torus(x, y, z, R, r, col, o) {
        o = o || {};
        return W.place(m => { m.color(col || '#ff4fd8', o.e || 0).shine(o.gloss || 0); m.push(); m.tf(0, 0, 0, 0, o.pitch || 0, o.roll || 0); m.torus(0, 0, 0, R, r, o); m.pop(); m.emissive(0).shine(0); return { cols: [] }; }, x, y, z, o.yaw || 0, 1, o);
      },
      collider(c) { return W.col.add(c); },
      // geometry + colliders that only exist while LSD is active
      hidden(fn) { W._hidden = true; try { fn(); } finally { W._hidden = false; } },
      mover(build, o) { return W.addMover(build, o); },
      traffic(def) { const T = new BurnsTraffic(W, def); W.traffic.push(T); return T; },
      // a drivable art car (and walkable moving platform). o: { x, z, yaw, build(m) -> {cols, seat, poofers, w}, maxSpeed, path: [[x,z]...], pathSpeed, label }
      artCar(o) { const v = new BurnsVehicle(W.game, 'car', o || {}); W.vehicles.push(v); return v; },
      // an ACTION prompt in the world: {x, z, y, r, label, when(g), fn(g, it)} (kept apart from the world's own g.interactables)
      interact(it) { (W.interacts || (W.interacts = [])).push(it); return it; },
      // a cork quest board that opens the quest board (side quests, §7.1)
      questBoard(o) {
        o = o || {}; const yaw = o.yaw || 0, x = o.x || 0, z = o.z || 0;
        const r = api.prop('questBoard', { x, z, yaw, col: o.col, seed: o.seed });
        if (o.title !== false) api.sign(o.title || 'QUEST BOARD', x + Math.sin(yaw) * 0.26, z + Math.cos(yaw) * 0.26, { yaw, y: 2.12, h: 0.32, post: false, maxW: 2.1, style: { bg: '#3a2414', fg: '#ffe0a0', border: '#c8925a' } });
        if (o.title && W.game) W.game.boardTitle = W.game.boardTitle || o.title;
        api.interact({ x: x + Math.sin(yaw) * 1.3, z: z + Math.cos(yaw) * 1.3, r: 2.4, label: 'QUEST BOARD', fn: g => g.openBoard() });
        return r;
      },
      // the Red Light District's pink RV + its burlesque crew (W1's ride to the Burn, W2's gear stash).
      // o: { crew: true | n | [ids], lit, rv: false, behavior, anim: {id}, lines: {id}, chat: {id}, talk: {id}, sign: false }
      redLightCamp(x, z, yaw, o) {
        o = o || {}; yaw = yaw || 0;
        const c = Math.cos(yaw), s = Math.sin(yaw), at = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
        let rv = null, doorZ = 0.8;
        if (o.rv !== false) {
          rv = api.prop('redlightRV', { x, z, yaw, lit: o.lit, len: o.len });
          doorZ = rv.door ? rv.door[1] : doorZ;
          if (o.sign !== false && rv.sign) { const sp = at(rv.sign[0], rv.sign[2] + 0.12); api.sign('RED LIGHT\nDISTRICT', sp[0], sp[1], { yaw, y: rv.sign[1] - 0.15, h: 0.85, post: false, maxW: 2.2, style: { bg: '#2a0a18', fg: '#ff7ac8', border: '#ff2a5a', glow: '#ff2a5a' }, glow: o.lit === false ? null : '#ff2a5a' }); }
          const dp = at(-3.2, doorZ); api.light(dp[0], dp[1], 7, '#ff3a7a', o.lit === false ? 0.25 : 0.55);
        }
        const all = BURNS_REDLIGHT.crew;
        const ids = o.crew === undefined || o.crew === true ? all.map(k => k.id) : typeof o.crew === 'number' ? all.slice(0, o.crew).map(k => k.id) : Array.isArray(o.crew) ? o.crew : [];
        // default: fanned out by the door (-X side); o.spots: [[lx, lz], ...] in the RV's local frame
        const spots = o.spots || [[-2.9, doorZ + 0.2], [-3.4, doorZ + 2.0], [-3.3, doorZ - 1.7], [-4.6, doorZ + 0.9], [-4.4, doorZ - 0.9]];
        const crew = ids.map((id, i) => {
          const K = all.find(k => k.id === id) || { id, name: String(id).toUpperCase(), variant: i % 5 };
          const sp = spots[i % spots.length], p = at(sp[0], sp[1]);
          const d = { id: K.id, name: K.name, type: 'redlight', variant: K.variant, seed: 300 + i, x: p[0], z: p[1], yaw: yaw - Math.PI / 2 + (i - 2) * 0.3,
            anim: (o.anim && o.anim[id]) || K.anim, lines: (o.lines && o.lines[id]) || K.lines, behavior: typeof o.behavior === 'string' ? o.behavior : (o.behavior && o.behavior[id]) || 'idle' };
          if (o.chat && o.chat[id]) d.chat = o.chat[id];
          if (o.talk && o.talk[id]) d.talk = o.talk[id];
          if (o.gifts && o.gifts[id]) d.gift = o.gifts[id];
          if (o.spots && sp[2] !== undefined) d.yaw = yaw + sp[2];
          else if (o.spots) d.yaw = Math.atan2(p[0] - x, p[1] - z);   // face away from the RV
          return api.npc(d);
        });
        return { rv, crew };
      },
      // per-frame world logic: fn(game, dt)
      update(fn) { W.updaters.push(fn); },
      npc(d) { d.friendly = true; W.actorDefs.push(d); return d; },
      enemy(d) { d.friendly = false; W.actorDefs.push(d); return d; },
      crowd(x, z, r, n, o) {
        o = o || {}; const rng = mulberry32(hashStr('crowd' + x + ',' + z));
        const out = [];
        // crowd looks come from 24 variants per type, so crowds share models (fast loads, less GPU memory)
        for (let i = 0; i < n; i++) { const a = rng() * TAU, d = Math.sqrt(rng()) * r; out.push(api.npc(Object.assign({ type: rng.pick(o.types || ['burner', 'burner', 'furcoat', 'tutu', 'ledsuit', 'sparklepony']), seed: Math.floor(rng() * 24), x: x + Math.cos(a) * d, z: z + Math.sin(a) * d, yaw: rng() * TAU, behavior: rng.pick(o.behaviors || ['dance', 'dance', 'idle', 'wander']), style: Math.floor(rng() * 6), ambient: true, lines: o.lines }, o.extra || {}))); }
        return out;
      },
      pickup(kind, x, y, z, o) { const p = Object.assign({ kind, x, y: y === undefined ? 0.9 : y, z }, o || {}); W.pickupDefs.push(p); return p; },
      glowsticks(points, o) { for (const p of points) api.pickup('glowstick', p[0], p[1] !== undefined && p.length > 2 ? p[1] : 0.9, p.length > 2 ? p[2] : p[1], o); },
      glowLine(x0, z0, x1, z1, n, y, o) { for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); api.pickup('glowstick', lerp(x0, x1, t), y === undefined ? 0.9 : y, lerp(z0, z1, t), o); } },
      glowRing(x, z, r, n, y, o) { for (let i = 0; i < n; i++) { const a = i / n * TAU; api.pickup('glowstick', x + Math.sin(a) * r, y === undefined ? 0.9 : y, z + Math.cos(a) * r, o); } },
      glowArc(x0, y0, z0, x1, y1, z1, h, n, o) { for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; api.pickup('glowstick', lerp(x0, x1, t), lerp(y0, y1, t) + Math.sin(t * Math.PI) * h, lerp(z0, z1, t), o); } },
      checkpoint(id, x, z, o) { o = o || {}; const cp = { id, x, z, y: o.y || 0, yaw: o.yaw || 0, active: false, name: o.name || 'Camp flag' }; W.place(m => BurnsProps.campFlag(m, { col: '#9a8aa8' }), x, cp.y, z, cp.yaw, 1, {}); W.checkpoints.push(cp); return cp; },
      spring(x, y, z, power, o) { return api.prop('trampoline', Object.assign({ x, y, z, power }, o || {})); },
      fire(x, y, z, r, o) { const f = Object.assign({ x, y, z, r: r || 0.5, hazard: true, t: Math.random() * 10 }, o || {}); W.fires.push(f); W.lights.push({ x, z, r: (r || 0.5) * 10, c: '#ff8a3a', i: 0.6 }); return f; },
      flameJet(x, y, z, o) { const j = Object.assign({ x, y, z, h: 4, period: 3, on: 1.2, phase: 0, r: 0.6, t: 0 }, o || {}); W.jets.push(j); W.lights.push({ x, z, r: 6, c: '#ff7a2a', i: 0.25 }); return j; },
      mud(x, z, r, o) { const m = Object.assign({ x, z, r, sink: 0.6 }, o || {}); W.muds.push(m); api.paint((c, P, S) => { const [px, pz] = P(x, z); const g = c.createRadialGradient(px, pz, 0, px, pz, r * S); g.addColorStop(0, 'rgba(70,60,70,0.95)'); g.addColorStop(0.8, 'rgba(90,75,80,0.85)'); g.addColorStop(1, 'rgba(90,75,80,0)'); c.fillStyle = g; c.beginPath(); c.arc(px, pz, r * S, 0, TAU); c.fill(); }); return m; },
      trigger(d) { const t = Object.assign({ r: 3, y0: -10, y1: 100, once: false, inside: false }, d); W.triggers.push(t); return t; },
      marker(id, x, z, label, o) { const mk = Object.assign({ id, x, z, label }, o || {}); W.markers.push(mk); return mk; },
      region(name, x, z, r) { W.regions[name] = { x, z, r: r || 10 }; },
      sign(text, x, z, o) { return api.prop('sign', Object.assign({ x, z, text }, o || {})); },
      height(x, z) { return W.height(x, z); },
      /* instanced props: define a prototype once, then place any number of copies (one draw per prototype and detail
         level). build(m) runs at full detail, then with m.lo = true; o.far(m) builds the cheapest copy. See §4.8. */
      instanceProto(id, build, o) { return W.instancer().proto(id, build, o); },
      instance(id, x, z, o) { o = o || {}; return W.instancer().add(id, x, o.y || 0, z, o.yaw || 0, o.scale || 1, o.tint, o.noCol); }
    };
    // route static geometry into the LSD ghost layer while inside api.hidden()
    const place0 = W.place.bind(W);
    W.place = (fn, x, y, z, yaw, scale, opts) => place0(fn, x, y, z, yaw, scale, W._hidden ? Object.assign({}, opts || {}, { hidden: true }) : opts);
    return api;
  }
  /* ---------- queries ---------- */
  // highest walkable surface at (x,z) not above maxY (feet + step). returns {y, col}
  surface(x, z, maxY, margin, out) {
    out = out || {}; out.y = this.height(x, z); out.col = null;
    const L = BURNS_TMP3, list = this._near || (this._near = []);
    this.col.near(x, z, margin + 0.5, list);
    for (const c of list) {
      if (!c.walk) continue;
      const top = this.col.topAt(c, x, z, margin, L);
      if (top > out.y && top <= maxY) { out.y = top; out.col = c; }
    }
    return out;
  }
  // push a vertical cylinder (x,z,radius, feet y, height) out of solid colliders. returns {x,z,hit,wall}
  push(e, rad, feetY, height, step, ignoreMover) {
    const list = this._near2 || (this._near2 = []), L = [0, 0];
    this.col.near(e.x, e.z, rad + 0.5, list);
    let hit = null;
    for (let it = 0; it < 2; it++) {
      for (const c of list) {
        if (!c.solid || (ignoreMover && c.mover === ignoreMover)) continue;
        let top = c.y1;
        if (c.t === 'ramp') { this.col.local(c, e.x, e.z, L); top = c.ya + (clamp(L[1], -c.hz, c.hz) + c.hz) / (2 * c.hz) * (c.yb - c.ya); }
        if (c.t === 'dome') {
          const h = feetY + step - c.y0; if (h >= c.r) continue;
          const rh = Math.sqrt(c.r * c.r - Math.max(0, h) * Math.max(0, h)), dx = e.x - c.x, dz = e.z - c.z, d = Math.hypot(dx, dz);
          if (d < rh + rad && d > 1e-4) { const k = (rh + rad - d) / d; e.x += dx * k; e.z += dz * k; hit = c; }
          continue;
        }
        if (top <= feetY + step || c.y0 >= feetY + height) continue;
        if (c.t === 'cyl') {
          const dx = e.x - c.x, dz = e.z - c.z, d = Math.hypot(dx, dz), R = c.r + rad;
          if (d < R) { if (d < 1e-4) { e.x += R; } else { const k = (R - d) / d; e.x += dx * k; e.z += dz * k; } hit = c; }
          continue;
        }
        this.col.local(c, e.x, e.z, L);
        const lx = L[0], lz = L[1], qx = clamp(lx, -c.hx, c.hx), qz = clamp(lz, -c.hz, c.hz);
        let px = 0, pz = 0;
        if (qx === lx && qz === lz) {
          // inside: exit along the shallowest axis
          const ox = c.hx - Math.abs(lx), oz = c.hz - Math.abs(lz);
          if (ox < oz) px = (lx >= 0 ? 1 : -1) * (ox + rad); else pz = (lz >= 0 ? 1 : -1) * (oz + rad);
        } else {
          const dx = lx - qx, dz = lz - qz, d = Math.hypot(dx, dz);
          if (d >= rad) continue;
          px = dx / d * (rad - d); pz = dz / d * (rad - d);
        }
        // back to world
        e.x += px * c.cy + pz * c.sy; e.z += -px * c.sy + pz * c.cy;
        hit = c;
      }
    }
    return hit;
  }
  // ceiling above the head (for jumping into the underside of things)
  ceiling(x, z, headY, feetY, rad) {
    const list = this._near3 || (this._near3 = []), L = [0, 0];
    this.col.near(x, z, rad + 0.5, list);
    let best = Infinity;
    for (const c of list) {
      if (!c.solid || c.t === 'dome' || c.t === 'ramp') continue;
      if (c.y0 <= feetY + 0.3 || c.y0 > headY) continue;
      if (this.col.topAt(c, x, z, rad * 0.5, L) === -Infinity) continue;
      best = Math.min(best, c.y0);
    }
    return best;
  }
  // segment vs one collider: returns hit fraction t in [0,1], or 2 for a miss
  segT(c, ax, ay, az, dx, dy, dz) {
    if (c.t === 'box' || c.t === 'ramp') {
      const ox = ax - c.x, oz = az - c.z;
      const lx0 = ox * c.cy - oz * c.sy, lz0 = ox * c.sy + oz * c.cy, ldx = dx * c.cy - dz * c.sy, ldz = dx * c.sy + dz * c.cy;
      let t0 = 0, t1 = 1;
      const slab = (o, d, lo, hi) => { if (Math.abs(d) < 1e-9) return o >= lo && o <= hi; let a = (lo - o) / d, b = (hi - o) / d; if (a > b) { const s = a; a = b; b = s; } t0 = Math.max(t0, a); t1 = Math.min(t1, b); return t0 <= t1; };
      if (slab(lx0, ldx, -c.hx, c.hx) && slab(lz0, ldz, -c.hz, c.hz) && slab(ay, dy, c.y0, c.y1)) return t0;
      return 2;
    }
    if (c.t === 'cyl') {
      const ox = ax - c.x, oz = az - c.z, A = dx * dx + dz * dz, B2 = 2 * (ox * dx + oz * dz), C = ox * ox + oz * oz - c.r * c.r;
      if (C < 0 && ay >= c.y0 && ay <= c.y1) return 0;
      let best = 2;
      if (A > 1e-9) { const disc = B2 * B2 - 4 * A * C; if (disc >= 0) { const tt = (-B2 - Math.sqrt(disc)) / (2 * A); if (tt >= 0 && tt <= 1) { const y = ay + dy * tt; if (y >= c.y0 && y <= c.y1) best = tt; } } }
      // the top and bottom discs (segments that enter through a cap: covers seen from above, cameras looking down)
      if (Math.abs(dy) > 1e-9) for (const yp of [c.y1, c.y0]) { const tt = (yp - ay) / dy; if (tt >= 0 && tt <= 1 && tt < best) { const x = ox + dx * tt, z = oz + dz * tt; if (x * x + z * z <= c.r * c.r) best = tt; } }
      return best;
    }
    if (c.t === 'dome') {
      const ox = ax - c.x, oy = ay - c.y0, oz = az - c.z, A = dx * dx + dy * dy + dz * dz, B2 = 2 * (ox * dx + oy * dy + oz * dz), C = ox * ox + oy * oy + oz * oz - c.r * c.r;
      if (C < 0) return 0;
      const disc = B2 * B2 - 4 * A * C; if (disc < 0) return 2;
      const tt = (-B2 - Math.sqrt(disc)) / (2 * A);
      if (tt >= 0 && tt <= 1 && oy + dy * tt >= 0) return tt;
      return 2;
    }
    return 2;
  }
  // segment cast for the camera (returns 0..1 fraction of the first hit)
  raycast(ax, ay, az, bx, by, bz, skipCamPass) {
    const dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.hypot(dx, dz);
    const list = this._near4 || (this._near4 = []);
    this.col.near((ax + bx) / 2, (az + bz) / 2, len / 2 + 1, list);
    let tmin = 1;
    for (const c of list) {
      if (!c.solid || (skipCamPass && c.camPass)) continue;
      const t = this.segT(c, ax, ay, az, dx, dy, dz);
      if (t < tmin) tmin = t;
    }
    return tmin;
  }
  // is the segment blocked by a "cover" collider? (the Man's neon flash)
  covered(ax, ay, az, bx, by, bz) {
    const dx = bx - ax, dy = by - ay, dz = bz - az, len = Math.hypot(dx, dz);
    const list = this._near5 || (this._near5 = []);
    this.col.near((ax + bx) / 2, (az + bz) / 2, len / 2 + 1, list);
    for (const c of list) if (c.cover && this.segT(c, ax, ay, az, dx, dy, dz) < 0.985) return true;
    return false;
  }
}
