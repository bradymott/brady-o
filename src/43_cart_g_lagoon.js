/* ============================================================
   ART CART — secret arena: TREASURE ISLE (id 'lagoon'), DUSTY DOUBLOON's secret level
   A pirate cove whose lagoon dried up years ago: a cracked sea bed round a palm island,
   a whole galleon aground on its side, SKULL ROCK, a stone CANNON FORT that still
   lobs cannonballs (a red target ring marks each landing: steer off it), a striped
   LIGHTHOUSE, a giant ANCHOR and an OLD DOCK of planks you can drive up.
   Its own game: X MARKS THE SPOT. A treasure map names the landmark the X is buried
   near; find the red X in the sand (it shows up when you're close, the HOT/COLD meter
   helps), stop on it and dig. First to dig it up gets the chest, then a new map.
   First to 4 chests wins.
   Registers itself: CART_ARENAS, CartWorlds.arena_lagoon, CART_ARENA_RULES.lagoon,
   CART_OBJECTIVES.xmarks, CART_ARENA_ICONS.lagoon, CART_SECRET_LEVELS.galleon.
   Everything here is an original design (affectionate pirate satire, PG-13).
   ============================================================ */
const LGN_C = {
  R: 126,            // the perimeter radius
  SEE: 30,           // the X shows in the sand within this many metres
  DIG: 4.2,          // dig radius round the X
  DIG_T: 1.6,        // seconds of digging to bring the chest up
  DIG_V: 7,          // only a (nearly) stopped car digs
  GAP: 1.4,          // seconds between a chest coming up and the next map
  BALL_T: 1.7,       // cannonball flight time (the target ring warns for all of it)
  BALL_R: 4.6,       // cannonball blast radius
  red: [0.86, 0.1, 0.07], gold: [1, 0.8, 0.3], sand: [0.85, 0.7, 0.48], warn: [1, 0.25, 0.12], dark: [0.1, 0.09, 0.1], white: [1, 1, 1], beam: [1, 0.92, 0.6]
};
const LGN_P = {};   // scratch for HUD projections (no per-frame allocations)

CART_ARENAS.push({
  id: 'lagoon', name: 'TREASURE ISLE', sub: 'Dried-up pirate cove: wrecks, cannon fire and buried gold',
  objectives: ['xmarks', 'vibe', 'glow'], col: '#ffb84a', tod: 'sunset',
  blurb: 'The lagoon dried up but the pirates never left. Dodge the fort\'s cannonballs and dig up the gold where X marks the spot.'
});

