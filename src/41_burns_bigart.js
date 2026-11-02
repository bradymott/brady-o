/* ============================================================
   BRADY-O BURNS — BIG ART (src/41_burns_bigart.js)
   Massive, original playa art pieces Brady can climb, ride and play on.
   They are adventure points: world files drop them in while building:

     const piece = BurnsBigArt.place(api, g, 'knottedSemi', x, z, {
       rotY: 0, scale: 1, night: 'auto', mission: 'semiTop', onReach(g, piece) {} });

   Kinds (all original designs; they nod to the spirit of big playa art, never a real piece):
     knottedSemi      a big rig whose trailer is tied into a loop-de-loop; the cab sits on top
     pumpJack         a skyscraper-tall nodding pump jack; ride the carrier bar, get flung
     sleepingGiant    a colossal wooden giant asleep on the playa; his chest breathes
     galleon          a landlocked galleon at the end of a pier; rigging + zipline
     stickCathedral   a woven-stick basket cathedral; a jungle gym with light shafts
     glowshroomGrove  giant glowing mushrooms; bounce cap to cap
     lighthouses      three crooked lighthouses; light the lamps, the beams reveal secrets
     retroRocket      a retro rocket + gantry; push the button for a launch show

   Engine extensions implemented here (no engine edits): climbable nets/ladders, ziplines,
   the bike loop-de-loop, launch kickers, summit detection + vantage camera, lighthouse beam
   reveals, momentum from rising platforms, a per-frame sprite hook (beams, cables, chasers)
   and a camera-override hook. Everything is per visit (state lives on the BurnsWorld).
   Docs: docs/BURNS_BIGART.md
   ============================================================ */

/* ---------------- tiny vector helpers ---------------- */
const bbaV = {
  norm(x, y, z) { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; },
  cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; },
  dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
};
const BBA_CLIMB_V = 4.3;          // climbing speed on nets/ladders (m/s)
const BBA_NOGRAV = () => BURNS_PHYS.gravity;

/* ---------------- piece frame: local (x, y, z) <-> world ----------------
   Local +Z is a piece's "front". rotY rotates it like any prop (yaw 0 faces +Z). */
function bbaFrame(x, y0, z, rot, s) {
  const c = Math.cos(rot), sn = Math.sin(rot);
  return {
    x, y0, z, rot, s, c, sn,
    w(lx, ly, lz) { return [x + (lx * c + lz * sn) * s, y0 + (ly || 0) * s, z + (-lx * sn + lz * c) * s]; },
    wx(lx, lz) { return x + (lx * c + lz * sn) * s; },
    wz(lx, lz) { return z + (-lx * sn + lz * c) * s; },
    wy(ly) { return y0 + ly * s; },
    dir(lx, lz) { return [lx * c + lz * sn, -lx * sn + lz * c]; },
    l(wx, wz) { const dx = (wx - x) / s, dz = (wz - z) / s; return [dx * c - dz * sn, dx * sn + dz * c]; },
    yaw(ly) { return rot + (ly || 0); }
  };
}

/* ---------------- per-visit runtime (lives on the BurnsWorld) ---------------- */
function bbaRT(W) {
  if (!W._bba) W._bba = { pieces: [], climbs: [], zips: [], kicks: [], loops: [], reveals: [], items: [], beams: [], t: 0, rt: 0, steps: 0, night: 0, climb: null, ride: null, cam: null, air: null, plat: null, errs: {}, kinds: {} };
  return W._bba;
}
function bbaErr(e) {
  try {
    const k = String(e && e.message || e), R = bbaErr.seen || (bbaErr.seen = {});
    if (R[k]) return; R[k] = true;
    if (typeof Game !== 'undefined' && Game.reportError) Game.reportError(e); else console.error(e);
  } catch (e2) { /* never throw from the error path */ }
}

