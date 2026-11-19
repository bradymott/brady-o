/* ============================================================
   ART CART — royale arena: THE GREENHOUSE (id 'greenhouse', Turbo Escargot's arena; level agent "snail", Nov 19 2026)
   A round Victorian glasshouse seen at snail size: a ring of glass panes and white iron ribs curving up overhead,
   gravel and terracotta-tile paths on the floor, potting benches and towers of flowerpots for cover, a giant palm in
   a brick planter in the middle. Its hazards (all telegraphed, all readable on a phone):
     · VENUS FLYTRAPS: five giant flytraps lie OPEN on the floor (a pink pad, the upper jaw raised). Drive onto a pad
       and the trap ARMS: its jaw quivers and a red ring flashes (1.1 s), then it SNAPS shut on everyone still on
       the pad: 13 HP and a shove. A shut trap is solid while it chews, then slowly reopens. Get off the pad.
     · THE SALT SHAKER: a giant shaker flies over a car (a white target follows it, 1.5 s), locks on (the target turns
       red, salt starts to fall, 1.0 s), then pours: 9 HP and a slip; the salt pile stays a moment (slips you again).
     · THE PEPPER POT: same flight, but pepper: everyone under it SNEEZES (spins out, 9 HP) and a pepper cloud hangs.
   TURBO ESCARGOT's SHELL BOUNCE is in everyone's gift boxes here (arena levelCar). Registers itself; globals are
   prefixed GHS_, state lives on s.ghs. Start it: BRADY_CART.debug.start({ mode: 'royale', arena: 'greenhouse' }).
   ============================================================ */
const GHS = {
  R: 178, wallH: 6, ribH: 44, palm: [0, 0], bedR: 20,
  trap: { n: 5, r: 9.5, ring: 96, arm: 1.1, snap: 0.22, chew: 3.4, open: 1.2 },
  shake: { first: 15, period: 7.5, fly: 1.5, lock: 1.0, pour: 0.35, back: 1.4, r: 7, pile: 3.2, cloud: 2.4, y: 15 },
  C: { white: [1, 1, 1], black: [0, 0, 0], red: [1, 0.25, 0.3], hot: [1, 0.35, 0.45], warn: [1, 0.66, 0.2], green: [0.4, 0.95, 0.4], pink: [1, 0.45, 0.6], salt: [0.95, 0.97, 1], pepper: [0.35, 0.3, 0.28], dust: [0.75, 0.65, 0.55] }
};
const GHS_T = { p: [0, 0] };

