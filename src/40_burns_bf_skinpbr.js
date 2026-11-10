/* ============================================================
   BRADY GOES TO BURNING MAN — textured skinned heroes (BurnsSkinPBR)
   Realistic, textured, GPU-skinned characters (docs/BURNS_GUIDE.md §6.12): a skinned glTF that carries UVs and
   texture maps switches onto this path automatically, behind the same BurnsSkin / BurnsSkinActor API. Untextured files
   (the current brady.glb, chinka.glb, the mannequin) keep the 32-byte path of §6.9 untouched.

   What it adds (nothing in the older files changes; every hook is a wrapper installed from here):
     loader     BurnsSkinPBR.build(doc) — skins + clips as §6.9, primitives merged per shared texture set (≤ 3 draws a
                hero), sibling LOD meshes (<name>_LOD1 / _LOD2), face poses (clips named face_*), embedded PNG/JPEG/WebP
                decoded at the tier's size (2K high/ultra, 1K medium, 512 low) and re-decoded on tier change/context loss
     programs   hero / heroCut (main pass: skin, cloth, hair and generic shading) + shHero / shHeroCut (shadow casters)
     renderer   R.skinHero(asset, palette, n, tint, face, rim); R.skinW() forwards to it when geo.skinPbr is set
     face       BurnsFace: blink / talk (jaw) / smile from face_* pose clips on extra face joints (no morph targets)

   Vertex format (36 bytes, bind space, metres):
     0 pos f32x3 | 12 normal i8x3 + flags u8 (bits 0-1 kind: 0 generic, 1 skin, 2 cloth, 3 hair; bits 2-7 roughness
     factor × 63) | 16 tangent i8x4 (w = bitangent sign) | 20 uv u16x2 (normalised 0..1) | 24 colour u8x4 (sRGB
     baseColorFactor × COLOR_0; a = emissive strength / 3) | 28 joints u8x4 | 32 weights u8x4 (sum 255)
   ============================================================ */
const BURNS_SKINPBR = {
  STRIDE: 36,
  LOD: [8, 20],            // metres (÷ character scale): LOD0 inside 8, LOD1 to 20, LOD2 beyond (scene extra burns_lod overrides)
  HYST: 0.12,              // ±12 % hysteresis around each switch distance
  TEX: { ultra: 2048, high: 2048, medium: 1024, low: 512, legacy: 1024 },   // the largest texture side per graphics tier
  KIND: { generic: 0, skin: 1, cloth: 2, hair: 3 },
  UNITS: { base: 6, orm: 7, normal: 8, emissive: 9 },
  BLINK: [2.2, 5.5],       // seconds between automatic blinks
  MAX_DRAWS: 3             // the per-hero budget the loader warns about
};

