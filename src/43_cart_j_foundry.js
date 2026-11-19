/* ============================================================
   ART CART — THE FOUNDRY, Calamari Inferno's career track (Nov 19 2026; recipe: docs/ART_CART_LEVEL_RECIPE.md).
   A night foundry of copper pipes and furnaces with a fire garden out the back, one lap of about 1.1 km:
     THE OCTOPUS GATE  the start: two giant copper tentacles arch over the road under a riveted octopus head
     FURNACE ROW       the start straight between glowing furnaces under copper pipe bridges; four FIRE JETS in the
                       furnace walls blast flame across the road in turn: the port glows and the road lights up a
                       lane of chaser lights (1.25 s), then a jet covers ~60% of the road from its side. Left-side
                       and right-side jets alternate: weave to the open lane, or time it
     THE BELLOWS BEND  a pair of giant leather BELLOWS on the climb north: the bag swells and arrows stream across
                       the road (1.6 s), then a gust of HOT AIR rolls over the road and shoves cars toward the far
                       wall (pass while it breathes in, or brace on the bellows side and take it late)
     THE PIPEWORKS     a tight zig-zag under gantry cranes: three LADLES of molten copper trundle over the road,
                       aim at an oncoming car's line (a closing ring on the road, 1.5 s), tip and pour: the stream
                       and the glowing puddle it leaves spin you out (steer off the glow, or HOP over the puddle)
     THE FIRE GARDEN   a wide sweeper through copper fire-flowers and fire pits; FLAME TORNADOES spin up in a pit
                       (a swirl on the ground, 1.4 s) and wander across the road and back (go round them)
     THE PIPE TUNNEL   copper pipe arches and a boost pad, back round to the gate
   Calamari Inferno's TENTACLE TOSS is in everyone's gift boxes here (CART_TRACKS.foundry.car = 'octo').
   Start it without the menus: BRADY_CART.debug.start({ mode: 'career', track: 'foundry' }) (or mode 'quick').
   Globals FDY_*, state on s.fdy, world data on E.fdy. Everything here is an original design.
   ============================================================ */
const FDY_C = { orange: [1, 0.48, 0.1], hot: [1, 0.3, 0.06], yellow: [1, 0.86, 0.35], white: [1, 1, 1], cream: [1, 0.95, 0.8], copper: [0.95, 0.55, 0.28], warn: [1, 0.62, 0.12], black: [0, 0, 0], red: [1, 0.16, 0.05], crust: [0.42, 0.1, 0.04], air: [1, 0.9, 0.75] };
const FDY_PAL = ['#c8743a', '#ff6a2a', '#e8a060', '#3a302c', '#ffb050'];
const FDY_T = { at: {}, at2: {} };
const fdySm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ---------------- the course ---------------- */
// corners [x, z, radius]: furnace row (south, east-bound), the bellows climb (east), the pipeworks zig-zag, the fire
// garden sweeper (north, west-bound), the pipe tunnel (west, south-bound), the hook back to the gate
const FDY_POLY = [[-170, -40, 38], [130, -40, 40], [205, 40, 30], [180, 150, 24], [100, 128, 16], [70, 196, 18], [-40, 212, 48], [-140, 160, 30], [-112, 70, 20], [-200, 40, 28]];
// the fire garden is wider (room to go round the tornadoes)
const fdyWidth = (x, z) => 1 + 0.22 * fdySm(170, 188, z) * fdySm(78, 58, x) * fdySm(-150, -128, x);
// the registries (this file sorts before the kit: assign, never redeclare with const / let)
var CART_TRACK_RULES = (typeof CART_TRACK_RULES !== 'undefined' && CART_TRACK_RULES) || {};
var CART_CAREER_TRACKS = (typeof CART_CAREER_TRACKS !== 'undefined' && CART_CAREER_TRACKS) || {};
CART_TRACKS.foundry = {
  name: 'THE FOUNDRY', car: 'octo', tod: 'night', music: 'kart4', width: 20, shoulder: 6, theme: 'foundry', blurb: 'Fire jets, molten copper and flame tornadoes',
  get pts() { return this._pts || (this._pts = CartKit.course(FDY_POLY, { start: [-50, -40], width: fdyWidth, step: 18 })); },   // lazy: the kit (43_cart_j_kit.js) loads after this file
  world: (id, D) => fdyWorld(id, D)
};
CART_CAREER_TRACKS.octo = 'foundry';

