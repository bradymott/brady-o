/* ============================================================
   ART CART — the royale final: THE MAN (arena id 'man')
   The playa under the Man at night: fire cauldrons ring his plinth, lattice towers and crate stacks give cover,
   fire pits and ember vents burn, fireworks go up beyond the fence.
   PHASE 1: a normal Battle Royale that the player must WIN outright (be the last car running).
   PHASE 2: the Man comes alive (he is drawn by the shared BurnsManModel; we only pose, light and burn him here).
     He has a health bar and three telegraphed attacks, and after each one he OVERHEATS: he kneels and his heart
     glows white — the WEAK POINT (double damage):
       · STOMP: he lifts a leg (1.3 s, a red ring at his feet), stomps, a shockwave rolls out: HOP over it, or be far
       · FIRE SWEEP: an arm points at the ground (1.2 s, the arc shows where it will sweep), a fire line sweeps round:
         HOP over it, or outrun it
       · EMBER RAIN: he throws his head back (1 s), embers fall on red targets around you (they grow before they hit)
     Every weapon, item and special hurts him (a stand-in target on his plinth's edge, facing you, joins the cars
     while weapons and items look for victims), rams hurt him, mines dropped at his feet go off, a WATER BOTTLE
     douses him, a DISCO SHIELD throws his next hit back at him.
   Defeat: he catches fire, burns and collapses backwards in fireworks: the Battle Royale is won (s.stageWon).
   Fail: the results say THE MAN WINS; RETRY starts straight at phase 2 (opts.phase = 2).
   Original design; PG-13 (a wooden effigy, cartoon fire). Registers itself (see 43_cart_i_royale.js).
   ============================================================ */
const CART_MAN = {
  R: 178, plinth: 12, scale: 2.2, y: 1.0, hp: 480, hitR: 13.0,
  fire: [1, 0.5, 0.15], ember: [1, 0.62, 0.25], red: [1, 0.22, 0.12], white: [1, 0.95, 0.85], gold: [1, 0.82, 0.3], black: [0, 0, 0],
  pits: [[0.5, 82], [2.1, 86], [3.7, 80], [5.3, 84]], vents: [[1.3, 58], [3.0, 120], [4.6, 62], [5.9, 125]]
};

