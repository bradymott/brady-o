/* ============================================================
   ART CART — SHARK DUNES, Dune Chomper's career track (level agent "shark", Nov 19 2026).
   Recipe: docs/ART_CART_LEVEL_RECIPE.md (Love Parade is the worked example). A beach where the sea is SAND: big
   rolling dunes, striped buoys bobbing on the sand, lifeguard towers watching for fins, red mesas on the skyline.
   One lap of about 1.1 km, clockwise:
     LIFEGUARD STRAIGHT  the start (west side, heading north) under the SHARK DUNES lifeguard gantry, then THE
                         LAUNCH: a sand tabletop jump
     DUNE ROLLERS        a run of rolling sand whoops on the north-west diagonal
     THE DUNE RUN        the north straight: a second tabletop, then the SAND MAW's lair. The ground cracks in a ring
                         and two eye-stalks peep out over ONE lane (1.4 s), then a big round burrower bursts up and
                         GULPS: anyone on the ground in the ring is flipped. Take the other lane (or be in the air)
     QUICKSAND BASIN     a wide bowl round an S-bend: four patches of sand ripple and churn (1.3 s), then turn to
                         QUICKSAND (2.8 s): it drags you down, and the middle bogs you right in. They open in pairs on
                         opposite sides: weave between them, or HOP over one
     FIN ALLEY           the east straight: three FINS cruise in the sand beside the road. One stops, rises and sprays
                         a line of sand across the road (1.3 s), then DASHES across: a fin slap knocks you aside. Let it
                         pass, slip by behind, or HOP it
     DUST DEVIL FLATS    the long south straight across a cracked salt flat: dust devils brew at the roadside (a swirl
                         on the ground, 1.4 s), then wander across the road. The core whirls you up; the edge shoves you
                         and sands your windscreen. Steer round them: they drift slowly and straight
   DUNE CHOMPER's SAND DIVE is in everyone's gift boxes here (CART_TRACKS.sharkdunes.car = 'shark').
   Start it without the menus: BRADY_CART.debug.start({ mode: 'career', track: 'sharkdunes' }) (or mode 'quick').
   Globals are prefixed SHD_ / shd, level state lives on E.shd and s.shd. All designs here are original.
   ============================================================ */
const SHD_C = { sand: [0.93, 0.8, 0.58], sandDark: [0.7, 0.52, 0.32], dust: [0.86, 0.72, 0.52], white: [1, 1, 1], black: [0, 0, 0], warn: [1, 0.55, 0.15], hot: [1, 0.3, 0.2], teal: [0.2, 0.85, 0.85], coral: [1, 0.45, 0.35], mud: [0.42, 0.3, 0.18], lilac: [0.78, 0.6, 1], gold: [1, 0.85, 0.3] };
const SHD_T = { at: {}, at2: {}, lanes: [] };

/* ---------------- the course ---------------- */
// corners [x, z, radius] in the order of travel: the south-east corner, the south-west corner, up the lifeguard
// straight, the north-west kink, the dune run, the basin's S-bend, the top of fin alley
const SHD_POLY = [[189, -107, 34], [-148, -123, 36], [-185, 115, 28], [-90, 168, 26], [49, 160, 22], [123, 98, 20], [90, 33, 22], [176, -8, 26]];
const SHD_BASIN = [92, 40];
const shdWidth = (x, z) => {
  const b = Math.hypot(x - SHD_BASIN[0], z - SHD_BASIN[1]);
  if (b < 70) return 1 + 0.45 * BurnsM.smoothstep(0, 1, 1 - b / 70);   // the quicksand basin widens
  if (z < -95 && x > -110 && x < 150) return 1.18;                       // the salt flat
  return 1;
};
// registries (assign through the same guards, never redeclare)
var CART_TRACK_RULES = (typeof CART_TRACK_RULES !== 'undefined' && CART_TRACK_RULES) || {};
var CART_CAREER_TRACKS = (typeof CART_CAREER_TRACKS !== 'undefined' && CART_CAREER_TRACKS) || {};
CART_TRACKS.sharkdunes = {
  name: 'SHARK DUNES', car: 'shark', tod: 'day', music: 'kart3', width: 20, shoulder: 6, theme: 'dunes', blurb: 'Fins in the sand, quicksand, dust devils and big dune jumps',
  get pts() { return this._pts || (this._pts = CartKit.course(SHD_POLY, { start: [-168, 0], width: shdWidth, step: 18 })); },   // lazy
  world: (id, D) => shdWorld(id, D)
};
CART_CAREER_TRACKS.shark = 'sharkdunes';

/* ---------------- shapes shared by the track and the arena (43_cart_i_royale_sandpit.js) ---------------- */
// a FIN cruising through sand, facing +z, about 3 m tall at scale 1: a slate fin with a pale tip, a nick out of the
// trailing edge and three glowing teal freckles; a sand wake heaped round its base
function shdFin(m, lo) {
  const P = SHD_FIN_P;
  m.push(); m.tf(0, 0, 0, Math.PI / 2);
  m.color('#4a6a8a').shine(3); m.extrude(P, 0.44, { convex: false });
  m.color('#dfe8f0').shine(3); m.extrude([[0.55, 2.55], [0.95, 2.62], [1.35, 2.95], [0.85, 2.9]], 0.48, { convex: false });
  m.color('#3af0e0', 0.9); for (const [x, y] of [[-0.6, 0.8], [-0.15, 1.25], [0.25, 1.75]]) for (const sd of [-1, 1]) m.ball(x, y, sd * 0.2, 0.13, { seg: 6, rings: 4 }); m.emissive(0);
  m.pop();
  // the heaped sand round the base (a wake ridge behind)
  m.color('#e8c890').shine(0); const sg = lo ? 10 : 16;
  m.ellipsoid(0, -0.05, 0.1, 1.15, 0.45, 2.3, { seg: sg, rings: 6 }); m.ellipsoid(0, -0.1, -1.9, 0.8, 0.32, 1.5, { seg: sg - 4, rings: 5 });
  m.shine(0);
}
// a tumbleweed: a loose ball of twigs
function shdTumble(m) {
  m.color('#a8804a').shine(0);
  for (let i = 0; i < 14; i++) { const a = i * 2.4, b = Math.acos(1 - 2 * ((i + 0.5) / 14)), x = Math.sin(b) * Math.cos(a), y = Math.cos(b), z = Math.sin(b) * Math.sin(a); m.limb(-x * 0.9, 0.95 - y * 0.9, -z * 0.9, x * 0.95, 0.95 + y * 0.95, z * 0.95, 0.07, 0.05, { seg: 4, ends: false }); }
  m.color('#8a6a3a'); m.torus(0, 0.95, 0, 0.8, 0.06, { seg: 12, tseg: 3 }); m.push(); m.tf(0, 0.95, 0, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.85, 0.06, { seg: 12, tseg: 3 }); m.pop();
}

