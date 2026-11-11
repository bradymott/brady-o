/* ============================================================
   ART CART — item effects: the gift-box items that need more than a
   line of code, and the twelve cars' signature specials.
     FOAM PARTY · DUST DEVIL (rebuilt: big, readable, they hunt)
     SKY MAIL (missiles from the sky) · BOMBS AWAY (a bombing run with
     burning craters) · DUCK DOWNPOUR (rubber ducks rain and litter the track)
     Car specials (CART_SPECIALS in 43_cart_a_data.js): HEART THROB, MIRROR
     SCHOOL, TENTACLE TOSS, DRAGON FLIGHT, BUBBLE BATH SURF, PRISM WARP,
     FROSTING FLOOD, ROGUE WAVE, SHELL BOUNCE, STORM HOVER, SAND DIVE, SKY BREACH
   How it plugs in: each item is a CART_ITEM_FX entry (use / aiWants / icon), its live effect a record in s.ix.list
   driven by CART_IX_KIND[type] (update · sprites · lights). The scene calls cartItemsLoad (course load),
   cartItemsUpdate (every sim step), cartItemsRender + cartItemsSprites + cartItemsLights (every frame) and
   cartItemsHud (the player's warnings and meters). Cars carried by an item use k.carry (cartCarryStep), flying
   cars k.fly (its .v() moves them vertically), a car under the sand k.sunk, a car with a guard k.guard.
   Cheap by design: sprites and particles, and one pooled mesh group (ducks, bombs, missiles: one draw call, drawn
   only while something in it is live). No allocations per frame: records are made when an item is used.
   ============================================================ */
const CART_IX_T = { a: [0, 0, 0], b: [0, 0, 0], at: {}, at2: {}, spot: { x: 0, z: 0, yaw: 0, hw: 8 }, spot2: { x: 0, z: 0, yaw: 0, hw: 8 }, wd: {}, list: [], loc: { i: 0, s: 0, d: 0 }, col: [1, 1, 1] };
// colours used every frame (shared, never mutated)
const CART_IXC = {
  white: [1, 1, 1], foam: [0.97, 0.98, 1], foamShade: [0.82, 0.88, 0.97], bubble: [0.8, 0.95, 1], sand: [0.86, 0.73, 0.54], sandDark: [0.58, 0.44, 0.3],
  sandNight: [0.62, 0.55, 0.5], red: [1, 0.18, 0.12], redHot: [1, 0.45, 0.3], fire: [1, 0.55, 0.15], flash: [1, 0.85, 0.55], smoke: [0.25, 0.23, 0.24],
  scorch: [0.06, 0.05, 0.04], pink: [1, 0.35, 0.65], pinkSoft: [1, 0.6, 0.8], frosting: [1, 0.62, 0.84], copper: [0.86, 0.48, 0.22], copperDark: [0.45, 0.2, 0.08], cup: [1, 0.85, 0.7],
  green: [0.25, 1, 0.5], cyan: [0.4, 0.95, 1], water: [0.55, 0.8, 1], waterDeep: [0.25, 0.55, 0.95], purple: [0.7, 0.45, 1], slime: [0.45, 1, 0.3],
  black: [0, 0, 0], gold: [1, 0.85, 0.3], silver: [0.86, 0.9, 1], silverDark: [0.45, 0.48, 0.58], dragonFire: [1, 0.5, 0.12]
};
const CART_IX_NEON = [[1, 0.3, 0.85], [0.3, 0.95, 1], [1, 0.9, 0.3], [0.5, 1, 0.4], [1, 0.5, 0.2], [0.7, 0.45, 1]];

/* ---------------- extra sprite cells, painted into free cells of the engine's sprite sheet ----------------
   reticle (target lock), scorch (crater), swirl (whirlwind / love spiral), foam (bubble cluster), splat (frosting) */
function cartIxPaint() {
  const SP = BURNS_SPRITES; if (!SP.canvas || SP.R.reticle) return;
  const N = SP.canvas.width, cell = 64, cols = N / cell, used = new Set();
  for (const k in SP.R) { const r = SP.R[k], c0 = Math.floor(r.u0 * N / cell), r0 = Math.floor(r.v0 * N / cell), c1 = Math.floor((r.u1 * N - 1) / cell), r1 = Math.floor((r.v1 * N - 1) / cell); for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) used.add(y * cols + x); }
  const x = SP.canvas.getContext('2d'); let slot = cols * cols - 1;
  const add = (name, fn) => {
    while (slot >= 0 && used.has(slot)) slot--; if (slot < 0) { SP.R[name] = SP.R.glow; return; }
    const px = (slot % cols) * cell, py = Math.floor(slot / cols) * cell; used.add(slot);
    x.save(); x.clearRect(px, py, cell, cell); x.beginPath(); x.rect(px, py, cell, cell); x.clip(); x.translate(px, py); fn(x, cell, cell); x.restore();
    SP.R[name] = { u0: (px + 1) / N, v0: (py + 1) / N, u1: (px + cell - 1) / N, v1: (py + cell - 1) / N };
  };
  add('reticle', (c, w, h) => {
    c.strokeStyle = '#ffffff'; c.lineWidth = 4.5; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 6, 0, TAU); c.stroke();
    c.lineWidth = 2.5; c.beginPath(); c.arc(w / 2, h / 2, w * 0.22, 0, TAU); c.stroke();
    c.lineWidth = 5; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * w * 0.3, h / 2 + Math.sin(a) * h * 0.3); c.lineTo(w / 2 + Math.cos(a) * w * 0.47, h / 2 + Math.sin(a) * h * 0.47); c.stroke(); }
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(w / 2, h / 2, 4, 0, TAU); c.fill();
  });
  add('scorch', (c, w, h) => {
    const rng = mulberry32(11);
    for (let i = 0; i < 14; i++) { const a = rng() * TAU, d = rng() * w * 0.2, px = w / 2 + Math.cos(a) * d, py = h / 2 + Math.sin(a) * d, r = w * (0.16 + rng() * 0.2); const g = c.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(255,255,255,0.75)'); g.addColorStop(0.7, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + rng() * 0.4; c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * w * 0.18, h / 2 + Math.sin(a) * h * 0.18); c.lineTo(w / 2 + Math.cos(a) * w * (0.38 + rng() * 0.1), h / 2 + Math.sin(a) * h * (0.38 + rng() * 0.1)); c.stroke(); }
  });
  add('swirl', (c, w, h) => {
    c.lineCap = 'round';
    for (let arm = 0; arm < 3; arm++) for (let i = 0; i < 26; i++) { const u = i / 26, a = arm * TAU / 3 + u * 4.2, r = w * (0.08 + u * 0.38); c.strokeStyle = `rgba(255,255,255,${(0.95 * (1 - u * 0.7)).toFixed(3)})`; c.lineWidth = 7 * (1 - u * 0.6); c.beginPath(); c.arc(w / 2, h / 2, r, a, a + 0.22); c.stroke(); }
  });
  add('foam', (c, w, h) => {
    const rng = mulberry32(23);
    for (let i = 0; i < 16; i++) {
      const a = rng() * TAU, d = rng() * w * 0.26, px = w / 2 + Math.cos(a) * d, py = h / 2 + Math.sin(a) * d * 0.9, r = w * (0.09 + rng() * 0.11);
      const g = c.createRadialGradient(px - r * 0.3, py - r * 0.35, r * 0.1, px, py, r); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.75, 'rgba(232,238,248,1)'); g.addColorStop(1, 'rgba(190,200,222,1)');
      c.fillStyle = g; c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,1)'; c.beginPath(); c.arc(px - r * 0.35, py - r * 0.4, r * 0.22, 0, TAU); c.fill();
    }
  });
  add('splat', (c, w, h) => {
    const rng = mulberry32(37); c.fillStyle = '#ffffff'; c.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, r = w * (0.3 + (i % 3 === 0 ? 0.13 : 0.02) * rng() + 0.05 * Math.sin(a * 5)); if (i) c.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); else c.moveTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); }
    c.closePath(); c.fill();
    for (let i = 0; i < 6; i++) { const a = rng() * TAU, d = w * (0.38 + rng() * 0.07); c.beginPath(); c.arc(w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, w * (0.03 + rng() * 0.03), 0, TAU); c.fill(); }
  });
  SP.T.dirty = true;   // re-upload the sheet with the new cells
}

/* ---------------- pooled meshes: rubber ducks, cartoon bombs, sky missiles (one group, one draw call) ---------------- */
const CartIxMesh = {
  // a classic bath duck, ~170 triangles (forward = +Z); a touch of glow so it reads at night
  duck(m) {
    m.color('#ffd21a', 0.22).shine(2);
    m.ellipsoid(0, 0.32, -0.02, 0.36, 0.27, 0.46, { seg: 7, rings: 4 });
    m.ellipsoid(0, 0.47, -0.38, 0.14, 0.15, 0.12, { seg: 5, rings: 2 });
    m.ball(0, 0.76, 0.22, 0.22, { seg: 7, rings: 4 });
    m.color('#ff7a1a', 0.22); m.ellipsoid(0, 0.72, 0.45, 0.12, 0.05, 0.13, { seg: 5, rings: 2 });
    m.shine(0); m.color('#1a1020', 0); m.box(0.12, 0.83, 0.36, 0.06, 0.08, 0.05); m.box(-0.12, 0.83, 0.36, 0.06, 0.08, 0.05);
    m.emissive(0);
  },
  // a round cartoon bomb with tail fins and a fuse (falls nose down: local -Y)
  bomb(m) {
    m.color('#24222a').shine(3); m.ball(0, 0, 0, 0.55, { seg: 9, rings: 5 }); m.shine(0);
    m.color('#5a5a66'); m.cyl(0, 0.48, 0, 0.17, 0.17, 0.16, 6);
    m.color('#ff3a2a', 0.3); for (let i = 0; i < 4; i++) { m.push(); m.tf(0, 0.62, 0, i * Math.PI / 2); m.box(0, 0.12, 0.22, 0.04, 0.32, 0.3); m.pop(); }
    m.color('#ffe24a', 0.8); m.ball(0, 0.92, 0, 0.07, { seg: 4, rings: 2 }); m.emissive(0);
  },
  // a red-and-white sky missile pointing along +Z
  missile(m) {
    m.color('#f0f0f4').shine(2); m.limb(0, 0, -1.0, 0, 0, 1.0, 0.26, 0.26, { seg: 8, ends: false });
    m.color('#ff2a2a', 0.15); m.limb(0, 0, 1.0, 0, 0, 1.6, 0.26, 0.03, { seg: 8, ends: false }); m.shine(0);
    for (let i = 0; i < 4; i++) { m.push(); m.tf(0, 0, -0.75, 0, 0, i * Math.PI / 2 + Math.PI / 4); m.box(0, 0.4, 0, 0.04, 0.5, 0.55); m.pop(); }
    m.color('#ffb040', 1); m.limb(0, 0, -1.12, 0, 0, -0.98, 0.15, 0.2, { seg: 6, ends: false }); m.emissive(0);
  }
};
const CART_IX_POOL = { duck: 32, bomb: 10, missile: 6 };

/* ---------------- per-race state ---------------- */
function cartItemsLoad(s) {
  cartIxPaint();
  const ix = s.ix = { list: [], groups: [], ducks: [], bombs: [], missiles: [], bolts: [], flashes: [], snd: {}, live: 0,
    obs: { n: 0, x: new Float32Array(128), z: new Float32Array(128), r: new Float32Array(128) } };
  for (let i = 0; i < 8; i++) ix.bolts.push({ t: 0, a: null, b: null });
  for (let i = 0; i < 10; i++) ix.flashes.push({ t: 0, x: 0, y: 0, z: 0, r: 0, c: CART_IXC.flash, i: 0 });
  if (!s.fx || !BurnsGL.gl) return;
  // our sprite cells as particle kinds too (this race's particle system only)
  for (const k of ['foam', 'bubble', 'swirl', 'scorch', 'splat']) if (s.fx.kIdx[k] === undefined) { s.fx.kIdx[k] = s.fx.kinds.length; s.fx.kinds.push(k); }
  const max = Math.min(64, BurnsGL.maxBones || 32);
  let G = null;
  const add = (build, pool) => { if (!G || G.full) { if (G) G.finish(); G = new BurnsGroup(max); ix.groups.push(G); } const o = G.add(build, { visible: false }); o.live = false; pool.push(o); return o; };
  for (let i = 0; i < CART_IX_POOL.duck; i++) add(m => CartIxMesh.duck(m), ix.ducks);
  if (G) { G.finish(); G = null; }   // ducks in their own group: a duck downpour doesn't draw the bombs' triangles and vice versa
  for (let i = 0; i < CART_IX_POOL.bomb; i++) add(m => CartIxMesh.bomb(m), ix.bombs);
  for (let i = 0; i < CART_IX_POOL.missile; i++) add(m => CartIxMesh.missile(m), ix.missiles);
  if (G) G.finish();
  for (const o of ix.ducks) { o.vx = o.vy = o.vz = 0; o.t = 0; o.life = 0; o.delay = 0; o.spin = 0; o.kick = 0; o.owner = null; o.rest = false; o.ph = 0; }
  if (typeof cartDrvLoad === 'function') cartDrvLoad(s);   // the drivers' specials: their pooled meshes (43_cart_j_drivers.js)
}
// a pooled mesh object (oldest recycled when all are in use)
function cartIxTake(pool) { let best = null; for (const o of pool) { if (!o.live) return o; if (!best || o.t > best.t) best = o; } return best; }
function cartIxRec(s, type, o) { o.type = type; if (o.t === undefined) o.t = 0; s.ix.list.push(o); return o; }

/* ---------------- helpers ---------------- */
// how loud a sound is for the player (far-off booms are quieter); rate-limited per name
function cartIxSound(s, name, x, z, vol, pitch, gap) {
  const ix = s.ix, p = s.player, now = s.t; if (gap && ix.snd[name] > now) return; if (gap) ix.snd[name] = now + gap;
  const d = p ? Math.hypot(p.x - x, p.z - z) : 0, v = vol * clamp(1.25 - d / 80, 0.1, 1);
  Sound.play(name, pitch ? { vol: v, pitch } : { vol: v });
}
// a point `ds` metres up the course from car k. Races: on the track, lat = fraction of the half-width (−1 left … +1 right).
// Arenas: straight ahead (lat × 8 m to the side), kept inside the walls and out of the art.
function cartIxAhead(s, k, ds, lat, out) {
  if (s.T && s.isRace) { const g = s.T.at((k.loc.s || 0) + ds, CART_IX_T.at); out.x = g.x + g.nx * g.hw * lat; out.z = g.z + g.nz * g.hw * lat; out.yaw = g.yaw; out.hw = g.hw; return out; }
  const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
  out.x = k.x + fx * ds - fz * lat * 8; out.z = k.z + fz * ds + fx * lat * 8; out.yaw = k.yaw; out.hw = 8;
  return cartIxInside(s, out, 5);
}
// keep a point inside the arena walls (margin m) and outside the art pieces
function cartIxInside(s, p, margin) {
  const E = s.E;
  if (E.walls) { for (let it = 0; it < 3; it++) { const w = s.wallDist(p.x, p.z, CART_IX_T.wd); if (w.d >= margin) break; p.x += w.nx * (margin - w.d); p.z += w.nz * (margin - w.d); } }
  if (E.art) for (const a of E.art) { const dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz), r = (a.r || 3) + 1.5; if (d < r) { const f = (r - d) / (d || 1); p.x += dx * f; p.z += dz * f; } }
  return p;
}
// rivals ahead of k, nearest first (races: by course progress within `range` m; arenas: by distance, front cone first)
function cartIxTargets(s, k, range) {
  const L = CART_IX_T.list; L.length = 0;
  for (const o of s.karts) {
    if (o === k || o.out || (s.isRace && o.finished)) continue;
    let d;
    if (s.isRace && s.T) { d = o.prog - k.prog; if (d < 2 || d > range) continue; }
    else { const dx = o.x - k.x, dz = o.z - k.z; d = Math.hypot(dx, dz); if (d > range) continue; if (Math.abs(cartWrap(Math.atan2(dx, dz) - k.yaw)) > 1.2) d *= 1.8; }
    o._ixD = d; L.push(o);
  }
  L.sort(cartIxByD);
  return L;
}
function cartIxByD(a, b) { return a._ixD - b._ixD; }
// every car (but `skip`) within r of (x, z) and near height y: hit it
function cartIxBlast(s, x, y, z, r, kind, src, item, power, vy, skip) {
  let n = 0;
  for (const o of s.karts) {
    if (o === skip || o.out) continue;
    const dx = o.x - x, dz = o.z - z, d = Math.hypot(dx, dz);
    if (d < r && Math.abs(o.y - y) < 4) { if (s.hit(o, kind, src, { item, dx: dx / (d || 1), dz: dz / (d || 1), power: power || 8, vy })) n++; }
  }
  return n;
}
// the big cartoon explosion: flash, fireball, sparks, smoke, a point light, the boom, a shake when close
function cartIxBoom(s, x, y, z, size) {
  const F = s.fx, C = CART_IXC;
  if (F) {
    F.add(x, y + 1.2 * size, z, 0, 0, 0, 0.32, 5 * size, 11 * size, C.flash, 1, 'glow', 1);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + Math.random() * 0.3, sp = (5 + Math.random() * 6) * size; F.add(x, y + 0.6, z, Math.cos(a) * sp, 2 + Math.random() * 6, Math.sin(a) * sp, 0.45 + Math.random() * 0.3, 1.6 * size, 0.4, C.fire, 1, 'flame', 1 | 4, Math.random() * 6, 2); }
    F.spark(x, y + 0.8, z, 22, '#ffd08a', 13 * size);
    for (let i = 0; i < 7; i++) F.add(x + (Math.random() - 0.5) * 2 * size, y + 1 + Math.random() * 2, z + (Math.random() - 0.5) * 2 * size, (Math.random() - 0.5) * 3, 2.5 + Math.random() * 2.5, (Math.random() - 0.5) * 3, 1.6 + Math.random() * 1.2, 2.2 * size, 5 * size, C.smoke, 0.55, 'smoke', 4, Math.random() * 6, 0.4);
    F.dust(x, y + 0.2, z, 8, s.night ? '#8a7a7a' : '#d8b896');
  }
  const fl = s.ix.flashes.find(f => f.t <= 0) || s.ix.flashes[0]; fl.t = 0.45; fl.x = x; fl.y = y + 2; fl.z = z; fl.r = 18 * size; fl.c = C.flash; fl.i = 2.2;
  cartIxSound(s, 'cartBoom', x, z, 0.95, 0.85 + Math.random() * 0.3);
  const p = s.player; if (p) { const d = Math.hypot(p.x - x, p.z - z); if (d < 32) s.shakeIt(clamp(1 - d / 32, 0.15, 0.8) * size); }
}
// a short-lived point light (explosions, beams)
function cartIxFlash(s, x, y, z, r, c, i, t) { const fl = s.ix.flashes.find(f => f.t <= 0) || s.ix.flashes[0]; fl.t = t || 0.4; fl.x = x; fl.y = y; fl.z = z; fl.r = r; fl.c = c; fl.i = i; }
// a lightning bolt drawn for a moment (STORM HOVER)
function cartIxBolt(s, a, b) { const B = s.ix.bolts.find(q => q.t <= 0) || s.ix.bolts[0]; B.t = b ? 0.3 : 0.12; B.a = a; B.b = b; B.bx = a.x + (Math.random() - 0.5) * 6; B.bz = a.z + (Math.random() - 0.5) * 6; }
// an obstacle the AI steers around this step (ducks, fires, pools, traps)
function cartIxObs(s, x, z, r) { const O = s.ix.obs; if (O.n >= O.x.length) return; O.x[O.n] = x; O.z[O.n] = z; O.r[O.n] = r; O.n++; }

