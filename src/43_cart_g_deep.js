/* ============================================================
   ART CART — arena: DEEP BLUE PLAYA (id 'deep')
   The playa flooded. A sunken reef where the art cars swim: hold HOP to
   rise, BRAKE to dive, break the surface to breathe. Every car has 25 s of
   air; bubble columns from the vents top it up. Powers: the harpoon (hook
   and reel a rival in), the ink cloud (dazzle and hide) and the torpedo
   (homing flip). Objective of its own: PEARL DIVER (pearls from the giant
   clams up to the buoy ring at the surface).
   Registers itself in CART_ARENAS / CART_ARENA_RULES / CART_ITEMS /
   CART_ITEM_FX / CART_OBJECTIVES / CART_ARENA_ICONS (43_cart_a_data.js).
   All of it original: no real camp, brand or game is copied here.
   ============================================================ */
const CART_DEEP = { SURF: 14, BREATH: 25, DRAIN_Y: 12, REFILL_Y: 13.4, RISE: 6, DIVE: 5, SINK: 1.2, BUBBLE_AIR: 8, clamLid: -1.0 };

CART_ARENAS.push({
  id: 'deep', name: 'DEEP BLUE PLAYA', sub: 'Sunken reef: swim, breathe bubbles, harpoon your rivals',
  objectives: ['vibe', 'glow', 'flag', 'hill', 'pearl'], col: '#38c8ff', tod: 'night', powers: ['harpoon', 'ink', 'torpedo'],
  blurb: 'The playa flooded and nobody left. Hold HOP to swim up, BRAKE to dive, surface or catch bubbles to breathe.'
});