/* ---------------- static pieces (merged into the world's chunks) ---------------- */
// the start gantry: two wooden lifeguard stilts either side, a plank bridge across the road at 12.5 m with a red and
// white striped canopy and the name board
function shdGantry(m, W) {
  const h = 12.5;
  for (const sd of [-1, 1]) {
    const x = sd * W / 2;
    m.color('#c8925a').shine(1);
    for (const dx of [-1.1, 1.1]) for (const dz of [-1.1, 1.1]) m.limb(x + dx, 0, dz, x + dx * 0.7, h, dz * 0.7, 0.24, 0.2, { seg: 8 });
    for (let y = 2.5; y < h; y += 3.2) { m.limb(x - 1.05, y, -1.05, x + 1.0, y + 1.6, 1.0, 0.09, 0.09, { seg: 5 }); m.limb(x + 1.05, y, -1.05, x - 1.0, y + 1.6, 1.0, 0.09, 0.09, { seg: 5 }); }
    m.color('#ffffff').shine(2); m.roundBox(x, h + 1.1, 0, 3.4, 2.2, 3.4, 0.3);
    m.color('#ff5a4a'); m.roundBox(x, h + 1.1, 0, 3.46, 0.5, 3.46, 0.1);
    m.color('#ffd23a').shine(3); m.ball(x, h + 3.3, 0, 0.45, { seg: 10, rings: 8 });
    m.color('#e8c890').shine(0); m.roundCyl(x, 0, 0, 2.2, 0.5, 0.3);
  }
  // the bridge: planks, a rail, the striped canopy above it
  m.color('#b88250').shine(1); m.roundBox(0, h - 0.2, 0, W, 0.5, 2.6, 0.15);
  m.color('#e8b878'); for (let x = -W / 2 + 1; x < W / 2; x += 1.6) m.box(x, h + 0.08, 0, 0.12, 0.06, 2.6);
  m.color('#ffffff').shine(2); for (const sz of [-1.2, 1.2]) m.limb(-W / 2, h + 1.0, sz, W / 2, h + 1.0, sz, 0.1, 0.1, { seg: 6, ends: false });
  const n = Math.max(8, Math.round(W / 2.2));
  for (let i = 0; i < n; i++) { const x0 = -W / 2 + i * W / n; m.color(i % 2 ? '#ffffff' : '#ff5a4a').shine(1); m.push(); m.tf(x0 + W / n / 2, h + 3.3, 0, 0, 0, 0); m.roundBox(0, 0, 0, W / n + 0.02, 0.2, 3.6, 0.08); m.pop(); m.limb(x0 + W / n / 2, h + 3.2, -1.8, x0 + W / n / 2, h + 2.6, -2.2, 0.12, 0.05, { seg: 4 }); }
  m.color('#c8925a'); for (const sx of [-1, 1]) m.limb(sx * W / 2, h, 0, sx * (W / 2 - 1), h + 3.2, 0, 0.12, 0.12, { seg: 6 });
  m.shine(0);
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 1.6, y0: 0, y1: h, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: 1.6, y0: 0, y1: h, camPass: true }] };
}
// a lifeguard tower beside fin alley (facing +z = the road): stilts, a hut with a striped roof, a ladder, a flag
function shdTower(m) {
  m.color('#c8925a').shine(1);
  for (const dx of [-1.4, 1.4]) for (const dz of [-1.4, 1.4]) m.limb(dx, 0, dz, dx * 0.8, 5.2, dz * 0.8, 0.18, 0.15, { seg: 8 });
  m.limb(-1.4, 1.2, -1.4, 1.4, 4, 1.4, 0.07, 0.07, { seg: 4 }); m.limb(1.4, 1.2, -1.4, -1.4, 4, 1.4, 0.07, 0.07, { seg: 4 });
  for (let y = 0.6; y < 5; y += 0.7) m.box(0, y, 2.6 - y * 0.25, 1.2, 0.08, 0.2);
  m.limb(-0.6, 0, 2.75, -0.6, 5.2, 1.45, 0.06, 0.06, { seg: 4 }); m.limb(0.6, 0, 2.75, 0.6, 5.2, 1.45, 0.06, 0.06, { seg: 4 });
  m.color('#ffffff').shine(2); m.roundBox(0, 6.4, 0, 3.4, 2.4, 3.2, 0.25);
  m.color('#3a4a5a'); m.roundBox(0, 6.7, 1.62, 2.4, 1.0, 0.06, 0.05);
  m.color('#ff5a4a'); m.roundBox(0, 5.3, 1.66, 3.4, 0.35, 0.08, 0.04);
  for (let i = 0; i < 6; i++) { m.color(i % 2 ? '#ffffff' : '#ff5a4a').shine(1); m.push(); m.tf(-1.75 + (i + 0.5) * 0.583, 7.9, 0, 0, 0, 0); m.roundBox(0, 0, 0, 0.6, 0.25, 4.0, 0.08); m.pop(); }
  m.color('#dfe6ee').shine(3); m.limb(1.6, 7.6, -1.4, 1.6, 11.2, -1.4, 0.06, 0.06, { seg: 5 });
  m.color('#ff3a2a').shine(0); m.push(); m.tf(2.3, 10.6, -1.4); m.roundBox(0, 0, 0, 1.4, 0.9, 0.05, 0.03); m.pop();
  m.color('#ffffff'); m.push(); m.tf(2.3, 10.6, -1.37); m.extrude([[-0.3, -0.3], [0.35, -0.3], [0.0, 0.32]], 0.06); m.pop();
  m.color('#ff8a2a').shine(2); m.torus(1.75, 6.2, 1.7, 0.45, 0.12, { seg: 12, tseg: 5 });
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.7, hz: 1.7, y0: 0, y1: 8 }] };
}
// THE CHOMPER: a giant sand sculpture of a land-shark leaping nose-up out of a dune: torpedo body, big dorsal fin,
// crescent tail still in the sand, sunglasses and a toothy grin; a bucket, a spade and little castles round it
const SHD_FIN_P = [[-1.8, -0.4], [1.4, -0.4], [1.05, 0.5], [0.9, 1.1], [0.95, 1.55], [0.7, 1.75], [0.95, 2.05], [1.35, 2.95], [0.85, 2.9], [0.25, 2.55], [-0.35, 1.95], [-0.95, 1.2], [-1.45, 0.45]];
function shdSculpture(m) {
  const sand = '#e6c48a', wet = '#b88a52';
  m.color(sand).shine(0);
  m.ellipsoid(0, 0, -6, 20, 5.5, 16, { seg: 28, rings: 10, phi0: Math.PI / 2 });   // the dune it bursts from
  m.push(); m.tf(0, 9.5, 0, 0, -0.55);   // body frame: z along the body (nose +z), tipped nose-up
  m.color(sand); m.ellipsoid(0, 0, 0, 4.8, 4.4, 13, { seg: 26, rings: 16 });
  m.ellipsoid(0, -0.4, 11.2, 3.6, 3.2, 4.6, { seg: 20, rings: 12 });                 // the snout
  m.color('#f2dcb0'); m.ellipsoid(0, -2.2, 3, 3.6, 2.4, 10, { seg: 20, rings: 10 });   // a paler belly
  // the dorsal fin and the crescent tail (flat, thick slabs of sand)
  m.color(sand); m.push(); m.tf(0, 3.4, -1, Math.PI / 2, 0, 0, 2.6, 2.6, 2.6); m.extrude(SHD_FIN_P, 0.4, { convex: false }); m.pop();
  m.push(); m.tf(0, 0.3, -12.5, Math.PI / 2, 0, 0, 2.3, 2.3, 2.3); m.extrude([[-1, -0.5], [1.5, -0.3], [3.2, 3.2], [2.4, 3.0], [0.4, 0.8]], 0.5, { convex: false }); m.extrude([[1.5, 0.3], [3.0, -2.0], [2.6, -2.4], [0.4, -0.6], [-1, 0.5]], 0.5, { convex: false }); m.pop();
  for (const sd of [-1, 1]) { m.push(); m.tf(sd * 4.6, -2, 5, sd * 0.5, 0, sd * 0.45); m.ellipsoid(0, 0, 0, 4.0, 0.8, 2.2, { seg: 14, rings: 8 }); m.pop(); }
  // gills
  m.color(wet); for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) m.limb(sd * 4.3, 1.6, 6.5 - i * 1.3, sd * 4.5, -1.4, 6.0 - i * 1.3, 0.22, 0.22, { seg: 5 });
  // a big friendly grin and rounded teeth
  { let px = 0, py = 0, pz = 0; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI, x = Math.cos(a) * 3.0, y = -1.6 - Math.sin(a) * 0.7, z = 12.6 + Math.sin(a) * 2.3; if (i) m.limb(px, py, pz, x, y, z, 0.36, 0.36, { seg: 6 }); px = x; py = y; pz = z; } }
  m.color('#fff6e4').shine(2); for (let i = 1; i < 8; i++) { const a = i / 8 * Math.PI; m.ball(Math.cos(a) * 2.8, -1.3 - Math.sin(a) * 0.6, 12.6 + Math.sin(a) * 2.2, 0.42, { seg: 8, rings: 6 }); }
  // sunglasses on the snout
  m.color('#1a2230').shine(4); for (const sd of [-1, 1]) { m.push(); m.tf(sd * 1.7, 1.6, 13.4, sd * 0.25, -0.3); m.roundBox(0, 0, 0, 2.6, 1.7, 0.5, 0.45); m.pop(); }
  m.color('#ff4a8a').shine(3); m.limb(-3.4, 1.9, 12.6, 3.4, 1.9, 12.6, 0.18, 0.18, { seg: 6 });
  m.pop();
  // the bucket, the spade, little castles
  m.color('#ff5a4a').shine(3); m.push(); m.tf(14, 0, 9); m.lathe([[0, 0], [2.1, 0], [2.6, 3.6], [2.4, 3.7], [1.9, 0.3], [0, 0.3]], { seg: 20 }); m.pop();
  m.color('#3ac8f0').shine(3); m.push(); m.tf(-13, 3.5, 10, 0.5, 0, 0.5); m.limb(0, 0, 0, 0, 7, 0, 0.3, 0.3, { seg: 8 }); m.roundBox(0, -1.4, 0, 2.2, 3.0, 0.3, 0.3); m.pop();
  m.color(sand).shine(0); for (const [x, z, h] of [[-15, -6, 4.5], [-19, -2, 3.5], [-12, -10, 3.2]]) { m.cyl(x, 0, z, 1.6, 1.4, h, 12); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; m.box(x + Math.cos(a) * 1.25, h + 0.4, z + Math.sin(a) * 1.25, 0.5, 0.8, 0.5); } }
  m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 15, y0: 0, y1: 22 }] };
}
// a red mesa for the skyline: stacked banded layers, a talus slope of boulders
function shdMesa(m, w, h, seed) {
  const r = mulberry32(seed), C = ['#c8643a', '#d87a48', '#b85432', '#e09058', '#a84a30'];
  m.color('#d8a070').shine(0); m.ellipsoid(0, 0, 0, w * 0.75, h * 0.28, w * 0.55, { seg: 20, rings: 6, phi0: Math.PI / 2 });
  let y = 0; for (let i = 0; i < 5; i++) { const lh = h / 5, k = 1 - i * 0.05 + (r() - 0.5) * 0.06; m.color(C[i % C.length]); m.roundBox((r() - 0.5) * 2, y + lh / 2, (r() - 0.5) * 2, w * 0.9 * k, lh + 0.2, w * 0.6 * k, 1.4); y += lh; }
  m.color('#e8a868'); m.roundBox(0, h + 0.2, 0, w * 0.72, 0.6, w * 0.45, 0.3);
  m.shine(0);
  return { cols: [] };
}

