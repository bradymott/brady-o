/* ============================================================
   BRADY GOES TO BURNING MAN — skinned glTF characters (BurnsSkin)
   Real modelled characters with a Mixamo-compatible humanoid skeleton and glTF animation clips, drawn with GPU
   skinning (four weights a vertex) through the engine's own lighting: the weighted vertex shader feeds the SAME
   fragment shader as R.skin(), so shadows, fog, the sky probe, cloth folds and the face-row trick all match.
   See docs/BURNS_GUIDE.md §6.9.

   Pieces (all added here; the loader, GL layer and renderer files are untouched):
     BurnsGLTF.skins(doc) / clips(doc) / skinnedGeo(doc, opts)   loader extensions (skins, animations, the 32-byte format)
     BurnsClip, BurnsSkeleton, BurnsSkinnedChar                  sampling, node hierarchy -> joint palette, a character
     programs skinW + shSkinW (BurnsGL.addPrograms)              weighted skinning, main pass and the shadow caster
     BurnsRenderer.prototype.skinW(geo, palette, n, tint, face, rim)
     BurnsSkin                                                   asset registry, preload, the mannequin demo + debug hook

   Weighted vertex format (32 bytes):
     0 pos f32x3 | 12 normal i8x3 | 15 gloss u8 (0..3) | 16 colour u8x4 (a = emissive) | 20 uv u16x2
     24 joints u8x4 (palette slots) | 28 weights u8x4 (normalised, they sum to 255)
   Vertices are in bind space (metres, the mesh's own space); the palette (n joints × 3x4 rows, the engine's a34
   convention) carries the world placement, so one geometry serves every instance.
   ============================================================ */

/* ---------------- small matrix helpers (3x4 rows, like BurnsM.a34*) ---------------- */
const BurnsSkinM = {
  // rows from a glTF TRS (t[3], r[4] quaternion xyzw, s[3])
  fromTRS(o, k, t, kt, r, kr, s, ks) {
    const x = r[kr], y = r[kr + 1], z = r[kr + 2], w = r[kr + 3], xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
    const sx = s[ks], sy = s[ks + 1], sz = s[ks + 2];
    o[k] = (1 - 2 * (yy + zz)) * sx; o[k + 1] = 2 * (xy - wz) * sy; o[k + 2] = 2 * (xz + wy) * sz; o[k + 3] = t[kt];
    o[k + 4] = 2 * (xy + wz) * sx; o[k + 5] = (1 - 2 * (xx + zz)) * sy; o[k + 6] = 2 * (yz - wx) * sz; o[k + 7] = t[kt + 1];
    o[k + 8] = 2 * (xz - wy) * sx; o[k + 9] = 2 * (yz + wx) * sy; o[k + 10] = (1 - 2 * (xx + yy)) * sz; o[k + 11] = t[kt + 2];
  },
  // rows from a column-major 4x4 (glTF matrix; the bottom row is assumed 0 0 0 1)
  fromM4(o, k, m, km) {
    o[k] = m[km]; o[k + 1] = m[km + 4]; o[k + 2] = m[km + 8]; o[k + 3] = m[km + 12];
    o[k + 4] = m[km + 1]; o[k + 5] = m[km + 5]; o[k + 6] = m[km + 9]; o[k + 7] = m[km + 13];
    o[k + 8] = m[km + 2]; o[k + 9] = m[km + 6]; o[k + 10] = m[km + 10]; o[k + 11] = m[km + 14];
  },
  identity(o, k) { for (let i = 0; i < 12; i++) o[k + i] = 0; o[k] = o[k + 5] = o[k + 10] = 1; },
  // inverse of an affine 3x4
  invert(o, k, M, km) {
    const a = M[km], b = M[km + 1], c = M[km + 2], d = M[km + 4], e = M[km + 5], f = M[km + 6], g = M[km + 8], h = M[km + 9], i = M[km + 10];
    const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g, det = a * A + b * B + c * C || 1e-20, id = 1 / det;
    const r0 = A * id, r1 = (c * h - b * i) * id, r2 = (b * f - c * e) * id;
    const r3 = B * id, r4 = (a * i - c * g) * id, r5 = (c * d - a * f) * id;
    const r6 = C * id, r7 = (b * g - a * h) * id, r8 = (a * e - b * d) * id;
    const tx = M[km + 3], ty = M[km + 7], tz = M[km + 11];
    o[k] = r0; o[k + 1] = r1; o[k + 2] = r2; o[k + 3] = -(r0 * tx + r1 * ty + r2 * tz);
    o[k + 4] = r3; o[k + 5] = r4; o[k + 6] = r5; o[k + 7] = -(r3 * tx + r4 * ty + r5 * tz);
    o[k + 8] = r6; o[k + 9] = r7; o[k + 10] = r8; o[k + 11] = -(r6 * tx + r7 * ty + r8 * tz);
  }
};

