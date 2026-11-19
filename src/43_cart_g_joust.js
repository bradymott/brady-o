/* ============================================================
   ART CART — secret arena: THE GILDED ROOST (id 'joust'), Sir Scorchalot's level
   A dragon's castle courtyard at sunset: a ring of crenellated curtain
   walls with four round towers, flagstones scorched in spirals, a drivable
   MOUNTAIN OF GOLD in the middle, four overflowing treasure chests that
   keep spitting coins, jousting tilt rails to dodge round, braziers and
   dragon banners. Every car has its own NEST (a giant twig nest on the
   courtyard's edge, flying the owner's colours).
   Its own game: DRAGON'S HOARD. Scoop up loose gold (carry up to 6), bring it
   home to your nest to bank it; a hit spills what you carry. Park in a
   rival's unguarded nest to RAID their hoard, coin by coin; sit in your own
   nest and nobody can touch it. The Crown on the gold mountain is worth 5.
   Biggest hoard when the bell rings wins.
   Everything here is an original design (affectionate satire, PG-13).
   Registers itself: CART_ARENAS (no royale flag), CartWorlds.arena_joust,
   CART_ARENA_RULES.joust, CART_OBJECTIVES.hoard, CART_ARENA_ICONS.joust and
   CART_SECRET_LEVELS.dragon. Globals JST_*, scene state s.jst, world E.jst.
   ============================================================ */

const JST_C = {
  WALL_R: 92, NEST_R: 66, NEST_IN: 5.6, CHEST_R: 36, MOUND_R: 14, MOUND_H: 2.8,
  CAP: 6, COINS: 40, START_COINS: 26, RAID_T: 0.55, CROWN_V: 5, CROWN_FIRST: 18, CROWN_EVERY: 26,
  NAMES: ['EMBER NEST', 'CINDER NEST', 'SOOT NEST', 'ASH NEST', 'FLARE NEST', 'BLAZE NEST', 'SMOKE NEST', 'SPARK NEST']
};
const JST_GOLD = [1, 0.78, 0.25], JST_RED = [1, 0.3, 0.25], JST_P = {};   // HUD projection scratch
function jstNestPos(i) { const a = i / 8 * TAU + Math.PI / 8; return [Math.sin(a) * JST_C.NEST_R, Math.cos(a) * JST_C.NEST_R, a]; }
function jstChestPos(i) { const a = i / 4 * TAU + Math.PI / 4 + Math.PI / 8; return [Math.sin(a) * JST_C.CHEST_R, Math.cos(a) * JST_C.CHEST_R, a]; }
// a kart's banner colour (a near-black car flies its second colour)
function jstCol(k) { const c = k.car.col; return (c === '#2a2236' || c === '#1a1a22') && k.car.col2 ? k.car.col2 : c; }

/* ---------------- meshes ---------------- */
function jstCoinMesh(m, s) {
  m.color('#ffc83a', 0.22).shine(3);
  m.push(); m.tf(0, 0, 0, 0, 0, Math.PI / 2); m.roundCyl(0, -0.09 * s, 0, 0.62 * s, 0.18 * s, 0.05 * s, { seg: 14 }); m.pop();
  m.color('#fff0a0', 0.4); m.push(); m.tf(0, 0, 0, 0, 0, Math.PI / 2); m.torus(0, 0.1 * s, 0, 0.42 * s, 0.05 * s, { seg: 12, tseg: 4 }); m.torus(0, -0.1 * s, 0, 0.42 * s, 0.05 * s, { seg: 12, tseg: 4 }); m.pop();
  m.emissive(0).shine(0);
}
function jstPileMesh(m) {
  // a heap of gold: a domed pile, coins sliding off it, a goblet and a gem (scaled by the hoard's size at run time)
  m.color('#e8a820', 0.12).shine(3); m.ellipsoid(0, 0, 0, 2.2, 1.3, 2.2, { seg: 14, rings: 6, phi1: Math.PI / 2 });
  m.color('#ffd050', 0.2);
  for (let i = 0; i < 9; i++) { const a = i * 2.39, r = 0.6 + (i % 3) * 0.55, y = Math.sqrt(Math.max(0, 1 - (r / 2.2) * (r / 2.2))) * 1.3; m.push(); m.tf(Math.sin(a) * r, y, Math.cos(a) * r, a, 0.5 + (i % 2) * 0.3, 0); m.roundCyl(0, -0.06, 0, 0.42, 0.12, 0.04, { seg: 10 }); m.pop(); }
  m.color('#ffe070', 0.15); m.push(); m.tf(0.5, 1.15, -0.2, 0, 0.25, 0); m.lathe([[0, 0], [0.32, 0], [0.12, 0.12], [0.08, 0.5], [0.42, 0.75], [0.46, 1.1], [0.4, 1.1], [0, 0.85]], { seg: 10 }); m.pop();
  m.color('#ff3a6a', 0.6); m.ball(-0.6, 1.25, 0.4, 0.28, { seg: 8, rings: 5 }); m.color('#3ae0ff', 0.6); m.ball(0.2, 1.3, 0.8, 0.22, { seg: 8, rings: 5 });
  m.emissive(0).shine(0);
}
function jstCrownMesh(m) {
  m.color('#ffd23a', 0.3).shine(3);
  m.lathe([[0.95, 0], [1.05, 0.05], [1.05, 0.55], [0.95, 0.6], [0.9, 0.3]], { seg: 16 });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, x = Math.sin(a), z = Math.cos(a); m.limb(x * 1.0, 0.5, z * 1.0, x * 1.05, 1.35, z * 1.05, 0.2, 0.05, { seg: 5 }); m.color('#fff4c0', 0.5); m.ball(x * 1.05, 1.4, z * 1.05, 0.12, { seg: 6, rings: 4 }); m.color('#ffd23a', 0.3); }
  m.color('#e0204a', 0.7); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.52; m.ball(Math.sin(a) * 1.06, 0.3, Math.cos(a) * 1.06, 0.14, { seg: 6, rings: 4 }); }
  m.color('#9a1a3a', 0.2); m.ellipsoid(0, 0.4, 0, 0.88, 0.6, 0.88, { seg: 12, rings: 5, phi1: Math.PI / 2 });
  m.emissive(0).shine(0);
}

