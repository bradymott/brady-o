/* ============================================================
   ART CART — track dressing (cosmetic only). The start/finish gantry, the
   barriers and lamp posts as INSTANCED props with distance detail (one draw
   per kind and level, cheap far copies), roadside art installations and
   small camps that fill the bare playa, overhead pennant lines, painted
   kerbs on the bends, and the night kit: coloured light pools along the
   road edges, uplit art, searchlights and laser fans (E.beams, drawn in
   43_cart_e_scene.js) and the Man's stage on Burn Night.
   Nothing here touches the road: every piece sits outside the walls
   (CartWorlds.clear), so lap lengths, the racing line and the physics are
   unchanged and saved best times stay valid.
   All designs are original (generic festival structures, our own decor).
   ============================================================ */

/* ---------------- palettes by time of day ---------------- */
const CART_DECOR_PAL = {
  day: ['#ff5a3a', '#ffb02a', '#2ab0e8', '#ff4fa8', '#7ad84a', '#9a6bff', '#ffe24a'],
  sunset: ['#ff6a4a', '#ffb84a', '#ff4fa8', '#c86aff', '#4ac8e8', '#ffe07a'],
  dawn: ['#ff8a7a', '#ffc88a', '#c8a0ff', '#7ad8e8', '#ffe0a0', '#ff9ad8'],
  dust: ['#e86a3a', '#e8a03a', '#3a8ac8', '#c84a8a', '#6aa83a'],
  night: BURNS_NEON
};
// a copy's tint: the colour (times k), softened toward white by `soft` (so cream walls stay cream under a coloured roof)
const cartTintOf = (c, k, soft) => { const v = burnsRGBf(c); k = k || 1; soft = soft || 0; return [(v[0] * (1 - soft) + soft) * k, (v[1] * (1 - soft) + soft) * k, (v[2] * (1 - soft) + soft) * k]; };

/* ---------------- instanced kinds: build(m, o) is local (y up, +z = facing the road), far(m) the cheap copy ----------
   Everything that should take the copy's colour is built near-white (the tint multiplies the vertex colour, and the
   emissive glow with it). glows: local [x, y, z, size] glow billboards at night; pool: light pool radius under it. */
