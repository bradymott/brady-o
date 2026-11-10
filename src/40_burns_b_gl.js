/* ============================================================
   BRADY GOES TO BURNING MAN — WebGL renderer
   One offscreen canvas composited into the 2D game canvas.
   WebGL2 (the real look): linear HDR lighting into a multisampled RGBA16F target,
     real-time sun shadow maps (stable-fitted, hardware PCF), up to 16 point lights,
     PBR-lite materials (GGX spec, fresnel, rim, derivative bump), then post:
     dual-filter bloom, SSAO, god rays, depth of field, heat shimmer, ACES tone mapping.
   WebGL1: the same shaders without shadows/post, tone-mapped in-shader (legacy look).
   Programs:
     sky     atmospheric sky: palette gradient + scattering glow, Belt of Venus, Mie halo,
             HDR sun, moon with phase, stars + Milky Way, clouds, mountains, city glow
     ground  height-field playa: painted albedo + bump-mapped cracked mud + lightmap
     mesh    merged static geometry (vertex colour, atlas decal, emissive)
     skin    rigid-skinned meshes: characters, vehicles, pickups, movers
     sprite  billboards/flat quads: glows, particles, blob shadows, rings
     shadow  depth-only casters (static + skinned)
     post    prefilter/down/up (bloom), ssao, blur, rays, composite
   Vertex format (24 bytes) shared by mesh + skin:
     0 pos f32x3 | 12 normal i8x3 + bone u8 | 16 colour u8x4 (a = emissive) | 20 uv u16x2
   ============================================================ */

/* ---------------- quality tiers ---------------- */
const BURNS_GFX = {
  tiers: {
    ultra: { shadows: 2048, pcf: 9, ssao: true, bloom: 5, rays: true, dof: true, heat: true, msaa: 4, npl: 16, bump: true, scale: 1.0, shadowDist: 80, env: true },
    high: { shadows: 2048, pcf: 4, ssao: true, bloom: 5, rays: true, dof: true, heat: true, msaa: 4, npl: 16, bump: true, scale: 1.0, shadowDist: 70, env: true },
    medium: { shadows: 1024, pcf: 4, ssao: false, bloom: 4, rays: true, dof: false, heat: true, msaa: 4, npl: 12, bump: true, scale: 0.92, shadowDist: 55, env: true },
    low: { shadows: 0, pcf: 0, ssao: false, bloom: 3, rays: false, dof: false, heat: false, msaa: 0, npl: 8, bump: false, scale: 0.8, shadowDist: 0, env: false }
  },
  names: ['auto', 'ultra', 'high', 'medium', 'low'],
  // 'auto': phones/tablets get medium, desktops high; the frame-time governor can step down later
  resolve(pref) {
    if (pref && this.tiers[pref]) return pref;
    let mobile = false;
    try { mobile = /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)); } catch (e) { mobile = false; }
    return mobile ? 'medium' : 'high';
  }
};

const BURNS_GLSL_OUT = `
uniform vec4 uExp;   // x exposure (LDR path), y dust haze, z night 0..1, w glow boost
vec3 bLin(vec3 c) { return pow(max(c, vec3(0.0)), vec3(2.2)); }
vec3 bAces(vec3 c) { return clamp((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0.0, 1.0); }
vec4 bOut(vec3 c, float a) {
#ifdef HDR
  return vec4(c, a);
#else
  return vec4(pow(bAces(c * uExp.x), vec3(1.0 / 2.2)), a);
#endif
}
`;

const BURNS_GLSL_LIGHT = BURNS_GLSL_OUT + `
uniform vec3 uSky, uGnd, uKeyD, uKeyC, uFogC, uCam, uSunD, uSunC;
uniform vec4 uFog;
uniform vec4 uLm;
uniform sampler2D uLight;
uniform vec4 uPL[NPL];
uniform vec3 uPC[NPL];
#ifdef GL2
uniform int uNPL;
#endif
uniform float uTrip, uTime, uEmB;
#ifdef SHADOWS
uniform highp sampler2DShadow uShadow;
uniform mat4 uShadowM;
uniform vec4 uShadowK;   // x 1/size, y world texel, z fade start radius, w fade end radius
uniform vec2 uShadowO;   // shadow centre (xz)
uniform float uShadowS;
float bShadow(vec3 w, vec3 n) {
  float cosl = clamp(dot(n, uKeyD), 0.0, 1.0);
  vec3 wp = w + n * (uShadowK.y * (1.2 + 1.6 * (1.0 - cosl))) + uKeyD * (uShadowK.y * 0.4);
  vec4 sp = uShadowM * vec4(wp, 1.0);
  vec3 s = sp.xyz * 0.5 + 0.5;
  if (s.x < 0.003 || s.x > 0.997 || s.y < 0.003 || s.y > 0.997 || s.z > 0.999) return 1.0;
  float t = uShadowK.x, sum = 0.0;
#if PCF > 4
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) sum += textureLod(uShadow, vec3(s.xy + vec2(float(i), float(j)) * t * 1.3, s.z), 0.0);
  sum /= 9.0;
#else
  sum = textureLod(uShadow, vec3(s.xy + vec2(-0.6, -0.6) * t, s.z), 0.0) + textureLod(uShadow, vec3(s.xy + vec2(0.6, -0.6) * t, s.z), 0.0)
      + textureLod(uShadow, vec3(s.xy + vec2(-0.6, 0.6) * t, s.z), 0.0) + textureLod(uShadow, vec3(s.xy + vec2(0.6, 0.6) * t, s.z), 0.0);
  sum *= 0.25;
#endif
  float d = length(w.xz - uShadowO);
  return mix(1.0, sum, uShadowS * (1.0 - smoothstep(uShadowK.z, uShadowK.w, d)));
}
#else
float bShadow(vec3 w, vec3 n) { return 1.0; }
#endif
#ifdef ENVMAP
// the sky probe: this frame's sky as a small equirect HDR texture; mips stand in for roughness
uniform sampler2D uEnv; uniform float uEnvK;
vec3 bEnv(vec3 d, float rough) {
  vec2 uv = vec2(atan(d.x, d.z) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.3183099 + 0.5);
  return textureLod(uEnv, uv, rough * 6.0).rgb;
}
#endif
#ifdef BUMP
// bump from a scalar height via screen-space derivatives (Mikkelsen); k = height amplitude in metres
vec3 bBump(vec3 n, vec3 w, float h, float k) {
  vec3 dpx = dFdx(w), dpy = dFdy(w);
  float dhx = dFdx(h), dhy = dFdy(h);
  vec3 r1 = cross(dpy, n), r2 = cross(n, dpx);
  float det = dot(dpx, r1);
  vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
  return normalize(abs(det) * n - grad * k);
}
#endif
// PBR-lite: hemisphere ambient + baked light pools, wrapped sun diffuse with shadow, GGX sun specular,
// point lights, fresnel sky reflection (chrome at gloss 3). Everything linear.
vec3 bShade(vec3 alb, vec3 n, vec3 w, float g, float wrap, float sh) {
  vec3 v = normalize(uCam - w);
  vec3 amb = mix(uGnd, uSky, n.y * 0.5 + 0.5);
  vec3 lm = texture2D(uLight, (w.xz - uLm.xy) * uLm.zw).rgb;
  amb += bLin(lm) * (1.7 * exp(-max(w.y, 0.0) * 0.14)) * (0.7 + 0.3 * max(n.y, 0.0));
  float nl = dot(n, uKeyD);
  float dif = max((nl + wrap) / (1.0 + wrap), 0.0) * sh;
  vec3 c = alb * (amb + uKeyC * dif);
  for (int i = 0; i < NPL; i++) {
#ifdef GL2
    if (i >= uNPL) break;
#endif
    vec3 d = uPL[i].xyz - w; float dl = length(d);
    float a = max(1.0 - dl / uPL[i].w, 0.0); a *= a;
    if (a <= 0.0) continue;
    vec3 ld = d / (dl + 0.0001);
    float pd = max(dot(n, ld), 0.0);
    c += uPC[i] * a * (alb * (0.22 + 0.78 * pd) + pow(max(dot(n, normalize(ld + v)), 0.0), 12.0 + g * 90.0) * (0.03 + g * 0.6) * pd);
  }
  float r = mix(0.8, 0.13, g), a2 = r * r * r * r;
  vec3 h = normalize(uKeyD + v);
  float nh = max(dot(n, h), 0.0), nv = max(dot(n, v), 0.02), nlp = max(nl, 0.0);
  float dd = nh * nh * (a2 - 1.0) + 1.0;
  float D = a2 / (3.14159 * dd * dd);
  float F = 0.04 + 0.96 * pow(1.0 - max(dot(v, h), 0.0), 5.0);
  float k = (r + 1.0) * (r + 1.0) * 0.125;
  float V = 0.25 / ((nlp * (1.0 - k) + k) * (nv * (1.0 - k) + k));
  c += uKeyC * min(D * F * V, 24.0) * nlp * sh * (0.35 + 0.9 * g);
  vec3 rf = reflect(-v, n);
  float fr = pow(1.0 - nv, 4.0);
#ifdef ENVMAP
  if (uEnvK > 0.5) {
    // real sky reflections: sharp on chrome (tinted by its colour) and clear-coat paint, blurred on satin, a darker ground half
    vec3 es = bEnv(rf, mix(0.95, 0.1, g)) * mix(0.55, 1.0, smoothstep(-0.35, 0.05, rf.y));
    float f5 = pow(1.0 - nv, 5.0);
    c += es * mix(vec3((0.04 + 0.96 * f5) * (0.08 + 0.92 * g)), mix(alb, vec3(1.0), 0.45) * (0.7 + 0.3 * f5), step(0.99, g));
    return c;
  }
#endif
  vec3 env = mix(uGnd * 1.1, uSky * 1.3, smoothstep(-0.15, 0.45, rf.y));
  c += env * fr * (0.04 + 0.4 * g) + env * alb * step(0.99, g) * 0.45;
  return c;
}
vec3 bFogMix(vec3 c, vec3 w, float e) {
  vec3 dv = w - uCam; float d = length(dv);
  float f = (1.0 - exp(-d * uFog.x)) * mix(1.0, exp(-max(w.y, 0.0) * uFog.y), 0.65);
  float dn = sin(w.x * 0.043 + uTime * 0.21) * sin(w.z * 0.037 - uTime * 0.16) * 0.5 + 0.5;
  f = clamp(f * (1.0 + uExp.y * (dn - 0.35) * exp(-max(w.y, 0.0) * 0.22)), 0.0, 1.0);
  f = min(f, uFog.w) * (1.0 - e * uFog.z);
  f = pow(f, 1.45);   // linear-space fog reads hazier than the old gamma-space mix
  float sd = max(dot(dv / max(d, 0.001), uSunD), 0.0);
  vec3 fc = uFogC + uSunC * (pow(sd, 6.0) * 0.45 + pow(sd, 48.0) * 0.5);
  return mix(c, fc, f);
}
vec3 bTrip(vec3 c, vec3 w) {
  float a = uTime * 1.7 + w.x * 0.07 + w.z * 0.05 + w.y * 0.12;
  vec3 k = vec3(0.57735);
  float ca = cos(a);
  vec3 r = c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
  return mix(c, r * 1.3 + vec3(0.02, 0.0, 0.04), uTrip);
}
`;

