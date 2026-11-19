/* ============================================================
   ART CART — DRAGON'S KEEP, Sir Scorchalot's career track (level agent 'dragon', Nov 19 2026).
   Recipe: docs/ART_CART_LEVEL_RECIPE.md (Love Parade is the worked example). A castle at sunset, one lap of about 1.1 km:
     THE KING'S ROAD    the start straight under the keep's gatehouse, through the town: two pairs of SWINGING GATES.
                        A gate's bell rings, the leaf rattles and its half of the road flashes amber (1.2 s), then it
                        SLAMS shut across that half for 1.3 s and swings open again; the two leaves of a pair take turns
                        (take the open side; a closing leaf swats you, a shut one stops you dead)
     THE MOAT BEND      a fast sweeper past the knights' camp
     THE DRAWBRIDGE     a half-raised bascule bridge over the moat: up one leaf, fly the gap, land past the far leaf
                        (a boost pad before it makes the jump huge; BIG AIR pays a boost)
     THE BAILEY         inside the walls: three FIREBALL CATAPULTS crank back (1.1 s), throw, and a ring of fire marks
                        where each ball lands 1.35 s later (steer off the ring)
     THE LISTS          a jousting ground with stands and pavilions: a RED and a BLUE KNIGHT take turns charging down one
                        half of the road against the traffic, foam lance first (their lane flashes with arrows for 1.5 s
                        before each charge: take the other half)
     THE SALLY PORT     the way out through a gatehouse with a PORTCULLIS: it shudders and drops a little (1.3 s), slams
                        down, waits, and winches back up (pass while it is up, brake when it shudders)
     THE DESCENT        a forest road back down to the town
   In the middle stands the keep, with the OLD WYRM (a bronze dragon) curled on its roof.
   Sir Scorchalot's DRAGON FLIGHT is in everyone's gift boxes here (CART_TRACKS.keep.car = 'dragon').
   Start it without the menus: BRADY_CART.debug.start({ mode: 'career', track: 'keep' }) (or mode 'quick').
   Load order: this file sorts BEFORE 43_cart_j_kit.js, so nothing here may touch CartKit at load time (the course
   points are a lazy getter) and the two registries are declared with the kit's own var guard.
   ============================================================ */
var CART_TRACK_RULES = (typeof CART_TRACK_RULES !== 'undefined' && CART_TRACK_RULES) || {};
var CART_CAREER_TRACKS = (typeof CART_CAREER_TRACKS !== 'undefined' && CART_CAREER_TRACKS) || {};
const DKP_C = { fire: [1, 0.55, 0.12], ember: [1, 0.32, 0.05], gold: [1, 0.82, 0.3], red: [1, 0.16, 0.1], amber: [1, 0.68, 0.12], white: [1, 1, 1], black: [0, 0, 0], blue: [0.3, 0.55, 1], water: [0.55, 0.85, 1], crimson: [0.95, 0.1, 0.2] };
const DKP_T = { at: {}, at2: {}, tip: [0, 0, 0] };
const DKP_HERALD = ['#c8102e', '#ffffff', '#f2b630', '#1e4ab8', '#ffffff', '#2e7a3a'];

/* ---------------- the course ---------------- */
// corners [x, z, radius]: the King's Road (east), the moat bend, the drawbridge straight (north), the bailey hairpin
// (west), the lists (west along the top), the sally port and the forest descent back down
const DKP_POLY = [[-190, -10, 36], [150, -10, 40], [228, 78, 30], [208, 188, 26], [98, 166, 18], [42, 238, 20], [-96, 230, 30], [-182, 140, 32]];
CART_TRACKS.keep = {
  name: 'DRAGON\'S KEEP', car: 'dragon', tod: 'sunset', music: 'kart2', width: 20, shoulder: 4, theme: 'keep', blurb: 'Swinging gates, a drawbridge jump, jousting knights and fireball catapults',
  get pts() { return this._pts || (this._pts = CartKit.course(DKP_POLY, { start: [-60, -10], step: 18 })); },   // lazy: the kit loads after this file
  world: (id, D) => dkpWorld(id, D)
};
CART_CAREER_TRACKS.dragon = 'keep';

