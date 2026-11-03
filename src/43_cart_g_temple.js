/* ============================================================
   ART CART — arena: THE BURNING MAZE (id 'temple')
   A night maze of wooden lattice temple walls: three concentric rings with
   gaps, radial spokes, four lantern courtyards and a central altar plaza
   with a tall lattice spire. Every ~35 s the outermost standing ring catches
   fire, burns for 8 s and collapses into the ground, so the maze opens up
   ring by ring until only embers are left. Arena powers: SPIRIT DASH (ghost
   through walls), LANTERN TOSS (a fire ring that lights the nearest wall)
   and INCENSE CLOUD (dazzle + flipped steering). Its own objective: TEMPLE
   RUN (carry relics to the altar).
   Walls are our own: rigid groups (one draw call per ~64 panels) with our
   own segment collision in onStep, so panels can burn, sink and vanish, and
   ghosts can pass through. The AI routes through the gaps on a 4 m nav grid
   (BFS distance fields from each goal, rebuilt when a wall falls).
   Everything here is an original design: a generic wooden lattice temple,
   not any real temple's artwork.
   ============================================================ */
const CART_TEMPLE = {
  R: [44, 72, 100], PERIM: 120, GAPW: 16, H: 2.8, ALTAR_R: 14, SPIRE_R: 5,
  BURN_EVERY: 35, BURN_T: 8, SINK_T: 2.6, RING_NAMES: ['INNER', 'MIDDLE', 'OUTER'],
  NAV_C: 4, NAV_N: 62, NAV_O: -124,
  courts: [20, 110, 200, 290],
  relicSpots: [[58, 42], [58, 88], [58, 132], [58, 178], [58, 222], [58, 268], [58, 312], [58, 358], [86, 50], [86, 110], [86, 170], [86, 230], [86, 290], [86, 350]]
};
/* the wall layout: panels {x0,z0,x1,z1,cx,cz,len,yaw,ring} (ring = which burn wave takes it: 0 inner, 1 middle, 2 outer) */
function cartTempleLayout() {
  if (cartTempleLayout.cache) return cartTempleLayout.cache;
  const D2R = Math.PI / 180, P = [], C = CART_TEMPLE;
  const push = (x0, z0, x1, z1, ring) => P.push({ x0, z0, x1, z1, ring, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, len: Math.hypot(x1 - x0, z1 - z0), yaw: Math.atan2(x1 - x0, z1 - z0) });
  const gaps = [[20, 110, 200, 290], [65, 137, 209, 281, 353], [35, 95, 155, 215, 275, 335]], ringN = [34, 56, 78];
  for (let r = 0; r < 3; r++) {
    const R = C.R[r], N = ringN[r], len = TAU * R / N;
    for (let i = 0; i < N; i++) {
      const a0 = i / N * TAU, a1 = (i + 1) / N * TAU, am = (a0 + a1) / 2;
      if (gaps[r].some(g => Math.abs(cartWrap(am - g * D2R)) * R < C.GAPW / 2 + len / 2 - 0.1)) continue;
      push(Math.cos(a0) * R, Math.sin(a0) * R, Math.cos(a1) * R, Math.sin(a1) * R, r);
    }
  }
  // spokes: between the outer and middle rings (burn with the outer ring) and between the middle and inner (with the middle)
  const spoke = (deg, r0, r1, ring) => { const a = deg * D2R, n = 3; for (let i = 0; i < n; i++) { const q0 = r0 + (r1 - r0) * i / n, q1 = r0 + (r1 - r0) * (i + 1) / n; push(Math.cos(a) * q0, Math.sin(a) * q0, Math.cos(a) * q1, Math.sin(a) * q1, ring); } };
  for (const d of [20, 80, 140, 200, 260, 320]) spoke(d, 74.5, 97.5, 2);
  for (const d of [335, 65, 155, 245]) spoke(d, 46.5, 69.5, 1);
  P.forEach((p, i) => { p.idx = i; });
  return (cartTempleLayout.cache = P);
}
// point -> wall panel distance (2D)
function cartTempleSegD(x, z, p) { const dx = p.x1 - p.x0, dz = p.z1 - p.z0, L2 = dx * dx + dz * dz || 1, t = clamp(((x - p.x0) * dx + (z - p.z0) * dz) / L2, 0, 1); return Math.hypot(x - p.x0 - dx * t, z - p.z0 - dz * t); }
// is the straight line a->b at least m metres clear of every standing wall?
function cartTempleClear(T, ax, az, bx, bz, m) {
  const cross = (px, pz, qx, qz, rx, rz) => (qx - px) * (rz - pz) - (qz - pz) * (rx - px);
  const ptSeg = (x, z, x0, z0, x1, z1) => { const dx = x1 - x0, dz = z1 - z0, L2 = dx * dx + dz * dz || 1, t = clamp(((x - x0) * dx + (z - z0) * dz) / L2, 0, 1); return Math.hypot(x - x0 - dx * t, z - z0 - dz * t); };
  const lx = Math.min(ax, bx) - m, hx = Math.max(ax, bx) + m, lz = Math.min(az, bz) - m, hz = Math.max(az, bz) + m;
  for (const p of T.P) {
    if (!p.alive) continue;
    if (Math.max(p.x0, p.x1) < lx || Math.min(p.x0, p.x1) > hx || Math.max(p.z0, p.z1) < lz || Math.min(p.z0, p.z1) > hz) continue;
    const d1 = cross(ax, az, bx, bz, p.x0, p.z0), d2 = cross(ax, az, bx, bz, p.x1, p.z1), d3 = cross(p.x0, p.z0, p.x1, p.z1, ax, az), d4 = cross(p.x0, p.z0, p.x1, p.z1, bx, bz);
    if (d1 * d2 < 0 && d3 * d4 < 0) return false;
    if (Math.min(cartTempleSegD(ax, az, p), cartTempleSegD(bx, bz, p), ptSeg(p.x0, p.z0, ax, az, bx, bz), ptSeg(p.x1, p.z1, ax, az, bx, bz)) < m) return false;
  }
  return true;
}
/* ---------------- meshes (original lattice panels, relic totems) ---------------- */
function cartTemplePanel(m, len, i) {
  const H = CART_TEMPLE.H, wd = BURNS_ATLAS.pattern('wood'), e = len / 2 - 0.14;
  m.shine(0);
  m.color(i % 2 ? '#b8865a' : '#ad7c50');
  for (const s of [-1, 1]) m.box(0, H / 2 + 0.1, s * e, 0.28, H + 0.2, 0.28, { uv: wd, uvFaces: 'sides' });
  m.color('#d8ae7c'); m.box(0, H - 0.08, 0, 0.2, 0.2, len - 0.3, { uv: wd }); m.box(0, 0.28, 0, 0.2, 0.2, len - 0.3, { uv: wd });
  m.color('#c89a6a'); m.box(0, H * 0.52, 0, 0.12, 0.14, len - 0.3);
  // the lattice: two sets of diagonal slats, clipped to the frame
  const y0 = 0.36, y1 = H - 0.16, hh = (y1 - y0) / 2, ez = hh * 0.62, step = 1.24, zl = -e + 0.1, zh = e - 0.1;
  m.color('#cfa070');
  for (const dir of [1, -1]) for (let zc = -len / 2 + 0.62; zc < len / 2; zc += step) {
    let za = zc - ez, zb = zc + ez, ya = y0, yb = y1; if (dir < 0) { ya = y1; yb = y0; }
    const sl = (yb - ya) / (zb - za);
    if (za < zl) { ya += (zl - za) * sl; za = zl; } if (zb > zh) { yb -= (zb - zh) * sl; zb = zh; }
    if (zb - za < 0.3) continue;
    const L = Math.hypot(zb - za, yb - ya);
    m.push(); m.tf(0, (ya + yb) / 2, (za + zb) / 2, 0, -Math.atan2(yb - ya, zb - za), 0); m.box(0, 0, 0, 0.07, 0.13, L); m.pop();
  }
  // post caps, and a paper lantern on every third panel
  m.color('#8a5a3a'); for (const s of [-1, 1]) m.box(0, H + 0.28, s * e, 0.4, 0.16, 0.4);
  if (i % 3 === 0) { m.color('#ffb050', 0.95); m.push(); m.tf(0, H + 0.9, e, 0); m.lathe([[0, 0], [0.22, 0.05], [0.3, 0.3], [0.22, 0.58], [0, 0.62]], { seg: 7 }); m.pop(); m.color('#3a2a22', 0); m.box(0, H + 1.3, e, 0.05, 0.3, 0.05); }
  m.emissive(0);
}
function cartTempleRelic(m) {
  m.color('#5a3a2a').shine(1); m.lathe([[0, 0], [0.46, 0], [0.46, 0.12], [0.26, 0.2], [0.3, 0.86], [0.18, 1.0], [0, 1.0]], { seg: 8 });
  m.color('#ff9a3a', 0.6); m.torus(0, 0.9, 0, 0.4, 0.05, { seg: 12, tseg: 4 });
  m.color('#ffd27a', 1).shine(2); m.push(); m.tf(0, 1.32, 0, 0.785, 0, 0.785); m.box(0, 0, 0, 0.4, 0.4, 0.4); m.pop();
  m.emissive(0).shine(0);
}
/* ---------------- runtime state (the objective init and onLoad both reach it) ---------------- */
function cartTempleState(s) {
  if (s.temple) return s.temple;
  const L = cartTempleLayout(), T = { P: L.map(p => Object.assign({}, p, { alive: true, burn: 0, sink: 0, fire: null, tilt: 0 })), rings: [], order: [2, 1, 0], next: CART_TEMPLE.BURN_EVERY, ver: 1, embers: [], relics: [], burnedRings: 0, breakT: 0 };
  for (let r = 0; r < 3; r++) T.rings.push({ idx: T.P.filter(p => p.ring === r).map(p => p.idx), state: 'standing', warned: false });
  // the walls: rigid groups in the scene's prop pool (posed and drawn with the gift boxes, one draw per group)
  const maxB = Math.min(64, BurnsGL.maxBones || 32);
  let G = new BurnsGroup(maxB); T.groups = [G];
  for (const p of T.P) {
    if (G.full) { G.finish(); G = new BurnsGroup(maxB); T.groups.push(G); }
    const o = G.add(m => cartTemplePanel(m, p.len, p.idx), { visible: true });
    o.x = p.cx; o.y = 0; o.z = p.cz; o.yaw = p.yaw; p.obj = o;
  }
  G.finish();
  if (s.props && s.props.groups) s.props.groups.push(...T.groups);
  s.temple = T;
  return T;
}
function cartTempleIgnite(s, p) {
  if (!p.alive || p.burn > 0) return;
  p.burn = 0.001; s.temple.ver++;   // the nav grid re-routes around the fire
  if (!p.fire && (p.idx % 4 === 0 || p.lanternLit)) { p.fire = { x: p.cx, y: 0.3, z: p.cz, r: 0.6, hazard: false, t: Math.random() * 10 }; s.W.fires.push(p.fire); }
}
function cartTempleIgniteRing(s, r) {
  const T = s.temple, R = T.rings[r];
  R.state = 'burning';
  for (const i of R.idx) cartTempleIgnite(s, T.P[i]);
  T.next = CART_TEMPLE.BURN_EVERY;
  s.banner('THE ' + CART_TEMPLE.RING_NAMES[r] + ' RING BURNS!', '#ff7a2a', 2.0, 'it falls in ' + CART_TEMPLE.BURN_T + ' seconds');
  Sound.play('flame', { vol: 0.9 }); Sound.play('flame', { vol: 0.6, pitch: 0.6 });
  s.log('templeBurn', { ring: r });
}
function cartTempleCollapse(s, p) {
  const T = s.temple; if (!p.alive) return;
  p.alive = false; p.sink = 0; p.tilt = Math.random() < 0.5 ? -1 : 1; p.burn = 0;
  if (p.fire) { const i = s.W.fires.indexOf(p.fire); if (i >= 0) s.W.fires.splice(i, 1); p.fire = null; }
  T.embers.push({ x: p.cx, z: p.cz, yaw: p.yaw, len: p.len, t: 0 });
  if (s.fx) { s.fx.spark(p.cx, 1.5, p.cz, 8, '#ffb040', 5); s.fx.smoke(p.cx, 1.2, p.cz, 3, '#5a4a48'); }
  T.ver++;
  if (T.breakT <= 0) { T.breakT = 0.3; Sound.play('break', { vol: 0.5, pitch: 0.6 }); }
  // a relic sitting under a falling wall is fine: walls sink, they don't crush
}
/* ---------------- the nav grid: BFS distance fields from each goal, rebuilt when walls fall ---------------- */
function cartTempleNav(T) {
  const N = CART_TEMPLE.NAV_N, C = CART_TEMPLE.NAV_C, O = CART_TEMPLE.NAV_O;
  if (!T.nav) T.nav = { ver: -1, blocked: new Uint8Array(N * N), fields: new Map(), q: new Int32Array(N * N) };
  const nav = T.nav; if (nav.ver === T.ver) return nav;
  nav.ver = T.ver; nav.fields.clear();
  const B = nav.blocked; B.fill(0);
  const alive = T.P.filter(p => p.alive);
  for (let ix = 0; ix < N; ix++) for (let iz = 0; iz < N; iz++) {
    const x = O + (ix + 0.5) * C, z = O + (iz + 0.5) * C, r = Math.hypot(x, z);
    let b = r > 114 || r < CART_TEMPLE.SPIRE_R + 3;
    if (!b) for (const p of alive) { const m = p.burn > 0 ? 5.5 : 2.5; if (Math.abs(p.cx - x) > p.len / 2 + m + 1 || Math.abs(p.cz - z) > p.len / 2 + m + 1) continue; if (cartTempleSegD(x, z, p) < m) { b = true; break; } }   // burning walls: give them a wide berth
    B[ix * N + iz] = b ? 1 : 0;
  }
  return nav;
}
function cartTempleField(nav, gc) {
  let D = nav.fields.get(gc); if (D) return D;
  const N = CART_TEMPLE.NAV_N, B = nav.blocked, Q = nav.q;
  D = new Int16Array(N * N).fill(-1); let qh = 0, qt = 0; D[gc] = 0; Q[qt++] = gc;
  while (qh < qt) {
    const c = Q[qh++], ix = (c / N) | 0, iz = c % N, d = D[c] + 1;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dz) continue; const jx = ix + dx, jz = iz + dz; if (jx < 0 || jz < 0 || jx >= N || jz >= N) continue;
      const j = jx * N + jz; if (B[j] || D[j] >= 0) continue;
      if (dx && dz && (B[ix * N + jz] || B[jx * N + iz])) continue;   // no corner cutting past a wall end
      D[j] = d; Q[qt++] = j;
    }
  }
  nav.fields.set(gc, D); if (nav.fields.size > 48) nav.fields.delete(nav.fields.keys().next().value);
  return D;
}
// the next waypoint from the kart toward (gx, gz) through the standing walls
function cartTempleRoute(s, k, gx, gz) {
  const T = s.temple, nav = cartTempleNav(T), N = CART_TEMPLE.NAV_N, C = CART_TEMPLE.NAV_C, O = CART_TEMPLE.NAV_O, B = nav.blocked;
  if (k.ghostT > 0.6) return [gx, gz];
  const cell = (x, z) => clamp(Math.floor((x - O) / C), 0, N - 1) * N + clamp(Math.floor((z - O) / C), 0, N - 1);
  const cx = c => O + (((c / N) | 0) + 0.5) * C, cz = c => O + ((c % N) + 0.5) * C;
  const near = (c, rad, D) => { const ix = (c / N) | 0, iz = c % N; let best = -1, bd = 1e9; for (let dx = -rad; dx <= rad; dx++) for (let dz = -rad; dz <= rad; dz++) { const jx = ix + dx, jz = iz + dz; if (jx < 0 || jz < 0 || jx >= N || jz >= N) continue; const j = jx * N + jz; if (B[j] || (D && D[j] < 0)) continue; const sc = dx * dx + dz * dz + (D ? D[j] * 0.5 : 0); if (sc < bd) { bd = sc; best = j; } } return best; };
  let gc = cell(gx, gz); if (B[gc]) gc = near(gc, 3, null); if (gc < 0) return [gx, gz];
  const D = cartTempleField(nav, gc);
  let kc = cell(k.x, k.z);
  if (B[kc] || D[kc] < 0) { const j = near(kc, 2, D); return j < 0 ? [gx, gz] : [cx(j), cz(j)]; }
  if (D[kc] <= 1) return [gx, gz];
  const path = []; let cur = kc;
  for (let i = 0; i < 8; i++) {
    const ix = (cur / N) | 0, iz = cur % N; let nb = -1, nd = D[cur];
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (!dx && !dz) continue; const jx = ix + dx, jz = iz + dz; if (jx < 0 || jz < 0 || jx >= N || jz >= N) continue;
      const j = jx * N + jz; if (B[j] || D[j] < 0 || D[j] >= nd) continue;
      if (dx && dz && (B[ix * N + jz] || B[jx * N + iz])) continue;
      nd = D[j]; nb = j;
    }
    if (nb < 0) break; path.push(nb); cur = nb; if (nd === 0) break;
  }
  if (!path.length) return [gx, gz];
  let pick = path[0];
  for (let i = path.length - 1; i >= 1; i--) if (cartTempleClear(T, k.x, k.z, cx(path[i]), cz(path[i]), 2.1)) { pick = path[i]; break; }
  if (D[pick] === 0) return [gx, gz];
  return [cx(pick), cz(pick)];
}
/* ---------------- relics ---------------- */
function cartTempleRelicSpot(s, taken) {
  const T = s.temple, C = CART_TEMPLE, D2R = Math.PI / 180;
  let best = null, bs = -1;
  for (const [r, deg] of C.relicSpots) {
    const x = Math.cos(deg * D2R) * r, z = Math.sin(deg * D2R) * r;
    if (T.relics.some(q => q !== taken && q.alive && !q.holder && Math.hypot(q.x - x, q.z - z) < 10)) continue;
    let dk = 1e9; for (const k of s.karts) dk = Math.min(dk, Math.hypot(k.x - x, k.z - z));
    const sc = Math.min(dk, 60) + s.rng() * 25; if (sc > bs) { bs = sc; best = [x, z]; }
  }
  return best || [40, 40];
}
function cartTemplePlaceRelic(s, r) { const p = cartTempleRelicSpot(s, r); r.x = p[0]; r.z = p[1]; r.y = s.terrain.height(p[0], p[1]); r.alive = true; r.holder = null; r.cool = 0; r.from = null; r.t = 0; }