/* ---------------- loader extensions ---------------- */
// skins: [{ joints: [nodeIdx…], inverseBind: Float32Array(16 * n) (column-major, as in the file), skeleton, names }]
BurnsGLTF.skins = function (D) {
  const J = D.json, nodes = J.nodes || [];
  return (J.skins || []).map(S => {
    const n = S.joints.length, ib = new Float32Array(16 * n);
    if (S.inverseBindMatrices !== undefined) ib.set(this.accessor(D, S.inverseBindMatrices).array.subarray(0, 16 * n));
    else for (let k = 0; k < n; k++) { ib[k * 16] = ib[k * 16 + 5] = ib[k * 16 + 10] = ib[k * 16 + 15] = 1; }
    return { joints: S.joints.slice(), inverseBind: ib, skeleton: S.skeleton, names: S.joints.map(i => (nodes[i] && nodes[i].name) || ('node' + i)), name: S.name || '' };
  });
};
// clips: { name: { duration, channels: [{ node, path, times: Float32Array, values: Float32Array, interp: 'LINEAR'|'STEP' }] } }
// Quantised outputs (normalised ints, as gltfpack writes rotations) become floats; CUBICSPLINE keeps its middle values
// and is sampled linearly.
BurnsGLTF.clips = function (D) {
  const J = D.json, out = {};
  (J.animations || []).forEach((A, ai) => {
    const name = A.name || ('clip' + ai), channels = []; let duration = 0;
    for (const ch of A.channels || []) {
      const S = A.samplers[ch.sampler], T = ch.target; if (!S || !T || T.node === undefined) continue;
      if (T.path !== 'translation' && T.path !== 'rotation' && T.path !== 'scale') continue;
      const inA = this.accessor(D, S.input), outA = this.accessor(D, S.output), n = inA.count, nc = T.path === 'rotation' ? 4 : 3;
      const times = inA.ctype === 5126 ? new Float32Array(inA.array.subarray(0, n)) : Float32Array.from({ length: n }, (_, k) => this.comp(inA, k, 0));
      const cubic = S.interpolation === 'CUBICSPLINE', values = new Float32Array(n * nc);
      for (let k = 0; k < n; k++) for (let c = 0; c < nc; c++) values[k * nc + c] = this.comp(outA, cubic ? k * 3 + 1 : k, c);
      if (n) duration = Math.max(duration, times[n - 1]);
      channels.push({ node: T.node, path: T.path, times, values, interp: S.interpolation === 'STEP' ? 'STEP' : 'LINEAR', nc });
    }
    out[name] = { name, duration, channels };
  });
  return out;
};
// the skinned mesh(es) of one skin as weighted 32-byte geometry; returns { geo, nb, skin, inverseBind (3x4 rows, mesh
// space -> joint space, with any mesh-node transform folded in), meshNodes, tris, nv }
// opts: { skin: index (default: the first skinned node's), uv: keep the glTF UVs (a future textured path), maxJoints }
BurnsGLTF.skinnedGeo = function (D, opts) {
  opts = opts || {};
  const J = D.json, nodes = J.nodes || [], skins = this.skins(D);
  if (!skins.length) throw new Error('BurnsGLTF: the file has no skins');
  let si = opts.skin;
  if (si === undefined) { const first = nodes.findIndex(N => N.mesh !== undefined && N.skin !== undefined); si = first >= 0 ? nodes[first].skin : 0; }
  const skin = skins[si]; if (!skin) throw new Error('BurnsGLTF: no skin ' + si);
  const nb = skin.joints.length, maxJ = opts.maxJoints || 64;
  if (nb > maxJ) throw new Error('BurnsGLTF: the skin has ' + nb + ' joints; the engine palette holds ' + maxJ + ' (drop finger/end bones or split the mesh by primitive)');
  const prims = []; let nvTotal = 0, niTotal = 0; const meshNodes = [];
  nodes.forEach((N, ni) => {
    if (N.mesh === undefined || N.skin !== si) return;
    meshNodes.push(ni);
    for (const pr of J.meshes[N.mesh].primitives || []) {
      if (pr.mode !== undefined && pr.mode !== 4) continue;
      if (pr.attributes.POSITION === undefined || pr.attributes.JOINTS_0 === undefined) continue;
      const nv = this.accessor(D, pr.attributes.POSITION).count, ni2 = pr.indices !== undefined ? this.accessor(D, pr.indices).count : nv;
      prims.push({ node: ni, pr, nv, ni: ni2 }); nvTotal += nv; niTotal += ni2;
    }
  });
  if (!prims.length) throw new Error('BurnsGLTF: skin ' + si + ' has no skinned triangle primitives');
  if (nvTotal > 65535) throw new Error('BurnsGLTF: too many vertices (' + nvTotal + ' > 65535): split the model or lower its detail');
  // the mesh node's transform (gltfpack parks its dequantisation there and folds it into the inverse bind matrices):
  // we bake it into the vertices and multiply the IBMs by its inverse, so bind space is always metres
  const Wn = this.nodeWorld(D, meshNodes[0]), N34 = new Float32Array(12), Ninv = new Float32Array(12);
  BurnsSkinM.fromM4(N34, 0, Wn, 0); BurnsSkinM.invert(Ninv, 0, N34, 0);
  const ib = new Float32Array(nb * 12), tmp = new Float32Array(12);
  for (let k = 0; k < nb; k++) { BurnsSkinM.fromM4(tmp, 0, skin.inverseBind, k * 16); BurnsM.a34Mul(ib, k * 12, tmp, 0, Ninv, 0); }
  const buf = new ArrayBuffer(nvTotal * 32), f = new Float32Array(buf), i8 = new Int8Array(buf), u8 = new Uint8Array(buf), u16 = new Uint16Array(buf);
  const idx = new Uint16Array(niTotal);
  const wr = BURNS_ATLAS.white, uu = Math.round((wr.u0 + wr.u1) * 0.5 * 65535), vv = Math.round((wr.v0 + wr.v1) * 0.5 * 65535);
  let v0 = 0, i0 = 0;
  const wtmp = [0, 0, 0, 0], jtmp = [0, 0, 0, 0];
  for (const P of prims) {
    const W = this.nodeWorld(D, P.node), NM = this.normalMat(W), nm = NM.n, flip = NM.det < 0;
    const A = P.pr.attributes, pos = this.accessor(D, A.POSITION), nrm = A.NORMAL !== undefined ? this.accessor(D, A.NORMAL) : null;
    const colA = A.COLOR_0 !== undefined ? this.accessor(D, A.COLOR_0) : null, uvA = opts.uv && A.TEXCOORD_0 !== undefined ? this.accessor(D, A.TEXCOORD_0) : null;
    const jA = this.accessor(D, A.JOINTS_0), wA = A.WEIGHTS_0 !== undefined ? this.accessor(D, A.WEIGHTS_0) : null;
    const mat = this.material(D, P.pr.material), mc = mat.col, ea = Math.round(mat.e * 255), gl8 = mat.gloss & 3;
    for (let k = 0; k < P.nv; k++) {
      const x = pos.array[k * 3], y = pos.array[k * 3 + 1], z = pos.array[k * 3 + 2];
      const i = v0 + k, o = i * 32;
      f[i * 8] = W[0] * x + W[4] * y + W[8] * z + W[12]; f[i * 8 + 1] = W[1] * x + W[5] * y + W[9] * z + W[13]; f[i * 8 + 2] = W[2] * x + W[6] * y + W[10] * z + W[14];
      let nx = 0, ny = 1, nz = 0;
      if (nrm) {
        const a = nrm.array[k * 3], c = nrm.array[k * 3 + 1], d = nrm.array[k * 3 + 2];
        nx = nm[0] * a + nm[1] * c + nm[2] * d; ny = nm[3] * a + nm[4] * c + nm[5] * d; nz = nm[6] * a + nm[7] * c + nm[8] * d;
        const l = (Math.hypot(nx, ny, nz) || 1) * (flip ? -1 : 1); nx /= l; ny /= l; nz /= l;
      }
      i8[o + 12] = Math.round(nx * 127); i8[o + 13] = Math.round(ny * 127); i8[o + 14] = Math.round(nz * 127);
      u8[o + 15] = gl8;
      let r = mc[0], g = mc[1], bl = mc[2];
      if (colA) { r *= this.comp(colA, k, 0); g *= this.comp(colA, k, 1); bl *= this.comp(colA, k, 2); }
      u8[o + 16] = this.srgb8(r); u8[o + 17] = this.srgb8(g); u8[o + 18] = this.srgb8(bl); u8[o + 19] = ea;
      if (uvA) { u16[i * 16 + 10] = Math.round(clamp(this.comp(uvA, k, 0), 0, 1) * 65535); u16[i * 16 + 11] = Math.round(clamp(this.comp(uvA, k, 1), 0, 1) * 65535); }
      else { u16[i * 16 + 10] = uu; u16[i * 16 + 11] = vv; }
      // joints + weights: normalised to sum 255 exactly (the biggest weight takes the rounding), unused slots on joint 0
      let sum = 0;
      for (let c = 0; c < 4; c++) { jtmp[c] = jA.array[k * jA.n + c] | 0; wtmp[c] = wA ? Math.max(0, this.comp(wA, k, c)) : (c === 0 ? 1 : 0); if (jtmp[c] >= nb) { jtmp[c] = 0; wtmp[c] = 0; } sum += wtmp[c]; }
      if (sum <= 0) { wtmp[0] = 1; sum = 1; }
      let big = 0, acc = 0;
      for (let c = 0; c < 4; c++) { const b = Math.round(wtmp[c] / sum * 255); u8[o + 28 + c] = b; acc += b; if (wtmp[c] > wtmp[big]) big = c; u8[o + 24 + c] = u8[o + 28 + c] ? jtmp[c] : 0; }
      u8[o + 28 + big] = clamp(u8[o + 28 + big] + 255 - acc, 0, 255);
      if (!u8[o + 28 + big]) u8[o + 24 + big] = 0;
    }
    const ind = P.pr.indices !== undefined ? this.accessor(D, P.pr.indices).array : null;
    for (let k = 0; k + 2 < P.ni; k += 3) {
      const a = ind ? ind[k] : k, c = ind ? ind[k + 1] : k + 1, d = ind ? ind[k + 2] : k + 2;
      idx[i0 + k] = v0 + a; idx[i0 + k + 1] = v0 + (flip ? d : c); idx[i0 + k + 2] = v0 + (flip ? c : d);
    }
    v0 += P.nv; i0 += P.ni;
  }
  const geo = { data: buf, idx, count: niTotal, nv: nvTotal, stride: 32, weighted: true, bounds: null, vbo: null, ibo: null, gen: -1 };
  return { geo, nb, skin, inverseBind: ib, meshNodes, tris: niTotal / 3, nv: nvTotal };
};

