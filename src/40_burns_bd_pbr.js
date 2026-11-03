/* ============================================================
   BRADY GOES TO BURNING MAN — textured PBR glTF ("Stage 2", docs/BURNS_GUIDE.md §6.10)
   Blender-made models with real texture maps: base colour, ORM (occlusion / roughness / metallic), normal and
   emissive maps, drawn one part per material with GGX sun specular, metal fresnel, sky-probe reflections by
   roughness, an optional clear-coat lobe, and everything the engine's lighting already does (shadows cast and
   received, fog, point lights, the lightmap, bloom on emissive). Nothing in the engine files changes: this module
   adds BurnsGLTF.textures / BurnsGLTF.pbrGeo / BurnsGLTF.pbrMaterial to the loader, registers its programs
   through BurnsGL.addPrograms (rebuilt on tier changes and context loss) and adds pbrBegin() / pbr() to the renderer.

   Vertex format (32 bytes), BurnsGL-style:
     0 pos f32x3 | 12 normal i8x3 + bone u8 (bone 0..63 in the low bits, like the 24-byte format) |
     16 tangent i8x4 (w = bitangent sign) | 20 uv i16x2 (uv × 1024: -32..32 repeats) | 24 colour u8x4 (sRGB
     baseColorFactor × COLOR_0; a = emissive strength / 3, × COLOR_0.a)
   Bones: the rig convention of BurnsGLTF.rig (root nodes are bones, opts.bone(name, node) → 0..63), so textured
   cars can reuse CartGLB's bone map; without opts.bone everything is on bone 0 around the file's origin.
   ============================================================ */
