/* ============================================================
   BRADY GOES TO BURNING MAN — shared helpers for Worlds 2, 3 and 4
   (No Camp · Costume Cult & the Yellow Bike · The Orgy Dome)
   - one helper per rounded shape (wrapping the engine's smooth
     primitives, so a signature change is a one-line fix)
   - prop builders: lamps, clock-street signposts, parked bikes,
     pillows, tents, art cars for the W2 parade
   - runtime systems: game-time timers, riders on bikes (movers),
     bone attachments (rigid meshes that follow an actor's bone),
     parades (movers looping along a path)
   - pickup mesh extension for world items (goggles, bike lights...)
   Everything here is prefixed BURNS_W234 / burnsW234.
   ============================================================ */

const BURNS_W234 = {
  S: null,
  /* ---------- per-world runtime state ---------- */
  reset(g) {
    this.S = { g, timers: [], att: [], riders: [], parades: [], bikes: [] };
    // sign-bearing gear uses the per-world sign atlas: rebuild it each world
    const C = this._attCache; if (C) for (const k in C) if (k.indexOf('sign:') === 0) { try { BurnsGL.freeGeo && BurnsGL.freeGeo(C[k].geo); } catch (e) { /* ignore */ } delete C[k]; }
    return this.S;
  },
  timer(sec, fn) { if (this.S) this.S.timers.push({ t: sec, fn }); },
  update(g, dt) {
    const S = this.S; if (!S) return;
    if (S.timers.length) {
      for (const t of S.timers) { t.t -= dt; if (t.t <= 0 && !t.done) { t.done = true; t.fn(g); } }
      S.timers = S.timers.filter(t => !t.done);
    }
    for (const P of S.parades) this.paradeStep(g, P, dt);
    if (S.carry || S.loads) this.carryStep(g, dt);
  },
  /* ---------- shapes (local coords of m's transform) ---------- */
  rb(m, cx, cy, cz, w, h, d, r, o) { m.roundBox(cx, cy, cz, w, h, d, r === undefined ? Math.min(w, h, d) * 0.22 : r, o); return m; },
  ball(m, cx, cy, cz, r, o) { m.ball(cx, cy, cz, r, o); return m; },
  egg(m, cx, cy, cz, rx, ry, rz, o) { m.ellipsoid(cx, cy, cz, rx, ry, rz, o); return m; },
  // surface of revolution at (x,y,z): profile [[r, y, colour?, emissive?], ...] bottom -> top
  lathe(m, x, y, z, prof, o) { m.push(); m.tf(x, y, z); m.lathe(prof, o); m.pop(); return m; },
  limb(m, x0, y0, z0, x1, y1, z1, r0, r1, o) { m.limb(x0, y0, z0, x1, y1, z1, r0, r1 === undefined ? r0 : r1, o); return m; },
  // smooth tube through points [[x,y,z],...] (capsules joined end to end)
  tube(m, pts, r, o) { for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; m.limb(a[0], a[1], a[2], b[0], b[1], b[2], r, r, o); } return m; },
  // inside surface of a revolution (faces + normals point inward: domes and tents you walk into).
  // prof: [[r, y, colour?, emissive?], ...] bottom -> top. o: { seg, theta0, theta1 }
  innerShell(m, prof, o) {
    o = o || {};
    const seg = o.seg || 24, full = o.theta0 === undefined && o.theta1 === undefined, t0 = o.theta0 || 0, t1 = o.theta1 === undefined ? TAU : o.theta1;
    const cols = full ? seg : seg + 1, n = prof.length, base = m.nv, P = [0, 0, 0], N = [0, 0, 0], c0 = m.c, e0 = m.e;
    const wr = BURNS_ATLAS.white, wu = (wr.u0 + wr.u1) / 2, wv = (wr.v0 + wr.v1) / 2;
    for (let j = 0; j < n; j++) {
      const A = prof[Math.max(0, j - 1)], B = prof[Math.min(n - 1, j + 1)], dr = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dr, dy) || 1, nr = -dy / l, ny = dr / l;
      if (prof[j][2]) m.c = burnsRGB(prof[j][2]); if (prof[j][3] !== undefined) m.e = prof[j][3];
      for (let i = 0; i < cols; i++) { const th = t0 + (t1 - t0) * i / seg, sn = Math.sin(th), cs = Math.cos(th), r = prof[j][0]; m.tp(r * sn, prof[j][1], r * cs, P); m.tn(nr * sn, ny, nr * cs, N); m.vert(P[0], P[1], P[2], N[0], N[1], N[2], wu, wv); }
      m.c = c0; m.e = e0;
    }
    const qs = full ? cols : cols - 1;
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < qs; i++) { const i1 = (i + 1) % cols, a = base + j * cols + i, b = base + j * cols + i1, c = base + (j + 1) * cols + i1, d = base + (j + 1) * cols + i; m.ind.push(a, c, b, a, d, c); }
    return m;
  },
  // ring: torus around local Y unless pitch/roll given (roll = PI/2 -> wheel standing in the YZ plane)
  ring(m, x, y, z, R, r, o) { o = o || {}; m.push(); m.tf(x, y, z, o.yaw || 0, o.pitch || 0, o.roll || 0); m.torus(0, 0, 0, R, r, o); m.pop(); return m; },
  post(m, x, y, z, r, h, o) { m.roundCyl(x, y, z, r, h, o && o.edge !== undefined ? o.edge : r * 0.4, o); return m; },
  cone(m, x, y, z, r, h, o) { return this.lathe(m, x, y, z, [[0, 0], [r, 0], [r, 0], [r * 0.08, h * 0.95], [0, h]], o); },
  // puffy heart facing +Z, centre at (x,y,z), size s (~width)
  heart(m, x, y, z, s, o) {
    o = o || {};
    const d = o.depth || 0.5;
    m.push(); m.tf(x, y, z);
    m.ellipsoid(-0.26 * s, 0.12 * s, 0, 0.3 * s, 0.3 * s, 0.22 * s * d * 2);
    m.ellipsoid(0.26 * s, 0.12 * s, 0, 0.3 * s, 0.3 * s, 0.22 * s * d * 2);
    m.push(); m.tf(0, 0.18 * s, 0, 0, Math.PI, 0); m.lathe([[0, 0], [0.5 * s, 0.02 * s], [0.42 * s, 0.25 * s], [0.06 * s, 0.68 * s], [0, 0.72 * s]], { seg: 14, sz: d * 0.9 }); m.pop();
    m.pop();
    return m;
  },
  /* ---------- props (return {cols, lights}) ---------- */
  // playa lamp post (warm lantern) — h ~3.4m
  lamp(m, o) {
    o = o || {}; const h = o.h || 3.4, col = o.col || '#ffb860';
    m.color('#3a2e2a'); this.post(m, 0, 0, 0, 0.09, h);
    m.color('#2a2224'); this.limb(m, 0, h - 0.1, 0, 0.55, h + 0.12, 0, 0.04);
    m.color(col, 1); this.egg(m, 0.62, h - 0.18, 0, 0.16, 0.22, 0.16); m.emissive(0);
    m.color('#2a2224'); this.lathe(m, 0.62, h + 0.02, 0, [[0.2, 0], [0.12, 0.12], [0, 0.16]], { seg: 10 });
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.12, y0: 0, y1: h, camPass: true, walk: false }], lights: [{ x: 0.62, y: h - 0.18, z: 0, s: o.s || 1.6, c: col, pool: o.pool === undefined ? 9 : o.pool }] };
  },
  // clock-street signpost: blade A (clock street) along local X, blade B (letter street) along local Z
  signpost(m, o) {
    o = o || {};
    const st = { bg: '#24102e', fg: '#fff2c8', size: 24, border: '#ff9ad8', pad: 10 };
    m.color('#2e2630'); this.post(m, 0, 0, 0, 0.07, 3.3);
    const blade = (text, y, yaw) => {
      const reg = BURNS_ATLAS.sign(text, st), bh = 0.36, bw = Math.max(0.7, bh * reg.aspect);
      m.push(); m.tf(0, y, 0, yaw);
      m.color('#24102e'); this.rb(m, bw / 2 - 0.05, 0, 0, bw, bh + 0.06, 0.06, 0.03);
      m.color('#ffffff', 0.55); m.decal(bw / 2 - 0.05, 0, 0.032, bw - 0.02, bh, reg); m.push(); m.tf(bw - 0.1, 0, 0, Math.PI); m.decal(bw / 2 - 0.05, 0, 0.032, bw - 0.02, bh, reg); m.pop(); m.emissive(0);
      m.pop();
    };
    blade(o.a, 3.0, o.yawA || 0); blade(o.b, 2.55, o.yawB === undefined ? Math.PI / 2 : o.yawB);
    m.color('#ff9ad8', 1); this.ball(m, 0, 3.36, 0, 0.09); m.emissive(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.1, y0: 0, y1: 3.3, camPass: true, walk: false }], lights: [{ x: 0, y: 3.36, z: 0, s: 0.5, c: '#ff9ad8' }] };
  },
  // a bicycle: wheels in local Z (front +Z), y = ground. o: { led, basket, lo }
  bike(m, col, o) {
    o = o || {};
    const wr = 0.34, fz = 0.52, rz = -0.5, lo0 = m.lo; if (o.lo) m.lo = true;
    for (const z of [fz, rz]) {
      m.color('#18181c'); this.ring(m, 0, wr, z, wr - 0.03, 0.035, { roll: Math.PI / 2, seg: m.segs(14, 9), tseg: m.segs(5, 3) });
      if (o.led) { m.color(o.led, 1); this.ring(m, 0, wr, z, wr - 0.09, 0.016, { roll: Math.PI / 2, seg: m.segs(12, 8), tseg: 3 }); m.emissive(0); }
      m.color('#9a9aa2'); this.ball(m, 0, wr, z, 0.045, { seg: 6, rings: 4 });
    }
    m.color(col || '#ffd21a').shine(2);
    const bb = [0, 0.3, -0.02], seat = [0, 0.8, -0.14], head = [0, 0.86, 0.36], rh = [0, wr, rz], fh = [0, wr, fz], ls = { seg: m.segs(6, 4) };
    this.limb(m, rh[0], rh[1], rh[2], bb[0], bb[1], bb[2], 0.026, 0.026, ls); this.limb(m, bb[0], bb[1], bb[2], seat[0], seat[1], seat[2], 0.03, 0.03, ls);
    this.limb(m, seat[0], seat[1], seat[2], rh[0], rh[1], rh[2], 0.022, 0.022, ls); this.limb(m, bb[0], bb[1], bb[2], head[0], head[1], head[2], 0.032, 0.032, ls);
    this.limb(m, head[0], head[1], head[2], fh[0], fh[1], fh[2], 0.026, 0.026, ls);
    m.shine(0);
    m.color('#26262a'); this.egg(m, 0, 0.86, -0.16, 0.08, 0.035, 0.13, { seg: 8, rings: 5 });
    m.color('#c8c8d0').shine(2); this.limb(m, -0.24, 0.94, 0.34, 0.24, 0.94, 0.34, 0.017, 0.017, ls); this.limb(m, 0, 0.86, 0.36, 0, 0.94, 0.34, 0.02, 0.02, ls); m.shine(0);
    if (o.basket) { m.color(o.basket === true ? '#e8e0d0' : o.basket); this.rb(m, 0, 0.8, 0.6, 0.32, 0.2, 0.24, 0.05); }
    m.lo = lo0;
    return { cols: [], lights: o.led ? [{ x: 0, y: 0.95, z: 0.3, s: 0.7, c: o.led }] : [] };
  },
  // giant soft pillow / cushion (rounded box)
  pillow(m, x, y, z, w, h, d, col, o) { m.color(col); this.rb(m, x, y + h / 2, z, w, h, d, Math.min(w, h, d) * 0.45, o); return { t: 'box', x, z, hx: w / 2, hz: d / 2, y0: y, y1: y + h * 0.85 }; },
  // rounded dome tent (hemisphere-ish) with a door flap
  tent(m, o) {
    o = o || {}; const r = o.r || 1.3, col = o.col || '#3a8a6a';
    m.color(col); this.egg(m, 0, 0, 0, r, r * 0.85, r * 1.1, { phi1: Math.PI / 2, seg: 12, rings: 6 });
    m.color(shade(col, -0.25)); this.egg(m, 0, 0, r * 1.02, r * 0.38, r * 0.6, 0.12, { phi1: Math.PI / 2, seg: 8, rings: 4 });
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: r * 0.9, y0: 0, y1: r * 0.8 }], lights: [] };
  },
  // lantern string between two local points (glows only, no geometry)
  stringLights(x0, y0, z0, x1, y1, z1, n, sag, cols) {
    const out = [];
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; out.push({ x: lerp(x0, x1, t), y: lerp(y0, y1, t) - Math.sin(t * Math.PI) * (sag || 0.4), z: lerp(z0, z1, t), s: 0.32, c: (cols || BURNS_NEON)[i % (cols || BURNS_NEON).length] }); }
    return out;
  },
  /* ---------- riders: an actor on a bicycle mover ---------- */
  // call in build: returns a mover holding a bike mesh; give it to an actor def as def.bikeMv
  bikeMover(api, col, o) {
    const mv = api.mover(m => this.bike(m, col, o), {});
    mv.noCollide = true; mv.visible = true;
    return mv;
  },
  /* ---------- attachments: rigid meshes following an actor bone ---------- */
  // model: { geo, nb: 1 } built from a BurnsMesh (bone 0); drawn with the actor's bone matrix
  attModel(key, build) {
    const C = this._attCache || (this._attCache = {});
    if (C[key]) return C[key];
    const m = new BurnsMesh(1024); m.setBone(0); build(m);
    return (C[key] = { geo: m.geo(), nb: 1 });
  },
  attach(a, model, bone, when) { if (this.S) this.S.att.push({ a, model, bone, when }); },
  // head-bone gear (head joint at the origin, face toward +Z)
  gear: {
    respirator(m) { m.color('#3a3a40').shine(1); BURNS_W234.egg(m, 0, 0.11, 0.17, 0.095, 0.08, 0.07, { seg: 10, rings: 6 }); for (const s of [-1, 1]) { m.push(); m.tf(s * 0.095, 0.08, 0.2, 0, 0.5, s * -0.6); m.color('#e8c020'); m.roundCyl(0, -0.03, 0, 0.048, 0.065, 0.014, { seg: 10 }); m.pop(); } m.shine(0); m.color('#1a1a1e'); BURNS_W234.ring(m, 0, 0.15, 0.0, 0.19, 0.011, { pitch: 0.25, seg: 16, tseg: 3 }); },
    headlamp(m) { m.color('#1a1a1e'); BURNS_W234.ring(m, 0, 0.28, -0.005, 0.19, 0.014, { seg: 18, tseg: 3 }); m.color('#3a3a40'); BURNS_W234.rb(m, 0, 0.28, 0.19, 0.08, 0.06, 0.045, 0.014); m.color('#fff4c8', 1); BURNS_W234.egg(m, 0, 0.28, 0.215, 0.03, 0.03, 0.012, { seg: 8, rings: 4 }); m.emissive(0); },
    crystal(m) { m.color('#c8f0ff', 0.4).shine(3); BURNS_W234.lathe(m, 0, -0.06, 0.12, [[0, 0], [0.05, 0.05], [0.04, 0.12], [0, 0.17]], { seg: 6 }); m.shine(0).emissive(0); }
  },
  /* ---------- parades: movers looping along a closed path ---------- */
  // o: { path: [[x,z]...] (closed), builds: [fn(m) -> {cols, lights, len}], n, speed }
  parade(api, o) {
    const pts = o.path, seg = []; let L = 0;
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push({ x: a[0], z: a[1], dx: (b[0] - a[0]) / l, dz: (b[1] - a[1]) / l, l, s0: L }); L += l; }
    const P = { seg, L, cars: [], speed: o.speed || 2.4, v: o.speed || 2.4, stopped: false, hurtT: 0 };
    const n = o.n || 12;
    for (let i = 0; i < n; i++) {
      const b = o.builds[i % o.builds.length];
      const mv = api.mover(m => b(m, i), { lodTwin: true });   // builders are deterministic: far cars use the m.lo copy
      P.cars.push({ mv, s: (i / n) * L, len: mv.info.len || 7, w: mv.info.w || 3.6, i });
    }
    for (const c of P.cars) this.paradePlace(P, c);
    if (this.S) this.S.parades.push(P);
    return P;
  },
  paradeAt(P, s, out) {
    s = ((s % P.L) + P.L) % P.L;
    let k = 0; const seg = P.seg; while (k < seg.length - 1 && s > seg[k].s0 + seg[k].l) k++;
    const G = seg[k], t = s - G.s0; out.x = G.x + G.dx * t; out.z = G.z + G.dz * t; return out;
  },
  paradePlace(P, c) {
    const a = this.paradeAt(P, c.s + c.len * 0.45, {}), b = this.paradeAt(P, c.s - c.len * 0.45, {});
    c.mv.x = (a.x + b.x) / 2; c.mv.z = (a.z + b.z) / 2; c.mv.yaw = Math.atan2(a.x - b.x, a.z - b.z); c.mv.y = 0;
  },
  paradeStep(g, P, dt) {
    P.v = approach(P.v, P.stopped ? 0 : P.speed, dt * 1.5);
    const p = g.player;
    for (const c of P.cars) {
      c.s += P.v * dt;
      this.paradePlace(P, c);
      c.mv.pitch = Math.sin(g.time * 3 + c.i) * 0.006 * (P.v > 0.2 ? 1 : 0);
      // don't stand in front of a moving art car
      if (P.v > 0.5 && !p.dead && p.invT <= 0 && p.y < 1.2) {
        const dx = p.x - c.mv.x, dz = p.z - c.mv.z, cs = Math.cos(c.mv.yaw), sn = Math.sin(c.mv.yaw);
        const lx = dx * cs - dz * sn, lz = dx * sn + dz * cs;
        if (Math.abs(lx) < c.w / 2 + 0.2 && lz > c.len / 2 - 0.4 && lz < c.len / 2 + 0.7) {
          p.hurt(1, c.mv.x - sn * 0, c.mv.z, 8); p.say(['ART CAR!', 'Beep beep!', 'Parade, not pedestrians!'][c.i % 3], 1);
          if (P.onHit) P.onHit(g, c);
        }
      }
    }
  },
  /* ---------- drawing (call from def.drawSkinned) ---------- */
  drawSkinned(g, R) {
    const S = this.S; if (!S) return;
    for (const t of S.att) {
      const a = t.a; if (!a || (t.when && !t.when(g))) continue;
      if (a === g.player) { if (a.invT > 0 && !a.dead && Math.floor(g.time * 14) % 2 === 0) continue; R.skin(t.model.geo, a.ch.bones.subarray(t.bone * 12, t.bone * 12 + 12), 1, null, 0, 0.45); continue; }
      if (a.removed || a.hidden || !a._vis) continue;
      R.skin(t.model.geo, a.ch.bones.subarray(t.bone * 12, t.bone * 12 + 12), 1, a.ch.tint, 0, 0.3);
    }
    // loads lying on the ground (see carryStart)
    if (S.loads) for (const L of S.loads) {
      const c = g.cam, d2 = (L.x - c.x) * (L.x - c.x) + (L.z - c.z) * (L.z - c.z); if (d2 > 90 * 90) continue;
      BurnsM.a34Set(L.m12, 0, L.x, L.y, L.z, L.yaw, L.pitch || 0, 0, 1, 1, 1);
      R.skin(L.o.ground.geo, L.m12, 1, null, 0, 0.35);
    }
  },
  /* ---------- small utils ---------- */
  near(g, x, z, r) { const p = g.player; return Math.hypot(p.x - x, p.z - z) < r; },
  costumeOn() { const c = BurnsSave.get().costume; return !!c && c !== 'none'; }
};

