/* ============================================================
   ART CART — royale arena: ROLLER DISCO (id 'rollerdisco', Glitterfin's arena; level agent "fish", Nov 19 2026)
   A roller disco on the reef floor at night. In the middle a glossy ROLLER RINK (slick: less grip) under a GIANT
   MIRROR BALL hung from four arching truss legs; curved rink boards round it (cover, with wide gaps). Round the rink a
   square of four glittering BOWLING ALLEYS; beyond them coral heads, mirror-ball lamps, kelp, two giant roller-skate
   sculptures, the skate-hire hut; an LED fence, stages and bleachers outside.
   Its enemies (all telegraphed, all readable on a phone):
     · DISCO BALLS: an alley's chevrons light up and its conch chute flares (1.5 s), then a giant mirror ball rolls
       the length of the alley: 12 HP and a knock (cross the alleys between balls; watch the lit lanes)
     · DISCO BEAMS: the giant mirror ball fixes a pale spot on a car and follows it (1.6 s), the spot STOPS and blinks
       amber (0.6 s: swerve!), then flashes: dazzled and 8 HP
     · ROLLER CRABS: six crabs on skates lap the rink: a bump spins you (6 HP). HOP over them
   MIRROR SCHOOL (Glitterfin's special) is in everyone's gift boxes here (arena levelCar → the scene's poolCar).
   Original design. Registers itself (43_cart_a_data.js, 43_cart_i_royale.js); its meshes reuse the Disco Reef
   builders (drfMirrorBall, DRF_KINDS, DrfMesh in 43_cart_j_discoreef.js: same bundle, used only at load time).
   Globals are prefixed RDO_ / rdo; the run-time state is s.rdo.
   ============================================================ */
const RDO = {
  R: 178, rink: 47, boards: 52, alley: 80, alleyEnd: 132, ballR: 2.2, ballSpeed: 16, ballPeriod: 19, ballTele: 1.5,
  mirrorY: 27, beamR: 5, crabs: 6, crabR: 36,
  ice: [0.75, 0.9, 1], white: [1, 1, 1], amber: [1, 0.68, 0.18], warn: [1, 0.45, 0.15], pink: [1, 0.35, 0.82], violet: [0.66, 0.4, 1], black: [0, 0, 0], crab: [1, 0.4, 0.32],
  pal: ['#38f2ff', '#ff6ad0', '#bfe0ff', '#a070ff', '#ffd84a', '#5affc8']
};
// the four alleys: a line x = ±alley (along z) or z = ±alley (along x), the ball rolling from one end to the other
const RDO_ALLEYS = [{ ax: 'z', c: RDO.alley, dir: 1 }, { ax: 'x', c: RDO.alley, dir: -1 }, { ax: 'z', c: -RDO.alley, dir: -1 }, { ax: 'x', c: -RDO.alley, dir: 1 }];
function rdoAlleyPt(A, u, out) { const v = -RDO.alleyEnd * A.dir + u * A.dir; if (A.ax === 'z') { out[0] = A.c; out[1] = v; } else { out[0] = v; out[1] = A.c; } return out; }
const RDO_T = { p: [0, 0], q: [0, 0] };

