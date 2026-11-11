/* ============================================================
   ART CART — royale arena: THE SOUND CAMP (id 'sound', Bass Valentine's arena)
   A night-time sound camp the size of a small town. In the middle the HEART BOOTH (a DJ deck under a giant beating
   heart) on an LED DANCE FLOOR that pulses to the beat; a ring of six GIANT SUBS; a ring of SPEAKER WALLS with
   HEART ARCHES in the gaps (cover, sight-line breakers, the way through); speaker stacks, lounges and kickers on the
   outer playa; sound stages, lasers and searchlights beyond the LED fence.
   Its enemies (all telegraphed, all readable on a phone):
     · DANCE FLOOR: every two bars a pattern of tiles blinks AMBER (1.4 s), then flares HOT PINK: 9 HP and a slide
     · GIANT SUBS: a sub's cone pumps and an amber ring blinks round it (1.5 s), then a BASS WAVE shoves cars away (10 HP)
     · CUPID DRONES: a flying heart with wings locks a pink target onto a car (1.3 s), holds it still (0.4 s: swerve!),
       then drops a LOVE BOMB: lovestruck and 12 HP
   HEART THROB (Bass Valentine's special) is in everyone's gift boxes here (arena levelCar → the scene's poolCar).
   Everything here is an original design. Registers itself (see 43_cart_a_data.js, 43_cart_i_royale.js).
   ============================================================ */
const CART_SND = {
  R: 182, floor0: 10, floor1: 47, tile: 4.4, booth: 8.4, bpm: 126,
  subR: 70, subN: 6, wallR: 120, wallN: 6, wallSpan: 0.29, archR: 120,
  pal: [[1, 0.25, 0.6], [0.3, 0.9, 1], [1, 0.85, 0.3], [0.6, 0.35, 1], [1, 0.45, 0.25], [0.4, 1, 0.55]],
  warn: [1, 0.7, 0.15], hot: [1, 0.2, 0.55], white: [1, 1, 1], black: [0, 0, 0], pink: [1, 0.3, 0.6], amber: [1, 0.66, 0.2], purple: [0.66, 0.35, 1]
};
// the heart outline (x, y): 16 sin³t, 13 cos t − 5 cos 2t − 2 cos 3t − cos 4t (top dip at t = 0, tip at t = π)
const cartSndHeartXY = (t, out) => { const s = Math.sin(t); out[0] = 16 * s * s * s; out[1] = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); return out; };
function cartSndHeartPts(sc, n) { const o = [0, 0], pts = []; for (let i = 0; i < n; i++) { cartSndHeartXY(i / n * TAU, o); pts.push([o[0] * sc, o[1] * sc]); } return pts.reverse(); }
function cartSndHeart(m, sc, depth) { m.extrude(cartSndHeartPts(sc, 32), depth, { convex: false }); }

/* ---------------- a heart arch you drive through: a neon heart cut off below its lobes ---------------- */
function cartSndArch(api, x, z, yaw, sc, col, night) {
  // the cut: keep the curve above y = -9 (heart units) → two feet on the ground, the lobes on top
  let t1 = 0; const o = [0, 0]; for (let t = 0; t < Math.PI; t += 0.002) { cartSndHeartXY(t, o); if (o[1] < -9) { t1 = t; break; } }
  const N = 44, P = []; for (let i = 0; i <= N; i++) { const t = -t1 + 2 * t1 * i / N; cartSndHeartXY(t, o); P.push([o[0] * sc, (o[1] + 9) * sc]); }
  const lights = [];
  CartScene.mesh(api, x, z, yaw, m => {
    // a dark steel backbone, the neon tube in front of it, white bulbs along the inside edge
    m.color('#2a2434').shine(2); for (let i = 0; i < N; i++) m.limb(P[i][0], P[i][1], -0.25, P[i + 1][0], P[i + 1][1], -0.25, 0.32, 0.32, { seg: 7 });
    m.color(col, night ? 1 : 0.6).shine(2); for (let i = 0; i < N; i++) m.limb(P[i][0], P[i][1], 0.12, P[i + 1][0], P[i + 1][1], 0.12, 0.2, 0.2, { seg: 7 });
    m.color('#ffffff', 1); for (let i = 1; i < N; i += 2) { const dx = P[i + 1][0] - P[i - 1][0], dy = P[i + 1][1] - P[i - 1][1], l = Math.hypot(dx, dy) || 1; m.ball(P[i][0] + dy / l * 0.42, P[i][1] - dx / l * 0.42, 0.12, 0.12, { seg: 6, rings: 4 }); }
    m.emissive(0);
    // feet: rounded concrete blocks with an LED band
    m.color('#3a3442').shine(1); for (const p of [P[0], P[N]]) { m.roundBox(p[0], 0.5, 0, 1.6, 1.0, 1.6, 0.25); } m.color(col, 0.9); for (const p of [P[0], P[N]]) m.roundBox(p[0], 0.9, 0, 1.64, 0.12, 1.64, 0.05); m.emissive(0).shine(0);
    for (let i = 0; i <= N; i += 6) lights.push({ x: P[i][0], y: P[i][1], z: 0.3, s: 1.1, c: col });
    return { cols: [{ t: 'cyl', x: P[0][0], z: 0, r: 0.95, y0: 0, y1: 5 }, { t: 'cyl', x: P[N][0], z: 0, r: 0.95, y0: 0, y1: 5 }], lights };
  }, { hi: true, noAO: true });
  if (night) { api.light(x, z, 13 * sc / 0.5, col, 0.55); const c = Math.cos(yaw), s = Math.sin(yaw); for (let i = 4; i < N; i += 8) api.glow(x + P[i][0] * c, P[i][1], z - P[i][0] * s, 1.5, col); }
  return { x0: x + P[0][0] * Math.cos(yaw), z0: z - P[0][0] * Math.sin(yaw), x1: x + P[N][0] * Math.cos(yaw), z1: z - P[N][0] * Math.sin(yaw) };
}