const CART_DECOR_KINDS = {
  // a barrier segment 7 m long (local z): two posts, a padded rounded rail (tinted), a kick plate, an LED strip on top
  rail: { r: 4.2, near: 30, mid: 110, farD: 330,
    build(m, o) {
      m.color('#34343e').shine(2); for (const z of [-2.6, 2.6]) m.limb(0, 0, z, 0, 1.0, z, 0.075, 0.065, { seg: m.lo ? 5 : 8 });
      m.color('#f2f2f6').shine(1); m.roundBox(0, 0.76, 0, 0.26, 0.34, 7.04, 0.11);
      m.color('#2a2a32').shine(1); m.roundBox(0, 0.3, 0, 0.14, 0.18, 7.04, 0.05);
      m.color('#ffffff', o.night ? 1 : 0.18).shine(0); m.box(0, 0.945, 0, 0.09, 0.03, 7.0); m.emissive(0);
    },
    far(m, o) { m.color('#f2f2f6'); m.box(0, 0.76, 0, 0.24, 0.34, 7.04); m.color('#ffffff', o.night ? 1 : 0.18); m.box(0, 0.945, 0, 0.09, 0.03, 7.0); m.emissive(0); } },
  // tyre wall on the tight bends: three stacked tyres and a tinted top band
  // a 7 m tyre wall on the tight bends: five stacks of tyres, the top ones painted (tinted red / white along the bend)
  tyres: { r: 4, near: 30, mid: 110, farD: 300,
    build(m, o) {
      for (let i = 0; i < 5; i++) {
        const z = -2.8 + i * 1.4;
        for (let k = 0; k < 2; k++) { m.color(k ? '#ffffff' : '#202024', k && o.night ? 0.35 : 0).shine(1); m.torus(0, 0.17 + k * 0.33, z, 0.52, 0.17, { seg: m.lo ? 8 : 12, tseg: m.lo ? 4 : 6 }); }
        m.color('#18181c').shine(0); m.disc(0, 0.68, z, 0.36, m.lo ? 8 : 12);
      }
      m.emissive(0).shine(0);
    },
    far(m) { m.color('#202024'); m.box(0, 0.17, 0, 1.3, 0.34, 7.0); m.color('#ffffff'); m.box(0, 0.5, 0, 1.3, 0.32, 7.0); } },
  // a curved-arm lamp post: the arm reaches toward the road (+z), a tinted bulb under a rounded hood
  lamp: { r: 3, near: 32, mid: 120, farD: 330, glows: [[0, 5.0, 1.55, 1.5]], pool: 9,
    build(m, o) {
      m.color('#3a3644').shine(2); m.roundCyl(0, 0, 0, 0.32, 0.4, 0.1); m.limb(0, 0.3, 0, 0, 5.2, 0, 0.11, 0.07, { seg: m.lo ? 6 : 9 });
      m.limb(0, 5.2, 0, 0, 5.75, 0.6, 0.07, 0.06, { seg: 6 }); m.limb(0, 5.75, 0.6, 0, 5.55, 1.55, 0.06, 0.05, { seg: 6 });
      m.color('#2a2630'); m.ellipsoid(0, 5.3, 1.55, 0.42, 0.2, 0.42, { phi1: Math.PI * 0.55, seg: m.lo ? 8 : 12, rings: 4 });
      m.color('#ffffff', o.night || o.dusk ? 1 : 0.35); m.ball(0, 5.12, 1.55, 0.2, { seg: 8, rings: 6 }); m.emissive(0).shine(0);
    },
    far(m, o) { m.color('#3a3644'); m.box(0, 2.7, 0, 0.14, 5.4, 0.14); m.color('#ffffff', o.night || o.dusk ? 1 : 0.35); m.box(0, 5.1, 1.5, 0.35, 0.3, 0.35); m.emissive(0); } },
  // a festival flag on a tall pole (day): a waving tinted banner, a white hem and a gold finial
  flag: { r: 2, near: 32, mid: 120, farD: 300,
    build(m) {
      m.color('#d8dce6').shine(3); m.limb(0, 0, 0, 0, 6.4, 0, 0.06, 0.045, { seg: 7 }); m.color('#ffd84a').shine(3); m.ball(0, 6.5, 0, 0.12, { seg: 8, rings: 5 }); m.shine(0);
      const wave = (u, v, out, side) => { const x = 0.08 + u * 1.7; out[0] = x; out[1] = 6.1 - v * 2.3 - u * 0.25; out[2] = Math.sin(u * 3.4 + v * 0.6) * 0.22 * u + side * 0.012; };
      m.color('#ffffff'); m.surf(m.lo ? 5 : 9, 2, (u, v, out) => wave(u, v, out, 1), { out: [0.9, 5, -2] }); m.surf(m.lo ? 5 : 9, 2, (u, v, out) => wave(u, v, out, -1), { out: [0.9, 5, 2] });
    },
    far(m) { m.color('#d8dce6'); m.box(0, 3.2, 0, 0.1, 6.4, 0.1); m.color('#ffffff'); m.box(0.9, 5.0, 0, 1.7, 2.3, 0.05); } },
  // GLOW SHROOMS: three giant mushrooms with spotted caps (the caps glow at night)
  mush: { r: 6, near: 36, mid: 130, farD: 330, glows: [[0, 5.6, 0, 3.2], [3.2, 3.6, 1.2, 2.2], [-2.6, 2.8, -1.4, 1.8]], pool: 11,
    build(m, o) {
      const one = (x, z, h, r, tilt) => {
        m.push(); m.tf(x, 0, z, 0, tilt, 0);
        m.color('#f4ece0').shine(1); m.lathe([[r * 0.34, 0], [r * 0.24, h * 0.35], [r * 0.2, h * 0.8], [r * 0.26, h]], { seg: m.lo ? 8 : 12 });
        m.color('#ffffff', o.night ? 0.55 : 0.08).shine(2); m.ellipsoid(0, h, 0, r, r * 0.55, r, { phi1: Math.PI * 0.5, seg: m.lo ? 10 : 16, rings: m.lo ? 4 : 7 });
        m.color('#fff4e8', o.night ? 0.25 : 0).shine(0); m.ellipsoid(0, h + 0.01, 0, r * 0.97, 0.18, r * 0.97, { phi0: Math.PI * 0.5, phi1: Math.PI, seg: m.lo ? 10 : 16, rings: 2 });
        m.color('#fff8f0', o.night ? 0.9 : 0.1); for (let i = 0; i < (m.lo ? 4 : 7); i++) { const a = i * 2.4, rr = r * (0.35 + (i % 3) * 0.17); m.ball(Math.sin(a) * rr, h + r * 0.55 * Math.sqrt(Math.max(0.05, 1 - (rr / r) * (rr / r))) - 0.02, Math.cos(a) * rr, r * 0.1, { seg: 6, rings: 4 }); }
        m.emissive(0).shine(0); m.pop();
      };
      one(0, 0, 4.6, 2.6, 0); one(3.2, 1.2, 2.8, 1.6, 0.12); one(-2.6, -1.4, 2.2, 1.3, -0.15);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.6, y0: 0, y1: 6 }] };
    },
    far(m) { m.color('#ffffff'); m.ellipsoid(0, 4.6, 0, 2.6, 1.4, 2.6, { seg: 6, rings: 3, phi1: Math.PI / 2 }); m.color('#f4ece0'); m.cyl(0, 0, 0, 0.7, 0.5, 4.6, 5, {}); } },
  // LANTERN TREE: a sculpted metal tree with paper lanterns hanging from its branches
  tree: { r: 6, soft: 0.15, near: 36, mid: 130, farD: 330, glows: [[0, 7.6, 0, 3.6], [2.6, 5.4, 0.8, 1.6], [-2.4, 5.8, -0.6, 1.6], [0.6, 6.0, 2.4, 1.6], [-0.4, 5.4, -2.6, 1.6]], pool: 12,
    build(m, o) {
      m.color('#4a3a32').shine(2); m.limb(0, 0, 0, 0.2, 4.2, 0, 0.42, 0.26, { seg: m.lo ? 7 : 10 });
      const tips = [];
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3, L = 3.2 + (i % 2) * 0.8, tx = Math.sin(a) * L, tz = Math.cos(a) * L, ty = 6.2 + (i % 3) * 0.6; m.limb(0.2, 4.0, 0, tx * 0.55, ty - 0.6, tz * 0.55, 0.2, 0.13, { seg: 6 }); m.limb(tx * 0.55, ty - 0.6, tz * 0.55, tx, ty, tz, 0.13, 0.06, { seg: 6 }); tips.push([tx, ty, tz]); }
      m.limb(0.2, 4.0, 0, 0, 8.4, 0.1, 0.22, 0.08, { seg: 6 }); tips.push([0, 8.4, 0.1]);
      for (const [x, y, z] of tips) { m.color('#2a2228'); m.limb(x, y, z, x, y - 0.9, z, 0.015, 0.015, { seg: 3, ends: false }); m.color('#ffffff', o.night ? 1 : 0.2).shine(1); m.ellipsoid(x, y - 1.25, z, 0.32, 0.42, 0.32, { seg: m.lo ? 7 : 10, rings: m.lo ? 5 : 7 }); m.emissive(0).shine(0); }
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.6, y0: 0, y1: 5 }] };
    },
    far(m) { m.color('#4a3a32'); m.cyl(0, 0, 0, 0.4, 0.2, 5, 5, {}); m.color('#ffffff'); m.ellipsoid(0, 6.4, 0, 3.4, 1.6, 3.4, { seg: 6, rings: 3 }); } },
  // PORTAL: a standing double ring of light on a rounded plinth (you look through it)
  ring: { r: 5, near: 36, mid: 130, farD: 330, glows: [[0, 8.2, 0, 2.6], [-3.4, 4.6, 0, 1.8], [3.4, 4.6, 0, 1.8]], pool: 10,
    build(m, o) {
      m.color('#2e2c38').shine(2); m.roundBox(0, 0.4, 0, 3.6, 0.8, 1.6, 0.3);
      m.push(); m.tf(0, 4.7, 0, 0, Math.PI / 2, 0); m.color('#ffffff', o.night ? 1 : 0.25).shine(2); m.torus(0, 0, 0, 3.6, 0.22, { seg: m.lo ? 20 : 36, tseg: m.lo ? 5 : 8 }); m.color('#ffffff', o.night ? 0.7 : 0.15); m.torus(0, 0, 0, 2.9, 0.1, { seg: m.lo ? 18 : 30, tseg: 4 }); m.pop(); m.emissive(0);
      m.color('#3a3846').shine(3); for (const s of [1, -1]) m.limb(s * 1.3, 0.8, 0, s * 2.2, 2.0, 0, 0.12, 0.1, { seg: 6 }); m.shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.8, hz: 0.8, y0: 0, y1: 0.8 }] };
    },
    far(m, o) { m.push(); m.tf(0, 4.7, 0, 0, Math.PI / 2, 0); m.color('#ffffff', o.night ? 1 : 0.25); m.torus(0, 0, 0, 3.6, 0.25, { seg: 12, tseg: 3 }); m.pop(); m.emissive(0); } },
  // SHADE SAILS: three tensioned triangles on raked poles (bright by day, string lights under them)
  sails: { r: 7, near: 36, mid: 130, farD: 330, glows: [[0, 3.4, 0, 2.4]], pool: 10,
    build(m, o) {
      const P = [[-5, 0, -2.5, 4.6], [5, 0, -3, 5.4], [0.5, 0, 4.2, 3.8], [-4.2, 0, 3.4, 5.8]];
      m.color('#d8dae2').shine(3); for (const [x, , z, h] of P) m.limb(x * 1.06, 0, z * 1.06, x, h, z, 0.09, 0.07, { seg: 6 }); m.shine(0);
      const sail = (a, b, c, dip, col, lift) => { m.color(col); for (const side of [1, -1]) m.surf(m.lo ? 4 : 7, m.lo ? 4 : 7, (u, v, out) => { const w0 = (1 - u) * (1 - v), w1 = u * (1 - v), w2 = v; const s = Math.sin(Math.PI * Math.min(1, (w0 + 0.02) * 2)) * Math.sin(Math.PI * Math.min(1, (w1 + 0.02) * 2)) * Math.sin(Math.PI * Math.min(1, (w2 + 0.02) * 2)); out[0] = a[0] * w0 + b[0] * w1 + c[0] * w2; out[1] = a[1] * w0 + b[1] * w1 + c[1] * w2 - dip * s + side * 0.02 + lift; out[2] = a[2] * w0 + b[2] * w1 + c[2] * w2; }, { out: [0, side > 0 ? -50 : 50, 0] }); };
      const top = P.map(([x, , z, h]) => [x, h, z]);
      sail(top[0], top[1], top[2], 0.7, '#ffffff', 0); sail(top[0], top[2], top[3], 0.6, '#ffe8c8', 0.15);
      if (o.night) { for (let i = 0; i < 9; i++) { const t = i / 8, x = lerp(-4.6, 4.6, t), y = 3.2 - Math.sin(t * Math.PI) * 0.5; m.color(BURNS_NEON[i % 7], 1); m.ball(x, y, 0, 0.09, { seg: 5, rings: 3 }); } m.emissive(0); }
      return { cols: P.map(([x, , z]) => ({ t: 'cyl', x, z, r: 0.12, y0: 0, y1: 5, camPass: true })) };
    },
    far(m) { m.color('#ffffff'); m.poly([[-5, 4.6, -2.5], [5, 5.4, -3], [0.5, 3.8, 4.2]]); m.poly([[0.5, 3.8, 4.2], [5, 5.4, -3], [-5, 4.6, -2.5]]); } },
  // TOTEM: a stack of round painted forms with glowing eyes (our own whimsical faces, no real iconography)
  totem: { r: 2.5, soft: 0.3, near: 36, mid: 130, farD: 330, glows: [[0.42, 5.3, 1.05, 0.8], [-0.42, 5.3, 1.05, 0.8], [0, 8.6, 0, 1.8]], pool: 8,
    build(m, o) {
      m.color('#3a3240').shine(1); m.roundCyl(0, 0, 0, 1.5, 0.5, 0.15);
      m.color('#ffffff').shine(2); m.roundCyl(0, 0.5, 0, 1.15, 1.9, 0.35); m.color('#2a2230'); m.torus(0, 1.45, 0, 1.17, 0.08, { seg: 14, tseg: 4 });
      m.color('#ffe0b8').shine(2); m.ball(0, 3.4, 0, 1.15, { seg: m.lo ? 10 : 16, rings: m.lo ? 7 : 11 });
      m.color('#ffffff').shine(2); m.lathe([[1.05, 4.4], [1.2, 4.7], [1.0, 6.2], [0.6, 6.6], [0.62, 6.6]], { seg: m.lo ? 10 : 16 });
      m.color('#1a1420'); for (const s of [1, -1]) m.ellipsoid(s * 0.42, 5.3, 0.95, 0.26, 0.3, 0.12, { seg: 8, rings: 5 });
      m.color('#ffffff', o.night ? 1 : 0.45); for (const s of [1, -1]) m.ball(s * 0.42, 5.3, 1.05, 0.12, { seg: 6, rings: 4 }); m.emissive(0);
      m.color('#ffd84a').shine(3); m.lathe([[0.6, 6.6], [0.15, 8.1], [0, 8.2]], { seg: m.lo ? 8 : 12 }); m.color('#ffffff', o.night ? 1 : 0.3); m.ball(0, 8.6, 0, 0.32, { seg: 8, rings: 6 }); m.emissive(0).shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.3, y0: 0, y1: 8 }] };
    },
    far(m) { m.color('#ffffff'); m.cyl(0, 0, 0, 1.3, 0.8, 6.6, 6, {}); m.color('#ffd84a'); m.cyl(0, 6.6, 0, 0.6, 0.05, 1.8, 5, {}); } },
  // BLOOMS: three giant steel flowers with tinted petals that glow at night
  bloom: { r: 5, near: 36, mid: 130, farD: 330, glows: [[0, 6.4, 0, 2.6], [2.6, 4.4, 1.4, 1.8], [-2.4, 3.6, -1.2, 1.6]], pool: 10,
    build(m, o) {
      const one = (x, z, h, r, lean) => {
        m.color('#5a8a5a').shine(2); m.limb(x, 0, z, x + lean, h, z, 0.12, 0.09, { seg: 6 });
        m.push(); m.tf(x + lean, h, z, 0, -0.35, 0);
        m.color('#ffffff', o.night ? 0.45 : 0).shine(2); for (let i = 0; i < (m.lo ? 6 : 8); i++) { const a = i / (m.lo ? 6 : 8) * TAU; m.push(); m.tf(0, 0, 0, a, 0, 0); m.ellipsoid(0, 0.05, r * 0.62, r * 0.28, 0.08, r * 0.55, { seg: m.lo ? 6 : 8, rings: 4 }); m.pop(); }
        m.color('#ffd84a', o.night ? 0.9 : 0.15); m.ellipsoid(0, 0.12, 0, r * 0.3, r * 0.16, r * 0.3, { seg: 10, rings: 5 }); m.emissive(0).shine(0); m.pop();
      };
      one(0, 0, 6.2, 2.4, 0.3); one(2.6, 1.4, 4.2, 1.6, 0.2); one(-2.4, -1.2, 3.4, 1.4, -0.3);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.4, y0: 0, y1: 6 }] };
    },
    far(m) { m.color('#5a8a5a'); m.box(0, 3.1, 0, 0.2, 6.2, 0.2); m.color('#ffffff'); m.cyl(0.3, 6.1, 0, 2.2, 2.2, 0.15, 8, {}); } },
  // HELIX: a tall twisting ribbon of light (two strands, rungs of glowing balls)
  helix: { r: 3, near: 36, mid: 130, farD: 330, glows: [[0, 12.4, 0, 2.6], [0, 6, 0, 2.2]], pool: 9,
    build(m, o) {
      m.color('#2e2c38').shine(2); m.roundCyl(0, 0, 0, 1.4, 0.6, 0.18);
      const n = m.lo ? 28 : 46, H = 11.5;
      for (const ph of [0, Math.PI]) { m.color(ph ? '#ffffff' : '#e8e8f0', o.night ? 0.9 : 0.15).shine(2); m.surf(n, m.lo ? 3 : 5, (u, v, out) => { const a = u * TAU * 2.2 + ph, y = 0.6 + u * H, rr = 1.1 + 0.13 * Math.cos(v * TAU); out[0] = Math.sin(a) * rr; out[1] = y + 0.13 * Math.sin(v * TAU); out[2] = Math.cos(a) * rr; }, { wrapV: true, out: true }); }
      m.color('#ffffff', o.night ? 1 : 0.3); for (let i = 1; i < 12; i++) { const u = i / 12, a = u * TAU * 2.2, y = 0.6 + u * H; m.ball(0, y, 0, 0.18, { seg: 6, rings: 4 }); m.limb(Math.sin(a) * 1.1, y, Math.cos(a) * 1.1, -Math.sin(a) * 1.1, y, -Math.cos(a) * 1.1, 0.035, 0.035, { seg: 4, ends: false }); }
      m.emissive(0).shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.4, y0: 0, y1: 12 }] };
    },
    far(m, o) { m.color('#ffffff', o.night ? 0.8 : 0.15); m.cyl(0, 0, 0, 1.2, 1.2, 12, 6, {}); m.emissive(0); } },
  // YURT CAMP: a round felt yurt with a tinted roof band, a little shade and a couch (filler for the long bare stretches)
  yurt: { r: 8, soft: 0.55, near: 36, mid: 130, farD: 330, glows: [[0, 3.7, 0, 1.6], [4.6, 2.3, 2.4, 1.2]], pool: 10,
    build(m, o) {
      m.color('#efe6d6').shine(0); m.lathe([[3.2, 0], [3.2, 2.2], [3.25, 2.25]], { seg: m.lo ? 12 : 20, uv: BURNS_ATLAS.pattern('canvas') });
      m.color('#ffffff'); m.lathe([[3.45, 2.2], [1.2, 3.35], [0.5, 3.6], [0, 3.62]], { seg: m.lo ? 12 : 20 });
      m.color('#2a2230'); m.roundBox(0, 0.95, 3.2, 1.1, 1.9, 0.2, 0.08);
      m.color('#ffd84a', o.night ? 0.9 : 0.1); m.torus(0, 3.55, 0, 0.55, 0.06, { seg: 10, tseg: 3 }); m.emissive(0);
      m.color('#6a6a72').shine(2); for (const [x, z] of [[3.4, 0.6], [6.0, 0.6], [3.4, 4.2], [6.0, 4.2]]) m.limb(x, 0, z, x, 2.4, z, 0.05, 0.05, { seg: 5 }); m.shine(0);
      m.color('#ffffff'); m.roundBox(4.7, 2.45, 2.4, 2.9, 0.08, 3.9, 0.03, { uv: BURNS_ATLAS.pattern('canvas'), uvFace: 'none' });
      m.color('#8a3a5a').shine(1); m.roundBox(4.7, 0.35, 2.6, 1.9, 0.5, 0.8, 0.15); m.roundBox(4.7, 0.75, 2.25, 1.9, 0.6, 0.18, 0.08); m.shine(0);
      if (o.night) { for (let i = 0; i < 8; i++) { const t = i / 7; m.color(BURNS_NEON[i % 7], 1); m.ball(3.4 + t * 2.6, 2.32 - Math.sin(t * Math.PI) * 0.25, 4.25, 0.07, { seg: 5, rings: 3 }); } m.emissive(0); }
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.3, y0: 0, y1: 3.4 }] };
    },
    far(m) { m.color('#efe6d6'); m.cyl(0, 0, 0, 3.2, 3.2, 2.2, 8, {}); m.color('#ffffff'); m.cyl(0, 2.2, 0, 3.45, 0.4, 1.4, 8, {}); } }
};