/* ---------------- the world ---------------- */
CartWorlds.arena_deep = function (A, night) {
  const E = this.base(2005, [-150, -150, 150, 150], '#6a8a9a', 0.02);
  const sky = Object.assign({}, BURNS_PALETTES.night, {
    fog: '#082e54', fogD: 0.018, fogH: 0.01, fogMax: 0.96, haze: 0.65, zen: '#04182c', hor: '#0a3a62', sky: '#2e6a98', gnd: '#163444',
    key: '#9ae0ff', keyK: 0.55, stars: 0, clouds: 0, emB: 1.6, moon: [40, 62], moonK: 0, cityK: 0, milkyway: 0, mtnH: 0, mid: '#082e54', midK: 0.5,
    sun: [205, -20], dust: 0.25, rays: 0, rim: '#7ad8ff', exposure: 0.92, grade: [1.05, 0.1, 0.42]
  });
  Object.assign(E, { id: 'deep', arena: A, sky, tod: A.tod, music: 'kart3', night: true, R: 135, vents: [], clams: [], buoys: [], anemones: [] });
  const api = E.api, T = E.terrain, rng = mulberry32(55);
  // ---- the seabed: sand ripples, sea-grass patches, pale sand pools ----
  api.paint((ctx, P, S) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 110; i++) {
      const z0 = -148 + i * 2.7; ctx.strokeStyle = i % 2 ? 'rgba(130,160,170,0.2)' : 'rgba(40,70,95,0.2)'; ctx.lineWidth = (0.45 + rng() * 0.5) * S;
      ctx.beginPath();
      for (let x = -148; x <= 148; x += 4) { const z = z0 + Math.sin(x * 0.11 + i * 0.7) * 1.1 + Math.sin(x * 0.031 + i) * 0.8; const q = P(x, z); if (x === -148) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); }
      ctx.stroke();
    }
    for (let i = 0; i < 90; i++) { const x = (rng() - 0.5) * 280, z = (rng() - 0.5) * 280, q = P(x, z); ctx.fillStyle = rng() < 0.5 ? 'rgba(30,80,70,0.22)' : 'rgba(200,220,210,0.12)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], (3 + rng() * 9) * S, (2 + rng() * 5) * S, rng() * 3, 0, TAU); ctx.fill(); }
  });
  // ---- terrain: the reef, coral mounds, low dunes ----
  const coral = ['#ff7a9a', '#ff9a5a', '#c86aff', '#ffd06a', '#5affc8', '#ff6ab0'];
  T.add(CartFeat.mound(0, 0, 24, 4.2, { col: '#d88aa0', res: 1.0 }));
  [[-48, -80, 13, 3.2], [62, -58, 11, 2.6], [58, 66, 14, 3.4], [-66, 60, 12, 2.8], [0, -92, 10, 2.2], [96, 8, 9, 2.0], [-98, -4, 10, 2.4], [6, 96, 9, 2.2], [-30, -110, 8, 1.8], [100, -80, 9, 2.0]]
    .forEach(([x, z, r, h], i) => T.add(CartFeat.mound(x, z, r, h, { col: coral[i % coral.length], res: 1.0 })));
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.5, r = 88 + rng() * 25; T.add(CartFeat.mound(Math.sin(a) * r, Math.cos(a) * r, 16 + rng() * 8, 1.2 + rng() * 1.0, { col: '#8aa6b2', res: 1.4 })); }
  // ---- helpers ----
  const rock = '#4a5a6a', bone = '#e8e2d2', wood = '#6a4a36';
  const glowAt = (x, y, z, s, c) => api.glow(x, y, z, s, c);
  // a rock arch you can drive through (a lumpy half-torus)
  const arch = (x, z, yaw, R) => {
    CartScene.mesh(api, x, z, yaw, m => {
      m.color(rock).shine(0);
      m.surf(16, 7, (u, v, out) => { const a = Math.PI * u, r = R + Math.cos(v * TAU) * 1.5 * (1 + 0.18 * Math.sin(u * 11 + v * 5)); out[0] = Math.cos(a) * r; out[1] = Math.sin(a) * r * 1.05 + 0.4; out[2] = Math.sin(v * TAU) * 1.5; }, { wrapV: true, out: [0, 3, 0] });
      m.color('#ff8aa0', 0.5); for (let i = 0; i < 5; i++) { const a = 0.3 + i * 0.6; m.ball(Math.cos(a) * (R + 1.4), Math.sin(a) * (R + 1.4) * 1.05 + 0.4, (i % 2 ? 1 : -1) * 0.8, 0.35, { seg: 6, rings: 4 }); } m.emissive(0);
      return { cols: [{ t: 'cyl', x: R, z: 0, r: 1.8, y0: 0, y1: 3 }, { t: 'cyl', x: -R, z: 0, r: 1.8, y0: 0, y1: 3 }] };
    }, { hi: true, noAO: true });
    for (let i = 0; i < 5; i++) { const a = 0.3 + i * 0.6, lx = Math.cos(a) * (R + 1.4), ly = Math.sin(a) * (R + 1.4) * 1.05 + 0.4; glowAt(x + lx * Math.cos(yaw), ly, z - lx * Math.sin(yaw), 0.9, '#ff8aa0'); }
  };
  // a kelp stalk: swaying limb segments with a few flat leaves (low detail, no colliders)
  const kelp = (x, z, h, seed) => {
    const r2 = mulberry32(seed), sway = (r2() - 0.5) * 1.4, col = r2.pick(['#2a8a5a', '#3aa070', '#1f7a4a', '#4ab078']);
    CartScene.mesh(api, x, z, r2() * TAU, m => {
      m.color(col).shine(1);
      const n = 2, pts = []; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([Math.sin(t * 2.2) * sway * t * 2.4, t * h, Math.cos(t * 1.7) * sway * t * 1.2]); }
      for (let i = 0; i < n; i++) m.limb(pts[i][0], pts[i][1], pts[i][2], pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], 0.16 - i * 0.04, 0.12 - i * 0.04, { seg: 5 });
      for (let i = 0; i < 2; i++) { const t = 0.45 + i * 0.4, p = [Math.sin(t * 2.2) * sway * t * 2.4, t * h, Math.cos(t * 1.7) * sway * t * 1.2]; m.push(); m.tf(p[0], p[1], p[2], i * 2.1, 0.5, 0.3); m.ellipsoid(0.9, 0, 0, 1.2, 0.06, 0.35, { seg: 6, rings: 4 }); m.pop(); }
      m.shine(0);
    }, { noAO: true });
  };
  const forest = (cx, cz, r, n, seed) => { const r3 = mulberry32(seed); for (let i = 0; i < n; i++) { const a = r3() * TAU, d = Math.sqrt(r3()) * r; kelp(cx + Math.sin(a) * d, cz + Math.cos(a) * d, 6 + r3() * 5, seed * 7 + i); } };
  // glowing anemone: a soft bulb with tentacles that light the sand
  const anemone = (x, z, c) => {
    CartScene.mesh(api, x, z, rng() * TAU, m => {
      m.color(c, 0.35).shine(1); m.lathe([[0, 0], [1.0, 0], [1.15, 0.5], [0.8, 1.0], [0, 1.1]], { seg: 10 });
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, l = 1.2 + (i % 3) * 0.3; m.limb(Math.sin(a) * 0.7, 0.9, Math.cos(a) * 0.7, Math.sin(a) * (0.7 + l * 0.6), 0.9 + l, Math.cos(a) * (0.7 + l * 0.6), 0.1, 0.06, { seg: 4 }); m.color('#ffffff', 1); m.ball(Math.sin(a) * (0.7 + l * 0.6), 0.9 + l, Math.cos(a) * (0.7 + l * 0.6), 0.1, { seg: 4, rings: 3 }); m.color(c, 0.35); }
      m.emissive(0).shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.0, y0: 0, y1: 1.2 }] };
    }, { noAO: true });
    glowAt(x, 1.8, z, 2.2, c); api.light(x, z, 9, c, 0.55); E.anemones.push({ x, z, c }); E.art.push({ x, z, r: 1.3 });
  };
  // a bubble vent: a dark crater (the bubble column is drawn and simulated by the arena rules)
  const vent = (x, z) => { CartScene.mesh(api, x, z, 0, m => { m.color('#262a34').shine(0); m.lathe([[0, 0], [2.0, 0], [1.4, 0.55], [0.7, 0.5], [0, 0.25]], { seg: 10 }); }, { noAO: true }); glowAt(x, 0.5, z, 1.6, '#7ad8ff'); api.light(x, z, 6, '#5ac8ff', 0.3); E.vents.push({ x, z }); };
  // a giant clam, open (the pearl inside is drawn by the objective)
  const clam = (x, z, yaw) => {
    CartScene.mesh(api, x, z, yaw, m => {
      const scallop = { seg: 14, sx: 1.15, rMod: th => 1 + 0.05 * Math.sin(th * 12) };
      // the lower shell: a bowl (outer skin + inner skin), a scalloped rim
      m.color('#d8c0d8').shine(2); m.lathe([[0, 0], [1.1, 0.05], [1.45, 0.3], [1.55, 0.55]], scallop);
      m.color('#f0e0f4'); m.lathe([[0, 0.14], [1.0, 0.18], [1.38, 0.38], [1.55, 0.56]], Object.assign({ flip: true }, scallop));
      m.color('#c8a8c8'); m.torus(0, 0.55, 0, 1.5, 0.1, { seg: 14, tseg: 5, sy: 1 });
      // the upper shell: a dome hinged at the back, held open
      m.push(); m.tf(0, 0.6, -1.5, 0, CART_DEEP.clamLid, 0); m.tf(0, 0, 1.5); m.color('#e0c8e8'); m.lathe([[1.55, 0], [1.4, 0.25], [0.9, 0.5], [0, 0.6]], scallop); m.color('#f8e8ff'); m.lathe([[1.5, 0.02], [1.3, 0.2], [0.8, 0.4], [0, 0.48]], Object.assign({ flip: true }, scallop)); m.pop();
      m.color('#ff8ac8', 0.4); m.torus(0, 0.3, 0, 0.7, 0.1, { seg: 10, tseg: 4 }); m.emissive(0).shine(0);
    }, { hi: true, noAO: true });
    E.clams.push({ x, z, y: T.height(x, z) });
  };
  // ---- the landmarks ----
  arch(-30, 25, 0.6, 7.5); arch(38, -28, -0.5, 8); arch(2, -70, 1.4, 7);
  forest(-62, 55, 17, 42, 11); forest(-95, -22, 13, 30, 12); forest(22, 92, 14, 34, 13); forest(96, -42, 12, 28, 14); forest(-20, -120, 10, 20, 15);
  // the shipwreck: a split wooden hull on its keel, mast leaning, deck gone
  CartScene.mesh(api, 60, 20, 0.8, m => {
    const L = 24, D = 3.4, hw = u => 3.6 * Math.pow(Math.sin(Math.PI * u), 0.6), dp = u => 3.2 * Math.pow(Math.sin(Math.PI * u), 0.5) + 0.01;
    const hull = (u, v, out) => { const th = (v - 0.5) * Math.PI, w = hw(u), d = dp(u); out[0] = Math.sin(th) * w; out[1] = D - Math.cos(th) * d; out[2] = (u - 0.5) * L; };
    const cf = (u, v) => { const k = 0.7 + 0.3 * Math.abs(v - 0.5) * 2 + ((Math.floor(u * 18) % 2) ? 0.06 : 0); return [Math.round(106 * k), Math.round(74 * k), Math.round(54 * k)]; };
    m.color(wood).shine(0); m.surf(18, 8, hull, { out: [0, 3, 0], colFn: cf }); m.surf(18, 8, hull, { out: [0, 3, 0], flip: true, colFn: cf });
    m.color('#8a6a4a'); for (const s of [1, -1]) m.limb(s * 0.2, D + 0.1, -L / 2 + 1, s * 3.6, D + 0.1, 0, 0.12, 0.14, { seg: 5 }), m.limb(s * 3.6, D + 0.1, 0, s * 0.3, D + 0.1, L / 2 - 1, 0.14, 0.12, { seg: 5 });
    for (let i = 0; i < 5; i++) m.roundBox(0, D - 0.3, -L / 2 + 3 + i * 1.1, 6.4 - i * 0.6, 0.18, 0.8, 0.05);
    m.color('#5a3e2a'); m.limb(0.5, 1.5, -2, 3.2, 15, -3.5, 0.32, 0.18, { seg: 7 }); m.limb(0.9, 10.2, -2.8, 3.2, 10.9, 0.6, 0.12, 0.12, { seg: 5 }); m.limb(0.9, 10.2, -2.8, -1.2, 9.6, -6.0, 0.12, 0.12, { seg: 5 });
    m.color('#2a2a30').shine(2); m.torus(2.6, 12.4, -3.1, 0.8, 0.1, { seg: 8, tseg: 4 }); m.shine(0);
    m.color('#ffd84a', 0.9); m.ball(3.3, 15.3, -3.6, 0.3, { seg: 6, rings: 4 }); m.emissive(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 3.6, hz: 11.5, y0: 0, y1: D }] };
  }, { hi: true });
  glowAt(60 + Math.cos(0.8) * 3.3 - Math.sin(0.8) * -3.6, 15.3, 20 - Math.sin(0.8) * 3.3 - Math.cos(0.8) * 3.6, 2.5, '#ffd84a'); api.light(60, 20, 18, '#ffd090', 0.35);
  E.art.push({ x: 60, z: 20, r: 7 });
  api.sign('LEAVE NO TRACE\n(EXCEPT THIS)', 48, 30, { yaw: 2.2, h: 0.9, y: 1.6, post: true, maxW: 3.2, style: { bg: '#1a2a3a', fg: '#9af0ff', border: '#ffffff' }, glow: '#5ac8ff' });
  // the open treasure chest: brass bands, gold inside, a light pool
  CartScene.mesh(api, 72, 8, -0.6, m => {
    m.color('#6a3a22').shine(1); m.roundBox(0, 0.65, 0, 2.6, 1.3, 1.7, 0.12);
    m.color('#d8a84a').shine(2); for (const dx of [-0.9, 0.9]) m.roundBox(dx, 0.65, 0, 0.2, 1.36, 1.76, 0.04);
    m.push(); m.tf(0, 1.3, -0.85, 0, -1.15, 0); m.color('#7a4a2a').shine(1); m.roundBox(0, 0.3, 0.85, 2.6, 0.6, 1.7, 0.18); m.color('#d8a84a').shine(2); for (const dx of [-0.9, 0.9]) m.roundBox(dx, 0.3, 0.85, 0.2, 0.66, 1.76, 0.04); m.pop();
    m.color('#ffd04a', 0.7).shine(2); for (let i = 0; i < 9; i++) { const a = i * 1.9; m.ball(Math.sin(a) * 0.7, 1.35 + (i % 3) * 0.18, Math.cos(a) * 0.45, 0.28, { seg: 7, rings: 5 }); }
    m.color('#ff8ac8', 0.6); m.ball(-0.4, 1.7, 0.1, 0.22, { seg: 6, rings: 4 }); m.color('#5affc8', 0.6); m.ball(0.5, 1.75, -0.2, 0.2, { seg: 6, rings: 4 }); m.emissive(0).shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.3, hz: 0.9, y0: 0, y1: 1.4 }] };
  }, { hi: true });
  glowAt(72, 2.0, 8, 3.2, '#ffd04a'); api.light(72, 8, 14, '#ffc040', 0.7); E.art.push({ x: 72, z: 8, r: 2.4 });
  for (let i = 0; i < 12; i++) { const a = rng() * TAU, d = 2 + rng() * 5, x = 72 + Math.sin(a) * d, z = 8 + Math.cos(a) * d; CartScene.mesh(api, x, z, rng() * 3, m => { m.color('#ffd04a', 0.5).shine(2); m.roundCyl(0, 0, 0, 0.3, 0.06, 0.02, { seg: 8 }); m.emissive(0).shine(0); }, { noAO: true }); }
  // the sunken art car: the engine's mutant vehicle on its side in the sand, lights still on
  CartScene.mesh(api, -20, -45, 2.3, m => {
    m.push(); m.tf(0, -0.25, 0, 0, 0.1, 0.42); const r = BurnsProps.artcar.call(BurnsProps, m, { len: 9, w: 4, col: '#6a4a5a', sculpt: '#5affc8' }); m.pop();
    m.color('#8aa0a0').shine(0); for (let i = 0; i < 14; i++) { const a = i * 2.4; m.ball(Math.sin(a) * 2.2, 0.4 + (i % 4) * 0.5, Math.cos(a) * 4, 0.22, { seg: 5, rings: 3 }); }
    return { cols: r.cols };
  }, { hi: true });
  glowAt(-20, 3.6, -45, 3, '#5affc8'); api.light(-20, -45, 14, '#5affc8', 0.45); E.art.push({ x: -20, z: -45, r: 5 });
  api.sign('HONK IF\nYOU\'RE WET', -12, -52, { yaw: 2.8, h: 0.9, y: 1.6, post: true, maxW: 3.0, style: { bg: '#ffe24a', fg: '#1a1a1a', border: '#1a1a1a' }, glow: '#ffe24a' });
  // the whale skeleton: a curved spine, rib arches, a long skull
  CartScene.mesh(api, -70, -50, 1.1, m => {
    m.color(bone).shine(1);
    const sp = u => [Math.sin(u * 2.5) * 2.2, 3.6 + Math.sin(u * Math.PI) * 1.2, (u - 0.5) * 30];
    for (let i = 0; i <= 16; i++) { const p = sp(i / 16); m.ball(p[0], p[1], p[2], 0.55 - Math.abs(i / 16 - 0.4) * 0.5, { seg: 7, rings: 5 }); if (i < 16) { const q = sp((i + 1) / 16); m.limb(p[0], p[1], p[2], q[0], q[1], q[2], 0.22, 0.22, { seg: 5 }); } }
    for (let i = 1; i < 9; i++) { const u = 0.2 + i * 0.075, p = sp(u), R = 3.4 - Math.abs(i - 4.5) * 0.35; m.push(); m.tf(p[0], p[1], p[2]); m.surf(10, 5, (uu, v, out) => { const a = -0.2 + uu * (Math.PI + 0.4), r = R + Math.cos(v * TAU) * 0.22; out[0] = Math.cos(a) * r; out[1] = Math.sin(a) * r - R + 0.3; out[2] = Math.sin(v * TAU) * 0.22; }, { wrapV: true, out: [0, -R + 0.3, 0] }); m.pop(); }
    const h = sp(1); m.ellipsoid(h[0] + 0.3, 2.4, h[2] + 4.5, 2.4, 1.9, 5.2, { seg: 12, rings: 8 }); m.ellipsoid(h[0] + 0.3, 1.0, h[2] + 5.2, 1.9, 0.5, 4.4, { seg: 10, rings: 6 });
    m.color('#1a2630'); m.ball(h[0] + 2.0, 3.0, h[2] + 2.6, 0.5, { seg: 6, rings: 4 }); m.ball(h[0] - 1.4, 3.0, h[2] + 2.6, 0.5, { seg: 6, rings: 4 });
    m.shine(0);
    return { cols: [{ t: 'cyl', x: h[0] + 0.3, z: h[2] + 4.5, r: 2.6, y0: 0, y1: 4 }] };
  }, { hi: true });
  E.art.push({ x: -70 + Math.sin(1.1) * 19.5, z: -50 + Math.cos(1.1) * 19.5, r: 3 });
  // anemones, vents, clams, more signs, the shark net, a sunken grandstand
  [[-32, -12, '#ff6ab0'], [28, 14, '#5affc8'], [-8, 40, '#c86aff'], [14, -40, '#ffd06a'], [-54, 20, '#ff8a5a'], [82, 44, '#5af2ff'], [-88, 32, '#ff6ab0'], [44, 70, '#ffd06a'], [-44, -84, '#c86aff'], [84, -16, '#ff8a5a'], [-110, -60, '#5affc8'], [30, -104, '#ff6ab0'], [-6, 118, '#5af2ff'], [116, 30, '#c86aff']].forEach(([x, z, c]) => anemone(x, z, c));
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.35, r = i % 2 ? 36 : 74; vent(Math.sin(a) * r, Math.cos(a) * r); }
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 1.1, r = 42 + (i % 3) * 18; const x = Math.sin(a) * r, z = Math.cos(a) * r; clam(x, z, a + Math.PI); }
  const signs = ['SHARK NET\n(TOTALLY SAFE)', 'DRY PLAYA\n↑ THAT WAY', 'NO MOOP\nNO FISHING', 'HYDRATE?\nDONE.'];
  signs.forEach((t, i) => { const a = i / 4 * TAU + 0.9, x = Math.sin(a) * 118, z = Math.cos(a) * 118; api.sign(t, x, z, { yaw: a + Math.PI, h: 1.1, y: 1.8, post: true, maxW: 3.2, style: { bg: ['#1a2a3a', '#ffe24a', '#2a1a3a', '#1a3a2a'][i], fg: ['#9af0ff', '#1a1a1a', '#ff9ad8', '#ffffff'][i], border: '#ffffff' }, glow: ['#5ac8ff', '#ffe24a', '#ff4fd8', '#7aff5a'][i] }); api.light(x, z, 8, ['#5ac8ff', '#ffe24a', '#ff4fd8', '#7aff5a'][i], 0.4); });
  const poly = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; poly.push([Math.sin(a) * 135, Math.cos(a) * 135]); }
  this.perimeter(E, poly, 'chain');
  for (const [x, z, yaw] of [[0, 112, Math.PI], [-108, 10, Math.PI / 2]]) E.spots.push(...CartScene.bleachers(api, x, z, yaw, 18, 3, rng));
  E.heroes.push({ type: 'badideaguy', x: 75, z: 11, yaw: -2.2, anim: 'dare' }, { type: 'burney', x: 66, z: 4, yaw: 0.8, anim: 'photo' }, { type: 'sparklepony', x: 8, z: 30, yaw: 0, anim: 'cheer' }, { type: 'furry', x: -62, z: 36, yaw: 0.4, anim: 'wave' }, { type: 'deathguild', x: -30, z: -40, yaw: 2.6, anim: 'cheer' });
  // ---- objective spots ----
  E.zones = [{ x: 0, z: 0, r: 10, name: 'THE REEF' }, { x: 60, z: 20, r: 11, name: 'THE WRECK' }, { x: -70, z: -50, r: 10, name: 'THE BONEYARD' }, { x: -62, z: 55, r: 10, name: 'THE KELP GROVE' }, { x: 72, z: 8, r: 9, name: 'THE TREASURE' }];
  for (let i = 0; i < 48; i++) { const a = rng() * TAU, r = 12 + rng() * 105; E.orbSpots.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.flagSpots = [{ x: 0, z: 28 }, { x: -40, z: -12 }, { x: 46, z: -48 }, { x: -20, z: 80 }];
  E.captures = [{ x: -62, z: 55, r: 9 }, { x: 70, z: -62, r: 9 }, { x: -24, z: -96, r: 9 }, { x: 88, z: 52, r: 9 }];
  E.buoys = [{ x: 0, z: 52 }, { x: -58, z: -24 }, { x: 62, z: -34 }];
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.2, r = i % 2 ? 48 : 84; E.gifts.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.4; E.spawn.push({ x: Math.sin(a) * 68, z: Math.cos(a) * 68, yaw: a + Math.PI }); }
  return this.finish(E);
};

