/* ============================================================
   BRADY GOES TO BURNING MAN — open-world runtime
   BurnsTiles      streams a world's def.tiles around Brady: tiles build a little every frame (no hitches)
                   and are freed again when he's far away
   BurnsInstancer  instanced props: one draw per prototype and detail level, any number of copies
   BurnsOpen       places you can enter: push a world as a sub-world, pop back to the same spot
   ============================================================ */

/* ---------------- streaming tiles ----------------
   def.tiles = {
     size: 160,                 tile edge (m), aligned to the world origin
     load: 380, free: 560,      Brady-to-tile-edge distances (m) to build / to free (free > load: hysteresis)
     budget: 4,                 ms of building per rendered frame
     build(api, g, tile),       builds one tile with the ordinary api. A generator function (function*) can
                                `yield` between pieces to spread its work over frames.
     onLoad(g, tile), onFree(g, tile), region(x, z) -> name (region-aware saves and missions)
   }
   tile: { i, j, key, x0, z0, x1, z1, cx, cz, state, actors, data (yours) } */
class BurnsTiles {
  constructor(g, T) {
    this.g = g; this.T = T; this.size = T.size || 160;
    this.loadR = T.load || this.size * 2.4; this.freeR = Math.max(T.free || 0, this.loadR + this.size * 0.75);
    this.tiles = new Map(); this.queue = []; this.job = null; this.checkT = 0; this.people = [];
    this.stats = { built: 0, freed: 0, ms: 0, worst: 0 };
    this.region = null;
  }
  tileAt(i, j) {
    const k = i + ':' + j; let t = this.tiles.get(k);
    if (!t) { const S = this.size; t = { i, j, key: k, x0: i * S, z0: j * S, x1: (i + 1) * S, z1: (j + 1) * S, cx: (i + 0.5) * S, cz: (j + 0.5) * S, state: 'none', actors: [], inst: [], data: {} }; this.tiles.set(k, t); }
    return t;
  }
  dist(t, x, z) { const S = this.size; return Math.hypot(Math.max(Math.abs(x - t.cx) - S / 2, 0), Math.max(Math.abs(z - t.cz) - S / 2, 0)); }
  // tiles (inside the world bounds) whose edge is within R of (x, z), nearest first
  want(x, z, R) {
    const S = this.size, B = this.g.world.bounds, out = [];
    const i0 = Math.floor(Math.max(B.x0, x - R) / S), i1 = Math.floor((Math.min(B.x1, x + R) - 0.01) / S);
    const j0 = Math.floor(Math.max(B.z0, z - R) / S), j1 = Math.floor((Math.min(B.z1, z + R) - 0.01) / S);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const t = this.tileAt(i, j), d = this.dist(t, x, z); if (d <= R) out.push([t, d]); }
    return out.sort((a, b) => a[1] - b[1]).map(e => e[0]);
  }
  // fixed-step update: what to queue and what to free (cheap; building happens in step())
  update(dt) {
    const p = this.g.player; if (!p) return;
    if (this.T.region) {
      const r = this.T.region(p.x, p.z) || null;
      if (r !== this.region) { const prev = this.region; this.region = r; this.g.region = r; if (r) { BurnsSave.flag(this.g.worldId, 'region:' + r, true); this.g.missions.event('region', r); } if (this.T.onRegion) this.T.onRegion(this.g, r, prev); }
    }
    this.checkT -= dt; if (this.checkT > 0) return; this.checkT = 0.2;
    const x = p.x, z = p.z;
    for (const t of this.want(x, z, this.loadR)) if (t.state === 'none') { t.state = 'queued'; this.queue.push(t); }
    this.queue.sort((a, b) => this.dist(a, x, z) - this.dist(b, x, z));
    for (const t of this.tiles.values()) if (t.state !== 'none' && this.dist(t, x, z) > this.freeR) this.free(t);
  }
  // once per rendered frame: build for at most `budget` ms
  step(budget) {
    const t0 = performance.now(); budget = budget || this.T.budget || 4;
    // a finished tile's people join a few per frame (each new actor costs a little)
    for (let k = 0; k < 3 && this.people.length; k++) { const [t, d] = this.people.shift(); if (t.state !== 'ready') continue; const a = new BurnsActor(this.g, d); this.g.actors.push(a); t.actors.push(a); }
    while (performance.now() - t0 < budget) {
      if (!this.job) { const t = this.queue.shift(); if (!t) break; if (t.state !== 'queued') continue; this.begin(t); }
      const J = this.job; let done = true;
      if (J.it) { try { done = !!J.it.next().done; } catch (e) { console.error('burns tile ' + J.t.key, e); done = true; } }
      if (done) this.end(J.t);
    }
    const ms = performance.now() - t0; this.stats.ms = ms; if (ms > this.stats.worst) this.stats.worst = ms;
  }
  busy() { return !!this.job || this.queue.length > 0 || this.people.length > 0; }
  begin(t) {
    const g = this.g, W = g.world;
    t.state = 'building';
    W.tileBegin(t); if (W.inst) W.inst.cur = t;
    let it = null;
    try { const r = this.T.build(W.api, g, t); if (r && typeof r.next === 'function') it = r; } catch (e) { console.error('burns tile ' + t.key, e); }
    this.job = { t, it };
  }
  end(t) {
    const g = this.g, W = g.world;
    this.job = null;
    W.tileEnd(t); if (W.inst) W.inst.cur = null;
    for (const d of t.own.actorDefs) this.people.push([t, d]);
    t.state = 'ready'; this.stats.built++;
    if (this.T.onLoad) { try { this.T.onLoad(g, t); } catch (e) { console.error(e); } }
    if (t.freeMe) this.free(t);
  }
  free(t) {
    const g = this.g, W = g.world;
    if (t.state === 'queued') { t.state = 'none'; this.queue = this.queue.filter(q => q !== t); return; }
    if (t.state === 'building') { t.freeMe = true; return; }   // finish first, then free
    if (t.state !== 'ready') return;
    t.freeMe = false;
    if (this.T.onFree) { try { this.T.onFree(g, t); } catch (e) { console.error(e); } }
    const keep = a => a.keep || a.following || (g.dialog && g.dialog.open && g.dialog.cur && g.dialog.cur.who === a);
    const gone = new Set(t.actors.filter(a => !keep(a)));
    for (const a of gone) a.removed = true;
    if (gone.size) g.actors = g.actors.filter(a => !gone.has(a));
    t.actors = [];
    if (W.inst) W.inst.freeTile(t);
    W.tileFree(t);
    t.state = 'none'; t.data = {}; this.stats.freed++;
  }
  // build everything within R of (x, z) right now (the loading screen, a teleport)
  prime(x, z, R) {
    for (const t of this.want(x, z, R === undefined ? this.size * 0.75 : R)) {
      if (t.state === 'ready') continue;
      if (this.job && this.job.t === t) { const J = this.job; if (J.it) { try { while (!J.it.next().done); } catch (e) { console.error(e); } } this.end(t); continue; }
      if (t.state === 'queued') this.queue = this.queue.filter(q => q !== t);
      if (this.job) { const J = this.job; if (J.it) { try { while (!J.it.next().done); } catch (e) { console.error(e); } } this.end(J.t); }
      t.state = 'queued'; this.begin(t);
      const J = this.job; if (J.it) { try { while (!J.it.next().done); } catch (e) { console.error(e); } }
      this.end(t);
    }
    this.flushPeople();
  }
  // everyone queued joins now (prime / loading screen)
  flushPeople() { while (this.people.length) { const [t, d] = this.people.shift(); if (t.state !== 'ready') continue; const a = new BurnsActor(this.g, d); this.g.actors.push(a); t.actors.push(a); } }
  releaseAll() { if (this.job) { const J = this.job; if (J.it) { try { while (!J.it.next().done); } catch (e) { /* ignore */ } } this.end(J.t); } for (const t of this.tiles.values()) if (t.state !== 'none') this.free(t); this.queue = []; }
  readyCount() { let n = 0; for (const t of this.tiles.values()) if (t.state === 'ready') n++; return n; }
}