/* ---------------- registration ---------------- */
CART_ARENAS.push({ id: 'temple', name: 'THE BURNING MAZE', sub: 'Night maze of temple walls that burn down ring by ring', objectives: ['relic', 'vibe', 'glow', 'flag', 'hill'], col: '#ff9a3a', tod: 'night', powers: ['ghost', 'lantern', 'incense'], blurb: 'Three rings of wooden lattice walls around a glowing altar spire. Every 35 seconds the outer ring catches fire and falls, until the whole maze is embers. Ghost through walls, toss lanterns, hunt the relics.' });

CART_OBJECTIVES.relic = {
  name: 'TEMPLE RUN', short: 'Relics to the altar', desc: 'Five glowing relics are hidden deep in the maze. Drive over one to pick it up and carry it to the altar ring at the centre. Getting hit drops it. First to 3 relics wins.', time: 180, goal: 3, unit: ' relics',
  fx: {
    init(s) {
      const T = cartTempleState(s), maxB = Math.min(64, BurnsGL.maxBones || 32), G = new BurnsGroup(maxB);
      T.relics = [];
      for (let i = 0; i < 5; i++) { const o = G.add(m => cartTempleRelic(m), { visible: true }); const r = { x: 0, z: 0, y: 0, alive: true, holder: null, cool: 0, from: null, t: 0, ph: i * 1.3, obj: o }; T.relics.push(r); }
      G.finish(); T.groups.push(G); if (s.props && s.props.groups) s.props.groups.push(G);
      for (const r of T.relics) cartTemplePlaceRelic(s, r);
      for (const k of s.karts) k.relic = null;
    },
    update(s, dt) {
      const T = s.temple, C = CART_TEMPLE; if (!T) return false;
      for (const r of T.relics) {
        if (r.cool > 0) r.cool -= dt;
        const h = r.holder;
        if (h) {
          r.x = h.x; r.z = h.z; r.y = h.y + h.M.h + 0.5;
          if (h.out) { r.holder = null; h.relic = null; r.cool = 1; r.y = s.terrain.height(r.x, r.z); continue; }
          if (Math.hypot(h.x, h.z) < C.ALTAR_R) {
            h.score++; h.relic = null; r.holder = null; h.cheerT = Math.max(h.cheerT, 1.2);
            s.log('relic', { k: h.id, n: h.score });
            s.banner(h.player ? 'RELIC DELIVERED!' : h.car.name + ' SCORES A RELIC', h.player ? '#7aff8a' : '#ff9a3a', 1.6, h.score + ' / ' + CART_OBJECTIVES.relic.goal);
            Sound.play(h.player ? 'kartFinish' : 'kartLap', { vol: 0.6 }); s.fx.confetti(h.x, h.y + 2, h.z, 30); s.fx.burst(0, 9, 0, 'star', 18, '#ffd27a');
            cartTemplePlaceRelic(s, r);
            if (h.score >= CART_OBJECTIVES.relic.goal) return true;
          }
          continue;
        }
        if (!r.alive || r.cool > 0 && !r.from) continue;
        for (const k of s.karts) {
          if (k.out || k.relic || k.invT > 0.6 || (r.cool > 0 && r.from === k)) continue;
          if (Math.hypot(k.x - r.x, k.z - r.z) < 2.8 && Math.abs(k.y - r.y) < 3) {
            r.holder = k; k.relic = r; r.from = null; r.cool = 0;
            s.log('relicpick', { k: k.id });
            s.banner(k.player ? 'YOU HAVE A RELIC!' : k.car.name + ' HAS A RELIC', k.player ? '#7aff8a' : '#ffd27a', 1.3, k.player ? 'Carry it to the altar spire' : '', !k.player);
            Sound.play('pick', { vol: k.player ? 0.7 : 0.3 }); s.fx.burst(r.x, r.y + 1, r.z, 'star', 10, '#ffd27a');
            break;
          }
        }
      }
      return false;
    },
    rank(s) { return s.karts.slice().sort((a, b) => (b.score - a.score) || (b.hitsDealt - a.hitsDealt) || (a.slot - b.slot)); },
    score(k) { return k.score; }
  }
};

