// Test fixture for the textured skinned hero path (BurnsSkinPBR, docs/BURNS_GUIDE.md §6.12). Builds textured, skinned
// GLBs programmatically from assets/models/shared/brady.glb, without Blender:
//   node tools/make_skin_fixture.js [outDir]        (default: $BRADY_DIST/fixtures, else dist/fixtures; never shipped)
// Writes
//   skinfix.glb             the "look" variant: skin with pore normals and a blackwork band on the arms, fabric weave,
//                           hair cards (alpha-tested, double-sided), an emissive LED necklace, face joints + face_* poses
//   skinfix_check.glb       the same with a checker-labelled albedo (tile numbers + an "F" for orientation), a chest
//                           badge with four solid quadrants (UV read-back) and a cutout banner with 4x4 holes (gaps + shadows)
//   skinfix_check_notan.glb skinfix_check without TANGENT (the loader derives them; the test compares)
//   skinfix_check.json      bind-space test points (badge quadrants, banner cells) for tools/skinpbr_test.js
// Every file carries LOD0 (the brady mesh, each triangle split in four: about 36k triangles), LOD1 (the original
// resolution, half the hair cards) and LOD2 (vertex-clustered, no cards or necklace) as sibling meshes named *_LOD1/2,
// all on one 31-joint skeleton (brady's 26 + Jaw, mouth corners, eyelids) with brady's 19 clips.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = path.join(__dirname, '..');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(root, 'dist');
const outDir = path.resolve(process.argv[2] || path.join(dist, 'fixtures'));

/* ---------------- GLB in ---------------- */
const src = fs.readFileSync(path.join(root, 'assets', 'models', 'shared', 'brady.glb'));
const jlen = src.readUInt32LE(12), J0 = JSON.parse(src.slice(20, 20 + jlen).toString());
const binOff = 20 + jlen + 8, BIN0 = src.slice(binOff, binOff + src.readUInt32LE(20 + jlen));
const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
function acc(i) {
  const A = J0.accessors[i], V = J0.bufferViews[A.bufferView], T = CT[A.componentType], n = NC[A.type];
  const off = BIN0.byteOffset + (V.byteOffset || 0) + (A.byteOffset || 0);
  const ab = BIN0.buffer.slice(off, off + A.count * n * T.BYTES_PER_ELEMENT);
  const raw = new T(ab), out = new Float32Array(A.count * n);
  const k = A.normalized ? ({ 5121: 255, 5123: 65535, 5120: 127, 5122: 32767 }[A.componentType] || 1) : 1;
  for (let q = 0; q < out.length; q++) out[q] = raw[q] / k;
  return { a: out, n, count: A.count };
}

/* ---------------- small math ---------------- */
const m4inv = m => {   // column-major 4x4 affine inverse
  const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], g = m[2], h = m[6], i = m[10];
  const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g, det = a * A + b * B + c * C, id = 1 / det;
  const r = [A * id, (c * h - b * i) * id, (b * f - c * e) * id, B * id, (a * i - c * g) * id, (c * d - a * f) * id, C * id, (b * g - a * h) * id, (a * e - b * d) * id];
  const tx = m[12], ty = m[13], tz = m[14], o = new Float64Array(16);
  o[0] = r[0]; o[4] = r[1]; o[8] = r[2]; o[1] = r[3]; o[5] = r[4]; o[9] = r[5]; o[2] = r[6]; o[6] = r[7]; o[10] = r[8];
  o[12] = -(r[0] * tx + r[1] * ty + r[2] * tz); o[13] = -(r[3] * tx + r[4] * ty + r[5] * tz); o[14] = -(r[6] * tx + r[7] * ty + r[8] * tz); o[15] = 1;
  return o;
};
const m4mul = (a, b) => { const o = new Float64Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; };
const m4pt = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
const m4T = (x, y, z) => { const o = new Float64Array(16); o[0] = o[5] = o[10] = o[15] = 1; o[12] = x; o[13] = y; o[14] = z; return o; };
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const qmul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
const qaxis = (ax, ang) => { const s = Math.sin(ang / 2); ax = norm(ax); return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(ang / 2)]; };
const qfromM = m => {   // rotation of a column-major 4x4 (unit scale assumed)
  const r00 = m[0], r01 = m[4], r02 = m[8], r10 = m[1], r11 = m[5], r12 = m[9], r20 = m[2], r21 = m[6], r22 = m[10], tr = r00 + r11 + r22;
  if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; return [(r21 - r12) / s, (r02 - r20) / s, (r10 - r01) / s, s / 4]; }
  if (r00 > r11 && r00 > r22) { const s = Math.sqrt(1 + r00 - r11 - r22) * 2; return [s / 4, (r01 + r10) / s, (r02 + r20) / s, (r21 - r12) / s]; }
  if (r11 > r22) { const s = Math.sqrt(1 + r11 - r00 - r22) * 2; return [(r01 + r10) / s, s / 4, (r12 + r21) / s, (r02 - r20) / s]; }
  const s = Math.sqrt(1 + r22 - r00 - r11) * 2; return [(r02 + r20) / s, (r12 + r21) / s, s / 4, (r10 - r01) / s];
};
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const hash2 = (x, y) => { let h = (x * 374761393 + y * 668265263) >>> 0; h = ((h ^ (h >>> 13)) * 1274126177) >>> 0; return (h ^ (h >>> 16)) / 4294967296; };
const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };
const lin2s = v => Math.round(Math.pow(Math.min(1, Math.max(0, v)), 1 / 2.2) * 255);

/* ---------------- the skeleton ---------------- */
const skin0 = J0.skins[0], JN = skin0.joints.map(i => J0.nodes[i].name), IB = acc(skin0.inverseBindMatrices).a;
const bindW = JN.map((_, k) => m4inv(Array.from(IB.subarray(k * 16, k * 16 + 16))));
const jpos = k => [bindW[k][12], bindW[k][13], bindW[k][14]];
const jIdx = nm => JN.indexOf('mixamorig:' + nm);
const childOf = {}; JN.forEach((nm, k) => { for (const c of J0.nodes[skin0.joints[k]].children || []) { const ck = skin0.joints.indexOf(c); if (ck >= 0 && !(k in childOf)) childOf[k] = ck; } });
childOf[jIdx('Head')] = jIdx('HeadTop_End'); childOf[jIdx('Hips')] = jIdx('Spine');
const parentJ = {}; for (const k in childOf) parentJ[childOf[k]] = +k;
JN.forEach((nm, k) => { for (const c of J0.nodes[skin0.joints[k]].children || []) { const ck = skin0.joints.indexOf(c); if (ck >= 0) parentJ[ck] = k; } });
const axisOf = k => { if (childOf[k] !== undefined) { const d = sub(jpos(childOf[k]), jpos(k)); if (Math.hypot(...d) > 1e-4) return norm(d); } if (parentJ[k] !== undefined) return norm(sub(jpos(k), jpos(parentJ[k]))); return [0, 1, 0]; };

