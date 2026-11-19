/* ============================================================
   ART CART — royale arena: TIDE POOL (id 'tidepool', Whale of a Time's arena; level agent "whale", Nov 19 2026)
   A giant rock pool at low tide, the sea all round it. The rim is a ring of barnacled boulders and kelp; the floor is
   wet sand, rock shelves and shallow pools, starfish and anemones. In the middle THE BLOWHOLE ROCK, a big barnacled
   mound with a blowhole on top. Round it a ring of cover (kelp rocks, coral heads, a sunken rowboat, a giant
   starfish you can see over) and four GIANT CLAMS. Sandbar kickers on the outer floor.
   Its hazards (all telegraphed, all readable on a phone):
     · THE BLOWHOLE BLAST: the rock rumbles and steams, a white ring flashes round it (1.6 s), then it blows and a
       ring wave rolls out across the pool (dying out before the rim: the outer floor is safe): 6 HP and shoved outward. HOP the ring as it reaches you.
     · GIANT CLAMS: a clam yawns open and shows its glowing PEARL (grab it: +15 HP). Then it shudders and a red ring
       flashes round it (1.2 s) before it SNAPS shut: 12 HP and spat out. Grab and go, or keep clear when it shakes.
     · GEYSERS: a patch of sand starts to bubble under a car (a closing target, 1.3 s), then a geyser erupts and
       launches it: 11 HP. Keep moving and steer off the bubbles.
   WHALE OF A TIME's SKY BREACH is in everyone's gift boxes here (arena levelCar). Registers itself; globals are
   prefixed TDP_, state lives on s.tdp. Start it: BRADY_CART.debug.start({ mode: 'royale', arena: 'tidepool' }).
   ============================================================ */
const TDP = {
  R: 178, rimH: 9,
  rock: { r: 17, h: 11 },
  ring: { first: 20, period: 24, warn: 1.6, speed: 32, band: 2.6, end: 125 },
  clam: { n: 4, ring: 96, closed: 6, open: 5, shake: 1.2, r: 7.5, grab: 4.6, heal: 15 },
  gey: { first: 9, period: 5.0, warn: 1.3, erupt: 0.8, r: 4.6, n: 3 },
  C: { white: [1, 1, 1], foam: [0.95, 0.98, 1], aqua: [0.35, 0.88, 1], water: [0.6, 0.88, 1], blue: [0.25, 0.55, 1], deep: [0.1, 0.35, 0.8], black: [0, 0, 0], warn: [1, 0.6, 0.2], red: [1, 0.25, 0.3], pearl: [1, 0.95, 0.9], pink: [1, 0.6, 0.8], mist: [0.85, 0.95, 1], sand: [0.9, 0.8, 0.6] }
};
const TDP_T = { p: {} };

