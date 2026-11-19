/* ============================================================
   ART CART — royale arena: FIRE GARDEN (id 'firegarden', Calamari Inferno's arena; Nov 19 2026)
   A night-time garden of fire behind the foundry. In the middle THE COPPER KRAKEN: a giant riveted octopus on a
   brick plinth whose eight arms drape over the edge, every tip a burner. Round it six FIRE-FLOWER BEDS of copper
   blossoms; six fire pits; a ring of COPPER PIPE WALLS with gaps (cover, sight-line breakers, the way through);
   furnaces, smokestacks and crowds beyond the fence.
   Its enemies (all telegraphed, all readable on a phone):
     · KRAKEN FIRE: an arm tip glows and its slice of ground flashes AMBER (1.3 s), then the arm breathes a 36 m tongue
       of flame along it: 12 HP and a spin. The kraken turns its arms toward cars near it (get out of the slice)
     · FIRE BLOOMS: a bed's flowers glow and an amber ring blinks round it (1.5 s), then the whole bed bursts into
       flame: 10 HP and a knock out of the bed (drive out of the ring)
     · FIRE WHIRLS: a fire pit spins up a swirl (1.5 s), then a flame tornado roams the garden for ~13 s, drifting
       toward cars near it: 12 HP and a toss into the air (out-drive it: it is slower than any car)
   TENTACLE TOSS (Calamari Inferno's special) is in everyone's gift boxes here (arena levelCar → the scene's poolCar).
   Reuses the foundry's furnace, fire pit, flower, stack and funnel builders (43_cart_j_foundry.js; called at run time).
   Globals CART_FGN*, state on s.fgn. Everything here is an original design.
   ============================================================ */
const CART_FGN = {
  R: 178, plinth: 16.5, armN: 8, tipR: 18.2, tipY: 4.4, bedR: 70, bedN: 6, bed: 10, wallR: 122, wallN: 6, wallSpan: 0.27, pitR: 98,
  arm: { every: 2.7, warn: 1.3, fire: 1.0, len: 36, half: 0.2, max: 2 },
  bloom: { period: 11, warn: 1.5, burst: 1.1 },
  whirl: { n: 3, warn: 1.5, life: 13, speed: 7.5, r: 3.4 },
  amber: [1, 0.66, 0.15], orange: [1, 0.48, 0.1], yellow: [1, 0.86, 0.35], hot: [1, 0.3, 0.06], white: [1, 1, 1], black: [0, 0, 0], cream: [1, 0.95, 0.8], copper: [0.95, 0.55, 0.28]
};
const CART_FGN_T = { p: {} };
const fgnAng = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
const fgnWallA = i => i / CART_FGN.wallN * TAU, fgnGapA = i => (i + 0.5) / CART_FGN.wallN * TAU, fgnArmA = i => (i + 0.5) / CART_FGN.armN * TAU;

