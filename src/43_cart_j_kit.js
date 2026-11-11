/* ============================================================
   ART CART — the level kit (C3, Nov 11 2026): the shared plumbing for the
   career tracks (one per car), so each track file only holds its own
   layout, look, obstacles and enemies. Love Parade (43_cart_j_loveparade.js)
   is the worked example; docs/ART_CART_LEVEL_RECIPE.md is the recipe.
   How a career track plugs in:
     CART_TRACKS[id] = { name, car, tod, music, width, shoulder, pts, blurb, world(id, D) -> E }
       (CartWorlds.track hands the whole build to D.world; the course itself is a CartTrack built from D.pts)
     CART_TRACK_RULES[id] = { onLoad(s), onUpdate(s, dt, racing), onStep(s, k, dt, racing) (after the AI chose its
       inputs, before the car moves: the place to brake / hop for a hazard), draw(s, R, S, t), lights(s, add),
       hud(s, ctx, W, H, top, left), onHit(s, k, kind, src, o) }   (the same hooks the battle arenas use)
     CART_CAREER_TRACKS[carId] = id   (C1's career flow; D.car names the level's car: its signature special joins
       everyone's gift boxes there, cartTrackPoolCar)
   Everything here is cheap by design: one pooled mesh group per level (one draw call), sprites for the effects,
   static scenery merged into the world's chunks, repeated props instanced with distance detail.
   ============================================================ */
// registries (one bundle scope: assign, never redeclare with const / let)
var CART_TRACK_RULES = (typeof CART_TRACK_RULES !== 'undefined' && CART_TRACK_RULES) || {};
var CART_CAREER_TRACKS = (typeof CART_CAREER_TRACKS !== 'undefined' && CART_CAREER_TRACKS) || {};
// the car whose signature special joins everyone's gift boxes on this track (only tracks that name their car)
function cartTrackPoolCar(id) { const D = CART_TRACKS[id]; return D && D.car && CART_SPECIALS[D.car] ? D.car : null; }