const BURNS_GLSL_POSTVS = `attribute vec2 aPos; varying vec2 vUV; void main(){ vUV = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

// the static mesh fragment shader (merged chunks and instanced props share it)
const BURNS_GLSL_MESHFS = `precision highp float;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec2 vT; varying float vG;
uniform sampler2D uTex;
uniform float uAlphaK;
${BURNS_GLSL_LIGHT}
void main(){
  vec4 t = texture2D(uTex, vT);
  vec3 alb = bLin(vC.rgb * (1.0 - t.a) + t.rgb);
  vec3 n = normalize(vN);
#ifdef BUMP
  vec3 nb = bBump(n, vW, dot(t.rgb, vec3(0.3, 0.59, 0.11)), 0.004);
  n = t.a > 0.02 ? nb : n;
#endif
  float e = vC.a;
  float sh = mix(bShadow(vW, n), 1.0, step(0.6, e));
  vec3 c = mix(bShade(alb, n, vW, vG, 0.25, sh), alb * uEmB, e);
  if (uTrip > 0.0) c = bTrip(c, vW);
  gl_FragColor = bOut(bFogMix(c, vW, e) * uAlphaK, uAlphaK);
}`;
// instanced static props: aI0 = (x, y, z, yaw), aI1 = (scale, tint r, g, b); rotation matches BurnsMesh.tf / place()
const BURNS_GLSL_MESHVS_I = `attribute vec3 aPos; attribute vec3 aNrm; attribute float aBone; attribute vec4 aCol; attribute vec2 aUV; attribute vec4 aI0; attribute vec4 aI1;
uniform mat4 uVP;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec2 vT; varying float vG;
void main(){
  float c = cos(aI0.w), s = sin(aI0.w);
  vec3 p = aPos * aI1.x;
  vW = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z) + aI0.xyz;
  vN = vec3(c * aNrm.x + s * aNrm.z, aNrm.y, -s * aNrm.x + c * aNrm.z);
  vC = vec4(aCol.rgb * aI1.yzw, aCol.a); vT = aUV; vG = floor(aBone / 64.0 + 0.01) / 3.0;
  gl_Position = uVP * vec4(vW, 1.0);
}`;
const BurnsGL = {
  canvas: null, gl: null, gl2: false, failed: false, lost: false, gen: 0, progs: null, maxBones: 32,
  failReason: '', tier: 'legacy', T: null, hdr: false, msaa: 0,
  init() {
    if (this.gl) return !this.lost;
    if (this.failed) return false;
    try {
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      let gl = null;
      // WebGL2: we render into our own multisampled HDR target, so the canvas needs no AA or depth
      if (!window.__burnsForceGL1) { try { gl = c.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' }); } catch (e) { gl = null; } }
      this.gl2 = !!gl;
      const o1 = { alpha: false, antialias: true, depth: true, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: 'high-performance' };
      if (!gl) gl = c.getContext('webgl', o1) || c.getContext('experimental-webgl', o1);
      if (!gl || window.__burnsNoGL) { this.failed = true; this.failReason = 'nogl'; return false; }
      this.canvas = c; this.gl = gl;
      c.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; }, false);
      c.addEventListener('webglcontextrestored', () => { try { this.setup(); this.lost = false; } catch (e) { console.error(e); } }, false);
      this.setup();
      return true;
    } catch (e) { console.error(e); this.failed = true; this.failReason = String(e && e.message || e); this.gl = null; return false; }
  },
  // pick the quality tier (settings.gfx: auto|ultra|high|medium|low) and (re)build programs + targets
  configure(pref) {
    const want = this.gl2 ? BURNS_GFX.resolve(pref) : 'legacy';
    if (want === this.tier && this.progs) return;
    this.tier = want; this.pref = pref;
    if (this.gl) { this.freeTargets(); this.buildPrograms(); }
  },
  setup() {
    const gl = this.gl;
    this.gen++;
    this.enabled = [false, false, false, false, false, false, false, false];
    this.aniso = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
    this.maxAniso = this.aniso ? gl.getParameter(this.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;
    this.derivs = this.gl2 || !!gl.getExtension('OES_standard_derivatives');
    if (this.gl2) {
      this.cbf = gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float');
      this.hdr = !!this.cbf;
      let samples = [];
      try { samples = Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER, this.hdr ? gl.RGBA16F : gl.RGBA8, gl.SAMPLES) || []); } catch (e) { samples = []; }
      this.maxMSAA = samples.length ? Math.max(...samples) : 0;
    }
    const vuv = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) || 128;
    this.maxBones = Math.max(16, Math.min(64, Math.floor((vuv - 40) / 3)));
    if (this.tier === 'legacy' && this.gl2) this.tier = BURNS_GFX.resolve(this.pref);
    if (!this.gl2) this.tier = 'legacy';
    this.T = null;
    this.buildPrograms();
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
    this.white = this.rawTexture(2, 2, new Uint8Array(16).fill(255));
    // instanced drawing (WebGL2 core, or ANGLE_instanced_arrays on WebGL1): div(attrib, n), draw(count, byteOffset, instances)
    const ia = this.gl2 ? null : gl.getExtension('ANGLE_instanced_arrays');
    this.instGL = this.gl2 ? { div: (i, d) => gl.vertexAttribDivisor(i, d), draw: (c, o, n) => gl.drawElementsInstanced(gl.TRIANGLES, c, gl.UNSIGNED_SHORT, o, n) }
      : ia ? { div: (i, d) => ia.vertexAttribDivisorANGLE(i, d), draw: (c, o, n) => ia.drawElementsInstancedANGLE(gl.TRIANGLES, c, gl.UNSIGNED_SHORT, o, n) } : null;
  },
  get Q() { return BURNS_GFX.tiers[this.tier] || null; },   // null on the legacy (WebGL1) path
  defines() {
    const Q = this.Q, D = {};
    D.NPL = Q ? Q.npl : 4;
    if (Q && Q.shadows) { D.SHADOWS = 1; D.PCF = Q.pcf; }
    if (Q && this.hdr) D.HDR = 1;
    if ((!Q || Q.bump) && this.derivs) D.BUMP = 1;
    if (Q && Q.env && this.hdr && this.gl2) D.ENVMAP = 1;   // the sky probe (real reflections on chrome and paint)
    return D;
  },
  buildPrograms() {
    const MB = this.maxBones, A = ['aPos', 'aNrm', 'aBone', 'aCol', 'aUV'];
    const skinVS = `#define MAXB ${MB}
attribute vec3 aPos; attribute vec3 aNrm; attribute float aBone; attribute vec4 aCol; attribute vec2 aUV;
uniform mat4 uVP; uniform vec4 uB[MAXB * 3]; uniform vec3 uFace;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec2 vT; varying float vG; varying vec3 vL;
void main(){
  vL = aPos;
  int i = int(mod(aBone, 64.0) + 0.5) * 3;
  vG = floor(aBone / 64.0 + 0.01) / 3.0;
  vec4 r0 = uB[i]; vec4 r1 = uB[i + 1]; vec4 r2 = uB[i + 2];
  vec4 p = vec4(aPos, 1.0);
  vW = vec3(dot(r0, p), dot(r1, p), dot(r2, p));
  vN = vec3(dot(r0.xyz, aNrm), dot(r1.xyz, aNrm), dot(r2.xyz, aNrm));
  vC = aCol; vT = aUV;
  if (aUV.y >= uFace.x && aUV.y < uFace.y) vT.y += uFace.z;
  gl_Position = uVP * vec4(vW, 1.0);
}`;
    const skinFS = `precision highp float;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec2 vT; varying float vG; varying vec3 vL;
uniform sampler2D uTex;
uniform vec4 uTint; uniform vec3 uRimC; uniform float uRim;
uniform vec4 uRain; uniform vec2 uRainK;   // the Man's neon: heart position (world), 1/scale (0 = off); x hurt 0..1
${BURNS_GLSL_LIGHT}
void main(){
  vec4 t = texture2D(uTex, vT);
  vec3 srgb = vC.rgb * (1.0 - t.a) + t.rgb;
  vec3 alb = bLin(srgb);
  vec3 n = normalize(vN);
#ifdef BUMP
  vec3 nb = bBump(n, vW, dot(t.rgb, vec3(0.3, 0.59, 0.11)), 0.0025);
  // cloth: soft folds + a fine weave on matte, untextured, non-skin surfaces (bone-local, so it rides the body)
  float skin0 = smoothstep(0.06, 0.22, srgb.r - srgb.b) * step(srgb.b, srgb.g) * step(srgb.g, srgb.r);
  float cd = length(vW - uCam);
  float fold = sin(vL.y * 44.0 + sin(vL.x * 21.0 + vL.z * 17.0) * 1.7) * 0.55 + sin(vL.y * 109.0 + vL.x * 37.0) * 0.16;
  // the weave fades out once a period shrinks toward a pixel (it otherwise shimmers on a phone screen)
  vec2 weaveUV = vec2(vL.x * 560.0 + vL.z * 210.0, vL.y * 600.0);
  float weaveAA = 1.0 - smoothstep(0.8, 2.5, max(length(dFdx(weaveUV)), length(dFdy(weaveUV))));
  float weave = sin(weaveUV.x) * sin(weaveUV.y) * 0.07 * weaveAA * (1.0 - smoothstep(1.2, 4.0, cd));
  vec3 nc = bBump(n, vW, (fold + weave) * (1.0 - smoothstep(14.0, 30.0, cd)), 0.0018);
  float cloth = (1.0 - step(0.02, t.a)) * (1.0 - step(0.15, vG)) * (1.0 - skin0) * (1.0 - step(0.5, vC.a));
  n = (t.a > 0.02 && t.a < 0.999) ? nb : normalize(mix(n, nc, cloth));
#endif
  float e = vC.a;
  if (uRain.w > 0.0 && e > 0.5) {
    // white tubes: a rainbow travelling out from the heart in slow waves (a point changes colour over seconds; the
    // brightest band passes about every 4 s, so nothing flashes); the red heart beats about once a second.
    // By day (uExp.z ~ 0) they are unlit glass and red paint. Hurt turns the neon red.
    float nt = smoothstep(0.15, 0.6, uExp.z), d = length(vW - uRain.xyz) * uRain.w;
    if (vC.g > 0.9 && vC.b > 0.9) {
      vec3 hue = 0.18 + 0.82 * (0.5 + 0.5 * cos(6.2832 * (fract(d * 0.11 - uTime * 0.07) + vec3(0.0, 0.3333, 0.6667))));
      float wave = 0.62 + 0.38 * smoothstep(-0.3, 0.9, sin(d * 0.8 - uTime * 1.5)), breathe = 0.88 + 0.12 * sin(uTime * 0.6);
      vec3 nc = mix(hue * wave * breathe, vec3(1.0, 0.1, 0.12) * (0.75 + 0.25 * wave), uRainK.x);
      float tube = step(0.95, e);
      alb = mix(mix(bLin(vec3(0.86, 0.74, 0.6)), bLin(vec3(0.5, 0.53, 0.58)), tube), bLin(nc) * mix(0.5, 1.0, tube), nt);
      e = nt;
    } else if (vC.r > 0.9 && vC.g < 0.4) {
      float beat = pow(max(0.0, sin(uTime * 5.65)), 8.0);
      alb = bLin(vec3(1.0, 0.13 + 0.12 * beat, 0.3)) * (1.0 + nt * (0.45 * beat + 0.4 * uRainK.x));
      e = mix(0.12, 1.0, nt);
    }
  }
  float sh = mix(bShadow(vW, n), 1.0, step(0.6, e));
  vec3 c = mix(bShade(alb, n, vW, vG, 0.4, sh), alb * uEmB, e);
  // warm light bleeding through skin-like albedo at the terminator (cheap subsurface)
  float sk = smoothstep(0.06, 0.22, srgb.r - srgb.b) * step(srgb.b, srgb.g) * step(srgb.g, srgb.r) * (1.0 - e);
  float nl = dot(n, uKeyD);
  c += alb * uKeyC * vec3(0.32, 0.1, 0.06) * sk * max(0.0, 1.0 - abs(nl * 1.6 - 0.1)) * (0.4 + 0.6 * sh);
  vec3 v = normalize(uCam - vW);
  c += uRimC * pow(1.0 - max(dot(n, v), 0.0), 2.5) * uRim;
  c = mix(c, bLin(uTint.rgb), uTint.a);
  if (uTrip > 0.0) c = bTrip(c, vW);
  gl_FragColor = bOut(bFogMix(c, vW, e), 1.0);
}`;
    const old = this.progs;
    this.progs = {
      sky: this.program(`attribute vec2 aPos; varying vec2 vN; void main(){ vN = aPos; gl_Position = vec4(aPos, 0.99995, 1.0); }`, `precision highp float;