const BurnsSkinPBR = {
  assets: [], pass: 1, forceLod: null, lodState: new WeakMap(),
  n: { draws: 0, shDraws: 0, cut: 0, shCut: 0, a2c: 0, lod: [0, 0, 0], uploads: 0 },   // cumulative counters (tests diff them)
  off() { return typeof window !== 'undefined' && !!window.__burnsNoSkinPBR; },
  texSize() { return BURNS_SKINPBR.TEX[BurnsGL.tier] || 1024; },

  /* ---- does a doc belong on this path? a skinned primitive with TEXCOORD_0 whose material uses a texture ---- */
  wants(D) {
    if (this.off()) return false;
    const J = D.json; if (!J.images || !J.images.length || !J.textures || !J.textures.length) return false;
    for (const N of J.nodes || []) {
      if (N.mesh === undefined || N.skin === undefined) continue;
      for (const pr of (J.meshes[N.mesh] || {}).primitives || []) {
        if (pr.attributes.TEXCOORD_0 === undefined || pr.material === undefined) continue;
        const M = (J.materials || [])[pr.material] || {}, P = M.pbrMetallicRoughness || {};
        if (P.baseColorTexture || P.metallicRoughnessTexture || M.normalTexture || M.emissiveTexture) return true;
      }
    }
    return false;
  },
  // material kind: extras.burns_kind ('skin' | 'cloth' | 'hair' | 'generic') or the material name
  kindOf(M) {
    const E = M.extras || {}, n = (M.name || '').toLowerCase();
    if (E.burns_kind !== undefined) { const k = BURNS_SKINPBR.KIND[String(E.burns_kind).toLowerCase()]; if (k !== undefined) return k; }
    if (/skin/.test(n)) return 1;
    if (/hair|lash|brow|beard|stubble/.test(n)) return 3;
    if (/cloth|fabric|shirt|tee|pant|trouser|jean|denim|dress|skirt|sock|hood|jacket|cotton|wool|knit|legging|scarf|cape|robe/.test(n)) return 2;
    return 0;
  },

  /* ---- textures: compressed bytes kept as Blobs, decoded at the tier's size, uploaded at draw time ---- */
  makeTex(D, imgIndex, repeat, srgb) {
    const J = D.json, im = J.images[imgIndex];
    let blob = null;
    if (im.bufferView !== undefined && D.bin) {
      const V = J.bufferViews[im.bufferView];
      blob = new Blob([new Uint8Array(D.bin.buffer, D.bin.byteOffset + (V.byteOffset || 0), V.byteLength)], { type: im.mimeType || 'image/png' });
    }
    return { name: im.name || ('image' + imgIndex), blob, repeat, srgb, tex: null, gen: -1, w: 0, h: 0, size: 0, bm: null, pending: null, bytes: 0, failed: !blob };
  },
  decode(T, size) {
    if (!T.blob || typeof createImageBitmap !== 'function') { T.failed = true; return Promise.resolve(); }
    const o = { premultiplyAlpha: 'none', colorSpaceConversion: 'none' };
    T.want = size;
    return (T.pending = createImageBitmap(T.blob, o).then(bm => {
      const k = size / Math.max(bm.width, bm.height);
      if (k >= 1) return bm;
      const w = Math.max(1, Math.round(bm.width * k)), h = Math.max(1, Math.round(bm.height * k));
      // resample down: createImageBitmap's resize where supported, else a canvas (Safari ignores resize options on some versions)
      return createImageBitmap(bm, Object.assign({ resizeWidth: w, resizeHeight: h, resizeQuality: 'high' }, o)).then(b2 => {
        if (b2.width === w && b2.height === h) { try { bm.close(); } catch (e) { /* ignore */ } return b2; }
        try { b2.close(); } catch (e) { /* ignore */ }
        throw new Error('resize ignored');
      }).catch(() => {
        const c = makeCanvas(w, h), x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
        x.drawImage(bm, 0, 0, w, h); try { bm.close(); } catch (e) { /* ignore */ }
        return c;
      });
    }).then(src => { T.bm = src; T.pending = null; }, e => { console.warn('BurnsSkinPBR: texture ' + T.name + ': ' + (e && e.message || e)); T.failed = true; T.pending = null; }));
  },
  // the GL texture to bind, or null (the caller binds a fallback). Uploads a freshly decoded image, starts re-decodes
  // after a tier change or context loss. Called with the target texture unit active.
  texOf(T) {
    if (!T || T.failed) return null;
    const G = BurnsGL, gl = G.gl, want = this.texSize();
    if (T.bm) {
      const t = gl.createTexture(), src = T.bm;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
      const wrap = T.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE, pot = (src.width & (src.width - 1)) === 0 && (src.height & (src.height - 1)) === 0;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const mips = pot || G.gl2;
      if (mips) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
      else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      if (G.aniso) gl.texParameterf(gl.TEXTURE_2D, G.aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, G.maxAniso));
      if (T.tex && T.gen === G.gen) gl.deleteTexture(T.tex);
      T.tex = t; T.gen = G.gen; T.w = src.width; T.h = src.height; T.size = T.want; T.bytes = Math.round(T.w * T.h * 4 * (mips ? 4 / 3 : 1));
      T.bm = null; if (src.close) { try { src.close(); } catch (e) { /* ignore */ } }   // GPU copy only: the Blob re-decodes it when needed
      this.n.uploads++;
    }
    const live = T.tex && T.gen === G.gen;
    if (!T.pending && (!live || T.size !== want)) this.decode(T, want);   // context loss or a tier change: decode again
    return live ? T.tex : null;
  },
  freeTex(T) { if (T && T.tex && BurnsGL.gl && T.gen === BurnsGL.gen) { try { BurnsGL.gl.deleteTexture(T.tex); } catch (e) { /* ignore */ } } if (T) { T.tex = null; T.gen = -1; T.bytes = 0; } },

  /* ---- the node hierarchy (as BurnsSkin.load): parents, order, rest TRS ---- */
  skeletonOf(D) {
    const nodes = D.json.nodes || [], n = nodes.length, parent = new Int32Array(n).fill(-1);
    nodes.forEach((N, p) => (N.children || []).forEach(c => { parent[c] = p; }));
    const order = [], seen = new Uint8Array(n), stack = [];
    for (let i = 0; i < n; i++) if (parent[i] < 0) stack.push(i);
    while (stack.length) { const i = stack.shift(); if (seen[i]) continue; seen[i] = 1; order.push(i); for (const c of nodes[i].children || []) stack.push(c); }
    for (let i = 0; i < n; i++) if (!seen[i]) order.push(i);
    const rest = new Float32Array(n * 10);
    for (let i = 0; i < n; i++) {
      const N = nodes[i], o = i * 10;
      if (N.matrix) {
        const m = N.matrix, sx = Math.hypot(m[0], m[1], m[2]) || 1, sy = Math.hypot(m[4], m[5], m[6]) || 1, sz = Math.hypot(m[8], m[9], m[10]) || 1;
        const r00 = m[0] / sx, r01 = m[4] / sy, r02 = m[8] / sz, r10 = m[1] / sx, r11 = m[5] / sy, r12 = m[9] / sz, r20 = m[2] / sx, r21 = m[6] / sy, r22 = m[10] / sz;
        const tr = r00 + r11 + r22; let qx, qy, qz, qw;
        if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; qw = s / 4; qx = (r21 - r12) / s; qy = (r02 - r20) / s; qz = (r10 - r01) / s; }
        else if (r00 > r11 && r00 > r22) { const s = Math.sqrt(1 + r00 - r11 - r22) * 2; qw = (r21 - r12) / s; qx = s / 4; qy = (r01 + r10) / s; qz = (r02 + r20) / s; }
        else if (r11 > r22) { const s = Math.sqrt(1 + r11 - r00 - r22) * 2; qw = (r02 - r20) / s; qx = (r01 + r10) / s; qy = s / 4; qz = (r12 + r21) / s; }
        else { const s = Math.sqrt(1 + r22 - r00 - r11) * 2; qw = (r10 - r01) / s; qx = (r02 + r20) / s; qy = (r12 + r21) / s; qz = s / 4; }
        rest.set([m[12], m[13], m[14], qx, qy, qz, qw, sx, sy, sz], o);
      } else {
        const t = N.translation || [0, 0, 0], r = N.rotation || [0, 0, 0, 1], s = N.scale || [1, 1, 1];
        rest.set([t[0], t[1], t[2], r[0], r[1], r[2], r[3], s[0], s[1], s[2]], o);
      }
    }
    return { parent, order, rest };
  },

  /* ---- the loader: doc -> textured asset (same fields as BurnsSkin.load, plus lods, textures, face) ---- */
  build(D, opts) {
    opts = opts || {};
    const J = D.json, nodes = J.nodes || [], skins = BurnsGLTF.skins(D);
    if (!skins.length) throw new Error('BurnsSkinPBR: the file has no skins');
    let si = opts.skin;
    if (si === undefined) { const first = nodes.findIndex(N => N.mesh !== undefined && N.skin !== undefined); si = first >= 0 ? nodes[first].skin : 0; }
    const skin = skins[si]; if (!skin) throw new Error('BurnsSkinPBR: no skin ' + si);
    const nb = skin.joints.length;
    if (nb > (opts.maxJoints || 64)) throw new Error('BurnsSkinPBR: the skin has ' + nb + ' joints; the engine palette holds 64 (drop finger/end bones)');
    // LOD level of a primitive: extras.burns_lod, else a name ending in _LOD<n> on its node, its mesh or extras.burns_name
    // (the build writes "<node>|<mesh>" there because gltfpack drops skinned mesh names: tools/hero_glb.js); no suffix = LOD0
    const lodOf = (ni, pr) => {
      const X = pr.extras || {}; if (X.burns_lod !== undefined) return clamp(X.burns_lod | 0, 0, 2);
      const N = nodes[ni], s = (N.name || '') + ' ' + ((J.meshes[N.mesh] || {}).name || '') + ' ' + (X.burns_name || ''); const m = /_lod(\d)/i.exec(s); return m ? Math.min(2, +m[1]) : 0;
    };
    const meshNodes = [];
    nodes.forEach((N, ni) => { if (N.mesh !== undefined && N.skin === si) meshNodes.push({ ni }); });
    if (!meshNodes.length) throw new Error('BurnsSkinPBR: skin ' + si + ' has no meshes');
    const ref = (meshNodes.find(m => ((J.meshes[nodes[m.ni].mesh] || {}).primitives || []).some(pr => lodOf(m.ni, pr) === 0)) || meshNodes[0]).ni;
    // bind space = metres: bake the reference mesh node's transform (gltfpack's dequantisation) and take it out of the IBMs
    const Wn = BurnsGLTF.nodeWorld(D, ref), N34 = new Float32Array(12), Ninv = new Float32Array(12);
    BurnsSkinM.fromM4(N34, 0, Wn, 0); BurnsSkinM.invert(Ninv, 0, N34, 0);
    const ib = new Float32Array(nb * 12), tmp = new Float32Array(12);
    for (let k = 0; k < nb; k++) { BurnsSkinM.fromM4(tmp, 0, skin.inverseBind, k * 16); BurnsM.a34Mul(ib, k * 12, tmp, 0, Ninv, 0); }
    for (const m of meshNodes) { const W = BurnsGLTF.nodeWorld(D, m.ni); let d = 0; for (let k = 0; k < 16; k++) d = Math.max(d, Math.abs(W[k] - Wn[k])); if (d > 1e-4) console.warn('BurnsSkinPBR: mesh node ' + (nodes[m.ni].name || m.ni) + ' has its own transform; skinned meshes should share one (apply transforms in Blender)'); }
    // textures: one per image (+ wrap mode); colour images are sRGB, data images linear (the shader decodes)
    const texIdx = {}, textures = [], imgOf = ti => { const t = (J.textures || [])[ti]; if (!t) return -1; const X = t.extensions || {}; return t.source !== undefined ? t.source : X.EXT_texture_webp ? X.EXT_texture_webp.source : X.EXT_texture_avif ? X.EXT_texture_avif.source : -1; };
    const texFor = (ti, srgb) => {
      if (ti === undefined || ti < 0) return null;
      const img = imgOf(ti); if (img < 0 || !J.images[img]) return null;
      const t = J.textures[ti], S = t.sampler !== undefined ? (J.samplers || [])[t.sampler] || {} : {}, repeat = S.wrapS !== 33071 && S.wrapT !== 33071, key = img + (repeat ? 'r' : 'c');
      if (!texIdx[key]) { texIdx[key] = this.makeTex(D, img, repeat, srgb); textures.push(texIdx[key]); }
      return texIdx[key];
    };
    // materials: factors and kinds go into the vertices; what must match to share a draw goes into the key
    const matInfo = {}, info = mi => {
      if (matInfo[mi] !== undefined) return matInfo[mi];
      const M = (J.materials || [])[mi] || {}, pm = BurnsGLTF.pbrMaterial(D, mi, []), ids = pm.ids;
      const mask = M.alphaMode === 'MASK' || M.alphaMode === 'BLEND';
      if (M.alphaMode === 'BLEND') console.warn('BurnsSkinPBR: material ' + (M.name || mi) + ' is BLEND; heroes draw it as a MASK cutout (0.5)');
      const cutoff = mask ? (M.alphaCutoff === undefined ? 0.5 : M.alphaCutoff) : -1;
      const em = pm.e > 0 ? [ids.emissive, pm.em.map(v => +v.toFixed(4)).join(',')].join('|') : null;
      const key0 = [imgOf(ids.base), imgOf(ids.orm), imgOf(ids.normal), mask ? 'm' + cutoff + ',' + pm.base[3] : 'o', pm.doubleSided ? 2 : 1, pm.metal, pm.nScale, pm.aoK].join('|');
      return (matInfo[mi] = { M, pm, kind: this.kindOf(M), key0, em, cutoff, mask, name: M.name || ('material' + mi) });
    };
    // primitives -> parts per LOD
    const lods = [];
    for (let L = 0; L <= 2; L++) {
      const prims = [];
      for (const m of meshNodes) {
        for (const pr of (J.meshes[nodes[m.ni].mesh] || {}).primitives || []) {
          if (lodOf(m.ni, pr) !== L) continue;
          if ((pr.mode !== undefined && pr.mode !== 4) || pr.attributes.POSITION === undefined || pr.attributes.JOINTS_0 === undefined) continue;
          const nv = BurnsGLTF.accessor(D, pr.attributes.POSITION).count, ni = pr.indices !== undefined ? BurnsGLTF.accessor(D, pr.indices).count : nv;
          prims.push({ node: m.ni, pr, nv, ni, I: info(pr.material === undefined ? -1 : pr.material) });
        }
      }
      if (!prims.length) { lods[L] = null; continue; }
      // group by key0; inside a group every emissive material must agree (non-emissive ones join with e = 0)
      const g0 = new Map();
      for (const P of prims) { let g = g0.get(P.I.key0); if (!g) g0.set(P.I.key0, g = []); g.push(P); }
      const groups = [];
      for (const list of g0.values()) {
        const ems = [...new Set(list.map(P => P.I.em).filter(Boolean))];
        if (ems.length <= 1) groups.push(list);
        else for (const e of ems) groups.push(list.filter(P => P.I.em === e || (P.I.em === null && e === ems[0])));
      }
      const parts = groups.map(list => this.bakePart(D, list, nb, texFor));
      parts.sort((a, b) => (a.mat.cutoff >= 0) - (b.mat.cutoff >= 0) || (a.mat.e > 0) - (b.mat.e > 0));   // opaque, glow, then cutouts
      lods[L] = { parts, tris: parts.reduce((s, p) => s + p.geo.count / 3, 0), nv: parts.reduce((s, p) => s + p.geo.nv, 0) };
      if (parts.length > BURNS_SKINPBR.MAX_DRAWS) console.warn('BurnsSkinPBR: LOD' + L + ' needs ' + parts.length + ' draws (budget ' + BURNS_SKINPBR.MAX_DRAWS + '): share one texture set between materials ' + parts.map(p => p.name).join(', '));
    }
    if (!lods[0]) { const k = lods.findIndex(Boolean); lods[0] = lods[k]; lods[k] = null; }
    // the skeleton, clips and face poses
    const Sk = this.skeletonOf(D), jointSlots = Int32Array.from(skin.joints), jointOf = {};
    skin.names.forEach((nm, k) => { jointOf[nm] = k; });
    const n = nodes.length, nodeIndexOf = i => (i >= 0 && i < n ? i : -1);
    const asset = {
      name: opts.name || (J.asset && J.asset.extras && J.asset.extras.name) || 'skinned', nb, nodes: nodes.map(N => ({ name: N.name || '' })),
      parent: Sk.parent, order: Sk.order, rest: Sk.rest, jointSlots, jointOf, jointNames: skin.names, inverseBind: ib, clips: {}, clipNames: [],
      tris: lods[0].tris, nv: lods[0].nv, extras: Object.assign({}, D.sceneExtras || {}, nodes[ref].extras || {}),
      textured: true, lods, textures, face: null, owner: opts.owner || null
    };
    const clipDefs = BurnsGLTF.clips(D), face = {};
    for (const nm in clipDefs) {
      const c = new BurnsClip(clipDefs[nm], nodeIndexOf);
      if (/^face_/i.test(nm)) face[nm.slice(5).toLowerCase()] = c; else { asset.clips[nm] = c; asset.clipNames.push(nm); }
    }
    if (Object.keys(face).length) asset.face = this.facePoses(asset, face);
    const ld = asset.extras.burns_lod;
    asset.lodDist = Array.isArray(ld) && ld.length >= 2 ? [+ld[0], +ld[1]] : BURNS_SKINPBR.LOD.slice();
    // LOD distance reference: the hips joint's bind position (the palette carries it to the world)
    const hk = jointOf['mixamorig:Hips'] !== undefined ? jointOf['mixamorig:Hips'] : 0, inv = new Float32Array(12);
    BurnsSkinM.invert(inv, 0, ib, hk * 12); asset.hipSlot = hk; asset.hipBind = [inv[3], inv[7], inv[11]];
    // bounds: LOD0 skinned on the CPU in the rest pose
    const sk = new BurnsSkeleton(asset); sk.compute();
    const PP = sk.palette, bmin = [Infinity, Infinity, Infinity], bmax = [-Infinity, -Infinity, -Infinity];
    for (const part of lods[0].parts) {
      const f = new Float32Array(part.geo.data), u8 = new Uint8Array(part.geo.data), S = BURNS_SKINPBR.STRIDE;
      for (let i = 0; i < part.geo.nv; i++) {
        const x = f[i * 9], y = f[i * 9 + 1], z = f[i * 9 + 2], o = i * S; let wx = 0, wy = 0, wz = 0;
        for (let c = 0; c < 4; c++) {
          const w = u8[o + 32 + c] / 255; if (!w) continue; const k = u8[o + 28 + c] * 12;
          wx += w * (PP[k] * x + PP[k + 1] * y + PP[k + 2] * z + PP[k + 3]); wy += w * (PP[k + 4] * x + PP[k + 5] * y + PP[k + 6] * z + PP[k + 7]); wz += w * (PP[k + 8] * x + PP[k + 9] * y + PP[k + 10] * z + PP[k + 11]);
        }
        if (wx < bmin[0]) bmin[0] = wx; if (wy < bmin[1]) bmin[1] = wy; if (wz < bmin[2]) bmin[2] = wz;
        if (wx > bmax[0]) bmax[0] = wx; if (wy > bmax[1]) bmax[1] = wy; if (wz > bmax[2]) bmax[2] = wz;
      }
    }
    asset.bounds = [bmin[0], bmin[1], bmin[2], bmax[0], bmax[1], bmax[2]]; asset.height = bmax[1] - bmin[1];
    // what R.skinW receives: a stub that routes the draw here (one geometry object per asset, as before)
    asset.geo = { skinPbr: asset, count: lods[0].tris * 3, nv: lods[0].nv, stride: BURNS_SKINPBR.STRIDE, weighted: true, bounds: asset.bounds };
    // decode the textures now, at the current tier's size
    const size = BurnsGL.gl ? this.texSize() : 2048;
    asset.texReady = Promise.all(textures.map(T => this.decode(T, size))).then(() => asset);
    this.assets.push(asset);
    return asset;
  },
  // one draw: a list of primitives sharing a texture set, baked into the 36-byte format
  bakePart(D, list, nb, texFor) {
    const I0 = list[0].I, pm = I0.pm, ids = pm.ids, S = BURNS_SKINPBR.STRIDE;
    const emI = list.find(P => P.I.em) ? list.find(P => P.I.em).I : null;
    let nv = 0, ni = 0; for (const P of list) { nv += P.nv; ni += P.ni; }
    const big = nv > 65535;
    const buf = new ArrayBuffer(nv * S), f = new Float32Array(buf), i8 = new Int8Array(buf), u8 = new Uint8Array(buf), u16 = new Uint16Array(buf);
    const idx = big ? new Uint32Array(ni) : new Uint16Array(ni), noTan = [];
    let v0 = 0, i0 = 0, uvOut = 0;
    const wtmp = [0, 0, 0, 0], jtmp = [0, 0, 0, 0];
    for (const P of list) {
      const W = BurnsGLTF.nodeWorld(D, P.node), NM = BurnsGLTF.normalMat(W), nm = NM.n, flip = NM.det < 0, A = P.pr.attributes, I = P.I, mp = I.pm;
      const pos = BurnsGLTF.accessor(D, A.POSITION), nrm = A.NORMAL !== undefined ? BurnsGLTF.accessor(D, A.NORMAL) : null, tan = A.TANGENT !== undefined ? BurnsGLTF.accessor(D, A.TANGENT) : null;
      const uv = A.TEXCOORD_0 !== undefined ? BurnsGLTF.accessor(D, A.TEXCOORD_0) : null, col = A.COLOR_0 !== undefined ? BurnsGLTF.accessor(D, A.COLOR_0) : null;
      const jA = BurnsGLTF.accessor(D, A.JOINTS_0), wA = A.WEIGHTS_0 !== undefined ? BurnsGLTF.accessor(D, A.WEIGHTS_0) : null;
      const T = mp.uvT, tc = T ? Math.cos(T.r) : 1, ts = T ? Math.sin(T.r) : 0;
      const bc = mp.base, ea = mp.e * 255, flags = (I.kind & 3) | (Math.round(clamp(mp.rough, 0, 1) * 63) << 2);
      for (let k = 0; k < P.nv; k++) {
        const i = v0 + k, o = i * S, x = pos.array[k * 3], y = pos.array[k * 3 + 1], z = pos.array[k * 3 + 2];
        f[i * 9] = W[0] * x + W[4] * y + W[8] * z + W[12]; f[i * 9 + 1] = W[1] * x + W[5] * y + W[9] * z + W[13]; f[i * 9 + 2] = W[2] * x + W[6] * y + W[10] * z + W[14];
        let nx = 0, ny = 1, nz = 0;
        if (nrm) {
          const a = BurnsGLTF.comp(nrm, k, 0), c = BurnsGLTF.comp(nrm, k, 1), d = BurnsGLTF.comp(nrm, k, 2);
          nx = nm[0] * a + nm[1] * c + nm[2] * d; ny = nm[3] * a + nm[4] * c + nm[5] * d; nz = nm[6] * a + nm[7] * c + nm[8] * d;
          const l = (Math.hypot(nx, ny, nz) || 1) * (flip ? -1 : 1); nx /= l; ny /= l; nz /= l;
        }
        i8[o + 12] = Math.round(nx * 127); i8[o + 13] = Math.round(ny * 127); i8[o + 14] = Math.round(nz * 127); u8[o + 15] = flags;
        if (tan) {   // authored (MikkTSpace) tangents: rotate as a direction; mirrored nodes flip the handedness
          const a = BurnsGLTF.comp(tan, k, 0), c = BurnsGLTF.comp(tan, k, 1), d = BurnsGLTF.comp(tan, k, 2);
          let tx = W[0] * a + W[4] * c + W[8] * d, ty = W[1] * a + W[5] * c + W[9] * d, tz = W[2] * a + W[6] * c + W[10] * d;
          const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
          i8[o + 16] = Math.round(tx * 127); i8[o + 17] = Math.round(ty * 127); i8[o + 18] = Math.round(tz * 127);
          i8[o + 19] = (BurnsGLTF.comp(tan, k, 3) < 0 ? -1 : 1) * (flip ? -1 : 1) * 127;
        }
        let u = uv ? BurnsGLTF.comp(uv, k, 0) : 0, v = uv ? BurnsGLTF.comp(uv, k, 1) : 0;
        if (T) { const su = u * T.sx, sv = v * T.sy; u = tc * su + ts * sv + T.ox; v = -ts * su + tc * sv + T.oy; }   // KHR_texture_transform (gltfpack's UV quantisation)
        if (u < -0.001 || u > 1.001 || v < -0.001 || v > 1.001) uvOut++;
        u16[o / 2 + 10] = Math.round(clamp(u, 0, 1) * 65535); u16[o / 2 + 11] = Math.round(clamp(v, 0, 1) * 65535);
        let r = bc[0], gg = bc[1], bl = bc[2], ca = 1;
        if (col) { r *= BurnsGLTF.comp(col, k, 0); gg *= BurnsGLTF.comp(col, k, 1); bl *= BurnsGLTF.comp(col, k, 2); if (col.n === 4) ca = BurnsGLTF.comp(col, k, 3); }
        u8[o + 24] = BurnsGLTF.srgb8(r); u8[o + 25] = BurnsGLTF.srgb8(gg); u8[o + 26] = BurnsGLTF.srgb8(bl); u8[o + 27] = Math.round(ea * ca);
        // joints + weights, normalised to sum 255 (as §6.9)
        let sum = 0;
        for (let c = 0; c < 4; c++) { jtmp[c] = jA.array[k * jA.n + c] | 0; wtmp[c] = wA ? Math.max(0, BurnsGLTF.comp(wA, k, c)) : (c === 0 ? 1 : 0); if (jtmp[c] >= nb) { jtmp[c] = 0; wtmp[c] = 0; } sum += wtmp[c]; }
        if (sum <= 0) { wtmp[0] = 1; sum = 1; }
        let bigW = 0, acc = 0;
        for (let c = 0; c < 4; c++) { const b = Math.round(wtmp[c] / sum * 255); u8[o + 32 + c] = b; acc += b; if (wtmp[c] > wtmp[bigW]) bigW = c; u8[o + 28 + c] = b ? jtmp[c] : 0; }
        u8[o + 32 + bigW] = clamp(u8[o + 32 + bigW] + 255 - acc, 0, 255);
        if (!u8[o + 32 + bigW]) u8[o + 28 + bigW] = 0;
      }
      const ind = P.pr.indices !== undefined ? BurnsGLTF.accessor(D, P.pr.indices).array : null;
      for (let k = 0; k + 2 < P.ni; k += 3) {
        const a = ind ? ind[k] : k, c = ind ? ind[k + 1] : k + 1, d = ind ? ind[k + 2] : k + 2;
        idx[i0 + k] = v0 + a; idx[i0 + k + 1] = v0 + (flip ? d : c); idx[i0 + k + 2] = v0 + (flip ? c : d);
      }
      if (!tan) noTan.push([v0, P.nv, i0, P.ni]);
      v0 += P.nv; i0 += P.ni;
    }
    for (const r of noTan) this.tangents(buf, idx, r[0], r[1], r[2], r[3]);
    if (uvOut) console.warn('BurnsSkinPBR: ' + uvOut + ' UVs outside 0..1 were clamped (' + list.map(P => P.I.name).join(', ') + '): character UVs must stay inside the atlas');
    const mat = {
      cutoff: I0.cutoff, alphaK: pm.base[3], doubleSided: pm.doubleSided, metal: pm.metal, nScale: pm.nScale, aoK: pm.aoK,
      e: emI ? emI.pm.e : 0, em: emI ? emI.pm.em.slice() : [0, 0, 0],
      tex: { base: texFor(ids.base, true), orm: texFor(ids.orm, false), normal: texFor(ids.normal, false), emissive: emI ? texFor(emI.pm.ids.emissive, true) : null }
    };
    const kinds = [...new Set(list.map(P => P.I.kind))];
    return { geo: { data: buf, idx, count: ni, nv, stride: S, vbo: null, ibo: null, gen: -1, u32: big }, mat, name: [...new Set(list.map(P => P.I.name))].join('+'), kinds };
  },
  // tangents from positions, normals and UVs (Lengyel), for primitives without TANGENT. The bitangent sign is chosen so
  // that cross(N, T) * w points toward DECREASING glTF v (image up), which is what Blender's MikkTSpace export writes and
  // what OpenGL-style (+Y up, glTF) normal maps expect.
  tangents(buf, idx, v0, nv, i0, ni) {
    const S = BURNS_SKINPBR.STRIDE, f = new Float32Array(buf), i8 = new Int8Array(buf), u16 = new Uint16Array(buf), K = 1 / 65535;
    const t1 = new Float32Array(nv * 3), t2 = new Float32Array(nv * 3);
    for (let k = i0; k + 2 < i0 + ni; k += 3) {
      const a = idx[k], b = idx[k + 1], c = idx[k + 2];
      const ax = f[a * 9], ay = f[a * 9 + 1], az = f[a * 9 + 2];
      const e1x = f[b * 9] - ax, e1y = f[b * 9 + 1] - ay, e1z = f[b * 9 + 2] - az, e2x = f[c * 9] - ax, e2y = f[c * 9 + 1] - ay, e2z = f[c * 9 + 2] - az;
      const au = u16[a * 18 + 10] * K, av = u16[a * 18 + 11] * K;
      const d1u = u16[b * 18 + 10] * K - au, d1v = u16[b * 18 + 11] * K - av, d2u = u16[c * 18 + 10] * K - au, d2v = u16[c * 18 + 11] * K - av;
      let r = d1u * d2v - d2u * d1v; if (Math.abs(r) < 1e-14) continue; r = 1 / r;
      const sx = (e1x * d2v - e2x * d1v) * r, sy = (e1y * d2v - e2y * d1v) * r, sz = (e1z * d2v - e2z * d1v) * r;
      const tx = (e2x * d1u - e1x * d2u) * r, ty = (e2y * d1u - e1y * d2u) * r, tz = (e2z * d1u - e1z * d2u) * r;
      for (const q of [a, b, c]) { const o = (q - v0) * 3; t1[o] += sx; t1[o + 1] += sy; t1[o + 2] += sz; t2[o] += tx; t2[o + 1] += ty; t2[o + 2] += tz; }
    }
    for (let k = 0; k < nv; k++) {
      const i = v0 + k, o = i * S, nx = i8[o + 12] / 127, ny = i8[o + 13] / 127, nz = i8[o + 14] / 127;
      let tx = t1[k * 3], ty = t1[k * 3 + 1], tz = t1[k * 3 + 2];
      const d = nx * tx + ny * ty + nz * tz; tx -= nx * d; ty -= ny * d; tz -= nz * d;
      let l = Math.hypot(tx, ty, tz);
      if (l < 1e-9) { if (Math.abs(ny) < 0.9) { tx = nz; ty = 0; tz = -nx; } else { tx = 0; ty = -nz; tz = ny; } l = Math.hypot(tx, ty, tz) || 1; }
      tx /= l; ty /= l; tz /= l;
      const bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
      const w = bx * t2[k * 3] + by * t2[k * 3 + 1] + bz * t2[k * 3 + 2] < 0 ? 1 : -1;   // t2 = dP/dv (image down): flip to image up
      i8[o + 16] = Math.round(tx * 127); i8[o + 17] = Math.round(ty * 127); i8[o + 18] = Math.round(tz * 127); i8[o + 19] = w * 127;
    }
  },
  // face poses: each face_* clip sampled at its last key; only the nodes it animates are blended
  facePoses(asset, clips) {
    const out = {};
    for (const nm in clips) {
      const c = clips[nm], L = new Float32Array(asset.rest); c.sample(c.duration, L);
      const slots = [...new Set(c.ch.map(x => x.slot))].filter(s => { for (let k = 0; k < 10; k++) if (Math.abs(L[s * 10 + k] - asset.rest[s * 10 + k]) > 1e-5) return true; return false; });
      const vals = new Float32Array(slots.length * 10); slots.forEach((s, i) => vals.set(L.subarray(s * 10, s * 10 + 10), i * 10));
      out[nm] = { slots: Int32Array.from(slots), vals };
    }
    return out;
  },
  release(asset) {
    if (!asset || !asset.lods) return;
    for (const L of asset.lods) if (L) for (const p of L.parts) BurnsGL.freeGeo(p.geo);
    for (const T of asset.textures) { this.freeTex(T); T.blob = null; T.failed = true; }
    const i = this.assets.indexOf(asset); if (i >= 0) this.assets.splice(i, 1);
    if (typeof BurnsSkin !== 'undefined' && BurnsSkin.assets[asset.name] === asset) delete BurnsSkin.assets[asset.name];
  },
  // GPU memory of a textured asset (textures at their uploaded size with mips, plus the vertex/index buffers)
  memory(asset) {
    const tex = asset.textures.map(T => ({ name: T.name, w: T.w, h: T.h, mb: +(T.bytes / 1048576).toFixed(2) }));
    let geo = 0; for (const L of asset.lods) if (L) for (const p of L.parts) geo += p.geo.data.byteLength + p.geo.idx.byteLength;
    return { textures: tex, texMB: +(asset.textures.reduce((s, T) => s + T.bytes, 0) / 1048576).toFixed(2), geoMB: +(geo / 1048576).toFixed(2) };
  },

  /* ---- level of detail: distance from the camera to the hips (from the palette), ÷ scale, with hysteresis ---- */
  pickLod(R, A, P, shadow) {
    const lods = A.lods; let want = 0;
    if (this.forceLod !== null && this.forceLod !== undefined) want = this.forceLod;
    else {
      let st = this.lodState.get(P);
      if (!st || !shadow) {
        const k = A.hipSlot * 12, b = A.hipBind, cam = R.cam || { x: 0, y: 0, z: 0 };
        const x = P[k] * b[0] + P[k + 1] * b[1] + P[k + 2] * b[2] + P[k + 3], y = P[k + 4] * b[0] + P[k + 5] * b[1] + P[k + 6] * b[2] + P[k + 7], z = P[k + 8] * b[0] + P[k + 9] * b[1] + P[k + 10] * b[2] + P[k + 11];
        const s = Math.hypot(P[k], P[k + 4], P[k + 8]) || 1, d = Math.hypot(x - cam.x, y - cam.y, z - cam.z) / s, T = A.lodDist, h = BURNS_SKINPBR.HYST;
        if (!st) { st = { lod: d < T[0] ? 0 : d < T[1] ? 1 : 2, d }; this.lodState.set(P, st); }
        else {
          if (st.lod < 2 && d > T[st.lod] * (1 + h)) st.lod++;
          else if (st.lod > 0 && d < T[st.lod - 1] * (1 - h)) st.lod--;
          st.d = d;
        }
      }
      want = st.lod;
    }
    for (let L = Math.min(want, 2); L >= 0; L--) if (lods[L]) return L;
    return 0;
  },

  /* ---- programs ---- */
  ATTRIBS: ['aPos', 'aNrm', 'aFlag', 'aTan', 'aUV', 'aCol', 'aJ', 'aW']
};