const BurnsPBR = {
  STRIDE: 32, UVK: 1024, UNITS: { base: 6, orm: 7, normal: 8, emissive: 9 },
  /* ---- image decoding (PNG/JPEG/WebP inside the glb, or data:/relative URIs) ---- */
  decodeImage(D, im, maxSize) {
    const J = D.json;
    let blobP;
    if (im.bufferView !== undefined) {
      const V = J.bufferViews[im.bufferView];
      if (!D.bin) return Promise.reject(new Error('BurnsGLTF: image ' + (im.name || '') + ' has no binary chunk'));
      const bytes = new Uint8Array(D.bin.buffer, D.bin.byteOffset + (V.byteOffset || 0), V.byteLength);
      blobP = Promise.resolve(new Blob([bytes], { type: im.mimeType || 'image/png' }));
    } else if (im.uri) blobP = fetch(/^data:/i.test(im.uri) ? im.uri : (D.base || '') + im.uri).then(r => { if (!r.ok) throw new Error('BurnsGLTF: image ' + im.uri + ' ' + r.status); return r.blob(); });
    else return Promise.reject(new Error('BurnsGLTF: image without data'));
    const o = { premultiplyAlpha: 'none', colorSpaceConversion: 'none' };
    return blobP.then(blob => {
      if (typeof createImageBitmap === 'function') {
        return createImageBitmap(blob, o).then(bm => {
          const k = maxSize / Math.max(bm.width, bm.height);
          if (k >= 1) return bm;
          // over the budget: resample down (the GPU would just mip it away anyway)
          return createImageBitmap(bm, Object.assign({ resizeWidth: Math.max(1, Math.round(bm.width * k)), resizeHeight: Math.max(1, Math.round(bm.height * k)), resizeQuality: 'high' }, o)).then(b2 => { try { bm.close(); } catch (e) { /* ignore */ } return b2; });
        });
      }
      return new Promise((res, rej) => {   // very old browsers: an <img>
        const url = URL.createObjectURL(blob), img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); res(img); }; img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('BurnsGLTF: image decode failed')); };
        img.src = url;
      });
    });
  },
  /* ---- tangents for a vertex range of the 32-byte buffer (Lengyel), from baked positions, normals and UVs ---- */
  tangents(buf, idx, v0, nv, i0, ni) {
    const f = new Float32Array(buf), i8 = new Int8Array(buf), i16 = new Int16Array(buf), K = 1 / this.UVK;
    const t1 = new Float32Array(nv * 3), t2 = new Float32Array(nv * 3);
    for (let k = i0; k + 2 < i0 + ni; k += 3) {
      const a = idx[k], b = idx[k + 1], c = idx[k + 2];
      const ax = f[a * 8], ay = f[a * 8 + 1], az = f[a * 8 + 2];
      const e1x = f[b * 8] - ax, e1y = f[b * 8 + 1] - ay, e1z = f[b * 8 + 2] - az, e2x = f[c * 8] - ax, e2y = f[c * 8 + 1] - ay, e2z = f[c * 8 + 2] - az;
      const au = i16[a * 16 + 10] * K, av = i16[a * 16 + 11] * K;
      const d1u = i16[b * 16 + 10] * K - au, d1v = i16[b * 16 + 11] * K - av, d2u = i16[c * 16 + 10] * K - au, d2v = i16[c * 16 + 11] * K - av;
      let r = d1u * d2v - d2u * d1v; if (Math.abs(r) < 1e-12) continue; r = 1 / r;
      const sx = (e1x * d2v - e2x * d1v) * r, sy = (e1y * d2v - e2y * d1v) * r, sz = (e1z * d2v - e2z * d1v) * r;
      const tx = (e2x * d1u - e1x * d2u) * r, ty = (e2y * d1u - e1y * d2u) * r, tz = (e2z * d1u - e1z * d2u) * r;
      for (const q of [a, b, c]) { const o = (q - v0) * 3; t1[o] += sx; t1[o + 1] += sy; t1[o + 2] += sz; t2[o] += tx; t2[o + 1] += ty; t2[o + 2] += tz; }
    }
    for (let k = 0; k < nv; k++) {
      const i = v0 + k, o = i * 32, nx = i8[o + 12] / 127, ny = i8[o + 13] / 127, nz = i8[o + 14] / 127;
      let tx = t1[k * 3], ty = t1[k * 3 + 1], tz = t1[k * 3 + 2];
      const d = nx * tx + ny * ty + nz * tz; tx -= nx * d; ty -= ny * d; tz -= nz * d;
      let l = Math.hypot(tx, ty, tz);
      if (l < 1e-6) {   // no UV area: any perpendicular
        if (Math.abs(ny) < 0.9) { tx = nz; ty = 0; tz = -nx; } else { tx = 0; ty = -nz; tz = ny; }
        l = Math.hypot(tx, ty, tz) || 1;
      }
      tx /= l; ty /= l; tz /= l;
      const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
      const w = bx * t2[k * 3] + by * t2[k * 3 + 1] + bz * t2[k * 3 + 2] < 0 ? -1 : 1;
      i8[o + 16] = Math.round(tx * 127); i8[o + 17] = Math.round(ty * 127); i8[o + 18] = Math.round(tz * 127); i8[o + 19] = w * 127;
    }
  },
  /* ---- placement helpers: a column-major mat4 or a 3x4 bone row set (12 floats) for x, y, z, yaw, scale ---- */
  mat4(x, y, z, yaw, scale, out) {
    const m = out || new Float32Array(16), c = Math.cos(yaw || 0), s = Math.sin(yaw || 0), k = scale || 1;
    m.fill(0);
    m[0] = c * k; m[2] = -s * k; m[5] = k; m[8] = s * k; m[10] = c * k; m[12] = x; m[13] = y; m[14] = z; m[15] = 1;
    return m;
  },
  rows(x, y, z, yaw, scale, out) {
    const r = out || new Float32Array(12), c = Math.cos(yaw || 0), s = Math.sin(yaw || 0), k = scale || 1;
    r[0] = c * k; r[1] = 0; r[2] = s * k; r[3] = x; r[4] = 0; r[5] = k; r[6] = 0; r[7] = y; r[8] = -s * k; r[9] = 0; r[10] = c * k; r[11] = z;
    return r;
  },
  rowsFromMat4(m, out) {
    const r = out || new Float32Array(12);
    r[0] = m[0]; r[1] = m[4]; r[2] = m[8]; r[3] = m[12]; r[4] = m[1]; r[5] = m[5]; r[6] = m[9]; r[7] = m[13]; r[8] = m[2]; r[9] = m[6]; r[10] = m[10]; r[11] = m[14];
    return r;
  },
  // is a placed model (bounds around its origin, uniform scale) inside the renderer's frustum?
  visible(R, model, x, y, z, scale) {
    const b = model.bounds, k = scale || 1, cx = (b[0] + b[3]) * 0.5 * k, cy = (b[1] + b[4]) * 0.5 * k, cz = (b[2] + b[5]) * 0.5 * k;
    const r = Math.hypot(b[3] - b[0], b[4] - b[1], b[5] - b[2]) * 0.5 * k + 0.1;
    return BurnsM.sphereVisible(R.planes, x + cx, y + cy, z + cz, r);
  },
  // the flat-normal fallback texture (recreated after context loss)
  flatNormal() {
    const G = BurnsGL;
    if (!G._pbrFlat || G._pbrFlatGen !== G.gen) { G._pbrFlat = G.rawTexture(2, 2, new Uint8Array([128, 128, 255, 255, 128, 128, 255, 255, 128, 128, 255, 255, 128, 128, 255, 255])); G._pbrFlatGen = G.gen; }
    return G._pbrFlat;
  },
  /* ---- loading: fetch (.glb or .glb.gz), decode textures, bake the parts ---- */
  load(url, opts) {
    return BurnsGLTF.fetch(url).then(D => { D.base = url.replace(/[^/]*$/, ''); return this.build(D, opts); });
  },
  build(D, opts) { return BurnsGLTF.textures(D, opts).then(() => BurnsGLTF.pbrGeo(D, opts)); },
  // pick <stem>.glb.gz (inflated in the browser) or <stem>.glb from a models/index.json listing; null when neither exists
  pick(list, stem) {
    const have = new Set(Array.isArray(list) ? list : []);
    if (have.has(stem + '.glb.gz') && BurnsGLTF.canInflate()) return stem + '.glb.gz';
    return have.has(stem + '.glb') ? stem + '.glb' : null;
  },
  release(model) {
    if (!model) return;
    for (const P of model.parts || []) BurnsGL.freeGeo(P.geo);
    for (const T of model.textures || []) if (T) BurnsGL.freeTex(T);
  }
};