varying vec2 vN;
uniform vec3 uF, uR, uU, uTan;
uniform vec3 uZen, uHor, uFogC, uSunD, uSunC, uMoonD, uMtnC, uCityD, uCityC;
uniform vec4 uSkyK, uCloud, uMid, uAtm;
uniform vec3 uCloudC;
uniform float uTime, uHaze, uTrip, uEqui;
${BURNS_GLSL_OUT}
float h3(vec3 p){ p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float h2(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float n2(vec2 p){ vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ return n2(p) * 0.5 + n2(p * 2.03 + 1.7) * 0.25 + n2(p * 4.01 + 5.3) * 0.125 + n2(p * 8.07 + 9.1) * 0.0625; }
void main(){
  vec3 d;
  if (uEqui > 0.5) { float lon = vN.x * 3.14159265, lat = vN.y * 1.57079633; d = vec3(sin(lon) * cos(lat), sin(lat), cos(lon) * cos(lat)); }   // the probe: one pixel per direction
  else d = normalize(uF + uR * (vN.x * uTan.x) + uU * ((vN.y - uTan.z) * uTan.y));
  float el = asin(clamp(d.y, -1.0, 1.0));
  float az = atan(d.x, d.z);
  float gy = pow(clamp(el / 1.25, 0.0, 1.0), 0.55);
  vec3 col = mix(uHor, uZen, gy);
  col = mix(col, uMid.rgb, uMid.a * (1.0 - abs(gy * 2.0 - 1.0)));
  float sEl = asin(clamp(uSunD.y, -1.0, 1.0));
  float sd = max(dot(d, uSunD), 0.0);
  vec3 hs = normalize(vec3(uSunD.x, 0.0001, uSunD.z)), hd = normalize(vec3(d.x, 0.0001, d.z));
  float toward = dot(hd, hs) * 0.5 + 0.5, anti = 1.0 - toward;
  float tw = smoothstep(0.55, 0.03, sEl) * smoothstep(-0.32, -0.03, sEl);
  // scattering: a warm horizon glow toward a low sun, Earth's shadow + Belt of Venus opposite it
  col += uSunC * pow(toward, 3.0) * exp(-max(el, 0.0) * 4.5) * tw * 0.6 * uAtm.x;
  col = mix(col, col * vec3(0.6, 0.62, 0.86), smoothstep(0.07, 0.0, el) * pow(anti, 2.0) * tw * 0.65 * uAtm.w);
  col += vec3(0.36, 0.16, 0.26) * exp(-pow((el - 0.12) / 0.065, 2.0)) * pow(anti, 1.5) * tw * uAtm.w;
  float gm = 0.78, cosT = dot(d, uSunD);
  col += uSunC * ((1.0 - gm * gm) / pow(1.0 + gm * gm - 2.0 * gm * cosT, 1.5)) * 0.018 * (0.35 + tw) * uAtm.x * step(-0.12, sEl);
  col += uSunC * (pow(sd, 7.0) * 0.3 + pow(sd, 60.0) * 0.5);
  col = mix(col, uSunC * 1.25 + vec3(0.12), smoothstep(1.0 - uSkyK.x, 1.0 - uSkyK.x * 0.7, sd));
  if (uSkyK.y > 0.0) {
    float md = max(dot(d, uMoonD), 0.0);
    col += vec3(0.55, 0.6, 0.8) * (pow(md, 220.0) * 0.5 + pow(md, 18.0) * 0.06) * uSkyK.y;
    // a real little moon: the hemisphere facing us, lit from the sun's side (nudged toward full), soft maria
    vec3 mr = normalize(cross(uMoonD, vec3(0.0, 1.0, 0.0))), mu = cross(mr, uMoonD);
    vec2 q = vec2(dot(d, mr), dot(d, mu)) / 0.026;
    float qd = dot(q, q);
    if (qd < 1.0 && md > 0.9) {
      vec3 ns = normalize(mr * q.x + mu * q.y - uMoonD * sqrt(1.0 - qd));
      float lit = smoothstep(-0.12, 0.2, dot(ns, normalize(uSunD - uMoonD * 0.3)));
      float maria = 0.78 + 0.22 * smoothstep(0.35, 0.7, fbm(q * 2.3 + 4.0));
      vec3 mc = vec3(0.97, 0.95, 0.88) * maria * mix(0.07, 1.0, lit);
      col = mix(col, mc, smoothstep(1.0, 0.86, qd) * uSkyK.y);
    }
  }
  if (uSkyK.z > 0.0 && el > -0.02) {
    vec3 p = d * 190.0; vec3 cell = floor(p); float h = h3(cell);
    if (h > 0.87) {
      vec3 c = cell + 0.5 + (vec3(h3(cell + 7.1), h3(cell + 3.3), h3(cell + 9.7)) - 0.5) * 0.7;
      float s = smoothstep(0.34, 0.0, length(p - c));
      float twk = 0.6 + 0.4 * sin(uTime * (1.3 + h * 4.0) + h * 50.0);
      col += mix(vec3(0.7, 0.82, 1.0), vec3(1.0, 0.86, 0.72), h3(cell + 1.7)) * s * twk * uSkyK.z * smoothstep(0.02, 0.3, el) * (h - 0.87) * 8.0;
    }
    // the Milky Way: a tilted band of faint stars and glow with dark dust lanes and a brighter core
    vec3 gp = normalize(vec3(0.42, 0.62, -0.66)), gx = normalize(cross(gp, vec3(0.0, 1.0, 0.0))), gz = cross(gx, gp);
    float b = dot(d, gp), l = atan(dot(d, gz), dot(d, gx));
    float band = exp(-b * b * 30.0), core = exp(-pow(l - 0.6, 2.0) * 1.1);
    vec2 mp = vec2(l * 3.2, b * 10.0);
    float cl = fbm(mp * 2.4);
    float lanes = smoothstep(0.42, 0.78, fbm(mp * 3.3 + 7.0)) * exp(-b * b * 140.0);
    float mw = band * (0.45 + 0.95 * cl) * (0.5 + 0.8 * core) * (1.0 - 0.8 * lanes);
    float fade = uSkyK.z * uAtm.y * smoothstep(0.0, 0.3, el);
    col += mix(vec3(0.38, 0.42, 0.62), vec3(0.78, 0.64, 0.5), core * 0.8) * mw * 0.3 * fade;
    vec3 p2 = d * 520.0; vec3 c2 = floor(p2); float h2b = h3(c2);
    if (h2b > 0.93) col += vec3(0.85, 0.88, 1.0) * smoothstep(0.42, 0.0, length(p2 - c2 - 0.5)) * band * (h2b - 0.93) * 12.0 * fade;
  }
  if (uCloud.x > 0.0 && el > 0.0) {
    vec2 cp = d.xz / (d.y + 0.12) * uCloud.y + vec2(uTime * uCloud.z, uTime * uCloud.z * 0.37);
    float cn = n2(cp) * 0.55 + n2(cp * 2.13 + 3.7) * 0.3 + n2(cp * 4.37 + 9.1) * 0.15;
    float ca = smoothstep(0.48, 0.8, cn) * smoothstep(0.0, 0.22, el) * uCloud.x;
    // lit from the sun: brighter bellies toward it, a silver lining on thin edges at golden hour
    float edge = smoothstep(0.48, 0.62, cn) * (1.0 - smoothstep(0.62, 0.8, cn));
    vec3 cc = uCloudC * (0.8 + 0.32 * smoothstep(0.5, 0.85, cn)) + uSunC * (pow(sd, 5.0) * 0.35 + edge * pow(toward, 4.0) * tw * 0.8);
    col = mix(col, cc, ca);
  }
  float cg = max(dot(hd, uCityD), 0.0);
  col += uCityC * pow(cg, 5.0) * exp(-max(el, 0.0) * 10.0);
  col = mix(col, uFogC, uHaze * (1.0 - smoothstep(0.0, 0.3, el)));
  float m = uSkyK.w * (0.55 + 0.24 * sin(az * 3.0 + 1.3) + 0.12 * sin(az * 7.0 + 0.4) + 0.06 * sin(az * 19.0 + 2.1) + 0.03 * sin(az * 43.0));
  bool mtn = el < m;
  if (mtn) col = mix(uMtnC, uFogC, clamp(1.0 - (m - el) / max(m, 0.001) * 1.2, 0.0, 1.0) * 0.55);
  if (el < 0.0) col = uFogC;
  if (uTrip > 0.0) { float a = uTime * 0.9 + az * 2.0; col = mix(col, col.gbr * 1.2 + 0.05 * vec3(sin(a), sin(a + 2.0), sin(a + 4.0)), uTrip * 0.6); }
  vec3 lin = bLin(col);
  // HDR sun disc + glare (the bloom pass turns this into a real sun)
  if (!mtn && el > -0.01) lin += bLin(uSunC) * (smoothstep(1.0 - uSkyK.x, 1.0 - uSkyK.x * 0.7, sd) * uAtm.z + pow(sd, 300.0) * uAtm.z * 0.25);
  gl_FragColor = bOut(lin, 1.0);
}`, ['aPos']),
      ground: this.program(`attribute vec3 aPos; attribute vec3 aNrm;
uniform mat4 uVP; uniform vec4 uPaintXf;
varying vec3 vW; varying vec3 vN; varying vec2 vP;
void main(){ vW = aPos; vN = aNrm; vP = (aPos.xz - uPaintXf.xy) * uPaintXf.zw; gl_Position = uVP * vec4(aPos, 1.0); }`, `precision highp float;
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
  // natural playa: low-frequency warp breaks the crack grid, patches of smooth drifted dust vs. cracked crust,
  // brightness/colour mottling at two scales, a second crack scale, and fine grit + specks (MOOP) up close
  vec4 m1 = texture2D(uDet, vW.xz * 0.0071 + vec2(0.13, 0.71));
  vec4 m2 = texture2D(uDet, vW.xz * 0.0023 + vec2(0.57, 0.29));
  vec2 wv = (vec2(m1.g, m2.g) - 0.5) * 1.6;
  vec4 d1 = texture2D(uDet, vW.xz * uDetK.x + wv);
  vec4 d2 = texture2D(uDet, vW.xz * uDetK.z);
  vec4 d3 = texture2D(uDet, vW.xz * uDetK.x * 0.21 + 0.37 + wv * 0.4);
  vec4 d4 = texture2D(uDet, vW.xz * uDetK.x * 2.7 + wv.yx * 1.3 + 0.21);
  float far = clamp((dist - 28.0) / 80.0, 0.0, 1.0);
  float crust = smoothstep(0.26, 0.62, m2.g * 0.65 + m1.g * 0.35);   // 0 = drifted smooth dust, 1 = cracked crust
  // Filter fine crust by its screen footprint. Grazing views on a phone otherwise
  // turn the high-frequency cracks into a crawling grid even with MSAA enabled.
  float crustAA = fade;
#ifdef BUMP
  vec2 footprint = fwidth(vW.xz * uDetK.x);
  crustAA *= 1.0 - smoothstep(0.015, 0.065, max(footprint.x, footprint.y));
#endif
  float ck = mix(d1.r * crustAA, d3.r * 0.55, far) * mix(0.25, 1.0, crust) + d4.r * 0.35 * crustAA * crust;
  alb *= 1.0 - ck * uDetK.y;
  alb *= 1.0 + (d2.g - 0.5) * uDetK.w;
  alb *= mix(0.9, 1.07, m2.g) * mix(0.96, 1.03, m1.g);
  alb = mix(alb, alb * vec3(1.06, 1.03, 0.97), (1.0 - crust) * 0.6);   // dust drifts read paler and warmer
  alb *= 0.95 + d1.b * 0.1 * fade;
  vec4 g1 = texture2D(uDet, vW.xz * 1.9 + 0.43);
  float near = 1.0 - smoothstep(6.0, 20.0, dist);
  alb *= 1.0 - (step(0.988, g1.b) * 0.4 + (g1.b - 0.5) * 0.06) * near * uDetK.y * 3.0;
  alb = bLin(alb);
#ifdef BUMP
  float hgt = mix(d1.a, d3.a, far) * mix(0.35, 1.0, crust) + d4.a * 0.3 * crust + (g1.b - 0.5) * 0.15 * near;
  n = bBump(n, vW, hgt, mix(0.012 * crustAA, 0.025, far) * (1.0 - smoothstep(70.0, 170.0, dist)) * step(0.001, uDetK.y));
#endif
  float sh = bShadow(vW, n);
  vec3 c = bShade(alb, n, vW, 0.05, 0.0, sh);
  if (uTrip > 0.0) c = bTrip(c, vW);
  gl_FragColor = bOut(bFogMix(c, vW, 0.0), 1.0);
}`, ['aPos', 'aNrm']),
      mesh: this.program(`attribute vec3 aPos; attribute vec3 aNrm; attribute float aBone; attribute vec4 aCol; attribute vec2 aUV;
uniform mat4 uVP;
varying vec3 vW; varying vec3 vN; varying vec4 vC; varying vec2 vT; varying float vG;
void main(){ vW = aPos; vN = aNrm; vC = aCol; vT = aUV; vG = floor(aBone / 64.0 + 0.01) / 3.0; gl_Position = uVP * vec4(aPos, 1.0); }`, BURNS_GLSL_MESHFS, A),
      meshI: this.program(BURNS_GLSL_MESHVS_I, BURNS_GLSL_MESHFS, A.concat(['aI0', 'aI1'])),
      skin: this.program(skinVS, skinFS, A),
      // instanced crowds: one shared pose (uB) for every copy; aI0 = (x, y, z, yaw), aI1 = (scale, tint r, g, b)
      skinI: this.program(skinVS.replace('attribute vec2 aUV;', 'attribute vec2 aUV; attribute vec4 aI0; attribute vec4 aI1;').replace('  gl_Position = uVP * vec4(vW, 1.0);', '  { float c = cos(aI0.w), s = sin(aI0.w); vec3 q = vW * aI1.x; vW = vec3(c * q.x + s * q.z, q.y, -s * q.x + c * q.z) + aI0.xyz; vN = vec3(c * vN.x + s * vN.z, vN.y, -s * vN.x + c * vN.z); vC = vec4(aCol.rgb * aI1.yzw, aCol.a); }\n  gl_Position = uVP * vec4(vW, 1.0);'), skinFS, A.concat(['aI0', 'aI1'])),
      sprite: this.program(`attribute vec3 aPos; attribute vec2 aNrm; attribute vec2 aBone; attribute vec4 aCol;
uniform mat4 uVP; uniform vec3 uR, uU, uCam; uniform vec4 uFog; uniform float uFlat;
varying vec2 vT; varying vec4 vC; varying float vF;
void main(){
  vec3 p = uFlat > 0.5 ? aPos + vec3(aNrm.x, 0.0, aNrm.y) : aPos + uR * aNrm.x + uU * aNrm.y;
  float d = length(p - uCam);
  vF = min(1.0 - exp(-d * uFog.x), uFog.w) * 0.9;
  vT = aBone; vC = aCol;
  gl_Position = uVP * vec4(p, 1.0);
}`, `precision mediump float;
uniform sampler2D uTex; uniform vec3 uFogC; uniform float uGlowK;
varying vec2 vT; varying vec4 vC; varying float vF;
void main(){
  vec4 c = texture2D(uTex, vT) * vC;
  if (c.a + c.r + c.g + c.b < 0.003) discard;
  vec3 rgb = mix(c.rgb, uFogC * c.a, vF);
#ifdef HDR
  gl_FragColor = vec4(pow(max(rgb, vec3(0.0)), vec3(2.2)) * (c.a < 0.004 ? uGlowK : 1.0), c.a);
#else
  gl_FragColor = vec4(rgb, c.a);
#endif
}`, ['aPos', 'aNrm', 'aBone', 'aCol'])
    };
    const P = this.progs, Q = this.Q;
    if (Q && Q.shadows) {
      P.shMesh = this.program(`attribute vec3 aPos; uniform mat4 uLVP; void main(){ gl_Position = uLVP * vec4(aPos, 1.0); }`, `precision mediump float; void main(){ gl_FragColor = vec4(1.0); }`, ['aPos']);
      P.shMeshI = this.program(`attribute vec3 aPos; attribute vec4 aI0; attribute vec4 aI1; uniform mat4 uLVP; void main(){ float c = cos(aI0.w), s = sin(aI0.w); vec3 p = aPos * aI1.x; gl_Position = uLVP * vec4(vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z) + aI0.xyz, 1.0); }`, `precision mediump float; void main(){ gl_FragColor = vec4(1.0); }`, ['aPos', 'aNrm', 'aBone', 'aCol', 'aUV', 'aI0', 'aI1']);
      P.shSkin = this.program(`#define MAXB ${MB}
