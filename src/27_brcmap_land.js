/* ============================================================
   SUPER BRADY-O WORLD — overworld layout and land art
   Used by BRCMapScene (27_brcmap.js). World units: the painted map
   sheet spans OW.W x OW.H. Static painters draw into cached tiles;
   live painters draw the moving details every frame.
   Our own design: a stylised playa with ten lands around the Man.
   ============================================================ */
const OW = {
  W: 1200, H: 1080,
  M: { x: 600, y: 590 }, RING: 150,            // the Man's saucer and the Esplanade's neon ring
  NODES: {
    '41-1': [1112, 986], '41-2': [1030, 942], '41-3': [950, 988], '41-4': [868, 934], '41-5': [914, 862], '41-6': [812, 828], '41-7': [858, 1020],
    '42-1': [648, 896], '42-2': [556, 970], '42-3': [432, 1000], '42-4': [312, 956], '42-5': [292, 862], '42-6': [388, 792],
    '43-1': [561, 735], '43-2': [520, 717], '43-3': [487, 688], '43-4': [463, 651], '43-5': [451, 608], '43-6': [452, 564], '43-7': [545, 664],
    '44-1': [360, 612], '44-2': [232, 642], '44-3': [152, 562], '44-4': [282, 524], '44-5': [334, 446], '44-6': [192, 452],
    '45-1': [122, 334], '45-2': [192, 272], '45-3': [272, 322], '45-4': [334, 258], '45-5': [412, 304], '45-6': [474, 240], '45-7': [304, 398],
    '46-1': [728, 266], '46-2': [808, 220], '46-3': [882, 280], '46-4': [962, 226], '46-5': [1040, 282], '46-6': [1110, 230], '46-7': [904, 362],
    '47-1': [1110, 362], '47-2': [1030, 422], '47-3': [1110, 488], '47-4': [1030, 552], '47-5': [1110, 618], '47-6': [1030, 692],
    '48-1': [920, 682], '48-2': [826, 642], '48-3': [734, 620], '48-4': [668, 602], '48-5': [600, 588],
    '49-1': [600, 152], '49-2': [520, 106], '49-3': [600, 62], '49-4': [690, 96], '49-5': [772, 60],
    '50-1': [872, 96], '50-2': [950, 56], '50-3': [1030, 100], '50-4': [1104, 58]
  },
  // extra shaping for some paths: via = waypoints, ring = follow the neon ring, bridge = rainbow arch (quadratic ctrl)
  ROUTES: {
    '41-1>41-2': { via: [[1078, 952]] }, '41-2>41-3': { via: [[990, 950]] }, '41-3>41-4': { via: [[906, 974]] },
    '41-4>41-5': { via: [[872, 892]] }, '41-5>41-6': { via: [[868, 834]] }, '41-6>42-1': { via: [[730, 846]] },
    '41-3>41-7': { via: [[904, 1014]] },
    '43-1>43-2': { ring: true }, '43-2>43-3': { ring: true }, '43-3>43-4': { ring: true }, '43-4>43-5': { ring: true }, '43-5>43-6': { ring: true },
    '44-3>49-1': { bridge: [470, 410] }, '47-4>49-1': { bridge: [708, 404] },
    '45-6>46-1': { via: [[560, 262], [650, 248]] },
    '42-6>43-1': { via: [[470, 772]] }, '47-6>48-1': { via: [[978, 700]] }
  },
  // land shapes: blob = [cx, cy, rx, ry, rotation]; ring = [cx, cy, r0, r1]
  LANDS: {
    41: { blob: [950, 948, 262, 128, -0.12] },
    42: { blob: [446, 898, 222, 150, 0.04] },
    43: { ring: [600, 590, 96, 206] },
    44: { blob: [240, 556, 190, 172, 0.18] },
    45: { blob: [292, 300, 268, 122, -0.04] },
    46: { blob: [914, 286, 262, 124, 0.04] },
    47: { blob: [1072, 526, 132, 218, 0] },
    48: { ring: [600, 590, 0, 96] },
    49: { blob: [642, 102, 262, 84, 0] },
    50: { blob: [988, 80, 170, 72, -0.05] }
  },
  BIGTOP: { x: 446, y: 904 },
  ORDER: [45, 46, 47, 44, 41, 42, 43, 48]        // painting order of the visible-from-the-start lands
};
const OW_TYPE = { level: 'Level', haunt: 'Haunted House', fort: 'Fort', castle: 'Boss Camp', gift: 'Gift Camp', start: 'Level' };

/* ---------- geometry helpers ---------- */
function owBlob(cx, cy, rx, ry, rot, seed, n) {
  const pts = [];
  n = n || 56;
  for (let k = 0; k < n; k++) {
    const a = k / n * TAU, w = 1 + (brcmNoise(Math.cos(a) * 40 + seed * 7, Math.sin(a) * 40 + seed * 3, 22, seed) - 0.5) * 0.26;
    const x = Math.cos(a) * rx * w, y = Math.sin(a) * ry * w;
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return pts;
}
function owLandShape(w) {               // cached outline polygon(s) of a land
  const L = OW.LANDS[w];
  if (L._poly) return L._poly;
  if (L.blob) { const [cx, cy, rx, ry, rot] = L.blob; L._poly = [owBlob(cx, cy, rx, ry, rot, w, 64)]; }
  else {
    const [cx, cy, r0, r1] = L.ring, outer = [], inner = [];
    for (let k = 0; k < 72; k++) {
      const a = k / 72 * TAU, wob = 1 + (brcmNoise(Math.cos(a) * 30, Math.sin(a) * 30, 18, w) - 0.5) * 0.08;
      outer.push([cx + Math.cos(a) * r1 * wob, cy + Math.sin(a) * r1 * wob]);
      if (r0 > 0) inner.push([cx + Math.cos(a) * r0 / wob, cy + Math.sin(a) * r0 / wob]);
    }
    L._poly = r0 > 0 ? [outer, inner.reverse()] : [outer];
  }
  return L._poly;
}
function owLandBox(w) {
  const L = OW.LANDS[w];
  if (L._box) return L._box;
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const poly of owLandShape(w)) for (const [x, y] of poly) { b.x0 = Math.min(b.x0, x); b.y0 = Math.min(b.y0, y); b.x1 = Math.max(b.x1, x); b.y1 = Math.max(b.y1, y); }
  return (L._box = b);
}
function owLandPath(ctx, w, grow) {     // add the land outline to the current path (grow > 0 enlarges it)
  const L = OW.LANDS[w];
  grow = grow || 0;
  if (L.ring) {
    const [cx, cy, r0, r1] = L.ring;
    ctx.moveTo(cx + r1 + grow, cy); ctx.arc(cx, cy, r1 + grow, 0, TAU);
    if (r0 > 0) { ctx.moveTo(cx + Math.max(1, r0 - grow), cy); ctx.arc(cx, cy, Math.max(1, r0 - grow), 0, TAU, true); }
    return;
  }
  const [cx, cy] = L.blob, poly = owLandShape(w)[0];
  poly.forEach(([x, y], i) => {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, k = (d + grow) / d;
    i ? ctx.lineTo(cx + dx * k, cy + dy * k) : ctx.moveTo(cx + dx * k, cy + dy * k);
  });
  ctx.closePath();
}
function owInLand(w, x, y) {
  const L = OW.LANDS[w];
  if (L.ring) { const d = Math.hypot(x - L.ring[0], y - L.ring[1]); return d >= L.ring[2] && d <= L.ring[3]; }
  const poly = owLandShape(w)[0];
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function owCatmull(pts, step) {         // smooth curve through points -> dense [{x,y}]
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = i ? 1 : 0; k <= n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0[0], p1[0], p2[0], p3[0]), y: f(p0[1], p1[1], p2[1], p3[1]) });
    }
  }
  return out;
}
function owRoute(fromId, toId) {        // the walkable polyline of a path
  const A = OW.NODES[fromId], B = OW.NODES[toId], R = OW.ROUTES[fromId + '>' + toId] || {};
  let pts;
  if (R.ring) {
    const M = OW.M, a0 = Math.atan2(A[1] - M.y, A[0] - M.x);
    let a1 = Math.atan2(B[1] - M.y, B[0] - M.x), d = a1 - a0;
    if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
    const n = Math.max(4, Math.ceil(Math.abs(d) * OW.RING / 3));
    pts = [];
    for (let k = 0; k <= n; k++) { const a = a0 + d * k / n; pts.push({ x: M.x + Math.cos(a) * OW.RING, y: M.y + Math.sin(a) * OW.RING }); }
  } else if (R.bridge) {
    const [cx, cy] = R.bridge, n = 90;
    pts = [];
    for (let k = 0; k <= n; k++) { const t = k / n, u = 1 - t; pts.push({ x: u * u * A[0] + 2 * u * t * cx + t * t * B[0], y: u * u * A[1] + 2 * u * t * cy + t * t * B[1] }); }
  } else {
    let via = R.via;
    if (!via) {                       // a gentle hand-drawn bend
      const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dx = B[0] - A[0], dy = B[1] - A[1], h = (brcmHash(A[0] | 0, B[1] | 0, 41) - 0.5) * 0.22;
      via = [[mx - dy * h, my + dx * h]];
    }
    pts = owCatmull([A].concat(via, [B]), 2.5);
  }
  pts = brcmResample(pts, 2.5);
  pts[0] = { x: A[0], y: A[1] }; pts[pts.length - 1] = { x: B[0], y: B[1] };
  return pts;
}
// roads drawn on the map (not walkable paths): the highway and the Gate Road snaking in from it
const OW_HIGHWAY = [[-20, 1046], [200, 1040], [420, 1052], [700, 1046], [960, 1036], [1160, 1044], [1230, 1040]];
const OW_GATEROAD = [[1168, 1044], [1134, 1012], [1112, 986], [1078, 952], [1030, 942], [990, 950], [950, 988], [906, 974], [868, 934], [872, 892], [914, 862], [868, 834], [812, 828], [730, 846], [648, 896]];