/* ---------------- loader additions ---------------- */
Object.assign(BurnsGLTF, {
  // decode every image of the doc into managed textures (BurnsGL.tex: mipmapped, anisotropic, re-uploaded after
  // context loss; wrap from the glTF sampler). Resolves to an array by glTF texture index (null where decoding failed)
  // and stores it as doc.textures. opts.maxSize (default 2048) downsamples bigger images.
  textures(D, opts) {
    if (D._texP) return D._texP;
    const J = D.json, imgs = J.images || [], texs = J.textures || [], samplers = J.samplers || [], maxSize = (opts && opts.maxSize) || 2048;
    const jobs = imgs.map(im => BurnsPBR.decodeImage(D, im, maxSize).catch(e => { console.warn('BurnsGLTF: ' + (e && e.message || e)); return null; }));
    return (D._texP = Promise.all(jobs).then(bms => {
      const out = [], cache = {};
      texs.forEach((t, i) => {
        const X = t.extensions || {}, src = t.source !== undefined ? t.source : X.EXT_texture_webp ? X.EXT_texture_webp.source : undefined;
        const bm = src !== undefined ? bms[src] : null;
        if (!bm) { out[i] = null; return; }
        const S = t.sampler !== undefined ? samplers[t.sampler] || {} : {}, repeat = S.wrapS !== 33071 && S.wrapT !== 33071;
        const key = src + (repeat ? ':r' : ':c');
        out[i] = cache[key] || (cache[key] = { src: bm, opts: { mips: true, aniso: 8, repeat }, tex: null, gen: -1, w: bm.width, h: bm.height, name: imgs[src].name || ('image' + src) });
      });
      D.textures = out;
      return out;
    }));
  },
  // a material for the textured path: factors + texture refs (managed textures from doc.textures, or null)
  pbrMaterial(D, mi, texs) {
    const M = (mi !== undefined && mi >= 0 && D.json.materials && D.json.materials[mi]) || {}, P = M.pbrMetallicRoughness || {}, X = M.extensions || {}, E = M.extras || {};
    texs = texs || D.textures || null;
    const base = P.baseColorFactor || [1, 1, 1, 1], metal = P.metallicFactor === undefined ? 1 : P.metallicFactor, rough = P.roughnessFactor === undefined ? 1 : P.roughnessFactor;
    const CC = X.KHR_materials_clearcoat, coat = CC ? (CC.clearcoatFactor === undefined ? 1 : CC.clearcoatFactor) : 0, coatRough = CC ? (CC.clearcoatRoughnessFactor === undefined ? 0 : CC.clearcoatRoughnessFactor) : 0;
    const ES = X.KHR_materials_emissive_strength, strength = ES && ES.emissiveStrength !== undefined ? ES.emissiveStrength : 1;
    const em = (M.emissiveFactor || [0, 0, 0]).slice(0, 3), bT = P.baseColorTexture, mT = P.metallicRoughnessTexture, nT = M.normalTexture, eT = M.emissiveTexture, oT = M.occlusionTexture;
    const first = bT || mT || nT || eT || oT, TR = first && first.extensions && first.extensions.KHR_texture_transform;
    const uvT = TR ? { ox: (TR.offset || [0, 0])[0], oy: (TR.offset || [0, 0])[1], sx: (TR.scale || [1, 1])[0], sy: (TR.scale || [1, 1])[1], r: TR.rotation || 0 } : null;
    const ti = t => t && t.index !== undefined ? t.index : -1, tex = i => (texs && i >= 0 && texs[i]) || null;
    // ORM: occlusion is read from the metallic-roughness image's R channel when both share it (a packed ORM map)
    const ormI = ti(mT) >= 0 ? ti(mT) : ti(oT), aoK = oT && ti(oT) === ormI ? (oT.strength === undefined ? 1 : oT.strength) : 0;
    let e = (em[0] > 0 || em[1] > 0 || em[2] > 0) ? clamp(strength / 3, 0, 1) : 0;
    if (E.burns_e !== undefined) e = clamp(+E.burns_e, 0, 1);
    const ids = { base: ti(bT), orm: ormI, normal: ti(nT), emissive: ti(eT) };
    return {
      name: M.name || '', base: [base[0], base[1], base[2], base[3] === undefined ? 1 : base[3]], metal, rough, em, e, coat, coatRough,
      nScale: nT && nT.scale !== undefined ? nT.scale : 1, aoK, cutoff: M.alphaMode === 'MASK' ? (M.alphaCutoff === undefined ? 0.5 : M.alphaCutoff) : -1,
      blend: M.alphaMode === 'BLEND', doubleSided: !!M.doubleSided, uvT, ids, extras: E,
      tex: { base: tex(ids.base), orm: tex(ids.orm), normal: tex(ids.normal), emissive: tex(ids.emissive) }
    };
  },
  /* the textured model: { parts: [{ geo, material, name }], bounds, tris, nv, nb, J, names, empties, extras, textures }
     opts: bone(name, node) → 0..63 | null (rig convention; omitted = everything on bone 0, no joint subtraction),
     minBones, textures (an array from BurnsGLTF.textures; doc.textures is used when present) */
  pbrGeo(D, opts) {
    opts = opts || {};
    const J = D.json, nodes = J.nodes || [], bones = [], empties = {}, stat = !opts.bone || opts.static;
    for (const r of D.roots) {
      const N = nodes[r], name = N.name || ('node' + r), W = this.nodeWorld(D, r);
      if (!this.subtreeHasMesh(D, r)) { empties[name] = { x: W[12], y: W[13], z: W[14], extras: N.extras || {} }; continue; }
      const b = stat ? 0 : opts.bone(name, N);
      if (b === null || b === undefined || b < 0 || b > 63) continue;
      bones.push({ root: r, name, b });
    }
    const nb = Math.max(opts.minBones || 0, bones.length ? Math.max(...bones.map(x => x.b)) + 1 : 1);
    const Jt = new Float32Array(nb * 3), names = [];
    for (const B of bones) { if (!stat) { const W = this.nodeWorld(D, B.root); Jt[B.b * 3] = W[12]; Jt[B.b * 3 + 1] = W[13]; Jt[B.b * 3 + 2] = W[14]; } names[B.b] = B.name; }
    // primitives grouped by material: one part (one draw) per material
    const groups = new Map();
    for (const B of bones) this.walk(D, B.root, ni => {
      const N = nodes[ni]; if (N.mesh === undefined) return;
      for (const pr of J.meshes[N.mesh].primitives || []) {
        if ((pr.mode !== undefined && pr.mode !== 4) || pr.attributes.POSITION === undefined) continue;
        const nv = this.accessor(D, pr.attributes.POSITION).count, cnt = pr.indices !== undefined ? this.accessor(D, pr.indices).count : nv;
        const mi = pr.material === undefined ? -1 : pr.material;
        let g = groups.get(mi); if (!g) groups.set(mi, g = { mi, prims: [], nv: 0, ni: 0 });
        g.prims.push({ B, node: ni, pr, nv, ni: cnt }); g.nv += nv; g.ni += cnt;
      }
    });
    const texs = opts.textures || D.textures || null, bmin = [Infinity, Infinity, Infinity], bmax = [-Infinity, -Infinity, -Infinity], parts = [];
    let tris = 0, nvAll = 0;
    for (const g of groups.values()) {
      const material = this.pbrMaterial(D, g.mi, texs), geo = this.pbrBake(D, g, material, Jt, bmin, bmax);
      parts.push({ geo, material, name: material.name }); tris += geo.count / 3; nvAll += geo.nv;
    }
    parts.sort((a, b) => (a.material.cutoff >= 0 ? 1 : 0) - (b.material.cutoff >= 0 ? 1 : 0));   // opaque first
    if (!isFinite(bmin[0])) { bmin[0] = bmin[1] = bmin[2] = 0; bmax[0] = bmax[1] = bmax[2] = 0; }
    let extras = Object.assign({}, D.sceneExtras);
    for (const B of bones) if (B.b === 0 && nodes[B.root].extras) extras = Object.assign(extras, nodes[B.root].extras);
    return { parts, bounds: [bmin[0], bmin[1], bmin[2], bmax[0], bmax[1], bmax[2]], tris, nv: nvAll, nb, J: Jt, names, empties, extras, textures: texs };
  },
  // bake one material group into a 32-byte geo (positions joint-relative like rig(); tangents from the file or computed)
  pbrBake(D, g, mat, Jt, bmin, bmax) {
    const nv = g.nv, ni = g.ni, big = nv > 65535, UVK = BurnsPBR.UVK;
    const buf = new ArrayBuffer(nv * 32), f = new Float32Array(buf), i8 = new Int8Array(buf), u8 = new Uint8Array(buf), i16 = new Int16Array(buf);
    const idx = big ? new Uint32Array(ni) : new Uint16Array(ni);
    const T = mat.uvT, tc = T ? Math.cos(T.r) : 1, ts = T ? Math.sin(T.r) : 0;
    const pmin = [Infinity, Infinity, Infinity], pmax = [-Infinity, -Infinity, -Infinity], noTan = [];
    let v0 = 0, i0 = 0;
    for (const P of g.prims) {
      const W = this.nodeWorld(D, P.node), NM = this.normalMat(W), nm = NM.n, flip = NM.det < 0, b = P.B.b, A = P.pr.attributes;
      const jx = Jt[b * 3], jy = Jt[b * 3 + 1], jz = Jt[b * 3 + 2];
      const pos = this.accessor(D, A.POSITION), nrm = A.NORMAL !== undefined ? this.accessor(D, A.NORMAL) : null, tan = A.TANGENT !== undefined ? this.accessor(D, A.TANGENT) : null;
      const uv = A.TEXCOORD_0 !== undefined ? this.accessor(D, A.TEXCOORD_0) : null, col = A.COLOR_0 !== undefined ? this.accessor(D, A.COLOR_0) : null;
      const bc = mat.base, bg = b & 63, ea = mat.e * 255;
      for (let k = 0; k < P.nv; k++) {
        const x = pos.array[k * 3], y = pos.array[k * 3 + 1], z = pos.array[k * 3 + 2];
        const wx = W[0] * x + W[4] * y + W[8] * z + W[12], wy = W[1] * x + W[5] * y + W[9] * z + W[13], wz = W[2] * x + W[6] * y + W[10] * z + W[14];
        if (wx < pmin[0]) pmin[0] = wx; if (wy < pmin[1]) pmin[1] = wy; if (wz < pmin[2]) pmin[2] = wz;
        if (wx > pmax[0]) pmax[0] = wx; if (wy > pmax[1]) pmax[1] = wy; if (wz > pmax[2]) pmax[2] = wz;
        const i = v0 + k, o = i * 32;
        f[i * 8] = wx - jx; f[i * 8 + 1] = wy - jy; f[i * 8 + 2] = wz - jz;
        let nx = 0, ny = 1, nz = 0;
        if (nrm) {
          const a = nrm.array[k * 3], c = nrm.array[k * 3 + 1], d = nrm.array[k * 3 + 2];
          nx = nm[0] * a + nm[1] * c + nm[2] * d; ny = nm[3] * a + nm[4] * c + nm[5] * d; nz = nm[6] * a + nm[7] * c + nm[8] * d;
          const l = (Math.hypot(nx, ny, nz) || 1) * (flip ? -1 : 1); nx /= l; ny /= l; nz /= l;
        }
        i8[o + 12] = Math.round(nx * 127); i8[o + 13] = Math.round(ny * 127); i8[o + 14] = Math.round(nz * 127);
        u8[o + 15] = bg;
        if (tan) {   // authored tangents (MikkTSpace from Blender): rotate like a direction, flip the handedness on mirrored nodes
          const a = tan.array[k * 4], c = tan.array[k * 4 + 1], d = tan.array[k * 4 + 2];
          let tx = W[0] * a + W[4] * c + W[8] * d, ty = W[1] * a + W[5] * c + W[9] * d, tz = W[2] * a + W[6] * c + W[10] * d;
          const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
          i8[o + 16] = Math.round(tx * 127); i8[o + 17] = Math.round(ty * 127); i8[o + 18] = Math.round(tz * 127);
          i8[o + 19] = (this.comp(tan, k, 3) < 0 ? -1 : 1) * (flip ? -1 : 1) * 127;
        }
        let u = uv ? this.comp(uv, k, 0) : 0, v = uv ? this.comp(uv, k, 1) : 0;
        if (T) { const su = u * T.sx, sv = v * T.sy; u = tc * su + ts * sv + T.ox; v = -ts * su + tc * sv + T.oy; }   // KHR_texture_transform (gltfpack's UV quantisation lives here)
        i16[i * 16 + 10] = clamp(Math.round(u * UVK), -32768, 32767); i16[i * 16 + 11] = clamp(Math.round(v * UVK), -32768, 32767);
        let r = bc[0], gg = bc[1], bl = bc[2], ca = 1;
        if (col) { r *= this.comp(col, k, 0); gg *= this.comp(col, k, 1); bl *= this.comp(col, k, 2); if (col.n === 4) ca = this.comp(col, k, 3); }
        u8[o + 24] = this.srgb8(r); u8[o + 25] = this.srgb8(gg); u8[o + 26] = this.srgb8(bl); u8[o + 27] = Math.round(ea * ca);
      }
      const ind = P.pr.indices !== undefined ? this.accessor(D, P.pr.indices).array : null;
      for (let k = 0; k + 2 < P.ni; k += 3) {
        const a = ind ? ind[k] : k, c = ind ? ind[k + 1] : k + 1, d = ind ? ind[k + 2] : k + 2;
        idx[i0 + k] = v0 + a; idx[i0 + k + 1] = v0 + (flip ? d : c); idx[i0 + k + 2] = v0 + (flip ? c : d);
      }
      if (!nrm) for (let k = 0; k + 2 < P.ni; k += 3) {   // no normals in the file: flat per triangle corner
        const a = idx[i0 + k], c = idx[i0 + k + 1], d = idx[i0 + k + 2];
        const ax = f[a * 8], ay = f[a * 8 + 1], az = f[a * 8 + 2], ux = f[c * 8] - ax, uy = f[c * 8 + 1] - ay, uz = f[c * 8 + 2] - az, vx = f[d * 8] - ax, vy = f[d * 8 + 1] - ay, vz = f[d * 8 + 2] - az;
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        for (const q of [a, c, d]) { i8[q * 32 + 12] = Math.round(nx * 127); i8[q * 32 + 13] = Math.round(ny * 127); i8[q * 32 + 14] = Math.round(nz * 127); }
      }
      if (!tan) noTan.push([v0, P.nv, i0, P.ni]);
      v0 += P.nv; i0 += P.ni;
    }
    for (const r of noTan) BurnsPBR.tangents(buf, idx, r[0], r[1], r[2], r[3]);
    for (let k = 0; k < 3; k++) { if (pmin[k] < bmin[k]) bmin[k] = pmin[k]; if (pmax[k] > bmax[k]) bmax[k] = pmax[k]; }
    return { data: buf, idx, count: ni, nv, bounds: isFinite(pmin[0]) ? [pmin[0], pmin[1], pmin[2], pmax[0], pmax[1], pmax[2]] : [0, 0, 0, 0, 0, 0], vbo: null, ibo: null, gen: -1, u32: big };
  }
});