/* ---------------- animation ---------------- */
// one clip: samples node TRS into a skeleton's local arrays. No allocations per frame.
class BurnsClip {
  constructor(def, nodeIndexOf) {
    this.name = def.name; this.duration = def.duration || 0;
    // channels resolved to skeleton slots; nodes the skeleton doesn't have are skipped
    this.ch = [];
    for (const c of def.channels) { const slot = nodeIndexOf(c.node); if (slot < 0) continue; this.ch.push({ slot, path: c.path === 'translation' ? 0 : c.path === 'rotation' ? 1 : 2, times: c.times, values: c.values, step: c.interp === 'STEP', nc: c.nc, n: c.times.length }); }
  }
  // write the pose at time t (seconds, already wrapped) into L (Float32Array nodes * 10: t3 r4 s3)
  sample(t, L) {
    for (const c of this.ch) {
      const T = c.times, n = c.n; if (!n) continue;
      const V = c.values, nc = c.nc, base = c.slot * 10 + (c.path === 0 ? 0 : c.path === 1 ? 3 : 7);
      if (n === 1 || t <= T[0]) { for (let k = 0; k < nc; k++) L[base + k] = V[k]; continue; }
      if (t >= T[n - 1]) { const o = (n - 1) * nc; for (let k = 0; k < nc; k++) L[base + k] = V[o + k]; continue; }
      let lo = 0, hi = n - 1;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (T[mid] <= t) lo = mid; else hi = mid; }
      const o0 = lo * nc, o1 = hi * nc;
      if (c.step) { for (let k = 0; k < nc; k++) L[base + k] = V[o0 + k]; continue; }
      const u = (t - T[lo]) / (T[hi] - T[lo] || 1);
      if (nc === 4) {
        let x0 = V[o0], y0 = V[o0 + 1], z0 = V[o0 + 2], w0 = V[o0 + 3], x1 = V[o1], y1 = V[o1 + 1], z1 = V[o1 + 2], w1 = V[o1 + 3];
        if (x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1 < 0) { x1 = -x1; y1 = -y1; z1 = -z1; w1 = -w1; }
        let x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u, z = z0 + (z1 - z0) * u, w = w0 + (w1 - w0) * u;
        const l = Math.hypot(x, y, z, w) || 1; L[base] = x / l; L[base + 1] = y / l; L[base + 2] = z / l; L[base + 3] = w / l;
      } else for (let k = 0; k < nc; k++) L[base + k] = V[o0 + k] + (V[o1 + k] - V[o0 + k]) * u;
    }
  }
}
// the node hierarchy of a skinned asset: local TRS -> world 3x4 rows (parents first) -> palette = world · inverseBind
class BurnsSkeleton {
  constructor(asset) {
    this.asset = asset; const n = asset.nodes.length;
    this.rest = asset.rest; this.local = new Float32Array(this.rest); this.localB = new Float32Array(n * 10);
    this.world = new Float32Array(n * 12); this.palette = new Float32Array(asset.nb * 12);
    this._l = new Float32Array(12); this.root = new Float32Array(12); BurnsSkinM.identity(this.root, 0);
  }
  // world matrices from this.local under the root placement, then the joint palette
  compute() {
    const A = this.asset, order = A.order, parent = A.parent, L = this.local, W = this.world, l = this._l, root = this.root;
    for (let q = 0; q < order.length; q++) {
      const i = order[q];
      BurnsSkinM.fromTRS(l, 0, L, i * 10, L, i * 10 + 3, L, i * 10 + 7);
      const p = parent[i];
      if (p < 0) BurnsM.a34Mul(W, i * 12, root, 0, l, 0); else BurnsM.a34Mul(W, i * 12, W, p * 12, l, 0);
    }
    const J = A.jointSlots, IB = A.inverseBind, P = this.palette;
    for (let k = 0; k < A.nb; k++) BurnsM.a34Mul(P, k * 12, W, J[k] * 12, IB, k * 12);
    return P;
  }
}
// a character: an asset placed in the world, playing clips with crossfades. API in the spirit of BurnsChar.
class BurnsSkinnedChar {
  constructor(asset) {
    this.asset = asset; this.nb = asset.nb; this.bounds = asset.bounds; this.height = asset.height;
    this.x = 0; this.y = 0; this.z = 0; this.yaw = 0; this.scale = 1;
    this.sk = new BurnsSkeleton(asset); this.palette = this.sk.palette;
    this.anim = null; this.animT = 0; this.speed = 1; this.loop = true; this.ended = false;
    this.prev = null; this.prevT = 0; this.prevSpeed = 1; this.prevLoop = true; this.fade = 1; this.fadeDur = 0.2;
    this.tint = null; this.face = 0; this.rim = 0.35; this.visible = true; this.computed = false;
  }
  get clips() { return this.asset.clips; }
  has(name) { return !!this.asset.clips[name]; }
  // play(name, { loop: true, fade: 0.2, speed: 1, restart: false, time: 0 })
  play(name, o) {
    o = o || {};
    const clip = this.asset.clips[name];
    if (!clip) { console.warn('BurnsSkin: no clip "' + name + '" in ' + this.asset.name + ' (' + Object.keys(this.asset.clips).join(', ') + ')'); return this; }
    if (o.speed !== undefined) this.speed = o.speed;
    if (o.loop !== undefined) this.loop = o.loop;
    if (clip === this.anim && !o.restart) return this;
    if (this.anim) { this.prev = this.anim; this.prevT = this.animT; this.prevSpeed = this.speed; this.prevLoop = this.loop; this.fadeDur = o.fade === undefined ? 0.2 : o.fade; this.fade = this.fadeDur > 0 ? 0 : 1; }
    else this.fade = 1;
    this.anim = clip; this.animT = o.time || 0; this.ended = false;
    if (o.loop === undefined) this.loop = true;
    return this;
  }
  _wrap(clip, t, loop) {
    const d = clip.duration; if (d <= 0) return 0;
    if (loop) { t %= d; if (t < 0) t += d; return t; }
    return t < 0 ? 0 : t > d ? d : t;
  }
  update(dt) {
    if (!this.anim) return;
    this.animT += dt * this.speed;
    if (!this.loop && this.animT >= this.anim.duration) this.ended = true;
    if (this.fade < 1) { this.prevT += dt * this.prevSpeed; this.fade = Math.min(1, this.fade + dt / this.fadeDur); if (this.fade >= 1) this.prev = null; }
  }
  // the joint palette (Float32Array nb * 12) for R.skinW
  compute() {
    const sk = this.sk, L = sk.local;
    BurnsM.a34Set(sk.root, 0, this.x, this.y, this.z, this.yaw, 0, 0, this.scale, this.scale, this.scale);
    L.set(sk.rest);
    if (this.anim) this.anim.sample(this._wrap(this.anim, this.animT, this.loop), L);
    if (this.prev && this.fade < 1) {
      const B = sk.localB; B.set(sk.rest); this.prev.sample(this._wrap(this.prev, this.prevT, this.prevLoop), B);
      const w = this.fade * this.fade * (3 - 2 * this.fade), n = L.length / 10;
      for (let i = 0; i < n; i++) {
        const o = i * 10;
        for (let k = 0; k < 3; k++) { L[o + k] = B[o + k] + (L[o + k] - B[o + k]) * w; L[o + 7 + k] = B[o + 7 + k] + (L[o + 7 + k] - B[o + 7 + k]) * w; }
        let x0 = B[o + 3], y0 = B[o + 4], z0 = B[o + 5], w0 = B[o + 6], x1 = L[o + 3], y1 = L[o + 4], z1 = L[o + 5], w1 = L[o + 6];
        if (x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1 < 0) { x0 = -x0; y0 = -y0; z0 = -z0; w0 = -w0; }
        const x = x0 + (x1 - x0) * w, y = y0 + (y1 - y0) * w, z = z0 + (z1 - z0) * w, ww = w0 + (w1 - w0) * w, l = Math.hypot(x, y, z, ww) || 1;
        L[o + 3] = x / l; L[o + 4] = y / l; L[o + 5] = z / l; L[o + 6] = ww / l;
      }
    }
    sk.compute(); this.computed = true;
    return this.palette;
  }
  // world position of a point in a joint's frame (joint name such as 'mixamorig:Head', or a palette slot), after compute()
  jointPoint(j, x, y, z, out) {
    const A = this.asset, k = typeof j === 'number' ? j : A.jointOf[j]; out = out || [0, 0, 0];
    if (k === undefined || k < 0) { out[0] = this.x; out[1] = this.y; out[2] = this.z; return out; }
    return BurnsM.a34Pt(this.sk.world, A.jointSlots[k] * 12, x, y, z, out);
  }
  headPos(out) { return this.jointPoint(this.asset.jointOf['mixamorig:Head'] !== undefined ? 'mixamorig:Head' : 0, 0, 0.1, 0, out); }
}