/* ---------------- geometry helpers ---------------- */
// static geometry in piece-local coordinates (split big pieces into several parts: each part
// lands in the 48 m cell of its own origin and must stay under ~15k vertices)
function bbaPart(api, P, lx, lz, fn, mesh) {
  const F = P.F;
  const info = api.mesh(F.wx(lx, lz), F.wz(lx, lz), m => {
    m.push(); m.tf(-lx, 0, -lz);
    const r = fn(m) || {};
    m.pop();
    for (const c of r.cols || []) { c.x = (c.x || 0) - lx; c.z = (c.z || 0) - lz; }
    for (const L of r.lights || []) { L.x = (L.x || 0) - lx; L.z = (L.z || 0) - lz; }
    return r;
  }, { yaw: F.rot, scale: F.s, y: F.y0, mesh: mesh || undefined });
  P.cols.push(...(info.wcols || []));
  return info;
}
// a dedicated static mesh for one piece (its own chunk, so it can be hidden later: the cathedral burn)
function bbaOwnMesh(api, P) {
  const own = new BurnsMesh(8192);
  api.world.cells.set('bba:' + P.id, { list: [own] });
  own.geo = function () { const r = BurnsMesh.prototype.geo.call(this); P.chunk = r; return r; };
  return own;
}
function bbaScaleCol(d, s) { const c = Object.assign({}, d); for (const k of ['x', 'z', 'hx', 'hz', 'r', 'y0', 'y1', 'ya', 'yb']) if (c[k] !== undefined) c[k] *= s; return c; }
// a mover built in piece-local units (scaled with the piece). Position it with bbaPose().
function bbaMover(api, P, build) {
  const s = P.F.s;
  const mv = api.mover(m => {
    m.push(); m.tf(0, 0, 0, 0, 0, 0, s);
    const info = build(m) || {};
    m.pop();
    info.cols = (info.cols || []).map(d => bbaScaleCol(d, s));
    info.lights = (info.lights || []).map(L => Object.assign({}, L, { x: (L.x || 0) * s, y: (L.y || 0) * s, z: (L.z || 0) * s, s: (L.s || 0) * s }));
    return info;
  });
  mv._bba = P; P.movers.push(mv);
  return mv;
}
function bbaPose(P, mv, lx, ly, lz, yaw, pitch, roll) {
  const F = P.F, ny = F.y0 + ly * F.s;
  mv._bbaVy = mv._bbaT ? (ny - mv.y) / mv._bbaT : 0;
  mv.x = F.wx(lx, lz); mv.y = ny; mv.z = F.wz(lx, lz); mv.yaw = F.rot + (yaw || 0); mv.pitch = pitch || 0; mv.roll = roll || 0;
}
// smooth tube along a polyline (parallel-transport frames). r: number | fn(i, n)
function bbaTube(m, pts, r, seg, o) {
  o = o || {}; seg = seg || m.segs(8, 5);
  const n = pts.length; if (n < 2) return m;
  const T = [], N = [], B = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    T.push(bbaV.norm(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  let up = Math.abs(T[0][1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let nn = bbaV.cross(up, T[0]); nn = bbaV.norm(nn[0], nn[1], nn[2]);
  for (let i = 0; i < n; i++) {
    if (i > 0) { const d = bbaV.dot(nn, T[i]); nn = bbaV.norm(nn[0] - T[i][0] * d, nn[1] - T[i][1] * d, nn[2] - T[i][2] * d); }
    N.push(nn); const bb = bbaV.cross(T[i], nn); B.push(bb);
  }
  const rad = typeof r === 'function' ? r : () => r;
  m.grid(seg, n, true, (i, j, out) => {
    const a = i / seg * TAU, ca = Math.cos(a), sa = Math.sin(a), rr = rad(j, n);
    const dx = N[j][0] * ca + B[j][0] * sa, dy = N[j][1] * ca + B[j][1] * sa, dz = N[j][2] * ca + B[j][2] * sa;
    out.p[0] = pts[j][0] + dx * rr; out.p[1] = pts[j][1] + dy * rr; out.p[2] = pts[j][2] + dz * rr;
    out.n[0] = dx; out.n[1] = dy; out.n[2] = dz;
    if (o.colFn) { const c = o.colFn(j, n); if (c) out.col = burnsRGB(c); }
    if (o.eFn) out.e = o.eFn(j, n);
  });
  if (o.caps !== false) { const r0 = rad(0, n), r1 = rad(n - 1, n); m.ball(pts[0][0], pts[0][1], pts[0][2], r0, { seg: Math.max(5, seg), rings: 4 }); m.ball(pts[n - 1][0], pts[n - 1][1], pts[n - 1][2], r1, { seg: Math.max(5, seg), rings: 4 }); }
  return m;
}
// one flat face of a swept profile: frames(j) -> {p, l, n} (point, lateral unit, normal unit)
function bbaStrip(m, rows, frame, a, b, nrm, colFn) {
  m.grid(2, rows, false, (i, j, out) => {
    const f = frame(j), q = i ? b : a;
    out.p[0] = f.p[0] + f.l[0] * q[0] + f.n[0] * q[1]; out.p[1] = f.p[1] + f.l[1] * q[0] + f.n[1] * q[1]; out.p[2] = f.p[2] + f.l[2] * q[0] + f.n[2] * q[1];
    out.n[0] = f.l[0] * nrm[0] + f.n[0] * nrm[1]; out.n[1] = f.l[1] * nrm[0] + f.n[1] * nrm[1]; out.n[2] = f.l[2] * nrm[0] + f.n[2] * nrm[1];
    if (colFn) { const c = colFn(j, i); if (c) out.col = burnsRGB(c); }
  });
}
// a closed polygonal profile ([[u, v], ...] counter-clockwise looking along +path) swept along frames
function bbaSweep(m, rows, frame, prof, colFn) {
  const n = prof.length;
  for (let k = 0; k < n; k++) {
    const a = prof[k], b = prof[(k + 1) % n], du = b[0] - a[0], dv = b[1] - a[1], l = Math.hypot(du, dv) || 1;
    bbaStrip(m, rows, frame, a, b, [dv / l, -du / l], colFn ? (j, i) => colFn(j, k, i) : null);
  }
}
// a rope / cable with sag between two points (thin tube)
function bbaRope(m, a, b, r, sag, n, o) {
  n = n || 8; const pts = [];
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) - (sag || 0) * 4 * t * (1 - t), lerp(a[2], b[2], t)]); }
  return bbaTube(m, pts, r, (o && o.seg) || 4, Object.assign({ caps: false }, o || {}));
}
// camera-facing ribbon between two 3D points (cables, light beams) — call from a draw hook
function bbaLine(Rr, x0, y0, z0, x1, y1, z1, w, reg, col, a, add) {
  const B = Rr.B, dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
  const pr = dx * B.rx + dy * B.ry + dz * B.rz, pu = dx * B.ux + dy * B.uy + dz * B.uz, l = Math.hypot(pr, pu) || 1e-4;
  const ax = -pu / l * w / 2, ay = pr / l * w / 2;
  Rr.bbs.quad((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, ax, ay, pr / 2, pu / 2, reg, col[0] * a, col[1] * a, col[2] * a, add ? 0 : a);
}
function bbaHue(h, s, l) { return burnsRGBf(burnsHSL(h, s === undefined ? 1 : s, l === undefined ? 0.6 : l)); }

/* ---------------- animations (added to the shared table) ---------------- */
(function () {
  const B = BURNS_BONES;
  const S = (P, b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  const climbPose = (P, s) => {
    S(P, B.UARM_L, -2.55 + s * 0.45, 0, 0.3); S(P, B.FARM_L, -0.45 - Math.max(0, s) * 0.7);
    S(P, B.UARM_R, -2.55 - s * 0.45, 0, -0.3); S(P, B.FARM_R, -0.45 - Math.max(0, -s) * 0.7);
    S(P, B.THIGH_L, -0.95 - s * 0.45); S(P, B.SHIN_L, 1.25 + s * 0.35); S(P, B.FOOT_L, 0.2);
    S(P, B.THIGH_R, -0.95 + s * 0.45); S(P, B.SHIN_R, 1.25 - s * 0.35); S(P, B.FOOT_R, 0.2);
    S(P, B.CHEST, 0.12); S(P, B.HEAD, -0.4); S(P, B.HAIR, 0.1);
  };
  BURNS_ANIMS.bbaClimb = (P, t) => { const s = Math.sin(t * 8.5); climbPose(P, s); P.y = Math.abs(Math.cos(t * 8.5)) * 0.05; };
  BURNS_ANIMS.bbaHang = (P, t) => { climbPose(P, Math.sin(t * 1.5) * 0.15); P.y = 0; };
  BURNS_ANIMS.bbaZip = (P, t) => {
    const s = Math.sin(t * 3.2);
    S(P, B.UARM_L, -3.0, 0, 0.12); S(P, B.FARM_L, -0.15); S(P, B.UARM_R, -3.0, 0, -0.12); S(P, B.FARM_R, -0.15);
    S(P, B.THIGH_L, -0.55 + s * 0.25); S(P, B.SHIN_L, 0.7 - s * 0.2); S(P, B.THIGH_R, -0.35 - s * 0.25); S(P, B.SHIN_R, 0.5 + s * 0.2);
    S(P, B.CHEST, -0.12); S(P, B.HEAD, -0.25 + s * 0.05); S(P, B.HAIR, 0.6 + s * 0.2); P.face = 3;
  };
})();

/* ---------------- night factor (0 = day .. 1 = night) from the world's sky palettes ---------------- */
function bbaPalNight(g) {
  try {
    const key = g.palA + '|' + g.palB + '|' + Math.round((g.tod || 0) * 200);
    if (bbaPalNight.key === key && bbaPalNight.g === g) return bbaPalNight.v;
    const A = BurnsEnv.resolve(g.palA || 'dusk'), Bp = g.palB ? BurnsEnv.resolve(g.palB) : A, t = g.tod || 0;
    const el = lerp(A.sun[1], Bp.sun[1], t);
    const v = clamp((8 - el) / 14, 0, 1);
    bbaPalNight.key = key; bbaPalNight.g = g; bbaPalNight.v = v;
    return v;
  } catch (e) { return 0; }
}
// the most night a world will ever get (for baked light pools at build time)
function bbaMaxNight(g) {
  try {
    const A = BurnsEnv.resolve(g.palA || 'dusk'), Bp = g.palB ? BurnsEnv.resolve(g.palB) : A;
    return clamp((8 - Math.min(A.sun[1], Bp.sun[1])) / 14, 0, 1);
  } catch (e) { return 1; }
}
function bbaNight(g, P) {
  const o = P && P.o;
  if (o && o.night !== undefined && o.night !== 'auto' && o.night !== null) return typeof o.night === 'function' ? (o.night(g) ? 1 : 0) : typeof o.night === 'number' ? clamp(o.night, 0, 1) : (o.night ? 1 : 0);
  const R = g.world && g.world._bba;
  return R ? R.night : bbaPalNight(g);
}

/* ---------------- runtime hooks: per-frame sprites + camera override ---------------- */
function bbaHook(g, R) {
  if (g.fx && !g.fx._bbaHook) {
    const fx = g.fx, orig = fx.draw;
    fx.draw = function (Rr) { try { bbaDraw(g, Rr, R); } catch (e) { bbaErr(e); } return orig.call(fx, Rr); };
    fx._bbaHook = true;
  }
  if (!g._bbaCam && typeof g.updateCamera === 'function') {
    const orig = g.updateCamera;
    g.updateCamera = function (fdt) { orig.call(this, fdt); try { bbaCamera(this, fdt); } catch (e) { bbaErr(e); } };
    g._bbaCam = true;
  }
}
function bbaDraw(g, Rr, R) {
  if (g.world && g.world._bba !== R) return;
  const S = BURNS_SPRITES.R, nk = R.night;
  for (const P of R.pieces) { if (P.draw) P.draw(g, Rr, S, bbaNight(g, P), nk); if (P.burning) bbaBurnDraw(g, Rr, S, P); if (P.cburn) bbaCathBurnDraw(g, Rr, S, P); }
  if (R.ride && R.ride.draw) R.ride.draw(g, Rr, S);
}
// camera override with smooth blend in/out: R.cam = { fn(g, C) -> {x,y,z,tx,ty,tz,fov} | null, dur, t, k }
function bbaCamera(g, fdt) {
  const R = g.world && g.world._bba, C = R && R.cam;
  if (!C) return;
  if (g.cine || g.state !== 'play') { R.cam = null; return; }
  C.t += fdt;
  const want = C.out ? null : C.fn(g, C);
  if (!want || (C.dur && C.t >= C.dur)) C.out = true;
  C.k = BurnsM.damp(C.k || 0, C.out ? 0 : 1, C.out ? 4 : (C.rate || 3.5), Math.max(fdt, 1e-4));
  if (C.out && C.k < 0.02) { R.cam = null; return; }
  const w = want || C.last; if (!w) return; C.last = w;
  const cam = g.cam, k = easeInOut(clamp(C.k, 0, 1));
  cam.x = lerp(cam.x, w.x, k); cam.y = lerp(cam.y, w.y, k); cam.z = lerp(cam.z, w.z, k);
  cam.tx = lerp(cam.tx, w.tx, k); cam.ty = lerp(cam.ty, w.ty, k); cam.tz = lerp(cam.tz, w.tz, k);
  if (w.fov) cam.fov = lerp(cam.fov, w.fov, k);
}
function bbaCamFov(base) { const asp = Game.cssW / Math.max(1, Game.cssH); return Math.max(base, 2 * Math.atan(Math.tan(base / 2) / Math.max(0.3, asp) * 0.95)); }

/* ---------------- the per-step update (registered once per visit) ---------------- */
function bbaUpdate(g, wdt, R) {
  if (!g.player || g.world._bba !== R) return;
  try {
    const dt = g.slow > 0 && g.slow < 1 ? wdt / g.slow : wdt;
    R.t += wdt; R.rt += dt; R.steps++;
    if (R.steps % 12 === 1) {
      R.night = bbaPalNight(g);
      bbaHook(g, R);
      if (!g.interactables) g.interactables = [];
      for (const it of R.items) if (g.interactables.indexOf(it) < 0) g.interactables.push(it);
    }
    if (!R.started) { R.started = true; for (const P of R.pieces) if (P.start) P.start(g); }
    for (const P of R.pieces) { for (const mv of P.movers) mv._bbaT = wdt; if (P.update) P.update(g, wdt, dt); }
    bbaClimbStep(g, R, dt);
    bbaLoopStep(g, R, dt);
    bbaKickStep(g, R, dt);
    bbaSummitStep(g, R, dt);
    bbaRevealStep(g, R, dt);
    bbaMomentumStep(g, R, dt);
    if (R.zipReturn) bbaZipReturn(g, R, dt);
    for (const P of R.pieces) { if (P.burning) bbaBurnStep(g, P, wdt); if (P.cburn) bbaCathBurnStep(g, P, dt); }
  } catch (e) { bbaErr(e); }
}

/* ======================= mechanics ======================= */

/* ---- climbable nets / ladders / rigging --------------------------------------------
   zone (world): { x, z (plane point at the bottom), y0, y1, nx, nz (outward normal, toward the
   climber), hw (half width), lean (plane shifts inward by this much at the top), top (exit
   platform height or null), exit (how far inward to step off at the top) }
   Push the stick into the net to climb, let go to hang, pull away to drop, JUMP to kick off. */
function bbaClimbZone(api, P, d) {
  const F = P.F, s = F.s, R = P.R, n = F.dir(d.nx, d.nz);
  const z = {
    id: P.id + ':climb' + R.climbs.length, x: F.wx(d.x, d.z), z: F.wz(d.x, d.z), y0: F.y0 + d.y0 * s, y1: F.y0 + d.y1 * s,
    nx: n[0], nz: n[1], hw: d.hw * s, lean: (d.lean || 0) * s, top: d.top === undefined || d.top === null ? null : F.y0 + d.top * s,
    exit: (d.exit || 0.95) * s, piece: P, name: d.name || 'net'
  };
  R.climbs.push(z); P.climbs.push(z);
  if (d.col !== false && !z.lean) api.collider({ t: 'box', x: z.x - z.nx * 0.07, z: z.z - z.nz * 0.07, hx: z.hw, hz: 0.07, yaw: Math.atan2(z.nx, z.nz), y0: z.y0, y1: z.y1, walk: false, camPass: true });
  return z;
}
function bbaClimbBase(z, y, out) {
  const k = z.lean ? clamp((y - z.y0) / Math.max(0.1, z.y1 - z.y0), 0, 1) * z.lean : 0;
  out[0] = z.x - z.nx * k; out[1] = z.z - z.nz * k; return out;
}
function bbaClimbEnd(p, R) {
  R.climb = null;
  if (p.animOverride === 'bbaClimb' || p.animOverride === 'bbaHang') p.animOverride = null;
}
function bbaClimbStep(g, R, dt) {
  const p = g.player; if (!R.climbs.length && !R.climb) return;
  const busy = p.vehicle || p.dead || p.grabbedBy || g.cine || g.dialog.open || p.locked || p.giant > 0;
  const I = p.inp, base = [0, 0];
  if (R.climb) {
    const z = R.climb.zone;
    if (busy || p.pound || p.knockT > 0.05) { bbaClimbEnd(p, R); return; }
    const push = -(I.mx * z.nx + I.mz * z.nz), tx = -z.nz, tz = z.nx;
    if (I.jumpPressed) { // kick off the net
      bbaClimbEnd(p, R); p.vx = z.nx * 4.6; p.vz = z.nz * 4.6; p.coyote = 0.12; p.jumps = 0; p.jumpCut = false; p.yaw = Math.atan2(z.nx, z.nz); p.knockT = 0.18;
      return;
    }
    if (push < -0.35 || (p.grounded && push < 0.3)) { bbaClimbEnd(p, R); if (!p.grounded) { p.vx = z.nx * 2.4; p.vz = z.nz * 2.4; } return; }
    bbaClimbBase(z, p.y, base);
    const dn = (p.x - base[0]) * z.nx + (p.z - base[1]) * z.nz;
    let dl = (p.x - base[0]) * tx + (p.z - base[1]) * tz;
    if (Math.abs(dl) > z.hw + 0.35 || dn > 1.3) { bbaClimbEnd(p, R); return; }
    // reached the top: step off onto the platform
    if (z.top !== null && p.y >= z.top - 1.15 && push > 0.25) {
      bbaClimbBase(z, z.top, base);
      dl = clamp(dl, -z.hw, z.hw);
      p.x = base[0] - z.nx * z.exit + tx * dl; p.z = base[1] - z.nz * z.exit + tz * dl;
      p.y = z.top + 0.03; p.vx = p.vz = 0; p.vy = 0; p.climbT = 0.25; p.grounded = false; p.jumps = 0;
      bbaClimbEnd(p, R);
      g.missions.event('bbaClimbTop', z);
      return;
    }
    const want = push > 0.25 ? BBA_CLIMB_V : 0;
    p.vy = (p.y >= z.y1 - 0.05 && want > 0 ? 0 : want) + BBA_NOGRAV() * dt;
    if (p.y > z.y1) p.y = z.y1;
    const side = clamp(I.mx * tx + I.mz * tz, -1, 1) * 2.2;
    p.vx = tx * side; p.vz = tz * side;
    dl = clamp(dl, -z.hw, z.hw);
    const tgt = 0.43;
    p.x = base[0] + z.nx * tgt + tx * dl; p.z = base[1] + z.nz * tgt + tz * dl;
    p.yaw = Math.atan2(-z.nx, -z.nz); p.coyote = 0.12; p.jumps = 0; p.jumpCut = true; p.grounded = false; p.platform = null;
    p.animOverride = want > 0 ? 'bbaClimb' : 'bbaHang';
    R.climb.t += dt;
    if (want > 0 && Math.random() < dt * 3) burnsSfx('footstep', { vol: 0.2, pitch: 1.3 });
    return;
  }
  if (busy || p.pound) return;
  const mag = Math.hypot(I.mx, I.mz); if (mag < 0.4) return;
  for (const z of R.climbs) {
    if (z.off) continue;
    if (p.y < z.y0 - 1.3 || p.y > z.y1 - 0.25) continue;
    if (p.grounded && p.y > z.y0 + 0.9) continue;
    bbaClimbBase(z, p.y, base);
    const dn = (p.x - base[0]) * z.nx + (p.z - base[1]) * z.nz; if (dn < -0.05 || dn > 0.95) continue;
    const dl = (p.x - base[0]) * -z.nz + (p.z - base[1]) * z.nx; if (Math.abs(dl) > z.hw + 0.1) continue;
    const push = -(I.mx * z.nx + I.mz * z.nz) / mag; if (push < 0.55) continue;
    if (!p.grounded && p.vy > 9) continue;   // still rising fast from a jump: grab on the way down
    R.climb = { zone: z, t: 0 };
    p.vy = 0; p.vx = p.vz = 0; p.grounded = false; p.platform = null;
    burnsSfx('pick', { vol: 0.35, pitch: 0.8 });
    g.missions.event('bbaClimb', z);
    return;
  }
}

/* ---- zipline (pseudo-vehicle: p.vehicle = rider, so the engine hands us the player) ---- */
function bbaZipline(api, P, d) {
  // d (local): { a: [x,y,z] cable start (the anchor Brady grabs), b: [x,y,z] cable end, sag, at: [x,y,z] where to stand to grab }
  const F = P.F, R = P.R, A = F.w(d.a[0], d.a[1], d.a[2]), Bp = F.w(d.b[0], d.b[1], d.b[2]);
  const dx = Bp[0] - A[0], dy = Bp[1] - A[1], dz = Bp[2] - A[2], len = Math.hypot(dx, dy, dz);
  const zip = { id: P.id + ':zip' + R.zips.length, a: A, b: Bp, len, d: [dx / len, dy / len, dz / len], yaw: Math.atan2(dx, dz), sag: (d.sag || 0) * F.s, piece: P, s: 0, vmax: d.vmax || 17, handle: null, home: true };
  const at = d.at ? F.w(d.at[0], d.at[1], d.at[2]) : [A[0] - zip.d[0] * 0.2, A[1] - 2.0, A[2] - zip.d[2] * 0.2];
  zip.handle = bbaMover(api, P, m => {
    m.color('#3a3a44').shine(2); m.roundBox(0, 0.05, 0, 0.18, 0.22, 0.5, 0.06);
    m.color('#c8ccd4'); m.push(); m.tf(0, 0.1, 0.16, 0, 0, Math.PI / 2); m.roundCyl(0, -0.06, 0, 0.11, 0.12, 0.04); m.pop();
    m.push(); m.tf(0, 0.1, -0.16, 0, 0, Math.PI / 2); m.roundCyl(0, -0.06, 0, 0.11, 0.12, 0.04); m.pop();
    m.color('#ffd21a').shine(1); m.limb(0, -0.05, 0, 0, -0.62, 0, 0.035, 0.035); m.limb(-0.38, -0.66, 0, 0.38, -0.66, 0, 0.06, 0.06);
    m.color('#ff4fd8', 1); m.ball(0, -0.66, 0, 0.09); m.emissive(0).shine(0);
    return { cols: [], lights: [] };
  });
  zip.handle.x = A[0]; zip.handle.y = A[1]; zip.handle.z = A[2]; zip.handle.yaw = zip.yaw;
  R.zips.push(zip); P.zips.push(zip);
  bbaItem(P, { x: at[0], z: at[2], y: at[1], r: 2.4, label: d.label || 'ZIP!', when: g2 => !g2.player.vehicle && zip.home && !R.climb, fn: g2 => bbaZipMount(g2, zip) });
  return zip;
}
function bbaZipPoint(zip, s, out) {
  const u = clamp(s / zip.len, 0, 1);
  out[0] = zip.a[0] + (zip.b[0] - zip.a[0]) * u; out[1] = zip.a[1] + (zip.b[1] - zip.a[1]) * u - zip.sag * 4 * u * (1 - u); out[2] = zip.a[2] + (zip.b[2] - zip.a[2]) * u;
  return out;
}
function bbaZipMount(g, zip) {
  const p = g.player, R = g.world._bba;
  if (p.vehicle || !zip.home) return;
  const pt = [0, 0, 0];
  const rider = {
    kind: 'zip', yaw: zip.yaw, zip, s: 0.4, v: 3,
    ride(pp, dt) { bbaZipRide(g, this, pp, dt); },
    dismount(pp) { bbaZipEnd(g, this, pp, 'drop'); }
  };
  bbaZipPoint(zip, rider.s, pt);
  p.vehicle = rider; p.pound = 0; p.spinT = 0; p.vx = p.vy = p.vz = 0; p.grounded = false; p.platform = null;
  p.x = pt[0]; p.y = pt[1] - 2.05; p.z = pt[2]; p.yaw = zip.yaw;
  zip.home = false; R.ride = rider;
  rider.letGo = { x: p.x, z: p.z, y: p.y, r: 3, label: 'LET GO', when: () => R.ride === rider, fn: () => bbaZipEnd(g, rider, g.player, 'drop') };
  if (g.interactables) g.interactables.push(rider.letGo);
  burnsSfx('bike_bell', { pitch: 0.6, vol: 0.5 }, 'pick'); burnsSfx('wind', { vol: 0.5 }, 'dust');
  g.missions.event('bbaZip', zip);
  if (zip.piece.o.onZip) zip.piece.o.onZip(g, zip.piece, zip);
}
function bbaZipRide(g, r, p, dt) {
  const zip = r.zip, pt = [0, 0, 0];
  const slope = Math.max(0.1, -zip.d[1]);
  r.v = Math.min(zip.vmax, r.v + (4 + 16 * slope) * dt);
  if (p.locked || g.cine) r.v = Math.max(0, r.v - 30 * dt);
  r.s += r.v * dt;
  bbaZipPoint(zip, r.s, pt);
  p.x = pt[0]; p.y = pt[1] - 2.05; p.z = pt[2]; p.yaw = zip.yaw;
  p.vx = Math.sin(zip.yaw) * r.v; p.vz = Math.cos(zip.yaw) * r.v; p.vy = 0; p.grounded = false;
  p.ch.play('bbaZip');
  const h = zip.handle; h.x = pt[0]; h.y = pt[1]; h.z = pt[2]; h.yaw = zip.yaw;
  if (r.letGo) { r.letGo.x = p.x; r.letGo.z = p.z; r.letGo.y = p.y; }
  if (Math.random() < dt * 30) g.fx.add(pt[0], pt[1] + 0.12, pt[2], (Math.random() - 0.5) * 2, 1 + Math.random() * 2, (Math.random() - 0.5) * 2, 0.3, 0.12, 0.04, [1, 0.8, 0.4], 1, 'spark', 1 | 2);
  if (Math.random() < dt * 2) burnsSfx('wind', { vol: 0.35, pitch: 1.2 }, 'dust');
  if (p.inp.jumpPressed) { bbaZipEnd(g, r, p, 'drop'); return; }
  if (r.s >= zip.len - 0.25) bbaZipEnd(g, r, p, 'end');
}
function bbaZipEnd(g, r, p, how) {
  const R = g.world._bba, zip = r.zip;
  if (R.ride !== r) return;
  R.ride = null; p.vehicle = null;
  if (g.interactables && r.letGo) { const i = g.interactables.indexOf(r.letGo); if (i >= 0) g.interactables.splice(i, 1); }
  const k = how === 'end' ? 0.5 : 0.75;
  p.vx = Math.sin(zip.yaw) * r.v * k; p.vz = Math.cos(zip.yaw) * r.v * k; p.vy = how === 'end' ? 4.5 : 1.5; p.grounded = false; p.jumps = 1; p.jumpCut = true; p.knockT = 0.3;
  p.ch.play('fall');
  R.zipReturn = R.zipReturn || []; R.zipReturn.push({ zip, s: r.s });
  if (how === 'end') { g.missions.event('bbaZipEnd', zip); burnsSfx('land', { vol: 0.5 }); if (zip.piece.o.onZipEnd) zip.piece.o.onZipEnd(g, zip.piece, zip); }
}
// the trolley slides back up to its anchor after a ride
function bbaZipReturn(g, R, dt) {
  const pt = [0, 0, 0];
  for (const q of R.zipReturn) {
    q.s = Math.max(0, q.s - dt * 9);
    bbaZipPoint(q.zip, q.s, pt); const h = q.zip.handle; h.x = pt[0]; h.y = pt[1]; h.z = pt[2];
    if (q.s <= 0) { q.zip.home = true; q.done = true; }
  }
  R.zipReturn = R.zipReturn.filter(q => !q.done);
  if (!R.zipReturn.length) R.zipReturn = null;
}

/* ---- bike loop-de-loop (pseudo-vehicle holding the real bike) ------------------------
   loop (world): { x, z (bottom entry point), y, yaw (travel), R (radius of the riding surface),
   drift (sideways shift over one turn, + = right), minV } */
function bbaLoopStep(g, R, dt) {
  if (!R.loops.length) return;
  const p = g.player, bike = g.bike;
  if (!bike || p.vehicle !== bike || !bike.grounded) return;
  for (const L of R.loops) {
    const dx = bike.x - L.x, dz = bike.z - L.z, f = dx * L.fx + dz * L.fz, l = dx * L.fz - dz * L.fx;
    if (f < -3.2 || f > 0.4 || Math.abs(l) > 1.25 || Math.abs(bike.y - L.y) > 0.7) continue;
    if (Math.cos(bike.yaw - L.yaw) < 0.8) continue;
    if (bike.speed < L.minV) { if (R.rt - (L.warnT || -9) > 2.5) { L.warnT = R.rt; g.toast('MORE SPEED! THE LOOP NEEDS A RUNNING START'); } continue; }
    bbaLoopStart(g, R, L, bike);
    return;
  }
}
function bbaLoopFrame(L, th, out) {
  // centre-line point, inward normal (bike up), tangent (bike forward) at angle th
  const R0 = L.R, lat = L.drift * th / TAU, s = Math.sin(th), c = Math.cos(th);
  const rx = L.fz, rz = -L.fx;   // right vector
  out.x = L.x + L.fx * R0 * s + rx * lat; out.z = L.z + L.fz * R0 * s + rz * lat; out.y = L.y + R0 * (1 - c);
  out.pitch = -th;
  out.nx = -s * L.fx; out.ny = c; out.nz = -s * L.fz;
  return out;
}
function bbaLoopStart(g, R, L, bike) {
  const p = g.player;
  const r = {
    kind: 'loop', yaw: L.yaw, L, th: 0, bike, v0: Math.max(bike.speed, 11.5), v: 0, f: {},
    ride(pp, dt) { bbaLoopRide(g, this, pp, dt); },
    dismount(pp) { bbaLoopFinish(g, this, pp, true); }
  };
  r.v = r.v0;
  p.vehicle = r; R.ride = r;
  bike.poseBike = bbaPoseBikeLoop;
  bike._bbaPitch = 0;
  p.ch.poseFn = (Pp, t) => { BURNS_ANIMS.bike(Pp, t, { rate: 10 }); Pp.pitch = r.f.pitch || 0; Pp.pivot = 0; Pp.y = 0; };
  burnsSfx('doublejump', { pitch: 0.8 }); burnsSfx('crowd_cheer', { vol: 0.35 });
  // side-on camera: the classic loop shot
  const side = L.camSide || 1, rx = L.fz * side, rz = -L.fx * side;
  R.cam = {
    t: 0, k: 0, rate: 5,
    fn: (gg) => {
      if (R.ride !== r) return null;
      const cx = L.x + L.fx * 1.5 + rx * (L.R * 3.0 + L.drift * 0.5), cz = L.z + L.fz * 1.5 + rz * (L.R * 3.0 + L.drift * 0.5);
      const pp = gg.player;
      return { x: cx, y: L.y + L.R * 0.9, z: cz, tx: lerp(L.x + L.fx * 0.5, pp.x, 0.55), ty: lerp(L.y + L.R, pp.y + 0.8, 0.5), tz: lerp(L.z + L.fz * 0.5, pp.z, 0.55), fov: bbaCamFov(1.0) };
    }
  };
  g.missions.event('bbaLoopStart', L);
}
function bbaLoopRide(g, r, p, dt) {
  const L = r.L, bike = r.bike;
  const h = (1 - Math.cos(r.th)) / 2;   // 0 bottom .. 1 top
  r.v = r.v0 * (1 - 0.32 * h);
  r.th += r.v / L.R * dt;
  if (r.th >= TAU) { r.th = TAU; bbaLoopFinish(g, r, p, false); return; }
  bbaLoopFrame(L, r.th, r.f);
  const f = r.f;
  bike.x = f.x; bike.y = f.y; bike.z = f.z; bike.yaw = L.yaw; bike.speed = r.v; bike._bbaPitch = f.pitch;
  p.x = f.x + f.nx * 0.42; p.y = f.y + f.ny * 0.42; p.z = f.z + f.nz * 0.42; p.yaw = L.yaw;
  p.vx = (Math.cos(r.th) * L.fx) * r.v; p.vz = (Math.cos(r.th) * L.fz) * r.v; p.vy = Math.sin(r.th) * r.v; p.grounded = true;
  p.ch.play('bike', { rate: 4 + r.v * 0.9 });
  if (Math.random() < dt * 40) g.fx.add(f.x, f.y + 0.1 * f.ny, f.z, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0.35, 0.18, 0.05, [1, 0.85, 0.3], 1, 'spark', 1 | 4);
}
function bbaLoopFinish(g, r, p, early) {
  const R = g.world._bba, L = r.L, bike = r.bike;
  if (R.ride !== r) return;
  R.ride = null;
  bbaLoopFrame(L, TAU, r.f);
  delete bike.poseBike; bike._bbaPitch = 0;
  p.ch.poseFn = null;
  bike.x = r.f.x; bike.z = r.f.z; bike.y = L.y; bike.yaw = L.yaw; bike.vy = 0; bike.grounded = true; bike.speed = Math.min(14.5, r.v0 + 1.5);
  p.vehicle = bike; bike.rider = p;
  p.x = bike.x; p.y = bike.y + 0.42; p.z = bike.z; p.yaw = L.yaw;
  L.count = (L.count || 0) + 1;
  g.banner('LOOP-DE-LOOP!', early ? 'Bailed out... but still counts.' : 'The Knotted Semi approves.', { col: '#ffe24a', small: true });
  burnsSfx('crowd_cheer', { vol: 0.6 }); g.fx.confetti(p.x, p.y + 2, p.z, 24);
  g.missions.event('bbaLoop', L);
  if (L.piece.o.onLoop) L.piece.o.onLoop(g, L.piece, L.count);
  if (early) bike.dismount(p);
}
// instance override of BurnsVehicle.poseBike while looping (adds pitch to the frame)
function bbaPoseBikeLoop(dt) {
  const B = this.bones, M = this.model, pitch = this._bbaPitch || 0;
  const spin = (this.wheelA = (this.wheelA || 0) + this.speed * dt / M.wheelR);
  const f = this._bbaF || (this._bbaF = new Float32Array(12)), t = this._bbaT || (this._bbaT = new Float32Array(12));
  BurnsM.a34Set(f, 0, this.x, this.y, this.z, this.yaw, pitch, 0, 1, 1, 1);
  B.set(f, 0);
  BurnsM.a34Set(t, 0, 0, M.wheelR, M.front, 0, spin, 0, 1, 1, 1); BurnsM.a34Mul(B, 12, f, 0, t, 0);
  BurnsM.a34Set(t, 0, 0, M.wheelR, M.rear, 0, spin, 0, 1, 1, 1); BurnsM.a34Mul(B, 24, f, 0, t, 0);
  BurnsM.a34Set(t, 0, 0, 0.42, 0.0, 0, spin * 0.5, 0, 1, 1, 1); BurnsM.a34Mul(B, 36, f, 0, t, 0);
  BurnsM.a34Set(t, 0, 0, 0.95, 0.4, 0, 0, 0, 1, 1, 1); BurnsM.a34Mul(B, 48, f, 0, t, 0);
}

/* ---- launch kickers: ramps that actually throw you (bike or on foot) ----
   kick (world): { x, z (lip), y (lip height), fx, fz (launch dir), hw, len, vyBike, vyFoot, hoop } */
function bbaKickStep(g, R, dt) {
  const p = g.player;
  if (R.air) {
    const A = R.air; A.t += dt;
    const h = A.kick.hoop;
    if (h && !A.hoop) {
      const cy = p.y + 0.9, dx = p.x - h.x, dz = p.z - h.z, dn = dx * h.nx + dz * h.nz;
      if (Math.abs(dn) < 0.9 && Math.hypot(dx - h.nx * dn, cy - h.y, dz - h.nz * dn) < h.r - 0.25) {
        A.hoop = true;
        g.banner('HOOP STUNT!', 'Through the ring of fire!', { col: '#ff7a2a', small: true });
        burnsSfx('crowd_cheer'); g.fx.confetti(h.x, h.y, h.z, 30); g.fx.ring(h.x, h.y, h.z, h.r, '#ffb040', 0.6);
        g.addGlow(5); g.toast('+5 GLOW STICKS');
        g.missions.event('bbaStunt', A.kick);
        if (A.kick.piece.o.onStunt) A.kick.piece.o.onStunt(g, A.kick.piece);
      }
    }
    const grounded = p.vehicle && p.vehicle.kind === 'bike' ? p.vehicle.grounded : p.grounded;
    if ((grounded && A.t > 0.2) || A.t > 5) R.air = null;
    return;
  }
  if (!R.kicks.length) return;
  const bike = g.bike, onBike = bike && p.vehicle === bike;
  if (p.vehicle && !onBike) return;
  const ex = onBike ? bike.x : p.x, ez = onBike ? bike.z : p.z, ey = onBike ? bike.y : p.y, gr = onBike ? bike.grounded : p.grounded;
  if (!gr) return;
  for (const k of R.kicks) {
    const dx = ex - k.x, dz = ez - k.z, f = dx * k.fx + dz * k.fz, l = dx * k.fz - dz * k.fx;
    if (f < -k.len || f > 0.15 || Math.abs(l) > k.hw || ey < k.y - k.len * 0.6 - 0.6 || ey > k.y + 0.6) continue;
    if (onBike) {
      const fwd = Math.cos(bike.yaw - Math.atan2(k.fx, k.fz));
      if (bike.speed < 6 || fwd < 0.8) continue;
      bike.vy = k.vyBike; bike.grounded = false; bike.y += 0.05; bike.speed = Math.max(bike.speed, 12);
    } else {
      const sp = p.vx * k.fx + p.vz * k.fz; if (sp < 4.5) continue;
      p.vy = k.vyFoot; p.grounded = false; p.platform = null; p.jumps = 1; p.jumpCut = true; p.y += 0.03;
      p.vx = k.fx * Math.max(sp, 8.5); p.vz = k.fz * Math.max(sp, 8.5); p.knockT = 0.45;
      p.ch.play('flip', null, true);
    }
    R.air = { kick: k, t: 0, hoop: false };
    burnsSfx('jumpBig', { pitch: 0.9 }); g.shake(0.15); g.fx.dust(k.x, k.y, k.z, 10);
    g.missions.event('bbaRamp', k);
    if (k.piece.o.onRamp) k.piece.o.onRamp(g, k.piece);
    return;
  }
}

/* ---- summits: the top of every piece (vantage camera, token, callbacks) ---- */
function bbaSummitStep(g, R, dt) {
  const p = g.player;
  for (const P of R.pieces) {
    if (!P.arrived) {
      const ar = P.o.arriveR || (P.K.size || 30) * 0.6 * P.F.s;
      if (Math.hypot(p.x - P.x, p.z - P.z) < ar) { P.arrived = true; g.missions.event('bbaArrive', P); if (P.o.onArrive) P.o.onArrive(g, P); }
    }
    const S = P.summit; if (!S) continue;
    const at = Math.hypot(p.x - S.x, p.z - S.z) < S.r && p.y >= S.y - 0.35 && p.y < S.y + 4 && (p.grounded || p.vehicle);
    if (!at) continue;
    if (P.o.mission) bbaCompleteMission(g, P.o.mission, { x: S.x, y: S.y + 1.3, z: S.z });
    if (P.reached) continue;
    P.reached = true;
    g.banner('SUMMIT!', P.K.name, { col: '#ffd84a' });
    burnsSfx('crowd_cheer', { vol: 0.7 }); g.fx.confetti(p.x, p.y + 2.2, p.z, 40); g.fx.ring(p.x, p.y + 0.1, p.z, 3, '#ffd84a', 0.6);
    const fresh = !BurnsSave.flag(g.worldId, 'bba:' + P.id + ':top');
    BurnsSave.flag(g.worldId, 'bba:' + P.id + ':top', true);
    if (P.o.reveal) { for (const q of P.o.reveal) g.world.markers.push({ id: 'bba:' + (q.label || 'spot'), x: q.x, z: q.z, label: q.label || 'Spot', col: q.col || '#38f2ff' }); g.toast('NEW SPOTS MARKED ON YOUR MAP'); }
    if (P.o.vantage !== false && (fresh || P.o.vantage === 'always')) bbaVantage(g, P);
    g.missions.event('bbaSummit', P);
    if (P.K.onReach) P.K.onReach(g, P);
    if (P.o.onReach) P.o.onReach(g, P);
  }
}
function bbaCompleteMission(g, id, at) {
  const m = g.missions.get(id);
  if (!m || m.state === 'done' || m.state === 'locked') return false;
  if (m.state === 'available') g.missions.start(id, true);
  g.missions.complete(id, at);
  return true;
}
// a slow orbit pull-back around the piece (player keeps control; moving cancels it)
function bbaVantage(g, P) {
  const R = P.R, S = P.summit, F = P.F;
  const a0 = g.camYaw + Math.PI, rad = Math.max(26, P.K.size * 0.55 * F.s);
  const cx = (S.x + F.x) / 2, cz = (S.z + F.z) / 2;
  R.cam = {
    t: 0, k: 0, dur: 4.2, rate: 2.2,
    fn: (gg, C) => {
      if (C.t > 0.9 && gg.player.inp.mag > 0.35) return null;
      const a = a0 + C.t * 0.32;
      return { x: cx + Math.sin(a) * rad, y: S.y + 9, z: cz + Math.cos(a) * rad, tx: lerp(gg.player.x, cx, 0.4), ty: S.y - 2, tz: lerp(gg.player.z, cz, 0.4), fov: bbaCamFov(1.0) };
    }
  };
  g.banner('VANTAGE POINT', 'You can see the whole playa from up here.', { col: '#38f2ff', small: true });
}

/* ---- beam reveals (lighthouses): R.reveals = [{ x, z, done, fn(g, q) }] ---- */
function bbaRevealStep(g, R, dt) {
  if (!R.beams.length || !R.reveals.length) return;
  for (const q of R.reveals) {
    if (q.done) continue;
    for (const b of R.beams) {
      if (!b.lit) continue;
      const dx = q.x - b.x, dz = q.z - b.z, d = Math.hypot(dx, dz);
      if (d > b.range || d < 2) continue;
      const da = Math.abs(BurnsM.wrap(Math.atan2(dx, dz) - b.yaw)), da2 = Math.abs(BurnsM.wrap(Math.atan2(dx, dz) - b.yaw - Math.PI));
      if (Math.min(da, b.twin ? da2 : 9) < Math.max(0.05, Math.atan2(b.width * 0.5 + (q.r || 1.5), d))) { q.done = true; try { q.fn(g, q, b); } catch (e) { bbaErr(e); } g.missions.event('bbaReveal', q); break; }
    }
  }
}
// true while any lit lighthouse beam is sweeping over (x, z)
function bbaBeamHits(g, x, z) {
  const R = g.world && g.world._bba; if (!R) return false;
  for (const b of R.beams) {
    if (!b.lit) continue;
    const dx = x - b.x, dz = z - b.z, d = Math.hypot(dx, dz);
    if (d > b.range || d < 1) continue;
    const a = Math.atan2(dx, dz), w = Math.atan2(b.width * 0.5, d);
    if (Math.abs(BurnsM.wrap(a - b.yaw)) < w || (b.twin && Math.abs(BurnsM.wrap(a - b.yaw - Math.PI)) < w)) return true;
  }
  return false;
}

/* ---- jumping off a rising platform keeps its momentum ---- */
function bbaMomentumStep(g, R, dt) {
  const p = g.player;
  if (p.grounded && p.platform && p.platform._bba) { R.plat = p.platform; R.platT = 0; return; }
  if (!R.plat) return;
  R.platT += dt;
  if (!p.grounded && p.vy > 6 && !p.vehicle) { const v = R.plat._bbaVy || 0; if (v > 0.6) { p.vy += v * 0.85; g.fx.ring(p.x, p.y, p.z, 1.2, '#ffe24a', 0.3); } R.plat = null; return; }
  if (R.platT > 0.06) R.plat = null;
}

/* ---- interactables (ACTION prompts), kept registered in g.interactables ---- */
function bbaItem(P, it) { it._bba = P; P.R.items.push(it); return it; }

/* ---- helpers shared by pieces ---- */
// glow sticks along a list of local points [[x,y,z], ...] (y = float height)
function bbaGlowPath(api, P, pts) {
  if (P.o.glow === false) return;
  const F = P.F;
  for (const q of pts) api.pickup('glowstick', F.wx(q[0], q[2]), F.wy(q[1]), F.wz(q[0], q[2]));
}
function bbaPickup(api, P, spec, lx, ly, lz, extra) {
  // spec: 'glow' | kind string ('water', 'bag:weed', 'photo'...) | { kind, ...opts }
  if (!spec) return null;
  const F = P.F, x = F.wx(lx, lz), y = F.wy(ly), z = F.wz(lx, lz);
  if (spec === 'glow' || spec === true) { api.glowRing(x, z, 0.9, 6, y); return null; }
  if (typeof spec === 'string') return api.pickup(spec, x, y, z, extra || {});
  const o = Object.assign({}, spec); const kind = o.kind; delete o.kind;
  return api.pickup(kind, x, y, z, Object.assign({}, extra || {}, o));
}
// warm light pools are baked; only add them if this world ever gets dark
function bbaPool(api, P, lx, lz, r, col, i) {
  if (P.o.lights === false || P.maxNight < 0.25) return;
  api.light(P.F.wx(lx, lz), P.F.wz(lx, lz), r * P.F.s, col, (i === undefined ? 0.5 : i) * Math.min(1, P.maxNight + 0.2));
}
function bbaGlow(api, P, lx, ly, lz, size, col, blink) { api.glow(P.F.wx(lx, lz), P.F.wy(ly), P.F.wz(lx, lz), size * P.F.s, col, blink ? { blink } : undefined); }
// dynamic glows: an object we keep a handle on and animate (colour / size / position) per step
function bbaDynGlow(api, P, lx, ly, lz, size, col) {
  const g = { x: P.F.wx(lx, lz), y: P.F.wy(ly), z: P.F.wz(lx, lz), s: size * P.F.s, s0: size * P.F.s, c: burnsRGBf(col || '#ffffff'), ph: Math.random() * 10, blink: 0, hidden: false };
  api.world.glows.push(g);
  return g;
}

/* ---- the burn: engulf a piece in flames (a Friday-night spectacle; geometry stays, it's art) ---- */
function bbaBurn(g, P, o) {
  o = o || {};
  if (P.burning && !P.burning.done) return P.burning;
  // flame points sampled from the piece's own colliders (tops and sides)
  const pts = [], rng = mulberry32(hashStr(P.id + 'burn')), cols = P.cols.filter(c => !c.camPass && (c.y1 - c.y0) > 0.6);
  for (let i = 0; i < 90 && cols.length; i++) {
    const c = cols[(rng() * cols.length) | 0], top = rng() < 0.6;
    if (c.t === 'cyl' || c.t === 'dome') { const a = rng() * TAU, r = top ? c.r * Math.sqrt(rng()) : c.r; pts.push([c.x + Math.sin(a) * r, top ? c.y1 : lerp(c.y0, c.y1, rng()), c.z + Math.cos(a) * r]); }
    else { const lx = (rng() * 2 - 1) * c.hx, lz = (rng() * 2 - 1) * c.hz, cy = Math.cos(c.yaw || 0), sy = Math.sin(c.yaw || 0); pts.push([c.x + lx * cy + lz * sy, top ? (c.t === 'ramp' ? (c.ya + c.yb) / 2 : c.y1) : lerp(c.y0, c.y1, rng()), c.z - lx * sy + lz * cy]); }
  }
  if (!pts.length) pts.push([P.x, P.F.y0 + 2, P.z]);
  let cy = 0; for (const q of pts) cy += q[1]; cy /= pts.length;
  P.burning = { t: 0, dur: o.dur || 45, pts, cx: P.x, cy, cz: P.z, hazard: !!o.hazard, onDone: o.onDone, done: false, k: 0 };
  burnsSfx('flame_jet'); burnsSfx('crowd_cheer', { vol: 0.8 }); g.shake(0.2);
  g.missions.event('bbaBurn', P);
  return P.burning;
}
function bbaBurnStep(g, P, wdt) {
  const B = P.burning; if (B.done) return;
  B.t += wdt;
  const t = B.t, d = B.dur, k = B.k = t < 6 ? t / 6 : t > d - 8 ? Math.max(0, (d - t) / 8) : 1;
  const n = Math.random() < k ? 2 + ((k * 4) | 0) : 0;
  for (let i = 0; i < n; i++) {
    const q = B.pts[(Math.random() * B.pts.length) | 0];
    g.fx.add(q[0] + (Math.random() - 0.5) * 1.2, q[1], q[2] + (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.5, 3 + Math.random() * 4, (Math.random() - 0.5) * 1.5, 0.7 + Math.random() * 0.5, 2.6 * (0.6 + k * 0.6), 0.8, [1, 0.5 + Math.random() * 0.3, 0.15], 1, 'flame', 1);
    if (Math.random() < 0.3) g.fx.add(q[0], q[1] + 1, q[2], (Math.random() - 0.5) * 3, 4 + Math.random() * 6, (Math.random() - 0.5) * 3, 1.6, 0.14, 0.04, [1, 0.7, 0.3], 1, 'spark', 1 | 4);
  }
  if (Math.random() < wdt * 14 * k) { const q = B.pts[(Math.random() * B.pts.length) | 0]; g.fx.add(q[0], q[1] + 2, q[2], (Math.random() - 0.5) * 1.5, 3 + Math.random() * 2, (Math.random() - 0.5) * 1.5, 4.5, 3, 11, [0.2, 0.17, 0.18], 0.4, 'smoke', 4); }
  if (Math.random() < wdt * 3 * k) burnsSfx('flame_jet', { vol: 0.5 * k, pitch: 0.7 + Math.random() * 0.3 });
  if (B.hazard && k > 0.3 && Math.random() < wdt * 4) { const q = B.pts[(Math.random() * B.pts.length) | 0]; g.addTempFire(q[0], q[1], q[2], 1.2, 1.5); }
  if (t >= d) { B.done = true; burnsSfx('crowd_cheer'); g.missions.event('bbaBurnDone', P); if (B.onDone) B.onDone(g, P); }
}
function bbaBurnDraw(g, Rr, Sp, P) {
  const B = P.burning; if (B.done || B.k < 0.01) return;
  const fl = 0.85 + 0.15 * Math.sin(P.R.t * 9) * Math.sin(P.R.t * 5.3), sz = (P.K.size || 30) * P.F.s;
  Rr.bbs.bb(B.cx, B.cy + 4, B.cz, sz * 1.4, sz * 1.4, Sp.glow, [1, 0.5, 0.18], 0.55 * B.k * fl, true);
  if (g.frameN !== B.lf) { B.lf = g.frameN; g.pointLight(B.cx, B.cy + 3, B.cz, sz * 1.6, [1, 0.5, 0.2], 2.6 * B.k * fl); }
}

/* ======================= public API ======================= */
const BurnsBigArt = {
  version: 1,
  kinds: {},
  // place a piece while building a world. Returns the piece handle (see docs/BURNS_BIGART.md).
  place(api, g, kind, x, z, o) {
    if (!api || !api.world) throw new Error('BurnsBigArt.place(api, g, kind, x, z, opts): api required');
    g = g || api.game;
    const K = this.kinds[kind]; if (!K) throw new Error('BurnsBigArt: unknown kind ' + kind + ' (try ' + Object.keys(this.kinds).join(', ') + ')');
    o = Object.assign({}, o || {});
    const W = api.world, R = bbaRT(W);
    if (!R.registered) { R.registered = true; api.update((gg, dt) => bbaUpdate(gg, dt, R)); }
    R.kinds[kind] = (R.kinds[kind] || 0) + 1;
    const s = clamp(o.scale === undefined ? 1 : o.scale, 0.6, 1.6), rot = o.rotY || o.yaw || 0;
    const y0 = o.y !== undefined ? o.y : api.height(x, z);
    const id = o.id || (R.kinds[kind] > 1 ? kind + R.kinds[kind] : kind);
    const P = {
      kind, id, K, o, x, z, rot, s, y0, F: bbaFrame(x, y0, z, rot, s), R, api, g,
      cols: [], movers: [], climbs: [], zips: [], spots: {}, summit: null, reached: false, route: [], maxNight: g ? bbaMaxNight(g) : 1,
      toWorld(lx, ly, lz) { return this.F.w(lx, ly || 0, lz); },
      toLocal(wx, wz) { return this.F.l(wx, wz); },
      night() { return bbaNight(this.g, this); }
    };
    K.build(api, g, P);
    if (P.summitL) { const q = P.summitL; P.summit = { x: P.F.wx(q[0], q[2]), y: P.F.wy(q[1]), z: P.F.wz(q[0], q[2]), r: (q[3] || 2.2) * s }; }
    // summit token: an explicit mission id, or token: true (auto mission 'bba_<id>')
    if (o.token && !o.mission) o.mission = typeof o.token === 'string' ? o.token : 'bba_' + id;
    if (o.mission && g && g.missions) {
      let m = g.missions.get(o.mission);
      if (!m && o.token) {
        const def = this.mission(kind, o.mission, { marker: { x, z } });
        const wd = g.def; if (wd && wd.missions && !wd.missions.find(q => q.id === def.id)) wd.missions.push(def);
        const done = BurnsSave.hasToken(g.worldId, def.id);
        m = { def, id: def.id, state: done ? 'done' : 'available', n: 0, t: 0, data: {}, tokenOut: false };
        g.missions.list.push(m);
      }
      if (m && !m.def.marker) m.def.marker = { x, z };
    }
    R.pieces.push(P);
    return P;
  },
  // a ready-made mission definition for a piece's summit (put it in your world's missions list)
  mission(kind, id, extra) {
    const K = this.kinds[kind] || { name: kind, hint: '' };
    return Object.assign({ id, name: K.mission || ('Summit: ' + K.name), short: 'Reach the top of ' + K.name, type: 'custom', start: 'manual', desc: K.desc || '', hint: K.hint || ('Climb ' + K.name) }, extra || {});
  },
  info(kind) { const K = this.kinds[kind]; return K ? { name: K.name, desc: K.desc, size: K.size, foot: K.foot, height: K.height, summit: K.summitY } : null; },
  list() { return Object.keys(this.kinds); },
  pieces(g) { const R = g && g.world && g.world._bba; return R ? R.pieces.slice() : []; },
  piece(g, id) { return this.pieces(g).find(P => P.id === id) || null; },
  nightK(g, P) { return bbaNight(g, P); },
  beamHits(g, x, z) { return bbaBeamHits(g, x, z); },
  // register something a lighthouse beam can reveal: fn(g, q) runs once, when a lit beam sweeps (x, z)
  revealable(g, x, z, fn, r) { const R = g.world && g.world._bba; if (!R) return null; const q = { x, z, r: r || 1.5, fn, done: false, kind: 'custom' }; R.reveals.push(q); return q; },
  // set a piece on fire (spectacle): opts { dur: seconds (45), hazard: false, onDone(g, piece) }
  burn(g, piece, o) { const P = typeof piece === 'string' ? this.piece(g, piece) : piece; if (!P) return null; return P.K.burn ? P.K.burn(g, P, o || {}) : bbaBurn(g, P, o); },
  // is Brady currently climbing / ziplining / looping?
  state(g) { const R = g.world && g.world._bba; if (!R) return {}; return { climbing: !!R.climb, riding: R.ride ? R.ride.kind : null, air: !!R.air }; }
};
// debug / test access (the bundle is one IIFE)
try { window.BRADY_BURNS_BIGART = BurnsBigArt; if (window.BRADY_BURNS) window.BRADY_BURNS.BurnsBigArt = BurnsBigArt; } catch (e) { /* no window */ }

/* ======================= 1. THE KNOTTED SEMI =======================
   A big rig that tied its own trailer into a loop-de-loop and parked its cab on top of the knot.
   Local layout (+Z = direction of travel):
     entry lane x = -2.4: open rear doors at z = -21, a box-trailer tunnel to z = -7.5, then the deck
     the loop: bottom at z = 0, radius 6.8, drifting 4.8 m to the right over one turn
     exit lane x = +2.4: straight to z = 8, then the trailer's nose kicks up into a launch ramp (lip z = 24, 4.3 m)
     the ring of fire at z = 29.3; spilled cargo crates up the left side; a ratchet-strap net to the cradle
     the cab sits on a steel cradle on top of the loop (deck 14.7 m), sleeper roof = summit (~18.5 m) */
const BBA_SEMI = { R: 6.8, LANE: 2.4, DRIFT: 4.8, Y: 0.06, RAMP0: 8, RAMP1: 24, RA: 0.0166 };
BBA_SEMI.rampY = z => z <= BBA_SEMI.RAMP0 ? 0 : BBA_SEMI.RA * (z - BBA_SEMI.RAMP0) * (z - BBA_SEMI.RAMP0);
BBA_SEMI.deck = BBA_SEMI.Y + 2 * BBA_SEMI.R + 0.38 + 0.62;     // cradle deck top
BurnsBigArt.kinds.knottedSemi = {
  name: 'The Knotted Semi', mission: 'King of the Knot', size: 64, foot: [22, 66], height: 20, summitY: 18.5,
  desc: 'A big rig that tied its own trailer into a loop-de-loop and parked the cab on top of the knot.',
  hint: 'Climb the spilled cargo, leap for the ratchet strap, then hop up the cab. On the yellow bike: hit the loop fast.',
  build(api, g, P) { bbaSemiBuild(api, g, P); }
};
function bbaSemiBuild(api, g, P) {
  const S = BBA_SEMI, R0 = S.R, LN = S.LANE, DR = S.DRIFT, Y = S.Y, YD = S.deck, F = P.F, N = 96;
  const PROF = [[-1.38, -0.38], [1.38, -0.38], [1.38, 0.42], [1.05, 0.42], [1.05, 0.0], [-1.05, 0.0], [-1.05, 0.42], [-1.38, 0.42]];
  const ribbonCol = (j, k) => k === 4 ? (Math.floor(j / 2) % 2 ? '#9a7048' : '#86603e') : k === 0 ? '#26262c' : (k === 1 || k === 7) ? (Math.floor(j / 3) % 2 ? '#f2eee6' : '#d23a30') : (k === 2 || k === 6) ? '#d8dce4' : '#b82a26';
  const loopF = j => { const th = j / N * TAU, s = Math.sin(th), c = Math.cos(th); return { p: [-LN + DR * th / TAU, Y + R0 * (1 - c), R0 * s], l: [1, 0, 0], n: [0, c, -s] }; };
  const entryF = j => ({ p: [-LN, Y, lerp(-21, 0, j / 42)], l: [1, 0, 0], n: [0, 1, 0] });
  const exitF = j => { const z = j * 0.5, d = z <= S.RAMP0 ? 0 : 2 * S.RA * (z - S.RAMP0), nn = bbaV.norm(0, 1, -d); return { p: [LN, Y + S.rampY(z), z], l: [1, 0, 0], n: nn }; };
  const night = P.maxNight;
  /* ---- part A: the trailer (entry tunnel, loop, exit, ramp) ---- */
  bbaPart(api, P, 0, 0, m => {
    const cols = [], lights = [];
    m.shine(1);
    bbaSweep(m, N + 1, loopF, PROF, ribbonCol);
    bbaSweep(m, 43, entryF, PROF, ribbonCol);
    bbaSweep(m, 49, exitF, PROF, ribbonCol);
    m.shine(0);
    // chassis rails under the loop (visible from below and at the top of the loop)
    m.color('#3a3a42');
    for (const u of [-0.62, 0.62]) bbaSweep(m, N / 2 + 1, j => loopF(j * 2), [[u - 0.09, -0.62], [u + 0.09, -0.62], [u + 0.09, -0.38], [u - 0.09, -0.38]]);
    // the trailer's wheels, flung up into the air on the outside of the loop
    for (const th of [Math.PI + 0.62, Math.PI + 0.86]) {
      const f = loopF(th / TAU * N), o = -0.38 - 0.62;
      m.lo = true;
      for (const u of [-1.0, -0.55, 0.55, 1.0]) {
        m.push(); m.tf(f.p[0] + u, f.p[1] + f.n[1] * o, f.p[2] + f.n[2] * o, 0, -th, Math.PI / 2);
        m.color('#18181c'); m.roundCyl(0, -0.2, 0, 0.56, 0.4, 0.14, { seg: 10 });
        m.color('#c8ccd4').shine(2); m.roundCyl(0, -0.22, 0, 0.3, 0.44, 0.08, { seg: 8 }); m.shine(0);
        m.pop();
      }
      m.lo = false;
    }
    // marker lights on the curb tops, all the way round (they glow at night)
    for (let j = 2; j < N; j += 6) {
      const f = loopF(j);
      for (const u of [-1.22, 1.22]) {
        const q = [f.p[0] + u, f.p[1] + f.n[1] * 0.47, f.p[2] + f.n[2] * 0.47];
        m.color(u < 0 ? '#ffb020' : '#ff3a2a', 0.9); m.ball(q[0], q[1], q[2], 0.1, { seg: 6, rings: 4 }); m.emissive(0);
        if (j % 12 === 2) lights.push({ x: q[0], y: q[1], z: q[2], s: 0.55, c: u < 0 ? '#ffb020' : '#ff4a2a' });
      }
    }
    // --- the box-trailer tunnel over the entry lane (double-skinned so it reads from inside too)
    const Z0 = -21, Z1 = -7.5, ZL = Z1 - Z0, ZC = (Z0 + Z1) / 2;
    for (const sx of [-1, 1]) {
      const x = -LN + sx * 1.32;
      m.color('#e8e4dc').shine(1); m.roundBox(x, 2.17, ZC, 0.14, 3.5, ZL, 0.06); m.shine(0);
      m.color('#c8302a'); m.roundBox(x + sx * 0.075, 1.0, ZC, 0.04, 0.32, ZL - 0.2, 0.02);
      m.color('#c8ccd4'); for (let z = Z0 + 0.6; z < Z1; z += 1.5) m.roundBox(x + sx * 0.08, 2.17, z, 0.06, 3.45, 0.12, 0.03);
      cols.push({ t: 'box', x, z: ZC, hx: 0.08, hz: ZL / 2, y0: 0, y1: 3.92, cover: true });
    }
    m.color('#dcd8d0').shine(1); m.roundBox(-LN, 3.98, ZC, 2.9, 0.14, ZL, 0.06); m.shine(0);
    cols.push({ t: 'box', x: -LN, z: ZC, hx: 1.45, hz: ZL / 2, y0: 3.86, y1: 4.05 });
    // LED strip inside the roof
    m.color('#ff4fd8', 1); m.roundBox(-LN - 0.5, 3.86, ZC, 0.08, 0.06, ZL - 0.6, 0.02); m.color('#38f2ff', 1); m.roundBox(-LN + 0.5, 3.86, ZC, 0.08, 0.06, ZL - 0.6, 0.02); m.emissive(0);
    // the roof peels back into a curl where the loop begins
    bbaSweep(m, 17, j => { const t = j / 16, a = t * Math.PI * 1.35, rr = 0.95 * (1 - 0.4 * t), y = 4.05 + rr * (1 - Math.cos(a)), z = Z1 + rr * Math.sin(a), nn = bbaV.norm(0, Math.cos(a), -Math.sin(a)); return { p: [-LN, y, z], l: [1, 0, 0], n: nn }; }, [[-1.45, -0.04], [1.45, -0.04], [1.45, 0.04], [-1.45, 0.04]], () => '#dcd8d0');
    // rear doors swung wide open
    for (const sx of [-1, 1]) {
      const hx = -LN + sx * 1.47;
      m.push(); m.tf(hx, 0, Z0, Math.PI);
      m.color('#e8e4dc').shine(1); m.roundBox(0, 2.17, -0.66, 0.1, 3.5, 1.32, 0.05); m.shine(0);
      m.color('#c8ccd4'); for (const zz of [-0.5, -0.95]) m.limb(sx * 0.07, 0.6, zz, sx * 0.07, 3.7, zz, 0.035, 0.035);
      m.color('#d23a30'); m.roundBox(sx * 0.06, 1.0, -0.66, 0.03, 0.3, 1.2, 0.02);
      m.pop();
      m.color('#9a9aa2'); m.roundCyl(hx, 0.4, Z0, 0.06, 3.4, 0.02, { seg: 6 });
    }
    // the front of the trailer: nose wall + landing gear under the lip
    const LIPY = Y + S.rampY(S.RAMP1);
    m.color('#e8e4dc').shine(1); m.roundBox(LN, LIPY / 2 - 0.2, S.RAMP1 - 0.35, 2.7, LIPY - 0.4, 0.3, 0.08); m.shine(0);
    m.color('#c8302a'); m.roundBox(LN, LIPY - 0.95, S.RAMP1 - 0.18, 2.5, 0.28, 0.06, 0.02);
    m.color('#3a3a42'); for (const sx of [-0.8, 0.8]) { m.limb(LN + sx, 0.25, 20.5, LN + sx, Y + S.rampY(20.5) - 0.4, 20.5, 0.14, 0.14); m.roundBox(LN + sx, 0.06, 20.5, 0.6, 0.12, 0.6, 0.05); }
    m.color('#c8ccd4').shine(2); m.roundCyl(LN, LIPY - 0.62, S.RAMP1 - 1.2, 0.2, 0.25, 0.05); m.shine(0);
    cols.push({ t: 'box', x: LN, z: S.RAMP1 - 0.35, hx: 1.4, hz: 0.2, y0: 0, y1: LIPY - 0.35 });
    for (const sx of [-0.8, 0.8]) cols.push({ t: 'cyl', x: LN + sx, z: 20.5, r: 0.18, y0: 0, y1: Y + S.rampY(20.5) - 0.4, camPass: true });
    // walkable deck + curbs on the straights, ramp pieces up to the lip
    cols.push({ t: 'box', x: -LN, z: -10.5, hx: 1.05, hz: 10.5, y0: 0, y1: Y });
    cols.push({ t: 'box', x: LN, z: 4, hx: 1.05, hz: 4, y0: 0, y1: Y });
    for (const sx of [-1, 1]) { cols.push({ t: 'box', x: -LN + sx * 1.21, z: -3.7, hx: 0.17, hz: 3.7, y0: 0, y1: Y + 0.45 }); cols.push({ t: 'box', x: LN + sx * 1.21, z: 4, hx: 0.17, hz: 4, y0: 0, y1: Y + 0.45 }); }
    for (let z = S.RAMP0; z < S.RAMP1 - 0.01; z += 4) {
      const ya = Y + S.rampY(z), yb = Y + S.rampY(z + 4);
      cols.push({ t: 'ramp', x: LN, z: z + 2, hx: 1.05, hz: 2, y0: Math.max(0, ya - 0.5), ya, yb });
      for (const sx of [-1, 1]) cols.push({ t: 'ramp', x: LN + sx * 1.21, z: z + 2, hx: 0.17, hz: 2, y0: Math.max(0, ya - 0.5), ya: ya + 0.45, yb: yb + 0.45 });
    }
    // the low first stretch of the loop (so walking in doesn't clip through the deck)
    for (const [j0, j1, sgn] of [[0, 5, 1], [N - 5, N, -1]]) {
      const a = loopF(j0), b = loopF(j1), zc = (a.p[2] + b.p[2]) / 2, hz = Math.abs(b.p[2] - a.p[2]) / 2;
      cols.push({ t: 'ramp', x: (a.p[0] + b.p[0]) / 2, z: zc, hx: 1.05, hz, y0: 0, ya: sgn > 0 ? a.p[1] : b.p[1], yb: sgn > 0 ? b.p[1] : a.p[1] });
    }
    lights.push({ x: -LN, y: 0.2, z: -14, s: 0, c: '#ff4fd8', pool: 8 * (night > 0.25 ? 1 : 0) });
    return { cols, lights };
  });
  /* ---- part B: the steel cradle + the cab on top of the knot ---- */
  bbaPart(api, P, 0, 0.5, m => {
    const cols = [], lights = [];
    const yb = Y + 2 * R0 + 0.38;
    m.color('#4a4a54').shine(1); m.roundBox(0, (yb + YD) / 2, 0, 3.8, YD - yb, 8.4, 0.18);
    m.color('#ffd21a'); m.roundBox(0, YD - 0.08, 4.1, 3.7, 0.12, 0.25, 0.05); m.roundBox(0, YD - 0.08, -4.1, 3.7, 0.12, 0.25, 0.05);
    for (const z of [-3.2, 3.2]) { m.color('#3a3a44'); m.roundBox(0, (yb - 0.85 + yb) / 2, z, 2.6, 1.0, 0.7, 0.2); }
    m.shine(0);
    cols.push({ t: 'box', x: 0, z: 0, hx: 1.9, hz: 4.2, y0: yb - 0.3, y1: YD });
    m.push(); m.tf(0, YD, 0);
    bbaCab(m, cols, lights, YD);
    m.pop();
    // ratchet strap net from the cradle edge down to the top crate
    m.color('#ffd21a').shine(1);
    for (const dz of [-0.62, 0.62]) m.roundBox(-2.08, (YD + 9.7) / 2, 2.0 + dz, 0.06, YD - 9.7, 0.12, 0.03);
    for (let y = 10.1; y < YD - 0.2; y += 0.55) m.roundBox(-2.08, y, 2.0, 0.07, 0.07, 1.32, 0.03);
    m.color('#4a4a54'); m.roundBox(-2.12, YD - 0.6, 2.0, 0.16, 0.36, 0.5, 0.06); m.shine(0);
    return { cols, lights };
  });
  bbaClimbZone(api, P, { x: -2.05, z: 2.0, y0: 9.8, y1: YD, nx: -1, nz: 0, hw: 0.7, top: YD, exit: 0.95, name: 'strap' });
  /* ---- part C: spilled cargo (the climbing stair up the left side) ---- */
  const crates = [[-9.0, -10.0, 2.8, 1.4, 'crate'], [-11.0, -7.0, 2.6, 2.8, 'cooler'], [-9.6, -4.0, 2.6, 4.2, 'crate'], [-11.4, -1.2, 2.6, 5.6, 'disco'],
    [-9.4, 1.6, 2.6, 7.0, 'crate'], [-7.4, 4.2, 2.4, 8.4, 'cooler'], [-5.0, 2.6, 2.4, 9.8, 'fragile']];
  bbaPart(api, P, -9, -2, m => {
    const cols = [], lights = [];
    crates.forEach(([x, z, w, top, kind], i) => {
      bbaCrate(m, x, 0, z, w, top, kind, i);
      cols.push({ t: 'box', x, z, hx: w / 2, hz: w / 2, y0: 0, y1: top, cover: true });
    });
    // a giant rubber duck riding the top of the cooler stack (decor)
    m.color('#ffd21a').shine(2); m.ellipsoid(-7.9, 9.15, 4.9, 0.55, 0.5, 0.7); m.ball(-7.9, 9.85, 5.35, 0.36); m.color('#ff8a1a'); m.ellipsoid(-7.9, 9.82, 5.75, 0.16, 0.08, 0.22); m.shine(0);
    m.color('#1a1a1a'); m.ball(-7.68, 9.98, 5.58, 0.05, { seg: 6, rings: 4 }); m.ball(-8.12, 9.98, 5.58, 0.05, { seg: 6, rings: 4 });
    return { cols, lights };
  });
  /* ---- part D: the ring of fire + landing zone ---- */
  const LIPY = Y + S.rampY(S.RAMP1);
  const hoop = { x: LN, y: LIPY + 3.2, z: 29.3, r: 2.4 };
  bbaPart(api, P, LN + 2, 29, m => {
    const cols = [], lights = [];
    const ring = []; for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU; ring.push([hoop.x + Math.cos(a) * hoop.r, hoop.y + Math.sin(a) * hoop.r, hoop.z]); }
    bbaTube(m, ring, 0.24, m.segs(8, 5), { caps: false, colFn: j => (Math.floor(j / 3) % 2 ? '#f4f0e8' : '#e8402a') });
    m.color('#3a3a44').shine(1); m.limb(hoop.x + 3.9, 0, hoop.z, hoop.x + 3.9, hoop.y + 0.4, hoop.z, 0.22, 0.16); m.limb(hoop.x + 3.9, hoop.y + 0.4, hoop.z, hoop.x + hoop.r + 0.1, hoop.y, hoop.z, 0.14, 0.12); m.shine(0);
    m.color('#ffd21a'); m.roundBox(hoop.x + 3.9, 0.2, hoop.z, 1.2, 0.4, 1.2, 0.15);
    cols.push({ t: 'cyl', x: hoop.x + 3.9, z: hoop.z, r: 0.3, y0: 0, y1: hoop.y + 0.4, camPass: true });
    lights.push({ x: hoop.x, y: hoop.y + hoop.r, z: hoop.z, s: 1.6, c: '#ff8a2a' });
    return { cols, lights };
  });
  api.paint((c, Pp, sc) => {
    const [px, pz] = Pp(F.wx(LN, 38), F.wz(LN, 38)), r = 9 * sc * F.s;
    const gg = c.createRadialGradient(px, pz, 0, px, pz, r); gg.addColorStop(0, 'rgba(240,215,180,0.65)'); gg.addColorStop(1, 'rgba(240,215,180,0)');
    c.fillStyle = gg; c.fillRect(px - r, pz - r, r * 2, r * 2);
  });
  /* ---- mechanics ---- */
  const L = { x: F.wx(-LN, 0), z: F.wz(-LN, 0), y: F.wy(Y), yaw: F.rot, fx: Math.sin(F.rot), fz: Math.cos(F.rot), R: R0 * F.s, drift: DR * F.s, minV: 8.5, camSide: 1, piece: P };
  P.R.loops.push(L); P.loop = L;
  const kd = F.dir(0, 1);
  const k = { x: F.wx(LN, S.RAMP1), z: F.wz(LN, S.RAMP1), y: F.wy(LIPY), fx: kd[0], fz: kd[1], hw: 1.15 * F.s, len: 0.75 * F.s, vyBike: 11, vyFoot: 10.5, piece: P,
    hoop: { x: F.wx(hoop.x, hoop.z), y: F.wy(hoop.y), z: F.wz(hoop.x, hoop.z), r: hoop.r * F.s, nx: kd[0], nz: kd[1] } };
  P.R.kicks.push(k); P.kick = k;
  P.summitL = [0, YD + 3.85, -2.25, 1.35];
  P.spots = { deck: F.w(0, YD, 3.0), cabRoof: F.w(0, YD + 3.85, -2.25), lip: F.w(LN, LIPY, S.RAMP1), hoop: F.w(hoop.x, hoop.y, hoop.z), loopEntry: F.w(-LN, 0, -12), cargo: F.w(-9, 1.4, -10), landing: F.w(LN, 0, 38) };
  // climbing route (local): used for glow sticks and by the test bot
  P.route = [['walk', -9, -13.2], ['jump', -9.0, -10.0], ['jump', -11.0, -7.0], ['jump', -9.6, -4.0], ['jump', -11.4, -1.2], ['jump', -9.4, 1.6], ['jump', -7.4, 4.2], ['jump', -5.4, 2.4],
    ['walk', -4.15, 2.0], ['jump', -2.6, 2.0, 0, 'grab'], ['climb', 'strap'], ['walk', -1.55, 1.45], ['jump', -1.3, 0.1], ['jump', -0.4, 1.7], ['jump', -0.2, 0.1], ['jump', 0, -2.2]];
  bbaGlowPath(api, P, [[-9, 2.3, -10], [-11, 3.7, -7], [-9.6, 5.1, -4], [-11.4, 6.5, -1.2], [-9.4, 7.9, 1.6], [-7.4, 9.3, 4.2], [-5.0, 10.7, 2.6], [-3.2, 11.6, 2.0], [-2.5, 12.6, 2.0], [-2.5, 13.8, 2.0], [-1.4, YD + 0.9, 0], [-0.4, YD + 3.1, 1.6], [0, YD + 4.7, -2.2]]);
  // the loop ride and the launch arc pass through glow sticks too
  const lp = []; for (let j = 8; j < N; j += 8) { const f = loopF(j); lp.push([f.p[0] + f.n[0] * 1.3, f.p[1] + f.n[1] * 1.3, f.p[2] + f.n[2] * 1.3]); }
  bbaGlowPath(api, P, lp);
  bbaGlowPath(api, P, [[LN, LIPY + 2.6, 26.5], [LN, hoop.y, hoop.z], [LN, LIPY + 2.0, 33], [LN, LIPY - 0.5, 36]]);
  // night dressing
  bbaPool(api, P, 0, 4, 10, '#ffb070', 0.35);
  bbaPool(api, P, LN, 30, 7, '#ff7a2a', 0.45);
  bbaPool(api, P, -9, -2, 9, '#ffd29a', 0.3);
  bbaGlow(api, P, 0.78, YD + 1.75, 3.55, 1.4, '#fff4d8'); bbaGlow(api, P, -0.78, YD + 1.75, 3.55, 1.4, '#fff4d8');
  if (P.o.sign !== false) api.sign('THE KNOTTED SEMI\nRIDE THE LOOP · CLIMB THE CARGO', F.wx(-6, -18), F.wz(-6, -18), { yaw: F.rot + Math.PI, h: 1.3, style: { bg: '#2a0a0a', fg: '#ffd84a', size: 36, border: '#ff4a2a', glow: '#ff7a2a' }, glow: '#ff7a2a' });
  P.update = (gg, wdt) => {
    // the ring of fire burns at night; the loop's chase lights are drawn in P.draw
    const nk = bbaNight(gg, P);
    if (nk > 0.3 && Math.random() < wdt * 90 * nk) { const a = Math.random() * TAU, hh = k.hoop; gg.fx.fire(hh.x + Math.cos(a) * hh.r * kd[1], hh.y + Math.sin(a) * hh.r, hh.z - Math.cos(a) * hh.r * kd[0], 0.55); }
  };
  const chase = []; for (let j = 0; j < N; j += 2) { const f = loopF(j); for (const u of [-1.22, 1.22]) chase.push(F.w(f.p[0] + u, f.p[1] + f.n[1] * 0.5, f.p[2] + f.n[2] * 0.5)); }
  P.draw = (gg, Rr, Sp, nk) => {
    if (nk < 0.05) return;
    const cam = gg.cam; if ((cam.x - F.x) * (cam.x - F.x) + (cam.z - F.z) * (cam.z - F.z) > 160 * 160) return;
    const t = P.R.t, col = [0, 0, 0];
    for (let i = 0; i < chase.length; i++) {
      const q = chase[i], ph = (i >> 1) / (chase.length >> 1), w = Math.pow(0.5 + 0.5 * Math.sin((ph * 6 - t * 1.6) * TAU), 6);
      const c = bbaHue((ph * 360 + t * 40) % 360, 1, 0.6); col[0] = c[0]; col[1] = c[1]; col[2] = c[2];
      Rr.bbs.bb(q[0], q[1], q[2], 0.7 + w * 1.1, 0.7 + w * 1.1, Sp.glow, col, (0.25 + w * 0.75) * nk, true);
    }
    // headlight beams off the top of the knot
    const h0 = F.w(0, YD + 1.75, 3.6), h1 = F.w(0, YD - 4, 22);
    bbaLine(Rr, h0[0], h0[1], h0[2], h1[0], h1[1], h1[2], 7, Sp.beam, [1, 0.95, 0.8], 0.22 * nk, true);
  };
}
// a long-nose big rig cab in local space (origin = deck top under the cab centre, facing +z)
function bbaCab(m, cols, lights, yd) {
  const L0 = lights.length;
  const red = '#d42a3a', cream = '#f4ecd8', chrome = '#d8dce4';
  m.color('#26262c'); m.roundBox(0, 0.62, 0, 1.9, 0.42, 7.3, 0.12);
  for (const z of [2.3, -1.7, -3.0]) for (const sx of [-1, 1]) {
    m.push(); m.tf(sx * 1.08, 0.58, z, 0, 0, Math.PI / 2);
    m.color('#18181c'); m.roundCyl(0, -0.21, 0, 0.58, 0.42, 0.16, { seg: m.segs(16, 8) });
    m.color(chrome).shine(3); m.roundCyl(0, -0.23 + (sx > 0 ? 0 : 0.02), 0, 0.32, 0.46, 0.08, { seg: 12 }); m.shine(0);
    m.pop();
  }
  // fuel tanks (the first step up)
  for (const sx of [-1, 1]) { m.push(); m.tf(sx * 1.3, 0.85, 0, 0, Math.PI / 2, 0); m.color(chrome).shine(3); m.roundCyl(0, -0.9, 0, 0.38, 1.8, 0.12, { seg: 14 }); m.shine(0); m.pop(); }
  // hood + fenders + grille
  m.color(red).shine(2); m.roundBox(0, 1.62, 2.1, 1.9, 1.15, 2.7, 0.42);
  for (const sx of [-1, 1]) m.ellipsoid(sx * 1.06, 1.0, 2.3, 0.42, 0.55, 0.95, { phi1: Math.PI / 2 });
  m.color(chrome).shine(3); m.roundBox(0, 1.55, 3.47, 1.5, 1.15, 0.16, 0.06);
  m.color('#3a3a44').shine(1); for (let i = 0; i < 6; i++) m.roundBox(0, 1.12 + i * 0.17, 3.56, 1.3, 0.05, 0.04, 0.02);
  m.color(chrome).shine(3); m.roundBox(0, 0.86, 3.68, 2.4, 0.32, 0.3, 0.12);
  for (const sx of [-1, 1]) { m.roundCyl(sx * 0.78, 1.6, 3.42, 0.24, 0.28, 0.06, { seg: 12 }); }
  m.shine(0);
  for (const sx of [-1, 1]) { m.push(); m.tf(sx * 0.78, 1.75, 3.62, 0, Math.PI / 2, 0); m.color('#fff4d8', 1); m.roundCyl(0, -0.05, 0, 0.19, 0.08, 0.03, { seg: 12 }); m.pop(); }
  m.emissive(0);
  // hood ornament: a little chrome flame
  m.color(chrome).shine(3); m.ellipsoid(0, 2.28, 3.25, 0.08, 0.16, 0.22); m.shine(0);
  // cab + windshield + sleeper + roof fairing
  m.color(red).shine(2); m.roundBox(0, 2.15, -0.1, 2.3, 2.3, 1.7, 0.32);
  m.color(cream); m.roundBox(0, 1.95, -0.1, 2.34, 0.22, 1.66, 0.08); m.roundBox(0, 1.95, -2.25, 2.34, 0.22, 2.56, 0.08);
  m.color(red); m.roundBox(0, 2.35, -2.25, 2.3, 2.7, 2.6, 0.36);
  m.roundBox(0, 3.55, -1.55, 2.2, 0.62, 2.1, 0.3);
  m.color('#1c2433').shine(3);
  m.push(); m.tf(0, 2.72, 0.76, 0, -0.22, 0); m.roundBox(0, 0, 0, 2.0, 0.78, 0.08, 0.06); m.pop();
  for (const sx of [-1, 1]) m.roundBox(sx * 1.16, 2.62, -0.1, 0.06, 0.7, 1.1, 0.04);
  m.shine(0);
  // exhaust stacks with little rain caps
  for (const sx of [-1, 1]) { m.color(chrome).shine(3); m.limb(sx * 1.32, 1.0, -0.98, sx * 1.32, 5.0, -0.98, 0.13, 0.13); m.color('#2a2a30'); m.ellipsoid(sx * 1.32, 5.08, -0.92, 0.17, 0.05, 0.2); m.shine(0); }
  // air horns + roof marker lights
  m.color(chrome).shine(3); for (const sx of [-0.35, 0.35]) m.limb(sx, 3.4, -0.3, sx, 3.42, 0.55, 0.06, 0.13); m.shine(0);
  for (let i = 0; i < 5; i++) { const x = -0.8 + i * 0.4; m.color('#ffb020', 1); m.ball(x, 3.32, 0.62, 0.07, { seg: 6, rings: 4 }); lights.push({ x, y: 3.32, z: 0.62, s: 0.35, c: '#ffb020' }); }
  m.emissive(0);
  lights.push({ x: 0.78, y: 1.75, z: 3.7, s: 1.1, c: '#fff4d8' }, { x: -0.78, y: 1.75, z: 3.7, s: 1.1, c: '#fff4d8' });
  // lights + colliders: geometry is built deck-relative (the caller translates m), these add the deck height
  for (let i = L0; i < lights.length; i++) lights[i].y += yd;
  const box = (x, z, hx, hz, h, o) => cols.push(Object.assign({ t: 'box', x, z, hx, hz, y0: yd, y1: yd + h }, o || {}));
  box(0, 0, 1.0, 3.6, 1.0, { cover: true });
  for (const sx of [-1, 1]) box(sx * 1.28, 0, 0.27, 0.9, 1.25);
  box(0, 2.1, 0.95, 1.35, 2.2, { cover: true });
  box(0, -0.1, 1.15, 0.85, 3.3, { cover: true });
  box(0, -2.25, 1.15, 1.3, 3.85, { cover: true });
  box(0, 3.6, 1.2, 0.18, 1.02);
  for (const sx of [-1, 1]) cols.push({ t: 'cyl', x: sx * 1.32, z: -0.98, r: 0.15, y0: yd, y1: yd + 5.0, camPass: true });
}
// a cargo crate (wood / cooler / disco / fragile) standing on the ground at (x, z), top at `top`
function bbaCrate(m, x, y, z, w, top, kind, i) {
  const h = top - y;
  if (kind === 'cooler') {
    m.color('#f4f6f8').shine(2); m.roundBox(x, y + h * 0.42, z, w, h * 0.84, w, 0.3);
    m.color('#2a7ad8'); m.roundBox(x, y + h * 0.92, z, w + 0.06, h * 0.16, w + 0.06, 0.2);
    m.color('#e8e8ec'); m.roundBox(x, y + h * 0.6, z + w / 2 + 0.05, w * 0.5, 0.18, 0.14, 0.06); m.shine(0);
    return;
  }
  const wood = i % 2 ? '#c89058' : '#b87e48', dark = '#8a5a30';
  m.color(wood).shine(1); m.roundBox(x, y + h / 2, z, w, h, w, 0.16); m.shine(0);
  m.color(dark);
  for (let yy = y + 0.7; yy < top - 0.3; yy += 1.4) for (const sz of [-1, 1]) { m.box(x, yy, z + sz * (w / 2 + 0.02), w - 0.24, 0.16, 0.05); m.box(x + sz * (w / 2 + 0.02), yy, z, 0.05, 0.16, w - 0.24); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.box(x + sx * (w / 2 - 0.1), y + h / 2, z + sz * (w / 2 + 0.02), 0.14, h - 0.2, 0.05);
  if (kind === 'disco') { m.color('#d8e4ff').shine(3); m.ball(x + 0.5, top + 0.05, z - 0.4, 0.7, { phi1: Math.PI * 0.55 }); m.shine(0); }
  if (kind === 'fragile') { m.color('#e8402a', 0.4); m.roundBox(x, y + h * 0.62, z + w / 2 + 0.05, w * 0.7, 0.4, 0.04, 0.02); m.roundBox(x - w / 2 - 0.05, y + h * 0.62, z, 0.04, 0.4, w * 0.7, 0.02); m.emissive(0); }
}

/* ======================= 2. THE PUMP JACK COLOSSUS =======================
   A skyscraper-tall nodding pump jack (+Z = toward the horse head). The walking beam rocks on a
   22 m samson post; the horse head's arc winds a bridle that lifts a level carrier bar straight up
   and down over the wellhead (z = 15) between 1.2 m and 19.8 m: ride it to the Gusher Tank lookout.
   Stand on the yellow FLING plate at the top of the stroke and the jack catapults you onto the crow's
   nest above the pivot (secret). At night it belches fire from its stacks at the top of every stroke. */
const BBA_PJ = { H: 22, LF: 15, LR: 8, A: 0.62, T: 16, YC: 10.5, RC: 4.65, CZ: -9.5, CY: 7.6, NEST: 25.62, TANK: [8.6, 15, 5.0, 19.6] };
BurnsBigArt.kinds.pumpJack = {
  name: 'The Pump Jack Colossus', mission: 'Ride the Nodding Horse', size: 44, foot: [24, 40], height: 37, summitY: 19.6,
  desc: 'A ten-storey steel horse nodding at the playa. Its carrier bar is a 19 m elevator. Its stroke is a catapult.',
  hint: 'Hop on the carrier bar when it dips, ride it up and jump to the Gusher Tank. Stand on the FLING plate for a surprise.',
  build(api, g, P) { bbaPumpBuild(api, g, P); }
};
function bbaPumpBuild(api, g, P) {
  const J = BBA_PJ, F = P.F, steel = '#5a606c', dark = '#3a3e48', yel = '#ffc21a', maroon = '#8a2a3a', brass = '#d8a84a';
  const TK = J.TANK;
  /* ---- static: skid, samson post, gearbox, motor, wellhead, tank, flare, crow's nest ---- */
  bbaPart(api, P, 0, -2, m => {
    const cols = [], lights = [];
    m.color(dark).shine(1); m.roundBox(0, 0.6, -3.5, 6.4, 1.2, 27, 0.35);
    m.color(yel); for (const sx of [-1, 1]) m.roundBox(sx * 3.22, 0.85, -3.5, 0.05, 0.25, 26.2, 0.03);
    cols.push({ t: 'box', x: 0, z: -3.5, hx: 3.2, hz: 13.5, y0: 0, y1: 1.2 });
    // samson post (A-frame)
    m.color(steel);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.limb(sx * 3.4, 1.2, sz * 4.6, sx * 1.25, 21.2, sz * 0.35, 0.42, 0.3);
    for (const y of [7, 13.5]) { const k = (y - 1.2) / 20, xx = lerp(3.4, 1.25, k), zz = lerp(4.6, 0.35, k); for (const sz of [-1, 1]) m.limb(-xx, y, sz * zz, xx, y, sz * zz, 0.18, 0.18); for (const sx of [-1, 1]) m.limb(sx * xx, y, -zz, sx * xx, y, zz, 0.18, 0.18); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cols.push({ t: 'cyl', x: sx * 3.2, z: sz * 4.3, r: 0.5, y0: 1.2, y1: 6, camPass: true });
    // bearing saddle
    m.color(dark); m.roundBox(0, 21.4, 0, 3.2, 0.9, 1.8, 0.3);
    m.color(brass).shine(2); m.push(); m.tf(0, 22, 0, 0, 0, Math.PI / 2); m.roundCyl(0, -1.9, 0, 0.42, 3.8, 0.12); m.pop(); m.shine(0);
    // crow's nest above the pivot (catapult target): side frames straddle the beam
    m.color(steel); for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.limb(sx * 1.55, 20.8, sz * 0.7, sx * 1.75, 25.3, sz * 1.9, 0.14, 0.12);
    m.color('#7a5a3a').shine(1); m.roundBox(0, 25.45, 0, 5.2, 0.34, 5.2, 0.12); m.shine(0);
    m.color(yel); for (const [x, z, w, d] of [[0, 2.55, 5.2, 0.1], [0, -2.55, 5.2, 0.1], [2.55, 0, 0.1, 5.2], [-2.55, 0, 0.1, 5.2]]) m.roundBox(x, 26.4, z, w, 0.1, d, 0.04);
    for (const [x, z] of [[2.5, 2.5], [-2.5, 2.5], [2.5, -2.5], [-2.5, -2.5]]) m.limb(x, 25.6, z, x, 26.45, z, 0.05, 0.05);
    m.color('#ff4fd8', 0.8); m.limb(2.3, 25.6, -2.3, 2.3, 28.5, -2.3, 0.04, 0.04); m.ellipsoid(2.55, 28.1, -2.3, 0.45, 0.3, 0.04); m.emissive(0);
    cols.push({ t: 'box', x: 0, z: 0, hx: 2.6, hz: 2.6, y0: 25.28, y1: J.NEST });
    // gearbox + crank shaft housing
    m.color(maroon).shine(2); m.roundBox(0, 4.8, J.CZ, 3.6, 7.2, 4.0, 0.6); m.shine(0);
    m.color(brass).shine(2); m.push(); m.tf(0, J.CY, J.CZ, 0, 0, Math.PI / 2); m.roundCyl(0, -2.3, 0, 0.55, 4.6, 0.15); m.pop(); m.shine(0);
    m.color('#1a1a22'); m.roundBox(0, 6.2, J.CZ + 2.02, 2.2, 1.2, 0.06, 0.05);
    m.color('#38f2ff', 1); m.roundBox(0, 6.2, J.CZ + 2.06, 1.9, 0.9, 0.02, 0.04); m.emissive(0);
    cols.push({ t: 'box', x: 0, z: J.CZ, hx: 1.8, hz: 2.0, y0: 0, y1: 8.4 });
    // motor + belt guard
    m.color(steel).shine(1); m.roundBox(0, 2.6, -15, 2.6, 2.8, 3.4, 0.6); m.color(yel); m.roundBox(1.5, 3.6, -13, 0.4, 3.2, 4.4, 0.18); m.shine(0);
    cols.push({ t: 'box', x: 0, z: -15, hx: 1.3, hz: 1.7, y0: 0, y1: 4.0 });
    // wellhead "christmas tree" under the carrier
    m.color(dark); m.roundCyl(0, 0, 15, 0.7, 0.35, 0.1); m.color(steel).shine(1); m.roundCyl(0, 0.35, 15, 0.32, 0.75, 0.08);
    m.color('#d82a2a'); for (const sx of [-1, 1]) { m.push(); m.tf(sx * 0.42, 0.75, 15, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.22, 0.05, { seg: 10, tseg: 5 }); m.pop(); }
    m.shine(0);
    cols.push({ t: 'cyl', x: 0, z: 15, r: 0.55, y0: 0, y1: 1.1 });
    // pipes to the tank
    m.color(dark); m.limb(0.4, 0.4, 15, 3.6, 0.4, 15, 0.16, 0.16);
    // the Gusher Tank (summit)
    m.color('#e8dcc4').shine(1);
    m.push(); m.tf(TK[0], 0, TK[1]);
    m.lathe([[0, 0], [TK[2], 0], [TK[2], 0], [TK[2], TK[3] - 0.5], [TK[2] - 0.25, TK[3] - 0.08], [TK[2] - 0.8, TK[3]], [0, TK[3]]], { seg: m.segs(28, 14) });
    m.color(maroon); m.lathe([[TK[2] + 0.04, 6], [TK[2] + 0.04, 6], [TK[2] + 0.04, 7.6], [TK[2] + 0.04, 7.6]], { seg: m.segs(28, 14) });
    m.color('#2a2a30'); m.lathe([[TK[2] + 0.03, 0.4], [TK[2] + 0.03, 0.4], [TK[2] + 0.03, 1.0], [TK[2] + 0.03, 1.0]], { seg: m.segs(28, 14) });
    m.color(yel); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; m.limb(Math.sin(a) * (TK[2] - 0.35), TK[3], Math.cos(a) * (TK[2] - 0.35), Math.sin(a) * (TK[2] - 0.35), TK[3] + 0.95, Math.cos(a) * (TK[2] - 0.35), 0.05, 0.05); }
    m.color(yel); m.torus(0, TK[3] + 0.95, 0, TK[2] - 0.35, 0.06, { seg: m.segs(28, 14), tseg: 4 });
    m.color(maroon); m.roundBox(0, TK[3] + 0.08, 0, 2.2, 0.16, 2.2, 0.07);
    m.pop(); m.shine(0);
    cols.push({ t: 'cyl', x: TK[0], z: TK[1], r: TK[2], y0: 0, y1: TK[3], cover: true });
    // flare stack
    m.color(steel).shine(1); m.limb(-7.5, 0, 7, -7.5, 15.5, 7, 0.38, 0.3); m.color(dark); m.roundCyl(-7.5, 15.4, 7, 0.5, 0.4, 0.1); m.roundBox(-7.5, 0.35, 7, 1.6, 0.7, 1.6, 0.2); m.shine(0);
    cols.push({ t: 'cyl', x: -7.5, z: 7, r: 0.45, y0: 0, y1: 15.8, camPass: true });
    // little boarding crate by the wellhead
    bbaCrate(m, -3.2, 0, 15.6, 1.4, 0.75, 'crate', 1);
    cols.push({ t: 'box', x: -3.2, z: 15.6, hx: 0.7, hz: 0.7, y0: 0, y1: 0.75 });
    lights.push({ x: -7.5, y: 16.2, z: 7, s: 0, c: '#ff8a2a', pool: 9 * (P.maxNight > 0.25 ? 1 : 0) });
    return { cols, lights };
  });
  if (P.o.sign !== false) {
    const sp = F.w(TK[0] + TK[2] + 0.05, 9.5, TK[1]);
    api.sign('DINO JUICE\n100% ARTISANAL CRUDE', sp[0], sp[2], { y: F.wy(8.4), post: false, yaw: F.rot + Math.PI / 2, h: 1.6, style: { bg: '#8a2a3a', fg: '#ffe8b0', size: 40, border: '#ffc21a' } });
  }
  /* ---- movers: walking beam + horse head, crank, pitman halves, carrier ---- */
  const beam = bbaMover(api, P, m => {
    m.color(maroon).shine(2);
    m.roundBox(0, 0, (J.LF - 2.2 - J.LR) / 2, 1.8, 2.0, J.LF - 2.2 + J.LR, 0.45);
    m.color(yel); m.roundBox(0, 1.02, (J.LF - 2.2 - J.LR) / 2, 1.0, 0.06, J.LF - 3 + J.LR, 0.03);
    // the horse head: a big "D" plate whose front arc (radius LF) carries the bridle
    const A0 = 0.74, RM = J.LF - 1.15, zb = J.LF * Math.cos(A0) - 0.6, D = [];
    for (let i = 0; i <= 24; i++) { const a = -A0 + 2 * A0 * i / 24; D.push([-(J.LF - 0.05) * Math.cos(a), (J.LF - 0.05) * Math.sin(a)]); }
    D.push([-zb, (J.LF - 0.05) * Math.sin(A0)]); D.push([-zb, -(J.LF - 0.05) * Math.sin(A0)]);
    m.color('#7a2232').shine(2);
    m.push(); m.tf(0, 0, 0, Math.PI / 2); m.extrude(D, 2.0); m.pop();
    for (const sx of [-1.0, 1.0]) bbaTube(m, D.concat([D[0]]).map(q => [sx, q[1], -q[0]]), 0.14, 5, { caps: false });
    m.color(brass).shine(3);
    bbaSweep(m, 25, j => { const a = -A0 + 2 * A0 * j / 24; return { p: [0, J.LF * Math.sin(a), J.LF * Math.cos(a)], l: [1, 0, 0], n: [0, Math.sin(a), Math.cos(a)] }; }, [[-0.8, -0.04], [0.8, -0.04], [0.8, 0.12], [-0.8, 0.12]]);
    m.color('#7a2232').shine(2);
    // ears, eyes, nostrils, mane of LED fins
    m.color('#7a2232'); for (const sx of [-0.55, 0.55]) { m.push(); m.tf(sx, (RM + 0.6) * Math.sin(A0) + 0.5, (RM + 0.6) * Math.cos(A0) - 1.4, 0, -0.5, sx * 0.4); m.lathe([[0.5, 0], [0.42, 1.0], [0.08, 2.0], [0, 2.1]], { seg: 8 }); m.pop(); }
    for (const sx of [-1, 1]) {
      const ey = RM * Math.sin(0.36), ez = RM * Math.cos(0.36) - 0.5;
      m.color('#f4ecd8'); m.ellipsoid(sx * 1.02, ey, ez, 0.16, 0.95, 0.8);
      m.color('#ff3a2a', 0.9); m.ellipsoid(sx * 1.1, ey + 0.08, ez + 0.12, 0.1, 0.48, 0.4); m.emissive(0);
      m.color('#1a1a22'); m.ellipsoid(sx * 0.42, J.LF * Math.sin(-A0) + 0.35, J.LF * Math.cos(-A0) + 0.15, 0.24, 0.32, 0.2);
    }
    for (let i = 0; i < 9; i++) { const z = -2 + i * 1.45; m.color(i % 2 ? '#ff4fd8' : '#38f2ff', 0.85); m.push(); m.tf(0, 1.0, z, 0, -0.35, 0); m.lathe([[0.22, 0], [0.14, 0.6], [0, 1.0]], { seg: 6, sx: 0.4 }); m.pop(); }
    m.emissive(0);
    // fire stacks near the head
    m.color('#2a2a30').shine(1); for (const sx of [-0.5, 0.5]) { m.roundCyl(sx, 0.9, J.LF - 4.2, 0.26, 1.5, 0.06); } m.shine(0);
    // equalizer bar at the rear end
    m.color(steel).shine(1); m.push(); m.tf(0, -0.4, -J.LR, 0, 0, Math.PI / 2); m.roundCyl(0, -2.9, 0, 0.32, 5.8, 0.1); m.pop(); m.shine(0);
    return { cols: [] };
  });
  const crank = bbaMover(api, P, m => {
    for (const sx of [-2.55, 2.55]) {
      m.color(steel).shine(1); m.push(); m.tf(sx, 0, 0, 0, 0, 0); m.roundBox(0, 0, J.RC * 0.15, 0.5, 1.5, J.RC * 1.6, 0.25); m.pop();
      m.color(maroon).shine(2); m.roundBox(sx, 0, -J.RC * 0.62, 0.9, 3.4, 2.6, 0.5);
      m.color(yel); m.roundBox(sx + Math.sign(sx) * 0.46, 0, -J.RC * 0.62, 0.04, 2.4, 1.6, 0.02);
      m.color(brass).shine(3); m.push(); m.tf(sx, 0, J.RC, 0, 0, Math.PI / 2); m.roundCyl(0, -0.4, 0, 0.3, 0.8, 0.08); m.pop();
    }
    m.shine(0);
    return { cols: [] };
  });
  const pitU = bbaMover(api, P, m => { m.color(steel).shine(1); for (const sx of [-2.55, 2.55]) m.limb(sx, 0, 0, sx, -9.4, 0, 0.3, 0.26); m.shine(0); return { cols: [] }; });
  const pitL = bbaMover(api, P, m => { m.color('#4a4e58').shine(1); for (const sx of [-2.55, 2.55]) m.limb(sx, 0, 0, sx, 9.4, 0, 0.22, 0.2); m.shine(0); return { cols: [] }; });
  const carrier = bbaMover(api, P, m => {
    m.color(dark).shine(1); m.roundBox(0, -0.18, 0, 4.4, 0.36, 4.4, 0.12);
    m.color('#8a8e98'); m.roundBox(0, 0.02, 0.6, 4.2, 0.06, 2.8, 0.02);
    // the FLING plate (rear half, toward the samson post)
    for (let i = 0; i < 6; i++) { m.color(i % 2 ? '#1a1a1a' : yel); m.roundBox(-1.0 + i * 0.4, 0.045, -1.35, 0.4, 0.06, 1.3, 0.02); }
    m.color(yel); for (const sx of [-1, 1]) m.roundBox(sx * 2.15, 0.3, 0, 0.1, 0.5, 4.2, 0.04);
    m.color('#3a3a44'); m.roundBox(0, 1.25, 0, 2.4, 0.22, 0.4, 0.08); m.limb(0, 1.1, 0, 0, 0.0, 0, 0.12, 0.12);
    m.color('#c8ccd4').shine(3); m.limb(0, -0.3, 0, 0, -20, 0, 0.13, 0.13); m.shine(0);
    m.color('#ff4fd8', 1); m.ball(-2.15, 0.6, 2.1, 0.12); m.ball(2.15, 0.6, 2.1, 0.12); m.ball(-2.15, 0.6, -2.1, 0.12); m.ball(2.15, 0.6, -2.1, 0.12); m.emissive(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.2, hz: 2.2, y0: -0.36, y1: 0 }], lights: [{ x: -2.15, y: 0.6, z: 2.1, s: 0.5, c: '#ff4fd8' }, { x: 2.15, y: 0.6, z: -2.1, s: 0.5, c: '#ff4fd8' }] };
  });
  P.parts = { beam, crank, pitU, pitL, carrier };
  const st = P.pj = { th: 0, ph: P.o.phase || 0, prevPh: 0, fire: 0, lastTop: -9 };
  const om = TAU / J.T;
  const pose = () => {
    const s = Math.sin(st.ph), th = J.A * s;
    st.th = th;
    bbaPose(P, beam, 0, J.H, 0, 0, -th, 0);
    bbaPose(P, crank, 0, J.CY, J.CZ, 0, st.ph, 0);
    const rz = -J.LR * Math.cos(th), ry = J.H - J.LR * Math.sin(th);
    const pz = J.CZ + J.RC * Math.cos(st.ph), py = J.CY - J.RC * Math.sin(st.ph);
    const dz = pz - rz, dy = py - ry;
    bbaPose(P, pitU, 0, ry - 0.4, rz, 0, Math.atan2(-dz, -dy), 0);
    bbaPose(P, pitL, 0, py, pz, 0, Math.atan2(-dz, -dy), 0);
    bbaPose(P, carrier, 0, J.YC + J.LF * th, J.LF, 0, 0, 0);
  };
  pose();
  // climbing route (local): wait for the carrier, ride it up, hop to the tank
  P.route = [['walk', -1.6, 12.2], ['ride', 'carrierLow'], ['jump', -0.6, 16.0], ['ride', 'carrierHigh'], ['jump', 5.6, 15.5], ['walk', 8.6, 15]];
  P.probe = { carrierY: () => carrier.y, carrierLocalY: () => (carrier.y - F.y0) / F.s, top: J.YC + J.LF * J.A, bottom: J.YC - J.LF * J.A };
  P.summitL = [TK[0], TK[3], TK[1], 3.6];
  P.spots = { nest: F.w(0, J.NEST, 0), tank: F.w(TK[0], TK[3], TK[1]), wellhead: F.w(0, 0, J.LF), carrierTop: F.w(0, J.YC + J.LF * J.A, J.LF) };
  bbaGlowPath(api, P, [[-3.2, 1.7, 15.6], [0, J.YC + J.LF * J.A + 1.2, J.LF + 1.6], [4.2, J.YC + J.LF * J.A + 1.6, 15.2], [7, TK[3] + 0.9, 15], [0, J.NEST + 0.9, 1.2], [1.2, J.NEST + 0.9, -1.2], [-1.2, J.NEST + 0.9, -1.2]]);
  bbaPickup(api, P, P.o.nestReward === undefined ? 'glow' : P.o.nestReward, 0, J.NEST + 0.9, 0);
  bbaPool(api, P, 0, J.LF, 8, '#ffb070', 0.3);
  bbaPool(api, P, TK[0], TK[1], 9, '#ffd29a', 0.25);
  const nestW = F.w(0, J.NEST, 0);
  P.update = (gg, wdt) => {
    st.prevPh = st.ph; st.ph += om * wdt;
    pose();
    const a0 = ((st.prevPh % TAU) + TAU) % TAU, a1 = ((st.ph % TAU) + TAU) % TAU;
    const p = gg.player, nk = bbaNight(gg, P);
    // top of the stroke: the catapult + (at night) a fire belch
    if (a0 < Math.PI / 2 && a1 >= Math.PI / 2) {
      st.lastTop = P.R.t;
      if (nk > 0.3) st.fire = 0.75;
      burnsSfx('stomp', { vol: 0.3, pitch: 0.5 });
      if (p.grounded && p.platform === carrier && !p.vehicle) {
        const l = F.l(p.x, p.z);
        if (Math.abs(l[0]) < 1.3 && l[1] > J.LF - 2.1 && l[1] < J.LF - 0.55) {
          const vy = 20.5, dy = nestW[1] + 0.3 - p.y, t = (vy + Math.sqrt(Math.max(0, vy * vy - 2 * BURNS_PHYS.gravity * dy))) / BURNS_PHYS.gravity;
          p.vx = (nestW[0] - p.x) / t; p.vz = (nestW[2] - p.z) / t; p.vy = vy; p.grounded = false; p.platform = null; p.jumps = 1; p.jumpCut = true; p.knockT = t * 0.92;
          p.yaw = Math.atan2(p.vx, p.vz); p.ch.play('flip', null, true);
          burnsSfx('jumpBig', { pitch: 0.7 }); gg.shake(0.35); gg.fx.ring(p.x, p.y + 0.1, p.z, 2.2, '#ffc21a', 0.5);
          gg.toast('CATAPULTED!'); gg.missions.event('bbaFling', P); st.flung = t + 0.6;
          if (P.o.onFling) P.o.onFling(gg, P);
        }
      }
    }
    if (st.flung > 0) {
      st.flung -= wdt;
      if (p.grounded && !p.vehicle) { st.flung = 0; p.vx = p.vz = 0; p.knockT = 0; p.landT = 0.25; gg.fx.dust(p.x, p.y, p.z, 12); gg.shake(0.2); burnsSfx('land'); }
    }
    if (st.fire > 0) {
      st.fire -= wdt;
      for (const sx of [-0.5, 0.5]) {
        const q = bbaBeamPt(P, st.th, sx, 2.5, J.LF - 4.2);
        for (let i = 0; i < 2; i++) gg.fx.add(q[0] + (Math.random() - 0.5) * 0.4, q[1], q[2] + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 1.6, 13 + Math.random() * 6, (Math.random() - 0.5) * 1.6, 0.55, 1.6, 0.6, [1, 0.55, 0.15], 1, 'flame', 1);
      }
      const q = bbaBeamPt(P, st.th, 0, 6, J.LF - 4.2); gg.pointLight(q[0], q[1], q[2], 26, [1, 0.5, 0.15], 2.2);
      if (Math.random() < wdt * 6) burnsSfx('flame_jet', { vol: 0.5 });
    }
    // the gas flare burns all night
    if (nk > 0.3 && Math.random() < wdt * 30) { const q = F.w(-7.5, 15.9, 7); gg.fx.fire(q[0], q[1], q[2], 1.3); }
  };
  P.draw = (gg, Rr, Sp, nk) => {
    // bridle cables from the head's tangent point down to the carrier bar
    const top = F.w(0, J.H, J.LF), cy = carrier.y + 1.25 * F.s;
    for (const sx of [-0.75, 0.75]) { const a = F.w(sx, 0, J.LF); bbaLine(Rr, a[0], top[1], a[2], a[0], cy, a[2], 0.13 * F.s, Sp.dot, [0.12, 0.12, 0.14], 0.95, false); }
    // the horse's eyes glow at night
    if (nk > 0.05) for (const sx of [-1.25, 1.25]) { const q = bbaBeamPt(P, st.th, sx, (J.LF - 1.15) * Math.sin(0.36), (J.LF - 1.15) * Math.cos(0.36) - 0.1); Rr.bbs.bb(q[0], q[1], q[2], 2.2 * F.s, 2.2 * F.s, Sp.glow, [1, 0.25, 0.15], 0.8 * nk, true); }
  };
}
// a point on the walking beam (beam-local x, y, z from the pivot) in world space for beam angle th
function bbaBeamPt(P, th, x, y, z) {
  const c = Math.cos(th), s = Math.sin(th);
  return P.F.w(x, BBA_PJ.H + y * c + z * s, -y * s + z * c);
}

/* ======================= 3. THE SLEEPING GIANT =======================
   A 60 m wooden giant asleep on his back with his head on a pillow (+Z = toward the head).
   Route: climb the tread of his left boot sole, walk down the instep, along the shin, over the
   knee and thigh, hop onto the breathing belly (a moving platform), up the chest and beard,
   dodge the snore gust over his mustache and stand on the nose (summit, 12.8 m).
   Secrets: his left ear (a bowl you can stand in) and the pocket on his right thigh (drop in).
   He snores dust clouds every breath; at night his buttons and pom-pom lantern glow. */
const BBA_GIANT = { T: 6.2, AMP: 0.55 };
BurnsBigArt.kinds.sleepingGiant = {
  name: 'The Sleeping Giant', mission: 'Tiptoe to the Nose', size: 62, foot: [20, 64], height: 13, summitY: 12.8,
  desc: 'A wooden giant napping on the playa. Climb from his boots to his nose. Quietly.',
  hint: 'Start at his boots (climb the sole), walk up his legs, ride his breathing belly. Mind the snores.',
  build(api, g, P) { bbaGiantBuild(api, g, P); }
};
function bbaGiantBuild(api, g, P) {
  const F = P.F, wood = '#c8905a', woodD = '#a8723e', denim = '#3a5a8a', denimD = '#2e4a74', boot = '#4a2e1e', beardC = '#9a5a2e', cream = '#f2ead8';
  const plaid = (x, y, z) => ((Math.floor((x + 50) / 2.2) + Math.floor((z + 50) / 2.2)) % 2) ? '#b8322a' : '#3a1616';
  /* ---- static body: boots, legs, hips, arms, head on the pillow ---- */
  bbaPart(api, P, 0, -12, m => {
    const cols = [], lights = [];
    // boots (feet pointing up), soles facing -z with chunky treads (the climbing wall)
    for (const sx of [-1, 1]) {
      const x = sx * 4.1;
      m.color(boot).shine(1);
      m.roundBox(x, 4.6, -22.0, 3.8, 9.0, 4.2, 1.3);
      m.ellipsoid(x, 8.2, -21.6, 1.95, 1.45, 2.0);
      m.limb(x, 2.2, -20.5, x, 2.2, -17.5, 2.2, 2.05);
      m.color('#2a1a10'); m.roundBox(x, 4.65, -24.2, 3.9, 9.3, 0.4, 0.18);
      for (let y = 0.7; y < 9.0; y += 0.62) m.roundBox(x, y, -24.45, 3.4, 0.18, 0.22, 0.08);
      m.roundBox(x, 0.8, -24.0, 3.7, 1.6, 1.0, 0.25);
      m.color('#e8d8b0'); for (let k = 0; k < 5; k++) { const zz = -20.4 + k * 0.6, yy = 9.0 - k * 0.9; m.limb(x - 1.0, yy, zz, x + 1.0, yy + 0.25, zz + 0.3, 0.07, 0.07); m.limb(x + 1.0, yy, zz, x - 1.0, yy + 0.25, zz + 0.3, 0.07, 0.07); }
      m.shine(0);
      cols.push({ t: 'box', x, z: -22.25, hx: 1.95, hz: 1.85, y0: 0, y1: 9.4 });
      cols.push({ t: 'ramp', x, z: -19.1, hx: 1.5, hz: 1.5, y0: 0, ya: 9.4, yb: 4.5 });
    }
    // legs: shins, knees, thighs (denim), the right thigh carries a deep pocket
    m.color(denim).shine(1);
    for (const sx of [-1, 1]) {
      m.limb(sx * 4.1, 2.25, -18.5, sx * 3.9, 4.3, -8.0, 2.05, 2.5);
      m.ball(sx * 3.9, 4.4, -8.0, 2.7);
      m.limb(sx * 3.9, 4.2, -8.0, sx * 3.5, 3.5, 4.5, 2.6, 3.1);
      m.color(denimD); m.torus(sx * 4.1, 2.25, -18.2, 2.1, 0.22, { seg: 14, tseg: 5, sy: 1 }); m.color(denim);
    }
    // the pocket: a patch with a dark opening on top of the right thigh
    m.color(denimD); m.roundBox(3.9, 6.15, -1.5, 3.2, 0.5, 4.6, 0.22);
    m.color('#141824'); m.roundBox(3.9, 5.2, -1.5, 2.5, 2.4, 3.9, 0.5);
    m.color('#ffd21a'); m.roundBox(3.9, 6.45, 0.85, 3.0, 0.08, 0.1, 0.03);
    // hips + belt + buckle
    m.color(denim); m.ellipsoid(0, 3.6, 6.0, 7.2, 3.6, 3.5);
    m.color('#1e1e24'); m.roundBox(0, 7.0, 8.1, 12.4, 0.9, 1.3, 0.4);
    m.color('#ffc21a').shine(3); m.roundBox(0, 7.55, 8.1, 2.0, 0.35, 1.6, 0.14); m.shine(0);
    // upper arms lying beside the body (sleeves)
    m.color('#b8322a').shine(1); for (const sx of [-1, 1]) m.limb(sx * 6.8, 4.6, 22.5, sx * 8.7, 2.6, 15.0, 2.1, 1.85, { seg: m.segs(12, 8) });
    m.color('#3a1616'); for (const sx of [-1, 1]) m.torus(sx * 7.9, 3.5, 18.6, 1.95, 0.18, { seg: 14, tseg: 4 }); m.shine(0);
    // colliders: legs, hips
    for (const sx of [-1, 1]) {
      cols.push({ t: 'ramp', x: sx * 4.0, z: -13.55, hx: 1.4, hz: 4.05, y0: 0, ya: 4.5, yb: 7.0 });
      cols.push({ t: 'box', x: sx * 3.9, z: -8.0, hx: 1.9, hz: 1.5, y0: 0, y1: 7.0 });
    }
    cols.push({ t: 'ramp', x: -3.6, z: -1.5, hx: 2.4, hz: 5.0, y0: 0, ya: 7.0, yb: 6.75 });
    // right thigh with the pocket hole (x 2.6..5.2, z -3.7..0.7)
    cols.push({ t: 'ramp', x: 3.6, z: -5.1, hx: 2.4, hz: 1.4, y0: 0, ya: 7.0, yb: 6.95 });
    cols.push({ t: 'ramp', x: 3.6, z: 2.1, hx: 2.4, hz: 1.4, y0: 0, ya: 6.8, yb: 6.75 });
    cols.push({ t: 'box', x: 2.0, z: -1.5, hx: 0.6, hz: 2.2, y0: 0, y1: 6.7 });
    cols.push({ t: 'box', x: 5.6, z: -1.5, hx: 0.4, hz: 2.2, y0: 0, y1: 6.7 });
    cols.push({ t: 'box', x: 3.9, z: -1.5, hx: 1.3, hz: 2.2, y0: 0, y1: 4.4 });
    cols.push({ t: 'box', x: 0, z: 6.25, hx: 6.6, hz: 2.75, y0: 0, y1: 7.0 });
    cols.push({ t: 'box', x: 0, z: 8.1, hx: 6.0, hz: 0.6, y0: 0, y1: 7.45 });
    for (const sx of [-1, 1]) cols.push({ t: 'box', x: sx * 7.9, z: 18.7, hx: 1.6, hz: 4.2, y0: 0, y1: 4.2, yaw: sx * 0.22 });
    return { cols, lights };
  });
  bbaPart(api, P, 0, 29, m => {
    const cols = [], lights = [];
    // pillow
    m.color(cream).shine(1); m.roundBox(0, 1.5, 30.5, 16, 3.0, 12, 1.3);
    m.color('#d8c8e8'); m.roundBox(0, 1.5, 30.5, 16.1, 0.25, 12.1, 0.1); m.shine(0);
    // head
    m.color(wood).shine(1); m.ellipsoid(0, 7.0, 30.8, 4.3, 4.0, 4.6);
    m.color('#e09070'); for (const sx of [-1, 1]) m.ellipsoid(sx * 2.7, 9.9, 30.4, 1.2, 0.8, 1.1);
    m.color('#d8946a'); m.ellipsoid(0, 11.3, 31.3, 1.15, 1.5, 1.6);
    m.color(woodD); for (const sx of [-1, 1]) { m.limb(sx * 0.9, 10.98, 32.2, sx * 2.6, 10.82, 32.5, 0.12, 0.12); m.limb(sx * 2.6, 10.82, 32.5, sx * 2.9, 10.6, 32.3, 0.12, 0.1); }
    m.color(beardC); for (const sx of [-1, 1]) { m.ellipsoid(sx * 1.9, 10.75, 33.5, 1.3, 0.45, 0.55); m.push(); m.tf(sx * 1.25, 10.85, 29.9, sx * 0.5, 0, 0); m.ellipsoid(0, 0, 0, 1.45, 0.55, 0.75); m.pop(); }
    m.color('#3a1a12'); m.ellipsoid(0, 10.45, 28.9, 0.85, 0.32, 0.5);
    m.color(beardC); m.ellipsoid(0, 8.4, 27.0, 3.7, 2.4, 2.6);
    for (let i = 0; i < 5; i++) m.ellipsoid(-2.4 + i * 1.2, 7.6, 25.2, 0.7, 1.6, 0.9);
    // ears (the left one is a secret bowl)
    for (const sx of [-1, 1]) {
      m.color(wood).shine(1); m.push(); m.tf(sx * 4.45, 7.0, 30.6, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 1.25, 0.42, { seg: 16, tseg: 6 }); m.pop();
      m.color(woodD); m.ellipsoid(sx * 4.35, 7.0, 30.6, 0.35, 1.05, 1.05);
      m.color('#2a1408'); m.ellipsoid(sx * 4.5, 7.0, 30.7, 0.12, 0.42, 0.42);
    }
    m.shine(0);
    // nightcap flopping over onto the pillow + pom-pom lantern
    const cap = []; for (let i = 0; i <= 14; i++) { const t = i / 14; cap.push([Math.sin(t * 1.4) * 5.6, 9.4 - t * 5.4 + Math.sin(t * Math.PI) * 1.6, 33.4 + t * 3.6]); }
    bbaTube(m, cap, (j, n) => lerp(3.4, 0.35, Math.pow(j / (n - 1), 0.8)), m.segs(12, 8), { caps: false, colFn: j => (j % 4 < 2) ? '#3a6ad8' : '#f4f0e8' });
    m.color('#ffe24a', 0.9); m.ball(cap[14][0], cap[14][1], cap[14][2], 0.9); m.emissive(0);
    lights.push({ x: cap[14][0], y: cap[14][1], z: cap[14][2], s: 2.2, c: '#ffe08a' });
    lights.push({ x: cap[14][0], y: 0, z: cap[14][2], s: 0, c: '#ffd070', pool: 9 * (P.maxNight > 0.25 ? 1 : 0) });
    // colliders: pillow, head, face, nose, ear bowl
    cols.push({ t: 'box', x: 0, z: 30.5, hx: 8, hz: 6, y0: 0, y1: 3.0 });
    cols.push({ t: 'cyl', x: 0, z: 30.8, r: 4.3, y0: 3.0, y1: 10.4, cover: true });
    cols.push({ t: 'box', x: 0, z: 25.95, hx: 3.4, hz: 2.45, y0: 3, y1: 10.6 });
    cols.push({ t: 'box', x: 0, z: 29.35, hx: 2.4, hz: 0.95, y0: 3, y1: 11.1 });
    cols.push({ t: 'box', x: 0, z: 32.45, hx: 3.6, hz: 2.15, y0: 3, y1: 10.9 });
    cols.push({ t: 'cyl', x: 0, z: 31.3, r: 1.15, y0: 3, y1: 12.8 });
    cols.push({ t: 'box', x: -4.95, z: 30.6, hx: 0.6, hz: 0.75, y0: 3, y1: 6.0 });
    cols.push({ t: 'box', x: -4.85, z: 31.95, hx: 0.5, hz: 0.5, y0: 3, y1: 4.6 });
    return { cols, lights };
  });
  /* ---- the breathing torso (mover): belly, chest, hands, forearms ---- */
  const torso = bbaMover(api, P, m => {
    m.shine(1);
    m.ellipsoid(0, 5.0, 19.8, 7.0, 4.4, 6.0, { seg: m.segs(26, 12), rings: m.segs(14, 8), colFn: (x, y, z) => plaid(x, y, z + 19.8) });
    m.ellipsoid(0, 4.4, 12.8, 7.1, 4.2, 5.4, { seg: m.segs(26, 12), rings: m.segs(14, 8), colFn: (x, y, z) => plaid(x, y, z + 12.8) });
    m.color('#f4f0e8'); for (const sx of [-1, 1]) { m.push(); m.tf(sx * 2.3, 8.3, 24.6, sx * 0.4, 0.5, 0); m.roundBox(0, 0, 0, 2.6, 0.5, 1.6, 0.25); m.pop(); }
    for (const z of [10.4, 14.4, 18.4, 22.0]) { m.color('#ffe8a0', 0.75); m.roundCyl(0, (z < 16 ? 8.55 : 9.35) - 0.05, z, 0.42, 0.2, 0.08); m.emissive(0); }
    // forearms + folded hands with interlaced fingers
    m.color('#a82a26'); for (const sx of [-1, 1]) m.limb(sx * 8.7, 2.6, 15.0, sx * 3.6, 7.8, 14.0, 1.8, 1.55, { seg: m.segs(12, 8) });
    m.color('#3a1616'); for (const sx of [-1, 1]) m.limb(sx * 3.9, 7.5, 14.0, sx * 3.0, 8.4, 13.9, 1.62, 1.5, { seg: m.segs(12, 8) });
    m.color(wood);
    for (const sx of [-1, 1]) m.ellipsoid(sx * 1.35, 8.75, 13.9, 1.45, 0.85, 1.7);
    m.color(woodD); for (let i = 0; i < 4; i++) { const z = 12.6 + i * 0.75; m.limb(-1.8, 9.45, z, 1.8, 9.45, z + 0.2, 0.3, 0.3); }
    m.shine(0);
    const cols = [
      { t: 'box', x: 0, z: 12.75, hx: 5.4, hz: 3.75, y0: 0, y1: 8.6 },
      { t: 'box', x: 0, z: 20.0, hx: 5.8, hz: 3.5, y0: 0, y1: 9.4 },
      { t: 'box', x: 0, z: 14.0, hx: 2.4, hz: 1.6, y0: 0, y1: 9.75 },
      { t: 'ramp', x: 0, z: 16.3, hx: 5.4, hz: 1.2, y0: 0, ya: 8.6, yb: 9.4 }
    ];
    for (const sx of [-1, 1]) cols.push({ t: 'ramp', x: sx * 6.3, z: 14.4, hx: 0.9, hz: 2.7, yaw: sx * Math.PI / 2 * -1, y0: 0, ya: 4.4, yb: 8.4 });
    const lights = [10.4, 14.4, 18.4, 22.0].map(z => ({ x: 0, y: (z < 16 ? 8.55 : 9.35) + 0.25, z, s: 0.8, c: '#ffe08a' }));
    return { cols, lights };
  });
  // the forearm ramps rise toward the middle: local -z of each ramp must point outward
  for (const d of torso.dcols) if (d.t === 'ramp' && Math.abs(d.lx) > 3 * P.F.s) { d.lyaw = d.lx > 0 ? -Math.PI / 2 : Math.PI / 2; }
  P.parts = { torso };
  bbaClimbZone(api, P, { x: -4.1, z: -24.7, y0: 0.2, y1: 9.3, nx: 0, nz: -1, hw: 1.5, top: 9.4, exit: 1.0, name: 'boot', col: false });
  bbaClimbZone(api, P, { x: 4.1, z: -24.7, y0: 0.2, y1: 9.3, nx: 0, nz: -1, hw: 1.5, top: 9.4, exit: 1.0, name: 'boot2', col: false });
  const st = P.giant = { ph: P.o.phase || 0, prev: 0, snore: 0 };
  const om = TAU / BBA_GIANT.T;
  const pose = () => { const y = BBA_GIANT.AMP * Math.sin(st.ph); bbaPose(P, torso, 0, y, 0, 0, 0, 0); };
  pose();
  P.route = [['walk', -4.1, -27.5], ['walk', -4.1, -25.3], ['climb', 'boot'], ['walk', -4.1, -21.5], ['walk', -4.0, -17.5], ['walk', -3.9, -8.0], ['walk', -3.6, 1.5], ['walk', -2.0, 5.5], ['jump', -2.6, 10.8],
    ['walk', -3.6, 12.2], ['walk', -3.6, 17.4], ['walk', 0, 21.5], ['jump', 0, 25.2], ['wait', 'calm'], ['jump', 0, 29.2], ['jump', 0, 31.2]];
  P.summitL = [0, 12.8, 31.3, 1.2];
  P.spots = { nose: F.w(0, 12.8, 31.3), ear: F.w(-4.95, 6.0, 30.6), pocket: F.w(3.9, 4.4, -1.5), belly: F.w(0, 8.6, 12.8), boot: F.w(-4.1, 9.4, -22.2) };
  bbaGlowPath(api, P, [[-4.1, 2.5, -25.4], [-4.1, 5.5, -25.4], [-4.1, 10.3, -22.0], [-4.0, 6.0, -15], [-3.9, 8.0, -8], [-3.6, 7.6, 1.5], [-2.0, 9.6, 11], [0, 10.4, 17], [0, 11.6, 25.5], [0, 12.2, 29.2]]);
  bbaPickup(api, P, P.o.ear === undefined ? 'water' : P.o.ear, -4.95, 6.9, 30.6);
  bbaPickup(api, P, P.o.pocket === undefined ? 'glow' : P.o.pocket, 3.9, 5.3, -1.5);
  bbaPool(api, P, 0, 14, 12, '#ffd29a', 0.3);
  // LSD dream: stepping clouds from his nose up to a dream bubble (only on LSD)
  if (P.o.dream !== false) {
    api.hidden(() => {
      const steps = [[1.5, 14.2, 33.5], [3.2, 15.8, 35.8], [1.0, 17.4, 38.0], [-1.6, 19.0, 36.5]];
      for (const [x, y, z] of steps) { const w = F.w(x, y, z); api.sphere(w[0], w[1] - 0.6 * F.s, w[2], 1.1 * F.s, '#e8f0ff', { squash: 0.55, e: 0.5 }); }
      const b = F.w(-3.2, 20.6, 34.0); api.sphere(b[0], b[1] - 0.2, b[2], 2.0 * F.s, '#c8b8ff', { squash: 0.5, e: 0.6 });
      api.glow(b[0], b[1] + 1.2, b[2], 3, '#ff9ad8');
    });
    bbaPickup(api, P, P.o.dreamReward === undefined ? { kind: 'glowstick', hidden: true } : P.o.dreamReward, -3.2, 21.6, 34.0, { hidden: true });
  }
  const mouth = F.w(0, 10.6, 28.9), nose = F.w(0, 12.4, 31.9), fwd = F.dir(0, -1);
  P.update = (gg, wdt) => {
    st.prev = st.ph; st.ph += om * wdt; pose();
    const a0 = ((st.prev % TAU) + TAU) % TAU, a1 = ((st.ph % TAU) + TAU) % TAU;
    if (a0 < Math.PI / 2 && a1 >= Math.PI / 2) {
      // SNORE: dust clouds + a gust over the mustache
      st.snore = 1.1; burnsSfx('man_roar', { vol: 0.35, pitch: 0.45 });
      const p = gg.player, l = F.l(p.x, p.z), ly = (p.y - F.y0) / F.s;
      if (!p.vehicle && Math.abs(l[0]) < 3.2 && l[1] > 26.6 && l[1] < 30.4 && ly > 9.6) {
        p.knock(fwd[0] * 7.5, 8, fwd[1] * 7.5); gg.toast('BLOWN AWAY BY A SNORE!'); gg.shake(0.25);
      }
      if (P.o.onSnore) P.o.onSnore(gg, P);
    }
    if (st.snore > 0) {
      st.snore -= wdt;
      if (Math.random() < wdt * 50) gg.fx.add(mouth[0] + (Math.random() - 0.5), mouth[1], mouth[2] + (Math.random() - 0.5), fwd[0] * 3 + (Math.random() - 0.5) * 2, 3 + Math.random() * 3, fwd[1] * 3 + (Math.random() - 0.5) * 2, 1.2, 1.0, 3.2, [0.9, 0.8, 0.68], 0.4, 'puff', 4, Math.random() * 6, 0.3);
      if (Math.random() < wdt * 4) gg.fx.zzz(nose[0] + (Math.random() - 0.5) * 2, nose[1] + 1.5, nose[2]);
    } else if (Math.random() < wdt * 0.6) gg.fx.zzz(nose[0], nose[1] + 1.2, nose[2]);
  };
  P.probe = { snoreIn: () => { const a = ((st.ph % TAU) + TAU) % TAU; return (((Math.PI / 2 - a) % TAU) + TAU) % TAU / om; }, torsoY: () => torso.y };
  P.draw = (gg, Rr, Sp, nk) => {
    if (nk < 0.05) return;
    // fireflies drifting over the sleeper
    const t = P.R.t, col = [1, 0.9, 0.45];
    for (let i = 0; i < 14; i++) { const a = i * 2.39 + t * 0.3, q = F.w(Math.sin(a) * (6 + i % 4), 9 + Math.sin(t * 0.7 + i) * 2 + (i % 3), 2 + i * 2.3 + Math.cos(a * 1.3) * 3); Rr.bbs.bb(q[0], q[1], q[2], 0.5, 0.5, Sp.glow, col, (0.5 + 0.5 * Math.sin(t * 3 + i * 1.7)) * nk, true); }
  };
}

/* ======================= 4. THE LANDLOCKED GALLEON =======================
   A three-masted wooden galleon run aground on the playa, hull half-buried in dust (+Z = bow).
   A 45 m pier on stilts runs out to her port side (along -X, z = 6) with a gangplank to the deck.
   Hop the port rail onto the chain ledge, climb the shrouds (rigging) to the crow's nest (21.5 m,
   summit), then ZIP back down the line over the pier to the landing tower 60 m away. */
const BBA_GAL = { DECK: 4.6, NEST: 21.5, PIER: 1.2, PZ: 6.0 };
BBA_GAL.w = z => z > 4 ? 4.6 * Math.sqrt(Math.max(0, 1 - Math.pow((z - 4) / 15.6, 2))) : z < -6 ? 4.6 - 1.0 * Math.pow((-6 - z) / 10, 2) : 4.6;
BBA_GAL.top = z => z > 9 ? 5.6 + Math.min(1.9, (z - 9) * 0.6) : z < -7.5 ? 5.6 + Math.min(2.6, (-7.5 - z) * 1.1) : 5.6;
BurnsBigArt.kinds.galleon = {
  name: 'The Landlocked Galleon', mission: 'Crow\'s Nest Captain', size: 70, foot: [74, 40], height: 28, summitY: 21.5,
  desc: 'A galleon that sailed into the dust and never left. Walk the pier, climb the rigging, zip back down.',
  hint: 'Hop the port rail by the main mast onto the ledge, push into the rigging and climb. ZIP! from the crow\'s nest.',
  build(api, g, P) { bbaGalleonBuild(api, g, P); }
};
function bbaGalleonBuild(api, g, P) {
  const G = BBA_GAL, F = P.F, DK = G.DECK, hullC = '#5a3a22', hullD = '#4a2e1a', trim = '#c8a040', deckC = '#a87a4e', rope = '#d8c8a0', mastC = '#7a5432';
  const Z0 = -16, Z1 = 19.5;
  /* ---- hull, decks, castles ---- */
  bbaPart(api, P, 0, 0, m => {
    const cols = [], lights = [];
    m.shine(1);
    m.surf(m.segs(34, 18), m.segs(14, 8), (u, v, o) => {
      const z = lerp(Z0, Z1, u), w = G.w(z), tp = G.top(z), ph = lerp(-Math.PI / 2, Math.PI / 2, v), s = Math.sin(ph), c = Math.cos(ph);
      o[0] = w * Math.sign(s) * Math.pow(Math.abs(s), 0.55); o[1] = tp - (tp + 2.5) * Math.pow(Math.abs(c), 0.9); o[2] = z;
    }, { out: [0, 2, 1], colFn: (u, v) => { const z = lerp(Z0, Z1, u), tp = G.top(z), ph = lerp(-Math.PI / 2, Math.PI / 2, v), y = tp - (tp + 2.5) * Math.pow(Math.abs(Math.cos(ph)), 0.9); return y > tp - 0.35 ? '#3a2412' : (y > 3.2 && y < 3.7) ? trim : (Math.floor(y * 1.6) % 2 ? hullC : hullD); } });
    // transom (stern face) with the captain's windows
    { const pts = []; for (let i = 0; i <= 10; i++) { const ph = lerp(-Math.PI / 2, Math.PI / 2, i / 10), s = Math.sin(ph), c = Math.cos(ph), w = G.w(Z0), tp = G.top(Z0); pts.push([w * Math.sign(s) * Math.pow(Math.abs(s), 0.55), tp - (tp + 2.5) * Math.pow(Math.abs(c), 0.9), Z0]); } m.color(hullD); m.poly(pts, null, [0, 4, Z0 + 3]); }
    m.color('#ffc860', 0.85); for (const x of [-2.2, -0.75, 0.75, 2.2]) m.roundBox(x, 6.3, Z0 - 0.05, 1.0, 1.2, 0.12, 0.08); m.emissive(0);
    m.color(trim); m.roundBox(0, 7.3, Z0 - 0.06, 7.0, 0.3, 0.14, 0.06); m.roundBox(0, 5.4, Z0 - 0.06, 7.0, 0.22, 0.14, 0.06);
    // main deck planking + inner bulwarks
    m.color(deckC);
    m.grid(2, 30, false, (i, j, o) => { const z = lerp(-8.6, 10.6, j / 29), w = G.w(z) * 0.97; o.p[0] = i ? w : -w; o.p[1] = DK; o.p[2] = z; o.n[0] = 0; o.n[1] = 1; o.n[2] = 0; if (j % 2) o.col = burnsRGB('#9a6e44'); });
    m.color('#6a4a2e');
    for (const sx of [-1, 1]) m.grid(2, 30, false, (i, j, o) => { const z = lerp(-8.6, 10.6, j / 29), w = G.w(z) * 0.965; o.p[0] = sx * w; o.p[1] = i ? G.top(z) : DK; o.p[2] = z; o.n[0] = -sx; o.n[1] = 0; o.n[2] = 0; });
    // gunwale rail cap all round
    const rail = []; for (let i = 0; i <= 26; i++) { const z = lerp(Z0 + 0.2, Z1 - 1.2, i / 26); rail.push(z); }
    m.color('#3a2412'); for (const sx of [-1, 1]) bbaTube(m, rail.map(z => [sx * G.w(z) * 0.985, G.top(z) + 0.05, z]), 0.17, 6, {});
    // forecastle + quarterdeck (raised decks, front walls, cabin doors)
    m.color(deckC); m.roundBox(0, 6.25, 14.0, G.w(14) * 1.9, 0.3, 7.0, 0.1); m.roundBox(0, 7.05, -12.3, 7.6, 0.3, 7.4, 0.1);
    m.color('#6a4a2e'); m.roundBox(0, (DK + 6.4) / 2, 10.55, 8.6, 6.4 - DK, 0.3, 0.1); m.roundBox(0, (DK + 7.2) / 2, -8.55, 8.0, 7.2 - DK, 0.3, 0.1);
    m.color('#3a2412'); m.roundBox(0, DK + 1.0, -8.38, 1.4, 2.0, 0.1, 0.05);
    m.color('#ffc860', 0.8); for (const x of [-2.6, 2.6]) m.roundBox(x, DK + 1.4, -8.37, 0.8, 0.7, 0.08, 0.05); m.emissive(0);
    m.color(trim); m.roundBox(-1.3, DK + 0.6, 9.5, 2.2, 0.12, 2.6, 0.04);
    for (const sx of [-3.2, 3.2]) { m.color('#7a5432'); m.push(); m.tf(sx, (DK + 7.2) / 2, -7.0, 0, 0.68, 0); m.roundBox(0, 0, 0, 1.3, 0.2, 4.0, 0.06); m.pop(); }
    m.push(); m.tf(0, (DK + 6.4) / 2, 9.25, 0, -0.62, 0); m.roundBox(0, 0, 0, 2.0, 0.2, 3.1, 0.06); m.pop();
    // treasure chest on the quarterdeck
    m.color('#6a3a1a').shine(1); m.roundBox(0, 7.6, -13.2, 1.6, 0.8, 1.0, 0.12); m.color(trim).shine(3); m.ellipsoid(0, 8.0, -13.2, 0.82, 0.36, 0.52, { phi1: Math.PI / 2 }); m.roundBox(0, 7.7, -12.68, 0.25, 0.3, 0.06, 0.03); m.shine(0);
    // stern lanterns
    for (const x of [-2.4, 0, 2.4]) { m.push(); m.tf(x, 8.25, Z0 + 0.3); m.color(trim).shine(3); m.lathe([[0.05, 0], [0.32, 0.08], [0.46, 0.55], [0.36, 1.08], [0.12, 1.22], [0.02, 1.45]], { seg: 8 }); m.color('#ffd070', 1); m.ball(0, 0.62, 0, 0.3); m.emissive(0).shine(0); m.pop(); lights.push({ x, y: 8.9, z: Z0 + 0.3, s: 1.6, c: '#ffc860' }); }
    // portholes (glow at night)
    for (const sx of [-1, 1]) for (let z = -5; z <= 9; z += 3.5) { const x = sx * (G.w(z) + 0.02); m.color('#ffc860', 0.7); m.push(); m.tf(x, 2.6, z, sx * Math.PI / 2); m.roundCyl(0, -0.06, 0, 0.35, 0.12, 0.04, { seg: 10 }); m.pop(); m.emissive(0); lights.push({ x: x + sx * 0.2, y: 2.6, z, s: 0.9, c: '#ffc070' }); }
    for (const x of [-2.2, -0.75, 0.75, 2.2]) lights.push({ x, y: 6.3, z: Z0 - 0.3, s: 1.3, c: '#ffc070' });
    // bowsprit + figurehead (a gilded jackrabbit in goggles)
    m.color(mastC); m.limb(0, 7.0, 17.5, 0, 9.2, 26.0, 0.32, 0.2);
    m.push(); m.tf(0, 6.4, 19.0, 0, -0.5, 0); m.color(trim).shine(3);
    m.ellipsoid(0, 0, 0.6, 0.6, 0.55, 0.95); m.ball(0, 0.65, 1.35, 0.42); m.limb(-0.18, 0.95, 1.2, -0.25, 2.0, 0.9, 0.12, 0.07); m.limb(0.18, 0.95, 1.2, 0.25, 2.0, 0.9, 0.12, 0.07);
    m.color('#38f2ff', 0.6); m.roundBox(0, 0.75, 1.72, 0.62, 0.18, 0.08, 0.06); m.emissive(0).shine(0); m.pop();
    // dust drifted up against the hull (half-buried)
    m.color('#b88e68'); m.lathe([[0, 0], [8.6, 0], [8.6, 0], [6.6, 0.55], [4.8, 0.95], [0, 1.1]], { seg: m.segs(20, 12), sz: 2.4 });
    // colliders: hull, rails, castles, stairs, chests, chain ledge
    cols.push({ t: 'box', x: 0, z: 1.0, hx: 4.45, hz: 9.6, y0: 0, y1: DK, cover: true });
    cols.push({ t: 'box', x: 0, z: 13.7, hx: 3.9, hz: 3.15, y0: 0, y1: 6.4, cover: true });
    cols.push({ t: 'box', x: 0, z: 17.6, hx: 2.2, hz: 0.9, y0: 0, y1: 6.4 });
    cols.push({ t: 'box', x: 0, z: -12.3, hx: 3.8, hz: 3.7, y0: 0, y1: 7.2, cover: true });
    for (const sx of [-1, 1]) cols.push({ t: 'box', x: sx * 4.45, z: 1.0, hx: 0.17, hz: 9.6, y0: 0, y1: 5.6 });
    cols.push({ t: 'ramp', x: 0, z: 9.25, hx: 1.0, hz: 1.3, y0: 0, ya: DK, yb: 6.4 });
    for (const sx of [-3.2, 3.2]) cols.push({ t: 'ramp', x: sx, z: -7.0, hx: 0.65, hz: 1.6, y0: 0, ya: 7.2, yb: DK });
    cols.push({ t: 'box', x: 0, z: -13.2, hx: 0.8, hz: 0.5, y0: 7.2, y1: 8.0 });
    // chain ledge outside the port rail by the main mast (start of the rigging climb)
    m.color('#4a2e1a'); m.roundBox(-5.15, 4.8, -0.6, 1.2, 0.4, 2.6, 0.12);
    m.color('#2a2a30'); for (const z of [-1.6, -0.6, 0.4]) m.limb(-5.4, 4.6, z, -5.0, 2.0, z, 0.06, 0.06);
    cols.push({ t: 'box', x: -5.15, z: -0.6, hx: 0.6, hz: 1.3, y0: 4.2, y1: 5.0 });
    return { cols, lights };
  });
  /* ---- masts, yards, sails, rigging, crow's nest ---- */
  bbaPart(api, P, 0, 1, m => {
    const cols = [], lights = [];
    const masts = [[0, DK, 0, 27.5, 0.5, 0, 0], [0, 6.4, 11.8, 22.5, 0.4, 0.06, 0.03], [0, 7.2, -11.8, 19.5, 0.38, -0.05, -0.04]];
    for (const [x, y, z, top, r, lx, lz] of masts) {
      m.color(mastC).shine(1); m.limb(x, y - 0.5, z, x + lx * (top - y), top, z + lz * (top - y), r, r * 0.55); m.shine(0);
      cols.push({ t: 'cyl', x, z, r: r + 0.05, y0: y - 0.5, y1: Math.min(top, G.NEST - 0.4), camPass: true });
    }
    // yards (spars) with furled sails
    const yard = (y, z, span, fz, furl, xo) => { m.color(mastC); m.limb(-span / 2 + (xo || 0), y, z + fz, span / 2 + (xo || 0), y, z + fz, 0.22, 0.22); if (furl) { m.color('#efe4c8'); m.limb(-span / 2 + 0.6 + (xo || 0), y - 0.32, z + fz, span / 2 - 0.6 + (xo || 0), y - 0.32, z + fz, 0.34, 0.34); } };
    yard(13.5, 0, 15, 0.8, true); yard(18.6, 0, 11, 0.8, true); yard(12.5, 11.8, 12, 0.6, false, 0.6); yard(17.3, 11.8, 8.5, 0.6, true, 0.9);
    // the fore course: a billowing, patched sail (art camp patches)
    const patch = ['#efe4c8', '#efe4c8', '#ff9ad8', '#38f2ff', '#ffe24a', '#efe4c8', '#7aff5a', '#efe4c8'];
    m.surf(10, 6, (u, v, o) => { o[0] = lerp(-5.6, 5.6, u) + 0.6; o[1] = lerp(12.3, 7.6, v); o[2] = 12.5 + Math.sin(u * Math.PI) * (1.6 + v * 0.8) * (0.4 + 0.6 * Math.sin(v * Math.PI * 0.9 + 0.3)); }, { colFn: (u, v) => patch[(Math.floor(u * 5) * 3 + Math.floor(v * 3) * 5) % patch.length] });
    m.surf(10, 6, (u, v, o) => { o[0] = lerp(5.6, -5.6, u) + 0.6; o[1] = lerp(12.3, 7.6, v); o[2] = 12.48 + Math.sin(u * Math.PI) * (1.6 + v * 0.8) * (0.4 + 0.6 * Math.sin(v * Math.PI * 0.9 + 0.3)); }, { colFn: () => '#d8ccb0' });
    // mizzen lateen sail (triangle)
    m.color('#efe4c8'); m.poly([[0.3, 9.0, -11.6], [0.3, 18.5, -9.0], [0.3, 9.4, -16.0]]); m.poly([[0.25, 9.0, -11.6], [0.25, 9.4, -16.0], [0.25, 18.5, -9.0]]);
    m.color(mastC); m.limb(0.3, 8.6, -16.6, 0.3, 19.0, -8.6, 0.16, 0.12);
    // crow's nest basket on the main mast
    m.color('#6a4a2e').shine(1); m.roundCyl(0, G.NEST - 0.35, 0, 1.95, 0.35, 0.1);
    m.lathe([[1.92, G.NEST - 0.2], [1.98, G.NEST], [1.98, G.NEST + 1.0], [1.85, G.NEST + 1.05], [1.82, G.NEST + 0.2]], { seg: m.segs(20, 12) });
    m.color(trim); m.torus(0, G.NEST + 1.02, 0, 1.92, 0.08, { seg: 20, tseg: 4 }); m.shine(0);
    cols.push({ t: 'cyl', x: 0, z: 0, r: 1.95, y0: G.NEST - 0.35, y1: G.NEST });
    // the Jolly Playa flag
    m.color('#1a1a22'); m.surf(6, 3, (u, v, o) => { o[0] = 0; o[1] = 26.6 - v * 1.6; o[2] = -0.35 - u * 2.8 + 0; o[0] = Math.sin(u * 3.5) * 0.25 * u; }, {});
    m.color('#ffe24a', 0.5); m.ball(Math.sin(1.6) * 0.12, 25.8, -1.8, 0.42, { seg: 8, rings: 5 }); m.emissive(0);
    // the shrouds (rigging net) on the port side: four legs converging up to the nest + ratlines
    const sh = (y) => -4.75 + 2.75 * (y - 5.2) / 16;   // plane x at height y
    m.color(rope);
    for (const zz of [-1.45, -0.85, -0.25, 0.35]) bbaRope(m, [sh(5.0), 5.0, zz], [-2.0, 21.2, -0.55 + (zz + 0.55) * 0.35], 0.06, 0, 4, { seg: 4 });
    for (let y = 5.6; y < 21; y += 0.62) { const k = (y - 5.0) / 16.2, h = lerp(0.95, 0.35, k); m.limb(sh(y), y, -0.55 - h, sh(y), y, -0.55 + h, 0.045, 0.045, { seg: 4 }); }
    // starboard shrouds + stays (decor)
    for (const zz of [-1.2, 0.2]) bbaRope(m, [4.6, 5.6, zz], [1.8, 21.0, zz * 0.3], 0.06, 0, 4, { seg: 4 });
    bbaRope(m, [0, 27.0, 0], [0, 9.2, 25.5], 0.06, 0.6, 6, { seg: 4 });
    bbaRope(m, [0, 27.0, 0], [0, 8.4, -15.6], 0.06, 0.5, 6, { seg: 4 });
    bbaRope(m, [0, 22.0, 11.8], [0, 9.0, 24.0], 0.05, 0.4, 5, { seg: 4 });
    return { cols, lights };
  });
  bbaClimbZone(api, P, { x: -4.75, z: -0.55, y0: 5.0, y1: 21.2, nx: -1, nz: 0, hw: 0.95, lean: 2.75, top: G.NEST, exit: 0.95, name: 'shrouds' });
  /* ---- the pier, gangplank and the zip landing tower ---- */
  bbaPart(api, P, -32, G.PZ, m => {
    const cols = [], lights = [], PZ = G.PZ, X0 = -53, X1 = -12;
    m.color('#8a6440').shine(1);
    for (let x = X0; x < X1 - 0.01; x += 2.05) m.roundBox(x + 1.0, G.PIER - 0.12, PZ, 2.0, 0.24, 3.6, 0.06);
    m.color('#5a3e26');
    for (let x = X0; x <= X1 + 0.01; x += 4.1) for (const sz of [-1.85, 1.85]) { m.limb(x, -0.3, PZ + sz, x, 2.3, PZ + sz, 0.2, 0.18); }
    m.color(rope); for (const sz of [-1.85, 1.85]) for (let x = X0; x < X1 - 0.01; x += 4.1) bbaRope(m, [x, 2.0, PZ + sz], [x + 4.1, 2.0, PZ + sz], 0.05, 0.3, 4, { seg: 4 });
    m.color('#8a6440'); m.push(); m.tf(X0 - 2.0, 0.6, PZ, 0, -0.29, 0); m.roundBox(0, 0, 0, 4.2, 0.2, 3.4, 0.06); m.pop();
    // gangplank up to the port rail
    const gx0 = X1, gx1 = -4.55, gy0 = G.PIER, gy1 = 5.6, ga = Math.atan2(gy1 - gy0, gx1 - gx0), gl = Math.hypot(gx1 - gx0, gy1 - gy0);
    m.push(); m.tf((gx0 + gx1) / 2, (gy0 + gy1) / 2 - 0.1, PZ, Math.PI / 2, -ga, 0); m.color('#9a7048'); m.roundBox(0, 0, 0, 1.7, 0.2, gl, 0.06);
    m.color('#5a3e26'); for (let k = -gl / 2 + 0.4; k < gl / 2; k += 0.55) m.roundBox(0, 0.12, k, 1.5, 0.06, 0.1, 0.02); m.pop();
    m.color(rope); for (const sz of [-0.85, 0.85]) bbaRope(m, [gx0, gy0 + 1.1, PZ + sz], [gx1, gy1 + 1.0, PZ + sz], 0.05, 0.25, 5, { seg: 4 });
    // pier lanterns
    for (let x = X0 + 2; x < X1; x += 8.2) for (const sz of [-1.85, 1.85]) { m.color('#2a2a30'); m.limb(x, 2.3, PZ + sz, x, 3.1, PZ + sz, 0.06, 0.06); m.color('#ffd070', 0.95); m.ellipsoid(x, 3.25, PZ + sz, 0.2, 0.28, 0.2); m.emissive(0); lights.push({ x, y: 3.3, z: PZ + sz, s: 1.1, c: '#ffc860' }); }
    // zip landing tower + hay bales
    m.color('#5a3e26').shine(1); m.limb(-61.6, 0, 1.1, -61.6, 5.6, 1.1, 0.32, 0.26); m.limb(-61.6, 5.4, 1.1, -59.8, 4.6, 1.1, 0.16, 0.14); m.shine(0);
    m.color('#e8c870'); for (const [x, z] of [[-64.5, 0], [-64.5, 2.2], [-66.7, 1.1]]) m.roundBox(x, 0.5, z, 2.0, 1.0, 1.1, 0.3);
    // colliders
    cols.push({ t: 'box', x: (X0 + X1) / 2, z: PZ, hx: (X1 - X0) / 2, hz: 1.8, y0: 0, y1: G.PIER });
    cols.push({ t: 'ramp', x: X0 - 2.0, z: PZ, hx: 1.7, hz: 2.0, yaw: Math.PI / 2, y0: 0, ya: 0, yb: G.PIER });
    cols.push({ t: 'ramp', x: (gx0 + gx1) / 2, z: PZ, hx: 0.85, hz: (gx1 - gx0) / 2, yaw: Math.PI / 2, y0: 0, ya: gy0, yb: gy1 });
    for (const sz of [-1.85, 1.85]) cols.push({ t: 'box', x: (X0 + 2 + X1) / 2, z: PZ + sz, hx: (X1 - X0 - 2) / 2, hz: 0.1, y0: G.PIER, y1: G.PIER + 1.1, walk: false, camPass: true });
    cols.push({ t: 'cyl', x: -61.6, z: 1.1, r: 0.35, y0: 0, y1: 5.6, camPass: true });
    return { cols, lights };
  });
  const zip = bbaZipline(api, P, { a: [-1.3, G.NEST + 2.15, 1.1], b: [-59.8, 4.4, 1.1], sag: 1.2, at: [-0.95, G.NEST, 1.1], label: 'ZIP!' });
  bbaPart(api, P, -30, 1.1, m => { m.color('#2a2a30'); bbaRope(m, zip.a.map((v, i) => i === 0 ? -1.3 : i === 1 ? G.NEST + 2.15 : 1.1), [-59.8, 4.4, 1.1], 0.045, 1.2, 16, { seg: 4 }); return { cols: [] }; });
  P.summitL = [0, G.NEST, 0, 1.85];
  P.route = [['walk', -56.5, G.PZ], ['walk', -50, G.PZ], ['walk', -13, G.PZ], ['walk', -5.3, G.PZ], ['walk', -2.8, G.PZ], ['walk', -3.6, -0.6], ['jump', -5.15, -0.6], ['climb', 'shrouds'], ['walk', -0.95, 1.1], ['act'], ['zip']];
  P.spots = { nest: F.w(0, G.NEST, 0), deck: F.w(0, DK, 2), pierStart: F.w(-56, 0, G.PZ), zipEnd: F.w(-62, 0, 1.1), chest: F.w(0, 7.2, -13.2), ledge: F.w(-5.15, 5.0, -0.6) };
  bbaGlowPath(api, P, [[-45, 2.1, G.PZ], [-38, 2.1, G.PZ], [-31, 2.1, G.PZ], [-24, 2.1, G.PZ], [-17, 2.1, G.PZ], [-8.5, 4.4, G.PZ], [-3.6, 5.5, -0.6], [-5.2, 7.5, -0.55], [-4.6, 11, -0.55], [-3.8, 15, -0.55], [-2.9, 19, -0.55]]);
  { const pts = []; for (let i = 1; i < 8; i++) { const u = i / 8, q = [lerp(-1.3, -59.8, u), lerp(G.NEST + 2.15, 4.4, u) - 1.2 * 4 * u * (1 - u) - 1.2, 1.1]; pts.push(q); } bbaGlowPath(api, P, pts); }
  bbaPickup(api, P, P.o.treasure === undefined ? 'glow' : P.o.treasure, 0, 8.9, -13.2);
  bbaPool(api, P, -32, G.PZ, 12, '#ffc860', 0.35); bbaPool(api, P, 0, -14, 7, '#ffc860', 0.4);
  P.draw = (gg, Rr, Sp, nk) => { if (nk < 0.05) return; const q = F.w(0, 26.2, -1.8); Rr.bbs.bb(q[0], q[1], q[2], 1.6, 1.6, Sp.glow, [1, 0.85, 0.3], 0.6 * nk, true); };
}

/* ======================= 5. THE STICK CATHEDRAL =======================
   A towering basket-woven cathedral of bent saplings: a pointed-arch nave (z -16..12, entrance at +Z)
   and a twisted spire over the crossing (z = -4). Inside it is a jungle gym: woven nests, galleries,
   a tie-beam, hanging woven ladders, a crossing loft and a final ladder up the spire's core to the
   bird's nest at 26 m (summit). Sunlight pours through the weave by day; lanterns glow at night. */
const BBA_CATH = { R: 22.06, C: 14.06, APEX: 17, SPAN: 8, Z0: -16, Z1: 12, SZ: -4, NEST: 26, LOFT: 15 };
BBA_CATH.half = BBA_CATH.R * (Math.PI - Math.atan2(BBA_CATH.APEX, -BBA_CATH.C));
BBA_CATH.arch = (s, out) => {
  const K = BBA_CATH, Lh = K.half, left = s <= Lh, ss = left ? s : 2 * Lh - s, ph = Math.PI - ss / K.R;
  const x = K.C + K.R * Math.cos(ph); out[0] = left ? x : -x; out[1] = K.R * Math.sin(ph); return out;
};
BurnsBigArt.kinds.stickCathedral = {
  name: 'The Stick Cathedral', mission: 'Bird\'s Nest Bell', size: 46, foot: [20, 32], height: 38, summitY: 26,
  desc: 'A cathedral woven from bent saplings, big enough to hold weather. Climb through it like a jungle gym.',
  hint: 'Nest to nest, up the woven ladder, across the tie-beam, then up the spire\'s core to the bird\'s nest.',
  build(api, g, P) { bbaCathBuild(api, g, P); }
};
function bbaCathBuild(api, g, P) {
  const K = BBA_CATH, F = P.F, Lh = K.half, tmp = [0, 0];
  K.burnFn = K.burnFn || ((gg, PP, o) => bbaCathBurn(gg, PP, o));
  P.K.burn = K.burnFn;
  // already burned in this world (saved)? only the smouldering pile remains
  const burned = P.o.burned !== undefined ? !!P.o.burned : !!(g && BurnsSave.flag(g.worldId, 'bba:' + P.id + ':burned'));
  if (burned) { bbaCathAshes(api, g, P); return; }
  const stick = ['#c8a46a', '#b89458', '#d8b878', '#a8844c'];
  const ribZ = []; for (let z = K.Z1; z >= K.Z0 - 0.01; z -= 4) ribZ.push(z);
  const own = bbaOwnMesh(api, P), W = api.world, glow0 = W.glows.length, pick0 = W.pickupDefs.length;
  const bp = P.burnPtsL = [];   // flame points along the lattice (local), sampled from the sticks
  const sample = (pts, every) => { for (let i = 0; i < pts.length; i += every) bp.push(pts[i]); };
  /* ---- the nave: twisted ribs + diagonal basket weave ---- */
  bbaPart(api, P, 0, -2, m => {
    m.lo = true;
    ribZ.forEach((z, ri) => {
      for (let k = 0; k < 3; k++) {
        const pts = [];
        for (let i = 0; i <= 26; i++) { const s = i / 26 * 2 * Lh; K.arch(s, tmp); const a = s * 0.9 + k * TAU / 3, tw = 0.32; pts.push([tmp[0] + Math.cos(a) * tw * 0.6, tmp[1] + Math.sin(a) * tw * 0.4, z + Math.sin(a) * tw]); }
        m.color(stick[(ri + k) % 4]); bbaTube(m, pts, 0.17, 5, { caps: false });
        if (k === 0) sample(pts, 2);
      }
    });
    // diagonal weave across the vault (two directions), skipping the doorway on the front
    let n = 0;
    for (const dir of [1, -1]) for (let s0 = -28; s0 <= 2 * Lh + 28; s0 += 3.6) {
      const pts = [];
      for (let z = K.Z0; z <= K.Z1 + 0.01; z += 1.4) { const s = s0 + dir * (z - K.Z0) * 1.0; if (s < 0.4 || s > 2 * Lh - 0.4) { if (pts.length > 1) break; pts.length = 0; continue; } K.arch(s, tmp); pts.push([tmp[0] * 1.01, tmp[1] + 0.05, z]); }
      if (pts.length > 2) { m.color(stick[n++ % 4]); bbaTube(m, pts, 0.11, 4, { caps: false }); sample(pts, 3); }
    }
    // the apse: a woven back wall
    for (let i = 1; i < 9; i++) { const s = i / 9 * 2 * Lh; K.arch(s, tmp); m.color(stick[i % 4]); m.limb(tmp[0], 0, K.Z0 - 0.2, tmp[0] * 0.9, tmp[1] - 0.2, K.Z0 - 0.15, 0.12, 0.1, { seg: 4 }); }
    for (let y = 3; y < 16; y += 3.2) { const s = (Math.asin(clamp(y / K.R, 0, 1))) * K.R; const pts = []; for (let i = 0; i <= 8; i++) { const ss = lerp(s, 2 * Lh - s, i / 8); K.arch(ss, tmp); pts.push([tmp[0], Math.min(tmp[1], y + Math.sin(i / 8 * Math.PI) * 1.2), K.Z0 - 0.2]); } m.color(stick[(y | 0) % 4]); bbaTube(m, pts, 0.1, 4, { caps: false }); }
    // the facade: doorway arch, rose window ring
    m.color(stick[2]); for (const sx of [-1, 1]) m.limb(sx * 3.2, 0, K.Z1 + 0.15, sx * 3.0, 8.2, K.Z1 + 0.15, 0.2, 0.16, { seg: 5 });
    const door = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI; door.push([Math.cos(a) * 3.1, 8.2 + Math.sin(a) * 2.4, K.Z1 + 0.15]); } bbaTube(m, door, 0.18, 5, { caps: false });
    m.push(); m.tf(0, 12.4, K.Z1 + 0.2, 0, Math.PI / 2, 0); m.color(stick[0]); m.torus(0, 0, 0, 2.2, 0.2, { seg: 14, tseg: 4 }); m.color(stick[3]); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; m.limb(Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2, -Math.cos(a) * 2.2, 0, -Math.sin(a) * 2.2, 0.08, 0.08, { seg: 4 }); } m.pop();
    m.color('#ff9a4a', 0.75); m.push(); m.tf(0, 12.4, K.Z1 + 0.05, 0, Math.PI / 2, 0); m.ellipsoid(0, 0, 0, 1.9, 0.06, 1.9, { seg: 12, rings: 4 }); m.pop(); m.emissive(0);
    for (const sx of [-1, 1]) for (let y = 9; y < 15; y += 2.4) { m.color(stick[1]); m.limb(sx * 3.4, y, K.Z1 + 0.15, sx * 6.2, y - 2.5, K.Z1 + 0.15, 0.1, 0.1, { seg: 4 }); }
    m.lo = false;
    return { cols: [] };
  }, own);
  /* ---- the spire over the crossing ---- */
  bbaPart(api, P, 0, K.SZ, m => {
    m.lo = true;
    const y0 = 13.2, y1 = 38.5, r0 = 5.6;
    for (let k = 0; k < 12; k++) {
      const pts = []; for (let i = 0; i <= 18; i++) { const t = i / 18, a = k / 12 * TAU + t * 3.4 * (k % 2 ? 1 : -1), r = r0 * (1 - t) + 0.15; pts.push([Math.sin(a) * r, lerp(y0, y1, t), K.SZ + Math.cos(a) * r]); }
      m.color(stick[k % 4]); bbaTube(m, pts, lerp(0.16, 0.1, k / 12), 4, { caps: false });
      if (k % 2 === 0) sample(pts, 2);
    }
    for (const t of [0.0, 0.2, 0.42, 0.66]) { const r = r0 * (1 - t) + 0.15; m.color(stick[1]); m.torus(0, lerp(y0, y1, t), K.SZ, r, 0.13, { seg: 16, tseg: 4 }); }
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; m.color(stick[2]); m.limb(Math.sin(a) * r0, y0, K.SZ + Math.cos(a) * r0, Math.sin(a) * 6.8, 10.2, K.SZ + Math.cos(a) * 6.8, 0.16, 0.16, { seg: 4 }); }
    m.color('#ffd070', 0.9); m.ball(0, y1 + 0.6, K.SZ, 0.7); m.emissive(0);
    m.lo = false;
    return { cols: [], lights: [{ x: 0, y: y1 + 0.6, z: K.SZ, s: 2.5, c: '#ffd070' }] };
  }, own);
  /* ---- the jungle gym: nests, galleries, tie-beam, loft, core column, bird's nest ---- */
  bbaPart(api, P, 0, -3, m => {
    const cols = [], lights = [];
    const nest = (x, z, r, top) => {
      m.color('#9a7444').shine(1); m.lathe([[r * 0.55, 0], [r, top - 0.55], [r * 1.04, top - 0.15], [r * 0.98, top], [r * 0.9, top], [r * 0.85, top - 0.08], [0, top - 0.08]], { seg: m.segs(14, 8), rMod: (th, t) => 1 + Math.sin(th * 7) * 0.03 * t });
      m.push(); m.tf(x, 0, z); m.pop();
      m.color('#b08850'); m.torus(x, top - 0.06, z, r * 0.98, 0.14, { seg: 14, tseg: 4 });
      cols.push({ t: 'cyl', x, z, r, y0: 0, y1: top });
    };
    const N = [[-3.5, 6.0, 1.6, 1.4], [-2.4, 2.5, 1.7, 2.8], [4.8, -9.5, 1.5, 9.0], [0.5, -8.6, 1.6, 10.4]];
    for (const [x, z, r, top] of N) { m.push(); m.tf(x, 0, z); nest(0, 0, r, top); m.pop(); cols[cols.length - 1].x = x; cols[cols.length - 1].z = z; }
    // B3 stands on the east gallery: trim its collider bottom so it does not block the gallery
    cols[2].y0 = 7.6;
    // galleries (woven walkways on brackets) + the tie-beam + the crossing loft
    const deck = (x0, x1, z0, z1, y, c) => { m.color(c || '#a8844c').shine(1); m.roundBox((x0 + x1) / 2, y - 0.2, (z0 + z1) / 2, x1 - x0, 0.4, z1 - z0, 0.15); m.shine(0); cols.push({ t: 'box', x: (x0 + x1) / 2, z: (z0 + z1) / 2, hx: (x1 - x0) / 2, hz: (z1 - z0) / 2, y0: y - 0.4, y1: y }); };
    deck(-6.8, -3.5, -7, 4, 7.6); deck(3.5, 6.8, -12, 0, 7.6); deck(-3.5, 3.5, -5.55, -4.45, 7.6, '#8a6438'); deck(-3, 3, -7, -1, K.LOFT, '#9a7444');
    m.color('#8a6438'); for (const [x, z] of [[-5, -6], [-5, 3], [5, -11], [5, -1]]) m.limb(x, 0, z, x, 7.2, z, 0.2, 0.16, { seg: 5 });
    for (const [x, z] of [[-2.6, -6.6], [2.6, -6.6], [-2.6, -1.4], [2.6, -1.4]]) m.limb(x, 7.6, z, x, K.LOFT - 0.3, z, 0.2, 0.16, { seg: 5 });
    // the core column + bird's nest
    m.color('#8a6438'); m.limb(0, K.LOFT, K.SZ, 0, K.NEST + 0.2, K.SZ, 0.95, 0.75, { seg: m.segs(10, 6) });
    m.push(); m.tf(0, 0, K.SZ); m.color('#9a7444').shine(1); m.lathe([[0.8, K.NEST - 1.6], [2.05, K.NEST - 0.4], [2.1, K.NEST], [1.9, K.NEST + 0.35], [1.8, K.NEST + 0.05], [0, K.NEST + 0.02]], { seg: m.segs(16, 10), rMod: (th, t) => 1 + Math.sin(th * 9) * 0.04 * t }); m.shine(0);
    m.color('#ffd84a', 0.6); m.ball(0, K.NEST + 0.5, 1.2, 0.35); m.ball(0.5, K.NEST + 0.45, 1.0, 0.3); m.emissive(0); m.pop();
    cols.push({ t: 'cyl', x: 0, z: K.SZ, r: 0.95, y0: K.LOFT, y1: K.NEST });
    cols.push({ t: 'cyl', x: 0, z: K.SZ, r: 2.0, y0: K.NEST - 0.4, y1: K.NEST });
    // woven ladders (the climb nets)
    const ladder = (x0, z0, x1, z1, ya, yb) => { m.color('#b08850'); m.limb(x0, ya, z0, x0, yb, z0, 0.08, 0.08, { seg: 4 }); m.limb(x1, ya, z1, x1, yb, z1, 0.08, 0.08, { seg: 4 }); for (let y = ya + 0.4; y < yb; y += 0.5) m.limb(x0, y, z0, x1, y, z1, 0.06, 0.06, { seg: 4 }); };
    ladder(-3.52, 1.5, -3.52, 3.1, 2.8, 7.6);
    ladder(0.8, -7.08, 2.4, -7.08, 10.4, K.LOFT);
    ladder(-0.8, K.SZ - 2.08, 0.8, K.SZ - 2.08, K.LOFT, K.NEST);
    // a log step at the door + hanging lanterns
    m.color('#7a5432'); m.roundCyl(-4.4, 0, 8.6, 0.8, 0.7, 0.2);
    cols.push({ t: 'cyl', x: -4.4, z: 8.6, r: 0.8, y0: 0, y1: 0.7 });
    for (const [x, y, z] of [[0, 11, 6], [-4.5, 6, -2], [4.6, 6, -6], [0, 13, -10], [0, 22, K.SZ]]) { m.color('#2a2a30'); m.limb(x, y + 0.5, z, x, y + 2.5, z, 0.03, 0.03, { seg: 3 }); m.color('#ffc860', 0.95); m.ellipsoid(x, y, z, 0.32, 0.45, 0.32); m.emissive(0); lights.push({ x, y, z, s: 1.6, c: '#ffc860' }); }
    return { cols, lights };
  }, own);
  bbaClimbZone(api, P, { x: -3.5, z: 2.3, y0: 2.8, y1: 7.6, nx: 1, nz: 0, hw: 0.8, top: 7.6, exit: 0.95, name: 'ladder1' });
  bbaClimbZone(api, P, { x: 1.6, z: -7.05, y0: 10.4, y1: K.LOFT, nx: 0, nz: -1, hw: 0.75, top: K.LOFT, exit: 0.95, name: 'ladder2' });
  bbaClimbZone(api, P, { x: 0, z: K.SZ - 2.05, y0: K.LOFT, y1: K.NEST, nx: 0, nz: -1, hw: 0.8, top: K.NEST, exit: 0.95, name: 'spire' });
  P.summitL = [0, K.NEST, K.SZ, 1.8];
  P.route = [['walk', -4.4, 10.2], ['jump', -4.4, 8.6], ['jump', -3.5, 6.0], ['jump', -2.6, 2.6], ['walk', -3.05, 2.3], ['climb', 'ladder1'], ['walk', -5.0, -5.0], ['walk', 0, -5.0], ['walk', 4.6, -5.0], ['walk', 4.8, -7.6], ['jump', 4.8, -9.5], ['jump', 1.0, -8.6],
    ['walk', 1.6, -7.5], ['climb', 'ladder2'], ['walk', 0, -6.5], ['climb', 'spire'], ['walk', 0, -4.6]];
  P.spots = { nest: F.w(0, K.NEST, K.SZ), loft: F.w(0, K.LOFT, -4), door: F.w(0, 0, K.Z1 + 1), westGallery: F.w(-5, 7.6, -1), eastGallery: F.w(5, 7.6, -6) };
  bbaGlowPath(api, P, [[-4.4, 1.6, 8.6], [-3.5, 2.3, 6.0], [-2.4, 3.7, 2.5], [-3.1, 5.0, 2.3], [-5, 8.5, -1], [-5, 8.5, -5], [0, 8.5, -5], [4.8, 8.5, -5], [4.8, 9.9, -9.5], [0.5, 11.3, -8.6], [0.5, 13, -7.5], [0, 15.9, -5], [0, 18, -6.5], [0, 21, -6.5], [0, 24, -6.5]]);
  bbaPickup(api, P, P.o.nestReward === undefined ? 'glow' : P.o.nestReward, 0, K.NEST + 1.0, K.SZ + 0.8);
  bbaPool(api, P, 0, -2, 14, '#ffc860', 0.4);
  P.glowRange = [glow0, W.glows.length]; P.pickDefs = W.pickupDefs.slice(pick0);
  P.burnPts = bp.map(q => F.w(q[0], q[1], q[2]));
  if (P.o.burnable !== false) bbaCathCollapseParts(api, P);
  P.draw = (gg, Rr, Sp, nk) => {
    const env = gg.env, cam = gg.cam;
    if (P.burnt) return;
    if ((cam.x - F.x) * (cam.x - F.x) + (cam.z - F.z) * (cam.z - F.z) > 120 * 120) return;
    const day = 1 - nk;
    if (nk > 0.05) {
      // lantern light inside the nave: big soft glows behind the lattice show through every gap
      const t = P.R.t, warm = [1, 0.62, 0.25];
      for (let i = 0; i < 7; i++) { const z = K.Z1 - 2 - i * 4, q = F.w(0, 5 + (i % 2) * 3, z), fl = 0.85 + 0.15 * Math.sin(t * 3.1 + i * 1.7); Rr.bbs.bb(q[0], q[1], q[2], 16, 16, Sp.glow, warm, 0.22 * nk * fl, true); }
      const sp = F.w(0, 24, K.SZ); Rr.bbs.bb(sp[0], sp[1], sp[2], 13, 13, Sp.glow, warm, 0.2 * nk, true);
    }
    if (day > 0.05 && env && env.sunDir && env.sunDir[1] > 0.05) {
      // god rays through the weave
      const sd = env.sunDir, t = P.R.t, col = [1, 0.88, 0.62];
      for (let i = 0; i < 9; i++) {
        const s = 3 + (i * 4.7) % (2 * Lh - 6), z = K.Z0 + 2 + (i * 7.3) % (K.Z1 - K.Z0 - 4); K.arch(s, tmp);
        const a = F.w(tmp[0] * 0.9, tmp[1] - 0.4, z), L = Math.min(18, (tmp[1] - 0.4) / Math.max(0.2, sd[1]));
        const b = [a[0] - sd[0] * L, a[1] - sd[1] * L, a[2] - sd[2] * L];
        bbaLine(Rr, a[0], a[1], a[2], b[0], b[1], b[2], 1.6 + (i % 3) * 0.5, Sp.streak, col, (0.1 + 0.05 * Math.sin(t * 0.7 + i)) * day, true);
      }
    }
  };
}

