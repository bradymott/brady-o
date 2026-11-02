/* ============================================================
   Brady-O World — the Black Rock City overworld map (BRCMapScene)
   A hand-drawn festival map at dusk: cracked playa, the city arc of
   camps, the Man, the Temple, deep-playa art, Gate Road traffic,
   art cars, LED bikes, lasers and a dusty fog of war.
   World units: the Man stands at (0,0); a node's BRC address
   (clock, r) maps to x = sin(clock) * r, y = -cos(clock) * r,
   so 12:00 (the Temple) is up and Gate Road leaves 6:00 downward.
   Static layers are cached as 512px tiles (close view) and one
   whole-map canvas (overview); only the living bits redraw.
   ============================================================ */
const BRCM = {
  ESP: 100, ESP_W: 6.5, RING_W: 3.4, RAD_W: 3.4, RAD_W_MAJOR: 4.6,
  LETTERS: 'ABCDEFGHIJK',
  FENCE_R: 372,                                      // circumradius of the trash-fence pentagon
  B: { x0: -392, y0: -404, x1: 392, y1: 500 },       // map bounds
  TILE: 256,                                         // tile size, device px
  TILE_MAX: 120,                                     // tile canvases kept (256 KB each)
  CC: { c: 6, r: 128, tent: 13, plaza: 22.5, road: 25 },   // Center Camp
  PLAZAS: [{ c: 3, r: 184, rad: 14 }, { c: 9, r: 184, rad: 14 }, { c: 4.5, r: 184, rad: 8.5 }, { c: 7.5, r: 184, rad: 8.5 }],
  ACCENT: { 41: '#ffb35a', 42: '#ffd84a', 43: '#ff5fd8', 44: '#45e6d2', 45: '#64b4ff', 46: '#b48aff', 47: '#ffa24a', 48: '#a6ff5e', 49: '#ff8f9e' },
  LIGHTS: ['#ff4fd8', '#4af2ff', '#ffd84a', '#7dff6a', '#ff7a3a', '#a07bff', '#fff1d6', '#ff5a7a'],
  NIGHT: '#120b1b',
  TYPE: { ow: 'Overworld', under: 'Underground', sky: 'Sky', water: 'Underwater', tower: 'Tower climb', castle: 'Camp boss', auto: 'Auto-scroll' }
};
const BRCM_PAL = {
  tent: ['#e8553f', '#f29a3a', '#f3d046', '#38b2a2', '#3a78d4', '#8b5bd6', '#d6458f', '#5dbb48', '#ece5d8', '#2fa3c7', '#c43c5c', '#f07b52'],
  shade: ['#e2e6ec', '#d6dae1', '#2d2a36', '#cbb690', '#ebe6dc', '#4a3f5e', '#e0e4ea'],
  dome: ['#f0f2f7', '#e4e8f0', '#f3dfb2', '#c9d8f2', '#ead2ea', '#f4f4f4'],
  rv: ['#f2f0e9', '#e8e0d0', '#f7f4ed', '#ded7c7', '#d2d8df'],
  stripe: ['#c0392b', '#2c6fbb', '#2e8b57', '#d68a1f', '#6d4bb3', '#1f8a8a'],
  box: ['#b5482f', '#2f62a6', '#3e7d4f', '#c58b2a', '#7a7f87', '#8a3b6b'],
  para: [['#e8553f', '#f3d046'], ['#3a78d4', '#ece5d8'], ['#d6458f', '#8b5bd6'], ['#38b2a2', '#f29a3a'], ['#5dbb48', '#f3d046']]
};

const brcmRingR = i => 112 + i * 12;                              // lettered streets: 0 = A ... 10 = K
const brcmAng = c => c / 12 * TAU;                                // clockwise from 12:00
const brcmXY = (c, r) => { const a = brcmAng(c); return { x: Math.sin(a) * r, y: -Math.cos(a) * r }; };
const brcmCanvasAng = c => brcmAng(c) - Math.PI / 2;               // for ctx.arc
function brcmClockDiff(c0, c1) { let d = (c1 - c0) % 12; if (d > 6) d -= 12; if (d < -6) d += 12; return d; }
function brcmHash(a, b, c) {
  let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(((b | 0) + 0x632be5ab) | 0, 0xc2b2ae35) ^ Math.imul(((c | 0) + 0x27d4eb2f) | 0, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d); h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}
function brcmNoise(x, y, cell, seed) {      // smooth value noise, 0..1
  const gx = x / cell, gy = y / cell, ix = Math.floor(gx), iy = Math.floor(gy);
  const fx = gx - ix, fy = gy - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const s = seed || 7;
  return lerp(lerp(brcmHash(ix, iy, s), brcmHash(ix + 1, iy, s), sx), lerp(brcmHash(ix, iy + 1, s), brcmHash(ix + 1, iy + 1, s), sx), sy);
}
function brcmFencePts(inset) {              // trash-fence pentagon, one corner pointing at 12:00
  const R = BRCM.FENCE_R - (inset || 0) / Math.cos(Math.PI / 5), out = [];
  for (let i = 0; i < 5; i++) out.push(brcmXY(i * 2.4, R));
  return out;
}

/* ---------- path routing: follow the streets inside the city, curve across the open playa ---------- */
// hand-placed waypoints ([clock, r] polar legs, {x, y} straight legs) for paths that would overlap others
const BRCM_ROUTES = {
  '41-4>42-3': [[6, 312], [6.32, 300], [6.5, 262], [6.5, 160], [6, 160]],
  '43-3>48-1': [[3.5, 148], [3.5, 246], [4, 300]],
  '44-3>45-3': [[8.5, 148], [8.5, 95], [7.7, 76], [6.6, 64], [5.4, 64], [4.3, 62], [3.3, 55], [2, 58]],
  '48-4>46-1': [[0.6, 300], [0, 262], [11.25, 206], [10.55, 134], [10.25, 92], [9, 84]],
  '49-3>47-1': [[11.8, 136], [11.85, 104], [11.6, 84], { x: -12, y: -60 }, { x: -9, y: -36 }, { x: -9, y: -14 }, { x: -6, y: 9 }, { x: 0, y: 14 }]
};
const BRCM_SMOOTH = { '44-3>45-3': 3, '48-4>46-1': 3, '49-3>47-1': 3, '41-4>42-3': 1, '43-3>48-1': 2 };

function brcmSampleLegs(wps, step) {
  const out = [];
  const toXY = w => Array.isArray(w) ? brcmXY(w[0], w[1]) : w;
  for (let i = 0; i < wps.length - 1; i++) {
    const A = wps[i], B = wps[i + 1];
    if (Array.isArray(A) && Array.isArray(B)) {
      const d = brcmClockDiff(A[0], B[0]);
      const approx = Math.abs(d) / 12 * TAU * Math.max(A[1], B[1]) + Math.abs(B[1] - A[1]);
      const n = Math.max(1, Math.ceil(approx / step));
      for (let k = i ? 1 : 0; k <= n; k++) { const t = k / n; out.push(brcmXY(A[0] + d * t, lerp(A[1], B[1], t))); }
    } else {
      const a = toXY(A), b = toXY(B), n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step));
      for (let k = i ? 1 : 0; k <= n; k++) { const t = k / n; out.push({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }); }
    }
  }
  return out;
}
function brcmChaikin(pts, iters) {
  for (let it = 0; it < iters; it++) {
    const o = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      o.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 }, { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    o.push(pts[pts.length - 1]); pts = o;
  }
  return pts;
}
function brcmPolyline(pts) {               // -> { pts, cum, len }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, cum, len: cum[cum.length - 1] };
}
function brcmResample(pts, step) {
  const pl = brcmPolyline(pts), n = Math.max(1, Math.round(pl.len / step)), out = [];
  for (let k = 0; k <= n; k++) out.push(brcmAlong(pl, pl.len * k / n));
  return out;
}
function brcmAlong(pl, s) {                // point (and heading) at distance s along a polyline
  const { pts, cum } = pl;
  if (s <= 0) { const a = pts[0], b = pts[1] || a; return { x: a.x, y: a.y, dx: b.x - a.x, dy: b.y - a.y }; }
  if (s >= pl.len) { const a = pts[pts.length - 2] || pts[pts.length - 1], b = pts[pts.length - 1]; return { x: b.x, y: b.y, dx: b.x - a.x, dy: b.y - a.y }; }
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
  const a = pts[lo], b = pts[hi], k = (s - cum[lo]) / ((cum[hi] - cum[lo]) || 1);
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), dx: b.x - a.x, dy: b.y - a.y };
}
function brcmRoute(A, B) {
  const key = A.id + '>' + B.id;
  let wps = BRCM_ROUTES[key];
  if (!wps) {
    const city = n => n.r >= 99 && n.r <= 240, d = brcmClockDiff(A.clock, B.clock);
    if (Math.abs(d) < 1e-6 || A.r < 1 || B.r < 1) wps = [brcmXY(A.clock, A.r), brcmXY(B.clock, B.r)];
    else if (city(A) && city(B)) {
      if (Math.abs(A.r - B.r) < 0.5) wps = [[A.clock, A.r], [B.clock, B.r]];
      else if (A.r < B.r) wps = [[A.clock, A.r], [B.clock, A.r], [B.clock, B.r]];      // along the inner ring, then out the radial
      else wps = [[A.clock, A.r], [A.clock, B.r], [B.clock, B.r]];                      // in along the radial, then around the ring
    } else if (city(A) && B.r < 99) wps = [[A.clock, A.r], [A.clock, 95], [B.clock, B.r]];
    else if (city(B) && A.r < 99) wps = [[A.clock, A.r], [B.clock, 95], [B.clock, B.r]];
    else wps = [[A.clock, A.r], [B.clock, B.r]];
  }
  let pts;
  const sm = BRCM_SMOOTH[key];
  if (sm) pts = brcmResample(brcmChaikin(brcmSampleLegs(wps, 9), sm), 2.5);
  else pts = brcmSampleLegs(wps, 2.5);
  const a = brcmXY(A.clock, A.r), b = brcmXY(B.clock, B.r);
  pts[0] = { x: a.x, y: a.y }; pts[pts.length - 1] = { x: b.x, y: b.y };
  return pts;
}

/* ---------- fog-of-war regions (world shapes; sec = [clock0, clock1, r0, r1]) ---------- */
const BRCM_REGIONS = {
  41: [{ rect: [-64, 246, 64, 506] }],
  42: [{ sec: [4.75, 7.25, 58, 248] }],
  43: [{ sec: [1.8, 4.75, 92, 244] }],
  44: [{ sec: [7.25, 10.2, 92, 420] }],
  45: [{ sec: [0.9, 4.75, 24, 92] }],
  46: [{ sec: [7.25, 11.55, 24, 92] }],
  47: [{ circ: [0, 0, 27] }, { sec: [11.55, 12.9, 0, 82] }],
  48: [{ sec: [0.2, 4.75, 244, 390] }],
  49: [{ sec: [11.55, 12.95, 82, 168] }]
};
function brcmRegionPath(ctx, w) {
  // region outlines are traced as polygons whose edges bulge outward by a little noise, so the
  // dust veil has soft, organic borders instead of geometric sectors (regions only ever grow,
  // so neighbouring regions overlap rather than leaving slivers of fog between them)
  const wob = (x, y) => brcmNoise(x + 900, y + 900, 30, 19) * 24;
  const poly = pts => { pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); };
  const edge = (pts, ax, ay, bx, by, nx, ny) => {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 7));
    for (let k = 0; k < n; k++) { const x = lerp(ax, bx, k / n), y = lerp(ay, by, k / n), d = wob(x, y); pts.push([x + nx * d, y + ny * d]); }
  };
  ctx.beginPath();
  for (const sh of BRCM_REGIONS[w] || []) {
    const pts = [];
    if (sh.rect) {
      const [x0, y0, x1, y1] = sh.rect;
      edge(pts, x0, y0, x1, y0, 0, -1); edge(pts, x1, y0, x1, y1, 1, 0); edge(pts, x1, y1, x0, y1, 0, 1); edge(pts, x0, y1, x0, y0, -1, 0);
    } else if (sh.circ) {
      const [cx, cy, r] = sh.circ;
      for (let k = 0; k < 32; k++) { const a = k / 32 * TAU, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r, d = wob(x, y) * 0.6; pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]); }
    } else {
      const [c0, c1, r0, r1] = sh.sec, arc = (c, r) => { const a = brcmCanvasAng(c); return [Math.cos(a) * r, Math.sin(a) * r, Math.cos(a), Math.sin(a)]; };
      const nO = Math.max(4, Math.ceil((c1 - c0) / 12 * TAU * r1 / 7));
      for (let k = 0; k <= nO; k++) { const [x, y, ux, uy] = arc(lerp(c0, c1, k / nO), r1), d = wob(x, y); pts.push([x + ux * d, y + uy * d]); }
      const [ex, ey] = arc(c1, 1), tx1 = -ey, ty1 = ex;            // tangent (clockwise) at c1
      edge(pts, ex * r1, ey * r1, ex * r0, ey * r0, tx1, ty1);
      if (r0 > 0) {
        const nI = Math.max(2, Math.ceil((c1 - c0) / 12 * TAU * r0 / 7));
        for (let k = 0; k <= nI; k++) { const [x, y, ux, uy] = arc(lerp(c1, c0, k / nI), r0), d = wob(x, y) * 0.8; pts.push([x - ux * d, y - uy * d]); }
      }
      const [sx, sy] = arc(c0, 1);
      edge(pts, sx * r0, sy * r0, sx * r1, sy * r1, sy, -sx);
    }
    poly(pts);
  }
}

function brcmInRegion(w, x, y) {
  const r = Math.hypot(x, y);
  let c = Math.atan2(x, -y) / TAU * 12; if (c < 0) c += 12;
  for (const sh of BRCM_REGIONS[w] || []) {
    if (sh.rect) { if (x >= sh.rect[0] && x <= sh.rect[2] && y >= sh.rect[1] && y <= sh.rect[3]) return true; }
    else if (sh.circ) { if (Math.hypot(x - sh.circ[0], y - sh.circ[1]) <= sh.circ[2]) return true; }
    else { const [c0, c1, r0, r1] = sh.sec; if (r >= r0 && r <= r1 && ((c >= c0 && c <= c1) || (c + 12 >= c0 && c + 12 <= c1))) return true; }
  }
  return false;
}

/* ---------- static geometry (built once, deterministic) ---------- */
let BRCM_GEO = null;
function brcmGeo() { return BRCM_GEO || (BRCM_GEO = brcmBuildGeo()); }
function brcmBuildGeo() {
  const G = { nodes: {}, list: [], paths: [], adj: {}, items: [], lights: [], fires: [], lasers: [], blotches: [], tracks: [], peaks: [], art: [], signs: [] };
  for (const n of BRC_NODES) {
    const p = brcmXY(n.clock, n.r), w = +n.id.split('-')[0], i = +n.id.split('-')[1];
    const N = { id: n.id, n, x: p.x, y: p.y, w, i, boss: !!n.boss };
    G.nodes[n.id] = N; G.list.push(N); G.adj[n.id] = [];
  }
  BRC_PATHS.forEach((p, i) => {
    const A = BRC_NODES.find(n => n.id === p.from), B = BRC_NODES.find(n => n.id === p.to);
    if (!A || !B) return;
    const pl = brcmPolyline(brcmRoute(A, B));
    const P = Object.assign(pl, { i, p, from: p.from, to: p.to, secret: p.kind === 'secret', key: p.from + '>' + p.to });
    G.paths.push(P);
    G.adj[p.from].push({ P, other: p.to, dir: 1 });
    G.adj[p.to].push({ P, other: p.from, dir: -1 });
  });
  brcmBuildCity(G);
  brcmBuildPlaya(G);
  return G;
}

function brcmBuildCity(G) {
  const rng = mulberry32(0xB2C0FFEE);
  const rings = [BRCM.ESP]; for (let i = 0; i < 11; i++) rings.push(brcmRingR(i));
  const rw = i => i === 0 ? BRCM.ESP_W : BRCM.RING_W;
  const radW = c => (c === 3 || c === 6 || c === 9) ? BRCM.RAD_W_MAJOR : BRCM.RAD_W;
  const excl = [];
  for (const p of BRCM.PLAZAS) { const q = brcmXY(p.c, p.r); excl.push({ x: q.x, y: q.y, r: p.rad + 3.4 }); }
  const cc = brcmXY(BRCM.CC.c, BRCM.CC.r); excl.push({ x: cc.x, y: cc.y, r: BRCM.CC.road + 3.2 });
  G.excl = excl;
  const free = (x, y, s) => { for (const e of excl) if (Math.hypot(x - e.x, y - e.y) < e.r + s) return false; return true; };
  for (let g = 0; g < 11; g++) {
    const rIn = rings[g] + rw(g) / 2 + 0.6, rOut = rings[g + 1] - rw(g + 1) / 2 - 0.6, rm = (rIn + rOut) / 2;
    for (let k = 0; k < 16; k++) {
      const c0 = 2 + k * 0.5, c1 = c0 + 0.5;
      const a0 = brcmAng(c0) + (radW(c0) / 2 + 0.6) / rm, a1 = brcmAng(c1) - (radW(c1) / 2 + 0.6) / rm;
      const len = (a1 - a0) * rm;
      let u = 0;
      while (len - u > 5) {
        let L = rng.range(9, 16);
        if (len - u - L < 8) L = len - u;
        const la0 = a0 + u / rm, la1 = a0 + (u + L) / rm;
        brcmFillLot(G, { g, rIn, rOut, rm, a0: la0, a1: la1, len: L, depth: rOut - rIn, clock: (la0 + la1) / 2 / TAU * 12 }, rng, free);
        u += L + rng.range(0.6, 1.5);
      }
    }
  }
  // lamplighter lanterns: along the Esplanade and down the promenades to the Man and the Temple
  const lamp = (x, y) => G.lights.push({ x, y, c: 6, s: 0.9, ph: rng() * TAU, sp: rng.range(1, 2.4), tw: rng() < 0.1, lamp: true });
  for (let c = 2; c <= 10.001; c += 0.085) { const p = brcmXY(c, 96.2); lamp(p.x, p.y); }
  for (const c of [3, 6, 9]) for (let r = 20; r <= 92; r += 6) for (const s of [-1, 1]) { const a = brcmAng(c), p = brcmXY(c, r); lamp(p.x + Math.cos(a) * 2.6 * s, p.y + Math.sin(a) * 2.6 * s); }
  for (let y = -16; y >= -46; y -= 6) for (const s of [-1, 1]) lamp(3 * s, y);
  // street signs
  for (let c = 2; c <= 10.001; c += 0.5) {
    const p = brcmXY(c, 91.5), h = Math.floor(c), m = c % 1 ? '30' : '00';
    G.signs.push({ x: p.x, y: p.y, text: h + ':' + m, major: c % 1 === 0 });
  }
  for (let i = 0; i < 11; i++) for (const c of [1.86, 10.14, 4.25, 7.75]) {
    const p = brcmXY(c, brcmRingR(i));
    G.signs.push({ x: p.x, y: p.y, text: BRCM.LETTERS[i], letter: true });
  }
  // a few campfires at the plazas and Center Camp
  for (const p of BRCM.PLAZAS) { const q = brcmXY(p.c, p.r); if (p.rad > 10) G.fires.push({ x: q.x + 5, y: q.y + 4, ph: rng() * 9, big: true }); }
}