const BURNS_GLSL_HEROFS = `precision highp float;
varying vec3 vW; varying vec3 vN; varying vec4 vTn; varying vec2 vUV; varying vec4 vC; varying vec2 vK; varying vec3 vL;
uniform sampler2D uBase, uORM, uNrm, uEm;
uniform vec4 uMat;    // x metallic, y normal scale (0 = no normal map), z alpha cutoff, w occlusion strength
uniform vec4 uMat2;   // x base alpha factor, y base texture size (px), z alpha to coverage, w -
uniform vec3 uEmF;
uniform vec4 uTint; uniform vec3 uRimC; uniform float uRim;
${BURNS_GLSL_LIGHT}
vec2 hEnvBRDF(float rough, float nv) {
  vec4 r = rough * vec4(-1.0, -0.0275, -0.572, 0.022) + vec4(1.0, 0.0425, 1.04, -0.04);
  float a004 = min(r.x * r.x, exp2(-9.28 * nv)) * r.x + r.y;
  return vec2(-1.04, 1.04) * a004 + r.zw;
}
vec3 hEnvLook(vec3 rf, float rough) {
#ifdef ENVMAP
  if (uEnvK > 0.5) return bEnv(rf, rough) * mix(0.55, 1.0, smoothstep(-0.35, 0.05, rf.y));
#endif
  return mix(uGnd * 1.1, uSky * 1.3, smoothstep(-0.15, 0.45, rf.y));
}
float hGGX(float nh, float a) { float a2 = a * a, d = nh * nh * (a2 - 1.0) + 1.0; return a2 / (3.14159 * d * d); }
float hVis(float nl, float nv, float r) { float k = (r + 1.0) * (r + 1.0) * 0.125; return 0.25 / ((nl * (1.0 - k) + k) * (nv * (1.0 - k) + k)); }
void main(){
  vec4 bt = texture2D(uBase, vUV);
#ifdef CUTOUT
  float alpha = bt.a * uMat2.x;
  bool a2c = uMat2.z > 0.5;
#ifdef DERIV
  vec2 tuv = vUV * uMat2.y, ddx = dFdx(tuv), ddy = dFdy(tuv);
  alpha *= 1.0 + max(0.0, 0.5 * log2(max(dot(ddx, ddx), dot(ddy, ddy)))) * 0.25;   // thin cards keep their coverage down the mips
  if (a2c) alpha = clamp((alpha - uMat.z) / max(fwidth(alpha), 0.0001) + 0.5, 0.0, 1.0);   // sharpened alpha to coverage
#endif
  if (a2c ? alpha < 0.004 : alpha < uMat.z) discard;
  if (!a2c) alpha = 1.0;
#else
  float alpha = 1.0;
#endif
  float isSkin = step(0.5, vK.x) * step(vK.x, 1.5), isCloth = step(1.5, vK.x) * step(vK.x, 2.5), isHair = step(2.5, vK.x);
  vec3 alb = bLin(bt.rgb) * bLin(vC.rgb);
  vec3 orm = texture2D(uORM, vUV).rgb;
  float ao = mix(1.0, orm.r, uMat.w);
  float rough = clamp(orm.g * vK.y, 0.04, 1.0), metal = clamp(orm.b * uMat.x, 0.0, 1.0);
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 T = normalize(vTn.xyz - N * dot(N, vTn.xyz) + vec3(0.0, 1e-5, 0.0));
  vec3 B = cross(N, T) * (vTn.w < 0.0 ? -1.0 : 1.0);
  vec3 n = N;
  if (uMat.y != 0.0) {
    vec3 nm = texture2D(uNrm, vUV).xyz * 2.0 - 1.0;
    nm.xy *= uMat.y;
    n = normalize(T * nm.x + B * nm.y + N * max(nm.z, 0.05));
  }
  vec3 v = normalize(uCam - vW);
#ifdef BUMP
  // cloth: the engine's fine weave within a few metres (bind-space, so it rides the body)
  if (isCloth > 0.5) {
    float cd = length(vW - uCam), wk = 1.0 - smoothstep(1.2, 4.0, cd);
    if (wk > 0.0) n = bBump(n, vW, sin(vL.x * 560.0 + vL.z * 210.0) * sin(vL.y * 600.0) * 0.07 * wk, 0.0018);
  }
#endif
  float nv = max(dot(n, v), 0.02);
  vec3 em = bLin(texture2D(uEm, vUV).rgb) * uEmF * (vC.a * 3.0);
  float e = clamp(max(em.r, max(em.g, em.b)) * 0.8, 0.0, 1.0);
  float sh = mix(bShadow(vW, N), 1.0, step(0.6, e));
  // diffuse: skin wraps red furthest and its shadow edge turns red (pre-integrated look); hair wraps softly
  vec3 wrap = mix(mix(vec3(0.2), vec3(0.5, 0.26, 0.17), isSkin), vec3(0.35), isHair);
  float nl = dot(n, uKeyD), nlp = max(nl, 0.0);
  vec3 dl = max((vec3(nl) + wrap) / (1.0 + wrap), 0.0);
  vec3 shs = mix(vec3(sh), pow(vec3(max(sh, 0.0001)), vec3(0.55, 1.05, 1.25)), isSkin);
  vec3 F0 = mix(vec3(mix(0.04, 0.028, isSkin)), alb, metal);
  vec3 dif = alb * (1.0 - metal);
  vec3 amb = mix(uGnd, uSky, n.y * 0.5 + 0.5);
  vec3 lm = texture2D(uLight, (vW.xz - uLm.xy) * uLm.zw).rgb;
  amb += bLin(lm) * (1.7 * exp(-max(vW.y, 0.0) * 0.14)) * (0.7 + 0.3 * max(n.y, 0.0));
  amb *= mix(vec3(1.0), vec3(1.06, 0.97, 0.93), isSkin);
  vec3 c = dif * (amb * ao + uKeyC * dl * shs);
  // sun specular: GGX; skin is never sharper than 0.36 and adds a tight oily lobe; hair is Kajiya-Kay along the strand (V)
  float rS = mix(rough, max(rough, 0.36), isSkin);
  vec3 h = normalize(uKeyD + v);
  float nh = max(dot(n, h), 0.0), vh = max(dot(v, h), 0.0), f5h = pow(1.0 - vh, 5.0);
  vec3 F = F0 + (1.0 - F0) * f5h;
  float a = max(rS * rS, 0.002), Dg = hGGX(nh, a);
  Dg = mix(Dg, 0.85 * Dg + 0.15 * hGGX(nh, a * 0.45), isSkin);
  vec3 spec = vec3(min(Dg * hVis(nlp, nv, rS), 24.0)) * F * nlp;
  if (isHair > 0.5) {
    vec3 t1 = normalize(B + n * 0.1), t2 = normalize(B - n * 0.15);
    float h1 = dot(t1, h), h2 = dot(t2, h);
    float s1 = pow(max(1.0 - h1 * h1, 0.0), 0.5 * mix(220.0, 40.0, rough)), s2 = pow(max(1.0 - h2 * h2, 0.0), 0.5 * mix(60.0, 16.0, rough));
    spec = (vec3(0.16 * s1) + alb * (0.9 * s2)) * smoothstep(-0.15, 0.35, nl);
  }
  c += uKeyC * spec * sh;
  c += isCloth * uKeyC * alb * pow(1.0 - nv, 4.0) * 0.35 * dl.g * sh;   // fabric sheen at grazing angles
  float gl = 1.0 - rS;
  for (int i = 0; i < NPL; i++) {
#ifdef GL2
    if (i >= uNPL) break;
#endif
    vec3 d = uPL[i].xyz - vW; float dlen = length(d);
    float at = max(1.0 - dlen / uPL[i].w, 0.0); at *= at;
    if (at <= 0.0) continue;
    vec3 ld = d / (dlen + 0.0001);
    float pd = dot(n, ld);
    vec3 pdl = max((vec3(pd) + wrap) / (1.0 + wrap), 0.0);
    c += uPC[i] * at * (dif * (0.18 + 0.82 * pdl) + F0 * pow(max(dot(n, normalize(ld + v)), 0.0), 8.0 + gl * 110.0) * (0.04 + gl * 0.8) * max(pd, 0.0));
  }
  vec3 rf = reflect(-v, n);
  vec2 ab = hEnvBRDF(rS, nv);
  c += hEnvLook(rf, rS) * (F0 * ab.x + ab.y) * ao * (1.0 - 0.6 * isHair);
  c += uRimC * pow(1.0 - nv, 2.5) * uRim;
  c += em * uEmB;
  c = mix(c, bLin(uTint.rgb), uTint.a);
  if (uTrip > 0.0) c = bTrip(c, vW);
  gl_FragColor = bOut(bFogMix(c, vW, e), alpha);
}`;
BurnsGL.addPrograms(function (G, P) {
  const MB = G.maxBones, A = BurnsSkinPBR.ATTRIBS, pre = (G.derivs ? '#define DERIV 1\n' : '');
  const vs = `#define MAXB ${MB}
attribute vec3 aPos; attribute vec3 aNrm; attribute float aFlag; attribute vec4 aTan; attribute vec2 aUV; attribute vec4 aCol; attribute vec4 aJ; attribute vec4 aW;
uniform mat4 uVP; uniform vec4 uB[MAXB * 3];
varying vec3 vW; varying vec3 vN; varying vec4 vTn; varying vec2 vUV; varying vec4 vC; varying vec2 vK; varying vec3 vL;
void main(){${BURNS_GLSL_SKINW_BLEND}
  vW = vec3(dot(r0, p), dot(r1, p), dot(r2, p));
  vN = vec3(dot(r0.xyz, aNrm), dot(r1.xyz, aNrm), dot(r2.xyz, aNrm));
  vTn = vec4(dot(r0.xyz, aTan.xyz), dot(r1.xyz, aTan.xyz), dot(r2.xyz, aTan.xyz), aTan.w);
  vUV = aUV; vC = aCol; vL = aPos;
  vK = vec2(mod(aFlag, 4.0), floor(aFlag / 4.0 + 0.01) / 63.0);
  gl_Position = uVP * vec4(vW, 1.0);
}`;
  P.hero = G.program(vs, pre + BURNS_GLSL_HEROFS, A);
  P.heroCut = G.program(vs, pre + '#define CUTOUT 1\n' + BURNS_GLSL_HEROFS, A);
  P.shHero = P.shHeroCut = null;
  if (P.shSkin) {
    const svs = cut => `#define MAXB ${MB}
attribute vec3 aPos; attribute vec2 aUV; attribute vec4 aJ; attribute vec4 aW; uniform mat4 uLVP; uniform vec4 uB[MAXB * 3];
${cut ? 'varying vec2 vUV;' : ''}
void main(){${BURNS_GLSL_SKINW_BLEND}
  ${cut ? 'vUV = aUV;' : ''}
  gl_Position = uLVP * vec4(dot(r0, p), dot(r1, p), dot(r2, p), 1.0);
}`;
    P.shHero = G.program(svs(false), `precision mediump float; void main(){ gl_FragColor = vec4(1.0); }`, A);
    P.shHeroCut = G.program(svs(true), pre + `precision highp float; varying vec2 vUV; uniform sampler2D uBase; uniform vec4 uCut;   // x cutoff, y alpha factor, z texture size
void main(){
  float a = texture2D(uBase, vUV).a * uCut.y;
#ifdef DERIV
  vec2 t = vUV * uCut.z, dx = dFdx(t), dy = dFdy(t);
  a *= 1.0 + max(0.0, 0.5 * log2(max(dot(dx, dx), dot(dy, dy)))) * 0.25;
#endif
  if (a < uCut.x) discard;
  gl_FragColor = vec4(1.0);
}`, A);
  }
});
BurnsGL.layoutHero = function () {   // the 36-byte textured weighted vertex
  const gl = this.gl, S = BURNS_SKINPBR.STRIDE;
  this.enable(8);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, S, 0);
  gl.vertexAttribPointer(1, 3, gl.BYTE, true, S, 12);
  gl.vertexAttribPointer(2, 1, gl.UNSIGNED_BYTE, false, S, 15);
  gl.vertexAttribPointer(3, 4, gl.BYTE, true, S, 16);
  gl.vertexAttribPointer(4, 2, gl.UNSIGNED_SHORT, true, S, 20);
  gl.vertexAttribPointer(5, 4, gl.UNSIGNED_BYTE, true, S, 24);
  gl.vertexAttribPointer(6, 4, gl.UNSIGNED_BYTE, false, S, 28);
  gl.vertexAttribPointer(7, 4, gl.UNSIGNED_BYTE, true, S, 32);
};