// SOUND STAGE: a little open-air stage facing the road: deck, truss arch, speaker stacks, an LED wall, a DJ booth
CART_DECOR_KINDS.stage = { r: 8, near: 36, mid: 130, farD: 330, glows: [[0, 4.6, -1.6, 3.4], [-4.6, 3.0, 0.6, 1.4], [4.6, 3.0, 0.6, 1.4]], pool: 13,
  build(m, o) {
    m.color('#2a2832').shine(1); m.roundBox(0, 0.5, 0, 11, 1.0, 6, 0.2);
    m.color('#cfd2da').shine(3); for (const sx of [-1, 1]) { m.limb(sx * 5.3, 1, -2.6, sx * 5.3, 6.4, -2.6, 0.12, 0.12, { seg: 6 }); m.limb(sx * 5.3, 1, 2.2, sx * 5.3, 6.4, 2.2, 0.12, 0.12, { seg: 6 }); m.limb(sx * 5.3, 6.4, -2.6, sx * 5.3, 6.4, 2.2, 0.1, 0.1, { seg: 6 }); }
    for (const z of [-2.6, 2.2]) { const N = 8; for (let i = 0; i < N; i++) { const a0 = i / N, a1 = (i + 1) / N, y0 = 6.4 + Math.sin(a0 * Math.PI) * 1.2, y1 = 6.4 + Math.sin(a1 * Math.PI) * 1.2; m.limb(-5.3 + a0 * 10.6, y0, z, -5.3 + a1 * 10.6, y1, z, 0.1, 0.1, { seg: 6 }); } }
    m.shine(0);
    // LED wall: tiles in two brightnesses of the copy's colour
    for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { m.color((i + j) % 2 ? '#ffffff' : '#a8a8b8', o.night ? 1 : 0.35); m.box(-3.5 + i, 1.6 + j * 0.95, -2.75, 0.94, 0.9, 0.1); }
    m.emissive(0);
    // speaker stacks with glowing cone rings
    for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) { const y = 1.55 + k * 1.15; m.color('#18161c').shine(1); m.roundBox(sx * 4.6, y, 0.4, 1.4, 1.1, 1.1, 0.12); m.color('#ffffff', o.night ? 0.9 : 0.2); m.push(); m.tf(sx * 4.6, y, 0.97, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.36, 0.05, { seg: 12, tseg: 3 }); m.pop(); m.emissive(0); }
    // DJ booth
    m.color('#3a3644').shine(2); m.roundBox(0, 1.55, 0.4, 2.6, 1.1, 1.0, 0.15); m.color('#ffffff', o.night ? 1 : 0.3); m.box(0, 1.8, 0.92, 2.2, 0.08, 0.02); m.emissive(0).shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 5.5, hz: 3, y0: 0, y1: 1 }] };
  },
  far(m, o) { m.color('#2a2832'); m.box(0, 0.5, 0, 11, 1, 6); m.color('#ffffff', o.night ? 1 : 0.35); m.box(0, 3.1, -2.75, 8, 3.8, 0.1); m.emissive(0); m.color('#cfd2da'); m.box(0, 6.8, -0.2, 10.6, 0.3, 4.8); } };