/* ---------------- instanced props (this world only) ---------------- */
const SHD_KINDS = {
  // a striped buoy bobbing on the sand (tinted stripe colour; the white stays white-ish)
  // a red and white striped buoy sitting on the sand, a yellow lamp on top (fixed colours: put it with white)
  shd_buoy: { r: 1.2, near: 34, mid: 120, farD: 300,
    build(m) { const sg = m.lo ? 10 : 16; m.color('#ff4a3a').shine(3); m.lathe([[0, -0.1], [1.0, 0.0], [1.12, 0.5], [1.0, 1.2], [0.62, 1.85], [0.2, 2.0], [0, 2.0]], { seg: sg }); m.color('#ffffff').shine(3); m.torus(0, 0.85, 0, 1.08, 0.2, { seg: sg, tseg: 5 }); m.torus(0, 1.55, 0, 0.82, 0.17, { seg: sg, tseg: 5 }); m.color('#e8eef4').shine(3); m.cyl(0, 1.95, 0, 0.12, 0.1, 0.9, 6); m.color('#ffd23a', 0.5); m.ball(0, 2.95, 0, 0.24, { seg: 8, rings: 6 }); m.emissive(0); m.color('#e8c890').shine(0); m.ellipsoid(0, 0.02, 0, 1.45, 0.3, 1.45, { seg: sg, rings: 4 }); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.0, y0: 0, y1: 2 }] }; },
    far(m) { m.color('#ff4a3a'); m.ball(0, 0.9, 0, 1.0, { seg: 6, rings: 4 }); m.color('#ffffff'); m.box(0, 0.9, 0, 2.2, 0.35, 2.2); } },
  // a saguaro-ish cactus with two arms (tinted green)
  shd_cactus: { r: 1.4, near: 40, mid: 130, farD: 320,
    build(m) { const sg = m.lo ? 7 : 10; m.color('#ffffff').shine(1); m.limb(0, 0, 0, 0, 6.2, 0, 0.62, 0.55, { seg: sg }); m.ball(0, 6.2, 0, 0.55, { seg: sg, rings: 6 }); for (const [sd, y, h] of [[1, 2.4, 2.4], [-1, 3.2, 1.8]]) { m.limb(0, y, 0, sd * 1.5, y, 0, 0.36, 0.36, { seg: sg - 2 }); m.limb(sd * 1.5, y, 0, sd * 1.5, y + h, 0, 0.38, 0.32, { seg: sg - 2 }); m.ball(sd * 1.5, y + h, 0, 0.32, { seg: sg - 2, rings: 5 }); } m.color('#ff6a9a').shine(2); m.ball(0, 6.75, 0, 0.22, { seg: 6, rings: 4 }); m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.7, y0: 0, y1: 6 }] }; },
    far(m) { m.color('#ffffff'); m.box(0, 3.1, 0, 1.1, 6.2, 1.1); m.box(0, 3, 0, 3.2, 0.6, 0.6); } },
  // a beach umbrella with a towel under it (tinted canopy)
  shd_umbrella: { r: 2.4, near: 36, mid: 120, farD: 280,
    build(m) { const sg = m.lo ? 8 : 12; m.color('#f4f4f4').shine(2); m.limb(0, 0, 0, 0.3, 3.4, 0, 0.07, 0.07, { seg: 5 }); m.color('#ffffff').shine(1); m.push(); m.tf(0.3, 3.4, 0, 0, 0, 0.12); m.lathe([[2.4, -0.6], [1.6, -0.15], [0.6, 0.15], [0, 0.22]], { seg: sg }); m.pop(); m.color('#ffe4b0'); m.roundBox(1.4, 0.04, 0.6, 1.6, 0.08, 3.0, 0.04); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.3, y0: 0, y1: 3, camPass: true }] }; },
    far(m) { m.color('#ffffff'); m.cyl(0.3, 2.8, 0, 2.2, 0.2, 0.8, 6); } },
  // a sandstone boulder (tinted)
  shd_rock: { r: 2.6, near: 40, mid: 140, farD: 340, soft: 0.2,
    build(m) { const sg = m.lo ? 7 : 11; m.color('#ffffff').shine(0); m.ellipsoid(0, 1.1, 0, 2.6, 1.5, 2.0, { seg: sg, rings: 6 }); m.ellipsoid(1.4, 0.7, 0.9, 1.4, 1.0, 1.2, { seg: sg - 2, rings: 5 }); m.ellipsoid(-1.2, 1.9, -0.3, 1.3, 0.9, 1.1, { seg: sg - 2, rings: 5 }); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.6, y0: 0, y1: 2.6 }] }; },
    far(m) { m.color('#ffffff'); m.ball(0, 1.1, 0, 2.4, { seg: 6, rings: 4 }); } }
};