/* ---------------- the world ---------------- */
CartWorlds.arena_lagoon = function (A, night) {
  const C = LGN_C, E = this.base(2043, [-150, -150, 150, 150], '#d6b483', 0.22);
  const sky = Object.assign(CART_SKIES.sunset(), { hor: '#ffa060', sky: '#88a0d0', fog: '#e0a880', fogD: 0.0044, haze: 0.3, fogMax: 0.65, clouds: 0.45, key: '#ffd8a8', keyK: 1.05, rim: '#ffb070' });
  Object.assign(E, { id: 'lagoon', arena: A, sky, tod: 'sunset', music: 'kart1', night: false });
  const api = E.api, T = E.terrain, rng = mulberry32(2043);
  // the named landmarks (the treasure maps point at these)
  const MK = E.lgnMarks = [
    { name: 'PALM ISLAND', x: 0, z: 0, r: 9 }, { name: 'THE GALLEON', x: -70, z: 44, r: 15 }, { name: 'SKULL ROCK', x: 66, z: 58, r: 8 },
    { name: 'THE CANNON FORT', x: 74, z: -44, r: 12 }, { name: 'THE LIGHTHOUSE', x: -12, z: -90, r: 6 }, { name: 'THE BIG ANCHOR', x: -86, z: -38, r: 6 },
    { name: 'THE OLD DOCK', x: 18, z: 92, r: 8 }
  ];
  // ---- ground paint: the dry lagoon bed round the island, cracks, old waterlines, shells, peg-leg prints ----
  api.paint((ctx, P, S) => {
    const c = P(0, 0);
    for (const [r, col] of [[60, 'rgba(150,150,128,0.18)'], [52, 'rgba(140,152,138,0.22)'], [44, 'rgba(128,148,140,0.26)'], [36, 'rgba(118,140,136,0.3)']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(c[0], c[1], r * S * 1.08, r * S, 0.3, 0, TAU); ctx.fill(); }
    // old waterlines: pale salt rings
    ctx.lineCap = 'round';
    for (const r of [62, 55, 47]) { ctx.strokeStyle = 'rgba(245,240,225,0.35)'; ctx.lineWidth = 0.7 * S; ctx.beginPath(); for (let i = 0; i <= 64; i++) { const a = i / 64 * TAU, rr = r + Math.sin(a * 5 + r) * 2.2, q = P(Math.sin(a) * rr * 1.08, Math.cos(a) * rr); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } ctx.stroke(); }
    // mud cracks on the sea bed
    ctx.strokeStyle = 'rgba(70,74,66,0.35)'; ctx.lineWidth = 0.22 * S;
    for (let i = 0; i < 260; i++) { const a = rng() * TAU, r = 26 + rng() * 30; let x = Math.sin(a) * r, z = Math.cos(a) * r; ctx.beginPath(); let q = P(x, z); ctx.moveTo(q[0], q[1]); for (let j = 0; j < 3; j++) { x += (rng() - 0.5) * 6; z += (rng() - 0.5) * 6; q = P(x, z); ctx.lineTo(q[0], q[1]); } ctx.stroke(); }
    // sand mottling and darker wet-looking patches
    for (let i = 0; i < 240; i++) { const x = (rng() - 0.5) * 280, z = (rng() - 0.5) * 280, q = P(x, z); ctx.fillStyle = `rgba(${rng() < 0.5 ? '150,110,70' : '250,226,180'},${0.05 + rng() * 0.08})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (2 + rng() * 8) * S, (1 + rng() * 4) * S, rng() * 3, 0, TAU); ctx.fill(); }
    // shells and starfish on the old sea bed
    for (let i = 0; i < 90; i++) { const a = rng() * TAU, r = 24 + rng() * 40, q = P(Math.sin(a) * r, Math.cos(a) * r); if (rng() < 0.5) { ctx.fillStyle = 'rgba(255,240,225,0.8)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 0.35 * S, 0.28 * S, rng() * 3, 0, TAU); ctx.fill(); } else { ctx.fillStyle = rng() < 0.5 ? 'rgba(255,120,80,0.85)' : 'rgba(255,170,90,0.85)'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const b = k / 10 * TAU, rr = (k % 2 ? 0.18 : 0.5) * S; ctx.lineTo(q[0] + Math.cos(b) * rr, q[1] + Math.sin(b) * rr); } ctx.closePath(); ctx.fill(); } }
    // a peg-leg trail: one boot print, one round hole, wandering round the island
    { let x = -30, z = 30, a = 2.2; for (let k = 0; k < 120; k++) { a += (rng() - 0.5) * 0.35 + 0.02; x += Math.sin(a) * 0.8; z += Math.cos(a) * 0.8; const side = k % 2 ? 0.3 : -0.3, q = P(x - Math.cos(a) * side, z + Math.sin(a) * side); ctx.fillStyle = 'rgba(110,80,50,0.45)'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(-a); ctx.beginPath(); if (k % 2) ctx.ellipse(0, 0, 0.16 * S, 0.34 * S, 0, 0, TAU); else ctx.arc(0, 0, 0.12 * S, 0, TAU); ctx.fill(); ctx.restore(); } }
    // the old dock's shadow of planks and the cannon fort's scorched apron
    { const q = P(74, -44); const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 20 * S); g.addColorStop(0, 'rgba(70,50,40,0.35)'); g.addColorStop(1, 'rgba(70,50,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], 20 * S, 0, TAU); ctx.fill(); }
  });
  // ---- terrain: the palm island, dunes round the rim, plank ramps, the old dock (a drive-on plank deck) ----
  T.add(CartFeat.mound(0, 0, 26, 3.8, { col: '#e2c48e', res: 1.0 }));
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.35, r = 104 + rng() * 10; T.add(CartFeat.mound(Math.sin(a) * r, Math.cos(a) * r, 14 + rng() * 6, 2.0 + rng() * 1.4, { col: '#d8b47e' })); }
  T.add(CartFeat.ramp(-36, -18, 2.6, 6, 7, 1.9, { col: '#7a5634', stripe: '#ffd84a' }));
  T.add(CartFeat.ramp(40, 14, -1.9, 6, 7, 1.9, { col: '#7a5634', stripe: '#ff5a3a' }));
  const dockYaw = Math.atan2(0 - 18, 0 - 92);   // the dock points at the island
  T.add(CartFeat.table(18 - Math.sin(dockYaw) * 6, 92 - Math.cos(dockYaw) * 6, dockYaw, 5, 14, 4, 7, 1.4, { col: '#8a6644' }));
  // ---- helpers ----
  const wood = '#6e4a2e', woodD = '#4a301e', stone = '#9a9284';
  // a palm tree: a curved ringed trunk, a crown of drooping fronds, coconuts
  const palm = (x, z, h, seed) => {
    const r2 = mulberry32(seed), lean = 0.12 + r2() * 0.22, yaw = r2() * TAU;
    CartScene.mesh(api, x, z, yaw, m => {
      const pts = []; for (let i = 0; i <= 4; i++) { const t = i / 4; pts.push([Math.sin(t * 1.2) * lean * h, t * h, 0]); }
      m.color('#8a6a48').shine(0);
      for (let i = 0; i < 4; i++) m.limb(pts[i][0], pts[i][1], pts[i][2], pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], 0.34 - i * 0.05, 0.3 - i * 0.05, { seg: 6 });
      m.color('#6a4e34'); for (let i = 1; i < 8; i++) { const t = i / 8, y = t * h, px = Math.sin(t * 1.2) * lean * h; m.torus(px, y, 0, 0.32 - t * 0.17, 0.05, { seg: 7, tseg: 3 }); }
      const top = pts[4];
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * TAU + r2() * 0.3; m.color(i % 2 ? '#3a8a3a' : '#4ea04a');
        m.push(); m.tf(top[0], top[1], top[2], a, 0.5 + r2() * 0.35, 0);
        m.ellipsoid(0, -0.35, 1.9, 0.55, 0.06, 2.0, { seg: 6, rings: 4 }); m.ellipsoid(0, -1.1, 3.6, 0.4, 0.05, 1.0, { seg: 6, rings: 3 });
        m.pop();
      }
      m.color('#5a3a1e'); for (let i = 0; i < 3; i++) { const a = i * 2.1; m.ball(top[0] + Math.sin(a) * 0.35, top[1] - 0.35, Math.cos(a) * 0.35, 0.22, { seg: 6, rings: 4 }); }
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.45, y0: 0, y1: h }] };
    }, { y: T.height(x, z) - 0.1 });
    E.art.push({ x, z, r: 0.7 });
  };
  // a pirate barrel (hooped staves) and a crate stack
  const barrel = (x, z, s) => { CartScene.mesh(api, x, z, rng() * TAU, m => { m.color('#7a5234').shine(1); m.lathe([[0, 0], [0.42, 0], [0.5, 0.5], [0.42, 1.05], [0, 1.05]], { seg: 10 }); m.color('#3a3a3e').shine(2); m.torus(0, 0.18, 0, 0.45, 0.035, { seg: 10, tseg: 3 }); m.torus(0, 0.87, 0, 0.45, 0.035, { seg: 10, tseg: 3 }); m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.5, y0: 0, y1: 1.05 }] }; }, { y: T.height(x, z), scale: s || 1, noAO: true }); };
  // a rowboat, keel up or keel down
  const rowboat = (x, z, yaw, up) => {
    CartScene.mesh(api, x, z, yaw, m => {
      m.color(up ? '#5a7a8a' : '#8a5a3a').shine(1);
      if (up) { m.ellipsoid(0, 0, 0, 1.2, 0.75, 2.7, { seg: 10, rings: 5, phi1: Math.PI / 2 }); m.color('#e8e0d0'); m.limb(0, 0.74, -2.5, 0, 0.74, 2.5, 0.07, 0.07, { seg: 4 }); }
      else { m.ellipsoid(0, 0.75, 0, 1.2, 0.75, 2.7, { seg: 10, rings: 5, phi0: Math.PI / 2 }); m.color('#5a3a22'); m.ellipsoid(0, 0.78, 0, 1.08, 0.62, 2.55, { seg: 10, rings: 4, phi0: Math.PI / 2 }); m.color('#a07a4a'); m.roundBox(0, 0.62, 0.5, 2.0, 0.08, 0.35, 0.03); m.roundBox(0, 0.62, -0.9, 1.9, 0.08, 0.35, 0.03); m.color('#c8a070'); m.limb(-0.9, 0.8, 0.3, -2.4, 0.15, 1.6, 0.05, 0.05, { seg: 4 }); }
      m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.1, hz: 2.5, y0: 0, y1: 0.8 }] };
    }, { y: T.height(x, z), noAO: true });
    E.art.push({ x, z, r: 2.2 });
  };
  // a pirate flag: pole, ragged black flag, a grinning white skull (original design: crossed spoons under it)
  const flag = (x, z, h) => {
    CartScene.mesh(api, x, z, rng() * TAU, m => {
      m.color('#5a3a22').shine(0); m.limb(0, 0, 0, 0, h, 0, 0.1, 0.07, { seg: 5 });
      m.color('#18141a'); m.surf(6, 3, (u, v, out) => { out[0] = 0.08 + u * 2.6; out[1] = h - 0.2 - v * 1.6 + Math.sin(u * 4) * 0.05; out[2] = Math.sin(u * 5 + v) * 0.18; }, {}); m.surf(6, 3, (u, v, out) => { out[0] = 0.08 + u * 2.6; out[1] = h - 0.2 - v * 1.6 + Math.sin(u * 4) * 0.05; out[2] = Math.sin(u * 5 + v) * 0.18 - 0.02; }, { flip: true });
      m.color('#f4efe0'); m.ball(1.35, h - 0.85, 0.22, 0.34, { seg: 8, rings: 5 }); m.ball(1.35, h - 1.15, 0.24, 0.2, { seg: 6, rings: 4 });
      m.limb(0.9, h - 1.45, 0.22, 1.8, h - 1.75, 0.22, 0.05, 0.05, { seg: 4 }); m.limb(1.8, h - 1.45, 0.22, 0.9, h - 1.75, 0.22, 0.05, 0.05, { seg: 4 });
      m.color('#18141a'); m.ball(1.22, h - 0.82, 0.5, 0.08, { seg: 5, rings: 3 }); m.ball(1.48, h - 0.82, 0.5, 0.08, { seg: 5, rings: 3 });
    }, { y: T.height(x, z), noAO: true });
  };

  // ---- PALM ISLAND: palms, a hammock, a sandcastle, a treasure chest (empty: the gold's been buried elsewhere) ----
  [[-6, 4, 9.5], [5, 7, 8.5], [8, -5, 10], [-7, -7, 8], [1, -11, 7.5], [-12, 1, 7], [13, 4, 7.2]].forEach(([x, z, h], i) => palm(x, z, h, 300 + i));
  CartScene.mesh(api, -0.5, 5.5, 0.3, m => { m.color('#f0e0b0').shine(0); m.surf(8, 3, (u, v, out) => { out[0] = (u - 0.5) * 9.4; out[1] = 2.2 - Math.sin(u * Math.PI) * 0.9; out[2] = (v - 0.5) * 1.4; }, {}); m.surf(8, 3, (u, v, out) => { out[0] = (u - 0.5) * 9.4; out[1] = 2.18 - Math.sin(u * Math.PI) * 0.9; out[2] = (v - 0.5) * 1.4; }, { flip: true }); m.color('#ff5a5a'); for (let i = 0; i < 4; i++) m.roundBox(-3 + i * 2, 1.32 - Math.sin((i * 2 + 1.7) / 9.4 * Math.PI) * 0.02, 0, 0.3, 0.02, 1.38, 0.01); }, { y: T.height(-0.5, 5.5) });
  CartScene.mesh(api, 3, -2, 0.5, m => {
    m.color('#6a3a22').shine(1); m.roundBox(0, 0.55, 0, 2.2, 1.1, 1.4, 0.1);
    m.color('#d8a84a').shine(2); for (const dx of [-0.75, 0.75]) m.roundBox(dx, 0.55, 0, 0.18, 1.16, 1.46, 0.04);
    m.push(); m.tf(0, 1.1, -0.7, 0, -1.2, 0); m.color('#7a4a2a').shine(1); m.roundBox(0, 0.25, 0.7, 2.2, 0.5, 1.4, 0.16); m.pop();
    m.color('#2a1a10'); m.roundBox(0, 1.05, 0, 1.9, 0.08, 1.15, 0.03);
    m.color('#f4efe0'); m.roundBox(0.3, 1.12, 0.1, 0.9, 0.02, 0.6, 0.01); m.shine(0);   // a note: "IOU"
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.1, hz: 0.7, y0: 0, y1: 1.2 }] };
  }, { y: T.height(3, -2), hi: true });
  api.sign('I.O.U.\nONE TREASURE', 5.5, -3.5, { yaw: 0.9, h: 0.8, y: 1.2, post: true, maxW: 3, style: { bg: '#f4e2b0', fg: '#5a2a10', border: '#5a2a10' } });
  E.art.push({ x: 3, z: -2, r: 1.5 });
  flag(-2, -2, 6.5);

  // ---- THE GALLEON: a whole three-master aground, heeled over, its hull planked and holed, sails in tatters ----
  CartScene.mesh(api, -70, 44, 0.55, m => {
    const L = 30, D = 5.2, hw = u => 5.2 * Math.pow(Math.sin(Math.PI * (0.06 + u * 0.88)), 0.55), dp = u => 4.6 * Math.pow(Math.sin(Math.PI * (0.04 + u * 0.92)), 0.45);
    m.push(); m.tf(0, -1.1, 0, 0, 0.04, 0.22);   // heeled over and sunk into the sand
    const hull = (u, v, out) => { const th = (v - 0.5) * Math.PI, w = hw(u), d = dp(u); out[0] = Math.sin(th) * w; out[1] = D - Math.cos(th) * d + (u > 0.82 ? (u - 0.82) * 9 : 0) + (u < 0.15 ? (0.15 - u) * 5 : 0); out[2] = (u - 0.5) * L; };
    const cf = (u, v) => { const band = Math.floor(v * 12) % 2, k = 0.72 + band * 0.1 + (Math.abs(v - 0.5) > 0.42 ? 0.12 : 0); return v > 0.88 || v < 0.12 ? [196, 152, 60] : [Math.round(112 * k), Math.round(74 * k), Math.round(48 * k)]; };
    m.color(wood).shine(0); m.surf(22, 10, hull, { out: [0, D + 1, 0], colFn: cf }); m.surf(22, 10, hull, { out: [0, D + 1, 0], flip: true, colFn: cf });
    // the deck, the stern castle with its gallery windows, the forecastle, the bowsprit
    m.color('#8a6a48'); m.roundBox(0, D + 0.2, 0, 7.6, 0.25, L * 0.86, 0.06, { uv: BURNS_ATLAS.pattern('wood') });
    m.color('#6a4428'); m.roundBox(0, D + 2.1, -L * 0.36, 8.6, 3.8, 6.4, 0.3); m.color('#c89a3a').shine(2); m.roundBox(0, D + 4.1, -L * 0.36, 9.0, 0.3, 6.8, 0.1); m.shine(0);
    m.color('#ffd27a', 0.8); for (let i = 0; i < 4; i++) m.roundBox(-2.7 + i * 1.8, D + 2.3, -L * 0.36 - 3.22, 1.1, 1.2, 0.08, 0.05); m.emissive(0);
    m.color('#6a4428'); m.roundBox(0, D + 1.2, L * 0.38, 7.0, 2.0, 4.0, 0.25);
    m.color('#5a3a22'); m.limb(0, D + 2.2, L * 0.47, 0, D + 5.5, L * 0.47 + 7, 0.3, 0.12, { seg: 6 });
    // a hole in the side, gun ports with cannons poking out
    m.color('#1a120c'); m.ellipsoid(4.9, D - 1.4, 3, 0.4, 1.4, 2.0, { seg: 8, rings: 5 });
    for (let i = 0; i < 5; i++) { const z = -8 + i * 3.6; m.color('#2a1a10'); m.roundBox(5.0, D - 0.6, z, 0.2, 0.9, 1.0, 0.05); m.color('#24242a').shine(2); m.limb(4.9, D - 0.6, z, 6.2, D - 0.6, z, 0.28, 0.24, { seg: 6 }); m.shine(0); }
    // masts (the fore mast snapped), yards and tattered sails
    m.color('#5a3a22');
    m.limb(0, D, -4, 0, D + 20, -4, 0.45, 0.25, { seg: 7 }); m.limb(0, D, 6, 0, D + 17, 6, 0.4, 0.22, { seg: 7 }); m.limb(0, D, 12, 0.6, D + 6.5, 12.4, 0.36, 0.3, { seg: 6 });
    m.limb(-5, D + 14, -4, 5, D + 14, -4, 0.14, 0.14, { seg: 5 }); m.limb(-4, D + 19, -4, 4, D + 19, -4, 0.12, 0.12, { seg: 5 }); m.limb(-4.5, D + 12, 6, 4.5, D + 12, 6, 0.13, 0.13, { seg: 5 });
    m.color('#2a1a10'); m.torus(0, D + 17, -4, 1.1, 0.25, { seg: 10, tseg: 4 }); m.roundCyl(0, D + 16.6, -4, 1.1, 0.4, 0.1, { seg: 10 });
    const sail = (x0, x1, yT, yB, z, rag) => {
      const fn = (u, v, out) => { out[0] = lerp(x0, x1, u); out[1] = lerp(yT, yB, v) + (v > 0.85 ? Math.sin(u * 17) * rag : 0); out[2] = z + Math.sin(v * Math.PI) * 1.3 * (0.6 + 0.4 * Math.sin(u * Math.PI)); };
      const cl = (u, v) => (Math.floor(u * 6 + v * 3) % 3 === 0 ? [220, 204, 170] : [236, 224, 196]);
      m.surf(8, 5, fn, { colFn: cl }); m.surf(8, 5, fn, { flip: true, colFn: cl });
    };
    m.color('#ece0c4'); sail(-4.8, 4.8, D + 13.8, D + 7.5, -4, 0.6); sail(-3.8, 3.8, D + 18.8, D + 14.4, -4, 0.3); sail(-4.3, 4.3, D + 11.8, D + 6.4, 6, 0.7);
    m.color('#5a3a22'); m.limb(0, D + 20, -4, 0, D + 5.5, L * 0.47 + 7, 0.05, 0.05, { seg: 3 }); m.limb(0, D + 20, -4, 0, D + 4.2, -L * 0.48, 0.05, 0.05, { seg: 3 });
    // the figurehead: a gilded mermaid-ish swirl and a lantern at the stern
    m.color('#d8a84a').shine(2); m.ball(0, D + 1.2, L * 0.5 + 0.6, 0.7, { seg: 8, rings: 6 }); m.limb(0, D + 1.2, L * 0.5 + 0.6, 0, D - 0.6, L * 0.5 - 0.2, 0.4, 0.2, { seg: 6 });
    m.color('#ffcc66', 0.9); m.ball(0, D + 5.0, -L * 0.36 - 3.6, 0.45, { seg: 8, rings: 5 }); m.emissive(0).shine(0);
    m.pop();
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 5.4, hz: 14.5, y0: 0, y1: D + 3 }] };
  }, { hi: true });
  E.art.push({ x: -70, z: 44, r: 6 }, { x: -70 + Math.sin(0.55) * 10, z: 44 + Math.cos(0.55) * 10, r: 5.5 }, { x: -70 - Math.sin(0.55) * 10, z: 44 - Math.cos(0.55) * 10, r: 5.5 });
  flag(-58, 36, 7);
  api.sign('THE DUSTY DOUBLOON\nPARKED. ON PURPOSE.', -56, 55, { yaw: -2.2, h: 1.0, y: 1.6, post: true, maxW: 4.2, style: { bg: '#2a1a10', fg: '#ffd27a', border: '#d8a84a' } });

  // ---- SKULL ROCK: a sun-bleached boulder with a grin, looking at the island ----
  CartScene.mesh(api, 66, 58, Math.atan2(-66, -58), m => {
    const nz = (x, y, z) => { const n = BurnsM.noise2(x * 0.35 + 7, y * 0.35 + z * 0.2); const k = 0.82 + n * 0.25; return [Math.round(218 * k), Math.round(204 * k), Math.round(176 * k)]; };
    m.color('#d8ccb0').shine(0);
    m.ellipsoid(0, 5.6, 0, 6.2, 5.8, 6.0, { seg: 16, rings: 10, colFn: nz });
    m.ellipsoid(0, 2.0, 1.6, 4.6, 2.6, 4.4, { seg: 14, rings: 7, colFn: nz });   // the jaw
    m.color('#2a1c16'); m.ellipsoid(-2.3, 6.2, 5.0, 1.55, 1.75, 1.2, { seg: 10, rings: 6 }); m.ellipsoid(2.3, 6.2, 5.0, 1.55, 1.75, 1.2, { seg: 10, rings: 6 });
    m.ellipsoid(0, 4.0, 5.6, 0.7, 0.9, 0.6, { seg: 8, rings: 5 });
    m.color('#3a2a20'); m.roundBox(0, 2.6, 5.4, 6.0, 0.9, 0.8, 0.3);
    m.color('#f4ecd8'); for (let i = 0; i < 6; i++) m.roundBox(-2.5 + i, 2.65, 5.75, 0.8, 0.95, 0.5, 0.15);
    m.color('#ffd84a', 0.9); m.ball(-2.3, 6.2, 5.6, 0.3, { seg: 6, rings: 4 }); m.ball(2.3, 6.2, 5.6, 0.3, { seg: 6, rings: 4 }); m.emissive(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0.8, r: 6.4, y0: 0, y1: 11 }] };
  }, { hi: true });
  E.art.push({ x: 66, z: 58, r: 7 });
  api.sign('SKULL ROCK\n(IT\'S SMILING)', 54, 48, { yaw: Math.atan2(-54, -48) + Math.PI, h: 0.9, y: 1.5, post: true, maxW: 3.2, style: { bg: '#f4e2b0', fg: '#2a1a10', border: '#2a1a10' } });

  // ---- THE CANNON FORT: a low stone wall on an arc, crenellated, three cannons aimed at the island ----
  const FX = 74, FZ = -44, fa = Math.atan2(-FX, -FZ);   // facing the island
  for (let i = -4; i <= 4; i++) {
    const a = fa + i * 0.19, x = FX + Math.sin(a) * 9, z = FZ + Math.cos(a) * 9;
    CartScene.mesh(api, x, z, a, m => {
      const nz = (px, py, pz) => { const k = 0.78 + BurnsM.noise2(px * 0.9 + i * 3, py * 0.9 + pz * 0.7) * 0.3; return [Math.round(154 * k), Math.round(146 * k), Math.round(132 * k)]; };
      m.color(stone).shine(0); m.roundBox(0, 1.1, 0, 2.0, 2.2, 1.4, 0.18);
      if (i % 2 === 0) m.roundBox(0, 2.55, 0, 1.3, 0.9, 1.3, 0.14); else m.roundBox(0, 2.25, -0.35, 1.9, 0.3, 0.6, 0.1);
      m.color('#7a7266'); m.roundBox(0, 0.2, 0.2, 2.1, 0.4, 1.6, 0.1);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.0, hz: 0.7, y0: 0, y1: 2.6 }] };
    }, { noAO: false });
    E.art.push({ x, z, r: 1.3 });
  }
  for (let i = -1; i <= 1; i++) {
    const a = fa + i * 0.42, x = FX + Math.sin(a) * 6.6, z = FZ + Math.cos(a) * 6.6;
    CartScene.mesh(api, x, z, a, m => {
      m.color('#7a5634').shine(0); m.roundBox(0, 0.55, -0.3, 1.5, 0.6, 2.4, 0.1); m.color('#5a3e26'); m.roundBox(0, 1.05, -0.8, 1.2, 0.5, 1.2, 0.08);
      m.color('#3a2818'); for (const sx of [-0.85, 0.85]) for (const sz of [-1.0, 0.6]) { m.push(); m.tf(sx, 0.42, sz, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.32, 0.1, { seg: 10, tseg: 4 }); m.pop(); }
      m.color('#26262c').shine(2); m.limb(0, 1.35, -1.4, 0, 1.7, 2.0, 0.55, 0.38, { seg: 10 }); m.torus(0, 1.7, 2.0, 0.4, 0.1, { seg: 10, tseg: 4, sy: 1 }); m.ball(0, 1.32, -1.5, 0.5, { seg: 8, rings: 5 }); m.shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.8, hz: 1.4, y0: 0, y1: 1.6 }] };
    }, { hi: true });
    E.art.push({ x, z, r: 1.6 });
  }
  // a pyramid of cannonballs and the powder kegs
  CartScene.mesh(api, FX + Math.sin(fa + 1.6) * 4, FZ + Math.cos(fa + 1.6) * 4, 0, m => { m.color('#2a2a30').shine(2); let n = 0; for (let l = 0; l < 3; l++) for (let i = 0; i < 3 - l; i++) for (let j = 0; j < 3 - l; j++) { m.ball((i - (2 - l) / 2) * 0.56, 0.28 + l * 0.46, (j - (2 - l) / 2) * 0.56, 0.28, { seg: 7, rings: 5 }); n++; } m.shine(0); }, { noAO: true });
  barrel(FX + Math.sin(fa - 1.7) * 4, FZ + Math.cos(fa - 1.7) * 4, 1); barrel(FX + Math.sin(fa - 1.95) * 4.6, FZ + Math.cos(fa - 1.95) * 4.6, 0.9);
  flag(FX - Math.sin(fa) * 2, FZ - Math.cos(fa) * 2, 8);
  E.lgnFort = { x: FX + Math.sin(fa) * 8.6, z: FZ + Math.cos(fa) * 8.6, y: 2.6 };
  api.sign('CANNON FORT\nKEEP MOVING', FX + Math.sin(fa + 0.8) * 13, FZ + Math.cos(fa + 0.8) * 13, { yaw: fa + Math.PI, h: 0.9, y: 1.5, post: true, maxW: 3.2, style: { bg: '#2a1a10', fg: '#ff8a5a', border: '#ff8a5a' } });

  // ---- THE LIGHTHOUSE: red and white bands, a gallery, the lamp room (its beam turns in the arena draw) ----
  CartScene.mesh(api, -12, -90, 0, m => {
    const bands = 6, H = 16;
    for (let i = 0; i < bands; i++) { const y0 = i / bands * H, y1 = (i + 1) / bands * H, r0 = 3.4 - y0 * 0.11, r1 = 3.4 - y1 * 0.11; m.color(i % 2 ? '#f4efe6' : '#d8323a').shine(1); m.lathe([[r0, y0], [r1, y1]], { seg: 16 }); }
    m.color('#5a5a62').shine(2); m.roundCyl(0, H, 0, 2.6, 0.3, 0.1, { seg: 16 }); m.torus(0, H + 1.1, 0, 2.5, 0.06, { seg: 16, tseg: 3 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; m.limb(Math.sin(a) * 2.5, H + 0.3, Math.cos(a) * 2.5, Math.sin(a) * 2.5, H + 1.1, Math.cos(a) * 2.5, 0.04, 0.04, { seg: 3 }); }
    m.color('#ffe8a0', 1); m.roundCyl(0, H + 0.3, 0, 1.6, 2.2, 0.1, { seg: 12 }); m.emissive(0);
    m.color('#8a1a22').shine(1); m.lathe([[1.9, H + 2.5], [1.0, H + 3.6], [0, H + 4.4]], { seg: 12 }); m.roundCyl(0, H + 2.4, 0, 1.95, 0.2, 0.05, { seg: 12 });
    m.color('#2a1a10'); m.roundBox(0, 1.1, 3.25, 1.2, 2.2, 0.3, 0.1);
    m.shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.5, y0: 0, y1: H }] };
  }, { hi: true });
  E.art.push({ x: -12, z: -90, r: 3.8 });
  E.lgnLamp = { x: -12, y: 17.4, z: -90 };
  api.glow(-12, 17.4, -90, 5, '#ffe8a0');
  for (const [x, z] of [[-4, -84], [-20, -82], [-6, -97]]) barrel(x, z, 1);

  // ---- THE BIG ANCHOR: stuck fluke-first in the sand, its chain trailing off ----
  CartScene.mesh(api, -86, -38, 0.9, m => {
    m.push(); m.tf(0, 0, 0, 0, 0, 0.32);
    m.color('#4a4a52').shine(2);
    m.limb(0, -1.2, 0, 0, 9, 0, 0.42, 0.38, { seg: 8 });
    m.limb(-3.8, 9.3, 0, 3.8, 9.3, 0, 0.3, 0.3, { seg: 6 }); m.ball(-3.8, 9.3, 0, 0.42, { seg: 6, rings: 4 }); m.ball(3.8, 9.3, 0, 0.42, { seg: 6, rings: 4 });
    m.push(); m.tf(0, 10.3, 0, 0, 0, 0); m.torus(0, 0, 0, 0.9, 0.22, { seg: 12, tseg: 5 }); m.pop();
    m.surf(10, 5, (u, v, out) => { const a = Math.PI * (0.15 + u * 0.7) + Math.PI, r = 3.6 + Math.cos(v * TAU) * 0.32; out[0] = Math.cos(a) * r; out[1] = Math.sin(a) * r + 2.6; out[2] = Math.sin(v * TAU) * 0.32; }, { wrapV: true, out: [0, 2.6, 0] });
    for (const sx of [-1, 1]) { const a = Math.PI * (sx < 0 ? 1.15 : 1.85); m.push(); m.tf(Math.cos(a) * 3.6, Math.sin(a) * 3.6 + 2.6, 0, 0, 0, sx * 0.6); m.ellipsoid(0, 0.7, 0, 1.0, 1.2, 0.18, { seg: 8, rings: 4 }); m.pop(); }
    m.pop();
    m.color('#5a5058').shine(1); for (let i = 0; i < 9; i++) { const x = 1.2 + i * 0.75, z = Math.sin(i * 0.8) * 0.9; m.push(); m.tf(x, 0.15, z, i * 0.9, 0, i % 2 ? Math.PI / 2 : 0); m.torus(0, 0, 0, 0.32, 0.08, { seg: 8, tseg: 3, sy: 1 }); m.pop(); }
    m.shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.6, y0: 0, y1: 10 }] };
  }, { hi: true });
  E.art.push({ x: -86, z: -38, r: 2.2 });
  api.sign('ANCHORS AWAY\n(NOT THIS ONE)', -76, -30, { yaw: -2.2, h: 0.9, y: 1.5, post: true, maxW: 3.2, style: { bg: '#1a2a3a', fg: '#9af0ff', border: '#ffffff' } });

  // ---- THE OLD DOCK: posts and rope rails along the plank deck, rowboats, crates, a lantern post ----
  {
    const fx = Math.sin(dockYaw), fz = Math.cos(dockYaw), rx = fz, rz = -fx, cx = 18 - fx * 6, cz = 92 - fz * 6;
    for (let i = -3; i <= 3; i++) for (const sd of [-1, 1]) {
      const x = cx + fx * i * 3.4 + rx * sd * 4.0, z = cz + fz * i * 3.4 + rz * sd * 4.0;
      CartScene.mesh(api, x, z, 0, m => { m.color('#5a3e26').shine(0); m.limb(0, 0, 0, 0, T.height(cx, cz) + 1.6, 0, 0.18, 0.15, { seg: 6 }); m.color('#c8a46a'); m.torus(0, T.height(cx, cz) + 1.3, 0, 0.2, 0.05, { seg: 6, tseg: 3 }); }, { noAO: true });
    }
    for (const sd of [-1, 1]) CartScene.mesh(api, cx + rx * sd * 4.0, cz + rz * sd * 4.0, dockYaw, m => { m.color('#c8a46a').shine(0); for (let i = -3; i < 3; i++) { const z0 = i * 3.4, z1 = (i + 1) * 3.4, y = T.height(cx, cz) + 1.3; m.surf(4, 1, (u, v, out) => { out[0] = 0; out[1] = y - Math.sin(u * Math.PI) * 0.3 + v * 0.05; out[2] = lerp(z0, z1, u); }, {}); m.limb(0, y, z0, 0, y - 0.15, (z0 + z1) / 2, 0.05, 0.05, { seg: 3 }); m.limb(0, y - 0.15, (z0 + z1) / 2, 0, y, z1, 0.05, 0.05, { seg: 3 }); } }, { noAO: true });
    rowboat(cx + rx * 9 + fx * 4, cz + rz * 9 + fz * 4, dockYaw + 0.4, false); rowboat(cx - rx * 9 - fx * 2, cz - rz * 9 - fz * 2, dockYaw - 0.3, true);
    for (const [a, d] of [[0.6, 11], [0.9, 12.5]]) { const x = cx + Math.sin(dockYaw + a) * d, z = cz + Math.cos(dockYaw + a) * d; CartScene.prop(api, 'crate', { x, z, yaw: a, s: 1.1 }); E.art.push({ x, z, r: 0.9 }); }
    api.sign('NO SWIMMING\n(NO WATER)', cx - rx * 6 + fx * 8, cz - rz * 6 + fz * 8, { yaw: dockYaw + Math.PI, h: 0.9, y: 1.5, post: true, maxW: 3.2, style: { bg: '#f4e2b0', fg: '#2a1a10', border: '#2a1a10' } });
  }

  // ---- more of the cove: rowboats on the sea bed, palm clumps, barrels, bones, the rim signs ----
  rowboat(-30, 28, 1.2, true); rowboat(34, -30, -0.4, false); rowboat(20, 40, 2.4, false);
  [[-100, 10], [-96, 22], [96, 14], [92, 2], [40, -100], [50, -96], [-48, 98], [-40, 104], [88, 70], [-104, -62]].forEach(([x, z], i) => palm(x, z, 7 + (i % 3) * 1.4, 400 + i));
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.15, r = 80 + (i % 3) * 7; const x = Math.sin(a) * r, z = Math.cos(a) * r; if (MK.some(p => Math.hypot(p.x - x, p.z - z) < p.r + 6)) continue; barrel(x, z, 1); E.art.push({ x, z, r: 0.7 }); }
  const signs = ['HERE BE\nBURNERS', 'X MARKS\nTHE SPOT (SOMEWHERE)', 'WALK THE PLANK\nTHURSDAYS 9PM', 'LOW TIDE\nSINCE 1987'];
  signs.forEach((t, i) => { const a = i / 4 * TAU + 0.75, x = Math.sin(a) * 112, z = Math.cos(a) * 112; api.sign(t, x, z, { yaw: a + Math.PI, h: 1.0, y: 1.7, post: true, maxW: 3.4, style: { bg: ['#2a1a10', '#f4e2b0', '#1a2a3a', '#f4e2b0'][i], fg: ['#ffd27a', '#8a1a10', '#9af0ff', '#2a1a10'][i], border: '#ffffff' } }); });
  // ---- the perimeter: a driftwood palisade with rope between the posts ----
  const poly = []; for (let i = 0; i < 30; i++) { const a = i / 30 * TAU; poly.push([Math.sin(a) * C.R, Math.cos(a) * C.R]); }
  E.walls = poly;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]);
    CartScene.mesh(api, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, yaw, m => {
      const n = 4; m.color('#8a7258').shine(0);
      for (let j = 0; j < n; j++) { const z = -L / 2 + (j + 0.5) * L / n, h = 1.7 + ((i * 7 + j * 3) % 5) * 0.12; m.limb(0, 0, z, ((j + i) % 2 ? 0.08 : -0.08), h, z, 0.2, 0.15, { seg: 5 }); }
      m.color('#c8a46a'); for (const y of [0.7, 1.35]) m.surf(5, 1, (u, v, out) => { out[0] = 0; out[1] = y - Math.sin(u * Math.PI) * 0.18 + v * 0.06; out[2] = -L / 2 + u * L; }, {}), m.surf(5, 1, (u, v, out) => { out[0] = 0; out[1] = y - Math.sin(u * Math.PI) * 0.18 + v * 0.06; out[2] = -L / 2 + u * L; }, { flip: true });
    }, { noAO: true });
  }
  // the cast (the crowd watches from the dunes) and the outer ring of beach huts
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 1.2, x = Math.sin(a) * 117, z = Math.cos(a) * 117; for (let k = 0; k < 12; k++) E.spots.push({ x: x + (rng() - 0.5) * 14, z: z + (rng() - 0.5) * 5, yaw: a + Math.PI + (rng() - 0.5) * 0.5 }); }
  let ni = 11; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.5; CartScene.camp(api, Math.sin(a) * 140, Math.cos(a) * 140, a + Math.PI, rng, false, ni++); }
  E.heroes.push({ type: 'badideaguy', x: 6, z: 10, yaw: 2.6, anim: 'dare' }, { type: 'burney', x: -60, z: 34, yaw: 0.8, anim: 'photo' }, { type: 'sparklepony', x: 58, z: 46, yaw: -2.4, anim: 'cheer' }, { type: 'furry', x: 64, z: -34, yaw: -0.8, anim: 'wave' }, { type: 'deathguild', x: -78, z: -30, yaw: 1.5, anim: 'cheer' });

  // ---- objective spots ----
  E.zones = [{ x: 0, z: 0, r: 10, name: 'PALM ISLAND' }, { x: -50, z: 30, r: 9, name: 'THE GALLEON' }, { x: 52, z: 44, r: 9, name: 'SKULL ROCK' }, { x: 54, z: -32, r: 9, name: 'THE FORT' }];
  const clear = (x, z, m) => Math.hypot(x, z) < 110 && E.art.every(a => Math.hypot(a.x - x, a.z - z) > a.r + m);
  for (let i = 0; i < 60 && E.orbSpots.length < 46; i++) { const a = rng() * TAU, r = 14 + rng() * 92, x = Math.sin(a) * r, z = Math.cos(a) * r; if (clear(x, z, 2)) E.orbSpots.push({ x, z }); }
  E.flagSpots = [{ x: 0, z: 26 }, { x: -40, z: -14 }, { x: 40, z: -8 }];
  E.captures = [{ x: -50, z: 66, r: 9 }, { x: 48, z: -66, r: 9 }, { x: 74, z: 20, r: 9 }, { x: -64, z: -64, r: 9 }];
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.2, r = i % 2 ? 40 : 76; E.gifts.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; E.spawn.push({ x: Math.sin(a) * 62, z: Math.cos(a) * 62, yaw: a + Math.PI }); }
  // dig spots: a ring round each landmark, clear of every prop, inside the fence
  E.lgnSpots = [];
  MK.forEach((p, mi) => { for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + mi, d = p.r + 8 + (i % 3) * 3.5, x = p.x + Math.sin(a) * d, z = p.z + Math.cos(a) * d; if (clear(x, z, 4) && E.spawn.every(q => Math.hypot(q.x - x, q.z - z) > 8)) E.lgnSpots.push({ x, z, mark: mi }); } });
  return this.finish(E);
};

/* ---------------- the rules: the cannon fort, the lighthouse beam, the digging brakes ---------------- */
CART_ARENA_RULES.lagoon = {
  music: 'kart1',
  onLoad(s) {
    s.lgn = { next: 5 + s.rng() * 2, ball: { on: false, t: 0, x0: 0, y0: 0, z0: 0, tx: 0, ty: 0, tz: 0, x: 0, y: 0, z: 0 }, fired: 0 };
  },
  // AI cars (and the test autopilot) brake on the X so they can dig
  onStep(s, k, dt, racing) {
    const X = s.lgnX; if (!X || !X.on || k.out || !k.ai || (k.player && !s.autoDrive)) return;
    const d = Math.hypot(X.x - k.x, X.z - k.z), inp = k.inp;
    if (d < LGN_C.DIG - 0.6) { inp.gas = 0; inp.brake = k.speed > 2.5 ? 1 : 0; inp.drift = false; inp.driftPress = false; }
    else if (d < 10) { inp.gas = k.speed > 8 ? 0 : 0.7; inp.brake = k.speed > 12 ? 0.8 : 0; inp.drift = false; inp.driftPress = false; }
  },
  // the fort lobs a cannonball at a car every few seconds: a red target ring warns for the whole flight
  onUpdate(s, dt, racing) {
    const L = s.lgn, B = L && L.ball, F = s.E.lgnFort; if (!L || !F) return;
    if (B.on) {
      B.t += dt; const u = Math.min(1, B.t / LGN_C.BALL_T);
      B.x = lerp(B.x0, B.tx, u); B.z = lerp(B.z0, B.tz, u); B.y = lerp(B.y0, B.ty, u) + 4 * 24 * u * (1 - u);
      if (u >= 1) {
        B.on = false;
        s.fx.burst(B.tx, B.ty + 0.6, B.tz, 'puff', 14, '#d8b48a'); s.fx.spark(B.tx, B.ty + 0.5, B.tz, 12, '#ffb060', 9); s.fx.smoke(B.tx, B.ty + 1, B.tz, 6, '#6a5a4a');
        const near = Math.hypot(s.cam.x - B.tx, s.cam.z - B.tz) < 45; Sound.play('cartBoom', { vol: near ? 0.6 : 0.2, pitch: 0.75 });
        if (s.player && Math.hypot(s.player.x - B.tx, s.player.z - B.tz) < 16) s.shakeIt(0.6);
        if (racing && !(s.obj && s.obj.ended)) for (const k of s.karts) { if (k.out || k.air && k.y > B.ty + 3) continue; const dx = k.x - B.tx, dz = k.z - B.tz, d = Math.hypot(dx, dz); if (d < LGN_C.BALL_R) { if (s.hit(k, 'knock', null, { dx: dx / (d || 1), dz: dz / (d || 1), power: 13, item: 'cannonball', banner: 'CANNONBALL!' })) s.log('cannonball', { k: k.id }); } }
      }
      return;
    }
    if (!racing || (s.obj && s.obj.ended)) return;
    L.next -= dt; if (L.next > 0) return;
    L.next = 4.5 + s.rng() * 2.5;
    // a target: a car within the fort's range, aimed where it will be (dodging is the point)
    let tg = null, n = 0;
    for (const k of s.karts) { if (k.out || Math.hypot(k.x - F.x, k.z - F.z) > 120) continue; n++; if (s.rng() * n < 1) tg = k; }
    if (!tg) return;
    const lead = LGN_C.BALL_T * 0.55;
    B.tx = clamp(tg.x + tg.vx * lead, -110, 110); B.tz = clamp(tg.z + tg.vz * lead, -110, 110); B.ty = s.terrain.height(B.tx, B.tz);
    B.x0 = B.x = F.x; B.z0 = B.z = F.z; B.y0 = B.y = F.y; B.t = 0; B.on = true; L.fired++;
    s.fx.smoke(F.x, F.y + 1, F.z, 8, '#d8d0c0'); s.fx.spark(F.x, F.y + 0.6, F.z, 10, '#ffb060', 8);
    Sound.play('cartBoom', { vol: Math.hypot(s.cam.x - F.x, s.cam.z - F.z) < 60 ? 0.45 : 0.15, pitch: 1.25 });
    if (tg.player) s.banner('INCOMING!', '#ff6a3a', 0.9, 'steer off the red ring', true);
  },
  draw(s, R, S, t) {
    const C = LGN_C, L = s.lgn, cam = s.cam;
    // the lighthouse beam: two long soft streaks turning slowly
    const Lm = s.E.lgnLamp;
    if (Lm) for (let i = 0; i < 2; i++) { const a = t * 0.6 + i * Math.PI, dx = Math.sin(a), dz = Math.cos(a); R.bbs.streak(Lm.x + dx * 15, Lm.y, Lm.z + dz * 15, dx, -0.04, dz, 30, 4.5, S.streak, C.beam, 0.32); R.bbs.bb(Lm.x, Lm.y, Lm.z, 7, 7, S.glow, C.beam, 0.6, true); }
    // the cannonball, its shadow and the target ring
    if (L && L.ball.on) {
      const B = L.ball, u = Math.min(1, B.t / C.BALL_T), pulse = 0.6 + 0.4 * Math.sin(t * 18);
      R.flat.flat(B.tx, B.ty + 0.12, B.tz, C.BALL_R * 2, C.BALL_R * 2, t * 2, S.ring, C.warn, 0.55 + 0.4 * pulse, true);
      R.flat.flat(B.tx, B.ty + 0.1, B.tz, C.BALL_R * 2 * u, C.BALL_R * 2 * u, 0, S.glow, C.warn, 0.35, true);
      R.flat.flat(B.tx, B.ty + 0.13, B.tz, 2.4, 2.4, Math.PI / 4, S.cross, C.warn, 0.9, true);
      const gy = s.terrain.height(B.x, B.z); R.flat.flat(B.x, gy + 0.08, B.z, 1.6 + u * 1.2, 1.6 + u * 1.2, 0, S.shadow, C.dark, 0.4 + u * 0.4, false);
      R.bbs.bb(B.x, B.y, B.z, 1.5, 1.5, S.core, C.dark, 1, false);
      R.bbs.bb(B.x + 0.4, B.y + 0.5, B.z, 0.9, 0.9, S.spark, [1, 0.7, 0.3], 0.9, true, t * 9);
      if (Math.random() < 0.7) s.fx.add(B.x, B.y, B.z, 0, 0.4, 0, 0.7, 0.5, 1.4, [0.75, 0.72, 0.68], 0.45, 'smoke', 4);
    }
  },
  lights(s, add) {
    const L = s.lgn; if (L && L.ball.on) add(L.ball.tx, L.ball.ty + 1, L.ball.tz, 10, [1, 0.3, 0.15], 0.8, 1.2);
    const X = s.lgnX; if (X && X.on && s.player && Math.hypot(s.player.x - X.x, s.player.z - X.z) < LGN_C.SEE) add(X.x, X.y + 1.5, X.z, 9, [1, 0.75, 0.3], 0.7, 1.2);
  }
};

/* ---------------- X MARKS THE SPOT ---------------- */
CART_OBJECTIVES.xmarks = {
  name: 'X MARKS THE SPOT', short: 'Dig up the buried gold', time: 120, goal: 4, unit: ' chests',
  desc: 'The map names a landmark. Find the red X near it (HOT / COLD helps), stop on it and dig. First to 4 chests wins.',
  fx: {
    init(s) {
      const E = s.E;
      s.lgnX = { on: false, x: 0, z: 0, y: 0, mark: -1, last: -1, gap: 2.0, round: 0, spots: E.lgnSpots || [], marks: E.lgnMarks || [{ name: 'THE MIDDLE', x: 0, z: 0, r: 8 }], chestT: 0, cx: 0, cz: 0, cy: 0, winner: null };
      for (const k of s.karts) { k.score = 0; k.lgnDig = 0; k.lgnSpin = (k.slot % 2 ? 1 : -1); }
    },
    // a new map: a spot near a different landmark than last time
    place(s) {
      const X = s.lgnX, n = X.spots.length;
      if (!n) { X.x = (s.rng() - 0.5) * 120; X.z = (s.rng() - 0.5) * 120; X.mark = 0; }
      else { let p = null; for (let tries = 0; tries < 30; tries++) { p = X.spots[Math.floor(s.rng() * n)]; if (p.mark !== X.last) break; } X.x = p.x; X.z = p.z; X.mark = p.mark; }
      X.last = X.mark; X.y = s.terrain.height(X.x, X.z); X.on = true; X.round++;
      for (const k of s.karts) k.lgnDig = 0;
      s.log('xmap', { mark: X.marks[X.mark].name, x: +X.x.toFixed(1), z: +X.z.toFixed(1) });
      if (X.round > 1) Sound.play('kartFinalLap', { vol: 0.4 });
      s.banner('NEW MAP!', '#ffd27a', 1.4, 'X is near ' + X.marks[X.mark].name, true);
    },
    update(s, dt) {
      const C = LGN_C, X = s.lgnX, K = s.karts, G = CART_OBJECTIVES.xmarks.goal;
      if (X.chestT > 0) X.chestT -= dt;
      if (!X.on) { X.gap -= dt; if (X.gap <= 0) this.place(s); return false; }
      let done = null;
      for (const k of K) {
        if (k.out) { k.lgnDig = 0; continue; }
        const d = Math.hypot(k.x - X.x, k.z - X.z);
        if (d < C.DIG && k.speed < C.DIG_V && !k.air && k.spinT <= 0 && k.flipT <= 0) {
          if (k.lgnDig === 0 && k.player) Sound.play('stomp', { vol: 0.5, pitch: 0.7 });
          k.lgnDig += dt;
          // sand flies off the shovel
          if (Math.random() < 0.6) { const a = Math.random() * TAU; s.fx.add(k.x + Math.sin(a) * 1.2, X.y + 0.4, k.z + Math.cos(a) * 1.2, Math.sin(a) * 2.5, 4 + Math.random() * 3, Math.cos(a) * 2.5, 0.8, 0.5, 0.25, C.sand, 0.95, 'dot', 2); }
          if (k.player && Math.floor(k.lgnDig * 3) !== Math.floor((k.lgnDig - dt) * 3)) Sound.play('stomp', { vol: 0.35, pitch: 0.9 + k.lgnDig * 0.3 });
          if (k.lgnDig >= C.DIG_T && (!done || k.lgnDig > done.lgnDig)) done = k;
        } else k.lgnDig = Math.max(0, k.lgnDig - dt * 2.5);
      }
      if (done) {
        done.score++; done.cheerT = 1.2; X.on = false; X.gap = C.GAP; X.chestT = 2.2; X.cx = X.x; X.cz = X.z; X.cy = X.y; X.winner = done;
        s.log('chest', { k: done.id, n: done.score, player: done.player });
        s.fx.confetti(X.x, X.y + 2, X.z, 30); s.fx.burst(X.x, X.y + 1.5, X.z, 'star', 20, '#ffd84a'); s.fx.spark(X.x, X.y + 1, X.z, 16, '#ffd84a', 10);
        s.banner(done.player ? 'TREASURE!' : done.car.name + ' FOUND IT', done.player ? '#ffd84a' : '#ff9a3a', 1.5, done.score + ' / ' + G);
        Sound.play(done.player ? 'kartFinish' : 'kartLap', { vol: 0.6 }); if (done.player) Sound.play('pick', { vol: 0.8, pitch: 0.8 });
        for (const k of K) k.lgnDig = 0;
      }
      return K.some(k => k.score >= G);
    },
    // getting hit knocks the shovel out of your hands
    onHit(s, k) { if (k.lgnDig > 0) { k.lgnDig = 0; if (k.player) s.banner('SHOVEL DROPPED!', '#ff6a6a', 0.9, null, true); } },
    // AI: like the player, it knows the landmark; it sees the X once it's close, and circles the landmark till then
    aiGoal(s, k, nearestRival) {
      const X = s.lgnX; if (!X || !X.on) { const r = nearestRival(); return r ? { prey: r } : null; }
      const d = Math.hypot(X.x - k.x, X.z - k.z);
      if (d < LGN_C.SEE) {
        // a rival digging right there: ram them off it (heavy cars more often)
        if (d < 12) for (const o of s.karts) if (o !== k && !o.out && o.lgnDig > 0.5 && o.lgnDig > k.lgnDig && k.lgnDig === 0 && (k.slot % 3 === 0)) return { goal: [o.x, o.z] };
        return { goal: [X.x, X.z] };
      }
      const M = X.marks[X.mark], dm = Math.hypot(M.x - k.x, M.z - k.z), ring = M.r + 11;
      if (dm > ring + 8) return { goal: [M.x + (k.x - M.x) / dm * ring, M.z + (k.z - M.z) / dm * ring] };
      const a = Math.atan2(k.x - M.x, k.z - M.z) + 0.9 * k.lgnSpin;
      return { goal: [M.x + Math.sin(a) * ring, M.z + Math.cos(a) * ring] };
    },
    rank(s) { return s.karts.slice().sort((a, b) => (b.score - a.score) || ((b.lgnDig || 0) - (a.lgnDig || 0)) || (b.hitsDealt - a.hitsDealt)); },
    score(k) { return k.score; },
    // the X in the sand (only up close), the dig ring, the chest popping up
    draw(s, R, S, t) {
      const C = LGN_C, X = s.lgnX, cam = s.cam; if (!X) return;
      if (X.on) {
        const k = s.player, dv = Math.hypot(k.x - X.x, k.z - X.z), vis = clamp((C.SEE + 4 - dv) / 8, 0, 1);
        if (vis > 0) {
          const y = X.y + 0.1, w = 1 + 0.06 * Math.sin(t * 4);
          R.flat.flat(X.x, y - 0.02, X.z, 7.5, 7.5, 0, S.shadow, [0.35, 0.22, 0.1], 0.35 * vis, false);
          R.flat.flat(X.x, y, X.z, 6.2 * w, 6.2 * w, Math.PI / 4, S.cross, C.red, 0.95 * vis, false);
          R.flat.flat(X.x, y + 0.01, X.z, 6.2 * w, 6.2 * w, Math.PI / 4, S.cross, [1, 0.45, 0.2], 0.35 * vis, true);
          if (Math.random() < 0.25 * vis) s.fx.glint(X.x + (Math.random() - 0.5) * 3, y + 0.5 + Math.random(), X.z + (Math.random() - 0.5) * 3, '#ffe08a');
        }
        // dig progress rings (each digger's colour), seen by everyone
        for (const q of s.karts) if (q.lgnDig > 0.05 && q._in) { const u = clamp(q.lgnDig / C.DIG_T, 0, 1), col = burnsRGBf(q.car.col); R.flat.flat(X.x, X.y + 0.14, X.z, 2.6 + u * 6, 2.6 + u * 6, -t * 3, S.ring, col, 0.5 + u * 0.5, true); R.bbs.bb(q.x, q.y + (q.M ? q.M.h : 3) + 1.4, q.z, 1.2 + u, 1.2 + u, S.star, C.gold, 0.5 + u * 0.5, true, t * 3); }
      }
      // the chest pops out of the hole and spills gold
      if (X.chestT > 0) {
        const u = 1 - X.chestT / 2.2, y = X.cy + Math.min(1, u * 4) * 2.4 + Math.sin(t * 6) * 0.1, a = Math.min(1, X.chestT * 2);
        R.bbs.bb(X.cx, y, X.cz, 2.4, 2.4, S.glow, C.gold, 0.9 * a, true);
        R.bbs.bb(X.cx, y, X.cz, 1.2, 1.2, S.star, C.gold, a, true, t * 2);
        R.flat.flat(X.cx, X.cy + 0.08, X.cz, 4, 4, 0, S.shadow, C.dark, 0.6 * a, false);
        if (Math.random() < 0.5) s.fx.add(X.cx, y, X.cz, (Math.random() - 0.5) * 5, 5 + Math.random() * 3, (Math.random() - 0.5) * 5, 1.0, 0.45, 0.35, C.gold, 1, 'dot', 2 | 1);
      }
    },
    // the treasure map card: where, how warm, the arrow, the dig meter
    hud(s, ctx, top, left) {
      const C = LGN_C, X = s.lgnX, k = s.player; if (!X || !k || s.state !== 'race') return false;
      const W = Game.cssW, H = Game.cssH, portrait = H > W, cy = portrait ? top + 160 : top + 64, cw = Math.min(250, W * 0.42), cx = W / 2;
      ctx.save();
      // the map card (parchment, a torn-ish edge)
      ctx.fillStyle = 'rgba(244,226,176,0.92)'; burnsRR(ctx, cx - cw / 2, cy - 4, cw, 40, 9); ctx.fill();
      ctx.strokeStyle = 'rgba(120,70,30,0.8)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); burnsRR(ctx, cx - cw / 2 + 3, cy - 1, cw - 6, 34, 7); ctx.stroke(); ctx.setLineDash([]);
      if (!X.on) { BurnsUI.text(ctx, 'DRAWING A NEW MAP…', cx, cy + 16, 12, '#5a2a10', { ui: true, stroke: false }); ctx.restore(); return false; }
      const d = Math.hypot(k.x - X.x, k.z - X.z), M = X.marks[X.mark];
      BurnsUI.text(ctx, 'X IS NEAR ' + M.name, cx, cy + 8, 12, '#5a2a10', { ui: true, stroke: false });
      // HOT / COLD
      const heat = clamp(1 - (d - 4) / 80, 0, 1), lab = d < C.DIG ? 'ON THE X!' : d < 16 ? 'HOT!' : d < 32 ? 'WARM' : d < 60 ? 'COOL' : 'COLD';
      const bw = cw - 96, bx = cx - cw / 2 + 12, by = cy + 22;
      ctx.fillStyle = 'rgba(90,50,20,0.25)'; burnsRR(ctx, bx, by, bw, 7, 3.5); ctx.fill();
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, '#5ab0ff'); g.addColorStop(0.5, '#ffb040'); g.addColorStop(1, '#ff2a1a');
      ctx.fillStyle = g; burnsRR(ctx, bx, by, Math.max(7, bw * heat), 7, 3.5); ctx.fill();
      BurnsUI.text(ctx, lab, bx + bw + 42, by + 3, 12, d < 16 ? (Math.floor(s.time * 6) % 2 ? '#ff2a1a' : '#c81a10') : d < 32 ? '#d86a10' : '#2a6ab0', { ui: true, stroke: false });
      // the arrow: to the landmark until the X is in sight, then to the X
      const near = d < C.SEE, tx = near ? X.x : M.x, tz = near ? X.z : M.z, ty = near ? X.y + 2.5 : s.terrain.height(M.x, M.z) + 12;
      if (d > 5 && s.R.project(tx, ty, tz, W, H, LGN_P)) {
        const ax = clamp(LGN_P.x, 30, W - 30), ay = clamp(LGN_P.y, 70, H - 120);
        ctx.translate(ax, ay); ctx.fillStyle = near ? '#ff3a1a' : '#ffd27a'; ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(-10, -6); ctx.lineTo(10, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
        if (near) { ctx.strokeStyle = '#ff3a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, -22); ctx.lineTo(6, -10); ctx.moveTo(6, -22); ctx.lineTo(-6, -10); ctx.stroke(); }
        ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
      }
      // digging: a big shovel meter in the middle; close but too fast: tell them to stop
      if (k.lgnDig > 0.02) {
        const u = clamp(k.lgnDig / C.DIG_T, 0, 1), mx = W / 2, my = H * (portrait ? 0.42 : 0.36), r = 26;
        ctx.fillStyle = 'rgba(30,16,8,0.55)'; ctx.beginPath(); ctx.arc(mx, my, r + 8, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(mx, my, r, -Math.PI / 2, -Math.PI / 2 + TAU * u); ctx.stroke();
        BurnsUI.text(ctx, 'DIG!', mx, my, 14, '#ffffff', { ui: true });
        BurnsUI.text(ctx, 'HOLD STILL', mx, my + r + 18, 11, '#ffd84a', { ui: true });
      } else if (d < C.DIG + 2 && k.speed >= C.DIG_V) BurnsUI.text(ctx, 'STOP ON THE X TO DIG', W / 2, H * (portrait ? 0.42 : 0.36), 15, '#ffd84a', { glow: '#ff6a00' });
      ctx.restore();
      return false;
    }
  }
};

/* ---------------- the menu card icon: a palm, an island and a red X ---------------- */
CART_ARENA_ICONS.lagoon = (ctx, s, t, col) => {
  ctx.save();
  ctx.fillStyle = rgba(col, 0.9); ctx.beginPath(); ctx.ellipse(0, s * 0.62, s * 0.95, s * 0.3, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = Math.max(2, s * 0.1); ctx.beginPath(); ctx.moveTo(-s * 0.35, s * 0.55); ctx.quadraticCurveTo(-s * 0.3, -s * 0.1, -s * 0.05, -s * 0.55); ctx.stroke();
  ctx.fillStyle = '#4ea04a'; const sw = Math.sin(t * 2) * 0.08;
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.7 + sw; ctx.beginPath(); ctx.ellipse(-s * 0.05 + Math.cos(a) * s * 0.3, -s * 0.55 + Math.sin(a) * s * 0.18 + s * 0.06, s * 0.34, s * 0.09, a, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#e8281a'; ctx.lineWidth = Math.max(2.5, s * 0.14); ctx.lineCap = 'round'; const p = 0.85 + 0.15 * Math.sin(t * 5);
  ctx.beginPath(); ctx.moveTo(s * (0.4 - 0.2 * p), s * (0.55 - 0.13 * p)); ctx.lineTo(s * (0.4 + 0.2 * p), s * (0.55 + 0.13 * p)); ctx.moveTo(s * (0.4 + 0.2 * p), s * (0.55 - 0.13 * p)); ctx.lineTo(s * (0.4 - 0.2 * p), s * (0.55 + 0.13 * p)); ctx.stroke();
  ctx.restore();
};

/* ---------------- Dusty Doubloon's secret level (43_cart_h_career.js reads this) ---------------- */
var CART_SECRET_LEVELS = (typeof CART_SECRET_LEVELS !== 'undefined' && CART_SECRET_LEVELS) || {};
CART_SECRET_LEVELS.galleon = { arena: 'lagoon', game: 'xmarks' };