/* ---------------- rendering: the weighted programs and R.skinW ---------------- */
const BURNS_SKINW_ATTRIBS = ['aPos', 'aNrm', 'aGloss', 'aCol', 'aUV', 'aJ', 'aW'];
const BURNS_GLSL_SKINW_BLEND = `
  ivec4 j = ivec4(aJ + 0.5) * 3;
  vec4 r0 = uB[j.x] * aW.x + uB[j.y] * aW.y + uB[j.z] * aW.z + uB[j.w] * aW.w;
  vec4 r1 = uB[j.x + 1] * aW.x + uB[j.y + 1] * aW.y + uB[j.z + 1] * aW.z + uB[j.w + 1] * aW.w;
  vec4 r2 = uB[j.x + 2] * aW.x + uB[j.y + 2] * aW.y + uB[j.z + 2] * aW.z + uB[j.w + 2] * aW.w;
  vec4 p = vec4(aPos, 1.0);`;
BurnsGL.addPrograms(function (G, progs) {
  const gl = G.gl, MB = G.maxBones;
  const vs = `#define MAXB ${MB}
attribute vec3 aPos; attribute vec3 aNrm; attribute float aGloss; attribute vec4 aCol; attribute vec2 aUV; attribute vec4 aJ; attribute vec4 aW;
uniform mat4 uVP; uniform vec4 uB[MAXB * 3]; uniform vec3 uFace;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec2 vT; varying float vG; varying vec3 vL;
void main(){
  vL = aPos;
  vG = aGloss / 3.0;${BURNS_GLSL_SKINW_BLEND}
  vW = vec3(dot(r0, p), dot(r1, p), dot(r2, p));
  vN = vec3(dot(r0.xyz, aNrm), dot(r1.xyz, aNrm), dot(r2.xyz, aNrm));
  vC = aCol; vT = aUV;
  if (aUV.y >= uFace.x && aUV.y < uFace.y) vT.y += uFace.z;
  gl_Position = uVP * vec4(vW, 1.0);
}`;
  // the fragment shader is the engine's own skin fragment shader object (shared, so the look can never drift)
  const skinP = progs.skin && progs.skin.p, attached = skinP ? gl.getAttachedShaders(skinP) : null;
  const fs = attached && attached.find(s => gl.getShaderParameter(s, gl.SHADER_TYPE) === gl.FRAGMENT_SHADER);
  if (!fs) throw new Error('BurnsSkin: the skin fragment shader is not available');
  const link = (vsSrc, fsShader, attribs) => {
    const s = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(s, G.header('vs') + vsSrc); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error('BurnsSkin shader: ' + gl.getShaderInfoLog(s));
    const p = gl.createProgram(); gl.attachShader(p, s); gl.attachShader(p, fsShader);
    attribs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error('BurnsSkin link: ' + gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) || 0;
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  };
  if (progs.skinW && progs.skinW.p) { try { gl.deleteProgram(progs.skinW.p); } catch (e) { /* ignore */ } }
  if (progs.shSkinW && progs.shSkinW.p) { try { gl.deleteProgram(progs.shSkinW.p); } catch (e) { /* ignore */ } }
  progs.skinW = link(vs, fs, BURNS_SKINW_ATTRIBS);
  progs.shSkinW = null;
  if (progs.shSkin) {
    progs.shSkinW = G.program(`#define MAXB ${MB}
attribute vec3 aPos; attribute vec4 aJ; attribute vec4 aW; uniform mat4 uLVP; uniform vec4 uB[MAXB * 3];
void main(){${BURNS_GLSL_SKINW_BLEND}
  gl_Position = uLVP * vec4(dot(r0, p), dot(r1, p), dot(r2, p), 1.0);
}`, `precision mediump float; void main(){ gl_FragColor = vec4(1.0); }`, BURNS_SKINW_ATTRIBS);
  }
});
BurnsGL.layoutSkinW = function () { // the 32-byte weighted vertex
  const gl = this.gl;
  this.enable(7);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
  gl.vertexAttribPointer(1, 3, gl.BYTE, true, 32, 12);
  gl.vertexAttribPointer(2, 1, gl.UNSIGNED_BYTE, false, 32, 15);
  gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 32, 16);
  gl.vertexAttribPointer(4, 2, gl.UNSIGNED_SHORT, true, 32, 20);
  gl.vertexAttribPointer(5, 4, gl.UNSIGNED_BYTE, false, 32, 24);
  gl.vertexAttribPointer(6, 4, gl.UNSIGNED_BYTE, true, 32, 28);
};
// skinBegin() also remembers the pass's env/world/atlas, so skinW can set its own program up lazily in either pass
(function () {
  const P = BurnsRenderer.prototype, base = P.skinBegin;
  if (base.__burnsSkinW) return;
  P.skinBegin = function (env, world, atlasT) { base.call(this, env, world, atlasT); this._wEnv = env; this._wWorld = world; this._wAtlas = atlasT; this._wSet = false; };
  P.skinBegin.__burnsSkinW = true;
})();
// geo: weighted geometry (BurnsGLTF.skinnedGeo); palette: Float32Array (n * 12); tint [r,g,b,a]; face row 0..3; rim
// Works after R.skinBegin() in the main pass and inside shadowBegin()/shadowEnd(); leaves the rigid skin program bound.
BurnsRenderer.prototype.skinW = function (geo, palette, n, tint, face, rim) {
  const gl = BurnsGL.gl, P = BurnsGL.progs; if (!gl || !P || !geo) return;
  if (n > BurnsGL.maxBones) { if (!this._wWarned) { this._wWarned = true; console.warn('BurnsSkin: ' + n + ' joints exceed the palette (' + BurnsGL.maxBones + ')'); } return; }
  BurnsGL.geo(geo);
  const bones = n * 12 === palette.length ? palette : palette.subarray(0, n * 12);
  if (this.pass === 'shadow') {
    const p = P.shSkinW; if (!p) return;
    gl.useProgram(p.p);
    if (!this._wSet) { gl.uniformMatrix4fv(p.u.uLVP, false, this.LVP); this._wSet = true; }
    gl.uniform4fv(p.u.uB, bones);
    gl.bindBuffer(gl.ARRAY_BUFFER, geo.vbo); BurnsGL.layoutSkinW();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geo.ibo);
    gl.drawElements(gl.TRIANGLES, geo.count, gl.UNSIGNED_SHORT, 0);
    this.stats.shDraws++; this.shadowStats += geo.count / 3;
    BurnsGL.enable(5);
    if (P.shSkin) gl.useProgram(P.shSkin.p);
    return;
  }
  const p = P.skinW; if (!p) return;
  gl.useProgram(p.p);
  if (!this._wSet) {
    const env = this._wEnv || this.envRef; if (!env) return;
    this.applyEnv(p, env, this._wWorld);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, BurnsGL.tex(this._wAtlas || BURNS_ATLAS.T)); gl.uniform1i(p.u.uTex, 0);
    gl.uniform3fv(p.u.uRimC, this.lin.rim);
    this._wSet = true;
  }
  const u = p.u;
  gl.uniform4fv(u.uB, bones);
  if (tint) gl.uniform4f(u.uTint, tint[0], tint[1], tint[2], tint[3]); else gl.uniform4f(u.uTint, 0, 0, 0, 0);
  gl.uniform3f(u.uFace, BURNS_ATLAS.faceV0, BURNS_ATLAS.faceV1, (face || 0) * BURNS_ATLAS.faceRowV);
  gl.uniform1f(u.uRim, (rim === undefined ? 0.35 : rim) * 0.6);
  gl.bindBuffer(gl.ARRAY_BUFFER, geo.vbo); BurnsGL.layoutSkinW();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geo.ibo);
  gl.drawElements(gl.TRIANGLES, geo.count, gl.UNSIGNED_SHORT, 0);
  this.stats.draws++; this.stats.tris += geo.count / 3;
  BurnsGL.enable(5);
  if (P.skin) gl.useProgram(P.skin.p);
};