/* ---------------- static pieces (merged into the world's chunks) ---------------- */
// the octopus gate (local x across the road, z along it; cars come from -z): two tentacles rise from the roadside and
// curl over the road under the head. W = span between the tentacle roots. Lowest point over the road ≥ 9 m.
function fdyGate(m, W) {
  const H = 15.5, lights = [], N = 22;
  for (const sd of [-1, 1]) {
    const P = []; for (let i = 0; i <= N; i++) { const a = i / N * Math.PI / 2; P.push([sd * (4.5 + (W / 2 - 4.5) * Math.pow(Math.cos(a), 0.7)), H * Math.sin(a)]); }
    // the tip curls up and back out beside the head
    for (let i = 1; i <= 8; i++) { const th = i / 8 * 1.7 * Math.PI, rad = 1.5 - i * 0.08; P.push([sd * (4.5 - Math.sin(th) * rad), H + 1.5 - Math.cos(th) * rad]); }
    m.color('#b8642e').shine(3);
    for (let i = 0; i < P.length - 1; i++) { const u = i / (P.length - 1), r0 = lerp(1.35, 0.3, u), r1 = lerp(1.35, 0.3, (i + 1) / (P.length - 1)); m.limb(P[i][0], P[i][1], 0, P[i + 1][0], P[i + 1][1], 0, r0, r1, { seg: 9, ends: i === 0 }); }
    // suckers along the inner side, cream with a glowing ring
    m.shine(1);
    for (let i = 1; i < N; i += 2) { const u = i / (P.length - 1), r = lerp(1.35, 0.3, u), dx = P[i + 1][0] - P[i - 1][0], dy = P[i + 1][1] - P[i - 1][1], l = Math.hypot(dx, dy) || 1, ix = -dy / l * sd, iy = dx / l * sd; m.color('#f0c8a0'); m.ball(P[i][0] - ix * r * 0.75, P[i][1] - iy * r * 0.75, 0, r * 0.42, { seg: 8, rings: 5 }); }
    m.color('#ff8a3a', 1); for (let i = 3; i < N; i += 4) { const u = i / (P.length - 1), r = lerp(1.35, 0.3, u); m.push(); m.tf(P[i][0], P[i][1], 0, 0, 0, Math.atan2(P[i + 1][1] - P[i - 1][1], P[i + 1][0] - P[i - 1][0]) - Math.PI / 2); m.torus(0, 0, 0, r + 0.04, 0.07, { seg: 14, tseg: 3 }); m.pop(); lights.push({ x: P[i][0], y: P[i][1], z: 0.8, s: 0.9, c: '#ff8a3a' }); }
    m.emissive(0);
    // the root: a riveted iron collar on a brick plinth
    m.color('#3a2a26').shine(1); m.roundBox(sd * W / 2, 0.6, 0, 3.4, 1.2, 3.4, 0.3); m.color('#8a4a28').shine(3); m.torus(sd * W / 2, 1.4, 0, 1.45, 0.22, { seg: 18, tseg: 5 }); m.shine(0);
  }
  // the head: a riveted copper mantle, big eyes facing the cars, a glowing furnace grin
  m.push(); m.tf(0, H + 3.4, 0, 0, 0.25, 0);
  m.color('#c06a30').shine(3); m.ellipsoid(0, 0, 0.4, 3.3, 4.0, 3.5, { seg: 22, rings: 14 }); m.ellipsoid(0, -2.6, -0.3, 3.4, 1.8, 3.2, { seg: 20, rings: 8 });
  m.color('#e8a060').shine(2); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; m.ball(Math.sin(a) * 3.38, -1.0, 0.4 + Math.cos(a) * 3.55, 0.14, { seg: 6, rings: 4 }); m.ball(Math.sin(a) * 2.6, 1.9, 0.4 + Math.cos(a) * 2.75, 0.12, { seg: 6, rings: 4 }); }
  for (const sx of [-1.35, 1.35]) { m.color('#fff4e0').shine(3); m.ball(sx, -1.9, -2.7, 1.05, { seg: 14, rings: 10 }); m.color('#ff7a1a', 1); m.ball(sx, -1.9, -3.55, 0.55, { seg: 10, rings: 7 }); m.color('#1a0a06', 0); m.ball(sx, -1.9, -3.9, 0.28, { seg: 8, rings: 5 }); }
  m.color('#ffb040', 1); m.push(); m.tf(0, -3.25, -2.9, 0, 0.3, 0); m.ellipsoid(0, 0, 0, 1.3, 0.32, 0.35, { seg: 12, rings: 6 }); m.pop(); m.emissive(0).shine(0);
  m.pop();
  lights.push({ x: -1.35, y: H + 1.5, z: -3.7, s: 2.2, c: '#ff7a1a' }, { x: 1.35, y: H + 1.5, z: -3.7, s: 2.2, c: '#ff7a1a' });
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 1.7, y0: 0, y1: 4, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: 1.7, y0: 0, y1: 4, camPass: true }], lights };
}
// a furnace facing +z (the road): a brick kiln with copper bands, a glowing mouth, a chimney
function fdyFurnace(m) {
  m.color('#6a3a2a').shine(0); m.lathe([[4.6, 0], [4.7, 2.6], [4.2, 5.2], [3.0, 6.9], [1.4, 7.6], [0, 7.7]], { seg: 22 });
  m.color('#b8642e').shine(3); m.torus(0, 2.6, 0, 4.72, 0.2, { seg: 28, tseg: 4 }); m.torus(0, 5.2, 0, 4.24, 0.18, { seg: 26, tseg: 4 }); m.shine(0);
  // the mouth: an arched opening with a white-hot core
  m.push(); m.tf(0, 0, 4.0, 0, 0, 0); m.color('#1a0a06'); m.roundBox(0, 1.7, 0.45, 3.2, 3.4, 0.8, 0.5); m.color('#ff7a1a', 1); m.roundBox(0, 1.5, 0.62, 2.6, 2.8, 0.6, 0.45); m.color('#ffe0a0', 1); m.roundBox(0, 1.3, 0.7, 1.6, 1.8, 0.5, 0.4); m.emissive(0);
  m.color('#3a2a26').shine(2); m.roundBox(0, 3.6, 0.65, 3.8, 0.5, 1.2, 0.2); m.pop(); m.shine(0);
  // chimney: dark iron with a glowing rim
  m.color('#2a2220').shine(1); m.cyl(1.4, 6.6, -1.2, 0.9, 0.75, 7.5, 14); m.color('#ff6a2a', 1); m.torus(1.4, 14.1, -1.2, 0.78, 0.12, { seg: 16, tseg: 3 }); m.emissive(0).shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 4.7, y0: 0, y1: 7.7 }], lights: [{ x: 0, y: 1.6, z: 4.9, s: 3.2, c: '#ff7a1a' }, { x: 1.4, y: 14.2, z: -1.2, s: 1.4, c: '#ff6a2a' }] };
}
// a fire-jet port at the roadside, nozzle pointing +z across the road: a riveted copper housing fed by a pipe
function fdyPort(m) {
  m.color('#2a2220').shine(1); m.roundBox(0, 0.7, -0.4, 1.8, 1.4, 1.8, 0.2);
  m.color('#b8642e').shine(3); m.push(); m.tf(0, 1.25, 0.3, 0, Math.PI / 2, 0); m.lathe([[0.42, 0], [0.42, -0.9], [0.62, -1.3], [0.7, -1.45], [0.5, -1.45]], { seg: 16 }); m.pop();
  m.color('#ff6a2a', 1); m.push(); m.tf(0, 1.25, 1.76, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.62, 0.07, { seg: 16, tseg: 3 }); m.pop(); m.emissive(0);
  m.color('#b8642e').shine(3); m.limb(0, 0.9, -1.3, 0, 0.9, -3.8, 0.32, 0.32, { seg: 10 });
  m.push(); m.tf(0, 2.0, -0.6, 0, 0, 0); m.color('#d84a2a').shine(2); m.torus(0, 0, 0, 0.45, 0.06, { seg: 14, tseg: 3 }); m.limb(-0.45, 0, 0, 0.45, 0, 0, 0.04, 0.04, { seg: 4 }); m.limb(0, 0, -0.45, 0, 0, 0.45, 0.04, 0.04, { seg: 4 }); m.pop(); m.shine(0);
  // hazard stripes on the housing's face
  for (let i = 0; i < 4; i++) { m.color(i % 2 ? '#1a1410' : '#ffb020', i % 2 ? 0 : 0.4); m.box(-0.66 + i * 0.44, 0.25, 0.52, 0.44, 0.3, 0.04); } m.emissive(0);
  return { cols: [{ t: 'box', x: 0, z: -0.4, hx: 0.9, hz: 0.9, y0: 0, y1: 1.6 }], lights: [{ x: 0, y: 1.25, z: 1.8, s: 0.8, c: '#ff6a2a' }] };
}
// a copper pipe bridge over the road (local x across): legs at ±W/2, two pipes at 10.5 and 11.5 m with flanges
function fdyPipeBridge(m, W) {
  m.color('#b8642e').shine(3);
  for (const sd of [-1, 1]) { m.limb(sd * W / 2, 0, 0, sd * W / 2, 10.5, 0, 0.55, 0.55, { seg: 12 }); m.limb(sd * W / 2, 0, 1.2, sd * W / 2, 11.5, 1.2, 0.4, 0.4, { seg: 10 }); m.ball(sd * W / 2, 10.5, 0, 0.6, { seg: 12, rings: 8 }); m.ball(sd * W / 2, 11.5, 1.2, 0.45, { seg: 10, rings: 6 }); }
  m.limb(-W / 2, 10.5, 0, W / 2, 10.5, 0, 0.55, 0.55, { seg: 12, ends: false }); m.limb(-W / 2, 11.5, 1.2, W / 2, 11.5, 1.2, 0.4, 0.4, { seg: 10, ends: false });
  m.color('#8a4a28'); for (let x = -W / 2 + 3; x < W / 2 - 1; x += 4) { m.push(); m.tf(x, 10.5, 0, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.6, 0.12, { seg: 14, tseg: 3 }); m.pop(); m.push(); m.tf(x + 2, 11.5, 1.2, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.45, 0.1, { seg: 12, tseg: 3 }); m.pop(); }
  m.shine(0);
  // a glowing seam band under the pipes (reads the bridge at night)
  m.color('#ff8a3a', 1); m.limb(-W / 2 + 1, 9.85, 0, W / 2 - 1, 9.85, 0, 0.08, 0.08, { seg: 4, ends: false }); m.emissive(0);
  for (const sd of [-1, 1]) { m.color('#3a2a26').shine(1); m.roundBox(sd * W / 2, 0.4, 0.6, 1.8, 0.8, 2.6, 0.2); m.shine(0); }
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0.6, r: 0.9, y0: 0, y1: 12, camPass: true }, { t: 'cyl', x: W / 2, z: 0.6, r: 0.9, y0: 0, y1: 12, camPass: true }], lights: [{ x: -W / 4, y: 9.8, z: 0, s: 1.6, c: '#ff8a3a' }, { x: W / 4, y: 9.8, z: 0, s: 1.6, c: '#ff8a3a' }] };
}
// a bellows' base (facing +z, the road): a timber bed on iron feet, the copper nozzle at the front
function fdyBellowsBase(m) {
  const wd = BURNS_ATLAS.pattern('wood');
  m.color('#3a2a26').shine(1); for (const sx of [-1.6, 1.6]) for (const sz of [-2.2, 2.2]) m.roundCyl(sx, 0, sz, 0.3, 0.7, 0.08); m.shine(0);
  m.color('#8a5a3a'); m.roundBox(0, 0.85, 0, 4.2, 0.36, 6.0, 0.12, { uv: wd });
  m.color('#b8642e').shine(3); m.push(); m.tf(0, 1.3, 3.0, 0, Math.PI / 2, 0); m.lathe([[1.0, 0], [0.7, -1.0], [0.35, -2.2], [0.3, -2.4]], { seg: 16 }); m.pop();
  m.color('#ff6a2a', 1); m.push(); m.tf(0, 1.3, 5.4, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.32, 0.06, { seg: 12, tseg: 3 }); m.pop(); m.emissive(0);
  m.color('#2a2220'); for (const sx of [-2.2, 2.2]) m.limb(sx, 0.9, -2.9, sx, 3.6, -2.9, 0.12, 0.1, { seg: 6 }); m.limb(-2.2, 3.6, -2.9, 2.2, 3.6, -2.9, 0.1, 0.1, { seg: 6 }); m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0.5, hx: 2.2, hz: 3.4, y0: 0, y1: 3.4 }], lights: [{ x: 0, y: 1.3, z: 5.5, s: 0.8, c: '#ff6a2a' }] };
}
// a gantry crane over the road (local x across): A-frame legs at ±W/2, a striped beam at 14 m, a lamp under it
function fdyGantry(m, W) {
  m.color('#2e2826').shine(2);
  for (const sd of [-1, 1]) { for (const sz of [-1.8, 1.8]) m.limb(sd * W / 2, 0, sz, sd * W / 2, 14, sz * 0.3, 0.32, 0.26, { seg: 8 }); m.limb(sd * W / 2, 5, -1.3, sd * W / 2, 5, 1.3, 0.14, 0.14, { seg: 6 }); m.limb(sd * W / 2, 9.5, -0.9, sd * W / 2, 9.5, 0.9, 0.12, 0.12, { seg: 6 }); m.color('#3a2a26').shine(1); m.roundBox(sd * W / 2, 0.35, 0, 2.2, 0.7, 4.6, 0.2); m.color('#2e2826').shine(2); }
  m.roundBox(0, 14.3, 0, W + 1.2, 1.1, 1.1, 0.12);
  for (let x = -W / 2, i = 0; x < W / 2; x += 1.6, i++) { m.color(i % 2 ? '#1a1410' : '#ffb020', i % 2 ? 0 : 0.35); m.box(x + 0.8, 14.3, 0.57, 1.6, 0.9, 0.04); m.box(x + 0.8, 14.3, -0.57, 1.6, 0.9, 0.04); } m.emissive(0);
  m.color('#8a8a92').shine(3); m.limb(-W / 2 + 0.6, 13.6, 0, W / 2 - 0.6, 13.6, 0, 0.1, 0.1, { seg: 5, ends: false }); m.shine(0);
  m.color('#ffd080', 1); for (const sd of [-1, 1]) m.roundBox(sd * W / 4, 13.65, 0, 0.6, 0.12, 0.6, 0.05); m.emissive(0);
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 1.3, y0: 0, y1: 14, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: 1.3, y0: 0, y1: 14, camPass: true }], lights: [{ x: -W / 4, y: 13.5, z: 0, s: 1.8, c: '#ffd080' }, { x: W / 4, y: 13.5, z: 0, s: 1.8, c: '#ffd080' }] };
}
// a fire pit beside the fire garden road: a ring of stones round glowing coals (the flames are a world fire)
function fdyPit(m) {
  m.color('#4a3a34').shine(1); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; m.ellipsoid(Math.sin(a) * 2.1, 0.35, Math.cos(a) * 2.1, 0.75, 0.5, 0.6, { seg: 8, rings: 5 }); } m.shine(0);
  m.color('#ff4a12', 0.9); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.3; m.ball(Math.sin(a) * 0.9, 0.2, Math.cos(a) * 0.9, 0.42, { seg: 7, rings: 4 }); } m.color('#ffb040', 1); m.ball(0, 0.25, 0, 0.6, { seg: 8, rings: 5 }); m.emissive(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.4, y0: 0, y1: 0.8 }], lights: [{ x: 0, y: 0.6, z: 0, s: 2.6, c: '#ff6a1a' }] };
}
// a copper pipe arch over the road (local x across): legs to 6 m, a semicircle on top (lowest point over road ≥ 9 m)
function fdyPipeArch(m, W, col) {
  const R = W / 2, N = 18;
  m.color(col).shine(3);
  for (const sd of [-1, 1]) m.limb(sd * R, 0, 0, sd * R, 6, 0, 0.5, 0.5, { seg: 10 });
  for (let i = 0; i < N; i++) { const a0 = i / N * Math.PI, a1 = (i + 1) / N * Math.PI; m.limb(Math.cos(a0) * R, 6 + Math.sin(a0) * R * 0.62, 0, Math.cos(a1) * R, 6 + Math.sin(a1) * R * 0.62, 0, 0.5, 0.5, { seg: 10, ends: i === 0 }); }
  m.color('#8a4a28'); for (let i = 2; i < N; i += 4) { const a = i / N * Math.PI; m.push(); m.tf(Math.cos(a) * R, 6 + Math.sin(a) * R * 0.62, 0, 0, 0, a); m.torus(0, 0, 0, 0.56, 0.12, { seg: 14, tseg: 3 }); m.pop(); }
  m.shine(0); m.color('#ff8a3a', 1); for (let i = 1; i < N; i += 3) { const a = i / N * Math.PI; m.ball(Math.cos(a) * R, 6 + Math.sin(a) * R * 0.62 - 0.55, 0, 0.16, { seg: 6, rings: 4 }); } m.emissive(0);
  return { cols: [{ t: 'cyl', x: -R, z: 0, r: 0.7, y0: 0, y1: 7, camPass: true }, { t: 'cyl', x: R, z: 0, r: 0.7, y0: 0, y1: 7, camPass: true }] };
}