/* ---------------- the world ---------------- */
CartWorlds.arena_man = function (A, night) {
  const C = CART_MAN, E = this.base(2102, [-230, -230, 230, 230], '#3a2c26', 0.18);
  const sky = Object.assign(CART_SKIES.night(), { sky: '#6a3a3a', hor: '#c8562a', fog: '#3a1e18', fogD: 0.0045, mid: '#5a2418', midK: 0.45, cityK: 1.0, emB: 1.8, keyK: 0.5, key: '#ffc890' });
  Object.assign(E, { id: 'man', arena: A, sky, tod: 'night', music: 'kart4', night: true, R: C.R, fireworks: true });
  const api = E.api, T = E.terrain, rng = mulberry32(2102), ang = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
  // ---- ground: dark burn scars, radial paths, the old burn rings, footprints ----
  api.paint((ctx, P, sc) => {
    for (let i = 0; i < 380; i++) { const x = (rng() - 0.5) * 450, z = (rng() - 0.5) * 450, q = P(x, z); ctx.fillStyle = `rgba(${rng() < 0.6 ? '40,26,22' : '170,120,90'},${0.05 + rng() * 0.09})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (2 + rng() * 9) * sc, (1 + rng() * 5) * sc, rng() * 3, 0, TAU); ctx.fill(); }
    const c0 = P(0, 0); for (const [r, a] of [[20, 0.35], [36, 0.18], [52, 0.12]]) { ctx.strokeStyle = `rgba(20,10,8,${a})`; ctx.lineWidth = 3 * sc; ctx.beginPath(); ctx.arc(c0[0], c0[1], r * sc, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(25,14,10,0.45)'; ctx.beginPath(); ctx.arc(c0[0], c0[1], 17 * sc, 0, TAU); ctx.fill();
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, p0 = P(...ang(a, 20)), p1 = P(...ang(a, C.R - 6)); ctx.strokeStyle = 'rgba(200,150,110,0.12)'; ctx.lineWidth = 7 * sc; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
    for (const [a, r] of C.pits) { const q = P(...ang(a, r)); const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 8 * sc); g.addColorStop(0, 'rgba(20,8,4,0.9)'); g.addColorStop(0.6, 'rgba(60,20,8,0.6)'); g.addColorStop(1, 'rgba(60,20,8,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], 8 * sc, 0, TAU); ctx.fill(); }
  });
  // ---- the Man's plinth: a low octagonal timber deck with a fire-glow ring (he stands on it, drawn by the scene) ----
  CartScene.mesh(api, 0, 0, Math.PI / 8, m => {
    const wd = BURNS_ATLAS.pattern('wood'), lights = [];
    m.color('#6a4a32').shine(1); m.lathe([[C.plinth + 0.6, 0], [C.plinth, C.y - 0.15], [C.plinth - 0.4, C.y], [0, C.y]], { seg: 8, uv: wd });
    m.color('#ff7a2a', 1); m.torus(0, C.y - 0.3, 0, C.plinth + 0.25, 0.1, { seg: 8, tseg: 4 }); m.emissive(0);
    // steps on four sides, timber posts with lanterns at the corners
    m.color('#5a3e2a').shine(1); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; m.push(); m.tf(Math.sin(a) * (C.plinth + 1.1), 0, Math.cos(a) * (C.plinth + 1.1), a); m.roundBox(0, 0.25, 0, 5, 0.5, 1.6, 0.08, { uv: wd }); m.pop(); }
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU, x = Math.sin(a) * (C.plinth - 0.3), z = Math.cos(a) * (C.plinth - 0.3); m.color('#4a3220').shine(1); m.limb(x, C.y, z, x, C.y + 2.6, z, 0.16, 0.13, { seg: 6, uv: wd }); m.color('#ffb050', 1); m.ball(x, C.y + 2.85, z, 0.32, { seg: 8, rings: 6 }); m.emissive(0); lights.push({ x, y: C.y + 2.85, z, s: 1.6, c: '#ffb050' }); }
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ff9a4a', pool: 30 });
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: C.plinth + 0.4, y0: 0, y1: C.y + 3 }], lights };
  }, { hi: true });
  E.man = { x: 0, z: 0, y: C.y, scale: C.scale };
  E.art.push({ x: 0, z: 0, r: C.plinth + 0.8 });
  api.light(0, 0, 34, '#ff8a3a', 0.7); api.light(0, 0, 60, '#ff4a2a', 0.25);
  // ---- fire cauldrons ring (r 30): iron bowls on tripods ----
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * TAU + 0.15, [x, z] = ang(a, 30);
    CartScene.mesh(api, x, z, a, m => { m.color('#2a2226').shine(2); for (let k = 0; k < 3; k++) { const b = k / 3 * TAU; m.limb(Math.sin(b) * 0.9, 0, Math.cos(b) * 0.9, 0, 1.6, 0, 0.07, 0.06, { seg: 5 }); } m.lathe([[0.2, 1.4], [1.0, 1.75], [1.15, 2.2], [1.05, 2.25]], { seg: 14 }); m.color('#ff8a2a', 1); m.ellipsoid(0, 2.15, 0, 0.95, 0.15, 0.95, { seg: 12, rings: 4 }); m.emissive(0).shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.0, y0: 0, y1: 2.3 }] }; }, { hi: true });
    api.fire(x, 2.2, z, 0.6, { hazard: false }); E.art.push({ x, z, r: 1.3 });
  }
  // ---- cover: lattice towers (instanced) and crate stacks ----
  api.instanceProto('man_tower', m => {
    const wd = BURNS_ATLAS.pattern('wood');
    m.color('#8a6440').shine(1); for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]]) m.limb(x, 0, z, x * 0.6, 8, z * 0.6, 0.16, 0.12, { seg: 6, uv: wd });
    m.color('#6a4a2e'); for (let k = 0; k < 4; k++) { const y = 1 + k * 1.9, r = lerp(1.6, 1.0, y / 8); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4, b = (i + 1) / 4 * TAU + Math.PI / 4, s2 = Math.SQRT2; m.limb(Math.sin(a) * r * s2, y, Math.cos(a) * r * s2, Math.sin(b) * r * s2, y + 1.9, Math.cos(b) * r * s2, 0.07, 0.07, { seg: 4 }); } }
    m.color('#5a3e26'); m.roundBox(0, 8.1, 0, 2.4, 0.3, 2.4, 0.06, { uv: wd });
    m.color('#ffffff', 1); m.ball(0, 8.8, 0, 0.55, { seg: 10, rings: 7 }); m.emissive(0).shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.8, hz: 1.8, y0: 0, y1: 8 }] };
  }, { r: 4, near: 40, mid: 130, farD: 360, lo: true, far: m => { m.color('#8a6440'); m.cyl(0, 0, 0, 1.6, 1.0, 8, 4, {}); m.color('#ffffff', 1); m.box(0, 8.8, 0, 0.8, 0.8, 0.8); m.emissive(0); } });
  for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU, [x, z] = ang(a, 100 + (i % 2) * 18); api.instance('man_tower', x, z, { y: 0, yaw: a, tint: cartTintOf(i % 2 ? '#ffb070' : '#ff8a4a') }); E.art.push({ x, z, r: 2.6 }); api.light(x, z, 12, '#ffa050', 0.5); api.glow(x, 8.8, z, 2.2, '#ffc070'); }
  const crates = (x, z, yaw) => { CartScene.mesh(api, x, z, yaw, m => { const wd = BURNS_ATLAS.pattern('wood'); m.color('#9a7048').shine(1); m.roundBox(-1.3, 0.9, 0, 2.4, 1.8, 2.2, 0.12, { uv: wd }); m.roundBox(1.3, 0.9, 0.2, 2.4, 1.8, 2.2, 0.12, { uv: wd }); m.color('#8a6038'); m.roundBox(0, 2.7, 0.1, 2.4, 1.8, 2.2, 0.12, { uv: wd }); m.color('#3a2a1e'); for (const sx of [-1.3, 1.3]) m.roundBox(sx, 0.9, sx > 0 ? 1.32 : 1.12, 2.0, 0.12, 0.04, 0.02); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.6, hz: 1.3, y0: 0, y1: 3.6 }] }; }); E.art.push({ x, z, r: 2.9 }); };
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.05, [x, z] = ang(a, 64); crates(x, z, a + Math.PI / 2); const [x2, z2] = ang(a + 0.3, 148); crates(x2, z2, a); }
  // ---- fire pits (hazard) and ember vents (erupt on a timer) ----
  for (const [a, r] of C.pits) { const [x, z] = ang(a, r); CartScene.mesh(api, x, z, 0, m => { m.color('#3a2a24').shine(1); for (let i = 0; i < 12; i++) { const b = i / 12 * TAU; m.ball(Math.sin(b) * 5.2, 0.2, Math.cos(b) * 5.2, 0.55, { seg: 7, rings: 5 }); } m.color('#ff5a1a', 0.9); m.ellipsoid(0, 0.02, 0, 4.6, 0.08, 4.6, { seg: 20, rings: 3 }); m.emissive(0).shine(0); }, { noAO: true, hi: true }); for (let k = 0; k < 4; k++) { const b = k / 4 * TAU; api.fire(x + Math.sin(b) * 2.4, 0.1, z + Math.cos(b) * 2.4, 0.7, { hazard: false }); } api.light(x, z, 14, '#ff6a2a', 0.7); }
  for (const [a, r] of C.vents) { const [x, z] = ang(a, r); CartScene.mesh(api, x, z, a, m => { m.color('#2a2220').shine(1); m.lathe([[2.2, 0], [1.6, 0.6], [0.9, 0.7], [0.8, 0.2]], { seg: 14 }); m.color('#ff7a2a', 0.8); m.disc(0, 0.25, 0, 0.85, 14); m.emissive(0).shine(0); }, { noAO: true, hi: true }); api.light(x, z, 8, '#ff7a2a', 0.5); }
  // ---- the fence, crowds, art cars parked outside, searchlights ----
  const poly = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; poly.push([Math.sin(a) * C.R, Math.cos(a) * C.R]); }
  E.walls = poly; CartDecor.protos(E);
  const warm = ['#ff7a2a', '#ffb02a', '#ff4a3a', '#ffd06a'];
  for (let i = 0; i < 48; i++) { const a = poly[i], b = poly[(i + 1) % 48], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 7), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]); for (let j = 0; j < n; j++) { const u = (j + 0.5) / n, x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u), c = warm[Math.floor((i * n + j) / 2) % 4]; CartDecor.put(E, 'rail', x, z, yaw, c, { y: 0, noLights: true }); if (j % 2 === 0) api.glow(x, 0.98, z, 0.9, c); } }
  for (const a of [0.3, 1.9, 3.5, 5.1]) { const [x, z] = ang(a, C.R + 13); E.spots.push(...CartScene.bleachers(api, x, z, a + Math.PI, 24, 4, rng)); }
  for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU + 0.2, [x, z] = ang(a, C.R + 26); CartDecor.put(E, ['totem', 'tree', 'helix', 'bloom'][i % 4], x, z, a + Math.PI, warm[i % 4], { scale: 1.2 }); }
  for (let i = 0; i < 6; i++) { const a = (i + 0.1) / 6 * TAU, [x, z] = ang(a, C.R + 46); CartScene.prop(api, rng.pick(['bus', 'rv', 'camper']), { x, z, yaw: a + Math.PI / 2, seed: i }); }
  E.beams = []; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4, [x, z] = ang(a, C.R + 60); E.beams.push({ kind: 'search', x, y: 1, z, c: [1, 0.75, 0.5], ph: i * 1.7, sp: 0.3 + i * 0.07, len: 170, w: 7, a: 0.2 }); }
  { const n = 40; for (let i = 0; i < n; i++) { const a = i / n * TAU + rng() * 0.05, r = 330 + rng() * 90; api.instance('cd_skyline', Math.sin(a) * r, Math.cos(a) * r, { y: 0, yaw: a + Math.PI, scale: 0.8 + rng() * 0.6, tint: cartTintOf('#e0c8b0', 0.7), noCol: true }); } }
  E.heroes.push({ type: 'firespinner', x: 22, z: 10, yaw: -1.2, anim: 'firespin' }, { type: 'firespinner', x: -20, z: -14, yaw: 2.2, anim: 'firespin' }, { type: 'lamplighter', x: -8, z: 24, yaw: 3, anim: 'lantern' });
  // ---- royale spots ----
  for (let i = 0; i < 8; i++) { const [x, z] = ang(i / 8 * TAU + 0.4, 46); E.gifts.push({ x, z }); const [x2, z2] = ang(i / 8 * TAU + 0.15, 132); E.gifts.push({ x: x2, z: z2 }); }
  const repairs = []; for (let i = 0; i < 6; i++) repairs.push(ang(i / 6 * TAU + 0.6, 110));
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, [x, z] = ang(a, 140); E.spawn.push({ x, z, yaw: a + Math.PI / 2 }); }
  for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 40 + rng() * 120; E.orbSpots.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.zones = [{ x: 0, z: 0, r: 14, name: 'THE MAN' }]; E.flagSpots = [{ x: 0, z: 60 }]; E.captures = [{ x: 0, z: -90, r: 9 }];
  E.royale = { R: C.R - 4, ends: [0, 1, 2, 3].map(i => ang(i / 4 * TAU + 1.2, 72)), repairs, storm: { name: 'WALL OF EMBERS', col: '#ff8a4a' }, avoid: C.pits.map(([a, r]) => { const p = ang(a, r); return [p[0], p[1], 7]; }).concat([[0, 0, C.plinth + 4]]) };
  return this.finish(E);
};

/* ---------------- the Man's poses (BurnsChar.poseFn: our own clip, the shared model) ---------------- */
function cartManPose(B) {
  const Bn = BURNS_BONES;
  const S = (P, b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  return (P, t) => {
    const st = B.st, u = B.u, tt = B.clock;
    const sway = Math.sin(tt * 1.3);
    // defaults: standing tall, arms a little out, breathing
    S(P, Bn.CHEST, 0.02 + sway * 0.02); S(P, Bn.HEAD, 0, Math.sin(tt * 0.4) * 0.3);
    S(P, Bn.UARM_L, 0.05, 0, 0.25); S(P, Bn.UARM_R, 0.05, 0, -0.25); S(P, Bn.FARM_L, -0.15); S(P, Bn.FARM_R, -0.15);
    S(P, Bn.THIGH_L, 0); S(P, Bn.THIGH_R, 0); S(P, Bn.SHIN_L, 0); S(P, Bn.SHIN_R, 0);
    if (st === 'sleep') { S(P, Bn.UARM_L, 0, 0, 0.12); S(P, Bn.UARM_R, 0, 0, -0.12); S(P, Bn.HEAD, 0.05, 0); return; }
    if (st === 'wake') { const k = BurnsM.smoothstep(0, 1, u); S(P, Bn.UARM_L, -2.7 * k, 0, 0.4 * k + 0.1); S(P, Bn.UARM_R, -2.7 * k, 0, -0.4 * k - 0.1); S(P, Bn.FARM_L, -0.3 * k); S(P, Bn.FARM_R, -0.3 * k); S(P, Bn.HEAD, -0.35 * k + Math.sin(tt * 9) * 0.08 * k, Math.sin(tt * 3) * 0.3); S(P, Bn.CHEST, -0.15 * k); P.y = Math.sin(u * Math.PI) * 0.15; return; }
    if (st === 'idle') { S(P, Bn.UARM_L, -0.4, 0, 0.6); S(P, Bn.UARM_R, -0.4, 0, -0.6); S(P, Bn.FARM_L, -0.9); S(P, Bn.FARM_R, -0.9); S(P, Bn.CHEST, 0.12 + sway * 0.04); S(P, Bn.HEAD, 0.1); P.y = -0.05 + sway * 0.03; S(P, Bn.THIGH_L, -0.15); S(P, Bn.SHIN_L, 0.3); S(P, Bn.THIGH_R, -0.15); S(P, Bn.SHIN_R, 0.3); return; }
    if (st === 'stomp') {
      // wind up (lift the right leg high, lean back, arms out), then slam it down
      const up = B.hit ? Math.max(0, 1 - B.ht * 6) : BurnsM.smoothstep(0, 1, Math.min(1, u * 1.1));
      S(P, Bn.THIGH_R, -1.35 * up); S(P, Bn.SHIN_R, 1.5 * up); S(P, Bn.CHEST, -0.18 * up + (B.hit ? 0.25 : 0)); S(P, Bn.UARM_L, -0.6, 0, 0.9); S(P, Bn.UARM_R, -0.6, 0, -0.9); S(P, Bn.FARM_L, -0.6); S(P, Bn.FARM_R, -0.6); S(P, Bn.HEAD, B.hit ? 0.3 : -0.1);
      P.y = B.hit ? -0.12 * Math.max(0, 1 - B.ht * 3) : 0.05 * up; return;
    }
    if (st === 'sweep') { const k = B.hit ? 1 : BurnsM.smoothstep(0, 1, u); S(P, Bn.UARM_R, -1.15 * k, 0, -0.15); S(P, Bn.FARM_R, -0.25 * k); S(P, Bn.UARM_L, -0.3, 0, 0.9 * k); S(P, Bn.CHEST, 0.3 * k); S(P, Bn.HEAD, 0.35 * k); S(P, Bn.THIGH_L, -0.3 * k); S(P, Bn.SHIN_L, 0.5 * k); return; }
    if (st === 'embers') { const k = B.hit ? 1 : BurnsM.smoothstep(0, 1, u); S(P, Bn.HEAD, -0.75 * k); S(P, Bn.CHEST, -0.35 * k); S(P, Bn.UARM_L, -2.4 * k, 0, 0.7); S(P, Bn.UARM_R, -2.4 * k, 0, -0.7); S(P, Bn.FARM_L, -0.4); S(P, Bn.FARM_R, -0.4); P.y = B.hit ? Math.abs(Math.sin(tt * 10)) * 0.08 : 0; return; }
    if (st === 'rest') {
      // overheated: down on one knee, heart forward, head hanging
      const k = BurnsM.smoothstep(0, 1, Math.min(1, B.t * 3)), out = B.t > B.dur - 0.4 ? (B.dur - B.t) / 0.4 : 1, w = k * Math.max(0, out);
      S(P, Bn.THIGH_L, -1.45 * w); S(P, Bn.SHIN_L, 1.5 * w); S(P, Bn.THIGH_R, 0.25 * w); S(P, Bn.SHIN_R, 1.9 * w); S(P, Bn.FOOT_R, -0.9 * w);
      S(P, Bn.CHEST, 0.45 * w + Math.sin(tt * 7) * 0.03); S(P, Bn.HEAD, 0.5 * w); S(P, Bn.UARM_L, -0.35 * w, 0, 0.3); S(P, Bn.UARM_R, -0.35 * w, 0, -0.3); S(P, Bn.FARM_L, -0.6 * w); S(P, Bn.FARM_R, -0.6 * w);
      P.y = -1.5 * w; return;
    }
    if (st === 'dying') {
      // he burns, staggers, and topples over backwards
      const k = BurnsM.smoothstep(0, 1, Math.min(1, B.t / 3.2));
      S(P, Bn.UARM_L, -1.8 + Math.sin(tt * 6) * 0.5, 0, 0.8); S(P, Bn.UARM_R, -1.6 + Math.sin(tt * 6 + 1) * 0.5, 0, -0.8); S(P, Bn.HEAD, -0.5); S(P, Bn.CHEST, -0.3 * k);
      S(P, Bn.THIGH_L, -0.5 * k); S(P, Bn.SHIN_L, 0.8 * k); P.pivot = 0; P.pitch = -1.5 * k * k; P.y = -0.4 * k; return;
    }
  };
}

/* ---------------- the boss ---------------- */
const CART_MAN_ATTACKS = ['stomp', 'sweep', 'embers'];
function cartManBegin(s, direct) {
  const R = s.roy, B = s.boss, P = s.player;
  R.phase = 2; s.obj.time = 99999; s.opts.phase = 2; s.camKart = null;
  // the rivals are gone (in a direct start they poof right away)
  for (const k of s.karts) { if (k.player) continue; if (!k.out) { k.out = true; k.hp = 0; k.outT = 0; k.roy.place = 8; } k.roy.poofed = true; k.hidden = true; k.sunk = true; }
  // the stand-in target: a copy of a rival's record, kept on the plinth edge facing the player
  const src = s.karts.find(k => !k.player);
  B.px = Object.assign({}, src, { id: 'man:boss', bossProxy: true, player: false, out: false, hidden: false, sunk: false, slot: 9, car: Object.assign({}, src.car, { id: 'man', name: 'THE MAN', col: '#ff8a2a' }), name: 'THE MAN', item: null, roul: 0, guard: null, roy: null });
  B.active = true; B.hp = B.max; B.st = 'wake'; B.t = 0; B.dur = direct ? 3.0 : 4.2; B.n = 0; B.last = ''; B.ramT = 0;
  P.hp = P.hpMax; P.invT = 3; P.wpn.t = 0; P.item = P.item || 'skymail'; P.roul = 0;
  s.banner('THE MAN AWAKENS!', '#ff8a3a', 3.0, 'destroy him to win the Battle Royale');
  Sound.play('stomp', { vol: 1, pitch: 0.5 }); Sound.play('crowd', { vol: 0.7 }); s.shakeIt(1);
  s.log('bossStart', { direct: !!direct });
}
function cartManDamage(s, n, what) {
  const B = s.boss; if (!B || !B.active || B.dead || B.st === 'wake') return 0;
  const weak = B.st === 'rest'; n *= weak ? 2 : 1; n = Math.min(n, B.hp);
  B.hp -= n; B.flash = 0.25; B.dmgBy[what] = (B.dmgBy[what] || 0) + n; B.taken += n;
  s.log('bossDmg', { src: what, n: +n.toFixed(1), hp: +B.hp.toFixed(1), weak });
  if (s.fx) { const hy = CART_MAN.y + 8.4 * CART_MAN.scale * (weak ? 0.8 : 1); s.fx.spark(B.hx, hy, B.hz, weak ? 26 : 12, weak ? '#ffffff' : '#ffb040', 10); if (weak) s.fx.burst(B.hx, hy, B.hz, 'star', 10, '#ffffff'); }
  Sound.play('kartHit', { vol: 0.6, pitch: weak ? 0.7 : 0.9 });
  if (weak && !B.weakTold) { B.weakTold = true; s.banner('WEAK POINT!', '#ffffff', 1.2, 'double damage while he is down', true); }
  if (B.hp <= 0.001) cartManDie(s);
  return n;
}
function cartManDie(s) {
  const B = s.boss; B.dead = true; B.st = 'dying'; B.t = 0; s.roy.bossDefeated = true;
  s.banner('THE MAN BURNS!', '#ffd84a', 4.5, 'YOU WIN THE BATTLE ROYALE!');
  Sound.play('cartBoom', { vol: 1, pitch: 0.6 }); Sound.play('crowd', { vol: 1 }); Sound.play('kartFinish', { vol: 0.9 }); s.shakeIt(1);
  s.log('bossDefeated', { t: +s.raceT.toFixed(1) });
}
// the boss's attacks land on the player through hit(); a shield throws the hit back at him
function cartManHitPlayer(s, kind, item, o) {
  const P = s.player; if (P.out) return false;
  const sh = P.shieldT > 0, ok = s.hit(P, kind, null, Object.assign({ item }, o));
  if (sh && P.shieldT <= 0) { cartManDamage(s, 14, 'shield'); s.banner('SHIELD BOUNCE!', '#ff9af0', 1.0, 'right back at him', true); }
  return ok;
}

CART_ARENA_RULES.man = {
  music: 'kart4', royaleFinal: true,
  onLoad(s) {
    const C = CART_MAN, M = s.man;
    s.manHold = true;   // he doesn't catch fire by himself (the shared scene burns the Man slowly otherwise)
    const B = s.boss = { active: false, st: 'sleep', t: 0, u: 0, dur: 1, clock: 0, hp: C.hp, max: C.hp, dmgBy: {}, taken: 0, dead: false, yaw: 0, hit: false, ht: 0, flash: 0, hx: 0, hz: 0, px: null,
      pxInv: 0, waves: [], embers: [], patches: [], sweep: null, pitT: 0, vents: C.vents.map(([a, r], i) => ({ x: Math.sin(a) * r, z: Math.cos(a) * r, next: 8 + i * 2.5, warn: false, fire: -1, mask: 0 })), ramT: 0, fw: 0, die: 0 };
    for (let i = 0; i < 16; i++) B.embers.push({ live: false, t: 0, x: 0, z: 0, delay: 0 });
    for (let i = 0; i < 12; i++) B.patches.push({ t: 0, x: 0, z: 0 });
    for (let i = 0; i < 3; i++) B.waves.push({ live: false, r: 0, mask: 0 });
    if (M) { M.ch.poseFn = cartManPose(B); M.burn = 0; }
    // the stand-in target joins the cars only while weapons and items look for victims
    const inj = () => { if (B.active && !B.dead && B.px && s.karts[s.karts.length - 1] !== B.px) { cartManProxy(s); s.karts.push(B.px); } };
    const rem = () => { if (B.px && s.karts[s.karts.length - 1] === B.px) s.karts.pop(); };
    const fire0 = s.fireWeapon, use0 = s.useItem, shots0 = s.updateShots, world0 = s.updateWorld;
    s.fireWeapon = function (k) { inj(); try { return fire0.call(this, k); } finally { rem(); } };
    s.useItem = function (k) {
      // a WATER BOTTLE douses him (and still repairs you)
      if (k.player && k.item === 'water' && B.active && !B.dead && Math.hypot(k.x, k.z) < 40) { cartManDamage(s, 10, 'water'); if (s.fx) s.fx.burst(B.hx, C.y + 5, B.hz, 'drop', 20, '#7ac8ff'); s.banner('HISSSS!', '#7ac8ff', 1.0, 'water on the Man', true); }
      // PRISM WARP: the laser trap left behind goes off at his feet
      if (k.player && k.item === 'warp' && B.active && !B.dead && Math.hypot(k.x, k.z) < 40) cartManDamage(s, CART_ROY_DMG.warp * 1.3, 'warp');
      inj(); try { return use0.call(this, k); } finally { rem(); }
    };
    s.updateShots = function (dt) { inj(); return shots0.call(this, dt); };   // stays in through the hazards, props and item effects; onUpdate takes it out
    s.updateWorld = function (dt, racing) { rem(); try { return world0.call(this, dt, racing); } finally { rem(); } };
    // fail: the results say THE MAN WINS
    const end0 = s.endBattle;
    s.endBattle = function () { const r = end0.call(this); if (this.roy && this.roy.phase === 2 && !this.roy.bossDefeated) { this.msgs.length = 0; this.banner('THE MAN WINS', '#ff6a3a', 3, 'RETRY starts at the Man fight'); } return r; };
    s.roy.aimAt = (s2, k) => (B.active && !B.dead && k.player ? (cartManProxy(s2), B.px) : null);
    if (s.opts.phase === 2) B.direct = true;
  },
  // phase 1 won: the boss wakes instead of the match ending
  royaleWon(s) { if (s.roy.phase === 2) return true; cartManBegin(s, false); return true; },
  onStep(s, k, dt, racing) {
    const B = s.boss; if (!B || !B.active || !k.player || !s.autoDrive || k.out) return;
    // the autopilot (tests, demo): fire when the Man is in reach, use items, hop the shockwave and the sweep
    const d = Math.hypot(k.x, k.z) - CART_MAN.hitR, D = k.wpn.def, ang = Math.abs(cartWrap(Math.atan2(-k.x, -k.z) - k.yaw));
    if (k.wpn.t <= 0 && (D.kind === 'ring' ? d < D.range * 0.8 : D.kind === 'drop' || D.kind === 'side' ? d < 12 : ang < 0.6 && d < D.range * 0.9)) k.inp.fire = true;
    if (k.item && k.itemCool <= 0 && (k.item !== 'water' || k.hp < 70) && d < 45) k.inp.item = true;
    const r = Math.hypot(k.x, k.z);
    for (const w of B.waves) if (w.live && w.r < r && r - w.r < 3.2) k.inp.driftPress = true;
    if (B.sweep && B.sweep.on) { const a = Math.atan2(k.x, k.z), da = cartWrap(a - B.sweep.a) * B.sweep.dir; if (da > 0 && da * r < 4 && r > 12 && r < B.sweep.R) k.inp.driftPress = true; }
  },
  // the autopilot circles the Man at weapon range, away from the embers
  aiGoal(s, k) {
    const B = s.boss; if (!B || !B.active || !k.player) return null;
    const a = Math.atan2(k.x, k.z) + 0.6, D = k.wpn.def, rr = D.kind === 'ring' ? CART_MAN.hitR + D.range * 0.55 : 30;
    return { goal: [Math.sin(a) * rr, Math.cos(a) * rr], prey: null };
  },
  onUpdate(s, dt, racing) {
    const B = s.boss, C = CART_MAN, M = s.man, P = s.player; if (!B) return;
    if (B.px && s.karts[s.karts.length - 1] === B.px) s.karts.pop();   // the stand-in leaves the cars again
    B.clock += dt; if (B.flash > 0) B.flash -= dt; if (B.pxInv > 0) B.pxInv = Math.max(0, B.pxInv - dt);
    // his heart (the weak point) in the world, for effects
    if (M) { B.hx = M.ch.x + Math.sin(B.yaw) * 1.2; B.hz = M.ch.z + Math.cos(B.yaw) * 1.2; M.ch.yaw = B.yaw; }
    const live = racing && s.state === 'race';
    if (live && B.direct && !B.active && s.raceT > 0.2) cartManBegin(s, true);
    // phase 1 hazards: fire pits and ember vents
    if (live && s.roy.phase !== 2) cartManHazards(s, dt);
    if (!B.active) { if (M) M.burn = Math.max(0, M.burn - dt); return; }
    // fire on him grows as he weakens
    if (M) M.burn = B.dead ? Math.min(1, M.burn + dt * 0.6) : 0.08 + 0.45 * (1 - B.hp / B.max);
    cartManProxy(s);
    if (B.dead) { cartManDeath(s, dt); return; }
    if (!live) return;
    // the player out: a beat, then the results
    if (P.out) { B.lose = (B.lose || 0) + dt; if (B.lose > 2.5) s.roy.endNow = true; return; }
    // turn to face the player (not mid-sweep)
    const want = Math.atan2(P.x - M.ch.x, P.z - M.ch.z);
    if (B.st !== 'sweep' || !B.hit) B.yaw = BurnsM.dampAngle(B.yaw, want, B.st === 'rest' ? 0.5 : 2.2, dt);
    // rams into his plinth
    if (B.ramT > 0) B.ramT -= dt;
    { const r = Math.hypot(P.x, P.z), into = -(P.vx * P.x + P.vz * P.z) / (r || 1); if (r < C.plinth + 2.4 && into > 9 && B.ramT <= 0) { B.ramT = 0.9; cartManDamage(s, (into - 7) * (P.boostT > 0 || P.dashT > 0 ? 1.5 : 1) * 0.9, 'ram'); if (s.fx) s.fx.spark(P.x, 1.5, P.z, 16, '#ffd890', 10); } }
    // mines dropped at his feet go off
    for (const m of s.props.mines) if (m.alive && Math.hypot(m.gx, m.gz) < C.plinth + 2.8) { m.alive = 0; m.visible = false; cartManDamage(s, CART_ROY_DMG.sprinkles, 'sprinkles'); if (s.fx) s.fx.confetti(m.gx, 1, m.gz, 24); }
    // a slime trail laid along his plinth makes him slip
    for (const h of s.hazards) if (h.type === 'slime' && !h.manHit && Math.hypot(h.x, h.z) < C.plinth + 2.6) { h.manHit = true; if (!B.slimeT || B.slimeT <= 0) { B.slimeT = 0.8; cartManDamage(s, CART_ROY_DMG.slime, 'slime'); } }
    if (B.slimeT > 0) B.slimeT -= dt;
    // the attack cycle
    const rage = B.hp < B.max * 0.5, sp = rage ? 1.25 : 1;
    B.t += dt; B.u = Math.min(1, B.t / B.dur);
    if (B.st === 'wake') { if (B.t >= B.dur) cartManNext(s, 'idle', 1.2); }
    else if (B.st === 'idle') { if (B.t >= B.dur) { let a; do { a = CART_MAN_ATTACKS[Math.floor(s.rng() * 3)]; } while (a === B.last); if (B.n === 0) a = 'stomp'; B.last = a; B.n++; cartManNext(s, a, (a === 'stomp' ? 1.3 : a === 'sweep' ? 1.2 : 1.0) / sp); B.hit = false; B.ht = 0; if (a === 'sweep') { const pa = Math.atan2(P.x, P.z), dir = s.rng() < 0.5 ? 1 : -1; B.sweep = { on: false, a0: pa - dir * 1.3, a: pa - dir * 1.3, dir, R: 66, w: 1.6 * sp, end: pa + dir * 1.3, mask: 0 }; } s.banner(a === 'stomp' ? 'STOMP! HOP THE SHOCKWAVE' : a === 'sweep' ? 'FIRE SWEEP! HOP IT' : 'EMBER RAIN! DODGE THE TARGETS', '#ff8a3a', 1.3, null, true); } }
    else if (B.st === 'stomp') {
      if (!B.hit && B.t >= B.dur) { B.hit = true; B.ht = 0; cartManWave(s); if (rage) B.second = 0.75; Sound.play('stomp', { vol: 1, pitch: 0.45 }); Sound.play('cartBoom', { vol: 0.8, pitch: 0.6 }); s.shakeIt(0.9); if (s.fx) s.fx.dust(0, C.y + 0.5, 0, 30, '#c8a080'); }
      if (B.hit) { B.ht += dt; if (B.second > 0) { B.second -= dt; if (B.second <= 0) { cartManWave(s); Sound.play('stomp', { vol: 1, pitch: 0.55 }); s.shakeIt(0.7); } } if (B.ht > 2.0) cartManNext(s, 'rest', 2.6); }
    }
    else if (B.st === 'sweep') {
      const W = B.sweep;
      if (!B.hit && B.t >= B.dur) { B.hit = true; B.ht = 0; W.on = true; Sound.play('flame', { vol: 1, pitch: 0.7 }); }
      if (B.hit) {
        B.ht += dt; W.a += W.dir * W.w * dt; B.yaw = W.a;
        // the fire line: from his plinth out to W.R; anything on the ground it crosses burns (hop over it)
        for (const k of [P]) { if (k.out || k.air) continue; const r = Math.hypot(k.x, k.z); if (r < C.plinth || r > W.R) continue; const da = Math.abs(cartWrap(Math.atan2(k.x, k.z) - W.a)) * r; if (da < 1.8) cartManHitPlayer(s, 'spin', 'sweep', { banner: 'TORCHED!', dur: 1.0 }); }
        if (cartWrap(W.a - W.end) * W.dir > 0) { W.on = false; cartManNext(s, 'rest', 2.6); }
      }
    }
    else if (B.st === 'embers') {
      if (!B.hit && B.t >= B.dur) { B.hit = true; B.ht = 0; const n = rage ? 14 : 11; for (let i = 0; i < n; i++) { const E = B.embers[i]; const lead = 0.6 + s.rng() * 1.6, a = s.rng() * TAU, rr = i < 4 ? s.rng() * 4 : 4 + s.rng() * 13; E.live = true; E.t = 0; E.delay = 0.5 + i * 0.12 + s.rng() * 0.3; E.x = P.x + P.vx * lead + Math.sin(a) * rr; E.z = P.z + P.vz * lead + Math.cos(a) * rr; const d = Math.hypot(E.x, E.z); if (d < C.plinth + 2) { E.x *= (C.plinth + 2) / d; E.z *= (C.plinth + 2) / d; } } Sound.play('flame', { vol: 0.9, pitch: 1.3 }); }
      if (B.hit) { B.ht += dt; if (B.ht > 2.6) cartManNext(s, 'rest', 2.4); }
    }
    else if (B.st === 'rest') { if (B.t >= B.dur) cartManNext(s, 'idle', rage ? 0.8 : 1.2); }
    // shockwaves roll out
    for (const w of B.waves) {
      if (!w.live) continue; w.r += 19 * dt; if (w.r > 52) { w.live = false; continue; }
      if (!P.out && !(w.mask & 1) && !P.air) { const r = Math.hypot(P.x, P.z); if (Math.abs(r - w.r) < 1.5) { w.mask |= 1; cartManHitPlayer(s, 'knock', 'stomp', { dx: P.x / r, dz: P.z / r, power: 14, banner: 'STOMPED!' }); } }
    }
    // embers fall; their fires burn a while
    for (const E of B.embers) {
      if (!E.live) continue; E.t += dt;
      if (E.t >= E.delay + 1.2) {
        E.live = false;
        if (!P.out && Math.hypot(P.x - E.x, P.z - E.z) < 4.4 && P.y < 3) cartManHitPlayer(s, 'spin', 'ember', { banner: 'EMBER HIT!', dur: 0.9 });
        const F = B.patches.find(q => q.t <= 0) || B.patches[0]; F.t = 3; F.x = E.x; F.z = E.z;
        if (s.fx) { s.fx.burst(E.x, 0.5, E.z, 'spark', 16, '#ffb040'); s.fx.smoke(E.x, 0.6, E.z, 4, '#5a4040'); }
        if (Math.hypot(P.x - E.x, P.z - E.z) < 40) Sound.play('cartBoom', { vol: 0.35, pitch: 1.6 });
      }
    }
    for (const F of B.patches) { if (F.t <= 0) continue; F.t -= dt; }
    B.patchT = (B.patchT || 0) - dt;
    if (B.patchT <= 0) { B.patchT = 0.5; for (const F of B.patches) if (F.t > 0 && !P.out && !P.air && Math.hypot(P.x - F.x, P.z - F.z) < 2.6) { cartRoyDamage(s, P, CART_ROY_DMG.emberfire, null, 'emberfire'); if (P.player) s.banner('ON FIRE!', '#ff8a3a', 0.6, null, true); break; } }
  },
  // the results of a lost fight: THE MAN on top
  finishResults(s) {
    if (!s.roy || s.roy.phase !== 2 || s.roy.bossDefeated || !s.results) return;
    s.results.unshift({ id: 'man:boss', name: 'THE BURNING ONE', car: 'THE MAN', player: false, score: 0, hits: 0, out: false, rank: 1 });
    s.results.forEach((r, i) => r.rank = i + 1);
  },
  camera(s, fdt) {
    const B = s.boss, M = s.man; if (!B || !M || !B.active) return null;
    const P = s.player, sc = CART_MAN.scale;
    if (B.st === 'wake') {
      // low and close, looking up at him as he raises his arms
      const a = Math.atan2(P.x, P.z) + 0.35 - B.u * 0.5, d = 46 - B.u * 10;
      return { px: Math.sin(a) * d, py: 3 + B.u * 3, pz: Math.cos(a) * d, tx: 0, ty: CART_MAN.y + 9 * sc * (0.6 + 0.3 * B.u), tz: 0, fov: 1.15 };
    }
    if (B.st === 'dying' && B.t < 6) { const a = Math.atan2(P.x, P.z) + B.t * 0.08, d = 70; return { px: Math.sin(a) * d, py: 9 + B.t, pz: Math.cos(a) * d, tx: 0, ty: CART_MAN.y + 6 * sc, tz: 0, fov: 1.2 }; }
    return null;
  },
  render(s, R) { /* the Man himself is drawn by the scene */ },
  draw(s, R, Sp, t) {
    const B = s.boss, C = CART_MAN, M = s.man; if (!B) return;
    const sc = C.scale;
    // phase 1: the pits and vents
    if (s.roy && s.roy.phase !== 2) {
      for (const [a, r] of C.pits) { const x = Math.sin(a) * r, z = Math.cos(a) * r; R.flat.flat(x, 0.08, z, 10, 10, t * 0.3, Sp.glow, C.fire, 0.55 + 0.15 * Math.sin(t * 7 + a), true); if (Math.random() < 0.7) s.fx.fire(x + (Math.random() - 0.5) * 7, 0.1, z + (Math.random() - 0.5) * 7, 1.6); }
      for (const v of B.vents) { if (v.warn) { const a = 0.5 + 0.5 * Math.sin(t * 16); R.flat.flat(v.x, 0.1, v.z, 11, 11, t * 2, Sp.warn, C.red, 0.5 + 0.4 * a, true); R.bbs.bb(v.x, 1.5, v.z, 4, 4, Sp.glow, C.fire, a, true); } if (v.fire >= 0) { for (let i = 0; i < 6; i++) s.fx.add(v.x + (Math.random() - 0.5) * 1.5, 0.5, v.z + (Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 3, 14 + Math.random() * 8, (Math.random() - 0.5) * 3, 1.0, 0.8, 0.3, C.ember, 1, 'flame', 1); R.bbs.streak(v.x, 6, v.z, 0, 1, 0, 12, 3, Sp.streak, C.fire, 0.8); } }
    }
    // embers drifting up from the Man and the cauldrons (ambient)
    if (Math.random() < 0.6) s.fx.add((Math.random() - 0.5) * 30, 2 + Math.random() * 4, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 1.5, 2 + Math.random() * 2, (Math.random() - 0.5) * 1.5, 3, 0.25, 0.05, C.ember, 1, 'spark', 1);
    if (!B.active || !M) return;
    const hy = C.y + (B.st === 'rest' ? 8.4 - 1.5 : 8.4) * sc, weak = B.st === 'rest';
    // the heart: white-hot and ringed when it's the weak point
    R.bbs.bb(B.hx, hy, B.hz, weak ? 11 : 6, weak ? 11 : 6, Sp.glow, weak ? C.white : C.red, weak ? 0.9 : 0.5 + (B.flash > 0 ? 0.4 : 0), true);
    if (weak) { R.bbs.bb(B.hx, hy, B.hz, 9 + Math.sin(t * 12) * 1.2, 9 + Math.sin(t * 12) * 1.2, Sp.ring, C.white, 0.8, true); R.bbs.bb(B.hx, hy + 6, B.hz, 2.2, 2.2, Sp.arrow, C.gold, 0.6 + 0.4 * Math.sin(t * 10), true, Math.PI); }
    if (B.st === 'stomp' && !B.hit) { const a = 0.5 + 0.5 * Math.sin(t * 18); R.flat.flat(0, C.y + 0.05, 0, 2 * (C.plinth + 4), 2 * (C.plinth + 4), t, Sp.warn, C.red, 0.4 + 0.5 * a * B.u, true); R.flat.flat(0, 0.1, 0, 104, 104, 0, Sp.ring, C.red, 0.25 * a, true); }
    for (const w of B.waves) if (w.live) { const a = 1 - w.r / 52; R.flat.flat(0, 0.25, 0, w.r * 2, w.r * 2, 0, Sp.ring, C.fire, 0.95 * a + 0.05, true); R.flat.flat(0, 0.3, 0, w.r * 2 - 1.4, w.r * 2 - 1.4, 0, Sp.ring, C.gold, 0.6 * a, true); for (let i = 0; i < 5; i++) { const b = Math.random() * TAU; s.fx.fire(Math.sin(b) * w.r, 0.1, Math.cos(b) * w.r, 1.4); } }
    const W = B.sweep;
    if (B.st === 'sweep' && W) {
      if (!B.hit) {   // the arc it will sweep, drawn as chevrons along the sweep's start line and edge
        const a = 0.5 + 0.5 * Math.sin(t * 16);
        for (let r = C.plinth + 2; r < W.R; r += 5) { R.flat.flat(Math.sin(W.a0) * r, 0.12, Math.cos(W.a0) * r, 3.2, 3.2, W.a0 + Math.PI * (W.dir > 0 ? 0.5 : -0.5), Sp.arrow, C.red, 0.4 + 0.5 * a, true); }
        for (let k = 0; k <= 10; k++) { const b = W.a0 + (W.end - W.a0) * k / 10; R.flat.flat(Math.sin(b) * (W.R + 1), 0.12, Math.cos(b) * (W.R + 1), 3, 3, 0, Sp.dot, C.red, 0.5 * a, true); }
      } else if (W.on) {
        const fx = Math.sin(W.a), fz = Math.cos(W.a);
        for (let r = C.plinth; r < W.R; r += 4) { R.bbs.bb(fx * r, 1.0, fz * r, 4.2, 3.2, Sp.glow, C.fire, 0.8, true); if (Math.random() < 0.8) s.fx.fire(fx * r + (Math.random() - 0.5), 0.2, fz * r + (Math.random() - 0.5), 1.8); }
        R.bbs.streak(fx * (W.R / 2), 0.9, fz * (W.R / 2), fx, 0, fz, W.R - C.plinth, 1.4, Sp.streak, C.gold, 0.9);
        R.bbs.streak(fx * (W.R / 2 + 4), C.y + 14, fz * (W.R / 2 + 4), -fx, -0.5, -fz, 30, 0.8, Sp.streak, C.fire, 0.6);
      }
    }
    for (const E of B.embers) if (E.live) { const u = clamp((E.t - E.delay) / 1.2, 0, 1); R.flat.flat(E.x, 0.12, E.z, 3 + u * 5, 3 + u * 5, t * 3, Sp.warn, C.red, 0.4 + 0.6 * u, true); const fy = lerp(40, 0.6, u * u); if (u > 0) { R.bbs.bb(E.x, fy, E.z, 2.6, 2.6, Sp.glow, C.fire, 1, true); if (Math.random() < 0.6) s.fx.fire(E.x, fy, E.z, 1.2); } }
    for (const F of B.patches) if (F.t > 0) { R.flat.flat(F.x, 0.1, F.z, 6, 6, 0, Sp.glow, C.fire, 0.5 * Math.min(1, F.t), true); if (Math.random() < 0.6) s.fx.fire(F.x + (Math.random() - 0.5) * 3, 0.1, F.z + (Math.random() - 0.5) * 3, 1.1); }
  },
  lights(s, add) {
    const B = s.boss, C = CART_MAN; if (!B) return;
    if (B.active && B.st === 'rest') add(B.hx, C.y + 7 * C.scale, B.hz, 24, C.white, 1.6, 3);
    for (const w of B.waves) if (w.live) add(0, 1, w.r, 16, C.fire, 1.2, 2);
    if (B.sweep && B.sweep.on) add(Math.sin(B.sweep.a) * 30, 2, Math.cos(B.sweep.a) * 30, 30, C.fire, 1.6, 3);
    for (const v of B.vents) if (v.fire >= 0) add(v.x, 3, v.z, 14, C.fire, 1.4, 2);
  },
  royaleHud(s, ctx, W, H, top, left) {
    const B = s.boss; if (!B || !B.active) return;
    const portrait = H > W, bw = Math.min(portrait ? 300 : 360, W - 40), x = W / 2 - bw / 2, y = portrait ? top + 140 : top + 4;
    ctx.save(); ctx.fillStyle = 'rgba(20,6,4,0.6)'; burnsRR(ctx, x - 10, y - 4, bw + 20, 40, 12); ctx.fill(); ctx.restore();
    BurnsUI.text(ctx, 'THE MAN', W / 2, y + 7, 13, '#ffb070', { glow: '#ff5a1a' });
    cartRoyBar(ctx, x, y + 17, bw, 14, B.hp / B.max, B.st === 'rest' ? '#ffffff' : B.flash > 0 ? '#ffd890' : '#ff6a2a');
    if (B.st === 'rest' && s.state === 'race') BurnsUI.text(ctx, 'WEAK POINT — HIT HIM NOW!', W / 2, y + 50, 13, '#ffffff', { glow: '#ffb020' });
    else if (B.hp < B.max * 0.5 && !B.dead && s.state === 'race') BurnsUI.text(ctx, 'HE\'S ENRAGED', W / 2, y + 50, 11, '#ff8a6a', { ui: true });
  },
  radar(s, ctx, P, sc) { const q = CART_ROY_T.p; P(0, 0, q); ctx.fillStyle = '#ff8a3a'; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(3, CART_MAN.plinth * sc), 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,90,30,0.6)'; for (const [a, r] of CART_MAN.pits) { P(Math.sin(a) * r, Math.cos(a) * r, q); ctx.beginPath(); ctx.arc(q.x, q.y, 2.5, 0, TAU); ctx.fill(); } }
};
function cartManNext(s, st, dur) { const B = s.boss; B.st = st; B.t = 0; B.u = 0; B.dur = dur; B.hit = false; B.ht = 0; if (st === 'rest') B.weakTold = B.weakTold || false; }
function cartManWave(s) { const B = s.boss, w = B.waves.find(q => !q.live) || B.waves[0]; w.live = true; w.r = CART_MAN.plinth + 1; w.mask = 0; }
// the stand-in target on the plinth edge facing the player (it is reset every frame: nothing sticks to it)
function cartManProxy(s) {
  const B = s.boss, X = B.px, P = s.player; if (!X) return;
  const r = Math.hypot(P.x, P.z) || 1, R = CART_MAN.hitR;
  X.x = P.x / r * R; X.z = P.z / r * R; X.y = 0; X.vx = 0; X.vz = 0; X.vy = 0; X.speed = 0; X.yaw = Math.atan2(P.x, P.z);
  X.out = false; X.hidden = false; X.air = false; X.carry = null; X.fly = null; X.sunk = false; X.shieldT = 0; X.immuneT = 0; X.dashT = 0; X.guard = null;
  X.spinT = 0; X.flipT = 0; X.bubbleT = 0; X.stunT = 0; X.charmT = 0; X.gooT = 0; X.foamT = 0; X.slowT = 0; X.dazzleT = 0; X.whirlT = 0; X.invT = B.pxInv;
  X.finished = false; X.item = null;
}
// a hit on the stand-in is a hit on the Man (43_cart_i_royale.js routes it here)
CART_ARENA_RULES.man.bossHit = function (s, src, kind, o) {
  const B = s.boss; if (!B || !B.px) return;
  const what = (o && (o.weapon || o.item)) || kind;
  cartManDamage(s, cartRoyDmgOf(what, kind) * 1.3, what);
  B.pxInv = 0.12; B.px.invT = 0.12;   // several bubbles or fireballs can all land
};
function cartManDeath(s, dt) {
  const B = s.boss, C = CART_MAN; B.t += dt; B.fw -= dt;
  if (B.fw <= 0 && s.fx) { B.fw = 0.25; const a = Math.random() * TAU, r = 30 + Math.random() * 90; s.fx.firework(Math.sin(a) * r, 40 + Math.random() * 40, Math.cos(a) * r, BURNS_NEON[Math.floor(Math.random() * 7)]); }
  if (s.fx && Math.random() < 0.9) for (let i = 0; i < 3; i++) s.fx.fire((Math.random() - 0.5) * 8, C.y + Math.random() * 20, (Math.random() - 0.5) * 8, 3);
  if (B.t > 3.2 && !B.fell) { B.fell = true; s.shakeIt(1); Sound.play('cartBoom', { vol: 1, pitch: 0.4 }); if (s.fx) { s.fx.burst(0, 3, 0, 'puff', 40, '#ffb070'); s.fx.confetti(s.player.x, 3, s.player.z, 60); s.fx.burst(0, 6, 0, 'spark', 40, '#ffd84a'); } }
  if (B.t > 6.5) s.roy.endNow = true;
}
// phase 1: fire pits burn whoever drives in; ember vents erupt on a timer (warned)
function cartManHazards(s, dt) {
  const B = s.boss, C = CART_MAN;
  B.pitT -= dt;
  if (B.pitT <= 0) { B.pitT = 0.5; for (const k of s.karts) { if (k.out || k.air) continue; for (const [a, r] of C.pits) if (Math.hypot(k.x - Math.sin(a) * r, k.z - Math.cos(a) * r) < 5) { cartRoyDamage(s, k, CART_ROY_DMG.firepit, null, 'firepit'); k.slowT = Math.max(k.slowT, 0.6); if (k.player) s.banner('FIRE PIT!', '#ff8a3a', 0.6, null, true); break; } } }
  for (const v of B.vents) {
    v.next -= dt;
    if (!v.warn && v.fire < 0 && v.next <= 1.4) { v.warn = true; }
    if (v.warn && v.next <= 0) { v.warn = false; v.fire = 0; v.mask = 0; v.next = 9 + s.rng() * 3; const P = s.player; Sound.play('flame', { vol: P && Math.hypot(P.x - v.x, P.z - v.z) < 40 ? 0.9 : 0.2, pitch: 0.8 }); }
    if (v.fire >= 0) { v.fire += dt; for (const k of s.karts) { if (k.out || (v.mask & (1 << k.slot))) continue; if (Math.hypot(k.x - v.x, k.z - v.z) < 5) { v.mask |= 1 << k.slot; s.hit(k, 'launch', null, { item: 'embervent', vy: 11, banner: 'EMBER VENT!' }); } } if (v.fire > 1.2) v.fire = -1; }
  }
}

/* ---------------- the registry ---------------- */
CART_ARENAS.push({
  id: 'man', name: 'THE MAN', sub: 'The royale final: win, then destroy the Man', objectives: ['royale'], royale: true, final: true,
  col: '#ff8a3a', tod: 'night', blurb: 'Win the Battle Royale under the Man. Then he wakes up.'
});
CART_ROYALE_ARENAS.man = 'man';
CART_ARENA_ICONS.man = (ctx, s, t, col) => {
  // the Man's silhouette with a flame behind
  ctx.save(); const f = 0.85 + 0.15 * Math.sin(t * 8);
  ctx.fillStyle = rgba('#ff6a1a', 0.5); ctx.beginPath(); ctx.ellipse(0, s * 0.1, s * 0.55 * f, s * 0.8 * f, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-s * 0.25, s * 0.75); ctx.lineTo(0, s * 0.1); ctx.lineTo(s * 0.25, s * 0.75); ctx.moveTo(0, s * 0.1); ctx.lineTo(0, -s * 0.35); ctx.moveTo(-s * 0.45, -s * 0.65); ctx.lineTo(0, -s * 0.3); ctx.lineTo(s * 0.45, -s * 0.65); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -s * 0.75); ctx.lineTo(-s * 0.12, -s * 0.5); ctx.lineTo(0, -s * 0.4); ctx.lineTo(s * 0.12, -s * 0.5); ctx.closePath(); ctx.stroke();
  ctx.restore();
};