function brcmFillLot(G, L, rng, free) {
  const P = BRCM_PAL, D = L.depth;
  const at = (u, v) => { const a = L.a0 + (u / L.len) * (L.a1 - L.a0), r = L.rIn + v; return { x: Math.sin(a) * r, y: -Math.cos(a) * r, a }; };
  const put = (u, v, o) => { const p = at(u, v); if (!free(p.x, p.y, o.s || 1)) return null; o.x = p.x; o.y = p.y; o.a = p.a; G.items.push(o); return o; };
  const light = (u, v, c, s, tw) => { const p = at(u, v); if (!free(p.x, p.y, 0.4)) return; G.lights.push({ x: p.x, y: p.y, c, s: s || 1, ph: rng() * TAU, sp: rng.range(0.7, 2.8), tw: tw !== undefined ? tw && rng() < 0.6 : rng() < 0.11 }); };
  const tents = (u0, u1, v, rmin, rmax) => {
    let u = u0 + rmax;
    while (u < u1 - rmin) {
      const r = rng.range(rmin, rmax), kind = rng();
      if (kind < 0.16) put(u, v, { t: 'yurt', r: r * 1.15, s: r * 1.2 });
      else if (kind < 0.32) put(u, v, { t: 'cabin', w: r * 2.3, h: r * 1.6, s: r * 1.3, c: rng.pick(P.tent) });
      else put(u, v + rng.range(-0.25, 0.25), { t: 'tent', r, s: r, c: rng.pick(P.tent) });
      u += r * 2 + rng.range(0.35, 1.0);
    }
  };
  const sound = L.clock >= 2 && L.clock < 5;
  let style;
  if (L.g === 0) style = sound ? rng.pick(['stage', 'stage', 'bigdome', 'stage']) : rng.pick(['bigdome', 'shade', 'para', 'stage', 'bigdome']);
  else if (L.g <= 3) style = rng.weighted([['theme', 4], ['bigdome', 2], ['para', 1.5], ['stage', sound ? 2 : 0.4], ['village', 1]]);
  else if (L.g <= 6) style = rng.weighted([['theme', 2], ['village', 4], ['para', 1], ['res', 1.2]]);
  else style = rng.weighted([['res', 5], ['village', 2], ['theme', 0.6]]);
  const lc = rng.int(0, 7), lc2 = rng.pick([lc, rng.int(0, 7)]);
  if (style !== 'stage') {
    const nL = Math.max(2, Math.floor(L.len / (style === 'res' ? 5 : 2.9)));
    for (let i = 0; i < nL; i++) light((i + 0.5) * L.len / nL, 0.45, style === 'res' ? 6 : (i % 2 ? lc : lc2), 0.8);
  }
  switch (style) {
    case 'stage': {
      const w = Math.min(L.len * 0.62, 12), h = D * 0.42, uc = L.len / 2;
      put(uc, D - h / 2 - 0.35, { t: 'stage', w, h, s: w / 2 + 0.5, c: BRCM.LIGHTS[lc] });
      put(uc, D * 0.3, { t: 'floor', w: w * 0.86, h: D * 0.34, s: w / 2, c: lc, c2: lc2 });
      for (let i = 0; i < 6; i++) light(uc + rng.range(-w * 0.4, w * 0.4), D * rng.range(0.16, 0.44), rng.pick([lc, lc2, rng.int(0, 7)]), 1.15, true);
      if (L.g <= 1 && G.lasers.length < 7 && rng() < 0.55) { const p = at(uc, D * 0.55); G.lasers.push({ x: p.x, y: p.y, c: rng.pick(['#3dff8e', '#ff3b6b', '#42e8ff', '#c45bff', '#3dff8e']), ph: rng() * TAU, sp: rng.range(0.6, 1.1) }); }
      tents(0.2, uc - w / 2 - 0.3, D * 0.68, 0.75, 1.15); tents(uc + w / 2 + 0.3, L.len - 0.2, D * 0.68, 0.75, 1.15);
      break;
    }
    case 'bigdome': {
      const r = Math.min(D * 0.47, L.len * 0.3), u = r + 0.5 + rng() * Math.max(0, L.len - 2 * r - 1);
      const d = put(u, D / 2, { t: 'dome', r, s: r + 0.6, c: rng.pick(P.dome) });
      if (d) light(u, D / 2, lc, r * 1.05, rng() < 0.6);
      tents(0.1, u - r - 0.4, D * 0.5, 0.7, 1.1); tents(u + r + 0.4, L.len - 0.1, D * 0.5, 0.7, 1.1);
      break;
    }
    case 'shade': {
      put(L.len / 2, D * 0.45, { t: 'shade', w: L.len * 0.8, h: D * 0.66, s: L.len * 0.42, c: rng.pick(P.shade), c2: rng.pick(P.tent) });
      if (D > 6.5) tents(0.3, L.len - 0.3, D * 0.88, 0.5, 0.75);
      break;
    }
    case 'para': {
      const r = Math.min(D * 0.45, 4.6), u = r + 0.6 + rng() * Math.max(0, L.len - 2 * r - 1.2), cp = rng.pick(P.para);
      put(u, D / 2, { t: 'para', r, s: r + 0.4, c: cp[0], c2: cp[1], n: rng.pick([8, 10, 12]) });
      tents(0.1, u - r - 0.4, D * 0.55, 0.7, 1.1); tents(u + r + 0.4, L.len - 0.1, D * 0.55, 0.7, 1.1);
      if (rng() < 0.5) put(u + r * 0.8, D * 0.15, { t: 'flag', s: 2, c: rng.pick(P.tent) });
      break;
    }
    case 'theme': {
      const w = L.len * rng.range(0.36, 0.5), h = D * 0.56;
      put(w / 2 + 0.4, D * 0.36, { t: 'shade', w, h, s: w / 2 + 0.5, c: rng.pick(P.shade), c2: rng.pick(P.tent) });
      const r = Math.min(D * 0.34, 3);
      const d = put(L.len - r - 0.6, D * 0.5, { t: 'dome', r, s: r + 0.5, c: rng.pick(P.dome) });
      if (d) light(L.len - r - 0.6, D * 0.5, lc2, r * 1.1, rng() < 0.4);
      tents(w + 0.6, L.len - 2 * r - 1.1, D * 0.55, 0.6, 1.0);
      tents(0.2, w + 0.4, D * 0.86, 0.45, 0.7);
      put(0.5, 0.6, { t: 'flag', s: 2, c: rng.pick(P.tent) });
      break;
    }
    case 'village': {
      for (const v of [D * 0.3, D * 0.73]) tents(0.1, L.len - 0.1, v, 0.6, 1.15);
      if (rng() < 0.35) put(L.len * rng.range(0.2, 0.8), 0.6, { t: 'flag', s: 2, c: rng.pick(P.tent) });
      break;
    }
    case 'res': {
      let u = 0.4;
      while (u < L.len - 3) {
        const k = rng();
        if (k < 0.55) { const w = rng.range(4.2, 6.2), h = rng.range(1.9, 2.3); if (u + w > L.len - 0.2) break; put(u + w / 2, D * 0.3, { t: 'rv', w, h, s: w / 2 + 0.4, c: rng.pick(P.rv), c2: rng.pick(P.stripe) }); u += w + rng.range(0.5, 1.3); }
        else if (k < 0.8) { const w = rng.range(2.8, 3.4); put(u + w / 2, D * 0.28, { t: 'car', w, h: 1.55, s: w / 2 + 0.3, c: rng.pick(P.tent.concat(P.rv)) }); u += w + rng.range(0.4, 1.1); }
        else u += rng.range(1, 2.5);
      }
      if (rng() < 0.3) { const w = 6; put(L.len * 0.5, D * 0.76, { t: 'box', w, h: 2.4, s: 3.4, c: rng.pick(P.box) }); tents(0.1, L.len * 0.5 - 3.4, D * 0.76, 0.6, 1.0); tents(L.len * 0.5 + 3.4, L.len - 0.1, D * 0.76, 0.6, 1.0); }
      else tents(0.1, L.len - 0.1, D * 0.76, 0.6, 1.1);
      break;
    }
  }
  if (rng() < 0.065) { const p = at(L.len * rng.range(0.3, 0.7), D * 0.5); if (free(p.x, p.y, 1)) { G.fires.push({ x: p.x, y: p.y, ph: rng() * 9 }); } }
}

function brcmBuildPlaya(G) {
  const rng = mulberry32(0x9A1A);
  const B = BRCM.B;
  for (let i = 0; i < 120; i++) {
    G.blotches.push({ x: rng.range(B.x0, B.x1), y: rng.range(B.y0, B.y1), r: rng.range(24, 72), a: rng.range(0.05, 0.12), light: rng() < 0.55 });
  }
  // tyre and bike tracks across the open playa
  for (let i = 0; i < 34; i++) {
    const deep = i < 14, c = deep ? rng.range(10.4, 13.6) : rng.range(0, 12), r = deep ? rng.range(110, 300) : rng.range(25, 88);
    const p = brcmXY(c, r);
    G.tracks.push({ x: p.x + rng.range(-30, 30), y: p.y + rng.range(-30, 30), R: rng.range(40, 190), a0: rng() * TAU, span: rng.range(0.35, 1.1), dbl: rng() < 0.4 });
  }
  // illustrated mountain ridges beyond the fence
  const ridge = (x0, y0, x1, y1, n, hmin, hmax) => {
    for (let i = 0; i < n; i++) {
      const t = (i + rng.range(-0.3, 0.3)) / (n - 1);
      G.peaks.push({ x: lerp(x0, x1, t) + rng.range(-8, 8), y: lerp(y0, y1, t) + rng.range(-6, 6), w: rng.range(44, 84), h: rng.range(hmin, hmax), s: rng() });
    }
  };
  ridge(-404, -236, -150, -414, 9, 20, 44); ridge(140, -416, 404, -250, 9, 18, 40);
  ridge(-410, 330, -250, 496, 5, 16, 30); ridge(250, 500, 410, 340, 5, 16, 30);
  G.peaks.sort((a, b) => a.y - b.y);
  // deep-playa art: kept clear of nodes and paths
  const kinds = ['lotus', 'spire', 'ring', 'jelly', 'tree', 'head', 'disco', 'pyramid', 'wave', 'spiral', 'butterfly', 'lotus', 'ring', 'tree', 'spire', 'jelly'];
  const clear = (x, y, d) => {
    for (const N of G.list) if (Math.hypot(N.x - x, N.y - y) < d + 6) return false;
    for (const P of G.paths) for (let i = 0; i < P.pts.length; i += 2) if (Math.hypot(P.pts[i].x - x, P.pts[i].y - y) < d) return false;
    for (const a of G.art) if (Math.hypot(a.x - x, a.y - y) < 34) return false;
    if (Math.hypot(x, y) < 26 || Math.hypot(x, y + 62) < 26) return false;
    return true;
  };
  let tries = 0;
  while (G.art.length < kinds.length && tries++ < 4000) {
    const inner = G.art.length < 8;
    const c = inner ? rng.range(0, 12) : rng.range(10.2, 13.8), r = inner ? rng.range(28, 90) : rng.range(105, 290);
    if (inner && Math.abs(brcmClockDiff(c, 6)) < 0.6) continue;
    const p = brcmXY(c, r);
    if (!clear(p.x, p.y, inner ? 9 : 12)) continue;
    G.art.push({ x: p.x, y: p.y, kind: kinds[G.art.length], s: inner ? rng.range(0.8, 1.0) : rng.range(1.0, 1.35), ph: rng() * TAU, hue: rng.int(0, 360) });
  }
}

/* ---------- sprites (shared, made once) ---------- */
const BRCM_SPR = {};
function brcmGlow(col, kind) {            // 64px radial glow; kind: 0 = hot core, 1 = soft halo
  const key = col + '|' + (kind || 0);
  if (BRCM_SPR[key]) return BRCM_SPR[key];
  const c = makeCanvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  if (kind === 2) { g.addColorStop(0, rgba(mix(col, '#ffffff', 0.55), 1)); g.addColorStop(0.13, rgba(col, 0.92)); g.addColorStop(0.3, rgba(col, 0.3)); g.addColorStop(0.62, rgba(col, 0.07)); g.addColorStop(1, rgba(col, 0)); }
  else if (kind) { g.addColorStop(0, rgba(col, 0.6)); g.addColorStop(0.35, rgba(col, 0.24)); g.addColorStop(1, rgba(col, 0)); }
  else { g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.1, rgba(col, 0.95)); g.addColorStop(0.32, rgba(col, 0.34)); g.addColorStop(1, rgba(col, 0)); }
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (BRCM_SPR[key] = c);
}
function brcmCloud() {                    // soft dust cloud for the drifting haze
  if (BRCM_SPR.cloud) return BRCM_SPR.cloud;
  const c = makeCanvas(256, 256), x = c.getContext('2d'), rng = mulberry32(77);
  for (let i = 0; i < 26; i++) {
    const a = rng() * TAU, d = rng() * 70, px = 128 + Math.cos(a) * d, py = 128 + Math.sin(a) * d * 0.7, r = rng.range(30, 62);
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, 'rgba(236,218,204,0.22)'); g.addColorStop(1, 'rgba(236,218,204,0)');
    x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  return (BRCM_SPR.cloud = c);
}

/* ---------- static map renderer: draws every static thing inside world rect R ----------
   world (x, y) -> device px (x * s + ox, y * s + oy); lod 'close' adds the fine detail */
function brcmRenderStatic(ctx, s, ox, oy, R, lod) {
  const G = brcmGeo(), hi = lod === 'close', B = BRCM.B;
  const W = () => ctx.setTransform(s, 0, 0, s, ox, oy);
  const vis = (x, y, r) => x + r > R.x0 && x - r < R.x1 && y + r > R.y0 && y - r < R.y1;
  const px = 1 / s;                       // one device pixel in world units
  W(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
  // ground: pale playa, darkening toward the desert beyond the fence
  const gg = ctx.createRadialGradient(0, 40, 0, 0, 40, 600);
  gg.addColorStop(0, '#d0bfb4'); gg.addColorStop(0.4, '#c7b3aa'); gg.addColorStop(0.56, '#ae9a9e'); gg.addColorStop(0.75, '#7f6c82'); gg.addColorStop(1, '#4a3b58');
  ctx.fillStyle = gg; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
  for (const b of G.blotches) {
    if (!vis(b.x, b.y, b.r)) continue;
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r), c = b.light ? '255,246,232' : '96,72,96';
    g.addColorStop(0, `rgba(${c},${b.a})`); g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
  }
  brcmCracks(ctx, R, s, hi);
  // tyre tracks
  ctx.strokeStyle = 'rgba(92,66,80,0.15)'; ctx.lineWidth = Math.max(0.32, px);
  ctx.beginPath();
  for (const t of G.tracks) {
    if (!vis(t.x, t.y, t.R + 2)) continue;
    ctx.moveTo(t.x + Math.cos(t.a0) * t.R, t.y + Math.sin(t.a0) * t.R); ctx.arc(t.x, t.y, t.R, t.a0, t.a0 + t.span);
    if (t.dbl) { ctx.moveTo(t.x + Math.cos(t.a0) * (t.R + 1.3), t.y + Math.sin(t.a0) * (t.R + 1.3)); ctx.arc(t.x, t.y, t.R + 1.3, t.a0, t.a0 + t.span); }
  }
  ctx.stroke();
  brcmDecor(ctx, R, s, hi, vis);
  brcmCityStatic(ctx, R, s, ox, oy, hi, vis);
  // dusk light over everything: warm from the sunset side, violet toward the night
  W();
  ctx.globalCompositeOperation = 'multiply';
  const tg = ctx.createLinearGradient(-430, -450, 380, 520);
  tg.addColorStop(0, '#ecd1c2'); tg.addColorStop(0.42, '#c2adca'); tg.addColorStop(1, '#827bb6');
  ctx.fillStyle = tg; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
  // the city's light pollution
  ctx.globalCompositeOperation = 'lighter';
  if (vis(0, 60, 270)) {
    ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 268, brcmCanvasAng(1.7), brcmCanvasAng(10.3), false); ctx.closePath(); ctx.clip();
    const cg = ctx.createRadialGradient(0, 0, 88, 0, 0, 262);
    cg.addColorStop(0, 'rgba(255,150,100,0)'); cg.addColorStop(0.12, 'rgba(255,140,100,0.07)'); cg.addColorStop(0.55, 'rgba(255,100,170,0.04)'); cg.addColorStop(1, 'rgba(255,110,170,0)');
    ctx.fillStyle = cg; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0); ctx.restore();
  }
  // baked lights (the living twinkle is drawn per frame on top)
  for (const l of G.lights) {
    const big = l.s > 1.6, r = big ? l.s * 1.35 : l.s * (l.lamp ? 2.1 : 2.3);
    if (!vis(l.x, l.y, r)) continue;
    ctx.globalAlpha = big ? 0.42 : l.lamp ? 0.85 : 0.8;
    ctx.drawImage(brcmGlow(l.lamp ? '#ffcf8a' : BRCM.LIGHTS[l.c], big ? 1 : 2), l.x - r, l.y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 0.7;
  for (const f of G.fires) if (vis(f.x, f.y, 7)) ctx.drawImage(brcmGlow('#ff8a2a', 1), f.x - 6, f.y - 6, 12, 12);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  brcmLabels(ctx, R, s, hi, vis);
  if (R.x0 < B.x0 || R.y0 < B.y0 || R.x1 > B.x1 || R.y1 > B.y1) {
    W();
    ctx.fillStyle = BRCM.NIGHT;
    ctx.beginPath(); ctx.rect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0); ctx.rect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0); ctx.fill('evenodd');
    for (let i = 1; i <= 6; i++) { ctx.strokeStyle = `rgba(0,0,0,${0.16 - i * 0.022})`; ctx.lineWidth = 3; ctx.strokeRect(B.x0 - i * 3 + 1.5, B.y0 - i * 3 + 1.5, B.x1 - B.x0 + i * 6 - 3, B.y1 - B.y0 + i * 6 - 3); }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function brcmCracks(ctx, R, s, hi) {
  const H = 6.2, hw = H * Math.sqrt(3), vh = H * 1.5, J = H * 0.3;
  const j0 = Math.floor((R.y0 - H) / vh) - 1, j1 = Math.ceil((R.y1 + H) / vh) + 1;
  const i0 = Math.floor((R.x0 - hw) / hw) - 1, i1 = Math.ceil((R.x1 + hw) / hw) + 1;
  const cs = [], faint = new Path2D(), strong = new Path2D(), lite = new Path2D(), dark = new Path2D();
  const corner = (x, y) => { const kx = Math.round(x * 4), ky = Math.round(y * 4); return { x: x + (brcmHash(kx, ky, 11) - 0.5) * 2 * J, y: y + (brcmHash(kx, ky, 12) - 0.5) * 2 * J }; };
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const cx = hw * (i + 0.5 * (j & 1)), cy = vh * j;
    for (let k = 0; k < 6; k++) { const a = (60 * k - 30) * Math.PI / 180; cs[k] = corner(cx + Math.cos(a) * H, cy + Math.sin(a) * H); }
    if (hi) {
      const h = brcmHash(i, j, 5);
      if (h < 0.34) { const p = h < 0.17 ? lite : dark; p.moveTo(cs[0].x, cs[0].y); for (let k = 1; k < 6; k++) p.lineTo(cs[k].x, cs[k].y); p.closePath(); }
    }
    for (let k = 0; k < 3; k++) {
      const a = cs[k], b = cs[k + 1], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const n = brcmNoise(mx, my, 60, 3);
      if (n < 0.26 || (!hi && n < 0.5)) continue;
      const dx = b.y - a.y, dy = a.x - b.x, w = (brcmHash(Math.round(mx * 4), Math.round(my * 4), 13) - 0.5) * 0.34;
      const p = n > 0.56 ? strong : faint;
      p.moveTo(a.x, a.y); p.quadraticCurveTo(mx + dx * w, my + dy * w, b.x, b.y);
    }
  }
  if (hi) { ctx.fillStyle = 'rgba(255,250,240,0.05)'; ctx.fill(lite); ctx.fillStyle = 'rgba(80,56,76,0.045)'; ctx.fill(dark); }
  const lw = Math.max(hi ? 0.3 : 0.4, 0.8 / s);
  if (hi) { ctx.strokeStyle = 'rgba(84,58,70,0.24)'; ctx.lineWidth = lw; ctx.stroke(faint); }
  ctx.strokeStyle = hi ? 'rgba(80,52,66,0.38)' : 'rgba(80,52,66,0.15)'; ctx.lineWidth = lw * 1.25; ctx.stroke(strong);
  if (hi) {
    ctx.save(); ctx.translate(0.26, 0.26);
    ctx.strokeStyle = 'rgba(255,248,236,0.17)'; ctx.lineWidth = lw * 0.75; ctx.stroke(faint); ctx.stroke(strong);
    ctx.restore();
  }
}