/* ---------------- instanced props ----------------
   W.instancer().proto(id, build, { lo, far, near, mid, farD, minD, noCap, r, shadow, noAO }): build(m) is called with
     m.lo = false (up close, drawn to `near` m), again with m.lo = true (to `mid` m) and far(m) for the cheapest copy (to
     `farD` m). minD: not drawn closer than this (far-city stand-ins); noCap: ignore the world's draw distance.
   .add(id, x, y, z, yaw, scale, tint[r, g, b]) places one copy (tile-owned while a tile builds).
   .dyn(id) -> a copy you move yourself every frame ({x, y, z, yaw, s, on}).
   Copies are culled by distance and view, then drawn one batch per prototype and level. Each batch is one draw. */
class BurnsInstancer {
  constructor(W) {
    this.W = W; this.protos = new Map(); this.list = []; this.dyns = []; this.cur = null;
    this.batches = []; this.shBatches = []; this.bmap = new Map(); this.shmap = new Map();
    this.last = null; this.dirty = true; this.t = 0;
  }
  proto(id, build, o) {
    if (this.protos.has(id)) return this.protos.get(id);
    o = o || {};
    let info0 = null;
    const mk = (fn, lo) => {
      const m = new BurnsMesh(4096); m.lo = lo;
      try { const r = fn(m); if (!info0) info0 = r || {}; } catch (e) { console.error('burns instance proto ' + id, e); }
      if (m.empty || !m.nv) return null;
      if (!o.noAO && !window.__burnsNoAO && this.W.aoMode !== false) BurnsAO.bake(m.buf, 0, m.nv, m.ind, 0, m.ind.length, { ground: () => 0, res: this.W.aoMode === 'fast' ? 18 : undefined });
      return m.geo();
    };
    const L = [{ geo: mk(build, false), d: o.near || 45 }];
    if (o.lo !== false) L.push({ geo: mk(build, true), d: o.mid || 140 });
    if (o.far) L.push({ geo: mk(o.far, true), d: o.farD || 320 });
    const P = { id, levels: L.filter(l => l.geo), shadow: o.shadow !== false, r: o.r || 4, n: 0, minD: o.minD || 0, noCap: !!o.noCap, cols: [] };
    P.maxD = P.levels.length ? P.levels[P.levels.length - 1].d : 0;
    if (o.cols !== false && info0 && info0.cols) P.cols = info0.cols;   // the full-detail build's colliders go with every copy
    this.protos.set(id, P);
    return P;
  }
  add(id, x, y, z, yaw, s, tint, noCol) {
    const P = this.protos.get(id); if (!P || !P.levels.length) return null;
    const it = { P, x, y: y || 0, z, yaw: yaw || 0, s: s || 1, tr: tint ? tint[0] : 1, tg: tint ? tint[1] : 1, tb: tint ? tint[2] : 1 };
    this.list.push(it);
    if (this.cur) this.cur.inst.push(it);
    this.dirty = true;
    // colliders (world-owned, or the building tile's)
    if (!noCol && P.cols.length) {
      s = s || 1; const c = Math.cos(it.yaw), sn = Math.sin(it.yaw);
      for (const d of P.cols) {
        const lx = d.x || 0, lz = d.z || 0, cc = Object.assign({}, d, { x: x + (lx * c + lz * sn) * s, z: z + (-lx * sn + lz * c) * s, yaw: it.yaw + (d.yaw || 0), y0: it.y + (d.y0 || 0) * s, y1: d.y1 !== undefined ? it.y + d.y1 * s : undefined });
        if (d.hx !== undefined) { cc.hx = d.hx * s; cc.hz = d.hz * s; }
        if (d.r !== undefined) cc.r = d.r * s;
        if (d.ya !== undefined) { cc.ya = it.y + d.ya * s; cc.yb = it.y + d.yb * s; }
        this.W.col.add(cc);
      }
    }
    return it;
  }
  dyn(id) { const P = this.protos.get(id); if (!P) return null; const it = { P, x: 0, y: 0, z: 0, yaw: 0, s: 1, tr: 1, tg: 1, tb: 1, on: true }; this.dyns.push(it); return it; }
  freeTile(t) { if (!t.inst || !t.inst.length) return; const S = new Set(t.inst); this.list = this.list.filter(i => !S.has(i)); t.inst = []; this.dirty = true; }
  count() { return this.list.length; }
  batch(map, P, level) {
    const k = P.id + '#' + level; let b = map.get(k);
    if (!b) { b = { geo: P.levels[level].geo, data: new Float32Array(64 * 8), n: 0, dirty: true }; map.set(k, b); }
    return b;
  }
  push(b, it) {
    if ((b.n + 1) * 8 > b.data.length) { const d = new Float32Array(b.data.length * 2); d.set(b.data); b.data = d; }
    const o = b.n * 8, D = b.data; D[o] = it.x; D[o + 1] = it.y; D[o + 2] = it.z; D[o + 3] = it.yaw; D[o + 4] = it.s; D[o + 5] = it.tr; D[o + 6] = it.tg; D[o + 7] = it.tb; b.n++;
  }
  // cull + pick detail levels (statics when the camera moved; moving copies every frame)
  update(R, maxD, shadowR) {
    const cam = R.cam, B = R.B; if (!cam) return;
    const L = this.last, moved = !L || Math.abs(L.x - cam.x) + Math.abs(L.z - cam.z) > 3 || Math.abs(L.fx - B.fx) + Math.abs(L.fz - B.fz) > 0.08 || L.maxD !== maxD;
    const fx = B.fx, fz = B.fz, fl = Math.hypot(fx, fz) || 1, ux = fx / fl, uz = fz / fl;
    const rebuild = (items, mm, sm, statics) => {
      for (const b of mm.values()) { b.n = 0; b.dirty = true; }
      for (const b of sm.values()) { b.n = 0; b.dirty = true; }
      for (const it of items) {
        if (it.on === false) continue;
        const P = it.P, dx = it.x - cam.x, dz = it.z - cam.z, d = Math.hypot(dx, dz), r = P.r * it.s;
        if (shadowR && P.shadow && d < shadowR + r) this.push(this.batch(sm, P, Math.min(1, P.levels.length - 1)), it);
        if (d > (P.noCap ? P.maxD : Math.min(P.maxD, maxD)) + r || d < P.minD) continue;
        if (d > r * 2 && dx * ux + dz * uz < -r - d * 0.25) continue;   // well behind the camera (the cone is generous: no popping at the edges)
        let lv = 0; while (lv < P.levels.length - 1 && d > P.levels[lv].d) lv++;
        this.push(this.batch(mm, P, lv), it);
      }
    };
    if (moved || this.dirty) {
      rebuild(this.list, this.bmap, this.shmap, true);
      this.last = { x: cam.x, z: cam.z, fx: B.fx, fz: B.fz, maxD }; this.dirty = false;
    }
    if (this.dyns.length) {
      if (!this.dmap) { this.dmap = new Map(); this.dsmap = new Map(); }
      rebuild(this.dyns, this.dmap, this.dsmap, false);
    }
    this.batches = [...this.bmap.values(), ...(this.dmap ? this.dmap.values() : [])];
    this.shBatches = [...this.shmap.values(), ...(this.dsmap ? this.dsmap.values() : [])];
  }
  draw(R, env, world) { R.instances(this.batches, env, world, BURNS_ATLAS.T); }
  drawShadow(R) { R.instances(this.shBatches, null, null, null); }
  release() {
    const gl = BurnsGL.gl;
    for (const P of this.protos.values()) for (const l of P.levels) BurnsGL.freeGeo(l.geo);
    for (const m of [this.bmap, this.shmap, this.dmap, this.dsmap]) if (m) for (const b of m.values()) if (b.ibuf && gl) { try { gl.deleteBuffer(b.ibuf); } catch (e) { /* ignore */ } b.ibuf = null; }
  }
}

