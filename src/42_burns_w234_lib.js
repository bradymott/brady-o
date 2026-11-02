/* ============================================================
   BRADY-O BURNS — shared helpers for Worlds 2, 3 and 4
   (Finding Camp · Costume Cult & the Yellow Bike · The Orgy Dome)
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
  reset(g) { this.S = { g, timers: [], att: [], riders: [], parades: [], bikes: [] }; return this.S; },
  timer(sec, fn) { if (this.S) this.S.timers.push({ t: sec, fn }); },
  update(g, dt) {
    const S = this.S; if (!S) return;
    if (S.timers.length) {
      for (const t of S.timers) { t.t -= dt; if (t.t <= 0 && !t.done) { t.done = true; t.fn(g); } }
      S.timers = S.timers.filter(t => !t.done);
    }
    for (const P of S.parades) this.paradeStep(g, P, dt);
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
    const st = { bg: '#24102e', fg: '#fff2c8', size: 34, border: '#ff9ad8', pad: 14 };
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
    respirator(m) { m.color('#3a3a40').shine(1); BURNS_W234.egg(m, 0, 0.13, 0.12, 0.085, 0.07, 0.06, { seg: 10, rings: 6 }); for (const s of [-1, 1]) { m.push(); m.tf(s * 0.085, 0.1, 0.15, 0, 0.5, s * -0.6); m.color('#e8c020'); m.roundCyl(0, -0.03, 0, 0.042, 0.06, 0.012, { seg: 10 }); m.pop(); } m.shine(0); m.color('#1a1a1e'); BURNS_W234.ring(m, 0, 0.16, 0, 0.135, 0.01, { pitch: 0.25, seg: 14, tseg: 3 }); },
    headlamp(m) { m.color('#1a1a1e'); BURNS_W234.ring(m, 0, 0.27, 0, 0.142, 0.013, { seg: 16, tseg: 3 }); m.color('#3a3a40'); BURNS_W234.rb(m, 0, 0.27, 0.145, 0.07, 0.05, 0.04, 0.012); m.color('#fff4c8', 1); BURNS_W234.egg(m, 0, 0.27, 0.168, 0.026, 0.026, 0.01, { seg: 8, rings: 4 }); m.emissive(0); },
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
      const mv = api.mover(m => b(m, i), {});
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
  },
  /* ---------- small utils ---------- */
  near(g, x, z, r) { const p = g.player; return Math.hypot(p.x - x, p.z - z) < r; },
  costumeOn() { const c = BurnsSave.get().costume; return !!c && c !== 'none'; }
};

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
    wristband(m) { m.color('#ff4fd8', 0.5); W.ring(m, 0, 0, 0, 0.18, 0.04, { roll: Math.PI / 2, seg: 14, tseg: 5 }); m.emissive(0); }
  };
  BURNS_PICKUP_MESH.item = function (m, o) {
    const f = o && custom[o.item];
    if (f) { f(m, o); m.emissive(0); m.shine && m.shine(0); return; }
    return base.call(this, m, o);
  };
})();
