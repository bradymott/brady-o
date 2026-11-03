/* ============================================================
   BRADY GOES TO BURNING MAN — Blender-made static props (.glb)
   BurnsGLBProps fetches models/<stem>.glb.gz (built by tools/blender/bm_<prop>.py
   through tools/build.js) and swaps them in for the procedural props in
   src/40_burns_e_props.js: `api.prop('rv' | 'bus' | 'dome' | 'portapotty' | 'shade')`,
   the traffic vehicles and Root Society's tipis (bcmTipi) all keep working, and a
   new `api.prop('tipi', {r, h, canvas, band, band2})` exists too. The glb's
   triangles are appended to the world's static chunk through BurnsGLTF.emit, so
   AO baking, chunking, LOD builds and the colliders are unchanged: the wrapper
   returns the same {cols, lights, top, len, w} the procedural builder does, and the
   procedural builder is still used for low-detail builds (m.lo / opts.lo), for
   sizes the model doesn't cover, on file:// pages, and until the models arrive.
   See docs/BURNS_GUIDE.md §5.1.
   ============================================================ */
// prop kind -> file stem under models/ (assets/models/burning-man/<stem>.glb)
const BURNS_GLB_PROPS = { rv: 'rv', bus: 'bus', dome: 'dome', tipi: 'tipi', portapotty: 'potty', shade: 'shade' };