/* ---------------- the world ---------------- */
CartWorlds.arena_greenhouse = function (A, night) {
  const G = GHS, R = G.R, E = this.base(2119, [-260, -260, 260, 260], '#b8a888', 0.02);
  const sky = Object.assign(CART_SKIES.day(), { zen: '#4aa4f0', hor: '#fff2d0', sky: '#a8d8ff', fog: '#d6ecd2', fogD: 0.0016, haze: 0.2, clouds: 0.7, key: '#fff2d8', keyK: 1.05, gnd: '#b8d090' });
  Object.assign(E, { id: 'greenhouse', arena: A, sky, tod: 'day', music: 'kart2', night: false, R });
  E.art = E.art || [];
  const api = E.api, T = E.terrain, rng = mulberry32(2119);
  const ang = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
  const trapA = i => (i + 0.5) / G.trap.n * TAU + 0.15;
  // ---- the floor: raked gravel, a ring path of terracotta tiles, spoke paths, soil beds, the lawn outside ----
  api.paint((ctx, P, sc) => {
    const c0 = P(0, 0);
    // outside: lawn with mower stripes
    for (let k = -30; k < 30; k++) { const q0 = P(-300 + k * 22, -300), q1 = P(-300 + k * 22 + 600, 300); ctx.strokeStyle = k % 2 ? 'rgba(110,170,70,0.9)' : 'rgba(90,150,60,0.9)'; ctx.lineWidth = 11 * sc; ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); }
    // inside: pale gravel with speckles
    ctx.fillStyle = 'rgba(214,200,170,1)'; ctx.beginPath(); ctx.arc(c0[0], c0[1], (R + 1) * sc, 0, TAU); ctx.fill();
    for (let i = 0; i < 2200; i++) { const a = rng() * TAU, r = Math.sqrt(rng()) * R, q = P(...ang(a, r)); ctx.fillStyle = i % 3 ? 'rgba(160,145,120,0.35)' : 'rgba(255,250,235,0.5)'; ctx.fillRect(q[0], q[1], 0.7 * sc, 0.7 * sc); }
    // the ring path of terracotta tiles and the spoke paths
    for (let i = 0; i < 120; i++) for (let j = 0; j < 3; j++) { const a = i / 120 * TAU, r = 118 + j * 5, q = P(...ang(a + (j % 2) * 0.026, r)); ctx.fillStyle = (i + j) % 3 ? 'rgba(200,110,70,0.75)' : 'rgba(180,95,60,0.75)'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(-a); ctx.fillRect(-2.9 * sc, -2.3 * sc, 5.6 * sc, 4.4 * sc); ctx.restore(); }
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; for (let r = 28; r < 175; r += 5) { const q = P(...ang(a, r)); ctx.fillStyle = (r / 5) % 2 ? 'rgba(200,110,70,0.7)' : 'rgba(225,135,90,0.7)'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(-a); ctx.fillRect(-3 * sc, -2.3 * sc, 6 * sc, 4.6 * sc); ctx.restore(); } }
    // soil round the central planter, mossy soil under the flytraps (a pink glow where the pad lies)
    { ctx.fillStyle = 'rgba(100,70,45,0.85)'; ctx.beginPath(); ctx.arc(c0[0], c0[1], (G.bedR + 6) * sc, 0, TAU); ctx.fill(); }
    for (let i = 0; i < G.trap.n; i++) { const q = P(...ang(trapA(i), G.trap.ring)); ctx.fillStyle = 'rgba(90,120,60,0.85)'; ctx.beginPath(); ctx.arc(q[0], q[1], (G.trap.r + 5) * sc, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,120,150,0.45)'; ctx.lineWidth = 1.2 * sc; ctx.beginPath(); ctx.arc(q[0], q[1], (G.trap.r + 0.5) * sc, 0, TAU); ctx.stroke(); }
    // the shadows of the ribs on the floor (spokes of darker gravel near the wall)
    for (let i = 0; i < 48; i++) { const a = i / 48 * TAU, q0 = P(...ang(a, R)), q1 = P(...ang(a + 0.12, R - 60)); ctx.strokeStyle = 'rgba(120,105,80,0.18)'; ctx.lineWidth = 1.4 * sc; ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); }
  });
  // ---- the glasshouse: a low wall of glass panes, white iron ribs curving up and in, rings tying them ----
  CartScene.mesh(api, 0, 0, 0, m => {
    m.color('#f4f2ea').shine(1); m.lathe([[R + 0.4, 0], [R + 0.4, 1.4], [R + 2.2, 1.4], [R + 2.2, 0]], { seg: 120 });
    m.color('#bfe8e0', 0.06).shine(4); m.lathe([[R + 1.0, 1.4], [R + 1.0, G.wallH + 4], [R + 1.4, G.wallH + 4], [R + 1.4, 1.4]], { seg: 120 }); m.emissive(0);
    m.color('#ffffff').shine(2);
    const rib = h => R + 1.2 - Math.pow(h / G.ribH, 2) * 42;
    for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, sa = Math.sin(a), ca = Math.cos(a); let px = sa * (R + 1.2), pz = ca * (R + 1.2), py = 0; for (let j = 1; j <= 7; j++) { const h = j / 7 * G.ribH, r = rib(h), x = sa * r, z = ca * r; m.limb(px, py, pz, x, h, z, 0.42, 0.42, { seg: 6, ends: false }); px = x; py = h; pz = z; } }
    for (const h of [G.wallH + 4, 20, 33, G.ribH]) m.torus(0, h, 0, rib(h), 0.38, { seg: 120, tseg: 5 });
    m.shine(0);
    return { cols: [] };
  }, { hi: true, noAO: true });
  const poly = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; poly.push([Math.sin(a) * R, Math.cos(a) * R]); }
  E.walls = poly; CartDecor.protos(E);
  // ---- the middle: a round brick planter with a giant palm (central cover) ----
  CartScene.mesh(api, G.palm[0], G.palm[1], 0.4, m => {
    m.color('#c8643a').shine(0); m.lathe([[G.bedR, 0], [G.bedR, 3.2], [G.bedR + 0.8, 3.2], [G.bedR + 0.8, 4.0], [G.bedR - 1.2, 4.0], [G.bedR - 1.2, 3.4], [0.01, 3.4]], { seg: 48 });
    m.color('#ffffff'); m.torus(0, 3.6, 0, G.bedR - 0.2, 0.25, { seg: 48, tseg: 4 });
    m.color('#5a3a22'); m.disc(0, 3.45, 0, G.bedR - 1.1, 40);
    // the trunk: a ringed curve up to 38 m
    let px = 0, py = 3.4, pz = 0;
    for (let j = 1; j <= 10; j++) { const u = j / 10, x = Math.sin(u * 1.4) * 5, y = 3.4 + u * 36, z = u * u * 3; m.color(j % 2 ? '#a8805a' : '#8a6644').shine(1); m.limb(px, py, pz, x, y, z, 1.8 - u * 0.6, 1.75 - u * 0.6, { seg: 12, ends: j === 1 }); px = x; py = y; pz = z; }
    // fronds: long arching leaves of leaflets
    m.color('#3a9a3a').shine(2);
    for (let f = 0; f < 9; f++) { const a = f / 9 * TAU, L = 20 + (f % 3) * 3; let qx = px, qy = py, qz = pz; for (let j = 1; j <= 6; j++) { const u = j / 6, x = px + Math.sin(a) * L * u, z = pz + Math.cos(a) * L * u, y = py + 4 * u - 13 * u * u; m.color('#4a8a3a'); m.limb(qx, qy, qz, x, y, z, 0.3, 0.25, { seg: 5, ends: false }); m.color(j % 2 ? '#3aa040' : '#48b04a'); for (const sd of [-1, 1]) { m.push(); m.tf(x, y, z, a + sd * 1.1, 0.5, 0); m.ellipsoid(0, 0, 1.6, 0.5, 0.08, 2.4 - u, { seg: 6, rings: 3 }); m.pop(); } qx = x; qy = y; qz = z; } }
    m.color('#7a5a3a'); for (let i = 0; i < 6; i++) { const a = i * 1.1; m.ball(px + Math.sin(a) * 1.5, py - 1.6, pz + Math.cos(a) * 1.5, 0.9, { seg: 8, rings: 6 }); }
    m.shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: G.bedR + 0.8, y0: 0, y1: 4 }] };
  }, { hi: true });
  E.art.push({ x: G.palm[0], z: G.palm[1], r: G.bedR + 2 });
  // ---- the flytraps: the plant behind each pad (stem, spiky leaves); the pad (lower jaw) on the floor ----
  for (let i = 0; i < G.trap.n; i++) {
    const a = trapA(i), [x, z] = ang(a, G.trap.ring), yaw = a + Math.PI;   // local +z points at the middle: the hinge and stem sit on the wall side
    CartScene.mesh(api, x, z, yaw, ghsTrapBase, { hi: true });
  }
  // ---- potting benches (cover): long slatted tables of flowerpots and seed trays, round the inner ring ----
  for (let i = 0; i < 6; i++) {
    const a = (i + 0.5) / 6 * TAU + 0.5, [x, z] = ang(a, 58);
    CartScene.mesh(api, x, z, a + Math.PI / 2, ghsBench, { hi: true }); E.art.push({ x, z, r: 9 });
  }
  // ---- towers of flowerpots and big terracotta pots (cover out by the wall) ----
  for (let i = 0; i < 7; i++) {
    const a = (i + 0.2) / 7 * TAU, r = 150 + (i % 2) * 8, [x, z] = ang(a, r);
    CartScene.mesh(api, x, z, rng() * TAU, i % 2 ? ghsPotStack : ghsBigPot, { hi: true }); E.art.push({ x, z, r: 6.5 });
  }
  // a giant watering can and seed sacks (cover between the rings)
  { const [x, z] = ang(2.25, 128); CartScene.mesh(api, x, z, 1.2, m => { gdnWateringCan(m); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 6.3, y0: 0, y1: 12 }] }; }, { hi: true, scale: 0.9 }); E.art.push({ x, z, r: 7 }); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 1.05, [x, z] = ang(a, 128); if (Math.abs(cartWrap(a - 2.25)) < 0.3) continue; CartScene.mesh(api, x, z, a, ghsSacks, { hi: true }); E.art.push({ x, z, r: 6 }); }
  // kickers: mossy planks over upturned pots
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.95, [x, z] = ang(a, 140); T.add(CartFeat.ramp(x, z, a + Math.PI / 2 * (i % 2 ? 1 : -1), 7, 7, 2.1, { col: '#a8804a', stripe: '#5aa848' })); }
  api.sign('THE GREENHOUSE', 0, R - 3, { yaw: Math.PI, h: 1.6, y: 3.2, post: false, maxW: 10, style: { bg: '#ffffff', fg: '#2a8a3a', border: '#e8302a' } });
  api.sign('THE GREENHOUSE', 0, -R + 3, { yaw: 0, h: 1.6, y: 3.2, post: false, maxW: 10, style: { bg: '#ffffff', fg: '#2a8a3a', border: '#e8302a' } });
  // ---- outside the glass: sunflowers, a gnome or two, the fence; spectators on benches by the glass ----
  for (let i = 0; i < 10; i++) { const a = (i + 0.4) / 10 * TAU, [x, z] = ang(a, R + 22 + (i % 3) * 8); CartScene.mesh(api, x, z, a + Math.PI, m => gdnSunflower(m, 26 + (i % 3) * 5), { hi: false }); }
  for (const [a, col] of [[0.7, '#2a6ad8'], [3.3, '#8a4ad8'], [5.1, '#2a9a6a']]) { const [x, z] = ang(a, R + 10); CartScene.mesh(api, x, z, a + Math.PI, m => { gdnGnome(m, true, col, '#e8302a'); return { cols: [] }; }, { scale: 2.2 }); }
  CartScene.mesh(api, 0, 250, Math.PI, m => gdnFence(m, 640, 46), { noAO: true });
  CartScene.mesh(api, 250, 0, -Math.PI / 2, m => gdnFence(m, 640, 46), { noAO: true });
  for (const a of [1.2, 2.9, 4.4, 5.8]) { const [x, z] = ang(a, R + 8); E.spots.push(...CartScene.bleachers(api, x, z, a + Math.PI, 20, 3, rng)); }
  // ---- royale spots: gift boxes, repair kits, spawns, the storm's end points ----
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU + 0.5, 40); E.gifts.push({ x, z }); }
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU, 82); E.gifts.push({ x, z }); }
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU + 0.26, 132); E.gifts.push({ x, z }); }
  const repairs = []; for (let i = 0; i < 6; i++) repairs.push(ang(i / 6 * TAU + 0.78, 110)); repairs.push([30, -32], [-34, 30]);
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, [x, z] = ang(a, 144); E.spawn.push({ x, z, yaw: a + Math.PI / 2 }); }
  for (let i = 0; i < 44; i++) { const a = rng() * TAU, r = 30 + rng() * 135, [x, z] = ang(a, r); if (E.art.every(q => Math.hypot(q.x - x, q.z - z) > q.r + 2)) E.orbSpots.push({ x, z }); }
  E.zones = [{ x: 0, z: 0, r: 10, name: 'THE PALM' }]; E.flagSpots = [{ x: 0, z: 70 }]; E.captures = [{ x: 0, z: -90, r: 9 }];
  E.royale = { R: R - 4, x: 0, z: 0, ends: [[0, -75], [72, 30], [-72, 30], [55, -60], [-55, -60]], repairs, storm: { name: 'POLLEN STORM', col: '#ffe88a' }, avoid: [[G.palm[0], G.palm[1], G.bedR + 3]] };
  return this.finish(E);
};
// a flytrap's base: the pad (the lower jaw, flat on the floor: pink inside, green rim, little teeth), the stem it
// grows from at the back (local -z), spiky leaves round it. The upper jaw is a moving part hinged at z = -r
function ghsTrapBase(m) {
  const r = GHS.trap.r;
  m.color('#5aa040').shine(2); m.push(); m.tf(0, 0, 0, 0, 0, 0, 1, 1, 1); m.ellipsoid(0, 0.05, 0, r + 0.6, 0.35, r + 0.6, { seg: 32, rings: 6, phi1: Math.PI / 2 }); m.pop();
  m.color('#ff7a9a', 0.05).shine(3); m.disc(0, 0.38, 0, r - 0.2, 32); m.emissive(0);
  m.color('#e8506a'); for (let i = 0; i < 10; i++) { const a = i * 2.39996, f = Math.sqrt((i + 0.5) / 10) * (r - 1.5); m.ellipsoid(Math.sin(a) * f, 0.4, Math.cos(a) * f, 0.6, 0.06, 0.6, { seg: 8, rings: 3 }); }
  m.color('#fff4c8').shine(1); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; if (Math.cos(a) < -0.7) continue; m.limb(Math.sin(a) * (r + 0.2), 0.3, Math.cos(a) * (r + 0.2), Math.sin(a) * (r + 1.0), 0.55, Math.cos(a) * (r + 1.0), 0.16, 0.03, { seg: 4 }); }
  // the stem and the hinge at the back
  m.color('#4a9038').shine(1); m.limb(0, 0, -r - 3, 0, 1.6, -r - 0.6, 1.3, 1.0, { seg: 10 }); m.ball(0, 1.6, -r - 0.6, 1.1, { seg: 10, rings: 8 });
  // spiky leaves fanning out behind
  m.color('#5ab048').shine(1); for (let i = 0; i < 6; i++) { const a = Math.PI + (i - 2.5) * 0.42; m.push(); m.tf(Math.sin(a) * 6 + 0, 0.3, Math.cos(a) * 6 - r - 1, a, -0.25, 0); m.ellipsoid(0, 0, 0, 1.4, 0.15, 4.2, { seg: 10, rings: 4 }); m.pop(); }
  m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: -r - 1.5, r: 2.2, y0: 0, y1: 3 }] };
}
// a potting bench (long axis = local x): slatted top on legs, flowerpots, seed trays, a trowel
function ghsBench(m) {
  m.color('#a8804a').shine(0);
  for (const x of [-7.5, 7.5]) for (const z of [-2.2, 2.2]) m.box(x, 1.7, z, 0.6, 3.4, 0.6);
  for (let i = -3; i <= 3; i++) m.roundBox(0, 3.55, i * 0.72, 17, 0.3, 0.6, 0.1);
  m.color('#8a6a3a'); m.box(0, 1.0, 0, 16, 0.25, 4.6);
  m.color('#d8743a').shine(1);
  for (let i = 0; i < 5; i++) { const x = -6 + i * 3, zz = 0.4 * (i % 2 ? 1 : -1); m.push(); m.tf(x, 0, zz); m.lathe([[0.7, 3.7], [1.0, 5.1], [1.15, 5.15], [1.15, 5.5], [0.95, 5.5], [0.85, 5.2], [0.01, 5.2]], { seg: 14 }); m.color('#4aa040'); m.ball(0, 6.0, 0, 0.9, { seg: 8, rings: 6 }); m.ball(0.5, 6.4, 0.2, 0.6, { seg: 8, rings: 6 }); m.color('#d8743a'); m.pop(); }
  m.color('#3a3a3a').shine(1); m.roundBox(4, 3.85, -1.6, 4, 0.3, 1.4, 0.1); m.color('#5ab048'); for (let j = 0; j < 6; j++) m.limb(2.4 + j * 0.65, 3.95, -1.6, 2.4 + j * 0.65, 4.6, -1.4, 0.06, 0.02, { seg: 4 });
  m.color('#c8c8d0').shine(4); m.limb(-3, 3.8, -1.8, -0.8, 3.8, -1.4, 0.25, 0.08, { seg: 6 }); m.color('#e8302a').shine(2); m.limb(-3, 3.8, -1.8, -4.4, 3.8, -2.0, 0.22, 0.22, { seg: 6 });
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 8.4, hz: 2.6, y0: 0, y1: 5 }] };
}
// a tower of stacked flowerpots (tipped this way and that)
function ghsPotStack(m) {
  m.color('#d8743a').shine(1);
  for (let i = 0; i < 6; i++) { m.push(); m.tf(Math.sin(i * 1.7) * 0.4, i * 1.9, Math.cos(i * 2.3) * 0.4, i * 0.6, Math.sin(i) * 0.06, 0); m.lathe([[2.4, 0], [3.4, 2.6], [3.7, 2.7], [3.7, 3.4], [3.2, 3.4], [3.0, 2.8], [2.1, 0.3]], { seg: 20 }); m.pop(); }
  m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.8, y0: 0, y1: 14 }] };
}
// a big terracotta pot with a spiky agave
function ghsBigPot(m) {
  m.color('#c8643a').shine(1); m.lathe([[3.6, 0], [5.0, 6.5], [5.6, 6.7], [5.6, 8], [4.8, 8], [4.6, 7.2], [0.01, 7.2]], { seg: 24 });
  m.color('#5a3a22'); m.disc(0, 7.6, 0, 4.6, 20);
  m.color('#6aa880').shine(2); for (let i = 0; i < 11; i++) { const a = i / 11 * TAU, up = 0.35 + (i % 3) * 0.25; m.push(); m.tf(0, 7.6, 0, a, -(Math.PI / 2 - up), 0); m.lathe([[0.7, 0], [0.4, 3.5], [0.01, 6.5]], { seg: 5 }); m.pop(); }
  m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 5.4, y0: 0, y1: 8 }] };
}
// a heap of seed sacks (burlap, slumped)
function ghsSacks(m) {
  const C = ['#c8a878', '#b89868', '#d8b888'];
  for (let i = 0; i < 4; i++) { m.color(C[i % 3]).shine(0); const x = (i % 2 ? 1 : -1) * 2.2, y = i < 2 ? 1.8 : 4.6, z = i < 2 ? 0 : 0.3; m.ellipsoid(x * (i < 2 ? 1 : 0.4), y, z, 2.6, 1.8, 1.9, { seg: 12, rings: 8 }); m.color('#8a6a3a'); m.torus(x * (i < 2 ? 1 : 0.4), y + 1.6, z, 0.6, 0.18, { seg: 10, tseg: 4 }); }
  m.color('#3a8a3a'); m.roundBox(-2.2, 1.9, 1.85, 1.6, 1.2, 0.05, 0.1);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 4.6, y0: 0, y1: 6 }] };
}