/* ---------------- the source mesh (merged), with material groups ---------------- */
const MATS = J0.materials.map(m => m.name);
// fixture materials: four share one texture set (one draw), plus hair cards (cutout) and the necklace (glow)
const GROUP = { skin: 'skin', stubble: 'skin', lip: 'skin', beard_shadow: 'skin', brow: 'skin', tee_black: 'cloth', jeans: 'cloth', sneaker_black: 'cloth', hair_tie: 'cloth', hair: 'hair', hair_light: 'hair', belt: 'gear', teeth: 'gear', sunglasses: 'gear', sneaker_sole: 'gear' };
const ROUGH = { skin: 0.55, stubble: 0.7, lip: 0.45, beard_shadow: 0.65, brow: 0.8, tee_black: 0.88, jeans: 0.82, sneaker_black: 0.6, hair_tie: 0.7, hair: 0.42, hair_light: 0.42, belt: 0.55, teeth: 0.3, sunglasses: 0.08, sneaker_sole: 0.75 };
const V = { p: [], n: [], j: [], w: [], mat: [] }, TRI = [];
for (const pr of J0.meshes[0].primitives) {
  const mn = MATS[pr.material]; if (!GROUP[mn]) continue;   // 'ink' (brady's tattoo overlay) is painted into the skin texture instead
  const P = acc(pr.attributes.POSITION), N = acc(pr.attributes.NORMAL), Jn = acc(pr.attributes.JOINTS_0), W = acc(pr.attributes.WEIGHTS_0), I = acc(pr.indices);
  const v0 = V.p.length;
  for (let k = 0; k < P.count; k++) {
    V.p.push([P.a[k * 3], P.a[k * 3 + 1], P.a[k * 3 + 2]]); V.n.push([N.a[k * 3], N.a[k * 3 + 1], N.a[k * 3 + 2]]);
    V.j.push([0, 1, 2, 3].map(c => Math.round(Jn.a[k * 4 + c] * (J0.accessors[pr.attributes.JOINTS_0].componentType === 5121 ? 1 : 1))));
    V.w.push([0, 1, 2, 3].map(c => W.a[k * 4 + c])); V.mat.push(mn);
  }
  for (let k = 0; k < I.count; k += 3) TRI.push([v0 + I.a[k], v0 + I.a[k + 1], v0 + I.a[k + 2]]);
}
const domJ = i => { let b = 0; for (let c = 1; c < 4; c++) if (V.w[i][c] > V.w[i][b]) b = c; return V.j[i][b]; };
// the brady mesh's bind-space extents (for placing the extras)
const bmin = [1e9, 1e9, 1e9], bmax = [-1e9, -1e9, -1e9]; for (const p of V.p) for (let c = 0; c < 3; c++) { bmin[c] = Math.min(bmin[c], p[c]); bmax[c] = Math.max(bmax[c], p[c]); }

/* ---------------- face joints: Jaw, mouth corners, eyelids (children of Head) ---------------- */
const H = jIdx('Head'), headW = bindW[H], headP = jpos(H), headTop = jpos(jIdx('HeadTop_End'));
// the face: head-chart vertices in front of the head axis
const headV = []; for (let i = 0; i < V.p.length; i++) if (domJ(i) === H && V.mat[i] === 'skin' || (domJ(i) === H && V.mat[i] === 'lip')) headV.push(i);
let fz = -1e9; for (const i of headV) fz = Math.max(fz, V.p[i][2]);
const lipV = V.mat.map((m, i) => m === 'lip' ? i : -1).filter(i => i >= 0);
const mouth = lipV.length ? mul(lipV.reduce((s, i) => add(s, V.p[i]), [0, 0, 0]), 1 / lipV.length) : [headP[0], headP[1] + 0.02, fz - 0.01];
const glassV = V.mat.map((m, i) => m === 'sunglasses' ? i : -1).filter(i => i >= 0);
const eyes = glassV.length ? mul(glassV.reduce((s, i) => add(s, V.p[i]), [0, 0, 0]), 1 / glassV.length) : [headP[0], headP[1] + 0.09, fz - 0.03];
const FACE = [
  { name: 'mixamorig:Jaw', p: [headP[0], mouth[1] + 0.025, headP[2] + 0.005] },
  { name: 'mixamorig:LeftMouth', p: [mouth[0] + 0.022, mouth[1], mouth[2] - 0.004] },
  { name: 'mixamorig:RightMouth', p: [mouth[0] - 0.022, mouth[1], mouth[2] - 0.004] },
  { name: 'mixamorig:LeftEyelid', p: [eyes[0] + 0.032, eyes[1] + 0.006, eyes[2] - 0.02] },
  { name: 'mixamorig:RightEyelid', p: [eyes[0] - 0.032, eyes[1] + 0.006, eyes[2] - 0.02] }
];
const headInv = Array.from(IB.subarray(H * 16, H * 16 + 16));
FACE.forEach((F, i) => { F.k = JN.length + i; F.local = m4pt(headInv, F.p); F.ib = m4mul(m4T(-F.local[0], -F.local[1], -F.local[2]), headInv); });
// reweight the lower face to the jaw and the lip corners to the mouth joints
for (const i of headV.concat(lipV)) {
  const p = V.p[i]; if (p[2] < headP[2] + 0.02) continue;
  const below = (mouth[1] + 0.012 - p[1]) / 0.05;
  let wj = Math.max(0, Math.min(1, below)) * Math.max(0, Math.min(1, (p[2] - headP[2] - 0.02) / 0.04));
  if (wj <= 0.02) continue;
  const corner = V.mat[i] === 'lip' ? Math.max(0, Math.min(1, (Math.abs(p[0] - mouth[0]) - 0.01) / 0.015)) : 0;
  wj *= 1 - corner * 0.7;
  V.j[i] = [H, FACE[0].k, p[0] > mouth[0] ? FACE[1].k : FACE[2].k, 0]; V.w[i] = [1 - wj - corner * 0.7, wj, corner * 0.7, 0];
}
const NJ = JN.length + FACE.length;
const allW = bindW.concat(FACE.map(F => m4inv(F.ib)));
const jposAll = k => [allW[k][12], allW[k][13], allW[k][14]];

