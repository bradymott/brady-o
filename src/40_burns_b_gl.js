/* ============================================================
   BRADY-O BURNS — WebGL renderer
   One offscreen canvas (WebGL2 preferred, WebGL1 fallback) composited
   into the 2D game canvas. Programs:
     sky     full-screen gradient, sun/moon, stars, mountains, city glow
     ground  height-field playa: painted albedo + crack detail + lightmap
     mesh    merged static geometry (vertex colour, atlas decal, emissive)
     skin    rigid-skinned meshes: characters, vehicles, pickups, movers
             (one draw call per instance, up to maxBones rigid parts)
     sprite  billboards/flat quads: glows, particles, blob shadows, rings
   Vertex format (24 bytes) shared by mesh + skin:
     0 pos f32x3 | 12 normal i8x3 + bone u8 | 16 colour u8x4 (a = emissive) | 20 uv u16x2
   ============================================================ */

const BURNS_GLSL_LIGHT = `
uniform vec3 uSky, uGnd, uKeyD, uKeyC, uFogC, uCam;
uniform vec4 uFog;
uniform vec4 uLm;
uniform sampler2D uLight;
uniform vec4 uPL[4];
uniform vec3 uPC[4];
uniform float uTrip, uTime, uEmB;
vec3 bLight(vec3 n, vec3 w, float wr) {
  vec3 L = mix(uGnd, uSky, n.y * 0.5 + 0.5);
  L += uKeyC * max((dot(n, uKeyD) + wr) / (1.0 + wr), 0.0);
  vec3 lm = texture2D(uLight, (w.xz - uLm.xy) * uLm.zw).rgb;
  L += lm * (1.5 * exp(-max(w.y, 0.0) * 0.14)) * (0.75 + 0.25 * max(n.y, 0.0));
  for (int i = 0; i < 4; i++) {
    vec3 d = uPL[i].xyz - w; float dl = length(d);
    float a = max(1.0 - dl / uPL[i].w, 0.0);
    L += uPC[i] * (a * a) * (0.35 + 0.65 * max(dot(n, d / (dl + 0.0001)), 0.0));
  }
  return L;
}
vec3 bSpec(vec3 n, vec3 w, float g) {
  vec3 v = normalize(uCam - w);
  vec3 h = normalize(uKeyD + v);
  float nh = max(dot(n, h), 0.0);
  float s = pow(nh, 8.0 + g * g * 100.0) * (0.12 + 0.6 * g) * smoothstep(-0.05, 0.2, dot(n, uKeyD));
  float f = pow(1.0 - max(dot(n, v), 0.0), 3.0) * g * 0.3;
  return uKeyC * s + mix(uGnd, uSky, n.y * 0.5 + 0.5) * f;
}
float bFog(vec3 w, float e) {
  float d = length(w - uCam);
  float f = (1.0 - exp(-d * uFog.x)) * mix(1.0, exp(-max(w.y, 0.0) * uFog.y), 0.65);
  return min(f, uFog.w) * (1.0 - e * uFog.z);
}
vec3 bTrip(vec3 c, vec3 w) {
  float a = uTime * 1.7 + w.x * 0.07 + w.z * 0.05 + w.y * 0.12;
  vec3 k = vec3(0.57735);
  float ca = cos(a);
  vec3 r = c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
  return mix(c, r * 1.3 + vec3(0.04, 0.0, 0.08), uTrip);
}
`;

