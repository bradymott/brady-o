/* ============================================================
   BRADY GOES TO BURNING MAN — THEME CAMPS (src/41_burns_camps.js)
   The legendary Black Rock City sound camps, rebuilt at real scale from their real
   layouts (dome counts and sizes, stage types, how the pieces are arranged), dressed
   in OUR OWN decor: no real stage art, logos, artworks or likenesses. Camp names are
   used as place names only. World files drop a camp in while building:

     const camp = BurnsCamps.place(api, g, 'rootSociety', x, z, {
       rotY: 0, scale: 1, night: 'auto', crowd: 1, lod: 'full',
       onEnter(g, camp, area) {}, onExit(g, camp, area) {} });

   Kinds:
     rootSociety       3 geodesic dome stages (90 / 60 / 50 ft), an open-air coliseum stage, the
                       coliseum stage art car (docks flush with the stage front, drives a loop,
                       boardable, drivable), a shade lounge, the 27-tipi village + 30 ft common dome
     playground        a huge main stage (LED wall, truss, line arrays, sub wall, FOH) + a lounge
     opulentTemple     a temple stage: colonnade, golden portal, 18 ft sound towers, 12 ft screens, fire
     campQuestionMark  a giant glowing "?" over a bass stage + a coffee lounge
     disorient         a pink-and-orange neon portal stage in a neon compound
     deepEnd           a daytime pool-party stage: lifeguard-tower booth, pool-tile floor, big shade
     thunderdome       a climbable lattice dome, bungee fighters, spectators on the lattice
     centerCamp        the big shade circle around a café and an open-mic stage
     spaceCowboys      (OG 1997+) a space-western saloon stage + a mutant sound truck
     solSystem         (OG 2004 "Sol Henge") a henge of glowing trilithons under a sun disc

   Every camp is self-contained: a footprint, an entrance, spots, stages (booths for BurnsDJ),
   areas (enter / exit events), lights, lasers, fire, DJs and crowds, and a cheap far-LOD
   silhouette (lod: 'far' | 'auto') for open-world skylines.
   Runtime extensions live here (no engine edits): a per-frame sprite hook (lasers, sparkles,
   flame light), a camera clamp that keeps the camera inside domes, beat-synced point lights,
   art-car autopilot + docking, bungee fighters, and per-camp chunks for LOD swaps.
   Docs: docs/BURNS_CAMPS.md
   ============================================================ */

const BCM_OFF = [1e7, -1e7, 1e7, 1e7 + 1, -1e7 + 1, 1e7 + 1];    // chunk bounds that are never drawn (LOD swap)
const BCM_CROWD = ['burner', 'burner', 'furcoat', 'tutu', 'ledsuit', 'sparklepony'];
const BCM_FT = 0.3048;
const BCM_KINDS = {};    // kind registry (filled by each camp below; exposed as BurnsCamps.kinds)

/* ---------------- camp frame: local (x, y, z) <-> world. Local +Z is the camp's front (street side) ---------------- */
function bcmFrame(x, y0, z, rot, s) {
  const c = Math.cos(rot), sn = Math.sin(rot);
  return {
    x, y0, z, rot, s, c, sn,
    w(lx, ly, lz) { return [x + (lx * c + lz * sn) * s, y0 + (ly || 0) * s, z + (-lx * sn + lz * c) * s]; },
    wx(lx, lz) { return x + (lx * c + lz * sn) * s; },
    wz(lx, lz) { return z + (-lx * sn + lz * c) * s; },
    wy(ly) { return y0 + (ly || 0) * s; },
    dir(lx, lz) { return [lx * c + lz * sn, -lx * sn + lz * c]; },
    l(wx, wz) { const dx = (wx - x) / s, dz = (wz - z) / s; return [dx * c - dz * sn, dx * sn + dz * c]; },
    yaw(ly) { return rot + (ly || 0); }
  };
}

/* ---------------- per-visit runtime (lives on the BurnsWorld) ---------------- */
function bcmRT(W) {
  if (!W._bcm) W._bcm = { camps: [], t: 0, steps: 0, night: 0, items: [], domes: [], kinds: {}, frame: -1, errs: {} };
  return W._bcm;
}
function bcmErr(e) {
  try {
    const k = String(e && e.message || e), S = bcmErr.seen || (bcmErr.seen = {});
    if (S[k]) return; S[k] = true;
    if (typeof Game !== 'undefined' && Game.reportError) Game.reportError(e); else console.error(e);
  } catch (e2) { /* never throw from the error path */ }
}
function bcmEvent(g, name, data) { try { if (g && g.missions && g.missions.event) g.missions.event(name, data); } catch (e) { bcmErr(e); } }

/* ---------------- night factor (0 day .. 1 night) from the world's sky palettes ---------------- */
function bcmPalNight(g) {
  try {
    const key = g.palA + '|' + g.palB + '|' + Math.round((g.tod || 0) * 200);
    if (bcmPalNight.key === key && bcmPalNight.g === g) return bcmPalNight.v;
    const A = BurnsEnv.resolve(g.palA || 'dusk'), B = g.palB ? BurnsEnv.resolve(g.palB) : A, t = g.tod || 0;
    const el = lerp(A.sun[1], B.sun[1], t), v = clamp((8 - el) / 14, 0, 1);
    bcmPalNight.key = key; bcmPalNight.g = g; bcmPalNight.v = v;
    return v;
  } catch (e) { return 0; }
}
function bcmMaxNight(g) {
  try { const A = BurnsEnv.resolve(g.palA || 'dusk'), B = g.palB ? BurnsEnv.resolve(g.palB) : A; return clamp((8 - Math.min(A.sun[1], B.sun[1])) / 14, 0, 1); } catch (e) { return 1; }
}
function bcmNight(g, P) {
  const o = P && P.o;
  if (o && o.night !== undefined && o.night !== 'auto' && o.night !== null) return typeof o.night === 'function' ? (o.night(g) ? 1 : 0) : typeof o.night === 'number' ? clamp(o.night, 0, 1) : (o.night ? 1 : 0);
  const R = g && g.world && g.world._bcm;
  return R && R.steps ? R.night : bcmPalNight(g);
}
// the camp's beat clock: b = beats since start, k = 1 on the beat decaying to 0
function bcmBeat(P, t) { const b = (t + (P.beatPh || 0)) * (P.bpm || 124) / 60; return { b, k: Math.pow(1 - (b - Math.floor(b)), 3), i: Math.floor(b) }; }

/* ---------------- static geometry: every camp gets its own chunks (48 m cells), so it can swap LOD ---------------- */
function bcmNewMesh(P, layer) {
  const m = new BurnsMesh(8192);
  m.geo = function () { const r = BurnsMesh.prototype.geo.call(this); (P.chunks[layer] || (P.chunks[layer] = [])).push(r); return r; };
  return m;
}
function bcmMesh(P, wx, wz) {
  const W = P.api.world, layer = P.layer || 'full';
  if (P.o.ownChunks === false || !(W.cells instanceof Map) || typeof BurnsMesh !== 'function') return undefined;
  const C = W.chunkSize || 48, key = 'bcm:' + P.id + ':' + layer + ':' + Math.floor(wx / C) + ':' + Math.floor(wz / C);
  let e = W.cells.get(key);
  if (!e) { e = { list: [] }; W.cells.set(key, e); }
  let m = e.list[e.list.length - 1];
  if (!m || m.nv > 46000) { m = bcmNewMesh(P, layer); e.list.push(m); }
  return m;
}
// a static part built in camp-local coordinates. fn(m) returns { cols, lights } (camp-local)
function bcmPart(P, lx, lz, fn, o) {
  const F = P.F, wx = F.wx(lx, lz), wz = F.wz(lx, lz);
  const info = P.api.mesh(wx, wz, m => {
    m.push(); m.tf(-lx, 0, -lz);
    const r = fn(m) || {};
    m.pop(); m.lo = false; m.shine(0); m.emissive(0);
    for (const c of r.cols || []) { c.x = (c.x || 0) - lx; c.z = (c.z || 0) - lz; if (P.o.cover !== undefined && c.cover === undefined) c.cover = P.o.cover; }
    for (const L of r.lights || []) { L.x = (L.x || 0) - lx; L.z = (L.z || 0) - lz; }
    return r;
  }, Object.assign({ yaw: F.rot, scale: F.s, y: F.y0, mesh: bcmMesh(P, wx, wz) }, o || {}));
  for (const c of info.wcols || []) P.cols.push(c);
  return info;
}
function bcmShowChunks(list, on) {
  for (const c of list || []) { if (!c._bcmB) c._bcmB = c.bounds; c.bounds = on ? c._bcmB : BCM_OFF; }
}

/* ---------------- small builders: colliders, lights, glows, signs (camp-local) ---------------- */
const bcmC = {
  box(x, z, hx, hz, y0, y1, yaw, ex) { return Object.assign({ t: 'box', x, z, hx, hz, y0, y1, yaw: yaw || 0 }, ex || {}); },
  cyl(x, z, r, y0, y1, ex) { return Object.assign({ t: 'cyl', x, z, r, y0, y1 }, ex || {}); },
  ramp(x, z, hx, hz, ya, yb, yaw, ex) { return Object.assign({ t: 'ramp', x, z, hx, hz, y0: 0, ya, yb, yaw: yaw || 0 }, ex || {}); },
  // a thin wall between two local points (solid, not walkable)
  wall(ax, az, bx, bz, th, y0, y1, ex) { const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz); return Object.assign({ t: 'box', x: (ax + bx) / 2, z: (az + bz) / 2, hx: th / 2, hz: L / 2, y0, y1, yaw: Math.atan2(dx, dz), walk: false }, ex || {}); }
};
function bcmGlow(P, lx, ly, lz, size, col, blink) { P.api.glow(P.F.wx(lx, lz), P.F.wy(ly), P.F.wz(lx, lz), size * P.F.s, col, blink ? { blink } : undefined); }
function bcmPool(P, lx, lz, r, col, i) {
  if (P.o.lights === false || P.maxNight < 0.25) return;
  P.api.light(P.F.wx(lx, lz), P.F.wz(lx, lz), r * P.F.s, col, (i === undefined ? 0.5 : i) * Math.min(1, P.maxNight + 0.2));
}
// a signboard (rounded frame, text both sides) inside a part. Returns its board height
function bcmSignMesh(m, text, style, x, y, z, h, o) {
  o = o || {};
  const reg = BURNS_ATLAS.sign(text, Object.assign({ bg: '#1a1020', fg: '#ffe9b0', size: 44, pad: 22 }, style || {}));
  let w = h * (reg.aspect || 2); if (w > (o.maxW || 9)) { w = o.maxW || 9; h = w / (reg.aspect || 2); }
  const fr = o.frame || '#2a1a24';
  m.push(); m.tf(x, y, z, o.yaw || 0);
  m.color(fr).shine(2); m.roundBox(0, h / 2, -0.06, w + 0.24, h + 0.24, 0.12, 0.05);
  if (o.neon) { m.color(o.neon, 1); for (const sy of [-1, 1]) m.limb(-w / 2 - 0.1, h / 2 + sy * (h / 2 + 0.1), 0.02, w / 2 + 0.1, h / 2 + sy * (h / 2 + 0.1), 0.02, 0.035, 0.035, { seg: 5 }); for (const sx of [-1, 1]) m.limb(sx * (w / 2 + 0.1), -0.02, 0.02, sx * (w / 2 + 0.1), h + 0.02, 0.02, 0.035, 0.035, { seg: 5 }); }
  m.color('#ffffff', o.glow ? 0.85 : 0); m.decal(0, h / 2, 0.005, w, h, reg); m.push(); m.tf(0, 0, -0.125, Math.PI); m.decal(0, h / 2, 0, w, h, reg); m.pop();
  m.emissive(0);
  if (o.posts !== false && y > 0.2) { m.color(o.postCol || '#3a2a24').shine(1); for (const sx of [-0.38, 0.38]) m.limb(sx * w, -y, -0.06, sx * w, 0.02, -0.06, 0.07, 0.06, { seg: 7 }); }
  m.pop(); m.shine(0);
  return w;
}

/* ---------------- runtime hooks: per-frame sprites + camera clamp ---------------- */
function bcmHook(g, R) {
  if (g.fx && !g.fx._bcmHook) {
    const fx = g.fx, orig = fx.draw;
    fx.draw = function (Rr) { try { bcmDraw(g, Rr, R); } catch (e) { bcmErr(e); } return orig.call(fx, Rr); };
    fx._bcmHook = true;
  }
  if (!g._bcmCam && typeof g.updateCamera === 'function') {
    const orig = g.updateCamera;
    g.updateCamera = function (fdt) { orig.call(this, fdt); try { bcmCamera(this, fdt); } catch (e) { bcmErr(e); } };
    g._bcmCam = true;
  }
}
// keep the camera inside a dome while Brady is inside it (the fabric shell would block the view)
function bcmCamera(g) {
  const R = g.world && g.world._bcm;
  if (!R || !R.domes.length || g.cine || g.state !== 'play') return;
  if (g.firstPerson && g.firstPerson()) return;
  const p = g.player, cam = g.cam; if (!p || !cam) return;
  for (const D of R.domes) {
    const dx = p.x - D.x, dz = p.z - D.z;
    if (dx * dx + dz * dz > (D.r - 0.1) * (D.r - 0.1) || p.y > D.y0 + D.r * 0.75 || p.y < D.y0 - 1) continue;
    const hx = p.x, hy = p.y + 1.45, hz = p.z, ex = cam.x - hx, ey = cam.y - hy, ez = cam.z - hz;
    const ox = hx - D.x, oy = hy - D.y0, oz = hz - D.z, hd = Math.sqrt(ox * ox + oy * oy + oz * oz);
    // the clamp sphere always contains Brady's head (even hugging the wall) and stays inside the shell
    const rr = Math.max(1, D.r - 0.75, Math.min(D.r - 0.2, hd + 0.2));
    const a = ex * ex + ey * ey + ez * ez, b = 2 * (ox * ex + oy * ey + oz * ez), c = hd * hd - rr * rr;
    if (a < 1e-6 || c >= 0) return;
    const t = (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a);
    if (t < 1) { cam.x = hx + ex * t; cam.y = Math.max(D.y0 + 0.5, hy + ey * t); cam.z = hz + ez * t; }
    return;
  }
}
function bcmDraw(g, Rr, R) {
  if (!g.world || g.world._bcm !== R || !g.cam) return;
  const S = BURNS_SPRITES.R, cam = g.cam, once = R.frame !== g.frameN; R.frame = g.frameN;
  if (once) R.night = bcmPalNight(g);   // cached by palette + tod: the show reacts the same frame the sky changes
  let nl = 0;
  for (const P of R.camps) {
    const dx = P.x - cam.x, dz = P.z - cam.z, d2 = dx * dx + dz * dz;
    if (d2 > (P.radius + 240) * (P.radius + 240)) continue;
    const nk = bcmNight(g, P), bt = bcmBeat(P, R.t);
    if (nk > 0.3 && P.lasers.length && d2 < (P.radius + 200) * (P.radius + 200)) bcmLasers(g, Rr, S, P, nk, bt);
    if (P.draw) P.draw(g, Rr, S, nk, bt, d2);
    if (nk > 0.3 && P.balls.length && S.glow) bcmSparkles(g, Rr, S, P, nk, bt);
    // point lights: the camp's stage washes, pulsing on the beat (night only), once per frame
    if (once && nk > 0.15 && d2 < (P.radius + 70) * (P.radius + 70)) {
      for (const L of P.plights) {
        if (nl > 10) break;
        const ldx = L.x - cam.x, ldz = L.z - cam.z; if (ldx * ldx + ldz * ldz > 75 * 75) continue;
        const ci = L.cols.length > 1 ? Math.floor(bt.b / (L.every || 8) + (L.ph || 0)) % L.cols.length : 0, col = L.cols[ci];
        g.pointLight(L.x, L.y, L.z, L.r, col, (L.i || 1.4) * nk * (L.pulse === false ? 1 : 0.55 + 0.45 * bt.k)); nl++;
      }
      for (const B of P.bursts) if (B.t < B.dur && nl < 14) { g.pointLight(B.x, B.y + 2, B.z, B.big ? 16 : 11, [1, 0.5, 0.16], 2.2 * (1 - B.t / B.dur)); nl++; }
    }
  }
}
// mirror-ball sparkles: little dots of light wheeling around the inside of a dome
function bcmSparkles(g, Rr, S, P, nk, bt) {
  const t = P.R.t, cam = g.cam, reg = S.dot || S.glow;
  for (const Bl of P.balls) {
    const dx = Bl.x - cam.x, dz = Bl.z - cam.z; if (dx * dx + dz * dz > 70 * 70) continue;
    for (let i = 0; i < 26; i++) {
      const a = i * 2.39996 + t * 0.35, el = 0.12 + (i % 7) / 7 * 0.9, ce = Math.cos(el);
      const x = Bl.x + Math.sin(a) * ce * Bl.r, y = P.F.y0 + Math.max(0.3, Math.sin(el) * Bl.r * 0.92), z = Bl.z + Math.cos(a) * ce * Bl.r;
      const tw = 0.5 + 0.5 * Math.sin(t * 5 + i * 1.7);
      Rr.bbs.bb(x, y, z, 0.55, 0.55, S.glow, i % 3 ? [1, 1, 1] : Bl.col, (0.5 + 0.5 * tw) * nk * (0.6 + 0.4 * bt.k), true);
    }
  }
}
// laser rigs: { x, y, z, yaw, n, spread, cols: [[r,g,b]...], rate, len, tilt, ph, fan }
// a laser beam: a bright core line + a soft haze sleeve. Camera-facing quads sit in the plane of their midpoint
// depth, so each segment's ends are projected onto that plane first: consecutive segments join exactly on screen
// even when the beam runs toward the camera. The width grows with depth (a beam stays 3-6 px wide on a phone).
function bcmBeam(Rr, S, x0, y0, z0, x1, y1, z1, w, col, a, segs) {
  const B = Rr.B; if (!B || !S.streak || B.fx === undefined) return;
  const reg = bcmBeam.reg || (bcmBeam.reg = { u0: lerp(S.streak.u0, S.streak.u1, 0.44), u1: lerp(S.streak.u0, S.streak.u1, 0.56), v0: S.streak.v0, v1: S.streak.v1 });
  const ex = B.ex, ey = B.ey, ez = B.ez, fx = B.fx, fy = B.fy, fz = B.fz, NEAR = 0.8;
  let d0 = (x0 - ex) * fx + (y0 - ey) * fy + (z0 - ez) * fz, d1 = (x1 - ex) * fx + (y1 - ey) * fy + (z1 - ez) * fz;
  if (d0 < NEAR && d1 < NEAR) return;
  if (d0 < NEAR) { const t = (NEAR - d0) / (d1 - d0); x0 = lerp(x0, x1, t); y0 = lerp(y0, y1, t); z0 = lerp(z0, z1, t); d0 = NEAR; }
  else if (d1 < NEAR) { const t = (NEAR - d1) / (d0 - d1); x1 = lerp(x1, x0, t); y1 = lerp(y1, y0, t); z1 = lerp(z1, z0, t); d1 = NEAR; }
  const n = segs || 3;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, da = lerp(d0, d1, t0), db = lerp(d0, d1, t1), dm = (da + db) / 2, ka = dm / da, kb = dm / db;
    const ax = ex + (lerp(x0, x1, t0) - ex) * ka, ay = ey + (lerp(y0, y1, t0) - ey) * ka, az = ez + (lerp(z0, z1, t0) - ez) * ka;
    const bx = ex + (lerp(x0, x1, t1) - ex) * kb, by = ey + (lerp(y0, y1, t1) - ey) * kb, bz = ez + (lerp(z0, z1, t1) - ez) * kb;
    const hx = (bx - ax) / 2, hy = (by - ay) / 2, hz = (bz - az) / 2, px = hx * B.rx + hy * B.ry + hz * B.rz, py = hx * B.ux + hy * B.uy + hz * B.uz, l = Math.hypot(px, py) || 1e-4;
    const ww = Math.max(w, dm * 0.0068);
    Rr.bbs.quad((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, px, py, -py / l * ww / 2, px / l * ww / 2, reg, col[0] * a, col[1] * a, col[2] * a, 0);
    Rr.bbs.quad((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, px, py, -py / l * ww * 3, px / l * ww * 3, reg, col[0] * a * 0.13, col[1] * a * 0.13, col[2] * a * 0.13, 0);
  }
}
function bcmLasers(g, Rr, S, P, nk, bt) {
  const t = P.R.t, cam = g.cam;
  for (const L of P.lasers) {
    const dx = L.x - cam.x, dz = L.z - cam.z, near = dx * dx + dz * dz < 80 * 80;
    const n = near ? L.n : Math.ceil(L.n / 2), ph = L.ph || 0, sweep = Math.sin(t * (L.rate || 0.7) + ph);
    const col = L.cols[((Math.floor(bt.b / 16 + ph) % L.cols.length) + L.cols.length) % L.cols.length];
    const a = (0.75 + 0.35 * bt.k) * nk;
    if (S.glow) Rr.bbs.bb(L.x, L.y, L.z, 0.9, 0.9, S.glow, col, 0.9 * nk, true);
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0 : i / (n - 1) - 0.5, ang = L.yaw + u * (L.spread || 1) + sweep * (L.sw === undefined ? 0.45 : L.sw);
      const el = (L.tilt || 0.15) + Math.sin(t * 0.9 + i * 1.3 + ph) * (L.wob === undefined ? 0.1 : L.wob), len = L.len || 60;
      bcmBeam(Rr, S, L.x, L.y, L.z, L.x + Math.sin(ang) * len * Math.cos(el), L.y + Math.sin(el) * len, L.z + Math.cos(ang) * len * Math.cos(el), 0.08, col, a, near ? 4 : 2);
    }
  }
}

/* ---------------- the per-step update (registered once per visit) ---------------- */
function bcmUpdate(g, wdt, R) {
  if (!g.player || g.world._bcm !== R) return;
  try {
    R.t += wdt; R.steps++;
    if (R.steps % 12 === 1) {
      R.night = bcmPalNight(g);
      bcmHook(g, R);
      if (!g.interactables) g.interactables = [];
      for (const it of R.items) if (g.interactables.indexOf(it) < 0) g.interactables.push(it);
      bcmLOD(g, R);
    }
    if (!R.started) { R.started = true; for (const P of R.camps) if (P.start) try { P.start(g); } catch (e) { bcmErr(e); } }
    for (const P of R.camps) { for (const V of P.vehicles) bcmVehicleStep(g, V, wdt); if (P.update) P.update(g, wdt); }
    if (R.steps % 6 === 0) bcmAreas(g, R);
    bcmFlames(g, R, wdt);
  } catch (e) { bcmErr(e); }
}
// LOD: 'auto' camps show their full chunks near the camera and the silhouette far away
function bcmLOD(g, R) {
  const cam = g.cam || g.player;
  for (const P of R.camps) {
    if (P.lod !== 'auto' || !cam) continue;
    const d = Math.hypot(P.x - cam.x, P.z - cam.z), near = P.lodNear * P.F.s + P.radius * 0.35;
    const want = P.near ? d < near + 12 : d < near;
    if (want === P.near && P.lodInit) continue;
    P.near = want; P.lodInit = true;
    bcmShowChunks(P.chunks.full, want); bcmShowChunks(P.chunks.far, !want);
  }
}
// areas: enter / exit events (camp footprint + named venues)
function bcmAreaHit(A, x, z, y) {
  if (y < A.y0 - 0.5 || y > A.y1) return false;
  if (A.r) { const dx = x - A.x, dz = z - A.z; return dx * dx + dz * dz <= A.r * A.r; }
  const dx = x - A.x, dz = z - A.z, c = Math.cos(A.yaw), s = Math.sin(A.yaw), lx = dx * c - dz * s, lz = dx * s + dz * c;
  return Math.abs(lx) <= A.hx && Math.abs(lz) <= A.hz;
}
function bcmAreas(g, R) {
  const p = g.player; if (!p) return;
  for (const P of R.camps) {
    const dx = p.x - P.x, dz = p.z - P.z, far = dx * dx + dz * dz > (P.radius + 25) * (P.radius + 25);
    let inCamp = false, area = null;
    if (!far) {
      inCamp = bcmAreaHit(P.footA, p.x, p.z, p.y);
      for (const A of P.areas) if (bcmAreaHit(A, p.x, p.z, p.y)) { area = A; break; }
    }
    if (inCamp !== P.inCamp) {
      P.inCamp = inCamp;
      const A = { id: 'camp', name: P.name, camp: P };
      if (inCamp) {
        bcmEvent(g, 'bcmEnter', { camp: P, area: A });
        if (!P.arrived) {
          P.arrived = true; bcmEvent(g, 'bcmArrive', P); if (P.o.onArrive) P.o.onArrive(g, P);
          if (P.o.mission && g.missions) { const m = g.missions.get(P.o.mission); if (m && m.state !== 'done' && m.state !== 'locked') { if (m.state === 'available') g.missions.start(P.o.mission, true); g.missions.complete(P.o.mission, { x: p.x, y: p.y + 1.2, z: p.z }); } }
        }
        if (P.o.onEnter) P.o.onEnter(g, P, A);
      } else { bcmEvent(g, 'bcmExit', { camp: P, area: A }); if (P.o.onExit) P.o.onExit(g, P, A); }
    }
    if (area !== P.area) {
      const old = P.area; P.area = area;
      if (old) { bcmEvent(g, 'bcmExit', { camp: P, area: old }); if (P.o.onExit) P.o.onExit(g, P, old); }
      if (area) { bcmEvent(g, 'bcmEnter', { camp: P, area }); if (P.o.onEnter) P.o.onEnter(g, P, area); if (area.onEnter) area.onEnter(g, P, area); }
    }
  }
}
function bcmVehPt(B) { const c = B.veh.car, cc = Math.cos(c.yaw), s = Math.sin(c.yaw), L = B.at; B.x = c.x + L[0] * cc + L[2] * s; B.y = c.y + L[1]; B.z = c.z - L[0] * s + L[2] * cc; }
// flame effects: beat-synced bursts (decorative, never hurt), at night (or always with fire: 'always')
function bcmFlames(g, R, wdt) {
  const p = g.player;
  for (const P of R.camps) {
    if ((!P.flames.length && !P.co2.length) || P.o.fire === false) continue;
    const dx = p.x - P.x, dz = p.z - P.z; if (dx * dx + dz * dz > (P.radius + 110) * (P.radius + 110)) continue;
    const nk = bcmNight(g, P), on = P.o.fire === 'always' || nk > 0.35;
    const bt = bcmBeat(P, R.t);
    // CO2 jets: a white blast on the drop (every 32 beats)
    if (P.co2.length && on) {
      if (bt.i !== P.lastCO2 && bt.i % 32 === 16) { P.lastCO2 = bt.i; P.co2T = 1.3; if (Math.hypot(p.x - P.x, p.z - P.z) < 50) burnsSfx('steam', { vol: 0.4 }); }
      if (P.co2T > 0) { P.co2T -= wdt; for (const q of P.co2) if (Math.random() < 0.55) g.fx.add(q[0] + (Math.random() - 0.5) * 0.3, q[1], q[2] + (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.8, 9 + Math.random() * 4, (Math.random() - 0.5) * 0.8, 1.1, 0.35, 2.6, [0.92, 0.95, 1], 0.5, 'smoke', 4); }
    }
    if (on && bt.i !== P.lastBeat) {
      P.lastBeat = bt.i;
      for (const Fm of P.flames) {
        const cyc = Fm.every || 8;
        if (((bt.i + (Fm.ph || 0)) % cyc + cyc) % cyc !== 0) continue;
        if (Fm.chance !== undefined && Math.random() > Fm.chance) continue;
        const B = { x: Fm.x, y: Fm.y, z: Fm.z, t: 0, dur: Fm.dur || 0.5, h: Fm.h || 5, big: !!Fm.big, veh: Fm.veh, at: Fm.at };
        if (B.veh) bcmVehPt(B);
        P.bursts.push(B);
        const fd = Math.hypot(p.x - B.x, p.z - B.z);
        if (fd < 40 && Math.random() < 0.7) burnsSfx('flame_jet', { vol: clamp(0.65 - fd / 60, 0.08, 0.6), pitch: Fm.big ? 0.8 : 1 });
      }
    }
    for (let i = P.bursts.length - 1; i >= 0; i--) {
      const B = P.bursts[i]; B.t += wdt; if (B.veh) bcmVehPt(B);
      if (B.t >= B.dur + 0.4) { P.bursts.splice(i, 1); continue; }
      if (B.t < B.dur && Math.random() < 0.85) {
        const v = B.h * 2.1;
        g.fx.add(B.x + (Math.random() - 0.5) * 0.3, B.y + 0.2, B.z + (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 1.2, v * (0.8 + Math.random() * 0.4), (Math.random() - 0.5) * 1.2, 0.5 + Math.random() * 0.2, B.big ? 2.1 : 1.4, B.big ? 0.9 : 0.55, [1, 0.5 + Math.random() * 0.3, 0.14], 1, 'flame', 1, (Math.random() - 0.5) * 0.6, 0);
        if (Math.random() < 0.2) g.fx.add(B.x, B.y + B.h * 0.7, B.z, (Math.random() - 0.5) * 2, 2 + Math.random() * 3, (Math.random() - 0.5) * 2, 1, 0.1, 0.04, [1, 0.75, 0.35], 1, 'spark', 1 | 4);
      }
    }
  }
}

/* ---------------- people: dancers, DJs, spectators (type + seed looks are shared, like api.crowd) ---------------- */
function bcmCrowd(P, lx, lz, r, n, o) {
  o = o || {};
  n = Math.round(n * P.crowdK); if (n <= 0) return [];
  const rng = mulberry32(hashStr(P.id + ':crowd:' + Math.round(lx * 10) + ',' + Math.round(lz * 10))), F = P.F, out = [], types = o.types || BCM_CROWD;
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + rng() * 0.6, d = (o.r0 || 0) + Math.sqrt((i + 0.5) / n) * (r - (o.r0 || 0));
    let x = lx + Math.sin(a) * d, z = lz + Math.cos(a) * d;
    if (o.sx) x = lx + (x - lx) * o.sx;
    const yaw = o.face ? Math.atan2(o.face[0] - x, o.face[1] - z) + (rng() - 0.5) * 0.5 : rng() * TAU;
    const def = Object.assign({ type: rng.pick(types), seed: Math.floor(rng() * 24), x: F.wx(x, z), z: F.wz(x, z), yaw: F.rot + yaw, behavior: o.behavior || 'dance', style: Math.floor(rng() * 6), bpm: P.bpm, ambient: true }, o.extra || {});
    if (o.y !== undefined) def.y = F.wy(o.y);
    if (o.lines) def.lines = o.lines;
    if (o.chat) def.chat = o.chat;
    out.push(P.api.npc(def));
  }
  P.actors.push(...out);
  return out;
}
// a DJ at a booth: idle + 'dj' animation, facing the crowd
function bcmDJ(P, st, o) {
  if (P.o.djs === false) return null;
  o = o || {};
  const b = st.booth, def = Object.assign({ id: o.id, name: o.name || 'DJ', type: o.type || 'burner', seed: o.seed === undefined ? 7 : o.seed, x: b.x + Math.sin(b.yaw) * 0.55, z: b.z + Math.cos(b.yaw) * 0.55, y: b.y, fixedY: true, collide: false, yaw: b.yaw, behavior: 'idle', anim: 'dj', lookAt: false, noDJ: true, chatter: false, lines: o.lines || ['Can\'t talk. Mixing.', 'This next one goes out to the dust.'] }, o.extra || {});
  if (o.spec) { def.spec = o.spec; delete def.type; }
  // with djPrompt on, talking to the stage's DJ hands Brady the decks (a line, then the set opens)
  if (P.o.djPrompt) def.talk = (g, a) => g.say(a, [def.lines[0], o.handover || 'Want the decks? They\'re yours. Make the dust dance.'], () => BurnsCamps.djSet(g, P, st.id, typeof P.o.djPrompt === 'object' ? P.o.djPrompt : {}));
  const a = P.api.npc(def); st.dj = a; P.actors.push(a);
  return a;
}
// a stage: where Brady stands to DJ (booth), the dance floor (floor) and the music
function bcmStage(P, id, name, lx, ly, lz, lyaw, floor, o) {
  const F = P.F;
  const st = Object.assign({ id, name, camp: P, booth: { x: F.wx(lx, lz), y: F.wy(ly), z: F.wz(lx, lz), yaw: F.rot + lyaw }, floor: floor ? { x: F.wx(floor[0], floor[1]), z: F.wz(floor[0], floor[1]), r: floor[2] * F.s } : null, bpm: P.bpm, genre: 'house' }, o || {});
  P.stages.push(st);
  return st;
}
function bcmSpot(P, name, lx, ly, lz, lyaw) { const q = P.F.w(lx, ly, lz); P.spots[name] = { x: q[0], y: q[1], z: q[2], yaw: P.F.rot + (lyaw || 0) }; return P.spots[name]; }
function bcmArea(P, id, name, lx, lz, shape, o) {
  const F = P.F, A = Object.assign({ id, name, camp: P, x: F.wx(lx, lz), z: F.wz(lx, lz), y0: F.y0 - 1, y1: F.y0 + 40 }, o || {});
  if (shape.r) A.r = shape.r * F.s; else { A.hx = shape.hx * F.s; A.hz = shape.hz * F.s; A.yaw = F.rot + (shape.yaw || 0); }
  P.areas.push(A);
  return A;
}
// a lit dome registers here so the camera stays inside it when Brady is in it
function bcmDomeCam(P, lx, lz, r) { P.R.domes.push({ x: P.F.wx(lx, lz), z: P.F.wz(lx, lz), y0: P.F.y0, r: r * P.F.s, camp: P }); }
function bcmLaser(P, lx, ly, lz, lyaw, o) { const q = P.F.w(lx, ly, lz); P.lasers.push(Object.assign({ x: q[0], y: q[1], z: q[2], yaw: P.F.rot + lyaw, n: 5, spread: 1.4, cols: [[1, 0.2, 0.8], [0.2, 0.95, 1]], rate: 0.7, len: 55, tilt: 0.12, ph: P.lasers.length * 1.7 }, o || {})); }
function bcmPL(P, lx, ly, lz, r, cols, o) { const q = P.F.w(lx, ly, lz); P.plights.push(Object.assign({ x: q[0], y: q[1], z: q[2], r: r * P.F.s, cols: cols.map(c => typeof c === 'string' ? burnsRGBf(c) : c), i: 1.4 }, o || {})); }
function bcmFlame(P, lx, ly, lz, o) { const q = P.F.w(lx, ly, lz); P.flames.push(Object.assign({ x: q[0], y: q[1], z: q[2], every: 8, ph: 0, h: 5 }, o || {})); }
// api.npc() returns the actor's definition; this finds the live actor for it (cached)
function bcmActorOf(g, def) {
  if (!def || !g || !g.actors) return null;
  if (def._bcmA && !def._bcmA.removed && g.actors.indexOf(def._bcmA) >= 0) return def._bcmA;
  const a = g.actors.find(x => x.def === def) || null; def._bcmA = a; return a;
}
function bcmItem(P, it) { it._bcm = P; P.R.items.push(it); return it; }

/* ======================= geometry kit (all in the current mesh transform) ======================= */
const bcmV = {
  norm(x, y, z) { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; },
  cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; },
  dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
};
function bcmRGB(c) { return typeof c === 'string' ? burnsRGB(c) : c; }
function bcmMul(c, k) { const v = bcmRGB(c); return [clamp(Math.round(v[0] * k), 0, 255), clamp(Math.round(v[1] * k), 0, 255), clamp(Math.round(v[2] * k), 0, 255)]; }
// a fan of triangles with per-vertex colours: corners (n points) around a centre. Normals per vertex (local).
// The winding is chosen so the faces look along the given normals (no culling surprises).
function bcmFan(m, pts, ctr, nrm, nctr, col, colC, e, eC) {
  const base = m.nv, tp = [0, 0, 0], tn = [0, 0, 0], wr = BURNS_ATLAS.white, u = (wr.u0 + wr.u1) / 2, v = (wr.v0 + wr.v1) / 2;
  const c0 = m.c, e0 = m.e, n = pts.length;
  for (let k = 0; k <= n; k++) {
    const P = k < n ? pts[k] : ctr, N = k < n ? (nrm[k] || nrm) : nctr;
    m.tp(P[0], P[1], P[2], tp); m.tn(N[0], N[1], N[2], tn);
    m.c = k < n ? col : colC; m.e = k < n ? e : eC;
    m.vert(tp[0], tp[1], tp[2], tn[0], tn[1], tn[2], u, v);
  }
  m.c = c0; m.e = e0;
  const f = m.f, i8 = m.i8, C = base + n;
  for (let k = 0; k < n; k++) {
    const a = base + k, b = base + (k + 1) % n;
    const ux = f[b * 6] - f[a * 6], uy = f[b * 6 + 1] - f[a * 6 + 1], uz = f[b * 6 + 2] - f[a * 6 + 2];
    const vx = f[C * 6] - f[a * 6], vy = f[C * 6 + 1] - f[a * 6 + 1], vz = f[C * 6 + 2] - f[a * 6 + 2];
    const s = (uy * vz - uz * vy) * i8[a * 24 + 12] + (uz * vx - ux * vz) * i8[a * 24 + 13] + (ux * vy - uy * vx) * i8[a * 24 + 14];
    if (s >= 0) m.ind.push(a, b, C); else m.ind.push(a, C, b);
  }
}
// smooth tube through pts [[x,y,z]...] (parallel-transport frames). r: number | fn(t). o: { seg, colFn(t), eFn(t), caps }
function bcmTube(m, pts, r, o) {
  o = o || {};
  const n = pts.length; if (n < 2) return;
  const seg = o.seg || m.segs(10, 6), T = [], N = [], B = [];
  for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; T.push(bcmV.norm(b[0] - a[0], b[1] - a[1], b[2] - a[2])); }
  let nn = bcmV.cross(Math.abs(T[0][1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], T[0]); nn = bcmV.norm(nn[0], nn[1], nn[2]);
  for (let i = 0; i < n; i++) {
    if (i > 0) { const d = bcmV.dot(nn, T[i]); nn = bcmV.norm(nn[0] - T[i][0] * d, nn[1] - T[i][1] * d, nn[2] - T[i][2] * d); }
    N.push(nn); B.push(bcmV.cross(T[i], nn));
  }
  const rad = typeof r === 'function' ? r : () => r;
  m.grid(seg, n, true, (i, j, out) => {
    const a = i / seg * TAU, ca = Math.cos(a), sa = Math.sin(a), t = j / (n - 1), rr = rad(t);
    const dx = N[j][0] * ca + B[j][0] * sa, dy = N[j][1] * ca + B[j][1] * sa, dz = N[j][2] * ca + B[j][2] * sa;
    out.p[0] = pts[j][0] + dx * rr; out.p[1] = pts[j][1] + dy * rr; out.p[2] = pts[j][2] + dz * rr;
    out.n[0] = dx; out.n[1] = dy; out.n[2] = dz;
    if (o.colFn) { const c = o.colFn(t); if (c) out.col = bcmRGB(c); }
    if (o.eFn) out.e = o.eFn(t);
  });
  if (o.caps !== false) {
    const c0 = m.c, e0 = m.e;
    for (const j of [0, n - 1]) { const t = j / (n - 1); if (o.colFn) m.c = bcmRGB(o.colFn(t)); if (o.eFn) m.e = o.eFn(t); m.ball(pts[j][0], pts[j][1], pts[j][2], rad(t) * 0.98, { seg: Math.max(6, seg), rings: 4 }); }
    m.c = c0; m.e = e0;
  }
}
// points along a circular arc in the XY plane (z fixed), angles a0..a1 (0 = +X), for arches
function bcmArcPts(cx, cy, z, R, a0, a1, n) { const out = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); out.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R, z]); } return out; }

/* ---- geodesic hemisphere: icosahedron with a vertex on top, class-I subdivision. Even frequencies have an exact
   flat equator, so the dome sits on a clean ring of struts. Cached unit geometry. ---- */
function bcmGeodesic(freq) {
  const C = bcmGeodesic.cache || (bcmGeodesic.cache = {});
  if (C[freq]) return C[freq];
  const yr = 1 / Math.sqrt(5), rr = 2 / Math.sqrt(5), I = [[0, 1, 0]];
  for (let i = 0; i < 5; i++) { const a = i * TAU / 5; I.push([rr * Math.sin(a), yr, rr * Math.cos(a)]); }
  for (let i = 0; i < 5; i++) { const a = (i + 0.5) * TAU / 5; I.push([rr * Math.sin(a), -yr, rr * Math.cos(a)]); }
  I.push([0, -1, 0]);
  const FC = [];
  for (let i = 0; i < 5; i++) { const j = (i + 1) % 5; FC.push([0, 1 + i, 1 + j], [1 + i, 6 + i, 1 + j], [1 + j, 6 + i, 6 + j], [11, 6 + j, 6 + i]); }
  const V = [], key = {}, T = [];
  const vid = p => { const l = Math.hypot(p[0], p[1], p[2]), q = [p[0] / l, p[1] / l, p[2] / l]; if (Math.abs(q[1]) < 1e-9) q[1] = 0; const k = q.map(x => Math.round(x * 1e5)).join(','); if (key[k] === undefined) { key[k] = V.length; V.push(q); } return key[k]; };
  const n = freq;
  for (const f of FC) {
    const A = I[f[0]], B = I[f[1]], Cc = I[f[2]], P = (i, j) => { const a = (n - i - j) / n, b = i / n, c = j / n; return vid([A[0] * a + B[0] * b + Cc[0] * c, A[1] * a + B[1] * b + Cc[1] * c, A[2] * a + B[2] * b + Cc[2] * c]); };
    for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) {
      T.push([P(i, j), P(i + 1, j), P(i, j + 1)]);
      if (i + j < n - 1) T.push([P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)]);
    }
  }
  const tris = T.filter(t => t.every(i => V[i][1] >= -1e-7));
  const E = new Map();
  for (const t of tris) for (let k = 0; k < 3; k++) { const a = t[k], b = t[(k + 1) % 3], kk = a < b ? a + '_' + b : b + '_' + a; if (!E.has(kk)) E.set(kk, [a, b]); }
  const used = new Set(); for (const t of tris) for (const i of t) used.add(i);
  const base = Array.from(used).filter(i => Math.abs(V[i][1]) < 1e-6).sort((a, b) => Math.atan2(V[a][0], V[a][2]) - Math.atan2(V[b][0], V[b][2]));
  return (C[freq] = { v: V, t: tris, e: Array.from(E.values()), hubs: Array.from(used), base });
}
// angle helpers for doors: is the unit-sphere point p inside a door (yaw, half-angle, max height y)?
function bcmInDoor(p, doors, r, pad) {
  for (const D of doors) {
    const a = Math.atan2(p[0], p[2]), d = Math.abs(BurnsM.wrap(a - D.yaw)), hw = (D.w / 2 + (pad || 0)) / r;
    if (d < hw && p[1] * r < D.h + (pad || 0) * 0.5) return true;
  }
  return false;
}
/* A real geodesic dome at the local origin: round struts + hubs, fabric panels inset between the struts (outer
   fabric and an inner lining), LED rings on the horizontal struts, doorways cut into the frame with a portal.
   o: { r, freq, fabric, alt, lining, frame, rad, led: [cols] | null, ledE, cover(c) -> bool (c = panel centroid,
        unit), doors: [{ yaw, w, h, col }], glowLining: 0..1, wallH }
   Returns { cols } (base-ring walls with door gaps; colliders in this local space) */
function bcmDome(m, o) {
  const r = o.r, G = bcmGeodesic(o.freq || 4), V = G.v, doors = o.doors || [];
  const rad = o.rad || Math.max(0.045, r * 0.0075), cols = [];
  const P = i => [V[i][0] * r, V[i][1] * r, V[i][2] * r];
  const fab = bcmRGB(o.fabric || '#ece4d4'), alt = bcmRGB(o.alt || '#dfd5c2'), lin = bcmRGB(o.lining || '#2a2238');
  const cover = o.cover || (() => true);
  // panels
  if (o.panels !== false) {
    let k = 0;
    for (const t of G.t) {
      const A = V[t[0]], B = V[t[1]], Cc = V[t[2]], c = [(A[0] + B[0] + Cc[0]) / 3, (A[1] + B[1] + Cc[1]) / 3, (A[2] + B[2] + Cc[2]) / 3];
      k++;
      if (bcmInDoor(c, doors, r, 0.4) || !cover(c, k)) continue;
      const ins = 0.07, sh = q => { const x = q[0] + (c[0] - q[0]) * ins, y = q[1] + (c[1] - q[1]) * ins, z = q[2] + (c[2] - q[2]) * ins; return [x * r * 0.992, Math.max(0.02, y * r * 0.992), z * r * 0.992]; };
      const pts = [sh(A), sh(B), sh(Cc)], nrm = [bcmV.norm(A[0], A[1], A[2]), bcmV.norm(B[0], B[1], B[2]), bcmV.norm(Cc[0], Cc[1], Cc[2])];
      const cl = Math.hypot(c[0], c[1], c[2]), cn = [c[0] / cl, c[1] / cl, c[2] / cl], ctr = [cn[0] * r * 0.985, Math.max(0.03, cn[1] * r * 0.985), cn[2] * r * 0.985];
      const base = k % 3 === 0 ? alt : fab;
      bcmFan(m, pts, ctr, nrm, cn, bcmMul(base, 0.84), bcmMul(base, 1.05), 0, 0);
      if (!m.lo) {
        const ge = o.glowLining ? o.glowLining(c, k) : 0, lc = ge > 0 && o.liningGlow ? bcmRGB(o.liningGlow(c, k)) : lin;
        bcmFan(m, pts, ctr, nrm.map(q => [-q[0], -q[1], -q[2]]), [-cn[0], -cn[1], -cn[2]], bcmMul(lc, 0.75), lc, ge * 0.6, ge);
      }
    }
  }
  // frame: struts (open tubes) + hubs; horizontal struts carry LED strips
  const fc = o.frame || '#c9ccd4', led = o.led || null;
  m.shine(2);
  let ring = 0; const ringOf = {};
  for (const [a, b] of G.e) {
    const pa = V[a], pb = V[b];
    if (doors.length) { let cut = false; for (const s of [0.2, 0.5, 0.8]) { const q = [lerp(pa[0], pb[0], s), lerp(pa[1], pb[1], s), lerp(pa[2], pb[2], s)]; if (bcmInDoor(q, doors, r, 0.15)) { cut = true; break; } } if (cut) continue; }
    const A = P(a), B = P(b), horiz = Math.abs(pa[1] - pb[1]) < 0.012;
    if (led && horiz && (pa[1] < 0.01 || (o.ledRings !== false))) {
      const ky = Math.round(pa[1] * 50); if (ringOf[ky] === undefined) ringOf[ky] = ring++;
      m.color(led[ringOf[ky] % led.length], o.ledE === undefined ? 0.9 : o.ledE); m.limb(A[0], A[1], A[2], B[0], B[1], B[2], rad * 1.15, rad * 1.15, { seg: m.lo ? 4 : 6, ends: false });
    } else { m.color(fc, 0); m.limb(A[0], A[1], A[2], B[0], B[1], B[2], rad, rad, { seg: m.lo ? 4 : 6, ends: false }); }
  }
  m.emissive(0); m.color(o.hub || '#9aa0aa');
  if (!m.lo) for (const i of G.hubs) { const q = P(i); if (doors.length && bcmInDoor(V[i], doors, r, 0.1)) continue; m.ball(q[0], q[1], q[2], rad * 1.75, { seg: 6, rings: 4 }); }
  m.shine(0);
  // door portals: posts + a rounded arch with an LED strip, a threshold plate
  for (const D of doors) {
    const s = Math.sin(D.yaw), c = Math.cos(D.yaw), rr = Math.sqrt(Math.max(1, r * r - D.h * D.h * 0.6)), hw = D.w / 2;
    m.push(); m.tf(s * (rr - 0.1), 0, c * (rr - 0.1), D.yaw);
    m.color(D.col || '#3a3440').shine(2);
    m.roundBox(-hw - 0.18, D.h / 2, 0, 0.36, D.h, 0.5, 0.08); m.roundBox(hw + 0.18, D.h / 2, 0, 0.36, D.h, 0.5, 0.08);
    bcmTube(m, bcmArcPts(0, D.h - 0.2, 0, hw + 0.18, 0, Math.PI, 12), 0.2, { seg: 8 });
    if (D.led) { m.color(D.led, 1); bcmTube(m, bcmArcPts(0, D.h - 0.2, 0.26, hw + 0.05, 0.05, Math.PI - 0.05, 12), 0.05, { seg: 5, caps: false }); m.emissive(0); }
    m.color('#5a5058').shine(1); m.roundBox(0, 0.03, 0, D.w + 0.6, 0.06, 1.2, 0.03);
    m.pop(); m.shine(0);
  }
  // base ring walls (colliders) between base hubs, with gaps at the doors
  const B = G.base, wallH = o.wallH || Math.min(3.2, r * 0.42);
  for (let i = 0; i < B.length; i++) {
    const a = V[B[i]], b = V[B[(i + 1) % B.length]], mid = bcmV.norm(a[0] + b[0], 0, a[2] + b[2]);
    if (doors.length && bcmInDoor([mid[0], 0.01, mid[2]], doors, r, 0.2)) continue;
    cols.push(bcmC.wall(a[0] * r * 0.985, a[2] * r * 0.985, b[0] * r * 0.985, b[2] * r * 0.985, 0.5, 0, wallH, { cover: true }));
  }
  return { cols };
}

/* ---- sound gear ---- */
// speaker cabinet (front = +Z): rounded box, grille, cones. Returns cone centres
function bcmSpeaker(m, x, y, z, w, h, d, o) {
  o = o || {};
  m.color(o.col || '#1c1c22').shine(1); m.roundBox(x, y + h / 2, z, w, h, d, Math.min(w, h, d) * 0.1);
  const n = o.cones || (h > w * 1.4 ? 2 : 1), out = [];
  for (let i = 0; i < n; i++) {
    const cy = y + h * (n === 1 ? 0.5 : 0.27 + i * 0.46 / (n - 1)), rr = Math.min(w, h / n) * 0.36;
    m.push(); m.tf(x, cy, z + d / 2 + 0.01, 0, Math.PI / 2, 0);
    m.color(o.ring || '#34343c').shine(2); m.torus(0, 0, 0, rr, rr * 0.11, { seg: m.lo ? 10 : 16, tseg: 5 });
    if (!m.lo) { m.color('#101014').shine(1); m.lathe([[rr * 0.96, 0], [rr * 0.5, -0.06], [rr * 0.16, -0.1], [0, -0.1]], { seg: 14 }); m.color(o.cap || '#2e2e36'); m.ball(0, -0.08, 0, rr * 0.2, { seg: 8, rings: 5 }); }
    m.pop(); out.push([x, cy, z + d / 2]);
  }
  if (o.led) { m.color(o.led, 1); m.roundBox(x, y + h - 0.06, z + d / 2 + 0.02, w * 0.8, 0.04, 0.02, 0.01); m.emissive(0); }
  m.shine(0);
  return out;
}
// a flown line array (hangs from y down, curving away from +Z), with rigging up to `top`
function bcmLineArray(m, x, y, z, n, o) {
  o = o || {};
  const w = o.w || 1.25, h = o.h || 0.5, d = o.d || 0.85;
  m.color(o.rig || '#56565e').shine(2);
  m.roundBox(x, y + 0.1, z, w * 1.1, 0.14, 0.5, 0.04);
  if (o.top !== undefined) { m.limb(x - w * 0.35, y + 0.1, z, x - w * 0.35, o.top, z, 0.025, 0.025, { seg: 5 }); m.limb(x + w * 0.35, y + 0.1, z, x + w * 0.35, o.top, z, 0.025, 0.025, { seg: 5 }); }
  let cy = y, cz = z, a = 0;
  for (let k = 0; k < n; k++) {
    a += k < n * 0.5 ? 0.02 : 0.07;
    cy -= h * Math.cos(a); cz += h * Math.sin(a);
    m.push(); m.tf(x, cy, cz, 0, -a, 0);
    m.color(o.col || '#16161c').shine(1); m.roundBox(0, h / 2, 0, w, h * 0.96, d, 0.05);
    m.color(o.grille || '#2c2c34'); m.roundBox(0, h / 2, d / 2 + 0.005, w * 0.9, h * 0.7, 0.02, 0.02);
    if (o.led && k === 0) { m.color(o.led, 1); m.roundBox(0, h - 0.04, d / 2 + 0.02, w * 0.7, 0.03, 0.02, 0.01); m.emissive(0); }
    m.pop();
  }
  m.shine(0);
  return [x, cy, cz];
}
// a stack of subwoofers (front = +Z)
function bcmSubs(m, x, z, nx, ny, o) {
  o = o || {};
  const w = o.w || 1.3, h = o.h || 0.75, d = o.d || 1.0;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) bcmSpeaker(m, x + (i - (nx - 1) / 2) * (w + 0.04), (o.y || 0) + j * (h + 0.02), z, w, h, d, { cones: 1, col: o.col, ring: o.ring, led: j === ny - 1 ? o.led : null });
  return { t: 'box', x, z, hx: nx * (w + 0.04) / 2, hz: d / 2, y0: o.y || 0, y1: (o.y || 0) + ny * (h + 0.02) };
}
// square box truss between two points (4 chords + zig-zag lacing)
function bcmTruss(m, ax, ay, az, bx, by, bz, w, o) {
  o = o || {};
  const d = bcmV.norm(bx - ax, by - ay, bz - az), L = Math.hypot(bx - ax, by - ay, bz - az);
  const up = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  let u = bcmV.cross(d, up); u = bcmV.norm(u[0], u[1], u[2]); const v = bcmV.cross(u, d);
  const hw = w / 2, rc = o.r || 0.035, rl = rc * 0.55, seg = m.lo ? 4 : 5;
  const C = [[hw, hw], [-hw, hw], [-hw, -hw], [hw, -hw]].map(([p, q]) => [u[0] * p + v[0] * q, u[1] * p + v[1] * q, u[2] * p + v[2] * q]);
  m.color(o.col || '#c4c6ce').shine(3);
  for (const c of C) m.limb(ax + c[0], ay + c[1], az + c[2], bx + c[0], by + c[1], bz + c[2], rc, rc, { seg, ends: false });
  if (!m.lo || o.lace) {
    const n = Math.max(1, Math.round(L / w));
    for (let f = 0; f < 4; f++) {
      const c0 = C[f], c1 = C[(f + 1) % 4];
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n, A = k % 2 ? c0 : c1, B = k % 2 ? c1 : c0;
        m.limb(ax + (bx - ax) * t0 + A[0], ay + (by - ay) * t0 + A[1], az + (bz - az) * t0 + A[2], ax + (bx - ax) * t1 + B[0], ay + (by - ay) * t1 + B[1], az + (bz - az) * t1 + B[2], rl, rl, { seg: 4, ends: false });
      }
    }
  }
  m.shine(0);
}
// moving-head light (a little yoke + lens), lens colour glows
function bcmMover(m, x, y, z, col, hang) {
  m.color('#1e1e24').shine(2);
  m.roundBox(x, y + (hang ? -0.1 : 0.08), z, 0.34, 0.16, 0.34, 0.05);
  m.push(); m.tf(x, y + (hang ? -0.36 : 0.34), z, 0, hang ? 0.5 : -0.5, 0);
  m.roundBox(0, 0, 0, 0.3, 0.3, 0.36, 0.08);
  m.color(col, 1); m.roundCyl(0, -0.02, 0.18, 0.1, 0.04, 0.01, { seg: 10 }); m.emissive(0);
  m.pop(); m.shine(0);
}
// an LED wall: flat emissive pixels in the local XY plane at z, facing +Z. colFn(u, v) -> '#rrggbb' or null (dark)
function bcmLEDWall(m, cx, cy, cz, w, h, nx, ny, colFn, o) {
  o = o || {};
  const pw = w / nx, ph = h / ny, gap = o.gap === undefined ? 0.12 : o.gap, e = o.e === undefined ? 0.95 : o.e;
  const curve = o.curve || 0;   // concave toward +Z (radius) for curved walls
  m.color(o.back || '#08080c').shine(1);
  if (!curve) m.roundBox(cx, cy, cz - 0.12, w + 0.3, h + 0.3, 0.2, 0.06);
  else { const nb = Math.max(4, Math.round(nx / 3)); for (let k = 0; k < nb; k++) { const x = cx - w / 2 + (k + 0.5) * w / nb, z = cz + (x - cx) * (x - cx) / (2 * curve) - 0.12; m.push(); m.tf(x, cy, z, -Math.atan((x - cx) / curve)); m.box(0, 0, 0, w / nb + 0.06, h + 0.3, 0.2); m.pop(); } }
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const u = (i + 0.5) / nx, v = (j + 0.5) / ny, c = colFn(u, v, i, j); if (!c) continue;
    const x0 = cx - w / 2 + i * pw + pw * gap / 2, x1 = x0 + pw * (1 - gap), y0 = cy - h / 2 + j * ph + ph * gap / 2, y1 = y0 + ph * (1 - gap);
    const zz = (x) => curve ? cz + (x - cx) * (x - cx) / (2 * curve) : cz;
    m.color(c, e); m.poly([[x1, y0, zz(x1)], [x1, y1, zz(x1)], [x0, y1, zz(x0)], [x0, y0, zz(x0)]], null, [(x0 + x1) / 2, (y0 + y1) / 2, zz((x0 + x1) / 2) - 1]);
  }
  m.emissive(0); m.shine(0);
}
// DJ booth facing +Z of the local frame at (x, y, z, yaw): rounded desk with an LED front, decks + mixer, booth light.
// Returns its colliders (in the part's local space)
function bcmBooth(m, x, y, z, yaw, o) {
  o = o || {};
  const w = o.w || 2.8, d = o.d || 0.95, h = o.h || 1.05, A = o.ca || '#ff4fd8', B = o.cb || '#38f2ff';
  m.push(); m.tf(x, y, z, yaw);
  m.color(o.body || '#1c1a22').shine(2); m.roundBox(0, h / 2, 0, w, h, d, 0.1, { top: o.top || '#2a2832' });
  // LED front: a pixel band (our own pattern) + a light strip
  const nx = Math.round(w / 0.16), ny = 5, fz = d / 2 + 0.012;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const u = i / (nx - 1), v = j / (ny - 1), wave = Math.sin(u * 9 + v * 3) * 0.5 + 0.5;
    const c = o.ledFn ? o.ledFn(u, v) : (wave > 0.55 ? A : wave > 0.3 ? B : null);
    if (!c) continue;
    const px = -w / 2 + 0.12 + u * (w - 0.24), py = 0.22 + v * (h - 0.44);
    m.color(c, 0.95); m.poly([[px + 0.055, py - 0.055, fz], [px + 0.055, py + 0.055, fz], [px - 0.055, py + 0.055, fz], [px - 0.055, py - 0.055, fz]], null, [px, py, 0]);
  }
  m.color(A, 1); m.roundBox(0, h - 0.05, d / 2 + 0.02, w - 0.2, 0.04, 0.03, 0.012); m.emissive(0);
  // decks: two players + a mixer
  for (const sd of [-1, 1]) {
    const px = sd * w * 0.27;
    m.color('#2a2a32').shine(2); m.roundBox(px, h + 0.05, -0.05, 0.62, 0.1, 0.52, 0.03);
    m.color('#0d0d12').shine(3); m.push(); m.tf(px, h + 0.1, -0.02); m.roundCyl(0, 0, 0, 0.2, 0.025, 0.006, { seg: m.lo ? 10 : 18 }); m.pop();
    m.color(sd < 0 ? A : B, 0.85); m.push(); m.tf(px, h + 0.126, -0.02); m.roundCyl(0, 0, 0, 0.07, 0.006, 0.002, { seg: 10 }); m.pop(); m.emissive(0);
  }
  m.color('#24222c').shine(2); m.roundBox(0, h + 0.06, -0.05, 0.4, 0.12, 0.5, 0.03);
  for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { m.color([A, '#ffe24a', B][i], 0.7); m.ball(sd * 0.08, h + 0.13, -0.18 + i * 0.1, 0.022, { seg: 6, rings: 4 }); }
  m.emissive(0);
  // gooseneck booth lamp
  m.color('#3a3a44').shine(2); m.limb(w / 2 - 0.15, h, -0.3, w / 2 - 0.3, h + 0.45, -0.15, 0.015, 0.012, { seg: 5 });
  m.color('#fff2c8', 1); m.ball(w / 2 - 0.32, h + 0.45, -0.13, 0.04, { seg: 6, rings: 4 }); m.emissive(0);
  m.pop(); m.shine(0);
  return [bcmC.box(x, z, w / 2, d / 2, y, y + h + 0.1, yaw)];
}
// a hyperbolic shade sail through four corners (both sides), edges pulled in like real sails
function bcmSail(m, A, B, C, D, o) {
  o = o || {};
  const nu = o.n || (m.lo ? 5 : 9), sag = o.sag === undefined ? 0.35 : o.sag, cols = o.cols || ['#efe6d4'];
  const f = (u, v, t) => {
    const k = 1 - 0.07 * (Math.sin(Math.PI * u) + Math.sin(Math.PI * v));
    const x = lerp(lerp(A[0], B[0], u), lerp(D[0], C[0], u), v), y = lerp(lerp(A[1], B[1], u), lerp(D[1], C[1], u), v), z = lerp(lerp(A[2], B[2], u), lerp(D[2], C[2], u), v);
    const cx = (A[0] + B[0] + C[0] + D[0]) / 4, cz = (A[2] + B[2] + C[2] + D[2]) / 4;
    t[0] = cx + (x - cx) * k; t[1] = y - sag * Math.sin(Math.PI * u) * Math.sin(Math.PI * v); t[2] = cz + (z - cz) * k;
  };
  const colFn = (u) => cols[Math.min(cols.length - 1, Math.floor(u * cols.length))];
  m.surf(nu, nu, f, { colFn }); m.surf(nu, nu, f, { colFn: o.under ? () => o.under : colFn, flip: true });
}
// rounded couch (front = +Z)
function bcmCouch(m, x, z, yaw, col, o) {
  o = o || {};
  const w = o.w || 2.1, c2 = shade(col, -0.18);
  m.push(); m.tf(x, 0, z, yaw);
  m.color(c2).shine(1); m.roundBox(0, 0.22, 0, w, 0.36, 0.9, 0.12);
  m.color(col); m.roundBox(-w / 4, 0.46, 0.05, w / 2 - 0.06, 0.16, 0.78, 0.08); m.roundBox(w / 4, 0.46, 0.05, w / 2 - 0.06, 0.16, 0.78, 0.08);
  m.color(c2); m.roundBox(0, 0.72, -0.36, w, 0.6, 0.2, 0.1); m.roundBox(-w / 2 + 0.1, 0.55, 0, 0.22, 0.42, 0.88, 0.1); m.roundBox(w / 2 - 0.1, 0.55, 0, 0.22, 0.42, 0.88, 0.1);
  if (o.pillow) { m.color(o.pillow); m.push(); m.tf(-w / 2 + 0.45, 0.66, -0.15, 0.3, -0.25, 0); m.roundBox(0, 0, 0, 0.42, 0.42, 0.14, 0.07); m.pop(); }
  m.pop(); m.shine(0);
  return bcmC.box(x, z, w / 2, 0.46, 0, 0.5, yaw);
}
// low pouf / ottoman
function bcmPouf(m, x, z, col) { m.color(col).shine(1); m.push(); m.tf(x, 0, z); m.roundCyl(0, 0, 0, 0.38, 0.42, 0.12, { seg: m.lo ? 8 : 14 }); m.pop(); m.shine(0); return bcmC.cyl(x, z, 0.38, 0, 0.42); }
// paper lantern hanging at (x, y, z)
function bcmLantern(m, x, y, z, col, s) { s = s || 1; m.color('#2a2a2a'); m.limb(x, y + 0.28 * s, z, x, y + 0.6 * s, z, 0.008, 0.008, { seg: 4 }); m.color(col, 0.85); m.ellipsoid(x, y, z, 0.2 * s, 0.26 * s, 0.2 * s, { seg: m.lo ? 8 : 12, rings: m.lo ? 5 : 7 }); m.emissive(0); }
// string of flags/bunting along a sagging line (no colliders)
function bcmBunting(m, a, b, n, cols, sag) {
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 0.6) / n, s = t => -Math.sin(t * Math.PI) * (sag || 0.6);
    const ax = lerp(a[0], b[0], t0), ay = lerp(a[1], b[1], t0) + s(t0), az = lerp(a[2], b[2], t0), bx = lerp(a[0], b[0], t1), by = lerp(a[1], b[1], t1) + s(t1), bz = lerp(a[2], b[2], t1);
    m.color(cols[i % cols.length]); const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    m.poly([[ax, ay, az], [bx, by, bz], [mx, (ay + by) / 2 - 0.34, mz]]); m.poly([[bx, by, bz], [ax, ay, az], [mx, (ay + by) / 2 - 0.34, mz]]);
  }
  m.color('#3a3a3a'); m.limb(a[0], a[1], a[2], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - (sag || 0.6), (a[2] + b[2]) / 2, 0.01, 0.01, { seg: 3, ends: false }); m.limb((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - (sag || 0.6), (a[2] + b[2]) / 2, b[0], b[1], b[2], 0.01, 0.01, { seg: 3, ends: false });
}
// string lights: little emissive bulbs along a sagging line
function bcmStringLights(m, a, b, n, cols, sag, P, lights) {
  m.color('#2a2a2a'); m.limb(a[0], a[1], a[2], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - sag, (a[2] + b[2]) / 2, 0.008, 0.008, { seg: 3, ends: false }); m.limb((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - sag, (a[2] + b[2]) / 2, b[0], b[1], b[2], 0.008, 0.008, { seg: 3, ends: false });
  for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t) - Math.sin(t * Math.PI) * sag, z = lerp(a[2], b[2], t), c = cols[i % cols.length]; m.color(c, 1); m.ball(x, y - 0.05, z, 0.05, { seg: 5, rings: 3 }); if (lights && i % 3 === 0) lights.push({ x, y, z, s: 0.55, c }); }
  m.emissive(0);
}
// a column: plinth, base torus, fluted shaft (rMod), capital. y = bottom
function bcmColumn(m, x, z, h, r, o) {
  o = o || {};
  const col = o.col || '#eee6d8', trim = o.trim || '#e0aa30';
  m.push(); m.tf(x, o.y || 0, z);
  m.color(col).shine(1); m.roundBox(0, 0.18, 0, r * 2.7, 0.36, r * 2.7, 0.06);
  m.color(trim).shine(2); m.torus(0, 0.44, 0, r * 1.08, r * 0.14, { seg: m.lo ? 10 : 16, tseg: 5 });
  m.color(col).shine(1);
  const fl = o.flutes || 12;
  m.push(); m.tf(0, 0.44, 0); m.lathe([[r * 1.04, 0], [r, 0.25], [r * 0.88, h - 1.3], [r * 0.9, h - 1.0]], { seg: m.lo ? 12 : 24, rMod: m.lo ? null : (th) => 1 - 0.045 * Math.pow(Math.abs(Math.cos(th * fl / 2)), 6) }); m.pop();
  m.color(trim).shine(2); m.torus(0, h - 0.55, 0, r * 0.95, r * 0.12, { seg: m.lo ? 10 : 16, tseg: 5 });
  m.push(); m.tf(0, h - 0.56, 0); m.lathe([[r * 0.92, 0], [r * 1.25, 0.25], [r * 1.5, 0.42], [r * 1.5, 0.42], [0, 0.42]], { seg: m.lo ? 10 : 18 }); m.pop();
  m.color(col).shine(1); m.roundBox(0, h - 0.07, 0, r * 3.2, 0.16, r * 3.2, 0.05);
  m.pop(); m.shine(0);
  return bcmC.cyl(x, z, r * 1.1, o.y || 0, (o.y || 0) + h);
}
// tipi: canvas cone with a painted band, poles poking out the top, a door flap facing +Z
function bcmTipi(m, x, z, yaw, o) {
  o = o || {};
  const r = o.r || 2.6, h = o.h || 5.6, can = o.canvas || '#ece0c4', band = o.band || '#8a4a2a', band2 = o.band2 || '#2a6a5a';
  m.push(); m.tf(x, 0, z, yaw);
  m.color(can).shine(0);
  m.lathe([[r, 0], [r * 0.985, 0.18], [r * 0.83, h * 0.15, band], [r * 0.8, h * 0.19, band], [r * 0.79, h * 0.2], [r * 0.7, h * 0.32, band2], [r * 0.68, h * 0.34, band2], [r * 0.66, h * 0.36], [r * 0.1, h * 0.9], [r * 0.05, h * 0.95], [0, h * 0.96]], { seg: m.lo ? 10 : 18 });
  if (!m.lo) { // smoke flaps
    m.color(shade(can, -0.08)); for (const sd of [-1, 1]) { m.push(); m.tf(sd * r * 0.12, h * 0.82, -r * 0.1, sd * 0.5, -0.25, 0); m.roundBox(0, 0, 0, r * 0.22, h * 0.2, 0.04, 0.02); m.pop(); }
  }
  m.color('#6a4a2a').shine(1);
  const np = m.lo ? 5 : 9;
  for (let k = 0; k < np; k++) { const a = k / np * TAU + 0.3, x0 = Math.sin(a) * r * 0.06, z0 = Math.cos(a) * r * 0.06; m.limb(Math.sin(a) * r * 0.98, 0.02, Math.cos(a) * r * 0.98, -x0 * 5, h * 1.22, -z0 * 5, 0.045, 0.03, { seg: 5, ends: false }); }
  // door: dark oval opening + a pinned-back flap
  m.color('#2a1a10').shine(0); m.push(); m.tf(0, 0, r * 0.9 - 0.05, 0, -0.17, 0); m.ellipsoid(0, 0.75, 0.02, 0.52, 0.78, 0.04, { seg: m.lo ? 8 : 12, rings: m.lo ? 4 : 6 }); m.pop();
  if (!m.lo) { m.color(shade(can, -0.12)); m.push(); m.tf(0.62, 0, r * 0.86, -0.4, -0.18, 0); m.roundBox(0, 0.8, 0, 0.6, 1.5, 0.03, 0.02); m.pop(); }
  if (o.pattern) o.pattern(m, r, h);
  m.pop(); m.shine(0);
}
// mirror ball on a cable
function bcmMirrorBall(m, x, y, z, r, top) {
  m.color('#5a5a62'); m.limb(x, y + r, z, x, top, z, 0.012, 0.012, { seg: 4, ends: false });
  m.color('#d8dce8').shine(3); m.sphere(x, y, z, r, 14, 9, { smooth: false }); m.shine(0);
}
// a pole with a pennant flag on top
function bcmFlagPole(m, x, z, h, col, o) {
  o = o || {};
  m.color(o.pole || '#b8b8c0').shine(2); m.limb(x, 0, z, x, h, z, 0.05, 0.035, { seg: 6 });
  m.color(o.cap || '#ffe24a', o.capE || 0); m.ball(x, h + 0.05, z, 0.08, { seg: 6, rings: 4 }); m.emissive(0).shine(0);
  m.color(col); const fw = o.w || 1.6, fh = o.fh || 0.9;
  m.poly([[x, h - 0.1, z], [x + fw, h - 0.1 - fh / 2, z], [x, h - 0.1 - fh, z]]); m.poly([[x + fw, h - 0.1 - fh / 2, z], [x, h - 0.1, z], [x, h - 0.1 - fh, z]]);
}
// ground paint helpers (camp-local)
function bcmPaint(P, fn) { const F = P.F; P.api.paint((c, Pt, S) => fn(c, (lx, lz) => Pt(F.wx(lx, lz), F.wz(lx, lz)), S * F.s, -F.rot)); }
function bcmRug(P, lx, lz, w, d, yaw, col, trim) {
  bcmPaint(P, (c, Pt, S, rot) => { const [px, pz] = Pt(lx, lz); c.save(); c.translate(px, pz); c.rotate(rot - (yaw || 0)); c.fillStyle = col; c.fillRect(-w / 2 * S, -d / 2 * S, w * S, d * S); c.strokeStyle = trim || 'rgba(255,220,150,0.7)'; c.lineWidth = 0.12 * S; c.strokeRect(-w / 2 * S + 0.2 * S, -d / 2 * S + 0.2 * S, (w - 0.4) * S, (d - 0.4) * S); c.restore(); });
}
function bcmDisc(P, lx, lz, r, fill, stroke, lw) {
  bcmPaint(P, (c, Pt, S) => { const [px, pz] = Pt(lx, lz); c.beginPath(); c.arc(px, pz, r * S, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = (lw || 0.2) * S; c.stroke(); } });
}

/* ---- a curved, tiered arcade (a colosseum wall): piers, real arch openings (spandrels + soffits on both faces),
   engaged half-columns, entablatures with LED strips, walkable galleries with balustrades.
   o: { cx, cz, ri, ro, a0, a1 (angles from -Z toward +X), bays, tiers: [{ h, col, colB, cap }], attic, stone, trim, led,
        gallery: [tier indices with a walkable floor], pier: half width }
   Returns { cols, galleries: [{ y, ri, ro }] } (camp-local colliders). ---- */
function bcmArcade(m, o) {
  const cx = o.cx, cz = o.cz, ri = o.ri, ro = o.ro, a0 = o.a0, a1 = o.a1, nb = o.bays, dA = (a1 - a0) / nb, ph = o.pier || 0.55;
  const stone = bcmRGB(o.stone || '#d8c4a0'), stone2 = bcmMul(stone, 0.86), trim = o.trim || '#b89870', led = o.led || '#ffb347';
  const cols = [], galleries = [];
  const pt = (R, th, y) => [cx + R * Math.sin(th), y, cz - R * Math.cos(th)];
  const rad = (th, k) => [Math.sin(th) * k, 0, -Math.cos(th) * k];
  const tang = th => [Math.cos(th), 0, Math.sin(th)];
  let yb = 0;
  o.tiers.forEach((T, ti) => {
    const th = T.h, eh = T.eh || 0.55, yTop = yb + th - eh;
    for (let b = 0; b < nb; b++) {
      const tc = a0 + (b + 0.5) * dA;
      const bwI = ri * dA / 2, ra = Math.max(0.6, bwI - ph), ys = yTop - 0.3 - ra;
      // spandrels on both faces, soffit (vault) through the wall
      for (const face of [0, 1]) {
        const R = face ? ro : ri, bw = R * dA / 2, nrmK = face ? 1 : -1;
        const angs = [0, Math.atan2(yTop - ys, bw), Math.PI - Math.atan2(yTop - ys, bw), Math.PI];
        for (let k = 1; k < 12; k++) angs.push(k / 12 * Math.PI);
        angs.sort((x, y) => x - y);
        const n = angs.length;
        m.color(face ? stone2 : stone);
        m.grid(n, 2, false, (i, j, out) => {
          const a = angs[i], ca = Math.cos(a), sa = Math.sin(a);
          let u, y;
          if (j === 0) { u = ra * ca; y = ys + ra * sa; }
          else { const tt = Math.min(sa > 1e-4 ? (yTop - ys) / sa : 1e9, Math.abs(ca) > 1e-4 ? bw / Math.abs(ca) : 1e9); u = tt * ca; y = ys + tt * sa; }
          const thh = tc - u / R, q = pt(R, thh, y), nn = rad(thh, nrmK);
          out.p[0] = q[0]; out.p[1] = q[1]; out.p[2] = q[2]; out.n[0] = nn[0]; out.n[1] = nn[1]; out.n[2] = nn[2];
        });
      }
      // soffit
      m.color(bcmMul(stone, 0.7));
      m.grid(13, 2, false, (i, j, out) => {
        const a = i / 12 * Math.PI, ca = Math.cos(a), sa = Math.sin(a), R = j ? ro : ri, u = ra * ca, y = ys + ra * sa, thh = tc - u / R;
        const q = pt(R, thh, y), tg = tang(thh);
        out.p[0] = q[0]; out.p[1] = q[1]; out.p[2] = q[2];
        out.n[0] = -(-ca * tg[0]); out.n[1] = -sa; out.n[2] = -(-ca * tg[2]);
      });
      // arch moulding (inner face) with a keystone; an LED strip under the arch at night
      if (!m.lo) {
        const arc = []; for (let k = 0; k <= 12; k++) { const a = k / 12 * Math.PI, thh = tc - (ra + 0.12) * Math.cos(a) / (ri - 0.08); arc.push(pt(ri - 0.08, thh, ys + (ra + 0.12) * Math.sin(a))); }
        m.color(trim).shine(1); bcmTube(m, arc, 0.13, { seg: 6, caps: false }); m.shine(0);
        const kq = pt(ri - 0.12, tc, ys + ra + 0.12); m.color(trim); m.push(); m.tf(kq[0], kq[1], kq[2], -tc); m.roundBox(0, 0, 0, 0.42, 0.55, 0.3, 0.06); m.pop();
        if (T.ledArch !== false) { const la = []; for (let k = 1; k < 12; k++) { const a = k / 12 * Math.PI, thh = tc - (ra - 0.05) * Math.cos(a) / (ri + 0.25); la.push(pt(ri + 0.25, thh, ys + (ra - 0.05) * Math.sin(a))); } m.color(T.led || led, 0.9); bcmTube(m, la, 0.045, { seg: 4, caps: false }); m.emissive(0); }
      }
      // balustrade in the openings of galleries (both faces)
      if (ti > 0 && (o.gallery || []).indexOf(ti) >= 0) {
        for (const face of [0, 1]) {
          if (face && o.openOuter && o.openOuter(tc)) continue;
          const R = face ? ro - 0.15 : ri + 0.15, w0 = tc - (ra - 0.1) / R, w1 = tc + (ra - 0.1) / R;
          const A = pt(R, w0, yb + 1.0), B = pt(R, w1, yb + 1.0);
          m.color(trim).shine(1); m.limb(A[0], A[1], A[2], B[0], B[1], B[2], 0.07, 0.07, { seg: 6 });
          if (!m.lo) for (let k = 0; k <= 4; k++) { const q = pt(R, lerp(w0, w1, k / 4), yb); m.push(); m.tf(q[0], yb, q[2]); m.lathe([[0.06, 0], [0.1, 0.25], [0.05, 0.6], [0.08, 0.85], [0.05, 1.0]], { seg: 5 }); m.pop(); }
          m.shine(0);
          const mid = pt(R, tc, 0), tg = tang(tc);
          cols.push({ t: 'box', x: mid[0], z: mid[2], hx: 0.12, hz: ra, y0: yb, y1: yb + 1.1, yaw: Math.atan2(tg[0], tg[2]), walk: false, camPass: true });
        }
      }
    }
    // piers (radial blocks between openings) + engaged half-columns on the inner face
    for (let b = 0; b <= nb; b++) {
      const tb = a0 + b * dA, end = b === 0 || b === nb, bwI = ri * dA / 2, ra = Math.max(0.6, bwI - ph), ys = yTop - 0.3 - ra;
      const mid = pt((ri + ro) / 2, tb, 0), pw = end ? ph * 2.2 : ph * 2, depth = ro - ri;
      m.color(stone).shine(0); m.push(); m.tf(mid[0], yb, mid[2], -tb); m.roundBox(0, (yTop - yb) / 2, 0, pw, yTop - yb, depth, 0.08); m.pop();
      cols.push({ t: 'box', x: mid[0], z: mid[2], hx: pw / 2, hz: depth / 2, y0: yb, y1: yb + th, yaw: -tb, walk: false });
      if (!m.lo) {
        const q0 = pt(ri - 0.12, tb, yb + 0.35), q1 = pt(ri - 0.12, tb, yTop - 0.15);
        m.color(T.col || '#e8d8bc').shine(1); m.limb(q0[0], q0[1], q0[2], q1[0], q1[1], q1[2], 0.27, 0.24, { seg: 8 });
        m.color(T.cap || trim); m.push(); m.tf(q0[0], yb, q0[2], -tb); m.roundBox(0, 0.17, 0, 0.75, 0.34, 0.5, 0.06); m.pop();
        m.push(); m.tf(q1[0], yTop - 0.2, q1[2], -tb); m.roundBox(0, 0.06, 0, 0.75, 0.22, 0.52, 0.06); m.pop(); m.shine(0);
      }
    }
    // entablature band with mouldings + an LED strip on the inner face
    m.push(); m.tf(cx, 0, cz, Math.PI);
    m.color(trim).shine(1);
    m.lathe([[ro + 0.05, yTop], [ro + 0.25, yTop + 0.12], [ro + 0.25, yb + th], [ri - 0.25, yb + th], [ri - 0.25, yTop + 0.12], [ri - 0.05, yTop], [ro + 0.05, yTop]], { seg: m.lo ? 24 : 48, theta0: -a1, theta1: -a0 });
    m.color(T.led || led, 0.95); m.lathe([[ri - 0.27, yTop + 0.2], [ri - 0.27, yTop + 0.32]], { seg: m.lo ? 24 : 48, theta0: -a1, theta1: -a0, flip: true }); m.emissive(0);
    // gallery floor slab
    if (ti > 0) { m.color(bcmMul(stone, 0.78)); m.lathe([[ro - 0.1, yb - 0.25], [ro - 0.1, yb], [ri + 0.05, yb], [ri + 0.05, yb - 0.25], [ro - 0.1, yb - 0.25]], { seg: m.lo ? 24 : 48, theta0: -a1, theta1: -a0 }); }
    m.pop(); m.shine(0);
    if (ti > 0 && (o.gallery || []).indexOf(ti) >= 0) {
      galleries.push({ y: yb, ri, ro });
      for (let b = 0; b < nb; b++) { const tc = a0 + (b + 0.5) * dA, mid = pt((ri + ro) / 2, tc, 0); cols.push({ t: 'box', x: mid[0], z: mid[2], hx: (ri + ro) / 2 * dA / 2 + 0.05, hz: (ro - ri) / 2, y0: yb - 0.25, y1: yb, yaw: -tc }); }
    }
    yb += th;
  });
  // attic: a solid band with a cornice and an LED crown
  if (o.attic) {
    m.push(); m.tf(cx, 0, cz, Math.PI);
    m.color(o.stone || '#d8c4a0');
    m.lathe([[ro, yb], [ro, yb + o.attic], [ro + 0.3, yb + o.attic + 0.15], [ri - 0.3, yb + o.attic + 0.15], [ri, yb + o.attic], [ri, yb], [ro, yb]], { seg: m.lo ? 24 : 48, theta0: -a1, theta1: -a0 });
    m.color(o.crown || led, 1); m.lathe([[ri - 0.31, yb + o.attic + 0.05], [ri - 0.31, yb + o.attic + 0.14]], { seg: m.lo ? 24 : 48, theta0: -a1, theta1: -a0, flip: true }); m.emissive(0);
    m.pop();
    for (let b = 0; b < nb; b++) { const tc = a0 + (b + 0.5) * dA, mid = pt((ri + ro) / 2, tc, 0); cols.push({ t: 'box', x: mid[0], z: mid[2], hx: (ri + ro) / 2 * dA / 2 + 0.05, hz: (ro - ri) / 2, y0: yb - 0.4, y1: yb + o.attic + 0.15, yaw: -tc, walk: true }); }
  }
  return { cols, galleries, top: yb + (o.attic || 0) };
}

/* ---- camp vehicles: the docking stage car (Root Society) and the sound truck (Space Cowboys) ----
   A tour is one smooth path from the dock, around the loop, back into the dock. The autopilot follows it with a speed
   profile (slow in the camp core, fast on the playa, easing to a stop flush in the dock). Brady can board it any time
   (the deck is a moving platform) and drive it (ACTION near the seat). Leave it near the dock and it docks itself;
   leave it anywhere else and it drives back into the tour after a while. */
function bcmCatmull(pts, step) {
  const out = [], n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), k = Math.max(2, Math.ceil(L / step));
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(c => 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(pts[n - 1].slice());
  const S = [0]; for (let i = 1; i < out.length; i++) S.push(S[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  return { pts: out, s: S, len: S[S.length - 1] };
}
function bcmPathAt(Pth, s, out) {
  const S = Pth.s, n = S.length; s = clamp(s, 0, Pth.len);
  let lo = 0, hi = n - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (S[mid] <= s) lo = mid; else hi = mid; }
  const t = S[hi] > S[lo] ? (s - S[lo]) / (S[hi] - S[lo]) : 0, a = Pth.pts[lo], b = Pth.pts[hi];
  out[0] = lerp(a[0], b[0], t); out[1] = lerp(a[1], b[1], t);
  return out;
}
function bcmVehicle(api, g, P, o) {
  const F = P.F, tourL = o.tour.map(q => [q[0], q[1]]), T = bcmCatmull(tourL.map(q => [F.wx(q[0], q[1]), F.wz(q[0], q[1])]), 1.2);
  const dockW = F.w(o.dock[0], 0, o.dock[1]), dockYaw = F.rot + o.dock[2];
  const car = api.artCar({ x: dockW[0], z: dockW[2], yaw: dockYaw, build: o.build, maxSpeed: o.maxSpeed || 7, accel: 3, turn: 0.75, label: o.label || 'DRIVE',
    drivable: P.o.drivable !== false, horn: o.horn, hornLines: o.hornLines, driveHint: o.driveHint });
  car.y = F.y0; car.syncMover && car.syncMover();
  const V = { car, P, tour: T, dock: { x: dockW[0], z: dockW[2], yaw: dockYaw }, s: 0, v: 0, state: o.drive === false ? 'docked' : 'docked', wait: o.firstWait === undefined ? (o.dockTime || 40) * 0.35 : o.firstWait,
    dockTime: o.dockTime || 40, cruise: o.speed || 6.2, slow: o.slowSpeed || 3, core: o.core ? o.core.map(c => c) : null, drive: o.drive !== false, riders: [], parkT: 0, docked: true, boarded: false, tmp: [0, 0], tmp2: [0, 0], ret: null, o };
  P.vehicles.push(V);
  return V;
}
function bcmCoreAt(V, x, z) { if (!V.core) return false; const l = V.P.F.l(x, z), c = V.core; return l[0] > c[0] && l[0] < c[2] && l[1] > c[1] && l[1] < c[3]; }
function bcmVehicleStep(g, V, dt) {
  const car = V.car, p = g.player, T = V.tour;
  const on = !!(p.platform === car.mv && p.grounded && !p.vehicle);
  if (on !== V.boarded) { V.boarded = on; if (on) { bcmEvent(g, 'bcmBoard', { camp: V.P, car: V }); if (V.P.o.onBoard) V.P.o.onBoard(g, V.P, V); } }
  // Brady at the wheel: the autopilot lets go
  if (car.rider) { if (V.state !== 'driven') { if (V.docked) { V.docked = false; bcmEvent(g, 'bcmUndock', { camp: V.P, car: V }); } V.state = 'driven'; bcmEvent(g, 'bcmDrive', { camp: V.P, car: V }); } V.parkT = 0; return; }
  if (V.state === 'driven') {
    // just left the wheel: near the dock? ease in. Otherwise park, then head back to the tour.
    const dd = Math.hypot(car.x - V.dock.x, car.z - V.dock.z), dy = Math.abs(BurnsM.wrap(car.yaw - V.dock.yaw));
    if (dd < 4.5 && (dy < 0.5 || Math.abs(dy - Math.PI) < 0.5)) { V.state = 'docking'; V.from = { x: car.x, z: car.z, yaw: car.yaw }; V.dt = 0; if (Math.abs(dy - Math.PI) < 0.5) V.dock2 = V.dock.yaw + Math.PI; else V.dock2 = V.dock.yaw; }
    else { V.state = 'parked'; V.parkT = 0; }
  }
  if (V.state === 'parked') {
    V.parkT += dt;
    const far = Math.hypot(p.x - car.x, p.z - car.z) > 10;
    if (V.drive && V.parkT > (V.o.returnAfter || 14) && far) {
      // rejoin the tour at the nearest point ahead, through a short straight run
      let best = 0, bd = 1e9; for (let i = 0; i < T.pts.length; i += 3) { const q = T.pts[i], d = Math.hypot(q[0] - car.x, q[1] - car.z); if (d < bd && T.s[i] < T.len - 25) { bd = d; best = i; } }
      const q = T.pts[best], hx = car.x + Math.sin(car.yaw) * 6, hz = car.z + Math.cos(car.yaw) * 6;
      V.ret = bcmCatmull([[car.x, car.z], [hx, hz], [q[0], q[1]]], 1); V.retS = 0; V.retTo = T.s[best]; V.state = 'returning'; car.parked = false;
    }
    return;
  }
  if (V.state === 'docking') {
    V.dt += dt; const k = easeInOut(clamp(V.dt / 2.2, 0, 1));
    car.x = lerp(V.from.x, V.dock.x, k); car.z = lerp(V.from.z, V.dock.z, k); car.yaw = V.from.yaw + BurnsM.wrap(V.dock2 - V.from.yaw) * k; car.syncMover();
    if (k >= 1) { V.state = 'docked'; V.wait = V.dockTime; V.s = 0; V.docked = true; car.parked = false; if (Math.abs(BurnsM.wrap(V.dock2 - V.dock.yaw)) > 0.1) V.flipped = true; else V.flipped = false; bcmEvent(g, 'bcmDock', { camp: V.P, car: V }); if (V.P.o.onDock) V.P.o.onDock(g, V.P, V); }
    return;
  }
  if (V.state === 'docked') {
    if (!V.drive || V.flipped) return;
    V.wait -= dt;
    if (V.wait <= 0) { V.state = 'touring'; V.s = 0; V.v = 0; V.docked = false; bcmEvent(g, 'bcmUndock', { camp: V.P, car: V }); if (V.P.o.onUndock) V.P.o.onUndock(g, V.P, V); }
    return;
  }
  if (V.state === 'returning') {
    const R = V.ret; V.v = approach(V.v, V.slow, dt * 2); V.retS += V.v * dt;
    bcmPathAt(R, V.retS, V.tmp); bcmPathAt(R, V.retS + 2, V.tmp2);
    car.x = V.tmp[0]; car.z = V.tmp[1]; car.yaw = BurnsM.dampAngle(car.yaw, Math.atan2(V.tmp2[0] - V.tmp[0], V.tmp2[1] - V.tmp[1]), 3, dt); car.syncMover();
    if (V.retS >= R.len - 0.5) { V.state = 'touring'; V.s = V.retTo; }
    return;
  }
  if (V.state === 'touring') {
    // speed profile: slow in the camp core, cruise outside, brake into the dock
    const left = T.len - V.s, core = bcmCoreAt(V, car.x, car.z);
    let want = core ? V.slow : V.cruise;
    want = Math.min(want, Math.sqrt(2 * 0.9 * Math.max(0, left)) + 0.12);
    // don't run Brady over: crawl when he's right in front
    const fx = Math.sin(car.yaw), fz = Math.cos(car.yaw), rx = p.x - car.x, rz = p.z - car.z, ahead = rx * fx + rz * fz, side = Math.abs(rx * fz - rz * fx);
    if (ahead > 0 && ahead < 9 && side < 3.2 && Math.abs(p.y - car.y) < 3 && !(V.boarded)) want = Math.min(want, 0.6);
    V.v = approach(V.v, want, dt * (want > V.v ? 1.6 : 2.6));
    V.s = Math.min(T.len, V.s + V.v * dt);
    bcmPathAt(T, V.s, V.tmp); bcmPathAt(T, Math.min(T.len, V.s + 1.6), V.tmp2);
    const yawW = left > 1.7 ? Math.atan2(V.tmp2[0] - V.tmp[0], V.tmp2[1] - V.tmp[1]) : V.dock.yaw;
    car.x = V.tmp[0]; car.z = V.tmp[1]; car.yaw = BurnsM.dampAngle(car.yaw, yawW, 6, dt); car.speed = V.v; car.syncMover();
    if (left < 0.02) { car.x = V.dock.x; car.z = V.dock.z; car.yaw = V.dock.yaw; car.syncMover(); V.state = 'docked'; V.wait = V.dockTime; V.docked = true; V.flipped = false; bcmEvent(g, 'bcmDock', { camp: V.P, car: V }); if (V.P.o.onDock) V.P.o.onDock(g, V.P, V); }
  }
}
// riders: actors that stand on a vehicle deck (DJ + dancers)
BurnsBehaviors.register('bcmRider', {
  init(a) { a.data.ph = Math.random() * 6; },
  update(a, g, dt) {
    const car = a.def.vehicle; if (!car) return;
    const L = a.def.at, c = Math.cos(car.yaw), s = Math.sin(car.yaw);
    a.x = car.x + L[0] * c + L[2] * s; a.z = car.z - L[0] * s + L[2] * c; a.y = car.y + L[1]; a.yaw = car.yaw + (L[3] || 0);
    a.vx = a.vz = 0;
    if (a.def.anim === 'dj') a.ch.play('dj', { bpm: a.def.bpm || 124 }); else a.ch.play('dance', { style: a.def.style || 0, bpm: a.def.bpm || 124 });
  }
});
function bcmRider(P, V, at, o) {
  if (P.o.djs === false && o.anim === 'dj') return null;
  const car = V.car, c = Math.cos(car.yaw), s = Math.sin(car.yaw);
  const def = Object.assign({ x: car.x + at[0] * c + at[2] * s, z: car.z - at[0] * s + at[2] * c, y: car.y + at[1], fixedY: true, collide: false, always: true, behavior: 'bcmRider', vehicle: car, at, bpm: P.bpm, noDJ: true, chatter: false }, o);
  const a = P.api.npc(def); V.riders.push(a); P.actors.push(a);
  return a;
}

/* ======================= 1. ROOT SOCIETY =======================
   Real camp (facts): one of the largest, loudest sound camps. Its public dance space is set by its geodesic domes
   (a 90 ft main dome full of lighting and subwoofer stacks, a 60 ft dome); the living side is a village of ~27 tipis
   around a 30 ft dome used as the common kitchen / meeting space; it sleeps 100+. Per the owner: three big dome
   stages, an open-air coliseum stage, and a stage art car styled like the coliseum that docks in front of it to
   extend the stage, then drives off around the playa.
   Our design: earthy sandstone + cream fabric, amber / leaf-green / teal LEDs, an original "root mandala" stage
   centrepiece. Local layout (+Z = street):
     coliseum   arc centre (0, -6), arcade r 13.2..15.6 over ±105°, 3 tiers + attic (13.3 m), stage deck 1.6 m
     dock       the art car parks along the stage front, deck flush at 1.6 m: centre (0, 1.3) heading +X
     domes      90 ft (-40, 14), 60 ft (40, 14), 50 ft (-34, 44); doors face the plaza
     lounge     shade sails, couches, chai bar (36, 42)       gate (0, 54)
     village    27 tipis around the 30 ft common dome (0, -54); Brady's tipi on the inner ring */
const BCM_RS = {
  COL: { cx: 0, cz: -6, ri: 13.2, ro: 15.6, a: 105 * Math.PI / 180, deck: 1.6, front: -1.0 },
  DOMES: [
    { id: 'mainDome', name: 'The 90 ft Dome', ft: 90, x: -40, z: 14, door: Math.PI / 2, lining: '#2a1c34', glow: ['#ff9a3a', '#ffcf5a', '#7aff5a', '#38d8ff'], led: ['#ffb347', '#7aff5a', '#38d8ff'], dj: 'DJ TAPROOT', seed: 3, crowd: 10, lc: '#ffb347' },
    { id: 'dome60', name: 'The 60 ft Dome', ft: 60, x: 40, z: 14, door: -Math.PI / 2, lining: '#1c2a2a', glow: ['#38f2ff', '#7aff5a', '#9a6bff'], led: ['#38f2ff', '#9a6bff'], dj: 'DJ LOAM', seed: 9, crowd: 7, lc: '#38f2ff' },
    { id: 'dome50', name: 'The 50 ft Dome', ft: 50, x: -34, z: 44, door: Math.atan2(34, -24), lining: '#2e1c1c', glow: ['#ff5a3a', '#ff9a3a', '#ff4fd8'], led: ['#ff7a3a', '#ff4fd8'], dj: 'DJ SPROUT', seed: 14, crowd: 6, lc: '#ff7a3a' }
  ],
  VILLAGE: { x: 0, z: -54 },
  DOCK: [0, 1.3, Math.PI / 2],
  CORE: [-26, -4, 26, 52],
  TOUR: [[0, 1.3], [6.5, 1.3], [12.5, 2.6], [16.6, 7], [18.5, 14], [18.5, 30], [20, 46], [26, 56], [36, 62], [56, 62], [68, 52], [72, 30], [72, -30], [66, -62], [48, -84], [20, -92], [-20, -92], [-48, -84], [-66, -62], [-72, -30], [-72, 30], [-66, 54], [-50, 62], [-30, 61], [-21, 54], [-18.5, 44], [-18.5, 18], [-17, 8.5], [-13.5, 4.2], [-9, 2], [-4.5, 1.35], [0, 1.3]],
  SHORT: [[0, 1.3], [6.5, 1.3], [12.5, 2.6], [16.6, 7], [18.5, 14], [18.5, 30], [16, 50], [6, 60], [-6, 60], [-16, 52], [-18.5, 40], [-18.5, 18], [-17, 8.5], [-13.5, 4.2], [-9, 2], [-4.5, 1.35], [0, 1.3]]
};

// the coliseum stage art car (car-local: +Z forward, deck 1.6 m). Docked heading +X, its -X side faces the crowd.
function bcmRSCar(m) {
  const L = 12.4, W = 4.6, D = 1.6, stone = '#d9c39c', trim = '#a8865a', amber = '#ffb347';
  const cols = [], lights = [];
  // wheels behind the skirts (low detail: they're mostly hidden)
  const lo0 = m.lo; m.lo = true;
  for (const z of [-4.2, 0, 4.2]) for (const sx of [-1, 1]) {
    m.push(); m.tf(sx * 1.75, 0.58, z, 0, 0, Math.PI / 2);
    m.color('#18181c').shine(1); m.roundCyl(0, -0.3, 0, 0.58, 0.6, 0.16, { seg: m.lo ? 10 : 16 });
    m.color('#8a8a92').shine(3); m.roundCyl(0, sx > 0 ? 0.28 : -0.34, 0, 0.3, 0.06, 0.02, { seg: m.lo ? 8 : 12 });
    m.pop();
  }
  m.color('#2a2620').shine(1); m.roundBox(0, 0.75, 0, W - 0.5, 0.5, L - 0.6, 0.12);
  // the skirt: a little arcade on all four sides, LED-lit recesses
  const skirt = (len, side) => {
    const n = Math.max(2, Math.round(len / 1.55)), bw = len / n;
    for (let i = 0; i < n; i++) {
      const u = -len / 2 + (i + 0.5) * bw;
      m.push(); side(u);
      m.color(amber, 0.75); m.roundBox(0, 0.86, -0.12, bw - 0.3, 1.0, 0.06, 0.03); m.emissive(0);
      m.color(stone).shine(0);
      bcmTube(m, bcmArcPts(0, 0.95, 0.04, bw / 2 - 0.18, 0, Math.PI, 6), 0.09, { seg: 4, caps: false });
      m.roundBox(-bw / 2 + 0.11, 0.62, 0, 0.24, 1.0, 0.24, 0.05);
      m.pop();
    }
  };
  for (const sx of [-1, 1]) skirt(L - 0.4, u => m.tf(sx * (W / 2 - 0.05), 0.12, u, sx * Math.PI / 2));
  for (const sz of [-1, 1]) skirt(W - 0.4, u => m.tf(u, 0.12, sz * (L / 2 - 0.05), sz > 0 ? 0 : Math.PI));
  m.lo = lo0;
  m.color(trim).shine(1); m.roundBox(0, 1.4, 0, W + 0.12, 0.16, L + 0.12, 0.06);
  // deck + an LED border
  m.color('#b89a72').shine(1); m.roundBox(0, D - 0.06, 0, W, 0.12, L, 0.04, { top: '#c8aa80' });
  m.color(amber, 1); for (const sx of [-1, 1]) m.roundBox(sx * (W / 2 - 0.04), D + 0.01, 0, 0.05, 0.03, L - 0.3, 0.012); m.emissive(0);
  cols.push(bcmC.box(0, 0, W / 2, L / 2, 0.3, D));
  // two corner towers on the crowd side: two little arcade tiers each, a brazier on top
  for (const sz of [-1, 1]) {
    const tz = sz * 4.6, tx = -1.55, th = [2.3, 2.0];
    let y = D;
    th.forEach((h, k) => {
      for (const [px, pz] of [[-0.6, -1.05], [0.6, -1.05], [-0.6, 1.05], [0.6, 1.05]]) { m.color(stone).shine(0); m.roundBox(tx + px, y + h / 2, tz + pz, 0.32, h, 0.32, 0.06); }
      if (!m.lo) {
        m.color(trim);
        for (const fz of [-1.05, 1.05]) bcmTube(m, bcmArcPts(tx, y + h - 0.62, tz + fz, 0.5, 0, Math.PI, 8), 0.1, { seg: 5, caps: false });
        for (const fx of [-0.6, 0.6]) { m.push(); m.tf(tx + fx, 0, tz, Math.PI / 2); bcmTube(m, bcmArcPts(0, y + h - 0.62, 0, 0.88, 0, Math.PI, 8), 0.1, { seg: 5, caps: false }); m.pop(); }
      }
      m.color(trim).shine(1); m.roundBox(tx, y + h + 0.08, tz, 1.55, 0.18, 2.55, 0.06);
      m.color(amber, 1); m.roundBox(tx, y + h + 0.2, tz, 1.5, 0.05, 2.5, 0.02); m.emissive(0);
      y += h + 0.18;
    });
    // brazier bowl
    m.color('#5a4a3a').shine(2); m.push(); m.tf(tx, y, tz); m.lathe([[0.12, 0], [0.16, 0.3], [0.45, 0.5], [0.5, 0.62], [0.42, 0.62], [0, 0.5]], { seg: m.lo ? 8 : 14 }); m.pop();
    m.color('#ff9a3a', 1); m.ball(tx, y + 0.6, tz, 0.26, { seg: 8, rings: 5 }); m.emissive(0);
    lights.push({ x: tx, y: y + 0.8, z: tz, s: 1.4, c: '#ff9a3a' });
    // tower line array facing the crowd (-X)
    m.push(); m.tf(tx - 0.95, 0, tz, -Math.PI / 2); bcmLineArray(m, 0, D + 3.9, 0, 4, { w: 0.9, h: 0.42, d: 0.6, led: amber }); m.pop();
    cols.push(bcmC.box(tx, tz, 0.78, 1.25, D, y + 0.6));
  }
  // the booth (faces the crowd, -X) and its railing
  cols.push(...bcmBooth(m, -0.75, D, 0, -Math.PI / 2, { w: 2.6, ca: amber, cb: '#7aff5a', body: '#2a2218', top: '#3a3024' }));
  m.color(trim).shine(1);
  m.limb(-2.15, D + 1.0, -3.3, -2.15, D + 1.0, 3.3, 0.06, 0.06, { seg: 6 });
  if (!m.lo) for (let k = 0; k <= 10; k++) { m.push(); m.tf(-2.15, D, -3.3 + k * 0.66); m.lathe([[0.05, 0], [0.09, 0.25], [0.045, 0.6], [0.075, 0.85], [0.05, 1.0]], { seg: 5 }); m.pop(); }
  m.shine(0);
  cols.push(bcmC.box(-2.15, 0, 0.08, 3.4, D, D + 1.05, 0, { walk: false, camPass: true }));
  // driver console at the front (stage side)
  m.color('#3a3028').shine(1); m.roundBox(1.25, D + 0.5, 5.55, 1.1, 1.0, 0.5, 0.1);
  m.color('#202024').shine(2); m.push(); m.tf(1.25, D + 1.05, 5.25, 0, -0.9, 0); m.torus(0, 0, 0, 0.22, 0.03, { seg: 14, tseg: 4 }); m.pop();
  m.color(amber, 1); m.roundBox(1.25, D + 1.02, 5.79, 0.8, 0.06, 0.03, 0.01); m.emissive(0);
  m.color('#5a3a2a').shine(1); m.roundBox(1.25, D + 0.25, 4.55, 0.7, 0.5, 0.6, 0.12); m.roundBox(1.25, D + 0.75, 4.25, 0.7, 0.7, 0.14, 0.06);
  cols.push(bcmC.box(1.25, 5.55, 0.55, 0.25, D, D + 1.0));
  // fold-out rear stairs (boarding), with handrails
  const rz0 = -L / 2, sx0 = 0.7;
  for (let k = 0; k < 4; k++) { m.color('#8a7050').shine(1); m.roundBox(sx0, (k + 1) * 0.4 - 0.08, rz0 - 2.6 + k * 0.65 + 0.32, 2.0, 0.16, 0.66, 0.04); }
  m.color('#5a4a3a'); for (const s of [-1, 1]) m.limb(sx0 + s * 1.0, 0.05, rz0 - 2.6, sx0 + s * 1.0, D, rz0, 0.05, 0.05, { seg: 5 });
  m.color(trim).shine(2); for (const s of [-1, 1]) m.limb(sx0 + s * 1.05, 1.0, rz0 - 2.4, sx0 + s * 1.05, D + 1.0, rz0 + 0.1, 0.04, 0.04, { seg: 5 });
  m.shine(0);
  cols.push(bcmC.ramp(sx0, rz0 - 1.35, 1.0, 1.35, 0.05, D));
  lights.push({ x: -0.75, y: D + 1.4, z: 0, s: 1.2, c: amber }, { x: 0, y: D + 0.1, z: 0, s: 0, c: '#ffb347', pool: 7 });
  return { cols, lights, seat: [1.25, D, 4.6], poofers: [[-1.55, 6.3, 4.6], [-1.55, 6.3, -4.6]], w: W, len: L, top: D };
}

const BCM_RS_TIPIS = (() => {
  // 11 on the inner ring (r 15, gap toward the coliseum path) + 16 on the outer ring (r 23) = 27
  const out = [];
  for (let i = 0; i < 11; i++) { const a = 0.5 + i / 11 * (TAU - 1.0); out.push([15, a, i]); }
  for (let i = 0; i < 16; i++) { const a = 0.32 + i / 16 * (TAU - 0.64); out.push([23, a, 11 + i]); }
  return out;
})();
const BCM_RS_BRADY = 0;    // index of Brady's tipi (inner ring, front right of the village)

function bcmBuildRoot(api, g, P) {
  const K = BCM_RS, C = K.COL, F = P.F, V = K.VILLAGE;
  P.bpm = 124;
  /* ---------- ground paint: plaza rings, root lines, paths ---------- */
  bcmPaint(P, (c, Pt, S) => {
    const [px, pz] = Pt(0, 15);
    const gr = c.createRadialGradient(px, pz, 0, px, pz, 26 * S); gr.addColorStop(0, 'rgba(110,80,58,0.42)'); gr.addColorStop(1, 'rgba(110,80,58,0)');
    c.fillStyle = gr; c.fillRect(px - 26 * S, pz - 26 * S, 52 * S, 52 * S);
    c.strokeStyle = 'rgba(70,50,36,0.45)'; c.lineWidth = 0.25 * S;
    for (let r = 4; r < 22; r += 3.2) { c.beginPath(); c.arc(px, pz, r * S, 0, TAU); c.stroke(); }
    const rng = mulberry32(17); c.strokeStyle = 'rgba(60,40,26,0.35)'; c.lineWidth = 0.18 * S;
    for (let i = 0; i < 14; i++) { let a = i / 14 * TAU, x = 0, z = 15; c.beginPath(); c.moveTo(...Pt(x, z)); for (let k = 0; k < 9; k++) { a += (rng() - 0.5) * 0.5; x += Math.sin(a) * 2.6; z += Math.cos(a) * 2.6; c.lineTo(...Pt(x, z)); } c.stroke(); }
    // path to the village + village ring path
    c.strokeStyle = 'rgba(150,118,92,0.55)'; c.lineWidth = 3 * S; c.beginPath(); c.moveTo(...Pt(21, 0)); c.lineTo(...Pt(21, -22)); c.lineTo(...Pt(8, -36)); c.stroke();
    const [vx, vz] = Pt(V.x, V.z); c.beginPath(); c.arc(vx, vz, 19 * S, 0, TAU); c.lineWidth = 2.2 * S; c.stroke();
    c.fillStyle = 'rgba(96,70,52,0.4)'; c.beginPath(); c.arc(vx, vz, 7.5 * S, 0, TAU); c.fill();
  });
  /* ---------- the coliseum stage ---------- */
  const arc = { cx: C.cx, cz: C.cz, ri: C.ri, ro: C.ro, bays: 7, openOuter: tc => Math.abs(Math.abs(tc) - (C.a - (C.a / 7) * 1.5)) < 0.03, stone: '#dcc7a2', trim: '#ad8b5f', led: '#ffb347', crown: '#7aff5a', attic: 1.1, gallery: [1],
    tiers: [{ h: 4.6, col: '#e8d6b4', cap: '#b8966a' }, { h: 4.0, col: '#e6d2ae', cap: '#c09c6c', led: '#7aff5a' }, { h: 3.6, col: '#e2cca6', cap: '#c8a474', led: '#38d8ff' }] };
  let gal = null;
  for (const half of [-1, 1]) {
    bcmPart(P, half * 9, C.cz - 12, m => {
      const r = bcmArcade(m, Object.assign({}, arc, half < 0 ? { a0: -C.a, a1: 0 } : { a0: 0, a1: C.a }));
      gal = r.galleries[0];
      return { cols: r.cols };
    }, { noAO: true });
  }
  // stage deck: front rectangle + the round back (under the arcade), wooden top, LED front edge
  bcmPart(P, 0, -7, m => {
    m.color('#8a6c4c').shine(1);
    m.roundBox(0, C.deck / 2, -3.5, 25.8, C.deck, 5.2, 0.12, { top: '#a8865c' });
    m.push(); m.tf(C.cx, 0, C.cz, Math.PI); m.lathe([[0, C.deck], [12.95, C.deck], [12.95, 0.05], [12.6, 0]], { seg: 32, theta0: -Math.PI / 2, theta1: Math.PI / 2 }); m.pop();
    m.color('#ffb347', 1); m.roundBox(0, C.deck - 0.12, C.front + 0.02, 25.6, 0.06, 0.04, 0.015); m.color('#7aff5a', 1); m.roundBox(0, 0.22, C.front + 0.02, 25.6, 0.05, 0.04, 0.015); m.emissive(0);
    // plank lines
    m.color('#6c5236'); for (let k = -12; k <= 12; k += 1.5) m.roundBox(k, C.deck + 0.004, -3.5, 0.04, 0.01, 5.1, 0.004);
    return { cols: [bcmC.box(0, -3.5, 12.9, 2.5, 0, C.deck), bcmC.box(0, -8, 12.26, 2, 0, C.deck), bcmC.box(0, -12, 10.1, 2, 0, C.deck), bcmC.box(0, -15.5, 6.7, 1.5, 0, C.deck)] };
  });
  // backstage stairs through the ground arches (bays at about ±52 degrees) + the landing through the wall
  for (const sd of [-1, 1]) {
    const th = sd * (C.a / 7) * 2.5, dir = [Math.sin(th), -Math.cos(th)], tg = [Math.cos(th), Math.sin(th)];
    const o = [C.cx + dir[0] * (C.ro + 2.4), C.cz + dir[1] * (C.ro + 2.4)];
    bcmPart(P, o[0], o[1], m => {
      const cols = [];
      for (let k = 0; k < 4; k++) { const d = C.ro + 4.0 - k * 0.8, q = [C.cx + dir[0] * d, C.cz + dir[1] * d]; m.color('#9a7a56').shine(1); m.push(); m.tf(q[0], 0, q[1], Math.atan2(dir[0], dir[1])); m.roundBox(0, (k + 1) * 0.4 / 2, 0, 2.3, (k + 1) * 0.4, 0.8, 0.05); m.pop(); cols.push(bcmC.box(q[0], q[1], 1.15, 0.4, 0, (k + 1) * 0.4, Math.atan2(dir[0], dir[1]))); }
      const ld = (C.ri + C.ro) / 2 + 0.1, lq = [C.cx + dir[0] * ld, C.cz + dir[1] * ld];
      m.color('#8a6c4c'); m.push(); m.tf(lq[0], 0, lq[1], Math.atan2(dir[0], dir[1])); m.roundBox(0, C.deck / 2, 0, 2.3, C.deck, 2.9, 0.06); m.pop();
      cols.push(bcmC.box(lq[0], lq[1], 1.15, 1.45, 0, C.deck, Math.atan2(dir[0], dir[1])));
      return { cols };
    });
  }
  // gallery ramps (tier 2, 4.6 m) on both sides, running out from the arcade at ±90 degrees
  for (const sd of [-1, 1]) {
    const th = sd * (C.a - (C.a / 7) * 1.5), x0 = C.cx + Math.sin(th) * C.ro - sd * 0.05, z0 = C.cz - Math.cos(th) * C.ro, len = 11;
    bcmPart(P, x0 + sd * len / 2, z0, m => {
      const yaw = sd > 0 ? -Math.PI / 2 : Math.PI / 2;
      m.color('#8a6c4c').shine(1);
      const n = 12;
      for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = x0 + sd * (len - t * len), y = t * 4.6; m.roundBox(x, y - 0.12, z0, 0.98, 0.24, 2.2, 0.05); }
      m.color('#6a5038'); for (const s of [-1, 1]) m.limb(x0 + sd * len, 0, z0 + s * 1.1, x0, 4.5, z0 + s * 1.1, 0.09, 0.09, { seg: 6 });
      m.color('#ad8b5f').shine(1); for (const s of [-1, 1]) m.limb(x0 + sd * len, 1.0, z0 + s * 1.15, x0, 5.6, z0 + s * 1.15, 0.05, 0.05, { seg: 5 });
      m.color('#7aff5a', 1); for (const s of [-1, 1]) m.limb(x0 + sd * len, 0.5, z0 + s * 1.2, x0, 5.1, z0 + s * 1.2, 0.025, 0.025, { seg: 4 }); m.emissive(0);
      for (let k = 1; k < 4; k++) { m.color('#6a5038'); m.limb(x0 + sd * len * (1 - k / 4), 0, z0, x0 + sd * len * (1 - k / 4), 4.6 * k / 4 - 0.2, z0, 0.12, 0.12, { seg: 6 }); }
      return { cols: [bcmC.ramp(x0 + sd * len / 2, z0, 1.1, len / 2, 0.02, 4.6, yaw), bcmC.box(x0 - sd * 0.45, z0, 0.45, 1.1, 4.3, 4.6)] };
    });
  }
  // the root mandala (our own stage art) + the DJ booth + the riser
  const mz = C.cz - C.ri + 0.6, my = 8.0;
  bcmPart(P, 0, mz, m => {
    m.push(); m.tf(0, my, mz, 0, Math.PI / 2, 0);
    m.color('#3a2a1c').shine(1); m.lathe([[0, -0.15], [4.6, -0.15], [4.6, 0.05], [0, 0.05]], { seg: 40 });
    m.color('#ffb347', 1); m.torus(0, 0.12, 0, 4.35, 0.16, { seg: 48, tseg: 6 }); m.torus(0, 0.12, 0, 2.9, 0.1, { seg: 40, tseg: 5 });
    m.color('#7aff5a', 1); m.torus(0, 0.12, 0, 1.45, 0.09, { seg: 32, tseg: 5 });
    m.color('#fff2c8', 1); m.lathe([[0, 0.2], [0.75, 0.15], [0.8, 0.1], [0, 0.1]], { seg: 24 });
    m.pop();
    // 16 roots wandering out from the core
    const rng = mulberry32(161);
    for (let i = 0; i < 16; i++) {
      let a = i / 16 * TAU, r = 0.8; const pts = [];
      for (let k = 0; k <= 8; k++) { pts.push([Math.cos(a) * r, my + Math.sin(a) * r, mz + 0.18]); a += (rng() - 0.5) * 0.32; r += 0.45; }
      m.color(i % 2 ? '#7aff5a' : '#38d8ff', 1); bcmTube(m, pts, t => 0.1 * (1 - t * 0.6), { seg: 5, caps: false });
    }
    m.emissive(0);
    // riser + booth
    m.color('#5a4230').shine(1); m.roundBox(0, C.deck + 0.25, -9.4, 6.4, 0.5, 3.4, 0.1, { top: '#6c5038' });
    m.color('#ffb347', 1); m.roundBox(0, C.deck + 0.44, -7.68, 6.2, 0.05, 0.03, 0.01); m.emissive(0);
    const cols = bcmBooth(m, 0, C.deck + 0.5, -8.6, 0, { w: 3.0, ca: '#ffb347', cb: '#7aff5a', body: '#2a2018', top: '#3a2c20' });
    cols.push(bcmC.box(0, -9.4, 3.2, 1.7, 0, C.deck + 0.5));
    return { cols, lights: [{ x: 0, y: my, z: mz + 0.6, s: 7, c: '#ffb347' }, { x: 0, y: 0, z: -3, s: 0, c: '#ffb347', pool: 18, i: 0.45 }] };
  }, { noAO: true });
  // flown line arrays at the arcade ends + sub stacks on the deck front corners + moving heads on the attic
  for (const sd of [-1, 1]) {
    const th = sd * (C.a - 0.12), q = [C.cx + Math.sin(th) * (C.ri - 1.2), C.cz - Math.cos(th) * (C.ri - 1.2)];
    bcmPart(P, q[0], q[1], m => {
      const yawA = Math.atan2(0 - q[0], 13 - q[1]), wx = C.cx + Math.sin(th) * (C.ri + 0.6), wz = C.cz - Math.cos(th) * (C.ri + 0.6);
      m.color('#4a4a52').shine(2); m.limb(q[0], 13.6, q[1], wx, 13.45, wz, 0.09, 0.09, { seg: 6 });
      m.push(); m.tf(q[0], 0, q[1], yawA); bcmLineArray(m, 0, 12.8, 0, 9, { top: 13.6, led: '#ffb347' }); m.pop();
      return {};
    });
    bcmPart(P, sd * 10.6, -2.1, m => { const c = bcmSubs(m, sd * 10.6, -2.1, 2, 2, { y: C.deck, led: '#7aff5a' }); return { cols: [c] }; });
  }
  bcmPart(P, 0, C.cz - C.ro, m => {
    for (let k = 0; k < 9; k++) { const th = (k - 4) * 0.36, q = [C.cx + Math.sin(th) * (C.ri + 0.3), C.cz - Math.cos(th) * (C.ri + 0.3)]; bcmMover(m, q[0], 13.45, q[1], ['#ffb347', '#7aff5a', '#38d8ff'][k % 3]); }
    return {};
  });
  // spectators on the gallery + the coliseum DJ + the crowd
  const stC = bcmStage(P, 'coliseum', 'The Coliseum', 0, C.deck + 0.5, -9.35, 0, [0, 13, 9], { genre: 'house', bpm: 124 });
  bcmDJ(P, stC, { id: P.id + '_djColiseum', name: 'DJ GLADIOLA', seed: 21, lines: ['Welcome to the coliseum. The lions are all DJs.', 'When the car docks, the stage gets longer and the bass gets wider.'] });
  bcmCrowd(P, 0, 13, 8, 12, { face: [0, -8], lines: ['When the car docks the whole stage doubles!', 'I come for the domes, I stay for the coliseum.', 'Root Society is LOUD. I can feel it in my teeth.'] });
  if (gal) for (const a of [-1.178, -0.6545, 0.6545, 1.178]) {
    const rr = (C.ri + C.ro) / 2, x = C.cx + Math.sin(a) * rr, z = C.cz - Math.cos(a) * rr;
    bcmCrowd(P, x, z, 0.2, 1, { y: 4.62, face: [C.cx, C.cz], behavior: 'dance', extra: { chat: ['Best seat in the coliseum!', 'Up here the bass hits you twice.'] } });
  }
  bcmLaser(P, 0, 12.6, mz + 0.8, 0, { n: 7, spread: 1.7, cols: [[1, 0.65, 0.2], [0.5, 1, 0.35], [0.25, 0.9, 1]], len: 70, tilt: 0.08 });
  bcmPL(P, 0, 7, -4, 20, ['#ffb347', '#7aff5a', '#38d8ff', '#ff7a3a'], { i: 1.6 });
  bcmPL(P, 0, 4, 10, 16, ['#ff9a3a', '#38d8ff', '#7aff5a'], { i: 1.1, ph: 1 });
  for (const a of [-0.95, -0.35, 0.35, 0.95]) bcmFlame(P, C.cx + Math.sin(a) * (C.ri + 1.2), 13.5, C.cz - Math.cos(a) * (C.ri + 1.2), { every: 16, ph: 0, h: 6, big: true });
  for (const a of [-0.95, -0.35, 0.35, 0.95]) bcmPart(P, C.cx + Math.sin(a) * (C.ri + 1.2), C.cz - Math.cos(a) * (C.ri + 1.2), m => { const x = C.cx + Math.sin(a) * (C.ri + 1.2), z = C.cz - Math.cos(a) * (C.ri + 1.2); m.color('#4a3a2c').shine(2); m.push(); m.tf(x, 13.25, z); m.lathe([[0.15, 0], [0.2, 0.2], [0.55, 0.35], [0.6, 0.45], [0.5, 0.45], [0, 0.35]], { seg: 14 }); m.pop(); m.color('#ff9a3a', 1); m.ball(x, 13.7, z, 0.2, { seg: 8, rings: 5 }); m.emissive(0); return { lights: [{ x, y: 13.9, z, s: 1.1, c: '#ff9a3a' }] }; });
  bcmPool(P, 0, -4, 20, '#ffb347', 0.5); bcmPool(P, 0, 13, 16, '#7aff5a', 0.32);
  bcmArea(P, 'coliseum', 'The Coliseum', 0, 4, { hx: 17, hz: 20 });
  bcmSpot(P, 'stage', 0, C.deck, -5); bcmSpot(P, 'booth', 0, C.deck + 0.5, -9.35); bcmSpot(P, 'plaza', 0, 0, 14, Math.PI); bcmSpot(P, 'dock', K.DOCK[0], C.deck, K.DOCK[1], K.DOCK[2]);
  bcmSpot(P, 'gallery', 0, 4.6, C.cz - (C.ri + C.ro) / 2, 0); bcmSpot(P, 'galleryRamp', 26.5, 0, C.cz - Math.cos(C.a - (C.a / 7) * 1.5) * C.ro, -Math.PI / 2);
  /* ---------- the three dome stages ---------- */
  for (const D of K.DOMES) bcmRSDome(P, D);
  /* ---------- the shade lounge ---------- */
  bcmRSLounge(P);
  /* ---------- the gate and the street front ---------- */
  bcmPart(P, 0, 54, m => {
    const cols = [], lights = [];
    // two twisted root pillars that meet in an arch
    for (const sd of [-1, 1]) for (let s = 0; s < 3; s++) {
      const pts = []; for (let k = 0; k <= 14; k++) { const t = k / 14, a = t * Math.PI * 0.55 + s * 2.1, base = sd * 4.6; pts.push([base * (1 - t * t * 0.98) + Math.sin(a * 3) * 0.35, t * 7.4 + Math.sin(t * Math.PI) * 0.2, 54 + Math.cos(a * 3) * 0.35]); }
      m.color(['#6a4a2c', '#5a3e24', '#7a5634'][s]).shine(1); bcmTube(m, pts, t => 0.32 - t * 0.12, { seg: 8 });
    }
    for (const sd of [-1, 1]) cols.push(bcmC.cyl(sd * 4.6, 54, 0.7, 0, 4));
    m.color('#ffb347', 1); for (let k = 0; k < 9; k++) { const t = k / 8, x = lerp(-4.2, 4.2, t), y = 7.2 - Math.pow(Math.abs(t - 0.5) * 2, 2) * 2.4; m.ball(x, y, 54.35, 0.13, { seg: 6, rings: 4 }); if (k % 2 === 0) lights.push({ x, y, z: 54.5, s: 0.8, c: k % 4 ? '#ffb347' : '#7aff5a' }); }
    m.emissive(0);
    bcmSignMesh(m, 'ROOT SOCIETY', { bg: '#2a1a0e', fg: '#ffd890', border: '#7aff5a', size: 56, glow: '#7aff5a' }, 0, 4.7, 54.1, 1.0, { glow: true, posts: false, frame: '#4a321e', maxW: 4.4 });
    m.color('#4a321e'); for (const sd of [-1, 1]) m.limb(sd * 1.6, 6.2, 54.05, sd * 1.4, 6.95, 54.1, 0.02, 0.02, { seg: 4 });
    // banners along the street front
    for (let k = -4; k <= 4; k++) { if (k === 0) continue; bcmFlagPole(m, k * 7.5, 57, 6.5, ['#7aff5a', '#ffb347', '#38d8ff', '#c87a3a'][(k + 8) % 4], { cap: '#ffb347', capE: 0.8 }); cols.push(bcmC.cyl(k * 7.5, 57, 0.08, 0, 6.5, { camPass: true })); }
    return { cols, lights };
  });
  // schedule board by the gate (our own DJs)
  bcmPart(P, 8.5, 51, m => { bcmSignMesh(m, 'ROOT SOCIETY · TONIGHT\nCOLISEUM  DJ GLADIOLA\n90 FT DOME  DJ TAPROOT\n60 FT DOME  DJ LOAM\n50 FT DOME  DJ SPROUT', { bg: '#1c140c', fg: '#ffe9b0', border: '#ffb347', size: 34 }, 8.5, 1.0, 51, 1.6, { yaw: -0.3, frame: '#4a321e' }); return { cols: [bcmC.box(8.5, 51, 1.8, 0.15, 0, 2.6, -0.3, { walk: false })] }; });
  bcmSpot(P, 'gate', 0, 0, 54, Math.PI);
  /* ---------- the tipi village + the 30 ft common dome ---------- */
  bcmRSVillage(P);
  /* ---------- the coliseum art car ---------- */
  bcmRSArtCar(P);
}

function bcmRSDome(P, D) {
  const r = D.ft * BCM_FT / 2, cx = D.x, cz = D.z, back = D.door + Math.PI, bx = cx + Math.sin(back) * r * 0.6, bz = cz + Math.cos(back) * r * 0.6;
  const fwd = D.door, big = D.ft >= 80;
  // the shell
  bcmPart(P, cx, cz, m => {
    m.push(); m.tf(cx, 0, cz);
    const res = bcmDome(m, { r, freq: 4, fabric: '#ece4d2', alt: '#ddd2bd', lining: D.lining, frame: '#c9ccd4', led: D.led, ledE: 0.85,
      doors: [{ yaw: D.door, w: big ? 4.6 : 3.8, h: big ? 4.0 : 3.4, col: '#3a3038', led: D.lc }],
      cover: (c, k) => c[1] > 0.2 || k % 3 !== 0,
      glowLining: (c, k) => (c[1] > 0.2 && c[1] < 0.85 && (k % 4 === 0 || k % 7 === 0)) ? 0.55 : 0,
      liningGlow: (c, k) => D.glow[k % D.glow.length] });
    m.pop();
    for (const c of res.cols) { c.x += cx; c.z += cz; }
    // floor: a big dance-floor disc + a glowing edge ring
    m.color('#3a2e28').shine(1); m.push(); m.tf(cx, 0, cz); m.lathe([[0, 0.05], [r - 0.6, 0.05], [r - 0.55, 0.02], [r - 0.5, 0]], { seg: 32 }); m.pop();
    return { cols: res.cols, lights: [{ x: cx, y: 0, z: cz, s: 0, c: D.lc, pool: r * 1.3, i: 0.5 }] };
  }, { noAO: true });
  // stage riser, booth, LED arc screen, subs, flown arrays, mirror ball
  bcmPart(P, bx, bz, m => {
    const cols = [], rr = r * 0.34, H = big ? 1.0 : 0.8;
    m.color('#2a2228').shine(1); m.push(); m.tf(bx, 0, bz); m.roundCyl(0, 0, 0, rr, H, 0.12, { seg: 28 }); m.pop();
    m.color(D.lc, 1); m.push(); m.tf(bx, H - 0.08, bz); m.torus(0, 0, 0, rr + 0.01, 0.035, { seg: 36, tseg: 4 }); m.pop(); m.emissive(0);
    cols.push(bcmC.cyl(bx, bz, rr, 0, H));
    const fb = [bx + Math.sin(fwd) * rr * 0.25, bz + Math.cos(fwd) * rr * 0.25];
    cols.push(...bcmBooth(m, fb[0], H, fb[1], fwd, { w: big ? 3.0 : 2.6, ca: D.led[0], cb: D.led[1 % D.led.length], body: '#1e1a20' }));
    // LED arc screen hugging the back wall (pixel columns, our own flowing pattern)
    const scr = big ? 18 : 12, sr = r * 0.86, h0 = H + 0.3, sh = big ? 4.2 : 3.0;
    for (let i = 0; i < scr; i++) {
      const a = back + (i / (scr - 1) - 0.5) * (big ? 1.25 : 1.2), ca = Math.sin(a), sa = Math.cos(a), rrr = Math.sqrt(Math.max(1, sr * sr - (h0 + sh / 2) * (h0 + sh / 2) * 0.35));
      const x = cx + ca * rrr, z = cz + sa * rrr;
      m.push(); m.tf(x, 0, z, a + Math.PI);
      m.color('#0c0c10').shine(1); m.roundBox(0, h0 + sh / 2, -0.08, 0.98 * (2 * rrr * Math.sin(0.6 / (scr - 1))) + 0.62, sh + 0.2, 0.12, 0.04);
      const ny = big ? 9 : 7;
      for (let j = 0; j < ny; j++) {
        const v = j / (ny - 1), u = i / (scr - 1), w2 = Math.sin(u * 6 + v * 4) + Math.sin(u * 13 - v * 2.5);
        const c = w2 > 0.9 ? D.glow[0] : w2 > 0.1 ? D.glow[1 % D.glow.length] : w2 > -0.6 ? D.glow[2 % D.glow.length] : null;
        if (!c) continue;
        const py = h0 + 0.2 + v * (sh - 0.4), hh = sh / ny * 0.39; m.color(c, 0.9); m.poly([[0.21, py - hh, 0.01], [0.21, py + hh, 0.01], [-0.21, py + hh, 0.01], [-0.21, py - hh, 0.01]], null, [0, py, -1]);
      }
      m.emissive(0);
      m.pop();
    }
    // subs at the riser front corners
    for (const sd of [-1, 1]) {
      const sa = fwd + sd * 0.95, sx = bx + Math.sin(sa) * (rr + 0.9), sz = bz + Math.cos(sa) * (rr + 0.9);
      m.push(); m.tf(sx, 0, sz, fwd); const c = bcmSubs(m, 0, 0, 2, big ? 3 : 2, { led: D.lc }); m.pop();
      cols.push(bcmC.box(sx, sz, c.hx, c.hz, 0, c.y1, fwd));
    }
    // flown arrays from the frame, mirror ball at the centre
    for (const sd of [-1, 1]) {
      const sa = fwd + sd * 1.1, ax = bx + Math.sin(sa) * rr * 1.1, az = bz + Math.cos(sa) * rr * 1.1, top = Math.sqrt(Math.max(4, r * r - Math.pow(Math.hypot(ax - cx, az - cz), 2))) - 0.3;
      m.push(); m.tf(ax, 0, az, fwd); bcmLineArray(m, 0, Math.min(top - 0.6, big ? 8.5 : 6.2), 0, big ? 8 : 6, { top, led: D.lc }); m.pop();
    }
    bcmMirrorBall(m, cx, r * 0.62, cz, big ? 0.85 : 0.6, r - 0.1);
    return { cols, lights: [{ x: fb[0], y: H + 1.5, z: fb[1], s: 1.2, c: D.lc }] };
  });
  const st = bcmStage(P, D.id, D.name, fb2(bx, bz, fwd, r * 0.34 * 0.25 - 0.62).x, (big ? 1.0 : 0.8), fb2(bx, bz, fwd, r * 0.34 * 0.25 - 0.62).z, fwd, [cx + Math.sin(fwd) * r * 0.15, cz + Math.cos(fwd) * r * 0.15, r * 0.45], { genre: D.id === 'dome60' ? 'techno' : D.id === 'dome50' ? 'breaks' : 'melodic' });
  bcmDJ(P, st, { id: P.id + '_' + D.id + 'DJ', name: D.dj, seed: D.seed, lines: ['The dome holds the bass in like a hug.', 'Look up. The whole dome is breathing.'] });
  bcmCrowd(P, cx + Math.sin(fwd) * r * 0.12, cz + Math.cos(fwd) * r * 0.12, r * 0.42, D.crowd, { face: [bx, bz], chat: ['This dome is the size of my whole camp!', 'I came in for water. That was three hours ago.', 'Look at the roof! It\'s like being inside a disco ball!'] });
  bcmDomeCam(P, cx, cz, r);
  bcmArea(P, D.id, D.name, cx, cz, { r: r - 0.2 }, { dome: true });
  bcmSpot(P, D.id, cx, 0, cz, fwd); bcmSpot(P, D.id + 'Door', cx + Math.sin(fwd) * (r + 2), 0, cz + Math.cos(fwd) * (r + 2), fwd + Math.PI);
  bcmPL(P, cx, r * 0.5, cz, r * 1.35, D.glow, { i: big ? 2.0 : 1.6, every: 8 });
  bcmLaser(P, bx, (big ? 1.0 : 0.8) + 2.6, bz, fwd, { n: big ? 6 : 4, spread: 1.5, len: r * 1.25, tilt: 0.3, wob: 0.2, cols: D.glow.slice(0, 3).map(c => burnsRGBf(c)), sw: 0.35 });
  P.balls.push({ x: P.F.wx(cx, cz), y: P.F.wy(r * 0.62), z: P.F.wz(cx, cz), r: r * 0.92, col: burnsRGBf(D.glow[0]) });
  function fb2(x, z, a, d) { return { x: x + Math.sin(a) * d, z: z + Math.cos(a) * d }; }
}

function bcmRSLounge(P) {
  const lx = 36, lz = 42, cols = [];
  bcmRug(P, lx - 2, lz, 4.5, 3, 0.2, 'rgba(150,50,40,0.85)'); bcmRug(P, lx + 2.6, lz + 1.4, 4, 2.8, -0.3, 'rgba(50,80,120,0.85)'); bcmRug(P, lx + 0.5, lz - 2.8, 3.6, 2.4, 0.5, 'rgba(160,110,40,0.85)');
  bcmPart(P, lx, lz, m => {
    const poles = [[26, 36, 6.0], [36, 35, 6.2], [46, 36, 6.0], [26, 48, 6.0], [36, 49, 6.2], [46, 48, 6.0]];
    m.color('#7a6048').shine(1);
    for (const [x, z, h] of poles) { m.limb(x, 0, z, x, h, z, 0.12, 0.09, { seg: 8 }); m.color('#ffb347', 0.9); m.ball(x, h + 0.1, z, 0.12, { seg: 6, rings: 4 }); m.emissive(0); m.color('#7a6048'); cols.push(bcmC.cyl(x, z, 0.14, 0, h, { camPass: true })); }
    bcmSail(m, [26, 5.8, 36], [36, 3.7, 35], [36, 5.8, 49], [26, 3.7, 48], { cols: ['#efe4cc', '#e2c8a0', '#efe4cc', '#c8885a'], under: '#d8c4a4', sag: 0.3 });
    bcmSail(m, [36, 6.0, 35], [46, 3.9, 36], [46, 6.0, 48], [36, 3.9, 49], { cols: ['#c8885a', '#efe4cc', '#e2c8a0', '#efe4cc'], under: '#c8b090', sag: 0.3 });
    // a drape along the back
    m.color('#8a3a2a'); m.surf(10, 3, (u, v, t) => { t[0] = lerp(26, 46, u); t[1] = lerp(3.4, 0.4, v) - Math.sin(u * Math.PI * 4) * 0.12 * (1 - v); t[2] = 49.6 + Math.sin(u * Math.PI * 8) * 0.18; }, {});
    m.surf(10, 3, (u, v, t) => { t[0] = lerp(26, 46, u); t[1] = lerp(3.4, 0.4, v) - Math.sin(u * Math.PI * 4) * 0.12 * (1 - v); t[2] = 49.6 + Math.sin(u * Math.PI * 8) * 0.18; }, { flip: true });
    // couches in a U around low tables, poufs, the chai bar
    cols.push(bcmCouch(m, 31, 45.5, Math.PI * 0.85, '#8a3a4a', { pillow: '#e8b04a' }), bcmCouch(m, 35, 46.8, Math.PI, '#3a5a8a', { pillow: '#e86a4a' }), bcmCouch(m, 39.5, 45.6, -Math.PI * 0.85, '#6a5a2a', { pillow: '#7aff5a' }), bcmCouch(m, 41.5, 41.5, -Math.PI / 2, '#7a3a6a'));
    for (const [x, z, c] of [[33, 41, '#c86a3a'], [37.5, 40.5, '#3a8a6a'], [30.5, 41.8, '#c8a03a']]) cols.push(bcmPouf(m, x, z, c));
    m.color('#6a4a30').shine(1); m.push(); m.tf(35.5, 0, 43.5); m.roundCyl(0, 0, 0, 1.1, 0.42, 0.08, { seg: 20 }); m.pop(); cols.push(bcmC.cyl(35.5, 43.5, 1.1, 0, 0.42));
    m.color('#c8a070'); for (let k = 0; k < 4; k++) m.roundCyl(35.1 + (k % 2) * 0.6, 0.42, 43.2 + (k >> 1) * 0.5, 0.06, 0.12, 0.02, { seg: 8 });
    // chai bar: a curved counter with an LED kick
    m.push(); m.tf(43.4, 0, 39.6, -0.5);
    m.color('#7a5234').shine(1); m.roundBox(0, 0.55, 0, 3.2, 1.1, 0.8, 0.12, { top: '#c8a070' });
    m.color('#7aff5a', 1); m.roundBox(0, 0.08, 0.41, 3.0, 0.05, 0.03, 0.01); m.emissive(0);
    m.color('#c8c8d0').shine(3); m.roundCyl(-0.9, 1.1, 0, 0.18, 0.5, 0.05, { seg: 12 }); m.color('#e8e0d0').shine(1); for (let k = 0; k < 5; k++) m.roundCyl(-0.3 + k * 0.25, 1.1, 0.1, 0.05, 0.1, 0.015, { seg: 8 });
    m.pop(); m.shine(0);
    cols.push(bcmC.box(43.4, 39.6, 1.6, 0.4, 0, 1.1, -0.5));
    bcmSignMesh(m, 'CHAI · WATER · HUGS', { bg: '#2a1a10', fg: '#ffd890', border: '#7aff5a', size: 36, glow: '#ffb347' }, 43.6, 1.9, 38.8, 0.55, { yaw: -0.5, glow: true, posts: false });
    // lanterns + string lights
    const lights = [];
    for (const [x, y, z, c] of [[30, 4.2, 40, '#ffcf8a'], [33, 4.6, 44, '#ff9a5a'], [39, 4.5, 41, '#ffcf8a'], [42, 4.1, 45, '#ff9a5a'], [36, 4.9, 38.5, '#ffe6a8']]) { bcmLantern(m, x, y, z, c, 1.1); lights.push({ x, y, z, s: 0.8, c }); }
    bcmStringLights(m, [26, 5.6, 36], [46, 5.6, 36], 16, ['#ffcf8a', '#ffb347', '#7aff5a'], 0.6, P, lights);
    bcmStringLights(m, [26, 5.6, 48], [46, 5.6, 48], 16, ['#ffcf8a', '#ffb347', '#38d8ff'], 0.6, P, lights);
    lights.push({ x: 36, y: 0, z: 42, s: 0, c: '#ffb070', pool: 13, i: 0.5 });
    return { cols, lights };
  });
  for (const [x, z, yaw, seed] of [[31.3, 45.9, Math.PI * 0.85, 4], [35, 47.1, Math.PI, 11], [39.2, 45.9, -Math.PI * 0.85, 17]]) {
    const a = P.api.npc({ type: 'burner', seed, x: P.F.wx(x, z), z: P.F.wz(x, z), y: P.F.wy(0.12), fixedY: true, yaw: P.F.rot + yaw, behavior: 'sit', chat: ['Chai? It\'s free. Everything\'s free. That\'s the whole thing.', 'I\'m resting my ears between domes.'] });
    P.actors.push(a);
  }
  bcmArea(P, 'lounge', 'The Lounge', lx, lz, { hx: 11, hz: 8 });
  bcmSpot(P, 'lounge', lx, 0, lz - 4, Math.PI);
  bcmPL(P, 36, 3.5, 42, 12, ['#ffb070'], { i: 0.9, pulse: false });
}

function bcmRSVillage(P) {
  const V = BCM_RS.VILLAGE, canv = ['#ece0c4', '#e4d6b8', '#f0e6cc', '#e8d8bc'], bands = [['#8a4a2a', '#2a6a5a'], ['#2a4a7a', '#c8882a'], ['#6a2a3a', '#4a7a3a'], ['#3a5a6a', '#b85a2a']];
  BCM_RS_TIPIS.forEach(([rr, a, i]) => {
    const x = V.x + Math.sin(a) * rr, z = V.z + Math.cos(a) * rr, yaw = Math.atan2(V.x - x, V.z - z), brady = i === BCM_RS_BRADY;
    const big = brady ? 2.8 : 2.4 + (i % 3) * 0.2, h = big * 2.25;
    bcmPart(P, x, z, m => {
      bcmTipi(m, x, z, yaw, { r: big, h, canvas: canv[i % 4], band: bands[i % 4][0], band2: bands[i % 4][1],
        pattern: (mm, r, hh) => { if (mm.lo) return; mm.color(bands[(i + 1) % 4][0]); for (let k = 0; k < 8; k++) { const t = k / 8 * TAU; mm.push(); mm.tf(Math.sin(t) * r * 0.86, hh * 0.08, Math.cos(t) * r * 0.86, t, -0.42, 0); mm.ellipsoid(0, 0, 0.02, 0.14, 0.14, 0.03, { seg: 6, rings: 2, phi1: Math.PI / 2 }); mm.pop(); } } });
      const cols = [], lights = [];
      if (brady) {
        // Brady's tipi: an inner canvas lining, a bedroll, a lantern, his backpack; walls with a door gap
        m.push(); m.tf(x, 0, z, yaw);
        m.color('#d8c49c'); m.lathe([[big - 0.06, 0.02], [big * 0.66 - 0.06, h * 0.36], [big * 0.1 - 0.03, h * 0.9]], { seg: 18, flip: true });
        m.color('#3a5a8a').shine(1); m.roundBox(-0.6, 0.12, -0.7, 0.9, 0.22, 2.0, 0.1); m.color('#e8e0c8'); m.roundBox(-0.6, 0.27, -1.45, 0.7, 0.14, 0.42, 0.07);
        m.color('#c86a2a'); m.roundBox(0.9, 0.35, -0.9, 0.55, 0.7, 0.35, 0.12); m.color('#8a4a1a'); m.roundBox(0.9, 0.62, -0.72, 0.45, 0.2, 0.06, 0.03);
        bcmLantern(m, 0, 2.2, 0, '#ffcf8a', 0.9); m.pop();
        lights.push({ x, y: 2.2, z, s: 1.0, c: '#ffcf8a' });
        for (let k = 0; k < 10; k++) {
          const a0 = k / 10 * TAU, a1 = (k + 1) / 10 * TAU, mid = (a0 + a1) / 2; if (Math.abs(BurnsM.wrap(mid)) < 0.45) continue;   // door at local +Z
          const p0 = [Math.sin(a0 + yaw) * big * 0.95, Math.cos(a0 + yaw) * big * 0.95], p1 = [Math.sin(a1 + yaw) * big * 0.95, Math.cos(a1 + yaw) * big * 0.95];
          cols.push(bcmC.wall(x + p0[0], z + p0[1], x + p1[0], z + p1[1], 0.3, 0, 2.6, { cover: true }));
        }
        const sx = x + Math.sin(yaw) * (big + 1.4) + Math.cos(yaw) * 1.6, sz = z + Math.cos(yaw) * (big + 1.4) - Math.sin(yaw) * 1.6;
        bcmSignMesh(m, 'BRADY\'S TIPI\n(HOME!)', { bg: '#f4e8c8', fg: '#3a2414', border: '#7aff5a', size: 38 }, sx, 0.9, sz, 0.9, { yaw: yaw, frame: '#5a3a22' });
        cols.push(bcmC.box(sx, sz, 0.75, 0.12, 0, 1.9, yaw, { walk: false }));
      } else cols.push(bcmC.cyl(x, z, big * 0.82, 0, 2.4));
      // a lantern post beside every other door
      if (i % 2 === 0 || brady) { const lx = x + Math.sin(yaw) * (big + 0.6) - Math.cos(yaw) * 1.2, lz = z + Math.cos(yaw) * (big + 0.6) + Math.sin(yaw) * 1.2; m.color('#5a4030').shine(1); m.limb(lx, 0, lz, lx, 1.9, lz, 0.05, 0.04, { seg: 6 }); m.limb(lx, 1.85, lz, lx + Math.sin(yaw) * 0.35, 1.95, lz + Math.cos(yaw) * 0.35, 0.025, 0.025, { seg: 4 }); bcmLantern(m, lx + Math.sin(yaw) * 0.4, 1.6, lz + Math.cos(yaw) * 0.4, i % 4 ? '#ffcf8a' : '#9aff7a', 0.8); lights.push({ x: lx + Math.sin(yaw) * 0.4, y: 1.6, z: lz + Math.cos(yaw) * 0.4, s: 0.6, c: '#ffcf8a', pool: 4, i: 0.35 }); }
      return { cols, lights };
    });
    if (brady) {
      const dx = x + Math.sin(yaw) * (big + 0.9), dz = z + Math.cos(yaw) * (big + 0.9);
      const q = P.F.w(dx, 0, dz); P.spots.bradyTipi = { x: q[0], y: q[1], z: q[2], yaw: P.F.rot + yaw + Math.PI };
      bcmSpot(P, 'bradyTipiInside', x, 0, z, yaw);
      bcmArea(P, 'bradyTipi', 'Brady\'s Tipi', x, z, { r: big * 0.9 }, { y1: P.F.y0 + 4 });
      bcmDomeCam(P, x, z, big * 0.98);
    }
  });
  // the 30 ft common dome: kitchen + meeting, a long table with benches, lanterns
  const r = 30 * BCM_FT / 2;
  bcmPart(P, V.x, V.z, m => {
    m.push(); m.tf(V.x, 0, V.z);
    const res = bcmDome(m, { r, freq: 2, fabric: '#efe6d2', alt: '#e2d6c0', lining: '#4a3424', frame: '#c9ccd4', led: ['#ffcf8a'], ledE: 0.8, rad: 0.05,
      doors: [{ yaw: 0, w: 2.8, h: 2.9, col: '#4a3428', led: '#ffcf8a' }, { yaw: Math.PI, w: 2.6, h: 2.6, col: '#4a3428' }], cover: (c, k) => c[1] > 0.12 || k % 2 === 0 });
    m.color('#7a5636').shine(1); m.roundBox(0, 0.76, 0, 1.0, 0.08, 4.4, 0.03); for (const sz of [-1.8, 1.8]) for (const sx of [-0.4, 0.4]) m.limb(sx, 0, sz, sx, 0.74, sz, 0.04, 0.04, { seg: 5 });
    for (const sx of [-1, 1]) { m.roundBox(sx * 0.95, 0.44, 0, 0.36, 0.06, 4.2, 0.02); for (const sz of [-1.7, 1.7]) m.limb(sx * 0.95, 0, sz, sx * 0.95, 0.42, sz, 0.035, 0.035, { seg: 5 }); }
    m.color('#e8e0d0'); for (let k = 0; k < 6; k++) m.roundCyl((k % 2 ? 0.25 : -0.25), 0.8, -1.6 + k * 0.62, 0.11, 0.03, 0.01, { seg: 10 });
    m.color('#5a4030'); m.roundBox(-3.2, 0.5, 0, 0.8, 1.0, 2.2, 0.08, { top: '#a8865c' }); m.color('#c8c8d0').shine(3); m.roundCyl(-3.2, 1.0, -0.5, 0.22, 0.28, 0.05, { seg: 12 }); m.shine(0);
    for (const [x, z] of [[0, -1.2], [0, 1.2], [1.8, 0], [-1.8, 0]]) bcmLantern(m, x, 2.4, z, '#ffcf8a', 0.9);
    m.pop();
    for (const c of res.cols) { c.x += V.x; c.z += V.z; }
    res.cols.push(bcmC.box(V.x, V.z, 0.5, 2.2, 0, 0.8), bcmC.box(V.x - 3.2, V.z, 0.4, 1.1, 0, 1.0));
    return { cols: res.cols, lights: [{ x: V.x, y: 2.4, z: V.z, s: 1.4, c: '#ffcf8a' }, { x: V.x, y: 0, z: V.z, s: 0, c: '#ffcf8a', pool: 9, i: 0.5 }] };
  }, {});
  bcmDomeCam(P, V.x, V.z, r);
  bcmArea(P, 'commonDome', 'The Common Dome', V.x, V.z, { r: r - 0.2 }, { dome: true });
  bcmArea(P, 'tipis', 'Tipi Village', V.x, V.z, { r: 27 });
  bcmSpot(P, 'village', V.x, 0, V.z + 9, Math.PI); bcmSpot(P, 'commonDome', V.x, 0, V.z, 0);
  for (const [x, z, seed, b] of [[V.x + 2.4, V.z + 1.2, 5, 'sit'], [V.x - 1.4, V.z - 1.1, 12, 'idle'], [V.x + 10, V.z + 7, 19, 'wander']]) {
    const a = P.api.npc({ type: 'burner', seed, x: P.F.wx(x, z), z: P.F.wz(x, z), yaw: P.F.rot + Math.PI, behavior: b, radius: 6, chat: ['Welcome home, tipi neighbour!', 'Dinner\'s at sunset. Bring a bowl.', 'Quiet hours are... a rumour.'] });
    P.actors.push(a);
  }
  bcmPL(P, V.x, 2.2, V.z, 10, ['#ffcf8a'], { i: 0.9, pulse: false });
  bcmPool(P, V.x, V.z, 24, '#ffb070', 0.32);
}

function bcmRSArtCar(P) {
  if (P.o.withArtCar === false || P.o.artCar === false) return;
  const tour = Array.isArray(P.o.drive) ? P.o.drive : (P.o.tour === 'short' ? BCM_RS.SHORT : BCM_RS.TOUR);
  const V = bcmVehicle(P.api, P.g, P, { build: m => bcmRSCar(m), dock: BCM_RS.DOCK, tour, core: BCM_RS.CORE, drive: P.o.drive !== false, dockTime: P.o.dockTime || 40, speed: P.o.carSpeed || 6.2, slowSpeed: 3,
    label: 'DRIVE', hornLines: ['THE COLISEUM IS MOVING!', 'Root Society on wheels!', 'Can I get on?!', 'Stage, but make it drive!'], driveHint: 'DRIVING THE COLISEUM CAR! JUMP = HORN · ACTION = FIRE · back it into the dock to park' });
  P.artCar = V;
  bcmRider(P, V, [0.05, 1.6, 0, -Math.PI / 2], { anim: 'dj', type: 'burner', seed: 2, name: 'DJ RHIZOME', lines: ['This stage has a driver\'s licence. Sort of.'] });
  bcmRider(P, V, [-1.45, 1.6, 2.4, -Math.PI / 2], { type: 'tutu', seed: 6, style: 2, name: 'DECK DANCER', lines: ['Hop on! The ramp\'s at the back.'] });
  bcmRider(P, V, [-1.45, 1.6, -2.4, -Math.PI / 2], { type: 'furcoat', seed: 8, style: 4, name: 'DECK DANCER', lines: ['We dock with the coliseum every lap. It\'s like a giant LEGO.'] });
  for (const sz of [-1, 1]) P.flames.push({ veh: V, at: [-1.55, 6.3, sz * 4.6], every: 8, ph: sz > 0 ? 0 : 4, h: 4 });
  P.routes.artCar = V.tour.pts;
  const st = { id: 'artCar', name: 'The Coliseum Car', camp: P, get booth() { const c = V.car, cc = Math.cos(c.yaw), s = Math.sin(c.yaw); return { x: c.x + 0.05 * cc, y: c.y + 1.6, z: c.z - 0.05 * s, yaw: c.yaw - Math.PI / 2 }; }, floor: null, bpm: P.bpm, genre: 'house', vehicle: V };
  P.stages.push(st);
}

// far LOD: the skyline silhouette (a few thousand vertices, glowing rings at night)
function bcmSilDome(m, x, z, r, fab, ring) {
  m.color(fab).shine(1); m.ellipsoid(x, 0, z, r, r, r, { seg: 12, rings: 5, phi1: Math.PI / 2 });
  m.color(ring, 0.9); m.push(); m.tf(x, 0.6, z); m.torus(0, 0, 0, r * 0.99, 0.12 + r * 0.008, { seg: 20, tseg: 3 }); m.pop();
  m.push(); m.tf(x, r * 0.5, z); m.torus(0, 0, 0, r * 0.866, 0.1 + r * 0.006, { seg: 18, tseg: 3 }); m.pop(); m.emissive(0);
}
function bcmSilRoot(m, P) {
  const C = BCM_RS.COL;
  for (const D of BCM_RS.DOMES) bcmSilDome(m, D.x, D.z, D.ft * BCM_FT / 2, '#e8dfcc', D.led[0]);
  bcmSilDome(m, BCM_RS.VILLAGE.x, BCM_RS.VILLAGE.z, 30 * BCM_FT / 2, '#e8dfcc', '#ffcf8a');
  m.push(); m.tf(C.cx, 0, C.cz, Math.PI); m.color('#d6c09a');
  m.lathe([[C.ro, 0], [C.ro, 13.3], [C.ri, 13.3], [C.ri, 0], [C.ro, 0]], { seg: 20, theta0: -C.a, theta1: C.a });
  m.color('#ffb347', 0.9); m.lathe([[C.ri - 0.05, 4.2], [C.ri - 0.05, 4.4]], { seg: 20, theta0: -C.a, theta1: C.a, flip: true }); m.color('#7aff5a', 0.9); m.lathe([[C.ri - 0.05, 8.3], [C.ri - 0.05, 8.5]], { seg: 20, theta0: -C.a, theta1: C.a, flip: true }); m.emissive(0);
  m.pop();
  m.color('#8a6c4c'); m.roundBox(0, 0.8, -3.5, 25.8, 1.6, 5.2, 0.2);
  m.color('#ffb347', 1); m.push(); m.tf(0, 8, C.cz - C.ri + 0.6, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 4.35, 0.25, { seg: 24, tseg: 3 }); m.pop(); m.emissive(0);
  for (const [rr, a] of BCM_RS_TIPIS) { const x = BCM_RS.VILLAGE.x + Math.sin(a) * rr, z = BCM_RS.VILLAGE.z + Math.cos(a) * rr; m.color('#e6d8bc'); m.push(); m.tf(x, 0, z); m.lathe([[2.5, 0], [0, 6.2]], { seg: 6 }); m.pop(); }
  const cols = BCM_RS.DOMES.map(D => bcmC.cyl(D.x, D.z, D.ft * BCM_FT / 2 * 0.8, 0, 6));
  cols.push(bcmC.cyl(C.cx, C.cz, C.ro, 0, 13.3));
  return { cols, lights: BCM_RS.DOMES.map(D => ({ x: D.x, y: D.ft * BCM_FT / 2 + 0.5, z: D.z, s: 2.2, c: D.led[0] })).concat([{ x: 0, y: 14, z: C.cz, s: 3, c: '#ffb347' }]) };
}
BCM_KINDS.rootSociety = {
  name: 'Root Society', short: 'Root Society', bpm: 124,
  desc: 'Three geodesic dome stages (90, 60 and 50 ft), an open-air coliseum stage with a docking stage art car, a shade lounge, and the 27-tipi village around the 30 ft common dome.',
  real: 'One of the largest and loudest sound camps. Its public dance space is set by its geodesic domes (a 90 ft main dome full of lighting and subwoofers, a 60 ft dome); the living area is about 27 tipis around a 30 ft common eating/meeting dome; it sleeps 100+. Per the owner: three dome stages, an outdoor coliseum stage, and a coliseum-styled art car that docks in front of it and drives around the playa.',
  foot: [-56, -80, 56, 60], radius: 82, height: 14, entrance: [0, 58, Math.PI], tourClear: [-80, -100, 80, 70],
  build: bcmBuildRoot, sil: bcmSilRoot
};

/* ======================= 2. PLAYGROUND =======================
   Real camp (facts): founded by DJ Carl Cox, first built in 2014; a huge production with a big main stage and a
   welcoming lounge (reported as the "Arrival" stage and the "Dune" lounge). Name-drop only: the founder appears as a
   name on the schedule board and in crowd chatter; no likeness, no lines.
   Our design: a festival-scale main stage (ground-support truss roof, a curved LED wall with our own "sunrise rings"
   art, side screens, flown line arrays, a cardioid sub line, CO2 jets), a front-of-house tower in the crowd, and a
   soft sand-coloured lounge of dune-like sails and seating mounds. Local layout (+Z = street):
     stage deck x ±17, z -26..-14 (2.0 m), LED wall z -24.5, FOH (0, 14), lounge (40, 4), entrance arch (0, 36) */
const BCM_PG = { DECK: 2.0, FRONT: -14, LOUNGE: [40, 4] };
function bcmBuildPlayground(api, g, P) {
  const K = BCM_PG, D = K.DECK;
  P.bpm = 126;
  const sun = (u, v) => { const d = Math.hypot((u - 0.5) * 2.3, (v - 0.18) * 1.35), ring = Math.floor(d * 9), band = Math.sin(v * 46) > 0.75;
    if (d < 0.16) return '#fff2c0'; if (band && d > 0.3) return null; return ['#ffd84a', '#ffb23a', '#ff7a2a', '#ff4f8a', '#d84fd8', '#9a6bff', '#5a7aff', '#38c8ff', '#38f2ff'][Math.min(8, ring)]; };
  bcmPaint(P, (c, Pt, S) => {
    const [px, pz] = Pt(0, 4);
    for (let k = 0; k < 5; k++) { c.strokeStyle = ['rgba(255,154,58,0.28)', 'rgba(255,79,138,0.24)', 'rgba(154,107,255,0.22)', 'rgba(56,200,255,0.22)', 'rgba(255,216,74,0.26)'][k]; c.lineWidth = 1.0 * S; c.beginPath(); c.arc(px, pz, (20 - k * 3.6) * S, 0, TAU); c.stroke(); }
    const gr = c.createRadialGradient(px, pz, 0, px, pz, 24 * S); gr.addColorStop(0, 'rgba(90,64,50,0.35)'); gr.addColorStop(1, 'rgba(90,64,50,0)'); c.fillStyle = gr; c.fillRect(px - 24 * S, pz - 24 * S, 48 * S, 48 * S);
  });
  // stage deck + wings + steps at the back corners
  bcmPart(P, 0, -20, m => {
    m.color('#16161c').shine(1); m.roundBox(0, D / 2, -20, 34, D, 12, 0.12, { top: '#22222a' });
    for (const sd of [-1, 1]) m.roundBox(sd * 20, 0.8, -21, 6, 1.6, 9, 0.1, { top: '#22222a' });
    m.color('#ffb23a', 1); m.roundBox(0, D - 0.1, K.FRONT + 0.01, 33.6, 0.06, 0.04, 0.015); m.emissive(0);
    const stair = [0, 1, 2].map(j => ({ z: -26.3 - j * 0.6, h: D * (3 - j) / 4 }));
    m.color('#2a2a32'); for (const q of stair) for (const sd of [-1, 1]) m.roundBox(sd * 13, q.h / 2, q.z, 2.4, q.h, 0.6, 0.04);
    return { cols: [bcmC.box(0, -20, 17, 6, 0, D), bcmC.box(-20, -21, 3, 4.5, 0, 1.6), bcmC.box(20, -21, 3, 4.5, 0, 1.6), ...stair.flatMap(q => [-1, 1].map(sd => bcmC.box(sd * 13, q.z, 1.2, 0.3, 0, q.h)))] };
  });
  // the curved LED wall (our "sunrise rings") + side portrait screens
  bcmPart(P, 0, -25, m => {
    m.push(); m.tf(0, 0, -24.6);
    bcmLEDWall(m, 0, D + 6.2, 0, 30, 10.8, 40, 15, sun, { curve: 60, gap: 0.1 });
    m.pop();
    for (const sd of [-1, 1]) { m.push(); m.tf(sd * 19.6, 0, -19, -sd * 0.35); bcmLEDWall(m, 0, D + 1.3 + 4.6, 0, 3.6, 9.2, 5, 13, (u, v) => (Math.sin(v * 20 + u * 3) > 0.2 ? (v > 0.5 ? '#ff4f8a' : '#ffb23a') : (v > 0.7 ? '#38c8ff' : null))); m.pop(); }
    return { cols: [bcmC.box(0, -24.7, 15.3, 0.4, 0, 13.6, 0, { walk: false })], lights: [{ x: 0, y: 7, z: -22, s: 9, c: '#ff9a5a' }] };
  }, { noAO: true });
  // ground-support truss roof: 4 towers, a perimeter grid, cross trusses, moving heads, flown arrays
  bcmPart(P, 0, -18, m => {
    const H = 16, cols = [];
    for (const [x, z] of [[-17.6, -13.4], [17.6, -13.4], [-17.6, -25.6], [17.6, -25.6]]) { bcmTruss(m, x, 0, z, x, H, z, 0.62, {}); cols.push(bcmC.box(x, z, 0.35, 0.35, 0, H, 0, { camPass: true, walk: false })); m.color('#2a2a30').shine(1); m.roundBox(x, 0.1, z, 1.3, 0.2, 1.3, 0.05); }
    bcmTruss(m, -17.6, H, -13.4, 17.6, H, -13.4, 0.62, {}); bcmTruss(m, -17.6, H, -25.6, 17.6, H, -25.6, 0.62, {});
    bcmTruss(m, -17.6, H, -25.6, -17.6, H, -13.4, 0.62, {}); bcmTruss(m, 17.6, H, -25.6, 17.6, H, -13.4, 0.62, {});
    for (const z of [-17.5, -21.5]) bcmTruss(m, -17.6, H, z, 17.6, H, z, 0.45, {});
    // roof skin (dark, pitched) above the grid
    m.color('#141418').shine(1); m.push(); m.tf(0, H + 0.45, -19.5); m.roundBox(0, 0, 0, 36.4, 0.22, 13.2, 0.08); m.pop();
    m.color('#ffb23a', 1); m.roundBox(0, H + 0.35, -12.85, 36.2, 0.08, 0.04, 0.02); m.emissive(0);
    for (let k = 0; k < 9; k++) bcmMover(m, -14 + k * 3.5, H - 0.32, -13.4, ['#ffd84a', '#ff4f8a', '#38c8ff'][k % 3], true);
    for (let k = 0; k < 7; k++) bcmMover(m, -12 + k * 4, H - 0.32, -17.5, ['#9a6bff', '#ffb23a'][k % 2], true);
    for (const sd of [-1, 1]) bcmLineArray(m, sd * 14.6, H - 1.2, -13.2, 12, { top: H - 0.2, led: '#ffb23a' });
    return { cols };
  }, { noAO: true });
  // cardioid sub line in front of the stage, front fills on the lip, CO2 jets
  bcmPart(P, 0, -12.6, m => {
    const cols = [];
    for (let k = 0; k < 8; k++) { const x = -14 + k * 4; cols.push(bcmSubs(m, x, -12.6, 2, 2, { led: k % 2 ? '#ff4f8a' : '#ffb23a' })); }
    for (let k = 0; k < 4; k++) bcmSpeaker(m, -9 + k * 6, D, -14.6, 0.8, 0.4, 0.6, { cones: 1 });
    for (const x of [-12, -6, 6, 12]) { m.color('#c8c8d0').shine(3); m.push(); m.tf(x, D, -14.8); m.roundCyl(0, 0, 0, 0.18, 0.9, 0.05, { seg: 12 }); m.pop(); m.color('#38c8ff', 1); m.ball(x, D + 0.95, -14.8, 0.08, { seg: 6, rings: 4 }); m.emissive(0); }
    return { cols };
  });
  // the DJ booth on a riser
  bcmPart(P, 0, -18.4, m => {
    m.color('#202028').shine(1); m.roundBox(0, D + 0.3, -18.8, 8, 0.6, 4, 0.1, { top: '#2c2c36' });
    m.color('#ffb23a', 1); m.roundBox(0, D + 0.55, -16.79, 7.8, 0.05, 0.03, 0.01); m.emissive(0);
    const cols = bcmBooth(m, 0, D + 0.6, -17.9, 0, { w: 3.4, ca: '#ffb23a', cb: '#38c8ff', body: '#141418', ledFn: (u, v) => { const s = Math.sin(u * 14 - v * 4); return s > 0.4 ? '#ffd84a' : s > -0.2 ? '#ff4f8a' : null; } });
    cols.push(bcmC.box(0, -18.8, 4, 2, 0, D + 0.6));
    return { cols };
  });
  const st = bcmStage(P, 'main', 'Main Stage', 0, D + 0.6, -18.65, 0, [0, 4, 11], { genre: 'techno', bpm: 126 });
  bcmDJ(P, st, { id: P.id + '_dj', name: 'DJ HALF MOON', seed: 4, lines: ['Warm-up set. The headliner\'s on at midnight.', 'Feel that sub line? That\'s eight stacks saying hello.'] });
  // FOH tower in the crowd
  bcmPart(P, 0, 16, m => {
    const cols = [], h = 2.6;
    for (const [x, z] of [[-1.6, 14.6], [1.6, 14.6], [-1.6, 17.4], [1.6, 17.4]]) bcmTruss(m, x, 0, z, x, 5.4, z, 0.3, {});
    m.color('#2a2a30').shine(1); m.roundBox(0, h, 16, 3.6, 0.16, 3.2, 0.04, { top: '#3a3a44' });
    m.color('#1a1a20'); m.roundBox(0, 5.5, 16, 4.2, 0.18, 3.8, 0.06);
    m.color('#2a2a32').shine(2); m.roundBox(0, h + 0.5, 15.4, 2.2, 0.9, 0.8, 0.06); m.color('#38c8ff', 1); for (let k = 0; k < 10; k++) m.roundBox(-0.9 + k * 0.2, h + 0.98, 15.3, 0.12, 0.03, 0.4, 0.01); m.emissive(0);
    m.color('#3a3a44'); m.limb(-1.6, h, 17.4, -1.6, h + 1.1, 17.4, 0.03, 0.03, { seg: 4 }); m.limb(-1.6, h + 1.1, 17.4, 1.6, h + 1.1, 17.4, 0.03, 0.03, { seg: 4 });
    for (let k = 0; k < 4; k++) { m.color('#3a3a44').shine(1); m.roundBox(2.3, (k + 0.5) * 0.65, 18.2 - k * 0.0, 0.9, 0.12, 0.7, 0.03); }
    cols.push(bcmC.box(0, 16, 1.8, 1.6, h - 0.16, h), bcmC.box(0, 15.4, 1.1, 0.4, h, h + 0.95));
    for (let k = 0; k < 4; k++) cols.push(bcmC.box(2.3, 18.2, 0.45, 0.35, 0, (k + 1) * 0.65));
    for (const [x, z] of [[-1.6, 14.6], [1.6, 14.6], [-1.6, 17.4], [1.6, 17.4]]) cols.push(bcmC.cyl(x, z, 0.22, 0, 5.4, { camPass: true }));
    return { cols, lights: [{ x: 0, y: h + 1.2, z: 15.3, s: 0.8, c: '#38c8ff' }] };
  });
  // entrance arch (truss with an LED sign) + the schedule board (the only place the founder appears)
  bcmPart(P, 0, 36, m => {
    for (const sd of [-1, 1]) bcmTruss(m, sd * 5, 0, 36, sd * 5, 6.4, 36, 0.5, {});
    bcmTruss(m, -5.3, 6.6, 36, 5.3, 6.6, 36, 0.5, {});
    bcmSignMesh(m, 'PLAYGROUND', { bg: '#0e0a18', fg: '#ffd84a', border: '#ff9a3a', size: 60, glow: '#ff9a3a' }, 0, 7.0, 36.3, 1.3, { glow: true, posts: false, maxW: 9, frame: '#141418' });
    m.color('#ff9a3a', 1); for (const sd of [-1, 1]) m.limb(sd * 5, 0.2, 36.32, sd * 5, 6.2, 36.32, 0.04, 0.04, { seg: 4 }); m.emissive(0);
    bcmSignMesh(m, 'PLAYGROUND · TONIGHT\nMAIN STAGE\n10PM  DJ HALF MOON\nMIDNIGHT  CARL COX\n· TILL SUNRISE ·\nTHE LOUNGE: ALL NIGHT', { bg: '#141020', fg: '#ffffff', border: '#ffd84a', size: 34, glow: '#ffd84a' }, 8.5, 0.9, 33.5, 2.0, { yaw: -0.35, glow: true, frame: '#202028' });
    return { cols: [bcmC.cyl(-5, 36, 0.4, 0, 6.6, { camPass: true }), bcmC.cyl(5, 36, 0.4, 0, 6.6, { camPass: true }), bcmC.box(8.5, 33.5, 1.9, 0.15, 0, 2.9, -0.35, { walk: false })], lights: [{ x: 0, y: 7.6, z: 36.6, s: 2.2, c: '#ffd84a' }] };
  });
  bcmPlaygroundLounge(P);
  // crowd, lasers, lights, smoke
  bcmCrowd(P, 0, 3, 10, 14, { face: [0, -18], lines: ['Is Carl Cox really on at midnight?!', 'This LED wall is bigger than my apartment.', 'I\'ve been front row since the sun went down.', 'The sound here is so clean you could eat off it.'] });
  bcmLaser(P, -10, 15.4, -13.6, 0.2, { n: 6, spread: 1.4, cols: [[1, 0.6, 0.15], [1, 0.25, 0.6], [0.3, 0.8, 1]], len: 75, tilt: 0.06, ph: 0 });
  bcmLaser(P, 10, 15.4, -13.6, -0.2, { n: 6, spread: 1.4, cols: [[0.3, 0.8, 1], [1, 0.85, 0.3], [0.65, 0.4, 1]], len: 75, tilt: 0.06, ph: 2 });
  bcmLaser(P, 0, D + 1.2, -15.6, 0, { n: 9, spread: 2.2, cols: [[0.2, 1, 0.5], [1, 0.3, 0.8]], len: 60, tilt: 0.12, ph: 4, rate: 1.1 });
  bcmPL(P, 0, 9, -12, 22, ['#ffb23a', '#ff4f8a', '#38c8ff', '#9a6bff'], { i: 1.8 });
  bcmPL(P, 0, 5, 6, 18, ['#ff7a2a', '#38c8ff', '#ffd84a'], { i: 1.2, ph: 2 });
  for (const x of [-12, -6, 6, 12]) P.co2.push(P.F.w(x, D + 1.0, -14.8));
  bcmPool(P, 0, -6, 22, '#ff9a5a', 0.5); bcmPool(P, 0, 6, 16, '#9a6bff', 0.3);
  bcmArea(P, 'main', 'Main Stage', 0, -2, { hx: 20, hz: 26 });
  bcmSpot(P, 'stage', 0, D, -16); bcmSpot(P, 'booth', 0, D + 0.6, -18.65); bcmSpot(P, 'floor', 0, 0, 4, Math.PI); bcmSpot(P, 'foh', 0, 2.6, 16, Math.PI); bcmSpot(P, 'gate', 0, 0, 36, Math.PI); bcmSpot(P, 'schedule', 8.5, 0, 33.5, Math.PI);
}
// the lounge: dune-like sails on curved ribs, soft seating mounds, a sand-and-brass bar, lanterns
function bcmPlaygroundLounge(P) {
  const [lx, lz] = BCM_PG.LOUNGE;
  bcmPaint(P, (c, Pt, S) => { const [px, pz] = Pt(lx, lz); const gr = c.createRadialGradient(px, pz, 0, px, pz, 14 * S); gr.addColorStop(0, 'rgba(232,206,160,0.6)'); gr.addColorStop(1, 'rgba(232,206,160,0)'); c.fillStyle = gr; c.fillRect(px - 14 * S, pz - 14 * S, 28 * S, 28 * S); });
  bcmRug(P, lx - 1, lz + 1, 5, 3.4, 0.15, 'rgba(180,120,70,0.8)', 'rgba(255,230,180,0.7)');
  bcmPart(P, lx, lz, m => {
    const cols = [], lights = [];
    // three dune sails: long, low, wavy surfaces on curved ribs
    const dune = (x0, z0, len, wid, h, yaw, col) => {
      m.push(); m.tf(x0, 0, z0, yaw);
      const f = (u, v, t) => { const x = (u - 0.5) * len, z = (v - 0.5) * wid, crest = Math.pow(Math.sin(u * Math.PI), 0.6) * (0.75 + 0.25 * Math.sin(u * 7)); t[0] = x; t[1] = 2.5 + h * 0.45 * crest * (1 - Math.pow(v - 0.5, 2) * 2.2) + Math.sin(u * 9 + v * 2) * 0.12; t[2] = z + Math.sin(u * 5) * 0.6; };
      const stripe = (u) => Math.floor(u * 7) % 2 ? col : shade(col, 0.12);
      m.color(col).shine(0); m.surf(m.lo ? 8 : 16, m.lo ? 4 : 6, f, { colFn: stripe }); m.color(shade(col, -0.25)); m.surf(m.lo ? 8 : 16, m.lo ? 4 : 6, f, { flip: true, colFn: u => shade(stripe(u), -0.22) });
      m.color('#b89a68').shine(2); for (const u of [0.15, 0.5, 0.85]) { const t0 = [0, 0, 0], t1 = [0, 0, 0]; f(u, 0, t0); f(u, 1, t1); m.limb(t0[0], 0, t0[2], t0[0], t0[1], t0[2], 0.07, 0.06, { seg: 6 }); m.limb(t1[0], 0, t1[2], t1[0], t1[1], t1[2], 0.07, 0.06, { seg: 6 }); }
      m.pop(); m.shine(0);
    };
    dune(lx - 2, lz - 1, 14, 6.5, 3.6, 0.15, '#ead2a6'); dune(lx + 4, lz + 5, 11, 5.5, 3.0, -0.5, '#e2c290'); dune(lx - 5, lz + 6, 9, 5, 2.6, 0.9, '#f0dcb4');
    // seating mounds with cushions
    for (const [x, z, r, c] of [[lx - 4, lz + 1.5, 1.4, '#d8b07a'], [lx - 0.5, lz + 3.5, 1.2, '#cfa06a'], [lx + 3, lz + 0.5, 1.3, '#d8b07a'], [lx, lz - 2.6, 1.1, '#c89860']]) {
      m.color(c).shine(0); m.ellipsoid(x, 0, z, r, 0.55, r, { seg: 14, rings: 5, phi1: Math.PI / 2 });
      m.color(['#c8483a', '#3a6a9a', '#e8a83a'][Math.abs(Math.round(x + z)) % 3]).shine(1); m.roundBox(x, 0.58, z, r * 0.9, 0.16, r * 0.9, 0.08); m.shine(0);
      cols.push(bcmC.cyl(x, z, r * 0.9, 0, 0.62));
    }
    // the bar: a curved sand counter with brass trim and an LED kick
    m.push(); m.tf(lx + 6.2, 0, lz - 3.4, -0.9);
    m.color('#cfae7a').shine(1); m.lathe([[3.0, 0], [3.0, 1.1], [3.4, 1.15], [3.4, 1.2], [2.4, 1.2], [2.4, 1.1], [2.5, 0]], { seg: 16, theta0: -0.7, theta1: 0.7 });
    m.color('#ffb23a', 1); m.lathe([[3.05, 0.06], [3.05, 0.12]], { seg: 16, theta0: -0.7, theta1: 0.7 }); m.emissive(0);
    m.color('#c8c8d0').shine(3); for (let k = 0; k < 4; k++) { const a = -0.5 + k * 0.33; m.roundCyl(Math.sin(a) * 2.9, 1.2, Math.cos(a) * 2.9, 0.05, 0.22, 0.02, { seg: 8 }); }
    m.pop(); m.shine(0);
    cols.push(bcmC.box(lx + 6.2 + Math.sin(-0.9) * 2.7, lz - 3.4 + Math.cos(-0.9) * 2.7, 1.9, 0.45, 0, 1.2, -0.9));
    for (const [x, y, z, c] of [[lx - 3, 3.2, lz - 1, '#ffcf8a'], [lx + 1.5, 3.5, lz - 0.5, '#ffb070'], [lx + 3.5, 2.8, lz + 4.5, '#ffcf8a'], [lx - 4.5, 2.4, lz + 5.5, '#ffe0a8']]) { bcmLantern(m, x, y, z, c, 1.1); lights.push({ x, y, z, s: 0.8, c }); }
    bcmSignMesh(m, 'THE LOUNGE\nCHILL · WATER · STARS', { bg: '#2a1c10', fg: '#ffe0a8', border: '#ffb23a', size: 34, glow: '#ffb070' }, lx - 7.5, 0.8, lz + 7.5, 1.0, { yaw: 2.4, glow: true, frame: '#5a4028' });
    cols.push(bcmC.box(lx - 7.5, lz + 7.5, 1.0, 0.12, 0, 1.9, 2.4, { walk: false }));
    lights.push({ x: lx, y: 0, z: lz + 1, s: 0, c: '#ffb070', pool: 12, i: 0.5 });
    return { cols, lights };
  });
  for (const [x, z, yaw, seed] of [[lx - 4, lz + 1.5, 2.6, 13], [lx + 3, lz + 0.5, -2.2, 20], [lx, lz - 2.6, 0.3, 9]]) P.actors.push(P.api.npc({ type: 'burner', seed, x: P.F.wx(x, z), z: P.F.wz(x, z), y: P.F.wy(0.66), fixedY: true, yaw: P.F.rot + yaw, behavior: 'sit', chat: ['The lounge is where you go to hear yourself think. Then you go back.', 'Is it midnight yet? I can\'t miss the headliner.'] }));
  bcmArea(P, 'lounge', 'The Lounge', lx, lz + 1, { r: 10 });
  bcmSpot(P, 'lounge', lx - 6, 0, lz + 2, -Math.PI / 2);
  bcmPL(P, lx, 3, lz + 1, 12, ['#ffb070'], { i: 0.8, pulse: false });
}
function bcmSilPlayground(m, P) {
  const D = BCM_PG.DECK;
  m.color('#16161c'); m.roundBox(0, D / 2, -20, 34, D, 12, 0.2);
  m.color('#ff7a2a', 0.9); m.roundBox(0, D + 6.2, -24.6, 30, 10.8, 0.4, 0.1); m.emissive(0);
  m.color('#ff4f8a', 1); m.roundBox(0, D + 4, -24.35, 22, 1.2, 0.1, 0.05); m.color('#38c8ff', 1); m.roundBox(0, D + 9, -24.35, 26, 0.8, 0.1, 0.05); m.emissive(0);
  m.color('#9a9aa4'); for (const [x, z] of [[-17.6, -13.4], [17.6, -13.4], [-17.6, -25.6], [17.6, -25.6]]) m.roundBox(x, 8, z, 0.7, 16, 0.7, 0.1);
  m.color('#141418'); m.roundBox(0, 16.4, -19.5, 36.4, 0.5, 13, 0.1);
  m.color('#ead2a6'); m.ellipsoid(40, 0, 4, 8, 3.4, 4, { seg: 10, rings: 4, phi1: Math.PI / 2 });
  return { cols: [bcmC.box(0, -20, 18, 7, 0, 16)], lights: [{ x: 0, y: 17, z: -14, s: 3, c: '#ffb23a' }, { x: 0, y: 8, z: -24, s: 6, c: '#ff4f8a' }] };
}
BCM_KINDS.playground = {
  name: 'Playground', short: 'Playground', bpm: 126, mapCol: '#ff9a3a',
  desc: 'A festival-scale main stage (truss roof, curved LED wall, line arrays, sub line, CO2, FOH tower) and a dune-soft lounge. The founder is a name on the schedule board only.',
  real: 'Founded by DJ Carl Cox; the camp was first built in 2014. A huge production: a big main stage plus a welcoming lounge to relax in (reported as the "Arrival" stage and the "Dune" lounge).',
  foot: [-27, -30, 52, 40], radius: 58, height: 17, entrance: [0, 38, Math.PI],
  build: bcmBuildPlayground, sil: bcmSilPlayground
};

/* ======================= 3. OPULENT TEMPLE =======================
   Real camp (facts): co-founded and led by Syd Gris; first built in 2003 (an open-air steel tension dome); one of
   the longest-running large sound camps; known for big stage design and legendary guests; a 2009 account describes the
   DJ booth flanked by 12-foot video screens and 18-foot sound towers; Wednesday "Sacred Dance" white parties.
   Our design: a stepped marble plinth, a half-ring colonnade of fluted columns with fire cauldrons, a golden lotus-sun
   portal around the decks, 18 ft gold-framed sound towers and 12 ft screens either side (the reported layout), purple
   drapes, flame cannons on the front edge, and a steel tension crown of masts and cables over the dance floor.
   Local layout (+Z = street): plinth z -20..-4, booth (0, -13), colonnade arc centre (0, -12) r 10.5, floor (0, 9) */
const BCM_OT = { T1: 0.8, T2: 1.6, T3: 2.4, FLOOR: [0, 9, 13] };
function bcmBuildTemple(api, g, P) {
  const K = BCM_OT, gold = '#e0aa30', marble = '#f0e8dc', purple = '#4a1c5a';
  P.bpm = 128;
  bcmPaint(P, (c, Pt, S) => {
    const [px, pz] = Pt(K.FLOOR[0], K.FLOOR[1]);
    c.fillStyle = 'rgba(236,226,210,0.5)'; c.beginPath(); c.arc(px, pz, K.FLOOR[2] * S, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(200,150,60,0.55)'; c.lineWidth = 0.25 * S;
    for (let r = 3; r < K.FLOOR[2]; r += 3) { c.beginPath(); c.arc(px, pz, r * S, 0, TAU); c.stroke(); }
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; c.beginPath(); c.moveTo(px + Math.cos(a) * 3 * S, pz + Math.sin(a) * 3 * S); c.lineTo(px + Math.cos(a) * K.FLOOR[2] * S, pz + Math.sin(a) * K.FLOOR[2] * S); c.stroke(); }
  });
  // the stepped plinth
  bcmPart(P, 0, -12, m => {
    const tiers = [[15, -20, -4, K.T1], [12, -20, -7, K.T2], [8, -19, -10, K.T3]], cols = [];
    tiers.forEach(([hw, z0, z1, y], i) => {
      const y0 = i ? tiers[i - 1][3] : 0;
      m.color(i % 2 ? '#e8dfd0' : marble).shine(1); m.roundBox(0, (y0 + y) / 2, (z0 + z1) / 2, hw * 2, y - y0, z1 - z0, 0.08, { top: '#f6efe4' });
      m.color(gold, 0.35).shine(2); m.roundBox(0, y - 0.05, z1 + 0.01, hw * 2 + 0.05, 0.1, 0.06, 0.02); m.emissive(0).shine(0);
      cols.push(bcmC.box(0, (z0 + z1) / 2, hw, (z1 - z0) / 2, 0, y));
    });
    return { cols };
  });
  // colonnade: a half ring of fluted columns with cauldrons, a curved entablature with an LED frieze
  const cA = 1.4, cR = 10.5, cZ = -12, nC = 10;
  bcmPart(P, 0, -19, m => {
    const cols = [], lights = [];
    for (let i = 0; i < nC; i++) {
      const a = -cA + i / (nC - 1) * 2 * cA, x = Math.sin(a) * cR, z = cZ - Math.cos(a) * cR;
      cols.push(bcmColumn(m, x, z, 10.5, 0.48, { col: marble, trim: gold }));
      m.color('#3a2a1c').shine(2); m.push(); m.tf(x, 10.55, z); m.lathe([[0.18, 0], [0.24, 0.25], [0.7, 0.5], [0.76, 0.62], [0.64, 0.62], [0, 0.48]], { seg: 14 }); m.pop();
      m.color('#ff9a3a', 1); m.ball(x, 11.1, z, 0.3, { seg: 8, rings: 5 }); m.emissive(0);
      lights.push({ x, y: 11.4, z, s: 1.2, c: '#ff9a3a' });
    }
    m.push(); m.tf(0, 0, cZ, Math.PI);
    m.color(marble).shine(1); m.lathe([[cR + 0.9, 10.5], [cR + 1.1, 10.85], [cR + 1.1, 11.4], [cR - 1.1, 11.4], [cR - 1.1, 10.85], [cR - 0.9, 10.5], [cR + 0.9, 10.5]], { seg: 40, theta0: -cA - 0.06, theta1: cA + 0.06 });
    m.color('#ff4fd8', 1); m.lathe([[cR - 1.12, 10.95], [cR - 1.12, 11.15]], { seg: 40, theta0: -cA - 0.06, theta1: cA + 0.06, flip: true }); m.emissive(0);
    m.pop();
    // purple drapes swagged between the columns
    for (let i = 0; i < nC - 1; i++) {
      const a0 = -cA + i / (nC - 1) * 2 * cA, a1 = -cA + (i + 1) / (nC - 1) * 2 * cA;
      const A = [Math.sin(a0) * (cR - 0.6), cZ - Math.cos(a0) * (cR - 0.6)], B = [Math.sin(a1) * (cR - 0.6), cZ - Math.cos(a1) * (cR - 0.6)];
      const f = (u, v, t) => { t[0] = lerp(A[0], B[0], u); t[2] = lerp(A[1], B[1], u); t[1] = 10.1 - v * (1.6 + 1.4 * Math.sin(u * Math.PI)) ; };
      m.color(i % 2 ? purple : '#6a1c3a'); m.surf(8, 3, f, {}); m.surf(8, 3, f, { flip: true });
    }
    return { cols, lights };
  });
  // the golden lotus-sun portal around the decks
  bcmPart(P, 0, -15, m => {
    const pz = -15.2, y0 = K.T3, R = 4.4, H = 7.2;
    const arch = []; for (let k = 0; k <= 24; k++) { const a = k / 24 * Math.PI, w = R * (1 - 0.12 * Math.sin(a) * Math.sin(a)); arch.push([Math.cos(a) * w, y0 + H * 0.55 + Math.sin(a) * H * 0.62, pz]); }
    arch.unshift([R, y0, pz]); arch.push([-R, y0, pz]);
    m.color(gold).shine(2); bcmTube(m, arch, 0.42, { seg: 10 });
    const inner = arch.map(q => [q[0] * 0.86, y0 + (q[1] - y0) * 0.92, pz + 0.25]);
    m.color('#ff4fd8', 1); bcmTube(m, inner, 0.12, { seg: 6, colFn: t => mix('#ff4fd8', '#ffb347', Math.abs(t - 0.5) * 2) });
    // the lotus sun: petals around a glowing disc
    m.push(); m.tf(0, y0 + 5.6, pz - 0.35, 0, Math.PI / 2, 0);
    m.color('#ffb347', 0.95); m.lathe([[0, 0.12], [1.8, 0.06], [1.9, 0], [0, 0]], { seg: 28 });
    m.color('#fff0c0', 1); m.lathe([[0, 0.2], [0.9, 0.14], [0.95, 0.1], [0, 0.1]], { seg: 20 });
    m.pop();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; m.push(); m.tf(Math.cos(a) * 2.5, y0 + 5.6 + Math.sin(a) * 2.5, pz - 0.3, 0, 0, a - Math.PI / 2); m.color(i % 2 ? '#ff8a3a' : '#ffd84a', 0.9); m.ellipsoid(0, 0, 0, 0.42, 0.95, 0.08, { seg: 10, rings: 5 }); m.pop(); }
    m.emissive(0);
    const cols = bcmBooth(m, 0, y0, -13.2, 0, { w: 3.2, ca: '#ffb347', cb: '#ff4fd8', body: '#2a1430', top: '#3a1c40' });
    cols.push(bcmC.box(-R, pz, 0.45, 0.45, y0, y0 + H), bcmC.box(R, pz, 0.45, 0.45, y0, y0 + H));
    return { cols, lights: [{ x: 0, y: y0 + 5.6, z: pz + 0.5, s: 5, c: '#ffb347' }] };
  }, { noAO: true });
  // 18 ft sound towers + 12 ft screens either side (the reported layout)
  bcmPart(P, 0, -13, m => {
    const cols = [];
    for (const sd of [-1, 1]) {
      const tx = sd * 6.3, tz = -12.4, y0 = K.T3, h = 18 * BCM_FT;
      m.color(gold).shine(2); m.roundBox(tx, y0 + h / 2, tz - 0.2, 2.4, h + 0.3, 1.9, 0.12);
      for (let k = 0; k < 4; k++) bcmSpeaker(m, tx, y0 + 0.15 + k * (h - 0.3) / 4, tz + 0.55, 2.0, (h - 0.3) / 4 - 0.06, 0.8, { cones: 2, col: '#1e1420', led: k === 3 ? '#ff4fd8' : null });
      m.color('#ffd84a', 1); m.ball(tx, y0 + h + 0.35, tz - 0.2, 0.22, { seg: 8, rings: 5 }); m.emissive(0);
      cols.push(bcmC.box(tx, tz, 1.2, 1.0, y0, y0 + h));
      const sx = sd * 10.6, sy = K.T2, sh = 12 * BCM_FT;
      m.push(); m.tf(sx, 0, -11.2, -sd * 0.3);
      m.color(gold).shine(2); m.roundBox(0, sy + sh / 2 + 0.3, -0.15, 3.1, sh + 0.7, 0.3, 0.1);
      bcmLEDWall(m, 0, sy + sh / 2 + 0.3, 0.05, 2.6, sh, 9, 13, (u, v) => { const d = Math.hypot(u - 0.5, (v - 0.5) * 1.4), s = Math.sin(d * 26 - Math.atan2(v - 0.5, u - 0.5) * 3); return s > 0.3 ? (d < 0.25 ? '#ffd84a' : '#ff4fd8') : s > -0.4 ? '#7a2a9a' : null; }, { back: '#2a1430' });
      m.pop();
      cols.push(bcmC.box(sx, -11.2, 1.55, 0.3, sy, sy + sh + 0.7, -sd * 0.3, { walk: false }));
    }
    return { cols };
  }, { noAO: true });
  // flame cannons on the front edge + the steel tension crown over the floor + torches
  bcmPart(P, 0, -4, m => {
    const cols = [];
    for (const x of [-12, -6, 6, 12]) { m.color('#3a3036').shine(2); m.push(); m.tf(x, 0, -4.4); m.roundCyl(0, 0, 0, 0.42, 0.7, 0.08, { seg: 14 }); m.color('#8a8a92').shine(3); m.roundCyl(0, 0.7, 0, 0.2, 0.5, 0.04, { seg: 12 }); m.color('#ff7a2a', 1); m.torus(0, 1.18, 0, 0.18, 0.04, { seg: 12, tseg: 4 }); m.emissive(0); m.pop(); cols.push(bcmC.cyl(x, -4.4, 0.42, 0, 1.2)); }
    return { cols };
  });
  bcmPart(P, K.FLOOR[0], K.FLOOR[1], m => {
    const cols = [], lights = [], cx = K.FLOOR[0], cz = K.FLOOR[1], Rm = 17, top = 12.5, ringY = 13.6;
    m.color('#3a3a42').shine(2); m.push(); m.tf(cx, ringY, cz); m.torus(0, 0, 0, 2.2, 0.16, { seg: 24, tseg: 6 }); m.pop();
    m.color('#ffd84a', 1); m.push(); m.tf(cx, ringY - 0.2, cz); m.torus(0, 0, 0, 2.2, 0.05, { seg: 24, tseg: 4 }); m.pop(); m.emissive(0);
    for (let i = 0; i < 8; i++) {
      const a = (i + 0.5) / 8 * TAU; if (Math.cos(a) < -0.75) continue;   // leave the stage side open
      const x = cx + Math.sin(a) * Rm, z = cz + Math.cos(a) * Rm;
      m.color('#4a4a52').shine(2); m.limb(x, 0, z, x, top, z, 0.16, 0.11, { seg: 8 });
      m.color('#2a2a30'); m.limb(x, top, z, cx + Math.sin(a) * 2.2, ringY, cz + Math.cos(a) * 2.2, 0.035, 0.035, { seg: 4 });
      m.limb(x, top, z, x + Math.sin(a) * 4, 0, z + Math.cos(a) * 4, 0.025, 0.025, { seg: 4 });
      m.color('#ff9a3a', 1); m.ball(x, top + 0.2, z, 0.22, { seg: 8, rings: 5 }); m.emissive(0); lights.push({ x, y: top + 0.3, z, s: 1.3, c: '#ff9a3a' });
      // lantern strings sagging from the mast to the crown
      bcmStringLights(m, [x, top - 0.4, z], [cx + Math.sin(a) * 2.2, ringY - 0.3, cz + Math.cos(a) * 2.2], 12, ['#ffd84a', '#ff4fd8', '#ffb347'], 1.2, P, null);
      cols.push(bcmC.cyl(x, z, 0.2, 0, top, { camPass: true }));
      // a torch at the foot of each mast
      m.color('#5a4030').shine(1); m.limb(x - Math.sin(a) * 1.2, 0, z - Math.cos(a) * 1.2, x - Math.sin(a) * 1.2, 2.0, z - Math.cos(a) * 1.2, 0.06, 0.05, { seg: 6 });
      m.color('#ff8a2a', 1); m.ellipsoid(x - Math.sin(a) * 1.2, 2.25, z - Math.cos(a) * 1.2, 0.16, 0.32, 0.16, { seg: 8, rings: 5 }); m.emissive(0); lights.push({ x: x - Math.sin(a) * 1.2, y: 2.3, z: z - Math.cos(a) * 1.2, s: 0.9, c: '#ff8a2a', pool: 5, i: 0.4 });
    }
    return { cols, lights };
  });
  // the entrance: two obelisks with braziers + the camp sign
  bcmPart(P, 0, 30, m => {
    const cols = [];
    for (const sd of [-1, 1]) { const x = sd * 5; m.color(marble).shine(1); m.push(); m.tf(x, 0, 30); m.lathe([[0.9, 0], [0.9, 0.5], [0.6, 0.6], [0.45, 6.2], [0.05, 7.2], [0, 7.25]], { seg: 4 }); m.pop(); m.color(gold, 0.6).shine(2); m.push(); m.tf(x, 0, 30); m.lathe([[0.62, 0.55], [0.62, 0.75]], { seg: 4 }); m.pop(); m.emissive(0).shine(0); cols.push(bcmC.box(x, 30, 0.8, 0.8, 0, 7)); }
    bcmSignMesh(m, 'OPULENT TEMPLE', { bg: '#2a0e34', fg: '#ffd84a', border: gold, size: 54, glow: '#ff4fd8' }, 0, 4.3, 30, 1.1, { glow: true, posts: false, maxW: 8, frame: '#3a1c40' });
    m.color(gold).shine(2); m.limb(-4.6, 5.6, 30, 4.6, 5.6, 30, 0.08, 0.08, { seg: 6 }); m.shine(0);
    return { cols, lights: [{ x: 0, y: 4.9, z: 30.4, s: 2.2, c: '#ff4fd8' }] };
  });
  const st = bcmStage(P, 'temple', 'The Temple', 0, K.T3, -13.95, 0, [K.FLOOR[0], K.FLOOR[1] - 2, 10], { genre: 'trance', bpm: 128 });
  bcmDJ(P, st, { id: P.id + '_dj', name: 'DJ SERAPHINA', seed: 15, lines: ['Welcome to the temple. Mind the eyebrows.', 'Every drop gets a flame cannon. Every.'] });
  bcmCrowd(P, K.FLOOR[0], K.FLOOR[1] - 1, 10, 14, { face: [0, -13], types: ['ledsuit', 'tutu', 'burner', 'furcoat', 'sparklepony', 'tutu'], lines: ['Wednesday is white-party night. I wore my whitest dust.', 'The flame cannons are timed to the drop. I checked.', 'This camp has been throwing this party since before I owned goggles.'] });
  for (const x of [-12, -6, 6, 12]) bcmFlame(P, x, 1.2, -4.4, { every: 16, ph: 0, h: 7, big: true });
  for (let i = 0; i < nC; i++) { const a = -cA + i / (nC - 1) * 2 * cA; bcmFlame(P, Math.sin(a) * cR, 11.1, cZ - Math.cos(a) * cR, { every: 8, ph: i % 2 ? 4 : 0, h: 3.5 }); }
  bcmLaser(P, 0, K.T3 + 11.2, -15.2, 0, { n: 8, spread: 2.0, cols: [[1, 0.3, 0.85], [1, 0.75, 0.2], [0.6, 0.35, 1]], len: 70, tilt: 0.1, ph: 1 });
  bcmLaser(P, 0, 13.6, K.FLOOR[1], Math.PI, { n: 6, spread: TAU, cols: [[1, 0.8, 0.3], [1, 0.3, 0.85]], len: 32, tilt: -0.45, ph: 3, rate: 0.5, sw: 1.2 });
  bcmPL(P, 0, 8, -10, 20, ['#ff4fd8', '#ffb347', '#9a6bff'], { i: 1.8 });
  bcmPL(P, 0, 6, K.FLOOR[1], 18, ['#ffb347', '#ff4fd8'], { i: 1.1, ph: 1 });
  bcmPool(P, 0, -8, 20, '#ff70c0', 0.45); bcmPool(P, K.FLOOR[0], K.FLOOR[1], 18, '#ffb070', 0.38);
  bcmArea(P, 'temple', 'The Temple', 0, 0, { hx: 18, hz: 24 });
  bcmSpot(P, 'stage', 0, K.T3, -11); bcmSpot(P, 'booth', 0, K.T3, -13.95); bcmSpot(P, 'floor', K.FLOOR[0], 0, K.FLOOR[1], Math.PI); bcmSpot(P, 'gate', 0, 0, 30, Math.PI); bcmSpot(P, 'crown', K.FLOOR[0], 13.6, K.FLOOR[1]);
}
function bcmSilTemple(m, P) {
  m.color('#efe6d8'); m.roundBox(0, 0.8, -12, 30, 1.6, 16, 0.2);
  for (let i = 0; i < 10; i++) { const a = -1.4 + i / 9 * 2.8, x = Math.sin(a) * 10.5, z = -12 - Math.cos(a) * 10.5; m.color('#efe6d8'); m.push(); m.tf(x, 0, z); m.lathe([[0.55, 0], [0.5, 10.5]], { seg: 6 }); m.pop(); m.color('#ff9a3a', 1); m.ball(x, 11, z, 0.4, { seg: 6, rings: 3 }); m.emissive(0); }
  m.color('#e0aa30', 0.6); m.push(); m.tf(0, 2.4 + 4.6, -15.2, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 4.2, 0.45, { seg: 16, tseg: 4 }); m.pop(); m.emissive(0);
  for (const sd of [-1, 1]) { m.color('#e0aa30'); m.roundBox(sd * 6.3, 2.4 + 2.8, -12.6, 2.4, 5.6, 1.9, 0.2); }
  return { cols: [bcmC.box(0, -12, 15, 8, 0, 11)], lights: [{ x: 0, y: 8, z: -15, s: 5, c: '#ff4fd8' }, { x: 0, y: 12, z: -20, s: 3, c: '#ffb347' }] };
}
BCM_KINDS.opulentTemple = {
  name: 'Opulent Temple', short: 'Opulent Temple', bpm: 128, mapCol: '#ff4fd8',
  desc: 'A temple stage: stepped marble plinth, colonnade with fire cauldrons, a golden lotus-sun portal, 18 ft sound towers and 12 ft screens, flame cannons, and a steel tension crown over the dance floor.',
  real: 'Co-founded and led by Syd Gris; first built in 2003 (with a huge open-air steel tension dome); one of the longest-running large sound camps, known for big stage design and legendary guest DJs. A 2009 account: the DJ booth flanked by 12 ft video screens and 18 ft sound towers. Wednesday "Sacred Dance" white parties.',
  foot: [-24, -25, 24, 34], radius: 40, height: 15, entrance: [0, 33, Math.PI],
  build: bcmBuildTemple, sil: bcmSilTemple
};

/* ======================= 4. CAMP QUESTION MARK =======================
   Real camp (facts): a big bass-music sound camp; its co-founders first came to Black Rock City in 1999; the camp
   keeps "question books" full of thoughtful questions. Its obvious signature (per the owner) is a giant glowing "?".
   Our design: a 14 m glowing "?" (a smooth LED tube + a big dot) towering over a round stage and bass walls, and a
   coffee lounge with a chalkboard menu and a table of open question books.
   Local layout (+Z = street): "?" plane z -15, stage (0, -8.5) r 5.5, lounge (26, 4) */
function bcmQMCurve() {
  const pts = [], cx = 0, cy = 11.2, r = 3.4;
  for (let k = 0; k <= 22; k++) { const a = (150 - k / 22 * 220) * Math.PI / 180; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  const e = pts[pts.length - 1];
  for (let k = 1; k <= 6; k++) { const t = k / 6; pts.push([lerp(e[0], 0, easeInOut(t)), lerp(e[1], 6.4, t)]); }
  for (let k = 1; k <= 3; k++) pts.push([0, 6.4 - k * 0.65]);
  return pts;
}
function bcmBuildQM(api, g, P) {
  P.bpm = 140;
  const QZ = -15, cyan = '#38f2ff', mag = '#ff4fd8';
  bcmPaint(P, (c, Pt, S) => {
    const [px, pz] = Pt(0, 4); c.strokeStyle = 'rgba(40,120,160,0.35)'; c.lineWidth = 0.6 * S;
    for (let r = 3; r < 13; r += 2.5) { c.beginPath(); c.arc(px, pz, r * S, 0, TAU); c.stroke(); }
    c.fillStyle = 'rgba(30,40,70,0.25)'; c.beginPath(); c.arc(px, pz, 13 * S, 0, TAU); c.fill();
  });
  // the giant question mark
  bcmPart(P, 0, QZ, m => {
    const C = bcmQMCurve().map(q => [q[0], q[1], QZ]);
    m.color('#1a2a3a').shine(2); bcmTube(m, C, 0.95, { seg: 14 });                       // the dark body
    m.color('#dffcff', 1); bcmTube(m, C.map(q => [q[0], q[1], QZ + 0.62]), 0.38, { seg: 10 }); // the glowing face
    m.color(cyan, 1); for (let i = 0; i < C.length; i += 2) { const q = C[i]; m.ball(q[0], q[1], QZ - 0.75, 0.2, { seg: 6, rings: 4 }); }
    m.emissive(0);
    m.color('#1a2a3a').shine(2); m.ball(0, 2.2, QZ, 1.7, { seg: 20, rings: 12 });
    m.color('#dffcff', 1); m.ellipsoid(0, 2.2, QZ + 0.9, 1.1, 1.1, 0.95, { seg: 16, rings: 10 }); m.emissive(0);
    // a plinth + bracing
    m.color('#2a3442').shine(1); m.roundBox(0, 0.25, QZ, 6, 0.5, 4, 0.12);
    m.color('#5a6472').shine(2); m.limb(0, 6.0, QZ - 0.4, 0, 0.5, QZ - 2.4, 0.12, 0.12, { seg: 6 }); m.limb(1.6, 10.4, QZ - 0.6, 1.2, 0.5, QZ - 2.0, 0.1, 0.1, { seg: 6 });
    return { cols: [bcmC.box(0, QZ, 3, 2, 0, 0.5), bcmC.cyl(0, QZ, 1.7, 0.5, 3.9), bcmC.box(0, QZ, 1, 1, 0.5, 14.6, 0, { walk: false })], lights: [{ x: 0, y: 11, z: QZ + 1.5, s: 7, c: cyan }, { x: 0, y: 2.2, z: QZ + 1.5, s: 3, c: '#dffcff' }] };
  }, { noAO: true });
  // the round stage, booth, bass walls
  bcmPart(P, 0, -8.5, m => {
    const cols = [];
    m.color('#1c2430').shine(1); m.push(); m.tf(0, 0, -9); m.roundCyl(0, 0, 0, 5.5, 1.4, 0.12, { seg: 32 }); m.pop();
    m.color(cyan, 1); m.push(); m.tf(0, 1.3, -9); m.torus(0, 0, 0, 5.52, 0.05, { seg: 40, tseg: 4 }); m.pop(); m.color(mag, 1); m.push(); m.tf(0, 0.2, -9); m.torus(0, 0, 0, 5.52, 0.05, { seg: 40, tseg: 4 }); m.pop(); m.emissive(0);
    cols.push(bcmC.cyl(0, -9, 5.5, 0, 1.4));
    cols.push(...bcmBooth(m, 0, 1.4, -8.0, 0, { w: 3.0, ca: cyan, cb: mag, body: '#121820', ledFn: (u, v) => (Math.abs(u - 0.5) < 0.08 && v > 0.3) || (Math.abs(Math.hypot((u - 0.5) * 3, v - 0.75) - 0.35) < 0.08 && v > 0.55) ? '#dffcff' : (v < 0.2 ? cyan : null) }));
    for (const sd of [-1, 1]) {
      m.push(); m.tf(sd * 9.5, 0, -8.5, -sd * 0.4); const c = bcmSubs(m, 0, 0, 3, 3, { led: sd < 0 ? cyan : mag, col: '#141a22' });
      for (let k = 0; k < 2; k++) bcmSpeaker(m, (k - 0.5) * 1.6, c.y1, 0.1, 1.5, 1.6, 0.9, { cones: 2, col: '#141a22' });
      m.pop();
      cols.push(bcmC.box(sd * 9.5, -8.5, c.hx, c.hz, 0, c.y1 + 1.6, -sd * 0.4));
    }
    return { cols };
  });
  // the coffee lounge: shade, espresso bar, chalkboard, couches, question books
  const lx = 26, lz = 4;
  bcmRug(P, lx, lz + 1, 6, 4, 0.1, 'rgba(40,60,110,0.85)', 'rgba(150,240,255,0.6)');
  bcmPart(P, lx, lz, m => {
    const cols = [], lights = [];
    for (const [x, z] of [[lx - 6, lz - 4], [lx + 6, lz - 4], [lx - 6, lz + 6], [lx + 6, lz + 6]]) { m.color('#3a4452').shine(2); m.limb(x, 0, z, x, 4.2, z, 0.1, 0.08, { seg: 7 }); cols.push(bcmC.cyl(x, z, 0.12, 0, 4.2, { camPass: true })); }
    bcmSail(m, [lx - 6, 4.4, lz - 4], [lx + 6, 3.4, lz - 4], [lx + 6, 4.4, lz + 6], [lx - 6, 3.4, lz + 6], { cols: ['#1c2c4c', '#26386a', '#1c2c4c', '#38f2ff'], under: '#2a3a5a', sag: 0.3 });
    // espresso bar
    m.push(); m.tf(lx + 3.6, 0, lz - 2.4, -0.2);
    m.color('#5a3a26').shine(1); m.roundBox(0, 0.55, 0, 3.6, 1.1, 0.9, 0.12, { top: '#2a2a30' });
    m.color(cyan, 1); m.roundBox(0, 0.1, 0.46, 3.4, 0.05, 0.03, 0.01); m.emissive(0);
    m.color('#c8ccd4').shine(3); m.roundBox(-0.8, 1.45, -0.1, 0.9, 0.7, 0.55, 0.1); m.color('#2a2a30'); m.roundBox(-0.8, 1.25, 0.2, 0.5, 0.06, 0.12, 0.02);
    m.color('#c8ccd4'); for (const sx of [-1.05, -0.55]) m.limb(sx, 1.42, 0.2, sx, 1.22, 0.32, 0.03, 0.025, { seg: 5 });
    m.color('#f4f0e8').shine(1); for (let k = 0; k < 6; k++) { m.push(); m.tf(0.2 + k * 0.22, 1.1, 0.1); m.lathe([[0.05, 0], [0.07, 0.11], [0.07, 0.12], [0, 0.03]], { seg: 8 }); m.pop(); }
    m.color('#8a5a3a'); m.roundCyl(1.4, 1.1, -0.2, 0.12, 0.35, 0.03, { seg: 10 });
    m.pop(); m.shine(0);
    cols.push(bcmC.box(lx + 3.6, lz - 2.4, 1.8, 0.45, 0, 1.1, -0.2));
    bcmSignMesh(m, 'THE ? LOUNGE · COFFEE\nWHAT\'S YOUR QUESTION?', { bg: '#1a2420', fg: '#f4f0e0', border: '#8a6a4a', size: 34, font: '' }, lx + 3.8, 1.3, lz - 3.4, 1.1, { yaw: -0.2, frame: '#5a3a26' });
    cols.push(bcmC.box(lx + 3.8, lz - 3.4, 1.6, 0.12, 0, 2.5, -0.2, { walk: false }));
    // couches + the question-book table
    cols.push(bcmCouch(m, lx - 3.5, lz + 3.5, Math.PI * 0.8, '#2a4a8a', { pillow: cyan }), bcmCouch(m, lx + 0.5, lz + 4.8, Math.PI, '#4a2a6a', { pillow: mag }), bcmCouch(m, lx - 4.2, lz - 0.6, Math.PI / 2, '#2a5a5a'));
    m.color('#6a4a32').shine(1); m.roundBox(lx - 0.8, 0.45, lz + 1.2, 2.2, 0.9, 1.2, 0.1, { top: '#8a6a48' });
    for (let k = 0; k < 3; k++) { const bx = lx - 1.5 + k * 0.7; m.push(); m.tf(bx, 0.92, lz + 1.2, 0.3 * (k - 1)); for (const sd of [-1, 1]) { m.push(); m.tf(sd * 0.17, 0, 0, 0, 0, -sd * 0.18); m.color(['#8a2a2a', '#2a5a8a', '#2a6a3a'][k]); m.roundBox(0, 0.02, 0, 0.34, 0.04, 0.46, 0.01); m.color('#f4efe2'); m.roundBox(0, 0.05, 0, 0.31, 0.03, 0.43, 0.005); m.pop(); } m.pop(); }
    cols.push(bcmC.box(lx - 0.8, lz + 1.2, 1.1, 0.6, 0, 0.9));
    for (const [x, z, c] of [[lx - 3, lz - 1, '#9af8ff'], [lx + 2.5, lz + 2.5, '#ffcf8a'], [lx - 1, lz + 4, '#ff9af0']]) { bcmLantern(m, x, 3.0, z, c, 1.0); lights.push({ x, y: 3, z, s: 0.8, c }); }
    lights.push({ x: lx, y: 0, z: lz + 1, s: 0, c: '#9af8ff', pool: 11, i: 0.45 });
    return { cols, lights };
  });
  for (const [x, z, yaw, seed] of [[lx - 3.5, lz + 3.5, Math.PI * 0.8, 3], [lx + 0.5, lz + 4.8, Math.PI, 22]]) P.actors.push(P.api.npc({ type: 'burner', seed, x: P.F.wx(x, z), z: P.F.wz(x, z), y: P.F.wy(0.12), fixedY: true, yaw: P.F.rot + yaw, behavior: 'sit', chat: ['Question for you: why are you awake?', 'Every page in that book is somebody\'s question.', 'Coffee and bass. That\'s the whole recipe.'] }));
  // signs + people
  bcmPart(P, 0, 22, m => { bcmSignMesh(m, 'CAMP QUESTION MARK', { bg: '#0c1828', fg: '#dffcff', border: cyan, size: 50, glow: cyan }, -8, 1.2, 21, 1.1, { yaw: 0.25, glow: true, frame: '#1a2a3a' }); return { cols: [bcmC.box(-8, 21, 2.6, 0.15, 0, 2.4, 0.25, { walk: false })] }; });
  const st = bcmStage(P, 'bass', 'The ? Stage', 0, 1.4, -8.75, 0, [0, 5, 9], { genre: 'bass', bpm: 140 });
  bcmDJ(P, st, { id: P.id + '_dj', name: 'DJ MAYBE SO', seed: 18, lines: ['Is this the drop? Who can say.', 'Bring a question. Leave with a bass face.'] });
  bcmCrowd(P, 0, 4, 9, 12, { face: [0, -9], lines: ['What IS the question? I forgot the question.', 'The bass here rearranges your organs. In a good way.', 'They keep books full of questions in the lounge. I wrote one!'] });
  bcmLaser(P, 0, 14.2, QZ, 0, { n: 7, spread: 1.6, cols: [[0.25, 0.95, 1], [1, 0.3, 0.85], [0.85, 1, 1]], len: 70, tilt: 0.06, ph: 2 });
  bcmLaser(P, 0, 2.6, -8, 0, { n: 6, spread: 2.4, cols: [[1, 0.3, 0.85], [0.25, 0.95, 1]], len: 40, tilt: 0.25, ph: 5, rate: 1.2 });
  bcmPL(P, 0, 7, -8, 20, [cyan, mag, '#dffcff'], { i: 1.8 });
  bcmPL(P, lx, 3, lz + 1, 10, ['#9af8ff'], { i: 0.8, pulse: false });
  bcmPool(P, 0, -6, 18, '#38f2ff', 0.45); bcmPool(P, 0, 4, 14, '#ff4fd8', 0.3);
  bcmArea(P, 'stage', 'The ? Stage', 0, -2, { hx: 14, hz: 16 }); bcmArea(P, 'lounge', 'The ? Lounge', lx, lz + 1, { hx: 7, hz: 6 });
  bcmSpot(P, 'question', 0, 0, QZ + 3, Math.PI); bcmSpot(P, 'booth', 0, 1.4, -8.75); bcmSpot(P, 'floor', 0, 0, 5, Math.PI); bcmSpot(P, 'lounge', lx - 1, 0, lz + 1, Math.PI); bcmSpot(P, 'books', lx - 0.8, 0.95, lz + 1.2); bcmSpot(P, 'coffee', lx + 3.6, 0, lz - 1.5, Math.PI);
}
function bcmSilQM(m, P) {
  const C = bcmQMCurve().map(q => [q[0], q[1], -15]);
  m.color('#dffcff', 1); bcmTube(m, C, 0.95, { seg: 6, caps: false }); m.ball(0, 2.2, -15, 1.7, { seg: 8, rings: 5 }); m.emissive(0);
  m.color('#1c2430'); m.push(); m.tf(0, 0, -9); m.roundCyl(0, 0, 0, 5.5, 1.4, 0.2, { seg: 12 }); m.pop();
  m.color('#1c2c4c'); m.roundBox(26, 3.9, 5, 12, 0.4, 10, 0.2);
  return { cols: [bcmC.cyl(0, -12, 5.5, 0, 6)], lights: [{ x: 0, y: 14.6, z: -15, s: 4, c: '#38f2ff' }, { x: 0, y: 2.2, z: -14, s: 3, c: '#dffcff' }] };
}
BCM_KINDS.campQuestionMark = {
  name: 'Camp Question Mark', short: 'Camp ?', bpm: 140, mapCol: '#38f2ff',
  desc: 'A 14 m glowing "?" over a round bass stage with sub walls, and a coffee lounge with a chalkboard menu and a table of open question books.',
  real: 'A big bass-music sound camp; its co-founders first came to Black Rock City in 1999; it keeps "question books" filled with thoughtful questions. Its signature (per the owner): a giant glowing question mark.',
  foot: [-16, -19, 34, 24], radius: 34, height: 15, entrance: [0, 23, Math.PI],
  build: bcmBuildQM, sil: bcmSilQM
};

/* ======================= 5. DISORIENT =======================
   Real camp (facts): a sound, visual and performance-art collective born in New York; it has camped at Burning Man
   since 2001; its colours are pink and orange. A big art compound with a big dance floor.
   Our design (no logo): a neon portal stage (concentric pink and orange rings receding into a tunnel, a fan of neon
   rays), a fabric-walled compound, a striped sail over the floor, a glowing tile floor, a neon arch tunnel entrance.
   Local layout (+Z = street): stage z -16..-7, portal centre (0, 7.6, -12), floor (0, 3), entrance tunnel z 18..25 */
function bcmBuildDisorient(api, g, P) {
  P.bpm = 128;
  const pink = '#ff4fd8', orange = '#ff7a2a', dark = '#1a0e1c';
  bcmPaint(P, (c, Pt, S) => { const [px, pz] = Pt(0, 3); for (let k = 0; k < 7; k++) { c.strokeStyle = k % 2 ? 'rgba(255,122,42,0.32)' : 'rgba(255,79,216,0.32)'; c.lineWidth = 0.8 * S; c.beginPath(); c.arc(px, pz, (13 - k * 1.7) * S, 0, TAU); c.stroke(); } });
  // stage + the neon portal tunnel + ray fan
  bcmPart(P, 0, -12, m => {
    const cols = [], lights = [];
    m.color(dark).shine(1); m.roundBox(0, 0.6, -11.5, 20, 1.2, 9, 0.12, { top: '#2a1a2c' });
    m.color(pink, 1); m.roundBox(0, 1.1, -7.0, 19.8, 0.05, 0.04, 0.012); m.emissive(0);
    cols.push(bcmC.box(0, -11.5, 10, 4.5, 0, 1.2));
    for (let k = 0; k < 6; k++) {
      const R = 6.6 - k * 0.75, z = -11.6 - k * 0.9;
      m.push(); m.tf(0, 7.6, z, 0, Math.PI / 2, 0);
      m.color(dark).shine(2); m.torus(0, 0, 0, R, 0.32, { seg: 48, tseg: 6 });
      m.color(k % 2 ? orange : pink, 1); m.push(); m.tf(0, 0.25, 0); m.torus(0, 0, 0, R - 0.05, 0.12, { seg: 48, tseg: 5 }); m.pop(); m.emissive(0);
      m.pop();
    }
    // the portal's feet and the back disc (a glowing "event horizon")
    m.color(dark).shine(2); for (const sd of [-1, 1]) m.limb(sd * 4.6, 1.2, -11.6, sd * 3.2, 3.0, -11.6, 0.3, 0.25, { seg: 8 });
    m.push(); m.tf(0, 7.6, -16.4, 0, Math.PI / 2, 0); m.color('#3a0a3a', 0.55); m.lathe([[0, 0], [2.6, 0], [2.6, -0.1], [0, -0.1]], { seg: 32 }); m.pop(); m.emissive(0);
    // a fan of neon rays behind
    for (let k = 0; k < 10; k++) { const a = -1.25 + k / 9 * 2.5, x0 = Math.sin(a) * 7.4, y0 = 7.6 + Math.cos(a) * 7.4, x1 = Math.sin(a) * 10.5, y1 = 7.6 + Math.cos(a) * 10.5; m.color(k % 2 ? orange : pink, 1); m.limb(x0, Math.max(1.3, y0), -15.2, x1, Math.max(1.3, y1), -15.4, 0.12, 0.12, { seg: 5 }); }
    m.emissive(0);
    cols.push(...bcmBooth(m, 0, 1.2, -9.6, 0, { w: 3.0, ca: pink, cb: orange, body: dark, ledFn: (u, v) => (Math.floor(u * 12 + v * 3) % 2 ? pink : orange) }));
    for (const sd of [-1, 1]) { m.push(); m.tf(sd * 8.2, 1.2, -9.5, -sd * 0.25); for (let i = 0; i < 3; i++) bcmSpeaker(m, 0, i * 1.45, 0, 2.0, 1.4, 1.5, { cones: 1, col: '#24182c', led: i === 2 ? (sd < 0 ? pink : orange) : null }); m.pop(); cols.push(bcmC.box(sd * 8.2, -9.5, 1.0, 0.75, 1.2, 5.6, -sd * 0.25)); }
    lights.push({ x: 0, y: 7.6, z: -11, s: 8, c: pink });
    return { cols, lights };
  }, { noAO: true });
  // the compound walls: fabric panels on poles (pink / orange), open at the front
  bcmPart(P, 0, 4, m => {
    const cols = [], R = 16, cz = 2;
    const n = 18;
    for (let i = 0; i <= n; i++) {
      const a = -2.45 + i / n * 4.9, x = Math.sin(a) * R, z = cz + Math.cos(a) * R * 0.85;
      if (Math.cos(a) > 0.55 && Math.abs(x) < 5.5) continue;
      m.color('#2a1a2c').shine(2); m.limb(x, 0, z, x, 4.2, z, 0.08, 0.07, { seg: 6 }); m.color(i % 2 ? pink : orange, 1); m.ball(x, 4.3, z, 0.12, { seg: 6, rings: 4 }); m.emissive(0);
      if (i < n) {
        const a1 = -2.45 + (i + 1) / n * 4.9, x1 = Math.sin(a1) * R, z1 = cz + Math.cos(a1) * R * 0.85;
        if (Math.cos((a + a1) / 2) > 0.55 && Math.abs((x + x1) / 2) < 6.5) continue;
        const f = (u, v, t) => { t[0] = lerp(x, x1, u); t[2] = lerp(z, z1, u) + Math.sin(u * Math.PI * 3 + v) * 0.08; t[1] = lerp(3.9, 0.5, v); };
        m.color(i % 2 ? '#ff6ad8' : '#ff8a3a'); m.surf(5, 2, f, {}); m.color(i % 2 ? '#c03aa8' : '#c85a1a'); m.surf(5, 2, f, { flip: true });
        cols.push(bcmC.wall(x, z, x1, z1, 0.3, 0, 3.9));
      }
    }
    // a striped sail over the back of the floor
    bcmSail(m, [-11, 6.2, -5], [11, 5.0, -5], [11, 6.2, 6], [-11, 5.0, 6], { cols: [pink, '#ffd0f0', orange, '#ffe0c8', pink, '#ffd0f0', orange], under: '#3a1a3a', sag: 0.5, n: 12 });
    for (const [x, z] of [[-11, -5], [11, -5], [-11, 6], [11, 6]]) { m.color('#2a1a2c').shine(2); m.limb(x, 0, z, x, 6.2, z, 0.12, 0.1, { seg: 7 }); cols.push(bcmC.cyl(x, z, 0.14, 0, 6.2, { camPass: true })); }
    return { cols };
  });
  // glowing tile floor in front of the stage + the neon arch tunnel entrance + the sign
  bcmPart(P, 0, -3.5, m => {
    for (let i = 0; i < 10; i++) for (let j = 0; j < 4; j++) { const x = -9 + i * 2, z = -5.5 + j * 1.6, on = (i + j) % 2; m.color(on ? pink : orange, on ? 0.75 : 0.55); m.roundBox(x, 0.03, z, 1.85, 0.06, 1.45, 0.02); }
    m.emissive(0);
    return { lights: [{ x: 0, y: 0, z: -3, s: 0, c: '#ff70b0', pool: 12, i: 0.5 }] };
  });
  bcmPart(P, 0, 21, m => {
    const lights = [];
    for (let k = 0; k < 6; k++) { m.push(); m.tf(0, 0, 24 - k * 1.3, 0, Math.PI / 2, 0); m.color(dark).shine(2); m.torus(0, 0, 0, 2.9, 0.12, { seg: 28, tseg: 5, sy: 1 }); m.color(k % 2 ? orange : pink, 1); m.torus(0, 0.12, 0, 2.86, 0.06, { seg: 28, tseg: 4 }); m.emissive(0); m.pop(); if (k % 2 === 0) lights.push({ x: 0, y: 2.6, z: 24 - k * 1.3, s: 1.6, c: k % 4 ? orange : pink }); }
    bcmSignMesh(m, 'DISORIENT', { bg: '#1a0a1a', fg: orange, border: pink, size: 60, glow: pink }, 0, 3.3, 24.4, 0.95, { glow: true, posts: false, maxW: 4.6, frame: dark });
    return { cols: [bcmC.wall(-2.9, 24.5, -2.9, 17.4, 0.25, 0, 2.6), bcmC.wall(2.9, 24.5, 2.9, 17.4, 0.25, 0, 2.6)], lights };
  });
  const st = bcmStage(P, 'portal', 'The Portal', 0, 1.2, -10.35, 0, [0, 2, 9], { genre: 'techno', bpm: 128 });
  bcmDJ(P, st, { id: P.id + '_dj', name: 'DJ VORTEXA', seed: 10, lines: ['Up is pink. Down is orange. Hope that helps.', 'Step through the portal. Bring water.'] });
  bcmCrowd(P, 0, 2, 9, 12, { face: [0, -10], types: ['tutu', 'ledsuit', 'sparklepony', 'burner', 'furcoat'], lines: ['PINK! ORANGE! PINK!', 'I walked through the tunnel and now I live here.', 'Disorient has been doing this since 2001. Respect.'] });
  bcmLaser(P, 0, 14.4, -12, 0, { n: 8, spread: 1.8, cols: [[1, 0.3, 0.85], [1, 0.5, 0.15]], len: 65, tilt: 0.08, ph: 3 });
  bcmPL(P, 0, 7.6, -9, 18, [pink, orange], { i: 2.0 });
  bcmPL(P, 0, 4, 3, 14, [orange, pink], { i: 1.0, ph: 1 });
  bcmPool(P, 0, -4, 16, '#ff70b0', 0.5); bcmPool(P, 0, 4, 13, '#ff8a3a', 0.35);
  bcmArea(P, 'compound', 'The Compound', 0, 2, { hx: 16, hz: 16 });
  bcmSpot(P, 'portal', 0, 1.2, -11); bcmSpot(P, 'booth', 0, 1.2, -10.35); bcmSpot(P, 'floor', 0, 0, 2, Math.PI); bcmSpot(P, 'tunnel', 0, 0, 25, Math.PI);
}
function bcmSilDisorient(m, P) {
  m.color('#1a0e1c'); m.roundBox(0, 0.6, -11.5, 20, 1.2, 9, 0.2);
  m.push(); m.tf(0, 7.6, -11.6, 0, Math.PI / 2, 0); m.color('#ff4fd8', 1); m.torus(0, 0, 0, 6.6, 0.4, { seg: 24, tseg: 4 }); m.color('#ff7a2a', 1); m.torus(0, 0, 0, 5.2, 0.35, { seg: 20, tseg: 4 }); m.pop(); m.emissive(0);
  m.color('#ff6ad8'); m.ellipsoid(0, 3.9, 0, 16, 2.2, 13, { seg: 12, rings: 3, phi1: Math.PI / 2 });
  return { cols: [bcmC.box(0, -11.5, 10, 4.5, 0, 6)], lights: [{ x: 0, y: 7.6, z: -11, s: 7, c: '#ff4fd8' }] };
}
BCM_KINDS.disorient = {
  name: 'Disorient', short: 'Disorient', bpm: 128, mapCol: '#ff70b0',
  desc: 'A pink-and-orange neon portal stage (rings receding into a tunnel, a fan of rays) inside a fabric-walled compound, a striped sail, a glowing tile floor and a neon arch tunnel entrance.',
  real: 'A sound, visual and performance-art collective born in New York; at Burning Man since 2001; its colours are pink and orange ("PORNJ"). A big art compound with a big dance floor.',
  foot: [-18, -18, 18, 27], radius: 28, height: 15, entrance: [0, 26, Math.PI],
  build: bcmBuildDisorient, sil: bcmSilDisorient
};

/* ======================= 6. THE DEEP END =======================
   Real camp (facts): an OG large-scale daytime party camp from the early-to-mid 2000s.
   Our design: a big shade over a pool-tile dance floor (lane lines, DEEP END / 9 FT markers), a lifeguard-tower DJ
   booth under a striped umbrella, a springboard and a high dive, floats, loungers, umbrellas, a snack bar.
   Local layout (+Z = street): floor (0, 0) 22 x 16, tower (0, -10), high dive (13, -4), snack bar (-13, -5) */
function bcmBuildDeepEnd(api, g, P) {
  P.bpm = 122;
  const W = 11, Dd = 8;
  bcmPaint(P, (c, Pt, S) => {
    const [x0, z0] = Pt(-W, -Dd), [x1, z1] = Pt(W, Dd);
    const L = Math.min(x0, x1), T = Math.min(z0, z1), w = Math.abs(x1 - x0), h = Math.abs(z1 - z0);
    const gr = c.createLinearGradient(L, T, L, T + h); gr.addColorStop(0, 'rgba(30,110,200,0.78)'); gr.addColorStop(1, 'rgba(110,220,255,0.7)');
    c.fillStyle = gr; c.fillRect(L, T, w, h);
    c.strokeStyle = 'rgba(235,252,255,0.35)'; c.lineWidth = Math.max(1, 0.05 * S);
    for (let k = -W; k <= W; k += 1) { const [ax, az] = Pt(k, -Dd), [bx, bz] = Pt(k, Dd); c.beginPath(); c.moveTo(ax, az); c.lineTo(bx, bz); c.stroke(); }
    for (let k = -Dd; k <= Dd; k += 1) { const [ax, az] = Pt(-W, k), [bx, bz] = Pt(W, k); c.beginPath(); c.moveTo(ax, az); c.lineTo(bx, bz); c.stroke(); }
    c.fillStyle = 'rgba(16,44,120,0.6)';
    for (const lx of [-7.5, -2.5, 2.5, 7.5]) { const [ax, az] = Pt(lx - 0.22, -Dd + 1.2), [bx, bz] = Pt(lx + 0.22, Dd - 1.2); c.fillRect(Math.min(ax, bx), Math.min(az, bz), Math.abs(bx - ax), Math.abs(bz - az)); }
    const r = mulberry32(4242); c.strokeStyle = 'rgba(220,255,255,0.25)'; c.lineWidth = Math.max(1, 0.12 * S);
    for (let i = 0; i < 30; i++) { const xx = r() * 2 * W - W, zz = r() * 2 * Dd - Dd; c.beginPath(); for (let s = 0; s <= 6; s++) { const [px, pz] = Pt(xx + s * 0.6, zz + Math.sin(s * 1.3 + i) * 0.35); if (s) c.lineTo(px, pz); else c.moveTo(px, pz); } c.stroke(); }
    // depth markers painted on the deck (our own text)
    c.save(); c.fillStyle = 'rgba(20,40,90,0.9)'; c.font = `bold ${Math.round(1.1 * S)}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const [x, z, t] of [[-8, Dd + 1.1, '9 FT'], [8, Dd + 1.1, '9 FT'], [0, Dd + 1.1, 'THE DEEP END'], [-8, -Dd - 1.1, '9 FT'], [8, -Dd - 1.1, 'NO RUNNING']]) { const [px, pz] = Pt(x, z); c.fillText(t, px, pz); }
    c.restore();
  });
  // pool coping + deck + ladders
  bcmPart(P, 0, 0, m => {
    m.color('#eef6f8').shine(1);
    for (const sz of [-1, 1]) m.roundBox(0, 0.06, sz * (Dd + 0.3), W * 2 + 1.2, 0.12, 0.6, 0.05);
    for (const sx of [-1, 1]) m.roundBox(sx * (W + 0.3), 0.06, 0, 0.6, 0.12, Dd * 2, 0.05);
    m.color('#5ad8ff', 0.8); m.roundBox(0, 0.13, Dd + 0.05, W * 2, 0.02, 0.06, 0.01); m.roundBox(0, 0.13, -Dd - 0.05, W * 2, 0.02, 0.06, 0.01); m.emissive(0);
    m.color('#d8dce4').shine(3); for (const [x, z] of [[-6, Dd + 0.3], [6, Dd + 0.3]]) for (const sx of [-0.3, 0.3]) { m.limb(x + sx, 0.1, z, x + sx, 1.0, z, 0.035, 0.035, { seg: 6 }); m.limb(x + sx, 1.0, z, x + sx, 1.0, z - 0.35, 0.035, 0.035, { seg: 6 }); }
    m.shine(0);
    return {};
  });
  // the big shade: two hypar sails on tall poles
  bcmPart(P, 0, -1, m => {
    const cols = [], poles = [[-12.5, -9.5, 6.4], [12.5, -9.5, 6.4], [-12.5, 9.5, 6.4], [12.5, 9.5, 6.4], [0, -10, 7.6], [0, 10, 7.6]];
    for (const [x, z, h] of poles) { m.color('#f4f4f0').shine(2); m.limb(x, 0, z, x, h, z, 0.15, 0.11, { seg: 8 }); m.color('#ff4a3a'); m.ball(x, h + 0.1, z, 0.16, { seg: 6, rings: 4 }); cols.push(bcmC.cyl(x, z, 0.16, 0, h, { camPass: true })); }
    bcmSail(m, [-12.5, 6.0, -9.5], [0, 7.4, -10], [0, 5.0, 10], [-12.5, 6.4, 9.5], { cols: ['#f6faff', '#5ad8ff', '#f6faff', '#5ad8ff'], under: '#cfe8f0', sag: 0.5, n: 10 });
    bcmSail(m, [0, 7.4, -10], [12.5, 6.0, -9.5], [12.5, 6.4, 9.5], [0, 5.0, 10], { cols: ['#5ad8ff', '#f6faff', '#5ad8ff', '#f6faff'], under: '#cfe8f0', sag: 0.5, n: 10 });
    return { cols };
  }, { noAO: true });
  // the lifeguard tower DJ booth with its striped umbrella, ladder, rescue buoy, speakers
  bcmPart(P, 0, -10.5, m => {
    const cols = [], tz = -10.5, h = 2.6;
    m.color('#f4f4f0').shine(1);
    for (const [x, z] of [[-1.6, tz - 1.1], [1.6, tz - 1.1], [-1.6, tz + 1.1], [1.6, tz + 1.1]]) m.limb(x, 0, z, x * 0.82, h, z * 0.98 + tz * 0.02, 0.12, 0.1, { seg: 7 });
    for (const sd of [-1, 1]) m.limb(sd * 1.6, 0.9, tz - 1.1, -sd * 1.4, 2.1, tz - 1.08, 0.06, 0.06, { seg: 5 });
    m.color('#e8e4dc'); m.roundBox(0, h, tz, 3.6, 0.2, 2.6, 0.06);
    m.color('#ff3a3a'); m.roundBox(0, h + 0.55, tz - 1.25, 3.6, 0.9, 0.12, 0.05); m.color('#ffffff'); m.roundBox(0, h + 0.55, tz - 1.18, 3.0, 0.3, 0.05, 0.02);
    // a ship's ladder at the back (a steep stair with treads and handrails)
    m.color('#f4f4f0'); for (const sx of [-0.5, 0.5]) { m.limb(sx, 0, tz - 5.0, sx, h, tz - 1.3, 0.06, 0.06, { seg: 5 }); m.limb(sx, 1.0, tz - 5.0, sx, h + 1.0, tz - 1.3, 0.035, 0.035, { seg: 5 }); }
    m.color('#dcd8d0'); for (let k = 1; k < 8; k++) { const t = k / 8; m.roundBox(0, h * t - 0.03, lerp(tz - 5.0, tz - 1.3, t), 0.95, 0.06, 0.32, 0.02); }
    // umbrella
    m.color('#d8d8d8').shine(2); m.limb(1.2, h, tz + 0.6, 1.2, h + 3.4, tz + 0.6, 0.05, 0.05, { seg: 6 });
    m.push(); m.tf(1.2, h + 2.9, tz + 0.6); m.shine(0); for (let k = 0; k < 8; k++) { m.color(k % 2 ? '#ff4a3a' : '#ffffff'); m.lathe([[2.2, 0], [0, 0.65]], { seg: 2, theta0: k / 8 * TAU, theta1: (k + 1) / 8 * TAU }); m.lathe([[2.2, 0], [0, 0.65]], { seg: 2, theta0: k / 8 * TAU, theta1: (k + 1) / 8 * TAU, flip: true }); } m.pop();
    // buoy
    m.color('#ff4a2a').shine(2); m.push(); m.tf(1.85, h - 0.6, tz + 1.15, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.32, 0.1, { seg: 14, tseg: 6 }); m.pop();
    cols.push(...bcmBooth(m, 0, h + 0.1, tz + 0.5, 0, { w: 2.6, ca: '#5ad8ff', cb: '#ffd84a', body: '#f4f4f0', top: '#dcd8d0', ledFn: (u, v) => (Math.sin(u * 10 + v * 6) > 0.1 ? '#5ad8ff' : '#ffffff') }));
    for (const sd of [-1, 1]) { m.push(); m.tf(sd * 3.4, 0, tz + 0.4, -sd * 0.25); for (let i = 0; i < 2; i++) bcmSpeaker(m, 0, i * 1.3, 0, 1.4, 1.25, 1.1, { cones: 1, col: '#f0f0ec', ring: '#2a8ac8', cap: '#5ad8ff' }); m.pop(); cols.push(bcmC.box(sd * 3.4, tz + 0.4, 0.7, 0.55, 0, 2.6, -sd * 0.25)); }
    cols.push(bcmC.box(0, tz, 1.8, 1.3, h - 0.2, h + 0.1), bcmC.ramp(0, tz - 3.15, 0.5, 1.85, 0.03, h + 0.1, 0));
    for (const [x, z] of [[-1.6, tz - 1.1], [1.6, tz - 1.1], [-1.6, tz + 1.1], [1.6, tz + 1.1]]) cols.push(bcmC.cyl(x, z, 0.12, 0, h, { camPass: true }));
    return { cols, lights: [{ x: 0, y: h + 1.6, z: tz + 0.5, s: 1.0, c: '#5ad8ff' }] };
  });
  // springboard + high dive (a 5 m platform with a ladder) beside the pool
  bcmPart(P, 13.5, -4, m => {
    const cols = [], hx = 14.2, hz = -4, H = 5.0;
    m.color('#e8e4dc').shine(1);
    for (const [x, z] of [[hx - 0.8, hz - 0.8], [hx + 0.8, hz - 0.8], [hx - 0.8, hz + 0.8], [hx + 0.8, hz + 0.8]]) m.limb(x, 0, z, x, H, z, 0.09, 0.08, { seg: 6 });
    m.roundBox(hx, H, hz, 2.0, 0.18, 2.0, 0.05);
    m.color('#3a8ac8').shine(2); m.push(); m.tf(hx - 1.0, H + 0.12, hz, -Math.PI / 2); m.roundBox(0, 0, 1.4, 0.7, 0.08, 2.8, 0.03); m.pop();
    m.color('#f4f4f0'); for (const sx of [-0.35, 0.35]) m.limb(hx + 1.1, 0, hz + sx, hx + 1.1, H, hz + sx, 0.04, 0.04, { seg: 5 }); for (let k = 1; k < 10; k++) m.limb(hx + 1.1, H * k / 10, hz - 0.35, hx + 1.1, H * k / 10, hz + 0.35, 0.025, 0.025, { seg: 4 });
    m.color('#3a8ac8'); m.push(); m.tf(W + 0.2, 0.55, 2.5, -Math.PI / 2); m.roundBox(0, 0, 0.9, 0.55, 0.07, 2.0, 0.02); m.pop(); m.color('#e8e4dc'); m.roundBox(W + 0.6, 0.27, 2.5, 0.6, 0.55, 0.6, 0.06);
    cols.push(bcmC.box(hx, hz, 1.0, 1.0, H - 0.2, H + 0.1), bcmC.box(hx - 2.4, hz, 1.4, 0.35, H, H + 0.16));
    for (let k = 1; k <= 8; k++) cols.push(bcmC.box(hx + 1.2, hz, 0.12, 0.35, H * k / 9 - 0.05, H * k / 9 + 0.02));
    cols.push(bcmC.box(W + 0.6, 2.5, 0.3, 0.3, 0, 0.55));
    return { cols };
  });
  // floats, loungers, umbrellas, beach balls, the snack bar
  bcmPart(P, 0, 4, m => {
    const cols = [], lights = [];
    for (const [x, z, c, r] of [[-6, 3, '#ff4a7a', 0.9], [4, 5, '#ffd84a', 1.0], [7, -2, '#5aff9a', 0.8], [-3, -4, '#ff8a3a', 0.85]]) { m.color(c).shine(2); m.torus(x, 0.28, z, r, 0.28, { seg: 18, tseg: 8 }); m.color('#ffffff'); m.torus(x, 0.32, z, r, 0.29, { seg: 6, tseg: 4 }); }
    for (const [x, z, r] of [[1, 1, 0.55], [-8, -1, 0.45], [9, 4, 0.5]]) { m.shine(2); m.surf(16, 8, (u, v, t) => { const th = u * TAU, ph = v * Math.PI; t[0] = x + Math.sin(ph) * Math.sin(th) * r; t[1] = r - Math.cos(ph) * r; t[2] = z + Math.sin(ph) * Math.cos(th) * r; }, { wrapU: true, out: true, colFn: (u, v) => (v < 0.12 || v > 0.88) ? '#ffffff' : ['#ff3b5c', '#ffffff', '#ffe24a', '#ffffff', '#38a8ff', '#ffffff'][Math.floor(u * 6) % 6] }); m.shine(0); cols.push(bcmC.cyl(x, z, r * 0.9, 0, r * 1.6)); }
    for (const [x, z, yaw] of [[-14, 6, 0.5], [-14.5, 2.5, 0.3], [15, 7, -0.6]]) {
      m.push(); m.tf(x, 0, z, yaw); m.color('#ffffff').shine(1); m.roundBox(0, 0.32, 0, 0.75, 0.08, 1.9, 0.03); m.push(); m.tf(0, 0.35, -0.75, 0, 0.7, 0); m.roundBox(0, 0.35, 0, 0.75, 0.08, 0.7, 0.03); m.pop();
      m.color('#2a8ac8'); for (const sz of [-0.8, 0.8]) for (const sx of [-0.3, 0.3]) m.limb(sx, 0, sz, sx, 0.3, sz, 0.025, 0.025, { seg: 4 }); m.pop();
      cols.push(bcmC.box(x, z, 0.4, 0.95, 0, 0.45, yaw));
    }
    for (const [x, z, c] of [[-15, 4.5, '#ff4a3a'], [15.5, 8.5, '#ffd84a']]) { m.color('#d8d8d8').shine(2); m.limb(x, 0, z, x, 2.6, z, 0.04, 0.04, { seg: 5 }); m.push(); m.tf(x, 2.3, z); for (let k = 0; k < 8; k++) { m.color(k % 2 ? c : '#ffffff').shine(0); m.lathe([[1.5, 0], [0, 0.45]], { seg: 2, theta0: k / 8 * TAU, theta1: (k + 1) / 8 * TAU }); m.lathe([[1.5, 0], [0, 0.45]], { seg: 2, theta0: k / 8 * TAU, theta1: (k + 1) / 8 * TAU, flip: true }); } m.pop(); }
    // snack bar
    m.push(); m.tf(-14.2, 0, -5.5, Math.PI / 2);
    m.color('#5ad8ff').shine(1); m.roundBox(0, 0.55, 0, 3.2, 1.1, 0.9, 0.1, { top: '#f4f4f0' });
    m.color('#ffffff'); for (let k = 0; k < 5; k++) m.roundBox(-1.3 + k * 0.65, 0.55, 0.46, 0.3, 1.0, 0.02, 0.01);
    m.color('#f4f4f0'); m.roundBox(0, 2.6, -0.2, 3.6, 0.15, 1.6, 0.05); for (const sx of [-1.6, 1.6]) m.limb(sx, 0, -0.8, sx, 2.55, -0.8, 0.05, 0.05, { seg: 5 });
    m.pop();
    cols.push(bcmC.box(-14.2, -5.5, 1.6, 0.45, 0, 1.1, Math.PI / 2));
    bcmSignMesh(m, 'SNACK BAR · H2O', { bg: '#ffffff', fg: '#1a4a8a', border: '#ff4a3a', size: 36 }, -14.2, 2.0, -5.5, 0.5, { yaw: Math.PI / 2, posts: false, frame: '#f4f4f0' });
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#5ad8ff', pool: 15, i: 0.5 });
    return { cols, lights };
  });
  bcmPart(P, 0, 13, m => { bcmSignMesh(m, 'THE DEEP END', { bg: '#0a2a4a', fg: '#ffffff', border: '#5ad8ff', size: 54, glow: '#5ad8ff' }, 8, 1.1, 13, 1.1, { yaw: -0.3, glow: true, frame: '#0a2a4a' }); return { cols: [bcmC.box(8, 13, 2.2, 0.12, 0, 2.3, -0.3, { walk: false })] }; });
  const st = bcmStage(P, 'tower', 'The Lifeguard Tower', 0, 2.7, -10.75, 0, [0, 0, 9], { genre: 'house', bpm: 122 });
  bcmDJ(P, st, { id: P.id + '_dj', name: 'DJ CHLORINE', seed: 26, lines: ['Welcome to the deep end. Floaties optional.', 'Day party energy since the two-thousands.'] });
  bcmCrowd(P, 0, 1, 8, 12, { face: [0, -10], types: ['tutu', 'burner', 'sparklepony', 'furcoat', 'ledsuit'], lines: ['Is it a pool party if there\'s no pool?', 'I\'m in over my head and I LOVE it.', 'The Deep End was THE day party back in the day.'] });
  bcmLaser(P, 0, 5.4, -10.5, 0, { n: 5, spread: 1.6, cols: [[0.35, 0.85, 1], [1, 0.9, 0.3]], len: 45, tilt: 0.1, ph: 1 });
  bcmPL(P, 0, 5, -2, 18, ['#5ad8ff', '#38a8ff', '#9af8ff'], { i: 1.4 });
  bcmPool(P, 0, 0, 18, '#5ad8ff', 0.5);
  bcmArea(P, 'pool', 'The Pool Deck', 0, 0, { hx: 13, hz: 12 });
  bcmSpot(P, 'tower', 0, 2.7, -10.5); bcmSpot(P, 'booth', 0, 2.7, -10.75); bcmSpot(P, 'floor', 0, 0, 1, Math.PI); bcmSpot(P, 'highDive', 14.2, 5.0, -4, -Math.PI / 2); bcmSpot(P, 'springboard', 11.6, 0.6, 2.5, -Math.PI / 2); bcmSpot(P, 'snackBar', -13, 0, -5.5, Math.PI / 2);
}
function bcmSilDeepEnd(m, P) {
  m.color('#f6faff'); m.ellipsoid(0, 5, 0, 13, 2.6, 10, { seg: 10, rings: 3, phi1: Math.PI / 2 });
  m.color('#5ad8ff', 0.7); m.roundBox(0, 0.05, 0, 22, 0.1, 16, 0.05); m.emissive(0);
  m.color('#f4f4f0'); m.roundBox(0, 1.3, -10.5, 3.6, 2.6, 2.6, 0.2); m.color('#ff4a3a'); m.ellipsoid(1.2, 5.5, -9.9, 2.2, 0.6, 2.2, { seg: 8, rings: 3, phi1: Math.PI / 2 });
  return { cols: [bcmC.box(0, -10.5, 2, 1.5, 0, 3)], lights: [{ x: 0, y: 6, z: 0, s: 4, c: '#5ad8ff' }] };
}
BCM_KINDS.deepEnd = {
  name: 'The Deep End', short: 'Deep End', bpm: 122, mapCol: '#5ad8ff',
  desc: 'A daytime pool-party stage: a big shade over a pool-tile dance floor, a lifeguard-tower DJ booth with a striped umbrella, a springboard and a high dive, floats, loungers and a snack bar.',
  real: 'An OG large-scale daytime party camp from the early-to-mid 2000s (DJs who played it describe it as a large-scale day party camp from the early days).',
  foot: [-17, -16.5, 17, 15], radius: 24, height: 9, entrance: [0, 15, Math.PI],
  build: bcmBuildDeepEnd, sil: bcmSilDeepEnd
};

/* ======================= 7. DEATH GUILD THUNDERDOME =======================
   Real camp (facts): Death Guild's Thunderdome, a fixture since the late 1990s: a big climbable lattice dome; two
   fighters in bungee harnesses hang from the top and swing at each other with foam bats while spectators climb all
   over the outside of the dome and cheer.
   Our design: a rusted-steel geodesic lattice (no fabric), three walkable spectator ledges around the outside (climb
   them), two bungee fighters that bounce and bonk on their own, an MC tower, apex fire cannons.
   Local layout (+Z = street): dome centre (0, 0) r 10.5, gate +Z, MC tower (-7, 13) */
const BCM_TD = { R: 10.5, LEDGES: [1.5, 3.0, 4.5] };
BurnsBehaviors.register('bcmBungee', {
  init(a) { const D = a.data; D.y = 1.5 + Math.random(); D.vy = 0; D.sw = 0; D.vs = 0; D.ph = a.def.side > 0 ? 0 : Math.PI; D.hitT = 0; },
  update(a, g, dt) {
    const D = a.data, d = a.def, side = d.side, P = d.camp, F = P.F, t = P.R.t;
    // vertical: a bungee spring with kicks off the floor; horizontal: a swing toward the middle, then a bonk
    D.vy += (-(D.y - 2.1) * 9 - D.vy * 0.6) * dt; if (D.y < 0.05 && D.vy < 0) { D.vy = 6 + Math.random() * 2.5; }
    D.y = Math.max(0, D.y + D.vy * dt);
    const lunge = Math.max(0, Math.sin(t * 1.1 + D.ph * 0.2)) ** 3;
    const want = side * (4.2 - lunge * 3.4);
    D.vs += ((want - D.sw) * 7 - D.vs * 1.8) * dt; D.sw += D.vs * dt;
    const lx = D.sw, lz = Math.sin(t * 0.7 + D.ph) * 1.2;
    a.x = F.wx(lx, lz); a.z = F.wz(lx, lz); a.y = F.wy(D.y); a.vx = a.vz = 0;
    a.yaw = F.rot + (side > 0 ? -Math.PI / 2 : Math.PI / 2);
    D.hitT = Math.max(0, D.hitT - dt);
    if (lunge > 0.8 && side > 0 && Math.abs(D.sw) < 1.4 && D.hitT <= 0) {
      D.hitT = 1.2; const o = bcmActorOf(g, d.foe); if (o && o.data) { o.data.vs -= side * 7; o.data.vy += 3; }
      g.fx.burst(a.x - Math.sin(a.yaw) * -0.8, a.y + 1.6, a.z, 'star', 8, '#ffe24a');
      if (Math.hypot(g.player.x - a.x, g.player.z - a.z) < 30) burnsSfx('bossHit', { vol: 0.35, pitch: 1.3 });
      bcmEvent(g, 'bcmBonk', { camp: P, actor: a });
      for (const sd of P.spectators || []) { const s = bcmActorOf(g, sd); if (s && Math.random() < 0.3) s.say(['BONK!', 'TWO ENTER!', 'HIT HIM!', 'FOAM IS PAIN!'][Math.floor(Math.random() * 4)], 1.1); }
    }
    a.ch.play(lunge > 0.5 ? 'charge' : (D.y > 0.4 ? 'fall' : 'land'));
  }
});
function bcmBuildThunderdome(api, g, P) {
  const R = BCM_TD.R, rust = '#5a3a2c';
  P.bpm = 130;
  bcmDisc(P, 0, 0, R - 0.4, 'rgba(70,40,30,0.55)', 'rgba(255,90,58,0.5)', 0.25); bcmDisc(P, 0, 0, 2, null, 'rgba(255,90,58,0.5)', 0.25);
  // the lattice dome (struts and hubs only), its gate, and the apex ring with bungee anchors + cannons
  bcmPart(P, 0, 0, m => {
    const res = bcmDome(m, { r: R, freq: 4, panels: false, frame: '#3a2c28', hub: rust, rad: 0.11, led: ['#ff5a3a'], ledE: 0.6, ledRings: false,
      doors: [{ yaw: 0, w: 3.6, h: 3.6, col: '#2a2224', led: '#ff5a3a' }] });
    m.color('#3a3a40').shine(2); m.torus(0, R - 0.3, 0, 1.2, 0.14, { seg: 16, tseg: 5 });
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; m.color('#2a2a30'); m.roundCyl(Math.sin(a) * 1.25, R - 0.15, Math.cos(a) * 1.25, 0.22, 0.6, 0.05, { seg: 10 }); }
    m.color('#ff5a3a', 1); m.ball(0, R - 0.45, 0, 0.22, { seg: 8, rings: 5 }); m.emissive(0); m.shine(0);
    // spectator ledges (walkable planks hugging the outside of the lattice)
    const cols = res.cols;
    for (const y of BCM_TD.LEDGES) {
      const rr = Math.sqrt(R * R - y * y) + 0.45, n = 18;
      for (let i = 0; i < n; i++) {
        const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, mid = (a0 + a1) / 2;
        if (Math.abs(BurnsM.wrap(mid)) < 0.42) continue;   // the gate side stays open
        const ax = Math.sin(a0) * rr, az = Math.cos(a0) * rr, bx = Math.sin(a1) * rr, bz = Math.cos(a1) * rr;
        m.color('#6a5a48').shine(1); m.push(); m.tf((ax + bx) / 2, y - 0.08, (az + bz) / 2, mid + Math.PI / 2); m.roundBox(0, 0, 0, 0.7, 0.14, Math.hypot(bx - ax, bz - az) + 0.06, 0.03); m.pop();
        cols.push({ t: 'box', x: (ax + bx) / 2, z: (az + bz) / 2, hx: 0.38, hz: Math.hypot(bx - ax, bz - az) / 2 + 0.03, y0: y - 0.18, y1: y, yaw: mid + Math.PI / 2, camPass: true });
      }
    }
    return { cols, lights: [{ x: 0, y: 0, z: 0, s: 0, c: '#ff5a3a', pool: 14, i: 0.5 }, { x: 0, y: R - 0.4, z: 0, s: 2.2, c: '#ff5a3a', blink: 4 }] };
  }, { noAO: true });
  // the gate sign + the MC tower
  bcmPart(P, 0, R + 1, m => {
    const cols = [];
    bcmSignMesh(m, 'THUNDERDOME', { bg: '#120a0a', fg: '#ff5a3a', border: '#ffb040', size: 56, glow: '#ff5a3a' }, 0, 3.8, R + 0.2, 0.95, { glow: true, posts: false, maxW: 5.4, frame: '#2a2224' });
    bcmSignMesh(m, 'DEATH GUILD\nTWO ENTER · FOAM ONLY', { bg: '#1a1416', fg: '#e8e0d8', border: '#ff5a3a', size: 34 }, 5.2, 0.9, R + 2.4, 1.0, { yaw: -0.4, frame: '#2a2224' });
    cols.push(bcmC.box(5.2, R + 2.4, 1.3, 0.12, 0, 2.0, -0.4, { walk: false }));
    const tx = -7, tz = R + 2.5, th = 3.2;
    m.color('#3a3a40').shine(2);
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) m.limb(tx + sx * 1.1, 0, tz + sz * 1.1, tx + sx * 1.1, th + 1.0, tz + sz * 1.1, 0.07, 0.07, { seg: 6 });
    for (const sd of [-1, 1]) { m.limb(tx - 1.1, 0.2, tz + sd * 1.1, tx + 1.1, th - 0.2, tz + sd * 1.1, 0.04, 0.04, { seg: 5 }); m.limb(tx + sd * 1.1, 0.2, tz - 1.1, tx + sd * 1.1, th - 0.2, tz + 1.1, 0.04, 0.04, { seg: 5 }); }
    m.color('#2a2a30'); m.roundBox(tx, th, tz, 2.6, 0.24, 2.6, 0.06);
    m.color('#ff3b2a', 1); for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) m.ball(tx + sx * 1.1, th + 1.1, tz + sz * 1.1, 0.12, { seg: 8, rings: 5 }); m.emissive(0);
    for (let k = 0; k < 4; k++) { m.color('#3a3a40').shine(1); m.roundBox(tx + 1.8, (k + 1) * th / 5 - 0.06, tz - 1.2 + k * 0.6, 0.9, 0.12, 0.6, 0.03); cols.push(bcmC.box(tx + 1.8, tz - 1.2 + k * 0.6, 0.45, 0.3, 0, (k + 1) * th / 5)); }
    cols.push(bcmC.box(tx, tz, 1.3, 1.3, th - 0.24, th));
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) cols.push(bcmC.cyl(tx + sx * 1.1, tz + sz * 1.1, 0.1, 0, th + 1, { camPass: true }));
    return { cols, lights: [{ x: tx, y: th + 1.1, z: tz, s: 0.9, c: '#ff3b2a', blink: 4 }] };
  });
  // the fighters, the MC, spectators on the ledges
  if (P.o.fighters !== false) {
    const mk = side => P.api.npc({ type: 'deathguild', seed: side > 0 ? 3 : 7, prop: 'foambat', name: side > 0 ? 'IRON MAIDEN-ISH' : 'THE FOAM REAPER', x: P.F.wx(side * 4, 0), z: P.F.wz(side * 4, 0), y: P.F.wy(2), fixedY: true, collide: false, always: true, behavior: 'bcmBungee', side, camp: P, chatter: false, noDJ: true, lines: ['Two enter. Both leave. Everyone hugs. That\'s the rule.', 'Want in? Get in line. Sign the waiver. Bring a helmet.'] });
    const A = mk(1), B = mk(-1); A.foe = B; B.foe = A;
    P.fighters = [A, B]; P.actors.push(A, B);
  }
  P.actors.push(P.api.npc({ type: 'deathguild', seed: 11, prop: 'skullstaff', name: 'THE MC', x: P.F.wx(-7, R + 2.5), z: P.F.wz(-7, R + 2.5), y: P.F.wy(3.2), yaw: P.F.rot + Math.PI * 0.85, behavior: 'idle', anim: 'yell', lookAt: false, lines: ['TWO MEN ENTER! TWO MEN... ALSO LEAVE, SAFELY!', 'Foam bats only. Hydrate between bonks.'] }));
  P.spectators = [];
  BCM_TD.LEDGES.forEach((y, k) => {
    const rr = Math.sqrt(R * R - y * y) + 0.45;
    for (let i = 0; i < 3; i++) {
      const a = 0.9 + k * 0.5 + i * 1.75; if (Math.abs(BurnsM.wrap(a)) < 0.5) continue;
      const x = Math.sin(a) * rr, z = Math.cos(a) * rr;
      const s = bcmCrowd(P, x, z, 0.1, 1, { y, behavior: 'idle', face: [0, 0], extra: { anim: k === 2 ? 'cheer' : 'climb', lookAt: false, chat: ['BONK! BONK! BONK!', 'Best seat on the playa!', 'Don\'t look down. Look at the foam.'] } });
      P.spectators.push(...s);
    }
  });
  bcmCrowd(P, 0, R + 6, 4, 6, { face: [0, 0], behavior: 'idle', extra: { anim: 'cheer' }, chat: ['TWO ENTER!', 'I\'m next. I\'ve been training on a trampoline.'] });
  P.cords = true;
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; bcmFlame(P, Math.sin(a) * 1.25, R + 0.5, Math.cos(a) * 1.25, { every: 16, ph: i * 2, h: 4 }); }
  bcmLaser(P, 0, R + 0.4, 0, Math.PI, { n: 4, spread: TAU, cols: [[1, 0.25, 0.15], [1, 0.6, 0.2]], len: 45, tilt: 0.3, ph: 3, rate: 0.4 });
  bcmPL(P, 0, 6, 0, 16, ['#ff5a3a', '#ffb040'], { i: 1.6 });
  bcmPool(P, 0, 0, 15, '#ff7a3a', 0.45);
  bcmDomeCam(P, 0, 0, R + 0.6);
  bcmArea(P, 'arena', 'The Thunderdome', 0, 0, { r: R - 0.3 }, { dome: true });
  bcmSpot(P, 'arena', 0, 0, 0); bcmSpot(P, 'apex', 0, R, 0); bcmSpot(P, 'gate', 0, 0, R + 1.5, Math.PI); bcmSpot(P, 'mcTower', -7, 3.2, R + 2.5);
  BCM_TD.LEDGES.forEach((y, k) => { const rr = Math.sqrt(R * R - y * y) + 0.45; bcmSpot(P, 'ledge' + (k + 1), Math.sin(1.6) * rr, y, Math.cos(1.6) * rr, 1.6 + Math.PI); });
  // bungee cords (dark lines from the apex to each fighter), drawn every frame
  P.draw = (gg, Rr, S) => {
    if (!P.fighters || !Rr.B || !S.square) return;
    const reg = P.cordReg || (P.cordReg = { u0: lerp(S.square.u0, S.square.u1, 0.4), u1: lerp(S.square.u0, S.square.u1, 0.6), v0: lerp(S.square.v0, S.square.v1, 0.4), v1: lerp(S.square.v0, S.square.v1, 0.6) });
    const top = P.F.w(0, R - 0.4, 0), B = Rr.B;
    for (const fd of P.fighters) {
      const f = bcmActorOf(gg, fd); if (!f || f.hidden) continue;
      const x1 = f.x, y1 = f.y + 1.75, z1 = f.z, dx = x1 - top[0], dy = y1 - top[1], dz = z1 - top[2];
      const px = dx * B.rx + dy * B.ry + dz * B.rz, py = dx * B.ux + dy * B.uy + dz * B.uz, l = Math.hypot(px, py) || 1, w = 0.05;
      Rr.bbs.quad((top[0] + x1) / 2, (top[1] + y1) / 2, (top[2] + z1) / 2, px / 2, py / 2, -py / l * w, px / l * w, reg, 0.05, 0.04, 0.04, 0.95);
    }
  };
}
function bcmSilThunderdome(m, P) {
  const R = BCM_TD.R;
  m.color('#3a2c28'); const G = bcmGeodesic(2);
  for (const [a, b] of G.e) { const A = G.v[a], B = G.v[b]; m.limb(A[0] * R, A[1] * R, A[2] * R, B[0] * R, B[1] * R, B[2] * R, 0.16, 0.16, { seg: 4, ends: false }); }
  m.color('#ff5a3a', 1); m.push(); m.tf(0, 0.4, 0); m.torus(0, 0, 0, R, 0.14, { seg: 20, tseg: 3 }); m.pop(); m.emissive(0);
  return { cols: [bcmC.cyl(0, 0, R * 0.8, 0, 4)], lights: [{ x: 0, y: R + 0.3, z: 0, s: 3, c: '#ff5a3a' }] };
}
BCM_KINDS.thunderdome = {
  name: 'Death Guild Thunderdome', short: 'Thunderdome', bpm: 130, mapCol: '#ff5a3a',
  desc: 'A rusted-steel lattice dome: two bungee fighters bounce and bonk with foam bats, spectators cling to three climbable ledges, an MC tower, fire cannons on the apex.',
  real: 'Death Guild\'s Thunderdome, a fixture since the late 1990s: two fighters in bungee harnesses swing at each other with foam bats inside a big climbable dome while spectators climb all over it.',
  foot: [-13, -13, 13, 18], radius: 18, height: 12, entrance: [0, 15, Math.PI],
  build: bcmBuildThunderdome, sil: bcmSilThunderdome
};

/* ======================= 8. CENTER CAMP =======================
   Real (facts): Black Rock City's central public gathering place: a huge circular shade structure around an open
   courtyard, with a café and stages for performances, open to everyone.
   Our design: a ring of tensile canopy (cream and saffron panels) on short outer poles and tall inner masts, a
   central spire with banners, the round café counter, an open-mic stage, couches, rugs and bunting.
   Local layout: ring canopy r 13..27 around (0, 0), café at the centre, open-mic stage (-18, -6) */
function bcmBuildCenterCamp(api, g, P) {
  const Ri = 13, Ro = 27, Hi = 9, Ho = 4.2, N = 24;
  P.bpm = 110;
  bcmPaint(P, (c, Pt, S) => { const [px, pz] = Pt(0, 0); c.fillStyle = 'rgba(120,90,66,0.32)'; c.beginPath(); c.arc(px, pz, Ro * S, 0, TAU); c.fill(); c.strokeStyle = 'rgba(80,60,44,0.4)'; c.lineWidth = 0.5 * S; c.beginPath(); c.arc(px, pz, Ri * S, 0, TAU); c.stroke(); c.beginPath(); c.arc(px, pz, 4.5 * S, 0, TAU); c.stroke(); });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; bcmRug(P, Math.sin(a) * 20, Math.cos(a) * 20, 4.2, 3, a, ['rgba(150,50,40,0.85)', 'rgba(50,80,120,0.85)', 'rgba(160,110,40,0.85)'][i % 3]); }
  // the ring canopy (two halves to keep each part under the vertex budget)
  for (const half of [0, 1]) {
    bcmPart(P, half ? 0 : 0.01, half ? 18 : -18, m => {
      const cols = [];
      for (let i = half * N / 2; i < (half + 1) * N / 2; i++) {
        const a0 = i / N * TAU, a1 = (i + 1) / N * TAU;
        const f = (u, v, t) => { const a = lerp(a0, a1, u), rr = lerp(Ri, Ro, v), scal = Math.sin(u * Math.PI); t[0] = Math.sin(a) * rr; t[2] = Math.cos(a) * rr; t[1] = lerp(Hi, Ho, v) - Math.sin(v * Math.PI) * 0.7 - scal * (v > 0.85 ? (v - 0.85) * 3.5 : 0) + scal * 0.25 * (1 - v); };
        const col = i % 6 === 3 ? '#c87a4a' : i % 2 ? '#efe6d2' : '#e0d2b6';
        m.color(col).shine(0); m.surf(m.lo ? 2 : 4, m.lo ? 2 : 5, f, {}); m.color(shade(col, -0.18)); m.surf(m.lo ? 2 : 4, m.lo ? 2 : 5, f, { flip: true });
        // poles: a short outer pole and a tall inner mast per panel seam
        const ox = Math.sin(a0) * Ro, oz = Math.cos(a0) * Ro, ix = Math.sin(a0) * Ri, iz = Math.cos(a0) * Ri;
        m.color('#8a7058').shine(1); m.limb(ox, 0, oz, ox, Ho + 0.1, oz, 0.1, 0.08, { seg: 6 }); m.limb(ix, 0, iz, ix, Hi + 0.3, iz, 0.16, 0.12, { seg: 8 });
        m.color('#ffcf8a', 0.9); m.ball(ix, Hi + 0.4, iz, 0.14, { seg: 6, rings: 4 }); m.emissive(0);
        cols.push(bcmC.cyl(ox, oz, 0.12, 0, Ho, { camPass: true }), bcmC.cyl(ix, iz, 0.18, 0, Hi, { camPass: true }));
        if (i % 3 === 0) bcmBunting(m, [ix, Hi - 0.3, iz], [Math.sin(a0 + 0.9) * Ri * 0.2, 14, Math.cos(a0 + 0.9) * Ri * 0.2], 9, BURNS_NEON, 1.2);
      }
      return { cols };
    }, { noAO: true });
  }
  // the central spire + the round café counter + menu board
  bcmPart(P, 0, 0, m => {
    const cols = [], lights = [];
    m.color('#7a6048').shine(1); m.limb(0, 0, 0, 0, 16, 0, 0.3, 0.16, { seg: 10 });
    m.color('#ffd84a', 1); m.ball(0, 16.3, 0, 0.35, { seg: 10, rings: 6 }); m.emissive(0);
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; m.color(['#ff4fd8', '#38f2ff', '#ffe24a'][k]); const f = (u, v, t) => { t[0] = Math.sin(a) * (0.2 + u * 2.6) + Math.cos(a) * Math.sin(u * 4 + v) * 0.15; t[1] = 15.2 - v * 1.4 - u * 0.6; t[2] = Math.cos(a) * (0.2 + u * 2.6); }; m.surf(6, 2, f, {}); m.surf(6, 2, f, { flip: true }); }
    m.push(); m.tf(0, 0, 0);
    m.color('#6a4a30').shine(1); m.lathe([[3.6, 0], [3.6, 1.05], [3.95, 1.1], [3.95, 1.18], [2.9, 1.18], [2.9, 1.08], [3.0, 0]], { seg: 32 });
    m.color('#ffb347', 1); m.lathe([[3.62, 0.08], [3.62, 0.14]], { seg: 32 }); m.emissive(0);
    m.color('#c8ccd4').shine(3); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; m.roundBox(Math.sin(a) * 3.3, 1.45, Math.cos(a) * 3.3, 0.7, 0.5, 0.5, 0.08); }
    m.color('#f4f0e8').shine(1); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; m.push(); m.tf(Math.sin(a) * 3.45, 1.18, Math.cos(a) * 3.45); m.lathe([[0.05, 0], [0.065, 0.1], [0.065, 0.11], [0, 0.02]], { seg: 8 }); m.pop(); }
    m.pop(); m.shine(0);
    for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + Math.PI / 4; cols.push(bcmC.box(Math.sin(a) * 3.3, Math.cos(a) * 3.3, 1.6, 0.4, 0, 1.18, a + Math.PI / 2)); }
    bcmSignMesh(m, 'CENTER CAMP CAFÉ\nCOFFEE · CHAI · LEMONADE\nTIPS ARE HUGS', { bg: '#2a1c12', fg: '#ffe9b0', border: '#ffb347', size: 34, glow: '#ffb347' }, 0, 3.0, 0.4, 1.4, { glow: true, posts: false, frame: '#4a3422' });
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; bcmLantern(m, Math.sin(a) * 5.5, 4.2, Math.cos(a) * 5.5, k % 2 ? '#ffcf8a' : '#ffb070', 1.1); if (k % 2 === 0) lights.push({ x: Math.sin(a) * 5.5, y: 4.2, z: Math.cos(a) * 5.5, s: 0.9, c: '#ffcf8a' }); }
    cols.push(bcmC.cyl(0, 0, 0.32, 0, 16));
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ffcf8a', pool: 14, i: 0.5 });
    return { cols, lights };
  });
  // the open-mic stage + couches
  bcmPart(P, -18, -6, m => {
    const cols = [], sx = -18, sz = -6;
    m.color('#6a4a30').shine(1); m.push(); m.tf(sx, 0, sz); m.roundCyl(0, 0, 0, 3.2, 0.6, 0.1, { seg: 24 }); m.pop();
    m.color('#ffb347', 1); m.push(); m.tf(sx, 0.55, sz); m.torus(0, 0, 0, 3.22, 0.04, { seg: 32, tseg: 4 }); m.pop(); m.emissive(0);
    m.color('#2a2a30').shine(2); m.limb(sx + 0.6, 0.6, sz, sx + 0.6, 2.0, sz, 0.02, 0.02, { seg: 5 }); m.limb(sx + 0.6, 2.0, sz, sx + 0.9, 2.1, sz, 0.015, 0.015, { seg: 4 }); m.ball(sx + 0.95, 2.1, sz, 0.05, { seg: 6, rings: 4 });
    for (const sd of [-1, 1]) bcmSpeaker(m, sx + sd * 2.4, 0.6, sz + 1.2, 0.7, 1.0, 0.5, { cones: 2 });
    cols.push(bcmC.cyl(sx, sz, 3.2, 0, 0.6));
    for (let i = 0; i < 7; i++) { const a = 0.6 + i / 7 * (TAU - 1.2), x = Math.sin(a) * 20.5, z = Math.cos(a) * 20.5; if (Math.hypot(x - sx, z - sz) < 6) continue; cols.push(bcmCouch(m, x, z, a + Math.PI, ['#8a3a4a', '#3a5a8a', '#6a5a2a', '#7a3a6a'][i % 4], { pillow: ['#e8b04a', '#7aff5a', '#e86a4a'][i % 3] })); }
    return { cols, lights: [{ x: sx, y: 2.4, z: sz, s: 1.0, c: '#ffcf8a' }] };
  });
  bcmPart(P, 0, 28, m => { bcmSignMesh(m, 'CENTER CAMP', { bg: '#2a1c12', fg: '#ffe9b0', border: '#e8b45a', size: 56 }, 6, 1.0, 29, 1.2, { yaw: -0.2, frame: '#4a3422' }); return { cols: [bcmC.box(6, 29, 2.3, 0.12, 0, 2.3, -0.2, { walk: false })] }; });
  const st = bcmStage(P, 'openMic', 'Open Mic', -18.2, 0.6, -6, Math.PI / 2, [-11, -6, 5], { genre: 'disco', bpm: 110 });
  const poet = P.api.npc({ id: P.id + '_poet', name: 'SLAM POET SAGE', type: 'burner', seed: 23, x: st.booth.x, z: st.booth.z, y: st.booth.y, fixedY: true, yaw: st.booth.yaw, behavior: 'idle', anim: 'talk', lookAt: false, lines: ['The dust... is also... a metaphor.', 'Snaps if you felt that. SNAPS.'] });
  P.actors.push(poet); st.dj = poet;
  bcmCrowd(P, -11, -6, 3.5, 5, { behavior: 'sit', face: [-18, -6], chat: ['*snap snap snap*', 'Deep. Like the playa. Which is flat.'] });
  bcmCrowd(P, 0, 9, 7, 8, { behavior: 'wander', extra: { radius: 7 }, chat: ['Meet me at Center Camp. Everybody says that. Everybody is here.', 'I\'ve been in the coffee line since Tuesday.', 'Free hugs? Free hugs.'] });
  for (const [x, z, yaw, seed] of [[3.9, 0.6, -Math.PI / 2, 2], [-0.6, 3.9, Math.PI, 16]]) P.actors.push(P.api.npc({ type: 'burner', seed, name: 'CAFÉ VOLUNTEER', x: P.F.wx(x * 0.75, z * 0.75), z: P.F.wz(x * 0.75, z * 0.75), yaw: P.F.rot + yaw, behavior: 'idle', anim: 'idle', lines: ['Coffee? It\'s a gift. Chai? Also a gift. Everything\'s a gift.'] }));
  bcmPL(P, 0, 6, 0, 18, ['#ffcf8a'], { i: 1.0, pulse: false });
  bcmPool(P, 0, 0, 26, '#ffb070', 0.32);
  bcmArea(P, 'cafe', 'Center Camp Café', 0, 0, { r: 7 }); bcmArea(P, 'ring', 'Center Camp', 0, 0, { r: Ro });
  bcmSpot(P, 'cafe', 0, 0, 5, Math.PI); bcmSpot(P, 'openMic', -18.2, 0.6, -6, Math.PI / 2); bcmSpot(P, 'couch', Math.sin(1.5) * 20.5, 0.5, Math.cos(1.5) * 20.5); bcmSpot(P, 'spire', 0, 16, 0);
}
function bcmSilCenterCamp(m, P) {
  m.color('#efe4cc'); m.lathe([[27, 4.2], [13, 9], [13, 8.6], [27, 3.9]], { seg: 16 }); m.lathe([[27, 4.0], [13, 8.8]], { seg: 16, flip: true });
  m.color('#7a6048'); m.limb(0, 0, 0, 0, 16, 0, 0.3, 0.16, { seg: 5 }); m.color('#ffd84a', 1); m.ball(0, 16.3, 0, 0.5, { seg: 6, rings: 3 }); m.emissive(0);
  return { cols: [bcmC.cyl(0, 0, 0.4, 0, 16)], lights: [{ x: 0, y: 16.5, z: 0, s: 3, c: '#ffd84a' }, { x: 0, y: 5, z: 0, s: 5, c: '#ffcf8a' }] };
}
BCM_KINDS.centerCamp = {
  name: 'Center Camp', short: 'Center Camp', bpm: 110, mapCol: '#ffcf8a',
  desc: 'The big shade circle: a ring of tensile canopy on poles and masts around an open courtyard, the round café counter under a bannered spire, an open-mic stage, couches and rugs.',
  real: 'Black Rock City\'s central public gathering place: a huge circular shade structure around an open courtyard, with a café and stages for performances, open to everyone.',
  foot: [-28, -28, 28, 31], radius: 30, height: 17, entrance: [0, 29, Math.PI],
  build: bcmBuildCenterCamp, sil: bcmSilCenterCamp
};

/* ======================= 9. SPACE COWBOYS (OG, 1997+) =======================
   Real (facts): a San Francisco party collective that camped at Burning Man before theme camps had a name and took the
   name with its 1997 camp; around 2000 it fielded the playa's first big sound vehicle, a converted off-road military
   truck (a collaboration with the Space Lounge camp, the first large-scale sound system on the playa).
   Our design: a space-western saloon front (porch stage, swinging doors, neon stars, rocket fins and a radar dish), a
   rocket water tower, hay bales and a corral, and our own mutant sound truck that parks by the saloon and drives a loop.
   Local layout (+Z = street): saloon (0, -8), porch stage z -3..0, truck dock (13, 6), floor (0, 7) */
function bcmSCTruck(m) {
  const cols = [], lights = [], olive = '#5a6a3a', chrome = '#c8ccd4';
  const lo0 = m.lo; m.lo = true;
  for (const z of [-3.2, -1.4, 3.4]) for (const sx of [-1, 1]) { m.push(); m.tf(sx * 1.25, 0.72, z, 0, 0, Math.PI / 2); m.color('#1a1a1c').shine(1); m.roundCyl(0, -0.32, 0, 0.72, 0.64, 0.2, { seg: 12 }); m.color('#8a8a92').shine(3); m.roundCyl(0, sx > 0 ? 0.3 : -0.36, 0, 0.34, 0.06, 0.02, { seg: 10 }); m.pop(); }
  m.lo = lo0;
  m.color('#2a2a24').shine(1); m.roundBox(0, 1.0, 0, 2.2, 0.4, 8.6, 0.1);
  // rounded cab with a split windscreen
  m.color(olive).shine(2); m.roundBox(0, 2.0, 3.2, 2.5, 1.7, 2.2, 0.35); m.roundBox(0, 1.35, 4.6, 2.4, 0.9, 1.0, 0.3);
  for (const sx of [-1, 1]) { m.color(olive); m.ellipsoid(sx * 1.18, 1.25, 3.4, 0.35, 0.55, 1.2, { seg: 10, rings: 6 }); m.ellipsoid(sx * 1.18, 1.25, -1.6, 0.35, 0.55, 1.6, { seg: 10, rings: 6 }); }
  m.color('#9ad8ff').shine(3); for (const sx of [-0.55, 0.55]) { m.push(); m.tf(sx, 2.35, 4.32, 0, -0.25, 0); m.roundBox(0, 0, 0, 1.0, 0.75, 0.05, 0.05); m.pop(); }
  m.color('#fff2c8', 1); for (const sx of [-0.85, 0.85]) m.ball(sx, 1.45, 5.12, 0.16, { seg: 8, rings: 5 }); m.emissive(0);
  m.color(chrome).shine(3); m.roundBox(0, 0.85, 5.15, 2.3, 0.22, 0.2, 0.06); for (const sx of [-1, 1]) m.limb(sx * 1.05, 1.5, 2.2, sx * 1.05, 3.9, 2.2, 0.08, 0.07, { seg: 7 });
  // roll bar with lights over the cab
  m.color('#2a2a2a').shine(2); m.limb(-1.15, 2.85, 2.6, -1.15, 3.5, 2.6, 0.06, 0.06, { seg: 6 }); m.limb(1.15, 2.85, 2.6, 1.15, 3.5, 2.6, 0.06, 0.06, { seg: 6 }); m.limb(-1.15, 3.5, 2.6, 1.15, 3.5, 2.6, 0.06, 0.06, { seg: 6 });
  m.color('#ffe9a0', 1); for (let k = 0; k < 4; k++) m.ball(-0.75 + k * 0.5, 3.6, 2.65, 0.11, { seg: 6, rings: 4 }); m.emissive(0);
  // the flatbed: deck, speaker wall, DJ booth, star rail
  m.color('#6a5a40').shine(1); m.roundBox(0, 1.35, -1.2, 2.6, 0.2, 5.6, 0.06);
  cols.push(bcmC.box(0, -1.2, 1.3, 2.8, 0.4, 1.45), bcmC.box(0, 3.4, 1.25, 1.6, 0.4, 2.9));
  m.push(); m.tf(0, 0, 0.45, Math.PI);
  for (let i = 0; i < 2; i++) for (let k = 0; k < 2; k++) bcmSpeaker(m, (k - 0.5) * 1.15, 1.45 + i * 1.1, 0, 1.1, 1.05, 0.9, { cones: 1, col: '#20221c', led: i === 1 ? '#ffd84a' : null });
  m.pop();
  cols.push(bcmC.box(0, 0.45, 1.2, 0.5, 1.45, 3.7));
  cols.push(...bcmBooth(m, 0, 1.45, -2.4, Math.PI, { w: 2.0, d: 0.7, ca: '#ffd84a', cb: '#38f2ff', body: '#3a3a2a' }));
  m.color(chrome).shine(3); for (const sx of [-1.25, 1.25]) m.limb(sx, 2.35, 0.9, sx, 2.35, -3.3, 0.04, 0.04, { seg: 5 });
  m.color('#ffd84a', 1); for (let k = 0; k < 6; k++) { const z = 0.6 - k * 0.75; for (const sx of [-1.25, 1.25]) m.ball(sx, 2.42, z, 0.07, { seg: 6, rings: 4 }); } m.emissive(0);
  // rear ladder
  m.color('#3a3a30'); for (const sx of [-0.35, 0.35]) m.limb(sx, 0.05, -4.6, sx, 1.4, -4.15, 0.04, 0.04, { seg: 5 }); for (let k = 1; k < 4; k++) m.limb(-0.35, k * 0.35, -4.6 + k * 0.11, 0.35, k * 0.35, -4.6 + k * 0.11, 0.03, 0.03, { seg: 4 });
  cols.push(bcmC.ramp(0, -4.65, 0.45, 0.6, 0.05, 1.45));
  lights.push({ x: 0, y: 2.8, z: -1.6, s: 1.0, c: '#ffd84a' }, { x: 0, y: 1.5, z: 5.3, s: 1.4, c: '#fff2c8' });
  m.shine(0);
  return { cols, lights, seat: [0.55, 1.45, 3.0], poofers: [[-1.05, 4.0, 2.2], [1.05, 4.0, 2.2]], w: 2.6, len: 10, top: 1.45 };
}
const BCM_SC_TOUR = [[13, 6], [13.2, 1], [15.5, -5], [21, -10.5], [14, -20], [0, -22], [-14, -20], [-22, -10], [-24, 4], [-20, 18], [-10, 26], [4, 26], [11.5, 21], [13, 14], [13, 6]];
function bcmBuildSpaceCowboys(api, g, P) {
  P.bpm = 125;
  const wood = '#8a5a34', wood2 = '#6a4224', neon = '#38f2ff', gold = '#ffd84a';
  bcmPaint(P, (c, Pt, S) => { const [px, pz] = Pt(0, 7); c.fillStyle = 'rgba(110,78,52,0.35)'; c.beginPath(); c.arc(px, pz, 10 * S, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,216,74,0.3)'; c.lineWidth = 0.3 * S; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - Math.PI / 2; c.beginPath(); c.moveTo(px, pz); c.lineTo(px + Math.cos(a) * 9 * S, pz + Math.sin(a) * 9 * S); c.stroke(); } });
  // the saloon: false front, porch stage, swinging doors, windows, neon stars, rocket fins, radar dish
  bcmPart(P, 0, -8, m => {
    const cols = [], lights = [];
    m.color(wood2).shine(0); m.roundBox(0, 2.8, -9, 11, 5.6, 7, 0.1);
    m.color(wood).shine(0); m.roundBox(0, 4.2, -5.4, 12, 8.4, 0.35, 0.06, { uv: BURNS_ATLAS.pattern('wood') });
    m.color(wood2); for (let k = -5; k <= 5; k++) m.roundBox(k * 1.1, 4.2, -5.2, 0.06, 8.3, 0.04, 0.01);
    // stepped false-front top
    m.color(wood); m.roundBox(0, 8.7, -5.4, 7, 0.9, 0.35, 0.06); m.roundBox(0, 9.3, -5.4, 3.6, 0.6, 0.35, 0.06);
    bcmSignMesh(m, 'SPACE COWBOYS', { bg: '#1a1020', fg: gold, border: neon, size: 54, glow: neon }, 0, 6.3, -5.15, 1.25, { glow: true, posts: false, maxW: 8, frame: '#2a1a14' });
    // windows (glowing) + swinging doors
    for (const sx of [-3.6, 3.6]) { m.color('#3a2414'); m.roundBox(sx, 2.4, -5.2, 2.2, 1.8, 0.12, 0.05); m.color('#ffcf8a', 0.85); m.roundBox(sx, 2.4, -5.12, 1.9, 1.5, 0.05, 0.02); m.emissive(0); m.color('#3a2414'); m.roundBox(sx, 2.4, -5.08, 0.08, 1.5, 0.05, 0.01); m.roundBox(sx, 2.4, -5.08, 1.9, 0.08, 0.05, 0.01); lights.push({ x: sx, y: 2.4, z: -4.6, s: 1.0, c: '#ffcf8a' }); }
    m.color('#2a1a10'); m.roundBox(0, 1.9, -5.2, 2.0, 2.6, 0.1, 0.04);
    for (const sd of [-1, 1]) { m.color(wood); m.push(); m.tf(sd * 0.5, 0, -5.0, sd * 0.25); m.roundBox(0, 1.5, 0, 0.92, 1.0, 0.06, 0.04); m.pop(); }
    // porch (the stage): deck, posts, a roof with neon trim
    m.color(wood).shine(1); m.roundBox(0, 0.5, -2.6, 12, 1.0, 5.2, 0.08, { top: '#9a6a40' });
    for (let k = 0; k < 6; k++) { m.color(wood2); m.roundBox(-5.5 + k * 2.2, 0.5, -0.02, 0.12, 0.9, 0.06, 0.02); }
    m.color(wood2); for (const sx of [-5.8, -2.2, 2.2, 5.8]) m.limb(sx, 1.0, -0.3, sx, 4.4, -0.3, 0.12, 0.11, { seg: 7 });
    m.color(wood); m.push(); m.tf(0, 4.5, -2.6, 0, -0.12, 0); m.roundBox(0, 0, 0, 12.4, 0.18, 5.6, 0.05); m.pop();
    m.color(neon, 1); m.roundBox(0, 4.22, -0.12, 12.2, 0.06, 0.06, 0.02); m.emissive(0);
    // neon stars on the front + rocket fins on the corners + a radar dish on the roof
    const star = (cx, cy, r, col) => { const pts = []; for (let k = 0; k <= 10; k++) { const a = k / 10 * TAU - Math.PI / 2, rr = k % 2 ? r * 0.45 : r; pts.push([cx + Math.cos(a) * rr, cy - Math.sin(a) * rr, -5.15]); } m.color(col, 1); bcmTube(m, pts, 0.06, { seg: 4, caps: false }); m.emissive(0); };
    star(-4.6, 6.4, 0.8, gold); star(4.6, 6.4, 0.8, gold); star(0, 9.0, 0.45, neon);
    for (const sd of [-1, 1]) { m.color('#c8ccd4').shine(3); m.push(); m.tf(sd * 6.1, 0, -5.4, 0, 0, sd * -0.12); m.lathe([[0.35, 0], [0.45, 2], [0.35, 6], [0.15, 8.4], [0, 9.0]], { seg: 12 }); m.pop(); m.color('#ff5a3a').shine(2); m.push(); m.tf(sd * 6.6, 0.4, -5.4, 0, 0, sd * 0.4); m.roundBox(0, 0.8, 0, 0.12, 1.6, 1.2, 0.05); m.pop(); }
    m.color('#c8ccd4').shine(3); m.push(); m.tf(3, 5.6, -10, 0.6, -0.7, 0); m.lathe([[0, 0], [1.1, 0.35], [1.2, 0.42], [1.1, 0.42]], { seg: 16 }); m.pop(); m.limb(3, 5.6, -10, 3, 6.4, -9.7, 0.03, 0.03, { seg: 4 }); m.shine(0);
    cols.push(bcmC.box(0, -9, 5.5, 3.5, 0, 5.6), bcmC.box(0, -5.4, 6.1, 0.2, 0, 9.6, 0, { walk: false }), bcmC.box(0, -2.6, 6, 2.6, 0, 1.0));
    for (const sx of [-5.8, -2.2, 2.2, 5.8]) cols.push(bcmC.cyl(sx, -0.3, 0.13, 1.0, 4.4, { camPass: true }));
    // porch steps
    for (let k = 0; k < 2; k++) { m.color(wood); m.roundBox(0, (k + 1) * 0.33 / 2 + 0.0, 0.25 + (1 - k) * 0.45, 3.0, (k + 1) * 0.33, 0.45, 0.04); cols.push(bcmC.box(0, 0.25 + (1 - k) * 0.45, 1.5, 0.23, 0, (k + 1) * 0.33)); }
    return { cols, lights };
  });
  bcmPart(P, 0, -5, m => { const cols = bcmBooth(m, 0, 1.0, -3.2, 0, { w: 2.8, ca: gold, cb: neon, body: '#3a2414', top: '#5a3a24' }); for (const sd of [-1, 1]) { m.push(); m.tf(sd * 4.2, 1.0, -3.4, -sd * 0.2); bcmSpeaker(m, 0, 0, 0, 1.3, 2.2, 0.9, { cones: 2, col: '#2a1a10', led: gold }); m.pop(); cols.push(bcmC.box(sd * 4.2, -3.4, 0.65, 0.45, 1.0, 3.2, -sd * 0.2)); } return { cols }; });
  // the rocket water tower, hay bales, corral, wagon wheel
  bcmPart(P, -15, -4, m => {
    const cols = [], x = -15, z = -6;
    m.color('#5a4a3a').shine(1); for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) m.limb(x + sx * 1.3, 0, z + sz * 1.3, x + sx * 0.9, 6, z + sz * 0.9, 0.12, 0.1, { seg: 6 });
    for (const sd of [-1, 1]) { m.limb(x - 1.2, 1.2, z + sd * 1.2, x + 1.0, 4.6, z + sd * 1.0, 0.05, 0.05, { seg: 5 }); m.limb(x + sd * 1.2, 1.2, z - 1.2, x + sd * 1.0, 4.6, z + 1.0, 0.05, 0.05, { seg: 5 }); }
    m.color('#d8dce4').shine(3); m.push(); m.tf(x, 6, z); m.lathe([[1.5, 0], [1.6, 0.4], [1.6, 3.2], [1.2, 4.6], [0.5, 5.8], [0, 6.4]], { seg: 20 }); m.pop();
    m.color('#ff5a3a').shine(2); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; m.push(); m.tf(x + Math.sin(a) * 1.6, 6.2, z + Math.cos(a) * 1.6, a, 0, 0); m.roundBox(0, 0.6, 0.35, 0.1, 1.4, 0.9, 0.04); m.pop(); }
    m.color('#38f2ff', 0.9); m.push(); m.tf(x, 8.6, z); m.torus(0, 0, 0, 1.62, 0.06, { seg: 24, tseg: 4 }); m.pop(); m.color('#ffd84a', 1); m.ball(x, 12.5, z, 0.12, { seg: 6, rings: 4 }); m.emissive(0);
    cols.push(bcmC.cyl(x, z, 1.5, 0, 6), bcmC.cyl(x, z, 1.6, 6, 12.4));
    for (const [hx, hz, yaw] of [[-8, 4, 0.3], [-8.5, 6.5, -0.2], [8, 3, -0.3], [-4, 11, 0.1], [4, 11.5, -0.1]]) { m.color('#d8b860').shine(0); m.roundBox(hx, 0.3, hz, 1.6, 0.6, 0.8, 0.12); m.color('#b89840'); for (const sx of [-0.4, 0.4]) m.roundBox(hx + Math.cos(yaw) * sx, 0.3, hz - Math.sin(yaw) * sx, 0.04, 0.62, 0.82, 0.01); cols.push(bcmC.box(hx, hz, 0.8, 0.4, 0, 0.6, yaw)); }
    // a corral of rounded rails on the far side
    const cx0 = -13.4, cx1 = -8.2, cz0 = 12, cz1 = 18;
    m.color(wood2).shine(0); for (let k = 0; k < 6; k++) { const px = cx0 + (k % 3) * (cx1 - cx0) / 2, pz = Math.floor(k / 3) ? cz1 : cz0; m.limb(px, 0, pz, px, 1.3, pz, 0.08, 0.07, { seg: 6 }); }
    for (const pz of [cz0, cz1]) for (const h of [0.5, 1.1]) m.limb(cx0, h, pz, cx1, h, pz, 0.05, 0.05, { seg: 5 });
    for (const px of [cx0, cx1]) for (const h of [0.5, 1.1]) m.limb(px, h, cz0, px, h, cz1, 0.05, 0.05, { seg: 5 });
    cols.push(bcmC.wall(cx0, cz0, cx1, cz0, 0.2, 0, 1.3), bcmC.wall(cx0, cz1, cx1, cz1, 0.2, 0, 1.3), bcmC.wall(cx0, cz0, cx0, cz1, 0.2, 0, 1.3), bcmC.wall(cx1, cz0, cx1, cz1, 0.2, 0, 1.3));
    // a wagon wheel leaning on the saloon
    m.color(wood2); m.push(); m.tf(-7.4, 0.95, -5.0, 0.3, Math.PI / 2 - 0.15, 0); m.torus(0, 0, 0, 0.9, 0.06, { seg: 18, tseg: 4 }); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; m.limb(0, 0, 0, Math.sin(a) * 0.88, 0, Math.cos(a) * 0.88, 0.025, 0.025, { seg: 4 }); } m.pop();
    return { cols, lights: [{ x, y: 8.6, z, s: 2, c: '#38f2ff' }] };
  });
  // the sound truck (parks by the saloon, drives a loop)
  if (P.o.truck !== false && P.o.withArtCar !== false) {
    const V = bcmVehicle(api, g, P, { build: m => bcmSCTruck(m), dock: [13, 6, Math.PI], tour: BCM_SC_TOUR, drive: P.o.drive !== false, dockTime: P.o.dockTime || 35, speed: 5.5, slowSpeed: 2.6, core: [-9, -6, 15, 17],
      label: 'DRIVE', hornLines: ['YEEHAW!', 'Space truck!', 'The original sound car!'], driveHint: 'DRIVING THE SOUND TRUCK! JUMP = HORN' });
    P.artCar = V;
    bcmRider(P, V, [0, 1.45, -1.65, Math.PI], { anim: 'dj', type: 'burner', seed: 12, name: 'DJ STARDUST', lines: ['This truck has been rocking the playa since the turn of the century. Well, its great-grandpa has.'] });
    P.routes.truck = V.tour.pts;
    P.stages.push({ id: 'truck', name: 'The Sound Truck', camp: P, get booth() { const c = V.car, cc = Math.cos(c.yaw), s = Math.sin(c.yaw); return { x: c.x - 1.65 * s, y: c.y + 1.45, z: c.z - 1.65 * cc, yaw: c.yaw + Math.PI }; }, floor: null, bpm: P.bpm, genre: 'disco', vehicle: V });
  }
  const st = bcmStage(P, 'porch', 'The Saloon Porch', 0, 1.0, -3.95, 0, [0, 7, 8], { genre: 'disco', bpm: 125 });
  bcmDJ(P, st, { id: P.id + '_dj', name: 'DJ HIGH NOON', seed: 27, lines: ['Howdy, space partner. Two-step or moonwalk, your call.', 'This here\'s a hoedown with a bass drop.'] });
  bcmCrowd(P, 0, 7, 7, 10, { face: [0, -4], lines: ['Yeehaw, but make it intergalactic.', 'These folks have been throwing parties since before the playa had a name for it.', 'Is that a rocket or a water tower? Yes.'] });
  bcmLaser(P, 0, 9.8, -5.4, 0, { n: 6, spread: 1.6, cols: [[1, 0.85, 0.3], [0.25, 0.95, 1]], len: 55, tilt: 0.08, ph: 2 });
  bcmPL(P, 0, 5, -1, 16, [gold, neon, '#ff5a3a'], { i: 1.5 });
  bcmPool(P, 0, 2, 16, '#ffcf8a', 0.45);
  bcmArea(P, 'saloon', 'The Saloon', 0, 2, { hx: 14, hz: 14 });
  bcmSpot(P, 'porch', 0, 1.0, -2.6); bcmSpot(P, 'booth', 0, 1.0, -3.95); bcmSpot(P, 'floor', 0, 0, 7, Math.PI); bcmSpot(P, 'waterTower', -15, 0, -3, Math.PI); bcmSpot(P, 'truckDock', 13, 0, 6, Math.PI);
}
function bcmSilSpaceCowboys(m, P) {
  m.color('#8a5a34'); m.roundBox(0, 4.4, -7.5, 12, 8.8, 7, 0.2); m.color('#38f2ff', 1); m.roundBox(0, 6.3, -3.95, 7, 1.2, 0.1, 0.05); m.emissive(0);
  m.color('#d8dce4'); m.push(); m.tf(-15, 6, -6); m.lathe([[1.6, 0], [1.6, 3.2], [0, 6.4]], { seg: 8 }); m.pop(); m.color('#5a4a3a'); m.roundBox(-15, 3, -6, 2.4, 6, 2.4, 0.2);
  return { cols: [bcmC.box(0, -7.5, 6, 3.5, 0, 8.8)], lights: [{ x: 0, y: 9.4, z: -5, s: 3, c: '#ffd84a' }, { x: -15, y: 12.5, z: -6, s: 2, c: '#38f2ff' }] };
}
BCM_KINDS.spaceCowboys = {
  name: 'Space Cowboys', short: 'Space Cowboys', bpm: 125, mapCol: '#ffd84a', og: true,
  desc: 'OG (1997+): a space-western saloon with a porch stage, a rocket water tower, hay bales and a corral, and a mutant sound truck that parks by the saloon and drives a loop.',
  real: 'A San Francisco party collective that camped at Burning Man before theme camps had a name and took the name with its 1997 camp; around 2000 it fielded the playa\'s first big sound vehicle, a converted off-road military truck, born from a collaboration with the Space Lounge camp (the first large-scale sound system on the playa).',
  foot: [-20, -16, 24, 28], radius: 32, height: 12, entrance: [0, 27, Math.PI], tourClear: [-28, -26, 28, 30],
  build: bcmBuildSpaceCowboys, sil: bcmSilSpaceCowboys
};

/* ======================= 10. SOL SYSTEM (OG, 2004 "Sol Henge") =======================
   Real (facts): a San Francisco collective whose 2004 camp, fondly known as "Sol Henge", was one of the big sound
   productions of its year.
   Our design: a henge of ten glowing trilithons around the dance floor, an inner horseshoe of five taller ones
   around the DJ's altar stone, a golden sun disc on a frame above the altar, planets glowing on tall poles outside.
   Local layout: henge centre (0, 0) r 12.5; altar (0, -6.5) faces +Z */
function bcmStone(m, x, z, w, h, d, yaw, col, seed) {
  const R = mulberry32(seed); m.color(col).shine(0); m.push(); m.tf(x, 0, z, yaw + (R() - 0.5) * 0.08, (R() - 0.5) * 0.05, (R() - 0.5) * 0.05);
  m.roundBox(0, h / 2, 0, w, h, d, Math.min(w, d) * 0.3); m.color(shade(col, -0.12)); m.roundBox((R() - 0.5) * w * 0.3, h * (0.3 + R() * 0.4), d / 2 - 0.04, w * 0.5, h * 0.25, 0.1, 0.05);
  m.pop();
}
function bcmBuildSolSystem(api, g, P) {
  P.bpm = 126;
  const stone = '#a8a296', R0 = 12.5, sunC = '#ffb347';
  bcmDisc(P, 0, 0, R0 - 1.4, 'rgba(120,96,70,0.35)', 'rgba(255,179,71,0.5)', 0.3);
  bcmPaint(P, (c, Pt, S) => { const [px, pz] = Pt(0, 0); c.strokeStyle = 'rgba(255,179,71,0.35)'; c.lineWidth = 0.2 * S; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(px, pz); c.lineTo(px + Math.cos(a) * (R0 - 1.4) * S, pz + Math.sin(a) * (R0 - 1.4) * S); c.stroke(); } });
  // the outer ring of trilithons + uplights
  bcmPart(P, 0, 0, m => {
    const cols = [], lights = [], n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i + 0.5) / n * TAU; if (Math.abs(BurnsM.wrap(a)) < 0.2) continue;
      const cx = Math.sin(a) * R0, cz = Math.cos(a) * R0, tx = Math.cos(a), tz = -Math.sin(a), h = 4.4, half = 1.25;
      for (const sd of [-1, 1]) { const x = cx + tx * sd * half, z = cz + tz * sd * half; bcmStone(m, x, z, 1.1, h, 0.9, a, i % 2 ? stone : '#b0a898', i * 7 + sd + 3); cols.push(bcmC.box(x, z, 0.55, 0.45, 0, h, a)); m.color(i % 2 ? sunC : '#ff7a3a', 1); m.ball(x - Math.sin(a) * 0.65, 0.18, z - Math.cos(a) * 0.65, 0.16, { seg: 8, rings: 5 }); m.emissive(0); if (sd > 0) lights.push({ x: x - Math.sin(a) * 0.7, y: 0.6, z: z - Math.cos(a) * 0.7, s: 0.8, c: sunC, pool: 3.5, i: 0.4 }); }
      m.push(); m.tf(cx, h, cz, a); m.color('#b8b0a2'); m.roundBox(0, 0.45, 0, 3.8, 0.9, 1.0, 0.25); m.color(sunC, 0.9); m.roundBox(0, 0.05, -0.51, 3.4, 0.06, 0.03, 0.01); m.emissive(0); m.pop();
      cols.push(bcmC.box(cx, cz, 1.9, 0.5, h, h + 0.9, a));
    }
    return { cols, lights };
  });
  // the inner horseshoe of five taller trilithons around the altar
  bcmPart(P, 0, -5, m => {
    const cols = [];
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + (i - 2) * 0.55, rr = 7.2, cx = Math.sin(a) * rr, cz = Math.cos(a) * rr, tx = Math.cos(a), tz = -Math.sin(a), h = 5.8, half = 1.3;
      for (const sd of [-1, 1]) { const x = cx + tx * sd * half, z = cz + tz * sd * half; bcmStone(m, x, z, 1.3, h, 1.0, a, '#9a9488', i * 5 + sd + 50); cols.push(bcmC.box(x, z, 0.65, 0.5, 0, h, a)); }
      m.push(); m.tf(cx, h, cz, a); m.color('#aaa294'); m.roundBox(0, 0.5, 0, 4.0, 1.0, 1.1, 0.28); m.color('#ff7a3a', 0.9); m.roundBox(0, 0.05, 0.56, 3.6, 0.06, 0.03, 0.01); m.emissive(0); m.pop();
      cols.push(bcmC.box(cx, cz, 2.0, 0.55, h, h + 1.0, a));
    }
    // the altar stone (the DJ booth sits on it) + the sun disc on its frame
    bcmStone(m, 0, -6.4, 4.2, 1.0, 2.2, 0, '#8a8478', 91);
    cols.push(bcmC.box(0, -6.4, 2.1, 1.1, 0, 1.0));
    cols.push(...bcmBooth(m, 0, 1.0, -6.0, 0, { w: 2.6, ca: sunC, cb: '#ff7a3a', body: '#3a342c', top: '#4a443a', ledFn: (u, v) => (Math.hypot(u - 0.5, (v - 0.4) * 0.6) < 0.18 ? '#fff0c0' : Math.sin(Math.atan2(v - 0.4, u - 0.5) * 8) > 0.3 ? sunC : null) }));
    m.color('#5a5048').shine(2); for (const sd of [-1, 1]) m.limb(sd * 3.4, 0, -9.2, sd * 2.6, 8.6, -9.2, 0.12, 0.1, { seg: 7 }); m.limb(-2.6, 8.6, -9.2, 2.6, 8.6, -9.2, 0.1, 0.1, { seg: 6 });
    m.push(); m.tf(0, 6.6, -9.0, 0, Math.PI / 2, 0);
    m.color('#e0aa30').shine(2); m.torus(0, 0, 0, 2.5, 0.22, { seg: 40, tseg: 6 });
    m.color(sunC, 1); m.lathe([[0, 0.1], [2.2, 0.05], [2.25, 0], [0, 0]], { seg: 32 }); m.color('#fff0c0', 1); m.lathe([[0, 0.16], [1.0, 0.12], [1.05, 0.1], [0, 0.1]], { seg: 24 });
    m.pop();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r0 = 2.8, r1 = i % 2 ? 3.6 : 4.3; m.color(i % 2 ? '#ff7a3a' : '#ffd84a', 1); m.limb(Math.cos(a) * r0, 6.6 + Math.sin(a) * r0, -9.05, Math.cos(a) * r1, 6.6 + Math.sin(a) * r1, -9.05, 0.09, 0.04, { seg: 5 }); }
    m.emissive(0).shine(0);
    return { cols, lights: [{ x: 0, y: 6.6, z: -8.6, s: 6, c: sunC }] };
  }, { noAO: true });
  // planets on tall poles around the outside (our "Sol System")
  bcmPart(P, 0, 0, m => {
    const cols = [], lights = [], pl = [['#c8a070', 0.5], ['#e8c890', 0.7], ['#5a9aff', 0.75], ['#e8603a', 0.6], ['#e8b878', 1.3], ['#f0d8a0', 1.1], ['#9ae8f0', 0.9], ['#5a7aff', 0.85]];
    pl.forEach(([c, r], i) => {
      const a = 0.35 + i / pl.length * (TAU - 0.7), rr = R0 + 4.5 + (i % 2) * 1.5, x = Math.sin(a) * rr, z = Math.cos(a) * rr, h = 6.5 + (i % 3) * 1.6;
      m.color('#4a4440').shine(2); m.limb(x, 0, z, x, h - r, z, 0.07, 0.05, { seg: 6 });
      m.color(c, 0.75).shine(1); m.ball(x, h, z, r, { seg: 16, rings: 10 });
      if (i === 5) { m.color('#e8d8b0', 0.6); m.push(); m.tf(x, h, z, 0.4, 0.35, 0); m.torus(0, 0, 0, r * 1.8, r * 0.12, { seg: 28, tseg: 3, sy: 0.25 }); m.pop(); }
      m.emissive(0).shine(0);
      lights.push({ x, y: h, z, s: r * 2.2, c });
      cols.push(bcmC.cyl(x, z, 0.1, 0, h, { camPass: true }));
    });
    return { cols, lights };
  });
  bcmPart(P, 0, R0 + 4, m => { bcmSignMesh(m, 'SOL SYSTEM\n· SOL HENGE ·', { bg: '#2a1a10', fg: '#ffd84a', border: sunC, size: 48, glow: sunC }, 5.5, 1.0, R0 + 4, 1.4, { yaw: -0.3, glow: true, frame: '#4a3a2a' }); return { cols: [bcmC.box(5.5, R0 + 4, 1.5, 0.12, 0, 2.5, -0.3, { walk: false })] }; });
  const st = bcmStage(P, 'altar', 'The Altar Stone', 0, 1.0, -6.75, 0, [0, 2, 8], { genre: 'melodic', bpm: 126 });
  bcmDJ(P, st, { id: P.id + '_dj', name: 'DJ SOLSTICE', seed: 19, lines: ['Ten stones, one sun, all night.', 'The planets are aligned. Mostly.'] });
  bcmCrowd(P, 0, 2, 7.5, 12, { face: [0, -6], lines: ['They called this Sol Henge back in \'04.', 'The stones glow when the bass hits. I swear.', 'Which planet are we on? Dancing.'] });
  bcmLaser(P, 0, 8.6, -9.2, 0, { n: 6, spread: 2.0, cols: [[1, 0.7, 0.2], [1, 0.4, 0.1]], len: 55, tilt: 0.1, ph: 1 });
  bcmPL(P, 0, 5, -3, 16, [sunC, '#ff7a3a', '#ffd84a'], { i: 1.6 });
  bcmPool(P, 0, 0, 16, '#ffb070', 0.45);
  bcmArea(P, 'henge', 'Sol Henge', 0, 0, { r: R0 + 1 });
  bcmSpot(P, 'altar', 0, 1.0, -6.4); bcmSpot(P, 'booth', 0, 1.0, -6.75); bcmSpot(P, 'floor', 0, 0, 2, Math.PI); bcmSpot(P, 'sun', 0, 6.6, -9); bcmSpot(P, 'gate', 0, 0, R0 + 1, Math.PI);
}
function bcmSilSolSystem(m, P) {
  const R0 = 12.5;
  for (let i = 0; i < 10; i++) { const a = (i + 0.5) / 10 * TAU; if (Math.abs(BurnsM.wrap(a)) < 0.2) continue; m.color('#a8a296'); m.push(); m.tf(Math.sin(a) * R0, 0, Math.cos(a) * R0, a); m.roundBox(0, 2.6, 0, 3.6, 5.2, 1.0, 0.3); m.pop(); }
  m.color('#ffb347', 1); m.push(); m.tf(0, 6.6, -9, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 2.5, 0.4, { seg: 16, tseg: 4 }); m.pop(); m.emissive(0);
  return { cols: [bcmC.cyl(0, -6, 3, 0, 2)], lights: [{ x: 0, y: 6.6, z: -9, s: 5, c: '#ffb347' }] };
}
BCM_KINDS.solSystem = {
  name: 'Sol System', short: 'Sol Henge', bpm: 126, mapCol: '#ffb347', og: true,
  desc: 'OG (2004 "Sol Henge"): a henge of glowing trilithons around the dance floor, an inner horseshoe around the DJ\'s altar stone, a golden sun disc, planets glowing on poles.',
  real: 'A San Francisco collective whose 2004 camp, fondly known as "Sol Henge", was one of that year\'s big sound productions.',
  foot: [-19, -19, 19, 19], radius: 22, height: 9, entrance: [0, 17, Math.PI],
  build: bcmBuildSolSystem, sil: bcmSilSolSystem
};

/* ======================= public API ======================= */
const BurnsCamps = {
  version: 1,
  kinds: BCM_KINDS,
  // place a camp while building a world. Returns the camp handle (see docs/BURNS_CAMPS.md)
  place(api, g, kind, x, z, o) {
    if (!api || !api.world) throw new Error('BurnsCamps.place(api, g, kind, x, z, opts): api required');
    g = g || api.game;
    const K = BCM_KINDS[kind]; if (!K) throw new Error('BurnsCamps: unknown kind ' + kind + ' (try ' + Object.keys(BCM_KINDS).join(', ') + ')');
    o = Object.assign({}, o || {});
    const W = api.world, R = bcmRT(W);
    if (!R.registered) { R.registered = true; api.update((gg, dt) => bcmUpdate(gg, dt, R)); }
    R.kinds[kind] = (R.kinds[kind] || 0) + 1;
    const s = clamp(o.scale === undefined ? 1 : +o.scale || 1, 0.75, 1.3), rot = o.rotY !== undefined ? o.rotY : (o.yaw || 0);
    const y0 = o.y !== undefined ? o.y : api.height(x, z);
    const id = o.id || (R.kinds[kind] > 1 ? kind + R.kinds[kind] : kind);
    const lod = o.lod === 'far' || o.lod === 'auto' ? o.lod : 'full';
    const crowdK = o.crowd === false ? 0 : (o.crowd === true || o.crowd === undefined) ? 1 : clamp(+o.crowd || 0, 0, 2);
    const P = {
      kind, id, K, o, name: o.name || K.name, x, z, rot, s, y0, F: bcmFrame(x, y0, z, rot, s), R, api, g, lod, crowdK,
      cols: [], actors: [], stages: [], areas: [], spots: {}, routes: {}, lasers: [], plights: [], flames: [], bursts: [], balls: [], vehicles: [], co2: [], co2T: 0, chunks: { full: [], far: [] },
      maxNight: o.lights === true ? 1 : g ? bcmMaxNight(g) : 1, bpm: K.bpm || 124, beatPh: (hashStr(id) % 1000) / 250, radius: K.radius * s, lodNear: o.lodNear || 150,
      area: null, inCamp: false, arrived: false, artCar: null,
      toWorld(lx, ly, lz) { return this.F.w(lx, ly || 0, lz); },
      toLocal(wx, wz) { return this.F.l(wx, wz); },
      night() { return bcmNight(this.g, this); },
      stage(sid) { return this.stages.find(st => st.id === sid) || null; }
    };
    const F = P.F, ft = K.foot;
    P.foot = { x0: ft[0], z0: ft[1], x1: ft[2], z1: ft[3], corners: [[ft[0], ft[1]], [ft[2], ft[1]], [ft[2], ft[3]], [ft[0], ft[3]]].map(q => [F.wx(q[0], q[1]), F.wz(q[0], q[1])]) };
    P.footA = { id: 'camp', x: F.wx((ft[0] + ft[2]) / 2, (ft[1] + ft[3]) / 2), z: F.wz((ft[0] + ft[2]) / 2, (ft[1] + ft[3]) / 2), hx: (ft[2] - ft[0]) / 2 * s, hz: (ft[3] - ft[1]) / 2 * s, yaw: rot, y0: y0 - 1, y1: y0 + 60 };
    const en = K.entrance; P.entrance = { x: F.wx(en[0], en[1]), z: F.wz(en[0], en[1]), yaw: rot + en[2], r: 5 * s };
    P.spots.entrance = { x: P.entrance.x, y: y0, z: P.entrance.z, yaw: P.entrance.yaw };
    if (lod !== 'far') { P.layer = 'full'; K.build(api, g, P); }
    if (lod !== 'full' && K.sil) {
      P.layer = 'far';
      bcmPart(P, 0, 0, m => { m.lo = true; const r = K.sil(m, P) || {}; m.lo = false; if (lod === 'auto') r.cols = []; return r; }, { noAO: true });
      P.layer = 'full';
    }
    // optional ACTION prompts at every fixed DJ booth: PLAY A SET (the shared BurnsDJ minigame)
    if (o.djPrompt && lod !== 'far') for (const st of P.stages) {
      if (st.vehicle || !st.booth) continue;
      bcmItem(P, { x: st.booth.x, z: st.booth.z, y: st.booth.y, r: 1.8, label: o.djLabel || 'PLAY A SET', when: gg => typeof BurnsDJ !== 'undefined' && !BurnsDJ.isOpen(gg) && Math.abs(gg.player.y - st.booth.y) < 1.2, fn: gg => BurnsCamps.djSet(gg, P, st.id, typeof o.djPrompt === 'object' ? o.djPrompt : {}) });
    }
    if (o.onEntrance) api.trigger({ x: P.entrance.x, z: P.entrance.z, r: o.entranceR || 5, once: !!o.entranceOnce, onEnter: gg => o.onEntrance(gg, P) });
    if (o.marker) api.marker('camp_' + id, x, z, P.name, { col: o.markerCol || K.mapCol || '#ffd84a' });
    R.camps.push(P);
    return P;
  },
  // a ready-made mission for arriving at a camp (custom, completed by place(..., { mission: id }) on the first visit)
  mission(kind, id, extra) {
    const K = BCM_KINDS[kind] || { name: kind };
    return Object.assign({ id, name: 'Find ' + K.name, short: 'Find ' + K.name, type: 'custom', start: 'manual', desc: K.desc || '', hint: 'Look for ' + K.name + ' on the city side' }, extra || {});
  },
  // the far-LOD silhouette only (open-world skylines): a few draw calls, glowing at night
  silhouette(api, g, kind, x, z, o) { return this.place(api, g, kind, x, z, Object.assign({}, o || {}, { lod: 'far' })); },
  info(kind) { const K = BCM_KINDS[kind]; return K ? { kind, name: K.name, desc: K.desc, real: K.real, foot: K.foot.slice(), radius: K.radius, height: K.height, entrance: K.entrance.slice(), bpm: K.bpm || 124, clear: (K.tourClear || K.foot).slice() } : null; },
  list() { return Object.keys(BCM_KINDS); },
  camps(g) { const R = g && g.world && g.world._bcm; return R ? R.camps.slice() : []; },
  camp(g, id) { return this.camps(g).find(P => P.id === id) || null; },
  nightK(g, camp) { return bcmNight(g, typeof camp === 'string' ? this.camp(g, camp) : camp); },
  // which named area of which camp Brady is in right now: { camp, area } | null
  where(g) { for (const P of this.camps(g)) if (P.inCamp || P.area) return { camp: P, area: P.area || P.footA }; return null; },
  // play a set at a camp's stage with the shared DJ minigame (BurnsDJ). The stage's own DJ steps aside meanwhile.
  djSet(g, camp, stageId, o) {
    const P = typeof camp === 'string' ? this.camp(g, camp) : camp; if (!P) return null;
    const st = (stageId && P.stage(stageId)) || P.stages[0]; if (!st || typeof BurnsDJ === 'undefined') return null;
    o = Object.assign({}, o || {});
    const b = st.booth, dj = bcmActorOf(g, st.dj);
    if (dj) dj.hidden = true;
    const done = o.onDone;
    const set = BurnsDJ.open(g, Object.assign({ title: (P.name + ' · ' + st.name).toUpperCase(), bpm: st.bpm || P.bpm, genre: st.genre || 'house', difficulty: 2, duration: 60, booth: { x: b.x, y: b.y, z: b.z, yaw: b.yaw }, crowd: st.floor ? { x: st.floor.x, z: st.floor.z, r: st.floor.r } : undefined, deck3d: false }, o, {
      onDone(r) { if (dj) dj.hidden = false; bcmEvent(g, 'bcmSetDone', { camp: P, stage: st, result: r }); if (done) done(r); }
    }));
    bcmEvent(g, 'bcmSet', { camp: P, stage: st });
    this.lastSet = set;
    return set;
  },
  // the camp's vehicle controller (Root Society's coliseum car, the Space Cowboys' sound truck)
  vehicle(g, camp) { const P = typeof camp === 'string' ? this.camp(g, camp) : camp; return P && P.vehicles[0] || null; },
  // send a docked vehicle off on its tour now / call it home
  undock(g, camp) { const V = this.vehicle(g, camp); if (V && V.state === 'docked' && !V.flipped) { V.wait = 0; V.drive = true; } return V; },
  recall(g, camp) { const V = this.vehicle(g, camp); if (V && V.state === 'touring') V.s = Math.max(V.s, V.tour.len - 60); return V; },
  // show the full camp (true) or its far silhouette (false) right now (lod: 'auto' camps switch by distance by themselves)
  showFull(g, camp, on) { const P = typeof camp === 'string' ? this.camp(g, camp) : camp; if (!P) return; bcmShowChunks(P.chunks.full, !!on); bcmShowChunks(P.chunks.far, !on); P.near = !!on; P.lodInit = true; }
};
// debug / test access (the bundle is one IIFE)
try { window.BRADY_BURNS_CAMPS = BurnsCamps; if (window.BRADY_BURNS) window.BRADY_BURNS.BurnsCamps = BurnsCamps; } catch (e) { /* no window */ }