/* ---------------- places you can enter ----------------
   BurnsOpen.enter(g, worldId, { back: {x, y, z, yaw}, place, opts }) plays a world as a sub-world of g (the overworld
   stays built, frozen behind it). When that world is finished (after its results and story card) or left from the
   pause menu, BurnsOpen.leave(sub) frees it and resumes g with Brady at `back`; g.def.onResume(g, sub, how) runs.
   `how` is 'done' (finished) or 'leave'. */
const BurnsOpen = {
  enter(g, worldId, o) {
    o = o || {};
    if (!BurnsWorlds.get(worldId)) { if (g.toast) g.toast('The burners are still building this place. Soon!'); return null; }
    const p = g.player;
    if (g.saveRun) g.saveRun();
    g.suspended = true;
    g.atlasSnap = BURNS_ATLAS.signSnapshot();
    if (typeof Sound !== 'undefined' && Sound.engine) Sound.engine(false, 0);
    Input.camDrag = false;
    const sub = new BurnsPlayScene(worldId, Object.assign({}, o.opts || {}));
    sub.parentScene = g; sub.parentBack = o.back || { x: p.x, y: p.y, z: p.z, yaw: p.yaw }; sub.placeName = o.place || null;
    Game.setScene(sub);
    return sub;
  },
  leave(sub, how) {
    const g = sub && sub.parentScene; if (!g) return false;
    if (!sub.released) { sub.released = true; if (sub.player) { try { sub.saveRun(); } catch (e) { /* ignore */ } } BurnsScenes.releaseWorld(sub); }
    if (typeof Sound !== 'undefined' && Sound.engine) Sound.engine(false, 0);
    BURNS_ATLAS.signRestore(g.atlasSnap); g.atlasSnap = null;
    g.suspended = false;
    Game.setScene(g);
    g.resumeFrom(sub, how || 'leave');
    return true;
  },
  // the top-level open world behind whatever is running (null if none)
  root() { let s = Game.scene; while (s && s.parentScene) s = s.parentScene; return s && s.def && s.def.open ? s : null; }
};

if (typeof window !== 'undefined') window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsTiles, BurnsInstancer, BurnsOpen });