/* ---------------- the rules: swimming, air, bubbles, the HUD and the water ---------------- */
// where the objective wants a car to go (the engine's arena AI choices, so a surfacing car keeps playing)
const cartDeepObjectiveGoal = (s, k, nearestRival) => {
  const E = s.E, O = s.obj;
  let g = null, bd = 1e9;
  if (s.objective === 'glow') { for (const o of s.props.orbs) { if (!o.alive) continue; const d = Math.hypot(o.gx - k.x, o.gz - k.z); if (d < bd) { bd = d; g = [o.gx, o.gz]; } } return g; }
  if (s.objective === 'hill') { const z = E.zones[O.zone]; return [z.x, z.z]; }
  if (s.objective === 'flag' && O.flag) { const F = O.flag; if (F.holder === k) { const c = E.captures[O.capture]; return [c.x, c.z]; } return F.holder ? [F.holder.x, F.holder.z] : [F.x, F.z]; }
  if (s.objective === 'pearl' && s.pearl) { const P = s.pearl; if (k.pearls > 0) return [P.buoy.x, P.buoy.z]; for (const c of P.clams) { if (!c.pearl) continue; const d = Math.hypot(c.x - k.x, c.z - k.z); if (d < bd) { bd = d; g = [c.x, c.z]; } } return g; }
  const r = nearestRival(); return r ? [r.x, r.z] : null;
};
CART_ARENA_RULES.deep = {
  gravity: CART_G * 0.35, music: 'kart3',
  onLoad(s) {
    const E = s.E, D = s.deep = { bubbles: [], t: 0, tmp: {} };
    for (const k of s.karts) { k.breath = CART_DEEP.BREATH; k.breathMax = CART_DEEP.BREATH; k.drownT = 0; k.pearls = k.pearls || 0; k.wasSurf = false; k.air = k.y > s.terrain.height(k.x, k.z) + 0.02; }
    E.vents.forEach((v, vi) => { for (let i = 0; i < 3; i++) D.bubbles.push({ v: vi, x: v.x, z: v.z, y: 1 + i * 4.2, alive: true, t: 0, ph: s.rng() * 10 }); });
  },
  // every step: water drag, the speed cap, air, drowning; AI swims with the hop input toward its wanted height
  onStep(s, k, dt, racing) {
    const C = CART_DEEP, inp = k.inp;
    if (k.breath === undefined) { k.breath = C.BREATH; k.breathMax = C.BREATH; k.drownT = 0; k.pearls = 0; }
    if (k.hooked) { inp.gas = 0; inp.brake = 0; inp.steer = 0; inp.drift = false; inp.driftPress = false; }
    else if (k.ai && (!k.player || s.autoDrive) && k.ai.wantY !== undefined && !k.out) {
      const up = k.ai.wantY > k.y + 0.8;
      inp.drift = up; inp.driftPress = up && !k.air && k.hopCool <= 0;
    }
    const drag = Math.exp(-0.35 * dt); k.vx *= drag; k.vz *= drag;
    const sp = Math.hypot(k.vx, k.vz), cap = k.vmax * (k.boostT > 0 || k.dashT > 0 ? 1.3 : 1.08);
    if (sp > cap) { k.vx *= cap / sp; k.vz *= cap / sp; }
    if (!racing || k.out) return;
    const surf = k.y >= C.REFILL_Y;
    if (surf) { k.breath = Math.min(k.breathMax, k.breath + 14 * dt); k.drownT = 0; }
    else if (k.y < C.DRAIN_Y) {
      const before = k.breath; k.breath = Math.max(0, k.breath - dt);
      if (k.player && before > 6 && k.breath <= 6) Sound.play('powerdown', { vol: 0.3, pitch: 1.4 });
      if (k.breath <= 0) {
        k.drownT -= dt;
        if (k.drownT <= 0) {
          const ok = s.hit(k, 'stun', null, { item: 'drown' });
          if (ok) {
            s.fx.burst(k.x, k.y + 2, k.z, 'ring', 14, '#bfe8ff'); Sound.play('splash', { vol: k.player ? 0.7 : 0.25, pitch: 0.7 });
            if (k.player) { const m = s.msgs[s.msgs.length - 1]; if (m && m.text === 'ZAPPED!') { m.text = 'OUT OF AIR!'; m.sub = 'surface or catch a bubble'; m.col = '#ff6a6a'; } }
          }
          if (s.objective === 'vibe') k.drownT = ok ? 6 : 0.5;
          else { k.breath = 8; k.drownT = 0; if (ok) k.stunT = 1.2; }
        }
      }
    }
  },
  // the whole arena is water: hold HOP to rise, BRAKE to dive, float off ledges, land softly, bob at the surface
  vertical(s, k, dt, racing) {
    const C = CART_DEEP, inp = k.inp, gh = s.terrain.height(k.x, k.z), ai = k.ai && (!k.player || s.autoDrive) && k.ai.wantY !== undefined;
    const tumbling = k.spinT > 0 || k.flipT > 0 || k.stunT > 0;
    if (!k.air) {
      if (gh < k.y - 0.6) { k.air = true; k.airT = 0; k.vy = 0; }
      else if (!tumbling && !k.out && k.hopCool <= 0 && (ai ? k.ai.wantY > k.y + 0.8 : inp.drift)) { k.air = true; k.airT = 0; k.vy = Math.max(k.vy, 2); k.hopCool = 0.25; }
      else { k.y = gh; k.vy = 0; k.wasSurf = false; return true; }
    }
    let want;
    if (k.hooked && k.hooked.owner) want = clamp((k.hooked.owner.y - k.y) * 2, -C.RISE, C.RISE);
    else if (k.out) want = -C.SINK;
    else if (tumbling) want = -1.5;
    else if (ai) want = clamp((k.ai.wantY - k.y) * 1.6, -C.DIVE, C.RISE);
    else if (inp.drift) want = C.RISE;
    else if (inp.brake > 0) want = -C.DIVE;
    else want = -C.SINK;
    k.vy = approach(k.vy, want, dt * 10); k.y += k.vy * dt; k.airT += dt;
    if (k.y >= C.SURF) {
      k.y = C.SURF + Math.sin(s.t * 2.6 + k.slot) * 0.12; if (k.vy > 0) k.vy = 0;
      if (!k.wasSurf) { k.wasSurf = true; s.fx.burst(k.x, C.SURF + 0.3, k.z, 'drop', 16, '#bfe8ff'); if (k.player && racing) { Sound.play('splash', { vol: 0.6, pitch: 1.1 }); if (k.breath < k.breathMax * 0.5) s.banner('BREATHE!', '#9af0ff', 0.9, null, true); } }
    } else if (k.y < C.SURF - 0.5) k.wasSurf = false;
    if (k.y <= gh) { k.y = gh; k.air = false; k.vy = 0; k.airT = 0; k.hop = false; k.pendingDrift = false; k.landT = 0.1; }
    return true;
  },
  // getting hit drops the pearls you carry (they sink where you are)
  onHit(s, k, kind, src, o) {
    if (s.objective === 'pearl' && s.pearl && k.pearls > 0) {
      const P = s.pearl, n = k.pearls; k.pearls = 0;
      for (let i = 0; i < n; i++) { const a = s.rng() * TAU, d = 1.5 + s.rng() * 2; P.drops.push({ x: k.x + Math.sin(a) * d, z: k.z + Math.cos(a) * d, y: k.y + 1.2, from: k, cool: 1.0, ph: s.rng() * 10 }); }
      s.log('pearldrop', { k: k.id, n });
      if (k.player) s.banner('-' + n + ' PEARL' + (n > 1 ? 'S' : ''), '#ffe0f0', 1.0);
    }
    if (k.hooked && k.hooked.owner !== src) k.hooked = null;
  },
  // AI: breathe first (bubbles, then the surface), then the objective; pearls go to the buoy; height goes in ai.wantY
  aiGoal(s, k, nearestRival) {
    const C = CART_DEEP, D = s.deep, ai = k.ai, fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    ai.wantY = 0;
    // air first: once a car goes looking for it, it keeps at it until it has a good lungful
    if (k.breath < 7) ai.breathing = true; else if (k.breath >= 14) ai.breathing = false;
    if (ai.breathing && D) {
      let best = null, bd = 1e9;
      for (const b of D.bubbles) { if (!b.alive || b.y > 11.5) continue; const d = Math.hypot(b.x - k.x, b.z - k.z) + Math.abs(b.y - k.y) * 1.5; if (d < bd) { bd = d; best = b; } }
      if (best && (k.breath > 3 ? bd < 26 : bd < 10)) { ai.wantY = Math.max(0.5, best.y - 1.0); return { goal: [best.x, best.z] }; }
      // up to the surface, still heading for the objective
      ai.wantY = C.SURF; return { goal: cartDeepObjectiveGoal(s, k, nearestRival) || [k.x + fx * 24, k.z + fz * 24] };
    }
    if (s.objective === 'pearl' && s.pearl) {
      const P = s.pearl, B = P.buoy;
      if (k.pearls >= 3 || (k.pearls > 0 && Math.hypot(B.x - k.x, B.z - k.z) < 30)) { ai.wantY = C.SURF; return { goal: [B.x, B.z] }; }
      let best = null, bd = 1e9;
      for (const c of P.clams) { if (!c.pearl) continue; const d = Math.hypot(c.x - k.x, c.z - k.z) + (s.rng() - 0.5) * 8; if (d < bd) { bd = d; best = c; } }
      for (const d of P.drops) { if (d.cool > 0 && d.from === k) continue; const dd = Math.hypot(d.x - k.x, d.z - k.z) - 6; if (dd < bd) { bd = dd; best = d; } }
      if (best && k.pearls < 3) { ai.wantY = 0; return { goal: [best.x, best.z] }; }
      if (k.pearls > 0) { ai.wantY = C.SURF; return { goal: [B.x, B.z] }; }
      const r = nearestRival(); return r ? { prey: r } : null;
    }
    return null;
  },
  // the air bar (+ pearls carried and the objective arrow in PEARL DIVER)
  hud(s, ctx, W, H, top, left) {
    const C = CART_DEEP, k = s.player; if (!k || k.breath === undefined) return;
    const portrait = H > W, bw = Math.min(170, W * 0.3), bh = 10, x = W / 2 - bw / 2, y = H - Math.max(26, insets.b + 20) - (portrait ? 170 : 26);
    const surf = k.y >= C.REFILL_Y, u = clamp(k.breath / k.breathMax, 0, 1), low = k.breath < 6 && !surf, t = s.time;
    ctx.save();
    ctx.fillStyle = 'rgba(10,4,20,0.55)'; burnsRR(ctx, x - 36, y - 9, bw + 44, bh + 18, 9); ctx.fill();
    BurnsUI.text(ctx, 'AIR', x - 20, y + bh / 2, 11, '#9af0ff', { ui: true });
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; burnsRR(ctx, x, y, bw, bh, 5); ctx.fill();
    const col = surf ? '#ffffff' : low ? (Math.floor(t * 6) % 2 ? '#ff5a5a' : '#ff9a6a') : '#5ad8ff';
    if (u > 0.01) { ctx.fillStyle = col; burnsRR(ctx, x, y, Math.max(bh, bw * u), bh, 5); ctx.fill(); }
    if (surf) BurnsUI.text(ctx, 'SURFACED', x + bw / 2, y + bh / 2, 8, '#1a2a3a', { ui: true, stroke: false });
    if (low && !k.out && s.state === 'race') BurnsUI.text(ctx, k.breath <= 0 ? 'DROWNING!' : 'BREATHE!', W / 2, y - 24, 18, Math.floor(t * 5) % 2 ? '#ff5a5a' : '#ffffff', { glow: '#ff2020' });
    if (s.objective === 'pearl') {
      const n = k.pearls | 0; for (let i = 0; i < 3; i++) { const px = x + bw + 16 + i * 13; ctx.fillStyle = i < n ? '#fff0f8' : 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(px, y + bh / 2, 4.5, 0, TAU); ctx.fill(); if (i < n) { ctx.fillStyle = '#ffb0e0'; ctx.beginPath(); ctx.arc(px - 1.5, y + bh / 2 - 1.5, 1.6, 0, TAU); ctx.fill(); } }
      // where to go: the buoy when you carry pearls, otherwise the nearest pearl
      const P = s.pearl; let tgt = null;
      if (P && s.state === 'race') {
        if (n > 0) tgt = { x: P.buoy.x, y: C.SURF, z: P.buoy.z };
        else { let bd = 1e9; for (const c of P.clams) { if (!c.pearl) continue; const d = Math.hypot(c.x - k.x, c.z - k.z); if (d < bd) { bd = d; tgt = { x: c.x, y: c.y + 1, z: c.z }; } } for (const d of P.drops) { const dd = Math.hypot(d.x - k.x, d.z - k.z); if (dd < bd) { bd = dd; tgt = { x: d.x, y: d.y, z: d.z }; } } }
        if (tgt) { const p = {}; if (s.R.project(tgt.x, tgt.y + 2, tgt.z, W, H, p)) { const ax = clamp(p.x, 30, W - 30), ay = clamp(p.y, 70, H - 120); ctx.translate(ax, ay); ctx.fillStyle = n > 0 ? '#ffd84a' : '#ffe0f0'; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-9, -6); ctx.lineTo(9, -6); ctx.closePath(); ctx.fill(); ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0); } }
        if (n > 0 && s.state === 'race') BurnsUI.text(ctx, n >= 3 ? 'FULL! SURFACE AT THE BUOY' : 'SURFACE AT THE BUOY TO BANK', W / 2, top + 64, 12, '#ffd84a', {});
      }
    }
    ctx.restore();
  },
  // bubbles, vents, pearls, the buoy, the surface and the caustics (the simulation half runs in onUpdate)
  onUpdate(s, dt, racing) {
    const C = CART_DEEP, D = s.deep; if (!D) return;
    D.t += dt;
    for (const b of D.bubbles) {
      if (!b.alive) { b.t -= dt; if (b.t <= 0) { const v = s.E.vents[b.v]; b.alive = true; b.x = v.x; b.z = v.z; b.y = 0.8 + s.rng() * 1.5; } continue; }
      b.y += 1.8 * dt; b.x += Math.sin(D.t * 1.7 + b.ph) * 0.5 * dt; b.z += Math.cos(D.t * 1.3 + b.ph) * 0.5 * dt;
      if (b.y > C.SURF - 0.8) { b.alive = false; b.t = 1.5 + s.rng(); s.fx.burst(b.x, b.y, b.z, 'ring', 6, '#bfe8ff'); continue; }
      if (!racing) continue;
      for (const k of s.karts) {
        if (k.out) continue;
        const dx = k.x - b.x, dz = k.z - b.z;
        if (dx * dx + dz * dz < 2.9 * 2.9 && Math.abs(k.y + 1.2 - b.y) < 2.6) {
          b.alive = false; b.t = 2.5 + s.rng() * 2; k.breath = Math.min(k.breathMax, k.breath + C.BUBBLE_AIR); k.drownT = 0;
          s.fx.burst(b.x, b.y, b.z, 'ring', 10, '#bfe8ff'); s.log('bubble', { k: k.id });
          if (k.player) { Sound.play('cartBubble', { vol: 0.7, pitch: 1.2 }); s.banner('+' + C.BUBBLE_AIR + 's AIR', '#9af0ff', 0.8, null, true); } else Sound.play('cartBubble', { vol: 0.15, pitch: 1.4 });
          break;
        }
      }
    }
  },
  draw(s, R, S, t) {
    const C = CART_DEEP, D = s.deep, cam = s.cam, H = s.terrain, fx = s.fx, k = s.player; if (!D) return;
    // the surface: a sheet of faint light at y 14, tiled from solid squares snapped to a grid so it doesn't swim with the camera
    const TS = 60, gx = Math.round(cam.x / TS) * TS, gz = Math.round(cam.z / TS) * TS;
    const sa = cam.y < C.SURF ? 0.3 : 0.16;   // a brighter ceiling from below, a faint sheet from above
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) R.flat.flat(gx + i * TS, C.SURF, gz + j * TS, TS / 0.6, TS / 0.6, 0, S.square, [0.4, 0.7, 1], sa, true);
    // caustics: slow rings of light on the sand around the player
    const cx = Math.round(k.x / 28) * 28, cz = Math.round(k.z / 28) * 28;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const px = cx + i * 28 + Math.sin(t * 0.21 + i * 2 + j) * 5, pz = cz + j * 28 + Math.cos(t * 0.17 + j * 2 - i) * 5, gy = H.height(px, pz) + 0.12;
      R.flat.flat(px, gy, pz, 26, 26, t * 0.08 + i + j * 2, S.ring, [0.55, 0.85, 1], 0.1 + 0.04 * Math.sin(t * 0.9 + i * 3 + j), true);
      R.flat.flat(px, gy, pz, 18, 18, 0, S.glow, [0.4, 0.7, 1], 0.07, true);
    }
    // vents puff and the bubble pickups rise
    for (const v of s.E.vents) { const d2 = (v.x - cam.x) * (v.x - cam.x) + (v.z - cam.z) * (v.z - cam.z); if (d2 > 110 * 110) continue; if (Math.random() < 0.3) fx.add(v.x + (Math.random() - 0.5) * 1.2, 0.6, v.z + (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.4, 2.2 + Math.random(), (Math.random() - 0.5) * 0.4, 4.5, 0.2, 0.5, [0.75, 0.92, 1], 0.6, 'ring', 1, Math.random() * 6, 1); }
    for (const b of D.bubbles) {
      if (!b.alive) continue; const d2 = (b.x - cam.x) * (b.x - cam.x) + (b.z - cam.z) * (b.z - cam.z); if (d2 > 140 * 140) continue;
      const w = 2.2 + Math.sin(t * 5 + b.ph) * 0.15;
      R.bbs.bb(b.x, b.y, b.z, w, w * 1.08, S.bubble, [0.8, 0.95, 1], 0.9, false);
      R.bbs.bb(b.x, b.y, b.z, w * 1.6, w * 1.6, S.glow, [0.5, 0.85, 1], 0.3, true);
    }
    // every car breathes out: bubbles from the exhaust, a wake at the surface
    for (const q of s.karts) {
      if (!q._in || q.out) continue;
      const fwx = Math.sin(q.yaw), fwz = Math.cos(q.yaw), back = q.M ? q.M.len * 0.45 : 2.2;
      if (Math.random() < 0.5 + Math.min(0.5, q.speed / 30)) fx.add(q.x - fwx * back + (Math.random() - 0.5), q.y + 0.6, q.z - fwz * back + (Math.random() - 0.5), -fwx * 1.5 + (Math.random() - 0.5), 1.6 + Math.random() * 1.2, -fwz * 1.5 + (Math.random() - 0.5), 2.4, 0.12, 0.42, [0.8, 0.94, 1], 0.6, 'ring', 1 | 4, Math.random() * 6, 1);
      if (q.y >= C.SURF - 0.3 && q.speed > 3 && Math.random() < 0.8) fx.add(q.x - fwx * back * 0.5 + (Math.random() - 0.5) * 2, C.SURF + 0.2, q.z - fwz * back * 0.5 + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 2, 0.6, 0.25, 0.1, [0.8, 0.92, 1], 0.9, 'drop', 2);
      if (q.hooked) R.bbs.bb(q.x, q.y + 1.6, q.z, 4.5, 4.5, S.ring, [0.75, 0.92, 1], 0.6 + Math.sin(t * 12) * 0.2, true);
      if (q.breath !== undefined && q.breath <= 0 && q.y < C.DRAIN_Y && Math.floor(t * 4) % 2 === 0) R.bbs.bb(q.x, q.y + (q.M ? q.M.h : 3) + 1.2, q.z, 1.6, 1.6, S.warn, [1, 0.35, 0.3], 0.9, true);
    }
    // PEARL DIVER: pearls in the clams, sinking drops, pearls carried, the buoy ring at the surface
    const P = s.objective === 'pearl' && s.pearl;
    if (P) {
      const pearl = (x, y, z, a) => { R.bbs.bb(x, y, z, 0.9, 0.9, S.core, [1, 0.96, 0.92], a, false); R.bbs.bb(x, y, z, 2.6, 2.6, S.glow, [0.95, 0.8, 1], 0.5 * a, true); };
      for (const c of P.clams) if (c.pearl) pearl(c.x, c.y + 0.95 + Math.sin(t * 3 + c.x) * 0.06, c.z, 1);
      for (const d of P.drops) pearl(d.x, d.y, d.z, 1);
      for (const q of s.karts) if (q.pearls > 0 && q._in) for (let i = 0; i < q.pearls; i++) { const a = t * 2 + i * TAU / 3; pearl(q.x + Math.cos(a) * 1.3, q.y + (q.M ? q.M.h : 3) + 1.0 + Math.sin(t * 3 + i) * 0.2, q.z + Math.sin(a) * 1.3, 0.9); }
      const B = P.buoy, pulse = 0.75 + 0.25 * Math.sin(t * 4);
      R.flat.flat(B.x, C.SURF + 0.05, B.z, B.r * 2.2, B.r * 2.2, t * 0.5, S.ring, [1, 0.75, 0.3], 0.9 * pulse, true);
      R.flat.flat(B.x, C.SURF + 0.04, B.z, B.r * 2, B.r * 2, 0, S.glow, [1, 0.7, 0.3], 0.3, true);
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + t * 0.5, bx = B.x + Math.sin(a) * B.r, bz = B.z + Math.cos(a) * B.r; R.bbs.bb(bx, C.SURF + 0.6 + Math.sin(t * 2.5 + i) * 0.15, bz, 1.6, 1.6, S.core, [1, 0.45, 0.15], 1, false); R.bbs.bb(bx, C.SURF + 0.6, bz, 3, 3, S.glow, [1, 0.6, 0.2], 0.6, true); }
      R.bbs.streak(B.x, C.SURF / 2, B.z, 0, 1, 0, C.SURF, 3.5, S.streak, [1, 0.75, 0.3], 0.35);
      R.bbs.streak(B.x, C.SURF + 12, B.z, 0, 1, 0, 26, 2.2, S.streak, [1, 0.85, 0.4], 0.5);
    }
  },
  lights(s, add) {
    const C = CART_DEEP;
    if (s.objective === 'pearl' && s.pearl) { const B = s.pearl.buoy; add(B.x, C.SURF + 1, B.z, 22, [1, 0.6, 0.25], 1.2, 1.5); }
    for (const sh of s.shots) { if (sh.fx === 'torpedo') add(sh.x, sh.y, sh.z, 9, [1, 0.55, 0.25], 1.0, 1.5); if (sh.fx === 'harpoon' && sh.hooked) add(sh.hooked.x, sh.hooked.y + 1.5, sh.hooked.z, 8, [0.6, 0.9, 1], 0.9, 1.2); }
    for (const k of s.karts) if (k.breath !== undefined && k.breath <= 0 && !k.out) add(k.x, k.y + 2, k.z, 7, [1, 0.3, 0.25], 0.8 + 0.4 * Math.sin(s.time * 10), 1.1);
  }
};