/* ======================= 6. THE GLOWSHROOM GROVE =======================
   Giant glowing mushrooms spiralling up around the Elder Shroom. Every cap on the spiral is a
   trampoline (spring collider): bounce cap to cap to land on the Elder's cap at 24 m (summit).
   At night the caps pulse through the colours and spores drift up. */
const BBA_SHROOM = { RAD: 6.5, CAPS: [1.8, 5.6, 9.4, 13.0, 16.8, 20.6], STEP: 55 * Math.PI / 180, A0: 0, CR: 2.25, V: 18.6, ELDER: 24.0, ER: 3.6 };
BurnsBigArt.kinds.glowshroomGrove = {
  name: 'The Glowshroom Grove', mission: 'Elder Shroom Summit', size: 34, foot: [30, 30], height: 25, summitY: 24,
  desc: 'Mushrooms the size of water towers, and every cap is a trampoline.',
  hint: 'Jump onto the smallest cap and keep steering toward the next one up the spiral.',
  build(api, g, P) { bbaShroomBuild(api, g, P); }
};
function bbaShroomBuild(api, g, P) {
  const K = BBA_SHROOM, F = P.F, hues = [175, 315, 270, 30, 95, 200];
  const capPos = i => { const a = K.A0 + i * K.STEP; return [Math.sin(a) * K.RAD, Math.cos(a) * K.RAD]; };
  const shroom = (m, x, z, top, r, hue, spots) => {
    const cap = burnsHSL(hue, 0.75, 0.62), rim = burnsHSL(hue, 0.95, 0.72), stem = '#f2ead8';
    m.color(stem).shine(1); m.limb(x, 0, z, x, top - 0.6, z, Math.max(0.38, r * 0.4), Math.max(0.3, r * 0.27), { seg: m.segs(12, 7), mid: 0.06 });
    if (r > 1.2) { m.color('#e8dcc8'); m.push(); m.tf(x, 0, z); m.lathe([[r * 0.3, top * 0.62], [r * 0.6, top * 0.6 - 0.35], [r * 0.58, top * 0.6 - 0.45], [r * 0.28, top * 0.6]], { seg: 12 }); m.pop(); }
    m.color(burnsHSL(hue, 0.5, 0.35), 0.35); m.push(); m.tf(x, top - 0.85, z); m.lathe([[r * 0.25, 0], [r * 0.95, 0.12], [r * 0.95, 0.12]], { seg: m.segs(16, 9) }); m.pop(); m.emissive(0);
    m.color(cap, 0.18).shine(2); m.push(); m.tf(x, top - 0.85, z);
    m.lathe([[r * 0.95, 0.12], [r * 1.02, 0.18, rim, 0.6], [r * 0.98, 0.45], [r * 0.8, 0.72], [r * 0.45, 0.85], [0, 0.88]], { seg: m.segs(18, 10) });
    m.pop();
    m.color('#fff8ec', 0.4); for (let i = 0; i < spots; i++) { const a = i * 2.4 + hue, rr = r * (0.35 + (i % 3) * 0.2); m.ellipsoid(x + Math.sin(a) * rr, top - 0.05 - (rr / r) * 0.2, z + Math.cos(a) * rr, r * 0.13, r * 0.06, r * 0.13, { seg: 8, rings: 4 }); }
    m.emissive(0).shine(0);
  };
  const dyn = [];
  bbaPart(api, P, 0, 0, m => {
    const cols = [], lights = [];
    K.CAPS.forEach((top, i) => {
      const [x, z] = capPos(i);
      shroom(m, x, z, top, K.CR, hues[i], 5);
      cols.push({ t: 'cyl', x, z, r: K.CR - 0.15, y0: top - 0.75, y1: top, spring: K.V, tag: 'bbaCap' });
      cols.push({ t: 'cyl', x, z, r: 0.75, y0: 0, y1: top - 0.75 });
    });
    // the Elder Shroom (not springy: the summit)
    shroom(m, 0, 0, K.ELDER, K.ER, 285, 9);
    m.color('#ffd84a', 0.6); m.ball(0.9, K.ELDER + 0.1, -0.6, 0.3); m.ball(-0.8, K.ELDER + 0.08, 0.7, 0.25); m.emissive(0);
    cols.push({ t: 'cyl', x: 0, z: 0, r: K.ER - 0.1, y0: K.ELDER - 0.8, y1: K.ELDER });
    cols.push({ t: 'cyl', x: 0, z: 0, r: 1.4, y0: 0, y1: K.ELDER - 0.8 });
    // a ring of little shrooms; some are baby trampolines
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * TAU + 0.2, d = 11 + (i % 3) * 2.2, x = Math.sin(a) * d, z = Math.cos(a) * d, top = 0.8 + (i % 4) * 0.45, r = 0.7 + (i % 3) * 0.25;
      shroom(m, x, z, top, r, (i * 47) % 360, 3);
      cols.push(i % 3 === 0 ? { t: 'cyl', x, z, r: r * 0.9, y0: 0, y1: top, spring: 13 } : { t: 'cyl', x, z, r: r * 0.9, y0: 0, y1: top });
    }
    // mossy floor rings
    m.color('#7a9a5a'); for (let i = 0; i < 6; i++) { const a = i * 1.1; m.ellipsoid(Math.sin(a) * 4, 0.02, Math.cos(a) * 4, 1.6, 0.12, 1.2, { seg: 8, rings: 3 }); }
    return { cols, lights };
  });
  // dynamic glows (pulsing colours at night): two per cap + the elder
  const glowAt = (x, y, z, s) => { const q = bbaDynGlow(api, P, x, y, z, s, '#ffffff'); q.s = 0; dyn.push(q); return q; };
  K.CAPS.forEach((top, i) => { const [x, z] = capPos(i); glowAt(x, top - 1.0, z, K.CR * 1.6); glowAt(x, top + 0.2, z, K.CR * 1.1); });
  glowAt(0, K.ELDER - 1.0, 0, K.ER * 1.7); glowAt(0, K.ELDER + 0.3, 0, K.ER * 1.2);
  P.summitL = [0, K.ELDER, 0, 2.9];
  P.caps = K.CAPS.map((top, i) => { const [x, z] = capPos(i); return { x: F.wx(x, z), z: F.wz(x, z), y: F.wy(top), r: K.CR * F.s, flash: 0 }; });
  P.route = [['walk', capPos(0)[0] * 1.6, capPos(0)[1] * 1.6], ['jump', capPos(0)[0], capPos(0)[1]]];
  for (let i = 1; i < K.CAPS.length; i++) P.route.push(['bounce', capPos(i)[0], capPos(i)[1]]);
  P.route.push(['bounce', 0, 0]);
  P.spots = { elder: F.w(0, K.ELDER, 0) };
  bbaGlowPath(api, P, K.CAPS.map((top, i) => { const [x, z] = capPos(i); return [x, top + 3.2, z]; }).concat([[0, K.ELDER + 1.0, 0]]));
  bbaPickup(api, P, P.o.elderReward === undefined ? null : P.o.elderReward, 0, K.ELDER + 1.0, 0.8);
  bbaPool(api, P, 0, 0, 16, '#b07aff', 0.35);
  P.draw = (gg, Rr, Sp, nk) => {
    if (P.o.beacon === false) return;
    // a pulsing column of spore light over the Elder Shroom: a destination you can see from far away
    const t = P.R.t, a = F.w(0, K.ELDER + 0.5, 0), b = F.w(0, K.ELDER + 60, 0), c = bbaHue((t * 30) % 360, 1, 0.65), k = (0.1 + 0.3 * nk) * (0.8 + 0.2 * Math.sin(t * 2.2));
    bbaLine(Rr, a[0], a[1], a[2], b[0], b[1], b[2], 9 * F.s, Sp.beam, c, k, true);
    bbaLine(Rr, a[0], a[1], a[2], b[0], b[1] - 25 * F.s, b[2], 3 * F.s, Sp.beam, [1, 1, 1], k * 0.8, true);
    Rr.bbs.bb(a[0], a[1] + 1, a[2], 14 * F.s, 9 * F.s, Sp.glow, c, k * 1.2, true);
  };
  P.update = (gg, wdt) => {
    const nk = bbaNight(gg, P), t = P.R.t, p = gg.player;
    for (let i = 0; i < dyn.length; i++) {
      const ci = Math.min(K.CAPS.length, i >> 1), cap = P.caps[ci], fl = cap ? cap.flash : 0;
      const hue = ((ci < K.CAPS.length ? hues[ci] : 285) + t * 25 + Math.sin(t * 0.9 + ci) * 30) % 360, c = bbaHue(hue, 1, 0.6);
      const k = Math.max(0, nk * (0.55 + 0.45 * Math.sin(t * 2.2 + ci * 1.3)) + fl);
      dyn[i].c[0] = c[0] * k; dyn[i].c[1] = c[1] * k; dyn[i].c[2] = c[2] * k; dyn[i].s = dyn[i].s0 * (k > 0.02 ? 1 + fl * 0.6 : 0);
    }
    for (const cap of P.caps) if (cap.flash > 0) cap.flash = Math.max(0, cap.flash - wdt * 2.5);
    // a bounce just happened: flash that cap
    if (!p.grounded && p.vy > K.V * 0.9 && p.vy <= K.V + 0.01) for (const cap of P.caps) if (Math.hypot(p.x - cap.x, p.z - cap.z) < cap.r + 0.5 && Math.abs(p.y - cap.y) < 0.8 && cap.flash < 0.5) { cap.flash = 1; gg.fx.ring(cap.x, cap.y + 0.1, cap.z, cap.r * 1.3, '#ffffff', 0.4); gg.fx.burst(cap.x, cap.y + 0.3, cap.z, 'star', 8, BURNS_NEON[(Math.random() * 7) | 0]); }
    if (nk > 0.2 && Math.random() < wdt * 6 * nk) { const a = Math.random() * TAU, d = Math.random() * 12, q = F.w(Math.sin(a) * d, 0.5 + Math.random() * 3, Math.cos(a) * d); gg.fx.add(q[0], q[1], q[2], (Math.random() - 0.5) * 0.4, 0.8 + Math.random() * 0.6, (Math.random() - 0.5) * 0.4, 4, 0.18, 0.05, bbaHue(Math.random() * 360, 1, 0.7), 1, 'glow', 1); }
  };
}