/* ---------- shared painting helpers ---------- */
let OW_GRAIN = null;
function owGrain() {                    // paper-grain tile, drawn in device pixels
  if (OW_GRAIN) return OW_GRAIN;
  const c = makeCanvas(128, 128), x = c.getContext('2d'), d = x.createImageData(128, 128), rng = mulberry32(2207);
  for (let i = 0; i < d.data.length; i += 4) { const v = rng(); const g = v < 0.5 ? 0 : 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = g; d.data[i + 3] = Math.floor(Math.abs(v - 0.5) * 2 * 26); }
  x.putImageData(d, 0, 0);
  return (OW_GRAIN = c);
}
function owStrokes(ctx, R, box, rng, n, len, cols, alpha, width, angle, inside) {
  // hand-painted texture: short soft brush strokes in a few tones, flowing along `angle`
  for (let i = 0; i < n; i++) {
    const x = lerp(box.x0, box.x1, rng()), y = lerp(box.y0, box.y1, rng());
    const l = len * (0.5 + rng()), a = (typeof angle === 'function' ? angle(x, y) : angle) + (rng() - 0.5) * 0.5, col = cols[(rng() * cols.length) | 0], wd = width * (0.6 + rng() * 0.8);
    if (x + l < R.x0 || x - l > R.x1 || y + l < R.y0 || y - l > R.y1) continue;
    if (inside && !inside(x, y)) continue;
    ctx.strokeStyle = rgba(col, alpha * (0.5 + rng() * 0.5)); ctx.lineWidth = wd;
    ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2);
    ctx.quadraticCurveTo(x + Math.sin(a) * l * 0.12, y - Math.cos(a) * l * 0.12, x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2); ctx.stroke();
  }
}
function owSoftFill(ctx, w, col, feather, alpha) {   // a land painted with a soft, pooled edge
  ctx.save();
  for (let i = 4; i >= 1; i--) { ctx.globalAlpha = alpha * 0.16; ctx.fillStyle = col; ctx.beginPath(); owLandPath(ctx, w, feather * i / 4); ctx.fill('evenodd'); }
  ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.beginPath(); owLandPath(ctx, w, 0); ctx.fill('evenodd');
  ctx.restore();
}
function owInk(ctx, s, k) { ctx.strokeStyle = 'rgba(38,22,40,0.85)'; ctx.lineWidth = Math.max(0.6, (k || 1.1) / Math.max(0.6, s / 2.8)); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
function owPolyline(ctx, pts) { pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); }