/* ---------------- the world ---------------- */
CartWorlds.arena_tidepool = function (A, night) {
  const S = TDP, R = S.R, E = this.base(2131, [-280, -280, 280, 280], '#cdb486', 0);
  const sky = Object.assign(CART_SKIES.day(), { zen: '#3a8ee8', hor: '#ffeccc', sky: '#a4d8ff', fog: '#cfe6f2', fogD: 0.0016, haze: 0.18, clouds: 0.6, key: '#fff0dc', keyK: 1.05, gnd: '#dfe8cc' });
  Object.assign(E, { id: 'tidepool', arena: A, sky, tod: 'day', music: 'kart4', night: false, R });
  const api = E.api, T = E.terrain, rng = mulberry32(2131);
  const ang = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
  const clamA = i => i / S.clam.n * TAU + Math.PI / 4;
  // ---- the floor: wet sand, rock shelves, pools, ripples; the sea outside the rim ----
  api.paint((ctx, P, sc) => {
    const c0 = P(0, 0);
    // the sea beyond the rim: shallows to deep blue, swell lines
    const gs = ctx.createRadialGradient(c0[0], c0[1], (R + 6) * sc, c0[0], c0[1], 300 * sc); gs.addColorStop(0, '#2ab8c8'); gs.addColorStop(0.15, '#1a8cc8'); gs.addColorStop(1, '#0c4a96');
    ctx.fillStyle = gs; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1 * sc; for (let r = R + 25; r < 300; r += 18) { ctx.beginPath(); ctx.arc(c0[0], c0[1], r * sc, 0, TAU); ctx.stroke(); }
    // the pool floor
    const g = ctx.createRadialGradient(c0[0], c0[1], 10 * sc, c0[0], c0[1], (R + 8) * sc); g.addColorStop(0, '#d2b480'); g.addColorStop(0.7, '#c09c6a'); g.addColorStop(1, '#7a7a68');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c0[0], c0[1], (R + 8) * sc, 0, TAU); ctx.fill();
    // rock shelves (dark), shallow pools (turquoise, a pale rim), pink coralline crusts
    for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 40 + rng() * 130, q = P(...ang(a, r)), w = (5 + rng() * 12) * sc; ctx.fillStyle = `rgba(${96 + Math.floor(rng() * 24)},${92 + Math.floor(rng() * 16)},${86 + Math.floor(rng() * 16)},0.8)`; ctx.beginPath(); ctx.ellipse(q[0], q[1], w, w * (0.4 + rng() * 0.4), rng() * 3, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 38; i++) { const a = rng() * TAU, r = 30 + rng() * 140, q = P(...ang(a, r)), w = (4 + rng() * 11) * sc; ctx.fillStyle = 'rgba(40,165,205,0.82)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], w, w * (0.5 + rng() * 0.4), rng() * 3, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(230,250,255,0.55)'; ctx.lineWidth = 0.4 * sc; ctx.stroke(); }
    for (let i = 0; i < 30; i++) { const a = rng() * TAU, r = 25 + rng() * 150, q = P(...ang(a, r)), w = (1.5 + rng() * 3) * sc; ctx.fillStyle = 'rgba(255,120,160,0.7)'; ctx.beginPath(); ctx.arc(q[0], q[1], w, 0, TAU); ctx.fill(); }
    // sand ripples
    ctx.strokeStyle = 'rgba(150,120,80,0.25)'; ctx.lineWidth = 0.5 * sc; for (let i = 0; i < 70; i++) { const a = rng() * TAU, r = 30 + rng() * 140, q = P(...ang(a, r)), w = (3 + rng() * 6) * sc, b = rng() * 3; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.arc(q[0] + Math.cos(b) * k * 1.2 * sc, q[1] + Math.sin(b) * k * 1.2 * sc, w, b - 0.6, b + 0.6); ctx.stroke(); } }
    // the blowhole rock's wet apron and the clams' rings of crushed shell
    { const gw = ctx.createRadialGradient(c0[0], c0[1], S.rock.r * sc, c0[0], c0[1], (S.rock.r + 14) * sc); gw.addColorStop(0, 'rgba(70,90,100,0.6)'); gw.addColorStop(1, 'rgba(70,90,100,0)'); ctx.fillStyle = gw; ctx.beginPath(); ctx.arc(c0[0], c0[1], (S.rock.r + 14) * sc, 0, TAU); ctx.fill(); }
    for (let i = 0; i < S.clam.n; i++) { const q = P(...ang(clamA(i), S.clam.ring)); ctx.fillStyle = 'rgba(250,240,230,0.5)'; ctx.beginPath(); ctx.arc(q[0], q[1], 9 * sc, 0, TAU); ctx.fill(); }
  });
  // ---- the rim: a ring of barnacled boulders and kelp (one lumpy lathe), the fence just inside it ----
  CartScene.mesh(api, 0, 0, 0, m => {
    const lump = th => 1 + 0.025 * Math.sin(th * 23) + 0.015 * Math.sin(th * 57 + 1);
    m.color('#6e6a66').shine(1); m.lathe([[R + 0.5, 0], [R + 0.3, 3], [R + 1.5, 6.5], [R + 4, S.rimH], [R + 7.5, S.rimH - 1], [R + 10, 4], [R + 11, 0]], { seg: 160, rMod: (th, t) => t > 0.05 && t < 0.95 ? lump(th) : 1 });
    m.color('#3a6a3a').shine(2); m.lathe([[R + 0.4, 0], [R + 0.4, 1.6], [R + 0.25, 1.6], [R + 0.25, 0]], { seg: 160 });
    m.color('#f2efe6').shine(2); for (let i = 0; i < 240; i++) { const th = i / 240 * TAU + Math.sin(i * 7.1) * 0.01, y = 2.4 + ((i * 0.618) % 1) * 5, r = R + 0.4 + (y - 2) * 0.38; m.ball(Math.sin(th) * r, y, Math.cos(th) * r, 0.22 + (i % 3) * 0.08, { seg: 5, rings: 3 }); }
    return { cols: [] };
  }, { hi: true, noAO: true });
  const poly = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; poly.push([Math.sin(a) * R, Math.cos(a) * R]); }
  E.walls = poly; CartDecor.protos(E);
  CartKit.kinds(E, TDP_KINDS);
  // ---- THE BLOWHOLE ROCK: a big barnacled mound, the blowhole on top, kelp and starfish on its flanks ----
  CartScene.mesh(api, 0, 0, 0, tdpBlowRock, { hi: true });
  E.art.push({ x: 0, z: 0, r: S.rock.r + 2 });
  // ---- the clams' lower shells (the lids are moving parts), facing the middle ----
  for (let i = 0; i < S.clam.n; i++) { const a = clamA(i), [x, z] = ang(a, S.clam.ring); CartScene.mesh(api, x, z, a + Math.PI, tdpClamBase, { hi: true }); E.art.push({ x: x - Math.sin(a) * -3, z: z - Math.cos(a) * -3, r: 4.5 }); }
  // ---- the cover ring (r ≈ 70 / 120): kelp rocks, coral heads, a sunken rowboat, a giant starfish ----
  const kinds = ['rock', 'coral', 'boat', 'rock', 'star', 'coral', 'rock', 'coral'];
  for (let i = 0; i < kinds.length; i++) {
    const a = (i + 0.5) / kinds.length * TAU, r = i % 2 ? 66 : 124, [x, z] = ang(a, r), yaw = rng() * TAU, kd = kinds[i];
    if (kd === 'rock') { CartScene.mesh(api, x, z, yaw, m => { tdpRock(m, false); m.push(); m.tf(2.6, 0, 1.4, 1, 0, 0, 0.7, 0.7, 0.7); tdpRock(m, false); m.pop(); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.6, y0: 0, y1: 3 }] }; }, { hi: true, scale: 2.6 }); E.art.push({ x, z, r: 9 }); }
    else if (kd === 'coral') { CartScene.mesh(api, x, z, yaw, tdpCoral, { hi: true, scale: 1.4 }); E.art.push({ x, z, r: 8 }); }
    else if (kd === 'boat') { CartScene.mesh(api, x, z, yaw, tdpRowboat, { hi: true, scale: 1.5 }); E.art.push({ x, z, r: 10 }); }
    else { CartScene.mesh(api, x, z, yaw, tdpStarfish, { hi: true, scale: 1.0 }); }
  }
  // anemones and urchins scattered about (low: you drive round them), sandbar kickers on the outer floor
  for (let i = 0; i < 26; i++) { const a = rng() * TAU, r = 30 + rng() * 135, [x, z] = ang(a, r); if (Math.hypot(x, z) < S.rock.r + 8 || E.art.some(q => Math.hypot(q.x - x, q.z - z) < q.r + 4)) continue; CartKit.put(E, i % 3 ? 'tdp_anem' : 'tdp_urchin', x, z, rng() * TAU, ['#ff6aa8', '#ffb84a', '#c08aff', '#5adca0', '#ff5a5a'][i % 5], { scale: 1 + rng() * 0.6, noLights: true }); }
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.6, [x, z] = ang(a, 142); T.add(CartFeat.ramp(x, z, a + Math.PI / 2 * (i % 2 ? 1 : -1), 7, 7, 2.1, { col: '#e8d2a0', stripe: '#2a8ad8' })); }
  // ---- beyond the rim: the lighthouse, boats, buoys, cliffs with beach huts; spectators on the rim rocks ----
  CartScene.mesh(api, 40, R + 60, 0.3, m => { const r = wrdLighthouse(m); return r; }, { hi: false });
  CartScene.mesh(api, -170, 150, 0.8, m => wrdBoat(m, '#e8403a', '#ffffff'), { hi: false });
  CartScene.mesh(api, 210, -90, 2.2, m => wrdBoat(m, '#ffd23a', '#4ab0ff'), { hi: false });
  CartScene.mesh(api, -120, -215, -0.4, m => wrdBoat(m, '#ffffff', '#5adca0'), { hi: false });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.15, [x, z] = ang(a, R + 30 + (i % 3) * 14); CartKit.put(E, 'tdp_buoy', x, z, i, ['#ff5a3a', '#ffd23a', '#5adca0'][i % 3], { y: -0.6, noLights: true }); }
  for (const a of [1.2, 2.8, 4.1, 5.6]) { const [x, z] = ang(a, R + 8); E.spots.push(...CartScene.bleachers(api, x, z, a + Math.PI, 22, 3, rng)); }
  api.sign('TIDE POOL', 0, R - 2, { yaw: Math.PI, h: 1.6, y: 3.2, post: false, maxW: 9, style: { bg: '#2a6ad8', fg: '#ffffff', border: '#ffd23a' } });
  api.sign('TIDE POOL', 0, -R + 2, { yaw: 0, h: 1.6, y: 3.2, post: false, maxW: 9, style: { bg: '#2a6ad8', fg: '#ffffff', border: '#ffd23a' } });
  // ---- royale spots: gift boxes, repair kits, spawns, the storm's end points ----
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU + 0.5, 42); E.gifts.push({ x, z }); }
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU, 82); E.gifts.push({ x, z }); }
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU + 0.26, 130); E.gifts.push({ x, z }); }
  const repairs = []; for (let i = 0; i < 6; i++) repairs.push(ang(i / 6 * TAU + 0.78, 108)); repairs.push([38, -38], [-38, 40]);
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, [x, z] = ang(a, 144); E.spawn.push({ x, z, yaw: a + Math.PI / 2 }); }
  for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 35 + rng() * 130, [x, z] = ang(a, r); if (Math.hypot(x, z) > S.rock.r + 6) E.orbSpots.push({ x, z }); }
  E.zones = [{ x: 0, z: 60, r: 10, name: 'THE POOL' }]; E.flagSpots = [{ x: 0, z: 60 }]; E.captures = [{ x: 0, z: -90, r: 9 }];
  E.royale = { R: R - 4, x: 0, z: 0, ends: [[0, -75], [75, 30], [-75, 30], [60, -60], [-60, -60]], repairs, storm: { name: 'HIGH TIDE', col: '#bfe8ff' }, avoid: [[0, 0, S.rock.r + 4]] };
  return this.finish(E);
};
// a lumpy barnacled rock (about 2.4 m across at scale 1)
function tdpRock(m, lo) {
  const sg = lo ? 8 : 14, rg = lo ? 6 : 9;
  m.color('#6e6a66').shine(1); m.ellipsoid(0, 0.9, 0, 2.3, 1.6, 2.0, { seg: sg, rings: rg, colFn: (x, y) => y < -0.9 ? '#3e5a40' : null }); m.color('#7c7670'); m.ellipsoid(0.8, 1.5, -0.4, 1.3, 1.0, 1.2, { seg: sg - 2, rings: rg - 2 });
  if (!lo) { m.color('#f2efe6').shine(2); for (let i = 0; i < 16; i++) { const a = i * 2.39996, y = 0.6 + ((i * 0.618) % 1) * 1.6, r = 2.0 * Math.sqrt(Math.max(0.05, 1 - Math.pow((y - 0.9) / 1.7, 2))); m.ball(Math.cos(a) * r, y, Math.sin(a) * r * 0.9, 0.16 + (i % 3) * 0.05, { seg: 5, rings: 3 }); } }
  m.color('#3a8a4a').shine(1); for (let i = 0; i < 4; i++) { const a = i * 1.6 + 0.4; m.limb(Math.cos(a) * 2.0, 0.1, Math.sin(a) * 1.8, Math.cos(a) * 2.4, 1.0 + (i % 2) * 0.5, Math.sin(a) * 2.1, 0.16, 0.05, { seg: 5 }); }
  m.shine(0);
}
// THE BLOWHOLE ROCK: a dome of dark rock in layers, barnacle crust, a black blowhole on top, kelp, starfish
function tdpBlowRock(m) {
  const r = TDP.rock.r, h = TDP.rock.h, lump = th => 1 + 0.06 * Math.sin(th * 7) + 0.04 * Math.sin(th * 13 + 2);
  m.color('#5e5a58').shine(1); m.lathe([[r, 0], [r * 0.96, h * 0.25], [r * 0.82, h * 0.55], [r * 0.6, h * 0.82], [r * 0.32, h], [2.4, h + 0.2], [2.2, h - 0.4], [0, h - 0.6]], { seg: 40, rMod: (th, t) => t < 0.9 ? lump(th) : 1 });
  m.color('#6e6a66'); m.lathe([[r * 0.98, h * 0.3], [r * 0.86, h * 0.48], [r * 0.85, h * 0.5], [r * 0.97, h * 0.32]], { seg: 40, rMod: th => lump(th + 0.5) });
  m.color('#0a0e14').shine(4); m.disc(0, h - 0.55, 0, 2.2, 18);
  m.color('#3e4448').shine(2); m.torus(0, h + 0.1, 0, 2.6, 0.5, { seg: 22, tseg: 6 });
  m.color('#f2efe6').shine(2); for (let i = 0; i < 70; i++) { const th = i * 2.39996, t = 0.08 + ((i * 0.618) % 1) * 0.75, rr = r * (1 - t * 0.7) * lump(th), y = h * t; m.limb(Math.sin(th) * rr, y, Math.cos(th) * rr, Math.sin(th) * (rr + 0.4), y + 0.25, Math.cos(th) * (rr + 0.4), 0.3, 0.15, { seg: 6, ends: false }); }
  m.color('#3a8a4a').shine(1); for (let i = 0; i < 18; i++) { const th = i / 18 * TAU + 0.1; m.limb(Math.sin(th) * r * 0.98, 0.1, Math.cos(th) * r * 0.98, Math.sin(th + 0.1) * (r + 1.6), 2.5 + (i % 3), Math.cos(th + 0.1) * (r + 1.6), 0.4, 0.1, { seg: 6 }); }
  for (const [th, t, c] of [[0.5, 0.35, '#ff7a3a'], [2.4, 0.5, '#c08aff'], [4.3, 0.3, '#ff5a8a']]) { const rr = r * (1 - t * 0.7) * lump(th) + 0.2, y = h * t, cx = Math.sin(th) * rr, cz = Math.cos(th) * rr; m.color(c).shine(1); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; m.limb(cx, y, cz, cx + Math.sin(th) * 0.1 + Math.cos(th) * Math.cos(a) * 1.4, y + Math.sin(a) * 1.4, cz + Math.cos(th) * 0.1 - Math.sin(th) * Math.cos(a) * 1.4, 0.4, 0.12, { seg: 5 }); } }
  m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: r, y0: 0, y1: h }] };
}
// a giant clam's lower shell (hinge at local z = -3.5, mouth toward +z), scalloped ribs, a pink mantle inside
function tdpClamBase(m) {
  m.color('#e8e0f0').shine(3); m.push(); m.tf(0, 0, 0, 0, 0, 0, 1, 1, 1); m.ellipsoid(0, 0.9, 0, 5, 1.6, 4, { seg: 26, rings: 10, phi0: Math.PI / 2 }); m.pop();
  m.color('#b8a0d8'); for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * Math.PI * 0.95; m.limb(Math.sin(a) * 0.5, 0.05, -3.4, Math.sin(a) * 4.95, 0.6, Math.cos(a) * 3.9 - 0.2, 0.2, 0.32, { seg: 6 }); }
  m.color('#ff8ab8', 0.06).shine(2); m.push(); m.tf(0, 0.95, 0.2, 0, 0, 0, 1, 1, 1); m.ellipsoid(0, 0, 0, 4.2, 0.35, 3.3, { seg: 20, rings: 6 }); m.pop(); m.emissive(0);
  m.color('#f4e8ff'); m.roundBox(0, 0.9, -3.6, 4, 0.9, 0.9, 0.4);
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: -2.6, hx: 4.6, hz: 1.4, y0: 0, y1: 2 }] };
}
// a coral head: branching fingers and fans in sunny colours
function tdpCoral(m) {
  const C = ['#ff7a8a', '#ffb84a', '#c08aff', '#ff6aa8'];
  m.color('#e8b090').shine(1); m.ellipsoid(0, 0.6, 0, 3.4, 1.2, 3.0, { seg: 14, rings: 7 });
  for (let i = 0; i < 14; i++) { const a = i * 2.39996, r = 0.6 + (i % 4) * 0.6, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 2.5 + (i % 5) * 0.9; m.color(C[i % 4]).shine(1); m.limb(x, 1, z, x * 1.4, h, z * 1.4, 0.32, 0.18, { seg: 7 }); m.limb(x * 1.4, h, z * 1.4, x * 1.4 + Math.cos(a + 1) * 0.9, h + 0.9, z * 1.4 + Math.sin(a + 1) * 0.9, 0.18, 0.12, { seg: 6 }); m.ball(x * 1.4 + Math.cos(a + 1) * 0.9, h + 0.9, z * 1.4 + Math.sin(a + 1) * 0.9, 0.2, { seg: 6, rings: 4 }); }
  m.color('#ffd23a'); for (let i = 0; i < 2; i++) { m.push(); m.tf(i ? -2 : 2, 1, i ? 1 : -1, i * 2, 0, 0); m.ellipsoid(0, 2.2, 0, 1.8, 2.0, 0.1, { seg: 14, rings: 8, phi1: Math.PI * 0.6 }); m.pop(); }
  m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.2, y0: 0, y1: 4 }] };
}
// a sunken rowboat, half buried, weed on its ribs
function tdpRowboat(m) {
  m.color('#9a6a42').shine(1); m.push(); m.tf(0, 0, 0, 0, 0, 0.35, 1, 0.6, 2.4); m.ellipsoid(0, 0.8, 0, 2.3, 2.0, 2.3, { seg: 18, rings: 8, phi0: Math.PI / 2 }); m.pop();
  m.color('#7a5034'); for (let i = -2; i <= 2; i++) m.push(), m.tf(0, 0.9, i * 1.5, 0, 0, 0.35), m.box(0, 0, 0, 4.2, 0.18, 0.4), m.pop();
  m.color('#e8403a'); m.limb(-0.5, 0.8, 4.6, 0.6, 1.3, 5.6, 0.2, 0.2, { seg: 6 });
  m.color('#3a8a4a'); for (let i = 0; i < 6; i++) m.limb(-1.5 + i * 0.6, 0.6, -4 + i * 1.4, -1.8 + i * 0.6, 2.2 + (i % 2), -3.6 + i * 1.4, 0.16, 0.05, { seg: 5 });
  m.color('#b89468'); m.limb(1.5, 0.5, -1, 4.5, 0.7, 1.5, 0.12, 0.1, { seg: 6 }); m.roundBox(4.9, 0.7, 1.9, 0.5, 0.12, 1.4, 0.05);
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.3, hz: 5.4, y0: 0, y1: 2 }] };
}
// a giant orange starfish lying flat (cover you can see over: low, wide)
function tdpStarfish(m) {
  m.color('#ff7a3a').shine(1); m.ellipsoid(0, 0.5, 0, 3, 0.9, 3, { seg: 18, rings: 7, phi1: Math.PI * 0.55 });
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; m.limb(Math.sin(a) * 2, 0.6, Math.cos(a) * 2, Math.sin(a) * 9, 0.35, Math.cos(a) * 9, 1.6, 0.5, { seg: 10 }); }
  m.color('#ffd0a0'); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; for (let k = 1; k <= 5; k++) m.ball(Math.sin(a) * (1.6 + k * 1.4), 0.95 + (5 - k) * 0.1 - 0.3, Math.cos(a) * (1.6 + k * 1.4), 0.25, { seg: 6, rings: 4 }); }
  m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3, y0: 0, y1: 1.4 }] };
}
const TDP_KINDS = {
  // a sea anemone: a squat column with a crown of waving tentacles (tinted)
  tdp_anem: { r: 1.4, near: 34, mid: 110, farD: 260,
    build(m) { m.color('#ffffff').shine(2); m.lathe([[1.0, 0], [0.8, 0.8], [0.95, 1.2], [0.4, 1.25], [0, 1.15]], { seg: 14 }); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; m.limb(Math.sin(a) * 0.75, 1.2, Math.cos(a) * 0.75, Math.sin(a) * 1.3, 2.0 + (i % 3) * 0.2, Math.cos(a) * 1.3, 0.14, 0.06, { seg: 5 }); } m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1, y0: 0, y1: 1.5 }] }; },
    far(m) { m.color('#ffffff'); m.cyl(0, 0, 0, 1, 1.2, 1.8, 6); } },
  // a spiny sea urchin (tinted)
  tdp_urchin: { r: 1.2, near: 30, mid: 100, farD: 240,
    build(m) { m.color('#ffffff').shine(2); m.ball(0, 0.7, 0, 0.8, { seg: 10, rings: 7 }); for (let i = 0; i < 26; i++) { const y = 1 - (i + 0.5) / 26 * 1.6, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.39996; if (y < -0.4) continue; m.limb(Math.cos(a) * r * 0.7, 0.7 + y * 0.7, Math.sin(a) * r * 0.7, Math.cos(a) * r * 1.6, 0.7 + y * 1.6, Math.sin(a) * r * 1.6, 0.06, 0.01, { seg: 3 }); } m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.9, y0: 0, y1: 1.5 }] }; },
    far(m) { m.color('#ffffff'); m.ball(0, 0.7, 0, 1.0, { seg: 6, rings: 4 }); } },
  // a marker buoy at sea (tinted)
  tdp_buoy: { r: 1.4, near: 40, mid: 140, farD: 360,
    build(m) { m.color('#ffffff').shine(3); m.lathe([[1.1, 0], [1.3, 0.6], [1.0, 1.4], [0.5, 2.6], [0.3, 3.6], [0, 3.7]], { seg: 14 }); m.color('#fff4b0', 0.6); m.ball(0, 3.9, 0, 0.3, { seg: 8, rings: 6 }); m.emissive(0).shine(0); return { cols: [] }; },
    far(m) { m.color('#ffffff'); m.cyl(0, 0, 0, 1.1, 0.3, 3.6, 6); } }
};