/* ---------------- the moving parts ---------------- */
const GhsMesh = {
  // a flytrap's upper jaw: a shallow green shell, pink inside, long teeth round the front rim. Pivot = the hinge;
  // the jaw lies along +z (closed = flat over the pad)
  jaw(m) {
    const r = GHS.trap.r;
    m.color('#5aa040').shine(2); m.ellipsoid(0, 0, r, r + 0.4, 2.6, r + 0.4, { seg: 28, rings: 8, phi1: Math.PI / 2 });
    m.color('#ff6a8a').shine(3); m.disc(0, 0.02, r, r - 0.1, 28, { both: true });
    m.color('#e8506a'); m.ellipsoid(0, 0.4, r * 1.25, 1.6, 0.6, 1.6, { seg: 10, rings: 5 });
    m.color('#fff4c8').shine(1); for (let i = 0; i < 22; i++) { const a = i / 22 * TAU; if (Math.cos(a) < -0.7) continue; m.limb(Math.sin(a) * (r + 0.2), 0, r + Math.cos(a) * (r + 0.2), Math.sin(a) * (r + 1.3), -0.3, r + Math.cos(a) * (r + 1.3), 0.2, 0.04, { seg: 4 }); }
    m.shine(0);
  },
  // a shaker (upright, forward +z): a fat glass body, a domed cap full of holes; i 0 = salt (white), 1 = pepper (dark)
  shaker(m, i) {
    const body = i ? '#4a4440' : '#f4f6fa', fill = i ? '#2a2420' : '#ffffff';
    m.color(body).shine(4); m.lathe([[2.6, 0], [3.0, 0.4], [3.1, 6.2], [2.9, 6.6], [0.01, 6.6]], { seg: 22 });
    m.color(fill).shine(1); m.lathe([[2.75, 0.2], [2.85, 4.2], [0.01, 4.2]], { seg: 18 });
    m.color('#d0d4dc').shine(5); m.lathe([[3.0, 6.4], [3.15, 7.2], [2.6, 8.4], [1.4, 9.0], [0.01, 9.15]], { seg: 22 });
    m.color('#3a3a3a'); for (let j = 0; j < 7; j++) { const a = j / 7 * TAU, rr = j ? 1.1 : 0; m.ball(Math.sin(a) * rr, 9.0 - rr * 0.18, Math.cos(a) * rr, 0.2, { seg: 5, rings: 3 }); }
    m.color(i ? '#ffffff' : '#e8302a').shine(1); m.roundBox(0, 3.2, 3.02, 2.4, 1.8, 0.1, 0.3);
    m.shine(0);
  }
};