/* ---------------- carried cars: thrown, swept, hurled (k.carry) ---------------- */
// k.carry = { t, dur, x0, z0, y0, x1, z1, h, spin, vx, vz }: an arc from (x0, z0) to (x1, z1), peak h metres above the line
function cartCarryStep(s, k, dt) {
  const c = k.carry; c.t += dt;
  const u = clamp(c.t / c.dur, 0, 1), e = u * u * (3 - 2 * u);
  const x = lerp(c.x0, c.x1, e), z = lerp(c.z0, c.z1, e), g0 = c.y0, g1 = s.terrain.height(c.x1, c.z1);
  k.vx = (x - k.x) / Math.max(dt, 1e-4); k.vz = (z - k.z) / Math.max(dt, 1e-4); k.x = x; k.z = z;
  k.y = lerp(g0, g1, u) + c.h * 4 * u * (1 - u); k.air = true; k.vy = 0; k.airT = 0;
  k.yaw = cartWrap(k.yaw + (c.spin || 0) * dt * (1 - u * 0.5));
  if (c.t >= c.dur) { k.carry = null; k.vx = c.vx || 0; k.vz = c.vz || 0; k.vy = -3; k.hop = true; }
}

/* ---------------- flying cars (k.fly): the vertical half; the item records drive the rest ---------------- */
// fly = { kind, t, dur, h, up (s to climb), down (s to land) }: rises to h metres over the ground, holds, lands
function cartFlyV(s, k, dt) {
  const f = k.fly, gh = s.terrain.height(k.x, k.z), t = f.t;
  let h;
  if (f.kind === 'shell') { const p = (t % f.hop) / f.hop; h = f.h * 4 * p * (1 - p); k.y = gh + h; k.vy = f.h * 4 * (1 - 2 * p) / f.hop; k.air = true; k.airT = 0; return true; }
  const up = clamp(t / f.up, 0, 1), down = clamp((f.dur - t) / f.down, 0, 1);
  h = f.h * Math.min(up * up * (3 - 2 * up), Math.sqrt(down)) + Math.sin(t * 2.4 + k.slot) * 0.25 * Math.min(up, down);
  const target = gh + Math.max(0.05, h), vy = clamp((target - k.y) * 7, -22, 26);
  k.vy = vy; k.y = Math.max(gh, k.y + vy * dt); k.air = true; k.airT = 0;
  return true;
}
// start a flight; the kind's record ends it (cartFlyEnd)
function cartFlyStart(s, k, kind, dur, h, o) {
  const f = Object.assign({ kind, t: 0, dur, h, up: 0.6, down: 0.9, hop: 0.85, v: cartFlyV, hits: 0 }, o || {});
  k.fly = f; k.air = true; k.hop = true; k.drift = 0; k.charge = 0; k.pendingDrift = false;
  return f;
}
function cartFlyEnd(s, k) {
  if (!k.fly) return; k.fly = null; k.vmaxMin = 0; k.air = true; k.hop = true; k.airT = 0;
  if (k.vy > -1) k.vy = -1;
  // races: a flight that ends over the shoulder steers back over the road before touching down
  if (s.T && s.isRace) { const L = s.T.locate(k.x, k.z, k.loc.i, CART_IX_T.loc), hw = s.T.HW[L.i] - 1.2; if (Math.abs(L.d) > hw) { const side = L.d > 0 ? 1 : -1, pen = Math.abs(L.d) - hw; k.x -= s.T.NX[L.i] * side * pen; k.z -= s.T.NZ[L.i] * side * pen; } }
  else cartIxInside(s, k, 3);
}

/* ============ the live effects: CART_IX_KIND[type] = { update(s, r, dt) -> false when done, sprites(s, R, r, S, t), lights(s, r, add) } ============ */
const CART_IX_KIND = {};

/* ---------------- FOAM PARTY: a foam cannon erupts around the car, then a foam pool stays behind ----------------
   Burst (0.5 s): a dome of foam grows to 13 m; every rival it reaches is FOAMED (a hit: 3 s slow, slippery, slithering,
   buried in foam). The pool (9 m, 7 s) slows and slicks anyone who drives in, without costing a vibe. */