attribute vec3 aPos; attribute vec3 aNrm; attribute float aBone; uniform mat4 uLVP; uniform vec4 uB[MAXB * 3];
void main(){ int i = int(mod(aBone, 64.0) + 0.5) * 3; vec4 p = vec4(aPos, 1.0); gl_Position = uLVP * vec4(dot(uB[i], p), dot(uB[i + 1], p), dot(uB[i + 2], p), 1.0); }`, `precision mediump float; void main(){ gl_FragColor = vec4(1.0); }`, ['aPos', 'aNrm', 'aBone']);
    }
    if (Q) this.buildPost();
    if (old) for (const k in old) { try { if (old[k] && old[k].p) this.gl.deleteProgram(old[k].p); } catch (e) { /* ignore */ } }
  },
  buildPost() {
    const P = this.progs, VS = BURNS_GLSL_POSTVS;
    // bloom: bright-pass prefilter (soft knee, firefly clamp), dual-filter down + up
    P.pre = this.program(VS, `precision highp float; varying vec2 vUV; uniform sampler2D uSrc; uniform vec2 uTx; uniform vec4 uTh;
void main(){
  vec3 c = (texture2D(uSrc, vUV + uTx * vec2(-1.0, -1.0)).rgb + texture2D(uSrc, vUV + uTx * vec2(1.0, -1.0)).rgb + texture2D(uSrc, vUV + uTx * vec2(-1.0, 1.0)).rgb + texture2D(uSrc, vUV + uTx * vec2(1.0, 1.0)).rgb) * 0.25;
  c = min(c, vec3(48.0));
  float br = max(c.r, max(c.g, c.b));
  float soft = clamp(br - uTh.x + uTh.y, 0.0, 2.0 * uTh.y); soft = soft * soft / (4.0 * uTh.y + 0.0001);
  gl_FragColor = vec4(c * max(soft, br - uTh.x) / max(br, 0.0001), 1.0);
}`, ['aPos']);
    P.down = this.program(VS, `precision highp float; varying vec2 vUV; uniform sampler2D uSrc; uniform vec2 uTx;
void main(){
  vec3 c = texture2D(uSrc, vUV).rgb * 4.0;
  c += texture2D(uSrc, vUV + uTx * vec2(-1.0, -1.0)).rgb + texture2D(uSrc, vUV + uTx * vec2(1.0, -1.0)).rgb + texture2D(uSrc, vUV + uTx * vec2(-1.0, 1.0)).rgb + texture2D(uSrc, vUV + uTx * vec2(1.0, 1.0)).rgb;
  gl_FragColor = vec4(c * 0.125, 1.0);
}`, ['aPos']);
    P.up = this.program(VS, `precision highp float; varying vec2 vUV; uniform sampler2D uSrc; uniform vec2 uTx; uniform float uK;
void main(){
  vec3 c = texture2D(uSrc, vUV + uTx * vec2(-2.0, 0.0)).rgb + texture2D(uSrc, vUV + uTx * vec2(2.0, 0.0)).rgb + texture2D(uSrc, vUV + uTx * vec2(0.0, -2.0)).rgb + texture2D(uSrc, vUV + uTx * vec2(0.0, 2.0)).rgb;
  c += (texture2D(uSrc, vUV + uTx * vec2(-1.0, -1.0)).rgb + texture2D(uSrc, vUV + uTx * vec2(1.0, -1.0)).rgb + texture2D(uSrc, vUV + uTx * vec2(-1.0, 1.0)).rgb + texture2D(uSrc, vUV + uTx * vec2(1.0, 1.0)).rgb) * 2.0;
  gl_FragColor = vec4(c / 12.0 * uK, 1.0);
}`, ['aPos']);
    // screen-space ambient occlusion from the depth buffer (half res), normals from depth derivatives
    P.ssao = this.program(VS, `precision highp float; varying vec2 vUV; uniform sampler2D uDepth; uniform vec4 uProj; uniform vec4 uNF; uniform vec2 uTx; uniform float uRad;