/* ---------------- the world ---------------- */
CartWorlds.arena_sound = function (A, night) {
  const S = CART_SND, E = this.base(2101, [-235, -235, 235, 235], '#3a2e44', 0.03);
  const sky = Object.assign(CART_SKIES.night(), { sky: '#5a3a8a', hor: '#7a2a6a', fog: '#2a1636', fogD: 0.0042, mid: '#3a1a4a', midK: 0.4, cityK: 0.9, emB: 1.9, keyK: 0.5, key: '#d8c0ff' });
  Object.assign(E, { id: 'sound', arena: A, sky, tod: 'night', music: 'kart1', night: true, R: S.R });
  const api = E.api, T = E.terrain, rng = mulberry32(2101);
  const ang = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
  const subA = i => (i + 0.5) / S.subN * TAU, wallA = i => i / S.wallN * TAU, gapA = i => (i + 0.5) / S.wallN * TAU;
  // ---- ground paint: the dance floor (dark glossy tiles in rings), pink lanes through the arches, confetti specks ----
  api.paint((ctx, P, sc) => {
    for (let i = 0; i < 420; i++) { const x = (rng() - 0.5) * 460, z = (rng() - 0.5) * 460, q = P(x, z); ctx.fillStyle = `rgba(${rng() < 0.5 ? '30,20,40' : '120,90,130'},${0.05 + rng() * 0.08})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (2 + rng() * 9) * sc, (1 + rng() * 5) * sc, rng() * 3, 0, TAU); ctx.fill(); }
    // lanes: from the floor out through each arch gap (soft pink carpet)
    ctx.lineCap = 'round';
    for (let i = 0; i < S.wallN; i++) { const a = gapA(i), p0 = P(...ang(a, S.floor1 + 4)), p1 = P(...ang(a, S.R - 8)); ctx.strokeStyle = 'rgba(255,90,170,0.16)'; ctx.lineWidth = 12 * sc; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); ctx.strokeStyle = 'rgba(255,180,220,0.22)'; ctx.lineWidth = 0.35 * sc; for (const off of [-5.4, 5.4]) { const c = Math.cos(a), s = Math.sin(a), q0 = P(Math.sin(a) * (S.floor1 + 4) + c * off, Math.cos(a) * (S.floor1 + 4) - s * off), q1 = P(Math.sin(a) * (S.R - 8) + c * off, Math.cos(a) * (S.R - 8) - s * off); ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); } }
    // the floor: a black glossy disc, the tile seams, a pink rim
    const c0 = P(0, 0); ctx.fillStyle = '#120c18'; ctx.beginPath(); ctx.arc(c0[0], c0[1], (S.floor1 + 1) * sc, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(160,120,200,0.35)'; ctx.lineWidth = 0.18 * sc;
    for (let r = S.floor0; r <= S.floor1 + 0.1; r += S.tile) { ctx.beginPath(); ctx.arc(c0[0], c0[1], r * sc, 0, TAU); ctx.stroke(); }
    for (let i = 0; i < Math.floor((S.floor1 - S.floor0) / S.tile); i++) { const rr = S.floor0 + (i + 0.5) * S.tile, n = Math.round(TAU * rr / S.tile); for (let j = 0; j < n; j++) { const a = j / n * TAU, p = P(...ang(a, rr - S.tile / 2)), q = P(...ang(a, rr + S.tile / 2)); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); } }
    ctx.strokeStyle = 'rgba(255,79,170,0.7)'; ctx.lineWidth = 0.8 * sc; ctx.beginPath(); ctx.arc(c0[0], c0[1], (S.floor1 + 0.6) * sc, 0, TAU); ctx.stroke();
    // little painted hearts scattered on the playa
    for (let i = 0; i < 60; i++) { const a = rng() * TAU, r = 55 + rng() * 120, q = P(...ang(a, r)), h = (0.8 + rng() * 1.4) * sc; ctx.fillStyle = `rgba(255,${80 + Math.floor(rng() * 80)},170,0.28)`; ctx.beginPath(); ctx.moveTo(q[0], q[1] + h); ctx.bezierCurveTo(q[0] - h * 1.6, q[1] - h * 0.2, q[0] - h * 0.6, q[1] - h * 1.4, q[0], q[1] - h * 0.45); ctx.bezierCurveTo(q[0] + h * 0.6, q[1] - h * 1.4, q[0] + h * 1.6, q[1] - h * 0.2, q[0], q[1] + h); ctx.fill(); }
  });
  // ---- the floor's LED rim (flush, no collider) and the HEART BOOTH ----
  CartScene.mesh(api, 0, 0, 0, m => { m.color('#ff4fa8', 1); m.torus(0, 0.05, 0, S.floor1 + 0.6, 0.16, { seg: 72, tseg: 4 }); m.color('#ffffff', 0.8); m.torus(0, 0.04, 0, S.floor0 - 0.4, 0.1, { seg: 32, tseg: 3 }); m.emissive(0); }, { noAO: true, hi: true });
  CartScene.mesh(api, 0, 0, 0, m => {
    const lights = [];
    m.color('#241c2c').shine(2); m.lathe([[S.booth, 0], [S.booth, 1.2], [S.booth - 0.3, 1.6], [0, 1.6]], { seg: 28 });
    m.color('#ff2a6a', 1); m.torus(0, 1.25, 0, S.booth + 0.02, 0.09, { seg: 40, tseg: 4 }); m.color('#38f2ff', 1); m.torus(0, 0.5, 0, S.booth + 0.02, 0.07, { seg: 40, tseg: 4 }); m.emissive(0);
    // speaker stacks round the rim, cones facing out
    for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU; m.push(); m.tf(Math.sin(a) * (S.booth - 1.2), 1.6, Math.cos(a) * (S.booth - 1.2), a); m.color('#16121a').shine(1); m.roundBox(0, 1.0, 0, 2.0, 2.0, 1.4, 0.15); m.color('#2e2834').shine(2); m.push(); m.tf(0, 1.0, 0.7, 0, Math.PI / 2, 0); m.lathe([[0.75, 0], [0.55, -0.12], [0.18, -0.25], [0, -0.22]], { seg: 14 }); m.pop(); m.color('#ffffff', 0.9); m.push(); m.tf(0, 1.0, 0.71, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.78, 0.05, { seg: 16, tseg: 3 }); m.pop(); m.emissive(0).shine(0); m.pop(); }
    // the DJ deck
    m.color('#3a3048').shine(2); m.roundBox(0, 2.15, -1.6, 4.2, 1.1, 1.3, 0.2); m.color('#ff4fa8', 1); m.roundBox(0, 2.72, -1.6, 4.0, 0.06, 1.1, 0.03); m.emissive(0);
    // the truss tower: four legs rising to the heart, cross-braced
    m.color('#cfd2da').shine(3); const H = 13.5, w0 = 3.2, w1 = 1.2;
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4, b = (i + 1) / 4 * TAU + Math.PI / 4; m.limb(Math.sin(a) * w0, 1.6, Math.cos(a) * w0, Math.sin(a) * w1, H, Math.cos(a) * w1, 0.13, 0.1, { seg: 6 }); for (let k = 0; k < 4; k++) { const y0 = 1.6 + k * (H - 1.6) / 4, y1 = y0 + (H - 1.6) / 4, r0 = lerp(w0, w1, k / 4), r1 = lerp(w0, w1, (k + 1) / 4); m.limb(Math.sin(a) * r0, y0, Math.cos(a) * r0, Math.sin(b) * r1, y1, Math.cos(b) * r1, 0.05, 0.05, { seg: 4 }); } }
    m.shine(0);
    for (let i = 0; i < 6; i++) lights.push({ x: Math.sin(i) * S.booth, y: 1.3, z: Math.cos(i) * S.booth, s: 1.2, c: i % 2 ? '#ff2a6a' : '#38f2ff' });
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ff4fa8', pool: 22 });
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: S.booth + 0.3, y0: 0, y1: 4 }], lights };
  }, { hi: true });
  api.sign('THE SOUND CAMP', 0, -S.booth - 0.2, { yaw: Math.PI, h: 0.9, y: 0.35, post: false, maxW: 6, style: { bg: '#1a0a24', fg: '#ffffff', border: '#ff4fa8' }, glow: '#ff4fa8' });
  api.sign('THE SOUND CAMP', 0, S.booth + 0.2, { yaw: 0, h: 0.9, y: 0.35, post: false, maxW: 6, style: { bg: '#1a0a24', fg: '#ffffff', border: '#ff4fa8' }, glow: '#ff4fa8' });
  api.light(0, 0, 54, '#ff3a8a', 0.55); api.light(0, 0, 26, '#ffd0f0', 0.35);
  E.art.push({ x: 0, z: 0, r: S.booth + 0.6 });
  E.heroes.push({ type: 'annoyingdj', x: 0, z: -1.6 - 1.4, yaw: Math.PI, anim: 'dj', y: 1.6 }, { type: 'sparklepony', x: -2.6, z: 2.4, yaw: 0, anim: 'dance', y: 1.6 }, { type: 'furry', x: 2.6, z: 2.6, yaw: 0.3, anim: 'dance', y: 1.6 });
  // ---- the six GIANT SUBS (the cone is a moving part, drawn by the rules) ----
  E.subs = [];
  for (let i = 0; i < S.subN; i++) {
    const a = subA(i), [x, z] = ang(a, S.subR), yaw = a + Math.PI;   // cone faces the dance floor
    CartScene.mesh(api, x, z, yaw, m => {
      m.color('#18141e').shine(1); m.roundBox(0, 3.9, 0, 7.6, 7.8, 6.0, 0.45);
      m.color('#2a2432').shine(1); m.roundBox(0, 3.9, 2.98, 6.9, 7.1, 0.12, 0.2);   // the grille plate
      m.color('#0c0a10'); m.push(); m.tf(0, 3.9, 3.0, 0, Math.PI / 2, 0); m.lathe([[3.05, 0], [3.05, -0.6], [0, -0.7]], { seg: 32 }); m.pop();   // the cone's well
      m.color('#ff4fa8', 1); m.push(); m.tf(0, 3.9, 3.06, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 3.15, 0.12, { seg: 40, tseg: 4 }); m.pop();
      m.color('#9a6bff', 1); for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.limb(sx * 3.83, 0.4, sz * 2.98, sx * 3.83, 7.5, sz * 2.98, 0.07, 0.07, { seg: 5 }); for (const sz of [-1, 1]) m.limb(-3.7, 7.83, sz * 2.98, 3.7, 7.83, sz * 2.98, 0.07, 0.07, { seg: 5 }); for (const sx of [-1, 1]) m.limb(sx * 3.83, 7.83, -2.9, sx * 3.83, 7.83, 2.9, 0.07, 0.07, { seg: 5 }); m.emissive(0).shine(0);
      m.color('#3a3442').shine(2); for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.roundCyl(sx * 3.2, 0, sz * 2.4, 0.45, 0.35, 0.1); m.shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 3.9, hz: 3.1, y0: 0, y1: 7.8 }], lights: [{ x: 0, y: 3.9, z: 3.3, s: 2.4, c: '#ff4fa8' }] };
    }, { hi: true });
    api.light(x, z, 18, '#9a4aff', 0.5);
    E.subs.push({ x, z, yaw, a, cx: x + Math.sin(yaw) * 3.1, cz: z + Math.cos(yaw) * 3.1 });
    E.art.push({ x, z, r: 5.0 });
  }
  // ---- the SPEAKER WALLS (instanced stacks) with HEART ARCHES in the gaps ----
  api.instanceProto('snd_stack', m => {
    // 6 m wide, 5.4 m tall, 2.6 m deep; the front (+z) faces the dance floor. Built near-white where the tint should show.
    m.color('#1c1822').shine(1); for (const sx of [-1.5, 1.5]) for (const y of [1.35, 4.05]) m.roundBox(sx, y, 0, 2.9, 2.6, 2.6, 0.16);
    for (const sx of [-1.5, 1.5]) for (const y of [1.35, 4.05]) {
      m.color('#2c2634').shine(2); m.push(); m.tf(sx, y, 1.3, 0, Math.PI / 2, 0); m.lathe([[1.0, 0], [0.78, -0.16], [0.3, -0.34], [0.12, -0.3], [0, -0.32]], { seg: m.lo ? 10 : 18 }); m.pop();
      m.color('#ffffff', 1); m.push(); m.tf(sx, y, 1.32, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 1.05, 0.06, { seg: m.lo ? 10 : 20, tseg: 3 }); m.pop(); m.emissive(0);
      m.color('#3a3442').shine(2); m.ball(sx, y, 1.18, 0.16, { seg: 8, rings: 5 }); m.shine(0);
    }
    m.color('#ffffff', 0.9); m.roundBox(0, 5.42, 1.0, 5.9, 0.08, 0.3, 0.03); m.roundBox(0, 0.06, 1.2, 5.9, 0.08, 0.2, 0.03); m.emissive(0);
    m.color('#141018'); m.roundBox(0, 2.7, -1.31, 5.6, 5.0, 0.06, 0.03); m.color('#ffffff', 0.6); for (let i = 0; i < 5; i++) m.box(-2.4 + i * 1.2, 2.7, -1.36, 0.08, 4.2, 0.03); m.emissive(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 3.0, hz: 1.35, y0: 0, y1: 5.4 }] };
  }, { r: 4.2, near: 40, mid: 130, farD: 360, lo: true, far: m => { m.color('#1c1822'); m.box(0, 2.7, 0, 5.9, 5.4, 2.6); m.color('#ffffff', 1); m.box(0, 5.42, 1.0, 5.9, 0.1, 0.3); for (const sx of [-1.5, 1.5]) for (const y of [1.35, 4.05]) m.box(sx, y, 1.32, 1.6, 1.6, 0.05); m.emissive(0); } });
  const stack = (x, z, yaw, col) => { api.instance('snd_stack', x, z, { y: 0, yaw, tint: cartTintOf(col) }); E.art.push({ x, z, r: 3.1 }); };
  E.walls_ = [];
  for (let i = 0; i < S.wallN; i++) {
    const a0 = wallA(i), col = BURNS_NEON[(i * 2) % 7], n = 11;
    for (let j = 0; j < n; j++) { const a = a0 + (j / (n - 1) - 0.5) * 2 * S.wallSpan, [x, z] = ang(a, S.wallR); stack(x, z, a + Math.PI, j % 2 ? col : '#ff4fa8'); }
    E.walls_.push(a0);
    // the wall's crown: a laser fan and a light pool on each side
    const [bx, bz] = ang(a0, S.wallR); E.beams = E.beams || []; E.beams.push({ kind: 'laser', x: bx, y: 3, z: bz, c: burnsRGBf(col), ph: i * 1.3, sp: 0.5 + i * 0.05, len: 80, w: 0.5, a: 0.5 });
    { const [lx, lz] = ang(a0, S.wallR - 9); api.light(lx, lz, 22, col, 0.45); const [ox, oz] = ang(a0, S.wallR + 9); api.light(ox, oz, 18, col, 0.3); }
  }
  for (let i = 0; i < S.wallN; i++) { const a = gapA(i), [x, z] = ang(a, S.archR); cartSndArch(api, x, z, a + Math.PI / 2, 0.5, i % 2 ? '#ff2a6a' : '#ff6ad0', true); }
  // three smaller arches on the floor's edge, between the subs
  for (let i = 0; i < 3; i++) { const a = wallA(i * 2), [x, z] = ang(a, S.floor1 + 9); cartSndArch(api, x, z, a + Math.PI / 2, 0.36, '#ff9ad8', true); }
  // ---- cover on the playa: speaker clusters, chill domes, kickers, dunes ----
  for (let i = 0; i < S.wallN; i++) {
    const a = wallA(i); { const [x, z] = ang(a + 0.12, 92); stack(x, z, a + Math.PI + 0.5, BURNS_NEON[i % 7]); const [x2, z2] = ang(a - 0.12, 92); stack(x2, z2, a + Math.PI - 0.5, BURNS_NEON[(i + 3) % 7]); }
    const b = gapA(i) + 0.32; { const [x, z] = ang(b, 152); stack(x, z, b + 0.6, BURNS_NEON[(i + 1) % 7]); const [x2, z2] = ang(b + 0.05, 159); stack(x2, z2, b + 2.2, '#ff4fa8'); }
  }
  for (let i = 0; i < 3; i++) { const a = wallA(i * 2 + 1) + 0.18, [x, z] = ang(a, 160); CartScene.prop(api, 'dome', { x, z, r: 5.5, lights: true, glow: '#ff6ad0', freq: 2, seed: 30 + i }); E.art.push({ x, z, r: 5.9 }); api.light(x, z, 13, '#ff6ad0', 0.5); }
  for (let i = 0; i < 4; i++) { const a = gapA(i * 1.5 | 0) + 0.85 + i * 0.1, [x, z] = ang(a, 140); T.add(CartFeat.ramp(x, z, a + Math.PI / 2 * (i % 2 ? 1 : -1), 6, 7, 2.0, { col: '#3a2e44', stripe: i % 2 ? '#ff4fa8' : '#38f2ff' })); }
  for (const [a, r] of [[0.9, 168], [3.0, 166], [5.2, 170]]) T.add(CartFeat.mound(Math.sin(a) * r, Math.cos(a) * r, 13, 2.6, { col: '#4a3a52' }));
  // ---- the LED fence, sound stages and crowds beyond it, the far city ----
  const poly = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; poly.push([Math.sin(a) * S.R, Math.cos(a) * S.R]); }
  E.walls = poly; CartDecor.protos(E);
  for (let i = 0; i < 48; i++) { const a = poly[i], b = poly[(i + 1) % 48], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 7), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]); for (let j = 0; j < n; j++) { const u = (j + 0.5) / n, x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u), c = BURNS_NEON[Math.floor((i * n + j) / 3) % 7]; CartDecor.put(E, 'rail', x, z, yaw, c, { y: 0, noLights: true }); if (j % 2 === 0) api.glow(x, 0.98, z, 0.9, c); } }
  for (let i = 0; i < 10; i++) { const a = (i + 0.25) / 10 * TAU, [x, z] = ang(a, S.R + 22); CartDecor.put(E, i % 3 === 2 ? 'helix' : 'stage', x, z, a + Math.PI, BURNS_NEON[(i * 3) % 7], { scale: 1.1 }); }
  for (let i = 0; i < 6; i++) { const a = (i + 0.75) / 6 * TAU, [x, z] = ang(a, S.R + 8); CartScene.prop(api, 'lightTower', { x, z, aim: a + Math.PI }); api.light(x * 0.88, z * 0.88, 26, '#e8d8ff', 0.35); }
  for (const a of [0.55, 2.65, 4.75]) { const [x, z] = ang(a, S.R + 13); E.spots.push(...CartScene.bleachers(api, x, z, a + Math.PI, 22, 4, rng)); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4, [x, z] = ang(a, S.R + 40); E.beams.push({ kind: 'search', x, y: 1, z, c: [1, 0.55, 0.85], ph: i * 1.7, sp: 0.35 + i * 0.07, len: 160, w: 7, a: 0.2 }); }
  { const R0 = 330, n = 40; for (let i = 0; i < n; i++) { const a = i / n * TAU + rng() * 0.05, r = R0 + rng() * 90; api.instance('cd_skyline', Math.sin(a) * r, Math.cos(a) * r, { y: 0, yaw: a + Math.PI, scale: 0.8 + rng() * 0.6, tint: cartTintOf(['#d8d0c8', '#c8c4d8', '#e0d0c0'][i % 3], 0.7), noCol: true }); } }
  // ---- royale spots: gift boxes, repair kits, spawns, the storm's end points ----
  for (let i = 0; i < 4; i++) { const [x, z] = ang(i / 4 * TAU + Math.PI / 4, 30); E.gifts.push({ x, z }); }
  for (let i = 0; i < S.wallN; i++) { const [x, z] = ang(wallA(i), 98); E.gifts.push({ x, z }); const [x2, z2] = ang(gapA(i) + 0.15, 150); E.gifts.push({ x: x2, z: z2 }); }
  const repairs = []; for (let i = 0; i < S.wallN; i++) { const a = gapA(i) - 0.22; repairs.push(ang(a, 140)); } repairs.push(ang(Math.PI / 2, 40), ang(-Math.PI / 2, 40));
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, [x, z] = ang(a, 146); E.spawn.push({ x, z, yaw: a + Math.PI / 2 }); }
  for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 55 + rng() * 115; E.orbSpots.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.zones = [{ x: 0, z: 0, r: 10, name: 'THE HEART BOOTH' }]; E.flagSpots = [{ x: 0, z: 60 }]; E.captures = [{ x: 0, z: -90, r: 9 }];
  E.royale = {
    R: S.R - 4, x: 0, z: 0, ends: [0, 1, 2, 3, 4, 5].map(i => ang(wallA(i), 88)), repairs, storm: { name: 'DUST STORM', col: '#ffb870' },
    avoid: [[0, 0, S.floor1 - 4]],   // roaming AI keep off the dance floor (hunting AI still cross it)
    // a straight line that crosses the speaker-wall ring outside an arch gap is sent through the nearest gap
    route(x0, z0, tx, tz, G) {
      const r0 = Math.hypot(x0, z0), r1 = Math.hypot(tx, tz), W = S.wallR;
      if ((r0 - W) * (r1 - W) >= 0 || Math.abs(r0 - W) < 2) return false;
      const u = (W - r0) / (r1 - r0), cx = lerp(x0, tx, u), cz = lerp(z0, tz, u), a = Math.atan2(cx, cz);
      let best = 0, bd = 9; for (let i = 0; i < S.wallN; i++) { const d = Math.abs(cartWrap(a - wallA(i))); if (d < S.wallSpan + 0.06 && d < bd) { bd = d; best = i; } }
      if (bd === 9) return false;
      const w = wallA(best), g = cartWrap(a - w) > 0 ? w + TAU / S.wallN / 2 : w - TAU / S.wallN / 2, side = r0 < W ? -6 : 6;
      const nearGap = Math.hypot(x0 - Math.sin(g) * W, z0 - Math.cos(g) * W) < 11;
      const rr = nearGap ? W - side * 1.5 : W + side; G[0] = Math.sin(g) * rr; G[1] = Math.cos(g) * rr; return true;
    }
  };
  return this.finish(E);
};

/* ---------------- the arena's enemies: the floor, the subs, the cupid drones ---------------- */
function cartSndTiles() {
  const S = CART_SND, tiles = [];
  const nr = Math.floor((S.floor1 - S.floor0) / S.tile);
  for (let i = 0; i < nr; i++) { const rr = S.floor0 + (i + 0.5) * S.tile, n = Math.round(TAU * rr / S.tile); for (let j = 0; j < n; j++) { const a = (j + 0.5) / n * TAU; tiles.push({ x: Math.sin(a) * rr, z: Math.cos(a) * rr, yaw: a, ring: i, sec: j, n, hot: false }); } }
  tiles.nr = nr; return tiles;
}
// is tile (ring, sector of n) in pattern p of cycle c?
function cartSndHot(p, c, ring, sec, n) {
  const w = sec / n;
  switch (p) {
    case 0: return ring % 2 === c % 2;                                  // alternate rings
    case 1: return Math.floor(w * 6 + c * 0.5) % 2 === 0;               // three wedges
    case 2: return c % 2 ? ring >= 4 : ring < 4;                        // outer half / inner half
    case 3: return ((w * 4 + ring * 0.35 + c * 0.5) % 2) < 1;           // a spiral
    default: return (ring + sec) % 2 === c % 2;                         // checkerboard
  }
}
// tile under (x, z), or -1
function cartSndTileAt(x, z) { const S = CART_SND, r = Math.hypot(x, z); if (r < S.floor0 || r >= S.floor0 + Math.floor((S.floor1 - S.floor0) / S.tile) * S.tile) return null; const ring = Math.floor((r - S.floor0) / S.tile), rr = S.floor0 + (ring + 0.5) * S.tile, n = Math.round(TAU * rr / S.tile); let a = Math.atan2(x, z); if (a < 0) a += TAU; return CART_SND_T.at.ring = ring, CART_SND_T.at.n = n, CART_SND_T.at.sec = Math.floor(a / TAU * n) % n, CART_SND_T.at; }
const CART_SND_T = { at: { ring: 0, n: 0, sec: 0 }, col: [0, 0, 0] };

CART_ARENA_RULES.sound = {
  music: 'kart1',
  onLoad(s) {
    const E = s.E, S = CART_SND, rng = s.rng;
    const D = s.snd = { t: 0, beat: 0, cyc: -1, pat: 0, tiles: cartSndTiles(), hit: 0, subs: E.subs.map((b, i) => ({ b, next: 6 + i * 2.2, warn: 0, wave: -1, mask: 0, pump: 0 })), drones: [], bombs: [] };
    for (let i = 0; i < 4; i++) D.drones.push({ i, ph: i * 1.7, x: 0, z: 0, y: 11, st: 'patrol', t: 0, cool: 4 + i * 2.5, tgt: null, rx: 0, rz: 0, yaw: 0, warned: false });
    // the DJ and the dancers stand on the booth
    for (const h of s.heroes) if (h.h.y) h.ch.y = h.h.y;
    // moving parts: the beating heart, the six sub cones, four cupid drones (body + two wings) and their bombs
    const G = new BurnsGroup(Math.min(64, BurnsGL.maxBones || 32)), groups = [G];
    let g = G; const add = (fn, o) => { if (g.full) { g.finish(); g = new BurnsGroup(Math.min(64, BurnsGL.maxBones || 32)); groups.push(g); } return g.add(fn, Object.assign({ visible: true }, o || {})); };
    D.heart = add(m => { m.color('#ff1f5a', 0.35).shine(3); m.push(); m.tf(0, 0, -0.6); cartSndHeart(m, 0.19, 1.2); m.pop(); m.color('#ffd0e0', 0.9); m.push(); m.tf(0, 0, 0.62); m.extrude(cartSndHeartPts(0.12, 24), 0.05, { convex: false }); m.pop(); m.emissive(0).shine(0); });
    for (const sb of D.subs) sb.o = add(m => { m.color('#2a2432').shine(2); m.push(); m.tf(0, 0, 0, 0, Math.PI / 2, 0); m.lathe([[2.9, 0], [2.4, -0.25], [1.2, -0.75], [0.7, -0.8], [0.68, -0.6], [0, -0.55]], { seg: 28 }); m.pop(); m.color('#ff4fa8', 0.6).shine(3); m.ball(0, 0, -0.35, 0.65, { seg: 14, rings: 9 }); m.emissive(0).shine(0); });
    for (const d of D.drones) {
      d.o = add(m => { m.color('#ff4f8a', 0.25).shine(3); m.push(); m.tf(0, 0, -0.35); cartSndHeart(m, 0.07, 0.7); m.pop(); m.color('#ffffff').shine(2); for (const sx of [-0.35, 0.35]) m.ball(sx, 0.2, 0.38, 0.2, { seg: 8, rings: 6 }); m.color('#1a1020'); for (const sx of [-0.35, 0.35]) m.ball(sx, 0.18, 0.55, 0.09, { seg: 6, rings: 4 }); m.color('#ffd84a', 0.8).shine(3); m.torus(0, 1.15, 0, 0.55, 0.07, { seg: 18, tseg: 4 }); m.emissive(0); m.color('#c8a060').shine(1); m.limb(-0.9, -0.5, 0.2, 0.9, -0.5, 0.2, 0.04, 0.04, { seg: 4 }); m.color('#ff4f8a', 0.6); m.ball(0.95, -0.5, 0.2, 0.12, { seg: 6, rings: 4 }); m.emissive(0).shine(0); });
      d.w = [1, -1].map(sx => add(m => { m.color('#ffffff', 0.15).shine(2); m.ellipsoid(sx * 0.75, 0, 0, 0.75, 0.08, 0.42, { seg: 10, rings: 5 }); m.ellipsoid(sx * 1.25, 0.15, -0.1, 0.4, 0.06, 0.28, { seg: 8, rings: 4 }); m.emissive(0).shine(0); }));
    }
    for (let i = 0; i < 4; i++) D.bombs.push({ live: false, t: 0, x: 0, y: 0, z: 0, y0: 0, tx: 0, tz: 0, owner: null, o: add(m => { m.color('#ff2a5a', 0.4).shine(3); m.push(); m.tf(0, 0, -0.3); cartSndHeart(m, 0.06, 0.6); m.pop(); m.color('#ffd84a', 1); m.ball(0, 0.75, 0, 0.12, { seg: 6, rings: 4 }); m.emissive(0).shine(0); }, { visible: false }) });
    g.finish(); D.groups = groups;
  },
  onUpdate(s, dt, racing) {
    const D = s.snd, S = CART_SND; if (!D) return;
    const live = racing && s.state === 'race' && !(s.obj && s.obj.ended);
    if (!live) { D.t += dt * 0.25; return; }   // idles (visuals) before the start and after the end
    D.t += dt; D.beat = D.t * S.bpm / 60;
    // ---- the dance floor: a new pattern every 8 beats; warn 3 beats, hot 1 beat ----
    const cyc = Math.floor(D.beat / 8), bi = D.beat - cyc * 8;
    if (cyc !== D.cyc) { D.cyc = cyc; D.pat = (cyc * 7 + Math.floor(s.rng() * 3)) % 5; }
    D.phase = bi < 3 ? 'warn' : bi < 4 ? 'hot' : 'idle';
    if (D.phase === 'hot' && s.raceT > 4) for (const k of s.karts) {
      if (k.out || k.air || k.y > 0.6) continue;
      const T = cartSndTileAt(k.x, k.z); if (!T || !cartSndHot(D.pat, cyc, T.ring, T.sec, T.n)) continue;
      if (s.hit(k, 'slip', null, { item: 'tile', banner: 'DANCE FLOOR!' }) && s.fx) { s.fx.burst(k.x, k.y + 0.5, k.z, 'spark', 10, '#ff4fa8'); }
    }
    // ---- the giant subs: warn 1.5 s, then a BASS WAVE (r 3 → 24 m in 0.6 s) ----
    for (const sb of D.subs) {
      sb.next -= dt; const b = sb.b;
      if (sb.wave < 0 && sb.next <= 1.5 && sb.warn === 0) { sb.warn = 1; const P = s.player; if (P && !P.out && Math.hypot(P.x - b.cx, P.z - b.cz) < 30) s.banner('BASS INCOMING!', '#ffb02a', 1.2, 'get away from the sub', true); }
      if (sb.wave < 0 && sb.next <= 0) { sb.wave = 0; sb.mask = 0; sb.warn = 0; sb.next = 12 + s.rng() * 2; const near = s.player && Math.hypot(s.player.x - b.cx, s.player.z - b.cz); Sound.play('cartBass', { vol: near < 60 ? 0.9 : 0.3, pitch: 0.7 }); if (near < 30) s.shakeIt(0.6); if (s.fx) s.fx.burst(b.cx, 3.9, b.cz, 'ring', 14, '#ff4fa8'); }
      if (sb.wave >= 0) {
        sb.wave += dt; const r = 3 + 21 * Math.min(1, sb.wave / 0.6);
        for (const k of s.karts) { if (k.out || (sb.mask & (1 << k.slot)) || k.y > 3) continue; const dx = k.x - b.cx, dz = k.z - b.cz, d = Math.hypot(dx, dz); if (d < r + 1.5 && d < 25) { sb.mask |= 1 << k.slot; s.hit(k, 'knock', null, { item: 'subwave', dx: dx / (d || 1), dz: dz / (d || 1), power: 16, banner: 'BASS WAVE!' }); } }
        if (sb.wave > 0.9) sb.wave = -1;
      }
    }
    // ---- cupid drones: patrol → lock (1.3 s) → hold (0.4 s) → drop a love bomb ----
    for (const d of D.drones) {
      d.t += dt; if (d.cool > 0) d.cool -= dt;
      const pa = D.t * 0.11 + d.ph, px = Math.sin(pa) * (60 + 55 * Math.sin(pa * 0.7 + d.i)), pz = Math.cos(pa * 1.3) * (70 + 50 * Math.cos(pa * 0.5 + d.i));
      if (d.st === 'patrol') {
        d.x = lerp(d.x, px, 1 - Math.exp(-0.8 * dt)); d.z = lerp(d.z, pz, 1 - Math.exp(-0.8 * dt));
        if (d.cool <= 0) {
          let best = null, bd = 40; for (const k of s.karts) { if (k.out || k.hidden || k.invT > 0.5) continue; const dd = Math.hypot(k.x - d.x, k.z - d.z) + (k === d.last ? 25 : 0); if (dd < bd) { bd = dd; best = k; } }
          if (best) { d.st = 'lock'; d.t = 0; d.tgt = best; d.rx = best.x; d.rz = best.z; d.warned = false; Sound.play('cartSparkle', { vol: best.player ? 0.7 : 0.2, pitch: 1.4 }); }
          else d.cool = 1;
        }
      } else if (d.st === 'lock' || d.st === 'hold') {
        const k = d.tgt;
        if (d.st === 'lock') { if (k && !k.out) { d.rx = lerp(d.rx, k.x + k.vx * 0.25, 1 - Math.exp(-9 * dt)); d.rz = lerp(d.rz, k.z + k.vz * 0.25, 1 - Math.exp(-9 * dt)); } if (k && k.player && !d.warned) { d.warned = true; s.banner('CUPID LOCKED ON!', '#ff6ad0', 1.3, 'swerve when the target stops', true); } if (d.t > 1.3) { d.st = 'hold'; d.t = 0; } }
        else if (d.t > 0.4) { d.st = 'patrol'; d.t = 0; d.cool = 5 + s.rng() * 3; d.last = k; const B = D.bombs.find(q => !q.live); if (B) { B.live = true; B.t = 0; B.x = d.x; B.z = d.z; B.y0 = d.y; B.tx = d.rx; B.tz = d.rz; B.owner = null; Sound.play('throw', { vol: k && k.player ? 0.7 : 0.25, pitch: 1.3 }); } }
        d.x = lerp(d.x, d.rx, 1 - Math.exp(-2.2 * dt)); d.z = lerp(d.z, d.rz, 1 - Math.exp(-2.2 * dt));
      }
      d.yaw = Math.atan2(d.x - (d.px || d.x), d.z - (d.pz || d.z) + 1e-4) || d.yaw; d.px = d.x; d.pz = d.z;
    }
    for (const B of D.bombs) {
      if (!B.live) continue; B.t += dt; const u = Math.min(1, B.t / 0.5);
      B.x = lerp(B.x, B.tx, 1 - Math.exp(-10 * dt)); B.z = lerp(B.z, B.tz, 1 - Math.exp(-10 * dt)); B.y = lerp(B.y0, 0.6, u * u);
      if (u >= 1) {
        B.live = false;
        for (const k of s.karts) { if (k.out || k.y > 3.5) continue; if (Math.hypot(k.x - B.tx, k.z - B.tz) < 4.4) s.hit(k, 'charm', null, { item: 'lovebomb', dur: 2.0, banner: 'LOVE BOMB!' }); }
        if (s.fx) { s.fx.hearts(B.tx, 1, B.tz, 14); s.fx.burst(B.tx, 1, B.tz, 'ring', 14, '#ff6ad0'); s.fx.burst(B.tx, 1.2, B.tz, 'heart', 12, '#ff4f8a'); }
        const P = s.player; Sound.play('cartBoom', { vol: P && Math.hypot(P.x - B.tx, P.z - B.tz) < 40 ? 0.7 : 0.2, pitch: 1.4 });
      }
    }
  },
  // the moving parts (one or two draw calls)
  render(s, R) {
    const D = s.snd, S = CART_SND; if (!D) return;
    const t = s.time, beat = (D.t * S.bpm / 60) % 1, thump = Math.pow(1 - beat, 4);
    const H = D.heart; H.x = 0; H.y = 16 + Math.sin(t * 0.8) * 0.3; H.z = 0; H.yaw = t * 0.35; H.scale = 1 + thump * 0.12;
    for (const sb of D.subs) { const b = sb.b, warn = sb.warn ? 1 : 0, w = sb.wave >= 0 ? Math.max(0, 1 - sb.wave * 2) : 0, pump = warn ? Math.sin(t * 28) * 0.35 * (1.5 - Math.max(0, sb.next)) : thump * 0.12 + w * 0.8; sb.o.x = b.cx + Math.sin(b.yaw) * (0.15 + pump); sb.o.z = b.cz + Math.cos(b.yaw) * (0.15 + pump); sb.o.y = 3.9; sb.o.yaw = b.yaw; sb.o.scale = 1; }
    for (const d of D.drones) { const bob = Math.sin(t * 2.2 + d.ph) * 0.4; d.o.x = d.x; d.o.y = d.y + bob; d.o.z = d.z; d.o.yaw = d.yaw; d.o.roll = Math.sin(t * 1.3 + d.ph) * 0.1; d.o.scale = 1.6; const fl = Math.sin(t * 16 + d.ph) * 0.6; d.w.forEach((w, i) => { w.x = d.x; w.y = d.y + bob + 0.3; w.z = d.z; w.yaw = d.yaw; w.roll = (i ? -1 : 1) * fl; w.scale = 1.6; }); }
    for (const B of D.bombs) { B.o.visible = B.live; if (B.live) { B.o.x = B.x; B.o.y = B.y; B.o.z = B.z; B.o.yaw = t * 4; B.o.scale = 1.4; } }
    for (const G of D.groups) { G.pose(s.cam); R.skin(G.geo, G.bones, G.objs.length, null, 0, 0.5); }
  },
  draw(s, R, Sp, t) {
    const D = s.snd, S = CART_SND; if (!D) return;
    const beat = D.t * S.bpm / 60, f = beat % 1, pulse = Math.pow(1 - f, 3), cyc = Math.floor(beat / 8), live = s.state === 'race';
    const blink = Math.floor(beat * 4) % 2 === 0, cam = s.cam, near = Math.hypot(cam.x, cam.z) < 160, sz = S.tile / 0.6 * 0.94;
    // the LED floor
    if (near) for (const T of D.tiles) {
      const hot = live && cartSndHot(D.pat, cyc, T.ring, T.sec, T.n);
      if (hot && D.phase === 'warn') { R.flat.flat(T.x, 0.06, T.z, sz, sz, T.yaw, Sp.square, S.warn, blink ? 0.85 : 0.35, true); }
      else if (hot && D.phase === 'hot') { R.flat.flat(T.x, 0.06, T.z, sz, sz, T.yaw, Sp.square, S.hot, 1, true); R.flat.flat(T.x, 0.07, T.z, sz * 0.7, sz * 0.7, T.yaw, Sp.square, S.white, 0.5, true); }
      else { const c = S.pal[(((T.ring + Math.floor(beat / 2) + (T.sec % 3 === 0 ? 1 : 0)) % 6) + 6) % 6], a = 0.1 + 0.32 * pulse * ((T.sec + T.ring + Math.floor(beat)) % 3 === 0 ? 1 : 0.35); R.flat.flat(T.x, 0.05, T.z, sz, sz, T.yaw, Sp.square, c, a, true); }
    }
    // the heart's halo, light shafts from the booth on the beat
    R.bbs.bb(0, 16, 0, 16 + pulse * 4, 16 + pulse * 4, Sp.glow, S.pink, 0.45 + pulse * 0.3, true);
    if (Math.random() < 0.25) s.fx.hearts((Math.random() - 0.5) * 6, 17, (Math.random() - 0.5) * 6, 1);
    // the subs: the warning ring, the bass wave
    for (const sb of D.subs) {
      const b = sb.b;
      if (sb.warn) { const a = 0.5 + 0.5 * Math.sin(t * 18); R.flat.flat(b.cx, 0.08, b.cz, 48, 48, 0, Sp.ring, S.amber, 0.35 + 0.4 * a, true); R.flat.flat(b.cx, 0.09, b.cz, 7, 7, t * 3, Sp.warn, S.amber, 0.9, true); R.bbs.bb(b.cx, 9.5, b.cz, 3, 3, Sp.warn, S.amber, a, true); }
      if (sb.wave >= 0) { const u = Math.min(1, sb.wave / 0.6), r = 3 + 21 * u, a = 1 - Math.max(0, sb.wave - 0.4) * 2; R.flat.flat(b.cx, 0.2, b.cz, r * 2, r * 2, 0, Sp.ring, S.purple, a, true); R.flat.flat(b.cx, 0.25, b.cz, r * 1.9, r * 1.9, 0, Sp.ring, S.white, a * 0.5, true); if (Math.random() < 0.8) s.fx.notes(b.cx + (Math.random() - 0.5) * r * 1.4, 1.5, b.cz + (Math.random() - 0.5) * r * 1.4); }
      else R.bbs.bb(b.cx, 3.9, b.cz, 7 + pulse * 2, 7 + pulse * 2, Sp.glow, S.pink, 0.2 + pulse * 0.2, true);
    }
    // cupid drones: halo glow; the target reticle while locking / holding
    for (const d of D.drones) {
      R.bbs.bb(d.x, d.y + 1.6, d.z, 2.4, 2.4, Sp.glow, S.amber, 0.5, true); R.bbs.bb(d.x, d.y, d.z, 5, 5, Sp.glow, S.pink, 0.3, true);
      if (d.st === 'lock' || d.st === 'hold') {
        const hold = d.st === 'hold', a = hold ? 0.95 : 0.55 + 0.35 * Math.sin(t * 14), rr = hold ? 9 : 9 + (1 - d.t / 1.3) * 5;
        R.flat.flat(d.rx, 0.12, d.rz, rr, rr, t * (hold ? 0 : 2), Sp.reticle || Sp.warn, S.pink, a, true);
        R.bbs.streak(lerp(d.x, d.rx, 0.5), d.y * 0.5, lerp(d.z, d.rz, 0.5), d.rx - d.x, -d.y, d.rz - d.z, Math.hypot(d.rx - d.x, d.y, d.rz - d.z), 0.25, Sp.streak, S.pink, 0.35 * a);
      }
    }
    for (const B of D.bombs) if (B.live) { R.bbs.bb(B.x, B.y, B.z, 3, 3, Sp.glow, S.pink, 0.8, true); R.flat.flat(B.tx, 0.12, B.tz, 8.8, 8.8, 0, Sp.shadow, CART_SND.black, 0.5 * Math.min(1, B.t / 0.5), false); }
  },
  lights(s, add) {
    const D = s.snd; if (!D) return;
    const beat = (D.t * CART_SND.bpm / 60) % 1, pulse = Math.pow(1 - beat, 3);
    add(0, 16, 0, 30, CART_SND.pink, 1.0 + pulse * 0.8, 1.5);
    for (const sb of D.subs) if (sb.wave >= 0 || sb.warn) add(sb.b.cx, 3, sb.b.cz, 20, sb.warn ? CART_SND.amber : CART_SND.purple, 1.4, 2);
    for (const B of D.bombs) if (B.live) add(B.x, B.y, B.z, 8, CART_SND.pink, 1.2, 1.5);
  },
  radar(s, ctx, P, sc) {
    const q = CART_ROY_T.p; P(0, 0, q); ctx.strokeStyle = 'rgba(255,79,168,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x, q.y, CART_SND.floor1 * sc, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(160,120,255,0.75)'; for (const b of s.E.subs) { P(b.x, b.z, q); ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }
  }
};

/* ---------------- the registry ---------------- */
CART_ARENAS.push({
  id: 'sound', name: 'THE SOUND CAMP', sub: 'Battle royale: speaker walls, giant subs, a pulsing dance floor', objectives: ['royale'], royale: true, levelCar: 'heart',
  col: '#ff2a5a', tod: 'night', blurb: 'Bass Valentine\'s camp. Dodge the dance floor, the bass waves and the cupid drones. Last car running wins.'
});
CART_ROYALE_ARENAS.heart = 'sound';
CART_ARENA_ICONS.sound = (ctx, s, t, col) => {
  // a speaker cone with a beating heart in it
  const b = 1 + Math.pow(Math.max(0, Math.sin(t * 6.6)), 8) * 0.15;
  ctx.save(); ctx.fillStyle = '#1a1420'; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.fill(); ctx.stroke();
  for (let i = 1; i <= 3; i++) { ctx.strokeStyle = rgba(col, 0.25 * i); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, s * 0.2 * i * b, 0, TAU); ctx.stroke(); }
  cartHeartIcon(ctx, 0, 0, s * 0.28 * b, col); ctx.restore();
};
