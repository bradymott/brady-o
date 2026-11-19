/* ============================================================
   ART CART — royale arena: THE STORM CELL (id 'stormcell', Jelly Jolt's arena; level agent "jelly", Nov 19 2026)
   The floor of a deep-sea pit, black basalt columns cracked with glowing static, at the bottom of the ELECTRIC DEEP.
   In the middle THE STORM CORE: a giant tesla coil caged in glowing ribs like a jellyfish's bell, its orb crackling
   30 m up. Round it a ring of six CONDUCTOR PYLONS (the ring's line is painted on the floor in yellow); rock spires,
   tube-worm thickets, black smokers and basalt arches for cover; trench walls and drifting giant jellies beyond the fence.
   Its hazards (all telegraphed, all readable on a phone):
     · ARC FENCES: two opposite stretches of the pylon ring flash yellow (a zig-zag along the line, little arcs creeping
       in from the pylons, 1.6 s), then a WALL OF LIGHTNING runs between the pylons (1.3 s): cross it on the ground and
       you're zapped (9 HP). Cross somewhere else, wait, or HOP it
     · JELLY DRIFTERS: five giant jellyfish drift over the floor. One flashes and a ring closes on the floor below it
       (1.4 s), then it STINGS everything in the ring (10 HP, stunned). The dim ones are harmless: drive under them
     · CORE STRIKE: the core's orb picks a car and a reticle chases it (1.3 s), stops (0.45 s: swerve!), then
       LIGHTNING strikes the spot (12 HP and a shove)
   JELLY JOLT's STORM HOVER is in everyone's gift boxes here (arena levelCar). Registers itself; globals are
   prefixed STC_, state lives on s.stc. Start it: BRADY_CART.debug.start({ mode: 'royale', arena: 'stormcell' }).
   ============================================================ */
