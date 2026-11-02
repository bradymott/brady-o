/* ============================================================
   ART CAR KART — an original kart-racing mode set at a desert
   arts festival. 8 art-car racers, 8 tracks in 2 cups, festival
   items, drifting with mini-turbos.

   Rendering: a WebGL1 view (sky shader, textured ground plane,
   road / barrier meshes, depth-sorted billboard sprites from a
   procedurally painted atlas) is drawn into an offscreen canvas
   and composited into the 2D game canvas; HUD and menus are 2D.
   Track data + track painting live in 31_kart_tracks.js.

   Entry point: new KartMenuScene()            (mode -> driver -> cup/track)
   Direct start: new KartRaceScene({ mode: 'gp'|'tt', cup: 'dust'|'fire',
     race: 0..3, track: id, racer: id, autoGas: bool, gp: {points, results} })
   Controls (via Input): stick/arrows steer (analog on touch), jump = hop +
     drift (release for a mini-turbo), action = item, down = brake/reverse,
     up = gas when auto-gas is off, pause = pause menu.
   Save: Save.data.kart = { trophies: {cupId: 1|2|3}, best: {trackId: {lap, total}},
     autoGas, racer }.
   Layout of this file: data -> matrices/atlas -> WebGL renderer -> track
   runtime -> sprite batch/view -> 2.5D sprite projector -> drivers -> art cars
   -> atlas jobs -> race simulation (physics, items, AI) -> race rendering, HUD
   and result screens -> icons/portraits/backdrop -> menu scene.
   ============================================================ */

/* ---------------- data ---------------- */
const KART_RACERS = [
  { id: 'brady', name: 'Brady', kart: 'Night Shade', tag: 'Neon on matte black', color: '#ff4fd8', stats: { speed: 4, accel: 3, handling: 3, weight: 3 } },
  { id: 'chinka', name: 'Chinka', kart: 'Sunset Sweetheart', tag: 'All heart, all speed', color: '#ff8a3a', stats: { speed: 3, accel: 4, handling: 4, weight: 2 } },
  { id: 'slothy', name: 'Slothy', kart: 'Hammock Hauler', tag: 'Slow is a lifestyle', color: '#7ac74f', stats: { speed: 4, accel: 1, handling: 3, weight: 5 } },
  { id: 'toadie', name: 'Toadie', kart: 'Lily Hopper', tag: 'Tiny. Twirly. Quick.', color: '#4adf8a', stats: { speed: 2, accel: 5, handling: 5, weight: 1 } },
  { id: 'theman', name: 'The Man', kart: 'Effigy Express', tag: 'Burns brightest, drives worst', color: '#ff5a2a', stats: { speed: 5, accel: 2, handling: 2, weight: 4 } },
  { id: 'hippie', name: 'Hippie', kart: 'Flower Power Van', tag: 'Peace, love, drift', color: '#ffd84a', stats: { speed: 3, accel: 3, handling: 4, weight: 3 } },
  { id: 'techbro', name: 'Tech Bro', kart: 'Disruptor Pod', tag: 'Moves fast, breaks things', color: '#38f2ff', stats: { speed: 4, accel: 5, handling: 2, weight: 2 } },
  { id: 'dpw', name: 'DPW', kart: 'Dust Hauler', tag: 'Built the road. Owns it.', color: '#ff9a3a', stats: { speed: 4, accel: 2, handling: 2, weight: 5 } }
];
const KART_ITEMS = {
  puke: { name: 'PUKE BALL', col: '#7dff4a' },
  tumble: { name: 'TUMBLEWEED', col: '#c8995a' },
  swarm: { name: 'MOSQUITO SWARM', col: '#ff4a5a' },
  glow: { name: 'GLOW RUSH', col: '#4affd2' },
  dust: { name: 'DUST CLOUD', col: '#e8d2a8' },
  disco: { name: 'DISCO SHIELD', col: '#ff9af0' },
  bufo: { name: 'BUFO LEAP', col: '#9ae04a' },
  water: { name: 'WATER BOTTLE', col: '#5ac8ff' }
};
const KART_ITEM_IDS = Object.keys(KART_ITEMS);
const KART_CUPS = [
  { id: 'dust', name: 'Dust Cup', tracks: ['esplanade', 'gateroad', 'deepplaya', 'temple'], col: '#f0c88a', col2: '#b07a3a' },
  { id: 'fire', name: 'Fire Cup', tracks: ['reno', 'hotsprings', 'duststorm', 'manburn'], col: '#ff7a3a', col2: '#c02a4a' }
];
const KART_POINTS = [15, 12, 10, 8, 6, 4, 2, 1];
const KART_LAPS = 3;
const KART_DIRS = 16;          // view angles per kart sprite
const KART_CELL = 128;         // atlas cell size for AI karts
const KART_HI = 320;           // hi-res cell size for the player's kart
const KART_PXM = 42;           // sprite pixels per metre at KART_CELL

// racers with an extra sprite pose: The Man throws his arms up when he grabs a gift box
const KART_POSES = { theman: ['up'] };
function kartRacer(id) { if (id === 'buzzkill') id = 'theman'; return KART_RACERS.find(r => r.id === id) || KART_RACERS[0]; }
function kartSave() {
  const d = Save.data;
  if (!d.kart || typeof d.kart !== 'object') d.kart = {};
  const k = d.kart;
  if (!k.trophies) k.trophies = {};
  if (!k.best) k.best = {};
  if (k.autoGas === undefined) k.autoGas = true;
  if (k.racer === 'buzzkill') k.racer = 'theman';   // the villain changed: Lord Buzzkill -> The Man
  if (!k.racer || !KART_RACERS.some(r => r.id === k.racer)) k.racer = 'brady';
  return k;
}
function kartFmtTime(t) {
  if (!isFinite(t) || t <= 0) return '--:--.--';
  const m = Math.floor(t / 60), s = t - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
}
function kartOrdinal(n) { return n + (n === 1 ? 'ST' : n === 2 ? 'ND' : n === 3 ? 'RD' : 'TH'); }
const kartWrapA = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
const kartSmooth = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

/* ---------------- matrices (column-major) ---------------- */
const KartM = {
  persp(o, fovy, asp, n, f) {
    const t = 1 / Math.tan(fovy / 2);
    o.fill(0); o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f);
    return o;
  },
  // fills o (view matrix) and basis {rx,ry,rz, ux,uy,uz, fx,fy,fz}
  lookAt(o, B, ex, ey, ez, tx, ty, tz) {
    let zx = ex - tx, zy = ey - ty, zz = ez - tz, l = Math.hypot(zx, zy, zz) || 1;
    zx /= l; zy /= l; zz /= l;
    let xx = zz, xy = 0, xz = -zx; l = Math.hypot(xx, xz) || 1; xx /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0;
    o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0;
    o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0;
    o[12] = -(xx * ex + xy * ey + xz * ez); o[13] = -(yx * ex + yy * ey + yz * ez); o[14] = -(zx * ex + zy * ey + zz * ez); o[15] = 1;
    B.rx = xx; B.ry = xy; B.rz = xz; B.ux = yx; B.uy = yy; B.uz = yz; B.fx = -zx; B.fy = -zy; B.fz = -zz;
    return o;
  },
  mul(o, a, b) {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      o[i * 4 + j] = a[j] * b[i * 4] + a[4 + j] * b[i * 4 + 1] + a[8 + j] * b[i * 4 + 2] + a[12 + j] * b[i * 4 + 3];
    }
    return o;
  }
};

/* ---------------- sprite atlas (shelf packer over a 2D canvas) ---------------- */
class KartAtlas {
  constructor(w, h) { this.w = w; this.h = h; this.c = makeCanvas(w, h); this.x = 0; this.y = 0; this.row = 0; this.map = {}; this.dirty = true; }
  alloc(name, w, h, pad) {
    pad = pad === undefined ? 2 : pad;
    const W = Math.ceil(w) + pad * 2, H = Math.ceil(h) + pad * 2;
    if (this.x + W > this.w) { this.x = 0; this.y += this.row; this.row = 0; }
    if (this.y + H > this.h) throw new Error('kart atlas full: ' + name);
    const r = { x: this.x + pad, y: this.y + pad, w: Math.ceil(w), h: Math.ceil(h) };
    r.u0 = r.x / this.w; r.v0 = r.y / this.h; r.u1 = (r.x + r.w) / this.w; r.v1 = (r.y + r.h) / this.h;
    this.x += W; this.row = Math.max(this.row, H);
    if (name) this.map[name] = r;
    this.dirty = true;
    return r;
  }
  // draw fn(ctx, w, h) into a fresh region
  paint(name, w, h, fn, pad) {
    const r = this.alloc(name, w, h, pad);
    const x = this.c.getContext('2d');
    x.save(); x.beginPath(); x.rect(r.x, r.y, r.w, r.h); x.clip(); x.translate(r.x, r.y); fn(x, r.w, r.h); x.restore();
    return r;
  }
}

/* ---------------- WebGL renderer ---------------- */
const KartGL = {
  canvas: null, gl: null, failed: false, lost: false, gen: 0, progs: null,
  init() {
    if (this.gl) return !this.lost;
    if (this.failed) return false;
    try {
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      const opts = { alpha: false, antialias: true, depth: true, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' };
      const gl = c.getContext('webgl', opts) || c.getContext('experimental-webgl', opts);
      if (!gl) { this.failed = true; return false; }
      this.canvas = c; this.gl = gl;
      c.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; }, false);
      c.addEventListener('webglcontextrestored', () => { this.lost = false; this.setup(); }, false);
      this.setup();
      return true;
    } catch (e) { console.error(e); this.failed = true; this.gl = null; return false; }
  },
  setup() {
    const gl = this.gl;
    this.gen++;
    this.aniso = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') || gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
    this.maxAniso = this.aniso ? gl.getParameter(this.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;
    this.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const P = (vs, fs) => this.program(vs, fs, ['aPos', 'aUV', 'aCol']);
    const FOGFN = 'float fogF(float d){ return 1.0 - exp(-d * uFogD); }\n';
    this.progs = {
      sky: P(`attribute vec2 aPos; varying vec2 vN; void main(){ vN = aPos; gl_Position = vec4(aPos, 0.999, 1.0); }`,
        `precision highp float;
varying vec2 vN;
uniform vec3 uF, uR, uU; uniform vec2 uTan;
uniform vec3 uZen, uHor, uGnd, uSunD, uSunC, uFogC; uniform float uSunR, uStars, uTime, uHaze;
uniform sampler2D uBand; uniform vec2 uBandR;
float h3(vec3 p){ p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
void main(){
  vec3 d = normalize(uF + uR * (vN.x * uTan.x) + uU * (vN.y * uTan.y));
  float el = asin(clamp(d.y, -1.0, 1.0));
  vec3 col = mix(uHor, uZen, pow(clamp(el / 1.25, 0.0, 1.0), 0.55));
  float sd = max(dot(d, uSunD), 0.0);
  col += uSunC * (pow(sd, 6.0) * 0.28 + pow(sd, 48.0) * 0.45);
  float disc = smoothstep(uSunR, uSunR + 0.0015, sd);
  col = mix(col, uSunC * 1.25 + vec3(0.12), disc);
  if (uStars > 0.0) {
    vec3 p = d * 260.0; vec3 cell = floor(p); float h = h3(cell);
    if (h > 0.86) {
      vec3 c = cell + 0.5 + (vec3(h3(cell + 7.1), h3(cell + 3.3), h3(cell + 9.7)) - 0.5) * 0.6;
      float s = smoothstep(0.32, 0.0, length(p - c));
      float tw = 0.65 + 0.35 * sin(uTime * (1.5 + h * 3.0) + h * 40.0);
      col += vec3(0.9, 0.92, 1.0) * s * tw * uStars * smoothstep(0.0, 0.25, el) * (h - 0.86) * 7.0;
    }
  }
  col = mix(col, uFogC, uHaze * (1.0 - smoothstep(0.0, 0.35, el)));
  float v = (el - uBandR.x) / (uBandR.y - uBandR.x);
  if (v > 0.0 && v < 1.0) {
    vec4 b = texture2D(uBand, vec2(atan(d.x, -d.z) * 0.1591549 + 0.5, 1.0 - v));
    col = col * (1.0 - b.a) + b.rgb;
  }
  if (el < 0.0) col = mix(col, uGnd, clamp(-el * 6.0, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}`),
      ground: P(`attribute vec3 aPos; uniform mat4 uVP; uniform vec4 uMapXf; uniform float uDetS;
varying vec2 vMap; varying vec2 vDet; varying vec3 vW;
void main(){ vW = aPos; vMap = (aPos.xz - uMapXf.xy) * uMapXf.z; vDet = aPos.xz * uDetS; gl_Position = uVP * vec4(aPos, 1.0); }`,
        `precision highp float;
uniform sampler2D uAlb, uLight, uDetail; uniform vec3 uAmb, uFogC, uCam; uniform float uFogD, uDetA;
varying vec2 vMap; varying vec2 vDet; varying vec3 vW;
${FOGFN}
void main(){
  vec3 a = texture2D(uAlb, vMap).rgb;
  float dist = length(vW - uCam);
  vec3 det = texture2D(uDetail, vDet).rgb * 2.0;
  a *= mix(vec3(1.0), det, uDetA * clamp(1.2 - dist / 80.0, 0.0, 1.0));
  vec3 c = a * (uAmb + texture2D(uLight, vMap).rgb);
  gl_FragColor = vec4(mix(c, uFogC, fogF(dist)), 1.0);
}`),
      mesh: P(`attribute vec3 aPos; attribute vec2 aUV; attribute vec4 aCol; uniform mat4 uVP; uniform vec4 uMapXf; uniform float uDetS;
varying vec2 vUV; varying vec2 vMap; varying vec2 vDet; varying vec3 vW; varying vec4 vCol;
void main(){ vUV = aUV; vCol = aCol; vW = aPos; vMap = (aPos.xz - uMapXf.xy) * uMapXf.z; vDet = aPos.xz * uDetS; gl_Position = uVP * vec4(aPos, 1.0); }`,
        `precision highp float;
uniform sampler2D uTex, uLight, uDetail; uniform vec3 uAmb, uFogC, uCam; uniform float uFogD, uDetA, uGlow;
varying vec2 vUV; varying vec2 vMap; varying vec2 vDet; varying vec3 vW; varying vec4 vCol;
${FOGFN}
void main(){
  vec4 t = texture2D(uTex, vUV);
  float dist = length(vW - uCam);
  vec3 det = texture2D(uDetail, vDet).rgb * 2.0;
  vec3 a = t.rgb * mix(vec3(1.0), det, uDetA * vCol.a * clamp(1.2 - dist / 70.0, 0.0, 1.0));
  vec3 c = a * (uAmb + texture2D(uLight, vMap).rgb) * vCol.rgb + t.rgb * t.a * uGlow;
  gl_FragColor = vec4(mix(c, uFogC, fogF(dist)), 1.0);
}`),
      sprite: P(`attribute vec3 aPos; attribute vec2 aUV; attribute vec4 aCol; uniform mat4 uVP; uniform vec3 uCam; uniform float uFogD;
varying vec2 vUV; varying vec4 vCol; varying float vFog;
${FOGFN}
void main(){ vUV = aUV; vCol = aCol; vFog = fogF(length(aPos - uCam)); gl_Position = uVP * vec4(aPos, 1.0); }`,
        `precision mediump float;
uniform sampler2D uTex; uniform vec3 uFogC;
varying vec2 vUV; varying vec4 vCol; varying float vFog;
void main(){
  vec4 t = texture2D(uTex, vUV);
  if (vCol.a < -0.5) { gl_FragColor = vec4(t.rgb * vCol.rgb * (1.0 - vFog), 0.0); }
  else { vec4 c = t * vCol; if (c.a < 0.004) discard; gl_FragColor = vec4(mix(c.rgb, uFogC * c.a, vFog), c.a); }
}`)
    };
    // shared buffers
    this.fsBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fsBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.MAXQ = 4096;
    const idx = new Uint16Array(this.MAXQ * 6);
    for (let i = 0; i < this.MAXQ; i++) { const v = i * 4, o = i * 6; idx[o] = v; idx[o + 1] = v + 1; idx[o + 2] = v + 2; idx[o + 3] = v; idx[o + 4] = v + 2; idx[o + 5] = v + 3; }
    this.quadIdx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quadIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    this.spriteBuf = gl.createBuffer();
    this.spriteData = new Float32Array(this.MAXQ * 4 * 9);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.spriteData.byteLength, gl.DYNAMIC_DRAW);
    this.white = this.texture({ width: 2, height: 2, data: new Uint8Array(16).fill(255) }, {});
  },
  program(vs, fs, attribs) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error('kart shader: ' + gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    attribs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error('kart link: ' + gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) || 0;
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  },
  // src: canvas | {width,height,data:Uint8Array}; o: {mips, repeat, aniso, premult, nearest}
  texture(src, o) {
    const gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, o.premult ? 1 : 0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    if (src.data && !(src instanceof HTMLCanvasElement)) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, src.width, src.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, src.data instanceof Uint8Array ? src.data : new Uint8Array(src.data.buffer));
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    const wrap = o.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, o.repeatS !== undefined ? (o.repeatS ? gl.REPEAT : gl.CLAMP_TO_EDGE) : wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, o.repeatT !== undefined ? (o.repeatT ? gl.REPEAT : gl.CLAMP_TO_EDGE) : wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, o.nearest ? gl.NEAREST : gl.LINEAR);
    if (o.mips) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
    else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    if (o.aniso && this.aniso) gl.texParameterf(gl.TEXTURE_2D, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(o.aniso, this.maxAniso));
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
    return t;
  },
  buffer(arr, idx) {
    const gl = this.gl, b = gl.createBuffer();
    const tgt = idx ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
    gl.bindBuffer(tgt, b); gl.bufferData(tgt, arr, gl.STATIC_DRAW);
    return b;
  },
  // bind interleaved attribs: layout = [[loc, size], ...] in floats
  attribs(layout, stride) {
    const gl = this.gl;
    let off = 0;
    for (let i = 0; i < 3; i++) gl.disableVertexAttribArray(i);
    for (const [loc, size] of layout) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride * 4, off * 4); off += size; }
  },
  del(list) {
    const gl = this.gl; if (!gl) return;
    for (const r of list) {
      if (!r) continue;
      try { if (r instanceof WebGLTexture) gl.deleteTexture(r); else if (r instanceof WebGLBuffer) gl.deleteBuffer(r); } catch (e) { /* ignore */ }
    }
  }
};

/* ---------------- track runtime: spline, walls, racing line ---------------- */
class KartTrack {
  constructor(def) {
    this.def = def;
    this.id = def.id;
    const pts = def.pts, n = pts.length;
    const dense = [];
    const dd = (a, b) => Math.max(1e-3, Math.hypot(b[0] - a[0], b[1] - a[1]));
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const t0 = 0, t1 = t0 + Math.sqrt(dd(p0, p1)), t2 = t1 + Math.sqrt(dd(p1, p2)), t3 = t2 + Math.sqrt(dd(p2, p3));
      const steps = Math.max(6, Math.ceil(dd(p1, p2) / 1.5));
      const w1 = p1[2] || 1, w2 = p2[2] || 1;
      for (let k = 0; k < steps; k++) {
        const t = t1 + (t2 - t1) * k / steps;
        const L = (a, b, ta, tb) => [(tb - t) / (tb - ta) * a[0] + (t - ta) / (tb - ta) * b[0], (tb - t) / (tb - ta) * a[1] + (t - ta) / (tb - ta) * b[1]];
        const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
        const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
        const C = L(B1, B2, t1, t2);
        const u = k / steps, sm = u * u * (3 - 2 * u);
        dense.push([C[0], C[1], lerp(w1, w2, sm)]);
      }
    }
    // arc length + uniform resample (~1 m)
    const m = dense.length, cum = new Float64Array(m + 1);
    for (let i = 0; i < m; i++) { const a = dense[i], b = dense[(i + 1) % m]; cum[i + 1] = cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1]); }
    const L = cum[m], N = Math.max(64, Math.round(L / 1.0)), ds = L / N;
    this.L = L; this.N = N; this.ds = ds;
    const F = () => new Float32Array(N);
    this.X = F(); this.Z = F(); this.TX = F(); this.TZ = F(); this.NX = F(); this.NZ = F();
    this.HW = F(); this.K = F(); this.WL = F(); this.WR = F(); this.O = F(); this.VP = F();
    let j = 0;
    for (let i = 0; i < N; i++) {
      const s = i * ds;
      while (j < m - 1 && cum[j + 1] < s) j++;
      const a = dense[j], b = dense[(j + 1) % m], seg = cum[j + 1] - cum[j] || 1, f = (s - cum[j]) / seg;
      this.X[i] = lerp(a[0], b[0], f); this.Z[i] = lerp(a[1], b[1], f);
      this.HW[i] = (def.width || 16) * 0.5 * lerp(a[2], b[2], f);
    }
    const wrap = i => (i % N + N) % N;
    this.wrap = wrap;
    for (let i = 0; i < N; i++) {
      const a = wrap(i - 1), b = wrap(i + 1);
      let tx = this.X[b] - this.X[a], tz = this.Z[b] - this.Z[a];
      const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      this.TX[i] = tx; this.TZ[i] = tz; this.NX[i] = -tz; this.NZ[i] = tx;
    }
    const K0 = F();
    for (let i = 0; i < N; i++) {
      const a = wrap(i - 2), b = wrap(i + 2);
      K0[i] = kartWrapA(Math.atan2(this.TZ[b], this.TX[b]) - Math.atan2(this.TZ[a], this.TX[a])) / (4 * ds);
    }
    for (let i = 0; i < N; i++) { let s = 0; for (let k = -4; k <= 4; k++) s += K0[wrap(i + k)]; this.K[i] = s / 9; }
    // walls: road half-width + soft dust shoulder, limited on the inside of tight bends
    const sh = def.shoulder === undefined ? 7 : def.shoulder;
    const WL0 = F(), WR0 = F();
    for (let i = 0; i < N; i++) {
      const base = this.HW[i] + sh, k = this.K[i], lim = Math.abs(k) > 1e-4 ? 0.82 / Math.abs(k) : 1e9;
      WR0[i] = k > 0 ? Math.max(this.HW[i] + 0.8, Math.min(base, lim)) : base;
      WL0[i] = k < 0 ? Math.max(this.HW[i] + 0.8, Math.min(base, lim)) : base;
    }
    const minf = (src, dst, r) => { for (let i = 0; i < N; i++) { let v = 1e9; for (let k = -r; k <= r; k++) v = Math.min(v, src[wrap(i + k)]); dst[i] = v; } };
    const avgf = (src, dst, r) => { for (let i = 0; i < N; i++) { let v = 0; for (let k = -r; k <= r; k++) v += src[wrap(i + k)]; dst[i] = v / (2 * r + 1); } };
    const tmp = F();
    minf(WL0, tmp, 14); avgf(tmp, this.WL, 6);
    minf(WR0, tmp, 14); avgf(tmp, this.WR, 6);
    this.buildLine();
    // bounds & ground map transform
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < N; i++) { x0 = Math.min(x0, this.X[i]); x1 = Math.max(x1, this.X[i]); z0 = Math.min(z0, this.Z[i]); z1 = Math.max(z1, this.Z[i]); }
    const margin = def.margin || 150;
    const size = Math.max(x1 - x0, z1 - z0) + margin * 2;
    this.bounds = { x0, x1, z0, z1 };
    this.map = { x: (x0 + x1) / 2 - size / 2, z: (z0 + z1) / 2 - size / 2, size };
    this.cx = (x0 + x1) / 2; this.cz = (z0 + z1) / 2;
    this.tmpLoc = { i: 0, s: 0, d: 0 };
  }

  buildLine() {
    const N = this.N, wrap = this.wrap, O = this.O, X = this.X, Z = this.Z, NX = this.NX, NZ = this.NZ, HW = this.HW;
    const lim = i => Math.max(0, HW[i] - 2.6);
    const qx = i => X[i] + NX[i] * O[i], qz = i => Z[i] + NZ[i] * O[i];
    for (const [k, it] of [[36, 50], [18, 60], [9, 60], [4, 40]]) {
      for (let r = 0; r < it; r++) {
        for (let i = 0; i < N; i++) {
          const a = wrap(i - k), b = wrap(i + k);
          const mx = (qx(a) + qx(b)) / 2, mz = (qz(a) + qz(b)) / 2;
          const t = (mx - X[i]) * NX[i] + (mz - Z[i]) * NZ[i];
          O[i] = clamp(O[i] + (t - O[i]) * 0.55, -lim(i), lim(i));
        }
      }
    }
    // obstacles on the road push the line aside
    for (const ob of this.obstacles || []) {
      for (let k = -40; k <= 40; k++) {
        const i = wrap(ob.i + k), fall = Math.cos(k / 40 * Math.PI / 2);
        const want = ob.d > 0 ? ob.d - ob.r - 3 : ob.d + ob.r + 3;
        if (Math.abs(O[i] - ob.d) < ob.r + 3) O[i] = clamp(lerp(O[i], want, fall), -lim(i), lim(i));
      }
    }
    // curvature of the line -> target speed profile
    const RK = new Float32Array(N), ds = this.ds;
    for (let i = 0; i < N; i++) {
      const a = wrap(i - 4), b = wrap(i + 4);
      const ax = qx(i) - qx(a), az = qz(i) - qz(a), bx = qx(b) - qx(i), bz = qz(b) - qz(i);
      RK[i] = Math.abs(kartWrapA(Math.atan2(bz, bx) - Math.atan2(az, ax))) / (8 * ds);
    }
    const VP = this.VP, RAD = this.RAD = new Float32Array(N);
    for (let i = 0; i < N; i++) { let k = 0; for (let j = -3; j <= 3; j++) k = Math.max(k, RK[wrap(i + j)]); RAD[i] = Math.min(400, 1 / Math.max(1e-4, k)); VP[i] = Math.min(60, 1.95 / Math.max(1e-4, k)); }
    for (let pass = 0; pass < 2; pass++) for (let i = N - 1; i >= 0; i--) { const nx = VP[wrap(i + 1)]; VP[i] = Math.min(VP[i], Math.sqrt(nx * nx + 2 * 26 * ds)); }
    this.RK = RK;
  }

  // nearest sample by local search around hint; fills out {i, s, d}
  locate(x, z, hint, out) {
    const N = this.N, X = this.X, Z = this.Z;
    let best = hint | 0, bd = 1e18;
    if (best < 0 || best >= N) best = 0;
    const h = best;
    for (let k = -14; k <= 14; k++) {
      const i = (h + k + N) % N, dx = x - X[i], dz = z - Z[i], d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = i; }
    }
    const dx = x - X[best], dz = z - Z[best];
    const along = dx * this.TX[best] + dz * this.TZ[best];
    out.i = best; out.s = ((best * this.ds + along) % this.L + this.L) % this.L; out.d = dx * this.NX[best] + dz * this.NZ[best];
    return out;
  }
  locateGlobal(x, z, out) {
    const N = this.N; let best = 0, bd = 1e18;
    for (let i = 0; i < N; i++) { const dx = x - this.X[i], dz = z - this.Z[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } }
    return this.locate(x, z, best, out);
  }
  // distance to the nearest centreline sample (brute force; for placement)
  nearest(x, z) {
    const N = this.N; let bd = 1e18, bi = 0;
    for (let i = 0; i < N; i += 2) { const dx = x - this.X[i], dz = z - this.Z[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; bi = i; } }
    return { d: Math.sqrt(bd), i: bi };
  }
  idx(s) { return ((Math.floor(s / this.ds) % this.N) + this.N) % this.N; }
  // interpolated frame at arc length s
  at(s, out) {
    const N = this.N, f0 = ((s / this.ds) % N + N) % N, i = Math.floor(f0), f = f0 - i, j = (i + 1) % N;
    out = out || {};
    out.i = i; out.x = lerp(this.X[i], this.X[j], f); out.z = lerp(this.Z[i], this.Z[j], f);
    let tx = lerp(this.TX[i], this.TX[j], f), tz = lerp(this.TZ[i], this.TZ[j], f); const l = Math.hypot(tx, tz) || 1;
    out.tx = tx / l; out.tz = tz / l; out.nx = -out.tz; out.nz = out.tx;
    out.hw = lerp(this.HW[i], this.HW[j], f); out.wl = lerp(this.WL[i], this.WL[j], f); out.wr = lerp(this.WR[i], this.WR[j], f);
    out.o = lerp(this.O[i], this.O[j], f); out.v = lerp(this.VP[i], this.VP[j], f); out.k = lerp(this.K[i], this.K[j], f);
    return out;
  }
}

/* ---------------- sprite batch (pooled, depth-sorted) ---------------- */
// tex: 0 = shared atlas, 1 = player hi-res atlas, 2 = boost chevrons
class KartBatch {
  constructor() { this.pool = []; this.n = 0; this.sorted = []; this.flat = []; this.nf = 0; }
  reset(B, cx, cy, cz) { this.n = 0; this.nf = 0; this.B = B; this.cx = cx; this.cy = cy; this.cz = cz; const l = Math.hypot(B.rx, B.rz) || 1; this.hx = B.rx / l; this.hz = B.rz / l; }
  rec(list) {
    if (list === this.flat) { let r = this.flat[this.nf]; if (!r) r = this.flat[this.nf] = {}; this.nf++; return r; }
    let r = this.pool[this.n]; if (!r) r = this.pool[this.n] = {}; this.n++; return r;
  }
  set(r, reg, cr, cg, cb, ca, tex) {
    r.u0 = reg.u0; r.v0 = reg.v0; r.u1 = reg.u1; r.v1 = reg.v1; r.tex = tex || 0;
    if (ca < 0) { r.r = cr; r.g = cg; r.b = cb; r.a = -1; } else { r.r = cr * ca; r.g = cg * ca; r.b = cb * ca; r.a = ca; }
  }
  // upright billboard; (x,y,z) = anchor point which sits at (ax, ay) of the sprite (fractions from top-left)
  bb(x, y, z, w, h, reg, ax, ay, cr, cg, cb, ca, tex, roll, bias) {
    const r = this.rec();
    const hx = this.hx, hz = this.hz;
    const ox = (0.5 - ax) * w, oy = (ay - 0.5) * h;
    r.cx = x + hx * ox; r.cy = y + oy; r.cz = z + hz * ox;
    if (roll) { const c = Math.cos(roll), s = Math.sin(roll); r.ax = hx * w / 2 * c; r.ay = w / 2 * s; r.az = hz * w / 2 * c; r.bx = -hx * h / 2 * s; r.by = h / 2 * c; r.bz = -hz * h / 2 * s; }
    else { r.ax = hx * w / 2; r.ay = 0; r.az = hz * w / 2; r.bx = 0; r.by = h / 2; r.bz = 0; }
    r.d = (x - this.cx) * this.B.fx + (y - this.cy) * this.B.fy + (z - this.cz) * this.B.fz - (bias || 0);
    this.set(r, reg, cr, cg, cb, ca, tex);
    return r;
  }
  // camera-facing sprite (particles), size = full width
  ball(x, y, z, size, reg, cr, cg, cb, ca, rot, bias, aspect) {
    const r = this.rec(), B = this.B, h = size / 2, hv = h * (aspect || 1);
    const c = Math.cos(rot || 0), s = Math.sin(rot || 0);
    r.cx = x; r.cy = y; r.cz = z;
    r.ax = (B.rx * c + B.ux * s) * h; r.ay = (B.ry * c + B.uy * s) * h; r.az = (B.rz * c + B.uz * s) * h;
    r.bx = (-B.rx * s + B.ux * c) * hv; r.by = (-B.ry * s + B.uy * c) * hv; r.bz = (-B.rz * s + B.uz * c) * hv;
    r.d = (x - this.cx) * B.fx + (y - this.cy) * B.fy + (z - this.cz) * B.fz - (bias || 0);
    this.set(r, reg, cr, cg, cb, ca, 0);
    return r;
  }
  // quad lying on the ground; (dx,dz) = unit direction of the quad's length axis
  ground(x, y, z, w, l, dx, dz, reg, cr, cg, cb, ca, tex) {
    const r = this.rec(this.flat);
    r.cx = x; r.cy = y; r.cz = z;
    r.ax = -dz * w / 2; r.ay = 0; r.az = dx * w / 2;
    r.bx = -dx * l / 2; r.by = 0; r.bz = -dz * l / 2;
    this.set(r, reg, cr, cg, cb, ca, tex);
    return r;
  }
  // fixed-orientation upright quad (signs, gates); (dx,dz) = unit normal it faces
  panel(x, y, z, w, h, dx, dz, reg, ax, ay, cr, cg, cb, ca) {
    const r = this.rec();
    const px = -dz, pz = dx; // panel's horizontal axis (viewer's right when facing it)
    const ox = (0.5 - ax) * w, oy = (ay - 0.5) * h;
    r.cx = x + px * ox; r.cy = y + oy; r.cz = z + pz * ox;
    r.ax = px * w / 2; r.ay = 0; r.az = pz * w / 2; r.bx = 0; r.by = h / 2; r.bz = 0;
    r.d = (x - this.cx) * this.B.fx + (y - this.cy) * this.B.fy + (z - this.cz) * this.B.fz;
    this.set(r, reg, cr, cg, cb, ca, 0);
    return r;
  }
}

/* ---------------- 3D view of a track ---------------- */
class KartView {
  constructor() {
    this.res = []; this.P = new Float32Array(16); this.V = new Float32Array(16); this.VP = new Float32Array(16); this.B = {};
    this.batch = new KartBatch(); this.gen = -1;
  }
  destroy() { KartGL.del(this.res); this.res = []; this.gen = -1; }
  keep(r) { this.res.push(r); return r; }
  // T: KartTrack, R: render config from kartSetupTrack
  build(T, R) {
    const gl = KartGL.gl;
    this.destroy();
    this.T = T; this.R = R; this.gen = KartGL.gen;
    const tex = (src, o) => this.keep(KartGL.texture(src, o));
    // big track canvases are released after upload; repaint them if the GL context ever comes back
    if (!R.albedo) R.albedo = KartPaint.ground(T, R);
    if (!R.band) R.band = KartPaint.band(T, R);
    this.tAlb = tex(R.albedo, { mips: true, aniso: 8 });
    this.tLight = tex(R.light, {});
    this.tDetail = tex(KartPaint.detail(), { mips: true, repeat: true, aniso: 8 });
    this.tRoad = tex(R.roadTex, { mips: true, repeat: true, aniso: 8 });
    this.tWall = tex(R.wallTex, { mips: true, repeat: true, aniso: 4 });
    this.tBand = tex(R.band, { repeatS: true, repeatT: false, premult: true });
    this.tChev = tex(KartArt.chevron(), { mips: true, repeat: true, premult: true, aniso: 4 });
    this.tAtlas = KartArt.glAtlas();
    // ground: one huge quad (texture clamps to plain playa past the painted area)
    const G = 4000, cx = T.cx, cz = T.cz;
    this.groundBuf = this.keep(KartGL.buffer(new Float32Array([cx - G, 0, cz - G, cx + G, 0, cz - G, cx + G, 0, cz + G, cx - G, 0, cz + G])));
    // road strip
    const N = T.N, rep = T.L / Math.max(1, Math.round(T.L / 9));
    const road = new Float32Array((N + 1) * 2 * 9);
    let o = 0;
    const put = (arr, x, y, z, u, v, r, g, b, a) => { arr[o++] = x; arr[o++] = y; arr[o++] = z; arr[o++] = u; arr[o++] = v; arr[o++] = r; arr[o++] = g; arr[o++] = b; arr[o++] = a; };
    for (let k = 0; k <= N; k++) {
      const i = k % N, s = k * T.ds, hw = T.HW[i];
      put(road, T.X[i] - T.NX[i] * hw, 0, T.Z[i] - T.NZ[i] * hw, 0, s / rep, 1, 1, 1, R.surf.roadDetail);
      put(road, T.X[i] + T.NX[i] * hw, 0, T.Z[i] + T.NZ[i] * hw, 1, s / rep, 1, 1, 1, R.surf.roadDetail);
    }
    this.roadBuf = this.keep(KartGL.buffer(road));
    const sidx = new Uint16Array(N * 6);
    for (let k = 0; k < N; k++) { const v = k * 2, q = k * 6; sidx[q] = v; sidx[q + 1] = v + 1; sidx[q + 2] = v + 3; sidx[q + 3] = v; sidx[q + 4] = v + 3; sidx[q + 5] = v + 2; }
    this.stripIdx = this.keep(KartGL.buffer(sidx, true)); this.stripN = N * 6;
    // barriers: left + right strips
    const wh = R.wallH || 0.95, wrep = 8;
    const wall = new Float32Array((N + 1) * 2 * 9 * 2);
    o = 0;
    for (const side of [-1, 1]) {
      for (let k = 0; k <= N; k++) {
        const i = k % N, s = k * T.ds, w = side < 0 ? T.WL[i] : T.WR[i];
        const x = T.X[i] + T.NX[i] * w * side, z = T.Z[i] + T.NZ[i] * w * side;
        put(wall, x, wh, z, s / wrep, 0.02, 1, 1, 1, 0);
        put(wall, x, 0, z, s / wrep, 0.98, 0.62, 0.6, 0.66, 0);
      }
    }
    this.wallBuf = this.keep(KartGL.buffer(wall));
    // ramps (simple wedges, flat shaded)
    this.rampBuf = null;
    if (R.ramps && R.ramps.length) {
      const verts = [];
      const fr = {};
      for (const rp of R.ramps) {
        const a = T.at(rp.s - rp.len, {}), b = T.at(rp.s, {});
        const P = (f, d, y, u, v, sh) => { const q = f ? b : a; verts.push(q.x + q.nx * d, y, q.z + q.nz * d, u, v, sh, sh, sh, 0); };
        const d0 = rp.d0, d1 = rp.d1, h = rp.h;
        // top slope (two triangles)
        P(0, d0, 0.02, 0, 0, 1); P(0, d1, 0.02, 1, 0, 1); P(1, d1, h, 1, 1, 1);
        P(0, d0, 0.02, 0, 0, 1); P(1, d1, h, 1, 1, 1); P(1, d0, h, 0, 1, 1);
        // back face
        P(1, d0, h, 0, 0.9, 0.55); P(1, d1, h, 1, 0.9, 0.55); P(1, d1, 0, 1, 1, 0.45);
        P(1, d0, h, 0, 0.9, 0.55); P(1, d1, 0, 1, 1, 0.45); P(1, d0, 0, 0, 1, 0.45);
        // sides
        for (const d of [d0, d1]) { P(0, d, 0.02, 0, 0.95, 0.7); P(1, d, h, 0.2, 0.95, 0.7); P(1, d, 0, 0.2, 1, 0.6); }
      }
      this.rampN = verts.length / 9;
      this.rampBuf = this.keep(KartGL.buffer(new Float32Array(verts)));
      this.tRamp = tex(KartArt.rampTex(R), { mips: true, aniso: 4 });
    }
    for (const key of ['albedo', 'band']) { const c = R[key]; if (c && c.width > 1) { c.width = 1; c.height = 1; } R[key] = null; }
    this.tod = R.tod;
    const sa = R.tod.sunAz * Math.PI / 180, se = R.tod.sunEl * Math.PI / 180;
    this.sunDir = [Math.sin(sa) * Math.cos(se), Math.sin(se), -Math.cos(sa) * Math.cos(se)];
    this.col = k => { const h = hexToRgb(R.tod[k]); return [h[0] / 255, h[1] / 255, h[2] / 255]; };
    this.fogC = R.fogCol ? (() => { const h = hexToRgb(R.fogCol); return [h[0] / 255, h[1] / 255, h[2] / 255]; })() : this.col('fog');
  }
  setCamera(cam, w, h) {
    KartM.persp(this.P, cam.fov, w / h, 0.3, 2400);
    KartM.lookAt(this.V, this.B, cam.x, cam.y, cam.z, cam.tx, cam.ty, cam.tz);
    KartM.mul(this.VP, this.P, this.V);
    this.cam = cam; this.asp = w / h;
    this.batch.reset(this.B, cam.x, cam.y, cam.z);
  }
  render(env, time) {
    const gl = KartGL.gl, c = KartGL.canvas, T = this.T, R = this.R, B = this.B, cam = this.cam, PG = KartGL.progs;
    gl.viewport(0, 0, c.width, c.height);
    gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST);
    gl.depthMask(true); gl.clearDepth(1); gl.clear(gl.DEPTH_BUFFER_BIT);
    const fog = env.fogC || this.fogC, fogD = env.fogD;
    const amb = env.amb;
    // --- sky
    let p = PG.sky; gl.useProgram(p.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, KartGL.fsBuf); KartGL.attribs([[0, 2]], 2);
    const tv = Math.tan(cam.fov / 2);
    gl.uniform3f(p.u.uF, B.fx, B.fy, B.fz); gl.uniform3f(p.u.uR, B.rx, B.ry, B.rz); gl.uniform3f(p.u.uU, B.ux, B.uy, B.uz);
    gl.uniform2f(p.u.uTan, tv * this.asp, tv);
    gl.uniform3fv(p.u.uZen, env.zen); gl.uniform3fv(p.u.uHor, env.hor); gl.uniform3fv(p.u.uGnd, fog);
    gl.uniform3fv(p.u.uSunD, this.sunDir); gl.uniform3fv(p.u.uSunC, env.sunC); gl.uniform1f(p.u.uSunR, this.tod.sunR);
    gl.uniform1f(p.u.uStars, this.tod.stars * (env.starK === undefined ? 1 : env.starK)); gl.uniform1f(p.u.uTime, time); gl.uniform1f(p.u.uHaze, env.haze);
    gl.uniform3fv(p.u.uFogC, fog);
    gl.uniform2f(p.u.uBandR, -1.5 * Math.PI / 180, 11 * Math.PI / 180);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tBand); gl.uniform1i(p.u.uBand, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // --- ground
    const M = T.map, detS = 1 / 2.6;
    p = PG.ground; gl.useProgram(p.p);
    gl.uniformMatrix4fv(p.u.uVP, false, this.VP); gl.uniform4f(p.u.uMapXf, M.x, M.z, 1 / M.size, 0);
    gl.uniform1f(p.u.uDetS, detS); gl.uniform3fv(p.u.uAmb, amb); gl.uniform3fv(p.u.uFogC, fog); gl.uniform3f(p.u.uCam, cam.x, cam.y, cam.z);
    gl.uniform1f(p.u.uFogD, fogD); gl.uniform1f(p.u.uDetA, R.surf.detail);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tAlb); gl.uniform1i(p.u.uAlb, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tLight); gl.uniform1i(p.u.uLight, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.tDetail); gl.uniform1i(p.u.uDetail, 2);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.groundBuf); KartGL.attribs([[0, 3]], 3);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    // --- road / barriers / ramps share the mesh program
    p = PG.mesh; gl.useProgram(p.p);
    gl.uniformMatrix4fv(p.u.uVP, false, this.VP); gl.uniform4f(p.u.uMapXf, M.x, M.z, 1 / M.size, 0);
    gl.uniform1f(p.u.uDetS, detS); gl.uniform3fv(p.u.uAmb, amb); gl.uniform3fv(p.u.uFogC, fog); gl.uniform3f(p.u.uCam, cam.x, cam.y, cam.z);
    gl.uniform1f(p.u.uFogD, fogD); gl.uniform1f(p.u.uDetA, 1);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tLight); gl.uniform1i(p.u.uLight, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.tDetail); gl.uniform1i(p.u.uDetail, 2);
    gl.uniform1i(p.u.uTex, 0); gl.activeTexture(gl.TEXTURE0);
    gl.uniform1f(p.u.uGlow, env.glow);
    gl.bindTexture(gl.TEXTURE_2D, this.tRoad);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.roadBuf); KartGL.attribs([[0, 3], [1, 2], [2, 4]], 9);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.stripIdx);
    gl.drawElements(gl.TRIANGLES, this.stripN, gl.UNSIGNED_SHORT, 0);
    // --- flat decals and shadows on the ground (blended, no depth)
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.drawSprites(this.batch.flat, this.batch.nf, fog, 0);
    // --- barriers + ramps write depth so sprites can be hidden behind them
    gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    p = PG.mesh; gl.useProgram(p.p);
    gl.uniform1f(p.u.uDetA, 0);
    gl.bindTexture(gl.TEXTURE_2D, this.tWall);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.wallBuf); KartGL.attribs([[0, 3], [1, 2], [2, 4]], 9);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.stripIdx);
    gl.drawElements(gl.TRIANGLES, this.stripN, gl.UNSIGNED_SHORT, 0);
    // right wall: second half of the buffer
    KartGL.attribs([[0, 3], [1, 2], [2, 4]], 9);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, (T.N + 1) * 2 * 36);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 36, (T.N + 1) * 2 * 36 + 12);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, (T.N + 1) * 2 * 36 + 20);
    gl.drawElements(gl.TRIANGLES, this.stripN, gl.UNSIGNED_SHORT, 0);
    if (this.rampBuf) {
      gl.bindTexture(gl.TEXTURE_2D, this.tRamp); gl.uniform1f(p.u.uGlow, env.glow * 0.8);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.rampBuf); KartGL.attribs([[0, 3], [1, 2], [2, 4]], 9);
      gl.drawArrays(gl.TRIANGLES, 0, this.rampN);
    }
    // --- sprites: back to front, premultiplied alpha (additive ones carry alpha 0)
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    const bt = this.batch, list = bt.sorted;
    list.length = bt.n;
    for (let i = 0; i < bt.n; i++) list[i] = bt.pool[i];
    list.sort((a, b) => b.d - a.d);
    this.drawSprites(list, bt.n, fog, fogD);
    gl.depthMask(true);
  }
  drawSprites(list, n, fog, fogD) {
    if (!n) return;
    const gl = KartGL.gl, p = KartGL.progs.sprite, data = KartGL.spriteData, cam = this.cam;
    gl.useProgram(p.p);
    gl.uniformMatrix4fv(p.u.uVP, false, this.VP); gl.uniform3f(p.u.uCam, cam.x, cam.y, cam.z);
    gl.uniform1f(p.u.uFogD, fogD); gl.uniform3fv(p.u.uFogC, fog); gl.uniform1i(p.u.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindBuffer(gl.ARRAY_BUFFER, KartGL.spriteBuf); KartGL.attribs([[0, 3], [1, 2], [2, 4]], 9);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, KartGL.quadIdx);
    const texs = [this.tAtlas, KartArt.glHi() || this.tAtlas, this.tChev];
    let start = 0;
    n = Math.min(n, KartGL.MAXQ);
    while (start < n) {
      const tex = list[start].tex;
      let end = start, o = 0;
      while (end < n && list[end].tex === tex) {
        const r = list[end];
        for (let k = 0; k < 4; k++) {
          const sa = k === 0 || k === 3 ? -1 : 1, sb = k < 2 ? -1 : 1;
          data[o++] = r.cx + r.ax * sa + r.bx * sb; data[o++] = r.cy + r.ay * sa + r.by * sb; data[o++] = r.cz + r.az * sa + r.bz * sb;
          data[o++] = sa < 0 ? r.u0 : r.u1; data[o++] = sb < 0 ? r.v1 : r.v0;
          data[o++] = r.r; data[o++] = r.g; data[o++] = r.b; data[o++] = r.a;
        }
        end++;
      }
      gl.bindTexture(gl.TEXTURE_2D, texs[tex]);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, o));
      gl.drawElements(gl.TRIANGLES, (end - start) * 6, gl.UNSIGNED_SHORT, 0);
      start = end;
    }
  }
}

/* ============================================================
   KartArt — procedural sprite art.
   Karts and drivers are built from simple 3D primitives in a tiny
   orthographic "2.5D" projector and painted with Canvas2D (gradients,
   soft outlines), once per view angle, into the sprite atlas.
   ============================================================ */
const KartProj = (() => {
  let cT = 1, sT = 0, cP = 1, sP = 0, SC = 36, OX = 64, OY = 84;
  let CX = 0, CY = 0, CZ = -1, LX = 0, LY = 1, LZ = 0, UX = 0, UY = 1, UZ = 0;
  const DL = [];
  const A = {};
  A.view = (theta, phi, sc, ox, oy) => {
    cT = Math.cos(theta); sT = Math.sin(theta); cP = Math.cos(phi); sP = Math.sin(phi); SC = sc; OX = ox; OY = oy;
    CX = sT * cP; CY = sP; CZ = -cT * cP;
    UX = -sT * sP; UY = cP; UZ = cT * sP;
    let lx = -0.5 * cT + 0.7 * UX + 0.55 * CX, ly = 0.7 * UY + 0.55 * CY, lz = -0.5 * sT + 0.7 * UZ + 0.55 * CZ;
    const l = Math.hypot(lx, ly, lz); LX = lx / l; LY = ly / l; LZ = lz / l;
    A.theta = theta; A.phi = phi; A.SC = sc;
  };
  // project local point (x right, y up, z forward) -> [sx, sy, depth]
  const P = A.P = (x, y, z) => {
    const dH = x * sT - z * cT;
    return [OX + (x * cT + z * sT) * SC, OY - (y * cP - dH * sP) * SC, dH * cP + y * sP];
  };
  // screen-space vector (px per metre) of a local direction
  const dirS = A.dirS = (vx, vy, vz) => [(vx * cT + vz * sT) * SC, -(vx * UX + vy * UY + vz * UZ) * SC];
  const facing = A.facing = (nx, ny, nz) => nx * CX + ny * CY + nz * CZ;
  const light = A.light = (nx, ny, nz) => nx * LX + ny * LY + nz * LZ;
  const lit = A.lit = (col, nx, ny, nz, amt) => { const d = light(nx, ny, nz) * (amt || 1); return shade(col, d > 0 ? d * 0.3 : d * 0.5); };
  A.add = (d, f, g) => { DL.push({ d, f, g }); };
  A.flush = (ctx, gctx) => {
    DL.sort((a, b) => a.d - b.d);
    for (const it of DL) { ctx.save(); it.f(ctx); ctx.restore(); }
    if (gctx) for (const it of DL) {
      gctx.save(); gctx.globalCompositeOperation = 'destination-out'; it.f(gctx); gctx.restore();
      if (it.g) { gctx.save(); it.g(gctx); gctx.restore(); }
    }
    DL.length = 0;
  };
  A.clear = () => { DL.length = 0; };
  const lw = k => Math.max(0.6, SC * k);
  A.lw = lw;
  const pathPts = (ctx, pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); };
  A.pathPts = pathPts;

  // planar polygon. o: {c:[x,y,z] solid centre (normal points away), n:[...] explicit normal, both, bias, line, grad, glow, decal(ctx), flat}
  A.poly = (pts, col, o) => {
    o = o || {};
    let nx = 0, ny = 0, nz = 0, gx = 0, gy = 0, gz = 0;
    if (o.n) { nx = o.n[0]; ny = o.n[1]; nz = o.n[2]; }
    else for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); }
    for (const p of pts) { gx += p[0]; gy += p[1]; gz += p[2]; }
    gx /= pts.length; gy /= pts.length; gz /= pts.length;
    const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    if (o.c && !o.n && (gx - o.c[0]) * nx + (gy - o.c[1]) * ny + (gz - o.c[2]) * nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
    let f = facing(nx, ny, nz);
    if (f < 0.015) { if (!o.both) return; nx = -nx; ny = -ny; nz = -nz; f = -f; }
    const pr = pts.map(p => P(p[0], p[1], p[2]));
    const d = P(gx, gy, gz)[2] + (o.bias || 0);
    const fill = o.flat ? col : lit(col, nx, ny, nz, o.amt);
    const draw = ctx => {
      if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
      pathPts(ctx, pr);
      if (o.grad) { const [a, b] = o.grad(pr, fill); const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]); g.addColorStop(0, shade(fill, 0.18)); g.addColorStop(1, shade(fill, -0.18)); ctx.fillStyle = g; }
      else ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineJoin = 'round';
      if (o.line !== false) { ctx.strokeStyle = o.line || rgba(shade(col, -0.6), 0.55); ctx.lineWidth = lw(o.lw || 0.03); ctx.stroke(); }
      else { ctx.strokeStyle = fill; ctx.lineWidth = 0.8; ctx.stroke(); }
      if (o.decal) { // affine frame: p0 -> p1 is +u, p0 -> p3 is +v
        ctx.save(); pathPts(ctx, pr); ctx.clip();
        const p0 = pr[0], p1 = pr[1], p3 = pr[pr.length - 1];
        ctx.transform(p1[0] - p0[0], p1[1] - p0[1], p3[0] - p0[0], p3[1] - p0[1], p0[0], p0[1]);
        o.decal(ctx, f); ctx.restore();
      }
    };
    A.add(d, draw, o.glow ? ctx => { if (o.glow === true) return; o.glow(ctx, pr); } : null);
  };
  // axis-aligned box centred at (x,y,z) with size (w,h,l)
  A.box = (x, y, z, w, h, l, col, o) => {
    o = o || {};
    const x0 = x - w / 2, x1 = x + w / 2, y0 = y - h / 2, y1 = y + h / 2, z0 = z - l / 2, z1 = z + l / 2;
    const c = [x, y, z], q = Object.assign({ c }, o);
    A.poly([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], o.top || col, Object.assign({}, q, { n: [0, 1, 0], decal: o.decalTop }));
    A.poly([[x1, y1, z1], [x0, y1, z1], [x0, y0, z1], [x1, y0, z1]], o.front || col, Object.assign({}, q, { n: [0, 0, 1], decal: o.decalFront }));
    A.poly([[x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0]], o.back || col, Object.assign({}, q, { n: [0, 0, -1], decal: o.decalBack }));
    A.poly([[x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [x1, y0, z0]], o.side || col, Object.assign({}, q, { n: [1, 0, 0], decal: o.decalR }));
    A.poly([[x0, y1, z1], [x0, y1, z0], [x0, y0, z0], [x0, y0, z1]], o.side || col, Object.assign({}, q, { n: [-1, 0, 0], decal: o.decalL }));
  };
  // tapered block: back rectangle b=[x0,x1,y0,y1] at z0, front rectangle f at z1. decals read correctly from each side
  A.frustum = (z0, z1, b, f, col, o) => {
    o = o || {};
    const B0 = [[b[0], b[2], z0], [b[1], b[2], z0], [b[1], b[3], z0], [b[0], b[3], z0]];
    const F0 = [[f[0], f[2], z1], [f[1], f[2], z1], [f[1], f[3], z1], [f[0], f[3], z1]];
    const c = [(b[0] + b[1] + f[0] + f[1]) / 4, (b[2] + b[3] + f[2] + f[3]) / 4, (z0 + z1) / 2];
    const q = { c, bias: o.bias, line: o.line, lw: o.lw, amt: o.amt };
    A.poly([F0[3], F0[2], B0[2], B0[3]], o.top || col, Object.assign({}, q, { decal: o.decalTop, grad: o.topGrad }));
    A.poly([F0[2], F0[3], F0[0], F0[1]], o.front || col, Object.assign({}, q, { decal: o.decalFront }));
    A.poly([B0[3], B0[2], B0[1], B0[0]], o.back || col, Object.assign({}, q, { decal: o.decalBack }));
    A.poly([B0[2], F0[2], F0[1], B0[1]], o.side || col, Object.assign({}, q, { decal: o.decalR }));
    A.poly([F0[3], B0[3], B0[0], F0[0]], o.side || col, Object.assign({}, q, { decal: o.decalL }));
  };
  // extrusion of a footprint [[x,z]...] between y0 and y1; o.topScale shrinks the top outline (rounded / tapered look)
  A.prism = (foot, y0, y1, col, o) => {
    o = o || {};
    let cx = 0, cz = 0; for (const p of foot) { cx += p[0]; cz += p[1]; } cx /= foot.length; cz /= foot.length;
    const ts = o.topScale || 1, tsx = o.topScaleX || ts, tsz = o.topScaleZ || ts, tdz = o.topShiftZ || 0;
    const top = foot.map(p => [cx + (p[0] - cx) * tsx, y1, cz + (p[1] - cz) * tsz + tdz]);
    const c = [cx, (y0 + y1) / 2, cz];
    const n = foot.length;
    for (let i = 0; i < n; i++) {
      const a = foot[i], b = foot[(i + 1) % n], ta = top[i], tb = top[(i + 1) % n];
      A.poly([[a[0], y0, a[1]], [b[0], y0, b[1]], tb, ta], o.sideCol || col, { c, line: o.sideLine === undefined ? false : o.sideLine, bias: o.bias, amt: o.amt, glow: o.glowSide });
    }
    A.poly(top, o.topCol || col, { c, n: [0, 1, 0], decal: o.decalTop, bias: (o.bias || 0) + 0.001, line: o.topLine, lw: o.lw, grad: o.topGrad });
  };
  // wheel with axle along x
  A.wheel = (x, y, z, r, w, o) => {
    o = o || {};
    const N = 18, side = x >= 0 ? 1 : -1;
    const capPts = sx => { const out = []; for (let k = 0; k < N; k++) { const a = k / N * TAU; out.push(P(sx, y + Math.sin(a) * r, z + Math.cos(a) * r)); } return out; };
    const outer = x + side * w / 2, inner = x - side * w / 2;
    const po = capPts(outer), pi = capPts(inner);
    const fo = facing(side, 0, 0);
    const d = P(x, y, z)[2] + (o.bias || 0);
    A.add(d, ctx => {
      const all = po.concat(pi);
      const hull = kartHull(all);
      pathPts(ctx, hull);
      ctx.fillStyle = o.tyre || '#1d1b22'; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = lw(0.02); ctx.stroke();
      // tread highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = lw(0.03);
      const cap = fo > 0 ? po : pi;
      if (Math.abs(fo) > 0.08) {
        pathPts(ctx, cap); ctx.fillStyle = o.tyreSide || '#2a2830'; ctx.fill();
        // rim
        const [cx, cy] = P(fo > 0 ? outer + side * 0.005 : inner, y, z);
        ctx.save(); ctx.translate(cx, cy);
        const rimPts = cap.map(p => [(p[0] - cx) * 0.6, (p[1] - cy) * 0.6]);
        pathPts(ctx, rimPts);
        const g = ctx.createLinearGradient(-r * SC, -r * SC, r * SC, r * SC);
        const hub = o.hub || '#b8bcc8';
        g.addColorStop(0, shade(hub, 0.4)); g.addColorStop(1, shade(hub, -0.35));
        ctx.fillStyle = g; ctx.fill();
        if (o.whitewall) { pathPts(ctx, cap.map(p => [(p[0] - cx) * 0.82, (p[1] - cy) * 0.82])); ctx.strokeStyle = '#f2f0ea'; ctx.lineWidth = lw(0.035); ctx.stroke(); }
        ctx.fillStyle = shade(hub, -0.5); ctx.beginPath(); ctx.arc(0, 0, Math.max(0.8, r * SC * 0.14), 0, TAU); ctx.fill();
        ctx.restore();
      }
    }, o.glow || null);
  };
  A.sphere = (x, y, z, r, col, o) => {
    o = o || {};
    const [sx, sy, d] = P(x, y, z), R = r * SC;
    const ls = dirS(LX, LY, LZ), ll = Math.hypot(ls[0], ls[1]) || 1;
    const draw = ctx => {
      const g = ctx.createRadialGradient(sx + ls[0] / ll * R * 0.4, sy + ls[1] / ll * R * 0.4, R * 0.1, sx, sy, R * 1.05);
      g.addColorStop(0, shade(col, 0.35)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.45));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, R, 0, TAU); ctx.fill();
      if (o.line !== false) { ctx.strokeStyle = o.line || rgba(shade(col, -0.65), 0.6); ctx.lineWidth = lw(0.025); ctx.stroke(); }
      if (o.shine) { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(sx + ls[0] / ll * R * 0.45, sy + ls[1] / ll * R * 0.45, R * 0.25, R * 0.16, Math.atan2(ls[1], ls[0]) + Math.PI / 2, 0, TAU); ctx.fill(); }
      if (o.after) o.after(ctx, sx, sy, R);
    };
    A.add(d + (o.bias || 0), draw, o.glow ? ctx => o.glow(ctx, sx, sy, R) : null);
  };
  // capsule limb between two points
  A.limb = (a, b, r, col, o) => {
    o = o || {};
    const pa = P(a[0], a[1], a[2]), pb = P(b[0], b[1], b[2]);
    const d = (pa[2] + pb[2]) / 2 + (o.bias || 0);
    A.add(d, ctx => {
      ctx.lineCap = 'round';
      ctx.strokeStyle = o.line || rgba(shade(col, -0.65), 0.7); ctx.lineWidth = r * 2 * SC + lw(0.035) * 2;
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = r * 2 * SC;
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
      ctx.strokeStyle = rgba(shade(col, 0.35), 0.5); ctx.lineWidth = r * 0.7 * SC;
      ctx.beginPath(); ctx.moveTo(pa[0] - r * SC * 0.3, pa[1] - r * SC * 0.3); ctx.lineTo(pb[0] - r * SC * 0.3, pb[1] - r * SC * 0.3); ctx.stroke();
      if (o.after) o.after(ctx, pa, pb);
    }, o.glow ? ctx => o.glow(ctx, pa, pb) : null);
  };
  // ring (e.g. steering wheel) centred at c with in-plane axes u, v
  A.ring = (c, u, v, r, col, width, o) => {
    o = o || {};
    const pts = []; for (let k = 0; k < 20; k++) { const a = k / 20 * TAU; pts.push(P(c[0] + (u[0] * Math.cos(a) + v[0] * Math.sin(a)) * r, c[1] + (u[1] * Math.cos(a) + v[1] * Math.sin(a)) * r, c[2] + (u[2] * Math.cos(a) + v[2] * Math.sin(a)) * r)); }
    const d = P(c[0], c[1], c[2])[2] + (o.bias || 0);
    A.add(d, ctx => {
      pathPts(ctx, pts); ctx.lineJoin = 'round';
      ctx.strokeStyle = shade(col, -0.5); ctx.lineWidth = width * SC + lw(0.03); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = width * SC; ctx.stroke();
      if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
    }, o.glow ? ctx => o.glow(ctx, pts) : null);
  };
  // generic item drawn at a projected point
  A.at = (x, y, z, fn, glow, bias) => {
    const p = P(x, y, z);
    A.add(p[2] + (bias || 0), ctx => fn(ctx, p[0], p[1], SC), glow ? ctx => glow(ctx, p[0], p[1], SC) : null);
  };
  // draw in a tangent frame (east, north in metres) at a surface point with normal n; returns visibility
  A.frame = (ctx, x, y, z, e, nrt, n, scale, fn, minF) => {
    const f = facing(n[0], n[1], n[2]);
    if (f < (minF === undefined ? 0.02 : minF)) return false;
    const p = P(x, y, z), E = dirS(e[0], e[1], e[2]), N = dirS(nrt[0], nrt[1], nrt[2]);
    ctx.save(); ctx.transform(E[0] * scale, E[1] * scale, -N[0] * scale, -N[1] * scale, p[0], p[1]);
    ctx.globalAlpha *= clamp(f * 6, 0, 1);
    fn(ctx, f); ctx.restore();
    return true;
  };
  // spherical surface frame at (az, el) on a sphere (centre c, radius r); draws in units of r
  A.sdecal = (ctx, c, r, az, el, fn, minF) => {
    const ce = Math.cos(el), se = Math.sin(el), ca = Math.cos(az), sa = Math.sin(az);
    const n = [sa * ce, se, ca * ce];
    return A.frame(ctx, c[0] + n[0] * r, c[1] + n[1] * r, c[2] + n[2] * r, [ca, 0, -sa], [-sa * se, ce, -ca * se], n, r, fn, minF);
  };
  A.spt = (c, r, az, el, out) => { const ce = Math.cos(el); const n = [Math.sin(az) * ce, Math.sin(el), Math.cos(az) * ce]; const p = P(c[0] + n[0] * r * (out || 1), c[1] + n[1] * r * (out || 1), c[2] + n[2] * r * (out || 1)); p.push(facing(n[0], n[1], n[2])); return p; };
  // path of the visible part of a spherical cap (direction az/el, angular radius ang) on a sphere
  A.capPath = (ctx, c, r, az, el, ang) => {
    const ce = Math.cos(el), D = [Math.sin(az) * ce, Math.sin(el), Math.cos(az) * ce];
    let U = Math.abs(D[1]) < 0.95 ? [D[2], 0, -D[0]] : [1, 0, 0];
    let ul = Math.hypot(U[0], U[1], U[2]); U = [U[0] / ul, U[1] / ul, U[2] / ul];
    const V = [D[1] * U[2] - D[2] * U[1], D[2] * U[0] - D[0] * U[2], D[0] * U[1] - D[1] * U[0]];
    const ca = Math.cos(ang), sa = Math.sin(ang), N = 40, pts = [];
    let nvis = 0;
    for (let k = 0; k < N; k++) {
      const t = k / N * TAU, ct = Math.cos(t), st = Math.sin(t);
      const n = [D[0] * ca + (U[0] * ct + V[0] * st) * sa, D[1] * ca + (U[1] * ct + V[1] * st) * sa, D[2] * ca + (U[2] * ct + V[2] * st) * sa];
      const p = P(c[0] + n[0] * r, c[1] + n[1] * r, c[2] + n[2] * r);
      p[2] = facing(n[0], n[1], n[2]) >= 0; if (p[2]) nvis++;
      pts.push(p);
    }
    const [sx, sy] = P(c[0], c[1], c[2]), R = r * SC;
    ctx.beginPath();
    if (nvis === N) { ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.closePath(); return true; }
    if (nvis === 0) { if (facing(D[0], D[1], D[2]) > 0 && ang > Math.PI / 2) { ctx.arc(sx, sy, R, 0, TAU); return true; } return false; }
    let s0 = 0; for (let k = 0; k < N; k++) if (pts[k][2] && !pts[(k - 1 + N) % N][2]) { s0 = k; break; }
    const run = []; for (let k = 0; k < N; k++) { const p = pts[(s0 + k) % N]; if (!p[2]) break; run.push(p); }
    ctx.moveTo(run[0][0], run[0][1]); for (const p of run) ctx.lineTo(p[0], p[1]);
    const e = run[run.length - 1], a1 = Math.atan2(e[1] - sy, e[0] - sx), a0 = Math.atan2(run[0][1] - sy, run[0][0] - sx);
    const ds = dirS(D[0], D[1], D[2]), aD = Math.atan2(ds[1], ds[0]);
    const sweep = ((a0 - a1) % TAU + TAU) % TAU, dD = ((aD - a1) % TAU + TAU) % TAU;
    ctx.arc(sx, sy, R, a1, a0, !(dD <= sweep));
    ctx.closePath();
    return true;
  };
  return A;
})();

// convex hull (monotone chain) of [[x,y],...]
function kartHull(pts) {
  const p = pts.map(q => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  up.pop(); lo.pop();
  return lo.concat(up);
}
// rounded-rectangle footprint (superellipse) for prisms
function kartFoot(hx, hz0, hz1, n, pw, frontNarrow) {
  const out = [], cz = (hz0 + hz1) / 2, hz = (hz1 - hz0) / 2;
  n = n || 20; pw = pw || 4;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a);
    const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / pw) * hx, z = Math.sign(s) * Math.pow(Math.abs(s), 2 / pw) * hz + cz;
    const k = frontNarrow ? 1 - frontNarrow * clamp((z - cz) / hz, 0, 1) : 1;
    out.push([x * k, z]);
  }
  return out;
}

/* ---------------- drivers ---------------- */
// a head: base sphere (hair or skin), optional face cap, features, and parts sorted around it
function kartHead(c, r, spec) {
  KartProj.lastHead = { c: c.slice(), r };
  const A = KartProj, [sx, sy, d] = A.P(c[0], c[1], c[2]), R = r * A.SC;
  const parts = (spec.parts || []).map(pt => ({ d: A.P(pt.p[0], pt.p[1], pt.p[2])[2] + (pt.bias || 0), f: pt.f }));
  parts.sort((a, b) => a.d - b.d);
  const ls = A.dirS(0.45, 0.8, 0.4);
  const draw = ctx => {
    for (const p of parts) if (p.d < d) p.f(ctx);
    const base = spec.base;
    const g = ctx.createRadialGradient(sx - R * 0.3, sy - R * 0.45, R * 0.1, sx, sy, R * 1.05);
    g.addColorStop(0, shade(base, 0.28)); g.addColorStop(0.6, base); g.addColorStop(1, shade(base, -0.4));
    ctx.fillStyle = g; ctx.beginPath();
    if (spec.squash) ctx.ellipse(sx, sy, R * spec.squash[0], R * spec.squash[1], 0, 0, TAU); else ctx.arc(sx, sy, R, 0, TAU);
    ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(sx, sy, R * 1.01, 0, TAU); ctx.clip();
    if (spec.face && A.capPath(ctx, c, r, spec.face[0], spec.face[1], spec.face[2])) {
      const fg = ctx.createRadialGradient(sx - R * 0.25, sy - R * 0.2, R * 0.1, sx, sy, R * 1.1);
      fg.addColorStop(0, shade(spec.skin, 0.12)); fg.addColorStop(0.7, spec.skin); fg.addColorStop(1, spec.skinSh || shade(spec.skin, -0.25));
      ctx.fillStyle = fg; ctx.fill();
    }
    if (spec.sheen) {
      ctx.strokeStyle = spec.sheen; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { ctx.lineWidth = A.lw(0.018 + i * 0.006); ctx.beginPath(); ctx.arc(sx - R * 0.05, sy - R * 0.05, R * (0.55 + i * 0.14), -2.5 + i * 0.12, -1.3 - i * 0.1); ctx.stroke(); }
    }
    if (spec.features) spec.features(ctx, c, r, sx, sy, R);
    ctx.restore();
    ctx.strokeStyle = spec.line || rgba(shade(base, -0.7), 0.55); ctx.lineWidth = A.lw(0.025);
    ctx.beginPath(); if (spec.squash) ctx.ellipse(sx, sy, R * spec.squash[0], R * spec.squash[1], 0, 0, TAU); else ctx.arc(sx, sy, R, 0, TAU); ctx.stroke();
    if (spec.after) spec.after(ctx, c, r, sx, sy, R);
    for (const p of parts) if (p.d >= d) p.f(ctx);
  };
  A.add(d, draw, spec.glow ? ctx => spec.glow(ctx, c, r, sx, sy, R) : null);
}
// torso as an upright rounded column; decals on its front/back
function kartTorso(x, y0, y1, z, hw, hd, col, o) {
  const A = KartProj;
  o = o || {};
  const yc = (y0 + y1) / 2, pc = A.P(x, yc, z);
  A.add(pc[2], ctx => {
    const top = A.P(x, y1, z), bot = A.P(x, y0, z);
    const w = A.SC * Math.hypot(hw * Math.cos(A.theta), hd * Math.sin(A.theta));
    const ey = A.SC * Math.hypot(hw * Math.sin(A.theta), hd * Math.cos(A.theta)) * Math.sin(A.phi);
    const tY = top[1] - ey, bY = bot[1] + ey * 0.6, rad = Math.min(w * 0.7, (bY - tY) * 0.45);
    ctx.beginPath();
    ctx.moveTo(bot[0] - w * 0.92, bY);
    ctx.lineTo(top[0] - w, tY + rad);
    ctx.quadraticCurveTo(top[0] - w, tY, top[0] - w + rad, tY);
    ctx.lineTo(top[0] + w - rad, tY);
    ctx.quadraticCurveTo(top[0] + w, tY, top[0] + w, tY + rad);
    ctx.lineTo(bot[0] + w * 0.92, bY);
    ctx.closePath();
    const g = ctx.createLinearGradient(top[0] - w, 0, top[0] + w, 0);
    g.addColorStop(0, shade(col, 0.22)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, -0.35));
    ctx.fillStyle = o.fill ? o.fill(ctx, top, bot, w) : g; ctx.fill();
    ctx.strokeStyle = rgba(shade(col, -0.7), 0.6); ctx.lineWidth = A.lw(0.025); ctx.stroke();
    ctx.save(); ctx.clip();
    const ym = (y0 + y1) / 2;
    if (o.front) A.frame(ctx, x, ym, z + hd, [1, 0, 0], [0, 1, 0], [0, 0, 1], 1, o.front);
    if (o.back) A.frame(ctx, x, ym, z - hd, [-1, 0, 0], [0, 1, 0], [0, 0, -1], 1, o.back);
    if (o.sideR) A.frame(ctx, x + hw, ym, z, [0, 0, -1], [0, 1, 0], [1, 0, 0], 1, o.sideR);
    if (o.sideL) A.frame(ctx, x - hw, ym, z, [0, 0, 1], [0, 1, 0], [-1, 0, 0], 1, o.sideL);
    ctx.restore();
    // neck
    if (o.neck) { ctx.fillStyle = o.neck; ctx.beginPath(); ctx.ellipse(top[0], tY + 1, w * 0.32, Math.max(1.5, ey * 0.8 + A.SC * 0.03), 0, 0, TAU); ctx.fill(); }
  }, o.glow ? ctx => o.glow(ctx) : null);
}
// common seated pose: torso, arms to the wheel, steering wheel. returns head centre
function kartRig(o) {
  const A = KartProj;
  const sy = o.sy === undefined ? 0.34 : o.sy, sz = o.sz === undefined ? -0.3 : o.sz, k = o.k || 1;
  const tw = (o.tw || 0.25) * k, td = (o.td || 0.16) * k, th = (o.th || 0.5) * k;
  const y0 = sy + 0.04, y1 = y0 + th;
  kartTorso(0, y0, y1, sz, tw, td, o.shirt, o.torso || {});
  const sh = [tw - 0.03, y1 - 0.07 * k, sz];
  const wz = sz + (o.reach || 0.5), wy = sy + 0.42 * k;
  const hands = [[-0.13 * k, wy + 0.02, wz - 0.03], [0.13 * k, wy + 0.02, wz - 0.03]];
  const armR = (o.armR || 0.062) * k;
  for (const sgn of [-1, 1]) {
    const S = [sh[0] * sgn, sh[1], sh[2]], E = [sgn * (tw + 0.07 * k), sy + 0.26 * k, sz + 0.2], H = hands[sgn < 0 ? 0 : 1];
    if (!o.noArms) {
      A.limb(S, E, armR * 1.08, o.sleeve || o.shirt, { after: o.upperAfter ? (ctx, pa, pb) => o.upperAfter(ctx, pa, pb, armR) : null });
      A.limb(E, H, armR, o.fore || o.skin, { after: o.foreAfter ? (ctx, pa, pb) => o.foreAfter(ctx, pa, pb, armR) : null });
      A.sphere(H[0], H[1], H[2], armR * 1.15, o.hand || o.skin, { line: false, bias: 0.01 });
    }
  }
  if (!o.noWheel) {
    const tilt = 0.85, u = [1, 0, 0], v = [0, Math.cos(tilt), Math.sin(tilt)];
    A.ring([0, wy, wz], u, v, 0.15 * k, o.wheelCol || '#24222c', 0.035, {});
    A.limb([0, wy - 0.02, wz + 0.02], [0, sy + 0.1, wz + 0.3], 0.025, '#3a3844', {});
  }
  return [0, y1 + (o.headR || 0.3) * 0.78 * k + (o.headDy || 0), sz + 0.03 + (o.headDz || 0)];
}
// small 2D helpers used inside decals (units: head radius)
const KartFace = {
  shades(ctx, col, frame) {
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 0.06, -0.2); ctx.lineTo(s * 0.5, -0.22); ctx.quadraticCurveTo(s * 0.54, 0.12, s * 0.42, 0.14); ctx.lineTo(s * 0.12, 0.14); ctx.quadraticCurveTo(s * 0.04, 0.12, s * 0.06, -0.2); ctx.closePath();
      ctx.fillStyle = col || '#121018'; ctx.fill(); ctx.strokeStyle = frame || '#08070a'; ctx.lineWidth = 0.06; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.04; ctx.beginPath(); ctx.moveTo(s * 0.18, -0.12); ctx.lineTo(s * 0.3, 0.02); ctx.stroke();
    }
    ctx.strokeStyle = frame || '#08070a'; ctx.lineWidth = 0.07; ctx.beginPath(); ctx.moveTo(-0.08, -0.15); ctx.lineTo(0.08, -0.15); ctx.stroke();
  },
  eye(ctx, x, y, s, col, look) {
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, y, 0.13 * s, 0.16 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = col || '#3a2a1a'; ctx.beginPath(); ctx.arc(x + (look || 0) * 0.03, y + 0.02 * s, 0.085 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0a0606'; ctx.beginPath(); ctx.arc(x + (look || 0) * 0.03, y + 0.02 * s, 0.045 * s, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + 0.035 * s, y - 0.04 * s, 0.03 * s, 0, TAU); ctx.fill();
  },
  grin(ctx, y, w, teeth) {
    ctx.fillStyle = '#5a1e1a'; ctx.beginPath(); ctx.moveTo(-w, y); ctx.quadraticCurveTo(0, y + w * 1.15, w, y); ctx.quadraticCurveTo(0, y + w * 0.3, -w, y); ctx.fill();
    if (teeth) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-w * 0.86, y + w * 0.06); ctx.quadraticCurveTo(0, y + w * 0.42, w * 0.86, y + w * 0.06); ctx.quadraticCurveTo(0, y + w * 0.3, -w * 0.86, y + w * 0.06); ctx.fill(); }
  },
  brow(ctx, x, y, w, ang, col, th) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.strokeStyle = col; ctx.lineWidth = th || 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.stroke(); ctx.restore(); },
  heart(ctx, x, y, s) { ctx.beginPath(); ctx.moveTo(x, y + s * 0.9); ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.6, y - s * 1.1, x, y - s * 0.35); ctx.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.4, y - s * 0.1, x, y + s * 0.9); ctx.closePath(); },
  flower(ctx, x, y, r, col, mid) {
    ctx.fillStyle = col; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, r * 0.32, a, 0, TAU); ctx.fill(); }
    ctx.fillStyle = mid || '#ffd84a'; ctx.beginPath(); ctx.arc(x, y, r * 0.32, 0, TAU); ctx.fill();
  },
  peace(ctx, x, y, r, col, w) {
    ctx.strokeStyle = col; ctx.lineWidth = w || r * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.moveTo(x, y); ctx.lineTo(x - r * 0.7, y + r * 0.7); ctx.moveTo(x, y); ctx.lineTo(x + r * 0.7, y + r * 0.7); ctx.stroke();
  },
  neonGlow(ctx, col, blur) { ctx.shadowColor = col; ctx.shadowBlur = blur; ctx.strokeStyle = col; ctx.fillStyle = col; }
};

const KART_DRIVERS = {
  brady(look) {
    const A = KartProj, L = look || {};
    const skin = (SKIN_TONES[L.skin] || SKIN_TONES[1]), hair = HAIR_COLORS[L.hair] || HAIR_COLORS[0];
    const tat = L.tattoos !== false, ink = '#15131a';
    const inkArm = (ctx, pa, pb, r, from, to) => {
      if (!tat) return;
      const dx = pb[0] - pa[0], dy = pb[1] - pa[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, px = -uy, py = ux, R = r * A.SC;
      ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineWidth = Math.max(0.6, R * 0.22);
      const n = Math.max(2, Math.round(len / (R * 1.1)));
      for (let i = 0; i <= n; i++) {
        const k = lerp(from, to, i / n), cx = pa[0] + dx * k, cy = pa[1] + dy * k;
        if (i % 2 === 0) { ctx.beginPath(); ctx.moveTo(cx + px * R * 0.85, cy + py * R * 0.85); ctx.lineTo(cx - px * R * 0.85, cy - py * R * 0.85); ctx.stroke(); }
        else { ctx.beginPath(); ctx.moveTo(cx + ux * R * 0.45, cy + uy * R * 0.45); ctx.lineTo(cx + px * R * 0.5, cy + py * R * 0.5); ctx.lineTo(cx - ux * R * 0.45, cy - uy * R * 0.45); ctx.lineTo(cx - px * R * 0.5, cy - py * R * 0.5); ctx.closePath(); ctx.fill(); }
      }
    };
    const head = kartRig({
      shirt: '#121117', sleeve: '#16151c', skin: skin.base, fore: skin.base,
      upperAfter: (ctx, pa, pb, r) => inkArm(ctx, pa, pb, r, 0.55, 1),
      foreAfter: (ctx, pa, pb, r) => inkArm(ctx, pa, pb, r, 0.05, 0.7),
      torso: { neck: skin.sh, back: ctx => { ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 0.02; ctx.beginPath(); ctx.moveTo(-0.12, -0.2); ctx.quadraticCurveTo(0, -0.24, 0.12, -0.2); ctx.stroke(); } }, headR: 0.3
    });
    const r = 0.3, bun = L.style !== 'down';
    const parts = [];
    if (bun) {
      const az = Math.PI, el = 0.62, ce = Math.cos(el);
      const bp = [head[0] + Math.sin(az) * ce * r * 1.08, head[1] + Math.sin(el) * r * 1.08, head[2] + Math.cos(az) * ce * r * 1.08];
      parts.push({ p: bp, f: ctx => {
        const [x, y] = A.P(bp[0], bp[1], bp[2]), R = r * 0.46 * A.SC;
        const g = ctx.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.1, x, y, R * 1.1);
        g.addColorStop(0, hair.hi); g.addColorStop(0.6, hair.base); g.addColorStop(1, shade(hair.base, -0.35));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, R * 1.05, R * 0.92, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(shade(hair.base, -0.6), 0.7); ctx.lineWidth = A.lw(0.02); ctx.stroke();
        ctx.strokeStyle = rgba(hair.hi, 0.7); ctx.lineWidth = A.lw(0.015); ctx.beginPath(); ctx.arc(x, y, R * 0.55, -2.4, 0.6); ctx.stroke();
      } });
    } else {
      const hp = [head[0], head[1] - r * 0.9, head[2] - r * 0.55];
      parts.push({ p: hp, bias: -0.05, f: ctx => {
        const a = A.P(head[0], head[1], head[2] - r * 0.3), b = A.P(hp[0], hp[1], hp[2]), w = r * 0.95 * A.SC;
        ctx.fillStyle = hair.base; ctx.beginPath(); ctx.moveTo(a[0] - w, a[1]); ctx.quadraticCurveTo(b[0] - w * 1.05, b[1], b[0] - w * 0.6, b[1] + w * 0.4); ctx.lineTo(b[0] + w * 0.6, b[1] + w * 0.4); ctx.quadraticCurveTo(b[0] + w * 1.05, b[1], a[0] + w, a[1]); ctx.closePath(); ctx.fill();
      } });
    }
    kartHead(head, r, {
      base: hair.base, skin: skin.base, skinSh: skin.sh, face: [0, -0.32, 0.92], parts, sheen: rgba(hair.hi, 0.45),
      features: (ctx, c, rr) => {
        const glasses = L.glasses || 'shades';
        if (L.beard !== false) A.sdecal(ctx, c, rr, 0, -0.55, k => { k.fillStyle = rgba(shade(hair.base, -0.2), 0.42); k.beginPath(); k.ellipse(0, 0.08, 0.62, 0.38, 0, 0, TAU); k.fill(); });
        A.sdecal(ctx, c, rr, 0, -0.08, k => { k.fillStyle = skin.sh; k.beginPath(); k.moveTo(0, -0.18); k.lineTo(0.09, 0.08); k.lineTo(-0.09, 0.08); k.fill(); });
        A.sdecal(ctx, c, rr, 0, -0.5, k => KartFace.grin(k, -0.1, 0.36, true));
        if (glasses === 'shades') A.sdecal(ctx, c, rr, 0, 0.2, k => KartFace.shades(k));
        else {
          A.sdecal(ctx, c, rr, 0, 0.2, k => { KartFace.eye(k, -0.27, -0.02, 1, '#4a3a24'); KartFace.eye(k, 0.27, -0.02, 1, '#4a3a24'); if (glasses === 'clear') KartFace.shades(k, 'rgba(200,230,255,0.25)', '#1a1820'); });
        }
        A.sdecal(ctx, c, rr, 0, 0.42, k => { KartFace.brow(k, -0.27, 0, 0.26, -0.08, shade(hair.base, -0.3)); KartFace.brow(k, 0.27, 0, 0.26, 0.08, shade(hair.base, -0.3)); });
        for (const s of [-1, 1]) A.sdecal(ctx, c, rr, s * 1.45, -0.05, k => { k.fillStyle = skin.sh; k.beginPath(); k.ellipse(0, 0, 0.14, 0.22, 0, 0, TAU); k.fill(); });
        // combed-back strands
        A.sdecal(ctx, c, rr, Math.PI, 0.35, k => { k.strokeStyle = rgba(hair.hi, 0.6); k.lineWidth = 0.05; for (let i = -1; i <= 1; i++) { k.beginPath(); k.moveTo(i * 0.25, 0.6); k.quadraticCurveTo(i * 0.18, 0, i * 0.08, -0.4); k.stroke(); } }, -0.5);
      }
    });
  },
  chinka() {
    const A = KartProj, skin = '#d9a07a', hair = '#1c1418', hairHi = '#4a3440';
    const head = kartRig({
      shirt: '#8a5232', skin, k: 0.94, tw: 0.24, headR: 0.29,
      torso: {
        neck: shade(skin, -0.15),
        front: ctx => { ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 0.015; ctx.beginPath(); ctx.moveTo(-0.15, -0.2); ctx.quadraticCurveTo(0, -0.05, 0.15, -0.2); ctx.stroke(); },
        glow: ctx => { // LED necklace
          const cols = ['#ff4fd8', '#38f2ff', '#ffd84a', '#7aff8a'];
          A.frame(ctx, 0, 0.78, -0.3 + 0.15, [1, 0, 0], [0, 1, 0], [0, 0, 1], 1, k => { for (let i = 0; i < 9; i++) { const a = Math.PI * (0.15 + 0.7 * i / 8); k.fillStyle = cols[i % 4]; k.shadowColor = cols[i % 4]; k.shadowBlur = 6; k.beginPath(); k.arc(Math.cos(a) * 0.13, -0.17 + Math.sin(a) * 0.1, 0.022, 0, TAU); k.fill(); } });
        }
      }
    });
    const r = 0.29;
    const back = [head[0], head[1] - 0.34, head[2] - 0.19];
    const longHair = { p: back, f: ctx => {
      const t = A.P(head[0], head[1] + r * 0.2, head[2] - r * 0.25), b = A.P(back[0], back[1], back[2]);
      const w = r * 1.12 * A.SC * Math.max(0.75, Math.abs(Math.cos(A.theta)) * 0.3 + 0.75);
      ctx.fillStyle = hair; ctx.beginPath(); ctx.moveTo(t[0] - w, t[1]);
      ctx.bezierCurveTo(t[0] - w * 1.25, (t[1] + b[1]) / 2, b[0] - w * 1.4, b[1] - w * 0.2, b[0] - w * 1.05, b[1] + w * 0.25);
      for (let i = 0; i <= 6; i++) { const x = b[0] - w * 1.05 + i * w * 2.1 / 6; ctx.quadraticCurveTo(x - w * 0.12, b[1] + w * (0.55 + (i % 2) * 0.12), x, b[1] + w * 0.28); }
      ctx.bezierCurveTo(b[0] + w * 1.4, b[1] - w * 0.2, t[0] + w * 1.25, (t[1] + b[1]) / 2, t[0] + w, t[1]); ctx.closePath();
      const g = ctx.createLinearGradient(0, t[1], 0, b[1] + w * 0.6); g.addColorStop(0, hairHi); g.addColorStop(1, hair);
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(120,90,110,0.5)'; ctx.lineWidth = A.lw(0.015);
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(t[0] + i * w * 0.35, t[1] + w * 0.3); ctx.bezierCurveTo(t[0] + i * w * 0.5 + w * 0.2, (t[1] + b[1]) / 2, b[0] + i * w * 0.45 - w * 0.2, b[1], b[0] + i * w * 0.42, b[1] + w * 0.35); ctx.stroke(); }
    } };
    A.add(A.P(back[0], back[1], back[2])[2], longHair.f);
    kartHead(head, r, {
      base: hair, skin, face: [0, -0.3, 0.88], sheen: 'rgba(150,110,140,0.55)',
      features: (ctx, c, rr) => {
        A.sdecal(ctx, c, rr, 0, -0.5, k => KartFace.grin(k, -0.08, 0.3, true));
        A.sdecal(ctx, c, rr, 0, 0.18, k => { // cat-eye sunglasses
          for (const s of [-1, 1]) { k.beginPath(); k.moveTo(s * 0.05, -0.12); k.quadraticCurveTo(s * 0.3, -0.26, s * 0.56, -0.24); k.quadraticCurveTo(s * 0.5, 0.14, s * 0.3, 0.12); k.quadraticCurveTo(s * 0.08, 0.12, s * 0.05, -0.12); k.fillStyle = '#2a1220'; k.fill(); k.strokeStyle = '#ff7ab0'; k.lineWidth = 0.05; k.stroke(); }
          k.strokeStyle = 'rgba(255,255,255,0.45)'; k.lineWidth = 0.04; k.beginPath(); k.moveTo(-0.32, -0.12); k.lineTo(-0.22, 0); k.moveTo(0.22, -0.12); k.lineTo(0.32, 0); k.stroke();
        });
        A.sdecal(ctx, c, rr, 0, -0.12, k => { k.fillStyle = shade(skin, -0.22); k.beginPath(); k.moveTo(0, -0.12); k.lineTo(0.07, 0.08); k.lineTo(-0.07, 0.08); k.fill(); });
        for (const s of [-1, 1]) A.sdecal(ctx, c, rr, s * 0.62, -0.38, k => { k.fillStyle = 'rgba(255,110,120,0.25)'; k.beginPath(); k.arc(0, 0, 0.13, 0, TAU); k.fill(); });
        // wavy fringe framing the face
        for (const s of [-1, 1]) A.sdecal(ctx, c, rr, s * 0.95, -0.15, k => { k.fillStyle = hair; k.beginPath(); k.moveTo(-0.2, -0.75); k.quadraticCurveTo(0.25 * s, -0.2, -0.05, 0.45); k.quadraticCurveTo(0.3 * s, 0.85, 0.05, 1.0); k.lineTo(0.35, 1.0); k.quadraticCurveTo(0.45 * s, 0.2, 0.3, -0.75); k.fill(); }, -0.3);
        A.sdecal(ctx, c, rr, 0, 0.72, k => { k.fillStyle = hair; k.beginPath(); k.moveTo(-0.9, 0.3); k.quadraticCurveTo(-0.3, -0.1, 0.1, 0.25); k.quadraticCurveTo(0.5, -0.05, 0.9, 0.3); k.lineTo(0.9, -0.6); k.lineTo(-0.9, -0.6); k.fill(); }, -0.2);
      }
    });
  },
  slothy() {
    const A = KartProj, fur = '#8c7a62', furD = '#5e4e3c', face = '#e6d6b8';
    const head = kartRig({ shirt: fur, skin: fur, sleeve: fur, fore: fur, hand: '#d8c8a8', tw: 0.3, td: 0.2, th: 0.5, armR: 0.075, sy: 0.42, sz: -0.12, reach: 0.42, torso: { neck: furD, front: ctx => { ctx.fillStyle = 'rgba(240,226,200,0.55)'; ctx.beginPath(); ctx.ellipse(0, 0.02, 0.18, 0.2, 0, 0, TAU); ctx.fill(); } }, headR: 0.34 });
    const r = 0.34, cols = ['#ff6a9a', '#ffd84a', '#8affc8', '#ff8a3a', '#c79aff', '#ffffff'];
    const parts = [];
    for (let i = 0; i < 10; i++) {
      const az = i / 10 * TAU, el = 0.62, ce = Math.cos(el);
      const p = [head[0] + Math.sin(az) * ce * r * 1.02, head[1] + Math.sin(el) * r * 1.02, head[2] + Math.cos(az) * ce * r * 1.02];
      parts.push({ p, f: ctx => { const q = A.P(p[0], p[1], p[2]); KartFace.flower(ctx, q[0], q[1], r * 0.3 * A.SC, cols[i % cols.length], '#ffef8a'); ctx.fillStyle = '#3a8a3a'; ctx.beginPath(); ctx.ellipse(q[0] + r * 0.2 * A.SC, q[1] + r * 0.12 * A.SC, r * 0.12 * A.SC, r * 0.06 * A.SC, 0.5, 0, TAU); ctx.fill(); } });
    }
    kartHead(head, r, {
      base: fur, skin: face, face: [0, -0.15, 0.95], parts,
      features: (ctx, c, rr) => {
        // goggles strap + lenses resting on the forehead
        A.sdecal(ctx, c, rr, 0, 0.38, k => {
          k.fillStyle = '#5a3a1a'; k.fillRect(-1.2, -0.08, 2.4, 0.16);
          for (const s of [-1, 1]) { k.fillStyle = '#c8a050'; k.beginPath(); k.arc(s * 0.3, 0, 0.22, 0, TAU); k.fill(); k.fillStyle = '#5adcff'; k.beginPath(); k.arc(s * 0.3, 0, 0.15, 0, TAU); k.fill(); k.fillStyle = 'rgba(255,255,255,0.7)'; k.beginPath(); k.arc(s * 0.3 - 0.05, -0.05, 0.05, 0, TAU); k.fill(); }
        }, 0.05);
        A.sdecal(ctx, c, rr, 0, -0.08, k => {
          for (const s of [-1, 1]) { k.fillStyle = furD; k.beginPath(); k.ellipse(s * 0.3, 0.06, 0.26, 0.14, s * -0.45, 0, TAU); k.fill(); k.fillStyle = '#1a1210'; k.beginPath(); k.arc(s * 0.27, 0.02, 0.07, 0, TAU); k.fill(); k.fillStyle = '#fff'; k.beginPath(); k.arc(s * 0.27 + 0.02, 0, 0.022, 0, TAU); k.fill(); }
          k.fillStyle = '#2a1a14'; k.beginPath(); k.ellipse(0, 0.28, 0.12, 0.08, 0, 0, TAU); k.fill();
          k.strokeStyle = '#3a2418'; k.lineWidth = 0.05; k.lineCap = 'round'; k.beginPath(); k.moveTo(-0.2, 0.46); k.quadraticCurveTo(0, 0.6, 0.2, 0.46); k.stroke();
        });
      }
    });
  },
  toadie() {
    const A = KartProj, g = '#5ac85a', gD = '#2e8a3e', belly = '#e8f0a0';
    const head = kartRig({ shirt: g, skin: g, sleeve: g, fore: g, hand: '#7ade6a', k: 0.82, tw: 0.24, td: 0.18, th: 0.42, sy: 0.4, sz: -0.1, reach: 0.38, headR: 0.34, torso: { neck: gD, front: ctx => { ctx.fillStyle = belly; ctx.beginPath(); ctx.ellipse(0, 0.04, 0.15, 0.17, 0, 0, TAU); ctx.fill(); } } });
    // tutu: frilly ring around the waist
    const ty = 0.46, tz = -0.1;
    const tutu = (ctx, front) => {
      const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; const rr = 0.36 + (i % 2) * 0.05; pts.push(A.P(Math.sin(a) * rr, ty + (i % 2) * 0.02, tz + Math.cos(a) * rr)); }
      ctx.fillStyle = front ? '#ff9ad8' : '#e070b8'; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffd0f0'; ctx.lineWidth = A.lw(0.02); ctx.stroke();
    };
    A.add(A.P(0, ty, tz)[2] + 0.02, ctx => tutu(ctx, true));
    const r = 0.34;
    const parts = [];
    for (const s of [-1, 1]) {
      const ep = [head[0] + s * r * 0.5, head[1] + r * 0.72, head[2] + r * 0.32];
      parts.push({ p: ep, f: ctx => {
        const q = A.P(ep[0], ep[1], ep[2]), R = r * 0.36 * A.SC;
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], R, 0, TAU); ctx.fill(); ctx.strokeStyle = gD; ctx.lineWidth = A.lw(0.02); ctx.stroke();
        const f = A.facing(s * 0.3, 0.3, 0.9);
        if (f > -0.2) {
          const e = A.dirS(s * 0.2, 0.15, 0.95), el = Math.hypot(e[0], e[1]) || 1;
          const ox = q[0] + e[0] / el * R * 0.35 * clamp(f + 0.4, 0, 1), oy = q[1] + e[1] / el * R * 0.35 * clamp(f + 0.4, 0, 1);
          ctx.fillStyle = '#fff8d8'; ctx.beginPath(); ctx.arc(ox, oy, R * 0.68, 0, TAU); ctx.fill();
          ctx.fillStyle = '#16100a'; ctx.beginPath(); ctx.ellipse(ox, oy, R * 0.42, R * 0.24, 0, 0, TAU); ctx.fill();
          // goggle ring
          ctx.strokeStyle = '#ff8a3a'; ctx.lineWidth = A.lw(0.05); ctx.beginPath(); ctx.arc(ox, oy, R * 0.78, 0, TAU); ctx.stroke();
          ctx.fillStyle = 'rgba(160,230,255,0.35)'; ctx.beginPath(); ctx.arc(ox, oy, R * 0.76, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(ox - R * 0.25, oy - R * 0.25, R * 0.14, 0, TAU); ctx.fill();
        }
      } });
    }
    kartHead(head, r, {
      base: g, skin: belly, face: [0, -0.85, 0.62], parts, squash: [1.12, 0.92],
      features: (ctx, c, rr) => {
        A.sdecal(ctx, c, rr, 0, -0.28, k => { k.strokeStyle = '#1e4a24'; k.lineWidth = 0.06; k.lineCap = 'round'; k.beginPath(); k.moveTo(-0.62, -0.1); k.quadraticCurveTo(0, 0.25, 0.62, -0.1); k.stroke(); k.fillStyle = 'rgba(255,120,150,0.4)'; k.beginPath(); k.arc(-0.55, 0.05, 0.1, 0, TAU); k.arc(0.55, 0.05, 0.1, 0, TAU); k.fill(); });
        A.sdecal(ctx, c, rr, Math.PI, 0.2, k => { k.fillStyle = gD; for (let i = 0; i < 5; i++) { k.beginPath(); k.arc(-0.4 + i * 0.2, (i % 2) * 0.2, 0.07, 0, TAU); k.fill(); } }, -0.5);
      }
    });
  },
  theman(look, pose) {
    // a tall wooden lattice stick figure with a glowing diamond head and a neon outline
    const A = KartProj, wood = '#c8935a', ink = 'rgba(58,30,10,0.85)', neon = '#ff6a2a', gold = '#ffd27a';
    const up = pose === 'up', z0 = -0.26;
    const neonGlow = (ctx, pa, pb) => { ctx.lineCap = 'round'; ctx.shadowColor = neon; ctx.shadowBlur = A.SC * 0.25; ctx.strokeStyle = neon; ctx.lineWidth = A.lw(0.05); ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke(); ctx.strokeStyle = '#ffe2b0'; ctx.lineWidth = A.lw(0.018); ctx.stroke(); };
    const tube = (ctx, pa, pb) => { ctx.strokeStyle = '#ffb27a'; ctx.lineWidth = A.lw(0.016); ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke(); };
    const beam = (p, q, r, lit) => A.limb(p, q, r || 0.032, wood, { line: ink, after: lit ? tube : null, glow: lit ? neonGlow : null });
    // two parallel thin beams with ties and a zig-zag brace: reads as a wooden lattice
    const truss = (p, q, w, n, lit) => {
      const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, ox = -dy / l * w / 2, oy = dx / l * w / 2;
      const P = (t, s2) => [lerp(p[0], q[0], t) + ox * s2, lerp(p[1], q[1], t) + oy * s2, lerp(p[2], q[2], t)];
      beam(P(0, -1), P(1, -1), 0.026, lit); beam(P(0, 1), P(1, 1), 0.026, false);
      for (let i = 0; i <= n; i++) beam(P(i / n, -1), P(i / n, 1), 0.016);
      for (let i = 0; i < n; i++) beam(P(i / n, i % 2 ? 1 : -1), P((i + 1) / n, i % 2 ? -1 : 1), 0.014);
    };
    // seated legs (mostly hidden by the plinth)
    for (const sg of [-1, 1]) { truss([sg * 0.13, 0.52, z0], [sg * 0.16, 0.64, 0.12], 0.07, 2, true); beam([sg * 0.16, 0.64, 0.12], [sg * 0.15, 0.42, 0.3], 0.026); }
    // torso: tapered truss from hips to shoulders
    const hipY = 0.52, midY = 0.95, shY = 1.38;
    for (const sg of [-1, 1]) { beam([sg * 0.13, hipY, z0], [sg * 0.18, midY, z0], 0.035, true); beam([sg * 0.18, midY, z0], [sg * 0.22, shY, z0], 0.035, true); }
    beam([-0.15, hipY, z0], [0.15, hipY, z0], 0.024); beam([-0.19, midY, z0], [0.19, midY, z0], 0.022); beam([-0.35, shY, z0], [0.35, shY, z0], 0.03, true);
    beam([-0.13, hipY, z0], [0.18, midY, z0], 0.016); beam([0.13, hipY, z0], [-0.18, midY, z0], 0.016);
    beam([-0.18, midY, z0], [0.22, shY, z0], 0.016); beam([0.18, midY, z0], [-0.22, shY, z0], 0.016);
    // arms: hands on the wheel, or flung up in triumph
    for (const sg of [-1, 1]) {
      const S = [sg * 0.33, shY - 0.02, z0];
      if (up) { const E = [sg * 0.52, 1.6, z0 - 0.02], H = [sg * 0.67, 1.9, z0 - 0.04]; truss(S, E, 0.075, 2, true); truss(E, H, 0.065, 2, true); for (const f of [-0.35, 0, 0.35]) beam(H, [H[0] + sg * 0.05 + f * 0.06, H[1] + 0.07, H[2]], 0.014); }
      else { const E = [sg * 0.4, 1.04, -0.02], H = [sg * 0.14, 0.88, 0.24]; truss(S, E, 0.065, 2, true); beam(E, H, 0.03, true); }
    }
    // steering wheel on a column
    const wz = 0.28, wy = 0.84, tilt = 0.85;
    A.ring([0, wy, wz], [1, 0, 0], [0, Math.cos(tilt), Math.sin(tilt)], 0.15, '#3a2a1e', 0.035, {});
    A.limb([0, wy - 0.02, wz + 0.02], [0, 0.46, wz + 0.28], 0.025, '#4a3428', {});
    // neck + glowing diamond head
    beam([0, shY, z0], [0, 1.46, z0], 0.028);
    const C = [0, 1.72, z0], T = [0, 1.98, z0], Bm = [0, 1.45, z0], F = [0, 1.72, z0 + 0.13], K = [0, 1.72, z0 - 0.13], L = [-0.17, 1.72, z0], R = [0.17, 1.72, z0];
    const faces = [[T, F, R], [T, R, K], [T, K, L], [T, L, F], [Bm, R, F], [Bm, K, R], [Bm, L, K], [Bm, F, L]];
    for (const f of faces) A.poly(f, gold, { c: C, amt: 0.55, line: 'rgba(150,70,10,0.8)', lw: 0.02,
      glow: (ctx, pr) => { KartProj.pathPts(ctx, pr); ctx.shadowColor = '#ffb84a'; ctx.shadowBlur = A.SC * 0.45; ctx.fillStyle = '#ffe9a8'; ctx.fill(); } });
    A.at(C[0], C[1], C[2], (ctx, x, y, Sc) => { const g = ctx.createRadialGradient(x, y, 0, x, y, Sc * 0.14); g.addColorStop(0, 'rgba(255,255,235,0.9)'); g.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, Sc * 0.14, 0, TAU); ctx.fill(); }, null, 0.3);
  },
  hippie() {
    const A = KartProj, skin = '#e0a882', hair = '#6a4a2a', hairHi = '#9a7448';
    const tie = (ctx, top, bot, w) => {
      const cx = top[0], cy = (top[1] + bot[1]) / 2;
      let g;
      if (ctx.createConicGradient) { g = ctx.createConicGradient(A.theta * 2, cx, cy); ['#ff4a6a', '#ffb84a', '#fff04a', '#5aff7a', '#4ac8ff', '#a05aff', '#ff4a6a'].forEach((c, i) => g.addColorStop(i / 6, c)); }
      else { g = ctx.createRadialGradient(cx, cy, 1, cx, cy, w * 1.4); ['#ff4a6a', '#ffd84a', '#5aff7a', '#4ac8ff', '#a05aff'].forEach((c, i) => g.addColorStop(i / 4, c)); }
      return g;
    };
    const head = kartRig({
      shirt: '#ff8a4a', skin, fore: skin, sleeve: '#ffd84a', headR: 0.3, sy: 0.4,
      torso: {
        fill: tie, neck: shade(skin, -0.15),
        front: ctx => { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(0, -0.02, 0.1, 0, TAU); ctx.fill(); KartFace.peace(ctx, 0, -0.02, 0.075, '#c0c4cc', 0.02); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 0.012; ctx.beginPath(); ctx.moveTo(-0.08, -0.25); ctx.lineTo(0, -0.1); ctx.lineTo(0.08, -0.25); ctx.stroke(); }
      }
    });
    // bald on top with a rainbow headband, round shades and a big beard (matches the platformer hippie)
    const r = 0.3, parts = [];
    kartHead(head, r, {
      base: skin, skin, face: [0, -0.3, 0.86], parts, sheen: 'rgba(255,230,200,0.55)',
      features: (ctx, c, rr) => {
        A.sdecal(ctx, c, rr, 0, -0.62, k => { k.fillStyle = shade(hair, -0.1); k.beginPath(); k.moveTo(-0.55, -0.35); k.quadraticCurveTo(-0.6, 0.45, 0, 0.62); k.quadraticCurveTo(0.6, 0.45, 0.55, -0.35); k.quadraticCurveTo(0, 0.05, -0.55, -0.35); k.fill(); });
        A.sdecal(ctx, c, rr, 0, -0.42, k => KartFace.grin(k, -0.05, 0.22, true));
        A.sdecal(ctx, c, rr, 0, 0.16, k => { for (const s of [-1, 1]) { k.fillStyle = 'rgba(255,140,40,0.75)'; k.beginPath(); k.arc(s * 0.27, 0, 0.19, 0, TAU); k.fill(); k.strokeStyle = '#c0a050'; k.lineWidth = 0.05; k.stroke(); } k.beginPath(); k.moveTo(-0.08, -0.02); k.lineTo(0.08, -0.02); k.stroke(); });
        A.sdecal(ctx, c, rr, 0, 0.5, k => { const cs = ['#ff3a4a', '#ffd84a', '#3ad85a']; cs.forEach((cc, i) => { k.fillStyle = cc; k.fillRect(-1.3, -0.1 + i * 0.075, 2.6, 0.075); }); }, -0.4);
        A.sdecal(ctx, c, rr, Math.PI, 0.5, k => { const cs = ['#ff3a4a', '#ffd84a', '#3ad85a']; cs.forEach((cc, i) => { k.fillStyle = cc; k.fillRect(-1.3, -0.1 + i * 0.075, 2.6, 0.075); }); }, -0.4);
      }
    });
  },
  techbro() {
    const A = KartProj, skin = '#f0c4a0', hair = '#b8945a';
    const head = kartRig({
      shirt: '#8a8e9a', skin, sleeve: '#a8c8f0', fore: '#a8c8f0', hand: skin, headR: 0.29,
      torso: {
        neck: shade(skin, -0.15),
        front: ctx => { ctx.fillStyle = '#a8c8f0'; ctx.beginPath(); ctx.moveTo(-0.07, -0.26); ctx.lineTo(0.07, -0.26); ctx.lineTo(0.05, 0.26); ctx.lineTo(-0.05, 0.26); ctx.fill(); ctx.strokeStyle = '#4a4e5a'; ctx.lineWidth = 0.012; ctx.beginPath(); ctx.moveTo(-0.075, -0.26); ctx.lineTo(-0.055, 0.26); ctx.moveTo(0.075, -0.26); ctx.lineTo(0.055, 0.26); ctx.stroke(); ctx.fillStyle = '#e8e8f0'; ctx.fillRect(0.1, -0.12, 0.07, 0.05); },
        back: ctx => { ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 0.012; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-0.22, -0.2 + i * 0.12); ctx.lineTo(0.22, -0.2 + i * 0.12); ctx.stroke(); } }
      }
    });
    const r = 0.29, parts = [];
    kartHead(head, r, {
      base: hair, skin, face: [0, -0.35, 0.95], parts, sheen: 'rgba(240,210,150,0.5)',
      features: (ctx, c, rr) => {
        A.sdecal(ctx, c, rr, 0, -0.45, k => { k.strokeStyle = '#7a3020'; k.lineWidth = 0.07; k.lineCap = 'round'; k.beginPath(); k.moveTo(-0.28, 0); k.quadraticCurveTo(0.05, 0.12, 0.3, -0.12); k.stroke(); });
        A.sdecal(ctx, c, rr, 0, 0.08, k => { KartFace.eye(k, -0.27, 0, 0.9, '#3a6aa0', 0.5); KartFace.eye(k, 0.27, 0, 0.9, '#3a6aa0', 0.5); k.fillStyle = 'rgba(240,196,160,1)'; k.fillRect(-0.45, -0.18, 0.36, 0.08); k.fillRect(0.09, -0.18, 0.36, 0.06); });
        A.sdecal(ctx, c, rr, 0, 0.36, k => { KartFace.brow(k, -0.27, 0.02, 0.26, -0.15, '#7a5a30'); KartFace.brow(k, 0.27, -0.04, 0.26, -0.3, '#7a5a30'); });
        A.sdecal(ctx, c, rr, 0, -0.12, k => { k.fillStyle = shade(skin, -0.2); k.beginPath(); k.moveTo(0, -0.12); k.lineTo(0.07, 0.08); k.lineTo(-0.07, 0.08); k.fill(); });
        for (const s of [-1, 1]) A.sdecal(ctx, c, rr, s * 1.45, -0.05, k => { k.fillStyle = shade(skin, -0.1); k.beginPath(); k.ellipse(0, 0, 0.14, 0.22, 0, 0, TAU); k.fill(); k.fillStyle = '#ffffff'; k.beginPath(); k.arc(0, 0.12, 0.07, 0, TAU); k.fill(); });
        // VR headset pushed up + strap
        A.sdecal(ctx, c, rr, 0, 0.78, k => { k.fillStyle = '#1a1c24'; kartRR(k, -0.62, -0.3, 1.24, 0.5, 0.15); k.fill(); k.fillStyle = '#3a4050'; kartRR(k, -0.55, -0.24, 1.1, 0.16, 0.06); k.fill(); }, -0.1);
        for (const az of [Math.PI / 2, -Math.PI / 2, Math.PI]) A.sdecal(ctx, c, rr, az, 0.75, k => { k.fillStyle = '#26282e'; k.fillRect(-0.7, -0.08, 1.4, 0.16); }, -0.1);
      },
      glow: (ctx, c, rr) => { A.sdecal(ctx, c, rr, 0, 0.78, k => { k.fillStyle = '#38f2ff'; k.shadowColor = '#38f2ff'; k.shadowBlur = 5; k.fillRect(-0.5, -0.05, 1.0, 0.07); }, 0.05); }
    });
  },
  dpw() {
    const A = KartProj, skin = '#c98a5a', suit = '#d9782a';
    const head = kartRig({
      shirt: suit, skin, sleeve: suit, fore: suit, hand: '#e8d0a0', tw: 0.27, td: 0.17, headR: 0.29,
      torso: {
        neck: shade(skin, -0.2),
        front: ctx => { ctx.fillStyle = '#d8dce0'; ctx.fillRect(-0.27, 0.05, 0.54, 0.05); ctx.fillStyle = shade(suit, -0.25); ctx.fillRect(-0.03, -0.25, 0.06, 0.5); ctx.fillRect(0.08, -0.14, 0.11, 0.09); ctx.fillStyle = 'rgba(120,80,40,0.35)'; ctx.beginPath(); ctx.arc(-0.12, 0.15, 0.06, 0, TAU); ctx.fill(); },
        back: ctx => { ctx.fillStyle = '#d8dce0'; ctx.fillRect(-0.27, 0.05, 0.54, 0.05); ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 0.13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('DPW', 0, -0.06); ctx.fillStyle = 'rgba(120,80,40,0.3)'; ctx.beginPath(); ctx.arc(0.1, 0.17, 0.07, 0, TAU); ctx.fill(); }
      }
    });
    // DPW's trademark: a yellow hard hat with rebar poking out of the top (matches the platformer burner)
    const r = 0.29, parts = [];
    const brimY = head[1] + r * 0.55, brimR = r * 1.24;
    const brimHalf = front => ctx => {
      const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; const fwd = Math.cos(a) > 0.6 ? 1.18 : 1; const p = A.P(head[0] + Math.sin(a) * brimR, brimY, head[2] + Math.cos(a) * brimR * 0.95 * fwd); pts.push(p); }
      const c = A.P(head[0], brimY, head[2]);
      ctx.save(); ctx.beginPath(); ctx.rect(c[0] - 999, front ? c[1] : c[1] - 999, 1998, 999); ctx.clip();
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      ctx.fillStyle = front ? '#f2c418' : '#c89a10'; ctx.fill(); ctx.strokeStyle = '#7a5a08'; ctx.lineWidth = A.lw(0.02); ctx.stroke();
      ctx.restore();
    };
    parts.push({ p: [head[0], brimY, head[2]], bias: -0.6, f: brimHalf(false) });
    const crown = [head[0], brimY + r * 0.5, head[2]];
    parts.push({ p: crown, bias: 0.6, f: ctx => {
      const b = A.P(head[0], brimY, head[2]), t = A.P(crown[0], crown[1] + r * 0.25, crown[2]), w = r * 0.95 * A.SC;
      // rebar spikes first, so the dome covers their bases
      ctx.strokeStyle = '#8a8a92'; ctx.lineWidth = A.lw(0.035); ctx.lineCap = 'round';
      for (let i = -2; i <= 2; i++) { const k = i * 0.32, x0 = b[0] + k * w, y0 = t[1] + k * k * (b[1] - t[1]) + w * 0.06; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + k * w * 0.25, y0 - w * 0.62); ctx.stroke(); }
      ctx.fillStyle = '#f2c418'; ctx.beginPath(); ctx.moveTo(b[0] - w, b[1]); ctx.quadraticCurveTo(b[0] - w, t[1], b[0], t[1]); ctx.quadraticCurveTo(b[0] + w, t[1], b[0] + w, b[1]); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#7a5a08'; ctx.lineWidth = A.lw(0.02); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(b[0] - w * 0.35, t[1] + (b[1] - t[1]) * 0.35, w * 0.18, (b[1] - t[1]) * 0.18, -0.5, 0, TAU); ctx.fill();
      brimHalf(true)(ctx);
    } });
    kartHead(head, r, {
      base: '#6a5040', skin, face: [0, -0.2, 1.1], parts,
      features: (ctx, c, rr) => {
        A.sdecal(ctx, c, rr, 0, -0.55, k => { k.fillStyle = 'rgba(70,50,40,0.45)'; k.beginPath(); k.ellipse(0, 0.1, 0.6, 0.38, 0, 0, TAU); k.fill(); });
        A.sdecal(ctx, c, rr, 0, -0.32, k => { k.fillStyle = '#5a3a2a'; k.beginPath(); k.moveTo(-0.32, -0.05); k.quadraticCurveTo(0, -0.18, 0.32, -0.05); k.lineTo(0.28, 0.06); k.quadraticCurveTo(0, -0.04, -0.28, 0.06); k.fill(); });
        A.sdecal(ctx, c, rr, 0, -0.52, k => { k.strokeStyle = '#4a1a14'; k.lineWidth = 0.06; k.lineCap = 'round'; k.beginPath(); k.moveTo(-0.2, 0.06); k.quadraticCurveTo(0, -0.08, 0.2, 0.06); k.stroke(); });
        A.sdecal(ctx, c, rr, 0, 0.1, k => { KartFace.eye(k, -0.26, 0.02, 0.8, '#3a2a1a'); KartFace.eye(k, 0.26, 0.02, 0.8, '#3a2a1a'); k.fillStyle = skin; k.fillRect(-0.45, -0.2, 0.9, 0.1); });
        A.sdecal(ctx, c, rr, 0, 0.3, k => { KartFace.brow(k, -0.26, 0, 0.3, 0.35, '#3a2418', 0.09); KartFace.brow(k, 0.26, 0, 0.3, -0.35, '#3a2418', 0.09); });
        A.sdecal(ctx, c, rr, 0, -0.1, k => { k.fillStyle = shade(skin, -0.25); k.beginPath(); k.moveTo(0, -0.14); k.lineTo(0.09, 0.08); k.lineTo(-0.09, 0.08); k.fill(); });
        for (const s of [-1, 1]) A.sdecal(ctx, c, rr, s * 1.45, -0.1, k => { k.fillStyle = shade(skin, -0.15); k.beginPath(); k.ellipse(0, 0, 0.14, 0.22, 0, 0, TAU); k.fill(); });
        A.sdecal(ctx, c, rr, 0.3, 0.1, k => { k.fillStyle = 'rgba(200,170,120,0.25)'; k.beginPath(); k.arc(0.2, -0.2, 0.18, 0, TAU); k.fill(); }, 0.1);
      }
    });
  }
};
function kartRR(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

/* ---------------- art cars ---------------- */
function kartWheels4(o) {
  for (const s of [-1, 1]) {
    KartProj.wheel(s * o.rx, o.rr, o.rz, o.rr, o.rw, { hub: o.hub, whitewall: o.ww, tyre: o.tyre });
    KartProj.wheel(s * o.fx, o.fr, o.fz, o.fr, o.fw, { hub: o.hub, whitewall: o.ww, tyre: o.tyre });
  }
}
const kartGlowDot = (col, r) => (ctx, x, y, S) => { ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = Math.max(3, S * 0.25); ctx.beginPath(); ctx.arc(x, y, Math.max(1, S * r), 0, TAU); ctx.fill(); };
const kartDot = (col, r) => (ctx, x, y, S) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, Math.max(0.8, S * r), 0, TAU); ctx.fill(); };
// ground glow ellipse (underglow / hover light) in the glow layer only
function kartUnderglow(col, rx, rz, y, z) {
  KartProj.add(-50, () => {}, ctx => {
    const pts = []; for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; pts.push(KartProj.P(Math.sin(a) * rx, y || 0.02, (z || 0) + Math.cos(a) * rz)); }
    ctx.shadowColor = col; ctx.shadowBlur = KartProj.SC * 0.5; ctx.fillStyle = rgba(col, 0.75); KartProj.pathPts(ctx, pts); ctx.fill();
  });
}
// neon tube along a 3D polyline: base pass draws the tube, glow pass draws the halo
function kartNeon(pts3, col, w, bias) {
  const A = KartProj, pr = pts3.map(p => A.P(p[0], p[1], p[2]));
  let d = 0; for (const p of pr) d += p[2]; d /= pr.length;
  const path = ctx => { ctx.beginPath(); ctx.moveTo(pr[0][0], pr[0][1]); for (const p of pr) ctx.lineTo(p[0], p[1]); };
  A.add(d + (bias || 0.002), ctx => { path(ctx); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = shade(col, -0.2); ctx.lineWidth = A.lw(w * 1.6); ctx.stroke(); ctx.strokeStyle = mix(col, '#ffffff', 0.45); ctx.lineWidth = A.lw(w * 0.7); ctx.stroke(); },
    ctx => { path(ctx); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = col; ctx.shadowBlur = A.SC * 0.3; ctx.strokeStyle = col; ctx.lineWidth = A.lw(w * 2.2); ctx.stroke(); ctx.strokeStyle = mix(col, '#ffffff', 0.6); ctx.lineWidth = A.lw(w * 0.9); ctx.stroke(); });
}
const KART_BODIES = {
  brady() {
    const A = KartProj, body = '#1d1c24', dark = '#0f0e14', pink = '#ff4fd8';
    kartUnderglow(pink, 0.85, 1.25);
    kartWheels4({ rx: 0.66, rr: 0.3, rz: -0.62, rw: 0.28, fx: 0.6, fr: 0.24, fz: 0.68, fw: 0.2, hub: '#3a3842' });
    A.prism([[-0.5, -0.98], [0.5, -0.98], [0.56, -0.5], [0.5, 0.6], [0.28, 1.04], [-0.28, 1.04], [-0.5, 0.6], [-0.56, -0.5]], 0.12, 0.2, dark, {});
    for (const s of [-1, 1]) {
      A.frustum(-0.55, 0.42, [s > 0 ? 0.34 : -0.62, s > 0 ? 0.62 : -0.34, 0.18, 0.46], [s > 0 ? 0.34 : -0.56, s > 0 ? 0.56 : -0.34, 0.18, 0.38], body, { topGrad: pr => [pr[0], pr[2]] });
      kartNeon([[s * 0.62, 0.47, -0.55], [s * 0.56, 0.39, 0.42], [s * 0.3, 0.33, 1.04]], pink, 0.035);
    }
    A.frustum(0.3, 1.06, [-0.34, 0.34, 0.18, 0.42], [-0.24, 0.24, 0.18, 0.27], body, {
      decalTop: ctx => { ctx.fillStyle = pink; ctx.fillRect(0.44, 0, 0.12, 1); },
      decalFront: ctx => { ctx.fillStyle = '#2a2832'; ctx.fillRect(0.1, 0.25, 0.8, 0.5); }
    });
    A.box(0, 0.24, -0.25, 0.68, 0.06, 0.6, '#0a0a0e', {});
    A.box(0, 0.56, -0.53, 0.52, 0.52, 0.1, '#2a2834', { decalBack: ctx => { ctx.fillStyle = pink; ctx.font = 'bold 0.5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('B', 0.5, 0.45); } });
    A.box(0, 0.38, -0.8, 0.58, 0.36, 0.36, '#26252e', { decalTop: ctx => { ctx.fillStyle = '#5a5866'; for (let i = 0; i < 4; i++) ctx.fillRect(0.12 + i * 0.2, 0.15, 0.08, 0.7); } });
    for (const s of [-1, 1]) {
      A.at(s * 0.17, 0.4, -1.0, (ctx, x, y, S) => { ctx.fillStyle = '#9a98a8'; ctx.beginPath(); ctx.arc(x, y, S * 0.075, 0, TAU); ctx.fill(); ctx.fillStyle = '#18161c'; ctx.beginPath(); ctx.arc(x, y, S * 0.045, 0, TAU); ctx.fill(); });
      A.limb([s * 0.26, 0.5, -0.86], [s * 0.26, 0.86, -0.94], 0.025, '#3a3844');
      A.at(s * 0.3, 0.46, -0.99, kartDot('#ff2a6a', 0.05), kartGlowDot('#ff2a6a', 0.06), 0.01);
      A.at(s * 0.17, 0.3, 1.06, kartDot('#ffe8ff', 0.045), kartGlowDot('#ffd0f8', 0.06), 0.01);
    }
    A.frustum(-1.04, -0.84, [-0.64, 0.64, 0.86, 0.92], [-0.6, 0.6, 0.88, 0.93], body, { decalBack: ctx => { ctx.fillStyle = pink; ctx.fillRect(0, 0, 1, 0.3); } });
    kartNeon([[-0.64, 0.93, -1.04], [0.64, 0.93, -1.04]], pink, 0.03, 0.01);
  },
  chinka() {
    const A = KartProj, org = '#ff7a2a', top = '#ffae4a', pink = '#ff4a7a';
    kartWheels4({ rx: 0.64, rr: 0.28, rz: -0.6, rw: 0.24, fx: 0.6, fr: 0.25, fz: 0.66, fw: 0.2, hub: '#e8e8f0', ww: true });
    A.prism(kartFoot(0.56, -0.98, 1.0, 20, 3.2), 0.12, 0.2, '#6a2a1a', {});
    const sideDecal = ctx => { ctx.fillStyle = pink; ctx.beginPath(); ctx.moveTo(0, 0.55); ctx.bezierCurveTo(0.3, 0.3, 0.6, 0.8, 1, 0.45); ctx.lineTo(1, 1); ctx.lineTo(0, 1); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.fillRect(0, 0.42, 1, 0.06); };
    A.frustum(0.1, 1.02, [-0.6, 0.6, 0.18, 0.5], [-0.42, 0.42, 0.18, 0.36], org, { top, decalR: sideDecal, decalL: sideDecal, decalTop: ctx => { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0.38, 0, 0.24, 1); }, decalFront: ctx => { ctx.fillStyle = '#5a2414'; kartRR(ctx, 0.2, 0.3, 0.6, 0.45, 0.1); ctx.fill(); } });
    A.frustum(-1.0, -0.48, [-0.56, 0.56, 0.18, 0.5], [-0.6, 0.6, 0.18, 0.54], org, { top, decalR: sideDecal, decalL: sideDecal, decalBack: ctx => { ctx.fillStyle = pink; ctx.fillRect(0, 0.6, 1, 0.4); KartFace.heart(ctx, 0.5, 0.3, 0.13); ctx.fillStyle = '#ffffff'; ctx.fill(); } });
    for (const s of [-1, 1]) A.frustum(-0.48, 0.1, [s > 0 ? 0.42 : -0.6, s > 0 ? 0.6 : -0.42, 0.18, 0.46], [s > 0 ? 0.42 : -0.6, s > 0 ? 0.6 : -0.42, 0.18, 0.46], org, { top, decalR: sideDecal, decalL: sideDecal });
    A.box(0, 0.22, -0.2, 0.84, 0.05, 0.6, '#3a1a14', {});
    A.box(0, 0.46, -0.52, 0.5, 0.3, 0.08, '#c0482a', {});
    for (let i = 0; i < 7; i++) for (const s of [-1, 1]) { const z = -0.9 + i * 0.3; A.at(s * 0.6, 0.53, z, kartDot('#fff4c0', 0.025), kartGlowDot(['#ffd84a', '#ff4fd8', '#38f2ff'][i % 3], 0.035), 0.02); }
    // heart hood ornament
    const hp = [0, 0.66, 0.82];
    A.limb([0, 0.36, 0.82], [0, 0.56, 0.82], 0.02, '#e8e8f0');
    const heart = (ctx, glow) => {
      for (const fr of [[[1, 0, 0], [0, 0, 1]], [[-1, 0, 0], [0, 0, -1]]]) A.frame(ctx, hp[0], hp[1], hp[2], fr[0], [0, 1, 0], fr[1], 1, (k, f) => {
        KartFace.heart(k, 0, 0.02, 0.13);
        if (glow) { k.shadowColor = '#ff2a6a'; k.shadowBlur = 8; k.strokeStyle = '#ff6a9a'; k.lineWidth = 0.035; k.stroke(); return; }
        const g = k.createLinearGradient(0, -0.15, 0, 0.13); g.addColorStop(0, '#ff7a9a'); g.addColorStop(1, '#d01a4a');
        k.fillStyle = g; k.fill(); k.strokeStyle = '#ffd0dc'; k.lineWidth = 0.02; k.stroke();
        k.fillStyle = 'rgba(255,255,255,0.6)'; k.beginPath(); k.ellipse(-0.06, -0.05, 0.035, 0.02, -0.6, 0, TAU); k.fill();
      }, 0.0);
      // edge-on: a thin sliver so it never vanishes
      const p = A.P(hp[0], hp[1], hp[2]);
      if (!glow) { ctx.fillStyle = '#d01a4a'; ctx.fillRect(p[0] - A.SC * 0.012, p[1] - A.SC * 0.12, A.SC * 0.024, A.SC * 0.22); }
    };
    A.add(A.P(hp[0], hp[1], hp[2])[2], ctx => heart(ctx, false), ctx => heart(ctx, true));
  },
  slothy() {
    const A = KartProj, wood = '#8a5a2e', woodD = '#5a3a1c', moss = '#5aa03a', moss2 = '#7ac74f';
    kartWheels4({ rx: 0.62, rr: 0.3, rz: -0.6, rw: 0.26, fx: 0.62, fr: 0.3, fz: 0.62, fw: 0.26, hub: '#b8844a', tyre: '#2a2018' });
    A.box(0, 0.32, 0, 1.12, 0.1, 1.95, wood, { decalTop: ctx => { ctx.strokeStyle = woodD; ctx.lineWidth = 0.02; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(i / 6, 0); ctx.lineTo(i / 6, 1); ctx.stroke(); } ctx.fillStyle = moss; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc((i * 0.37) % 1, (i * 0.61) % 1, 0.06, 0, TAU); ctx.fill(); } } });
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; A.at(Math.sin(a) * 0.56, 0.38, Math.cos(a) * 0.95, (ctx, x, y, S) => { ctx.fillStyle = i % 2 ? moss : moss2; ctx.beginPath(); ctx.arc(x, y, S * 0.08, 0, TAU); ctx.fill(); }, null, 0.05); }
    // arched frame behind the driver
    const fz = -0.62;
    for (const s of [-1, 1]) { A.limb([s * 0.52, 0.36, fz - 0.05], [s * 0.46, 1.5, fz], 0.05, wood); A.limb([s * 0.46, 1.5, fz], [s * 0.15, 1.62, fz], 0.05, wood); }
    A.limb([-0.15, 1.62, fz], [0.15, 1.62, fz], 0.05, wood);
    // hanging sling (the hammock seat)
    A.add(A.P(0, 0.75, fz + 0.12)[2], ctx => {
      const pts = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12, x = lerp(-0.42, 0.42, t), y = 0.46 + Math.pow(Math.abs(t - 0.5) * 2, 2) * 0.12; pts.push(A.P(x, y, fz + 0.32 - Math.sin(t * Math.PI) * 0.12)); }
      for (let i = 12; i >= 0; i--) { const t = i / 12, x = lerp(-0.4, 0.4, t); pts.push(A.P(x, 1.15 - Math.sin(t * Math.PI) * 0.1, fz + 0.06)); }
      KartProj.pathPts(ctx, pts);
      const g = ctx.createLinearGradient(pts[0][0], 0, pts[12][0], 0); g.addColorStop(0, moss); g.addColorStop(0.5, moss2); g.addColorStop(1, shade(moss, -0.25));
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#2e5a1e'; ctx.lineWidth = A.lw(0.025); ctx.stroke();
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,240,180,0.35)'; ctx.lineWidth = A.lw(0.03);
      for (let k = 1; k < 4; k++) { const a = A.P(-0.45, 0.45 + k * 0.17, fz + 0.2), b = A.P(0.45, 0.45 + k * 0.17, fz + 0.2); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = '#d8c090'; ctx.lineWidth = A.lw(0.012);
      for (const s of [-1, 1]) { const a = A.P(s * 0.4, 1.12, fz + 0.06), b = A.P(s * 0.15, 1.6, fz); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    });
    // vines + lantern
    for (const s of [-1, 1]) A.at(s * 0.46, 1.3, fz, (ctx, x, y, S) => { ctx.strokeStyle = moss; ctx.lineWidth = Math.max(1, S * 0.025); ctx.beginPath(); ctx.moveTo(x, y - S * 0.2); ctx.quadraticCurveTo(x + S * 0.08 * s, y + S * 0.15, x, y + S * 0.45); ctx.stroke(); ctx.fillStyle = moss2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x + s * S * 0.04, y - S * 0.1 + i * S * 0.14, S * 0.05, S * 0.025, s * 0.6, 0, TAU); ctx.fill(); } }, null, 0.05);
    A.at(0.46, 1.36, fz + 0.06, (ctx, x, y, S) => { ctx.fillStyle = '#ffcf6a'; ctx.beginPath(); ctx.arc(x, y, S * 0.06, 0, TAU); ctx.fill(); ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 1; ctx.stroke(); }, kartGlowDot('#ffcf6a', 0.09), 0.08);
  },
  toadie() {
    const A = KartProj, pad = '#45a845', padD = '#2a7a34', padL = '#7ad46a';
    kartWheels4({ rx: 0.48, rr: 0.17, rz: -0.48, rw: 0.14, fx: 0.48, fr: 0.17, fz: 0.5, fw: 0.14, hub: '#ffd84a' });
    const foot = []; for (let i = 0; i <= 26; i++) { const a = 0.32 + i / 26 * (TAU - 0.64); foot.push([Math.sin(a) * 0.88, Math.cos(a) * 0.95]); } foot.push([0, 0.15]);
    A.prism(foot, 0.24, 0.32, pad, { topCol: pad, sideCol: padD, topLine: rgba(padD, 0.9), lw: 0.02 });
    A.add(A.P(0, 0.33, 0)[2] - 0.05, ctx => {
      ctx.strokeStyle = rgba(padL, 0.7); ctx.lineWidth = A.lw(0.025);
      for (let i = 0; i < 11; i++) { const a = 0.45 + i / 10 * (TAU - 0.9); const a0 = A.P(0, 0.325, 0.1), a1 = A.P(Math.sin(a) * 0.8, 0.325, Math.cos(a) * 0.86); ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke(); }
    });
    // mushroom stool backrest
    A.sphere(0, 0.5, -0.42, 0.22, '#e83a3a', { after: (ctx, x, y, R) => { ctx.fillStyle = '#fff8e8'; for (const [dx, dy, r] of [[-0.4, -0.3, 0.2], [0.35, -0.2, 0.16], [0, 0.3, 0.18], [-0.5, 0.3, 0.12]]) { ctx.beginPath(); ctx.arc(x + dx * R, y + dy * R, r * R, 0, TAU); ctx.fill(); } } });
    // lotus flower
    A.at(-0.52, 0.42, -0.42, (ctx, x, y, S) => { for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.42; ctx.fillStyle = i % 2 ? '#ffb0dc' : '#ff7ac0'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * S * 0.08, y + Math.sin(a) * S * 0.08, S * 0.1, S * 0.045, a, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x, y, S * 0.04, 0, TAU); ctx.fill(); }, kartGlowDot('#ff7ac0', 0.1), 0.05);
  },
  theman() {
    // Effigy Express: a rolling two-tier wooden plinth with neon trim and twin flame jets
    const A = KartProj, wood = '#a8723e', woodL = '#d6a466', neon = '#ff6a2a', amber = '#ffc24a';
    kartUnderglow('#ff5a1a', 0.85, 1.25);
    kartWheels4({ rx: 0.67, rr: 0.31, rz: -0.6, rw: 0.27, fx: 0.63, fr: 0.27, fz: 0.66, fw: 0.22, hub: '#c08a4e', tyre: '#2a1e16' });
    const planks = ctx => { ctx.strokeStyle = 'rgba(70,38,12,0.55)'; ctx.lineWidth = 0.03; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, i / 4); ctx.lineTo(1, i / 4); ctx.stroke(); } ctx.fillStyle = 'rgba(70,38,12,0.35)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(0.1 + i * 0.2, 0.5, 0.025, 0, TAU); ctx.fill(); } };
    const deck = ctx => { ctx.strokeStyle = 'rgba(80,44,14,0.5)'; ctx.lineWidth = 0.02; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(i / 6, 0); ctx.lineTo(i / 6, 1); ctx.stroke(); } };
    const emblem = ctx => { ctx.fillStyle = '#3a200c'; ctx.fillRect(0.3, 0.1, 0.4, 0.8); ctx.fillStyle = amber; ctx.beginPath(); ctx.moveTo(0.5, 0.18); ctx.lineTo(0.64, 0.5); ctx.lineTo(0.5, 0.82); ctx.lineTo(0.36, 0.5); ctx.closePath(); ctx.fill(); };
    A.frustum(-1.02, 1.02, [-0.62, 0.62, 0.15, 0.34], [-0.56, 0.56, 0.15, 0.3], wood, { top: woodL, decalR: planks, decalL: planks, decalBack: planks, decalFront: emblem, decalTop: deck });
    A.frustum(-0.78, 0.42, [-0.44, 0.44, 0.33, 0.48], [-0.4, 0.4, 0.33, 0.45], wood, { top: woodL, decalR: planks, decalL: planks, decalBack: planks, decalTop: deck });
    // neon trim along both tiers
    kartNeon([[-0.62, 0.35, -1.02], [-0.56, 0.31, 1.02], [0.56, 0.31, 1.02], [0.62, 0.35, -1.02], [-0.62, 0.35, -1.02]], neon, 0.03, 0.01);
    kartNeon([[-0.44, 0.49, -0.78], [-0.4, 0.46, 0.42], [0.4, 0.46, 0.42], [0.44, 0.49, -0.78], [-0.44, 0.49, -0.78]], amber, 0.025, 0.02);
    for (const sg of [-1, 1]) A.at(sg * 0.3, 0.27, 1.03, kartDot('#fff0c8', 0.045), kartGlowDot('#ffd88a', 0.06), 0.01);
    // twin flame jets at the back
    for (const sg of [-1, 1]) {
      const n0 = [sg * 0.3, 0.42, -1.02], n1 = [sg * 0.3, 0.46, -1.5];
      A.at(n0[0], n0[1], n0[2], (ctx, x, y, S) => { ctx.fillStyle = '#4a4040'; ctx.beginPath(); ctx.arc(x, y, S * 0.085, 0, TAU); ctx.fill(); ctx.strokeStyle = '#9a8a80'; ctx.lineWidth = Math.max(1, S * 0.02); ctx.stroke(); ctx.fillStyle = '#ff9a3a'; ctx.beginPath(); ctx.arc(x, y, S * 0.045, 0, TAU); ctx.fill(); },
        (ctx) => {
          const a = A.P(n0[0], n0[1], n0[2]), b = A.P(n1[0], n1[1], n1[2]), S = A.SC, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), w = S * 0.09;
          ctx.shadowColor = '#ff6a1a'; ctx.shadowBlur = S * 0.3;
          if (l < w) { ctx.fillStyle = '#ffb04a'; ctx.beginPath(); ctx.arc(a[0], a[1], w * 1.1, 0, TAU); ctx.fill(); return; }
          const ux = dx / l, uy = dy / l;
          ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(a[0] - uy * w, a[1] + ux * w); ctx.quadraticCurveTo(b[0] - uy * w * 0.4, b[1] + ux * w * 0.4, b[0], b[1]); ctx.quadraticCurveTo(b[0] + uy * w * 0.4, b[1] - ux * w * 0.4, a[0] + uy * w, a[1] - ux * w); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#fff2b0'; ctx.beginPath(); ctx.arc(a[0], a[1], w * 0.6, 0, TAU); ctx.fill();
        }, -0.02);
    }
  },
  hippie() {
    const A = KartProj, teal = '#38b8a8', cream = '#f6ecd2', org = '#ff8a3a';
    kartWheels4({ rx: 0.62, rr: 0.28, rz: -0.6, rw: 0.22, fx: 0.62, fr: 0.27, fz: 0.62, fw: 0.2, hub: '#e8eaf0', ww: true });
    A.prism([[-0.5, -1.0], [0.5, -1.0], [0.55, 0.9], [-0.55, 0.9]], 0.12, 0.2, '#2a5a54', {});
    const flowers = ctx => { KartFace.flower(ctx, 0.25, 0.45, 0.16, '#ff5a8a'); KartFace.flower(ctx, 0.62, 0.62, 0.12, '#ffd84a', '#ff5a8a'); KartFace.flower(ctx, 0.85, 0.35, 0.1, '#c79aff'); };
    const twoTone = ctx => { ctx.fillStyle = cream; ctx.fillRect(0, 0, 1, 0.35); flowers(ctx); };
    A.frustum(0.3, 1.04, [-0.6, 0.6, 0.18, 0.6], [-0.56, 0.56, 0.18, 0.5], teal, { top: cream, decalR: twoTone, decalL: twoTone,
      decalFront: ctx => { ctx.fillStyle = cream; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1, 0); ctx.lineTo(1, 0.25); ctx.lineTo(0.5, 0.62); ctx.lineTo(0, 0.25); ctx.fill(); KartFace.peace(ctx, 0.5, 0.42, 0.11, '#e8eaf0', 0.035); for (const x of [0.16, 0.84]) { ctx.fillStyle = '#fff8d0'; ctx.beginPath(); ctx.arc(x, 0.62, 0.09, 0, TAU); ctx.fill(); ctx.strokeStyle = '#c0c4cc'; ctx.lineWidth = 0.03; ctx.stroke(); } } });
    A.frustum(-1.02, -0.5, [-0.58, 0.58, 0.18, 0.62], [-0.6, 0.6, 0.18, 0.62], teal, { top: cream, decalR: twoTone, decalL: twoTone, decalBack: ctx => { ctx.fillStyle = cream; ctx.fillRect(0, 0, 1, 0.35); KartFace.flower(ctx, 0.5, 0.62, 0.17, org); ctx.fillStyle = '#ff3a3a'; ctx.fillRect(0.06, 0.45, 0.1, 0.12); ctx.fillRect(0.84, 0.45, 0.1, 0.12); } });
    for (const s of [-1, 1]) A.frustum(-0.5, 0.3, [s > 0 ? 0.44 : -0.6, s > 0 ? 0.6 : -0.44, 0.18, 0.44], [s > 0 ? 0.44 : -0.6, s > 0 ? 0.6 : -0.44, 0.18, 0.44], teal, { top: cream, decalR: flowers, decalL: flowers });
    A.box(0, 0.22, -0.08, 0.86, 0.05, 0.7, '#1e3a36', {});
    for (const s of [-1, 1]) { A.at(s * 0.3, 0.3, 1.05, kartDot('#fff8d0', 0.05), kartGlowDot('#ffe8a0', 0.07), 0.01); A.limb([s * 0.5, 0.62, -0.64], [s * 0.44, 1.22, -0.66], 0.03, '#d8dce4'); }
    A.limb([-0.44, 1.22, -0.66], [0.44, 1.22, -0.66], 0.03, '#d8dce4');
    for (let i = 0; i < 6; i++) A.at(-0.36 + i * 0.144, 1.2 - Math.sin(i / 5 * Math.PI) * 0.05, -0.64, (ctx, x, y, S) => KartFace.flower(ctx, x, y, S * 0.06, ['#ff5a8a', '#ffd84a', '#c79aff'][i % 3]), (ctx, x, y, S) => { if (i % 2) kartGlowDot('#ffd84a', 0.03)(ctx, x, y, S); }, 0.03);
  },
  techbro() {
    const A = KartProj, wht = '#f2f4f8', gry = '#c8ccd6', cyan = '#38f2ff';
    kartUnderglow(cyan, 0.75, 1.15);
    kartWheels4({ rx: 0.6, rr: 0.25, rz: -0.62, rw: 0.18, fx: 0.6, fr: 0.25, fz: 0.64, fw: 0.18, hub: '#26282e' });
    for (const s of [-1, 1]) for (const z of [-0.62, 0.64]) A.frustum(z - 0.3, z + 0.3, [s > 0 ? 0.48 : -0.72, s > 0 ? 0.72 : -0.48, 0.32, 0.46], [s > 0 ? 0.48 : -0.7, s > 0 ? 0.7 : -0.48, 0.32, 0.42], wht, {});
    A.prism(kartFoot(0.6, -1.02, 1.04, 24, 3, 0.25), 0.16, 0.48, wht, { topScale: 0.86, topCol: wht, sideCol: gry, sideLine: false, topGrad: pr => [pr[0], pr[Math.floor(pr.length / 2)]] });
    A.box(0, 0.5, -0.15, 0.7, 0.04, 0.9, '#20222a', {});
    kartNeon([[-0.38, 0.36, 1.03], [0.38, 0.36, 1.03]], cyan, 0.035, 0.02);
    kartNeon([[-0.42, 0.4, -1.01], [0.42, 0.4, -1.01]], '#ff3a6a', 0.035, 0.02);
    // startup logo on each flank: a ring with a forward slash
    for (const s of [-1, 1]) A.at(s * 0.62, 0.34, -0.1, (ctx, x, y, S) => { const f = A.facing(s, 0, 0); if (f < 0.25) return; ctx.save(); ctx.globalAlpha = Math.min(1, f * 2); ctx.translate(x, y); ctx.scale(Math.max(0.3, f), 1); ctx.strokeStyle = '#1aa8c8'; ctx.lineWidth = Math.max(1, S * 0.03); ctx.beginPath(); ctx.arc(0, 0, S * 0.07, 0, TAU); ctx.moveTo(-S * 0.04, S * 0.05); ctx.lineTo(S * 0.04, -S * 0.05); ctx.stroke(); ctx.restore(); }, null, 0.05);
    // glass canopy over the driver
    A.add(50, ctx => {
      const c = A.P(0, 0.92, -0.18), R = 0.56 * A.SC, Ry = 0.5 * A.SC;
      ctx.fillStyle = 'rgba(160,220,255,0.2)'; ctx.beginPath(); ctx.ellipse(c[0], c[1], R, Ry, 0, Math.PI, TAU); ctx.lineTo(c[0] + R, c[1] + Ry * 0.5); ctx.lineTo(c[0] - R, c[1] + Ry * 0.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = A.lw(0.02); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = A.lw(0.035); ctx.beginPath(); ctx.ellipse(c[0], c[1], R * 0.8, Ry * 0.8, 0, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();
    });
  },
  dpw() {
    const A = KartProj, org = '#d9782a', orgD = '#a8561a', rust = '#7a4a2a';
    kartWheels4({ rx: 0.66, rr: 0.32, rz: -0.6, rw: 0.28, fx: 0.64, fr: 0.3, fz: 0.68, fw: 0.26, hub: '#8a8478', tyre: '#2a2622' });
    A.prism([[-0.6, -1.0], [0.6, -1.0], [0.62, 1.02], [-0.62, 1.02]], 0.18, 0.26, '#3a3430', {});
    const dents = ctx => { ctx.fillStyle = rust; ctx.beginPath(); ctx.arc(0.2, 0.7, 0.12, 0, TAU); ctx.arc(0.75, 0.3, 0.08, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.03; ctx.beginPath(); ctx.arc(0.5, 0.5, 0.15, 3.5, 5.2); ctx.stroke(); ctx.fillStyle = 'rgba(230,210,170,0.35)'; ctx.fillRect(0, 0.8, 1, 0.2); };
    A.frustum(0.25, 1.06, [-0.62, 0.62, 0.24, 0.78], [-0.6, 0.6, 0.24, 0.66], org, { decalR: dents, decalL: dents,
      decalFront: ctx => { ctx.fillStyle = '#4a443e'; ctx.fillRect(0.25, 0.3, 0.5, 0.45); ctx.strokeStyle = '#8a8478'; ctx.lineWidth = 0.03; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0.27, 0.35 + i * 0.09); ctx.lineTo(0.73, 0.35 + i * 0.09); ctx.stroke(); } for (const x of [0.12, 0.88]) { ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(x, 0.48, 0.08, 0, TAU); ctx.fill(); } },
      decalTop: ctx => { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0.12, 0.3, 0.76, 0.6); } });
    // windshield frame + glass
    A.limb([-0.56, 0.78, 0.6], [-0.52, 1.16, 0.56], 0.025, '#2a2622'); A.limb([0.56, 0.78, 0.6], [0.52, 1.16, 0.56], 0.025, '#2a2622'); A.limb([-0.52, 1.16, 0.56], [0.52, 1.16, 0.56], 0.025, '#2a2622');
    A.poly([[-0.52, 1.14, 0.56], [0.52, 1.14, 0.56], [0.56, 0.8, 0.6], [-0.56, 0.8, 0.6]], '#bfe0f0', { both: true, line: false, alpha: 0.32, flat: true, decal: ctx => { ctx.fillStyle = 'rgba(200,180,140,0.5)'; ctx.fillRect(0, 0.7, 1, 0.3); } });
    // flatbed
    A.box(0, 0.33, -0.4, 1.26, 0.1, 1.24, '#7a5a3a', { decalTop: ctx => { ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 0.02; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, i / 5); ctx.lineTo(1, i / 5); ctx.stroke(); } } });
    for (const s of [-1, 1]) A.box(s * 0.6, 0.48, -0.42, 0.06, 0.22, 1.2, orgD, { decalR: dents, decalL: dents });
    A.box(0, 0.48, -1.0, 1.24, 0.22, 0.06, orgD, { decalBack: ctx => { ctx.fillStyle = '#ffd84a'; ctx.fillRect(0.05, 0.3, 0.9, 0.4); ctx.fillStyle = '#1a1a1a'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0.05 + i * 0.15, 0.7); ctx.lineTo(0.12 + i * 0.15, 0.3); ctx.lineTo(0.17 + i * 0.15, 0.3); ctx.lineTo(0.1 + i * 0.15, 0.7); ctx.fill(); } } });
    A.at(-0.3, 0.38, -0.7, (ctx, x, y, S) => { ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(x - S * 0.12, y); ctx.lineTo(x, y - S * 0.42); ctx.lineTo(x + S * 0.12, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - S * 0.06, y - S * 0.22, S * 0.12, S * 0.06); ctx.fillStyle = '#2a2622'; ctx.fillRect(x - S * 0.16, y - S * 0.02, S * 0.32, S * 0.04); }, null, 0.2);
    A.box(0.25, 0.52, -0.62, 0.3, 0.32, 0.3, '#3a6ab8', { decalR: ctx => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0.2, 1, 0.08); }, decalL: ctx => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0.2, 1, 0.08); } });
    A.limb([-0.1, 0.4, -0.95], [0.25, 0.75, -0.3], 0.02, '#8a6a4a');
    // roll bar + amber beacon
    for (const s of [-1, 1]) A.limb([s * 0.55, 0.5, 0.0], [s * 0.5, 1.3, -0.02], 0.035, '#3a3430');
    A.limb([-0.5, 1.3, -0.02], [0.5, 1.3, -0.02], 0.035, '#3a3430');
    A.sphere(0, 1.38, -0.02, 0.08, '#ffb21a', { shine: true, glow: (ctx, x, y, R) => { ctx.fillStyle = '#ffb21a'; ctx.shadowColor = '#ffb21a'; ctx.shadowBlur = R * 2; ctx.beginPath(); ctx.arc(x, y, R * 1.6, 0, TAU); ctx.fill(); } });
  }
};

/* ---------------- atlas building / caching ---------------- */
const KartArt = {
  atlas: null, hi: null, hiKey: null, glTex: null, glTexGen: -1, glHiTex: null, glHiGen: -1, hiDirty: false,
  lookKey() { const L = Save.data && Save.data.look || {}; return JSON.stringify([L.hair, L.skin, L.style, L.glasses, L.tattoos, L.beard]); },
  scratch(name, w, h) {
    this._s = this._s || {};
    let c = this._s[name];
    if (!c || c.width !== w || c.height !== h) { c = this._s[name] = makeCanvas(w, h); }
    const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, w, h);
    return c;
  },
  // render one kart view into canvases (base, glow) of size px
  renderKart(id, dir, size, phi, pose) {
    const base = this.scratch('kb' + size, size, size), glow = this.scratch('kg' + size, size, size);
    const theta = dir / KART_DIRS * TAU;
    KartProj.view(theta, phi, size / KART_CELL * KART_PXM, size / 2, size * 0.7);
    KartProj.clear();
    KART_BODIES[id]();
    KART_DRIVERS[id](Save.data ? Save.data.look : null, pose);
    KartProj.flush(base.getContext('2d'), glow.getContext('2d'));
    return { base, glow };
  },
  // copy src into dst at (x,y) with a soft dark outline around the silhouette
  outlined(dst, x, y, src, w, col) {
    const s = this.scratch('sil' + src.width, src.width, src.height), sx = s.getContext('2d');
    sx.drawImage(src, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = col; sx.fillRect(0, 0, s.width, s.height); sx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; dst.drawImage(s, x + Math.cos(a) * w, y + Math.sin(a) * w); }
    dst.drawImage(src, x, y);
  },
  kartJob(id, dir, pose) {
    const key = pose ? id + '_' + pose : id;
    return () => {
      const A = this.atlas, r = this.renderKart(id, dir, KART_CELL, 0.3, pose);
      const reg = A.alloc('k_' + key + '_' + dir, KART_CELL, KART_CELL, 1);
      this.outlined(A.c.getContext('2d'), reg.x, reg.y, r.base, 1.1, 'rgba(24,14,34,0.85)');
      // keep the glow layer until the glow pass packs it
      this._glows = this._glows || {};
      const g = makeCanvas(KART_CELL / 2, KART_CELL / 2); g.getContext('2d').drawImage(r.glow, 0, 0, KART_CELL / 2, KART_CELL / 2);
      this._glows[key + '_' + dir] = g;
    };
  },
  glowJob(id, dir, pose) {
    const key = pose ? id + '_' + pose : id;
    return () => {
      const A = this.atlas, g = this._glows && this._glows[key + '_' + dir];
      const reg = A.alloc('g_' + key + '_' + dir, KART_CELL / 2, KART_CELL / 2, 1);
      if (g) { A.c.getContext('2d').drawImage(g, reg.x, reg.y); delete this._glows[key + '_' + dir]; }
    };
  },
  hiJob(id, dir, pose) {
    return () => {
      const H = this.hi, r = this.renderKart(id, dir, KART_HI, 0.36, pose);
      const reg = H.alloc('h_' + (pose ? pose + '_' : '') + dir, KART_HI, KART_HI, 2);
      this.outlined(H.c.getContext('2d'), reg.x, reg.y, r.base, 2, 'rgba(24,14,34,0.85)');
    };
  },
  // work items needed before a race; menu and race share one queue so partial progress is kept
  jobs(hiId) {
    const lk = this.lookKey();
    if (!this.atlas || this.atlasLook !== lk) {
      if (this.glTex) { KartGL.del([this.glTex]); this.glTex = null; }
      this.atlas = new KartAtlas(2048, 4096); this.atlasLook = lk; this.glTexGen = -1; this.faces = {};
      this.queue = [];
      const each = fn => { for (const r of KART_RACERS) { for (let d = 0; d < KART_DIRS; d++) fn(r.id, d, ''); for (const pose of KART_POSES[r.id] || []) for (let d = 0; d < KART_DIRS; d++) fn(r.id, d, pose); } };
      each((id, d, pose) => this.queue.push(this.kartJob(id, d, pose)));
      this.queue.push(() => { const A = this.atlas; A.x = 0; A.y += A.row; A.row = 0; });
      each((id, d, pose) => this.queue.push(this.glowJob(id, d, pose)));
      this.queue.push(() => { const A = this.atlas; A.x = 0; A.y += A.row; A.row = 0; KartProps.paintAll(A); });
    }
    const out = [];
    for (let i = 0; i < this.queue.length; i++) out.push(() => { const j = this.queue.shift(); if (j) j(); });
    if (hiId && this.hiKey !== hiId + lk) {
      this.hiKey = hiId + lk;
      const poses = KART_POSES[hiId] || [];
      this.hiQueue = [() => { if (this.glHiTex) { KartGL.del([this.glHiTex]); this.glHiTex = null; } this.hi = new KartAtlas(2048, poses.length ? 2048 : 1024); this.glHiGen = -1; }];
      for (let d = 0; d < KART_DIRS; d++) this.hiQueue.push(this.hiJob(hiId, d));
      for (const pose of poses) for (let d = 0; d < KART_DIRS; d++) this.hiQueue.push(this.hiJob(hiId, d, pose));
    }
    if (this.hiQueue) for (let i = 0; i < this.hiQueue.length; i++) out.push(() => { const j = this.hiQueue.shift(); if (j) j(); });
    return out;
  },
  ready() { return this.atlas && this.queue && this.queue.length === 0; },
  reg(name) { return this.atlas && this.atlas.map[name]; },
  kart(id, dir, pose) { const m = this.atlas.map; return (pose && m['k_' + id + '_' + pose + '_' + dir]) || m['k_' + id + '_' + dir]; },
  kartGlow(id, dir, pose) { const m = this.atlas.map; return (pose && m['g_' + id + '_' + pose + '_' + dir]) || m['g_' + id + '_' + dir]; },
  hiKart(dir, pose) { if (!this.hi) return null; const m = this.hi.map; return (pose && m['h_' + pose + '_' + dir]) || m['h_' + dir]; },
  glAtlas() {
    if (this.glTex && this.glTexGen === KartGL.gen) return this.glTex;
    this.glTex = KartGL.texture(this.atlas.c, { mips: true, premult: true });
    this.glTexGen = KartGL.gen;
    return this.glTex;
  },
  glHi() {
    if (!this.hi || (this.hiQueue && this.hiQueue.length)) return null;
    if (this.glHiTex && this.glHiGen === KartGL.gen) return this.glHiTex;
    this.glHiTex = KartGL.texture(this.hi.c, { mips: true, premult: true });
    this.glHiGen = KartGL.gen;
    return this.glHiTex;
  },
  // boost pad chevrons (tiles along v)
  chevron() {
    if (this._chev) return this._chev;
    const W = 64, H = 64, c = makeCanvas(W, H), x = c.getContext('2d');
    x.fillStyle = '#2a0e3a'; x.fillRect(0, 0, W, H);
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ff3ac8'); g.addColorStop(1, '#ffe86a');
    // arrow tip points to +v (the forward end of the pad)
    x.beginPath(); x.moveTo(4, 6); x.lineTo(W / 2, 34); x.lineTo(W - 4, 6); x.lineTo(W - 4, 24); x.lineTo(W / 2, 56); x.lineTo(4, 24); x.closePath();
    x.fillStyle = g; x.fill(); x.strokeStyle = '#ffffff'; x.lineWidth = 2.5; x.stroke();
    x.fillStyle = '#38f2ff'; x.fillRect(0, 0, 4, H); x.fillRect(W - 4, 0, 4, H);
    return (this._chev = c);
  },
  rampTex(R) {
    const W = 128, H = 128, c = makeCanvas(W, H), x = c.getContext('2d'), e = makeCanvas(W, H), ex = e.getContext('2d');
    ex.fillStyle = '#000'; ex.fillRect(0, 0, W, H);
    const cols = R.rampCols || ['#ff4fd8', '#ffd84a'];
    for (let i = 0; i < 8; i++) { x.fillStyle = cols[i % 2]; x.fillRect(0, i * 16, W, 16); }
    x.fillStyle = 'rgba(20,10,30,0.85)';
    for (let i = 0; i < 3; i++) { const y = 18 + i * 36; x.beginPath(); x.moveTo(W / 2, y); x.lineTo(W / 2 + 26, y + 22); x.lineTo(W / 2 - 26, y + 22); x.closePath(); x.fill(); }
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 6, H); x.fillRect(W - 6, 0, 6, H);
    ex.fillStyle = '#9a9a9a'; ex.fillRect(0, 0, 6, H); ex.fillRect(W - 6, 0, 6, H);
    return KartPaint.packEmissive(c, e);
  }
};

/* ============================================================
   Race simulation
   ============================================================ */
const KART_ITEM_ODDS = [ // by position bucket: 1st, 2-3, 4-5, 6-8
  { puke: 26, tumble: 30, dust: 20, water: 16, glow: 8 },
  { puke: 26, tumble: 14, dust: 14, glow: 18, water: 10, swarm: 12, disco: 6 },
  { glow: 24, puke: 18, swarm: 16, disco: 12, bufo: 10, dust: 10, water: 10 },
  { glow: 24, disco: 20, bufo: 20, swarm: 22, puke: 10, water: 4 }
];
function kartRollItem(rank, n, rng) {
  const b = n <= 1 ? 1 : rank <= 1 ? 0 : rank <= 3 ? 1 : rank <= 5 ? 2 : 3;
  const t = KART_ITEM_ODDS[b]; let tot = 0; for (const k in t) tot += t[k];
  let r = rng() * tot; for (const k in t) { r -= t[k]; if (r <= 0) return k; }
  return 'glow';
}
class KartParticles {
  constructor(max) { this.max = max; this.p = []; for (let i = 0; i < max; i++) this.p.push({ life: 0 }); this.n = 0; this.cursor = 0; }
  spawn(o) {
    let q = null;
    for (let k = 0; k < this.max; k++) { const c = this.p[(this.cursor + k) % this.max]; if (c.life <= 0) { q = c; this.cursor = (this.cursor + k + 1) % this.max; break; } }
    if (!q) { q = this.p[this.cursor]; this.cursor = (this.cursor + 1) % this.max; }
    q.x = o.x; q.y = o.y; q.z = o.z; q.vx = o.vx || 0; q.vy = o.vy || 0; q.vz = o.vz || 0;
    q.life = q.max = o.life || 1; q.s0 = o.s0 || 0.5; q.s1 = o.s1 === undefined ? q.s0 : o.s1;
    q.r = o.r === undefined ? 1 : o.r; q.g = o.g === undefined ? 1 : o.g; q.b = o.b === undefined ? 1 : o.b; q.a = o.a === undefined ? 1 : o.a;
    q.add = !!o.add; q.reg = o.reg || 'puff0_0'; q.rot = o.rot || 0; q.vrot = o.vrot || 0; q.grav = o.grav || 0; q.drag = o.drag || 0; q.lit = !!o.lit; q.fade = o.fade || 0;
    q.stretch = o.stretch || 0;
    return q;
  }
  update(dt) {
    for (const q of this.p) {
      if (q.life <= 0) continue;
      q.life -= dt;
      q.vy -= q.grav * dt;
      if (q.drag) { const k = Math.exp(-q.drag * dt); q.vx *= k; q.vy *= k; q.vz *= k; }
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.rot += q.vrot * dt;
      if (q.y < 0.02 && q.grav > 0) { q.y = 0.02; q.vy *= -0.3; q.vx *= 0.7; q.vz *= 0.7; }
    }
  }
}
const KART_TMP = {}, KART_TMP2 = {};
function kartHexRgb(h) { const c = hexToRgb(h); return [c[0] / 255, c[1] / 255, c[2] / 255]; }

class KartRaceScene {
  constructor(opts) {
    opts = opts || {};
    const ks = kartSave();
    this.opts = opts;
    this.mode = opts.mode === 'gp' ? 'gp' : 'tt';
    this.cup = KART_CUPS.find(c => c.id === opts.cup) || KART_CUPS[0];
    this.raceIdx = opts.race || 0;
    this.trackId = opts.track || (this.mode === 'gp' ? this.cup.tracks[this.raceIdx] : 'esplanade');
    if (!KART_TRACKS[this.trackId]) this.trackId = 'esplanade';
    this.racerId = kartRacer(opts.racer || ks.racer).id;   // also maps the retired 'buzzkill' id to 'theman'
    this.autoGas = opts.autoGas !== undefined ? !!opts.autoGas : ks.autoGas !== false;
    this.gp = opts.gp || { points: {}, results: [] };
    this.gpSnap = JSON.stringify(this.gp);
    this.t = 0; this.state = 'load'; this.stateT = 0; this.paused = false; this.raceT = 0;
    this.rng = mulberry32((Date.now() & 0xffff) ^ hashStr(this.trackId));
    this.q = 1; this.frameMs = []; this.lastDraw = 0; this.msgs = [];
    Input.setMode('ui');
    kartHookVisibility();
    if (!KartGL.init()) { this.state = 'nogl'; this.buildNoGL(); return; }
    this.jobs = KartArt.jobs(this.racerId);
    this.jobs.push(() => {
      let setup;
      try { setup = kartSetupTrack(this.trackId); }
      catch (e) { console.error(e); this.jobs.length = 0; this.state = 'nogl'; this.noglMsg = 'This track failed to load.'; this.buildNoGL(); return; }
      this.T = setup.T; this.R = setup.R;
      this.jobs.splice(0, 0, ...setup.jobs, () => this.initRace());
    });
    this.jobsTotal = this.jobs.length + 6;
    this.loadMsg = ['Gassing up the art cars', 'Untangling the EL wire', 'Sweeping the playa for MOOP', 'Inflating the disco domes', 'Hydrating'][Math.floor(Math.random() * 5)];
  }
  // run all pending load work right now (tests / fast start)
  loadAll() { while (this.jobs && this.jobs.length) this.jobs.shift()(); }
  runJobs(budgetMs) {
    const t0 = performance.now();
    while (this.jobs.length && performance.now() - t0 < budgetMs) this.jobs.shift()();
  }
  initRace() {
    const T = this.T, R = this.R;
    this.view = new KartView(); this.view.build(T, R);
    this.player = null; this.karts = [];
    const ids = this.mode === 'gp' ? KART_RACERS.map(r => r.id) : [this.racerId];
    // grid order: GP race 1 player starts last; later, by previous race finish (reverse standings for AI)
    let order = ids.filter(id => id !== this.racerId);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    let pSlot = this.mode === 'gp' ? 7 : 0;
    if (this.mode === 'gp' && this.gp.lastPos) pSlot = clamp(this.gp.lastPos - 1, 0, 7);
    order.splice(pSlot, 0, this.racerId);
    const base = (this.mode === 'gp' ? 0.88 + this.raceIdx * 0.025 + (this.cup.id === 'fire' ? 0.035 : 0) : 0.9);
    order.forEach((id, slot) => {
      const k = this.makeKart(kartRacer(id), id === this.racerId, slot);
      if (!k.player) k.ai.skill = clamp(base + (this.rng() - 0.5) * 0.05 + (slot < 3 ? 0.015 : 0), 0.82, 1.02);
      this.karts.push(k);
      if (k.player) this.player = k;
    });
    // time trials are pure driving: no gift boxes, no items
    this.gifts = this.mode === 'tt' ? [] : R.gifts.map(g => { const a = T.at(g.s, {}); return { x: a.x + a.nx * g.d, z: a.z + a.nz * g.d, s: g.s, d: g.d, alive: 1, t: 0, ph: this.rng() * 10, col: Math.floor(this.rng() * 4) }; });
    this.objs = [];
    this.parts = new KartParticles(700);
    this.cam = { x: 0, y: 5, z: 0, tx: 0, ty: 0, tz: 0, fov: 0.85 };
    this.camYaw = this.player.yaw; this.shake = 0; this.white = 0; this.flash = 0;
    this.storm = { t: 8 + this.rng() * 6, k: 0, phase: 'calm' };
    this.fwT = 1.5;
    this.state = 'intro'; this.stateT = 0;
    Sound.music(R.def.music || 'kart1');
    Input.setMode('ui');
    this.lastDraw = 0;
  }
  makeKart(racer, isPlayer, slot) {
    const T = this.T, st = racer.stats;
    const s = T.L - 9 - slot * 5.4, d = this.mode === 'tt' ? 0 : (slot % 2 ? 1 : -1) * T.at(s, KART_TMP).hw * 0.42;
    const a = T.at(s, {});
    const k = {
      id: racer.id, racer, player: isPlayer, slot,
      vmax: 26.3 + st.speed * 0.55, acc: 8 + st.accel * 2.9, turn: 1.45 + st.handling * 0.15, grip: 6.5 + st.handling * 0.9,
      mass: 0.75 + st.weight * 0.13, offK: 0.5 + st.weight * 0.03,
      x: a.x + a.nx * d, z: a.z + a.nz * d, y: 0, vy: 0, vx: 0, vz: 0, yaw: Math.atan2(a.tz, a.tx),
      steer: 0, drift: 0, charge: 0, air: false, hopCool: 0, pendingDrift: false,
      boostT: 0, boostKind: '', slowT: 0, dustSlow: 0, spinT: 0, spinA: 0, discoT: 0, bufoT: 0, immuneT: 0, waterT: 0, swarmT: 0,
      item: null, roul: 0, roulItem: null, itemCool: 0,
      loc: { i: 0, s: 0, d: 0 }, prevS: s, lap: 0, prog: 0, rank: slot + 1, finished: false, finishT: 0, lapStart: 0, lapTimes: [],
      inp: { steer: 0, gas: 0, brake: 0, drift: false, driftPress: false, item: false },
      wrongT: 0, bumpT: 0, padCool: 0, rubber: 1, off: false, inPool: false, sparkT: 0, dustT: 0, landT: 0, onRamp: null, speed: 0,
      ai: isPlayer ? null : { skill: 0.9, bias: (this.rng() - 0.5) * 2, avoid: 0, avoidT: 0, driftT: 0, itemT: 1 + this.rng() * 2, stuckT: 0, revT: 0, wob: this.rng() * 10 }
    };
    T.locateGlobal(k.x, k.z, k.loc); k.prevS = k.loc.s;
    // corner speeds this kart can hold on the racing line (used by the AI driver)
    const N = T.N, vp = new Float32Array(N);
    for (let i = 0; i < N; i++) vp[i] = Math.min(k.vmax * 1.4, T.RAD[i] * k.turn * 0.8);
    for (let pass = 0; pass < 2; pass++) for (let i = N - 1; i >= 0; i--) { const nx = vp[(i + 1) % N]; vp[i] = Math.min(vp[i], Math.sqrt(nx * nx + 2 * 24 * T.ds)); }
    k.vp = vp;
    return k;
  }
  /* ---------- update ---------- */
  update(dt) {
    if (this.state === 'nogl') { const h = UI.hitButtons(this.btns); if (h) h.fn(); return; }
    if (this.state === 'load') return;
    // driving controls only while racing; menus, intro and the finish use taps
    const wantMode = !this.paused && (this.state === 'count' || this.state === 'race') ? 'game' : 'ui';
    if (Input.mode !== wantMode) Input.setMode(wantMode);
    if (this.paused) {
      const h = UI.hitButtons(this.pauseBtns);
      if (h) h.fn(); else if (Input.pausePressed) this.closePause();
      return;
    }
    if ((this.state === 'race' || this.state === 'count' || this.state === 'intro') && (Input.pausePressed || (Input.mode === 'ui' && Input.uiKey === 'pause'))) { this.openPause(); return; }
    this.t += dt; this.stateT += dt;
    if (this.state === 'intro') {
      if (this.stateT > 3.4 || (this.stateT > 0.5 && (Input.taps.length || Input.jumpPressed || Input.actionPressed || Input.uiKey === 'enter'))) { this.state = 'count'; this.stateT = 0; this.countN = 4; this.snapCam = true; Input.setMode('game'); }
      this.updateWorld(dt, false);
      return;
    }
    if (this.state === 'count') {
      const n = 3 - Math.floor(this.stateT);
      if (n !== this.countN && n >= 1) { this.countN = n; Sound.play('kartCountdown'); }
      if (this.player && Input.jumpPressed && this.stateT > 2.35 && this.stateT < 3) this.player.goodStart = true;
      if (this.player && Input.jumpPressed && this.stateT < 2.35) this.player.goodStart = false;
      if (this.stateT >= 3) {
        this.state = 'race'; this.stateT = 0; this.raceT = 0; Sound.play('kartGo');
        this.banner('GO!', '#7aff8a', 1.0);
        for (const k of this.karts) {
          if (k.player ? k.goodStart : this.rng() < k.ai.skill - 0.55) { this.boost(k, 0.9, 'start'); }
        }
      }
      this.updateWorld(dt, false);
      return;
    }
    if (this.state === 'race' || this.state === 'done') {
      this.raceT += dt;
      this.updateWorld(dt, true);
      if (this.state === 'done') {
        const allIn = this.karts.every(k => k.finished);
        if (this.stateT > 4.5 && (allIn || this.stateT > 9)) this.finishRace();
        else if (this.stateT > 1.5 && (Input.taps.length || Input.jumpPressed || Input.uiKey === 'enter')) this.finishRace();
      }
      return;
    }
    // results / standings / trophy screens
    this.updateWorld(dt, this.state === 'results');
    const h = UI.hitButtons(this.btns);
    if (h) h.fn();
  }
  updateWorld(dt, racing) {
    const T = this.T;
    for (const k of this.karts) {
      if (k.player && racing && !k.finished && !this.autoDrive) this.playerInput(k);
      else if (racing || k.finished) this.aiInput(k, dt, racing);
      else { k.inp.gas = 0; k.inp.steer = 0; k.inp.brake = 0; k.inp.drift = false; k.inp.driftPress = false; k.inp.item = false; }
      this.stepKart(k, dt, racing);
    }
    this.collideKarts();
    if (racing) this.updateRanks();
    this.updateObjs(dt);
    for (const g of this.gifts) if (!g.alive) { g.t -= dt; if (g.t <= 0) g.alive = 1; }
    this.parts.update(dt);
    this.updateFx(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3);
    if (this.white > 0) this.white = Math.max(0, this.white - dt * 0.8);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 3);
    for (const m of this.msgs) m.t -= dt;
    this.msgs = this.msgs.filter(m => m.t > 0);
    if (this.R.storm) this.updateStorm(dt);
  }
  playerInput(k) {
    const inp = k.inp;
    let st = 0;
    const L = Input.layout;
    if (Input.stick.active && L) {
      const dx = (Input.stick.x - Input.stick.ox) / (L.r * 0.85);
      st = Math.abs(dx) < 0.12 ? 0 : clamp((dx - Math.sign(dx) * 0.12) / 0.88, -1, 1);
    } else st = (Input.right ? 1 : 0) - (Input.left ? 1 : 0);
    inp.steer = st;
    inp.brake = Input.down ? 1 : 0;
    inp.gas = this.autoGas ? (inp.brake ? 0 : 1) : (Input.up ? 1 : 0);
    inp.drift = Input.jump; inp.driftPress = Input.jumpPressed;
    inp.item = Input.actionPressed;
  }
  boost(k, t, kind) {
    k.boostT = Math.max(k.boostT, t); k.boostKind = kind;
    const sp = Math.hypot(k.vx, k.vz), fx = Math.cos(k.yaw), fz = Math.sin(k.yaw);
    const add = Math.max(0, k.vmax * 1.12 - sp) * 0.5;
    k.vx += fx * add; k.vz += fz * add;
    if (k.player) { Sound.play('kartBoost', { vol: 0.8, pitch: kind === 'mt2' ? 1.15 : 1 }); this.flash = 0.25; }
  }
  stepKart(k, dt, racing) {
    const T = this.T, R = this.R, inp = k.inp;
    for (const key of ['boostT', 'slowT', 'dustSlow', 'discoT', 'immuneT', 'waterT', 'swarmT', 'hopCool', 'padCool', 'bumpT', 'itemCool', 'landT', 'cheerT']) if (k[key] > 0) k[key] = Math.max(0, k[key] - dt);
    if (k.spinT > 0) { k.spinT = Math.max(0, k.spinT - dt); k.spinA += dt * 13 * Math.min(1, k.spinT + 0.3); if (k.spinT === 0) k.spinA = 0; }
    // roulette
    if (k.roul > 0) {
      const before = k.roul; k.roul = Math.max(0, k.roul - dt);
      if (k.player && Math.floor(before * 12) !== Math.floor(k.roul * 12)) Sound.play('kartRoulette', { vol: 0.35, pitch: 0.9 + this.rng() * 0.3 });
      if (k.player && inp.item && before < 1.0) k.roul = 0.0001;
      if (k.roul <= 0) { k.item = k.roulItem; k.itemCool = 0.35; if (k.player) { Sound.play('kartItem'); this.itemPop = 0.4; } }
      inp.item = false;
    }
    if (inp.item && k.item && k.itemCool <= 0 && racing && k.spinT <= 0) this.useItem(k);
    const loc = T.locate(k.x, k.z, k.loc.i, k.loc);
    const i = loc.i, hw = T.HW[i];
    const fx = Math.cos(k.yaw), fz = Math.sin(k.yaw);
    let fwd = k.vx * fx + k.vz * fz;
    const sp = Math.abs(fwd);
    // surface
    k.off = Math.abs(loc.d) > hw + 0.25 && k.y < 0.25;
    let vmax = k.vmax;
    if (k.off && k.boostT <= 0 && k.bufoT <= 0) vmax *= k.offK;
    k.inPool = false;
    if (k.y < 0.3 && k.bufoT <= 0) for (const z of R.slow) { const dx = k.x - z.x, dz = k.z - z.z; if (dx * dx + dz * dz < z.r * z.r) { vmax *= z.k; k.inPool = true; } }
    if (k.slowT > 0) vmax *= 0.64;
    if (k.dustSlow > 0) vmax *= 0.74;
    if (k.discoT > 0) vmax *= 1.12;
    if (k.boostT > 0) vmax = Math.max(vmax, k.vmax * (k.boostKind === 'mt2' || k.boostKind === 'glow' ? 1.34 : 1.28));
    if (k.bufoT > 0) vmax = Math.max(vmax, k.vmax * 1.22);
    if (!k.player) vmax *= k.rubber * (k.pace || 1);
    if (this.stormK > 0.5 && !k.player) vmax *= 1 - 0.08 * this.stormK;
    // steering & drift
    const spinning = k.spinT > 0;
    k.steer = approach(k.steer, spinning ? 0 : inp.steer, dt * (k.player && Input.stick.active ? 12 : 7));
    const auth = Math.max(clamp(sp / 5.5, 0, 1), inp.gas > 0 || inp.brake > 0 ? 0.5 : 0) * (1 - 0.3 * clamp((sp - 19) / 12, 0, 1));
    let yawRate = 0;
    if (!spinning) {
      if (k.drift) {
        const m = clamp(k.steer * k.drift, -1, 1);
        yawRate = k.drift * k.turn * Math.max(0.12, 0.52 + 0.6 * m) * auth;
        if (!k.air) {
          const before = k.charge;
          k.charge += dt * (1.0 + 0.8 * Math.max(0, m));
          if (k.player && ((before < 1.0 && k.charge >= 1.0) || (before < 2.1 && k.charge >= 2.1))) Sound.play('kartDrift', { vol: 0.5, pitch: k.charge >= 2.1 ? 1.3 : 1.1 });
        }
        if (!inp.drift) { // release: mini-turbo
          if (k.charge >= 2.1) this.boost(k, 1.15, 'mt2'); else if (k.charge >= 1.0) this.boost(k, 0.65, 'mt1');
          k.drift = 0; k.charge = 0;
        } else if (sp < 7 || k.off && sp < 10) { k.drift = 0; k.charge = 0; }
      } else yawRate = k.steer * k.turn * auth * (fwd < -0.5 ? -1 : 1);
      if (k.air) yawRate *= 0.55;
    }
    k.yaw = kartWrapA(k.yaw + yawRate * dt);
    // hop -> drift
    if (inp.driftPress && !k.air && !spinning && k.hopCool <= 0 && k.bufoT <= 0) {
      k.vy = 3.3; k.air = true; k.hopCool = 0.25; k.pendingDrift = sp > 8;
      if (k.player) Sound.play('jump', { vol: 0.25, pitch: 1.6 });
    }
    // re-project velocity on the new heading
    const nfx = Math.cos(k.yaw), nfz = Math.sin(k.yaw);
    fwd = k.vx * nfx + k.vz * nfz;
    let lat = -k.vx * nfz + k.vz * nfx;
    // engine / brakes
    const gas = spinning ? 0 : inp.gas, brake = spinning ? 0 : inp.brake;
    if (brake > 0) { if (fwd > 0.5) fwd -= 28 * brake * dt; else fwd = Math.max(-7.5, fwd - 9 * dt); }
    else if (gas > 0) {
      if (fwd < vmax) fwd = Math.min(vmax, fwd + (k.acc * (1 - Math.max(0, fwd) / vmax * 0.82) + (k.boostT > 0 ? 22 : 0)) * gas * dt);
      else fwd = Math.max(vmax, fwd - ((fwd - vmax) * 1.8 + 1.5) * dt);
    } else {
      fwd -= Math.sign(fwd) * Math.min(Math.abs(fwd), (2.5 + Math.abs(fwd) * 0.3) * dt);
      if (fwd > vmax) fwd = Math.max(vmax, fwd - (fwd - vmax) * 1.8 * dt);
    }
    if (spinning) fwd *= Math.exp(-2.2 * dt);
    const grip = k.air ? 0.8 : k.drift ? 2.4 : spinning ? 1.5 : k.grip * (k.off ? 0.75 : 1);
    lat *= Math.exp(-grip * dt);
    k.vx = nfx * fwd - nfz * lat; k.vz = nfz * fwd + nfx * lat;
    k.x += k.vx * dt; k.z += k.vz * dt;
    k.speed = Math.hypot(k.vx, k.vz); k.fwd = fwd; k.lat = lat;
    // vertical: hops, ramps, bufo leap
    const gh = this.rampHeight(k);
    if (k.bufoT > 0) {
      const u = 1 - k.bufoT / 1.4; k.y = Math.max(gh, Math.sin(clamp(u, 0, 1) * Math.PI) * 4.6); k.air = true; k.vy = 0;
      k.bufoT = Math.max(0, k.bufoT - dt);
      if (k.bufoT === 0) { k.air = false; k.y = gh; k.landT = 0.2; this.landFx(k); }
    } else if (k.air) {
      k.vy -= 30 * dt; k.y += k.vy * dt;
      if (k.y <= gh) {
        k.y = gh; k.air = false; k.landT = 0.18;
        if (k.vy < -6) this.landFx(k);
        k.vy = 0;
        if (k.pendingDrift && inp.drift && Math.abs(k.steer) > 0.25 && Math.abs(fwd) > 8 && !spinning) {
          k.drift = Math.sign(k.steer); k.charge = 0;
          if (k.player) Sound.play('kartDrift', { vol: 0.45 });
        }
        k.pendingDrift = false;
      }
    } else {
      if (gh > 0.01) { k.y = gh; k.onRamp = true; }
      else if (k.onRamp) { // off the lip: launch
        k.onRamp = false;
        if (fwd > 8) { k.vy = 3.5 + fwd * 0.26; k.air = true; k.pendingDrift = false; if (k.player) Sound.play('jump', { vol: 0.4, pitch: 0.8 }); }
        k.y = 0;
      } else k.y = 0;
    }
    // barriers
    const L2 = T.locate(k.x, k.z, loc.i, KART_TMP2);
    const j = L2.i, wr = T.WR[j] - 0.75, wl = T.WL[j] - 0.75;
    if (L2.d > wr || L2.d < -wl) {
      const side = L2.d > 0 ? 1 : -1, pen = side > 0 ? L2.d - wr : -wl - L2.d;
      k.x -= T.NX[j] * pen * side; k.z -= T.NZ[j] * pen * side;
      const vn = (k.vx * T.NX[j] + k.vz * T.NZ[j]) * side;
      // swing the nose along the barrier (toward the race direction) so a kart can never get pinned
      const tang = Math.atan2(T.TZ[j], T.TX[j]), rel = kartWrapA(k.yaw - tang);
      const into = (Math.cos(k.yaw) * T.NX[j] + Math.sin(k.yaw) * T.NZ[j]) * side;
      if (into > 0.04) {
        const target = Math.abs(rel) > 2.2 ? tang + Math.PI : tang, diff = kartWrapA(target - k.yaw);
        const turn = Math.min(Math.abs(diff), (vn > 3 ? 0.35 * Math.abs(diff) : 0) + 2.8 * dt);
        k.yaw = kartWrapA(k.yaw + Math.sign(diff) * turn);
      }
      if (vn > 0) {
        if (vn > 2) { // impact: bounce off and lose some speed
          k.vx -= T.NX[j] * side * vn * 1.4; k.vz -= T.NZ[j] * side * vn * 1.4;
          const keep = 1 - clamp(vn / 40, 0.05, 0.3); k.vx *= keep; k.vz *= keep;
        } else { // scraping along: just slide
          k.vx -= T.NX[j] * side * vn; k.vz -= T.NZ[j] * side * vn;
          const keep = 1 - 0.5 * dt; k.vx *= keep; k.vz *= keep;
        }
        if (vn > 3.5 && k.bumpT <= 0) {
          k.bumpT = 0.3;
          if (k.drift && vn > 8) { k.drift = 0; k.charge = 0; }
          this.sparkBurst(k.x + T.NX[j] * side * 0.8, 0.5, k.z + T.NZ[j] * side * 0.8, 10, [1, 0.85, 0.5]);
          if (k.player) { Sound.play('kartHit', { vol: clamp(vn / 18, 0.25, 0.9) }); this.shake = Math.min(1, 0.3 + vn / 25); }
        }
      }
    }
    // sculptures on the road
    if (k.bufoT <= 0) for (const ob of R.obstacles) {
      const dx = k.x - ob.x, dz = k.z - ob.z, rr0 = ob.r + 0.9, d2 = dx * dx + dz * dz;
      if (d2 < rr0 * rr0 && d2 > 1e-6) {
        const d = Math.sqrt(d2), nx = dx / d, nz = dz / d;
        k.x = ob.x + nx * rr0; k.z = ob.z + nz * rr0;
        const vn = -(k.vx * nx + k.vz * nz);
        if (vn > 0) { k.vx += nx * vn * 1.45; k.vz += nz * vn * 1.45; k.vx *= 0.8; k.vz *= 0.8; if (vn > 4 && k.bumpT <= 0) { k.bumpT = 0.3; k.drift = 0; k.charge = 0; if (k.player) { Sound.play('kartHit', { vol: 0.8 }); this.shake = 0.8; } this.sparkBurst(k.x - nx, 0.8, k.z - nz, 12, [0.8, 0.9, 1]); } }
      }
    }
    // boost pads
    if (!k.air && k.padCool <= 0) for (const b of R.boosts) {
      let ds = loc.s - b.s; if (ds > T.L / 2) ds -= T.L; if (ds < -T.L / 2) ds += T.L;
      if (Math.abs(ds) < b.len / 2 && Math.abs(loc.d - b.d) < b.w / 2) { this.boost(k, 1.05, 'pad'); k.padCool = 0.35; break; }
    }
    // gift boxes
    if (racing) for (const g of this.gifts) {
      if (!g.alive) continue;
      const dx = k.x - g.x, dz = k.z - g.z;
      if (dx * dx + dz * dz < 3.2 && k.y < 2.2) {
        g.alive = 0; g.t = 2.6;
        this.confetti(g.x, 1.0, g.z, 18);
        if (!k.item && k.roul <= 0) { k.roul = k.player ? 1.7 : 0.9; k.roulItem = kartRollItem(k.rank, this.karts.length, this.rng); k.cheerT = k.roul + 1.4; }
      }
    }
    // laps
    const s = k.loc.s;
    if (k.prevS > T.L * 0.75 && s < T.L * 0.25) this.crossLine(k);
    else if (k.prevS < T.L * 0.25 && s > T.L * 0.75) k.lap--;
    k.prevS = s;
    k.prog = (k.lap - 1) * T.L + s;
    // wrong way
    if (k.player && racing) {
      const dot = Math.cos(k.yaw) * T.TX[loc.i] + Math.sin(k.yaw) * T.TZ[loc.i];
      if (dot < -0.25 && k.speed > 2) k.wrongT += dt; else k.wrongT = Math.max(0, k.wrongT - dt * 2);
    }
    this.kartFx(k, dt);
  }
  rampHeight(k) {
    const R = this.R, T = this.T;
    for (const rp of R.ramps) {
      let ds = k.loc.s - (rp.s - rp.len); if (ds < -T.L / 2) ds += T.L; if (ds > T.L / 2) ds -= T.L;
      if (ds >= 0 && ds <= rp.len && k.loc.d >= rp.d0 - 0.3 && k.loc.d <= rp.d1 + 0.3) return rp.h * ds / rp.len;
    }
    return 0;
  }
  crossLine(k) {
    k.lap++;
    if (k.lap >= 2) { const lt = this.raceT - k.lapStart; k.lapTimes.push(lt); if (k.player) this.lastLap = { t: lt, show: 3 }; }
    k.lapStart = this.raceT;
    if (k.lap > KART_LAPS && !k.finished) {
      k.finished = true; k.finishT = this.raceT;
      if (k.player) {
        this.state = 'done'; this.stateT = 0; Sound.play('kartFinish'); Input.setMode('ui');
        this.banner('FINISH!', '#ffd84a', 2.5);
        if (Sound.engine) Sound.engine(false, 0);
        if (k.ai === null) k.ai = { skill: 0.86, bias: 0, avoid: 0, avoidT: 0, driftT: 0, itemT: 99, stuckT: 0, revT: 0, wob: 0 };
        this.confetti(k.x, 2, k.z, 40);
      }
    } else if (k.player && k.lap >= 2) {
      if (k.lap === KART_LAPS) { Sound.play('kartFinalLap'); this.banner('FINAL LAP!', '#ff4fd8', 2.0); }
      else { Sound.play('kartLap'); this.banner('LAP ' + k.lap + '/' + KART_LAPS, '#38f2ff', 1.4); }
    }
  }
  banner(text, col, t) { this.msgs.push({ text, col, t, max: t }); }
  collideKarts() {
    const K = this.karts;
    for (let a = 0; a < K.length; a++) for (let b = a + 1; b < K.length; b++) {
      const A = K[a], Bk = K[b];
      if (Math.abs(A.y - Bk.y) > 1.3) continue;
      const dx = Bk.x - A.x, dz = Bk.z - A.z, d2 = dx * dx + dz * dz, rr0 = 1.75;
      if (d2 >= rr0 * rr0 || d2 < 1e-6) continue;
      const d = Math.sqrt(d2), nx = dx / d, nz = dz / d, pen = rr0 - d;
      let ma = A.mass * (A.discoT > 0 ? 4 : 1), mb = Bk.mass * (Bk.discoT > 0 ? 4 : 1);
      const ta = mb / (ma + mb), tb = ma / (ma + mb);
      A.x -= nx * pen * ta; A.z -= nz * pen * ta; Bk.x += nx * pen * tb; Bk.z += nz * pen * tb;
      const vr = (Bk.vx - A.vx) * nx + (Bk.vz - A.vz) * nz;
      if (vr < 0) {
        const j = -(1.5) * vr / (1 / ma + 1 / mb);
        A.vx -= nx * j / ma; A.vz -= nz * j / ma; Bk.vx += nx * j / mb; Bk.vz += nz * j / mb;
        if (-vr > 3 && (A.player || Bk.player)) { Sound.play('kartHit', { vol: clamp(-vr / 20, 0.2, 0.7), pitch: 1.2 }); this.shake = Math.max(this.shake, 0.35); }
        if (-vr > 2) this.sparkBurst((A.x + Bk.x) / 2, 0.6, (A.z + Bk.z) / 2, 6, [1, 0.9, 0.6]);
      }
      if (A.discoT > 0 && Bk.discoT <= 0) this.hit(Bk, 'disco'); else if (Bk.discoT > 0 && A.discoT <= 0) this.hit(A, 'disco');
    }
  }
  updateRanks() {
    const K = this.karts.slice().sort((a, b) => (b.finished - a.finished) || (a.finished ? a.finishT - b.finishT : b.prog - a.prog));
    K.forEach((k, i) => k.rank = i + 1);
    // gentle rubber banding toward the player
    const p = this.player;
    if (p) for (const k of this.karts) {
      if (k.player) continue;
      const gap = k.prog - p.prog;
      k.rubber = gap > 30 ? 1 - Math.min(0.09, (gap - 30) / 600) : gap < -18 ? 1 + Math.min(0.1, (-gap - 18) / 260) : 1;
      if (p.finished) k.rubber = 1;
    }
  }
  hit(k, kind) {
    if (k.discoT > 0 || k.bufoT > 0 || k.immuneT > 0 || k.spinT > 0) return false;
    k.spinT = kind === 'tumble' ? 0.75 : kind === 'disco' ? 0.6 : 1.1;
    k.drift = 0; k.charge = 0; k.boostT = 0; k.immuneT = k.spinT + 1.2;
    k.vx *= 0.45; k.vz *= 0.45; k.vy = 3; k.air = true;
    if (k.player) { Sound.play('kartHit'); this.shake = 1; this.banner(kind === 'puke' ? 'BLEGH!' : kind === 'tumble' ? 'TUMBLED!' : 'BONK!', '#ff6a6a', 1.0); }
    if (kind === 'puke') for (let i = 0; i < 16; i++) this.parts.spawn({ x: k.x, y: 1, z: k.z, vx: (this.rng() - 0.5) * 7, vy: 2 + this.rng() * 4, vz: (this.rng() - 0.5) * 7, life: 0.8, s0: 0.35, s1: 0.15, r: 0.5, g: 0.95, b: 0.25, reg: 'puff0_0', grav: 14, lit: true });
    return true;
  }
  /* ---------- items ---------- */
  useItem(k) {
    const it = k.item; k.item = null; k.itemCool = 0.3;
    const fx = Math.cos(k.yaw), fz = Math.sin(k.yaw), sp = Math.max(0, k.fwd || 0);
    switch (it) {
      case 'puke': this.objs.push({ type: 'puke', x: k.x + fx * 1.8, z: k.z + fz * 1.8, y: 0.6, vx: fx * (sp + 17), vz: fz * (sp + 17), t: 0, life: 7, owner: k, bounces: 0, loc: { i: k.loc.i, s: 0, d: 0 } }); Sound.play('kartPuke', { vol: k.player ? 0.9 : 0.4 }); break;
      case 'tumble': this.objs.push({ type: 'tumble', x: k.x - fx * 2.4, z: k.z - fz * 2.4, y: 0.8, vx: -fx * 1.5, vz: -fz * 1.5, t: 0, life: 40, owner: k, rot: 0, loc: { i: k.loc.i, s: 0, d: 0 } }); break;
      case 'swarm': {
        const tgt = this.karts.find(o => o.rank === k.rank - 1) || this.karts.find(o => o.rank === k.rank + 1);
        if (tgt) { this.objs.push({ type: 'swarm', owner: k, target: tgt, p: k.prog, t: 0, life: 12, x: k.x, z: k.z, y: 1.5, d: k.loc.d }); if (k.player || tgt.player) Sound.play('kartSwarm', { vol: 0.8 }); if (tgt.player) this.banner('MOSQUITOES INCOMING!', '#ff4a5a', 1.6); }
        break;
      }
      case 'glow': this.boost(k, 1.6, 'glow'); break;
      case 'dust': this.objs.push({ type: 'dust', x: k.x - fx * 3.2, z: k.z - fz * 3.2, y: 0, r: 2, t: 0, life: 7.5, owner: k }); if (k.player) Sound.play('wind', { vol: 0.5 }); break;
      case 'disco': k.discoT = 6.5; if (k.player) Sound.play('shield', { vol: 0.7 }); break;
      case 'bufo': k.bufoT = 1.4; k.drift = 0; k.charge = 0; k.boostT = Math.max(k.boostT, 1.4); k.boostKind = 'bufo'; if (k.player) Sound.play('jumpBig', { vol: 0.7 }); break;
      case 'water': k.slowT = 0; k.dustSlow = 0; k.swarmT = 0; k.waterT = 3.5; if (k.player) this.white = 0; this.boost(k, 0.75, 'water'); if (k.player) Sound.play('splash', { vol: 0.6 }); for (let i = 0; i < 14; i++) this.parts.spawn({ x: k.x, y: 1.2, z: k.z, vx: (this.rng() - 0.5) * 5, vy: 2 + this.rng() * 3, vz: (this.rng() - 0.5) * 5, life: 0.7, s0: 0.25, s1: 0.1, r: 0.5, g: 0.8, b: 1, a: 0.9, grav: 12, reg: 'glowball0_0', add: true }); break;
    }
  }
  updateObjs(dt) {
    const T = this.T;
    for (const o of this.objs) {
      o.t += dt;
      if (o.type === 'puke') {
        o.x += o.vx * dt; o.z += o.vz * dt; o.y = 0.45 + Math.abs(Math.sin(o.t * 9)) * 0.9;
        const L = T.locate(o.x, o.z, o.loc.i, o.loc), j = L.i, wr = T.WR[j] - 0.45, wl = T.WL[j] - 0.45;
        if (L.d > wr || L.d < -wl) {
          const side = L.d > 0 ? 1 : -1, pen = side > 0 ? L.d - wr : -wl - L.d;
          o.x -= T.NX[j] * pen * side; o.z -= T.NZ[j] * pen * side;
          const vn = (o.vx * T.NX[j] + o.vz * T.NZ[j]) * side; if (vn > 0) { o.vx -= T.NX[j] * side * vn * 2; o.vz -= T.NZ[j] * side * vn * 2; }
          if (++o.bounces > 6) o.dead = true;
        }
        for (const ob of this.R.obstacles) { const dx = o.x - ob.x, dz = o.z - ob.z; if (dx * dx + dz * dz < (ob.r + 0.4) ** 2) o.dead = true; }
        if (Math.random() < dt * 30) this.parts.spawn({ x: o.x, y: o.y, z: o.z, vy: 0.5, life: 0.5, s0: 0.35, s1: 0.05, r: 0.55, g: 1, b: 0.3, a: 0.8, reg: 'puff0_0', lit: true });
        for (const k of this.karts) {
          if (k === o.owner && o.t < 0.6) continue;
          const dx = k.x - o.x, dz = k.z - o.z;
          if (dx * dx + dz * dz < 2.6 && Math.abs(k.y + 0.6 - o.y) < 1.6) { if (this.hit(k, 'puke') || k.discoT > 0) { o.dead = true; this.slick(o.x, o.z); } break; }
        }
      } else if (o.type === 'tumble') {
        const k = Math.exp(-0.8 * dt); o.vx *= k; o.vz *= k;
        if (this.R.storm && this.stormK > 0.3) { o.vx += this.stormWind[0] * dt * 3; o.vz += this.stormWind[1] * dt * 3; }
        o.x += o.vx * dt; o.z += o.vz * dt; o.rot += Math.hypot(o.vx, o.vz) * dt * 1.2 + dt * 0.5; o.y = 0.85 + Math.abs(Math.sin(o.t * 3)) * 0.15;
        const L = T.locate(o.x, o.z, o.loc.i, o.loc); if (Math.abs(L.d) > Math.max(T.WL[L.i], T.WR[L.i]) + 6) o.dead = true;
        for (const kk of this.karts) {
          if (kk === o.owner && o.t < 0.8) continue;
          const dx = kk.x - o.x, dz = kk.z - o.z;
          if (dx * dx + dz * dz < 3.4 && kk.y < 1.6) { this.hit(kk, 'tumble'); o.dead = true; this.burstTumble(o); break; }
        }
        for (const p of this.objs) if (p.type === 'puke' && !p.dead) { const dx = p.x - o.x, dz = p.z - o.z; if (dx * dx + dz * dz < 2.5) { p.dead = true; o.dead = true; this.burstTumble(o); } }
      } else if (o.type === 'swarm') {
        const tg = o.target;
        if (tg.finished || tg.discoT > 0 || tg.bufoT > 0 || tg.waterT > 0) { if (o.t > 0.5) o.dead = true; }
        o.p += (44 + Math.max(0, tg.prog - o.p) * 0.4) * dt;
        o.d = lerp(o.d, tg.loc.d, 1 - Math.exp(-3 * dt));
        const a = T.at(((o.p % T.L) + T.L) % T.L, KART_TMP);
        o.x = a.x + a.nx * o.d; o.z = a.z + a.nz * o.d; o.y = 1.6 + Math.sin(o.t * 6) * 0.3;
        if (o.p >= tg.prog - 1.5) { if (!(tg.discoT > 0 || tg.bufoT > 0)) { tg.slowT = 2.8; tg.swarmT = 2.8; tg.drift = 0; tg.charge = 0; if (tg.player) { Sound.play('kartSwarm'); this.banner('BZZZZZT!', '#ff4a5a', 1.2); } } o.dead = true; }
      } else if (o.type === 'dust') {
        o.r = Math.min(5.2, 2 + o.t * 3);
        for (const k of this.karts) {
          if (k === o.owner && o.t < 1.5) continue;
          if (k.waterT > 0 || k.bufoT > 0) continue;
          const dx = k.x - o.x, dz = k.z - o.z;
          if (dx * dx + dz * dz < o.r * o.r && k.y < 2.5) { k.dustSlow = 0.7; if (k.player) this.white = Math.min(1, this.white + dt * 4); }
        }
      }
      if (o.t > o.life) o.dead = true;
    }
    this.objs = this.objs.filter(o => !o.dead);
  }
  slick(x, z) { for (let i = 0; i < 10; i++) this.parts.spawn({ x, y: 0.5, z, vx: (this.rng() - 0.5) * 6, vy: 1 + this.rng() * 3, vz: (this.rng() - 0.5) * 6, life: 0.7, s0: 0.4, s1: 0.1, r: 0.5, g: 0.95, b: 0.25, grav: 12, lit: true }); }
  burstTumble(o) { for (let i = 0; i < 12; i++) this.parts.spawn({ x: o.x, y: 0.8, z: o.z, vx: (this.rng() - 0.5) * 6, vy: 1 + this.rng() * 4, vz: (this.rng() - 0.5) * 6, life: 0.9, s0: 0.3, s1: 0.2, r: 0.75, g: 0.6, b: 0.35, grav: 10, reg: 'spark0_0', vrot: 6, lit: true }); }
  sparkBurst(x, y, z, n, c) { for (let i = 0; i < n; i++) this.parts.spawn({ x, y, z, vx: (this.rng() - 0.5) * 9, vy: 1 + this.rng() * 4, vz: (this.rng() - 0.5) * 9, life: 0.35 + this.rng() * 0.25, s0: 0.22, s1: 0.06, r: c[0], g: c[1], b: c[2], add: true, reg: 'glowball0_0', grav: 14 }); }
  confetti(x, y, z, n) { const cols = KART_NEON.map(kartHexRgb); for (let i = 0; i < n; i++) { const c = cols[i % cols.length]; this.parts.spawn({ x, y, z, vx: (this.rng() - 0.5) * 8, vy: 2 + this.rng() * 6, vz: (this.rng() - 0.5) * 8, life: 1.2, s0: 0.22, s1: 0.18, r: c[0], g: c[1], b: c[2], reg: 'confetti0_0', grav: 9, drag: 1.5, vrot: (this.rng() - 0.5) * 20 }); } }
  landFx(k) { const c = this.dustCol; for (let i = 0; i < 8; i++) this.parts.spawn({ x: k.x + (this.rng() - 0.5) * 1.6, y: 0.2, z: k.z + (this.rng() - 0.5) * 1.6, vx: (this.rng() - 0.5) * 4, vy: 0.8 + this.rng(), vz: (this.rng() - 0.5) * 4, life: 0.8, s0: 0.6, s1: 1.6, r: c[0], g: c[1], b: c[2], a: 0.55, drag: 2, lit: true }); }
  // per-kart particle emitters
  kartFx(k, dt) {
    if (!this.dustCol) this.dustCol = kartHexRgb(this.R.surf.dust);
    const fx = Math.cos(k.yaw), fz = Math.sin(k.yaw), rx = -fz, rz = fx, rng = this.rng;
    const near = !this.cam || (k.x - this.cam.x) ** 2 + (k.z - this.cam.z) ** 2 < 120 * 120;
    if (!near) return;
    const sp = k.speed;
    // dust behind the wheels
    k.dustT -= dt;
    const dusty = (k.off || k.drift || this.R.surf === KART_SURF.playa && sp > 18) && !k.air && sp > 4;
    if (dusty && k.dustT <= 0) {
      k.dustT = k.off ? 0.03 : k.drift ? 0.045 : 0.09;
      const c = this.dustCol;
      for (const s of [-1, 1]) this.parts.spawn({ x: k.x - fx * 1.0 + rx * s * 0.65, y: 0.25, z: k.z - fz * 1.0 + rz * s * 0.65, vx: -fx * 2 + (rng() - 0.5) * 2 + rx * s, vy: 0.6 + rng() * 0.8, vz: -fz * 2 + (rng() - 0.5) * 2 + rz * s, life: k.off ? 1.0 : 0.7, s0: 0.5, s1: k.off ? 2.2 : 1.5, r: c[0], g: c[1], b: c[2], a: k.off ? 0.6 : 0.4, drag: 1.5, lit: true });
    }
    if (k.inPool && sp > 3 && rng() < dt * 30) this.parts.spawn({ x: k.x + (rng() - 0.5), y: 0.3, z: k.z + (rng() - 0.5), vx: (rng() - 0.5) * 3, vy: 2 + rng() * 2, vz: (rng() - 0.5) * 3, life: 0.6, s0: 0.3, s1: 0.1, r: 0.7, g: 0.95, b: 1, a: 0.8, grav: 10, reg: 'glowball0_0', add: true });
    // drift sparks
    if (k.drift && !k.air) {
      k.sparkT -= dt;
      if (k.sparkT <= 0) {
        k.sparkT = 0.02;
        const tier = k.charge >= 2.1 ? 2 : k.charge >= 1.0 ? 1 : 0;
        const c = tier === 2 ? [1, 0.3, 0.85] : tier === 1 ? [1, 0.85, 0.25] : [1, 1, 1];
        for (const s of [-1, 1]) {
          if (tier === 0 && rng() < 0.6) continue;
          this.parts.spawn({ x: k.x - fx * 0.85 + rx * s * 0.62, y: 0.15, z: k.z - fz * 0.85 + rz * s * 0.62, vx: -fx * 3 + (rng() - 0.5) * 4 + rx * s * 2, vy: 1.5 + rng() * 3, vz: -fz * 3 + (rng() - 0.5) * 4 + rz * s * 2, life: 0.22 + rng() * 0.15, s0: tier ? 0.2 : 0.12, s1: 0.04, r: c[0], g: c[1], b: c[2], add: true, reg: 'glowball0_0', grav: 18 });
        }
      }
    }
    // The Man's twin flame jets
    if (k.id === 'theman' && sp > 2 && rng() < dt * 34) {
      const sg = rng() < 0.5 ? -1 : 1;
      this.parts.spawn({ x: k.x - fx * 1.08 + rx * sg * 0.3, y: k.y + 0.44, z: k.z - fz * 1.08 + rz * sg * 0.3, vx: k.vx * 0.5 - fx * 3, vy: 0.6, vz: k.vz * 0.5 - fz * 3, life: 0.22, s0: 0.55, s1: 0.15, r: 1, g: 0.55 + rng() * 0.3, b: 0.2, add: true, reg: 'flame0_0' });
    }
    // boost flames + glow trail
    if (k.boostT > 0 && rng() < dt * 50) {
      const c = k.boostKind === 'mt2' ? [1, 0.35, 0.9] : k.boostKind === 'glow' ? [0.3, 1, 0.85] : k.boostKind === 'water' ? [0.4, 0.8, 1] : [1, 0.75, 0.3];
      this.parts.spawn({ x: k.x - fx * 1.1, y: k.y + 0.45, z: k.z - fz * 1.1, vx: k.vx * 0.6 - fx * 4, vy: 0.4, vz: k.vz * 0.6 - fz * 4, life: 0.25, s0: 0.7, s1: 0.2, r: c[0], g: c[1], b: c[2], add: true, reg: 'glowball0_0' });
    }
    // disco sparkles
    if (k.discoT > 0 && rng() < dt * 30) { const h = (this.t * 2 + rng()) % 1, c = [0.5 + 0.5 * Math.sin(h * TAU), 0.5 + 0.5 * Math.sin(h * TAU + 2.1), 0.5 + 0.5 * Math.sin(h * TAU + 4.2)]; this.parts.spawn({ x: k.x + (rng() - 0.5) * 2.4, y: k.y + 0.4 + rng() * 1.6, z: k.z + (rng() - 0.5) * 2.4, vy: 0.6, life: 0.5, s0: 0.45, s1: 0.05, r: c[0], g: c[1], b: c[2], add: true, reg: 'sparkle0_0', vrot: 4 }); }
    // swarm around a slowed kart
    if (k.swarmT > 0 && rng() < dt * 20) this.parts.spawn({ x: k.x + (rng() - 0.5) * 2, y: k.y + 1 + rng(), z: k.z + (rng() - 0.5) * 2, vx: (rng() - 0.5) * 4, vy: (rng() - 0.5) * 2, vz: (rng() - 0.5) * 4, life: 0.5, s0: 0.3, s1: 0.3, reg: 'mozzie0_0' });
  }
  updateFx(dt) {
    const R = this.R, rng = this.rng, cam = this.cam;
    // steam over hot pools
    for (const st of R.steam) {
      if (cam && (st.x - cam.x) ** 2 + (st.z - cam.z) ** 2 > 160 * 160) continue;
      if (rng() < dt * 5) this.parts.spawn({ x: st.x + (rng() - 0.5) * st.r, y: 0.3, z: st.z + (rng() - 0.5) * st.r, vx: (rng() - 0.5) * 0.6, vy: 1.2 + rng(), vz: (rng() - 0.5) * 0.6, life: 2.4, s0: 1.2, s1: 3.6, a: 0.4, drag: 0.4 });
    }
    // fire: burning Man + barrels
    for (const p of R.props) {
      if (!p.burning && !p.fire) continue;
      if (cam && (p.x - cam.x) ** 2 + (p.z - cam.z) ** 2 > 260 * 260) continue;
      const big = p.burning, n = big ? 46 : 6;
      if (rng() < dt * n) {
        const u = rng() * rng(), h = big ? u * p.h * 0.5 : 0.9, wd = big ? p.w * (0.75 - u * 0.5) : 0.4;
        this.parts.spawn({ x: p.x + (rng() - 0.5) * wd, y: h, z: p.z + (rng() - 0.5) * wd, vx: (rng() - 0.5) * 1.5, vy: (big ? 5 : 1.5) + rng() * 3, vz: (rng() - 0.5) * 1.5, life: big ? 0.9 : 0.6, s0: big ? 3.5 + rng() * 3.5 : 0.9, s1: big ? 0.8 : 0.2, r: 1, g: 0.55 + rng() * 0.35, b: 0.2, add: true, reg: 'flame0_0' });
      }
      if (big && rng() < dt * 6) this.parts.spawn({ x: p.x + (rng() - 0.5) * 6, y: p.h * (0.3 + rng() * 0.5), z: p.z + (rng() - 0.5) * 6, vx: (rng() - 0.5) * 2, vy: 3 + rng() * 2, vz: (rng() - 0.5) * 2, life: 3, s0: 6, s1: 16, r: 0.18, g: 0.12, b: 0.14, a: 0.45, drag: 0.3 });
      if (big && rng() < dt * 25) this.parts.spawn({ x: p.x + (rng() - 0.5) * 8, y: 4 + rng() * p.h * 0.6, z: p.z + (rng() - 0.5) * 8, vx: (rng() - 0.5) * 5, vy: 5 + rng() * 6, vz: (rng() - 0.5) * 5, life: 2.5, s0: 0.35, s1: 0.1, r: 1, g: 0.55, b: 0.2, add: true, reg: 'glowball0_0', drag: 0.3 });
    }
    if (R.fireworks) {
      this.fwT -= dt;
      if (this.fwT <= 0) {
        this.fwT = 0.7 + rng() * 1.4;
        const a = rng() * TAU, r = 40 + rng() * 120, x = Math.cos(a) * r, z = Math.sin(a) * r, y = 45 + rng() * 40;
        const c = kartHexRgb(KART_NEON[Math.floor(rng() * 6)]), n = 60;
        for (let i = 0; i < n; i++) { const u = rng() * TAU, v = Math.acos(2 * rng() - 1), s = 14 + rng() * 6; this.parts.spawn({ x, y, z, vx: Math.cos(u) * Math.sin(v) * s, vy: Math.cos(v) * s, vz: Math.sin(u) * Math.sin(v) * s, life: 1.6 + rng() * 0.6, s0: 1.4, s1: 0.3, r: c[0], g: c[1], b: c[2], add: true, reg: 'glowball0_0', grav: 6, drag: 1.2 }); }
      }
    }
  }
  updateStorm(dt) {
    const S = this.storm;
    S.t -= dt;
    if (S.t <= 0) {
      if (S.phase === 'calm') { S.phase = 'rise'; S.t = 3; const a = this.rng() * TAU; this.stormWind = [Math.cos(a) * 6, Math.sin(a) * 6]; if (this.state === 'race') this.banner('DUST STORM!', '#ffe0a8', 2.0); Sound.play('wind', { vol: 0.8 }); }
      else if (S.phase === 'rise') { S.phase = 'peak'; S.t = 6; }
      else if (S.phase === 'peak') { S.phase = 'fall'; S.t = 3; }
      else { S.phase = 'calm'; S.t = 16 + this.rng() * 8; }
    }
    const tgt = S.phase === 'rise' ? 1 - S.t / 3 : S.phase === 'peak' ? 1 : S.phase === 'fall' ? S.t / 3 : 0;
    this.stormK = tgt;
    if (!this.stormWind) this.stormWind = [4, 2];
    // tumbleweeds blow across during storms
    if (tgt > 0.4 && this.state === 'race' && this.rng() < dt * 0.9 && this.objs.filter(o => o.type === 'tumble').length < 14) {
      const p = this.player, T = this.T, ahead = T.at(p.loc.s + 40 + this.rng() * 60, {}), side = this.rng() < 0.5 ? -1 : 1;
      const x = ahead.x + ahead.nx * side * (ahead.hw + 4), z = ahead.z + ahead.nz * side * (ahead.hw + 4);
      this.objs.push({ type: 'tumble', x, z, y: 0.8, vx: -ahead.nx * side * 4.5, vz: -ahead.nz * side * 4.5, t: 0, life: 14, owner: null, rot: 0, loc: { i: ahead.i, s: 0, d: 0 } });
    }
  }
  /* ---------- AI ---------- */
  aiInput(k, dt, racing) {
    const T = this.T, inp = k.inp, sp = k.speed;
    if (!k.ai) k.ai = { skill: 0.9, bias: 0, avoid: 0, avoidT: 0, driftT: 0, itemT: 1, stuckT: 0, revT: 0, wob: 0 };
    const ai = k.ai;
    ai.wob += dt;
    const skill = ai.skill;
    // avoidance (every few frames)
    ai.avoidT -= dt;
    if (ai.avoidT <= 0) {
      ai.avoidT = 0.12;
      let want = 0;
      const myD = T.at(k.loc.s + 12, KART_TMP).o + ai.bias * 1.6;
      const test = (x, z, r) => {
        const L = T.locate(x, z, k.loc.i, KART_TMP2);
        let ds = L.s - k.loc.s; if (ds < -T.L / 2) ds += T.L; if (ds > T.L / 2) ds -= T.L;
        if (ds < 3 || ds > 32) return;
        const gap = L.d - myD;
        if (Math.abs(gap) < r + 2.2) want += (gap > 0 ? -1 : 1) * (r + 2.6 - Math.abs(gap)) * (skill > 0.88 ? 1 : 0.7);
      };
      for (const ob of this.R.obstacles) test(ob.x, ob.z, ob.r);
      for (const z of this.R.slow) test(z.x, z.z, z.r * 0.9);
      for (const o of this.objs) if (o.type === 'tumble' || o.type === 'dust') test(o.x, o.z, o.type === 'dust' ? o.r : 1);
      for (const o of this.karts) if (o !== k && o.speed < sp - 2) test(o.x, o.z, 1.2);
      ai.avoidTarget = clamp(want, -6, 6);
    }
    ai.avoid = lerp(ai.avoid, ai.avoidTarget || 0, 1 - Math.exp(-4 * dt));
    // pure pursuit on the racing line
    const look = 6 + sp * 0.42;
    const f = T.at(k.loc.s + look, KART_TMP);
    let off = f.o + ai.bias * Math.max(0, f.hw - 3) * 0.3 + ai.avoid + Math.sin(ai.wob * 0.7) * (1.05 - skill) * 6;
    // aim at upcoming boost pads when skilled
    if (skill > 0.92) for (const b of this.R.boosts) { let ds = b.s - k.loc.s; if (ds < 0) ds += T.L; if (ds > 8 && ds < 45) { off = lerp(off, b.d, 0.6); break; } }
    off = clamp(off, -f.hw + 1.4, f.hw - 1.4);
    const tx = f.x + f.nx * off, tz = f.z + f.nz * off;
    const ang = kartWrapA(Math.atan2(tz - k.z, tx - k.x) - k.yaw);
    inp.steer = clamp(ang * 2.8, -1, 1);
    // speed: corner limit for this kart, plus a pace factor that rises through the cup
    const vt = k.vp[T.idx(k.loc.s + 6 + sp * 0.55)] * (0.97 + skill * 0.06);
    k.pace = k.player ? 1 : 0.955 + 0.05 * clamp((skill - 0.85) / 0.15, 0, 1);
    inp.gas = sp > vt + 1 ? 0 : 1; inp.brake = sp > vt + 4 ? 0.6 : 0;
    // stuck recovery
    if (racing && sp < 2 && !k.spinT) { ai.stuckT += dt; if (ai.stuckT > 1.2) { ai.revT = 0.9; ai.stuckT = 0; } } else ai.stuckT = 0;
    if (ai.revT > 0) { ai.revT -= dt; inp.gas = 0; inp.brake = 1; inp.steer = -inp.steer; }
    // drifting through longer bends
    inp.driftPress = false;
    if (!k.drift && !k.air && sp > 14 && ai.driftT <= 0) {
      let kk = 0; for (let s = 8; s <= 34; s += 4) kk += T.K[T.idx(k.loc.s + s)];
      kk /= 7;
      if (Math.abs(kk) > 0.021 && this.rng() < skill * dt * 6) { inp.driftPress = true; inp.drift = true; inp.steer = Math.sign(kk); ai.driftT = 0.1; ai.driftDir = Math.sign(kk); ai.holdT = 0; }
    }
    if (k.drift || ai.driftT > 0 || k.air && ai.driftDir) {
      ai.holdT = (ai.holdT || 0) + dt;
      let kk = 0; for (let s = 4; s <= 16; s += 4) kk += T.K[T.idx(k.loc.s + s)];
      kk /= 4;
      const turning = Math.sign(kk) === ai.driftDir && Math.abs(kk) > 0.008;
      inp.drift = (turning && ai.holdT < 3.2) || (k.charge > 0.8 && k.charge < 1.05) || ai.holdT < 0.35;
      if (!inp.drift) { ai.driftDir = 0; ai.driftT = 0.6; }
      if (k.air && ai.driftDir) inp.steer = ai.driftDir;
    } else { inp.drift = false; if (ai.driftT > 0) ai.driftT -= dt; }
    // items
    inp.item = false;
    if (k.item && racing) {
      ai.itemT -= dt;
      if (ai.itemT <= 0) {
        const it = k.item;
        const ahead = this.karts.find(o => o.rank === k.rank - 1), behind = this.karts.find(o => o.rank === k.rank + 1);
        const gapA = ahead ? ahead.prog - k.prog : 999, gapB = behind ? k.prog - behind.prog : 999;
        let use = false;
        if (it === 'glow' || it === 'bufo') use = Math.abs(T.K[T.idx(k.loc.s + 20)]) < 0.012 || ai.itemT < -4;
        else if (it === 'water') use = k.slowT > 0 || k.dustSlow > 0 || ai.itemT < -2;
        else if (it === 'puke') { const a = ahead && Math.abs(kartWrapA(Math.atan2(ahead.z - k.z, ahead.x - k.x) - k.yaw)) < 0.25; use = (a && gapA < 40) || ai.itemT < -7; }
        else if (it === 'tumble' || it === 'dust') use = gapB < 16 || ai.itemT < -6;
        else if (it === 'swarm') use = true;
        else if (it === 'disco') use = gapA < 8 || gapB < 8 || ai.itemT < -3;
        if (use) { inp.item = true; ai.itemT = 1 + this.rng() * 2.5; }
      }
    }
  }
  /* ---------- results ---------- */
  finishRace() {
    const T = this.T;
    // estimate finish times for anyone still racing
    const avgSpeed = k => Math.max(8, k.vmax * 0.8);
    for (const k of this.karts) if (!k.finished) { k.finished = true; k.finishT = this.raceT + Math.max(0.5, (KART_LAPS * T.L - k.prog) / avgSpeed(k)); k.estimated = true; }
    const order = this.karts.slice().sort((a, b) => a.finishT - b.finishT);
    order.forEach((k, i) => k.rank = i + 1);
    this.results = order.map(k => ({ id: k.id, name: k.racer.name, t: k.finishT, best: k.lapTimes.length ? Math.min(...k.lapTimes) : 0, player: k.player, pts: this.mode === 'gp' ? KART_POINTS[k.rank - 1] || 0 : 0, est: !!k.estimated }));
    const ks = kartSave(), me = this.player;
    // save best times
    const best = ks.best[this.trackId] || {};
    const myBestLap = me.lapTimes.length ? Math.min(...me.lapTimes) : 0;
    this.newRecord = { lap: false, total: false };
    if (myBestLap && (!best.lap || myBestLap < best.lap)) { best.lap = +myBestLap.toFixed(3); this.newRecord.lap = true; }
    if (!best.total || me.finishT < best.total) { best.total = +me.finishT.toFixed(3); this.newRecord.total = true; }
    ks.best[this.trackId] = best;
    if (this.mode === 'gp') {
      for (const r of this.results) this.gp.points[r.id] = (this.gp.points[r.id] || 0) + r.pts;
      this.gp.lastPos = me.rank;
      this.gp.results.push(this.results.map(r => r.id));
    }
    Save.save();
    this.state = 'results'; this.stateT = 0;
    Input.setMode('ui');
    if (Sound.engine) Sound.engine(false, 0);
    Sound.music('kart_results');
    this.buildButtons();
  }
  standings() {
    return KART_RACERS.map(r => ({ id: r.id, name: r.name, pts: this.gp.points[r.id] || 0, player: r.id === this.racerId })).sort((a, b) => b.pts - a.pts || (a.player ? -1 : 1));
  }
  nextRace() {
    Sound.play('select');
    if (this.view) this.view.destroy();
    Game.setScene(new KartRaceScene({ mode: 'gp', cup: this.cup.id, race: this.raceIdx + 1, racer: this.racerId, autoGas: this.autoGas, gp: this.gp }));
  }
  awardTrophy() {
    const st = this.standings(), pos = st.findIndex(s => s.player) + 1;
    this.trophyPos = pos;
    const ks = kartSave(), prev = ks.trophies[this.cup.id] || 0;
    if (pos <= 3 && (!prev || pos < prev)) ks.trophies[this.cup.id] = pos;
    Save.save();
    this.state = 'trophy'; this.stateT = 0;
    Sound.music(pos <= 3 ? 'kart_results' : 'kart_menu');
    if (pos <= 3) Sound.play('kartFinish');
    this.buildButtons();
  }
  leave() {
    if (Sound.engine) Sound.engine(false, 0);
    if (this.paused) { this.paused = false; Sound.resume(); }
    if (this.view) this.view.destroy();
    Game.setScene(new KartMenuScene());
  }
  restart() {
    if (Sound.engine) Sound.engine(false, 0);
    if (this.paused) { this.paused = false; Sound.resume(); }
    if (this.view) this.view.destroy();
    // restarting a GP race restores the standings from before it
    Game.setScene(new KartRaceScene(Object.assign({}, this.opts, { gp: this.mode === 'gp' ? JSON.parse(this.gpSnap) : undefined })));
  }
  openPause() {
    this.paused = true; Sound.play('pause'); if (Sound.engine) Sound.engine(false, 0); Sound.suspend();
    Input.setMode('ui');
    this.buildPause();
  }
  closePause() { this.paused = false; Sound.resume(); Input.setMode(this.state === 'race' || this.state === 'count' ? 'game' : 'ui'); Sound.play('select'); }
}

// pause the race when the app goes to the background (registered once, after Game's own handler)
function kartHookVisibility() {
  if (kartHookVisibility.done) return;
  kartHookVisibility.done = true;
  document.addEventListener('visibilitychange', () => {
    const s = Game.scene;
    if (!(s instanceof KartRaceScene)) return;
    if (document.hidden) {
      if (Sound.engine) Sound.engine(false, 0);
      if (!s.paused && (s.state === 'race' || s.state === 'count' || s.state === 'intro')) s.openPause();
    } else if (s.paused) Sound.suspend();
  });
}

/* ---------------- race scene: rendering ---------------- */
Object.assign(KartRaceScene.prototype, {
  viewRect() {
    const W = Game.cssW, H = Game.cssH, gr = Game.gameRect;
    const portrait = H > W * 1.05;
    return portrait ? { x: gr.x, y: gr.y, w: gr.w, h: gr.h, portrait } : { x: 0, y: 0, w: W, h: H, portrait };
  },
  resize() { if (this.btns && this.state !== 'race') this.buildButtons(); if (this.paused) this.buildPause(); if (this.state === 'nogl') this.buildNoGL(); },
  env() {
    const R = this.R, tod = R.tod;
    if (!this._env) this._env = { base: { zen: kartHexRgb(tod.zen), hor: kartHexRgb(tod.hor), sunC: kartHexRgb(tod.sunCol), fogC: kartHexRgb(tod.fog) }, zen: [0, 0, 0], hor: [0, 0, 0], sunC: [0, 0, 0], fogC: [0, 0, 0], amb: [0, 0, 0] };
    const e = this._env, b = e.base, k = this.stormK || 0, dust = [0.86, 0.78, 0.64];
    for (let i = 0; i < 3; i++) {
      e.zen[i] = lerp(b.zen[i], dust[i] * 0.95, k * 0.85); e.hor[i] = lerp(b.hor[i], dust[i], k); e.fogC[i] = lerp(b.fogC[i], dust[i], k);
      e.sunC[i] = b.sunC[i] * (1 - k * 0.7); e.amb[i] = tod.amb[i] * (1 - k * 0.12);
    }
    e.fogD = tod.fogD + k * 0.05; e.glow = tod.glow; e.haze = tod.haze + k * 0.5; e.starK = 1 - k;
    return e;
  },
  // light at a world position: ambient + baked light map
  lightAt(x, z, out) {
    const R = this.R, M = this.T.map, amb = this.env().amb, d = R.lightData;
    let r = amb[0], g = amb[1], b = amb[2];
    if (d) {
      const S = R.light.width, u = Math.floor((x - M.x) / M.size * S), v = Math.floor((z - M.z) / M.size * S);
      if (u >= 0 && v >= 0 && u < S && v < S) { const o = (v * S + u) * 4; r += d[o] / 255; g += d[o + 1] / 255; b += d[o + 2] / 255; }
    }
    out[0] = Math.min(1.25, r); out[1] = Math.min(1.25, g); out[2] = Math.min(1.25, b);
    return out;
  },
  updateCamera(fdt) {
    const k = this.player, cam = this.cam, vr = this.viewRect(), asp = vr.w / vr.h;
    const vfovFor = (vdeg, hdeg) => Math.max(vdeg * Math.PI / 180, 2 * Math.atan(Math.tan(hdeg * Math.PI / 360) / asp));
    if (this.state === 'intro') {
      const T = this.T, c = T.at(T.L - 22, KART_TMP), u = clamp(this.stateT / 3.4, 0, 1), e = easeInOut(u);
      const a = Math.atan2(c.tz, c.tx) + Math.PI * (0.25 + e * 0.95);
      const r = 30 - e * 12, h = 11 - e * 6;
      cam.x = c.x + Math.cos(a) * r; cam.z = c.z + Math.sin(a) * r; cam.y = h; cam.tx = c.x; cam.ty = 1.2; cam.tz = c.z;
      cam.fov = vfovFor(48, 70); this.camYaw = k.yaw;
      return;
    }
    if (this.state !== 'race' && this.state !== 'count') {
      this.orbit = (this.orbit || 0) + fdt * 0.45;
      const a = this.camYaw + Math.PI + 0.6 + this.orbit;
      cam.x = k.x + Math.cos(a) * 7; cam.z = k.z + Math.sin(a) * 7; cam.y = 2.6 + k.y; cam.tx = k.x; cam.ty = 0.9 + k.y; cam.tz = k.z;
      cam.fov = vfovFor(46, 66);
      return;
    }
    const sp = k.speed;
    let tyaw = k.yaw;
    if (sp > 4 && k.spinT <= 0) { const vy = Math.atan2(k.vz, k.vx); tyaw = vy + kartWrapA(k.yaw - vy) * 0.45; }
    if (k.spinT > 0) tyaw = this.camYaw;
    if (this.snapCam) { this.camYaw = k.yaw; this.snapCam = false; }
    this.camYaw = kartWrapA(this.camYaw + kartWrapA(tyaw - this.camYaw) * (1 - Math.exp(-5 * fdt)));
    this.boostVis = lerp(this.boostVis || 0, k.boostT > 0 ? 1 : 0, 1 - Math.exp(-6 * fdt));
    const dist = (vr.portrait ? 5.7 : 6.2) + this.boostVis * 0.9, ht = vr.portrait ? 2.75 : 2.7;
    const cy = Math.cos(this.camYaw), sy = Math.sin(this.camYaw);
    this.camY = lerp(this.camY === undefined ? k.y : this.camY, k.y * 0.8, 1 - Math.exp(-7 * fdt));
    cam.x = k.x - cy * dist; cam.z = k.z - sy * dist; cam.y = ht + this.camY;
    const look = vr.portrait ? 10 : 8;
    cam.tx = k.x + cy * look; cam.tz = k.z + sy * look; cam.ty = (vr.portrait ? 1.75 : 1.55) + this.camY;
    if (this.shake > 0 && Save.data.settings.shake !== false) { const s = this.shake * 0.12; cam.x += (Math.random() - 0.5) * s; cam.y += (Math.random() - 0.5) * s; cam.z += (Math.random() - 0.5) * s; }
    cam.fov = vfovFor(46, vr.portrait ? 58 : 66) + this.boostVis * 0.09;
  },
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH, dpr = Game.dpr;
    if (this.state === 'nogl') return this.drawNoGL(ctx);
    if (this.state === 'load') {
      this.runJobs(this.lastDraw ? 14 : 4); this.lastDraw = 1;
      return this.drawLoading(ctx);
    }
    if (KartGL.lost) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#07040e'; ctx.fillRect(0, 0, W, H); return; }
    if (this.view.gen !== KartGL.gen) this.view.build(this.T, this.R);
    const now = performance.now(), fdt = this.lastFrame ? clamp((now - this.lastFrame) / 1000, 0, 0.1) : 1 / 60;
    this.lastFrame = now;
    this.adapt(fdt);
    this.updateCamera(fdt);
    const t0 = performance.now();
    this.render3D(ctx);
    this.cpuMs = performance.now() - t0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawOverlay(ctx);
    if (this.state === 'intro' || this.state === 'count' || this.state === 'race' || this.state === 'done') this.drawHUD(ctx);
    if (this.state === 'results') this.drawResults(ctx);
    if (this.state === 'standings') this.drawStandings(ctx);
    if (this.state === 'trophy') this.drawTrophy(ctx);
    if (this.paused) this.drawPause(ctx);
    this.engineSound();
  },
  engineSound() {
    if (!Sound.engine) return;
    const k = this.player, on = !this.paused && (this.state === 'race' || this.state === 'count' || this.state === 'intro');
    const rpm = on ? clamp(k.speed / (k.vmax * 1.3) + (k.boostT > 0 ? 0.15 : 0) + (k.drift ? 0.08 : 0), 0, 1) : 0;
    Sound.engine(on, this.state === 'race' ? rpm : 0.08);
  },
  adapt(fdt) {
    // adaptive WebGL resolution: drop when frames are slow, recover slowly
    this.slowAcc = (this.slowAcc || 0) + (fdt > 0.022 ? fdt : -fdt * 0.35);
    this.slowAcc = clamp(this.slowAcc, 0, 3);
    if (this.slowAcc > 1.4 && this.q > 0.56) { this.q = Math.max(0.55, this.q - 0.12); this.slowAcc = 0; }
    this.fastAcc = fdt < 0.0175 ? (this.fastAcc || 0) + fdt : 0;
    if (this.fastAcc > 6 && this.q < 1) { this.q = Math.min(1, this.q + 0.08); this.fastAcc = 0; }
  },
  render3D(ctx) {
    const vr = this.viewRect(), dpr = Game.dpr;
    const scale = Math.min(dpr, 2) * this.q;
    const gw = Math.max(64, Math.round(vr.w * scale)), gh = Math.max(64, Math.round(vr.h * scale));
    const c = KartGL.canvas;
    if (c.width !== gw || c.height !== gh) { c.width = gw; c.height = gh; }
    const env = this.env();
    this.view.setCamera(this.cam, gw, gh);
    this.pushScene(env);
    this.view.render(env, this.t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(c, 0, 0, gw, gh, Math.round(vr.x * dpr), Math.round(vr.y * dpr), Math.round(vr.w * dpr), Math.round(vr.h * dpr));
  },
  pushScene(env) {
    const bt = this.view.batch, cam = this.cam, B = this.view.B, R = this.R, T = this.T, t = this.t;
    const A = KartArt, L = [0, 0, 0];
    const fx = B.fx, fz = B.fz, fl = Math.hypot(fx, fz) || 1, hfx = fx / fl, hfz = fz / fl;
    const vis = (x, z, far, rad) => { const dx = x - cam.x, dz = z - cam.z, d2 = dx * dx + dz * dz; if (d2 > far * far) return -1; const along = dx * hfx + dz * hfz; if (along < -rad - 4) return -1; return Math.sqrt(d2); };
    const glowK = env.glow;
    // ---- ground decals
    const chev = { u0: 0, u1: 1, v0: 0, v1: 1 };
    for (const b of R.boosts) {
      const a = T.at(b.s, KART_TMP);
      if (vis(a.x, a.z, 260, 6) < 0) continue;
      const reg = Object.assign({}, chev); reg.v0 = -t * 1.6; reg.v1 = reg.v0 + b.len / b.w;
      const pul = 0.75 + 0.25 * Math.sin(t * 8);
      bt.ground(a.x + a.nx * b.d, 0.03, a.z + a.nz * b.d, b.w, b.len, a.tx, a.tz, reg, pul, pul, pul, 1, 2);
    }
    { const a = T.at(0, KART_TMP); if (vis(a.x, a.z, 300, 20) >= 0) { bt.ground(a.x, 0.025, a.z, a.hw * 2, 2.2, a.tx, a.tz, A.reg('checker0_0'), 1, 1, 1, 0.92); } }
    for (let slot = 0; slot < (this.mode === 'gp' ? 8 : 1); slot++) {
      const s = T.L - 9 - slot * 5.4, a = T.at(s, KART_TMP), d = this.mode === 'tt' ? 0 : (slot % 2 ? 1 : -1) * a.hw * 0.42;
      if (vis(a.x, a.z, 200, 4) < 0) continue;
      bt.ground(a.x + a.nx * d, 0.02, a.z + a.nz * d, 2.2, 3.4, a.tx, a.tz, A.reg('grid0_0'), 1, 1, 1, 0.7);
    }
    for (const dcl of R.decals) { if (vis(dcl.x, dcl.z, 260, dcl.w) < 0) continue; this.lightAt(dcl.x, dcl.z, L); bt.ground(dcl.x, 0.035, dcl.z, dcl.w, dcl.l, dcl.dx, dcl.dz, A.reg(dcl.reg), L[0], L[1], L[2], 1); }
    // ---- props
    const shadowA = R.tod.shadow;
    for (const p of R.props) {
      const far = p.kind === 'man' || p.kind === 'temple' || p.kind === 'tower' ? 900 : p.kind === 'art' || p.kind === 'dome' ? 520 : 360;
      const d = vis(p.x, p.z, far, p.w);
      if (d < 0) continue;
      let f = 0;
      if (p.anim === 'cheer' && p.frames > 1) f = (Math.sin(t * 5 + p.phase) > 0.3) ? 1 : 0;
      const reg = A.reg(p.kind + p.v + '_' + f) || A.reg(p.kind + p.v + '_0');
      if (!reg) continue;
      const fade = clamp((far - d) / 60, 0, 1);
      const emiss = p.kind === 'neon' && glowK > 0.6;
      if (emiss) { L[0] = L[1] = L[2] = 1; } else this.lightAt(p.x, p.z, L);
      const bob = p.anim === 'cheer' ? Math.abs(Math.sin(t * 5 + p.phase)) * 0.06 : 0;
      bt.bb(p.x, bob, p.z, p.w, p.h, reg, 0.5, p.ay, L[0], L[1], L[2], fade);
      if (p.glow && glowK > 0.15) {
        const g = A.reg(p.kind + p.v + '_0g');
        if (g) { const gi = glowK * (p.glowI || 1) * fade * (p.kind === 'art' ? 0.8 + 0.2 * Math.sin(t * 2 + p.phase) : 1); bt.bb(p.x, bob, p.z, p.w, p.h, g, 0.5, p.ay, gi, gi, gi, -1, 0, 0, 0.05); }
      }
      if (p.kind === 'burner' || p.kind === 'bike' || p.kind === 'potty' || p.kind === 'lamp' || p.kind === 'flag' || p.kind === 'wsign' || p.kind === 'neon' || p.kind === 'tent' || p.kind === 'rock' || p.kind === 'barrel' || p.kind === 'cone') if (d < 140) bt.ground(p.x, 0.015, p.z, p.w * 1.1, p.w * 0.7, 1, 0, A.reg('shadow0_0'), 0, 0, 0, shadowA * 0.8);
    }
    // ---- gift boxes
    for (const g of this.gifts) {
      const d = vis(g.x, g.z, 260, 2); if (d < 0) continue;
      let sc = 1;
      if (!g.alive) { if (g.t > 0.35) continue; sc = 1 - g.t / 0.35; }
      const fr = Math.floor((t * 7 + g.ph) % 6), y = 0.95 + Math.sin(t * 3 + g.ph) * 0.15;
      this.lightAt(g.x, g.z, L);
      const lk = Math.max(L[0], 0.85);
      bt.bb(g.x, y - 0.75 * sc, g.z, 1.55 * sc, 1.55 * sc, A.reg('gift' + g.col + '_' + fr), 0.5, 1, lk, lk, lk, 1);
      const hc = kartHexRgb(['#ff4fd8', '#38c8ff', '#7ad86a', '#ffb84a'][g.col]), gi = 0.45 + 0.4 * glowK;
      bt.bb(g.x, y - 0.2, g.z, 3 * sc, 3 * sc, A.reg('glowball0_0'), 0.5, 0.5, hc[0] * gi, hc[1] * gi, hc[2] * gi, -1, 0, 0, -0.05);
      bt.ground(g.x, 0.02, g.z, 1.4, 1.4, 1, 0, A.reg('shadow0_0'), 0, 0, 0, shadowA * 0.6);
    }
    // ---- world objects (items)
    for (const o of this.objs) {
      const d = vis(o.x, o.z, 260, 6); if (d < 0) continue;
      this.lightAt(o.x, o.z, L);
      if (o.type === 'puke') {
        const lk = Math.max(L[0], 0.8);
        bt.ball(o.x, o.y, o.z, 1.45, A.reg('puke0_0'), lk, lk, lk, 1, o.t * 6);
        bt.ball(o.x, o.y, o.z, 2.6, A.reg('glowball0_0'), 0.35, 0.75, 0.12, -1, 0, -0.05);
        bt.ground(o.x, 0.02, o.z, 1.3, 1.3, 1, 0, A.reg('shadow0_0'), 0, 0, 0, 0.45);
      }
      else if (o.type === 'tumble') { bt.ball(o.x, o.y, o.z, 1.8, A.reg('tumble0_0'), L[0], L[1], L[2], 1, o.rot); bt.ground(o.x, 0.02, o.z, 1.8, 1.8, 1, 0, A.reg('shadow0_0'), 0, 0, 0, 0.35); }
      else if (o.type === 'dust') { const a = clamp(Math.min(o.t * 3, (o.life - o.t) / 1.5), 0, 1) * 0.85; for (let i = 0; i < 4; i++) { const ang = i * 1.7 + o.t * 0.3; bt.ball(o.x + Math.cos(ang) * o.r * 0.35, 1.2 + i * 0.35, o.z + Math.sin(ang) * o.r * 0.35, o.r * 1.6, A.reg('dustcloud0_0'), L[0], L[1], L[2], a, ang * 0.2); } }
      else if (o.type === 'swarm') {
        bt.ball(o.x, o.y, o.z, 3.2, A.reg('puff0_0'), 0.15, 0.1, 0.14, 0.45, o.t);
        const lk = Math.max(L[0], 0.8);
        for (let i = 0; i < 14; i++) { const ang = o.t * (7 + i % 4) + i * 0.9, rr0 = 0.6 + (i % 3) * 0.45; bt.ball(o.x + Math.cos(ang) * rr0, o.y + Math.sin(ang * 1.7 + i) * 0.6, o.z + Math.sin(ang) * rr0, 0.62, A.reg('mozzie0_0'), lk, lk, lk, 1, Math.sin(ang) * 0.4); }
        bt.ball(o.x, o.y, o.z, 2.2, A.reg('glowball0_0'), 0.45, 0.05, 0.08, -1);
      }
    }
    // ---- karts
    for (const k of this.karts) {
      const d = vis(k.x, k.z, 400, 3); if (d < 0) continue;
      this.pushKart(k, L, glowK, shadowA);
    }
    // ---- particles
    const P = this.parts.p;
    for (const q of P) {
      if (q.life <= 0) continue;
      const u = 1 - q.life / q.max, size = lerp(q.s0, q.s1, u);
      const reg = A.reg(q.reg); if (!reg) continue;
      if (q.add) { const a = Math.min(1, q.life / q.max * 2); bt.ball(q.x, q.y, q.z, size, reg, q.r * a, q.g * a, q.b * a, -1, q.rot); }
      else {
        if (q.lit) this.lightAt(q.x, q.z, L); else { L[0] = L[1] = L[2] = 1; }
        const a = q.a * Math.min(1, q.life / q.max * 1.6) * Math.min(1, u * 8 + 0.2);
        bt.ball(q.x, q.y, q.z, size, reg, q.r * L[0], q.g * L[1], q.b * L[2], a, q.rot);
      }
    }
  },
  pushKart(k, L, glowK, shadowA) {
    const bt = this.view.batch, cam = this.cam, A = KartArt, t = this.t;
    const visYaw = k.yaw + (k.drift ? k.drift * 0.34 : 0) + k.spinA;
    const fx = Math.cos(visYaw), fz = Math.sin(visYaw);
    const dx = cam.x - k.x, dz = cam.z - k.z;
    const f = dx * fx + dz * fz, r = dx * -fz + dz * fx;
    const th = Math.atan2(r, -f);
    const dir = ((Math.round(th / (TAU / KART_DIRS)) % KART_DIRS) + KART_DIRS) % KART_DIRS;
    const pose = k.cheerT > 0 && KART_POSES[k.id] ? KART_POSES[k.id][0] : '';
    const hi = k.player && A.hiKart(dir, pose);
    const reg = hi || A.kart(k.id, dir, pose);
    const size = KART_CELL / KART_PXM;
    const bob = (k.air ? 0 : Math.sin(t * 26 + k.slot) * 0.018 * Math.min(1, k.speed / 8)) + 0 - (k.landT > 0 ? k.landT * 0.4 : 0);
    const roll = -k.steer * 0.05 * Math.min(1, k.speed / 10) + (k.drift ? -k.drift * 0.04 : 0);
    this.lightAt(k.x, k.z, L);
    const lift = k.player ? 0.82 : 0.7;
    let cr = Math.max(L[0], lift), cg = Math.max(L[1], lift), cb = Math.max(L[2], lift * 1.05), ca = 1;
    if (k.discoT > 0) { const h = t * 3; cr *= 0.75 + 0.35 * Math.sin(h); cg *= 0.75 + 0.35 * Math.sin(h + 2.1); cb *= 0.75 + 0.35 * Math.sin(h + 4.2); }
    if (k.immuneT > 0 && k.spinT <= 0 && Math.floor(t * 16) % 2) ca = 0.55;
    const y = k.y + bob;
    bt.bb(k.x, y, k.z, size, size, reg, 0.5, 0.7, cr, cg, cb, ca, hi ? 1 : 0, roll);
    const g = A.kartGlow(k.id, dir, pose);
    if (g && glowK > 0.1) { const gi = glowK * (k.player ? 0.6 : 0.9); bt.bb(k.x, y, k.z, size, size, g, 0.5, 0.7, gi, gi, gi, -1, 0, roll, 0.02); }
    // shadow
    const sh = shadowA * 1.2 * clamp(1 - k.y / 6, 0.2, 1);
    bt.ground(k.x, 0.02, k.z, 1.9, 2.7, Math.cos(k.yaw), Math.sin(k.yaw), A.reg('shadow0_0'), 0, 0, 0, sh);
    // boost flame + drift charge flares
    const bx = Math.cos(k.yaw), bz = Math.sin(k.yaw);
    if (k.boostT > 0) {
      const c = k.boostKind === 'mt2' ? [1, 0.4, 0.95] : k.boostKind === 'glow' ? [0.35, 1, 0.9] : k.boostKind === 'water' ? [0.45, 0.8, 1] : [1, 0.75, 0.35];
      const fl = 0.75 + Math.random() * 0.4;
      bt.bb(k.x - bx * 1.15, y + 0.2, k.z - bz * 1.15, 0.7 * fl, 1.0 * fl, A.reg('flame0_0'), 0.5, 0.75, c[0], c[1], c[2], -1, 0, 0, 0.1);
      bt.ball(k.x - bx * 1.1, y + 0.4, k.z - bz * 1.1, 1.2 * fl, A.reg('glowball0_0'), c[0] * 0.6, c[1] * 0.6, c[2] * 0.6, -1);
    }
    if (k.drift && k.charge > 0.3) {
      const tier = k.charge >= 2.1 ? 2 : k.charge >= 1.0 ? 1 : 0;
      const c = tier === 2 ? [1, 0.3, 0.9] : tier === 1 ? [1, 0.82, 0.25] : [0.8, 0.8, 0.8];
      const s = (tier ? 0.9 : 0.5) * (0.85 + 0.3 * Math.sin(t * 40));
      for (const sd of [-1, 1]) bt.ball(k.x - bx * 0.85 - bz * sd * 0.64, 0.25, k.z - bz * 0.85 + bx * sd * 0.64, s, A.reg('glowball0_0'), c[0], c[1], c[2], -1);
    }
    if (k.bufoT > 0) {
      const h = t * 5;
      bt.ball(k.x, y + 0.8, k.z, 3.0, A.reg('glowball0_0'), 0.22 + 0.18 * Math.sin(h), 0.4 + 0.2 * Math.sin(h + 2), 0.2 + 0.18 * Math.sin(h + 4), -1);
      for (let i = 0; i < 6; i++) { const a = t * 3 + i * TAU / 6; bt.ball(k.x + Math.cos(a) * 1.5, y + 0.4 + Math.sin(t * 6 + i) * 0.3, k.z + Math.sin(a) * 1.5, 0.45, A.reg('sparkle0_0'), 0.35, 0.8, 0.3, -1, a); }
    }
    if (k.discoT > 0) {
      const fade = Math.min(1, k.discoT * 2);
      for (let i = 0; i < 10; i++) {
        const a = t * 2.4 + i * TAU / 10, hh = (i / 10 + t * 0.5) % 1;
        const cr2 = 0.55 + 0.45 * Math.sin(hh * TAU), cg2 = 0.55 + 0.45 * Math.sin(hh * TAU + 2.1), cb2 = 0.55 + 0.45 * Math.sin(hh * TAU + 4.2);
        bt.ball(k.x + Math.cos(a) * 1.7, y + 0.7 + Math.sin(a * 2) * 0.5, k.z + Math.sin(a) * 1.7, 0.7, A.reg('sparkle0_0'), cr2 * fade, cg2 * fade, cb2 * fade, -1, a * 2);
      }
      bt.ball(k.x, y + 2.25, k.z, 0.9, A.reg('discoball0_0'), 1, 1, 1, fade, t * 2);
      bt.ball(k.x, y + 0.9, k.z, 3.6, A.reg('glowball0_0'), 0.45 * fade, 0.3 * fade, 0.55 * fade, -1);
    }
  },
  drawOverlay(ctx) {
    const vr = this.viewRect();
    ctx.save(); ctx.beginPath(); ctx.rect(vr.x, vr.y, vr.w, vr.h); ctx.clip();
    // dust whiteout + storm haze
    const sk = this.stormK || 0, wh = Math.min(1, this.white);
    if (wh > 0.01 || sk > 0.01) {
      const a = Math.max(wh * 0.88, sk * 0.42);
      const g = ctx.createRadialGradient(vr.x + vr.w / 2, vr.y + vr.h / 2, vr.h * 0.1, vr.x + vr.w / 2, vr.y + vr.h / 2, vr.w * 0.7);
      g.addColorStop(0, `rgba(240,228,204,${a * 0.75})`); g.addColorStop(1, `rgba(226,206,168,${Math.min(1, a * 1.15)})`);
      ctx.fillStyle = g; ctx.fillRect(vr.x, vr.y, vr.w, vr.h);
      if (sk > 0.2) { ctx.strokeStyle = `rgba(255,245,225,${sk * 0.35})`; ctx.lineWidth = 1.5; for (let i = 0; i < 40; i++) { const x = ((i * 97 + this.t * 900) % (vr.w + 200)) - 100 + vr.x, y = vr.y + ((i * 53) % vr.h); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 60, y + 6); ctx.stroke(); } }
    }
    // boost speed lines
    if ((this.boostVis || 0) > 0.05 && this.state === 'race') {
      const cx = vr.x + vr.w / 2, cy = vr.y + vr.h * 0.48, a = this.boostVis * (vr.portrait ? 0.25 : 0.35);
      ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 1.6;
      for (let i = 0; i < (vr.portrait ? 16 : 24); i++) { const ang = i / 26 * TAU + (this.t * 0.7 % 1) * 0.2, r0 = vr.w * (0.36 + ((i * 37 + Math.floor(this.t * 30)) % 10) / 40), r1 = r0 + vr.w * 0.12; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0 * 0.6); ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1 * 0.6); ctx.stroke(); }
    }
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.25})`; ctx.fillRect(vr.x, vr.y, vr.w, vr.h); }
    // vignette
    const vg = ctx.createRadialGradient(vr.x + vr.w / 2, vr.y + vr.h * 0.55, Math.min(vr.w, vr.h) * 0.45, vr.x + vr.w / 2, vr.y + vr.h * 0.55, Math.max(vr.w, vr.h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.32)');
    ctx.fillStyle = vg; ctx.fillRect(vr.x, vr.y, vr.w, vr.h);
    ctx.restore();
    if (vr.portrait) this.drawPad(ctx, vr);
  },
  drawPad(ctx, vr) {
    const W = Game.cssW, H = Game.cssH, y = vr.y + vr.h;
    const g = ctx.createLinearGradient(0, y, 0, H); g.addColorStop(0, '#1a1030'); g.addColorStop(1, '#07040e');
    ctx.fillStyle = g; ctx.fillRect(0, y, W, H - y);
    ctx.fillStyle = 'rgba(255,79,216,0.55)'; ctx.fillRect(0, y, W, 2);
    if (vr.y > 0) { ctx.fillStyle = '#07040e'; ctx.fillRect(0, 0, W, vr.y); }
  }
});

/* ---------------- race scene: HUD and screens ---------------- */
function kartText(ctx, txt, x, y, size, col, o) {
  o = o || {};
  ctx.font = `${size}px ${o.ui ? FONT_UI : FONT_DISPLAY}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = size * 0.5; }
  if (o.stroke !== false) { ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, size * 0.16); ctx.strokeStyle = o.stroke || 'rgba(12,6,22,0.85)'; ctx.strokeText(txt, x, y); }
  ctx.fillStyle = col; ctx.fillText(txt, x, y);
  ctx.shadowBlur = 0;
}
// position badge pre-rendered once per rank (text glow is too costly to redraw every frame)
function kartRankBadge(rank, col, n) {
  const C = kartRankBadge.cache || (kartRankBadge.cache = {}), key = rank + col + n + '@' + Game.dpr;
  if (C[key]) return C[key];
  const d = Math.max(1, Game.dpr), c = makeCanvas(110 * d, 80 * d), x = c.getContext('2d');
  x.scale(d, d); x.translate(34, 36);
  kartText(x, String(rank), 0, 2, 46, col, { glow: rgba(col, 0.6) });
  kartText(x, rank === 1 ? 'ST' : rank === 2 ? 'ND' : rank === 3 ? 'RD' : 'TH', 30, -8, 15, col, {});
  kartText(x, '/' + n, 30, 16, 12, 'rgba(255,255,255,0.7)', { align: 'left' });
  return (C[key] = c);
}
function kartPill(ctx, x, y, w, h, a) {
  ctx.fillStyle = `rgba(12,8,24,${a === undefined ? 0.55 : a})`; rr(ctx, x, y, w, h, Math.min(h / 2, 14)); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; ctx.stroke();
}
Object.assign(KartRaceScene.prototype, {
  hudBox() {
    const vr = this.viewRect();
    return { x: vr.x + Math.max(12, insets.l + 6), y: vr.y + Math.max(8, vr.portrait ? 8 : insets.t + 6), r: vr.x + vr.w - Math.max(12, insets.r + 6), b: vr.y + vr.h - 8, vr };
  },
  drawHUD(ctx) {
    const k = this.player, B = this.hudBox(), vr = B.vr, W = Game.cssW, H = Game.cssH, t = this.t;
    ctx.save();
    const racing = this.state === 'race' || this.state === 'done';
    // position badge
    if (racing || this.state === 'count') {
      const rank = this.mode === 'gp' ? k.rank : 1;
      const col = rank === 1 ? '#ffd84a' : rank === 2 ? '#dfe6f2' : rank === 3 ? '#ffa65a' : '#ff6ae0';
      const pop = this.lastRank !== rank ? 1 : 0; if (pop) { this.rankPop = 0.35; this.lastRank = rank; }
      const s = 1 + Math.max(0, this.rankPop || 0) * 0.8; if (this.rankPop > 0) this.rankPop -= 1 / 60;
      if (this.mode === 'gp') {
        ctx.save(); ctx.translate(B.x + 30, B.y + 30); ctx.scale(s, s);
        ctx.drawImage(kartRankBadge(rank, col, this.karts.length), -34, -36, 110, 80);
        ctx.restore();
      }
      const lap = clamp(Math.max(1, k.lap), 1, KART_LAPS);
      const ly = this.mode === 'gp' ? B.y + 66 : B.y + 12;
      kartPill(ctx, B.x, ly, 92, 26);
      kartText(ctx, 'LAP', B.x + 22, ly + 13.5, 12, 'rgba(255,255,255,0.75)', { stroke: false });
      kartText(ctx, lap + '/' + KART_LAPS, B.x + 62, ly + 13.5, 17, k.lap >= KART_LAPS ? '#ff6ae0' : '#ffffff', { stroke: false });
    }
    // timer
    const tm = this.state === 'race' || this.state === 'done' ? (k.finished ? k.finishT : this.raceT) : 0;
    kartPill(ctx, W / 2 - 64, B.y, 128, 30);
    kartText(ctx, kartFmtTime(tm).replace('--:--.--', '0:00.00'), W / 2, B.y + 15.5, 17, '#ffffff', { stroke: false });
    if (this.lastLap && this.lastLap.show > 0) {
      this.lastLap.show -= 1 / 60;
      const best = Math.min(...k.lapTimes) === this.lastLap.t && k.lapTimes.length > 1;
      kartText(ctx, 'LAP ' + kartFmtTime(this.lastLap.t), W / 2, B.y + 44, 12, best ? '#7aff8a' : '#ffd84a', {});
    }
    if (this.mode === 'tt') {
      const best = kartSave().best[this.trackId];
      if (best && best.total) kartText(ctx, 'BEST ' + kartFmtTime(best.total), W / 2, B.y + (this.lastLap && this.lastLap.show > 0 ? 60 : 44), 11, 'rgba(255,255,255,0.7)', { ui: true });
    }
    if (this.mode === 'gp') this.drawItemSlot(ctx, B);
    // minimap + speed
    if (vr.portrait) {
      const padTop = vr.y + vr.h, L = Input.layout;
      const room = L ? Math.min(L.stickHome.y - L.stickHome.r, L.action.y - L.action.r - 22) - padTop - 16 : 100;
      const mapS = clamp(room, 60, 110), mx = L && L.lefty ? W - mapS - 16 : 16;
      this.drawMinimap(ctx, mx, padTop + 10, mapS);
      const sx = L && L.lefty ? 24 : mx + mapS + 22, sw = W - mapS - 62;
      this.drawSpeed(ctx, sx, padTop + 30, Math.min(220, sw));
    } else {
      const mapS = clamp(H * 0.3, 90, 130);
      this.drawMinimap(ctx, B.x, B.y + (this.mode === 'gp' ? 100 : 48), mapS);
      this.drawSpeed(ctx, W / 2 - 80, H - Math.max(16, insets.b + 10), 160);
    }
    // countdown
    if (this.state === 'count') {
      const n = 3 - Math.floor(this.stateT), u = this.stateT % 1;
      if (n >= 1) {
        const s = 1 + (1 - easeOut(Math.min(1, u * 2.5))) * 0.8;
        ctx.save(); ctx.translate(vr.x + vr.w / 2, vr.y + vr.h * 0.38); ctx.scale(s, s); ctx.globalAlpha = 1 - Math.max(0, u - 0.75) * 4;
        kartText(ctx, String(n), 0, 0, Math.min(110, vr.h * 0.3), ['#ff4a6a', '#ffd84a', '#7aff8a'][3 - n], { glow: '#ffffff' });
        ctx.restore();
      }
      if (this.stateT < 2.3) kartText(ctx, 'Tap DRIFT just before GO for a launch boost', vr.x + vr.w / 2, vr.y + vr.h * 0.38 + Math.min(70, vr.h * 0.2), 12, 'rgba(255,255,255,0.85)', { ui: true });
    }
    if (this.state === 'intro') {
      const a = clamp(Math.min(this.stateT * 2, 3.4 - this.stateT), 0, 1);
      ctx.globalAlpha = a;
      const cy = vr.y + vr.h * 0.7;
      ctx.fillStyle = 'rgba(8,4,18,0.55)'; ctx.fillRect(vr.x, cy - 44, vr.w, 88);
      const sub = this.mode === 'gp' ? this.cup.name.toUpperCase() + '  ·  RACE ' + (this.raceIdx + 1) + '/4' : 'TIME TRIAL';
      kartText(ctx, sub, vr.x + vr.w / 2, cy - 22, 13, KART_CUPS.find(c => c.id === this.R.def.cup).col, { stroke: false });
      kartText(ctx, this.R.def.name.toUpperCase(), vr.x + vr.w / 2 + (1 - a) * 40, cy + 6, Math.min(34, vr.w * 0.075), '#ffffff', { glow: '#ff4fd8' });
      kartText(ctx, this.R.def.blurb + '  ·  ' + this.R.tod.label, vr.x + vr.w / 2, cy + 32, 12, 'rgba(255,255,255,0.8)', { ui: true, stroke: false });
      ctx.globalAlpha = 1;
    }
    // banners
    let by = vr.y + vr.h * 0.24;
    for (const m of this.msgs) {
      const u = 1 - m.t / m.max, s = 1 + Math.max(0, 0.25 - u) * 2.5, a = Math.min(1, m.t * 3);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(vr.x + vr.w / 2, by); ctx.scale(s, s);
      kartText(ctx, m.text, 0, 0, Math.min(40, vr.w * 0.075), m.col, { stroke: rgba(shade(m.col, -0.6), 0.9) });
      ctx.restore(); by += 46;
    }
    if (k.wrongT > 1 && this.state === 'race' && Math.floor(t * 3) % 2) kartText(ctx, 'WRONG WAY!', vr.x + vr.w / 2, vr.y + vr.h * 0.5, 30, '#ff4a4a', { glow: '#ff0000' });
    if (this.state === 'done') {
      const p = k.rank;
      kartText(ctx, this.mode === 'gp' ? kartOrdinal(p) + ' PLACE' : kartFmtTime(k.finishT), vr.x + vr.w / 2, vr.y + vr.h * 0.24 + 52, 22, '#ffffff', {});
      if (this.stateT > 1.5) kartText(ctx, 'tap to continue', vr.x + vr.w / 2, vr.y + vr.h - 24, 12, 'rgba(255,255,255,0.75)', { ui: true, stroke: false });
    }
    // controls
    if (this.state !== 'done' && !this.paused) {
      ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
      Input.drawControls(ctx, 1);
      this.drawControlLabels(ctx);
    }
    // pause button
    if (Input.layout) {
      const pb = Input.layout.pause;
      ctx.fillStyle = 'rgba(10,8,18,0.55)'; ctx.beginPath(); ctx.arc(pb.x, pb.y, 17, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(pb.x - 5, pb.y - 6, 3.5, 12); ctx.fillRect(pb.x + 1.5, pb.y - 6, 3.5, 12);
    }
    ctx.restore();
  },
  drawControlLabels(ctx) {
    const L = Input.layout; if (!L || (!Input.usingTouch && !Game.forceTouchUI)) return;
    const early = this.state === 'count' || this.state === 'intro' || (this.state === 'race' && this.raceT < 7);
    const tag = (x, y, txt, big) => {
      ctx.font = `${big ? 12 : 10}px ${FONT_DISPLAY}`;
      const w = ctx.measureText(txt).width + (big ? 18 : 12), h = big ? 22 : 17;
      ctx.fillStyle = big ? 'rgba(10,8,18,0.78)' : 'rgba(10,8,18,0.5)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
      if (big) { ctx.strokeStyle = 'rgba(255,216,74,0.75)'; ctx.lineWidth = 1.2; ctx.stroke(); }
      ctx.fillStyle = big ? '#ffd84a' : 'rgba(255,255,255,0.85)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 0.5);
    };
    const bob = early ? Math.sin(this.t * 4) * 2 : 0;
    const st = Input.stick.active ? { x: Input.stick.ox, y: Input.stick.oy } : L.stickHome;
    tag(st.x, st.y + L.stickHome.r + 14 + bob, early ? '◀ STEER ▶' : 'STEER', early);
    tag(L.jump.x, L.jump.y - L.jump.r - 13 + bob, early ? 'HOLD: DRIFT' : 'DRIFT', early);
    if (this.mode === 'gp') tag(L.action.x, L.action.y - L.action.r - 13 + bob, 'ITEM', early);
  },
  drawItemSlot(ctx, B) {
    const k = this.player, L = Input.layout;
    const size = 58, x = (L && !L.lefty ? Math.min(B.r, L.pause.x - 30) : B.r) - size, y = B.y;
    ctx.save();
    const g = ctx.createLinearGradient(x, y, x, y + size); g.addColorStop(0, 'rgba(46,30,80,0.85)'); g.addColorStop(1, 'rgba(16,10,30,0.85)');
    ctx.fillStyle = g; rr(ctx, x, y, size, size, 14); ctx.fill();
    ctx.strokeStyle = k.item ? KART_ITEMS[k.item].col : 'rgba(255,255,255,0.35)'; ctx.lineWidth = k.item ? 2.5 : 1.5; ctx.stroke();
    ctx.save(); rr(ctx, x + 3, y + 3, size - 6, size - 6, 11); ctx.clip();
    if (k.roul > 0) {
      // slot-machine reel: icons scroll fast, then decelerate onto the prize
      const total = k.player ? 1.7 : 1, u = 1 - k.roul / total, ease = 1 - Math.pow(1 - u, 3);
      const pos = ease * 14, idx0 = Math.floor(pos), fr = pos - idx0;
      const ids = KART_ITEM_IDS, prizeAt = 14;
      for (let j = -1; j <= 1; j++) {
        const n = idx0 + j, id = n >= prizeAt ? k.roulItem : ids[(n * 5 + 3) % ids.length];
        const yy = y + size / 2 + (j - fr) * size * 0.9;
        ctx.globalAlpha = 1 - Math.abs(j - fr) * 0.55;
        KartArt.icon(ctx, id, x + size / 2, yy, size * 0.78);
      }
      ctx.globalAlpha = 1;
      const sh = ctx.createLinearGradient(0, y, 0, y + size); sh.addColorStop(0, 'rgba(10,6,20,0.85)'); sh.addColorStop(0.3, 'rgba(10,6,20,0)'); sh.addColorStop(0.7, 'rgba(10,6,20,0)'); sh.addColorStop(1, 'rgba(10,6,20,0.85)');
      ctx.fillStyle = sh; ctx.fillRect(x, y, size, size);
    } else if (k.item) {
      const p = Math.max(0, this.itemPop || 0); if (this.itemPop > 0) this.itemPop -= 1 / 60;
      KartArt.icon(ctx, k.item, x + size / 2, y + size / 2 + Math.sin(this.t * 4) * 1.5, size * 0.8 * (1 + p * 0.8));
    }
    ctx.restore();
    if (k.item && (this.itemPop || 0) > 0) { ctx.strokeStyle = `rgba(255,255,255,${this.itemPop * 2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size * (0.5 + (0.4 - this.itemPop) * 1.2), 0, TAU); ctx.stroke(); }
    if (k.item) kartText(ctx, KART_ITEMS[k.item].name, x + size / 2, y + size + 10, 9, '#ffffff', {});
    ctx.restore();
  },
  drawMinimap(ctx, x, y, S) {
    const T = this.T;
    if (!this.mini || this.mini.S !== S) {
      const c = makeCanvas(S * 2, S * 2), m = c.getContext('2d'), sc = S * 2 / (Math.max(T.bounds.x1 - T.bounds.x0, T.bounds.z1 - T.bounds.z0) * 1.15);
      const ox = S - (T.bounds.x0 + T.bounds.x1) / 2 * sc, oz = S - (T.bounds.z0 + T.bounds.z1) / 2 * sc;
      m.lineJoin = 'round'; m.lineCap = 'round';
      const path = () => { m.beginPath(); for (let i = 0; i <= T.N; i += 3) { const j = i % T.N; i ? m.lineTo(ox + T.X[j] * sc, oz + T.Z[j] * sc) : m.moveTo(ox + T.X[j] * sc, oz + T.Z[j] * sc); } m.closePath(); };
      path(); m.strokeStyle = 'rgba(10,6,20,0.75)'; m.lineWidth = 14; m.stroke();
      path(); m.strokeStyle = 'rgba(255,255,255,0.9)'; m.lineWidth = 7; m.stroke();
      path(); m.strokeStyle = rgba(this.R.edge[0], 0.6); m.lineWidth = 3; m.stroke();
      const a = T.at(0, {}); m.strokeStyle = '#111'; m.lineWidth = 5; m.beginPath(); m.moveTo(ox + (a.x - a.nx * 14) * sc, oz + (a.z - a.nz * 14) * sc); m.lineTo(ox + (a.x + a.nx * 14) * sc, oz + (a.z + a.nz * 14) * sc); m.stroke();
      this.mini = { S, c, sc: sc / 2, ox: ox / 2, oz: oz / 2 };
    }
    const M = this.mini;
    ctx.save(); ctx.globalAlpha = 0.92; ctx.drawImage(M.c, x, y, S, S); ctx.globalAlpha = 1;
    for (const o of this.objs) if (o.type !== 'dust') { ctx.fillStyle = o.type === 'puke' ? '#7aff4a' : o.type === 'swarm' ? '#ff4a5a' : '#c8995a'; ctx.beginPath(); ctx.arc(x + M.ox + o.x * M.sc, y + M.oz + o.z * M.sc, 2, 0, TAU); ctx.fill(); }
    const ks = this.karts.slice().sort((a, b) => (a.player ? 1 : 0) - (b.player ? 1 : 0));
    for (const k of ks) {
      const px = x + M.ox + k.x * M.sc, py = y + M.oz + k.z * M.sc, r = k.player ? 5.5 : 4;
      ctx.fillStyle = k.racer.color; ctx.strokeStyle = k.player ? '#ffffff' : 'rgba(10,6,20,0.9)'; ctx.lineWidth = k.player ? 2 : 1.4;
      ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); ctx.stroke();
      if (k.player) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(px + Math.cos(k.yaw) * 9, py + Math.sin(k.yaw) * 9); ctx.lineTo(px + Math.cos(k.yaw + 2.5) * 5, py + Math.sin(k.yaw + 2.5) * 5); ctx.lineTo(px + Math.cos(k.yaw - 2.5) * 5, py + Math.sin(k.yaw - 2.5) * 5); ctx.fill(); }
    }
    ctx.restore();
  },
  drawSpeed(ctx, x, y, w) {
    const k = this.player, v = clamp(k.speed / (k.vmax * 1.34), 0, 1);
    this.spdVis = lerp(this.spdVis || 0, v, 0.2);
    const h = 8, n = 16;
    ctx.save();
    kartPill(ctx, x - 6, y - h - 6, w + 12, h + 12, 0.5);
    for (let i = 0; i < n; i++) {
      const on = (i + 0.5) / n <= this.spdVis, bx = x + i * w / n;
      const col = k.boostT > 0 ? ['#ff4fd8', '#ffd84a', '#38f2ff'][Math.floor(this.t * 12 + i) % 3] : i < n * 0.6 ? '#38f2ff' : i < n * 0.85 ? '#ffd84a' : '#ff4fd8';
      ctx.fillStyle = on ? col : 'rgba(255,255,255,0.12)';
      rr(ctx, bx + 1, y - h - (on ? i * 0.25 : 0), w / n - 2, h + (on ? i * 0.25 : 0), 2); ctx.fill();
    }
    if (k.drift && k.charge > 0.3) {
      const tier = k.charge >= 2.1 ? 2 : k.charge >= 1.0 ? 1 : 0;
      kartText(ctx, tier === 2 ? 'TURBO MAX' : tier === 1 ? 'TURBO' : 'DRIFT', x + w / 2, y - h - 18, 11, tier === 2 ? '#ff4fd8' : tier === 1 ? '#ffd84a' : '#ffffff', {});
    }
    ctx.restore();
  },
  drawLoading(ctx) {
    const W = Game.cssW, H = Game.cssH, dpr = Game.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    kartMenuBackdrop(ctx, W, H, performance.now() / 1000);
    const done = this.jobsTotal - this.jobs.length, u = done / Math.max(1, this.jobsTotal);
    const def = KART_TRACKS[this.trackId];
    kartText(ctx, def.name.toUpperCase(), W / 2, H * 0.42, Math.min(34, W * 0.07), '#ffffff', { glow: '#ff4fd8' });
    kartText(ctx, this.loadMsg + '...', W / 2, H * 0.42 + 34, 13, 'rgba(255,255,255,0.8)', { ui: true, stroke: false });
    const bw = Math.min(320, W * 0.6), bx = (W - bw) / 2, by = H * 0.42 + 56;
    kartPill(ctx, bx, by, bw, 14, 0.6);
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, '#ff4fd8'); g.addColorStop(1, '#ffd84a');
    ctx.fillStyle = g; rr(ctx, bx + 2, by + 2, Math.max(10, (bw - 4) * u), 10, 5); ctx.fill();
  },
  buildNoGL() {
    const W = Game.cssW, H = Game.cssH, bw = Math.min(220, W * 0.6);
    this.btns = [{ x: (W - bw) / 2, y: H * 0.62, w: bw, h: 48, label: '◀ BACK', primary: true, fn: () => { Sound.play('back'); Game.setScene(new KartMenuScene()); } }];
    this.btns.focus = 0;
  },
  drawNoGL(ctx) {
    const W = Game.cssW, H = Game.cssH, dpr = Game.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    kartMenuBackdrop(ctx, W, H, performance.now() / 1000);
    ctx.fillStyle = 'rgba(6,4,14,0.55)'; ctx.fillRect(0, 0, W, H);
    kartText(ctx, 'ENGINE TROUBLE', W / 2, H * 0.36, Math.min(32, W * 0.07), '#ffd84a', {});
    kartText(ctx, this.noglMsg || 'Art Car Kart needs WebGL, which this browser has turned off.', W / 2, H * 0.36 + 36, 13, '#ffffff', { ui: true, stroke: false });
    kartText(ctx, 'Try updating Safari, or turn off Low Power Mode.', W / 2, H * 0.36 + 56, 12, 'rgba(255,255,255,0.75)', { ui: true, stroke: false });
    UI.drawButtons(ctx, this.btns);
  },
  buildButtons() {
    const W = Game.cssW, H = Game.cssH, bw = Math.min(170, W * 0.36), bh = 46;
    const by = H - Math.max(16, insets.b + 10) - bh, gap = 12;
    const btn = (label, fn, primary) => ({ label, fn, primary, w: bw, h: bh, y: by });
    let list = [];
    if (this.state === 'results') {
      if (this.mode === 'gp') list = [btn('QUIT', () => this.leave()), btn(this.raceIdx >= 3 ? 'STANDINGS ▶' : 'STANDINGS ▶', () => { Sound.play('select'); this.state = 'standings'; this.stateT = 0; this.buildButtons(); }, true)];
      else list = [btn('MENU', () => this.leave()), btn('RETRY', () => { Sound.play('select'); this.restart(); }, true)];
    } else if (this.state === 'standings') {
      list = [btn('QUIT', () => this.leave()), this.raceIdx >= 3 ? btn('TROPHY ▶', () => { Sound.play('select'); this.awardTrophy(); }, true) : btn('NEXT RACE ▶', () => this.nextRace(), true)];
    } else if (this.state === 'trophy') list = [btn('MENU', () => this.leave(), true)];
    const tot = list.length * bw + (list.length - 1) * gap;
    list.forEach((b, i) => { b.x = (W - tot) / 2 + i * (bw + gap); });
    list.focus = list.length - 1;
    this.btns = list;
  },
  panelRect() {
    const W = Game.cssW, H = Game.cssH;
    const pw = Math.min(560, W - 24), top = Math.max(10, insets.t + 6), bottom = H - Math.max(16, insets.b + 10) - 58;
    return { x: (W - pw) / 2, y: top, w: pw, h: bottom - top };
  },
  drawResults(ctx) {
    const P = this.panelRect(), a = clamp(this.stateT * 4, 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(6,4,14,0.45)'; ctx.fillRect(0, 0, Game.cssW, Game.cssH);
    UI.panel(ctx, P.x, P.y, P.w, P.h);
    const title = this.mode === 'gp' ? 'RACE ' + (this.raceIdx + 1) + '/4  ·  ' + this.R.def.name.toUpperCase() : 'TIME TRIAL  ·  ' + this.R.def.name.toUpperCase();
    kartText(ctx, title, P.x + P.w / 2, P.y + 22, 14, '#ffd84a', { stroke: false });
    if (this.mode === 'tt') {
      const me = this.player, best = kartSave().best[this.trackId] || {};
      const cy = P.y + P.h * 0.42;
      kartText(ctx, kartFmtTime(me.finishT), P.x + P.w / 2, cy, Math.min(54, P.w * 0.12), '#ffffff', { glow: '#ff4fd8' });
      if (this.newRecord.total) kartText(ctx, 'NEW RECORD!', P.x + P.w / 2, cy - 44, 18, '#7aff8a', { glow: '#7aff8a' });
      const ks2 = Math.min(P.h * 0.32, 130), reg = KartArt.atlas && KartArt.kart(this.racerId, Math.floor(this.t * 4) % KART_DIRS);
      if (reg && P.y + P.h - (cy + 78) > ks2 * 0.6) ctx.drawImage(KartArt.atlas.c, reg.x, reg.y, reg.w, reg.h, P.x + P.w / 2 - ks2 / 2, cy + 78, ks2, ks2);
      const laps = me.lapTimes.map((t, i) => 'LAP ' + (i + 1) + '  ' + kartFmtTime(t)).join('     ');
      kartText(ctx, laps, P.x + P.w / 2, cy + 44, 12, 'rgba(255,255,255,0.85)', { ui: true, stroke: false });
      kartText(ctx, 'BEST TOTAL ' + kartFmtTime(best.total) + '   ·   BEST LAP ' + kartFmtTime(best.lap) + (this.newRecord.lap ? '  (NEW!)' : ''), P.x + P.w / 2, cy + 68, 12, '#ffd84a', { ui: true, stroke: false });
      ctx.restore(); UI.drawButtons(ctx, this.btns); return;
    }
    const rows = this.results, top = P.y + 42, rh = Math.min(30, (P.h - 52) / rows.length);
    rows.forEach((r, i) => {
      const y = top + i * rh, slide = clamp(this.stateT * 6 - i * 0.35, 0, 1);
      ctx.save(); ctx.globalAlpha = a * slide; ctx.translate((1 - slide) * 40, 0);
      if (r.player) { ctx.fillStyle = 'rgba(255,79,216,0.28)'; rr(ctx, P.x + 10, y, P.w - 20, rh - 3, 8); ctx.fill(); }
      const col = i === 0 ? '#ffd84a' : i === 1 ? '#dfe6f2' : i === 2 ? '#ffa65a' : '#ffffff';
      kartText(ctx, String(i + 1), P.x + 30, y + rh / 2, Math.min(18, rh * 0.62), col, {});
      KartArt.face(ctx, r.id, P.x + 60, y + rh / 2, rh * 0.95);
      kartText(ctx, r.name, P.x + 84, y + rh / 2, Math.min(15, rh * 0.52), '#ffffff', { align: 'left', ui: true, stroke: false });
      kartText(ctx, (r.est ? '~' : '') + kartFmtTime(r.t), P.x + P.w * 0.66, y + rh / 2, Math.min(14, rh * 0.5), 'rgba(255,255,255,0.85)', { ui: true, stroke: false });
      kartText(ctx, '+' + r.pts, P.x + P.w - 36, y + rh / 2, Math.min(16, rh * 0.56), '#7aff8a', {});
      ctx.restore();
    });
    ctx.restore();
    UI.drawButtons(ctx, this.btns);
  },
  drawStandings(ctx) {
    const P = this.panelRect(), a = clamp(this.stateT * 4, 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(6,4,14,0.5)'; ctx.fillRect(0, 0, Game.cssW, Game.cssH);
    UI.panel(ctx, P.x, P.y, P.w, P.h);
    kartText(ctx, this.cup.name.toUpperCase() + ' STANDINGS  ·  AFTER RACE ' + (this.raceIdx + 1) + '/4', P.x + P.w / 2, P.y + 22, 14, '#ffd84a', { stroke: false });
    const st = this.standings(), top = P.y + 42, rh = Math.min(30, (P.h - 52) / st.length), max = Math.max(1, st[0].pts);
    st.forEach((r, i) => {
      const y = top + i * rh;
      if (r.player) { ctx.fillStyle = 'rgba(255,79,216,0.28)'; rr(ctx, P.x + 10, y, P.w - 20, rh - 3, 8); ctx.fill(); }
      kartText(ctx, String(i + 1), P.x + 30, y + rh / 2, Math.min(18, rh * 0.62), i === 0 ? '#ffd84a' : '#ffffff', {});
      KartArt.face(ctx, r.id, P.x + 60, y + rh / 2, rh * 0.95);
      kartText(ctx, r.name, P.x + 84, y + rh / 2, Math.min(15, rh * 0.52), '#ffffff', { align: 'left', ui: true, stroke: false });
      const bx = P.x + P.w * 0.48, bw = P.w * 0.36, grow = clamp(this.stateT * 1.5, 0, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; rr(ctx, bx, y + rh * 0.3, bw, rh * 0.4, 4); ctx.fill();
      ctx.fillStyle = kartRacer(r.id).color; rr(ctx, bx, y + rh * 0.3, Math.max(4, bw * r.pts / max * grow), rh * 0.4, 4); ctx.fill();
      kartText(ctx, String(Math.round(r.pts * grow)), P.x + P.w - 30, y + rh / 2, Math.min(16, rh * 0.56), '#ffffff', {});
    });
    ctx.restore();
    UI.drawButtons(ctx, this.btns);
  },
  drawTrophy(ctx) {
    const W = Game.cssW, H = Game.cssH, t = this.stateT, pos = this.trophyPos;
    ctx.save();
    ctx.fillStyle = 'rgba(6,4,14,0.62)'; ctx.fillRect(0, 0, W, H);
    const st = this.standings(), cx = W / 2, base = H * 0.78 - Math.max(0, insets.b);
    kartText(ctx, this.cup.name.toUpperCase(), cx, Math.max(28, insets.t + 24), 15, KART_CUPS.find(c => c.id === this.cup.id).col, { stroke: false });
    const head = pos <= 3 ? ['GOLD!', 'SILVER!', 'BRONZE!'][pos - 1] : kartOrdinal(pos) + ' OVERALL';
    kartText(ctx, head, cx, Math.max(58, insets.t + 54), Math.min(40, W * 0.08), pos === 1 ? '#ffd84a' : pos === 2 ? '#e8eef8' : pos === 3 ? '#ffa65a' : '#ffffff', { glow: '#ff4fd8' });
    // podium
    const pw = Math.min(110, W * 0.22), heights = [86, 62, 44], xs = [cx, cx - pw * 1.05, cx + pw * 1.05];
    for (let i = 0; i < 3; i++) {
      const h = heights[i] * clamp(t * 2 - i * 0.2, 0, 1), x = xs[i] - pw / 2;
      const g = ctx.createLinearGradient(0, base - h, 0, base); g.addColorStop(0, ['#ffd84a', '#dfe6f2', '#ffa65a'][i]); g.addColorStop(1, shade(['#ffd84a', '#dfe6f2', '#ffa65a'][i], -0.5));
      ctx.fillStyle = g; rr(ctx, x, base - h, pw, h, 8); ctx.fill();
      kartText(ctx, String(i + 1), xs[i], base - h / 2, 26, '#1a1024', { stroke: false });
      const r = st[i];
      if (r && t > 0.5 + i * 0.2) {
        const kr = KartArt.atlas && KartArt.kart(r.id, 8);
        if (kr) ctx.drawImage(KartArt.atlas.c, kr.x, kr.y, kr.w, kr.h, xs[i] - pw * 0.55, base - h - pw * 0.95, pw * 1.1, pw * 1.1);
        kartText(ctx, r.name, xs[i], base + 14, 12, r.player ? '#ff6ae0' : '#ffffff', { ui: true });
      }
    }
    if (pos <= 3) {
      const s = Math.min(1, t * 1.5);
      kartTrophy(ctx, Math.min(W - 70, cx + pw * 2.3), H * 0.42, 70 * easeOut(s), ['#ffd84a', '#dfe6f2', '#ffa65a'][pos - 1], this.cup.id, t);
      if (Math.random() < 0.3) this.confettiUI = (this.confettiUI || []).concat([{ x: Math.random() * W, y: -10, vx: (Math.random() - 0.5) * 60, vy: 60 + Math.random() * 80, c: KART_NEON[Math.floor(Math.random() * 6)], r: Math.random() * 6 }]);
    } else kartText(ctx, 'Finish in the top 3 to win a trophy. Again!', cx, H * 0.36, 13, 'rgba(255,255,255,0.85)', { ui: true, stroke: false });
    if (this.confettiUI) {
      for (const c of this.confettiUI) { c.x += c.vx / 60; c.y += c.vy / 60; c.r += 0.1; ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.r); ctx.fillStyle = c.c; ctx.fillRect(-4, -2.5, 8, 5); ctx.restore(); }
      this.confettiUI = this.confettiUI.filter(c => c.y < H + 20);
    }
    ctx.restore();
    UI.drawButtons(ctx, this.btns);
  },
  buildPause() {
    const W = Game.cssW, H = Game.cssH, bw = Math.min(240, W * 0.6), bh = 44, x = (W - bw) / 2;
    let y = H / 2 - 74;
    this.pauseBtns = [
      { x, y, w: bw, h: bh + 4, label: 'RESUME', primary: true, fn: () => this.closePause() },
      { x, y: y += 58, w: bw, h: bh, label: 'RESTART', fn: () => { Sound.play('select'); this.restart(); } },
      { x, y: y += 54, w: bw, h: bh, label: 'QUIT TO MENU', fn: () => { Sound.play('back'); this.leave(); } }
    ];
    this.pauseBtns.focus = 0;
  },
  drawPause(ctx) {
    const W = Game.cssW, H = Game.cssH;
    ctx.save();
    ctx.fillStyle = 'rgba(6,4,14,0.62)'; ctx.fillRect(0, 0, W, H);
    UI.panel(ctx, W / 2 - Math.min(150, W * 0.42), H / 2 - 132, Math.min(300, W * 0.84), 246);
    UI.title(ctx, 'PAUSED', W / 2, H / 2 - 104, 24);
    UI.drawButtons(ctx, this.pauseBtns);
    ctx.restore();
  }
});
function kartTrophy(ctx, x, y, s, col, cup, t) {
  if (s <= 1) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 70, s / 70);
  ctx.shadowColor = col; ctx.shadowBlur = 24;
  const g = ctx.createLinearGradient(-40, -60, 40, 40); g.addColorStop(0, mix(col, '#ffffff', 0.6)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.45));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-36, -56); ctx.lineTo(36, -56); ctx.quadraticCurveTo(38, 4, 8, 14); ctx.lineTo(8, 30); ctx.lineTo(26, 40); ctx.lineTo(-26, 40); ctx.lineTo(-8, 30); ctx.lineTo(-8, 14); ctx.quadraticCurveTo(-38, 4, -36, -56); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.strokeStyle = shade(col, -0.55); ctx.lineWidth = 3; ctx.stroke();
  ctx.lineWidth = 6; ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(-40, -34, 14, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(40, -34, 14, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
  ctx.fillStyle = shade(col, -0.35); rr(ctx, -34, 40, 68, 16, 4); ctx.fill();
  // emblem: dust devil swirl or flame
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  if (cup === 'fire') { ctx.beginPath(); ctx.moveTo(0, -46); ctx.bezierCurveTo(18, -28, 12, -8, 0, -6); ctx.bezierCurveTo(-12, -8, -18, -28, 0, -46); ctx.fill(); }
  else { ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(i * 2 - 3, -42 + i * 9, 16 - i * 3, 3.5, 0, 0, TAU); ctx.stroke(); } }
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-18, -36, 6, 16, 0.2, 0, TAU); ctx.fill();
  for (let i = 0; i < 5; i++) { const a = t * 2 + i * 1.3, r = 60 + Math.sin(t * 3 + i) * 8; ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.6 - 10, 2.5 + Math.sin(t * 6 + i) * 1.5, 0, TAU); ctx.fill(); }
  ctx.restore();
}

/* ---------------- icons, faces, menu art ---------------- */
Object.assign(KartArt, {
  iconCanvas(id) {
    this._icons = this._icons || {};
    if (this._icons[id]) return this._icons[id];
    const S = 128, c = makeCanvas(S, S), x = c.getContext('2d'), m = S / 2;
    x.lineJoin = 'round'; x.lineCap = 'round';
    const out = (w) => { x.strokeStyle = 'rgba(20,10,30,0.85)'; x.lineWidth = w || 5; x.stroke(); };
    if (id === 'puke') {
      const g = x.createRadialGradient(m - 14, m - 16, 4, m, m, 44); g.addColorStop(0, '#eaffb8'); g.addColorStop(0.5, '#7adf3a'); g.addColorStop(1, '#2a7a1a');
      x.beginPath(); x.arc(m, m - 4, 40, 0, TAU); x.fillStyle = g; x.fill(); out();
      x.fillStyle = '#7adf3a'; x.beginPath(); x.moveTo(m + 10, m + 30); x.quadraticCurveTo(m + 16, m + 52, m + 20, m + 34); x.fill(); x.beginPath(); x.arc(m + 17, m + 48, 6, 0, TAU); x.fill();
      x.strokeStyle = '#1a3a10'; x.lineWidth = 4; for (const s of [-1, 1]) { x.beginPath(); x.arc(m + s * 14, m - 10, 7, 0.4, TAU - 0.4); x.stroke(); }
      x.beginPath(); x.moveTo(m - 14, m + 14); x.quadraticCurveTo(m - 6, m + 6, m, m + 14); x.quadraticCurveTo(m + 6, m + 22, m + 14, m + 12); x.stroke();
      x.fillStyle = 'rgba(255,255,255,0.75)'; x.beginPath(); x.ellipse(m - 18, m - 24, 9, 5, -0.6, 0, TAU); x.fill();
    } else if (id === 'tumble') {
      const rng = mulberry32(4);
      for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 12 + rng() * 30; x.strokeStyle = i % 3 ? '#9a7442' : '#d8b070'; x.lineWidth = 3 + rng() * 3; x.beginPath(); x.arc(m + Math.cos(a) * 5, m + Math.sin(a) * 5, r, a, a + 1.2 + rng() * 2); x.stroke(); }
      x.strokeStyle = 'rgba(20,10,30,0.5)'; x.lineWidth = 3; x.beginPath(); x.arc(m, m, 44, 0, TAU); x.stroke();
    } else if (id === 'swarm') {
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU + 0.3, r = i === 0 ? 0 : 30, px = m + Math.cos(a) * r, py = m + Math.sin(a) * r * 0.8, s = i === 0 ? 1.3 : 0.8;
        x.save(); x.translate(px, py); x.scale(s, s);
        x.fillStyle = 'rgba(210,235,255,0.85)'; x.beginPath(); x.ellipse(-9, -8, 10, 5, -0.6, 0, TAU); x.ellipse(9, -8, 10, 5, 0.6, 0, TAU); x.fill(); x.strokeStyle = 'rgba(40,40,60,0.6)'; x.lineWidth = 1.5; x.stroke();
        x.fillStyle = '#231c24'; x.beginPath(); x.ellipse(0, 4, 6, 11, 0, 0, TAU); x.fill();
        x.fillStyle = '#ff2a3a'; x.beginPath(); x.arc(-3, -4, 3, 0, TAU); x.arc(3, -4, 3, 0, TAU); x.fill();
        x.strokeStyle = '#231c24'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, -6); x.lineTo(0, -20); x.stroke();
        x.restore();
      }
    } else if (id === 'glow') {
      x.save(); x.translate(m, m); x.rotate(-0.7);
      x.shadowColor = '#4affd2'; x.shadowBlur = 22; x.fillStyle = '#4affd2'; rr(x, -12, -46, 24, 92, 12); x.fill();
      x.shadowBlur = 0; x.fillStyle = '#d8fff4'; rr(x, -5, -38, 10, 76, 5); x.fill();
      x.fillStyle = '#ff4fd8'; rr(x, -14, -52, 28, 14, 5); x.fill(); out(3);
      x.restore();
      x.fillStyle = '#ffffff'; for (const [dx, dy] of [[-34, -30], [36, 24], [30, -36]]) { x.beginPath(); x.arc(m + dx, m + dy, 4, 0, TAU); x.fill(); }
    } else if (id === 'dust') {
      for (const [dx, dy, r] of [[-22, 8, 26], [0, -12, 32], [24, 6, 26], [-6, 18, 24], [14, 20, 20]]) { const g = x.createRadialGradient(m + dx - 6, m + dy - 8, 2, m + dx, m + dy, r); g.addColorStop(0, '#fff6e2'); g.addColorStop(1, '#c8a878'); x.fillStyle = g; x.beginPath(); x.arc(m + dx, m + dy, r, 0, TAU); x.fill(); }
      x.strokeStyle = 'rgba(120,90,50,0.55)'; x.lineWidth = 4; x.beginPath(); x.arc(m - 4, m + 2, 14, 0.5, 4.5); x.stroke(); x.beginPath(); x.arc(m + 8, m - 8, 8, 3, 6.8); x.stroke();
    } else if (id === 'disco') {
      x.strokeStyle = '#8a8a96'; x.lineWidth = 3; x.beginPath(); x.moveTo(m, 6); x.lineTo(m, 22); x.stroke();
      x.save(); x.beginPath(); x.arc(m, m + 6, 40, 0, TAU); x.clip();
      for (let j = -6; j < 6; j++) for (let i = -6; i < 6; i++) { const h = (i * 37 + j * 61 + 400) % 360; x.fillStyle = `hsl(${h},70%,${55 + ((i + j) % 3) * 12}%)`; x.fillRect(m + i * 8 + (j % 2) * 4, m + 6 + j * 8, 7, 7); }
      const g = x.createRadialGradient(m - 14, m - 10, 4, m, m + 6, 42); g.addColorStop(0, 'rgba(255,255,255,0.65)'); g.addColorStop(1, 'rgba(40,20,60,0.45)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
      x.restore(); x.beginPath(); x.arc(m, m + 6, 40, 0, TAU); out(4);
      x.fillStyle = '#ffffff'; for (const [dx, dy, r] of [[-30, -26, 9], [34, -10, 7], [26, 40, 6]]) { x.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, rr0 = k % 2 ? r * 0.25 : r; x.lineTo(m + dx + Math.cos(a) * rr0, m + dy + Math.sin(a) * rr0); } x.fill(); }
    } else if (id === 'bufo') {
      x.save(); x.translate(m, m + 4);
      x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 3; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(-36 + i * 4, 30 - i * 12, 10 + i * 5, Math.PI, Math.PI * 1.5); x.stroke(); }
      x.fillStyle = '#8ac83a'; x.beginPath(); x.ellipse(0, 0, 34, 24, -0.3, 0, TAU); x.fill(); out(4);
      x.fillStyle = '#5a8a2a'; for (const [dx, dy] of [[-10, -6], [8, 6], [14, -10], [-16, 10]]) { x.beginPath(); x.arc(dx, dy, 5, 0, TAU); x.fill(); }
      x.fillStyle = '#8ac83a'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(16 + s * 6, -20, 9, 9, 0, 0, TAU); x.fill(); out(3); x.fillStyle = '#ffd84a'; x.beginPath(); x.arc(17 + s * 6, -21, 5, 0, TAU); x.fill(); x.fillStyle = '#16100a'; x.fillRect(14 + s * 6, -22, 7, 2.5); x.fillStyle = '#8ac83a'; }
      x.strokeStyle = '#2a4a10'; x.lineWidth = 3; x.beginPath(); x.moveTo(14, 4); x.quadraticCurveTo(26, 8, 32, -2); x.stroke();
      x.strokeStyle = '#8ac83a'; x.lineWidth = 8; x.beginPath(); x.moveTo(-26, 10); x.lineTo(-44, 26); x.moveTo(-20, 16); x.lineTo(-30, 36); x.stroke();
      x.restore();
    } else if (id === 'water') {
      x.save(); x.translate(m, m); x.rotate(0.25);
      x.fillStyle = 'rgba(210,240,255,0.8)'; rr(x, -20, -34, 40, 76, 12); x.fill(); out(4);
      x.fillStyle = '#4ab8ff'; rr(x, -16, -6, 32, 44, 9); x.fill();
      x.fillStyle = '#2a6aff'; rr(x, -12, -48, 24, 16, 4); x.fill(); out(3);
      x.fillStyle = '#ffffff'; rr(x, -20, -4, 40, 16, 2); x.fill(); x.fillStyle = '#2a6aff'; x.font = `bold 13px ${FONT_UI}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('H2O', 0, 4);
      x.fillStyle = 'rgba(255,255,255,0.7)'; rr(x, -14, -28, 6, 22, 3); x.fill();
      x.restore();
    }
    return (this._icons[id] = c);
  },
  icon(ctx, id, cx, cy, s) { if (!id || !KART_ITEMS[id]) return; ctx.drawImage(this.iconCanvas(id), cx - s / 2, cy - s / 2, s, s); },
  // driver portrait canvas: 'face' (head close-up) or 'bust'
  portraitCanvas(id, kind, size) {
    this.faces = this.faces || {};
    const key = id + kind + size + this.lookKey();
    if (this.faces[key]) return this.faces[key];
    const c = makeCanvas(size, size), x = c.getContext('2d');
    const th = Math.PI - 0.42, ph = 0.12;
    KartProj.view(th, ph, 40, 0, 0); KartProj.clear(); KartProj.lastHead = null;
    KART_DRIVERS[id](Save.data ? Save.data.look : null);
    const h = KartProj.lastHead || { c: [0, 1.25, -0.25], r: 0.3 };
    KartProj.clear();
    const sc = kind === 'face' ? size / (h.r * 3.1) : size / (h.r * 5.6);
    const cy = kind === 'face' ? h.c[1] + h.r * 0.15 : h.c[1] - h.r * 1.1;
    KartProj.view(th, ph, sc, 0, 0);
    const p = KartProj.P(h.c[0], cy, h.c[2]);
    KartProj.view(th, ph, sc, size / 2 - (p[0]), size / 2 - (p[1]) + (kind === 'face' ? size * 0.04 : size * 0.08));
    KART_DRIVERS[id](Save.data ? Save.data.look : null);
    KartProj.flush(x);
    return (this.faces[key] = c);
  },
  face(ctx, id, cx, cy, s) {
    if (KartPortraits.has(id)) { KartPortraits.draw(ctx, id, cx, cy, s * 1.1, performance.now() / 1000); return; }
    if (typeof CharArt !== 'undefined' && CharArt && CharArt.drawPortrait) { try { CharArt.drawPortrait(ctx, id, cx, cy, s, performance.now() / 1000); return; } catch (e) { /* fall back */ } }
    const r = kartRacer(id);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, s / 2, 0, TAU);
    const g = ctx.createLinearGradient(cx, cy - s / 2, cx, cy + s / 2); g.addColorStop(0, shade(r.color, 0.25)); g.addColorStop(1, shade(r.color, -0.45));
    ctx.fillStyle = g; ctx.fill(); ctx.save(); ctx.clip();
    ctx.drawImage(this.portraitCanvas(id, 'face', 96), cx - s / 2, cy - s / 2, s, s);
    ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
});

// portraits for racers that the shared CharArt doesn't draw (The Man)
const KartPortraits = {
  cache: {},
  has(id) { return id === 'theman'; },
  // full figure fitted in a size x size box centred on (x, y)
  draw(ctx, id, x, y, size, t) {
    const px = Math.max(24, Math.round(size * Math.max(1, Game.dpr))), key = id + px;
    let c = this.cache[key];
    if (!c) { c = this.cache[key] = makeCanvas(px, px); const g = c.getContext('2d'); g.scale(px / 100, px / 100); kartPaintManPortrait(g); }
    ctx.save();
    const s = size / 100, ox = x - size / 2, oy = y - size / 2, pulse = 0.7 + 0.3 * Math.sin(t * 3.1);
    const hg = ctx.createRadialGradient(ox + 50 * s, oy + 20 * s, 0, ox + 50 * s, oy + 20 * s, 34 * s);
    hg.addColorStop(0, `rgba(255,200,110,${0.55 * pulse})`); hg.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.fillStyle = hg; ctx.fillRect(ox, oy, size, size);
    ctx.drawImage(c, ox, oy, size, size);
    // smitten: a little heart for Chinka floats by his hand
    const hy = oy + (16 + Math.sin(t * 2.2) * 3) * s, hx = ox + 86 * s;
    KartFace.heart(ctx, hx, hy, 4.6 * s); ctx.fillStyle = '#ff5a9a'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(0.6, 0.7 * s); ctx.stroke();
    ctx.restore();
  }
};
// The Man, front view, arms raised: lattice wood, neon outline, glowing diamond head (100 x 100 units)
function kartPaintManPortrait(x) {
  const wood = '#c8935a', woodD = '#7a4a22', neon = '#ff6a2a';
  x.lineCap = 'round'; x.lineJoin = 'round';
  const beam = (a, b, w, col) => { x.strokeStyle = 'rgba(58,30,10,0.9)'; x.lineWidth = w + 1.4; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); x.strokeStyle = col || wood; x.lineWidth = w; x.stroke(); };
  const truss = (a, b, w, n) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, ox = -dy / l * w / 2, oy = dx / l * w / 2;
    const P = (t, s) => [lerp(a[0], b[0], t) + ox * s, lerp(a[1], b[1], t) + oy * s];
    beam(P(0, -1), P(1, -1), 2.4); beam(P(0, 1), P(1, 1), 2.4);
    for (let i = 0; i <= n; i++) beam(P(i / n, -1), P(i / n, 1), 1.3, woodD);
    for (let i = 0; i < n; i++) beam(P(i / n, i % 2 ? 1 : -1), P((i + 1) / n, i % 2 ? -1 : 1), 1.1, woodD);
  };
  const outline = [];
  // legs, torso, arms (raised in a V)
  for (const sg of [-1, 1]) { truss([50 + sg * 6, 64], [50 + sg * 13, 104], 6, 4); outline.push([[50 + sg * 9, 64], [50 + sg * 16.5, 104]]); }
  for (const sg of [-1, 1]) { beam([50 + sg * 6, 64], [50 + sg * 8, 50], 3); beam([50 + sg * 8, 50], [50 + sg * 10, 37], 3); outline.push([[50 + sg * 6, 64], [50 + sg * 8, 50], [50 + sg * 10, 37]]); }
  beam([43, 64], [57, 64], 2.2); beam([41.5, 50], [58.5, 50], 2); beam([36, 37], [64, 37], 2.6);
  beam([44, 64], [58, 50], 1.2, woodD); beam([56, 64], [42, 50], 1.2, woodD); beam([42, 50], [60, 37], 1.2, woodD); beam([58, 50], [40, 37], 1.2, woodD);
  for (const sg of [-1, 1]) {
    truss([50 + sg * 13, 37], [50 + sg * 23, 22], 5, 3); truss([50 + sg * 23, 22], [50 + sg * 31, 7], 4.4, 3);
    for (const f of [-1, 0, 1]) beam([50 + sg * 31, 7], [50 + sg * 32.5 + f * 1.6, 2.5], 0.9);
    outline.push([[50 + sg * 13, 37], [50 + sg * 23, 22], [50 + sg * 31, 7]]);
  }
  beam([50, 37], [50, 31.5], 2.2);
  // neon outline
  x.save(); x.shadowColor = neon; x.shadowBlur = 4; x.strokeStyle = neon; x.lineWidth = 1.5;
  for (const line of outline) { x.beginPath(); line.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); }
  x.shadowBlur = 0; x.strokeStyle = '#ffe2b0'; x.lineWidth = 0.6;
  for (const line of outline) { x.beginPath(); line.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); }
  x.restore();
  // the glowing diamond head
  x.save(); x.shadowColor = '#ffb84a'; x.shadowBlur = 9;
  x.beginPath(); x.moveTo(50, 7); x.lineTo(59.5, 19.5); x.lineTo(50, 32); x.lineTo(40.5, 19.5); x.closePath();
  const hg = x.createLinearGradient(40, 7, 60, 32); hg.addColorStop(0, '#fff8d8'); hg.addColorStop(0.5, '#ffd27a'); hg.addColorStop(1, '#ff9a3a');
  x.fillStyle = hg; x.fill(); x.shadowBlur = 0; x.strokeStyle = '#a8501a'; x.lineWidth = 1; x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.55)'; x.beginPath(); x.moveTo(50, 7); x.lineTo(59.5, 19.5); x.lineTo(50, 19.5); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(150,70,10,0.6)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(40.5, 19.5); x.lineTo(59.5, 19.5); x.moveTo(50, 7); x.lineTo(50, 32); x.stroke();
  x.restore();
}

// animated festival backdrop for menus (static layers cached per size)
function kartMenuBackdrop(ctx, W, H, t) {
  const key = W + 'x' + H + '@' + Game.dpr;
  let c = kartMenuBackdrop.cache;
  if (!c || c.key !== key) {
    const dpr = Game.dpr, cv = makeCanvas(W * dpr, H * dpr), x = cv.getContext('2d');
    x.scale(dpr, dpr);
    const hz = H * 0.66;
    const sky = x.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#0c0624'); sky.addColorStop(0.45, '#3a1650'); sky.addColorStop(0.78, '#c0466a'); sky.addColorStop(1, '#ff9a5a');
    x.fillStyle = sky; x.fillRect(0, 0, W, hz);
    const rng = mulberry32(42);
    for (let i = 0; i < 160; i++) { const sy = rng() * hz * 0.6; x.fillStyle = `rgba(255,255,255,${(1 - sy / (hz * 0.6)) * (0.3 + rng() * 0.7)})`; x.beginPath(); x.arc(rng() * W, sy, rng() * 1.3 + 0.3, 0, TAU); x.fill(); }
    const sun = x.createRadialGradient(W * 0.72, hz, 4, W * 0.72, hz, H * 0.5); sun.addColorStop(0, 'rgba(255,220,150,0.9)'); sun.addColorStop(0.15, 'rgba(255,150,90,0.5)'); sun.addColorStop(1, 'rgba(255,100,120,0)');
    x.fillStyle = sun; x.fillRect(0, 0, W, hz);
    const ridge = (base, amp, col, seed) => { const r = mulberry32(seed); x.fillStyle = col; x.beginPath(); x.moveTo(0, hz); let y = base; for (let i = 0; i <= 40; i++) { y = base - Math.abs(Math.sin(i * 0.45 + r() * 2)) * amp - r() * amp * 0.3; x.lineTo(i / 40 * W, hz - y); } x.lineTo(W, hz); x.closePath(); x.fill(); };
    ridge(H * 0.07, H * 0.08, '#7a3a6a', 3); ridge(H * 0.03, H * 0.05, '#4a1e4a', 7);
    const fl = x.createLinearGradient(0, hz, 0, H); fl.addColorStop(0, '#b06a6a'); fl.addColorStop(0.25, '#6a3a52'); fl.addColorStop(1, '#1a0e24');
    x.fillStyle = fl; x.fillRect(0, hz, W, H - hz);
    // the Man on the horizon
    x.save(); x.translate(W * 0.5, hz + 2); const ms = H / 400;
    x.strokeStyle = '#ff9a5a'; x.shadowColor = '#ffb07a'; x.shadowBlur = 10; x.lineWidth = 3 * ms; x.lineCap = 'round';
    x.beginPath(); x.moveTo(-6 * ms, 0); x.lineTo(-3 * ms, -24 * ms); x.lineTo(-5 * ms, -40 * ms); x.lineTo(-17 * ms, -56 * ms); x.moveTo(6 * ms, 0); x.lineTo(3 * ms, -24 * ms); x.lineTo(5 * ms, -40 * ms); x.lineTo(17 * ms, -56 * ms); x.moveTo(-5 * ms, -40 * ms); x.lineTo(5 * ms, -40 * ms); x.moveTo(0, -40 * ms); x.lineTo(-5 * ms, -47 * ms); x.lineTo(0, -55 * ms); x.lineTo(5 * ms, -47 * ms); x.closePath(); x.stroke();
    x.restore();
    // camp lights along the horizon
    for (let i = 0; i < 140; i++) { x.fillStyle = rgba(KART_NEON[i % 6], 0.5 + rng() * 0.5); x.beginPath(); x.arc(rng() * W, hz + 2 + rng() * 6, 0.8 + rng() * 1.4, 0, TAU); x.fill(); }
    // playa cracks
    x.strokeStyle = 'rgba(255,200,180,0.08)'; x.lineWidth = 1;
    for (let i = 0; i < 60; i++) { const yy = hz + 10 + rng() * (H - hz), xx = rng() * W, w = 20 + (yy - hz) * 0.8; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + w * (rng() - 0.5), yy + 3 + rng() * 6); x.lineTo(xx + w * (rng() - 0.5), yy + 6 + rng() * 10); x.stroke(); }
    c = kartMenuBackdrop.cache = { key, cv, hz };
  }
  ctx.drawImage(c.cv, 0, 0, W, H);
  // animated: lasers, art cars on the horizon, dust motes
  const hz = c.hz;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const bx = W * (0.18 + i * 0.32), a = -Math.PI / 2 + Math.sin(t * 0.6 + i * 2) * 0.6;
    const g = ctx.createLinearGradient(bx, hz, bx + Math.cos(a) * H, hz + Math.sin(a) * H); g.addColorStop(0, rgba(KART_NEON[i * 2], 0.4)); g.addColorStop(1, rgba(KART_NEON[i * 2], 0));
    ctx.strokeStyle = g; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx, hz); ctx.lineTo(bx + Math.cos(a) * H, hz + Math.sin(a) * H); ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const dir = i % 2 ? -1 : 1, sp = 18 + i * 7, x = ((t * sp * dir + i * 260) % (W + 160) + W + 160) % (W + 160) - 80, y = hz + 4 + i * 3;
    const col = KART_NEON[(i + Math.floor(t * 4)) % 6];
    ctx.fillStyle = rgba(col, 0.25); ctx.beginPath(); ctx.ellipse(x, y - 6, 26, 12, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 6; k++) { ctx.fillStyle = rgba(KART_NEON[(k + i + Math.floor(t * 6)) % 6], 0.95); ctx.beginPath(); ctx.arc(x - 14 + k * 5.6, y - 6, 1.3, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,230,200,0.35)';
  for (let i = 0; i < 30; i++) { const px = ((i * 137 + t * (20 + i % 5 * 8)) % (W + 20)) - 10, py = hz + ((i * 71) % (H - hz)) + Math.sin(t + i) * 4; ctx.beginPath(); ctx.arc(px, py, 1 + (i % 3) * 0.6, 0, TAU); ctx.fill(); }
}

/* ============================================================
   Menu: mode -> driver -> cup / track -> race
   ============================================================ */
class KartMenuScene {
  constructor() {
    this.t = 0; this.state = 'mode'; this.anim = { state: 'idle', t: 0, phase: 0 };
    const ks = kartSave();
    this.sel = KART_RACERS.findIndex(r => r.id === ks.racer); if (this.sel < 0) this.sel = 0;
    this.cupSel = 0; this.trackSel = 0; this.gpMode = true;
    Input.setMode('ui');
    Sound.music('kart_menu');
    this.jobs = KartArt.jobs(null);
    this.build();
  }
  resize() { this.build(); }
  back() {
    Sound.play('back');
    if (this.state === 'mode') { Game.setScene(new TitleScene()); return; }
    this.state = this.state === 'char' ? 'mode' : 'char'; this.enter = 0; this.build();
  }
  build() {
    const W = Game.cssW, H = Game.cssH, portrait = H > W, ks = kartSave();
    this.portrait = portrait;
    const backBtn = { x: Math.max(14, insets.l + 8), y: Math.max(12, insets.t + 6), w: 92, h: 38, label: '◀ BACK', fn: () => this.back() };
    this.cards = [];
    if (this.state === 'mode') {
      const bw = Math.min(250, W * 0.62), x = (W - bw) / 2, y0 = portrait ? H * 0.38 : H * 0.33;
      this.btns = [
        { x, y: y0, w: bw, h: 48, label: 'GRAND PRIX', primary: true, fn: () => { Sound.play('select'); this.gpMode = true; this.state = 'char'; this.build(); } },
        { x, y: y0 + 56, w: bw, h: 42, label: 'TIME TRIAL', fn: () => { Sound.play('select'); this.gpMode = false; this.state = 'char'; this.build(); } },
        { x: x + bw * 0.12, y: y0 + 106, w: bw * 0.76, h: 34, size: 11, label: 'AUTO-GAS: ' + (ks.autoGas !== false ? 'ON' : 'OFF'), fn: () => { ks.autoGas = ks.autoGas === false; Save.save(); Sound.play('select'); this.build(); } },
        backBtn
      ];
      this.btns.focus = 0;
    } else if (this.state === 'char') {
      const top = portrait ? Math.max(100, insets.t + 96) : Math.max(64, insets.t + 58);
      let gx, gy, gw, gh, cols = 4;
      if (portrait) { gx = 14; gw = W - 28; gy = H * 0.44; gh = H * 0.4; }
      else { gx = Math.max(16, insets.l + 10); gw = W * 0.56; gy = top; gh = H - top - Math.max(14, insets.b + 8); }
      const cw = (gw - (cols - 1) * 8) / cols, ch = Math.min((gh - 8) / 2, cw * 1.25);
      KART_RACERS.forEach((r, i) => this.cards.push({ i, x: gx + (i % cols) * (cw + 8), y: gy + Math.floor(i / cols) * (ch + 8), w: cw, h: ch }));
      const pw = portrait ? W - 28 : W - gw - gx - 24, px = portrait ? 14 : gx + gw + 12, py = portrait ? top : top, ph = portrait ? H * 0.44 - top - 8 : gh - 56;
      this.preview = { x: px, y: py, w: pw, h: ph };
      const nb = { x: portrait ? W / 2 - 100 : px + pw / 2 - 90, y: portrait ? H - Math.max(16, insets.b + 10) - 50 : py + ph + 8, w: portrait ? 200 : 180, h: 48, label: 'NEXT ▶', primary: true, fn: () => this.confirmChar() };
      this.btns = [nb, backBtn]; this.btns.focus = 0;
    } else if (this.state === 'cup') {
      const top = portrait ? Math.max(104, insets.t + 98) : Math.max(70, insets.t + 64), bottom = H - Math.max(16, insets.b + 10);
      if (portrait) { const ch = (bottom - top - 12) / 2; KART_CUPS.forEach((c, i) => this.cards.push({ i, x: 18, y: top + i * (ch + 12), w: W - 36, h: ch })); }
      else { const cw = Math.min(330, (W - 60) / 2); KART_CUPS.forEach((c, i) => this.cards.push({ i, x: W / 2 - cw - 8 + i * (cw + 16), y: top, w: cw, h: bottom - top })); }
      this.btns = [backBtn];
    } else if (this.state === 'track') {
      const top = portrait ? Math.max(104, insets.t + 98) : Math.max(70, insets.t + 64), bottom = H - Math.max(14, insets.b + 8);
      const cols = portrait ? 2 : 4, rows = 4 / (cols / 2) / 2 * 2 === 4 ? 2 : 4;
      const nr = portrait ? 4 : 2, cw = (W - 28 - (cols - 1) * 10) / cols, ch = (bottom - top - (nr - 1) * 10) / nr;
      KART_TRACK_ORDER.forEach((id, i) => this.cards.push({ i, id, x: 14 + (i % cols) * (cw + 10), y: top + Math.floor(i / cols) * (ch + 10), w: cw, h: ch }));
      this.btns = [backBtn];
    }
  }
  confirmChar() {
    Sound.play('select');
    const ks = kartSave(); ks.racer = KART_RACERS[this.sel].id; Save.save();
    this.state = this.gpMode ? 'cup' : 'track'; this.build();
  }
  start(opts) {
    Sound.play('select');
    const ks = kartSave();
    const o = Object.assign({ racer: KART_RACERS[this.sel].id, autoGas: ks.autoGas !== false }, opts);
    if (o.mode === 'gp') { o.gp = { points: {}, results: [] }; o.gpSnapshot = { points: {}, results: [] }; }
    Game.setScene(new KartRaceScene(o));
  }
  update(dt) {
    this.t += dt; this.anim.t += dt;
    const key = Input.uiKey;
    const n = this.cards.length;
    if (n && key) {
      const cols = this.state === 'char' ? 4 : this.state === 'track' ? (this.portrait ? 2 : 4) : (this.portrait ? 1 : 2);
      let cur = this.state === 'char' ? this.sel : this.state === 'cup' ? this.cupSel : this.trackSel, moved = true;
      if (key === 'left') cur = (cur - 1 + n) % n; else if (key === 'right') cur = (cur + 1) % n;
      else if (key === 'up') cur = (cur - cols + n) % n; else if (key === 'down') cur = (cur + cols) % n;
      else moved = false;
      if (moved) {
        Sound.play('select', { vol: 0.4 }); Input.uiKey = null;
        if (this.state === 'char') this.sel = cur; else if (this.state === 'cup') this.cupSel = cur; else this.trackSel = cur;
      } else if (key === 'enter') {
        Input.uiKey = null;
        if (this.state === 'char') this.confirmChar();
        else if (this.state === 'cup') this.start({ mode: 'gp', cup: KART_CUPS[this.cupSel].id, race: 0 });
        else if (this.state === 'track') this.start({ mode: 'tt', track: KART_TRACK_ORDER[this.trackSel] });
        return;
      }
    }
    if (key === 'pause') { Input.uiKey = null; this.back(); return; }
    const hit = UI.hitButtons(this.btns);
    if (hit) { hit.fn(); return; }
    for (const tp of Input.taps) for (const c of this.cards) {
      if (tp.x < c.x || tp.x > c.x + c.w || tp.y < c.y || tp.y > c.y + c.h) continue;
      if (this.state === 'char') { if (this.sel === c.i) this.confirmChar(); else { this.sel = c.i; Sound.play('select', { vol: 0.5 }); } }
      else if (this.state === 'cup') this.start({ mode: 'gp', cup: KART_CUPS[c.i].id, race: 0 });
      else if (this.state === 'track') this.start({ mode: 'tt', track: c.id });
      return;
    }
  }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH, dpr = Game.dpr;
    // build sprite art in the background while the player browses
    if (this.jobs.length) { const t0 = performance.now(); while (this.jobs.length && performance.now() - t0 < 7) this.jobs.shift()(); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    kartMenuBackdrop(ctx, W, H, this.t);
    if (this.state === 'mode') this.drawMode(ctx);
    else if (this.state === 'char') this.drawChar(ctx);
    else if (this.state === 'cup') this.drawCups(ctx);
    else this.drawTracks(ctx);
    UI.drawButtons(ctx, this.btns);
  }
  drawLogo(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.04);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${s}px ${FONT_DISPLAY}`;
    const wob = Math.sin(this.t * 2) * 2;
    for (let i = 6; i > 0; i--) { ctx.fillStyle = `rgba(${30 + i * 12},8,${50 + i * 10},1)`; ctx.fillText('ART CAR KART', i * 0.9, wob + i * 1.4); }
    ctx.shadowColor = '#ff4fd8'; ctx.shadowBlur = s * 0.45;
    const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2); g.addColorStop(0, '#fff8d0'); g.addColorStop(0.45, '#ffd84a'); g.addColorStop(0.55, '#ff8a3a'); g.addColorStop(1, '#ff4fd8');
    ctx.fillStyle = g; ctx.fillText('ART CAR KART', 0, wob);
    ctx.shadowBlur = 0; ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.strokeText('ART CAR KART', 0, wob);
    ctx.restore();
  }
  drawMode(ctx) {
    const W = Game.cssW, H = Game.cssH, P = this.portrait;
    this.drawLogo(ctx, W / 2, P ? H * 0.2 : H * 0.17, Math.min(P ? 44 : 58, W * (P ? 0.1 : 0.075)));
    kartText(ctx, 'Desert festival racing  ·  8 art cars  ·  2 cups', W / 2, (P ? H * 0.2 : H * 0.17) + Math.min(46, W * 0.06), 12, 'rgba(255,255,255,0.85)', { ui: true, stroke: false });
    // kart parade
    if (KartArt.atlas) {
      const n = KART_RACERS.length, size = Math.min(P ? W / 4.4 : W / 9.5, P ? 90 : 92), y = P ? H * 0.8 : H - Math.max(14, insets.b + 8);
      KART_RACERS.forEach((r, i) => {
        const reg = KartArt.kart(r.id, 6 + (i % 2) * 4); if (!reg) return;
        const cx = P ? W / 2 + ((i % 4) - 1.5) * size * 0.95 : W / 2 + (i - (n - 1) / 2) * size * 0.98;
        const cy = P ? y + Math.floor(i / 4) * size * 0.72 - size * 0.4 : y;
        const b = Math.abs(Math.sin(this.t * 3 + i)) * 3;
        ctx.drawImage(KartArt.atlas.c, reg.x, reg.y, reg.w, reg.h, cx - size / 2, cy - size * 0.7 - b, size, size);
      });
    }
    const ks = kartSave();
    const tro = KART_CUPS.map(c => ks.trophies[c.id] ? c.name + ': ' + ['', 'GOLD', 'SILVER', 'BRONZE'][ks.trophies[c.id]] : null).filter(Boolean).join('   ·   ');
    if (tro) kartText(ctx, tro, W / 2, this.btns[2].y + 48, 11, '#ffd84a', { ui: true, stroke: false });
  }
  drawStatBars(ctx, r, x, y, w) {
    const names = [['SPEED', 'speed'], ['ACCEL', 'accel'], ['HANDLING', 'handling'], ['WEIGHT', 'weight']];
    names.forEach(([lab, key], i) => {
      const yy = y + i * 18;
      kartText(ctx, lab, x, yy, 10, 'rgba(255,255,255,0.75)', { align: 'left', stroke: false });
      for (let k = 0; k < 5; k++) {
        const on = k < r.stats[key], bx = x + 72 + k * (w - 72) / 5;
        ctx.fillStyle = on ? (key === 'speed' ? '#ff4fd8' : key === 'accel' ? '#ffd84a' : key === 'handling' ? '#38f2ff' : '#ff8a3a') : 'rgba(255,255,255,0.12)';
        rr(ctx, bx, yy - 5, (w - 72) / 5 - 4, 10, 4); ctx.fill();
      }
    });
  }
  drawCard(ctx, c, on, col) {
    ctx.save();
    if (on) { ctx.shadowColor = col || '#ff4fd8'; ctx.shadowBlur = 18; }
    const g = ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.h); g.addColorStop(0, on ? 'rgba(70,40,110,0.95)' : 'rgba(40,26,66,0.88)'); g.addColorStop(1, 'rgba(16,10,30,0.92)');
    ctx.fillStyle = g; rr(ctx, c.x, c.y, c.w, c.h, 14); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = on ? (col || '#ffd84a') : 'rgba(255,255,255,0.16)'; ctx.lineWidth = on ? 2.5 : 1.2; ctx.stroke();
    ctx.restore();
  }
  drawPortrait(ctx, id, x, y, w, h, big) {
    ctx.save(); rr(ctx, x, y, w, h, 10); ctx.clip();
    const r = kartRacer(id);
    const g = ctx.createRadialGradient(x + w / 2, y + h * 0.4, 4, x + w / 2, y + h / 2, Math.max(w, h)); g.addColorStop(0, rgba(r.color, 0.55)); g.addColorStop(1, 'rgba(10,6,20,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    if (KartPortraits.has(id)) { KartPortraits.draw(ctx, id, x + w / 2, y + h / 2, Math.min(w, h * 1.05), this.t); ctx.restore(); return; }
    if (typeof CharArt !== 'undefined' && CharArt && CharArt.drawPortrait) { try { CharArt.drawPortrait(ctx, id, x + w / 2, y + h / 2, Math.min(w, h), this.t); ctx.restore(); return; } catch (e) { /* fall through */ } }
    if (id === 'brady') {
      const s = Math.min(w / 30, h / 52) * (big ? 0.95 : 1.05);
      ctx.translate(x + w / 2, y + h + s * (big ? 2 : 12)); ctx.scale(s, s);
      drawBrady(ctx, { x: 0, y: 0, facing: 1, small: false, power: 0, anim: this.anim, hair: null, look: Save.data.look, time: this.t });
    } else {
      const S = Math.min(w, h) * 1.12;
      ctx.drawImage(KartArt.portraitCanvas(id, 'bust', 192), x + w / 2 - S / 2, y + h - S * 0.92, S, S);
    }
    ctx.restore();
  }
  drawChar(ctx) {
    const W = Game.cssW, H = Game.cssH;
    kartText(ctx, 'CHOOSE YOUR DRIVER', W / 2, this.titleY(), Math.min(24, W * 0.055), '#ffffff', { glow: '#ff4fd8' });
    for (const c of this.cards) {
      const r = KART_RACERS[c.i], on = c.i === this.sel;
      this.drawCard(ctx, c, on, r.color);
      this.drawPortrait(ctx, r.id, c.x + 4, c.y + 4, c.w - 8, c.h - 24, false);
      kartText(ctx, r.name.toUpperCase(), c.x + c.w / 2, c.y + c.h - 11, Math.min(11, c.w * 0.11), on ? '#ffd84a' : '#ffffff', {});
    }
    // preview: rotating art car + stats
    const P = this.preview, r = KART_RACERS[this.sel];
    this.drawCard(ctx, P, true, r.color);
    const pose = KART_POSES[r.id] && Math.floor(this.t / 1.6) % 2 ? KART_POSES[r.id][0] : '';
    const reg = KartArt.atlas && KartArt.kart(r.id, Math.floor(this.t * 5) % KART_DIRS, pose);
    const ks = Math.min(P.h * 0.62, P.w * (this.portrait ? 0.42 : 0.62));
    const kx = this.portrait ? P.x + P.w * 0.27 : P.x + P.w / 2, ky = this.portrait ? P.y + P.h * 0.55 : P.y + ks * 0.55 + 8;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(kx, ky + ks * 0.18, ks * 0.4, ks * 0.1, 0, 0, TAU); ctx.fill();
    if (reg) ctx.drawImage(KartArt.atlas.c, reg.x, reg.y, reg.w, reg.h, kx - ks / 2, ky - ks * 0.62, ks, ks);
    else kartText(ctx, 'painting karts...', kx, ky, 12, 'rgba(255,255,255,0.7)', { ui: true, stroke: false });
    const tx = this.portrait ? P.x + P.w * 0.54 : P.x + 16, ty = this.portrait ? P.y + 22 : ky + ks * 0.3 + 14, tw = this.portrait ? P.w * 0.43 : P.w - 32;
    kartText(ctx, r.name.toUpperCase(), tx, ty, 18, r.color, { align: 'left' });
    ctx.font = `11px ${FONT_UI}`;
    const line = r.kart + '  ·  ' + r.tag, fits = ctx.measureText(line).width <= tw;
    if (fits) kartText(ctx, line, tx, ty + 20, 11, 'rgba(255,255,255,0.85)', { align: 'left', ui: true, stroke: false });
    else { kartText(ctx, r.kart, tx, ty + 20, 11, 'rgba(255,255,255,0.85)', { align: 'left', ui: true, stroke: false }); kartText(ctx, r.tag, tx, ty + 34, 11, 'rgba(255,255,255,0.7)', { align: 'left', ui: true, stroke: false }); }
    this.drawStatBars(ctx, r, tx, ty + (fits ? 44 : 56), Math.min(tw, 260));
  }
  drawCups(ctx) {
    const W = Game.cssW, ks = kartSave();
    kartText(ctx, 'GRAND PRIX  ·  PICK A CUP', W / 2, this.titleY(), Math.min(24, W * 0.055), '#ffffff', { glow: '#ff4fd8' });
    for (const c of this.cards) {
      const cup = KART_CUPS[c.i], on = c.i === this.cupSel;
      this.drawCard(ctx, c, on, cup.col);
      const tro = ks.trophies[cup.id];
      kartTrophy(ctx, c.x + c.w - 46, c.y + 50, tro ? 44 : 30, tro ? ['#ffd84a', '#dfe6f2', '#ffa65a'][tro - 1] : '#5a4a6a', cup.id, this.t);
      kartText(ctx, cup.name.toUpperCase(), c.x + 18, c.y + 30, Math.min(26, c.w * 0.08), cup.col, { align: 'left' });
      kartText(ctx, tro ? ['', 'GOLD TROPHY', 'SILVER TROPHY', 'BRONZE TROPHY'][tro] : 'No trophy yet', c.x + 18, c.y + 56, 11, tro ? '#ffd84a' : 'rgba(255,255,255,0.6)', { align: 'left', ui: true, stroke: false });
      const lh = Math.min(30, (c.h - 100) / 4);
      cup.tracks.forEach((id, i) => {
        const d = KART_TRACKS[id], y = c.y + 92 + i * lh;
        kartText(ctx, (i + 1) + '. ' + d.name, c.x + 22, y, Math.min(15, lh * 0.55), '#ffffff', { align: 'left', ui: true, stroke: false });
        kartText(ctx, KART_TOD[d.tod].label, c.x + c.w - 20, y, 10, 'rgba(255,255,255,0.6)', { align: 'right', stroke: false });
      });
      const ty = c.y + 92 + 4 * lh - 4, th = c.y + c.h - 34 - ty, tw = Math.min(th, (c.w - 40) / 4);
      if (tw > 24) cup.tracks.forEach((id, i) => { ctx.globalAlpha = on ? 1 : 0.7; ctx.drawImage(kartTrackThumb(id), c.x + c.w / 2 + (i - 2) * (tw + 4) + 2, ty, tw, tw); ctx.globalAlpha = 1; });
      kartText(ctx, 'TAP TO RACE ▶', c.x + c.w / 2, c.y + c.h - 18, 12, on ? '#ffd84a' : 'rgba(255,255,255,0.5)', {});
    }
  }
  titleY() { return this.portrait ? Math.max(78, insets.t + 72) : Math.max(32, insets.t + 28); }
  drawTracks(ctx) {
    const W = Game.cssW, ks = kartSave();
    kartText(ctx, 'TIME TRIAL  ·  PICK A TRACK', W / 2, this.titleY(), Math.min(24, W * 0.055), '#ffffff', { glow: '#ff4fd8' });
    for (const c of this.cards) {
      const d = KART_TRACKS[c.id], on = c.i === this.trackSel, cup = KART_CUPS.find(q => q.id === d.cup);
      this.drawCard(ctx, c, on, cup.col);
      const th = kartTrackThumb(c.id), ts = Math.min(c.h - 44, c.w * 0.62);
      ctx.drawImage(th, c.x + c.w / 2 - ts / 2, c.y + 6, ts, ts);
      kartText(ctx, d.name, c.x + c.w / 2, c.y + c.h - 30, Math.min(12, c.w * 0.065), '#ffffff', { ui: true });
      const b = ks.best[c.id];
      kartText(ctx, (b && b.total ? 'BEST ' + kartFmtTime(b.total) : KART_TOD[d.tod].label), c.x + c.w / 2, c.y + c.h - 13, 10, b ? '#ffd84a' : 'rgba(255,255,255,0.6)', { stroke: false });
    }
  }
}
// small cached top-down outline of a track for menus
function kartTrackThumb(id) {
  kartTrackThumb.cache = kartTrackThumb.cache || {};
  if (kartTrackThumb.cache[id]) return kartTrackThumb.cache[id];
  const T = new KartTrack(KART_TRACKS[id]), S = 160, c = makeCanvas(S, S), x = c.getContext('2d');
  const sc = S / (Math.max(T.bounds.x1 - T.bounds.x0, T.bounds.z1 - T.bounds.z0) * 1.18), ox = S / 2 - T.cx * sc, oz = S / 2 - T.cz * sc;
  const path = () => { x.beginPath(); for (let i = 0; i <= T.N; i += 4) { const j = i % T.N; i ? x.lineTo(ox + T.X[j] * sc, oz + T.Z[j] * sc) : x.moveTo(ox + T.X[j] * sc, oz + T.Z[j] * sc); } x.closePath(); };
  x.lineJoin = 'round';
  const tod = KART_TOD[KART_TRACKS[id].tod];
  path(); x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 12; x.stroke();
  path(); x.strokeStyle = tod.glow > 0.6 ? '#ff6ae0' : '#ffd84a'; x.lineWidth = 7; x.stroke();
  path(); x.strokeStyle = '#ffffff'; x.lineWidth = 2.5; x.stroke();
  const a = T.at(0, {}); x.fillStyle = '#7aff8a'; x.beginPath(); x.arc(ox + a.x * sc, oz + a.z * sc, 5, 0, TAU); x.fill();
  return (kartTrackThumb.cache[id] = c);
}

window.BRADY_KART = { KartMenuScene, KartRaceScene };