/* ---------------- PEARL DIVER ---------------- */
CART_OBJECTIVES.pearl = {
  name: 'PEARL DIVER', short: 'Pearls to the buoy',
  desc: 'Dive for pearls in the giant clams (carry up to 3), then surface inside the buoy ring to bank them. Getting hit drops them. The buoy moves. First to 10 wins.',
  time: 180, goal: 10, unit: ' pearls',
  fx: {
    init(s) {
      const E = s.E, b0 = E.buoys && E.buoys.length ? E.buoys : [{ x: 0, z: 40 }, { x: -40, z: -20 }, { x: 40, z: -20 }];
      s.pearl = { clams: (E.clams || []).map(c => ({ x: c.x, z: c.z, y: c.y, pearl: true, t: 0 })), drops: [], spots: b0, buoy: { i: 0, x: b0[0].x, z: b0[0].z, r: 9, t: 40 } };
      for (const k of s.karts) k.pearls = 0;
    },
    update(s, dt) {
      const C = CART_DEEP, P = s.pearl, K = s.karts, G = CART_OBJECTIVES.pearl.goal;
      for (const c of P.clams) {
        if (!c.pearl) { c.t -= dt; if (c.t <= 0) { c.pearl = true; s.fx.burst(c.x, c.y + 1, c.z, 'star', 8, '#ffe0f0'); } continue; }
        for (const k of K) { if (k.out || k.pearls >= 3 || k.y > c.y + 2.6) continue; if (Math.hypot(k.x - c.x, k.z - c.z) < 2.9) { c.pearl = false; c.t = 10; k.pearls++; this.took(s, k, c.x, c.y + 1, c.z); break; } }
      }
      const keep = [];
      for (const d of P.drops) {
        d.cool -= dt; const fl = s.terrain.height(d.x, d.z) + 0.7; if (d.y > fl) d.y = Math.max(fl, d.y - 2.2 * dt); let taken = false;
        for (const k of K) { if (k.out || k.pearls >= 3 || (d.cool > 0 && d.from === k) || Math.abs(k.y + 1 - d.y) > 2.8) continue; if (Math.hypot(k.x - d.x, k.z - d.z) < 2.9) { k.pearls++; this.took(s, k, d.x, d.y, d.z); taken = true; break; } }
        if (!taken) keep.push(d);
      }
      P.drops = keep;
      const B = P.buoy; B.t -= dt;
      if (B.t <= 0) { B.i = (B.i + 1 + Math.floor(s.rng() * (P.spots.length - 1))) % P.spots.length; B.x = P.spots[B.i].x; B.z = P.spots[B.i].z; B.t = 40; s.banner('THE BUOY MOVES', '#ffd84a', 1.6); Sound.play('kartFinalLap', { vol: 0.5 }); }
      for (const k of K) {
        if (k.out || !k.pearls || k.y < C.SURF - 1.0) continue;
        if (Math.hypot(k.x - B.x, k.z - B.z) < B.r) {
          const n = k.pearls; k.score += n; k.pearls = 0; k.cheerT = 1.0; s.log('bank', { k: k.id, n, total: k.score });
          s.banner(k.player ? 'BANKED +' + n + '!' : k.car.name + ' BANKS ' + n, k.player ? '#7aff8a' : '#ff9a3a', 1.4, k.score + ' / ' + G); Sound.play(k.player ? 'kartFinish' : 'kartLap', { vol: 0.6 }); s.fx.confetti(k.x, C.SURF + 2, k.z, 24);
        }
      }
      const best = K.reduce((a, b) => (b.score > a.score ? b : a));
      return best.score >= G;
    },
    took(s, k, x, y, z) { s.log('pearl', { k: k.id, n: k.pearls }); s.fx.burst(x, y, z, 'star', 10, '#ffe0f0'); if (k.player) { Sound.play('pick', { vol: 0.7, pitch: 1.3 }); s.banner('PEARL! ' + k.pearls + '/3', '#ffe0f0', 0.9, k.pearls >= 3 ? 'Surface at the buoy' : null, true); } },
    rank(s) { return s.karts.slice().sort((a, b) => (b.score - a.score) || ((b.pearls || 0) - (a.pearls || 0)) || (b.hitsDealt - a.hitsDealt)); },
    score(k) { return k.score; }
  }
};