/* ---------------- building the world ---------------- */
function shdWorld(id, D) {
  const sky = Object.assign({}, CART_SKIES.day(), { zen: '#2f6ad0', hor: '#ffe2b4', sky: '#9cc8f0', fog: '#f0d8b0', fogD: 0.0024, haze: 0.35, clouds: 0.25, mid: '#e8b888', midK: 0.25, key: '#fff0d8', keyK: 1.05, gnd: '#e8cc98' });
  const W = CartKit.world(id, D, { worldId: 1243, night: false, sky, ground: '#e2c08a', crack: 0,
    road: { shoulder: 'rgba(170,120,70,0.22)', band: 'rgba(168,118,72,0.62)', edge: 'rgba(255,255,255,0.92)', edgeW: 0.6, centerFn: shdPaintCenter } });
  const { E, T, api, rng } = W;
  const sOf = (x, z) => CartKit.sOf(T, x, z), wrap = s => ((s % T.L) + T.L) % T.L;
  const S = { dev: sOf(15, -120), fin: sOf(184, -58), qs: sOf(SHD_BASIN[0], SHD_BASIN[1]), maw: sOf(22, 162), table1: sOf(-48, 166), whoop: sOf(-148, 140), table2: sOf(-176, 62) };
  E.shd = { S };
  const side = (s, sd, off) => { const g = T.at(wrap(s), {}), o = sd > 0 ? g.wr + off : -g.wl - off; return { x: g.x + g.nx * o, z: g.z + g.nz * o, yaw: Math.atan2(-g.nx * sd, -g.nz * sd), g }; };
  const taken = [];
  // ---- the ground: wind ripples everywhere, a cracked salt flat, the darker damp basin, warning stripes in fin alley ----
  api.paint((ctx, P, Sc) => {
    const b = T.bounds;
    for (let i = 0; i < 900; i++) { const x = b.x0 - 120 + rng() * (b.x1 - b.x0 + 240), z = b.z0 - 120 + rng() * (b.z1 - b.z0 + 240), q = P(x, z), L = (4 + rng() * 10) * Sc; ctx.strokeStyle = rng() < 0.5 ? 'rgba(170,120,70,0.16)' : 'rgba(255,240,210,0.22)'; ctx.lineWidth = (0.25 + rng() * 0.3) * Sc; ctx.beginPath(); ctx.moveTo(q[0] - L, q[1]); ctx.quadraticCurveTo(q[0], q[1] - L * 0.25, q[0] + L, q[1]); ctx.stroke(); }
    // the salt flat round the south straight: pale with hexagonal cracks
    for (let s = S.dev - 120; s < S.dev + 120; s += 7) { const g = T.at(wrap(s), {}); for (let d = -30; d <= 30; d += 7) { const q = P(g.x + g.nx * d + (rng() - 0.5) * 3, g.z + g.nz * d + (rng() - 0.5) * 3), r = (3.2 + rng() * 1.2) * Sc; ctx.fillStyle = 'rgba(250,240,220,0.32)'; ctx.strokeStyle = 'rgba(150,110,70,0.35)'; ctx.lineWidth = 0.18 * Sc; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + rng() * 0.3, rr = r * (0.8 + rng() * 0.3); if (k) ctx.lineTo(q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr); else ctx.moveTo(q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); } }
    // the basin: a damp darker bowl with rings
    const c = P(SHD_BASIN[0], SHD_BASIN[1]); ctx.fillStyle = 'rgba(150,100,55,0.22)'; ctx.beginPath(); ctx.arc(c[0], c[1], 58 * Sc, 0, TAU); ctx.fill();
    for (let r = 10; r < 58; r += 6) { ctx.strokeStyle = 'rgba(120,80,40,0.16)'; ctx.lineWidth = 0.6 * Sc; ctx.beginPath(); ctx.arc(c[0], c[1], r * Sc, 0, TAU); ctx.stroke(); }
    // fin alley: red and white shark-warning chevrons on the shoulders
    for (let s = S.fin - 50; s < S.fin + 80; s += 5) { const g = T.at(wrap(s), {}); for (const sd of [1, -1]) { const off = sd * (g.hw + 2.2), q = P(g.x + g.nx * off, g.z + g.nz * off); ctx.fillStyle = Math.floor(s / 5) % 2 ? 'rgba(46,200,200,0.55)' : 'rgba(255,255,255,0.6)'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.fillRect(-1.2 * Sc, -0.8 * Sc, 2.4 * Sc, 1.6 * Sc); ctx.restore(); } }
  });
  // ---- jumps on the road: THE LAUNCH (a tabletop after the start), the DUNE ROLLERS, the DUNE RUN tabletop ----
  const feat = (s, fn) => { const g = T.at(wrap(s), {}); const f = fn(g), cx = g.x, cz = g.z, yaw = g.yaw; f.col = '#dcb47a'; f.stripe = '#ff6a4a'; f.stripeFn = (x, z) => Math.floor(cartLocal(x, z, cx, cz, yaw)[0] / 1.6 + 100) % 2 === 0; E.terrain.add(f); return f; };
  feat(S.table2, g => Object.assign(CartFeat.table(g.x, g.z, g.yaw, 8, 7, 9, (g.wl + g.wr) - 4, 2.0), { H: 2.0 }));
  feat(S.whoop, g => Object.assign(CartFeat.whoops(g.x, g.z, g.yaw, 6, 4.2, (g.wl + g.wr) - 4, 0.7), { H: 0.7 }));
  feat(S.table1, g => Object.assign(CartFeat.table(g.x, g.z, g.yaw, 8, 6, 10, (g.wl + g.wr) - 4, 2.4), { H: 2.4 }));
  // ---- barriers: coral, white and teal rails, tyres on the tight bends; gaps where the fins cross ----
  E.shd.fins = [];
  for (let i = 0; i < 3; i++) { const s = S.fin - 26 + i * 30, g = T.at(wrap(s), {}); E.shd.fins.push({ i, s: wrap(s), x: g.x, z: g.z, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, yaw: g.yaw, hw: g.hw, wl: g.wl, wr: g.wr }); }
  shdRails(E, T, (i, tight) => tight ? (i % 2 ? '#ffffff' : '#ff6a4a') : (Math.floor(i / 2) % 3 === 0 ? '#ffffff' : Math.floor(i / 2) % 3 === 1 ? '#ff7a5a' : '#2ec8c8'), E.shd.fins.map(f => [f.s, 6]));
  CartKit.kinds(E, SHD_KINDS);
  // ---- the start: the lifeguard gantry, the name, grandstands, buoys lining the straight ----
  { const g = T.at(0, {}), Wd = g.wl + g.wr + 6;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => shdGantry(m, Wd), { hi: true });
    api.sign('SHARK DUNES', g.x, g.z, { yaw: g.yaw + Math.PI, h: 1.9, y: 14.2, post: false, maxW: 11, style: { bg: '#ffffff', fg: '#ff4a3a', border: '#2ec8c8' } });
    api.sign('SHARK DUNES', g.x, g.z, { yaw: g.yaw, h: 1.9, y: 14.2, post: false, maxW: 11, style: { bg: '#ffffff', fg: '#ff4a3a', border: '#2ec8c8' } });
    for (const sd of [1, -1]) { const p = side(18, sd, 6); E.spots.push(...CartScene.bleachers(api, p.x, p.z, p.yaw, 22, 3, rng)); taken.push([p.x, p.z, 16]); }
    for (const [sd, type] of [[1, 'ranger'], [-1, 'dpw']]) { const p = side(-8, sd, 2.4); E.heroes.push({ type, x: p.x, z: p.z, yaw: p.yaw, anim: 'wave' }); } }
  for (let s = -110, k = 0; s < 60; s += 10, k++) { if (Math.abs(s - 18) < 16 || Math.abs(s + 8) < 4) continue; for (const sd of [1, -1]) { const p = side(s, sd, 3.4); CartKit.put(E, 'shd_buoy', p.x, p.z, p.yaw, '#ffffff'); } }
  CartKit.crowd(E, T, T.L - 105, T.L - 40, 1, rng, { rows: 2, off: 7, gap: 2.2 });
  // ---- fin alley: lifeguard towers on the outside, signs ----
  for (const [s, sd] of [[S.fin - 40, -1], [S.fin + 18, -1], [S.fin + 60, 1]]) { const p = side(s, sd, 4); CartScene.mesh(api, p.x, p.z, p.yaw, shdTower, { hi: true }); taken.push([p.x, p.z, 4]); }
  for (const sd of [1, -1]) { const p = side(S.fin - 62, sd, 1.5); api.sign('FIN\nALLEY', p.x, p.z, { yaw: p.g.yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3, style: { bg: '#ff4a3a', fg: '#ffffff', border: '#ffffff' } }); }
  { const p = side(S.fin + 40, 1, 2); api.sign('NO SWIMMING\nIN THE SAND', p.x, p.z, { yaw: p.g.yaw + Math.PI, h: 1.2, y: 2.4, post: true, maxW: 4, style: { bg: '#ffffff', fg: '#ff4a3a', border: '#ff4a3a' } }); }
  CartKit.crowd(E, T, S.fin - 30, S.fin + 50, 1, rng, { rows: 2, off: 6, gap: 2.0 });
  // ---- the quicksand basin: signs, a crowd on the outside, umbrellas ----
  for (const sd of [1, -1]) { const p = side(S.qs - 60, sd, 1.5); api.sign('QUICKSAND\nKEEP MOVING', p.x, p.z, { yaw: p.g.yaw + Math.PI, h: 1.1, y: 2.5, post: true, maxW: 3.6, style: { bg: '#8a5a2a', fg: '#ffe8b0', border: '#ffe8b0' } }); }
  CartKit.crowd(E, T, S.qs - 40, S.qs + 30, -1, rng, { rows: 2, off: 6, gap: 2.2 });
  // ---- the dune run: the maw's warning sign; the devil flats ----
  { const p = side(S.maw - 70, -1, 1.5); api.sign('BEWARE OF\nTHE MAW', p.x, p.z, { yaw: p.g.yaw + Math.PI, h: 1.1, y: 2.5, post: true, maxW: 3.4, style: { bg: '#7a4aa8', fg: '#ffffff', border: '#ffd23a' } }); }
  { const p = side(S.dev - 90, 1, 1.5); api.sign('DUST DEVIL\nFLATS', p.x, p.z, { yaw: p.g.yaw + Math.PI, h: 1.1, y: 2.5, post: true, maxW: 3.4, style: { bg: '#e8c890', fg: '#8a4a2a', border: '#8a4a2a' } }); }
  CartKit.crowd(E, T, S.dev - 70, S.dev + 50, 1, rng, { rows: 1, off: 9, gap: 2.6 });
  // ---- the infield: THE CHOMPER sand sculpture ----
  CartScene.mesh(api, -40, 25, 0.5, shdSculpture, { hi: true }); taken.push([-40, 25, 30]);
  // ---- big dunes: off the road, inside and out; red mesas on the skyline ----
  const dunes = [[-60, -50, 34, 7], [20, 80, 30, 6], [-110, 70, 26, 8], [60, -40, 28, 5], [130, -60, 18, 4], [-260, -30, 50, 14], [-250, 170, 46, 12], [-60, 260, 55, 15], [120, 250, 48, 12], [270, 70, 50, 13], [280, -170, 52, 12], [40, -230, 55, 14], [-180, -230, 50, 13], [200, 170, 28, 7]];
  for (const [x, z, r, h] of dunes) {
    let ok = true; for (let a = 0; a < TAU; a += 0.4) for (const f of [0.35, 0.7, 0.98]) if (!CartWorlds.clear(T, x + Math.cos(a) * r * f, z + Math.sin(a) * r * f, 4)) ok = false;
    if (!ok || taken.some(q => Math.hypot(q[0] - x, q[1] - z) < q[2] + r)) continue;
    E.terrain.add(CartFeat.mound(x, z, r, h, { col: '#e4c48c', res: r > 40 ? 3.2 : 2.2, kind: 'sand' })); taken.push([x, z, r * 0.8]);
  }
  const b = T.bounds;
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3, R0 = 360 + (i % 3) * 40, x = (b.x0 + b.x1) / 2 + Math.sin(a) * R0, z = (b.z0 + b.z1) / 2 + Math.cos(a) * R0; CartScene.mesh(api, x, z, a, m => shdMesa(m, 60 + (i % 3) * 18, 40 + (i % 4) * 12, 77 + i), { noAO: true }); }
  // ---- roadside fill: cacti, rocks, umbrellas, buoys ----
  for (let s = 25, k = 0; s < T.L; s += 17, k++) {
    const sd = k % 2 ? 1 : -1, p = side(s, sd, 5 + (k % 3) * 3), free = taken.every(q => Math.hypot(q[0] - p.x, q[1] - p.z) > q[2] + 3);
    if (!free || !CartWorlds.clear(T, p.x, p.z, 3) || E.terrain.height(p.x, p.z) > 0.4) continue;
    const kind = ['shd_cactus', 'shd_rock', 'shd_umbrella', 'shd_buoy'][k % 4];
    CartKit.put(E, kind, p.x, p.z, p.yaw + k * 0.7, kind === 'shd_cactus' ? ['#5aa860', '#4a9a5a', '#6ab870'][k % 3] : kind === 'shd_rock' ? ['#d8905a', '#c8784a', '#e0a070'][k % 3] : kind === 'shd_umbrella' ? ['#ff5a7a', '#2ec8c8', '#ffd23a', '#ff8a2a'][k % 4] : '#ffffff', { scale: kind === 'shd_rock' ? 0.8 + (k % 3) * 0.3 : kind === 'shd_cactus' ? 1 + (k % 3) * 0.15 : 1 });
  }
  for (let i = 0; i < 26; i++) { const a = rng() * TAU, r = 30 + rng() * 60, x = -40 + Math.cos(a) * r, z = 25 + Math.sin(a) * r * 0.8; if (!CartWorlds.clear(T, x, z, 3) || taken.some(q => Math.hypot(q[0] - x, q[1] - z) < q[2] * 0.6)) continue; CartKit.put(E, i % 3 === 0 ? 'shd_cactus' : i % 3 === 1 ? 'shd_rock' : 'shd_buoy', x, z, a, i % 3 === 0 ? '#5aa860' : i % 3 === 1 ? '#d8905a' : '#ffffff', { scale: 1 + rng() * 0.4 }); }
  // gift rows, boost pads (round the basin's edges and on the flats), the grid
  const f = s => wrap(s) / T.L;
  CartKit.gifts(E, T, [f(S.table2 + 45), f(S.maw + 55), f(S.fin + 75), f(S.dev - 60)]);
  CartKit.boosts(E, T, [[f(S.qs + 46), 0.55], [f(S.qs + 46), -0.55], [f(S.dev + 70), 0], [f(S.table1 - 22), 0]]);
  CartKit.grid(E, T);
  return CartKit.finish(E);
}
// the centre line: a row of little fins every 8 m
function shdPaintCenter(ctx, P, S, T) {
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let s = 0; s < T.L; s += 8) { const g = T.at(s, {}), q = P(g.x, g.z); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.beginPath(); ctx.moveTo(-1.3 * S, 0); ctx.quadraticCurveTo(-0.2 * S, -0.3 * S, 0.9 * S, -1.1 * S); ctx.quadraticCurveTo(0.6 * S, -0.3 * S, 1.1 * S, 0); ctx.closePath(); ctx.fill(); ctx.fillRect(-1.6 * S, 0, 3 * S, 0.22 * S); ctx.restore(); }
}
// the kit's rails with gaps (the fins dash through the barrier line): gaps = [[s, halfLength]]
function shdRails(E, T, pal, gaps) {
  CartDecor.protos(E);
  const step = 7;
  for (let s = 0; s < T.L; s += step) {
    if (gaps.some(q => Math.abs(CartKit.ds(T, s, q[0])) < q[1])) continue;
    const g = T.at(s, {}), tight = Math.abs(g.k) > 0.012, i = Math.floor(s / step);
    for (const sd of [1, -1]) { const off = sd > 0 ? g.wr : -g.wl, x = g.x + g.nx * off, z = g.z + g.nz * off; CartDecor.put(E, tight ? 'tyres' : 'rail', x, z, g.yaw, pal(i, tight, sd), { y: E.terrain.height(x, z), noLights: true, k: 1 }); }
  }
}