/* ---------------- renderer ---------------- */
// a new pass id whenever a pass (re)starts its skinned section, so each hero program re-applies the lighting uniforms once
(function () {
  const P = BurnsRenderer.prototype;
  if (P.skinHero) return;
  for (const m of ['begin', 'shadowBegin', 'skinBegin']) {
    const base = P[m];
    P[m] = function () { BurnsSkinPBR.pass++; return base.apply(this, arguments); };
  }
  const baseW = P.skinW;
  // textured heroes ride on the §6.9 entry point: every caller of R.skinW (BurnsSkin, BurnsSkinActor, Art Cart drivers)
  // draws them unchanged; untextured geometry goes to the original function exactly as before
  P.skinW = function (geo, palette, n, tint, face, rim) {
    if (geo && geo.skinPbr) return this.skinHero(geo.skinPbr, palette, n, tint, face, rim);
    return baseW.call(this, geo, palette, n, tint, face, rim);
  };
})();
BurnsRenderer.prototype.skinHero = function (A, palette, n, tint, face, rim) {
  const G = BurnsGL, gl = G.gl, P = G.progs, X = BurnsSkinPBR, U = BURNS_SKINPBR.UNITS; if (!gl || !P) return;
  if (n > G.maxBones) { if (!this._hWarned) { this._hWarned = true; console.warn('BurnsSkinPBR: ' + n + ' joints exceed the palette (' + G.maxBones + ')'); } return; }
  const shadow = this.pass === 'shadow', lod = X.pickLod(this, A, palette, shadow), L = A.lods[lod];
  if (!L) return;
  const bones = n * 12 === palette.length ? palette : palette.subarray(0, n * 12);
  const u32ok = G.gl2 || (G._u32 === undefined ? (G._u32 = !!gl.getExtension('OES_element_index_uint')) : G._u32);
  let cur = null;
  const use = (p, setup) => { if (cur === p) return; gl.useProgram(p.p); if (p._pass !== X.pass || p._gen !== G.gen) { setup(p); p._pass = X.pass; p._gen = G.gen; } gl.uniform4fv(p.u.uB, bones); cur = p; };
  const bindTex = (unit, T, fb) => { gl.activeTexture(gl.TEXTURE0 + unit); const t = X.texOf(T); gl.bindTexture(gl.TEXTURE_2D, t || fb); return !!t; };
  if (!X._white || X._whiteGen !== G.gen) { X._white = G.rawTexture(2, 2, new Uint8Array(16).fill(255)); X._whiteGen = G.gen; }
  for (const part of L.parts) {
    const geo = part.geo, M = part.mat, cut = M.cutoff >= 0;
    let a2c = false;
    if (geo.u32 && !u32ok) continue;
    if (shadow) {
      const p = cut ? P.shHeroCut : P.shHero; if (!p) continue;
      use(p, q => gl.uniformMatrix4fv(q.u.uLVP, false, this.LVP));
      if (cut) { bindTex(U.base, M.tex.base, X._white); gl.uniform1i(p.u.uBase, U.base); gl.uniform4f(p.u.uCut, M.cutoff, M.alphaK, M.tex.base && M.tex.base.w || 1024, 0); }
    } else {
      const p = cut ? P.heroCut : P.hero; if (!p) continue;
      use(p, q => {
        this.applyEnv(q, this._wEnv || this.envRef, this._wWorld);
        gl.uniform1i(q.u.uBase, U.base); gl.uniform1i(q.u.uORM, U.orm); gl.uniform1i(q.u.uNrm, U.normal); gl.uniform1i(q.u.uEm, U.emissive);
        gl.uniform3fv(q.u.uRimC, this.lin.rim);
      });
      if (tint) gl.uniform4f(p.u.uTint, tint[0], tint[1], tint[2], tint[3]); else gl.uniform4f(p.u.uTint, 0, 0, 0, 0);
      gl.uniform1f(p.u.uRim, (rim === undefined ? 0.35 : rim) * 0.6);
      const T = M.tex;
      bindTex(U.base, T.base, X._white); bindTex(U.orm, T.orm, X._white);
      const hasN = bindTex(U.normal, T.normal, BurnsPBR.flatNormal()); bindTex(U.emissive, T.emissive, X._white);
      gl.uniform4f(p.u.uMat, M.metal, hasN ? M.nScale || 1e-3 : 0, M.cutoff, T.orm ? M.aoK : 0);
      gl.uniform3f(p.u.uEmF, M.em[0], M.em[1], M.em[2]);
      if (cut) { a2c = gl.getParameter(gl.SAMPLES) > 0; gl.uniform4f(p.u.uMat2, M.alphaK, T.base && T.base.w || 1024, a2c ? 1 : 0, 0); }
    }
    gl.activeTexture(gl.TEXTURE0);
    G.geo(geo);
    gl.bindBuffer(gl.ARRAY_BUFFER, geo.vbo); G.layoutHero();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geo.ibo);
    if (shadow) {
      gl.drawElements(gl.TRIANGLES, geo.count, geo.u32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
      this.stats.shDraws++; this.shadowStats += geo.count / 3; X.n.shDraws++; if (cut) X.n.shCut++;
    } else {
      if (M.doubleSided) gl.disable(gl.CULL_FACE);
      if (a2c) { gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE); gl.colorMask(true, true, true, false); }
      gl.drawElements(gl.TRIANGLES, geo.count, geo.u32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
      if (a2c) { gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE); gl.colorMask(true, true, true, true); X.n.a2c++; }
      if (M.doubleSided) gl.enable(gl.CULL_FACE);
      this.stats.draws++; this.stats.tris += geo.count / 3; X.n.draws++; if (cut) X.n.cut++;
    }
  }
  if (!shadow) X.n.lod[lod]++;
  // leave things as R.skinW does: the rigid skin program bound, five attributes, unit 0 active; and make BurnsPBR rebind
  G.enable(5);
  gl.activeTexture(gl.TEXTURE0);
  if (shadow) { if (P.shSkin) gl.useProgram(P.shSkin.p); } else if (P.skin) gl.useProgram(P.skin.p);
  if (this._pbr) { this._pbr.prog = null; this._pbr.mat = null; }
};