/* ---------------- the world ---------------- */
CartWorlds.arena_joust = function (A, night) {
  const C = JST_C, E = this.base(2043, [-150, -150, 150, 150], '#a89a86', 0.12);
  const sky = Object.assign(CART_SKIES.sunset(), { hor: '#ff8a4a', sky: '#9a88c8', fog: '#c88a74', fogD: 0.0046, key: '#ffcfa0', keyK: 1.05, rim: '#ff9a5a', clouds: 0.6 });
  Object.assign(E, { id: 'joust', arena: A, sky, tod: 'sunset', music: 'kart2', night: false, R: C.WALL_R - 6 });
  const api = E.api, T = E.terrain, rng = mulberry32(4343);
  E.jst = { nests: [], chests: [] };
  for (let i = 0; i < 8; i++) { const p = jstNestPos(i); E.jst.nests.push({ x: p[0], z: p[1], a: p[2], name: C.NAMES[i] }); }
  for (let i = 0; i < 4; i++) { const p = jstChestPos(i); E.jst.chests.push({ x: p[0], z: p[1], a: p[2] }); }
  const tilts = [0, 1, 2, 3].map(i => { const a = i / 4 * TAU + Math.PI / 4 - Math.PI / 8 + Math.PI / 4; return [Math.sin(a) * 52, Math.cos(a) * 52, a]; });
  const clearOf = (x, z, r) => Math.hypot(x, z) > C.MOUND_R + r && E.jst.chests.every(c => Math.hypot(x - c.x, z - c.z) > 3.5 + r) && E.jst.nests.every(n => Math.hypot(x - n.x, z - n.z) > C.NEST_IN + 1 + r) && tilts.every(t => Math.hypot(x - t[0], z - t[1]) > 9 + r);
  // ---- ground: polar flagstones, scorch spirals, gold dust round the mound, the nests' straw aprons ----
  api.paint((ctx, P, S) => {
    const c = P(0, 0);
    ctx.fillStyle = 'rgba(120,104,88,0.25)'; ctx.beginPath(); ctx.arc(c[0], c[1], C.WALL_R * S, 0, TAU); ctx.fill();
    for (let r = 3; r < C.WALL_R; r += 3.2) {
      const n = Math.max(6, Math.round(TAU * r / 3.4)), off = rng() * TAU;
      for (let i = 0; i < n; i++) {
        const a0 = off + i / n * TAU + 0.025, a1 = off + (i + 1) / n * TAU - 0.025, r0 = r - 1.45, r1 = r + 1.45, v = rng();
        ctx.fillStyle = `rgba(${150 + v * 50 | 0},${134 + v * 44 | 0},${116 + v * 36 | 0},${0.55 + rng() * 0.3})`;
        ctx.beginPath(); ctx.arc(c[0], c[1], r1 * S, -a1 + Math.PI / 2, -a0 + Math.PI / 2); ctx.arc(c[0], c[1], r0 * S, -a0 + Math.PI / 2, -a1 + Math.PI / 2, true); ctx.closePath(); ctx.fill();
      }
    }
    // scorch spirals (a careless dragon's sneezes)
    for (let s = 0; s < 7; s++) { let a = rng() * TAU, r = 20 + rng() * 55; const x0 = Math.sin(a) * r, z0 = Math.cos(a) * r; ctx.strokeStyle = 'rgba(40,24,18,0.35)'; ctx.lineWidth = 1.6 * S; ctx.beginPath(); for (let i = 0; i < 40; i++) { const u = i / 40, rr = u * 7, q = P(x0 + Math.sin(u * 12 + a) * rr, z0 + Math.cos(u * 12 + a) * rr); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } ctx.stroke(); const q = P(x0, z0); const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 8 * S); g.addColorStop(0, 'rgba(30,18,12,0.45)'); g.addColorStop(1, 'rgba(30,18,12,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], 8 * S, 0, TAU); ctx.fill(); }
    // gold dust round the mountain of gold, glints
    { const g = ctx.createRadialGradient(c[0], c[1], C.MOUND_R * 0.6 * S, c[0], c[1], (C.MOUND_R + 9) * S); g.addColorStop(0, 'rgba(255,200,60,0.55)'); g.addColorStop(1, 'rgba(255,200,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c[0], c[1], (C.MOUND_R + 9) * S, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 260; i++) { const a = rng() * TAU, r = C.MOUND_R + Math.pow(rng(), 2) * 30, q = P(Math.sin(a) * r, Math.cos(a) * r); ctx.fillStyle = `rgba(255,${200 + rng() * 40 | 0},80,${0.4 + rng() * 0.4})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], 0.35 * S, 0.22 * S, rng() * 3, 0, TAU); ctx.fill(); }
    // straw aprons and a painted ring under each nest
    for (const n of E.jst.nests) { const q = P(n.x, n.z); ctx.fillStyle = 'rgba(200,160,80,0.45)'; ctx.beginPath(); ctx.arc(q[0], q[1], (C.NEST_IN + 2.5) * S, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(160,110,50,0.6)'; ctx.lineWidth = 0.12 * S; for (let i = 0; i < 70; i++) { const a = rng() * TAU, r = rng() * (C.NEST_IN + 2.6), x = n.x + Math.sin(a) * r, z = n.z + Math.cos(a) * r, b = rng() * TAU, p0 = P(x, z), p1 = P(x + Math.sin(b) * 1.2, z + Math.cos(b) * 1.2); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); } }
    // the lists: a sandy jousting lane under each tilt rail
    for (const t of tilts) { const q = P(t[0], t[1]); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(-t[2]); ctx.fillStyle = 'rgba(214,180,130,0.55)'; ctx.beginPath(); ctx.ellipse(0, 0, 13 * S, 5 * S, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  });
  // ---- the mountain of gold (drivable) with goblets, a chest, a stack of plates and a dragon weathervane ----
  T.add(CartFeat.mound(0, 0, C.MOUND_R, C.MOUND_H, { col: '#e8b030', res: 0.9 }));
  CartScene.mesh(api, 0, 0, 0, m => {
    const hAt = r => C.MOUND_H * 0.5 * (1 + Math.cos(Math.min(1, r / C.MOUND_R) * Math.PI));
    m.color('#ffcc40', 0.12).shine(3);
    for (let i = 0; i < 70; i++) { const a = i * 2.39996, r = 1.5 + Math.sqrt(i / 70) * (C.MOUND_R - 2.5), y = hAt(r) + 0.05; m.push(); m.tf(Math.sin(a) * r, y, Math.cos(a) * r, a, 0.2 + (i % 5) * 0.12, (i % 3) * 0.3); m.roundCyl(0, -0.05, 0, 0.55, 0.1, 0.03, { seg: 8 }); m.pop(); }
    m.color('#ffe070', 0.15);
    for (const [x, z, s] of [[5, 3, 1.3], [-4, 6, 1.0], [-6, -4, 1.4], [3, -7, 1.1]]) { m.push(); m.tf(x, hAt(Math.hypot(x, z)) - 0.1, z, x, 0.15, 0, s); m.lathe([[0, 0], [0.4, 0], [0.15, 0.15], [0.1, 0.6], [0.5, 0.9], [0.55, 1.35], [0.48, 1.35], [0, 1.05]], { seg: 10 }); m.pop(); }
    m.color('#7a4a24').shine(1); m.push(); m.tf(-7.5, hAt(7.5) - 0.2, 2, 0.6, 0.12, 0); m.roundBox(0, 0.55, 0, 2.6, 1.1, 1.6, 0.12); m.color('#ffd040', 0.3).shine(3); m.ellipsoid(0, 1.1, 0, 1.2, 0.5, 0.7, { seg: 10, rings: 4, phi1: Math.PI / 2 }); m.color('#5a3418').shine(1); m.push(); m.tf(0, 1.1, -0.8, 0, -1.1, 0); m.roundBox(0, 0, 0.75, 2.6, 0.18, 1.5, 0.08); m.pop(); m.pop();
    // the dragon weathervane on a pole at the summit (the crown sits just in front of it)
    m.color('#5a4a3a').shine(2); m.limb(0, C.MOUND_H - 0.3, -2.2, 0, C.MOUND_H + 7, -2.2, 0.14, 0.08, { seg: 6 });
    m.color('#2ab060', 0.15).shine(2); m.push(); m.tf(0, C.MOUND_H + 7.4, -2.2, 0.6);
    m.ellipsoid(0, 0, 0, 0.35, 0.35, 1.3, { seg: 8, rings: 5 }); m.limb(0, 0.1, 1.0, 0, 0.7, 1.7, 0.22, 0.16, { seg: 6 }); m.ellipsoid(0, 0.8, 2.0, 0.28, 0.24, 0.45, { seg: 8, rings: 4 }); m.limb(0, 0, -1.1, 0, 0.4, -2.4, 0.18, 0.03, { seg: 5 });
    m.color('#7aff8a', 0.3); for (const sd of [-1, 1]) { m.push(); m.tf(sd * 0.3, 0.2, 0.1, 0, 0, sd * 0.5); m.roundBox(sd * 1.0, 0, 0, 1.8, 0.05, 1.0, 0.03); m.pop(); }
    m.color('#ffd84a', 0.9); m.ball(0.12, 0.9, 2.3, 0.06, { seg: 5, rings: 3 }); m.ball(-0.12, 0.9, 2.3, 0.06, { seg: 5, rings: 3 });
    m.pop(); m.emissive(0).shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: -2.2, r: 0.3, y0: 0, y1: 10 }] };
  }, { hi: true });
  api.light(0, 0, 26, '#ffc860', 0.55);
  // ---- the four treasure chests that spill coins ----
  for (const c of E.jst.chests) {
    CartScene.mesh(api, c.x, c.z, c.a + Math.PI, m => {
      m.color('#6a3c1c').shine(1); m.roundBox(0, 0.9, 0, 3.6, 1.8, 2.4, 0.18);
      m.color('#c89a3a').shine(3); for (const x of [-1.5, 0, 1.5]) m.roundBox(x, 0.9, 0, 0.22, 1.86, 2.46, 0.05); m.roundBox(0, 1.75, 0, 3.66, 0.14, 2.46, 0.04);
      m.color('#ffcc40', 0.35); m.ellipsoid(0, 1.8, 0, 1.6, 0.7, 1.05, { seg: 12, rings: 5, phi1: Math.PI / 2 });
      for (let i = 0; i < 6; i++) { m.push(); m.tf(-1.2 + i * 0.5, 0.15, 1.6 + (i % 2) * 0.5, i, 1.4, 0); m.roundCyl(0, 0, 0, 0.4, 0.1, 0.03, { seg: 8 }); m.pop(); }
      m.color('#5a3418').shine(1); m.push(); m.tf(0, 1.8, -1.2, 0, -1.25, 0); m.roundBox(0, 0.1, 1.2, 3.6, 0.2, 2.4, 0.1); m.color('#c89a3a').shine(3); m.roundBox(0, 0.22, 1.2, 0.5, 0.1, 2.44, 0.04); m.pop();
      m.color('#e0204a', 0.8); m.ball(0, 2.3, 0, 0.3, { seg: 8, rings: 5 }); m.emissive(0).shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.9, hz: 1.3, y0: 0, y1: 2 }] };
    }, { hi: true });
    api.glow(c.x, 2.3, c.z, 3.2, '#ffd060'); api.light(c.x, c.z, 10, '#ffc060', 0.5); E.art.push({ x: c.x, z: c.z, r: 2.6 });
  }
  // ---- jousting tilt rails: a long padded barrier on striped posts with shields hung on it ----
  for (const [x, z, a] of tilts) {
    const yaw = a + Math.PI / 2;
    CartScene.mesh(api, x, z, yaw, m => {
      for (let i = 0; i <= 6; i++) { const u = -7.5 + i * 2.5; m.color(i % 2 ? '#e8d8b8' : '#c8302a').shine(1); m.limb(0, 0, u, 0, 1.7, u, 0.14, 0.12, { seg: 6 }); m.color('#ffd84a').shine(3); m.ball(0, 1.8, u, 0.18, { seg: 6, rings: 4 }); }
      m.color('#8a5a32').shine(1); m.roundBox(0, 1.25, 0, 0.32, 0.36, 15.4, 0.12); m.roundBox(0, 0.55, 0, 0.22, 0.24, 15.4, 0.08);
      for (let i = 0; i < 3; i++) { const u = -5 + i * 5, sd = i % 2 ? 1 : -1, col = ['#2ab060', '#c8302a', '#3a5ad8'][i]; m.push(); m.tf(sd * 0.22, 1.0, u, sd > 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI / 2, 0); m.color(col).shine(2); m.lathe([[0, 0.02], [0.7, 0.02], [0.75, 0], [0.7, -0.02], [0, -0.04]], { seg: 3 }); m.color('#ffd84a').shine(3); m.torus(0, 0, 0, 0.72, 0.05, { seg: 3, tseg: 4 }); m.pop(); }
      m.shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.35, hz: 7.8, y0: 0, y1: 1.6 }] };
    }, { hi: true });
    E.art.push({ x: x + Math.sin(yaw) * 5, z: z + Math.cos(yaw) * 5, r: 2.4 }, { x, z, r: 2.4 }, { x: x - Math.sin(yaw) * 5, z: z - Math.cos(yaw) * 5, r: 2.4 });
  }
  // ---- the nests: big twig rings with a perch post (the owner's banner flies over it at run time) ----
  for (const n of E.jst.nests) {
    CartScene.mesh(api, n.x, n.z, n.a, m => {
      const R = C.NEST_IN + 0.9;
      m.color('#8a5a2a').shine(0); m.torus(0, 0.45, 0, R, 0.75, { seg: 26, tseg: 6 });
      m.color('#a8743a'); for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, b = a + 0.5 + (i % 3) * 0.12, y0 = 0.3 + (i % 2) * 0.5; m.limb(Math.sin(a) * (R + 0.4), y0, Math.cos(a) * (R + 0.4), Math.sin(b) * (R - 0.3), 1.0 - (i % 2) * 0.4, Math.cos(b) * (R - 0.3), 0.08, 0.06, { seg: 4 }); }
      m.color('#c89a5a'); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + 0.2; m.limb(Math.sin(a) * (R - 0.6), 1.05, Math.cos(a) * (R - 0.6), Math.sin(a + 0.3) * (R + 0.9), 0.2, Math.cos(a + 0.3) * (R + 0.9), 0.06, 0.04, { seg: 4 }); }
      // perch post on the outer side, with a curled iron hook and a lantern
      m.color('#3a3036').shine(2); m.limb(0, 0, R + 1.4, 0, 6.2, R + 1.4, 0.16, 0.11, { seg: 6 }); m.limb(0, 6.0, R + 1.4, 0, 6.2, R + 0.2, 0.07, 0.06, { seg: 4 });
      m.color('#ffb050', 0.9); m.push(); m.tf(0, 5.1, R + 0.2); m.lathe([[0, 0], [0.22, 0.04], [0.3, 0.35], [0.22, 0.65], [0, 0.7]], { seg: 8 }); m.pop(); m.emissive(0).shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: R + 1.4, r: 0.3, y0: 0, y1: 6 }] };
    }, { hi: true });
    const R = C.NEST_IN + 0.9, px = n.x + Math.sin(n.a) * (R + 0.2), pz = n.z + Math.cos(n.a) * (R + 0.2);
    api.glow(px, 5.45, pz, 1.5, '#ffb050');
    // twig ring collision: the posts round the rim (an open nest: drive in over the low side)
    E.art.push({ x: n.x + Math.sin(n.a) * (R + 1.4), z: n.z + Math.cos(n.a) * (R + 1.4), r: 0.8 });
  }
  // ---- braziers round the courtyard ----
  E.jst.braziers = [];
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU, r = i % 2 ? 80 : 24, x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (!clearOf(x, z, 1.5) && r < 30) continue;
    CartScene.mesh(api, x, z, a, m => { m.color('#3a3036').shine(2); for (let j = 0; j < 3; j++) { const b = j / 3 * TAU; m.limb(Math.sin(b) * 0.7, 0, Math.cos(b) * 0.7, Math.sin(b) * 0.35, 1.6, Math.cos(b) * 0.35, 0.07, 0.06, { seg: 4 }); } m.lathe([[0, 1.5], [0.5, 1.55], [0.75, 1.95], [0.8, 2.05], [0.7, 2.05], [0, 1.9]], { seg: 10 }); m.color('#ff7a2a', 1); m.ellipsoid(0, 2.0, 0, 0.6, 0.18, 0.6, { seg: 8, rings: 3 }); m.emissive(0).shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.6, y0: 0, y1: 2.1 }] }; }, { noAO: true });
    api.glow(x, 2.6, z, 2.4, '#ff9a3a'); api.light(x, z, 9, '#ff9a3a', 0.6); E.art.push({ x, z, r: 1.0 }); E.jst.braziers.push([x, z]);
  }
  // ---- the curtain wall: 20 stone panels with crenellations, slits, dragon banners; four round towers ----
  const NW = 20, poly = [];
  for (let i = 0; i < NW; i++) { const a = i / NW * TAU; poly.push([Math.sin(a) * C.WALL_R, Math.cos(a) * C.WALL_R]); }
  E.walls = poly;
  for (let i = 0; i < NW; i++) {
    const p0 = poly[i], p1 = poly[(i + 1) % NW], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), cx = (p0[0] + p1[0]) / 2, cz = (p0[1] + p1[1]) / 2, yaw = Math.atan2(p1[0] - p0[0], p1[1] - p0[1]);
    const ox = cx * 1.016, oz = cz * 1.016;
    CartScene.mesh(api, ox, oz, yaw, m => {
      m.color(i % 2 ? '#a89a8a' : '#9c8e80').shine(0); m.roundBox(0, 2.6, 0, 1.8, 5.2, L + 0.6, 0.25);
      m.color('#b4a696'); m.roundBox(0, 0.35, 0, 2.2, 0.7, L + 0.6, 0.2);
      const n = Math.round(L / 2.4); m.color('#a89888'); for (let j = 0; j < n; j++) { const u = -L / 2 + (j + 0.5) * L / n; m.roundBox(0, 5.65, u, 1.8, 0.9, L / n * 0.55, 0.14); }
      m.color('#4a3e38'); for (let j = 0; j < 3; j++) m.roundBox(0.86, 3.1, -L / 3 + j * L / 3, 0.1, 1.1, 0.3, 0.05);
      // a hanging banner on every other panel: green with a gold dragon-wing chevron
      if (i % 2 === 0) { m.color('#1e8a4a').shine(1); m.roundBox(0.98, 3.2, 0, 0.08, 3.4, 2.6, 0.04); m.color('#ffd23a', 0.2).shine(3); m.push(); m.tf(1.04, 3.5, 0, 0, 0, 0); m.roundBox(0, 0, -0.45, 0.04, 0.28, 1.3, 0.03); m.pop(); m.push(); m.tf(1.04, 3.5, 0); m.roundBox(0, 0.4, 0, 0.04, 1.2, 0.26, 0.03); m.pop(); m.color('#c8302a').shine(1); m.roundBox(1.0, 1.4, 0, 0.06, 0.25, 2.6, 0.02); m.emissive(0); }
      m.shine(0);
    }, { noAO: true });
  }
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU, x = Math.sin(a) * (C.WALL_R + 2), z = Math.cos(a) * (C.WALL_R + 2);
    CartScene.mesh(api, x, z, a, m => {
      m.color('#a09282').shine(0); m.lathe([[0, 0], [6.4, 0], [6.0, 2], [5.6, 13], [6.4, 13.3], [6.4, 15], [0, 15]], { seg: 18 });
      m.color('#988a7a'); for (let j = 0; j < 9; j++) { const b = j / 9 * TAU; m.roundBox(Math.sin(b) * 6.0, 15.6, Math.cos(b) * 6.0, 1.6, 1.3, 1.6, 0.18); }
      m.color('#8a2a24').shine(1); m.push(); m.tf(0, 15, 0); m.lathe([[0, 0], [5.4, 0], [4.2, 2.5], [2.0, 6.5], [0, 9.5]], { seg: 16 }); m.pop();
      m.color('#3a3036').shine(2); m.limb(0, 24, 0, 0, 27, 0, 0.1, 0.06, { seg: 5 }); m.color('#2ab060').shine(1); m.roundBox(0.9, 26.4, 0, 1.8, 0.9, 0.05, 0.03);
      m.color('#ffc860', 0.9); for (let j = 0; j < 4; j++) { const b = j / 4 * TAU + 0.4; m.roundBox(Math.sin(b) * 5.95, 9 + (j % 2) * 2, Math.cos(b) * 5.95, 0.7, 1.4, 0.7, 0.3); }
      m.emissive(0).shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 6.2, y0: 0, y1: 15 }] };
    }, { hi: true });
    api.glow(x, 26.4, z, 2.2, '#7aff8a', { blink: 3 });
  }
  // ---- beyond the walls: three far keeps on the horizon ----
  for (const [a, r, h] of [[1.1, 136, 36], [3.9, 140, 30], [5.6, 132, 24]]) { const x = Math.sin(a) * r, z = Math.cos(a) * r; CartScene.mesh(api, x, z, 0, m => { m.color('#6a6070'); m.lathe([[0, 0], [7, 0], [6, h], [7.4, h + 1], [0, h + 1]], { seg: 10 }); m.color('#5a2a3a'); m.push(); m.tf(0, h + 1, 0); m.lathe([[0, 0], [7, 0], [0, 12]], { seg: 10 }); m.pop(); m.color('#ffc860', 0.8); m.roundBox(0, h * 0.7, 6.4, 1, 2, 0.4, 0.2); m.emissive(0); }, { noAO: true }); }
  // ---- the cast: a fire spinner by the gold, a lamplighter and an artist by the nests ----
  E.heroes.push({ type: 'firespinner', x: 18, z: -9, yaw: -1.2, anim: 'firespin' }, { type: 'lamplighter', x: -70, z: 30, yaw: 1.2, anim: 'lantern' }, { type: 'playaartist', x: 54, z: 54, yaw: -2.4, anim: 'cheer' }, { type: 'burney', x: -40, z: -72, yaw: 0.5, anim: 'photo' });
  // ---- objective spots: zones (the mound + the chests), orbs, gifts, flags, captures (the nests), the grid ----
  E.zones = [{ x: 0, z: 0, r: 11, name: 'THE GOLD MOUNTAIN' }].concat(E.jst.chests.map((c, i) => ({ x: c.x, z: c.z, r: 8, name: ['THE RUBY CHEST', 'THE EMERALD CHEST', 'THE SAPPHIRE CHEST', 'THE TOPAZ CHEST'][i] })));
  for (let i = 0; i < 46; i++) { let x = 0, z = 0; for (let t = 0; t < 30; t++) { const a = rng() * TAU, r = 8 + Math.sqrt(rng()) * 74; x = Math.sin(a) * r; z = Math.cos(a) * r; if (clearOf(x, z, 1.5) || (Math.hypot(x, z) < C.MOUND_R - 3 && Math.hypot(x, z + 2.2) > 2)) break; } E.orbSpots.push({ x, z }); }
  E.jst.coinSpots = E.orbSpots.filter(p => clearOf(p.x, p.z, 1));
  E.flagSpots = [{ x: 0, z: 22 }, { x: 22, z: -40 }, { x: -46, z: -12 }, { x: 30, z: 60 }];
  E.captures = E.jst.nests.filter((n, i) => i % 2 === 0).map(n => ({ x: n.x, z: n.z, r: 7 }));
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.12, r = i % 2 ? 26 : 50; E.gifts.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.spawn = E.jst.nests.map(n => { const x = n.x * 0.82, z = n.z * 0.82; return { x, z, yaw: Math.atan2(-x, -z) }; });
  return this.finish(E);
};