const CART_KIT_T = { at: {}, at2: {}, loc: { i: 0, s: 0, d: 0 }, p: { x: 0, z: 0 } };
const CartKit = {
  /* ---------- the course ---------- */
  // a closed course from a corner polygon [x, z, cornerRadius]: filleted corners, long straights split every `step`
  // metres (so the width can change along them), rotated so the start line sits at fraction `start` of the straight
  // that leaves corner `startEdge`; width(x, z) -> width scale at that point
  course(poly, o) {
    o = o || {};
    const f = cartFillet(poly, o.r || 30), step = o.step || 18, pts = [];
    for (let i = 0; i < f.length; i++) {
      const a = f[i], b = f[(i + 1) % f.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.floor(L / step));
      for (let k = 0; k < n; k++) pts.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
    }
    // start: the point nearest o.start ([x, z])
    let si = 0, bd = 1e18; if (o.start) for (let i = 0; i < pts.length; i++) { const d = (pts[i][0] - o.start[0]) ** 2 + (pts[i][1] - o.start[1]) ** 2; if (d < bd) { bd = d; si = i; } }
    const out = pts.slice(si).concat(pts.slice(0, si));
    return out.map(p => [p[0], p[1], o.width ? o.width(p[0], p[1]) : 1]);
  },
  // signed course distance from a to b (arc length, wrapped to ±L/2)
  ds(T, a, b) { let d = b - a; if (d < -T.L / 2) d += T.L; if (d > T.L / 2) d -= T.L; return d; },
  // a point on the course at arc length s, lateral d (+ right of travel)
  at(T, s, d, out) { const g = T.at(s, CART_KIT_T.at); out = out || {}; out.x = g.x + g.nx * d; out.z = g.z + g.nz * d; out.yaw = g.yaw; out.hw = g.hw; out.nx = g.nx; out.nz = g.nz; out.tx = g.tx; out.tz = g.tz; out.wl = g.wl; out.wr = g.wr; out.k = g.k; out.s = s; return out; },
  // arc length of the course point nearest (x, z)
  sOf(T, x, z) { return T.locateGlobal(x, z, CART_KIT_T.loc).s; },

  /* ---------- the world ---------- */
  // the base world for a career track: E (as CartWorlds.track makes it), the course, the sky, the painted road.
  // o: { id (world id number), ground, crack, sky (palette object), night, road: { band, edge, edgeW, center, centerDash, shoulder } }
  world(id, D, o) {
    o = o || {};
    const T = new CartTrack(D), rng = mulberry32(hashStr(id)), pad = 80, b = T.bounds;
    const E = CartWorlds.base(o.worldId || 1200, [b.x0 - pad, b.z0 - pad, b.x1 + pad, b.z1 + pad], o.ground || '#c9a27e', o.crack);
    Object.assign(E, { id, def: D, track: T, sky: o.sky || CART_SKIES[D.tod](), tod: D.tod, music: D.music, night: !!o.night, storm: false, fireworks: false });
    this.paintRoad(E, T, o.road || {});
    return { E, T, api: E.api, rng };
  },
  // the painted road: shoulder band, the road band, edge lines, a centre line (dashes or a custom stamp), the start
  // checker and the grid boxes. r: colours (css strings) + centerFn(ctx, P, S, T) for a custom centre pattern
  paintRoad(E, T, r) {
    E.api.paint((ctx, P, S) => {
      const path = off => { ctx.beginPath(); for (let i = 0; i <= T.N; i += 2) { const k = i % T.N, q = P(T.X[k] + T.NX[k] * off * T.HW[k], T.Z[k] + T.NZ[k] * off * T.HW[k]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } ctx.closePath(); };
      // a band of varying width: stroke short segments (the road narrows and widens along the lap)
      const band = (col, extra) => { ctx.strokeStyle = col; ctx.lineCap = 'round'; for (let i = 0; i < T.N; i += 2) { const j = (i + 2) % T.N, p = P(T.X[i], T.Z[i]), q = P(T.X[j], T.Z[j]); ctx.lineWidth = (T.HW[i] * 2 + extra) * S; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); } };
      ctx.lineJoin = 'round';
      band(r.shoulder || 'rgba(120,88,64,0.28)', 9);
      band(r.band || 'rgba(156,120,92,0.55)', 0);
      if (r.centerFn) r.centerFn(ctx, P, S, T);
      else { ctx.setLineDash([4 * S, 5 * S]); ctx.strokeStyle = r.center || 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.35 * S; path(0); ctx.stroke(); ctx.setLineDash([]); }
      ctx.strokeStyle = r.edge || 'rgba(255,255,255,0.55)'; ctx.lineWidth = (r.edgeW || 0.5) * S;
      for (const sd of [1, -1]) { ctx.beginPath(); for (let i = 0; i <= T.N; i += 2) { const k = i % T.N, off = sd * (T.HW[k] - 0.4), q = P(T.X[k] + T.NX[k] * off, T.Z[k] + T.NZ[k] * off); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } ctx.closePath(); ctx.stroke(); }
      const a = T.at(0, {}), sq = 1.2;
      for (let i = -Math.ceil(a.hw / sq); i < Math.ceil(a.hw / sq); i++) for (let rr = 0; rr < 2; rr++) { const x = a.x + a.nx * (i + 0.5) * sq + a.tx * (rr - 0.5) * sq, z = a.z + a.nz * (i + 0.5) * sq + a.tz * (rr - 0.5) * sq, q = P(x, z); ctx.fillStyle = (i + rr) % 2 ? '#1a1a1a' : '#f4f4f4'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(a.tz, a.tx)); ctx.fillRect(-sq * S / 2, -sq * S / 2, sq * S, sq * S); ctx.restore(); }
      for (let k = 0; k < 8; k++) { const g = T.at(T.L - 12 - k * 7.5, {}), d = (k % 2 ? 1 : -1) * g.hw * 0.42, q = P(g.x + g.nx * d, g.z + g.nz * d); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.3 * S; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.strokeRect(-2.6 * S, -1.5 * S, 5.2 * S, 3 * S); ctx.restore(); }
    });
  },
  // the edge barriers (instanced rails, tyre walls on tight bends) in a palette of your own, and at night the glow
  // spill that keeps the road edges readable. pal(i, tight, side) -> colour
  rails(E, T, pal) {
    CartDecor.protos(E);
    const step = 7;
    for (let s = 0; s < T.L; s += step) {
      const g = T.at(s, {}), tight = Math.abs(g.k) > 0.012, i = Math.floor(s / step);
      for (const side of [1, -1]) {
        const off = side > 0 ? g.wr : -g.wl, x = g.x + g.nx * off, z = g.z + g.nz * off, col = pal(i, tight, side);
        CartDecor.put(E, tight ? 'tyres' : 'rail', x, z, g.yaw, col, { y: 0, noLights: true, k: 1 });
        if (E.night) { if (i % 3 === 0) E.api.glow(x, 0.98, z, 0.9, col); if (i % 2 === 0) E.api.light(x - g.nx * side * 1.2, z - g.nz * side * 1.2, 5.5, col, 0.36); }
      }
    }
  },
  // lamp posts every `gap` metres, alternating sides, in a palette
  lamps(E, T, pal, gap) {
    gap = gap || 38;
    for (let s = 3, k = 0; s < T.L; s += gap, k++) { const g = T.at(s, {}), side = k % 2 ? 1 : -1, off = side > 0 ? g.wr + 2.5 : -g.wl - 2.5; CartDecor.put(E, 'lamp', g.x + g.nx * off, g.z + g.nz * off, Math.atan2(-g.nx * side, -g.nz * side), pal[k % pal.length], { y: 0, dusk: true }); }
  },
  // the start grid (8 slots behind the line), gift-box rows (fractions of the lap; 5 boxes across), boost pads [f, d]
  grid(E, T) { E.spawn = []; for (let k = 0; k < 8; k++) { const g = T.at(T.L - 12 - k * 7.5, {}), d = (k % 2 ? 1 : -1) * g.hw * 0.42; E.spawn.push({ x: g.x + g.nx * d, z: g.z + g.nz * d, yaw: g.yaw }); } },
  gifts(E, T, fr) { for (const f of fr) { const g = T.at(f * T.L, {}); for (let k = -2; k <= 2; k++) E.gifts.push({ x: g.x + g.nx * k * g.hw * 0.33, z: g.z + g.nz * k * g.hw * 0.33 }); } },
  boosts(E, T, list) { for (const [f, d] of list) { const g = T.at(f * T.L, {}); E.boosts.push({ x: g.x + g.nx * d * g.hw, z: g.z + g.nz * d * g.hw, yaw: g.yaw, w: 4.2, l: 6.5, s: f * T.L }); } },
  // a strip of spectators along one side from s0 to s1 (they cheer when cars pass), `rows` deep, kept off the road
  crowd(E, T, s0, s1, side, rng, o) {
    o = o || {};
    for (let s = s0; s < s1; s += o.gap || 1.6) for (let r = 0; r < (o.rows || 2); r++) {
      if (rng() < 0.3) continue;
      const g = T.at(s, {}), off = side > 0 ? g.wr + (o.off || 2.6) + r * 1.3 + rng() * 0.6 : -g.wl - (o.off || 2.6) - r * 1.3 - rng() * 0.6, x = g.x + g.nx * off + g.tx * (rng() - 0.5), z = g.z + g.nz * off + g.tz * (rng() - 0.5);
      if (CartWorlds.clear(T, x, z, 1.2)) E.spots.push({ x, z, yaw: Math.atan2(-g.nx * side, -g.nz * side) + (rng() - 0.5) * 0.6 });
    }
  },
  // instanced kinds of your own (CART_DECOR_KINDS format: { r, near, mid, farD, build(m, o), far(m, o), glows, pool }),
  // registered for this world only (prefix them with the level's id)
  kinds(E, table) {
    const o = { night: E.night, dusk: E.tod === 'sunset' || E.tod === 'dawn' };
    for (const id in table) { const K = table[id]; E.api.instanceProto(id, m => K.build(m, o), { r: K.r, near: K.near, mid: K.mid, farD: K.farD, far: K.far ? m => K.far(m, o) : null, lo: true, noAO: !!K.noAO, shadow: K.shadow }); }
    E.kitKinds = table;
  },
  put(E, id, x, z, yaw, col, o) {
    o = o || {};
    const K = E.kitKinds[id], s = o.scale || 1, y = o.y !== undefined ? o.y : E.terrain.height(x, z);
    E.api.instance(id, x, z, { y, yaw, scale: s, tint: cartTintOf(col, o.k, K.soft), noCol: o.noCol });
    if (!o.noLights && E.night) { const c = Math.cos(yaw), sn = Math.sin(yaw); for (const g of K.glows || []) E.api.glow(x + (g[0] * c + g[2] * sn) * s, y + g[1] * s, z + (-g[0] * sn + g[2] * c) * s, g[3] * s, col); if (K.pool) E.api.light(x, z, K.pool * s, col, 0.5); }
  },
  finish(E) { return CartWorlds.finish(E); },

  /* ---------- at run time ---------- */
  // one pooled mesh group for the level's moving things: list = [[name, build(m, i), count], …] -> { name: [objs] }
  // (drawn by cartItemsRender while anything in it is live; set obj.live / obj.visible and its x, y, z, yaw, pitch, roll, scale)
  group(s, list) {
    const out = {}; for (const [name] of list) out[name] = [];
    if (!BurnsGL.gl || !s.ix) return out;
    let G = null;   // a new group when one is full (32 objects on the low tier, 64 above: one more draw call)
    for (const [name, build, n] of list) for (let i = 0; i < n; i++) {
      if (!G || G.full) { if (G) G.finish(); G = new BurnsGroup(Math.min(64, BurnsGL.maxBones || 32)); s.ix.groups.push(G); }
      const o = G.add(m => build(m, i), { visible: false }); o.live = false; o.x = o.y = o.z = 0; o.yaw = o.pitch = o.roll = 0; o.scale = 1; out[name].push(o);
    }
    if (G) G.finish();
    return out;
  },
  // per-race counters for the tests and the balance pass: s.kit.hits[tag] (hazard hits that landed), s.kit.touch[tag]
  // (softer effects: shoves, blinding), s.kit.fired[tag] (how often a hazard went off)
  state(s) { return s.kit || (s.kit = { hits: {}, touch: {}, fired: {} }); },
  fired(s, tag) { const K = this.state(s); K.fired[tag] = (K.fired[tag] || 0) + 1; },
  // a hazard hit (spin, knock, flip…) with no car to blame: counted, logged as a hit with item = tag
  hit(s, k, kind, tag, o) { const ok = s.hit(k, kind, null, Object.assign({ item: tag }, o || {})); if (ok) { const K = this.state(s); K.hits[tag] = (K.hits[tag] || 0) + 1; } return ok; },
  // a softer effect (a shove, a blinding): counted, logged as 'hazard', a toast for the player
  touch(s, k, tag, banner, col) { const K = this.state(s); K.touch[tag] = (K.touch[tag] || 0) + 1; s.log('hazard', { k: k.id, hz: tag, player: k.player }); if (k.player && banner) s.banner(banner, col || '#ffffff', 0.9, null, true); },
  // AI help: how far ahead of kart k (metres of course, ±L/2) a hazard at arc length sv is. Keep every hazard's arc
  // length (CartKit.sOf at build time): T.locate only searches near its hint and gives nonsense for far points
  ahead(s, k, sv) { return this.ds(s.T, k.loc.s, sv); },
  // the cars a world point is close to the player for (sounds, shakes)
  near(s, x, z, r) { const p = s.player; return p && Math.hypot(p.x - x, p.z - z) < r; },
  // a heart shape in 2D (u 0..1 round the outline): x in about -1..1, y about -1.05..0.85 (tip at the bottom)
  heart(u, out) { const t = u * TAU, x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); out[0] = x / 16; out[1] = y / 16; return out; }
};