function brcmDecor(ctx, R, s, hi, vis) {
  const G = brcmGeo(), B = BRCM.B, px = 1 / s;
  // mountains beyond the fence, lit from the sunset side, with engraved hachures
  const lwm = Math.max(0.3, px);
  for (const p of G.peaks) {
    if (!vis(p.x, p.y - p.h / 2, p.w)) continue;
    const L = p.x - p.w / 2, Rr = p.x + p.w / 2, ax = p.x + (p.s - 0.5) * p.w * 0.22, ay = p.y - p.h;
    const left = () => { ctx.moveTo(L, p.y); ctx.quadraticCurveTo(lerp(L, ax, 0.62), lerp(p.y, ay, 0.3), ax, ay); };
    ctx.fillStyle = '#5f4c66'; ctx.beginPath(); left(); ctx.quadraticCurveTo(lerp(ax, Rr, 0.38), lerp(ay, p.y, 0.7), Rr, p.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#937685'; ctx.beginPath(); left(); ctx.quadraticCurveTo(ax - p.w * 0.02, lerp(ay, p.y, 0.5), ax + p.w * 0.08, p.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,26,48,0.45)'; ctx.lineWidth = lwm; ctx.beginPath();
    for (let k = 1; k < 7; k++) { const t = k / 7, x = lerp(ax, Rr, t), y = lerp(ay, p.y, t * t * 0.4 + t * 0.6); ctx.moveTo(x, y); ctx.lineTo(x - p.w * 0.07, y + p.h * 0.22); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,226,206,0.35)'; ctx.beginPath(); ctx.moveTo(lerp(L, ax, 0.55), lerp(p.y, ay, 0.62)); ctx.lineTo(ax, ay); ctx.stroke();
  }
  // Highway 447 along the bottom edge
  if (vis(0, 480, 420)) {
    const road = () => { ctx.beginPath(); ctx.moveTo(B.x0 - 10, 492); ctx.quadraticCurveTo(0, 470, B.x1 + 10, 486); };
    ctx.strokeStyle = 'rgba(60,46,62,0.55)'; ctx.lineWidth = 9; road(); ctx.stroke();
    ctx.strokeStyle = '#5a4d5d'; ctx.lineWidth = 7; road(); ctx.stroke();
    ctx.strokeStyle = 'rgba(240,196,90,0.75)'; ctx.lineWidth = Math.max(0.45, px); ctx.setLineDash([3, 3]); road(); ctx.stroke(); ctx.setLineDash([]);
  }
  // Gate Road: a long dusty lane from the highway to 6:00 & K
  if (vis(0, 360, 140)) {
    ctx.strokeStyle = 'rgba(92,72,80,0.35)'; ctx.lineWidth = 17.5; ctx.beginPath(); ctx.moveTo(0, 236); ctx.lineTo(0, 482); ctx.stroke();
    ctx.strokeStyle = '#ddcdb9'; ctx.lineWidth = 15.5; ctx.stroke();
    ctx.strokeStyle = 'rgba(120,96,100,0.22)'; ctx.lineWidth = Math.max(0.4, px);
    ctx.beginPath(); for (const x of [-5.4, -2.2, 2.2, 5.4]) { ctx.moveTo(x, 238); ctx.lineTo(x, 480); } ctx.stroke();
    // staging lanes at the box office
    ctx.fillStyle = '#ddcdb9'; rr(ctx, -13, 336, 26, 32, 6); ctx.fill();
    // cones
    ctx.fillStyle = '#ff8a3a';
    for (let y = 246; y < 476; y += 16) for (const x of [-8.8, 8.8]) { ctx.beginPath(); ctx.moveTo(x, y - 1); ctx.lineTo(x + 0.7, y + 0.6); ctx.lineTo(x - 0.7, y + 0.6); ctx.closePath(); ctx.fill(); }
    // greeters' shade and bell, box office, gate booths
    const hut = (x, y, w, h, col, roof) => {
      ctx.fillStyle = 'rgba(40,24,40,0.25)'; ctx.fillRect(x - w / 2 + 0.8, y - h / 2 + 1, w, h);
      ctx.fillStyle = col; ctx.fillRect(x - w / 2, y - h / 2, w, h);
      ctx.fillStyle = roof; ctx.fillRect(x - w / 2, y - h / 2, w, h * 0.45);
      ctx.strokeStyle = 'rgba(40,24,40,0.45)'; ctx.lineWidth = Math.max(0.25, px); ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    };
    hut(-20, 312, 10, 7, '#e3e6ec', '#f4f5f8'); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(-12.6, 309, 0.9, 0, TAU); ctx.fill();
    hut(21, 352, 12, 8, '#c9b38f', '#e2d1b0'); hut(21, 362, 7, 4, '#b5482f', '#cf6a4a');
    hut(-15, 296, 5, 4, '#c9b38f', '#e2d1b0'); hut(15, 296, 5, 4, '#c9b38f', '#e2d1b0');
    // the gate arch: two posts and a banner
    ctx.fillStyle = '#6a4a36'; ctx.fillRect(-10.6, 292, 1.3, 9.5); ctx.fillRect(9.3, 292, 1.3, 9.5);
    ctx.fillStyle = '#e64a6e'; ctx.fillRect(-10, 292.5, 20, 2.6);
    ctx.fillStyle = 'rgba(255,240,220,0.85)'; for (let k = 0; k < 9; k++) ctx.fillRect(-8.6 + k * 1.9, 293.4, 1.1, 0.8);
  }
  // the trash fence: a pentagon of posts and mesh
  const fp = brcmFencePts(0), fence = () => { ctx.beginPath(); fp.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); };
  fence(); ctx.strokeStyle = 'rgba(40,22,44,0.13)'; ctx.lineWidth = 7; ctx.stroke();
  ctx.strokeStyle = 'rgba(56,36,54,0.7)'; ctx.lineWidth = Math.max(0.9, px * 1.4); ctx.stroke();
  ctx.save(); ctx.translate(-0.6, -0.6); ctx.strokeStyle = 'rgba(255,236,220,0.28)'; ctx.lineWidth = Math.max(0.4, px); fence(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = 'rgba(46,28,46,0.9)';
  for (let i = 0; i < 5; i++) {
    const a = fp[i], b = fp[(i + 1) % 5], n = Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 5);
    for (let k = 0; k < n; k++) { const x = lerp(a.x, b.x, k / n), y = lerp(a.y, b.y, k / n); if (vis(x, y, 1)) ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2); }
  }
  // cartographer's furniture: compass, scale bar, frame
  if (vis(318, 410, 30)) {
    ctx.save(); ctx.translate(318, 410);
    ctx.fillStyle = 'rgba(244,232,214,0.6)'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(58,40,60,0.7)'; ctx.lineWidth = 0.6; ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 19, 0, TAU); ctx.stroke();
    ctx.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ctx.moveTo(Math.sin(a) * 19, -Math.cos(a) * 19); ctx.lineTo(Math.sin(a) * (k % 3 ? 17.2 : 15.5), -Math.cos(a) * (k % 3 ? 17.2 : 15.5)); } ctx.stroke();
    ctx.fillStyle = '#c23a52'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(2.4, 0); ctx.lineTo(0, 2); ctx.lineTo(-2.4, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(58,40,60,0.85)'; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(2.4, 0); ctx.lineTo(-2.4, 0); ctx.closePath(); ctx.fill();
    ctx.font = `6px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('12', 0, -26.5);
    ctx.font = `600 3.4px ${FONT_UI}`; ctx.fillText('TEMPLE', 0, -31.5); ctx.fillText('GATE', 0, 26.5);
    ctx.restore();
  }
  if (vis(-312, 448, 50)) {
    ctx.fillStyle = 'rgba(58,40,60,0.75)';
    for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? 'rgba(244,232,214,0.75)' : 'rgba(58,40,60,0.75)'; ctx.fillRect(-352 + k * 20, 446, 20, 2.6); }
    ctx.strokeStyle = 'rgba(58,40,60,0.75)'; ctx.lineWidth = 0.4; ctx.strokeRect(-352, 446, 80, 2.6);
    ctx.fillStyle = 'rgba(58,40,60,0.85)'; ctx.font = `600 4.6px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('0', -352, 443); ctx.fillText('1000', -312, 443); ctx.fillText('2000 FT', -270, 443);
  }
  ctx.strokeStyle = 'rgba(48,32,54,0.55)'; ctx.lineWidth = 1.6; ctx.strokeRect(B.x0 + 5, B.y0 + 5, B.x1 - B.x0 - 10, B.y1 - B.y0 - 10);
  ctx.lineWidth = 0.5; ctx.strokeRect(B.x0 + 9, B.y0 + 9, B.x1 - B.x0 - 18, B.y1 - B.y0 - 18);
}