/* ---------------- shaders ---------------- */
// the shared fragment shader: the engine's lighting block (shadows, fog, point lights, lightmap, sky probe) + bShadePBR
const BURNS_GLSL_PBRFS = `precision highp float;
varying vec3 vW; varying vec3 vN; varying vec4 vTn; varying vec2 vUV; varying vec4 vC;
uniform sampler2D uBase, uORM, uNrm, uEm;
uniform vec4 uMat;    // x metallic, y roughness, z normal scale, w clear coat
uniform vec4 uMat2;   // x occlusion strength, y normal map on, z alpha cutoff (< 0: opaque), w clear-coat roughness
uniform vec3 uEmF;    // emissive factor
uniform vec4 uTint; uniform float uAlphaK;
${BURNS_GLSL_LIGHT}
// split-sum environment BRDF (Karis' mobile fit): x scales F0, y adds
vec2 bEnvBRDF(float rough, float nv) {
  vec4 r = rough * vec4(-1.0, -0.0275, -0.572, 0.022) + vec4(1.0, 0.0425, 1.04, -0.04);
  float a004 = min(r.x * r.x, exp2(-9.28 * nv)) * r.x + r.y;
  return vec2(-1.04, 1.04) * a004 + r.zw;
}
vec3 bEnvLook(vec3 rf, float rough) {
#ifdef ENVMAP
  if (uEnvK > 0.5) return bEnv(rf, rough) * mix(0.55, 1.0, smoothstep(-0.35, 0.05, rf.y));
#endif
  return mix(uGnd * 1.1, uSky * 1.3, smoothstep(-0.15, 0.45, rf.y));
}
// metal/rough PBR: hemisphere ambient + lightmap (occluded), wrapped sun diffuse × (1 - metal), GGX sun specular with
// Schlick fresnel on F0 = mix(0.04, albedo, metal), point lights, sky-probe reflection by roughness, optional clear coat
vec3 bShadePBR(vec3 alb, vec3 n, vec3 w, float rough, float metal, float sh, float ao, float coat, float coatR) {
  vec3 v = normalize(uCam - w);
  float nv = max(dot(n, v), 0.02);
  vec3 F0 = mix(vec3(0.04), alb, metal);
  vec3 dif = alb * (1.0 - metal);
  vec3 amb = mix(uGnd, uSky, n.y * 0.5 + 0.5);
  vec3 lm = texture2D(uLight, (w.xz - uLm.xy) * uLm.zw).rgb;
  amb += bLin(lm) * (1.7 * exp(-max(w.y, 0.0) * 0.14)) * (0.7 + 0.3 * max(n.y, 0.0));
  float nl = dot(n, uKeyD), nlp = max(nl, 0.0);
  float dd = max((nl + 0.2) / 1.2, 0.0) * sh;
  vec3 c = dif * (amb * ao + uKeyC * dd);
  float a = max(rough * rough, 0.002), a2 = a * a;
  vec3 h = normalize(uKeyD + v);
  float nh = max(dot(n, h), 0.0), vh = max(dot(v, h), 0.0);
  float d1 = nh * nh * (a2 - 1.0) + 1.0;
  float D = a2 / (3.14159 * d1 * d1);
  float f5h = pow(1.0 - vh, 5.0);
  vec3 F = F0 + (1.0 - F0) * f5h;
  float k = (rough + 1.0) * (rough + 1.0) * 0.125;
  float V = 0.25 / ((nlp * (1.0 - k) + k) * (nv * (1.0 - k) + k));
  c += uKeyC * min(D * V, 24.0) * F * nlp * sh;
  float gl = 1.0 - rough;
  for (int i = 0; i < NPL; i++) {
#ifdef GL2
    if (i >= uNPL) break;
#endif
    vec3 d = uPL[i].xyz - w; float dl = length(d);
    float at = max(1.0 - dl / uPL[i].w, 0.0); at *= at;
    if (at <= 0.0) continue;
    vec3 ld = d / (dl + 0.0001);
    float pd = max(dot(n, ld), 0.0);
    c += uPC[i] * at * (dif * (0.22 + 0.78 * pd) + F0 * pow(max(dot(n, normalize(ld + v)), 0.0), 8.0 + gl * 110.0) * (0.04 + gl * 0.8) * pd);
  }
  vec3 rf = reflect(-v, n);
  vec2 ab = bEnvBRDF(rough, nv);
  c += bEnvLook(rf, rough) * (F0 * ab.x + ab.y) * ao;
  if (coat > 0.0) {   // a thin glossy dielectric over the base (car paint, varnish)
    float ca = max(coatR * coatR, 0.002), ca2 = ca * ca, cd = nh * nh * (ca2 - 1.0) + 1.0;
    float Dc = ca2 / (3.14159 * cd * cd), kc = (coatR + 1.0) * (coatR + 1.0) * 0.125;
    float Vc = 0.25 / ((nlp * (1.0 - kc) + kc) * (nv * (1.0 - kc) + kc));
    float Fc = 0.04 + 0.96 * f5h;
    vec2 cab = bEnvBRDF(coatR, nv);
    float Fe = 0.04 * cab.x + cab.y;
    vec3 cs = uKeyC * min(Dc * Vc, 24.0) * Fc * nlp * sh + bEnvLook(rf, coatR) * Fe * ao;
    c = c * (1.0 - Fe * coat) + cs * coat;
  }
  return c;
}
void main(){
  vec4 bt = texture2D(uBase, vUV);
  float alpha = bt.a * uAlphaK;
  if (uMat2.z >= 0.0 && alpha < uMat2.z) discard;
  vec3 alb = bLin(bt.rgb) * bLin(vC.rgb);
  vec3 orm = texture2D(uORM, vUV).rgb;
  float ao = mix(1.0, orm.r, uMat2.x);
  float rough = clamp(orm.g * uMat.y, 0.03, 1.0), metal = clamp(orm.b * uMat.x, 0.0, 1.0);
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 n = N;
  if (uMat2.y > 0.5) {
    vec3 T = normalize(vTn.xyz - N * dot(N, vTn.xyz));
    vec3 B = cross(N, T) * vTn.w;
    vec3 nm = texture2D(uNrm, vUV).xyz * 2.0 - 1.0;
    nm.xy *= uMat.z;
    n = normalize(T * nm.x + B * nm.y + N * nm.z);
  }
  vec3 em = bLin(texture2D(uEm, vUV).rgb) * uEmF * (vC.a * 3.0);
  float e = clamp(max(em.r, max(em.g, em.b)) * 0.8, 0.0, 1.0);   // glowing texels: no shadow, less fog (as the engine's emissive)
  float sh = mix(bShadow(vW, N), 1.0, step(0.6, e));
  vec3 c = bShadePBR(alb, n, vW, rough, metal, sh, ao, uMat.w, uMat2.w) + em * uEmB;
  c = mix(c, bLin(uTint.rgb), uTint.a);
  if (uTrip > 0.0) c = bTrip(c, vW);
  gl_FragColor = bOut(bFogMix(c, vW, e), 1.0);
}`;
const BURNS_GLSL_PBRVS = (MB, bones) => `#define MAXB ${MB}
attribute vec3 aPos; attribute vec3 aNrm; attribute float aBone; attribute vec4 aTan; attribute vec2 aUV; attribute vec4 aCol;
uniform mat4 uVP;
${bones ? 'uniform vec4 uB[MAXB * 3];' : 'uniform mat4 uM;'}
varying vec3 vW; varying vec3 vN; varying vec4 vTn; varying vec2 vUV; varying vec4 vC;
void main(){
  vec4 p = vec4(aPos, 1.0);
${bones ? `  int i = int(mod(aBone, 64.0) + 0.5) * 3;
  vec4 r0 = uB[i]; vec4 r1 = uB[i + 1]; vec4 r2 = uB[i + 2];
  vW = vec3(dot(r0, p), dot(r1, p), dot(r2, p));
  vN = vec3(dot(r0.xyz, aNrm), dot(r1.xyz, aNrm), dot(r2.xyz, aNrm));
  vTn = vec4(dot(r0.xyz, aTan.xyz), dot(r1.xyz, aTan.xyz), dot(r2.xyz, aTan.xyz), aTan.w);` : `  vW = (uM * p).xyz;
  mat3 m3 = mat3(uM[0].xyz, uM[1].xyz, uM[2].xyz);
  vN = m3 * aNrm;
  vTn = vec4(m3 * aTan.xyz, aTan.w);`}
  vUV = aUV * ${(1 / BurnsPBR.UVK).toFixed(8)}; vC = aCol;
  gl_Position = uVP * vec4(vW, 1.0);
}`;
BurnsGL.addPrograms((G, P) => {
  const MB = G.maxBones, A = ['aPos', 'aNrm', 'aBone', 'aTan', 'aUV', 'aCol'];
  P.pbr = G.program(BURNS_GLSL_PBRVS(MB, false), BURNS_GLSL_PBRFS, A);        // static: one model matrix (props, scenery)
  P.pbrSkin = G.program(BURNS_GLSL_PBRVS(MB, true), BURNS_GLSL_PBRFS, A);     // rigid bones like the skin program (textured cars)
  P.shPbr = G.Q && G.Q.shadows ? G.program(`#define MAXB ${MB}
attribute vec3 aPos; attribute vec3 aNrm; attribute float aBone; uniform mat4 uLVP; uniform vec4 uB[MAXB * 3];
void main(){ int i = int(mod(aBone, 64.0) + 0.5) * 3; vec4 p = vec4(aPos, 1.0); gl_Position = uLVP * vec4(dot(uB[i], p), dot(uB[i + 1], p), dot(uB[i + 2], p), 1.0); }`, `precision mediump float; void main(){ gl_FragColor = vec4(1.0); }`, ['aPos', 'aNrm', 'aBone']) : null;
});
BurnsGL.layoutPBR = function () {   // the 32-byte textured vertex
  const gl = this.gl;
  this.enable(6);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
  gl.vertexAttribPointer(1, 3, gl.BYTE, true, 32, 12);
  gl.vertexAttribPointer(2, 1, gl.UNSIGNED_BYTE, false, 32, 15);
  gl.vertexAttribPointer(3, 4, gl.BYTE, true, 32, 16);
  gl.vertexAttribPointer(4, 2, gl.SHORT, false, 32, 20);
  gl.vertexAttribPointer(5, 4, gl.UNSIGNED_BYTE, true, 32, 24);
};