/* ---------------- the moving things (one pooled group) ---------------- */
const ShdMesh = {
  fin(m) { shdFin(m, true); },
  tumble(m) { shdTumble(m); },
  // THE MAW's lower jaw: a lilac bowl with a pink tongue and a ring of square, friendly teeth (centre at the origin)
  jawLo(m) {
    m.color('#b08ae0').shine(2); m.lathe([[0, -1.6], [3.2, -1.2], [4.3, -0.2], [4.4, 0.3], [3.9, 0.35], [3.2, -0.4], [0, -0.5]], { seg: 24 });
    m.color('#ff7a9a').shine(3); m.ellipsoid(0, -0.35, -0.6, 2.4, 0.4, 2.0, { seg: 14, rings: 6 });
    m.color('#fffaf0').shine(3); for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * TAU; m.push(); m.tf(Math.sin(a) * 3.75, 0.55, Math.cos(a) * 3.75, a); m.roundBox(0, 0, 0, 0.9, 0.8, 0.5, 0.18); m.pop(); }
    m.color('#e8c890').shine(0); m.torus(0, -0.1, 0, 4.7, 0.55, { seg: 24, tseg: 5 });
    m.shine(0);
  },
  // the upper jaw: a dome hinged at the back (origin = the hinge, the dome reaches forward along +z), teeth under the
  // rim, two eye-stalks with big googly eyes and a few bristly whiskers
  jawHi(m) {
    m.push(); m.tf(0, 0, 4.0);
    m.color('#9a74d0').shine(2); m.ellipsoid(0, 0, 0, 4.3, 2.8, 4.3, { seg: 22, rings: 9, phi1: Math.PI / 2 });
    m.color('#c8a8f0'); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.3; m.ball(Math.sin(a) * 2.6, 1.9, Math.cos(a) * 2.6, 0.55, { seg: 8, rings: 6 }); }
    m.color('#fffaf0').shine(3); for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * TAU; m.push(); m.tf(Math.sin(a) * 3.75, -0.35, Math.cos(a) * 3.75, a); m.roundBox(0, 0, 0, 0.9, 0.8, 0.5, 0.18); m.pop(); }
    for (const sd of [-1, 1]) { m.color('#9a74d0').shine(2); m.limb(sd * 1.4, 2.2, 1.2, sd * 1.9, 4.6, 1.8, 0.35, 0.28, { seg: 8 }); m.color('#ffffff').shine(3); m.ball(sd * 1.95, 5.2, 1.9, 0.95, { seg: 14, rings: 10 }); m.color('#1a1420'); m.ball(sd * 1.95, 5.2, 2.75, 0.38, { seg: 10, rings: 8 }); }
    m.color('#6a4a9a'); for (let i = -2; i <= 2; i++) m.limb(i * 0.6, 1.8, 3.2, i * 1.2, 2.6, 4.6, 0.07, 0.03, { seg: 4 });
    m.pop(); m.shine(0);
  }
};