/* ---------- the base sheet: desert, playa basin, mountains, highway ---------- */
function owPaintBase(ctx, R, s, hi) {
  const W = OW.W, H = OW.H, px = 1 / s;
  // desert around the basin, warm and dusky
  const g = ctx.createLinearGradient(0, 0, W * 0.35, H);
  g.addColorStop(0, '#b98e86'); g.addColorStop(0.45, '#d4ab88'); g.addColorStop(1, '#c48f72');
  ctx.fillStyle = g; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
  // the playa basin: a pale, cracked lake bed in the middle of the sheet
  const bx = 630, by = 640, brx = 560, bry = 430;
  if (R.x1 > bx - brx && R.x0 < bx + brx && R.y1 > by - bry && R.y0 < by + bry) {
    ctx.save(); ctx.translate(bx, by); ctx.scale(1, bry / brx);
    const pg = ctx.createRadialGradient(0, 0, 40, 0, 0, brx);
    pg.addColorStop(0, '#efe2cc'); pg.addColorStop(0.72, '#e6d3b8'); pg.addColorStop(0.92, 'rgba(222,196,166,0.6)'); pg.addColorStop(1, 'rgba(222,196,166,0)');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, brx, 0, TAU); ctx.fill();
    ctx.restore();
    if (hi) {
      ctx.save(); ctx.beginPath(); ctx.ellipse(bx, by, brx * 0.9, bry * 0.9, 0, 0, TAU); ctx.clip();
      brcmCracks(ctx, R, s, true);
      ctx.restore();
    }
  }
  const rng = mulberry32(5150);
  owStrokes(ctx, R, { x0: 0, y0: 0, x1: W, y1: H }, rng, 1400, 26, ['#f6e8d4', '#c9a07e', '#e4c39c', '#b78a78'], 0.16, 3.2, 0.08);
  // mountain ranges around the rim, painted in two layers: violet far ridges, ochre near hills
  owMountains(ctx, R, s);
  // Highway 447 along the bottom
  if (R.y1 > 1000) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(40,24,40,0.35)'; ctx.lineWidth = 22; ctx.beginPath(); owPolyline(ctx, OW_HIGHWAY); ctx.stroke();
    ctx.strokeStyle = '#4f4256'; ctx.lineWidth = 18; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,214,120,0.85)'; ctx.lineWidth = Math.max(0.9, px * 1.5); ctx.setLineDash([9, 8]); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(0.5, px); ctx.beginPath(); owPolyline(ctx, OW_HIGHWAY.map(p => [p[0], p[1] - 7.5])); ctx.stroke(); ctx.beginPath(); owPolyline(ctx, OW_HIGHWAY.map(p => [p[0], p[1] + 7.5])); ctx.stroke();
    ctx.lineCap = 'butt';
  }
}
function owMountains(ctx, R, s) {
  const G = brcmGeo();
  if (!G.ow.peaks) return;
  for (const p of G.ow.peaks) {
    if (p.x + p.w < R.x0 || p.x - p.w > R.x1 || p.y - p.h > R.y1 || p.y + 4 < R.y0) continue;
    const L = p.x - p.w / 2, Rr = p.x + p.w / 2, ax = p.x + p.sk * p.w * 0.2, ay = p.y - p.h;
    const far = p.far;
    ctx.fillStyle = far ? '#8a7392' : '#a77d68';
    ctx.beginPath(); ctx.moveTo(L, p.y); ctx.quadraticCurveTo(lerp(L, ax, 0.6), lerp(p.y, ay, 0.35), ax, ay);
    ctx.quadraticCurveTo(lerp(ax, Rr, 0.4), lerp(ay, p.y, 0.7), Rr, p.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = far ? '#b39ab3' : '#d6a47c';           // sunlit west face
    ctx.beginPath(); ctx.moveTo(L, p.y); ctx.quadraticCurveTo(lerp(L, ax, 0.6), lerp(p.y, ay, 0.35), ax, ay);
    ctx.quadraticCurveTo(ax - p.w * 0.04, lerp(ay, p.y, 0.55), ax + p.w * 0.1, p.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = far ? 'rgba(70,46,80,0.35)' : 'rgba(84,46,40,0.4)'; ctx.lineWidth = Math.max(0.5, 0.8 / Math.max(0.5, s / 2.8)); ctx.beginPath();
    for (let k = 1; k < 6; k++) { const t = k / 6, x = lerp(ax, Rr, t), y = lerp(ay, p.y, t * 0.65 + t * t * 0.35); ctx.moveTo(x, y); ctx.lineTo(x - p.w * 0.06, y + p.h * 0.2); }
    ctx.stroke();
  }
}
function owPaintFinish(ctx, R, s) {
  const W = OW.W, H = OW.H;
  // the sheet's border: a double rule and a soft darkening at the edges
  ctx.save();
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
  vg.addColorStop(0, 'rgba(60,30,60,0)'); vg.addColorStop(1, 'rgba(60,30,60,0.28)');
  ctx.fillStyle = vg; ctx.fillRect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0);
  ctx.strokeStyle = 'rgba(60,34,52,0.6)'; ctx.lineWidth = 3; ctx.strokeRect(6, 6, W - 12, H - 12);
  ctx.lineWidth = 1; ctx.strokeRect(12, 12, W - 24, H - 24);
  ctx.fillStyle = BRCM.NIGHT;
  ctx.beginPath(); ctx.rect(R.x0, R.y0, R.x1 - R.x0, R.y1 - R.y0); ctx.rect(0, 0, W, H); ctx.fill('evenodd');
  ctx.restore();
  // paper grain in device pixels
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.55; ctx.fillStyle = ctx.createPattern(owGrain(), 'repeat'); ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

/* ---------- land painters (static, world transform set by the caller) ---------- */
const owHit = (R, b, m) => b.x1 + m > R.x0 && b.x0 - m < R.x1 && b.y1 + m > R.y0 && b.y0 - m < R.y1;
function owClipLand(ctx, w, grow) { ctx.save(); ctx.beginPath(); owLandPath(ctx, w, grow || 0); ctx.clip('evenodd'); }

// 41 Gate Road: dusk desert scrub, the road snaking in from the highway, the gate
function owPaint41(ctx, R, s, ox, oy, hi) {
  const b = owLandBox(41);
  if (!owHit(R, b, 40)) return;
  owSoftFill(ctx, 41, '#d89468', 30, 0.9);
  owClipLand(ctx, 41, 14);
  const g = ctx.createLinearGradient(700, 820, 1180, 1070);
  g.addColorStop(0, 'rgba(255,186,120,0.45)'); g.addColorStop(0.6, 'rgba(226,120,120,0.2)'); g.addColorStop(1, 'rgba(110,64,140,0.4)');
  ctx.fillStyle = g; ctx.fillRect(b.x0 - 40, b.y0 - 40, b.x1 - b.x0 + 80, b.y1 - b.y0 + 80);
  const rng = mulberry32(41);
  owStrokes(ctx, R, b, rng, hi ? 260 : 90, 22, ['#f2c08a', '#b9705a', '#e7a274', '#8e5a6e'], 0.3, 2.6, 0.12);
  // sagebrush and rocks
  for (let i = 0; i < 140; i++) {
    const x = lerp(b.x0, b.x1, rng()), y = lerp(b.y0, b.y1, rng()), r = rng.range(2.4, 5.5);
    if (x + r < R.x0 || x - r > R.x1 || y + r < R.y0 || y - r > R.y1 || !owInLand(41, x, y)) continue;
    if (rng() < 0.75) {
      ctx.fillStyle = '#6f7a5e'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.arc(x + r * 0.8, y + r * 0.2, r * 0.7, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(214,224,176,0.55)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.45, 0, TAU); ctx.fill();
    } else { ctx.fillStyle = '#8a5a52'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,220,190,0.4)'; ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.2, r * 0.5, r * 0.25, 0, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
  // the road: a dusty lane from the highway to the gate
  const road = owCatmull(OW_GATEROAD, 4).map(p => [p.x, p.y]);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(90,50,60,0.35)'; ctx.lineWidth = 30; ctx.beginPath(); owPolyline(ctx, road); ctx.stroke();
  ctx.strokeStyle = '#eccfa6'; ctx.lineWidth = 25; ctx.stroke();
  if (hi) { ctx.strokeStyle = 'rgba(150,100,90,0.22)'; ctx.lineWidth = 1; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]); }
  // cones along the road
  ctx.fillStyle = '#ff7e3a';
  for (let i = 4; i < road.length - 2; i += 5) {
    const [x0, y0] = road[i - 1], [x1, y1] = road[i + 1], dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1;
    for (const sd of [-1, 1]) { const x = road[i][0] - dy / d * 15 * sd, y = road[i][1] + dx / d * 15 * sd; ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 2, y + 1.6); ctx.lineTo(x - 2, y + 1.6); ctx.closePath(); ctx.fill(); }
  }
  ctx.lineCap = 'butt';
  // the gate: two posts and a WELCOME HOME banner across the road near 41-6
  const gx = 846, gy = 834;
  ctx.fillStyle = '#6a4632'; ctx.fillRect(gx - 22, gy - 34, 4, 30); ctx.fillRect(gx + 18, gy - 34, 4, 30);
  ctx.fillStyle = '#e8436e'; ctx.fillRect(gx - 22, gy - 38, 44, 10);
  owInk(ctx, s, 0.8); ctx.strokeRect(gx - 22, gy - 38, 44, 10);
  ctx.fillStyle = '#fff2dc'; ctx.font = `600 6px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('WELCOME HOME', gx, gy - 32.6);
  // box-office booths beside the road
  for (const [x, y] of [[1066, 918], [1000, 912]]) {
    ctx.fillStyle = 'rgba(60,30,40,0.3)'; ctx.fillRect(x - 7, y - 3, 16, 9);
    ctx.fillStyle = '#e8dcc8'; ctx.fillRect(x - 8, y - 10, 14, 10); ctx.fillStyle = '#c0533a'; ctx.fillRect(x - 9, y - 13, 16, 4);
    owInk(ctx, s, 0.7); ctx.strokeRect(x - 8, y - 10, 14, 10);
  }
}

// 42 Center Camp: a sunny plaza around the striped big top
function owPaint42(ctx, R, s, ox, oy, hi) {
  const b = owLandBox(42);
  if (!owHit(R, b, 40)) return;
  owSoftFill(ctx, 42, '#efc77e', 26, 0.92);
  owClipLand(ctx, 42, 12);
  const { x: cx, y: cy } = OW.BIGTOP;
  const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 230);
  g.addColorStop(0, 'rgba(255,240,190,0.75)'); g.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = g; ctx.fillRect(b.x0 - 30, b.y0 - 30, b.x1 - b.x0 + 60, b.y1 - b.y0 + 60);
  ctx.strokeStyle = 'rgba(190,120,60,0.22)'; ctx.lineWidth = 2;
  for (const r of [96, 124, 152]) { ctx.beginPath(); ctx.ellipse(cx, cy + 4, r, r * 0.62, 0, 0, TAU); ctx.stroke(); }
  const rng = mulberry32(42);
  owStrokes(ctx, R, b, rng, hi ? 200 : 70, 20, ['#fff1c4', '#e0a75e', '#f6d690'], 0.32, 2.6, 0);
  // café tables, bike racks and bunting
  for (let i = 0; i < 36; i++) {
    const a = rng() * TAU, r = rng.range(100, 170), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.62 + 6;
    if (x < R.x0 - 8 || x > R.x1 + 8 || y < R.y0 - 8 || y > R.y1 + 8) continue;
    ctx.fillStyle = rng.pick(['#e8553f', '#3a78d4', '#f3d046', '#38b2a2', '#ffffff']);
    ctx.beginPath(); ctx.ellipse(x, y, 4.5, 2.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(90,50,30,0.5)'; ctx.fillRect(x - 0.6, y, 1.2, 4);
  }
  ctx.restore();
  owBigTop(ctx, cx, cy, s);
}
function owBigTop(ctx, cx, cy, s) {
  const rx = 74, ry = 25, wall = 26, peak = 92, n = 16;
  ctx.fillStyle = 'rgba(70,30,30,0.28)'; ctx.beginPath(); ctx.ellipse(cx + 10, cy + 6, rx + 8, ry + 6, 0, 0, TAU); ctx.fill();
  // walls: vertical stripes on the front half
  for (let k = 0; k < n; k++) {
    const a0 = k / n * Math.PI, a1 = (k + 1) / n * Math.PI;
    const x0 = cx + Math.cos(a0) * rx, x1 = cx + Math.cos(a1) * rx, y0 = cy + Math.sin(a0) * ry, y1 = cy + Math.sin(a1) * ry;
    ctx.fillStyle = k % 2 ? '#f6ead2' : '#d6402f';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 - wall); ctx.lineTo(x0, y0 - wall); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(40,10,20,0.85)'; ctx.beginPath(); ctx.moveTo(cx - 10, cy + ry - 0.5); ctx.lineTo(cx - 6, cy + ry - wall + 3); ctx.lineTo(cx + 6, cy + ry - wall + 3); ctx.lineTo(cx + 10, cy + ry - 0.5); ctx.closePath(); ctx.fill();
  // roof: striped cone, painted back to front
  const ty = cy - wall, px = cx, py = ty - peak + wall + 4;
  const wedges = [];
  for (let k = 0; k < 2 * n; k++) { const a0 = k / (2 * n) * TAU, a1 = (k + 1) / (2 * n) * TAU; wedges.push({ a0, a1, z: Math.sin((a0 + a1) / 2), k }); }
  wedges.sort((p, q) => p.z - q.z);
  for (const wd of wedges) {
    const x0 = cx + Math.cos(wd.a0) * (rx + 4), y0 = ty + Math.sin(wd.a0) * (ry + 2), x1 = cx + Math.cos(wd.a1) * (rx + 4), y1 = ty + Math.sin(wd.a1) * (ry + 2);
    const lit = 0.5 + 0.5 * Math.cos((wd.a0 + wd.a1) / 2 + 2.4);
    ctx.fillStyle = wd.k % 2 ? mix('#e9dcc2', '#fffaf0', lit * 0.6) : mix('#b02a26', '#ee5a40', lit);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x0, y0); ctx.lineTo(x1, y1); ctx.closePath(); ctx.fill();
  }
  // scalloped valance along the roof's front edge
  for (let k = 0; k <= 18; k++) {
    const a = k / 18 * Math.PI, x = cx + Math.cos(a) * (rx + 4), y = ty + Math.sin(a) * (ry + 2);
    ctx.fillStyle = k % 2 ? '#f6ead2' : '#d6402f'; ctx.beginPath(); ctx.arc(x, y, 4.2, 0, Math.PI); ctx.fill();
  }
  owInk(ctx, s, 1.2);
  ctx.beginPath(); ctx.moveTo(cx - rx - 4, ty); ctx.lineTo(px, py); ctx.lineTo(cx + rx + 4, ty); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); ctx.moveTo(cx - rx, cy); ctx.lineTo(cx - rx, cy - wall); ctx.moveTo(cx + rx, cy); ctx.lineTo(cx + rx, cy - wall); ctx.stroke();
  ctx.fillStyle = '#4a2c24'; ctx.fillRect(px - 1.2, py - 22, 2.4, 22);
}

// 43 The Esplanade: a night-time ring of sound camps around the Man
function owPaint43(ctx, R, s, ox, oy, hi) {
  const b = owLandBox(43);
  if (!owHit(R, b, 40)) return;
  const M = OW.M;
  ctx.save(); ctx.beginPath(); owLandPath(ctx, 43, 22); ctx.clip('evenodd');
  const g = ctx.createRadialGradient(M.x, M.y, 80, M.x, M.y, 232);
  g.addColorStop(0, 'rgba(24,18,52,0)'); g.addColorStop(0.12, '#221a48'); g.addColorStop(0.55, '#1a1440'); g.addColorStop(0.86, '#2a1e52'); g.addColorStop(1, 'rgba(40,26,70,0)');
  ctx.fillStyle = g; ctx.fillRect(M.x - 240, M.y - 240, 480, 480);
  const rng = mulberry32(43);
  owStrokes(ctx, R, b, rng, hi ? 160 : 60, 18, ['#3a2c70', '#140e30', '#4a2a6a'], 0.4, 3, (x, y) => Math.atan2(y - M.y, x - M.x) + Math.PI / 2);
  // stars of glitter on the night ground
  for (let i = 0; i < 160; i++) {
    const a = rng() * TAU, r = rng.range(100, 205), x = M.x + Math.cos(a) * r, y = M.y + Math.sin(a) * r;
    if (x < R.x0 || x > R.x1 || y < R.y0 || y > R.y1) continue;
    ctx.fillStyle = `rgba(255,240,255,${rng.range(0.15, 0.6)})`; ctx.fillRect(x, y, 0.9, 0.9);
  }
  ctx.restore();
  // the ring's dark tube (the neon is drawn live)
  ctx.strokeStyle = 'rgba(10,6,24,0.75)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(M.x, M.y, OW.RING, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,120,230,0.22)'; ctx.lineWidth = 4; ctx.stroke();
  // sound stages around the outside of the ring
  for (const st of brcmGeo().ow.stages) {
    if (st.x < R.x0 - 20 || st.x > R.x1 + 20 || st.y < R.y0 - 20 || st.y > R.y1 + 20) continue;
    ctx.save(); ctx.translate(st.x, st.y); ctx.rotate(st.a + Math.PI / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-11, -5, 24, 13);
    ctx.fillStyle = '#16121f'; ctx.fillRect(-12, -7, 24, 12);
    ctx.fillStyle = st.c; ctx.fillRect(-12, 3.5, 24, 1.6);
    ctx.fillStyle = '#0a0810'; ctx.fillRect(-15, -4, 3, 8); ctx.fillRect(12, -4, 3, 8);
    ctx.restore();
  }
}

// 44 Theme Camp Row: busy colourful camps and, to the west, a witchy grove
function owPaint44(ctx, R, s, ox, oy, hi) {
  const b = owLandBox(44), G = brcmGeo();
  if (!owHit(R, b, 40)) return;
  owSoftFill(ctx, 44, '#e9d9b6', 24, 0.95);
  owClipLand(ctx, 44, 12);
  const rng = mulberry32(44);
  owStrokes(ctx, R, b, rng, hi ? 180 : 60, 20, ['#f8ecd2', '#cdb48c', '#e2cfa4'], 0.3, 2.4, 0.3);
  // camp streets
  ctx.strokeStyle = 'rgba(255,248,232,0.75)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  for (const st of G.ow.campStreets) { ctx.beginPath(); owPolyline(ctx, st); ctx.stroke(); }
  ctx.lineCap = 'butt';
  // the grove: dark mossy ground under gnarled trees
  const gv = G.ow.grove;
  const gg = ctx.createRadialGradient(gv.x, gv.y, 10, gv.x, gv.y, gv.r + 30);
  gg.addColorStop(0, '#2c2440'); gg.addColorStop(0.7, '#3a3150'); gg.addColorStop(1, 'rgba(70,60,80,0)');
  ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(gv.x, gv.y, gv.r + 30, (gv.r + 30) * 1.15, 0.3, 0, TAU); ctx.fill();
  owStrokes(ctx, R, { x0: gv.x - gv.r, y0: gv.y - gv.r, x1: gv.x + gv.r, y1: gv.y + gv.r }, rng, hi ? 90 : 30, 12, ['#4f3f6e', '#1e1830', '#3d5440'], 0.45, 2.4, 1.2, (x, y) => Math.hypot(x - gv.x, (y - gv.y) / 1.15) < gv.r);
  ctx.restore();
  // camps
  for (const it of G.ow.items44) if (it.x + it.s > R.x0 && it.x - it.s < R.x1 && it.y + it.s > R.y0 && it.y - it.s < R.y1) brcmItem(ctx, it, s, ox, oy, hi);
  ctx.setTransform(s, 0, 0, s, ox, oy);
  // crystals and a stone circle in the grove
  for (const c of gv.crystals) {
    if (c.x < R.x0 - 10 || c.x > R.x1 + 10 || c.y < R.y0 - 20 || c.y > R.y1 + 10) continue;
    ctx.fillStyle = c.c; ctx.beginPath(); ctx.moveTo(c.x - c.w, c.y); ctx.lineTo(c.x - c.w * 0.4, c.y - c.h); ctx.lineTo(c.x + c.w * 0.5, c.y - c.h * 0.8); ctx.lineTo(c.x + c.w, c.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(c.x - c.w * 0.4, c.y - c.h); ctx.lineTo(c.x, c.y - c.h * 0.2); ctx.lineTo(c.x - c.w * 0.7, c.y); ctx.closePath(); ctx.fill();
  }
  for (const t of gv.trees) if (t.x > R.x0 - 40 && t.x < R.x1 + 40 && t.y > R.y0 - 10 && t.y < R.y1 + 60) owTree(ctx, t, s);
  // pancake stack sign by the first camp
  const pk = G.ow.pancake;
  if (pk.x > R.x0 - 20 && pk.x < R.x1 + 20 && pk.y > R.y0 - 40 && pk.y < R.y1 + 20) {
    ctx.fillStyle = '#6a4632'; ctx.fillRect(pk.x - 1, pk.y - 18, 2, 18);
    for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#c9822e' : '#e3a24a'; ctx.beginPath(); ctx.ellipse(pk.x, pk.y - 20 - k * 3.2, 10 - k * 0.6, 3, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ffe36a'; ctx.fillRect(pk.x - 2.5, pk.y - 33, 5, 2.4);
    ctx.fillStyle = 'rgba(150,60,20,0.8)'; ctx.beginPath(); ctx.moveTo(pk.x - 6, pk.y - 30); ctx.quadraticCurveTo(pk.x - 8, pk.y - 22, pk.x - 7, pk.y - 19); ctx.lineTo(pk.x - 5, pk.y - 26); ctx.fill();
  }
}
function owTreeSegs(t) {                 // branch segments and branch tips of a gnarled tree (deterministic)
  if (t.segs) return t.segs;
  const rng = mulberry32(t.seed), segs = [], tips = [];
  const branch = (bx, by, a, len, w, depth) => {
    const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
    segs.push([bx, by, bx + Math.cos(a + 0.6) * len * 0.5, by + Math.sin(a + 0.6) * len * 0.5, ex, ey, w]);
    if (depth > 0) { branch(ex, ey, a - 0.5 - rng() * 0.4, len * 0.66, w * 0.62, depth - 1); branch(ex, ey, a + 0.45 + rng() * 0.4, len * 0.62, w * 0.6, depth - 1); }
    else tips.push([ex, ey]);
  };
  branch(t.x, t.y, -Math.PI / 2 + t.lean, t.h * 0.45, t.h * 0.1, 3);
  t.tips = tips;
  return (t.segs = segs);
}
function owTree(ctx, t, s) {               // a gnarled witchy tree
  ctx.fillStyle = 'rgba(10,6,20,0.35)'; ctx.beginPath(); ctx.ellipse(t.x + 6, t.y + 2, t.h * 0.32, t.h * 0.1, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#1d1424'; ctx.lineCap = 'round';
  for (const [x0, y0, cx, cy, x1, y1, w] of owTreeSegs(t)) { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke(); }
  ctx.lineCap = 'butt';
}

// 45 Hot Springs: a red-rock canyon off the playa, steaming pools along its floor
function owPaint45(ctx, R, s, ox, oy, hi) {
  const b = owLandBox(45), G = brcmGeo();
  if (!owHit(R, b, 40)) return;
  owSoftFill(ctx, 45, '#c0603e', 20, 0.95);
  owClipLand(ctx, 45, 10);
  // layered strata bands
  const rng = mulberry32(45), bands = ['#d98a5c', '#b4513a', '#e6a676', '#a8463a', '#cf7550'];
  for (let k = 0; k < 16; k++) {
    const y0 = b.y0 - 10 + k * ((b.y1 - b.y0 + 20) / 16);
    if (y0 > R.y1 + 20 || y0 < R.y0 - 30) continue;
    ctx.fillStyle = rgba(bands[k % bands.length], 0.55);
    ctx.beginPath(); ctx.moveTo(b.x0 - 20, y0);
    for (let x = b.x0 - 20; x <= b.x1 + 20; x += 16) ctx.lineTo(x, y0 + Math.sin(x * 0.03 + k) * 4 + Math.sin(x * 0.011 + k * 2) * 6);
    ctx.lineTo(b.x1 + 20, y0 + 9); for (let x = b.x1 + 20; x >= b.x0 - 20; x -= 16) ctx.lineTo(x, y0 + 9 + Math.sin(x * 0.03 + k + 0.5) * 4 + Math.sin(x * 0.011 + k * 2) * 6);
    ctx.closePath(); ctx.fill();
  }
  owStrokes(ctx, R, b, rng, hi ? 160 : 50, 24, ['#f0b080', '#8e3a30', '#d97a52'], 0.35, 2.4, 0.05);
  // the canyon floor winding between the nodes
  const floor = G.ow.canyon;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(70,24,24,0.45)'; ctx.lineWidth = 62; ctx.beginPath(); owPolyline(ctx, floor); ctx.stroke();
  ctx.strokeStyle = '#e2a874'; ctx.lineWidth = 50; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,226,180,0.5)'; ctx.lineWidth = 30; ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.restore();
  // canyon rim hatching
  owInk(ctx, s, 0.9); ctx.strokeStyle = 'rgba(80,26,26,0.45)';
  ctx.beginPath();
  for (let i = 0; i < floor.length - 1; i += 2) {
    const [x0, y0] = floor[i], [x1, y1] = floor[i + 1], dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
    for (const sd of [-1, 1]) { const x = x0 + nx * 31 * sd, y = y0 + ny * 31 * sd; ctx.moveTo(x, y); ctx.lineTo(x + nx * 6 * sd + dx * 0.2, y + ny * 6 * sd + dy * 0.2); }
  }
  ctx.stroke();
  // hot pools with mineral rims, mud pots and the geyser mound
  for (const p of G.ow.pools) {
    if (p.x + p.r < R.x0 || p.x - p.r > R.x1 || p.y + p.r < R.y0 || p.y - p.r > R.y1) continue;
    if (p.mud) {
      ctx.fillStyle = '#6e4632'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8e5e42'; ctx.beginPath(); ctx.ellipse(p.x - 1, p.y - 1, p.r * 0.7, p.r * 0.38, 0, 0, TAU); ctx.fill();
      continue;
    }
    ctx.fillStyle = '#f0a050'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r + 3.5, (p.r + 3.5) * 0.62, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f7f0d8'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r + 1.4, (p.r + 1.4) * 0.62, 0, 0, TAU); ctx.fill();
    const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    pg.addColorStop(0, '#0e6e8e'); pg.addColorStop(0.6, '#2ab0c8'); pg.addColorStop(1, '#9ef0f4');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.62, 0, 0, TAU); ctx.fill();
  }
  const gm = G.ow.geyser;
  if (gm.x > R.x0 - 30 && gm.x < R.x1 + 30 && gm.y > R.y0 - 40 && gm.y < R.y1 + 20) {
    const cols = ['#e86a3a', '#f0a040', '#7cc66a', '#d9e8c0'];
    for (let k = 0; k < 4; k++) { ctx.fillStyle = cols[k]; ctx.beginPath(); ctx.ellipse(gm.x, gm.y - k * 4, 16 - k * 3.4, (16 - k * 3.4) * 0.45, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#2a90a8'; ctx.beginPath(); ctx.ellipse(gm.x, gm.y - 13, 2.6, 1.2, 0, 0, TAU); ctx.fill();
  }
}

// 46 Deep Playa: dark rolling dunes under the night sky
function owPaint46(ctx, R, s, ox, oy, hi) {
  const b = owLandBox(46);
  if (!owHit(R, b, 40)) return;
  owSoftFill(ctx, 46, '#2c2148', 30, 0.96);
  owClipLand(ctx, 46, 14);
  const g = ctx.createLinearGradient(0, b.y0, 0, b.y1);
  g.addColorStop(0, 'rgba(60,40,110,0.5)'); g.addColorStop(1, 'rgba(20,12,40,0.35)');
  ctx.fillStyle = g; ctx.fillRect(b.x0 - 30, b.y0 - 30, b.x1 - b.x0 + 60, b.y1 - b.y0 + 60);
  // dune ridges: lit crests and dark troughs
  const rng = mulberry32(46);
  for (let k = 0; k < 15; k++) {
    const y0 = b.y0 + k * ((b.y1 - b.y0) / 14) + rng.range(-6, 6), ph = rng() * TAU, amp = rng.range(5, 11), fq = rng.range(0.018, 0.03);
    if (y0 > R.y1 + 30 || y0 < R.y0 - 30) continue;
    const crest = x => y0 + Math.sin(x * fq + ph) * amp;
    ctx.fillStyle = 'rgba(12,6,28,0.4)'; ctx.beginPath(); ctx.moveTo(b.x0 - 20, crest(b.x0 - 20));
    for (let x = b.x0 - 20; x <= b.x1 + 20; x += 8) ctx.lineTo(x, crest(x));
    for (let x = b.x1 + 20; x >= b.x0 - 20; x -= 8) ctx.lineTo(x, crest(x) + 9 + Math.sin(x * 0.05 + ph) * 2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(176,150,230,0.42)'; ctx.lineWidth = 1.6; ctx.beginPath();
    for (let x = b.x0 - 20; x <= b.x1 + 20; x += 8) x === b.x0 - 20 ? ctx.moveTo(x, crest(x) - 0.8) : ctx.lineTo(x, crest(x) - 0.8);
    ctx.stroke();
  }
  for (let i = 0; i < (hi ? 260 : 90); i++) {
    const x = lerp(b.x0, b.x1, rng()), y = lerp(b.y0, b.y1, rng());
    if (x < R.x0 || x > R.x1 || y < R.y0 || y > R.y1) continue;
    ctx.fillStyle = `rgba(230,220,255,${rng.range(0.15, 0.7)})`; ctx.fillRect(x, y, 0.9, 0.9);
  }
  ctx.restore();
}

// 47 Hell Station: the DPW yard — gravel, fuel tanks, cranes, rebar and the trash fence
function owPaint47(ctx, R, s, ox, oy, hi) {
  const b = owLandBox(47), G = brcmGeo();
  if (!owHit(R, b, 40)) return;
  owSoftFill(ctx, 47, '#55474c', 22, 0.96);
  owClipLand(ctx, 47, 12);
  const g = ctx.createLinearGradient(b.x0, b.y0, b.x1, b.y1);
  g.addColorStop(0, 'rgba(255,150,80,0.22)'); g.addColorStop(1, 'rgba(60,30,60,0.3)');
  ctx.fillStyle = g; ctx.fillRect(b.x0 - 30, b.y0 - 30, b.x1 - b.x0 + 60, b.y1 - b.y0 + 60);
  const rng = mulberry32(47);
  for (let i = 0; i < (hi ? 500 : 140); i++) {
    const x = lerp(b.x0, b.x1, rng()), y = lerp(b.y0, b.y1, rng());
    if (x < R.x0 || x > R.x1 || y < R.y0 || y > R.y1) continue;
    ctx.fillStyle = rng.pick(['rgba(30,24,30,0.5)', 'rgba(140,120,120,0.45)', 'rgba(90,76,80,0.6)']); ctx.fillRect(x, y, 1.4, 1.4);
  }
  for (let i = 0; i < 14; i++) {
    const x = lerp(b.x0, b.x1, rng()), y = lerp(b.y0, b.y1, rng()), r = rng.range(6, 16);
    ctx.fillStyle = 'rgba(20,14,24,0.35)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, rng() * 3, 0, TAU); ctx.fill();
  }
  // painted lane markings
  ctx.strokeStyle = 'rgba(255,214,74,0.6)'; ctx.lineWidth = 1.6; ctx.setLineDash([10, 6]);
  ctx.beginPath(); ctx.moveTo(1000, 330); ctx.lineTo(1000, 720); ctx.moveTo(1150, 330); ctx.lineTo(1150, 720); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  // the trash fence along the east edge
  const fx = 1178;
  if (R.x1 > fx - 10) {
    ctx.fillStyle = 'rgba(30,20,30,0.25)'; ctx.fillRect(fx - 2, 300, 9, 470);
    ctx.strokeStyle = 'rgba(200,190,200,0.45)'; ctx.lineWidth = 0.7; ctx.beginPath();
    for (let y = 300; y < 770; y += 6) { ctx.moveTo(fx - 3, y); ctx.lineTo(fx + 3, y + 6); ctx.moveTo(fx + 3, y); ctx.lineTo(fx - 3, y + 6); }
    ctx.stroke();
    ctx.fillStyle = '#2a2028'; for (let y = 300; y < 770; y += 24) ctx.fillRect(fx - 1.5, y - 3, 3, 6);
  }
  for (const it of G.ow.yard) {
    if (it.x < R.x0 - 40 || it.x > R.x1 + 40 || it.y < R.y0 - 60 || it.y > R.y1 + 30) continue;
    if (it.t === 'tank') {
      const { x, y, r, h } = it;
      ctx.fillStyle = 'rgba(20,10,20,0.35)'; ctx.beginPath(); ctx.ellipse(x + 6, y + 3, r + 4, r * 0.4 + 2, 0, 0, TAU); ctx.fill();
      const bg = ctx.createLinearGradient(x - r, 0, x + r, 0); bg.addColorStop(0, '#f2efe8'); bg.addColorStop(0.55, '#cfcac4'); bg.addColorStop(1, '#8e8890');
      ctx.fillStyle = bg; ctx.fillRect(x - r, y - h, r * 2, h); ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.38, 0, 0, Math.PI); ctx.fill();
      ctx.fillStyle = '#e4e0da'; ctx.beginPath(); ctx.ellipse(x, y - h, r, r * 0.38, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = it.c; ctx.fillRect(x - r, y - h * 0.55, r * 2, h * 0.16);
      ctx.fillStyle = '#ffffff'; ctx.font = `700 ${r * 0.42}px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FUEL', x, y - h * 0.47);
      owInk(ctx, s, 0.9); ctx.beginPath(); ctx.ellipse(x, y - h, r, r * 0.38, 0, 0, TAU); ctx.moveTo(x - r, y - h); ctx.lineTo(x - r, y); ctx.moveTo(x + r, y - h); ctx.lineTo(x + r, y); ctx.ellipse(x, y, r, r * 0.38, 0, 0, Math.PI); ctx.stroke();
    } else if (it.t === 'rebar') {
      for (let k = 0; k < 7; k++) { ctx.strokeStyle = k % 2 ? '#a0522d' : '#c2703a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(it.x - 16, it.y - k * 1.6); ctx.lineTo(it.x + 16, it.y - k * 1.6 - 3); ctx.stroke(); }
    } else if (it.t === 'box') {
      ctx.fillStyle = 'rgba(20,10,20,0.3)'; ctx.fillRect(it.x - it.w / 2 + 3, it.y - it.h / 2 + 3, it.w, it.h);
      ctx.fillStyle = it.c; ctx.fillRect(it.x - it.w / 2, it.y - it.h / 2, it.w, it.h);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.6; ctx.beginPath(); for (let xx = it.x - it.w / 2 + 2; xx < it.x + it.w / 2; xx += 2.2) { ctx.moveTo(xx, it.y - it.h / 2); ctx.lineTo(xx, it.y + it.h / 2); } ctx.stroke();
      owInk(ctx, s, 0.8); ctx.strokeRect(it.x - it.w / 2, it.y - it.h / 2, it.w, it.h);
    } else if (it.t === 'crane') {
      const { x, y, h } = it;                 // the lattice mast (the boom swings live)
      ctx.fillStyle = 'rgba(20,10,20,0.3)'; ctx.fillRect(x - 6, y - 2, 18, 6);
      ctx.strokeStyle = '#f2a01e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x - 2, y - h); ctx.moveTo(x + 4, y); ctx.lineTo(x + 2, y - h);
      for (let yy = 0; yy < h; yy += 6) { ctx.moveTo(x - 4 + yy / h * 2, y - yy); ctx.lineTo(x + 2 - yy / h * 0, y - yy - 6); }
      ctx.stroke(); ctx.fillStyle = '#2a2028'; ctx.fillRect(x - 6, y - 2, 12, 4);
    }
  }
}