/* ---------------- the arena's powers ---------------- */
CART_ITEMS.ghost = { name: 'SPIRIT DASH', desc: 'Three seconds as a spirit: fast, glowing, and straight through the maze walls.', col: '#9af0ff', arena: 'temple' };
CART_ITEMS.lantern = { name: 'LANTERN TOSS', desc: 'Throws a paper lantern ahead. It bursts into a ring of fire that spins cars and lights the nearest wall.', col: '#ff9a3a', arena: 'temple' };
CART_ITEMS.incense = { name: 'INCENSE CLOUD', desc: 'Leaves a drifting purple cloud. Rivals inside get dazzled and their steering flips.', col: '#c86aff', arena: 'temple' };
CART_ITEM_FX.ghost = {
  use(s, k) {
    k.ghostT = 3.0; s.boost(k, 3.0, 'ghost');
    Sound.play('kartBoost', { vol: k.player ? 0.8 : 0.3, pitch: 0.7 }); Sound.play('disco', { vol: k.player ? 0.4 : 0.15, pitch: 1.4 });
    s.fx.burst(k.x, k.y + 1.5, k.z, 'glow', 16, '#9af0ff');
    if (k.player && s.temple) s.banner('SPIRIT DASH!', '#9af0ff', 1.0, 'drive straight through the walls', true);
  },
  update(s, dt, racing) {
    for (const k of s.karts) {
      if (!(k.ghostT > 0)) continue;
      k.ghostT = Math.max(0, k.ghostT - dt);
      if (s.fx && Math.random() < dt * 40) { const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw); s.fx.add(k.x - fx * 1.5 + (Math.random() - 0.5) * 2, k.y + 0.6 + Math.random() * 2.2, k.z - fz * 1.5 + (Math.random() - 0.5) * 2, -fx * 2, 1.2, -fz * 2, 0.5, 1.4, 0.2, [0.6, 0.95, 1], 0.6, 'glow', 1 | 4); }
      if (k.ghostT === 0 && s.fx) s.fx.burst(k.x, k.y + 1.2, k.z, 'ring', 8, '#bff4ff');
    }
  },
  aiWants(s, k) {
    const T = s.temple, g = k.tgoal;
    if (T && g) { const d = Math.hypot(g[0] - k.x, g[1] - k.z); if (d > 8 && !cartTempleClear(T, k.x, k.z, g[0], g[1], 1.2)) return true; return k.ai.itemT < -5; }
    return true;
  },
  icon(ctx, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, -s * 0.1, s * 0.4, Math.PI, 0); ctx.lineTo(s * 0.4, s * 0.4); for (let i = 0; i < 4; i++) ctx.lineTo(s * 0.4 - (i + 0.5) * s * 0.2, s * (i % 2 ? 0.4 : 0.26)); ctx.lineTo(-s * 0.4, s * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(-s * 0.15, -s * 0.12, s * 0.07, 0, TAU); ctx.arc(s * 0.15, -s * 0.12, s * 0.07, 0, TAU); ctx.fill(); }
};
CART_ITEM_FX.lantern = {
  use(s, k) {
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), sp = Math.max(0, k.fwd || 0) * 0.8 + 14;
    s.shots.push({ fx: 'lantern', type: 'ball', kind: 'fire', owner: k, x: k.x + fx * 1.6, y: k.y + 1.6, z: k.z + fz * 1.6, vx: fx * sp, vz: fz * sp, vy: 7.4, t: 0, life: 3.9, r: 5, phase: 0, landT: 0, hit: new Set() });
    Sound.play('throw', { vol: k.player ? 0.8 : 0.3 });
  },
  shot(s, sh, dt) {
    const k = sh.owner, T = s.temple;
    if (sh.phase === 0) {
      sh.vy -= 12 * dt; sh.x += sh.vx * dt; sh.z += sh.vz * dt; sh.y += sh.vy * dt;
      const gy = s.terrain.height(sh.x, sh.z);
      let land = sh.y <= gy + 0.4 || sh.t > 1.5 || (s.E.walls && s.wallDist(sh.x, sh.z, s._wdL || (s._wdL = {})).d < 0.5);
      if (!land && T) for (const p of T.P) { if (!p.alive || Math.abs(p.cx - sh.x) > p.len / 2 + 2 || Math.abs(p.cz - sh.z) > p.len / 2 + 2) continue; if (cartTempleSegD(sh.x, sh.z, p) < 0.7 && sh.y < CART_TEMPLE.H + 0.5) { land = true; break; } }
      if (land) {
        sh.phase = 1; sh.landT = sh.t; sh.y = gy + 0.4; sh.vx = sh.vz = sh.vy = 0;
        Sound.play('flame', { vol: 0.8 }); s.fx.burst(sh.x, sh.y + 0.5, sh.z, 'flame', 20, '#ff9a3a'); s.fx.ring(sh.x, sh.y + 0.2, sh.z, sh.r, '#ffb050', 0.5);
        if (s.player && Math.hypot(s.player.x - sh.x, s.player.z - sh.z) < 14) s.shakeIt(0.3);
        if (T) { let best = null, bd = 10; for (const p of T.P) { if (!p.alive || p.burn > 0) continue; const d = cartTempleSegD(sh.x, sh.z, p); if (d < bd) { bd = d; best = p; } } if (best) { best.lanternLit = true; cartTempleIgnite(s, best); if (k.player) s.banner('THE WALL CATCHES FIRE!', '#ff7a2a', 1.0, null, true); } }
      }
      return;
    }
    const u = sh.t - sh.landT;
    if (u > 2.5) { sh.dead = true; return; }
    for (const o of s.karts) { if (o === k || o.out || sh.hit.has(o)) continue; if (Math.hypot(o.x - sh.x, o.z - sh.z) < sh.r && o.y < sh.y + 2.5) { sh.hit.add(o); s.hit(o, 'spin', k, { item: 'lantern', dur: 1.1 }); s.fx.fire(o.x, o.y + 1, o.z, 1.6); } }
  },
  draw(s, R, sh, S, t) {
    if (sh.phase === 0) {
      R.bbs.bb(sh.x, sh.y, sh.z, 0.9, 1.2, S.square, [1, 0.6, 0.3], 0.95, false); R.bbs.bb(sh.x, sh.y, sh.z, 2.6, 2.6, S.glow, [1, 0.6, 0.2], 0.9, true);
      if (Math.random() < 0.7) s.fx.trail(sh.x, sh.y - 0.3, sh.z, '#ffb050');
    } else {
      const u = sh.t - sh.landT, a = clamp((2.5 - u) * 1.5, 0, 1), gy = sh.y - 0.3;
      R.flat.flat(sh.x, gy + 0.08, sh.z, sh.r * 2, sh.r * 2, t * 2, S.ring, [1, 0.55, 0.15], a, true); R.flat.flat(sh.x, gy + 0.06, sh.z, sh.r * 2.2, sh.r * 2.2, 0, S.glow, [1, 0.5, 0.15], 0.35 * a, true);
      for (let i = 0; i < 7; i++) { const ang = Math.random() * TAU, rr = sh.r * (0.75 + Math.random() * 0.3); s.fx.fire(sh.x + Math.cos(ang) * rr, gy + 0.1, sh.z + Math.sin(ang) * rr, 1.1 * (0.5 + a * 0.5)); }
      if (Math.random() < 0.3) s.fx.smoke(sh.x + (Math.random() - 0.5) * 6, gy + 1, sh.z + (Math.random() - 0.5) * 6, 1, '#4a3a38');
      R.bbs.bb(sh.x, gy + 1.5, sh.z, 7, 7, S.glow, [1, 0.5, 0.15], 0.35 * a, true);
    }
  },
  aiWants(s, k) {
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    for (const o of s.karts) { if (o === k || o.out) continue; const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); if (d < 28 && d > 6 && Math.abs(cartWrap(Math.atan2(dx, dz) - k.yaw)) < 0.5 && (dx * fx + dz * fz) > 0) return true; }
    return k.ai.itemT < -7;
  },
  icon(ctx, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.35); ctx.lineTo(s * 0.3, -s * 0.35); ctx.lineTo(s * 0.36, s * 0.3); ctx.lineTo(-s * 0.36, s * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffe8b0'; ctx.beginPath(); ctx.moveTo(0, s * 0.2); ctx.quadraticCurveTo(s * 0.18, 0, 0, -s * 0.25); ctx.quadraticCurveTo(-s * 0.18, 0, 0, s * 0.2); ctx.fill(); ctx.beginPath(); ctx.moveTo(-s * 0.12, -s * 0.35); ctx.lineTo(0, -s * 0.52); ctx.lineTo(s * 0.12, -s * 0.35); ctx.stroke(); }
};
CART_ITEM_FX.incense = {
  use(s, k) {
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    s.shots.push({ fx: 'incense', type: 'cloud', owner: k, x: k.x - fx * 3, y: k.y + 1, z: k.z - fz * 3, vx: Math.sin(s.windA || 0) * 1.1, vz: Math.cos(s.windA || 0) * 1.1, t: 0, life: 8, r: 6.5, hit: new Set(), ph: Math.random() * 10 });
    Sound.play('dust', { vol: k.player ? 0.6 : 0.25, pitch: 1.3 }); s.fx.burst(k.x - fx * 3, k.y + 1, k.z - fz * 3, 'puff', 10, '#c86aff');
  },
  update(s, dt, racing) { for (const k of s.karts) if (k.steerFlipT > 0) k.steerFlipT = Math.max(0, k.steerFlipT - dt); },
  shot(s, sh, dt) {
    const k = sh.owner;
    sh.x += sh.vx * dt; sh.z += sh.vz * dt; sh.y = s.terrain.height(sh.x, sh.z) + 1;
    if (s.E.walls) { const w = s.wallDist(sh.x, sh.z, s._wdI || (s._wdI = {})); if (w.d < 3) { sh.vx = w.nx * 1.1; sh.vz = w.nz * 1.1; } }
    for (const o of s.karts) {
      if (o === k || o.out) continue;
      if (Math.hypot(o.x - sh.x, o.z - sh.z) < sh.r && o.y < sh.y + 3) {
        o.steerFlipT = Math.max(o.steerFlipT || 0, 2.0);
        if (!sh.hit.has(o)) { sh.hit.add(o); s.hit(o, 'dazzle', k, { item: 'incense' }); if (o.player) s.banner('INCENSE! STEERING FLIPPED', '#c86aff', 1.4); }
      }
    }
  },
  draw(s, R, sh, S, t) {
    const a = clamp((sh.life - sh.t) / 1.5, 0, 1) * clamp(sh.t * 3, 0, 1), gy = sh.y - 1;
    R.flat.flat(sh.x, gy + 0.07, sh.z, sh.r * 2.2, sh.r * 2.2, t * 0.3, S.glow, [0.7, 0.35, 1], 0.4 * a, true);
    for (let i = 0; i < 5; i++) { const ang = sh.ph + i * 1.26 + t * 0.4, rr = sh.r * 0.55; R.bbs.bb(sh.x + Math.cos(ang) * rr, gy + 1.2 + Math.sin(t * 1.3 + i) * 0.5, sh.z + Math.sin(ang) * rr, 5.5, 5.5, S.puff, [0.55, 0.3, 0.8], 0.45 * a, false, ang); }
    if (Math.random() < 0.8) s.fx.add(sh.x + (Math.random() - 0.5) * sh.r * 1.6, gy + 0.3 + Math.random(), sh.z + (Math.random() - 0.5) * sh.r * 1.6, sh.vx + (Math.random() - 0.5), 0.5 + Math.random() * 0.5, sh.vz + (Math.random() - 0.5), 1.8, 1.4, 3.2, [0.7, 0.4, 1], 0.35 * a, 'puff', 4, Math.random() * 6, (Math.random() - 0.5));
  },
  aiWants(s, k) {
    for (const o of s.karts) { if (o === k || o.out) continue; const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); if (d < 9 || (d < 16 && dx * Math.sin(k.yaw) + dz * Math.cos(k.yaw) < 0)) return true; }
    return k.ai.itemT < -7;
  },
  icon(ctx, s, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, s * 0.3, s * 0.38, s * 0.14, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, s * 0.1); ctx.beginPath(); ctx.moveTo(0, s * 0.25); ctx.bezierCurveTo(-s * 0.35, 0, s * 0.35, -s * 0.15, 0, -s * 0.5); ctx.stroke(); ctx.beginPath(); ctx.arc(s * 0.22, -s * 0.3, s * 0.1, 0, TAU); ctx.arc(-s * 0.2, -s * 0.05, s * 0.07, 0, TAU); ctx.fill(); }
};