function brcmCityStatic(ctx, R, s, ox, oy, hi, vis) {
  const G = brcmGeo(), px = 1 / s;
  const W = () => ctx.setTransform(s, 0, 0, s, ox, oy);
  if (!vis(0, 70, 250)) return;
  const arcCity = r => { ctx.beginPath(); ctx.arc(0, 0, r, brcmCanvasAng(2), brcmCanvasAng(10), false); };
  const radial = c => { const a = brcmXY(c, BRCM.ESP), b = brcmXY(c, 235); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); };
  const rings = [[BRCM.ESP, BRCM.ESP_W]]; for (let i = 0; i < 11; i++) rings.push([brcmRingR(i), BRCM.RING_W]);
  // the camp blocks get a slightly darker trodden base so the streets read as pale lanes
  ctx.fillStyle = 'rgba(120,96,104,0.13)';
  ctx.beginPath(); ctx.arc(0, 0, 234, brcmCanvasAng(2), brcmCanvasAng(10), false); ctx.arc(0, 0, BRCM.ESP, brcmCanvasAng(10), brcmCanvasAng(2), true); ctx.closePath(); ctx.fill();
  for (const pass of [0, 1]) {
    ctx.strokeStyle = pass ? '#e6d9c8' : 'rgba(98,76,86,0.32)';
    for (const [r, w] of rings) { ctx.lineWidth = w + (pass ? 0 : 1.3); arcCity(r); ctx.stroke(); }
    for (let c = 2; c <= 10.001; c += 0.5) { ctx.lineWidth = (c % 3 === 0 ? BRCM.RAD_W_MAJOR : BRCM.RAD_W) + (pass ? 0 : 1.3); radial(c); ctx.stroke(); }
  }
  if (hi) { ctx.strokeStyle = 'rgba(150,120,120,0.18)'; ctx.lineWidth = 0.3; arcCity(BRCM.ESP - 1.2); ctx.stroke(); arcCity(BRCM.ESP + 1.2); ctx.stroke(); }
  // plazas: round open spaces ringed by a road
  for (const p of BRCM.PLAZAS) {
    const q = brcmXY(p.c, p.r);
    if (!vis(q.x, q.y, p.rad + 4)) continue;
    ctx.fillStyle = '#dccdbc'; ctx.beginPath(); ctx.arc(q.x, q.y, p.rad + 1.6, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(98,76,86,0.32)'; ctx.lineWidth = BRCM.RING_W + 1.3; ctx.beginPath(); ctx.arc(q.x, q.y, p.rad, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#e6d9c8'; ctx.lineWidth = BRCM.RING_W; ctx.stroke();
    if (p.rad > 10) {
      ctx.strokeStyle = 'rgba(98,76,86,0.25)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.arc(q.x, q.y, p.rad * 0.55, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#4a3a56'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(q.x, q.y, 1.1, 0, TAU); ctx.fill();
    }
  }
  // Center Camp: Rod's Road, the café plaza and the big round tent
  const cc = brcmXY(BRCM.CC.c, BRCM.CC.r), C = BRCM.CC;
  if (vis(cc.x, cc.y, C.road + 6)) {
    ctx.fillStyle = '#dccdbc'; ctx.beginPath(); ctx.arc(cc.x, cc.y, C.road, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(98,76,86,0.32)'; ctx.lineWidth = BRCM.RING_W + 1.3; ctx.beginPath(); ctx.arc(cc.x, cc.y, C.road, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#e6d9c8'; ctx.lineWidth = BRCM.RING_W; ctx.stroke();
    if (hi) {
      ctx.fillStyle = 'rgba(70,50,64,0.5)';
      for (let k = 0; k < 40; k++) { const a = k / 40 * TAU; ctx.beginPath(); ctx.arc(cc.x + Math.cos(a) * 19.5, cc.y + Math.sin(a) * 19.5, 0.45, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(60,44,60,0.55)'; ctx.lineWidth = 0.18; ctx.beginPath();
      for (let k = 0; k < 90; k++) { const a = k / 90 * TAU; if (k % 15 < 3) continue; const r0 = C.road + 2.4, r1 = C.road + 3.6; ctx.moveTo(cc.x + Math.cos(a) * r0, cc.y + Math.sin(a) * r0); ctx.lineTo(cc.x + Math.cos(a) * r1, cc.y + Math.sin(a) * r1); }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(48,30,50,0.3)'; ctx.beginPath(); ctx.arc(cc.x + 1.6, cc.y + 2, C.tent + 3.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#d3d2e6';
    ctx.beginPath(); ctx.arc(cc.x, cc.y, C.tent + 3, 0, TAU); ctx.fill();
    for (let k = 0; k < 28; k++) { const a = (k + 0.5) / 28 * TAU; ctx.beginPath(); ctx.arc(cc.x + Math.cos(a) * (C.tent + 3), cc.y + Math.sin(a) * (C.tent + 3), 1.15, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(70,60,100,0.35)'; ctx.lineWidth = Math.max(0.15, px);
    ctx.beginPath(); for (let k = 0; k < 28; k++) { const a = k / 28 * TAU; ctx.moveTo(cc.x + Math.cos(a) * C.tent, cc.y + Math.sin(a) * C.tent); ctx.lineTo(cc.x + Math.cos(a) * (C.tent + 3), cc.y + Math.sin(a) * (C.tent + 3)); } ctx.stroke();
    for (let k = 0; k < 16; k++) {
      const a0 = k / 16 * TAU, a1 = (k + 1) / 16 * TAU;
      ctx.fillStyle = k % 2 ? '#f4e4c4' : '#cf4b2c';
      ctx.beginPath(); ctx.moveTo(cc.x, cc.y); ctx.arc(cc.x, cc.y, C.tent, a0, a1); ctx.closePath(); ctx.fill();
    }
    const tg = ctx.createRadialGradient(cc.x - 4, cc.y - 5, 1, cc.x, cc.y, C.tent);
    tg.addColorStop(0, 'rgba(255,255,255,0.3)'); tg.addColorStop(0.7, 'rgba(255,255,255,0)'); tg.addColorStop(1, 'rgba(60,20,40,0.25)');
    ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(cc.x, cc.y, C.tent, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#7a2a1c'; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.fillStyle = '#f7eedd'; ctx.beginPath(); ctx.arc(cc.x, cc.y, 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#a8442a'; ctx.lineWidth = 0.6; ctx.stroke();
    ctx.fillStyle = '#ff4f9a'; ctx.beginPath(); ctx.moveTo(cc.x, cc.y - 0.4); ctx.lineTo(cc.x + 3.6, cc.y + 0.4); ctx.lineTo(cc.x, cc.y + 1.2); ctx.closePath(); ctx.fill();
  }
  // camp items
  for (const it of G.items) if (vis(it.x, it.y, it.s)) brcmItem(ctx, it, s, ox, oy, hi);
  W();
  if (hi) for (const f of G.fires) if (vis(f.x, f.y, 2)) { ctx.fillStyle = 'rgba(60,40,50,0.7)'; ctx.beginPath(); ctx.arc(f.x, f.y, f.big ? 1.6 : 1.1, 0, TAU); ctx.fill(); }
}

function brcmItem(ctx, it, s, ox, oy, hi) {
  const t = it.t;
  let shx = 0.3, shy = 0.36;               // shadow offset (world space: light comes from the upper left)
  if (t === 'tent' || t === 'dome' || t === 'para' || t === 'yurt' || t === 'flag') ctx.setTransform(s, 0, 0, s, ox + it.x * s, oy + it.y * s);
  else {
    const ca = Math.cos(it.a), sa = Math.sin(it.a);
    ctx.setTransform(s * ca, s * sa, -s * sa, s * ca, ox + it.x * s, oy + it.y * s);
    shx = 0.3 * ca + 0.36 * sa; shy = -0.3 * sa + 0.36 * ca;
  }
  const shadowRect = (w, h, r) => { if (!hi) return; ctx.fillStyle = 'rgba(46,24,46,0.24)'; rr(ctx, -w / 2 + shx, -h / 2 + shy, w, h, r || 0.2); ctx.fill(); };
  switch (t) {
    case 'tent': {
      const r = it.r;
      if (hi) { ctx.fillStyle = 'rgba(46,24,46,0.24)'; ctx.beginPath(); ctx.arc(r * 0.24, r * 0.3, r, 0, TAU); ctx.fill(); }
      ctx.fillStyle = it.c; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      if (hi) {
        ctx.fillStyle = 'rgba(255,255,255,0.26)'; ctx.beginPath(); ctx.arc(-r * 0.32, -r * 0.32, r * 0.46, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(30,20,40,0.32)'; ctx.lineWidth = 0.13; ctx.beginPath();
        ctx.moveTo(-r * 0.7, -r * 0.7); ctx.lineTo(r * 0.7, r * 0.7); ctx.moveTo(r * 0.7, -r * 0.7); ctx.lineTo(-r * 0.7, r * 0.7); ctx.stroke();
      }
      break;
    }
    case 'cabin': {
      const w = it.w, h = it.h;
      shadowRect(w, h);
      ctx.fillStyle = it.c; ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = 'rgba(30,15,40,0.3)'; ctx.fillRect(-w / 2, 0, w, h / 2);
      if (hi) { ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(-w / 2, -0.07, w, 0.14); }
      break;
    }
    case 'dome': {
      const r = it.r;
      if (hi) { ctx.fillStyle = 'rgba(46,24,46,0.26)'; ctx.beginPath(); ctx.arc(r * 0.2, r * 0.26, r, 0, TAU); ctx.fill(); }
      if (hi) {
        const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.08, 0, 0, r);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.55, it.c); g.addColorStop(1, shade(it.c, -0.28));
        ctx.fillStyle = g;
      } else ctx.fillStyle = it.c;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      if (hi) {
        ctx.strokeStyle = 'rgba(80,66,104,0.4)'; ctx.lineWidth = Math.min(0.14, r * 0.04);
        ctx.beginPath();
        const h6 = [];
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6; h6.push([Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52]); }
        h6.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
        for (let k = 0; k < 6; k++) {
          const a = k / 6 * TAU + Math.PI / 6, b = a + Math.PI / 6;
          ctx.moveTo(h6[k][0], h6[k][1]); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          ctx.moveTo(h6[k][0], h6[k][1]); ctx.lineTo(Math.cos(b) * r, Math.sin(b) * r);
          ctx.moveTo(h6[(k + 1) % 6][0], h6[(k + 1) % 6][1]); ctx.lineTo(Math.cos(b) * r, Math.sin(b) * r);
          ctx.moveTo(0, 0); ctx.lineTo(h6[k][0], h6[k][1]);
        }
        ctx.moveTo(r, 0); ctx.arc(0, 0, r, 0, TAU);
        ctx.stroke();
      }
      break;
    }
    case 'para': {
      const r = it.r, n = it.n;
      if (hi) { ctx.fillStyle = 'rgba(46,24,46,0.24)'; ctx.beginPath(); ctx.arc(r * 0.18, r * 0.24, r, 0, TAU); ctx.fill(); }
      for (let k = 0; k < n; k++) {
        ctx.fillStyle = k % 2 ? it.c : it.c2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, k / n * TAU, (k + 1) / n * TAU); ctx.closePath(); ctx.fill();
      }
      if (hi) {
        const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
        g.addColorStop(0, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(40,20,40,0.2)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3a2c40'; ctx.beginPath(); ctx.arc(0, 0, 0.35, 0, TAU); ctx.fill();
      }
      break;
    }
    case 'yurt': {
      const r = it.r;
      ctx.fillStyle = hi ? '#d5dbe4' : '#cfd5de';
      ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
      if (hi) {
        ctx.fillStyle = 'rgba(70,70,100,0.22)';
        ctx.beginPath(); ctx.moveTo(0, 0); for (let k = 0; k <= 3; k++) { const a = k / 6 * TAU; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(90,90,120,0.45)'; ctx.lineWidth = 0.1; ctx.beginPath();
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.stroke();
      }
      break;
    }
    case 'flag': {
      ctx.fillStyle = it.c; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1.9, 0.4); ctx.lineTo(0, 0.85); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2b2230'; ctx.beginPath(); ctx.arc(0, 0.1, 0.28, 0, TAU); ctx.fill();
      break;
    }
    case 'shade': {
      const w = it.w, h = it.h, dark = it.c === '#2d2a36' || it.c === '#4a3f5e';
      shadowRect(w, h, 0.3);
      ctx.fillStyle = it.c; ctx.fillRect(-w / 2, -h / 2, w, h);
      if (hi) {
        ctx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(60,50,70,0.2)'; ctx.lineWidth = 0.12;
        ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.moveTo(w / 2, -h / 2); ctx.lineTo(-w / 2, h / 2);
        for (let k = 1; k < 4; k++) { ctx.moveTo(-w / 2 + w * k / 4, -h / 2); ctx.lineTo(-w / 2 + w * k / 4, h / 2); }
        ctx.stroke();
        ctx.fillStyle = rgba(it.c2, 0.55); ctx.fillRect(-w * 0.18, -h * 0.2, w * 0.36, h * 0.4);
        ctx.fillStyle = '#2b2230';
        for (const [x, y] of [[-w / 2, -h / 2], [w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2]]) { ctx.beginPath(); ctx.arc(x, y, 0.3, 0, TAU); ctx.fill(); }
      }
      break;
    }
    case 'rv': {
      const w = it.w, h = it.h;
      shadowRect(w, h, 0.45);
      ctx.fillStyle = it.c; rr(ctx, -w / 2, -h / 2, w, h, 0.45); ctx.fill();
      ctx.fillStyle = it.c2; ctx.fillRect(-w / 2 + 0.2, h * 0.16, w - 0.4, h * 0.14);
      ctx.fillStyle = '#2a3442'; ctx.fillRect(w / 2 - 0.75, -h / 2 + 0.25, 0.45, h - 0.5);
      if (hi) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-0.5, -0.5, 1, 0.9); ctx.strokeStyle = 'rgba(40,30,50,0.35)'; ctx.lineWidth = 0.1; rr(ctx, -w / 2, -h / 2, w, h, 0.45); ctx.stroke(); }
      break;
    }
    case 'car': {
      const w = it.w, h = it.h;
      shadowRect(w, h, 0.4);
      ctx.fillStyle = it.c; rr(ctx, -w / 2, -h / 2, w, h, 0.5); ctx.fill();
      ctx.fillStyle = '#26293a'; rr(ctx, -w * 0.22, -h * 0.36, w * 0.5, h * 0.72, 0.25); ctx.fill();
      break;
    }
    case 'box': {
      const w = it.w, h = it.h;
      shadowRect(w, h);
      ctx.fillStyle = it.c; ctx.fillRect(-w / 2, -h / 2, w, h);
      if (hi) {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.09; ctx.beginPath();
        for (let x = -w / 2 + 0.45; x < w / 2; x += 0.45) { ctx.moveTo(x, -h / 2); ctx.lineTo(x, h / 2); }
        ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.14; ctx.strokeRect(-w / 2, -h / 2, w, h);
      }
      break;
    }
    case 'stage': {
      const w = it.w, h = it.h;
      shadowRect(w, h, 0.3);
      ctx.fillStyle = '#231d2b'; rr(ctx, -w / 2, -h / 2, w, h, 0.3); ctx.fill();
      ctx.fillStyle = it.c; ctx.fillRect(-w / 2 + 0.3, h / 2 - 0.5, w - 0.6, 0.42);
      if (hi) {
        ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 0.12; ctx.strokeRect(-w / 2 + 0.6, -h / 2 + 0.6, w - 1.2, h - 1.4);
        for (const x of [-w / 2 + 0.1, w / 2 - 1.5]) {
          ctx.fillStyle = '#0d0b12'; ctx.fillRect(x, h / 2 - 1.7, 1.4, 1.4);
          ctx.fillStyle = '#4a4456'; ctx.beginPath(); ctx.arc(x + 0.7, h / 2 - 1.0, 0.45, 0, TAU); ctx.fill();
        }
      }
      break;
    }
    case 'floor': {
      const w = it.w, h = it.h, cols = Math.max(3, Math.round(w / 1.6)), rows = 2, tw = w / cols, th = h / rows;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        ctx.fillStyle = rgba(BRCM.LIGHTS[(i + j) % 2 ? it.c : it.c2], 0.72);
        ctx.fillRect(-w / 2 + i * tw + 0.08, -h / 2 + j * th + 0.08, tw - 0.16, th - 0.16);
      }
      break;
    }
  }
}

function brcmLabels(ctx, R, s, hi, vis) {
  const G = brcmGeo();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (hi) {
    ctx.font = `600 3.3px ${FONT_UI}`;
    for (const g of G.signs) {
      if (!vis(g.x, g.y, 6)) continue;
      if (g.letter) {
        ctx.fillStyle = 'rgba(38,28,50,0.82)'; ctx.beginPath(); ctx.arc(g.x, g.y, 2.3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#f6ead6'; ctx.fillText(g.text, g.x, g.y + 0.15);
      } else {
        const w = g.text.length * 1.75 + 1.6;
        ctx.fillStyle = g.major ? 'rgba(122,42,92,0.88)' : 'rgba(38,28,50,0.82)'; rr(ctx, g.x - w / 2, g.y - 2.1, w, 4.2, 1.2); ctx.fill();
        ctx.fillStyle = '#f6ead6'; ctx.fillText(g.text, g.x, g.y + 0.15);
      }
    }
  } else {
    ctx.font = `${12}px ${FONT_DISPLAY}`;
    for (let c = 2; c <= 10; c++) {
      const p = brcmXY(c, 252);
      if (!vis(p.x, p.y, 20)) continue;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(240,228,214,0.55)'; ctx.strokeText(c + ':00', p.x, p.y);
      ctx.fillStyle = 'rgba(58,36,70,0.85)'; ctx.fillText(c + ':00', p.x, p.y);
    }
  }
}

/* ---------- living things: LED bikes, art cars, Gate Road traffic, dust haze ---------- */
function brcmMakeActors() {
  const rng = mulberry32(((Date.now() / 1000) | 0) ^ 0x5eed);
  const A = { rng, bikes: [], cars: [], artcars: [], clouds: [] };
  const ringRs = [BRCM.ESP]; for (let i = 0; i < 11; i++) ringRs.push(brcmRingR(i));
  A.ringRs = ringRs;
  for (let i = 0; i < 40; i++) A.bikes.push({ mode: 'ring', r: rng.pick(ringRs), th: brcmAng(rng.range(2.1, 9.9)), dir: rng() < 0.5 ? -1 : 1, v: rng.range(7, 13), c: BRCM.LIGHTS[rng.int(0, 7)], trail: [], tt: 0, x: 0, y: 0 });
  const carCols = ['#e8553f', '#3a78d4', '#f2f0e9', '#e8e0d0', '#5dbb48', '#2b2a36', '#f3d046', '#8b5bd6', '#d2d8df'];
  for (const lane of [-3.7, 3.7]) {
    let y = 252 + rng.range(0, 6);
    while (y < 486) { const rv = rng() < 0.22, len = rv ? rng.range(5.6, 7.2) : rng.range(3.1, 3.9); A.cars.push({ lane, y: y + len / 2, len, rv, c: rv ? rng.pick(BRCM_PAL.rv) : rng.pick(carCols), ph: rng() * TAU }); y += len + rng.range(1.6, 3.4); }
  }
  const loop = (pts, sm) => brcmPolyline(brcmResample(brcmChaikin(pts, sm || 2), 2));
  const circle = (r, rev) => { const p = []; for (let i = 0; i <= 120; i++) p.push(brcmXY((rev ? -i : i) / 10, r)); return brcmPolyline(p); };
  const polar = (w) => loop(brcmSampleLegs(w, 6), 3);
  const lemn = []; for (let i = 0; i <= 160; i++) { const u = i / 160 * TAU; lemn.push({ x: 98 * Math.sin(u), y: -212 + 44 * Math.sin(2 * u) }); }
  const ell = (cx, cy, rx, ry, rot, rev) => { const p = []; for (let i = 0; i <= 90; i++) { const u = (rev ? -1 : 1) * i / 90 * TAU, x = Math.cos(u) * rx, y = Math.sin(u) * ry; p.push({ x: cx + x * Math.cos(rot) - y * Math.sin(rot), y: cy + x * Math.sin(rot) + y * Math.cos(rot) }); } return brcmPolyline(p); };
  const w3 = brcmXY(10.9, 178);
  const defs = [
    { kind: 'whale', pl: circle(91, false), v: 8.5, c: '#4ac8ff' },
    { kind: 'fish', pl: circle(64, true), v: 7, c: '#ff8a3a' },
    { kind: 'bus', pl: polar([[10, 94], [8, 94], [6, 94], [4, 94], [2, 94], [1.3, 128], [0.5, 166], [12, 180], [11.5, 166], [10.7, 128], [10, 94]]), v: 10, c: '#c45bff' },
    { kind: 'cupcake', pl: brcmPolyline(lemn), v: 7, c: '#ff6ad5' },
    { kind: 'snail', pl: ell(brcmXY(4.4, 52).x, brcmXY(4.4, 52).y, 20, 11, 0.5, false), v: 2.6, c: '#7dff6a' },
    { kind: 'dragon', pl: ell(w3.x, w3.y, 58, 30, -0.6, true), v: 9, c: '#ff4a3a' }
  ];
  for (const d of defs) A.artcars.push(Object.assign(d, { s: rng() * d.pl.len, trail: [], tt: 0, x: 0, y: 0, hx: 1, hy: 0 }));
  const B = BRCM.B;
  A.devils = [];
  for (let i = 0; i < 3; i++) { const p = brcmXY(rng.range(0, 12), rng.range(260, 340)); A.devils.push({ x: p.x, y: p.y, a: rng() * TAU, ph: rng() * TAU, s: rng.range(0.8, 1.3) }); }
  for (let i = 0; i < 5; i++) A.clouds.push({ x: rng.range(B.x0, B.x1), y: rng.range(B.y0, B.y1), s: rng.range(190, 330), a: rng.range(0.6, 1), vx: rng.range(3.5, 7), vy: rng.range(-1.2, 1.8) });
  return A;
}

function brcmStepActors(A, dt, t) {
  const rng = A.rng, Rs = A.ringRs, K = Rs[Rs.length - 1], th0 = brcmAng(2), th1 = brcmAng(10), seg = Math.PI / 12;
  for (const b of A.bikes) {
    if (b.mode === 'ring') {
      const before = Math.floor((b.th - th0) / seg);
      b.th += b.dir * b.v / b.r * dt;
      const after = Math.floor((b.th - th0) / seg);
      if (b.th < th0 + 0.001 || b.th > th1 - 0.001) { b.th = clamp(b.th, th0 + 0.001, th1 - 0.001); b.dir = -b.dir; }
      else if (before !== after && rng() < 0.3) {
        b.th = th0 + Math.max(before, after) * seg; b.mode = 'rad';
        b.dir = b.r <= BRCM.ESP ? 1 : b.r >= K ? -1 : (rng() < 0.5 ? 1 : -1);
        if (b.r <= BRCM.ESP && rng() < 0.4) { b.mode = 'playa'; const p = brcmXY(rng.range(0, 12), rng.range(22, 70)); b.tx = p.x; b.ty = p.y; b.back = false; }
      }
      b.x = Math.sin(b.th) * b.r; b.y = -Math.cos(b.th) * b.r;
    } else if (b.mode === 'rad') {
      const r0 = b.r; b.r += b.dir * b.v * dt;
      if (b.r >= K) { b.r = K; b.mode = 'ring'; b.dir = rng() < 0.5 ? -1 : 1; }
      else if (b.r <= BRCM.ESP) { b.r = BRCM.ESP; b.mode = 'ring'; b.dir = rng() < 0.5 ? -1 : 1; }
      else for (const R of Rs) if ((r0 - R) * (b.r - R) < 0 && rng() < 0.35) { b.r = R; b.mode = 'ring'; b.dir = rng() < 0.5 ? -1 : 1; break; }
      b.x = Math.sin(b.th) * b.r; b.y = -Math.cos(b.th) * b.r;
    } else {
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
      if (d < 1) {
        if (b.back) { b.mode = 'ring'; b.r = BRCM.ESP; b.th = clamp(Math.atan2(b.x, -b.y) < 0 ? Math.atan2(b.x, -b.y) + TAU : Math.atan2(b.x, -b.y), th0 + 0.01, th1 - 0.01); }
        else { const p = brcmXY(rng.range(2.2, 9.8), BRCM.ESP); b.tx = p.x; b.ty = p.y; b.back = true; }
      } else { b.x += dx / d * b.v * dt; b.y += dy / d * b.v * dt; }
    }
    b.tt += dt;
    if (b.tt > 0.07) { b.tt = 0; b.trail.unshift(b.x, b.y); if (b.trail.length > 14) b.trail.length = 14; }
  }
  // Gate Road: stop-and-go queue creeping toward the city
  const lanes = {};
  for (const c of A.cars) (lanes[c.lane] || (lanes[c.lane] = [])).push(c);
  for (const k in lanes) {
    const L = lanes[k].sort((a, b) => a.y - b.y);
    for (let i = 0; i < L.length; i++) {
      const c = L[i], v = Math.max(0, 2.2 + 3.4 * Math.sin(t * 0.8 - c.y * 0.05));
      c.v = v;
      let ny = c.y - v * dt;
      if (i > 0) { const f = L[i - 1]; ny = Math.max(ny, f.y + f.len / 2 + c.len / 2 + 1.3); }
      c.y = Math.min(c.y, ny);
    }
    const first = L[0];
    if (first && first.y < 246) { const last = L[L.length - 1]; first.y = Math.max(486, last.y + last.len / 2 + first.len / 2 + 2); }
  }
  for (const a of A.artcars) {
    a.s = (a.s + a.v * dt) % a.pl.len;
    const p = brcmAlong(a.pl, a.s), d = Math.hypot(p.dx, p.dy) || 1;
    a.x = p.x; a.y = p.y; a.hx = lerp(a.hx, p.dx / d, Math.min(1, dt * 6)); a.hy = lerp(a.hy, p.dy / d, Math.min(1, dt * 6));
    a.tt += dt;
    if (a.tt > 0.06) { a.tt = 0; a.trail.unshift(a.x, a.y); if (a.trail.length > 80) a.trail.length = 80; }
  }
  for (const d of A.devils) {
    d.a += Math.sin(t * 0.3 + d.ph) * dt * 0.6;
    d.x += Math.cos(d.a) * 7 * dt; d.y += Math.sin(d.a) * 7 * dt;
    const r = Math.hypot(d.x, d.y);
    if (r > 380 || (r < 250 && Math.abs(brcmClockDiff(Math.atan2(d.x, -d.y) / TAU * 12, 12)) > 2)) d.a = Math.atan2(-d.y, -d.x) + (r > 380 ? 0 : Math.PI) + Math.sin(d.ph) * 0.8;
  }
  const B = BRCM.B;
  for (const c of A.clouds) {
    c.x += c.vx * dt; c.y += c.vy * dt;
    if (c.x - c.s > B.x1) c.x = B.x0 - c.s; if (c.y - c.s > B.y1) c.y = B.y0 - c.s; if (c.y + c.s < B.y0) c.y = B.y1 + c.s;
  }
}

/* ---------- landmark and actor drawings (world units, world transform active) ---------- */
function brcmDrawMan(ctx, t, z) {
  const pulse = 0.72 + 0.28 * Math.sin(t * 1.9);
  ctx.save(); ctx.scale(1.75, 1.75); z *= 1.75;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.55 * pulse; ctx.drawImage(brcmGlow('#55c8ff', 1), -40, -56, 80, 80);
  ctx.globalAlpha = 0.3 * pulse; ctx.drawImage(brcmGlow('#9be6ff', 0), -12, -26, 24, 24);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // octagonal base seen from a little above
  const oct = (cy, rx, ry) => { const p = []; for (let k = 0; k < 8; k++) { const a = (k * 45 + 22.5) * Math.PI / 180; p.push([Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; };
  const top = oct(-3, 10, 3.6);
  ctx.fillStyle = '#6b4a35'; ctx.beginPath();
  ctx.moveTo(top[0][0], top[0][1]); for (const k of [1, 2, 3]) ctx.lineTo(top[k][0], top[k][1]);
  for (const k of [3, 2, 1, 0]) ctx.lineTo(top[k][0], top[k][1] + 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a3d2c'; ctx.beginPath(); ctx.moveTo(top[3][0], top[3][1]); ctx.lineTo(top[4][0], top[4][1]); ctx.lineTo(top[4][0], top[4][1] + 4); ctx.lineTo(top[3][0], top[3][1] + 4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(top[7][0], top[7][1]); ctx.lineTo(top[0][0], top[0][1]); ctx.lineTo(top[0][0], top[0][1] + 4); ctx.lineTo(top[7][0], top[7][1] + 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b48b62'; ctx.beginPath(); top.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(80,50,30,0.5)'; ctx.lineWidth = Math.max(0.15, 0.6 / z); ctx.beginPath();
  for (let x = -8; x <= 8; x += 2) { ctx.moveTo(x, -6); ctx.lineTo(x, 0); } ctx.stroke();
  ctx.strokeStyle = rgba('#7fe0ff', 0.7 + 0.3 * pulse); ctx.lineWidth = Math.max(0.35, 1 / z);
  ctx.beginPath(); top.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
  // the figure: neon outline over a wooden body
  const fig = () => {
    ctx.beginPath();
    ctx.moveTo(-2.8, -4.5); ctx.lineTo(0, -11); ctx.lineTo(2.8, -4.5);
    ctx.moveTo(0, -11); ctx.lineTo(0, -17.5);
    ctx.moveTo(-7.2, -27.2); ctx.lineTo(-4.6, -21.6); ctx.lineTo(0, -17); ctx.lineTo(4.6, -21.6); ctx.lineTo(7.2, -27.2);
    ctx.moveTo(0, -18); ctx.lineTo(-1.7, -20); ctx.lineTo(0, -23.4); ctx.lineTo(1.7, -20); ctx.closePath();
  };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(80,190,255,${0.35 * pulse + 0.15})`; ctx.lineWidth = Math.max(2.4, 4 / z); fig(); ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = '#5a3e2a'; ctx.lineWidth = Math.max(1.1, 1.6 / z); fig(); ctx.stroke();
  ctx.strokeStyle = '#c8f3ff'; ctx.lineWidth = Math.max(0.45, 0.9 / z); fig(); ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.restore();
}

function brcmDrawTemple(ctx, t, z) {
  const y0 = -58, glow = 0.8 + 0.2 * Math.sin(t * 0.9);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.6 * glow; ctx.drawImage(brcmGlow('#ffae4a', 1), -40, y0 - 52, 80, 80);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const wood = '#9b7049', woodD = '#6e4b2f', woodL = '#d2a56d', lw = Math.max(0.15, 0.55 / z);
  // platform
  ctx.fillStyle = woodD; ctx.fillRect(-15, y0 - 2.5, 30, 3.5);
  ctx.fillStyle = '#b8905f'; ctx.fillRect(-15, y0 - 5, 30, 2.6);
  // side pavilions
  for (const sx of [-1, 1]) {
    const x = sx * 11;
    ctx.fillStyle = wood; ctx.fillRect(x - 2.6, y0 - 9.5, 5.2, 4.6);
    ctx.fillStyle = 'rgba(255,196,110,0.85)'; ctx.fillRect(x - 1, y0 - 8.4, 2, 3.4);
    ctx.fillStyle = woodD; ctx.beginPath(); ctx.moveTo(x - 4, y0 - 9.3); ctx.quadraticCurveTo(x, y0 - 13.2, x + 4, y0 - 9.3); ctx.lineTo(x + 4.6, y0 - 10.2); ctx.quadraticCurveTo(x, y0 - 12, x - 4.6, y0 - 10.2); ctx.closePath(); ctx.fill();
  }
  // main hall with glowing arches
  ctx.fillStyle = wood; ctx.fillRect(-7.5, y0 - 11.5, 15, 6.6);
  ctx.fillStyle = 'rgba(255,206,120,0.92)';
  for (const x of [-4.8, 0, 4.8]) { ctx.beginPath(); ctx.moveTo(x - 1.3, y0 - 5); ctx.lineTo(x - 1.3, y0 - 8.6); ctx.arc(x, y0 - 8.6, 1.3, Math.PI, 0); ctx.lineTo(x + 1.3, y0 - 5); ctx.closePath(); ctx.fill(); }
  const roof = (y, w, h) => {
    ctx.fillStyle = woodD; ctx.beginPath(); ctx.moveTo(-w, y); ctx.quadraticCurveTo(-w * 0.45, y - h * 0.55, 0, y - h); ctx.quadraticCurveTo(w * 0.45, y - h * 0.55, w, y);
    ctx.lineTo(w + 1.1, y - 1.1); ctx.quadraticCurveTo(w * 0.5, y - h * 0.65, 0, y - h - 1); ctx.quadraticCurveTo(-w * 0.5, y - h * 0.65, -w - 1.1, y - 1.1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = woodL; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(-w - 1.1, y - 1.1); ctx.quadraticCurveTo(-w * 0.5, y - h * 0.65, 0, y - h - 1); ctx.quadraticCurveTo(w * 0.5, y - h * 0.65, w + 1.1, y - 1.1); ctx.stroke();
  };
  roof(y0 - 11.2, 10.5, 4);
  ctx.fillStyle = wood; ctx.fillRect(-5, y0 - 19, 10, 4.6); ctx.fillStyle = 'rgba(255,206,120,0.9)'; ctx.fillRect(-1.2, y0 - 18.2, 2.4, 3.2);
  roof(y0 - 18.7, 7.4, 3.3);
  ctx.fillStyle = wood; ctx.fillRect(-2.9, y0 - 25.3, 5.8, 3.6); ctx.fillStyle = 'rgba(255,206,120,0.85)'; ctx.fillRect(-0.7, y0 - 24.6, 1.4, 2.4);
  roof(y0 - 25, 4.6, 2.6);
  ctx.strokeStyle = woodD; ctx.lineWidth = Math.max(0.35, 0.8 / z); ctx.beginPath(); ctx.moveTo(0, y0 - 28.5); ctx.lineTo(0, y0 - 34); ctx.stroke();
  // lattice
  ctx.strokeStyle = 'rgba(60,36,20,0.45)'; ctx.lineWidth = lw; ctx.beginPath();
  for (let x = -7; x <= 7; x += 1.75) { ctx.moveTo(x, y0 - 11.5); ctx.lineTo(x, y0 - 10); } ctx.stroke();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.8 * glow; ctx.drawImage(brcmGlow('#ffd27a', 0), -3, y0 - 37, 6, 6);
  // candles around the base
  for (let k = 0; k < 14; k++) {
    const a = k / 14 * TAU, x = Math.cos(a) * 17, y = y0 + 1.5 + Math.sin(a) * 4.2, f = 0.55 + 0.45 * Math.sin(t * 9 + k * 2.1) * Math.sin(t * 5.3 + k);
    ctx.globalAlpha = 0.5 + 0.5 * f; ctx.drawImage(brcmGlow('#ffb45a', 0), x - 1.6, y - 1.6, 3.2, 3.2);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

function brcmDrawArt(ctx, a, t, z) {
  const s = a.s, ph = a.ph, hue = (a.hue + t * 24) % 360, lw = Math.max(0.3, 1 / z);
  ctx.save(); ctx.translate(a.x, a.y); ctx.scale(s, s);
  const col = `hsl(${hue},95%,64%)`, col2 = `hsl(${(hue + 120) % 360},95%,64%)`;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.5; ctx.drawImage(brcmGlow(BRCM.LIGHTS[(a.hue >> 5) % 8], 1), -16, -22, 32, 32);
  ctx.globalAlpha = 0.45; ctx.drawImage(brcmGlow(BRCM.LIGHTS[(a.hue >> 5) % 8], 1), -9, -4, 18, 8);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (a.kind) {
    case 'lotus': {
      ctx.fillStyle = '#3a2c40'; ctx.beginPath(); ctx.ellipse(0, -0.5, 4, 1.4, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        const ang = -Math.PI / 2 + (i - 3) * 0.36 + Math.sin(t * 0.8 + ph) * 0.05;
        ctx.fillStyle = `hsla(${(hue + i * 22) % 360},95%,62%,0.55)`;
        ctx.save(); ctx.translate(0, -1.5); ctx.rotate(ang + Math.PI / 2); ctx.beginPath(); ctx.ellipse(0, -5, 1.7, 5, 0, 0, TAU); ctx.fill(); ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'spire': {
      ctx.fillStyle = '#2c2440'; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(2, 0); ctx.lineTo(0.5, -16); ctx.lineTo(-0.5, -16); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-0.5, -16); ctx.moveTo(2, 0); ctx.lineTo(0.5, -16); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + ph);
      ctx.drawImage(brcmGlow('#ffffff', 0), -3.5, -19.5, 7, 7); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'ring': {
      ctx.strokeStyle = '#2c2440'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-4, -4); ctx.moveTo(3, 0); ctx.lineTo(4, -4); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = col; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(0, -9, 5, 7, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = lw * 0.6; ctx.stroke();
      for (let i = 0; i < 6; i++) { const u = t * 1.5 + i / 6 * TAU + ph; ctx.fillStyle = col2; ctx.beginPath(); ctx.arc(Math.cos(u) * 3, -9 + Math.sin(u) * 4.5, 0.45, 0, TAU); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'jelly': {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = col2; ctx.lineWidth = lw;
      for (let i = 0; i < 6; i++) { const x0 = -4 + i * 1.6; ctx.beginPath(); ctx.moveTo(x0, -10); for (let k = 1; k <= 6; k++) ctx.lineTo(x0 + Math.sin(t * 2 + k * 0.9 + i + ph) * 0.8, -10 + k * 1.5); ctx.stroke(); }
      ctx.fillStyle = `hsla(${hue},90%,62%,0.6)`; ctx.beginPath(); ctx.ellipse(0, -10.5, 6, 4.4, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = lw * 0.7; ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'tree': {
      ctx.strokeStyle = '#4a3a3c'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -8); ctx.moveTo(0, -5); ctx.lineTo(-4, -10); ctx.moveTo(0, -6); ctx.lineTo(4, -11); ctx.moveTo(0, -8); ctx.lineTo(-1, -13); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) {
        const u = i * 2.39996, r = 2 + (i % 5), x = Math.cos(u) * r * 1.1, y = -10.5 + Math.sin(u) * r * 0.6;
        ctx.fillStyle = `hsla(${(hue + i * 30) % 360},95%,65%,${0.45 + 0.55 * Math.max(0, Math.sin(t * 2.4 + i))})`; ctx.beginPath(); ctx.arc(x, y, 0.75, 0, TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'head': {
      ctx.fillStyle = '#7b7a88'; ctx.beginPath(); ctx.ellipse(0, -8, 5, 7.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9d9cab'; ctx.beginPath(); ctx.ellipse(-1.4, -9.5, 2.6, 5, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; const e = 0.6 + 0.4 * Math.sin(t * 1.3 + ph);
      ctx.globalAlpha = e; ctx.drawImage(brcmGlow('#4af2ff', 0), -4, -12, 3.2, 3.2); ctx.drawImage(brcmGlow('#4af2ff', 0), 0.8, -12, 3.2, 3.2); ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#3c3a48'; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(-1.8, -4.5); ctx.quadraticCurveTo(0, -3.6, 1.8, -4.5); ctx.stroke();
      break;
    }
    case 'disco': {
      ctx.strokeStyle = '#3c3248'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-2.5, 0); ctx.lineTo(0, -5); ctx.lineTo(2.5, 0); ctx.stroke();
      const g = ctx.createRadialGradient(-1.5, -11, 0.5, 0, -9.5, 4.6); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#8c8aa0');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -9.5, 4.6, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(60,50,80,0.45)'; ctx.lineWidth = lw * 0.5; ctx.beginPath();
      for (let k = -3; k <= 3; k++) { ctx.moveTo(-4.4, -9.5 + k * 1.3); ctx.lineTo(4.4, -9.5 + k * 1.3); ctx.moveTo(k * 1.3 + ((t * 1.5) % 1.3) - 0.65, -14); ctx.lineTo(k * 1.3 + ((t * 1.5) % 1.3) - 0.65, -5); }
      ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) { const u = t * 0.9 + i * 0.9 + ph, f = Math.max(0, Math.sin(t * 4 + i * 1.7)); ctx.fillStyle = `hsla(${(hue + i * 50) % 360},100%,70%,${f})`; ctx.beginPath(); ctx.arc(Math.cos(u) * 9, -6 + Math.sin(u) * 4, 0.55, 0, TAU); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'pyramid': {
      ctx.fillStyle = 'rgba(30,26,44,0.85)'; ctx.beginPath(); ctx.moveTo(-6.5, 0); ctx.lineTo(0, -11); ctx.lineTo(6.5, 0); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.5, lw); ctx.stroke();
      ctx.beginPath(); for (let k = 1; k < 4; k++) { const f = (k / 4 + t * 0.25) % 1, y = -11 * (1 - f); ctx.moveTo(-6.5 * f, y); ctx.lineTo(6.5 * f, y); } ctx.strokeStyle = col2; ctx.lineWidth = lw * 0.6; ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'wave': {
      for (let i = 0; i < 9; i++) {
        const u = (i - 4) * 0.32, x = Math.sin(u) * 9, y = -Math.cos(u) * 3 + 2, h = 6;
        ctx.strokeStyle = '#3c3248'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
        const f = 0.2 + 0.8 * Math.max(0, Math.sin(t * 3 - i * 0.7 + ph));
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = f; ctx.drawImage(brcmGlow(BRCM.LIGHTS[i % 8], 0), x - 2, y - h - 2, 4, 4); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      break;
    }
    case 'spiral': {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 22; i++) { const u = i * 0.55 + t * 1.2 + ph, r = 1 + i * 0.32; ctx.fillStyle = `hsla(${(hue + i * 14) % 360},95%,65%,0.9)`; ctx.beginPath(); ctx.arc(Math.cos(u) * r, -8 + Math.sin(u) * r * 0.55, 0.5, 0, TAU); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#3c3248'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -8); ctx.stroke();
      break;
    }
    case 'butterfly': {
      const f = 0.55 + 0.45 * Math.abs(Math.sin(t * 1.6 + ph));
      ctx.strokeStyle = '#3c3248'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -6); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      for (const sx of [-1, 1]) {
        ctx.fillStyle = `hsla(${(hue + (sx > 0 ? 40 : 0)) % 360},95%,62%,0.6)`;
        ctx.beginPath(); ctx.ellipse(sx * 3.6 * f, -10, 3.6 * f, 4.4, sx * 0.3, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(sx * 2.6 * f, -5.8, 2.4 * f, 2.6, -sx * 0.4, 0, TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#2c2440'; ctx.beginPath(); ctx.ellipse(0, -8, 0.6, 3.4, 0, 0, TAU); ctx.fill();
      break;
    }
  }
  ctx.lineCap = 'butt';
  ctx.restore();
}

function brcmDrawArtCar(ctx, a, t, z) {
  const ang = Math.atan2(a.hy, a.hx), lw = Math.max(0.3, 0.9 / z);
  // light trail
  const tr = a.trail;
  if (tr.length > 4) {
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [n, w, al] of [[tr.length, 3.2, 0.16], [Math.min(tr.length, 40), 1.6, 0.3], [Math.min(tr.length, 16), Math.max(0.5, 1 / z), 0.55]]) {
      ctx.strokeStyle = rgba(a.c, al); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a.x, a.y);
      for (let i = 0; i < n; i += 2) ctx.lineTo(tr[i], tr[i + 1]);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.8; ctx.drawImage(brcmGlow(a.c, 1), a.x - 12, a.y - 12, 24, 24); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'butt';
  }
  if (a.kind === 'dragon') {        // a long body that follows its own trail
    for (let i = 20; i >= 0; i -= 4) {
      const x = tr[i] !== undefined ? tr[i] : a.x, y = tr[i + 1] !== undefined ? tr[i + 1] : a.y, r = 2.2 - i * 0.05;
      ctx.fillStyle = i % 8 ? '#c83a2e' : '#e8a23a'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
  }
  ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(ang);
  switch (a.kind) {
    case 'whale':
      ctx.fillStyle = '#2a5ab0'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 2.7, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-8.6, -2.6); ctx.lineTo(-7.6, 0); ctx.lineTo(-8.6, 2.6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8fe4ff'; ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(0, 0, 6, 2.7, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#d8f6ff'; ctx.beginPath(); ctx.arc(3.6, -1, 0.5, 0, TAU); ctx.arc(3.6, 1, 0.5, 0, TAU); ctx.fill();
      break;
    case 'fish':
      ctx.fillStyle = '#ff7a2e'; ctx.beginPath(); ctx.ellipse(0, 0, 4.4, 2, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-3.6, 0); ctx.lineTo(-6.6, -2.2); ctx.lineTo(-6.6, 2.2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffe0a0'; ctx.lineWidth = lw * 0.7; ctx.beginPath(); for (const x of [-1.5, 0, 1.5]) { ctx.moveTo(x, -1.6); ctx.quadraticCurveTo(x + 0.8, 0, x, 1.6); } ctx.stroke();
      break;
    case 'bus':
      ctx.fillStyle = '#5a2fb8'; rr(ctx, -5.6, -2.1, 11.2, 4.2, 0.8); ctx.fill();
      ctx.fillStyle = '#8f62ff'; rr(ctx, -4.2, -1.5, 7, 3, 0.5); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-0.7, 0, 1, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { const u = t * 3 + i * 1.256; ctx.fillStyle = `hsla(${(i * 70 + t * 90) % 360},100%,70%,0.85)`; ctx.beginPath(); ctx.arc(-0.7 + Math.cos(u) * 3, Math.sin(u) * 1.6, 0.35, 0, TAU); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
      break;
    case 'cupcake':
      ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff8ad8';
      for (let k = 0; k < 8; k++) { const u = k / 8 * TAU; ctx.beginPath(); ctx.arc(Math.cos(u) * 2.1, Math.sin(u) * 2.1, 1.25, 0, TAU); ctx.fill(); }
      ctx.beginPath(); ctx.arc(0, 0, 2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff2a4a'; ctx.beginPath(); ctx.arc(0, 0, 0.8, 0, TAU); ctx.fill();
      break;
    case 'snail':
      ctx.fillStyle = '#9adf6a'; ctx.beginPath(); ctx.ellipse(0.8, 0, 3.6, 1.2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c86a3a'; ctx.beginPath(); ctx.arc(-0.6, 0, 2.2, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#ffd08a'; ctx.lineWidth = lw * 0.7; ctx.beginPath(); for (let k = 0; k <= 24; k++) { const u = k * 0.45, r = 0.1 + k * 0.08; k ? ctx.lineTo(-0.6 + Math.cos(u) * r, Math.sin(u) * r) : ctx.moveTo(-0.6, 0); } ctx.stroke();
      break;
    case 'dragon':
      ctx.fillStyle = '#e8463a'; ctx.beginPath(); ctx.ellipse(0.6, 0, 2.6, 1.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffe14a'; ctx.beginPath(); ctx.arc(1.6, -0.8, 0.4, 0, TAU); ctx.arc(1.6, 0.8, 0.4, 0, TAU); ctx.fill();
      if (Math.sin(t * 1.7) > 0.86) { ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(brcmGlow('#ff9a2a', 1), 3, -3, 7, 6); ctx.globalCompositeOperation = 'source-over'; }
      break;
  }
  ctx.restore();
}

function brcmDrawLaser(ctx, L, t, z) {
  const act = Math.sin(t * 0.21 * L.sp + L.ph);
  if (act < 0.3) return;
  const env = Math.min(1, (act - 0.3) * 4), base = Math.atan2(-L.y, -L.x);
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    const a = base + Math.sin(t * 0.9 * L.sp + L.ph) * 0.55 + i * 0.13, len = 165;
    const x1 = L.x + Math.cos(a) * len, y1 = L.y + Math.sin(a) * len;
    ctx.strokeStyle = rgba(L.c, 0.09 * env); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(L.x, L.y); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = rgba(L.c, 0.55 * env); ctx.lineWidth = Math.max(0.35, 0.9 / z); ctx.stroke();
  }
  ctx.globalAlpha = env; ctx.drawImage(brcmGlow(L.c, 0), L.x - 3, L.y - 3, 6, 6); ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'butt';
}

/* ---------- caches shared across visits: tiles (close view) and the whole-map canvas (overview) ---------- */
const BRCM_CACHE = { key: '', tiles: new Map(), pool: [], base: null };
// leaving the map: keep only the tiles around Brady (quick return), free the rest
function brcmTrimCache(keep) {
  const C = BRCM_CACHE;
  while (C.tiles.size > keep) { const k = C.tiles.keys().next().value, c = C.tiles.get(k); C.tiles.delete(k); c.width = 0; c.height = 0; }
  for (const c of C.pool) { c.width = 0; c.height = 0; }
  C.pool.length = 0;
  if (C.base) { C.base.c.width = 0; C.base.c.height = 0; C.base = null; }
}
const BRCM_RB = { x0: BRCM.B.x0 - 90, y0: BRCM.B.y0 - 90, x1: BRCM.B.x1 + 90, y1: BRCM.B.y1 + 90 };   // rendered area
const BRCM_RLABEL = {
  41: [{ x: 26, y: 405, rot: -Math.PI / 2, text: 'GATE ROAD' }],
  42: [{ x: 0, y: 80, text: 'CENTER CAMP' }],
  43: [{ c: 3.8, r: 206, text: 'SOUND CAMPS' }],
  44: [{ c: 8.2, r: 206, text: 'THEME CAMPS' }],
  45: [{ c: 4.05, r: 54, text: 'ART CARS', minZ: 1.3 }],
  46: [{ c: 7.95, r: 54, text: 'DEEP PLAYA', minZ: 1.3 }],
  47: [{ x: 0, y: 28, text: 'THE MAN', small: true, minZ: 1.6 }, { x: 31, y: -56, text: 'THE TEMPLE', small: true, minZ: 1.6 }],
  48: [{ x: 168, y: -224, rot: 0.63, text: 'THE TRASH FENCE' }],
  49: [{ c: 0.35, r: 178, text: 'SUNRISE SET' }]
};

class BRCMapScene {
  constructor(opts) {
    opts = opts || {};
    this.t = 0;
    Input.setMode('ui');
    Sound.music('brcmap');
    this.G = brcmGeo();
    this.A = brcmMakeActors();
    this.parts = [];
    this.ptrs = new Map();
    this.popT = {}; this.bumpT = {};
    this.toast = null; this.banner = null; this.flash = 0; this.inertia = null; this.suppress = 0; this.dustT = 0; this.intro = 1;
    this.fx = 1; this.slowT = 0;          // effects quality: drops to 0.5 if frames keep running long
    this.zoomMode = 'close'; this.zoomAnim = null;
    this.facing = 1; this.anim = { state: 'idle', t: 0, phase: 0, speed: 1 };
    this.cam = { x: 0, y: 0, z: 2, follow: true };
    this.initState(opts);
    this.initFog();
    this.resize();
    const p = this.bradyPos();
    this.cam.z = this.zClose; this.cam.x = p.x; this.cam.y = p.y - this.lift(this.zClose);
    if (this.firstVisit && !this.rv) { this.zoomMode = 'over'; this.cam.z = this.zOver; this.cam.x = 0; this.cam.y = 58; this.cam.follow = false; this.establish = 1.6; }
    this.clampCam();
    this.perf = { frames: 0, drawMs: 0, maxMs: 0, tiles: 0, tileMs: 0 };
  }

  /* ----- progress, seen-state and the reveal queue ----- */
  initState(opts) {
    const G = this.G, d = Save.data;
    if (!d.world3 || typeof d.world3 !== 'object') d.world3 = {};
    const w3 = this.w3 = d.world3;
    const ok = id => !!(id && G.nodes[id] && WorldGame.isUnlocked(id));
    const from = ok(opts.from) ? opts.from : null;
    this.firstVisit = !w3.seen || typeof w3.seen !== 'object';
    if (this.firstVisit) {
      w3.seen = {};
      const fresh = new Set();
      if (from) for (const e of G.adj[from]) if (e.dir === 1 && WorldGame.pathOpen(e.P.p)) fresh.add(e.other);
      for (const N of G.list) if (WorldGame.isUnlocked(N.id) && !fresh.has(N.id)) w3.seen[N.id] = true;
    }
    if (!w3.seenPaths || typeof w3.seenPaths !== 'object') {
      w3.seenPaths = {};
      for (const P of G.paths) if (this.pathLive(P) && w3.seen[P.from] && w3.seen[P.to]) w3.seenPaths[P.key] = true;
    }
    let cur = from || (ok(w3.node) ? w3.node : null);
    if (!cur) { cur = WorldGame.start; for (const N of G.list) if (WorldGame.isUnlocked(N.id) && !WorldGame.isDone(N.id) && w3.seen[N.id]) { cur = N.id; break; } }
    w3.seen[cur] = true; w3.node = cur;
    this.cur = cur; this.sel = cur; this.walk = null;
    // what changed since the last visit
    const known = new Set(Object.keys(w3.seen).filter(id => G.nodes[id] && WorldGame.isUnlocked(id)));
    this.regionK = {};
    for (const w of WORLD3_REGIONS) this.regionK[w] = G.list.some(N => N.w === w && known.has(N.id)) ? 1 : 0;
    const newPaths = G.paths.filter(P => this.pathLive(P) && !w3.seenPaths[P.key]);
    const seq = [], used = new Set(), regionSeen = Object.assign({}, this.regionK);
    let progress = true;
    while (progress) {
      progress = false;
      const cands = newPaths.filter(P => !used.has(P.key) && (known.has(P.from) || known.has(P.to)));
      cands.sort((a, b) => (a.from === cur ? 0 : 1) - (b.from === cur ? 0 : 1));
      for (const P of cands) {
        used.add(P.key);
        const fwd = known.has(P.from), target = fwd ? P.to : P.from, node = known.has(target) ? null : target;
        const step = { P, dir: fwd ? 1 : -1, node, secret: P.secret };
        if (node && !regionSeen[G.nodes[node].w]) { step.region = G.nodes[node].w; regionSeen[step.region] = 1; }
        seq.push(step); known.add(target); progress = true;
      }
    }
    for (const P of newPaths) if (!used.has(P.key)) {
      const node = known.has(P.to) ? null : P.to, step = { P, dir: 1, node, secret: P.secret };
      if (node && !regionSeen[G.nodes[node].w]) { step.region = G.nodes[node].w; regionSeen[step.region] = 1; }
      seq.push(step); known.add(P.to); known.add(P.from);
    }
    for (const N of G.list) if (WorldGame.isUnlocked(N.id) && !known.has(N.id)) {
      const step = { P: null, node: N.id };
      if (!regionSeen[N.w]) { step.region = N.w; regionSeen[N.w] = 1; }
      seq.push(step); known.add(N.id);
    }
    this.pendingNodes = new Set(seq.filter(s => s.node).map(s => s.node));
    this.pendingPaths = new Set(seq.filter(s => s.P).map(s => s.P.key));
    this.rv = seq.length ? { seq, i: 0, t: -0.9, phase: 'path' } : null;
    if (!this.rv) Save.save();
  }
  pathLive(P) { return WorldGame.pathOpen(P.p) && WorldGame.isUnlocked(P.from) && WorldGame.isUnlocked(P.to); }
  edgeOK(P) { return this.pathLive(P) && !this.pendingPaths.has(P.key); }
  nodeState(id) {
    const c = this.nsCache && this.nsCache.get(id);
    if (c) return c;
    let st;
    if (this.pendingNodes.has(id)) st = this.hintVisible(id) ? 'locked' : 'hidden';
    else if (WorldGame.isUnlocked(id)) st = WorldGame.isDone(id) ? 'done' : 'open';
    else st = this.hintVisible(id) ? 'locked' : 'hidden';
    if (this.nsCache) this.nsCache.set(id, st);
    return st;
  }
  hintVisible(id) {
    const N = this.G.nodes[id];
    if ((this.regionK[N.w] || 0) >= 0.99) return true;
    for (const e of this.G.adj[id]) if (e.dir === -1 && !e.P.secret && WorldGame.isUnlocked(e.P.from) && !this.pendingNodes.has(e.P.from)) return true;
    return false;
  }
  pathState(P) {
    if (this.rv && this.rv.step && this.rv.step.P === P && this.rv.phase === 'path') return 'reveal';
    if (this.pendingPaths.has(P.key)) return !P.secret && this.nodeState(P.from) !== 'hidden' && this.nodeState(P.to) !== 'hidden' ? 'hint' : 'hidden';
    if (this.pathLive(P)) return 'open';
    if (P.secret) return 'hidden';
    return this.nodeState(P.from) !== 'hidden' && this.nodeState(P.to) !== 'hidden' ? 'hint' : 'hidden';
  }
  finishReveal() {
    const rv = this.rv; if (!rv) return;
    for (const s of rv.seq) {
      if (s.node && this.popT[s.node] === undefined) this.popT[s.node] = 0.6;
      if (s.region) this.regionK[s.region] = 1;
    }
    this.pendingNodes.clear(); this.pendingPaths.clear();
    for (const N of this.G.list) if (WorldGame.isUnlocked(N.id)) this.w3.seen[N.id] = true;
    for (const P of this.G.paths) if (this.pathLive(P)) this.w3.seenPaths[P.key] = true;
    Save.save();
    this.rv = null; this.fogDirty = true; this.cam.follow = true;
  }
  stepReveal(dt) {
    const rv = this.rv, s = rv.seq[rv.i];
    rv.step = s; rv.t += dt;
    if (rv.phase === 'path') {
      const dur = s.P ? clamp(s.P.len / 110, 0.7, 1.8) : 0;
      if (s.P && rv.t >= 0 && !rv.started) { rv.started = true; if (s.secret) { Sound.play('secret'); this.flash = 0.5; } else Sound.play('appear', { vol: 0.6 }); }
      if (s.P && rv.t > 0) {
        const p = clamp(rv.t / dur, 0, 1), h = brcmAlong(s.P, s.dir === 1 ? p * s.P.len : (1 - p) * s.P.len);
        rv.head = h;
        const n = s.secret ? 3 : 2;
        for (let i = 0; i < n; i++) this.spark(h.x, h.y, s.secret ? BRCM.LIGHTS[((this.t * 9) | 0) + i * 3 & 7] : (i ? '#ffffff' : '#ff8ae0'), 40, 0.7);
      } else if (!s.P) rv.head = this.G.nodes[s.node];
      if (rv.t >= dur) {
        rv.phase = 'pop'; rv.t = 0; rv.started = false;
        if (s.node) {
          this.popT[s.node] = 0; this.pendingNodes.delete(s.node); this.fogDirty = true;
          const N = this.G.nodes[s.node];
          for (let i = 0; i < 26; i++) this.spark(N.x, N.y, s.secret ? BRCM.LIGHTS[i & 7] : (i % 3 ? '#ffd84a' : '#ffffff'), 90, 1.1);
          Sound.play(s.secret ? 'gold' : 'pick', { vol: 0.7 });
          if (s.region) { this.regionAnim = { w: s.region, t: 0 }; this.banner = { w: s.region, t: 0 }; }
        }
        if (s.P) this.pendingPaths.delete(s.P.key);
      }
    } else if (rv.t >= (s.node ? 0.95 : 0.4) + (rv.i === rv.seq.length - 1 ? 0.5 : 0)) {
      rv.i++; rv.t = -0.15; rv.phase = 'path';
      if (rv.i >= rv.seq.length) this.finishReveal();
    }
  }

  /* ----- layout ----- */
  resize() {
    const W = Game.cssW, H = Game.cssH, portrait = H > W * 1.05;
    this.portrait = portrait;
    const sl = Math.max(12, insets.l + 6), sr = Math.max(12, insets.r + 6), st = Math.max(8, insets.t + 4), sb = Math.max(10, insets.b + 6);
    this.safe = { l: sl, r: sr, t: st, b: sb };
    this.topH = st + 50;
    const ph = portrait ? 156 : 78;
    this.panel = { x: sl, y: H - sb - ph, w: W - sl - sr, h: ph };
    const P = this.panel;
    this.btnBack = { x: sl, y: st + 4, w: 92, h: 38, label: '◀ BACK', fn: () => this.back() };
    this.btnZoom = { x: W - sr - 52, y: st + 4, w: 52, h: 38, label: '', fn: () => this.toggleZoom() };
    this.btnPlay = portrait ? { x: P.x + 12, y: P.y + P.h - 56, w: P.w - 24, h: 46, label: 'PLAY', primary: true, size: 18, fn: () => this.playSel() }
      : { x: P.x + P.w - 160, y: P.y + (P.h - 52) / 2, w: 148, h: 52, label: 'PLAY', primary: true, size: 18, fn: () => this.playSel() };
    this.btns = [this.btnBack, this.btnZoom, this.btnPlay];
    this.vcx = W / 2; this.vcy = (this.topH + P.y) / 2;
    this.zClose = clamp(Math.min(W, H) / 170, 2, 3.4);
    this.zOver = clamp(Math.min((W - sl - sr) / 520, (P.y - this.topH) / 372), 0.3, 1.6);
    const z1 = this.zoomMode === 'over' ? this.zOver : this.zClose;
    if (this.zoomAnim) this.zoomAnim = null;
    this.cam.z = z1;
    const v = makeCanvas(64, 64), vx = v.getContext('2d'), vg = vx.createRadialGradient(32, 32, 14, 32, 32, 46);
    vg.addColorStop(0, 'rgba(7,4,14,0)'); vg.addColorStop(1, 'rgba(7,4,14,0.62)');
    vx.fillStyle = vg; vx.fillRect(0, 0, 64, 64); this.vig = v;
    this.clampCam();
  }
  lift(z) { return 12 / (z || this.cam.z); }
  clampCam() {
    const c = this.cam, z = c.z, B = BRCM.B, W = Game.cssW;
    const minX = B.x0 + this.vcx / z, maxX = B.x1 - (W - this.vcx) / z;
    c.x = minX > maxX ? (B.x0 + B.x1) / 2 : clamp(c.x, minX, maxX);
    const minY = B.y0 + (this.vcy - this.topH) / z, maxY = B.y1 - (this.panel.y - this.vcy) / z;
    c.y = minY > maxY ? (B.y0 + B.y1) / 2 : clamp(c.y, minY, maxY);
  }
  clampedAt(x, y, z) { const c = this.cam, o = { x: c.x, y: c.y, z: c.z }; c.x = x; c.y = y; c.z = z; this.clampCam(); const r = { x: c.x, y: c.y }; c.x = o.x; c.y = o.y; c.z = o.z; return r; }
  toScreen(x, y) { const c = this.cam; return { x: (x - c.x) * c.z + this.vcx, y: (y - c.y) * c.z + this.vcy }; }
  toWorld(x, y) { const c = this.cam; return { x: (x - this.vcx) / c.z + c.x, y: (y - this.vcy) / c.z + c.y }; }
  nodeScale() { return clamp(0.5 + 0.5 * (this.cam.z - this.zOver) / Math.max(0.01, this.zClose - this.zOver), 0.5, 1.15); }

  /* ----- Brady on the map ----- */
  bradyPos() {
    const w = this.walk;
    if (!w) { const N = this.G.nodes[this.cur]; return { x: N.x, y: N.y }; }
    const L = w.legs[w.li];
    return brcmAlong(L.P, L.dir === 1 ? w.s : L.P.len - w.s);
  }
  dijkstra(src) {
    const G = this.G, dist = { [src]: 0 }, prev = {}, done = new Set();
    for (;;) {
      let u = null, best = Infinity;
      for (const id in dist) if (!done.has(id) && dist[id] < best) { best = dist[id]; u = id; }
      if (u === null) break;
      done.add(u);
      for (const e of G.adj[u]) {
        if (!this.edgeOK(e.P)) continue;
        const nd = best + e.P.len;
        if (dist[e.other] === undefined || nd < dist[e.other]) { dist[e.other] = nd; prev[e.other] = { from: u, P: e.P, dir: e.dir }; }
      }
    }
    return { dist, prev };
  }
  legsTo(D, target) {
    if (D.dist[target] === undefined) return null;
    const legs = [];
    for (let id = target; D.prev[id]; id = D.prev[id].from) legs.unshift({ P: D.prev[id].P, dir: D.prev[id].dir });
    return legs;
  }
  // a route (list of legs) from where Brady is now; mid-walk he may turn around
  routeTo(target) {
    const w = this.walk;
    if (!w) { if (target === this.cur) return []; const D = this.dijkstra(this.cur); const L = this.legsTo(D, target); return L ? { legs: L, s: 0 } : null; }
    const L = w.legs[w.li], a = L.dir === 1 ? L.P.from : L.P.to, b = L.dir === 1 ? L.P.to : L.P.from;
    const Da = this.dijkstra(a), Db = this.dijkstra(b);
    const ca = Da.dist[target] !== undefined ? w.s + Da.dist[target] : Infinity;
    const cb = Db.dist[target] !== undefined ? L.P.len - w.s + Db.dist[target] : Infinity;
    if (ca === Infinity && cb === Infinity) return null;
    if (cb <= ca) return { legs: [L].concat(this.legsTo(Db, target)), s: w.s };
    return { legs: [{ P: L.P, dir: -L.dir }].concat(this.legsTo(Da, target)), s: L.P.len - w.s };
  }
  startWalk(route, target) {
    if (!route.legs.length) { this.walk = null; this.cur = target; return; }
    let total = -route.s; for (const L of route.legs) total += L.P.len;
    const keep = this.walk && this.walk.playOnArrive && this.walk.target === target;
    this.walk = { legs: route.legs, li: 0, s: route.s, target, total, done: 0, speed: clamp(total / 1.7, 70, 240), playOnArrive: keep };
    this.cam.follow = true; this.inertia = null;
  }
  stepWalk(dt) {
    const w = this.walk;
    if (!w) { this.anim.state = 'idle'; return; }
    const before = this.bradyPos();
    const left = w.total - w.done, ease = Math.min(1, 0.35 + w.done / 10) * Math.min(1, 0.25 + left / 14);
    const v = w.speed * ease * (w.playOnArrive ? 2.4 : 1);
    w.s += v * dt; w.done += v * dt;
    let L = w.legs[w.li];
    while (w.s >= L.P.len) {
      w.s -= L.P.len;
      this.cur = L.dir === 1 ? L.P.to : L.P.from;
      w.li++;
      if (w.li >= w.legs.length) { this.arrive(); return; }
      L = w.legs[w.li];
    }
    const p = this.bradyPos(), dx = p.x - before.x;
    if (Math.abs(dx) > 0.02) this.facing = dx > 0 ? 1 : -1;
    this.anim.state = 'run'; this.anim.phase += dt * 15; this.anim.speed = 1;
    this.dustT += dt;
    if (this.dustT > 0.11) { this.dustT = 0; this.parts.push({ x: p.x - this.facing * 1.5, y: p.y, vx: -this.facing * 4, vy: -3, life: 0.6, max: 0.6, c: '#e2cfbd', sz: 7, dust: true }); }
  }
  arrive() {
    const w = this.walk; this.walk = null;
    this.cur = w.target; this.w3.node = this.cur; Save.save();
    this.anim.state = 'idle';
    const N = this.G.nodes[this.cur];
    for (let i = 0; i < 8; i++) this.parts.push({ x: N.x + (Math.random() - 0.5) * 4, y: N.y, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 6, life: 0.5, max: 0.5, c: '#e2cfbd', sz: 6, dust: true });
    if (w.playOnArrive && this.sel === this.cur) this.playSel();
  }

  /* ----- actions ----- */
  back() { Sound.play('back'); Save.save(); brcmTrimCache(24); Game.setScene(new TitleScene()); }
  showToast(text) { this.toast = { text, t: 1.8 }; }
  bump(id) { Sound.play('bump'); this.bumpT[id] = 0.35; }
  playSel() {
    const id = this.sel;
    if (!WorldGame.isUnlocked(id) || this.pendingNodes.has(id)) { this.bump(id); this.showToast('LOCKED'); return; }
    if (this.walk && this.walk.target === id) { this.walk.playOnArrive = true; return; }
    if (this.cur !== id || this.walk) {
      const r = this.routeTo(id);
      if (!r) { this.bump(id); this.showToast('NO OPEN PATH YET'); return; }
      this.startWalk(r, id); if (this.walk) { this.walk.playOnArrive = true; return; }
    }
    Sound.play('select');
    this.w3.node = id; Save.save();
    brcmTrimCache(48);
    WorldGame.play(id);
  }
  tapNode(id) {
    const st = this.nodeState(id);
    if (st === 'hidden') return false;
    if (st === 'locked') { this.sel = id; this.bump(id); this.showToast('LOCKED'); return true; }
    const there = this.walk ? this.walk.target === id : this.cur === id;
    if (this.sel === id && there) { this.playSel(); return true; }
    if (there) { this.sel = id; Sound.play('select', { vol: 0.5 }); return true; }
    const r = this.routeTo(id);
    if (!r) { this.sel = id; this.bump(id); this.showToast('NO OPEN PATH YET'); return true; }
    this.sel = id; this.startWalk(r, id); Sound.play('select');
    return true;
  }
  navKey(key) {
    const vec = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[key];
    const base = this.walk ? this.walk.target : this.cur, B = this.G.nodes[base];
    let best = null;
    for (const e of this.G.adj[base]) {
      if (!this.edgeOK(e.P)) continue;
      // direction of the first stretch of the path, blended with the straight line to the neighbour
      const N = this.G.nodes[e.other], q = brcmAlong(e.P, e.dir === 1 ? Math.min(e.P.len, 14) : Math.max(0, e.P.len - 14));
      let dx = (N.x - B.x) + (q.x - B.x) * 1.5, dy = (N.y - B.y) + (q.y - B.y) * 1.5;
      const d = Math.hypot(dx, dy) || 1, dot = (dx * vec[0] + dy * vec[1]) / d;
      if (dot > 0.3 && (!best || dot > best.dot)) best = { id: e.other, dot };
    }
    if (!best) { Sound.play('bump', { vol: 0.4 }); return; }
    const r = this.routeTo(best.id);
    if (r) { this.sel = best.id; this.startWalk(r, best.id); Sound.play('select', { vol: 0.5 }); }
  }
  toggleZoom() { Sound.play('select', { vol: 0.5 }); this.setZoom(this.zoomMode === 'close' ? 'over' : 'close'); }
  setZoom(mode, focus) {
    this.zoomMode = mode; this.inertia = null;
    const z1 = mode === 'close' ? this.zClose : this.zOver;
    let x, y;
    if (mode === 'over') { x = 0; y = 58; this.cam.follow = false; this.ensureBase(true); }
    else if (focus) { x = focus.x; y = focus.y; this.cam.follow = false; }
    else { const p = this.bradyPos(); x = p.x; y = p.y - this.lift(z1); this.cam.follow = true; }
    const tgt = this.clampedAt(x, y, z1);
    this.zoomAnim = { z0: this.cam.z, z1, x0: this.cam.x, y0: this.cam.y, x1: tgt.x, y1: tgt.y, t: 0, dur: 0.55 };
  }
  isUI(x, y) {
    if (y < this.topH - 4) return true;
    const P = this.panel;
    if (x >= P.x && x <= P.x + P.w && y >= P.y - 4) return true;
    return false;
  }
  nodeAt(x, y) {
    const sc = this.nodeScale(), rad = Math.max(16, 24 * sc);
    let best = null, bd = rad;
    for (const N of this.G.list) {
      if (this.nodeState(N.id) === 'hidden') continue;
      const p = this.toScreen(N.x, N.y), d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = N.id; }
    }
    if (!best) {    // tapping Brady himself means his node
      const b = this.toScreen(this.bradyPos().x, this.bradyPos().y), s = 1.15 * sc;
      if (Math.abs(x - b.x) < 12 * s && y < b.y + 4 && y > b.y - 34 * s) best = this.walk ? this.walk.target : this.cur;
    }
    return best;
  }

  /* ----- per-step update (120 Hz) ----- */
  update(dt) {
    this.t += dt; this.anim.t += dt;
    brcmStepActors(this.A, dt, this.t);
    for (const p of this.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 1.5; p.vy *= 1 - dt * 1.5; if (!p.dust) p.vy += 6 * dt; }
    if (this.parts.length) this.parts = this.parts.filter(p => p.life > 0);
    for (const id in this.popT) { this.popT[id] += dt; if (this.popT[id] > 1.2) delete this.popT[id]; else if (this.popT[id] < 0.7) this.fogDirty = true; }
    for (const id in this.bumpT) { this.bumpT[id] -= dt; if (this.bumpT[id] <= 0) delete this.bumpT[id]; }
    if (this.toast) { this.toast.t -= dt; if (this.toast.t <= 0) this.toast = null; }
    if (this.banner) { this.banner.t += dt; if (this.banner.t > 3) this.banner = null; }
    if (this.regionAnim) { const ra = this.regionAnim; ra.t += dt; this.regionK[ra.w] = clamp(ra.t / 1.4, 0, 1); this.fogDirty = true; if (ra.t >= 1.4) this.regionAnim = null; }
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 1.6);
    if (this.suppress > 0) this.suppress -= dt;

    // input: consume the key first so UI.hitButtons does not treat arrows as focus moves
    const key = Input.uiKey; Input.uiKey = null;
    const taps = Input.taps.slice();
    const anyDown = this.trackPointers(dt);
    if (this.establish > 0) {           // first visit: hold on the dusty city, then fly down to Brady
      if (!this.intro) this.establish -= dt;
      if (this.establish <= 0 || taps.length || key || anyDown) {
        this.establish = 0; Input.taps.length = 0; this.eatTouches();
        this.setZoom('close'); this.zoomAnim.dur = 1.5;
      }
      this.stepCamera(dt);
      return;
    }
    if (this.rv) {
      this.stepReveal(dt);
      if (this.rv && (taps.length || key || anyDown)) { this.finishReveal(); this.eatTouches(); }
      Input.taps.length = 0;
    } else {
      const hit = this.suppress > 0 ? null : UI.hitButtons(this.btns);
      if (hit) { hit.fn(); return; }
      if (this.suppress <= 0) for (const tp of taps) {
        if (this.isUI(tp.x, tp.y)) continue;
        const id = this.nodeAt(tp.x, tp.y);
        if (id) { this.tapNode(id); break; }
        if (this.zoomMode === 'over') { this.setZoom('close', this.toWorld(tp.x, tp.y)); break; }
      }
      if (key === 'left' || key === 'right' || key === 'up' || key === 'down') this.navKey(key);
      else if (key === 'enter') this.playSel();
      else if (key === 'action') this.toggleZoom();
      else if (key === 'pause') { this.back(); return; }
      else if (Input.jumpPressed && !Input.usingTouch) this.playSel();
    }
    this.stepWalk(dt);
    this.stepCamera(dt);
  }
  eatTouches() { for (const p of this.ptrs.values()) p.eat = true; }
  trackPointers(dt) {
    let anyDown = false;
    const seen = new Set();
    for (const [id, t] of Input.touches) {
      seen.add(id);
      let p = this.ptrs.get(id);
      if (!p) { p = { sx: t.x, sy: t.y, lx: t.x, ly: t.y, drag: false, ui: this.isUI(t.x, t.y), vx: 0, vy: 0 }; this.ptrs.set(id, p); if (!p.ui) anyDown = true; continue; }
      if (p.ui || p.eat || this.rv) { p.lx = t.x; p.ly = t.y; continue; }
      if (!p.drag && Input.touches.size === 1 && Math.hypot(t.x - p.sx, t.y - p.sy) > 9) {
        p.drag = true; this.cam.follow = false; this.inertia = null;
        if (this.zoomAnim) { this.cam.z = this.zoomAnim.z1; this.zoomAnim = null; }
      }
      if (p.drag) {
        const dx = t.x - p.lx, dy = t.y - p.ly;
        this.cam.x -= dx / this.cam.z; this.cam.y -= dy / this.cam.z;
        p.vx = lerp(p.vx, dx / dt, 0.25); p.vy = lerp(p.vy, dy / dt, 0.25);
        this.clampCam();
      }
      p.lx = t.x; p.ly = t.y;
    }
    for (const [id, p] of this.ptrs) if (!seen.has(id)) {
      if (p.drag || p.eat) this.suppress = 0.05;
      if (p.drag && Math.hypot(p.vx, p.vy) > 60) this.inertia = { vx: p.vx, vy: p.vy };
      this.ptrs.delete(id);
    }
    return anyDown;
  }
  stepCamera(dt) {
    const c = this.cam;
    if (this.zoomAnim) {
      const a = this.zoomAnim; a.t += dt;
      const k = easeInOut(clamp(a.t / a.dur, 0, 1));
      c.z = Math.exp(lerp(Math.log(a.z0), Math.log(a.z1), k));
      c.x = lerp(a.x0, a.x1, k); c.y = lerp(a.y0, a.y1, k);
      if (a.t >= a.dur) { this.zoomAnim = null; c.z = a.z1; }
      this.clampCam();
      return;
    }
    if (this.inertia) {
      const v = this.inertia;
      c.x -= v.vx * dt / c.z; c.y -= v.vy * dt / c.z;
      const f = Math.exp(-dt * 4.5); v.vx *= f; v.vy *= f;
      if (Math.hypot(v.vx, v.vy) < 8) this.inertia = null;
      this.clampCam();
      return;
    }
    let tx = null, ty = null, rate = 5;
    if (this.rv && this.rv.head) { tx = this.rv.head.x; ty = this.rv.head.y - this.lift(); rate = 4; }
    else if (c.follow && this.zoomMode === 'close') { const p = this.bradyPos(); tx = p.x; ty = p.y - this.lift(); }
    if (tx !== null) {
      const k = 1 - Math.exp(-dt * rate);
      c.x += (tx - c.x) * k; c.y += (ty - c.y) * k;
      this.clampCam();
    }
  }
  spark(x, y, c, speed, life) {
    if (this.parts.length > 260) return;
    const a = Math.random() * TAU, v = (0.3 + Math.random()) * speed / Math.max(0.5, this.cam.z);
    this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * (0.6 + Math.random() * 0.4), max: life, c, sz: 3 + Math.random() * 3 });
  }

  /* ----- static layers: 512px tiles for the close view, one canvas for the overview ----- */
  viewRect(m) {
    const c = this.cam, W = Game.cssW, H = Game.cssH; m = m || 0;
    return { x0: c.x - this.vcx / c.z - m, x1: c.x + (W - this.vcx) / c.z + m, y0: c.y - this.vcy / c.z - m, y1: c.y + (H - this.vcy) / c.z + m };
  }
  ensureBase(full, budget) {
    const sB = this.zOver * Game.dpr, key = sB.toFixed(4), RB = BRCM_RB;
    let b = BRCM_CACHE.base;
    if (!b || b.key !== key) {
      if (b && b.c) { b.c.width = 1; b.c.height = 1; }
      const w = Math.ceil((RB.x1 - RB.x0) * sB), h = Math.ceil((RB.y1 - RB.y0) * sB);
      b = BRCM_CACHE.base = { key, s: sB, c: makeCanvas(w, h), w, h, row: 0, done: false };
    }
    if (b.done) return b;
    const ctx = b.c.getContext('2d'), t0 = performance.now();
    while (b.row < b.h && (full || performance.now() - t0 < (budget || 3))) {
      const y0 = b.row, y1 = Math.min(b.h, b.row + 64);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.rect(0, y0, b.w, y1 - y0); ctx.clip();
      brcmRenderStatic(ctx, b.s, -RB.x0 * b.s, -RB.y0 * b.s, { x0: RB.x0, y0: RB.y0 + y0 / b.s - 1, x1: RB.x1, y1: RB.y0 + y1 / b.s + 1 }, 'over');
      ctx.restore();
      b.row = y1;
    }
    b.done = b.row >= b.h;
    return b;
  }
  drawBase(ctx, k, ox, oy) {
    const b = BRCM_CACHE.base, RB = BRCM_RB, V = this.viewRect(2);
    if (!b) return;
    const x0 = Math.max(V.x0, RB.x0), y0 = Math.max(V.y0, RB.y0), x1 = Math.min(V.x1, RB.x1), y1 = Math.min(V.y1, RB.y1);
    if (x1 <= x0 || y1 <= y0) return;
    ctx.drawImage(b.c, (x0 - RB.x0) * b.s, (y0 - RB.y0) * b.s, (x1 - x0) * b.s, (y1 - y0) * b.s, x0 * k + ox, y0 * k + oy, (x1 - x0) * k, (y1 - y0) * k);
  }
  makeTile(i, j, sT, tw) {
    const C = BRCM_CACHE, t0 = performance.now();
    const c = C.pool.pop() || makeCanvas(BRCM.TILE, BRCM.TILE), ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    brcmRenderStatic(ctx, sT, -i * BRCM.TILE, -j * BRCM.TILE, { x0: i * tw - 1, y0: j * tw - 1, x1: (i + 1) * tw + 1, y1: (j + 1) * tw + 1 }, 'close');
    C.tiles.set(i + ',' + j, c);
    this.perf.tiles++; this.perf.tileMs += performance.now() - t0;
  }
  drawTiles(ctx, k, ox, oy, budget) {
    const C = BRCM_CACHE, T = BRCM.TILE, sT = this.zClose * Game.dpr, key = sT.toFixed(4), RB = BRCM_RB;
    if (C.key !== key) { for (const c of C.tiles.values()) C.pool.push(c); C.tiles.clear(); C.key = key; }
    const tw = T / sT, V = this.viewRect(0);
    const i0 = Math.floor(Math.max(V.x0, RB.x0) / tw), i1 = Math.floor(Math.min(V.x1, RB.x1 - 0.01) / tw);
    const j0 = Math.floor(Math.max(V.y0, RB.y0) / tw), j1 = Math.floor(Math.min(V.y1, RB.y1 - 0.01) / tw);
    const cx = (V.x0 + V.x1) / 2, cy = (V.y0 + V.y1) / 2, missing = [];
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (!C.tiles.has(i + ',' + j)) missing.push({ i, j, d: Math.hypot((i + 0.5) * tw - cx, (j + 0.5) * tw - cy) });
    const t0 = performance.now();
    if (missing.length && !this.zoomAnim) {
      missing.sort((a, b) => a.d - b.d);
      while (missing.length && performance.now() - t0 < budget) { const m = missing.shift(); this.makeTile(m.i, m.j, sT, tw); }
    }
    // spare time: prefetch a ring of tiles around the view so walking and panning find them ready
    if (!missing.length && !this.zoomAnim && performance.now() - t0 < 2) {
      const P = [], pi0 = Math.max(i0 - 2, Math.floor(RB.x0 / tw)), pi1 = Math.min(i1 + 2, Math.floor((RB.x1 - 0.01) / tw));
      const pj0 = Math.max(j0 - 2, Math.floor(RB.y0 / tw)), pj1 = Math.min(j1 + 2, Math.floor((RB.y1 - 0.01) / tw));
      for (let j = pj0; j <= pj1; j++) for (let i = pi0; i <= pi1; i++) if (!C.tiles.has(i + ',' + j)) P.push({ i, j, d: Math.hypot((i + 0.5) * tw - cx, (j + 0.5) * tw - cy) });
      P.sort((a, b) => a.d - b.d);
      const t1 = performance.now();
      while (P.length && performance.now() - t1 < 3 && C.tiles.size < BRCM.TILE_MAX - 4) { const m = P.shift(); this.makeTile(m.i, m.j, sT, tw); }
    }
    if (missing.length && this.intro === 0) { this.ensureBase(false); this.drawBase(ctx, k, ox, oy); }
    const sc = k / sT;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const id = i + ',' + j, c = C.tiles.get(id);
      if (!c) continue;
      C.tiles.delete(id); C.tiles.set(id, c);           // most recently used last
      const x0 = Math.round(i * T * sc + ox), y0 = Math.round(j * T * sc + oy), x1 = Math.round((i + 1) * T * sc + ox), y1 = Math.round((j + 1) * T * sc + oy);
      ctx.drawImage(c, x0, y0, x1 - x0, y1 - y0);
    }
    while (C.tiles.size > BRCM.TILE_MAX) { const first = C.tiles.keys().next().value; C.pool.push(C.tiles.get(first)); C.tiles.delete(first); }
    return missing.length;
  }

  /* ----- fog of war: a small world-space canvas, softened and tinted, redrawn only when it changes ----- */
  initFog() {
    const RB = BRCM_RB, fs = 0.25, w = Math.ceil((RB.x1 - RB.x0) * fs), h = Math.ceil((RB.y1 - RB.y0) * fs);
    this.fog = { fs, w, h, m: makeCanvas(w, h), b: makeCanvas(w, h), c: makeCanvas(w, h), dens: null };
    if (!BRCM_SPR.fogtex) {
      const t = makeCanvas(w, h), x = t.getContext('2d'), rng = mulberry32(31);
      x.fillStyle = '#3b2c49'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        const px = rng() * w, py = rng() * h, r = rng.range(8, 34), lt = rng() < 0.62, g = x.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, lt ? 'rgba(196,166,158,0.3)' : 'rgba(18,10,30,0.36)'); g.addColorStop(1, lt ? 'rgba(196,166,158,0)' : 'rgba(18,10,30,0)');
        x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
      }
      BRCM_SPR.fogtex = t;
    }
    this.fogDirty = true;
  }
  renderFog() {
    const F = this.fog, RB = BRCM_RB, G = this.G;
    const m = F.m.getContext('2d');
    m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-over'; m.globalAlpha = 1; m.clearRect(0, 0, F.w, F.h);
    m.setTransform(F.fs, 0, 0, F.fs, -RB.x0 * F.fs, -RB.y0 * F.fs);
    let open = 0; for (const w of WORLD3_REGIONS) open += clamp(this.regionK[w] || 0, 0, 1);
    m.fillStyle = '#000'; m.globalAlpha = lerp(0.7, 0.2, open / WORLD3_REGIONS.length); m.fillRect(RB.x0, RB.y0, RB.x1 - RB.x0, RB.y1 - RB.y0);
    for (const w of WORLD3_REGIONS) { const k = this.regionK[w] || 0; if (k < 1) { m.globalAlpha = (1 - k) * 0.9; brcmRegionPath(m, w); m.fill(); } }
    m.globalCompositeOperation = 'destination-out';
    const B = BRCM.B;
    m.globalAlpha = 1; m.beginPath(); m.rect(RB.x0, RB.y0, RB.x1 - RB.x0, RB.y1 - RB.y0); m.rect(B.x0 + 4, B.y0 + 4, B.x1 - B.x0 - 8, B.y1 - B.y0 - 8); m.fill('evenodd');
    for (const w of WORLD3_REGIONS) { const k = this.regionK[w] || 0; if (k > 0) { m.globalAlpha = k; brcmRegionPath(m, w); m.fill(); } }
    for (const N of G.list) {
      if (!WorldGame.isUnlocked(N.id)) continue;
      const a = this.pendingNodes.has(N.id) ? 0 : this.popT[N.id] !== undefined ? clamp(this.popT[N.id] / 0.7, 0, 1) : 1;
      if (a <= 0) continue;
      m.globalAlpha = a; m.beginPath(); m.arc(N.x, N.y, 34, 0, TAU); m.fill();
    }
    m.globalAlpha = 1; m.globalCompositeOperation = 'source-over';
    const b = F.b.getContext('2d');
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1; b.clearRect(0, 0, F.w, F.h);
    b.globalCompositeOperation = 'lighter';
    const offs = [[0, 0], [-2, 0], [2, 0], [0, -2], [0, 2], [-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]];
    b.globalAlpha = 1 / offs.length; for (const [dx, dy] of offs) b.drawImage(F.m, dx, dy);
    b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
    const c = F.c.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, F.w, F.h);
    c.drawImage(BRCM_SPR.fogtex, 0, 0);
    c.globalCompositeOperation = 'destination-in'; c.drawImage(F.b, 0, 0); c.globalCompositeOperation = 'source-over';
    this.baseFog = lerp(0.7, 0.2, open / WORLD3_REGIONS.length);
    this.fogDirty = false;
  }
  fogAt(x, y) {                    // rough fog density at a world point (for the drifting haze)
    for (const w of WORLD3_REGIONS) if (brcmInRegion(w, x, y)) return 1 - (this.regionK[w] || 0);
    return this.baseFog === undefined ? 0.5 : this.baseFog;
  }

  /* ----- frame ----- */
  draw(ctx) {
    const t0 = performance.now(), dpr = Game.dpr, z = this.cam.z, k = z * dpr;
    const ox = Math.round((this.vcx - this.cam.x * z) * dpr), oy = Math.round((this.vcy - this.cam.y * z) * dpr);
    this.nsCache = new Map();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = BRCM.NIGHT; ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height);
    let missing = 0;
    if (z >= this.zClose * 0.72) missing = this.drawTiles(ctx, k, ox, oy, this.intro < 1 ? 7 : 12);
    else {
      const b = this.ensureBase(this.zoomMode === 'over' && !(this.intro > 0), this.intro > 0 ? 14 : 3);
      if (!b.done) missing = 1;
      this.drawBase(ctx, k, ox, oy);
    }
    if (this.intro > 0 && !missing) this.intro = Math.max(0, this.intro - (this.lastFrameT ? Math.min(0.05, (t0 - this.lastFrameT) / 1000) : 0.016) / 0.35);
    if (this.lastFrameT && !this.intro) {
      const fdt = t0 - this.lastFrameT;
      if (fdt > 24 && fdt < 200) this.slowT += fdt / 1000; else this.slowT = Math.max(0, this.slowT - fdt / 2000);
      if (this.slowT > 1.5) this.fx = 0.5;
    }
    this.lastFrameT = t0;
    this.drawLiving(ctx, k, ox, oy);
    if (this.fogDirty) this.renderFog();
    ctx.setTransform(k, 0, 0, k, ox, oy);
    const RB = BRCM_RB;
    ctx.globalAlpha = 0.8; ctx.drawImage(this.fog.c, RB.x0, RB.y0, RB.x1 - RB.x0, RB.y1 - RB.y0); ctx.globalAlpha = 1;
    this.drawHaze(ctx, k, ox, oy);
    if ((this.regionK[47] || 0) < 1) {            // the Man glows through the dust like a beacon
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - (this.regionK[47] || 0)) * (0.4 + 0.15 * Math.sin(this.t * 1.9));
      ctx.drawImage(brcmGlow('#55c8ff', 1), -40, -62, 80, 80); ctx.drawImage(brcmGlow('#bfefff', 0), -7, -42, 14, 14);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    this.drawRegionLabels(ctx);
    this.drawPaths(ctx, k, ox, oy);
    this.drawNodes(ctx);
    this.drawBradyMap(ctx);
    this.drawParts(ctx, k, ox, oy);
    if (this.intro > 0) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = this.intro; ctx.fillStyle = BRCM.NIGHT; ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height); ctx.globalAlpha = 1; }
    this.drawHUD(ctx);
    this.nsCache = null;
    // build the overview canvas a strip at a time while nothing else is going on
    if (this.t > 1.2 && !this.intro && !this.walk && !this.rv && !this.zoomAnim && !this.ptrs.size && !(BRCM_CACHE.base && BRCM_CACHE.base.done)) this.ensureBase(false);
    const ms = performance.now() - t0, P = this.perf;
    P.frames++; P.drawMs += ms; P.maxMs = Math.max(P.maxMs, ms); P.last = ms; if (P.first === undefined) P.first = ms;
  }
  drawLiving(ctx, k, ox, oy) {
    const G = this.G, A = this.A, t = this.t, z = this.cam.z, V = this.viewRect(12);
    const inV = (x, y, r) => x + r > V.x0 && x - r < V.x1 && y + r > V.y0 && y - r < V.y1;
    ctx.setTransform(k, 0, 0, k, ox, oy);
    ctx.globalCompositeOperation = 'lighter';
    const thin = z < this.zClose * 0.6;
    let n = 0;
    for (const l of G.lights) {
      if (!l.tw) continue;
      n++;
      if ((thin && n % 3) || (this.fx < 1 && n & 1)) continue;
      if (!inV(l.x, l.y, 4)) continue;
      const a = Math.sin(t * l.sp + l.ph);
      if (a < 0.3) continue;
      const big = l.s > 1.6, r = big ? l.s * 1.2 : l.s * (l.lamp ? 2.4 : 2.9);
      ctx.globalAlpha = big ? a * 0.5 : a; ctx.drawImage(brcmGlow(l.lamp ? '#ffcf8a' : BRCM.LIGHTS[l.c], big ? 1 : 2), l.x - r, l.y - r, r * 2, r * 2);
    }
    for (const f of G.fires) {
      if (!inV(f.x, f.y, 8)) continue;
      const fl = 0.75 + 0.25 * Math.sin(t * 11 + f.ph) * Math.sin(t * 6.3 + f.ph * 2), r = (f.big ? 7.5 : 5) * fl;
      ctx.globalAlpha = 0.9 * fl; ctx.drawImage(brcmGlow('#ff7a2a', 1), f.x - r, f.y - r, r * 2, r * 2);
      ctx.globalAlpha = 1; ctx.drawImage(brcmGlow('#ffd27a'), f.x - 1.5 * fl, f.y - 1.7 * fl, 3 * fl, 3 * fl);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // Gate Road traffic
    if (inV(0, 370, 130)) {
      const fadeOf = c => clamp((c.y - 246) / 12, 0, 1) * clamp((490 - c.y) / 8, 0, 1);
      for (const c of A.cars) {
        const fade = fadeOf(c);
        if (fade <= 0 || !inV(c.lane, c.y, 6)) continue;
        if (c.v > 1.4) { ctx.globalAlpha = fade * Math.min(0.55, c.v / 9); ctx.drawImage(brcmGlow('#dcc8b2', 1), c.lane - 3.2, c.y + c.len / 2 - 1.5, 6.4, 7); }
        ctx.globalAlpha = fade;
        ctx.fillStyle = c.c; rr(ctx, c.lane - 1.05, c.y - c.len / 2, 2.1, c.len, 0.6); ctx.fill();
        ctx.fillStyle = '#273042'; ctx.fillRect(c.lane - 0.8, c.y - c.len / 2 + 0.55, 1.6, 0.75);
        if (c.rv) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(c.lane - 0.5, c.y, 1, 1.3); }
      }
      ctx.globalCompositeOperation = 'lighter';
      const hl = brcmGlow('#fff0c8'), tl = brcmGlow('#ff3040');
      for (const c of A.cars) {
        const fade = fadeOf(c);
        if (fade <= 0 || !inV(c.lane, c.y, 6)) continue;
        ctx.globalAlpha = fade;
        ctx.drawImage(hl, c.lane - 1.9, c.y - c.len / 2 - 1.5, 2.2, 2.2); ctx.drawImage(hl, c.lane - 0.3, c.y - c.len / 2 - 1.5, 2.2, 2.2);
        ctx.drawImage(tl, c.lane - 1.6, c.y + c.len / 2 - 0.8, 1.6, 1.6); ctx.drawImage(tl, c.lane, c.y + c.len / 2 - 0.8, 1.6, 1.6);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    // LED bikes
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const bw = Math.max(0.45, 1.1 / z);
    for (const b of A.bikes) {
      if (!inV(b.x, b.y, 10)) continue;
      if (b.trail.length > 2) { ctx.strokeStyle = rgba(b.c, 0.55); ctx.lineWidth = bw; ctx.beginPath(); ctx.moveTo(b.x, b.y); for (let i = 0; i < b.trail.length; i += 2) ctx.lineTo(b.trail[i], b.trail[i + 1]); ctx.stroke(); }
      ctx.drawImage(brcmGlow(b.c), b.x - 1.8, b.y - 1.8, 3.6, 3.6);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'butt';
    for (const a of A.artcars) if (inV(a.x, a.y, 40)) brcmDrawArtCar(ctx, a, t, z);
    for (const d of A.devils) {
      if (!inV(d.x, d.y - 8, 20)) continue;
      ctx.globalAlpha = 0.5; ctx.drawImage(brcmGlow('#d8c2b0', 1), d.x - 9 * d.s, d.y - 4 * d.s, 18 * d.s, 8 * d.s); ctx.globalAlpha = 1;
      ctx.lineWidth = Math.max(0.35, 0.9 / z);
      for (let i = 0; i < 9; i++) {
        const rx = (1.2 + i * 0.75) * d.s, cy = d.y - i * 2.1 * d.s, cx = d.x + Math.sin(t * 2.2 + i * 0.55 + d.ph) * (0.6 + i * 0.25) * d.s;
        ctx.strokeStyle = `rgba(232,212,196,${0.42 - i * 0.035})`;
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, rx * 0.32, 0, t * 6 + i, t * 6 + i + 4.4); ctx.stroke();
      }
    }
    for (const L of G.lasers) if (inV(L.x, L.y, 170)) brcmDrawLaser(ctx, L, t, z);
    if (!this.standing) this.standing = G.art.map(a => ({ y: a.y, a })).concat([{ y: -58, temple: true }, { y: 0, man: true }]).sort((p, q) => p.y - q.y);
    for (const s of this.standing) {
      if (s.man) { if (inV(0, -22, 60)) brcmDrawMan(ctx, t, z); }
      else if (s.temple) { if (inV(0, -72, 50)) brcmDrawTemple(ctx, t, z); }
      else if (inV(s.a.x, s.a.y - 8, 30)) brcmDrawArt(ctx, s.a, t, z);
    }
  }
  drawHaze(ctx, k, ox, oy) {
    if (this.fx < 1) return;
    const V = this.viewRect(0), cl = brcmCloud(), B = BRCM.B;
    ctx.setTransform(k, 0, 0, k, ox, oy);
    ctx.save(); ctx.beginPath(); ctx.rect(B.x0, B.y0, B.x1 - B.x0, B.y1 - B.y0); ctx.clip();
    for (const c of this.A.clouds) {
      if (c.x + c.s < V.x0 || c.x - c.s > V.x1 || c.y + c.s < V.y0 || c.y - c.s > V.y1) continue;
      ctx.globalAlpha = c.a * (0.1 + 0.32 * this.fogAt(c.x, c.y));
      if (ctx.globalAlpha < 0.05) continue;
      ctx.drawImage(cl, c.x - c.s, c.y - c.s * 0.75, c.s * 2, c.s * 1.5);
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  drawRegionLabels(ctx) {
    const dpr = Game.dpr, z = this.cam.z, W = Game.cssW, H = Game.cssH, size = clamp(z * 6.4, 9, 16);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const w of WORLD3_REGIONS) {
      const k = this.regionK[w] || 0;
      if (k <= 0.02) continue;
      for (const L of BRCM_RLABEL[w]) {
        if (L.minZ && z < L.minZ) continue;
        const wp = L.c !== undefined ? brcmXY(L.c, L.r) : L, p = this.toScreen(wp.x, wp.y);
        if (p.x < -150 || p.x > W + 150 || p.y < -60 || p.y > H + 60) continue;
        ctx.save(); ctx.translate(p.x, p.y); if (L.rot) ctx.rotate(L.rot);
        ctx.font = `${Math.round(size * (L.small ? 0.78 : 1))}px ${FONT_DISPLAY}`;
        ctx.globalAlpha = k * 0.9; ctx.lineJoin = 'round';
        ctx.lineWidth = 3.2; ctx.strokeStyle = 'rgba(22,10,32,0.78)'; ctx.strokeText(L.text, 0, 0);
        ctx.fillStyle = mix(BRCM.ACCENT[w], '#ffffff', 0.4); ctx.fillText(L.text, 0, 0);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }
  polyPath(ctx, P, s0, s1) {
    const a = brcmAlong(P, s0), b = brcmAlong(P, s1);
    ctx.beginPath(); ctx.moveTo(a.x, a.y);
    for (let i = 0; i < P.pts.length; i++) if (P.cum[i] > s0 && P.cum[i] < s1) ctx.lineTo(P.pts[i].x, P.pts[i].y);
    ctx.lineTo(b.x, b.y);
  }
  drawPaths(ctx, k, ox, oy) {
    const G = this.G, t = this.t, z = this.cam.z, V = this.viewRect(10), px = 1 / z;
    ctx.setTransform(k, 0, 0, k, ox, oy);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const P of G.paths) {
      if (!P.bb) { P.bb = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }; for (const q of P.pts) { P.bb.x0 = Math.min(P.bb.x0, q.x); P.bb.y0 = Math.min(P.bb.y0, q.y); P.bb.x1 = Math.max(P.bb.x1, q.x); P.bb.y1 = Math.max(P.bb.y1, q.y); } }
      if (P.bb.x1 < V.x0 || P.bb.x0 > V.x1 || P.bb.y1 < V.y0 || P.bb.y0 > V.y1) continue;
      const st = this.pathState(P);
      if (st === 'hidden') continue;
      if (st === 'hint' || (st === 'reveal' && !P.secret)) {
        this.polyPath(ctx, P, 0, P.len); ctx.setLineDash([0.01, 7 * px]);
        ctx.strokeStyle = 'rgba(26,14,38,0.35)'; ctx.lineWidth = 4 * px; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,240,250,0.5)'; ctx.lineWidth = 2.2 * px; ctx.stroke(); ctx.setLineDash([]);
      }
      if (st === 'hint') continue;
      if (st === 'reveal') {
        const rv = this.rv, s = rv.step, p = clamp(rv.t / clamp(P.len / 110, 0.7, 1.8), 0, 1);
        if (p <= 0) continue;
        const a = s.dir === 1 ? 0 : P.len * (1 - p), b = s.dir === 1 ? P.len * p : P.len;
        this.polyPath(ctx, P, a, b);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = P.secret ? 'rgba(90,255,180,0.32)' : 'rgba(255,110,220,0.34)'; ctx.lineWidth = 11 * px; ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        if (P.secret) {
          for (let x = a, i = 0; x < b; x += 7, i++) { this.polyPath(ctx, P, x, Math.min(b, x + 7.5)); ctx.strokeStyle = `hsl(${(t * 320 + i * 28) % 360},100%,66%)`; ctx.lineWidth = 4 * px; ctx.stroke(); }
        } else { ctx.strokeStyle = '#ffd6f6'; ctx.lineWidth = 3.6 * px; ctx.stroke(); }
        continue;
      }
      const done = WorldGame.isDone(P.from) && WorldGame.isDone(P.to);
      const col = P.secret ? `hsl(${150 + 28 * Math.sin(t * 2.2 + P.i)},100%,64%)` : done ? '#ffd84a' : '#ff7ade';
      this.polyPath(ctx, P, 0, P.len);
      if (z > this.zClose * 0.6) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = P.secret ? 'rgba(80,255,170,0.2)' : done ? 'rgba(255,200,80,0.17)' : 'rgba(255,90,210,0.2)'; ctx.lineWidth = 10 * px; ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.strokeStyle = 'rgba(24,12,34,0.5)'; ctx.lineWidth = 4.4 * px; ctx.stroke();
      ctx.setLineDash([0.01, 8 * px]); ctx.lineDashOffset = -t * 9 * px;
      ctx.strokeStyle = col; ctx.lineWidth = 3.4 * px; ctx.stroke();
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
    }
    ctx.lineCap = 'butt';
  }
  drawNodes(ctx) {
    const dpr = Game.dpr, t = this.t, sc = this.nodeScale(), W = Game.cssW, H = Game.cssH;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const N of this.G.list) {
      const st = this.nodeState(N.id);
      if (st === 'hidden') continue;
      const p = this.toScreen(N.x, N.y);
      if (p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) continue;
      let s = sc;
      const pt = this.popT[N.id];
      if (pt !== undefined) { const u = clamp(pt / 0.45, 0, 1), c1 = 2.2; s *= 1 + (c1 + 1) * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); }
      if (s <= 0.02) continue;
      let x = p.x; const y = p.y;
      const bt = this.bumpT[N.id]; if (bt) x += Math.sin(bt * 70) * 4 * (bt / 0.35);
      if (st === 'open') {
        const pu = 0.5 + 0.5 * Math.sin(t * 3 + N.i), g = 30 * s;
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3 + 0.3 * pu;
        ctx.drawImage(brcmGlow('#ff4fd8', 1), x - g, y - g, g * 2, g * 2);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      }
      if (N.id === this.sel) {
        ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.setLineDash([4, 3.2]); ctx.lineDashOffset = -t * 14;
        ctx.beginPath(); ctx.arc(x, y, 17 * s, 0, TAU); ctx.stroke(); ctx.restore();
      }
      const S = 44 * s;
      ctx.drawImage(brcmBadge(st, N, dpr), x - S / 2, y - S / 2, S, S);
      if (sc > 0.72 && st !== 'locked') {
        const gc = WorldGame.goldCount(N.id), g = Save.data.gold[N.id] || [];
        for (let i = 0; i < 3; i++) {
          const has = gc && g[i], qx = x + (i - 1) * 8.5 * s, qy = y + 19 * s;
          ctx.fillStyle = has ? '#ffffff' : 'rgba(255,255,255,0.35)'; rr(ctx, qx - 3.2 * s, qy - 3.6 * s, 6.4 * s, 7.4 * s, 1.2 * s); ctx.fill();
          ctx.fillStyle = has ? '#ff5fd2' : 'rgba(20,10,30,0.7)'; ctx.fillRect(qx - 2.3 * s, qy - 2.7 * s, 4.6 * s, 4.2 * s);
        }
      }
      if (WorldGame.secretFound(N.id)) {
        const r = (4.5 + Math.sin(t * 5 + N.i) * 1.2) * Math.max(0.7, s), sx = x + 11 * s, sy = y - 11 * s;
        ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(brcmGlow('#3dff9a', 1), sx - r * 2, sy - r * 2, r * 4, r * 4); ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#7dffbf'; ctx.beginPath();
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 1.5, rr2 = i % 2 ? r * 0.32 : r; ctx.lineTo(sx + Math.cos(a) * rr2, sy + Math.sin(a) * rr2); }
        ctx.closePath(); ctx.fill();
      }
    }
  }
  drawBradyMap(ctx) {
    const dpr = Game.dpr, b = this.bradyPos(), p = this.toScreen(b.x, b.y), s = 1.12 * this.nodeScale();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.3;
    ctx.drawImage(brcmGlow('#ffcf8a', 1), p.x - 30 * s, p.y - 18 * s, 60 * s, 34 * s);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createRadialGradient(p.x, p.y + 1, 0, p.x, p.y + 1, 11 * s);
    g.addColorStop(0, 'rgba(10,4,20,0.6)'); g.addColorStop(1, 'rgba(10,4,20,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, 11 * s, 4 * s, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s, s);
    drawBrady(ctx, { x: 0, y: 0, facing: this.facing, small: true, power: 0, anim: this.anim, hair: null, look: Save.data.look, time: this.t });
    ctx.restore();
  }
  drawParts(ctx, k, ox, oy) {
    if (!this.parts.length) return;
    const z = this.cam.z;
    ctx.setTransform(k, 0, 0, k, ox, oy);
    for (const p of this.parts) {
      const a = clamp(p.life / p.max, 0, 1);
      if (p.dust) { const r = p.sz / z * (1.7 - a); ctx.globalAlpha = a * 0.5; ctx.drawImage(brcmGlow(p.c, 1), p.x - r, p.y - r, r * 2, r * 2); }
      else { const r = p.sz / z * (0.4 + a); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.drawImage(brcmGlow(p.c), p.x - r, p.y - r, r * 2, r * 2); ctx.globalCompositeOperation = 'source-over'; }
    }
    ctx.globalAlpha = 1;
  }
  progress() {
    let done = 0, photos = 0;
    for (const N of this.G.list) { if (WorldGame.isDone(N.id)) done++; photos += WorldGame.goldCount(N.id); }
    return { done, photos, total: this.G.list.length };
  }
  drawHUD(ctx) {
    const dpr = Game.dpr, W = Game.cssW, H = Game.cssH, S = this.safe, t = this.t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(this.vig, 0, 0, W, H);
    if (this.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(120,255,200,${this.flash * 0.3})`; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
    const tg = ctx.createLinearGradient(0, 0, 0, this.topH + 26);
    tg.addColorStop(0, 'rgba(7,4,14,0.9)'); tg.addColorStop(0.65, 'rgba(7,4,14,0.5)'); tg.addColorStop(1, 'rgba(7,4,14,0)');
    ctx.fillStyle = tg; ctx.fillRect(0, 0, W, this.topH + 26);
    const avail = W - 2 * (this.btnBack.w + S.l + 14);
    UI.title(ctx, 'BLACK ROCK CITY', W / 2, S.t + 21, clamp(avail / 10.2, 13, 22));
    const pr = this.progress();
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `600 11px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(`${pr.done}/${pr.total} CLEARED   ·   ${pr.photos}/${pr.total * 3} PHOTOS`, W / 2, S.t + 42);
    ctx.restore();
    this.drawPanel(ctx);
    UI.drawButtons(ctx, this.btns);
    // zoom icon: magnifier with + (go close) or - (see the whole city)
    const z = this.btnZoom, cx = z.x + z.w / 2 - 2, cy = z.y + z.h / 2 - 1 + (z._press > 0 ? 2 : 0);
    ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, 7.5, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 5.4, cy + 5.4); ctx.lineTo(cx + 10, cy + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 3.6, cy); ctx.lineTo(cx + 3.6, cy); if (this.zoomMode === 'over') { ctx.moveTo(cx, cy - 3.6); ctx.lineTo(cx, cy + 3.6); } ctx.stroke();
    ctx.restore();
    // toast and new-area banner
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (this.toast) {
      const a = clamp(this.toast.t * 3, 0, 1); ctx.globalAlpha = a; ctx.font = `13px ${FONT_DISPLAY}`;
      const w = ctx.measureText(this.toast.text).width + 32, y = this.panel.y - 26;
      ctx.fillStyle = 'rgba(14,8,24,0.88)'; rr(ctx, W / 2 - w / 2, y - 15, w, 30, 15); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillText(this.toast.text, W / 2, y + 1);
    }
    if (this.banner) {
      const bt = this.banner.t, a = clamp(bt * 2.5, 0, 1) * clamp((3 - bt) * 2, 0, 1), col = BRCM.ACCENT[this.banner.w], y = this.topH + 34;
      ctx.globalAlpha = a;
      ctx.font = `600 11px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText('NEW AREA DISCOVERED', W / 2, y - 14);
      const sz = clamp(W / 16, 18, 30); ctx.font = `${sz}px ${FONT_DISPLAY}`;
      ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(14,6,24,0.85)'; ctx.strokeText(WORLDS[this.banner.w].name.toUpperCase(), W / 2, y + 10);
      ctx.fillStyle = col; ctx.fillText(WORLDS[this.banner.w].name.toUpperCase(), W / 2, y + 10);
    }
    if (this.rv) {
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 4); ctx.font = `600 11px ${FONT_UI}`; ctx.fillStyle = '#ffffff';
      ctx.fillText('TAP TO SKIP', W / 2, this.panel.y - 14);
    }
    ctx.restore();
  }
  drawPanel(ctx) {
    const P = this.panel, id = this.sel, N = this.G.nodes[id], col = BRCM.ACCENT[N.w], portrait = this.portrait;
    let st = this.nodeState(id); if (st === 'hidden') st = 'locked';
    const dpr = Game.dpr, pk = P.w + 'x' + P.h + '@' + dpr;
    if (!this.panelSpr || this.panelSpr.key !== pk) {
      const m = 36, c = makeCanvas((P.w + m * 2) * dpr, (P.h + m * 2) * dpr), x = c.getContext('2d');
      x.scale(dpr, dpr); UI.panel(x, m, m, P.w, P.h);
      this.panelSpr = { key: pk, c, m };
    }
    const sp = this.panelSpr;
    ctx.drawImage(sp.c, P.x - sp.m, P.y - sp.m, P.w + sp.m * 2, P.h + sp.m * 2);
    ctx.save();
    ctx.fillStyle = col; rr(ctx, P.x + 10, P.y + 12, 4, portrait ? 84 : P.h - 24, 2); ctx.fill();
    const tx = P.x + 24, tw = (portrait ? P.x + P.w - 14 : this.btnPlay.x - 14) - tx;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = `600 11px ${FONT_UI}`; ctx.fillStyle = col;
    const addr = N.n.label.toUpperCase() + (N.boss ? '   ·   CAMP BOSS' : '');
    ctx.fillText(addr, tx, P.y + 18);
    const name = WorldGame.name(id).toUpperCase();
    let fs = portrait ? 19 : 18;
    ctx.font = `${fs}px ${FONT_DISPLAY}`;
    const idw = ctx.measureText(id).width;
    while (fs > 11 && idw * 0.7 + 14 + ctx.measureText(name).width > tw) { fs--; ctx.font = `${fs}px ${FONT_DISPLAY}`; }
    ctx.font = `${Math.round(fs * 0.7)}px ${FONT_DISPLAY}`; ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(id, tx, P.y + 41); const off = ctx.measureText(id).width + 10;
    ctx.font = `${fs}px ${FONT_DISPLAY}`; ctx.fillStyle = st === 'locked' ? 'rgba(255,255,255,0.6)' : '#ffffff';
    ctx.fillText(name, tx + off, P.y + 41);
    // region, level type, status chips
    const w = N.w, type = BRCM.TYPE[(WORLDS[w].plan || [])[N.i - 1]] || '';
    ctx.font = `600 11px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.72)';
    const reg = WORLDS[w].name.toUpperCase() + (type ? '  ·  ' + type.toUpperCase() : '');
    ctx.fillText(reg, tx, P.y + (portrait ? 64 : 62));
    let cx = portrait ? tx : tx + ctx.measureText(reg).width + 14;
    const cy = P.y + (portrait ? 86 : 62);
    const chip = (text, fg, bg) => {
      ctx.font = `600 10px ${FONT_UI}`; const w2 = ctx.measureText(text).width + 14;
      if (cx + w2 > tx + tw) return false;
      ctx.fillStyle = bg; rr(ctx, cx, cy - 8, w2, 16, 8); ctx.fill();
      ctx.fillStyle = fg; ctx.fillText(text, cx + 7, cy + 0.5); cx += w2 + 6; return true;
    };
    if (st === 'locked') chip('LOCKED', 'rgba(255,255,255,0.75)', 'rgba(255,255,255,0.12)');
    else {
      if (st === 'done') chip('CLEARED', '#3a2200', '#ffd84a'); else chip('NOT CLEARED YET', '#ffffff', 'rgba(255,79,216,0.45)');
      if (WorldGame.secretFound(id)) chip('SECRET EXIT FOUND', '#003a1e', '#5dffb0');
      const gc = WorldGame.goldCount(id);
      if (cx + 70 <= tx + tw) {
        for (let i = 0; i < 3; i++) {
          const qx = cx + 4 + i * 11;
          ctx.fillStyle = i < gc ? '#ffffff' : 'rgba(255,255,255,0.3)'; rr(ctx, qx, cy - 6.5, 8.5, 11, 1.5); ctx.fill();
          ctx.fillStyle = i < gc ? '#ff5fd2' : 'rgba(20,10,30,0.75)'; ctx.fillRect(qx + 1.3, cy - 5.2, 5.9, 6);
        }
        ctx.font = `600 11px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillText(`PHOTOS ${gc}/3`, cx + 40, cy + 0.5);
        cx += 100;
      }
      if (N.n.secret && st === 'done' && !WorldGame.secretFound(id)) { ctx.font = `italic 10px ${FONT_UI}`; ctx.fillStyle = 'rgba(160,255,210,0.7)'; if (cx + 120 < tx + tw) ctx.fillText('Rumor: there is another way out', cx, cy + 0.5); }
    }
    ctx.restore();
    const b = this.btnPlay;
    b.disabled = st === 'locked';
    b.label = st === 'locked' ? 'LOCKED' : this.walk && this.walk.target === id && this.walk.playOnArrive ? 'GO!' : 'PLAY';
  }
}

/* camp-boss nodes are little camp tents with a flag; the rest are round badges */
function brcmBadge(st, N, dpr) {
  const key = 'badge|' + st + '|' + N.id + '|' + dpr;
  if (BRCM_SPR[key]) return BRCM_SPR[key];
  const S = 44, c = makeCanvas(S * dpr, S * dpr), x = c.getContext('2d');
  x.scale(dpr, dpr); x.translate(S / 2, S / 2);
  const pal = st === 'done' ? ['#fff6c4', '#f8c640', '#b8740f', '#4a2a00', '#fff3b8'] : st === 'open' ? ['#ffc6f2', '#ff5fd2', '#9026c8', '#ffffff', '#ffffff'] : ['#9a94a4', '#5c566c', '#2e2a3a', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.45)'];
  const R = 12;
  if (N.boss) {
    x.fillStyle = 'rgba(0,0,0,0.45)'; x.beginPath(); x.arc(0, 2, R + 2.5, 0, TAU); x.fill();
    x.fillStyle = '#1c1428'; x.beginPath(); x.arc(0, 0, R + 1.5, 0, TAU); x.fill();
    x.strokeStyle = pal[1]; x.lineWidth = 2; x.stroke();
    const g = x.createLinearGradient(0, -7, 0, 8); g.addColorStop(0, pal[0]); g.addColorStop(0.5, pal[1]); g.addColorStop(1, pal[2]);
    x.fillStyle = g; x.beginPath(); x.moveTo(-10, 7.5); x.lineTo(0, -6); x.lineTo(10, 7.5); x.closePath(); x.fill();
    x.strokeStyle = pal[4]; x.lineWidth = 1.3; x.lineJoin = 'round'; x.stroke();
    x.fillStyle = '#1c1428'; x.beginPath(); x.moveTo(-3, 7.5); x.lineTo(0, 1); x.lineTo(3, 7.5); x.closePath(); x.fill();
    x.strokeStyle = '#f4e9d8'; x.lineWidth = 1.3; x.beginPath(); x.moveTo(0, -5.5); x.lineTo(0, -16); x.stroke();
    x.fillStyle = st === 'locked' ? '#8a8496' : st === 'done' ? '#ffd84a' : '#ff3d7a';
    x.beginPath(); x.moveTo(0.6, -16); x.quadraticCurveTo(5, -16.5, 9, -13.6); x.quadraticCurveTo(5, -12, 0.6, -11.6); x.closePath(); x.fill();
    if (st === 'locked') { x.fillStyle = 'rgba(255,255,255,0.8)'; rr(x, -3, 2.2, 6, 4.6, 1); x.fill(); x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 1.2; x.beginPath(); x.arc(0, 2.4, 2, Math.PI, 0); x.stroke(); }
  } else {
    x.fillStyle = 'rgba(0,0,0,0.45)'; x.beginPath(); x.arc(0, 1.8, R + 1.8, 0, TAU); x.fill();
    x.fillStyle = 'rgba(20,10,32,0.8)'; x.beginPath(); x.arc(0, 0, R + 1.6, 0, TAU); x.fill();
    const g = x.createRadialGradient(-4, -5, 1, 0, 0, R);
    g.addColorStop(0, pal[0]); g.addColorStop(0.55, pal[1]); g.addColorStop(1, pal[2]);
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill();
    x.strokeStyle = pal[4]; x.lineWidth = 1.8; x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.3)'; x.beginPath(); x.ellipse(0, -6, 7, 3.2, 0, 0, TAU); x.fill();
    if (st === 'locked') {
      x.fillStyle = 'rgba(255,255,255,0.82)'; rr(x, -4.5, -1, 9, 7, 1.6); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.82)'; x.lineWidth = 1.7; x.beginPath(); x.arc(0, -1.2, 2.9, Math.PI, 0); x.stroke();
    } else {
      x.font = `13px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = st === 'done' ? 'rgba(255,255,255,0.5)' : 'rgba(60,0,60,0.5)'; x.fillText(String(N.i), 0.6, 1.8);
      x.fillStyle = pal[3]; x.fillText(String(N.i), 0, 1);
    }
  }
  return (BRCM_SPR[key] = c);
}

window.BRADY_MAP = { BRCMapScene };