/* ---------------- the rules ---------------- */
CART_ARENA_RULES.greenhouse = {
  music: 'kart2',
  onLoad(s) {
    const S = GHS;
    const G = CartKit.group(s, [['jaws', GhsMesh.jaw, S.trap.n], ['shakers', GhsMesh.shaker, 2]]);
    const D = s.ghs = { t: 0, traps: [], shakers: [], next: S.shake.first, turn: 0, last: null };
    for (let i = 0; i < S.trap.n; i++) { const a = (i + 0.5) / S.trap.n * TAU + 0.15, x = Math.sin(a) * S.trap.ring, z = Math.cos(a) * S.trap.ring, yaw = a + Math.PI; D.traps.push({ i, x, z, yaw, hx: x - Math.sin(yaw) * S.trap.r, hz: z - Math.cos(yaw) * S.trap.r, st: 'open', t: 0, mask: 0, open: 1, obj: G.jaws[i] }); }
    for (let i = 0; i < 2; i++) { const a = i ? 2.4 : 5.6; D.shakers.push({ i, kind: i ? 'pepper' : 'salt', st: 'off', t: 0, x: Math.sin(a) * 200, z: Math.cos(a) * 200, y: 40, hx: Math.sin(a) * 200, hz: Math.cos(a) * 200, ax: 0, az: 0, tgt: null, fx0: 0, fz0: 0, fy0: 0, pile: 0, px: 0, pz: 0, pmask: 0, obj: G.shakers[i] }); }
  },
  onUpdate(s, dt, racing) {
    const D = s.ghs; if (!D) return;
    const live = racing && s.state === 'race' && !(s.obj && s.obj.ended);
    if (live) D.t += dt;
    ghsTraps(s, D, dt, live); ghsShakers(s, D, dt, live);
  },
  // the AI: drive off an arming trap's pad and away from a locked shaker's target (by skill)
  onStep(s, k, dt, racing) {
    const D = s.ghs; if (!D || (k.player && !s.autoDrive) || !racing || k.out || s.state !== 'race') return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9, luck = ((k.slot * 7 + Math.floor(D.t * 0.7)) % 10) / 10;
    if (luck > 0.55 + (sk - 0.85) * 3) return;
    const steerTo = a => { const d = cartWrap(a - k.yaw); I.steer = clamp(-d * 2.4, -1, 1); };
    for (const tr of D.traps) { if (tr.st !== 'arm' && tr.st !== 'chew') continue; const dd = Math.hypot(k.x - tr.x, k.z - tr.z); if (dd < GHS.trap.r + 3) { steerTo(Math.atan2(k.x - tr.x, k.z - tr.z)); I.gas = 1; return; } }
    for (const sh of D.shakers) { if (sh.st !== 'lock' && sh.st !== 'fly') continue; const dd = Math.hypot(k.x - sh.ax, k.z - sh.az); if (dd < GHS.shake.r + 3) { steerTo(Math.atan2(k.x - sh.ax, k.z - sh.az)); I.gas = 1; return; } }
  },
  draw(s, R, Sp, t) { const D = s.ghs; if (D) ghsDraw(s, D, R, Sp, t); },
  lights(s, add) { const D = s.ghs; if (!D) return; for (const tr of D.traps) if (tr.st === 'arm') add(tr.x, 2, tr.z, 14, GHS.C.hot, 1.2, 1.5); },
  radar(s, ctx, P, sc) {
    const q = CART_ROY_T.p, D = s.ghs;
    P(GHS.palm[0], GHS.palm[1], q); ctx.fillStyle = 'rgba(90,180,80,0.8)'; ctx.beginPath(); ctx.arc(q.x, q.y, 4, 0, TAU); ctx.fill();
    if (D) for (const tr of D.traps) { P(tr.x, tr.z, q); ctx.fillStyle = tr.st === 'arm' || tr.st === 'snap' ? 'rgba(255,80,100,0.95)' : 'rgba(255,140,170,0.75)'; ctx.beginPath(); ctx.arc(q.x, q.y, 3, 0, TAU); ctx.fill(); }
  }
};