// the far city: a distant block of camps on the horizon (domes, RVs, a tower, shade frames), one cheap level drawn
// only past 150 m, so the playa doesn't end in a bare line. At night its windows and the tower top glow.
CART_DECOR_KINDS.skyline = { r: 22, single: true, minD: 150, near: 760, noCap: true, shadow: false,
  build(m, o) {
    const e = o.night ? 1 : 0, rng = mulberry32(7);
    for (let i = 0; i < 9; i++) {
      const x = (rng() - 0.5) * 38, z = (rng() - 0.5) * 16, k = rng();
      if (k < 0.35) { m.color('#ffffff'); m.ellipsoid(x, 0, z, 4 + rng() * 3, 3 + rng() * 2.5, 4 + rng() * 3, { seg: 7, rings: 3, phi1: Math.PI / 2 }); }
      else if (k < 0.7) { const w = 7 + rng() * 5; m.color('#e8e4ec'); m.box(x, 1.5, z, w, 3, 2.6); if (e) { m.color('#ffd890', e); m.box(x, 1.8, z + 1.32, w * 0.7, 0.5, 0.02); m.emissive(0); } }
      else { m.color('#d8d0e0'); for (const sx of [-1, 1]) m.box(x + sx * 3, 1.8, z, 0.2, 3.6, 0.2); m.box(x, 3.7, z, 6.6, 0.15, 4.5); }
    }
    m.color('#c8c0d0'); m.box(4, 7, 0, 0.5, 14, 0.5); m.color('#ffffff', o.night ? 1 : 0.3); m.box(4, 14.4, 0, 1.2, 0.8, 1.2); m.emissive(0);
    if (e) for (let i = 0; i < 14; i++) { m.color(BURNS_NEON[i % 7], 1); m.box((rng() - 0.5) * 40, 0.6 + rng() * 3.5, (rng() - 0.5) * 16, 0.35, 0.35, 0.35); }
    m.emissive(0);
  } };