/* ======================= 7. THE LEANING LIGHTHOUSES =======================
   Three crooked lighthouses that lean on each other like old friends after a long night.
   Each has an outside spiral staircase (walkable, 0.42 m risers) up to a gallery. Press ACTION
   at the top to LIGHT IT: twin beams start sweeping the playa and reveal what hides in the dark:
   darkwads (burners with no lights) become visible, and a hidden plank bridge appears from Kip's
   gallery to the Keeper's Cache. Tallest gallery (Lou, 24.4 m) = summit. */
const BBA_LH = {
  TOWERS: [
    { name: 'LEANING LOU', x: -7, z: -4, gH: 24.4, ld: [0.7, 0.7], la: 0.12, a0: Math.PI * 1.1, col: ['#f4f0e8', '#d23a30'] },
    { name: 'TIPSY TESS', x: 8, z: -2, gH: 18.4, ld: [-1, 0.15], la: 0.16, a0: Math.PI * 0.35, col: ['#f4f0e8', '#2a8ac8'] },
    { name: 'CROOKED KIP', x: 0, z: 10, gH: 13.6, ld: [0.2, 1], la: 0.1, a0: Math.PI * 1.55, col: ['#f8e8b8', '#2a9a6a'] }
  ],
  R0: 3.0, R1: 2.2, GR: 3.15, ROUT: 4.6, RISE: 0.42, DA: 0.27
};
BurnsBigArt.kinds.lighthouses = {
  name: 'The Leaning Lighthouses', mission: 'Keeper of the Light', size: 40, foot: [34, 34], height: 30, summitY: 24.4,
  desc: 'Three crooked lighthouses leaning on each other. Light them up and their beams show you what hides in the dark.',
  hint: 'Walk the spiral stairs to a gallery and press ACTION to light the lamp. Watch where the beams sweep.',
  build(api, g, P) { bbaLighthouseBuild(api, g, P); }
};
function bbaLHAxis(T, y) { const l = Math.hypot(T.ld[0], T.ld[1]) || 1, k = Math.tan(T.la) * y; return [T.x + T.ld[0] / l * k, T.z + T.ld[1] / l * k]; }
function bbaLighthouseBuild(api, g, P) {
  const K = BBA_LH, F = P.F;
  P.lh = [];
  K.TOWERS.forEach((T, ti) => {
    const gH = T.gH, lampY = gH + 1.7, ax = bbaLHAxis(T, 0), top = bbaLHAxis(T, gH);
    const rAt = y => K.R0 - (K.R0 - K.R1) * clamp(y / gH, 0, 1);
    const steps = [];
    const rise = gH / Math.ceil(gH / (K.RISE / F.s));   // world rise stays <= 0.42 m at any scale
    for (let i = 0, y = rise; y <= gH + 0.01; i++, y += rise) {
      const a = T.a0 + i * K.DA * rise / K.RISE, c = bbaLHAxis(T, y), rin = y > gH - 2.7 ? K.GR + 0.05 : rAt(y) - 0.05;
      steps.push({ a, y, cx: c[0], cz: c[1], rin, rc: (rin + K.ROUT) / 2, hz: (K.ROUT - rin) / 2 });
    }
    bbaPart(api, P, T.x, T.z, m => {
      const cols = [], lights = [];
      const yawL = Math.atan2(T.ld[0], T.ld[1]), cl = Math.cos(T.la);
      // the leaning tower body (striped), lamp room, dome
      m.push(); m.tf(T.x, 0, T.z, yawL, T.la, 0);
      const prof = []; const bands = 7;
      for (let b = 0; b <= bands; b++) { const y = b / bands * gH / cl, r = rAt(y * cl); const c = T.col[b % 2]; prof.push([r, y, c]); if (b < bands) prof.push([rAt((b + 1) / bands * gH) + 0.0001, (b + 1) / bands * gH / cl - 0.001, c]); }
      m.shine(1); m.lathe(prof, { seg: m.segs(20, 12) });
      m.color('#2a2a30'); m.roundCyl(0, gH / cl - 0.35, 0, K.GR, 0.35, 0.1, { seg: m.segs(20, 12) });
      m.color('#c8eaff', 0.25).shine(3); m.lathe([[1.95, gH / cl], [1.95, gH / cl + 2.9]], { seg: m.segs(16, 10) }); m.emissive(0);
      m.color('#2a2a30'); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; m.limb(Math.sin(a) * 1.97, gH / cl, Math.cos(a) * 1.97, Math.sin(a) * 1.97, gH / cl + 2.9, Math.cos(a) * 1.97, 0.06, 0.06, { seg: 4 }); }
      m.color(T.col[1]).shine(2); m.lathe([[2.25, gH / cl + 2.9], [2.25, gH / cl + 3.1], [1.6, gH / cl + 3.9], [0.4, gH / cl + 4.5], [0, gH / cl + 4.6]], { seg: m.segs(16, 10) });
      m.color('#ffd84a').shine(3); m.ball(0, gH / cl + 4.8, 0, 0.3); m.shine(0);
      m.color('#3a3a44'); m.roundCyl(0, gH / cl + 0.3, 0, 0.7, 0.9, 0.15);
      m.color('#fff2c8', 0.5); m.ball(0, gH / cl + 1.7, 0, 0.75); m.emissive(0);
      // gallery rail
      m.color('#2a2a30'); m.torus(0, gH / cl + 1.0, 0, K.GR - 0.08, 0.06, { seg: m.segs(20, 12), tseg: 4 });
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; m.limb(Math.sin(a) * (K.GR - 0.08), gH / cl, Math.cos(a) * (K.GR - 0.08), Math.sin(a) * (K.GR - 0.08), gH / cl + 1.0, Math.cos(a) * (K.GR - 0.08), 0.045, 0.045, { seg: 4 }); }
      // door + windows (glow at night)
      m.color('#3a2a1a'); m.push(); m.tf(0, 0, 0, T.a0 + Math.PI); m.roundBox(0, 1.1, K.R0 - 0.05, 1.2, 2.2, 0.3, 0.1); m.pop();
      for (let k = 1; k < 4; k++) { const y = k * gH / 4.2 / cl, a = T.a0 + k * 2.1; m.color('#ffd070', 0.75); m.push(); m.tf(0, y, 0, a); m.roundBox(0, 0, rAt(y * cl) - 0.02, 0.6, 0.9, 0.12, 0.08); m.pop(); m.emissive(0); }
      m.pop();
      // the spiral stairs (vertical colliders follow the leaning axis)
      m.lo = true;
      const rail = [];
      for (const s of steps) {
        const sx = Math.sin(s.a), sz = Math.cos(s.a);
        m.color(s.y > gH - 2.7 ? '#7a5a3a' : '#8a6a4a').shine(1);
        m.push(); m.tf(s.cx + sx * s.rc, s.y - 0.13, s.cz + sz * s.rc, s.a); m.roundBox(0, 0, 0, 1.2, 0.26, s.hz * 2, 0.08); m.pop(); m.shine(0);
        cols.push({ t: 'box', x: s.cx + sx * s.rc, z: s.cz + sz * s.rc, hx: 0.62, hz: s.hz, yaw: s.a, y0: s.y - 0.26, y1: s.y });
        cols.push({ t: 'box', x: s.cx + sx * (K.ROUT + 0.08), z: s.cz + sz * (K.ROUT + 0.08), hx: 0.6, hz: 0.06, yaw: s.a, y0: s.y, y1: s.y + 1.0, walk: false, camPass: true });
        rail.push([s.cx + sx * (K.ROUT - 0.02), s.y + 0.95, s.cz + sz * (K.ROUT - 0.02)]);
        if (steps.indexOf(s) % 3 === 0) { m.color('#2a2a30'); m.limb(rail[rail.length - 1][0], s.y, rail[rail.length - 1][2], rail[rail.length - 1][0], s.y + 0.95, rail[rail.length - 1][2], 0.04, 0.04, { seg: 3 }); }
        // the steps hang off brackets on the tower
        if (steps.indexOf(s) % 2 === 0) { m.color('#3a3a44'); m.limb(s.cx + sx * (s.rin + 0.05), s.y - 0.9, s.cz + sz * (s.rin + 0.05), s.cx + sx * s.rc, s.y - 0.25, s.cz + sz * s.rc, 0.07, 0.05, { seg: 3 }); }
      }
      m.color('#2a2a30'); bbaTube(m, rail, 0.05, 4, { caps: false });
      m.lo = false;
      // tower body colliders (stacked, following the lean) + gallery + lamp room
      for (let y = 0; y < gH - 0.4; y += 2.2) { const c = bbaLHAxis(T, y + 1.1); cols.push({ t: 'cyl', x: c[0], z: c[1], r: rAt(y + 1.1) - 0.05, y0: y, y1: Math.min(gH - 0.35, y + 2.2), cover: true }); }
      cols.push({ t: 'cyl', x: top[0], z: top[1], r: K.GR, y0: gH - 0.35, y1: gH });
      cols.push({ t: 'cyl', x: top[0], z: top[1], r: 2.0, y0: gH, y1: gH + 3.3, cover: true });
      lights.push({ x: ax[0], y: 0.5, z: ax[1], s: 0, c: '#ffd070', pool: 7 * (P.maxNight > 0.25 ? 1 : 0) });
      return { cols, lights };
    });
    const lampW = F.w(top[0], lampY, top[1]);
    const L = { i: ti, T, name: T.name, lit: !!(P.o.lit === true || (Array.isArray(P.o.lit) && P.o.lit[ti])), x: lampW[0], y: lampW[1], z: lampW[2], yaw: ti * 2.1, range: 85 * F.s, width: 7 * F.s, twin: true, steps, gal: F.w(top[0], gH, top[1]) };
    P.lh.push(L); P.R.beams.push(L);
    L.glow = bbaDynGlow(api, P, top[0], lampY, top[1], 3.2, '#fff2c8'); L.glow.s = 0;
    bbaItem(P, { x: L.gal[0], z: L.gal[2], y: L.gal[1], r: 3.7 * F.s, label: 'LIGHT IT!', when: () => !L.lit, fn: gg => bbaLight(gg, P, L) });
  });
  /* ---- the hidden bridge from Kip's gallery to the Keeper's Cache (appears when a beam sweeps it) ---- */
  const T2 = K.TOWERS[2], kTop = bbaLHAxis(T2, T2.gH), bz0 = kTop[1] + K.GR + 0.9;
  const bridge = bbaMover(api, P, m => {
    const cols = [];
    for (let k = 0; k < 7; k++) { const z = bz0 + k * 1.9, y = T2.gH + k * 0.12; m.color(burnsHSL(180 + k * 25, 0.9, 0.6), 0.85).shine(2); m.roundBox(kTop[0], y - 0.15, z, 1.9, 0.3, 1.5, 0.1); cols.push({ t: 'box', x: kTop[0], z, hx: 0.95, hz: 0.75, y0: y - 0.3, y1: y }); }
    const cz = bz0 + 6 * 1.9 + 3.0, cy = T2.gH + 0.9;
    m.color('#3a2a5a', 0.3).shine(1); m.roundBox(kTop[0], cy - 0.3, cz, 3.4, 0.6, 3.4, 0.25);
    m.color('#ffd84a', 0.9); m.ellipsoid(kTop[0], cy - 0.8, cz, 1.4, 0.4, 1.4); m.emissive(0).shine(0);
    cols.push({ t: 'box', x: kTop[0], z: cz, hx: 1.7, hz: 1.7, y0: cy - 0.6, y1: cy });
    return { cols, lights: [{ x: kTop[0], y: cy - 0.9, z: cz, s: 2.4, c: '#ffd84a' }] };
  });
  bbaPose(P, bridge, 0, 0, 0, 0, 0, 0); bridge.visible = !!P.o.bridgeVisible;
  P.parts = { bridge };
  const mid = F.w(kTop[0], T2.gH, bz0 + 6.5), cache = F.w(kTop[0], T2.gH + 0.9, bz0 + 6 * 1.9 + 3.0);
  P.R.reveals.push({ x: mid[0], z: mid[2], r: 4, kind: 'path', done: bridge.visible, fn: gg => { bridge.visible = true; gg.banner('A HIDDEN PATH!', 'The beam lit a bridge to the Keeper\'s Cache.', { col: '#38f2ff', small: true }); burnsSfx('secret'); for (let k = 0; k < 7; k++) { const q = F.w(kTop[0], T2.gH + 0.3, bz0 + k * 1.9); gg.fx.burst(q[0], q[1], q[2], 'star', 6, '#38f2ff'); } if (P.o.onReveal) P.o.onReveal(gg, P, { kind: 'path' }); } });
  if (P.o.cacheReward !== null) { const rw = P.o.cacheReward === undefined ? 'glow' : P.o.cacheReward; if (rw === 'glow') api.glowRing(cache[0], cache[2], 1.0, 8, cache[1] + 0.9); else bbaPickup(api, P, rw, kTop[0], T2.gH + 1.8, bz0 + 6 * 1.9 + 3.0); }
  for (const q of P.o.reveals || []) { const w = F.w(q.x, 0, q.z); P.R.reveals.push({ x: w[0], z: w[2], r: q.r || 2, kind: 'custom', done: false, fn: q.fn }); }
  /* ---- darkwads: burners walking around with no lights (hidden until a beam finds them) ---- */
  const nDark = P.o.darkwads === undefined ? 5 : P.o.darkwads | 0;
  P.darkwads = [];
  const lines = [['WHOA. Light! I\'ve been walking in circles since Tuesday.', 'Take these glow sticks. I clearly can\'t be trusted with them.'], ['Is it night? I thought I went blind.', 'Here, have my glow sticks. I found them in my pocket. Weird.'], ['A DARKWAD? Me? ...Yeah, fair.', 'Gifting you my emergency glow. Ironically.'], ['I was being mysterious. Mostly lost.', 'Glow sticks for the lighthouse hero!'], ['My EL wire died on day one. Long story.', 'Have some glow. Shine on, lighthouse kid.']];
  P.start = gg => {
    const rng = mulberry32(hashStr(P.id + 'dark'));
    for (let i = 0; i < nDark; i++) {
      const a = i / Math.max(1, nDark) * TAU + rng() * 0.6, d = (26 + rng() * 26) * F.s, x = F.x + Math.sin(a) * d, z = F.z + Math.cos(a) * d;
      const a2 = gg.spawnActor({ type: ['burner', 'furcoat', 'tutu', 'crusty', 'burner'][i % 5], seed: 300 + i, x, z, yaw: rng() * TAU, behavior: 'wander', radius: 3, speed: 0.7, name: 'DARKWAD', lines: lines[i % lines.length], gift: { kind: 'glowstick', n: 5 }, chatter: false, always: true, _bbaDark: true });
      a2.hidden = true; a2.data.dark = true; P.darkwads.push(a2);
      const q = { x, z, r: 2, kind: 'darkwad', done: false, actor: a2, fn: (g2, qq) => {
        const A = qq.actor; A.hidden = false; A.ch.play('cheer'); A.say(['WHOA, LIGHT!', 'I can SEE!', 'Am I glowing?', 'Who turned the playa on?'][i % 4], 2.4);
        g2.fx.confetti(A.x, A.y + 2, A.z, 20); burnsSfx('secret', { vol: 0.6 });
        const n = P.darkwads.filter(d2 => !d2.hidden).length; g2.toast(`DARKWAD LIT UP ${n}/${P.darkwads.length}`);
        A.data.led = BURNS_NEON[i % 7];
        if (n === P.darkwads.length) { g2.banner('NO MORE DARKWADS!', 'Everyone out here can see now.', { col: '#38f2ff', small: true }); g2.missions.event('bbaDarkwadsAll', P); if (P.o.onDarkwads) P.o.onDarkwads(g2, P); }
        if (P.o.onReveal) P.o.onReveal(g2, P, { kind: 'darkwad', actor: A });
      } };
      P.R.reveals.push(q);
    }
  };
  P.summitL = (() => { const t = bbaLHAxis(K.TOWERS[0], K.TOWERS[0].gH); return [t[0], K.TOWERS[0].gH, t[1], 3.4]; })();
  // route (local) up Lou's spiral stairs: waypoints every few steps
  { const T = K.TOWERS[0], st0 = P.lh[0].steps, r = [];
    const s0 = st0[0]; r.push(['walk', s0.cx + Math.sin(s0.a - 0.6) * 5.6, s0.cz + Math.cos(s0.a - 0.6) * 5.6]);
    for (let i = 0; i < st0.length; i += 2) { const s = st0[i], rr = Math.min(K.ROUT - 0.55, s.rc + 0.25); r.push(['walk', s.cx + Math.sin(s.a) * rr, s.cz + Math.cos(s.a) * rr]); }
    const tp = bbaLHAxis(T, T.gH), last = st0[st0.length - 1], ga = last.a + 0.5; r.push(['walk', tp[0] + Math.sin(ga) * 2.65, tp[1] + Math.cos(ga) * 2.65]); r.push(['act']);
    P.route = r; }
  P.spots = { lou: P.lh[0].gal, tess: P.lh[1].gal, kip: P.lh[2].gal, cache, bridge: F.w(kTop[0], T2.gH, bz0 - 0.3) };
  bbaGlowPath(api, P, P.lh[0].steps.filter((s, i) => i % 6 === 3).map(s => { const l = F.l(s.cx + Math.sin(s.a) * s.rc, s.cz + Math.cos(s.a) * s.rc); return [l[0], s.y + 0.9, l[1]]; }));
  P.update = (gg, wdt) => {
    const nk = bbaNight(gg, P);
    for (const L of P.lh) {
      L.yaw += wdt * 0.9;
      const k = L.lit ? 0.55 + 0.45 * nk : 0;
      L.glow.s = L.lit ? L.glow.s0 * (1 + nk) : 0; L.glow.c[0] = k; L.glow.c[1] = k * 0.95; L.glow.c[2] = k * 0.78;
    }
    for (const A of P.darkwads) if (!A.hidden && A.data.led && Math.random() < wdt * 3) gg.fx.glint(A.x, A.y + 1.2, A.z, A.data.led);
  };
  P.draw = (gg, Rr, Sp, nk) => {
    const cam = gg.cam, a = 0.07 + 0.2 * nk;
    for (const L of P.lh) {
      if (!L.lit) continue;
      for (const off of [0, Math.PI]) {
        const yaw = L.yaw + off, dx = Math.sin(yaw), dz = Math.cos(yaw), tilt = Math.atan2(L.y, 48 * F.s), len = Math.min(L.range, (L.y - 0.2) / Math.sin(tilt));
        const ex = L.x + dx * len * Math.cos(tilt), ey = L.y - len * Math.sin(tilt), ez = L.z + dz * len * Math.cos(tilt);
        bbaLine(Rr, L.x, L.y, L.z, ex, ey, ez, L.width * 1.3, Sp.beam, [1, 0.95, 0.75], a * 0.5, true);
        bbaLine(Rr, L.x, L.y, L.z, ex, ey, ez, L.width * 0.55, Sp.beam, [1, 0.98, 0.88], a, true);
        Rr.flat.flat(ex, Math.max(0.05, ey) + 0.05, ez, L.width * 1.4, L.width * 3.2, yaw, Sp.glow, [1, 0.92, 0.7], a * 2.2, true);
        const tc = bbaV.norm(cam.x - L.x, cam.y - L.y, cam.z - L.z), f = Math.max(0, dx * Math.cos(tilt) * tc[0] - Math.sin(tilt) * tc[1] + dz * Math.cos(tilt) * tc[2]);
        if (f > 0.75) Rr.bbs.bb(L.x, L.y, L.z, 10 * f * f, 10 * f * f, Sp.glow, [1, 0.95, 0.8], (f - 0.75) * 2.4 * (0.3 + 0.7 * nk), true);
      }
    }
  };
}
function bbaLight(g, P, L) {
  if (L.lit) return;
  L.lit = true;
  g.banner(L.name + ' IS LIT', 'Watch where the beam sweeps...', { col: '#ffe8a0', small: true });
  burnsSfx('secret'); burnsSfx('crowd_cheer', { vol: 0.4 }); g.fx.confetti(L.x, L.y, L.z, 30); g.shake(0.15);
  g.missions.event('bbaLit', L);
  if (P.o.onLit) P.o.onLit(g, P, L.i);
  if (P.lh.every(q => q.lit)) { g.banner('ALL THREE LIGHTS ARE LIT', 'The Leaning Lighthouses are fully awake.', { col: '#ffd84a' }); g.missions.event('bbaAllLit', P); if (P.o.onAllLit) P.o.onAllLit(g, P); }
}