/* ---------------- renderer ---------------- */
/* pbrBegin(env, world) once per pass (after R.skinBegin has run is fine: it switches programs itself), then
   pbr(model, bones, nb, tint) per placed model: bones = null (the file's own origin), a column-major mat4 (16 floats:
   BurnsPBR.mat4) or rigid bone rows (nb × 12 floats, as R.skin takes). tint = [r, g, b, a] mixes a flat colour over
   the result (hurt flashes). Works in the shadow pass too (R.pass === 'shadow'): depth only. */
BurnsRenderer.prototype.pbrBegin = function (env, world) {
  const gl = BurnsGL.gl;
  this._pbr = { env: env || this.envRef, world, prog: null, mat: null };   // a program switch re-applies the env uniforms
  if (this.pass === 'shadow') { const p = BurnsGL.progs.shPbr; if (p) { gl.useProgram(p.p); gl.uniformMatrix4fv(p.u.uLVP, false, this.LVP); } }
};
BurnsRenderer.prototype.pbr = function (model, bones, nb, tint) {
  if (!model || !model.parts || !model.parts.length) return;
  const gl = BurnsGL.gl, G = BurnsGL, S = this._pbr || (this.pbrBegin(this.envRef, null), this._pbr);
  const isM = bones && bones.length === 16 && !nb;
  const scratch = G._pbrRows || (G._pbrRows = BurnsPBR.rows(0, 0, 0, 0, 1));
  if (this.pass === 'shadow') {
    const p = G.progs.shPbr; if (!p) return;
    const rows = !bones ? BurnsPBR.rows(0, 0, 0, 0, 1, scratch) : isM ? BurnsPBR.rowsFromMat4(bones, scratch) : (nb * 12 === bones.length ? bones : bones.subarray(0, nb * 12));
    gl.uniform4fv(p.u.uB, rows);
    for (const part of model.parts) {
      const geo = part.geo; G.geo(geo);
      gl.bindBuffer(gl.ARRAY_BUFFER, geo.vbo); G.layoutPBR();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geo.ibo);
      gl.drawElements(gl.TRIANGLES, geo.count, geo.u32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
      this.stats.shDraws++; this.shadowStats += geo.count / 3;
    }
    return;
  }
  const p = (isM || !bones) ? G.progs.pbr : G.progs.pbrSkin; if (!p) return;
  const u = p.u, U = BurnsPBR.UNITS;
  if (S.prog !== p) {
    gl.useProgram(p.p);
    this.applyEnv(p, S.env, S.world);
    gl.uniform1i(u.uBase, U.base); gl.uniform1i(u.uORM, U.orm); gl.uniform1i(u.uNrm, U.normal); gl.uniform1i(u.uEm, U.emissive);
    S.prog = p; S.mat = null;
  }
  if (isM) gl.uniformMatrix4fv(u.uM, false, bones);
  else if (!bones) gl.uniformMatrix4fv(u.uM, false, G._pbrI || (G._pbrI = BurnsPBR.mat4(0, 0, 0, 0, 1)));
  else gl.uniform4fv(u.uB, nb * 12 === bones.length ? bones : bones.subarray(0, nb * 12));
  if (tint) gl.uniform4f(u.uTint, tint[0], tint[1], tint[2], tint[3]); else gl.uniform4f(u.uTint, 0, 0, 0, 0);
  for (const part of model.parts) {
    const geo = part.geo, M = part.material;
    if (S.mat !== M) {
      const T = M.tex, bind = (unit, t, fb) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t ? G.tex(t) : fb); };
      bind(U.base, T.base, G.white); bind(U.orm, T.orm, G.white); bind(U.normal, T.normal, BurnsPBR.flatNormal()); bind(U.emissive, T.emissive, G.black);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform4f(u.uMat, M.metal, M.rough, M.nScale, M.coat);
      gl.uniform4f(u.uMat2, T.orm ? M.aoK : 0, T.normal ? 1 : 0, M.cutoff, Math.max(M.coatRough, 0.04));
      gl.uniform3f(u.uEmF, M.em[0], M.em[1], M.em[2]);
      gl.uniform1f(u.uAlphaK, M.base[3]);
      S.mat = M;
    }
    G.geo(geo);
    gl.bindBuffer(gl.ARRAY_BUFFER, geo.vbo); G.layoutPBR();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geo.ibo);
    if (M.doubleSided) gl.disable(gl.CULL_FACE);
    gl.drawElements(gl.TRIANGLES, geo.count, geo.u32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
    if (M.doubleSided) gl.enable(gl.CULL_FACE);
    this.stats.draws++; this.stats.tris += geo.count / 3;
  }
};