/* ---------------- charts: (material group, body part) -> an atlas tile, cylindrical UVs around the part's bone ---------------- */
const charts = new Map(), triChart = [];
for (const t of TRI) {
  const g = GROUP[V.mat[t[0]]], js = t.map(domJ), jm = js[1] === js[2] ? js[1] : js[0];
  const key = g + ':' + jm; if (!charts.has(key)) charts.set(key, { key, g, j: jm, idx: charts.size, hmin: 1e9, hmax: -1e9 });
  triChart.push(charts.get(key));
}
const BADGE_TILE = charts.size, NTILE = charts.size + 1, GRID = Math.ceil(Math.sqrt(NTILE));
const basis = j => { const ax = axisOf(j); let e1 = sub([0, 0, 1], mul(ax, ax[2])); if (Math.hypot(...e1) < 0.2) e1 = sub([1, 0, 0], mul(ax, ax[0])); e1 = norm(e1); return { ax, e1, e2: cross(ax, e1), o: jposAll(j) }; };
for (const C of charts.values()) C.B = basis(C.j);
const cyl = (C, p) => { const d = sub(p, C.B.o), h = dot(d, C.B.ax), r = sub(d, mul(C.B.ax, h)); return { u: Math.atan2(dot(r, C.B.e2), dot(r, C.B.e1)) / (2 * Math.PI) + 0.5, h }; };
TRI.forEach((t, k) => { const C = triChart[k]; for (const i of t) { const h = cyl(C, V.p[i]).h; C.hmin = Math.min(C.hmin, h); C.hmax = Math.max(C.hmax, h); } });
const PAD = 0.06, USPAN = 1.25;   // a tile: 6 % gutter; u 0..1.25 so triangles across the seam keep continuous UVs
const tileUV = (tile, u, v) => { const gx = tile % GRID, gy = Math.floor(tile / GRID), s = 1 / GRID; return [(gx + PAD + (u / USPAN) * (1 - 2 * PAD)) * s, (gy + PAD + v * (1 - 2 * PAD)) * s]; };
// the chart mesh: vertices duplicated per (vertex, chart, seam side)
const M1 = { p: [], n: [], j: [], w: [], uv: [], mat: [], chart: [] }, T1 = [], vmap = new Map();
TRI.forEach((t, k) => {
  const C = triChart[k], cu = t.map(i => cyl(C, V.p[i]).u), wrap = Math.max(...cu) - Math.min(...cu) > 0.5;
  T1.push(t.map((i, c) => {
    let u = cu[c]; if (wrap && u < 0.5) u += 1; u = Math.min(u, USPAN);
    const key = i + ':' + C.idx + ':' + (u >= 1 ? 1 : 0);
    if (!vmap.has(key)) {
      const h = cyl(C, V.p[i]).h, v = 1 - (h - C.hmin) / ((C.hmax - C.hmin) || 1);   // image v down = down the bone… top of the part at the top of the tile
      vmap.set(key, M1.p.length);
      M1.p.push(V.p[i]); M1.n.push(V.n[i]); M1.j.push(V.j[i]); M1.w.push(V.w[i]); M1.mat.push(V.mat[i]); M1.chart.push(C.idx); M1.uv.push(tileUV(C.idx, u, v));
    }
    return vmap.get(key);
  }));
});
const chartList = [...charts.values()];
console.log('source', V.p.length, 'verts', TRI.length, 'tris;', chartList.length, 'charts on a', GRID + 'x' + GRID, 'atlas grid;', M1.p.length, 'chart verts');

