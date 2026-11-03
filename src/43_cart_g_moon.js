/* ============================================================
   ART CART — arena: LUNA PLAYA (id 'moon')
   A Burning Man base camp on the moon: grey regolith, crater rims you
   jump off, habitat domes, a lander, rovers, a solar farm, glowing landing
   pads, a huge Earth hanging in the black sky. Everyone starts FLOATING
   (one-sixth-ish gravity, no grip) and has to grab MOON BOOTS to drive on
   the surface. Arena powers: MOON LASER, JET PACK, GRAVITY WELL.
   Extra objective: CRATER CLAIM (own the craters, they pay points).
   Everything here is an original design (affectionate satire, PG-13).
   Registers itself into the arena framework (see 43_cart_a_data.js).
   ============================================================ */

const CART_MOON_BOOT_COL = '#5af2ff', CART_MOON_BOOT_RGB = [0.35, 0.95, 1];
const CART_MOON_EARTH = { x: -72, y: 88, z: -148, r: 34 };

/* ---------------- a crater rim: a smooth ring of raised regolith (the floor is 0, so a crater is its rim) ---------------- */
function cartMoonCrater(cx, cz, R, w, H, o) {
  o = o || {};
  const wi = w * 0.8, wo = w, M = R + wo + 1.5;
  return Object.assign(cartBox(cx, cz, M), {
    kind: 'dirt', col: o.col || '#8e8e9a', res: o.res || 1.0, H, cx, cz, R, w,
    h(x, z) {
      const d = Math.hypot(x - cx, z - cz) - R;
      if (d < -wi || d > wo) return 0;
      const u = d < 0 ? d / wi : d / wo, t = 0.5 * (1 + Math.cos(u * Math.PI));
      return H * t * (1 + (BurnsM.noise2(x * 0.11 + cx, z * 0.11 + cz) - 0.5) * 0.22);
    }
  });
}

