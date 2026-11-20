/* ============================================================
   ART CART — royale arena: THE MIXING BOWL (id 'mixbowl', Frosted Fury's arena; level agent "cupcake", Nov 19 2026)
   A giant glazed mixing bowl on a sunny kitchen counter, under a giant stand mixer whose beater turns slowly over a
   mound of dough in the middle. Cover: sugar cubes, butter blocks, chocolate chips, strawberries, eggshell halves;
   spatula kickers. Its hazards (all telegraphed, all readable on a phone):
     · EGG DROP: a target and a growing shadow mark where a giant egg will land (1.6 s); it SPLATS (12 HP, a knock)
       and leaves a YOLK SLICK for 7 s (6 HP and a slide if you drive in): steer off the target, round the slick
     · ROLLING PIN: a pin wobbles at the rim and its whole lane across the bowl flashes amber (1.8 s), then it rolls
       right across: FLATTENED (16 HP, a big knock). Get out of its lane
     · FLOUR SIFTER: the sifter glides over a car, shakes and rings the floor (1.3 s), then sifts: caught under it you
       are FLOURED (8 HP, blinded for a moment). Drive out of the ring
   FROSTING FLOOD (Frosted Fury's special) is in everyone's gift boxes here (arena levelCar 'cupcake').
   Globals here start with MXB_ / cartMxb, run-time state lives on s.mxb. Original design throughout.
   Start it without the menus: BRADY_CART.debug.start({ mode: 'royale', arena: 'mixbowl' }).
   ============================================================ */
const MXB = {
  R: 178, dough: 22, doughH: 3.2,
  egg: { warn: 1.6, r: 5.0, slickR: 5.6, slickLife: 7, every: [2.4, 4.0], fromY: 70 },
  pin: { warn: 1.8, speed: 30, half: 8.5, rad: 1.7, every: [8, 12] },
  sift: { warn: 1.3, sift: 2.4, r: 11, speed: 16, y: 24 },
  white: [1, 1, 1], cream: [1, 0.95, 0.82], yolk: [1, 0.78, 0.15], amber: [1, 0.66, 0.2], pink: [1, 0.45, 0.75], hot: [1, 0.25, 0.5], black: [0, 0, 0], flour: [1, 0.98, 0.94], red: [1, 0.25, 0.3]
};
const MXB_T = { p: [0, 0] };