// 48 The Man Base: a dark plaza with golden rings (the saucer and the Man are drawn live)
function owPaint48(ctx, R, s, ox, oy, hi) {
  const M = OW.M;
  if (R.x1 < M.x - 110 || R.x0 > M.x + 110 || R.y1 < M.y - 110 || R.y0 > M.y + 110) return;
  const g = ctx.createRadialGradient(M.x, M.y, 10, M.x, M.y, 102);
  g.addColorStop(0, '#3a2a40'); g.addColorStop(0.75, '#271c3e'); g.addColorStop(1, 'rgba(34,26,72,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(M.x, M.y, 102, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,216,74,0.35)'; ctx.lineWidth = 1.4;
  for (const r of [40, 62, 84]) { ctx.beginPath(); ctx.ellipse(M.x, M.y + 6, r, r * 0.55, 0, 0, TAU); ctx.stroke(); }
  ctx.beginPath();
  for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; ctx.moveTo(M.x + Math.cos(a) * 40, M.y + 6 + Math.sin(a) * 22); ctx.lineTo(M.x + Math.cos(a) * 90, M.y + 6 + Math.sin(a) * 49.5); }
  ctx.strokeStyle = 'rgba(255,216,74,0.16)'; ctx.stroke();
}

/* ---------- props for the lands (built once with the rest of the geometry) ---------- */
function owBuildGeo(G) {
  const rng = mulberry32(0x5B0B), O = G.ow = {};
  const nodeNear = (x, y, d) => { for (const id in OW.NODES) { const [nx, ny] = OW.NODES[id]; if (Math.hypot(nx - x, ny - y) < d) return true; } return false; };
  const pathNear = (x, y, d) => { for (const P of G.paths) for (let i = 0; i < P.pts.length; i += 3) if (Math.hypot(P.pts[i].x - x, P.pts[i].y - y) < d) return true; return false; };
  // mountains round the rim of the sheet
  O.peaks = [];
  for (let x = -30; x < OW.W + 40; x += rng.range(42, 64)) O.peaks.push({ x, y: rng.range(64, 104), w: rng.range(70, 120), h: rng.range(42, 74), sk: rng() - 0.5, far: true });
  for (let y = 140; y < 1000; y += rng.range(44, 64)) { const x = rng.range(-14, 26); if (y > 420 || y < 200) O.peaks.push({ x, y, w: rng.range(60, 100), h: rng.range(34, 60), sk: rng() - 0.5, far: false }); }
  for (let k = 0; k < 9; k++) O.peaks.push({ x: rng.range(20, 240), y: rng.range(800, 1010), w: rng.range(60, 110), h: rng.range(30, 58), sk: rng() - 0.5, far: false });
  for (let k = 0; k < 4; k++) O.peaks.push({ x: rng.range(1150, 1230), y: rng.range(780, 1000), w: rng.range(50, 90), h: rng.range(30, 50), sk: rng() - 0.5, far: false });
  O.peaks.sort((a, b) => a.y - b.y);
  // the Esplanade's sound stages
  O.stages = [];
  for (let k = 0; k < 14; k++) {
    const a = k / 14 * TAU + 0.2, x = OW.M.x + Math.cos(a) * 184, y = OW.M.y + Math.sin(a) * 184;
    if (nodeNear(x, y, 26) || pathNear(x, y, 14)) continue;
    O.stages.push({ x, y, a, c: BRCM.LIGHTS[k % 8] });
  }
  O.lasers = O.stages.filter((st, i) => i % 2 === 0).map((st, i) => ({ x: st.x, y: st.y, c: ['#3dff8e', '#ff3b6b', '#42e8ff', '#c45bff'][i % 4], ph: rng() * TAU, sp: rng.range(0.6, 1.1), out: true }));
  // Theme Camp Row: streets and camps on the east side, the witchy grove to the west
  O.grove = { x: 172, y: 548, r: 92, trees: [], crystals: [] };
  O.campStreets = [[[248, 410], [300, 404], [360, 412], [420, 430]], [[262, 500], [330, 488], [410, 500]], [[262, 590], [330, 578], [410, 586]], [[268, 680], [330, 668], [380, 676]],
    [[300, 404], [306, 500], [304, 590], [300, 680]], [[360, 412], [372, 500], [372, 586]]];
  O.items44 = [];
  const P = BRCM_PAL;
  for (let i = 0; i < 400 && O.items44.length < 150; i++) {
    const x = rng.range(250, 420), y = rng.range(400, 700);
    if (!owInLand(44, x, y) || Math.hypot(x - O.grove.x, (y - O.grove.y) / 1.15) < O.grove.r + 14 || nodeNear(x, y, 20) || pathNear(x, y, 9)) continue;
    let near = false; for (const st of O.campStreets) for (const [sx, sy] of st) if (Math.hypot(sx - x, sy - y) < 9) near = true;
    if (near) continue;
    const k = rng(), a = rng.range(-0.15, 0.15);
    let it;
    if (k < 0.34) { const r = rng.range(2.6, 4); it = { t: 'tent', r, s: r }; }
    else if (k < 0.5) { const r = rng.range(5, 8); it = { t: 'dome', r, s: r + 1, c: rng.pick(P.dome) }; }
    else if (k < 0.62) { const w = rng.range(12, 18), h = rng.range(8, 11); it = { t: 'shade', w, h, s: w / 2 + 1, c: rng.pick(P.shade), c2: rng.pick(P.tent) }; }
    else if (k < 0.74) { const r = rng.range(5, 7.5); const cp = rng.pick(P.para); it = { t: 'para', r, s: r + 1, c: cp[0], c2: cp[1], n: 10 }; }
    else if (k < 0.86) { const w = rng.range(10, 13); it = { t: 'rv', w, h: 4.6, s: w / 2 + 1, c: rng.pick(P.rv), c2: rng.pick(P.stripe) }; }
    else if (k < 0.93) { it = { t: 'yurt', r: 4, s: 4.5 }; }
    else { it = { t: 'flag', s: 4, c: rng.pick(P.tent) }; }
    if (!it.c) it.c = rng.pick(P.tent);
    let clash = false; for (const o of O.items44) if (Math.hypot(o.x - x, o.y - y) < o.s + it.s + 1) { clash = true; break; }
    if (clash) continue;
    it.x = x; it.y = y; it.a = a; O.items44.push(it);
  }
  for (let i = 0; i < 200 && O.grove.trees.length < 16; i++) {
    const a = rng() * TAU, r = Math.sqrt(rng()) * O.grove.r, x = O.grove.x + Math.cos(a) * r, y = O.grove.y + Math.sin(a) * r * 1.15;
    if (nodeNear(x, y, 22) || pathNear(x, y, 12)) continue;
    let clash = false; for (const t of O.grove.trees) if (Math.hypot(t.x - x, t.y - y) < 24) clash = true;
    if (!clash) O.grove.trees.push({ x, y, h: rng.range(24, 36), lean: rng.range(-0.25, 0.25), seed: rng.int(1, 1e6) });
  }
  O.grove.trees.sort((a, b) => a.y - b.y);
  for (let i = 0; i < 60 && O.grove.crystals.length < 9; i++) {
    const a = rng() * TAU, r = Math.sqrt(rng()) * O.grove.r * 0.9, x = O.grove.x + Math.cos(a) * r, y = O.grove.y + Math.sin(a) * r * 1.15;
    if (!nodeNear(x, y, 18) && !pathNear(x, y, 8)) O.grove.crystals.push({ x, y, w: rng.range(2.5, 4), h: rng.range(6, 11), c: rng.pick(['#b47cff', '#6ee8d0', '#ff8ad8']) });
  }
  O.cauldron = { x: 128, y: 520 };
  O.pancake = { x: 394, y: 640 };
  O.bubbles = { x: 356, y: 470 };
  // Hot Springs: the canyon floor, pools, mud pots and the geyser mound
  O.canyon = owCatmull([[60, 372], OW.NODES['45-1'], OW.NODES['45-2'], OW.NODES['45-3'], OW.NODES['45-4'], OW.NODES['45-5'], OW.NODES['45-6'], [540, 214]], 6).map(p => [p.x, p.y]);
  O.pools = [{ x: 214, y: 302, r: 13 }, { x: 300, y: 292, r: 10 }, { x: 362, y: 286, r: 9 }, { x: 503, y: 268, r: 14 }, { x: 150, y: 302, r: 8 }, { x: 432, y: 332, r: 8, mud: true }, { x: 392, y: 336, r: 6, mud: true }, { x: 446, y: 276, r: 5, mud: true }];
  O.geyser = { x: 246, y: 348 };
  // Deep Playa sculptures
  O.art = [];
  const kinds = ['lotus', 'spire', 'ring', 'tree', 'head', 'disco', 'pyramid', 'wave', 'spiral', 'butterfly'];
  for (let i = 0; i < 600 && O.art.length < 8; i++) {
    const x = rng.range(660, 1150), y = rng.range(190, 400);
    if (!owInLand(46, x, y) || nodeNear(x, y, 34) || pathNear(x, y, 20)) continue;
    let clash = false; for (const a of O.art) if (Math.hypot(a.x - x, a.y - y) < 60) clash = true;
    if (!clash) O.art.push({ x, y, kind: kinds[O.art.length % kinds.length], s: rng.range(1.5, 2.1), ph: rng() * TAU, hue: rng.int(0, 360) });
  }
  // Hell Station yard
  O.yard = [
    { t: 'tank', x: 1062, y: 344, r: 17, h: 30, c: '#e8553f' }, { t: 'tank', x: 1150, y: 318, r: 13, h: 24, c: '#3a78d4' },
    { t: 'rebar', x: 1060, y: 500 }, { t: 'rebar', x: 1068, y: 512 },
    { t: 'crane', x: 1150, y: 452, h: 64 }, { t: 'crane', x: 980, y: 640, h: 52 },
    { t: 'box', x: 976, y: 498, w: 24, h: 10, c: '#2f62a6' }, { t: 'box', x: 1150, y: 585, w: 22, h: 10, c: '#3e7d4f' }, { t: 'box', x: 1072, y: 646, w: 22, h: 10, c: '#c58b2a' }, { t: 'box', x: 1072, y: 634, w: 22, h: 10, c: '#b5482f' }
  ];
}