/* ---------------- the moving parts ---------------- */
const TdpMesh = {
  // a clam's lid: the hinge at the origin, the shell reaching along +z (pitch opens it)
  lid(m) {
    m.color('#e8e0f0').shine(3); m.push(); m.tf(0, 0, 3.5, 0, 0, 0, 1, 1, 1); m.ellipsoid(0, 0, 0, 5, 1.8, 4, { seg: 26, rings: 10, phi1: Math.PI / 2 }); m.pop();
    m.color('#b8a0d8'); for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * Math.PI * 0.95; m.limb(Math.sin(a) * 0.5, 1.0, 0.1, Math.sin(a) * 4.8, 0.3, 3.5 + Math.cos(a) * 3.8, 0.25, 0.35, { seg: 6 }); }
    m.color('#ff8ab8').shine(2); m.push(); m.tf(0, -0.05, 3.5, 0, 0, 0, 1, 1, 1); m.ellipsoid(0, 0, 0, 4.4, 0.25, 3.4, { seg: 20, rings: 5, phi0: Math.PI / 2 }); m.pop();
    // big googly eyes on the lid's lip (it is a cartoon)
    m.color('#ffffff').shine(3); for (const sd of [-1, 1]) m.ball(sd * 1.4, 0.9, 7.0, 0.55, { seg: 10, rings: 8 }); m.color('#101828'); for (const sd of [-1, 1]) m.ball(sd * 1.4, 0.95, 7.45, 0.28, { seg: 8, rings: 6 });
    m.shine(0);
  },
  pearl(m) { m.color('#fff8f0', 0.45).shine(4); m.ball(0, 0, 0, 1.0, { seg: 16, rings: 12 }); m.emissive(0).shine(0); }
};