/* ---------------- demo + debug hook ----------------
   window.BRADY_BURNS.debug.pbrDemo(n, opts): loads models/pbr_crate.glb(.gz) (tools/blender/pbr_demo.py) and drops n
   crates in front of Brady in the running world; they draw every frame through def.drawSkinned / def.drawShadows
   (wrapped at runtime, nothing in the world files changes). Resolves to { parts, tris, textures, items }. */
BurnsPBR.demo = function (n, opts) {
  opts = opts || {};
  const s = typeof Game !== 'undefined' ? Game.scene : null;
  if (!s || !s.player || !s.world || !s.def) return Promise.reject(new Error('pbrDemo: no world is running'));
  const base = opts.base || 'models/', stem = opts.stem || 'pbr_crate';
  const url = opts.url ? Promise.resolve(opts.url) : fetch(base + 'index.json').then(r => r.ok ? r.json() : []).catch(() => []).then(list => {
    const f = BurnsPBR.pick(list, stem); if (!f) throw new Error('pbrDemo: ' + base + stem + '.glb is not in ' + base + 'index.json (run tools/blender/pbr_demo.py, then build)');
    return base + f;
  });
  const modelP = s._pbrModel && s._pbrModel.stem === stem ? Promise.resolve(s._pbrModel.model) : url.then(u => BurnsPBR.load(u, opts)).then(m => { s._pbrModel = { stem, model: m }; return m; });
  return modelP.then(model => {
    const p = s.player, W = s.world, items = [], cnt = Math.max(1, n | 0), fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
    const spacing = opts.spacing || 1.7, dist = opts.dist || 4.5, size = model.bounds[3] - model.bounds[0] || 1;
    for (let i = 0; i < cnt; i++) {
      const off = (i - (cnt - 1) / 2) * spacing, x = p.x + fx * dist + rx * off, z = p.z + fz * dist + rz * off, yaw = p.yaw + Math.PI + (i % 3 - 1) * 0.55 + (i % 2 ? 0.2 : -0.1);
      const y = W.height(x, z), scale = opts.scale || 1;
      items.push({ x, y, z, yaw, scale, M: BurnsPBR.mat4(x, y, z, yaw, scale), r: size * scale });
    }
    s._pbrDemo = { model, items };
    const def = s.def;
    if (!def._pbrDemoHooked) {
      def._pbrDemoHooked = true;
      const draw = (g, R) => { const d = g._pbrDemo; if (!d) return; R.pbrBegin(R.envRef, g.world); for (const it of d.items) if (R.pass === 'shadow' ? R.shadowNear(it.x, it.y, it.z, it.r) : BurnsPBR.visible(R, d.model, it.x, it.y, it.z, it.scale)) R.pbr(d.model, it.M, 0, null); };
      const oS = def.drawSkinned, oH = def.drawShadows;
      def.drawSkinned = (g, R) => { if (oS) oS(g, R); draw(g, R); };
      def.drawShadows = (g, R) => { if (oH) oH(g, R); draw(g, R); };
    }
    return { parts: model.parts.length, tris: model.tris, nv: model.nv, textures: (model.textures || []).filter(Boolean).map(t => t.name + ' ' + t.w + 'x' + t.h), materials: model.parts.map(P => P.material.name), items: items.map(it => [+it.x.toFixed(2), +it.y.toFixed(2), +it.z.toFixed(2)]) };
  });
};
if (typeof window !== 'undefined') {
  window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsPBR });
  // the debug API is created by a later engine module (40_burns_j_ui.js); hook in once the bundle has run
  Promise.resolve().then(() => { const B = window.BRADY_BURNS; if (B && B.debug && !B.debug.pbrDemo) B.debug.pbrDemo = (n, o) => BurnsPBR.demo(n, o); });
}