/* ---------------- static pieces (merged into the world's chunks) ---------------- */
// a castle gatehouse over the road (local x across, z along travel): two round towers with red cone roofs and a
// crenellated span from y0 up to y1. Wd = the gap between the towers. o: { banners, crest, teeth }
function dkpGatehouse(m, Wd, y0, y1, o) {
  o = o || {};
  const tx = Wd / 2 + 3.4, H = y1 + 3, sp = 5.2;
  for (const sd of [-1, 1]) {
    const x = sd * tx;
    m.color('#9a8f7c'); m.cyl(x, 0, 0, 4.3, 4.1, 1.4, 20);
    m.color('#c2b7a2').shine(0); m.cyl(x, 1.4, 0, 3.9, 3.7, H - 1.4, 20);
    m.color('#a89d88'); for (const y of [5, 10]) m.cyl(x, y, 0, 3.78, 3.78, 0.25, 20);
    m.color('#d0c5b0'); m.cyl(x, H - 0.4, 0, 3.7, 4.3, 0.8, 20); m.cyl(x, H + 0.4, 0, 4.3, 4.3, 1.0, 20);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; m.push(); m.tf(x + Math.sin(a) * 3.95, H + 1.9, Math.cos(a) * 3.95, a); m.box(0, 0, 0, 1.3, 1.1, 0.7); m.pop(); }
    m.color('#2a2020'); for (const y of [4, 8.5]) for (const a of [Math.PI / 2 * -sd, 0, Math.PI]) { m.push(); m.tf(x + Math.sin(a) * 3.82, y, Math.cos(a) * 3.82, a); m.box(0, 0, 0, 0.35, 1.4, 0.2); m.ball(0, 0.7, 0, 0.18, { seg: 6, rings: 3 }); m.pop(); }
    m.color('#8e2a24').shine(1); m.push(); m.tf(x, H + 1.2, 0); m.lathe([[4.6, 0], [3.6, 1.6], [0, 7.2]], { seg: 20 }); m.pop();
    m.color('#ffcc44', 0.25).shine(3); m.ball(x, H + 8.6, 0, 0.45, { seg: 8, rings: 6 }); m.shine(0); m.emissive(0);
    m.color('#3a3030'); m.limb(x, H + 8.4, 0, x, H + 11.6, 0, 0.06, 0.05, { seg: 5 });
    m.color(sd > 0 ? '#c8102e' : '#f2b630'); m.push(); m.tf(x, H + 10.8, 0, Math.PI / 2); m.extrude([[0, 0.7], [3.2, 0.25], [2.6, 0], [3.2, -0.25], [0, -0.7]], 0.05); m.pop();
    // banners hang on the tower faces (outside the road)
    if (o.banners) for (const fz of [-1, 1]) { m.color(sd > 0 ? '#c8102e' : '#1e4ab8'); m.push(); m.tf(x, 8.5, fz * 3.95); m.box(0, 0, 0, 1.8, 4.6, 0.08); m.color('#f2b630'); m.box(0, 1.6, fz * 0.05, 1.9, 0.25, 0.04); m.box(0, -0.4, fz * 0.05, 0.25, 3.2, 0.04); m.box(0, 0.2, fz * 0.05, 1.2, 0.25, 0.04); m.extrude([[-0.9, -2.3], [0.9, -2.3], [0, -3.1]], 0.08); m.pop(); }
  }
  // the span: stone block over the road, a darker arch band under it, merlons on both edges
  const W2 = tx * 2 - 4;
  m.color('#c2b7a2'); m.roundBox(0, (y0 + y1) / 2, 0, W2, y1 - y0, sp, 0.25);
  m.color('#8a8070'); m.box(0, y0 + 0.2, 0, W2 - 0.2, 0.4, sp + 0.08); m.box(0, y1 - 0.4, 0, W2, 0.25, sp + 0.1);
  m.color('#d0c5b0'); for (let x = -W2 / 2 + 1; x <= W2 / 2 - 0.9; x += 2.2) for (const fz of [-1, 1]) m.box(x, y1 + 0.6, fz * (sp / 2 - 0.35), 1.3, 1.2, 0.7);
  if (o.teeth) { m.color('#3a3a42').shine(2); for (let x = -Wd / 2 + 0.6; x < Wd / 2; x += 1.1) m.limb(x, y0, 0, x, y0 - 0.9, 0, 0.09, 0.02, { seg: 4 }); m.shine(0); }
  if (o.crest) for (const fz of [-1, 1]) { m.push(); m.tf(0, (y0 + y1) / 2, fz * (sp / 2 + 0.05), fz > 0 ? 0 : Math.PI); m.color('#c8102e').shine(2); m.extrude([[-1.5, 1.4], [1.5, 1.4], [1.5, -0.2], [0, -1.8], [-1.5, -0.2]], 0.16); m.color('#f2b630'); m.push(); m.tf(0, 0, 0.1); m.extrude([[-0.9, 0.9], [0.9, 0.9], [0, -0.9]], 0.06); m.pop(); m.shine(0); m.pop(); }
  return { cols: [{ t: 'cyl', x: -tx, z: 0, r: 4.2, y0: 0, y1: H + 2, camPass: true }, { t: 'cyl', x: tx, z: 0, r: 4.2, y0: 0, y1: H + 2, camPass: true }] };
}
// a drawbridge leaf over a ramp (local z along travel, rising toward +z like CartFeat.ramp): planked deck, iron edges,
// dark skirts, the high end's face, and the gallows frame at its hinge (low) end with chains up to the lip
function dkpLeaf(m, len, w, h) {
  const n = 10, Y = t => h * (t * 0.7 + t * t * 0.3), wd = BURNS_ATLAS.pattern('wood');
  for (let i = 0; i < n; i++) {
    const za = -len / 2 + len * i / n, zb = za + len / n, ya = Y(i / n), yb = Y((i + 1) / n);
    m.color(i % 2 ? '#8a5a32' : '#9a6a3c'); m.poly([[-w / 2, ya + 0.02, za], [w / 2, ya + 0.02, za], [w / 2, yb + 0.02, zb], [-w / 2, yb + 0.02, zb]], null, [0, Math.min(ya, yb) - 2, (za + zb) / 2]);
    m.color('#4a3220'); for (const sd of [-1, 1]) m.poly([[sd * w / 2, 0, za], [sd * w / 2, 0, zb], [sd * w / 2, yb, zb], [sd * w / 2, ya, za]], null, [0, (ya + yb) / 4, (za + zb) / 2]);
    m.color('#5a3a22'); m.limb(-w / 2, ya + 0.06, za, w / 2, ya + 0.06, za, 0.07, 0.07, { seg: 4, ends: false });
  }
  m.color('#4a3220'); m.poly([[-w / 2, 0, len / 2], [w / 2, 0, len / 2], [w / 2, h, len / 2], [-w / 2, h, len / 2]], null, [0, h / 2, 0]);
  m.color('#34343c').shine(2);
  for (const sd of [-1, 1]) { for (let i = 0; i < n; i++) { const za = -len / 2 + len * i / n, zb = za + len / n; m.limb(sd * (w / 2 - 0.15), Y(i / n) + 0.12, za, sd * (w / 2 - 0.15), Y((i + 1) / n) + 0.12, zb, 0.14, 0.14, { seg: 5, ends: false }); } m.torus(sd * (w / 2 - 0.5), h + 0.3, len / 2 - 0.4, 0.35, 0.08, { seg: 10, tseg: 4 }); }
  m.box(0, h - 0.2, len / 2 + 0.02, w, 0.3, 0.06);
  // the gallows frames at the hinge end, chains to the lip
  const px = w / 2 + 1.7, top = h + 8.5;
  for (const sd of [-1, 1]) {
    m.color('#5a3a22').shine(0); m.roundBox(sd * px, top / 2, -len / 2, 0.8, top, 0.8, 0.1, { uv: wd }); m.roundBox(sd * px, top - 0.3, -len / 2 + 0.6, 0.6, 0.6, 2.2, 0.08, { uv: wd });
    m.limb(sd * px, 2.4, -len / 2 - 2.4, sd * px, top - 2, -len / 2, 0.16, 0.14, { seg: 6 });
    m.color('#2a2a30').shine(2); m.torus(sd * px, top - 0.3, -len / 2 + 1.5, 0.3, 0.08, { seg: 10, tseg: 4 });
    const ax = sd * (w / 2 - 0.5), ay = h + 0.3, az = len / 2 - 0.4, bx = sd * px, by = top - 0.3, bz = -len / 2 + 1.5;
    for (let k = 0; k < 14; k++) { const u0 = k / 14, u1 = (k + 1) / 14, sag = 0.9 * Math.sin(u0 * Math.PI), sag1 = 0.9 * Math.sin(u1 * Math.PI); m.limb(lerp(ax, bx, u0), lerp(ay, by, u0) - sag, lerp(az, bz, u0), lerp(ax, bx, u1), lerp(ay, by, u1) - sag1, lerp(az, bz, u1), 0.07, 0.07, { seg: 4, ends: false }); }
    m.shine(0);
  }
  return { cols: [{ t: 'cyl', x: -px, z: -len / 2, r: 0.6, y0: 0, y1: top, camPass: true }, { t: 'cyl', x: px, z: -len / 2, r: 0.6, y0: 0, y1: top, camPass: true }] };
}
// a swinging gate's stone post with a dragon-head finial and a warning bell (local: post at origin)
function dkpGatePost(m) {
  m.color('#9a8f7c'); m.roundBox(0, 0.5, 0, 1.9, 1.0, 1.9, 0.15);
  m.color('#c8bda8'); m.roundBox(0, 2.9, 0, 1.5, 4.4, 1.5, 0.12);
  m.color('#d8cdb8'); m.roundBox(0, 5.25, 0, 1.9, 0.5, 1.9, 0.12);
  // the finial: a little dragon head
  m.color('#3f7a4a').shine(2); m.ellipsoid(0, 6.1, 0, 0.55, 0.6, 0.6, { seg: 10, rings: 7 }); m.ellipsoid(0, 6.15, 0.55, 0.38, 0.32, 0.55, { seg: 9, rings: 6 });
  m.color('#efe2c0'); for (const sd of [-1, 1]) m.limb(sd * 0.25, 6.55, -0.1, sd * 0.45, 7.2, -0.45, 0.1, 0.02, { seg: 5 });
  m.color('#ffb020', 0.9); for (const sd of [-1, 1]) m.ball(sd * 0.28, 6.35, 0.55, 0.09, { seg: 6, rings: 4 }); m.emissive(0).shine(0);
  // the bell on a bracket
  m.color('#3a3030'); m.limb(0, 4.6, 0.75, 0, 4.6, 1.5, 0.06, 0.06, { seg: 5 });
  m.color('#e8b830').shine(3); m.push(); m.tf(0, 4.15, 1.5); m.lathe([[0.05, 0.42], [0.22, 0.32], [0.3, 0], [0.36, -0.06]], { seg: 12 }); m.pop(); m.shine(0);
  m.color('#3a3030').shine(2); for (const y of [1.2, 3.8]) m.cyl(0, y, 0.82, 0.16, 0.16, 0.5, 8); m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.95, hz: 0.95, y0: 0, y1: 6.5 }] };
}
// a catapult's carriage (facing +z: it throws toward +z); the arm is pooled and swings on the axle at y 1.75
function dkpCatapult(m) {
  const wd = BURNS_ATLAS.pattern('wood');
  m.color('#6a4426'); for (const sx of [-1.05, 1.05]) m.roundBox(sx, 0.75, 0, 0.36, 0.36, 4.6, 0.06, { uv: wd });
  for (const z of [-1.8, 0.2, 1.9]) m.roundBox(0, 0.75, z, 2.5, 0.3, 0.32, 0.06, { uv: wd });
  // A-frames up to the axle, the padded stop bar in front
  for (const sx of [-1.05, 1.05]) { m.limb(sx, 0.8, -0.9, sx, 1.85, 0, 0.13, 0.12, { seg: 6 }); m.limb(sx, 0.8, 1.2, sx, 1.85, 0, 0.13, 0.12, { seg: 6 }); m.limb(sx, 0.8, 1.4, sx, 3.5, 0.9, 0.14, 0.12, { seg: 6 }); }
  m.roundBox(0, 3.5, 0.9, 2.5, 0.3, 0.3, 0.08, { uv: wd }); m.color('#c8a060'); m.roundBox(0, 3.5, 0.72, 1.0, 0.5, 0.2, 0.1);
  // the torsion skein (rope) and the axle, the winch at the back
  m.color('#3a3438').shine(2); m.limb(-1.2, 1.75, 0, 1.2, 1.75, 0, 0.11, 0.11, { seg: 6 }); m.shine(0);
  m.color('#b89a6a'); m.cyl(0, 1.75, 0, 0.32, 0.32, 0.01, 8); m.push(); m.tf(0, 1.75, 0, 0, 0, Math.PI / 2); m.cyl(0, -0.75, 0, 0.36, 0.36, 1.5, 10); m.pop();
  m.color('#5a3a22'); m.push(); m.tf(0, 1.05, -2.0, 0, 0, Math.PI / 2); m.cyl(0, -1.0, 0, 0.22, 0.22, 2.0, 8); m.pop();
  for (const sx of [-1.2, 1.2]) { m.color('#4a3020'); m.push(); m.tf(sx, 1.05, -2.0, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.42, 0.06, { seg: 8, tseg: 3 }); m.pop(); }
  // four wheels with iron tyres
  for (const sx of [-1.35, 1.35]) for (const z of [-1.5, 1.5]) { m.push(); m.tf(sx, 0.62, z, 0, 0, Math.PI / 2); m.color('#7a5030'); m.cyl(0, -0.14, 0, 0.6, 0.6, 0.28, 12); m.color('#3a3a40').shine(2); m.torus(0, 0, 0, 0.6, 0.06, { seg: 14, tseg: 3 }); m.shine(0); m.pop(); }
  // a stack of spare stone balls and a brazier
  m.color('#8a8478'); for (const [x, z] of [[1.9, -1.4], [2.4, -1.0], [2.2, -1.9]]) m.ball(x, 0.4, z, 0.4, { seg: 8, rings: 6 }); m.ball(2.15, 0.95, -1.45, 0.38, { seg: 8, rings: 6 });
  m.color('#3a3438').shine(2); m.lathe([[0.0, 0], [0.2, 0.05], [0.25, 0.9], [0.55, 1.15], [0.6, 1.3]], { seg: 10 }); m.shine(0);
  m.color('#ff8a2a', 1); m.ball(0, 1.35, 0, 0.42, { seg: 8, rings: 5 }); m.color('#ffd060', 1); m.ellipsoid(0, 1.6, 0, 0.2, 0.45, 0.2, { seg: 6, rings: 4 }); m.emissive(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.6, hz: 2.4, y0: 0, y1: 3 }], lights: [{ x: 0, y: 1.6, z: 0, s: 1.3, c: '#ff8a2a' }] };
}
// THE KEEP: a square stone tower with four round turrets, and the OLD WYRM (a bronze dragon) curled on its roof
function dkpKeep(m) {
  const H = 22, B = 24;
  m.color('#9a8f7c'); m.roundBox(0, 1, 0, B + 2, 2, B + 2, 0.3);
  m.color('#c4b9a4'); m.roundBox(0, H / 2 + 1, 0, B, H, B, 0.35);
  m.color('#a89d88'); for (const y of [7, 14]) m.roundBox(0, y, 0, B + 0.15, 0.35, B + 0.15, 0.1);
  m.color('#d4c9b4'); m.roundBox(0, H + 1.2, 0, B + 1.2, 0.8, B + 1.2, 0.15);
  for (let f = 0; f < 4; f++) {
    const a = f * Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
    // windows (arched, dark), a big door on the south face, merlons along the top
    for (const y of [9.5, 16.5]) for (const u of [-6, 0, 6]) { m.push(); m.tf(s * (B / 2 + 0.02) + c * u, y, c * (B / 2 + 0.02) - s * u, a); m.color('#241c1a'); m.box(0, 0, 0, 1.3, 2.4, 0.1); m.ball(0, 1.2, 0, 0.65, { seg: 8, rings: 4 }); m.color('#ffc86a', 0.5); m.box(0, -0.2, 0.02, 0.9, 1.4, 0.06); m.emissive(0); m.pop(); }
    for (let u = -B / 2 + 1.5; u <= B / 2 - 1.4; u += 2.4) { m.color('#d4c9b4'); m.push(); m.tf(s * (B / 2 + 0.3) + c * u, H + 2.3, c * (B / 2 + 0.3) - s * u, a); m.box(0, 0, 0, 1.4, 1.5, 0.9); m.pop(); }
    // banners down each face
    m.push(); m.tf(s * (B / 2 + 0.06) + c * -9.5, 13, c * (B / 2 + 0.06) - s * -9.5, a); m.color(f % 2 ? '#1e4ab8' : '#c8102e'); m.box(0, 0, 0, 2.2, 8, 0.08); m.color('#f2b630'); m.box(0, 2.4, 0.05, 2.25, 0.3, 0.04); m.extrude([[-1.1, -4], [1.1, -4], [0, -5.2]], 0.08); m.pop();
    m.push(); m.tf(s * (B / 2 + 0.06) + c * 9.5, 13, c * (B / 2 + 0.06) - s * 9.5, a); m.color(f % 2 ? '#c8102e' : '#1e4ab8'); m.box(0, 0, 0, 2.2, 8, 0.08); m.color('#f2b630'); m.box(0, 2.4, 0.05, 2.25, 0.3, 0.04); m.extrude([[-1.1, -4], [1.1, -4], [0, -5.2]], 0.08); m.pop();
  }
  m.push(); m.tf(0, 0, B / 2 + 0.05, 0); m.color('#4a3020'); m.box(0, 3.2, 0, 5, 6.4, 0.2); m.ball(0, 6.4, 0, 2.5, { seg: 12, rings: 5 }); m.color('#2a2a30').shine(2); for (const x of [-1.6, 0, 1.6]) m.box(x, 3.6, 0.12, 0.18, 7.5, 0.06); m.shine(0); m.pop();
  // corner turrets
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const cx = x * B / 2, cz = z * B / 2, th = H + 7;
    m.color('#c8bda8'); m.cyl(cx, 0, cz, 4.0, 3.6, th, 20); m.color('#d4c9b4'); m.cyl(cx, th - 0.4, cz, 3.6, 4.2, 0.8, 20); m.cyl(cx, th + 0.4, cz, 4.2, 4.2, 1.2, 20);
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; m.push(); m.tf(cx + Math.sin(a) * 3.9, th + 2.0, cz + Math.cos(a) * 3.9, a); m.box(0, 0, 0, 1.3, 1.0, 0.7); m.pop(); }
    m.color('#8e2a24').shine(1); m.push(); m.tf(cx, th + 1.0, cz); m.lathe([[4.5, 0], [3.4, 2], [0, 8.5]], { seg: 20 }); m.pop();
    m.color('#ffcc44', 0.3).shine(3); m.ball(cx, th + 9.9, cz, 0.5, { seg: 8, rings: 6 }); m.emissive(0).shine(0);
    m.color('#3a3030'); m.limb(cx, th + 9.7, cz, cx, th + 13.5, cz, 0.07, 0.06, { seg: 5 });
    m.color(x * z > 0 ? '#c8102e' : '#f2b630'); m.push(); m.tf(cx, th + 12.6, cz, Math.PI / 2 + x * 0.4); m.extrude([[0, 0.8], [4, 0.3], [3.3, 0], [4, -0.3], [0, -0.8]], 0.06); m.pop();
  }
  // THE OLD WYRM: body, neck, head, horns, wings, tail, claws (bronze-green with a gold belly and glowing eyes)
  const Y = H + 1.6;
  m.color('#3f7a4a').shine(2);
  m.ellipsoid(0, Y + 3.2, -2, 4.4, 3.2, 6.8, { seg: 18, rings: 12 });
  const neck = [[0, Y + 4.5, 3.4], [0, Y + 7.2, 5.6], [0, Y + 10.4, 6.4], [0, Y + 12.4, 8.2]], nr = [2.4, 2.0, 1.7, 1.45];
  for (let i = 0; i < 3; i++) m.limb(neck[i][0], neck[i][1], neck[i][2], neck[i + 1][0], neck[i + 1][1], neck[i + 1][2], nr[i], nr[i + 1], { seg: 12 });
  m.color('#e8b84a').shine(2); for (let i = 0; i < 6; i++) { const u = i / 5, p = [0, lerp(Y + 4.5, Y + 12, u), lerp(4.6, 9.2, u)]; m.ellipsoid(p[0], p[1], p[2] + 1.1 - u * 0.4, 1.3 - u * 0.3, 0.5, 0.45, { seg: 8, rings: 4 }); }
  m.color('#3f7a4a');
  m.ellipsoid(0, Y + 12.8, 10, 1.8, 1.6, 2.5, { seg: 14, rings: 10 }); m.ellipsoid(0, Y + 12.3, 12.4, 1.25, 1.05, 1.7, { seg: 12, rings: 8 });
  m.color('#e8b84a'); m.ellipsoid(0, Y + 11.5, 11.7, 1.15, 0.5, 1.8, { seg: 10, rings: 6 });
  m.color('#efe2c0'); for (const sd of [-1, 1]) { m.limb(sd * 0.9, Y + 14, 9.3, sd * 1.8, Y + 16.4, 7.2, 0.38, 0.05, { seg: 7 }); m.limb(sd * 0.6, Y + 11.6, 13.4, sd * 0.6, Y + 11.0, 13.6, 0.12, 0.02, { seg: 4 }); }
  m.color('#1a1414'); for (const sd of [-1, 1]) m.ball(sd * 0.45, Y + 12.6, 14.0, 0.2, { seg: 6, rings: 4 });
  m.color('#ffb020', 1); for (const sd of [-1, 1]) m.ellipsoid(sd * 1.05, Y + 13.4, 11.2, 0.28, 0.22, 0.32, { seg: 8, rings: 5 }); m.emissive(0);
  m.color('#e8b84a'); for (let i = 0; i < 9; i++) { const u = i / 8, y = lerp(Y + 6.4, Y + 14.6, u), z = lerp(-7, 9.6, u) - (u > 0.5 ? 0 : 0); const yy = u < 0.45 ? Y + 6.2 + Math.sin(u / 0.45 * Math.PI) * 0.4 : y; m.limb(0, yy - 0.2, z, 0, yy + 1.1, z - 0.5, 0.42, 0.04, { seg: 5 }); }
  m.color('#356a40');
  for (const sd of [-1, 1]) {
    m.push(); m.tf(sd * 3.6, Y + 5.2, -2.4, sd * 0.35, 0, -sd * 0.55);
    const P = [[0, 0], [sd * 3.2, 4.4], [sd * 7.8, 9.6], [sd * 9.2, 6.4], [sd * 8.0, 3.6], [sd * 10.2, 1.2], [sd * 6.4, 0.6], [sd * 6.8, -1.6], [sd * 3.0, -1.2]];
    m.extrude(sd > 0 ? P : P.slice().reverse(), 0.25, { convex: false });
    m.color('#2a4a30'); m.limb(0, 0, 0, sd * 7.8, 9.6, 0, 0.35, 0.15, { seg: 6 }); for (const q of [P[3], P[5], P[7]]) m.limb(sd * 6.2, 7.6, 0, q[0], q[1], 0, 0.14, 0.05, { seg: 4 }); m.color('#356a40'); m.pop();
  }
  const tail = [[0, Y + 2.6, -8.4], [-2.6, Y + 1.6, -11.2], [-6.2, Y + 1.0, -11.6], [-9.4, Y + 0.6, -9.0], [-11.0, Y + 0.4, -5.2]], tr = [2.2, 1.6, 1.15, 0.8, 0.45];
  m.color('#3f7a4a'); for (let i = 0; i < 4; i++) m.limb(tail[i][0], tail[i][1], tail[i][2], tail[i + 1][0], tail[i + 1][1], tail[i + 1][2], tr[i], tr[i + 1], { seg: 10 });
  m.color('#e8b84a').shine(3); m.push(); m.tf(-11.2, Y + 0.4, -4.4, 0, 0, Math.PI / 2); m.extrude([[0, 1.4], [1.0, 0], [0, -0.4], [-1.0, 0]], 0.3); m.pop(); m.shine(0);
  m.color('#3f7a4a'); for (const [x, z, fz] of [[-3, 2.4, 1], [3, 2.4, 1], [-3.2, -6.2, -1], [3.2, -6.2, -1]]) { m.limb(x, Y + 2.6, z, x * 1.25, Y + 0.3, z + fz * 1.2, 0.95, 0.6, { seg: 8 }); m.color('#efe2c0'); for (const cx of [-0.35, 0, 0.35]) m.limb(x * 1.25 + cx, Y + 0.3, z + fz * 1.6, x * 1.25 + cx, Y - 0.1, z + fz * 2.1, 0.14, 0.03, { seg: 4 }); m.color('#3f7a4a'); }
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: B / 2 + 4, hz: B / 2 + 4, y0: 0, y1: H + 8 }] };
}