/* ---------------- extras: badge (check), banner (check), hair cards, necklace ---------------- */
const S2 = jIdx('Spine2'), NECK = jIdx('Neck'), s2p = jpos(S2), neckP = jpos(NECK);
let chestZ = -1e9, backZ = 1e9;
for (let i = 0; i < V.p.length; i++) { const p = V.p[i]; if (Math.abs(p[1] - (s2p[1] + 0.06)) < 0.05 && Math.abs(p[0] - s2p[0]) < 0.06) { chestZ = Math.max(chestZ, p[2]); backZ = Math.min(backZ, p[2]); } }
function quad(o, ux, uy, uv0, uv1, joint, matName, flipV) {   // a quad centred at o, spanning ±ux, ±uy; uv rectangle uv0..uv1
  const nrm = norm(cross(ux, uy)), base = { p: [], n: [], j: [], w: [], uv: [], mat: [] };
  const cs = [[-1, 1], [1, 1], [1, -1], [-1, -1]];   // TL, TR, BR, BL in (x right, y up)
  for (const [a, b] of cs) {
    base.p.push(add(o, add(mul(ux, a), mul(uy, b)))); base.n.push(nrm); base.j.push([joint, 0, 0, 0]); base.w.push([1, 0, 0, 0]); base.mat.push(matName);
    const s = (a + 1) / 2, t = flipV ? (b + 1) / 2 : (1 - b) / 2;
    base.uv.push([uv0[0] + (uv1[0] - uv0[0]) * s, uv0[1] + (uv1[1] - uv0[1]) * t]);
  }
  return { V: base, T: [[0, 3, 2], [0, 2, 1]] };
}
// badge: 16 cm square on the chest, facing +Z (the character's front); image left = -X, the character's right (a viewer's left)
const BY = s2p[1] - 0.02; let badgeZ = -1e9;   // the chest's most forward point under the badge (the tee bulges below Spine2)
for (let i = 0; i < V.p.length; i++) { const p = V.p[i]; if (GROUP[V.mat[i]] !== 'hair' && Math.abs(p[1] - BY) < 0.1 && Math.abs(p[0] - s2p[0]) < 0.1) badgeZ = Math.max(badgeZ, p[2]); }
const BADGE = { o: [s2p[0], BY, Math.max(chestZ, badgeZ) + 0.012], half: 0.08 };
const bUV = tileUV(BADGE_TILE, 0, 0), bUV1 = tileUV(BADGE_TILE, USPAN, 1);
const badgeQ = quad(BADGE.o, [BADGE.half, 0, 0], [0, BADGE.half, 0], bUV, bUV1, S2, 'gear');
// banner: 40 cm square behind the shoulders, above the head, cut out in a 4x4 checker (cells (i + j) even are solid)
const BANNER = { o: [s2p[0], neckP[1] + 0.42, backZ - 0.16], half: 0.2 };
const bannerQ = quad(BANNER.o, [BANNER.half, 0, 0], [0, BANNER.half, 0], [0.5, 0], [1, 1], S2, 'hair_cards');
// hair cards: strands from the crown back toward the bun, outside the hair cap; and two eyelash strips
const hairV = V.mat.map((m, i) => GROUP[m] === 'hair' ? i : -1).filter(i => i >= 0);
const BUN = jIdx('Bun'), bunP = jpos(BUN);
function hairCards(n) {
  const out = { p: [], n: [], j: [], w: [], uv: [], mat: [] }, T = [];
  const hc = add(headP, [0, 0.09, -0.005]); let r = 0; for (const i of hairV) r = Math.max(r, Math.hypot(...sub(V.p[i], hc)) * (V.p[i][1] > hc[1] - 0.02 ? 1 : 0)); r = Math.min(Math.max(r, 0.09), 0.13);
  seed = 777;
  for (let c = 0; c < n; c++) {
    const az = (rnd() * 1.7 - 0.85) * Math.PI, el = 0.25 + rnd() * 0.9;   // around the crown, mostly top/back/sides
    const dir = norm([Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]);
    if (dir[2] > 0.55 && dir[1] < 0.75) continue;   // keep the forehead clear
    const root = add(hc, mul(dir, r + 0.006));
    const toBun = norm(sub(bunP, root)), along = norm(sub(toBun, mul(dir, dot(toBun, dir)))), side = norm(cross(dir, along));
    const len = 0.08 + rnd() * 0.06, wid = 0.022 + rnd() * 0.012, tip = add(add(root, mul(along, len)), mul(dir, 0.004));
    const slice = Math.floor(rnd() * 8), u0 = slice / 16, u1 = (slice + 1) / 16;   // left half of the hair texture: 8 strand clumps
    const v0 = out.p.length;
    for (const [pt, s, t] of [[add(root, mul(side, -wid)), u0, 0], [add(root, mul(side, wid)), u1, 0], [add(tip, mul(side, wid * 0.7)), u1, 1], [add(tip, mul(side, -wid * 0.7)), u0, 1]]) {
      out.p.push(pt); out.n.push(dir); out.j.push([H, 0, 0, 0]); out.w.push([1, 0, 0, 0]); out.uv.push([s, t]); out.mat.push('hair_cards');
    }
    T.push([v0, v0 + 1, v0 + 2], [v0, v0 + 2, v0 + 3]);
  }
  // eyelashes: a thin strip above each eye (behind the sunglasses on brady, there for the contract)
  for (const sx of [1, -1]) {
    const o = add(eyes, [sx * 0.032, 0.012, 0.004]), v0 = out.p.length;
    for (const [dx, dy, s, t] of [[-0.016, 0, 0, 0.55], [0.016, 0, 0.0625, 0.55], [0.016, -0.006, 0.0625, 0.75], [-0.016, -0.006, 0, 0.75]]) { out.p.push(add(o, [dx, dy, 0])); out.n.push([0, 0, 1]); out.j.push([FACE[sx > 0 ? 3 : 4].k, 0, 0, 0]); out.w.push([1, 0, 0, 0]); out.uv.push([s, t]); out.mat.push('hair_cards'); }
    T.push([v0, v0 + 3, v0 + 2], [v0, v0 + 2, v0 + 1]);
  }
  return { V: out, T };
}
// necklace: a torus around the base of the neck (Neck/Spine2), emissive
function necklace(seg, rs) {
  const out = { p: [], n: [], j: [], w: [], uv: [], mat: [] }, T = [];
  const c = add(mul(add(neckP, s2p), 0.5), [0, -0.0, 0.0]);
  let R = 0; for (let i = 0; i < V.p.length; i++) { const p = V.p[i]; if (Math.abs(p[1] - c[1]) < 0.02 && GROUP[V.mat[i]] !== 'hair') R = Math.max(R, Math.hypot(p[0] - c[0], p[2] - c[2])); }
  R = Math.min(Math.max(R + 0.012, 0.07), 0.12); const r = 0.0075;
  for (let i = 0; i <= seg; i++) for (let k = 0; k <= rs; k++) {
    const a = i / seg * Math.PI * 2, b = k / rs * Math.PI * 2, dip = 0.03 * Math.max(0, Math.cos(a)) ** 2;   // dips at the front
    const cen = [c[0] + Math.sin(a) * R, c[1] - dip, c[2] + Math.cos(a) * R * 1.05], nr = [Math.sin(a) * Math.cos(b), Math.sin(b), Math.cos(a) * Math.cos(b)];
    out.p.push(add(cen, mul(nr, r))); out.n.push(nr); out.j.push([NECK, S2, 0, 0]); out.w.push([0.4, 0.6, 0, 0]); out.uv.push([i / seg, k / rs]); out.mat.push('glow_necklace');
  }
  for (let i = 0; i < seg; i++) for (let k = 0; k < rs; k++) { const a = i * (rs + 1) + k, b = a + rs + 1; T.push([a, a + 1, b + 1], [a, b + 1, b]); }   // outward winding
  return { V: out, T };
}

/* ---------------- LODs ---------------- */
function mergeW(ja, wa, jb, wb) {   // the average of two influence sets: top four, normalised
  const m = new Map(); for (let c = 0; c < 4; c++) { if (wa[c] > 0) m.set(ja[c], (m.get(ja[c]) || 0) + wa[c] * 0.5); if (wb[c] > 0) m.set(jb[c], (m.get(jb[c]) || 0) + wb[c] * 0.5); }
  const e = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4), s = e.reduce((q, x) => q + x[1], 0) || 1;
  while (e.length < 4) e.push([0, 0]);
  return { j: e.map(x => x[0]), w: e.map(x => x[1] / s) };
}
function subdivide(M, T) {   // each triangle into four (edge midpoints): LOD0's density
  const O = { p: M.p.slice(), n: M.n.slice(), j: M.j.slice(), w: M.w.slice(), uv: M.uv.slice(), mat: M.mat.slice(), chart: M.chart.slice() }, T2 = [], mid = new Map();
  const m = (a, b) => {
    const key = a < b ? a + ':' + b : b + ':' + a; if (mid.has(key)) return mid.get(key);
    const k = O.p.length, w = mergeW(M.j[a], M.w[a], M.j[b], M.w[b]);
    O.p.push(mul(add(M.p[a], M.p[b]), 0.5)); O.n.push(norm(add(M.n[a], M.n[b]))); O.j.push(w.j); O.w.push(w.w);
    O.uv.push([(M.uv[a][0] + M.uv[b][0]) / 2, (M.uv[a][1] + M.uv[b][1]) / 2]); O.mat.push(M.mat[a]); O.chart.push(M.chart[a]);
    mid.set(key, k); return k;
  };
  for (const [a, b, c] of T) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); T2.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]); }
  return { M: O, T: T2 };
}
function cluster(M, T, cell) {   // vertex clustering: shared cell positions (no cracks), per-chart vertices (UVs stay put)
  const cellOf = p => p.map(x => Math.floor(x / cell)).join(','), cpos = new Map();
  M.p.forEach(p => { const k = cellOf(p), e = cpos.get(k) || [0, 0, 0, 0]; e[0] += p[0]; e[1] += p[1]; e[2] += p[2]; e[3]++; cpos.set(k, e); });
  const O = { p: [], n: [], j: [], w: [], uv: [], mat: [], chart: [] }, rep = new Map(), remap = [];
  M.p.forEach((p, i) => {
    const ck = cellOf(p), key = ck + '|' + M.chart[i] + '|' + M.mat[i];
    if (!rep.has(key)) { const e = cpos.get(ck); rep.set(key, O.p.length); O.p.push([e[0] / e[3], e[1] / e[3], e[2] / e[3]]); O.n.push(M.n[i]); O.j.push(M.j[i]); O.w.push(M.w[i]); O.uv.push(M.uv[i]); O.mat.push(M.mat[i]); O.chart.push(M.chart[i]); }
    remap[i] = rep.get(key);
  });
  const T2 = []; for (const t of T) { const r = t.map(i => remap[i]); if (r[0] !== r[1] && r[1] !== r[2] && r[0] !== r[2]) T2.push(r); }
  return { M: O, T: T2 };
}
const LOD1 = { M: M1, T: T1 }, LOD0 = subdivide(M1, T1), LOD2 = cluster(M1, T1, 0.035);