/* ---------------- set pieces ---------------- */
// a giant roller skate (a landmark and cover): boot, laces, four glowing wheels, a pink toe stop (forward = +z)
function rdoSkate(m) {
  m.color('#ffffff').shine(2); m.roundBox(0, 4.2, -1.0, 3.4, 4.6, 3.6, 0.9); m.ellipsoid(0, 2.9, 1.6, 1.75, 1.4, 2.2, { seg: 16, rings: 10 }); m.roundBox(0, 2.1, 0, 3.5, 1.2, 6.4, 0.5);
  m.color('#ff6ad0', 0.2); m.roundBox(0, 6.55, -1.0, 3.6, 0.5, 3.8, 0.2); m.emissive(0);
  m.color('#38f2ff', 0.3); for (let i = 0; i < 5; i++) m.limb(-1.0, 2.9 + i * 0.6, 1.0 - i * 0.35, 1.0, 3.1 + i * 0.6, 1.0 - i * 0.35, 0.07, 0.07, { seg: 4 }); m.emissive(0);
  m.color('#3a3448').shine(3); m.roundBox(0, 1.25, 0, 2.6, 0.5, 6.0, 0.15); m.shine(0);
  for (const sx of [-1.3, 1.3]) for (const sz of [-2.1, 2.1]) { m.color('#ffd84a', 0.6).shine(2); m.push(); m.tf(sx, 0.85, sz, 0, 0, Math.PI / 2); m.cyl(0, -0.35, 0, 0.85, 0.85, 0.7, 16); m.pop(); m.color('#ffffff', 0.9); m.push(); m.tf(sx * 1.28, 0.85, sz, 0, 0, Math.PI / 2); m.disc(0, 0, 0, 0.3, 10); m.pop(); m.emissive(0).shine(0); }
  m.color('#ff2a8a', 0.4); m.ball(0, 1.0, 3.5, 0.65, { seg: 10, rings: 7 }); m.emissive(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.9, hz: 3.4, y0: 0, y1: 6.8 }], lights: [{ x: 0, y: 1, z: 0, s: 0, c: '#ffd84a', pool: 12 }, { x: 0, y: 7, z: -1, s: 2, c: '#ff6ad0' }] };
}
// the skate-hire hut: a round hut with a shell roof and a counter of skates
function rdoHut(m) {
  m.color('#3a2a5a').shine(1); m.cyl(0, 0, 0, 5, 5, 3.2, 24); m.shine(0);
  m.color('#ffffff', 0.1).shine(2); m.lathe([[5.8, 3.2], [5.2, 3.9], [3.2, 5.0], [0, 5.6]], { seg: 24, rMod: th => 1 + 0.06 * Math.cos(th * 10) }); m.shine(0); m.emissive(0);
  m.color('#ff6ad0', 1); m.torus(0, 3.2, 0, 5.85, 0.1, { seg: 32, tseg: 3 }); m.color('#38f2ff', 1); m.torus(0, 1.2, 0, 5.05, 0.08, { seg: 32, tseg: 3 }); m.emissive(0);
  m.color('#c88a5a'); m.roundBox(0, 1.1, 5.2, 6, 0.2, 1.4, 0.08);
  for (let i = 0; i < 5; i++) { const x = -2.4 + i * 1.2; m.color(i % 2 ? '#ff6ad0' : '#ffffff').shine(2); m.roundBox(x, 1.55, 5.2, 0.5, 0.7, 0.9, 0.18); m.color('#ffd84a', 0.4); for (const z of [4.85, 5.55]) m.ball(x, 1.15, z, 0.12, { seg: 6, rings: 4 }); m.emissive(0).shine(0); }
  drfMirrorBall(m, 0, 6.6, 0, 1.0, 0.3);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 5.4, y0: 0, y1: 5 }], lights: [{ x: 0, y: 2.4, z: 5.6, s: 2.4, c: '#ffd8f0' }, { x: 0, y: 0, z: 0, s: 0, c: '#ff6ad0', pool: 14 }] };
}
// a curved section of rink boards (cover): an arc of `span` radians at radius r, white boards with a pink rail on top
function rdoBoards(m, r, span) {
  const n = 7, lights = [];
  for (let i = 0; i < n; i++) {
    const a0 = -span / 2 + span * i / n, a1 = -span / 2 + span * (i + 1) / n, x0 = Math.sin(a0) * r, z0 = Math.cos(a0) * r, x1 = Math.sin(a1) * r, z1 = Math.cos(a1) * r, am = (a0 + a1) / 2, len = Math.hypot(x1 - x0, z1 - z0);
    m.push(); m.tf((x0 + x1) / 2, 0, (z0 + z1) / 2, am + Math.PI / 2); m.color('#f4f0ff').shine(2); m.roundBox(0, 0.6, 0, len + 0.05, 1.2, 0.35, 0.1); m.color('#ff6ad0', 0.9); m.roundBox(0, 1.25, 0, len + 0.1, 0.12, 0.45, 0.05); m.color('#38f2ff', 0.8); m.box(0, 0.25, 0.18, len, 0.06, 0.02); m.emissive(0).shine(0); m.pop();
    if (i % 2 === 0) lights.push({ x: Math.sin(am) * r, y: 1.4, z: Math.cos(am) * r, s: 0.9, c: '#ff6ad0' });
  }
  const cols = []; for (let i = 0; i <= 10; i++) { const a = -span / 2 + span * i / 10; cols.push({ t: 'cyl', x: Math.sin(a) * r, z: Math.cos(a) * r, r: 1.4, y0: 0, y1: 1.3 }); }
  return { cols, lights };
}
// the mirror ball's frame: four arching truss legs from r = 64 up to a crown at 33 m
function rdoMast(m) {
  m.color('#d0d4e0').shine(3);
  const H = 33, R0 = 64, N = 10;
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + Math.PI / 4, sx = Math.sin(a), sz = Math.cos(a);
    let px = sx * R0, py = 0, pz = sz * R0;
    for (let k = 1; k <= N; k++) { const u = k / N, r = R0 * Math.cos(u * Math.PI / 2) + 1.2, y = H * Math.sin(u * Math.PI / 2); const x = sx * r, z = sz * r; m.limb(px, py, pz, x, y, z, 0.42, 0.38, { seg: 6 }); m.limb(px + sz * 0.9, py, pz - sx * 0.9, x + sz * 0.9, y, z - sx * 0.9, 0.12, 0.12, { seg: 4 }); px = x; py = y; pz = z; }
    m.color('#38f2ff', 1); m.limb(sx * R0, 0.2, sz * R0, sx * R0 * 0.94, 8, sz * R0 * 0.94, 0.1, 0.1, { seg: 4 }); m.emissive(0).color('#d0d4e0');
    m.color('#2a2236').shine(1); m.roundBox(sx * R0, 0.6, sz * R0, 3, 1.2, 3, 0.4); m.shine(3).color('#d0d4e0');
  }
  m.color('#d0d4e0'); m.torus(0, H, 0, 1.6, 0.25, { seg: 16, tseg: 5 }); m.limb(0, H, 0, 0, RDO.mirrorY + 4.2, 0, 0.1, 0.1, { seg: 5 }); m.shine(0);
  const cols = []; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; cols.push({ t: 'cyl', x: Math.sin(a) * R0, z: Math.cos(a) * R0, r: 1.8, y0: 0, y1: 12, camPass: true }); }
  return { cols, lights: [{ x: 0, y: H, z: 0, s: 2.4, c: '#bfe0ff' }] };
}

