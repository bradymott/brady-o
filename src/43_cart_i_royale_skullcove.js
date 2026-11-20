/* ============================================================
   ART CART — royale arena: SKULL COVE (id 'skullcove', Dusty Doubloon's arena; level agent "galleon", Nov 19 2026)
   A moonlit pirate cove, the tide long gone out: blue night sand between black cliffs, open to the sea on the north
   side. In the middle THE SKULL, a rock the size of a church carved by the sea into a grinning skull, green fire in its
   eyes and a glow of treasure in its open jaw. Round it a ring of SEA STACKS (cover), wrecks heeled over on the outer
   sand, POWDER KEG stacks by the wrecks, rock slabs with BLOWHOLES in them, green ship's lanterns along the fence.
   Its enemies (all telegraphed, all readable on a phone):
     · THE GHOST GALLEON: a ship's bell tolls and a green wake lane lights up across the cove (2.2 s) while a ghost ship
       fades in at its end, then it SAILS straight through along the lane: whatever it meets is knocked aside (12 HP).
       Get out of the lane
     · BLOWHOLES: sand boils in a rock slab and a white ring closes on it (1.4 s), then a SPOUT of sea water blasts up
       and launches anything on the slab (10 HP)
     · POWDER KEGS: a stack's fuse lights and sparks run up it, a red ring shows the blast (1.6 s), then BOOM (12 HP and
       a knock away). The cove's pirates restock it
   DUSTY DOUBLOON's ROGUE WAVE is in everyone's gift boxes here (arena levelCar -> the scene's poolCar). Its secret arena
   TREASURE ISLE (43_cart_g_lagoon.js) is a sunset palm-island cove; this is a night cove of cliffs, stacks and ghosts.
   Globals SKC_ / skc, state on s.skc. Everything here is an original design. Registers itself (CART_ARENAS,
   CartWorlds.arena_skullcove, CART_ARENA_RULES.skullcove, CART_ROYALE_ARENAS.galleon, CART_ARENA_ICONS.skullcove).
   ============================================================ */
const SKC_C = {
  R: 178, skullR: 15, stackR: 96, stackN: 7, wreckR: 132,
  ghost: { first: 14, period: 15, warn: 2.2, speed: 34, len: 14, beam: 5.2, lane: 12 },
  spout: { first: 6, period: 3.0, warn: 1.4, dur: 1.0, r: 6.4 },
  keg: { first: 9, period: 4.2, warn: 1.6, r: 10 },
  green: [0.35, 1, 0.55], ghostCol: [0.55, 1, 0.75], white: [1, 1, 1], black: [0, 0, 0], foam: [0.85, 0.95, 1], sea: [0.35, 0.7, 1], red: [1, 0.2, 0.12], amber: [1, 0.62, 0.15], gold: [1, 0.8, 0.3], smoke: [0.7, 0.7, 0.72]
};
const SKC_T = { p: {} };
const SKC_HOLES = [[0.5, 62], [2.07, 62], [3.64, 62], [5.21, 62], [1.3, 124], [2.85, 128], [4.45, 122], [6.0, 126]];   // [angle, radius]
const SKC_WRECKS = [0.59, 1.37, 2.16, 2.95, 3.73, 4.52, 5.30];   // angles between the spawn points, r 140
const SKC_KEGS = SKC_WRECKS.slice(1).map((a, i) => [a + 0.08, 116 + (i % 2) * 6]);   // a keg stack inside each wreck but the first

