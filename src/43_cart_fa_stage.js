/* ============================================================
   ART CART — the showroom stage (the car-select scene's set).
   A blue-hour studio on the playa: a bevelled turntable plinth (graphite
   body, chrome lip, an inset LED ring in the car's light colour, a smoked
   glass top that mirrors the car), a glossy dark floor that melts into the
   horizon glow, and out-of-focus playa lights far behind.
   Lighting: a warm key from high behind the camera's left shoulder (the
   env's sun: never on screen, but clear-coat and chrome reflect it through
   the sky probe as a bright glint, and it casts the car's shadow), two cool
   rim lights behind the car, a soft neutral fill, and the skin shader's
   fresnel rim in ice blue. A lighter band high in the sky reads as a strip
   light on glossy paint; the city's warm glow sits on the horizon behind.
   Everything is built once; nothing here allocates per frame.
   Draws (main pass): sky 1, floor + plinth 1, LED ring 1, car 1 + driver 1,
   mirrored car 1, glass 1, sprites 2, then post.
   ============================================================ */
const CART_STAGE = { H: 0.3, R: 3.9 };
const CART_SPIN = 0.3;   // the turntable's steady turn (rad/s): once round in about 21 s
const CartShowroom = {
  world: null, sky: null, env: null,
  build() {
    if (this.world) return this.world;
    const H = CART_STAGE.H, R = CART_STAGE.R;
    // 1. opaque statics: the floor (an annulus round the plinth: the plinth's glass top shows what's under it) and the plinth body
    const m = new BurnsMesh(8192);
    m.shine(2);
    // floor: glossy blue-black, a touch lighter close to the stage; it fades into the fog colour (= the sky below the horizon)
    m.lathe([[420, 0, '#07080f'], [110, 0, '#07080f'], [45, 0, '#0a0b15'], [18, 0, '#10111c'], [9, 0, '#15161f'], [R + 0.5, 0, '#191a24'], [R - 0.2, 0, '#191a24']], { seg: 72 });
    // plinth body: a dark toe-kick (shadow gap), a graphite clear-coat wall, a bevelled chrome lip
    m.shine(1);
    m.lathe([[R - 0.2, 0, '#050508'], [R - 0.2, 0.06, '#050508'], [R - 0.2, 0.06, '#1d1e27'], [R - 0.02, 0.075, '#1d1e27'], [R, 0.095, '#22232e']], { seg: 96 });
    m.shine(2);
    m.lathe([[R, 0.095, '#262734'], [R, H - 0.045, '#2c2d3b']], { seg: 96 });
    m.shine(3);
    m.lathe([[R, H - 0.045, '#7c808c'], [R - 0.01, H - 0.018, '#a2a6b2'], [R - 0.035, H - 0.004, '#a2a6b2'], [R - 0.08, H, '#6c707c']], { seg: 96 });
    // the inset groove that holds the LED ring (dark, just proud of the glass)
    m.shine(1);
    m.lathe([[R - 0.08, H + 0.004, '#0b0b10'], [R - 0.36, H + 0.004, '#0b0b10']], { seg: 96 });
    const opaque = m.geo(); opaque.always = true;
    // 2. the LED ring: emissive dashes on their own bone, turning with the car (a turntable you can see turn), tinted per car
    const L = new BurnsMesh(4096);
    L.color('#ffffff', 1); L.shine(0);
    const n = 48, r0 = R - 0.27, r1 = R - 0.17, y = H + 0.008;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU, a1 = a0 + TAU / n * 0.72, s = i % 6 === 0 ? 1.25 : 1;
      const p = [];
      for (let k = 0; k <= 3; k++) { const a = a0 + (a1 - a0) * k / 3; p.push([Math.sin(a) * (r1 + 0.02 * (s - 1)), y, Math.cos(a) * (r1 + 0.02 * (s - 1))]); }
      for (let k = 3; k >= 0; k--) { const a = a0 + (a1 - a0) * k / 3; p.push([Math.sin(a) * r0, y, Math.cos(a) * r0]); }
      L.poly(p, null, [0, 1, 0]);
    }
    const ring = L.geo();
    // 3. smoked glass: the plinth top, drawn blended over the mirrored car; fine concentric bands read as a brushed finish
    const G = new BurnsMesh(4096);
    G.shine(2);
    const prof = [[R - 0.36, H]];
    for (let r = R - 0.42, k = 0; r > 0.2; r -= 0.07, k++) prof.push([r, H, k % 2 ? '#2a2c38' : '#171921']);
    prof.push([0, H, '#171921']);
    prof[0][2] = '#171921';
    G.lathe(prof, { seg: 96 });
    const glass = G.geo(); glass.always = true;
    // 4. bokeh: playa lights far behind the stage (billboards; the depth of field softens them further)
    const pal = ['#ffb15a', '#ff4fd8', '#38f2ff', '#ffe2c0', '#9a7aff', '#ff7a4a', '#7affc8'].map(c => burnsRGBf(c));
    const rng = mulberry32(31), bokeh = [];
    for (let i = 0; i < 44; i++) {
      // behind the car as seen from the showroom camera (which sits on +Z, a little to +X), low on the horizon
      const a = Math.PI + 0.38 + (rng() - 0.5) * 2.8, d = 26 + rng() * 40;
      bokeh.push({ x: Math.sin(a) * d, y: 0.3 + rng() * rng() * 3.2, z: Math.cos(a) * d, s: 1.0 + rng() * 1.8, c: pal[i % pal.length], a: 0.3 + rng() * 0.4, w: 0.4 + rng() * 1.3, ph: rng() * TAU });
    }
    // the city on the horizon: a long low band of small warm camp lights, denser behind the stage
    const warm = ['#ffc27a', '#ffd9a8', '#ff9a6a', '#ff6ab0', '#9ad2ff'].map(c => burnsRGBf(c));
    for (let i = 0; i < 70; i++) {
      const a = Math.PI + 0.38 + (rng() - 0.5) * (rng() < 0.6 ? 1.6 : 3.4), d = 110 + rng() * 90;
      bokeh.push({ x: Math.sin(a) * d, y: 0.4 + rng() * rng() * 3, z: Math.cos(a) * d, s: 0.7 + rng() * 1.1, c: warm[(rng() * warm.length) | 0], a: 0.35 + rng() * 0.4, w: 1 + rng() * 3, ph: rng() * TAU });
    }
    this.world = { chunks: [opaque], glass: [glass], ring, bokeh, lightmap: null, glows: [] };
    // blue hour: a deep navy zenith, a lighter band higher up (on clear-coat paint it reads as a studio strip light), the city's
    // warm glow on the horizon right behind the car. The "sun" is the key light: high behind the camera's left shoulder, never
    // on screen, but paint and chrome reflect it as a bright glint (the sky probe), and it casts the car's shadow
    this.sky = {
      zen: '#0a1440', hor: '#3e4488', mid: '#41509e', midK: 0.55, fog: '#463f86', fogD: 0.006, fogH: 0.04, haze: 0.35, fogMax: 1,
      sun: [328, 38], sunCol: '#ffe6cc', sunSize: 0.005, moon: [150, 30], moonK: 0, stars: 0.45,
      mtnCol: '#2a3068', mtnH: 0, city: [205, 0], cityCol: '#ff8a7a', cityK: 0.8,
      sky: '#9aa0b4', gnd: '#3d3640', key: '#ffe2c6', keyK: 1.3, emB: 1.4, rim: '#9ad2ff', clouds: 0, cloudCol: '#2a2a50'
    };
    return this.world;
  },
  // the renderer env, built once (BurnsEnv.build allocates); only its clock moves per frame
  envFor(time) {
    if (!this.env) {
      this.env = BurnsEnv.build(this.sky, null, 0, {}, 0);
      Object.assign(this.env, { scatter: 0.75, belt: 0.45, milkyway: 0.25, exposure: 1.05, bloom: 1, grade: [1.1, 0.16, 0.5], dust: 0 });
    }
    this.env.time = time;
    return this.env;
  }
};
// a mirror copy of rigid bone rows (3x4, row-major) about the horizontal plane y = h
function cartMirrorBones(src, dst, nb, h) {
  for (let b = 0; b < nb; b++) {
    const k = b * 12;
    dst[k] = src[k]; dst[k + 1] = src[k + 1]; dst[k + 2] = src[k + 2]; dst[k + 3] = src[k + 3];
    dst[k + 4] = -src[k + 4]; dst[k + 5] = -src[k + 5]; dst[k + 6] = -src[k + 6]; dst[k + 7] = 2 * h - src[k + 7];
    dst[k + 8] = src[k + 8]; dst[k + 9] = src[k + 9]; dst[k + 10] = src[k + 10]; dst[k + 11] = src[k + 11];
  }
  return dst;
}
// grow e.rh (widest distance from the y axis) and e.top (highest point) over a posed rigid-skinned geometry (24-byte vertices)
function cartGeoExtent(geo, B, e) {
  const f = new Float32Array(geo.data), u = new Uint8Array(geo.data);
  for (let v = 0; v < geo.nv; v++) {
    const b = (u[v * 24 + 15] & 63) * 12, x = f[v * 6], y = f[v * 6 + 1], z = f[v * 6 + 2];
    const wx = B[b] * x + B[b + 1] * y + B[b + 2] * z + B[b + 3], wy = B[b + 4] * x + B[b + 5] * y + B[b + 6] * z + B[b + 7], wz = B[b + 8] * x + B[b + 9] * y + B[b + 10] * z + B[b + 11];
    const r = wx * wx + wz * wz; if (r > e.rh * e.rh) e.rh = Math.sqrt(r); if (wy > e.top) e.top = wy;
  }
  return e;
}