/* ---------------- the world ---------------- */
CartWorlds.arena_rollerdisco = function (A, night) {
  const S = RDO, E = this.base(2143, [-235, -235, 235, 235], '#6c6cb4', 0.03);
  const sky = Object.assign(CART_SKIES.night(), { zen: '#04081c', sky: '#2a3a7a', hor: '#2a4a8a', fog: '#141a3a', fogD: 0.0034, mid: '#1a2050', midK: 0.4, cityCol: '#38f2ff', cityK: 0.8, emB: 1.9, keyK: 0.78, key: '#c8d8ff', gnd: '#2a2a5a' });
  Object.assign(E, { id: 'rollerdisco', arena: A, sky, tod: 'night', music: 'kart3', night: true, R: S.R });
  const api = E.api, rng = mulberry32(2143);
  const ang = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
  // ---- ground paint: sand ripples, the rink (glossy, lane rings, a centre circle), the four glitter alleys ----
  api.paint((ctx, P, sc) => {
    for (let i = 0; i < 420; i++) { const x = (rng() - 0.5) * 460, z = (rng() - 0.5) * 460, q = P(x, z); ctx.fillStyle = `rgba(${rng() < 0.5 ? '20,24,50' : '120,140,190'},${0.05 + rng() * 0.07})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (3 + rng() * 10) * sc, (0.6 + rng() * 1.6) * sc, 0.5, 0, TAU); ctx.fill(); }
    const c0 = P(0, 0);
    ctx.fillStyle = '#5a46a8'; ctx.beginPath(); ctx.arc(c0[0], c0[1], (S.rink + 1) * sc, 0, TAU); ctx.fill();
    // a big painted starburst on the rink (reads from the chase camera and from above)
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, w = 0.09, p = P(...ang(a - w, 11)), q = P(...ang(a, S.rink - 2)), r = P(...ang(a + w, 11)); ctx.fillStyle = i % 2 ? 'rgba(255,120,220,0.32)' : 'rgba(110,240,255,0.3)'; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.lineTo(r[0], r[1]); ctx.fill(); }
    for (let r = 10; r < S.rink; r += 7) { ctx.strokeStyle = r % 14 ? 'rgba(120,240,255,0.7)' : 'rgba(255,130,220,0.65)'; ctx.lineWidth = 0.45 * sc; ctx.setLineDash([3 * sc, 2 * sc]); ctx.beginPath(); ctx.arc(c0[0], c0[1], r * sc, 0, TAU); ctx.stroke(); }
    ctx.setLineDash([]); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.6 * sc; ctx.beginPath(); ctx.arc(c0[0], c0[1], (S.rink + 0.5) * sc, 0, TAU); ctx.stroke();
    for (let i = 0; i < 120; i++) { const a = rng() * TAU, r = rng() * S.rink, q = P(...ang(a, r)); ctx.fillStyle = `rgba(255,255,255,${0.04 + rng() * 0.06})`; ctx.beginPath(); ctx.arc(q[0], q[1], (0.3 + rng() * 0.8) * sc, 0, TAU); ctx.fill(); }
    for (const A of RDO_ALLEYS) {
      const p0 = rdoAlleyPt(A, 0, [0, 0]), p1 = rdoAlleyPt(A, S.alleyEnd * 2, [0, 0]), q0 = P(p0[0], p0[1]), q1 = P(p1[0], p1[1]);
      ctx.strokeStyle = 'rgba(120,70,200,0.95)'; ctx.lineWidth = 8 * sc; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,226,110,1)'; ctx.lineWidth = 0.8 * sc; for (const o of [-3.4, 3.4]) { const ox = A.ax === 'z' ? o : 0, oz = A.ax === 'x' ? o : 0, a = P(p0[0] + ox, p0[1] + oz), b = P(p1[0] + ox, p1[1] + oz); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      for (let u = 4; u < S.alleyEnd * 2; u += 3) { const p = rdoAlleyPt(A, u, [0, 0]), q = P(p[0], p[1]); ctx.fillStyle = (u / 3) % 2 < 1 ? 'rgba(220,240,255,0.55)' : 'rgba(255,150,235,0.5)'; ctx.beginPath(); ctx.arc(q[0], q[1], 0.7 * sc, 0, TAU); ctx.fill(); }
    }
  });
  // ---- the rink: a flush LED rim, the boards (cover, with gaps), the mirror ball's frame ----
  CartScene.mesh(api, 0, 0, 0, m => { m.color('#ff6ad0', 1); m.torus(0, 0.05, 0, S.rink + 0.6, 0.16, { seg: 72, tseg: 4 }); m.color('#ffffff', 0.8); m.torus(0, 0.04, 0, 9.6, 0.1, { seg: 32, tseg: 3 }); m.emissive(0); }, { noAO: true, hi: true });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, span = 0.5; CartScene.mesh(api, 0, 0, a, m => rdoBoards(m, S.boards, span), { hi: true }); for (const da of [-0.17, 0, 0.17]) { const [x, z] = ang(a + da, S.boards); E.art.push({ x, z, r: 3.2 }); } }
  CartScene.mesh(api, 0, 0, 0, rdoMast, { hi: true });
  for (let i = 0; i < 4; i++) { const [x, z] = ang(i / 4 * TAU + Math.PI / 4, 64); E.art.push({ x, z, r: 2.4 }); }
  api.sign('ROLLER DISCO', 0, -S.rink - 3, { yaw: Math.PI, h: 1.2, y: 1.6, post: true, maxW: 6, style: { bg: '#0a1830', fg: '#ffffff', border: '#ff6ad0' }, glow: '#ff6ad0' });
  api.sign('ROLLER DISCO', 0, S.rink + 3, { yaw: 0, h: 1.2, y: 1.6, post: true, maxW: 6, style: { bg: '#0a1830', fg: '#ffffff', border: '#ff6ad0' }, glow: '#ff6ad0' });
  api.light(0, 0, 54, '#b080ff', 0.85); api.light(0, 0, 26, '#d8e8ff', 0.6);
  // broad coloured light pools over the whole floor (the reef reads at night from the chase camera and from above)
  for (const [r, n] of [[78, 8], [118, 12], [156, 16]]) for (let i = 0; i < n; i++) { const [x, z] = ang((i + 0.5) / n * TAU, r); api.light(x, z, 30, S.pal[(i + n) % 6], 0.5); } for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU + 0.5, 30); api.light(x, z, 18, S.pal[i], 0.45); }
  // ---- the alleys: a conch chute at the start of each, a coral hoop at its end ----
  E.rdoAlleys = [];
  for (let i = 0; i < 4; i++) {
    const A = RDO_ALLEYS[i], p0 = rdoAlleyPt(A, -5, [0, 0]), p1 = rdoAlleyPt(A, S.alleyEnd * 2 + 5, [0, 0]), yaw = A.ax === 'z' ? (A.dir > 0 ? 0 : Math.PI) : (A.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    CartScene.mesh(api, p0[0], p0[1], yaw, drfChute, { hi: true }); CartScene.mesh(api, p1[0], p1[1], yaw + Math.PI, drfCatcher, { hi: true });
    E.art.push({ x: p0[0], z: p0[1], r: 3.4 }, { x: p1[0], z: p1[1], r: 3.4 });
    api.light(p0[0], p0[1], 12, '#ff6ad0', 0.5); api.light(p1[0], p1[1], 10, '#38f2ff', 0.45);
    for (let u = 0; u <= S.alleyEnd * 2; u += 8) { const p = rdoAlleyPt(A, u, [0, 0]), c = (u / 8) % 2 ? '#ffd84a' : '#ff6ad0'; for (const o of [-4.2, 4.2]) api.glow(p[0] + (A.ax === 'z' ? o : 0), 0.3, p[1] + (A.ax === 'x' ? o : 0), 0.7, c); if (u % 40 === 0) api.light(p[0], p[1], 14, '#c070ff', 0.4); }
    E.rdoAlleys.push({ i, A, yaw });
  }
  // ---- the outer reef: skates, the hut, coral heads, mirror lamps, kelp ----
  for (const [a, r, yaw] of [[0.55, 112, 2.2], [3.7, 115, -0.8]]) { const [x, z] = ang(a, r); CartScene.mesh(api, x, z, yaw, rdoSkate, { hi: true, scale: 1.3 }); E.art.push({ x, z, r: 5.5 }); }
  { const [x, z] = ang(2.15, 108); CartScene.mesh(api, x, z, 2.15 + Math.PI, rdoHut, { hi: true }); E.art.push({ x, z, r: 6 }); E.heroes.push({ type: 'sparklepony', x: x - Math.sin(2.15) * 7, z: z - Math.cos(2.15) * 7, yaw: 2.15 + Math.PI, anim: 'dance' }); }
  const K = DRF_KINDS, o = { night: true, dusk: false };
  for (const id of ['drf_coral', 'drf_ball', 'drf_kelp']) api.instanceProto(id, m => K[id].build(m, o), { r: K[id].r, near: K[id].near, mid: K[id].mid, farD: K[id].farD, far: K[id].far ? m => K[id].far(m, o) : null, lo: true });
  const put = (id, x, z, yaw, col, sc) => { api.instance(id, x, z, { y: 0, yaw, scale: sc || 1, tint: cartTintOf(col) }); const G = K[id].glows; if (G) for (const g of G) api.glow(x + g[0] * (sc || 1), g[1] * (sc || 1), z + g[2] * (sc || 1), g[3] * (sc || 1), col); if (K[id].pool) api.light(x, z, K[id].pool * (sc || 1), col, 0.5); };
  const clearOf = (x, z, r) => Math.abs(Math.abs(x) - S.alley) > 6 + r && Math.abs(Math.abs(z) - S.alley) > 6 + r || (Math.abs(x) > S.alleyEnd + 8 + r || Math.abs(z) > S.alleyEnd + 8 + r);
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * TAU + rng() * 0.08, r = 96 + rng() * 66, [x, z] = ang(a, r);
    if (!clearOf(x, z, 3) || E.art.some(q => Math.hypot(q.x - x, q.z - z) < q.r + 6) || Math.abs(r - 144) < 12 && Math.abs(cartWrap(a - Math.round(a / (TAU / 8)) * (TAU / 8))) < 0.12) continue;   // keep the spawns clear
    const id = i % 3 === 0 ? 'drf_ball' : i % 3 === 1 ? 'drf_coral' : 'drf_kelp', sc = id === 'drf_coral' ? 1.3 + rng() * 0.9 : 1;
    put(id, x, z, rng() * TAU, id === 'drf_kelp' ? ['#3affb0', '#5ae8ff'][i % 2] : S.pal[i % 6], sc);
    if (id === 'drf_coral') E.art.push({ x, z, r: 1.6 * sc });
  }
  // inside the alley square, between the rink and the alleys: a ring of mirror lamps
  for (let i = 0; i < 8; i++) { const [x, z] = ang(i / 8 * TAU + Math.PI / 8, 64); put('drf_ball', x, z, 0, S.pal[i % 6], 1.1); E.art.push({ x, z, r: 0.9 }); }
  // ---- the LED fence, stages, bleachers and crowd beyond it, the far city, searchlights ----
  const poly = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; poly.push([Math.sin(a) * S.R, Math.cos(a) * S.R]); }
  E.walls = poly; CartDecor.protos(E);
  for (let i = 0; i < 48; i++) { const a = poly[i], b = poly[(i + 1) % 48], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 7), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]); for (let j = 0; j < n; j++) { const u = (j + 0.5) / n, x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u), c = S.pal[Math.floor((i * n + j) / 3) % 6]; CartDecor.put(E, 'rail', x, z, yaw, c, { y: 0, noLights: true }); if (j % 2 === 0) api.glow(x, 0.98, z, 0.9, c); } }
  for (let i = 0; i < 10; i++) { const a = (i + 0.25) / 10 * TAU, [x, z] = ang(a, S.R + 22); CartDecor.put(E, i % 3 === 2 ? 'helix' : 'stage', x, z, a + Math.PI, S.pal[(i * 3) % 6], { scale: 1.1 }); }
  for (let i = 0; i < 6; i++) { const a = (i + 0.75) / 6 * TAU, [x, z] = ang(a, S.R + 8); CartScene.prop(api, 'lightTower', { x, z, aim: a + Math.PI }); api.light(x * 0.88, z * 0.88, 26, '#d8e8ff', 0.35); }
  for (const a of [0.15, 2.25, 4.35]) { const [x, z] = ang(a, S.R + 13); E.spots.push(...CartScene.bleachers(api, x, z, a + Math.PI, 22, 4, rng)); }
  E.beams = []; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4, [x, z] = ang(a, S.R + 40); E.beams.push({ kind: i % 2 ? 'laser' : 'search', x, y: 1, z, c: i % 2 ? [1, 0.4, 0.85] : [0.4, 0.9, 1], ph: i * 1.7, sp: 0.35 + i * 0.07, len: i % 2 ? 80 : 160, w: i % 2 ? 0.5 : 7, a: i % 2 ? 0.5 : 0.2 }); }
  { const R0 = 330, n = 40; for (let i = 0; i < n; i++) { const a = i / n * TAU + rng() * 0.05, r = R0 + rng() * 90; api.instance('cd_skyline', Math.sin(a) * r, Math.cos(a) * r, { y: 0, yaw: a + Math.PI, scale: 0.8 + rng() * 0.6, tint: cartTintOf(['#c8d8f0', '#d8c8f0', '#c0e0e8'][i % 3], 0.7), noCol: true }); } }
  // ---- royale spots: gifts, repair kits, spawns (off the alleys), the storm's end points ----
  for (let i = 0; i < 4; i++) { const [x, z] = ang(i / 4 * TAU + Math.PI / 4, 24); E.gifts.push({ x, z }); }
  for (let i = 0; i < 8; i++) { const [x, z] = ang(i / 8 * TAU + Math.PI / 8, 100); E.gifts.push({ x, z }); }
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU, 152); E.gifts.push({ x, z }); }
  const repairs = []; for (let i = 0; i < 6; i++) repairs.push(ang(i / 6 * TAU + 0.5, 128)); repairs.push([0, 0], ang(Math.PI / 4, 60));
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, [x, z] = ang(a, 144); E.spawn.push({ x, z, yaw: a + Math.PI / 2 }); }
  for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 30 + rng() * 135; E.orbSpots.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.zones = [{ x: 0, z: 0, r: 10, name: 'THE RINK' }]; E.flagSpots = [{ x: 0, z: 60 }]; E.captures = [{ x: 0, z: -100, r: 9 }];
  E.royale = { R: S.R - 4, x: 0, z: 0, ends: [[0, 30], [56, 56], [-56, 56], [56, -56], [-56, -56], [0, -88]], repairs, storm: { name: 'GLITTER STORM', col: '#c8a0ff' } };
  return this.finish(E);
};

/* ---------------- the arena's enemies: the disco balls, the disco beams, the roller crabs ---------------- */
CART_ARENA_RULES.rollerdisco = {
  music: 'kart3',
  onLoad(s) {
    const S = RDO;
    const D = s.rdo = { t: 0, balls: [], beams: [], crabs: [] };
    for (const h of s.heroes) if (h.h.y) h.ch.y = h.h.y;
    // moving parts: the giant mirror ball, four alley balls, six roller crabs (one group, one draw call)
    const G = new BurnsGroup(Math.min(64, BurnsGL.maxBones || 32)); D.groups = [G];
    D.big = G.add(DrfMesh.bigball, { visible: true });
    for (let i = 0; i < 4; i++) D.balls.push({ i, A: RDO_ALLEYS[i], off: 2 + i * (S.ballPeriod / 4), run: -1, fired: -1, u: -1, tele: 0, x: 0, z: 0, mask: 0, roll: 0, o: G.add(DrfMesh.ball, { visible: false }) });
    for (let i = 0; i < S.crabs; i++) D.crabs.push({ i, a: i / S.crabs * TAU, x: 0, z: 0, yaw: 0, cool: 0, o: G.add(m => DrfMesh.crab(m, i), { visible: true }) });
    G.finish();
    for (let i = 0; i < 3; i++) D.beams.push({ i, st: 'idle', t: 0, cool: 6 + i * 3.5, tgt: null, x: 0, z: 0, last: null, warned: false });
  },
  onUpdate(s, dt, racing) {
    const D = s.rdo, S = RDO; if (!D) return;
    const live = racing && s.state === 'race' && !(s.obj && s.obj.ended);
    if (!live) { D.t += dt * 0.25; return; }
    D.t += dt;
    // ---- disco balls: each alley every 19 s, staggered; 1.5 s of warning, then a 2-ton mirror ball rolls its length ----
    const len = S.alleyEnd * 2, P = s.player;
    for (const b of D.balls) {
      const tt = D.t + b.off, ph = tt % S.ballPeriod, run = Math.floor(tt / S.ballPeriod);
      b.tele = ph < S.ballTele ? ph / S.ballTele : 0;
      const u = ph < S.ballTele || D.t < 4 ? -1 : (ph - S.ballTele) * S.ballSpeed; b.u = u > len ? -1 : u;
      if (b.u >= 0 && b.fired !== run) { b.fired = run; b.mask = 0; const p = rdoAlleyPt(b.A, 0, RDO_T.p); if (P && Math.hypot(P.x - p[0], P.z - p[1]) < 70) { Sound.play('cartBoom', { vol: 0.5, pitch: 0.7 }); } }
      if (b.tele > 0 && b.tele < 0.05 && P && !P.out) { const p = rdoAlleyPt(b.A, len / 2, RDO_T.p); if (b.A.ax === 'z' ? Math.abs(P.x - p[0]) < 12 : Math.abs(P.z - p[1]) < 12) s.banner('MIRROR BALL!', '#ffb02a', 1.0, 'clear the lit alley', true); }
      if (b.u < 0) continue;
      rdoAlleyPt(b.A, b.u, RDO_T.p); b.x = RDO_T.p[0]; b.z = RDO_T.p[1]; b.roll += S.ballSpeed * dt / S.ballR;
      const dx = b.A.ax === 'x' ? b.A.dir : 0, dz = b.A.ax === 'z' ? b.A.dir : 0;
      for (const k of s.karts) {
        if (k.out || (b.mask & (1 << k.slot)) || k.y > 4) continue;
        const ex = k.x - b.x, ez = k.z - b.z; if (ex * ex + ez * ez > (S.ballR + 1.2) ** 2) continue;
        b.mask |= 1 << k.slot;
        // knocked aside, away from the ball's line
        const side = (dx ? ez : ex) >= 0 ? 1 : -1, sx = dz ? side : 0, sz = dx ? side : 0;
        s.hit(k, 'knock', null, { item: 'rdoball', dx: dx * 0.6 + sx * 0.8, dz: dz * 0.6 + sz * 0.8, power: 15, banner: 'MIRROR BALL!' });
        if (s.fx) { s.fx.burst(k.x, k.y + 1.2, k.z, 'star', 14, '#dfefff'); s.fx.spark(k.x, k.y + 1, k.z, 10, '#ffffff', 6); }
      }
    }
    // ---- disco beams: follow a car (1.6 s), stop and blink (0.6 s), flash ----
    for (const B of D.beams) {
      B.t += dt;
      if (B.st === 'idle') {
        B.cool -= dt;
        if (B.cool <= 0) {
          let best = null, bd = 1e9; for (const k of s.karts) { if (k.out || k.hidden || k.invT > 0.5 || D.beams.some(o => o.tgt === k)) continue; const r = Math.hypot(k.x, k.z); if (r > 125) continue; const sc = r + (k === B.last ? 60 : 0) + s.rng() * 40; if (sc < bd) { bd = sc; best = k; } }
          if (best) { B.st = 'follow'; B.t = 0; B.tgt = best; B.x = best.x; B.z = best.z; B.warned = false; } else B.cool = 1;
        }
      } else if (B.st === 'follow') {
        const k = B.tgt; if (k && !k.out) { B.x = lerp(B.x, k.x, 1 - Math.exp(-4 * dt)); B.z = lerp(B.z, k.z, 1 - Math.exp(-4 * dt)); }
        if (k && k.player && !B.warned) { B.warned = true; s.banner('DISCO BEAM ON YOU!', '#9ae8ff', 1.4, 'swerve when the light stops', true); }
        if (B.t > 1.6) { B.st = 'lock'; B.t = 0; Sound.play('cartSparkle', { vol: k && k.player ? 0.6 : 0.15, pitch: 1.6 }); }
      } else if (B.st === 'lock') { if (B.t > 0.6) { B.st = 'flash'; B.t = 0;
          for (const k of s.karts) { if (k.out || k.y > 4 || Math.hypot(k.x - B.x, k.z - B.z) > S.beamR + 0.5) continue; s.hit(k, 'dazzle', null, { item: 'rdobeam', banner: 'DISCO BEAM!' }); }
          const near = P && Math.hypot(P.x - B.x, P.z - B.z); Sound.play('cartSparkle', { vol: near < 40 ? 0.8 : 0.2, pitch: 1.9 }); if (s.fx) s.fx.burst(B.x, 1.5, B.z, 'star', 16, '#ffffff'); } }
      else if (B.st === 'flash' && B.t > 0.35) { B.st = 'idle'; B.last = B.tgt; B.tgt = null; B.cool = 4.5 + s.rng() * 3; }
    }
    // ---- roller crabs: lap the rink, weaving in and out; a bump spins you (hop over them) ----
    for (const c of D.crabs) {
      c.a += dt * 0.26; const r = S.crabR + Math.sin(c.a * 3 + c.i * 1.7) * 7, x = Math.sin(c.a) * r, z = Math.cos(c.a) * r;
      if (Math.hypot(x - c.x, z - c.z) > 1e-4) c.yaw = Math.atan2(x - c.x, z - c.z); c.x = x; c.z = z;
      if (c.cool > 0) { c.cool -= dt; continue; }
      for (const k of s.karts) {
        if (k.out || Math.hypot(k.x - c.x, k.z - c.z) > 2.0) continue;
        if (k.air && k.y > 0.35) { c.cool = 0.5; if (k.player) s.banner('NICE HOP!', '#7aff8a', 0.7, null, true); break; }
        c.cool = 1.6; s.hit(k, 'spin', null, { item: 'rdocrab', dur: 0.8, banner: 'ROLLER CRAB!' }); k.vx += Math.sin(c.yaw) * 5; k.vz += Math.cos(c.yaw) * 5;
        if (s.fx) s.fx.burst(c.x, 1, c.z, 'star', 8, '#ff7a5a'); break;
      }
    }
  },
  // the rink floor is slick: less grip on it (every car)
  onStep(s, k) {
    if (k.rdoG0 === undefined) k.rdoG0 = k.grip;
    k.grip = k.rdoG0 * (k.x * k.x + k.z * k.z < RDO.rink * RDO.rink ? 0.6 : 1);
  },
  render(s, R) {
    const D = s.rdo, S = RDO; if (!D) return;
    const t = s.time, B = D.big; B.x = 0; B.y = S.mirrorY; B.z = 0; B.yaw = t * 0.35; B.scale = 1.5;
    for (const b of D.balls) {
      const wait = b.u < 0, o = b.o;
      if (wait && b.tele <= 0) { o.visible = false; continue; }
      const len = S.alleyEnd * 2, u = wait ? -3 : b.u, sink = u > len - 4 ? (u - (len - 4)) / 4 : 0;
      rdoAlleyPt(b.A, u, RDO_T.q); o.visible = true; o.x = RDO_T.q[0]; o.z = RDO_T.q[1]; o.y = S.ballR * (1 - sink * 0.9) + (wait ? 0.4 + Math.sin(t * 40) * 0.05 * b.tele : 0);
      o.yaw = b.A.ax === 'z' ? Math.PI / 2 : 0; o.pitch = 0; o.roll = b.roll * b.A.dir * (b.A.ax === 'z' ? -1 : 1); o.scale = S.ballR * (1 - sink * 0.5);
    }
    for (const c of D.crabs) { const o = c.o, hurt = c.cool > 0.8 ? (1.6 - c.cool) * 12 : 0; o.x = c.x; o.y = Math.abs(Math.sin(t * 6 + c.i)) * 0.12; o.z = c.z; o.yaw = c.yaw + hurt; o.roll = Math.sin(t * 3 + c.i) * 0.18; o.scale = 1.5; }
    for (const G of D.groups) { G.pose(s.cam); R.skin(G.geo, G.bones, G.objs.length, null, 0, 0.5); }
  },
  draw(s, R, Sp, t) {
    const D = s.rdo, S = RDO; if (!D) return;
    const cam = s.cam, len = S.alleyEnd * 2;
    // the giant ball's halo and the light spots it throws round the rink
    R.bbs.bb(0, S.mirrorY, 0, 18, 18, Sp.glow, S.ice, 0.4, true);
    if (Math.hypot(cam.x, cam.z) < 170) for (let i = 0; i < 40; i++) { const r = 8 + (i % 8) * 5, a = s.time * 0.35 * (i % 2 ? 1 : 0.8) + i * 2.39, x = Math.sin(a) * r, z = Math.cos(a) * r; R.flat.flat(x, 0.08, z, 1.8, 1.8, 0, Sp.glow, burnsRGBf(S.pal[i % 6]), 0.5, true); }
    // the alleys: running chevrons in the warning, the lit path ahead of a rolling ball, its halo and glints
    for (const b of D.balls) {
      const vertical = b.A.ax === 'z', yaw = vertical ? 0 : Math.PI / 2;
      if (b.tele > 0) { const fl = 0.45 + 0.55 * Math.max(0, Math.sin(t * 20)); for (let u = 0; u < len; u += 4) { rdoAlleyPt(b.A, u, RDO_T.q); if ((RDO_T.q[0] - cam.x) ** 2 + (RDO_T.q[1] - cam.z) ** 2 > 160 * 160) continue; const w = ((u / 4 - t * 6) % 3 + 3) % 3 < 1 ? 1 : 0.45; R.flat.flat(RDO_T.q[0], 0.1, RDO_T.q[1], 7.5, 2.6, yaw, Sp.square, S.warn, 0.6 * b.tele * fl * w, true); } rdoAlleyPt(b.A, 0, RDO_T.q); R.bbs.bb(RDO_T.q[0], 2.6, RDO_T.q[1], 7 + b.tele * 5, 7 + b.tele * 5, Sp.glow, S.pink, 0.7 * b.tele, true); }
      if (b.u >= 0) {
        for (let u = b.u + 4, n = 0; u < len && n < 14; u += 4, n++) { rdoAlleyPt(b.A, u, RDO_T.q); R.flat.flat(RDO_T.q[0], 0.1, RDO_T.q[1], 7, 2.4, yaw, Sp.square, S.amber, 0.32 * (1 - n / 14), true); }
        R.flat.flat(b.x, 0.06, b.z, 5.5, 5.5, 0, Sp.shadow, S.black, 0.5, false);
        R.bbs.bb(b.x, S.ballR, b.z, 8, 8, Sp.glow, S.ice, 0.4, true);
        for (let i = 0; i < 4; i++) { const a = t * 2.3 + i * 1.57; R.bbs.bb(b.x + Math.cos(a) * 1.7, S.ballR + Math.sin(a * 1.7) * 1.4, b.z + Math.sin(a) * 1.7, 1.3, 1.3, Sp.star, S.white, 0.5 + 0.5 * Math.sin(t * 13 + i * 2), true, t * 2 + i); }
      }
    }
    // the beams: a shaft from the ball to the spot; pale while following, amber blinking when locked, white on the flash
    for (const B of D.beams) {
      if (B.st === 'idle') continue;
      const lk = B.st === 'lock', fl = B.st === 'flash', bl = lk ? (Math.floor(t * 9) % 2 ? 1 : 0.35) : 1, col = fl ? S.white : lk ? S.amber : S.ice, Rr = S.beamR * 2;
      R.flat.flat(B.x, 0.09, B.z, Rr * (fl ? 1.6 : 1.15), Rr * (fl ? 1.6 : 1.15), 0, Sp.glow, col, fl ? 1 : lk ? 0.6 * bl : 0.4, true);
      R.flat.flat(B.x, 0.11, B.z, Rr, Rr, t * (lk ? 0 : 1.5), Sp.reticle || Sp.ring, col, fl ? 1 : lk ? 0.95 * bl : 0.55, true);
      if (B.st === 'follow') { const r = Rr * (1 + (1 - Math.min(1, B.t / 1.6)) * 1.2); R.flat.flat(B.x, 0.12, B.z, r, r, 0, Sp.ring, S.ice, 0.5, true); }
      const bx = B.x, by = -S.mirrorY, bz = B.z; R.bbs.streak(bx * 0.5, S.mirrorY * 0.5, bz * 0.5, bx, by, bz, Math.hypot(bx, by, bz), fl ? 4 : 1.8, Sp.streak, col, fl ? 0.9 : 0.35);
    }
    for (const c of D.crabs) { R.flat.flat(c.x, 0.09, c.z, 4.4, 4.4, 0, Sp.ring, S.crab, 0.55, true); R.flat.flat(c.x, 0.08, c.z, 4.8, 4.8, 0, Sp.glow, S.crab, 0.3, true); }
    // bubbles drifting up round the camera
    for (let i = 0; i < 22; i++) { const x = cam.x + ((i * 37) % 70) - 35, z = cam.z + ((i * 53) % 70) - 35, y = (t * (0.9 + (i % 4) * 0.25) + i * 1.3) % 14, w = 0.25 + (i % 3) * 0.15; R.bbs.bb(x + Math.sin(t * 2 + i) * 0.4, y, z, w, w, Sp.ring, S.ice, 0.35 * (1 - y / 14), true); }
  },
  lights(s, add) {
    const D = s.rdo; if (!D) return;
    add(0, RDO.mirrorY - 3, 0, 40, RDO.violet, 1.1, 1.5);
    for (const b of D.balls) if (b.u >= 0) add(b.x, 3, b.z, 12, RDO.ice, 1.2, 1.5);
    for (const B of D.beams) if (B.st !== 'idle') add(B.x, 2.5, B.z, 12, B.st === 'flash' ? RDO.white : B.st === 'lock' ? RDO.amber : RDO.ice, B.st === 'flash' ? 2.4 : 1, 2);
  },
  radar(s, ctx, P, sc) {
    const q = CART_ROY_T.p; P(0, 0, q); ctx.strokeStyle = 'rgba(255,106,208,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x, q.y, RDO.rink * sc, 0, TAU); ctx.stroke();
    const D = s.rdo; ctx.lineWidth = 2;
    for (const b of (D ? D.balls : [])) { const p0 = rdoAlleyPt(b.A, 0, RDO_T.q); P(p0[0], p0[1], q); const x0 = q.x, y0 = q.y; const p1 = rdoAlleyPt(b.A, RDO.alleyEnd * 2, RDO_T.q); P(p1[0], p1[1], q); ctx.strokeStyle = b.u >= 0 || b.tele > 0 ? 'rgba(255,176,42,0.85)' : 'rgba(255,216,74,0.25)'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(q.x, q.y); ctx.stroke(); if (b.u >= 0) { P(b.x, b.z, q); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(q.x, q.y, 3, 0, TAU); ctx.fill(); } }
  }
};

/* ---------------- the registry ---------------- */
CART_ARENAS.push({
  id: 'rollerdisco', name: 'ROLLER DISCO', sub: 'Battle royale: a slick rink, rolling mirror balls, disco beams', objectives: ['royale'], royale: true, levelCar: 'fish',
  col: '#5ae8ff', tod: 'night', blurb: 'Glitterfin\'s rink on the reef. Cross the alleys between the mirror balls, swerve the disco beams, hop the roller crabs. Last car rolling wins.'
});
CART_ROYALE_ARENAS.fish = 'rollerdisco';
CART_ARENA_ICONS.rollerdisco = (ctx, s, t, col) => {
  // a turning mirror ball with a sparkle
  ctx.save(); const r = s * 0.72;
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#a8c8e8'); g.addColorStop(1, '#3a4a7a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip(); ctx.strokeStyle = 'rgba(20,30,60,0.55)'; ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(-r, i * r / 3.5); ctx.lineTo(r, i * r / 3.5); ctx.stroke(); }
  const sp = (t * 0.6) % 1; for (let i = -4; i <= 4; i++) { const x = Math.sin((i / 4 + sp / 2) * Math.PI / 2) * r; ctx.beginPath(); ctx.ellipse(0, 0, Math.abs(x), r, 0, 0, TAU); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  const tw = 0.6 + 0.4 * Math.sin(t * 5); ctx.fillStyle = `rgba(255,255,255,${tw.toFixed(3)})`; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, rr = i % 2 ? r * 0.08 : r * 0.42; ctx.lineTo(r * 0.45 + Math.cos(a) * rr, -r * 0.45 + Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
  ctx.restore();
};