const STC = {
  R: 178, coreR: 10, ringR: 92, pyN: 6, orbY: 30,
  fence: { first: 7, period: 9, warn: 1.6, live: 1.3, band: 2.4 },
  jelly: { n: 5, first: 9, period: 7.6, warn: 1.4, sting: 0.35, R: 7, R0: 16, y: 7.5, sc: 2.1 },
  strike: { first: 10, period: 6.5, lock: 1.3, hold: 0.45, bolt: 0.35, r: 5.5 },
  C: { cyan: [0.25, 0.95, 1], ice: [0.7, 0.95, 1], violet: [0.62, 0.38, 1], pink: [1, 0.35, 0.85], volt: [1, 0.92, 0.3], white: [1, 1, 1], black: [0, 0, 0], snow: [0.7, 0.9, 1], warn: [1, 0.7, 0.2] },
  jellyCol: ['#5af2ff', '#b47aff', '#ff6ad8', '#7aff8a', '#ffe25a']
};
const STC_JF = STC.jellyCol.map(c => burnsRGBf(c));
const stcH = a => { const x = Math.sin(a * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const stcAng = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
const stcPy = i => stcAng(i / STC.pyN * TAU, STC.ringR);   // pylon i on the ring

/* ---------------- static pieces ---------------- */
// a conductor pylon: a basalt plinth, a copper coil, insulators, a glowing toroid; electrodes on both sides at 1.4 m
function stcPylon(m) {
  m.color('#141c2a').shine(1); m.lathe([[2.6, 0], [2.5, 0.8], [2.0, 1.3], [0, 1.35]], { seg: 16 });
  m.color('#c87a3a').shine(3); for (let i = 0; i < 20; i++) m.torus(0, 1.7 + i * 0.4, 0, 0.85, 0.18, { seg: 14, tseg: 5 });
  m.color('#2a3448').shine(2); m.limb(0, 1.3, 0, 0, 10.5, 0, 0.6, 0.6, { seg: 10 });
  m.color('#e8eef8').shine(3); for (let i = 0; i < 5; i++) m.torus(0, 9.8 + i * 0.45, 0, 0.75 - i * 0.07, 0.2, { seg: 12, tseg: 5 });
  m.color('#38f2ff', 1).shine(3); m.torus(0, 12.6, 0, 1.8, 0.6, { seg: 20, tseg: 8 }); m.ball(0, 13.0, 0, 0.7, { seg: 10, rings: 7 });
  m.color('#ffe25a', 1); m.torus(0, 1.4, 0, 1.3, 0.16, { seg: 18, tseg: 4 }); m.emissive(0).shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.0, y0: 0, y1: 13 }], lights: [{ x: 0, y: 12.6, z: 0, s: 2.4, c: '#38f2ff' }, { x: 0, y: 1.4, z: 0, s: 1.6, c: '#ffe25a' }] };
}
// THE STORM CORE: a stepped basalt plinth with copper inlays, the coil column, a cage of glowing ribs curving up into
// a jellyfish bell round it, ribbons hanging from the bell's rim (the orb itself is a moving part)
function stcCore(m) {
  const R = STC.coreR, lights = [];
  m.color('#141c2a').shine(1); m.lathe([[R, 0], [R, 1.0], [R - 1.2, 1.4], [R - 1.4, 2.2], [0, 2.3]], { seg: 36 });
  m.color('#c87a3a').shine(3); m.torus(0, 1.0, 0, R + 0.02, 0.14, { seg: 40, tseg: 4 }); m.torus(0, 2.2, 0, R - 1.4, 0.14, { seg: 36, tseg: 4 });
  for (let i = 0; i < 30; i++) m.torus(0, 2.6 + i * 0.7, 0, 1.6 - i * 0.02, 0.26, { seg: 16, tseg: 5 });
  m.color('#2a3448').shine(2); m.limb(0, 2.2, 0, 0, 25, 0, 1.1, 0.8, { seg: 12 });
  m.color('#e8eef8').shine(3); for (let i = 0; i < 6; i++) m.torus(0, 22.5 + i * 0.6, 0, 1.2 - i * 0.08, 0.26, { seg: 14, tseg: 5 });
  // the bell cage: 8 ribs from the plinth's edge, out and up, curving in over the orb
  m.color('#38f2ff', 1).shine(3);
  const prof = [[R - 1.6, 2.2], [R + 0.6, 8], [R + 1.2, 15], [R - 0.4, 22], [R - 3.4, 27.5], [5.0, 31.5], [1.6, 33.4], [0, 33.8]];
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, c = Math.cos(a), s = Math.sin(a); for (let i = 0; i < prof.length - 1; i++) m.limb(c * prof[i][0], prof[i][1], s * prof[i][0], c * prof[i + 1][0], prof[i + 1][1], s * prof[i + 1][0], 0.32, 0.32, { seg: 6, ends: false }); }
  m.color('#b47aff', 1); m.torus(0, 22, 0, R - 0.4, 0.3, { seg: 40, tseg: 5 }); m.torus(0, 8, 0, R + 0.6, 0.24, { seg: 40, tseg: 5 });
  // ribbons hanging off the upper ring
  m.color('#ff6ad8', 0.9); for (let k = 0; k < 12; k++) { const a = (k + 0.5) / 12 * TAU; let px = Math.cos(a) * (R - 0.4), py = 22, pz = Math.sin(a) * (R - 0.4); for (let j = 1; j <= 4; j++) { const rr = R - 0.4 + Math.sin(j * 1.3 + k) * 0.6, nx = Math.cos(a + Math.sin(j + k) * 0.06) * rr, ny = 22 - j * 3.2, nz = Math.sin(a + Math.sin(j + k) * 0.06) * rr; m.limb(px, py, pz, nx, ny, nz, 0.14, 0.1, { seg: 4, ends: false }); px = nx; py = ny; pz = nz; } }
  m.emissive(0).shine(0);
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; lights.push({ x: Math.cos(a) * (R + 1.2), y: 15, z: Math.sin(a) * (R + 1.2), s: 1.6, c: '#38f2ff' }); }
  lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#38f2ff', pool: 26 });
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: R + 0.6, y0: 0, y1: 34 }], lights };
}
// a basalt arch you drive through (local x across): stacked hexagonal columns either side, a lintel at 9 m, glowing cracks
function stcArch(m) {
  const W = 14;
  for (const sd of [-1, 1]) { m.color('#1a2232').shine(1); for (let i = 0; i < 3; i++) m.cyl(sd * (W / 2 + 0.8) + (i - 1) * 0.9 * sd, 0, (i - 1) * 1.1, 1.1, 1.0, 9.6 + i * 0.6, 6); m.color('#38f2ff', 1); m.limb(sd * (W / 2 - 0.2), 0.5, 1.2, sd * (W / 2), 8.8, 1.1, 0.07, 0.07, { seg: 4 }); m.emissive(0); }
  m.color('#1a2232').shine(1); m.roundBox(0, 10.6, 0, W + 5, 2.4, 3.2, 0.6);
  m.color('#38f2ff', 1); for (const z of [-1.62, 1.62]) { let px = -W / 2 - 2, py = 10.4; for (let i = 1; i <= 6; i++) { const x = -W / 2 - 2 + i * (W + 4) / 6, y = 10.6 + Math.sin(i * 2.1) * 0.6; m.limb(px, py, z, x, y, z, 0.07, 0.07, { seg: 4, ends: false }); px = x; py = y; } }
  m.emissive(0).shine(0);
  return { cols: [{ t: 'cyl', x: -W / 2 - 0.8, z: 0, r: 2.0, y0: 0, y1: 10 }, { t: 'cyl', x: W / 2 + 0.8, z: 0, r: 2.0, y0: 0, y1: 10 }], lights: [{ x: 0, y: 9.3, z: 0, s: 2.0, c: '#38f2ff' }] };
}
// a black smoker (the same family as the track's)
function stcSmoker(m, h) {
  m.color('#1c1a22').shine(1);
  for (let i = 0; i < 7; i++) { const y = i * h / 7, rr = 2.6 * (1 - i * 0.09); m.ellipsoid(Math.sin(i * 1.7) * 0.4, y + h / 14, Math.cos(i * 2.1) * 0.4, rr, h / 10, rr, { seg: 12, rings: 7 }); }
  m.color('#ff7a2a', 0.9); for (let i = 0; i < 9; i++) { const a = i * 2.4, y = 0.6 + (i / 9) * h * 0.8; m.ball(Math.cos(a) * 2.6 * (1 - y / h * 0.6), y, Math.sin(a) * 2.6 * (1 - y / h * 0.6), 0.28, { seg: 6, rings: 4 }); }
  m.color('#ffb04a', 1); m.torus(0, h + 0.1, 0, 0.95, 0.24, { seg: 12, tseg: 4 }); m.emissive(0).shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.4, y0: 0, y1: h }], lights: [{ x: 0, y: h + 0.2, z: 0, s: 2.6, c: '#ff9a3a' }] };
}
// a giant jellyfish (moving or static): bell, core, frill, tentacles; y 0 = the rim; about 4.5 m across at scale 1
function stcJelly(m, col, lo) {
  m.color(col, 0.55).shine(3); m.lathe([[1.9, 0], [1.95, 0.4], [1.7, 1.1], [1.1, 1.65], [0.45, 1.85], [0, 1.88]], { seg: lo ? 14 : 20 });
  m.color('#ffffff', 0.9); m.ellipsoid(0, 0.75, 0, 0.8, 0.65, 0.8, { seg: 10, rings: 7 });
  m.color(col, 1); m.torus(0, 0.05, 0, 1.9, 0.15, { seg: 22, tseg: 4 });
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, x = Math.cos(a) * 1.65, z = Math.sin(a) * 1.65; let px = x, py = 0, pz = z; for (let j = 1; j <= 4; j++) { const nx = x * (1 - j * 0.1) + Math.sin(k + j * 1.7) * 0.3, ny = -j * 1.1, nz = z * (1 - j * 0.1) + Math.cos(k * 2 + j) * 0.3; m.limb(px, py, pz, nx, ny, nz, 0.07, 0.05, { seg: 4, ends: false }); px = nx; py = ny; pz = nz; } m.ball(px, py, pz, 0.11, { seg: 5, rings: 3 }); }
  m.color('#ffffff', 0.8); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; let px = Math.cos(a) * 0.45, py = 0.1, pz = Math.sin(a) * 0.45; for (let j = 1; j <= 4; j++) { const nx = Math.cos(a + j * 0.6) * 0.5, ny = -j * 0.85, nz = Math.sin(a + j * 0.6) * 0.5; m.limb(px, py, pz, nx, ny, nz, 0.18, 0.13, { seg: 5, ends: false }); px = nx; py = ny; pz = nz; } }
  m.emissive(0).shine(0);
}

