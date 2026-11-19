/* ============================================================
   ART CART — ELECTRIC DEEP, Jelly Jolt's career track (level agent "jelly", Nov 19 2026).
   Recipe: docs/ART_CART_LEVEL_RECIPE.md (Love Parade is the worked example; this is its own layout and look).
   A bioluminescent ocean trench at night, deep under the surface: black water, neon plankton, rock spires with
   glowing veins, tube-worm thickets, black smokers. The lap itself is shaped like a LIGHTNING BOLT (seen from above,
   on the minimap): one lap of about 1.18 km:
     SPARK GATE          the start, under two tesla towers with a live arc crackling between them
     TESLA STAIRS        the bolt's first dive: three ARC GATES (a tesla pylon each side of the road). A gate's coils
                         glow and little arcs creep in from both sides while a zig-zag flashes across the road
                         (1.3 s), then a full ARC jumps across the road: caught on the ground you're ZAPPED (stunned).
                         HOP the arc, or ride the wave: the gates fire one after another at racing speed, so a car
                         right behind a zap stays behind it all the way down
     THE CURRENT TUBE    hoops of light over the road: chevrons run through it (1.1 s), then the current SURGES and
                         anyone inside it rides a free boost (time your entry)
     JELLY FIELD         the long fall south: a swarm of glowing jellyfish drifts over the road. Before one stings it
                         flashes and a ring closes on the road below it (1.2 s); be out of the ring when it STINGS
                         (stung: slowed, wobbly). The ones that aren't flashing are harmless: drive under them
     EEL ALLEY           out of the hairpin: two VOLT EELS live in burrows either side of the road. A burrow lights up
                         and a crackling lane flashes across the road (1.3 s), then the eel slithers across: touch it
                         and you're knocked aside. Brake and pass behind its tail, or beat its head across
     STATIC FLATS        and the long climb home past JELLY JOLT herself, floating over the infield
   JELLY JOLT's STORM HOVER is in everyone's gift boxes here (CART_TRACKS.electricdeep.car = 'jelly').
   Start it without the menus: BRADY_CART.debug.start({ mode: 'career', track: 'electricdeep' }) (or mode 'quick').
   Globals are prefixed ELD_ / eld, level data lives on E.eld (the world) and s.eld (the run).
   ============================================================ */
const ELD_C = { cyan: [0.25, 0.95, 1], ice: [0.7, 0.95, 1], blue: [0.3, 0.55, 1], violet: [0.62, 0.38, 1], pink: [1, 0.35, 0.85], lime: [0.55, 1, 0.4], white: [1, 1, 1], black: [0, 0, 0], volt: [1, 0.95, 0.35], warn: [1, 0.78, 0.2], deep: [0.04, 0.16, 0.3], snow: [0.7, 0.9, 1] };
const ELD_PAL = ['#38f2ff', '#4a7aff', '#9a5aff', '#7aff6a', '#ff5ad8', '#ffffff'];
const ELD_JELLY_COL = ['#5af2ff', '#b47aff', '#ff6ad8', '#7aff8a', '#5aa8ff', '#ffe25a', '#5af2ff'];
const ELD_JELLY_F = ELD_JELLY_COL.map(c => burnsRGBf(c));
const ELD_T = { at: {}, at2: {}, p: {} };
// a cheap repeatable hash in 0..1 (bolt jitter, marine snow): no allocation, no Math.random in the sim
const eldH = a => { const x = Math.sin(a * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ---------------- the course: a lightning bolt ---------------- */
// corners [x, z, radius]: the top straight (start, heading east), the tesla stairs (diving south-west), the current
// tube (east), the jelly field (the long fall to the bolt's tip), the hairpin, eel alley (climbing north-west), the
// static flats (west) and the climb home (north)
const ELD_POLY = [[-150, 200, 30], [60, 220, 30], [20, 70, 22], [150, 40, 30], [60, -210, 26], [-30, -40, 22], [-170, -20, 30]];
const ELD_MON = [-72, 98];   // Jelly Jolt floats over the upper infield
// registries (this file sorts before 43_cart_j_kit.js: assign through the same guards, never redeclare)
var CART_TRACK_RULES = (typeof CART_TRACK_RULES !== 'undefined' && CART_TRACK_RULES) || {};
var CART_CAREER_TRACKS = (typeof CART_CAREER_TRACKS !== 'undefined' && CART_CAREER_TRACKS) || {};
CART_TRACKS.electricdeep = {
  name: 'ELECTRIC DEEP', car: 'jelly', tod: 'night', music: 'kart3', width: 20, shoulder: 6, theme: 'deep', blurb: 'Tesla arcs, stinging jellies and volt eels in a glowing trench',
  get pts() { return this._pts || (this._pts = CartKit.course(ELD_POLY, { start: [-30, 211], step: 18 })); },   // lazy: the kit loads after this file
  world: (id, D) => eldWorld(id, D)
};
CART_CAREER_TRACKS.jelly = 'electricdeep';

/* ---------------- static pieces (merged into the world's chunks) ---------------- */
// a tesla pylon (local +z faces the road): a rock plinth, a copper coil, porcelain insulators, a glowing toroid on top,
// and the electrode (a glass ball at 1.3 m, 1 m toward the road) the arc jumps from
function eldPylon(m, col) {
  m.color('#141c2a').shine(1); m.lathe([[2.0, 0], [1.9, 0.6], [1.5, 1.0], [0, 1.05]], { seg: 14 });
  m.color('#c87a3a').shine(3); for (let i = 0; i < 14; i++) m.torus(0, 1.4 + i * 0.36, 0, 0.62, 0.14, { seg: 14, tseg: 5 });
  m.color('#2a3448').shine(2); m.limb(0, 1.0, 0, 0, 7.0, 0, 0.5, 0.5, { seg: 10 });
  m.color('#e8eef8').shine(3); for (let i = 0; i < 4; i++) m.torus(0, 6.6 + i * 0.42, 0, 0.6 - i * 0.06, 0.16, { seg: 12, tseg: 5 });
  m.color(col, 1).shine(3); m.torus(0, 8.9, 0, 1.25, 0.42, { seg: 18, tseg: 7 }); m.ball(0, 9.2, 0, 0.45, { seg: 10, rings: 6 });
  m.color('#2a3448').shine(2); m.limb(0, 1.3, 0, 0, 1.3, 1.0, 0.16, 0.16, { seg: 6 });
  m.color(col, 0.8).shine(3); m.ball(0, 1.3, 1.1, 0.34, { seg: 10, rings: 7 }); m.emissive(0).shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.6, y0: 0, y1: 9.5, camPass: true }], lights: [{ x: 0, y: 8.9, z: 0, s: 1.8, c: col }, { x: 0, y: 1.3, z: 1.1, s: 1.1, c: col }] };
}
// the start gate: two tall tesla towers either side, a frozen arc (jagged emissive limbs) across the top at 14 m
function eldGate(m, W) {
  const h = 13.5;
  for (const sd of [-1, 1]) {
    const x = sd * W / 2;
    m.color('#141c2a').shine(1); m.push(); m.tf(x, 0, 0); m.lathe([[2.4, 0], [2.2, 0.8], [1.6, 1.3], [0, 1.35]], { seg: 16 }); m.pop();
    m.color('#c87a3a').shine(3); for (let i = 0; i < 22; i++) m.torus(x, 1.6 + i * 0.5, 0, 0.75 - i * 0.012, 0.18, { seg: 14, tseg: 5 });
    m.color('#e8eef8').shine(3); m.torus(x, h - 0.6, 0, 0.6, 0.18, { seg: 12, tseg: 5 });
    m.color('#38f2ff', 1).shine(3); m.torus(x, h + 0.4, 0, 1.6, 0.5, { seg: 20, tseg: 8 }); m.ball(x, h + 0.7, 0, 0.6, { seg: 10, rings: 7 }); m.emissive(0).shine(0);
  }
  // the arc: a zig-zag of glowing limbs from toroid to toroid, two strands
  for (const [col, r, ph] of [['#ffffff', 0.16, 0], ['#7af6ff', 0.1, 1.7]]) {
    m.color(col, 1); let px = -W / 2 + 1.6, py = h + 0.4;
    const n = 12; for (let i = 1; i <= n; i++) { const u = i / n, x = lerp(-W / 2 + 1.6, W / 2 - 1.6, u), y = h + 0.4 + (i < n ? Math.sin(i * 2.3 + ph) * 1.1 + Math.sin(u * Math.PI) * 0.6 : 0); m.limb(px, py, 0, x, y, 0, r, r, { seg: 4, ends: false }); px = x; py = y; }
  }
  m.emissive(0);
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 1.8, y0: 0, y1: h, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: 1.8, y0: 0, y1: h, camPass: true }], lights: [{ x: -W / 2, y: h + 0.5, z: 0, s: 2.6, c: '#38f2ff' }, { x: W / 2, y: h + 0.5, z: 0, s: 2.6, c: '#38f2ff' }, { x: 0, y: h + 0.8, z: 0, s: 2.2, c: '#ffffff' }] };
}
// a hoop of the current tube (local x across the road): a half ring of glass and light, feet outside the walls
function eldHoop(m, R, col) {
  const n = 18;
  m.color('#2a3a58').shine(3); for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI, a1 = (i + 1) / n * Math.PI; m.limb(Math.cos(a0) * R, Math.sin(a0) * R * 0.62 + 0.2, 0, Math.cos(a1) * R, Math.sin(a1) * R * 0.62 + 0.2, 0, 0.42, 0.42, { seg: 6, ends: false }); }
  m.color(col, 1); for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI, a1 = (i + 1) / n * Math.PI; m.limb(Math.cos(a0) * (R - 0.4), Math.sin(a0) * (R - 0.4) * 0.62 + 0.2, 0.2, Math.cos(a1) * (R - 0.4), Math.sin(a1) * (R - 0.4) * 0.62 + 0.2, 0.2, 0.14, 0.14, { seg: 4, ends: false }); }
  m.emissive(0); m.color('#141c2a').shine(1); for (const sd of [-1, 1]) m.roundBox(sd * R, 0.5, 0, 1.6, 1.0, 1.6, 0.3); m.shine(0);
  return { cols: [{ t: 'cyl', x: -R, z: 0, r: 0.9, y0: 0, y1: 3, camPass: true }, { t: 'cyl', x: R, z: 0, r: 0.9, y0: 0, y1: 3, camPass: true }] };
}
// an eel burrow (local +z faces the road): a heap of dark rock round a round black hole rimmed with light
function eldBurrow(m) {
  m.color('#1a2434').shine(1);
  for (const [x, y, z, r] of [[-2.6, 1.0, -0.6, 1.8], [2.6, 1.0, -0.6, 1.8], [0, 3.0, -0.8, 2.0], [-1.8, 2.6, -0.4, 1.3], [1.8, 2.6, -0.4, 1.3], [0, 1.2, -1.8, 2.4]]) m.ball(x, y, z, r, { seg: 12, rings: 8 });
  m.color('#020408'); m.push(); m.tf(0, 1.4, 0.6, 0, Math.PI / 2, 0); m.disc(0, 0, 0, 1.55, 18); m.pop();
  m.color('#ffe25a', 1); m.push(); m.tf(0, 1.4, 0.65, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 1.6, 0.12, { seg: 20, tseg: 4 }); m.pop(); m.emissive(0);
  m.color('#38f2ff', 0.9); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; m.ball(Math.cos(a) * 2.6, 1.4 + Math.sin(a) * 2.2, 0.2, 0.16, { seg: 6, rings: 4 }); } m.emissive(0);
  return { cols: [{ t: 'box', x: 0, z: -0.8, hx: 3.4, hz: 1.6, y0: 0, y1: 4 }] };
}
// a black smoker: a lumpy chimney, a glowing throat and an orange-hot crust
function eldSmoker(m, h) {
  m.color('#1c1a22').shine(1); let r = 2.4;
  for (let i = 0; i < 7; i++) { const y = i * h / 7, rr = r * (1 - i * 0.09); m.ellipsoid(Math.sin(i * 1.7) * 0.4, y + h / 14, Math.cos(i * 2.1) * 0.4, rr, h / 10, rr, { seg: 12, rings: 7 }); }
  m.color('#ff7a2a', 0.9); for (let i = 0; i < 9; i++) { const a = i * 2.4, y = 0.6 + (i / 9) * h * 0.8; m.ball(Math.cos(a) * r * (1 - y / h * 0.6), y, Math.sin(a) * r * (1 - y / h * 0.6), 0.25, { seg: 6, rings: 4 }); }
  m.color('#ffb04a', 1); m.torus(0, h + 0.1, 0, 0.9, 0.22, { seg: 12, tseg: 4 }); m.emissive(0).shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.2, y0: 0, y1: h }], lights: [{ x: 0, y: h + 0.2, z: 0, s: 2.4, c: '#ff9a3a' }] };
}