/* ---------------- the world ---------------- */
CartWorlds.arena_mixbowl = function (A, night) {
  const M = MXB, R = M.R, E = this.base(2112, [-245, -245, 245, 245], '#9fd6ea', 0.02);
  const sky = Object.assign(CART_SKIES.day(), { zen: '#5a9ae8', hor: '#ffe0ec', fog: '#f0dce8', fogD: 0.0022, haze: 0.22, sky: '#d8e4ff', clouds: 0.7, cloudCol: '#fff6fa', key: '#fff2e4', keyK: 0.95, mtnCol: '#e8c0d0' });
  Object.assign(E, { id: 'mixbowl', arena: A, sky, tod: 'day', music: 'kart2', night: false, R });
  const api = E.api, T = E.terrain, rng = mulberry32(2112);
  const ang = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
  // ---- the bowl's glaze: soft rings, a ribbon of pink batter swirling out of the dough, flour dust, sprinkles ----
  api.paint((ctx, P, sc) => {
    const c0 = P(0, 0);
    for (let r = R; r > 0; r -= 12) { ctx.fillStyle = (r / 12) % 2 ? 'rgba(120,200,228,0.75)' : 'rgba(176,226,242,0.75)'; ctx.beginPath(); ctx.arc(c0[0], c0[1], r * sc, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(120,190,215,0.6)'; ctx.lineWidth = 1.2 * sc; ctx.beginPath(); ctx.arc(c0[0], c0[1], (R - 3) * sc, 0, TAU); ctx.stroke();
    // the batter spiral (pink), drawn as a fat stroke along an Archimedes spiral
    ctx.lineCap = 'round';
    for (const [w, col] of [[11, 'rgba(255,110,180,0.8)'], [3.5, 'rgba(255,215,235,0.9)']]) { ctx.strokeStyle = col; ctx.lineWidth = w * sc; ctx.beginPath(); for (let i = 0; i <= 400; i++) { const a = i / 400 * TAU * 2.6, r = M.dough + 4 + i / 400 * (R - 50), q = P(Math.sin(a) * r, Math.cos(a) * r); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } ctx.stroke(); }
    for (let i = 0; i < 160; i++) { const a = rng() * TAU, r = rng() * (R - 10), q = P(...ang(a, r)); ctx.fillStyle = `rgba(255,255,255,${0.25 + rng() * 0.3})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (2 + rng() * 6) * sc, (1 + rng() * 4) * sc, rng() * 3, 0, TAU); ctx.fill(); }
    const SPR = ['#ff3a5a', '#ffd23a', '#3ad0ff', '#5aff7a', '#ff8a2a', '#c86aff'];
    for (let i = 0; i < 1400; i++) { const a = rng() * TAU, r = M.dough + rng() * (R - M.dough - 4), q = P(...ang(a, r)); ctx.fillStyle = SPR[i % 6]; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(rng() * 3); ctx.fillRect(-1.1 * sc, -0.3 * sc, 2.2 * sc, 0.6 * sc); ctx.restore(); }
  });
  // ---- the dough mound in the middle (you can drive over it) ----
  T.add(CartFeat.mound(0, 0, M.dough, M.doughH, { col: '#f2d8a8' }));
  // ---- the bowl: a glazed ceramic wall rising round the rim (a closed profile, so its inside faces you) ----
  CartScene.mesh(api, 0, 0, 0, m => {
    m.color('#a8dcef').shine(2); m.lathe([[R + 2, 0], [R + 8, 4.5], [R + 15, 11], [R + 22, 19], [R + 25, 22.5], [R + 29, 23.6], [R + 33, 22], [R + 33, 0]], { seg: 120 });
    m.color('#ffffff').shine(2); m.torus(0, 23.6, 0, R + 29, 0.9, { seg: 120, tseg: 5 });
    m.color('#ff8ac8').shine(1); m.torus(0, 17.5, 0, R + 21.2, 0.55, { seg: 120, tseg: 4 }); m.torus(0, 15.5, 0, R + 19.4, 0.4, { seg: 120, tseg: 4 }); m.shine(0);
    return { cols: [] };
  }, { hi: true, noAO: true });
  // ---- the giant stand mixer: a column outside the bowl, the arm over it, the head, the shaft down to the beater ----
  CartScene.mesh(api, 0, -(R + 52), 0, m => {
    m.color('#ff9ccf').shine(2); m.roundBox(0, 4, 0, 34, 8, 30, 3); m.roundBox(0, 40, 0, 20, 72, 18, 6);
    m.roundBox(0, 76, (R + 52) / 2 - 6, 24, 16, R + 64, 7);
    m.ellipsoid(0, 71, R + 52, 20, 14, 22, { seg: 22, rings: 12 });
    m.color('#dfe4ea').shine(3); m.torus(0, 70, R + 52, 19.6, 1.0, { seg: 40, tseg: 5 }); m.roundBox(0, 76, -9.4, 16, 6, 1, 0.5);
    m.limb(0, 60, R + 52, 0, 26, R + 52, 1.2, 1.0, { seg: 12 }); m.cyl(0, 57, R + 52, 3.2, 2.2, 3.2, 20);
    m.push(); m.tf(10.2, 60, 0, 0, 0, Math.PI / 2); m.cyl(0, 0, 0, 3.2, 3.2, 1.0, 20); m.color('#ff5a8a'); m.cyl(0, 1.0, 0, 0.8, 0.8, 1.4, 10); m.pop();
    // Nov 19 polish: real mixer detail. Chrome bands down both sides of the arm and round the column, the tilt-head hinge pin
    const zc = (R + 52) / 2 - 6, zh = R + 52;
    m.color('#e8ecf2').shine(4);
    for (const sd of [-1, 1]) { m.box(sd * 12.15, 77, zc + 4, 0.5, 1.8, R + 52); m.box(sd * 12.15, 72.4, zc + 4, 0.4, 0.7, R + 52); }
    m.roundBox(0, 8.4, 0, 34.4, 0.9, 30.4, 0.4); m.roundBox(0, 70.5, 0, 20.6, 1.2, 18.6, 0.5);
    m.push(); m.tf(0, 72.5, -4, 0, 0, Math.PI / 2); m.cyl(0, -12.6, 0, 2.6, 2.6, 25.2, 20); m.pop();
    // the speed lever: a dark slot plate with notches on the column's side, a chrome lever, a white knob
    m.color('#5a3048').shine(2); m.roundBox(10.25, 66, 0, 0.5, 2.6, 10, 0.3);
    m.color('#ffffff', 0.2).shine(1); for (let k = 0; k < 6; k++) m.box(10.55, 67.6, -3.6 + k * 1.45, 0.12, 0.7, 0.25); m.emissive(0);
    m.color('#e8ecf2').shine(4); m.limb(10.4, 66, 1.4, 13.6, 68.8, 3.6, 0.42, 0.32, { seg: 8 }); m.color('#ffffff').shine(3); m.ball(13.8, 69, 3.8, 1.2, { seg: 12, rings: 8 });
    // the speed dial on both sides of the head: a chrome bezel, a white face, coloured ticks, a red pointer
    for (const sd of [-1, 1]) {
      m.push(); m.tf(sd * 18.6, 75, zh - 3, 0, 0, -sd * Math.PI / 2, 1.6, 1.6, 1.6);
      m.color('#e8ecf2').shine(4); m.cyl(0, 0, 0, 4.4, 4.4, 1.0, 28); m.color('#fffaf4').shine(1); m.cyl(0, 1.0, 0, 3.6, 3.6, 0.2, 24);
      const TK = ['#3ad0ff', '#5aff7a', '#ffd23a', '#ff8a2a', '#ff3a5a'];
      for (let k = 0; k < 10; k++) { const a = -2.2 + k / 9 * 4.4; m.color(TK[Math.floor(k / 2)], 0.3); m.box(Math.sin(a) * 2.9, 1.25, Math.cos(a) * 2.9, 0.35, 0.12, 0.9); } m.emissive(0);
      m.color('#e8302a').shine(2); m.limb(0, 1.35, 0, Math.sin(0.9) * 2.6, 1.35, Math.cos(0.9) * 2.6, 0.28, 0.12, { seg: 5 }); m.color('#3a3a44'); m.cyl(0, 1.2, 0, 0.6, 0.6, 0.35, 10);
      m.pop();
    }
    // a logo-free badge: a chrome oval with a pink enamel inset and a little whisk in relief, on the column front and both sides of the arm
    const badge = (x, y, z, yaw) => { m.push(); m.tf(x, y, z, yaw, Math.PI / 2, 0, 1.6, 1, 1); m.color('#e8ecf2').shine(4); m.cyl(0, 0, 0, 3.4, 3.4, 0.5, 24); m.color('#ff5a9a').shine(3); m.cyl(0, 0.5, 0, 2.7, 2.7, 0.15, 22); m.pop();
      m.push(); m.tf(x, y, z, yaw, 0, 0); m.color('#ffffff').shine(3); m.limb(0, -2, 0.75, 0, 0.2, 0.75, 0.22, 0.22, { seg: 6 }); for (let k = 0; k < 3; k++) { const w = 0.5 + k * 0.45; m.limb(-w, 0.2, 0.75, 0, 2.2, 0.75, 0.1, 0.1, { seg: 4 }); m.limb(w, 0.2, 0.75, 0, 2.2, 0.75, 0.1, 0.1, { seg: 4 }); } m.pop(); };
    badge(0, 48, 9.05, 0); for (const sd of [-1, 1]) { badge(sd * 12.2, 80.5, zh - 34, sd * Math.PI / 2); badge(sd * 12.2, 80.5, zc - 20, sd * Math.PI / 2); }
    // the nose: a chrome attachment-hub cap with a knurled ring and a pink screw knob
    m.push(); m.tf(0, 72, zh + 20.6, 0, Math.PI / 2, 0); m.color('#e8ecf2').shine(4); m.cyl(0, -1, 0, 6.2, 5.6, 2.2, 28); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; m.box(Math.sin(a) * 6.0, 0.2, Math.cos(a) * 6.0, 0.5, 1.4, 0.5); } m.color('#ff5a8a').shine(2); m.cyl(0, 1.2, 0, 2.2, 1.8, 1.8, 16); m.pop();
    // vent slots along the top of the head
    m.color('#c86a9e').shine(1); for (let k = 0; k < 7; k++) m.roundBox(-6 + k * 2, 84.6, zh - 6, 0.7, 0.3, 7, 0.15);
    m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 17, hz: 15, y0: 0, y1: 76 }] };
  }, { hi: true, noAO: true });
  // ---- cover: sugar cubes, butter blocks, strawberries, eggshell halves; chocolate chips instanced ----
  const art = (x, z, r) => E.art.push({ x, z, r });
  for (let i = 0; i < 12; i++) { const [x, z] = ang(i / 6 * TAU + 0.26 + (i >= 6 ? 0.36 : 0), i >= 6 ? 160 : 68); CartScene.mesh(api, x, z, i * 0.7, m => { m.color('#ffffff').shine(2); m.roundBox(0, 3.5, 0, 7, 7, 7, 0.8); m.color('#f0f4ff').shine(3); for (let k = 0; k < 14; k++) { const r2 = mulberry32(i * 31 + k); m.box((r2() - 0.5) * 6.6, 0.6 + r2() * 6, 3.52, 0.3, 0.3, 0.05); } m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 3.6, hz: 3.6, y0: 0, y1: 7 }] }; }, { hi: true, scale: 1.5 }); art(x, z, 7.6); }
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 1.2, [x, z] = ang(a, 118); CartScene.mesh(api, x, z, a + Math.PI / 2, m => { m.color('#ffe27a').shine(2); m.roundBox(0, 2.6, 0, 13, 5.2, 6, 0.9); m.color('#ffffff').shine(1); m.roundBox(-3.5, 2.6, 0, 6.2, 5.4, 6.2, 0.6); m.color('#3a7ad8'); m.roundBox(-3.5, 2.6, 3.12, 4, 1.6, 0.08, 0.2); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 6.6, hz: 3.1, y0: 0, y1: 5.4 }] }; }, { hi: true, scale: 1.4 }); art(x, z, 10); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.78, [x, z] = ang(a, 138); CartScene.mesh(api, x, z, a, m => { m.color('#ff2a45').shine(3); m.lathe([[0, 0], [2.4, 1.0], [3.6, 3.4], [3.4, 5.6], [2.2, 7.0], [0, 7.2]], { seg: 20 }); m.color('#ffe27a').shine(0); for (let k = 0; k < 26; k++) { const t = k / 26, y = 1 + t * 5.2, rr = [2.6, 3.5, 3.4, 2.6][Math.min(3, Math.floor(t * 4))] + 0.02, aa = k * 2.39; m.ellipsoid(Math.sin(aa) * rr, y, Math.cos(aa) * rr, 0.14, 0.22, 0.14, { seg: 5, rings: 3 }); } m.color('#3aa84a').shine(1); for (let k = 0; k < 6; k++) { const aa = k / 6 * TAU; m.push(); m.tf(Math.sin(aa) * 1.0, 7.1, Math.cos(aa) * 1.0, aa, 0.5, 0); m.ellipsoid(0, 0, 0.9, 0.5, 0.12, 1.3, { seg: 6, rings: 4 }); m.pop(); } m.cyl(0, 7.1, 0, 0.3, 0.2, 1.4, 6); m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.4, y0: 0, y1: 7 }] }; }, { hi: true, scale: 1.7 }); art(x, z, 6.6); }
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.15, [x, z] = ang(a, 98); CartScene.mesh(api, x, z, a + 0.9, m => { m.color('#fff8ee').shine(2); m.push(); m.tf(0, 0, 0, 0, Math.PI / 2 - 0.25, 0); m.ellipsoid(0, 0, 0, 4.4, 5.6, 4.4, { seg: 18, rings: 10, phi1: Math.PI / 2 }); m.pop(); m.color('#f0e0c8'); for (let k = 0; k < 9; k++) { const aa = k / 9 * TAU; m.push(); m.tf(Math.sin(aa) * 4.3, 0.2 + Math.cos(aa) * 4.3 * 0.2 + 2.0, Math.cos(aa) * 0.6, 0, 0, aa); m.box(0, 0, 0, 0.9, 0.5, 0.4); m.pop(); } m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 4.4, y0: 0, y1: 4.5 }] }; }, { hi: true, scale: 1.5 }); art(x, z, 7.2); }
  api.instanceProto('mxb_chip', m => { m.color('#5a3018').shine(2); m.lathe([[3.0, 0], [2.9, 0.6], [2.0, 2.0], [0.9, 3.4], [0.2, 4.4], [0, 4.6]], { seg: m.lo ? 10 : 18 }); m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.6, y0: 0, y1: 4 }] }; }, { r: 3.2, near: 50, mid: 140, farD: 360, lo: true, far: m => { m.color('#5a3018'); m.cyl(0, 0, 0, 3, 0.3, 4.6, 6); } });
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + 0.5 + rng() * 0.2, r = 44 + (i % 3) * 40 + rng() * 10, [x, z] = ang(a, r); api.instance('mxb_chip', x, z, { y: 0, yaw: rng() * TAU, scale: 1.2 + rng() * 0.5, tint: cartTintOf('#ffffff') }); art(x, z, 3); }
  // giant sprinkles lying about (instanced, tinted: the colour pops on the glaze)
  api.instanceProto('mxb_sprinkle', m => { m.color('#ffffff').shine(2); m.limb(-2.6, 0.8, 0, 2.6, 0.8, 0, 0.8, 0.8, { seg: m.lo ? 7 : 12 }); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 3.3, hz: 0.8, y0: 0, y1: 1.6 }] }; }, { r: 3.4, near: 50, mid: 140, farD: 340, lo: true, far: m => { m.color('#ffffff'); m.box(0, 0.8, 0, 6.6, 1.5, 1.5); } });
  { const SC = ['#ff3a5a', '#ffd23a', '#3ad0ff', '#5aff7a', '#ff8a2a', '#c86aff', '#ff6ad0']; for (let i = 0; i < 26; i++) { const a = rng() * TAU, r = 36 + rng() * 128, [x, z] = ang(a, r); if (E.art.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 5)) continue; api.instance('mxb_sprinkle', x, z, { y: 0, yaw: rng() * TAU, scale: 1, tint: cartTintOf(SC[i % 7]) }); art(x, z, 3.4); } }
  // spatula kickers
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.5, [x, z] = ang(a, 100); T.add(CartFeat.ramp(x, z, a + Math.PI / 2 * (i % 2 ? 1 : -1), 7, 7, 2.0, { col: '#ff9ccf', stripe: i % 2 ? '#ffffff' : '#ffe27a' })); }
  // ---- the fence: pastel rails along the rim ----
  const poly = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; poly.push([Math.sin(a) * R, Math.cos(a) * R]); }
  E.walls = poly; CartDecor.protos(E);
  const RAILS = ['#ff9ccf', '#8ff0c8', '#ffe08a', '#8ad0ff'];
  for (let i = 0; i < 48; i++) { const a = poly[i], b = poly[(i + 1) % 48], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 7), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]); for (let j = 0; j < n; j++) { const u = (j + 0.5) / n; CartDecor.put(E, 'rail', lerp(a[0], b[0], u), lerp(a[1], b[1], u), yaw, RAILS[Math.floor((i * n + j) / 2) % 4], { y: 0, noLights: true }); } }
  // ---- the kitchen beyond: a flour sack, an egg carton, a sugar jar on the counter; bleachers of crumbs fans ----
  CartScene.mesh(api, 205, 120, -2.1, m => { m.color('#f4ece0').shine(1); m.roundBox(0, 14, 0, 26, 28, 16, 5); m.color('#e8dcc8'); m.ellipsoid(0, 29, 0, 9, 4, 6, { seg: 12, rings: 6 }); m.shine(0); return { cols: [] }; }, { hi: true });
  api.sign('FLOUR', 205 - Math.sin(-2.1) * 8.2, 120 - Math.cos(-2.1) * 8.2, { yaw: -2.1 + Math.PI, h: 4.5, y: 14, post: false, maxW: 16, style: { bg: '#f4ece0', fg: '#3a7ad8', border: '#3a7ad8' } });
  CartScene.mesh(api, -200, 150, 2.4, m => { m.color('#e8d0b0').shine(0); m.roundBox(0, 3, 0, 46, 6, 18, 2); for (let k = 0; k < 6; k++) { m.color(k === 2 ? '#c88a5a' : '#fff8ee').shine(2); m.ellipsoid(-19 + k * 7.6, 9.5, -3.5, 3.0, 4.0, 3.0, { seg: 14, rings: 9 }); m.ellipsoid(-19 + k * 7.6, 9.5, 3.5, 3.0, 4.0, 3.0, { seg: 14, rings: 9 }); } m.shine(0); return { cols: [] }; }, { hi: true });
  CartScene.mesh(api, -40, 225, 0.2, m => { m.color('#c8eef8').shine(3); m.roundCyl(0, 0, 0, 13, 30, 4, { seg: 28 }); m.color('#ffffff').shine(1); m.roundCyl(0, 0.5, 0, 12.4, 24, 3, { seg: 28 }); m.color('#ff8ac8').shine(2); m.roundCyl(0, 30, 0, 13.6, 4, 1.5, { seg: 28 }); m.ball(0, 35, 0, 2.4, { seg: 12, rings: 8 }); m.shine(0); return { cols: [] }; }, { hi: true });
  for (const a of [0.9, 3.0, 5.15]) { const [x, z] = ang(a, R + 40); E.spots.push(...CartScene.bleachers(api, x, z, a + Math.PI, 22, 4, rng)); }
  { const R0 = 330, n = 36; for (let i = 0; i < n; i++) { const a = i / n * TAU + rng() * 0.05, r = R0 + rng() * 80; api.instance('cd_skyline', Math.sin(a) * r, Math.cos(a) * r, { y: 0, yaw: a + Math.PI, scale: 0.8 + rng() * 0.6, tint: cartTintOf(['#ffd8ea', '#d8ecff', '#fff0c8'][i % 3], 1), noCol: true }); } }
  // ---- royale spots: gift boxes, repair kits, spawns, the storm's end points ----
  for (let i = 0; i < 4; i++) { const [x, z] = ang(i / 4 * TAU + Math.PI / 4, 32); E.gifts.push({ x, z }); }
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU, 90); E.gifts.push({ x, z }); const [x2, z2] = ang(i / 6 * TAU + 0.5, 152); E.gifts.push({ x: x2, z: z2 }); }
  const repairs = []; for (let i = 0; i < 6; i++) repairs.push(ang(i / 6 * TAU + 0.3, 126)); repairs.push(ang(Math.PI / 2, 46), ang(-Math.PI / 2, 46));
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, [x, z] = ang(a, 144); E.spawn.push({ x, z, yaw: a + Math.PI / 2 }); }
  for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 30 + rng() * 135; E.orbSpots.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.zones = [{ x: 0, z: 0, r: 12, name: 'THE DOUGH' }]; E.flagSpots = [{ x: 0, z: 60 }]; E.captures = [{ x: 0, z: -90, r: 9 }];
  E.royale = { R: R - 4, x: 0, z: 0, ends: [0, 1, 2, 3, 4].map(i => ang(i / 5 * TAU + 0.6, 82)), repairs, storm: { name: 'SUGAR STORM', col: '#ffb0dc' } };
  return this.finish(E);
};

/* ---------------- the moving parts ---------------- */
const MxbMesh = {
  egg(m) { m.color('#fff6ea').shine(3); m.ellipsoid(0, 0, 0, 1.7, 2.25, 1.7, { seg: 14, rings: 10 }); m.color('#ffffff', 0.3); m.ellipsoid(-0.6, 0.8, 1.2, 0.35, 0.5, 0.2, { seg: 6, rings: 4 }); m.emissive(0).shine(0); },
  // the rolling pin: along local x (it rolls by pitch), handles and knobs on the ends
  pin(m) {
    const h = MXB.pin.half, r = MXB.pin.rad;
    m.color('#ecc48c').shine(2); m.limb(-h, 0, 0, h, 0, 0, r, r, { seg: 18 });
    m.color('#c8965a'); for (let k = -3; k <= 3; k++) { m.push(); m.tf(k * h / 3.6, 0, 0, 0, 0, Math.PI / 2); m.torus(0, 0, 0, r + 0.02, 0.08, { seg: 18, tseg: 3 }); m.pop(); }
    m.color('#ff8ac8').shine(2); for (const sd of [-1, 1]) { m.limb(sd * h, 0, 0, sd * (h + 2.6), 0, 0, 0.6, 0.6, { seg: 10 }); m.ball(sd * (h + 3.0), 0, 0, 0.95, { seg: 10, rings: 7 }); }
    m.shine(0);
  },
  // the flour sifter: a steel drum with a mesh bottom, a crank on the side, a red squeeze handle (origin at its top)
  sifter(m) {
    m.color('#dfe4ea').shine(3); m.lathe([[4.6, -4.0], [4.8, -3.6], [4.8, 0], [5.0, 0.2], [4.7, 0.3]], { seg: 28 }); m.lathe([[4.75, 0.2], [4.55, -3.8], [4.4, -3.9]], { seg: 28 });
    m.color('#8a9098'); m.disc(0, -3.7, 0, 4.6, 24, { flip: true }); m.color('#c8ccd4'); for (let k = -4; k <= 4; k++) { m.box(k, -3.75, 0, 0.08, 0.06, 8.6 * Math.sqrt(Math.max(0, 1 - (k / 4.6) ** 2))); m.box(0, -3.75, k, 8.6 * Math.sqrt(Math.max(0, 1 - (k / 4.6) ** 2)), 0.06, 0.08); }
    m.color('#ff5a8a').shine(2); m.limb(4.8, -1.5, 0, 7.2, -1.5, 0, 0.3, 0.3, { seg: 6 }); m.limb(7.2, -1.5, 0, 7.2, -0.2, 0.8, 0.22, 0.22, { seg: 6 }); m.ball(7.2, 0, 1.0, 0.45, { seg: 8, rings: 5 });
    m.color('#dfe4ea').shine(3); m.limb(-4.8, -1.0, 0, -6.4, 1.6, 0, 0.35, 0.35, { seg: 6 }); m.color('#ff5a8a'); m.limb(-6.4, 1.6, 0, -6.4, 4.8, 0, 0.45, 0.45, { seg: 8 });
    m.color('#ffffff'); m.ellipsoid(0, -0.2, 0, 4.4, 0.8, 4.4, { seg: 18, rings: 5, phi1: Math.PI / 2 }); m.shine(0);
  },
  // the flat beater: a rounded-triangle frame on a shaft (origin at the hub; the shaft rises 6 m)
  beater(m) {
    m.color('#f4f6fa').shine(3); m.cyl(0, 0, 0, 0.9, 0.9, 6, 14);
    const P = []; for (let i = 0; i <= 24; i++) { const t = i / 24 * TAU, x = Math.sin(t) * 5.0 * (0.55 + 0.45 * (1 - Math.cos(t)) / 2), y = -(1 - Math.cos(t)) / 2 * 11; P.push([x, y]); }
    for (let i = 0; i < 24; i++) m.limb(P[i][0], P[i][1], 0, P[i + 1][0], P[i + 1][1], 0, 0.55, 0.55, { seg: 8, ends: false });
    m.limb(0, 0, 0, 0, -11, 0, 0.5, 0.5, { seg: 8 }); for (const sd of [-1, 1]) m.limb(0, -3, 0, sd * 3.8, -7.5, 0, 0.4, 0.4, { seg: 7 });
    m.color('#ff8ac8'); m.torus(0, 0.2, 0, 1.0, 0.25, { seg: 14, tseg: 4 }); m.shine(0);
  }
};

/* ---------------- the rules ---------------- */
// a hazard target: a random live car, led by its velocity, kept inside the bowl
function cartMxbTarget(s, lead, avoid, out) {
  const K = s.karts; let n = 0; for (const k of K) if (!k.out && k !== avoid) n++;
  if (!n) { out[0] = (s.rng() - 0.5) * 100; out[1] = (s.rng() - 0.5) * 100; return null; }
  let pick = Math.floor(s.rng() * n), tgt = null; for (const k of K) { if (k.out || k === avoid) continue; if (pick-- === 0) { tgt = k; break; } }
  let x = tgt.x + tgt.vx * lead, z = tgt.z + tgt.vz * lead; const r = Math.hypot(x, z), lim = MXB.R - 10; if (r > lim) { x *= lim / r; z *= lim / r; }
  out[0] = x; out[1] = z; return tgt;
}
CART_ARENA_RULES.mixbowl = {
  music: 'kart2',
  onLoad(s) {
    const D = s.mxb = { t: 0, eggs: [], slicks: [], eggNext: 7, pin: { st: 'idle', t: 0, next: 13, x0: 0, z0: 0, dx: 0, dz: 1, u: 0, u1: 0, x: 0, z: 0, spin: 0, mask: 0 }, sift: { st: 'glide', t: 0, x: 0, z: 40, tx: 0, tz: 40, next: 9, mask: 0, tgt: null }, beat: 0 };
    for (let i = 0; i < 4; i++) D.eggs.push({ live: false, t: 0, x: 0, z: 0, y: 0, spin: 0 });
    for (let i = 0; i < 5; i++) D.slicks.push({ live: false, t: 0, x: 0, z: 0, mask: 0 });
    const G = new BurnsGroup(Math.min(64, BurnsGL.maxBones || 32));
    for (const e of D.eggs) e.o = G.add(MxbMesh.egg, { visible: false });
    D.pin.o = G.add(MxbMesh.pin, { visible: false }); D.sift.o = G.add(MxbMesh.sifter, { visible: true }); D.beater = G.add(MxbMesh.beater, { visible: true });
    G.finish(); D.G = G;
  },
  onUpdate(s, dt, racing) {
    const D = s.mxb, M = MXB; if (!D) return;
    D.beat += dt * 0.5;
    const live = racing && s.state === 'race' && !(s.obj && s.obj.ended);
    if (!live) return;
    D.t += dt;
    const P = s.player, near = (x, z, r) => P && !P.out && Math.hypot(P.x - x, P.z - z) < r;
    // ---- EGG DROP: target (1.6 s: reticle, shadow, the egg falling into view) → SPLAT + a yolk slick ----
    D.eggNext -= dt;
    if (D.eggNext <= 0 && D.t > 5) {
      const e = D.eggs.find(q => !q.live);
      if (e) { const k = cartMxbTarget(s, 1.4, null, MXB_T.p); e.live = true; e.t = 0; e.x = MXB_T.p[0]; e.z = MXB_T.p[1]; e.spin = s.rng() * TAU; if (k && k.player) s.banner('EGG INCOMING!', '#ffd84a', 1.1, 'steer off the target', true); Sound.play('throw', { vol: near(e.x, e.z, 60) ? 0.6 : 0.15, pitch: 0.6 }); }
      D.eggNext = M.egg.every[0] + s.rng() * (M.egg.every[1] - M.egg.every[0]);
    }
    for (const e of D.eggs) {
      if (!e.live) continue;
      e.t += dt; const u = Math.min(1, e.t / M.egg.warn); e.y = lerp(M.egg.fromY, 2.2, u * u * u);
      if (u > 0.4) cartIxObs(s, e.x, e.z, M.egg.r + 1);
      if (u >= 1) {
        e.live = false;
        for (const k of s.karts) { if (k.out || k.y > 4) continue; const dx = k.x - e.x, dz = k.z - e.z, d = Math.hypot(dx, dz); if (d < M.egg.r) s.hit(k, 'knock', null, { item: 'mxbegg', dx: dx / (d || 1), dz: dz / (d || 1), power: 12, banner: 'EGGSPLOSION!' }); }
        let sl = D.slicks.find(q => !q.live); if (!sl) sl = D.slicks.reduce((a, b) => (a.t > b.t ? a : b)); sl.live = true; sl.t = 0; sl.x = e.x; sl.z = e.z; sl.mask = 0;
        if (s.fx) { s.fx.burst(e.x, 1.5, e.z, 'star', 14, '#ffd84a'); s.fx.burst(e.x, 1.2, e.z, 'spark', 12, '#ffffff'); s.fx.dust(e.x, 0.5, e.z, 10, '#fff4dc'); }
        Sound.play('splat', { vol: near(e.x, e.z, 50) ? 0.9 : 0.2, pitch: 0.7 }); if (near(e.x, e.z, 25)) s.shakeIt(0.5);
      }
    }
    for (const sl of D.slicks) {
      if (!sl.live) continue; sl.t += dt; if (sl.t > M.egg.slickLife) { sl.live = false; continue; }
      cartIxObs(s, sl.x, sl.z, M.egg.slickR + 0.5);
      for (const k of s.karts) { if (k.out || k.air || (sl.mask & (1 << k.slot)) || Math.hypot(k.x - sl.x, k.z - sl.z) > M.egg.slickR) continue; sl.mask |= 1 << k.slot; s.hit(k, 'slip', null, { item: 'mxbyolk', banner: 'YOLK SLICK!' }); }
    }
    // ---- ROLLING PIN: wobbles at the rim, its lane flashes (1.8 s) → rolls right across the bowl ----
    const N = D.pin, PM = M.pin;
    if (N.st === 'idle') { N.next -= dt; if (N.next <= 0 && D.t > 8) {
      // a lane through a random car, in a random direction, from rim to rim
      cartMxbTarget(s, 1.0, null, MXB_T.p); const a = s.rng() * TAU, dx = Math.sin(a), dz = Math.cos(a), cx = MXB_T.p[0], cz = MXB_T.p[1];
      const b = cx * dx + cz * dz, c = cx * cx + cz * cz - (M.R - 6) ** 2, q = Math.sqrt(Math.max(0, b * b - c));
      N.x0 = cx + dx * (-b - q); N.z0 = cz + dz * (-b - q); N.u1 = 2 * q; N.dx = dx; N.dz = dz; N.u = 0; N.st = 'warn'; N.t = 0; N.mask = 0; N.x = N.x0; N.z = N.z0;
      // does the lane pass near the player? warn them
      if (P && !P.out) { const px = P.x - N.x0, pz = P.z - N.z0, along = px * dx + pz * dz, perp = Math.abs(px * dz - pz * dx); if (along > 0 && along < N.u1 && perp < PM.half + 12) s.banner('ROLLING PIN!', '#ffb02a', 1.4, 'get out of its lane', true); }
      Sound.play('stomp', { vol: near(N.x0, N.z0, 80) ? 0.6 : 0.15, pitch: 0.6 });
    } }
    else if (N.st === 'warn') { N.t += dt; if (N.t > PM.warn) { N.st = 'roll'; N.t = 0; Sound.play('cartBoom', { vol: near(N.x0, N.z0, 90) ? 0.6 : 0.2, pitch: 0.5 }); } }
    else if (N.st === 'roll') {
      N.t += dt; N.u += PM.speed * dt; N.spin -= PM.speed * dt / PM.rad; N.x = N.x0 + N.dx * N.u; N.z = N.z0 + N.dz * N.u;
      for (let r = 0; r <= 24; r += 8) cartIxObs(s, N.x + N.dx * r, N.z + N.dz * r, PM.half + 1);
      for (const k of s.karts) {
        if (k.out || (N.mask & (1 << k.slot)) || k.y > 4.5) continue;
        const px = k.x - N.x, pz = k.z - N.z, along = px * N.dx + pz * N.dz, perp = Math.abs(px * N.dz - pz * N.dx);
        if (Math.abs(along) < PM.rad + 1.3 && perp < PM.half + 1.2) { N.mask |= 1 << k.slot; s.hit(k, 'knock', null, { item: 'mxbpin', dx: N.dx, dz: N.dz, power: 20, banner: 'FLATTENED!' }); if (s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'star', 12, '#ffe08a'); }
      }
      if (s.fx && Math.random() < 0.5 && near(N.x, N.z, 140)) s.fx.dust(N.x - N.dx * 2, 0.4, N.z - N.dz * 2, 2, '#fff4e4');
      if (near(N.x, N.z, 22)) s.shakeIt(0.15);
      if (N.u > N.u1) { N.st = 'idle'; N.next = PM.every[0] + s.rng() * (PM.every[1] - PM.every[0]); }
    }
    // ---- FLOUR SIFTER: glides over a car → shakes, rings the floor (1.3 s) → sifts (2.4 s): FLOURED ----
    const F = D.sift, FM = M.sift;
    if (F.st === 'glide') {
      F.next -= dt;
      if (F.tgt && !F.tgt.out) { F.tx = F.tgt.x; F.tz = F.tgt.z; }
      const dx = F.tx - F.x, dz = F.tz - F.z, d = Math.hypot(dx, dz); if (d > 0.5) { const st = Math.min(d, FM.speed * dt); F.x += dx / d * st; F.z += dz / d * st; }
      if (F.next <= 0 && D.t > 6) { if (d < 4 || F.next < -6) { F.st = 'warn'; F.t = 0; F.mask = 0; F.tgt = null; if (near(F.x, F.z, FM.r + 6)) s.banner('FLOUR SIFTER!', '#ffffff', 1.1, 'drive out of the ring', true); } }
      else if (!F.tgt || F.tgt.out) { F.tgt = cartMxbTarget(s, 0, null, MXB_T.p); F.tx = MXB_T.p[0]; F.tz = MXB_T.p[1]; }
    } else if (F.st === 'warn') { F.t += dt; cartIxObs(s, F.x, F.z, FM.r * F.t / FM.warn); if (F.t > FM.warn) { F.st = 'sift'; F.t = 0; Sound.play('cartSparkle', { vol: near(F.x, F.z, 50) ? 0.6 : 0.15, pitch: 0.6 }); } }
    else if (F.st === 'sift') {
      F.t += dt; cartIxObs(s, F.x, F.z, FM.r);
      for (const k of s.karts) { if (k.out || (F.mask & (1 << k.slot)) || Math.hypot(k.x - F.x, k.z - F.z) > FM.r) continue; F.mask |= 1 << k.slot; s.hit(k, 'dazzle', null, { item: 'mxbflour', banner: 'FLOURED!' }); }
      if (F.t > FM.sift) { F.st = 'glide'; F.t = 0; F.next = 5 + s.rng() * 3; F.tgt = cartMxbTarget(s, 0, F.tgt, MXB_T.p); F.tx = MXB_T.p[0]; F.tz = MXB_T.p[1]; }
    }
  },
  render(s, R) {
    const D = s.mxb, M = MXB; if (!D) return;
    const t = s.time;
    for (const e of D.eggs) { const o = e.o; o.visible = e.live && e.y < 55; if (o.visible) { o.x = e.x; o.y = e.y; o.z = e.z; o.yaw = e.spin; o.pitch = e.t * 3; o.roll = 0; o.scale = 1.3; } }
    const N = D.pin, o = N.o; o.visible = N.st !== 'idle';
    if (o.visible) { o.x = N.x + (N.st === 'warn' ? Math.sin(t * 24) * 0.25 : 0); o.y = M.pin.rad; o.z = N.z; o.yaw = Math.atan2(N.dx, N.dz); o.pitch = N.spin + (N.st === 'warn' ? Math.sin(t * 18) * 0.15 : 0); o.roll = 0; o.scale = 1; }
    const F = D.sift, f = F.o, sh = F.st === 'warn' ? 0.25 * (F.t / M.sift.warn) : F.st === 'sift' ? 0.18 : 0;
    f.x = F.x + Math.sin(t * 31) * sh; f.y = M.sift.y + Math.sin(t * 1.3) * 0.5; f.z = F.z + Math.cos(t * 27) * sh; f.yaw = t * 0.2; f.pitch = Math.sin(t * 23) * sh * 0.2; f.roll = Math.sin(t * 19) * sh * 0.2; f.scale = 1.2;
    const B = D.beater; B.x = 0; B.y = 20; B.z = 0; B.yaw = D.beat; B.pitch = 0; B.roll = 0; B.scale = 1;
    D.G.pose(s.cam); R.skin(D.G.geo, D.G.bones, D.G.objs.length, null, 0, 0.5);
  },
  draw(s, R, Sp, t) {
    const D = s.mxb, M = MXB; if (!D) return;
    // eggs: a target reticle closing in and a shadow growing under the falling egg
    for (const e of D.eggs) {
      if (!e.live) continue; const u = Math.min(1, e.t / M.egg.warn), bl = 0.55 + 0.45 * Math.sin(t * (10 + u * 20));
      R.flat.flat(e.x, 0.12, e.z, M.egg.r * 2.4 - u * 2, M.egg.r * 2.4 - u * 2, t * 2, Sp.reticle || Sp.warn, M.red, 0.95 * bl, false);
      R.flat.flat(e.x, 0.11, e.z, 1 + u * M.egg.r * 1.4, 1 + u * M.egg.r * 1.4, 0, Sp.shadow, M.black, 0.25 + u * 0.45, false);
      if (e.y > 55) R.bbs.streak(e.x, 60, e.z, 0, 1, 0, 20, 0.5, Sp.streak, M.white, 0.3);
    }
    // yolk slicks: a white rim, a yellow yolk, a glossy highlight; they fade out
    for (const sl of D.slicks) { if (!sl.live) continue; const g = Math.min(1, sl.t / 0.25), a = Math.min(1, (M.egg.slickLife - sl.t) / 0.8), r = M.egg.slickR * g; R.flat.flat(sl.x, 0.07, sl.z, r * 2.3, r * 2.3, 0.7, Sp.splat || Sp.dot, M.cream, 0.95 * a, false); R.flat.flat(sl.x, 0.08, sl.z, r * 1.1, r * 1.1, 0, Sp.dot, M.yolk, a, false); R.flat.flat(sl.x - 0.5, 0.09, sl.z - 0.4, r * 0.35, r * 0.25, 0.5, Sp.dot, M.white, 0.7 * a, false); }
    // the rolling pin's lane: amber chevrons pointing where it will roll, flashing during the warning; its shadow
    const N = D.pin;
    if (N.st !== 'idle') {
      const fl = N.st === 'warn' ? 0.35 + 0.65 * Math.max(0, Math.sin(t * 16)) : 0.55, yaw = Math.atan2(N.dx, N.dz), u0 = N.st === 'roll' ? N.u + 4 : 4;
      for (let u = u0; u < N.u1; u += 9) { const x = N.x0 + N.dx * u, z = N.z0 + N.dz * u, a = N.st === 'roll' ? Math.max(0, 1 - (u - N.u) / 90) : 1; R.flat.flat(x, 0.12, z, M.pin.half * 1.6, 5.5, yaw, Sp.arrow, M.amber, 0.85 * fl * a, false); }
      for (const sd of [-1, 1]) { const ox = N.dz * sd * (M.pin.half + 1), oz = -N.dx * sd * (M.pin.half + 1), L = N.u1 - (N.st === 'roll' ? N.u : 0), cx = N.x0 + N.dx * ((N.st === 'roll' ? N.u : 0) + L / 2), cz = N.z0 + N.dz * ((N.st === 'roll' ? N.u : 0) + L / 2); R.flat.flat(cx + ox, 0.12, cz + oz, 0.6, L, yaw, Sp.square, M.amber, 0.85 * fl, false); }
      R.flat.flat(N.x, 0.1, N.z, M.pin.half * 2.4, 4, yaw + Math.PI / 2, Sp.shadow, M.black, 0.45, false);
    }
    // the sifter: its cable, a shadow; the ring on the floor while it shakes; flour falling while it sifts
    const F = D.sift;
    R.bbs.streak(F.x, M.sift.y + 30, F.z, 0, 1, 0, 60, 0.35, Sp.streak, [0.85, 0.88, 0.95], 0.6);
    R.flat.flat(F.x, 0.1, F.z, 10, 10, 0, Sp.shadow, M.black, 0.25, false);
    if (F.st === 'warn') { const fl = 0.45 + 0.55 * Math.max(0, Math.sin(t * 18)), u = F.t / M.sift.warn; R.flat.flat(F.x, 0.13, F.z, M.sift.r * 2, M.sift.r * 2, t * 1.5, Sp.warn, M.hot, 0.95 * fl, false); R.flat.flat(F.x, 0.12, F.z, M.sift.r * 2 * (1.6 - u * 0.6), M.sift.r * 2 * (1.6 - u * 0.6), 0, Sp.ring, M.hot, 0.85 * fl, false); if (s.fx && Math.random() < 0.4) s.fx.add(F.x + (Math.random() - 0.5) * 6, M.sift.y - 5, F.z + (Math.random() - 0.5) * 6, 0, -4, 0, 1.0, 0.4, 0.3, M.flour, 0.8, 'dot', 4); }
    if (F.st === 'sift') {
      R.flat.flat(F.x, 0.13, F.z, M.sift.r * 2, M.sift.r * 2, 0, Sp.glow, M.flour, 0.75, false); R.flat.flat(F.x, 0.14, F.z, M.sift.r * 2, M.sift.r * 2, 0, Sp.ring, M.white, 0.9, true);
      R.bbs.bb(F.x, M.sift.y * 0.5, F.z, M.sift.r * 1.6, M.sift.y, Sp.glow, M.flour, 0.35, false);
      if (s.fx) for (let i = 0; i < 3; i++) { const a = Math.random() * TAU, r = Math.random() * M.sift.r * 0.6; s.fx.add(F.x + Math.sin(a) * r, M.sift.y - 4, F.z + Math.cos(a) * r, (Math.random() - 0.5) * 2, -9, (Math.random() - 0.5) * 2, 2.2, 1.2, 3.2, M.flour, 0.55, 'puff', 4); }
    }
  },
  lights(s, add) { const D = s.mxb; if (!D) return; if (D.sift.st === 'sift') add(D.sift.x, 4, D.sift.z, 16, MXB.flour, 0.6, 1); },
  radar(s, ctx, P, sc) {
    const D = s.mxb, q = CART_ROY_T.p; if (!D) return;
    P(0, 0, q); ctx.fillStyle = 'rgba(242,216,168,0.7)'; ctx.beginPath(); ctx.arc(q.x, q.y, MXB.dough * sc, 0, TAU); ctx.fill();
    const N = D.pin; if (N.st !== 'idle') { P(N.x0, N.z0, q); const ax = q.x, ay = q.y; P(N.x0 + N.dx * N.u1, N.z0 + N.dz * N.u1, q); ctx.strokeStyle = 'rgba(255,170,40,0.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(q.x, q.y); ctx.stroke(); }
    if (D.sift.st !== 'glide') { P(D.sift.x, D.sift.z, q); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, MXB.sift.r * sc, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,200,40,0.95)'; for (const e of D.eggs) if (e.live) { P(e.x, e.z, q); ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }
  }
};

/* ---------------- the registry ---------------- */
CART_ARENAS.push({
  id: 'mixbowl', name: 'THE MIXING BOWL', sub: 'Battle royale: egg drops, a rolling pin, a flour sifter', objectives: ['royale'], royale: true, levelCar: 'cupcake',
  col: '#ff8ac8', tod: 'day', blurb: 'Frosted Fury\'s kitchen. Dodge the falling eggs, the rolling pin and the flour sifter. Last car running wins.'
});
CART_ROYALE_ARENAS.cupcake = 'mixbowl';
CART_ARENA_ICONS.mixbowl = (ctx, s, t, col) => {
  // a mixing bowl with a whisk turning in it
  ctx.save(); ctx.fillStyle = '#a8dcef'; ctx.strokeStyle = col; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-s * 0.8, -s * 0.1); ctx.quadraticCurveTo(-s * 0.75, s * 0.75, 0, s * 0.75); ctx.quadraticCurveTo(s * 0.75, s * 0.75, s * 0.8, -s * 0.1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd0e4'; ctx.beginPath(); ctx.ellipse(0, -s * 0.1, s * 0.8, s * 0.18, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(s * 0.1, -s * 0.15); ctx.rotate(0.35 + Math.sin(t * 3) * 0.2); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
  for (const w of [0.12, 0.24, 0.36]) { ctx.beginPath(); ctx.ellipse(0, -s * 0.35, s * w, s * 0.42, 0, 0, TAU); ctx.stroke(); }
  ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, -s * 0.75); ctx.lineTo(0, -s * 1.05); ctx.stroke(); ctx.restore();
  ctx.restore();
};