/* ---------------- the rules: hazards at run time ---------------- */
const SHD_FIN = { period: 7.5, stalk: 1.3, speed: 22, half: 1.2, len: 3.0, out: 5.5, scale: 1.5 };
const SHD_DEV = { n: 3, period: 9.5, brew: 1.4, speed: 5.0, core: 2.4, R: 6.5, gap: 40 };
const SHD_QS = { period: 6.6, churn: 1.3, sink: 2.8, r: 4.6, core: 1.9, spots: [[-26, -0.45], [-9, 0.42], [9, -0.42], [26, 0.45]] };
const SHD_MAW = { rest: 2.6, rumble: 1.4, gulp: 1.0, r: 4.6 };
CART_TRACK_RULES.sharkdunes = {
  onLoad(s) {
    const E = s.E, B = E.shd, T = s.T || s.TR;
    const G = CartKit.group(s, [['fins', ShdMesh.fin, 3], ['tumble', ShdMesh.tumble, SHD_DEV.n], ['jawLo', ShdMesh.jawLo, 1], ['jawHi', ShdMesh.jawHi, 1]]);
    const L = s.shd = { G, rng: mulberry32(4343), fins: [], devils: [], qs: [], maw: null, blind: 0, said: {}, hintT: -9 };
    B.fins.forEach((q, i) => L.fins.push(Object.assign({}, q, { st: 'cruise', t: -i * 2.5, sd: i % 2 ? 1 : -1, d: 0, mask: 0, ang: i * 2, obj: G.fins[i] })));
    for (const f of L.fins) f.d = f.sd > 0 ? f.wr + SHD_FIN.out : -f.wl - SHD_FIN.out;
    for (let i = 0; i < SHD_DEV.n; i++) { const sv = B.S.dev + (i - 1) * SHD_DEV.gap; L.devils.push({ i, s0: sv, s: sv, d: 0, x: 0, z: 0, st: 'calm', u: 0, c: -1, sd: 1, mask: 0, gmask: 0, off: i * 3.1, spin: 0, obj: G.tumble[i] }); }
    SHD_QS.spots.forEach(([ds, lat], i) => { const sv = B.S.qs + ds, g = T.at(((sv % T.L) + T.L) % T.L, {}); L.qs.push({ i, s: sv, d: lat * g.hw, x: g.x + g.nx * lat * g.hw, z: g.z + g.nz * lat * g.hw, off: (i === 0 || i === 3) ? 0 : SHD_QS.period / 2, st: 'firm', u: 0, c: -1, mask: 0, hmask: 0 }); });
    { const g = T.at(B.S.maw, {}); L.maw = { s: B.S.maw, x: g.x, z: g.z, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, yaw: g.yaw, hw: g.hw, st: 'sleep', u: 0, t: 0, dd: 0, c: -1, lane: 1, cx: g.x, cz: g.z, mask: 0, lo: G.jawLo[0], hi: G.jawHi[0] }; }
    CartKit.state(s);
  },
  onUpdate(s, dt, racing) {
    const L = s.shd; if (!L) return;
    shdFins(s, L, dt, racing); shdDevils(s, L, dt, racing); shdQuick(s, L, dt, racing); shdMaw(s, L, dt, racing);
    if (L.blind > 0) L.blind = Math.max(0, L.blind - dt);
  },
  // the AI: ease off for a dashing fin, hop a quicksand patch or the maw it can't steer round (by skill); the rest is
  // cartIxObs steering
  onStep(s, k, dt, racing) {
    const L = s.shd; if (!L || k.player && !s.autoDrive || !racing || !s.T || k.out) return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9, luck = ((k.slot * 7 + Math.floor(s.time * 0.5)) % 10) / 10;
    for (const f of L.fins) {
      if (f.st === 'cruise') continue;
      const ds = CartKit.ahead(s, k, f.s); if (ds < 2 || ds > 40) continue;
      const ta = ds / Math.max(6, k.speed), dir = -f.sd, edge = Math.max(f.wl, f.wr) + SHD_FIN.out;
      const delay = f.st === 'stalk' ? SHD_FIN.stalk - f.t : 0, pd = f.d + dir * Math.max(0, ta - delay) * SHD_FIN.speed, pdc = dir > 0 ? Math.min(pd, edge) : Math.max(pd, -edge);
      if (Math.abs(pdc - k.loc.d) < 4.2 && luck < 0.5 + (sk - 0.85) * 3) { if (k.speed > 10) I.gas = 0; if (k.speed > 18) I.brake = 0.5; break; }
    }
    const hopAt = (sv, d, r) => { const ds = CartKit.ahead(s, k, sv); return ds > 1 && ds < Math.max(4, k.speed * 0.2) && Math.abs(d - k.loc.d) < r && !k.air; };
    for (const q of L.qs) if (q.st === 'sink' && hopAt(q.s, q.d, SHD_QS.r) && luck < 0.4 + (sk - 0.85) * 3) { I.driftPress = true; I.drift = false; return; }
    const M = L.maw; if (M.st === 'gulp' && M.u < 0.6 && hopAt(M.s, M.dd || 0, SHD_MAW.r) && luck < 0.1 + (sk - 0.85) * 2) { I.driftPress = true; I.drift = false; }
  },
  draw(s, R, S, t) { const L = s.shd; if (L) shdDraw(s, L, R, S, t); },
  lights(s, add) {},
  hud(s, ctx, W, H, top, left) {
    const L = s.shd, p = s.player; if (!L || !p) return;
    // sanded: a gritty tan haze and streaks of sand blowing across the screen, clearing from the middle
    if (L.blind > 0) {
      const a = Math.min(1, L.blind * 1.2), tt = s.time; ctx.save();
      ctx.fillStyle = `rgba(220,180,120,${0.28 * a})`; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i++) { const y = ((i * 61) % 100) / 100 * H, sp = 0.6 + (i % 5) * 0.18, u = (i * 0.618 + tt * sp) % 1, x = u * (W + 120) - 60, len = 30 + (i % 4) * 18, cx = (x - W / 2) / W, cy = (y - H / 2) / H, far = Math.min(1, Math.hypot(cx, cy) * 2.4);
        ctx.globalAlpha = a * (0.2 + 0.8 * far); ctx.strokeStyle = i % 3 ? 'rgba(200,150,90,0.9)' : 'rgba(250,225,180,0.9)'; ctx.lineWidth = 2 + (i % 3); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y + Math.sin(i) * 6); ctx.stroke();
        ctx.fillStyle = 'rgba(170,120,70,0.8)'; ctx.beginPath(); ctx.arc(x + len, y, 1.5 + (i % 3), 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // first-lap hints as each hazard comes up
    const hint = (key, sv, text, sub) => { if (L.said[key] || p.lap > 1) return; const ds = CartKit.ds(s.T, p.loc.s, sv); if (ds > 0 && ds < 75) { L.said[key] = true; L.hintT = s.time; s.banner(text, '#e8702a', 2.0, sub); } };
    if (s.state === 'race' && s.T) { const S = s.E.shd.S; hint('maw', S.maw, 'THE SAND MAW!', 'take the lane without the eyes'); hint('qs', S.qs - 25, 'QUICKSAND!', 'weave round the churning sand'); hint('fin', S.fin - 30, 'FIN ALLEY!', 'let the fins pass or hop them'); hint('dev', S.dev - 45, 'DUST DEVILS!', 'steer round the whirlwinds'); }
  }
};
const shdBanner = (s, L, k) => k.player && !(s.time - L.hintT < 2.3);

// ---- the fins: cruise in a loop in the sand beside the road, stalk (rise, spray a line across the road), dash across ----
function shdFins(s, L, dt, racing) {
  const C = SHD_FIN;
  for (const f of L.fins) {
    const edge = (f.sd > 0 ? f.wr : f.wl) + C.out, far = (f.sd > 0 ? f.wl : f.wr) + C.out;
    f.t += dt; f.ang += dt * 1.6;
    if (f.st === 'cruise') { f.d = f.sd * edge; if (f.t > C.period - C.stalk - 1.2) { f.st = 'stalk'; f.t = 0; f.mask = 0; if (CartKit.near(s, f.x || f.x0 || 0, f.z || 0, 60)) cartIxSound(s, 'dust', f.x, f.z, 0.5, 0.8); } }
    else if (f.st === 'stalk') { f.d = f.sd * edge; if (f.t > C.stalk) { f.st = 'dash'; f.t = 0; CartKit.fired(s, 'shd_fin'); if (CartKit.near(s, f.x, f.z, 70)) { cartIxSound(s, 'kartDrift', f.x, f.z, 0.8, 0.5); cartIxSound(s, 'dust', f.x, f.z, 0.7, 0.7); } } }
    else {
      const dir = -f.sd; f.d += dir * C.speed * dt;
      if (dir * f.d >= far) { f.d = dir * far; f.st = 'cruise'; f.t = 0; f.sd = dir; }
      const x = f.x + f.nx * f.d, z = f.z + f.nz * f.d;
      if (Math.abs(f.d) < Math.max(f.wl, f.wr)) cartIxObs(s, x + f.nx * dir * 3, z + f.nz * dir * 3, 3.0);
      if (racing) for (const k of s.karts) {
        if (k.out || k.sunk || (f.mask & (1 << k.slot)) || (k.air && k.y > s.terrain.height(k.x, k.z) + 1.2)) continue;
        const dx = k.x - x, dz = k.z - z, along = dx * f.tx + dz * f.tz, across = dx * f.nx + dz * f.nz;
        if (Math.abs(along) > C.len + 1.1 || Math.abs(across) > C.half + 1.2) continue;
        f.mask |= 1 << k.slot;
        if (CartKit.hit(s, k, 'knock', 'shd_fin', { dx: f.nx * dir, dz: f.nz * dir, power: 10, dur: 0.9, banner: shdBanner(s, L, k) ? 'FIN SLAP!' : undefined })) { cartIxSound(s, 'cartChomp', k.x, k.z, 0.8, 1.2); if (s.fx && CartKit.near(s, x, z, 90)) s.fx.dust(k.x, k.y + 0.3, k.z, 10, '#e0c088'); }
      }
    }
    // the fin's pose: a lazy loop in the sand while cruising; rises during the stalk; dashes flat out
    let px = f.x + f.nx * f.d, pz = f.z + f.nz * f.d, yaw;
    if (f.st === 'cruise') { const r = 2.6; px += f.nx * Math.cos(f.ang) * r * 0.6 + f.tx * Math.sin(f.ang) * r * 1.4; pz += f.nz * Math.cos(f.ang) * r * 0.6 + f.tz * Math.sin(f.ang) * r * 1.4; yaw = Math.atan2(-f.nx * Math.sin(f.ang) * 0.6 + f.tx * Math.cos(f.ang) * 1.4, -f.nz * Math.sin(f.ang) * 0.6 + f.tz * Math.cos(f.ang) * 1.4); }
    else { const dir = f.st === 'stalk' ? -f.sd : -f.sd; yaw = Math.atan2(f.nx * dir, f.nz * dir); }
    f.px = px; f.pz = pz;
    const o = f.obj; if (o) { const quiv = f.st === 'stalk' ? Math.sin(s.time * 30) * 0.08 : 0, rise = f.st === 'stalk' ? Math.min(1, f.t / 0.5) : f.st === 'dash' ? 1 : 0; o.live = true; o.visible = true; o.x = px; o.z = pz; o.y = s.terrain.height(px, pz) - 1.2 + rise * 1.1 + Math.sin(s.time * 2 + f.i) * 0.08; o.yaw = yaw; o.pitch = 0; o.roll = quiv + (f.st === 'cruise' ? 0.12 : 0); o.scale = SHD_FIN.scale * (1.0 + rise * 0.15); }
  }
}
// ---- the dust devils: brew at one roadside (a swirl grows, 1.4 s), then wander across the road and fade ----
function shdDevils(s, L, dt, racing) {
  const C = SHD_DEV, T = s.T || s.TR;
  for (const v of L.devils) {
    const tt = s.time + v.off, c = Math.floor(tt / C.period), ph = tt - c * C.period;
    const g0 = T.at(((v.s0 % T.L) + T.L) % T.L, SHD_T.at), edge = g0.hw + 3, cross = (2 * edge) / C.speed;
    if (v.c !== c) { v.c = c; v.sd = (c + v.i) % 2 ? 1 : -1; v.mask = 0; v.gmask = 0; v.fired = false; }
    v.st = ph < C.brew ? 'brew' : ph < C.brew + cross ? 'go' : 'calm';
    v.u = v.st === 'brew' ? ph / C.brew : v.st === 'go' ? (ph - C.brew) / cross : 0;
    if (v.st === 'go' && !v.fired) { v.fired = true; CartKit.fired(s, 'shd_devil'); if (CartKit.near(s, v.x, v.z, 70)) cartIxSound(s, 'wind', v.x, v.z, 0.7, 0.9); }
    v.d = v.st === 'brew' ? v.sd * edge : v.st === 'go' ? v.sd * edge - v.sd * 2 * edge * v.u : v.d;
    v.s = v.s0 + Math.sin(s.time * 0.7 + v.i * 2) * 4 + (v.st === 'go' ? v.u * 6 : 0);
    const g = T.at(((v.s % T.L) + T.L) % T.L, SHD_T.at2); v.x = g.x + g.nx * v.d; v.z = g.z + g.nz * v.d; v.spin += dt * (v.st === 'go' ? 9 : v.st === 'brew' ? 9 * v.u : 1);
    const strong = v.st === 'go' ? Math.min(1, v.u * 8, (1 - v.u) * 8) : 0;
    if (v.st === 'go' && Math.abs(v.d) < g.hw + 1) cartIxObs(s, v.x, v.z, C.core + 2.2);
    if (v.st === 'brew' && v.u > 0.4) cartIxObs(s, v.x - g.nx * v.sd * 4, v.z - g.nz * v.sd * 4, 2.6);
    if (strong > 0.3 && racing) for (const k of s.karts) {
      if (k.out || k.sunk) continue;
      const dx = k.x - v.x, dz = k.z - v.z, D = Math.hypot(dx, dz); if (D > C.R) continue;
      if (D < C.core && !(v.mask & (1 << k.slot))) { v.mask |= 1 << k.slot; if (CartKit.hit(s, k, 'whirl', 'shd_devil', { dur: 1.1, vy: 7, banner: shdBanner(s, L, k) ? 'DUST DEVIL!' : undefined })) { cartIxSound(s, 'wind', k.x, k.z, 0.9, 1.2); if (s.fx && CartKit.near(s, v.x, v.z, 90)) s.fx.dust(k.x, k.y + 0.5, k.z, 16, '#e0c088'); } continue; }
      if (!(v.gmask & (1 << k.slot)) && !k.air && k.invT <= 0 && !(k.shieldT > 0)) {
        v.gmask |= 1 << k.slot;
        const nx = dx / (D || 1), nz = dz / (D || 1); k.vx += (nx * 4 - nz * 5 * v.sd) * strong; k.vz += (nz * 4 + nx * 5 * v.sd) * strong;
        if (k.player) L.blind = 1.1;
        CartKit.touch(s, k, 'shd_gust', 'SANDBLASTED!', '#e8c890');
      }
    }
    const o = v.obj; if (o) { const on = v.st !== 'calm'; o.live = on; o.visible = on; if (on) { const r = 1.6 + (v.st === 'brew' ? 0.5 : 1.2), a = v.spin * 0.8; o.x = v.x + Math.cos(a) * r; o.z = v.z + Math.sin(a) * r; o.y = s.terrain.height(o.x, o.z) + 0.6 + (v.st === 'go' ? 2.5 + Math.sin(v.spin * 0.5) * 1.5 : v.u * 1.5); o.yaw = -a; o.pitch = v.spin * 1.3; o.roll = v.spin * 0.7; o.scale = 0.8; } }
  }
}
// ---- the quicksand: firm; churn (ripples close in, 1.3 s); sink (2.8 s): drags cars, bogs the middle ----
function shdQuick(s, L, dt, racing) {
  const C = SHD_QS;
  for (const q of L.qs) {
    const tt = s.time + q.off + 2, c = Math.floor(tt / C.period), ph = tt - c * C.period, firm = C.period - C.churn - C.sink;
    q.st = ph < firm ? 'firm' : ph < firm + C.churn ? 'churn' : 'sink'; q.u = q.st === 'churn' ? (ph - firm) / C.churn : q.st === 'sink' ? (ph - firm - C.churn) / C.sink : 0;
    if (q.st === 'sink' && q.c !== c) { q.c = c; q.mask = 0; q.hmask = 0; CartKit.fired(s, 'shd_quick'); if (CartKit.near(s, q.x, q.z, 60)) cartIxSound(s, 'dust', q.x, q.z, 0.6, 0.5); }
    if (q.st !== 'firm') cartIxObs(s, q.x, q.z, C.r + (q.st === 'sink' ? 1.4 : 0.6));
    if (q.st === 'sink' && racing) for (const k of s.karts) {
      if (k.out || k.air || k.sunk) continue;
      const D = Math.hypot(k.x - q.x, k.z - q.z); if (D > C.r + 0.6) continue;
      const drag = Math.exp(-2.6 * dt); k.vx *= drag; k.vz *= drag; k.slowT = Math.max(k.slowT || 0, 0.35);
      if (!(q.mask & (1 << k.slot))) { q.mask |= 1 << k.slot; CartKit.touch(s, k, 'shd_quick', 'QUICKSAND!', '#c8925a'); if (s.fx && CartKit.near(s, q.x, q.z, 80)) s.fx.dust(k.x, k.y + 0.2, k.z, 8, '#a8804a'); }
      if (D < C.core && !(q.hmask & (1 << k.slot))) { q.hmask |= 1 << k.slot; CartKit.hit(s, k, 'goo', 'shd_quick', { dur: 1.1, banner: shdBanner(s, L, k) ? 'SINKING!' : undefined }); }
    }
  }
}
// ---- THE SAND MAW: sleeps; rumble (a ring cracks over one lane, eye-stalks peep out, 1.4 s); gulp (bursts up, snaps) ----
function shdMaw(s, L, dt, racing) {
  // it hunts: asleep until a car comes up (and it has rested), then it rumbles (1.4 s: the cracking ring creeps toward
  // that car for the first 60%, then locks) and gulps; the ring always shows where, so a lane switch beats it
  const C = SHD_MAW, M = L.maw, T = s.T || s.TR;
  M.t = (M.t || 0) + dt;
  if (M.st === 'sleep') {
    if (M.t > C.rest) { let best = null, bd = 50; for (const k of s.karts) { if (k.out || k.finished) continue; const ds = CartKit.ds(T, k.loc.s, M.s); if (ds > 20 && ds < bd) { bd = ds; best = k; } }
      if (best) { M.st = 'rumble'; M.t = 0; M.mask = 0; M.fired = false; M.dd = clamp(best.loc.d, -M.hw * 0.5, M.hw * 0.5); } }
  } else if (M.st === 'rumble') {
    if (M.t < C.rumble * 0.5) { let best = null, bd = 50; for (const k of s.karts) { if (k.out || k.finished) continue; const ds = CartKit.ds(T, k.loc.s, M.s); if (ds > 6 && ds < bd) { bd = ds; best = k; } } if (best) M.dd = approach(M.dd, clamp(best.loc.d, -M.hw * 0.5, M.hw * 0.5), 7 * dt); }
    if (M.t >= C.rumble) { M.st = 'gulp'; M.t = 0; }
  } else if (M.st === 'gulp' && M.t >= C.gulp) { M.st = 'sleep'; M.t = 0; }
  M.lane = M.dd >= 0 ? 1 : -1; M.cx = M.x + M.nx * M.dd; M.cz = M.z + M.nz * M.dd;
  M.u = M.st === 'rumble' ? M.t / C.rumble : M.st === 'gulp' ? M.t / C.gulp : 0;
  if (M.st === 'rumble' && M.u < 0.05 && CartKit.near(s, M.cx, M.cz, 70)) cartIxSound(s, 'dust', M.cx, M.cz, 0.5, 0.6);
  if (M.st === 'gulp' && !M.fired) { M.fired = true; CartKit.fired(s, 'shd_maw'); if (CartKit.near(s, M.cx, M.cz, 80)) { cartIxSound(s, 'cartChomp', M.cx, M.cz, 1, 0.6); cartIxSound(s, 'cartBoom', M.cx, M.cz, 0.5, 0.7); if (CartKit.near(s, M.cx, M.cz, 30)) s.shakeIt(0.5); } if (s.fx && CartKit.near(s, M.cx, M.cz, 120)) s.fx.dust(M.cx, 0.5, M.cz, 26, '#e0c088'); }
  if (M.st === 'gulp' || (M.st === 'rumble' && M.u > 0.85)) cartIxObs(s, M.cx, M.cz, C.r + 0.4);   // the AI only sees it once it bursts up: the slow ones get gulped
  if (M.st === 'gulp' && M.u > 0.08 && M.u < 0.6 && racing) for (const k of s.karts) {
    if (k.out || k.sunk || (M.mask & (1 << k.slot)) || (k.air && k.y > s.terrain.height(k.x, k.z) + 1.0)) continue;
    const dx = k.x - M.cx, dz = k.z - M.cz, D = Math.hypot(dx, dz); if (D > C.r) continue;
    M.mask |= 1 << k.slot;
    if (CartKit.hit(s, k, 'flip', 'shd_maw', { dx: dx / (D || 1), dz: dz / (D || 1), vy: 9, banner: shdBanner(s, L, k) ? 'GULPED!' : undefined })) cartIxSound(s, 'cartChomp', k.x, k.z, 0.9, 1.0);
  }
  // the jaws: hidden under the sand; the upper peeps (eyes only) during the rumble; both burst up and snap on the gulp
  const lo = M.lo, hi = M.hi; if (!lo || !hi) return;
  let rise = 0, open = 0;
  if (M.st === 'rumble') { rise = -5.4 + Math.min(1, M.u * 3) * 1.2 + Math.sin(s.time * 26) * 0.08; open = 0.2; }
  else if (M.st === 'gulp') { const u = M.u; rise = u < 0.25 ? lerp(-4, 0.2, u / 0.25) : u < 0.75 ? 0.2 : lerp(0.2, -4.5, (u - 0.75) / 0.25); open = u < 0.18 ? 0.9 : u < 0.32 ? lerp(0.9, 0, (u - 0.18) / 0.14) : 0; }
  const on = M.st !== 'sleep', fy = M.yaw + Math.PI * (M.lane > 0 ? 0.5 : -0.5) + Math.PI;
  for (const o of [lo, hi]) { o.live = on; o.visible = on; }
  if (on) {
    lo.x = M.cx; lo.z = M.cz; lo.y = (M.st === 'rumble' ? -6 : rise); lo.yaw = fy; lo.pitch = 0; lo.roll = 0; lo.scale = 1;
    const bx = Math.sin(fy), bz = Math.cos(fy);
    hi.x = M.cx - bx * 4.0; hi.z = M.cz - bz * 4.0; hi.y = rise + 0.3; hi.yaw = fy; hi.pitch = -open; hi.roll = 0; hi.scale = 1;
  }
}
// ---- sprites: fin sprays and wakes, devil columns, quicksand swirls, the maw's cracking ring ----
function shdDraw(s, L, R, S, t) {
  const C = SHD_C, cam = s.cam, T = s.T || s.TR, near = (x, z, r) => (x - cam.x) ** 2 + (z - cam.z) ** 2 < r * r;
  for (const f of L.fins) {
    if (!near(f.x, f.z, 200)) continue;
    const gy = 0.1;
    if (f.st === 'stalk') {
      // the fin's path: an orange band across the road, chevrons, sand spraying up at the far edge
      const fl = 0.55 + 0.45 * Math.max(0, Math.sin(t * 18)), dir = -f.sd, edge = Math.max(f.wl, f.wr) + 2;
      R.flat.flat(f.x, 0.09, f.z, edge * 2, SHD_FIN.len * 2 + 4.0, f.yaw, S.square, C.hot, 0.7 * fl, false);
      for (let i = 0; i < 6; i++) { const u = ((i / 6 + t * 1.3) % 1), dd = f.sd * edge + dir * u * edge * 2, ay = Math.atan2(f.nx * dir, f.nz * dir); R.flat.flat(f.x + f.nx * dd, 0.105, f.z + f.nz * dd, 5.2, 5.2, ay, S.arrow, C.black, 0.45 * fl, false); R.flat.flat(f.x + f.nx * dd, 0.11, f.z + f.nz * dd, 4.6, 4.6, ay, S.arrow, C.white, fl, false); }
      for (const sd of [-1, 1]) R.flat.flat(f.x + f.tx * sd * (SHD_FIN.len + 0.5), 0.1, f.z + f.tz * sd * (SHD_FIN.len + 0.5), edge * 2, 0.5, f.yaw, S.square, C.white, 0.9 * fl, false);
      R.bbs.bb(f.px, 5.5, f.pz, 2.6, 2.6, S.warn, C.hot, fl, false);
      // a fence of sand spurts and warning marks standing up along the path, so it reads from far down the road
      for (let i = 0; i < 7; i++) { const dd = f.sd * edge + dir * (i + 0.5) / 7 * edge * 2, x = f.x + f.nx * dd, z = f.z + f.nz * dd, hop = Math.abs(Math.sin(t * 9 + i * 0.9)); R.bbs.bb(x, 0.9 + hop * 0.9, z, 2.2, 2.2, S.puff, C.sand, 0.8, false, t * 2 + i); R.bbs.bb(x, 2.2 + hop * 0.9, z, 1.5, 1.5, S.warn, C.hot, fl, false); }
      if (s.fx && Math.random() < 0.6) s.fx.add(f.px, 0.6, f.pz, (Math.random() - 0.5) * 3, 3 + Math.random() * 3, (Math.random() - 0.5) * 3, 0.9, 0.6, 1.6, C.sand, 0.8, 'puff', 4, Math.random() * 6, 1);
    }
    if (f.st === 'dash') { const dir = -f.sd; for (let i = 1; i <= 5; i++) R.bbs.bb(f.px - f.nx * dir * i * 1.4, 0.7, f.pz - f.nz * dir * i * 1.4, 3.6 - i * 0.4, 2.0 - i * 0.25, S.puff, C.sand, 0.85 - i * 0.14, false, t * 3 + i); R.flat.flat(f.px - f.nx * dir * 4, gy, f.pz - f.nz * dir * 4, 2.6, 9, Math.atan2(f.nx, f.nz), S.shadow, C.sandDark, 0.5, false); }
    else R.flat.flat(f.px, gy, f.pz, 3.4, 5, f.yaw, S.shadow, C.sandDark, 0.35, false);
  }
  for (const v of L.devils) {
    if (v.st === 'calm' || !near(v.x, v.z, 220)) continue;
    const gy = s.terrain.height(v.x, v.z) + 0.1;
    if (v.st === 'brew') {
      const a = v.u, fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 14));
      R.flat.flat(v.x, gy, v.z, 4 + a * 10, 4 + a * 10, -v.spin, S.swirl, C.mud, 0.85 * fl, false);
      R.flat.flat(v.x, gy + 0.01, v.z, SHD_DEV.R * 2, SHD_DEV.R * 2, 0, S.ring, C.hot, 0.8 * fl * a, false);
      for (let i = 0; i < 4; i++) R.bbs.bb(v.x, gy + 1 + i * 1.6 * a, v.z, 2 + i * a * 1.2, 2.6, S.puff, C.sandDark, 0.75 * a, false, -v.spin * (1 + i * 0.3));
    } else {
      const f = Math.min(1, v.u * 8, (1 - v.u) * 6);
      R.flat.flat(v.x, gy, v.z, SHD_DEV.R * 2, SHD_DEV.R * 2, -v.spin, S.swirl, C.sandDark, 0.55 * f, false);
      R.flat.flat(v.x, gy + 0.01, v.z, SHD_DEV.core * 2.6, SHD_DEV.core * 2.6, 0, S.shadow, C.black, 0.3 * f, false);
      R.bbs.bb(v.x, gy + 1.2, v.z, 9, 3, S.puff, C.sandDark, 0.8 * f, false, v.spin);
      for (let i = 0; i < 9; i++) { const h = i * 1.9, w = 2.2 + i * 1.2, wob = Math.sin(t * 3 + i * 0.7) * (0.3 + i * 0.14); R.bbs.bb(v.x + wob, gy + 0.8 + h, v.z + wob * 0.6, w * 1.1, 3.0, S.puff, i % 2 ? C.sandDark : C.mud, (0.85 - i * 0.06) * f, false, -v.spin * (1 + i * 0.12)); R.bbs.bb(v.x + wob, gy + 0.8 + h, v.z + wob * 0.6, w, 2.6, S.swirl, C.white, (0.6 - i * 0.04) * f, false, -v.spin * (1 + i * 0.15)); }
      for (let i = 0; i < 6; i++) { const a = -v.spin * 0.6 + i * 1.05, r = 1.6 + (i % 3) * 1.1, h = ((t * 0.9 + i * 0.37) % 1) * 12; R.bbs.bb(v.x + Math.cos(a) * r, gy + h, v.z + Math.sin(a) * r, 1.6, 1.6, S.puff, C.sandDark, 0.6 * f, false, a); }
    }
  }
  for (const q of L.qs) {
    if (q.st === 'firm' || !near(q.x, q.z, 180)) continue;
    const r = SHD_QS.r;
    if (q.st === 'churn') {
      const fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 15));
      for (let i = 0; i < 3; i++) { const u = 1 - ((q.u * 1.6 + i / 3) % 1), rr = 1 + u * r; R.flat.flat(q.x, 0.1, q.z, rr * 2, rr * 2, t, S.ring, C.hot, (1 - u * 0.4) * fl, false); }
      R.flat.flat(q.x, 0.105, q.z, r * 2.1, r * 2.1, 0, S.ring, C.white, 0.7 * fl, false);
      R.flat.flat(q.x, 0.09, q.z, r * 2, r * 2, -t * 2, S.swirl, C.mud, 0.8 * q.u, false);
      if (s.fx && Math.random() < 0.3) s.fx.add(q.x + (Math.random() - 0.5) * r, 0.3, q.z + (Math.random() - 0.5) * r, 0, 1.5 + Math.random(), 0, 0.6, 0.5, 0.8, C.sand, 0.8, 'puff', 4, 0, 1);
    } else {
      const a = Math.min(1, q.u * 8, (1 - q.u) * 6);
      R.flat.flat(q.x, 0.075, q.z, r * 2.1, r * 2.1, 0, S.glow, C.mud, a, false);
      R.flat.flat(q.x, 0.08, q.z, r * 2.3, r * 2.3, -t * 1.5, S.swirl, C.mud, a, false);
      R.flat.flat(q.x, 0.09, q.z, r * 1.5, r * 1.5, -t * 2.6, S.swirl, C.sandDark, a, false);
      R.flat.flat(q.x, 0.07, q.z, SHD_QS.core * 2.6, SHD_QS.core * 2.6, 0, S.shadow, C.black, 0.6 * a, false);
      R.flat.flat(q.x, 0.11, q.z, r * 2.1, r * 2.1, 0, S.ring, C.warn, 0.85 * a, false);
      for (let i = 0; i < 4; i++) { const ang = -t * 1.8 + i * 1.57, rr = 1 + ((i * 0.618 + q.u * 2) % 1) * (r - 1); R.bbs.bb(q.x + Math.cos(ang) * rr, 0.35, q.z + Math.sin(ang) * rr, 1.2, 0.7, S.puff, C.sandDark, 0.7 * a, false, ang); }
    }
  }
  const M = L.maw;
  if (M.st !== 'sleep' && near(M.cx, M.cz, 220)) {
    const r = SHD_MAW.r;
    if (M.st === 'rumble') {
      const fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 16));
      R.flat.flat(M.cx, 0.1, M.cz, r * 2.2, r * 2.2, 0, S.ring, C.hot, 0.9 * fl, false);
      R.flat.flat(M.cx, 0.09, M.cz, r * 2, r * 2, t * 4, S.scorch || S.shadow, C.sandDark, 0.6 * M.u, false);
      R.flat.flat(M.cx, 0.11, M.cz, r * 1.4, r * 1.4, t * 2, S.warn, C.warn, 0.8 * fl, false);
      if (s.fx && Math.random() < 0.5) { const a = Math.random() * TAU; s.fx.add(M.cx + Math.cos(a) * r, 0.3, M.cz + Math.sin(a) * r, Math.cos(a) * 1.5, 2 + Math.random() * 2, Math.sin(a) * 1.5, 0.8, 0.5, 1.4, C.sand, 0.8, 'puff', 4, 0, 1); }
    } else {
      const a = Math.min(1, M.u * 6, (1 - M.u) * 4);
      R.flat.flat(M.cx, 0.08, M.cz, r * 2.4, r * 2.4, 0, S.shadow, C.black, 0.6 * a, false);
      R.flat.flat(M.cx, 0.1, M.cz, r * 2.6, r * 2.6, t, S.ring, C.sand, 0.8 * a, false);
    }
  }
}