/* ---------------- the powers (arena drops; in every race once the arena is mastered) ---------------- */
const cartDeepRivalAhead = (s, k, range, half) => {
  let best = null, bd = 1e9;
  for (const o of s.karts) { if (o === k || o.out || (s.isRace && o.finished)) continue; const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); if (d > range || Math.abs(o.y - k.y) > 9) continue; const a = Math.abs(cartWrap(Math.atan2(dx, dz) - k.yaw)); if (a < half && d < bd) { bd = d; best = o; } }
  return best;
};
CART_ITEMS.harpoon = { name: 'HARPOON', desc: 'Fires a line straight ahead. Hook a rival and reel them in for a spin.', col: '#bfe8ff', arena: 'deep' };
CART_ITEM_FX.harpoon = {
  use(s, k) {
    const mz = s.muzzle(k, [0, 0, 0]);
    s.shots.push({ fx: 'harpoon', type: 'harpoon', owner: k, t: 0, life: 2.4, phase: 'fly', yaw: k.yaw, x: mz[0], y: mz[1], z: mz[2], hooked: null, hookT: 0 });
    Sound.play('laser', { vol: k.player ? 0.6 : 0.25, pitch: 0.55 }); Sound.play('throw', { vol: k.player ? 0.5 : 0.2, pitch: 1.3 });
  },
  shot(s, sh, dt) {
    const k = sh.owner, fx = Math.sin(sh.yaw), fz = Math.cos(sh.yaw);
    if (sh.phase === 'fly') {
      const mz = s.muzzle(k, [0, 0, 0]), d = Math.min(40, 40 * sh.t / 0.35);
      sh.x = mz[0] + fx * d; sh.y = mz[1]; sh.z = mz[2] + fz * d;
      for (const o of s.karts) {
        if (o === k || o.out || o.hooked || o.invT > 0.5 || o.dashT > 0 || (s.isRace && o.finished)) continue;
        const along = (o.x - mz[0]) * fx + (o.z - mz[2]) * fz, side = Math.abs((o.x - mz[0]) * fz - (o.z - mz[2]) * fx);
        if (along > 1 && along < d + 1.5 && side < 2.6 && Math.abs(o.y + 1 - sh.y) < 4) {
          sh.phase = 'reel'; sh.hooked = o; sh.hookT = 0; o.hooked = sh; o.drift = 0; o.charge = 0;
          s.fx.spark(o.x, o.y + 1.2, o.z, 12, '#bfe8ff', 6); s.log('hook', { k: o.id, by: k.id, player: o.player, byPlayer: !!k.player });
          Sound.play('kartHit', { vol: o.player || k.player ? 0.6 : 0.2, pitch: 1.5 });
          if (o.player) s.banner('HARPOONED!', '#bfe8ff', 1.2, 'by ' + k.car.name); else if (k.player) s.banner('HOOKED ' + o.car.name + '!', '#bfe8ff', 0.9, null, true);
          break;
        }
      }
      if (sh.t > 0.5) sh.dead = true;
      return;
    }
    const o = sh.hooked;
    if (!o || o.hooked !== sh || o.out || k.out || k.spinT > 0 || k.flipT > 0 || (s.obj && s.obj.ended)) { if (o && o.hooked === sh) o.hooked = null; sh.dead = true; return; }
    sh.hookT += dt;
    const dx = k.x - o.x, dz = k.z - o.z, d = Math.hypot(dx, dz) || 1, v = clamp(d / Math.max(0.25, 1.5 - sh.hookT), 10, 45);
    o.vx = dx / d * v; o.vz = dz / d * v;
    sh.x = o.x; sh.y = o.y + 1; sh.z = o.z;
    if (d < 4.5 || sh.hookT >= 1.5) {
      o.hooked = null; sh.dead = true; o.vx *= 0.3; o.vz *= 0.3;
      s.hit(o, 'spin', k, { item: 'harpoon', dur: 1.2 }); s.fx.burst(o.x, o.y + 1.5, o.z, 'spark', 14, '#bfe8ff');
    }
  },
  draw(s, R, sh, S, t) {
    const k = sh.owner, mz = s.muzzle(k, [0, 0, 0]);
    const tx = sh.hooked ? sh.hooked.x : sh.x, ty = sh.hooked ? sh.hooked.y + 1 : sh.y, tz = sh.hooked ? sh.hooked.z : sh.z;
    const n = 7, dx = tx - mz[0], dy = ty - mz[1], dz = tz - mz[2], L = Math.hypot(dx, dy, dz) || 1;
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n, sag = Math.sin(u * Math.PI) * (sh.hooked ? 0.6 : 0.2); R.bbs.streak(mz[0] + dx * u, mz[1] + dy * u - sag, mz[2] + dz * u, dx / L, dy / L, dz / L, L / n * 1.08, 0.22, S.streak, [0.85, 0.95, 1], 0.95); }
    R.bbs.bb(tx, ty, tz, 1.4, 1.4, S.spark, [0.9, 0.97, 1], 1, true, t * 4);
    if (!sh.hooked && Math.random() < 0.6) s.fx.add(tx, ty, tz, (Math.random() - 0.5) * 2, 1 + Math.random(), (Math.random() - 0.5) * 2, 0.8, 0.15, 0.3, [0.8, 0.94, 1], 0.6, 'ring', 1, 0, 1);
  },
  aiWants(s, k) { return !!cartDeepRivalAhead(s, k, 38, 0.22) || k.ai.itemT < -8; },
  icon(ctx, s, col) { ctx.strokeStyle = '#1a1020'; ctx.lineWidth = Math.max(1.5, s * 0.08); ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.45); ctx.lineTo(s * 0.35, -s * 0.4); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, s * 0.12); ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.45); ctx.lineTo(s * 0.3, -s * 0.35); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(s * 0.5, -s * 0.55); ctx.lineTo(s * 0.05, -s * 0.3); ctx.lineTo(s * 0.3, -s * 0.05); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#1a1020'; ctx.lineWidth = Math.max(1, s * 0.06); ctx.stroke(); ctx.beginPath(); ctx.arc(-s * 0.48, s * 0.42, s * 0.14, 0, TAU); ctx.stroke(); }
};
CART_ITEMS.ink = { name: 'INK CLOUD', desc: 'Squirts a black cloud behind you. Rivals inside are dazzled and lost in the dark.', col: '#9a7aff', arena: 'deep' };
CART_ITEM_FX.ink = {
  use(s, k) {
    const p = cartCarPoint(k, 0, 1.2, -(k.M ? k.M.len : 5) / 2 - 3.5, [0, 0, 0]);
    s.shots.push({ fx: 'ink', type: 'ink', owner: k, x: p[0], y: p[1] + 0.8, z: p[2], t: 0, life: 7, r: 7, hitT: new Map() });
    Sound.play('splash', { vol: k.player ? 0.6 : 0.2, pitch: 0.55 }); Sound.play('puke', { vol: k.player ? 0.35 : 0.12, pitch: 0.6 });
    if (s.fx) s.fx.smoke(p[0], p[1], p[2], 8, '#141020');
  },
  shot(s, sh, dt) {
    const r = sh.r * Math.min(1, sh.t / 0.5 + 0.2);
    for (const o of s.karts) {
      if (o === sh.owner || o.out) continue;
      const dx = o.x - sh.x, dz = o.z - sh.z; if (dx * dx + dz * dz > r * r || Math.abs(o.y - sh.y) > 6) continue;
      const last = sh.hitT.get(o) || -9;
      if (sh.t - last > 1.0 && o.dazzleT <= 0) { sh.hitT.set(o, sh.t); s.hit(o, 'dazzle', sh.owner, { item: 'ink' }); }
    }
  },
  draw(s, R, sh, S, t) {
    const grow = Math.min(1, sh.t / 0.5), fade = Math.min(1, (sh.life - sh.t) / 1.5), r = sh.r * grow;
    for (let i = 0; i < 8; i++) { const a = i * 2.4 + t * 0.15, d = r * (0.25 + 0.45 * ((i * 7) % 5) / 4), y = sh.y + Math.sin(i * 1.7 + t * 0.6) * 1.2; R.bbs.bb(sh.x + Math.cos(a) * d, y, sh.z + Math.sin(a) * d, r * 0.95, r * 0.95, S.puff, [0.03, 0.02, 0.06], 0.88 * fade, false, i * 0.8 + t * 0.2); }
    R.bbs.bb(sh.x, sh.y, sh.z, r * 1.3, r * 1.3, S.puff, [0.02, 0.01, 0.04], 0.75 * fade, false, t * 0.1);
    if (Math.random() < 0.3) s.fx.add(sh.x + (Math.random() - 0.5) * r, sh.y + (Math.random() - 0.5) * 2, sh.z + (Math.random() - 0.5) * r, 0, 0.3, 0, 1.2, 1.2, 2.4, [0.05, 0.03, 0.08], 0.5 * fade, 'smoke', 4);
  },
  aiWants(s, k) { const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw); for (const o of s.karts) { if (o === k || o.out) continue; const dx = o.x - k.x, dz = o.z - k.z; if (dx * fx + dz * fz < 0 && Math.hypot(dx, dz) < 22) return true; } return k.ai.itemT < -7; },
  icon(ctx, s, col) { ctx.fillStyle = '#1a1020'; for (const [dx, dy, r] of [[-0.25, 0.1, 0.3], [0.15, -0.1, 0.34], [0.3, 0.2, 0.24], [-0.05, 0.25, 0.26]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, r * s, 0, TAU); ctx.fill(); } ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, s * 0.08); ctx.beginPath(); ctx.arc(0, 0.05 * s, s * 0.5, 0, TAU); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(-s * 0.15, -s * 0.05, s * 0.07, 0, TAU); ctx.arc(s * 0.12, -s * 0.05, s * 0.07, 0, TAU); ctx.fill(); }
};
CART_ITEMS.torpedo = { name: 'TORPEDO', desc: 'A fast homing torpedo. It locks on to the nearest rival ahead and flips them.', col: '#ff8a3a', arena: 'deep' };
CART_ITEM_FX.torpedo = {
  use(s, k) {
    const mz = s.muzzle(k, [0, 0, 0]), fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), target = cartDeepRivalAhead(s, k, 70, 0.95);
    s.shots.push({ fx: 'torpedo', type: 'torpedo', owner: k, x: mz[0], y: mz[1], z: mz[2], vx: fx * 38, vz: fz * 38, vy: 0, t: 0, life: 3, target, loc: { i: k.loc ? k.loc.i : 0, s: 0, d: 0 } });
    Sound.play('kartBoost', { vol: k.player ? 0.6 : 0.25, pitch: 0.6 }); Sound.play('cartBubble', { vol: k.player ? 0.4 : 0.15, pitch: 0.8 });
    if (k.player && target && target.player === false) s.banner('LOCKED: ' + target.car.name, '#ff8a3a', 0.8, null, true);
    if (target && target.player) s.banner('TORPEDO INCOMING!', '#ff8a3a', 1.0);
  },
  shot(s, sh, dt) {
    const k = sh.owner, sp = 38, tg = sh.target && !sh.target.out ? sh.target : null;
    if (tg) { const dx = tg.x - sh.x, dz = tg.z - sh.z, d = Math.hypot(dx, dz) || 1, m = 1 - Math.exp(-3.5 * dt); sh.vx = lerp(sh.vx, dx / d * sp, m); sh.vz = lerp(sh.vz, dz / d * sp, m); const l = Math.hypot(sh.vx, sh.vz) || 1; sh.vx *= sp / l; sh.vz *= sp / l; }
    sh.x += sh.vx * dt; sh.z += sh.vz * dt;
    const gh = s.terrain.height(sh.x, sh.z), deep = s.arenaId === 'deep', wantY = tg && deep ? tg.y + 1.2 : gh + 1.2;
    sh.y = deep ? lerp(sh.y, wantY, 1 - Math.exp(-4 * dt)) : Math.max(sh.y - 6 * dt, gh + 1.2);
    let boom = sh.y < gh + 0.3;
    if (s.TR && s.isRace) { const L = s.TR.locate(sh.x, sh.z, sh.loc.i, sh.loc); if (L.d > s.TR.WR[L.i] || L.d < -s.TR.WL[L.i]) boom = true; }
    if (s.E.walls) { for (const a of s.E.art) if (Math.hypot(sh.x - a.x, sh.z - a.z) < a.r) boom = true; if (s.wallDist(sh.x, sh.z, s._wdT || (s._wdT = {})).d < 0.5) boom = true; }
    for (const o of s.karts) { if (o === k || o.out) continue; const dx = o.x - sh.x, dz = o.z - sh.z; if (dx * dx + dz * dz < 2.6 * 2.6 && Math.abs(o.y + 1 - sh.y) < 3.2) { const l = Math.hypot(sh.vx, sh.vz) || 1; s.hit(o, 'flip', k, { dx: sh.vx / l, dz: sh.vz / l, item: 'torpedo' }); boom = true; break; } }
    if (boom || sh.t > sh.life) { sh.dead = true; s.fx.burst(sh.x, sh.y, sh.z, 'ring', 16, '#bfe8ff'); s.fx.spark(sh.x, sh.y, sh.z, 14, '#ffb060', 8); Sound.play('cartBoom', { vol: Math.hypot(sh.x - s.cam.x, sh.z - s.cam.z) < 40 ? 0.6 : 0.25, pitch: 0.8 }); }
  },
  draw(s, R, sh, S, t) {
    const l = Math.hypot(sh.vx, sh.vz) || 1;
    R.bbs.bb(sh.x, sh.y, sh.z, 1.5, 1.5, S.core, [1, 0.65, 0.3], 1, true);
    R.bbs.bb(sh.x, sh.y, sh.z, 4, 4, S.glow, [1, 0.5, 0.2], 0.7, true);
    R.bbs.streak(sh.x - sh.vx / l * 2.5, sh.y, sh.z - sh.vz / l * 2.5, sh.vx, 0, sh.vz, 5, 0.9, S.streak, [1, 0.7, 0.4], 0.7);
    for (let i = 0; i < 2; i++) s.fx.add(sh.x - sh.vx / l * (1 + Math.random() * 2), sh.y + (Math.random() - 0.5) * 0.6, sh.z - sh.vz / l * (1 + Math.random() * 2), (Math.random() - 0.5) * 2, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 2, 1.4, 0.15, 0.45, [0.8, 0.94, 1], 0.7, 'ring', 1 | 4, 0, 1);
  },
  aiWants(s, k) { return !!cartDeepRivalAhead(s, k, 60, 0.7) || k.ai.itemT < -6; },
  icon(ctx, s, col) { ctx.fillStyle = col; ctx.strokeStyle = '#1a1020'; ctx.lineWidth = Math.max(1.5, s * 0.08); ctx.save(); ctx.rotate(-0.5); ctx.beginPath(); ctx.ellipse(0, 0, s * 0.52, s * 0.18, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.3); ctx.lineTo(-s * 0.3, 0); ctx.lineTo(-s * 0.5, s * 0.3); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(s * 0.3, 0, s * 0.07, 0, TAU); ctx.fill(); ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(1, s * 0.06); for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-s * 0.45 - i * s * 0.12, s * 0.35 + i * s * 0.05, s * (0.05 + i * 0.025), 0, TAU); ctx.stroke(); } }
};

/* ---------------- the menu card icon: a wave and rising bubbles ---------------- */
CART_ARENA_ICONS.deep = (ctx, s, t, col) => {
  ctx.beginPath(); ctx.moveTo(-s, -s * 0.5);
  for (let i = 0; i <= 8; i++) { const x = -s + i * s * 0.25; ctx.lineTo(x, -s * 0.5 + Math.sin(i * 1.3 + t * 2.5) * s * 0.12); }
  ctx.lineTo(s, s * 0.95); ctx.lineTo(-s, s * 0.95); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 3; i++) { const ph = (t * 0.45 + i * 0.37) % 1, x = (i - 1) * s * 0.45 + Math.sin(t * 3 + i) * s * 0.06, y = s * 0.8 - ph * s * 1.1, r = s * (0.08 + i * 0.05) * (1 - ph * 0.3); ctx.globalAlpha = 1 - ph * 0.8; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(s * 0.35, s * 0.5, s * 0.28, s * 0.14, 0.3, 0, TAU); ctx.fill();
};