CART_ITEM_FX.foam = {
  use(s, k) {
    cartIxRec(s, 'foam', { owner: k, x: k.x, z: k.z, y: k.y, r: 0, R: 13, pool: 9, burst: 0.5, life: 7.5, hitMask: 0, poolMask: 0 });
    const v = k.player ? 0.9 : 0.35;
    Sound.play('splash', { vol: v, pitch: 0.75 }); Sound.play('cartBubble', { vol: v }); Sound.play('cartBubble', { vol: v * 0.7, pitch: 0.7 }); Sound.play('disco', { vol: v * 0.4 });
    if (s.fx) s.fx.confetti(k.x, k.y + 2.5, k.z, 24);
    if (k.player) s.shakeIt(0.35);
  },
  aiWants(s, k) {
    for (const o of s.karts) { if (o === k || o.out || o.invT > 0.3) continue; const d = Math.hypot(o.x - k.x, o.z - k.z); if (d < 11) return true; if (s.isRace && d < 22 && o.prog < k.prog) return true; }
    return k.ai.itemT < -6;
  },
  icon(ctx, s, col) { for (const [dx, dy, r] of [[-0.25, 0.12, 0.25], [0.15, -0.1, 0.3], [0.3, 0.2, 0.2], [-0.05, 0.27, 0.22], [-0.3, -0.2, 0.16]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, r * s, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.fillStyle = '#ff4fd8'; ctx.fillRect(-s * 0.42, -s * 0.48, s * 0.1, s * 0.1); ctx.fillStyle = '#38f2ff'; ctx.fillRect(s * 0.32, -s * 0.42, s * 0.1, s * 0.1); }
};
CART_IX_KIND.foam = {
  update(s, r, dt) {
    const k = r.owner;
    if (r.t < r.burst) {
      r.x = k.x; r.z = k.z; r.y = k.y; const u = r.t / r.burst; r.r = r.R * (1 - (1 - u) * (1 - u));
      for (const o of s.karts) { if (o === k || o.out || (r.hitMask & (1 << o.slot))) continue; if (Math.hypot(o.x - r.x, o.z - r.z) < r.r + 1 && Math.abs(o.y - r.y) < 4) { r.hitMask |= 1 << o.slot; if (s.hit(o, 'foam', k, { item: 'foam', dur: 3.0 })) { cartIxSound(s, 'cartBubble', o.x, o.z, 0.8, 0.8); if (s.fx) s.fx.burst(o.x, o.y + 1.5, o.z, 'bubble', 10, '#ffffff'); } } }
      if (s.fx) for (let i = 0; i < 6; i++) { const a = Math.random() * TAU; s.fx.add(r.x + Math.sin(a) * r.r, r.y + 0.4 + Math.random() * 1.5, r.z + Math.cos(a) * r.r, Math.sin(a) * 3, 1 + Math.random() * 2, Math.cos(a) * 3, 1.0 + Math.random() * 0.6, 1.6, 2.8, CART_IXC.foam, 0.95, 'foam', 4, Math.random() * 6, 0.5); }
    } else {
      // the pool: shrinks as it pops
      const u = (r.t - r.burst) / (r.life - r.burst); r.r = r.pool * (1 - 0.45 * u);
      for (const o of s.karts) { if (o === k || o.out || o.air) continue; if (Math.hypot(o.x - r.x, o.z - r.z) < r.r) { o.foamT = Math.max(o.foamT, 1.3); if (!(r.poolMask & (1 << o.slot))) { r.poolMask |= 1 << o.slot; s.log('hit', { k: o.id, by: k.id, kind: 'foam', item: 'foam', pool: true }); if (o.player) s.banner('FOAM!', '#f4f8ff', 0.8, null, true); cartIxSound(s, 'cartBubble', o.x, o.z, 0.7, 1.1, 0.2); } } }
      cartIxObs(s, r.x, r.z, r.r * 0.8);
      if (s.fx && Math.random() < dt * 14) s.fx.add(r.x + (Math.random() - 0.5) * r.r * 1.6, r.y + 0.3, r.z + (Math.random() - 0.5) * r.r * 1.6, 0, 0.8, 0, 1.2, 0.5, 0.9, CART_IXC.bubble, 0.8, 'bubble', 4 | 32);
    }
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const gy = s.terrain.height(r.x, r.z) + 0.08, a = clamp((r.life - r.t) / 1.2, 0, 1), C = CART_IXC;
    // the foam carpet: overlapping bubble clusters laid flat
    const n = 9, rr = r.r;
    R.flat.flat(r.x, gy, r.z, rr * 1.5, rr * 1.5, r.t * 0.3, S.foam, C.foam, 0.85 * a, false);
    for (let i = 0; i < n; i++) { const ang = i / n * TAU + 0.3, d = rr * 0.62; R.flat.flat(r.x + Math.sin(ang) * d, gy + 0.02, r.z + Math.cos(ang) * d, rr * 0.9, rr * 0.9, ang * 2, S.foam, C.foam, 0.9 * a, false); }
    // the eruption: a wall of foam at the rim, piled high, and a party glow
    if (r.t < r.burst + 0.6) {
      const u = clamp(1 - (r.t - r.burst) / 0.6, 0, 1), m = 14;
      for (let i = 0; i < m; i++) { const ang = i / m * TAU + r.t, d = rr * 0.92, h = 1.2 + Math.sin(i * 1.7) * 0.5; R.bbs.bb(r.x + Math.sin(ang) * d, gy + h, r.z + Math.cos(ang) * d, 4.2, 3.6, S.foam, C.foam, 0.95 * u, false, i); }
      R.bbs.bb(r.x, gy + 3, r.z, rr * 2.2, rr * 1.4, S.glow, C.pinkSoft, 0.35 * u, true);
    }
    // bubbles bobbing on the pool
    for (let i = 0; i < 6; i++) { const ang = i * 2.4 + r.t * 0.6, d = rr * (0.25 + (i % 3) * 0.2); R.bbs.bb(r.x + Math.sin(ang) * d, gy + 0.6 + Math.sin(t * 3 + i) * 0.2, r.z + Math.cos(ang) * d, 1.2, 1.2, S.bubble, C.bubble, 0.7 * a, false); }
  },
  lights(s, r, add) { if (r.t < r.burst + 0.4) add(r.x, r.y + 2, r.z, 14, CART_IXC.pinkSoft, 1.0, 1.5); }
};

/* ---------------- DUST DEVIL: a tall sand whirlwind that races up the course and hunts the cars ahead ----------------
   42 m/s (faster than any car), steers onto its next victim, whirls up to three cars into the air (a hit), 7.5 s. */
CART_ITEM_FX.devil = {
  use(s, k) {
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    const r = cartIxRec(s, 'devil', { owner: k, x: k.x + fx * 6, z: k.z + fz * 6, s: (k.loc.s || 0) + 6, d: (k.loc && k.loc.d) || 0, yaw: k.yaw, life: 7.5, hits: 0, mask: 0, tgt: null, sndT: 0 });
    if (s.E.walls) cartIxInside(s, r, 4);
    cartIxSound(s, 'wind', k.x, k.z, k.player ? 1 : 0.5, 0.8); Sound.play('dust', { vol: k.player ? 0.8 : 0.3 });
  },
  aiWants(s, k) { const L = cartIxTargets(s, k, s.isRace ? 130 : 60); return L.length > 0 || k.ai.itemT < -3; },
  icon(ctx, s, col) { ctx.strokeStyle = col; ctx.lineCap = 'round'; for (let i = 0; i < 5; i++) { ctx.lineWidth = s * (0.13 - i * 0.015); ctx.beginPath(); ctx.ellipse(Math.sin(i * 1.3) * s * 0.06, -s * 0.42 + i * s * 0.2, s * (0.48 - i * 0.085), s * 0.075, 0, 0, TAU); ctx.stroke(); } ctx.fillStyle = '#8a6a3a'; ctx.fillRect(s * 0.25, -s * 0.2, s * 0.09, s * 0.09); ctx.fillRect(-s * 0.36, s * 0.05, s * 0.07, s * 0.07); }
};
CART_IX_KIND.devil = {
  update(s, r, dt) {
    const k = r.owner, T = s.T;
    // pick the next victim: the nearest car ahead of the whirlwind that it hasn't whirled yet
    let tgt = null, best = 1e9;
    for (const o of s.karts) {
      if (o === k || o.out || (r.mask & (1 << o.slot)) || (s.isRace && o.finished)) continue;
      let ds;
      if (T && s.isRace) { ds = o.loc.s - r.s; if (ds < -T.L / 2) ds += T.L; if (ds > T.L / 2) ds -= T.L; if (ds < -4 || ds > 150) continue; }
      else { const dx = o.x - r.x, dz = o.z - r.z; ds = Math.hypot(dx, dz); if (ds > 70 || Math.abs(cartWrap(Math.atan2(dx, dz) - r.yaw)) > 1.6) continue; }
      if (ds < best) { best = ds; tgt = o; }
    }
    r.tgt = tgt;
    if (T && s.isRace) {
      r.s += 42 * dt;
      const g = T.at(r.s, CART_IX_T.at2), want = tgt ? clamp(tgt.loc.d, -g.hw, g.hw) : Math.sin(r.t * 1.4) * g.hw * 0.6;
      r.d = approach(r.d, want + Math.sin(r.t * 5) * 0.8, 11 * dt); r.x = g.x + g.nx * r.d; r.z = g.z + g.nz * r.d; r.yaw = g.yaw;
    } else {
      if (tgt) { const want = Math.atan2(tgt.x - r.x, tgt.z - r.z), d = cartWrap(want - r.yaw); r.yaw = cartWrap(r.yaw + clamp(d, -2.4 * dt, 2.4 * dt)); }
      else r.yaw += Math.sin(r.t * 2) * dt * 1.2;
      r.x += Math.sin(r.yaw) * 32 * dt; r.z += Math.cos(r.yaw) * 32 * dt;
      if (s.E.walls) { const w = s.wallDist(r.x, r.z, CART_IX_T.wd); if (w.d < 5) { r.yaw = Math.atan2(w.nx, w.nz) + Math.sin(r.t) * 0.6; r.x += w.nx * (5 - w.d); r.z += w.nz * (5 - w.d); } }
    }
    r.y = s.terrain.height(r.x, r.z);
    // whirl up whoever it touches
    if (r.t < r.life - 0.6) for (const o of s.karts) {
      if (o === k || o.out || (r.mask & (1 << o.slot))) continue;
      if (Math.hypot(o.x - r.x, o.z - r.z) < 3.9 && o.y < r.y + 5) {
        r.mask |= 1 << o.slot;
        if (s.hit(o, 'whirl', k, { item: 'devil', vy: 11, dur: 1.7 })) { r.hits++; cartIxSound(s, 'wind', o.x, o.z, 0.9, 1.3); if (s.fx) s.fx.dust(o.x, o.y + 0.5, o.z, 14, '#d8b896'); if (r.hits >= 3) r.life = Math.min(r.life, r.t + 1.0); }
      }
    }
    cartIxObs(s, r.x, r.z, 3.5);
    // debris spun around the funnel
    if (s.fx && Math.random() < 0.9) { const h = Math.random() * 12, w = 1.4 + h * 0.45, a = Math.random() * TAU; s.fx.add(r.x + Math.sin(a) * w, r.y + h, r.z + Math.cos(a) * w, Math.cos(a) * 9, 1.5 + Math.random() * 2, -Math.sin(a) * 9, 0.6, 0.3 + Math.random() * 0.3, 0.2, Math.random() < 0.5 ? CART_IXC.sandDark : CART_IXC.sand, 1, Math.random() < 0.6 ? 'square' : 'puff', 4, Math.random() * 6, 8); }
    r.sndT -= dt; if (r.sndT <= 0) { r.sndT = 1.1; cartIxSound(s, 'dust', r.x, r.z, 0.55, 0.8 + Math.random() * 0.3); }
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const a = Math.min(1, r.t * 3, (r.life - r.t) * 1.4), C = CART_IXC, night = s.night;
    const col = night ? C.sandNight : C.sand, dark = night ? C.sand : C.sandDark;
    R.flat.flat(r.x, r.y + 0.06, r.z, 9, 9, -t * 4, S.swirl, dark, 0.55 * a, false);
    R.flat.flat(r.x, r.y + 0.08, r.z, 6, 6, 0, S.shadow, C.black, 0.5 * a, false);
    // the funnel: stacked spinning layers, narrow at the ground, leaning and swaying
    for (let i = 0; i < 11; i++) {
      const h = 0.6 + i * 1.35, w = 2.2 + i * 0.75, sway = Math.sin(t * 2.2 + i * 0.45) * 0.18 * i;
      const x = r.x + Math.cos(r.yaw) * sway, z = r.z - Math.sin(r.yaw) * sway;
      R.bbs.bb(x, r.y + h, z, w * 2, w * 1.1, S.swirl, col, 0.9 * a, false, -t * 7 - i * 0.7);
      R.bbs.bb(x, r.y + h, z, w * 1.3, w * 0.9, S.puff, dark, 0.8 * a, false, t * 3 + i);
      if (i % 3 === 1) R.bbs.bb(x, r.y + h, z, w * 1.6, w * 0.8, S.swirl, dark, 0.7 * a, false, -t * 9 + i);
    }
    R.bbs.bb(r.x, r.y + 1.2, r.z, 5, 3, S.puff, col, 0.85 * a, false, t * 5);
    if (night) R.bbs.bb(r.x, r.y + 6, r.z, 12, 16, S.glow, C.sand, 0.18 * a, true);
  }
};

/* ---------------- RANGER WHISTLE (rebuilt from the sim's one-liner so you can see it work) ----------------
   "SLOW DOWN!": every car ahead brakes to 60 % for 2 s. Now with yellow sound rings rolling up the course, a
   flashing ranger stop-sign over every car it caught, and a count for the player. */
CART_ITEM_FX.whistle = {
  use(s, k) {
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw); let n = 0;
    for (const o of s.karts) {
      if (o === k || o.out) continue;
      const ahead = s.isRace ? o.prog > k.prog : ((o.x - k.x) * fx + (o.z - k.z) * fz > 0 && Math.hypot(o.x - k.x, o.z - k.z) < 45);
      if (!ahead || o.shieldT > 0 || o.immuneT > 0) continue;
      o.slowT = 2.0; o.whistleT = 2.0; n++;
      s.log('hit', { k: o.id, by: k.id, kind: 'slow', item: 'whistle' });
      if (o.player) s.banner('SLOW DOWN!', '#ffd84a', 1.2, 'a Ranger whistle');
    }
    cartIxRec(s, 'whistle', { owner: k, life: 1.2 });
    const v = k.player ? 0.8 : 0.3; Sound.play('whistle', { vol: v }); Sound.play('bike_bell', { vol: v * 0.6 }); Sound.play('select', { vol: v * 0.5, pitch: 2 });
    if (k.player) s.banner(n ? n + (n === 1 ? ' CAR SLOWED' : ' CARS SLOWED') : 'NOBODY AHEAD', '#ffd84a', 1.0, null, true);
  },
  aiWants(s, k) { return !s.isRace || k.rank > 1; }
};
CART_IX_KIND.whistle = {
  update(s, r, dt) { r.x = r.owner.x; r.y = r.owner.y; r.z = r.owner.z; r.yaw = r.owner.yaw; return r.t < r.life; },
  sprites(s, R, r, S, t) { const fx = Math.sin(r.yaw), fz = Math.cos(r.yaw); for (let i = 0; i < 4; i++) { const u = ((r.t * 1.6 + i * 0.25) % 1), d = 4 + u * 40, a = (1 - u) * clamp((r.life - r.t) * 3, 0, 1); R.flat.flat(r.x + fx * d, s.terrain.height(r.x + fx * d, r.z + fz * d) + 0.15, r.z + fz * d, 6 + u * 18, 3 + u * 6, r.yaw, S.ring, CART_IXC.gold, 0.8 * a, false); } }
};
/* ---------------- SKY MAIL: three missiles from the sky onto the cars ahead ----------------
   A red target locks onto each victim (it tracks them for 1.25 s, then holds still: swerve to dodge), the missile
   streaks down from high behind and explodes (4.6 m): BLASTED (launched and flipped). */
CART_ITEM_FX.skymail = {
  use(s, k) {
    const L = cartIxTargets(s, k, s.isRace ? 170 : 75), fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    for (let i = 0; i < 3; i++) {
      const tgt = L[i] || (L.length && i === 2 ? L[0] : null), p = cartIxAhead(s, k, 45 + i * 22, (i - 1) * 0.5, CART_IX_T.spot);
      const m = cartIxTake(s.ix.missiles);
      const r = cartIxRec(s, 'missile', { owner: k, tgt, x: tgt ? tgt.x : p.x, z: tgt ? tgt.z : p.z, y: 0, t: -i * 0.28, lock: 1.25, impact: 1.65, mesh: m, bx: -fx, bz: -fz, side: i - 1, done: false, launched: false });
      if (m) { m.live = true; m.t = 0; m.rec = r; }
      if (tgt && tgt.player) s.banner('INCOMING!', '#ff5a3a', 1.4, 'a missile has your name on it');
    }
    Sound.play('firework_launch', { vol: k.player ? 0.9 : 0.35, pitch: 0.8 }); Sound.play('throw', { vol: k.player ? 0.5 : 0.2, pitch: 0.6 });
    if (s.fx) for (let i = 0; i < 3; i++) s.fx.add(k.x, k.y + 2.5, k.z, (Math.random() - 0.5) * 2, 30, (Math.random() - 0.5) * 2, 0.8, 0.5, 0.2, CART_IXC.fire, 1, 'streak', 1 | 16);
  },
  aiWants(s, k) { return cartIxTargets(s, k, s.isRace ? 150 : 70).length > 0 || k.ai.itemT < -4; },
  icon(ctx, s, col) { ctx.save(); ctx.rotate(0.65); ctx.fillStyle = '#f0f0f4'; ctx.fillRect(-s * 0.12, -s * 0.3, s * 0.24, s * 0.62); ctx.strokeRect(-s * 0.12, -s * 0.3, s * 0.24, s * 0.62); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.12, s * 0.32); ctx.lineTo(0, s * 0.56); ctx.lineTo(s * 0.12, s * 0.32); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-s * 0.12, -s * 0.18); ctx.lineTo(-s * 0.28, -s * 0.36); ctx.lineTo(-s * 0.12, -s * 0.3); ctx.moveTo(s * 0.12, -s * 0.18); ctx.lineTo(s * 0.28, -s * 0.36); ctx.lineTo(s * 0.12, -s * 0.3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.arc(0, -s * 0.42, s * 0.11, 0, TAU); ctx.fill(); ctx.restore(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.arc(s * 0.22, s * 0.3, s * 0.2, 0, TAU); ctx.stroke(); }
};
CART_IX_KIND.missile = {
  update(s, r, dt) {
    const tg = r.tgt;
    if (r.t < 0) return true;
    // the target tracks its car (with a little lead) until it locks
    if (r.t < r.lock && tg && !tg.out) { const lead = clamp(r.impact - r.t, 0, 0.45);   // aims where the car will be: keep going straight and it lands on you
      r.x = lerp(r.x, tg.x + tg.vx * lead, 1 - Math.exp(-10 * dt)); r.z = lerp(r.z, tg.z + tg.vz * lead, 1 - Math.exp(-10 * dt)); }
    r.y = s.terrain.height(r.x, r.z);
    if (!r.launched && r.t > r.impact - 0.85) { r.launched = true; cartIxSound(s, 'firework_launch', r.x, r.z, 0.6, 0.6); }
    if (!r.done && r.t >= r.impact) {
      r.done = true; r.life = r.t + 0.6;
      // a mirror decoy (MIRROR SCHOOL) catches a missile meant for its owner
      if (tg && tg.guard && Math.hypot(tg.x - r.x, tg.z - r.z) < 6 && tg.guard(s, tg, 'launch', r.owner, { item: 'skymail' })) cartIxBoom(s, r.x, tg.y + 4, r.z, 0.7);
      else { cartIxBoom(s, r.x, r.y, r.z, 1); cartIxBlast(s, r.x, r.y, r.z, 4.6, 'launch', r.owner, 'skymail', 6, 13, r.owner); }
      if (r.mesh && r.mesh.rec === r) { r.mesh.live = false; r.mesh.rec = null; }
    }
    if (r.mesh && r.mesh.rec === r && r.mesh.live) {
      // the descent: from 60 m up and 30 m back (from the side the owner fired from) down onto the target
      const u = clamp((r.t - (r.impact - 0.85)) / 0.85, 0, 1), e = u * u, sx = r.x - r.bx * 24 + r.side * 7, sz = r.z - r.bz * 24, sy = r.y + 34;
      const M = r.mesh; M.x = lerp(sx, r.x, e); M.y = lerp(sy, r.y, e); M.z = lerp(sz, r.z, e); M.visible = u > 0;
      const dx = r.x - sx, dy = r.y - sy, dz = r.z - sz; M.yaw = Math.atan2(dx, dz); M.pitch = Math.atan2(-dy, Math.hypot(dx, dz)); M.roll = r.t * 6; M.scale = 1.6;
      if (u > 0 && s.fx) { s.fx.add(M.x - dx * 0.02, M.y - dy * 0.02, M.z - dz * 0.02, 0, 0, 0, 0.18, 1.0, 0.3, CART_IXC.fire, 1, 'flame', 1); if (Math.random() < 0.8) s.fx.add(M.x - dx * 0.03, M.y - dy * 0.03, M.z - dz * 0.03, (Math.random() - 0.5) * 0.6, 0.5, (Math.random() - 0.5) * 0.6, 1.4, 0.9, 2.6, CART_IXC.white, 0.5, 'smoke', 4); }
    }
    return r.t < (r.life || 9);
  },
  sprites(s, R, r, S, t) {
    if (r.t < -0.1) return;
    const C = CART_IXC, gy = r.y + 0.12;
    if (!r.done) {
      const locked = r.t >= r.lock, u = clamp(r.t / r.impact, 0, 1), sz = 9 - u * 3.5, blink = locked ? 1 : 0.55 + 0.45 * Math.sin(t * (10 + u * 20));
      R.flat.flat(r.x, gy - 0.01, r.z, sz * 1.08, sz * 1.08, t * (locked ? 0 : 3), S.reticle, C.black, 0.55, false);
      R.flat.flat(r.x, gy, r.z, sz, sz, t * (locked ? 0 : 3), S.reticle, locked ? C.redHot : C.red, 0.6 + 0.4 * blink, false);
      R.flat.flat(r.x, gy + 0.01, r.z, sz * 1.3, sz * 1.3, -t * 2, S.ring, C.red, 0.7 * blink, false);
      R.flat.flat(r.x, gy + 0.02, r.z, sz * 0.9, sz * 0.9, 0, S.glow, C.red, 0.5 * blink, true);
      R.bbs.streak(r.x, r.y + 9, r.z, 0, 1, 0, 18, 0.9, S.streak, C.red, 0.55 * blink);
      // and a lock-on marker floating over the victim, so it reads even when the car hides the ground target
      const tg = r.tgt, hy = tg && !locked ? tg.y + (tg.M ? tg.M.h : 3) + 2.6 : r.y + 4, hx = tg && !locked ? tg.x : r.x, hz = tg && !locked ? tg.z : r.z, bob = Math.sin(t * 8) * 0.25;
      R.bbs.bb(hx, hy + bob, hz, 3.2, 3.2, S.reticle, C.black, 0.5, false, t * 2);
      R.bbs.bb(hx, hy + bob, hz, 3, 3, S.reticle, locked ? C.redHot : C.red, 0.7 + 0.3 * blink, false, t * 2);
      R.bbs.bb(hx, hy + 2 + bob, hz, 1.6, 1.6, S.arrow, C.red, 0.95, false);
    } else {
      const a = clamp(1 - (r.t - r.impact) / 0.6, 0, 1);
      R.flat.flat(r.x, gy, r.z, 9, 9, 0, S.scorch, C.scorch, 0.85 * Math.min(1, a * 3), false);
      R.flat.flat(r.x, gy + 0.02, r.z, 12 * (1.3 - a), 12 * (1.3 - a), 0, S.ring, C.flash, a, true);
    }
  },
  lights(s, r, add) { if (r.mesh && r.mesh.rec === r && r.mesh.visible) add(r.mesh.x, r.mesh.y, r.mesh.z, 8, CART_IXC.fire, 1.2, 1.4); else if (!r.done && r.t > 0) add(r.x, r.y + 1, r.z, 6, CART_IXC.red, 0.8, 1.2); }
};

/* ---------------- BOMBS AWAY: a bombing run down the road ahead ----------------
   Eight bombs land 34–118 m ahead in 1.85 s, front first; their shadows grow so you can dodge. Each blast (4.8 m)
   flips, and leaves a scorched crater that burns for 4.5 s (drive through the fire and you spin). The owner's own
   bombs and fires never hurt it. */
CART_ITEM_FX.bombs = {
  use(s, k) {
    for (let i = 0; i < 8; i++) {
      const lat = (i % 2 ? 0.45 : -0.45) + (s.rng() - 0.5) * 0.35, p = cartIxAhead(s, k, 34 + i * 12, lat, CART_IX_T.spot), m = cartIxTake(s.ix.bombs);
      const r = cartIxRec(s, 'bomb', { owner: k, x: p.x, z: p.z, y: s.terrain.height(p.x, p.z), land: 0.85 + i * 0.14, fall: 1.0, mesh: m, done: false, fire: 4.5, scorch: 9, life: 0.85 + i * 0.14 + 9 });
      if (m) { m.live = true; m.t = 0; m.rec = r; }
    }
    Sound.play('whistle', { vol: k.player ? 0.6 : 0.25, pitch: 0.55 }); Sound.play('throw', { vol: k.player ? 0.5 : 0.2, pitch: 0.5 });
  },
  aiWants(s, k) { const L = cartIxTargets(s, k, s.isRace ? 120 : 80); for (const o of L) if (o._ixD > 25) return true; return k.ai.itemT < -4; },
  icon(ctx, s, col) { ctx.fillStyle = '#24222a'; ctx.beginPath(); ctx.arc(-s * 0.05, s * 0.1, s * 0.34, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = s * 0.06; ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-s * 0.16, -s * 0.02, s * 0.08, 0, TAU); ctx.fill(); ctx.strokeStyle = '#c8a070'; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.moveTo(s * 0.16, -s * 0.18); ctx.quadraticCurveTo(s * 0.3, -s * 0.45, s * 0.42, -s * 0.36); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, rr = i % 2 ? s * 0.06 : s * 0.15; ctx.lineTo(s * 0.44 + Math.cos(a) * rr, -s * 0.4 + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
};
CART_IX_KIND.bomb = {
  update(s, r, dt) {
    const k = r.owner;
    if (!r.done) {
      const u = clamp((r.t - (r.land - r.fall)) / r.fall, 0, 1);
      if (r.mesh && r.mesh.rec === r) { const M = r.mesh; M.visible = u > 0; M.x = r.x + Math.sin(r.t * 7) * 0.15 * (1 - u); M.z = r.z; M.y = r.y + 40 * (1 - u * u) + 0.5; M.yaw = r.t * 2; M.pitch = Math.PI; M.roll = Math.sin(r.t * 9) * 0.15; M.scale = 1.4; if (u > 0 && s.fx && Math.random() < 0.6) s.fx.add(M.x, M.y + 1.3, M.z, 0, 0.5, 0, 0.25, 0.3, 0.1, CART_IXC.gold, 1, 'spark', 1); }
      if (u > 0.3) cartIxObs(s, r.x, r.z, 4);
      if (r.t >= r.land) {
        r.done = true; if (r.mesh && r.mesh.rec === r) { r.mesh.live = false; r.mesh.rec = null; }
        cartIxBoom(s, r.x, r.y, r.z, 1.1);
        cartIxBlast(s, r.x, r.y, r.z, 4.8, 'flip', k, 'bombs', 8, 11, k);
      }
    } else {
      const ft = r.t - r.land;
      if (ft < r.fire) {
        cartIxObs(s, r.x, r.z, 3);
        for (const o of s.karts) { if (o === k || o.out || o.air || o.invT > 0) continue; if (Math.hypot(o.x - r.x, o.z - r.z) < 2.7) s.hit(o, 'spin', k, { item: 'bombs', dur: 1.0 }); }
        if (s.fx && Math.random() < 0.85) s.fx.fire(r.x + (Math.random() - 0.5) * 3, r.y, r.z + (Math.random() - 0.5) * 3, 1.3 * (1 - ft / r.fire * 0.5));
        if (s.fx && Math.random() < dt * 3) s.fx.add(r.x, r.y + 1.5, r.z, 0, 2.2, 0, 2.2, 1.5, 4, CART_IXC.smoke, 0.4, 'smoke', 4);
      }
    }
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const C = CART_IXC, gy = r.y + 0.1;
    if (!r.done) {
      const u = clamp((r.t - (r.land - r.fall - 0.3)) / (r.fall + 0.3), 0, 1); if (u <= 0) return;
      R.flat.flat(r.x, gy, r.z, 1 + u * 4.5, 1 + u * 4.5, 0, S.shadow, C.black, 0.25 + u * 0.55, false);
      R.flat.flat(r.x, gy + 0.02, r.z, 9.6, 9.6, t * 2, S.warn, C.redHot, (0.35 + 0.45 * Math.max(0, Math.sin(t * 16))) * u, true);
    } else {
      const ft = r.t - r.land, a = clamp((r.scorch - ft) / 2, 0, 1);
      R.flat.flat(r.x, gy, r.z, 8.5, 8.5, r.x, S.scorch, C.scorch, 0.9 * a, false);
      if (ft < r.fire) R.flat.flat(r.x, gy + 0.03, r.z, 7, 7, 0, S.glow, C.fire, 0.55 * (1 - ft / r.fire), true);
      if (ft < 0.5) R.flat.flat(r.x, gy + 0.04, r.z, 14 * (0.4 + ft * 2), 14 * (0.4 + ft * 2), 0, S.ring, C.flash, 1 - ft * 2, true);
    }
  },
  lights(s, r, add) { if (r.done) { const ft = r.t - r.land; if (ft < r.fire) add(r.x, r.y + 1.2, r.z, 7, CART_IXC.fire, 0.9 * (1 - ft / r.fire) + 0.2, 1); } }
};

/* ---------------- DUCK DOWNPOUR: it rains rubber ducks ----------------
   32 ducks fall over the course ahead (races: 14–125 m, across the road; arenas: around the rivals), bounce with a
   squeak and sit there for 13 s. Hit one and it gets kicked away (it can hit others), you lose a fifth of your
   speed and wobble. The owner just scatters them for its first 3 s. They pop at the end. */
CART_ITEM_FX.ducks = {
  use(s, k) {
    const ix = s.ix, n = CART_IX_POOL.duck, arena = !(s.T && s.isRace);
    const rivals = arena ? cartIxTargets(s, k, 80).slice(0, 4) : null;
    for (let i = 0; i < n; i++) {
      const d = cartIxTake(ix.ducks); if (!d) break;
      let p;
      if (arena && rivals.length && i % 2 === 0) { const o = rivals[i % rivals.length], a = s.rng() * TAU, rr = 2 + s.rng() * 9; p = CART_IX_T.spot; p.x = o.x + o.vx * 1.2 + Math.sin(a) * rr; p.z = o.z + o.vz * 1.2 + Math.cos(a) * rr; cartIxInside(s, p, 3); }
      else p = cartIxAhead(s, k, 14 + s.rng() * (arena ? 60 : 110), (s.rng() * 2 - 1) * 0.92, CART_IX_T.spot);
      d.live = true; d.visible = false; d.t = 0; d.delay = s.rng() * 1.3; d.life = 14.5 + s.rng(); d.rest = false; d.kick = 0; d.owner = k; d.ph = s.rng() * 10;
      d.gx = p.x; d.gz = p.z; d.gy = s.terrain.height(p.x, p.z) + 22 + s.rng() * 16; d.vx = (s.rng() - 0.5) * 3; d.vy = -3; d.vz = (s.rng() - 0.5) * 3; d.yaw0 = s.rng() * TAU; d.spin = (s.rng() - 0.5) * 6; d.tumble = s.rng() * TAU;
    }
    cartIxRec(s, 'ducks', { owner: k, life: 16.5 });
    const v = k.player ? 0.9 : 0.35; Sound.play('cartQuack', { vol: v, pitch: 1.3 }); Sound.play('cartQuack', { vol: v * 0.8, pitch: 0.8 }); Sound.play('thunder', { vol: v * 0.35, pitch: 1.6 });
    if (k.player) s.banner('IT\'S RAINING DUCKS!', '#ffe24a', 1.4);
  },
  aiWants(s, k) { return cartIxTargets(s, k, s.isRace ? 110 : 50).length > 0 || k.ai.itemT < -3; },
  icon(ctx, s, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(-s * 0.02, s * 0.2, s * 0.4, s * 0.24, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(s * 0.18, -s * 0.16, s * 0.2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.ellipse(s * 0.42, -s * 0.12, s * 0.12, s * 0.06, 0.1, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(s * 0.22, -s * 0.22, s * 0.04, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5ac8ff'; ctx.lineWidth = s * 0.06; for (const [x, y] of [[-0.42, -0.4], [-0.2, -0.5], [0.0, -0.44]]) { ctx.beginPath(); ctx.moveTo(x * s, y * s); ctx.lineTo(x * s - s * 0.05, y * s + s * 0.14); ctx.stroke(); }
  }
};
// the ducks are pooled meshes, not records: one record keeps the sound and HUD side going; the pool is stepped here
function cartIxDucks(s, dt) {
  const ix = s.ix, G = 24;
  for (const d of ix.ducks) {
    if (!d.live) continue;
    d.t += dt;
    if (d.delay > 0) { d.delay -= dt; d.visible = false; continue; }
    if (d.t > d.life) { d.live = false; d.visible = false; if (s.fx) { s.fx.burst(d.gx, d.y + 0.5, d.gz, 'star', 5, '#ffe24a'); s.fx.add(d.gx, d.y + 0.5, d.gz, 0, 0.5, 0, 0.4, 0.8, 1.6, CART_IXC.white, 0.6, 'puff', 4); } cartIxSound(s, 'pick', d.gx, d.gz, 0.25, 1.6, 0.08); continue; }
    if (d.kick > 0) d.kick -= dt;
    const gh = s.terrain.height(d.gx, d.gz);
    if (!d.rest) {
      d.vy -= G * dt; d.gx += d.vx * dt; d.gz += d.vz * dt; d.gy += d.vy * dt; d.yaw0 += d.spin * dt; d.tumble += d.spin * 0.7 * dt;
      if (d.gy <= gh) {
        d.gy = gh;
        if (d.vy < -3.5) { const hard = d.vy < -12; d.vy = -d.vy * 0.4; d.vx *= 0.6; d.vz *= 0.6; d.spin *= 0.6; if (hard) { cartIxSound(s, 'cartQuack', d.gx, d.gz, 0.45, 1.5 + Math.random() * 0.4, 0.07); if (s.fx) s.fx.dust(d.gx, gh + 0.1, d.gz, 3, s.night ? '#8a7a7a' : '#e8d4b4'); } }
        else { d.vy = 0; d.rest = Math.hypot(d.vx, d.vz) < 1; d.vx *= Math.exp(-4 * dt); d.vz *= Math.exp(-4 * dt); d.spin *= Math.exp(-5 * dt); }
      }
      if (s.E.walls) { const w = s.wallDist(d.gx, d.gz, CART_IX_T.wd); if (w.d < 1) { const vn = d.vx * w.nx + d.vz * w.nz; if (vn < 0) { d.vx -= w.nx * vn * 1.6; d.vz -= w.nz * vn * 1.6; } d.gx += w.nx * (1 - w.d); d.gz += w.nz * (1 - w.d); } }
    } else d.gy = gh;
    // cars: kick the duck, lose some speed, wobble, squeak
    if (d.kick <= 0) for (const o of s.karts) {
      if (o.out) continue;
      const dx = d.gx - o.x, dz = d.gz - o.z, dd = dx * dx + dz * dz; if (dd > 3.2 || o.y > d.gy + 1.4 || o.y < d.gy - 1.6) continue;
      const l = Math.sqrt(dd) || 1, sp = Math.hypot(o.vx, o.vz);
      d.vx = o.vx * 0.8 + dx / l * 6; d.vz = o.vz * 0.8 + dz / l * 6; d.vy = 6 + sp * 0.2; d.spin = (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 8); d.rest = false; d.kick = 0.35; d.gy += 0.2;
      const own = o === d.owner && d.t < 3.5;
      if (!own && o.invT <= 0 && !o.fly && !o.sunk) {
        o.vx *= 0.8; o.vz *= 0.8; o.yaw = cartWrap(o.yaw + (Math.random() - 0.5) * 0.22); o.drift = 0; o.charge = 0;
        if (!o.duckT || s.t > o.duckT) { o.duckT = s.t + 0.6; s.log('duck', { k: o.id, by: d.owner && d.owner.id, item: 'ducks' }); if (o.player) { s.banner('QUACK!', '#ffe24a', 0.6, null, true); s.shakeIt(0.25); } }
      }
      cartIxSound(s, 'cartQuack', d.gx, d.gz, o.player ? 0.8 : 0.4, 1.2 + Math.random() * 0.5, 0.05);
      if (s.fx) s.fx.burst(d.gx, d.gy + 0.6, d.gz, 'star', 4, '#ffe24a');
      break;
    }
    if (d.rest || d.gy < gh + 1) cartIxObs(s, d.gx, d.gz, 0.8);
    d.visible = true; d.x = d.gx; d.z = d.gz;
    const bob = d.rest ? Math.sin(s.t * 3 + d.ph) * 0.04 : 0;
    d.y = d.gy + bob; d.yaw = d.yaw0; d.pitch = d.rest ? Math.sin(s.t * 2.3 + d.ph) * 0.08 : Math.sin(d.tumble) * 0.9; d.roll = d.rest ? 0 : Math.cos(d.tumble * 0.7) * 0.6;
    d.scale = 1.45 * (d.t > d.life - 0.3 ? clamp((d.life - d.t) / 0.3, 0.05, 1) : 1);
  }
}
CART_IX_KIND.ducks = { update(s, r, dt) { return r.t < r.life; }, sprites() {} };

/* ============ the twelve car specials (CART_SPECIALS: each car rolls only its own) ============ */
const cartIxNear = (s, k, range, front) => { for (const o of s.karts) { if (o === k || o.out || o.invT > 0.3 || (s.isRace && o.finished)) continue; const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); if (d < range && (!front || dx * Math.sin(k.yaw) + dz * Math.cos(k.yaw) > 0)) return true; } return false; };

/* ---- BASS VALENTINE: HEART THROB. Three heartbeats; the first ring (30 m) leaves every rival it reaches LOVESTRUCK:
   3.2 s at 70 % speed, steering drifting toward the heart car, hearts circling their head. ---- */
CART_ITEM_FX.throb = {
  use(s, k) { cartIxRec(s, 'throb', { owner: k, x: k.x, y: k.y, z: k.z, beats: 0, mask: 0, R: 30, life: 1.7 }); Sound.play('swell', { vol: k.player ? 0.6 : 0.25 }); },
  aiWants(s, k) { return cartIxNear(s, k, 25) || k.ai.itemT < -5; },
  icon(ctx, s, col) { ctx.strokeStyle = col; ctx.lineWidth = s * 0.07; for (let i = 0; i < 2; i++) { ctx.globalAlpha *= 0.8; ctx.beginPath(); ctx.arc(0, s * 0.02, s * (0.36 + i * 0.13), 0, TAU); ctx.stroke(); } ctx.globalAlpha = 1; cartHeartIcon(ctx, 0, s * 0.04, s * 0.3, col); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-s * 0.1, -s * 0.08, s * 0.05, 0, TAU); ctx.fill(); }
};
CART_IX_KIND.throb = {
  update(s, r, dt) {
    const k = r.owner; r.x = k.x; r.y = k.y; r.z = k.z;
    const beat = Math.floor(r.t / 0.42);
    if (beat < 3 && beat >= r.beats) { r.beats = beat + 1; cartIxSound(s, 'cartBass', k.x, k.z, k.player ? 1 : 0.6, 1.25 - beat * 0.12); if (s.fx) s.fx.hearts(k.x, k.y + 4, k.z, 8); if (k.player) s.shakeIt(0.2); }
    const u = clamp(r.t / 0.6, 0, 1); r.rad = r.R * (1 - (1 - u) * (1 - u));
    if (r.t < 0.7) for (const o of s.karts) { if (o === k || o.out || (r.mask & (1 << o.slot))) continue; if (Math.hypot(o.x - k.x, o.z - k.z) < r.rad + 1.5 && Math.abs(o.y - k.y) < 5) { r.mask |= 1 << o.slot; if (s.hit(o, 'charm', k, { item: 'throb', dur: 3.2 }) && s.fx) s.fx.hearts(o.x, o.y + 3, o.z, 10); } }
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const C = CART_IXC, gy = s.terrain.height(r.x, r.z) + 0.12;
    for (let b = 0; b < 3; b++) { const tb = r.t - b * 0.42; if (tb < 0 || tb > 0.75) continue; const u = tb / 0.75, e = 1 - (1 - u) * (1 - u), sz = r.R * 2 * e * (1 - b * 0.15), a = 1 - u; R.flat.flat(r.x, gy, r.z, sz, sz, 0, S.ring, C.pink, a, true); R.flat.flat(r.x, gy + 0.02, r.z, sz * 0.96, sz * 0.96, 0, S.ring, C.white, a * 0.5, true); for (let i = 0; i < 12; i++) { const ang = i / 12 * TAU + b, d = sz * 0.5; R.bbs.bb(r.x + Math.sin(ang) * d, gy + 1.2, r.z + Math.cos(ang) * d, 1.6, 1.6, S.heart, C.pink, a, true); } }
    const pulse = Math.max(0, Math.sin(r.t / 0.42 * Math.PI)), a = clamp((r.life - r.t) * 2, 0, 1);
    R.bbs.bb(r.x, r.y + 5.5, r.z, 4 + pulse * 2.5, 4 + pulse * 2.5, S.heart, C.pink, 0.95 * a, true);
    R.bbs.bb(r.x, r.y + 5.5, r.z, 9 + pulse * 3, 9 + pulse * 3, S.glow, C.pink, 0.45 * a, true);
  },
  lights(s, r, add) { add(r.x, r.y + 4, r.z, 18, CART_IXC.pink, 1.5 * clamp(r.life - r.t, 0, 1), 2); }
};

/* ---- GLITTERFIN: MIRROR SCHOOL. Three mirror-ball decoy fish circle the car for 10 s. Each one swallows one incoming
   hit or shot (k.guard), and a rival that touches one is spun and dazzled. ---- */
CART_ITEM_FX.decoys = {
  use(s, k) {
    if (k.decoyRec) k.decoyRec.life = 0;
    const r = cartIxRec(s, 'decoys', { owner: k, life: 10, alive: 7, px: [0, 0, 0], py: [0, 0, 0], pz: [0, 0, 0] });
    k.decoyRec = r; k.guard = cartIxDecoyGuard;
    const v = k.player ? 0.8 : 0.3; Sound.play('disco', { vol: v * 0.6 }); Sound.play('cartSparkle', { vol: v });
    if (s.fx) s.fx.burst(k.x, k.y + 1.5, k.z, 'star', 14, '#dfe8ff');
  },
  aiWants(s, k) { return cartIxNear(s, k, 22) || k.ai.itemT < -1; },
  icon(ctx, s, col) { for (const [dx, dy, r] of [[-0.25, 0.18, 0.2], [0.22, 0.2, 0.2], [0, -0.2, 0.22]]) { const g = ctx.createRadialGradient(dx * s - r * s * 0.3, dy * s - r * s * 0.3, 1, dx * s, dy * s, r * s); g.addColorStop(0, '#ffffff'); g.addColorStop(1, col); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(dx * s, dy * s, r * s, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(dx * s - r * s, dy * s); ctx.lineTo(dx * s - r * s * 1.6, dy * s - r * s * 0.5); ctx.lineTo(dx * s - r * s * 1.6, dy * s + r * s * 0.5); ctx.closePath(); ctx.fill(); } }
};
function cartIxDecoyPop(s, r, i) {
  r.alive &= ~(1 << i);
  if (s.fx) { s.fx.burst(r.px[i], r.py[i], r.pz[i], 'star', 12, '#ffffff'); s.fx.confetti(r.px[i], r.py[i], r.pz[i], 10); }
  cartIxSound(s, 'glass', r.px[i], r.pz[i], 0.7, 1.3);
}
// k.guard: a live decoy takes the hit instead of the car
function cartIxDecoyGuard(s, k, kind, src, o) {
  const r = k.decoyRec; if (!r || !r.alive || src === k) return false;
  for (let i = 0; i < 3; i++) if (r.alive & (1 << i)) { cartIxDecoyPop(s, r, i); break; }
  s.log('blocked', { k: k.id, by: src && src.id, w: o && (o.weapon || o.item), decoy: true });
  if (k.player) s.banner('DECOY TOOK THE HIT!', '#bfe0ff', 1.1, null, true);
  return true;
}
CART_IX_KIND.decoys = {
  update(s, r, dt) {
    const k = r.owner;
    if (k.decoyRec !== r) return false;
    if (k.out) { k.decoyRec = null; k.guard = null; return false; }
    for (let i = 0; i < 3; i++) {
      const a = r.t * 2.4 + i * TAU / 3, rad = 3.6 + Math.sin(r.t * 1.7 + i) * 0.4;
      r.px[i] = k.x + Math.sin(a) * rad; r.pz[i] = k.z + Math.cos(a) * rad; r.py[i] = k.y + 1.5 + Math.sin(r.t * 3 + i * 2) * 0.35;
      if (!(r.alive & (1 << i))) continue;
      for (const o of s.karts) { if (o === k || o.out || o.invT > 0) continue; if (Math.hypot(o.x - r.px[i], o.z - r.pz[i]) < 1.9 && Math.abs(o.y + 1 - r.py[i]) < 2.2) { if (s.hit(o, 'spin', k, { item: 'decoys', dur: 1.0 })) o.dazzleT = 2.2; cartIxDecoyPop(s, r, i); break; } }
      if (!(r.alive & (1 << i))) continue;
      for (const sh of s.shots) { if (sh.owner === k || sh.dead || sh.x === undefined || !(sh.type === 'ball' || sh.fx === 'board' || sh.fx === 'torpedo' || sh.fx === 'lantern')) continue; if (Math.hypot(sh.x - r.px[i], sh.z - r.pz[i]) < 2.3) { sh.dead = true; cartIxDecoyPop(s, r, i); break; } }
    }
    if (!r.alive || r.t > r.life) { if (k.decoyRec === r) { k.decoyRec = null; k.guard = null; } return false; }
    return true;
  },
  sprites(s, R, r, S, t) {
    const C = CART_IXC, a = clamp((r.life - r.t) * 2, 0, 1);
    for (let i = 0; i < 3; i++) {
      if (!(r.alive & (1 << i))) continue;
      const x = r.px[i], y = r.py[i], z = r.pz[i], gy = s.terrain.height(x, z) + 0.1, c = CART_IX_NEON[(i + Math.floor(t * 4)) % 6];
      R.bbs.bb(x, y, z, 3.4, 3.4, S.glow, C.silver, 0.6 * a, true);
      // a mirror ball: a silver disc tiled with flashing coloured facets
      R.bbs.bb(x, y, z, 2.3, 2.3, S.dot, C.silverDark, a, false);
      for (let f = 0; f < 9; f++) { const fa = f * 2.39 + t * 2.2 + i, fr = 0.15 + (f % 3) * 0.17, fc = (f + Math.floor(t * 6 + i)) % 4 === 0 ? CART_IX_NEON[(f + i) % 6] : C.silver; R.bbs.bb(x + Math.cos(fa) * fr * Math.cos(r.owner.yaw), y + Math.sin(fa) * fr, z + -Math.cos(fa) * fr * Math.sin(r.owner.yaw), 0.42, 0.42, S.square, fc, a, false, 0.785); }
      R.bbs.bb(x, y, z, 1.2, 1.2, S.core, C.white, 0.35 * a, true);
      R.bbs.bb(x + 0.3, y + 0.3, z, 1.2, 1.2, S.star, C.white, (0.5 + 0.5 * Math.sin(t * 9 + i)) * a, true, t * 3 + i);
      R.flat.flat(x, gy, z, 3.2, 3.2, 0, S.glow, c, 0.55 * a, true);
    }
  },
  lights(s, r, add) { if (r.alive) add(r.owner.x, r.owner.y + 2, r.owner.z, 9, CART_IX_NEON[Math.floor(s.time * 4) % 6], 1.0, 1.4); }
};

/* ---- CALAMARI INFERNO: TENTACLE TOSS. Two copper arms grab the closest rivals ahead (24 m) and fling them over the
   octopus to land 14 m behind it, spinning. ---- */
CART_ITEM_FX.toss = {
  use(s, k) {
    const L = cartIxTargets(s, k, 26), grabs = [];
    for (let i = 0; i < 2; i++) { const o = L[i]; if (!o) break; grabs.push({ o, t: 0, ok: false, side: i ? -1 : 1, done: false }); }
    if (!grabs.length) { const p = cartIxAhead(s, k, 18, 0, CART_IX_T.spot); grabs.push({ o: null, x: p.x, z: p.z, t: 0, ok: false, side: 1, done: false }); }
    cartIxRec(s, 'toss', { owner: k, grabs, life: 1.8 });
    const v = k.player ? 0.9 : 0.35; Sound.play('throw', { vol: v, pitch: 0.7 }); Sound.play('cartChomp', { vol: v * 0.6, pitch: 0.6 });
  },
  aiWants(s, k) { return cartIxTargets(s, k, 22).length > 0 || k.ai.itemT < -8; },
  icon(ctx, s, col) { ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = s * 0.16; ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.45); ctx.bezierCurveTo(-s * 0.5, -s * 0.2, s * 0.1, -s * 0.55, s * 0.3, -s * 0.1); ctx.stroke(); ctx.lineWidth = s * 0.05; ctx.strokeStyle = '#1a1020'; ctx.beginPath(); ctx.arc(s * 0.3, -s * 0.1, s * 0.09, 0, TAU); ctx.stroke(); ctx.fillStyle = '#ffd8b0'; for (const [x, y] of [[-0.42, 0.25], [-0.36, -0.02], [-0.18, -0.26], [0.06, -0.33]]) { ctx.beginPath(); ctx.arc(x * s, y * s, s * 0.05, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ff5ad8'; ctx.beginPath(); ctx.arc(s * 0.32, s * 0.28, s * 0.14, 0, TAU); ctx.fill(); ctx.stroke(); }
};
CART_IX_KIND.toss = {
  update(s, r, dt) {
    const k = r.owner;
    for (const g of r.grabs) {
      g.t += dt;
      if (!g.done && g.t >= 0.28) {
        g.done = true; const o = g.o;
        if (o && !o.out && Math.hypot(o.x - k.x, o.z - k.z) < 32 && s.hit(o, 'spin', k, { item: 'toss', dur: 1.9 })) {
          g.ok = true; const p = CART_IX_T.spot2;
          if (s.T && s.isRace) { const at = s.T.at((k.loc.s || 0) - 14, CART_IX_T.at), d = clamp(o.loc.d, -(at.hw - 2), at.hw - 2); p.x = at.x + at.nx * d; p.z = at.z + at.nz * d; o.carry = { t: 0, dur: 1.1, x0: o.x, z0: o.z, y0: o.y, x1: p.x, z1: p.z, h: 9, spin: 8, vx: at.tx * 8, vz: at.tz * 8 }; }
          else { p.x = k.x - Math.sin(k.yaw) * 14 + g.side * 3 * Math.cos(k.yaw); p.z = k.z - Math.cos(k.yaw) * 14 - g.side * 3 * Math.sin(k.yaw); cartIxInside(s, p, 4); o.carry = { t: 0, dur: 1.1, x0: o.x, z0: o.z, y0: o.y, x1: p.x, z1: p.z, h: 9, spin: 8, vx: 0, vz: 0 }; }
          cartIxSound(s, 'throw', o.x, o.z, 0.9, 0.9); cartIxSound(s, 'spring', o.x, o.z, 0.6, 0.7);
          if (o.player) s.banner('TOSSED!', '#ff9a4a', 1.0, 'by ' + k.car.name);
        }
      }
    }
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const k = r.owner, C = CART_IXC, P0 = CART_IX_T.a;
    for (const g of r.grabs) {
      // reach out (0.28 s), hold while the victim rises (to 0.75 s), then let go and coil back
      let ex, ey, ez, reach;
      const o = g.o;
      if (g.t < 0.28) reach = g.t / 0.28; else if (g.ok && g.t < 0.75) reach = 1; else reach = clamp(1 - (g.t - (g.ok ? 0.75 : 0.28)) / 0.35, 0, 1);
      if (reach <= 0) continue;
      cartCarPoint(k, g.side * 1.2, 1.5, 0.8, P0);
      if (o) { ex = o.x; ey = o.y + 1.2; ez = o.z; } else { ex = g.x; ey = s.terrain.height(g.x, g.z) + 1; ez = g.z; }
      ex = lerp(P0[0], ex, reach); ey = lerp(P0[1], ey, reach); ez = lerp(P0[2], ez, reach);
      // the arm: a chain of copper beads, thick at the root, with pale suckers, waving as it reaches
      const n = 16, L = Math.hypot(ex - P0[0], ez - P0[2]);
      for (let i = 1; i <= n; i++) {
        const u = i / n, wig = Math.sin(u * 7 - t * 14) * 0.7 * (1 - u), x = lerp(P0[0], ex, u) + wig * Math.cos(k.yaw), z = lerp(P0[2], ez, u) - wig * Math.sin(k.yaw), y = lerp(P0[1], ey, u) + Math.sin(u * Math.PI) * (2 + L * 0.12), w = 1.25 * (1 - u * 0.6);
        R.bbs.bb(x, y, z, w, w, S.dot, C.copperDark, 1, false);
        R.bbs.bb(x, y + w * 0.08, z, w * 0.8, w * 0.8, S.dot, C.copper, 1, false);
        if (i % 2 === 0) R.bbs.bb(x, y - w * 0.28, z, w * 0.32, w * 0.32, S.dot, C.cup, 1, false);
      }
      R.bbs.bb(ex, ey, ez, 2.4, 2.4, S.glow, C.fire, 0.5, true);
    }
  }
};

/* ---- flights: DRAGON FLIGHT, SKY BREACH, STORM HOVER, SHELL BOUNCE (k.fly; cartFlyV lifts the car) ---- */
// one record per flight: tick the clock, end it when it is over (or the car is knocked out of the sky)
function cartIxFlyTick(s, r, dt) {
  const k = r.owner, f = k.fly;
  if (!f || f !== r.f) return false;
  f.t += dt;
  if (k.out || k.flipT > 0) { cartFlyEnd(s, k); return false; }
  return true;
}
CART_ITEM_FX.glide = {
  use(s, k) {
    const r = cartIxRec(s, 'glide', { owner: k, mask: 0, life: 6 }); r.f = cartFlyStart(s, k, 'glide', 5.0, 7.5); k.vmaxMin = 1.28; s.boost(k, 0.6, 'glide');
    const v = k.player ? 0.9 : 0.35; Sound.play('fly', { vol: v }); Sound.play('flame', { vol: v * 0.8, pitch: 0.6 });
    if (s.fx) s.fx.dust(k.x, k.y + 0.3, k.z, 16, s.night ? '#8a7a7a' : '#d8b896');
  },
  aiWants(s, k) { return !k.air && (cartIxTargets(s, k, 40).length > 0 || (s.isRace && k.rank > 2) || k.ai.itemT < -3); },
  icon(ctx, s, col) { ctx.fillStyle = col; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * s * 0.08, -s * 0.05); ctx.quadraticCurveTo(sd * s * 0.35, -s * 0.55, sd * s * 0.58, -s * 0.3); ctx.lineTo(sd * s * 0.42, -s * 0.12); ctx.lineTo(sd * s * 0.5, s * 0.02); ctx.lineTo(sd * s * 0.3, s * 0.02); ctx.lineTo(sd * s * 0.32, s * 0.16); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.fillStyle = '#2a8a4a'; ctx.beginPath(); ctx.ellipse(0, s * 0.08, s * 0.13, s * 0.26, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(-s * 0.08, s * 0.32); ctx.lineTo(0, s * 0.58); ctx.lineTo(s * 0.08, s * 0.32); ctx.fill(); }
};
CART_IX_KIND.glide = {
  update(s, r, dt) {
    if (!cartIxFlyTick(s, r, dt)) return false;
    const k = r.owner, f = k.fly, fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    // fire breath onto anyone below: a cone of flame down and forward
    if (f.t > 0.4 && f.t < f.dur - 0.5) {
      const px = k.x + fx * 4, pz = k.z + fz * 4;
      for (const o of s.karts) { if (o === k || o.out || (r.mask & (1 << o.slot))) continue; if (Math.hypot(o.x - px, o.z - pz) < 6 && o.y < k.y - 1.2) { r.mask |= 1 << o.slot; if (s.hit(o, 'spin', k, { item: 'glide', dur: 1.2 })) { cartIxSound(s, 'flame', o.x, o.z, 0.8, 1.2); if (s.fx) s.fx.spark(o.x, o.y + 1, o.z, 12, '#ff8a2a', 6); } } }
      if (s.fx) { const mz = s.muzzle(k, CART_IX_T.b); for (let i = 0; i < 5; i++) s.fx.add(mz[0], mz[1] - 0.3, mz[2], k.vx * 0.9 + fx * 6 + (Math.random() - 0.5) * 3, -10 - Math.random() * 6, k.vz * 0.9 + fz * 6 + (Math.random() - 0.5) * 3, 0.45 + Math.random() * 0.2, 1.1, 3.6, CART_IXC.dragonFire, 1, 'flame', 1 | 4, Math.random() * 6, 3); }
    }
    if (k.player && Math.random() < dt * 2.5) Sound.play('flame', { vol: 0.25, pitch: 0.8 + Math.random() * 0.3 });
    if (f.t >= f.dur) { cartFlyEnd(s, k); return false; }
    return true;
  },
  sprites(s, R, r, S, t) {
    const k = r.owner, f = k.fly; if (!f) return; const C = CART_IXC, P = CART_IX_T.a, fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), gy = s.terrain.height(k.x + fx * 5, k.z + fz * 5) + 0.1;
    const breath = f.t > 0.4 && f.t < f.dur - 0.5 ? 1 : 0;
    if (breath) { R.flat.flat(k.x + fx * 5, gy, k.z + fz * 5, 9, 11, k.yaw, S.glow, C.fire, 0.55, true); R.flat.flat(k.x + fx * 5, gy + 0.02, k.z + fz * 5, 6, 6, t * 2, S.scorch, C.scorch, 0.35, false); }
    for (const sd of [-1, 1]) { cartCarPoint(k, sd * 2.8, 1.8, -0.8, P); R.bbs.streak(P[0] - fx * 3.5, P[1], P[2] - fz * 3.5, fx, 0, fz, 7, 0.35, S.streak, C.white, 0.55); }
  },
  lights(s, r, add) { const k = r.owner; if (k.fly) add(k.x, k.y - 1, k.z, 11, CART_IXC.dragonFire, 1.3, 2); }
};
CART_ITEM_FX.breach = {
  use(s, k) {
    const r = cartIxRec(s, 'breach', { owner: k, life: 5 }); r.f = cartFlyStart(s, k, 'breach', 4.4, 12, { up: 0.75, down: 0.45 }); k.vmaxMin = 1.22; s.boost(k, 0.5, 'breach');
    const v = k.player ? 0.9 : 0.35; Sound.play('cartGeyser', { vol: v }); Sound.play('splash', { vol: v * 0.8, pitch: 0.6 });
    if (s.fx) for (let i = 0; i < 34; i++) s.fx.add(k.x + (Math.random() - 0.5) * 2.5, k.y + 0.3, k.z + (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 4, 14 + Math.random() * 12, (Math.random() - 0.5) * 4, 1.0 + Math.random() * 0.5, 1.1, 0.5, CART_IXC.water, 0.9, 'drop', 2);
  },
  aiWants(s, k) { return !k.air && (cartIxTargets(s, k, 45).length > 0 || (s.isRace && k.rank > 2) || k.ai.itemT < -3); },
  icon(ctx, s, col) { ctx.fillStyle = '#bfe8ff'; ctx.beginPath(); ctx.moveTo(-s * 0.15, s * 0.55); ctx.quadraticCurveTo(-s * 0.05, 0, -s * 0.12, -s * 0.05); ctx.lineTo(s * 0.12, -s * 0.05); ctx.quadraticCurveTo(s * 0.05, 0, s * 0.15, s * 0.55); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -s * 0.25, s * 0.45, s * 0.2, -0.15, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s * 0.38, -s * 0.3); ctx.lineTo(s * 0.58, -s * 0.48); ctx.lineTo(s * 0.55, -s * 0.18); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(-s * 0.25, -s * 0.28, s * 0.04, 0, TAU); ctx.fill(); }
};
CART_IX_KIND.breach = {
  update(s, r, dt) {
    if (!cartIxFlyTick(s, r, dt)) return false;
    const k = r.owner, f = k.fly;
    if (s.fx && Math.random() < 0.7) s.fx.add(k.x + (Math.random() - 0.5) * 2, k.y + 0.2, k.z + (Math.random() - 0.5) * 2, k.vx * 0.3, -2, k.vz * 0.3, 0.9, 0.5, 0.3, CART_IXC.water, 0.9, 'drop', 2);
    if (f.t >= f.dur) {
      // the belly-flop: a tidal splash knocks everyone around away
      const gy = s.terrain.height(k.x, k.z);
      cartFlyEnd(s, k); k.vy = -14;
      cartIxBlast(s, k.x, gy, k.z, 11, 'knock', k, 'breach', 15, 0, k);
      cartIxSound(s, 'splash', k.x, k.z, 1, 0.5); cartIxSound(s, 'cartBoom', k.x, k.z, 0.6, 0.7);
      if (s.fx) for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; s.fx.add(k.x + Math.sin(a) * 2, gy + 0.4, k.z + Math.cos(a) * 2, Math.sin(a) * (8 + Math.random() * 5), 6 + Math.random() * 7, Math.cos(a) * (8 + Math.random() * 5), 0.9 + Math.random() * 0.4, 1.2, 0.5, CART_IXC.water, 0.9, 'drop', 2); }
      cartIxRec(s, 'splash', { x: k.x, y: gy, z: k.z, life: 0.9, R: 24 });
      if (k.player) s.shakeIt(0.8); else if (s.player && Math.hypot(s.player.x - k.x, s.player.z - k.z) < 25) s.shakeIt(0.5);
      return false;
    }
    return true;
  },
  sprites(s, R, r, S, t) { const k = r.owner, f = k.fly; if (!f) return; if (f.t < 0.9) { const gy = s.terrain.height(k.x, k.z), a = 1 - f.t / 0.9; R.bbs.streak(k.x, (gy + k.y) / 2, k.z, 0, 1, 0, Math.max(1, k.y - gy), 3.2, S.streak, CART_IXC.water, 0.8 * a); R.flat.flat(k.x, gy + 0.1, k.z, 10 * (1.5 - a), 10 * (1.5 - a), 0, S.ring, CART_IXC.water, a, true); const hh = Math.max(1, k.y - gy); for (let i = 0; i < 7; i++) { const u = i / 6, w = 3.8 - u * 1.2 + Math.sin(t * 20 + i) * 0.3; R.bbs.bb(k.x + Math.sin(t * 9 + i) * 0.3, gy + hh * u * 0.95, k.z, w, w * 1.2, S.puff, CART_IXC.water, 0.9 * a, false, t * 4 + i); R.bbs.bb(k.x, gy + hh * u * 0.95, k.z, w * 0.6, w * 0.8, S.foam, CART_IXC.white, 0.7 * a, false, i); } } },
  lights(s, r, add) { }
};
CART_IX_KIND.splash = {
  update(s, r, dt) { return r.t < r.life; },
  sprites(s, R, r, S, t) { const u = r.t / r.life, a = 1 - u, C = CART_IXC; R.flat.flat(r.x, r.y + 0.1, r.z, r.R * u + 3, r.R * u + 3, 0, S.ring, r.sand ? C.sandDark : C.water, a, !r.sand); R.flat.flat(r.x, r.y + 0.12, r.z, r.R * 0.7 * u + 2, r.R * 0.7 * u + 2, 0, S.ring, r.sand ? C.sand : C.white, a * 0.7, !r.sand); if (r.sand) R.flat.flat(r.x, r.y + 0.08, r.z, r.R * 0.7, r.R * 0.7, t, S.puff, C.sandDark, 0.7 * a, false); else R.flat.flat(r.x, r.y + 0.08, r.z, r.R * 0.8, r.R * 0.8, 0, S.glow, C.waterDeep, 0.4 * a, true); }
};
CART_ITEM_FX.hover = {
  use(s, k) {
    const r = cartIxRec(s, 'hover', { owner: k, life: 6.2, zapT: 0.3, armT: 0 }); r.f = cartFlyStart(s, k, 'hover', 5.5, 3.8, { up: 0.5, down: 0.6 }); k.vmaxMin = 1.1;
    const v = k.player ? 0.9 : 0.35; Sound.play('float', { vol: v }); Sound.play('cartZap', { vol: v * 0.7, pitch: 0.7 });
  },
  aiWants(s, k) { return !k.air && (cartIxNear(s, k, 25) || k.ai.itemT < -3); },
  icon(ctx, s, col) { ctx.fillStyle = '#c86aff'; ctx.beginPath(); ctx.arc(0, -s * 0.08, s * 0.36, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.08; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.2, -s * 0.05); ctx.lineTo(i * s * 0.2 + s * 0.08, s * 0.15); ctx.lineTo(i * s * 0.2 - s * 0.06, s * 0.27); ctx.lineTo(i * s * 0.2 + s * 0.04, s * 0.5); ctx.stroke(); } }
};
CART_IX_KIND.hover = {
  update(s, r, dt) {
    if (!cartIxFlyTick(s, r, dt)) return false;
    const k = r.owner, f = k.fly;
    r.zapT -= dt;
    if (r.zapT <= 0 && f.t > 0.35) {
      let best = null, bd = 9.5;
      for (const o of s.karts) { if (o === k || o.out || o.invT > 0 || o.y > k.y + 0.5) continue; const d = Math.hypot(o.x - k.x, o.z - k.z); if (d < bd) { bd = d; best = o; } }
      if (best && s.hit(best, 'stun', k, { item: 'hover' })) { cartIxBolt(s, k, best); cartIxSound(s, 'cartZap', best.x, best.z, 0.9, 1 + Math.random() * 0.3); cartIxFlash(s, best.x, best.y + 2, best.z, 12, CART_IXC.cyan, 1.8, 0.25); r.zapT = 0.45; } else r.zapT = 0.1;
    }
    r.armT -= dt; if (r.armT <= 0) { r.armT = 0.18 + Math.random() * 0.2; cartIxBolt(s, k, null); }   // little arcs to the ground
    if (f.t >= f.dur) { cartFlyEnd(s, k); return false; }
    return true;
  },
  sprites(s, R, r, S, t) { const k = r.owner; if (!k.fly) return; const gy = s.terrain.height(k.x, k.z) + 0.1, C = CART_IXC; R.flat.flat(k.x, gy, k.z, 9.5 * 2, 9.5 * 2, -t, S.ring, C.cyan, 0.45 + 0.2 * Math.sin(t * 9), true); R.flat.flat(k.x, gy + 0.02, k.z, 10, 10, 0, S.glow, C.cyan, 0.4, true); R.bbs.bb(k.x, k.y + 1.6, k.z, 7, 7, S.glow, C.cyan, 0.4, true); },
  lights(s, r, add) { const k = r.owner; if (k.fly) add(k.x, k.y, k.z, 12, CART_IXC.cyan, 1.4, 2); }
};
CART_ITEM_FX.shell = {
  use(s, k) {
    const r = cartIxRec(s, 'shell', { owner: k, life: 4, hops: 0 }); r.f = cartFlyStart(s, k, 'shell', 0.85 * 4, 5.5, { hop: 0.85 }); k.vmaxMin = 1.3; k.immuneT = 0.85 * 4 + 0.3; s.boost(k, 0.5, 'shell');
    Sound.play('spring', { vol: k.player ? 0.9 : 0.35, pitch: 0.8 }); Sound.play('cartBubble', { vol: k.player ? 0.6 : 0.2, pitch: 0.6 });
  },
  aiWants(s, k) { return !k.air && (cartIxNear(s, k, 18) || k.ai.itemT < -3); },
  icon(ctx, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, s * 0.05, s * 0.38, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#7aff5a'; ctx.lineWidth = s * 0.07; ctx.beginPath(); for (let i = 0; i < 40; i++) { const a = i / 40 * 4.4 * Math.PI, rr = s * 0.3 * (1 - i / 44); ctx.lineTo(Math.cos(a) * rr, s * 0.05 + Math.sin(a) * rr); } ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.arc(-s * 0.48, s * 0.42, s * 0.1, Math.PI, TAU); ctx.arc(-s * 0.22, s * 0.42, s * 0.1, Math.PI, TAU); ctx.stroke(); }
};
CART_IX_KIND.shell = {
  update(s, r, dt) {
    if (!cartIxFlyTick(s, r, dt)) return false;
    const k = r.owner, f = k.fly, hop = Math.floor(f.t / f.hop);
    const land = () => {
      const gy = s.terrain.height(k.x, k.z);
      s.hazards.push({ type: 'slime', x: k.x, z: k.z, y: gy, r: 3.2, t: 0, life: 6, owner: k, yaw: k.yaw });
      cartIxBlast(s, k.x, gy, k.z, 4.2, 'knock', k, 'shell', 13, 0, k);
      cartIxSound(s, 'splat', k.x, k.z, 0.8, 0.9); cartIxSound(s, 'spring', k.x, k.z, 0.7, 1 + r.hops * 0.12);
      if (s.fx) { s.fx.burst(k.x, gy + 0.5, k.z, 'drop', 16, '#7aff5a'); s.fx.dust(k.x, gy + 0.2, k.z, 6, '#c8b08a'); }
      if (k.player) s.shakeIt(0.3);
    };
    if (hop > r.hops) { r.hops = hop; land(); }
    if (f.t >= f.dur) { land(); cartFlyEnd(s, k); k.vy = -2; return false; }
    return true;
  },
  sprites(s, R, r, S, t) { const k = r.owner; if (!k.fly) return; const C = CART_IXC; R.bbs.bb(k.x, k.y + 1.6, k.z, 6.4, 6.4, S.bubble, C.purple, 0.75, false); R.bbs.bb(k.x, k.y + 1.6, k.z, 5.5, 5.5, S.swirl, C.purple, 0.6, true, -t * 8); R.bbs.bb(k.x, k.y + 1.6, k.z, 8, 8, S.glow, C.purple, 0.35, true); },
  lights(s, r, add) { const k = r.owner; if (k.fly) add(k.x, k.y + 1.5, k.z, 9, CART_IXC.purple, 1.2, 1.5); }
};

/* ---- DUNE CHOMPER: SAND DIVE. 3 s under the playa (only the fin shows; untouchable, 25 % faster, no bumping),
   then it bursts out (early, the moment it is under a rival) and launches everyone within 6 m. ---- */
CART_ITEM_FX.dive = {
  use(s, k) {
    cartIxRec(s, 'dive', { owner: k, dur: 3.0, life: 3.0, dep: 0 });
    k.sunk = true; k.immuneT = 3.2; k.vmaxMin = 1.25; k.drift = 0; k.charge = 0;
    const v = k.player ? 0.9 : 0.35; Sound.play('dust', { vol: v }); Sound.play('splash', { vol: v * 0.5, pitch: 0.5 });
    if (s.fx) s.fx.dust(k.x, k.y + 0.3, k.z, 22, s.night ? '#8a7a7a' : '#d8b896');
  },
  aiWants(s, k) { return !k.air && (cartIxTargets(s, k, 35).length > 0 || k.ai.itemT < -2); },
  icon(ctx, s, col) { ctx.fillStyle = '#d8b896'; ctx.beginPath(); ctx.ellipse(0, s * 0.3, s * 0.52, s * 0.14, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.28, s * 0.28); ctx.quadraticCurveTo(-s * 0.05, -s * 0.15, s * 0.18, -s * 0.48); ctx.quadraticCurveTo(s * 0.12, -s * 0.05, s * 0.3, s * 0.28); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8995a'; for (const [x, y] of [[-0.42, 0.05], [0.42, 0.0], [0.5, 0.16]]) { ctx.beginPath(); ctx.arc(x * s, y * s, s * 0.05, 0, TAU); ctx.fill(); } }
};
CART_IX_KIND.dive = {
  update(s, r, dt) {
    const k = r.owner;
    if (k.out) { k.sunk = false; k.vmaxMin = 0; return false; }
    const deep = (k.M ? k.M.h : 2.5) * 0.74;
    r.dep = deep * Math.min(1, r.t / 0.3, Math.max(0, (r.dur - r.t) / 0.2));
    k.bob = -r.dep; k.y = s.terrain.height(k.x, k.z); k.air = false; k.vy = 0;
    if (s.fx && Math.random() < 0.9) { const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw); s.fx.add(k.x - fx * 1.2 + (Math.random() - 0.5), k.y + 0.3, k.z - fz * 1.2 + (Math.random() - 0.5), -fx * 3 + (Math.random() - 0.5) * 4, 2 + Math.random() * 2.5, -fz * 3 + (Math.random() - 0.5) * 4, 0.9, 0.6, 2.4, s.night ? CART_IXC.sandNight : CART_IXC.sand, 0.6, 'puff', 4, Math.random() * 6, 1); }
    // ambush: after 0.8 s under, it bursts out as soon as it is right under a rival
    if (r.t > 0.8 && r.t < r.dur - 0.2) for (const o of s.karts) { if (o !== k && !o.out && !o.air && Math.hypot(o.x - k.x, o.z - k.z) < 5) { r.dur = r.t + 0.1; break; } }
    if (r.t >= r.dur) {
      k.sunk = false; k.vmaxMin = 0; k.bob = 0; k.vy = 10; k.air = true; k.hop = true; k.immuneT = 0.4;
      cartIxBlast(s, k.x, k.y, k.z, 6.5, 'launch', k, 'dive', 6, 12, k);
      cartIxSound(s, 'cartChomp', k.x, k.z, 1, 1); cartIxSound(s, 'cartBoom', k.x, k.z, 0.6, 1.3);
      if (s.fx) { s.fx.dust(k.x, k.y + 0.3, k.z, 24, s.night ? '#8a7a7a' : '#d8b896'); for (let i = 0; i < 18; i++) { const a = Math.random() * TAU; s.fx.add(k.x, k.y + 0.5, k.z, Math.sin(a) * 6, 6 + Math.random() * 6, Math.cos(a) * 6, 0.9, 0.35, 0.3, CART_IXC.sandDark, 1, 'square', 2 | 4, Math.random() * 6, 6); } }
      cartIxRec(s, 'splash', { x: k.x, y: k.y, z: k.z, life: 0.6, R: 13, sand: true });
      if (k.player) s.shakeIt(0.6);
      return false;
    }
    return true;
  },
  sprites(s, R, r, S, t) { const k = r.owner; if (!k.sunk) return; const gy = s.terrain.height(k.x, k.z) + 0.08, C = CART_IXC; R.flat.flat(k.x, gy, k.z, 5, 7.5, k.yaw, S.puff, s.night ? C.sandNight : C.sandDark, 0.7, false); R.flat.flat(k.x, gy + 0.01, k.z, 7, 7, -t * 3, S.swirl, C.sand, 0.4, false); }
};

/* ---- PYRAMID SCHEME: PRISM WARP. Lifts into a beam of light, reappears 45 m up the road (arenas: 32 m ahead), and
   leaves a laser pyramid where it left: touch it and you are stunned (8 s). ---- */
CART_ITEM_FX.warp = {
  use(s, k) {
    const r = cartIxRec(s, 'warp', { owner: k, life: 1.4, jumped: false, x0: k.x, z0: k.z, y0: k.y, x1: k.x, z1: k.z }); r.f = cartFlyStart(s, k, 'warp', 1.15, 2.6, { up: 0.45, down: 0.5 });
    const v = k.player ? 0.9 : 0.35; Sound.play('portal', { vol: v }); Sound.play('laser', { vol: v * 0.6, pitch: 0.6 });
  },
  aiWants(s, k) { if (s.isRace && s.T) { const g = s.T.at(k.loc.s + 45, CART_IX_T.at2); return Math.abs(g.k) < 0.03 || k.ai.itemT < -2; } return k.ai.itemT < -2 || cartIxNear(s, k, 10); },
  icon(ctx, s, col) { ctx.fillStyle = '#2a2236'; ctx.beginPath(); ctx.moveTo(-s * 0.45, s * 0.38); ctx.lineTo(0, -s * 0.35); ctx.lineTo(s * 0.45, s * 0.38); ctx.closePath(); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.07; ctx.stroke(); ctx.globalAlpha *= 0.85; ctx.fillStyle = col; ctx.fillRect(-s * 0.06, -s * 0.62, s * 0.12, s * 0.3); ctx.beginPath(); ctx.arc(0, s * 0.12, s * 0.09, 0, TAU); ctx.fill(); }
};
CART_IX_KIND.warp = {
  update(s, r, dt) {
    const k = r.owner, f = k.fly;
    if (f && f === r.f) f.t += dt;
    if (!r.jumped && r.t >= 0.5 && !k.out) {
      r.jumped = true; r.x0 = k.x; r.z0 = k.z; r.y0 = s.terrain.height(k.x, k.z);
      const sp = Math.hypot(k.vx, k.vz);
      if (s.T && s.isRace) {
        const T = s.T, g = T.at((k.loc.s || 0) + 45, CART_IX_T.at), d = clamp(k.loc.d, -(g.hw - 2), g.hw - 2);
        k.x = g.x + g.nx * d; k.z = g.z + g.nz * d; k.yaw = g.yaw; T.locate(k.x, k.z, g.i, k.loc);
      } else { const p = CART_IX_T.spot2; p.x = k.x + Math.sin(k.yaw) * 32; p.z = k.z + Math.cos(k.yaw) * 32; cartIxInside(s, p, 5); k.x = p.x; k.z = p.z; if (s.TR) s.TR.locateGlobal(k.x, k.z, k.loc); }
      k.vx = Math.sin(k.yaw) * sp; k.vz = Math.cos(k.yaw) * sp; k.y = s.terrain.height(k.x, k.z) + 2.4;
      r.x1 = k.x; r.z1 = k.z;
      cartIxRec(s, 'prism', { owner: k, x: r.x0, z: r.z0, y: r.y0, life: 8, mask: 0 });
      cartIxFlash(s, r.x0, r.y0 + 3, r.z0, 16, CART_IXC.green, 2, 0.5); cartIxFlash(s, k.x, k.y + 2, k.z, 16, CART_IXC.green, 2, 0.5);
      cartIxSound(s, 'portal', k.x, k.z, 0.9, 1.4);
      if (s.fx) { s.fx.burst(r.x0, r.y0 + 2, r.z0, 'star', 16, '#3aff8a'); s.fx.burst(k.x, k.y + 1, k.z, 'star', 16, '#3aff8a'); }
      if (k.player) s.snapCam = true;
    }
    if (f && f === r.f && f.t >= f.dur) cartFlyEnd(s, k);
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const k = r.owner, C = CART_IXC;
    if (!r.jumped) { const a = clamp(r.t / 0.5, 0, 1); R.bbs.streak(k.x, k.y + 14, k.z, 0, 1, 0, 30, 2 + 3 * a, S.streak, C.green, 0.8 * a); R.bbs.bb(k.x, k.y + 2, k.z, 6 * a + 2, 6 * a + 2, S.glow, C.green, 0.6 * a, true); }
    else { const u = clamp((r.t - 0.5) / 0.8, 0, 1), a = 1 - u; R.bbs.streak(r.x0, r.y0 + 14, r.z0, 0, 1, 0, 30, 5 * a, S.streak, C.green, a); R.bbs.streak(r.x1, s.terrain.height(r.x1, r.z1) + 14, r.z1, 0, 1, 0, 30, 5 * a, S.streak, C.green, a); }
  }
};
CART_IX_KIND.prism = {
  update(s, r, dt) {
    const k = r.owner;
    for (const o of s.karts) { if (o === k || o.out || o.air || (r.mask & (1 << o.slot))) continue; if (Math.hypot(o.x - r.x, o.z - r.z) < 2.9) { r.mask |= 1 << o.slot; if (s.hit(o, 'stun', k, { item: 'warp' })) { cartIxSound(s, 'laser', o.x, o.z, 0.8, 1.6); if (s.fx) s.fx.spark(o.x, o.y + 1.5, o.z, 14, '#3aff8a', 6); } } }
    cartIxObs(s, r.x, r.z, 2.8);
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const C = CART_IXC, a = Math.min(1, r.t * 3, (r.life - r.t) * 2), y = r.y, h = 3.4, w = 2.2, P = CART_IX_T.a;
    R.flat.flat(r.x, y + 0.1, r.z, 7, 7, t, S.glow, C.green, 0.5 * a, true);
    for (let i = 0; i < 4; i++) {
      const ang = t * 0.8 + i * Math.PI / 2, cx = r.x + Math.sin(ang) * w, cz = r.z + Math.cos(ang) * w, nx = r.x + Math.sin(ang + Math.PI / 2) * w, nz = r.z + Math.cos(ang + Math.PI / 2) * w;
      let dx = r.x - cx, dy = h, dz = r.z - cz, l = Math.hypot(dx, dy, dz); R.bbs.streak((cx + r.x) / 2, y + h / 2, (cz + r.z) / 2, dx / l, dy / l, dz / l, l, 0.35, S.streak, C.green, a);
      dx = nx - cx; dz = nz - cz; l = Math.hypot(dx, dz); R.bbs.streak((cx + nx) / 2, y + 0.2, (cz + nz) / 2, dx / l, 0, dz / l, l, 0.35, S.streak, C.green, a);
    }
    void P;
    R.bbs.bb(r.x, y + h, r.z, 2.2, 2.2, S.core, C.green, a, true);
    R.bbs.bb(r.x, y + h * 0.45, r.z, 5, 5, S.glow, C.green, 0.35 * a, true);
  },
  lights(s, r, add) { add(r.x, r.y + 2, r.z, 8, CART_IXC.green, 1.0, 1.2); }
};

/* ---- FROSTED FURY: FROSTING FLOOD. Pipes a 10 m river of sticky frosting right across the road 30 m ahead
   (arenas: a 6.5 m puddle). Drive in: STUCK (2.4 s at 40 %), and slowed while you stay in. Hop it! 9.5 s. ---- */
CART_ITEM_FX.frosting = {
  use(s, k) {
    const p = cartIxAhead(s, k, 30, 0, CART_IX_T.spot), race = !!(s.T && s.isRace);
    cartIxRec(s, 'frost', { owner: k, race, s0: race ? (k.loc.s || 0) + 30 : 0, len: 10, x: p.x, z: p.z, y: s.terrain.height(p.x, p.z), yaw: p.yaw, hw: p.hw, r: 6.5, land: 0.55, life: 10, mask: 0, ox: k.x, oy: k.y + (k.M ? k.M.h : 3), oz: k.z });
    const v = k.player ? 0.9 : 0.35; Sound.play('throw', { vol: v, pitch: 1.2 }); Sound.play('cartSparkle', { vol: v * 0.6 });
  },
  aiWants(s, k) { const L = cartIxTargets(s, k, 70); for (const o of L) if (o._ixD > 18) return true; return k.ai.itemT < -4; },
  icon(ctx, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.1); for (let i = 0; i <= 6; i++) ctx.quadraticCurveTo(-s * 0.5 + (i - 0.5) * s / 6, -s * 0.35 + (i % 2) * s * 0.1, -s * 0.5 + i * s / 6, -s * 0.1); ctx.lineTo(s * 0.5, s * 0.1); for (let i = 6; i >= 0; i--) ctx.lineTo(-s * 0.5 + i * s / 6, s * 0.1 + (i % 2 ? s * 0.25 : 0)); ctx.closePath(); ctx.fill(); ctx.stroke(); for (let i = 0; i < 6; i++) { ctx.fillStyle = BURNS_NEON[i]; ctx.fillRect(-s * 0.4 + i * s * 0.15, -s * 0.05 + (i % 2) * s * 0.08, s * 0.07, s * 0.04); } }
};
CART_IX_KIND.frost = {
  update(s, r, dt) {
    if (r.t < r.land) return true;
    if (!r.splat) { r.splat = true; cartIxSound(s, 'splat', r.x, r.z, 0.9, 0.8); cartIxSound(s, 'splat', r.x, r.z, 0.6, 1.2); if (s.fx) s.fx.burst(r.x, r.y + 0.8, r.z, 'drop', 18, '#ff9ad8'); }
    const k = r.owner, T = s.T;
    for (const o of s.karts) {
      if (o === k || o.out || o.air) continue;
      let inside;
      if (r.race) { let ds = o.loc.s - r.s0; if (ds < -T.L / 2) ds += T.L; if (ds > T.L / 2) ds -= T.L; inside = Math.abs(ds) < r.len / 2 && Math.abs(o.loc.d) < r.hw + 2.5; }
      else inside = Math.hypot(o.x - r.x, o.z - r.z) < r.r;
      if (!inside) continue;
      if (!(r.mask & (1 << o.slot))) { r.mask |= 1 << o.slot; if (s.hit(o, 'goo', k, { item: 'frosting', dur: 2.4 })) cartIxSound(s, 'splat', o.x, o.z, 0.8, 1.0); }
      else if (o.gooT < 0.5) o.gooT = 0.5;
    }
    cartIxObs(s, r.x, r.z, r.race ? 3 : r.r * 0.8);
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const C = CART_IXC;
    if (r.t < r.land) { for (let i = 0; i < 6; i++) { const u = clamp((r.t - i * 0.05) / (r.land - 0.25), 0, 1); if (u <= 0) continue; const tx = r.x + Math.sin(i * 2.1) * 3, tz = r.z + Math.cos(i * 1.7) * 3, x = lerp(r.ox, tx, u), z = lerp(r.oz, tz, u), y = lerp(r.oy, r.y, u) + Math.sin(u * Math.PI) * 8; R.bbs.bb(x, y, z, 1.6, 1.6, S.dot, C.frosting, 1, false); } return; }
    const g = Math.min(1, (r.t - r.land) * 5), a = clamp((r.life - r.t) / 1.2, 0, 1);
    if (r.race) {
      const T = s.T, at = CART_IX_T.at2;
      for (let j = 0; j < 4; j++) { const sv = r.s0 - r.len / 2 + (j + 0.5) * r.len / 4; T.at(sv, at); const n = Math.ceil((at.hw + 2) * 2 / 3.2); for (let i = 0; i < n; i++) { const d = -at.hw - 1 + (i + 0.5) * (at.hw + 1) * 2 / n, x = at.x + at.nx * d, z = at.z + at.nz * d, gy = s.terrain.height(x, z) + 0.06, h = (i * 7 + j * 13) % 10; R.flat.flat(x, gy, z, 4.4 * g, 4.4 * g, h, S.splat, C.frosting, 0.97 * a, false); if (h < 5) R.flat.flat(x + Math.sin(h) * 0.9, gy + 0.02, z + Math.cos(h) * 0.9, 0.5, 0.18, h * 1.3, S.square, CART_IX_NEON[h % 6], a, false); } }
    } else {
      R.flat.flat(r.x, r.y + 0.06, r.z, r.r * 2.2 * g, r.r * 2.2 * g, 0.5, S.splat, C.frosting, 0.97 * a, false);
      for (let i = 0; i < 8; i++) { const ang = i * 0.785, d = r.r * 0.75; R.flat.flat(r.x + Math.sin(ang) * d, r.y + 0.07, r.z + Math.cos(ang) * d, 3.6 * g, 3.6 * g, i, S.splat, C.frosting, 0.97 * a, false); }
      for (let i = 0; i < 14; i++) { const ang = i * 2.39, d = (i % 5) * r.r * 0.18; R.flat.flat(r.x + Math.sin(ang) * d, r.y + 0.09, r.z + Math.cos(ang) * d, 0.5, 0.18, i * 1.3, S.square, CART_IX_NEON[i % 6], a, false); }
    }
  }
};

/* ---- DUSTY DOUBLOON: ROGUE WAVE. A wall of water rolls up the course ahead at 38 m/s for 2.9 s; every car it catches
   on the ground is wiped out (knocked toward the side, spinning). The galleon surfs a boost behind it. ---- */
CART_ITEM_FX.wave = {
  use(s, k) {
    const race = !!(s.T && s.isRace);
    cartIxRec(s, 'wave', { owner: k, race, s: (k.loc.s || 0) + 5, x: k.x + Math.sin(k.yaw) * 5, z: k.z + Math.cos(k.yaw) * 5, yaw: k.yaw, hw: 14, life: 2.9, mask: 0, spd: 38 });
    s.boost(k, 1.4, 'surf');
    const v = k.player ? 0.95 : 0.35; Sound.play('splash', { vol: v, pitch: 0.45 }); Sound.play('wind', { vol: v * 0.6, pitch: 0.6 });
    if (k.player) s.shakeIt(0.3);
  },
  aiWants(s, k) { return cartIxTargets(s, k, s.isRace ? 95 : 55).length > 0 || k.ai.itemT < -4; },
  icon(ctx, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.55, s * 0.4); ctx.quadraticCurveTo(-s * 0.4, -s * 0.5, s * 0.2, -s * 0.45); ctx.quadraticCurveTo(s * 0.5, -s * 0.4, s * 0.45, -s * 0.12); ctx.quadraticCurveTo(s * 0.2, -s * 0.3, s * 0.05, -s * 0.05); ctx.quadraticCurveTo(s * 0.0, s * 0.25, s * 0.55, s * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; for (const [x, y] of [[0.3, -0.42], [0.45, -0.3], [0.12, -0.5]]) { ctx.beginPath(); ctx.arc(x * s, y * s, s * 0.06, 0, TAU); ctx.fill(); } }
};
CART_IX_KIND.wave = {
  update(s, r, dt) {
    const k = r.owner;
    let tx, tz, nx, nz;
    if (r.race) { r.s += r.spd * dt; const g = s.T.at(r.s, CART_IX_T.at2); r.x = g.x; r.z = g.z; r.yaw = g.yaw; r.hw = g.hw + 1.5; tx = g.tx; tz = g.tz; nx = g.nx; nz = g.nz; }
    else { tx = Math.sin(r.yaw); tz = Math.cos(r.yaw); nx = -tz; nz = tx; r.x += tx * r.spd * dt; r.z += tz * r.spd * dt; if (s.E.walls && s.wallDist(r.x, r.z, CART_IX_T.wd).d < 2) r.life = Math.min(r.life, r.t + 0.3); }
    r.y = s.terrain.height(r.x, r.z);
    if (r.t < r.life - 0.3) for (const o of s.karts) {
      if (o === k || o.out || (r.mask & (1 << o.slot)) || o.y > s.terrain.height(o.x, o.z) + 3) continue;
      const dx = o.x - r.x, dz = o.z - r.z, along = dx * tx + dz * tz, lat = dx * nx + dz * nz;
      if (along > -3.5 && along < 2.5 && Math.abs(lat) < r.hw) {
        r.mask |= 1 << o.slot; const sd = lat >= 0 ? 1 : -1;
        if (s.hit(o, 'knock', k, { item: 'wave', dx: tx * 0.55 + nx * sd * 0.85, dz: tz * 0.55 + nz * sd * 0.85, power: 13, dur: 1.4 })) { cartIxSound(s, 'splash', o.x, o.z, 0.9, 0.8); if (s.fx) s.fx.burst(o.x, o.y + 1.5, o.z, 'drop', 14, '#bfe8ff'); }
      }
    }
    if (s.fx) for (let i = 0; i < 4; i++) { const l = (Math.random() * 2 - 1) * r.hw; s.fx.add(r.x + nx * l, r.y + 3.5, r.z + nz * l, tx * r.spd * 0.8 + (Math.random() - 0.5) * 3, 4 + Math.random() * 4, tz * r.spd * 0.8 + (Math.random() - 0.5) * 3, 0.7, 0.9, 0.4, CART_IXC.white, 0.9, 'drop', 2); }
    return r.t < r.life;
  },
  sprites(s, R, r, S, t) {
    const C = CART_IXC, tx = Math.sin(r.yaw), tz = Math.cos(r.yaw), nx = -tz, nz = tx, hgt = 5.5 * Math.min(1, r.t / 0.3, (r.life - r.t) / 0.4), n = Math.max(6, Math.ceil(r.hw * 2 / 2.8));
    if (hgt <= 0) return;
    for (let i = 0; i < n; i++) {
      const l = -r.hw + (i + 0.5) * r.hw * 2 / n, x = r.x + nx * l, z = r.z + nz * l, gy = s.terrain.height(x, z), wob = Math.sin(t * 6 + i * 1.3) * 0.3;
      R.bbs.bb(x - tx * 1.2, gy + hgt * 0.45, z - tz * 1.2, 6.2, hgt * 1.5, S.puff, C.waterDeep, 0.95, false, i * 0.7);
      R.bbs.bb(x - tx * 0.6, gy + hgt * 0.5, z - tz * 0.6, 5.2, hgt * 1.2, S.smoke, C.waterDeep, 0.95, false);
      R.bbs.bb(x, gy + hgt * 0.62 + wob, z, 4.8, hgt * 1.0, S.puff, C.water, 0.95, false);
      R.bbs.bb(x + tx * 0.4, gy + hgt + wob, z + tz * 0.4, 3.8, 2.6, S.foam, C.foam, 0.98, false, i);
    }
    R.flat.flat(r.x - tx * 5, r.y + 0.1, r.z - tz * 5, r.hw * 2, 10, r.yaw, S.glow, C.waterDeep, 0.5, true);
  },
  lights(s, r, add) { add(r.x, r.y + 3, r.z, 14, CART_IXC.water, 0.8, 1.2); }
};

/* ---- QUACKZILLA: BUBBLE BATH SURF. 4.2 s on a wave of bath foam: 32 % over top speed, rivals in front are bowled
   aside, and a trail of foam puddles slicks whoever follows. ---- */
CART_ITEM_FX.surf = {
  use(s, k) {
    cartIxRec(s, 'surf', { owner: k, life: 4.2, dropT: 0, mask: 0, mask2: 0, pud: [], n: 0 });
    k.vmaxMin = 1.32; s.boost(k, 0.8, 'surf');
    const v = k.player ? 0.9 : 0.35; Sound.play('cartBubble', { vol: v }); Sound.play('splash', { vol: v * 0.7, pitch: 0.8 }); Sound.play('cartQuack', { vol: v * 0.7, pitch: 0.9 });
  },
  aiWants(s, k) { return !k.air && (cartIxTargets(s, k, 25).length > 0 || (s.isRace && k.rank > 3) || k.ai.itemT < -2); },
  icon(ctx, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.55, s * 0.35); ctx.quadraticCurveTo(-s * 0.2, -s * 0.15, s * 0.5, s * 0.05); ctx.lineTo(s * 0.55, s * 0.35); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffd21a'; ctx.beginPath(); ctx.ellipse(-s * 0.05, -s * 0.08, s * 0.24, s * 0.14, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(s * 0.12, -s * 0.28, s * 0.12, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff7a1a'; ctx.fillRect(s * 0.22, -s * 0.3, s * 0.12, s * 0.06); ctx.fillStyle = '#ffffff'; for (const [x, y] of [[-0.45, 0.15], [-0.3, -0.25], [0.35, -0.1]]) { ctx.beginPath(); ctx.arc(x * s, y * s, s * 0.07, 0, TAU); ctx.fill(); ctx.stroke(); } }
};
CART_IX_KIND.surf = {
  update(s, r, dt) {
    const k = r.owner, fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    if (!r.ended && (k.out || r.t >= r.life)) { r.ended = true; k.vmaxMin = 0; }
    if (r.ended) { cartIxSurfPuddles(s, r); return r.t < r.life + 3.5 && !k.out; }   // the trail outlives the ride
    for (const o of s.karts) {
      if (o === k || o.out || (r.mask & (1 << o.slot))) continue;
      const dx = o.x - k.x, dz = o.z - k.z, along = dx * fx + dz * fz, side = dx * fz - dz * fx;
      if (along > 0.5 && along < 5 && Math.abs(side) < 2.9 && Math.abs(o.y - k.y) < 3.5) { r.mask |= 1 << o.slot; const sd = side >= 0 ? -1 : 1; if (s.hit(o, 'knock', k, { item: 'surf', dx: -fz * sd * 0.9 + fx * 0.4, dz: fx * sd * 0.9 + fz * 0.4, power: 14 })) { cartIxSound(s, 'splash', o.x, o.z, 0.8, 1.1); if (s.fx) s.fx.burst(o.x, o.y + 1, o.z, 'bubble', 10, '#ffffff'); } }
    }
    r.dropT -= dt;
    if (r.dropT <= 0 && !k.air) { r.dropT = 0.22; const P = cartCarPoint(k, 0, 0, -(k.M ? k.M.len / 2 : 2), CART_IX_T.a); if (r.pud.length < 20) r.pud.push({ x: P[0], z: P[2], t: 0 }); else { const q = r.pud[r.n++ % 20]; q.x = P[0]; q.z = P[2]; q.t = 0; } }
    cartIxSurfPuddles(s, r);
    if (s.fx) { const P = cartCarPoint(k, (Math.random() - 0.5) * 2.4, 0.4, (k.M ? k.M.len / 2 : 2) + 0.6, CART_IX_T.a); s.fx.add(P[0], P[1], P[2], k.vx * 0.7 + (Math.random() - 0.5) * 4, 2 + Math.random() * 3, k.vz * 0.7 + (Math.random() - 0.5) * 4, 0.6, 0.8, 1.6, CART_IXC.foam, 0.9, 'foam', 4, Math.random() * 6, 1); if (Math.random() < 0.5) s.fx.add(k.x + (Math.random() - 0.5) * 3, k.y + 1 + Math.random() * 2, k.z + (Math.random() - 0.5) * 3, 0, 1.5, 0, 1.2, 0.4, 0.8, CART_IXC.bubble, 0.8, 'bubble', 4 | 32); }
    if (k.player && Math.random() < dt * 3) Sound.play('cartBubble', { vol: 0.3, pitch: 0.8 + Math.random() * 0.5 });
    return true;
  },
  sprites(s, R, r, S, t) {
    const k = r.owner, C = CART_IXC, P = CART_IX_T.a;
    for (const q of r.pud) { const a = clamp((3.5 - q.t) / 1, 0, 1); if (a <= 0) continue; R.flat.flat(q.x, s.terrain.height(q.x, q.z) + 0.07, q.z, 4.2, 4.2, q.x * 3, S.foam, C.foam, 0.9 * a, false); }
    if (r.ended) return;
    const len = k.M ? k.M.len / 2 : 2;
    for (let i = 0; i < 5; i++) { cartCarPoint(k, (i - 2) * 0.9, 0.5 + Math.sin(t * 9 + i) * 0.2, len + 0.5 - Math.abs(i - 2) * 0.5, P); R.bbs.bb(P[0], P[1], P[2], 2.6, 2.2, S.foam, C.foam, 0.98, false, i + t); }
    R.flat.flat(k.x, s.terrain.height(k.x, k.z) + 0.08, k.z, (k.M ? k.M.w : 2.5) + 3, len * 2 + 4, k.yaw, S.foam, C.foam, 0.95, false);
  }
};
// the foam trail: puddles slick (no hit) whoever drives through, for 3.5 s each
function cartIxSurfPuddles(s, r) {
  const k = r.owner;
  for (const q of r.pud) { q.t += s.ix.dt; if (q.t > 3.5) continue; for (const o of s.karts) { if (o === k || o.out || o.air) continue; if (Math.hypot(o.x - q.x, o.z - q.z) < 2.3) { o.foamT = Math.max(o.foamT, 1.1); if (!(r.mask2 & (1 << o.slot))) { r.mask2 |= 1 << o.slot; s.log('hit', { k: o.id, by: k.id, kind: 'foam', item: 'surf', pool: true }); if (o.player) s.banner('FOAM!', '#f4f8ff', 0.8, null, true); } } } }
}

/* ============ what the scene calls ============ */
// every sim step (after the cars, shots and hazards)
function cartItemsUpdate(s, dt, racing) {
  const ix = s.ix; if (!ix) return;
  ix.dt = dt; ix.obs.n = 0;
  for (const f of ix.flashes) if (f.t > 0) f.t -= dt;
  for (const b of ix.bolts) if (b.t > 0) b.t -= dt;
  cartIxDucks(s, dt);
  const L = ix.list; let w = 0;
  for (let i = 0; i < L.length; i++) { const r = L[i]; r.t += dt; if (CART_IX_KIND[r.type].update(s, r, dt) !== false) L[w++] = r; }
  L.length = w;
  // what the item hits leave on a car: whirled cars trail dust, blasted ones smoke
  for (const k of s.karts) {
    if (k.whirlT > 0) { k.whirlT -= dt; if (s.fx && Math.random() < 0.6) { const a = Math.random() * TAU; s.fx.add(k.x + Math.sin(a) * 2.2, k.y + Math.random() * 2, k.z + Math.cos(a) * 2.2, Math.cos(a) * 7, 1, -Math.sin(a) * 7, 0.5, 0.8, 1.6, CART_IXC.sand, 0.6, 'puff', 4); } }
    if (k.whistleT > 0) k.whistleT -= dt;
    if (k.smokeT > 0) { k.smokeT -= dt; if (s.fx && Math.random() < 0.5) s.fx.add(k.x, k.y + 1.2, k.z, 0, 1, 0, 1.2, 0.8, 2.4, CART_IXC.smoke, 0.5, 'smoke', 4); }
  }
}
// main pass: the pooled meshes (only groups with something live are drawn)
function cartItemsRender(s, R) {
  const ix = s.ix; if (!ix) return;
  for (const G of ix.groups) {
    let live = 0;
    for (const o of G.objs) { if (o.live && o.visible) live++; else o.visible = false; }
    if (!live) continue;
    G.pose(null); R.skin(G.geo, G.bones, G.objs.length, null, 0, 0.5);
  }
}
// sprites: every live effect, the ducks' shadows, lightning, and the look of a car under an item's spell
function cartItemsSprites(s, R, S, t) {
  const ix = s.ix; if (!ix) return; const C = CART_IXC, P = CART_IX_T.b;
  for (const r of ix.list) { const K = CART_IX_KIND[r.type]; if (K.sprites) K.sprites(s, R, r, S, t); }
  for (const d of ix.ducks) if (d.live && d.visible) { const gh = s.terrain.height(d.gx, d.gz), h = d.gy - gh; R.flat.flat(d.gx, gh + 0.04, d.gz, 1.3 + h * 0.03, 1.6 + h * 0.03, d.yaw0, S.shadow, C.black, 0.55 * clamp(1 - h * 0.04, 0.2, 1), false); }
  for (const b of ix.bolts) {
    if (b.t <= 0 || !b.a) continue;
    const a = b.a, x0 = a.x, y0 = a.y + 0.6, z0 = a.z, x1 = b.b ? b.b.x : b.bx, y1 = b.b ? b.b.y + 1.3 : s.terrain.height(b.bx, b.bz), z1 = b.b ? b.b.z : b.bz;
    let px = x0, py = y0, pz = z0; const n = 7, al = Math.min(1, b.t * 5), w = b.b ? 0.55 : 0.3;
    for (let i = 1; i <= n; i++) { const u = i / n, j = i < n ? 1 : 0, x = lerp(x0, x1, u) + (Math.random() - 0.5) * 1.6 * j, y = lerp(y0, y1, u) + (Math.random() - 0.5) * 1.2 * j, z = lerp(z0, z1, u) + (Math.random() - 0.5) * 1.6 * j, dx = x - px, dy = y - py, dz = z - pz, l = Math.hypot(dx, dy, dz) || 1; R.bbs.streak((x + px) / 2, (y + py) / 2, (z + pz) / 2, dx / l, dy / l, dz / l, l * 1.1, w * 2.6, S.streak, C.cyan, al); R.bbs.streak((x + px) / 2, (y + py) / 2, (z + pz) / 2, dx / l, dy / l, dz / l, l * 1.1, w, S.streak, C.white, al); px = x; py = y; pz = z; }
    if (b.b) R.bbs.bb(x1, y1, z1, 4, 4, S.glow, C.cyan, 0.9 * al, true);
  }
  for (const k of s.karts) {
    if (!k._in || k.out) continue;
    const top = k.y + (k.M ? k.M.h : 2.5);
    if (k.foamT > 0) { const a = Math.min(1, k.foamT * 1.5), w = k.M ? k.M.w * 0.42 : 1, l = k.M ? k.M.len * 0.4 : 1.5; for (let i = 0; i < 6; i++) { const sx = i % 2 ? 1 : -1, sz = i < 2 ? 1 : i < 4 ? 0 : -1; cartCarPoint(k, sx * w, 0.9 + (i % 3) * 0.35, sz * l, P); R.bbs.bb(P[0], P[1], P[2], 2.6, 2.3, S.foam, C.foam, 0.95 * a, false, i + Math.sin(t * 3 + i) * 0.3); } R.bbs.bb(k.x, top - 0.2, k.z, 3, 2.4, S.foam, C.foam, 0.95 * a, false, t); }
    if (k.charmT > 0) { const a = Math.min(1, k.charmT * 2); for (let i = 0; i < 3; i++) { const ang = t * 3 + i * TAU / 3; R.bbs.bb(k.x + Math.sin(ang) * 1.3, top + 0.8 + Math.sin(t * 6 + i) * 0.2, k.z + Math.cos(ang) * 1.3, 1.1, 1.1, S.heart, C.pink, a, true); } R.flat.flat(k.x, s.terrain.height(k.x, k.z) + 0.06, k.z, 6, 6, 0, S.glow, C.pink, 0.45 * a, true); }
    if (k.whistleT > 0) { const a = Math.min(1, k.whistleT * 2), bl = Math.floor(t * 6) % 2; R.bbs.bb(k.x, top + 1.6, k.z, 2.2, 2.2, S.dot, bl ? C.red : C.redHot, a, false); R.bbs.bb(k.x, top + 1.6, k.z, 1.4, 0.4, S.square, C.white, a, false); R.bbs.bb(k.x, top + 1.6, k.z, 3.2, 3.2, S.glow, C.red, 0.4 * a, true); }
    if (k.gooT > 0) { const a = Math.min(1, k.gooT * 2), gy = s.terrain.height(k.x, k.z) + 0.07; R.flat.flat(k.x, gy, k.z, (k.M ? k.M.w : 2.5) + 2.5, (k.M ? k.M.len : 4) + 2, k.yaw, S.splat, C.frosting, 0.97 * a, false); for (let i = 0; i < 4; i++) { cartCarPoint(k, (i % 2 ? 1 : -1) * 1.1, 0.5 + Math.sin(t * 2 + i) * 0.1, (i < 2 ? 1 : -1) * 1.2, P); R.bbs.bb(P[0], P[1], P[2], 1.3, 1.6, S.drop, C.frosting, 0.95 * a, false, Math.PI); } }
  }
}
function cartItemsLights(s, add) {
  const ix = s.ix; if (!ix) return;
  for (const r of ix.list) { const K = CART_IX_KIND[r.type]; if (K.lights) K.lights(s, r, add); }
  for (const f of ix.flashes) if (f.t > 0) add(f.x, f.y, f.z, f.r, f.c, f.i * Math.min(1, f.t * 4), 3);
}
// the player's side: incoming warnings, being foamed / lovestruck / frosted, and the meter of a flight or ride
const CART_IX_RIDES = { glide: 'DRAGON FLIGHT', breach: 'SKY BREACH', hover: 'STORM HOVER', shell: 'SHELL BOUNCE', warp: 'PRISM WARP', dive: 'SAND DIVE', surf: 'BUBBLE BATH SURF' };
function cartItemsHud(s, ctx, W, H) {
  const ix = s.ix, p = s.player; if (!ix || !p || s.state !== 'race') return;
  const t = s.time;
  for (const r of ix.list) { const K = CART_IX_KIND[r.type]; if (K.hud) K.hud(s, ctx, W, H, r); }   // an effect's own 2D layer (speech bubbles, signs: 43_cart_j_drivers.js)
  if (p.foamT > 0) { const a = Math.min(1, p.foamT); ctx.save(); for (let i = 0; i < 18; i++) { const x = (i + 0.5) / 18 * W + Math.sin(i * 3.1) * 18, y = H - Math.abs(Math.sin(i * 1.7 + 0.4)) * 46 * a - 4, r = 18 + (i * 7) % 14; const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r); g.addColorStop(0, 'rgba(255,255,255,' + (0.95 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(210,222,240,' + (0.85 * a).toFixed(3) + ')'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); } for (let i = 0; i < 6; i++) { const x = i < 3 ? 10 + i * 22 : W - 10 - (i - 3) * 22, y = 20 + (i % 3) * 16; ctx.fillStyle = 'rgba(255,255,255,' + (0.8 * a).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x, y, 14 - (i % 3) * 3, 0, TAU); ctx.fill(); } ctx.restore(); }
  if (p.charmT > 0) { const a = Math.min(1, p.charmT); ctx.save(); const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7); g.addColorStop(0, 'rgba(255,80,160,0)'); g.addColorStop(1, 'rgba(255,80,160,' + (0.45 * a).toFixed(3) + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); for (let i = 0; i < 8; i++) { const x = (i % 2 ? W - 40 : 40) + Math.sin(t * 2 + i) * 14, y = ((t * 30 + i * 70) % (H + 40)) - 20; cartHeartIcon(ctx, x, H - y, 10 + (i % 3) * 3, 'rgba(255,90,170,' + (0.8 * a).toFixed(3) + ')'); } ctx.restore(); }
  if (p.gooT > 0) { const a = Math.min(1, p.gooT * 1.5); ctx.save(); ctx.fillStyle = 'rgba(255,150,210,' + (0.9 * a).toFixed(3) + ')'; ctx.fillRect(0, 0, W, 10); for (let i = 0; i < 14; i++) { const x = (i + 0.3) / 14 * W, h = 20 + ((i * 37) % 50) * a + Math.sin(t * 2 + i) * 6; ctx.fillRect(x - 7, 0, 14, h); ctx.beginPath(); ctx.arc(x, h, 9, 0, TAU); ctx.fill(); } ctx.restore(); }
  // incoming: a missile is locked on the player
  let inc = false; for (const r of ix.list) if (r.type === 'missile' && r.tgt === p && !r.done && r.t > -0.3) { inc = true; break; }
  if (inc) { const pulse = 0.5 + 0.5 * Math.sin(t * 18); ctx.save(); ctx.strokeStyle = 'rgba(255,40,30,' + (0.5 + 0.4 * pulse).toFixed(3) + ')'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, W - 10, H - 10); ctx.restore(); BurnsUI.text(ctx, '▼ INCOMING ▼', W / 2, H * 0.14, 20 + pulse * 3, '#ff4a3a', { glow: '#ff0000' }); BurnsUI.text(ctx, 'SWERVE!', W / 2, H * 0.14 + 24, 12, '#ffffff', { ui: true }); }
  // a ride's meter (bottom centre, clear of the controls)
  let kind = null, frac = 0;
  if (p.fly && CART_IX_RIDES[p.fly.kind]) { kind = p.fly.kind; frac = 1 - p.fly.t / p.fly.dur; }
  else for (const r of ix.list) if (r.owner === p && (r.type === 'dive' || (r.type === 'surf' && !r.ended))) { kind = r.type; frac = 1 - r.t / (r.type === 'dive' ? r.dur : r.life); break; }
  if (kind && CART_IX_RIDES[kind]) {
    const col = CART_ITEMS[CART_SPECIALS[p.car.id] ? CART_SPECIALS[p.car.id].id : 'glow'].col, bw = Math.min(200, W * 0.4), x = W / 2 - bw / 2, y = H - Math.max(30, insets.b + 26);
    ctx.save(); ctx.fillStyle = 'rgba(10,4,20,0.6)'; burnsRR(ctx, x - 4, y - 20, bw + 8, 30, 10); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.15)'; burnsRR(ctx, x, y - 2, bw, 8, 4); ctx.fill(); ctx.fillStyle = col; burnsRR(ctx, x, y - 2, Math.max(8, bw * clamp(frac, 0, 1)), 8, 4); ctx.fill(); ctx.restore();
    BurnsUI.text(ctx, CART_IX_RIDES[kind], W / 2, y - 10, 11, col, { ui: true });
  }
}

/* ---------------- test API: window.BRADY_CART.debug gets item helpers (tools/cart_item_test.js) ---------------- */
if (typeof window !== 'undefined') setTimeout(() => {
  const C = window.BRADY_CART; if (!C || !C.debug) return;
  Object.assign(C.debug, {
    // a spot `ds` metres up the course from the player (lat: −1…1 of the road half-width; arenas: ×8 m to the side)
    spot(ds, lat) { const s = Game.scene, p = cartIxAhead(s, s.player, ds, lat || 0, {}); return { x: +p.x.toFixed(2), z: +p.z.toFixed(2), yaw: +p.yaw.toFixed(3) }; },
    // put rival i there (o: { speed, frozen } as in place())
    placeRel(i, ds, lat, o) { const p = this.spot(ds, lat); return this.place(i, p.x, p.z, p.yaw, o); },
    // n fixed sim steps; with draw = m, also render every m-th step on a fixed clock (particles age as in play)
    step(n, draw) { const s = Game.scene; for (let i = 0; i < n; i++) { s.update(STEP); if (draw && (i % draw === draw - 1 || i === n - 1)) { s.lastFrame = performance.now() - STEP * 1000 * draw; this.frame(); } } return s.state; },
    // the same in seconds of game time (the sim's fixed STEP), rendering `fps` frames per second
    run(secs, fps) { const n = Math.max(1, Math.round(secs / STEP)), d = fps ? Math.max(1, Math.round(1 / (fps * STEP))) : 0; return this.step(n, d); },
    // everything an item can do to a car
    kart(i) {
      const s = Game.scene, k = i < 0 || i === undefined ? s.player : s.karts[i], gh = s.terrain.height(k.x, k.z);
      return { id: k.id, car: k.car.id, x: +k.x.toFixed(2), z: +k.z.toFixed(2), y: +k.y.toFixed(2), h: +(k.y - gh).toFixed(2), speed: +k.speed.toFixed(2), prog: +(k.prog || 0).toFixed(1), item: k.item,
        spinT: +k.spinT.toFixed(2), flipT: +k.flipT.toFixed(2), foamT: +k.foamT.toFixed(2), charmT: +(k.charmT || 0).toFixed(2), gooT: +(k.gooT || 0).toFixed(2), stunT: +k.stunT.toFixed(2), dazzleT: +k.dazzleT.toFixed(2), slowT: +k.slowT.toFixed(2), bubbleT: +k.bubbleT.toFixed(2), shieldT: +k.shieldT.toFixed(2), boostT: +k.boostT.toFixed(2), invT: +k.invT.toFixed(2), immuneT: +(k.immuneT || 0).toFixed(2),
        fly: k.fly ? k.fly.kind : null, sunk: !!k.sunk, carry: !!k.carry, guard: !!k.guard, air: k.air, out: k.out, vibes: k.vibes, hitsTaken: k.hitsTaken, score: +(k.score || 0).toFixed(1), slot: k.slot };
    },
    karts() { return Game.scene.karts.map((k, i) => this.kart(i)); },
    ix() { const s = Game.scene, ix = s.ix; return ix ? { list: ix.list.map(r => r.type), ducks: ix.ducks.filter(d => d.live).length, ducksDown: ix.ducks.filter(d => d.live && d.visible && d.rest).length, obs: ix.obs.n, groups: ix.groups.length, groupTris: ix.groups.map(G => G.geo ? G.geo.count / 3 : 0) } : null; },
    giveTo(i, item) { const k = Game.scene.karts[i]; k.item = item; k.roul = 0; return item; },
    useItemFor(i) { const s = Game.scene, k = s.karts[i]; if (!k.item) return false; s.useItem(k); return true; },
    // would the AI in car i use `item` right now?
    aiWants(i, item) { const s = Game.scene, k = s.karts[i]; const keep = k.item; k.item = item; if (!k.ai) k.ai = { itemT: 0 }; const r = !!s.aiWantsItem(k); k.item = keep; return r; },
    sheet() { return { url: BURNS_SPRITES.canvas.toDataURL(), R: BURNS_SPRITES.R }; },
    specials() { const o = {}; for (const c in CART_SPECIALS) o[c] = CART_SPECIALS[c].id; return o; }
  });
}, 0);