/* ---------------- face: blink, talk, smile from face_* pose clips ---------------- */
class BurnsFace {
  constructor(asset) {
    this.poses = asset.face; this.w = {}; this.set_ = {}; this.auto = true;
    for (const k in this.poses) this.w[k] = 0;
    this.seed = (asset.name.length * 7919 + 13) >>> 0; this.next = this.rand(1, 3); this.blinkT = -1; this.talkT = 0; this.talking = false; this.ph = 0;
  }
  rand(a, b) { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return a + (b - a) * (this.seed / 4294967296); }
  has(name) { return !!this.poses[name]; }
  blink() { this.blinkT = 0; return this; }
  talk(on) { this.talking = !!on; if (!on) this.talkT = 0; return this; }
  say(seconds) { this.talkT = Math.max(this.talkT, seconds || 1.5); return this; }
  // a manual weight (0..1) for any face pose (smile, jaw, blink, …); null hands it back to the automatic driver
  set(name, w) { if (w === null || w === undefined) delete this.set_[name]; else this.set_[name] = clamp(w, 0, 1); return this; }
  update(dt, ch) {
    if (this.auto) { this.next -= dt; if (this.next <= 0 && this.blinkT < 0) { this.blinkT = 0; this.next = this.rand(BURNS_SKINPBR.BLINK[0], BURNS_SKINPBR.BLINK[1]); } }
    let b = 0;
    if (this.blinkT >= 0) { this.blinkT += dt; const t = this.blinkT; b = t < 0.07 ? t / 0.07 : t < 0.1 ? 1 : Math.max(0, 1 - (t - 0.1) / 0.09); if (t > 0.19) this.blinkT = -1; }
    if (this.talkT > 0) this.talkT -= dt;
    const talking = this.talkT > 0 || this.talking || (this.auto && ch && ch.anim && ch.anim.name === 'talk');
    this.ph += dt;
    const jt = talking ? 0.25 + 0.75 * Math.abs(Math.sin(this.ph * 10.7) * Math.sin(this.ph * 4.1 + 1.3)) : 0;
    this.w.blink = b; this.w.jaw = (this.w.jaw || 0) + (jt - (this.w.jaw || 0)) * Math.min(1, dt * 20);
    if (this.poses.talk) this.w.talk = this.w.jaw;
  }
  apply(L) {
    for (const k in this.poses) {
      const w = this.set_[k] !== undefined ? this.set_[k] : this.w[k] || 0; if (w <= 0.001) continue;
      const P = this.poses[k], S = P.slots, V = P.vals;
      for (let i = 0; i < S.length; i++) {
        const o = S[i] * 10, q = i * 10;
        for (let c = 0; c < 3; c++) { L[o + c] += (V[q + c] - L[o + c]) * w; L[o + 7 + c] += (V[q + 7 + c] - L[o + 7 + c]) * w; }
        let x1 = V[q + 3], y1 = V[q + 4], z1 = V[q + 5], w1 = V[q + 6];
        if (x1 * L[o + 3] + y1 * L[o + 4] + z1 * L[o + 5] + w1 * L[o + 6] < 0) { x1 = -x1; y1 = -y1; z1 = -z1; w1 = -w1; }
        const x = L[o + 3] + (x1 - L[o + 3]) * w, y = L[o + 4] + (y1 - L[o + 4]) * w, z = L[o + 5] + (z1 - L[o + 5]) * w, ww = L[o + 6] + (w1 - L[o + 6]) * w, l = Math.hypot(x, y, z, ww) || 1;
        L[o + 3] = x / l; L[o + 4] = y / l; L[o + 5] = z / l; L[o + 6] = ww / l;
      }
    }
  }
}
// the face rides on the skeleton: poses applied after the clips, before the palette (assets without face_* clips: untouched)
(function () {
  const SC = BurnsSkeleton.prototype, baseC = SC.compute;
  SC.compute = function () { if (this.face) this.face.apply(this.local); return baseC.call(this); };
  const CC = BurnsSkinnedChar.prototype, baseU = CC.update;
  CC.update = function (dt) { baseU.call(this, dt); if (this.asset.face) { const f = this.sk.face || (this.sk.face = new BurnsFace(this.asset)); f.update(dt, this); } };
  Object.defineProperty(CC, 'faceCtl', { get() { return this.asset.face ? (this.sk.face || (this.sk.face = new BurnsFace(this.asset))) : null; } });
})();

