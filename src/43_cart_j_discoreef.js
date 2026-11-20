/* ============================================================
   ART CART — DISCO REEF, Glitterfin's career track (level agent "fish", Nov 19 2026).
   Recipe: docs/ART_CART_LEVEL_RECIPE.md (Love Parade is the worked example; this is its own layout and look).
   A coral reef at night, every coral head tiled in tiny mirrors; a sunken roller rink in the middle. One lap ≈ 1.14 km:
     GLITTER GATE        the start under an arch of mirror balls, giant clams with pearl disco balls either side
     THE VELVET ROPE     a zig-zag past three BOUNCERS (big groupers in shades) who work SPOTLIGHTS: the spot sweeps
                         the road and follows a car, then STOPS and blinks amber (1.1 s), then FLASHES: caught in it
                         you're dazzled (wobbly steering, a little slower). Counterplay: steer out when it stops
     THE ROLLER RINK     the road widens into a glossy rink floor round a bandstand with a giant mirror ball. The floor
                         is SLICK (less grip everywhere on it). ROLLER CRABS skate loops across it (they spin you:
                         weave between them, or HOP over them), and the WAX TURTLE crosses the rink polishing the
                         floor: its shiny wax stripe makes you slide (go straight over it, or hop it)
     CORAL CANYON        three conch-shell chutes ROLL GIANT MIRROR BALLS across the road; a sparkling lane shows
                         the ball's path 1.3 s before it rolls (brake or find the gap; you can't hop a 4 m ball)
     KELP STRAIGHT       fairy-lit kelp, boost pads, back to the gate
   Glitterfin's MIRROR SCHOOL is in everyone's gift boxes here (CART_TRACKS.discoreef.car = 'fish').
   Start it without the menus: BRADY_CART.debug.start({ mode: 'career', track: 'discoreef' }) (or mode 'quick').
   Globals are prefixed DRF_ / drf, the world's data is E.drf, the run-time state s.drf.
   ============================================================ */
const DRF_C = { cyan: [0.3, 0.92, 1], ice: [0.75, 0.9, 1], white: [1, 1, 1], pink: [1, 0.35, 0.82], violet: [0.66, 0.4, 1], amber: [1, 0.68, 0.18], warn: [1, 0.45, 0.15], gold: [1, 0.85, 0.4], black: [0, 0, 0], wax: [0.85, 1, 0.95], mint: [0.4, 1, 0.75] };
const DRF_PAL = ['#38f2ff', '#ff6ad0', '#bfe0ff', '#a070ff', '#ffd84a', '#5affc8'];
const DRF_PAL_F = DRF_PAL.map(c => burnsRGBf(c));
const DRF_T = { at: {}, at2: {} };

/* ---------------- the course ---------------- */
// corners [x, z, radius]: the start strand (east), the velvet-rope zig-zag (north), the rink U-turn round the bandstand,
// coral canyon (west), the kelp straight back south
const DRF_POLY = [[-145, -8, 34], [60, -8, 28], [110, 42, 24], [94, 119, 26], [162, 170, 28], [170, 272, 34], [94, 272, 34], [94, 187, 20], [17, 196, 24], [-51, 255, 30], [-145, 212, 32], [-187, 102, 36]];
// the rink widens the road to 1.45x (a smooth ramp in and out)
const drfWidth = (x, z) => x > 60 && x < 200 ? 1 + 0.45 * BurnsM.smoothstep(196, 226, z) : 1;
// this file sorts before the kit: make sure the registries exist (the kit keeps them: same guard)
var CART_TRACK_RULES = (typeof CART_TRACK_RULES !== 'undefined' && CART_TRACK_RULES) || {};
var CART_CAREER_TRACKS = (typeof CART_CAREER_TRACKS !== 'undefined' && CART_CAREER_TRACKS) || {};
CART_TRACKS.discoreef = {
  name: 'DISCO REEF', car: 'fish', tod: 'night', music: 'kart3', width: 20, shoulder: 6, theme: 'reef', blurb: 'Spotlight bouncers, roller crabs and rolling mirror balls',
  get pts() { return this._pts || (this._pts = CartKit.course(DRF_POLY, { start: [-40, -8], width: drfWidth, step: 18 })); },   // lazy: the kit (43_cart_j_kit.js) loads after this file
  world: (id, D) => drfWorld(id, D)
};
CART_CAREER_TRACKS.fish = 'discoreef';

/* ---------------- materials ---------------- */
// a mirror-tile shimmer: each vertex a slightly different silver / ice / lilac (reads as tiny mirrors under the gloss)
const DRF_MIRROR = ['#ffffff', '#dfefff', '#c8dcf4', '#efe2ff', '#ffffff', '#b8d4f0'];
const drfMirrorCol = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return DRF_MIRROR[Math.floor((h - Math.floor(h)) * 6)]; };
// the big balls: stronger contrast, so the tiles read from far off (dark facets reflect the night)
const DRF_BIG = ['#ffffff', '#3a4a6a', '#c8dcf4', '#6a7aa0', '#ffffff', '#9ab0d8', '#ffd8f4', '#2a3450'];
const drfBigCol = (x, y, z) => { const h = Math.sin(Math.round(x * 2.2) * 127.1 + Math.round(y * 2.2) * 311.7 + Math.round(z * 2.2) * 74.7) * 43758.5453; return DRF_BIG[Math.floor((h - Math.floor(h)) * 8)]; };
// a mirror ball (centre cx, cy, cz, radius r): tiled sphere, glossy, faintly lit
function drfMirrorBall(m, cx, cy, cz, r, e) { m.color('#ffffff', e || 0.12).shine(3); m.ellipsoid(cx, cy, cz, r, r, r, { seg: m.lo ? 10 : 16, rings: m.lo ? 7 : 11, colFn: drfMirrorCol }); m.emissive(0).shine(0); }

