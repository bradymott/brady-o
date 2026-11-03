/* ============================================================
   BRADY GOES TO BURNING MAN — glTF 2.0 (.glb) loader
   Converts Blender-made models into the engine's own 24-byte skinned vertex
   format, so they draw through R.skin() with the existing shaders: shadows,
   bloom on emissive, fog, point lights and sky reflections come for free.
   No per-model textures yet: materials become vertex colour + gloss + emissive
   (the "PBR-lite" the engine already has). See docs/BURNS_GUIDE.md §6.8.

   Rig convention: every ROOT node of the default scene is a bone (or, with no
   mesh in its subtree, an "empty": a named marker point). The node's world
   translation is the joint; its subtree's vertices are baked by their full
   world matrix and then the joint is subtracted, so each bone is authored
   around its own pivot (pose = parent · T(joint) · R · S, as the car rig does).
   ============================================================ */
const BurnsGLTF = {
  GLB_MAGIC: 0x46546C67,
  CTYPES: { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array },
  NCOMP: { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 },

  /* ---- parsing ---- */
  parse(ab) {
    const dv = new DataView(ab);
    if (ab.byteLength < 20 || dv.getUint32(0, true) !== this.GLB_MAGIC) throw new Error('BurnsGLTF: not a .glb file');
    const total = Math.min(dv.getUint32(8, true), ab.byteLength);
    let json = null, bin = null, p = 12;
    while (p + 8 <= total) {
      const len = dv.getUint32(p, true), type = dv.getUint32(p + 4, true); p += 8;
      if (type === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(new Uint8Array(ab, p, len)));
      else if (type === 0x004E4942 && !bin) bin = new Uint8Array(ab, p, len);
      p += len + ((4 - len % 4) % 4);
    }
    if (!json) throw new Error('BurnsGLTF: no JSON chunk');
    return this.doc(json, bin);
  },
  doc(json, bin) {
    const D = { json, bin, _acc: {}, _world: {} };
    const self = this;
    D.accessor = i => self.accessor(D, i);
    D.nodeWorld = i => self.nodeWorld(D, i);
    const scene = json.scenes && json.scenes[json.scene || 0];
    D.roots = scene && scene.nodes ? scene.nodes.slice() : (json.nodes || []).map((n, i) => i);
    D.sceneExtras = (scene && scene.extras) || {};
    return D;
  },
  // typed view of an accessor: { array (de-interleaved when strided), count, n, normalized }
  accessor(D, i) {
    if (D._acc[i]) return D._acc[i];
    const J = D.json, A = J.accessors[i], T = this.CTYPES[A.componentType], n = this.NCOMP[A.type] || 1, count = A.count;
    let array;
    if (A.bufferView === undefined) array = new T(count * n);
    else {
      const V = J.bufferViews[A.bufferView], base = (D.bin ? D.bin.byteOffset : 0) + (V.byteOffset || 0) + (A.byteOffset || 0), buf = D.bin.buffer;
      const stride = V.byteStride || 0, elem = T.BYTES_PER_ELEMENT * n;
      if (!stride || stride === elem) array = new T(buf, base, count * n);
      else {
        array = new T(count * n); const u8 = new Uint8Array(buf), out8 = new Uint8Array(array.buffer);
        for (let k = 0; k < count; k++) out8.set(u8.subarray(base + k * stride, base + k * stride + elem), k * elem);
      }
    }
    if (A.sparse) {
      const S = A.sparse, copy = new T(array); array = copy;
      const IV = J.bufferViews[S.indices.bufferView], VV = J.bufferViews[S.values.bufferView], buf = D.bin.buffer, off = D.bin.byteOffset;
      const IT = this.CTYPES[S.indices.componentType], idx = new IT(buf, off + (IV.byteOffset || 0) + (S.indices.byteOffset || 0), S.count);
      const vals = new T(buf, off + (VV.byteOffset || 0) + (S.values.byteOffset || 0), S.count * n);
      for (let k = 0; k < S.count; k++) for (let c = 0; c < n; c++) array[idx[k] * n + c] = vals[k * n + c];
    }
    return (D._acc[i] = { array, count, n, normalized: !!A.normalized, ctype: A.componentType });
  },
  // read component k of element e as a float 0..1 (normalized ints) or raw
  comp(acc, e, k) {
    const v = acc.array[e * acc.n + k];
    if (acc.ctype === 5126) return v;
    switch (acc.ctype) { case 5121: return v / 255; case 5123: return v / 65535; case 5120: return Math.max(v / 127, -1); case 5122: return Math.max(v / 32767, -1); default: return v; }
  },
  /* ---- mat4 (column-major, like glTF) ---- */
  m4Identity() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  m4Mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  },
  m4TRS(t, q, s) {
    const x = q[0], y = q[1], z = q[2], w = q[3], xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
    const m = new Float32Array(16);
    m[0] = (1 - 2 * (yy + zz)) * s[0]; m[1] = 2 * (xy + wz) * s[0]; m[2] = 2 * (xz - wy) * s[0];
    m[4] = 2 * (xy - wz) * s[1]; m[5] = (1 - 2 * (xx + zz)) * s[1]; m[6] = 2 * (yz + wx) * s[1];
    m[8] = 2 * (xz + wy) * s[2]; m[9] = 2 * (yz - wx) * s[2]; m[10] = (1 - 2 * (xx + yy)) * s[2];
    m[12] = t[0]; m[13] = t[1]; m[14] = t[2]; m[15] = 1;
    return m;
  },
  nodeLocal(N) {
    if (N.matrix) return new Float32Array(N.matrix);
    return this.m4TRS(N.translation || [0, 0, 0], N.rotation || [0, 0, 0, 1], N.scale || [1, 1, 1]);
  },
  nodeWorld(D, i) {
    if (D._world[i]) return D._world[i];
    if (!D._parent) { D._parent = {}; (D.json.nodes || []).forEach((N, p) => (N.children || []).forEach(c => { D._parent[c] = p; })); }
    const L = this.nodeLocal(D.json.nodes[i]), P = D._parent[i];
    return (D._world[i] = P === undefined ? L : this.m4Mul(this.nodeWorld(D, P), L));
  },
  // the normal matrix (inverse-transpose of the upper 3x3) and the determinant's sign
  normalMat(m) {
    const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], g = m[2], h = m[6], i = m[10];
    const c00 = e * i - f * h, c01 = f * g - d * i, c02 = d * h - e * g, det = a * c00 + b * c01 + c * c02;
    // cofactor matrix (rows): transforming normals by it equals the inverse-transpose up to scale
    return { n: [c00, c01, c02, c * h - b * i, a * i - c * g, b * g - a * h, b * f - c * e, c * d - a * f, a * e - b * d], det };
  },
  subtreeHasMesh(D, i) {
    const N = D.json.nodes[i]; if (N.mesh !== undefined) return true;
    return (N.children || []).some(c => this.subtreeHasMesh(D, c));
  },
  walk(D, i, fn) { fn(i); (D.json.nodes[i].children || []).forEach(c => this.walk(D, c, fn)); },

  /* ---- materials -> vertex colour, gloss 0..3, emissive 0..1 ---- */
  srgb8(v) { return Math.round(clamp(Math.pow(Math.max(v, 0), 1 / 2.2), 0, 1) * 255); },
  material(D, mi) {
    const M = (mi !== undefined && D.json.materials && D.json.materials[mi]) || {}, P = M.pbrMetallicRoughness || {}, X = M.extensions || {}, E = M.extras || {};
    const base = P.baseColorFactor || [1, 1, 1, 1], metal = P.metallicFactor === undefined ? 1 : P.metallicFactor, rough = P.roughnessFactor === undefined ? 1 : P.roughnessFactor;
    const coat = X.KHR_materials_clearcoat ? (X.KHR_materials_clearcoat.clearcoatFactor === undefined ? 1 : X.KHR_materials_clearcoat.clearcoatFactor) : 0;
    const em = M.emissiveFactor || [0, 0, 0], strength = X.KHR_materials_emissive_strength && X.KHR_materials_emissive_strength.emissiveStrength !== undefined ? X.KHR_materials_emissive_strength.emissiveStrength : 1;
    let gloss = metal >= 0.5 && rough <= 0.35 ? 3 : (coat > 0 || rough <= 0.4) ? 2 : rough <= 0.7 ? 1 : 0;
    let e = 0, col = [base[0], base[1], base[2]];
    if (em[0] > 0 || em[1] > 0 || em[2] > 0) { e = clamp(strength / 3, 0, 1); col = em; }
    if (E.burns_gloss !== undefined) gloss = clamp(E.burns_gloss | 0, 0, 3);
    if (E.burns_e !== undefined) e = clamp(+E.burns_e, 0, 1);
    return { col, gloss, e, name: M.name || '' };
  },

  /* ---- rig: root nodes -> bones, baked into the 24-byte format ---- */
  rig(D, opts) {
    opts = opts || {};
    const J = D.json, nodes = J.nodes || [], bones = [], empties = {};
    for (const r of D.roots) {
      const N = nodes[r], name = N.name || ('node' + r), W = this.nodeWorld(D, r);
      if (!this.subtreeHasMesh(D, r)) { empties[name] = { x: W[12], y: W[13], z: W[14], extras: N.extras || {} }; continue; }
      const b = opts.static ? 0 : opts.bone ? opts.bone(name, N) : null;
      if (b === null || b === undefined || b < 0 || b > 63) continue;
      bones.push({ root: r, name, b });
    }
    let nb = Math.max(opts.minBones || 0, bones.length ? Math.max(...bones.map(x => x.b)) + 1 : 1);
    const Jt = new Float32Array(Math.max(nb, 1) * 3), names = [];
    // count first (one allocation), then bake
    let nvTotal = 0, niTotal = 0;
    const prims = [];
    for (const B of bones) this.walk(D, B.root, ni => {
      const N = nodes[ni]; if (N.mesh === undefined) return;
      for (const pr of J.meshes[N.mesh].primitives || []) {
        if (pr.mode !== undefined && pr.mode !== 4) continue;
        if (pr.attributes.POSITION === undefined) continue;
        const pos = this.accessor(D, pr.attributes.POSITION), nv = pos.count;
        const ni2 = pr.indices !== undefined ? this.accessor(D, pr.indices).count : nv;
        prims.push({ B, node: ni, pr, nv, ni: ni2 }); nvTotal += nv; niTotal += ni2;
      }
    });
    if (nvTotal > 65535) throw new Error('BurnsGLTF: too many vertices (' + nvTotal + ' > 65535): split the model or lower its detail');
    const buf = new ArrayBuffer(nvTotal * 24), f = new Float32Array(buf), i8 = new Int8Array(buf), u8 = new Uint8Array(buf), u16 = new Uint16Array(buf);
    const idx = new Uint16Array(niTotal);
    const wr = BURNS_ATLAS.white, uu = Math.round((wr.u0 + wr.u1) * 0.5 * 65535), vv = Math.round((wr.v0 + wr.v1) * 0.5 * 65535);
    const bmin = [Infinity, Infinity, Infinity], bmax = [-Infinity, -Infinity, -Infinity];
    let v0 = 0, i0 = 0;
    for (const B of bones) { if (!opts.static) { const W = this.nodeWorld(D, B.root); Jt[B.b * 3] = W[12]; Jt[B.b * 3 + 1] = W[13]; Jt[B.b * 3 + 2] = W[14]; } names[B.b] = B.name; }
    for (const P of prims) {
      const W = this.nodeWorld(D, P.node), NM = this.normalMat(W), nm = NM.n, flip = NM.det < 0, b = P.B.b;
      const jx = Jt[b * 3], jy = Jt[b * 3 + 1], jz = Jt[b * 3 + 2];
      const pos = this.accessor(D, P.pr.attributes.POSITION), nrm = P.pr.attributes.NORMAL !== undefined ? this.accessor(D, P.pr.attributes.NORMAL) : null;
      const colA = P.pr.attributes.COLOR_0 !== undefined ? this.accessor(D, P.pr.attributes.COLOR_0) : null;
      const mat = this.material(D, P.pr.material), mc = mat.col, bg = (b & 63) | (mat.gloss << 6), ea = Math.round(mat.e * 255);
      const faceN = !nrm;
      for (let k = 0; k < P.nv; k++) {
        const x = pos.array[k * 3], y = pos.array[k * 3 + 1], z = pos.array[k * 3 + 2];
        const wx = W[0] * x + W[4] * y + W[8] * z + W[12], wy = W[1] * x + W[5] * y + W[9] * z + W[13], wz = W[2] * x + W[6] * y + W[10] * z + W[14];
        if (wx < bmin[0]) bmin[0] = wx; if (wy < bmin[1]) bmin[1] = wy; if (wz < bmin[2]) bmin[2] = wz;
        if (wx > bmax[0]) bmax[0] = wx; if (wy > bmax[1]) bmax[1] = wy; if (wz > bmax[2]) bmax[2] = wz;
        const i = v0 + k, o = i * 24;
        f[i * 6] = wx - jx; f[i * 6 + 1] = wy - jy; f[i * 6 + 2] = wz - jz;
        let nx = 0, ny = 1, nz = 0;
        if (!faceN) {
          const a = nrm.array[k * 3], c = nrm.array[k * 3 + 1], d = nrm.array[k * 3 + 2];
          nx = nm[0] * a + nm[1] * c + nm[2] * d; ny = nm[3] * a + nm[4] * c + nm[5] * d; nz = nm[6] * a + nm[7] * c + nm[8] * d;
          const l = (Math.hypot(nx, ny, nz) || 1) * (flip ? -1 : 1); nx /= l; ny /= l; nz /= l;
        }
        i8[o + 12] = Math.round(nx * 127); i8[o + 13] = Math.round(ny * 127); i8[o + 14] = Math.round(nz * 127);
        u8[o + 15] = bg;
        let r = mc[0], g = mc[1], bl = mc[2];
        if (colA) { r *= this.comp(colA, k, 0); g *= this.comp(colA, k, 1); bl *= this.comp(colA, k, 2); }
        u8[o + 16] = this.srgb8(r); u8[o + 17] = this.srgb8(g); u8[o + 18] = this.srgb8(bl); u8[o + 19] = ea;
        u16[i * 12 + 10] = uu; u16[i * 12 + 11] = vv;
      }
      const ind = P.pr.indices !== undefined ? this.accessor(D, P.pr.indices).array : null;
      for (let k = 0; k + 2 < P.ni; k += 3) {
        const a = ind ? ind[k] : k, c = ind ? ind[k + 1] : k + 1, d = ind ? ind[k + 2] : k + 2;
        idx[i0 + k] = v0 + a; idx[i0 + k + 1] = v0 + (flip ? d : c); idx[i0 + k + 2] = v0 + (flip ? c : d);
      }
      // flat normals when the file has none: average of face normals is overkill; use the face normal per triangle corner
      if (faceN) {
        for (let k = 0; k + 2 < P.ni; k += 3) {
          const a = idx[i0 + k], c = idx[i0 + k + 1], d = idx[i0 + k + 2];
          const ax = f[a * 6], ay = f[a * 6 + 1], az = f[a * 6 + 2], ux = f[c * 6] - ax, uy = f[c * 6 + 1] - ay, uz = f[c * 6 + 2] - az, vx = f[d * 6] - ax, vy = f[d * 6 + 1] - ay, vz = f[d * 6 + 2] - az;
          let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
          for (const q of [a, c, d]) { i8[q * 24 + 12] = Math.round(nx * 127); i8[q * 24 + 13] = Math.round(ny * 127); i8[q * 24 + 14] = Math.round(nz * 127); }
        }
      }
      v0 += P.nv; i0 += P.ni;
    }
    if (!isFinite(bmin[0])) { bmin[0] = bmin[1] = bmin[2] = 0; bmax[0] = bmax[1] = bmax[2] = 0; }
    const geo = { data: buf, idx, count: niTotal, nv: nvTotal, bounds: [bmin[0], bmin[1], bmin[2], bmax[0], bmax[1], bmax[2]], vbo: null, ibo: null, gen: -1 };
    let extras = Object.assign({}, D.sceneExtras);
    for (const B of bones) if (B.b === 0 && nodes[B.root].extras) extras = Object.assign(extras, nodes[B.root].extras);
    if (opts.ao !== false && !(typeof window !== 'undefined' && window.__burnsNoAO) && nvTotal >= 8) {
      try { BurnsAO.bake(buf, 0, nvTotal, idx, 0, niTotal, { joints: Jt, res: opts.aoRes || 30, k: opts.aoK || 0.85 }); } catch (e) { /* AO is cosmetic */ }
    }
    return { geo, nb, J: Jt, names, empties, extras, bounds: geo.bounds, tris: niTotal / 3, nv: nvTotal };
  },
  // everything on bone 0, no joint subtraction: a prop or scenery piece
  staticGeo(D, opts) { return this.rig(D, Object.assign({}, opts || {}, { static: true, bone: () => 0 })); },

  /* ---- loading ---- */
  // .glb, or .glb.gz inflated in the browser (DecompressionStream; iOS 16.4+, Chrome 80+)
  fetch(url) {
    return fetch(url).then(r => {
      if (!r.ok) throw new Error('BurnsGLTF: ' + url + ' ' + r.status);
      if (/\.gz$/i.test(url)) { if (typeof DecompressionStream === 'undefined') throw new Error('BurnsGLTF: this browser cannot inflate ' + url); return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(); }
      return r.arrayBuffer();
    }).then(ab => this.parse(ab));
  },
  canInflate() { return typeof DecompressionStream !== 'undefined'; }
};
if (typeof window !== 'undefined') window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsGLTF });
