/* ============================================================
   ART CART — secret arena: THE COPPER FORGE (id 'forge'), Calamari Inferno's secret level
   A night foundry yard: an iron floor veined with glowing cracks, a roaring domed furnace
   with a tall chimney in the middle, giant anvils, bellows, copper steam pipes arching
   overhead, steam vents in the floor and sixteen copper braziers in two rings.
   Its own game: LIGHT THE FORGE (every car carries a torch; drive past a brazier to light
   it in your colour, steal rivals' fires, the bellows pay you for every fire you hold,
   and the steam vents blow fires out).
   Registers itself in CART_ARENAS / CART_ARENA_RULES / CART_OBJECTIVES / CART_ARENA_ICONS
   and CART_SECRET_LEVELS.octo. Globals FRG_*, scene state s.frg, world state E.frg, kart k.frg.
   Everything here is an original design.
   ============================================================ */
const FRG_C = {
  R: 100,                 // the railing radius
  LIGHT_R: 3.8,           // pass this close to a brazier to light it
  COOL: 2.5,              // a freshly lit brazier can't change colour for this long
  BELLOWS: 5,             // every 5 s the bellows pay +1 per brazier you hold
  VENT_EVERY: 7.5, WARN: 2.4, BLAST: 1.6, DOUSE_R: 14, KNOCK_R: 6,
  SNUFF: 3,               // a hit blows your torch out for 3 s
  PTS_LIGHT: 1, PTS_STEAL: 2
};
const FRG_P = { proj: {} };   // scratch (no per-frame allocations)
const FRG_ORANGE = [1, 0.55, 0.18];

/* ---------------- the brazier (an instanced prototype with its own collider) ---------------- */
function FRG_brazierMesh(m) {
  m.color('#3a2a24').shine(2);
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; m.limb(Math.sin(a) * 1.15, 0, Math.cos(a) * 1.15, Math.sin(a) * 0.55, 1.5, Math.cos(a) * 0.55, 0.11, 0.09, { seg: 5 }); m.ball(Math.sin(a) * 1.15, 0.08, Math.cos(a) * 1.15, 0.18, { seg: 6, rings: 4 }); }
  m.color('#c8743a').shine(3);
  m.lathe([[0, 1.35], [0.6, 1.4], [1.15, 1.75], [1.45, 2.25], [1.55, 2.35]], { seg: m.lo ? 10 : 14 });             // the copper bowl, outside
  m.color('#9a5228'); m.lathe([[0, 1.55], [1.0, 1.85], [1.38, 2.3], [1.5, 2.36]], { seg: m.lo ? 10 : 14, flip: true });
  m.color('#e8a060'); m.torus(0, 2.36, 0, 1.52, 0.1, { seg: m.lo ? 12 : 18, tseg: 4 });
  m.color('#5a3022'); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; m.push(); m.tf(Math.sin(a) * 1.3, 2.0, Math.cos(a) * 1.3, a, 0.5, 0); m.roundBox(0, 0, 0, 0.5, 0.06, 0.3, 0.02); m.pop(); }
  m.color('#2a1a18', 0.15).shine(0); for (let i = 0; i < 7; i++) { const a = i * 2.4, r = i ? 0.75 : 0; m.ball(Math.sin(a) * r, 1.95, Math.cos(a) * r, 0.36, { seg: 6, rings: 4 }); }   // coals
  m.emissive(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.0, y0: 0, y1: 2.4 }] };
}

/* ---------------- the world ---------------- */
CartWorlds.arena_forge = function (A, night) {
  const C = FRG_C, R = C.R;
  const E = this.base(2008, [-140, -140, 140, 140], '#6a5248', 0.18);
  const sky = Object.assign(CART_SKIES.night(), { hor: '#ff6a2a', fog: '#4a2a22', zen: '#0a060c', sky: '#5a3a4a', cityCol: '#ff7a2a', cityK: 0.9, emB: 2.2, keyK: 0.75, key: '#ffc8a0', rim: '#ff8a4a', mid: '#2a1212', midK: 0.35, fogD: 0.0048 });
  Object.assign(E, { id: 'forge', arena: A, sky, tod: 'night', music: 'kart3', night: true, R, frg: { braz: [], vents: [], chim: { x: 0, z: 0, y: 26 } } });
  const api = E.api, T = E.terrain, rng = mulberry32(2008), F = E.frg;
  // ---- the floor: iron plates, ash rings, glowing cracks ----
  api.paint((ctx, P, S) => {
    const c = P(0, 0);
    for (let i = 0; i < 260; i++) { const x = (rng() - 0.5) * 240, z = (rng() - 0.5) * 240, q = P(x, z); ctx.fillStyle = `rgba(${rng() < 0.5 ? '20,14,14' : '120,96,84'},${0.08 + rng() * 0.1})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (2 + rng() * 9) * S, (1.5 + rng() * 5) * S, rng() * 3, 0, TAU); ctx.fill(); }
    for (const r of [22, 36, 55, 74, 92]) { ctx.strokeStyle = 'rgba(20,12,10,0.35)'; ctx.lineWidth = 6 * S; ctx.beginPath(); ctx.arc(c[0], c[1], r * S, 0, TAU); ctx.stroke(); }
    ctx.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      let x = (rng() - 0.5) * 190, z = (rng() - 0.5) * 190, a = rng() * TAU; if (Math.hypot(x, z) > 95) continue;
      for (const pass of [0, 1]) {
        ctx.strokeStyle = pass ? 'rgba(255,200,100,0.95)' : 'rgba(255,100,30,0.45)'; ctx.lineWidth = (pass ? 0.3 : 1.2) * S;
        ctx.beginPath(); let px = x, pz = z, pa = a; const q0 = P(px, pz); ctx.moveTo(q0[0], q0[1]);
        const r2 = mulberry32(900 + i); for (let k = 0; k < 9; k++) { pa += (r2() - 0.5) * 1.3; px += Math.sin(pa) * 1.6; pz += Math.cos(pa) * 1.6; const q = P(px, pz); ctx.lineTo(q[0], q[1]); }
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(255,120,40,0.18)'; ctx.beginPath(); ctx.arc(c[0], c[1], 15 * S, 0, TAU); ctx.fill();
  });
  // ---- the great furnace: a brick dome with copper bands, a roaring mouth, a tall chimney ----
  CartScene.mesh(api, 0, 0, 0, m => {
    const bands = []; for (let i = 0; i <= 10; i++) { const u = i / 10, a = u * Math.PI / 2; bands.push([Math.cos(a) * 8.6 + 0.01, Math.sin(a) * 9.5, i % 2 ? '#7a3a2a' : '#8a4630']); }
    m.shine(1); m.lathe(bands, { seg: 18 });
    m.color('#c8743a').shine(3); for (const [r, y] of [[8.75, 0.6], [8.1, 3.4], [6.2, 6.6]]) m.torus(0, y, 0, r, 0.22, { seg: 22, tseg: 5 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; m.limb(Math.sin(a) * 8.7, 0, Math.cos(a) * 8.7, Math.sin(a) * 5.8, 7, Math.cos(a) * 5.8, 0.14, 0.12, { seg: 5 }); }
    // the mouth: an arched opening full of fire, facing +z
    m.color('#3a1a14').shine(0); m.push(); m.tf(0, 0, 8.2); m.roundBox(0, 2.1, 0, 5.4, 4.4, 1.6, 1.0); m.pop();
    m.color('#ffb040', 1); m.push(); m.tf(0, 0, 8.9); m.roundBox(0, 1.9, 0, 4.2, 3.4, 0.4, 0.9); m.pop();
    m.color('#ff5a1a', 1); m.push(); m.tf(0, 0, 9.0); m.roundBox(0, 1.4, 0, 3.0, 2.0, 0.4, 0.6); m.pop(); m.emissive(0);
    // the chimney stack (behind the dome), copper collars, a glowing cap
    m.color('#5a3428').shine(1); m.lathe([[2.4, 6], [2.0, 14], [1.7, 25], [2.1, 25.4], [2.1, 26.2], [1.5, 26.2]], { seg: 12 });
    m.color('#c8743a').shine(3); for (const y of [12, 18, 24]) m.torus(0, y, 0, y > 20 ? 1.85 : 2.05, 0.16, { seg: 14, tseg: 4 });
    m.color('#ff8a2a', 1); m.torus(0, 26.2, 0, 1.6, 0.14, { seg: 14, tseg: 4 }); m.emissive(0).shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 9.2, y0: 0, y1: 10 }] };
  }, { hi: true });
  api.glow(0, 2.2, 9.4, 7, '#ff9a3a'); api.glow(0, 26.4, 0, 3, '#ff8a2a'); api.light(0, 12, 26, '#ff7a2a', 1.0); api.light(0, 0, 18, '#ff9a3a', 0.6);
  E.art.push({ x: 0, z: 0, r: 9.4 });
  // ---- giant anvils with a hammer leaning on each ----
  const anvil = (x, z, yaw) => {
    CartScene.mesh(api, x, z, yaw, m => {
      m.color('#3a3a44').shine(3);
      m.roundBox(0, 0.7, 0, 4.2, 1.4, 3.0, 0.3); m.roundBox(0, 2.0, 0, 2.4, 1.4, 1.8, 0.25);
      m.roundBox(0, 3.3, 0, 6.0, 1.3, 2.4, 0.3);
      m.push(); m.tf(0, 3.3, 3.0, 0, Math.PI / 2, 0); m.lathe([[1.0, 0], [0.7, 1.6], [0.25, 3.0], [0, 3.4]], { seg: 10, sx: 1.0, sz: 0.62 }); m.pop();   // the horn
      m.color('#a8a8b4').shine(3); m.roundBox(0, 3.98, -0.4, 5.8, 0.06, 2.2, 0.03);
      m.color('#ff8a3a', 0.9); m.roundBox(0, 4.12, 0.2, 1.4, 0.24, 0.5, 0.1); m.emissive(0);   // a glowing bar on the face
      // the hammer: a handle and a head, leaning
      m.color('#7a4a2a').shine(1); m.limb(2.6, 0, -2.6, 1.2, 4.6, -1.0, 0.2, 0.17, { seg: 6 });
      m.color('#4a4a54').shine(3); m.push(); m.tf(1.2, 4.9, -1.0, 0.6, 0.3, 0.2); m.roundBox(0, 0, 0, 2.0, 1.0, 1.0, 0.2); m.pop(); m.shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0.3, hx: 3.0, hz: 2.6, y0: 0, y1: 4 }] };
    }, { hi: true });
    api.glow(x, 4.3, z, 2.2, '#ff8a3a'); api.light(x, z, 11, '#ff9a4a', 0.45); E.art.push({ x, z, r: 3.6 });
  };
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.52, r = 52; anvil(Math.sin(a) * r, Math.cos(a) * r, a + Math.PI / 2); }
  // ---- bellows: two leather lungs between wooden boards ----
  for (const [x, z, yaw] of [[-24, -16, 2.2], [26, -12, -2.1]]) {
    CartScene.mesh(api, x, z, yaw, m => {
      m.color('#6a4a32').shine(0); for (const y of [0.4, 2.6]) m.roundBox(0, y, 0, 2.6, 0.24, 4.2, 0.1, { uv: BURNS_ATLAS.pattern('wood') });
      m.color('#8a5a3a').shine(1); m.ellipsoid(0, 1.5, 0.1, 1.25, 0.95, 1.9, { seg: 12, rings: 7 }); m.color('#5a3a26'); for (const y of [1.0, 2.0]) m.torus(0, y, 0.1, 1.15, 0.06, { seg: 12, tseg: 3 });
      m.color('#c8743a').shine(3); m.lathe([[0.3, 0], [0.18, 1.5], [0.08, 2.0]], { seg: 8 }); m.shine(0);
      m.color('#c8743a').shine(3); m.push(); m.tf(0, 1.5, 2.1, 0, Math.PI / 2, 0); m.lathe([[0.32, 0], [0.18, 1.4], [0.1, 2.0]], { seg: 8 }); m.pop(); m.shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.3, hz: 2.2, y0: 0, y1: 2.8 }] };
    }, { hi: true });
    E.art.push({ x, z, r: 2.4 });
  }
  // ---- copper steam pipes arching overhead (drive under), riveted collars, leaking joints ----
  F.leaks = [];
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU + 1.57, x = Math.sin(a) * 64, z = Math.cos(a) * 64, S = 9;
    CartScene.mesh(api, x, z, a, m => {
      m.color('#c8743a').shine(3);
      m.surf(18, 8, (u, v, out) => { const t = Math.PI * u, r = S + Math.cos(v * TAU) * 0.55; out[0] = Math.cos(t) * r; out[1] = Math.sin(t) * r * 1.1 + 0.2; out[2] = Math.sin(v * TAU) * 0.55; }, { wrapV: true, out: [0, 3, 0] });
      m.color('#e8a060'); for (let j = 0; j <= 6; j++) { const t = Math.PI * j / 6; m.push(); m.tf(Math.cos(t) * S, Math.sin(t) * S * 1.1 + 0.2, 0, 0, 0, t - Math.PI / 2); m.torus(0, 0, 0, 0.7, 0.14, { seg: 10, tseg: 4 }); m.pop(); }
      m.color('#3a2a24'); for (const s of [1, -1]) m.roundCyl(s * S, 0, 0, 1.2, 0.6, 0.15, { seg: 10 });
      m.color('#ff8a2a', 0.9); for (const s of [1, -1]) { m.push(); m.tf(s * Math.cos(Math.PI / 3) * S, Math.sin(Math.PI / 3) * S * 1.1 + 0.2, 0); m.ball(0, 0, 0, 0.3, { seg: 6, rings: 4 }); m.pop(); } m.emissive(0).shine(0);
      return { cols: [{ t: 'cyl', x: S, z: 0, r: 0.9, y0: 0, y1: 4 }, { t: 'cyl', x: -S, z: 0, r: 0.9, y0: 0, y1: 4 }] };
    }, { hi: true, noAO: true });
    for (const s of [1, -1]) { const lx = Math.cos(a) * S * s, lz = -Math.sin(a) * S * s; E.art.push({ x: x + lx, z: z + lz, r: 1.2 }); }
    F.leaks.push({ x: x + Math.cos(a) * Math.cos(Math.PI / 3) * S, z: z - Math.sin(a) * Math.cos(Math.PI / 3) * S, y: Math.sin(Math.PI / 3) * S * 1.1 + 0.2 });
    api.light(x, z, 14, '#ff9a4a', 0.4);
  }
  // ---- steam vents: iron grates in the floor (their eruptions are the game's) ----
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + 0.26, r = i % 2 ? 72 : 28, x = Math.sin(a) * r, z = Math.cos(a) * r;
    CartScene.mesh(api, x, z, a, m => {
      m.color('#2a2224').shine(2); m.roundCyl(0, 0, 0, 2.6, 0.18, 0.08, { seg: 16 });
      m.color('#4a4048'); for (let j = -3; j <= 3; j++) m.roundBox(j * 0.65, 0.2, 0, 0.18, 0.1, Math.sqrt(Math.max(0.1, 2.3 * 2.3 - (j * 0.65) * (j * 0.65))) * 2, 0.04);
      m.color('#d8d8e8', 0.35); m.torus(0, 0.2, 0, 2.55, 0.08, { seg: 16, tseg: 3 }); m.emissive(0).shine(0);
    }, { noAO: true });
    F.vents.push({ x, z });
  }
  // ---- the sixteen braziers: two rings, the outer one staggered ----
  api.instanceProto('frg_brazier', m => FRG_brazierMesh(m), { r: 2, near: 50, mid: 160, lo: true });
  for (let i = 0; i < 16; i++) {
    const inner = i < 7, j = inner ? i : i - 7, n = inner ? 7 : 9, a = j / n * TAU + (inner ? 0.45 : 0.1), r = inner ? 38 : 80, x = Math.sin(a) * r, z = Math.cos(a) * r;
    api.instance('frg_brazier', x, z, { yaw: a }); api.light(x, z, 11, '#ff9a4a', 0.55);
    F.braz.push({ x, z });
  }
  // ---- the railing: copper pipe on posts, ember lamps ----
  const poly = [], NW = 30; for (let i = 0; i < NW; i++) { const a = i / NW * TAU; poly.push([Math.sin(a) * R, Math.cos(a) * R]); }
  E.walls = poly;
  for (let i = 0; i < NW; i++) {
    const a0 = poly[i], b0 = poly[(i + 1) % NW], seg = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]), x = (a0[0] + b0[0]) / 2, z = (a0[1] + b0[1]) / 2, yaw = Math.atan2(b0[0] - a0[0], b0[1] - a0[1]);
    CartScene.mesh(api, x, z, yaw, m => {
      m.color('#3a2e2a').shine(2); m.limb(0, 0, -seg / 2, 0, 1.9, -seg / 2, 0.14, 0.12, { seg: 6 });
      m.color('#c8743a').shine(3); m.limb(0, 1.6, -seg / 2, 0, 1.6, seg / 2, 0.13, 0.13, { seg: 6 }); m.limb(0, 0.8, -seg / 2, 0, 0.8, seg / 2, 0.08, 0.08, { seg: 5 });
      m.color('#ff8a2a', 1); m.ball(0, 2.05, -seg / 2, 0.2, { seg: 6, rings: 4 }); m.emissive(0).shine(0);
    }, { noAO: true });
    api.glow(a0[0], 2.05, a0[1], 1.2, '#ff8a2a'); if (i % 3 === 0) api.light(a0[0] * 0.95, a0[1] * 0.95, 14, '#ff8a3a', 0.45);
  }
  // signs, the crowd beyond the railing, a hero or two
  const signs = ['CAUTION\nHOT METAL', 'STRIKE WHILE\nTHE IRON\'S HOT', 'NO OPEN FLAMES\n(KIDDING)', 'FORGE AHEAD'];
  signs.forEach((t, i) => { const a = i / 4 * TAU + 0.8, x = Math.sin(a) * 92, z = Math.cos(a) * 92, c = ['#ffd84a', '#ff8a3a', '#ff5a5a', '#ffb070'][i]; api.sign(t, x, z, { yaw: a + Math.PI, h: 1.0, y: 1.8, post: true, maxW: 3.2, style: { bg: '#1a1010', fg: c, border: '#ffd8a0' }, glow: c }); });
  for (const a of [0.3, 2.4, 4.4]) { const x = Math.sin(a) * 114, z = Math.cos(a) * 114; E.spots.push(...CartScene.bleachers(api, x, z, a + Math.PI, 22, 3, rng)); api.light(x * 0.9, z * 0.9, 16, '#ff9a4a', 0.4); }
  let ni = 2; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 1.3; CartScene.camp(api, Math.sin(a) * 124, Math.cos(a) * 124, a + Math.PI, rng, true, ni++); }
  E.heroes.push({ type: 'firespinner', x: 10, z: 16, yaw: 0.4, anim: 'firespin' }, { type: 'lamplighter', x: -14, z: 14, yaw: -0.6, anim: 'lantern' }, { type: 'badideaguy', x: 32, z: 40, yaw: 2.5, anim: 'dare' }, { type: 'playaartist', x: -40, z: -30, yaw: 0.8, anim: 'cheer' });
  // ---- objective spots ----
  E.zones = [{ x: 0, z: 16, r: 9, name: 'THE FURNACE MOUTH' }, { x: Math.sin(0.52) * 52, z: Math.cos(0.52) * 52, r: 9, name: 'THE ANVIL' }];
  for (let i = 0; i < 44; i++) { const a = rng() * TAU, r = 16 + Math.sqrt(rng()) * 74; E.orbSpots.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.flagSpots = [{ x: 0, z: 30 }, { x: -40, z: -20 }, { x: 40, z: 10 }];
  E.captures = [{ x: -60, z: -40, r: 9 }, { x: 60, z: -40, r: 9 }, { x: 0, z: 76, r: 9 }];
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.05, r = i % 2 ? 26 : 62; E.gifts.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; E.spawn.push({ x: Math.sin(a) * 58, z: Math.cos(a) * 58, yaw: a + Math.PI }); }
  return this.finish(E);
};

/* ---------------- LIGHT THE FORGE: helpers ---------------- */
function FRG_light(s, k, b) {
  const C = FRG_C, prev = b.owner, pts = prev ? C.PTS_STEAL : C.PTS_LIGHT;
  b.owner = k; b.cool = C.COOL; b.flare = 1; k.score += pts;
  s.fx.burst(b.x, 2.8, b.z, 'flame', 14, k.car.col); s.fx.ring(b.x, 0.3, b.z, C.LIGHT_R, k.car.col, 0.5);
  s.log('kindle', { k: k.id, from: prev && prev.id, n: k.score });
  if (k.player) { s.banner(prev ? 'STOLEN! +' + pts : 'LIT! +' + pts, prev ? '#7aff8a' : '#ffd84a', 0.8, null, true); Sound.play('flame', { vol: 0.7, pitch: prev ? 1.25 : 1.05 }); }
  else if (prev && prev.player) { s.banner(k.car.name + ' STOLE YOUR FIRE', '#ff6a6a', 1.0, null, true); Sound.play('powerdown', { vol: 0.35, pitch: 1.5 }); }
  else Sound.play('flame', { vol: 0.12, pitch: 1.3 });
}
// the brazier worth driving to: dark ones and rivals' ones (rivals' are worth more), not the ones a vent is about to blow out
function FRG_pick(s, k, rnd) {
  const G = s.frg; let best = null, bs = 0;
  for (const b of G.braz) {
    if (b.owner === k) continue;
    const d = Math.hypot(b.x - k.x, b.z - k.z);
    if (b.cool > d / 22 + 0.2) continue;
    let doomed = false; for (const v of G.vents) if (v.state !== 'idle' && Math.hypot(v.x - b.x, v.z - b.z) < FRG_C.DOUSE_R) { doomed = true; break; }
    if (doomed) continue;
    const sc = (b.owner ? 2.2 : 1.6) / (d + 12) * (rnd ? 1 + ((k.slot * 0.29 + b.x * 0.013) % 0.35) : 1);
    if (sc > bs) { bs = sc; best = b; }
  }
  return best;
}

CART_OBJECTIVES.kindle = {
  name: 'LIGHT THE FORGE', short: 'Hold the most fires',
  desc: 'Drive past copper braziers to light them in your colour, or steal rivals\' fires. The bellows pay for every fire you hold; steam blows fires out. First to 60.',
  time: 110, goal: 60, unit: ' pts',
  fx: {
    init(s) {
      const F = s.E.frg, spots = F ? F.braz : s.E.orbSpots.slice(0, 16);
      const G = s.frg = s.frg || { t: 0 };
      G.braz = spots.map((p, i) => ({ x: p.x, z: p.z, owner: null, cool: 0, flare: 0, ph: i * 1.7 }));
      G.vents = (F ? F.vents : []).map(v => ({ x: v.x, z: v.z, state: 'idle', t: 0 }));
      G.ventT = 6; G.bellowsT = FRG_C.BELLOWS; G.pump = 0;
      for (const k of s.karts) { const c = burnsRGBf(k.car.col); k.frg = { snuffT: 0, rgb: c, fl: [0.6 + c[0] * 0.4, 0.35 + c[1] * 0.5, 0.15 + c[2] * 0.6] }; k.score = 0; }
    },
    update(s, dt) {
      const C = FRG_C, G = s.frg, K = s.karts;
      for (const k of K) if (k.frg.snuffT > 0) { k.frg.snuffT -= dt; if (k.frg.snuffT <= 0 && k.player) { s.banner('TORCH RELIT', '#ffd84a', 0.8, null, true); Sound.play('flame', { vol: 0.5, pitch: 1.4 }); } }
      // lighting: a lit torch passing close by
      for (const b of G.braz) {
        if (b.cool > 0) b.cool -= dt; if (b.flare > 0) b.flare -= dt * 1.5;
        if (b.cool > 0) continue;
        for (const k of K) {
          if (k.out || k.frg.snuffT > 0 || b.owner === k) continue;
          const dx = k.x - b.x, dz = k.z - b.z; if (dx * dx + dz * dz > C.LIGHT_R * C.LIGHT_R || k.y > 4) continue;
          FRG_light(s, k, b); break;
        }
      }
      // the bellows: every fire pays its owner
      G.bellowsT -= dt; if (G.pump > 0) G.pump -= dt;
      if (G.bellowsT <= 0) {
        G.bellowsT += C.BELLOWS; G.pump = 0.6; let mine = 0;
        for (const b of G.braz) if (b.owner && !b.owner.out) { b.owner.score += 1; b.flare = 1; if (b.owner.player) mine++; }
        s.log('bellows', {});
        if (mine) { s.banner('BELLOWS +' + mine, '#ffb050', 0.8, null, true); Sound.play('flame', { vol: 0.45, pitch: 0.7 }); }
      }
      // steam vents: a warning hiss, then a blast that blows out nearby fires and spins cars standing on it
      G.ventT -= dt;
      if (G.ventT <= 0 && G.vents.length) {
        G.ventT = C.VENT_EVERY * (0.8 + s.rng() * 0.4);
        let v = null; for (let tries = 0; tries < 6 && !v; tries++) { const c = G.vents[(s.rng() * G.vents.length) | 0]; if (c.state === 'idle') v = c; }
        if (v) { v.state = 'warn'; v.t = C.WARN; const p = s.player; if (p && Math.hypot(p.x - v.x, p.z - v.z) < 40) { s.banner('STEAM VENT!', '#e8f0ff', 1.0, 'it will blow out the fires near it', true); Sound.play('cartGeyser', { vol: 0.35, pitch: 1.4 }); } }
      }
      for (const v of G.vents) {
        if (v.state === 'idle') continue;
        v.t -= dt;
        if (v.state === 'warn' && v.t <= 0) {
          v.state = 'blast'; v.t = C.BLAST;
          let n = 0; for (const b of G.braz) if (b.owner && Math.hypot(b.x - v.x, b.z - v.z) < C.DOUSE_R) { if (b.owner.player) n++; b.owner = null; b.cool = 0.6; s.fx.smoke(b.x, 2.6, b.z, 6, '#e8e8f0'); }
          for (const k of K) { if (k.out) continue; const dx = k.x - v.x, dz = k.z - v.z, d = Math.hypot(dx, dz); if (d < C.KNOCK_R && s.hit(k, 'knock', null, { dx: dx / (d || 1), dz: dz / (d || 1), power: 10, dur: 0.9, item: 'steam' }) && k.player) s.banner('STEAMED!', '#e8f0ff', 1.0); }
          const p = s.player, near = p && Math.hypot(p.x - v.x, p.z - v.z) < 60;
          Sound.play('cartGeyser', { vol: near ? 0.8 : 0.25 }); if (near) s.shakeIt(0.3);
          if (n) s.banner('STEAM BLEW OUT ' + n + ' OF YOUR FIRES', '#ff9ad8', 1.2);
          s.log('steam', { x: v.x, z: v.z });
        } else if (v.state === 'blast' && v.t <= 0) v.state = 'idle';
      }
      let best = 0; for (const k of K) if (k.score > best) best = k.score;
      return best >= CART_OBJECTIVES.kindle.goal;
    },
    rank(s) { const held = k => s.frg ? s.frg.braz.reduce((n, b) => n + (b.owner === k), 0) : 0; return s.karts.slice().sort((a, b) => (b.score - a.score) || (held(b) - held(a)) || (b.hitsDealt - a.hitsDealt)); },
    score(k) { return k.score | 0; }
  }
};

/* ---------------- the arena's rules ---------------- */
CART_ARENA_RULES.forge = {
  music: 'kart3',
  onHit(s, k, kind, src, o) {
    if (s.objective !== 'kindle' || !k.frg || (s.obj && s.obj.ended)) return;
    const was = k.frg.snuffT > 0; k.frg.snuffT = FRG_C.SNUFF;
    if (!was) { s.fx.smoke(k.x, k.y + (k.M ? k.M.h : 3) + 0.6, k.z, 6, '#6a6a7a'); if (k.player) { s.banner('TORCH SNUFFED!', '#ff9a6a', 1.1, 'it relights in ' + FRG_C.SNUFF + ' s'); Sound.play('powerdown', { vol: 0.5, pitch: 1.2 }); } }
  },
  aiGoal(s, k, nearestRival) {
    if (s.objective !== 'kindle' || !s.frg) return null;
    const G = s.frg;
    // keep off a vent that is about to blow
    for (const v of G.vents) if (v.state !== 'idle' && Math.hypot(v.x - k.x, v.z - k.z) < FRG_C.KNOCK_R + 4) { const dx = k.x - v.x, dz = k.z - v.z, d = Math.hypot(dx, dz) || 1; return { goal: [k.x + dx / d * 16, k.z + dz / d * 16] }; }
    // a snuffed torch: bump the nearest rival while it relights (if one is close), else head on anyway
    if (k.frg.snuffT > 1.2) { const r = nearestRival(); if (r && Math.hypot(r.x - k.x, r.z - k.z) < 20) return { prey: r }; }
    const b = FRG_pick(s, k, true); if (!b) { const r = nearestRival(); return r ? { prey: r } : null; }
    // pass beside the brazier (it has a collider), on the side the car is already on
    const dx = b.x - k.x, dz = b.z - k.z, d = Math.hypot(dx, dz) || 1, side = ((k.slot & 1) ? 1 : -1) * 2.3;
    if (d < 9) return { goal: [b.x - dz / d * side + dx / d * 4, b.z + dx / d * side + dz / d * 4] };
    return { goal: [b.x - dz / d * side, b.z + dx / d * side] };
  },
  hud(s, ctx, W, H, top, left) {
    const G = s.frg, k = s.player; if (!G || !k || !k.frg || s.state !== 'race') return;
    // portrait: under the scoreboard and below the banners; landscape: one row in the band between the timer and the banners
    const portrait = H > W, y = portrait ? top + 196 : top + 60, n = G.braz.length;
    let mine = 0; for (const b of G.braz) if (b.owner === k) mine++;
    const sn = k.frg.snuffT > 0, msg = sn ? 'TORCH OUT · ' + k.frg.snuffT.toFixed(1) + 's' : !portrait && s.raceT < 6 ? 'DRIVE PAST THE BRAZIERS TO LIGHT THEM' : 'YOUR FIRES ' + mine + ' · BELLOWS IN ' + Math.ceil(G.bellowsT) + 's';
    ctx.font = `600 12px ${FONT_UI}`; const tw = portrait ? 0 : ctx.measureText(msg).width;
    // the forge row: one flame per brazier, in its owner's colour
    const w = Math.min(14, (W - 40) / n), x0 = portrait ? W / 2 - (n - 1) * w / 2 : W / 2 - ((n - 1) * w + 16 + tw) / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(10,4,20,0.5)'; burnsRR(ctx, x0 - w, y - 9, n * w + w, 18, 9); ctx.fill();
    for (let i = 0; i < n; i++) {
      const b = G.braz[i], x = x0 + i * w;
      ctx.fillStyle = b.owner ? b.owner.car.col : 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.moveTo(x, y - 6 - (b.flare > 0 ? 2 : 0)); ctx.quadraticCurveTo(x + w * 0.38, y + 1, x, y + 5); ctx.quadraticCurveTo(x - w * 0.38, y + 1, x, y - 6 - (b.flare > 0 ? 2 : 0)); ctx.fill();
      if (b.owner === k) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 1.5; ctx.stroke(); }
    }
    ctx.restore();
    BurnsUI.text(ctx, msg, portrait ? W / 2 : x0 + (n - 1) * w + 16, portrait ? y + 20 : y, 12, sn ? (Math.floor(s.time * 6) % 2 ? '#ff6a6a' : '#ffffff') : G.pump > 0 ? '#ffd84a' : '#ffd8a0', { ui: true, align: portrait ? 'center' : 'left' });
    if (portrait && s.raceT < 6) BurnsUI.text(ctx, 'DRIVE PAST THE BRAZIERS TO LIGHT THEM', W / 2, y + 38, 12, '#ffb050', { glow: '#a04010' });
    // the arrow to the best brazier
    const b = FRG_pick(s, k, false);
    if (b) { const p = FRG_P.proj; if (s.R.project(b.x, 5.5, b.z, W, H, p)) { const ax = clamp(p.x, 30, W - 30), ay = clamp(p.y, 70, H - 120); ctx.save(); ctx.translate(ax, ay); ctx.fillStyle = b.owner ? b.owner.car.col : '#ffd84a'; ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-9, -6); ctx.lineTo(9, -6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); } }
  },
  draw(s, R, S, t) {
    const E = s.E, F = E.frg, cam = s.cam, fx = s.fx;
    // the furnace roars, the chimney smokes, the pipes leak steam
    R.bbs.bb(0, 2.2, 9.6, 8 + Math.sin(t * 7) * 0.6, 6, S.glow, FRG_ORANGE, 0.55, true);
    if (Math.random() < 0.7) fx.fire((Math.random() - 0.5) * 3.4, 0.6, 9.2, 1.4);
    if (Math.random() < 0.35) fx.add(F.chim.x + (Math.random() - 0.5) * 1.5, F.chim.y + 0.5, F.chim.z + (Math.random() - 0.5) * 1.5, 0.8 + Math.random() * 0.4, 2.2 + Math.random(), 0.3, 6, 1.6, 6, [0.2, 0.16, 0.16], 0.45, 'smoke', 4, Math.random() * 6, 0.2);
    if (Math.random() < 0.3) fx.add(F.chim.x, F.chim.y + 0.3, F.chim.z, (Math.random() - 0.5), 4 + Math.random() * 2, (Math.random() - 0.5), 1.4, 0.12, 0.04, [1, 0.6, 0.2], 1, 'dot', 1 | 32);
    for (const L of F.leaks) if (Math.random() < 0.25) fx.add(L.x, L.y, L.z, (Math.random() - 0.5) * 1.5, 1.2 + Math.random(), (Math.random() - 0.5) * 1.5, 1.4, 0.4, 2.4, [0.9, 0.9, 0.95], 0.35, 'puff', 4, Math.random() * 6, 0.4);
    // embers in the air
    if (Math.random() < 0.5) { const a = Math.random() * TAU, d = 5 + Math.random() * 30; fx.add(cam.tx + Math.cos(a) * d, cam.ty - 1 + Math.random() * 6, cam.tz + Math.sin(a) * d, (Math.random() - 0.5) * 1.2, 0.6 + Math.random() * 0.8, (Math.random() - 0.5) * 1.2, 2.5 + Math.random() * 2, 0.15, 0.05, [1, 0.55 + Math.random() * 0.25, 0.2], 0.9, 'dot', 1 | 32); }
    const G = s.frg;
    if (!G) { for (const b of F.braz) { R.bbs.bb(b.x, 2.6, b.z, 2.6, 2.6, S.glow, FRG_ORANGE, 0.5, true); if (Math.random() < 0.3) fx.fire(b.x, 2.1, b.z, 0.9); } return; }
    // braziers: owned ones burn in the owner's colour, dark ones smoulder
    for (const b of G.braz) {
      const dx = b.x - cam.x, dz = b.z - cam.z, d2 = dx * dx + dz * dz; if (d2 > 150 * 150) continue;
      const o = b.owner;
      if (o) {
        const c = o.frg.fl, f = 1 + Math.max(0, b.flare) * 0.6, fl = Math.sin(t * 11 + b.ph) * 0.25;
        R.bbs.bb(b.x, 3.4 + fl * 0.3, b.z, 2.6 * f, 3.6 * f + fl, S.flame, c, 0.95, true);
        R.bbs.bb(b.x, 3.0, b.z, 1.6 * f, 2.2 * f, S.flame, [1, 0.9, 0.6], 0.8, true);
        R.bbs.bb(b.x, 3.0, b.z, 7 * f, 7 * f, S.glow, o.frg.rgb, 0.45, true);
        R.flat.flat(b.x, 0.1, b.z, FRG_C.LIGHT_R * 2, FRG_C.LIGHT_R * 2, t * 0.6 + b.ph, S.ring, o.frg.rgb, 0.55, true);
        if (d2 < 70 * 70 && Math.random() < 0.6) fx.add(b.x + (Math.random() - 0.5) * 1.2, 2.5, b.z + (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.6, 2.5 + Math.random() * 2, (Math.random() - 0.5) * 0.6, 0.5 + Math.random() * 0.3, 1.2, 0.3, c, 1, 'flame', 1, (Math.random() - 0.5) * 0.6, 0);
      } else {
        R.bbs.bb(b.x, 2.4, b.z, 3.4, 2.2, S.glow, FRG_ORANGE, 0.55 + 0.15 * Math.sin(t * 3 + b.ph), true); R.bbs.streak(b.x, 6.5, b.z, 0, 1, 0, 8, 0.7, S.streak, [1, 0.8, 0.5], 0.25);
        R.flat.flat(b.x, 0.1, b.z, FRG_C.LIGHT_R * 2, FRG_C.LIGHT_R * 2, 0, S.ring, [1, 0.85, 0.6], 0.35, true);
        if (d2 < 60 * 60 && Math.random() < 0.06) fx.add(b.x, 2.4, b.z, 0, 1.2, 0, 1.6, 0.4, 1.6, [0.35, 0.32, 0.32], 0.35, 'smoke', 4);
      }
    }
    // vents: a hissing warning ring, then a column of steam
    for (const v of G.vents) {
      if (v.state === 'warn') {
        const u = 1 - v.t / FRG_C.WARN, a = 0.5 + 0.5 * Math.sin(t * (10 + u * 14));
        R.flat.flat(v.x, 0.15, v.z, FRG_C.DOUSE_R * 2, FRG_C.DOUSE_R * 2, -t, S.ring, [1, 1, 1], 0.25 + 0.35 * a, true);
        R.flat.flat(v.x, 0.16, v.z, FRG_C.KNOCK_R * 2 * u, FRG_C.KNOCK_R * 2 * u, t * 2, S.warn, [1, 0.5, 0.4], 0.8, true);
        if (Math.random() < 0.6) fx.add(v.x + (Math.random() - 0.5) * 3, 0.4, v.z + (Math.random() - 0.5) * 3, (Math.random() - 0.5), 2 + u * 4, (Math.random() - 0.5), 0.9, 0.6, 2.4, [0.95, 0.95, 1], 0.4, 'puff', 4, Math.random() * 6, 0.5);
      } else if (v.state === 'blast') {
        const a = Math.min(1, v.t / 0.4);
        R.bbs.streak(v.x, 9, v.z, 0, 1, 0, 18, 6, S.streak, [0.95, 0.97, 1], 0.55 * a);
        for (let i = 0; i < 3; i++) fx.add(v.x + (Math.random() - 0.5) * 2.5, 0.5, v.z + (Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 3, 12 + Math.random() * 8, (Math.random() - 0.5) * 3, 1.4, 1.6, 5.5, [0.95, 0.95, 1], 0.55, 'puff', 4, Math.random() * 6, 0.6);
        R.flat.flat(v.x, 0.15, v.z, FRG_C.DOUSE_R * 2.2, FRG_C.DOUSE_R * 2.2, 0, S.glow, [0.9, 0.95, 1], 0.3 * a, true);
      }
    }
    // every car's torch: a flame in its colour over the roof, or a wisp of smoke while it's snuffed
    for (const q of s.karts) {
      if (!q._in || q.out || !q.frg) continue;
      const h = q.y + (q.M ? q.M.h : 3) + 0.9;
      if (q.frg.snuffT > 0) { if (Math.random() < 0.3) fx.add(q.x, h, q.z, 0, 1.2, 0, 1.0, 0.3, 1.2, [0.4, 0.4, 0.45], 0.4, 'smoke', 4); }
      else { R.bbs.bb(q.x, h + 0.4, q.z, 1.3, 1.9 + Math.sin(t * 13 + q.slot) * 0.2, S.flame, q.frg.fl, 0.95, true); R.bbs.bb(q.x, h + 0.3, q.z, 3, 3, S.glow, q.frg.rgb, 0.4, true); }
    }
  },
  lights(s, add) {
    add(0, 3, 10, 22, FRG_ORANGE, 1.2, 1.5);
    const G = s.frg; if (!G) return;
    let n = 0; for (const b of G.braz) { if (!b.owner) continue; add(b.x, 3.2, b.z, 10, b.owner.frg.rgb, 0.9 + Math.max(0, b.flare) * 0.6, 1.2); if (++n >= 10) break; }
    for (const v of G.vents) if (v.state === 'blast') add(v.x, 4, v.z, 14, [0.85, 0.9, 1], 0.8, 1.2);
  }
};

/* ---------------- registration ---------------- */
CART_ARENAS.push({
  id: 'forge', name: 'THE COPPER FORGE', sub: 'A foundry yard: copper braziers, anvils, steam vents round a roaring furnace', objectives: ['kindle', 'vibe', 'glow'],
  col: '#ff8a3a', tod: 'night',
  blurb: 'A night foundry around a roaring domed furnace. Sixteen copper braziers wait for a torch, the floor vents steam, and the anvils don\'t move for anyone.'
});
var CART_SECRET_LEVELS = (typeof CART_SECRET_LEVELS !== 'undefined' && CART_SECRET_LEVELS) || {};
CART_SECRET_LEVELS.octo = { arena: 'forge', game: 'kindle' };
// the menu card icon: a brazier with a flame
CART_ARENA_ICONS.forge = (ctx, s, t, col) => {
  ctx.beginPath(); ctx.moveTo(-s * 0.62, -s * 0.05); ctx.quadraticCurveTo(0, s * 0.62, s * 0.62, -s * 0.05); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineWidth = Math.max(1.5, s * 0.08); for (const dx of [-0.35, 0, 0.35]) { ctx.beginPath(); ctx.moveTo(dx * s * 0.6, s * 0.25); ctx.lineTo(dx * s * 1.4, s * 0.85); ctx.stroke(); }
  for (let i = 0; i < 3; i++) { const fx = (i - 1) * s * 0.28, h = s * (0.5 + 0.25 * Math.abs(Math.sin(t * 5 + i * 1.9))); ctx.fillStyle = i === 1 ? '#ffd84a' : '#ff6a1a'; ctx.beginPath(); ctx.moveTo(fx - s * 0.18, -s * 0.05); ctx.quadraticCurveTo(fx - s * 0.12, -s * 0.05 - h * 0.6, fx, -s * 0.05 - h); ctx.quadraticCurveTo(fx + s * 0.12, -s * 0.05 - h * 0.6, fx + s * 0.18, -s * 0.05); ctx.fill(); }
};