/* ---- BurnsGLTF.emit: append a glb's triangles to a BurnsMesh under its current transform ---- */
// once per doc: every primitive baked to file space (node world matrices applied), grouped by root node name
BurnsGLTF.flatten = function (D) {
  if (D._flat) return D._flat;
  const J = D.json, nodes = J.nodes || [], roots = {}, names = [];
  let tris = 0, nv = 0;
  for (const r of D.roots) {
    const name = nodes[r].name || ('node' + r), prims = [];
    this.walk(D, r, ni => {
      const N = nodes[ni]; if (N.mesh === undefined) return;
      const W = this.nodeWorld(D, ni), NM = this.normalMat(W), nm = NM.n, flip = NM.det < 0;
      for (const pr of (J.meshes[N.mesh].primitives || [])) {
        if (pr.mode !== undefined && pr.mode !== 4) continue;
        if (pr.attributes.POSITION === undefined) continue;
        const pos = this.accessor(D, pr.attributes.POSITION), n = pos.count, nrm = pr.attributes.NORMAL !== undefined ? this.accessor(D, pr.attributes.NORMAL) : null;
        const P = new Float32Array(n * 3), Nn = new Float32Array(n * 3);
        for (let k = 0; k < n; k++) {
          const x = pos.array[k * 3], y = pos.array[k * 3 + 1], z = pos.array[k * 3 + 2];
          P[k * 3] = W[0] * x + W[4] * y + W[8] * z + W[12]; P[k * 3 + 1] = W[1] * x + W[5] * y + W[9] * z + W[13]; P[k * 3 + 2] = W[2] * x + W[6] * y + W[10] * z + W[14];
          if (nrm) {
            const a = nrm.array[k * 3], c = nrm.array[k * 3 + 1], d = nrm.array[k * 3 + 2];
            let nx = nm[0] * a + nm[1] * c + nm[2] * d, ny = nm[3] * a + nm[4] * c + nm[5] * d, nz = nm[6] * a + nm[7] * c + nm[8] * d;
            const l = (Math.hypot(nx, ny, nz) || 1) * (flip ? -1 : 1); Nn[k * 3] = nx / l; Nn[k * 3 + 1] = ny / l; Nn[k * 3 + 2] = nz / l;
          }
        }
        const ind = pr.indices !== undefined ? this.accessor(D, pr.indices).array : null, ni2 = ind ? ind.length : n;
        const idx = new Uint32Array(ni2 - ni2 % 3);
        for (let k = 0; k + 2 < ni2; k += 3) { const a = ind ? ind[k] : k, c = ind ? ind[k + 1] : k + 1, d = ind ? ind[k + 2] : k + 2; idx[k] = a; idx[k + 1] = flip ? d : c; idx[k + 2] = flip ? c : d; }
        if (!nrm) {   // no normals in the file: flat shading from the faces (shared corners average)
          for (let k = 0; k + 2 < idx.length; k += 3) {
            const a = idx[k], c = idx[k + 1], d = idx[k + 2], ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
            const ux = P[c * 3] - ax, uy = P[c * 3 + 1] - ay, uz = P[c * 3 + 2] - az, vx = P[d * 3] - ax, vy = P[d * 3 + 1] - ay, vz = P[d * 3 + 2] - az;
            const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
            for (const q of [a, c, d]) { Nn[q * 3] += fx; Nn[q * 3 + 1] += fy; Nn[q * 3 + 2] += fz; }
          }
          for (let k = 0; k < n; k++) { const l = Math.hypot(Nn[k * 3], Nn[k * 3 + 1], Nn[k * 3 + 2]) || 1; Nn[k * 3] /= l; Nn[k * 3 + 1] /= l; Nn[k * 3 + 2] /= l; }
        }
        const mat = this.material(D, pr.material), colA = pr.attributes.COLOR_0 !== undefined ? this.accessor(D, pr.attributes.COLOR_0) : null;
        let vcol = null;
        if (colA) { vcol = new Float32Array(n * 3); for (let k = 0; k < n; k++) for (let c = 0; c < 3; c++) vcol[k * 3 + c] = this.comp(colA, k, c); }
        prims.push({ P, N: Nn, idx, nv: n, col: [this.srgb8(mat.col[0]), this.srgb8(mat.col[1]), this.srgb8(mat.col[2])], lin: mat.col, gloss: mat.gloss, e: mat.e, name: mat.name.replace(/^bv_/, ''), vcol });
        tris += idx.length / 3; nv += n;
      }
    });
    if (prims.length) { roots[name] = prims; names.push(name); }
  }
  return (D._flat = { roots, names, tris, nv });
};
// Append the model's triangles to BurnsMesh m at its current transform (plus opts.at / yaw / scale), written through
// m.vert like a procedural prop, with each material's colour, gloss and emissive as rig() maps them.
//   opts: { roots: [root node names] (default all), at: [x, y, z], yaw, scale: s | [sx, sy, sz],
//           colors: { <material name without 'bv_'>: '#hex' | { col, e, gloss } } }   (recolours a material)
// Returns the number of triangles written.
BurnsGLTF.emit = function (m, doc, opts) {
  opts = opts || {};
  const F = this.flatten(doc), names = opts.roots || F.names, colors = opts.colors || null;
  const s = opts.scale === undefined ? 1 : opts.scale, sx = Array.isArray(s) ? s[0] : s, sy = Array.isArray(s) ? s[1] : s, sz = Array.isArray(s) ? s[2] : s;
  const at = opts.at || [0, 0, 0];
  const wr = BURNS_ATLAS.white, wu = (wr.u0 + wr.u1) / 2, wv = (wr.v0 + wr.v1) / 2;
  const p = [0, 0, 0], n = [0, 0, 0], tc = [0, 0, 0];
  let tris = 0;
  m.push(); m.tf(at[0], at[1], at[2], opts.yaw || 0, 0, 0, sx, sy, sz);
  for (const name of names) {
    const prims = F.roots[name]; if (!prims) continue;
    for (const pr of prims) {
      let col = pr.col, e = pr.e, gloss = pr.gloss;
      const ov = colors && colors[pr.name];
      if (ov) {
        if (typeof ov === 'string') col = burnsRGB(ov);
        else { if (ov.col) col = burnsRGB(ov.col); if (ov.e !== undefined) e = ov.e; if (ov.gloss !== undefined) gloss = ov.gloss; }
      }
      m.c = col; m.e = e; m.gloss = gloss;
      const base = m.nv, P = pr.P, N = pr.N, V = pr.vcol;
      for (let k = 0; k < pr.nv; k++) {
        m.tp(P[k * 3], P[k * 3 + 1], P[k * 3 + 2], p); m.tn(N[k * 3], N[k * 3 + 1], N[k * 3 + 2], n);
        if (V) { tc[0] = Math.round(col[0] * V[k * 3]); tc[1] = Math.round(col[1] * V[k * 3 + 1]); tc[2] = Math.round(col[2] * V[k * 3 + 2]); m.c = tc; }
        m.vert(p[0], p[1], p[2], n[0], n[1], n[2], wu, wv);
      }
      const idx = pr.idx; for (let k = 0; k < idx.length; k++) m.ind.push(base + idx[k]);
      tris += idx.length / 3;
    }
  }
  m.pop();
  return tris;
};