/* ---------- cast: the user's burner figures (stand-ins until the engine ships the types) ----------
   BURNS_W234.castDef(kind, seed, def) -> an actor def with the look; gear attaches in wireGear(g).
   If the engine knows the type (BURNS_LINES[type] exists), the engine look is used instead. */
BURNS_W234.engineType = function (type) { try { return typeof BURNS_NPC_TYPES !== 'undefined' && !!BURNS_NPC_TYPES[type]; } catch (e) { return false; } };
BURNS_W234.CAST = {
  firespinner(seed) {
    const s = Object.assign(BurnsRig.npcSpec('burner', seed), { top: { kind: 'crop', col: '#6a4a2e', pattern: 'sequin' }, bottom: { kind: 'kilt', col: '#ff7a2a', pattern: 'flames' }, shoes: { kind: 'boots', col: '#c8a070' }, hat: null, goggles: false, glasses: null, coat: null, led: null, paint: null, prop: null, hair: { style: 'buzz', col: '#2a1a12', hi: '#3a2a1a' }, acc: ['bracelets'], body: { h: 1.0, w: 0.95 }, key: 'w234:fire:' + (seed % 4) });
    return { spec: s, gear: [['firehood', BURNS_BONES.HEAD], ['firewings', BURNS_BONES.CHEST]] };
  },
  darkwad(seed) {
    const s = Object.assign(BurnsRig.npcSpec('techbro', seed), { top: { kind: 'hoodie', col: '#141418' }, vest: null, bottom: { kind: 'cargo', col: '#121216' }, shoes: { kind: 'sneakers', col: '#5a5a62', sole: '#3a3a40' }, hair: { style: 'buzz', col: '#141010', hi: '#2a2020' }, glasses: 'shades', face: 'smug', prop: null, acc: [], led: null, key: 'w234:darkwad:' + (seed % 3) });
    return { spec: s, gear: [['backpack', BURNS_BONES.CHEST], ['litNecklace', BURNS_BONES.CHEST, a => a.w234lit]] };
  },
  cop(seed) {
    const s = Object.assign(BurnsRig.npcSpec('techbro', seed), { top: { kind: 'button', col: '#ff7a2a', pattern: 'tiedye' }, vest: 'fleece', vestCol: '#16161c', bottom: { kind: 'shorts', col: '#c8b48a' }, shoes: { kind: 'sneakers', col: '#f4f4f4', sole: '#d8d8d8' }, hair: { style: 'buzz', col: '#5a4030', hi: '#6a5040' }, glasses: 'shades', face: 'stern', prop: 'radio', acc: ['bracelets'], key: 'w234:cop' });
    return { spec: s, gear: [['jester', BURNS_BONES.HEAD], ['badge', BURNS_BONES.CHEST]] };
  },
  furry(seed) {
    const s = Object.assign(BurnsRig.npcSpec('burner', seed), { skin: '#a8987c', skinSh: '#8a7a62', top: { kind: 'hoodie', col: '#a8987c', pattern: 'leopard' }, bottom: { kind: 'leggings', col: '#a8987c', pattern: 'leopard' }, shoes: { kind: 'furboots', col: '#6a6052' }, coat: null, hat: null, goggles: false, glasses: null, hair: { style: 'bald', col: '#a8987c', hi: '#a8987c' }, acc: ['bracelets'], led: '#38f2ff', body: { h: 1.04, w: 1.14 }, key: 'w234:furry' });
    return { spec: s, gear: [['furhead', BURNS_BONES.HEAD], ['harness', BURNS_BONES.CHEST], ['pawL', BURNS_BONES.FARM_L], ['pawR', BURNS_BONES.FARM_R]] };
  },
  greeterW(seed) {
    const s = Object.assign(BurnsRig.npcSpec('tutu', seed), { top: { kind: 'crop', col: '#2ac8c0', pattern: 'sequin' }, bottom: { kind: 'tutu', col: '#9aff3a' }, shoes: { kind: 'sneakers', col: '#ff4fd8', sole: '#ffe24a' }, hair: { style: 'long', col: '#3a2216', hi: '#b8844a' }, glasses: 'heart', goggles: false, face: 'greeter', acc: ['bracelets', 'lei'], key: 'w234:greeterW' });
    return { spec: s, gear: [['sunhat', BURNS_BONES.HEAD], ['sign:greeter', BURNS_BONES.PROP]] };
  },
  greeterM(seed) {
    const s = Object.assign(BurnsRig.npcSpec('burner', seed), { top: { kind: 'button', col: '#ff8a2a', pattern: 'tiedye' }, bottom: { kind: 'cargo', col: '#ff4fd8' }, shoes: { kind: 'sneakers', col: '#7aff5a', sole: '#ffffff' }, hair: { style: 'short', col: '#2a1a12', hi: '#3a2a1a' }, glasses: 'shades', face: 'beard', hat: null, goggles: false, coat: null, paint: null, acc: ['bracelets', 'ledNecklace'], key: 'w234:greeterM' });
    return { spec: s, gear: [['fedora', BURNS_BONES.HEAD], ['sign:greeter', BURNS_BONES.PROP]] };
  },
  lamplighter(seed) {
    const s = Object.assign(BurnsRig.npcSpec('burner', seed), { top: { kind: 'tee', col: '#f4ecd8' }, coat: { kind: 'kimono', col: '#f8f0dc', trim: '#e8d8b0' }, bottom: { kind: 'leggings', col: '#efe4cc' }, shoes: { kind: 'sneakers', col: '#a07848', sole: '#7a5a38' }, hat: null, goggles: false, glasses: null, led: null, paint: null, prop: null, hair: { style: 'short', col: '#3a2a1a', hi: '#4a3a2a' }, face: 'friendly', acc: ['toolbelt'], key: 'w234:lamplighter:' + (seed % 3) });
    return { spec: s, gear: [['headwrap', BURNS_BONES.HEAD], ['lanternPoles', BURNS_BONES.CHEST]] };
  },
  healer(seed) {
    const s = Object.assign(BurnsRig.npcSpec('burner', seed), { skin: '#e8c0a0', skinSh: '#c89a7a', top: { kind: 'tee', col: '#f8f6f0' }, coat: { kind: 'kimono', col: '#fbf8f2', trim: '#e8e0ff' }, bottom: { kind: 'leggings', col: '#f4f0e8' }, shoes: { kind: 'sneakers', col: '#e8c0a0', sole: '#d8a888' }, hat: null, goggles: false, glasses: null, hair: { style: 'long', col: '#c8a878', hi: '#f0d8a8' }, face: 'sleepy', acc: ['bracelets'], led: null, paint: null, key: 'w234:healer' });
    return { spec: s, gear: [['crystal', BURNS_BONES.CHEST]] };
  }
};
BURNS_W234.castDef = function (kind, seed, def) {
  const engineKind = { firespinner: 'firespinner', darkwad: 'darkwad', cop: 'undercovercop', furry: 'furry', greeterW: 'greeter_f', greeterM: 'greeter_m', healer: 'healer', lamplighter: 'lamplighter' }[kind];
  def = def || {};
  if (engineKind && this.engineType(engineKind)) { def.type = engineKind; def.seed = seed; if (kind === 'darkwad') def.w234gear = [['litNecklace', BURNS_BONES.CHEST, a => a.w234lit]]; return def; }
  const c = this.CAST[kind](seed);
  def.spec = c.spec; def.w234gear = c.gear; def.type = def.type || c.spec.kind; def.seed = seed;
  return def;
};
// gear meshes (bone-local; head joint at the origin, face toward +Z)
BURNS_W234.GEAR = {
  firehood(m) { const W = BURNS_W234; m.color('#4a3426'); W.egg(m, 0, 0.2, -0.01, 0.2, 0.215, 0.195, { seg: 12, rings: 8 }); m.color('#2a1e18'); W.egg(m, 0, 0.17, 0.1, 0.17, 0.17, 0.1, { seg: 10, rings: 6 }); m.color('#ff8a1a', 1); W.rb(m, 0, 0.235, 0.188, 0.24, 0.045, 0.03, 0.015); m.emissive(0); m.color('#c8c8d0').shine(2); W.ring(m, 0, 0.02, 0, 0.13, 0.02, { seg: 12, tseg: 4 }); m.shine(0); },
  firewings(m) {
    const W = BURNS_W234;
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const a = 0.35 + k * 0.32; m.push(); m.tf(s * 0.15, 0.42, -0.15, s * 0.3, -0.25, s * a); m.color(['#ff4a1a', '#ff7a1a', '#ffb02a', '#ffe24a'][k], 0.55); W.egg(m, 0, 0.28, 0, 0.06, 0.3, 0.02, { seg: 8, rings: 6 }); m.pop(); }
    m.emissive(0); m.color('#d8b040').shine(3); W.ring(m, 0, 0.3, 0.135, 0.06, 0.016, { pitch: Math.PI / 2, seg: 14, tseg: 4 }); m.color('#ff9a2a', 0.6); W.egg(m, 0, 0.3, 0.14, 0.05, 0.05, 0.012, { seg: 10, rings: 4 }); m.shine(0).emissive(0);
  },
  backpack(m) { m.color('#101014'); BURNS_W234.rb(m, 0, 0.3, -0.19, 0.3, 0.36, 0.14, 0.06); for (const s of [-1, 1]) BURNS_W234.limb(m, s * 0.12, 0.47, 0.03, s * 0.12, 0.08, 0.135, 0.018); },
  litNecklace(m) { m.color('#7aff5a', 1); BURNS_W234.ring(m, 0, 0.46, 0.02, 0.16, 0.018, { pitch: -0.35, seg: 16, tseg: 4 }); m.color('#ff4fd8', 1); BURNS_W234.ring(m, 0, 0.0, 0, 0.2, 0.018, { seg: 16, tseg: 4 }); m.emissive(0); },
  jester(m) {
    const W = BURNS_W234; m.color('#2a6ad8'); W.egg(m, 0, 0.36, -0.01, 0.19, 0.08, 0.18, { seg: 12, rings: 6, phi1: Math.PI / 2 });
    [['#e83a2a', -1, 0], ['#ffd21a', 0, 1], ['#2ab84a', 1, 0]].forEach(([c, sx, up]) => { m.color(c); W.tube(m, [[sx * 0.08, 0.38, -0.02], [sx * 0.2, 0.55 + up * 0.15, -0.05], [sx * 0.3, 0.42 + up * 0.25, -0.08]], 0.045); m.color('#ffd84a').shine(3); W.ball(m, sx * 0.3, 0.4 + up * 0.25, -0.08, 0.04, { seg: 8, rings: 5 }); m.shine(0); });
  },
  badge(m) { m.color('#d8b040').shine(3); BURNS_W234.ring(m, 0, 0.42, 0.13, 0.11, 0.012, { pitch: -0.3, seg: 16, tseg: 3 }); BURNS_W234.egg(m, 0, 0.3, 0.155, 0.045, 0.045, 0.012, { seg: 10, rings: 4 }); BURNS_W234.egg(m, 0.1, 0.33, 0.14, 0.035, 0.04, 0.01, { seg: 6, rings: 4 }); m.shine(0); },
  furhead(m) {
    const W = BURNS_W234;
    m.color('#a8987c'); W.egg(m, 0, 0.22, 0.0, 0.25, 0.25, 0.24, { seg: 14, rings: 9, colFn: (x, y, z) => (z > 0.12 && y < -0.02) ? '#f4f0e8' : (Math.sin(x * 40) * Math.cos(y * 35) > 0.6 ? '#7a6a52' : null) });
    m.color('#f4f0e8'); W.egg(m, 0, 0.12, 0.2, 0.12, 0.09, 0.12, { seg: 10, rings: 6 }); m.color('#1a1a1e'); W.ball(m, 0, 0.15, 0.32, 0.035, { seg: 8, rings: 5 });
    for (const s of [-1, 1]) { m.color('#ffffff'); W.egg(m, s * 0.1, 0.26, 0.2, 0.07, 0.08, 0.05, { seg: 10, rings: 6 }); m.color('#3aaa3a', 0.2); W.egg(m, s * 0.105, 0.26, 0.235, 0.045, 0.055, 0.025, { seg: 10, rings: 5 }); m.color('#101010'); W.egg(m, s * 0.11, 0.26, 0.255, 0.022, 0.03, 0.012, { seg: 8, rings: 4 }); m.emissive(0);
      m.push(); m.tf(s * 0.15, 0.4, -0.02, 0, 0, -s * 0.35); m.color('#a8987c'); W.lathe(m, 0, 0, 0, [[0.09, 0], [0.07, 0.12], [0, 0.26]], { seg: 8, sz: 0.5 }); m.color('#ff4f9a'); W.lathe(m, 0, 0.01, 0.025, [[0.05, 0], [0.035, 0.1], [0, 0.2]], { seg: 6, sz: 0.3 }); m.pop(); }
    m.color('#ff4f9a'); W.ball(m, -0.03, 0.47, 0.02, 0.07, { seg: 8, rings: 5 }); m.color('#2ac8c0'); W.ball(m, 0.05, 0.46, -0.02, 0.06, { seg: 8, rings: 5 });
  },
  harness(m) { const W = BURNS_W234; m.color('#16161a'); W.limb(m, -0.17, 0.46, 0.13, 0.17, 0.12, 0.14, 0.022); W.limb(m, 0.17, 0.46, 0.13, -0.17, 0.12, 0.14, 0.022); ['#ff4fd8', '#ffe24a', '#7aff5a'].forEach((c, i) => { m.color(c); W.egg(m, -0.08 + i * 0.08, 0.28, 0.15, 0.03, 0.03, 0.012, { seg: 8, rings: 4 }); }); m.color('#2ac8c0'); W.tube(m, [[0.18, 0.48, 0.02], [0.05, 0.3, -0.16], [-0.16, 0.1, -0.1]], 0.025); },
  pawL(m) { BURNS_W234.GEAR.paw(m); }, pawR(m) { BURNS_W234.GEAR.paw(m); },
  paw(m) { const W = BURNS_W234; ['#ff4f9a', '#ff9a2a', '#2ac8c0'].forEach((c, i) => { m.color(c); W.ring(m, 0, -0.06 - i * 0.06, 0, 0.065, 0.02, { seg: 10, tseg: 4 }); }); m.color('#a8987c'); W.egg(m, 0, -0.3, 0.01, 0.08, 0.09, 0.08, { seg: 10, rings: 6 }); m.color('#202020'); for (let k = -1; k <= 1; k++) W.ball(m, k * 0.035, -0.38, 0.05, 0.015, { seg: 5, rings: 3 }); },
  sunhat(m) { const W = BURNS_W234; m.color('#ff3bb8'); W.lathe(m, 0, 0.33, -0.01, [[0.36, 0], [0.34, 0.03], [0.2, 0.05], [0.18, 0.14], [0.1, 0.19], [0, 0.2]], { seg: 16 }); m.color('#ffe24a', 0.6); W.ring(m, 0, 0.39, -0.01, 0.185, 0.018, { seg: 16, tseg: 3 }); m.emissive(0); },
  fedora(m) { const W = BURNS_W234; m.color('#e8d49a'); W.lathe(m, 0, 0.34, -0.01, [[0.3, 0], [0.28, 0.025], [0.17, 0.035], [0.16, 0.15], [0.08, 0.18], [0, 0.17]], { seg: 14 }); m.color('#3a2a1a'); W.ring(m, 0, 0.4, -0.01, 0.165, 0.02, { seg: 14, tseg: 3 }); },
  headwrap(m) { const W = BURNS_W234; m.color('#fbf6ea'); W.egg(m, 0, 0.27, -0.02, 0.2, 0.17, 0.2, { seg: 12, rings: 7, phi1: Math.PI * 0.62 }); W.ring(m, 0, 0.31, -0.02, 0.18, 0.04, { pitch: 0.2, seg: 14, tseg: 5 }); W.limb(m, 0, 0.3, -0.18, 0.02, 0.05, -0.24, 0.05, 0.03); },
  lanternPoles(m) {
    const W = BURNS_W234;
    for (const s of [-1, 1]) {
      m.color('#8a6a42'); W.limb(m, s * 0.1, 0.1, -0.12, s * 0.5, 1.75, -0.28, 0.022);
      m.color('#3a3028'); W.limb(m, s * 0.5, 1.75, -0.28, s * 0.62, 1.72, -0.28, 0.012); W.limb(m, s * 0.62, 1.72, -0.28, s * 0.62, 1.6, -0.28, 0.008);
      m.color('#ffcf7a', 1); W.egg(m, s * 0.62, 1.48, -0.28, 0.075, 0.1, 0.075, { seg: 10, rings: 6 }); m.emissive(0); m.color('#3a3028'); W.lathe(m, s * 0.62, 1.57, -0.28, [[0.085, 0], [0.04, 0.05], [0, 0.06]], { seg: 8 });
    }
  },
  crystal(m) { const W = BURNS_W234; m.color('#d8b040'); W.ring(m, 0, 0.42, 0.06, 0.13, 0.008, { pitch: -0.5, seg: 14, tseg: 3 }); m.color('#d8f4ff', 0.45).shine(3); W.lathe(m, 0, 0.12, 0.15, [[0, 0], [0.07, 0.07], [0.06, 0.16], [0, 0.24]], { seg: 6 }); m.shine(0).emissive(0); },
  greeterSign(m) {
    const W = BURNS_W234; m.color('#8a6a3a'); W.limb(m, 0, -0.05, 0.03, 0, 0.55, 0.03, 0.018);
    const reg = BURNS_ATLAS.sign('GREETER', { bg: '#f4e2b0', fg: '#3a1a10', size: 26, border: '#8a5a2a', pad: 8 }), w = 0.36, h = w / reg.aspect;
    m.color('#c8a060'); W.rb(m, 0, 0.62, 0.03, w + 0.04, h + 0.04, 0.03, 0.01); m.color('#ffffff'); m.decal(0, 0.62, 0.047, w, h, reg); m.push(); m.tf(0, 0, 0.06, Math.PI); m.decal(0, 0.62, 0.047, w, h, reg); m.pop();
  }
};
BURNS_W234.wireGear = function (g) {
  for (const a of g.actors) {
    const G = a.def.w234gear; if (!G) continue;
    for (const [name, bone, when] of G) {
      const key = name === 'sign:greeter' ? 'sign:greeter' : 'gear:' + name, fn = name === 'sign:greeter' ? this.GEAR.greeterSign : this.GEAR[name];
      if (!fn) continue;
      this.attach(a, this.attModel(key, m => fn(m)), bone, when ? (g2 => when(a, g2)) : null);
    }
  }
};
// the darkwad: no lights at all. Nearly invisible until close; bumping into him knocks you down.
// Spin or stomp him to stick glow sticks on him (a.w234lit). def: { path, speed }
BurnsBehaviors.register('w234Darkwad', {
  init(a) { a.data.i = 0; a.data.cd = 0; a.ch.rim = 0; if (!a.w234draw) { a.w234draw = true; const d0 = a.draw; a.draw = function (R) { d0.call(this, R); const p = this.g.player, d = Math.hypot(p.x - this.x, p.z - this.z), lsd = p.power === 'lsd' && p.powerT > 0; const lamp = this.g.w234lamp && d < 15; const k = (this.w234lit || lsd || lamp) ? 0 : clamp((d - 2.2) / 4, 0, 0.94); if (k > 0.01 && !(this.hurtT > 0)) this.ch.tint = [0.012, 0.01, 0.018, k]; this.ch.rim = this.w234lit ? 0.35 : 0; }; } },
  update(a, g, dt) {
    const D = a.data, p = g.player, P = a.def.path;
    if (D.cd > 0) D.cd -= dt;
    if (P && P.length) { const t = P[D.i], d = a.moveTo(t[0], t[1], a.def.speed || 1.1, dt, 0.4); if (d < 0.6 || (D.bump || 0) > 60) { D.bump = 0; D.i = (D.i + 1) % P.length; } a.ch.play(a.w234lit ? 'dance' : 'walk', a.w234lit ? { style: 1 } : { rate: 0.8 }); }
    else { a.ch.play(a.w234lit ? 'dance' : 'phone'); a.vx = a.vz = 0; }
    if (!a.w234lit && D.cd <= 0 && !p.dead && p.invT <= 0 && Math.hypot(p.x - a.x, p.z - a.z) < a.r + p.r + 0.15 && p.y < a.y + 1.4) {
      D.cd = 1.5; p.hurt(1, a.x, a.z, 9); a.say(['Watch it!', 'Hey! I was standing here!', 'Who turned off the... oh. Me.', 'Lights are for tourists.'][Math.floor(Math.random() * 4)], 1.6);
    }
    a.physics(dt);
  },
  hit(a, g) {
    if (a.w234lit) return false;
    a.w234lit = true; a.say(['Whoa. I\'m... visible?', 'Is this what being seen feels like?', 'I GLOW. I\'M A GLOW GUY NOW.'][Math.floor(Math.random() * 3)], 2.4);
    g.fx.confetti(a.x, a.y + 1.8, a.z, 20); burnsSfx('pick'); g.missions.event('w234lit', a);
    return 'handled';
  }
});
// the undercover cop: dances badly ("groovy") and chases you if he spots a ground-score power-up
BurnsBehaviors.register('w234Cop', {
  init(a) { a.data.mode = 'blend'; a.data.t = Math.random() * 5; a.data.cd = 0; },
  update(a, g, dt) {
    const D = a.data, p = g.player, d = a.distP(), holding = a.def.suspect ? !!a.def.suspect(g, a) : !!(p.power && p.powerT > 0 && p.power !== 'water');
    D.t += dt; if (D.cd > 0) D.cd -= dt;
    if (D.mode === 'dazed') { D.dz -= dt; a.ch.play('hurt'); a.yaw += dt * 4; a.vx = BurnsM.damp(a.vx, 0, 5, dt); a.vz = BurnsM.damp(a.vz, 0, 5, dt); if (D.dz <= 0) D.mode = 'blend'; }
    else if (D.mode === 'chase') {
      if (!holding || d > 24) { D.mode = 'blend'; a.say(['...Groovy.', 'I lost him. I mean. Far out.', 'Copy. Suspect has... vibed away.'][Math.floor(Math.random() * 3)], 1.8); }
      else {
        a.moveTo(p.x, p.z, a.def.chaseSpeed || 5.4, dt, 0.5); a.ch.play('run', { rate: 0.9 });
        if (Math.random() < dt * 0.4) { const L = a.def.chaseLines || ['SIR! IS THAT A... GROOVY BAGGIE?', 'STOP! IN THE NAME OF... RADICAL SELF-EXPRESSION!', 'I JUST WANNA TALK! ABOUT THE BAGGIE!']; a.say(L[Math.floor(Math.random() * L.length)], 1.4); }
        if (a.touching(0.2) && D.cd <= 0) { D.cd = 3; if (a.def.onCatch) a.def.onCatch(g, a); else { const P = BURNS_POWERUPS[p.power]; p.endPower(true); g.toast('CONFISCATED: ' + (P ? P.label : 'BAGGIE')); a.say('This is... evidence. Groovy evidence.', 2.4); burnsSfx('powerdown'); p.knock((p.x - a.x) * 3, 5, (p.z - a.z) * 3); } D.mode = 'blend'; }
      }
    } else {
      const hx = a.home.x + Math.sin(D.t * 0.21) * 2.5, hz = a.home.z + Math.cos(D.t * 0.17) * 2.5;
      const dd = a.moveTo(hx, hz, 0.9, dt, 0.5);
      a.ch.play(dd > 0.8 ? 'walk' : 'dance', dd > 0.8 ? { rate: 0.7 } : { style: 3, bpm: 92 });
      if (Math.random() < dt * 0.1 && d < 12) a.say(['Groovy.', 'Far out, fellow burner.', 'I, too, enjoy... the bass.', 'Nobody here is a cop. Especially not me.', 'Whoops, that\'s my badge. It\'s a... costume badge.'][Math.floor(Math.random() * 5)], 2.2);
      if (holding && D.cd <= 0 && d < (a.def.view || 14) && BurnsBehaviors.sees(a, g, a.def.view || 14, a.def.fov || 1.1)) { D.mode = 'chase'; a.say(a.def.spotLine || 'FREEZE! I mean... HEY BRO, WHAT\'S IN THE BAGGIE?!', 2); g.toast(a.def.spotToast || 'UNDERCOVER COP! DITCH HIM OR LOSE YOUR POWER-UP'); burnsSfx('yell'); }
      else if (d < 7) a.face(p.x, p.z, dt, 2);
    }
    a.physics(dt);
  },
  hit(a, g) { if (a.data.mode === 'dazed') return false; a.data.mode = 'dazed'; a.data.dz = 2.6; a.say('MY COVER! ...I mean. Ow. Groovy ow.', 2); g.fx.burst(a.x, a.y + 1.8, a.z, 'star', 10, '#ffd84a'); return 'handled'; }
});