const BurnsGL = {
  canvas: null, gl: null, gl2: false, failed: false, lost: false, gen: 0, progs: null, maxBones: 32,
  failReason: '',
  init() {
    if (this.gl) return !this.lost;
    if (this.failed) return false;
    try {
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      const opts = { alpha: false, antialias: true, depth: true, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' };
      let gl = null;
      if (!window.__burnsForceGL1) { try { gl = c.getContext('webgl2', opts); } catch (e) { gl = null; } }
      this.gl2 = !!gl;
      if (!gl) gl = c.getContext('webgl', opts) || c.getContext('experimental-webgl', opts);
      if (!gl || window.__burnsNoGL) { this.failed = true; this.failReason = 'nogl'; return false; }
      this.canvas = c; this.gl = gl;
      c.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; }, false);
      c.addEventListener('webglcontextrestored', () => { try { this.setup(); this.lost = false; } catch (e) { console.error(e); } }, false);
      this.setup();
      return true;
    } catch (e) { console.error(e); this.failed = true; this.failReason = String(e && e.message || e); this.gl = null; return false; }
  },
  setup() {
    const gl = this.gl;
    this.gen++;
    this.enabled = [false, false, false, false, false, false];
    this.aniso = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
    this.maxAniso = this.aniso ? gl.getParameter(this.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;
    const vuv = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) || 128;
    this.maxBones = Math.max(16, Math.min(64, Math.floor((vuv - 40) / 3)));
    const MB = this.maxBones;
    const A = ['aPos', 'aNrm', 'aBone', 'aCol', 'aUV'];
    this.progs = {
      sky: this.program(`attribute vec2 aPos; varying vec2 vN; void main(){ vN = aPos; gl_Position = vec4(aPos, 0.99995, 1.0); }`,
        `precision highp float;
varying vec2 vN;
uniform vec3 uF, uR, uU, uTan;
uniform vec3 uZen, uHor, uFogC, uSunD, uSunC, uMoonD, uMtnC, uCityD, uCityC;
uniform vec4 uSkyK, uCloud, uMid;
uniform vec3 uCloudC;
uniform float uTime, uHaze, uTrip;
float h3(vec3 p){ p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float h2(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float n2(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){
  vec3 d = normalize(uF + uR * (vN.x * uTan.x) + uU * ((vN.y - uTan.z) * uTan.y));
  float el = asin(clamp(d.y, -1.0, 1.0));
  float az = atan(d.x, d.z);
  float gy = pow(clamp(el / 1.25, 0.0, 1.0), 0.55);
  vec3 col = mix(uHor, uZen, gy);
  col = mix(col, uMid.rgb, uMid.a * (1.0 - abs(gy * 2.0 - 1.0)));
  float sd = max(dot(d, uSunD), 0.0);
  col += uSunC * (pow(sd, 7.0) * 0.32 + pow(sd, 60.0) * 0.55);
  col = mix(col, uSunC * 1.25 + vec3(0.12), smoothstep(1.0 - uSkyK.x, 1.0 - uSkyK.x * 0.7, sd));
  if (uSkyK.y > 0.0) {
    float md = max(dot(d, uMoonD), 0.0);
    col += vec3(0.55, 0.6, 0.8) * (pow(md, 220.0) * 0.5 + pow(md, 18.0) * 0.06) * uSkyK.y;
    col = mix(col, vec3(0.97, 0.95, 0.86), smoothstep(0.99952, 0.99968, md) * uSkyK.y);
  }
  if (uSkyK.z > 0.0 && el > 0.0) {
    vec3 p = d * 190.0; vec3 cell = floor(p); float h = h3(cell);
    if (h > 0.885) {
      vec3 c = cell + 0.5 + (vec3(h3(cell + 7.1), h3(cell + 3.3), h3(cell + 9.7)) - 0.5) * 0.7;
      float s = smoothstep(0.34, 0.0, length(p - c));
      float tw = 0.6 + 0.4 * sin(uTime * (1.3 + h * 4.0) + h * 50.0);
      col += mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.9, 0.8), h3(cell + 1.7)) * s * tw * uSkyK.z * smoothstep(0.02, 0.3, el) * (h - 0.885) * 9.0;
    }
    float band = exp(-pow(d.x * 0.8 + d.y * 0.55 - d.z * 0.3, 2.0) * 9.0);
    col += vec3(0.16, 0.12, 0.24) * band * uSkyK.z * smoothstep(0.05, 0.5, el) * 0.6;
  }
  if (uCloud.x > 0.0 && el > 0.0) {
    vec2 cp = d.xz / (d.y + 0.12) * uCloud.y + vec2(uTime * uCloud.z, uTime * uCloud.z * 0.37);
    float cn = n2(cp) * 0.55 + n2(cp * 2.13 + 3.7) * 0.3 + n2(cp * 4.37 + 9.1) * 0.15;
    float ca = smoothstep(0.48, 0.8, cn) * smoothstep(0.0, 0.22, el) * uCloud.x;
    vec3 cc = uCloudC * (0.82 + 0.3 * smoothstep(0.5, 0.85, cn)) + uSunC * pow(sd, 5.0) * 0.35;
    col = mix(col, cc, ca);
  }
  vec3 hd = normalize(vec3(d.x, 0.0001, d.z));
  float cg = max(dot(hd, uCityD), 0.0);
  col += uCityC * pow(cg, 5.0) * exp(-max(el, 0.0) * 10.0);
  col = mix(col, uFogC, uHaze * (1.0 - smoothstep(0.0, 0.3, el)));
  float m = uSkyK.w * (0.55 + 0.24 * sin(az * 3.0 + 1.3) + 0.12 * sin(az * 7.0 + 0.4) + 0.06 * sin(az * 19.0 + 2.1) + 0.03 * sin(az * 43.0));
  if (el < m) col = mix(uMtnC, uFogC, clamp(1.0 - (m - el) / max(m, 0.001) * 1.2, 0.0, 1.0) * 0.55);
  if (el < 0.0) col = uFogC;
  if (uTrip > 0.0) { float a = uTime * 0.9 + az * 2.0; col = mix(col, col.gbr * 1.2 + 0.05 * vec3(sin(a), sin(a + 2.0), sin(a + 4.0)), uTrip * 0.6); }
  gl_FragColor = vec4(col, 1.0);
}`, ['aPos']),
      ground: this.program(`attribute vec3 aPos; attribute vec3 aNrm;
uniform mat4 uVP; uniform vec4 uPaintXf;
varying vec3 vW; varying vec3 vN; varying vec2 vP;
void main(){ vW = aPos; vN = aNrm; vP = (aPos.xz - uPaintXf.xy) * uPaintXf.zw; gl_Position = uVP * vec4(aPos, 1.0); }`,
        `precision highp float;
varying vec3 vW; varying vec3 vN; varying vec2 vP;
uniform sampler2D uPaint, uDet;
uniform vec4 uDetK;
uniform vec3 uGround;
${BURNS_GLSL_LIGHT}
void main(){
  vec3 n = normalize(vN);
  vec4 p = texture2D(uPaint, vP);
  vec3 alb = uGround * (1.0 - p.a) + p.rgb;
  float dist = length(vW - uCam);
  float fade = clamp(1.5 - dist / 55.0, 0.0, 1.0);
  vec4 d1 = texture2D(uDet, vW.xz * uDetK.x);
  vec4 d2 = texture2D(uDet, vW.xz * uDetK.z);
  alb *= 1.0 - d1.r * uDetK.y * fade;
  alb *= 1.0 + (d2.g - 0.5) * uDetK.w;
  alb *= 0.95 + d1.b * 0.1 * fade;
  vec3 c = alb * bLight(n, vW, 0.0);
  if (uTrip > 0.0) c = bTrip(c, vW);
  gl_FragColor = vec4(mix(c, uFogC, bFog(vW, 0.0)), 1.0);
}`, ['aPos', 'aNrm']),
      mesh: this.program(`attribute vec3 aPos; attribute vec3 aNrm; attribute float aBone; attribute vec4 aCol; attribute vec2 aUV;
uniform mat4 uVP;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec2 vT; varying float vG;
void main(){ vW = aPos; vN = aNrm; vC = aCol; vT = aUV; vG = floor(aBone / 64.0 + 0.01) / 3.0; gl_Position = uVP * vec4(aPos, 1.0); }`,
        `precision highp float;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec2 vT; varying float vG;
uniform sampler2D uTex;
uniform float uAlphaK;
${BURNS_GLSL_LIGHT}
void main(){
  vec4 t = texture2D(uTex, vT);
  vec3 alb = vC.rgb * (1.0 - t.a) + t.rgb;
  vec3 n = normalize(vN);
  float e = vC.a;
  vec3 c = mix(alb * bLight(n, vW, 0.25), alb * uEmB, e);
  if (vG > 0.0) c += bSpec(n, vW, vG) * (1.0 - e);
  if (uTrip > 0.0) c = bTrip(c, vW);
  gl_FragColor = vec4(mix(c, uFogC, bFog(vW, e)) * uAlphaK, uAlphaK);
}`, A),
      skin: this.program(`#define MAXB ${MB}
attribute vec3 aPos; attribute vec3 aNrm; attribute float aBone; attribute vec4 aCol; attribute vec2 aUV;
uniform mat4 uVP; uniform vec4 uB[MAXB * 3]; uniform vec3 uFace;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec2 vT; varying float vG;
void main(){
  int i = int(mod(aBone, 64.0) + 0.5) * 3;
  vG = floor(aBone / 64.0 + 0.01) / 3.0;
  vec4 r0 = uB[i]; vec4 r1 = uB[i + 1]; vec4 r2 = uB[i + 2];
  vec4 p = vec4(aPos, 1.0);
  vW = vec3(dot(r0, p), dot(r1, p), dot(r2, p));
  vN = vec3(dot(r0.xyz, aNrm), dot(r1.xyz, aNrm), dot(r2.xyz, aNrm));
  vC = aCol; vT = aUV;
  if (aUV.y >= uFace.x && aUV.y < uFace.y) vT.y += uFace.z;
  gl_Position = uVP * vec4(vW, 1.0);
}`,
        `precision highp float;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec2 vT; varying float vG;
uniform sampler2D uTex;
uniform vec4 uTint; uniform vec3 uRimC; uniform float uRim;
${BURNS_GLSL_LIGHT}
void main(){
  vec4 t = texture2D(uTex, vT);
  vec3 alb = vC.rgb * (1.0 - t.a) + t.rgb;
  vec3 n = normalize(vN);
  float e = vC.a;
  vec3 c = mix(alb * bLight(n, vW, 0.4), alb * uEmB, e);
  if (vG > 0.0) c += bSpec(n, vW, vG) * (1.0 - e);
  vec3 v = normalize(uCam - vW);
  c += uRimC * pow(1.0 - max(dot(n, v), 0.0), 2.5) * uRim;
  c = mix(c, uTint.rgb, uTint.a);
  if (uTrip > 0.0) c = bTrip(c, vW);
  gl_FragColor = vec4(mix(c, uFogC, bFog(vW, e)), 1.0);
}`, A),
      sprite: this.program(`attribute vec3 aPos; attribute vec2 aNrm; attribute vec2 aBone; attribute vec4 aCol;
uniform mat4 uVP; uniform vec3 uR, uU, uCam; uniform vec4 uFog; uniform float uFlat;
varying vec2 vT; varying vec4 vC; varying float vF;
void main(){
  vec3 p = uFlat > 0.5 ? aPos + vec3(aNrm.x, 0.0, aNrm.y) : aPos + uR * aNrm.x + uU * aNrm.y;
  float d = length(p - uCam);
  vF = min(1.0 - exp(-d * uFog.x), uFog.w) * 0.9;
  vT = aBone; vC = aCol;
  gl_Position = uVP * vec4(p, 1.0);
}`,
        `precision mediump float;
uniform sampler2D uTex; uniform vec3 uFogC;
varying vec2 vT; varying vec4 vC; varying float vF;
void main(){
  vec4 c = texture2D(uTex, vT) * vC;
  if (c.a + c.r + c.g + c.b < 0.003) discard;
  gl_FragColor = vec4(mix(c.rgb, uFogC * c.a, vF), c.a);
}`, ['aPos', 'aNrm', 'aBone', 'aCol'])
    };
    this.fsBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fsBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.MAXQ = 8000;
    const idx = new Uint16Array(this.MAXQ * 6);
    for (let i = 0; i < this.MAXQ; i++) { const v = i * 4, o = i * 6; idx[o] = v; idx[o + 1] = v + 1; idx[o + 2] = v + 2; idx[o + 3] = v; idx[o + 4] = v + 2; idx[o + 5] = v + 3; }
    this.quadIdx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quadIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    this.spriteBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.MAXQ * 4 * 32, gl.DYNAMIC_DRAW);
    this.black = this.rawTexture(2, 2, new Uint8Array(16));
  },
  program(vs, fs, attribs) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error('burns shader: ' + gl.getShaderInfoLog(s) + '\n' + src.split('\n').slice(0, 3).join('\n'));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    attribs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error('burns link: ' + gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) || 0;
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  },
  rawTexture(w, h, data) {
    const gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  },
  // Managed texture: { src: canvas, opts, tex, gen }. Re-uploaded after context loss or when src.dirty.
  tex(T) {
    const gl = this.gl;
    if (T.tex && T.gen === this.gen && !T.dirty) return T.tex;
    if (!T.tex || T.gen !== this.gen) T.tex = gl.createTexture();
    T.gen = this.gen; T.dirty = false;
    const o = T.opts || {};
    gl.bindTexture(gl.TEXTURE_2D, T.tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, o.premult ? 1 : 0);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, T.src);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
    const wrap = o.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const pot = (T.src.width & (T.src.width - 1)) === 0 && (T.src.height & (T.src.height - 1)) === 0;
    if (o.mips && (pot || this.gl2)) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
    else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    if (o.aniso && this.aniso) gl.texParameterf(gl.TEXTURE_2D, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(o.aniso, this.maxAniso));
    return T.tex;
  },
  // Managed geometry: { data: ArrayBuffer, idx: Uint16Array, count, vbo, ibo, gen }
  geo(G) {
    const gl = this.gl;
    if (G.vbo && G.gen === this.gen && !G.dirty) return G;
    if (!G.vbo || G.gen !== this.gen) { G.vbo = gl.createBuffer(); G.ibo = gl.createBuffer(); }
    G.gen = this.gen; G.dirty = false;
    gl.bindBuffer(gl.ARRAY_BUFFER, G.vbo); gl.bufferData(gl.ARRAY_BUFFER, G.data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, G.ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, G.idx, gl.STATIC_DRAW);
    return G;
  },
  freeGeo(G) {
    if (!G || !this.gl || G.gen !== this.gen) return;
    try { this.gl.deleteBuffer(G.vbo); this.gl.deleteBuffer(G.ibo); } catch (e) { /* ignore */ }
    G.vbo = G.ibo = null; G.gen = -1;
  },
  freeTex(T) {
    if (!T || !this.gl || T.gen !== this.gen) return;
    try { this.gl.deleteTexture(T.tex); } catch (e) { /* ignore */ }
    T.tex = null; T.gen = -1;
  },
  enable(n) {
    const gl = this.gl;
    for (let i = 0; i < 6; i++) {
      const want = i < n;
      if (want !== this.enabled[i]) { if (want) gl.enableVertexAttribArray(i); else gl.disableVertexAttribArray(i); this.enabled[i] = want; }
    }
  },
  layoutMesh() { // 24-byte vertex
    const gl = this.gl;
    this.enable(5);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(1, 3, gl.BYTE, true, 24, 12);
    gl.vertexAttribPointer(2, 1, gl.UNSIGNED_BYTE, false, 24, 15);
    gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 24, 16);
    gl.vertexAttribPointer(4, 2, gl.UNSIGNED_SHORT, true, 24, 20);
  },
  layoutGround() { // 16-byte vertex: pos f32x3, normal i8x4
    const gl = this.gl;
    this.enable(2);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(1, 3, gl.BYTE, true, 16, 12);
  },
  layoutSprite() { // 32-byte vertex: centre f32x3, offset f32x2, uv f32x2, colour u8x4
    const gl = this.gl;
    this.enable(4);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 32, 12);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 20);
    gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 32, 28);
  }
};

