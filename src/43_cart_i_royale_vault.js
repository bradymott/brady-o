/* ============================================================
   ART CART — royale arena: THE VAULT (id 'vault', Pyramid Scheme's arena; Nov 19 2026)
   The treasure chamber under the pyramid: a round sandstone hall the size of a small town, open to the night sky. In
   the middle the CAPSTONE (a floating gold pyramid over a stepped plinth) that runs the security system; a ring of
   eight great COLUMNS; ten heaps of TREASURE (coin mounds, chests, jars) on the outer floor; vault doors in the walls.
   Its enemies (all telegraphed, all readable on a phone):
     · LASER SWEEP: the capstone spins up and an alarm ring flashes (1.8 s), then a red laser arm sweeps the whole floor
       once (5.5 s): 7 HP and a spin. HOP over it as it reaches you, or hide in the shadow of a column or a treasure heap
     · GOLD RUSH: a gold target locks onto a car (1.0 s), stops (0.4 s: swerve!), and a heap of coins crashes down on it
       (12 HP and a knock); the heap stays a moment as cover, then sinks
     · MUMMY GUARDS: bandage-wrapped burners shuffle after the nearest car; when close they RAISE THEIR ARMS (1 s, a lime
       ring shows their reach) and LUNGE: wrapped up, 8 HP. They fall flat afterwards (slow, easy to outrun)
   PRISM WARP (Pyramid Scheme's special) is in everyone's gift boxes here (arena levelCar → the scene's poolCar).
   The mummy meshes are shared with LASER TOMB (43_cart_j_lasertomb.js: LtbMesh, ltbPoseLimb; used at run time only).
   Everything here is an original design. Registers itself (see 43_cart_a_data.js, 43_cart_i_royale.js).
   ============================================================ */
const VLT_C = {
  R: 178, plinth: 11, colR: 58, colN: 8, colRad: 2.4, pileR: 104, pileN: 10, pileRad: 5,
  sweep: { period: 17, first: 15, warn: 1.8, dur: 5.5, h: 0.9 },
  drop: { n: 3, aim: 1.0, hold: 0.4, fall: 0.4, r: 4.4, life: 4, sink: 0.6 },
  mum: { n: 4, chase: 30, speed: 5.4, near: 7, raise: 1.0, lunge: 0.5, reach: 4, grab: 2.6, down: 1.8, up: 0.6, sc: 1.35 },
  red: [1, 0.16, 0.22], hot: [1, 0.35, 0.45], gold: [1, 0.8, 0.3], amber: [1, 0.62, 0.15], green: [0.25, 1, 0.55], lime: [0.6, 1, 0.35], white: [1, 1, 1], black: [0, 0, 0], cyan: [0.3, 0.95, 1]
};
const VLT_T = { p: {} };