/* ---------------- instanced props (this world only) ---------------- */
const DKP_KINDS = {
  // a 12 m stretch of curtain wall (long axis local z, outer face +x): plinth, stone courses, arrow slits, merlons
  dkp_wall: { r: 7, near: 55, mid: 150, farD: 420, soft: 0.6,
    build(m) {
      m.color('#9a8f7c'); m.roundBox(0, 0.6, 0, 3.6, 1.2, 12.04, 0.2);
      m.color('#c4b9a4').shine(0); m.roundBox(0, 3.9, 0, 3.0, 6.6, 12.02, 0.12);
      m.color('#a89d88'); for (const y of [2.6, 5.0]) m.box(0, y, 0, 3.08, 0.18, 12.0);
      const tones = ['#b4a994', '#d2c7b2', '#a99e8a'];
      for (const sd of [-1, 1]) for (let j = 0; j < 7; j++) { m.color(tones[j % 3]); m.box(sd * 1.52, 1.8 + (j * 1.7) % 5, -5 + j * 1.6 + (j % 2) * 0.4, 0.06, 0.7, 1.3); }
      m.color('#d4c9b4'); for (let i = 0; i < 6; i++) for (const sd of [-1, 1]) m.box(sd * 1.22, 7.75, -5 + i * 2, 0.56, 1.3, 1.25);
      m.color('#2a2020'); for (const z of [-3, 3]) m.box(1.53, 4.0, z, 0.05, 1.3, 0.28);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.6, hz: 6, y0: 0, y1: 8.4 }] };
    },
    far(m) { m.color('#c4b9a4'); m.box(0, 3.6, 0, 3.2, 7.2, 12); m.color('#d4c9b4'); for (let i = 0; i < 6; i++) m.box(1.22, 7.75, -5 + i * 2, 0.56, 1.3, 1.25); } },
  // a round wall tower with a red cone roof and a pennant
  dkp_tower: { r: 5, near: 55, mid: 160, farD: 440, soft: 0.6,
    build(m) {
      m.color('#9a8f7c'); m.cyl(0, 0, 0, 4.2, 4.0, 1.2, 18);
      m.color('#c4b9a4'); m.cyl(0, 1.2, 0, 3.7, 3.5, 11.6, 18);
      m.color('#d4c9b4'); m.cyl(0, 12.4, 0, 3.5, 4.1, 0.7, 18); m.cyl(0, 13.1, 0, 4.1, 4.1, 0.9, 18);
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; m.push(); m.tf(Math.sin(a) * 3.8, 14.4, Math.cos(a) * 3.8, a); m.box(0, 0, 0, 1.3, 1.0, 0.6); m.pop(); }
      m.color('#2a2020'); for (const a of [0, 2.1, 4.2]) { m.push(); m.tf(Math.sin(a) * 3.62, 7, Math.cos(a) * 3.62, a); m.box(0, 0, 0, 0.32, 1.3, 0.2); m.pop(); }
      m.color('#8e2a24').shine(1); m.push(); m.tf(0, 13.8, 0); m.lathe([[4.4, 0], [3.3, 1.5], [0, 6.6]], { seg: m.lo ? 10 : 18 }); m.pop();
      m.color('#ffcc44').shine(3); m.ball(0, 20.5, 0, 0.35, { seg: 6, rings: 4 }); m.shine(0);
      m.color('#3a3030'); m.limb(0, 20.4, 0, 0, 23.2, 0, 0.05, 0.04, { seg: 4 }); m.color('#c8102e'); m.push(); m.tf(0, 22.6, 0, Math.PI / 2); m.extrude([[0, 0.5], [2.6, 0.2], [2.1, 0], [2.6, -0.2], [0, -0.5]], 0.05); m.pop();
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 4.0, y0: 0, y1: 14 }] };
    },
    far(m) { m.color('#c4b9a4'); m.cyl(0, 0, 0, 3.8, 3.8, 13.8, 8, {}); m.color('#8e2a24'); m.cyl(0, 13.8, 0, 4.4, 0, 6.6, 8, {}); } },
  // a timber-framed town house: plaster walls, dark beams, a steep roof, a chimney, warm windows
  dkp_house: { r: 5, near: 42, mid: 130, farD: 320, soft: 0.5,
    build(m) {
      m.color('#9a8f7c'); m.roundBox(0, 0.4, 0, 6.4, 0.8, 5.4, 0.1);
      m.color('#f2e8d4'); m.roundBox(0, 3.0, 0, 6.0, 4.6, 5.0, 0.06);
      m.color('#4a3020'); for (const x of [-3.0, -1, 1, 3.0]) for (const sd of [-1, 1]) m.box(x, 3.0, sd * 2.52, 0.22, 4.6, 0.06);
      for (const y of [0.85, 3.0, 5.25]) for (const sd of [-1, 1]) m.box(0, y, sd * 2.52, 6.1, 0.2, 0.06);
      for (const sd of [-1, 1]) { m.push(); m.tf(-2, 2.0, sd * 2.53, 0, 0, 0.75); m.box(0, 0, 0, 0.16, 2.6, 0.05); m.pop(); m.push(); m.tf(2, 2.0, sd * 2.53, 0, 0, -0.75); m.box(0, 0, 0, 0.16, 2.6, 0.05); m.pop(); }
      m.color('#ffc86a', 0.55); for (const x of [-2, 0, 2]) m.box(x, 4.2, 2.55, 0.8, 0.8, 0.05); m.emissive(0);
      m.color('#5a3a22'); m.box(0, 1.45, 2.56, 1.0, 1.9, 0.06);
      m.color('#ffffff').shine(1); for (const sd of [-1, 1]) { m.push(); m.tf(0, 6.6, sd * 1.45, 0, sd * -0.95, 0); m.box(0, 0, 0, 6.8, 0.22, 3.8); m.pop(); }
      m.color('#9a8f7c').shine(0); m.box(-0.9, 1, 0, 0.1, 0.1, 0.1); m.roundBox(1.8, 7.6, -0.8, 0.8, 2.4, 0.8, 0.08);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 3.2, hz: 2.7, y0: 0, y1: 8 }] };
    },
    far(m) { m.color('#f2e8d4'); m.box(0, 2.8, 0, 6, 5.2, 5); m.color('#ffffff'); m.cyl(0, 5.3, 0, 3.6, 0, 3.4, 4, { yaw0: Math.PI / 4 }); } },
  // a round oak (tinted greens; near-white leaves)
  dkp_tree: { r: 4, soft: 0.1, near: 38, mid: 130, farD: 330,
    build(m) {
      m.color('#5a4030'); m.limb(0, 0, 0, 0.2, 3.6, 0, 0.45, 0.3, { seg: m.lo ? 6 : 9 }); m.limb(0.15, 3, 0, 1.4, 4.6, 0.3, 0.2, 0.12, { seg: 5 }); m.limb(0.1, 3.2, 0, -1.2, 4.8, -0.4, 0.2, 0.12, { seg: 5 });
      m.color('#ffffff'); const B = [[0, 6.0, 0, 2.6], [1.6, 5.0, 0.6, 1.8], [-1.6, 5.2, -0.4, 1.9], [0.4, 5.0, -1.6, 1.7], [-0.3, 7.4, 0.3, 1.6]];
      for (const [x, y, z, r] of B) m.ellipsoid(x, y, z, r, r * 0.85, r, { seg: m.lo ? 7 : 11, rings: m.lo ? 5 : 7 });
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.6, y0: 0, y1: 5 }] };
    },
    far(m) { m.color('#5a4030'); m.cyl(0, 0, 0, 0.4, 0.3, 4, 5, {}); m.color('#ffffff'); m.ellipsoid(0, 5.8, 0, 3.0, 2.4, 3.0, { seg: 6, rings: 4 }); } },
  // a roadside torch: an iron post, a bowl, a burning flame (emissive)
  dkp_torch: { r: 0.8, near: 34, mid: 100, farD: 220, shadow: false, noAO: true, glows: [[0, 3.45, 0, 1.3]],
    build(m) {
      m.color('#2a2a30').shine(2); m.limb(0, 0, 0, 0, 2.9, 0, 0.08, 0.06, { seg: 6 }); m.push(); m.tf(0, 2.9, 0); m.lathe([[0.05, 0], [0.32, 0.18], [0.4, 0.42]], { seg: 10 }); m.pop();
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; m.limb(0, 2.4, 0, Math.sin(a) * 0.35, 3.3, Math.cos(a) * 0.35, 0.03, 0.03, { seg: 3 }); }
      m.color('#ff7a1a', 1).shine(0); m.ellipsoid(0, 3.5, 0, 0.32, 0.45, 0.32, { seg: 8, rings: 6 }); m.color('#ffd060', 1); m.ellipsoid(0, 3.62, 0, 0.17, 0.42, 0.17, { seg: 6, rings: 5 }); m.emissive(0);
    },
    far(m) { m.color('#2a2a30'); m.box(0, 1.5, 0, 0.12, 3, 0.12); m.color('#ff9a2a', 1); m.box(0, 3.5, 0, 0.5, 0.7, 0.5); m.emissive(0); } },
  // a heraldic banner on a tall pole (near-white cloth: tinted)
  dkp_banner: { r: 1, near: 38, mid: 120, farD: 280, shadow: false,
    build(m) {
      m.color('#3a3030'); m.limb(0, 0, 0, 0, 7.2, 0, 0.08, 0.06, { seg: 6 }); m.limb(0, 6.8, 0, 0, 6.8, 1.4, 0.04, 0.04, { seg: 4 });
      m.color('#e8b830').shine(3); m.ball(0, 7.3, 0, 0.16, { seg: 6, rings: 4 }); m.shine(0);
      m.color('#ffffff'); m.push(); m.tf(0, 5.2, 0.75, Math.PI / 2); m.extrude([[-0.7, 1.55], [0.7, 1.55], [0.7, -1.4], [0, -0.85], [-0.7, -1.4]], 0.06); m.pop();
      m.color('#e8b830'); m.push(); m.tf(0.05, 5.4, 0.75, Math.PI / 2); m.extrude([[-0.35, 0.5], [0.35, 0.5], [0, -0.4]], 0.08); m.pop();
    },
    far(m) { m.color('#3a3030'); m.box(0, 3.6, 0, 0.12, 7.2, 0.12); m.color('#ffffff'); m.box(0, 5.2, 0.75, 0.06, 3, 1.4); } },
  // a striped tournament pavilion (tinted stripes) with a pennant on top
  dkp_tent: { r: 4, near: 44, mid: 140, farD: 340,
    build(m) {
      const st = ['#ffffff', '#e8c040']; m.color('#ffffff');
      m.cyl(0, 0, 0, 3.4, 3.4, 3.0, 16, { stripes: st, smooth: false }); m.cyl(0, 3.0, 0, 3.7, 0, 3.6, 16, { stripes: st, smooth: false });
      m.color('#ffffff'); for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * TAU; m.push(); m.tf(Math.sin(a) * 3.62, 2.8, Math.cos(a) * 3.62, a); m.extrude([[-0.7, 0.2], [0.7, 0.2], [0, -0.45]], 0.04); m.pop(); }
      m.color('#2a1a14'); m.box(0, 1.2, 3.42, 1.4, 2.4, 0.06);
      m.color('#3a3030'); m.limb(0, 6.5, 0, 0, 8.4, 0, 0.05, 0.04, { seg: 4 }); m.color('#ffffff'); m.push(); m.tf(0, 7.9, 0, Math.PI / 2); m.extrude([[0, 0.35], [1.8, 0], [0, -0.35]], 0.04); m.pop();
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.5, y0: 0, y1: 6 }] };
    },
    far(m) { m.color('#ffffff'); m.cyl(0, 0, 0, 3.4, 3.4, 3, 8, {}); m.cyl(0, 3, 0, 3.7, 0, 3.6, 8, {}); } },
  // the road barrier: a 7 m tournament fence (dark posts, two painted boards: tinted)
  dkp_fence: { r: 4.2, near: 32, mid: 110, farD: 330, noAO: true, shadow: false,
    build(m) {
      m.color('#4a3020'); for (const z of [-3.3, 0, 3.3]) { m.roundBox(0, 0.62, z, 0.28, 1.24, 0.28, 0.05); m.ball(0, 1.28, z, 0.17, { seg: 6, rings: 4 }); }
      m.color('#ffffff').shine(1); m.roundBox(0, 0.95, 0, 0.14, 0.36, 7.04, 0.05); m.roundBox(0, 0.45, 0, 0.14, 0.3, 7.04, 0.05); m.shine(0);
      m.color('#2a1a14'); for (const z of [-1.65, 1.65]) { m.push(); m.tf(0.08, 0.95, z); m.extrude([[0, 0.17], [0.3, 0], [0, -0.17], [-0.3, 0]], 0.02); m.pop(); }
    },
    far(m) { m.color('#ffffff'); m.box(0, 0.95, 0, 0.14, 0.36, 7.04); m.box(0, 0.45, 0, 0.14, 0.3, 7.04); m.color('#4a3020'); m.box(0, 0.6, 0, 0.2, 1.2, 0.2); } },
  // a 7 m wall of round hay bales on the tight bends (golden, a tinted ribbon round the middle one)
  dkp_hay: { r: 4.2, near: 32, mid: 110, farD: 330, noAO: true, soft: 0.65,
    build(m) {
      for (const z of [-2.4, 0, 2.4]) { m.push(); m.tf(0, 0.75, z, Math.PI / 2, 0, Math.PI / 2); m.color('#e8c46a'); m.cyl(0, -1.0, 0, 0.75, 0.75, 2.0, m.lo ? 8 : 12, {}); m.color('#ffffff'); m.cyl(0, -0.12, 0, 0.77, 0.77, 0.24, m.lo ? 8 : 12, { caps: false }); m.pop(); }
      m.color('#d8b058'); m.push(); m.tf(0, 1.9, 0, Math.PI / 2, 0, Math.PI / 2); m.cyl(0, -0.9, 0, 0.6, 0.6, 1.8, m.lo ? 8 : 10, {}); m.pop();
    },
    far(m) { m.color('#e8c46a'); m.box(0, 0.75, 0, 1.5, 1.5, 7); } }
};