/* ---------------- textures ---------------- */
function png(w, h, rgba) {
  const crcT = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c; }
  const crc = b => { let c = -1; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (t, d) => { const L = Buffer.alloc(4); L.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const C = Buffer.alloc(4); C.writeUInt32BE(crc(td)); return Buffer.concat([L, td, C]); };
  const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
const FONT = { 0: '01110100011001110101110011000101110', 1: '00100011000010000100001000010001110', 2: '01110100010000100010001000100011111', 3: '11111000100010000010000011000101110', 4: '00010001100101010010111110001000010', 5: '11111100001111000001000011000101110', 6: '00110010001000011110100011000101110', 7: '11111000010001000100010000100001000', 8: '01110100011000101110100011000101110', 9: '01110100011000101111000010001001100', F: '11111100001000011110100001000010000' };
const text = (put, s, x0, y0, sc) => { [...String(s)].forEach((ch, ci) => { const g = FONT[ch]; if (!g) return; for (let y = 0; y < 7; y++) for (let x = 0; x < 5; x++) if (g[y * 5 + x] === '1') for (let a = 0; a < sc; a++) for (let b = 0; b < sc; b++) put(x0 + (ci * 6 + x) * sc + a, y0 + y * sc + b); }); };
const baseCol = mn => J0.materials[MATS.indexOf(mn)].pbrMetallicRoughness.baseColorFactor;
// per chart: the material whose colour paints it (the chart's most common source material)
for (const C of chartList) { const cnt = {}; M1.mat.forEach((m, i) => { if (M1.chart[i] === C.idx) cnt[m] = (cnt[m] || 0) + 1; }); C.mat = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]; }
// blackwork: a sacred-geometry band (rings, a triangle lattice, dots) between v 0.25 and 0.75 of each arm chart
const ARMS = ['LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm'].map(jIdx);
function ink(u, v) {
  if (v < 0.22 || v > 0.78) return 0;
  const x = u * 12, y = v * 10, fx = x - Math.floor(x), fy = y - Math.floor(y);
  const ring = Math.abs(Math.hypot(fx - 0.5, fy - 0.5) - 0.38) < 0.045, ring2 = Math.abs(Math.hypot(fx - 0.5, fy - 0.5) - 0.18) < 0.04;
  const tri = Math.abs((fx + fy) % 1 - 0.5) < 0.035 || Math.abs((fx - fy + 1) % 1 - 0.5) < 0.035;
  const edge = Math.abs(v - 0.24) < 0.012 || Math.abs(v - 0.76) < 0.012;
  return ring || ring2 || tri || edge ? 1 : 0;
}
function paintAtlas(size, check) {
  const px = new Uint8Array(size * size * 4), ts = size / GRID;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const gx = Math.floor(x / ts), gy = Math.floor(y / ts), tile = gy * GRID + gx, o = (y * size + x) * 4;
    const s = ((x / ts - gx) - PAD) / (1 - 2 * PAD), t = ((y / ts - gy) - PAD) / (1 - 2 * PAD), u = ((s * USPAN) % 1 + 1) % 1, v = Math.min(1, Math.max(0, t));
    let c = [0.5, 0.5, 0.5];
    if (tile === BADGE_TILE) {   // four solid quadrants: TL red, TR green, BL blue, BR yellow (in image space)
      const L = s * USPAN < USPAN / 2, T = t < 0.5;
      c = T ? (L ? [0.9, 0.04, 0.03] : [0.04, 0.8, 0.06]) : (L ? [0.03, 0.08, 0.9] : [0.9, 0.85, 0.04]);
      px.set([lin2s(c[0]), lin2s(c[1]), lin2s(c[2]), 255], o); continue;
    }
    const C = chartList[tile];
    if (C) {
      const bc = baseCol(C.mat); c = [bc[0], bc[1], bc[2]];
      if (C.g === 'skin') {   // skin: blotchy warmth, a few freckles; blackwork on the arms
        const nz = vnoise(x / 9, y / 9) * 0.6 + vnoise(x / 3, y / 3) * 0.4, fr = hash2(x >> 1, y >> 1) > 0.996 ? 0.75 : 1;
        c = [c[0] * (0.92 + 0.16 * nz) * fr, c[1] * (0.9 + 0.14 * nz) * fr, c[2] * (0.88 + 0.12 * nz) * fr];
        if (ARMS.includes(C.j) && C.mat === 'skin' && ink(u, v)) c = [0.02, 0.02, 0.03];
      } else if (C.g === 'cloth') { const nz = vnoise(x / 2, y / 2); c = c.map(k => k * (0.85 + 0.3 * nz) + 0.004); }
      else if (C.g === 'hair') { const st = vnoise(x / 1.5, y / 14); c = c.map(k => k * (0.7 + 0.6 * st)); }
      if (check) {   // checker 8x8 (u, v), tile number, an "F"
        const ck = (Math.floor(u * 8) + Math.floor(v * 8)) % 2;
        const k = C.g === 'skin' ? (ck ? 1.12 : 0.9) : (ck ? 1 : 0); c = C.g === 'skin' ? c.map(q => q * k) : ck ? c.map(q => q + 0.12) : c;
      }
    }
    px.set([lin2s(c[0]), lin2s(c[1]), lin2s(c[2]), 255], o);
  }
  if (check) for (const C of chartList) {   // labels: the tile number twice and an F (mirroring shows)
    const gx = C.idx % GRID, gy = Math.floor(C.idx / GRID), x0 = Math.round((gx + PAD) * ts), y0 = Math.round((gy + PAD) * ts), sc = Math.max(2, Math.round(ts / 64));
    const put = (x, y) => { if (x < 0 || y < 0 || x >= size || y >= size) return; const o = (y * size + x) * 4; const dark = px[o] + px[o + 1] + px[o + 2] > 300; px[o] = px[o + 1] = px[o + 2] = dark ? 20 : 240; };
    text(put, C.idx, x0 + Math.round(ts * 0.38), y0 + Math.round(ts * 0.1), sc); text(put, 'F', x0 + Math.round(ts * 0.38), y0 + Math.round(ts * 0.55), sc);
  }
  return px;
}
function paintORM(size) {   // R occlusion (1), G roughness, B metallic (0)
  const px = new Uint8Array(size * size * 4), ts = size / GRID;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const tile = Math.floor(y / ts) * GRID + Math.floor(x / ts), C = chartList[tile], o = (y * size + x) * 4;
    let r = 0.6; if (C) r = ROUGH[C.mat] || 0.6; if (tile === BADGE_TILE) r = 0.7;
    if (C && C.g === 'skin') r *= 0.9 + 0.2 * vnoise(x / 4, y / 4);
    px.set([255, Math.round(r * 255), 0, 255], o);
  }
  return px;
}
function paintNormal(size) {   // tangent-space, glTF/OpenGL (+Y = image up): skin pores, fabric weave, hair grooves
  const ts = size / GRID, h = new Float32Array(size * size), K = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const tile = Math.floor(y / ts) * GRID + Math.floor(x / ts), C = chartList[tile], i = y * size + x; if (!C) continue;
    if (C.g === 'skin') { const pore = hash2(x, y) > 0.82 ? -1 : 0; h[i] = pore * 0.6 + (vnoise(x / 2.2, y / 2.2) - 0.5) * 0.9 + (vnoise(x / 7, y / 7) - 0.5) * 0.8; K[i] = 1.2; }
    else if (C.g === 'cloth') { h[i] = Math.sin(x * Math.PI / 2) * Math.sin(y * Math.PI / 2) * 0.6 + Math.sin(y * 0.35) * 0.4; K[i] = 1.6; }
    else if (C.g === 'hair') { h[i] = Math.sin(x * 1.3 + vnoise(x / 4, y / 20) * 6) * 0.5; K[i] = 1.4; }
  }
  const px = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, k = K[i], hx = (h[y * size + Math.min(size - 1, x + 1)] - h[y * size + Math.max(0, x - 1)]) * 0.5 * k, hy = (h[Math.min(size - 1, y + 1) * size + x] - h[Math.max(0, y - 1) * size + x]) * 0.5 * k;
    const n = norm([-hx, hy, 1]);   // +x = image right (tangent), +y = image up: d/d(up) = -d/dy_img
    px.set([Math.round((n[0] * 0.5 + 0.5) * 255), Math.round((n[1] * 0.5 + 0.5) * 255), Math.round((n[2] * 0.5 + 0.5) * 255), 255], i * 4);
  }
  return px;
}
function paintHair(w, h, check) {   // left half: 8 strand clumps (alpha cut between strands, tapering tips); right half: the banner
  const px = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4, v = y / h;
    if (x >= w / 2) {   // the banner: a 4x4 checker of solid magenta and holes
      const cx = Math.floor((x - w / 2) / (w / 8)), cy = Math.floor(y / (h / 4)), solid = (cx + cy) % 2 === 0;
      px.set(solid ? [235, 30, 220, 255] : [0, 0, 0, 0], o); continue;
    }
    const col = x % (w / 16), lu = col / (w / 16);
    const strand = vnoise(x * 0.42, y * 0.01) * 0.75 + vnoise(x * 0.11, 7) * 0.45, edge = Math.min(lu, 1 - lu) * 6, taper = v > 0.65 ? 1 - (v - 0.65) / 0.35 : 1;
    let a = Math.max(0, Math.min(1, (strand - 0.32) * 4)) * Math.min(1, edge) * Math.max(0, taper - vnoise(x * 0.5, 3) * 0.25 * (v > 0.5 ? 1 : 0));
    if (check && Math.abs(lu - 0.5) < 0.1) a = 0;   // a guaranteed gap in every clump
    const shade = 0.6 + 0.5 * vnoise(x * 1.7, y * 0.05);
    const c = check ? [0.85 * shade, 0.08, 0.8 * shade] : [0.1 * shade, 0.045 * shade, 0.018 * shade];
    px.set([lin2s(c[0]), lin2s(c[1]), lin2s(c[2]), Math.round(a * 255)], o);
  }
  return px;
}