/* ---------------- the world ---------------- */
CartWorlds.arena_vault = function (A, night) {
  const V = VLT_C, E = this.base(2106, [-235, -235, 235, 235], '#5a4834', 0.05);
  const sky = Object.assign(CART_SKIES.night(), { sky: '#1a2448', hor: '#2a3a6a', fog: '#141a2c', fogD: 0.0042, mid: '#2a2040', midK: 0.35, cityK: 0.2, emB: 1.9, keyK: 0.6, key: '#c8d0ff', stars: 1 });
  Object.assign(E, { id: 'vault', arena: A, sky, tod: 'night', music: 'kart2', night: true, R: V.R });
  const api = E.api, rng = mulberry32(2106);
  const ang = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
  const colA = i => i / V.colN * TAU, pileA = i => (i + 0.5) / V.pileN * TAU + 0.12;
  E.vlt = { cover: [] };
  // ---- the floor: sandstone flags, a lapis-and-gold sunburst round the plinth, scattered coins ----
  api.paint((ctx, P, sc) => {
    const c0 = P(0, 0);
    for (let i = 0; i < 360; i++) { const x = (rng() - 0.5) * 460, z = (rng() - 0.5) * 460, q = P(x, z); ctx.fillStyle = `rgba(${rng() < 0.5 ? '60,44,28' : '200,170,120'},${0.05 + rng() * 0.08})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (2 + rng() * 9) * sc, (1 + rng() * 5) * sc, rng() * 3, 0, TAU); ctx.fill(); }
    // flagstone rings
    ctx.strokeStyle = 'rgba(60,40,22,0.35)'; ctx.lineWidth = 0.2 * sc;
    for (let r = 46; r < V.R; r += 12) { ctx.beginPath(); ctx.arc(c0[0], c0[1], r * sc, 0, TAU); ctx.stroke(); const n = Math.round(TAU * r / 12); for (let j = 0; j < n; j++) { const a = (j + (r / 12) % 2 * 0.5) / n * TAU, p = P(...ang(a, r)), q = P(...ang(a, r + 12)); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); } }
    // the sunburst: a lapis disc, gold rays, a gold rim
    ctx.fillStyle = 'rgba(26,40,96,0.9)'; ctx.beginPath(); ctx.arc(c0[0], c0[1], 42 * sc, 0, TAU); ctx.fill();
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, w = 0.06; const p = P(...ang(a - w, 14)), q = P(...ang(a, 41)), r = P(...ang(a + w, 14)); ctx.fillStyle = i % 2 ? 'rgba(255,210,90,0.75)' : 'rgba(80,255,150,0.4)'; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.lineTo(r[0], r[1]); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,210,90,0.85)'; ctx.lineWidth = 1.2 * sc; ctx.beginPath(); ctx.arc(c0[0], c0[1], 42 * sc, 0, TAU); ctx.stroke();
    // little coins everywhere (the vault is overflowing)
    for (let i = 0; i < 260; i++) { const a = rng() * TAU, r = 45 + rng() * 128, q = P(...ang(a, r)); ctx.fillStyle = `rgba(255,${190 + Math.floor(rng() * 50)},80,${0.35 + rng() * 0.3})`; ctx.beginPath(); ctx.arc(q[0], q[1], (0.25 + rng() * 0.3) * sc, 0, TAU); ctx.fill(); }
  });
  // ---- the plinth: three square steps (boxy is the point), neon on every edge ----
  CartScene.mesh(api, 0, 0, Math.PI / 4, m => {
    const lights = [];
    for (let i = 0; i < 3; i++) { const w = 22 - i * 5, y = i * 1.2; m.color(i % 2 ? '#bf985e' : '#caa46a'); m.roundBox(0, y + 0.6, 0, w, 1.2, w, 0.15, { top: '#dcbc84' }); m.color(i === 1 ? '#ff3ad8' : '#3aff8a', 1); for (const sd of [-1, 1]) { m.box(0, y + 1.22, sd * (w / 2 - 0.1), w - 0.2, 0.14, 0.14); m.box(sd * (w / 2 - 0.1), y + 1.22, 0, 0.14, 0.14, w - 0.2); } m.emissive(0); }
    m.color('#ffd84a', 0.5).shine(3); m.cyl(0, 3.6, 0, 1.6, 0.5, 2.4, 4, { stripes: ['#ffd84a', '#e0b030'], yaw0: Math.PI / 4 }); m.emissive(0).shine(0);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; lights.push({ x: Math.sin(a) * 10.5, y: 1.3, z: Math.cos(a) * 10.5, s: 1.4, c: '#3aff8a' }); }
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ffd84a', pool: 26 });
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: V.plinth + 0.5, y0: 0, y1: 3.6 }], lights };
  }, { hi: true, noAO: true });
  api.sign('THE VAULT', 0, -V.plinth - 0.4, { yaw: Math.PI, h: 0.9, y: 0.45, post: false, maxW: 6, style: { bg: '#1a1408', fg: '#ffd84a', border: '#3aff8a' }, glow: '#3aff8a' });
  api.sign('THE VAULT', 0, V.plinth + 0.4, { yaw: 0, h: 0.9, y: 0.45, post: false, maxW: 6, style: { bg: '#1a1408', fg: '#ffd84a', border: '#3aff8a' }, glow: '#3aff8a' });
  E.art.push({ x: 0, z: 0, r: V.plinth + 1 });
  api.light(0, 0, 50, '#ffc860', 0.5);
  // ---- the eight great columns (cover from the sweep) ----
  for (let i = 0; i < V.colN; i++) {
    const [x, z] = ang(colA(i), V.colR);
    CartScene.mesh(api, x, z, colA(i), m => {
      m.color('#cfa870'); m.roundBox(0, 0.5, 0, 6, 1, 6, 0.2); m.cyl(0, 1, 0, V.colRad, V.colRad * 0.9, 13, 18);
      m.color('#8a6a40'); for (let k = 0; k < 4; k++) m.torus(0, 2.5 + k * 3, 0, V.colRad - 0.02, 0.12, { seg: 18, tseg: 3 });
      // a flared capital, a gold cap, a neon band; painted glyph bands
      m.color('#d8b47c'); m.lathe([[V.colRad * 0.9, 14], [V.colRad * 1.5, 15.6], [V.colRad * 1.6, 16.2], [0, 16.2]], { seg: 18 });
      m.color('#ffd84a', 0.4).shine(3); m.roundBox(0, 16.6, 0, 5.4, 0.8, 5.4, 0.2); m.color(i % 2 ? '#3aff8a' : '#ff3ad8', 1); m.torus(0, 14, 0, V.colRad * 0.92, 0.1, { seg: 18, tseg: 3 }); m.torus(0, 1.1, 0, V.colRad + 0.05, 0.1, { seg: 18, tseg: 3 }); m.emissive(0).shine(0);
      m.color('#38f2ff', 1); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; m.box(Math.sin(a) * (V.colRad - 0.02), 8.5, Math.cos(a) * (V.colRad - 0.02), 0.5, 0.5, 0.06); } m.emissive(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: V.colRad + 0.2, y0: 0, y1: 17 }], lights: [{ x: 0, y: 14, z: 0, s: 2.4, c: i % 2 ? '#3aff8a' : '#ff3ad8' }] };
    }, { hi: true });
    E.art.push({ x, z, r: V.colRad + 0.6 }); E.vlt.cover.push({ a: colA(i), r: V.colR, half: Math.asin((V.colRad + 0.3) / V.colR) });
    api.light(x, z, 14, i % 2 ? '#3aff8a' : '#ff3ad8', 0.45);
  }
  // ---- the treasure heaps (cover too): a coin mound, a chest, jars, gems ----
  for (let i = 0; i < V.pileN; i++) {
    const a = pileA(i), [x, z] = ang(a, V.pileR + (i % 2) * 8);
    CartScene.mesh(api, x, z, a + Math.PI, m => {
      m.color('#ffc84a', 0.25).shine(3); m.lathe([[V.pileRad, 0], [V.pileRad * 0.8, 1.0], [V.pileRad * 0.45, 2.1], [0, 2.6]], { seg: 16 });
      m.color('#ffe07a', 0.35); for (let k = 0; k < 14; k++) { const ca = k * 2.4, cr = 1 + (k % 5) * 0.75, cy = 2.4 - cr * 0.42; m.push(); m.tf(Math.sin(ca) * cr, cy + 0.12, Math.cos(ca) * cr, ca, 0.5, 0.3); m.cyl(0, 0, 0, 0.32, 0.32, 0.07, 10); m.pop(); }
      m.color('#6a3a1e').shine(1); m.roundBox(1.6, 1.4, 2.2, 2.2, 1.3, 1.4, 0.2); m.color('#ffd84a', 0.3).shine(3); m.roundBox(1.6, 2.15, 2.2, 2.3, 0.22, 1.5, 0.1); m.box(1.6, 1.5, 2.92, 0.4, 0.5, 0.06);
      m.color('#3a6aff', 0.6); m.ball(-1.4, 2.0, 1.4, 0.35, { seg: 8, rings: 6 }); m.color('#ff3a6a', 0.6); m.ball(0.4, 2.7, -0.4, 0.3, { seg: 8, rings: 6 }); m.color('#3aff8a', 0.6); m.ball(-0.6, 1.7, -2.2, 0.3, { seg: 8, rings: 6 }); m.emissive(0);
      m.color('#2a6a8a').shine(2); m.push(); m.tf(-2.8, 0, 2.6); m.lathe([[0, 0], [0.5, 0.05], [0.75, 0.7], [0.45, 1.6], [0.32, 1.9], [0.42, 2.05]], { seg: 12 }); m.pop(); m.color('#c86a3a'); m.push(); m.tf(3.4, 0, -1.6); m.lathe([[0, 0], [0.45, 0.05], [0.65, 0.6], [0.35, 1.3], [0.4, 1.45]], { seg: 12 }); m.pop(); m.shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: V.pileRad - 0.5, y0: 0, y1: 2.4 }], lights: [{ x: 0, y: 2.8, z: 0, s: 3.2, c: '#ffd84a' }] };
    }, { hi: true });
    E.art.push({ x, z, r: V.pileRad }); E.vlt.cover.push({ a, r: V.pileR + (i % 2) * 8, half: Math.asin((V.pileRad - 0.6) / (V.pileR + (i % 2) * 8)) });
    api.light(x, z, 12, '#ffc860', 0.45);
  }
  // ---- the hall's wall: sandstone blocks round the edge, four great round vault doors, sconces ----
  api.instanceProto('vlt_wall', m => {
    // 7.4 m of wall, 8 m tall; the front (+z) faces into the hall
    m.color('#c29c64'); m.roundBox(0, 4, 0, 7.4, 8, 2.6, 0.2, { top: '#d8b880' });
    m.color('#8a6a40'); for (const y of [2.7, 5.4]) m.box(0, y, 1.32, 7.2, 0.16, 0.06); for (const x of [-1.9, 1.7]) m.box(x, 1.35, 1.32, 0.12, 2.6, 0.06); m.box(0, 4.05, 1.32, 0.12, 2.6, 0.06);
    m.color('#ffffff', 1); m.box(0, 8.06, 1.1, 7.2, 0.14, 0.14); m.emissive(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 3.7, hz: 1.3, y0: 0, y1: 8 }] };
  }, { r: 4.5, near: 50, mid: 160, farD: 420, lo: true, far: m => { m.color('#c29c64'); m.box(0, 4, 0, 7.4, 8, 2.6); m.color('#ffffff', 1); m.box(0, 8.06, 1.1, 7.2, 0.14, 0.14); m.emissive(0); } });
  const poly = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; poly.push([Math.sin(a) * V.R, Math.cos(a) * V.R]); }
  E.walls = poly; CartDecor.protos(E);
  for (let i = 0; i < 76; i++) { const a = (i + 0.5) / 76 * TAU, [x, z] = ang(a, V.R + 2.2); let door = false; for (let j = 0; j < 4; j++) if (Math.abs(cartWrap(a - (j / 4 * TAU + Math.PI / 4))) < 0.05) door = true; if (door) continue; api.instance('vlt_wall', x, z, { y: 0, yaw: a + Math.PI, tint: cartTintOf(['#3aff8a', '#ffd84a', '#ff3ad8'][i % 3]) }); if (i % 3 === 0) api.glow(Math.sin(a) * (V.R + 0.8), 8.1, Math.cos(a) * (V.R + 0.8), 1.4, ['#3aff8a', '#ffd84a', '#ff3ad8'][i % 3]); }
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + Math.PI / 4, [x, z] = ang(a, V.R + 0.2);
    CartScene.mesh(api, x, z, a + Math.PI, m => {
      // a giant round vault door, gold, with a wheel handle and bolts (decorative: it never opens)
      m.color('#3a2c22').shine(1); m.roundBox(0, 7.2, -0.3, 15, 14.4, 1.2, 0.3);
      m.push(); m.tf(0, 7.2, 0.4, 0, Math.PI / 2, 0); m.color('#d8a83a', 0.25).shine(3); m.cyl(0, 0, 0, 6.2, 6.2, 0.6, 32); m.color('#a87a2a'); m.torus(0, 0.62, 0, 5.4, 0.18, { seg: 32, tseg: 4 }); m.torus(0, 0.62, 0, 2.2, 0.16, { seg: 22, tseg: 4 });
      m.color('#ffe07a', 0.4); for (let k = 0; k < 6; k++) { const b = k / 6 * TAU; m.limb(0, 0.9, 0, Math.sin(b) * 2.1, 0.9, Math.cos(b) * 2.1, 0.13, 0.13, { seg: 6 }); } m.torus(0, 0.9, 0, 2.1, 0.13, { seg: 22, tseg: 4 });
      m.color('#fff0b0', 0.3); for (let k = 0; k < 16; k++) { const b = k / 16 * TAU; m.ball(Math.sin(b) * 5.8, 0.66, Math.cos(b) * 5.8, 0.22, { seg: 6, rings: 4 }); } m.pop();
      m.color('#3aff8a', 1); m.torus(0, 7.2, 0.75, 6.35, 0.1, { seg: 40, tseg: 3 }); m.emissive(0).shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 7.5, hz: 0.9, y0: 0, y1: 14 }], lights: [{ x: 0, y: 14.6, z: 0.5, s: 2.6, c: '#3aff8a' }] };
    }, { hi: true });
    api.light(x * 0.93, z * 0.93, 18, '#ffd84a', 0.45);
  }
  for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * TAU, [x, z] = ang(a, V.R - 0.6); CartScene.mesh(api, x, z, a + Math.PI, m => { m.color('#3a2a1e').shine(1); m.box(0, 5.6, -0.2, 0.4, 1.1, 0.4); m.limb(0, 5.6, 0, 0, 6.3, 0.7, 0.1, 0.1, { seg: 5 }); m.color('#ffd84a', 0.2).shine(3); m.push(); m.tf(0, 6.4, 0.8); m.lathe([[0.55, 0.3], [0.45, 0], [0.15, -0.25], [0, -0.27]], { seg: 10 }); m.pop(); m.emissive(0).shine(0); return { lights: [{ x: 0, y: 6.9, z: 0.8, s: 1.8, c: '#ffa040', fire: true }] }; }, { hi: true, noAO: true }); api.light(x * 0.96, z * 0.96, 12, '#ffa040', 0.45); }
  // ---- beyond the wall: the downline of little pyramids, searchlights, the far skyline ----
  api.instanceProto('vlt_pyr', m => { m.color('#c49c64'); m.cyl(0, 0, 0, 10, 0, 9.5, 4, { stripes: ['#d6b07a', '#a8824e'], yaw0: Math.PI / 4 }); m.color('#ffffff', 1); for (let i = 0; i < 4; i++) { const b = Math.PI / 4 + i * Math.PI / 2; m.limb(Math.sin(b) * 10, 0.1, Math.cos(b) * 10, 0, 9.5, 0, 0.16, 0.1, { seg: 4 }); } m.emissive(0); return {}; }, { r: 10, near: 60, mid: 200, farD: 520, lo: true });
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + rng() * 0.1, r = 250 + rng() * 80, [x, z] = ang(a, r); api.instance('vlt_pyr', x, z, { y: 0, yaw: rng(), scale: 1.2 + rng() * 1.4, tint: cartTintOf(['#3aff8a', '#ff3ad8', '#38f2ff', '#ffd84a'][i % 4]), noCol: true }); }
  E.beams = [];
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.6, [x, z] = ang(a, V.R + 30); E.beams.push({ kind: 'search', x, y: 1, z, c: [0.4, 1, 0.65], ph: i * 1.7, sp: 0.35 + i * 0.07, len: 160, w: 7, a: 0.18 }); }
  for (let i = 0; i < 3; i++) E.beams.push({ kind: 'laser', x: Math.sin(i * 2.1) * 3, y: 6, z: Math.cos(i * 2.1) * 3, c: [[0.25, 1, 0.55], [1, 0.3, 0.9], [0.3, 0.95, 1]][i], ph: i * 1.3, sp: 0.4 + i * 0.05, len: 120, w: 0.55, a: 0.45 });
  // ---- royale spots: gift boxes, repair kits, spawns, the storm's end points ----
  for (let i = 0; i < 4; i++) E.gifts.push((([x, z]) => ({ x, z }))(ang(i / 4 * TAU, 26)));
  for (let i = 0; i < V.colN; i++) { const [x, z] = ang(colA(i) + TAU / V.colN / 2, 80); E.gifts.push({ x, z }); }
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU + 0.3, 150); E.gifts.push({ x, z }); }
  const repairs = []; for (let i = 0; i < 6; i++) repairs.push(ang(i / 6 * TAU + 0.05, 128)); repairs.push(ang(Math.PI / 2, 38), ang(-Math.PI / 2, 38));
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, [x, z] = ang(a, 143); E.spawn.push({ x, z, yaw: a + Math.PI / 2 }); }
  for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 30 + rng() * 135, [x, z] = ang(a, r); E.orbSpots.push({ x, z }); }
  E.zones = [{ x: 0, z: 0, r: 12, name: 'THE CAPSTONE' }]; E.flagSpots = [{ x: 0, z: 70 }]; E.captures = [{ x: 0, z: -90, r: 9 }];
  E.royale = { R: V.R - 4, x: 0, z: 0, ends: [0, 1, 2, 3, 4].map(i => ang(i / 5 * TAU + 0.3, 80)), repairs, storm: { name: 'SANDSTORM', col: '#e8b070' }, avoid: [[0, 0, V.plinth + 3]] };
  return this.finish(E);
};

/* ---------------- the arena's enemies: the laser sweep, the gold rush, the mummy guards ---------------- */
// is the point at angle a, radius r in the shadow of a column or a treasure heap (seen from the capstone)?
function vltShadow(E, a, r) { for (const c of E.vlt.cover) if (r > c.r - 1 && Math.abs(cartWrap(a - c.a)) < c.half) return c; return null; }
CART_ARENA_RULES.vault = {
  music: 'kart2',
  onLoad(s) {
    const V = VLT_C, M = V.mum;
    const D = s.vlt = { t: 0, sw: { st: 'idle', next: V.sweep.first, t: 0, a: 0, a0: 0, pa: 0, mask: 0, n: 0 }, drops: [], mums: [], groups: [] };
    for (let i = 0; i < V.drop.n; i++) D.drops.push({ i, st: 'idle', t: 0, cool: 6 + i * 3.5, tgt: null, last: null, x: 0, z: 0, y: 40 });
    for (let i = 0; i < M.n; i++) { const a = (i + 0.25) / M.n * TAU; D.mums.push({ i, hx: Math.sin(a) * 82, hz: Math.cos(a) * 82, x: Math.sin(a) * 82, z: Math.cos(a) * 82, yaw: 0, pitch: 0, st: 'walk', t: i * 1.3, cool: 4 + i * 2, tgt: null, tx: 0, tz: 0, x0: 0, z0: 0, mask: 0 }); }
    // moving parts (one or two draw calls): the capstone, three coin heaps, four mummies (body + arms + legs)
    let g = new BurnsGroup(Math.min(64, BurnsGL.maxBones || 32)); D.groups.push(g);
    const add = (fn, o) => { if (g.full) { g.finish(); g = new BurnsGroup(Math.min(64, BurnsGL.maxBones || 32)); D.groups.push(g); } return g.add(fn, Object.assign({ visible: true }, o || {})); };
    D.cap = add(m => { m.color('#ffd84a', 0.45).shine(3); m.cyl(0, -2.6, 0, 3.4, 0, 5.2, 4, { stripes: ['#ffd84a', '#e0b030'], yaw0: Math.PI / 4 }); m.cyl(0, -2.6, 0, 3.4, 0, -2.2, 4, { stripes: ['#c89a2a', '#b08820'], yaw0: Math.PI / 4 }); m.color('#3aff8a', 1); m.ball(0, 2.8, 0, 0.6, { seg: 8, rings: 6 }); for (let k = 0; k < 4; k++) { const b = Math.PI / 4 + k * Math.PI / 2; m.limb(Math.sin(b) * 3.4, -2.6, Math.cos(b) * 3.4, 0, 2.6, 0, 0.07, 0.05, { seg: 4 }); } m.emissive(0).shine(0); });
    for (const d of D.drops) d.o = add(m => { m.color('#ffc84a', 0.3).shine(3); m.lathe([[2.6, 0], [2.1, 0.8], [1.1, 1.6], [0, 1.9]], { seg: 14 }); m.color('#ffe07a', 0.4); for (let k = 0; k < 9; k++) { const ca = k * 2.4, cr = 0.6 + (k % 4) * 0.5; m.push(); m.tf(Math.sin(ca) * cr, 1.8 - cr * 0.5, Math.cos(ca) * cr, ca, 0.6, 0.3); m.cyl(0, 0, 0, 0.3, 0.3, 0.07, 10); m.pop(); } m.color('#3a6aff', 0.6); m.ball(0.5, 1.6, 0.3, 0.25, { seg: 8, rings: 5 }); m.emissive(0).shine(0); }, { visible: false });
    for (const q of D.mums) { q.body = add(m => LtbMesh.mummy(m, q.i + 1)); q.arms = [add(m => LtbMesh.arm(m, q.i * 2)), add(m => LtbMesh.arm(m, q.i * 2 + 1))]; q.legs = [add(m => LtbMesh.leg(m, q.i * 2)), add(m => LtbMesh.leg(m, q.i * 2 + 1))]; }
    g.finish();
  },
  onUpdate(s, dt, racing) {
    const D = s.vlt, V = VLT_C; if (!D) return;
    const live = racing && s.state === 'race' && !(s.obj && s.obj.ended);
    if (!live) { D.t += dt * 0.25; return; }
    D.t += dt;
    vltSweep(s, D, dt); vltDrops(s, D, dt); vltMummies(s, D, dt);
    void V;
  },
  // the AI hop the laser arm (by skill: a weak driver sometimes hops too late)
  onStep(s, k, dt, racing) {
    const D = s.vlt; if (!D || !racing || k.out || k.player && !s.autoDrive) return;
    const W = D.sw; if (W.st !== 'sweep' || k.air) return;
    const r = Math.hypot(k.x, k.z); if (r < VLT_C.plinth || vltShadow(s.E, Math.atan2(k.x, k.z), r)) return;
    const om = TAU / VLT_C.sweep.dur, dA = cartWrap(Math.atan2(k.x, k.z) - W.a);
    const sk = k.ai ? k.ai.skill : 0.9, good = ((k.slot * 7 + W.n * 3) % 10) / 10 < 0.5 + (sk - 0.85) * 3;
    if (dA > 0 && dA / om < 0.13 && good) { k.inp.driftPress = true; k.inp.drift = false; }
  },
  // the moving parts
  render(s, R) {
    const D = s.vlt; if (!D) return;
    const t = s.time, W = D.sw, V = VLT_C, M = V.mum;
    const spin = W.st === 'warn' ? 4 + W.t * 6 : W.st === 'sweep' ? 9 : 0.5;
    D.cap.x = 0; D.cap.y = 11 + Math.sin(t * 0.9) * 0.4; D.cap.z = 0; D.capYaw = (D.capYaw || 0) + spin * Math.min(0.1, Math.max(0, t - (D.capT === undefined ? t : D.capT))); D.capT = t; D.cap.yaw = D.capYaw; D.cap.scale = 1 + (W.st === 'warn' ? Math.sin(t * 20) * 0.04 : 0);
    for (const d of D.drops) { const on = d.st === 'fall' || d.st === 'pile' || d.st === 'sink'; d.o.visible = on; if (on) { d.o.x = d.x; d.o.z = d.z; d.o.y = d.y; d.o.yaw = d.i * 1.3; d.o.scale = 1.5; } }
    for (const q of D.mums) {
      const b = q.body; let pitch = 0, armP = -0.08, legA = 0, hop = 0;
      if (q.st === 'walk' || q.st === 'chase') { const f = q.st === 'chase' ? 8 : 5; legA = Math.sin(q.t * f) * 0.4; hop = Math.abs(Math.sin(q.t * f)) * 0.05; armP = -0.08 + Math.sin(q.t * 3) * 0.06; }
      else if (q.st === 'raise') { const u = Math.min(1, q.t / 0.35); armP = -0.08 - 1.1 * u + Math.sin(q.t * 22) * 0.06; pitch = -0.12 * u; hop = Math.abs(Math.sin(q.t * 14)) * 0.08; }
      else if (q.st === 'lunge') { const u = Math.min(1, q.t / M.lunge); pitch = 0.9 * u; armP = -1.2 + u * 0.9; legA = -0.4 * u; }
      else if (q.st === 'down') { pitch = lerp(0.9, Math.PI / 2 - 0.05, Math.min(1, q.t / 0.18)); armP = 0; legA = Math.sin(q.t * 9) * 0.3 * Math.max(0, 1 - q.t); }
      else { const u = Math.min(1, q.t / M.up); pitch = (Math.PI / 2 - 0.05) * (1 - u * u); armP = -0.3; }
      q.pitch = pitch;
      b.x = q.x; b.y = hop; b.z = q.z; b.yaw = q.yaw; b.pitch = pitch; b.roll = q.st === 'walk' || q.st === 'chase' ? Math.sin(q.t * 6) * 0.08 : 0; b.scale = M.sc;
      for (let l = 0; l < 2; l++) { const sd = l ? 1 : -1; ltbPoseLimb(q.arms[l], b, q.yaw, pitch, sd * 0.33, 1.45, 0.04, M.sc, armP); ltbPoseLimb(q.legs[l], b, q.yaw, pitch, sd * 0.13, 0.76, 0, M.sc, legA * sd); }
    }
    for (const G of D.groups) { G.pose(s.cam); R.skin(G.geo, G.bones, G.objs.length, null, 0, 0.5); }
  },
  draw(s, R, Sp, t) {
    const D = s.vlt, V = VLT_C; if (!D) return;
    const W = D.sw, bl = 0.5 + 0.5 * Math.sin(t * 18);
    // the capstone's halo; the alarm ring and the arm's start line during the warning
    R.bbs.bb(0, 11, 0, 12, 12, Sp.glow, W.st === 'idle' ? V.gold : V.red, W.st === 'idle' ? 0.35 : 0.5 + 0.3 * bl, true);
    if (W.st === 'warn') {
      for (let i = 0; i < 3; i++) { const u = ((W.t / V.sweep.warn) * 1.5 + i / 3) % 1, r = V.plinth + 2 + u * 40; R.flat.flat(0, 0.12, 0, r * 2, r * 2, 0, Sp.ring, V.red, 0.8 * (1 - u), true); }
      vltArm(R, Sp, s.E, W.a0, 0.35 + 0.45 * bl, 0.25);
      R.bbs.bb(0, 15, 0, 4, 4, Sp.warn, V.amber, 0.6 + 0.4 * bl, true);
    } else if (W.st === 'sweep') {
      vltArm(R, Sp, s.E, W.a, 1, 1);
      // a dim ghost a beat ahead, so you can time the hop
      vltArm(R, Sp, s.E, W.a + TAU / V.sweep.dur * 0.35, 0.22, 0.4);
    }
    // gold rush: the target while aiming / holding, the heap's shadow as it falls
    for (const d of D.drops) {
      if (d.st === 'aim' || d.st === 'hold') { const hold = d.st === 'hold', a = hold ? 0.95 : 0.5 + 0.35 * Math.sin(t * 14), rr = (V.drop.r * 2) * (hold ? 1 : 1 + (1 - d.t / V.drop.aim) * 0.6); R.flat.flat(d.x, 0.12, d.z, rr, rr, t * (hold ? 0 : 2), Sp.ring, V.gold, a, true); R.flat.flat(d.x, 0.13, d.z, rr * 0.5, rr * 0.5, 0, Sp.warn, V.amber, a, true); R.bbs.streak(d.x, 18, d.z, 0, 1, 0, 36, 0.5, Sp.streak, V.gold, 0.25 * a); }
      if (d.st === 'fall') { const u = Math.min(1, d.t / V.drop.fall); R.flat.flat(d.x, 0.12, d.z, 3 + u * 6, 3 + u * 6, 0, Sp.shadow, V.black, 0.4 + u * 0.4, false); R.flat.flat(d.x, 0.13, d.z, V.drop.r * 2, V.drop.r * 2, 0, Sp.ring, V.red, 0.9, true); }
      if (d.st === 'pile') R.bbs.bb(d.x, 2, d.z, 7, 7, Sp.glow, V.gold, 0.35, true);
    }
    // the mummies: a reach ring and a warning while the arms are up; glowing eyes
    for (const q of D.mums) {
      const hy = 1.8 * V.mum.sc * Math.cos(q.pitch);
      if (q.st === 'raise' || q.st === 'lunge') { R.flat.flat(q.x, 0.12, q.z, V.mum.grab * 2 + 1, V.mum.grab * 2 + 1, 0, Sp.ring, V.lime, 0.5 + 0.4 * bl, true); if (q.st === 'raise') R.flat.flat(q.tx, 0.11, q.tz, 4.6, 4.6, 0, Sp.glow, V.lime, 0.4, true); R.bbs.bb(q.x, hy + 1.3, q.z, 1.6, 1.6, Sp.warn, V.lime, 0.7 + 0.3 * bl, true); }
      R.bbs.bb(q.x, hy, q.z, 1.4, 1.4, Sp.glow, V.lime, q.st === 'raise' ? 0.8 : 0.3, true);
    }
  },
  lights(s, add) {
    const D = s.vlt, V = VLT_C; if (!D) return;
    add(0, 11, 0, 24, D.sw.st === 'idle' ? V.gold : V.red, D.sw.st === 'idle' ? 0.9 : 1.6, 1.5);
    for (const d of D.drops) if (d.st === 'hold' || d.st === 'fall') add(d.x, 3, d.z, 12, V.gold, 1.3, 1.5);
  },
  radar(s, ctx, P, sc) {
    const q = VLT_T.p, D = s.vlt; P(0, 0, q);
    ctx.fillStyle = 'rgba(255,216,74,0.85)'; ctx.beginPath(); ctx.moveTo(q.x, q.y - 4); ctx.lineTo(q.x + 4, q.y + 3); ctx.lineTo(q.x - 4, q.y + 3); ctx.fill();
    ctx.fillStyle = 'rgba(232,200,140,0.7)'; for (let i = 0; i < VLT_C.colN; i++) { const a = i / VLT_C.colN * TAU; P(Math.sin(a) * VLT_C.colR, Math.cos(a) * VLT_C.colR, q); ctx.beginPath(); ctx.arc(q.x, q.y, 2, 0, TAU); ctx.fill(); }
    if (D && D.sw.st === 'sweep') { P(0, 0, q); const x0 = q.x, y0 = q.y; P(Math.sin(D.sw.a) * VLT_C.R, Math.cos(D.sw.a) * VLT_C.R, q); ctx.strokeStyle = 'rgba(255,60,80,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(q.x, q.y); ctx.stroke(); }
    void sc;
  }
};
// the laser arm at angle a: a red beam from the plinth out to the wall, cut short where a column or a heap stands in its way
function vltArm(R, Sp, E, a, alpha, w) {
  const V = VLT_C, ux = Math.sin(a), uz = Math.cos(a), r0 = V.plinth + 0.5, c = vltShadow(E, a, V.R), r1 = c ? c.r - 2.5 : V.R;
  const L = r1 - r0, mx = ux * (r0 + L / 2), mz = uz * (r0 + L / 2);
  R.bbs.streak(mx, V.sweep.h, mz, ux, 0, uz, L, 0.45 * w + 0.1, Sp.streak, V.hot, alpha);
  R.bbs.streak(mx, V.sweep.h, mz, ux, 0, uz, L, 1.4 * w, Sp.streak, V.red, 0.45 * alpha);
  R.flat.flat(mx, 0.11, mz, 2.4 * w + 0.4, L, a, Sp.square, V.red, 0.3 * alpha, true);
  if (c && alpha > 0.5) R.bbs.bb(ux * r1, V.sweep.h, uz * r1, 3, 3, Sp.glow, V.hot, alpha, true);
}
// ---- the laser sweep: warn (the capstone spins up, the alarm rings), then one full turn of the arm ----
function vltSweep(s, D, dt) {
  const W = D.sw, V = VLT_C, S = V.sweep;
  W.t += dt;
  if (W.st === 'idle') { W.next -= dt; if (W.next <= 0) { W.st = 'warn'; W.t = 0; W.a0 = s.rng() * TAU; W.a = W.a0; W.n++; const P = s.player; Sound.play('cartZap', { vol: 0.5, pitch: 0.5 }); if (P && !P.out) s.banner('LASER SWEEP!', '#ff4060', 1.4, 'HOP it, or hide behind a column', true); } return; }
  if (W.st === 'warn') { if (W.t >= S.warn) { W.st = 'sweep'; W.t = 0; W.mask = 0; W.pa = W.a0; Sound.play('laser', { vol: 0.8, pitch: 0.6 }); } return; }
  // sweep: test every car the arm passed this step
  W.pa = W.a; W.a = W.a0 + TAU * Math.min(1, W.t / S.dur);
  for (const k of s.karts) {
    if (k.out || (W.mask & (1 << k.slot))) continue;
    const r = Math.hypot(k.x, k.z); if (r < V.plinth + 0.5 || r > V.R + 2) continue;
    const ak = Math.atan2(k.x, k.z), d0 = cartWrap(ak - W.pa), d1 = cartWrap(ak - W.a);
    if (!(d0 >= 0 && d1 < 0 && d0 < 0.6)) continue;
    W.mask |= 1 << k.slot;
    if (vltShadow(s.E, ak, r)) { if (k.player) s.banner('SAFE IN THE SHADOW!', '#7aff8a', 0.8, null, true); continue; }
    if (k.air && k.y > s.terrain.height(k.x, k.z) + 0.45) { if (k.player) s.banner('NICE HOP!', '#7aff8a', 0.8, null, true); continue; }
    if (s.hit(k, 'spin', null, { item: 'vltlaser', dur: 0.8, banner: 'LASER SWEEP!' }) && s.fx) s.fx.spark(k.x, k.y + 1, k.z, 14, '#ff3050', 7);
  }
  if (W.t >= S.dur) { W.st = 'idle'; W.t = 0; W.next = S.period - S.warn - S.dur; }
}
// ---- the gold rush: aim at a car (the target follows it), hold still, the heap falls, stays, sinks ----
function vltDrops(s, D, dt) {
  const V = VLT_C, R = V.drop;
  for (const d of D.drops) {
    d.t += dt;
    if (d.st === 'idle') {
      d.cool -= dt; if (d.cool > 0) continue;
      let best = null, bs = -1; for (const k of s.karts) { if (k.out || k.hidden || k.invT > 0.5 || k === d.last || D.drops.some(o => o !== d && o.tgt === k)) continue; const sc = s.rng() + (k.player ? 0.15 : 0); if (sc > bs) { bs = sc; best = k; } }
      if (!best) { d.cool = 1; continue; }
      d.st = 'aim'; d.t = 0; d.tgt = best; d.x = best.x; d.z = best.z;
      if (best.player) { Sound.play('cartSparkle', { vol: 0.6, pitch: 0.8 }); s.banner('GOLD RUSH!', '#ffd84a', 1.1, 'swerve when the target stops', true); }
    } else if (d.st === 'aim') {
      const k = d.tgt; if (k && !k.out) { d.x = lerp(d.x, k.x + k.vx * 0.3, 1 - Math.exp(-8 * dt)); d.z = lerp(d.z, k.z + k.vz * 0.3, 1 - Math.exp(-8 * dt)); }
      const r = Math.hypot(d.x, d.z); if (r > V.R - 6) { d.x *= (V.R - 6) / r; d.z *= (V.R - 6) / r; }
      if (d.t > R.aim) { d.st = 'hold'; d.t = 0; }
    } else if (d.st === 'hold') { cartIxObs(s, d.x, d.z, R.r); if (d.t > R.hold) { d.st = 'fall'; d.t = 0; d.y = 30; Sound.play('throw', { vol: d.tgt && d.tgt.player ? 0.7 : 0.25, pitch: 0.7 }); } }
    else if (d.st === 'fall') {
      cartIxObs(s, d.x, d.z, R.r); const u = Math.min(1, d.t / R.fall); d.y = 30 * (1 - u * u);
      if (u >= 1) {
        d.st = 'pile'; d.t = 0; d.y = 0;
        for (const k of s.karts) { if (k.out || k.y > 3.5) continue; const dx = k.x - d.x, dz = k.z - d.z, dd = Math.hypot(dx, dz); if (dd < R.r) s.hit(k, 'knock', null, { item: 'vltcoins', dx: dx / (dd || 1), dz: dz / (dd || 1), power: 12, banner: 'GOLD RUSH!' }); }
        if (s.fx) { s.fx.burst(d.x, 1, d.z, 'star', 16, '#ffd84a'); s.fx.dust(d.x, 0.4, d.z, 14, '#c8a070'); s.fx.spark(d.x, 1, d.z, 18, '#ffe07a', 8); }
        const P = s.player; Sound.play('cartBoom', { vol: P && Math.hypot(P.x - d.x, P.z - d.z) < 40 ? 0.7 : 0.2, pitch: 1.2 }); Sound.play('pick', { vol: 0.3, pitch: 0.7 });
      }
    } else if (d.st === 'pile') { cartIxObs(s, d.x, d.z, 3.4); if (d.t > R.life) { d.st = 'sink'; d.t = 0; } }
    else if (d.st === 'sink') { d.y = -2.8 * Math.min(1, d.t / R.sink); if (d.t > R.sink) { d.st = 'idle'; d.t = 0; d.cool = 5 + s.rng() * 4; d.last = d.tgt; d.tgt = null; } }
  }
}
// ---- the mummy guards: wander, chase the nearest car (slowly), raise the arms, lunge, fall flat, get up ----
function vltMummies(s, D, dt) {
  const V = VLT_C, M = V.mum;
  for (const q of D.mums) {
    q.t += dt; if (q.cool > 0) q.cool -= dt;
    let gx = q.hx + Math.sin(q.t * 0.3 + q.i) * 14, gz = q.hz + Math.cos(q.t * 0.23 + q.i) * 14, sp = 1.6;
    if (q.st === 'walk' || q.st === 'chase') {
      let best = null, bd = M.chase; if (q.cool <= 0) for (const k of s.karts) { if (k.out || k.hidden || k.invT > 0.5) continue; const d = Math.hypot(k.x - q.x, k.z - q.z); if (d < bd) { bd = d; best = k; } }
      if (best) { q.st = 'chase'; q.tgt = best; gx = best.x; gz = best.z; sp = M.speed; if (bd < M.near) { q.st = 'raise'; q.t = 0; q.mask = 0; } }
      else if (q.st === 'chase') { q.st = 'walk'; q.tgt = null; }
      if (q.st !== 'raise') { const dx = gx - q.x, dz = gz - q.z, d = Math.hypot(dx, dz); if (d > 0.5) { q.x += dx / d * sp * dt; q.z += dz / d * sp * dt; q.yaw = Math.atan2(dx, dz); } }
      // keep off the plinth and inside the hall
      const r = Math.hypot(q.x, q.z); if (r < V.plinth + 3) { q.x *= (V.plinth + 3) / r; q.z *= (V.plinth + 3) / r; } else if (r > V.R - 8) { q.x *= (V.R - 8) / r; q.z *= (V.R - 8) / r; }
    } else if (q.st === 'raise') {
      const k = q.tgt; if (k && !k.out) { q.tx = k.x + k.vx * 0.5; q.tz = k.z + k.vz * 0.5; q.yaw = Math.atan2(q.tx - q.x, q.tz - q.z); }
      if (q.t > M.raise) { q.st = 'lunge'; q.t = 0; q.x0 = q.x; q.z0 = q.z; const P = s.player; Sound.play('throw', { vol: P && Math.hypot(P.x - q.x, P.z - q.z) < 30 ? 0.6 : 0.15, pitch: 0.6 }); }
    } else if (q.st === 'lunge') {
      const u = Math.min(1, q.t / M.lunge), dx = q.tx - q.x0, dz = q.tz - q.z0, d = Math.hypot(dx, dz) || 1, L = Math.min(M.reach, d), e = Math.sin(u * Math.PI / 2);
      q.x = q.x0 + dx / d * L * e; q.z = q.z0 + dz / d * L * e;
      for (const k of s.karts) { if (k.out || (q.mask & (1 << k.slot)) || k.y > 2) continue; if (Math.hypot(k.x - q.x, k.z - q.z) < M.grab) { q.mask |= 1 << k.slot; if (s.hit(k, 'spin', null, { item: 'vltmummy', dur: 0.9, banner: 'WRAPPED UP!' })) { k.slowT = Math.max(k.slowT || 0, 1.0); if (s.fx) s.fx.burst(k.x, k.y + 1.2, k.z, 'streak', 10, '#ece4cc'); } } }
      if (q.t > M.lunge) { q.st = 'down'; q.t = 0; if (s.fx) s.fx.dust(q.x, 0.3, q.z, 8, '#c8a070'); }
    } else if (q.st === 'down') { if (q.t > M.down) { q.st = 'up'; q.t = 0; } }
    else if (q.st === 'up') { if (q.t > M.up) { q.st = 'walk'; q.t = 0; q.cool = 2.5; q.tgt = null; } }
    if (q.st === 'walk' || q.st === 'chase' || q.st === 'raise') cartIxObs(s, q.x, q.z, q.st === 'raise' ? M.grab + 0.6 : 1.6);
  }
}

/* ---------------- the registry ---------------- */
CART_ARENAS.push({
  id: 'vault', name: 'THE VAULT', sub: 'Battle royale: a treasure chamber with a laser security system', objectives: ['royale'], royale: true, levelCar: 'pyramid',
  col: '#3aff8a', tod: 'night', blurb: 'Pyramid Scheme\'s treasure chamber. Hop the laser sweep, dodge the gold rush, outrun the mummy guards. Last car running wins.'
});
CART_ROYALE_ARENAS.pyramid = 'vault';
CART_ARENA_ICONS.vault = (ctx, s, t, col) => {
  // a gold pyramid with a sweeping laser and a green crystal on top
  ctx.save(); ctx.fillStyle = '#1a1408'; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.fill(); ctx.stroke();
  const a = t * 2.2; ctx.strokeStyle = 'rgba(255,60,80,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, s * 0.1); ctx.lineTo(Math.cos(a) * s * 0.75, s * 0.1 + Math.sin(a) * s * 0.75); ctx.stroke();
  ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(0, -s * 0.48); ctx.lineTo(s * 0.5, s * 0.38); ctx.lineTo(-s * 0.5, s * 0.38); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c89a2a'; ctx.beginPath(); ctx.moveTo(0, -s * 0.48); ctx.lineTo(s * 0.5, s * 0.38); ctx.lineTo(0, s * 0.38); ctx.closePath(); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, -s * 0.5, s * 0.1 * (1 + 0.2 * Math.sin(t * 6)), 0, TAU); ctx.fill(); ctx.restore();
};