/* ---------------- the world ---------------- */
CartWorlds.arena_stormcell = function (A, night) {
  const S = STC, E = this.base(2143, [-245, -245, 245, 245], '#34506e', 0.02);
  const sky = Object.assign(CART_SKIES.night(), { zen: '#010510', hor: '#0a3450', fog: '#04182a', fogD: 0.0052, haze: 0.35, sky: '#08243e', gnd: '#061420', mid: '#04263c', midK: 0.35, cityK: 0, key: '#7ac8ff', keyK: 0.5, emB: 1.9, stars: 0.2, clouds: 0, moonK: 0.3, rim: '#38f2ff' });
  Object.assign(E, { id: 'stormcell', arena: A, sky, tod: 'night', music: 'kart3', night: true, R: S.R });
  const api = E.api, T = E.terrain, rng = mulberry32(2143), taken = [];
  const free = (x, z, r) => taken.every(q => Math.hypot(q[0] - x, q[1] - z) > q[2] + r);
  // ---- the floor: basalt hexes, glowing static cracks running out from the core, the ring's yellow line ----
  api.paint((ctx, P, sc) => {
    const hs = 6.5, hh = hs * Math.sqrt(3) / 2;
    ctx.lineWidth = 0.22 * sc;
    for (let row = -36; row <= 36; row++) for (let col = -24; col <= 24; col++) {
      const cx = col * hs * 1.5, cz = row * hh * 2 + (col % 2 ? hh : 0), r = Math.hypot(cx, cz); if (r > S.R + 40) continue;
      const q = P(cx, cz), n = stcH(col * 7.1 + row * 3.3);
      ctx.fillStyle = `rgba(${n < 0.5 ? '10,18,30' : '40,58,80'},${0.22 + n * 0.25})`; ctx.strokeStyle = 'rgba(110,190,230,0.42)';
      ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, p = P(cx + Math.cos(a) * (hs - 0.4), cz + Math.sin(a) * (hs - 0.4)); if (k) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); } ctx.closePath(); ctx.fill(); ctx.stroke(); void q;
    }
    // the cracks: jagged and branching, cyan, brightest near the core
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 16; i++) {
      let a = i / 16 * TAU + rng() * 0.2, r = S.coreR + 2, p = P(...stcAng(a, r));
      for (let j = 0; j < 14 && r < S.R - 4; j++) {
        const r2 = r + 6 + rng() * 9, a2 = a + (rng() - 0.5) * 0.25, q = P(...stcAng(a2, r2)), f = 1 - r / S.R;
        ctx.strokeStyle = `rgba(56,242,255,${0.4 + f * 0.55})`; ctx.lineWidth = (0.5 + f * 1.3) * sc; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        if (rng() < 0.3) { const b = P(...stcAng(a2 + (rng() - 0.5) * 0.4, r2 + 8)); ctx.lineWidth = 0.3 * sc; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
        r = r2; a = a2; p = q;
      }
    }
    for (let i = 0; i < 700; i++) { const a = rng() * TAU, r = rng() * (S.R + 30), q = P(...stcAng(a, r)); ctx.fillStyle = `rgba(${['56,242,255', '154,90,255', '122,255,106', '255,90,216'][i % 4]},${0.3 + rng() * 0.5})`; ctx.beginPath(); ctx.arc(q[0], q[1], (0.12 + rng() * 0.25) * sc, 0, TAU); ctx.fill(); }
    // the core's copper plaza and the fence ring line: yellow and black hazard dashes
    const c0 = P(0, 0); ctx.strokeStyle = 'rgba(200,122,58,0.55)'; ctx.lineWidth = 0.6 * sc; for (const r of [16, 22, 28]) { ctx.beginPath(); ctx.arc(c0[0], c0[1], r * sc, 0, TAU); ctx.stroke(); }
    ctx.lineWidth = 1.4 * sc; ctx.setLineDash([3 * sc, 2.5 * sc]); ctx.strokeStyle = 'rgba(255,226,90,0.9)'; ctx.beginPath(); ctx.arc(c0[0], c0[1], S.ringR * sc, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  });
  // ---- THE STORM CORE ----
  CartScene.mesh(api, 0, 0, 0, stcCore, { hi: true, noAO: true });
  api.sign('THE STORM CELL', 0, -S.coreR - 0.3, { yaw: Math.PI, h: 0.9, y: 0.4, post: false, maxW: 6, style: { bg: '#04142a', fg: '#ffffff', border: '#38f2ff' }, glow: '#38f2ff' });
  api.sign('THE STORM CELL', 0, S.coreR + 0.3, { yaw: 0, h: 0.9, y: 0.4, post: false, maxW: 6, style: { bg: '#04142a', fg: '#ffffff', border: '#38f2ff' }, glow: '#38f2ff' });
  api.light(0, 0, 50, '#38f2ff', 0.55); api.light(0, 0, 24, '#d8f8ff', 0.35);
  E.art.push({ x: 0, z: 0, r: S.coreR + 0.8 }); taken.push([0, 0, 30]);
  // ---- the six conductor pylons ----
  for (let i = 0; i < S.pyN; i++) { const [x, z] = stcPy(i); CartScene.mesh(api, x, z, i / S.pyN * TAU, stcPylon, { hi: true, noAO: true }); api.light(x, z, 16, '#38f2ff', 0.5); E.art.push({ x, z, r: 2.4 }); taken.push([x, z, 9]); }
  // keep the ring line itself clear of cover (the fences need a readable line)
  const offRing = (x, z, r) => Math.abs(Math.hypot(x, z) - S.ringR) > r + 6;
  // ---- instanced cover: rock spires with glowing veins, tube-worm thickets ----
  api.instanceProto('stc_spire', m => {
    m.color('#1a2232').shine(1);
    for (let i = 0; i < 6; i++) { const y = i * 2.6, rr = 3.4 - i * 0.5; m.ellipsoid(Math.sin(i * 1.3) * 0.5, y + 1.4, Math.cos(i * 1.9) * 0.5, rr, 1.9, rr * 0.85, { seg: m.lo ? 8 : 12, rings: m.lo ? 5 : 7 }); }
    m.color('#ffffff', 1); for (let k = 0; k < 3; k++) { const a = k * 2.1; let px = Math.cos(a) * 3.2, py = 0.3, pz = Math.sin(a) * 2.8; for (let i = 1; i <= 5; i++) { const y = i * 2.6, rr = 3.45 - i * 0.5 + 0.05, aa = a + Math.sin(i * 1.7 + k) * 0.35, x = Math.cos(aa) * rr, z = Math.sin(aa) * rr * 0.85; m.limb(px, py, pz, x, y, z, 0.12, 0.1, { seg: 4, ends: false }); px = x; py = y; pz = z; } }
    m.ball(0, 14.2, 0, 0.5, { seg: 8, rings: 5 }); m.emissive(0).shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.2, y0: 0, y1: 14 }] };
  }, { r: 4, near: 40, mid: 150, farD: 420, lo: true, noAO: true, far: m => { m.color('#1a2232'); m.cyl(0, 0, 0, 3.4, 0.8, 14.5, 6); m.color('#ffffff', 1); m.box(0, 7, 2.6, 0.3, 12, 0.3); m.emissive(0); } });
  api.instanceProto('stc_worms', m => {
    for (const [x, z, h] of [[0, 0, 3.4], [0.9, 0.3, 2.6], [-0.8, 0.5, 2.9], [0.4, -0.9, 2.2], [-0.5, -0.7, 2.4], [1.3, -0.5, 1.8], [-1.3, 0.1, 1.9]]) { m.color('#d8d4c8').shine(1); m.limb(x, 0, z, x * 1.08, h, z * 1.08, 0.22, 0.17, { seg: m.lo ? 5 : 7 }); m.color('#ffffff', 0.95).shine(2); m.ellipsoid(x * 1.08, h + 0.32, z * 1.08, 0.36, 0.5, 0.36, { seg: m.lo ? 6 : 9, rings: m.lo ? 4 : 6 }); }
    m.emissive(0).shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.4, y0: 0, y1: 3 }] };
  }, { r: 2.4, near: 34, mid: 120, farD: 300, lo: true, far: m => { m.color('#d8d4c8'); m.cyl(0, 0, 0, 1.2, 0.6, 3, 5); m.color('#ffffff', 0.95); m.ball(0, 3.3, 0, 0.9, { seg: 5, rings: 3 }); m.emissive(0); } });
  const VEIN = ['#38f2ff', '#9a5aff', '#7aff6a', '#4a7aff', '#ff5ad8'];
  const spire = (x, z, sc, col, art) => { api.instance('stc_spire', x, z, { y: 0, yaw: x * 0.3 + z * 0.17, scale: sc, tint: cartTintOf(col), noCol: !art }); if (art) { E.art.push({ x, z, r: 3.2 * sc }); taken.push([x, z, 3.4 * sc]); } api.glow(x, 14.2 * sc, z, 1.6 * sc, col); };
  // inner ring of cover (r 40–72) and outer (r 108–160), clear of pylons, spawns and the ring line
  const spawnA = i => i / 8 * TAU + 0.2;
  const nearSpawn = (x, z) => { for (let i = 0; i < 8; i++) { const [sx, sz] = stcAng(spawnA(i), 143); if (Math.hypot(sx - x, sz - z) < 14) return true; } return false; };
  for (let i = 0; i < 9; i++) { const a = (i + 0.5) / 9 * TAU + 0.15, r = 46 + (i % 3) * 11, [x, z] = stcAng(a, r); if (free(x, z, 4) && offRing(x, z, 4)) spire(x, z, 0.9 + (i % 2) * 0.3, VEIN[i % 5], true); }
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + 0.09, r = 112 + (i % 4) * 13, [x, z] = stcAng(a, r); if (free(x, z, 5) && offRing(x, z, 5) && !nearSpawn(x, z)) spire(x, z, 0.9 + (i % 3) * 0.3, VEIN[(i + 2) % 5], true); }
  for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + 0.3, r = 34 + ((i * 37) % 120), [x, z] = stcAng(a, r); if (!free(x, z, 3) || !offRing(x, z, 2) || nearSpawn(x, z)) continue; api.instance('stc_worms', x, z, { y: 0, yaw: a, scale: 1.2 + (i % 3) * 0.25, tint: cartTintOf(VEIN[i % 5]) }); api.glow(x, 3.8, z, 1.4, VEIN[i % 5]); E.art.push({ x, z, r: 1.8 }); taken.push([x, z, 3]); }
  // black smokers, basalt arches, kickers, mounds
  for (const [a, r, h] of [[0.5, 60, 13], [2.6, 66, 10], [4.4, 58, 12], [1.6, 150, 11], [3.6, 152, 14], [5.6, 148, 10]]) { const [x, z] = stcAng(a, r); if (!free(x, z, 4) || nearSpawn(x, z)) continue; CartScene.mesh(api, x, z, a, mm => stcSmoker(mm, h), { hi: true }); api.light(x, z, 13, '#ff8a3a', 0.45); E.art.push({ x, z, r: 2.8 }); taken.push([x, z, 6]); }
  E.stcVents = []; for (const [a, r, h] of [[0.5, 60, 13], [2.6, 66, 10], [4.4, 58, 12], [1.6, 150, 11], [3.6, 152, 14], [5.6, 148, 10]]) { const [x, z] = stcAng(a, r); E.stcVents.push([x, z, h]); }
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 1.05, [x, z] = stcAng(a, 128); if (!free(x, z, 10)) continue; CartScene.mesh(api, x, z, a + Math.PI / 2, stcArch, { hi: true, noAO: true }); api.light(x, z, 14, '#38f2ff', 0.5); for (const sd of [-1, 1]) { const px = x + Math.cos(a) * sd * 7.8, pz = z - Math.sin(a) * sd * 7.8; E.art.push({ x: px, z: pz, r: 2.2 }); } taken.push([x, z, 11]); }
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.3, [x, z] = stcAng(a, 118); if (free(x, z, 6)) { T.add(CartFeat.ramp(x, z, a + Math.PI / 2 * (i % 2 ? 1 : -1), 7, 7, 2.1, { col: '#1a2232', stripe: '#38f2ff' })); taken.push([x, z, 6]); } }
  for (const [a, r] of [[0.95, 168], [3.05, 166], [5.15, 170]]) T.add(CartFeat.mound(Math.sin(a) * r, Math.cos(a) * r, 13, 2.6, { col: '#1a2232' }));
  // ---- the fence: cyan / violet rails with glows; the trench walls beyond; giant jellies drifting outside ----
  const poly = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; poly.push([Math.sin(a) * S.R, Math.cos(a) * S.R]); }
  E.walls = poly; CartDecor.protos(E);
  const FC = ['#38f2ff', '#4a7aff', '#9a5aff', '#ffffff'];
  for (let i = 0; i < 48; i++) { const a = poly[i], b = poly[(i + 1) % 48], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(L / 7), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]); for (let j = 0; j < n; j++) { const u = (j + 0.5) / n, x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u), c = FC[Math.floor((i * n + j) / 3) % 4]; CartDecor.put(E, 'rail', x, z, yaw, c, { y: 0, noLights: true }); if (j % 2 === 0) api.glow(x, 0.98, z, 0.9, c); } }
  for (let i = 0; i < 34; i++) { const a = i / 34 * TAU + rng() * 0.08, r = S.R + 16 + rng() * 55, [x, z] = stcAng(a, r); api.instance('stc_spire', x, z, { y: 0, yaw: rng() * 6, scale: 1.8 + rng() * 2.2, tint: cartTintOf(VEIN[i % 5]), noCol: true }); }
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.6, [x, z] = stcAng(a, 228); CartScene.mesh(api, x, z, a, mm => { mm.push(); mm.tf(0, 34, 0, 0, 0.15, 0, 5, 5, 5); stcJelly(mm, STC.jellyCol[i + 1], true); mm.pop(); return { cols: [], lights: [{ x: 0, y: 36, z: 0, s: 8, c: STC.jellyCol[i + 1] }] }; }, { noAO: true }); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4, [x, z] = stcAng(a, S.R + 40); E.beams = E.beams || []; E.beams.push({ kind: 'search', x, y: 1, z, c: burnsRGBf(i % 2 ? '#9a5aff' : '#38f2ff'), ph: i * 1.7, sp: 0.25 + i * 0.06, len: 150, w: 7, a: 0.16 }); }
  // ---- royale spots: gift boxes, repair kits, spawns, the storm's end points ----
  const gapA = i => (i + 0.5) / S.pyN * TAU;
  for (let i = 0; i < 4; i++) { const [x, z] = stcAng(i / 4 * TAU + Math.PI / 4, 24); E.gifts.push({ x, z }); }
  for (let i = 0; i < S.pyN; i++) { const [x, z] = stcAng(gapA(i), 72); E.gifts.push({ x, z }); const [x2, z2] = stcAng(i / S.pyN * TAU + 0.25, 132); E.gifts.push({ x: x2, z: z2 }); }
  const repairs = []; for (let i = 0; i < S.pyN; i++) repairs.push(stcAng(gapA(i) + 0.2, 140)); repairs.push(stcAng(Math.PI / 2, 40), stcAng(-Math.PI / 2, 40));
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = spawnA(i), [x, z] = stcAng(a, 143); E.spawn.push({ x, z, yaw: a + Math.PI / 2 }); }
  for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 32 + rng() * 128, [x, z] = stcAng(a, r); E.orbSpots.push({ x, z }); }
  E.zones = [{ x: 0, z: 0, r: 12, name: 'THE STORM CORE' }]; E.flagSpots = [{ x: 0, z: 60 }]; E.captures = [{ x: 0, z: -110, r: 9 }];
  E.royale = { R: S.R - 4, x: 0, z: 0, ends: [0, 1, 2, 3, 4].map(i => stcAng(i / 5 * TAU + 0.3, 78)), repairs, storm: { name: 'STATIC STORM', col: '#7af6ff' }, avoid: [[0, 0, S.coreR + 5]] };
  return this.finish(E);
};