/* ---------------- state helpers ---------------- */
function jstState(s) {
  if (s.jst) return s.jst;
  const E = s.E, J = E.jst;
  s.jst = { nests: J.nests.map((n, i) => ({ x: n.x, z: n.z, a: n.a, name: n.name, i, owner: null, hoard: 0, raider: null, raidT: 0, warnT: 0, guard: false, obj: null })), chests: J.chests.map((c, i) => ({ x: c.x, z: c.z, t: 1 + i * 0.4 })), coins: [], crown: null, crownT: JST_C.CROWN_FIRST, groups: [], t: 0 };
  return s.jst;
}
function jstSpawnCoin(s, x, z, vx, vz, vy, from) {
  const J = s.jst; let c = null;
  for (const q of J.coins) if (!q.alive) { c = q; break; }
  if (!c) return null;
  c.alive = true; c.x = x; c.z = z; c.vx = vx || 0; c.vz = vz || 0; c.vy = vy || 0; c.y = s.terrain.height(x, z) + (vy ? 1.5 : 0.75); c.fly = !!vy; c.from = from || null; c.cool = from ? 1.0 : 0; c.ph = s.rng() * 10;
  return c;
}
function jstPlaceCoin(s) { const P = s.E.jst.coinSpots, p = P[Math.floor(s.rng() * P.length)]; return jstSpawnCoin(s, p.x + (s.rng() - 0.5) * 3, p.z + (s.rng() - 0.5) * 3); }
function jstAliveCoins(J) { let n = 0; for (const c of J.coins) if (c.alive) n++; return n; }
// spill what a car carries as loose coins around it (and drop the crown)
function jstSpill(s, k, src) {
  const J = s.jst, n = Math.ceil((k.jstCarry || 0) / 2);   // a hit knocks half the load loose (rounded up)
  for (let i = 0; i < n; i++) { const a = s.rng() * TAU, sp = 6 + s.rng() * 5; jstSpawnCoin(s, k.x, k.z, Math.sin(a) * sp + k.vx * 0.3, Math.cos(a) * sp + k.vz * 0.3, 5 + s.rng() * 3, k); }
  if (J.crown && J.crown.holder === k) { const C = J.crown; C.holder = null; C.x = k.x; C.z = k.z; C.y = s.terrain.height(k.x, k.z); C.cool = 1.2; C.from = k; }
  if (n > 0 || k.jstCrown) { s.log('hoardspill', { k: k.id, n, by: src && src.id }); if (k.player) s.banner('-' + n + ' GOLD SPILLED!', '#ffd23a', 1.1); s.fx.burst(k.x, k.y + 1.5, k.z, 'star', 8 + n * 2, '#ffd23a'); Sound.play('pick', { vol: k.player ? 0.6 : 0.25, pitch: 0.7 }); }
  k.jstCarry -= n; k.jstCrown = false;
}