/* ---------------- instanced props (this world only) ---------------- */
const FDY_KINDS = {
  // a bundle of copper pipes rising out of the ground with elbows, a valve wheel and a gauge (tinted)
  fdy_pipes: { r: 2.4, near: 34, mid: 120, farD: 320, glows: [[0, 4.6, 0.3, 0.9]], pool: 6,
    build(m, o) {
      m.color('#ffffff').shine(3);
      for (const [x, h] of [[-0.9, 4.2], [0, 5.4], [0.9, 3.4]]) { m.limb(x, 0, 0, x, h, 0, 0.32, 0.32, { seg: m.lo ? 7 : 10 }); m.ball(x, h, 0, 0.34, { seg: 8, rings: 5 }); m.limb(x, h, 0, x, h, 1.2, 0.32, 0.32, { seg: m.lo ? 7 : 10 }); m.torus(x, 1.2, 0, 0.4, 0.09, { seg: 10, tseg: 3 }); }
      m.shine(2); m.color('#d84a2a'); m.push(); m.tf(0, 2.6, 0.42, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.5, 0.06, { seg: 14, tseg: 3 }); m.pop(); m.limb(-0.5, 2.6, 0.42, 0.5, 2.6, 0.42, 0.04, 0.04, { seg: 4 });
      m.color('#f4ecd8', 0.3); m.push(); m.tf(0.9, 2.2, 0.35, 0, Math.PI / 2, 0); m.disc(0, 0, 0, 0.26, 12); m.pop(); m.emissive(0);
      m.color('#ff8a3a', o.night ? 1 : 0.3); m.ball(0, 4.6, 0.3, 0.12, { seg: 6, rings: 4 }); m.emissive(0).shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.3, hz: 0.5, y0: 0, y1: 5 }] };
    },
    far(m, o) { m.color('#ffffff'); m.box(-0.9, 2.1, 0, 0.6, 4.2, 0.6); m.box(0, 2.7, 0, 0.6, 5.4, 0.6); m.box(0.9, 1.7, 0, 0.6, 3.4, 0.6); m.color('#ff8a3a', o.night ? 1 : 0.3); m.box(0, 4.6, 0.3, 0.25, 0.25, 0.25); m.emissive(0); } },
  // a fire flower: an iron stem, copper leaves, six copper petals round a burning bulb (tinted petals)
  fdy_flower: { r: 1.6, near: 34, mid: 120, farD: 300, glows: [[0, 3.9, 0, 1.8]], pool: 6,
    build(m, o) {
      m.color('#2a2220').shine(1); m.limb(0, 0, 0, 0.2, 2.2, 0, 0.12, 0.09, { seg: 6 }); m.limb(0.2, 2.2, 0, 0, 3.6, 0, 0.09, 0.08, { seg: 6 });
      m.color('#ffffff').shine(3); for (const sd of [-1, 1]) { m.push(); m.tf(sd * 0.35, 1.3 + (sd + 1) * 0.3, 0, 0, 0, sd * 0.9); m.ellipsoid(0, 0, 0, 0.55, 0.06, 0.22, { seg: 8, rings: 4 }); m.pop(); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; m.push(); m.tf(Math.sin(a) * 0.45, 3.75, Math.cos(a) * 0.45, a, 0.75, 0); m.ellipsoid(0, 0, 0.25, 0.26, 0.06, 0.55, { seg: m.lo ? 6 : 9, rings: 4 }); m.pop(); }
      m.shine(0); m.color('#ffb040', o.night ? 1 : 0.6); m.ball(0, 3.9, 0, 0.32, { seg: 9, rings: 6 }); m.color('#ff5a1a', o.night ? 1 : 0.6); m.push(); m.tf(0, 4.2, 0); m.lathe([[0.28, 0], [0.18, 0.35], [0, 0.75]], { seg: 8 }); m.pop(); m.emissive(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.3, y0: 0, y1: 3, camPass: true }] };
    },
    far(m, o) { m.color('#2a2220'); m.box(0, 1.8, 0, 0.18, 3.6, 0.18); m.color('#ffffff'); m.ball(0, 3.8, 0, 0.7, { seg: 6, rings: 3 }); m.color('#ffb040', o.night ? 1 : 0.6); m.ball(0, 4.1, 0, 0.35, { seg: 5, rings: 3 }); m.emissive(0); } },
  // a tall smokestack: brick-dark, copper bands, a glowing rim (the skyline of the foundry)
  fdy_stack: { r: 2.6, near: 60, mid: 200, farD: 520, glows: [[0, 22.2, 0, 3.6]], pool: 0, noAO: true,
    build(m, o) {
      m.color('#4a2e26'); m.cyl(0, 0, 0, 2.4, 1.6, 22, m.lo ? 10 : 16); m.color('#ffffff').shine(3); for (const y of [3, 9, 15, 20]) m.torus(0, y, 0, lerp(2.42, 1.62, y / 22) + 0.06, 0.16, { seg: m.lo ? 10 : 16, tseg: 3 }); m.shine(0);
      m.color('#ff6a2a', o.night ? 1 : 0.4); m.torus(0, 22, 0, 1.62, 0.2, { seg: m.lo ? 10 : 16, tseg: 3 }); m.emissive(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.4, y0: 0, y1: 22 }] };
    },
    far(m, o) { m.color('#4a2e26'); m.cyl(0, 0, 0, 2.4, 1.6, 22, 6); m.color('#ff6a2a', o.night ? 1 : 0.4); m.cyl(0, 21.6, 0, 1.7, 1.7, 0.5, 6); m.emissive(0); } },
  // a glowing copper rivet on the road edge every 5 m (the edges read at night from far away)
  fdy_stud: { r: 0.6, near: 40, mid: 140, farD: 260, noAO: true, shadow: false,
    build(m) { m.color('#ffffff', 1); m.push(); m.tf(0, 0.04, 0); m.ellipsoid(0, 0, 0, 0.2, 0.08, 0.2, { seg: 8, rings: 3 }); m.pop(); m.emissive(0); },
    far(m) { m.color('#ffffff', 1); m.box(0, 0.05, 0, 0.36, 0.08, 0.36); m.emissive(0); } }
};