/* ---------------- the arena's rules ---------------- */
CART_ARENA_RULES.temple = {
  music: 'kart3',
  onLoad(s) { cartTempleState(s); for (const k of s.karts) { k.ghostT = 0; k.steerFlipT = 0; k.routeT = 0; } },
  onUpdate(s, dt, racing) {
    const T = s.temple, C = CART_TEMPLE; if (!T) return;
    if (T.breakT > 0) T.breakT -= dt;
    if (racing && s.state === 'race' && !s.obj.ended) {
      const r = T.order.find(i => T.rings[i].state === 'standing');
      if (r !== undefined) {
        T.next -= dt; const R = T.rings[r];
        if (T.next <= 5 && !R.warned) { R.warned = true; s.banner('THE ' + C.RING_NAMES[r] + ' RING IS ABOUT TO BURN', '#ff9a3a', 1.6, null, true); Sound.play('kartFinalLap', { vol: 0.45 }); }
        if (T.next <= 0) cartTempleIgniteRing(s, r);
      }
    }
    for (const p of T.P) {
      if (!p.alive) {
        if (p.sink < C.SINK_T) { p.sink += dt; const u = Math.min(1, p.sink / C.SINK_T); p.obj.y = -u * u * 4.6; p.obj.roll = u * 0.4 * p.tilt; p.obj.visible = u < 1; if (s.fx && Math.random() < dt * 6) s.fx.spark(p.cx + (Math.random() - 0.5) * p.len, 1.5, p.cz, 2, '#ffb040', 4); }
        continue;
      }
      if (p.burn > 0) { p.burn += dt; if (p.burn >= C.BURN_T) cartTempleCollapse(s, p); }
    }
    for (let r = 0; r < 3; r++) {
      const R = T.rings[r]; if (R.state !== 'burning') continue;
      if (R.idx.every(i => !T.P[i].alive)) {
        R.state = 'fallen'; T.burnedRings++;
        s.banner('THE ' + C.RING_NAMES[r] + ' RING FALLS!', '#ffb050', 2.2, T.burnedRings >= 3 ? 'the maze is open: only embers remain' : 'the maze opens up');
        Sound.play('break', { vol: 0.9, pitch: 0.5 }); Sound.play('stomp', { vol: 0.6, pitch: 0.6 }); s.shakeIt(0.8);
        s.log('templeFall', { ring: r });
      }
    }
    for (const e of T.embers) e.t += dt;
    // our walls stop the signature-weapon projectiles too
    for (const sh of s.shots) if (sh.type === 'ball' && !sh.fx && !sh.dead) for (const p of T.P) { if (!p.alive || Math.abs(p.cx - sh.x) > p.len / 2 + 2 || Math.abs(p.cz - sh.z) > p.len / 2 + 2) continue; if (cartTempleSegD(sh.x, sh.z, p) < 0.7 && sh.y < C.H + 0.5) { sh.dead = true; s.fx.spark(sh.x, sh.y, sh.z, 6, '#ffd8a0', 5); break; } }
  },
  onStep(s, k, dt, racing) {
    const T = s.temple; if (!T) return;
    if (k.steerFlipT > 0) k.inp.steer = -k.inp.steer;
    // AI: keep the routed waypoint fresh (the goal itself comes from aiGoal)
    if (k.ai && k.ai.goal && k.tgoal && racing) { k.routeT = (k.routeT || 0) - dt; if (k.routeT <= 0) { k.routeT = 0.12; const w = cartTempleRoute(s, k, k.tgoal[0], k.tgoal[1]); k.ai.goal[0] = w[0]; k.ai.goal[1] = w[1]; } }
    if (k.ghostT > 0) return;   // a spirit passes through the walls
    const r = CART_R + 0.18;
    for (const p of T.P) {
      if (!p.alive || Math.abs(p.cx - k.x) > p.len / 2 + 3 || Math.abs(p.cz - k.z) > p.len / 2 + 3) continue;
      const ex = p.x1 - p.x0, ez = p.z1 - p.z0, L2 = ex * ex + ez * ez || 1, t = clamp(((k.x - p.x0) * ex + (k.z - p.z0) * ez) / L2, 0, 1);
      const qx = p.x0 + ex * t, qz = p.z0 + ez * t; let nx = k.x - qx, nz = k.z - qz; const d = Math.hypot(nx, nz);
      const hazard = p.burn > 0 && d < r + 0.7 && k.invT <= 0 && !k.out && racing;
      if (d >= r && !hazard) continue;
      if (d < 1e-3) { const L = Math.sqrt(L2); nx = -ez / L; nz = ex / L; if (k.vx * nx + k.vz * nz > 0) { nx = -nx; nz = -nz; } } else { nx /= d; nz /= d; }
      if (d < r) {
        k.x += nx * (r - d); k.z += nz * (r - d);
        const vn = k.vx * nx + k.vz * nz;
        if (vn < 0) { k.vx -= nx * vn * 1.5; k.vz -= nz * vn * 1.5; k.vx *= 0.85; k.vz *= 0.85; if (-vn > 4 && k.bumpT <= 0) { k.bumpT = 0.3; k.drift = 0; k.charge = 0; s.sparkBurst(qx, k.y + 0.7, qz, 8, '#ffd890'); if (k.player) { Sound.play('kartHit', { vol: 0.5 }); s.shakeIt(0.4); } } }
      }
      if (hazard && s.hit(k, 'spin', null, { dur: 1.0, weapon: 'fire' })) {
        k.vx += nx * 7; k.vz += nz * 7; k.vy = Math.max(k.vy, 3); k.air = true;
        for (let i = 0; i < 6; i++) s.fx.fire(k.x + (Math.random() - 0.5) * 2, k.y + 0.5 + Math.random(), k.z + (Math.random() - 0.5) * 2, 1.4);
        if (k.player) { Sound.play('flame', { vol: 0.7 }); s.banner('BURNED!', '#ff7a2a', 1.0, 'keep clear of a burning ring'); }
      }
    }
  },
  onHit(s, k, kind, src, o) {
    const r = k.relic; if (!r) return;
    r.holder = null; k.relic = null; r.from = k; r.cool = 1.2; r.x = k.x + (src && src !== k ? (k.x - src.x) * 0.15 : 0); r.z = k.z + (src && src !== k ? (k.z - src.z) * 0.15 : 0); r.y = s.terrain.height(r.x, r.z);
    s.log('relicdrop', { k: k.id }); s.banner(k.player ? 'YOU DROPPED THE RELIC!' : 'RELIC DROPPED!', '#ffd27a', 1.2);
  },
  aiGoal(s, k, nearestRival) {
    const T = s.temple, O = s.obj, E = s.E; if (!T) return null;
    let g = null;
    if (s.objective === 'relic') {
      if (k.relic) { const d = Math.hypot(k.x, k.z) || 1; g = [k.x / d * 8, k.z / d * 8]; }
      else {
        let bd = 1e9; for (const r of T.relics) { if (!r.alive || r.holder || (r.cool > 0 && r.from === k)) continue; const d = Math.hypot(r.x - k.x, r.z - k.z) + (s.rng() - 0.5) * 10; if (d < bd) { bd = d; g = [r.x, r.z]; } }
        if (k.wpn.t <= 0) for (const o of s.karts) if (o !== k && o.relic && !o.out && Math.hypot(o.x - k.x, o.z - k.z) < 26) { g = [o.x + o.vx * 0.4, o.z + o.vz * 0.4]; break; }
      }
    } else if (s.objective === 'glow') {
      let bd = 1e9; for (const o of s.props.orbs) { if (!o.alive || (o.cool > 0 && o.from === k)) continue; const d = Math.hypot(o.gx - k.x, o.gz - k.z) + (s.rng() - 0.5) * 6; if (d < bd) { bd = d; g = [o.gx, o.gz]; } }
      if (bd > 45 && k.wpn.t <= 0) { const r = nearestRival(); if (r && Math.hypot(r.x - k.x, r.z - k.z) < 20) g = [r.x + r.vx * 0.4, r.z + r.vz * 0.4]; }
    } else if (s.objective === 'hill') {
      const z = E.zones[O.zone], a = s.t * 0.5 + k.slot; g = [z.x + Math.sin(a) * z.r * 0.4, z.z + Math.cos(a) * z.r * 0.4];
      if (Math.hypot(z.x - k.x, z.z - k.z) < z.r * 1.6) { const r = nearestRival(); if (r && r.inZone) g = [r.x, r.z]; }
    } else if (s.objective === 'flag') {
      const F = O.flag; if (F.holder === k) { const c = E.captures[O.capture]; g = [c.x, c.z]; } else if (F.holder) g = [F.holder.x + F.holder.vx * 0.5, F.holder.z + F.holder.vz * 0.5]; else g = [F.x, F.z];
    } else { const r = nearestRival(); if (r) g = [r.x + r.vx * 0.5, r.z + r.vz * 0.5]; }
    if (!g) { const c = CART_TEMPLE.courts[k.slot % 4] * Math.PI / 180; g = [Math.cos(c) * 58, Math.sin(c) * 58]; }
    k.tgoal = g; k.ai.tgtT = Math.min(k.ai.tgtT, 0.3);
    return { goal: cartTempleRoute(s, k, g[0], g[1]) };
  },
  hud(s, ctx, W, H, top, left) {
    const T = s.temple, C = CART_TEMPLE, k = s.player; if (!T || !k) return;
    const portrait = H > W, y = portrait ? top + 58 + 5 * 17 + 14 : top + 50;   // between the objective panel and the generic zone text
    const r = T.order.find(i => T.rings[i].state === 'standing'), burning = T.order.find(i => T.rings[i].state === 'burning');
    if (burning !== undefined) BurnsUI.text(ctx, 'THE ' + C.RING_NAMES[burning] + ' RING IS BURNING!', W / 2, y, 13, 0.5 + 0.5 * Math.sin(s.time * 9) > 0.5 ? '#ff7a2a' : '#ffb050', { glow: '#ff4a10' });
    else if (r !== undefined) BurnsUI.text(ctx, 'NEXT BURN IN ' + cartFmtClock(T.next) + ' · ' + C.RING_NAMES[r] + ' RING', W / 2, y, 12, T.next < 6 ? '#ff7a2a' : '#ffd8a0', { ui: true });
    else BurnsUI.text(ctx, 'THE MAZE HAS BURNED · OPEN PLAZA', W / 2, y, 12, '#ffb050', { ui: true });
    if (k.ghostT > 0 && s.state === 'race') BurnsUI.text(ctx, 'SPIRIT DASH ' + k.ghostT.toFixed(1) + 's', W / 2, y + 18, 12, '#9af0ff', { glow: '#38a0c0' });
    if (k.steerFlipT > 0 && s.state === 'race') BurnsUI.text(ctx, 'STEERING FLIPPED!', W / 2, y + 36, 12, '#c86aff', {});
    if (s.objective === 'relic' && s.state === 'race') {
      let tgt = null;
      if (k.relic) { tgt = { x: 0, y: 6, z: 0 }; BurnsUI.text(ctx, 'CARRYING A RELIC · TO THE ALTAR!', W / 2, y + 18, 13, '#ffd27a', { glow: '#c07a20' }); }
      else { let bd = 1e9; for (const q of T.relics) { if (!q.alive || q.holder) continue; const d = Math.hypot(q.x - k.x, q.z - k.z); if (d < bd) { bd = d; tgt = { x: q.x, y: q.y + 2.5, z: q.z }; } } }
      if (tgt) { const p = {}; if (s.R.project(tgt.x, tgt.y, tgt.z, W, H, p)) { const x = clamp(p.x, 30, W - 30), yy = clamp(p.y, 70, H - 120); ctx.save(); ctx.translate(x, yy); ctx.fillStyle = k.relic ? '#7aff8a' : '#ffd27a'; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-9, -6); ctx.lineTo(9, -6); ctx.closePath(); ctx.fill(); ctx.restore(); } }
    }
  },
  draw(s, R, S, t) {
    const T = s.temple, C = CART_TEMPLE, cam = s.cam, fx = s.fx; if (!T) return;
    const cx = cam.x, cz = cam.z;
    // burning walls: flames along the lattice, smoke, a warm glow over each panel
    for (const p of T.P) {
      if (!p.alive || p.burn <= 0) continue;
      const dx = p.cx - cx, dz = p.cz - cz, d2 = dx * dx + dz * dz; if (d2 > 95 * 95) continue;
      const k = p.burn < 1.2 ? p.burn / 1.2 : 1, sx = Math.sin(p.yaw), sz = Math.cos(p.yaw);
      if (Math.random() < 0.6 * k) { const u = (Math.random() - 0.5) * p.len; fx.fire(p.cx + sx * u, 0.4 + Math.random() * 2.3, p.cz + sz * u, 1.3); }
      if (Math.random() < 0.06 * k) { const u = (Math.random() - 0.5) * p.len; fx.add(p.cx + sx * u, 2.8, p.cz + sz * u, (Math.random() - 0.5), 1.6 + Math.random(), (Math.random() - 0.5), 2.2, 1.2, 3.6, [0.25, 0.2, 0.2], 0.4, 'smoke', 4, Math.random() * 6, 0.3); }
      if (d2 < 70 * 70) R.bbs.bb(p.cx, 1.8, p.cz, p.len * 0.9, 4, S.glow, [1, 0.5, 0.15], 0.3 * k, true);
    }
    // the fallen rings: embers on the ground, sparks drifting up
    for (const e of T.embers) {
      const dx = e.x - cx, dz = e.z - cz; if (dx * dx + dz * dz > 90 * 90) continue;
      const a = Math.max(0.12, 1 - e.t / 100) * (0.75 + 0.25 * Math.sin(t * 3 + e.x));
      R.flat.flat(e.x, 0.07, e.z, 2.2, e.len * 1.05, e.yaw, S.glow, [1, 0.45, 0.12], 0.55 * a, true);
      if (Math.random() < 0.05 * a) { const u = (Math.random() - 0.5) * e.len; fx.add(e.x + Math.sin(e.yaw) * u, 0.2, e.z + Math.cos(e.yaw) * u, (Math.random() - 0.5) * 0.8, 0.8 + Math.random() * 1.2, (Math.random() - 0.5) * 0.8, 2 + Math.random() * 1.5, 0.14, 0.04, [1, 0.6, 0.2], 1, 'dot', 1 | 32); }
    }
    // embers and smoke in the night air (more as the maze burns)
    const ember = 0.25 + T.burnedRings * 0.3 + (T.order.some(i => T.rings[i].state === 'burning') ? 0.6 : 0);
    if (Math.random() < ember) { const a = Math.random() * TAU, d = 5 + Math.random() * 30; fx.add(cam.tx + Math.cos(a) * d, cam.ty - 1 + Math.random() * 7, cam.tz + Math.sin(a) * d, (Math.random() - 0.5) * 1.5, 0.6 + Math.random() * 0.8, (Math.random() - 0.5) * 1.5, 2.5 + Math.random() * 2, 0.16, 0.05, [1, 0.55 + Math.random() * 0.25, 0.2], 0.9, 'dot', 1 | 32); }
    if (Math.random() < 0.12 + T.burnedRings * 0.08) { const a = Math.random() * TAU, d = 10 + Math.random() * 30; fx.add(cam.tx + Math.cos(a) * d, cam.ty + 1 + Math.random() * 5, cam.tz + Math.sin(a) * d, 0.6, 0.5, 0.3, 4, 2.5, 6, [0.3, 0.24, 0.26], 0.18, 'smoke', 4, Math.random() * 6, 0.2); }
    // the altar ring and the spire's heart
    const pulse = 0.7 + 0.3 * Math.sin(t * 2.5);
    R.flat.flat(0, 0.09, 0, C.ALTAR_R * 2, C.ALTAR_R * 2, t * 0.25, S.ring, [1, 0.8, 0.35], 0.75 * pulse, true);
    R.flat.flat(0, 0.08, 0, C.ALTAR_R * 1.6, C.ALTAR_R * 1.6, 0, S.glow, [1, 0.6, 0.2], 0.25, true);
    R.bbs.bb(0, 8, 0, 9 + Math.sin(t * 3) * 0.6, 9 + Math.sin(t * 3) * 0.6, S.glow, [1, 0.65, 0.3], 0.55, true);
    R.bbs.bb(0, 25.4, 0, 4, 4, S.glow, [1, 0.8, 0.45], 0.8, true);
    if (Math.random() < 0.5) fx.fire(0 + (Math.random() - 0.5) * 1.5, 7.2, (Math.random() - 0.5) * 1.5, 1.2);
    // relics: totems bob on their spots and ride above the car that carries them
    for (const r of T.relics) {
      const o = r.obj; o.visible = !!r.alive;
      if (!r.alive) continue;
      if (r.holder) { const h = r.holder; o.x = h.x; o.z = h.z; o.y = h.y + h.M.h + 0.5; o.yaw = t * 2; R.bbs.bb(o.x, o.y + 1.3, o.z, 3.2, 3.2, S.glow, [1, 0.8, 0.4], 0.6, true); }
      else { o.x = r.x; o.z = r.z; o.y = r.y + 0.2 + Math.sin(t * 2.2 + r.ph) * 0.18; o.yaw = t * 0.9 + r.ph; R.bbs.bb(o.x, o.y + 1.3, o.z, 3, 3, S.glow, [1, 0.8, 0.4], 0.55, true); R.bbs.streak(o.x, o.y + 7, o.z, 0, 1, 0, 14, 1.2, S.streak, [1, 0.82, 0.45], 0.35); if (Math.random() < 0.25) fx.glint(o.x + (Math.random() - 0.5), o.y + 1 + Math.random(), o.z + (Math.random() - 0.5), '#ffd27a'); }
    }
    // spirits: a pale translucent shell around a ghosted car
    for (const k of s.karts) {
      if (k.ghostT > 0 && k._in) { const a = Math.min(1, k.ghostT * 2) * (0.5 + 0.15 * Math.sin(t * 12)); R.bbs.bb(k.x, k.y + 1.6, k.z, k.M.len + 2, k.M.len + 2, S.bubble, [0.7, 0.95, 1], a * 0.8, false); R.bbs.bb(k.x, k.y + 1.6, k.z, k.M.len + 4, k.M.len + 4, S.glow, [0.5, 0.9, 1], a * 0.5, true); }
      if (k.steerFlipT > 0 && k._in) R.bbs.bb(k.x, k.y + k.M.h + 1.2, k.z, 1.6, 1.6, S.arrow, [0.8, 0.45, 1], 0.8, true, t * 6);
    }
  },
  lights(s, add) {
    const T = s.temple; if (!T) return;
    add(0, 8, 0, 28, [1, 0.6, 0.25], 1.0, 1.5);
    for (const r of T.relics) if (r.alive) add(r.x, r.y + 1.2, r.z, 7, [1, 0.78, 0.4], 0.7, 1);
    for (const k of s.karts) if (k.ghostT > 0) add(k.x, k.y + 1.5, k.z, 9, [0.5, 0.9, 1], 0.9, 1.5);
    for (const sh of s.shots) if (sh.fx === 'incense') add(sh.x, sh.y + 1, sh.z, 8, [0.7, 0.35, 1], 0.6, 1);
    // burning spokes and the odd panel between the fire entries
    let n = 0; for (const p of T.P) { if (!p.alive || p.burn <= 0 || p.fire || (p.idx % 4) !== 2) continue; add(p.cx, 1.8, p.cz, 8, [1, 0.5, 0.15], 0.9, 1); if (++n > 24) break; }
  }
};
/* ---------------- the menu card icon: a lattice spire with flames ---------------- */
CART_ARENA_ICONS.temple = (ctx, s, t, col) => {
  ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.5); ctx.lineTo(-s * 0.12, -s * 0.78); ctx.lineTo(s * 0.12, -s * 0.78); ctx.lineTo(s * 0.5, s * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) { const y = s * 0.5 - i * s * 0.32, w = s * (0.5 - i * 0.1), w2 = s * (0.5 - (i + 1) * 0.1); ctx.beginPath(); ctx.moveTo(-w - s * 0.1, y); ctx.lineTo(w + s * 0.1, y); ctx.moveTo(-w, y); ctx.lineTo(w2, y - s * 0.32); ctx.moveTo(w, y); ctx.lineTo(-w2, y - s * 0.32); ctx.stroke(); }
  ctx.fillStyle = '#ffd27a'; ctx.beginPath(); ctx.arc(0, -s * 0.2, s * 0.09 + Math.sin(t * 4) * s * 0.02, 0, TAU); ctx.fill();
  for (let i = 0; i < 5; i++) { const fx = (i - 2) * s * 0.34, h = s * (0.3 + 0.22 * Math.abs(Math.sin(t * 6 + i * 1.7))); ctx.fillStyle = i % 2 ? '#ff6a1a' : '#ffb040'; ctx.beginPath(); ctx.moveTo(fx - s * 0.15, s * 0.62); ctx.quadraticCurveTo(fx - s * 0.12, s * 0.62 - h * 0.6, fx, s * 0.62 - h); ctx.quadraticCurveTo(fx + s * 0.12, s * 0.62 - h * 0.6, fx + s * 0.15, s * 0.62); ctx.fill(); }
};