/* ---------------- building the world ---------------- */
function dkpWorld(id, D) {
  const sky = Object.assign(CART_SKIES.sunset(), { zen: '#2a2456', hor: '#ff8a4a', sky: '#8a78b8', fog: '#c08068', fogD: 0.0046, mid: '#c06a6a', midK: 0.3, mtnCol: '#4a3a5a', mtnH: 4.4, clouds: 0.6, cloudCol: '#f0a080', key: '#ffcf98', keyK: 1.0 });
  const W = CartKit.world(id, D, { worldId: 1240, night: false, sky, ground: '#6c8a46', crack: 0,
    road: { shoulder: 'rgba(110,92,62,0.6)', band: 'rgba(132,122,108,0.95)', edge: 'rgba(255,236,180,0.95)', edgeW: 0.6, centerFn: dkpPaintCenter } });
  const { E, T, api, rng } = W;
  const S = { gate1: CartKit.sOf(T, 40, -10), gate2: CartKit.sOf(T, 105, -10), bridge: CartKit.sOf(T, 219, 127), lists0: CartKit.sOf(T, 22, 237), lists1: CartKit.sOf(T, -74, 231), port: CartKit.sOf(T, -139, 185), cats: [CartKit.sOf(T, 172, 183), CartKit.sOf(T, 112, 168), CartKit.sOf(T, 66, 207)], descent: CartKit.sOf(T, -186, 70), camp: CartKit.sOf(T, 205, 40) };
  const keep = { x: 25, z: 105 };
  E.dkp = { S, keep };
  const side = (s, sd, off) => { const g = T.at(((s % T.L) + T.L) % T.L, {}), o = sd > 0 ? g.wr + off : -g.wl - off; return { x: g.x + g.nx * o, z: g.z + g.nz * o, yaw: Math.atan2(-g.nx * sd, -g.nz * sd), g }; };
  const taken = [[keep.x, keep.z, 52]];
  const free = (x, z, r) => taken.every(q => Math.hypot(q[0] - x, q[1] - z) > q[2] + r) && CartWorlds.clear(T, x, z, r);
  const bg = T.at(S.bridge, {});
  // ---- ground paint: meadow patches, dirt paths, the moat, the sand of the lists, the bailey's flagstones ----
  api.paint((ctx, P, Sc) => {
    for (let i = 0; i < 260; i++) { const x = (rng() - 0.5) * 560 + 20, z = (rng() - 0.5) * 420 + 110, q = P(x, z); ctx.fillStyle = rng() < 0.5 ? `rgba(60,90,30,${0.15 + rng() * 0.15})` : `rgba(150,170,70,${0.1 + rng() * 0.12})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (4 + rng() * 14) * Sc, (2 + rng() * 8) * Sc, rng() * 3, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 140; i++) { const x = (rng() - 0.5) * 560 + 20, z = (rng() - 0.5) * 420 + 110, q = P(x, z); ctx.fillStyle = ['rgba(255,240,120,0.55)', 'rgba(255,255,255,0.5)', 'rgba(230,120,200,0.45)'][i % 3]; ctx.beginPath(); ctx.arc(q[0], q[1], 0.35 * Sc, 0, TAU); ctx.fill(); }
    // the keep's courtyard: flagstones in rings, a path to the King's Road
    const c0 = P(keep.x, keep.z); ctx.fillStyle = 'rgba(160,148,128,0.9)'; ctx.beginPath(); ctx.arc(c0[0], c0[1], 44 * Sc, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(110,100,86,0.5)'; ctx.lineWidth = 0.2 * Sc; for (let r = 18; r < 44; r += 3) { ctx.beginPath(); ctx.arc(c0[0], c0[1], r * Sc, 0, TAU); ctx.stroke(); }
    { const a = P(keep.x, keep.z - 40), b = P(keep.x, -2); ctx.strokeStyle = 'rgba(150,120,80,0.6)'; ctx.lineWidth = 6 * Sc; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    // the moat: a band of water across the road at the drawbridge gap, running away on both sides, stone edges
    const g = bg, len = 85;
    for (const [col, wd] of [['rgba(120,110,96,0.95)', 9.4], ['#2f5e7a', 7.6], ['rgba(90,150,180,0.5)', 3]]) { const a = P(g.x - g.nx * len, g.z - g.nz * len), b = P(g.x + g.nx * len, g.z + g.nz * len); ctx.strokeStyle = col; ctx.lineWidth = wd * Sc; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    // the lists: raked sand down the middle of the road, a painted tilt line between the two lanes
    for (let s = S.lists0 - 6; s < S.lists1 + 6; s += 2) { const q = T.at(s, {}), p = P(q.x, q.z); ctx.fillStyle = 'rgba(214,180,120,0.55)'; ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(Math.atan2(q.tz, q.tx)); ctx.fillRect(-1.2 * Sc, -(q.hw - 0.6) * Sc, 2.4 * Sc, (q.hw - 0.6) * 2 * Sc); ctx.restore(); }
    for (let s = S.lists0; s < S.lists1; s += 3) { const q = T.at(s, {}), p = P(q.x, q.z); ctx.fillStyle = Math.floor(s / 3) % 2 ? 'rgba(200,16,46,0.9)' : 'rgba(255,255,255,0.9)'; ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(Math.atan2(q.tz, q.tx)); ctx.fillRect(-1.5 * Sc, -0.25 * Sc, 3 * Sc, 0.5 * Sc); ctx.restore(); }
    // flagstones under the gates and the sally port
    for (const sv of [S.gate1, S.gate2, S.port]) { const q = T.at(sv, {}); for (let i = -3; i <= 3; i++) for (let j = -7; j <= 7; j++) { const x = q.x + q.tx * i * 1.6 + q.nx * j * 1.6, z = q.z + q.tz * i * 1.6 + q.nz * j * 1.6, p = P(x, z); ctx.fillStyle = (i + j) % 2 ? 'rgba(170,160,140,0.55)' : 'rgba(140,130,114,0.55)'; ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(Math.atan2(q.tz, q.tx)); ctx.fillRect(-0.75 * Sc, -0.75 * Sc, 1.5 * Sc, 1.5 * Sc); ctx.restore(); } }
  });
  // ---- barriers: a tournament fence in heraldic colours, hay bales on the tight bends; torches ----
  CartDecor.protos(E); CartKit.kinds(E, DKP_KINDS);
  for (let s = 0, i = 0; s < T.L; s += 7, i++) { const g = T.at(s, {}), tight = Math.abs(g.k) > 0.014; for (const sd of [1, -1]) { const off = sd > 0 ? g.wr : -g.wl; CartKit.put(E, tight ? 'dkp_hay' : 'dkp_fence', g.x + g.nx * off, g.z + g.nz * off, g.yaw, tight ? (i % 2 ? '#c8102e' : '#ffffff') : ['#c8102e', '#ffffff', '#f2b630', '#ffffff'][i % 4], { y: 0, noLights: true }); } }
  for (let s = 6, k = 0; s < T.L; s += 26, k++) { const p = side(s, k % 2 ? 1 : -1, 1.4); if (CartWorlds.clear(T, p.x, p.z, 0.5)) CartKit.put(E, 'dkp_torch', p.x, p.z, 0, '#ffffff', { y: 0 }); }
  // ---- the start: the gatehouse over the line, crowds, heroes, the town ----
  { const g = T.at(0, {}), Wd = g.wl + g.wr + 2;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => dkpGatehouse(m, Wd, 10, 15, { banners: true, crest: false }), { hi: true });
    api.sign('DRAGON\'S KEEP', g.x - g.tx * 2.75, g.z - g.tz * 2.75, { yaw: g.yaw + Math.PI, h: 2.4, y: 11.2, post: false, maxW: 15, style: { bg: '#5a1018', fg: '#ffe6a0', border: '#f2b630' } });
    api.sign('DRAGON\'S KEEP', g.x + g.tx * 2.75, g.z + g.tz * 2.75, { yaw: g.yaw, h: 2.4, y: 11.2, post: false, maxW: 15, style: { bg: '#5a1018', fg: '#ffe6a0', border: '#f2b630' } });
    for (const sd of [1, -1]) { const p = side(18, sd, 7); E.spots.push(...CartScene.bleachers(api, p.x, p.z, p.yaw, 20, 3, rng)); taken.push([p.x, p.z, 14]); }
    taken.push([g.x, g.z, 14]);
    const heroes = ['greeter_f', 'burnermom', 'sparklepony', 'greeter_m', 'partyboy', 'furry'];
    heroes.forEach((type, i) => { const p = side(-10 + Math.floor(i / 2) * 8, i % 2 ? 1 : -1, 2.2); E.heroes.push({ type, x: p.x, z: p.z, yaw: p.yaw, anim: i % 3 === 0 ? 'cheer' : 'wave' }); });
    CartKit.crowd(E, T, 30, 90, -1, rng, { rows: 2, off: 3, gap: 1.8 });
  }
  // ---- the King's Road: the swinging gates (stone posts; the leaves are pooled), the town on both sides ----
  E.dkp.gates = [];
  for (const sv of [S.gate1, S.gate2]) {
    const g = T.at(sv, {}), q = { s: sv, x: g.x, z: g.z, tx: g.tx, tz: g.tz, nx: g.nx, nz: g.nz, yaw: g.yaw, leaves: [] };
    for (const sd of [-1, 1]) { const wall = sd > 0 ? g.wr : g.wl, d = sd * (wall + 0.7), x = g.x + g.nx * d, z = g.z + g.nz * d; CartScene.mesh(api, x, z, Math.atan2(-g.nx * sd, -g.nz * sd), dkpGatePost, { hi: true }); q.leaves.push({ sd, px: x, pz: z, len: wall + 0.4 }); taken.push([x, z, 5]); }
    E.dkp.gates.push(q);
  }
  for (let s = 40, k = 0; s < S.gate2 + 60; s += 15, k++) for (const sd of [1, -1]) { const p = side(s + (sd > 0 ? 7 : 0), sd, 9 + (k % 3) * 1.5); if (free(p.x, p.z, 4)) { CartKit.put(E, 'dkp_house', p.x, p.z, p.yaw + Math.PI / 2 * (k % 2 ? 1 : 0), ['#ffffff', '#f4e0c8', '#e8eef8', '#f8e8e0'][(k + (sd > 0 ? 1 : 0)) % 4]); taken.push([p.x, p.z, 4]); } }
  for (let s = 30, k = 0; s < S.gate2 + 40; s += 22, k++) for (const sd of [1, -1]) { const p = side(s, sd, 18 + (k % 2) * 4); if (free(p.x, p.z, 4)) { CartKit.put(E, 'dkp_house', p.x, p.z, p.yaw + 0.3 * (k % 3 - 1), ['#f4e0c8', '#ffffff', '#e0e8f0'][k % 3], { scale: 1.15 }); taken.push([p.x, p.z, 5]); } }
  // the town wall along the outside of the King's Road, a tower every few stretches
  { const g0 = T.at(30, {}); let k = 0; for (let x = g0.x - 140; x < 150; x += 12, k++) { const z = -10 - g0.wr - 32; if (k % 5 === 4) { CartKit.put(E, 'dkp_tower', x, z, 0, '#ffffff'); taken.push([x, z, 5]); continue; } CartKit.put(E, 'dkp_wall', x, z, Math.PI / 2, '#ffffff'); taken.push([x, z, 6]); } }
  // ---- the moat bend: the knights' camp (pavilions and banners) ----
  for (let i = 0; i < 7; i++) { const p = side(S.camp - 60 + i * 20, i % 2 ? 1 : -1, 9 + (i % 3) * 4); if (free(p.x, p.z, 4)) { CartKit.put(E, 'dkp_tent', p.x, p.z, p.yaw, DKP_HERALD[i % DKP_HERALD.length]); taken.push([p.x, p.z, 4.5]); } }
  for (let i = 0; i < 6; i++) { const p = side(S.camp - 50 + i * 20, i % 2 ? -1 : 1, 3); if (free(p.x, p.z, 0.8)) CartKit.put(E, 'dkp_banner', p.x, p.z, p.yaw + Math.PI / 2, DKP_HERALD[(i + 2) % DKP_HERALD.length]); }
  // ---- THE DRAWBRIDGE: two half-raised leaves over the moat (terrain ramps with their own meshes), the wall and gatehouse beyond ----
  { const g = bg, wl = g.wl, wr = g.wr, w = wl + wr + 0.6, c = (wr - wl) / 2;
    const near = T.at(S.bridge - 8.5, {}), far = T.at(S.bridge + 7.5, {});
    const f1 = CartFeat.ramp(near.x + near.nx * c, near.z + near.nz * c, near.yaw, 10, w, 2.8, {}); f1.noMesh = true; E.terrain.add(f1);
    const f2 = CartFeat.ramp(far.x + far.nx * c, far.z + far.nz * c, far.yaw + Math.PI, 9, w, 1.5, {}); f2.noMesh = true; E.terrain.add(f2);
    CartScene.mesh(api, near.x + near.nx * c, near.z + near.nz * c, near.yaw, m => dkpLeaf(m, 10, w, 2.8), { hi: true });
    CartScene.mesh(api, far.x + far.nx * c, far.z + far.nz * c, far.yaw + Math.PI, m => dkpLeaf(m, 9, w, 1.5), { hi: true });
    const gh = T.at(S.bridge + 17, {});
    CartScene.mesh(api, gh.x, gh.z, gh.yaw, m => dkpGatehouse(m, gh.wl + gh.wr + 2, 10.5, 16, { crest: true, teeth: true }), { hi: true });
    taken.push([gh.x, gh.z, 16], [g.x, g.z, 14]);
    // the curtain wall along the moat's far bank, both ways from the gatehouse
    for (const sd of [-1, 1]) for (let k = 0; k < 6; k++) { const off = (sd > 0 ? gh.wr : gh.wl) + 9.5 + k * 12, x = gh.x + gh.nx * sd * off, z = gh.z + gh.nz * sd * off; if (!CartWorlds.clear(T, x, z, 7)) break; if (k === 2 || k === 5) CartKit.put(E, 'dkp_tower', x, z, 0, '#ffffff'); else CartKit.put(E, 'dkp_wall', x, z, Math.atan2(gh.nx, gh.nz), '#ffffff'); taken.push([x, z, 7]); }
    E.dkp.bridge = { s: S.bridge, x: g.x, z: g.z, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, w };
  }
  // ---- THE BAILEY: three catapults on the outside of the bends, walls behind them ----
  E.dkp.cats = [];
  for (const sv of S.cats) {
    const a = side(sv, 1, 8), b = side(sv, -1, 8), da = Math.hypot(a.x - keep.x, a.z - keep.z), db = Math.hypot(b.x - keep.x, b.z - keep.z), p = da > db ? a : b, sd = da > db ? 1 : -1;
    const yaw = p.yaw;   // facing the road
    CartScene.mesh(api, p.x, p.z, yaw, dkpCatapult, { hi: true, scale: 1.4 });
    E.dkp.cats.push({ s: sv, x: p.x, z: p.z, yaw, sd }); taken.push([p.x, p.z, 6]);
    const w0 = side(sv, sd, 17); for (const k of [-1, 0, 1]) { const g = T.at(sv + k * 12, {}), off = sd > 0 ? g.wr + 17 : -g.wl - 17, x = g.x + g.nx * off, z = g.z + g.nz * off; if (CartWorlds.clear(T, x, z, 6) && taken.every(q => q[2] === 6 || Math.hypot(q[0] - x, q[1] - z) > q[2] + 5)) { CartKit.put(E, k ? 'dkp_wall' : 'dkp_tower', x, z, g.yaw, '#ffffff'); taken.push([x, z, 6.5]); } }
    void w0;
  }
  // ---- THE LISTS: stands on both sides, pavilions at the ends, banners, the crowd ----
  { const mid = (S.lists0 + S.lists1) / 2;
    for (const sd of [1, -1]) for (const ds of [-26, 0, 26]) { const p = side(mid + ds, sd, 6.5); E.spots.push(...CartScene.bleachers(api, p.x, p.z, p.yaw, 18, 4, rng)); taken.push([p.x, p.z, 11]); }
    for (const sd of [1, -1]) for (const sv of [S.lists0 - 10, S.lists1 + 10]) { const p = side(sv, sd, 9); if (free(p.x, p.z, 4)) { CartKit.put(E, 'dkp_tent', p.x, p.z, p.yaw, sd > 0 ? '#c8102e' : '#1e4ab8', { scale: 1.2 }); taken.push([p.x, p.z, 5]); } }
    for (let s = S.lists0 - 4, k = 0; s < S.lists1 + 4; s += 13, k++) for (const sd of [1, -1]) { const p = side(s, sd, 1.4); CartKit.put(E, 'dkp_banner', p.x, p.z, p.yaw + Math.PI / 2, k % 2 ? (sd > 0 ? '#c8102e' : '#1e4ab8') : '#f2b630'); }
    for (const sd of [1, -1]) { const p = side(S.lists1 + 3, sd, 2.6); api.sign(sd > 0 ? 'THE LISTS' : 'JOUSTING\nIN PROGRESS', p.x, p.z, { yaw: T.at(S.lists1, {}).yaw + Math.PI, h: 1.2, y: 1.8, post: true, maxW: 3.2, style: { bg: '#f2e6c8', fg: '#5a1018', border: '#5a1018' } }); }
    void mid;
  }
  E.dkp.lists = { s0: S.lists0, s1: S.lists1 };
  // ---- THE SALLY PORT: a gatehouse with the portcullis (pooled), walls both ways ----
  { const g = T.at(S.port, {});
    CartScene.mesh(api, g.x, g.z, g.yaw, m => dkpGatehouse(m, g.wl + g.wr + 2, 10, 16, { banners: true, crest: true }), { hi: true });
    for (const sd of [-1, 1]) for (let k = 0; k < 6; k++) { const off = (sd > 0 ? g.wr : g.wl) + 9.5 + k * 12, x = g.x + g.nx * sd * off, z = g.z + g.nz * sd * off; if (!CartWorlds.clear(T, x, z, 7)) break; CartKit.put(E, k === 3 ? 'dkp_tower' : 'dkp_wall', x, z, Math.atan2(g.nx, g.nz), '#ffffff'); taken.push([x, z, 7]); }
    for (const sd of [1, -1]) { const p = side(S.port - 34, sd, 1.6); api.sign(sd > 0 ? 'MIND THE\nPORTCULLIS' : 'NO DRAGONS\nBEYOND\nTHIS POINT', p.x, p.z, { yaw: g.yaw + Math.PI, h: 1.1, y: 1.6, post: true, maxW: 2.8, style: { bg: '#f2e6c8', fg: '#2a1a10', border: '#5a1018' } }); }
    taken.push([g.x, g.z, 16]);
    E.dkp.port = { s: S.port, x: g.x, z: g.z, yaw: g.yaw, tx: g.tx, tz: g.tz, nx: g.nx, nz: g.nz, wl: g.wl, wr: g.wr, w: g.wl + g.wr + 1 };
  }
  // ---- THE KEEP in the middle, its ring of walls and towers ----
  CartScene.mesh(api, keep.x, keep.z, Math.PI, dkpKeep, { hi: true });
  { const R = 40, n = 20; for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * TAU, x = keep.x + Math.sin(a) * R, z = keep.z + Math.cos(a) * R; if (Math.abs(cartWrap(a - Math.PI)) < 0.2) continue; if (i % 4 === 0) CartKit.put(E, 'dkp_tower', x, z, 0, '#ffffff'); else CartKit.put(E, 'dkp_wall', x, z, a + Math.PI / 2, '#ffffff'); } }
  E.art.push({ x: keep.x, z: keep.z, r: 18 });
  // ---- the forest: oaks along the descent and scattered round the infield and outside ----
  for (let s = S.port + 30, k = 0; s < S.descent + 140; s += 9, k++) for (const sd of [1, -1]) { const p = side(s, sd, 4 + ((k * 7 + (sd > 0 ? 3 : 0)) % 9)); if (free(p.x, p.z, 3)) CartKit.put(E, 'dkp_tree', p.x, p.z, k * 1.7, ['#5f8a3a', '#4f7a34', '#6a9a40', '#7a9a3a'][k % 4], { scale: 0.9 + (k % 3) * 0.2 }); }
  for (let i = 0; i < 70; i++) { const x = -240 + rng() * 520, z = -60 + rng() * 340; if (free(x, z, 6)) { CartKit.put(E, 'dkp_tree', x, z, rng() * TAU, ['#5f8a3a', '#4f7a34', '#6a9a40', '#8a9a3a'][i % 4], { scale: 0.9 + rng() * 0.6 }); taken.push([x, z, 4]); } }
  // banners round the rest of the lap
  for (let s = 0, k = 0; s < T.L; s += 46, k++) { const p = side(s, k % 2 ? 1 : -1, 2.4); if (free(p.x, p.z, 1)) CartKit.put(E, 'dkp_banner', p.x, p.z, p.yaw + Math.PI / 2, DKP_HERALD[k % DKP_HERALD.length]); }
  // gift rows, boost pads (one before the drawbridge: fly!), the grid
  const f = s => (((s % T.L) + T.L) % T.L) / T.L;
  CartKit.gifts(E, T, [f(CartKit.sOf(T, -20, -10)), f(S.bridge - 50), f(S.cats[1] + 22), f(S.lists0 - 22), f(CartKit.sOf(T, -186, 40))]);
  CartKit.boosts(E, T, [[f(S.bridge - 26), 0], [f((S.lists0 + S.lists1) / 2), 0.55], [f(S.descent), -0.3]]);
  CartKit.grid(E, T);
  return CartKit.finish(E);
}
// the centre line: red and gold diamonds every 6 m
function dkpPaintCenter(ctx, P, S, T) {
  for (let s = 0; s < T.L; s += 6) { const g = T.at(s, {}), q = P(g.x, g.z); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.fillStyle = Math.floor(s / 6) % 2 ? 'rgba(242,182,48,0.85)' : 'rgba(200,16,46,0.8)'; ctx.beginPath(); ctx.moveTo(-1.1 * S, 0); ctx.lineTo(0, -0.4 * S); ctx.lineTo(1.1 * S, 0); ctx.lineTo(0, 0.4 * S); ctx.closePath(); ctx.fill(); ctx.restore(); }
}

/* ---------------- the moving things (one pooled group) ---------------- */
const DKP_KNIGHT_COL = [['#c8102e', '#f2b630', '#ffffff'], ['#1e4ab8', '#ffffff', '#f2b630']];
const DkpMesh = {
  // a gate leaf: pivot (hinge) at the origin, the leaf runs along +x for len, 3.4 m tall
  leaf(m, len) {
    const wd = BURNS_ATLAS.pattern('wood');
    m.color('#8a5630'); m.roundBox(len / 2, 1.95, 0, len, 3.3, 0.32, 0.08, { uv: wd });
    m.color('#6a4224'); for (let x = 1.2; x < len; x += 1.2) m.box(x, 1.95, 0.17, 0.06, 3.2, 0.04);
    m.color('#2e2e34').shine(2); for (const y of [0.8, 1.95, 3.1]) { m.box(len / 2, y, 0.18, len - 0.1, 0.22, 0.06); m.box(len / 2, y, -0.18, len - 0.1, 0.22, 0.06); }
    for (let x = 0.6; x < len; x += 1.6) for (const y of [0.8, 3.1]) m.ball(x, y, 0.22, 0.07, { seg: 5, rings: 3 });
    m.cyl(0, 0.2, 0, 0.16, 0.16, 3.6, 8); m.shine(0);
    // a red-and-gold dragon roundel in the middle, a warning stripe on the tip
    m.push(); m.tf(len * 0.55, 1.95, 0.2, 0, Math.PI / 2, 0); m.color('#c8102e').shine(2); m.disc(0, 0.04, 0, 0.75, 14); m.color('#f2b630'); m.torus(0, 0.05, 0, 0.75, 0.07, { seg: 14, tseg: 3 }); m.pop();
    m.push(); m.tf(len * 0.55, 1.95, -0.2, 0, -Math.PI / 2, 0); m.color('#c8102e'); m.disc(0, 0.04, 0, 0.75, 14); m.color('#f2b630'); m.torus(0, 0.05, 0, 0.75, 0.07, { seg: 14, tseg: 3 }); m.pop();
    m.color('#f2b630', 0.3); m.box(len - 0.25, 1.95, 0, 0.3, 3.36, 0.36); m.emissive(0).shine(0);
  },
  // the portcullis: an iron grid w wide, 7.6 tall, spikes at the bottom (origin at the bottom centre)
  portcullis(m, w) {
    m.color('#34343c').shine(2);
    const n = Math.round(w / 1.1);
    for (let i = 0; i <= n; i++) { const x = -w / 2 + i * w / n; m.box(x, 3.8, 0, 0.2, 7.6, 0.2); m.push(); m.tf(x, 0, 0, 0, Math.PI, 0); m.lathe([[0.13, 0], [0, 0.55]], { seg: 5 }); m.pop(); }
    for (const y of [1.0, 2.6, 4.2, 5.8, 7.4]) m.box(0, y, 0, w + 0.2, 0.2, 0.26);
    m.color('#5a5a64'); for (let i = 0; i <= n; i += 2) for (const y of [1.0, 4.2]) m.ball(-w / 2 + i * w / n, y, 0.15, 0.09, { seg: 5, rings: 3 });
    m.shine(0);
  },
  // a jousting knight on a caparisoned horse, foam lance couched (forward = +z); legs are their own objects
  knight(m, i) {
    const [c0, c1, c2] = DKP_KNIGHT_COL[i % 2];
    // the horse: body, neck, head with a steel chanfron, tail; the caparison (cloth) hides the legs' tops
    m.color('#6a4a32'); m.ellipsoid(0, 1.75, 0, 0.6, 0.62, 1.3, { seg: 12, rings: 8 });
    m.limb(0, 2.0, 0.95, 0, 2.75, 1.55, 0.36, 0.26, { seg: 9 }); m.ellipsoid(0, 2.8, 1.85, 0.24, 0.26, 0.5, { seg: 9, rings: 6 });
    m.color('#c8ccd4').shine(3); m.ellipsoid(0, 2.92, 1.9, 0.2, 0.18, 0.4, { seg: 8, rings: 5 }); m.color(c1); m.limb(0, 3.1, 1.75, 0, 3.55, 1.65, 0.05, 0.01, { seg: 4 }); m.shine(0);
    m.color('#2a1a14'); for (const sd of [-1, 1]) { m.limb(sd * 0.12, 3.0, 1.55, sd * 0.16, 3.25, 1.48, 0.06, 0.02, { seg: 4 }); m.ball(sd * 0.2, 2.86, 2.0, 0.04, { seg: 4, rings: 3 }); }
    m.limb(0, 1.9, -1.2, 0, 1.0, -1.55, 0.14, 0.06, { seg: 6 });
    m.color(c0).shine(1); m.roundBox(0, 1.45, 0, 1.36, 0.9, 2.8, 0.35); m.color(c1); m.roundBox(0, 1.0, 0, 1.4, 0.16, 2.84, 0.06); m.color(c2); for (const sd of [-1, 1]) m.ball(sd * 0.69, 1.5, 0, 0.25, { seg: 8, rings: 5 }); m.shine(0);
    // the rider: armour, a helm with a tall plume, a shield, the striped foam lance
    m.color('#c8ccd4').shine(3); m.ellipsoid(0, 2.75, -0.15, 0.36, 0.48, 0.3, { seg: 10, rings: 7 });
    m.color(c0); m.ellipsoid(0, 2.62, -0.12, 0.4, 0.3, 0.33, { seg: 10, rings: 6 }); m.color('#c8ccd4');
    m.cyl(0, 3.2, -0.12, 0.24, 0.22, 0.42, 10); m.ball(0, 3.62, -0.12, 0.22, { seg: 10, rings: 6 });
    m.color('#1a1a1e'); m.box(0, 3.42, 0.1, 0.3, 0.05, 0.05);
    m.color(c1); for (let k = 0; k < 4; k++) m.ball(0, 3.85 + k * 0.12, -0.2 - k * 0.12, 0.17 - k * 0.025, { seg: 7, rings: 5 });
    for (const sd of [-1, 1]) { m.color('#c8ccd4'); m.limb(sd * 0.3, 1.6, 0, sd * 0.35, 2.45, -0.1, 0.11, 0.13, { seg: 6 }); m.ball(sd * 0.36, 2.98, -0.1, 0.16, { seg: 7, rings: 5 }); }
    m.push(); m.tf(-0.5, 2.7, 0.05, Math.PI / 2, 0, 0); m.color(c0).shine(2); m.extrude([[0.38, 0.45], [0.38, -0.1], [0, -0.55], [-0.38, -0.1], [-0.38, 0.45]], 0.08); m.pop();
    m.push(); m.tf(-0.53, 2.7, 0.05, Math.PI / 2); m.color(c1); m.extrude([[-0.2, 0.3], [0.2, 0.3], [0, -0.3]], 0.04); m.pop(); m.shine(0);
    const lx = 0.42, ly = 2.6;
    m.color('#c8ccd4').shine(3); m.push(); m.tf(lx, ly, 0.45); m.lathe([[0.02, -0.1], [0.32, 0.2], [0.07, 0.4]], { seg: 10 }); m.pop(); m.shine(0);
    for (let k = 0; k < 5; k++) { m.color(k % 2 ? c1 : c0); m.limb(lx, ly - k * 0.02, 0.5 + k * 0.85, lx, ly - (k + 1) * 0.02, 1.35 + k * 0.85, 0.11 - k * 0.012, 0.1 - k * 0.012, { seg: 7, ends: false }); }
    m.color('#ffe85a', 0.15).shine(0); m.ball(lx, ly - 0.1, 5.0, 0.42, { seg: 10, rings: 8 }); m.emissive(0);
  },
  // a pair of horse legs (front or rear), hanging from the hip at the origin
  legs(m) { for (const sd of [-1, 1]) { m.color('#6a4a32'); m.limb(sd * 0.32, 0, 0, sd * 0.32, -0.55, 0.05, 0.13, 0.09, { seg: 6 }); m.limb(sd * 0.32, -0.55, 0.05, sd * 0.32, -1.05, 0, 0.08, 0.08, { seg: 6 }); m.color('#f2ead8'); m.limb(sd * 0.32, -0.88, 0, sd * 0.32, -1.02, 0, 0.11, 0.11, { seg: 6 }); m.color('#2a1a14'); m.cyl(sd * 0.32, -1.18, 0.02, 0.11, 0.1, 0.16, 7); } },
  // a catapult arm: from the axle (origin) along +z to the bucket at z 4.3
  arm(m) {
    const wd = BURNS_ATLAS.pattern('wood');
    m.color('#7a4e2a'); m.limb(0, 0, -0.4, 0, 0, 4.0, 0.2, 0.15, { seg: 7 }); m.roundBox(0, 0, 0, 0.5, 0.5, 0.8, 0.1, { uv: wd });
    m.color('#2e2e34').shine(2); for (const z of [0.9, 2.2, 3.4]) { m.push(); m.tf(0, 0, z, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.19, 0.04, { seg: 8, tseg: 3 }); m.pop(); } m.shine(0);
    m.color('#5a3a22'); m.push(); m.tf(0, 0.25, 4.25, 0, -Math.PI / 2, 0); m.lathe([[0.05, -0.1], [0.5, 0.05], [0.58, 0.32], [0.5, 0.36]], { seg: 10 }); m.pop();
  },
  // a fireball: a glowing core in a lumpy flame shell
  ball(m) { m.color('#ffd060', 1); m.ball(0, 0, 0, 0.55, { seg: 10, rings: 8 }); m.color('#ff7a1a', 0.9); for (const [x, y, z] of [[0.3, 0.2, 0.1], [-0.25, 0.25, -0.15], [0.05, -0.3, 0.25], [-0.15, 0.05, 0.35], [0.2, -0.1, -0.32]]) m.ball(x, y, z, 0.42, { seg: 7, rings: 5 }); m.emissive(0); }
};

/* ---------------- the rules: hazards and enemies at run time ---------------- */
const DKP_GATE = { P: 6.4, warn: 1.2, swing: 0.4, shut: 1.3, open: 0.6 };   // each leaf: warn → swing shut → shut → swing open; the pair's two leaves half a period apart
const DKP_PORT = { P: 8.0, open: 4.4, warn: 1.3, slam: 0.2, down: 0.6, rise: 1.5, top: 8.2 };
const DKP_JOUST = { warn: 1.5, speed: 16, P: 15.6 };
const DKP_CAT = { wind: 1.1, throw: 0.3, reload: 0.9, flight: 1.35, R: 3.3 };
const DKP_BALLS = 4, DKP_SCORCH = 6;
CART_TRACK_RULES.keep = {
  onLoad(s) {
    const E = s.E, Q = E.dkp, T = s.T || s.TR;
    const gl = [], add = (q, lf) => gl.push(lf.len);
    for (const q of Q.gates) for (const lf of q.leaves) add(q, lf);
    const G = CartKit.group(s, [['leaves', (m, i) => DkpMesh.leaf(m, gl[i]), gl.length], ['port', m => DkpMesh.portcullis(m, Q.port.w), 1], ['knights', DkpMesh.knight, 2], ['legs', DkpMesh.legs, 4], ['arms', DkpMesh.arm, Q.cats.length], ['balls', DkpMesh.ball, DKP_BALLS]]);
    const L = s.dkp = { G, gates: [], port: null, knights: [], cats: [], balls: [], scorch: [], said: {}, hintT: -9, burn: 0 };
    let li = 0;
    Q.gates.forEach((q, gi) => { const o = { s: q.s, x: q.x, z: q.z, tx: q.tx, tz: q.tz, nx: q.nx, nz: q.nz, yaw: q.yaw, off: gi * 1.6, leaves: [] }; q.leaves.forEach((lf, j) => o.leaves.push({ sd: lf.sd, px: lf.px, pz: lf.pz, len: lf.len, off: j * DKP_GATE.P / 2, a: 0, tele: 0, ph: 0, cyc: -1, mask: 0, moving: false, dx: 0, dz: 0, obj: G.leaves[li++] })); L.gates.push(o); });
    const P = Q.port; L.port = Object.assign({}, P, { y: DKP_PORT.top, ph: 0, cyc: -1, mask: 0, tele: 0, obj: G.port[0] });
    const ls = Q.lists; for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; L.knights.push({ i, sd, s: ls.s1, d: 0, x: 0, z: 0, yaw: 0, st: 'ride', ph: 0, cyc: -1, mask: 0, obj: G.knights[i], legs: [G.legs[i * 2], G.legs[i * 2 + 1]], bob: 0, rear: 0, run: 0 }); }
    L.lists = ls;
    Q.cats.forEach((c, i) => L.cats.push(Object.assign({}, c, { st: 'idle', t: 0, cool: 1.5 + i * 1.3, tgt: null, pitch: -1.25, obj: G.arms[i], ball: null })));
    for (let i = 0; i < DKP_BALLS; i++) L.balls.push({ live: false, t: 0, x: 0, y: 0, z: 0, x0: 0, y0: 0, z0: 0, x1: 0, z1: 0, gy: 0, obj: G.balls[i], held: null });
    for (let i = 0; i < DKP_SCORCH; i++) L.scorch.push({ t: 99, x: 0, z: 0 });
    void T; CartKit.state(s);
  },
  onUpdate(s, dt, racing) {
    const L = s.dkp; if (!L) return;
    dkpGates(s, L, dt, racing); dkpPortcullis(s, L, dt, racing); dkpKnights(s, L, dt, racing); dkpCatapults(s, L, dt, racing);
    for (const q of L.scorch) q.t += dt;
    if (L.burn > 0) L.burn = Math.max(0, L.burn - dt);
  },
  // the AI: take the open side of a gate, the free lane in the lists, ease off for the portcullis (by skill)
  onStep(s, k, dt, racing) {
    const L = s.dkp; if (!L || k.player && !s.autoDrive || !racing || !s.T || k.out) return;
    const T = s.T, I = k.inp, sk = k.ai ? k.ai.skill : 0.9, p = clamp(0.5 + (sk - 0.85) * 3, 0.25, 0.95);
    const notice = key => ((k.slot * 7 + key * 3) % 10) / 10 < p;
    for (let gi = 0; gi < L.gates.length; gi++) {
      const q = L.gates[gi], ds = CartKit.ds(T, k.loc.s, q.s); if (ds < 1 || ds > 48) continue;
      const ta = ds / Math.max(8, k.speed);
      for (const lf of q.leaves) { const pa = (lf.ph + ta) % DKP_GATE.P; if (pa > DKP_GATE.warn - 0.1 && pa < DKP_GATE.warn + DKP_GATE.swing + DKP_GATE.shut + 0.15 && notice(lf.cyc + gi)) { dkpSteer(s, k, -lf.sd * dkpWall(s, k, -lf.sd) * 0.5); break; } }
    }
    const P = L.port, dp = CartKit.ds(T, k.loc.s, P.s);
    if (dp > 1.5 && dp < 55) { const ta = dp / Math.max(6, k.speed), pa = (P.ph + ta) % DKP_PORT.P, w0 = DKP_PORT.open + DKP_PORT.warn - 0.15, w1 = w0 + 0.15 + DKP_PORT.slam + DKP_PORT.down + 0.45; if (pa > w0 && pa < w1 && ((k.slot * 7 + P.cyc * 3) % 10) / 10 < p - 0.3) { I.gas = 0; if (k.speed > 9) I.brake = 0.7; } }
    for (const n of L.knights) {
      if (n.st !== 'warn' && n.st !== 'charge') continue;
      const dk = CartKit.ds(T, k.loc.s, n.s); if (dk < -3 || dk > 75) continue;
      // the knight comes at you fast: only the sharper drivers see him in time (fewer than for the gates)
      if (Math.abs(k.loc.d - n.d) < 5.5 && dk < 45 && ((k.slot * 7 + (n.cyc + n.i) * 3) % 10) / 10 < p - 0.3) dkpSteer(s, k, -n.sd * dkpWall(s, k, -n.sd) * 0.5);
    }
  },
  draw(s, R, S, t) { const L = s.dkp; if (L) dkpDraw(s, L, R, S, t); },
  lights(s, add) {
    const L = s.dkp; if (!L) return;
    for (const b of L.balls) if (b.live) add(b.x, b.y, b.z, 12, DKP_C.fire, 1.8, 2);
    for (const q of L.scorch) if (q.t < 1.2) add(q.x, 1.2, q.z, 12, DKP_C.ember, 2 * (1 - q.t / 1.2), 2);
    const P = L.port; if (P.tele > 0) add(P.x, 6, P.z, 14, DKP_C.red, 1.2 * P.tele, 1);
  },
  hud(s, ctx, W, H) {
    const L = s.dkp, p = s.player; if (!L || !p) return;
    // scorched: a hot orange glow round the edges of the screen
    if (L.burn > 0) { const a = Math.min(1, L.burn * 1.4); const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.7); g.addColorStop(0, 'rgba(255,120,20,0)'); g.addColorStop(1, `rgba(255,90,10,${0.55 * a})`); ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    // first-lap hints as each hazard comes up
    const hint = (key, sv, text, sub) => { if (L.said[key] || p.lap > 1) return; const ds = CartKit.ds(s.T, p.loc.s, sv); if (ds > 0 && ds < 75) { L.said[key] = true; L.hintT = s.time; s.banner(text, '#ffd27a', 2.0, sub); } };
    if (s.state === 'race' && s.T) { hint('gates', L.gates[0].s, 'SWINGING GATES!', 'take the open side'); hint('bridge', s.E.dkp.bridge.s - 30, 'DRAWBRIDGE!', 'full speed and fly the moat'); hint('cats', L.cats[0].s - 20, 'FIREBALL CATAPULTS!', 'steer off the rings of fire'); hint('joust', L.lists.s0, 'JOUSTING KNIGHTS!', 'a knight charges down one lane: take the other'); hint('port', L.port.s - 10, 'PORTCULLIS!', 'pass while it is up'); }
  }
};
// the wall distance on side sd at kart k's place on the course
function dkpWall(s, k, sd) { const g = s.T.at(k.loc.s, DKP_T.at2); return sd > 0 ? g.wr : g.wl; }
// steer an AI kart toward lateral offset d, 10 m + a bit ahead (the racing AI's own steering formula)
function dkpSteer(s, k, d) { const f = s.T.at(k.loc.s + 10 + k.speed * 0.3, DKP_T.at2), tx = f.x + f.nx * d, tz = f.z + f.nz * d, ang = cartWrap(Math.atan2(tx - k.x, tz - k.z) - k.yaw); k.inp.steer = clamp(-ang * 2.8, -1, 1); }

// ---- the swinging gates: warn (rattle, bell, amber road) → swing shut → shut → swing open ----
function dkpGates(s, L, dt, racing) {
  const G = DKP_GATE, e0 = G.warn, e1 = e0 + G.swing, e2 = e1 + G.shut, e3 = e2 + G.open;
  for (const q of L.gates) for (const lf of q.leaves) {
    const tt = s.time + q.off + lf.off, ph = ((tt % G.P) + G.P) % G.P, cyc = Math.floor(tt / G.P);
    if (cyc !== lf.cyc) { lf.cyc = cyc; lf.mask = 0; }
    lf.ph = ph; lf.tele = ph < e0 ? ph / e0 : 0;
    const a0 = lf.a;
    lf.a = ph < e0 ? 0 : ph < e1 ? BurnsM.smoothstep(0, 1, (ph - e0) / G.swing) : ph < e2 ? 1 : ph < e3 ? 1 - BurnsM.smoothstep(0, 1, (ph - e2) / G.open) : 0;
    lf.moving = lf.a > a0 + 1e-4;
    if (a0 === 0 && lf.a > 0) { CartKit.fired(s, 'gate'); if (CartKit.near(s, lf.px, lf.pz, 60)) { cartIxSound(s, 'stomp', lf.px, lf.pz, 0.7, 0.6); cartIxSound(s, 'wind', lf.px, lf.pz, 0.3, 1.6); } }
    if (ph < e0 && Math.floor((ph - dt) * 2.5) !== Math.floor(ph * 2.5) && CartKit.near(s, lf.px, lf.pz, 70)) cartIxSound(s, 'pick', lf.px, lf.pz, 0.5, 0.55);   // the bell
    if (lf.a >= 1 && a0 < 1) { if (CartKit.near(s, lf.px, lf.pz, 30)) s.shakeIt(0.25); if (s.fx && CartKit.near(s, lf.px, lf.pz, 120)) s.fx.dust(lf.px - lf.sd * q.nx * lf.len, 0.4, lf.pz - lf.sd * q.nz * lf.len, 8, '#b8a888'); }
    // the leaf's direction: along the road (open) → across its half (shut); a rattle in the warning
    const rat = lf.tele > 0 ? Math.sin(s.time * 38) * 0.05 * lf.tele : 0, an = lf.a * Math.PI / 2 + rat, mx = -lf.sd * q.nx, mz = -lf.sd * q.nz;
    lf.dx = q.tx * Math.cos(an) + mx * Math.sin(an); lf.dz = q.tz * Math.cos(an) + mz * Math.sin(an);
    if (lf.a > 0.05) {
      for (let r = 2; r < lf.len; r += 3.5) cartIxObs(s, lf.px + lf.dx * r, lf.pz + lf.dz * r, 1.6);
      if (racing) for (const k of s.karts) {
        if (k.out || (lf.mask & (1 << k.slot)) || k.y > 3.6) continue;
        const rx = k.x - lf.px, rz = k.z - lf.pz, u = clamp(rx * lf.dx + rz * lf.dz, 0, lf.len), ex = rx - lf.dx * u, ez = rz - lf.dz * u;
        if (ex * ex + ez * ez > 1.55 * 1.55) continue;
        lf.mask |= 1 << k.slot;
        if (lf.moving) { const px = mx * 0.8 + q.tx * 0.4, pz = mz * 0.8 + q.tz * 0.4; CartKit.hit(s, k, 'knock', 'gate', { dx: px, dz: pz, power: 9, dur: 0.9, banner: 'GATE SLAM!' }); }
        else if (lf.a > 0.9) { if (CartKit.hit(s, k, 'spin', 'gate', { dur: 0.85, banner: 'SHUT GATE!' })) { const vt = k.vx * q.tx + k.vz * q.tz; if (vt > 0) { k.vx -= q.tx * vt * 0.8; k.vz -= q.tz * vt * 0.8; } } }
        cartIxSound(s, 'bump', k.x, k.z, 0.8, 0.8); if (s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'star', 8, '#f2b630');
      }
    }
    const o = lf.obj; if (o) { o.live = true; o.visible = true; o.x = lf.px; o.y = 0; o.z = lf.pz; o.yaw = Math.atan2(-lf.dz, lf.dx); o.pitch = 0; o.roll = 0; o.scale = 1; }
  }
}
// ---- the portcullis: open → shudder and drop a little (warn) → SLAM → down → winch back up ----
function dkpPortcullis(s, L, dt, racing) {
  const C = DKP_PORT, P = L.port, e0 = C.open, e1 = e0 + C.warn, e2 = e1 + C.slam, e3 = e2 + C.down, tt = s.time + 2.5, ph = ((tt % C.P) + C.P) % C.P, cyc = Math.floor(tt / C.P);
  if (cyc !== P.cyc) { P.cyc = cyc; P.mask = 0; }
  P.ph = ph; P.tele = ph >= e0 && ph < e1 ? (ph - e0) / C.warn : 0;
  const y0 = P.y;
  P.y = ph < e0 ? C.top : ph < e1 ? C.top - 0.7 * P.tele + Math.sin(s.time * 30) * 0.06 * P.tele : ph < e2 ? (C.top - 0.7) * (1 - Math.pow((ph - e1) / C.slam, 2)) : ph < e3 ? 0 : C.top * Math.min(1, (ph - e3) / C.rise);
  if (y0 > 0.5 && P.y <= 0.01) { CartKit.fired(s, 'portcullis'); if (CartKit.near(s, P.x, P.z, 70)) { cartIxSound(s, 'stomp', P.x, P.z, 1, 0.5); cartIxSound(s, 'crumble', P.x, P.z, 0.5, 0.8); } if (CartKit.near(s, P.x, P.z, 30)) s.shakeIt(0.5); if (s.fx && CartKit.near(s, P.x, P.z, 120)) s.fx.dust(P.x, 0.3, P.z, 14, '#b8a888'); }
  if (P.tele > 0 && Math.floor((ph - dt) * 6) !== Math.floor(ph * 6) && CartKit.near(s, P.x, P.z, 60)) cartIxSound(s, 'pick', P.x, P.z, 0.4, 0.4);   // the chains rattle
  if (P.y < 1.3) {
    for (let d = -P.wl + 2; d < P.wr; d += 4) cartIxObs(s, P.x + P.nx * d - P.tx * 2, P.z + P.nz * d - P.tz * 2, 2);
    if (racing) for (const k of s.karts) {
      if (k.out || (P.mask & (1 << k.slot)) || k.y > P.y + 1.4) continue;
      const rx = k.x - P.x, rz = k.z - P.z, along = rx * P.tx + rz * P.tz, lat = rx * P.nx + rz * P.nz;
      if (Math.abs(along) > 1.7 || lat < -P.wl - 1 || lat > P.wr + 1) continue;
      P.mask |= 1 << k.slot;
      if (CartKit.hit(s, k, 'spin', 'portcullis', { dur: 1.0, banner: 'PORTCULLIS!' })) { const vt = k.vx * P.tx + k.vz * P.tz; k.vx -= P.tx * (vt + 4); k.vz -= P.tz * (vt + 4); cartIxSound(s, 'bump', k.x, k.z, 0.9, 0.6); if (s.fx) s.fx.burst(k.x, k.y + 1.2, k.z, 'star', 12, '#ffffff'); }
    }
  }
  const o = P.obj; if (o) { o.live = true; o.visible = true; o.x = P.x; o.y = P.y; o.z = P.z; o.yaw = P.yaw; o.pitch = 0; o.roll = 0; o.scale = 1; }
}
// ---- the knights: each in turn waits in its lane at the far end (rearing, lane lit), charges down it against the
// traffic, leaves the road and canters back outside the fence ----
function dkpKnights(s, L, dt, racing) {
  const J = DKP_JOUST, T = s.T || s.TR, ls = L.lists, len = ls.s1 - ls.s0, ride = len / J.speed, e0 = J.warn, e1 = e0 + ride, e2 = e1 + 0.9;
  for (const n of L.knights) {
    const tt = s.time + n.i * J.P / 2, ph = ((tt % J.P) + J.P) % J.P, cyc = Math.floor(tt / J.P);
    if (cyc !== n.cyc) { n.cyc = cyc; n.mask = 0; }
    n.ph = ph;
    const lane = d => n.sd * d;
    let sv, d, face = 1, run = 0;   // face: +1 against traffic (toward s0), -1 with it
    const g1 = T.at(ls.s1, DKP_T.at), wall1 = n.sd > 0 ? g1.wr : g1.wl;
    if (ph < e0) { const u = Math.min(1, ph / 0.5); n.st = 'warn'; sv = ls.s1 + 3 * (1 - u); d = lane(lerp(wall1 + 3, wall1 * 0.5, BurnsM.smoothstep(0, 1, u))); run = u < 1 ? 1 : 0; if (ph - dt < 0 || (ph >= 0.5 && ph - dt < 0.5)) { if (ph >= 0.5 && CartKit.near(s, g1.x, g1.z, 90)) cartIxSound(s, 'whistle', g1.x, g1.z, 0.7, 0.8); } }
    else if (ph < e1) { if (n.st !== 'charge') { CartKit.fired(s, 'joust'); if (CartKit.near(s, g1.x, g1.z, 90)) cartIxSound(s, 'crowd', g1.x, g1.z, 0.6, 1.1); } n.st = 'charge'; sv = ls.s1 - (ph - e0) * J.speed; const g = T.at(sv, DKP_T.at); d = lane((n.sd > 0 ? g.wr : g.wl) * 0.5); run = 2; }
    else if (ph < e2) { n.st = 'exit'; const u = (ph - e1) / 0.9; sv = ls.s0 - u * 8; const g = T.at(sv, DKP_T.at); d = lane(lerp((n.sd > 0 ? g.wr : g.wl) * 0.5, (n.sd > 0 ? g.wr : g.wl) + 3.5, BurnsM.smoothstep(0, 1, u))); run = 2; }
    else { n.st = 'ride'; const u = (ph - e2) / (J.P - e2); sv = lerp(ls.s0 - 8, ls.s1 + 3, u); const g = T.at(sv, DKP_T.at); d = lane((n.sd > 0 ? g.wr : g.wl) + 3.5); face = -1; run = 1; }
    const g = T.at(sv, DKP_T.at); n.s = sv; n.d = d; n.x = g.x + g.nx * d; n.z = g.z + g.nz * d;
    const yawT = face > 0 ? g.yaw + Math.PI : g.yaw; n.yaw = n.st === 'warn' && ph < 0.5 ? yawT + n.sd * (1 - ph / 0.5) * 1.2 : yawT;
    n.rear = n.st === 'warn' && ph > 0.6 ? Math.max(0, Math.sin((ph - 0.6) / (e0 - 0.6) * Math.PI)) : 0;
    n.run = run;
    // the lance: hits a car in the knight's lane just in front of him (and the horse itself while it waits)
    if ((n.st === 'charge' || n.st === 'warn') && racing) {
      if (n.st === 'warn') cartIxObs(s, n.x, n.z, 2.0);
      else cartIxObs(s, n.x, n.z, 1.6);
      for (const k of s.karts) {
        if (k.out || (n.mask & (1 << k.slot)) || k.y > 3.5) continue;
        const dk = CartKit.ds(T, k.loc.s, sv), lat = Math.abs(k.loc.d - d);
        if (lat > 2.8 || dk < -2.2 || dk > (n.st === 'charge' ? 5.6 : 2.4)) continue;
        n.mask |= 1 << k.slot;
        const px = -n.sd * g.nx * 0.85 - g.tx * 0.3, pz = -n.sd * g.nz * 0.85 - g.tz * 0.3;
        if (CartKit.hit(s, k, 'knock', 'joust', { dx: px, dz: pz, power: 10, dur: 1.0, banner: 'JOUSTED!' })) { cartIxSound(s, 'bump', k.x, k.z, 0.9, 1.2); cartIxSound(s, 'crowd', k.x, k.z, 0.6, 1.3); if (s.fx) { s.fx.burst(k.x, k.y + 1.6, k.z, 'star', 10, '#ffe85a'); s.fx.burst(k.x, k.y + 1.4, k.z, 'puff', 8, '#fff4a0'); } }
      }
    }
    // pose: a gallop (body bob, legs swinging), a rear in the warning
    const sc = 1.3, gy = s.terrain.height(n.x, n.z), stride = s.time * (run === 2 ? 11 : run === 1 ? 7 : 0);
    n.bob = run ? Math.abs(Math.sin(stride)) * (run === 2 ? 0.16 : 0.08) : 0;
    const o = n.obj; if (o) { o.live = true; o.visible = true; o.x = n.x; o.y = gy + n.bob + n.rear * 0.5; o.z = n.z; o.yaw = n.yaw; o.pitch = -n.rear * 0.45 + (run === 2 ? Math.sin(stride) * 0.04 : 0); o.roll = 0; o.scale = sc; }
    const fx = Math.sin(n.yaw), fz = Math.cos(n.yaw);
    n.legs.forEach((lg, j) => { if (!lg) return; const zz = (j ? -0.85 : 0.85) * sc, swing = run ? Math.sin(stride + j * Math.PI) * (run === 2 ? 0.7 : 0.4) : 0, rearUp = j === 0 ? n.rear * 0.9 : 0; lg.live = true; lg.visible = true; lg.x = n.x + fx * zz; lg.z = n.z + fz * zz; lg.y = gy + n.bob + 1.25 * sc + (j === 0 ? n.rear * 1.2 : n.rear * 0.1); lg.yaw = n.yaw; lg.pitch = swing - rearUp - n.rear * 0.45; lg.roll = 0; lg.scale = sc; });
  }
}
// ---- the catapults: pick a car, crank back (warn), throw; a ring of fire marks the landing for the whole flight ----
function dkpCatapults(s, L, dt, racing) {
  const C = DKP_CAT, T = s.T || s.TR, sc = 1.4;
  for (const c of L.cats) {
    c.t += dt;
    if (c.st === 'idle') {
      c.pitch = approach(c.pitch, -1.25, 2 * dt); c.cool -= dt;
      if (racing && c.cool <= 0) {
        let best = null, bd = 1e9; for (const k of s.karts) { if (k.out || k.finished) continue; const ds = CartKit.ds(T, c.s, k.loc.s + k.speed * (C.wind + C.throw + C.flight)); if (ds < -42 || ds > 40) continue; if (L.cats.some(o => o !== c && o.tgt === k)) continue; const sc2 = Math.abs(ds) + (k.player ? -8 : 0); if (sc2 < bd) { bd = sc2; best = k; } }
        if (best) { c.st = 'wind'; c.t = 0; c.tgt = best; const b = L.balls.find(q => !q.live && !q.held); if (b) { b.held = c; c.ball = b; } if (CartKit.near(s, c.x, c.z, 70)) cartIxSound(s, 'pick', c.x, c.z, 0.6, 0.5); }
        else c.cool = 0.5;
      }
    } else if (c.st === 'wind') {
      c.pitch = lerp(-1.25, -2.85, BurnsM.smoothstep(0, 1, Math.min(1, c.t / C.wind)));
      if (c.t >= C.wind) {
        c.st = 'throw'; c.t = 0;
        const k = c.tgt, b = c.ball;
        if (b && k && !k.out) {
          const sv = k.loc.s + k.speed * (C.flight + C.throw) + 2, g = T.at(sv, DKP_T.at2), wl = g.wl - 1.5, wr = g.wr - 1.5, d = clamp(k.loc.d + (Math.random() - 0.5) * 2, -wl, wr);
          dkpArmTip(c, -1.4, sc); b.held = null; b.live = true; b.t = 0; b.x0 = DKP_T.tip[0]; b.y0 = DKP_T.tip[1]; b.z0 = DKP_T.tip[2]; b.x1 = g.x + g.nx * d; b.z1 = g.z + g.nz * d; b.gy = s.terrain.height(b.x1, b.z1); b.x = b.x0; b.y = b.y0; b.z = b.z0;
          CartKit.fired(s, 'catapult'); if (CartKit.near(s, c.x, c.z, 80)) { cartIxSound(s, 'throw', c.x, c.z, 0.9, 0.6); cartIxSound(s, 'flame', c.x, c.z, 0.6, 0.9); }
          if (k.player && s.time - L.hintT > 2.3) s.banner('INCOMING FIREBALL!', '#ff8a2a', 0.9, 'steer off the ring', true);
        } else if (b) b.held = null;
        c.ball = null; c.tgt = null;
      }
    } else if (c.st === 'throw') { c.pitch = lerp(-2.85, -1.05, Math.min(1, c.t / C.throw)); if (c.t >= C.throw) { c.st = 'reload'; c.t = 0; } }
    else if (c.st === 'reload') { c.pitch = lerp(-1.05, -1.25, Math.min(1, c.t / C.reload)); if (c.t >= C.reload) { c.st = 'idle'; c.t = 0; c.cool = 3.4 + Math.random() * 1.8; } }
    const o = c.obj; if (o) { o.live = true; o.visible = true; o.x = c.x; o.y = 1.75 * sc; o.z = c.z; o.yaw = c.yaw; o.pitch = c.pitch; o.roll = 0; o.scale = sc; }
  }
  for (const b of L.balls) {
    const o = b.obj;
    if (b.held) { const c = b.held; dkpArmTip(c, c.pitch, sc); b.x = DKP_T.tip[0]; b.y = DKP_T.tip[1] + 0.5; b.z = DKP_T.tip[2]; if (o) { o.live = true; o.visible = true; o.x = b.x; o.y = b.y; o.z = b.z; o.yaw = s.time * 3; o.pitch = 0; o.roll = 0; o.scale = 0.9 + Math.min(1, c.t / C.wind) * 0.5; } continue; }
    if (!b.live) { if (o) { o.live = false; o.visible = false; } continue; }
    b.t += dt; const u = Math.min(1, b.t / C.flight);
    b.x = lerp(b.x0, b.x1, u); b.z = lerp(b.z0, b.z1, u); b.y = lerp(b.y0, b.gy + 0.6, u) + 14 * u * (1 - u) * 4 * 0.5;
    if (u > 0.2) cartIxObs(s, b.x1, b.z1, C.R + 0.6);
    if (u >= 1) {
      b.live = false;
      for (const k of s.karts) { if (k.out || k.y > b.gy + 2.2) continue; if (Math.hypot(k.x - b.x1, k.z - b.z1) < C.R) { if (CartKit.hit(s, k, 'spin', 'catapult', { dur: 1.1, banner: 'FIREBALL!' }) && k.player) L.burn = 1.0; } }
      const sq = L.scorch.reduce((a, q) => (q.t > a.t ? q : a)); sq.t = 0; sq.x = b.x1; sq.z = b.z1;
      if (CartKit.near(s, b.x1, b.z1, 90)) { cartIxSound(s, 'cartBoom', b.x1, b.z1, 0.9, 0.8); cartIxSound(s, 'flame', b.x1, b.z1, 0.7, 0.8); }
      if (CartKit.near(s, b.x1, b.z1, 30)) s.shakeIt(0.4);
      if (s.fx && CartKit.near(s, b.x1, b.z1, 140)) { s.fx.burst(b.x1, b.gy + 0.8, b.z1, 'flame', 18, '#ff8a2a'); s.fx.spark(b.x1, b.gy + 0.6, b.z1, 22, '#ffd060', 9); s.fx.smoke(b.x1, b.gy + 1, b.z1, 8, '#4a3a34'); s.fx.ring(b.x1, b.gy + 0.3, b.z1, 4, '#ff8a2a', 0.5); }
    }
    if (o) { o.live = true; o.visible = true; o.x = b.x; o.y = b.y; o.z = b.z; o.yaw = s.time * 5; o.pitch = s.time * 3; o.roll = 0; o.scale = 1.6; }
  }
}
// the world position of a catapult's bucket at arm pitch p (into DKP_T.tip): the arm runs along local +z from the axle
function dkpArmTip(c, p, sc) { const ly = -Math.sin(p) * 4.3 * sc, lz = Math.cos(p) * 4.3 * sc, fx = Math.sin(c.yaw), fz = Math.cos(c.yaw); DKP_T.tip[0] = c.x + fx * lz; DKP_T.tip[1] = 1.75 * sc + ly; DKP_T.tip[2] = c.z + fz * lz; return DKP_T.tip; }

// ---- sprites: the gate's amber warning and shut cross, the portcullis chevrons, the knight's lane, the fire rings ----
function dkpDraw(s, L, R, S, t) {
  const C = DKP_C, cam = s.cam, T = s.T || s.TR, at = DKP_T.at2;
  for (const q of L.gates) {
    if ((q.x - cam.x) ** 2 + (q.z - cam.z) ** 2 > 200 * 200) continue;
    for (const lf of q.leaves) {
      const mx = -lf.sd * q.nx, mz = -lf.sd * q.nz, cx = lf.px + mx * lf.len / 2, cz = lf.pz + mz * lf.len / 2, yawA = Math.atan2(mx, mz);
      if (lf.tele > 0 || lf.moving) {
        // the half of the road this leaf will close flashes amber, an arrow sweeps across it, the bell glows
        const fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 20)), w = lf.tele > 0 ? lf.tele : 1;
        R.flat.flat(cx, 0.1, cz, 3.4, lf.len, yawA, S.square, C.amber, 0.45 * w * fl, true);
        for (let i = 0; i < 3; i++) { const u = (t * 1.6 + i / 3) % 1; R.flat.flat(lf.px + mx * (1.5 + u * (lf.len - 2)), 0.12, lf.pz + mz * (1.5 + u * (lf.len - 2)), 2.4, 2.4, yawA, S.arrow, C.gold, 0.9 * w * (1 - u * 0.5), true); }
        R.bbs.bb(lf.px + q.tx * 0 - mx * 0.2, 4.9, lf.pz - mz * 0.2, 2.2, 2.2, S.glow, C.amber, 0.9 * fl, true);
      }
      if (lf.a > 0.9) { R.flat.flat(cx, 0.1, cz, 3.0, lf.len, yawA, S.square, C.red, 0.35, true); R.bbs.bb(cx, 4.4, cz, 1.6, 1.6, S.cross, C.red, 0.9, true); }
    }
  }
  const P = L.port;
  if ((P.x - cam.x) ** 2 + (P.z - cam.z) ** 2 < 220 * 220) {
    if (P.tele > 0 || P.y < 1.3) {
      // the road under it: red chevrons pointing back at the traffic, the gatehouse lamps blink
      const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 18)), a = P.tele > 0 ? P.tele : 1;
      R.flat.flat(P.x, 0.1, P.z, P.w, 4, P.yaw, S.square, C.red, 0.4 * a * fl, true);
      for (let i = 1; i <= 3; i++) for (const d of [-0.5, 0, 0.5]) { const x = P.x - P.tx * i * 4 + P.nx * d * P.w * 0.6, z = P.z - P.tz * i * 4 + P.nz * d * P.w * 0.6; R.flat.flat(x, 0.11, z, 2.6, 2.6, P.yaw + Math.PI, S.arrow, C.red, 0.8 * a * fl * (1 - i * 0.2), true); }
      for (const sd of [-1, 1]) R.bbs.bb(P.x + P.nx * sd * (P.w / 2 + 2), 9, P.z + P.nz * sd * (P.w / 2 + 2), 3, 3, S.glow, C.red, fl, true);
      if (P.tele > 0 && s.fx && Math.random() < 0.4 && CartKit.near(s, P.x, P.z, 80)) s.fx.dust(P.x + P.nx * (Math.random() - 0.5) * P.w, P.y + 7, P.z + P.nz * (Math.random() - 0.5) * P.w, 1, '#a89878');
    }
  }
  for (const n of L.knights) {
    if ((n.x - cam.x) ** 2 + (n.z - cam.z) ** 2 > 220 * 220) continue;
    if (n.st === 'warn' || n.st === 'charge') {
      // the lane he rides lights up: arrows pointing at the traffic, his colour, from him down to the start of the lists
      const col = n.i ? C.blue : C.crimson, fl = 0.45 + 0.55 * Math.max(0, Math.sin(t * 14)), a = n.st === 'warn' ? Math.min(1, n.ph / 0.5) : 0.75;
      for (let sv = n.s - 4; sv > L.lists.s0 - 2; sv -= 6) { T.at(sv, at); const x = at.x + at.nx * n.d, z = at.z + at.nz * n.d; R.flat.flat(x, 0.1, z, 3.2, 3.2, at.yaw + Math.PI, S.arrow, col, 0.8 * a * fl, true); }
      R.bbs.bb(n.x, 5.6, n.z, 3.4, 3.4, S.glow, col, 0.5 + 0.3 * fl, true);
      if (n.st === 'charge' && s.fx && Math.random() < 0.5 && CartKit.near(s, n.x, n.z, 120)) s.fx.dust(n.x, 0.3, n.z, 2, '#c8a878');
    }
  }
  for (const b of L.balls) {
    if (b.held) { R.bbs.bb(b.x, b.y, b.z, 2.6, 2.6, S.glow, C.fire, 0.7, true); if (s.fx && Math.random() < 0.5 && CartKit.near(s, b.x, b.z, 120)) s.fx.fire(b.x, b.y, b.z, 0.8); continue; }
    if (!b.live) continue;
    const u = Math.min(1, b.t / DKP_CAT.flight), gy = b.gy + 0.1, bl = 0.55 + 0.45 * Math.sin(t * (14 + u * 20)), r0 = DKP_CAT.R * 2;
    // the ring of fire: closes in, the shadow grows, a cross of flame in the middle
    R.flat.flat(b.x1, gy, b.z1, r0 * (1.5 - u * 0.5), r0 * (1.5 - u * 0.5), t * 2, S.ring, C.fire, 0.95 * bl, true);
    R.flat.flat(b.x1, gy + 0.01, b.z1, r0, r0, 0, S.glow, C.ember, 0.35 + 0.3 * u, true);
    R.flat.flat(b.x1, gy - 0.02, b.z1, 1 + u * 3.5, 1 + u * 3.5, 0, S.shadow, C.black, 0.25 + u * 0.45, false);
    R.bbs.bb(b.x, b.y, b.z, 4.5, 4.5, S.glow, C.fire, 0.8, true);
    if (s.fx && CartKit.near(s, b.x, b.z, 140)) { s.fx.fire(b.x, b.y, b.z, 1.3); if (Math.random() < 0.4) s.fx.smoke(b.x, b.y, b.z, 1, '#5a4a44'); }
  }
  for (const q of L.scorch) {
    if (q.t > 4) continue;
    const a = 1 - q.t / 4, gy = s.terrain.height(q.x, q.z) + 0.08;
    R.flat.flat(q.x, gy, q.z, 7, 7, 0, S.shadow, C.black, 0.6 * a, false);
    if (q.t < 1.6) for (let i = 0; i < 5; i++) { const ang = i * 1.26 + q.x, r = 1.2 + (i % 2) * 0.9, h = (1.4 + Math.sin(t * 9 + i) * 0.3) * (1 - q.t / 1.6); R.bbs.bb(q.x + Math.sin(ang) * r, gy + h * 0.5, q.z + Math.cos(ang) * r, 1.2 * h, 1.6 * h, S.flame, C.fire, 0.9, true); }
  }
  // the moat shimmers
  const B = s.E.dkp.bridge; if ((B.x - cam.x) ** 2 + (B.z - cam.z) ** 2 < 160 * 160) for (let i = -6; i <= 6; i++) { const u = i / 6, x = B.x + B.nx * u * 40 + B.tx * Math.sin(t * 1.3 + i) * 1.5, z = B.z + B.nz * u * 40 + B.tz * Math.sin(t * 1.3 + i) * 1.5; R.flat.flat(x, 0.06, z, 1.2, 3.5, Math.atan2(B.nx, B.nz), S.glow, C.water, 0.18 + 0.12 * Math.sin(t * 3 + i * 1.7), true); }
}

if (typeof window !== 'undefined') setTimeout(() => {
  const C = window.BRADY_CART; if (!C || !C.debug) return;
  // hazard screenshots (tools/cart_track_test.js reads debug.trackShots[track] when it is there, so several career
  // tracks can register their own without overwriting each other's debug.levelShots)
  const shotNames = ['gate-warn', 'gate', 'bridge', 'catapult', 'fireball', 'joust-warn', 'joust', 'portcullis-warn', 'portcullis', 'keep'];
  const shot = name => {
    const D = C.debug, STEP = 1 / 60;
    D.start({ mode: 'quick', track: 'keep', car: 'dragon', driver: 'brady', seed: 9, autoGas: true });
    const s = D.scene(); s.state = 'race'; s.stateT = 0; window.BRADY.Input.setMode('game'); s.layoutControls(); s.update(STEP);
    const L = s.dkp, T = s.T, P = s.player, Q = s.E.dkp;
    let pin = null; const pins = [];
    const park = (sv, lat, speed, frozen) => { const g = T.at(sv, {}); D.place(-1, g.x + g.nx * g.hw * lat, g.z + g.nz * g.hw * lat, g.yaw, { speed: speed || 0, frozen: false }); P.prevS = P.loc.s; P.lap = 1; P.prog = P.loc.s; pin = frozen ? { x: P.x, z: P.z, yaw: P.yaw } : null; };
    const rivals = list => { let j = 0; for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = list[j++] || [-300 - j * 12, 0, 1]; const g = T.at(P.loc.s + r[0], {}); D.place(i, g.x + g.nx * g.hw * r[1], g.z + g.nz * g.hw * r[1], g.yaw, { speed: r[2] ? 0 : 18, frozen: false }); if (r[2]) pins.push({ k, x: k.x, z: k.z, yaw: k.yaw }); k.prevS = k.loc.s; k.lap = 1; k.prog = k.loc.s; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } k.wpn.t = 99; } };
    s.autoDrive = true; if (!P.ai) s.aiInput(P, STEP, true); P.ai.itemT = 99; P.ai.fireT = 99; P.wpn.t = 99;
    const hold = () => { if (pin) { P.x = pin.x; P.z = pin.z; P.yaw = pin.yaw; P.vx = P.vz = 0; } for (const q of pins) { q.k.x = q.x; q.k.z = q.z; q.k.yaw = q.yaw; q.k.vx = q.k.vz = 0; } };
    const wait = (fn, secs) => { for (let i = 0; i < secs * 60; i++) { s.update(STEP); hold(); if (fn()) return true; } return false; };
    let ok = true;
    if (name === 'gate-warn' || name === 'gate') { const q = L.gates[0], lf = q.leaves[0]; park(q.s - 22, lf.sd * 0.15, 0, true); rivals([[-30, 0, 1]]); ok = wait(() => name === 'gate' ? lf.a > 0.97 : lf.tele > 0.6, 9); }
    else if (name === 'bridge') { park(Q.bridge.s - 60, 0, 30, false); rivals([[8, 0.3, 0], [14, -0.3, 0], [-8, 0, 0]]); ok = wait(() => P.air && P.y > 3.5, 6); }
    else if (name === 'catapult' || name === 'fireball') { const c = L.cats[1]; park(c.s - 14, 0, 0, true); rivals([[-60, 0, 1]]); for (const o of L.cats) if (o !== c) o.cool = 99; c.cool = 0; ok = wait(() => name === 'catapult' ? c.st === 'wind' && c.t > 0.7 : L.balls.some(b => b.live && b.t > 0.75), 9); }
    else if (name === 'joust-warn' || name === 'joust') { const n = L.knights[0]; park(L.lists.s0 + 8, n.sd * 0.25, 0, true); rivals([[-50, 0, 1]]); ok = wait(() => name === 'joust' ? n.st === 'charge' && n.s - L.lists.s0 < 40 : n.st === 'warn' && n.ph > 0.9, 20); }
    else if (name === 'portcullis-warn' || name === 'portcullis') { park(L.port.s - 22, 0, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'portcullis' ? L.port.y < 0.05 : L.port.tele > 0.7, 10); }
    else if (name === 'keep') { park(CartKit.sOf(T, 20, -10), -0.2, 0, true); rivals([[-60, 0, 1]]); wait(() => false, 0.4); s.updateCamera = function () { const c = this.cam; c.x = 60; c.y = 24; c.z = 20; c.tx = 25; c.ty = 22; c.tz = 105; c.fov = 1.0; c.roll = 0; }; }
    s.snapCam = true; for (let i = 0; i < 4; i++) { D.step(1, 1); hold(); }
    return { ok, draws: s.stats.draws, tris: s.stats.tris, hits: (s.kit || {}).hits, p: [+P.x.toFixed(1), +P.z.toFixed(1), +P.loc.s.toFixed(1)] };
  };
  C.debug.trackShots = C.debug.trackShots || {};
  C.debug.trackShots.keep = { list: () => shotNames.map(name => ({ name })), shot };
  C.debug.keepLevel = () => { const s = Game.scene, K = s.kit || {}, L = s.dkp; return { hits: K.hits || {}, touch: K.touch || {}, fired: K.fired || {}, L: s.T ? +s.T.L.toFixed(1) : 0, knights: L ? L.knights.map(n => n.st) : null, port: L ? +L.port.y.toFixed(2) : null, cats: L ? L.cats.map(c => c.st) : null }; };
}, 0);