// ---- the flytraps: open (waiting), arm when a car drives onto the pad, snap, chew (solid), reopen ----
function ghsTraps(s, D, dt, live) {
  const S = GHS.trap;
  for (const tr of D.traps) {
    tr.t += dt;
    if (tr.st === 'open') {
      tr.open = 1;
      if (live) for (const k of s.karts) { if (k.out || k.hidden) continue; if ((k.x - tr.x) ** 2 + (k.z - tr.z) ** 2 < (S.r - 0.5) ** 2) { tr.st = 'arm'; tr.t = 0; tr.mask = 0; Sound.play('croak', { vol: Math.hypot(s.player.x - tr.x, s.player.z - tr.z) < 60 ? 0.7 : 0.12, pitch: 0.6 }); if (k.player) s.banner('FLYTRAP!', '#ff6a8a', 1.0, 'get off the pad!', true); break; } }
    } else if (tr.st === 'arm') {
      tr.open = 1;
      if (tr.t > S.arm) { tr.st = 'snap'; tr.t = 0; }
    } else if (tr.st === 'snap') {
      tr.open = 1 - Math.min(1, tr.t / S.snap);
      if (tr.t > S.snap) {
        tr.st = 'chew'; tr.t = 0; tr.open = 0;
        if (live) for (const k of s.karts) { if (k.out) continue; const dx = k.x - tr.x, dz = k.z - tr.z, d = Math.hypot(dx, dz); if (d > S.r + 0.6 || k.y > 5) continue; s.hit(k, 'knock', null, { item: 'ghs_trap', dx: dx / (d || 1), dz: dz / (d || 1), power: 16, banner: 'SNAPPED!' }); }
        const P = s.player, near = P && Math.hypot(P.x - tr.x, P.z - tr.z) < 60; Sound.play('cartChomp', { vol: near ? 0.9 : 0.15, pitch: 0.7 }); if (near) s.shakeIt(0.7);
        if (s.fx) { s.fx.burst(tr.x, 2.5, tr.z, 'ring', 12, '#ff8aa8'); s.fx.dust(tr.x, 0.5, tr.z, 10, '#a8c870'); }
      }
    } else if (tr.st === 'chew') {
      tr.open = Math.abs(Math.sin(tr.t * 5)) * 0.05;
      // shut: solid (cars bounce off the closed shell)
      for (const k of s.karts) { if (k.out) continue; const dx = k.x - tr.x, dz = k.z - tr.z, d = Math.hypot(dx, dz), m = S.r + 1.2; if (d < m && d > 0.01) { const nx = dx / d, nz = dz / d, vn = k.vx * nx + k.vz * nz; k.x = tr.x + nx * m; k.z = tr.z + nz * m; if (vn < 0) { k.vx -= nx * vn * 1.4; k.vz -= nz * vn * 1.4; } } }
      if (tr.t > S.chew) { tr.st = 'reopen'; tr.t = 0; }
    } else { tr.open = Math.min(1, tr.t / S.open); if (tr.t > S.open) { tr.st = 'open'; tr.t = 0; } }
    // the upper jaw, hinged at the back of the pad: raised about 50 degrees when open, quivering while it arms
    const o = tr.obj; if (o) { o.live = true; o.visible = true; o.x = tr.hx; o.y = 0.4; o.z = tr.hz; o.yaw = tr.yaw; o.pitch = -tr.open * 0.9 + (tr.st === 'arm' ? Math.sin(s.time * 36) * 0.07 : tr.st === 'open' ? Math.sin(s.time * 1.5 + tr.i) * 0.03 : 0); o.roll = 0; o.scale = 1; }
  }
}
// ---- the shakers: fly over a car (the target follows it), lock on (salt / pepper starts to fall), pour, fly off ----
function ghsShakers(s, D, dt, live) {
  const S = GHS.shake;
  if (live && D.t > D.next) {
    const sh = D.shakers[D.turn % 2];
    if (sh.st === 'off') {
      let best = null, bs = -1e9; for (const k of s.karts) { if (k.out || k.hidden || k.invT > 1) continue; const sc = s.rng() * 10 - (k === D.last ? 25 : 0) - (D.shakers.some(q => q !== sh && q.st !== 'off' && q.tgt === k) ? 50 : 0); if (sc > bs) { bs = sc; best = k; } }
      if (best) { D.last = best; sh.tgt = best; sh.st = 'fly'; sh.t = 0; sh.fx0 = sh.x; sh.fz0 = sh.z; sh.fy0 = sh.y; sh.ax = best.x; sh.az = best.z; if (best.player) { Sound.play('whistle', { vol: 0.5, pitch: 0.7 }); s.banner(sh.kind === 'salt' ? 'THE SALT SHAKER!' : 'THE PEPPER POT!', '#ffffff', 1.1, 'drive out from under it', true); } D.turn++; }
    }
    D.next = D.t + S.period * (0.8 + s.rng() * 0.4) / 2;
  }
  for (const sh of D.shakers) {
    sh.t += dt;
    if (sh.st === 'fly') {
      const k = sh.tgt; if (k && !k.out) { const f = Math.min(1, dt * 2.2); sh.ax += (k.x + k.vx * 0.9 - sh.ax) * f; sh.az += (k.z + k.vz * 0.9 - sh.az) * f; }
      const r = Math.hypot(sh.ax, sh.az), Rm = GHS.R - 8; if (r > Rm) { sh.ax *= Rm / r; sh.az *= Rm / r; }
      const u = Math.min(1, sh.t / S.fly), e = u * u * (3 - 2 * u); sh.x = lerp(sh.fx0, sh.ax, e); sh.z = lerp(sh.fz0, sh.az, e); sh.y = lerp(sh.fy0, S.y, e);
      if (sh.t > S.fly) { sh.st = 'lock'; sh.t = 0; Sound.play('tick', { vol: Math.hypot(s.player.x - sh.ax, s.player.z - sh.az) < 50 ? 0.7 : 0.1, pitch: 0.8 }); }
    } else if (sh.st === 'lock') {
      sh.x = sh.ax + Math.sin(s.time * 30) * 0.4; sh.z = sh.az; sh.y = S.y;
      if (s.fx && Math.random() < 0.6) s.fx.add(sh.x + (Math.random() - 0.5) * 2, sh.y - 1, sh.z + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3, -6, (Math.random() - 0.5) * 3, 0.9, 0.3, 0.2, sh.kind === 'salt' ? GHS.C.salt : GHS.C.pepper, 1, 'drop', 0, 0, 0);
      if (sh.t > S.lock) { sh.st = 'pour'; sh.t = 0; }
    } else if (sh.st === 'pour') {
      sh.x = sh.ax + Math.sin(s.time * 45) * 0.8; sh.z = sh.az;
      if (sh.t > S.pour) {
        sh.st = 'back'; sh.t = 0; sh.fx0 = sh.x; sh.fz0 = sh.z; sh.fy0 = sh.y; sh.pile = sh.kind === 'salt' ? S.pile : S.cloud; sh.px = sh.ax; sh.pz = sh.az; sh.pmask = 0;
        if (live) for (const k of s.karts) { if (k.out || k.y > 6) continue; if (Math.hypot(k.x - sh.ax, k.z - sh.az) > S.r) continue; sh.pmask |= 1 << k.slot; ghsShakeHit(s, sh, k); }
        const P = s.player, near = P && Math.hypot(P.x - sh.ax, P.z - sh.az) < 50; Sound.play(sh.kind === 'salt' ? 'dust' : 'cartBoom', { vol: near ? 0.7 : 0.12, pitch: sh.kind === 'salt' ? 1.4 : 1.8 });
        if (s.fx) { s.fx.burst(sh.ax, 1, sh.az, 'ring', 12, sh.kind === 'salt' ? '#ffffff' : '#5a504a'); s.fx.smoke(sh.ax, 1, sh.az, 6, sh.kind === 'salt' ? '#ffffff' : '#6a5a50'); }
      }
    } else if (sh.st === 'back') {
      const u = Math.min(1, sh.t / S.back), e = u * u; sh.x = lerp(sh.fx0, sh.hx, e); sh.z = lerp(sh.fz0, sh.hz, e); sh.y = lerp(sh.fy0, 40, e);
      if (sh.t > S.back) { sh.st = 'off'; sh.t = 0; sh.x = sh.hx; sh.z = sh.hz; sh.y = 40; }
    }
    // the pile / cloud left behind: drive into it and it gets you too (once)
    if (sh.pile > 0) {
      sh.pile -= dt;
      if (live) for (const k of s.karts) { if (k.out || k.air || (sh.pmask & (1 << k.slot))) continue; if (Math.hypot(k.x - sh.px, k.z - sh.pz) > S.r * 0.7) continue; sh.pmask |= 1 << k.slot; ghsShakeHit(s, sh, k); }
    }
    const o = sh.obj; if (o) { const on = sh.st !== 'off'; o.live = on; o.visible = on; o.x = sh.x; o.y = sh.y; o.z = sh.z; o.yaw = s.time * 0.6 + sh.i; o.pitch = sh.st === 'lock' || sh.st === 'pour' ? Math.PI * 0.9 + Math.sin(s.time * (sh.st === 'pour' ? 40 : 18)) * 0.12 : sh.st === 'fly' ? 0.3 : 0.2; o.roll = 0; o.scale = 1; }
  }
}
function ghsShakeHit(s, sh, k) {
  if (sh.kind === 'salt') s.hit(k, 'slip', null, { item: 'ghs_salt', banner: 'SALTED!' });
  else s.hit(k, 'spin', null, { item: 'ghs_pepper', dur: 1.1, banner: 'ACHOO!' });
}
// ---- sprites: the trap pads and their warning, the shaker targets, the salt and pepper ----
function ghsDraw(s, D, R, Sp, t) {
  const C = GHS.C, S = GHS, cam = s.cam;
  for (const tr of D.traps) {
    if ((tr.x - cam.x) ** 2 + (tr.z - cam.z) ** 2 > 200 * 200) continue;
    if (tr.st === 'arm') {
      const fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 20)), u = Math.min(1, tr.t / S.trap.arm), r = S.trap.r * 2;
      R.flat.flat(tr.x, 0.5, tr.z, r * (1.5 - u * 0.5), r * (1.5 - u * 0.5), t * 2, Sp.reticle || Sp.ring, C.red, 0.9 * fl, false);
      R.flat.flat(tr.x, 0.45, tr.z, r, r, 0, Sp.glow, C.hot, 0.45 * fl, true);
      R.bbs.bb(tr.x, 9, tr.z, 3.4, 3.4, Sp.warn, C.warn, 0.6 + 0.4 * fl, true);
    } else if (tr.st === 'open') R.flat.flat(tr.x, 0.45, tr.z, S.trap.r * 2.1, S.trap.r * 2.1, t * 0.4, Sp.ring, C.pink, 0.35 + 0.15 * Math.sin(t * 3 + tr.i), false);
  }
  for (const sh of D.shakers) {
    if (sh.st === 'off' && sh.pile <= 0) continue;
    if (sh.st === 'fly' || sh.st === 'lock' || sh.st === 'pour') {
      const lock = sh.st !== 'fly', fl = lock ? 0.5 + 0.5 * Math.sin(t * 26) : 0.6 + 0.4 * Math.sin(t * 8), r = S.shake.r * 2;
      R.flat.flat(sh.ax, 0.12, sh.az, r, r, lock ? 0 : t * 2, Sp.reticle || Sp.ring, lock ? C.red : C.white, 0.9 * fl, false);
      R.flat.flat(sh.ax, 0.1, sh.az, r * 0.9, r * 0.9, 0, Sp.shadow, C.black, lock ? 0.5 : 0.25, false);
      if (lock) { const col = sh.kind === 'salt' ? C.salt : C.pepper; for (let i = 0; i < 8; i++) { const u = (t * 1.6 + i * 0.125) % 1; R.bbs.bb(sh.ax + Math.sin(i * 2.4) * 1.5, sh.y - 2 - u * (sh.y - 2), sh.az + Math.cos(i * 2.4) * 1.5, 0.5, 1.2, Sp.streak, col, 0.85, false); } }
      if (sh.st === 'pour') { const col = sh.kind === 'salt' ? C.salt : C.pepper; for (let i = 0; i < 10; i++) { const a = i * 0.63, rr = (i % 3) * 2; R.bbs.streak(sh.ax + Math.sin(a) * rr, sh.y / 2, sh.az + Math.cos(a) * rr, 0, -1, 0, sh.y, 1.4, Sp.streak, col, 0.85); } }
    }
    if (sh.pile > 0) {
      const a = Math.min(1, sh.pile * 1.5), r = S.shake.r * 1.6;
      if (sh.kind === 'salt') { R.flat.flat(sh.px, 0.12, sh.pz, r, r, 0.7, Sp.splat || Sp.puff, C.salt, 0.9 * a, false); for (let i = 0; i < 3; i++) R.bbs.bb(sh.px + Math.sin(i * 2.1) * 2, 0.6, sh.pz + Math.cos(i * 2.1) * 2, 0.9, 0.9, Sp.star, C.white, 0.6 * a * (0.5 + 0.5 * Math.sin(t * 7 + i)), true, t); }
      else for (let i = 0; i < 6; i++) { const aa = t * 0.6 + i * 1.05, rr = 1.5 + (i % 3) * 1.6; R.bbs.bb(sh.px + Math.sin(aa) * rr, 1.6 + (i % 2) * 1.4, sh.pz + Math.cos(aa) * rr, 6, 5, Sp.smoke || Sp.puff, C.pepper, 0.55 * a, false, aa); }
    }
  }
}