/* ---------------- the arena's hazards: arc fences, jelly drifters, core strikes ---------------- */
// distance from (x, z) to fence segment i (pylon i → i+1), and how far along it (0..1)
const STC_T = { u: 0 };
const STC_PY = [0, 1, 2, 3, 4, 5].map(stcPy);   // the pylons, precomputed (no allocation in the update loop)
function stcSegDist(i, x, z) {
  const A = STC_PY[i], B = STC_PY[(i + 1) % STC.pyN], ax = A[0], az = A[1], dx = B[0] - ax, dz = B[1] - az, L2 = dx * dx + dz * dz;
  const u = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1); STC_T.u = u;
  return Math.hypot(x - (ax + dx * u), z - (az + dz * u));
}
CART_ARENA_RULES.stormcell = {
  music: 'kart3',
  onLoad(s) {
    const S = STC;
    const D = s.stc = { t: 0, fc: -1, fst: 'idle', fu: 0, fpair: [0, 3], fmask: 0, jellies: [], strike: { st: 'idle', t: 0, next: S.strike.first, tgt: null, rx: 0, rz: 0, last: null, warned: false }, py: [] };
    for (let i = 0; i < S.pyN; i++) { const [x, z] = stcPy(i); D.py.push({ x, z }); }
    for (let i = 0; i < S.jelly.n; i++) D.jellies.push({ i, x: 0, y: S.jelly.y, z: 0, st: 'drift', u: 0, c: -1, mask: 0, off: i * 1.55, col: STC_JF[i] });
    const G = new BurnsGroup(Math.min(64, BurnsGL.maxBones || 32)), groups = [G];
    let g = G; const add = (fn, o) => { if (g.full) { g.finish(); g = new BurnsGroup(Math.min(64, BurnsGL.maxBones || 32)); groups.push(g); } return g.add(fn, Object.assign({ visible: true }, o || {})); };
    D.orb = add(m => { m.color('#bff8ff', 1).shine(3); m.ball(0, 0, 0, 3.4, { seg: 18, rings: 12 }); m.color('#38f2ff', 1); m.torus(0, 0, 0, 4.2, 0.18, { seg: 28, tseg: 4 }); m.emissive(0).shine(0); });
    D.ring = add(m => { m.color('#ffe25a', 1); m.torus(0, 0, 0, 6.2, 0.16, { seg: 32, tseg: 4 }); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; m.ball(Math.cos(a) * 6.2, 0, Math.sin(a) * 6.2, 0.4, { seg: 6, rings: 4 }); } m.emissive(0); });
    for (const j of D.jellies) j.o = add(m => stcJelly(m, STC.jellyCol[j.i], false));
    g.finish(); D.groups = groups;
  },
  onUpdate(s, dt, racing) {
    const D = s.stc, S = STC; if (!D) return;
    const live = racing && s.state === 'race' && !(s.obj && s.obj.ended);
    if (!live) { D.t += dt * 0.25; stcJellyMove(D, D.t); return; }   // idles (visuals) before the start and after the end
    D.t += dt;
    const P = s.player;
    // ---- arc fences: every `period` s two opposite stretches of the ring: warn, then live ----
    { const F = S.fence, tt = D.t - F.first;
      if (tt < 0) D.fst = 'idle';
      else {
        const c = Math.floor(tt / F.period), ph = tt - c * F.period, w0 = F.period - F.warn - F.live;
        D.fpair[0] = (c * 2 + Math.floor(c / 3)) % 3; D.fpair[1] = D.fpair[0] + 3;
        D.fst = ph < w0 ? 'idle' : ph < w0 + F.warn ? 'warn' : 'live'; D.fu = D.fst === 'warn' ? (ph - w0) / F.warn : D.fst === 'live' ? (ph - w0 - F.warn) / F.live : 0;
        if (D.fst === 'warn' && D.fwc !== c) { D.fwc = c; if (P && !P.out) { for (const i of D.fpair) if (stcSegDist(i, P.x, P.z) < 28) { s.banner('ARC FENCE CHARGING!', '#ffe25a', 1.2, 'don\'t cross the yellow line', true); break; } } Sound.play('cartSparkle', { vol: 0.4, pitch: 0.6 }); }
        if (D.fst === 'live' && D.fc !== c) { D.fc = c; D.fmask = 0; const near = P ? Math.min(stcSegDist(D.fpair[0], P.x, P.z), stcSegDist(D.fpair[1], P.x, P.z)) : 999; Sound.play('cartZap', { vol: near < 60 ? 0.9 : 0.3, pitch: 0.7 }); if (near < 25) s.shakeIt(0.4); }
        if (D.fst === 'live') for (const k of s.karts) {
          if (k.out || (D.fmask & (1 << k.slot))) continue;
          let hit = false; for (const i of D.fpair) { if (stcSegDist(i, k.x, k.z) < F.band && STC_T.u > 0.03 && STC_T.u < 0.97) { hit = true; break; } }
          if (!hit) continue;
          if (k.air && k.y > s.terrain.height(k.x, k.z) + 0.5) continue;   // hopped it (it gets another chance next step)
          D.fmask |= 1 << k.slot;
          if (s.hit(k, 'stun', null, { item: 'stcarc', banner: 'ARC FENCE!' }) && s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'spark', 12, '#bff8ff');
        }
      } }
    // ---- jelly drifters: drift; flash + a closing ring (warn); STING ----
    stcJellyMove(D, D.t);
    { const J = S.jelly;
      for (const j of D.jellies) {
        const tt = D.t - J.first + j.off; if (tt < 0) { j.st = 'drift'; continue; }
        const c = Math.floor(tt / J.period), ph = tt - c * J.period, w0 = J.period - J.warn - J.sting;
        j.st = ph < w0 ? 'drift' : ph < w0 + J.warn ? 'warn' : 'sting'; j.u = j.st === 'warn' ? (ph - w0) / J.warn : j.st === 'sting' ? (ph - w0 - J.warn) / J.sting : 0;
        if (j.st === 'warn' && j.wc !== c) { j.wc = c; if (P && !P.out && Math.hypot(P.x - j.x, P.z - j.z) < J.R0 + 6) s.banner('JELLY STING!', '#ff6ad8', 1.0, 'get out of the ring', true); }
        if (j.st === 'sting' && j.c !== c) {
          j.c = c; j.mask = 0; const nearP = P && Math.hypot(P.x - j.x, P.z - j.z) < 60; Sound.play('cartZap', { vol: nearP ? 0.7 : 0.15, pitch: 1.3 });
          if (s.fx && nearP) s.fx.burst(j.x, 0.8, j.z, 'ring', 12, STC.jellyCol[j.i]);
          for (const k of s.karts) { if (k.out || k.y > 5 || Math.hypot(k.x - j.x, k.z - j.z) > J.R + 0.8) continue; s.hit(k, 'stun', null, { item: 'stcjelly', banner: 'STUNG!' }); }
        }
      } }
    // ---- core strikes: pick a car → reticle chases it (lock) → holds (swerve!) → lightning ----
    { const K = S.strike, B = D.strike; B.t += dt;
      if (B.st === 'idle') {
        B.next -= dt;
        if (B.next <= 0) {
          let best = null, bd = 1e9; for (const k of s.karts) { if (k.out || k.hidden || k.invT > 0.5) continue; const r = Math.hypot(k.x, k.z); if (r > 150) continue; const sc = s.rng() * 60 + (k === B.last ? 80 : 0) + Math.abs(r - 70) * 0.3; if (sc < bd) { bd = sc; best = k; } }
          if (best) { B.st = 'lock'; B.t = 0; B.tgt = best; B.rx = best.x; B.rz = best.z; B.warned = false; Sound.play('cartSparkle', { vol: best.player ? 0.7 : 0.2, pitch: 1.6 }); }
          else B.next = 1;
        }
      } else if (B.st === 'lock') {
        const k = B.tgt; if (k && !k.out) { B.rx = lerp(B.rx, k.x + k.vx * 0.3, 1 - Math.exp(-8 * dt)); B.rz = lerp(B.rz, k.z + k.vz * 0.3, 1 - Math.exp(-8 * dt)); }
        if (k && k.player && !B.warned) { B.warned = true; s.banner('THE CORE LOCKED ON!', '#7af6ff', 1.3, 'swerve when the ring stops', true); }
        if (B.t > K.lock) { B.st = 'hold'; B.t = 0; }
      } else if (B.st === 'hold') {
        if (B.t > K.hold) {
          B.st = 'bolt'; B.t = 0;
          for (const k of s.karts) { if (k.out || k.y > 6) continue; const dx = k.x - B.rx, dz = k.z - B.rz, d = Math.hypot(dx, dz); if (d > K.r) continue; s.hit(k, 'knock', null, { item: 'stcbolt', dx: dx / (d || 1), dz: dz / (d || 1), power: 12, banner: 'LIGHTNING STRIKE!' }); }
          const d2 = P ? Math.hypot(P.x - B.rx, P.z - B.rz) : 999; Sound.play('cartBoom', { vol: d2 < 50 ? 0.9 : 0.25, pitch: 1.2 }); Sound.play('cartZap', { vol: d2 < 50 ? 0.8 : 0.2, pitch: 0.6 }); if (d2 < 22) s.shakeIt(0.7);
          if (s.fx && d2 < 120) { s.fx.burst(B.rx, 1, B.rz, 'ring', 16, '#bff8ff'); s.fx.burst(B.rx, 1.2, B.rz, 'spark', 16, '#ffe25a'); }
        }
      } else if (B.st === 'bolt' && B.t > K.bolt) { B.st = 'idle'; B.t = 0; B.last = B.tgt; B.tgt = null; B.next = K.period - K.lock - K.hold + s.rng() * 2; }
    }
  },
  // the moving parts (one draw call): the orb, its spinning ring, the five jellies
  render(s, R) {
    const D = s.stc, S = STC; if (!D) return;
    const t = s.time, B = D.strike, charge = B.st === 'lock' ? B.t / S.strike.lock : B.st === 'hold' ? 1 : 0;
    D.orb.x = 0; D.orb.y = S.orbY + Math.sin(t * 0.9) * 0.3; D.orb.z = 0; D.orb.yaw = t * 0.6; D.orb.scale = 1 + Math.pow(Math.max(0, Math.sin(t * 3.1)), 6) * 0.05 + charge * 0.12;
    D.ring.x = 0; D.ring.y = S.orbY; D.ring.z = 0; D.ring.yaw = t * (1 + charge * 6); D.ring.pitch = Math.sin(t * 0.7) * 0.4; D.ring.roll = Math.cos(t * 0.5) * 0.4; D.ring.scale = 1;
    for (const j of D.jellies) { const stroke = Math.pow(Math.max(0, Math.sin(t * 2 + j.i)), 3), sq = j.st === 'sting' ? 0.82 : 1 - stroke * 0.08 - (j.st === 'warn' ? Math.sin(t * 40) * 0.03 : 0); j.o.x = j.x; j.o.y = j.y + stroke * 0.6; j.o.z = j.z; j.o.yaw = t * 0.15 + j.i; j.o.pitch = Math.sin(t * 0.6 + j.i) * 0.08; j.o.roll = Math.cos(t * 0.5 + j.i) * 0.08; j.o.scale = S.jelly.sc * sq; }
    for (const G of D.groups) { G.pose(s.cam); R.skin(G.geo, G.bones, G.objs.length, null, 0, 0.5); }
  },
  draw(s, R, Sp, t) {
    const D = s.stc, S = STC, C = S.C; if (!D) return;
    const cam = s.cam, B = D.strike;
    // the core's orb halo; idle crackle from the orb to the cage
    R.bbs.bb(0, S.orbY, 0, 22, 22, Sp.glow, C.cyan, 0.5, true);
    if (stcH(Math.floor(t * 10)) > 0.45) { const a = stcH(Math.floor(t * 10) + 3) * TAU; stcBolt(R, Sp, 0, S.orbY, 0, Math.cos(a) * (S.coreR - 2), 27, Math.sin(a) * (S.coreR - 2), 5, 1.4, 0.22, C.cyan, 0.9, 3, t); }
    // the pylons' toroids glow; the fences' warning and their lightning
    for (let i = 0; i < S.pyN; i++) { const p = D.py[i], on = D.fst !== 'idle' && (D.fpair[0] === i || D.fpair[1] === i || (D.fpair[0] + 1) % S.pyN === i || (D.fpair[1] + 1) % S.pyN === i); R.bbs.bb(p.x, 12.6, p.z, on ? 9 : 5, on ? 9 : 5, Sp.glow, on && D.fst === 'warn' ? C.volt : C.cyan, on ? 0.8 : 0.4, true); }
    if (D.fst !== 'idle') for (const i of D.fpair) {
      const a = D.py[i], b = D.py[(i + 1) % S.pyN], mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, L = Math.hypot(b.x - a.x, b.z - a.z), yaw = Math.atan2(b.x - a.x, b.z - a.z);
      if (Math.hypot(mx - cam.x, mz - cam.z) > 260) continue;
      if (D.fst === 'warn') {
        const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 20)), n = 14;
        for (let k = 0; k < n; k++) { const u = (k + 0.5) / n, x = lerp(a.x, b.x, u), z = lerp(a.z, b.z, u); R.flat.flat(x, 0.12, z, 0.8, L / n * 1.2, yaw + (k % 2 ? 0.6 : -0.6), Sp.square, C.volt, 0.9 * fl, true); }
        R.flat.flat(mx, 0.1, mz, S.fence.band * 2.2, L, yaw, Sp.square, C.volt, 0.2 * fl, true);
        const reach = D.fu * 0.5;
        stcBolt(R, Sp, a.x, 1.4, a.z, lerp(a.x, b.x, reach), 1.4, lerp(a.z, b.z, reach), 7, 1.6, 0.2, C.cyan, 0.9, i * 5, t);
        stcBolt(R, Sp, b.x, 1.4, b.z, lerp(b.x, a.x, reach), 1.4, lerp(b.z, a.z, reach), 7, 1.6, 0.2, C.cyan, 0.9, i * 5 + 1, t);
      } else {
        const al = 1 - D.fu * 0.4;
        for (let k = 0; k < 3; k++) stcBolt(R, Sp, a.x, k === 2 ? 12.6 : 1.4, a.z, b.x, k === 2 ? 12.6 : 1.4 + k * 1.2, b.z, 16, 2.6, k ? 0.2 : 0.36, k === 1 ? C.violet : C.cyan, al, i * 11 + k * 7, t);
        R.flat.flat(mx, 0.1, mz, 7, L, yaw, Sp.glow, C.ice, 0.55 * al, true);
        for (let k = 0; k < 4; k++) { const u = (k + 0.5) / 4; R.bbs.bb(lerp(a.x, b.x, u), 2, lerp(a.z, b.z, u), 9, 6, Sp.glow, C.cyan, 0.4 * al, true); }
      }
    }
    // jellies: glow, warning ring, sting bolts
    for (const j of D.jellies) {
      if (Math.hypot(j.x - cam.x, j.z - cam.z) > 240) continue;
      const sc = S.jelly.sc, col = j.col;
      R.bbs.bb(j.x, j.y + 0.9 * sc, j.z, 8 * sc, 8 * sc, Sp.glow, col, j.st === 'drift' ? 0.3 : 0.6, true);
      R.flat.flat(j.x, 0.07, j.z, 7 * sc, 7 * sc, 0, Sp.glow, col, 0.22, true);
      if (j.st === 'warn') {
        const fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 18)), r = lerp(S.jelly.R0, S.jelly.R, j.u);
        R.flat.flat(j.x, 0.13, j.z, r * 2, r * 2, t, Sp.ring, col, 0.95 * fl, true);
        R.flat.flat(j.x, 0.12, j.z, S.jelly.R * 2, S.jelly.R * 2, 0, Sp.ring, C.white, 0.6, true);
        R.flat.flat(j.x, 0.11, j.z, S.jelly.R * 2, S.jelly.R * 2, 0, Sp.glow, col, 0.35 * j.u, true);
        R.bbs.bb(j.x, j.y + 0.8 * sc, j.z, 3.4 * sc, 3.4 * sc, Sp.core, C.white, 0.5 + 0.5 * fl, true);
      } else if (j.st === 'sting') {
        const al = 1 - j.u * 0.6;
        for (let k = 0; k < 6; k++) { const a2 = k / 6 * TAU + t * 3; stcBolt(R, Sp, j.x, j.y - 1, j.z, j.x + Math.cos(a2) * S.jelly.R * 0.8, 0.2, j.z + Math.sin(a2) * S.jelly.R * 0.8, 5, 1.2, 0.2, col, al, j.i * 9 + k, t); }
        R.flat.flat(j.x, 0.14, j.z, S.jelly.R * 2.4, S.jelly.R * 2.4, 0, Sp.glow, C.white, 0.85 * al, true);
        R.flat.flat(j.x, 0.15, j.z, S.jelly.R * 2 * (1 + j.u * 0.4), S.jelly.R * 2 * (1 + j.u * 0.4), 0, Sp.ring, col, al, true);
      }
    }
    // the core strike: a reticle chasing the target, a beam of static from the orb, then the bolt
    if (B.st === 'lock' || B.st === 'hold') {
      const hold = B.st === 'hold', a = hold ? 0.95 : 0.55 + 0.35 * Math.sin(t * 14), rr = hold ? S.strike.r * 2 : S.strike.r * 2 + (1 - B.t / S.strike.lock) * 6;
      R.flat.flat(B.rx, 0.14, B.rz, rr, rr, t * (hold ? 0 : 2), Sp.reticle || Sp.warn, hold ? C.volt : C.cyan, a, true);
      R.flat.flat(B.rx, 0.12, B.rz, S.strike.r * 2, S.strike.r * 2, 0, Sp.glow, C.cyan, 0.3 * a, true);
      R.bbs.streak(B.rx * 0.5, S.orbY * 0.5, B.rz * 0.5, B.rx, -S.orbY, B.rz, Math.hypot(B.rx, S.orbY, B.rz), 0.3, Sp.streak, C.cyan, 0.3 * a);
    } else if (B.st === 'bolt') {
      const al = 1 - B.t / S.strike.bolt * 0.6;
      for (let k = 0; k < 3; k++) stcBolt(R, Sp, 0, S.orbY, 0, B.rx, 0.3, B.rz, 12, 4, k ? 0.3 : 0.6, k === 1 ? C.violet : C.cyan, al, 90 + k * 13, t);
      R.flat.flat(B.rx, 0.14, B.rz, S.strike.r * 3, S.strike.r * 3, 0, Sp.glow, C.white, 0.9 * al, true);
      R.flat.flat(B.rx, 0.13, B.rz, S.strike.r * 2.4, S.strike.r * 2.4, t, Sp.scorch || Sp.shadow, C.black, 0.6, false);
    }
    // smoke over the vents; marine snow round the camera
    for (const v of s.E.stcVents || []) if (Math.hypot(v[0] - cam.x, v[1] - cam.z) < 160) for (let i = 0; i < 3; i++) { const u = (t * 0.25 + i / 3) % 1; R.bbs.bb(v[0] + Math.sin(t * 0.7 + i) * u * 2, v[2] + 1 + u * 14, v[1], 4 + u * 7, 4 + u * 7, Sp.smoke, [0.12, 0.1, 0.12], 0.55 * (1 - u), false); }
    for (let i = 0; i < 70; i++) {
      const bx = 70, by = 24, ox = stcH(i * 1.31) * bx, oz = stcH(i * 2.77) * bx, oy = stcH(i * 4.13) * by;
      const x = cam.x - bx / 2 + ((((ox + t * (stcH(i * 5.9) - 0.5) * 1.2 - cam.x) % bx) + bx) % bx), z = cam.z - bx / 2 + ((((oz + t * 0.3 - cam.z) % bx) + bx) % bx), y = ((((oy - t * 0.5) % by) + by) % by);
      R.bbs.bb(x, y + 0.3, z, 0.22, 0.22, Sp.dot, i % 5 ? C.snow : C.cyan, 0.75, true);
    }
  },
  lights(s, add) {
    const D = s.stc, S = STC; if (!D) return;
    add(0, S.orbY, 0, 34, S.C.cyan, 1.2, 1.5);
    if (D.fst === 'live') for (const i of D.fpair) { const a = D.py[i], b = D.py[(i + 1) % S.pyN]; add((a.x + b.x) / 2, 3, (a.z + b.z) / 2, 34, S.C.ice, 1.6, 2); }
    for (const j of D.jellies) if (j.st !== 'drift') add(j.x, j.y, j.z, j.st === 'sting' ? 18 : 10, j.col, j.st === 'sting' ? 1.8 : 0.8, 1);
    if (D.strike.st === 'bolt') add(D.strike.rx, 4, D.strike.rz, 26, S.C.ice, 2.0, 2);
  },
  radar(s, ctx, P, sc) {
    const D = s.stc, S = STC, q = CART_ROY_T.p; if (!D) return;
    P(0, 0, q); ctx.strokeStyle = 'rgba(255,226,90,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x, q.y, S.ringR * sc, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(120,240,255,0.9)'; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(2, S.coreR * sc), 0, TAU); ctx.fill();
    if (D.fst !== 'idle') { ctx.strokeStyle = D.fst === 'live' ? 'rgba(200,250,255,0.95)' : 'rgba(255,226,90,0.9)'; ctx.lineWidth = 2.5; for (const i of D.fpair) { const a = D.py[i], b = D.py[(i + 1) % S.pyN]; P(a.x, a.z, q); const ax = q.x, ay = q.y; P(b.x, b.z, q); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(q.x, q.y); ctx.stroke(); } }
    for (const p of D.py) { P(p.x, p.z, q); ctx.fillStyle = 'rgba(56,242,255,0.85)'; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }
    for (const j of D.jellies) { P(j.x, j.z, q); ctx.fillStyle = j.st === 'drift' ? 'rgba(255,106,216,0.45)' : 'rgba(255,106,216,0.95)'; ctx.beginPath(); ctx.arc(q.x, q.y, j.st === 'drift' ? 2 : 3.5, 0, TAU); ctx.fill(); }
  }
};
// the jellies' slow drift: each on its own wandering loop between the core plaza and the fence
function stcJellyMove(D, t) {
  for (const j of D.jellies) { const a = j.i / STC.jelly.n * TAU + t * 0.045 * (j.i % 2 ? 1 : -1), r = 82 + 52 * Math.sin(t * 0.06 + j.i * 1.3); j.x = Math.sin(a) * r; j.z = Math.cos(a) * r; j.y = STC.jelly.y + Math.sin(t * 0.5 + j.i) * 0.6 - (j.st === 'warn' ? j.u * 1.2 : j.st === 'sting' ? 1.2 : 0); }
}
// a jagged bolt of light (the same recipe as the track's), flickering 30 times a second
function stcBolt(R, Sp, x0, y0, z0, x1, y1, z1, n, jit, w, col, a, seed, t) {
  const fr = Math.floor(t * 30) * 7.3 + seed;
  let px = x0, py = y0, pz = z0;
  for (let i = 1; i <= n; i++) {
    const u = i / n, k = i < n ? 1 : 0, x = lerp(x0, x1, u) + (stcH(fr + i * 3.1) - 0.5) * jit * k, y = lerp(y0, y1, u) + (stcH(fr + i * 5.7) - 0.5) * jit * 0.8 * k, z = lerp(z0, z1, u) + (stcH(fr + i * 9.3) - 0.5) * jit * k;
    const dx = x - px, dy = y - py, dz = z - pz, l = Math.hypot(dx, dy, dz) || 1;
    R.bbs.streak((x + px) / 2, (y + py) / 2, (z + pz) / 2, dx / l, dy / l, dz / l, l * 1.15, w * 2.4, Sp.streak, col, a * 0.7);
    R.bbs.streak((x + px) / 2, (y + py) / 2, (z + pz) / 2, dx / l, dy / l, dz / l, l * 1.1, w, Sp.streak, STC.C.white, a);
    px = x; py = y; pz = z;
  }
}