float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * uNF.x * uNF.y / (uNF.y + uNF.x - z * (uNF.y - uNF.x)); }
vec3 pos(vec2 uv){ float z = lin(texture2D(uDepth, uv).r); return vec3((uv.x * 2.0 - 1.0) * uProj.x * z, ((uv.y * 2.0 - 1.0) - uProj.z) * uProj.y * z, -z); }
float h2(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
void main(){
  float d0 = texture2D(uDepth, vUV).r;
  if (d0 >= 0.99999) { gl_FragColor = vec4(1.0); return; }
  vec3 P0 = pos(vUV);
  if (-P0.z < 0.35) { gl_FragColor = vec4(1.0); return; }   // first-person arms (drawn in front of everything)
  vec3 N = normalize(cross(pos(vUV + vec2(uTx.x, 0.0)) - P0, pos(vUV + vec2(0.0, uTx.y)) - P0));
  if (dot(N, P0) > 0.0) N = -N;
  float a0 = h2(gl_FragCoord.xy) * 6.2832, occ = 0.0;
  float rad = uRad * clamp(-P0.z * 0.08, 0.6, 3.0);
  for (int i = 0; i < 8; i++) {
    float fi = float(i), a = a0 + fi * 2.39996, r = (fi + 0.5) / 8.0;
    vec3 t = normalize(cross(N, vec3(0.31, 0.83, 0.47)));
    vec3 b = cross(N, t);
    vec3 s = P0 + (t * cos(a) + b * sin(a)) * rad * r * 0.9 + N * rad * (0.15 + 0.5 * r);
    vec2 suv = vec2(s.x / (-s.z * uProj.x), s.y / (-s.z * uProj.y) + uProj.z) * 0.5 + 0.5;
    if (suv.x < 0.0 || suv.x > 1.0 || suv.y < 0.0 || suv.y > 1.0) continue;
    float sz = -lin(texture2D(uDepth, suv).r);
    float range = smoothstep(0.0, 1.0, rad / max(abs(P0.z - sz), 0.001));
    occ += step(s.z + 0.03, sz) * range;
  }
  gl_FragColor = vec4(vec3(1.0 - occ / 8.0), 1.0);
}`, ['aPos']);
    P.blur = this.program(VS, `precision highp float; varying vec2 vUV; uniform sampler2D uSrc; uniform vec2 uTx;
void main(){
  vec4 c = vec4(0.0);
  for (int j = -1; j <= 2; j++) for (int i = -1; i <= 2; i++) c += texture2D(uSrc, vUV + vec2(float(i) - 0.5, float(j) - 0.5) * uTx);
  gl_FragColor = c / 16.0;
}`, ['aPos']);
    // god rays: radial blur of bright sky pixels toward the sun's screen position
    P.rays = this.program(VS, `precision highp float; varying vec2 vUV; uniform sampler2D uSrc, uDepth; uniform vec2 uSunUV; uniform float uAsp;
void main(){
  vec2 dv = (uSunUV - vUV) / 28.0;
  vec2 uv = vUV; float w = 1.0; vec3 acc = vec3(0.0);
  for (int i = 0; i < 28; i++) {
    float sky = step(0.99999, texture2D(uDepth, uv).r);
    vec3 c = texture2D(uSrc, uv).rgb;
    acc += max(c - vec3(0.9), vec3(0.0)) * sky * w;
    w *= 0.955; uv += dv;
  }
  gl_FragColor = vec4(acc / 28.0, 1.0);
}`, ['aPos']);
    P.comp = this.program(VS, `precision highp float; varying vec2 vUV;
uniform sampler2D uColor, uBloom, uAO, uRays, uDepth, uBlur;
uniform vec4 uK;      // x exposure, y bloom, z ao strength, w rays
uniform vec4 uHeat;   // x shimmer, y horizon v, z time, w aspect
uniform vec4 uFires[6];
uniform vec4 uDof;    // x focus (m), y aperture, z -, w on
uniform vec4 uNF;
uniform vec4 uNoFx;   // a rect (uv) without ssao/dof (dialogue portrait)
uniform vec3 uRaysC, uGrade;
float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * uNF.x * uNF.y / (uNF.y + uNF.x - z * (uNF.y - uNF.x)); }
float h2(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
vec3 bAces(vec3 c) { return clamp((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0.0, 1.0); }
void main(){
  vec2 uv = vUV, off = vec2(0.0);
  float t = uHeat.z;
  if (uHeat.x > 0.0) {
    // shimmer near the horizon, only on what is far away (a pole across the street stays straight)
    float k = uHeat.x * smoothstep(0.1, 0.0, abs(uv.y - uHeat.y) - 0.015) * smoothstep(35.0, 140.0, lin(texture2D(uDepth, uv).r));
    off.x += sin(uv.y * 260.0 + t * 6.0 + sin(uv.x * 37.0 + t * 1.3) * 2.0) * 0.0011 * k;
    off.y += sin(uv.x * 190.0 - t * 5.0) * 0.0006 * k;
  }
  for (int i = 0; i < 6; i++) {
    vec4 F = uFires[i];
    if (F.z <= 0.0) continue;
    vec2 q = (uv - F.xy) * vec2(uHeat.w, 1.0);
    float k = smoothstep(F.z, 0.0, length(q - vec2(0.0, F.z * 0.6))) * F.w;
    off += vec2(sin(uv.y * 320.0 + t * 11.0), sin(uv.x * 240.0 - t * 9.0) * 0.5) * 0.0028 * k;
  }
  bool fx = !(uv.x > uNoFx.x && uv.x < uNoFx.z && uv.y > uNoFx.y && uv.y < uNoFx.w);
  vec3 c = texture2D(uColor, uv + off).rgb;
  float dep = texture2D(uDepth, uv).r;
  if (uDof.w > 0.0 && fx) {
    float z = dep >= 0.99999 ? 1000.0 : lin(dep);
    float coc = clamp(abs(z - uDof.x) / max(z, 0.5) * uDof.y, 0.0, 1.0) * uDof.w;
    c = mix(c, texture2D(uBlur, uv).rgb, coc);
  }
  if (uK.z > 0.0 && fx) {
    float ao = texture2D(uAO, uv).r;
    float lum = dot(c, vec3(0.3, 0.59, 0.11));
    c *= mix(1.0, ao, uK.z * (1.0 - smoothstep(0.8, 2.5, lum)));
  }
  c += texture2D(uBloom, uv).rgb * uK.y;
  if (uK.w > 0.0) c += texture2D(uRays, uv).rgb * uRaysC * uK.w;
#ifdef HDR
  c = bAces(c * uK.x);
  c = pow(c, vec3(1.0 / 2.2));
#endif
  // grade: gentle filmic contrast + saturation, then vignette + dither
  float l = dot(c, vec3(0.3, 0.59, 0.11));
  c = mix(vec3(l), c, uGrade.x);
  c = mix(c, c * c * (3.0 - 2.0 * c), uGrade.y);
  vec2 vq = uv - 0.5;
  c *= 1.0 - dot(vq, vq) * uGrade.z;
  c += (h2(gl_FragCoord.xy + fract(t) * 61.0) - 0.5) / 255.0;
  gl_FragColor = vec4(c, 1.0);
}`, ['aPos']);
    // programs added by other modules (textured PBR, weighted skinning…): fn(BurnsGL, progs) adds to progs
    for (const f of this.programHooks) { try { f(this, P); } catch (e) { console.error('burns: program hook failed', e); } }
  },
  programHooks: [],
  // register a program builder; it runs now (if the renderer is up) and again whenever programs are rebuilt (tier change, context loss)
  addPrograms(fn) { this.programHooks.push(fn); if (this.progs && this.gl) { try { fn(this, this.progs); } catch (e) { console.error('burns: program hook failed', e); } } },
  // GLSL dialect: our shaders are written GLSL 1.0-style; on WebGL2 they compile as GLSL 3.00 es via macros
  header(kind) {
    let h = '';
    if (this.gl2) {
      h = '#version 300 es\n';
      if (kind === 'vs') h += '#define attribute in\n#define varying out\n#define texture2D texture\n';
      else h += 'precision highp float;\nprecision highp sampler2DShadow;\n#define varying in\n#define texture2D texture\nout vec4 burnsOut;\n#define gl_FragColor burnsOut\n';
      h += '#define GL2 1\n';
    } else if (kind === 'fs' && this.derivs) h += '#extension GL_OES_standard_derivatives : enable\n';
    const D = this.defines();
    for (const k in D) h += `#define ${k} ${D[k]}\n`;
    return h;
  },
  program(vs, fs, attribs) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error('burns shader: ' + gl.getShaderInfoLog(s) + '\n' + src.split('\n').slice(0, 3).join('\n'));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, this.header('vs') + vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, this.header('fs') + fs));
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
    if (T.mipsDue && T.tex && T.gen === this.gen && !T.dirty && performance.now() > T.mipsDue) { T.mipsDue = 0; gl.bindTexture(gl.TEXTURE_2D, T.tex); gl.generateMipmap(gl.TEXTURE_2D); }
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
  // the bake composite (compiled on first use): tone map + grade a model render like the frame's composite pass and lay
  // it over an atlas region (R.bakeImage)
  bakeProg() {
    if (this._bake && this._bake.gen === this.gen) return this._bake;
    try {
      this._bake = this.program(`attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`, `precision highp float;
varying vec2 vUv;
uniform sampler2D uSrc; uniform sampler2D uBg; uniform vec4 uBgR; uniform vec2 uK;   // uK: x exposure, y 1 = linear HDR source
vec3 bAces(vec3 c) { return clamp((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0.0, 1.0); }
void main(){
  vec4 s = texture2D(uSrc, vUv);
  vec3 c = s.rgb;
  if (uK.y > 0.5) c = pow(bAces(c * uK.x), vec3(1.0 / 2.2));
  float l = dot(c, vec3(0.3, 0.59, 0.11));
  c = clamp(mix(vec3(l), c, 1.08), 0.0, 1.0);
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.12);
  vec3 b = texture2D(uBg, vec2(mix(uBgR.x, uBgR.z, vUv.x), mix(uBgR.y, uBgR.w, 1.0 - vUv.y))).rgb;
  gl_FragColor = vec4(mix(b, c, clamp(s.a, 0.0, 1.0)), 1.0);
}`, ['aPos']);
      this._bake.gen = this.gen;
    } catch (e) { console.warn(e); this._bake = null; }
    return this._bake;
  },
  // re-upload one region of a canvas texture (a freshly painted atlas tile) instead of the whole image.
  // Returns false when the texture isn't on the GPU yet or is already due for a full upload.
  // lazyMips: rebuild the mip chain a little later (once for a burst of updates, e.g. signs painted while tiles stream)
  texRegion(T, x, y, w, h, lazyMips) {
    const gl = this.gl;
    if (!gl || !T || !T.tex || T.gen !== this.gen || T.dirty) return false;
    const c = makeCanvas(w, h); c.getContext('2d').drawImage(T.src, x, y, w, h, 0, 0, w, h);
    const o = T.opts || {};
    gl.bindTexture(gl.TEXTURE_2D, T.tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, o.premult ? 1 : 0);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
    const pot = (T.src.width & (T.src.width - 1)) === 0 && (T.src.height & (T.src.height - 1)) === 0;
    if (o.mips && (pot || this.gl2)) { if (lazyMips) T.mipsDue = performance.now() + 350; else gl.generateMipmap(gl.TEXTURE_2D); }   // same rule as tex(): WebGL1 can't mip a non-power-of-two texture
    return true;
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
    for (let i = 0; i < 8; i++) {
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
  },
  /* ---- render targets (WebGL2) ---- */
  target(w, h, o) {
    const gl = this.gl, T = { w, h, fb: gl.createFramebuffer() }, f = o.fmt === 'hdr' && this.hdr;
    const ifmt = f ? gl.RGBA16F : gl.RGBA8, type = f ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, T.fb);
    if (o.msaa) {
      T.crb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, T.crb);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, o.msaa, ifmt, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, T.crb);
      if (o.depth) { T.drb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, T.drb); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, o.msaa, gl.DEPTH_COMPONENT24, w, h); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, T.drb); }
    } else {
      if (o.fmt !== 'none') {
        T.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, T.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, gl.RGBA, type, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, T.tex, 0);
      } else { gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE); }
      if (o.depth === 'tex' || o.depth === 'shadow') {
        T.dtex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, T.dtex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, w, h, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        const flt = o.depth === 'shadow' ? gl.LINEAR : gl.NEAREST;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, flt); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, flt);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (o.depth === 'shadow') { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL); }
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, T.dtex, 0);
      } else if (o.depth) { T.drb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, T.drb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, T.drb); }
    }
    T.ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return T;
  },
  freeTarget(T) {
    if (!T || !this.gl) return;
    const gl = this.gl;
    try { gl.deleteFramebuffer(T.fb); if (T.tex) gl.deleteTexture(T.tex); if (T.dtex) gl.deleteTexture(T.dtex); if (T.crb) gl.deleteRenderbuffer(T.crb); if (T.drb) gl.deleteRenderbuffer(T.drb); } catch (e) { /* ignore */ }
  },
  freeTargets() {
    const T = this.T; if (!T) return;
    for (const k in T) { const v = T[k]; if (Array.isArray(v)) v.forEach(t => this.freeTarget(t)); else if (v && v.fb) this.freeTarget(v); }
    this.T = null;
  },
  // make sure the frame targets exist for a w x h frame (resized lazily)
  targets(w, h) {
    const Q = this.Q; if (!Q || !this.gl2) return null;
    let T = this.T;
    if (T && T.w === w && T.h === h && T.gen === this.gen && T.tier === this.tier) return T;
    this.freeTargets();
    const ms = Q.msaa && this.maxMSAA ? Math.min(Q.msaa, this.maxMSAA) : 0;
    T = { w, h, gen: this.gen, tier: this.tier, ms };
    T.main = this.target(w, h, { fmt: 'hdr', depth: true, msaa: ms });
    if (ms && !T.main.ok) { this.freeTarget(T.main); T.ms = 0; T.main = this.target(w, h, { fmt: 'hdr', depth: 'tex' }); }
    T.res = T.ms ? this.target(w, h, { fmt: 'hdr', depth: 'tex' }) : T.main;
    if (!T.main.ok || !T.res.ok) { this.freeTargets(); this.failPost = true; return null; }
    const lv = Q.bloom || 0; T.bloom = [];
    let bw = w, bh = h;
    for (let i = 0; i < lv; i++) { bw = Math.max(1, bw >> 1); bh = Math.max(1, bh >> 1); T.bloom.push(this.target(bw, bh, { fmt: 'hdr' })); }
    T.bloomUp = T.bloom.slice(0, Math.max(0, lv - 1)).map(t => this.target(t.w, t.h, { fmt: 'hdr' }));
    if (Q.ssao) { T.ao = this.target(Math.max(1, w >> 1), Math.max(1, h >> 1), { fmt: 'ldr' }); T.ao2 = this.target(T.ao.w, T.ao.h, { fmt: 'ldr' }); }
    if (Q.rays) T.rays = this.target(Math.max(1, w >> 2), Math.max(1, h >> 2), { fmt: 'hdr' });
    if (Q.dof) { T.dof = this.target(Math.max(1, w >> 1), Math.max(1, h >> 1), { fmt: 'hdr' }); T.dof2 = this.target(T.dof.w, T.dof.h, { fmt: 'hdr' }); }
    if (Q.shadows) T.shadow = this.target(Q.shadows, Q.shadows, { fmt: 'none', depth: 'shadow' });
    this.T = T;
    return T;
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
const burnsLinC = (c, out, k) => { out = out || [0, 0, 0]; k = k === undefined ? 1 : k; out[0] = Math.pow(Math.max(0, c[0]), 2.2) * k; out[1] = Math.pow(Math.max(0, c[1]), 2.2) * k; out[2] = Math.pow(Math.max(0, c[2]), 2.2) * k; return out; };
class BurnsRenderer {
  constructor() {
    this.P = new Float32Array(16); this.V = new Float32Array(16); this.VP = new Float32Array(16); this.B = {};
    this.planes = new Float32Array(24);
    this.pl = new Float32Array(64); this.pc = new Float32Array(48); this.npl = 0;
    this.flat = new BurnsSpriteBatch(1500);
    this.bbs = new BurnsSpriteBatch(5000);
    this.stats = { draws: 0, tris: 0, shDraws: 0, shTris: 0 };   // per frame: main pass, and the sun-shadow pass
    this.w = 1; this.h = 1;
    this.LVP = new Float32Array(16); this.SM = new Float32Array(16);
    this.pass = 'main'; this.shadowOn = false;
    this.lin = { sky: [0, 0, 0], gnd: [0, 0, 0], key: [0, 0, 0], fog: [0, 0, 0], sun: [0, 0, 0], rim: [0, 0, 0] };
    this.post = { dof: null, fires: [], noFx: null };
  }
  get hdr() { return !!(BurnsGL.T && BurnsGL.hdr); }
  resize(w, h) {
    const c = BurnsGL.canvas;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    this.w = w; this.h = h;
  }
  // cam: {x,y,z, tx,ty,tz, fov (vertical, rad), shift (NDC lens shift), near, far, roll}
  setCamera(cam) {
    this.cam = cam;
    const asp = this.w / this.h;
    this.near = cam.near || 0.15; this.far = cam.far || 1400;
    BurnsM.persp(this.P, cam.fov, asp, this.near, this.far, cam.shift || 0);
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
  // point lights [{x,y,z,r,c:[r,g,b],i}] (sorted by the caller: most important first)
  setLights(list) {
    const pl = this.pl, pc = this.pc, max = BurnsGL.gl2 && BurnsGL.Q ? BurnsGL.Q.npl : 4;
    let n = 0;
    for (let i = 0; i < max; i++) {
      const L = list && list[i];
      if (L) { pl[i * 4] = L.x; pl[i * 4 + 1] = L.y; pl[i * 4 + 2] = L.z; pl[i * 4 + 3] = Math.max(0.01, L.r); const k = (L.i || 1) * 1.6; pc[i * 3] = Math.pow(L.c[0], 2.2) * k; pc[i * 3 + 1] = Math.pow(L.c[1], 2.2) * k; pc[i * 3 + 2] = Math.pow(L.c[2], 2.2) * k; n = i + 1; }
      else { pl[i * 4] = 0; pl[i * 4 + 1] = -9999; pl[i * 4 + 2] = 0; pl[i * 4 + 3] = 0.01; pc[i * 3] = pc[i * 3 + 1] = pc[i * 3 + 2] = 0; }
    }
    this.npl = n;
  }
  /* ---------- frame ---------- */
  begin(env) {
    const gl = BurnsGL.gl;
    this.T = BurnsGL.targets(this.w, this.h);
    if (env) this.prepEnv(env);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.T ? this.T.main.fb : null);
    gl.viewport(0, 0, this.w, this.h);
    gl.disable(gl.SCISSOR_TEST);
    gl.depthMask(true); gl.clearDepth(1); gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.frontFace(gl.CCW);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    // main-pass counters restart here; the shadow pass (drawn before begin()) keeps its own: stats.shDraws, stats.shTris
    if (!this.shadowRan) { this.shadowStats = 0; this.stats.shDraws = 0; }
    this.shadowRan = false; this.stats.shTris = this.shadowStats;
    this.stats.draws = 0; this.stats.tris = 0;
    this.post.noFx = null;
  }
  // linear-space light colours for this frame (+ exposure, glow boost)
  prepEnv(env) {
    const L = this.lin;
    burnsLinC(env.keyCol, L.key, 1.15);
    const kl = 0.3 * L.key[0] + 0.59 * L.key[1] + 0.11 * L.key[2];
    this.night = clamp(1 - kl * 2.2, 0, 1);
    // night ambient gets a lift so the playa reads as moonlit blue, not black (linear light is darker in the shadows)
    const ak = 0.95 + 0.75 * this.night;
    burnsLinC(env.sky, L.sky, ak); burnsLinC(env.gnd, L.gnd, ak); burnsLinC(env.fogCol, L.fog); burnsLinC(env.sunCol, L.sun); burnsLinC(env.rimCol || [0.5, 0.45, 0.7], L.rim);
    this.envRef = env;
  }
  // common lighting uniforms
  applyEnv(p, env, world) {
    const gl = BurnsGL.gl, u = p.u, cam = this.cam, L = this.lin;
    if (this.envRef !== env) this.prepEnv(env);
    if (u.uVP) gl.uniformMatrix4fv(u.uVP, false, this.VP);
    if (u.uCam) gl.uniform3f(u.uCam, cam.x, cam.y, cam.z);
    if (u.uSky) gl.uniform3fv(u.uSky, L.sky);
    if (u.uGnd) gl.uniform3fv(u.uGnd, L.gnd);
    if (u.uKeyD) gl.uniform3fv(u.uKeyD, env.keyDir);
    if (u.uKeyC) gl.uniform3fv(u.uKeyC, L.key);
    if (u.uSunD) gl.uniform3fv(u.uSunD, env.sunDir);
    if (u.uSunC) gl.uniform3fv(u.uSunC, L.sun);
    if (u.uFogC) gl.uniform3fv(u.uFogC, L.fog);
    if (u.uFog) gl.uniform4f(u.uFog, env.fogD, env.fogH, env.fogE, env.fogMax);
    if (u.uTrip) gl.uniform1f(u.uTrip, env.trip || 0);
    if (u.uTime) gl.uniform1f(u.uTime, env.time || 0);
    if (u.uEmB) gl.uniform1f(u.uEmB, (env.emB || 1.4) * (this.hdr ? 1.6 + 1.6 * this.night : 1.0));
    if (u.uExp) gl.uniform4f(u.uExp, env.exposure || 1, env.dust === undefined ? 0.5 : env.dust, this.night, this.hdr ? 2.4 + this.night * 1.5 : 1);
    if (u.uPL) gl.uniform4fv(u.uPL, this.pl.subarray(0, (BurnsGL.Q ? BurnsGL.Q.npl : 4) * 4));
    if (u.uPC) gl.uniform3fv(u.uPC, this.pc.subarray(0, (BurnsGL.Q ? BurnsGL.Q.npl : 4) * 3));
    if (u.uNPL) gl.uniform1i(u.uNPL, this.npl);
    if (u.uLm) {
      const lm = world && world.lightmap;
      if (lm) gl.uniform4f(u.uLm, lm.x0, lm.z0, 1 / lm.w, 1 / lm.d); else gl.uniform4f(u.uLm, 0, 0, 0, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, lm ? BurnsGL.tex(lm.T) : BurnsGL.black); gl.uniform1i(u.uLight, 1);
      gl.activeTexture(gl.TEXTURE0);
    }
    if (u.uEnv) {
      const T = BurnsGL.envT, ok = !!(this.probeOk && T && T.gen === BurnsGL.gen);
      gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, ok ? T.tex : BurnsGL.black); gl.uniform1i(u.uEnv, 5); gl.activeTexture(gl.TEXTURE0);
      gl.uniform1f(u.uEnvK, ok ? 1 : 0);
    }
    if (u.uShadow) {
      const T = this.T, on = this.shadowOn && T && T.shadow;
      gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, T && T.shadow ? T.shadow.dtex : null); gl.uniform1i(u.uShadow, 4); gl.activeTexture(gl.TEXTURE0);
      gl.uniformMatrix4fv(u.uShadowM, false, this.SM);
      gl.uniform4f(u.uShadowK, this.shTexel || 0.001, this.shWorld || 0.05, this.shFade0 || 50, this.shFade1 || 60);
      const sc = this.shCenter || [0, 0, 0]; if (u.uShadowO) gl.uniform2f(u.uShadowO, sc[0], sc[2]);
      gl.uniform1f(u.uShadowS, on ? this.shStrength : 0);
    }
  }
  /* ---------- sun shadows ----------
     A stable, texel-snapped ortho frustum around the view slice [near, dist]; the bounding sphere keeps
     its size constant while the camera turns (no shimmering). Casters are drawn with R.skin()/statics() between
     shadowBegin() and shadowEnd() (the same calls as the main pass). */
  shadowBegin(env, opts) {
    const Q = BurnsGL.Q; this.shadowOn = false;
    if (!Q || !Q.shadows) return false;
    const T = BurnsGL.targets(this.w, this.h); this.T = T; if (!T || !T.shadow || !T.shadow.ok) return false;
    const L = env.keyDir; if (!L || L[1] < 0.06) return false;
    const kl = 0.3 * env.keyCol[0] + 0.59 * env.keyCol[1] + 0.11 * env.keyCol[2], al = 0.3 * env.sky[0] + 0.59 * env.sky[1] + 0.11 * env.sky[2];
    this.shStrength = clamp(kl / (kl + al * 0.55 + 0.02) * 1.05, 0, 0.9) * (opts && opts.strength !== undefined ? opts.strength : 1);
    if (this.shStrength < 0.05) return false;
    if (kl < 0.32 && BurnsGL.tier !== 'ultra' && BurnsGL.tier !== 'high') return false;   // phones skip faint moon shadows (a whole extra pass)
    const cam = this.cam, B = this.B, dist = (opts && opts.dist) || Q.shadowDist, size = Q.shadows;
    // a circle on the ground ahead of the camera (third person: around Brady), constant radius = no size shimmer
    const fl = Math.hypot(B.fx, B.fz) || 1, fx = B.fx / fl, fz = B.fz / fl;
    const R = dist * 0.62;
    let cx = cam.x + fx * dist * 0.4, cy = cam.ty !== undefined ? Math.min(cam.ty, cam.y) : cam.y - 1.5, czw = cam.z + fz * dist * 0.4;
    // light basis: l = direction the light travels, r = l x up, v = r x l (right-handed: r x v = -l)
    const lx = -L[0], ly = -L[1], lz = -L[2];
    let ux = 0, uy = 1, uz = 0; if (Math.abs(ly) > 0.95) { ux = 1; uy = 0; }
    let rx = ly * uz - lz * uy, ry = lz * ux - lx * uz, rz = lx * uy - ly * ux; const rl = Math.hypot(rx, ry, rz) || 1; rx /= rl; ry /= rl; rz /= rl;
    const vx = ry * lz - rz * ly, vy = rz * lx - rx * lz, vz = rx * ly - ry * lx;
    // snap the centre to whole shadow texels in light space
    const wt = 2 * R / size;
    let pr = cx * rx + cy * ry + czw * rz, pu = cx * vx + cy * vy + czw * vz; const pf = cx * lx + cy * ly + czw * lz;
    pr = Math.floor(pr / wt) * wt; pu = Math.floor(pu / wt) * wt;
    cx = rx * pr + vx * pu + lx * pf; cy = ry * pr + vy * pu + ly * pf; czw = rz * pr + vz * pu + lz * pf;
    const back = R + 70, depth = 2 * R + 90;
    const ex = cx - lx * back, ey = cy - ly * back, ez = czw - lz * back;
    const V = new Float32Array(16), Pm = new Float32Array(16);
    V[0] = rx; V[4] = ry; V[8] = rz; V[12] = -(rx * ex + ry * ey + rz * ez);
    V[1] = vx; V[5] = vy; V[9] = vz; V[13] = -(vx * ex + vy * ey + vz * ez);
    V[2] = -lx; V[6] = -ly; V[10] = -lz; V[14] = (lx * ex + ly * ey + lz * ez);
    V[15] = 1;
    const n = 0.5, f = depth;
    Pm[0] = 1 / R; Pm[5] = 1 / R; Pm[10] = -2 / (f - n); Pm[14] = -(f + n) / (f - n); Pm[15] = 1;
    BurnsM.mul4(this.LVP, Pm, V);
    this.SM.set(this.LVP);
    this.shTexel = 1 / size; this.shWorld = wt; this.shFade0 = R * 0.8; this.shFade1 = R * 0.97;
    this.shCenter = [cx, cy, czw]; this.shR = R;
    const gl = BurnsGL.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, T.shadow.fb);
    gl.viewport(0, 0, size, size);
    gl.disable(gl.SCISSOR_TEST); gl.disable(gl.BLEND);
    gl.depthMask(true); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.clearDepth(1);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.CULL_FACE);   // thin and open shapes cast from both sides
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.6, 2.5);
    this.pass = 'shadow'; this.shadowStats = 0; this.stats.shDraws = 0; this.shadowRan = true;
    return true;
  }
  // is a sphere near the shadow frustum? (cheap caster culling)
  shadowNear(x, y, z, r) { const c = this.shCenter; if (!c) return false; const d = Math.hypot(x - c[0], z - c[2]); return d < this.shR + r + 30; }
  shadowEnd() {
    const gl = BurnsGL.gl;
    gl.disable(gl.POLYGON_OFFSET_FILL); gl.enable(gl.CULL_FACE);
    this.pass = 'main'; this.shadowOn = true;
    this.T = BurnsGL.T;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.T ? this.T.main.fb : null);
    gl.viewport(0, 0, this.w, this.h);
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
    if (u.uAtm) gl.uniform4f(u.uAtm, env.scatter === undefined ? 1 : env.scatter, env.milkyway === undefined ? 1 : env.milkyway, this.hdr ? (env.sunHDR || 7) : 0, env.belt === undefined ? 1 : env.belt);
    if (u.uExp) gl.uniform4f(u.uExp, env.exposure || 1, 0, 0, 1);
    gl.uniform1f(u.uTime, env.time || 0); gl.uniform1f(u.uHaze, env.haze); gl.uniform1f(u.uTrip, env.trip || 0);
    this.probe(env);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.stats.draws++;
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.depthFunc(gl.LEQUAL); gl.enable(gl.CULL_FACE);
  }
  // the sky probe: the same sky drawn into a 256 x 128 equirect HDR texture (with mips for roughness), so chrome and
  // clear-coat paint reflect the real sunset, clouds, stars and city glow. Called by sky() with its program and uniforms set.
  probe(env) {
    const gl = BurnsGL.gl, p = BurnsGL.progs.sky, u = p.u;
    if (!BurnsGL.gl2 || !BurnsGL.hdr || !BurnsGL.Q || !BurnsGL.Q.env || !u.uEqui) { this.probeOk = false; return; }
    let T = BurnsGL.envT;
    if (!T || T.gen !== BurnsGL.gen) {
      T = BurnsGL.target(256, 128, { fmt: 'hdr' }); T.gen = BurnsGL.gen;
      gl.bindTexture(gl.TEXTURE_2D, T.tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      BurnsGL.envT = T;
    }
    if (!T.ok) { this.probeOk = false; return; }
    gl.bindFramebuffer(gl.FRAMEBUFFER, T.fb); gl.viewport(0, 0, T.w, T.h);
    gl.uniform1f(u.uEqui, 1); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.uniform1f(u.uEqui, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.T ? this.T.main.fb : null); gl.viewport(0, 0, this.w, this.h);
    gl.bindTexture(gl.TEXTURE_2D, T.tex); gl.generateMipmap(gl.TEXTURE_2D);
    this.probeOk = true;
  }
  ground(G, env, world) {
    if (!G || this.pass === 'shadow') return;
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
  // static merged chunks, frustum + distance culled (in the shadow pass: chunks near the light frustum)
  statics(chunks, env, world, atlasT, maxDist, alphaK) {
    const gl = BurnsGL.gl, cam = this.cam;
    if (this.pass === 'shadow') {
      const p = BurnsGL.progs.shMesh; if (!p) return;
      gl.useProgram(p.p); gl.uniformMatrix4fv(p.u.uLVP, false, this.LVP);
      const c0 = this.shCenter, R = this.shR + 10;   // tight: only chunks that can shadow the visible circle
      for (const c of chunks) {
        const b = c.bounds;
        const dx = Math.max(b[0] - c0[0], 0, c0[0] - b[3]), dz = Math.max(b[2] - c0[2], 0, c0[2] - b[5]);
        if (dx * dx + dz * dz > R * R) continue;
        BurnsGL.geo(c);
        gl.bindBuffer(gl.ARRAY_BUFFER, c.vbo); BurnsGL.layoutMesh();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, c.ibo);
        gl.drawElements(gl.TRIANGLES, c.count, gl.UNSIGNED_SHORT, 0);
        this.stats.shDraws++; this.shadowStats += c.count / 3;
      }
      return;
    }
    const p = BurnsGL.progs.mesh, u = p.u, P = this.planes;
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
  /* instanced static props (BurnsInstancer): batches [{ geo, data: Float32Array (8 floats a copy: x, y, z, yaw, scale,
     tint r, g, b), n, dirty }]. One draw per batch; the shadow pass uses the depth-only variant. */
  instances(batches, env, world, atlasT) {
    const gl = BurnsGL.gl, I = BurnsGL.instGL;
    if (!I || !batches || !batches.length) return;
    const shadow = this.pass === 'shadow', p = shadow ? BurnsGL.progs.shMeshI : BurnsGL.progs.meshI;
    if (!p) return;
    gl.useProgram(p.p);
    if (shadow) gl.uniformMatrix4fv(p.u.uLVP, false, this.LVP);
    else {
      this.applyEnv(p, env, world);
      gl.uniform1f(p.u.uAlphaK, 1);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, BurnsGL.tex(atlasT)); gl.uniform1i(p.u.uTex, 0);
    }
    for (const b of batches) {
      if (!b.n || !b.geo || !b.geo.count) continue;
      BurnsGL.geo(b.geo);
      if (!b.ibuf || b.ibufGen !== BurnsGL.gen) { b.ibuf = gl.createBuffer(); b.ibufGen = BurnsGL.gen; b.dirty = true; }
      gl.bindBuffer(gl.ARRAY_BUFFER, b.geo.vbo); BurnsGL.layoutMesh();
      gl.bindBuffer(gl.ARRAY_BUFFER, b.ibuf);
      if (b.dirty) { gl.bufferData(gl.ARRAY_BUFFER, b.data.subarray(0, b.n * 8), gl.DYNAMIC_DRAW); b.dirty = false; }
      BurnsGL.enable(7);
      gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 32, 0); gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 32, 16);
      I.div(5, 1); I.div(6, 1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.geo.ibo);
      I.draw(b.geo.count, 0, b.n);
      I.div(5, 0); I.div(6, 0);
      if (shadow) { this.stats.shDraws++; this.shadowStats += b.geo.count / 3 * b.n; } else { this.stats.draws++; this.stats.tris += b.geo.count / 3 * b.n; }
    }
    BurnsGL.enable(5);
  }
  skinBegin(env, world, atlasT) {
    const gl = BurnsGL.gl;
    if (this.pass === 'shadow') { const p = BurnsGL.progs.shSkin; if (p) { gl.useProgram(p.p); gl.uniformMatrix4fv(p.u.uLVP, false, this.LVP); } return; }
    const p = BurnsGL.progs.skin, u = p.u;
    gl.useProgram(p.p);
    this.applyEnv(p, env, world);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, BurnsGL.tex(atlasT)); gl.uniform1i(u.uTex, 0);
    gl.uniform3fv(u.uRimC, this.lin.rim);
    this.faceV0 = BURNS_ATLAS.faceV0; this.faceV1 = BURNS_ATLAS.faceV1; this.faceRowV = BURNS_ATLAS.faceRowV;
    this._lastTint = null;
    if (u.uRain) { gl.uniform4f(u.uRain, 0, 0, 0, 0); this._rain = false; }
  }
  // geo: skinned geometry; bones: Float32Array (n*12); tint [r,g,b,a]; face row 0..3
  skin(geo, bones, n, tint, face, rim) {
    const gl = BurnsGL.gl;
    BurnsGL.geo(geo);
    if (this.pass === 'shadow') {
      const p = BurnsGL.progs.shSkin; if (!p) return;
      gl.uniform4fv(p.u.uB, n * 12 === bones.length ? bones : bones.subarray(0, n * 12));
      gl.bindBuffer(gl.ARRAY_BUFFER, geo.vbo); BurnsGL.layoutMesh();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geo.ibo);
      gl.drawElements(gl.TRIANGLES, geo.count, gl.UNSIGNED_SHORT, 0);
      this.stats.shDraws++; this.shadowStats += geo.count / 3;
      return;
    }
    const u = BurnsGL.progs.skin.u;
    gl.uniform4fv(u.uB, n * 12 === bones.length ? bones : bones.subarray(0, n * 12));
    if (tint) gl.uniform4f(u.uTint, tint[0], tint[1], tint[2], tint[3]); else gl.uniform4f(u.uTint, 0, 0, 0, 0);
    gl.uniform3f(u.uFace, this.faceV0, this.faceV1, (face || 0) * this.faceRowV);
    gl.uniform1f(u.uRim, (rim === undefined ? 0.35 : rim) * 0.6);
    // the Man's rainbow neon: anchor (his heart) and scale come from his own bone palette
    if (u.uRain && (geo.rainbow || this._rain)) {
      const rb = geo.rainbow;
      if (rb) { const o = rb.bone * 12, a = rb.at, sc = Math.hypot(bones[o], bones[o + 4], bones[o + 8]) || 1; gl.uniform4f(u.uRain, bones[o] * a[0] + bones[o + 1] * a[1] + bones[o + 2] * a[2] + bones[o + 3], bones[o + 4] * a[0] + bones[o + 5] * a[1] + bones[o + 6] * a[2] + bones[o + 7], bones[o + 8] * a[0] + bones[o + 9] * a[1] + bones[o + 10] * a[2] + bones[o + 11], 1 / sc); gl.uniform2f(u.uRainK, geo.rainHurt || 0, 0); }
      else gl.uniform4f(u.uRain, 0, 0, 0, 0);
      this._rain = !!rb;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, geo.vbo); BurnsGL.layoutMesh();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geo.ibo);
    gl.drawElements(gl.TRIANGLES, geo.count, gl.UNSIGNED_SHORT, 0);
    this.stats.draws++; this.stats.tris += geo.count / 3;
  }
  /* instanced crowds (BurnsCrowds): every copy in a batch shares one pose. crowdBegin() once, then crowd(...) per batch
     { data: Float32Array (8 floats a copy: x, y, z, yaw, scale, tint r, g, b), n, dirty } */
  crowdBegin(env, world, atlasT) {
    const gl = BurnsGL.gl, p = BurnsGL.progs.skinI; if (!p || !BurnsGL.instGL) return false;
    gl.useProgram(p.p);
    this.applyEnv(p, env, world);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, BurnsGL.tex(atlasT)); gl.uniform1i(p.u.uTex, 0);
    gl.uniform3fv(p.u.uRimC, this.lin.rim); gl.uniform4f(p.u.uTint, 0, 0, 0, 0);
    return true;
  }
  crowd(geo, bones, n, face, rim, b) {
    const gl = BurnsGL.gl, I = BurnsGL.instGL, p = BurnsGL.progs.skinI;
    if (!p || !I || !b.n) return;
    BurnsGL.geo(geo);
    if (!b.ibuf || b.ibufGen !== BurnsGL.gen) { b.ibuf = gl.createBuffer(); b.ibufGen = BurnsGL.gen; b.dirty = true; }
    gl.uniform4fv(p.u.uB, n * 12 === bones.length ? bones : bones.subarray(0, n * 12));
    gl.uniform3f(p.u.uFace, BURNS_ATLAS.faceV0, BURNS_ATLAS.faceV1, (face || 0) * BURNS_ATLAS.faceRowV);
    gl.uniform1f(p.u.uRim, (rim === undefined ? 0.35 : rim) * 0.6);
    gl.bindBuffer(gl.ARRAY_BUFFER, geo.vbo); BurnsGL.layoutMesh();
    gl.bindBuffer(gl.ARRAY_BUFFER, b.ibuf);
    if (b.dirty) { gl.bufferData(gl.ARRAY_BUFFER, b.data.subarray(0, b.n * 8), gl.DYNAMIC_DRAW); b.dirty = false; }
    BurnsGL.enable(7);
    gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 32, 0); gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 32, 16);
    I.div(5, 1); I.div(6, 1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geo.ibo);
    I.draw(geo.count, 0, b.n);
    I.div(5, 0); I.div(6, 0);
    BurnsGL.enable(5);
    this.stats.draws++; this.stats.tris += geo.count / 3 * b.n;
  }
  // shadow pass helper: draw only some objects of a skinned group (index ranges [[i0, i1], ...])
  skinRanges(geo, bones, n, ranges, cnt) {
    if (!cnt) return;
    const gl = BurnsGL.gl, p = this.pass === 'shadow' ? BurnsGL.progs.shSkin : BurnsGL.progs.skin; if (!p) return;
    BurnsGL.geo(geo);
    gl.uniform4fv(p.u.uB, n * 12 === bones.length ? bones : bones.subarray(0, n * 12));
    gl.bindBuffer(gl.ARRAY_BUFFER, geo.vbo); BurnsGL.layoutMesh();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geo.ibo);
    for (let k = 0; k < cnt; k++) { const r = ranges[k]; if (r[1] <= r[0]) continue; gl.drawElements(gl.TRIANGLES, r[1] - r[0], gl.UNSIGNED_SHORT, r[0] * 2); if (this.pass === 'shadow') { this.stats.shDraws++; this.shadowStats += (r[1] - r[0]) / 3; } else { this.stats.draws++; this.stats.tris += (r[1] - r[0]) / 3; } }
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
    if (u.uGlowK) gl.uniform1f(u.uGlowK, this.hdr ? 1.25 + 1.6 * (this.night || 0) : 1);
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
    const bgc = this.hdr ? burnsLinC(bg) : bg;
    gl.clearColor(bgc[0], bgc[1], bgc[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const save = { P: this.P.slice(), V: this.V.slice(), VP: this.VP.slice(), cam: this.cam, B: Object.assign({}, this.B), shadowOn: this.shadowOn, env: this.envRef };
    const hy = headY || 1.6;
    BurnsM.persp(this.P, 0.3, w / h, 0.1, 50, 0);
    BurnsM.lookAt(this.V, this.B, 0.5, hy + 0.1, 2.0, 0, hy - 0.06, 0);
    BurnsM.mul4(this.VP, this.P, this.V);
    this.cam = { x: 0.5, y: hy + 0.1, z: 2.0 };
    this.shadowOn = false;
    const penv = Object.assign({}, env, { fogD: 0, trip: 0, sky: [0.75, 0.72, 0.85], gnd: [0.35, 0.3, 0.38], keyDir: [0.45, 0.6, 0.66], keyCol: [0.78, 0.7, 0.62], emB: 1.4, rimCol: [0.7, 0.6, 1.0], dust: 0 });
    const savedPL = this.pl.slice(), savedPC = this.pc.slice(), savedN = this.npl;
    this.setLights(null);
    this.prepEnv(penv);
    this.skinBegin(penv, null, atlasT);
    draw(this);
    this.pl.set(savedPL); this.pc.set(savedPC); this.npl = savedN;
    this.P.set(save.P); this.V.set(save.V); this.VP.set(save.VP); this.cam = save.cam; Object.assign(this.B, save.B); this.shadowOn = save.shadowOn;
    if (save.env) this.prepEnv(save.env);
    gl.disable(gl.SCISSOR_TEST); gl.viewport(0, 0, this.w, this.h); gl.clearColor(0, 0, 0, 1);
    this.post.noFx = [rect.x / this.w, 1 - (rect.y + rect.h) / this.h, (rect.x + rect.w) / this.w, 1 - rect.y / this.h];
  }
  /* offscreen render of a posed model, composited over a background atlas region, returned as a 2D canvas (engine-made
     atlas art, such as the Chinka photo). Call it before the frame's setCamera: it borrows the camera and light state
     and puts it back. The model is lit and tone-mapped like the frame, composited on the GPU into a corner of the GL
     canvas (which the frame then draws over) and copied out with drawImage: no readPixels, no GPU stall.
     cam: {x,y,z, tx,ty,tz, fov}; env: a full lighting env (BurnsEnv.build + overrides); draw(R) issues R.skin() calls;
     bg: an atlas region {u0,v0,u1,v1} shown behind the model. Returns a canvas (up to w x h), or null. */
  bakeImage(w, h, cam, env, draw, bg) {
    const gl = BurnsGL.gl, cv = BurnsGL.canvas;
    if (!gl || BurnsGL.lost || !cv) return null;
    const k = Math.min(1, cv.width / w, cv.height / h); w = Math.floor(w * k); h = Math.floor(h * k);
    if (w < 16 || h < 16) return null;
    if (BurnsGL.gl2) this.T = BurnsGL.targets(Math.max(64, this.w), Math.max(64, this.h));   // the frame's own targets (begin() makes them anyway); this.hdr reads them
    const hdr = this.hdr, prog = BurnsGL.bakeProg();
    let T, out = null;
    if (BurnsGL.gl2) T = BurnsGL.target(w, h, { fmt: hdr ? 'hdr' : 'ldr', depth: true });
    else {   // WebGL1 (legacy tier): an RGBA8 texture and a 16-bit depth buffer
      T = { w, h, fb: gl.createFramebuffer(), tex: gl.createTexture(), drb: gl.createRenderbuffer() };
      gl.bindTexture(gl.TEXTURE_2D, T.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindRenderbuffer(gl.RENDERBUFFER, T.drb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, T.fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, T.tex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, T.drb);
      T.ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    }
    if (T.ok && prog) {
      const save = { P: this.P.slice(), V: this.V.slice(), VP: this.VP.slice(), cam: this.cam, B: Object.assign({}, this.B), shadowOn: this.shadowOn, pass: this.pass, env: this.envRef, pl: this.pl.slice(), pc: this.pc.slice(), npl: this.npl };
      // 1. the model, into its own target (transparent background)
      gl.bindFramebuffer(gl.FRAMEBUFFER, T.fb);
      gl.viewport(0, 0, w, h); gl.disable(gl.SCISSOR_TEST); gl.disable(gl.BLEND);
      gl.depthMask(true); gl.clearDepth(1); gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.frontFace(gl.CCW);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      BurnsM.persp(this.P, cam.fov || 0.5, w / h, 0.1, 60, 0);
      BurnsM.lookAt(this.V, this.B, cam.x, cam.y, cam.z, cam.tx, cam.ty, cam.tz);
      BurnsM.mul4(this.VP, this.P, this.V);
      this.cam = { x: cam.x, y: cam.y, z: cam.z };
      this.shadowOn = false; this.pass = 'main';
      this.setLights(cam.lights || null);
      this.prepEnv(env);
      this.skinBegin(env, null, BURNS_ATLAS.T);
      draw(this);
      // 2. tone map + grade it over the background, into the bottom-left corner of the GL canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.useProgram(prog.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T.tex); gl.uniform1i(prog.u.uSrc, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, bg ? BurnsGL.tex(BURNS_ATLAS.T) : BurnsGL.black); gl.uniform1i(prog.u.uBg, 1);
      gl.activeTexture(gl.TEXTURE0);
      const r = bg || { u0: 0, v0: 0, u1: 1, v1: 1 };
      gl.uniform4f(prog.u.uBgR, r.u0, r.v0, r.u1, r.v1);
      gl.uniform2f(prog.u.uK, (env.exposure || 1) * 0.9, hdr ? 1 : 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, BurnsGL.fsBuf); BurnsGL.enable(1); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // 3. copy it out (the same path the game uses to show every frame)
      out = makeCanvas(w, h);
      out.getContext('2d').drawImage(cv, 0, cv.height - h, w, h, 0, 0, w, h);
      gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
      this.P.set(save.P); this.V.set(save.V); this.VP.set(save.VP); this.cam = save.cam; Object.assign(this.B, save.B);
      this.shadowOn = save.shadowOn; this.pass = save.pass; this.pl.set(save.pl); this.pc.set(save.pc); this.npl = save.npl;
      if (save.env) this.prepEnv(save.env); else this.envRef = null;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.w, this.h); gl.clearColor(0, 0, 0, 1);
    BurnsGL.freeTarget(T);
    return out;
  }
  /* ---------- post-processing: resolve, SSAO, bloom, god rays, DOF, tone map, to the canvas ----------
     fx: { dof: {focus, aperture} | null, fires: [[x,y,z,r]...], heat: 0..1, rays: 0..1, bloom, exposure, grade } */
  end(env, fx) {
    const gl = BurnsGL.gl, T = this.T;
    if (!T) return;   // legacy path rendered straight to the canvas
    fx = fx || {};
    const P = BurnsGL.progs, Q = BurnsGL.Q, w = this.w, h = this.h;
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND); gl.disable(gl.SCISSOR_TEST);
    // resolve MSAA colour + depth
    if (T.ms) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, T.main.fb); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, T.res.fb);
      gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      if (Q.ssao || Q.rays || Q.dof || Q.heat) gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    }
    const src = T.res;
    gl.bindBuffer(gl.ARRAY_BUFFER, BurnsGL.fsBuf); BurnsGL.enable(1); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    const pass = (prog, tgt, setup) => {
      gl.useProgram(prog.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, tgt ? tgt.fb : null);
      gl.viewport(0, 0, tgt ? tgt.w : w, tgt ? tgt.h : h);
      setup(prog.u);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      this.stats.draws++;
    };
    const bind = (unit, tex, loc) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(loc, unit); };
    const night = this.night || 0;
    // bloom: prefilter -> down chain -> up chain
    const B = T.bloom;
    if (B.length) {
      const th = this.hdr ? (fx.bloomThreshold || 1.0) : 0.8;
      pass(P.pre, B[0], u => { bind(0, src.tex, u.uSrc); gl.uniform2f(u.uTx, 1 / w, 1 / h); gl.uniform4f(u.uTh, th, th * 0.5, 0, 0); });
      for (let i = 1; i < B.length; i++) pass(P.down, B[i], u => { bind(0, B[i - 1].tex, u.uSrc); gl.uniform2f(u.uTx, 0.5 / B[i - 1].w, 0.5 / B[i - 1].h); });
      // up: write level i = blur(level i+1) + level i   (additive blend)
      let up = B[B.length - 1];
      for (let i = B.length - 2; i >= 0; i--) {
        const dst = T.bloomUp[i];
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb); gl.viewport(0, 0, dst.w, dst.h);
        gl.useProgram(P.down.p); bind(0, B[i].tex, P.down.u.uSrc); gl.uniform2f(P.down.u.uTx, 0.5 / B[i].w, 0.5 / B[i].h); gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(P.up.p); bind(0, up.tex, P.up.u.uSrc); gl.uniform2f(P.up.u.uTx, 0.5 / up.w, 0.5 / up.h); gl.uniform1f(P.up.u.uK, 1.0); gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.disable(gl.BLEND);
        this.stats.draws += 2;
        up = dst;
      }
      this.bloomTex = up.tex;
    }
    // SSAO (half res) + blur
    const useAO = Q.ssao && T.ao && (fx.ao !== false);
    if (useAO) {
      pass(P.ssao, T.ao, u => { bind(0, src.dtex, u.uDepth); gl.uniform4f(u.uProj, this.tanX, this.tanY, this.cam.shift || 0, 0); gl.uniform4f(u.uNF, this.near, this.far, 0, 0); gl.uniform2f(u.uTx, 1 / T.ao.w, 1 / T.ao.h); gl.uniform1f(u.uRad, 0.55); });
      pass(P.blur, T.ao2, u => { bind(0, T.ao.tex, u.uSrc); gl.uniform2f(u.uTx, 1 / T.ao.w, 1 / T.ao.h); });
    }
    // god rays toward the sun (only when the sun is up-ish and in front of the camera)
    let raysK = 0; const sd = env.sunDir;
    if (Q.rays && T.rays && sd[1] > -0.05) {
      const o = {}, cam = this.cam;
      if (this.project(cam.x + sd[0] * 900, cam.y + sd[1] * 900, cam.z + sd[2] * 900, 1, 1, o)) {
        const sx = o.x, sy = 1 - o.y, inside = clamp(1.4 - Math.max(Math.abs(sx - 0.5), Math.abs(sy - 0.5)) * 1.6, 0, 1);
        const low = clamp(1 - sd[1] * 2.2, 0.15, 1);
        raysK = inside * low * (fx.rays === undefined ? 1 : fx.rays) * (1 - night);
        if (raysK > 0.01) pass(P.rays, T.rays, u => { bind(0, src.tex, u.uSrc); bind(1, src.dtex, u.uDepth); gl.uniform2f(u.uSunUV, sx, sy); gl.uniform1f(u.uAsp, w / h); });
      }
    }
    // depth of field (cutscenes): half-res blurred copy
    const dof = fx.dof && Q.dof && T.dof;
    if (dof) {
      pass(P.down, T.dof, u => { bind(0, src.tex, u.uSrc); gl.uniform2f(u.uTx, 1 / w, 1 / h); });
      pass(P.blur, T.dof2, u => { bind(0, T.dof.tex, u.uSrc); gl.uniform2f(u.uTx, 1.5 / T.dof.w, 1.5 / T.dof.h); });
    }
    // composite -> canvas
    pass(P.comp, null, u => {
      bind(0, src.tex, u.uColor);
      bind(1, B.length ? this.bloomTex : BurnsGL.black, u.uBloom);
      bind(2, useAO ? T.ao2.tex : BurnsGL.white, u.uAO);
      bind(3, raysK > 0.01 ? T.rays.tex : BurnsGL.black, u.uRays);
      bind(4, src.dtex || BurnsGL.white, u.uDepth);
      bind(5, dof ? T.dof2.tex : src.tex, u.uBlur);
      gl.uniform4f(u.uK, (env.exposure || 1) * (fx.exposure || 1) * (0.86 + 0.12 * night), B.length ? (fx.bloom === undefined || fx.bloom === null ? 0.065 + 0.11 * night : fx.bloom) * (env.bloom === undefined ? 1 : env.bloom) : 0, useAO ? 0.85 : 0, raysK * 0.9);
      const heat = Q.heat ? (fx.heat || 0) : 0;
      let hv = 0.5; { const o = {}, cam = this.cam, B0 = this.B; const hx = cam.x + B0.fx * 400, hz = cam.z + B0.fz * 400; if (this.project(hx, 0, hz, 1, 1, o)) hv = 1 - o.y; }
      gl.uniform4f(u.uHeat, heat, hv, env.time || 0, w / h);
      const F = new Float32Array(24), fires = Q.heat ? (fx.fires || []) : [];
      for (let i = 0, k = 0; i < fires.length && k < 6; i++) { const f = fires[i], o = {}; if (!this.project(f[0], f[1] + 0.6, f[2], 1, 1, o) || o.w > 45) continue; F[k * 4] = o.x; F[k * 4 + 1] = 1 - o.y; F[k * 4 + 2] = clamp((f[3] || 0.6) * 1.6 / o.w, 0.01, 0.25); F[k * 4 + 3] = 1; k++; }
      gl.uniform4fv(u.uFires, F);
      gl.uniform4f(u.uDof, dof ? fx.dof.focus : 0, dof ? (fx.dof.aperture || 1.2) : 0, 0, dof ? 1 : 0);
      gl.uniform4f(u.uNF, this.near, this.far, 0, 0);
      const nf = this.post.noFx || [2, 2, 2, 2]; gl.uniform4f(u.uNoFx, nf[0], nf[1], nf[2], nf[3]);
      const rc = this.lin.sun; gl.uniform3f(u.uRaysC, 0.55 + rc[0] * 0.4, 0.5 + rc[1] * 0.4, 0.45 + rc[2] * 0.4);
      const gr = fx.grade || env.grade || [1.08, 0.12, 0.32];
      gl.uniform3f(u.uGrade, gr[0], gr[1], gr[2]);
    });
    gl.activeTexture(gl.TEXTURE0);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.enable(gl.CULL_FACE);
  }
}