/* ---------------- the copper kraken (one static piece; its burners are the rules' sprites) ---------------- */
function fgnKraken(m) {
  const C = CART_FGN, lights = [];
  // the plinth: a stepped brick drum with a copper rim and a glowing band
  m.color('#5a2e22').shine(0); m.lathe([[C.plinth + 0.6, 0], [C.plinth + 0.6, 0.9], [C.plinth, 1.2], [C.plinth - 0.2, 2.1], [0, 2.1]], { seg: 40 });
  m.color('#b8642e').shine(3); m.torus(0, 2.05, 0, C.plinth - 0.15, 0.2, { seg: 48, tseg: 4 }); m.shine(0);
  m.color('#ff7a2a', 1); m.torus(0, 0.95, 0, C.plinth + 0.62, 0.1, { seg: 48, tseg: 3 }); m.emissive(0);
  // eight arms: from under the mantle, out along the plinth, over the edge, the tip curling up into a burner
  for (let i = 0; i < C.armN; i++) {
    const a = fgnArmA(i), sa = Math.sin(a), ca = Math.cos(a), px = -ca, pz = sa, P = [];
    for (let j = 0; j <= 16; j++) { const u = j / 16, r = lerp(3.5, C.plinth - 0.4, u), y = lerp(6.5, 2.6, Math.pow(u, 0.6)), wig = Math.sin(u * 5 + i) * 1.1 * u; P.push([sa * r + px * wig, y, ca * r + pz * wig]); }
    for (let j = 1; j <= 6; j++) { const th = j / 6 * 1.35 * Math.PI, rad = 1.6 - j * 0.12, r = C.plinth - 0.4 + Math.sin(th) * rad + j * 0.18; P.push([sa * r, 2.6 + (1 - Math.cos(th)) * rad, ca * r]); }
    m.color('#b8642e').shine(3);
    for (let j = 0; j < P.length - 1; j++) { const u = j / (P.length - 1), r0 = lerp(1.25, 0.42, u), r1 = lerp(1.25, 0.42, (j + 1) / (P.length - 1)); m.limb(P[j][0], P[j][1], P[j][2], P[j + 1][0], P[j + 1][1], P[j + 1][2], r0, r1, { seg: 9, ends: j === 0 }); }
    m.shine(1); m.color('#f0c8a0'); for (let j = 2; j < 16; j += 2) { const u = j / (P.length - 1), r = lerp(1.25, 0.42, u); m.ball(P[j][0], P[j][1] - r * 0.7, P[j][2], r * 0.4, { seg: 7, rings: 4 }); }
    // the burner nozzle at the tip, glowing
    const T = P[P.length - 1]; m.color('#2a2220').shine(2); m.cyl(T[0], T[1] - 0.2, T[2], 0.42, 0.55, 0.5, 12); m.color('#ff8a2a', 1); m.torus(T[0], T[1] + 0.3, T[2], 0.5, 0.08, { seg: 12, tseg: 3 }); m.emissive(0).shine(0);
    lights.push({ x: T[0], y: T[1] + 0.5, z: T[2], s: 1.4, c: '#ff8a2a' });
  }
  // the mantle: a tall riveted dome, two big eyes looking out each way, a glowing furnace grin
  m.color('#c06a30').shine(3); m.ellipsoid(0, 9.6, 0, 5.4, 6.8, 5.6, { seg: 28, rings: 18 }); m.ellipsoid(0, 4.6, 0, 5.6, 2.8, 5.6, { seg: 26, rings: 10 });
  m.color('#e8a060').shine(2); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; m.ball(Math.sin(a) * 5.35, 7.4, Math.cos(a) * 5.55, 0.2, { seg: 6, rings: 4 }); m.ball(Math.sin(a) * 4.3, 12.6, Math.cos(a) * 4.45, 0.18, { seg: 6, rings: 4 }); }
  for (const fz of [1, -1]) for (const sx of [-2.0, 2.0]) {
    m.color('#fff4e0').shine(3); m.ball(sx, 6.4, fz * 4.6, 1.5, { seg: 16, rings: 12 }); m.color('#ff7a1a', 1); m.ball(sx, 6.4, fz * 5.85, 0.8, { seg: 12, rings: 8 }); m.color('#1a0a06', 0); m.ball(sx, 6.4, fz * 6.4, 0.4, { seg: 8, rings: 5 }); m.shine(0);
    lights.push({ x: sx, y: 6.4, z: fz * 6.2, s: 2.4, c: '#ff7a1a' });
  }
  m.color('#ffb040', 1); for (const fz of [1, -1]) { m.ellipsoid(0, 4.4, fz * 5.2, 1.8, 0.4, 0.5, { seg: 12, rings: 6 }); } m.emissive(0);
  m.color('#ff6a2a', 1); m.torus(0, 16.3, 0, 1.2, 0.18, { seg: 16, tseg: 4 }); m.emissive(0);
  lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ff7a2a', pool: 26 });
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: C.plinth + 0.8, y0: 0, y1: 16 }], lights };
}
// a copper pipe wall section (6 m along local x, the front +z faces the garden); built near-white for the tint
const CART_FGN_KINDS = {
  fgn_pipewall: { r: 4.2, near: 40, mid: 130, farD: 360, glows: [[0, 4.2, 0.6, 1.0]], pool: 7,
    build(m, o) {
      m.color('#2a2220').shine(1); for (const sx of [-2.4, 2.4]) { m.limb(sx, 0, -0.9, sx, 4.1, 0, 0.18, 0.15, { seg: 6 }); m.limb(sx, 0, 0.9, sx, 4.1, 0, 0.18, 0.15, { seg: 6 }); m.roundBox(sx, 0.2, 0, 0.8, 0.4, 2.2, 0.1); }
      m.color('#ffffff').shine(3);
      for (const [y, r] of [[0.95, 0.62], [2.25, 0.55], [3.4, 0.45]]) { m.limb(-3.05, y, 0, 3.05, y, 0, r, r, { seg: m.lo ? 8 : 12, ends: false }); for (const fx of [-3.0, 0, 3.0]) { m.push(); m.tf(fx, y, 0, 0, 0, Math.PI / 2); m.torus(0, 0, 0, r + 0.02, 0.1, { seg: m.lo ? 8 : 12, tseg: 3 }); m.pop(); } }
      m.color('#d84a2a').shine(2); m.push(); m.tf(1.2, 2.25, 0.62, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.45, 0.06, { seg: 12, tseg: 3 }); m.pop(); m.limb(0.75, 2.25, 0.62, 1.65, 2.25, 0.62, 0.04, 0.04, { seg: 4 });
      m.color('#ff8a3a', o.night ? 1 : 0.3); m.limb(-2.8, 1.62, 0.5, 2.8, 1.62, 0.5, 0.05, 0.05, { seg: 4, ends: false }); m.ball(0, 4.2, 0.4, 0.14, { seg: 6, rings: 4 }); m.emissive(0).shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 3.1, hz: 0.9, y0: 0, y1: 3.9 }] };
    },
    far(m, o) { m.color('#ffffff'); m.box(0, 0.95, 0, 6.1, 1.2, 1.2); m.box(0, 2.25, 0, 6.1, 1.1, 1.1); m.box(0, 3.4, 0, 6.1, 0.9, 0.9); m.color('#ff8a3a', o.night ? 1 : 0.3); m.box(0, 1.62, 0.55, 5.6, 0.1, 0.1); m.emissive(0); } }
};