/* ---------------- the registry ---------------- */
CART_ARENAS.push({
  id: 'stormcell', name: 'THE STORM CELL', sub: 'Battle royale: arc fences, stinging jellies, the storm core', objectives: ['royale'], royale: true, levelCar: 'jelly',
  col: '#38f2ff', tod: 'night', blurb: 'Jelly Jolt\'s storm pit at the bottom of the trench. Dodge the arc fences, the jelly stings and the core\'s lightning. Last car running wins.'
});
CART_ROYALE_ARENAS.jelly = 'stormcell';
CART_ARENA_ICONS.stormcell = (ctx, s, t, col) => {
  // a jellyfish bell crackling with a lightning bolt
  const p = 1 + Math.pow(Math.max(0, Math.sin(t * 3)), 6) * 0.08;
  ctx.save(); ctx.fillStyle = '#04142a'; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = rgba(col, 0.85); ctx.beginPath(); ctx.ellipse(0, -s * 0.08, s * 0.42 * p, s * 0.34 * p, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = 2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.16, -s * 0.06); ctx.quadraticCurveTo(i * s * 0.16 + Math.sin(t * 3 + i) * s * 0.08, s * 0.25, i * s * 0.14, s * 0.5); ctx.stroke(); }
  ctx.fillStyle = '#ffe25a'; ctx.beginPath(); ctx.moveTo(s * 0.05, -s * 0.36); ctx.lineTo(-s * 0.12, -s * 0.06); ctx.lineTo(0, -s * 0.06); ctx.lineTo(-s * 0.06, s * 0.16); ctx.lineTo(s * 0.13, -s * 0.13); ctx.lineTo(s * 0.02, -s * 0.13); ctx.closePath(); ctx.fill();
  ctx.restore();
};