/* ---------------- DRAGON'S HOARD ---------------- */
CART_OBJECTIVES.hoard = {
  name: "DRAGON'S HOARD", short: 'Biggest hoard of gold', time: 100, goal: 0, unit: ' gold',
  desc: 'Scoop up loose gold (carry 6) and bank it in YOUR nest. A hit spills half of what you carry. Park in a rival\'s nest to raid it; sit in yours to guard it. The Crown is worth 5. Biggest hoard at the bell wins.',
  fx: {
    init(s) {
      const J = jstState(s), C = JST_C, maxB = Math.min(64, BurnsGL.maxBones || 32);
      let G = null; const add = (build, o) => { if (!G || G.full) { if (G) G.finish(); G = new BurnsGroup(maxB); J.groups.push(G); if (s.props && s.props.groups) s.props.groups.push(G); } return G.add(build, Object.assign({ visible: false }, o)); };
      for (let i = 0; i < C.COINS; i++) J.coins.push({ alive: false, x: 0, y: 0, z: 0, vx: 0, vz: 0, vy: 0, fly: false, from: null, cool: 0, ph: 0, obj: add(m => jstCoinMesh(m, 1)) });
      for (const n of J.nests) n.obj = add(m => jstPileMesh(m));
      J.crown = { alive: false, holder: null, x: 0, y: 0, z: 0, cool: 0, from: null, obj: add(m => jstCrownMesh(m)) };
      if (G) G.finish();
      for (const k of s.karts) { k.jstCarry = 0; k.jstCrown = false; k.jstRaidT = 0; const n = J.nests[k.slot % J.nests.length]; n.owner = k; k.jstNest = n; }
      for (let i = 0; i < C.START_COINS; i++) jstPlaceCoin(s);
    },
    update(s, dt) {
      const J = s.jst, C = JST_C, K = s.karts; if (!J) return false;
      J.t += dt;
      // the chests spit coins in arcs while the courtyard is short of gold
      for (const ch of J.chests) {
        ch.t -= dt; if (ch.t > 0) continue;
        ch.t = 1.2 + s.rng() * 1.0;
        if (jstAliveCoins(J) >= C.COINS - 4) continue;
        const a = s.rng() * TAU, sp = 4 + s.rng() * 5; jstSpawnCoin(s, ch.x, ch.z, Math.sin(a) * sp, Math.cos(a) * sp, 7 + s.rng() * 3);
      }
      // a few coins also turn up on their own, so the far side never runs dry
      if (jstAliveCoins(J) < 12 && s.rng() < dt * 1.5) jstPlaceCoin(s);
      // flying coins arc and land; then they bob
      for (const c of J.coins) {
        if (!c.alive) continue;
        if (c.cool > 0) c.cool -= dt;
        if (c.fly) {
          c.vy -= 20 * dt; c.x += c.vx * dt; c.z += c.vz * dt; c.y += c.vy * dt;
          const r = Math.hypot(c.x, c.z); if (r > C.WALL_R - 6) { c.x *= (C.WALL_R - 6) / r; c.z *= (C.WALL_R - 6) / r; c.vx = -c.vx * 0.4; c.vz = -c.vz * 0.4; }
          const gy = s.terrain.height(c.x, c.z) + 0.75; if (c.y <= gy && c.vy < 0) { c.y = gy; c.fly = false; }
        }
      }
      // the crown: it appears on the gold mountain now and then
      const CR = J.crown;
      if (!CR.alive) { J.crownT -= dt; if (J.crownT <= 0) { CR.alive = true; CR.holder = null; CR.x = 0; CR.z = 0.5; CR.y = s.terrain.height(0, 0.5); CR.cool = 0; CR.from = null; s.banner('THE CROWN APPEARS!', '#ffd23a', 1.6, 'on the gold mountain · worth ' + C.CROWN_V, true); Sound.play('kartFinalLap', { vol: 0.4 }); s.log('crown', {}); } }
      else if (CR.cool > 0) CR.cool -= dt;
      for (const n of J.nests) { n.guard = false; n.raider = null; if (n.warnT > 0) n.warnT -= dt; }
      for (const k of K) {
        if (k.out) continue;
        const own = k.jstNest;
        // pick-ups (not mid-hit, not high in the air)
        if (k.invT < 0.6 && !(k.air && k.y > s.terrain.height(k.x, k.z) + 2.5)) {
          for (const c of J.coins) {
            if (!c.alive || c.fly && c.vy > 0 || (c.cool > 0 && c.from === k) || k.jstCarry >= C.CAP) continue;
            const dx = k.x - c.x, dz = k.z - c.z; if (dx * dx + dz * dz > 2.6 * 2.6) continue;
            c.alive = false; k.jstCarry++;
            if (k.player) { Sound.play('glowstick', { vol: 0.45, pitch: 1.2 + k.jstCarry * 0.08 }); if (k.jstCarry >= C.CAP) s.banner('ARMS FULL!', '#ffd23a', 1.0, 'take it home to your nest', true); }
            s.fx.burst(c.x, c.y + 0.4, c.z, 'star', 5, '#ffd23a');
          }
          if (CR.alive && !CR.holder && !(CR.cool > 0 && CR.from === k) && Math.hypot(k.x - CR.x, k.z - CR.z) < 3) {
            CR.holder = k; k.jstCrown = true; s.log('crownpick', { k: k.id, player: k.player });
            s.banner(k.player ? 'YOU HAVE THE CROWN!' : k.car.name + ' HAS THE CROWN', k.player ? '#7aff8a' : '#ffd23a', 1.3, k.player ? 'bank it for +' + C.CROWN_V : null, !k.player);
            Sound.play('pick', { vol: k.player ? 0.8 : 0.3 }); s.fx.burst(CR.x, CR.y + 1.5, CR.z, 'star', 16, '#ffd23a');
          }
        }
        // nests: bank at home, guard it by sitting in it, raid the others
        for (const n of J.nests) {
          const d = Math.hypot(k.x - n.x, k.z - n.z); if (d > C.NEST_IN) continue;
          if (n === own) {
            n.guard = true;
            const v = k.jstCarry + (k.jstCrown ? C.CROWN_V : 0);
            if (v > 0) {
              k.score += v; s.log('bank', { k: k.id, n: v, total: k.score, player: k.player });
              if (k.jstCrown) { CR.alive = false; CR.holder = null; J.crownT = C.CROWN_EVERY; }
              k.jstCarry = 0; k.jstCrown = false; k.cheerT = Math.max(k.cheerT, 1.0);
              s.fx.confetti(n.x, 2, n.z, 10 + v * 3); s.fx.burst(n.x, 1.5, n.z, 'star', 8 + v * 2, '#ffd23a');
              if (k.player) { s.banner('+' + v + ' BANKED!', '#7aff8a', 1.2, 'hoard: ' + k.score); Sound.play('kartLap', { vol: 0.65 }); }
            }
          } else if (n.owner && n.owner !== k && n.hoard > 0) {
            n.raider = k; k.jstRaiding = true;
          }
        }
      }
      // a raid only works while the owner is away from home
      for (const n of J.nests) {
        n.hoard = n.owner ? n.owner.score : 0;
        const r = n.raider; if (!r) { continue; }
        if (n.guard) { if (r.player && n.warnT <= 0) { n.warnT = 2; s.banner('GUARDED!', '#ff9a3a', 0.9, n.owner.car.name + ' is sitting on it', true); } continue; }
        if (r.jstCarry >= C.CAP) continue;
        r.jstRaidT = (r.jstRaidT || 0) + dt;
        if (r.jstRaidT >= C.RAID_T) {
          r.jstRaidT = 0; n.owner.score--; n.hoard = n.owner.score; r.jstCarry++;
          s.log('raid', { k: r.id, from: n.owner.id, player: r.player, victim: n.owner.player });
          s.fx.burst(n.x, 1.6, n.z, 'star', 6, '#ffd23a');
          if (r.player) Sound.play('glowstick', { vol: 0.5, pitch: 0.9 + r.jstCarry * 0.08 });
          if (n.owner.player && n.warnT <= 0) { n.warnT = 3; s.banner('YOUR HOARD IS BEING RAIDED!', '#ff5a5a', 1.6, r.car.name + ' is in your nest'); Sound.play('powerdown', { vol: 0.5, pitch: 1.3 }); }
          if (r.player && n.warnT <= 0) { n.warnT = 3; s.banner('RAIDING ' + n.owner.car.name + '!', '#7aff8a', 1.0, null, true); }
        }
      }
      for (const k of K) { if (!k.jstRaiding) k.jstRaidT = 0; k.jstRaiding = false; }
      return false;
    },
    onHit(s, k, src) { if (s.jst) jstSpill(s, k, src); },
    rank(s) { return s.karts.slice().sort((a, b) => (b.score - a.score) || ((b.jstCarry || 0) - (a.jstCarry || 0)) || (b.hitsDealt - a.hitsDealt) || (a.slot - b.slot)); },
    score(k) { return k.score; },
    aiGoal(s, k, nearestRival) {
      const J = s.jst, C = JST_C; if (!J) return null;
      const own = k.jstNest, left = s.obj.time, dHome = Math.hypot(own.x - k.x, own.z - k.z), carry = k.jstCarry + (k.jstCrown ? C.CROWN_V : 0);
      const home = { goal: [own.x, own.z] };
      // carrying: go home when full, rich, close to home, or the bell is near
      if (carry >= C.CAP || (carry >= 3 && dHome < 40) || (carry > 0 && dHome < 14) || (carry > 0 && left < 14) || k.jstCrown) return home;
      // somebody is raiding my nest and I'm not far: defend it (ram the raider)
      if (own.raider && !own.guard && dHome < 50) return { prey: own.raider };
      // the crown, if it's up for grabs and near enough
      const CR = J.crown; if (CR.alive && !CR.holder && Math.hypot(CR.x - k.x, CR.z - k.z) < 55) return { goal: [CR.x, CR.z] };
      // a crown carrier close by: knock it loose
      if (CR.alive && CR.holder && CR.holder !== k && Math.hypot(CR.holder.x - k.x, CR.holder.z - k.z) < 30) return { prey: CR.holder };
      // raiders by temperament (every third car) and anyone near a fat, unguarded rival nest
      let best = null, bs = 0;
      for (const n of J.nests) {
        if (n === own || !n.owner || n.hoard < 3) continue;
        const ow = n.owner, away = Math.hypot(ow.x - n.x, ow.z - n.z), d = Math.hypot(n.x - k.x, n.z - k.z);
        if (away < 16) continue;
        const sc = n.hoard * (k.slot % 3 === 0 ? 2 : 1) - d * 0.12 + (ow.player ? 1 : 0);
        if (sc > bs && d < 60) { bs = sc; best = n; }
      }
      if (best && bs > 3) return { goal: [best.x, best.z] };
      // a loaded rival close by: make it spill
      if (k.wpn.t <= 0) for (const o of s.karts) if (o !== k && !o.out && (o.jstCarry >= 3 || o.jstCrown) && Math.hypot(o.x - k.x, o.z - k.z) < 18) return { prey: o };
      // else the nearest loose coin (slightly favouring coins on the way home)
      let g = null, bd = 1e9;
      for (const c of J.coins) { if (!c.alive || (c.cool > 0 && c.from === k)) continue; const d = Math.hypot(c.x - k.x, c.z - k.z) + Math.hypot(c.x - own.x, c.z - own.z) * 0.15 * (carry / C.CAP) + (s.rng() - 0.5) * 8; if (d < bd) { bd = d; g = [c.x, c.z]; } }
      return g ? { goal: g } : home;
    }
  }
};