/* ---------------- instanced props (this world only) ---------------- */
const ELD_KINDS = {
  // a rock spire with glowing veins (the rock stays dark; the veins take the tint): the trench walls
  eld_spire: { r: 4, near: 40, mid: 150, farD: 420, glows: [[0, 13, 0, 2.2]], noAO: true,
    build(m, o) {
      m.color('#1a2232').shine(1);
      for (let i = 0; i < 6; i++) { const y = i * 2.6, rr = 3.4 - i * 0.5; m.ellipsoid(Math.sin(i * 1.3) * 0.5, y + 1.4, Math.cos(i * 1.9) * 0.5, rr, 1.9, rr * 0.85, { seg: m.lo ? 8 : 12, rings: m.lo ? 5 : 7 }); }
      m.color('#ffffff', o.night ? 1 : 0.4);
      for (let k = 0; k < 3; k++) { const a = k * 2.1; let px = Math.cos(a) * 3.2, py = 0.3, pz = Math.sin(a) * 2.8; for (let i = 1; i <= 5; i++) { const y = i * 2.6, rr = 3.45 - i * 0.5 + 0.05, aa = a + Math.sin(i * 1.7 + k) * 0.35, x = Math.cos(aa) * rr, z = Math.sin(aa) * rr * 0.85; m.limb(px, py, pz, x, y, z, 0.12, 0.1, { seg: 4, ends: false }); px = x; py = y; pz = z; } }
      m.ball(0, 14.2, 0, 0.5, { seg: 8, rings: 5 });
      m.emissive(0).shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.2, y0: 0, y1: 14 }] };
    },
    far(m, o) { m.color('#1a2232'); m.cyl(0, 0, 0, 3.4, 0.8, 14.5, 6); m.color('#ffffff', o.night ? 1 : 0.4); m.box(0, 7, 2.6, 0.3, 12, 0.3); m.emissive(0); } },
  // a thicket of tube worms: white tubes, glowing plumes (tinted)
  eld_worms: { r: 2.4, near: 34, mid: 120, farD: 300, glows: [[0, 3.4, 0, 1.4]], pool: 6,
    build(m, o) {
      const W = [[0, 0, 3.4], [0.9, 0.3, 2.6], [-0.8, 0.5, 2.9], [0.4, -0.9, 2.2], [-0.5, -0.7, 2.4], [1.3, -0.5, 1.8], [-1.3, 0.1, 1.9]];
      for (const [x, z, h] of W) {
        m.color('#d8d4c8').shine(1); m.limb(x, 0, z, x * 1.08, h, z * 1.08, 0.22, 0.17, { seg: m.lo ? 5 : 7 });
        m.color('#ffffff', o.night ? 0.95 : 0.3).shine(2); m.ellipsoid(x * 1.08, h + 0.32, z * 1.08, 0.36, 0.5, 0.36, { seg: m.lo ? 6 : 9, rings: m.lo ? 4 : 6 });
      }
      m.emissive(0).shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.4, y0: 0, y1: 3, camPass: true }] };
    },
    far(m, o) { m.color('#d8d4c8'); m.cyl(0, 0, 0, 1.2, 0.6, 3, 5); m.color('#ffffff', o.night ? 0.95 : 0.3); m.ball(0, 3.3, 0, 0.9, { seg: 5, rings: 3 }); m.emissive(0); } },
  // a glowing anemone: a stubby column, a crown of tentacles with bright tips (tinted)
  eld_anemone: { r: 2, near: 30, mid: 110, farD: 260, glows: [[0, 1.6, 0, 1.6]],
    build(m, o) {
      m.color('#2a2a40').shine(1); m.lathe([[1.0, 0], [0.8, 0.8], [0.95, 1.2], [0, 1.25]], { seg: m.lo ? 8 : 12 });
      const n = m.lo ? 10 : 16; for (let i = 0; i < n; i++) { const a = i / n * TAU, r0 = 0.75, x0 = Math.cos(a) * r0, z0 = Math.sin(a) * r0, x1 = Math.cos(a) * 1.6, z1 = Math.sin(a) * 1.6; m.color('#ffffff', o.night ? 0.55 : 0.2); m.limb(x0, 1.2, z0, x1, 2.0 + (i % 3) * 0.2, z1, 0.1, 0.06, { seg: 4 }); m.color('#ffffff', 1); m.ball(x1, 2.05 + (i % 3) * 0.2, z1, 0.11, { seg: 5, rings: 3 }); }
      m.emissive(0).shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.9, y0: 0, y1: 1.3, camPass: true }] };
    },
    far(m, o) { m.color('#2a2a40'); m.cyl(0, 0, 0, 1, 0.9, 1.2, 6); m.color('#ffffff', o.night ? 0.8 : 0.2); m.disc(0, 1.6, 0, 1.6, 8); m.emissive(0); } },
  // an edge stud: a little bolt-shaped crystal on the road edge (the edges read from far away)
  eld_stud: { r: 0.6, near: 40, mid: 140, farD: 260, noAO: true, shadow: false,
    build(m) { m.color('#ffffff', 1); m.push(); m.tf(0, 0.08, 0, 0.6); m.box(0.08, 0, 0.12, 0.16, 0.12, 0.3); m.box(-0.08, 0, -0.12, 0.16, 0.12, 0.3); m.pop(); m.emissive(0); },
    far(m) { m.color('#ffffff', 1); m.box(0, 0.06, 0, 0.3, 0.08, 0.4); m.emissive(0); } }
};