/* ---------------- the world ---------------- */
CartWorlds.arena_skullcove = function (A, night) {
  const C = SKC_C, E = this.base(2131, [-235, -235, 235, 235], '#7a8ca8', 0.05);
  const sky = Object.assign(CART_SKIES.night(), { zen: '#040a16', sky: '#1c3450', hor: '#1e4a5a', fog: '#0e1e28', fogD: 0.0040, mid: '#14303a', midK: 0.35, cityK: 0, emB: 1.9, keyK: 0.95, key: '#c8e0ff', stars: 1, moon: [20, 26], clouds: 0.25, cloudCol: '#2a3a4a' });
  Object.assign(E, { id: 'skullcove', arena: A, sky, tod: 'night', music: 'kart3', night: true, R: C.R });
  const api = E.api, T = E.terrain, rng = mulberry32(2131);
  const ang = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
  const seaOpen = a => Math.abs(cartWrap(a)) < 0.55;   // the cove opens to the sea to the north (+z)
  E.skc = { holes: SKC_HOLES.map(([a, r]) => { const [x, z] = ang(a, r); return { x, z }; }), kegs: SKC_KEGS.map(([a, r]) => { const [x, z] = ang(a, r); return { x, z }; }) };
  // ---- ground paint: moonlit ripples, tide channels, glowing plankton, the sea beyond the north fence ----
  api.paint((ctx, P, sc) => {
    for (let z = -235; z < 235; z += 3.4) { ctx.strokeStyle = 'rgba(200,220,255,0.10)'; ctx.lineWidth = 0.4 * sc; ctx.beginPath(); for (let x = -235; x <= 235; x += 8) { const q = P(x, z + Math.sin(x * 0.05 + z * 0.3) * 1.5); if (x === -235) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); } ctx.stroke(); }
    for (let i = 0; i < 320; i++) { const x = (rng() - 0.5) * 460, z = (rng() - 0.5) * 460, q = P(x, z); ctx.fillStyle = `rgba(${rng() < 0.5 ? '20,26,40' : '150,170,200'},${0.05 + rng() * 0.08})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (2 + rng() * 9) * sc, (1 + rng() * 5) * sc, rng() * 3, 0, TAU); ctx.fill(); }
    // the sea: everything north beyond the fence, foam lines lapping at the sand
    ctx.fillStyle = 'rgba(14,40,60,0.95)'; ctx.beginPath(); { for (let i = 0; i <= 20; i++) { const a = -0.62 + i / 20 * 1.24, p = P(...ang(a, C.R + 12 + Math.sin(i * 1.7) * 3)); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); } for (let i = 20; i >= 0; i--) { const a = -0.9 + i / 20 * 1.8, p = P(...ang(a, 330)); ctx.lineTo(p[0], p[1]); } ctx.closePath(); }
    ctx.save(); ctx.clip(); ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
    for (let k = 0; k < 4; k++) { ctx.strokeStyle = `rgba(220,240,255,${0.5 - k * 0.1})`; ctx.lineWidth = (0.8 - k * 0.12) * sc; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const a = -0.62 + i / 24 * 1.24, p = P(...ang(a, C.R + 12 + k * 7 + Math.sin(i * 1.3 + k) * 2.5)); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); } ctx.stroke(); }
    // the moon's path on the water
    for (let i = 0; i < 40; i++) { const r = C.R + 20 + i * 3, q = P(Math.sin(i * 1.7) * (2 + i * 0.3), r); ctx.fillStyle = `rgba(230,240,255,${0.35 - i * 0.007})`; ctx.fillRect(q[0] - (1 + i * 0.12) * sc, q[1] - 0.3 * sc, (2 + i * 0.24) * sc, 0.6 * sc); }
    // tide channels: dark wet sand winding in from the sea to the skull, a glint of water in each
    for (let c = 0; c < 3; c++) { let a = -0.4 + c * 0.4, r = C.R + 8; ctx.lineCap = 'round'; const pts = []; while (r > C.skullR + 6) { pts.push(ang(a, r)); r -= 6; a += Math.sin(r * 0.05 + c * 2) * 0.05 + (c - 1) * 0.012; } for (const [w, col] of [[7, 'rgba(18,28,40,0.5)'], [3.0, 'rgba(70,170,200,0.6)'], [1.0, 'rgba(120,255,210,0.55)']]) { ctx.strokeStyle = col; ctx.lineWidth = w * sc; ctx.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); } }
    // bioluminescent plankton specks along the channels and the shore
    for (let i = 0; i < 260; i++) { const a = (rng() - 0.5) * 1.6, r = 40 + rng() * (C.R - 30), q = P(...ang(a, r)); ctx.fillStyle = `rgba(90,255,200,${0.45 + rng() * 0.4})`; ctx.beginPath(); ctx.arc(q[0], q[1], (0.25 + rng() * 0.35) * sc, 0, TAU); ctx.fill(); }
    // the blowhole slabs: dark rock round each hole
    for (const h of E.skc.holes) { const q = P(h.x, h.z); ctx.fillStyle = 'rgba(30,34,44,0.85)'; ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = (C.spout.r + 1.6 + Math.sin(i * 2.7 + h.x) * 0.8) * sc; ctx.lineTo(q[0] + Math.cos(a) * r, q[1] + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(170,230,255,0.85)'; ctx.lineWidth = 0.55 * sc; ctx.stroke(); }
    // scorched sand round the keg stacks
    for (const k of E.skc.kegs) { const q = P(k.x, k.z), g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], C.keg.r * sc); g.addColorStop(0, 'rgba(20,14,12,0.55)'); g.addColorStop(1, 'rgba(20,14,12,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], C.keg.r * sc, 0, TAU); ctx.fill(); }
    // shells and fish bones
    for (let i = 0; i < 120; i++) { const a = rng() * TAU, r = 25 + rng() * 145, q = P(...ang(a, r)); ctx.fillStyle = 'rgba(230,236,245,0.6)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 0.35 * sc, 0.25 * sc, rng() * 3, 0, TAU); ctx.fill(); }
  });
  // ---- THE SKULL ----
  CartScene.mesh(api, 0, 0, Math.PI, m => {
    const bone = '#b8b4a6', dark = '#0a0c10';
    m.color('#5a5e66').shine(0); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; m.ellipsoid(Math.sin(a) * 13, 0.6, Math.cos(a) * 12, 4 + (i % 3), 2.2, 3.5, { seg: 8, rings: 5 }); }   // rubble round the foot
    m.color(bone).shine(1);
    m.ellipsoid(0, 16, -2, 13, 12.5, 13, { seg: 26, rings: 16 });   // the cranium
    m.ellipsoid(0, 10.5, 4.5, 11, 8.5, 9, { seg: 22, rings: 12 });   // the face
    for (const sx of [-1, 1]) m.ellipsoid(sx * 8.4, 9.5, 7.8, 3.6, 3.0, 3.4, { seg: 12, rings: 8 });   // cheekbones
    m.ellipsoid(0, 3.4, 4.6, 9.6, 3.4, 8.6, { seg: 20, rings: 8 });   // the jaw, dropped open
    // eye sockets and the green fire in them, the nose, the dark mouth with the treasure glowing in it
    m.color(dark); for (const sx of [-1, 1]) m.ellipsoid(sx * 4.8, 13.6, 10.6, 3.6, 3.3, 2.4, { seg: 14, rings: 9 });
    m.color('#7aff9a', 1); for (const sx of [-1, 1]) m.ball(sx * 4.8, 13.4, 12.1, 1.4, { seg: 12, rings: 8 }); m.emissive(0);
    m.color(dark); for (const sx of [-1, 1]) m.ellipsoid(sx * 1.0, 9.6, 12.7, 0.9, 1.6, 0.8, { seg: 8, rings: 6 });
    m.ellipsoid(0, 5.6, 10.4, 7.4, 2.1, 3.0, { seg: 16, rings: 8 });
    m.color('#ffcc44', 0.7).shine(3); m.ellipsoid(0, 5.0, 9.6, 3.2, 1.0, 1.6, { seg: 12, rings: 6 }); m.emissive(0);
    // teeth, upper and lower
    m.color('#e8e2d0').shine(2);
    for (let i = 0; i < 8; i++) { const a = (i / 7 - 0.5) * 1.5, x = Math.sin(a) * 7.2, z = 4.8 + Math.cos(a) * 7.2; m.roundBox(x, 7.0, z, 1.5, 1.9, 1.2, 0.35); if (i > 0 && i < 7) m.roundBox(x * 0.92, 4.4, z - 0.6, 1.3, 1.5, 1.0, 0.3); }
    // moss and barnacles, a crack across the brow
    m.color('#3a5a3a').shine(0); for (let i = 0; i < 14; i++) { const a = i * 2.39, h = 0.2 + (i % 5) * 0.12; m.ellipsoid(Math.sin(a) * 12.4 * Math.cos(h), 16 + Math.sin(h) * 11, -2 + Math.cos(a) * 12.4 * Math.cos(h), 1.6, 0.5, 1.4, { seg: 6, rings: 4 }); }
    m.color(dark); m.limb(-3, 24, 7.4, 1, 21, 9.4, 0.22, 0.12, { seg: 4 }); m.limb(1, 21, 9.4, 3, 22.5, 9.2, 0.15, 0.08, { seg: 4 });
    m.shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 1, r: C.skullR, y0: 0, y1: 28 }], lights: [{ x: -4.8, y: 13.4, z: 12.5, s: 3, c: '#7aff9a' }, { x: 4.8, y: 13.4, z: 12.5, s: 3, c: '#7aff9a' }, { x: 0, y: 5, z: 10, s: 2.4, c: '#ffcc44' }] };
  }, { hi: true });
  E.art.push({ x: 0, z: 0, r: C.skullR + 1 });
  api.light(0, -8, 30, '#4aff8a', 0.6); api.light(0, 0, 60, '#2a7a9a', 0.5);
  // moonlight pools over the open sand, warm lantern light at the wrecks, a sea-blue glow at every blowhole slab
  for (const [r, n] of [[56, 7], [104, 10], [150, 14]]) for (let i = 0; i < n; i++) { const [x, z] = ang((i + 0.5) / n * TAU, r); api.light(x, z, 30, i % 3 ? '#6a9ad8' : '#4ac8a8', 0.42); }
  for (const a of SKC_WRECKS) { const [x, z] = ang(a, 134); api.light(x, z, 16, '#ffb060', 0.6); }
  for (const h of E.skc.holes) api.light(h.x, h.z, 10, '#7ad8ff', 0.6);
  for (const k of E.skc.kegs) api.light(k.x, k.z, 12, '#ff7a3a', 0.65);
  api.sign('SKULL\nCOVE', 0, -C.skullR - 4, { yaw: Math.PI, h: 1.2, y: 1.6, post: true, maxW: 3.6, style: { bg: '#1a1410', fg: '#7aff9a', border: '#7aff9a' }, glow: '#4aff8a' });
  // ---- SEA STACKS: tall rock pillars in a ring (cover) ----
  api.instanceProto('skc_stack', m => {
    // a weathered sea stack: one tapering, leaning column with layered rock ledges, jagged faces, fallen boulders, a mossy top
    const prof = [[5.6, 0], [5.3, 2.4], [4.7, 5.2], [5.1, 5.6], [4.4, 6.2], [4.0, 9.8], [4.4, 10.2], [3.7, 10.8], [3.3, 14.4], [3.7, 14.8], [3.0, 15.4], [2.6, 18.6], [2.1, 20.4], [1.2, 21.4], [0, 21.7]];
    const jag = (th, v) => 1 + 0.11 * Math.cos(th * 3 + v * 9) + 0.07 * Math.cos(th * 7 + 1.3 + v * 4) + 0.04 * Math.cos(th * 13 + v * 21);
    m.color('#ffffff').shine(0); m.push(); m.tf(0, 0, 0, 0, 0, 0.05); m.lathe(prof, { seg: m.lo ? 10 : 16, rMod: jag }); m.pop();
    // darker strata under each ledge, a crack running up one face
    m.color('#b8bcc4'); for (const [y, r] of [[5.45, 4.95], [10.05, 4.25], [14.65, 3.55]]) { m.push(); m.tf(0.25 * y / 15, y, 0, 0, 0, 0.05); m.torus(0, 0, 0, r, 0.22, { seg: m.lo ? 10 : 16, tseg: 3 }); m.pop(); }
    m.color('#5a5e68'); m.limb(4.6, 1.0, 1.2, 4.1, 5.0, 1.5, 0.12, 0.08, { seg: 3 }); m.limb(4.1, 5.0, 1.5, 3.9, 8.6, 0.8, 0.08, 0.05, { seg: 3 });
    m.color('#3a5a3a'); m.ellipsoid(0.9, 21.2, 0, 2.0, 0.6, 1.8, { seg: 8, rings: 4 }); m.ellipsoid(1.0, 15.2, 2.6, 1.2, 0.35, 1.0, { seg: 6, rings: 3 });
    m.color('#f0f0ea'); m.limb(1.6, 20.4, 1.0, 2.6, 15.8, 1.6, 0.25, 0.12, { seg: 4 });   // gull streaks down from the top
    m.color('#d8d8d0'); for (const [x, z, r] of [[5.6, 2.4, 1.3], [-4.8, 3.6, 1.0], [2.2, -5.8, 0.9]]) m.ellipsoid(x, r * 0.55, z, r, r * 0.75, r * 0.9, { seg: 7, rings: 4 });
    m.color('#e8e8e0'); for (let i = 0; i < 10; i++) { const a = i * 2.3; m.ball(Math.sin(a) * 5.3, 1.0 + (i % 3) * 0.6, Math.cos(a) * 4.9, 0.3, { seg: 5, rings: 3 }); }
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 5.0, y0: 0, y1: 22 }] };
  }, { r: 6, near: 50, mid: 160, farD: 420, lo: true, far: m => { m.color('#ffffff'); m.lathe([[5.4, 0], [4.4, 6], [3.6, 12], [2.6, 18], [0, 21.6]], { seg: 6 }); } });
  for (let i = 0; i < C.stackN; i++) { const a = (i + 0.3) / C.stackN * TAU, r = C.stackR + (i % 2) * 10, [x, z] = ang(a, r); api.instance('skc_stack', x, z, { y: 0, yaw: a * 3, scale: 0.85 + (i % 3) * 0.12, tint: cartTintOf(['#5a6070', '#4e5664', '#646a78'][i % 3]) }); E.art.push({ x, z, r: 5.2 }); api.light(x, z, 12, '#4aff8a', 0.25); }
  // ---- wrecks heeled over on the outer sand (cover), each with a powder keg stack beside it ----
  const wreck = (x, z, yaw, L, col) => {
    CartScene.mesh(api, x, z, yaw, m => {
      m.push(); m.tf(0, -0.6, 0, 0, 0, 1.05);   // on her side
      for (let i = 0; i < 5; i++) { const t0 = i / 5, t1 = (i + 1) / 5; m.color(i % 2 ? col : '#3a2a1e').shine(0); m.ellipsoid(0, 0, 0, 3.6 * (1 - t0 * 0.1), 3.4 * (1 - t0), L / 2 * (1 - t0 * 0.08), { seg: 18, rings: 3, phi0: Math.PI / 2 + t0 * Math.PI / 2, phi1: Math.PI / 2 + t1 * Math.PI / 2 }); }
      m.color('#2a1e16'); for (let i = 0; i < 6; i++) { const z0 = -L / 2 + 3 + i * (L - 6) / 5; m.limb(-3.4, 0.2, z0, 3.4, 0.2, z0, 0.22, 0.22, { seg: 5 }); }   // ribs showing through the deck
      m.pop();
      m.color('#5a4030'); m.limb(-1, 3.2, -2, -10, 1.0, -4, 0.35, 0.28, { seg: 7 }); m.limb(-1, 3.2, 4, -9, 0.6, 7, 0.3, 0.24, { seg: 7 });   // masts lying in the sand
      m.color('#c8d8c0', 0.08); m.push(); m.tf(-6, 1.2, -3.2, 0.2, 0, 1.3); m.box(0, 0, 0, 5, 3.4, 0.06); m.pop(); m.emissive(0);   // a torn sail
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 3.6, hz: L / 2 - 1, y0: 0, y1: 5 }] };
    }, { hi: true });
    const c = Math.cos(yaw), s = Math.sin(yaw); for (let k = -1; k <= 1; k++) E.art.push({ x: x + s * k * L / 3, z: z + c * k * L / 3, r: 4 });
  };
  SKC_WRECKS.forEach((a, i) => { const [x, z] = ang(a, 140 + (i % 2) * 4); wreck(x, z, a + Math.PI / 2 + (i % 2 ? 0.25 : -0.2), 18 + (i % 3) * 2.5, ['#5a4434', '#4a5050', '#6a4c34'][i % 3]); });
  // ---- powder keg stacks (the blasts come from these) ----
  for (const k of E.skc.kegs) {
    CartScene.mesh(api, k.x, k.z, rng() * TAU, m => {
      const keg = (x, y, z, lay) => { m.push(); m.tf(x, y, z, 0, 0, lay ? Math.PI / 2 : 0); m.color('#6a4428').shine(1); m.lathe([[0, 0], [0.55, 0], [0.66, 0.65], [0.55, 1.3], [0, 1.3]], { seg: 12 }); m.color('#2a2a2e').shine(2); m.torus(0, 0.2, 0, 0.6, 0.05, { seg: 12, tseg: 3 }); m.torus(0, 1.1, 0, 0.6, 0.05, { seg: 12, tseg: 3 }); m.color('#e8d8b0').shine(0); m.box(0, 0.65, 0.64, 0.6, 0.3, 0.04); m.pop(); };
      for (const [x, z] of [[-0.75, 0], [0.75, 0], [0, 1.25], [0, -1.25]]) keg(x, 0, z, false);
      keg(-0.4, 1.32, 0.2, false); keg(0.5, 1.32, -0.3, false); keg(0, 2.64, 0, false);
      m.color('#3a3a3e'); m.ball(1.8, 0.35, 1.2, 0.35, { seg: 8, rings: 5 }); m.ball(2.3, 0.35, 0.9, 0.35, { seg: 8, rings: 5 }); m.ball(2.0, 0.85, 1.05, 0.35, { seg: 8, rings: 5 });   // a few cannonballs
      m.color('#d8c8a0'); m.limb(0, 3.9, 0, 0.4, 4.4, 0.2, 0.04, 0.04, { seg: 3 });   // the fuse
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.9, y0: 0, y1: 4 }] };
    }, { hi: true });
    E.art.push({ x: k.x, z: k.z, r: 2.4 });
    api.sign('POWDER\nKEGS', k.x + 2.8, k.z + 2.8, { yaw: Math.atan2(-k.x, -k.z), h: 0.8, y: 1.6, post: true, maxW: 2.4, style: { bg: '#2a1a12', fg: '#ff6a3a', border: '#ff6a3a' } });
  }
  // ---- blowholes: a rock rim round each hole (flush enough to drive over) ----
  for (const h of E.skc.holes) CartScene.mesh(api, h.x, h.z, rng() * TAU, m => { m.color('#2a2e38').shine(1); m.lathe([[2.4, 0], [1.9, 0.35], [1.2, 0.3], [1.0, 0.02]], { seg: 14 }); m.color('#06080c'); m.disc(0, 0.04, 0, 1.1, 12); m.color('#e8e8e0'); for (let i = 0; i < 6; i++) { const a = i * 1.05; m.ball(Math.cos(a) * 2.0, 0.22, Math.sin(a) * 2.0, 0.14, { seg: 5, rings: 3 }); } m.shine(0); return {}; }, { hi: true, noAO: true });
  // ---- the fence: dark timber rails, green ship's lanterns on posts every few rails ----
  const poly = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; poly.push([Math.sin(a) * C.R, Math.cos(a) * C.R]); }
  E.walls = poly; CartDecor.protos(E);
  api.instanceProto('skc_lantern', m => { m.color('#3a2a1e').shine(0); m.cyl(0, 0, 0, 0.16, 0.13, 3.2, 6); m.limb(0, 3.1, 0, 0.7, 3.1, 0, 0.06, 0.06, { seg: 4 }); m.color('#2a2a2e').shine(2); m.cyl(0.7, 2.2, 0, 0.26, 0.22, 0.7, 6); m.color('#ffffff', 1); m.cyl(0.7, 2.3, 0, 0.22, 0.2, 0.5, 6); m.emissive(0).shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.25, y0: 0, y1: 3 }] }; }, { r: 1, near: 40, mid: 120, farD: 300, lo: true, far: m => { m.color('#3a2a1e'); m.box(0, 1.6, 0, 0.3, 3.2, 0.3); m.color('#ffffff', 1); m.box(0.7, 2.5, 0, 0.4, 0.5, 0.4); m.emissive(0); } });
  for (let i = 0; i < 48; i++) {
    const a = poly[i], b = poly[(i + 1) % 48], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 7), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]);
    for (let j = 0; j < n; j++) { const u = (j + 0.5) / n, x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u); CartDecor.put(E, 'rail', x, z, yaw, (i + j) % 3 ? '#5a4030' : '#8a6a48', { y: 0, noLights: true }); }
    if (i % 2 === 0) { const ga = (i + 0.5) / 48 * TAU, [x, z] = ang(ga, C.R - 1.5), col = i % 6 === 0 ? '#ffb84a' : '#5aff8a'; api.instance('skc_lantern', x, z, { y: 0, yaw: ga + Math.PI / 2, tint: cartTintOf(col) }); api.glow(x + Math.cos(ga + Math.PI / 2) * 0.7, 2.5, z - Math.sin(ga + Math.PI / 2) * 0.7, 1.4, col); api.light(x * 0.97, z * 0.97, 9, col, 0.4); }
  }
  // ---- beyond: black cliffs round the cove (open to the sea to the north), a lighthouse-less headland, the ghost ship's moorings ----
  api.instanceProto('skc_cliff', m => { m.color('#ffffff').shine(0); m.ellipsoid(0, 6, 0, 14, 16, 11, { seg: m.lo ? 8 : 12, rings: m.lo ? 6 : 9 }); m.ellipsoid(8, 3, 4, 9, 10, 8, { seg: 8, rings: 6 }); m.ellipsoid(-7, 13, -2, 8, 9, 7, { seg: 8, rings: 6 }); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 12, y0: 0, y1: 20 }] }; }, { r: 16, near: 80, mid: 220, farD: 520, lo: true, far: m => { m.color('#ffffff'); m.ellipsoid(0, 6, 0, 14, 16, 11, { seg: 6, rings: 4 }); } });
  for (let i = 0; i < 30; i++) { const a = i / 30 * TAU + rng() * 0.08; if (seaOpen(a)) continue; const r = C.R + 26 + rng() * 26, [x, z] = ang(a, r); api.instance('skc_cliff', x, z, { y: -2, yaw: rng() * TAU, scale: 1.1 + rng() * 0.8, tint: cartTintOf(['#2a2e38', '#343844', '#262a32'][i % 3]), noCol: true }); }
  for (const a of [-0.45, 0.5]) { const [x, z] = ang(a, C.R + 60); api.instance('skc_stack', x, z, { y: -1, yaw: a, scale: 1.6, tint: cartTintOf('#3a4050'), noCol: true }); }
  E.beams = [{ kind: 'search', x: 0, y: 1, z: C.R + 120, c: [0.5, 1, 0.7], ph: 0, sp: 0.25, len: 160, w: 6, a: 0.12 }];
  // ---- royale spots: gift boxes, repair kits, spawns, the storm's end points ----
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU + 0.26, 34); E.gifts.push({ x, z }); }
  for (let i = 0; i < C.stackN; i++) { const [x, z] = ang((i + 0.8) / C.stackN * TAU, 82); E.gifts.push({ x, z }); }
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU + 0.7, 156); E.gifts.push({ x, z }); }
  const repairs = []; for (let i = 0; i < 7; i++) repairs.push(ang((i + 0.5) / 7 * TAU + 0.3, 78));
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, [x, z] = ang(a, 146); E.spawn.push({ x, z, yaw: a + Math.PI / 2 }); }
  for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 30 + rng() * 135, [x, z] = ang(a, r); E.orbSpots.push({ x, z }); }
  E.zones = [{ x: 0, z: 0, r: 18, name: 'THE SKULL' }]; E.flagSpots = [{ x: 0, z: 60 }]; E.captures = [{ x: 0, z: -90, r: 9 }];
  E.royale = { R: C.R - 4, x: 0, z: 0, ends: [0, 1, 2, 3, 4].map(i => ang(i / 5 * TAU + 0.6, 80)), repairs, storm: { name: 'SEA FOG', col: '#9ad8c8' }, avoid: [[0, 0, C.skullR + 4]] };
  return this.finish(E);
};

/* ---------------- the moving parts: the ghost galleon ---------------- */
function cartSkcGhost(m) {
  // a three-master, all pale green and glowing; forward = +z, ~26 m long
  m.color('#9affc8', 0.55).shine(1);
  m.ellipsoid(0, 3.4, 0, 4.4, 3.6, 13, { seg: 18, rings: 6, phi0: Math.PI / 2 });
  m.color('#c8ffe0', 0.7); for (let i = 0; i < 24; i++) { const a0 = i / 24 * TAU, a1 = (i + 1) / 24 * TAU; m.limb(Math.cos(a0) * 4.4, 3.5, Math.sin(a0) * 13, Math.cos(a1) * 4.4, 3.5, Math.sin(a1) * 13, 0.18, 0.18, { seg: 4, ends: false }); }
  m.color('#6adca0', 0.45); m.roundBox(0, 5.4, -10, 7, 3.4, 5, 0.4); m.limb(0, 3.6, 12.5, 0, 6.5, 18, 0.3, 0.16, { seg: 6 });
  for (const [z, h] of [[-4, 17], [3, 21], [9, 15]]) {
    m.color('#b0ffd0', 0.6); m.limb(0, 3.4, z, 0, h, z, 0.3, 0.2, { seg: 6 });
    m.color('#e0fff0', 0.4); for (let k = 0; k < 2; k++) { const y = h - 3 - k * 5, w = 8 - k * 1.5; m.limb(-w / 2, y + 1.8, z, w / 2, y + 1.8, z, 0.12, 0.12, { seg: 4 }); m.push(); m.tf(0, y, z + 0.4, 0, 0.12, 0); for (let i = 0; i < 5; i++) m.box(-w / 2 + w / 10 + i * w / 5, -Math.sin(i * 1.9) * 0.4, 0, w / 5 - 0.15, 3.6 - Math.abs(Math.sin(i * 2.3)) * 1.2, 0.05); m.pop(); }
  }
  m.color('#ffffff', 1); for (let i = 0; i < 6; i++) m.ball(i % 2 ? 4.3 : -4.3, 4.6, -8 + i * 3.2, 0.25, { seg: 5, rings: 3 }); m.emissive(0);
  // the ghost skull figurehead
  m.color('#e0fff0', 0.8); m.ball(0, 5.2, 13.6, 0.9, { seg: 10, rings: 7 }); m.color('#0a2018'); for (const sx of [-0.3, 0.3]) m.ball(sx, 5.3, 14.35, 0.22, { seg: 6, rings: 4 }); m.emissive(0).shine(0);
}

/* ---------------- the rules ---------------- */
// the idle blowhole / keg stack with the most cars near it (so they go off where the action is; ties broken at random,
// the j-th pick skips the busiest), or -1 when no car is near any
function skcBusiest(s, list, near, j) {
  let best = -1, bs = 0, second = -1, ss = 0;
  for (let i = 0; i < list.length; i++) {
    const h = list[i]; if (h.st !== 'idle') continue; let n = 0;
    for (const k of s.karts) if (!k.out && !k.hidden && (k.x - h.x) ** 2 + (k.z - h.z) ** 2 < near * near) n++;
    if (!n) continue; const sc = n + s.rng() * 0.9;
    if (sc > bs) { second = best; ss = bs; best = i; bs = sc; } else if (sc > ss) { second = i; ss = sc; }
  }
  return j ? second : best;
}
CART_ARENA_RULES.skullcove = {
  music: 'kart3',
  onLoad(s) {
    const E = s.E, C = SKC_C;
    const D = s.skc = { t: 0, ghost: { st: 'wait', t: 0, next: C.ghost.first, x0: 0, z0: 0, dx: 0, dz: 1, L: 0, u: 0, x: 0, z: 0, yaw: 0, mask: 0, lane: 0 },
      holes: E.skc.holes.map(h => ({ x: h.x, z: h.z, st: 'idle', t: 0, mask: 0 })), spoutNext: C.spout.first, lastHole: -1,
      kegs: E.skc.kegs.map((k, i) => ({ x: k.x, z: k.z, st: 'idle', t: 0, mask: 0, i })), kegNext: C.keg.first, kegI: 0 };
    const G = new BurnsGroup(Math.min(64, BurnsGL.maxBones || 32));
    D.ship = G.add(m => cartSkcGhost(m), { visible: false }); G.finish(); D.groups = [G];
  },
  onUpdate(s, dt, racing) {
    const D = s.skc, C = SKC_C; if (!D) return;
    const live = racing && s.state === 'race' && !(s.obj && s.obj.ended);
    if (!live) return;
    D.t += dt;
    const P = s.player, nearP = (x, z, r) => P && !P.out && Math.hypot(P.x - x, P.z - z) < r;
    // ---- the ghost galleon: pick a lane (a chord clear of the skull), warn, sail it ----
    const g = D.ghost, GC = C.ghost;
    if (g.st === 'wait') { g.next -= dt; if (g.next <= 0) {
      const a = s.rng() * TAU, off = (35 + s.rng() * 45) * (s.rng() < 0.5 ? -1 : 1);
      g.dx = Math.sin(a); g.dz = Math.cos(a); const px = Math.cos(a), pz = -Math.sin(a);
      // aim the lane at the player now and then (a third of the passes), so it reads as a threat
      if (P && !P.out && s.rng() < 0.35) { const pd = P.x * px + P.z * pz; if (Math.abs(pd) > 25 && Math.abs(pd) < 120) { g.lane = pd; } else g.lane = off; } else g.lane = off;
      const Lc = Math.sqrt(Math.max(400, C.R * C.R - g.lane * g.lane)) + 10;
      g.x0 = px * g.lane - g.dx * Lc; g.z0 = pz * g.lane - g.dz * Lc; g.L = Lc * 2; g.px = px; g.pz = pz;
      g.st = 'warn'; g.t = 0; g.mask = 0; g.yaw = a;
      Sound.play('powerdown', { vol: 0.5, pitch: 0.6 });
      if (P && !P.out && Math.abs((P.x - g.x0) * px + (P.z - g.z0) * pz) < GC.lane) s.banner('GHOST SHIP!', '#7aff9a', 1.4, 'get out of the green lane', true);
    } }
    else if (g.st === 'warn') { g.t += dt; g.u = 0; g.x = g.x0; g.z = g.z0; if (g.t >= GC.warn) { g.st = 'sail'; g.t = 0; Sound.play('cartBoom', { vol: 0.25, pitch: 0.4 }); } }
    else if (g.st === 'sail') {
      g.t += dt; const d = g.t * GC.speed; g.x = g.x0 + g.dx * d; g.z = g.z0 + g.dz * d;
      for (const k of s.karts) {
        if (k.out || (g.mask & (1 << k.slot)) || k.y > 6) continue;
        const rx = k.x - g.x, rz = k.z - g.z, al = rx * g.dx + rz * g.dz, ac = rx * g.px + rz * g.pz;
        if (Math.abs(al) > GC.len + 1 || Math.abs(ac) > GC.beam + 1) continue;
        g.mask |= 1 << k.slot; const sd = ac >= 0 ? 1 : -1;
        if (s.hit(k, 'knock', null, { item: 'skcghost', dx: g.px * sd * 0.8 + g.dx * 0.6, dz: g.pz * sd * 0.8 + g.dz * 0.6, power: 15, banner: 'GHOST SHIP!' }) && s.fx) s.fx.burst(k.x, k.y + 1.2, k.z, 'star', 12, '#9affc8');
      }
      if (d > g.L) { g.st = 'wait'; g.next = GC.period + s.rng() * 4; }
    }
    // ---- blowholes: every 3.4 s, one or two holes boil (1.4 s), then spout (1 s) ----
    D.spoutNext -= dt;
    if (D.spoutNext <= 0) {
      D.spoutNext = C.spout.period;
      const n = D.t > 30 ? 2 : 1;
      for (let j = 0; j < n; j++) { let i = skcBusiest(s, D.holes, 22, j); if (i < 0) i = Math.floor(s.rng() * D.holes.length); for (let tries = 0; tries < 6 && (D.holes[i].st !== 'idle' || i === D.lastHole); tries++) i = (i + 3) % D.holes.length; const h = D.holes[i]; if (h.st !== 'idle') continue; h.st = 'warn'; h.t = 0; h.mask = 0; D.lastHole = i; if (nearP(h.x, h.z, 14)) s.banner('BLOWHOLE!', '#9ad8ff', 1.0, 'off the slab!', true); }
    }
    for (const h of D.holes) {
      if (h.st === 'idle') continue; h.t += dt;
      if (h.st === 'warn' && h.t >= C.spout.warn) { h.st = 'spout'; h.t = 0; Sound.play('splash', { vol: nearP(h.x, h.z, 50) ? 0.8 : 0.2, pitch: 0.6 }); if (nearP(h.x, h.z, 25)) s.shakeIt(0.4); }
      else if (h.st === 'spout') {
        for (const k of s.karts) { if (k.out || (h.mask & (1 << k.slot))) continue; const dx = k.x - h.x, dz = k.z - h.z, d = Math.hypot(dx, dz); if (d > C.spout.r) continue; h.mask |= 1 << k.slot; if (s.hit(k, 'launch', null, { item: 'skcspout', dx: dx / (d || 1), dz: dz / (d || 1), power: 5, vy: 13, banner: 'BLOWHOLE!' }) && s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'ring', 12, '#c8f0ff'); }
        if (h.t >= C.spout.dur) { h.st = 'idle'; h.t = 0; }
      }
    }
    // ---- powder kegs: one stack at a time lights its fuse (1.6 s), then BOOM ----
    D.kegNext -= dt;
    if (D.kegNext <= 0) { D.kegNext = C.keg.period + s.rng() * 1.5; const kb = skcBusiest(s, D.kegs, 28, 0), K = D.kegs[(D.kegI = kb >= 0 ? kb : (D.kegI + 1 + Math.floor(s.rng() * 2)) % D.kegs.length)]; if (K.st === 'idle') { K.st = 'fuse'; K.t = 0; Sound.play('cartSparkle', { vol: nearP(K.x, K.z, 40) ? 0.6 : 0.15, pitch: 0.5 }); if (nearP(K.x, K.z, 20)) s.banner('POWDER KEGS!', '#ff6a3a', 1.0, 'get clear!', true); } }
    for (const K of D.kegs) {
      if (K.st === 'idle') continue; K.t += dt;
      if (K.st === 'fuse' && K.t >= C.keg.warn) {
        K.st = 'boom'; K.t = 0; const near = P && Math.hypot(P.x - K.x, P.z - K.z);
        Sound.play('cartBoom', { vol: near < 60 ? 0.9 : 0.25, pitch: 0.8 }); if (near < 30) s.shakeIt(0.8);
        if (s.fx) { s.fx.burst(K.x, 2.5, K.z, 'flame', 18, '#ff8a3a'); s.fx.burst(K.x, 2.5, K.z, 'star', 12, '#ffcc44'); s.fx.smoke(K.x, 2, K.z, 10, '#9a9aa0'); }
        for (const k of s.karts) { if (k.out || k.y > 5) continue; const dx = k.x - K.x, dz = k.z - K.z, d = Math.hypot(dx, dz); if (d > C.keg.r) continue; s.hit(k, 'knock', null, { item: 'skckeg', dx: dx / (d || 1), dz: dz / (d || 1), power: 16, banner: 'KA-BOOM!' }); }
      } else if (K.st === 'boom' && K.t > 0.6) { K.st = 'idle'; K.t = 0; }
    }
  },
  render(s, R) {
    const D = s.skc; if (!D) return;
    const g = D.ghost, o = D.ship, show = g.st === 'warn' || g.st === 'sail';
    o.visible = show;
    if (show) { const rise = g.st === 'warn' ? Math.min(1, g.t / SKC_C.ghost.warn) : 1; o.x = g.x; o.z = g.z; o.y = -6 * (1 - rise) + Math.sin(s.time * 1.3) * 0.4; o.yaw = g.yaw; o.pitch = Math.sin(s.time * 0.9) * 0.03; o.roll = Math.sin(s.time * 1.1) * 0.06; o.scale = 1; }
    for (const G of D.groups) { G.pose(s.cam); R.skin(G.geo, G.bones, G.objs.length, null, 0, 0.5); }
  },
  draw(s, R, Sp, t) {
    const D = s.skc, C = SKC_C; if (!D) return;
    const g = D.ghost, cam = s.cam, near = (x, z, r) => (x - cam.x) ** 2 + (z - cam.z) ** 2 < r * r;
    // the skull's eyes: a green fire flickering over the sockets
    { const f = 0.7 + 0.3 * Math.sin(t * 7) * Math.sin(t * 3.1); for (const sx of [-1, 1]) { R.bbs.bb(-sx * 4.8, 13.6, -12.6, 6 * f, 7 * f, Sp.glow, C.green, 0.7, true); R.bbs.bb(-sx * 4.8, 14.4, -12.8, 2.4 * f, 3.6 * f, Sp.flame, C.green, 0.9, true); } }
    // the ghost galleon: its lane flashes green during the warning (arrows the way it will sail), a wake behind it
    if (g.st === 'warn' || g.st === 'sail') {
      const fl = g.st === 'warn' ? 0.35 + 0.65 * Math.max(0, Math.sin(t * (10 + g.t * 6))) : 0.5, yaw = Math.atan2(g.dx, g.dz);
      for (let d = 6; d < g.L; d += 12) { const x = g.x0 + g.dx * d, z = g.z0 + g.dz * d; if (!near(x, z, 220)) continue; if (Math.hypot(x, z) > C.R + 4) continue; if (g.st === 'sail' && d < g.t * C.ghost.speed - C.ghost.len - 30) continue; R.flat.flat(x, 0.08, z, C.ghost.lane, 11, yaw, Sp.square, C.green, (g.st === 'warn' ? 0.3 : 0.14) * fl, true); if (g.st === 'warn') R.flat.flat(x, 0.1, z, 6, 6, yaw + Math.PI, Sp.arrow, C.ghostCol, 0.8 * fl, true); }
      if (g.st === 'sail' || g.t > 0.4) {
        R.bbs.bb(g.x, 8, g.z, 34, 26, Sp.glow, C.ghostCol, 0.22, true);
        for (let i = 0; i < 6; i++) { const b = (t * 0.7 + i / 6) % 1; R.bbs.bb(g.x - g.dx * (14 + b * 18) + g.px * Math.sin(i * 2.3) * 3, 1.5 + b * 2, g.z - g.dz * (14 + b * 18) + g.pz * Math.sin(i * 2.3) * 3, 7 + b * 6, 4 + b * 3, Sp.puff, C.ghostCol, 0.35 * (1 - b), true, i); }
        R.flat.flat(g.x, 0.09, g.z, C.ghost.beam * 2.4, C.ghost.len * 2.2, yaw, Sp.glow, C.green, 0.35, true);
      }
    }
    // blowholes: sand boils and a white ring closes on the hole, then the spout
    for (const h of D.holes) {
      if (h.st === 'idle' || !near(h.x, h.z, 200)) continue;
      if (h.st === 'warn') { const u = h.t / C.spout.warn, fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * (12 + u * 14))); R.flat.flat(h.x, 0.1, h.z, C.spout.r * 2.2, C.spout.r * 2.2, 0, Sp.warn, C.white, 0.8 * fl, true); for (let i = 0; i < 2; i++) { const v = 1 - ((u * 2 + i / 2) % 1), r = 1.5 + v * C.spout.r * 2; R.flat.flat(h.x, 0.11, h.z, r, r, 0, Sp.ring, C.foam, 0.8 * (1 - v * 0.6), true); } if (s.fx && Math.random() < 0.4) s.fx.dust(h.x, 0.2, h.z, 1, '#8a94a8'); }
      else { const a = Math.min(1, h.t * 6, (C.spout.dur - h.t) * 4), H = 14 * Math.min(1, h.t * 5); R.bbs.streak(h.x, H / 2, h.z, 0, 1, 0, H, 3.4, Sp.streak, C.foam, 0.9 * a); R.bbs.streak(h.x, H / 2, h.z, 0, 1, 0, H * 0.9, 1.6, Sp.streak, C.white, a); for (let i = 0; i < 5; i++) { const ang = t * 3 + i * 1.26, rr = 1 + ((t * 2 + i * 0.2) % 1) * 3; R.bbs.bb(h.x + Math.cos(ang) * rr, H * (0.6 + 0.08 * i), h.z + Math.sin(ang) * rr, 4, 3, Sp.puff, C.foam, 0.6 * a, false, ang); } R.flat.flat(h.x, 0.1, h.z, C.spout.r * 2.2, C.spout.r * 2.2, t, Sp.ring, C.sea, 0.7 * a, true); }
    }
    // powder kegs: sparks running up the stack, a red ring for the blast; the fireball
    for (const K of D.kegs) {
      if (K.st === 'idle' || !near(K.x, K.z, 200)) continue;
      if (K.st === 'fuse') { const u = K.t / C.keg.warn, fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * (12 + u * 18))); R.flat.flat(K.x, 0.1, K.z, C.keg.r * 2, C.keg.r * 2, 0, Sp.warn, C.red, 0.85 * fl, true); R.flat.flat(K.x, 0.09, K.z, C.keg.r * 2, C.keg.r * 2, 0, Sp.glow, C.red, 0.25 * fl, true); R.bbs.bb(K.x, 0.5 + u * 3.9, K.z, 1.6, 1.6, Sp.spark, C.gold, 1, true, t * 9); if (s.fx && Math.random() < 0.6) s.fx.spark(K.x, 0.5 + u * 3.9, K.z, 1, '#ffcc44', 3); }
      else { const a = 1 - K.t / 0.6; R.bbs.bb(K.x, 3, K.z, 16 * (0.5 + K.t), 16 * (0.5 + K.t), Sp.glow, C.amber, a, true); R.flat.flat(K.x, 0.1, K.z, C.keg.r * 2.2 * (0.4 + K.t), C.keg.r * 2.2 * (0.4 + K.t), 0, Sp.ring, C.amber, a, true); }
    }
  },
  lights(s, add) {
    const D = s.skc, C = SKC_C; if (!D) return;
    add(0, 14, -12, 26, C.green, 1.0, 1.5);
    const g = D.ghost; if (g.st === 'sail' || g.st === 'warn') add(g.x, 6, g.z, 30, C.ghostCol, 1.2, 2);
    for (const K of D.kegs) if (K.st === 'boom') add(K.x, 3, K.z, 22, C.amber, 2, 2); else if (K.st === 'fuse') add(K.x, 2, K.z, 10, C.red, 0.8, 1);
  },
  radar(s, ctx, P, sc) {
    const D = s.skc, q = SKC_T.p; if (!D) return;
    P(0, 0, q); ctx.fillStyle = 'rgba(230,226,210,0.8)'; ctx.beginPath(); ctx.arc(q.x, q.y, SKC_C.skullR * sc, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(150,200,255,0.7)'; for (const h of D.holes) { P(h.x, h.z, q); ctx.beginPath(); ctx.arc(q.x, q.y, 2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,110,60,0.85)'; for (const K of D.kegs) { P(K.x, K.z, q); ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }
    const g = D.ghost; if (g.st !== 'wait') { P(g.x0, g.z0, q); const x0 = q.x, y0 = q.y; P(g.x0 + g.dx * g.L, g.z0 + g.dz * g.L, q); ctx.strokeStyle = 'rgba(120,255,160,0.6)'; ctx.lineWidth = Math.max(2, SKC_C.ghost.lane * sc); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(q.x, q.y); ctx.stroke(); P(g.x, g.z, q); ctx.fillStyle = '#9affc8'; ctx.beginPath(); ctx.arc(q.x, q.y, 4, 0, TAU); ctx.fill(); }
  }
};

/* ---------------- the registry ---------------- */
var CART_ROYALE_ARENAS = (typeof CART_ROYALE_ARENAS !== 'undefined' && CART_ROYALE_ARENAS) || {};
CART_ARENAS.push({
  id: 'skullcove', name: 'SKULL COVE', sub: 'Battle royale: a ghost ship, blowholes and powder kegs', objectives: ['royale'], royale: true, levelCar: 'galleon',
  col: '#5aff8a', tod: 'night', blurb: 'Dusty Doubloon\'s cove. Dodge the ghost galleon, the blowholes and the powder kegs. Last car running wins.'
});
CART_ROYALE_ARENAS.galleon = 'skullcove';
CART_ARENA_ICONS.skullcove = (ctx, s, t, col) => {
  // a grinning skull with green fire in its eyes
  ctx.save(); ctx.fillStyle = '#1a1e26'; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8e2d0'; ctx.beginPath(); ctx.ellipse(0, -s * 0.08, s * 0.42, s * 0.38, 0, 0, TAU); ctx.fill(); ctx.fillRect(-s * 0.26, s * 0.12, s * 0.52, s * 0.3);
  const f = 0.8 + 0.2 * Math.sin(t * 6);
  for (const sx of [-1, 1]) { ctx.fillStyle = '#0a0c10'; ctx.beginPath(); ctx.ellipse(sx * s * 0.17, -s * 0.08, s * 0.12, s * 0.13, 0, 0, TAU); ctx.fill(); ctx.fillStyle = rgba(col, f); ctx.beginPath(); ctx.arc(sx * s * 0.17, -s * 0.06, s * 0.06 * f, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#0a0c10'; for (let i = 0; i < 4; i++) ctx.fillRect(-s * 0.2 + i * s * 0.13, s * 0.24, s * 0.04, s * 0.18);
  ctx.restore();
};