// puppet: world code steers the actor (moveTo + ch.play); this only runs physics
BurnsBehaviors.register('w234Puppet', { update(a, g, dt) { a.physics(dt); } });

/* ---------- riding behaviour: an actor pedalling a bike mover along a path ----------
   def: { path: [[x,z]...], speed, loop (default true), bikeMv, hazard (knocks Brady over),
          lines (shouted on a near miss), lean } */
BurnsBehaviors.register('w234Cyclist', {
  init(a) { a.data.i = a.def.startIndex || 0; a.data.sp = a.def.speed || 6; a.data.down = 0; a.data.hitCd = 0; },
  update(a, g, dt) {
    const D = a.data, P = a.def.path, mv = a.def.bikeMv, p = g.player;
    if (D.hitCd > 0) D.hitCd -= dt;
    if (D.down > 0) {
      D.down -= dt; a.ch.play('knocked'); a.y = g.world.height(a.x, a.z);
      if (mv) { mv.roll = BurnsM.damp(mv.roll || 0, 1.45, 8, dt); mv.y = a.y; }
      if (D.down <= 0) { a.say(a.def.remountLine || 'Back in the saddle!', 1.2); if (mv) mv.roll = 0; }
      return;
    }
    if (!P || !P.length) return;
    if (a.def.parked) { a.ch.play('idle'); return; }
    const t = P[D.i], dx = t[0] - a.x, dz = t[1] - a.z, d = Math.hypot(dx, dz);
    if (d < 2.2) { D.i = D.i + 1; if (D.i >= P.length) D.i = a.def.loop === false ? P.length - 1 : 0; }
    const want = Math.atan2(dx, dz), diff = BurnsM.wrap(want - a.yaw), turn = clamp(diff, -2.6 * dt, 2.6 * dt);
    a.yaw += turn;
    const sp = (a.def.speed || 6) * (a.def.speedFn ? a.def.speedFn(g, a) : 1);
    D.sp = approach(D.sp, sp, dt * 4);
    a.x += Math.sin(a.yaw) * D.sp * dt; a.z += Math.cos(a.yaw) * D.sp * dt;
    const gy = g.world.height(a.x, a.z); a.y = gy + 0.42; a.vx = Math.sin(a.yaw) * D.sp; a.vz = Math.cos(a.yaw) * D.sp;
    a.ch.play('bike', { rate: 4 + D.sp * 0.9 });
    if (mv) { mv.x = a.x; mv.y = gy; mv.z = a.z; mv.yaw = a.yaw; mv.roll = BurnsM.damp(mv.roll || 0, clamp(-turn / dt * 0.08, -0.3, 0.3), 6, dt); mv.visible = !a.hidden; }
    // bike swarms: knocked over if you stand in the lane
    if (a.def.hazard && !a.friendly && D.hitCd <= 0 && !p.vehicle && p.invT <= 0 && !p.dead) {
      const dd = Math.hypot(p.x - a.x, p.z - a.z);
      if (dd < 1.05 && p.y < a.y + 1.2) { D.hitCd = 1.2; p.hurt(1, a.x, a.z, 10); a.say((a.def.taunts || ['BIKE LANE!', 'ON YOUR LEFT!', 'DING DING!'])[Math.floor(Math.random() * 3)], 1.2); burnsSfx('bike_bell'); }
    }
  },
  hit(a, g) {
    if (a.data.down > 0) return false;
    a.data.down = 2.2; a.say(a.def.fallLine || 'Whoa-oa-oa!', 1.2); g.fx.dust(a.x, a.y, a.z, 8); burnsSfx('bump');
    if (a.def.onKnock) a.def.onKnock(g, a);
    return 'handled';
  }
});