/* ---------------- building the world ---------------- */
function eldWorld(id, D) {
  const sky = Object.assign({}, BURNS_PALETTES.night, { zen: '#010510', hor: '#0a3450', fog: '#031424', fogD: 0.0072, haze: 0.35, sky: '#08243e', gnd: '#061420', mid: '#04263c', midK: 0.35, cityCol: '#38f2ff', cityK: 0, key: '#7ac8ff', keyK: 0.5, emB: 1.9, stars: 0.25, clouds: 0, moon: [70, 70], moonK: 0.35, rim: '#38f2ff', mtnCol: '#020a14', mtnH: 4.5 });
  const W = CartKit.world(id, D, { worldId: 1243, night: true, sky, ground: '#26384c', crack: 0,
    road: { shoulder: 'rgba(20,70,110,0.45)', band: 'rgba(8,18,34,0.94)', edge: 'rgba(90,240,255,0.95)', edgeW: 0.6, centerFn: eldPaintCenter } });
  const { E, T, api, rng } = W;
  const sOf = (x, z) => CartKit.sOf(T, x, z);
  const S = { arcs: [sOf(48, 176), sOf(40, 145), sOf(32, 114)], tube0: sOf(50, 63), tube1: sOf(112, 49), jelly0: sOf(132, -10), jelly1: sOf(84, -146), eels: [sOf(15, -125), sOf(-8, -82)], flats: sOf(-100, -30), home: sOf(-162, 90) };
  E.eld = { S, mon: { x: ELD_MON[0], z: ELD_MON[1] } };
  const side = (s, sd, off) => { const g = T.at(s, {}), o = sd > 0 ? g.wr + off : -g.wl - off; return { x: g.x + g.nx * o, z: g.z + g.nz * o, yaw: Math.atan2(-g.nx * sd, -g.nz * sd), g }; };
  const taken = [];
  // ---- the sea floor: dark silt, sand ripples, glowing plankton specks and algae mats, the eel alley scorched ----
  api.paint((ctx, P, Sc) => {
    const b = T.bounds;
    for (let i = 0; i < 260; i++) { const x = b.x0 - 80 + rng() * (b.x1 - b.x0 + 160), z = b.z0 - 80 + rng() * (b.z1 - b.z0 + 160), q = P(x, z); ctx.fillStyle = `rgba(${rng() < 0.5 ? '8,20,36' : '40,70,96'},${0.18 + rng() * 0.2})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (4 + rng() * 14) * Sc, (2 + rng() * 6) * Sc, rng() * 3, 0, TAU); ctx.fill(); }
    ctx.lineWidth = 0.4 * Sc;
    for (let i = 0; i < 120; i++) { const x = b.x0 - 60 + rng() * (b.x1 - b.x0 + 120), z = b.z0 - 60 + rng() * (b.z1 - b.z0 + 120), q = P(x, z), L = (6 + rng() * 10) * Sc; ctx.strokeStyle = 'rgba(90,140,170,0.16)'; ctx.beginPath(); ctx.moveTo(q[0] - L, q[1]); ctx.quadraticCurveTo(q[0], q[1] - L * 0.25, q[0] + L, q[1]); ctx.stroke(); }
    const glowCol = ['56,242,255', '154,90,255', '122,255,106', '255,90,216'];
    for (let i = 0; i < 900; i++) { const x = b.x0 - 70 + rng() * (b.x1 - b.x0 + 140), z = b.z0 - 70 + rng() * (b.z1 - b.z0 + 140), q = P(x, z); ctx.fillStyle = `rgba(${glowCol[i % 4]},${0.35 + rng() * 0.5})`; ctx.beginPath(); ctx.arc(q[0], q[1], (0.12 + rng() * 0.22) * Sc, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 26; i++) { const x = b.x0 + rng() * (b.x1 - b.x0), z = b.z0 + rng() * (b.z1 - b.z0); if (!CartWorlds.clear(T, x, z, 8)) continue; const q = P(x, z), g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], (6 + rng() * 8) * Sc); g.addColorStop(0, `rgba(${glowCol[i % 4]},0.3)`); g.addColorStop(1, `rgba(${glowCol[i % 4]},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], 14 * Sc, 0, TAU); ctx.fill(); }
    // eel alley: a scorched band across the road at each crossing (where the eels' charge has burned the silt)
    for (const sv of S.eels) { const g = T.at(sv, {}); for (let d = -g.hw - 4; d <= g.hw + 4; d += 0.8) { const q = P(g.x + g.nx * d, g.z + g.nz * d); ctx.fillStyle = 'rgba(255,226,90,0.12)'; ctx.beginPath(); ctx.arc(q[0], q[1], 1.6 * Sc, 0, TAU); ctx.fill(); } }
    // the tube's floor: a cyan wash with forward chevrons
    for (let s = S.tube0; s < S.tube1; s += 5) { const g = T.at(s, {}); for (const dd of [-5, 0, 5]) { const q = P(g.x + g.nx * dd, g.z + g.nz * dd); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.strokeStyle = 'rgba(90,240,255,0.35)'; ctx.lineWidth = 0.35 * Sc; ctx.beginPath(); ctx.moveTo(-0.8 * Sc, -1.2 * Sc); ctx.lineTo(0.6 * Sc, 0); ctx.lineTo(-0.8 * Sc, 1.2 * Sc); ctx.stroke(); ctx.restore(); } }
  });
  // ---- barriers: cyan, blue and violet rails, cyan and white tyres on the tight bends; gaps for the pylons and burrows ----
  const gaps = S.arcs.map(sv => [sv, 3]).concat(S.eels.map(sv => [sv, 5]));
  eldRails(E, T, (i, tight) => tight ? (i % 2 ? '#ffffff' : '#38f2ff') : ['#38f2ff', '#4a7aff', '#9a5aff'][Math.floor(i / 2) % 3], gaps);
  CartKit.lamps(E, T, ['#38f2ff', '#9a5aff', '#7aff6a', '#4a7aff'], 40);
  CartKit.kinds(E, ELD_KINDS);
  for (let s = 0; s < T.L; s += 5) { const g = T.at(s, {}); for (const sd of [1, -1]) { const d = sd * (g.hw - 0.15); CartKit.put(E, 'eld_stud', g.x + g.nx * d, g.z + g.nz * d, g.yaw, Math.floor(s / 5) % 4 ? '#38f2ff' : '#ffe25a', { y: 0, noLights: true }); } }
  // ---- the start: SPARK GATE, the name, bleachers of deep-sea fans ----
  { const g = T.at(0, {}), Wd = g.wl + g.wr + 5;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => eldGate(m, Wd), { hi: true, noAO: true });
    api.sign('ELECTRIC DEEP', g.x, g.z, { yaw: g.yaw + Math.PI, h: 2.0, y: 16.4, post: false, maxW: 11, style: { bg: '#04142a', fg: '#ffffff', border: '#38f2ff' }, glow: '#38f2ff' });
    api.light(g.x, g.z, 22, '#38f2ff', 0.7);
    for (const sd of [1, -1]) { const p = side(16, sd, 6); E.spots.push(...CartScene.bleachers(api, p.x, p.z, p.yaw, 20, 3, rng)); api.light(p.x, p.z, 14, '#7ab8ff', 0.5); taken.push([p.x, p.z, 16]); } }
  CartKit.crowd(E, T, (T.L - 90) % T.L, T.L - 25, 1, rng, { rows: 1, off: 8, gap: 2.4 });
  // ---- the tesla stairs: a pylon either side of each gate ----
  E.eld.arcs = [];
  S.arcs.forEach((sv, i) => {
    const g = T.at(sv, {}), el = [];
    for (const sd of [1, -1]) { const p = side(sv, sd, 1.9); CartScene.mesh(api, p.x, p.z, p.yaw, m => eldPylon(m, i === 1 ? '#9a5aff' : '#38f2ff'), { hi: true, noAO: true }); api.light(p.x, p.z, 10, '#38f2ff', 0.55); taken.push([p.x, p.z, 4]); el.push({ x: p.x + Math.sin(p.yaw) * 1.1, z: p.z + Math.cos(p.yaw) * 1.1, tx: p.x, tz: p.z }); }
    E.eld.arcs.push({ i, s: sv, x: g.x, z: g.z, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, yaw: g.yaw, hw: g.hw, el });
  });
  { const p = side(S.arcs[0] - 28, -1, 1.5); api.sign('TESLA\nSTAIRS', p.x, p.z, { yaw: T.at(S.arcs[0] - 28, {}).yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.2, style: { bg: '#04142a', fg: '#ffe25a', border: '#38f2ff' }, glow: '#38f2ff' }); }
  // ---- the current tube: hoops of light every 7 m ----
  E.eld.hoops = [];
  for (let sv = S.tube0, k = 0; sv <= S.tube1 + 0.1; sv += 7, k++) { const g = T.at(sv, {}), R = Math.max(g.wl, g.wr) + 2.4; CartScene.mesh(api, g.x, g.z, g.yaw, m => eldHoop(m, R, k % 2 ? '#38f2ff' : '#7af6ff'), { hi: true, noAO: true }); E.eld.hoops.push({ s: sv, x: g.x, z: g.z, top: R * 0.62 + 0.2 }); }
  { const g = T.at(S.tube0, {}); api.light(g.x, g.z, 16, '#38f2ff', 0.55); const g2 = T.at(S.tube1, {}); api.light(g2.x, g2.z, 16, '#38f2ff', 0.55); const p = side(S.tube0 - 14, 1, 1.5); api.sign('CURRENT\nTUBE', p.x, p.z, { yaw: g.yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.2, style: { bg: '#04142a', fg: '#7af6ff', border: '#38f2ff' }, glow: '#38f2ff' }); }
  taken.push([T.at((S.tube0 + S.tube1) / 2, {}).x, T.at((S.tube0 + S.tube1) / 2, {}).z, 38]);
  // ---- jelly field: anemones and worms under the swarm, a sign ----
  { const p = side(S.jelly0 - 24, -1, 1.5); api.sign('JELLY\nFIELD', p.x, p.z, { yaw: T.at(S.jelly0 - 24, {}).yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.2, style: { bg: '#04142a', fg: '#ff6ad8', border: '#b47aff' }, glow: '#b47aff' }); }
  // ---- eel alley: a burrow either side of each crossing ----
  E.eld.eels = [];
  S.eels.forEach((sv, i) => {
    const g = T.at(sv, {});
    for (const sd of [1, -1]) { const p = side(sv, sd, 2.4); CartScene.mesh(api, p.x, p.z, p.yaw, eldBurrow, { hi: true }); api.light(p.x, p.z, 9, '#ffe25a', 0.45); taken.push([p.x, p.z, 6]); }
    E.eld.eels.push({ i, s: sv, x: g.x, z: g.z, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, yaw: g.yaw, hw: g.hw, wl: g.wl, wr: g.wr });
  });
  { const p = side(S.eels[0] - 30, 1, 1.5); api.sign('EEL\nALLEY', p.x, p.z, { yaw: T.at(S.eels[0] - 30, {}).yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.2, style: { bg: '#04142a', fg: '#ffe25a', border: '#ffe25a' }, glow: '#ffe25a' }); }
  // ---- black smokers: a vent field in the lower infield, two outside ----
  for (const [x, z, h] of [[72, -48, 13], [88, -78, 9], [55, -82, 11], [-118, 120, 10], [175, 140, 12], [-215, 60, 9]]) if (CartWorlds.clear(T, x, z, 4)) { CartScene.mesh(api, x, z, x * 0.07, m => eldSmoker(m, h), { hi: true }); api.light(x, z, 12, '#ff8a3a', 0.45); taken.push([x, z, 6]); }
  E.eld.vents = [[72, -48, 13], [88, -78, 9], [55, -82, 11], [-118, 120, 10]];
  // ---- Jelly Jolt herself floats over the upper infield (a moving part); a ring of anemones under her ----
  taken.push([ELD_MON[0], ELD_MON[1], 24]); api.light(ELD_MON[0], ELD_MON[1], 34, '#38f2ff', 0.55);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, x = ELD_MON[0] + Math.cos(a) * 15, z = ELD_MON[1] + Math.sin(a) * 15; if (CartWorlds.clear(T, x, z, 3)) CartKit.put(E, i % 2 ? 'eld_anemone' : 'eld_worms', x, z, a, ELD_PAL[i % 5], { scale: 1.3 }); }
  // ---- the trench: rock spires with glowing veins line the outside; worms and anemones fill the roadside ----
  for (let s = 6, k = 0; s < T.L; s += 13, k++) for (const sd of [1, -1]) {
    const p = side(s, sd, 16 + ((k * 7 + (sd > 0 ? 3 : 0)) % 5) * 4);
    if (!CartWorlds.clear(T, p.x, p.z, 8) || !taken.every(q => Math.hypot(q[0] - p.x, q[1] - p.z) > q[2] + 6)) continue;
    CartKit.put(E, 'eld_spire', p.x, p.z, k * 1.3, ELD_PAL[(k + (sd > 0 ? 2 : 0)) % 4], { scale: 1.2 + ((k * 3) % 5) * 0.3, noLights: k % 2 === 1 });
  }
  for (let s = 20, k = 0; s < T.L; s += 17, k++) {
    const sd = k % 2 ? 1 : -1, p = side(s, sd, 4 + (k % 3) * 2.2);
    if (!CartWorlds.clear(T, p.x, p.z, 2.5) || !taken.every(q => Math.hypot(q[0] - p.x, q[1] - p.z) > q[2] + 2)) continue;
    CartKit.put(E, k % 3 === 0 ? 'eld_anemone' : 'eld_worms', p.x, p.z, k, ELD_PAL[k % 5], { scale: 1 + (k % 2) * 0.35, noLights: k % 4 === 3 });
  }
  // light columns from far above (bioluminescent beams), in cyan and violet
  E.beams = []; for (let i = 0; i < 5; i++) { const p = side(T.L * (i + 0.4) / 5, i % 2 ? 1 : -1, 50 + rng() * 25); if (!CartWorlds.clear(T, p.x, p.z, 12)) continue; E.beams.push({ kind: 'search', x: p.x, y: 1, z: p.z, c: burnsRGBf(i % 2 ? '#9a5aff' : '#38f2ff'), ph: rng() * 6, sp: 0.25 + rng() * 0.25, len: 130, w: 6, a: 0.16 }); api.light(p.x, p.z, 10, '#38f2ff', 0.45); }
  // gift rows, boost pads, the grid
  const f = s => (((s % T.L) + T.L) % T.L) / T.L;
  CartKit.gifts(E, T, [f(sOf(30, 217)), f(sOf(141, 12)), f(sOf(38, -168)), f(S.flats)]);
  CartKit.boosts(E, T, [[f(S.home), 0.35], [f(sOf(-155, 160)), -0.35], [f(sOf(-62, -36)), 0]]);
  CartKit.grid(E, T);
  return CartKit.finish(E);
}
// the centre line: little lightning bolts every 9 m
function eldPaintCenter(ctx, P, S, T) {
  for (let s = 0; s < T.L; s += 9) { const g = T.at(s, {}), q = P(g.x, g.z); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.scale(S, S); ctx.fillStyle = 'rgba(255,226,90,0.72)'; ctx.beginPath(); ctx.moveTo(-1.6, -0.15); ctx.lineTo(0.2, -0.5); ctx.lineTo(-0.1, -0.05); ctx.lineTo(1.6, 0.15); ctx.lineTo(-0.2, 0.5); ctx.lineTo(0.1, 0.05); ctx.closePath(); ctx.fill(); ctx.restore(); }
}
// the kit's rails with gaps (pylons and burrows sit in the barrier line), and the night glow spill: gaps = [[s, half]]
function eldRails(E, T, pal, gaps) {
  CartDecor.protos(E);
  const step = 7;
  for (let s = 0; s < T.L; s += step) {
    if (gaps.some(q => Math.abs(CartKit.ds(T, s, q[0])) < q[1])) continue;
    const g = T.at(s, {}), tight = Math.abs(g.k) > 0.012, i = Math.floor(s / step);
    for (const sd of [1, -1]) {
      const off = sd > 0 ? g.wr : -g.wl, x = g.x + g.nx * off, z = g.z + g.nz * off, col = pal(i, tight, sd);
      CartDecor.put(E, tight ? 'tyres' : 'rail', x, z, g.yaw, col, { y: 0, noLights: true, k: 1 });
      if (i % 3 === 0) E.api.glow(x, 0.98, z, 0.9, col); if (i % 2 === 0) E.api.light(x - g.nx * sd * 1.2, z - g.nz * sd * 1.2, 5.5, col, 0.36);
    }
  }
}