/* ======================= 8. THE RETRO ROCKET =======================
   A 31 m atomic-age rocket standing on three swept fins, with a red lattice launch gantry at +X.
   Climb the gantry's ladders level by level (5 m apart, hatches alternate sides) to the top deck
   (25 m, summit) and hit the big red button: countdown, rumble, steam, ignition and a fireworks
   show from the nose cone. The access arm swings away and back. It never leaves. That's the art. */
const BBA_RKT = { GX0: 7, GX1: 13, GZ: 3, LV: [5, 10, 15, 20, 25], HX: 11.0, TOP: 25 };
BurnsBigArt.kinds.retroRocket = {
  name: 'The Retro Rocket', mission: 'Push the Big Red Button', size: 36, foot: [22, 16], height: 32, summitY: 25,
  desc: 'An atomic-age rocket bound for nowhere. Climb the gantry and push the big red button.',
  hint: 'Ladders inside the gantry: up through the hatches, level by level. The button is on the top deck.',
  build(api, g, P) { bbaRocketBuild(api, g, P); }
};
function bbaRocketBuild(api, g, P) {
  const K = BBA_RKT, F = P.F, cream = '#f4ecd8', red = '#d8342c', chrome = '#d8dce4', gred = '#c8302a';
  /* ---- the rocket ---- */
  bbaPart(api, P, 0, 0, m => {
    const cols = [], lights = [];
    m.shine(2);
    m.lathe([[0, 3.0, cream], [1.8, 3.1, cream], [2.6, 4.5, cream], [3.1, 8, cream], [3.2, 10.8, cream], [3.2, 10.8, red], [3.2, 12.6, red], [3.2, 12.6, cream], [3.0, 17, cream], [2.6, 21, cream], [2.0, 24.5, cream], [2.0, 24.5, chrome], [1.3, 27.5, chrome], [0.6, 30, chrome], [0, 31.3, chrome]], { seg: m.segs(28, 14) });
    m.color('#3a3a44').shine(1); m.lathe([[0, 2.9], [1.25, 2.6], [1.55, 2.3], [2.05, 1.25], [2.15, 1.15], [1.9, 1.15], [1.2, 2.2], [0, 2.5]], { seg: m.segs(20, 10) });
    m.color('#ff8a2a', 0.5); m.ellipsoid(0, 1.6, 0, 1.6, 0.25, 1.6, { seg: 14, rings: 4 }); m.emissive(0);
    // fins
    for (let k = 0; k < 3; k++) {
      const a = Math.PI / 6 + k * TAU / 3;
      m.push(); m.tf(0, 0, 0, a - Math.PI / 2);
      m.color(red).shine(2); m.extrude([[2.7, 12.8], [2.9, 4.0], [6.6, 0.25], [7.0, 0.25], [6.6, 2.2], [4.6, 7.0]], 0.55, { convex: false });
      m.color(chrome).shine(3); m.ball(6.85, 0.45, 0, 0.42);
      m.color('#ffe24a', 0.9); m.ball(6.9, 1.2, 0, 0.18); m.emissive(0).shine(0);
      m.pop();
      const d = [Math.sin(a), Math.cos(a)];
      cols.push({ t: 'box', x: d[0] * 5.0, z: d[1] * 5.0, hx: 0.35, hz: 2.0, yaw: a, y0: 0, y1: 3.2 });
      lights.push({ x: d[0] * 6.9, y: 1.2, z: d[1] * 6.9, s: 0.9, c: '#ffe24a', blink: 4 });
    }
    // portholes + hatch facing the gantry (+X)
    for (const [y, a] of [[14.5, Math.PI / 2], [18.5, Math.PI / 2], [16.5, -Math.PI / 6], [16.5, Math.PI * 1.2]]) {
      const r = y < 17 ? 3.08 : 2.75; m.push(); m.tf(Math.sin(a) * r, y, Math.cos(a) * r, a, Math.PI / 2, 0);
      m.color(chrome).shine(3); m.torus(0, 0, 0, 0.62, 0.13, { seg: 14, tseg: 5 }); m.color('#8adcff', 0.65); m.ellipsoid(0, 0, 0, 0.55, 0.08, 0.55, { seg: 12, rings: 4 }); m.emissive(0).shine(0); m.pop();
      lights.push({ x: Math.sin(a) * (r + 0.2), y, z: Math.cos(a) * (r + 0.2), s: 1.0, c: '#8adcff' });
    }
    m.color('#3a3a44').shine(1); m.push(); m.tf(2.5, 21.2, 0, Math.PI / 2, 0.08); m.roundBox(0, 0, 0, 1.6, 2.2, 0.25, 0.25); m.pop();
    m.color('#ffe24a', 0.8); m.roundBox(2.68, 22.45, 0, 0.1, 0.18, 1.0, 0.04); m.emissive(0).shine(0);
    // body colliders
    cols.push({ t: 'cyl', x: 0, z: 0, r: 2.2, y0: 0, y1: 3.1, cover: true });
    cols.push({ t: 'cyl', x: 0, z: 0, r: 3.15, y0: 3.1, y1: 17, cover: true });
    cols.push({ t: 'cyl', x: 0, z: 0, r: 2.5, y0: 17, y1: 24.5, cover: true });
    cols.push({ t: 'cyl', x: 0, z: 0, r: 1.4, y0: 24.5, y1: 30, cover: true });
    lights.push({ x: 0, y: 31.6, z: 0, s: 1.4, c: '#ff3a2a', blink: 2 });
    return { cols, lights };
  });
  /* ---- the gantry ---- */
  bbaPart(api, P, (K.GX0 + K.GX1) / 2, 0, m => {
    const cols = [], lights = [], X0 = K.GX0, X1 = K.GX1, Z = K.GZ, H = K.TOP + 1.2;
    m.color(gred).shine(1);
    for (const x of [X0, X1]) for (const z of [-Z, Z]) { m.roundBox(x, H / 2, z, 0.4, H, 0.4, 0.1); cols.push({ t: 'cyl', x, z, r: 0.28, y0: 0, y1: H, camPass: true }); }
    const lv = [0].concat(K.LV);
    for (let i = 0; i < lv.length - 1; i++) {
      const y0 = lv[i] + 0.2, y1 = lv[i + 1] - 0.2;
      for (const z of [-Z, Z]) { m.limb(X0, y0, z, X1, y1, z, 0.09, 0.09, { seg: 4 }); m.limb(X1, y0, z, X0, y1, z, 0.09, 0.09, { seg: 4 }); }
      m.limb(X1, y0, -Z, X1, y1, Z, 0.09, 0.09, { seg: 4 }); m.limb(X1, y1, -Z, X1, y0, Z, 0.09, 0.09, { seg: 4 });
    }
    m.shine(0);
    // decks with alternating hatches (+z on odd levels, -z on even)
    K.LV.forEach((y, i) => {
      const hz = i % 2 === 0 ? 1 : -1;   // hatch side
      const deck = (x0, x1, z0, z1) => { m.color('#3a3a44').shine(1); m.roundBox((x0 + x1) / 2, y - 0.12, (z0 + z1) / 2, x1 - x0, 0.24, z1 - z0, 0.06); m.shine(0); cols.push({ t: 'box', x: (x0 + x1) / 2, z: (z0 + z1) / 2, hx: (x1 - x0) / 2, hz: (z1 - z0) / 2, y0: y - 0.24, y1: y }); };
      if (i === K.LV.length - 1) { deck(X0, X1, -Z, hz > 0 ? 1.0 : Z); if (hz > 0) deck(X0, 11.0, 1.0, Z); }
      else if (hz > 0) { deck(X0, X1, -Z, 1.0); deck(X0, 11.0, 1.0, Z); }
      else { deck(X0, X1, -1.0, Z); deck(X0, 11.0, -Z, -1.0); }
      m.color('#ffc21a'); for (const [x, z, w, d] of [[(X0 + X1) / 2, -Z, X1 - X0, 0.08], [(X0 + X1) / 2, Z, X1 - X0, 0.08], [X1, 0, 0.08, 2 * Z]]) m.roundBox(x, y + 1.0, z, w, 0.08, d, 0.03);
      // the ladder up to this level (rails + rungs) on the hatch's -x edge, climbed from inside the hatch
      const zc = hz * 1.9, yb = i ? K.LV[i - 1] : 0, xl = K.HX + 0.05;
      m.color('#d8dce4').shine(2); for (const z of [zc - 0.72, zc + 0.72]) m.limb(xl, yb, z, xl, y + 1.0, z, 0.05, 0.05, { seg: 4 }); for (let yy = yb + 0.35; yy < y; yy += 0.4) m.limb(xl, yy, zc - 0.72, xl, yy, zc + 0.72, 0.04, 0.04, { seg: 4 }); m.shine(0);
      lights.push({ x: X1, y: y + 1.0, z: 0, s: 0.7, c: '#ff3a2a', blink: 1.5 });
    });
    // top deck rails + the big red button + floodlights
    const T = K.TOP;
    m.color('#ffc21a'); m.roundBox(X0, T + 1.0, 0, 0.08, 0.08, 2 * Z, 0.03);
    m.color('#3a3a44').shine(1); m.roundCyl(10, T, 0.6, 0.5, 1.0, 0.12); m.color('#d82a2a', 0.6).shine(2); m.ellipsoid(10, T + 1.05, 0.6, 0.55, 0.3, 0.55, { phi1: Math.PI / 2 }); m.emissive(0).shine(0);
    m.color('#ffe24a'); m.roundBox(10, T + 0.75, 0.6, 1.2, 0.12, 1.2, 0.05);
    cols.push({ t: 'cyl', x: 10, z: 0.6, r: 0.55, y0: T, y1: T + 1.2 });
    for (const z of [-Z, Z]) { m.color('#2a2a30'); m.roundBox(X0 + 0.2, T + 1.6, z, 0.5, 0.5, 0.7, 0.1); m.color('#fff4d8', 1); m.roundBox(X0 - 0.06, T + 1.6, z, 0.06, 0.4, 0.55, 0.03); m.emissive(0); lights.push({ x: X0 - 0.3, y: T + 1.6, z, s: 2.0, c: '#fff4d8' }); }
    lights.push({ x: 2, y: 0.2, z: 0, s: 0, c: '#fff0d8', pool: 12 * (P.maxNight > 0.25 ? 1 : 0) });
    return { cols, lights };
  });
  // ladders: ground->L1 (+z), L1->L2 (-z), L2->L3 (+z), L3->L4 (-z), L4->top (+z)
  K.LV.forEach((y, i) => { const hz = i % 2 === 0 ? 1 : -1; bbaClimbZone(api, P, { x: K.HX, z: hz * 1.9, y0: i ? K.LV[i - 1] : 0, y1: y, nx: 1, nz: 0, hw: 0.78, top: y, exit: 0.95, name: 'ladder' + i }); });
  /* ---- the access arm (swings away at launch) ---- */
  const arm = bbaMover(api, P, m => {
    m.color(gred).shine(1); m.roundBox(-1.9, -0.15, 0, 3.8, 0.3, 1.6, 0.08);
    m.color('#ffc21a'); for (const sz of [-0.78, 0.78]) m.roundBox(-1.9, 0.9, sz, 3.8, 0.08, 0.08, 0.03);
    m.color(gred); for (const sz of [-0.78, 0.78]) for (const x of [-0.2, -1.9, -3.6]) m.limb(x, 0, sz, x, 0.9, sz, 0.05, 0.05, { seg: 4 });
    m.shine(0);
    return { cols: [{ t: 'box', x: -1.9, z: 0, hx: 1.9, hz: 0.8, y0: -0.3, y1: 0 }] };
  });
  const armHome = K.LV[3];
  bbaPose(P, arm, K.GX0, armHome, 0, 0, 0, 0);
  P.parts = { arm };
  bbaItem(P, { x: F.wx(10, 0.6), z: F.wz(10, 0.6), y: F.wy(K.TOP), r: 2.4 * F.s, label: 'LAUNCH!', when: () => !P.launch, fn: gg => bbaLaunch(gg, P) });
  bbaPickup(api, P, P.o.hatchReward === undefined ? 'glow' : P.o.hatchReward, 3.6, armHome + 0.9, 0);
  P.summitL = [10, K.TOP, -0.6, 2.9];
  P.route = [['walk', 12.2, 5.0], ['walk', 11.55, 1.9], ['climb', 'ladder0']];
  for (let i = 1; i < K.LV.length; i++) { const hz = i % 2 === 0 ? 1 : -1; P.route.push(['walk', 11.55, hz * 1.9], ['climb', 'ladder' + i]); }
  P.route.push(['walk', 10, -0.5], ['act']);
  P.spots = { top: F.w(10, K.TOP, 0), button: F.w(10, K.TOP, 0.6), hatch: F.w(3.6, armHome, 0), nose: F.w(0, 31.3, 0) };
  bbaGlowPath(api, P, [[11.5, 2.5, 1.9], [11.5, 7.5, -1.9], [11.5, 12.5, 1.9], [11.5, 17.5, -1.9], [11.5, 22.5, 1.9], [9, K.TOP + 0.9, -1.5], [5.5, armHome + 0.9, 0]]);
  bbaPool(api, P, 10, 0, 9, '#ff6a4a', 0.3);
  const st = P.rk = { shells: [] };
  P.update = (gg, wdt) => {
    const L = P.launch;
    // the arm swings away during a launch and back after
    const want = L && L.t < 14 ? -1.35 : 0;
    st.armA = BurnsM.damp(st.armA || 0, want, 1.6, wdt);
    bbaPose(P, arm, K.GX0, armHome, 0, st.armA, 0, 0);
    // fireworks shells in flight
    for (const s of st.shells) { s.t += wdt; s.vy -= 9 * wdt; s.x += s.vx * wdt; s.y += s.vy * wdt; s.z += s.vz * wdt; if (Math.random() < 0.7) gg.fx.trail(s.x, s.y, s.z, s.col); if (s.vy < 2 || s.t > 3) { s.done = true; gg.fx.firework(s.x, s.y, s.z, s.col); gg.fx.firework(s.x + 1, s.y + 1, s.z - 1, BURNS_NEON[(Math.random() * 7) | 0]); burnsSfx('firework_burst', { vol: 0.5, pitch: 0.8 + Math.random() * 0.4 }); gg.pointLight(s.x, s.y, s.z, 40, bbaHue(Math.random() * 360), 2); } }
    st.shells = st.shells.filter(s => !s.done);
    if (!L) return;
    const t0 = L.t; L.t += wdt; const t = L.t;
    const nozzle = F.w(0, 1.2, 0), nose = F.w(0, 31.3, 0);
    for (let k = 0; k < 5; k++) if (t0 < k && t >= k) { gg.banner('T-MINUS ' + (5 - k), k < 4 ? 'Stand clear of the fins!' : 'Here we go...', { col: '#ff4a2a', small: true }); burnsSfx('greeter_bell', { pitch: 0.6 + k * 0.1 }); }
    if (t < 5) { gg.shake(0.05 + t * 0.05); if (Math.random() < wdt * 30 * (0.3 + t / 5)) { const a = Math.random() * TAU; gg.fx.add(nozzle[0] + Math.sin(a) * 3, 0.3, nozzle[2] + Math.cos(a) * 3, Math.sin(a) * 4, 1 + Math.random() * 2, Math.cos(a) * 4, 2.2, 1.5, 5, [0.95, 0.95, 1], 0.45, 'smoke', 4); } }
    if (t0 < 5 && t >= 5) { gg.banner('IGNITION!', 'Destination: nowhere. Spectacularly.', { col: '#ffb020', big: true }); burnsSfx('man_roar', { pitch: 0.5 }); burnsSfx('flame_jet'); gg.shake(0.7); gg.missions.event('bbaLaunch', P); if (P.o.onLaunch) P.o.onLaunch(gg, P); }
    if (t >= 5 && t < 11) {
      gg.shake(0.25);
      for (let i = 0; i < 4; i++) { const a = Math.random() * TAU, sp = 2 + Math.random() * 6; gg.fx.add(nozzle[0] + (Math.random() - 0.5), nozzle[1], nozzle[2] + (Math.random() - 0.5), Math.sin(a) * sp, -2 - Math.random() * 3, Math.cos(a) * sp, 0.7, 1.6, 0.6, [1, 0.6, 0.2], 1, 'flame', 1); }
      if (Math.random() < wdt * 25) { const a = Math.random() * TAU; gg.fx.add(nozzle[0] + Math.sin(a) * 4, 0.4, nozzle[2] + Math.cos(a) * 4, Math.sin(a) * 6, 0.8, Math.cos(a) * 6, 3, 2, 7, [0.9, 0.88, 0.92], 0.4, 'smoke', 4); }
      gg.pointLight(nozzle[0], 2, nozzle[2], 30, [1, 0.55, 0.2], 2.4);
      if (Math.random() < wdt * 4) burnsSfx('flame_jet', { vol: 0.6 });
    }
    if (t >= 6.5 && t < 13.5 && (L.next = (L.next || 6.5)) <= t) {
      L.next = t + 0.22 + Math.random() * 0.25;
      const a = Math.random() * TAU, sp = 2 + Math.random() * 4;
      st.shells.push({ x: nose[0], y: nose[1] + 0.5, z: nose[2], vx: Math.sin(a) * sp, vy: 26 + Math.random() * 10, vz: Math.cos(a) * sp, t: 0, col: BURNS_NEON[(Math.random() * 7) | 0] });
      burnsSfx('firework_launch', { vol: 0.4 });
    }
    if (t0 < 14 && t >= 14) { gg.banner('MISSION ACCOMPLISHED', 'The rocket went nowhere. The crowd went wild.', { col: '#7aff5a', small: true }); burnsSfx('crowd_cheer'); }
    if (t > 17) P.launch = null;
  };
  P.draw = (gg, Rr, Sp, nk) => {
    const L = P.launch; if (!L || L.t < 5 || L.t > 11) return;
    const q = F.w(0, 1.0, 0), e = F.w(0, -3, 0), k = Math.min(1, (L.t - 5) * 3) * Math.min(1, (11 - L.t));
    Rr.bbs.bb(q[0], q[1] - 0.5, q[2], 9 * k, 9 * k, Sp.glow, [1, 0.6, 0.25], 0.9, true);
    bbaLine(Rr, q[0], q[1], q[2], e[0], e[1], e[2], 4.5 * k, Sp.flame, [1, 0.75, 0.35], 0.9, true);
  };
}
function bbaLaunch(g, P) {
  if (P.launch) return;
  P.launch = { t: 0 };
  g.banner('LAUNCH SEQUENCE', 'Countdown started. Hold on to your bun.', { col: '#ff4a2a' });
  burnsSfx('neon_flash', { vol: 0.5 });
}