/* ---------------- static pieces (merged into the world's chunks) ---------------- */
// the start arch: two coral pillars and a half-ring of mirror balls over the road (lowest point over the road ≥ 9 m)
function drfGateArch(m, W) {
  const H = 14, R = W / 2, lights = [];
  for (const sd of [-1, 1]) {
    // a stacked-coral pillar: lumpy mirror balls getting smaller up to 9 m
    m.color('#2a1a3a').shine(1); m.roundBox(sd * R, 0.6, 0, 2.6, 1.2, 2.6, 0.4); m.shine(0);
    for (let k = 0; k < 6; k++) drfMirrorBall(m, sd * (R + Math.sin(k * 2.1) * 0.25), 1.6 + k * 1.45, Math.cos(k * 1.7) * 0.25, 1.15 - k * 0.07, 0.1);
  }
  // the arc: a dark spine with mirror balls along it, alternating sizes, cyan and pink neon between
  const N = 15;
  for (let i = 0; i <= N; i++) {
    const a = Math.PI * i / N, x = -Math.cos(a) * R, y = 9 + Math.sin(a) * (H - 9);
    if (i < N) { const a2 = Math.PI * (i + 1) / N, x2 = -Math.cos(a2) * R, y2 = 9 + Math.sin(a2) * (H - 9); m.color(i % 2 ? '#38f2ff' : '#ff6ad0', 1); m.limb(x, y, 0, x2, y2, 0, 0.16, 0.16, { seg: 6, ends: false }); m.emissive(0); }
    drfMirrorBall(m, x, y, 0, i % 2 ? 0.75 : 1.05, 0.18);
    if (i % 2 === 0) lights.push({ x, y: y - 1.1, z: 0, s: 1.4, c: i % 4 ? '#ff6ad0' : '#38f2ff' });
  }
  return { cols: [{ t: 'cyl', x: -R, z: 0, r: 1.4, y0: 0, y1: 9, camPass: true }, { t: 'cyl', x: R, z: 0, r: 1.4, y0: 0, y1: 9, camPass: true }], lights };
}
// a giant clam (facing +z) holding a pearl that's a mirror ball
function drfClam(m) {
  m.color('#3a2a5a').shine(2);
  m.push(); m.tf(0, 0.9, 0, 0, 0, 0, 1, 0.55, 1); m.lathe([[0, -1], [3.2, 0.2], [3.4, 0.9], [0, 0.9]], { seg: 20, rMod: (th) => 1 + 0.08 * Math.cos(th * 9) }); m.pop();
  m.push(); m.tf(0, 1.4, -1.2, 0, -0.75, 0, 1, 0.5, 1); m.color('#5a3a8a').shine(2); m.lathe([[0, 1], [3.2, -0.2], [3.4, -0.9], [0, -0.9]], { seg: 20, rMod: (th) => 1 + 0.08 * Math.cos(th * 9) }); m.pop();
  m.color('#ff9ae8', 0.7); m.torus(0, 1.35, 0, 3.1, 0.08, { seg: 28, tseg: 3 }); m.emissive(0).shine(0);
  drfMirrorBall(m, 0, 2.6, 0.4, 1.35, 0.25);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.2, y0: 0, y1: 3 }], lights: [{ x: 0, y: 2.6, z: 1.9, s: 2.4, c: '#ff9ae8' }] };
}
// a bouncer: a big grouper standing on his tail in shades and a bow tie, arms (fins) folded; velvet rope posts along
// local x in front of him (+z faces the road). His spotlight's head is a pooled object (it aims).
function drfBouncer(m) {
  m.color('#22183a').shine(1); m.roundCyl(0, 0, 0, 1.5, 0.5, 0.15); m.shine(0);
  // body: a chunky upright fish, darker back, pale belly
  m.color('#3a5aa8').shine(2); m.ellipsoid(0, 2.6, 0, 1.25, 2.0, 1.05, { seg: 14, rings: 10 });
  m.color('#c8d8f0'); m.ellipsoid(0, 2.3, 0.5, 0.95, 1.55, 0.62, { seg: 12, rings: 8 });
  m.color('#2a3a7a'); for (let i = 0; i < 6; i++) m.ball(Math.sin(i * 2.4) * 0.9, 1.6 + i * 0.45, -0.55 + Math.cos(i * 1.3) * 0.2, 0.16, { seg: 6, rings: 4 });
  // tail on the ground, dorsal fin
  m.color('#2a3a7a'); m.push(); m.tf(0, 0.55, -0.8, 0, 0.3, 0); m.ellipsoid(0, 0, 0, 1.1, 0.25, 0.7, { seg: 10, rings: 5 }); m.pop();
  m.color('#ff6ad0', 0.15); m.push(); m.tf(0, 3.6, -0.6, 0, 0, 0); m.ellipsoid(0, 0.4, 0, 0.12, 0.7, 0.8, { seg: 8, rings: 5 }); m.pop(); m.emissive(0);
  // big lips, shades, a bow tie
  m.color('#e88aa0').shine(2); m.ellipsoid(0, 3.7, 0.95, 0.55, 0.22, 0.25, { seg: 10, rings: 5 }); m.shine(0);
  m.color('#0a0a12').shine(3); for (const sd of [-1, 1]) m.roundBox(sd * 0.42, 4.25, 0.82, 0.62, 0.32, 0.12, 0.08); m.limb(-0.15, 4.28, 0.88, 0.15, 4.28, 0.88, 0.04, 0.04, { seg: 4 }); m.shine(0);
  m.color('#ffffff', 0.4); m.ball(-0.55, 4.33, 0.9, 0.06, { seg: 5, rings: 3 }); m.emissive(0);
  m.color('#ff2a6a', 0.2); m.ball(0, 3.05, 1.0, 0.13, { seg: 6, rings: 4 }); for (const sd of [-1, 1]) m.ellipsoid(sd * 0.26, 3.05, 1.0, 0.24, 0.15, 0.07, { seg: 8, rings: 4 }); m.emissive(0);
  // folded fins across the chest
  m.color('#2e4a96'); for (const sd of [-1, 1]) m.limb(sd * 1.15, 2.9, 0.2, -sd * 0.45, 2.45, 1.0, 0.24, 0.16, { seg: 7 });
  // the spotlight's stand beside him
  m.color('#3a3448').shine(2); m.limb(1.9, 0, 0.3, 1.9, 3.6, 0.3, 0.09, 0.07, { seg: 6 }); for (const a of [0, 2.1, 4.2]) m.limb(1.9, 0.1, 0.3, 1.9 + Math.sin(a) * 0.7, 0, 0.3 + Math.cos(a) * 0.7, 0.05, 0.05, { seg: 4 }); m.shine(0);
  // velvet rope: gold posts, a red rope sagging between them
  const posts = [-6, -3.6, -1.2, 3.6, 6];
  m.color('#ffd84a', 0.25).shine(3); for (const x of posts) { m.limb(x, 0, 1.6, x, 1.05, 1.6, 0.06, 0.06, { seg: 6 }); m.ball(x, 1.12, 1.6, 0.11, { seg: 7, rings: 5 }); m.roundCyl(x, 0, 1.6, 0.28, 0.08, 0.04); } m.emissive(0).shine(0);
  m.color('#c4103a', 0.15); for (let i = 0; i < posts.length - 1; i++) { const a = posts[i], b = posts[i + 1]; if (b - a > 3) continue; const mid = (a + b) / 2; m.limb(a, 1.0, 1.6, mid, 0.72, 1.6, 0.05, 0.05, { seg: 5 }); m.limb(mid, 0.72, 1.6, b, 1.0, 1.6, 0.05, 0.05, { seg: 5 }); } m.emissive(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.3, y0: 0, y1: 4.6 }], lights: [{ x: 1.9, y: 3.9, z: 0.8, s: 1.6, c: '#bfe0ff' }, { x: 0, y: 4.6, z: 0.6, s: 1.0, c: '#ff6ad0' }] };
}
// a conch-shell ball chute (facing +z, the mouth toward the road; the ball is pooled)
function drfChute(m) {
  m.color('#3a2236').shine(1); m.roundBox(0, 0.4, -0.6, 4.6, 0.8, 5.2, 0.3); m.shine(0);
  // the shell: a spiral of tapering mirror-tiled rings, a pink lip round the mouth
  for (let i = 0; i < 9; i++) { const u = i / 8, r = 2.9 - u * 2.3, y = 2.6 + u * 1.6, z = -0.4 - u * 3.2, x = Math.sin(u * 5) * 0.5; m.color('#ffffff', 0.08).shine(3); m.push(); m.tf(x, y, z, 0, Math.PI / 2, 0); m.torus(0, 0, 0, r, 0.42 - u * 0.2, { seg: m.lo ? 10 : 18, tseg: 6 }); m.pop(); }
  m.color('#ff6ad0', 0.9).shine(2); m.push(); m.tf(0, 2.6, 0.15, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 3.0, 0.24, { seg: 24, tseg: 5 }); m.pop();
  m.color('#100816').shine(0); m.push(); m.tf(0, 2.6, -0.1, 0, Math.PI / 2, 0); m.disc(0, 0, 0, 2.75, 20); m.pop(); m.emissive(0);
  // a ramp lip down to the road
  m.color('#5a3a7a').shine(2); m.push(); m.tf(0, 0.25, 1.4, 0, -0.18, 0); m.roundBox(0, 0, 0, 4.2, 0.3, 2.6, 0.12); m.pop(); m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: -1.6, hx: 2.6, hz: 2.2, y0: 0, y1: 5 }], lights: [{ x: 0, y: 5.6, z: 0.2, s: 1.6, c: '#ff6ad0' }, { x: -2.6, y: 2.6, z: 0.3, s: 1.0, c: '#ffffff' }, { x: 2.6, y: 2.6, z: 0.3, s: 1.0, c: '#ffffff' }] };
}
// a coral hoop the balls roll into on the far side
function drfCatcher(m) {
  m.color('#2a1a3a').shine(1); m.roundBox(0, 0.3, -1, 5.4, 0.6, 4.2, 0.25); m.shine(0);
  m.color('#ff6ad0', 0.35).shine(2); m.push(); m.tf(0, 2.6, 0, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 2.9, 0.45, { seg: 22, tseg: 6 }); m.pop(); m.shine(0);
  for (let i = 0; i < 7; i++) { const a = -0.3 + i / 6 * (Math.PI + 0.6), x = Math.cos(a) * 3.2, y = 2.6 + Math.sin(a) * 3.2; drfMirrorBall(m, x, y, 0, 0.32 + (i % 2) * 0.12, 0.25); }
  m.color('#0c0612'); m.push(); m.tf(0, 2.6, -0.4, 0, Math.PI / 2, 0); m.disc(0, 0, 0, 2.5, 18); m.pop();
  return { cols: [{ t: 'cyl', x: -2.9, z: 0, r: 0.6, y0: 0, y1: 5 }, { t: 'cyl', x: 2.9, z: 0, r: 0.6, y0: 0, y1: 5 }], lights: [{ x: 0, y: 6, z: 0.3, s: 1.4, c: '#38f2ff' }] };
}
// the rink's bandstand: a round stage, a truss mast holding the giant mirror ball (the ball itself is pooled: it turns)
function drfBandstand(m) {
  const lights = [];
  m.color('#241838').shine(2); m.lathe([[9, 0], [9, 1.1], [8.6, 1.4], [0, 1.4]], { seg: 32 });
  m.color('#38f2ff', 1); m.torus(0, 1.12, 0, 9.02, 0.08, { seg: 44, tseg: 4 }); m.color('#ff6ad0', 1); m.torus(0, 0.45, 0, 9.02, 0.07, { seg: 44, tseg: 4 }); m.emissive(0);
  // a scalloped shell canopy over the back of the stage
  for (let i = 0; i < 7; i++) { const a = -1.2 + i * 0.4; m.color(i % 2 ? '#ffd8f0' : '#ffffff', 0.12).shine(2); m.push(); m.tf(Math.sin(a) * 5.5, 1.4, Math.cos(a) * 5.5 - 0.5, a + Math.PI, -0.35, 0); m.ellipsoid(0, 3.2, 0, 1.1, 3.4, 0.25, { seg: 10, rings: 6 }); m.pop(); }
  m.emissive(0).shine(0);
  // the mast: three legs leaning in to 17 m
  m.color('#d0d4e0').shine(3); const H = 17;
  for (let i = 0; i < 3; i++) { const a = i / 3 * TAU, b = (i + 1) / 3 * TAU; m.limb(Math.sin(a) * 3.2, 1.4, Math.cos(a) * 3.2, Math.sin(a) * 0.7, H, Math.cos(a) * 0.7, 0.14, 0.09, { seg: 6 }); for (let k = 0; k < 5; k++) { const y0 = 1.4 + k * (H - 1.4) / 5, y1 = y0 + (H - 1.4) / 5, r0 = lerp(3.2, 0.7, k / 5), r1 = lerp(3.2, 0.7, (k + 1) / 5); m.limb(Math.sin(a) * r0, y0, Math.cos(a) * r0, Math.sin(b) * r1, y1, Math.cos(b) * r1, 0.05, 0.05, { seg: 4 }); } }
  m.shine(0);
  for (let i = 0; i < 8; i++) lights.push({ x: Math.sin(i * 0.785) * 9, y: 1.2, z: Math.cos(i * 0.785) * 9, s: 1.2, c: i % 2 ? '#ff6ad0' : '#38f2ff' });
  lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#bfe0ff', pool: 26 });
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 9.2, y0: 0, y1: 4 }], lights };
}