/* ---------------- the world ---------------- */
CartWorlds.arena_temple = function (A, night) {
  const C = CART_TEMPLE, D2R = Math.PI / 180, L = cartTempleLayout();
  const E = this.base(2006, [-140, -140, 140, 140], '#c4a07c', 0.3);
  const sky = Object.assign(CART_SKIES.night(), { hor: '#ff7a2a', fog: '#3a2226', zen: '#08060f', sky: '#4a3a66', cityCol: '#ff8a3a', cityK: 0.85, emB: 2.1, keyK: 0.5, rim: '#ff9a5a', mid: '#2a1430', midK: 0.35, fogD: 0.0068 });
  Object.assign(E, { id: 'temple', arena: A, sky, tod: 'night', music: 'kart3', night: true });
  const api = E.api, rng = mulberry32(51), wallClear = (x, z, m) => L.every(p => cartTempleSegD(x, z, p) > m);
  // ground: ash bands under the rings, worn corridor paths, a sand mandala on the altar, courtyard circles
  api.paint((ctx, P, S) => {
    const c = P(0, 0);
    for (const r of [30, 58, 86, 110]) { ctx.strokeStyle = 'rgba(150,118,86,0.3)'; ctx.lineWidth = 10 * S; ctx.beginPath(); ctx.arc(c[0], c[1], r * S, 0, TAU); ctx.stroke(); }
    for (const r of C.R) { ctx.strokeStyle = 'rgba(60,40,28,0.4)'; ctx.lineWidth = 2.4 * S; ctx.beginPath(); ctx.arc(c[0], c[1], r * S, 0, TAU); ctx.stroke(); }
    for (let i = 0; i < 16; i++) { const a0 = i / 16 * TAU, a1 = (i + 1) / 16 * TAU, am = (a0 + a1) / 2; ctx.fillStyle = i % 2 ? 'rgba(200,90,50,0.35)' : 'rgba(230,180,90,0.35)'; ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0] + Math.cos(a0) * 16 * S, c[1] + Math.sin(a0) * 16 * S); ctx.quadraticCurveTo(c[0] + Math.cos(am) * 30 * S, c[1] + Math.sin(am) * 30 * S, c[0] + Math.cos(a1) * 16 * S, c[1] + Math.sin(a1) * 16 * S); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,230,180,0.7)'; ctx.lineWidth = 0.6 * S; ctx.setLineDash([2 * S, 2 * S]); ctx.beginPath(); ctx.arc(c[0], c[1], C.ALTAR_R * S, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(90,60,40,0.5)'; ctx.beginPath(); ctx.arc(c[0], c[1], 7 * S, 0, TAU); ctx.fill();
    for (const deg of C.courts) { const q = P(Math.cos(deg * D2R) * 58, Math.sin(deg * D2R) * 58); ctx.fillStyle = 'rgba(235,205,160,0.3)'; ctx.beginPath(); ctx.arc(q[0], q[1], 11 * S, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(200,90,50,0.45)'; ctx.lineWidth = 0.8 * S; ctx.beginPath(); ctx.arc(q[0], q[1], 9 * S, 0, TAU); ctx.stroke(); }
    for (let i = 0; i < 220; i++) { const x = (rng() - 0.5) * 270, z = (rng() - 0.5) * 270, q = P(x, z); ctx.fillStyle = `rgba(${rng() < 0.5 ? '90,64,50' : '230,200,170'},${0.05 + rng() * 0.08})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (2 + rng() * 7) * S, (1 + rng() * 4) * S, rng() * 3, 0, TAU); ctx.fill(); }
  });
  // the altar spire: four tapering legs, five square tiers with X braces and eaves, a glowing heart lantern, a finial
  CartScene.mesh(api, 0, 0, 0, m => {
    const tiers = [[6.2, 0], [5.0, 5], [3.8, 10], [2.6, 15], [1.5, 20]];
    for (let t = 0; t < 4; t++) {
      const [r0, y0] = tiers[t], [r1, y1] = tiers[t + 1];
      m.color('#b8865a').shine(1);
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) m.limb(sx * r0, y0, sz * r0, sx * r1, y1, sz * r1, 0.32, 0.26, { seg: 6 });
      m.color('#d8ae7c');
      const q = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
      for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4]; m.limb(a[0] * r1, y1, a[1] * r1, b[0] * r1, y1, b[1] * r1, 0.14, 0.14, { seg: 5 }); m.limb(a[0] * r0, y0, a[1] * r0, b[0] * r1, y1, b[1] * r1, 0.08, 0.08, { seg: 4 }); m.limb(b[0] * r0, y0, b[1] * r0, a[0] * r1, y1, a[1] * r1, 0.08, 0.08, { seg: 4 }); }
      m.color(t % 2 ? '#8a5a3a' : '#a06a44'); m.box(0, y1 + 0.2, 0, r1 * 2 + 1.8, 0.32, r1 * 2 + 1.8);
    }
    m.color('#e8c890'); m.limb(0, 20, 0, 0, 25, 0, 0.3, 0.06, { seg: 6 });
    m.color('#ffb050', 1).shine(2); m.ball(0, 8, 0, 1.5, { seg: 12, rings: 8 }); m.ball(0, 25.3, 0, 0.5, { seg: 8, rings: 6 });
    m.color('#ff9a3a', 0.7); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; m.push(); m.tf(Math.cos(a) * 3.9, 0, Math.sin(a) * 3.9, 0); m.lathe([[0, 0], [0.25, 0.05], [0.34, 0.35], [0.25, 0.66], [0, 0.7]], { seg: 7 }); m.pop(); m.color('#5a3a2a', 0); m.limb(Math.cos(a) * 3.9, 0, Math.sin(a) * 3.9, Math.cos(a) * 3.9, 2.2, Math.sin(a) * 3.9, 0.06, 0.06, { seg: 4 }); m.color('#ff9a3a', 0.7); }
    m.emissive(0).shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: C.SPIRE_R, y0: 0, y1: 24 }] };
  }, { hi: true });
  api.glow(0, 8, 0, 7, '#ffb060'); api.glow(0, 25.3, 0, 3, '#ffd080'); api.light(0, 0, 36, '#ff9a3a', 0.85);
  E.art.push({ x: 0, z: 0, r: C.SPIRE_R + 0.5 });
  // four courtyards: a ring of lantern posts, a light pool
  for (const deg of C.courts) {
    const cx = Math.cos(deg * D2R) * 58, cz = Math.sin(deg * D2R) * 58;
    for (let i = 0; i < 3; i++) {
      const a = deg * D2R + i / 3 * TAU + 0.5, x = cx + Math.cos(a) * 5.5, z = cz + Math.sin(a) * 5.5;
      CartScene.mesh(api, x, z, 0, m => { m.color('#8a5a3a').shine(1); m.limb(0, 0, 0, 0, 3.4, 0, 0.1, 0.08, { seg: 5 }); m.limb(0, 3.3, 0, 0.8, 3.1, 0, 0.05, 0.05, { seg: 4 }); m.color(i % 2 ? '#ff9a3a' : '#ffd060', 0.95); m.push(); m.tf(0.8, 2.3, 0, 0); m.lathe([[0, 0], [0.3, 0.05], [0.4, 0.45], [0.3, 0.75], [0, 0.8]], { seg: 8 }); m.pop(); m.emissive(0).shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.2, y0: 0, y1: 3.4 }] }; }, { noAO: true });
      api.glow(x + 0.8, 2.7, z, 1.8, i % 2 ? '#ffb060' : '#ffe090');
    }
    api.light(cx, cz, 15, '#ffb060', 0.6);
  }
  // orange lamps around the outer corridor, a hero or two, camps and a crowd beyond the trash fence
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.15, x = Math.cos(a) * 113, z = Math.sin(a) * 113; CartScene.lamp(api, x, z, i % 3 ? '#ff9a3a' : '#ffd27a', true); }
  const poly = []; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; poly.push([Math.sin(a) * C.PERIM, Math.cos(a) * C.PERIM]); }
  this.perimeter(E, poly, 'fence');
  let ni = 5; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.5; CartScene.camp(api, Math.sin(a) * 130, Math.cos(a) * 130, a + Math.PI, rng, true, ni++); }
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 1.6, x = Math.sin(a) * 123, z = Math.cos(a) * 123; for (let k = 0; k < 12; k++) E.spots.push({ x: x + (rng() - 0.5) * 14, z: z + (rng() - 0.5) * 5, yaw: a + Math.PI + (rng() - 0.5) * 0.5 }); }
  E.heroes.push(
    { type: 'lamplighter', x: Math.cos(20 * D2R) * 58 + 2, z: Math.sin(20 * D2R) * 58 - 3, yaw: 2.5, anim: 'lantern' },
    { type: 'firespinner', x: Math.cos(200 * D2R) * 58, z: Math.sin(200 * D2R) * 58 + 1, yaw: 0.4, anim: 'firespin' },
    { type: 'playaartist', x: 9, z: -9, yaw: -2.3, anim: 'cheer' },
    { type: 'crusty', x: Math.cos(290 * D2R) * 58 - 2, z: Math.sin(290 * D2R) * 58, yaw: 1.2, anim: 'wave' },
    { type: 'darkwad', x: Math.cos(110 * D2R) * 58, z: Math.sin(110 * D2R) * 58 - 2, yaw: -0.8, anim: 'dance' }
  );
  // objective spots: the altar + the four courtyards; orbs in every corridor; flags and captures; gifts; the grid
  E.zones = [{ x: 0, z: 0, r: 12, name: 'THE ALTAR' }].concat(['LANTERN COURT', 'EMBER COURT', 'DUST COURT', 'MOON COURT'].map((name, i) => ({ x: Math.cos(C.courts[i] * D2R) * 58, z: Math.sin(C.courts[i] * D2R) * 58, r: 9, name })));
  for (const [r, n] of [[30, 8], [58, 12], [86, 12], [110, 8]]) for (let i = 0; i < n; i++) { let x = 0, z = 0; for (let tries = 0; tries < 30; tries++) { const a = rng() * TAU; x = Math.cos(a) * r; z = Math.sin(a) * r; if (wallClear(x, z, 5)) break; } E.orbSpots.push({ x, z }); }
  E.flagSpots = [50, 170, 290].map(d => ({ x: Math.cos(d * D2R) * 86, z: Math.sin(d * D2R) * 86 }));
  E.captures = C.courts.map(d => ({ x: Math.cos(d * D2R) * 58, z: Math.sin(d * D2R) * 58, r: 8 }));
  for (const [r, d] of [[27, 45], [27, 135], [27, 225], [27, 315], [58, 20], [58, 110], [58, 200], [58, 290], [86, 35], [86, 155], [86, 215], [86, 335], [110, 65], [110, 245]]) E.gifts.push({ x: Math.cos(d * D2R) * r, z: Math.sin(d * D2R) * r });
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = (i * 45 + 10) * D2R; E.spawn.push({ x: Math.cos(a) * 110, z: Math.sin(a) * 110, yaw: Math.atan2(-Math.sin(a), Math.cos(a)) }); }
  return this.finish(E);
};