/* ---------------- the moving things (one pooled group) ---------------- */
const ELD_EEL_N = 10, ELD_JELLIES = 7;
const EldMesh = {
  // a jellyfish (about 4 m tall at scale 1): a glowing bell, a frill, a bright core, trailing tentacles (y 0 = bell rim)
  jelly(m, i) {
    const c = ELD_JELLY_COL[i % ELD_JELLY_COL.length];
    m.color(c, 0.55).shine(3); m.lathe([[1.75, 0], [1.8, 0.35], [1.55, 1.0], [1.0, 1.5], [0.4, 1.7], [0, 1.72]], { seg: 18 });
    m.color('#ffffff', 0.9); m.ellipsoid(0, 0.7, 0, 0.75, 0.6, 0.75, { seg: 10, rings: 7 });
    m.color(c, 1); m.torus(0, 0.05, 0, 1.75, 0.14, { seg: 20, tseg: 4 });
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, x = Math.cos(a) * 1.5, z = Math.sin(a) * 1.5; let px = x, py = 0, pz = z; for (let j = 1; j <= 3; j++) { const nx = x * (1 - j * 0.12) + Math.sin(k + j * 1.7) * 0.25, ny = -j * 1.05, nz = z * (1 - j * 0.12) + Math.cos(k * 2 + j) * 0.25; m.limb(px, py, pz, nx, ny, nz, 0.07, 0.05, { seg: 4, ends: false }); px = nx; py = ny; pz = nz; } m.ball(px, py, pz, 0.1, { seg: 5, rings: 3 }); }
    m.color('#ffffff', 0.8); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; let px = Math.cos(a) * 0.4, py = 0.1, pz = Math.sin(a) * 0.4; for (let j = 1; j <= 3; j++) { const nx = Math.cos(a + j * 0.6) * 0.45, ny = -j * 0.8, nz = Math.sin(a + j * 0.6) * 0.45; m.limb(px, py, pz, nx, ny, nz, 0.16, 0.12, { seg: 5, ends: false }); px = nx; py = ny; pz = nz; } }
    m.emissive(0).shine(0);
  },
  // a volt eel segment (forward +z): segment 0 is the head (jaw, glowing eyes), the last the tail fin; glowing spots
  eel(m, i) {
    const j = i % ELD_EEL_N, tp = 1 - j / ELD_EEL_N * 0.55;
    m.color('#1a2c4a').shine(3);
    if (j === 0) {
      m.ellipsoid(0, 0.85, 0.2, 0.95, 0.8, 1.5, { seg: 14, rings: 9 });
      m.color('#2a4468'); m.ellipsoid(0, 0.55, 0.7, 0.8, 0.35, 1.1, { seg: 12, rings: 6 });
      m.color('#ffe25a', 1); for (const sd of [-1, 1]) m.ball(sd * 0.62, 1.15, 1.05, 0.2, { seg: 8, rings: 6 });
      m.color('#ffffff', 1); for (const sd of [-1, 1]) m.ball(sd * 0.72, 1.18, 1.16, 0.07, { seg: 5, rings: 3 });
      m.color('#38f2ff', 1); for (const sd of [-1, 1]) { m.limb(sd * 0.3, 1.5, 0.6, sd * 0.7, 2.3, 0.2, 0.05, 0.04, { seg: 4 }); m.ball(sd * 0.7, 2.35, 0.2, 0.14, { seg: 6, rings: 4 }); }
    } else {
      m.ellipsoid(0, 0.8 * tp, 0, 0.85 * tp, 0.75 * tp, 1.05, { seg: 12, rings: 8 });
      m.color('#38f2ff', 1); m.ellipsoid(0, 0.8 * tp + 0.7 * tp, 0, 0.08, 0.28 * tp, 0.85, { seg: 6, rings: 4 });
      m.color('#ffe25a', 1); for (const sd of [-1, 1]) m.ball(sd * 0.78 * tp, 0.85 * tp, (j % 2) * 0.4 - 0.2, 0.14, { seg: 6, rings: 4 });
      if (j === ELD_EEL_N - 1) { m.color('#38f2ff', 0.9); m.ellipsoid(0, 0.7 * tp, -1.1, 0.08, 0.7, 0.8, { seg: 6, rings: 5 }); }
    }
    m.emissive(0).shine(0);
  },
  // JELLY JOLT, 30 m of her: an electric-blue bell with a mean little face and a bolt on her brow, a crown of sparks,
  // forty metres of tentacles (y 0 = bell rim)
  jolt(m) {
    m.color('#38d8ff', 0.6).shine(3); m.lathe([[8.6, 0], [8.8, 1.6], [7.8, 4.8], [5.6, 7.4], [2.6, 8.9], [0, 9.2]], { seg: 32 });
    m.color('#ffffff', 0.85); m.ellipsoid(0, 3.4, 0, 4.4, 3.2, 4.4, { seg: 16, rings: 10 });
    m.color('#ff6ad8', 1); m.torus(0, 0.25, 0, 8.7, 0.6, { seg: 36, tseg: 6 });
    // the face (on the +z side): eyes, scowling brows, a grin; the bolt on her brow
    m.color('#ffffff', 0.4); for (const sd of [-1, 1]) m.ellipsoid(sd * 2.2, 4.8, 7.0, 1.3, 1.5, 0.8, { seg: 12, rings: 8 });
    m.color('#0a1020', 0); for (const sd of [-1, 1]) m.ball(sd * 2.0, 4.6, 7.7, 0.62, { seg: 10, rings: 7 });
    m.color('#ffffff', 1); for (const sd of [-1, 1]) m.ball(sd * 1.8, 4.9, 8.2, 0.2, { seg: 6, rings: 4 });
    m.color('#0a1020', 0); for (const sd of [-1, 1]) { m.push(); m.tf(sd * 2.2, 6.5, 7.0, 0, 0, sd * 0.35); m.roundBox(0, 0, 0, 2.6, 0.45, 0.6, 0.2); m.pop(); }
    m.color('#0a1020', 0); for (let k = 0; k < 7; k++) { const u = k / 6 - 0.5, x = u * 4.4, y = 2.6 - Math.cos(u * Math.PI) * 0.7; m.ball(x, y, 7.75 - Math.abs(u) * 0.8, 0.28, { seg: 6, rings: 4 }); }
    m.color('#ffe25a', 1); m.push(); m.tf(0, 8.4, 4.4, 0, -0.55, 0); m.extrude([[-0.4, 1.8], [1.0, 1.8], [0.2, 0.3], [1.1, 0.3], [-0.8, -2.0], [-0.1, -0.2], [-1.0, -0.2]].reverse(), 0.4, { convex: false }); m.pop();
    m.color('#ffe25a', 1); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; m.limb(Math.cos(a) * 2.4, 8.7, Math.sin(a) * 2.4, Math.cos(a) * 3.0, 11.0, Math.sin(a) * 3.0, 0.16, 0.08, { seg: 4 }); m.ball(Math.cos(a) * 3.0, 11.1, Math.sin(a) * 3.0, 0.35, { seg: 6, rings: 4 }); }
    // tentacles: 14 thin ones round the rim, 4 thick frilly arms in the middle
    for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, x = Math.cos(a) * 7.8, z = Math.sin(a) * 7.8; m.color(k % 2 ? '#7af6ff' : '#b47aff', 0.9); let px = x, py = 0, pz = z; for (let j = 1; j <= 5; j++) { const nx = x * (1 - j * 0.08) + Math.sin(k * 1.3 + j) * 1.2, ny = -j * 2.6, nz = z * (1 - j * 0.08) + Math.cos(k * 0.7 + j * 1.4) * 1.2; m.limb(px, py, pz, nx, ny, nz, 0.26, 0.18, { seg: 5, ends: false }); px = nx; py = ny; pz = nz; } m.ball(px, py, pz, 0.35, { seg: 6, rings: 4 }); }
    m.color('#ff9ae8', 0.8); for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; let px = Math.cos(a) * 2, py = 0.5, pz = Math.sin(a) * 2; for (let j = 1; j <= 4; j++) { const nx = Math.cos(a + j * 0.5) * 2.4, ny = -j * 2.4, nz = Math.sin(a + j * 0.5) * 2.4; m.limb(px, py, pz, nx, ny, nz, 0.8, 0.6, { seg: 7, ends: false }); px = nx; py = ny; pz = nz; } }
    m.emissive(0).shine(0);
  }
};