/* ---------------- the rules ---------------- */
CART_ARENA_RULES.tidepool = {
  music: 'kart4',
  onLoad(s) {
    const S = TDP;
    const G = CartKit.group(s, [['lids', TdpMesh.lid, S.clam.n], ['pearls', TdpMesh.pearl, S.clam.n]]);
    const D = s.tdp = { t: 0, ring: { st: 'idle', t: 0, next: S.ring.first, r: 0, mask: 0, hopMask: 0 }, clams: [], geys: [], geyNext: S.gey.first, lastGey: null };
    for (let i = 0; i < S.clam.n; i++) { const a = i / S.clam.n * TAU + Math.PI / 4, hx = Math.sin(a) * (S.clam.ring + 3.5), hz = Math.cos(a) * (S.clam.ring + 3.5); D.clams.push({ i, a, hx, hz, px: Math.sin(a) * (S.clam.ring - 0.5), pz: Math.cos(a) * (S.clam.ring - 0.5), cx: Math.sin(a) * (S.clam.ring - 1), cz: Math.cos(a) * (S.clam.ring - 1), st: 'closed', t: -i * 2.6, open: 0, pearl: false, mask: 0, lid: G.lids[i], pobj: G.pearls[i] }); }
    for (let i = 0; i < S.gey.n; i++) D.geys.push({ st: 'off', t: 0, x: 0, z: 0, tgt: null, mask: 0 });
  },
  onUpdate(s, dt, racing) {
    const D = s.tdp; if (!D) return;
    const live = racing && s.state === 'race' && !(s.obj && s.obj.ended);
    if (live) D.t += dt;
    tdpRing(s, D, dt, live); tdpClams(s, D, dt, live); tdpGeysers(s, D, dt, live);
  },
  // the AI: hop the ring wave as it arrives, leave a shaking clam, drive off a bubbling geyser (by skill)
  onStep(s, k, dt, racing) {
    const D = s.tdp; if (!D || (k.player && !s.autoDrive) || !racing || k.out || s.state !== 'race') return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9, luck = ((k.slot * 7 + Math.floor(D.t * 0.7)) % 10) / 10, ok = luck < 0.5 + (sk - 0.85) * 3;
    if (!ok) return;
    const steerTo = a => { const d = cartWrap(a - k.yaw); I.steer = clamp(-d * 2.4, -1, 1); };
    const W = D.ring;
    if (W.st === 'wave') { const gap = Math.hypot(k.x, k.z) - W.r; if (gap > 0 && gap < 2.5 + k.speed * 0.06 && !k.air) { I.driftPress = true; I.drift = false; return; } }
    for (const c of D.clams) { if (c.st !== 'shake') continue; const dd = Math.hypot(k.x - c.cx, k.z - c.cz); if (dd < TDP.clam.r + 4) { steerTo(Math.atan2(k.x - c.cx, k.z - c.cz)); I.gas = 1; return; } }
    for (const g of D.geys) { if (g.st !== 'warn') continue; const dd = Math.hypot(k.x - g.x, k.z - g.z); if (dd < TDP.gey.r + 3) { steerTo(Math.atan2(k.x - g.x, k.z - g.z)); I.gas = 1; return; } }
    // hurt and a pearl is showing nearby: go and get it
    if (k.hp < 70) for (const c of D.clams) { if (c.st !== 'open' || !c.pearl || c.t > TDP.clam.open - 1.5) continue; const dd = Math.hypot(k.x - c.px, k.z - c.pz); if (dd < 45) { steerTo(Math.atan2(c.px - k.x, c.pz - k.z)); return; } }
  },
  draw(s, R, Sp, t) { const D = s.tdp; if (D) tdpDraw(s, D, R, Sp, t); },
  lights(s, add) { const D = s.tdp; if (!D) return; for (const c of D.clams) if (c.pearl && c.open > 0.3) add(c.px, 2, c.pz, 10, TDP.C.pearl, 0.8, 1); },
  radar(s, ctx, P, sc) {
    const q = CART_ROY_T.p, D = s.tdp;
    P(0, 0, q); ctx.fillStyle = 'rgba(110,106,102,0.85)'; ctx.beginPath(); ctx.arc(q.x, q.y, 3.5, 0, TAU); ctx.fill();
    if (D) for (const c of D.clams) { P(c.cx, c.cz, q); ctx.fillStyle = c.pearl && c.st === 'open' ? 'rgba(255,248,240,0.95)' : 'rgba(200,170,230,0.8)'; ctx.beginPath(); ctx.arc(q.x, q.y, 2.5, 0, TAU); ctx.fill(); }
  }
};