/* ---------------- the arena's rules (all three games) ---------------- */
CART_ARENA_RULES.joust = {
  music: 'kart2',
  hud(s, ctx, W, H, top, left) {
    const J = s.jst, k = s.player, C = JST_C; if (!J || !k || s.objective !== 'hoard' || k.out) return;
    const portrait = H > W, y = portrait ? top + 58 + 5 * 17 + 18 : top + 58;
    // the carry meter: six coin slots, plus the crown
    const n = C.CAP, w = 15, x0 = W / 2 - (n - 1) * w / 2 - (k.jstCrown ? 10 : 0);
    ctx.save();
    ctx.fillStyle = 'rgba(10,4,20,0.5)'; burnsRR(ctx, x0 - 14, y - 11, (n - 1) * w + 28 + (k.jstCrown ? 22 : 0), 22, 11); ctx.fill();
    for (let i = 0; i < n; i++) { const x = x0 + i * w, on = i < k.jstCarry; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, TAU); ctx.fillStyle = on ? '#ffc83a' : 'rgba(255,255,255,0.14)'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = on ? '#fff0a0' : 'rgba(255,255,255,0.35)'; ctx.stroke(); }
    if (k.jstCrown) { const x = x0 + n * w + 4; ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(x - 7, y + 5); ctx.lineTo(x - 7, y - 4); ctx.lineTo(x - 3.5, y); ctx.lineTo(x, y - 6); ctx.lineTo(x + 3.5, y); ctx.lineTo(x + 7, y - 4); ctx.lineTo(x + 7, y + 5); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    const full = k.jstCarry >= C.CAP, own = k.jstNest, raided = own.raider && !own.guard;
    let msg = full ? 'ARMS FULL · HOME TO YOUR NEST' : k.jstCrown ? 'BANK THE CROWN IN YOUR NEST' : k.jstCarry > 0 ? 'CARRYING ' + k.jstCarry + ' · BANK IT IN YOUR NEST' : 'GRAB GOLD · YOUR HOARD ' + k.score, col = full || k.jstCrown ? '#7aff8a' : '#ffd23a';
    if (raided) { msg = 'YOUR NEST IS BEING RAIDED!'; col = Math.sin(s.time * 12) > 0 ? '#ff5a5a' : '#ffb0b0'; }
    else if (k.jstRaidT > 0) { msg = 'RAIDING!'; col = '#7aff8a'; }
    else if (own.guard && k.jstCarry === 0) { msg = 'GUARDING YOUR HOARD (' + k.score + ')'; col = '#9ad8ff'; }
    BurnsUI.text(ctx, msg, W / 2, y + 20, 12, col, { glow: '#2a1a08' });
    // where to go: home (green) when carrying, else the nearest coin (gold) / the crown
    if (s.state !== 'race') return;
    let tx = 0, tz = 0, ty = 2, tc = '#ffd23a', any = false;
    if (k.jstCarry >= 3 || k.jstCrown || raided) { tx = own.x; tz = own.z; ty = 5; tc = raided ? '#ff5a5a' : '#7aff8a'; any = true; }
    else if (J.crown.alive && !J.crown.holder && Math.hypot(J.crown.x - k.x, J.crown.z - k.z) < 60) { tx = J.crown.x; tz = J.crown.z; ty = J.crown.y + 3; any = true; }
    else { let bd = 1e9; for (const c of J.coins) { if (!c.alive || c.fly) continue; const d = (c.x - k.x) * (c.x - k.x) + (c.z - k.z) * (c.z - k.z); if (d < bd) { bd = d; tx = c.x; tz = c.z; ty = c.y + 2; any = true; } } if (bd < 25) any = false; }
    if (any && s.R.project(tx, ty, tz, W, H, JST_P)) { const x = clamp(JST_P.x, 30, W - 30), yy = clamp(JST_P.y, 80, H - 120); ctx.save(); ctx.translate(x, yy); ctx.fillStyle = tc; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-9, -6); ctx.lineTo(9, -6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  },
  draw(s, R, S, t) {
    const cam = s.cam, fx = s.fx, E = s.E;
    // brazier flames near the camera
    if (E.jst && E.jst.braziers) for (const b of E.jst.braziers) { const dx = b[0] - cam.x, dz = b[1] - cam.z; if (dx * dx + dz * dz > 60 * 60) continue; if (Math.random() < 0.5) fx.fire(b[0] + (Math.random() - 0.5) * 0.6, 2.05, b[1] + (Math.random() - 0.5) * 0.6, 1.1); }
    const J = s.jst; if (!J) return;
    // coins: spinning gold, a soft glow under each
    for (const c of J.coins) {
      const o = c.obj; o.visible = c.alive; if (!c.alive) continue;
      o.x = c.x; o.z = c.z; o.y = c.y + (c.fly ? 0 : Math.sin(t * 2.6 + c.ph) * 0.15); o.yaw = t * 2.4 + c.ph; o.scale = 1;
      const dx = c.x - cam.x, dz = c.z - cam.z; if (dx * dx + dz * dz < 80 * 80) { R.bbs.bb(c.x, o.y, c.z, 2.2, 2.2, S.glow, JST_GOLD, 0.35, true); if (Math.random() < 0.04) fx.glint(c.x, o.y + 0.3, c.z, '#fff4c0'); }
    }
    // the crown: on the mountain with a beam, or riding its carrier
    const CR = J.crown, co = CR.obj; co.visible = CR.alive;
    if (CR.alive) {
      if (CR.holder) { const h = CR.holder; co.x = h.x; co.z = h.z; co.y = h.y + h.M.h + 1.0; co.yaw = t * 2; co.scale = 0.8; }
      else { co.x = CR.x; co.z = CR.z; co.y = CR.y + 0.6 + Math.sin(t * 2) * 0.2; co.yaw = t * 0.8; co.scale = 1.2; R.bbs.streak(CR.x, CR.y + 9, CR.z, 0, 1, 0, 18, 1.6, S.streak, JST_GOLD, 0.55); R.flat.flat(CR.x, CR.y + 0.08, CR.z, 6, 6, t, S.ring, JST_GOLD, 0.6, true); }
      R.bbs.bb(co.x, co.y + 0.8, co.z, 4.5, 4.5, S.glow, JST_GOLD, 0.6, true);
    }
    // carried gold: a stack of coins over the car
    for (const k of s.karts) {
      if (!k._in || k.out || !k.jstCarry) continue;
      const y0 = k.y + (k.M ? k.M.h : 1.4) + 0.5;
      for (let i = 0; i < k.jstCarry; i++) R.bbs.bb(k.x + Math.sin(t * 3 + i) * 0.08, y0 + i * 0.32, k.z, 0.9, 0.42, S.dot, JST_GOLD, 0.95, false);
      R.bbs.bb(k.x, y0 + k.jstCarry * 0.16, k.z, 2.4, 2.4 + k.jstCarry * 0.3, S.glow, JST_GOLD, 0.35, true);
    }
    // the nests: the owner's ring and banner, the hoard pile growing with the score, a red flash while raided
    for (const n of J.nests) {
      const ow = n.owner, o = n.obj; if (!ow) { o.visible = false; continue; }
      const col = burnsRGBf(jstCol(ow)), raided = n.raider && !n.guard, gy = 0.08;
      R.flat.flat(n.x, gy, n.z, JST_C.NEST_IN * 2, JST_C.NEST_IN * 2, t * 0.3, S.ring, raided ? JST_RED : col, raided ? 0.6 + 0.4 * Math.sin(t * 14) : (ow.player ? 0.85 : 0.55), true);
      if (ow.player) R.flat.flat(n.x, gy, n.z, JST_C.NEST_IN * 2.6, JST_C.NEST_IN * 2.6, -t * 0.5, S.ring, [1, 1, 1], 0.3 + 0.2 * Math.sin(t * 4), true);
      const R2 = JST_C.NEST_IN + 0.9 + 1.4, px = n.x + Math.sin(n.a) * R2, pz = n.z + Math.cos(n.a) * R2;
      R.bbs.bb(px + 0.0, 6.9, pz, 2.2, 1.4, S.square, col, 0.95, false, Math.sin(t * 3 + n.i) * 0.08);
      R.bbs.bb(px, 6.9, pz, 3.4, 3.4, S.glow, col, 0.35, true);
      const h = n.hoard; o.visible = h > 0;
      if (h > 0) { o.x = n.x; o.z = n.z; o.y = 0.05; o.yaw = n.a; o.scale = Math.min(2.1, 0.45 + Math.sqrt(h) * 0.32); const dx = n.x - cam.x, dz = n.z - cam.z; if (dx * dx + dz * dz < 90 * 90 && Math.random() < 0.08) fx.glint(n.x + (Math.random() - 0.5) * 3, 0.6 + Math.random() * o.scale, n.z + (Math.random() - 0.5) * 3, '#fff4c0'); }
      if (raided && Math.random() < 0.3) fx.spark(n.x, 1.5, n.z, 2, '#ffd23a', 4);
    }
  },
  lights(s, add) {
    const J = s.jst; if (!J) return;
    if (J.crown.alive) add(J.crown.obj.x, J.crown.obj.y + 1, J.crown.obj.z, 10, JST_GOLD, 1.0, 1.5);
    for (const n of J.nests) if (n.hoard > 0) add(n.x, 1.5, n.z, 6 + Math.min(6, n.hoard * 0.3), JST_GOLD, 0.6, 1);
  }
};

/* ---------------- registration ---------------- */
CART_ARENAS.push({
  id: 'joust', name: 'THE GILDED ROOST', sub: "A dragon's castle courtyard: nests, chests and a mountain of gold", objectives: ['hoard', 'vibe', 'glow'],
  col: '#ffd23a', tod: 'sunset', powers: [],
  blurb: "Sir Scorchalot's secret courtyard. Scoop the gold that spills from the chests, bank it in your own nest, raid the others, and steal the Crown off the gold mountain."
});
CART_ARENA_ICONS.joust = (ctx, s, t, col) => {
  // a twig nest heaped with gold and a little crown that bobs
  ctx.save();
  ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.ellipse(0, s * 0.18, s * 0.62, s * 0.42, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#fff0a0'; for (const [x, y] of [[-0.3, 0.02], [0.05, -0.12], [0.32, 0.04], [-0.05, 0.1]]) { ctx.beginPath(); ctx.ellipse(x * s, y * s, s * 0.11, s * 0.07, 0.3, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = Math.max(2, s * 0.12); ctx.beginPath(); ctx.ellipse(0, s * 0.24, s * 0.8, s * 0.28, 0, 0, TAU); ctx.stroke();
  ctx.strokeStyle = '#c89a5a'; ctx.lineWidth = Math.max(1, s * 0.05); for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.85 + i * s * 0.3, s * 0.38); ctx.lineTo(-s * 0.6 + i * s * 0.3, s * 0.1); ctx.stroke(); }
  const b = Math.sin(t * 3) * s * 0.05, y = -s * 0.42 + b;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.3, y + s * 0.16); ctx.lineTo(-s * 0.3, y - s * 0.12); ctx.lineTo(-s * 0.15, y); ctx.lineTo(0, y - s * 0.2); ctx.lineTo(s * 0.15, y); ctx.lineTo(s * 0.3, y - s * 0.12); ctx.lineTo(s * 0.3, y + s * 0.16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e0204a'; ctx.beginPath(); ctx.arc(0, y + s * 0.05, s * 0.05, 0, TAU); ctx.fill();
  ctx.restore();
};
var CART_SECRET_LEVELS = (typeof CART_SECRET_LEVELS !== 'undefined' && CART_SECRET_LEVELS) || {};
CART_SECRET_LEVELS.dragon = { arena: 'joust', game: 'hoard' };