/* ---------------- the rules: hazards at run time ---------------- */
// ARC GATES: each fires every `period` s; gate i fires `step` s after gate i-1 (about the time a racing car takes to
// get from one to the next: ride behind the wave). warn = the charge, zap = the arc across the road
const ELD_ARC = { period: 4.2, warn: 1.3, zap: 0.45, step: 1.05, band: 2.1 };
const ELD_JELLY = { period: 5.6, warn: 1.2, sting: 0.35, R: 4.6, R0: 11, y: 3.4 };
const ELD_EEL = { period: 7.6, warn: 1.3, speed: 13, seg: 1.55, r: 1.05 };
const ELD_TUBE = { period: 6.4, warn: 1.1, surge: 2.8 };
const eldArcPh = (a, t) => { const P = ELD_ARC.period; return (((t + 3 - a.i * ELD_ARC.step) % P) + P) % P; };   // zap while ph > P - zap
CART_TRACK_RULES.electricdeep = {
  onLoad(s) {
    const E = s.E, B = E.eld, T = s.T || s.TR;
    const G = CartKit.group(s, [['jellies', EldMesh.jelly, ELD_JELLIES], ['eels', EldMesh.eel, ELD_EEL_N * 2], ['jolt', EldMesh.jolt, 1]]);
    const L = s.eld = { G, arcs: [], jellies: [], eels: [], tube: null, flash: 0, said: {}, hintT: -9 };
    for (const a of B.arcs) L.arcs.push(Object.assign({}, a, { st: 'idle', u: 0, c: -1, mask: 0 }));
    const j0 = B.S.jelly0, j1 = B.S.jelly1;
    for (let i = 0; i < ELD_JELLIES; i++) L.jellies.push({ i, s0: lerp(j0, j1, (i + 0.5) / ELD_JELLIES), s: 0, d: 0, x: 0, y: 0, z: 0, gx: 0, gz: 0, st: 'drift', u: 0, c: -1, mask: 0, off: i * 1.93, sc: 0.95 + (i % 3) * 0.15, obj: G.jellies[i], col: ELD_JELLY_F[i % ELD_JELLY_F.length] });
    B.eels.forEach((e, i) => L.eels.push(Object.assign({}, e, { st: 'rest', t: -i * 3.6 - 1.5, sd: i % 2 ? 1 : -1, d: 0, mask: 0, segs: G.eels.slice(i * ELD_EEL_N, (i + 1) * ELD_EEL_N) })));
    L.tube = { s0: B.S.tube0, s1: B.S.tube1, hoops: B.hoops, st: 'idle', u: 0, c: -1, mask: 0 };
    L.jolt = { obj: G.jolt[0], x: B.mon.x, z: B.mon.z };
    CartKit.state(s);
  },
  onUpdate(s, dt, racing) {
    const L = s.eld; if (!L) return;
    eldArcs(s, L, dt, racing); eldJellies(s, L, dt, racing); eldEels(s, L, dt, racing); eldTube(s, L, dt, racing);
    // Jelly Jolt bobs and pulses over the infield
    const o = L.jolt.obj; if (o) { const ph = s.time * 0.9; o.live = true; o.visible = true; o.x = L.jolt.x; o.z = L.jolt.z; o.y = 21 + Math.sin(ph * 0.5) * 1.6; o.yaw = Math.sin(s.time * 0.12) * 0.6 + 0.4; o.pitch = Math.sin(s.time * 0.31) * 0.05; o.roll = Math.sin(s.time * 0.23) * 0.05; o.scale = 1 + Math.pow(Math.max(0, Math.sin(ph)), 4) * 0.05; }
    if (L.flash > 0) L.flash = Math.max(0, L.flash - dt);
  },
  // the AI: ease off or HOP for an arc that will be live when it gets there; ease off for an eel in its path (by
  // skill); the jellies' sting rings and the eels' bodies are cartIxObs obstacles it steers round
  onStep(s, k, dt, racing) {
    const L = s.eld; if (!L || k.player && !s.autoDrive || !racing || !s.T || k.out) return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9, luck = ((k.slot * 7 + Math.floor(s.time * 0.5)) % 10) / 10, C = ELD_ARC;
    for (const a of L.arcs) {
      const ds = CartKit.ahead(s, k, a.s); if (ds < 0.5 || ds > 42) continue;
      const ta = ds / Math.max(6, k.speed), ph = eldArcPh(a, s.time + ta), live = ph > C.period - C.zap - 0.22 || ph < 0.12;
      if (!live) continue;
      if (ta < 0.22) { if (!k.air && luck < 0.5 + (sk - 0.85) * 3) { I.driftPress = true; I.drift = false; } }
      else if (luck < 0.4 + (sk - 0.85) * 3) { if (k.speed > 12) I.gas = 0; if (k.speed > 20) I.brake = 0.4; }
      break;
    }
    for (const e of L.eels) {
      if (e.st === 'rest') continue;
      const ds = CartKit.ahead(s, k, e.s); if (ds < 5 || ds > 40 || k.speed < 12) continue;   // ease off, never stop: a crawling car sees the eel in its path every time
      const ta = ds / Math.max(6, k.speed), dir = -e.sd, delay = e.st === 'warn' ? ELD_EEL.warn - e.t : 0, hd = e.d + dir * Math.max(0, ta - delay) * ELD_EEL.speed, tl = hd - dir * ELD_EEL_N * ELD_EEL.seg;
      const lo = Math.min(hd, tl) - 2.5, hi = Math.max(hd, tl) + 2.5;
      if (k.loc.d > lo && k.loc.d < hi && luck < 0.5 + (sk - 0.85) * 3) { I.gas = 0; if (k.speed > 18) I.brake = 0.4; break; }
    }
  },
  draw(s, R, S, t) { const L = s.eld; if (L) eldDraw(s, L, R, S, t); },
  lights(s, add) {
    const L = s.eld; if (!L) return;
    for (const a of L.arcs) if (a.st === 'zap') add(a.x, 2, a.z, 22, ELD_C.ice, 2.0, 2); else if (a.st === 'warn') add(a.x, 2, a.z, 12, ELD_C.cyan, 0.6 + a.u, 1);
    for (const j of L.jellies) if (j.st !== 'drift') add(j.x, j.y, j.z, j.st === 'sting' ? 16 : 9, j.col, j.st === 'sting' ? 1.8 : 0.8, 1);
    for (const e of L.eels) if (e.st === 'cross') add(e.x + e.nx * e.d, 1.5, e.z + e.nz * e.d, 10, ELD_C.volt, 1.0, 1);
    if (L.tube.st === 'surge') { const g = s.T.at((L.tube.s0 + L.tube.s1) / 2, ELD_T.at2); add(g.x, 4, g.z, 30, ELD_C.cyan, 1.2, 1); }
    add(L.jolt.x, 20, L.jolt.z, 40, ELD_C.cyan, 1.0, 1);
  },
  hud(s, ctx, W, H, top, left) {
    const L = s.eld, p = s.player; if (!L || !p) return;
    // zapped / stung: a blue-white flicker, lightning crawling in from the screen edges
    if (L.flash > 0) {
      const a = Math.min(1, L.flash * 1.8), tt = Math.floor(s.time * 30); ctx.save();
      ctx.fillStyle = `rgba(120,220,255,${0.16 * a * (tt % 2 ? 1 : 0.5)})`; ctx.fillRect(0, 0, W, H);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 0; i < 6; i++) {
        const edge = i % 4, len = (0.18 + eldH(tt + i) * 0.16) * Math.min(W, H) * 1.6; let x = edge === 0 ? 0 : edge === 1 ? W : eldH(i * 3 + tt) * W, y = edge < 2 ? eldH(i * 5 + tt) * H : edge === 2 ? 0 : H;
        const ax = edge === 0 ? 1 : edge === 1 ? -1 : 0, ay = edge === 2 ? 1 : edge === 3 ? -1 : 0;
        ctx.globalAlpha = a; ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,0.95)' : 'rgba(120,240,255,0.95)'; ctx.lineWidth = 3 + (i % 2) * 2; ctx.beginPath(); ctx.moveTo(x, y);
        for (let j = 1; j <= 6; j++) { x += ax * len / 6 + (eldH(i * 13 + j + tt) - 0.5) * len * 0.35 * (ay ? 1 : 0.6); y += ay * len / 6 + (eldH(i * 17 + j * 3 + tt) - 0.5) * len * 0.35 * (ax ? 1 : 0.6); ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.restore();
    }
    // first-lap hints as each hazard comes up
    const hint = (key, sv, text, sub) => { if (L.said[key] || p.lap > 1) return; const ds = CartKit.ds(s.T, p.loc.s, sv); if (ds > 0 && ds < 75) { L.said[key] = true; L.hintT = s.time; s.banner(text, '#38f2ff', 2.0, sub); } };
    if (s.state === 'race' && s.T) { const S = s.E.eld.S; hint('arcs', S.arcs[0], 'ARC GATES!', 'HOP the arc, or ride right behind the zap'); hint('tube', S.tube0, 'CURRENT TUBE!', 'be inside when it surges for a free boost'); hint('jelly', S.jelly0, 'JELLY FIELD!', 'get out of the ring before it stings'); hint('eels', S.eels[0], 'VOLT EELS!', 'brake and pass behind the tail'); }
  }
};
const eldBanner = (s, L, k, text, sub, col) => { if (k.player && !(s.time - L.hintT < 2.3)) s.banner(text, col || '#ffe25a', 1.0, sub, true); };