/* ---------------- building the world ---------------- */
function fdyWorld(id, D) {
  const sky = Object.assign({}, BURNS_PALETTES.night, { zen: '#0a0504', hor: '#8a2c0e', fog: '#2a120c', fogD: 0.0058, haze: 0.3, sky: '#3a1c14', gnd: '#24140e', mid: '#4a1a0a', midK: 0.35, cityCol: '#ff6a2a', cityK: 0.45, key: '#ffb488', keyK: 0.55, emB: 1.75, stars: 0.4, clouds: 0.5, cloudCol: '#4a1e12', moon: [250, 30], rim: '#ff8a4a' });
  const W = CartKit.world(id, D, { worldId: 1243, night: true, sky, ground: '#6a5048', crack: 0.28,
    road: { shoulder: 'rgba(40,22,14,0.5)', band: 'rgba(36,26,24,0.92)', edge: 'rgba(255,140,60,0.95)', edgeW: 0.6, centerFn: fdyPaintCenter } });
  const { E, T, api, rng } = W;
  const sOf = (x, z) => CartKit.sOf(T, x, z);
  const S = { row0: sOf(-5, -40), bel: sOf(193, 85), pipe0: sOf(150, 142), pipe1: sOf(84, 162), garden: sOf(-40, 212), tunnel: sOf(-126, 115) };
  E.fdy = { S, jets: [], bellows: [], ladles: [], tors: [] };
  const taken = [];
  const side = (s, sd, off) => { const g = T.at(s, {}), o = sd > 0 ? g.wr + off : -g.wl - off; return { x: g.x + g.nx * o, z: g.z + g.nz * o, yaw: Math.atan2(-g.nx * sd, -g.nz * sd), g, off: o }; };
  const free = (x, z, r) => taken.every(q => Math.hypot(q[0] - x, q[1] - z) > q[2] + r) && CartWorlds.clear(T, x, z, r);

  // ---- ground paint: soot and slag specks, glowing lava cracks in the fire garden, a brick apron at the gate ----
  api.paint((ctx, P, Sc) => {
    const b = T.bounds;
    for (let i = 0; i < 520; i++) { const x = lerp(b.x0 - 70, b.x1 + 70, rng()), z = lerp(b.z0 - 70, b.z1 + 70, rng()), q = P(x, z); ctx.fillStyle = rng() < 0.6 ? `rgba(30,18,14,${0.08 + rng() * 0.12})` : `rgba(150,90,60,${0.05 + rng() * 0.08})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (1.5 + rng() * 7) * Sc, (1 + rng() * 4) * Sc, rng() * 3, 0, TAU); ctx.fill(); }
    // lava cracks: jagged glowing lines across the fire garden's ground (off the road)
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 46; i++) {
      let x = lerp(-175, 95, rng()), z = lerp(150, 262, rng()); if (!CartWorlds.clear(T, x, z, 3)) continue;
      ctx.strokeStyle = `rgba(255,${90 + Math.floor(rng() * 80)},30,${0.45 + rng() * 0.3})`; ctx.lineWidth = (0.25 + rng() * 0.45) * Sc;
      ctx.beginPath(); let q = P(x, z); ctx.moveTo(q[0], q[1]); let a = rng() * TAU;
      for (let k = 0; k < 7; k++) { a += (rng() - 0.5) * 1.4; x += Math.sin(a) * (1.5 + rng() * 3); z += Math.cos(a) * (1.5 + rng() * 3); q = P(x, z); ctx.lineTo(q[0], q[1]); }
      ctx.stroke();
    }
    // the gate apron: a brick herringbone under the octopus
    const g = T.at(0, {});
    for (let a = -16; a < 16; a += 1.2) for (let d = -g.hw - 4; d < g.hw + 4; d += 0.6) { if (Math.abs(d) < g.hw - 0.2) continue; const q = P(g.x + g.tx * a + g.nx * d, g.z + g.tz * a + g.nz * d); ctx.fillStyle = (Math.floor(a / 1.2) + Math.floor(d / 0.6)) % 2 ? 'rgba(120,50,30,0.55)' : 'rgba(90,36,24,0.55)'; ctx.fillRect(q[0] - 0.55 * Sc, q[1] - 0.25 * Sc, 1.1 * Sc, 0.5 * Sc); }
  });
  // barriers: copper and dark iron along the lap (black and ember tyres on the tight bends), lamps in ember tones
  CartKit.rails(E, T, (i, tight) => tight ? (i % 2 ? '#2a2220' : '#ff6a2a') : FDY_PAL[Math.floor(i / 2) % 3 === 2 ? 3 : Math.floor(i / 2) % 2 ? 2 : 0]);
  CartKit.lamps(E, T, ['#ff8a3a', '#ffc070', '#ff5a2a'], 36);
  CartKit.kinds(E, FDY_KINDS);
  for (let s = 0; s < T.L; s += 5) { const g = T.at(s, {}); for (const sd of [1, -1]) { const d = sd * (g.hw - 0.15); CartKit.put(E, 'fdy_stud', g.x + g.nx * d, g.z + g.nz * d, g.yaw, Math.floor(s / 5) % 3 ? '#ff7a2a' : '#ffd080', { y: 0, noLights: true }); } }

  // ---- the octopus gate, the grandstands, the crowd ----
  { const g = T.at(0, {}), Wd = g.wl + g.wr + 5;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => fdyGate(m, Wd), { hi: true, noAO: true });
    api.sign('THE FOUNDRY', g.x, g.z, { yaw: g.yaw + Math.PI, h: 1.9, y: 10.2, post: false, maxW: 9, style: { bg: '#2a120a', fg: '#ffd080', border: '#ff7a2a' }, glow: '#ff7a2a' });
    api.light(g.x, g.z, 24, '#ff7a2a', 0.6);
    for (const sd of [1, -1]) api.fire(g.x + g.nx * sd * 5.3, 17.4, g.z + g.nz * sd * 5.3, 0.7, { hazard: false });   // the tentacle tips breathe fire
    for (const sd of [1, -1]) { const p = side(-34, sd, 6); E.spots.push(...CartScene.bleachers(api, p.x, p.z, p.yaw, 20, 3, rng)); api.light(p.x, p.z, 16, '#ffb070', 0.5); taken.push([p.x, p.z, 16]); }
    const heroes = ['firespinner', 'badideaguy', 'dpw', 'crusty', 'firespinner', 'burnerkid'];
    heroes.forEach((type, i) => { const p = side(-8 + Math.floor(i / 2) * 7, i % 2 ? 1 : -1, 2.4); E.heroes.push({ type, x: p.x, z: p.z, yaw: p.yaw, anim: type === 'firespinner' ? 'firespin' : i % 3 ? 'cheer' : 'wave' }); });
    taken.push([g.x, g.z, 14]);
  }
  // ---- furnace row: four fire-jet ports, furnaces behind them, pipe bridges overhead ----
  for (let i = 0; i < 4; i++) {
    const x = -5 + i * 30, s = sOf(x, -40), sd = i % 2 ? 1 : -1, g = T.at(s, {}), wall = sd > 0 ? g.wr : g.wl, off = wall + 1.1, nx = g.nx * sd, nz = g.nz * sd;
    const px = g.x + nx * off, pz = g.z + nz * off, yaw = Math.atan2(-nx, -nz);
    CartScene.mesh(api, px, pz, yaw, fdyPort, { hi: true, noAO: true });
    const cover = 0.62, endD = g.hw * (1 - 2 * cover);   // the jet ends this far past the centre line (on the far side)
    E.fdy.jets.push({ i, s, sd, x: px - nx * 1.75, z: pz - nz * 1.75, dx: -nx, dz: -nz, tx: g.tx, tz: g.tz, reach: off - 1.75 - endD, hw: g.hw });
    const f = side(s, sd, 9.5); CartScene.mesh(api, f.x, f.z, f.yaw, fdyFurnace, { hi: true }); taken.push([f.x, f.z, 7], [px, pz, 3]);
    api.light(f.x - Math.sin(f.yaw) * -5, f.z - Math.cos(f.yaw) * -5, 14, '#ff6a1a', 0.6);
  }
  for (const x of [10, 70]) { const g = T.at(sOf(x, -40), {}); CartScene.mesh(api, g.x, g.z, g.yaw, m => fdyPipeBridge(m, g.wl + g.wr + 4), { hi: true, noAO: true }); }
  for (let k = 0; k < 4; k++) { const s = sOf(-30 + k * 30 + 15, -40), sd = k % 2 ? -1 : 1, f = side(s, sd, 10.5); if (free(f.x, f.z, 5)) { CartScene.mesh(api, f.x, f.z, f.yaw, fdyFurnace, { hi: true }); taken.push([f.x, f.z, 7]); } }
  CartKit.crowd(E, T, (T.L - 60) % T.L, T.L - 22, 1, rng, { rows: 2, off: 3 }); CartKit.crowd(E, T, (T.L - 60) % T.L, T.L - 22, -1, rng, { rows: 2, off: 3 });
  // ---- the bellows bend: two giant bellows facing the road from alternate sides ----
  for (let i = 0; i < 2; i++) {
    const s = S.bel - 20 + i * 40, sd = i ? 1 : -1, g = T.at(s, {}), wall = sd > 0 ? g.wr : g.wl, off = wall + 4.8, nx = g.nx * sd, nz = g.nz * sd;
    const bx = g.x + nx * off, bz = g.z + nz * off, yaw = Math.atan2(-nx, -nz);
    CartScene.mesh(api, bx, bz, yaw, fdyBellowsBase, { hi: true, scale: 1.25 });
    E.fdy.bellows.push({ i, s, sd, bx, bz, yaw, x: g.x + nx * (wall + 0.5), z: g.z + nz * (wall + 0.5), dx: -nx, dz: -nz, tx: g.tx, tz: g.tz, reach: wall + g.wl + g.wr - wall + 2 });
    taken.push([bx, bz, 6]); api.light(bx, bz, 10, '#ff8a3a', 0.45);
    E.heroes.push({ type: 'dpw', x: bx + g.tx * 4.5, z: bz + g.tz * 4.5, yaw, anim: 'yell' });
  }
  // ---- the pipeworks: gantry cranes with ladles of molten copper ----
  for (const [i, s] of [[0, S.pipe0 + 12], [1, S.pipe0 - 14], [2, S.pipe1]]) {
    const g = T.at(s, {}), Wd = g.wl + g.wr + 5;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => fdyGantry(m, Wd), { hi: true, noAO: true });
    E.fdy.ladles.push({ i, s, x: g.x, z: g.z, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, yaw: g.yaw, hw: g.hw });
    taken.push([g.x + g.nx * Wd / 2, g.z + g.nz * Wd / 2, 4], [g.x - g.nx * Wd / 2, g.z - g.nz * Wd / 2, 4]);
  }
  for (let s = S.pipe0 - 50, k = 0; s < S.pipe1 + 40; s += 9, k++) { const sd = k % 2 ? 1 : -1, p = side(s, sd, 2.2 + (k % 3) * 1.4); if (free(p.x, p.z, 1.6)) CartKit.put(E, 'fdy_pipes', p.x, p.z, p.yaw + (k % 2 ? 0.3 : -0.3), k % 4 ? '#d07a40' : '#e8a060', { scale: 1 + (k % 3) * 0.25 }); }
  // ---- the fire garden: fire pits in pairs either side (the tornadoes' homes), fire flowers, firespinners ----
  const torS = [S.garden + 62, S.garden + 6, S.garden - 56];
  torS.forEach((s, i) => {
    const g = T.at(s, {}), pits = [];
    for (const sd of [-1, 1]) { const p = side(s, sd, 4.0); CartScene.mesh(api, p.x, p.z, 0, fdyPit, { hi: true, noAO: true }); api.fire(p.x, 0.3, p.z, 0.8, { hazard: false }); taken.push([p.x, p.z, 4]); pits.push([p.x, p.z]); }
    E.fdy.tors.push({ i, s, x0: pits[0][0], z0: pits[0][1], x1: pits[1][0], z1: pits[1][1], tx: g.tx, tz: g.tz });
  });
  for (let s = S.garden - 95, k = 0; s < S.garden + 95; s += 4.2, k++) for (const sd of [1, -1]) { if ((k + (sd > 0 ? 1 : 0)) % 2) continue; const p = side(s, sd, 2.6 + ((k * 7) % 5) * 1.6 + rng() * 1.4); if (free(p.x, p.z, 1.2)) CartKit.put(E, 'fdy_flower', p.x, p.z, rng() * TAU, ['#e8905a', '#ffb070', '#d06a3a', '#f0c090'][k % 4], { scale: 0.9 + rng() * 0.6 }); }
  for (let k = 0; k < 4; k++) { const p = side(S.garden - 70 + k * 46, k % 2 ? 1 : -1, 9); if (free(p.x, p.z, 2)) E.heroes.push({ type: 'firespinner', x: p.x, z: p.z, yaw: p.yaw, anim: 'firespin' }); }
  CartKit.crowd(E, T, S.garden - 30, S.garden + 30, 1, rng, { rows: 2, off: 13, gap: 2.0 });
  // ---- the pipe tunnel: copper arches every 6 m ----
  for (let k = -5; k <= 5; k++) { const g = T.at(S.tunnel + k * 6, {}), Wd = Math.max(g.wl, g.wr) * 2 + 3; CartScene.mesh(api, g.x, g.z, g.yaw, m => fdyPipeArch(m, Wd, k % 2 ? '#b8642e' : '#d08048'), { hi: true, noAO: true }); if (k % 2 === 0) api.light(g.x, g.z, 10, '#ff8a3a', 0.5); }
  taken.push([T.at(S.tunnel, {}).x, T.at(S.tunnel, {}).z, 38]);
  // ---- pipes and smokestacks fill the rest; searchlights in the smoke ----
  for (let s = 14, k = 0; s < T.L; s += 22, k++) { const sd = k % 2 ? 1 : -1, p = side(s, sd, 5 + (k % 3) * 2.5); if (free(p.x, p.z, 2.5)) CartKit.put(E, 'fdy_pipes', p.x, p.z, p.yaw, FDY_PAL[k % 3 === 2 ? 2 : 0], { scale: 1.1 + (k % 2) * 0.3 }); }
  for (let s = 40, k = 0; s < T.L; s += 75, k++) { const p = side(s, k % 2 ? 1 : -1, 30 + (k % 3) * 12); if (free(p.x, p.z, 4)) CartKit.put(E, 'fdy_stack', p.x, p.z, 0, '#c8743a', { scale: 1 + (k % 3) * 0.2 }); }
  CartDecor.skyline(E, T, rng);
  E.beams = []; for (let i = 0; i < 6; i++) { const p = side(T.L * (i + 0.4) / 6, i % 2 ? 1 : -1, 48 + rng() * 22); if (!CartWorlds.clear(T, p.x, p.z, 12)) continue; E.beams.push({ kind: 'search', x: p.x, y: 1, z: p.z, c: burnsRGBf(i % 2 ? '#ff8a3a' : '#ffc070'), ph: rng() * 6, sp: 0.3 + rng() * 0.3, len: 140, w: 6, a: 0.18 }); api.light(p.x, p.z, 10, '#ff8a3a', 0.5); }
  // gift rows, boost pads (fractions of the lap), the grid
  const f = s => (((s % T.L) + T.L) % T.L) / T.L;
  CartKit.gifts(E, T, [f(sOf(-30, -40)), f(sOf(203, 55)), f(sOf(48, 200)), f(sOf(-186, 0))]);
  CartKit.boosts(E, T, [[f(S.tunnel), 0], [f(sOf(170, 2)), -0.3], [f(S.garden - 20), 0.35]]);
  CartKit.grid(E, T);
  return CartKit.finish(E);
}
// the centre line: little ember chevrons every 7 m
function fdyPaintCenter(ctx, P, S, T) {
  for (let s = 0; s < T.L; s += 7) { const g = T.at(s, {}), q = P(g.x, g.z); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.scale(S, S); ctx.strokeStyle = 'rgba(255,130,50,0.7)'; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.moveTo(-0.7, -0.9); ctx.lineTo(0.5, 0); ctx.lineTo(-0.7, 0.9); ctx.stroke(); ctx.restore(); }
}

/* ---------------- the moving things (one pooled group) ---------------- */
const FdyMesh = {
  // a bellows' leather bag (pleated) and its top board; the bag swells and the board rides on it
  bag(m) { m.color('#6a3a22').shine(1); m.ellipsoid(0, 0, 0, 2.0, 1.0, 2.6, { seg: 14, rings: 8 }); m.color('#4a2414'); for (const y of [-0.45, 0, 0.45]) m.torus(0, y, 0, Math.sqrt(1 - y * y) * 1.98 + 0.03, 0.07, { seg: 18, tseg: 3, sy: 1 }); m.shine(0); },
  board(m) { const wd = BURNS_ATLAS.pattern('wood'); m.color('#9a6a44'); m.roundBox(0, 0, 0, 4.2, 0.3, 6.0, 0.12, { uv: wd }); m.color('#b8642e').shine(3); for (const sx of [-1.7, 1.7]) m.limb(sx, 0.2, -2.6, sx, 0.2, 2.6, 0.08, 0.08, { seg: 6 }); m.limb(-1.2, 0.5, -3.4, 1.2, 0.5, -3.4, 0.12, 0.12, { seg: 8 }); m.shine(0); },
  // a ladle (crucible) of molten copper: iron pot, copper rim, the glowing melt, trunnions, the bail up to the hook.
  // Pivot at the trunnions; the pour lip is at +z
  ladle(m) {
    m.color('#7a3a22').shine(2); m.lathe([[0, -1.7], [1.1, -1.65], [1.45, -1.1], [1.6, 0.2], [1.75, 0.55], [1.55, 0.6], [1.4, 0.2]], { seg: 18 });
    m.color('#b8642e').shine(3); m.torus(0, 0.58, 0, 1.66, 0.12, { seg: 20, tseg: 4 }); m.push(); m.tf(0, 0.55, 1.65, 0, 0.5, 0); m.ellipsoid(0, 0, 0.2, 0.42, 0.12, 0.5, { seg: 8, rings: 4 }); m.pop();
    m.color('#ff6a1a', 0.8); m.torus(0, -0.5, 0, 1.62, 0.08, { seg: 20, tseg: 3 }); m.color('#ff8a1a', 1); m.disc(0, 0.32, 0, 1.42, 18); m.color('#fff0a0', 1); m.disc(0, 0.34, 0, 0.7, 12); m.emissive(0);
    m.color('#2a2220').shine(2); for (const sx of [-1, 1]) { m.limb(sx * 1.55, 0, 0, sx * 1.95, 0, 0, 0.18, 0.18, { seg: 8 }); m.limb(sx * 1.95, 0, 0, sx * 1.95, 2.6, 0, 0.1, 0.1, { seg: 6 }); }
    m.limb(-1.95, 2.6, 0, 1.95, 2.6, 0, 0.1, 0.1, { seg: 6 }); m.color('#8a8a92').shine(3); m.limb(0, 2.6, 0, 0, 3.5, 0, 0.06, 0.06, { seg: 5 }); m.torus(0, 3.6, 0, 0.25, 0.06, { seg: 10, tseg: 3 }); m.shine(0);
  },
  // a flame tornado's core: a twisted glowing funnel (the flames round it are sprites)
  funnel(m) {
    m.color('#ff6a1a', 1); m.lathe([[0.35, 0], [0.7, 1.6], [1.3, 3.6], [2.1, 6.0], [2.8, 8.0], [2.5, 8.1]], { seg: 12 });
    m.color('#ffd060', 1); for (let i = 0; i < 26; i++) { const u0 = i / 26, u1 = (i + 1) / 26, r0 = 0.45 + u0 * 2.5, r1 = 0.45 + u1 * 2.5, a0 = u0 * 9, a1 = u1 * 9; m.limb(Math.sin(a0) * r0, u0 * 8, Math.cos(a0) * r0, Math.sin(a1) * r1, u1 * 8, Math.cos(a1) * r1, 0.14, 0.14, { seg: 5, ends: false }); }
    m.emissive(0);
  }
};

/* ---------------- the rules: hazards and enemies at run time ---------------- */
const FDY_JET = { period: 4.8, tele: 1.25, burn: 0.9, half: 1.7 };
const FDY_BEL = { period: 6.4, tele: 1.6, speed: 36, band: 2.4, width: 7.5, push: 7.5 };
const FDY_LAD = { period: 7.2, tele: 1.5, pour: 0.7, life: 4.0, r: 2.9, y: 10.6, tilt: 1.05 };
const FDY_TOR = { tele: 1.4, speed: 6.0, r: 3.0, sway: 3.0 };
CART_TRACK_RULES.foundry = {
  onLoad(s) {
    const E = s.E, F = E.fdy;
    const G = CartKit.group(s, [['bags', FdyMesh.bag, F.bellows.length], ['boards', FdyMesh.board, F.bellows.length], ['ladles', FdyMesh.ladle, F.ladles.length], ['funnels', FdyMesh.funnel, F.tors.length]]);
    const L = s.fdy = { G, jets: [], bel: [], lad: [], tor: [], said: {}, hintT: -9, heat: 0 };
    F.jets.forEach((q, i) => L.jets.push(Object.assign({}, q, { off: (i % 2) * FDY_JET.period / 2 + Math.floor(i / 2) * 0.35, on: false, t0: -99, len: 0, tele: 0, mask: 0 })));
    F.bellows.forEach((q, i) => L.bel.push(Object.assign({}, q, { off: i * 3.1, t0: -99, R: 0, live: false, tele: 0, mask: 0, bag: G.bags[i], board: G.boards[i] })));
    F.ladles.forEach((q, i) => L.lad.push(Object.assign({}, q, { off: i * 2.4, tele: 0, aimed: false, pouring: false, d: 0, dT: 0, tilt: 0, mask: 0, cyc: 0, pud: { live: false, t: 0, x: 0, z: 0, mask: 0 }, obj: G.ladles[i] })));
    F.tors.forEach((q, i) => L.tor.push(Object.assign({}, q, { state: 'idle', t: 0, wait: 1.5 + i * 2.2, u: 0, dir: i % 2 ? -1 : 1, x: i % 2 ? q.x1 : q.x0, z: i % 2 ? q.z1 : q.z0, cool: new Float32Array(16), obj: G.funnels[i], spin: 0 })));
    CartKit.state(s);
  },
  onUpdate(s, dt, racing) {
    const L = s.fdy; if (!L) return;
    fdyJets(s, L, dt, racing); fdyBellows(s, L, dt, racing); fdyLadles(s, L, dt, racing); fdyTornadoes(s, L, dt, racing);
    if (L.heat > 0) L.heat = Math.max(0, L.heat - dt);
  },
  // the AI: ease off for a burning jet or a gust that will catch it, hop a hot puddle (by skill)
  onStep(s, k, dt, racing) {
    const L = s.fdy; if (!L || k.player && !s.autoDrive || !racing || !s.T || k.out) return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9, roll = ((k.slot * 7 + Math.floor(s.time / 3)) % 10) / 10, good = roll < 0.45 + (sk - 0.85) * 3;
    for (const q of L.jets) {
      if (!q.on && q.tele < 0.6) continue;
      const ds = CartKit.ahead(s, k, q.s); if (ds < 3 || ds > 18) continue;
      const lat = (k.x - q.x) * q.dx + (k.z - q.z) * q.dz; if (lat > -1 && lat < q.reach + 1 && good && k.speed > 12) { I.gas = 0; if (q.on && k.speed > 20) I.brake = 0.4; }
    }
    for (const q of L.bel) { if (q.tele < 0.55) continue; const ds = CartKit.ahead(s, k, q.s); if (ds > 4 && ds < 24 && good && k.speed > 14) I.gas = 0; }
    for (const q of L.lad) { const P = q.pud; if (!P.live || P.t > FDY_LAD.life * 0.85 || k.air) continue; const dx = P.x - k.x, dz = P.z - k.z, fw = dx * Math.sin(k.yaw) + dz * Math.cos(k.yaw), sideD = Math.abs(dx * Math.cos(k.yaw) - dz * Math.sin(k.yaw)); if (fw > 2 && fw < 3 + k.speed * 0.22 && sideD < FDY_LAD.r + 0.8 && good) { I.driftPress = true; I.drift = false; } }
  },
  draw(s, R, S, t) { const L = s.fdy; if (L) fdyDraw(s, L, R, S, t); },
  lights(s, add) {
    const L = s.fdy; if (!L) return;
    for (const q of L.jets) if (q.on) add(q.x + q.dx * q.len * 0.5, 1.6, q.z + q.dz * q.len * 0.5, 16, FDY_C.orange, 1.8, 2);
    for (const q of L.lad) { if (q.pouring) add(q.x + q.nx * q.dT, 3, q.z + q.nz * q.dT, 14, FDY_C.yellow, 1.6, 2); if (q.pud.live) add(q.pud.x, 0.6, q.pud.z, 10, FDY_C.orange, 1.2 * (1 - q.pud.t / FDY_LAD.life), 1); }
    for (const q of L.tor) if (q.state !== 'idle') add(q.x, 3, q.z, 16, FDY_C.orange, q.state === 'cross' ? 1.9 : 1.2, 2);
  },
  hud(s, ctx, W, H, top, left) {
    const L = s.fdy, p = s.player; if (!L || !p) return;
    // scorched: an orange heat haze round the screen edges, fading
    if (L.heat > 0) { const a = Math.min(1, L.heat) * 0.5, e = Math.min(W, H) * 0.12; ctx.save(); ctx.fillStyle = 'rgba(255,110,30,' + a.toFixed(3) + ')'; ctx.fillRect(0, 0, W, e); ctx.fillRect(0, H - e, W, e); ctx.fillRect(0, e, e, H - 2 * e); ctx.fillRect(W - e, e, e, H - 2 * e); ctx.globalAlpha = a * 0.5; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    const hint = (key, sv, text, sub) => { if (L.said[key] || p.lap > 1) return; const ds = CartKit.ds(s.T, p.loc.s, sv); if (ds > 0 && ds < 75) { L.said[key] = true; L.hintT = s.time; s.banner(text, '#ffb060', 2.0, sub); } };
    if (s.state === 'race' && s.T) { hint('jets', L.jets[0].s, 'FIRE JETS!', 'weave to the open lane'); hint('bel', L.bel[0].s, 'GIANT BELLOWS!', 'pass while they breathe in'); hint('lad', L.lad[1].s, 'MOLTEN COPPER!', 'steer off the glow, or HOP the puddle'); hint('tor', L.tor[0].s, 'FLAME TORNADOES!', 'go round them'); }
  }
};
function fdyBurn(s, k, tag, banner) {
  const ok = CartKit.hit(s, k, tag === 'firewhirl' ? 'whirl' : 'spin', tag, tag === 'firewhirl' ? { dur: 1.1, vy: 7, banner } : { dur: 0.85, banner });
  if (ok) { k.smokeT = Math.max(k.smokeT || 0, 1.4); if (k.player) s.fdy.heat = 1.2; if (s.fx) { s.fx.burst(k.x, k.y + 1, k.z, 'spark', 12, '#ffb040'); for (let i = 0; i < 4; i++) s.fx.fire(k.x, k.y + 0.6, k.z, 1.2); } cartIxSound(s, 'flame', k.x, k.z, 0.7, 1.2); }
  return ok;
}
// ---- fire jets: 1.25 s of warning, ~1 s of flame across ~60% of the road from the port's side ----
function fdyJets(s, L, dt, racing) {
  const J = FDY_JET;
  for (const q of L.jets) {
    const ph = (((s.time + q.off) % J.period) + J.period) % J.period, on = ph < J.burn;
    q.tele = ph >= J.period - J.tele ? (ph - (J.period - J.tele)) / J.tele : 0;
    if (on && !q.on) {
      q.on = true; q.t0 = s.time; q.mask = 0; CartKit.fired(s, 'firejet');
      if (CartKit.near(s, q.x, q.z, 70)) { cartIxSound(s, 'flame', q.x, q.z, 1, 0.8); cartIxSound(s, 'cartBoom', q.x, q.z, 0.3, 1.6); }
      if (CartKit.near(s, q.x, q.z, 22)) s.shakeIt(0.3);
    } else if (!on) q.on = false;
    q.len = on ? q.reach * Math.min(1, (s.time - q.t0) / 0.15) : 0;
    if (on && racing) for (const k of s.karts) {
      if (k.out || (q.mask & (1 << k.slot))) continue;
      const rx = k.x - q.x, rz = k.z - q.z, a = rx * q.dx + rz * q.dz, p = rx * q.tx + rz * q.tz;
      if (a < -0.8 || a > q.len + 0.8 || Math.abs(p) > J.half || k.y > s.terrain.height(k.x, k.z) + 2.8) continue;
      q.mask |= 1 << k.slot; fdyBurn(s, k, 'firejet', 'TOASTED!');
    }
    // the AI sees the jet's line while it is about to fire or burning
    if (q.tele > 0.3 || on) for (let r = 1.5; r < q.reach + 1; r += 3) cartIxObs(s, q.x + q.dx * r, q.z + q.dz * r, 1.9);
  }
}
// ---- giant bellows: the bag swells for 1.6 s, then a gust front rolls over the road and shoves cars across ----
function fdyBellows(s, L, dt, racing) {
  const B = FDY_BEL;
  for (const q of L.bel) {
    const ph = (((s.time + q.off) % B.period) + B.period) % B.period;
    q.tele = ph >= B.period - B.tele ? (ph - (B.period - B.tele)) / B.tele : 0;
    if (ph < 0.25 && !q.live && s.time - q.t0 > 1) {
      q.live = true; q.t0 = s.time; q.R = 0; q.mask = 0; CartKit.fired(s, 'bellows');
      if (CartKit.near(s, q.x, q.z, 70)) { cartIxSound(s, 'wind', q.x, q.z, 1, 0.7); cartIxSound(s, 'cartBoom', q.x, q.z, 0.35, 0.5); }
      if (CartKit.near(s, q.x, q.z, 24)) s.shakeIt(0.3);
    }
    if (q.live) {
      q.R = (s.time - q.t0) * B.speed;
      if (q.R > q.reach) q.live = false;
      else if (racing) for (const k of s.karts) {
        if (k.out || (q.mask & (1 << k.slot))) continue;
        const rx = k.x - q.x, rz = k.z - q.z, a = rx * q.dx + rz * q.dz, p = rx * q.tx + rz * q.tz;
        if (Math.abs(a - q.R) > B.band || Math.abs(p) > B.width) continue;
        q.mask |= 1 << k.slot;
        if (k.shieldT > 0 || k.immuneT > 0 || k.fly || k.sunk) continue;
        const pw = B.push * (1 - 0.35 * a / q.reach);
        k.vx += q.dx * pw; k.vz += q.dz * pw; k.yaw = cartWrap(k.yaw + (Math.random() - 0.5) * 0.2); k.drift = 0; k.charge = 0;
        CartKit.touch(s, k, 'bellows', 'HOT AIR!', '#ffb060');
        if (k.player) { s.shakeIt(0.5); Sound.play('bump', { vol: 0.5, pitch: 0.6 }); }
        if (s.fx && CartKit.near(s, k.x, k.z, 60)) s.fx.dust(k.x, k.y + 0.3, k.z, 6, '#8a6a5a');
      }
    }
    // pose: the bag swells while it breathes in, squashes on the blow; the board rides on top
    const after = s.time - q.t0, blow = after < 0.45 ? Math.sin(after / 0.45 * Math.PI) : 0, sw = q.tele ? 0.85 + q.tele * 0.4 + Math.sin(s.time * 30) * 0.02 * q.tele : 0.85 - blow * 0.18 + 0.03 * Math.sin(s.time * 1.3 + q.i);
    const sc = 1.25, c = Math.cos(q.yaw), sn = Math.sin(q.yaw), bx = q.bx + sn * -0.6 * sc, bz = q.bz + c * -0.6 * sc;
    if (q.bag) { const o = q.bag; o.live = true; o.visible = true; o.x = bx; o.z = bz; o.y = (1.03 + sw * 0.95) * sc; o.yaw = q.yaw; o.pitch = 0; o.roll = 0; o.scale = sw * sc; }
    if (q.board) { const o = q.board; o.live = true; o.visible = true; o.x = bx; o.z = bz; o.y = (1.03 + sw * 1.95) * sc; o.yaw = q.yaw; o.pitch = -blow * 0.08; o.roll = 0; o.scale = sc; }
  }
}
// ---- ladles of molten copper: aim at an oncoming car's line (1.5 s), tip and pour, a glowing puddle for ~4 s ----
function fdyLadles(s, L, dt, racing) {
  const Q = FDY_LAD;
  for (const q of L.lad) {
    const ph = (((s.time + q.off) % Q.period) + Q.period) % Q.period;
    q.tele = ph >= Q.period - Q.tele ? (ph - (Q.period - Q.tele)) / Q.tele : 0;
    if (q.tele > 0 && !q.aimed) {
      // aim: the nearest car coming up to the gantry (else a lane of its own)
      q.aimed = true; q.cyc++; let best = null, bd = 1e9;
      for (const k of s.karts) { if (k.out || k.finished) continue; const ds = CartKit.ahead(s, k, q.s); if (ds > 10 && ds < 85 && ds < bd) { bd = ds; best = k; } }
      q.d = clamp(best && q.cyc % 3 !== 0 ? best.loc.d : [-0.45, 0.4, 0, -0.2, 0.5][(q.cyc + q.i) % 5] * q.hw, -q.hw * 0.62, q.hw * 0.62);
    }
    const pouring = ph < Q.pour;
    if (pouring && !q.pouring) {
      q.mask = 0; CartKit.fired(s, 'molten');
      if (CartKit.near(s, q.x, q.z, 70)) { cartIxSound(s, 'splash', q.x, q.z, 0.8, 0.5); cartIxSound(s, 'flame', q.x, q.z, 0.6, 0.7); }
    }
    if (!pouring && q.pouring) q.aimed = false;
    q.pouring = pouring;
    q.dT = approach(q.dT, q.d, 9 * dt);
    const px = q.x + q.nx * q.dT, pz = q.z + q.nz * q.dT, gy = s.terrain.height(px, pz);
    if (pouring && ph > 0.22 && (!q.pud.live || q.pud.t > 0.6)) { const P = q.pud; P.live = true; P.t = 0; P.x = px; P.z = pz; P.mask = 0; if (s.fx && CartKit.near(s, px, pz, 90)) { s.fx.spark(px, gy + 0.4, pz, 16, '#ffd060', 7); s.fx.smoke(px, gy + 0.5, pz, 3, '#5a4038'); } }
    // the stream itself
    if (pouring && racing) for (const k of s.karts) { if (k.out || (q.mask & (1 << k.slot))) continue; if (Math.hypot(k.x - px, k.z - pz) < 1.9 && k.y < gy + 4) { q.mask |= 1 << k.slot; fdyBurn(s, k, 'molten', 'MOLTEN COPPER!'); } }
    // the puddle: hot for most of its life, then it crusts over
    const P = q.pud;
    if (P.live) {
      P.t += dt; if (P.t > Q.life) P.live = false;
      else if (P.t < Q.life * 0.85) {
        cartIxObs(s, P.x, P.z, Q.r);
        if (racing) for (const k of s.karts) { if (k.out || (P.mask & (1 << k.slot))) continue; if (k.air && k.y > s.terrain.height(k.x, k.z) + 0.25) continue; if (Math.hypot(k.x - P.x, k.z - P.z) < Q.r) { P.mask |= 1 << k.slot; if (fdyBurn(s, k, 'molten', 'MOLTEN COPPER!')) k.slowT = Math.max(k.slowT, 1.0); } }
      }
    }
    if (q.tele > 0.25) cartIxObs(s, q.x + q.nx * q.d, q.z + q.nz * q.d, Q.r + 0.5);
    // pose: trundles to the aim, quivers and tips while warning, pours, rights itself
    q.tilt = pouring ? approach(q.tilt, Q.tilt, 6 * dt) : q.tele ? q.tele * 0.3 : approach(q.tilt, 0, 1.5 * dt);
    const o = q.obj; if (o) { o.live = true; o.visible = true; o.x = px; o.z = pz; o.y = Q.y + Math.sin(s.time * 1.1 + q.i) * 0.08; o.yaw = q.yaw; o.pitch = q.tilt + (q.tele ? Math.sin(s.time * 26) * 0.02 : 0); o.roll = Math.sin(s.time * 0.9 + q.i * 2) * 0.03; o.scale = 1.5; }
  }
}
// ---- flame tornadoes: spin up in a fire pit (1.4 s), wander across the road and settle in the far pit ----
function fdyTornadoes(s, L, dt, racing) {
  const Q = FDY_TOR;
  for (const q of L.tor) {
    for (let i = 0; i < 16; i++) if (q.cool[i] > 0) q.cool[i] -= dt;
    const ax = q.dir > 0 ? q.x0 : q.x1, az = q.dir > 0 ? q.z0 : q.z1, bx = q.dir > 0 ? q.x1 : q.x0, bz = q.dir > 0 ? q.z1 : q.z0;
    if (q.state === 'idle') { q.x = ax; q.z = az; q.wait -= dt; if (q.wait <= 0) { q.state = 'tele'; q.t = 0; } }
    else if (q.state === 'tele') {
      q.t += dt; q.x = ax; q.z = az;
      cartIxObs(s, lerp(ax, bx, 0.12), lerp(az, bz, 0.12), Q.r);
      if (q.t >= Q.tele) { q.state = 'cross'; q.u = 0; CartKit.fired(s, 'firewhirl'); if (CartKit.near(s, ax, az, 70)) { cartIxSound(s, 'wind', ax, az, 0.9, 1.3); cartIxSound(s, 'flame', ax, az, 0.8, 0.6); } }
    } else {
      const D = Math.hypot(bx - ax, bz - az); q.u += dt * Q.speed / D;
      const w = Math.sin(q.u * Math.PI * 2 + q.i) * Q.sway * Math.sin(q.u * Math.PI);
      q.x = lerp(ax, bx, q.u) + q.tx * w; q.z = lerp(az, bz, q.u) + q.tz * w;
      if (q.u >= 1) { q.state = 'idle'; q.dir = -q.dir; q.wait = 2.0 + q.i * 0.8; }
      else {
        cartIxObs(s, q.x, q.z, Q.r); const ex = (bx - ax) / D * Q.speed, ez = (bz - az) / D * Q.speed; cartIxObs(s, q.x + ex, q.z + ez, Q.r);
        if (racing) for (const k of s.karts) { if (k.out || q.cool[k.slot] > 0 || k.y > s.terrain.height(k.x, k.z) + 5) continue; if (Math.hypot(k.x - q.x, k.z - q.z) < Q.r + 0.6) { q.cool[k.slot] = 3; fdyBurn(s, k, 'firewhirl', 'FLAME TORNADO!'); } }
        if (s.fx && CartKit.near(s, q.x, q.z, 80) && Math.random() < 0.7) s.fx.fire(q.x + (Math.random() - 0.5) * 2, 0.2, q.z + (Math.random() - 0.5) * 2, 1.4);
      }
    }
    q.spin += dt * (q.state === 'cross' ? 9 : q.state === 'tele' ? 3 + q.t * 4 : 1);
    const grow = q.state === 'cross' ? Math.min(1, q.u * 8, (1 - q.u) * 8) : q.state === 'tele' ? q.t / Q.tele * 0.55 : 0;
    const o = q.obj; if (o) { o.live = grow > 0.02; o.visible = o.live; o.x = q.x; o.z = q.z; o.y = s.terrain.height(q.x, q.z); o.yaw = q.spin; o.pitch = 0; o.roll = Math.sin(s.time * 3 + q.i) * 0.06; o.scale = 0.4 + grow * 0.75 + Math.sin(s.time * 11 + q.i) * 0.03; }
    q.grow = grow;
  }
}
// ---- sprites: jet lanes and flames, the gusts, the ladle targets, streams and puddles, the tornadoes' fire ----
function fdyDraw(s, L, R, S, t) {
  const C = FDY_C, cam = s.cam, far = (x, z, r) => (x - cam.x) ** 2 + (z - cam.z) ** 2 > r * r;
  for (const q of L.jets) {
    if (far(q.x, q.z, 200)) continue;
    const yaw = Math.atan2(q.dx, q.dz);
    if (q.tele > 0) {
      // the port glows hotter; chaser lights run across the road where the flame will go
      R.bbs.bb(q.x, 1.25, q.z, 1.2 + q.tele * 3.2, 1.2 + q.tele * 3.2, S.glow, C.orange, 0.5 + q.tele * 0.5, true);
      const n = Math.ceil(q.reach / 2.2), head = (t * 9) % n, fl = 0.45 + 0.55 * Math.max(0, Math.sin(t * 20));
      for (let j = 0; j < n; j++) { const r = 1 + j * 2.2, lit = Math.abs(j - head) < 1.2 ? 1 : 0.35; R.flat.flat(q.x + q.dx * r, 0.1, q.z + q.dz * r, FDY_JET.half * 2.6, 2.6, yaw, S.square, C.warn, 0.55 * q.tele * lit * fl, true); }
      for (const sd of [-1, 1]) R.flat.flat(q.x + q.dx * q.reach / 2 + q.tx * sd * FDY_JET.half, 0.11, q.z + q.dz * q.reach / 2 + q.tz * sd * FDY_JET.half, 0.35, q.reach, yaw, S.square, C.yellow, 0.85 * q.tele * fl, true);
      if (s.fx && Math.random() < 0.5 && !far(q.x, q.z, 80)) s.fx.spark(q.x, 1.3, q.z, 1, '#ffb040', 3);
    }
    if (q.on) {
      // the jet: a white-hot core and a tongue of flame billboards widening as it goes
      const len = q.len, fl = 0.9 + 0.1 * Math.sin(t * 40);
      R.bbs.streak(q.x + q.dx * len * 0.5, 1.3, q.z + q.dz * len * 0.5, q.dx, 0, q.dz, len, 1.1, S.streak, C.cream, 0.9);
      for (let j = 0; j <= 10; j++) { const u = j / 10, r = u * len, w = (1.6 + u * 2.6) * fl, jt = Math.sin(t * 31 + j * 1.7) * 0.25; R.bbs.bb(q.x + q.dx * r + q.tx * jt, 1.3 + u * 0.7, q.z + q.dz * r + q.tz * jt, w, w * 1.15, S.flame, u < 0.3 ? C.yellow : C.orange, 0.95, true); }
      R.bbs.bb(q.x + q.dx * len * 0.5, 1.6, q.z + q.dz * len * 0.5, len * 0.9, 6, S.glow, C.hot, 0.45, true);
      R.flat.flat(q.x + q.dx * len * 0.5, 0.1, q.z + q.dz * len * 0.5, FDY_JET.half * 3, len + 2, yaw, S.glow, C.orange, 0.6, true);
      if (s.fx && Math.random() < 0.8 && !far(q.x, q.z, 90)) s.fx.fire(q.x + q.dx * len * (0.3 + Math.random() * 0.7), 1.0, q.z + q.dz * len * (0.3 + Math.random() * 0.7), 1.5);
    }
  }
  for (const q of L.bel) {
    if (far(q.x, q.z, 200)) continue;
    const yaw = Math.atan2(q.dx, q.dz);
    if (q.tele > 0) {
      // arrows of warm air stream across the road, the nozzle sucks in sparks
      const fl = 0.5 + 0.5 * Math.max(0, Math.sin(t * 16));
      for (let j = 0; j < 6; j++) { const u = ((t * 0.9 + j / 6) % 1), r = 2 + u * (q.reach - 4); for (const p of [-4.5, 0, 4.5]) R.flat.flat(q.x + q.dx * r + q.tx * p, 0.1, q.z + q.dz * r + q.tz * p, 2.4, 2.4, yaw, S.arrow || S.square, C.air, 0.85 * q.tele * (1 - Math.abs(u - 0.5)) * fl, true); }
      R.flat.flat(q.x + q.dx * q.reach * 0.5, 0.09, q.z + q.dz * q.reach * 0.5, FDY_BEL.width * 2, q.reach, yaw, S.glow, C.warn, 0.22 * q.tele * fl, true);
    }
    if (q.live) {
      // the gust front: a wall of shimmering streaks with dust under it
      const a = 1 - q.R / q.reach;
      for (let j = -5; j <= 5; j++) { const x = q.x + q.dx * q.R + q.tx * j * 1.5, z = q.z + q.dz * q.R + q.tz * j * 1.5; R.bbs.streak(x, 1.4, z, 0, 1, 0, 2.6, 1.2, S.streak, j % 2 ? C.air : C.warn, 0.7 * a); }
      R.flat.flat(q.x + q.dx * q.R, 0.12, q.z + q.dz * q.R, FDY_BEL.width * 2, 3.2, yaw, S.glow, C.air, 0.6 * a, true);
      if (s.fx && Math.random() < 0.6 && !far(q.x, q.z, 80)) s.fx.dust(q.x + q.dx * q.R + q.tx * (Math.random() - 0.5) * 12, 0.3, q.z + q.dz * q.R + q.tz * (Math.random() - 0.5) * 12, 2, '#a08070');
    }
  }
  for (const q of L.lad) {
    if (far(q.x, q.z, 200)) continue;
    const px = q.x + q.nx * q.dT, pz = q.z + q.nz * q.dT;
    if (q.tele > 0) {
      // the target: a ring closing on where it will pour, a glow filling in, drips falling from the lip
      const tx = q.x + q.nx * q.d, tz = q.z + q.nz * q.d, rr = FDY_LAD.r * 2 * (1.8 - q.tele * 0.8), fl = 0.55 + 0.45 * Math.sin(t * (14 + q.tele * 14));
      R.flat.flat(tx, 0.12, tz, rr, rr, t * 1.5, S.reticle || S.ring, C.hot, 0.9 * fl, true);
      R.flat.flat(tx, 0.1, tz, FDY_LAD.r * 2, FDY_LAD.r * 2, 0, S.glow, C.orange, 0.25 + 0.45 * q.tele, true);
      const u = (t * 1.6 + q.i * 0.3) % 1; R.bbs.bb(px, FDY_LAD.y - 1 - u * (FDY_LAD.y - 1.5), pz, 0.5, 0.7, S.drop || S.glow, C.yellow, 0.9, true);
    }
    if (q.pouring) {
      const sp = 0.85 + 0.15 * Math.sin(t * 50);
      R.bbs.streak(px, (FDY_LAD.y - 0.6) / 2, pz, 0, 1, 0, FDY_LAD.y - 0.6, 1.0 * sp, S.streak, C.yellow, 1);
      R.bbs.streak(px, (FDY_LAD.y - 0.6) / 2, pz, 0, 1, 0, FDY_LAD.y - 0.6, 2.4, S.streak, C.orange, 0.5);
      R.bbs.bb(px, 0.8, pz, 5, 3, S.glow, C.yellow, 0.9, true);
    }
    const P = q.pud;
    if (P.live) {
      // the puddle glows white-orange, then crusts dark red at the edges as it cools
      const u = P.t / FDY_LAD.life, hot = 1 - u, grow = Math.min(1, P.t / 0.3), d = FDY_LAD.r * 2.3 * grow, bl = 0.85 + 0.15 * Math.sin(t * 7 + q.i);
      R.flat.flat(P.x, 0.1, P.z, d * 1.25, d * 1.25, q.i, S.glow, C.hot, 0.55 * hot, true);
      R.flat.flat(P.x, 0.11, P.z, d, d, q.i * 1.3, S.splat || S.glow, u < 0.6 ? C.orange : C.crust, 0.95 * bl * (u < 0.85 ? 1 : (1 - u) / 0.15), true);
      R.bbs.bb(P.x, 0.5, P.z, d * 1.1, 1.6, S.glow, C.orange, 0.5 * hot, true);
      R.flat.flat(P.x, 0.12, P.z, d * 0.55, d * 0.55, q.i * 0.7 + 1, S.splat || S.glow, C.yellow, 0.8 * Math.max(0, 1 - u * 1.6), true);
      if (s.fx && Math.random() < 0.08 * hot && !far(P.x, P.z, 70)) s.fx.smoke(P.x + (Math.random() - 0.5) * 3, 0.3, P.z + (Math.random() - 0.5) * 3, 1, '#6a4a40');
    }
  }
  for (const q of L.tor) {
    if (far(q.x, q.z, 200)) continue;
    if (q.state === 'tele') {
      // the pit flares: a swirl on the ground spinning up, flames climbing out
      const u = q.t / FDY_TOR.tele, fl = 0.6 + 0.4 * Math.sin(t * 18);
      R.flat.flat(q.x, 0.12, q.z, 5 + u * 5, 5 + u * 5, -q.spin, S.swirl || S.ring, C.orange, 0.9 * fl, true);
      R.flat.flat(q.x, 0.11, q.z, 9, 9, 0, S.ring, C.warn, 0.7 * u * fl, true);
      for (let j = 0; j < 5; j++) { const h = ((t * 2 + j / 5) % 1) * (2 + u * 5); R.bbs.bb(q.x + Math.sin(q.spin + j * 2) * 0.8, h + 0.5, q.z + Math.cos(q.spin + j * 2) * 0.8, 1.6, 2, S.flame, C.orange, 0.9, true); }
    }
    if (q.state === 'cross' || q.grow > 0.05) {
      const g = q.grow || 0;
      R.flat.flat(q.x, 0.13, q.z, 9 * g, 9 * g, -q.spin * 1.3, S.swirl || S.ring, C.orange, 0.95, true);
      R.flat.flat(q.x, 0.12, q.z, 13 * g, 13 * g, 0, S.glow, C.hot, 0.5, true);
      for (let j = 0; j < 14; j++) { const u = j / 13, h = u * 8.5 * g, a = q.spin * 1.2 + j * 0.95, r = (0.5 + u * 2.4) * g; R.bbs.bb(q.x + Math.sin(a) * r, h + 0.4, q.z + Math.cos(a) * r, (1.4 + u * 1.8) * g, (1.8 + u * 2) * g, S.flame, u < 0.35 ? C.yellow : C.orange, 0.9, true); }
      R.bbs.bb(q.x, 4.5 * g, q.z, 10 * g, 12 * g, S.glow, C.orange, 0.35, true);
    }
  }
}

if (typeof window !== 'undefined') setTimeout(() => {
  const C = window.BRADY_CART; if (!C || !C.debug) return;
  // hazard screenshots (tools/cart_track_test.js reads debug.trackShots[track] when it exists, so several career
  // tracks can each register their own): park the player where the hazard plays out, step until its moment
  const shots = () => ['gate', 'jet-warn', 'jet', 'bellows-warn', 'bellows', 'ladle-warn', 'molten', 'tornado-warn', 'tornado', 'garden', 'tunnel'].map(name => ({ name }));
  const shot = name => {
    const D = C.debug, STEP = 1 / 60;
    D.start({ mode: 'quick', track: 'foundry', car: 'octo', driver: 'brady', seed: 9, autoGas: true });
    const s = D.scene(); s.state = 'race'; s.stateT = 0; window.BRADY.Input.setMode('game'); s.layoutControls(); s.update(STEP);
    const L = s.fdy, T = s.T, P = s.player, F = s.E.fdy;
    let pin = null;
    const park = (sv, lat, speed, frozen) => { const g = T.at(sv, {}); D.place(-1, g.x + g.nx * g.hw * lat, g.z + g.nz * g.hw * lat, g.yaw, { speed: speed || 0, frozen: false }); P.prevS = P.loc.s; P.lap = 1; P.prog = P.loc.s; pin = frozen ? { x: P.x, z: P.z, yaw: P.yaw } : null; };
    const pins = [];
    const rivals = list => { let j = 0; for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = list[j++] || [-300 - j * 12, 0, 1]; const g = T.at(P.loc.s + r[0], {}); D.place(i, g.x + g.nx * g.hw * r[1], g.z + g.nz * g.hw * r[1], g.yaw, { speed: r[2] ? 0 : 18, frozen: false }); if (r[2]) pins.push({ k, x: k.x, z: k.z, yaw: k.yaw }); k.prevS = k.loc.s; k.lap = 1; k.prog = k.loc.s; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } k.wpn.t = 99; } };
    s.autoDrive = true; if (!P.ai) s.aiInput(P, STEP, true); P.ai.itemT = 99; P.ai.fireT = 99; P.wpn.t = 99;
    const hold = () => { if (pin) { P.x = pin.x; P.z = pin.z; P.yaw = pin.yaw; P.vx = P.vz = 0; } for (const q of pins) { q.k.x = q.x; q.k.z = q.z; q.k.yaw = q.yaw; q.k.vx = q.k.vz = 0; } };
    const wait = (fn, secs) => { for (let i = 0; i < secs * 60; i++) { s.update(STEP); hold(); if (fn()) return true; } return false; };
    let ok = true;
    if (name === 'gate') { park(T.L - 40, 0, 0, true); rivals([[14, 0.3, 1], [20, -0.3, 1]]); wait(() => false, 0.3); }
    else if (name === 'jet-warn' || name === 'jet') { const q = L.jets[1]; park(q.s - 22, 0, 0, true); rivals([[16, -q.sd * 0.5, 1], [-12, 0, 1]]); ok = wait(() => name === 'jet' ? q.on && s.time - q.t0 > 0.3 : q.tele > 0.7, 9); }
    else if (name === 'bellows-warn' || name === 'bellows') { const q = L.bel[0]; park(q.s - 22, 0.2, 0, true); rivals([[18, 0.3, 1], [22, -0.3, 0]]); ok = wait(() => name === 'bellows' ? q.live && q.R > q.reach * 0.35 && q.R < q.reach * 0.6 : q.tele > 0.7, 9); }
    else if (name === 'ladle-warn' || name === 'molten') { const q = L.lad[0]; park(q.s - 26, 0, 0, true); rivals([[-30, 0.3, 1]]); ok = wait(() => name === 'molten' ? q.pud.live && q.pud.t > 0.5 && q.pud.t < 1.2 : q.tele > 0.7, 12); }
    else if (name === 'tornado-warn' || name === 'tornado') { const q = L.tor[1]; park(q.s - 26, 0, 0, true); rivals([[-30, 0.3, 1]]); ok = wait(() => name === 'tornado' ? q.state === 'cross' && q.u > 0.35 && q.u < 0.6 : q.state === 'tele' && q.t > 0.9, 20); }
    else if (name === 'garden') { park(F.S.garden - 40, 0, 20, false); rivals([[10, 0.3, 0], [16, -0.3, 0], [26, 0, 0]]); wait(() => false, 0.8); }
    else if (name === 'tunnel') { park(F.S.tunnel - 34, 0, 20, false); rivals([[10, 0.3, 0], [18, -0.3, 0]]); wait(() => false, 0.7); }
    s.snapCam = true; for (let i = 0; i < 4; i++) { D.step(1, 1); hold(); }
    return { ok, draws: s.stats.draws, tris: s.stats.tris, hits: (s.kit || {}).hits, p: [+P.x.toFixed(1), +P.z.toFixed(1), +P.loc.s.toFixed(1)] };
  };
  C.debug.trackShots = C.debug.trackShots || {};
  C.debug.trackShots.foundry = { list: shots, shot };
}, 0);