/* ---------------- instanced props (this world only) ---------------- */
const DRF_KINDS = {
  // branching coral, every tip a little mirror ball (tinted)
  drf_coral: { r: 3, near: 36, mid: 130, farD: 330, glows: [[0, 4.8, 0, 1.6], [1.6, 3.6, 0.6, 1.1]], pool: 7,
    build(m, o) {
      m.color('#2a1a3a').shine(1); m.ellipsoid(0, 0.3, 0, 1.6, 0.7, 1.4, { seg: m.lo ? 8 : 12, rings: m.lo ? 4 : 6 }); m.shine(0);
      const B = [[0, 4.8, 0], [1.6, 3.6, 0.6], [-1.4, 3.9, -0.4], [0.6, 3.0, -1.4], [-0.8, 2.8, 1.3], [1.0, 5.6, -0.6]];
      for (let i = 0; i < B.length; i++) { const [x, y, z] = B[i]; m.color('#ffffff', o.night ? 0.12 : 0.02).shine(2); m.limb(x * 0.25, 0.5, z * 0.25, x, y - 0.3, z, 0.42, 0.14, { seg: m.lo ? 5 : 7 }); drfMirrorBall(m, x, y, z, 0.38 + (i % 3) * 0.1, o.night ? 0.3 : 0.05); }
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.5, y0: 0, y1: 4, camPass: true }] };
    },
    far(m, o) { m.color('#ffffff', o.night ? 0.25 : 0.05); m.box(0, 2.4, 0, 1.4, 4.8, 1.4); m.ball(0, 4.8, 0, 0.6, { seg: 6, rings: 4 }); m.ball(1.4, 3.6, 0, 0.5, { seg: 6, rings: 4 }); m.emissive(0); } },
  // kelp strands strung with fairy lights (tinted)
  drf_kelp: { r: 2, soft: 0.3, near: 36, mid: 130, farD: 320, glows: [[0, 7, 0, 1.8]], pool: 6,
    build(m, o) {
      for (let k = 0; k < 3; k++) {
        const bx = (k - 1) * 0.7, bz = Math.sin(k * 2) * 0.5, n = m.lo ? 5 : 8, H = 7.5 + k * 1.2;
        let px = bx, py = 0, pz = bz;
        for (let i = 1; i <= n; i++) { const y = H * i / n, x = bx + Math.sin(i * 0.9 + k) * 0.55, z = bz + Math.cos(i * 0.7 + k) * 0.35; m.color('#ffffff', 0.06); m.limb(px, py, pz, x, y, z, 0.22 - i * 0.015, 0.2 - i * 0.015, { seg: 5 }); m.ellipsoid(x + 0.35, y - 0.3, z, 0.45, 0.12, 0.2, { seg: 6, rings: 3 }); m.color('#fff8d8', o.night ? 1 : 0.3); m.ball(x - 0.18, y - 0.15, z + 0.12, 0.08, { seg: 4, rings: 3 }); px = x; py = y; pz = z; }
      }
      m.emissive(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.8, y0: 0, y1: 2, camPass: true }] };
    },
    far(m, o) { m.color('#ffffff', o.night ? 0.12 : 0); m.box(0, 4, 0, 1.2, 8, 0.4); m.emissive(0); } },
  // a mirror-ball lamp on a coral stalk (tinted ring, the ball stays silver)
  drf_ball: { r: 1.5, near: 40, mid: 140, farD: 340, glows: [[0, 5.2, 0, 2.6]], pool: 9,
    build(m, o) {
      m.color('#2a1a3a').shine(1); m.ellipsoid(0, 0.25, 0, 0.9, 0.5, 0.9, { seg: 10, rings: 5 }); m.shine(0);
      m.color('#ffffff', 0.15).shine(2); m.limb(0, 0.4, 0, 0.3, 2.4, 0.1, 0.28, 0.16, { seg: 6 }); m.limb(0.3, 2.4, 0.1, -0.1, 4.2, 0, 0.16, 0.12, { seg: 6 }); m.shine(0);
      m.color('#ffffff', o.night ? 1 : 0.3); m.torus(0, 4.3, 0, 0.55, 0.07, { seg: 14, tseg: 3 }); m.emissive(0);
      drfMirrorBall(m, 0, 5.2, 0, 0.95, o.night ? 0.35 : 0.08);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.6, y0: 0, y1: 5, camPass: true }] };
    },
    far(m, o) { m.color('#ffffff', o.night ? 0.4 : 0.1); m.ball(0, 5.2, 0, 0.95, { seg: 6, rings: 4 }); m.box(0, 2.3, 0, 0.3, 4.4, 0.3); m.emissive(0); } },
  // an LED starfish stud on the road edge
  drf_stud: { r: 0.6, near: 40, mid: 140, farD: 260, noAO: true, shadow: false,
    build(m) { const P = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = i % 2 ? 0.1 : 0.26; P.push([Math.sin(a) * r, Math.cos(a) * r]); } m.color('#ffffff', 1); m.push(); m.tf(0, 0.05, 0, 0, -Math.PI / 2, 0); m.extrude(P, 0.08, { convex: false }); m.pop(); m.emissive(0); },
    far(m) { m.color('#ffffff', 1); m.box(0, 0.05, 0, 0.36, 0.08, 0.36); m.emissive(0); } }
};