/* ---------------- sprite batch (billboards + flat ground quads) ----------------
   Colours are premultiplied: an additive sprite has alpha 0, an alpha sprite has rgb*a. */
class BurnsSpriteBatch {
  constructor(max) {
    this.max = max; this.n = 0;
    this.rec = new Float32Array(max * 16);   // cx cy cz ax ay bx by u0 v0 u1 v1 r g b a depth
    this.order = new Uint32Array(max);
    this.keys = new Float32Array(max);
    this.buf = new ArrayBuffer(max * 4 * 32); this.f = new Float32Array(this.buf); this.u8 = new Uint8Array(this.buf);
  }
  reset(B) { this.n = 0; this.B = B; }
  // generic quad: centre, axis a (2D), axis b (2D); reg = {u0,v0,u1,v1}
  quad(x, y, z, ax, ay, bx, by, reg, r, g, b, a) {
    if (this.n >= this.max) return;
    const o = this.n * 16, R = this.rec;
    R[o] = x; R[o + 1] = y; R[o + 2] = z; R[o + 3] = ax; R[o + 4] = ay; R[o + 5] = bx; R[o + 6] = by;
    R[o + 7] = reg.u0; R[o + 8] = reg.v0; R[o + 9] = reg.u1; R[o + 10] = reg.v1;
    R[o + 11] = r; R[o + 12] = g; R[o + 13] = b; R[o + 14] = a;
    const B = this.B;
    R[o + 15] = B ? (x - B.ex) * B.fx + (y - B.ey) * B.fy + (z - B.ez) * B.fz : 0;
    this.n++;
  }
  // camera-facing sprite. w,h = full size. rot in radians. add = additive (true) or alpha.
  bb(x, y, z, w, h, reg, col, alpha, add, rot) {
    const hw = w / 2, hh = h / 2;
    let ax = hw, ay = 0, bx = 0, by = hh;
    if (rot) { const c = Math.cos(rot), s = Math.sin(rot); ax = c * hw; ay = s * hw; bx = -s * hh; by = c * hh; }
    if (add) this.quad(x, y, z, ax, ay, bx, by, reg, col[0] * alpha, col[1] * alpha, col[2] * alpha, 0);
    else this.quad(x, y, z, ax, ay, bx, by, reg, col[0] * alpha, col[1] * alpha, col[2] * alpha, alpha);
  }
  // flat on the ground (XZ plane), rotated by yaw
  flat(x, y, z, w, d, yaw, reg, col, alpha, add) {
    const c = Math.cos(yaw), s = Math.sin(yaw), hw = w / 2, hd = d / 2;
    // local x axis -> world (cos, -sin), local z axis -> world (sin, cos)   (yaw convention)
    const ax = c * hw, ay = -s * hw, bx = s * hd, by = c * hd;
    if (add) this.quad(x, y, z, ax, ay, bx, by, reg, col[0] * alpha, col[1] * alpha, col[2] * alpha, 0);
    else this.quad(x, y, z, ax, ay, bx, by, reg, col[0] * alpha, col[1] * alpha, col[2] * alpha, alpha);
  }
  // a streak along a 3D velocity (projected into the camera plane)
  streak(x, y, z, vx, vy, vz, len, w, reg, col, alpha) {
    const B = this.B; if (!B) return;
    let px = vx * B.rx + vy * B.ry + vz * B.rz, py = vx * B.ux + vy * B.uy + vz * B.uz;
    const l = Math.hypot(px, py) || 1; px /= l; py /= l;
    this.quad(x, y, z, -py * w / 2, px * w / 2, px * len / 2, py * len / 2, reg, col[0] * alpha, col[1] * alpha, col[2] * alpha, 0);
  }
  // write vertex data (sorted back to front when sort=true); returns quad count
  build(sort) {
    const n = this.n, R = this.rec, f = this.f, u8 = this.u8;
    const ord = this.order;
    for (let i = 0; i < n; i++) ord[i] = i;
    if (sort && n > 1) {
      const K = this.keys;
      for (let i = 0; i < n; i++) K[i] = R[i * 16 + 15];
      const arr = Array.prototype.slice.call(ord.subarray(0, n));
      arr.sort((a, b) => K[b] - K[a]);
      for (let i = 0; i < n; i++) ord[i] = arr[i];
    }
    for (let k = 0; k < n; k++) {
      const o = ord[k] * 16;
      const cx = R[o], cy = R[o + 1], cz = R[o + 2], ax = R[o + 3], ay = R[o + 4], bx = R[o + 5], by = R[o + 6];
      const u0 = R[o + 7], v0 = R[o + 8], u1 = R[o + 9], v1 = R[o + 10];
      const cr = clamp(R[o + 11] * 255, 0, 255) | 0, cg = clamp(R[o + 12] * 255, 0, 255) | 0, cb = clamp(R[o + 13] * 255, 0, 255) | 0, ca = clamp(R[o + 14] * 255, 0, 255) | 0;
      for (let c = 0; c < 4; c++) {
        const sa = c === 0 || c === 3 ? -1 : 1, sb = c < 2 ? -1 : 1;
        const v = (k * 4 + c) * 8;
        f[v] = cx; f[v + 1] = cy; f[v + 2] = cz;
        f[v + 3] = ax * sa + bx * sb; f[v + 4] = ay * sa + by * sb;
        f[v + 5] = sa < 0 ? u0 : u1; f[v + 6] = sb < 0 ? v1 : v0;
        const b = v * 4 + 28; u8[b] = cr; u8[b + 1] = cg; u8[b + 2] = cb; u8[b + 3] = ca;
      }
    }
    return n;
  }
}