if (typeof window !== 'undefined') setTimeout(() => {
  // hazard screenshots (tools/cart_track_test.js reads debug.trackShots.sharkdunes) and the level's live state
  const C = window.BRADY_CART; if (!C || !C.debug) return;
  const D = C.debug, NAMES = ['fin-stalk', 'fin', 'devil-brew', 'devil', 'sanded', 'quick-churn', 'quicksand', 'maw-rumble', 'maw', 'launch'];
  D.trackShots = D.trackShots || {};
  D.trackShots.sharkdunes = { list: () => NAMES.map(name => ({ name })), shot: name => shdShot(D, name) };
  D.trackLevel = D.trackLevel || {};
  D.trackLevel.sharkdunes = () => {
    const s = Game.scene; if (!s || !s.shd) return null;
    const K = s.kit || {}, L = s.shd;
    return { hits: K.hits || {}, touch: K.touch || {}, fired: K.fired || {}, L: s.T ? +s.T.L.toFixed(1) : 0, fins: L.fins.map(f => f.st), devils: L.devils.map(v => v.st), qs: L.qs.map(q => q.st), maw: L.maw.st };
  };
}, 0);
function shdShot(D, name) {
  const STEP = 1 / 60;
  D.start({ mode: 'quick', track: 'sharkdunes', car: 'shark', driver: 'brady', seed: 9, autoGas: true });
  const s = D.scene(); s.state = 'race'; s.stateT = 0; window.BRADY.Input.setMode('game'); s.layoutControls(); s.update(STEP);
  const L = s.shd, T = s.T, P = s.player, B = s.E.shd;
  let pin = null; const pins = [];
  const park = (sv, lat, speed, frozen) => { const g = T.at(((sv % T.L) + T.L) % T.L, {}); D.place(-1, g.x + g.nx * g.hw * lat, g.z + g.nz * g.hw * lat, g.yaw, { speed: speed || 0, frozen: false }); P.prevS = P.loc.s; P.lap = 1; P.prog = P.loc.s; pin = frozen ? { x: P.x, z: P.z, yaw: P.yaw } : null; };
  const rivals = list => { let j = 0; for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = list[j++] || [-300 - j * 12, 0, 1]; const g = T.at(((P.loc.s + r[0]) % T.L + T.L) % T.L, {}); D.place(i, g.x + g.nx * g.hw * r[1], g.z + g.nz * g.hw * r[1], g.yaw, { speed: r[2] ? 0 : 18, frozen: false }); if (r[2]) pins.push({ k, x: k.x, z: k.z, yaw: k.yaw }); k.prevS = k.loc.s; k.lap = 1; k.prog = k.loc.s; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } k.wpn.t = 99; } };
  s.autoDrive = true; if (!P.ai) s.aiInput(P, STEP, true); P.ai.itemT = 99; P.ai.fireT = 99; P.wpn.t = 99;
  const hold = () => { if (pin) { P.x = pin.x; P.z = pin.z; P.yaw = pin.yaw; P.vx = P.vz = 0; } for (const q of pins) { q.k.x = q.x; q.k.z = q.z; q.k.yaw = q.yaw; q.k.vx = q.k.vz = 0; } };
  const wait = (fn, secs) => { for (let i = 0; i < secs * 60; i++) { s.update(STEP); hold(); if (fn()) return true; } return false; };
  let ok = true;
  if (name === 'fin-stalk' || name === 'fin') { const f = L.fins[1]; park(f.s - 17, 0.35, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'fin-stalk' ? f.st === 'stalk' && f.t > 0.8 : f.st === 'dash' && Math.abs(f.d) < 4, 16); }
  else if (name === 'devil-brew' || name === 'devil') { const v = L.devils[1]; park(v.s0 - 28, 0, 0, true); rivals([[-50, 0, 1]]); ok = wait(() => name === 'devil-brew' ? v.st === 'brew' && v.u > 0.6 : v.st === 'go' && v.u > 0.35 && v.u < 0.6, 16); }
  else if (name === 'sanded') { const v = L.devils[1]; park(v.s0 + 2, 0, 0, false); rivals([[-50, 0, 1]]); ok = wait(() => L.blind > 0.6, 24); }
  else if (name === 'quick-churn' || name === 'quicksand') { const q = L.qs[1]; park(q.s - 15, -0.2, 0, true); rivals([[-50, 0, 1]]); ok = wait(() => name === 'quick-churn' ? q.st === 'churn' && q.u > 0.6 : q.st === 'sink' && q.u > 0.3, 16); }
  else if (name === 'maw-rumble' || name === 'maw') { const M = L.maw; park(M.s - 24, 0, 0, true); rivals([[-50, 0, 1]]); ok = wait(() => name === 'maw-rumble' ? M.st === 'rumble' && M.u > 0.7 : M.st === 'gulp' && M.u > 0.2 && M.u < 0.35, 16); }
  else if (name === 'launch') { park(B.S.table2 - 30, 0, 26, false); rivals([[8, 0.3, 0], [14, -0.3, 0], [-6, 0, 0]]); ok = wait(() => P.air && P.y > 1.5, 4); }
  s.snapCam = true; for (let i = 0; i < 4; i++) { D.step(1, 1); hold(); }
  return { ok, draws: s.stats.draws, tris: s.stats.tris, hits: (s.kit || {}).hits, p: [+P.x.toFixed(1), +P.z.toFixed(1), +P.loc.s.toFixed(1)] };
}