/* ---------- live details, drawn every frame (world transform set) ---------- */
function owMakeLive() {
  const rng = mulberry32(((Date.now() / 997) | 0) ^ 0x22), L = { rng };
  L.road = brcmPolyline(owCatmull(OW_GATEROAD, 3));
  L.hwy = brcmPolyline(owCatmull(OW_HIGHWAY, 6));
  L.rvs = [];
  for (let d = 4; d < L.road.len - 6; d += rng.range(13, 19)) L.rvs.push({ d, len: rng.range(9, 13), c: rng.pick(BRCM_PAL.rv.concat(['#e8553f', '#3a78d4', '#f3d046'])), rv: rng() < 0.7 });
  L.cars = [];
  for (let k = 0; k < 6; k++) L.cars.push({ d: rng() * L.hwy.len, v: rng.range(30, 60) * (k % 2 ? 1 : -1), lane: k % 2 ? 4 : -4, c: rng.pick(['#e8553f', '#f2f0e9', '#3a78d4', '#f3d046']) });
  L.bubbles = [];
  for (let k = 0; k < 9; k++) L.bubbles.push({ t: rng() * 6, r: rng.range(3, 7), dx: rng.range(-1, 1), life: rng.range(4, 7), ph: rng() * TAU });
  L.jellies = [];
  for (let k = 0; k < 5; k++) L.jellies.push({ x: rng.range(700, 1120), y: rng.range(200, 380), ph: rng() * TAU, s: rng.range(1.1, 1.6), hue: rng.int(0, 360) });
  L.devils = [{ x: 780, y: 360, a: 0.5, ph: 1 }, { x: 1040, y: 380, a: 2.5, ph: 3 }];
  L.cars43 = [
    { kind: 'whale', r: 172, w: 0.11, a: 0.3, c: '#4ac8ff' }, { kind: 'bus', r: 128, w: -0.09, a: 2.2, c: '#c45bff' },
    { kind: 'fish', r: 194, w: -0.08, a: 4.1, c: '#ff8a3a' }, { kind: 'cupcake', r: 116, w: 0.07, a: 5.2, c: '#ff6ad5' }
  ].map(o => Object.assign(o, { trail: [], tt: 0, x: 0, y: 0, hx: 1, hy: 0 }));
  L.fork = { u: 0 };
  L.sparks = [];
  return L;
}
function owStepLive(L, dt, t) {
  // RV line: stop-and-go along the Gate Road, wrapping back to the highway
  const n = L.rvs.length;
  for (let i = 0; i < n; i++) {
    const c = L.rvs[i], v = Math.max(0, 3 + 5 * Math.sin(t * 0.7 - c.d * 0.04));
    c.d += v * dt; c.v = v;
    if (c.d > L.road.len - 4) c.d -= L.road.len - 8;
  }
  for (const c of L.cars) { c.d = (c.d + c.v * dt + L.hwy.len) % L.hwy.len; }
  for (const b of L.bubbles) { b.t += dt; if (b.t > b.life) { b.t = 0; b.r = L.rng.range(3, 7); b.dx = L.rng.range(-1, 1); b.life = L.rng.range(4, 7); } }
  for (const d of L.devils) { d.a += Math.sin(t * 0.3 + d.ph) * dt * 0.6; d.x += Math.cos(d.a) * 8 * dt; d.y += Math.sin(d.a) * 5 * dt; if (!owInLand(46, d.x, d.y)) d.a += Math.PI * 0.9; }
  for (const c of L.cars43) {
    c.a += c.w * dt;
    const x = OW.M.x + Math.cos(c.a) * c.r, y = OW.M.y + Math.sin(c.a) * c.r;
    const hx = -Math.sin(c.a) * Math.sign(c.w), hy = Math.cos(c.a) * Math.sign(c.w);
    c.x = x; c.y = y; c.hx = hx; c.hy = hy; c.tt += dt;
    if (c.tt > 0.06) { c.tt = 0; c.trail.unshift(x, y); if (c.trail.length > 60) c.trail.length = 60; }
  }
  L.fork.u = (Math.sin(t * 0.45) + 1) / 2;
  if (L.rng() < dt * 2.2) L.sparks.push({ x: 1062 + L.rng.range(-10, 10), y: 498, vx: L.rng.range(-20, 20), vy: L.rng.range(-30, -8), life: 0.5 });
  for (const s of L.sparks) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 60 * dt; }
  if (L.sparks.length) L.sparks = L.sparks.filter(s => s.life > 0);
}
function owLive41(ctx, L, t, z, inV) {
  // the RV line creeping in from the highway, headlights on
  const lw = Math.max(0.5, 1 / z);
  for (const c of L.rvs) {
    const p = brcmAlong(L.road, c.d), d = Math.hypot(p.dx, p.dy) || 1, ux = p.dx / d, uy = p.dy / d, x = p.x - uy * 6.5, y = p.y + ux * 6.5;
    if (!inV(x, y, 12)) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(uy, ux));
    if (c.v > 2) { ctx.globalAlpha = Math.min(0.5, c.v / 12); ctx.drawImage(brcmGlow('#e8cdb0', 1), -c.len - 6, -5, 12, 10); ctx.globalAlpha = 1; }
    ctx.fillStyle = 'rgba(30,14,30,0.3)'; rr(ctx, -c.len / 2 + 1, -2.2, c.len, 6, 1.4); ctx.fill();
    ctx.fillStyle = c.c; rr(ctx, -c.len / 2, -3, c.len, 6, 1.4); ctx.fill();
    if (c.rv) { ctx.fillStyle = 'rgba(200,60,60,0.75)'; ctx.fillRect(-c.len / 2 + 1, 0.8, c.len - 2, 1); }
    ctx.fillStyle = '#263042'; ctx.fillRect(c.len / 2 - 2.6, -2.2, 1.6, 4.4);
    ctx.strokeStyle = 'rgba(30,14,30,0.6)'; ctx.lineWidth = lw * 0.8; rr(ctx, -c.len / 2, -3, c.len, 6, 1.4); ctx.stroke();
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(brcmGlow('#fff0c8'), c.len / 2 - 1, -3.6, 4, 4); ctx.drawImage(brcmGlow('#fff0c8'), c.len / 2 - 1, -0.4, 4, 4);
    ctx.drawImage(brcmGlow('#ff3040'), -c.len / 2 - 2, -3.2, 3, 3); ctx.drawImage(brcmGlow('#ff3040'), -c.len / 2 - 2, 0.2, 3, 3);
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }
  for (const c of L.cars) {
    const p = brcmAlong(L.hwy, c.d), d = Math.hypot(p.dx, p.dy) || 1, ux = p.dx / d, uy = p.dy / d, x = p.x - uy * c.lane, y = p.y + ux * c.lane;
    if (!inV(x, y, 10)) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(uy, ux) + (c.v < 0 ? Math.PI : 0));
    ctx.fillStyle = c.c; rr(ctx, -4, -2.2, 8, 4.4, 1.2); ctx.fill(); ctx.fillStyle = '#263042'; ctx.fillRect(1, -1.6, 1.6, 3.2);
    ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(brcmGlow('#fff0c8'), 3, -2.6, 3.4, 3.4); ctx.drawImage(brcmGlow('#fff0c8'), 3, -0.8, 3.4, 3.4); ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }
}
function owLive42(ctx, L, t, z, inV) {
  const { x: cx, y: cy } = OW.BIGTOP;
  if (!inV(cx, cy - 60, 110)) return;
  // pennants on the big top and the side poles
  const flag = (x, y, c, sz, ph) => {
    const w = Math.sin(t * 5 + ph) * 1.6;
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sz * 0.5, y + w, x + sz, y + 1 + w * 0.6); ctx.lineTo(x, y + sz * 0.55); ctx.closePath(); ctx.fill();
  };
  const py = cy - 26 - 92 + 26 + 4 - 22;
  flag(cx + 1.2, py, '#ff3d7a', 12, 0); flag(cx + 1.2, py + 7, '#ffd84a', 8, 1.3);
  for (const [x, ph] of [[cx - 74, 0.4], [cx + 74, 2.1]]) { ctx.fillStyle = '#4a2c24'; ctx.fillRect(x - 0.8, cy - 46, 1.6, 22); flag(x + 0.8, cy - 46, '#38b2a2', 8, ph); }
  // bunting garlands swaying from the peak
  const top = { x: cx, y: py + 18 };
  for (const [ex, ey] of [[cx - 118, cy + 20], [cx + 118, cy + 20], [cx - 70, cy + 60], [cx + 70, cy + 60]]) {
    const sag = 10 + Math.sin(t * 1.5 + ex) * 1.5;
    ctx.strokeStyle = 'rgba(60,30,30,0.6)'; ctx.lineWidth = Math.max(0.4, 0.7 / z); ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.quadraticCurveTo((top.x + ex) / 2, (top.y + ey) / 2 + sag, ex, ey); ctx.stroke();
    for (let k = 1; k < 9; k++) {
      const u = k / 9, x = (1 - u) * (1 - u) * top.x + 2 * u * (1 - u) * (top.x + ex) / 2 + u * u * ex, y = (1 - u) * (1 - u) * top.y + 2 * u * (1 - u) * ((top.y + ey) / 2 + sag) + u * u * ey;
      ctx.fillStyle = BRCM.LIGHTS[k % 8]; ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + 2, y); ctx.lineTo(x, y + 3.6); ctx.closePath(); ctx.fill();
    }
  }
  // espresso steam from the café
  for (let k = 0; k < 3; k++) {
    const u = (t * 0.45 + k / 3) % 1, x = 392 + Math.sin(u * 6 + k) * 3, y = 780 - u * 26;
    ctx.globalAlpha = (1 - u) * 0.55; ctx.drawImage(brcmGlow('#ffffff', 1), x - 5 - u * 4, y - 5 - u * 4, 10 + u * 8, 10 + u * 8);
  }
  ctx.globalAlpha = 1;
  // a trapeze artist swinging beside the tent
  const tx = cx + 104, ty = cy - 52, sw = Math.sin(t * 2.2) * 0.7;
  ctx.strokeStyle = '#4a2c24'; ctx.lineWidth = Math.max(0.6, 1 / z); ctx.beginPath(); ctx.moveTo(tx - 10, ty); ctx.lineTo(tx - 10, ty + 44); ctx.moveTo(tx + 10, ty); ctx.lineTo(tx + 10, ty + 44); ctx.moveTo(tx - 10, ty); ctx.lineTo(tx + 10, ty); ctx.stroke();
  const bx = tx + Math.sin(sw) * 16, by = ty + Math.cos(sw) * 16;
  ctx.strokeStyle = 'rgba(80,50,40,0.8)'; ctx.lineWidth = Math.max(0.4, 0.6 / z); ctx.beginPath(); ctx.moveTo(tx - 3, ty); ctx.lineTo(bx - 3, by); ctx.moveTo(tx + 3, ty); ctx.lineTo(bx + 3, by); ctx.stroke();
  ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = Math.max(0.9, 1.6 / z); ctx.beginPath(); ctx.moveTo(bx - 3, by); ctx.lineTo(bx + 3, by); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.sin(sw) * 6, by + Math.cos(sw) * 6); ctx.stroke();
  ctx.fillStyle = '#f2c19a'; ctx.beginPath(); ctx.arc(bx + Math.sin(sw) * 7.6, by + Math.cos(sw) * 7.6, 1.6, 0, TAU); ctx.fill();
}
function owLive43(ctx, L, t, z, inV, G) {
  const M = OW.M, R = OW.RING;
  if (!inV(M.x, M.y, 240)) return;
  // the neon ring: a soft glow with chasing light pulses
  ctx.globalCompositeOperation = 'lighter';
  const pulse = 0.75 + 0.25 * Math.sin(t * 2.6);
  ctx.strokeStyle = `rgba(255,80,220,${0.22 * pulse})`; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(M.x, M.y, R, 0, TAU); ctx.stroke();
  ctx.strokeStyle = `rgba(255,140,240,${0.55 * pulse})`; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,255,0.8)'; ctx.lineWidth = Math.max(0.6, 1.2 / z); ctx.stroke();
  for (let k = 0; k < 8; k++) {
    const a = t * 0.6 + k / 8 * TAU;
    ctx.strokeStyle = k % 2 ? 'rgba(80,240,255,0.75)' : 'rgba(255,240,120,0.7)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(M.x, M.y, R, a, a + 0.12); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
  for (const L2 of G.ow.lasers) brcmDrawLaser(ctx, L2, t, z);
  for (const c of L.cars43) if (inV(c.x, c.y, 30)) brcmDrawArtCar(ctx, c, t, z);
}
function owLive44(ctx, L, t, z, inV, G) {
  const gv = G.ow.grove;
  if (inV(gv.x, gv.y, gv.r + 40)) {
    ctx.globalCompositeOperation = 'lighter';
    for (const tr of gv.trees) {
      owTreeSegs(tr);
      tr.tips.forEach((p, i) => {
        if (i % 2) return;
        const f = 0.55 + 0.45 * Math.sin(t * 2.3 + i * 1.7 + tr.seed);
        ctx.globalAlpha = f; ctx.drawImage(brcmGlow(i % 4 ? '#b47cff' : '#7dffb0', 2), p[0] - 3.5, p[1] - 1, 7, 7);
      });
    }
    // the cauldron: a green glow with rising bubbles
    const c = G.ow.cauldron;
    ctx.globalAlpha = 0.8; ctx.drawImage(brcmGlow('#7dff6a', 1), c.x - 16, c.y - 18, 32, 26);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#16121c'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 8, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6ee86a'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 2.4, 6.4, 2.2, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 4; k++) {
      const u = (t * 0.8 + k / 4) % 1;
      ctx.fillStyle = `rgba(160,255,140,${1 - u})`; ctx.beginPath(); ctx.arc(c.x - 3 + k * 2 + Math.sin(u * 8 + k) * 1.5, c.y - 3 - u * 16, 0.8 + u * 1.2, 0, TAU); ctx.fill();
    }
    // will-o'-wisps
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 4; k++) {
      const a = t * 0.4 + k * 1.6, x = gv.x + Math.cos(a) * gv.r * 0.6, y = gv.y + Math.sin(a * 1.3) * gv.r * 0.7;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + k); ctx.drawImage(brcmGlow('#c9a0ff', 2), x - 4, y - 4, 8, 8);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  // bubble camp: giant soap bubbles drifting up
  const bb = G.ow.bubbles;
  if (inV(bb.x, bb.y - 40, 70)) {
    for (const b of L.bubbles) {
      const u = b.t / b.life, x = bb.x + b.dx * 30 * u + Math.sin(t * 1.3 + b.ph) * 4, y = bb.y - u * 70, r = b.r * (0.6 + u * 0.6);
      const al = u < 0.1 ? u * 10 : u > 0.9 ? (1 - u) * 10 : 1;
      ctx.globalAlpha = al * 0.9;
      ctx.strokeStyle = `hsla(${(t * 80 + b.ph * 60) % 360},90%,75%,0.9)`; ctx.lineWidth = Math.max(0.5, 0.9 / z); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.4, r * 0.18, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