/* ---------------- GLB out ---------------- */
function writeFixture(file, check, withTangents) {
  const parts = [], views = [], accs = [];
  let blen = 0;
  const push = (buf, target) => { const pad = (4 - blen % 4) % 4; if (pad) { parts.push(Buffer.alloc(pad)); blen += pad; } views.push({ buffer: 0, byteOffset: blen, byteLength: buf.length, ...(target ? { target } : {}) }); parts.push(buf); blen += buf.length; return views.length - 1; };
  const addAcc = (arr, ctype, type, count, extra, target) => { const bv = push(Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength), target); accs.push(Object.assign({ bufferView: bv, componentType: ctype, count, type }, extra || {})); return accs.length - 1; };
  // the original animations, re-packed (their accessors are copied as they are)
  const J = JSON.parse(JSON.stringify(J0)), accMap = {};
  const copyAcc = i => {
    if (accMap[i] !== undefined) return accMap[i];
    const A = J0.accessors[i], Vw = J0.bufferViews[A.bufferView], T = CT[A.componentType], n = NC[A.type];
    const off = BIN0.byteOffset + (Vw.byteOffset || 0) + (A.byteOffset || 0), bytes = Buffer.from(BIN0.buffer.slice(off, off + A.count * n * T.BYTES_PER_ELEMENT));
    const bv = push(bytes); accs.push(Object.assign({}, A, { bufferView: bv, byteOffset: undefined })); delete accs[accs.length - 1].byteOffset; return (accMap[i] = accs.length - 1);
  };
  for (const an of J.animations) for (const s of an.samplers) { s.input = copyAcc(s.input); s.output = copyAcc(s.output); }
  // nodes: the face joints under Head; the old mesh node loses its mesh; LOD mesh nodes are added under the armature
  const headNode = skin0.joints[H];
  FACE.forEach(F => { F.node = J.nodes.length; J.nodes.push({ name: F.name, translation: F.local.map(x => +x.toFixed(6)) }); (J.nodes[headNode].children = J.nodes[headNode].children || []).push(F.node); });
  const meshNodeIdx = J.nodes.findIndex(N => N.mesh !== undefined);
  const armature = J.nodes.findIndex(N => (N.children || []).includes(meshNodeIdx));
  delete J.nodes[meshNodeIdx].mesh; delete J.nodes[meshNodeIdx].skin;
  // skin: 26 + 5 joints
  const ibm = new Float32Array(NJ * 16); ibm.set(IB.subarray(0, JN.length * 16)); FACE.forEach((F, i) => ibm.set(Array.from(F.ib), (JN.length + i) * 16));
  J.skins = [{ name: 'skinfix', joints: skin0.joints.concat(FACE.map(F => F.node)), inverseBindMatrices: addAcc(ibm, 5126, 'MAT4', NJ), skeleton: skin0.skeleton }];
  // face poses: two keys (rest, pose) per joint
  const headQ = qfromM(headW), headQi = [-headQ[0], -headQ[1], -headQ[2], headQ[3]];
  const localRot = (axis, ang) => qmul(qmul(headQi, qaxis(axis, ang)), headQ);   // a world-axis rotation as a Head-child local one
  const times = addAcc(new Float32Array([0, 0.1]), 5126, 'SCALAR', 2, { min: [0], max: [0.1] });
  const facePose = (name, list) => {
    const an = { name: 'face_' + name, samplers: [], channels: [] };
    for (const [F, path, val, rest] of list) { const out = addAcc(new Float32Array(rest.concat(val)), 5126, path === 'rotation' ? 'VEC4' : 'VEC3', 2); an.samplers.push({ input: times, output: out, interpolation: 'LINEAR' }); an.channels.push({ sampler: an.samplers.length - 1, target: { node: F.node, path } }); }
    J.animations.push(an);
  };
  facePose('jaw', [[FACE[0], 'rotation', localRot([1, 0, 0], 0.32), [0, 0, 0, 1]]]);
  facePose('smile', [[FACE[1], 'translation', add(FACE[1].local, m4pt(headInv, add(headP, [0.006, 0.008, -0.004])).map((x, c) => x - m4pt(headInv, headP)[c])), FACE[1].local.slice()], [FACE[2], 'translation', add(FACE[2].local, m4pt(headInv, add(headP, [-0.006, 0.008, -0.004])).map((x, c) => x - m4pt(headInv, headP)[c])), FACE[2].local.slice()]]);
  facePose('blink', [[FACE[3], 'rotation', localRot([1, 0, 0], 0.6), [0, 0, 0, 1]], [FACE[4], 'rotation', localRot([1, 0, 0], 0.6), [0, 0, 0, 1]]]);
  // textures and materials
  const images = [], textures = [], addImg = (name, buf) => { images.push({ name, mimeType: 'image/png', bufferView: push(buf) }); textures.push({ source: images.length - 1, sampler: 0 }); return textures.length - 1; };
  const tBase = addImg(check ? 'atlas_check' : 'atlas', png(2048, 2048, paintAtlas(2048, check)));
  const tOrm = addImg('orm', png(1024, 1024, paintORM(1024)));
  const tNrm = addImg('normal', png(1024, 1024, paintNormal(1024)));
  const tHair = addImg(check ? 'hair_check' : 'hair', png(1024, 512, paintHair(1024, 512, check)));
  const atlasMat = (name, kind) => ({ name, extras: { burns_kind: kind }, pbrMetallicRoughness: { baseColorTexture: { index: tBase }, metallicRoughnessTexture: { index: tOrm }, metallicFactor: 1, roughnessFactor: 1 }, normalTexture: { index: tNrm }, occlusionTexture: { index: tOrm } });
  J.materials = [atlasMat('skin', 'skin'), atlasMat('cloth_fabric', 'cloth'), atlasMat('hair_cap', 'hair'), atlasMat('gear', 'generic'),
    { name: 'hair_cards', extras: { burns_kind: 'hair' }, alphaMode: 'MASK', alphaCutoff: 0.5, doubleSided: true, pbrMetallicRoughness: { baseColorTexture: { index: tHair }, metallicFactor: 0, roughnessFactor: 0.45 } },
    { name: 'glow_necklace', pbrMetallicRoughness: { baseColorFactor: [0.2, 1, 0.55, 1], metallicFactor: 0, roughnessFactor: 0.35 }, emissiveFactor: [0.25, 1, 0.55], extensions: { KHR_materials_emissive_strength: { emissiveStrength: 6 } } }];
  const MI = { skin: 0, cloth: 1, hair: 2, gear: 3, hair_cards: 4, glow_necklace: 5 };
  J.extensionsUsed = ['KHR_materials_emissive_strength'];
  J.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }];
  J.images = images; J.textures = textures;
  // meshes
  const prim = (M, T, mat) => {
    const vs = [...new Set(T.flat())].sort((a, b) => a - b), remap = new Map(vs.map((v, i) => [v, i])), n = vs.length;
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), UV = new Float32Array(n * 2), JJ = new Uint8Array(n * 4), WW = new Float32Array(n * 4), TG = new Float32Array(n * 4);
    const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    vs.forEach((v, i) => { for (let c = 0; c < 3; c++) { P[i * 3 + c] = M.p[v][c]; N[i * 3 + c] = M.n[v][c]; mn[c] = Math.min(mn[c], M.p[v][c]); mx[c] = Math.max(mx[c], M.p[v][c]); } UV[i * 2] = M.uv[v][0]; UV[i * 2 + 1] = M.uv[v][1]; for (let c = 0; c < 4; c++) { JJ[i * 4 + c] = M.j[v][c]; WW[i * 4 + c] = M.w[v][c]; } });
    const I = new Uint32Array(T.length * 3); T.forEach((t, k) => { for (let c = 0; c < 3; c++) I[k * 3 + c] = remap.get(t[c]); });
    // tangents as Blender's MikkTSpace export writes them: T = dP/du, cross(N, T) * w = the image-up direction (-dP/dv)
    if (withTangents) {
      const t1 = new Float32Array(n * 3), t2 = new Float32Array(n * 3);
      for (let k = 0; k < I.length; k += 3) {
        const a = I[k], b = I[k + 1], c = I[k + 2], e1 = [P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]], e2 = [P[c * 3] - P[a * 3], P[c * 3 + 1] - P[a * 3 + 1], P[c * 3 + 2] - P[a * 3 + 2]];
        const d1u = UV[b * 2] - UV[a * 2], d1v = UV[b * 2 + 1] - UV[a * 2 + 1], d2u = UV[c * 2] - UV[a * 2], d2v = UV[c * 2 + 1] - UV[a * 2 + 1];
        let r = d1u * d2v - d2u * d1v; if (Math.abs(r) < 1e-14) continue; r = 1 / r;
        for (const q of [a, b, c]) for (let x = 0; x < 3; x++) { t1[q * 3 + x] += (e1[x] * d2v - e2[x] * d1v) * r; t2[q * 3 + x] += (e2[x] * d1u - e1[x] * d2u) * r; }
      }
      for (let i = 0; i < n; i++) {
        const nn = [N[i * 3], N[i * 3 + 1], N[i * 3 + 2]]; let t = [t1[i * 3], t1[i * 3 + 1], t1[i * 3 + 2]]; t = sub(t, mul(nn, dot(nn, t)));
        if (Math.hypot(...t) < 1e-9) t = Math.abs(nn[1]) < 0.9 ? [nn[2], 0, -nn[0]] : [0, -nn[2], nn[1]];
        t = norm(t); const w = dot(cross(nn, t), [t2[i * 3], t2[i * 3 + 1], t2[i * 3 + 2]]) < 0 ? 1 : -1;
        TG.set([t[0], t[1], t[2], w], i * 4);
      }
    }
    const attributes = { POSITION: addAcc(P, 5126, 'VEC3', n, { min: mn, max: mx }, 34962), NORMAL: addAcc(N, 5126, 'VEC3', n, null, 34962), TEXCOORD_0: addAcc(UV, 5126, 'VEC2', n, null, 34962), JOINTS_0: addAcc(JJ, 5121, 'VEC4', n, null, 34962), WEIGHTS_0: addAcc(WW, 5126, 'VEC4', n, null, 34962) };
    if (withTangents) attributes.TANGENT = addAcc(TG, 5126, 'VEC4', n, null, 34962);
    return { attributes, indices: addAcc(I, 5125, 'SCALAR', I.length, null, 34963), material: mat };
  };
  const body = (L, extras) => {   // body primitives per fixture material, plus extra quads
    const prims = [];
    for (const g of ['skin', 'cloth', 'hair', 'gear']) {
      const T = L.T.filter(t => GROUP[L.M.mat[t[0]]] === g);
      if (g === 'gear' && check && extras.badge) {   // the badge rides in the gear primitive (same texture set: same draw)
        const M = { p: L.M.p.concat(badgeQ.V.p), n: L.M.n.concat(badgeQ.V.n), j: L.M.j.concat(badgeQ.V.j), w: L.M.w.concat(badgeQ.V.w), uv: L.M.uv.concat(badgeQ.V.uv) }, o = L.M.p.length;
        prims.push(prim(M, T.concat(badgeQ.T.map(t => t.map(i => i + o))), MI.gear));
      } else if (T.length) prims.push(prim(L.M, T, MI[g]));
    }
    return prims;
  };
  const orient = Q => ({ V: Q.V, T: Q.T.map(t => { const [a, b, c] = t.map(i => Q.V.p[i]), g = cross(sub(b, a), sub(c, a)), n = add(add(Q.V.n[t[0]], Q.V.n[t[1]]), Q.V.n[t[2]]); return dot(g, n) < 0 ? [t[0], t[2], t[1]] : t; }) });
  const extra = (Q, mat) => { Q = orient(Q); return prim(Q.V, Q.T, mat); };
  const meshes = [];
  const lod = (name, L, o) => {
    const prims = body(L, o);
    const cards = o.cards ? hairCards(o.cards) : null;
    if (cards || (check && o.banner)) {   // hair cards and the banner share the cutout material: one primitive
      const M = { p: [], n: [], j: [], w: [], uv: [] }, T = [];
      for (const Q of [cards, check && o.banner ? bannerQ : null]) if (Q) { const b = M.p.length; for (const k of ['p', 'n', 'j', 'w', 'uv']) M[k].push(...Q.V[k]); T.push(...Q.T.map(t => t.map(i => i + b))); }
      prims.push(prim(M, T, MI.hair_cards));
    }
    if (o.neck) prims.push(extra(necklace(o.neck[0], o.neck[1]), MI.glow_necklace));
    meshes.push({ name, primitives: prims });
    const ni = J.nodes.length; J.nodes.push({ name, mesh: meshes.length - 1, skin: 0 }); J.nodes[armature].children.push(ni);
    return prims;
  };
  lod('skinfix', LOD0, { badge: true, banner: true, cards: 90, neck: [64, 8] });
  lod('skinfix_LOD1', LOD1, { badge: true, banner: true, cards: 40, neck: [32, 5] });
  lod('skinfix_LOD2', LOD2, { badge: true, banner: true, cards: 0, neck: null });
  J.meshes = meshes;
  J.asset = { version: '2.0', generator: 'brady-o tools/make_skin_fixture.js', extras: { name: 'skinfix' } };
  J.accessors = accs; J.bufferViews = views;
  const bin = Buffer.concat(parts); J.buffers = [{ byteLength: bin.length }];
  for (const k of Object.keys(J)) if (J[k] === undefined) delete J[k];
  let js = Buffer.from(JSON.stringify(J)); js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
  const binP = Buffer.concat([bin, Buffer.alloc((4 - bin.length % 4) % 4)]);
  const head = Buffer.alloc(12); head.writeUInt32LE(0x46546C67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + binP.length, 8);
  const cj = Buffer.alloc(8); cj.writeUInt32LE(js.length, 0); cj.writeUInt32LE(0x4E4F534A, 4);
  const cb = Buffer.alloc(8); cb.writeUInt32LE(binP.length, 0); cb.writeUInt32LE(0x004E4942, 4);
  fs.writeFileSync(file, Buffer.concat([head, cj, js, cb, binP]));
  const tris = meshes.map(m => m.primitives.reduce((s, p) => s + accs[p.indices].count / 3, 0));
  console.log(path.basename(file), (fs.statSync(file).size / 1048576).toFixed(2) + ' MB', 'tris per LOD', tris.join(' / '), 'joints', NJ);
}
fs.mkdirSync(outDir, { recursive: true });
writeFixture(path.join(outDir, 'skinfix.glb'), false, true);
writeFixture(path.join(outDir, 'skinfix_check.glb'), true, true);
writeFixture(path.join(outDir, 'skinfix_check_notan.glb'), true, false);
// test points for tools/skinpbr_test.js: bind space (metres), all on Spine2
const q = BADGE.half / 2, b = BANNER.half / 2, cells = [];
for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 4; cx++) {   // banner texture cells -> quad points (u right = +X, v down = -Y)
  const s = (cx + 0.5) / 4, t = (cy + 0.5) / 4;
  cells.push({ p: [BANNER.o[0] + (s * 2 - 1) * BANNER.half, BANNER.o[1] + (1 - t * 2) * BANNER.half, BANNER.o[2]], solid: (cx + cy) % 2 === 0 });
}
fs.writeFileSync(path.join(outDir, 'skinfix_check.json'), JSON.stringify({
  joint: 'mixamorig:Spine2',
  // badge image quadrants (image left = -X, the character's right; image top = +Y)
  badge: [{ name: 'red', p: [BADGE.o[0] - q, BADGE.o[1] + q, BADGE.o[2]] }, { name: 'green', p: [BADGE.o[0] + q, BADGE.o[1] + q, BADGE.o[2]] }, { name: 'blue', p: [BADGE.o[0] - q, BADGE.o[1] - q, BADGE.o[2]] }, { name: 'yellow', p: [BADGE.o[0] + q, BADGE.o[1] - q, BADGE.o[2]] }],
  banner: cells, bannerHalf: BANNER.half, cellHalf: b / 2, tiles: chartList.length, grid: GRID,
  face: { jaw: FACE[0].name, eyelids: [FACE[3].name, FACE[4].name], mouth: [FACE[1].name, FACE[2].name] }
}, null, 1));
console.log('wrote', outDir);