const CartDecor = {
  // register the instanced kinds for this world (once; every copy shares its kind's geometry, one draw per detail level)
  protos(E) {
    if (E.decorP) return;
    E.decorP = true;
    const o = { night: E.night, dusk: E.tod === 'sunset' || E.tod === 'dawn' };
    for (const id in CART_DECOR_KINDS) {
      const K = CART_DECOR_KINDS[id];
      E.api.instanceProto('cd_' + id, m => K.build(m, o), { r: K.r, near: K.near, mid: K.mid, farD: K.farD, far: K.far ? m => K.far(m, o) : null, lo: !K.single, minD: K.minD, noCap: K.noCap, shadow: K.shadow, noAO: id === 'rail' || id === 'tyres' || id === 'skyline' });
    }
  },
  // place one instanced copy; its night glows and light pool go in the world (glows: local points turned to world)
  put(E, id, x, z, yaw, col, o) {
    o = o || {};
    const K = CART_DECOR_KINDS[id], s = o.scale || 1, y = o.y !== undefined ? o.y : E.terrain.height(x, z);
    E.api.instance('cd_' + id, x, z, { y, yaw, scale: s, tint: cartTintOf(col, o.k, K.soft), noCol: o.noCol });
    if (!o.noLights && (E.night || (o.dusk && K.glows))) {
      const c = Math.cos(yaw), sn = Math.sin(yaw);
      for (const g of K.glows || []) E.api.glow(x + (g[0] * c + g[2] * sn) * s, y + g[1] * s, z + (-g[0] * sn + g[2] * c) * s, g[3] * s, col);
      if (K.pool && E.night) E.api.light(x, z, K.pool * s, col, 0.5);
    }
  },

  /* ---------- the barriers (instanced; replaces the old static posts + rails) ---------- */
  barriers(E, T, D) {
    const step = 7, night = E.night, pal = CART_DECOR_PAL[E.tod] || CART_DECOR_PAL.day;
    for (let s = 0; s < T.L; s += step) {
      const g = T.at(s, {}), tight = Math.abs(g.k) > 0.012, i = Math.floor(s / step);
      for (const side of [1, -1]) {
        const off = side > 0 ? g.wr : -g.wl, x = g.x + g.nx * off, z = g.z + g.nz * off;
        // colour: neon by night (a slow rainbow along the lap), the theme's warm pair by day, red / white on the bends
        const col = tight ? (i % 2 ? '#f0f0f6' : '#ff3a4a') : night || D.theme === 'neon' ? BURNS_NEON[Math.floor(i / 2) % 7] : i % 4 < 2 ? pal[0] : pal[1];
        this.put(E, tight ? 'tyres' : 'rail', x, z, g.yaw, col, { y: 0, noLights: true, k: tight || night ? 1 : 0.95 });
        if (night) {
          if (i % 3 === 0) E.api.glow(x, 0.98, z, 0.9, col);
          // coloured light spills onto the road edge (and the shoulder) from the LED rail: the edges always read
          if (i % 2 === 0) E.api.light(x - g.nx * side * 1.2, z - g.nz * side * 1.2, 5.5, col, 0.34);
        }
      }
    }
  },
  // lamp posts (dusk/dawn/night) or festival flags (day), alternating sides every 38 m
  lamps(E, T, D) {
    const lit = E.night || D.tod === 'sunset' || D.tod === 'dawn', pal = CART_DECOR_PAL[E.tod] || CART_DECOR_PAL.day;
    for (let s = 3; s < T.L; s += 38) {
      const g = T.at(s, {}), k = Math.floor(s / 38), side = k % 2 ? 1 : -1, off = side > 0 ? g.wr + 2.5 : -g.wl - 2.5, x = g.x + g.nx * off, z = g.z + g.nz * off;
      if (lit) {
        const col = BURNS_NEON[k % 7], yaw = Math.atan2(-g.nx * side, -g.nz * side);   // the arm reaches over the barrier toward the road
        this.put(E, 'lamp', x, z, yaw, col, { y: 0, dusk: true });
        if (!E.night) E.api.light(x - g.nx * side * 1.5, z - g.nz * side * 1.5, 7, col, 0.3);
      } else this.put(E, 'flag', x, z, g.yaw, pal[k % pal.length], { y: 0 });   // the banner spreads across the view
    }
  },
  // overhead pennant lines strung across the road on the straights (8 m up: the chase camera passes well under)
  pennants(E, T, D) {
    const pal = CART_DECOR_PAL[E.tod] || CART_DECOR_PAL.day;
    for (let s = 70, n = 0; s < T.L - 40; s += 115) {
      const g = T.at(s, {}); if (Math.abs(g.k) > 0.006) continue;
      const a = [g.x + g.nx * (g.wr + 1.6), g.z + g.nz * (g.wr + 1.6)], b = [g.x - g.nx * (g.wl + 1.6), g.z - g.nz * (g.wl + 1.6)], w = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const col = pal[n++ % pal.length];
      CartScene.mesh(E.api, g.x, g.z, g.yaw, m => {   // local x runs across the road
        m.color('#d8dce6').shine(3); for (const sx of [-1, 1]) { m.limb(sx * w / 2, 0, 0, sx * w / 2, 9.0, 0, 0.09, 0.07, { seg: 7 }); m.color('#ffd84a'); m.ball(sx * w / 2, 9.15, 0, 0.16, { seg: 8, rings: 5 }); m.color('#d8dce6'); } m.shine(0);
        m.color('#2a2a30'); m.limb(-w / 2, 8.7, 0, w / 2, 8.7, 0, 0.02, 0.02, { seg: 3, ends: false });
        const N = Math.round(w / 0.9);
        for (let i = 0; i < N; i++) {
          const t0 = i / N, t1 = (i + 0.7) / N, sag = t => 8.7 - Math.sin(t * Math.PI) * 0.8;
          const ax = -w / 2 + t0 * w, bx = -w / 2 + t1 * w, ay = sag(t0), by = sag(t1);
          m.color(i % 3 === 0 ? col : pal[(i + n) % pal.length], E.night ? 0.6 : 0);
          m.poly([[ax, ay, 0], [bx, by, 0], [(ax + bx) / 2, (ay + by) / 2 - 0.55, 0]]); m.poly([[bx, by, 0], [ax, ay, 0], [(ax + bx) / 2, (ay + by) / 2 - 0.55, 0]]);
        }
        m.emissive(0);
        return { cols: [{ t: 'cyl', x: -w / 2, z: 0, r: 0.12, y0: 0, y1: 9, camPass: true }, { t: 'cyl', x: w / 2, z: 0, r: 0.12, y0: 0, y1: 9, camPass: true }] };
      }, { noAO: true });
    }
  },
  // painted kerbs on the bends (red / white blocks just inside the edge line)
  kerbs(E, T) {
    E.api.paint((ctx, P, S) => {
      ctx.lineCap = 'butt';
      for (let i = 0; i < T.N; i += 2) {
        const k = T.K[i]; if (Math.abs(k) < 0.011) continue;
        const j = (i + 2) % T.N, side = k > 0 ? 1 : -1;   // the inside of the bend (right of travel when k > 0)
        for (const sd of [side, -side]) {
          if (sd !== side && Math.abs(k) < 0.02) continue;   // the outside kerb only on the sharp ones
          const o0 = sd * (T.HW[i] - 0.65), o1 = sd * (T.HW[j] - 0.65);
          const p = P(T.X[i] + T.NX[i] * o0, T.Z[i] + T.NZ[i] * o0), q = P(T.X[j] + T.NX[j] * o1, T.Z[j] + T.NZ[j] * o1);
          ctx.strokeStyle = (i >> 1) % 2 ? 'rgba(240,236,232,0.7)' : 'rgba(214,52,58,0.72)'; ctx.lineWidth = 1.1 * S;
          ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        }
      }
    });
  },
  /* ---------- roadside art and camps: fill the bare stretches (outside the walls, never on the road) ---------- */
  roadside(E, T, D, rng, taken) {
    const night = E.night, pal = night ? BURNS_NEON : (CART_DECOR_PAL[E.tod] || CART_DECOR_PAL.day);
    const kinds = { art: ['mush', 'ring', 'tree', 'helix', 'bloom', 'totem', 'sails'], neon: ['stage', 'ring', 'helix', 'stage', 'tree', 'mush', 'totem'], burn: ['totem', 'tree', 'stage', 'ring', 'mush', 'helix', 'bloom'],
      camps: ['sails', 'yurt', 'stage', 'bloom', 'totem', 'tree', 'yurt', 'mush'], gate: ['yurt', 'sails', 'totem', 'bloom', 'yurt'], temple: ['bloom', 'tree', 'sails', 'totem', 'yurt'], storm: ['yurt', 'totem', 'sails', 'yurt'] }[D.theme] || ['sails', 'yurt', 'bloom', 'totem', 'mush'];
    const list = cartShuffle(kinds.slice(), rng);
    const free = (x, z, r) => { if (!CartWorlds.clear(T, x, z, r)) return false; for (const q of taken) if ((q[0] - x) * (q[0] - x) + (q[1] - z) * (q[1] - z) < (q[2] + r) * (q[2] + r)) return false; return true; };
    let n = 0;
    for (let s = 20, k = 0; s < T.L - 20; s += D.theme === 'storm' ? 40 : 26, k++) {
      const g = T.at(s, {}), side = k % 2 ? 1 : -1;
      const kind = list[n % list.length], K = CART_DECOR_KINDS[kind], sc = 0.95 + rng() * 0.4, dist = 4 + K.r * sc + rng() * 9;
      const off = side > 0 ? g.wr + dist : -g.wl - dist, x = g.x + g.nx * off, z = g.z + g.nz * off;
      if (!free(x, z, K.r * sc + 1)) continue;
      const yaw = Math.atan2(-g.nx * side, -g.nz * side) + (rng() - 0.5) * 0.6;   // facing the road
      this.put(E, kind, x, z, yaw, pal[(n * 3 + k) % pal.length], { scale: sc, dusk: D.tod === 'sunset' || D.tod === 'dawn' });
      taken.push([x, z, K.r * sc]); n++;
    }
    return n;
  },

  // the far city: a ring of distant camp blocks 230–330 m out round the course (muted tints; the fog does the rest)
  skyline(E, T, rng) {
    const b = T.bounds, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, R0 = Math.hypot(b.x1 - b.x0, b.z1 - b.z0) / 2 + 230, tints = ['#d8d0c8', '#c8c4d8', '#e0d0c0', '#c8d0d8', '#d8c8d0'];
    const n = Math.round(TAU * R0 / 46);
    for (let i = 0; i < n; i++) { const a = i / n * TAU + rng() * 0.05, r = R0 + rng() * 100, x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r; E.api.instance('cd_skyline', x, z, { y: 0, yaw: a + Math.PI + (rng() - 0.5) * 0.5, scale: 0.8 + rng() * 0.6, tint: cartTintOf(tints[i % tints.length], E.night ? 0.7 : 1), noCol: true }); }
  },

  /* ---------- the start / finish gantry: rounded LED pylons, a truss arch, a checkered banner and start lights ---------- */
  gantry(E, T, D) {
    const g = T.at(0, {}), W = g.wl + g.wr + 3.2, H = 8.6, night = E.night, api = E.api;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => {   // local x runs across the road
      const lights = [];
      for (const sx of [-1, 1]) {
        const x = sx * W / 2;
        m.color('#2a2834').shine(2); m.roundBox(x, 0.45, 0, 2.2, 0.9, 2.2, 0.25);
        m.push(); m.tf(x, 0.8, 0); m.lathe([[0.95, 0], [0.82, 3.5], [0.72, H - 0.8], [0.9, H - 0.6], [0.9, H + 0.25], [0.6, H + 0.6], [0, H + 0.7]], { seg: 16 }); m.pop();
        for (let i = 0; i < 6; i++) { const y = 1.6 + i * 1.2, c = BURNS_NEON[(i + (sx > 0 ? 3 : 0)) % 7]; m.color(c, night ? 1 : 0.55); m.torus(x, y, 0, 0.86 - i * 0.02, 0.06, { seg: 16, tseg: 4 }); lights.push({ x, y, z: 0.9, s: night ? 0.7 : 0, c }); }
        m.emissive(0);
      }
      // the truss: two arched chords and diagonal struts
      m.color('#d8dce6').shine(3);
      const arc = (t, lift) => [-W / 2 + t * W, H + lift + Math.sin(t * Math.PI) * 1.4, 0];
      const N = 14;
      for (let i = 0; i < N; i++) {
        const a = arc(i / N, 0.2), b = arc((i + 1) / N, 0.2), c = arc(i / N, -0.9), d = arc((i + 1) / N, -0.9);
        for (const zz of [-0.45, 0.45]) { m.limb(a[0], a[1], zz, b[0], b[1], zz, 0.08, 0.08, { seg: 6 }); m.limb(c[0], c[1], zz, d[0], d[1], zz, 0.07, 0.07, { seg: 6 }); m.limb(a[0], a[1], zz, d[0], d[1], zz, 0.04, 0.04, { seg: 4 }); }
        m.limb(a[0], a[1], -0.45, a[0], a[1], 0.45, 0.04, 0.04, { seg: 4 });
      }
      m.shine(0);
      // checkered banner hanging under the truss (both faces)
      const cw = 0.7, nC = Math.floor((W - 3) / cw);
      for (let i = 0; i < nC; i++) for (let r = 0; r < 2; r++) { const t = (i + 0.5) / nC, x = -W / 2 + 1.5 + t * (W - 3), y = H - 1.6 + Math.sin((x / W + 0.5) * Math.PI) * 1.4 - r * cw; m.color((i + r) % 2 ? '#141418' : '#f4f4f4'); m.box(x, y, 0, cw, cw, 0.06); }
      // start lights: five round lamps on a pod above the banner centre
      m.color('#1a1820').shine(2); m.roundBox(0, H + 2.45, 0, 4.4, 0.9, 0.7, 0.3);
      for (let i = 0; i < 5; i++) { const x = -1.6 + i * 0.8, c = i < 4 ? '#ff3a3a' : '#5aff7a'; m.color(c, 1); m.ball(x, H + 2.45, 0.3, 0.24, { seg: 10, rings: 7 }); m.ball(x, H + 2.45, -0.3, 0.24, { seg: 10, rings: 7 }); lights.push({ x, y: H + 2.45, z: 0.4, s: 0.7, c }); }
      m.emissive(0).shine(0);
      // string lights along the lower chord
      for (let i = 0; i <= 20; i++) { const t = i / 20, p = arc(t, -1.05); m.color(BURNS_NEON[i % 7], 1); m.ball(p[0], p[1], 0.5, 0.09, { seg: 6, rings: 4 }); m.ball(p[0], p[1], -0.5, 0.09, { seg: 6, rings: 4 }); if (night && i % 2 === 0) lights.push({ x: p[0], y: p[1], z: 0.5, s: 0.5, c: BURNS_NEON[i % 7] }); }
      m.emissive(0);
      lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ffd0a0', pool: night ? 14 : 0 });
      return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 1.1, y0: 0, y1: H }, { t: 'cyl', x: W / 2, z: 0, r: 1.1, y0: 0, y1: H }], lights: lights.filter(L => L.s > 0 || L.pool) };
    }, { hi: true });
    // the name board in the middle of the arch (a sign each way)
    api.sign('SUPER ART KART', g.x, g.z, { yaw: g.yaw + Math.PI, h: 1.9, y: H + 0.1, post: false, maxW: 9, style: { bg: '#1a0a24', fg: '#ffffff', border: '#ff4fd8' }, glow: night ? '#ff4fd8' : null });
  },

  /* ---------- the Man's stage on Burn Night: a tiered wooden base with LED rings, uplights, fire barrels ---------- */
  manStage(E, x, z) {
    const api = E.api, top = 6.8;
    CartScene.mesh(api, x, z, 0, m => {
      const wd = BURNS_ATLAS.pattern('wood');
      m.color('#6a4a32').shine(1); m.lathe([[16, 0], [15.4, 2.1], [10.8, 2.3], [10.2, 4.7], [7.2, 4.9], [6.8, top - 0.1], [0, top]], { seg: 8, uv: wd });
      m.shine(0);
      // LED rings round each tier and glowing doorways on the lowest one
      m.color('#ff8a3a', 1); m.torus(0, 2.12, 0, 15.25, 0.12, { seg: 40, tseg: 4 }); m.color('#38f2ff', 1); m.torus(0, 4.72, 0, 10.05, 0.1, { seg: 32, tseg: 4 }); m.color('#ff4fd8', 1); m.torus(0, top - 0.05, 0, 6.85, 0.1, { seg: 24, tseg: 4 });
      m.color('#ffc070', 0.9); for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU; m.push(); m.tf(Math.sin(a) * 15.75, 0, Math.cos(a) * 15.75, a); m.roundBox(0, 0.9, 0, 1.6, 1.8, 0.1, 0.06); m.pop(); }
      m.emissive(0);
      // eight uplight cans round the base, aimed at the figure
      const lights = [];
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = 17.4; m.color('#2a2830').shine(2); m.push(); m.tf(Math.sin(a) * r, 0, Math.cos(a) * r, a + Math.PI, -0.5); m.roundCyl(0, 0, 0, 0.32, 0.5, 0.08); m.color('#fff4e0', 1); m.disc(0, 0.51, 0, 0.26, 10); m.pop(); m.emissive(0).shine(0); lights.push({ x: Math.sin(a) * r, y: 0.8, z: Math.cos(a) * r, s: 1.6, c: i % 2 ? '#ffb070' : '#ff7ac8' }); }
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 15, y0: 0, y1: top - 0.1 }], lights };
    }, { hi: true });
    // pools: warm around the base, coloured spill from the uplights, the doorways
    api.light(x, z, 30, '#ff9a4a', 0.75); api.light(x, z, 46, '#ff5a8a', 0.25);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; api.light(x + Math.sin(a) * 18, z + Math.cos(a) * 18, 7, i % 2 ? '#ffb070' : '#ff7ac8', 0.5); }
    // fire barrels on a ring
    for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * TAU, bx = x + Math.sin(a) * 21, bz = z + Math.cos(a) * 21; CartScene.prop(api, 'barrel', { x: bx, z: bz }); api.fire(bx, 0.95, bz, 0.35, { hazard: false }); }
    // searchlights sweeping the sky behind him
    E.beams = E.beams || [];
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; E.beams.push({ kind: 'search', x: x + Math.sin(a) * 24, y: 1, z: z + Math.cos(a) * 24, c: [1, 0.85, 0.6], ph: i * 1.7, sp: 0.35 + i * 0.07, len: 150, w: 7, a: 0.2 }); }
    return { y: top, scale: 1.65 };
  },
  // searchlights / laser fans for a night track's sound camps (drawn by the scene as additive streaks)
  beams(E, T, rng, n, kind) {
    E.beams = E.beams || [];
    for (let i = 0; i < n; i++) {
      const g = T.at(T.L * (i + 0.3) / n, {}), side = i % 2 ? 1 : -1, off = side > 0 ? g.wr + 40 + rng() * 30 : -g.wl - 40 - rng() * 30, x = g.x + g.nx * off, z = g.z + g.nz * off;
      if (!CartWorlds.clear(T, x, z, 12)) continue;
      const c = burnsRGBf(BURNS_NEON[i % 7]);
      E.beams.push({ kind: kind || 'search', x, y: 1, z, c, ph: rng() * 6, sp: 0.4 + rng() * 0.4, len: kind === 'laser' ? 70 : 140, w: kind === 'laser' ? 0.5 : 6, a: kind === 'laser' ? 0.55 : 0.18 });
      E.api.light(x, z, 10, BURNS_NEON[i % 7], 0.5);
    }
  }
};