// ---- the blowhole blast: the rock rumbles and steams (warning), then a ring wave rolls out across the pool ----
function tdpRing(s, D, dt, live) {
  const S = TDP.ring, W = D.ring, r0 = TDP.rock.r;
  if (W.st === 'idle' && live && D.t > W.next) { W.st = 'warn'; W.t = 0; W.mask = 0; W.warned = false; Sound.play('cartGeyser', { vol: 0.5, pitch: 0.45 }); Sound.play('crumble', { vol: 0.4, pitch: 0.6 }); }
  if (W.st === 'warn') {
    W.t += dt;
    const P = s.player; if (P && !P.out && !W.warned && W.t > 0.2) { W.warned = true; s.banner('BLOWHOLE BLAST!', '#4ab0ff', 1.3, 'hop the ring wave', true); }
    if (W.t > S.warn) { W.st = 'wave'; W.t = 0; W.r = r0; Sound.play('cartGeyser', { vol: 1, pitch: 0.7 }); Sound.play('splash', { vol: 0.9, pitch: 0.5 }); if (P && Math.hypot(P.x, P.z) < 70) s.shakeIt(0.6); }
  } else if (W.st === 'wave') {
    W.t += dt; W.r = r0 + W.t * S.speed;
    if (live) for (const k of s.karts) {
      if (k.out || (W.mask & (1 << k.slot))) continue;
      const d = Math.hypot(k.x, k.z); if (Math.abs(d - W.r) > S.band) continue;
      W.mask |= 1 << k.slot;
      if (k.air && k.y > s.terrain.height(k.x, k.z) + 0.3) { if (k.player) s.banner('NICE HOP!', '#7aff8a', 0.7, null, true); continue; }
      if (s.hit(k, 'knock', null, { item: 'tdp_ring', dx: k.x / (d || 1), dz: k.z / (d || 1), power: 14, banner: 'BLOWHOLE BLAST!' })) { if (s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'drop', 12, '#bfe8ff'); }
    }
    if (W.r > S.end) { W.st = 'idle'; W.next = D.t + S.period * (0.85 + s.rng() * 0.3); }
  }
}
// ---- giant clams: closed; yawn open (a pearl: +15 HP to the first car in); shudder (warning); SNAP ----
function tdpClams(s, D, dt, live) {
  const S = TDP.clam;
  for (const c of D.clams) {
    if (live) c.t += dt;
    if (c.st === 'closed') { c.open = Math.max(0, c.open - dt * 6); if (c.t > S.closed) { c.st = 'open'; c.t = 0; c.pearl = true; c.mask = 0; if (CartKit.near(s, c.cx, c.cz, 60)) Sound.play('door', { vol: 0.4, pitch: 0.6 }); } }
    else if (c.st === 'open') {
      c.open = Math.min(1, c.open + dt * 1.5);
      if (c.pearl && live && c.open > 0.6) for (const k of s.karts) { if (k.out || (k.hp >= k.hpMax - 0.5 && !k.player)) continue; if (Math.hypot(k.x - c.px, k.z - c.pz) > S.grab) continue; c.pearl = false; cartRoyHeal(s, k, S.heal, 'pearl'); Sound.play('cartSparkle', { vol: k.player ? 0.9 : 0.25, pitch: 1.3 }); if (k.player) s.banner('PEARL! +' + S.heal + ' HP', '#fff4e8', 1.1, 'now get out before it snaps', true); if (s.fx) s.fx.burst(c.px, 1.5, c.pz, 'star', 12, '#fff4e8'); break; }
      if (c.t > S.open) { c.st = 'shake'; c.t = 0; c.warned = false; if (CartKit.near(s, c.cx, c.cz, 60)) Sound.play('crumble', { vol: 0.5, pitch: 1.3 }); }
    } else if (c.st === 'shake') {
      const P = s.player; if (P && !P.out && !c.warned && Math.hypot(P.x - c.cx, P.z - c.cz) < S.r + 8) { c.warned = true; s.banner('CLAM SNAP!', '#ff6a8a', 1.0, 'get clear', true); }
      if (c.t > S.shake) {
        c.st = 'closed'; c.t = 0; c.open = 0.3; c.pearl = false;
        const P2 = s.player; Sound.play('cartChomp', { vol: P2 && Math.hypot(P2.x - c.cx, P2.z - c.cz) < 60 ? 0.9 : 0.15, pitch: 0.6 });
        if (s.fx && CartKit.near(s, c.cx, c.cz, 120)) s.fx.burst(c.cx, 1.5, c.cz, 'drop', 14, '#e8f6ff');
        if (live) for (const k of s.karts) { if (k.out || k.y > 4) continue; const dx = k.x - c.hx, dz = k.z - c.hz, dd = Math.hypot(k.x - c.cx, k.z - c.cz); if (dd > S.r) continue; const l = Math.hypot(dx, dz) || 1; s.hit(k, 'knock', null, { item: 'tdp_clam', dx: dx / l, dz: dz / l, power: 16, banner: 'CLAM SNAP!' }); }
      }
    }
    const shake = c.st === 'shake' ? Math.sin(s.time * 40) * 0.05 : 0, op = c.st === 'shake' ? c.open : c.open;
    const o = c.lid; if (o) { o.live = true; o.visible = true; o.x = c.hx; o.z = c.hz; o.y = 0.95; o.yaw = c.a + Math.PI; o.pitch = -op * 0.75 + shake; o.roll = shake; o.scale = 1; }
    const p = c.pobj; if (p) { const on = c.pearl && c.open > 0.15; p.live = on; p.visible = on; p.x = c.px; p.z = c.pz; p.y = 1.9 + Math.sin(s.time * 2 + c.i) * 0.1; p.yaw = s.time; p.pitch = 0; p.roll = 0; p.scale = 1; }
  }
}
// ---- geysers: a patch of sand bubbles under a car (target closing), then erupts and launches whoever is on it ----
function tdpGeysers(s, D, dt, live) {
  const S = TDP.gey;
  if (live && D.t > D.geyNext) {
    D.geyNext = D.t + S.period * (0.8 + s.rng() * 0.4);
    let g = null; for (const q of D.geys) if (q.st === 'off') { g = q; break; }
    let best = null, bs = -1e9; for (const k of s.karts) { if (k.out || k.hidden || k.invT > 1) continue; let busy = false; for (const q of D.geys) if (q.st !== 'off' && q.tgt === k) busy = true; const sc = s.rng() * 10 - (busy ? 50 : 0) - (k === D.lastGey ? 20 : 0); if (sc > bs) { bs = sc; best = k; } }
    if (g && best) {
      D.lastGey = best; g.tgt = best; g.st = 'warn'; g.t = 0; g.mask = 0;
      const lead = 0.8 + s.rng() * 0.4; g.x = best.x + best.vx * lead + (s.rng() - 0.5) * 5; g.z = best.z + best.vz * lead + (s.rng() - 0.5) * 5;
      const r = Math.hypot(g.x, g.z); if (r > TDP.R - 8) { g.x *= (TDP.R - 8) / r; g.z *= (TDP.R - 8) / r; } if (r < TDP.rock.r + 5) { const f = (TDP.rock.r + 5) / (r || 1); g.x *= f; g.z *= f; }
      if (best.player) Sound.play('cartBubble', { vol: 0.7, pitch: 0.5 });
    }
  }
  for (const g of D.geys) {
    if (g.st === 'off') continue;
    g.t += dt;
    if (g.st === 'warn' && g.t > S.warn) { g.st = 'erupt'; g.t = 0; const P = s.player; Sound.play('cartGeyser', { vol: P && Math.hypot(P.x - g.x, P.z - g.z) < 60 ? 0.9 : 0.15, pitch: 1.0 });
      if (live) for (const k of s.karts) { if (k.out || k.y > s.terrain.height(k.x, k.z) + 2.5) continue; if (Math.hypot(k.x - g.x, k.z - g.z) > S.r) continue; s.hit(k, 'launch', null, { item: 'tdp_geyser', vy: 12, banner: 'GEYSER!' }); } }
    else if (g.st === 'erupt' && g.t > S.erupt) g.st = 'off';
  }
}
// ---- sprites: the ring wave and its warning, the clams' pearls and snap rings, the geysers ----
function tdpDraw(s, D, R, Sp, t) {
  const C = TDP.C, W = D.ring, r0 = TDP.rock.r, h = TDP.rock.h;
  if (W.st === 'warn') {
    const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * (12 + W.t * 10)));
    R.flat.flat(0, 0.1, 0, (r0 + 6) * 2, (r0 + 6) * 2, t, Sp.ring, C.white, 0.85 * fl, false);
    for (let i = 0; i < 3; i++) { const u = (W.t / TDP.ring.warn * 1.5 + i / 3) % 1, r = r0 + 4 + u * 30; R.flat.flat(0, 0.1, 0, r * 2, r * 2, 0, Sp.ring, C.aqua, 0.7 * (1 - u) * fl, false); }
    for (let i = 0; i < 6; i++) { const u = (t * 1.2 + i / 6) % 1; R.bbs.bb(Math.sin(i * 1.7 + t) * 1.5, h + u * 9, Math.cos(i * 1.7 + t) * 1.5, 3 + u * 5, 3 + u * 5, Sp.puff, C.mist, 0.75 * (1 - u), false, t + i); }
    R.bbs.bb(0, h + 13, 0, 5, 5, Sp.warn || Sp.star, C.warn, 0.6 + 0.4 * fl, true);
  } else if (W.st === 'wave') {
    // the blast from the top, the ring of water rolling out
    if (W.t < 1.4) { const k2 = 1 - W.t / 1.4; R.bbs.streak(0, h + 14, 0, 0, 1, 0, 28, 6 * k2 + 1.5, Sp.streak, C.water, 0.85 * k2); R.bbs.streak(0, h + 13, 0, 0, 1, 0, 26, 2.5 * k2 + 0.6, Sp.streak, C.white, 0.9 * k2); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t; R.bbs.bb(Math.sin(a) * 6 * (1 - k2 + 0.3), h + 22 * (1 - k2 * 0.5), Math.cos(a) * 6 * (1 - k2 + 0.3), 7, 7, Sp.puff, C.foam, 0.8 * k2, false, i); } }
    const a = Math.min(1, W.t * 6, (TDP.ring.end - W.r) / 25), r = W.r;
    R.flat.flat(0, 0.1, 0, r * 2, r * 2, 0, Sp.ring, C.water, 0.85 * a, false); R.flat.flat(0, 0.11, 0, (r - 1.5) * 2, (r - 1.5) * 2, 0, Sp.ring, C.white, 0.7 * a, false);
    const n = Math.min(48, Math.floor(r / 4)), cam = s.cam;
    for (let i = 0; i < n; i++) { const th = i / n * TAU + 0.05, x = Math.sin(th) * r, z = Math.cos(th) * r; if ((x - cam.x) ** 2 + (z - cam.z) ** 2 > 160 * 160) continue; const hh = 1.8 + Math.sin(t * 9 + i * 1.3) * 0.4; R.bbs.bb(x, hh * 0.55, z, 4.6, hh * 1.4, Sp.puff, C.water, 0.85 * a, false, t * 3 + i); R.bbs.bb(x, hh + 0.2, z, 3.6, 2, Sp.foam || Sp.puff, C.foam, 0.9 * a, false, i); }
  }
  for (const c of D.clams) {
    if (c.pearl && c.open > 0.15) R.bbs.bb(c.px, 1.9, c.pz, 5, 5, Sp.glow, C.pearl, 0.5 + 0.2 * Math.sin(t * 3 + c.i), true);
    if (c.st === 'open' && c.pearl && c.t > 0.6) R.flat.flat(c.px, 0.1, c.pz, TDP.clam.grab * 2, TDP.clam.grab * 2, t, Sp.ring, C.pearl, 0.5, false);
    if (c.st === 'shake') { const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 20)); R.flat.flat(c.cx, 0.1, c.cz, TDP.clam.r * 2, TDP.clam.r * 2, 0, Sp.reticle || Sp.ring, C.red, 0.9 * fl, false); R.flat.flat(c.cx, 0.09, c.cz, TDP.clam.r * 2, TDP.clam.r * 2, 0, Sp.glow, C.red, 0.3 * fl, true); R.bbs.bb(c.cx, 7, c.cz, 3, 3, Sp.warn || Sp.star, C.warn, 0.6 + 0.4 * fl, true); }
  }
  for (const g of D.geys) {
    if (g.st === 'warn') {
      const u = g.t / TDP.gey.warn, bl = 0.5 + 0.5 * Math.sin(t * (10 + u * 20)), sz = TDP.gey.r * 2 * (1.4 - u * 0.4);
      R.flat.flat(g.x, 0.1, g.z, sz, sz, t * 2, Sp.reticle || Sp.ring, C.aqua, 0.85 * bl, false); R.flat.flat(g.x, 0.09, g.z, TDP.gey.r * 2, TDP.gey.r * 2, 0, Sp.glow, C.white, 0.3 * bl, true);
      for (let i = 0; i < 4; i++) { const v = (t * 2 + i * 0.25) % 1; R.bbs.bb(g.x + Math.sin(i * 2.1 + t * 3) * 1.6, 0.3 + v * 2 * u, g.z + Math.cos(i * 2.1 + t * 3) * 1.6, 1 + v, 1 + v, Sp.bubble || Sp.puff, C.water, 0.8 * (1 - v), false, i); }
    } else if (g.st === 'erupt') {
      const u = g.t / TDP.gey.erupt, a = Math.min(1, u * 8, (1 - u) * 3), hh = 15 * Math.min(1, u * 5);
      R.bbs.streak(g.x, hh / 2, g.z, 0, 1, 0, hh, 3.4, Sp.streak, C.water, 0.85 * a); R.bbs.streak(g.x, hh / 2, g.z, 0, 1, 0, hh * 0.9, 1.5, Sp.streak, C.white, 0.9 * a);
      for (let i = 0; i < 5; i++) { const v = (i / 5 + t * 1.5) % 1; R.bbs.bb(g.x + Math.sin(i + t) * v * 2.4, hh * (0.3 + v * 0.75), g.z + Math.cos(i + t) * v * 2.4, 3.4 + v * 2, 3.4 + v * 2, Sp.puff, C.foam, 0.8 * a, false, i); }
      R.flat.flat(g.x, 0.1, g.z, 10, 10, t * 3, Sp.ring, C.white, 0.7 * a, false);
    }
  }
}