/* ---------------- assets, preload, the demo ---------------- */
const BurnsSkin = {
  assets: {}, loading: {}, chars: [],
  // parse a doc into an asset: { name, geo, nb, nodes, parent, order, rest, jointSlots, jointOf, inverseBind, clips, bounds, height, tris, nv, extras }
  load(D, opts) {
    opts = opts || {};
    const S = BurnsGLTF.skinnedGeo(D, opts), J = D.json, nodes = J.nodes || [], n = nodes.length;
    const parent = new Int32Array(n).fill(-1);
    nodes.forEach((N, p) => (N.children || []).forEach(c => { parent[c] = p; }));
    // parents before children
    const order = [], seen = new Uint8Array(n);
    const roots = []; for (let i = 0; i < n; i++) if (parent[i] < 0) roots.push(i);
    const stack = roots.slice();
    while (stack.length) { const i = stack.shift(); if (seen[i]) continue; seen[i] = 1; order.push(i); for (const c of nodes[i].children || []) stack.push(c); }
    for (let i = 0; i < n; i++) if (!seen[i]) { seen[i] = 1; order.push(i); }
    const rest = new Float32Array(n * 10);
    for (let i = 0; i < n; i++) {
      const N = nodes[i], o = i * 10;
      if (N.matrix) {   // decompose a matrix node: translation + the 3x3 as a quaternion (uniform-scale assumed)
        const m = N.matrix, sx = Math.hypot(m[0], m[1], m[2]) || 1, sy = Math.hypot(m[4], m[5], m[6]) || 1, sz = Math.hypot(m[8], m[9], m[10]) || 1;
        const r00 = m[0] / sx, r01 = m[4] / sy, r02 = m[8] / sz, r10 = m[1] / sx, r11 = m[5] / sy, r12 = m[9] / sz, r20 = m[2] / sx, r21 = m[6] / sy, r22 = m[10] / sz;
        const tr = r00 + r11 + r22; let qx, qy, qz, qw;
        if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; qw = s / 4; qx = (r21 - r12) / s; qy = (r02 - r20) / s; qz = (r10 - r01) / s; }
        else if (r00 > r11 && r00 > r22) { const s = Math.sqrt(1 + r00 - r11 - r22) * 2; qw = (r21 - r12) / s; qx = s / 4; qy = (r01 + r10) / s; qz = (r02 + r20) / s; }
        else if (r11 > r22) { const s = Math.sqrt(1 + r11 - r00 - r22) * 2; qw = (r02 - r20) / s; qx = (r01 + r10) / s; qy = s / 4; qz = (r12 + r21) / s; }
        else { const s = Math.sqrt(1 + r22 - r00 - r11) * 2; qw = (r10 - r01) / s; qx = (r02 + r20) / s; qy = (r12 + r21) / s; qz = s / 4; }
        rest[o] = m[12]; rest[o + 1] = m[13]; rest[o + 2] = m[14]; rest[o + 3] = qx; rest[o + 4] = qy; rest[o + 5] = qz; rest[o + 6] = qw; rest[o + 7] = sx; rest[o + 8] = sy; rest[o + 9] = sz;
      } else {
        const t = N.translation || [0, 0, 0], r = N.rotation || [0, 0, 0, 1], s = N.scale || [1, 1, 1];
        rest[o] = t[0]; rest[o + 1] = t[1]; rest[o + 2] = t[2]; rest[o + 3] = r[0]; rest[o + 4] = r[1]; rest[o + 5] = r[2]; rest[o + 6] = r[3]; rest[o + 7] = s[0]; rest[o + 8] = s[1]; rest[o + 9] = s[2];
      }
    }
    const jointSlots = Int32Array.from(S.skin.joints), jointOf = {};
    S.skin.names.forEach((nm, k) => { jointOf[nm] = k; });
    const nodeIndexOf = i => (i >= 0 && i < n ? i : -1);
    const asset = { name: opts.name || (J.asset && J.asset.extras && J.asset.extras.name) || 'skinned', geo: S.geo, nb: S.nb, nodes: nodes.map(N => ({ name: N.name || '' })), parent, order, rest, jointSlots, jointOf, jointNames: S.skin.names, inverseBind: S.inverseBind, clips: {}, clipNames: [], tris: S.tris, nv: S.nv, extras: Object.assign({}, D.sceneExtras || {}, (nodes[S.meshNodes[0]] && nodes[S.meshNodes[0]].extras) || {}) };
    const clipDefs = BurnsGLTF.clips(D);
    for (const nm in clipDefs) { asset.clips[nm] = new BurnsClip(clipDefs[nm], nodeIndexOf); asset.clipNames.push(nm); }
    // bounds: the rest pose skinned on the CPU (bind-space vertices through the rest palette)
    const sk = new BurnsSkeleton(asset); sk.compute();
    const P = sk.palette, f = new Float32Array(S.geo.data), u8 = new Uint8Array(S.geo.data), bmin = [Infinity, Infinity, Infinity], bmax = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < S.nv; i++) {
      const x = f[i * 8], y = f[i * 8 + 1], z = f[i * 8 + 2], o = i * 32; let wx = 0, wy = 0, wz = 0;
      for (let c = 0; c < 4; c++) {
        const w = u8[o + 28 + c] / 255; if (!w) continue; const k = u8[o + 24 + c] * 12;
        wx += w * (P[k] * x + P[k + 1] * y + P[k + 2] * z + P[k + 3]); wy += w * (P[k + 4] * x + P[k + 5] * y + P[k + 6] * z + P[k + 7]); wz += w * (P[k + 8] * x + P[k + 9] * y + P[k + 10] * z + P[k + 11]);
      }
      if (wx < bmin[0]) bmin[0] = wx; if (wy < bmin[1]) bmin[1] = wy; if (wz < bmin[2]) bmin[2] = wz;
      if (wx > bmax[0]) bmax[0] = wx; if (wy > bmax[1]) bmax[1] = wy; if (wz > bmax[2]) bmax[2] = wz;
    }
    asset.bounds = S.geo.bounds = [bmin[0], bmin[1], bmin[2], bmax[0], bmax[1], bmax[2]]; asset.height = bmax[1] - bmin[1];
    this.assets[asset.name] = asset;
    return asset;
  },
  // fetch + parse (the build ships models/<name>.glb.gz; BurnsGLTF.fetch inflates it); cached by name
  preload(url, name) {
    name = name || url.replace(/^.*\//, '').replace(/\.glb(\.gz)?$/i, '');
    if (this.assets[name]) return Promise.resolve(this.assets[name]);
    if (this.loading[name]) return this.loading[name];
    return (this.loading[name] = BurnsGLTF.fetch(url).then(D => { const a = this.load(D, { name }); delete this.loading[name]; return a; }, e => { delete this.loading[name]; throw e; }));
  },
  get(name) { return this.assets[name] || null; },
  // a character of a loaded asset, registered for drawing in the running play scene (or any scene with a def)
  spawn(name, x, y, z, yaw) {
    const A = this.assets[name]; if (!A) throw new Error('BurnsSkin: asset "' + name + '" is not loaded');
    const ch = new BurnsSkinnedChar(A); ch.x = x || 0; ch.y = y || 0; ch.z = z || 0; ch.yaw = yaw || 0;
    if (A.clipNames.length) ch.play(A.clips.idle ? 'idle' : A.clipNames[0]);
    const g = this.scene(); if (g) { this.attach(g); ch.scene = g; }
    this.chars.push(ch);
    return ch;
  },
  remove(ch) { const i = this.chars.indexOf(ch); if (i >= 0) this.chars.splice(i, 1); },
  clear() { this.chars.length = 0; },
  scene() { const B = typeof window !== 'undefined' && window.BRADY, s = B && B.Game && B.Game.scene; return s && s.def && s.world && s.player ? s : null; },
  // hook the world def's drawSkinned / drawShadows (docs §9.1) so the characters draw and cast in both passes
  attach(g) {
    const def = g.def; if (!def || def.__burnsSkinHooked) return;
    const ds = def.drawSkinned, dsh = def.drawShadows, self = this;
    def.drawSkinned = function (g2, R) { if (ds) ds.call(this, g2, R); self.draw(g2, R); };
    def.drawShadows = function (g2, R) { if (dsh) dsh.call(this, g2, R); self.draw(g2, R); };
    def.__burnsSkinHooked = true;
  },
  // called from the hooks: steps the characters once per frame (on the first pass that sees a new scene time), draws all
  draw(g, R) {
    if (!this.chars.length) return;
    const t = g.time || 0;
    if (g !== this._g) { this._g = g; this._t = t; }
    const dt = Math.max(0, Math.min(2, t - this._t)); this._t = t;
    for (const ch of this.chars) {
      if (ch.scene && ch.scene !== g) continue;
      if (dt > 0 || !ch.computed) { if (ch.drive) ch.drive(dt, g); ch.update(dt); ch.compute(); }
      if (!ch.visible) continue;
      if (R.pass === 'shadow') { if (R.shadowNear && !R.shadowNear(ch.x, ch.y, ch.z, 2)) continue; R.skinW(ch.asset.geo, ch.palette, ch.nb, null, 0, 0); }
      else R.skinW(ch.asset.geo, ch.palette, ch.nb, ch.tint, ch.face, ch.rim);
    }
  },
  /* the demo: n mannequins near Brady in whatever world is running: walkers circling, idlers, wavers.
     Returns a promise of the characters. window.BRADY_BURNS.debug.mannequin(n) is the same call. */
  mannequin(n, url) {
    n = n || 6;
    return this.preload(url || 'models/mannequin.glb.gz', 'mannequin').then(A => {
      const g = this.scene(); if (!g) throw new Error('BurnsSkin: no play scene is running');
      const p = g.player, cam = g.cam || { x: p.x, z: p.z - 1, tx: p.x, tz: p.z };
      let fx = cam.tx - cam.x, fz = cam.tz - cam.z; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
      const cx = p.x + fx * 5.5, cz = p.z + fz * 5.5, out = [];
      for (const ch of this.chars.slice()) if (ch.demo) this.remove(ch);
      for (let i = 0; i < n; i++) {
        const mode = i % 3, a = i / Math.max(n, 1) * Math.PI * 2, r = mode === 0 ? 2.6 : 1.2 + (i % 2) * 0.8;
        const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
        const ch = this.spawn('mannequin', x, g.world.height(x, z), z, Math.atan2(p.x - x, p.z - z));
        ch.demo = true; ch.scene = g;
        if (mode === 0) {
          ch.play('walk', { loop: true, speed: 1 }); ch.ang = a; ch.r = r; ch.cx = cx; ch.cz = cz; ch.w = 1.1 / r;
          ch.drive = function (dt, g2) {
            this.ang += this.w * dt; const nx = this.cx + Math.cos(this.ang) * this.r, nz = this.cz + Math.sin(this.ang) * this.r;
            this.yaw = Math.atan2(-Math.sin(this.ang), Math.cos(this.ang)); this.x = nx; this.z = nz; this.y = g2.world.height(nx, nz);
          };
        } else if (mode === 1) ch.play('idle', { loop: true, time: Math.random() * 3 });
        else ch.play('wave', { loop: true, time: Math.random() * 2 });
        out.push(ch);
      }
      return out;
    });
  },
  stats() { return { chars: this.chars.length, assets: Object.keys(this.assets).map(k => ({ name: k, nb: this.assets[k].nb, tris: this.assets[k].tris, nv: this.assets[k].nv, clips: this.assets[k].clipNames.slice(), height: +this.assets[k].height.toFixed(3) })) }; }
};
if (typeof window !== 'undefined') {
  window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsSkin, BurnsSkinnedChar, BurnsSkeleton, BurnsClip });
  // the debug API is assembled by a later module (40_burns_j_ui.js); add our entries once every module has loaded
  setTimeout(() => { const B = window.BRADY_BURNS; if (B && B.debug) { B.debug.mannequin = (n, url) => BurnsSkin.mannequin(n, url); B.debug.skin = () => BurnsSkin.stats(); } }, 0);
}