// ---- the arc gates: idle → warn (coils charge, the road flashes) → ZAP (the arc across the road) ----
function eldArcs(s, L, dt, racing) {
  const C = ELD_ARC;
  for (const a of L.arcs) {
    const ph = eldArcPh(a, s.time), c = Math.floor((s.time + 3 - a.i * C.step) / C.period), w0 = C.period - C.zap - C.warn;
    a.st = ph < w0 ? 'idle' : ph < C.period - C.zap ? 'warn' : 'zap'; a.u = a.st === 'warn' ? (ph - w0) / C.warn : a.st === 'zap' ? (ph - (C.period - C.zap)) / C.zap : 0;
    if (a.st === 'warn' && a.wc !== c) { a.wc = c; if (CartKit.near(s, a.x, a.z, 60)) cartIxSound(s, 'cartSparkle', a.x, a.z, 0.4, 0.6); }
    if (a.st === 'zap' && a.c !== c) {
      a.c = c; a.mask = 0; CartKit.fired(s, 'arc');
      if (CartKit.near(s, a.x, a.z, 80)) { cartIxSound(s, 'cartZap', a.x, a.z, 0.9, 0.8); cartIxSound(s, 'cartBoom', a.x, a.z, 0.25, 1.6); }
      if (CartKit.near(s, a.x, a.z, 30)) s.shakeIt(0.25);
    }
    if (a.st === 'zap') {
      for (let d = -a.hw + 3; d < a.hw; d += 6) cartIxObs(s, a.x + a.nx * d, a.z + a.nz * d, 2.6);
      if (racing) for (const k of s.karts) {
        if (k.out || (a.mask & (1 << k.slot))) continue;
        const dx = k.x - a.x, dz = k.z - a.z, along = dx * a.tx + dz * a.tz, across = dx * a.nx + dz * a.nz;
        if (Math.abs(along) > C.band || Math.abs(across) > a.hw + 1.5) continue;
        a.mask |= 1 << k.slot;
        if (k.air && k.y > s.terrain.height(k.x, k.z) + 0.35) { if (k.player) s.banner('NICE HOP!', '#7aff8a', 0.7, null, true); continue; }   // hopped it
        if (CartKit.hit(s, k, 'stun', 'arc', { banner: 'ZAPPED!' })) { if (k.player) L.flash = 0.7; if (s.fx && CartKit.near(s, k.x, k.z, 90)) s.fx.burst(k.x, k.y + 1, k.z, 'spark', 12, '#bff8ff'); }
      }
    }
  }
}
// ---- the jellies: drift over the road; flash and close a ring on the road (warn); STING everything in it ----
function eldJellies(s, L, dt, racing) {
  const C = ELD_JELLY, T = s.T || s.TR;
  for (const j of L.jellies) {
    j.s = j.s0 + Math.sin(s.time * 0.13 + j.i * 1.7) * 7;
    const g = T.at(j.s, ELD_T.at); j.d = g.hw * 0.68 * Math.sin(s.time * (0.19 + j.i * 0.017) + j.i * 1.9);
    j.gx = g.x + g.nx * j.d; j.gz = g.z + g.nz * j.d;
    const tt = s.time + j.off, c = Math.floor(tt / C.period), ph = tt - c * C.period, w0 = C.period - C.warn - C.sting;
    j.st = ph < w0 ? 'drift' : ph < C.period - C.sting ? 'warn' : 'sting'; j.u = j.st === 'warn' ? (ph - w0) / C.warn : j.st === 'sting' ? (ph - (C.period - C.sting)) / C.sting : ph / w0;
    // the bell pulses: a slow swim stroke while drifting, a hard contraction when it stings
    const stroke = Math.pow(Math.max(0, Math.sin(s.time * 2.2 + j.i)), 3);
    j.x = j.gx; j.z = j.gz; j.y = s.terrain.height(j.x, j.z) + C.y + stroke * 0.5 - (j.st === 'warn' ? j.u * 0.8 : j.st === 'sting' ? 0.8 : 0);
    if (j.st !== 'drift') cartIxObs(s, j.gx, j.gz, C.R + 1.2);
    if (j.st === 'sting' && j.c !== c) {
      j.c = c; j.mask = 0; CartKit.fired(s, 'jelly');
      if (CartKit.near(s, j.x, j.z, 70)) cartIxSound(s, 'cartZap', j.x, j.z, 0.6, 1.3);
      if (s.fx && CartKit.near(s, j.x, j.z, 90)) s.fx.burst(j.gx, 0.8, j.gz, 'ring', 10, ELD_JELLY_COL[j.i % ELD_JELLY_COL.length]);
    }
    if (j.st === 'sting' && racing) for (const k of s.karts) {
      if (k.out || (j.mask & (1 << k.slot))) continue;
      if ((k.x - j.gx) ** 2 + (k.z - j.gz) ** 2 > (C.R + 0.9) ** 2) continue;
      j.mask |= 1 << k.slot;
      if (k.shieldT > 0 || k.immuneT > 0) continue;
      k.slowT = Math.max(k.slowT || 0, 1.1); k.vx *= 0.72; k.vz *= 0.72; k.lostT = Math.max(k.lostT || 0, 0.8);
      if (k.player) { L.flash = 0.6; Sound.play('cartZap', { vol: 0.7, pitch: 1.4 }); }
      CartKit.touch(s, k, 'jelly', 'STUNG!', '#ff6ad8');
    }
    const o = j.obj; if (o) { const sq = j.st === 'sting' ? 0.82 : 1 - stroke * 0.08 - (j.st === 'warn' ? Math.sin(s.time * 40) * 0.03 : 0); o.live = true; o.visible = true; o.x = j.x; o.y = j.y; o.z = j.z; o.yaw = s.time * 0.2 + j.i; o.pitch = Math.sin(s.time * 0.7 + j.i) * 0.08; o.roll = Math.cos(s.time * 0.6 + j.i) * 0.08; o.scale = j.sc * sq; }
  }
}
// ---- the volt eels: rest in a burrow; the burrow lights and the lane flashes (warn); slither across; rest opposite ----
function eldEels(s, L, dt, racing) {
  const C = ELD_EEL, N = ELD_EEL_N;
  for (const e of L.eels) {
    const edge = (e.sd > 0 ? e.wr : e.wl) + 2.4, far = (e.sd > 0 ? e.wl : e.wr) + 2.4, dir = -e.sd, start = e.sd * edge, end = dir * far;
    e.t += dt;
    if (e.st === 'rest') { e.d = start; if (e.t > C.period - C.warn - 3.4) { e.st = 'warn'; e.t = 0; if (CartKit.near(s, e.x, e.z, 60)) cartIxSound(s, 'cartSparkle', e.x, e.z, 0.5, 0.5); } }
    else if (e.st === 'warn') { e.d = start + dir * 1.2 * Math.min(1, e.t / C.warn); if (e.t > C.warn) { e.st = 'cross'; e.t = 0; e.mask = 0; CartKit.fired(s, 'eel'); if (CartKit.near(s, e.x, e.z, 70)) { cartIxSound(s, 'cartZap', e.x, e.z, 0.7, 0.6); cartIxSound(s, 'kartDrift', e.x, e.z, 0.5, 0.5); } } }
    else {
      e.d += dir * C.speed * dt;
      if (dir * (e.d - end) > N * C.seg) { e.st = 'rest'; e.t = 0; e.sd = dir; e.d = end; continue; }
    }
    // the body: segment j trails the head along the crossing line; visible between the two burrows
    const wig = s.time * 9;
    for (let jj = 0; jj < N; jj++) {
      const o = e.segs[jj]; if (!o) continue;
      const dj = e.d - dir * jj * C.seg, out = dir * (dj - start) > -0.6 && dir * (dj - end) < 0.6, show = e.st === 'cross' ? out : e.st === 'warn' && jj === 0;
      o.live = show; o.visible = show; if (!show) continue;
      const w = Math.sin(dj * 0.55 - wig) * 1.0, wd = Math.cos(dj * 0.55 - wig) * 0.55;
      const x = e.x + e.nx * dj + e.tx * w, z = e.z + e.nz * dj + e.tz * w;
      o.x = x; o.z = z; o.y = s.terrain.height(x, z) + (e.st === 'warn' ? -0.3 + Math.sin(s.time * 30) * 0.06 : 0); o.yaw = Math.atan2(e.nx * dir + e.tx * wd * dir, e.nz * dir + e.tz * wd * dir); o.pitch = 0; o.roll = 0; o.scale = 1;
      if (e.st === 'cross' && (jj % 3 === 0) && Math.abs(dj) < Math.max(e.wl, e.wr)) cartIxObs(s, x + e.nx * dir * (jj ? 0 : 2.5), z + e.nz * dir * (jj ? 0 : 2.5), jj ? 2.2 : 2.8);
      if (e.st === 'cross' && racing) for (const k of s.karts) {
        if (k.out || (e.mask & (1 << k.slot))) continue;
        const dx = k.x - x, dz = k.z - z; if (dx * dx + dz * dz > (C.r + 1.2) ** 2) continue;
        e.mask |= 1 << k.slot;
        if (CartKit.hit(s, k, 'knock', 'eel', { dx: e.nx * dir, dz: e.nz * dir, power: 9, dur: 0.9, banner: 'VOLT EEL!' })) { if (k.player) L.flash = 0.5; cartIxSound(s, 'cartZap', k.x, k.z, 0.8, 1.0); if (s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'spark', 10, '#ffe25a'); }
      }
    }
    if (e.st === 'warn') for (let r = 0; r < 3; r++) { const dd = start + dir * (4 + r * 6); cartIxObs(s, e.x + e.nx * dd, e.z + e.nz * dd, 2.2); }
  }
}
// ---- the current tube: idle → warn (chevrons run through it) → SURGE: a free boost for every car inside ----
function eldTube(s, L, dt, racing) {
  const C = ELD_TUBE, U = L.tube, T = s.T || s.TR, tt = s.time + 2, c = Math.floor(tt / C.period), ph = tt - c * C.period, w0 = C.period - C.warn - C.surge;
  U.st = ph < w0 ? 'idle' : ph < w0 + C.warn ? 'warn' : 'surge'; U.u = U.st === 'warn' ? (ph - w0) / C.warn : U.st === 'surge' ? (ph - w0 - C.warn) / C.surge : 0;
  if (U.st === 'surge' && U.c !== c) { U.c = c; U.mask = 0; CartKit.fired(s, 'current'); const g = T.at(U.s0, ELD_T.at2); if (CartKit.near(s, g.x, g.z, 90)) cartIxSound(s, 'wind', g.x, g.z, 0.6, 1.3); }
  if (U.st === 'surge' && racing) for (const k of s.karts) {
    if (k.out || (U.mask & (1 << k.slot))) continue;
    const ds = CartKit.ds(T, U.s0, k.loc.s); if (ds < 0 || ds > U.s1 - U.s0 || Math.abs(k.loc.d) > 10.5) continue;
    U.mask |= 1 << k.slot; s.boost(k, 1.0, 'pad'); CartKit.touch(s, k, 'current', 'CURRENT RIDE!', '#38f2ff');
  }
}
// a jagged bolt of light from (x0, y0, z0) to (x1, y1, z1): n kinks, jitter j, flickering 30 times a second
function eldBolt(R, S, x0, y0, z0, x1, y1, z1, n, j, w, col, a, seed, t) {
  const fr = Math.floor(t * 30) * 7.3 + seed;
  let px = x0, py = y0, pz = z0;
  for (let i = 1; i <= n; i++) {
    const u = i / n, k = i < n ? 1 : 0, x = lerp(x0, x1, u) + (eldH(fr + i * 3.1) - 0.5) * j * k, y = lerp(y0, y1, u) + (eldH(fr + i * 5.7) - 0.5) * j * 0.8 * k, z = lerp(z0, z1, u) + (eldH(fr + i * 9.3) - 0.5) * j * k;
    const dx = x - px, dy = y - py, dz = z - pz, l = Math.hypot(dx, dy, dz) || 1;
    R.bbs.streak((x + px) / 2, (y + py) / 2, (z + pz) / 2, dx / l, dy / l, dz / l, l * 1.15, w * 2.4, S.streak, col, a * 0.7);
    R.bbs.streak((x + px) / 2, (y + py) / 2, (z + pz) / 2, dx / l, dy / l, dz / l, l * 1.1, w, S.streak, ELD_C.white, a);
    px = x; py = y; pz = z;
  }
}
// ---- sprites: arcs, rings, eel lanes, the tube's flow, Jelly Jolt's halo, marine snow round the camera ----
function eldDraw(s, L, R, S, t) {
  const C = ELD_C, cam = s.cam, T = s.T || s.TR, near = (x, z, r) => (x - cam.x) ** 2 + (z - cam.z) ** 2 < r * r;
  for (const a of L.arcs) {
    if (!near(a.x, a.z, 200)) continue;
    const e0 = a.el[0], e1 = a.el[1];
    // the toroids always crackle a little; the electrodes glow
    for (const e of a.el) { R.bbs.bb(e.tx, 8.9, e.tz, 4 + (a.st === 'warn' ? a.u * 4 : 0), 4 + (a.st === 'warn' ? a.u * 4 : 0), S.glow, a.i === 1 ? C.violet : C.cyan, 0.45 + (a.st === 'idle' ? 0 : 0.4), true); R.bbs.bb(e.x, 1.3, e.z, 1.6 + (a.st === 'warn' ? a.u * 2.4 : 0), 1.6 + (a.st === 'warn' ? a.u * 2.4 : 0), S.glow, C.ice, 0.6, true); }
    if (eldH(Math.floor(t * 8) + a.i * 11) > 0.6) eldBolt(R, S, e0.tx, 9.4, e0.tz, e0.tx + (eldH(t * 3 + a.i) - 0.5) * 3, 11.5, e0.tz + (eldH(t * 5 + a.i) - 0.5) * 3, 3, 0.8, 0.18, C.cyan, 0.8, a.i, t);
    if (a.st === 'warn') {
      // a zig-zag flashing across the road, little arcs creeping in from both electrodes, sparks climbing the coils
      const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 22));
      for (let i = 0; i < 9; i++) { const u = (i + 0.5) / 9, d = lerp(-a.hw, a.hw, u), off = (i % 2 ? 1 : -1) * 0.9; R.flat.flat(a.x + a.nx * d + a.tx * off, 0.1, a.z + a.nz * d + a.tz * off, 2.6, 0.7, a.yaw + Math.PI / 2 + (i % 2 ? 0.7 : -0.7), S.square, C.volt, 0.9 * fl, true); }
      R.flat.flat(a.x, 0.08, a.z, a.hw * 2 + 2, ELD_ARC.band * 2, a.yaw, S.square, C.cyan, 0.22 * fl, true);
      const reach = a.u * 0.5;
      eldBolt(R, S, e0.x, 1.3, e0.z, lerp(e0.x, e1.x, reach), 1.3, lerp(e0.z, e1.z, reach), 4, 1.0, 0.16, C.cyan, 0.9, a.i * 3, t);
      eldBolt(R, S, e1.x, 1.3, e1.z, lerp(e1.x, e0.x, reach), 1.3, lerp(e1.z, e0.z, reach), 4, 1.0, 0.16, C.cyan, 0.9, a.i * 3 + 1, t);
      for (const e of a.el) { const y = 1.4 + ((t * 6 + a.i) % 1) * 5.5; R.bbs.bb(e.tx, y, e.tz, 1.4, 1.4, S.spark, C.ice, 0.9, true); }
    } else if (a.st === 'zap') {
      const al = 1 - a.u * 0.5;
      for (let k = 0; k < 3; k++) eldBolt(R, S, e0.x, 1.3, e0.z, e1.x, 1.3, e1.z, 9, 1.6, k ? 0.16 : 0.3, k === 2 ? C.violet : C.cyan, al, a.i * 7 + k * 13, t);
      eldBolt(R, S, e0.tx, 9.2, e0.tz, e0.x, 1.4, e0.z, 4, 0.9, 0.18, C.cyan, al, a.i + 40, t); eldBolt(R, S, e1.tx, 9.2, e1.tz, e1.x, 1.4, e1.z, 4, 0.9, 0.18, C.cyan, al, a.i + 50, t);
      R.flat.flat(a.x, 0.1, a.z, a.hw * 2 + 6, 9, a.yaw, S.glow, C.ice, 0.8 * al, true);
      R.bbs.bb(a.x, 1.6, a.z, 12, 6, S.glow, C.cyan, 0.55 * al, true);
    }
  }
  for (const j of L.jellies) {
    if (!near(j.x, j.z, 190)) continue;
    const col = j.col, sc = j.sc;
    R.bbs.bb(j.x, j.y + 0.8 * sc, j.z, 7 * sc, 7 * sc, S.glow, col, j.st === 'drift' ? 0.32 : 0.6, true);
    R.flat.flat(j.gx, 0.07, j.gz, 6 * sc, 6 * sc, 0, S.glow, col, 0.25, true);
    if (j.st === 'warn') {
      const fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 18)), r = lerp(ELD_JELLY.R0, ELD_JELLY.R, j.u);
      R.flat.flat(j.gx, 0.11, j.gz, r * 2, r * 2, t, S.ring, col, 0.95 * fl, true);
      R.flat.flat(j.gx, 0.1, j.gz, ELD_JELLY.R * 2, ELD_JELLY.R * 2, 0, S.ring, C.white, 0.55, true);
      R.flat.flat(j.gx, 0.09, j.gz, ELD_JELLY.R * 2, ELD_JELLY.R * 2, 0, S.glow, col, 0.3 * j.u, true);
      R.bbs.bb(j.x, j.y + 0.7 * sc, j.z, 3 * sc, 3 * sc, S.core, C.white, 0.5 + 0.5 * fl, true);
      if (eldH(Math.floor(t * 20) + j.i) > 0.5) eldBolt(R, S, j.x, j.y, j.z, j.gx + (eldH(t * 7 + j.i) - 0.5) * 4, 0.3, j.gz + (eldH(t * 9 + j.i) - 0.5) * 4, 4, 1.0, 0.12, col, 0.7, j.i * 5, t);
    } else if (j.st === 'sting') {
      const al = 1 - j.u * 0.6;
      for (let k = 0; k < 5; k++) { const a2 = k / 5 * TAU + t * 3; eldBolt(R, S, j.x, j.y - 0.5, j.z, j.gx + Math.cos(a2) * ELD_JELLY.R * 0.8, 0.2, j.gz + Math.sin(a2) * ELD_JELLY.R * 0.8, 5, 1.0, 0.16, col, al, j.i * 9 + k, t); }
      R.flat.flat(j.gx, 0.12, j.gz, ELD_JELLY.R * 2.4, ELD_JELLY.R * 2.4, 0, S.glow, C.white, 0.85 * al, true);
      R.flat.flat(j.gx, 0.13, j.gz, ELD_JELLY.R * 2 * (1 + j.u * 0.4), ELD_JELLY.R * 2 * (1 + j.u * 0.4), 0, S.ring, col, al, true);
    }
  }
  for (const e of L.eels) {
    if (!near(e.x, e.z, 200)) continue;
    const dir = -e.sd, edge = (e.sd > 0 ? e.wr : e.wl) + 2.4, far = (e.sd > 0 ? e.wl : e.wr) + 2.4;
    // the burrows' mouths glow; the one it's in glows brighter while it's coming
    for (const sd of [1, -1]) { const d = sd * ((sd > 0 ? e.wr : e.wl) + 2.4), hot = e.st === 'warn' && sd === e.sd; R.bbs.bb(e.x + e.nx * d, 1.4, e.z + e.nz * d, hot ? 6 : 3.4, hot ? 6 : 3.4, S.glow, C.volt, hot ? 0.9 : 0.35, true); }
    if (e.st === 'warn') {
      // the lane it will take flashes across the road, arrows point the way
      const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 20));
      R.flat.flat(e.x, 0.09, e.z, (edge + far), 4.2, e.yaw, S.square, C.volt, 0.38 * fl, true);
      for (let i = 0; i < 6; i++) { const u = (i / 6 + t * 1.3) % 1, dd = e.sd * edge + dir * u * (edge + far); R.flat.flat(e.x + e.nx * dd, 0.11, e.z + e.nz * dd, 3.6, 3.6, Math.atan2(e.nx * dir, e.nz * dir), S.arrow, C.white, 0.95 * fl, true); }
      for (const sd of [-1, 1]) R.flat.flat(e.x + e.tx * sd * 2.4, 0.1, e.z + e.tz * sd * 2.4, edge + far, 0.4, e.yaw, S.square, C.volt, 0.85 * fl, true);
    } else if (e.st === 'cross') {
      // sparks crawl along the body, its glow on the road
      for (let jj = 0; jj < ELD_EEL_N; jj += 2) { const o = e.segs[jj]; if (!o || !o.visible) continue; R.flat.flat(o.x, 0.08, o.z, 4, 4, 0, S.glow, C.volt, 0.4, true); if (eldH(Math.floor(t * 14) + jj + e.i * 20) > 0.55) R.bbs.bb(o.x, o.y + 1.4, o.z, 1.8, 1.8, S.spark, C.ice, 0.9, true); }
      const h = e.segs[0]; if (h && h.visible) R.bbs.bb(h.x, 1.2, h.z, 4, 4, S.glow, C.volt, 0.6, true);
    }
  }
  const U = L.tube;
  if (near(U.hoops[0].x, U.hoops[0].z, 200) || near(U.hoops[U.hoops.length - 1].x, U.hoops[U.hoops.length - 1].z, 200)) {
    const n = U.hoops.length;
    for (let i = 0; i < n; i++) {
      const h = U.hoops[i], lit = U.st === 'warn' ? (U.u * (n + 2) > i ? 1 : 0.15) : U.st === 'surge' ? 0.8 + 0.2 * Math.sin(t * 12 - i) : 0.15;
      R.bbs.bb(h.x, h.top, h.z, 5, 5, S.glow, C.cyan, 0.5 * lit, true);
    }
    if (U.st === 'warn') {
      const fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 16));
      for (let i = 0; i < 8; i++) { const sv = U.s0 + ((i / 8 + t * 0.8) % 1) * (U.s1 - U.s0), g = T.at(sv, ELD_T.at2); R.flat.flat(g.x, 0.11, g.z, 5, 5, g.yaw, S.arrow, C.cyan, 0.9 * fl, true); }
    } else if (U.st === 'surge') {
      // the current: streaks rushing forward through the tube, a cyan wash on the road
      const al = Math.min(1, U.u * 8, (1 - U.u) * 6);
      for (let i = 0; i < 16; i++) { const sv = U.s0 + ((eldH(i * 3.3) + t * 0.9) % 1) * (U.s1 - U.s0), g = T.at(sv, ELD_T.at2), d = (eldH(i * 7.1) - 0.5) * g.hw * 1.6, y = 0.8 + eldH(i * 1.9) * 5; R.bbs.streak(g.x + g.nx * d, y, g.z + g.nz * d, g.tx, 0, g.tz, 7, 0.45, S.streak, i % 3 ? C.cyan : C.white, 0.7 * al); }
      for (let sv = U.s0; sv < U.s1; sv += 10) { const g = T.at(sv, ELD_T.at2); R.flat.flat(g.x, 0.09, g.z, g.hw * 2, 10, g.yaw, S.glow, C.cyan, 0.3 * al, true); }
    }
  }
  // Jelly Jolt's halo and the sparks in her crown
  { const J = L.jolt, o = J.obj; if (o && near(J.x, J.z, 320)) { R.bbs.bb(J.x, o.y + 4, J.z, 46, 46, S.glow, C.cyan, 0.38, true); if (eldH(Math.floor(t * 6)) > 0.5) eldBolt(R, S, J.x, o.y + 11, J.z, J.x + (eldH(t) - 0.5) * 14, o.y + 18, J.z + (eldH(t * 2) - 0.5) * 14, 5, 2.4, 0.3, C.volt, 0.9, 77, t); } }
  // smoke over the vents
  for (const v of s.E.eld.vents) if (near(v[0], v[1], 140)) for (let i = 0; i < 3; i++) { const u = (t * 0.25 + i / 3) % 1; R.bbs.bb(v[0] + Math.sin(t * 0.7 + i) * u * 2, v[2] + 1 + u * 14, v[1], 4 + u * 7, 4 + u * 7, S.smoke, [0.12, 0.1, 0.12], 0.55 * (1 - u), false); }
  // marine snow: specks drifting slowly down through the light round the camera (no state: a wrapped box)
  for (let i = 0; i < 70; i++) {
    const bx = 70, by = 24, ox = eldH(i * 1.31) * bx, oz = eldH(i * 2.77) * bx, oy = eldH(i * 4.13) * by;
    const x = cam.x - bx / 2 + ((((ox + t * (eldH(i * 5.9) - 0.5) * 1.2 - cam.x) % bx) + bx) % bx), z = cam.z - bx / 2 + ((((oz + t * 0.3 - cam.z) % bx) + bx) % bx), y = ((((oy - t * 0.5) % by) + by) % by);
    R.bbs.bb(x, y + 0.3, z, 0.22, 0.22, S.dot, i % 5 ? C.snow : C.cyan, 0.75, true);
  }
}