/* ---- THE BURN: the Stick Cathedral's spectacular burn (a side-quest set piece) ----------------
   BurnsBigArt.burn(g, cathedral, { cinematic: true, crowd: 26, music, hazard: true, persist: true, onDone(g, piece) })
   Timeline (s): 0 the crowd gathers in a circle - 5 ignition, fire runs up the woven lattice -
   13.5 a fire tornado spins up in the nave - 21 the structure collapses - 22 a glowing pile -
   32 done (onDone). Skippable (cinematic = a cutscene with SKIP: skipping jumps to the glowing pile).
   The cathedral's static mesh is its own chunk, so it can vanish; low-detail mover copies fall. */
const BBA_CBURN = { IGNITE: 5, CLIMB: 10, T0: 13.5, T1: 21.2, COLLAPSE: 21, FALL: 2.6, END: 32, TOP: 40 };
BurnsBehaviors.register('bbaSpectator', {
  init(a) { a.data.mode = 'walk'; a.data.cheer = Math.random() * 3; },
  update(a, g, dt) {
    const D = a.data, d = a.def, S = d._bbaB, ph = S ? S.phase : 'embers';
    if (D.mode === 'walk') {
      const r = a.moveTo(d.tx, d.tz, d.speed || 2.6, dt, 0.35); a.ch.play('walk', { rate: 1.4 });
      if (r < 0.5) D.mode = 'watch';
    } else {
      a.vx = BurnsM.damp(a.vx, 0, 6, dt); a.vz = BurnsM.damp(a.vz, 0, 6, dt);
      a.face(d.fx, d.fz, dt, 4);
      D.cheer -= dt;
      if (ph === 'embers') a.ch.play('dance', { style: d.style, bpm: 120 + d.style * 3 });
      else if (ph === 'tornado' || ph === 'collapse' || D.cheer > 2.2) a.ch.play('cheer');
      else { a.ch.play(ph === 'fire' && Math.sin(a.t * 0.7 + d.style) > 0.6 ? 'cheer' : 'idle'); if (D.cheer < 0) D.cheer = 3 + Math.random() * 5; }
    }
    a.physics(dt);
  }
});
function bbaCathCollapseParts(api, P) {
  const K = BBA_CATH, Lh = K.half, tmp = [0, 0], dark = '#7a5a34', charred = '#4a3020';
  const section = (px, py, pz, build) => { const mv = bbaMover(api, P, m => { m.lo = true; m.push(); m.tf(-px, -py, -pz); build(m); m.pop(); m.lo = false; return { cols: [] }; }); bbaPose(P, mv, px, py, pz, 0, 0, 0); mv.visible = false; return { mv, px, py, pz }; };
  const half = (left) => m => {
    for (let z = K.Z1; z >= K.Z0 - 0.01; z -= 4) { const pts = []; for (let i = 0; i <= 10; i++) { const s = (left ? 0 : Lh) + i / 10 * Lh; K.arch(s, tmp); pts.push([tmp[0], tmp[1], z]); } m.color(dark); bbaTube(m, pts, 0.24, 4, { caps: false }); }
    let n = 0;
    for (const dir of [1, -1]) for (let s0 = -28; s0 <= 2 * Lh + 28; s0 += 7.2) {
      const pts = [];
      for (let z = K.Z0; z <= K.Z1 + 0.01; z += 2.8) { const s = s0 + dir * (z - K.Z0); if ((left && (s < 0.4 || s > Lh)) || (!left && (s < Lh || s > 2 * Lh - 0.4))) { if (pts.length > 1) break; pts.length = 0; continue; } K.arch(s, tmp); pts.push([tmp[0], tmp[1] + 0.05, z]); }
      if (pts.length > 2) { m.color(n++ % 2 ? dark : charred); bbaTube(m, pts, 0.14, 3, { caps: false }); }
    }
  };
  P.fall = [
    Object.assign(section(-K.SPAN, 0, -2, half(true)), { axis: 'roll', ang: -1.2, delay: 0.25 }),
    Object.assign(section(K.SPAN, 0, -2, half(false)), { axis: 'roll', ang: 1.2, delay: 0.45 }),
    Object.assign(section(0, 13.2, K.SZ, m => {
      for (let k = 0; k < 6; k++) { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, a = k / 6 * TAU + t * 3.4, r = 5.6 * (1 - t) + 0.15; pts.push([Math.sin(a) * r, lerp(13.2, 38.5, t), K.SZ + Math.cos(a) * r]); } m.color(k % 2 ? dark : charred); bbaTube(m, pts, 0.15, 3, { caps: false }); }
      m.color(dark); m.limb(0, K.LOFT, K.SZ, 0, K.NEST, K.SZ, 0.9, 0.7, { seg: 6 }); m.color('#ffb040', 0.8); m.ball(0, 39.1, K.SZ, 0.7); m.emissive(0);
    }), { axis: 'pitch', ang: 1.75, delay: 0, drop: 11 }),
    Object.assign(section(0, 0, K.Z1 + 0.15, m => {
      m.color(dark); for (const sx of [-1, 1]) m.limb(sx * 3.2, 0, K.Z1 + 0.15, sx * 3.0, 8.2, K.Z1 + 0.15, 0.22, 0.18, { seg: 4 });
      const door = []; for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI; door.push([Math.cos(a) * 3.1, 8.2 + Math.sin(a) * 2.4, K.Z1 + 0.15]); } bbaTube(m, door, 0.2, 4, { caps: false });
      m.push(); m.tf(0, 12.4, K.Z1 + 0.2, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 2.2, 0.22, { seg: 10, tseg: 4 }); m.pop();
      m.color('#ff7a2a', 0.9); m.push(); m.tf(0, 12.4, K.Z1 + 0.05, 0, Math.PI / 2, 0); m.ellipsoid(0, 0, 0, 1.9, 0.06, 1.9, { seg: 10, rings: 3 }); m.pop(); m.emissive(0);
    }), { axis: 'pitch', ang: 1.45, delay: 0.7 })
  ];
  // the glowing pile left behind
  P.pile = bbaMover(api, P, m => { bbaCathPileMesh(m); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 5.2, y0: 0, y1: 1.7 }] }; });
  bbaPose(P, P.pile, 0, 0, -2, 0, 0, 0); P.pile.visible = false;
}
function bbaCathPileMesh(m) {
  const rows = [[0, 0], [6.6, 0], [6.2, 0.45], [5.4, 0.8], [4.4, 1.25], [3.2, 1.65], [2.0, 2.0], [0.8, 2.25], [0, 2.3]].map((q, i) => [q[0], q[1], i % 2 ? '#ff5a1a' : '#241812', i % 2 ? 0.95 : 0]);
  m.lathe(rows, { seg: m.segs(16, 10), rMod: (th, t) => 1 + Math.sin(th * 5 + t * 7) * 0.08 + Math.sin(th * 11) * 0.04 });
  const rng = mulberry32(7);
  for (let i = 0; i < 16; i++) {
    const a = rng() * TAU, r0 = rng() * 2.5, r1 = 3 + rng() * 3.5, a1 = a + (rng() - 0.5) * 1.4, y0 = 1.6 + rng() * 0.9;
    const x0 = Math.sin(a) * r0, z0 = Math.cos(a) * r0, x1 = Math.sin(a1) * r1, z1 = Math.cos(a1) * r1;
    m.color('#2a1a12'); m.limb(x0, y0, z0, x1, 0.4 + rng() * 0.6, z1, 0.32, 0.26, { seg: 6 });
    m.color('#ff6a1a', 0.95); m.ball(x1, 0.45 + rng() * 0.5, z1, 0.28, { seg: 6, rings: 4 }); m.emissive(0);
  }
}
// already burned (saved): only the smouldering pile is built
function bbaCathAshes(api, g, P) {
  const F = P.F;
  P.burnt = true; P.summitL = null;
  bbaPart(api, P, 0, -2, m => { m.push(); m.tf(0, 0, -2); bbaCathPileMesh(m); m.pop(); return { cols: [{ t: 'cyl', x: 0, z: -2, r: 5.2, y0: 0, y1: 1.7 }], lights: [{ x: 0, y: 2.6, z: -2, s: 6, c: '#ff6a1a' }] }; });
  bbaPool(api, P, 0, -2, 14, '#ff6a2a', 0.5);
  P.spots = { pile: F.w(0, 1.7, -2) };
  P.start = gg => { if (P.o.hazard !== false) for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, q = F.w(Math.sin(a) * 3.2, 1.2, -2 + Math.cos(a) * 3.2); gg.addTempFire(q[0], q[1], q[2], 1.0, 1e9); } };
  P.update = (gg, wdt) => { if (Math.random() < wdt * 2) { const q = F.w((Math.random() - 0.5) * 6, 2.2, -2 + (Math.random() - 0.5) * 6); gg.fx.add(q[0], q[1], q[2], 0.3, 1.2, 0, 5, 1.5, 6, [0.25, 0.22, 0.22], 0.3, 'smoke', 4 | 32); } };
}
function bbaCathBurn(g, P, o) {
  o = o || {};
  if (P.burnt || (P.cburn && !P.cburn.done)) { if (P.burnt && o.onDone) o.onDone(g, P); return P.cburn || null; }
  const F = P.F, K = BBA_CATH, T = BBA_CBURN, R = P.R;
  const c = F.w(0, 0, -2);
  const B = P.cburn = { t: 0, phase: 'gather', o, cx: c[0], cz: c[2], y0: F.y0, front: 0, tornado: 0, crowd: [], done: false, collapsed: false, tc: 0 };
  // the crowd gathers in a circle around the cathedral
  const n = o.crowd === undefined ? 26 : o.crowd | 0, rng = mulberry32(hashStr(P.id + 'crowd')), ring = 30 * F.s;
  const types = ['burner', 'furcoat', 'tutu', 'ledsuit', 'sparklepony', 'crusty', 'burner', 'ranger'];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + rng() * 0.12, rr = ring + (i % 3) * 1.6 * F.s + rng() * 0.8;
    const sx = B.cx + Math.sin(a) * (rr + 10), sz = B.cz + Math.cos(a) * (rr + 10), tx = B.cx + Math.sin(a) * rr, tz = B.cz + Math.cos(a) * rr;
    const A = g.spawnActor({ type: types[i % types.length], seed: 900 + i, x: sx, z: sz, yaw: a + Math.PI, behavior: 'bbaSpectator', tx, tz, fx: B.cx, fz: B.cz, speed: 3.0 + rng() * 0.8, style: i % 6, _bbaB: B, noTalk: true, chatter: false, always: true });
    B.crowd.push(A);
  }
  // keep Brady safely outside the burn perimeter
  const p = g.player;
  if (Math.hypot(p.x - B.cx, p.z - B.cz) < ring - 2) {
    const a = Math.atan2(p.x - B.cx, p.z - B.cz) || 0.4, rr = ring + 4 * F.s;
    if (p.vehicle) p.vehicle.dismount(p);
    p.teleport(B.cx + Math.sin(a) * rr, g.world.height(B.cx + Math.sin(a) * rr, B.cz + Math.cos(a) * rr), B.cz + Math.cos(a) * rr, a + Math.PI);
    g.toast('A RANGER WAVES YOU BACK TO THE PERIMETER');
  }
  if (o.music) burnsMusic(o.music);
  burnsSfx('crowd_cheer', { vol: 0.7 });
  g.missions.event('bbaBurn', P);
  if (o.cinematic !== false) {
    const C = (lx, ly, lz, tx, ty, tz, fov) => { const a = F.w(lx, ly, lz), b = F.w(tx, ty, tz); return { x: a[0], y: a[1], z: a[2], tx: b[0], ty: b[1], tz: b[2], fov: fov || 1.0 }; };
    const A0 = C(-36, 8, 36, 0, 12, -2), B0 = C(-27, 4.5, 27, 0, 14, -2), C0 = C(-24, 3.5, 30, 0, 18, -3, 1.1), D0 = C(-19, 2.8, 27, 0, 21, -3, 1.18), E0 = C(-34, 10, 28, 0, 5, -2), F0 = C(-24, 4.5, 24, 0, 1.5, -2);
    g.cutscene([
      { cam: A0 },
      { banner: ['THE BURN', 'Tonight the Stick Cathedral goes up.', { col: '#ff7a2a', big: true, dur: 3.5 }] },
      { cam: { from: A0, to: B0, dur: T.IGNITE } },
      { cam: { from: B0, to: C0, dur: T.T0 - T.IGNITE + 0.5 } },
      { cam: { from: C0, to: D0, dur: T.COLLAPSE - T.T0 - 0.5 } },
      { cam: { from: D0, to: E0, dur: 4 } },
      { cam: { from: E0, to: F0, dur: T.END - T.COLLAPSE - 4 } },
      { do: gg => bbaCathBurnFinish(gg, P) }
    ], null);
    B.cine = g.cine;
  }
  return B;
}
function bbaCathCollapse(g, P) {
  const B = P.cburn;
  if (B.collapsed) return; B.collapsed = true; B.tc = B.t;
  if (P.chunk) P.chunk.count = 0;              // the woven cathedral is gone...
  for (const c of P.cols) c.off = true;
  for (const z of P.climbs) z.off = true;
  if (P.glowRange) for (let i = P.glowRange[0]; i < P.glowRange[1]; i++) g.world.glows[i].s = 0;
  for (const it of g.pickups.items) if (!it.taken && P.pickDefs && P.pickDefs.some(d => Math.abs(d.x - it.x) < 0.01 && Math.abs(d.z - it.z) < 0.01)) { it.taken = true; it.obj.visible = false; }
  P.summit = null; P.burnt = true;
  if (P.fall) for (const S of P.fall) S.mv.visible = true;   // ...replaced by burning copies that fall
  burnsSfx('man_stomp', { pitch: 0.6 }); burnsSfx('man_roar', { pitch: 0.4, vol: 0.8 }); burnsSfx('crowd_cheer'); g.shake(0.8);
  for (const q of P.burnPts) if (Math.random() < 0.25) g.fx.burst(q[0], q[1], q[2], 'spark', 3, '#ffb040');
}
// the pile stays hot: real fires (flames, flicker light, and they burn if you walk in)
function bbaCathPileFires(g, P) {
  const B = P.cburn; if (B.fires) return; B.fires = true;
  const F = P.F, hot = B.o.hazard !== false;
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, q = F.w(Math.sin(a) * 3.2, 1.2, -2 + Math.cos(a) * 3.2); if (hot) g.addTempFire(q[0], q[1], q[2], 1.0, 1e9); else g.world.fires.push({ x: q[0], y: q[1], z: q[2], r: 1.0, hazard: false, t: Math.random() * 10 }); }
}
function bbaCathBurnFinish(g, P) {
  const B = P.cburn; if (!B || B.done) return;
  if (!B.collapsed) bbaCathCollapse(g, P);
  B.done = true; B.phase = 'embers'; B.t = Math.max(B.t, BBA_CBURN.END); B.tornado = 0;
  if (P.fall) for (const S of P.fall) S.mv.visible = false;
  if (P.pile) { P.pile.visible = true; P.pile.scale = 1; }
  for (const A of B.crowd) { if (A.data.mode === 'walk') { A.x = A.def.tx; A.z = A.def.tz; A.data.mode = 'watch'; } }
  bbaCathPileFires(g, P);
  if (B.o.persist !== false) BurnsSave.flag(g.worldId, 'bba:' + P.id + ':burned', true);
  burnsSfx('crowd_cheer');
  g.missions.event('bbaBurnDone', P);
  if (B.o.onDone) B.o.onDone(g, P);
}
function bbaCathBurnStep(g, P, dt) {
  const B = P.cburn, T = BBA_CBURN, F = P.F;
  if (B.done) {
    // the glowing pile smoulders on
    if (Math.random() < dt * 6) { const q = F.w((Math.random() - 0.5) * 7, 2.2, -2 + (Math.random() - 0.5) * 7); g.fx.add(q[0], q[1], q[2], (Math.random() - 0.5) * 0.6, 2 + Math.random() * 2, (Math.random() - 0.5) * 0.6, 2.2, 0.12, 0.04, [1, 0.6, 0.25], 1, 'spark', 1 | 32); }
    if (Math.random() < dt * 3) { const q = F.w((Math.random() - 0.5) * 5, 2.6, -2 + (Math.random() - 0.5) * 5); g.fx.add(q[0], q[1], q[2], 0.4, 1.4, 0.1, 5, 2, 8, [0.2, 0.18, 0.18], 0.32, 'smoke', 4 | 32); }
    if (g.frameN !== B.lf) { B.lf = g.frameN; const q = F.w(0, 3, -2); g.pointLight(q[0], q[1], q[2], 26, [1, 0.45, 0.15], 1.6 + Math.sin(P.R.t * 7) * 0.2); }
    return;
  }
  B.t += dt;
  const t = B.t;
  B.phase = t < T.IGNITE ? 'gather' : t < T.T0 ? 'fire' : t < T.COLLAPSE ? 'tornado' : t < T.COLLAPSE + T.FALL + 1.2 ? 'collapse' : 'embers';
  if (t >= T.IGNITE && B.t - dt < T.IGNITE) { burnsSfx('flame_jet'); burnsSfx('crowd_cheer', { vol: 0.8 }); if (!B.cine) g.banner('IGNITION', 'The weave catches...', { col: '#ff7a2a', small: true }); }
  B.front = clamp((t - T.IGNITE) / T.CLIMB, 0, 1);
  const h = B.front * T.TOP * F.s, alive = !B.collapsed;
  // fire runs up the woven lattice
  if (alive && t >= T.IGNITE) {
    const pts = P.burnPts, n = 7;
    for (let i = 0; i < n; i++) {
      const q = pts[(Math.random() * pts.length) | 0], dy = h - (q[1] - B.y0);
      if (dy < 0 || (dy > 7 && Math.random() < 0.6)) continue;
      g.fx.add(q[0] + (Math.random() - 0.5) * 0.6, q[1], q[2] + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 1.2, 2.5 + Math.random() * 2.5, (Math.random() - 0.5) * 1.2, 0.55 + Math.random() * 0.3, 2.4, 0.7, [1, 0.5 + Math.random() * 0.3, 0.15], 1, 'flame', 1);
    }
    if (Math.random() < dt * 40) { const q = pts[(Math.random() * pts.length) | 0]; if (q[1] - B.y0 < h) g.fx.add(q[0], q[1], q[2], (Math.random() - 0.5) * 2, 3 + Math.random() * 4, (Math.random() - 0.5) * 2, 2 + Math.random(), 0.14, 0.04, [1, 0.62, 0.25], 1, 'spark', 1 | 32); }
    if (Math.random() < dt * 9 && h > 2) { const q = pts[(Math.random() * pts.length) | 0]; if (q[1] - B.y0 < h) g.fx.add(q[0], q[1] + 2, q[2], (Math.random() - 0.5) * 1.5, 2.5 + Math.random() * 2, (Math.random() - 0.5) * 1.5, 5, 3, 13, [0.18, 0.15, 0.16], 0.4, 'smoke', 4 | 32); }
    if (Math.random() < dt * 2.5) burnsSfx('flame_jet', { vol: 0.5, pitch: 0.6 + Math.random() * 0.4 });
  }
  // the fire tornado
  const tw = t < T.T0 ? 0 : t < T.T0 + 1.4 ? (t - T.T0) / 1.4 : t < T.T1 - 1 ? 1 : Math.max(0, (T.T1 - t));
  if (tw > 0 && B.tornado === 0) { burnsSfx('man_roar', { pitch: 0.55, vol: 0.7 }); if (!B.cine) g.toast('FIRE TORNADO!'); g.missions.event('bbaTornado', P); }
  B.tornado = tw;
  if (tw > 0.05) {
    for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, r = 1 + Math.random() * 2.5, y = B.y0 + Math.random() * 30 * tw * F.s; g.fx.add(B.cx + Math.sin(a) * r, y, B.cz + Math.cos(a) * r, Math.cos(a) * 9, 3 + Math.random() * 5, -Math.sin(a) * 9, 0.9, 0.18, 0.05, [1, 0.7, 0.3], 1, 'spark', 1 | 4); }
    if (Math.random() < dt * 1.2) burnsSfx('wind', { vol: 0.6, pitch: 0.6 }, 'dust');
    g.shake(0.06 * tw);
  }
  // collapse: the falling copies, then the pile
  if (t >= T.COLLAPSE && !B.collapsed) bbaCathCollapse(g, P);
  if (B.collapsed && P.fall) {
    for (const S of P.fall) {
      const u = clamp((t - B.tc - S.delay) / T.FALL, 0, 1), sink = clamp((t - B.tc - S.delay - T.FALL) / 1.2, 0, 1), a = S.ang * u * u;
      bbaPose(P, S.mv, S.px, S.py - (S.drop || 0) * Math.pow(u, 1.5) - sink * 5, S.pz, 0, S.axis === 'pitch' ? a : 0, S.axis === 'roll' ? a : 0);
      if (u >= 1 && !S.landed) { S.landed = true; g.shake(0.5); burnsSfx('man_stomp', { pitch: 0.7 }); const q = F.w(S.px, 0.5, S.pz); g.fx.dust(q[0], q[1], q[2], 24, '#6a5a50'); g.fx.burst(q[0], q[1] + 2, q[2], 'spark', 26, '#ffb040'); }
      if (sink >= 1) S.mv.visible = false;
      if (S.mv.visible && Math.random() < dt * 30) { const q = F.w(S.px, S.py, S.pz); g.fx.fire(q[0] + (Math.random() - 0.5) * 8, q[1] + Math.random() * 6, q[2] + (Math.random() - 0.5) * 8, 2.2); }
    }
    if (P.pile) { const k = clamp((t - B.tc - 0.6) / 2.0, 0, 1); P.pile.visible = k > 0; P.pile.scale = 0.25 + 0.75 * easeInOut(k); }
    if (t - B.tc > 1.0) bbaCathPileFires(g, P);
    if (P.pile && P.pile.visible && Math.random() < dt * 40) { const q = F.w((Math.random() - 0.5) * 9, 0.8 + Math.random() * 1.2, -2 + (Math.random() - 0.5) * 9); g.fx.fire(q[0], q[1], q[2], 1.6 + Math.random()); }
  }
  if (g.frameN !== B.lf) { B.lf = g.frameN; const k = B.phase === 'gather' ? 0 : 1, q = [B.cx, B.y0 + Math.max(4, h * 0.45), B.cz]; if (k) g.pointLight(q[0], q[1], q[2], 46 * F.s, [1, 0.5, 0.18], 2.6 + Math.sin(P.R.t * 11) * 0.3); }
  if (t >= T.END) bbaCathBurnFinish(g, P);
}
function bbaCathBurnDraw(g, Rr, Sp, P) {
  const B = P.cburn, F = P.F, T = BBA_CBURN, t = P.R.t;
  if (B.done || (P.pile && P.pile.visible && B.t - B.tc > 2.2)) {
    // heat shimmer over the glowing pile
    for (let i = 0; i < 8; i++) { const a = i * 0.8, x = B.cx + Math.sin(a) * 2.5 + Math.sin(t * 7 + i) * 0.4, z = B.cz + Math.cos(a) * 2.5, y = B.y0 + 4 + (i % 3); bbaLine(Rr, x, y - 2, z, x + Math.sin(t * 9 + i * 2) * 0.5, y + 3, z, 0.9, Sp.streak, [1, 0.85, 0.6], 0.05, true); }
    Rr.bbs.bb(B.cx, B.y0 + 2, B.cz, 16, 10, Sp.glow, [1, 0.42, 0.12], 0.35 + Math.sin(t * 5) * 0.05, true);
    return;
  }
  const h = B.front * T.TOP * F.s;
  if (!B.collapsed && B.t >= T.IGNITE) {
    // the lattice glows where the fire has reached
    const pts = P.burnPts, col = [1, 0.42, 0.12];
    for (let i = 0; i < pts.length; i += 2) { const q = pts[i], dy = h - (q[1] - B.y0); if (dy < 0) continue; const fl = 0.55 + 0.45 * Math.sin(t * 13 + i * 1.7); Rr.bbs.bb(q[0], q[1], q[2], 1.6 + (dy < 5 ? 1.4 : 0), 1.6 + (dy < 5 ? 1.4 : 0), Sp.glow, col, (dy < 5 ? 0.7 : 0.4) * fl, true); }
    // heat shimmer above the flames
    for (let i = 0; i < 14; i++) { const a = i * 0.45, x = B.cx + Math.sin(a) * 7 + Math.sin(t * 8 + i) * 0.5, z = B.cz + Math.cos(a) * 9, y = B.y0 + h + 2 + (i % 4) * 2; bbaLine(Rr, x, y - 3, z, x + Math.sin(t * 10 + i * 1.3) * 0.7, y + 4, z, 1.1, Sp.streak, [1, 0.85, 0.6], 0.055, true); }
    Rr.bbs.bb(B.cx, B.y0 + h * 0.5, B.cz, 26 + h, 18 + h, Sp.glow, [1, 0.45, 0.14], 0.3, true);
  }
  // fire tornado: three interleaved helices of flame around a bright core
  const tw = B.tornado;
  if (tw > 0.02) {
    const H = 42 * tw * F.s, cx = B.cx + Math.sin(t * 1.3) * 1.2, cz = B.cz + Math.cos(t * 1.1) * 1.2, col = [0, 0, 0];
    for (let j = 0; j < 3; j++) for (let k = 0; k < 30; k++) {
      const f = k / 29, hy = f * H, th = t * 7.5 + f * 9 + j * 2.094, r = (0.8 + f * 3.4) * (1 + 0.2 * Math.sin(t * 3 + f * 6));
      col[0] = 1; col[1] = lerp(0.85, 0.35, f); col[2] = lerp(0.45, 0.08, f);
      Rr.bbs.bb(cx + Math.cos(th) * r, B.y0 + hy, cz + Math.sin(th) * r, 2.6 + f * 2.4, 3.4 + f * 2.6, Sp.flame, col, 0.85 * (1 - f * 0.45) * tw, true, Math.sin(th) * 0.3);
    }
    bbaLine(Rr, cx, B.y0, cz, cx, B.y0 + H, cz, 3.2 * tw, Sp.streak, [1, 0.8, 0.45], 0.7 * tw, true);
    Rr.bbs.bb(cx, B.y0 + H * 0.3, cz, 12 * tw, 20 * tw, Sp.glow, [1, 0.55, 0.2], 0.55 * tw, true);
  }
}