/* ---------------- building the world ---------------- */
// the edge barriers, as CartKit.rails but with gaps where the mirror balls and the turtle cross (skip(s) -> true)
function drfRails(E, T, pal, skip) {
  CartDecor.protos(E);
  const step = 7;
  for (let s = 0; s < T.L; s += step) {
    if (skip(s)) continue;
    const g = T.at(s, {}), tight = Math.abs(g.k) > 0.012, i = Math.floor(s / step);
    for (const side of [1, -1]) {
      const off = side > 0 ? g.wr : -g.wl, x = g.x + g.nx * off, z = g.z + g.nz * off, col = pal(i, tight, side, s);
      CartDecor.put(E, tight ? 'tyres' : 'rail', x, z, g.yaw, col, { y: 0, noLights: true, k: 1 });
      if (E.night) { if (i % 3 === 0) E.api.glow(x, 0.98, z, 0.9, col); if (i % 2 === 0) E.api.light(x - g.nx * side * 1.2, z - g.nz * side * 1.2, 5.5, col, 0.36); }
    }
  }
}
function drfWorld(id, D) {
  const sky = Object.assign({}, BURNS_PALETTES.night, { zen: '#020a1c', hor: '#0e4a6a', fog: '#06243a', fogD: 0.0058, haze: 0.3, sky: '#123a5a', gnd: '#0e2232', mid: '#0a2a44', midK: 0.35, cityCol: '#38f2ff', cityK: 0.45, key: '#9ad8ff', keyK: 0.55, emB: 1.8, stars: 0.5, clouds: 0.2, cloudCol: '#0e3450', moon: [-60, 40], rim: '#5ae8ff' });
  const W = CartKit.world(id, D, { worldId: 1243, night: true, sky, ground: '#7a8a96', crack: 0.12,
    road: { shoulder: 'rgba(30,60,90,0.45)', band: 'rgba(16,30,58,0.92)', edge: 'rgba(90,232,255,0.95)', edgeW: 0.6, centerFn: drfPaintCenter } });
  const { E, T, api, rng } = W;
  const L = T.L, wrap = s => ((s % L) + L) % L;
  const S = { gate: 0, rope0: CartKit.sOf(T, 85, 17), rope1: CartKit.sOf(T, 102, 80), rope2: CartKit.sOf(T, 128, 145), rink0: CartKit.sOf(T, 166, 228), rinkTop: CartKit.sOf(T, 132, 290), rink1: CartKit.sOf(T, 94, 228), canyon: CartKit.sOf(T, -51, 255), kelp: CartKit.sOf(T, -185, 100) };
  S.rinkA = wrap(S.rink0 - 36); S.rinkB = wrap(S.rink1 + 36);
  S.lanes = [wrap(S.canyon + 28), wrap(S.canyon + 52), wrap(S.canyon + 76)];
  E.drf = { S };
  const near = (s, c, r) => Math.abs(CartKit.ds(T, s, c)) < r;
  const onRink = s => CartKit.ds(T, S.rinkA, s) >= 0 && CartKit.ds(T, S.rinkA, s) <= CartKit.ds(T, S.rinkA, S.rinkB);
  // ---- ground paint: sand ripples, the rink floor (glossy, lane rings, a pink centre line), the ball lanes, the VIP carpet ----
  api.paint((ctx, P, Sc) => {
    const b = T.bounds;
    for (let i = 0; i < 380; i++) { const x = b.x0 - 60 + rng() * (b.x1 - b.x0 + 120), z = b.z0 - 60 + rng() * (b.z1 - b.z0 + 120), q = P(x, z); ctx.fillStyle = `rgba(${rng() < 0.5 ? '40,70,100' : '160,190,210'},${0.06 + rng() * 0.08})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (3 + rng() * 10) * Sc, (0.6 + rng() * 1.4) * Sc, rng() * 0.4 + 0.3, 0, TAU); ctx.fill(); }
    // the rink: a dark glossy floor wider than the road (and the whole island), lane rings, mirror-ball light spots
    const rinkPath = (off, ext) => { ctx.beginPath(); let first = true; for (let s = S.rinkA - ext; s <= S.rinkA + CartKit.ds(T, S.rinkA, S.rinkB) + ext; s += 2) { const g = T.at(wrap(s), DRF_T.at), q = P(g.x + g.nx * off * g.hw, g.z + g.nz * off * g.hw); if (first) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); first = false; } };
    { const c = P(130, 232); ctx.fillStyle = '#1a1030'; ctx.beginPath(); ctx.ellipse(c[0], c[1], 40 * Sc, 58 * Sc, 0, 0, TAU); ctx.fill(); }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    rinkPath(0, 6); ctx.strokeStyle = '#2a1848'; ctx.lineWidth = 32 * Sc; ctx.stroke();
    for (const off of [-0.66, 0.66]) { rinkPath(off, 0); ctx.strokeStyle = 'rgba(90,232,255,0.55)'; ctx.lineWidth = 0.35 * Sc; ctx.setLineDash([3 * Sc, 2 * Sc]); ctx.stroke(); ctx.setLineDash([]); }
    for (const off of [-0.33, 0.33]) { rinkPath(off, 0); ctx.strokeStyle = 'rgba(255,106,208,0.35)'; ctx.lineWidth = 0.25 * Sc; ctx.stroke(); }
    for (let i = 0; i < 160; i++) { const sv = S.rinkA + rng() * CartKit.ds(T, S.rinkA, S.rinkB), g = T.at(wrap(sv), DRF_T.at), d = (rng() * 2 - 1) * g.hw, q = P(g.x + g.nx * d, g.z + g.nz * d); ctx.fillStyle = `rgba(255,255,255,${0.04 + rng() * 0.06})`; ctx.beginPath(); ctx.arc(q[0], q[1], (0.3 + rng() * 0.8) * Sc, 0, TAU); ctx.fill(); }
    // the ball lanes across coral canyon: a pale track of glitter between chute and hoop
    for (const sv of S.lanes) { const g = T.at(sv, DRF_T.at), w = g.wl + g.wr + 16; for (let d = -w / 2; d < w / 2; d += 1.2) { const q = P(g.x + g.nx * d, g.z + g.nz * d); ctx.fillStyle = (Math.floor(d / 1.2) % 2) ? 'rgba(200,230,255,0.22)' : 'rgba(255,140,230,0.16)'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.fillRect(-2.4 * Sc, -0.6 * Sc, 4.8 * Sc, 1.2 * Sc); ctx.restore(); } }
    // VIP carpet stripes at the velvet rope
    for (const sv of [S.rope0, S.rope1, S.rope2]) for (let k = -3; k <= 3; k++) { const g = T.at(wrap(sv + k * 3), DRF_T.at); for (const sd of [-1, 1]) { const d = sd * (g.hw - 1.1), q = P(g.x + g.nx * d, g.z + g.nz * d); ctx.fillStyle = 'rgba(200,20,70,0.55)'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.fillRect(-1.4 * Sc, -0.5 * Sc, 2.8 * Sc, 1.0 * Sc); ctx.restore(); } }
  });
  // barriers: cyan / violet / white; the rink's boards white and pink; gaps where the balls and the turtle cross
  drfRails(E, T, (i, tight, side, s) => onRink(s) ? (i % 2 ? '#ffffff' : '#ff6ad0') : tight ? (i % 2 ? '#ffffff' : '#38f2ff') : DRF_PAL[Math.floor(i / 2) % 3 === 2 ? 2 : Math.floor(i / 2) % 2 ? 3 : 0],
    s => S.lanes.some(l => near(s, l, 6)) || near(s, S.rinkTop, 6));
  CartKit.lamps(E, T, ['#38f2ff', '#ff6ad0', '#bfe0ff', '#a070ff'], 36);
  CartKit.kinds(E, DRF_KINDS);
  for (let s = 0; s < L; s += 5) { if (S.lanes.some(l => near(s, l, 4)) || near(s, S.rinkTop, 4)) continue; const g = T.at(s, {}); for (const sd of [1, -1]) { const d = sd * (g.hw - 0.15); CartKit.put(E, 'drf_stud', g.x + g.nx * d, g.z + g.nz * d, g.yaw, onRink(s) ? (Math.floor(s / 5) % 2 ? '#ff6ad0' : '#ffffff') : Math.floor(s / 5) % 3 ? '#5ae8ff' : '#ffffff', { y: 0, noLights: true }); } }
  const taken = [];
  const side = (s, sd, off) => { const g = T.at(wrap(s), {}), o = sd > 0 ? g.wr + off : -g.wl - off; return { x: g.x + g.nx * o, z: g.z + g.nz * o, yaw: Math.atan2(-g.nx * sd, -g.nz * sd), g }; };

  // ---- GLITTER GATE: the mirror-ball arch, the name, giant clams, bleachers, the crowd ----
  { const g = T.at(0, {}), Wd = g.wl + g.wr + 5;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => drfGateArch(m, Wd), { hi: true, noAO: true });
    api.sign('DISCO REEF', g.x, g.z, { yaw: g.yaw + Math.PI, h: 2.0, y: 10.6, post: false, maxW: 10, style: { bg: '#0a1830', fg: '#ffffff', border: '#5ae8ff' }, glow: '#5ae8ff' });
    api.light(g.x, g.z, 24, '#5ae8ff', 0.6);
    for (const sd of [1, -1]) { const p = side(-26, sd, 6); CartScene.mesh(api, p.x, p.z, p.yaw, drfClam, { hi: true, noAO: true }); taken.push([p.x, p.z, 6]); api.light(p.x, p.z, 12, '#ff9ae8', 0.55); }
    for (const sd of [1, -1]) { const p = side(14, sd, 6); E.spots.push(...CartScene.bleachers(api, p.x, p.z, p.yaw, 20, 3, rng)); api.light(p.x, p.z, 16, '#bfe0ff', 0.5); taken.push([p.x, p.z, 16]); }
    const heroes = ['sparklepony', 'partyboy', 'furry', 'greeter_f', 'annoyingdj', 'burnermom'];
    heroes.forEach((type, i) => { const p = side(-8 + Math.floor(i / 2) * 7, i % 2 ? 1 : -1, 2.4); E.heroes.push({ type, x: p.x, z: p.z, yaw: p.yaw, anim: type === 'annoyingdj' ? 'dj' : 'dance' }); });
  }
  CartKit.crowd(E, T, L - 70, L - 30, 1, rng, { rows: 2, off: 3 }); CartKit.crowd(E, T, L - 70, L - 30, -1, rng, { rows: 2, off: 3 });
  // ---- THE VELVET ROPE: three bouncers with spotlights, alternating sides; a VIP sign ----
  E.drf.bouncers = [];
  [S.rope0, S.rope1, S.rope2].forEach((sv, i) => {
    const sd = i % 2 ? 1 : -1, p = side(sv, sd, 3.2);
    CartScene.mesh(api, p.x, p.z, p.yaw, drfBouncer, { hi: true, scale: 1.25 });
    const c = Math.cos(p.yaw), sn = Math.sin(p.yaw), lx = p.x + (1.9 * c + 0.3 * sn) * 1.25, lz = p.z + (-1.9 * sn + 0.3 * c) * 1.25;
    E.drf.bouncers.push({ i, s: sv, sd, x: p.x, z: p.z, yaw: p.yaw, lx, lz, ly: 3.9 * 1.25 });
    taken.push([p.x, p.z, 9]); api.light(p.x, p.z, 10, '#bfe0ff', 0.5);
  });
  { const p = side(S.rope0 - 22, 1, 2.2); api.sign('VELVET\nROPE', p.x, p.z, { yaw: p.yaw + Math.PI, h: 1.2, y: 2.6, post: true, maxW: 3.4, style: { bg: '#2a0818', fg: '#ffd84a', border: '#c4103a' }, glow: '#ff4f8a' }); }
  // ---- THE ROLLER RINK: the bandstand on the island, rink signs, bleachers round the outside ----
  { const x = 130, z = 236; CartScene.mesh(api, x, z, 0, drfBandstand, { hi: true }); E.drf.mirror = { x, y: 15.2, z }; taken.push([x, z, 14]);
    E.heroes.push({ type: 'annoyingdj', x, z: z - 3, yaw: 0, anim: 'dj', y: 1.4 }, { type: 'sparklepony', x: x - 3, z: z + 2, yaw: 0.6, anim: 'dance', y: 1.4 }, { type: 'partyboy', x: x + 3, z: z + 2.5, yaw: -0.5, anim: 'dance', y: 1.4 });
    api.light(x, z, 40, '#a070ff', 0.45);
    for (const sv of [S.rink0 - 30, S.rink1 + 30]) { const p = side(sv, sv === S.rink0 - 30 ? -1 : 1, 2.0); api.sign('ROLLER\nRINK', p.x, p.z, { yaw: p.yaw + Math.PI, h: 1.2, y: 2.6, post: true, maxW: 3.4, style: { bg: '#ffffff', fg: '#ff2a8a', border: '#38f2ff' }, glow: '#ff6ad0' }); }
    const p = side(S.rinkTop - 20, -1, 7); E.spots.push(...CartScene.bleachers(api, p.x, p.z, p.yaw, 18, 3, rng)); taken.push([p.x, p.z, 14]);
    const p2 = side(S.rink0 - 4, -1, 7); E.spots.push(...CartScene.bleachers(api, p2.x, p2.z, p2.yaw, 16, 3, rng)); taken.push([p2.x, p2.z, 12]);
  }
  CartKit.crowd(E, T, S.rink1 - 10, S.rink1 + 26, -1, rng, { rows: 2, off: 3 });
  // ---- CORAL CANYON: a conch chute on one side of each ball lane, a coral hoop on the other ----
  E.drf.lanes = [];
  S.lanes.forEach((sv, i) => {
    const sd = i % 2 ? 1 : -1, g = T.at(sv, {}), pc = side(sv, sd, 5.5), ph = side(sv, -sd, 5.5);
    CartScene.mesh(api, pc.x, pc.z, pc.yaw, drfChute, { hi: true });
    CartScene.mesh(api, ph.x, ph.z, ph.yaw, drfCatcher, { hi: true });
    taken.push([pc.x, pc.z, 8], [ph.x, ph.z, 8]); api.light(pc.x, pc.z, 11, '#ff6ad0', 0.5); api.light(ph.x, ph.z, 9, '#38f2ff', 0.45);
    // the ball runs from just in front of the chute's mouth to the hoop: lateral d from +sd*(wall + 4) to -sd*(wall + 4)
    const w0 = sd > 0 ? g.wr : g.wl, w1 = sd > 0 ? g.wl : g.wr;
    E.drf.lanes.push({ i, s: sv, sd, d0: sd * (w0 + 4.2), d1: -sd * (w1 + 4.2), x: g.x, z: g.z, nx: g.nx, nz: g.nz, hw: g.hw });
  });
  { const p = side(S.canyon - 10, -1, 2.2); api.sign('CORAL\nCANYON', p.x, p.z, { yaw: p.yaw + Math.PI, h: 1.2, y: 2.6, post: true, maxW: 3.4, style: { bg: '#0a1830', fg: '#ff9ae8', border: '#ff6ad0' }, glow: '#ff6ad0' }); }
  // ---- coral heads, mirror lamps and kelp fill the outside; searchlights in the sky ----
  for (let s = 10, k = 0; s < L; s += 17, k++) {
    const sd = k % 2 ? 1 : -1, p = side(s, sd, 5 + (k % 3) * 2.5), free = taken.every(q => Math.hypot(q[0] - p.x, q[1] - p.z) > q[2] + 3);
    if (!free || !CartWorlds.clear(T, p.x, p.z, 2.5)) continue;
    const kind = k % 4 === 0 ? 'drf_ball' : (s > S.canyon + 90 || s < 40) && k % 2 ? 'drf_kelp' : 'drf_coral';
    CartKit.put(E, kind, p.x, p.z, p.yaw + k, kind === 'drf_kelp' ? ['#3affb0', '#5ae8ff', '#8aff6a'][k % 3] : DRF_PAL[k % DRF_PAL.length], { scale: kind === 'drf_coral' ? 1 + (k % 3) * 0.3 : 1 });
  }
  // a second, farther row of big coral for depth
  for (let s = 30, k = 0; s < L; s += 31, k++) { const sd = k % 2 ? -1 : 1, p = side(s, sd, 18 + (k % 4) * 5); if (!CartWorlds.clear(T, p.x, p.z, 8) || !taken.every(q => Math.hypot(q[0] - p.x, q[1] - p.z) > q[2] + 4)) continue; CartKit.put(E, 'drf_coral', p.x, p.z, k * 1.7, DRF_PAL[(k + 2) % DRF_PAL.length], { scale: 2.2 + (k % 3) * 0.5 }); }
  CartDecor.skyline(E, T, rng);
  E.beams = []; for (let i = 0; i < 6; i++) { const p = side(L * (i + 0.4) / 6, i % 2 ? 1 : -1, 45 + rng() * 25); if (!CartWorlds.clear(T, p.x, p.z, 12)) continue; E.beams.push({ kind: i % 2 ? 'laser' : 'search', x: p.x, y: 1, z: p.z, c: burnsRGBf(i % 3 ? '#5ae8ff' : '#ff6ad0'), ph: rng() * 6, sp: 0.3 + rng() * 0.4, len: i % 2 ? 70 : 140, w: i % 2 ? 0.5 : 6, a: i % 2 ? 0.5 : 0.2 }); api.light(p.x, p.z, 10, '#5ae8ff', 0.5); }
  // gift rows, boost pads (fractions of the lap), the grid
  const f = s => wrap(s) / L;
  CartKit.gifts(E, T, [f(70), f(S.rope2 + 40), f(S.rink1 + 50), f(S.kelp)]);
  CartKit.boosts(E, T, [[f(S.rope0 - 40), 0], [f(S.rink1 + 70), -0.4], [f(S.kelp + 40), 0.3]]);
  CartKit.grid(E, T);
  return CartKit.finish(E);
}
// the centre line: small mirror diamonds every 8 m
function drfPaintCenter(ctx, P, S, T) {
  for (let s = 0; s < T.L; s += 8) { const g = T.at(s, {}), q = P(g.x, g.z); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.scale(S, S); ctx.fillStyle = (s / 8) % 2 ? 'rgba(200,236,255,0.7)' : 'rgba(255,140,230,0.6)'; ctx.beginPath(); ctx.moveTo(-1.1, 0); ctx.lineTo(0, -0.45); ctx.lineTo(1.1, 0); ctx.lineTo(0, 0.45); ctx.closePath(); ctx.fill(); ctx.restore(); }
}

/* ---------------- the moving things (one pooled group) ---------------- */
const DrfMesh = {
  // a giant rolling mirror ball (radius 1 at scale 1), with a pink band so the roll reads
  ball(m) { m.color('#ffffff', 0.15).shine(3); m.ellipsoid(0, 0, 0, 1, 1, 1, { seg: 18, rings: 12, colFn: (x, y, z) => drfBigCol(x * 3, y * 3, z * 3) }); m.color('#ff6ad0', 0.8); m.torus(0, 0, 0, 1.005, 0.05, { seg: 24, tseg: 3 }); m.emissive(0).shine(0); },
  // a spotlight head: a can along +z with a bright lens (pivot at its middle)
  lamp(m) { m.color('#2a2a3a').shine(3); m.push(); m.tf(0, 0, 0, 0, Math.PI / 2, 0); m.cyl(0, -0.55, 0, 0.42, 0.5, 1.1, 14); m.pop(); m.color('#ffffff', 1); m.push(); m.tf(0, 0, 0.56, 0, Math.PI / 2, 0); m.disc(0, 0, 0, 0.44, 14); m.pop(); m.color('#ffd84a', 0.4); m.push(); m.tf(0, 0, 0.58, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.47, 0.05, { seg: 14, tseg: 3 }); m.pop(); m.emissive(0).shine(0); },
  // a roller crab: red shell, claws up, eyes on stalks, four little roller skates (forward = +z)
  crab(m, i) {
    const col = ['#ff3a3a', '#ff7a2a', '#ff3a8a', '#ffb02a', '#e03a5a', '#ff5a5a'][i % 6];
    m.color(col, 0.12).shine(2); m.ellipsoid(0, 0.75, 0, 0.95, 0.45, 0.7, { seg: 14, rings: 8 }); m.shine(0);
    m.color('#ffe0c8'); m.ellipsoid(0, 0.55, 0.05, 0.75, 0.2, 0.55, { seg: 10, rings: 4 });
    for (const sd of [-1, 1]) {
      m.color(col, 0.12); m.limb(sd * 0.7, 0.85, 0.3, sd * 1.1, 1.3, 0.75, 0.12, 0.1, { seg: 5 }); m.ellipsoid(sd * 1.15, 1.45, 0.85, 0.3, 0.22, 0.18, { seg: 8, rings: 5 }); m.ellipsoid(sd * 1.0, 1.62, 0.9, 0.2, 0.08, 0.12, { seg: 6, rings: 3 });
      m.color('#ffffff'); m.limb(sd * 0.25, 1.1, 0.45, sd * 0.3, 1.45, 0.5, 0.04, 0.04, { seg: 4 }); m.ball(sd * 0.3, 1.52, 0.52, 0.13, { seg: 7, rings: 5 }); m.color('#101018'); m.ball(sd * 0.3, 1.54, 0.63, 0.06, { seg: 5, rings: 3 });
      // legs down to two skates each side
      for (const z of [-0.3, 0.25]) { m.color(col, 0.1); m.limb(sd * 0.8, 0.65, z, sd * 1.0, 0.32, z, 0.06, 0.05, { seg: 4 }); m.color('#ffffff').shine(2); m.roundBox(sd * 1.0, 0.24, z, 0.22, 0.12, 0.5, 0.05); m.shine(0); m.color('#38f2ff', 0.9); for (const wz of [-0.16, 0.16]) m.ball(sd * 1.0, 0.1, z + wz, 0.08, { seg: 6, rings: 4 }); }
    }
    m.emissive(0);
  },
  // the wax turtle: a big glossy shell with a polishing pad underneath and an amber beacon on top (forward = +z)
  turtle(m) {
    m.color('#2a8a6a').shine(3); m.ellipsoid(0, 1.0, 0, 1.6, 0.85, 1.9, { seg: 18, rings: 9, phi1: Math.PI * 0.55 });
    m.color('#1a5a48'); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; m.ellipsoid(Math.sin(a) * 0.9, 1.55, Math.cos(a) * 1.05, 0.45, 0.12, 0.5, { seg: 8, rings: 4 }); } m.ellipsoid(0, 1.82, 0, 0.5, 0.1, 0.55, { seg: 8, rings: 4 }); m.shine(0);
    m.color('#ffd84a', 0.25); m.torus(0, 0.92, 0, 1.62, 0.08, { seg: 26, tseg: 3 }); m.emissive(0);
    m.color('#8adcb0'); m.ellipsoid(0, 0.95, 2.1, 0.45, 0.4, 0.55, { seg: 10, rings: 7 }); for (const sd of [-1, 1]) { m.ellipsoid(sd * 1.4, 0.55, 1.1, 0.75, 0.12, 0.35, { seg: 8, rings: 4 }); m.ellipsoid(sd * 1.2, 0.5, -1.2, 0.5, 0.1, 0.3, { seg: 8, rings: 4 }); }
    m.color('#101018'); for (const sd of [-1, 1]) m.ball(sd * 0.25, 1.1, 2.5, 0.08, { seg: 6, rings: 4 });
    m.color('#ffffff').shine(2); m.cyl(0, 0.05, 0, 1.5, 1.5, 0.28, 22); m.color('#bff4ff', 0.6); m.torus(0, 0.2, 0, 1.52, 0.07, { seg: 24, tseg: 3 }); m.emissive(0).shine(0);
    m.color('#ffb02a', 1); m.cyl(0, 1.85, 0, 0.18, 0.15, 0.32, 10); m.emissive(0);
  },
  // the giant mirror ball over the rink (radius 3.2), turning
  bigball(m) { m.color('#ffffff', 0.2).shine(3); m.ellipsoid(0, 0, 0, 3.2, 3.2, 3.2, { seg: 26, rings: 16, colFn: drfBigCol }); m.emissive(0); m.color('#d0d4e0').shine(3); m.cyl(0, 3.1, 0, 0.2, 0.2, 1.2, 8); m.shine(0); }
};

/* ---------------- the rules: hazards and enemies at run time ---------------- */
const DRF_BALL = { period: 7.2, tele: 1.3, speed: 9.5, r: 2.1, push: 9 };
const DRF_SPOT = { period: 5.6, sweep: 3.1, lock: 1.15, flash: 0.4, R: 4.7, move: 7.5 };
const DRF_CRABS = 6, DRF_CRAB = { r: 1.85, w: 0.55, cool: 1.5 };
const DRF_WAX = { speed: 3.8, wait: 2.6, life: 9, band: 2.8, slide: 1.2, rinkGrip: 0.62, waxGrip: 0.14 };
CART_TRACK_RULES.discoreef = {
  onLoad(s) {
    const E = s.E, Ed = E.drf, T = s.T || s.TR, S = Ed.S;
    const G = CartKit.group(s, [['balls', DrfMesh.ball, 3], ['lamps', DrfMesh.lamp, 3], ['crabs', DrfMesh.crab, DRF_CRABS], ['turtle', DrfMesh.turtle, 1], ['big', DrfMesh.bigball, 1]]);
    const D = s.drf = { G, lanes: [], spots: [], crabs: [], turtle: null, said: {}, hintT: -9, flashT: 0 };
    Ed.lanes.forEach((q, i) => D.lanes.push(Object.assign({}, q, { off: i * 2.4, run: -1, fired: -1, tele: 0, u: -1, bx: 0, bz: 0, mask: 0, rollA: 0, obj: G.balls[i] })));
    Ed.bouncers.forEach((b, i) => { const cs = b.s + 7, g = T.at(cs, DRF_T.at); D.spots.push(Object.assign({}, b, { off: i * 1.9, cs, d: 0, cx: g.x, cz: g.z, st: 'sweep', mask: 0, flashN: -1, obj: G.lamps[i], tx: 0 })); });
    // crabs: two on each rink leg, two round the top of the U; loops across the road, staggered
    const cc = [S.rink0 - 22, S.rink0 + 2, S.rinkTop - 24, S.rinkTop + 24, S.rink1 - 2, S.rink1 + 22];
    for (let i = 0; i < DRF_CRABS; i++) D.crabs.push({ i, cs: cc[i], ph: i * 1.9, w: DRF_CRAB.w * (i % 2 ? 1 : -1), x: 0, z: 0, px: 0, pz: 0, yaw: 0, d: 0, cool: 0, sgn: 0, obj: G.crabs[i] });
    const gt = T.at(S.rinkTop, DRF_T.at);
    D.turtle = { s: S.rinkTop, x0: gt.x, z0: gt.z, nx: gt.nx, nz: gt.nz, wl: gt.wl, wr: gt.wr, d: -gt.wl - 2, dir: 1, state: 'walk', wait: 0, x: gt.x, z: gt.z, yaw: 0, cool: new Float32Array(16), stripes: [{ live: false, d0: 0, d1: 0, age: 0, mask: 0 }, { live: false, d0: 0, d1: 0, age: 0, mask: 0 }], cur: 0, obj: G.turtle[0] };
    { const st = D.turtle.stripes[0]; st.live = true; st.d0 = st.d1 = D.turtle.d; st.age = 0; st.mask = 0; }
    D.big = G.big[0];
    CartKit.state(s);
  },
  onUpdate(s, dt, racing) {
    const D = s.drf; if (!D) return;
    drfBalls(s, D, dt, racing); drfSpots(s, D, dt, racing); drfCrabs(s, D, dt, racing); drfTurtle(s, D, dt, racing);
    const B = D.big; if (B) { const m = s.E.drf.mirror; B.live = true; B.visible = true; B.x = m.x; B.y = m.y; B.z = m.z; B.yaw = s.time * 0.4; B.pitch = 0; B.roll = 0; B.scale = 1; }
    if (D.flashT > 0) D.flashT = Math.max(0, D.flashT - dt);
  },
  // per car before it moves: the rink's grip (everyone), then the AI's dodges (brake for a ball, steer off a locked
  // spotlight via cartIxObs, hop a crab)
  onStep(s, k, dt, racing) {
    const D = s.drf; if (!D || !s.T) return;
    const S = s.E.drf.S, rk = CartKit.ds(s.T, S.rinkA, k.loc.s), on = rk >= 0 && rk <= CartKit.ds(s.T, S.rinkA, S.rinkB);
    if (k.drfG0 === undefined) k.drfG0 = k.grip;
    if (k.drfSlide > 0) k.drfSlide = Math.max(0, k.drfSlide - dt);
    k.grip = k.drfG0 * (on ? DRF_WAX.rinkGrip : 1) * (k.drfSlide > 0 ? DRF_WAX.waxGrip : 1);
    if (k.player && !s.autoDrive || !racing || k.out) return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9;
    // mirror balls: will the ball be in my lane when I get there? ease off (good drivers check every time)
    for (const q of D.lanes) {
      const ds = CartKit.ds(s.T, k.loc.s, q.s); if (ds < 2 || ds > 42) continue;
      if (((k.slot * 7 + q.i * 5 + q.run) % 10) / 10 > 0.24 + (sk - 0.85) * 3) continue;
      const ta = ds / Math.max(6, k.speed), u = drfBallU(s, q, s.time + ta); if (u < 0) continue;
      const dB = lerp(q.d0, q.d1, u / drfLaneLen(q)); if (Math.abs(dB - k.loc.d) < DRF_BALL.r + 2.4) { if (k.speed > 8) I.gas = 0; if (k.speed > 13) I.brake = 0.6; break; }
    }
    // roller crabs: hop one that's about to meet the car (by skill)
    for (const c of D.crabs) { const dx = c.x - k.x, dz = c.z - k.z, D2 = dx * dx + dz * dz; if (D2 > 49 || k.air) continue; const close = (dx * (k.vx - (c.x - c.px) / Math.max(dt, 1e-3)) + dz * (k.vz - (c.z - c.pz) / Math.max(dt, 1e-3))) / Math.sqrt(D2 || 1); if (close > 4 && Math.sqrt(D2) / close < 0.3 && ((k.slot * 3 + c.i * 7) % 10) / 10 < 0.45 + (sk - 0.85) * 3) { I.driftPress = true; I.drift = false; break; } }
  },
  draw(s, R, Sp, t) { const D = s.drf; if (D) drfDraw(s, D, R, Sp, t); },
  lights(s, add) {
    const D = s.drf; if (!D) return;
    for (const p of D.spots) if (p.st !== 'sweep') add(p.cx, 2.5, p.cz, 12, p.st === 'flash' ? DRF_C.white : DRF_C.amber, p.st === 'flash' ? 2.4 : 1.1, 2);
    for (const q of D.lanes) if (q.u >= 0) add(q.bx, 3, q.bz, 12, DRF_C.ice, 1.2, 1.5);
    const Tu = D.turtle; add(Tu.x, 3.5, Tu.z, 9, DRF_C.amber, 0.9 + 0.5 * Math.max(0, Math.sin(s.time * 8)), 1);
    const m = s.E.drf.mirror; add(m.x, m.y - 4, m.z, 34, DRF_C.violet, 0.9, 1);
  },
  hud(s, ctx, W, H) {
    const D = s.drf, p = s.player; if (!D || !p) return;
    // a spotlight flash: a white bloom over the screen that fades
    if (D.flashT > 0) { const a = Math.min(1, D.flashT / 0.6); ctx.save(); const g = ctx.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H * 0.45, Math.max(W, H) * 0.7); g.addColorStop(0, `rgba(255,255,255,${(0.85 * a).toFixed(3)})`); g.addColorStop(1, `rgba(200,230,255,${(0.35 * a).toFixed(3)})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    // first-lap hints as each hazard comes up
    const hint = (key, sv, text, sub) => { if (D.said[key] || p.lap > 1) return; const ds = CartKit.ds(s.T, p.loc.s, sv); if (ds > 0 && ds < 70) { D.said[key] = true; D.hintT = s.time; s.banner(text, '#9ae8ff', 2.0, sub); } };
    if (s.state === 'race' && s.T) { const S = s.E.drf.S; hint('spots', D.spots[0].cs, 'SPOTLIGHT BOUNCERS!', 'steer out of the light when it stops and blinks'); hint('rink', S.rinkA + 10, 'ROLLER RINK: SLIPPERY!', 'HOP the roller crabs, go straight over the wax'); hint('balls', D.lanes[0].s, 'ROLLING MIRROR BALLS!', 'brake or find the gap'); }
  }
};
// the ball's distance along its lane at time tt (-1 when it isn't rolling); a lane's length
function drfLaneLen(q) { return Math.abs(q.d1 - q.d0); }
function drfBallU(s, q, tt) { const ph = ((tt + q.off) % DRF_BALL.period + DRF_BALL.period) % DRF_BALL.period; if (ph < DRF_BALL.tele) return -1; const u = (ph - DRF_BALL.tele) * DRF_BALL.speed; return u > drfLaneLen(q) ? -1 : u; }

// ---- mirror balls: the chute flashes and the lane sparkles (1.3 s), the ball rolls across, into the hoop ----
function drfBalls(s, D, dt, racing) {
  for (const q of D.lanes) {
    const tt = s.time + q.off, ph = ((tt % DRF_BALL.period) + DRF_BALL.period) % DRF_BALL.period, run = Math.floor(tt / DRF_BALL.period);
    q.run = run; q.tele = ph < DRF_BALL.tele ? ph / DRF_BALL.tele : 0;
    const u = drfBallU(s, q, s.time), len = drfLaneLen(q), dir = -q.sd;
    if (u >= 0 && q.fired !== run) { q.fired = run; q.mask = 0; CartKit.fired(s, 'mirrorball'); if (CartKit.near(s, q.x, q.z, 70)) { cartIxSound(s, 'cartBoom', q.x, q.z, 0.5, 0.7); cartIxSound(s, 'cartSparkle', q.x, q.z, 0.4, 0.8); } }
    q.u = u;
    if (u >= 0) {
      const d = lerp(q.d0, q.d1, u / len); q.bx = q.x + q.nx * d; q.bz = q.z + q.nz * d; q.rollA += DRF_BALL.speed * dt / DRF_BALL.r;
      cartIxObs(s, q.bx, q.bz, DRF_BALL.r + 0.5); cartIxObs(s, q.bx + q.nx * dir * 3, q.bz + q.nz * dir * 3, DRF_BALL.r + 0.2);
      if (racing) for (const k of s.karts) {
        if (k.out || (q.mask & (1 << k.slot))) continue;
        if (Math.hypot(k.x - q.bx, k.z - q.bz) > DRF_BALL.r + 1.6) continue;
        q.mask |= 1 << k.slot;
        if (CartKit.hit(s, k, 'knock', 'mirrorball', { dx: q.nx * dir, dz: q.nz * dir, power: DRF_BALL.push, dur: 0.9, banner: 'MIRROR BALL!' })) { if (s.fx) { s.fx.burst(k.x, k.y + 1.2, k.z, 'star', 14, '#dfefff'); s.fx.spark(k.x, k.y + 1, k.z, 10, '#ffffff', 6); } cartIxSound(s, 'break', k.x, k.z, 0.7, 1.6); }
      }
      if (s.fx && Math.random() < 0.5 && CartKit.near(s, q.bx, q.bz, 90)) s.fx.glint(q.bx + (Math.random() - 0.5) * 3, 1 + Math.random() * 3, q.bz + (Math.random() - 0.5) * 3, '#ffffff');
    } else if (q.tele > 0.5) cartIxObs(s, q.x + q.nx * (q.d0 - q.sd * 6), q.z + q.nz * (q.d0 - q.sd * 6), 3);   // about to roll: keep off the chute's side
    const o = q.obj; if (o) {
      // waiting in the chute's mouth (peeking, quivering in the warning), rolling, sinking into the hoop
      const sink = u >= 0 && u > len - 3 ? (u - (len - 3)) / 3 : 0, wait = u < 0;
      const d = wait ? q.d0 + q.sd * 1.2 : lerp(q.d0, q.d1, u / len), x = q.x + q.nx * d, z = q.z + q.nz * d;
      o.live = true; o.visible = !wait || q.tele > 0; o.x = x; o.z = z; o.y = DRF_BALL.r * (1 - sink * 0.9) + (wait ? 0.5 + Math.sin(s.time * 40) * 0.05 * q.tele : 0);
      o.yaw = Math.atan2(q.nx * dir, q.nz * dir) + Math.PI / 2; o.pitch = 0; o.roll = q.rollA * (q.sd > 0 ? 1 : -1); o.scale = DRF_BALL.r * (1 - sink * 0.5);
    }
  }
}
// ---- spotlight bouncers: the spot sweeps (and follows a car), stops and blinks amber, then FLASHES ----
function drfSpots(s, D, dt, racing) {
  const T = s.T || s.TR;
  for (const p of D.spots) {
    const tt = s.time + p.off, ph = ((tt % DRF_SPOT.period) + DRF_SPOT.period) % DRF_SPOT.period, n = Math.floor(tt / DRF_SPOT.period);
    const st = ph < DRF_SPOT.sweep ? 'sweep' : ph < DRF_SPOT.sweep + DRF_SPOT.lock ? 'lock' : ph < DRF_SPOT.sweep + DRF_SPOT.lock + DRF_SPOT.flash ? 'flash' : 'rest';
    const g = T.at(p.cs, DRF_T.at), hw = g.hw;
    p.lock = st === 'lock' ? (ph - DRF_SPOT.sweep) / DRF_SPOT.lock : 0;
    if (st === 'sweep' || st === 'rest') {
      // follow the nearest car coming up to the spot; with none, drift side to side
      let best = null, bd = 46; for (const k of s.karts) { if (k.out || k.finished) continue; const ds = CartKit.ds(T, k.loc.s, p.cs); if (ds > 3 && ds < bd) { bd = ds; best = k; } }
      p.tx = best ? clamp(best.loc.d, -hw + 2, hw - 2) : Math.sin(tt * 0.9) * hw * 0.6;
      p.d = approach(p.d, p.tx, DRF_SPOT.move * dt);
    }
    p.cx = g.x + g.nx * p.d; p.cz = g.z + g.nz * p.d;
    if (st === 'flash' && p.flashN !== n) {
      p.flashN = n; p.mask = 0; CartKit.fired(s, 'spotlight');
      if (CartKit.near(s, p.cx, p.cz, 60)) { cartIxSound(s, 'cartSparkle', p.cx, p.cz, 0.8, 1.6); cartIxSound(s, 'cartBoom', p.cx, p.cz, 0.25, 1.8); }
    }
    if (st === 'flash' && racing) for (const k of s.karts) {
      if (k.out || (p.mask & (1 << k.slot)) || k.shieldT > 0 || k.immuneT > 0) continue;
      if (Math.hypot(k.x - p.cx, k.z - p.cz) > DRF_SPOT.R + 0.6) continue;
      p.mask |= 1 << k.slot;
      k.dazzleT = Math.max(k.dazzleT, 1.7); k.slowT = Math.max(k.slowT, 0.45);
      if (k.player) { D.flashT = 0.9; s.white = Math.max(s.white || 0, 0.4); }
      CartKit.touch(s, k, 'spotlight', 'SPOTLIGHT!', '#ffffff');
      if (s.fx) s.fx.burst(k.x, k.y + 1.6, k.z, 'star', 10, '#ffffff');
    }
    p.st = st;
    // the AI sees the light stop and steers off it
    if ((st === 'lock' && p.lock > 0.45) || st === 'flash') cartIxObs(s, p.cx, p.cz, DRF_SPOT.R + 0.6);
    // aim the lamp at the spot
    const o = p.obj; if (o) { const dx = p.cx - p.lx, dz = p.cz - p.lz, dh = Math.hypot(dx, dz); o.live = true; o.visible = true; o.x = p.lx; o.y = p.ly; o.z = p.lz; o.yaw = Math.atan2(dx, dz); o.pitch = Math.atan2(p.ly, dh) + (st === 'lock' ? Math.sin(s.time * 30) * 0.02 : 0); o.roll = 0; o.scale = 1.6; }
  }
}
// ---- roller crabs: skate loops across the rink; bump = a spin (hop over them) ----
function drfCrabs(s, D, dt, racing) {
  const T = s.T || s.TR;
  for (const c of D.crabs) {
    const a = s.time * c.w + c.ph, g = T.at(c.cs + Math.cos(a) * 6, DRF_T.at), d = Math.sin(a) * (g.hw - 2.2);
    c.px = c.x; c.pz = c.z; c.x = g.x + g.nx * d; c.z = g.z + g.nz * d; c.d = d;
    const vx = c.x - c.px, vz = c.z - c.pz; if (vx * vx + vz * vz > 1e-6) c.yaw = Math.atan2(vx, vz);
    const sg = d > 0 ? 1 : -1; if (sg !== c.sgn) { if (c.sgn) CartKit.fired(s, 'crab'); c.sgn = sg; }
    if (c.cool > 0) c.cool -= dt;
    cartIxObs(s, c.x, c.z, 1.6); cartIxObs(s, c.x + vx / Math.max(dt, 1e-3) * 0.5, c.z + vz / Math.max(dt, 1e-3) * 0.5, 1.4);
    const gy = s.terrain.height(c.x, c.z);
    if (racing && c.cool <= 0) for (const k of s.karts) {
      if (k.out || Math.hypot(k.x - c.x, k.z - c.z) > DRF_CRAB.r) continue;
      if (k.air && k.y > gy + 0.3) { if (k.player && c.cool <= 0) s.banner('NICE HOP!', '#7aff8a', 0.7, null, true); c.cool = 0.6; break; }   // hopped over it
      c.cool = DRF_CRAB.cool;
      if (CartKit.hit(s, k, 'spin', 'crab', { dur: 0.8, banner: 'ROLLER CRAB!' })) { k.vx += Math.sin(c.yaw) * 4; k.vz += Math.cos(c.yaw) * 4; cartIxSound(s, 'bump', c.x, c.z, 0.8, 1.4); if (s.fx) s.fx.burst(c.x, gy + 1, c.z, 'star', 8, '#ff7a5a'); }
      break;
    }
    const o = c.obj; if (o) { const hurt = c.cool > 0.8 ? (DRF_CRAB.cool - c.cool) * 12 : 0; o.live = true; o.visible = true; o.x = c.x; o.y = gy + Math.abs(Math.sin(s.time * 6 + c.i)) * 0.12; o.z = c.z; o.yaw = c.yaw + hurt; o.pitch = 0; o.roll = Math.sin(s.time * 3 + c.i) * 0.18; o.scale = 1.45; }
  }
}
// ---- the wax turtle: crosses the rink polishing a stripe of wax (you slide on it), waits, crosses back ----
function drfTurtle(s, D, dt, racing) {
  const Tu = D.turtle, T = s.T || s.TR, a = -Tu.wl - 2, b = Tu.wr + 2;
  if (Tu.state === 'wait') { Tu.wait -= dt; if (Tu.wait <= 0) { Tu.state = 'walk'; Tu.dir = -Tu.dir; Tu.cur = 1 - Tu.cur; const st = Tu.stripes[Tu.cur]; st.live = true; st.d0 = st.d1 = Tu.d; st.age = 0; st.mask = 0; CartKit.fired(s, 'wax'); } }
  else { Tu.d += Tu.dir * DRF_WAX.speed * dt; Tu.stripes[Tu.cur].d1 = Tu.d; if (Tu.dir > 0 ? Tu.d >= b : Tu.d <= a) { Tu.d = Tu.dir > 0 ? b : a; Tu.state = 'wait'; Tu.wait = DRF_WAX.wait; } }
  Tu.x = Tu.x0 + Tu.nx * Tu.d; Tu.z = Tu.z0 + Tu.nz * Tu.d; Tu.yaw = Math.atan2(Tu.nx * Tu.dir, Tu.nz * Tu.dir);
  for (let i = 0; i < 16; i++) if (Tu.cool[i] > 0) Tu.cool[i] -= dt;
  if (Math.abs(Tu.d) < Math.max(Tu.wl, Tu.wr) + 1) cartIxObs(s, Tu.x, Tu.z, 3.0);
  for (const st of Tu.stripes) {
    if (!st.live) continue; st.age += dt; if (st.age > DRF_WAX.life && st !== Tu.stripes[Tu.cur]) { st.live = false; continue; }
    if (!racing || st.age > DRF_WAX.life - 1.2 && st !== Tu.stripes[Tu.cur]) continue;
    const lo = Math.min(st.d0, st.d1) - 0.4, hi = Math.max(st.d0, st.d1) + 0.4;
    for (const k of s.karts) {
      if (k.out || k.air || (st.mask & (1 << k.slot))) continue;
      if (Math.abs(CartKit.ds(T, Tu.s, k.loc.s)) > DRF_WAX.band || k.loc.d < lo || k.loc.d > hi) continue;
      st.mask |= 1 << k.slot; k.drfSlide = DRF_WAX.slide;
      CartKit.touch(s, k, 'wax', 'WAXED FLOOR!', '#bff4ff');
      if (k.player) cartIxSound(s, 'cartBubble', k.x, k.z, 0.7, 1.4);
      if (s.fx) s.fx.burst(k.x, k.y + 0.4, k.z, 'spark', 6, '#dffcff');
    }
  }
  // bumping the turtle itself spins you (she's slow and very heavy)
  if (racing) for (const k of s.karts) { if (k.out || Tu.cool[k.slot] > 0 || Math.hypot(k.x - Tu.x, k.z - Tu.z) > 2.9 || (k.air && k.y > 1.6)) continue; Tu.cool[k.slot] = 2; if (CartKit.hit(s, k, 'spin', 'wax', { dur: 0.7, banner: 'TURTLE CROSSING!' })) { const nx = (k.x - Tu.x) || 0.01, nz = (k.z - Tu.z), l = Math.hypot(nx, nz); k.vx += nx / l * 6; k.vz += nz / l * 6; cartIxSound(s, 'bump', Tu.x, Tu.z, 0.8, 0.7); } }
  const o = Tu.obj; if (o) { o.live = true; o.visible = true; o.x = Tu.x; o.y = s.terrain.height(Tu.x, Tu.z) + (Tu.state === 'walk' ? Math.abs(Math.sin(s.time * 5)) * 0.06 : 0); o.z = Tu.z; o.yaw = Tu.yaw + (Tu.state === 'walk' ? Math.sin(s.time * 5) * 0.06 : 0); o.pitch = 0; o.roll = 0; o.scale = 1.35; }
}
// ---- sprites: ball lanes and glints, spotlight discs and beams, crab rings, the wax stripes, rink light spots, bubbles ----
function drfDraw(s, D, R, Sp, t) {
  const C = DRF_C, cam = s.cam, T = s.T || s.TR;
  for (const q of D.lanes) {
    if ((q.x - cam.x) ** 2 + (q.z - cam.z) ** 2 > 200 * 200) continue;
    const len = drfLaneLen(q);
    if (q.tele > 0) {
      // the warning: the lane lights up in running chevrons from the chute, the mouth flares
      const fl = 0.45 + 0.55 * Math.max(0, Math.sin(t * 20));
      for (let u = 0; u < len; u += 2.4) { const d = lerp(q.d0, q.d1, u / len), w = ((u / 2.4 - t * 6) % 3 + 3) % 3 < 1 ? 1 : 0.45; R.flat.flat(q.x + q.nx * d, 0.1, q.z + q.nz * d, 7, 2.4, Math.atan2(q.nx, q.nz), Sp.square, C.warn, 0.55 * q.tele * fl * w, true); }
      R.bbs.bb(q.x + q.nx * q.d0, 2.6, q.z + q.nz * q.d0, 6 + q.tele * 4, 6 + q.tele * 4, Sp.glow, C.pink, 0.6 * q.tele, true);
    }
    if (q.u >= 0) {
      const d = lerp(q.d0, q.d1, q.u / len), gl = 0.5 + 0.5 * Math.sin(t * 9);
      // the rest of its path stays lit, a soft shadow under it, a halo and sparkles on the ball
      for (let u = q.u + 3; u < len; u += 3) { const dd = lerp(q.d0, q.d1, u / len); R.flat.flat(q.x + q.nx * dd, 0.1, q.z + q.nz * dd, 6.5, 2.2, Math.atan2(q.nx, q.nz), Sp.square, C.amber, 0.28, true); }
      R.flat.flat(q.bx, 0.06, q.bz, 5, 5, 0, Sp.shadow, C.black, 0.5, false);
      R.bbs.bb(q.bx, DRF_BALL.r, q.bz, 7.5, 7.5, Sp.glow, C.ice, 0.35 + 0.15 * gl, true);
      for (let i = 0; i < 4; i++) { const a = t * 2.3 + i * 1.57, x = q.bx + Math.cos(a) * 1.6, z = q.bz + Math.sin(a) * 1.6, y = DRF_BALL.r + Math.sin(a * 1.7) * 1.3; R.bbs.bb(x, y, z, 1.2, 1.2, Sp.star, C.white, 0.5 + 0.5 * Math.sin(t * 13 + i * 2), true, t * 2 + i); }
      void d;
    }
  }
  for (const p of D.spots) {
    if ((p.cx - cam.x) ** 2 + (p.cz - cam.z) ** 2 > 200 * 200) continue;
    const Rr = DRF_SPOT.R * 2, lk = p.st === 'lock', fl = p.st === 'flash', bl = lk ? (Math.floor(t * 8) % 2 ? 1 : 0.35) : 1;
    if (p.st === 'rest') { R.flat.flat(p.cx, 0.08, p.cz, Rr, Rr, 0, Sp.glow, C.ice, 0.12, true); continue; }
    R.flat.flat(p.cx, 0.08, p.cz, Rr * (fl ? 1.5 : 1.15), Rr * (fl ? 1.5 : 1.15), 0, Sp.glow, fl ? C.white : lk ? C.amber : C.ice, fl ? 1 : lk ? 0.55 * bl : 0.4, true);
    R.flat.flat(p.cx, 0.1, p.cz, Rr, Rr, 0, Sp.ring, fl ? C.white : lk ? C.amber : C.ice, fl ? 1 : lk ? 0.95 * bl : 0.45, true);
    // the lock: a ring closing in on the spot, and a pulsing "!" over it
    if (lk) { const r = Rr * (1 + (1 - p.lock) * 1.2); R.flat.flat(p.cx, 0.11, p.cz, r, r, 0, Sp.ring, C.warn, 0.85, true); R.bbs.bb(p.cx, 3.2, p.cz, 1.6, 1.6, Sp.warn || Sp.star, C.amber, bl, true); }
    // the beam from the lamp
    const bx = p.cx - p.lx, by = -p.ly, bz = p.cz - p.lz; R.bbs.streak(p.lx + bx * 0.5, p.ly * 0.5, p.lz + bz * 0.5, bx, by, bz, Math.hypot(bx, by, bz), fl ? 3.2 : 1.6, Sp.streak, fl ? C.white : lk ? C.amber : C.ice, fl ? 0.9 : 0.32);
    R.bbs.bb(p.lx, p.ly, p.lz, fl ? 9 : 3, fl ? 9 : 3, Sp.glow, fl ? C.white : C.ice, fl ? 1 : 0.6, true);
  }
  for (const c of D.crabs) { if ((c.x - cam.x) ** 2 + (c.z - cam.z) ** 2 > 160 * 160) continue; R.flat.flat(c.x, 0.09, c.z, 4.2, 4.2, 0, Sp.ring, [1, 0.45, 0.35], 0.55, true); R.flat.flat(c.x, 0.08, c.z, 4.6, 4.6, 0, Sp.glow, [1, 0.35, 0.3], 0.3, true); }
  // the wax: a glossy band across the rink, glinting; it dims as it dries
  const Tu = D.turtle;
  if ((Tu.x0 - cam.x) ** 2 + (Tu.z0 - cam.z) ** 2 < 200 * 200) {
    for (const st of Tu.stripes) {
      if (!st.live) continue;
      const a = st === Tu.stripes[Tu.cur] ? 1 : clamp((DRF_WAX.life - st.age) / 2.5, 0, 1), lo = Math.min(st.d0, st.d1), hi = Math.max(st.d0, st.d1), yaw = Math.atan2(Tu.nx, Tu.nz);
      for (let d = lo + 1.2; d < hi; d += 2.4) { const x = Tu.x0 + Tu.nx * d, z = Tu.z0 + Tu.nz * d; R.flat.flat(x, 0.09, z, DRF_WAX.band * 2 / 0.6, 4.0, yaw, Sp.square, C.wax, 0.62 * a, true); R.flat.flat(x, 0.1, z, DRF_WAX.band * 2 / 0.6 + 1.5, 4.6, yaw, Sp.glow, C.mint, 0.25 * a, true); if (((d * 7 + Math.floor(t * 5)) | 0) % 5 === 0) R.bbs.bb(x, 0.3, z, 0.9, 0.9, Sp.star, C.white, 0.8 * a, true, t); }
    }
    R.bbs.bb(Tu.x, 2.9, Tu.z, 2.4, 2.4, Sp.glow, C.amber, 0.5 + 0.5 * Math.max(0, Math.sin(t * 8)), true);
  }
  // the giant mirror ball throws light spots that wheel round the rink floor
  const m = s.E.drf.mirror;
  if ((m.x - cam.x) ** 2 + (m.z - cam.z) ** 2 < 170 * 170) {
    R.bbs.bb(m.x, m.y, m.z, 13, 13, Sp.glow, C.ice, 0.35, true);
    for (let i = 0; i < 36; i++) { const r = 12 + (i % 6) * 6.5, a = s.time * 0.4 * (i % 2 ? 1 : 0.8) + i * 2.39, x = m.x + Math.sin(a) * r * 0.85, z = m.z + Math.cos(a) * r * 1.2; R.flat.flat(x, 0.08, z, 1.6, 1.6, 0, Sp.glow, DRF_PAL_F[i % 6], 0.5, true); }
  }
  // bubbles drifting up round the camera (it's a reef)
  for (let i = 0; i < 22; i++) { const x = cam.x + ((i * 37) % 70) - 35, z = cam.z + ((i * 53) % 70) - 35, y = (t * (0.9 + (i % 4) * 0.25) + i * 1.3) % 14, w = 0.25 + (i % 3) * 0.15; R.bbs.bb(x + Math.sin(t * 2 + i) * 0.4, y, z, w, w, Sp.ring, C.ice, 0.35 * (1 - y / 14), true); }
  void T;
}

if (typeof window !== 'undefined') setTimeout(() => {
  const C = window.BRADY_CART; if (!C || !C.debug) return;
  // hazard screenshots (tools/cart_track_test.js): park the player where the hazard plays out, step until its moment.
  // Several tracks register shots, so they go in the per-track table debug.trackShots[track].
  const list = () => ['spot-sweep', 'spot-lock', 'spot-flash', 'rink', 'crab', 'wax', 'ball-warn', 'ball', 'gate'].map(name => ({ name }));
  const shot = name => {
    const D = C.debug, STEP = 1 / 60;
    D.start({ mode: 'quick', track: 'discoreef', car: 'fish', driver: 'brady', seed: 9, autoGas: true });
    const s = D.scene(); s.state = 'race'; s.stateT = 0; window.BRADY.Input.setMode('game'); s.layoutControls(); s.update(STEP);
    const Dr = s.drf, T = s.T, P = s.player, S = s.E.drf.S;
    let pin = null;
    const park = (sv, lat, speed, frozen) => { const g = T.at(((sv % T.L) + T.L) % T.L, {}); D.place(-1, g.x + g.nx * g.hw * lat, g.z + g.nz * g.hw * lat, g.yaw, { speed: speed || 0, frozen: false }); P.prevS = P.loc.s; P.lap = 1; P.prog = P.loc.s; pin = frozen ? { x: P.x, z: P.z, yaw: P.yaw } : null; };
    const pins = [];
    const rivals = list => { let j = 0; for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = list[j++] || [-300 - j * 12, 0, 1]; const g = T.at(((P.loc.s + r[0]) % T.L + T.L) % T.L, {}); D.place(i, g.x + g.nx * g.hw * r[1], g.z + g.nz * g.hw * r[1], g.yaw, { speed: r[2] ? 0 : 16, frozen: false }); if (r[2]) pins.push({ k, x: k.x, z: k.z, yaw: k.yaw }); k.prevS = k.loc.s; k.lap = 1; k.prog = k.loc.s; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } k.wpn.t = 99; } };
    s.autoDrive = true; if (!P.ai) s.aiInput(P, STEP, true); P.ai.itemT = 99; P.ai.fireT = 99; P.wpn.t = 99;
    const hold = () => { if (pin) { P.x = pin.x; P.z = pin.z; P.yaw = pin.yaw; P.vx = P.vz = 0; } for (const q of pins) { q.k.x = q.x; q.k.z = q.z; q.k.yaw = q.yaw; q.k.vx = q.k.vz = 0; } };
    const wait = (fn, secs) => { for (let i = 0; i < secs * 60; i++) { s.update(STEP); hold(); if (fn()) return true; } return false; };
    let ok = true;
    if (name.startsWith('spot')) { const p = Dr.spots[1]; park(p.cs - 24, 0, 0, true); rivals([[22, 0.2, 1], [-40, 0, 1]]); ok = wait(() => name === 'spot-sweep' ? p.st === 'sweep' && s.time > 1 : name === 'spot-lock' ? p.st === 'lock' && p.lock > 0.5 : p.st === 'flash', 9); }
    else if (name === 'rink') { park(S.rink0 - 30, 0, 18, false); rivals([[10, 0.3, 0], [16, -0.3, 0], [24, 0, 0]]); wait(() => false, 0.8); }
    else if (name === 'crab') { const c = Dr.crabs[1]; park(c.cs - 18, -0.6, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => Math.abs(c.d) < 2.5, 14); }
    else if (name === 'wax') { park(S.rinkTop - 22, 0.55, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => Dr.turtle.state === 'walk' && Math.abs(Dr.turtle.d) < 3, 20); }
    else if (name === 'ball-warn' || name === 'ball') { const q = Dr.lanes[1]; park(q.s - 30, -0.6 * q.sd, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'ball' ? q.u > drfLaneLen(q) * 0.4 && q.u < drfLaneLen(q) * 0.55 : q.tele > 0.7, 10); }
    else if (name === 'gate') { park(T.L - 40, 0, 16, false); rivals([[8, 0.35, 0], [12, -0.35, 0], [18, 0, 0]]); wait(() => false, 0.6); }
    s.snapCam = true; for (let i = 0; i < 4; i++) { D.step(1, 1); hold(); }
    return { ok, draws: s.stats.draws, tris: s.stats.tris, hits: (s.kit || {}).hits, touch: (s.kit || {}).touch, p: [+P.x.toFixed(1), +P.z.toFixed(1), +P.loc.s.toFixed(1)] };
  };
  C.debug.trackShots = C.debug.trackShots || {};
  C.debug.trackShots.discoreef = { list, shot };
  C.debug.drfLevel = () => { const s = Game.scene, K = s.kit || {}, D = s.drf; return { hits: K.hits || {}, touch: K.touch || {}, fired: K.fired || {}, L: s.T ? +s.T.L.toFixed(1) : 0, spots: D ? D.spots.map(p => p.st) : null, turtle: D ? { d: +D.turtle.d.toFixed(1), st: D.turtle.state } : null }; };
}, 0);