/* ---------------- the world ---------------- */
CartWorlds.arena_firegarden = function (A, night) {
  const C = CART_FGN, E = this.base(2143, [-235, -235, 235, 235], '#5a4038', 0.05);
  const sky = Object.assign(CART_SKIES.night(), { zen: '#0a0504', hor: '#8a2c0e', sky: '#4a2418', fog: '#2a120c', fogD: 0.0042, mid: '#4a1a0a', midK: 0.4, cityCol: '#ff6a2a', cityK: 0.6, emB: 1.85, keyK: 0.5, key: '#ffc8a0', stars: 0.45, cloudCol: '#4a1e12', rim: '#ff8a4a' });
  Object.assign(E, { id: 'firegarden', arena: A, sky, tod: 'night', music: 'kart4', night: true, R: C.R });
  const api = E.api, T = E.terrain, rng = mulberry32(2143);
  E.walls = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; E.walls.push(fgnAng(a, C.R)); }
  CartDecor.protos(E);
  CartKit.kinds(E, Object.assign({}, CART_FGN_KINDS, { fdy_flower: FDY_KINDS.fdy_flower, fdy_stack: FDY_KINDS.fdy_stack }));
  // ---- ground paint: soot specks, a brick plaza round the kraken, lava cracks, the flower beds' soil and rims ----
  api.paint((ctx, P, sc) => {
    for (let i = 0; i < 460; i++) { const x = (rng() - 0.5) * 460, z = (rng() - 0.5) * 460, q = P(x, z); ctx.fillStyle = rng() < 0.6 ? `rgba(30,16,12,${0.06 + rng() * 0.1})` : `rgba(150,90,60,${0.05 + rng() * 0.07})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (2 + rng() * 9) * sc, (1 + rng() * 5) * sc, rng() * 3, 0, TAU); ctx.fill(); }
    const c0 = P(0, 0);
    // the plaza: rings of brick
    for (let r = C.plinth + 1; r < C.plinth + 13; r += 1.1) { const n = Math.round(TAU * r / 1.6); for (let j = 0; j < n; j++) { const a = (j + (Math.round(r) % 2) * 0.5) / n * TAU, q = P(...fgnAng(a, r)); ctx.fillStyle = (j + Math.round(r)) % 3 ? 'rgba(120,50,30,0.6)' : 'rgba(92,38,24,0.6)'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(-a); ctx.fillRect(-0.72 * sc, -0.45 * sc, 1.44 * sc, 0.9 * sc); ctx.restore(); } }
    ctx.strokeStyle = 'rgba(255,120,40,0.6)'; ctx.lineWidth = 0.5 * sc; ctx.beginPath(); ctx.arc(c0[0], c0[1], (C.plinth + 13.2) * sc, 0, TAU); ctx.stroke();
    // lava cracks: from the plaza out between the beds, jagged and glowing
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 18; i++) { let a = i / 18 * TAU + rng() * 0.2, r = C.plinth + 14; ctx.strokeStyle = `rgba(255,${90 + Math.floor(rng() * 80)},30,${0.4 + rng() * 0.3})`; ctx.lineWidth = (0.3 + rng() * 0.5) * sc; ctx.beginPath(); let q = P(...fgnAng(a, r)); ctx.moveTo(q[0], q[1]); const end = 50 + rng() * 60; while (r < end) { r += 2 + rng() * 3; a += (rng() - 0.5) * 0.08; q = P(...fgnAng(a, r)); ctx.lineTo(q[0], q[1]); } ctx.stroke(); }
    // the beds: dark soil, a copper rim, a faint ember glow
    for (let i = 0; i < C.bedN; i++) { const q = P(...fgnAng(fgnGapA(i), C.bedR)); ctx.fillStyle = 'rgba(28,14,10,0.85)'; ctx.beginPath(); ctx.arc(q[0], q[1], C.bed * sc, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(210,120,60,0.9)'; ctx.lineWidth = 0.6 * sc; ctx.beginPath(); ctx.arc(q[0], q[1], C.bed * sc, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,110,30,0.12)'; ctx.beginPath(); ctx.arc(q[0], q[1], C.bed * 0.7 * sc, 0, TAU); ctx.fill(); }
    // lanes through the wall gaps (soft ember carpet)
    for (let i = 0; i < C.wallN; i++) { const a = fgnGapA(i), p0 = P(...fgnAng(a, C.wallR - 14)), p1 = P(...fgnAng(a, C.wallR + 14)); ctx.strokeStyle = 'rgba(255,120,50,0.14)'; ctx.lineWidth = 12 * sc; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
  });
  // ---- the copper kraken ----
  CartScene.mesh(api, 0, 0, 0, fgnKraken, { hi: true });
  E.arms = []; for (let i = 0; i < C.armN; i++) { const a = fgnArmA(i), [x, z] = fgnAng(a, C.tipR); E.arms.push({ i, a, x, z }); api.fire(x, C.tipY, z, 0.6, { hazard: false }); }
  api.sign('FIRE GARDEN', 0, C.plinth + 1.0, { yaw: 0, h: 0.9, y: 0.3, post: false, maxW: 6, style: { bg: '#2a120a', fg: '#ffd080', border: '#ff7a2a' }, glow: '#ff7a2a' });
  api.sign('FIRE GARDEN', 0, -C.plinth - 1.0, { yaw: Math.PI, h: 0.9, y: 0.3, post: false, maxW: 6, style: { bg: '#2a120a', fg: '#ffd080', border: '#ff7a2a' }, glow: '#ff7a2a' });
  api.light(0, 0, 48, '#ff6a2a', 0.5); api.light(0, 0, 24, '#ffd0a0', 0.3);
  E.art.push({ x: 0, z: 0, r: C.plinth + 1.2 });
  // ---- the fire-flower beds (the flowers have no collider: you drive through the bed) ----
  E.beds = [];
  for (let i = 0; i < C.bedN; i++) {
    const a = fgnGapA(i), [bx, bz] = fgnAng(a, C.bedR), fl = [];
    for (let j = 0; j < 9; j++) { const fa = j / 9 * TAU + i, fr = j === 0 ? 0 : (j % 2 ? 4.2 : 7.2), x = bx + Math.sin(fa) * fr, z = bz + Math.cos(fa) * fr; fl.push([x, z]); CartKit.put(E, 'fdy_flower', x, z, rng() * TAU, ['#e8905a', '#ffb070', '#d06a3a', '#f0c090'][j % 4], { scale: 1.2 + rng() * 0.5, noCol: true, noLights: j % 3 !== 0 }); }
    E.beds.push({ i, x: bx, z: bz, fl }); api.light(bx, bz, 14, '#ff8a3a', 0.45);
  }
  // ---- the copper pipe walls with gaps, and fire pits in front of each ----
  const wall = (x, z, yaw, col) => { CartKit.put(E, 'fgn_pipewall', x, z, yaw, col, { y: 0, noLights: true }); E.art.push({ x, z, r: 3.1 }); };
  for (let i = 0; i < C.wallN; i++) {
    const a0 = fgnWallA(i), n = 10;
    for (let j = 0; j < n; j++) { const a = a0 + (j / (n - 1) - 0.5) * 2 * C.wallSpan, [x, z] = fgnAng(a, C.wallR); wall(x, z, a + Math.PI, j % 3 ? '#d07a40' : '#e8a060'); }
    { const [lx, lz] = fgnAng(a0, C.wallR - 9); api.light(lx, lz, 20, '#ff8a3a', 0.4); }
  }
  E.pits = []; for (let i = 0; i < C.wallN; i++) { const [x, z] = fgnAng(fgnWallA(i), C.pitR); CartScene.mesh(api, x, z, 0, fdyPit, { hi: true, noAO: true }); api.fire(x, 0.3, z, 0.9, { hazard: false }); E.pits.push([x, z]); E.art.push({ x, z, r: 2.6 }); }
  // ---- cover on the outer ring: short pipe walls, kickers, slag mounds ----
  for (let i = 0; i < C.wallN; i++) { const b = fgnGapA(i) + 0.3; { const [x, z] = fgnAng(b, 152); wall(x, z, b + 0.7, '#d07a40'); const [x2, z2] = fgnAng(b + 0.05, 159); wall(x2, z2, b + 2.3, '#e8a060'); } }
  for (let i = 0; i < 4; i++) { const a = fgnGapA((i * 1.5) | 0) + 0.85 + i * 0.1, [x, z] = fgnAng(a, 140); T.add(CartFeat.ramp(x, z, a + Math.PI / 2 * (i % 2 ? 1 : -1), 6, 7, 2.0, { col: '#4a3430', stripe: i % 2 ? '#ff7a2a' : '#ffc070' })); }
  for (const [a, r] of [[0.9, 168], [3.0, 166], [5.2, 170]]) T.add(CartFeat.mound(Math.sin(a) * r, Math.cos(a) * r, 13, 2.6, { col: '#3a2a26' }));
  // ---- the fence, furnaces and smokestacks beyond it, crowds and firespinners, searchlights ----
  for (let i = 0; i < 48; i++) { const a = E.walls[i], b = E.walls[(i + 1) % 48], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 7), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]); for (let j = 0; j < n; j++) { const u = (j + 0.5) / n, x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u), c = (Math.floor((i * n + j) / 2) % 3) === 2 ? '#3a302c' : (Math.floor((i * n + j) / 2) % 2 ? '#ff6a2a' : '#c8743a'); CartDecor.put(E, 'rail', x, z, yaw, c, { y: 0, noLights: true }); if (j % 2 === 0) api.glow(x, 0.98, z, 0.9, c); } }
  for (let i = 0; i < 8; i++) { const a = (i + 0.25) / 8 * TAU, [x, z] = fgnAng(a, C.R + 16); CartScene.mesh(api, x, z, a + Math.PI, fdyFurnace, { hi: false }); api.light(x * 0.94, z * 0.94, 14, '#ff6a1a', 0.5); }
  for (let i = 0; i < 10; i++) { const a = (i + 0.7) / 10 * TAU, [x, z] = fgnAng(a, C.R + 34 + (i % 3) * 14); CartKit.put(E, 'fdy_stack', x, z, 0, '#c8743a', { scale: 1 + (i % 3) * 0.25 }); }
  for (const a of [0.55, 2.65, 4.75]) { const [x, z] = fgnAng(a, C.R + 12); E.spots.push(...CartScene.bleachers(api, x, z, a + Math.PI, 22, 4, rng)); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 1.3, [x, z] = fgnAng(a, C.R + 6); E.heroes.push({ type: 'firespinner', x, z, yaw: a + Math.PI, anim: 'firespin' }); }
  E.beams = []; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4, [x, z] = fgnAng(a, C.R + 42); E.beams.push({ kind: 'search', x, y: 1, z, c: [1, 0.55, 0.25], ph: i * 1.7, sp: 0.3 + i * 0.07, len: 160, w: 7, a: 0.18 }); }
  { const R0 = 330, n = 36; for (let i = 0; i < n; i++) { const a = i / n * TAU + rng() * 0.05, r = R0 + rng() * 90; api.instance('cd_skyline', Math.sin(a) * r, Math.cos(a) * r, { y: 0, yaw: a + Math.PI, scale: 0.8 + rng() * 0.6, tint: cartTintOf(['#c8a898', '#b89888', '#d0b0a0'][i % 3], 0.7), noCol: true }); } }
  // ---- royale spots: gift boxes, repair kits, spawns, the storm's end points ----
  for (let i = 0; i < C.wallN; i++) { E.gifts.push({ x: fgnAng(fgnWallA(i), 44)[0], z: fgnAng(fgnWallA(i), 44)[1] }); const [x, z] = fgnAng(fgnGapA(i), 104); E.gifts.push({ x, z }); const [x2, z2] = fgnAng(fgnWallA(i) + 0.3, 150); E.gifts.push({ x: x2, z: z2 }); }
  const repairs = []; for (let i = 0; i < C.wallN; i++) repairs.push(fgnAng(fgnGapA(i) - 0.22, 140)); repairs.push(fgnAng(Math.PI / 2, 46), fgnAng(-Math.PI / 2, 46));
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, [x, z] = fgnAng(a, 146); E.spawn.push({ x, z, yaw: a + Math.PI / 2 }); }
  for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 35 + rng() * 130; E.orbSpots.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.zones = [{ x: 0, z: 0, r: 10, name: 'THE COPPER KRAKEN' }]; E.flagSpots = [{ x: 0, z: 60 }]; E.captures = [{ x: 0, z: -90, r: 9 }];
  E.royale = {
    R: C.R - 4, x: 0, z: 0, ends: [0, 1, 2, 3, 4, 5].map(i => fgnAng(fgnWallA(i) + 0.5, 84)), repairs, storm: { name: 'SMOKE STORM', col: '#d08a5a' },
    avoid: [[0, 0, C.plinth + 3]],   // roaming AI keep off the kraken's plinth
    // a straight line that crosses the pipe-wall ring outside a gap is sent through the nearest gap
    route(x0, z0, tx, tz, G) {
      const r0 = Math.hypot(x0, z0), r1 = Math.hypot(tx, tz), W = C.wallR;
      if ((r0 - W) * (r1 - W) >= 0 || Math.abs(r0 - W) < 2) return false;
      const u = (W - r0) / (r1 - r0), cx = lerp(x0, tx, u), cz = lerp(z0, tz, u), a = Math.atan2(cx, cz);
      let best = 0, bd = 9; for (let i = 0; i < C.wallN; i++) { const d = Math.abs(cartWrap(a - fgnWallA(i))); if (d < C.wallSpan + 0.06 && d < bd) { bd = d; best = i; } }
      if (bd === 9) return false;
      const w = fgnWallA(best), g = cartWrap(a - w) > 0 ? w + TAU / C.wallN / 2 : w - TAU / C.wallN / 2, side = r0 < W ? -6 : 6;
      const nearGap = Math.hypot(x0 - Math.sin(g) * W, z0 - Math.cos(g) * W) < 11;
      const rr = nearGap ? W - side * 1.5 : W + side; G[0] = Math.sin(g) * rr; G[1] = Math.cos(g) * rr; return true;
    }
  };
  return this.finish(E);
};

/* ---------------- the arena's enemies: the kraken's arms, the beds, the fire whirls ---------------- */
CART_ARENA_RULES.firegarden = {
  music: 'kart4',
  onLoad(s) {
    const E = s.E, C = CART_FGN;
    const D = s.fgn = { t: 0, next: 5, cyc: 0, arms: [], beds: [], whirls: [], goals: [], groups: [] };
    for (const q of E.arms) D.arms.push({ i: q.i, a: q.a, x: q.x, z: q.z, dx: Math.sin(q.a), dz: Math.cos(q.a), st: 'idle', t: 0, mask: 0, len: 0 });
    E.beds.forEach((b, i) => D.beds.push({ i, x: b.x, z: b.z, fl: b.fl, off: i * C.bloom.period / C.bedN * 1.0 + (i % 2) * 0.9, warn: 0, on: false, mask: 0 }));
    const G = new BurnsGroup(Math.min(64, BurnsGL.maxBones || 32)); D.groups.push(G);
    for (let i = 0; i < C.whirl.n; i++) D.whirls.push({ i, st: 'rest', t: 0, wait: 7 + i * 5, x: 0, z: 0, vx: 0, vz: 0, tx: 0, tz: 0, retT: 0, spin: 0, grow: 0, cool: new Float32Array(16), o: G.add(m => FdyMesh.funnel(m), { visible: false }) });
    G.finish();
  },
  onUpdate(s, dt, racing) {
    const D = s.fgn, C = CART_FGN; if (!D) return;
    const live = racing && s.state === 'race' && !(s.obj && s.obj.ended);
    for (const w of D.whirls) { w.spin += dt * (w.st === 'roam' ? 9 : 2); for (let i = 0; i < 16; i++) if (w.cool[i] > 0) w.cool[i] -= dt; }
    if (!live) { D.t += dt * 0.25; return; }
    D.t += dt;
    const P = s.player;
    // ---- the kraken: every ~2.7 s an arm turns on the car nearest its slice: warn 1.3 s, then 1 s of flame ----
    let busy = 0; for (const a of D.arms) if (a.st !== 'idle') busy++;
    D.next -= dt;
    if (D.next <= 0 && busy < C.arm.max && s.raceT > 4) {
      D.next = C.arm.every * (0.85 + s.rng() * 0.3);
      let best = null, bs = 1e9;
      for (const k of s.karts) { if (k.out || k.hidden) continue; const d = Math.hypot(k.x, k.z); if (d > C.arm.len + C.tipR - 4) continue; const ka = Math.atan2(k.x, k.z); for (const a of D.arms) { if (a.st !== 'idle') continue; const sc = Math.abs(cartWrap(ka - a.a)) + (k.player ? -0.1 : 0) + s.rng() * 0.15; if (sc < bs) { bs = sc; best = a; } } }
      if (!best || bs > 0.7) { for (let j = 0; j < C.armN; j++) { const a = D.arms[(D.cyc * 3 + j) % C.armN]; if (a.st === 'idle') { best = a; break; } } D.cyc++; }
      if (best) { best.st = 'warn'; best.t = 0; if (P && !P.out && fgnInCone(best, P.x, P.z, 4)) s.banner('KRAKEN FIRE!', '#ffb02a', 1.1, 'get out of the glowing slice', true); }
    }
    for (const a of D.arms) {
      if (a.st === 'idle') continue;
      a.t += dt;
      if (a.st === 'warn') { if (a.t >= C.arm.warn) { a.st = 'fire'; a.t = 0; a.mask = 0; const near = P ? Math.hypot(P.x - a.x, P.z - a.z) : 999; Sound.play('flame', { vol: near < 50 ? 0.9 : 0.25, pitch: 0.7 }); if (near < 30) s.shakeIt(0.35); } }
      else {
        a.len = C.arm.len * Math.min(1, a.t / 0.2);
        for (const k of s.karts) { if (k.out || (a.mask & (1 << k.slot)) || k.y > 4) continue; if (!fgnInCone(a, k.x, k.z, 1.0, a.len)) continue; a.mask |= 1 << k.slot; if (s.hit(k, 'spin', null, { item: 'fgn_arm', dur: 1.0, banner: 'KRAKEN FIRE!' })) { k.smokeT = Math.max(k.smokeT || 0, 1.4); if (s.fx) { s.fx.burst(k.x, k.y + 1, k.z, 'spark', 10, '#ffb040'); s.fx.fire(k.x, k.y + 0.6, k.z, 1.3); } } }
        if (a.t >= C.arm.fire) { a.st = 'idle'; a.t = 0; a.len = 0; }
      }
    }
    // ---- the beds: every 11 s each (staggered), warn 1.5 s, then the bed bursts into flame for 1.1 s ----
    for (const b of D.beds) {
      const ph = ((D.t + b.off) % C.bloom.period + C.bloom.period) % C.bloom.period, on = ph < C.bloom.burst && s.raceT > 4;
      b.warn = ph >= C.bloom.period - C.bloom.warn ? (ph - (C.bloom.period - C.bloom.warn)) / C.bloom.warn : 0;
      if (b.warn > 0 && !b.warned) { b.warned = true; if (P && !P.out && Math.hypot(P.x - b.x, P.z - b.z) < C.bed + 2) s.banner('FIRE BLOOM!', '#ffb02a', 1.1, 'drive out of the ring', true); }
      if (on && !b.on) { b.mask = 0; b.warned = false; const near = P ? Math.hypot(P.x - b.x, P.z - b.z) : 999; Sound.play('flame', { vol: near < 50 ? 0.8 : 0.2, pitch: 1.1 }); Sound.play('cartBoom', { vol: near < 40 ? 0.4 : 0.1, pitch: 1.4 }); }
      b.on = on;
      if (on) for (const k of s.karts) { if (k.out || (b.mask & (1 << k.slot)) || k.y > 2.5) continue; const dx = k.x - b.x, dz = k.z - b.z, d = Math.hypot(dx, dz); if (d > C.bed + 0.4) continue; b.mask |= 1 << k.slot; if (s.hit(k, 'knock', null, { item: 'fgn_bloom', dx: dx / (d || 1), dz: dz / (d || 1), power: 12, banner: 'FIRE BLOOM!' })) { k.smokeT = Math.max(k.smokeT || 0, 1.2); if (s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'spark', 10, '#ffb040'); } }
    }
    // ---- fire whirls: spin up in a pit (1.5 s), roam ~13 s drifting toward cars nearby, fizzle, rest ----
    for (const w of D.whirls) {
      w.t += dt;
      if (w.st === 'rest') { w.wait -= dt; if (w.wait <= 0 && s.raceT > 6) { const E = s.E; let pi = (w.i * 2 + D.cyc + Math.floor(s.rng() * 3)) % E.pits.length; for (let j = 0; j < E.pits.length; j++) { const p = E.pits[(pi + j) % E.pits.length]; if (D.whirls.every(o => o === w || o.st === 'rest' || Math.hypot(o.x - p[0], o.z - p[1]) > 40)) { pi = (pi + j) % E.pits.length; break; } } w.x = E.pits[pi][0]; w.z = E.pits[pi][1]; w.st = 'warn'; w.t = 0; w.vx = w.vz = 0; } }
      else if (w.st === 'warn') { if (w.t >= C.whirl.warn) { w.st = 'roam'; w.t = 0; w.retT = 0; const r = Math.hypot(w.x, w.z) || 1; w.vx = -w.x / r * C.whirl.speed; w.vz = -w.z / r * C.whirl.speed; if (P && Math.hypot(P.x - w.x, P.z - w.z) < 45) { Sound.play('wind', { vol: 0.6, pitch: 1.3 }); s.banner('FIRE WHIRL!', '#ffb02a', 1.0, 'out-drive it', true); } } }
      else if (w.st === 'roam') {
        w.retT -= dt;
        if (w.retT <= 0) {
          w.retT = 3.5; let tk = null, bd = 40; for (const k of s.karts) { if (k.out || k.hidden || k.invT > 1) continue; const d = Math.hypot(k.x - w.x, k.z - w.z); if (d < bd) { bd = d; tk = k; } }
          if (tk && s.rng() < 0.55) { w.tx = tk.x; w.tz = tk.z; } else { const a = s.rng() * TAU, r = 35 + s.rng() * 110; w.tx = Math.sin(a) * r; w.tz = Math.cos(a) * r; }
        }
        const dx = w.tx - w.x, dz = w.tz - w.z, d = Math.hypot(dx, dz) || 1, e = 1 - Math.exp(-1.1 * dt);
        w.vx = lerp(w.vx, dx / d * C.whirl.speed, e); w.vz = lerp(w.vz, dz / d * C.whirl.speed, e); w.x += w.vx * dt; w.z += w.vz * dt;
        const r = Math.hypot(w.x, w.z); if (r < C.plinth + 5) { w.x *= (C.plinth + 5) / r; w.z *= (C.plinth + 5) / r; } if (r > C.R - 10) { w.x *= (C.R - 10) / r; w.z *= (C.R - 10) / r; w.retT = 0; }
        for (const k of s.karts) { if (k.out || w.cool[k.slot] > 0 || k.y > 5) continue; if (Math.hypot(k.x - w.x, k.z - w.z) < C.whirl.r) { w.cool[k.slot] = 2.5; if (s.hit(k, 'whirl', null, { item: 'fgn_whirl', vy: 8, dur: 1.4, banner: 'FIRE WHIRL!' })) { k.smokeT = Math.max(k.smokeT || 0, 1.4); if (s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'spark', 12, '#ffb040'); } } }
        if (s.fx && P && Math.hypot(P.x - w.x, P.z - w.z) < 80 && Math.random() < 0.7) s.fx.fire(w.x + (Math.random() - 0.5) * 2, 0.2, w.z + (Math.random() - 0.5) * 2, 1.4);
        if (w.t > C.whirl.life) { w.st = 'fade'; w.t = 0; }
      } else if (w.st === 'fade') { w.x += w.vx * dt * 0.5; w.z += w.vz * dt * 0.5; if (w.t > 1) { w.st = 'rest'; w.t = 0; w.wait = 4 + s.rng() * 4; } }
      w.grow = w.st === 'roam' ? Math.min(1, w.t * 2) : w.st === 'warn' ? w.t / C.whirl.warn * 0.5 : w.st === 'fade' ? Math.max(0, 1 - w.t) : 0;
    }
  },
  // the AI sees the danger (by skill): get out of a warning slice or bed, keep away from a whirl
  aiGoal(s, k) {
    const D = s.fgn, C = CART_FGN; if (!D || !k.ai || s.state !== 'race') return null;
    if (((k.slot * 13 + Math.floor(s.time * 1.7)) % 10) / 10 > 0.3 + k.ai.skill * 0.6) return null;
    const o = D.goals[k.slot] || (D.goals[k.slot] = { goal: [0, 0], prey: null }), G = o.goal;
    for (const w of D.whirls) { if (w.st !== 'roam' && w.st !== 'warn') continue; const dx = k.x - w.x, dz = k.z - w.z, d = Math.hypot(dx, dz) || 1; if (d < 15) { G[0] = k.x + dx / d * 26 - dz / d * 8; G[1] = k.z + dz / d * 26 + dx / d * 8; return o; } }
    for (const b of D.beds) { if (b.warn <= 0 && !b.on) continue; const dx = k.x - b.x, dz = k.z - b.z, d = Math.hypot(dx, dz) || 1; if (d < C.bed + 3) { G[0] = b.x + dx / d * (C.bed + 14); G[1] = b.z + dz / d * (C.bed + 14); return o; } }
    for (const a of D.arms) { if (a.st === 'idle' || !fgnInCone(a, k.x, k.z, 3.5)) continue; const rx = k.x - a.x, rz = k.z - a.z, sd = rx * a.dz - rz * a.dx > 0 ? 1 : -1; G[0] = k.x + a.dz * sd * 22 + a.dx * 4; G[1] = k.z - a.dx * sd * 22 + a.dz * 4; return o; }
    return null;
  },
  render(s, R) {
    const D = s.fgn; if (!D) return;
    for (const w of D.whirls) { const o = w.o; o.visible = w.grow > 0.02; if (!o.visible) continue; o.x = w.x; o.z = w.z; o.y = s.terrain.height(w.x, w.z); o.yaw = w.spin; o.roll = Math.sin(s.time * 3 + w.i) * 0.06; o.pitch = 0; o.scale = 0.4 + w.grow * 0.85 + Math.sin(s.time * 11 + w.i) * 0.03; }
    for (const G of D.groups) { G.pose(s.cam); R.skin(G.geo, G.bones, G.objs.length, null, 0, 0.5); }
  },
  draw(s, R, Sp, t) {
    const D = s.fgn, C = CART_FGN; if (!D) return;
    const cam = s.cam;
    // the kraken's arms: a glowing tip and a flashing slice while warning; a tongue of flame when it fires
    for (const a of D.arms) {
      R.bbs.bb(a.x, C.tipY + 0.6, a.z, 2.2 + (a.st === 'warn' ? a.t * 3 : 0), 2.2 + (a.st === 'warn' ? a.t * 3 : 0), Sp.glow, C.orange, a.st === 'idle' ? 0.35 : 0.9, true);
      if (a.st === 'idle') continue;
      const yaw = a.a, th = Math.tan(C.arm.half);
      if (a.st === 'warn') {
        const u = a.t / C.arm.warn, fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 18));
        for (let r = 4; r < C.arm.len; r += 4) { const w = 2 * r * th + 1.5; R.flat.flat(a.x + a.dx * r, 0.1, a.z + a.dz * r, w, 4.2, yaw, Sp.square, C.amber, (0.2 + 0.25 * u) * fl, true); }
        for (const sd of [-1, 1]) { const ea = yaw + sd * C.arm.half; R.flat.flat(a.x + Math.sin(ea) * C.arm.len / 2, 0.11, a.z + Math.cos(ea) * C.arm.len / 2, 0.5, C.arm.len, ea, Sp.square, C.yellow, 0.85 * fl, true); }
        if (s.fx && Math.random() < 0.6) s.fx.spark(a.x, C.tipY + 0.5, a.z, 1, '#ffb040', 3);
      } else {
        const len = a.len, fl = 0.9 + 0.1 * Math.sin(t * 40);
        R.bbs.streak(a.x + a.dx * len * 0.5, 2.2, a.z + a.dz * len * 0.5, a.dx, -0.06, a.dz, len, 1.4, Sp.streak, C.cream, 0.85);
        for (let j = 0; j <= 12; j++) { const u = j / 12, r = u * len, w = (1.8 + r * th * 2.2) * fl, jt = Math.sin(t * 29 + j * 1.9) * 0.4; R.bbs.bb(a.x + a.dx * r + a.dz * jt, lerp(C.tipY, 1.4, u), a.z + a.dz * r - a.dx * jt, w, w * 1.1, Sp.flame, u < 0.25 ? C.yellow : C.orange, 0.95, true); }
        R.flat.flat(a.x + a.dx * len * 0.5, 0.12, a.z + a.dz * len * 0.5, len * th * 2 + 3, len, yaw, Sp.glow, C.orange, 0.55, true);
        if (s.fx && Math.random() < 0.8) s.fx.fire(a.x + a.dx * len * (0.3 + Math.random() * 0.7), 0.8, a.z + a.dz * len * (0.3 + Math.random() * 0.7), 1.6);
      }
    }
    // the beds: a blinking amber ring and brightening blossoms while warning; columns of flame when they burst
    for (const b of D.beds) {
      if ((b.x - cam.x) ** 2 + (b.z - cam.z) ** 2 > 230 * 230) continue;
      if (b.warn > 0) {
        const fl = 0.5 + 0.5 * Math.sin(t * (12 + b.warn * 14));
        R.flat.flat(b.x, 0.12, b.z, C.bed * 2.2, C.bed * 2.2, 0, Sp.ring, C.amber, 0.5 + 0.45 * fl, true);
        R.flat.flat(b.x, 0.1, b.z, C.bed * 2, C.bed * 2, 0, Sp.glow, C.amber, 0.25 * b.warn * fl, true);
        for (const f of b.fl) R.bbs.bb(f[0], 4.6, f[1], 1.2 + b.warn * 2, 1.2 + b.warn * 2, Sp.glow, C.yellow, 0.6 + 0.4 * fl, true);
      }
      if (b.on) {
        R.flat.flat(b.x, 0.12, b.z, C.bed * 2.3, C.bed * 2.3, t, Sp.glow, C.hot, 0.8, true);
        for (let j = 0; j < b.fl.length; j++) { const f = b.fl[j]; for (let h = 0; h < 3; h++) { const sz = 3.2 - h * 0.6 + Math.sin(t * 23 + j + h) * 0.3; R.bbs.bb(f[0], 1.2 + h * 1.9, f[1], sz, sz * 1.25, Sp.flame, h ? C.orange : C.yellow, 0.95, true); } }
        if (s.fx && Math.random() < 0.9) { const f = b.fl[Math.floor(Math.random() * b.fl.length)]; s.fx.fire(f[0], 0.3, f[1], 1.8); }
      } else if (b.warn <= 0) R.flat.flat(b.x, 0.1, b.z, C.bed * 1.6, C.bed * 1.6, 0, Sp.glow, C.orange, 0.12, true);
    }
    // the whirls: the pit's swirl while spinning up; a ground swirl and a spiral of flame while roaming
    for (const w of D.whirls) {
      if (w.st === 'rest' || (w.x - cam.x) ** 2 + (w.z - cam.z) ** 2 > 230 * 230) continue;
      if (w.st === 'warn') { const u = w.t / C.whirl.warn, fl = 0.6 + 0.4 * Math.sin(t * 18); R.flat.flat(w.x, 0.13, w.z, 6 + u * 6, 6 + u * 6, -w.spin, Sp.swirl || Sp.ring, C.orange, 0.9 * fl, true); R.flat.flat(w.x, 0.12, w.z, 12, 12, 0, Sp.ring, C.amber, 0.8 * u * fl, true); R.bbs.bb(w.x, 9, w.z, 2.6, 2.6, Sp.warn || Sp.glow, C.amber, fl, true); }
      const g = w.grow; if (g <= 0.05) continue;
      R.flat.flat(w.x, 0.14, w.z, 10 * g, 10 * g, -w.spin * 1.3, Sp.swirl || Sp.ring, C.orange, 0.95, true);
      R.flat.flat(w.x, 0.12, w.z, 15 * g, 15 * g, 0, Sp.glow, C.hot, 0.5, true);
      for (let j = 0; j < 14; j++) { const u = j / 13, h = u * 9.5 * g, an = w.spin * 1.2 + j * 0.95, r = (0.5 + u * 2.7) * g; R.bbs.bb(w.x + Math.sin(an) * r, h + 0.4, w.z + Math.cos(an) * r, (1.5 + u * 2) * g, (1.9 + u * 2.2) * g, Sp.flame, u < 0.35 ? C.yellow : C.orange, 0.9, true); }
      R.bbs.bb(w.x, 5 * g, w.z, 11 * g, 13 * g, Sp.glow, C.orange, 0.35, true);
    }
  },
  lights(s, add) {
    const D = s.fgn, C = CART_FGN; if (!D) return;
    for (const a of D.arms) if (a.st === 'fire') add(a.x + a.dx * a.len * 0.5, 2, a.z + a.dz * a.len * 0.5, 20, C.orange, 1.8, 2); else if (a.st === 'warn') add(a.x, C.tipY, a.z, 10, C.amber, 1.2, 1.5);
    for (const b of D.beds) if (b.on) add(b.x, 2.5, b.z, 20, C.orange, 1.8, 2); else if (b.warn > 0) add(b.x, 2, b.z, 14, C.amber, 1.0, 1.5);
    for (const w of D.whirls) if (w.grow > 0.1) add(w.x, 3, w.z, 18, C.orange, 1.8 * w.grow, 2);
  },
  radar(s, ctx, P, sc) {
    const q = CART_FGN_T.p, C = CART_FGN, D = s.fgn;
    P(0, 0, q); ctx.fillStyle = 'rgba(200,110,50,0.75)'; ctx.beginPath(); ctx.arc(q.x, q.y, C.plinth * sc, 0, TAU); ctx.fill();
    if (!D) return;
    for (const b of D.beds) { P(b.x, b.z, q); ctx.strokeStyle = b.on ? 'rgba(255,90,20,0.95)' : b.warn > 0 ? 'rgba(255,180,40,0.9)' : 'rgba(255,140,60,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, C.bed * sc, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,120,30,0.95)'; for (const w of D.whirls) { if (w.grow <= 0.1) continue; P(w.x, w.z, q); ctx.beginPath(); ctx.arc(q.x, q.y, 3, 0, TAU); ctx.fill(); }
  }
};
// is (x, z) inside arm a's flame slice (padded by m metres; len = reach, default the full tongue)?
function fgnInCone(a, x, z, m, len) {
  const C = CART_FGN, rx = x - a.x, rz = z - a.z, along = rx * a.dx + rz * a.dz; if (along < -1 || along > (len === undefined ? C.arm.len : len) + 1) return false;
  return Math.abs(rx * a.dz - rz * a.dx) < Math.max(0, along) * Math.tan(C.arm.half) + m;
}

/* ---------------- the registry ---------------- */
CART_ARENAS.push({
  id: 'firegarden', name: 'FIRE GARDEN', sub: 'Battle royale: a copper kraken, fire-flower beds, roaming fire whirls', objectives: ['royale'], royale: true, levelCar: 'octo',
  col: '#ff6a2a', tod: 'night', blurb: 'Calamari Inferno\'s garden. Dodge the kraken\'s fire, the blooming beds and the fire whirls. Last car running wins.'
});
CART_ROYALE_ARENAS.octo = 'firegarden';
CART_ARENA_ICONS.firegarden = (ctx, s, t, col) => {
  // a copper octopus head with curling arms and a flame on top
  ctx.save(); ctx.fillStyle = '#1a0e0a'; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#d07a40'; ctx.lineCap = 'round'; ctx.lineWidth = s * 0.09;
  for (let i = 0; i < 6; i++) { const a = Math.PI * 0.15 + i / 5 * Math.PI * 0.7, x0 = Math.cos(a) * s * 0.18, y0 = s * 0.12 + Math.sin(a) * s * 0.08, x1 = Math.cos(a) * s * 0.55, y1 = s * 0.42 + Math.sin(t * 3 + i) * s * 0.04; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x1 * 0.8, y1 * 0.6, x1, y1); ctx.stroke(); }
  ctx.fillStyle = '#d07a40'; ctx.beginPath(); ctx.ellipse(0, -s * 0.05, s * 0.3, s * 0.34, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff4e0'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * s * 0.12, s * 0.02, s * 0.08, 0, TAU); ctx.fill(); } ctx.fillStyle = '#ff6a1a'; for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * s * 0.12, s * 0.03, s * 0.04, 0, TAU); ctx.fill(); }
  const f = 1 + Math.sin(t * 9) * 0.08; ctx.fillStyle = '#ffb040'; ctx.beginPath(); ctx.moveTo(-s * 0.12, -s * 0.36); ctx.quadraticCurveTo(-s * 0.14, -s * 0.6 * f, 0, -s * 0.72 * f); ctx.quadraticCurveTo(s * 0.14, -s * 0.6 * f, s * 0.12, -s * 0.36); ctx.fill();
  ctx.fillStyle = '#fff0a0'; ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 0.38); ctx.quadraticCurveTo(0, -s * 0.55 * f, s * 0.05, -s * 0.38); ctx.fill();
  ctx.restore();
};