/* ---------------- the registry ---------------- */
CART_ARENAS.push({
  id: 'greenhouse', name: 'THE GREENHOUSE', sub: 'Battle royale: snapping flytraps, the salt shaker, the pepper pot', objectives: ['royale'], royale: true, levelCar: 'snail',
  col: '#5ab048', tod: 'day', blurb: 'Turbo Escargot\'s glasshouse. Get off the flytrap pads before they snap, and out from under the salt and pepper. Last car running wins.'
});
CART_ROYALE_ARENAS.snail = 'greenhouse';
CART_ARENA_ICONS.greenhouse = (ctx, s, t, col) => {
  // a glasshouse dome with ribs, a flytrap snapping inside
  ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.fillStyle = 'rgba(190,240,230,0.9)';
  ctx.beginPath(); ctx.moveTo(-s * 0.8, s * 0.6); ctx.lineTo(-s * 0.8, 0); ctx.quadraticCurveTo(-s * 0.8, -s * 0.8, 0, -s * 0.8); ctx.quadraticCurveTo(s * 0.8, -s * 0.8, s * 0.8, 0); ctx.lineTo(s * 0.8, s * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 1.5; for (const x of [-0.4, 0, 0.4]) { ctx.beginPath(); ctx.moveTo(x * s, s * 0.6); ctx.lineTo(x * s, -s * (0.8 - x * x * 0.9)); ctx.stroke(); }
  const open = 0.25 + 0.25 * Math.abs(Math.sin(t * 2));
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, s * 0.42, s * 0.42, s * 0.12, 0, 0, Math.PI); ctx.fill();
  ctx.save(); ctx.translate(-s * 0.42, s * 0.42); ctx.rotate(-open); ctx.beginPath(); ctx.ellipse(s * 0.42, 0, s * 0.42, s * 0.14, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = '#ff6a8a'; ctx.fillRect(s * 0.05, -s * 0.02, s * 0.74, s * 0.04); ctx.restore();
  ctx.fillStyle = '#ff6a8a'; ctx.fillRect(-s * 0.37, s * 0.4, s * 0.74, s * 0.04);
  ctx.restore();
};