/* ---------------- the registry ---------------- */
CART_ARENAS.push({
  id: 'tidepool', name: 'TIDE POOL', sub: 'Battle royale: the blowhole blast, snapping clams, geysers', objectives: ['royale'], royale: true, levelCar: 'whale',
  col: '#4ab0ff', tod: 'day', blurb: 'Whale of a Time\'s rock pool. Hop the blowhole\'s ring wave, grab a pearl before the clam snaps, dodge the geysers. Last car running wins.'
});
CART_ROYALE_ARENAS.whale = 'tidepool';
CART_ARENA_ICONS.tidepool = (ctx, s, t, col) => {
  // a rock pool seen from above: a rocky rim, water, a ring wave rolling out of the blowhole in the middle
  ctx.save(); ctx.fillStyle = '#7c7670'; ctx.beginPath(); ctx.arc(0, 0, s * 0.82, 0, TAU); ctx.fill();
  ctx.fillStyle = '#3ab8d8'; ctx.beginPath(); ctx.arc(0, 0, s * 0.66, 0, TAU); ctx.fill();
  const u = (t * 0.5) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.9 - u * 0.7})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, s * (0.2 + u * 0.44), 0, TAU); ctx.stroke();
  ctx.fillStyle = '#5e5a58'; ctx.beginPath(); ctx.arc(0, 0, s * 0.17, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(Math.sin(t * 4 + i * 2) * s * 0.05, -s * (0.2 + ((t * 1.5 + i / 3) % 1) * 0.3), s * 0.05, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ff7a3a'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = i % 2 ? s * 0.05 : s * 0.13; ctx.lineTo(s * 0.4 + Math.sin(a) * r, s * 0.3 + Math.cos(a) * r); } ctx.closePath(); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, s * 0.82, 0, TAU); ctx.stroke(); ctx.restore();
};