/* ---------------- the world ---------------- */
CartWorlds.arena_moon = function (A, night) {
  const E = this.base(2004, [-150, -150, 150, 150], '#9a9aa4', 0.02);
  const sky = Object.assign({}, BURNS_PALETTES.night, {
    zen: '#000003', hor: '#06070f', mid: '#03040a', midK: 0.5, fog: '#0b0b14', fogD: 0.0018, fogH: 0.02, haze: 0.12, fogMax: 0.55,
    sun: [205, -25], sunCol: '#000000', sunSize: 0.0001, moon: [30, 48], moonK: 0, stars: 1, milkyway: 1.3, clouds: 0, cloudCol: '#000000',
    mtnCol: '#050508', mtnH: 0.9, city: [0, 0], cityCol: '#000000', cityK: 0, sky: '#2e3858', gnd: '#141418', key: '#c8d8ff', keyK: 0.8, emB: 1.6, rim: '#9ab0ff', dust: 0.08
  });
  Object.assign(E, { id: 'moon', arena: A, sky, tod: 'night', music: 'kart3', night: true, R: 135 });
  const api = E.api, T = E.terrain, rng = mulberry32(2004);
  const CR = [[-58, -58, 20, 7, 3.2], [60, -56, 17, 6.5, 2.8], [58, 60, 22, 7.5, 3.4], [-60, 58, 18, 6.5, 3.0]];
  const names = ['CRATER TRANQUILITY', 'THE MOOP BOWL', 'MARE SPARKLE PONY', 'DARKWAD CRATER'];
  const PADS = [[0, 72], [72, 0], [0, -72], [-72, 0]];
  const clearOf = (x, z, r) => CR.every(c => Math.hypot(x - c[0], z - c[1]) > c[2] + c[3] + r) && Math.hypot(x, z) > 18 + r;
  // ---- ground paint: regolith splats, crater floors, boot prints, rover tracks, the landing pads ----
  api.paint((ctx, P, S) => {
    for (let i = 0; i < 320; i++) { const x = (rng() - 0.5) * 290, z = (rng() - 0.5) * 290, q = P(x, z), dark = rng() < 0.55; ctx.fillStyle = `rgba(${dark ? '70,70,84' : '190,190,204'},${0.05 + rng() * 0.1})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (1.5 + rng() * 7) * S, (1 + rng() * 5) * S, rng() * 3, 0, TAU); ctx.fill(); }
    // small crater splats: a dark floor with a pale ring
    for (let i = 0; i < 70; i++) { const x = (rng() - 0.5) * 270, z = (rng() - 0.5) * 270, r = 1 + rng() * 3.5, q = P(x, z); ctx.fillStyle = 'rgba(60,60,74,0.35)'; ctx.beginPath(); ctx.arc(q[0], q[1], r * S, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(205,205,220,0.35)'; ctx.lineWidth = 0.45 * S; ctx.beginPath(); ctx.arc(q[0], q[1], r * 1.08 * S, 0, TAU); ctx.stroke(); }
    for (const c of CR) { const q = P(c[0], c[1]); ctx.fillStyle = 'rgba(58,58,72,0.5)'; ctx.beginPath(); ctx.arc(q[0], q[1], (c[2] - c[3] * 0.8) * S, 0, TAU); ctx.fill(); }
    // boot prints: little pairs of ovals wandering about
    for (let t = 0; t < 26; t++) { let x = (rng() - 0.5) * 220, z = (rng() - 0.5) * 220, a = rng() * TAU; for (let k = 0; k < 14; k++) { a += (rng() - 0.5) * 0.7; x += Math.sin(a) * 0.9; z += Math.cos(a) * 0.9; const side = k % 2 ? 0.3 : -0.3, q = P(x - Math.cos(a) * side, z + Math.sin(a) * side); ctx.fillStyle = 'rgba(50,50,64,0.5)'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(-a); ctx.beginPath(); ctx.ellipse(0, 0, 0.16 * S, 0.34 * S, 0, 0, TAU); ctx.fill(); ctx.restore(); } }
    // rover tracks: two dashed lines looping the base
    ctx.setLineDash([0.5 * S, 0.35 * S]); ctx.strokeStyle = 'rgba(58,58,72,0.45)'; ctx.lineWidth = 0.3 * S;
    for (const off of [-0.9, 0.9]) { ctx.beginPath(); for (let i = 0; i <= 90; i++) { const a = i / 90 * TAU, r = 34 + Math.sin(a * 3) * 6 + off, q = P(Math.sin(a) * r, Math.cos(a) * r); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } ctx.stroke(); }
    ctx.setLineDash([]);
    // landing pads: pale concentric rings
    for (const [x, z] of PADS) { const q = P(x, z); for (const [r, w, a] of [[9, 0.5, 0.7], [6.5, 0.3, 0.5], [2.2, 0.8, 0.8]]) { ctx.strokeStyle = `rgba(200,230,255,${a})`; ctx.lineWidth = w * S; ctx.beginPath(); ctx.arc(q[0], q[1], r * S, 0, TAU); ctx.stroke(); } }
    // the base apron
    { const q = P(0, 0); ctx.fillStyle = 'rgba(150,150,166,0.35)'; ctx.beginPath(); ctx.arc(q[0], q[1], 22 * S, 0, TAU); ctx.fill(); }
  });
  // ---- terrain: the four big craters, little craters, regolith dunes, two kickers ----
  CR.forEach(c => T.add(cartMoonCrater(c[0], c[1], c[2], c[3], c[4])));
  for (let i = 0; i < 7; i++) { let x, z, tries = 0; do { const a = rng() * TAU, r = 36 + rng() * 80; x = Math.sin(a) * r; z = Math.cos(a) * r; tries++; } while (!clearOf(x, z, 12) && tries < 30); if (tries < 30) T.add(cartMoonCrater(x, z, 4.5 + rng() * 2.5, 2.8, 0.55 + rng() * 0.3, { res: 0.6 })); }
  for (const [a, r] of [[0.55, 112], [2.5, 108], [4.35, 115]]) T.add(CartFeat.mound(Math.sin(a) * r, Math.cos(a) * r, 16, 3.2, { col: '#a0a0ac' }));
  T.add(CartFeat.ramp(0, 42, Math.PI / 2, 6, 7, 2.0, { col: '#5a5a66', stripe: '#5af2ff' }));
  T.add(CartFeat.ramp(0, -42, -Math.PI / 2, 6, 7, 2.0, { col: '#5a5a66', stripe: '#ff4fd8' }));
  // ---- the lander (centre of the base) ----
  CartScene.mesh(api, 0, 0, 0.4, m => {
    m.color('#c8c8d2').shine(3);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4, lx = Math.sin(a), lz = Math.cos(a); m.limb(lx * 2.2, 2.6, lz * 2.2, lx * 4.6, 0.25, lz * 4.6, 0.14, 0.11, { seg: 6 }); m.color('#8a8a96'); m.roundCyl(lx * 4.6, 0, lz * 4.6, 0.75, 0.25, 0.08, { seg: 10 }); m.color('#c8c8d2'); }
    m.color('#d8c45a').shine(2); m.push(); m.tf(0, 2.0, 0); m.lathe([[0, 0], [2.9, 0], [2.9, 1.9], [2.6, 2.1], [0, 2.1]], { seg: 8 }); m.pop();   // gold-foil descent stage
    m.color('#e8e8f0').shine(3); m.push(); m.tf(0, 4.1, 0); m.lathe([[0, 0], [1.9, 0], [2.1, 1.0], [1.5, 2.4], [0, 2.6]], { seg: 10 }); m.pop();   // ascent stage
    m.color('#5af2ff', 1); m.roundBox(0, 5.0, 1.9, 1.0, 0.55, 0.12, 0.04); m.roundBox(0, 5.0, -1.9, 1.0, 0.55, 0.12, 0.04); m.emissive(0);   // windows
    m.color('#a0a0ac').shine(2); m.limb(0.9, 6.5, 0, 1.4, 9.2, 0.3, 0.05, 0.04, { seg: 5 }); m.color('#e8e8f0'); m.push(); m.tf(1.4, 9.2, 0.3, 0, 0.9, 0); m.ellipsoid(0, 0, 0, 0.8, 0.25, 0.8, { seg: 10, rings: 5 }); m.pop();   // dish
    m.color('#ff4fd8', 1); m.ball(1.4, 9.55, 0.3, 0.12, { seg: 6, rings: 4 }); m.emissive(0).shine(0);
    m.color('#2a2a30').shine(1); m.limb(0, 0.3, 2.4, 0, 2.0, 2.9, 0.12, 0.1, { seg: 5 }); for (let i = 0; i < 4; i++) m.roundBox(0, 0.5 + i * 0.45, 2.45 + i * 0.1, 0.9, 0.08, 0.25, 0.03); m.shine(0);   // the ladder
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.6, y0: 0, y1: 7 }] };
  }, { hi: true });
  api.light(0, 0, 18, '#9ad8ff', 0.6); api.glow(1.4, 9.55, 0.3, 1.2, '#ff4fd8', { blink: 2.2 });
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; api.glow(Math.sin(a) * 4.6, 0.5, Math.cos(a) * 4.6, 1.0, '#5af2ff'); }
  E.art.push({ x: 0, z: 0, r: 4.2 });
  // ---- habitat domes with glowing panels, joined by a tunnel ----
  for (const [x, z, r, c] of [[-24, 12, 5.5, '#dcdce6'], [-31, -5, 6.5, '#d0d8e8'], [-19, -17, 4.5, '#dcdce6']]) { CartScene.prop(api, 'dome', { x, z, r, col: c, lights: true, glow: '#5af2ff', freq: 2, seed: Math.floor(rng() * 99) }); api.light(x, z, r * 2.4, '#7ad8ff', 0.5); E.art.push({ x, z, r: r + 0.4 }); }
  CartScene.mesh(api, -26, 3, 0.45, m => { m.color('#bcbcc8').shine(2); m.limb(0, 1.0, -6, 0, 1.0, 6, 1.1, 1.1, { seg: 10 }); m.color('#5af2ff', 0.8); for (let i = -2; i <= 2; i++) m.roundBox(1.05, 1.1, i * 2.2, 0.08, 0.5, 0.9, 0.03); m.emissive(0).shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.2, hz: 6, y0: 0, y1: 2.2 }] }; });
  // ---- rovers ----
  const rover = (x, z, yaw) => {
    CartScene.mesh(api, x, z, yaw, m => {
      m.color('#d8d8e0').shine(2); m.roundBox(0, 1.1, 0, 2.2, 0.5, 3.4, 0.12); m.color('#6a6a76'); m.roundBox(0, 0.75, 0, 1.6, 0.25, 3.0, 0.06);
      m.color('#1a1a22').shine(1); for (const lx of [-1.25, 1.25]) for (const lz of [-1.2, 0, 1.2]) { m.push(); m.tf(lx, 0.55, lz, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.4, 0.17, { seg: 12, tseg: 6 }); m.pop(); }
      m.color('#a0a0ac').shine(2); m.limb(0, 1.35, -0.6, 0, 3.2, -0.6, 0.06, 0.05, { seg: 5 }); m.color('#1a3a8a').shine(3); m.roundBox(0, 3.3, -0.6, 1.6, 0.06, 1.1, 0.02); m.color('#ffffff', 0.6); m.roundBox(0, 1.4, 1.5, 0.9, 0.3, 0.08, 0.03);
      m.color('#ff8a2a', 1); m.ball(0, 1.6, -1.4, 0.12, { seg: 6, rings: 4 }); m.emissive(0).shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.5, hz: 1.9, y0: 0, y1: 1.6 }] };
    }, { hi: true });
    api.glow(x + Math.sin(yaw) * 1.5, 1.4, z + Math.cos(yaw) * 1.5, 0.9, '#ffffff'); E.art.push({ x, z, r: 2.4 });
  };
  rover(26, -24, 0.8); rover(-70, 14, -2.2); rover(20, 92, 2.6);
  // ---- solar farm ----
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { const x = 20 + i * 6, z = -30 - j * 7; CartScene.mesh(api, x, z, 0, m => { m.color('#8a8a96').shine(2); m.limb(0, 0, 0, 0, 1.6, 0, 0.07, 0.06, { seg: 5 }); m.push(); m.tf(0, 1.7, 0, 0, -0.6, 0); m.color('#1a2e7a').shine(3); m.roundBox(0, 0, 0, 5.2, 0.08, 2.6, 0.02); m.color('#8ab0ff', 0.25); for (let k = -2; k <= 2; k++) m.roundBox(k * 1.0, 0.05, 0, 0.04, 0.02, 2.4, 0.01); m.pop(); m.emissive(0).shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.6, hz: 1.3, y0: 0, y1: 2.4 }] }; }); E.art.push({ x, z, r: 2.6 }); }
  // ---- antennae with blinking tips ----
  for (const [a, r] of [[0.3, 118], [2.4, 120], [4.3, 116]]) { const x = Math.sin(a) * r, z = Math.cos(a) * r; CartScene.mesh(api, x, z, a, m => { m.color('#b0b0bc').shine(2); m.limb(0, 0, 0, 0, 14, 0, 0.18, 0.08, { seg: 6 }); for (let i = 0; i < 3; i++) { const b = i / 3 * TAU; m.limb(Math.sin(b) * 2.2, 0, Math.cos(b) * 2.2, 0, 5, 0, 0.06, 0.05, { seg: 4 }); } m.push(); m.tf(0, 10, 0, 0, 0.7, 0); m.color('#e8e8f0').shine(3); m.ellipsoid(0, 0, 0, 2.4, 0.5, 2.4, { seg: 12, rings: 5, phi1: Math.PI / 2 }); m.pop(); m.color('#ff4a4a', 1); m.ball(0, 14.2, 0, 0.25, { seg: 6, rings: 4 }); m.emissive(0).shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.6, y0: 0, y1: 14 }] }; }, { hi: true }); api.glow(x, 14.2, z, 1.6, '#ff4a4a', { blink: 3 }); E.art.push({ x, z, r: 1.2 }); }
  // ---- landing pads: emissive rings on the ground + a ring of lights (also the capture rings) ----
  for (const [x, z] of PADS) { CartScene.mesh(api, x, z, 0, m => { m.color('#5af2ff', 1); m.torus(0, 0.06, 0, 9.2, 0.14, { seg: 32, tseg: 4 }); m.color('#ffffff', 0.8); m.torus(0, 0.06, 0, 2.3, 0.1, { seg: 16, tseg: 4 }); m.emissive(0); }, { noAO: true }); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; api.glow(x + Math.sin(a) * 9.2, 0.3, z + Math.cos(a) * 9.2, 1.2, i % 2 ? '#5af2ff' : '#ffffff'); } api.light(x, z, 14, '#7ad8ff', 0.5); }
  // ---- camp flags round the base (neon pennant poles) + joke signs ----
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, x = Math.sin(a) * 14, z = Math.cos(a) * 14, c = BURNS_NEON[i % 7]; CartScene.mesh(api, x, z, a, m => { m.color('#d8d8e0').shine(2); m.limb(0, 0, 0, 0, 5.5, 0, 0.06, 0.04, { seg: 5 }); m.color(c, 0.9); m.roundBox(0.95, 5.0, 0, 1.8, 0.9, 0.04, 0.02); m.color('#f8f8ff', 0.6); m.roundBox(0.95, 4.55, 0, 1.8, 0.1, 0.05, 0.02); m.emissive(0).shine(0); }, { noAO: true }); api.glow(x, 5.0, z, 0.9, c); }
  const signs = ['LOW GRAVITY\nNO EXCUSES', 'LEAVE NO MOOP\nON THE MOON', 'NO ATMOSPHERE\n(BRING YOUR OWN)', 'MOON BOOTS\nREQUIRED', 'WELCOME HOME\n(384,400 KM)', 'ONE SMALL STEP\nFOR BURNERS'];
  signs.forEach((t, i) => { const a = i / 6 * TAU + 0.6, x = Math.sin(a) * 50, z = Math.cos(a) * 50; api.sign(t, x, z, { yaw: a + Math.PI, h: 1.0, y: 1.8, post: true, maxW: 3.0, style: { bg: '#10101c', fg: ['#5af2ff', '#ff4fd8', '#ffe24a'][i % 3], border: '#ffffff' }, glow: ['#5af2ff', '#ff4fd8', '#ffe24a'][i % 3] }); });
  // ---- the fence: chain-link with cold glowing posts ----
  const poly = []; for (let i = 0; i < 30; i++) { const a = i / 30 * TAU; poly.push([Math.sin(a) * 135, Math.cos(a) * 135]); }
  this.perimeter(E, poly, 'chain');
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; api.glow(Math.sin(a) * 134.3, 2.1, Math.cos(a) * 134.3, 1.3, i % 2 ? '#5af2ff' : '#c8d8ff'); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; CartScene.prop(api, 'lightTower', { x: Math.sin(a) * 126, z: Math.cos(a) * 126, aim: a + Math.PI }); api.light(Math.sin(a) * 110, Math.cos(a) * 110, 28, '#dce8ff', 0.4); }
  // ---- the Earth: a big blue-white ball far beyond the fence ----
  { const G = CART_MOON_EARTH; api.mesh(G.x, G.z, m => {
    m.color('#2a68d8', 0.3).shine(2);
    m.ball(0, 0, 0, G.r, { seg: 24, rings: 16, colFn: (x, y, z) => { const n = BurnsM.noise2(x * 0.09 + 3, z * 0.09 + y * 0.07 + 1), c = BurnsM.noise2(x * 0.16 + 9, y * 0.16 + z * 0.1); if (c > 0.68) return '#f4f8ff'; if (Math.abs(y) > G.r * 0.9) return '#f0f6ff'; if (n > 0.6) return n > 0.7 ? '#3f8a3a' : '#9a8a56'; return null; } });
    m.emissive(0).shine(0);
  }, { y: G.y, noAO: true }); }
  // ---- viewing stand (mission control) and the cast ----
  E.spots.push(...CartScene.bleachers(api, 0, 30, Math.PI, 18, 3, rng));
  E.heroes.push({ type: 'badideaguy', x: 6, z: 20, yaw: Math.PI, anim: 'dare' }, { type: 'burney', x: -6, z: 20, yaw: Math.PI, anim: 'photo' }, { type: 'fencebot_a', x: 40, z: 112, yaw: 0.3 + Math.PI, anim: 'robot' }, { type: 'fencebot_b', x: 44, z: 110, yaw: 0.3 + Math.PI, anim: 'robot' }, { type: 'sparklepony', x: 66, z: 72, yaw: -2.3, anim: 'cheer' });
  // ---- objective spots ----
  E.zones = CR.map((c, i) => ({ x: c[0], z: c[1], r: c[2] - c[3] * 0.8 + 1.5, name: names[i] }));
  E.craters = E.zones;
  for (let i = 0; i < 44; i++) { let x, z, tries = 0; do { const a = rng() * TAU, r = 14 + Math.pow(rng(), 2) * 104; x = Math.sin(a) * r; z = Math.cos(a) * r; tries++; } while (!clearOf(x, z, 1) && tries < 20); E.orbSpots.push({ x, z }); }   // denser near the base, where the action is
  for (const c of CR) for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + rng(); E.orbSpots.push({ x: c[0] + Math.sin(a) * c[2], z: c[1] + Math.cos(a) * c[2] }); }   // high on the crater rims
  E.flagSpots = [{ x: 0, z: 24 }, { x: 44, z: -30 }, { x: -46, z: -22 }, { x: 10, z: 100 }];
  E.captures = PADS.map(p => ({ x: p[0], z: p[1], r: 9 }));
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.26, r = i % 2 ? 36 : 92; E.gifts.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.bootSpots = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.PI / 8; E.bootSpots.push({ x: Math.sin(a) * 54, z: Math.cos(a) * 54 }); } for (const [x, z] of PADS) E.bootSpots.push({ x: x * 1.42, z: z * 1.42 }); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; E.bootSpots.push({ x: Math.sin(a) * 24, z: Math.cos(a) * 24 }); }
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; E.spawn.push({ x: Math.sin(a) * 38, z: Math.cos(a) * 38, yaw: a }); }
  return this.finish(E);
};

/* ---------------- the arena rules: floating, moon boots, low gravity ---------------- */
CART_ARENA_RULES.moon = {
  gravity: CART_G * 0.28,
  music: 'kart3',
  onLoad(s) {
    const E = s.E;
    s.moon = { boots: E.bootSpots.map(b => ({ x: b.x, z: b.z, y: s.terrain.height(b.x, b.z), alive: 1, t: 0, ph: s.rng() * 10 })), t: 0 };
    for (const k of s.karts) { k.moonFloat = true; k.moonH = 3 + s.rng() * 3; k.moonPh = s.rng() * 10; k.y = s.terrain.height(k.x, k.z) + k.moonH; k.air = true; k.airT = 0; k.jetT = 0; }
  },
  // before the engine step: floating cars only get a gentle push, and boots get picked up
  onStep(s, k, dt, racing) {
    const M = s.moon; if (!M) return;
    if (k.jetT > 0) { k.inp.gas = 1; k.inp.brake = 0; k.inp.driftPress = false; }
    else if (k.moonFloat) { k.inp.gas *= 0.55; k.inp.driftPress = false; k.inp.drift = false; k.drift = 0; k.charge = 0; }
    if (!k.moonFloat || !racing || k.out) return;
    for (const b of M.boots) {
      if (!b.alive) continue;
      const dx = k.x - b.x, dz = k.z - b.z, d2 = dx * dx + dz * dz;
      if (d2 < 12 * 12 && d2 > 1) {
        // moon boots are magnetic: the sideways (orbiting) part of a floater's drift dies off and it gets reeled straight in
        const d = Math.sqrt(d2), nx = -dx / d, nz = -dz / d, tx = -nz, tz = nx;
        let vr = k.vx * nx + k.vz * nz, vt = (k.vx * tx + k.vz * tz) * Math.exp(-2.5 * dt);
        if (vr < 0) vr *= Math.exp(-1.5 * dt);
        vr += 16 * (1 - d / 12) * dt;
        k.vx = nx * vr + tx * vt; k.vz = nz * vr + tz * vt;
      }
      if (d2 > 4 * 4) continue;
      b.alive = 0; b.t = 6; if (b.temp) b.gone = true;
      k.moonFloat = false; k.air = true; k.vy = -9; k.airT = 0; k.hop = true; k.bootsT = 0;
      s.log('boots', { k: k.id, player: k.player });
      s.fx.burst(b.x, b.y + 1, b.z, 'star', 14, CART_MOON_BOOT_COL);
      if (k.player) { s.banner('MOON BOOTS!', CART_MOON_BOOT_COL, 1.3, 'you can drive now'); Sound.play('pick', { vol: 0.8 }); Sound.play('stomp', { vol: 0.5, pitch: 0.6 }); }
      else { Sound.play('pick', { vol: 0.25, pitch: 1.2 }); }
      break;
    }
  },
  // vertical motion: jet packs hover, floating cars bob and drift; booted cars fall through to the engine
  vertical(s, k, dt, racing) {
    const gh = s.terrain.height(k.x, k.z);
    if (k.jetT > 0) {
      k.y = BurnsM.damp(k.y, gh + 8, 2.6, dt); k.air = true; k.airT += dt; k.vy = 0; k.hop = false;
      return true;
    }
    if (!k.moonFloat) { if (k.vy > 9.5 && k.flipT <= 0) k.vy = 9.5; return false; }   // booted: rims launch you, but not into orbit
    const target = gh + k.moonH + Math.sin(s.t * 1.3 + k.moonPh) * 0.45;
    k.y = BurnsM.damp(k.y, target, 2.2, dt); k.vy = 0; k.air = true; k.airT = 0; k.hop = false;
    // some lateral grip (swimming, not skating), a gentle drag and a speed cap
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), fwd = k.vx * fx + k.vz * fz, lat = (k.vx * -fz + k.vz * fx) * Math.exp(-2.5 * dt);
    k.vx = fx * fwd + fz * lat; k.vz = fz * fwd - fx * lat;
    const sp = Math.hypot(k.vx, k.vz), cap = 13;
    const damp = Math.exp(-0.9 * dt) * (sp > cap ? cap / sp : 1);
    k.vx *= damp; k.vz *= damp;
    k.speed = Math.hypot(k.vx, k.vz);
    return true;
  },
  // a hard hit has a coin-flip chance of knocking the boots clean off
  onHit(s, k, kind, src, o) {
    if (!s.moon || k.moonFloat || (kind !== 'flip' && kind !== 'knock') || s.rng() >= 0.5) return;
    k.moonFloat = true; k.moonH = 3 + s.rng() * 3; k.bootsT = 0;
    // the boots tumble off ahead of where the car is drifting, so a knock-off is a short float, not a long one
    const bx = k.x + k.vx * 0.7 + (s.rng() - 0.5) * 5, bz = k.z + k.vz * 0.7 + (s.rng() - 0.5) * 5;
    s.moon.boots.push({ x: bx, z: bz, y: s.terrain.height(bx, bz), alive: 1, t: 0, ph: s.rng() * 10, temp: true });
    s.fx.burst(k.x, k.y + 1, k.z, 'ring', 10, CART_MOON_BOOT_COL);
    s.log('bootsoff', { k: k.id, player: k.player });
    if (k.player) { s.banner('BOOTS KNOCKED OFF!', '#ff9ad8', 1.3, 'you are floating again'); Sound.play('powerdown', { vol: 0.5, pitch: 1.3 }); }
  },
  onUpdate(s, dt, racing) {
    const M = s.moon; if (!M) return;
    M.t += dt;
    for (const b of M.boots) { if (!b.alive && !b.gone) { b.t -= dt; if (b.t <= 0) b.alive = 1; } }
    if (M.boots.length > 24) M.boots = M.boots.filter(b => !b.gone);
    for (const k of s.karts) {
      if (!k.moonFloat) { k.bootsT = (k.bootsT || 0) + dt; k.floatT = 0; continue; }
      // nobody floats forever: after 18 s adrift, mission control airdrops a pair right in front of you
      k.floatT = (k.floatT || 0) + dt;
      if (racing && k.floatT > 18 && !k.out) {
        k.floatT = 0;
        const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), bx = clamp(k.x + fx * 7, -120, 120), bz = clamp(k.z + fz * 7, -120, 120);
        M.boots.push({ x: bx, z: bz, y: s.terrain.height(bx, bz), alive: 1, t: 0, ph: s.rng() * 10, temp: true });
        s.fx.burst(bx, s.terrain.height(bx, bz) + 3, bz, 'star', 12, CART_MOON_BOOT_COL);
        if (k.player) { s.banner('BOOTS AIRDROP!', CART_MOON_BOOT_COL, 1.2, 'mission control sends a pair', true); Sound.play('throw', { vol: 0.5 }); }
      }
    }
  },
  // AI: floating cars drift to the nearest boots; booted cars play the objective (craters have their own plan)
  aiGoal(s, k, nearestRival) {
    const M = s.moon; if (!M) return null;
    if (k.moonFloat) {
      let best = null, bd = 1e9;
      for (const b of M.boots) { if (!b.alive) continue; const d = Math.hypot(b.x - k.x, b.z - k.z) + (s.rng() - 0.5) * 8; if (d < bd) { bd = d; best = b; } }
      return { goal: best ? [best.x, best.z] : [Math.sin(k.slot + s.t * 0.3) * 40, Math.cos(k.slot + s.t * 0.3) * 40] };
    }
    if (s.objective === 'crater' && s.craters) {
      let best = null, bd = 1e9;
      for (const c of s.craters) { if (c.owner === k) continue; let d = Math.hypot(c.x - k.x, c.z - k.z); if (c.claimer && c.claimer !== k) d += 25; d += (s.rng() - 0.5) * 12; if (d < bd) { bd = d; best = c; } }
      if (!best) return { prey: nearestRival() };
      const a = s.t * 0.5 + k.slot;
      return { goal: [best.x + Math.sin(a) * best.r * 0.3, best.z + Math.cos(a) * best.r * 0.3] };
    }
    return null;
  },
  hud(s, ctx, W, H, top, left) {
    const k = s.player, M = s.moon; if (!k || !M) return;
    const t = s.time, portrait = H > W, y0 = top + (portrait ? 54 : 62);
    if (k.moonFloat && !k.out) {
      BurnsUI.text(ctx, 'FLOATING · FIND MOON BOOTS', W / 2, y0, 13, `rgba(90,242,255,${0.7 + 0.3 * Math.sin(t * 5)})`, { glow: '#1a8aa0' });
      // an arrow to the nearest pair
      let best = null, bd = 1e9; for (const b of M.boots) { if (!b.alive) continue; const d = Math.hypot(b.x - k.x, b.z - k.z); if (d < bd) { bd = d; best = b; } }
      if (best && s.state === 'race') { const p = {}; if (s.R.project(best.x, best.y + 2.5, best.z, W, H, p)) { const x = clamp(p.x, 30, W - 30), y = clamp(p.y, 80, H - 120); ctx.save(); ctx.translate(x, y); ctx.fillStyle = CART_MOON_BOOT_COL; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-9, -6); ctx.lineTo(9, -6); ctx.closePath(); ctx.fill(); cartMoonBootIcon(ctx, 0, -18, 9, 1); ctx.restore(); } }
    } else if (!k.out) {
      // a little boots badge: on the ground
      const bx = left + 14, by = top + (portrait ? 58 + 5 * 17 + 14 : 5 * 17 + 22);
      ctx.save(); ctx.globalAlpha = k.bootsT < 1.5 ? 0.6 + 0.4 * Math.sin(t * 12) : 0.75; cartMoonBootIcon(ctx, bx, by, 8, 1); ctx.restore();
      BurnsUI.text(ctx, 'MOON BOOTS ON', bx + 14, by, 10, 'rgba(255,255,255,0.75)', { align: 'left', ui: true });
    }
    if (k.jetT > 0) BurnsUI.text(ctx, 'JET PACK  ' + k.jetT.toFixed(1) + 's', W / 2, y0 + 18, 12, '#ffb04a', { glow: '#ff6a00' });
    // CRATER CLAIM: who owns what, and the player's claim in progress
    if (s.objective === 'crater' && s.craters) {
      const cy = y0 + (k.moonFloat ? 20 : 2), n = s.craters.length, w = 22;
      s.craters.forEach((c, i) => { const x = W / 2 + (i - (n - 1) / 2) * w; ctx.save(); ctx.beginPath(); ctx.arc(x, cy, 7, 0, TAU); ctx.fillStyle = c.owner ? c.owner.car.col : 'rgba(255,255,255,0.15)'; ctx.fill(); ctx.strokeStyle = c.owner === k ? '#ffd84a' : 'rgba(255,255,255,0.6)'; ctx.lineWidth = c.owner === k ? 2 : 1; ctx.stroke(); if (c.claimer && c.claimT > 0) { ctx.strokeStyle = c.claimer.car.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, cy, 10, -Math.PI / 2, -Math.PI / 2 + TAU * c.claimT / 2.5); ctx.stroke(); } ctx.restore(); });
      const mine = s.craters.find(c => c.claimer === k && c.claimT > 0);
      if (mine && s.state === 'race') BurnsUI.text(ctx, 'CLAIMING ' + mine.name + '…', W / 2, cy + 20, 12, '#ffd84a', { glow: '#ffb020' });
      // where to go: the nearest crater that isn't yours
      if (s.state === 'race' && !k.moonFloat) { let best = null, bd = 1e9; for (const c of s.craters) { if (c.owner === k) continue; const d = Math.hypot(c.x - k.x, c.z - k.z); if (d < bd) { bd = d; best = c; } } if (best && bd > best.r) { const p = {}; if (s.R.project(best.x, s.terrain.height(best.x, best.z) + 4, best.z, W, H, p)) { const x = clamp(p.x, 30, W - 30), y = clamp(p.y, 80, H - 120); ctx.save(); ctx.translate(x, y); ctx.fillStyle = best.owner ? best.owner.car.col : '#ffd84a'; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-9, -6); ctx.lineTo(9, -6); ctx.closePath(); ctx.fill(); ctx.restore(); } } }
    }
  },
  draw(s, R, S, t) {
    const M = s.moon, cam = s.cam; if (!M) return;
    const G = CART_MOON_EARTH;
    // Earth's halo (the static glow list culls at 200 m, so it's drawn here)
    R.bbs.bb(G.x, G.y, G.z, G.r * 3.4, G.r * 3.4, S.glow, [0.45, 0.65, 1], 0.3, true);
    R.bbs.bb(G.x, G.y, G.z, G.r * 2.3, G.r * 2.3, S.glow, [0.7, 0.85, 1], 0.25, true);
    // moon boots: a glowing pair hovering over a soft ring
    const pf = s.player && s.player.moonFloat;
    for (const b of M.boots) {
      if (!b.alive) continue;
      const dx = b.x - cam.x, dz = b.z - cam.z; if (dx * dx + dz * dz > 170 * 170) continue;
      const y = b.y + 1.1 + Math.sin(t * 2.2 + b.ph) * 0.25;
      R.flat.flat(b.x, b.y + 0.08, b.z, 4.2, 4.2, t * 0.8 + b.ph, S.ring, CART_MOON_BOOT_RGB, 0.55 + 0.2 * Math.sin(t * 3 + b.ph), true);
      R.bbs.bb(b.x, y, b.z, 3.2, 3.2, S.glow, CART_MOON_BOOT_RGB, 0.7, true);
      R.bbs.bb(b.x - 0.35, y, b.z, 0.9, 1.1, S.square, [1, 1, 1], 0.9, false, 0.25);
      R.bbs.bb(b.x + 0.35, y + 0.05, b.z, 0.9, 1.1, S.square, [1, 1, 1], 0.9, false, -0.25);
      if (pf) R.bbs.streak(b.x, y + 6, b.z, 0, 1, 0, 12, 1.2, S.streak, CART_MOON_BOOT_RGB, 0.35);
    }
    // floating cars: a soft bubble glow and the boots-off sparkle; jet packs: the flame glow
    for (const k of s.karts) {
      if (!k._in || k.out) continue;
      if (k.moonFloat && k.jetT <= 0) { R.bbs.bb(k.x, k.y + 1.2, k.z, 6.5, 6.5, S.glow, [0.5, 0.8, 1], 0.18 + 0.06 * Math.sin(t * 3 + k.slot), true); if (Math.random() < 0.3) s.fx.glint(k.x + (Math.random() - 0.5) * 3, k.y + Math.random() * 2.5, k.z + (Math.random() - 0.5) * 3, '#bfe8ff'); }
      if (k.jetT > 0) R.bbs.bb(k.x, k.y - 0.4, k.z, 4.5, 4.5, S.glow, [1, 0.6, 0.2], 0.6, true);
    }
    // crater claims: a beacon pole, the owner's flag colour, and the claim ring
    if (s.objective === 'crater' && s.craters) for (const c of s.craters) {
      const gy = s.terrain.height(c.x, c.z) + 0.1, col = c.owner ? burnsRGBf(c.owner.car.col) : [0.8, 0.85, 1];
      R.flat.flat(c.x, gy, c.z, c.r * 2.1, c.r * 2.1, t * 0.3, S.ring, col, c.owner ? 0.6 : 0.3, true);
      R.bbs.streak(c.x, gy + 7, c.z, 0, 1, 0, 14, 0.5, S.streak, [0.9, 0.9, 1], 0.7);
      R.bbs.bb(c.x + 1.3, gy + 12.4, c.z, 2.6, 1.6, S.square, col, c.owner ? 0.95 : 0.4, false);
      R.bbs.bb(c.x, gy + 13.5, c.z, 3, 3, S.glow, col, c.owner ? 0.8 : 0.3, true);
      if (c.claimer && c.claimT > 0) { const u = c.claimT / 2.5, cc = burnsRGBf(c.claimer.car.col); R.flat.flat(c.x, gy + 0.05, c.z, c.r * 2.1 * u, c.r * 2.1 * u, -t * 0.8, S.ring, cc, 0.9, true); if (Math.random() < 0.6) s.fx.spark(c.x + (Math.random() - 0.5) * c.r, gy + 0.3, c.z + (Math.random() - 0.5) * c.r, 1, c.claimer.car.col, 3); }
    }
  },
  lights(s, add) {
    const M = s.moon; if (!M) return;
    for (const b of M.boots) if (b.alive) add(b.x, b.y + 1.2, b.z, 7, CART_MOON_BOOT_RGB, 0.7, 1);
    for (const k of s.karts) if (k.jetT > 0) add(k.x, k.y - 0.5, k.z, 9, [1, 0.6, 0.25], 1.2, 1.5);
    for (const sh of s.shots) {
      if (sh.fx === 'moonlaser') { const a = Math.min(1, (sh.life - sh.t) * 3); add(sh.x, sh.y, sh.z, 14, [0.55, 0.95, 1], 1.6 * a, 2); add(sh.x + Math.sin(sh.yaw) * sh.len, sh.y + 0.5, sh.z + Math.cos(sh.yaw) * sh.len, 8, [0.7, 0.95, 1], a, 1.5); }
      else if (sh.fx === 'gravwell') add(sh.x, sh.y + 1.5, sh.z, sh.popped ? 16 : 12, [0.78, 0.42, 1], sh.popped ? 1.8 : 1.1, 2);
    }
  }
};

/* ---------------- the powers (arena-only until Luna Playa is mastered) ---------------- */
CART_ITEMS.moonlaser = { name: 'MOON LASER', desc: 'A hitscan beam straight ahead. The first car in its path spins out.', col: '#8af4ff', arena: 'moon' };
CART_ITEMS.jetpack = { name: 'JET PACK', desc: '2.5 seconds of thrust: up to the sky and full speed ahead. Works floating or booted.', col: '#ffb04a', arena: 'moon' };
CART_ITEMS.gravwell = { name: 'GRAVITY WELL', desc: 'Drops a well behind you that drags everyone close toward it, then pops.', col: '#c86aff', arena: 'moon' };

CART_ITEM_FX.moonlaser = {
  use(s, k) {
    const mz = s.muzzle(k, [0, 0, 0]), fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    // hitscan: the first car in a narrow cone up to 60 m
    let best = null, bd = 60;
    for (const o of s.karts) { if (o === k || o.out) continue; const dx = o.x - k.x, dz = o.z - k.z, along = dx * fx + dz * fz, side = Math.abs(dx * fz - dz * fx); if (along > 1 && along < bd && side < 1.6 + along * 0.05 && Math.abs(o.y - k.y) < 7) { bd = along; best = o; } }
    s.shots.push({ fx: 'moonlaser', type: 'moonlaser', owner: k, x: mz[0], y: mz[1], z: mz[2], yaw: k.yaw, len: best ? bd : 60, t: 0, life: 0.4, target: best });
    if (best) { s.hit(best, 'spin', k, { item: 'moonlaser', dur: 1.1 }); s.fx.burst(best.x, best.y + 1.2, best.z, 'star', 12, '#8af4ff'); }
    s.fx.burst(mz[0], mz[1], mz[2], 'spark', 6, '#ffffff');
    k.anim = 'cartFire'; k.animT = 0;
    Sound.play('laser', { vol: k.player ? 0.9 : 0.35, pitch: 1.3 }); Sound.play('cartZap', { vol: k.player ? 0.4 : 0.15, pitch: 1.6 });
    if (k.player) s.shakeIt(0.3);
  },
  aiWants(s, k) {
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    for (const o of s.karts) { if (o === k || o.out || o.invT > 0.3) continue; const dx = o.x - k.x, dz = o.z - k.z, along = dx * fx + dz * fz, side = Math.abs(dx * fz - dz * fx); if (along > 3 && along < 55 && side < 2.2) return true; }
    return k.ai.itemT < -8;
  },
  shot(s, sh, dt) { /* the beam is instant; the shot only lingers for its glow */ },
  draw(s, R, sh, S, t) {
    const a = Math.min(1, (sh.life - sh.t) * 3), fx = Math.sin(sh.yaw), fz = Math.cos(sh.yaw), L = sh.len, col = [0.55, 0.95, 1];
    for (let i = 0; i < 4; i++) { const d0 = L * (i + 0.5) / 4; R.bbs.streak(sh.x + fx * d0, sh.y, sh.z + fz * d0, fx, 0, fz, L / 4 * 1.06, 0.9 * a + 0.2, S.streak, col, a); R.bbs.streak(sh.x + fx * d0, sh.y, sh.z + fz * d0, fx, 0, fz, L / 4 * 1.06, 0.3, S.streak, [1, 1, 1], a); }
    R.bbs.bb(sh.x, sh.y, sh.z, 3.5, 3.5, S.glow, col, a, true);
    R.bbs.bb(sh.x + fx * L, sh.y, sh.z + fz * L, 4, 4, S.glow, [1, 1, 1], a * 0.8, true);
    if (Math.random() < 0.8) { const d = Math.random() * L; s.fx.glint(sh.x + fx * d, sh.y, sh.z + fz * d, '#bff8ff'); }
  },
  icon(ctx, s, col) { ctx.strokeStyle = col; ctx.lineWidth = s * 0.14; ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.3); ctx.lineTo(s * 0.5, -s * 0.3); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.3, s * 0.16, 0, TAU); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(-s * 0.5, s * 0.3, s * 0.22, 0, TAU); ctx.fill(); }
};

CART_ITEM_FX.jetpack = {
  use(s, k) {
    k.jetT = 2.5; k.jetFl = 0;
    s.boost(k, 2.5, 'jet');
    if (!s.moon) { k.vy = Math.max(k.vy, 7.5); k.air = true; k.hop = true; k.airT = 0; }   // in a circuit race: a long boost with a hop
    Sound.play('kartBoost', { vol: k.player ? 0.9 : 0.35, pitch: 0.7 }); Sound.play('flame', { vol: k.player ? 0.6 : 0.2, pitch: 1.2 });
    if (k.player) s.banner('JET PACK!', '#ffb04a', 1.0, s.moon ? 'hold on' : null, true);
  },
  aiWants(s, k) { return k.moonFloat ? true : k.ai.itemT < -2 || (s.isRace && k.rank > 2) || !s.isRace; },
  update(s, dt, racing) {
    if (!s.karts) return;
    for (const k of s.karts) {
      if (!(k.jetT > 0)) continue;
      k.jetT = Math.max(0, k.jetT - dt);
      if (k.jetT === 0) { k.boostT = Math.max(k.boostT, 0.3); continue; }
      if (!s.fx) continue;
      const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), rx = -fz, rz = fx, back = k.M ? k.M.len * 0.3 : 1.5;
      for (const sd of [-1, 1]) {
        if (Math.random() < 0.6) s.fx.add(k.x - fx * back + rx * sd * 0.8, k.y + 0.3, k.z - fz * back + rz * sd * 0.8, (Math.random() - 0.5) * 2 - fx * 2, -7 - Math.random() * 4, (Math.random() - 0.5) * 2 - fz * 2, 0.35 + Math.random() * 0.2, 0.9, 0.3, [1, 0.55 + Math.random() * 0.3, 0.15], 1, 'flame', 1);
        if (Math.random() < 0.25) s.fx.add(k.x - fx * back + rx * sd * 0.8, k.y - 0.2, k.z - fz * back + rz * sd * 0.8, (Math.random() - 0.5) * 3, -3, (Math.random() - 0.5) * 3, 1.2, 0.6, 2.2, [0.5, 0.5, 0.56], 0.35, 'smoke', 4);
      }
      if (k.player && Math.random() < dt * 2) Sound.play('flame', { vol: 0.25, pitch: 1.4 });
    }
  },
  icon(ctx, s, col) { ctx.fillStyle = '#d8d8e0'; ctx.strokeStyle = '#1a1020'; for (const dx of [-0.22, 0.22]) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(dx * s - s * 0.16, -s * 0.45, s * 0.32, s * 0.7, s * 0.1) : ctx.rect(dx * s - s * 0.16, -s * 0.45, s * 0.32, s * 0.7); ctx.fill(); ctx.stroke(); } ctx.fillStyle = col; for (const dx of [-0.22, 0.22]) { ctx.beginPath(); ctx.moveTo(dx * s - s * 0.14, s * 0.26); ctx.lineTo(dx * s, s * 0.6); ctx.lineTo(dx * s + s * 0.14, s * 0.26); ctx.closePath(); ctx.fill(); } }
};

CART_ITEM_FX.gravwell = {
  use(s, k) {
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), x = k.x - fx * 6, z = k.z - fz * 6;
    s.shots.push({ fx: 'gravwell', type: 'gravwell', owner: k, x, z, y: s.terrain.height(x, z), t: 0, life: 4, popped: false, r: 18 });
    Sound.play('cartBass', { vol: k.player ? 0.6 : 0.25, pitch: 0.6 }); Sound.play('throw', { vol: k.player ? 0.5 : 0.2 });
  },
  aiWants(s, k) {
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    for (const o of s.karts) { if (o === k || o.out) continue; const dx = o.x - k.x, dz = o.z - k.z; if ((dx * fx + dz * fz) < 2 && Math.hypot(dx, dz) < 20) return true; }
    return k.ai.itemT < -6;
  },
  shot(s, sh, dt) {
    const k = sh.owner;
    if (sh.t < sh.life) {
      const pull = 24 * Math.min(1, sh.t * 2);
      for (const o of s.karts) {
        if (o === k || o.out) continue;
        const dx = sh.x - o.x, dz = sh.z - o.z, d = Math.hypot(dx, dz); if (d > sh.r || d < 0.5) continue;
        const f = pull * (1 - d / sh.r) * (o.moonFloat ? 1.5 : 1) * dt;
        o.vx += dx / d * f; o.vz += dz / d * f;
        if (o.player && !sh.warned) { sh.warned = true; s.banner('GRAVITY WELL!', '#c86aff', 0.9, 'it has you', true); }
      }
    } else if (!sh.popped) {
      sh.popped = true;
      for (const o of s.karts) { if (o.out) continue; const dx = o.x - sh.x, dz = o.z - sh.z, d = Math.hypot(dx, dz); if (d < 4.5) s.hit(o, 'knock', k, { dx: dx / (d || 1), dz: dz / (d || 1), power: 17, item: 'gravwell' }); }
      s.fx.burst(sh.x, sh.y + 1, sh.z, 'ring', 18, '#c86aff'); s.fx.burst(sh.x, sh.y + 1, sh.z, 'star', 10, '#ffffff');
      Sound.play('cartBoom', { vol: 0.5, pitch: 1.3 }); Sound.play('cartZap', { vol: 0.4, pitch: 0.6 });
      if (s.player && Math.hypot(s.player.x - sh.x, s.player.z - sh.z) < 30) s.shakeIt(0.5);
      sh.life = sh.t + 0.35;   // a last flash
    }
  },
  draw(s, R, sh, S, t) {
    const live = sh.t < 4, u = Math.min(1, sh.t * 2), col = [0.78, 0.42, 1];
    if (live) {
      R.flat.flat(sh.x, sh.y + 0.08, sh.z, sh.r * 2 * u, sh.r * 2 * u, -t * 1.2, S.ring, col, 0.45, true);
      R.flat.flat(sh.x, sh.y + 0.06, sh.z, sh.r * 1.2 * u, sh.r * 1.2 * u, t * 2.0, S.ring, [0.5, 0.2, 0.8], 0.6, true);
      R.flat.flat(sh.x, sh.y + 0.1, sh.z, 7 * u, 7 * u, 0, S.glow, [0.1, 0.02, 0.2], 0.9, false);
      R.bbs.bb(sh.x, sh.y + 1.4, sh.z, 3 + Math.sin(t * 9) * 0.6, 3 + Math.sin(t * 9) * 0.6, S.core, col, 0.9, true);
      R.bbs.bb(sh.x, sh.y + 1.4, sh.z, 7, 7, S.glow, col, 0.35, true);
      // dust spiralling in
      if (Math.random() < 0.9) { const a = Math.random() * TAU, d = 6 + Math.random() * sh.r * u; s.fx.add(sh.x + Math.sin(a) * d, sh.y + 0.3 + Math.random() * 2, sh.z + Math.cos(a) * d, -Math.sin(a) * 7 + Math.cos(a) * 4, 1.2, -Math.cos(a) * 7 - Math.sin(a) * 4, 0.9, 0.5, 0.15, [0.8, 0.6, 1], 0.8, 'streak', 1 | 2 | 16); }
    } else {
      const a = Math.max(0, 1 - (sh.t - 4) / 0.35);
      R.flat.flat(sh.x, sh.y + 0.1, sh.z, 12 * (1.5 - a), 12 * (1.5 - a), 0, S.ring, [1, 0.8, 1], a, true);
      R.bbs.bb(sh.x, sh.y + 1.4, sh.z, 12 * (1.4 - a), 12 * (1.4 - a), S.glow, col, a, true);
    }
  },
  icon(ctx, s, col) { ctx.strokeStyle = col; ctx.lineWidth = s * 0.1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 0, s * (0.5 - i * 0.16), i * 0.8, i * 0.8 + 4.6); ctx.stroke(); } ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(0, 0, s * 0.12, 0, TAU); ctx.fill(); }
};

/* ---------------- CRATER CLAIM: own the craters, they pay you ---------------- */
CART_OBJECTIVES.crater = {
  name: 'CRATER CLAIM', short: 'Own the craters', time: 150, goal: 30, unit: ' pts',
  desc: 'Park in a crater for 2.5 s to plant your flag. Each crater you own pays a point every 3 s, and rivals can steal it. First to 30 points.',
  fx: {
    init(s) {
      const Z = s.E.craters || s.E.zones;
      s.craters = Z.map((z, i) => ({ x: z.x, z: z.z, r: z.r, name: z.name || 'CRATER ' + (i + 1), owner: null, claimer: null, claimT: 0, payT: 0 }));
    },
    update(s, dt) {
      const K = s.karts;
      for (const c of s.craters) {
        // who's parked inside (booted cars only on the moon; floating over it doesn't count)
        let inside = null;
        const gh = s.terrain.height(c.x, c.z);
        for (const k of K) { if (k.out || k.moonFloat || k.jetT > 0 || k.y > gh + 3.5) continue; if (Math.hypot(k.x - c.x, k.z - c.z) < c.r && k !== c.owner && (!inside || k === c.claimer)) inside = k; }
        if (inside) {
          if (c.claimer !== inside) { c.claimer = inside; c.claimT = 0; }
          c.claimT += dt;
          if (c.claimT >= 2.5) {
            const prev = c.owner; c.owner = inside; c.claimer = null; c.claimT = 0; c.payT = 0;
            s.log('claim', { k: inside.id, crater: c.name, from: prev && prev.id, player: inside.player });
            s.fx.confetti(c.x, gh + 2, c.z, 24); s.fx.burst(c.x, gh + 1, c.z, 'ring', 12, inside.car.col);
            if (inside.player) { s.banner('CRATER CLAIMED!', '#7aff8a', 1.4, c.name); Sound.play('kartLap', { vol: 0.7 }); }
            else if (prev && prev.player) { s.banner('CRATER STOLEN!', '#ff6a6a', 1.4, inside.car.name + ' took ' + c.name); Sound.play('powerdown', { vol: 0.5 }); }
            else { s.banner(inside.car.name + ' CLAIMS ' + c.name, '#ff9a3a', 1.0, null, true); Sound.play('pick', { vol: 0.3 }); }
          }
        } else { c.claimer = null; c.claimT = Math.max(0, c.claimT - dt * 2); }
        if (c.owner && !c.owner.out) { c.payT += dt; if (c.payT >= 3) { c.payT -= 3; c.owner.score += 1; s.log('craterpay', { k: c.owner.id, n: c.owner.score }); if (c.owner.player) Sound.play('glowstick', { vol: 0.35, pitch: 1.4 }); } }
      }
      return K.some(k => k.score >= CART_OBJECTIVES.crater.goal);
    },
    rank(s) { const owned = k => s.craters ? s.craters.filter(c => c.owner === k).length : 0; return s.karts.slice().sort((a, b) => (b.score - a.score) || (owned(b) - owned(a)) || (b.hitsDealt - a.hitsDealt)); },
    score(k) { return Math.floor(k.score); }
  }
};

/* ---------------- the registry ---------------- */
CART_ARENAS.push({
  id: 'moon', name: 'LUNA PLAYA', sub: 'Moon base: float for boots, then fight in low gravity', objectives: ['vibe', 'glow', 'hill', 'flag', 'crater'],
  col: '#c8d8ff', tod: 'night', powers: ['moonlaser', 'jetpack', 'gravwell'],
  blurb: 'Everyone starts floating. Grab Moon Boots, jump the crater rims, laser the rivals, claim the craters.'
});
CART_ARENA_ICONS.moon = (ctx, s, t, col) => {
  // a crescent with craters, a tiny boot-print trail and a blinking star
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.fillStyle = rgba(col, 0.9); ctx.fill();
  ctx.fillStyle = '#12101c'; ctx.beginPath(); ctx.arc(s * 0.42, -s * 0.18, s * 0.72, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.clip();
  ctx.fillStyle = rgba('#000000', 0.25); for (const [x, y, r] of [[-0.42, 0.1, 0.16], [-0.2, 0.45, 0.11], [-0.5, -0.4, 0.1], [-0.15, -0.5, 0.07]]) { ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.stroke();
  const tw = 0.6 + 0.4 * Math.sin(t * 4); ctx.fillStyle = `rgba(255,255,255,${tw})`; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? s * 0.07 : s * 0.2; ctx.lineTo(s * 0.72 + Math.cos(a) * r, -s * 0.72 + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
  ctx.restore();
};
// a tiny pair of boots for the HUD
function cartMoonBootIcon(ctx, x, y, s, a) {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a; ctx.fillStyle = CART_MOON_BOOT_COL; ctx.strokeStyle = '#102030'; ctx.lineWidth = 1;
  for (const dx of [-0.55, 0.55]) { ctx.beginPath(); ctx.moveTo(dx * s - s * 0.3, -s * 0.9); ctx.lineTo(dx * s + s * 0.3, -s * 0.9); ctx.lineTo(dx * s + s * 0.3, s * 0.2); ctx.lineTo(dx * s + s * 0.8, s * 0.5); ctx.lineTo(dx * s + s * 0.8, s * 0.9); ctx.lineTo(dx * s - s * 0.3, s * 0.9); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