/* ---------------- loading: the textured path switches on by itself ---------------- */
(function () {
  const baseLoad = BurnsSkin.load, basePre = BurnsSkin.preload;
  BurnsSkin.load = function (D, opts) {
    if (BurnsSkinPBR.wants(D)) { const a = BurnsSkinPBR.build(D, opts); this.assets[a.name] = a; return a; }
    return baseLoad.call(this, D, opts);
  };
  // preload resolves once a textured asset's images are decoded too (untextured assets resolve exactly as before)
  BurnsSkin.preload = function (url, name) { return basePre.call(this, url, name).then(a => a && a.texReady ? a.texReady : a); };
})();
Object.assign(BurnsSkinPBR, {
  /* the face controller of a BurnsSkinnedChar, of a BurnsChar drawn through BurnsSkinActor (ch._skinActor), or of the
     current player ('brady'); null when that character's asset has no face poses. face.blink(), face.say(seconds),
     face.talk(true|false), face.set('smile', 0.7), face.auto = false */
  face(x) {
    let S = null;
    if (x === 'brady' || x === 'player') { const s = BurnsSkin.scene(); x = s && s.player && s.player.ch; }
    if (x instanceof BurnsSkinnedChar) S = x; else if (x && x._skinActor) S = x._skinActor.S;
    return S ? S.faceCtl : null;
  },
  // a world-local hero: released with that world (BurnsScenes.releaseWorld); app-wide heroes (BurnsSkinActor) persist
  preloadFor(scene, url, name) { return BurnsSkin.preload(url, name).then(a => { if (a && a.textured && !a.owner) a.owner = scene; return a; }); },
  stats() {
    return {
      counters: JSON.parse(JSON.stringify(this.n)), tier: BurnsGL.tier, texSize: this.texSize(),
      assets: this.assets.map(a => ({ name: a.name, nb: a.nb, lods: a.lods.map(L => L ? { tris: L.tris, nv: L.nv, draws: L.parts.length, parts: L.parts.map(p => p.name + (p.mat.cutoff >= 0 ? ' [cutout]' : '') + (p.mat.e > 0 ? ' [glow]' : '')) } : null), lodDist: a.lodDist, face: a.face ? Object.keys(a.face) : [], clips: a.clipNames.length, memory: this.memory(a) }))
    };
  }
});
if (typeof window !== 'undefined') {
  window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsSkinPBR, BurnsFace, BURNS_SKINPBR });
  setTimeout(() => {
    const B = window.BRADY_BURNS;
    if (B && B.debug) {
      B.debug.skinPbr = () => BurnsSkinPBR.stats();
      // load a hero file by URL (test fixtures are served beside the app, never in models/) and optionally put it in
      // BurnsSkinActor's place for 'brady' or 'chinka'
      B.debug.skinHero = (url, o) => BurnsSkin.preload(url, (o && o.name) || undefined).then(a => {
        if (o && o.as && typeof BurnsSkinActor !== 'undefined') { BurnsSkinActor.assets[o.as] = a; BurnsSkinActor.standIn[o.as] = false; }
        return { name: a.name, textured: !!a.textured, tris: a.tris, nb: a.nb, clips: a.clipNames.slice() };
      });
    }
    // world-local heroes go with their world
    if (typeof BurnsScenes !== 'undefined' && !BurnsScenes.releaseWorld.__hero) {
      const rel = BurnsScenes.releaseWorld;
      BurnsScenes.releaseWorld = function (scene) { const r = rel.apply(this, arguments); for (const a of BurnsSkinPBR.assets.slice()) if (a.owner && a.owner === scene) BurnsSkinPBR.release(a); return r; };
      BurnsScenes.releaseWorld.__hero = true;
    }
  }, 0);
}