/* ---------------- renderer ---------------- */
class BurnsRenderer {
  constructor() {
    this.P = new Float32Array(16); this.V = new Float32Array(16); this.VP = new Float32Array(16); this.B = {};
    this.planes = new Float32Array(24);
    this.pl = new Float32Array(16); this.pc = new Float32Array(12);
    this.flat = new BurnsSpriteBatch(1500);
    this.bbs = new BurnsSpriteBatch(5000);
    this.stats = { draws: 0, tris: 0 };
    this.w = 1; this.h = 1;
  }
  resize(w, h) {
    const c = BurnsGL.canvas;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    this.w = w; this.h = h;
  }
  // cam: {x,y,z, tx,ty,tz, fov (vertical, rad), shift (NDC lens shift), near, far, roll}
  setCamera(cam) {
    this.cam = cam;
    const asp = this.w / this.h;
    BurnsM.persp(this.P, cam.fov, asp, cam.near || 0.15, cam.far || 1400, cam.shift || 0);
    BurnsM.lookAt(this.V, this.B, cam.x, cam.y, cam.z, cam.tx, cam.ty, cam.tz);
    if (cam.roll) {
      // roll the view around its forward axis
      const c = Math.cos(cam.roll), s = Math.sin(cam.roll), V = this.V;
      for (let k = 0; k < 4; k++) { const a = V[k * 4], b = V[k * 4 + 1]; V[k * 4] = c * a - s * b; V[k * 4 + 1] = s * a + c * b; }
      const B = this.B, rx = B.rx, ry = B.ry, rz = B.rz;
      B.rx = c * rx + s * B.ux; B.ry = c * ry + s * B.uy; B.rz = c * rz + s * B.uz;
      B.ux = -s * rx + c * B.ux; B.uy = -s * ry + c * B.uy; B.uz = -s * rz + c * B.uz;
    }
    BurnsM.mul4(this.VP, this.P, this.V);
    BurnsM.planes(this.planes, this.VP);
    this.asp = asp; this.tanY = Math.tan(cam.fov / 2); this.tanX = this.tanY * asp;
    this.flat.reset(this.B); this.bbs.reset(this.B);
  }
  // world -> CSS px on a viewport (vw x vh); returns false if behind the camera
  project(x, y, z, vw, vh, out) {
    const m = this.VP;
    const cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cw = m[3] * x + m[7] * y + m[11] * z + m[15];
    if (cw < 0.05) return false;
    out.x = (cx / cw * 0.5 + 0.5) * vw; out.y = (1 - (cy / cw * 0.5 + 0.5)) * vh; out.w = cw;
    return true;
  }
  setLights(list) {
    const pl = this.pl, pc = this.pc;
    for (let i = 0; i < 4; i++) {
      const L = list && list[i];
      if (L) { pl[i * 4] = L.x; pl[i * 4 + 1] = L.y; pl[i * 4 + 2] = L.z; pl[i * 4 + 3] = Math.max(0.01, L.r); pc[i * 3] = L.c[0] * (L.i || 1); pc[i * 3 + 1] = L.c[1] * (L.i || 1); pc[i * 3 + 2] = L.c[2] * (L.i || 1); }
      else { pl[i * 4] = 0; pl[i * 4 + 1] = -9999; pl[i * 4 + 2] = 0; pl[i * 4 + 3] = 0.01; pc[i * 3] = pc[i * 3 + 1] = pc[i * 3 + 2] = 0; }
    }
  }
  begin() {
    const gl = BurnsGL.gl;
    gl.viewport(0, 0, this.w, this.h);
    gl.disable(gl.SCISSOR_TEST);
    gl.depthMask(true); gl.clearDepth(1); gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.frontFace(gl.CCW);
    this.stats.draws = 0; this.stats.tris = 0;
  }
  // common lighting uniforms
  applyEnv(p, env, world) {
    const gl = BurnsGL.gl, u = p.u, cam = this.cam;
    if (u.uVP) gl.uniformMatrix4fv(u.uVP, false, this.VP);
    if (u.uCam) gl.uniform3f(u.uCam, cam.x, cam.y, cam.z);
    if (u.uSky) gl.uniform3fv(u.uSky, env.sky);
    if (u.uGnd) gl.uniform3fv(u.uGnd, env.gnd);
    if (u.uKeyD) gl.uniform3fv(u.uKeyD, env.keyDir);
    if (u.uKeyC) gl.uniform3fv(u.uKeyC, env.keyCol);
    if (u.uFogC) gl.uniform3fv(u.uFogC, env.fogCol);
    if (u.uFog) gl.uniform4f(u.uFog, env.fogD, env.fogH, env.fogE, env.fogMax);
    if (u.uTrip) gl.uniform1f(u.uTrip, env.trip || 0);
    if (u.uTime) gl.uniform1f(u.uTime, env.time || 0);
    if (u.uEmB) gl.uniform1f(u.uEmB, env.emB || 1.4);
    if (u.uPL) gl.uniform4fv(u.uPL, this.pl);
    if (u.uPC) gl.uniform3fv(u.uPC, this.pc);
    if (u.uLm) {
      const lm = world && world.lightmap;
      if (lm) gl.uniform4f(u.uLm, lm.x0, lm.z0, 1 / lm.w, 1 / lm.d); else gl.uniform4f(u.uLm, 0, 0, 0, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, lm ? BurnsGL.tex(lm.T) : BurnsGL.black); gl.uniform1i(u.uLight, 1);
      gl.activeTexture(gl.TEXTURE0);
    }
  }
  sky(env) {
    const gl = BurnsGL.gl, p = BurnsGL.progs.sky, u = p.u, B = this.B;
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
    gl.useProgram(p.p);
    gl.bindBuffer(gl.ARRAY_BUFFER, BurnsGL.fsBuf); BurnsGL.enable(1); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.uniform3f(u.uF, B.fx, B.fy, B.fz); gl.uniform3f(u.uR, B.rx, B.ry, B.rz); gl.uniform3f(u.uU, B.ux, B.uy, B.uz);
    gl.uniform3f(u.uTan, this.tanX, this.tanY, this.cam.shift || 0);
    gl.uniform3fv(u.uZen, env.zen); gl.uniform3fv(u.uHor, env.hor); gl.uniform3fv(u.uFogC, env.fogCol);
    gl.uniform3fv(u.uSunD, env.sunDir); gl.uniform3fv(u.uSunC, env.sunCol); gl.uniform3fv(u.uMoonD, env.moonDir);
    gl.uniform3fv(u.uMtnC, env.mtnCol); gl.uniform3fv(u.uCityD, env.cityDir); gl.uniform3fv(u.uCityC, env.cityCol);
    gl.uniform4f(u.uSkyK, env.sunSize, env.moon, env.stars, env.mtnH);
    const cl = env.cloudCol || env.hor, mid = env.mid;
    gl.uniform4f(u.uCloud, env.clouds || 0, env.cloudScale || 0.55, env.cloudSpeed === undefined ? 0.012 : env.cloudSpeed, 0);
    gl.uniform3f(u.uCloudC, cl[0], cl[1], cl[2]);
    if (mid) gl.uniform4f(u.uMid, mid[0], mid[1], mid[2], env.midK || 0); else gl.uniform4f(u.uMid, 0, 0, 0, 0);
    gl.uniform1f(u.uTime, env.time || 0); gl.uniform1f(u.uHaze, env.haze); gl.uniform1f(u.uTrip, env.trip || 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.stats.draws++;
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.depthFunc(gl.LEQUAL); gl.enable(gl.CULL_FACE);
  }
  ground(G, env, world) {
    if (!G) return;
    const gl = BurnsGL.gl, p = BurnsGL.progs.ground, u = p.u;
    gl.useProgram(p.p);
    this.applyEnv(p, env, world);
    gl.uniform4f(u.uPaintXf, G.px0, G.pz0, 1 / G.pw, 1 / G.pd);
    gl.uniform4f(u.uDetK, G.crackScale, G.crackK, G.mottleScale, G.mottleK);
    gl.uniform3fv(u.uGround, G.base);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, BurnsGL.tex(G.paintT)); gl.uniform1i(u.uPaint, 2);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, BurnsGL.tex(G.detT)); gl.uniform1i(u.uDet, 3);
    gl.activeTexture(gl.TEXTURE0);
    for (const g of G.geos) {
      BurnsGL.geo(g);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.vbo); BurnsGL.layoutGround();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ibo);
      gl.drawElements(gl.TRIANGLES, g.count, gl.UNSIGNED_SHORT, 0);
      this.stats.draws++; this.stats.tris += g.count / 3;
    }
  }
  // static merged chunks, frustum + distance culled
  statics(chunks, env, world, atlasT, maxDist, alphaK) {
    const gl = BurnsGL.gl, p = BurnsGL.progs.mesh, u = p.u, P = this.planes, cam = this.cam;
    gl.useProgram(p.p);
    this.applyEnv(p, env, world);
    gl.uniform1f(u.uAlphaK, alphaK === undefined ? 1 : alphaK);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, BurnsGL.tex(atlasT)); gl.uniform1i(u.uTex, 0);
    const md2 = maxDist * maxDist;
    for (const c of chunks) {
      const b = c.bounds;
      const dx = Math.max(b[0] - cam.x, 0, cam.x - b[3]), dz = Math.max(b[2] - cam.z, 0, cam.z - b[5]);
      if (dx * dx + dz * dz > md2 && !c.always) continue;
      if (!BurnsM.boxVisible(P, b[0], b[1], b[2], b[3], b[4], b[5])) continue;
      BurnsGL.geo(c);
      gl.bindBuffer(gl.ARRAY_BUFFER, c.vbo); BurnsGL.layoutMesh();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, c.ibo);
      gl.drawElements(gl.TRIANGLES, c.count, gl.UNSIGNED_SHORT, 0);
      this.stats.draws++; this.stats.tris += c.count / 3;
    }
  }
  skinBegin(env, world, atlasT) {
    const gl = BurnsGL.gl, p = BurnsGL.progs.skin, u = p.u;
    gl.useProgram(p.p);
    this.applyEnv(p, env, world);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, BurnsGL.tex(atlasT)); gl.uniform1i(u.uTex, 0);
    gl.uniform3fv(u.uRimC, env.rimCol || [0.5, 0.45, 0.7]);
    this.faceV0 = BURNS_ATLAS.faceV0; this.faceV1 = BURNS_ATLAS.faceV1; this.faceRowV = BURNS_ATLAS.faceRowV;
    this._lastTint = null;
  }
  // geo: skinned geometry; bones: Float32Array (n*12); tint [r,g,b,a]; face row 0..3
  skin(geo, bones, n, tint, face, rim) {
    const gl = BurnsGL.gl, u = BurnsGL.progs.skin.u;
    BurnsGL.geo(geo);
    gl.uniform4fv(u.uB, n * 12 === bones.length ? bones : bones.subarray(0, n * 12));
    if (tint) gl.uniform4f(u.uTint, tint[0], tint[1], tint[2], tint[3]); else gl.uniform4f(u.uTint, 0, 0, 0, 0);
    gl.uniform3f(u.uFace, this.faceV0, this.faceV1, (face || 0) * this.faceRowV);
    gl.uniform1f(u.uRim, rim === undefined ? 0.35 : rim);
    gl.bindBuffer(gl.ARRAY_BUFFER, geo.vbo); BurnsGL.layoutMesh();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geo.ibo);
    gl.drawElements(gl.TRIANGLES, geo.count, gl.UNSIGNED_SHORT, 0);
    this.stats.draws++; this.stats.tris += geo.count / 3;
  }
  drawBatch(batch, spriteT, env, isFlat, sort) {
    const n = batch.build(sort);
    if (!n) return;
    const gl = BurnsGL.gl, p = BurnsGL.progs.sprite, u = p.u, B = this.B, cam = this.cam;
    gl.useProgram(p.p);
    gl.uniformMatrix4fv(u.uVP, false, this.VP);
    gl.uniform3f(u.uR, B.rx, B.ry, B.rz); gl.uniform3f(u.uU, B.ux, B.uy, B.uz); gl.uniform3f(u.uCam, cam.x, cam.y, cam.z);
    gl.uniform4f(u.uFog, env.fogD, env.fogH, env.fogE, env.fogMax); gl.uniform3fv(u.uFogC, env.fogCol);
    gl.uniform1f(u.uFlat, isFlat ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, BurnsGL.tex(spriteT)); gl.uniform1i(u.uTex, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, BurnsGL.spriteBuf);
    const q = Math.min(n, BurnsGL.MAXQ);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(batch.buf, 0, q * 4 * 8));
    BurnsGL.layoutSprite();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, BurnsGL.quadIdx);
    gl.drawElements(gl.TRIANGLES, q * 6, gl.UNSIGNED_SHORT, 0);
    this.stats.draws++;
  }
  sprites(env, spriteT) {
    const gl = BurnsGL.gl;
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -4);
    this.drawBatch(this.flat, spriteT, env, true, false);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    this.drawBatch(this.bbs, spriteT, env, false, true);
    gl.depthMask(true); gl.disable(gl.BLEND); gl.enable(gl.CULL_FACE);
  }
  // transparent-looking static layer (LSD-revealed geometry): blended over the scene
  ghost(chunks, env, world, atlasT, k) {
    const gl = BurnsGL.gl;
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.statics(chunks, env, world, atlasT, 400, k);
    gl.disable(gl.BLEND);
  }
  /* character portrait into a sub-rectangle of the GL canvas (pixels, origin top-left).
     draw(): issues skin() calls with bones posed around the origin facing +Z. */
  portrait(rect, env, atlasT, bg, headY, draw) {
    const gl = BurnsGL.gl;
    const x = Math.round(rect.x), y = Math.round(this.h - rect.y - rect.h), w = Math.round(rect.w), h = Math.round(rect.h);
    if (w < 4 || h < 4) return;
    gl.enable(gl.SCISSOR_TEST); gl.scissor(x, y, w, h); gl.viewport(x, y, w, h);
    gl.clearColor(bg[0], bg[1], bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const save = { P: this.P.slice(), V: this.V.slice(), VP: this.VP.slice(), cam: this.cam, B: Object.assign({}, this.B) };
    const hy = headY || 1.6;
    BurnsM.persp(this.P, 0.3, w / h, 0.1, 50, 0);
    BurnsM.lookAt(this.V, this.B, 0.5, hy + 0.1, 2.0, 0, hy - 0.06, 0);
    BurnsM.mul4(this.VP, this.P, this.V);
    this.cam = { x: 0.5, y: hy + 0.1, z: 2.0 };
    const penv = Object.assign({}, env, { fogD: 0, trip: 0, sky: [0.75, 0.72, 0.85], gnd: [0.35, 0.3, 0.38], keyDir: [0.45, 0.6, 0.66], keyCol: [0.75, 0.68, 0.6], emB: 1.4, rimCol: [0.7, 0.6, 1.0] });
    const savedPL = this.pl.slice(), savedPC = this.pc.slice();
    this.setLights(null);
    this.skinBegin(penv, null, atlasT);
    draw(this);
    this.pl.set(savedPL); this.pc.set(savedPC);
    this.P.set(save.P); this.V.set(save.V); this.VP.set(save.VP); this.cam = save.cam; Object.assign(this.B, save.B);
    gl.disable(gl.SCISSOR_TEST); gl.viewport(0, 0, this.w, this.h); gl.clearColor(0, 0, 0, 1);
  }
}