/* ---- the loader and the prop wrappers ---- */
const BurnsGLBProps = {
  docs: {},            // kind -> parsed glb doc
  ready: false,        // models fetched (or decided against) and the wrappers installed
  count: 0,            // props built from a glb since boot
  fallbacks: 0,        // props built procedurally by a wrapped builder (lo builds, odd sizes, model missing)
  orig: {},            // kind -> the procedural builder
  _p: null,
  base() { return 'models/'; },
  // off switch for comparisons and tests: window.__burnsNoGLBProps = true keeps every prop procedural
  off() { return typeof window !== 'undefined' && !!window.__burnsNoGLBProps; },
  stats() { return { ready: this.ready, loaded: Object.keys(this.docs), count: this.count, fallbacks: this.fallbacks }; },
  preload() {
    if (this._p) return this._p;
    if (typeof BurnsGLTF === 'undefined' || typeof fetch !== 'function' || (typeof location !== 'undefined' && location.protocol === 'file:')) { this.install(); this.ready = true; return (this._p = Promise.resolve()); }
    this._p = fetch(this.base() + 'index.json').then(r => r.ok ? r.json() : []).catch(() => []).then(list => {
      const have = new Set(Array.isArray(list) ? list : []), jobs = [];
      for (const [kind, stem] of Object.entries(BURNS_GLB_PROPS)) {
        let file = stem + '.glb';
        if (have.has(file + '.gz') && BurnsGLTF.canInflate()) file += '.gz';
        else if (!have.has(file)) continue;
        jobs.push(BurnsGLTF.fetch(this.base() + file)
          .then(doc => { const F = BurnsGLTF.flatten(doc); if (F.nv > 60000) throw new Error('too many vertices (' + F.nv + ')'); this.docs[kind] = doc; })
          .catch(e => { console.warn('glb prop ' + kind + ' failed: ' + (e && e.message || e)); }));
      }
      return Promise.all(jobs);
    }).then(() => { this.install(); this.ready = true; });
    return this._p;
  },
  // wrap the procedural builders: a glb when it's loaded and fits, the original otherwise
  install() {
    if (this._installed || typeof BurnsProps === 'undefined') return; this._installed = true;
    const G = this;
    for (const kind of Object.keys(this.build)) {
      const orig = BurnsProps[kind] || null; this.orig[kind] = orig;
      BurnsProps[kind] = function (m, o) {
        o = o || {};
        const doc = G.docs[kind];
        if (!doc || m.lo || o.lo || o.glb === false || G.off()) { G.fallbacks++; return orig ? orig.call(this, m, o) : G.plain[kind].call(this, m, o); }
        const out = G.build[kind].call(this, m, o, doc);
        if (out === null) { G.fallbacks++; return orig ? orig.call(this, m, o) : G.plain[kind].call(this, m, o); }
        G.count++; return out;
      };
    }
    // Root Society's tipis are drawn by bcmTipi(m, x, z, yaw, o) (src/41_burns_camps.js): same swap
    if (typeof bcmTipi === 'function') {
      const origTipi = bcmTipi;
      G.origTipi = origTipi;
      bcmTipi = function (m, x, z, yaw, o) {
        o = o || {};
        if (!G.docs.tipi || m.lo || o.lo || o.glb === false || G.off()) { G.fallbacks++; return origTipi(m, x, z, yaw, o); }
        m.push(); m.tf(x, 0, z, yaw); G.build.tipi.call(BurnsProps, m, o, G.docs.tipi); m.pop(); G.count++;
      };
    }
  },
  // procedural fallbacks for kinds e_props doesn't have (the tipi)
  plain: {
    tipi(m, o) {
      const r = o.r || 2.6, h = o.h || 5.6;
      if (typeof BurnsGLBProps.origTipi === 'function') BurnsGLBProps.origTipi(m, 0, 0, 0, o);
      else { m.color(o.canvas || o.col || '#ece0c4'); m.lathe([[r, 0], [r * 0.66, h * 0.36], [0, h * 0.96]], { seg: 16 }); }
      return BurnsGLBProps.tipiInfo(r, h);
    }
  },
  tipiInfo(r, h) {
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: r * 0.78, y0: 0, y1: h * 0.5 }], lights: [{ x: 0, y: h * 1.03, z: 0, s: 0.9, c: '#ffd890' }, { x: 0, y: 1.5, z: r * 0.88, s: 0.5, c: '#ffd890' }, { x: 0, y: 0, z: 0, s: 0, c: '#ffb070', pool: r * 2.2, i: 0.35 }], top: h };
  },
  /* the glb builders: same signature as BurnsProps.<kind>(m, o) plus the doc; return null to fall back.
     Each keeps the procedural prop's footprint, origin and collider descriptors. */
  build: {
    rv(m, o, doc) {
      const r = this.rngFor(o), L = 9.6, W = 2.5, H = 3.3, zf = L / 2, zb = -L / 2;
      const col = o.col || r.pick(['#f2ece0', '#ece6da', '#f4f4f0', '#e8e0cc']);
      BurnsGLTF.emit(m, doc, { colors: { body: col, cab: o.cabCol || col, trim1: r.pick(['#c83a2a', '#2a5aa8', '#d8a020', '#3a8a5a']) } });
      const cols = [
        { t: 'box', x: 0, z: (zb + zf - 0.6) / 2, hx: W / 2, hz: (zf - 0.6 - zb) / 2, y0: 0, y1: H, cover: true },
        { t: 'box', x: 0, z: zf - 0.45, hx: W / 2 - 0.1, hz: 0.48, y0: 0, y1: 1.45 },
        { t: 'box', x: -0.2, z: zb - 0.3, hx: 0.9, hz: 0.3, y0: 0, y1: 1.05 }
      ];
      const lights = [{ x: 0.85, y: 1.12, z: zf + 0.1, s: 1.1, c: '#fff0c8', beam: 0 }, { x: -0.85, y: 1.12, z: zf + 0.1, s: 1.1, c: '#fff0c8', beam: 0 }, { x: 1.0, y: 1.0, z: zb - 0.1, s: 0.8, c: '#ff3020' }, { x: -1.0, y: 1.0, z: zb - 0.1, s: 0.8, c: '#ff3020' }];
      return { cols, lights, top: H, len: L, w: W, glb: true };
    },
    bus(m, o, doc) {
      const r = this.rngFor(o), L = 11, W = 2.5, H = 3.1, zf = L / 2, zb = -L / 2;
      const base = o.col || r.pick(['#e8b020', '#9a6bff', '#3aa0a0', '#ff4f8a']);
      BurnsGLTF.emit(m, doc, { colors: { body: base, belt: r.pick(['#2a4a8a', '#1a1a2a', '#7a2a5a', '#2a6a4a']), couch: r.pick(['#a02a5a', '#2a6a8a', '#8a6a2a']) } });
      const cols = [
        { t: 'box', x: 0, z: -0.4, hx: W / 2, hz: (L - 0.8) / 2, y0: 0, y1: H + 0.1, cover: true },
        { t: 'box', x: 0, z: zf - 0.6, hx: W / 2 - 0.05, hz: 0.6, y0: 0, y1: 1.47 },
        { t: 'box', x: 0, z: -2.4, hx: 0.9, hz: 0.45, y0: H, y1: H + 0.6 }
      ];
      return { cols, lights: [{ x: 0.85, y: 1.15, z: zf + 0.1, s: 1.1, c: '#fff0c8', beam: 0 }, { x: -0.85, y: 1.15, z: zf + 0.1, s: 1.1, c: '#fff0c8', beam: 0 }], top: H + 0.1, len: L, w: W, glb: true };
    },
    portapotty(m, o, doc) {
      const col = o.col || '#2a6ac8';
      BurnsGLTF.emit(m, doc, { colors: { body: col, door: shade(col, -0.18), led_2ac84a: o.occupied ? '#c82a2a' : '#2ac84a' } });
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.62, hz: 0.62, y0: 0, y1: 2.46, cover: true }], lights: [], top: 2.46, glb: true };
    },
    shade(m, o, doc) {
      const w = o.w || 5, d = o.d || 5, h = o.h || 2.9, col = o.col || '#d8c8a8', W0 = 5, D0 = 5, H0 = 2.9;
      if (w > 14 || d > 14 || h > 4.5 || h < 2.0) return null;   // the big gate canopies keep the procedural build
      BurnsGLTF.emit(m, doc, { roots: ['body'], scale: [w / W0, 1, d / D0], at: [0, h - H0, 0], colors: { cover: col } });
      for (const [sx, sz, yaw] of [[1, 1, 0], [1, -1, Math.PI / 2], [-1, 1, -Math.PI / 2], [-1, -1, Math.PI]]) {
        const at = [sx * (w / 2 - 0.1), 0, sz * (d / 2 - 0.1)];
        BurnsGLTF.emit(m, doc, { roots: ['pole'], scale: [1, h / H0, 1], at });
        BurnsGLTF.emit(m, doc, { roots: ['guy'], scale: [1, h / H0, 1], at, yaw });
      }
      const lights = [];
      if (o.lights !== false) {
        BurnsGLTF.emit(m, doc, { roots: ['lights'], scale: [w / W0, 1, 1], at: [0, h - H0, (d - D0) / 2] });
        for (let i = 0; i < 10; i += 2) { const t = i / 9; lights.push({ x: -w / 2 + t * w, y: h - 0.15 - Math.sin(t * Math.PI) * 0.3, z: d / 2, s: 0.4, c: BURNS_NEON[i % 7] }); }
      }
      lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ffb070', pool: Math.max(w, d) * 0.9 });
      return { cols: [{ t: 'box', x: 0, z: 0, hx: w / 2 + 0.1, hz: d / 2 + 0.1, y0: h - 0.02, y1: h + 0.06 }, ...[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => ({ t: 'cyl', x: sx * (w / 2 - 0.1), z: sz * (d / 2 - 0.1), r: 0.08, y0: 0, y1: h, camPass: true }))], lights, top: h + 0.06, glb: true };
    },
    dome(m, o, doc) {
      if (o.frame === false) return null;   // the old solid shell is asked for by name
      const r = o.r || 5, col = o.col || '#e8e0d0', R0 = 5;
      const colors = { cover: col, frame: o.frameCol || '#d4d4dc' };
      if (!o.lights) { colors.lit0 = colors.lit1 = colors.lit2 = { col, e: 0.15 }; }
      BurnsGLTF.emit(m, doc, { roots: ['body'], scale: r / R0, colors });
      BurnsGLTF.emit(m, doc, { roots: ['door'], at: [0, 0, r - 0.15] });
      return { cols: [{ t: 'dome', x: 0, z: 0, r: r, y0: 0, cover: true }], lights: [{ x: 0, y: 0, z: 0, s: 0, c: typeof o.glow === 'string' ? o.glow : (o.glow === true && typeof o.col === 'string' ? o.col : '#ff70c0'), pool: r * 1.6 }], top: r, glb: true };
    },
    tipi(m, o, doc) {
      const r = o.r || 2.6, h = o.h || 5.6, R0 = 2.6, H0 = 5.6;
      const colors = { canvas: o.canvas || o.col || '#ece0c4', band: o.band || '#8a4a2a', band2: o.band2 || '#2a6a5a' };
      BurnsGLTF.emit(m, doc, { scale: [r / R0, h / H0, r / R0], colors });
      if (o.pattern) o.pattern(m, r, h);
      const info = BurnsGLBProps.tipiInfo(r, h); info.glb = true; return info;
    }
  }
};
if (typeof window !== 'undefined') {
  window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsGLBProps });
  // start the fetch after boot (the title screen draws first); worlds entered before the models arrive stay procedural
  if (typeof BRADY_APP === 'undefined' || BRADY_APP === 'burningman') setTimeout(() => { try { BurnsGLBProps.preload(); } catch (e) { console.warn('glb props: ' + (e && e.message || e)); } }, 600);
}