if (typeof window !== 'undefined') setTimeout(() => {
  // hazard screenshots (tools/cart_track_test.js reads debug.trackShots.electricdeep) and the live state
  const C = window.BRADY_CART; if (!C || !C.debug) return;
  const D = C.debug, NAMES = ['arc-warn', 'arc', 'tube', 'jelly-warn', 'jelly', 'eel-warn', 'eel', 'jolt'];
  D.trackShots = D.trackShots || {};
  D.trackShots.electricdeep = { list: () => NAMES.map(name => ({ name })), shot: name => eldShot(D, name) };
  D.trackLevel = D.trackLevel || {};
  D.trackLevel.electricdeep = () => {
    const s = Game.scene; if (!s || !s.eld) return null;
    const K = s.kit || {}, L = s.eld;
    return { hits: K.hits || {}, touch: K.touch || {}, fired: K.fired || {}, L: s.T ? +s.T.L.toFixed(1) : 0, arcs: L.arcs.map(a => a.st), jellies: L.jellies.map(j => j.st), eels: L.eels.map(e => e.st), tube: L.tube.st };
  };
}, 0);
function eldShot(D, name) {
  const STEP = 1 / 60;
  D.start({ mode: 'quick', track: 'electricdeep', car: 'jelly', driver: 'brady', seed: 9, autoGas: true });
  const s = D.scene(); s.state = 'race'; s.stateT = 0; window.BRADY.Input.setMode('game'); s.layoutControls(); s.update(STEP);
  const L = s.eld, T = s.T, P = s.player;
  let pin = null; const pins = [];
  const park = (sv, lat, speed, frozen) => { const g = T.at(sv, {}); D.place(-1, g.x + g.nx * g.hw * lat, g.z + g.nz * g.hw * lat, g.yaw, { speed: speed || 0, frozen: false }); P.prevS = P.loc.s; P.lap = 1; P.prog = P.loc.s; pin = frozen ? { x: P.x, z: P.z, yaw: P.yaw } : null; };
  const rivals = list => { let j = 0; for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = list[j++] || [-300 - j * 12, 0, 1]; const g = T.at(P.loc.s + r[0], {}); D.place(i, g.x + g.nx * g.hw * r[1], g.z + g.nz * g.hw * r[1], g.yaw, { speed: r[2] ? 0 : 18, frozen: false }); if (r[2]) pins.push({ k, x: k.x, z: k.z, yaw: k.yaw }); k.prevS = k.loc.s; k.lap = 1; k.prog = k.loc.s; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } k.wpn.t = 99; } };
  s.autoDrive = true; if (!P.ai) s.aiInput(P, STEP, true); P.ai.itemT = 99; P.ai.fireT = 99; P.wpn.t = 99;
  const hold = () => { if (pin) { P.x = pin.x; P.z = pin.z; P.yaw = pin.yaw; P.vx = P.vz = 0; } for (const q of pins) { q.k.x = q.x; q.k.z = q.z; q.k.yaw = q.yaw; q.k.vx = q.k.vz = 0; } };
  const wait = (fn, secs) => { for (let i = 0; i < secs * 60; i++) { s.update(STEP); hold(); if (fn()) return true; } return false; };
  let ok = true;
  if (name === 'arc-warn' || name === 'arc') { const a = L.arcs[1]; park(a.s - 16, 0.15, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'arc-warn' ? a.st === 'warn' && a.u > 0.75 : a.st === 'zap' && a.u > 0.2, 10); }
  else if (name === 'tube') { park(L.tube.s0 - 6, 0.1, 0, true); rivals([[14, 0.3, 1], [24, -0.3, 1], [-40, 0, 1]]); ok = wait(() => L.tube.st === 'surge' && L.tube.u > 0.3, 10); }
  else if (name === 'jelly-warn' || name === 'jelly') { const j = L.jellies[2]; ok = wait(() => j.st === (name === 'jelly' ? 'sting' : 'warn') && (name === 'jelly' ? j.u > 0.3 : j.u > 0.6), 12); const sv = CartKit.sOf(T, j.gx, j.gz); park(sv - 17, 0, 0, true); rivals([[-50, 0, 1]]); s.update(STEP); hold(); }
  else if (name === 'eel-warn' || name === 'eel') { const e = L.eels[0]; park(e.s - 18, 0.2, 0, true); rivals([[-50, 0, 1]]); ok = wait(() => name === 'eel-warn' ? e.st === 'warn' && e.t > 0.9 : e.st === 'cross' && e.segs[5] && e.segs[5].visible && Math.abs(e.d) < 4, 16); }
  else if (name === 'jolt') { park(CartKit.sOf(T, -162, 70), 0.2, 0, true); P.yaw += 0.9; pin.yaw = P.yaw; rivals([[10, 0.3, 1], [16, -0.3, 1]]); wait(() => false, 0.5); }
  s.snapCam = true; for (let i = 0; i < 4; i++) { D.step(1, 1); hold(); }
  return { ok, draws: s.stats.draws, tris: s.stats.tris, hits: (s.kit || {}).hits, touch: (s.kit || {}).touch, p: [+P.x.toFixed(1), +P.z.toFixed(1), +P.loc.s.toFixed(1)] };
}