/* ---------- extra animations ---------- */
// fire poi: arms swinging big circles in front of the body
BURNS_ANIMS.w234poi = (P, t, k) => {
  const B = BURNS_BONES, S = (b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  const sp = (k && k.rate) || 6, a = t * sp, s = Math.sin(a), c = Math.cos(a);
  S(B.UARM_L, -1.3 + s * 0.55, 0, 0.35 + c * 0.35); S(B.FARM_L, -0.3); S(B.UARM_R, -1.3 - s * 0.55, 0, -0.35 + c * 0.35); S(B.FARM_R, -0.3);
  S(B.CHEST, 0.05, Math.sin(t * 1.3) * 0.25); S(B.HEAD, -0.1, -Math.sin(t * 1.3) * 0.15);
  S(B.THIGH_L, -0.15 + Math.sin(t * 2.6) * 0.15); S(B.SHIN_L, 0.25); S(B.THIGH_R, -0.15 - Math.sin(t * 2.6) * 0.15); S(B.SHIN_R, 0.25);
  P.y = -Math.abs(Math.sin(t * 2.6)) * 0.04; P.face = 3;
};
// catwalk strut: hips swing, one hand on the hip
BURNS_ANIMS.w234strut = (P, t, k) => {
  BURNS_ANIMS.walk(P, t, k);
  const B = BURNS_BONES, s = Math.sin(t * 7.5 * ((k && k.rate) || 1));
  P.r[B.HIPS * 3 + 1] = s * 0.22; P.r[B.HIPS * 3 + 2] = s * 0.1; P.r[B.CHEST * 3 + 1] = -s * 0.15;
  P.r[B.UARM_L * 3] = -0.2; P.r[B.UARM_L * 3 + 2] = 0.75; P.r[B.FARM_L * 3] = -1.9;
  P.r[B.HEAD * 3] = -0.15; P.face = 3;
};
// a fashion pose (k.style 0..2)
BURNS_ANIMS.w234pose = (P, t, k) => {
  const B = BURNS_BONES, S = (b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  const st = (k && k.style) || 0, b = Math.sin(t * 2) * 0.03;
  if (st % 3 === 0) { S(B.UARM_L, -0.3, 0, 0.8); S(B.FARM_L, -1.9); S(B.UARM_R, -2.7, 0, -0.4); S(B.FARM_R, -0.4); S(B.HIPS, 0, 0.3, 0.12); S(B.HEAD, -0.2, -0.4); S(B.THIGH_R, -0.3); S(B.SHIN_R, 0.5); }
  else if (st % 3 === 1) { S(B.UARM_L, -2.9, 0, 0.3); S(B.FARM_L, -0.2); S(B.UARM_R, -2.9, 0, -0.3); S(B.FARM_R, -0.2); S(B.CHEST, -0.2); S(B.HEAD, -0.35); S(B.THIGH_L, 0.2); S(B.THIGH_R, -0.2); }
  else { S(B.UARM_L, -1.5, 0, 0.2); S(B.FARM_L, -0.6); S(B.UARM_R, -0.4, 0, -0.8); S(B.FARM_R, -1.8); S(B.HIPS, 0, -0.35, -0.1); S(B.HEAD, 0.1, 0.5); S(B.THIGH_L, -0.4); S(B.SHIN_L, 0.6); }
  P.y = b; P.face = 3;
};
// lying back on a pillow (cuddle puddles, lounges)
BURNS_ANIMS.w234lounge = (P, t) => {
  const B = BURNS_BONES, S = (b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  S(B.THIGH_L, -1.45); S(B.SHIN_L, 0.9); S(B.THIGH_R, -1.3); S(B.SHIN_R, 1.1);
  S(B.UARM_L, -0.4, 0, 1.2); S(B.FARM_L, -0.9); S(B.UARM_R, -2.6, 0, -0.5); S(B.FARM_R, -1.6);
  S(B.CHEST, -0.1 + Math.sin(t * 1.2) * 0.02); S(B.HEAD, 0.25, 0.3);
  P.pitch = -0.95; P.pivot = 0.5; P.y = -0.38; P.face = 3;
};

/* ---------- carrying a heavy load (W2: the stash, the haul, the escape) ----------
   BURNS_W234.loadModels(key, build) -> { hand, ground }: one build, baked twice (held over Brady's
   head on the chest bone / resting on the ground). build(m) draws the load centred on the origin,
   sitting on y = 0.
   BURNS_W234.loadPlace(g, o, x, z, yaw) puts a load on the ground; walking into it picks it up.
   BURNS_W234.carryStart(g, o) puts one in Brady's hands. o: { hand, ground, name, speed (0.62),
     jump (false), dropOnHurt (true), when(g) (may it be picked up?), onPick(g, L), onDrop(g, L, why) }.
   While carrying: slower, no jumping (unless o.jump), ACTION only talks or interacts (no spin), and
   anything that hurts Brady knocks the load loose (unless dropOnHurt is false). */
BURNS_W234.loadModels = function (key, build) {
  return {
    hand: this.attModel('load:' + key + ':hand', m => { m.push(); m.tf(0, 0.83, 0.04); build(m); m.pop(); }),
    ground: this.attModel('load:' + key + ':ground', m => build(m))
  };
};
BURNS_W234.carryInstall = function (p) {
  if (p._w234carry) return; p._w234carry = true;
  let d = null, o = Object.getPrototypeOf(p);
  while (o && !(d = Object.getOwnPropertyDescriptor(o, 'speedMul'))) o = Object.getPrototypeOf(o);
  Object.defineProperty(p, 'speedMul', { configurable: true, get() {
    const v = d && d.get ? d.get.call(this) : 1, S = BURNS_W234.S, c = S && S.carry;
    return c && S.g === this.g ? v * (c.o.speed || 0.62) : v;
  } });
};
BURNS_W234.carryStart = function (g, o) {
  const S = this.S, p = g.player; if (!S) return;
  this.carryInstall(p);
  if (p.vehicle) p.vehicle.dismount(p);
  S.carry = { o, t: 0, inv: p.invT, warn: 0 };
  if (!S.carryAtt) { S.carryAtt = { get geo() { const c = BURNS_W234.S && BURNS_W234.S.carry; return c ? c.o.hand.geo : null; } }; this.attach(p, S.carryAtt, BURNS_BONES.CHEST, () => !!(BURNS_W234.S && BURNS_W234.S.carry)); }
  burnsSfx('pick', { pitch: 0.7 });
};
BURNS_W234.carryEnd = function (g) {
  const S = this.S, p = g.player; if (!S) return null;
  const c = S.carry; S.carry = null;
  if (p.animOverride === 'w234carry' || p.animOverride === 'w234carryIdle') p.animOverride = null;
  return c;
};
BURNS_W234.loadPlace = function (g, o, x, z, yaw, y) {
  const S = this.S; if (!S) return null;
  const L = { o, x, z, y: y === undefined ? g.world.height(x, z) : y, yaw: yaw || 0, t: 0, m12: new Float32Array(12) };
  (S.loads || (S.loads = [])).push(L);
  return L;
};
BURNS_W234.loadRemove = function (L) { const S = this.S; if (S && S.loads) S.loads = S.loads.filter(q => q !== L); };
BURNS_W234.carryDrop = function (g, why) {
  const S = this.S, p = g.player, c = this.carryEnd(g); if (!c) return null;
  const L = this.loadPlace(g, c.o, p.x + Math.sin(p.yaw) * 0.8, p.z + Math.cos(p.yaw) * 0.8, p.yaw + 0.7, p.y + 1.6);
  L.vy = 3.5; L.air = true; L.vx = Math.sin(p.yaw) * 2; L.vz = Math.cos(p.yaw) * 2;
  burnsSfx('bump', { pitch: 0.8 }); g.fx.dust(L.x, L.y, L.z, 8);
  if (c.o.onDrop) c.o.onDrop(g, L, why);
  void S; return L;
};
BURNS_W234.carryStep = function (g, dt) {
  const S = this.S, p = g.player, c = S.carry;
  // loads on the ground: settle, then get picked up by walking into them
  if (S.loads) for (const L of S.loads.slice()) {
    L.t += dt;
    if (L.air) { L.vy -= 22 * dt; L.x += L.vx * dt; L.z += L.vz * dt; L.y += L.vy * dt; L.pitch = (L.pitch || 0) + dt * 5; const gy = g.world.height(L.x, L.z); if (L.y <= gy) { L.y = gy; L.air = false; L.pitch = 0; g.fx.dust(L.x, gy, L.z, 6); } }
    if (!c && !L.air && L.t > 0.7 && !p.dead && !p.vehicle && !g.cine && p.invT < 1.2 && Math.hypot(p.x - L.x, p.z - L.z) < 1.35 && Math.abs(p.y - L.y) < 1.2 && (!L.o.when || L.o.when(g, L))) {
      this.loadRemove(L); this.carryStart(g, L.o);
      if (L.o.onPick) L.o.onPick(g, L);
      return;
    }
  }
  if (!c) return;
  c.t += dt; c.warn -= dt;
  const hurt = p.invT > c.inv + 0.2; c.inv = p.invT;
  if ((hurt || p.dead) && c.o.dropOnHurt !== false) { this.carryDrop(g, 'hurt'); g.toast(c.o.dropText || 'YOU DROPPED YOUR STUFF! (walk into it to pick it up)'); return; }
  if (p.vehicle) { p.vehicle.dismount(p); if (c.warn <= 0) { c.warn = 2; g.toast('NOT WITH ALL THIS STUFF!'); } }
  if (p.grabbedBy) { if (p.animOverride === 'w234carry' || p.animOverride === 'w234carryIdle') p.animOverride = null; return; }
  // no jumping (or no double jump) with your arms full
  if (!c.o.jump) { if (p.inp.jumpPressed && c.warn <= 0) { c.warn = 2.5; g.toast('TOO HEAVY TO JUMP!'); } p.inp.jumpPressed = false; p.inp.jump = false; }
  else if (!p.grounded && p.coyote <= 0) p.inp.jumpPressed = false;
  // ACTION talks or interacts; it never spins while you're carrying
  if (p.inp.actionPressed && !g.talkTarget() && !g.interactTarget()) { p.inp.actionPressed = false; if (c.warn <= 0) { c.warn = 2.5; g.toast('HANDS FULL!'); } }
  const sp = Math.hypot(p.vx, p.vz);
  if (p.grounded && p.hurtT <= 0 && !p.dead && !p.locked) p.animOverride = sp > 0.6 ? 'w234carry' : 'w234carryIdle';
  else if (p.animOverride === 'w234carry' || p.animOverride === 'w234carryIdle') p.animOverride = null;
};
// carrying a load over your head: a heavy trudge, arms up
BURNS_ANIMS.w234carry = (P, t) => {
  BURNS_ANIMS.walk(P, t, { rate: 1.15 });
  const B = BURNS_BONES, S = (b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; }, s = Math.sin(t * 7.5 * 1.15);
  S(B.UARM_L, -2.85, 0, 0.32); S(B.FARM_L, -0.5); S(B.UARM_R, -2.85, 0, -0.32); S(B.FARM_R, -0.5);
  S(B.CHEST, -0.08, s * 0.04, s * 0.05); S(B.HEAD, 0.12); P.face = 2;
};
BURNS_ANIMS.w234carryIdle = (P, t) => {
  BURNS_ANIMS.idle(P, t);
  const B = BURNS_BONES, S = (b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; }, b = Math.sin(t * 3) * 0.04;
  S(B.UARM_L, -2.85 + b, 0, 0.32); S(B.FARM_L, -0.5); S(B.UARM_R, -2.85 - b, 0, -0.32); S(B.FARM_R, -0.5);
  S(B.CHEST, -0.06); S(B.HEAD, 0.1); P.sq = 0.97;
};

/* ---------- pickup meshes for world items (extension of BURNS_PICKUP_MESH.item) ---------- */
(() => {
  const base = BURNS_PICKUP_MESH.item;
  const W = BURNS_W234;
  const custom = {
    goggles(m) {
      m.color('#2a2a2e'); W.ring(m, 0, 0, 0, 0.36, 0.028, { roll: Math.PI / 2, pitch: 0, seg: 16, tseg: 4, sy: 0.4 });
      for (const sx of [-0.15, 0.15]) { m.color('#3a3a40'); W.ring(m, sx, 0, 0.03, 0.11, 0.035, { pitch: Math.PI / 2, seg: 12, tseg: 5 }); m.color('#ff9a3a', 0.6).shine(3); W.egg(m, sx, 0, 0.05, 0.1, 0.1, 0.03, { seg: 10, rings: 5 }); m.shine(0).emissive(0); }
    },
    bikelight(m) { m.color('#2a2a30'); W.rb(m, 0, 0, 0, 0.26, 0.16, 0.34, 0.06); m.color('#38f2ff', 1); W.egg(m, 0, 0, 0.17, 0.1, 0.06, 0.04, { seg: 10, rings: 5 }); m.color('#ff3b5c', 1); W.ball(m, 0, 0.1, -0.1, 0.035, { seg: 6, rings: 4 }); m.emissive(0); },
    patchkit(m) { m.color('#2a6ad8'); W.rb(m, 0, 0, 0, 0.42, 0.28, 0.1, 0.04); m.color('#ffe24a'); W.rb(m, 0, 0.02, 0.055, 0.3, 0.12, 0.02, 0.01); m.color('#e83a2a'); W.ring(m, 0, -0.07, 0.06, 0.06, 0.018, { pitch: Math.PI / 2, seg: 10, tseg: 4 }); },
    pump(m) { m.color('#e83a2a').shine(2); W.post(m, 0, -0.32, 0, 0.06, 0.55); m.shine(0); m.color('#1a1a1e'); W.limb(m, -0.14, 0.26, 0, 0.14, 0.26, 0, 0.025); W.limb(m, 0, 0.22, 0, 0, 0.3, 0, 0.015); m.color('#3a3a40'); W.tube(m, [[0.05, -0.3, 0], [0.18, -0.36, 0.05], [0.22, -0.2, 0.1]], 0.012); },
    rose(m) { m.color('#2a8a3a'); W.limb(m, 0, -0.35, 0, 0, 0.1, 0, 0.015); m.color('#ff2a5a'); W.ball(m, 0, 0.16, 0, 0.09, { seg: 8, rings: 6 }); },
    moop(m, o) {
      const v = (o.seed || 0) % 5;
      if (v === 0) { m.color('#d82a2a').shine(2); m.roundCyl(0, -0.05, 0, 0.16, 0.08, 0.03, { seg: 12 }); m.shine(0); }
      else if (v === 1) { m.color('#ff8ad8'); BURNS_W234.egg(m, 0, 0, 0, 0.06, 0.26, 0.02, { seg: 8, rings: 6 }); m.color('#ffffff'); BURNS_W234.limb(m, 0, -0.3, 0, 0, 0.22, 0, 0.012); }
      else if (v === 2) { m.color('#d8c8a0'); BURNS_W234.egg(m, -0.05, 0, 0, 0.1, 0.07, 0.16, { seg: 8, rings: 5, phi1: Math.PI / 2 }); BURNS_W234.egg(m, 0.06, 0.02, 0, 0.1, 0.07, 0.16, { seg: 8, rings: 5, phi1: Math.PI / 2 }); }
      else if (v === 3) { m.color('#ffd84a', 0.6).shine(3); BURNS_W234.egg(m, 0, 0, 0, 0.14, 0.14, 0.02, { seg: 12, rings: 4 }); m.shine(0).emissive(0); }
      else { m.color('#1a1a1e'); BURNS_W234.tube(m, [[-0.2, -0.1, 0], [0, 0.05, 0], [0.18, 0.12, 0.04]], 0.018); }
    },
    boot(m) { const W = BURNS_W234; m.color('#d8dce8').shine(3); W.rb(m, 0, -0.22, 0.04, 0.24, 0.22, 0.44, 0.08); W.post(m, 0, -0.12, -0.06, 0.12, 0.5, { edge: 0.05 }); m.color('#ff9ad8'); W.ring(m, 0, 0.38, -0.06, 0.12, 0.03, { seg: 12, tseg: 4 }); m.shine(0); },
    wristband(m) { m.color('#ff4fd8', 0.5); W.ring(m, 0, 0, 0, 0.18, 0.04, { roll: Math.PI / 2, seg: 14, tseg: 5 }); m.emissive(0); }
  };
  BURNS_PICKUP_MESH.item = function (m, o) {
    const f = o && custom[o.item];
    if (f) { f(m, o); m.emissive(0); m.shine && m.shine(0); return; }
    return base.call(this, m, o);
  };
})();
