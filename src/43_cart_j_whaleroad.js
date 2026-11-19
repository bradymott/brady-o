/* ============================================================
   ART CART — WHALE ROAD, Whale of a Time's career track (level agent "whale", Nov 19 2026).
   Recipe: docs/ART_CART_LEVEL_RECIPE.md (Love Parade is the worked example). A sunny coast road round a little
   peninsula: sea to the south, the west and off the rocky headland, a fishing harbour, beach huts, dunes, a lighthouse
   on its islet, and out in the bay a big friendly blue whale that spouts and BREACHES. One lap of about 1.15 km:
     SURF STRAIGHT     the start, along the beach. Three WAVE WASHES: the sea draws back (a blue band with arrows
                       flashes across the road), then a wave rolls over the road and washes cars inland and slows them.
                       HOP the crest (airborne cars ride over it) or pass the spot while it is calm (they're staggered)
     BLOWHOLE POINT    round the rocky headland: six BLOWHOLES in the road. A hole bubbles and hisses (rings close in
                       on it, mist rises: 1.3 s), then ERUPTS and launches anything on it sky high. Steer off the
                       bubbling rings; they take turns, so there is always a dry line
     BARNACLE NARROWS  a causeway over the tidal flats: BARNACLE ROCKS rise out of the tide pools in the road (the pool
                       drains and swirls: 1.2 s), stand for a few seconds and sink back. Two sets take turns (right
                       side, then left side): keep to the clear side; driving into one spins you out
     GULL ALLEY        the harbour straight: SEAGULLS circle overhead. One picks a car, screeches and hovers while a
                       target flashes on the road where that car is heading (1.4 s), then DIVES on it: it snatches
                       your item and flaps in your face. Change your line; the target doesn't follow you
   WHALE OF A TIME's SKY BREACH is in everyone's gift boxes here (CART_TRACKS.whaleroad.car = 'whale').
   Start it without the menus: BRADY_CART.debug.start({ mode: 'career', track: 'whaleroad' }) (or mode 'quick').
   Globals are prefixed WRD_ / wrd, level state lives on E.wrd and s.wrd.
   ============================================================ */
const WRD_C = { white: [1, 1, 1], foam: [0.95, 0.98, 1], sea: [0.2, 0.55, 0.9], deep: [0.08, 0.3, 0.7], aqua: [0.35, 0.88, 1], water: [0.6, 0.88, 1], blue: [0.25, 0.55, 1], black: [0, 0, 0], sand: [0.95, 0.85, 0.6], warn: [1, 0.55, 0.2], red: [1, 0.3, 0.3], hot: [1, 0.35, 0.2], yellow: [1, 0.85, 0.25], mist: [0.85, 0.95, 1], wet: [0.3, 0.45, 0.55] };
const WRD_T = { at: {}, at2: {}, p: {} };

/* ---------------- the course ---------------- */
// corners [x, z, radius]: the surf straight (south, heading east), blowhole point (the south-east headland), the
// narrows (north-east chicane over the tidal flats), the dune road (north), gull alley (west, heading south)
const WRD_POLY = [[-206, -120, 45], [130, -128, 50], [232, -58, 30], [212, 46, 26], [130, 70, 24], [72, 130, 26], [-28, 92, 24], [-122, 134, 34], [-226, 56, 40]];
// the shoreline (sea on the outside): west shore x ≈ -292, south shore z ≈ -152, the headland's east shore x ≈ 266
const wrdShoreZ = x => -152 + 5 * Math.sin(x * 0.035) + 3 * Math.sin(x * 0.09 + 1);
const wrdShoreXW = z => -292 + 5 * Math.sin(z * 0.04 + 2) + 3 * Math.sin(z * 0.11);
const wrdShoreXE = z => 266 + 4 * Math.sin(z * 0.05) + 2.5 * Math.sin(z * 0.13 + 2);
// registries (assign through the same guards, never redeclare)
var CART_TRACK_RULES = (typeof CART_TRACK_RULES !== 'undefined' && CART_TRACK_RULES) || {};
var CART_CAREER_TRACKS = (typeof CART_CAREER_TRACKS !== 'undefined' && CART_CAREER_TRACKS) || {};
CART_TRACKS.whaleroad = {
  name: 'WHALE ROAD', car: 'whale', tod: 'day', music: 'kart4', width: 20, shoulder: 6, theme: 'coast', blurb: 'Wave washes, blowholes, barnacle rocks and thieving gulls',
  get pts() { return this._pts || (this._pts = CartKit.course(WRD_POLY, { start: [-20, -124], step: 18 })); },   // lazy (the kit is ready by then either way)
  world: (id, D) => wrdWorld(id, D)
};
CART_CAREER_TRACKS.whale = 'whaleroad';

/* ---------------- shapes shared by the static and the moving pieces ---------------- */
// a happy blue whale facing +z, about 5.2 long, 2 tall at scale 1 (blue back, pale grooved belly, a big smile)
function wrdWhale(m, back, belly, lo) {
  const sg = lo ? 12 : 22, rg = lo ? 8 : 14;
  m.color(back).shine(3);
  m.ellipsoid(0, 0, 0.2, 1.05, 0.95, 2.4, { seg: sg, rings: rg });
  m.limb(0, 0.05, -1.8, 0, 0.25, -3.5, 0.62, 0.22, { seg: lo ? 8 : 12 });
  for (const sd of [-1, 1]) { m.push(); m.tf(sd * 0.62, 0.32, -3.75, sd * 0.5, 0, 0, 1, 1, 1); m.ellipsoid(0, 0, 0, 0.75, 0.1, 0.42, { seg: lo ? 8 : 12, rings: 5 }); m.pop(); }
  for (const sd of [-1, 1]) { m.push(); m.tf(sd * 1.0, -0.45, 0.9, sd * 0.6, 0, sd * 0.5, 1, 1, 1); m.ellipsoid(0, 0, 0, 0.62, 0.09, 0.3, { seg: lo ? 8 : 10, rings: 5 }); m.pop(); }
  m.color(belly).shine(2); m.ellipsoid(0, -0.3, 0.45, 0.9, 0.68, 2.05, { seg: sg, rings: rg, phi0: Math.PI * 0.45 });
  m.color('#9cc8e8'); for (let i = -3; i <= 3; i++) m.limb(i * 0.2, -0.93, 1.9, i * 0.24, -0.86, -0.6, 0.035, 0.035, { seg: 4 });
  // the smile: a dark arc along each cheek, a pink tongue line
  m.color('#13244a'); for (const sd of [-1, 1]) { let px = sd * 0.62, pz = 2.3, py = -0.12; for (let i = 1; i <= 5; i++) { const u = i / 5, x = sd * (0.62 + 0.3 * u), z = 2.3 - u * 0.9, y = -0.12 - Math.sin(u * Math.PI) * 0.1 + u * 0.12; m.limb(px, py, pz, x, y, z, 0.05, 0.05, { seg: 4 }); px = x; py = y; pz = z; } }
  m.limb(-0.62, -0.12, 2.3, 0.62, -0.12, 2.3, 0.05, 0.05, { seg: 4 });
  // eyes, a blowhole
  m.color('#ffffff').shine(3); for (const sd of [-1, 1]) m.ball(sd * 0.86, 0.18, 1.45, 0.2, { seg: 10, rings: 8 });
  m.color('#101828'); for (const sd of [-1, 1]) m.ball(sd * 0.98, 0.2, 1.5, 0.11, { seg: 8, rings: 6 });
  m.color('#ffffff'); for (const sd of [-1, 1]) m.ball(sd * 1.04, 0.25, 1.55, 0.035, { seg: 4, rings: 3 });
  m.color('#1a3a7a').shine(1); m.push(); m.tf(0, 0.94, 1.0, 0, 0, 0, 1, 1, 0.6); m.disc(0, 0, 0, 0.16, 10); m.pop();
  m.shine(0);
}
// a lumpy grey rock crusted with white barnacles, a starfish and a frond of weed (about 2.4 m across, 2 m tall)
function wrdRock(m, lo, scale) {
  const sg = lo ? 8 : 14, rg = lo ? 6 : 9;
  m.color('#6e6a66').shine(1); m.ellipsoid(0, 0.9, 0, 2.3, 1.7, 2.0, { seg: sg, rings: rg, colFn: (x, y) => y < -0.9 ? '#3e4a40' : null });
  m.color('#7c7670'); m.ellipsoid(0.8, 1.6, -0.4, 1.3, 1.0, 1.2, { seg: sg - 2, rings: rg - 2 }); m.ellipsoid(-0.9, 0.7, 0.7, 1.2, 0.9, 1.1, { seg: sg - 2, rings: rg - 2 });
  // barnacles: little white cones with a dark hole on top
  if (!lo) for (let i = 0; i < 26; i++) {
    const a = i * 2.39996, v = 0.15 + ((i * 0.618) % 1) * 0.7, x = Math.cos(a) * 2.2 * Math.sin(v * Math.PI * 0.62 + 0.5), z = Math.sin(a) * 1.9 * Math.sin(v * Math.PI * 0.62 + 0.5), y = 0.9 + Math.cos(v * Math.PI * 0.62 + 0.5) * 1.65;
    const nx = x / 2.2, ny = (y - 0.9) / 1.7, nz = z / 2.0, l = Math.hypot(nx, ny, nz), r = 0.13 + (i % 3) * 0.05;
    m.color('#f2efe6').shine(2); m.limb(x, y, z, x + nx / l * r * 1.3, y + ny / l * r * 1.3, z + nz / l * r * 1.3, r, r * 0.55, { seg: 6, ends: false });
    m.color('#2a2a30'); m.ball(x + nx / l * r * 1.35, y + ny / l * r * 1.35, z + nz / l * r * 1.35, r * 0.35, { seg: 4, rings: 3 });
  }
  // an orange starfish stuck on the side, a frond of kelp at the foot
  m.color('#ff7a3a').shine(1); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; m.limb(1.9, 1.25, 0.6, 1.95 + Math.cos(a) * 0.05, 1.25 + Math.sin(a) * 0.45, 0.6 + Math.cos(a) * 0.45, 0.13, 0.05, { seg: 5 }); }
  m.color('#3a8a4a'); for (let i = 0; i < 4; i++) { const a = i * 1.6 + 0.4; m.limb(Math.cos(a) * 2.1, 0.1, Math.sin(a) * 1.8, Math.cos(a) * 2.5, 0.9 + (i % 2) * 0.4, Math.sin(a) * 2.2, 0.16, 0.05, { seg: 5 }); }
  m.shine(0);
}

/* ---------------- static pieces (merged into the world's chunks) ---------------- */
// the start gate: two red-and-white striped posts, a driftwood beam at 13.5 m, a garland of fishing floats
function wrdGate(m, W) {
  const h = 13.5;
  for (const sd of [-1, 1]) {
    for (let i = 0; i < 6; i++) { m.color(i % 2 ? '#ffffff' : '#e8403a').shine(2); m.cyl(sd * W / 2, i * h / 6, 0, 0.75 - i * 0.03, 0.75 - (i + 1) * 0.03, h / 6, 14); }
    m.color('#2a6ad8').shine(3); m.ball(sd * W / 2, h + 0.6, 0, 1.0, { seg: 12, rings: 8 }); m.roundCyl(sd * W / 2, 0, 0, 1.4, 0.6, 0.2);
  }
  m.color('#b89468').shine(0); m.roundBox(0, h, 0, W + 1.5, 1.0, 1.2, 0.4);
  m.color('#8a6a48'); for (let i = -4; i <= 4; i++) m.roundBox(i * W / 9, h, 0.62, 0.2, 0.9, 0.06, 0.03);
  // the garland: a sagging rope with coloured floats
  const n = 13, C = ['#ffd23a', '#ff5a6a', '#4ab0ff', '#ffffff', '#5adca0'];
  m.color('#e8dcc0'); let px = -W / 2, py = h - 0.6;
  for (let i = 1; i <= n; i++) { const u = i / n, x = -W / 2 + u * W, y = h - 0.6 - Math.sin(u * Math.PI) * 2.6; m.limb(px, py, -0.62, x, y, -0.62, 0.06, 0.06, { seg: 4 }); px = x; py = y; }
  for (let i = 1; i < n; i++) { const u = i / n, x = -W / 2 + u * W, y = h - 0.6 - Math.sin(u * Math.PI) * 2.6; m.color(C[i % 5]).shine(3); m.ball(x, y - 0.45, -0.62, 0.42, { seg: 10, rings: 8 }); }
  m.shine(0);
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 1, y0: 0, y1: h, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: 1, y0: 0, y1: h, camPass: true }] };
}
// the lighthouse on its rocky islet: a striped tower, a gallery, the lantern room, a red cap
function wrdLighthouse(m) {
  m.color('#6e6a66').shine(1); for (const [x, z, r] of [[0, 0, 9], [6, 4, 5], [-5, 5, 4.5], [3, -6, 4], [-6, -4, 3.5]]) m.ellipsoid(x, 0.6, z, r, r * 0.45, r * 0.9, { seg: 14, rings: 8 });
  const H = 26, n = 7;
  for (let i = 0; i < n; i++) { m.color(i % 2 ? '#ffffff' : '#e8403a').shine(2); m.cyl(0, 3 + i * H / n, 0, 3.4 - i * 0.24, 3.4 - (i + 1) * 0.24, H / n, 20); }
  m.color('#2a2a34').shine(3); m.cyl(0, 3 + H, 0, 2.9, 2.9, 0.5, 20); m.torus(0, 3 + H + 1.4, 0, 2.7, 0.08, { seg: 20, tseg: 4 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; m.limb(Math.sin(a) * 2.7, 3 + H + 0.5, Math.cos(a) * 2.7, Math.sin(a) * 2.7, 3 + H + 1.4, Math.cos(a) * 2.7, 0.06, 0.06, { seg: 4 }); }
  m.color('#fff4b0', 0.9).shine(4); m.cyl(0, 3 + H + 0.5, 0, 1.7, 1.7, 2.8, 16); m.emissive(0);
  m.color('#e8403a').shine(3); m.lathe([[2.2, 0], [1.6, 0.9], [0.3, 2.2], [0, 2.4]], { seg: 16 });
  m.push(); m.tf(0, 3 + H + 3.3, 0); m.lathe([[2.2, 0], [1.6, 0.9], [0.3, 2.2], [0, 2.4]], { seg: 16 }); m.pop();
  m.color('#2a2a34'); m.ball(0, 3 + H + 5.9, 0, 0.35, { seg: 8, rings: 6 });
  m.color('#3a5aa8'); m.roundBox(0, 4.4, 3.36, 1.6, 2.8, 0.2, 0.3);
  m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 5, y0: 0, y1: 30 }] };
}
// a blowhole in the road: a ring of dark wet rock, barnacles, a black hole (low enough to drive over)
function wrdVent(m) {
  m.color('#3e4448').shine(2); m.torus(0, 0.05, 0, 2.4, 0.55, { seg: 24, tseg: 6, sy: 0.35 });
  m.color('#1a2228').shine(4); m.disc(0, 0.04, 0, 2.0, 22);
  m.color('#0a0e14'); m.disc(0, 0.06, 0, 1.2, 18);
  m.color('#f2efe6').shine(2); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.3; m.limb(Math.sin(a) * 2.55, 0.12, Math.cos(a) * 2.55, Math.sin(a) * 2.6, 0.32, Math.cos(a) * 2.6, 0.16, 0.08, { seg: 5, ends: false }); }
  m.shine(0);
  return { cols: [] };
}
// the fish shack on the harbour beach: a blue clapboard hut, a striped awning, crates of fish, a big fish sign
function wrdShack(m) {
  m.color('#4a8ad8').shine(1); m.roundBox(0, 3, 0, 12, 6, 8, 0.3);
  m.color('#ffffff'); for (let y = 0.6; y < 6; y += 0.75) m.box(0, y, 4.02, 12, 0.08, 0.05);
  m.color('#e8e0d0'); m.push(); m.tf(0, 6, 0, 0, 0, 0); m.poly([[-6.6, 0, 4.6], [6.6, 0, 4.6], [6.6, 2.6, 0], [-6.6, 2.6, 0]], null, [0, 1, 1]); m.poly([[6.6, 0, -4.6], [-6.6, 0, -4.6], [-6.6, 2.6, 0], [6.6, 2.6, 0]], null, [0, 1, -1]); m.pop();
  m.color('#f4f0e8'); m.poly([[-6, 6, 4], [-6, 8.6, 0], [-6, 6, -4]], null, [-1, 7, 0]); m.poly([[6, 6, -4], [6, 8.6, 0], [6, 6, 4]], null, [1, 7, 0]);
  for (let i = 0; i < 8; i++) { m.color(i % 2 ? '#ffffff' : '#e8403a'); m.push(); m.tf(-5.25 + i * 1.5, 4.6, 5.3, 0, -0.45, 0); m.box(0, 0, 0, 1.5, 0.08, 2.6); m.pop(); }
  m.color('#3a2a1a'); m.roundBox(0, 2.2, 4.1, 5, 2.6, 0.2, 0.1);
  m.color('#b89468'); for (const x of [-4.5, -2.6, 3.0]) { m.roundBox(x, 0.55, 6.4, 1.6, 1.1, 1.2, 0.08); m.color('#c0d8e8').shine(3); for (let j = 0; j < 3; j++) m.ellipsoid(x - 0.4 + j * 0.4, 1.15, 6.4, 0.18, 0.12, 0.5, { seg: 6, rings: 4 }); m.color('#b89468').shine(0); }
  // the sign: a big orange fish on the roof
  m.color('#ff8a3a').shine(2); m.ellipsoid(0, 10, 0, 0.5, 1.3, 3.2, { seg: 14, rings: 8 }); m.push(); m.tf(0, 10, -3.4, 0, 0, 0); m.poly([[0, 0, 0], [0, 1.3, -1.4], [0, -1.3, -1.4]], null, [1, 0, 0]); m.poly([[0, 0, 0], [0, -1.3, -1.4], [0, 1.3, -1.4]], null, [-1, 0, 0]); m.pop();
  m.color('#ffffff'); for (const sd of [-1, 1]) m.ball(sd * 0.42, 10.4, 2.2, 0.22, { seg: 8, rings: 6 }); m.color('#101828'); for (const sd of [-1, 1]) m.ball(sd * 0.5, 10.4, 2.3, 0.11, { seg: 6, rings: 4 });
  m.color('#8a6a48'); m.limb(0, 8.4, 0, 0, 8.8, 0, 0.15, 0.15, { seg: 5 });
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 6, hz: 4, y0: 0, y1: 9 }] };
}
// the pier: a plank deck on posts running out to sea (local +z = out to sea), lamp posts, a bollard
function wrdPier(m, L) {
  m.color('#a88460').shine(0); m.box(0, 1.6, L / 2, 6, 0.4, L);
  m.color('#8a6a48'); for (let z = 0.6; z < L; z += 1.2) m.box(0, 1.82, z, 6, 0.05, 0.08);
  m.color('#6a5038'); for (let z = 2; z < L; z += 6) for (const sx of [-2.6, 2.6]) m.cyl(sx, -1, z, 0.3, 0.3, 2.8, 8);
  m.color('#e8e0d0'); for (const sx of [-3, 3]) m.box(sx, 2.6, L / 2, 0.15, 0.15, L);
  m.color('#6a5038'); for (let z = 0; z < L; z += 3) for (const sx of [-3, 3]) m.box(sx, 2.2, z, 0.15, 0.9, 0.15);
  for (let z = 6; z < L; z += 12) { m.color('#2a6ad8').shine(3); m.cyl(2.6, 1.8, z, 0.12, 0.12, 4, 8); m.color('#fff4c8', 0.5); m.ball(2.6, 6, z, 0.4, { seg: 8, rings: 6 }); m.emissive(0); }
  m.color('#ff5a3a').shine(2); m.torus(-3.2, 2.4, L * 0.6, 0.7, 0.18, { seg: 16, tseg: 5 });
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: L / 2, hx: 3, hz: L / 2, y0: 0, y1: 3 }] };
}
// a little sailboat (local +z = bow)
function wrdBoat(m, col, sail) {
  m.color(col).shine(3); m.push(); m.tf(0, 0, 0, 0, 0, 0, 1, 0.55, 2.3); m.ball(0, 0.6, 0, 2.2, { seg: 16, rings: 8, phi0: Math.PI / 2 }); m.pop();
  m.color('#ffffff').shine(2); m.roundBox(0, 0.62, -0.2, 3.6, 0.3, 8.4, 0.2);
  m.color('#e8dcc0'); m.limb(0, 0.6, 0.6, 0, 9, 0.6, 0.12, 0.1, { seg: 6 });
  m.color(sail).shine(0); m.poly([[0, 1.6, 0.4], [0, 8.6, 0.5], [0, 1.6, -3.4]], null, [1, 4, -1]); m.poly([[0, 1.6, -3.4], [0, 8.6, 0.5], [0, 1.6, 0.4]], null, [-1, 4, -1]);
  m.color('#ffffff'); m.poly([[0, 1.8, 0.9], [0, 7.6, 0.8], [0, 1.8, 3.2]], null, [1, 4, 1]); m.poly([[0, 1.8, 3.2], [0, 7.6, 0.8], [0, 1.8, 0.9]], null, [-1, 4, 1]);
  m.shine(0);
  return { cols: [] };
}
// a sand sculpture of a whale with a little sandcastle (the infield's centrepiece)
function wrdSandWhale(m) {
  m.push(); m.tf(0, 1.2, 0, 0, -0.08, 0, 4.2, 4.2, 4.2); wrdWhale(m, '#e8c890', '#f4dcae', false); m.pop();
  m.color('#e0be86').shine(0); m.ellipsoid(0, 0, 0, 7, 1.6, 15, { seg: 18, rings: 8 });
  // a sandcastle beside it, with a flag
  m.color('#e8c890'); m.roundBox(-10, 1.5, 4, 5, 3, 5, 0.4); for (const [x, z] of [[-12.5, 1.5], [-7.5, 1.5], [-12.5, 6.5], [-7.5, 6.5]]) { m.cyl(x, 0, z, 1, 1, 4.6, 10); m.lathe([[1.15, 0], [0.4, 1.4], [0, 1.6]], { seg: 10 }); }
  m.push(); m.tf(-10, 3, 4); m.lathe([[1.6, 0], [0.5, 2.2], [0, 2.4]], { seg: 10 }); m.pop();
  m.color('#8a6a48'); m.limb(-10, 5.2, 4, -10, 8, 4, 0.06, 0.06, { seg: 4 }); m.color('#2a6ad8'); m.poly([[-10, 8, 4], [-10, 7.2, 4], [-8.6, 7.6, 4]], null, [0, 0, 1]); m.poly([[-10, 7.2, 4], [-10, 8, 4], [-8.6, 7.6, 4]], null, [0, 0, -1]);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 5, hz: 12, y0: 0, y1: 9 }, { t: 'box', x: -10, z: 4, hx: 3.5, hz: 3.5, y0: 0, y1: 5 }] };
}

/* ---------------- instanced props (this world only) ---------------- */
const WRD_KINDS = {
  // a beach umbrella (tinted canopy, white stripes stay pale) over a towel
  wrd_umb: { r: 2.4, near: 34, mid: 120, farD: 300,
    build(m) {
      m.color('#e8e0d0').shine(1); m.limb(0, 0, 0, 0.2, 3.4, 0, 0.07, 0.06, { seg: 6 });
      for (let i = 0; i < 8; i++) { const a0 = i / 8 * TAU, a1 = (i + 1) / 8 * TAU; m.color(i % 2 ? '#ffffff' : '#f0f0f0').shine(2); m.poly([[0.2, 3.9, 0], [Math.sin(a0) * 2.3 + 0.2, 3.1, Math.cos(a0) * 2.3], [Math.sin(a1) * 2.3 + 0.2, 3.1, Math.cos(a1) * 2.3]], null, [0, 1, 0]); }
      m.color('#ffffff'); m.roundBox(1.4, 0.03, 0.4, 1.2, 0.05, 2.2, 0.02);
      m.shine(0); return { cols: [] };
    },
    far(m) { m.color('#ffffff'); m.cyl(0.2, 3.1, 0, 2.2, 0.1, 0.8, 8); } },
  // a beach hut: tinted planks, a white trim and door, a pitched roof
  wrd_hut: { r: 2.4, near: 36, mid: 130, farD: 320,
    build(m) {
      m.color('#ffffff').shine(1); m.roundBox(0, 1.8, 0, 3.4, 3.6, 3.2, 0.1);
      m.color('#f4f4f4'); for (let x = -1.4; x <= 1.4; x += 0.7) m.box(x, 1.8, 1.62, 0.06, 3.6, 0.04);
      m.color('#fdfaf0'); m.roundBox(0, 1.3, 1.64, 1.2, 2.4, 0.08, 0.05); m.box(0, 0.12, 1.9, 3.6, 0.24, 0.8);
      m.color('#fdfaf0'); m.poly([[-1.9, 3.6, 1.8], [1.9, 3.6, 1.8], [0, 4.8, 1.8]], null, [0, 0, 1]); m.poly([[1.9, 3.6, -1.8], [-1.9, 3.6, -1.8], [0, 4.8, -1.8]], null, [0, 0, -1]);
      m.color('#ffffff'); m.poly([[-1.9, 3.6, 1.8], [0, 4.8, 1.8], [0, 4.8, -1.8], [-1.9, 3.6, -1.8]], null, [-1, 1, 0]); m.poly([[1.9, 3.6, -1.8], [0, 4.8, -1.8], [0, 4.8, 1.8], [1.9, 3.6, 1.8]], null, [1, 1, 0]);
      m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.8, hz: 1.7, y0: 0, y1: 4.8 }] };
    },
    far(m) { m.color('#ffffff'); m.box(0, 2.2, 0, 3.4, 4.4, 3.2); } },
  // a barnacled rock (tinted greys)
  wrd_rock: { r: 2.4, near: 34, mid: 120, farD: 300, soft: 0.5,
    build(m) { wrdRock(m, m.lo); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.1, y0: 0, y1: 2.4 }] }; },
    far(m) { m.color('#ffffff'); m.ellipsoid(0, 0.9, 0, 2.3, 1.7, 2.0, { seg: 6, rings: 4 }); } },
  // a marker buoy bobbing at sea (tinted), a little light on top
  wrd_buoy: { r: 1.4, near: 40, mid: 140, farD: 360,
    build(m) { m.color('#ffffff').shine(3); m.lathe([[1.1, 0], [1.3, 0.6], [1.0, 1.4], [0.5, 2.6], [0.3, 3.6], [0, 3.7]], { seg: 14 }); m.color('#f4f4f4'); m.torus(0, 1.6, 0, 0.85, 0.12, { seg: 14, tseg: 4 }); m.color('#fff4b0', 0.6); m.ball(0, 3.9, 0, 0.3, { seg: 8, rings: 6 }); m.emissive(0).shine(0); return { cols: [] }; },
    far(m) { m.color('#ffffff'); m.cyl(0, 0, 0, 1.1, 0.3, 3.6, 6); } },
  // a tuft of dune grass (tinted greens)
  wrd_grass: { r: 1.5, near: 30, mid: 90, farD: 220, soft: 0.6,
    build(m) { m.color('#ffffff').shine(0); for (let i = 0; i < 9; i++) { const a = i * 2.4, l = 1.1 + (i % 3) * 0.35; m.limb(Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25, Math.cos(a) * 0.8, l, Math.sin(a) * 0.8, 0.07, 0.015, { seg: 4 }); } return { cols: [] }; },
    far(m) { m.color('#ffffff'); m.cyl(0, 0, 0, 0.8, 0.3, 1.2, 5); } }
};

/* ---------------- building the world ---------------- */
function wrdWorld(id, D) {
  // the base world (as CartKit.world, but the coast is painted before the road so the road lies on top)
  const T = new CartTrack(D), rng = mulberry32(hashStr(id)), pad = 80, b = T.bounds;
  const E = CartWorlds.base(1231, [b.x0 - pad - 40, b.z0 - pad - 90, b.x1 + pad + 60, b.z1 + pad], '#d8c290', 0);
  const sky = Object.assign({}, CART_SKIES.day(), { zen: '#3a8ee8', hor: '#ffeccc', sky: '#a4d8ff', fog: '#cfe6f2', fogD: 0.0022, haze: 0.2, clouds: 0.6, mid: '#9ed0e8', midK: 0.2, key: '#fff0dc', keyK: 1.05, gnd: '#dfe8cc' });
  Object.assign(E, { id, def: D, track: T, sky, tod: D.tod, music: D.music, night: false, storm: false, fireworks: false });
  const api = E.api, sOf = (x, z) => CartKit.sOf(T, x, z);
  const S = { wave: sOf(40, -126), blow: sOf(232, -14), rocks: sOf(100, 106), gull: sOf(-228, -10), dune: sOf(-80, 125) };
  E.wrd = { S };
  const side = (s, sd, off) => { const g = T.at(((s % T.L) + T.L) % T.L, {}), o = sd > 0 ? g.wr + off : -g.wl - off; return { x: g.x + g.nx * o, z: g.z + g.nz * o, yaw: Math.atan2(-g.nx * sd, -g.nz * sd), g }; };
  const taken = [];
  // ---- the hazards' spots (arc length, lateral) ----
  E.wrd.waves = []; for (let i = 0; i < 3; i++) { const s = S.wave + (i - 1) * 32, g = T.at(s, {}), sea = g.nz < 0 ? 1 : -1; E.wrd.waves.push({ i, s, x: g.x, z: g.z, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, yaw: g.yaw, hw: g.hw, wl: g.wl, wr: g.wr, sea }); }
  E.wrd.vents = []; const VL = [-0.45, 0.42, -0.05, 0.5, -0.5, 0.15], VS = [-40, -26, -12, 2, 16, 30];
  for (let i = 0; i < 6; i++) { const s = S.blow + VS[i], g = T.at(s, {}), d = VL[i] * g.hw; E.wrd.vents.push({ i, s, d, x: g.x + g.nx * d, z: g.z + g.nz * d, tx: g.tx, tz: g.tz }); }
  // two sets that take turns: the even rocks sit right of centre, the odd ones left, so one side is always clear
  E.wrd.rocks = []; const RL = [0.32, -0.32, 0.32, -0.32], RS = [-24, -10, 6, 20];
  for (let i = 0; i < 4; i++) { const s = S.rocks + RS[i], g = T.at(s, {}), d = RL[i] * g.hw; E.wrd.rocks.push({ i, s, d, x: g.x + g.nx * d, z: g.z + g.nz * d, tx: g.tx, tz: g.tz, yaw: g.yaw + i }); }
  // ---- the coast: sea, shallows, wet sand and foam; dunes and grass inland; the headland's rock; the tidal flats ----
  api.paint((ctx, P, Sc) => {
    const B = E.world.bounds, X0 = B.x0 - 60, X1 = B.x1 + 60, Z0 = B.z0 - 60, Z1 = B.z1 + 60;
    // grass and dune patches inland (the sand base shows near the sea)
    for (let i = 0; i < 260; i++) { const x = lerp(-250, 250, rng()), z = lerp(-95, 230, rng()); if (x < wrdShoreXW(z) + 40 || x > wrdShoreXE(z) - 40) continue; const q = P(x, z), r = (8 + rng() * 22) * Sc, g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); const c = rng() < 0.7 ? '120,170,80' : '160,180,90'; g.addColorStop(0, `rgba(${c},0.55)`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.fillRect(q[0] - r, q[1] - r, r * 2, r * 2); }
    // the headland: dark rock shelves
    for (let i = 0; i < 70; i++) { const a = rng() * TAU, rr = rng() * 60, x = 236 + Math.cos(a) * rr * 0.7, z = -30 + Math.sin(a) * rr; const q = P(x, z), r = (4 + rng() * 9) * Sc; ctx.fillStyle = `rgba(${90 + Math.floor(rng() * 30)},${86 + Math.floor(rng() * 20)},${80 + Math.floor(rng() * 20)},0.6)`; ctx.beginPath(); ctx.ellipse(q[0], q[1], r, r * (0.5 + rng() * 0.5), rng() * 3, 0, TAU); ctx.fill(); }
    // the tidal flats round the narrows: wet sand, pools, ripples
    for (let i = 0; i < 90; i++) { const x = lerp(20, 170, rng()), z = lerp(70, 200, rng()); const q = P(x, z), r = (3 + rng() * 10) * Sc; ctx.fillStyle = rng() < 0.5 ? 'rgba(150,130,100,0.45)' : 'rgba(80,170,200,0.55)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], r, r * 0.6, rng() * 3, 0, TAU); ctx.fill(); }
    // the sea: the shoreline as one path (west shore north to south, the south shore west to east, the headland's
    // east shore south to north), closed round the far side
    const shore = []; for (let z = Z1; z > -140; z -= 6) shore.push([wrdShoreXW(z), z]);
    for (let x = -280; x < 258; x += 6) shore.push([x, wrdShoreZ(x)]);
    for (let z = -140; z < Z1; z += 6) shore.push([wrdShoreXE(z), z]);
    const path = () => { ctx.beginPath(); for (let i = 0; i < shore.length; i++) { const q = P(shore[i][0], shore[i][1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } };
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    path(); ctx.strokeStyle = 'rgba(180,150,100,0.5)'; ctx.lineWidth = 18 * Sc; ctx.stroke();   // wet sand
    path(); for (const p of [[X1, Z1], [X1, Z0], [X0, Z0], [X0, Z1]]) { const q = P(p[0], p[1]); ctx.lineTo(q[0], q[1]); } ctx.closePath();
    const c0 = P(0, -150), c1 = P(0, Z0), gr = ctx.createLinearGradient(c0[0], c0[1], c1[0], c1[1]); gr.addColorStop(0, '#2ab8c8'); gr.addColorStop(0.18, '#1a8cc8'); gr.addColorStop(1, '#0c4a96');
    ctx.fillStyle = gr; ctx.fill();
    path(); ctx.strokeStyle = 'rgba(80,220,220,0.55)'; ctx.lineWidth = 14 * Sc; ctx.stroke();   // the shallows
    path(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6 * Sc; ctx.stroke();   // the foam line
    // swell lines out at sea
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.0 * Sc;
    for (let k = 1; k < 9; k++) { ctx.beginPath(); for (let x = X0; x < X1; x += 10) { const z = wrdShoreZ(x) - 14 - k * 16 + Math.sin(x * 0.05 + k) * 3, q = P(x, z); if (x > X0) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } ctx.stroke(); }
    // the lighthouse islet's foam ring
    { const q = P(282, -96); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5 * Sc; ctx.beginPath(); ctx.ellipse(q[0], q[1], 13 * Sc, 12 * Sc, 0, 0, TAU); ctx.stroke(); }
  });
  CartKit.paintRoad(E, T, { shoulder: 'rgba(240,226,190,0.4)', band: 'rgba(66,72,84,0.9)', edge: 'rgba(255,255,255,0.95)', edgeW: 0.6, centerFn: wrdPaintCenter });
  // on the road: sand drifted over the surf straight, the tide pools at the barnacle rocks, wet rock round the vents
  api.paint((ctx, P, Sc) => {
    for (const w of E.wrd.waves) for (let i = 0; i < 14; i++) { const along = (i / 13 - 0.5) * 14, d = w.sea * (w.hw - 1 - (i % 4) * 2.2), q = P(w.x + w.tx * along + w.nx * d, w.z + w.tz * along + w.nz * d); ctx.fillStyle = 'rgba(230,205,150,0.4)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 2.6 * Sc, 1.2 * Sc, i, 0, TAU); ctx.fill(); }
    for (const r of E.wrd.rocks) { const q = P(r.x, r.z); ctx.fillStyle = 'rgba(40,110,140,0.65)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 3.4 * Sc, 3.0 * Sc, r.i, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(220,240,255,0.6)'; ctx.lineWidth = 0.35 * Sc; ctx.stroke(); }
    for (const v of E.wrd.vents) { const q = P(v.x, v.z), g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 5 * Sc); g.addColorStop(0, 'rgba(30,40,50,0.7)'); g.addColorStop(1, 'rgba(30,40,50,0)'); ctx.fillStyle = g; ctx.fillRect(q[0] - 5 * Sc, q[1] - 5 * Sc, 10 * Sc, 10 * Sc); }
  });
  // ---- barriers: blue and white rails, red and white tyres on the tight bends (lighthouse colours) ----
  CartKit.rails(E, T, (i, tight) => tight ? (i % 2 ? '#ffffff' : '#e8403a') : (Math.floor(i / 2) % 2 ? '#ffffff' : '#2a8ad8'));
  CartKit.kinds(E, WRD_KINDS);
  // ---- the start: the float-garland gate, the name, bleachers on the dune side, umbrellas on the beach ----
  { const g = T.at(0, {}), Wd = g.wl + g.wr + 5;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => wrdGate(m, Wd), { hi: true });
    api.sign('WHALE ROAD', g.x, g.z, { yaw: g.yaw + Math.PI, h: 2.0, y: 15.8, post: false, maxW: 10, style: { bg: '#2a6ad8', fg: '#ffffff', border: '#ffd23a' } });
    const sea = g.nz < 0 ? 1 : -1, p = side(16, -sea, 6); E.spots.push(...CartScene.bleachers(api, p.x, p.z, p.yaw, 22, 3, rng)); taken.push([p.x, p.z, 16]); }
  // beach umbrellas and towels on the sand between the road and the sea, beach huts on the dune side
  const UMB = ['#ff5a6a', '#ffd23a', '#4ab0ff', '#5adca0', '#ff9a3a', '#c08aff'];
  for (let s = -150, k = 0; s < 260; s += 11, k++) { const g = T.at(((s % T.L) + T.L) % T.L, {}), sea = g.nz < 0 ? 1 : -1, off = (sea > 0 ? g.wr : g.wl) + 4 + (k % 3) * 2.5, x = g.x + g.nx * off * sea, z = g.z + g.nz * off * sea; if (z < wrdShoreZ(x) + 4) continue; if (CartWorlds.clear(T, x, z, 2.5)) CartKit.put(E, 'wrd_umb', x, z, k * 0.7, UMB[k % UMB.length]); }
  const HUT = ['#ff8ab0', '#4ab0ff', '#ffd23a', '#5adca0', '#ff9a3a', '#ffffff'];
  for (let s = -140, k = 0; s < 240; s += 9, k++) { if (Math.abs(s - 16) < 18) continue; const p = side(s, -(T.at(((s % T.L) + T.L) % T.L, {}).nz < 0 ? 1 : -1), 5); if (CartWorlds.clear(T, p.x, p.z, 2.6) && taken.every(q => Math.hypot(q[0] - p.x, q[1] - p.z) > q[2] + 3)) CartKit.put(E, 'wrd_hut', p.x, p.z, p.yaw, HUT[k % HUT.length]); }
  CartKit.crowd(E, T, (T.L - 110) % T.L, T.L - 30, T.at(T.L - 60, {}).nz < 0 ? 1 : -1, rng, { rows: 2, off: 3.5, gap: 2.0 });
  CartKit.crowd(E, T, 30, 120, T.at(60, {}).nz < 0 ? -1 : 1, rng, { rows: 1, off: 9, gap: 2.4 });
  api.sign('WAVE\nWASH', ...(() => { const p = side(E.wrd.waves[0].s - 22, -E.wrd.waves[0].sea, 1.5); return [p.x, p.z]; })(), { yaw: E.wrd.waves[0].yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3, style: { bg: '#2a8ad8', fg: '#ffffff', border: '#ffffff' } });
  // ---- blowhole point: the vents, the lighthouse on its islet, rocks along the headland ----
  for (const v of E.wrd.vents) CartScene.mesh(api, v.x, v.z, v.i, wrdVent, { hi: true, noAO: true });
  CartScene.mesh(api, 282, -96, 0.4, wrdLighthouse, { hi: true }); taken.push([282, -96, 14]);
  { const p = side(S.blow - 62, 1, 1.5); api.sign('BLOWHOLE\nPOINT', p.x, p.z, { yaw: p.g.yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.4, style: { bg: '#3e4448', fg: '#ffffff', border: '#4ab0ff' } }); }
  for (let s = S.blow - 70, k = 0; s < S.blow + 70; s += 9, k++) for (const sd of [1, -1]) { const p = side(s, sd, 3 + (k % 3) * 2.5 + (sd > 0 ? 0 : 1)); if (CartWorlds.clear(T, p.x, p.z, 2.6)) CartKit.put(E, 'wrd_rock', p.x, p.z, k * 1.3, ['#8a8580', '#a09a90', '#76726c'][k % 3], { scale: 0.8 + (k % 4) * 0.25 }); }
  // ---- barnacle narrows: rocks and kelp along the causeway, the flats beyond ----
  { const p = side(S.rocks - 64, -1, 1.5); api.sign('BARNACLE\nNARROWS', p.x, p.z, { yaw: p.g.yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.6, style: { bg: '#5a6a72', fg: '#ffffff', border: '#ffffff' } }); }
  for (let s = S.rocks - 55, k = 0; s < S.rocks + 50; s += 13, k++) for (const sd of [1, -1]) { const p = side(s, sd, 4 + (k % 2) * 3); if (CartWorlds.clear(T, p.x, p.z, 2.6)) CartKit.put(E, 'wrd_rock', p.x, p.z, k, ['#76726c', '#8a8580'][k % 2], { scale: 1.1 + (k % 3) * 0.3 }); }
  // ---- gull alley: the harbour (fish shack, pier, boats), gulls perched on the posts ----
  CartScene.mesh(api, -268, -30, Math.PI / 2, wrdShack, { hi: true }); taken.push([-268, -30, 10]);
  CartScene.mesh(api, -285, 20, -Math.PI / 2, m => wrdPier(m, 60), { hi: true }); taken.push([-300, 20, 8]);
  CartScene.mesh(api, -322, 4, 0.2, m => wrdBoat(m, '#e8403a', '#ffffff'), { hi: true });
  CartScene.mesh(api, -338, 38, 2.6, m => wrdBoat(m, '#2a6ad8', '#ffd23a'), { hi: true });
  CartScene.mesh(api, -310, -60, 1.2, m => wrdBoat(m, '#ffffff', '#5adca0'), { hi: false });
  { const p = side(S.gull - 70, 1, 1.5); api.sign('GULL\nALLEY', p.x, p.z, { yaw: p.g.yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3, style: { bg: '#ffffff', fg: '#2a6ad8', border: '#ffd23a' } }); }
  CartKit.crowd(E, T, S.gull - 40, S.gull + 30, T.at(S.gull, {}).nx < 0 ? 1 : -1, rng, { rows: 2, off: 4 });
  // ---- the infield: a sand-sculpture whale, dunes and grass; sailboats and buoys out at sea ----
  CartScene.mesh(api, -10, 10, 0.5, wrdSandWhale, { hi: true }); taken.push([-10, 10, 20]);
  api.sign('SAND WHALE\nCONTEST', -10, 34, { yaw: Math.PI, h: 1.2, y: 2.4, post: true, maxW: 4, style: { bg: '#ffd23a', fg: '#2a6ad8', border: '#ffffff' } });
  CartScene.mesh(api, 60, -250, 1.1, m => wrdBoat(m, '#ffd23a', '#ff5a6a'), { hi: false });
  CartScene.mesh(api, -120, -215, -0.6, m => wrdBoat(m, '#ffffff', '#4ab0ff'), { hi: false });
  CartScene.mesh(api, 330, 20, 2.2, m => wrdBoat(m, '#5adca0', '#ffffff'), { hi: false });
  for (let i = 0; i < 14; i++) { const x = -260 + i * 42 + (i % 2) * 10, z = wrdShoreZ(x) - 30 - (i % 3) * 22; CartKit.put(E, 'wrd_buoy', x, z, i, ['#ff5a3a', '#ffd23a', '#ff5a3a', '#5adca0'][i % 4], { y: -0.6, noLights: true }); }
  for (let i = 0; i < 70; i++) { const x = lerp(-220, 200, rng()), z = lerp(-100, 200, rng()); if (!CartWorlds.clear(T, x, z, 4) || !taken.every(q => Math.hypot(q[0] - x, q[1] - z) > q[2] + 2)) continue; CartKit.put(E, 'wrd_grass', x, z, rng() * TAU, ['#8ab84a', '#a8c45a', '#6a9a3a'][i % 3], { scale: 1 + rng() * 0.8, noLights: true }); }
  for (let s = 20, k = 0; s < T.L; s += 26, k++) { const sd = k % 2 ? 1 : -1, p = side(s, sd, 6 + (k % 3) * 3); if (!CartWorlds.clear(T, p.x, p.z, 3) || !taken.every(q => Math.hypot(q[0] - p.x, q[1] - p.z) > q[2] + 3)) continue; if (p.z < wrdShoreZ(p.x) + 3 || p.x < wrdShoreXW(p.z) + 3) continue; CartKit.put(E, k % 3 ? 'wrd_grass' : 'wrd_rock', p.x, p.z, k, k % 3 ? '#8ab84a' : '#8a8580', { scale: k % 3 ? 1.5 : 0.9 }); }
  // gift rows, boost pads (one each side of the blowholes: the lines that dodge them pay), the grid
  const f = s => (((s % T.L) + T.L) % T.L) / T.L;
  CartKit.gifts(E, T, [f(S.wave + 75), f(sOf(180, 66)), f(S.dune), f(S.gull + 60)]);
  CartKit.boosts(E, T, [[f(S.blow + 46), 0.6], [f(S.blow + 46), -0.6], [f(S.rocks + 48), 0], [f(S.gull - 52), 0.35]]);
  CartKit.grid(E, T);
  return CartKit.finish(E);
}
// the centre line: white dashes with a little blue wave curl between them
function wrdPaintCenter(ctx, P, S, T) {
  for (let s = 0; s < T.L; s += 9) {
    const g = T.at(s, {}), a = P(g.x - g.tx * 1.8, g.z - g.tz * 1.8), b = P(g.x + g.tx * 1.8, g.z + g.tz * 1.8);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.35 * S; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    const c = P(g.x + g.tx * 4.5, g.z + g.tz * 4.5); ctx.strokeStyle = 'rgba(90,180,255,0.75)'; ctx.lineWidth = 0.28 * S; ctx.beginPath(); ctx.arc(c[0], c[1], 0.55 * S, 0, Math.PI * 1.5); ctx.stroke();
  }
}

/* ---------------- the moving things (one pooled group) ---------------- */
const WrdMesh = {
  whale(m) { wrdWhale(m, '#2a6ad8', '#bfe8ff', false); },
  rock(m) { wrdRock(m, false); },
  // a seagull's body (facing +z): white, a grey back, a yellow beak with a red spot, beady eyes, pink feet tucked up
  gull(m) {
    m.color('#ffffff').shine(2); m.ellipsoid(0, 0, 0, 0.42, 0.4, 0.95, { seg: 12, rings: 8 }); m.ball(0, 0.25, 0.8, 0.32, { seg: 10, rings: 8 });
    m.color('#9aa4b0'); m.ellipsoid(0, 0.2, -0.1, 0.36, 0.22, 0.8, { seg: 10, rings: 6, phi1: Math.PI * 0.5 });
    m.limb(0, 0.05, -0.8, 0, 0.1, -1.3, 0.26, 0.12, { seg: 8 }); m.color('#2a2a30'); m.limb(0, 0.1, -1.25, 0, 0.12, -1.45, 0.13, 0.06, { seg: 6 });
    m.color('#ffd23a').shine(3); m.limb(0, 0.2, 1.05, 0, 0.12, 1.5, 0.1, 0.04, { seg: 6 }); m.color('#ff3a3a'); m.ball(0, 0.13, 1.35, 0.05, { seg: 4, rings: 3 });
    m.color('#101010'); for (const sd of [-1, 1]) m.ball(sd * 0.2, 0.36, 0.95, 0.06, { seg: 6, rings: 4 });
    m.color('#ff9a8a'); for (const sd of [-1, 1]) m.limb(sd * 0.15, -0.3, -0.3, sd * 0.15, -0.35, -0.75, 0.05, 0.03, { seg: 4 });
    m.shine(0);
  },
  // one wing, reaching out along +x (sd = -1 builds the left one): white, grey on top, black tips
  wing(m, sd) {
    m.color('#ffffff').shine(1); m.push(); m.tf(sd * 0.9, 0.05, 0, 0, 0, 0, 1, 1, 1); m.ellipsoid(0, 0, 0, 0.75, 0.07, 0.42, { seg: 10, rings: 5 }); m.pop();
    m.color('#9aa4b0'); m.push(); m.tf(sd * 0.95, 0.09, 0.05, 0, 0, 0, 1, 1, 1); m.ellipsoid(0, 0, 0, 0.68, 0.04, 0.32, { seg: 10, rings: 4 }); m.pop();
    m.color('#ffffff'); m.push(); m.tf(sd * 2.0, 0.05, -0.15, sd * 0.25, 0, 0, 1, 1, 1); m.ellipsoid(0, 0, 0, 0.6, 0.05, 0.3, { seg: 10, rings: 4 }); m.pop();
    m.color('#1a1a20'); m.push(); m.tf(sd * 2.55, 0.05, -0.3, sd * 0.45, 0, 0, 1, 1, 1); m.ellipsoid(0, 0, 0, 0.32, 0.04, 0.17, { seg: 8, rings: 4 }); m.pop();
    m.shine(0);
  }
};

/* ---------------- the rules: hazards at run time ---------------- */
const WRD_WAVE = { period: 7.2, warn: 1.6, wash: 1.25, half: 7, band: 2.4, push: 10 };
const WRD_BLOW = { period: 5.6, warn: 1.3, erupt: 0.9, r: 3.2, vy: 12 };
const WRD_ROCK = { period: 10, rise: 1.2, up: 2.8, sink: 0.8, r: 2.3, depth: 2.6 };   // each set is out 4.8 s of 10: the sets never overlap
const WRD_GULL = { n: 3, lock: 1.4, dive: 0.55, away: 1.3, r: 3.1, cool: [2.5, 4.5], y: 16 };
const WRD_WHALE = { period: 17, x: 110, z: -205, scale: 7 };
CART_TRACK_RULES.whaleroad = {
  onLoad(s) {
    const E = s.E, B = E.wrd;
    const G = CartKit.group(s, [['whale', WrdMesh.whale, 1], ['rocks', WrdMesh.rock, 4], ['gulls', WrdMesh.gull, WRD_GULL.n], ['wingsR', m => WrdMesh.wing(m, 1), WRD_GULL.n], ['wingsL', m => WrdMesh.wing(m, -1), WRD_GULL.n]]);
    const L = s.wrd = { G, rng: mulberry32(5150), waves: [], vents: [], rocks: [], gulls: [], whale: { st: 'under', u: 0, x: WRD_WHALE.x, z: WRD_WHALE.z, obj: G.whale[0] }, feather: 0, splash: 0, said: {}, hintT: -9 };
    B.waves.forEach((q, i) => L.waves.push(Object.assign({}, q, { off: i * 2.4, st: 'calm', u: 0, c: -1, front: 0, mask: 0 })));
    B.vents.forEach((q, i) => L.vents.push(Object.assign({}, q, { off: (i * 0.93 + (i % 2) * 2.8) % WRD_BLOW.period, st: 'calm', u: 0, c: -1, mask: 0 })));
    B.rocks.forEach((q, i) => L.rocks.push(Object.assign({}, q, { off: (i % 2) * WRD_ROCK.period / 2 + (i >> 1) * 0.4, st: 'down', u: 0, c: -1, mask: 0, h: 0, obj: G.rocks[i] })));
    const T = s.T, S = B.S;
    for (let i = 0; i < WRD_GULL.n; i++) { const hs = S.gull + (i - 1) * 46, g = T.at(((hs % T.L) + T.L) % T.L, {}); L.gulls.push({ i, hs, hx: g.x, hz: g.z, st: 'circle', t: 0, cool: 3 + i * 1.7, a: i * 2.1, x: g.x, y: WRD_GULL.y, z: g.z, yaw: 0, pitch: 0, flap: 0, tx: 0, tz: 0, sx: 0, sy: 0, sz: 0, tgt: null, body: G.gulls[i], wr: G.wingsR[i], wl: G.wingsL[i] }); }
    CartKit.state(s);
  },
  onUpdate(s, dt, racing) {
    const L = s.wrd; if (!L) return;
    wrdWaves(s, L, dt, racing); wrdVents(s, L, dt, racing); wrdRocks(s, L, dt, racing); wrdGulls(s, L, dt, racing); wrdWhaleUpdate(s, L, dt);
    if (L.feather > 0) L.feather = Math.max(0, L.feather - dt);
    if (L.splash > 0) L.splash = Math.max(0, L.splash - dt);
  },
  // the AI: hop a wave crest it can't avoid, ease off for a blowhole about to blow under it, swerve off a gull's
  // target (all by skill; the rest is cartIxObs steering round bubbling vents and standing rocks)
  onStep(s, k, dt, racing) {
    const L = s.wrd; if (!L || k.player && !s.autoDrive || !racing || !s.T || k.out) return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9, luck = ((k.slot * 7 + Math.floor(s.time * 0.5)) % 10) / 10, good = luck < 0.45 + (sk - 0.85) * 3;
    if (!good) return;
    for (const w of L.waves) {
      if (w.st !== 'wash') continue;
      const ds = CartKit.ahead(s, k, w.s); if (Math.abs(ds) > WRD_WAVE.half + 6) continue;
      const fd = w.front - k.loc.d; if (Math.abs(fd) < 4.5 && fd * w.sea >= -1 && !k.air) { I.driftPress = true; I.drift = false; return; }
    }
    for (const v of L.vents) {
      if (v.st === 'calm' && v.u < 0.85) continue;
      const ds = CartKit.ahead(s, k, v.s); if (ds < 1 || ds > 30) continue;
      if (Math.abs(v.d - k.loc.d) < WRD_BLOW.r + 1.5) { const ta = ds / Math.max(6, k.speed), left = v.st === 'warn' ? (1 - v.u) * WRD_BLOW.warn : v.st === 'erupt' ? 0 : 99; if (ta > left - 0.2 && ta < left + WRD_BLOW.erupt + 0.2 && k.speed > 12) { I.gas = 0; if (k.speed > 20) I.brake = 0.4; } return; }
    }
    for (const g of L.gulls) {
      if (g.st !== 'lock' || g.tgt !== k) continue;
      const dx = g.tx - k.x, dz = g.tz - k.z, fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), side = dx * fz - dz * fx;
      if (dx * fx + dz * fz > -2) I.steer = clamp(I.steer + (side > 0 ? 0.7 : -0.7), -1, 1);
    }
  },
  draw(s, R, S, t) { const L = s.wrd; if (L) wrdDraw(s, L, R, S, t); },
  lights(s, add) { const L = s.wrd; if (!L) return; for (const v of L.vents) if (v.st === 'erupt' && CartKit.near(s, v.x, v.z, 120)) add(v.x, 4, v.z, 12, WRD_C.aqua, 0.6, 1); },
  hud(s, ctx, W, H, top, left) {
    const L = s.wrd, p = s.player; if (!L || !p) return;
    // gulled: feathers tumbling across the screen
    if (L.feather > 0) {
      const a = Math.min(1, L.feather * 1.4), tt = s.time; ctx.save();
      for (let i = 0; i < 26; i++) { const u = (i * 0.618 + tt * (0.5 + (i % 5) * 0.1)) % 1, x = ((i * 137) % 100) / 100 * W + Math.sin(tt * 3 + i) * 30, y = u * (H + 60) - 30, r = 16 + (i % 4) * 8;
        ctx.globalAlpha = a * 0.9; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(tt * 4 + i) * 0.9 + i); ctx.fillStyle = i % 4 ? '#ffffff' : '#9aa4b0'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.32, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(120,130,140,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-r * 1.1, 0); ctx.lineTo(r, 0); ctx.stroke(); ctx.restore(); }
      ctx.restore();
    }
    // washed: spray across the bottom of the screen
    if (L.splash > 0) {
      const a = Math.min(1, L.splash * 1.5); ctx.save(); ctx.fillStyle = `rgba(150,210,240,${0.18 * a})`; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 30; i++) { const x = ((i * 89) % 100) / 100 * W, y = H - ((i * 0.37 + s.time * 0.6) % 1) * H * 0.6; ctx.globalAlpha = a * 0.8; ctx.fillStyle = i % 3 ? 'rgba(230,248,255,0.9)' : 'rgba(150,210,255,0.9)'; ctx.beginPath(); ctx.arc(x, y, 3 + (i % 4) * 2, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // first-lap hints as each hazard comes up
    if (s.state === 'race' && s.T && p.lap <= 1) for (const h of WRD_HINTS) {
      if (L.said[h[0]]) continue; const ds = CartKit.ds(s.T, p.loc.s, s.E.wrd.S[h[1]] + h[2]);
      if (ds > 0 && ds < 70) { L.said[h[0]] = true; L.hintT = s.time; s.banner(h[3], '#1e6ad8', 2.0, h[4]); }
    }
  }
};
// [key, spot, offset, title, how]
const WRD_HINTS = [['wave', 'wave', -32, 'WAVE WASH!', 'hop the wave or pass while it\'s calm'], ['blow', 'blow', -40, 'BLOWHOLE POINT!', 'steer off the bubbling rings'], ['rocks', 'rocks', -40, 'BARNACLE NARROWS!', 'weave round the rocks that are up'], ['gull', 'gull', -46, 'GULL ALLEY!', 'swerve off the gull\'s target']];
const wrdBanner = (s, L, k, text, sub) => { if (k.player && !(s.time - L.hintT < 2.3)) s.banner(text, '#ffd23a', 1.0, sub, true); };

// ---- the wave washes: calm; the sea draws back (warning); a wave rolls over the road from the sea side ----
function wrdWaves(s, L, dt, racing) {
  const C = WRD_WAVE, calm = C.period - C.warn - C.wash;
  for (const w of L.waves) {
    const tt = s.time + w.off, c = Math.floor(tt / C.period), ph = tt - c * C.period;
    w.st = ph < calm ? 'calm' : ph < calm + C.warn ? 'warn' : 'wash'; w.u = w.st === 'calm' ? ph / calm : w.st === 'warn' ? (ph - calm) / C.warn : (ph - calm - C.warn) / C.wash;
    const near = (w.sea > 0 ? w.wr : w.wl) + 8, far = (w.sea > 0 ? w.wl : w.wr) + 3;
    w.front = w.sea * lerp(near, -far, w.st === 'wash' ? w.u : 0);
    if (w.st === 'wash' && w.c !== c) { w.c = c; w.mask = 0; CartKit.fired(s, 'wave'); if (CartKit.near(s, w.x, w.z, 80)) { cartIxSound(s, 'splash', w.x, w.z, 0.9, 0.55); cartIxSound(s, 'wind', w.x, w.z, 0.5, 0.7); } }
    if (w.st === 'warn' && w.u > 0.5 && w.c !== c && CartKit.near(s, w.x, w.z, 70) && !w.hissed) { w.hissed = true; cartIxSound(s, 'swell', w.x, w.z, 0.5, 0.8); }
    if (w.st === 'calm') w.hissed = false;
    if (w.st !== 'wash' || !racing) continue;
    for (const k of s.karts) {
      if (k.out || (w.mask & (1 << k.slot))) continue;
      const ds = CartKit.ds(s.T, w.s, k.loc.s); if (Math.abs(ds) > C.half + 1.2) continue;
      if (Math.abs(k.loc.d - w.front) > C.band) continue;
      w.mask |= 1 << k.slot;
      if (k.air && k.y > s.terrain.height(k.x, k.z) + 0.25) { if (k.player) wrdBanner(s, L, k, 'RODE THE WAVE!', null); continue; }   // hopped the crest
      if (k.shieldT > 0) continue;
      k.vx += -w.sea * w.nx * C.push; k.vz += -w.sea * w.nz * C.push; k.slowT = Math.max(k.slowT, 0.9);
      if (k.player) { L.splash = 1.0; s.shakeIt(0.4); }
      CartKit.touch(s, k, 'wave', 'WASHED!', '#7ad8f0');
      if (s.fx && CartKit.near(s, k.x, k.z, 90)) s.fx.burst(k.x, k.y + 0.8, k.z, 'drop', 10, '#bfe8ff');
    }
  }
}
// ---- the blowholes: calm; bubble and hiss (warning); erupt and launch anything on them ----
function wrdVents(s, L, dt, racing) {
  const C = WRD_BLOW, calm = C.period - C.warn - C.erupt;
  for (const v of L.vents) {
    const tt = s.time + v.off, c = Math.floor(tt / C.period), ph = tt - c * C.period;
    v.st = ph < calm ? 'calm' : ph < calm + C.warn ? 'warn' : 'erupt'; v.u = v.st === 'calm' ? ph / calm : v.st === 'warn' ? (ph - calm) / C.warn : (ph - calm - C.warn) / C.erupt;
    if (v.st === 'warn' && v.wc !== c) { v.wc = c; if (CartKit.near(s, v.x, v.z, 60)) cartIxSound(s, 'cartBubble', v.x, v.z, 0.5, 0.5); }
    if (v.st === 'erupt' && v.c !== c) { v.c = c; v.mask = 0; CartKit.fired(s, 'blowhole'); if (CartKit.near(s, v.x, v.z, 90)) { cartIxSound(s, 'cartGeyser', v.x, v.z, 0.9, 0.9); if (CartKit.near(s, v.x, v.z, 30)) s.shakeIt(0.5); } }
    if (v.st === 'erupt' || (v.st === 'warn' && v.u > 0.35)) cartIxObs(s, v.x, v.z, C.r + 0.8);
    if (v.st !== 'erupt' || !racing || v.u > 0.8) continue;
    for (const k of s.karts) {
      if (k.out || (v.mask & (1 << k.slot))) continue;
      if ((k.x - v.x) ** 2 + (k.z - v.z) ** 2 > C.r * C.r) continue;
      v.mask |= 1 << k.slot;
      if (CartKit.hit(s, k, 'launch', 'blowhole', { vy: C.vy, dx: v.tx, dz: v.tz, power: 6, banner: 'BLOWHOLE!' })) { if (s.fx) s.fx.burst(k.x, k.y + 0.5, k.z, 'drop', 16, '#d8f4ff'); }
    }
  }
}
// ---- the barnacle rocks: down in their pools; rise (warning); stand; sink. Two sets take turns ----
function wrdRocks(s, L, dt, racing) {
  const C = WRD_ROCK, down = C.period - C.rise - C.up - C.sink;
  for (const r of L.rocks) {
    const tt = s.time + r.off, c = Math.floor(tt / C.period), ph = tt - c * C.period;
    r.st = ph < down ? 'down' : ph < down + C.rise ? 'rise' : ph < down + C.rise + C.up ? 'up' : 'sink';
    r.u = r.st === 'down' ? ph / down : r.st === 'rise' ? (ph - down) / C.rise : r.st === 'up' ? (ph - down - C.rise) / C.up : (ph - down - C.rise - C.up) / C.sink;
    r.h = r.st === 'rise' ? r.u * r.u * (3 - 2 * r.u) : r.st === 'up' ? 1 : r.st === 'sink' ? 1 - r.u : 0;
    if (r.st === 'rise' && r.c !== c) { r.c = c; r.mask = 0; CartKit.fired(s, 'barnacle'); if (CartKit.near(s, r.x, r.z, 60)) { cartIxSound(s, 'splash', r.x, r.z, 0.5, 1.2); cartIxSound(s, 'crumble', r.x, r.z, 0.4, 0.7); } }
    if (r.st === 'up' || (r.st === 'rise' && r.u > 0.3) || (r.st === 'sink' && r.u < 0.5)) cartIxObs(s, r.x, r.z, C.r + 2.2);
    if (r.h > 0.45 && racing) for (const k of s.karts) {
      if (k.out || (k.air && k.y > s.terrain.height(k.x, k.z) + 2 * r.h)) continue;
      const dx = k.x - r.x, dz = k.z - r.z, D = Math.hypot(dx, dz), m = C.r + 1.1; if (D > m) continue;
      const nx = dx / (D || 1), nz = dz / (D || 1), vn = k.vx * nx + k.vz * nz;
      k.x = r.x + nx * m; k.z = r.z + nz * m; if (vn < 0) { k.vx -= 1.5 * vn * nx; k.vz -= 1.5 * vn * nz; }
      if (k.speed < 5) { k.vx += r.tx * 5; k.vz += r.tz * 5; }   // never pinned: a stalled car is slid on past the rock
      if (!(r.mask & (1 << k.slot)) && r.st !== 'rise' && vn < -2) { r.mask |= 1 << k.slot; if (CartKit.hit(s, k, 'spin', 'barnacle', { dur: 0.85, banner: 'BARNACLED!' })) { cartIxSound(s, 'bump', k.x, k.z, 0.9, 0.7); if (s.fx) s.fx.spark(k.x, k.y + 0.8, k.z, 8, '#ffffff', 5); } }
    }
    const o = r.obj; if (o) { const on = r.h > 0.01, shake = r.st === 'rise' ? Math.sin(s.time * 38) * 0.06 : 0; o.live = on; o.visible = on; o.x = r.x + shake; o.z = r.z; o.y = -C.depth * (1 - r.h) - 0.15; o.yaw = r.yaw; o.pitch = 0; o.roll = shake; o.scale = 1; }
  }
}
// ---- the gulls: circle; pick a car and hover over where it's heading (warning); dive; flap away ----
function wrdGulls(s, L, dt, racing) {
  const C = WRD_GULL, T = s.T;
  for (const g of L.gulls) {
    g.t += dt; if (g.cool > 0) g.cool -= dt;
    let wantX = g.x, wantY = C.y, wantZ = g.z, flapK = 1;
    if (g.st === 'circle') {
      g.a += dt * 0.55; wantX = g.hx + Math.cos(g.a) * 16; wantZ = g.hz + Math.sin(g.a) * 16; wantY = C.y + Math.sin(g.a * 2) * 1.5;
      if (racing && g.cool <= 0 && s.state === 'race') {
        // the car about to pass underneath (approaching, not already a gull's target)
        let best = null, bd = 1e9;
        for (const k of s.karts) { if (k.out || k.finished || k.speed < 8) continue; const ds = CartKit.ahead(s, k, g.hs); if (ds < 22 || ds > 70) continue; let busy = false; for (const o of L.gulls) if (o !== g && o.tgt === k && o.st !== 'circle') busy = true; if (busy) continue; const sc = ds + (k.player ? -8 : 0) + L.rng() * 20; if (sc < bd) { bd = sc; best = k; } }
        if (best) {
          // where it'll be when the gull lands: along the course at its speed, same lane
          const lead = C.lock + C.dive, sv = best.loc.s + best.speed * lead, gg = T.at(((sv % T.L) + T.L) % T.L, WRD_T.at), d = clamp(best.loc.d, -gg.hw + 1.5, gg.hw - 1.5);
          g.tx = gg.x + gg.nx * d; g.tz = gg.z + gg.nz * d; g.tgt = best; g.st = 'lock'; g.t = 0;
          if (CartKit.near(s, g.x, g.z, 70)) cartIxSound(s, 'cartQuack', g.x, g.z, 0.8, 1.9);
          if (best.player) wrdBanner(s, L, best, 'SEAGULL!', 'swerve off the target');
        } else g.cool = 0.5;
      }
    } else if (g.st === 'lock') {
      wantX = g.tx - Math.sin(g.yaw) * 6; wantZ = g.tz - Math.cos(g.yaw) * 6; wantY = C.y + 2; flapK = 1.6;
      if (g.t > 0.7 && Math.floor(g.t * 3) !== Math.floor((g.t - dt) * 3) && CartKit.near(s, g.x, g.z, 60)) cartIxSound(s, 'cartQuack', g.x, g.z, 0.5, 2.1);
      if (g.t > C.lock) { g.st = 'dive'; g.t = 0; g.sx = g.x; g.sy = g.y; g.sz = g.z; }
    } else if (g.st === 'dive') {
      const u = Math.min(1, g.t / C.dive), e = u * u;
      g.x = lerp(g.sx, g.tx, u); g.z = lerp(g.sz, g.tz, u); g.y = lerp(g.sy, 1.6, e); flapK = 0;
      if (u >= 1) {
        g.st = 'away'; g.t = 0; CartKit.fired(s, 'gull');
        if (racing) for (const k of s.karts) {
          if (k.out || k.y > s.terrain.height(k.x, k.z) + 3) continue;
          if ((k.x - g.tx) ** 2 + (k.z - g.tz) ** 2 > C.r * C.r) continue;
          if (k.shieldT > 0) { k.shieldT = 0; k.invT = 0.8; continue; }
          const took = k.item && !(k.roul > 0); if (took) k.item = null;
          k.slowT = Math.max(k.slowT, 0.9); k.yaw = cartWrap(k.yaw + (L.rng() - 0.5) * 0.35); k.vx *= 0.85; k.vz *= 0.85;
          if (k.player) { L.feather = 1.5; Sound.play('cartQuack', { vol: 0.9, pitch: 1.8 }); }
          CartKit.touch(s, k, 'gull', took ? 'SEAGULL! IT TOOK YOUR ITEM' : 'SEAGULL!', '#ffffff');
          if (s.fx && CartKit.near(s, k.x, k.z, 90)) s.fx.burst(k.x, k.y + 1.6, k.z, 'puff', 10, '#ffffff');
        }
        if (s.fx && CartKit.near(s, g.tx, g.tz, 90)) s.fx.dust(g.tx, 0.4, g.tz, 6, '#ffffff');
      }
    } else if (g.st === 'away') {
      wantX = g.x + Math.sin(g.yaw) * 20; wantZ = g.z + Math.cos(g.yaw) * 20; wantY = C.y + 4; flapK = 2;
      if (g.t > C.away) { g.st = 'circle'; g.t = 0; g.tgt = null; g.cool = lerp(C.cool[0], C.cool[1], L.rng()); g.a = Math.atan2(g.z - g.hz, g.x - g.hx); }
    }
    if (g.st !== 'dive') {
      // fly toward the wanted point: turn, climb, glide
      const dx = wantX - g.x, dz = wantZ - g.z, want = Math.atan2(dx, dz), D = Math.hypot(dx, dz), sp = g.st === 'lock' ? Math.min(30, D * 2.5) : g.st === 'away' ? 18 : 14;
      g.yaw = g.yaw + cartWrap(want - g.yaw) * Math.min(1, dt * 3); g.x += Math.sin(g.yaw) * sp * dt * (D > 0.5 ? 1 : 0); g.z += Math.cos(g.yaw) * sp * dt * (D > 0.5 ? 1 : 0); g.y += (wantY - g.y) * Math.min(1, dt * 2);
      g.pitch = g.st === 'away' ? -0.35 : 0;
    } else { g.yaw = Math.atan2(g.tx - g.sx, g.tz - g.sz); g.pitch = 0.6; }
    g.flap = flapK ? Math.sin(s.time * (8 + flapK * 3) + g.i) * 0.55 * Math.min(1, flapK) : 0;
    const fold = g.st === 'dive' ? 0.9 : 0, B = g.body;
    if (B) { B.live = true; B.visible = true; B.x = g.x; B.y = g.y; B.z = g.z; B.yaw = g.yaw; B.pitch = g.pitch; B.roll = 0; B.scale = 1.8; }
    wrdWing(g.wr, g, 1, fold); wrdWing(g.wl, g, -1, fold);
  }
}
function wrdWing(o, g, sd, fold) { if (!o) return; o.live = true; o.visible = true; o.x = g.x; o.y = g.y + 0.2; o.z = g.z; o.yaw = g.yaw; o.pitch = g.pitch; o.roll = -sd * (g.flap + fold); o.scale = 1.8; }
// ---- the whale in the bay: swims with its back showing, spouts, dives, BREACHES, splashes (scenery) ----
function wrdWhaleUpdate(s, L, dt) {
  const C = WRD_WHALE, W = L.whale, ph = (s.time + 3) % C.period;
  W.st = ph < 5 ? 'swim' : ph < 7 ? 'dive' : ph < 10.2 ? 'breach' : ph < 11.4 ? 'splash' : 'under';
  W.u = W.st === 'swim' ? ph / 5 : W.st === 'dive' ? (ph - 5) / 2 : W.st === 'breach' ? (ph - 7) / 3.2 : W.st === 'splash' ? (ph - 10.2) / 1.2 : (ph - 11.4) / (C.period - 11.4);
  let y = -20, pitch = 0, roll = 0, x = C.x, z = C.z, yaw = -Math.PI / 2 + 0.3;
  if (W.st === 'swim') { y = -C.scale * 0.45 + Math.sin(W.u * Math.PI * 4) * 0.3; x = C.x + 30 - W.u * 18; }
  else if (W.st === 'dive') { y = -C.scale * 0.45 - W.u * W.u * 14; pitch = W.u * 0.6; x = C.x + 12 - W.u * 6; }
  else if (W.st === 'breach') { const u = W.u; y = -16 + Math.sin(u * Math.PI) * 32; pitch = lerp(-1.25, 1.1, u); roll = Math.sin(u * Math.PI) * 0.5; x = C.x - 8 * u; }
  else if (W.st === 'splash') { y = -6 - W.u * 10; pitch = 1.2; x = C.x - 8; }
  W.x = x; W.z = z; W.y = y;
  if (W.st === 'breach' && W.u < 0.06 && !W.sp1 && s.fx && CartKit.near(s, x, z, 360)) { W.sp1 = true; }
  if (W.st === 'splash' && !W.sp2) { W.sp2 = true; if (CartKit.near(s, x, z, 260)) cartIxSound(s, 'splash', x, z, 1, 0.4); }
  if (W.st === 'under') { W.sp1 = W.sp2 = false; }
  const o = W.obj; if (o) { const on = W.st !== 'under' && y > -18; o.live = on; o.visible = on; o.x = x; o.y = y; o.z = z; o.yaw = yaw; o.pitch = pitch; o.roll = roll; o.scale = C.scale; }
}
// ---- sprites: the wave bands and crests, the vents' rings and jets, the rock pools, the gull targets, the whale's splash, the surf ----
function wrdDraw(s, L, R, S, t) {
  const C = WRD_C, cam = s.cam, T = s.T, near = (x, z, r) => (x - cam.x) ** 2 + (z - cam.z) ** 2 < r * r;
  for (const w of L.waves) {
    if (!near(w.x, w.z, 220)) continue;
    const wid = w.wl + w.wr + 6, cd = (w.wr - w.wl) / 2;
    if (w.st === 'warn') {
      // the road band flashes blue, arrows point inland, the sea pulls back off the beach (a dark wet strip)
      const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 16));
      R.flat.flat(w.x + w.nx * cd, 0.09, w.z + w.nz * cd, wid, WRD_WAVE.half * 2, w.yaw, S.square, C.blue, 0.45 * fl * (0.5 + w.u * 0.5), false);
      for (const sd of [-1, 1]) R.flat.flat(w.x + w.nx * cd + w.tx * sd * WRD_WAVE.half, 0.1, w.z + w.nz * cd + w.tz * sd * WRD_WAVE.half, wid, 0.5, w.yaw, S.square, C.aqua, 0.9 * fl, false);
      for (let i = 0; i < 5; i++) { const u = (i / 5 + t * 1.1) % 1, dd = w.sea * lerp(w.sea > 0 ? w.wr : w.wl, -(w.sea > 0 ? w.wl : w.wr), u); R.flat.flat(w.x + w.nx * dd, 0.11, w.z + w.nz * dd, 4.4, 4.4, Math.atan2(-w.nx * w.sea, -w.nz * w.sea), S.arrow, C.white, 0.9 * fl, false); }
      const bd = w.sea * ((w.sea > 0 ? w.wr : w.wl) + 9 + w.u * 6); R.flat.flat(w.x + w.nx * bd, 0.07, w.z + w.nz * bd, 10, WRD_WAVE.half * 2.6, w.yaw, S.square, C.wet, 0.35, false);
      for (let i = 0; i < 6; i++) { const along = (i / 5 - 0.5) * WRD_WAVE.half * 2, dd = bd + w.sea * 5; R.bbs.bb(w.x + w.tx * along + w.nx * dd, 0.6 + Math.sin(t * 5 + i) * 0.2, w.z + w.tz * along + w.nz * dd, 3, 1.4, S.foam || S.puff, C.foam, 0.7, false, t * 2 + i); }
    } else if (w.st === 'wash') {
      // the wave: a wall of water and foam crossing the road, wet road behind it
      const f = w.front, a = Math.min(1, w.u * 6, (1 - w.u) * 4);
      const wetL = Math.abs((w.sea > 0 ? w.wr + 8 : -(w.wl + 8)) - f), wc = (f + (w.sea > 0 ? w.wr + 8 : -(w.wl + 8))) / 2;
      R.flat.flat(w.x + w.nx * wc, 0.08, w.z + w.nz * wc, wetL, WRD_WAVE.half * 2, w.yaw, S.square, C.deep, 0.3 * a, false);
      R.flat.flat(w.x + w.nx * f, 0.1, w.z + w.nz * f, 4, WRD_WAVE.half * 2 + 2, w.yaw, S.square, C.water, 0.6 * a, false);
      for (let i = 0; i <= 8; i++) { const along = (i / 8 - 0.5) * (WRD_WAVE.half * 2 + 1), x = w.x + w.tx * along + w.nx * f, z = w.z + w.tz * along + w.nz * f, h = 3.2 + Math.sin(t * 9 + i * 1.7) * 0.6;
        R.bbs.bb(x, h * 0.5, z, 4.8, h * 1.5, S.puff, C.water, 0.9 * a, false, t * 3 + i); R.bbs.bb(x + w.nx * w.sea * 1.2, h * 0.35, z + w.nz * w.sea * 1.2, 4.2, h, S.puff, C.sea, 0.8 * a, false, i); R.bbs.bb(x - w.nx * w.sea * 0.6, h + 0.4, z - w.nz * w.sea * 0.6, 4.0, 2.4, S.foam || S.puff, C.foam, 0.95 * a, false, i + t); }
    }
  }
  for (const v of L.vents) {
    if (!near(v.x, v.z, 200)) continue;
    if (v.st === 'warn') {
      // rings close in on the hole, it flashes, mist and bubbles rise
      const fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * (14 + v.u * 14)));
      for (let i = 0; i < 3; i++) { const u = 1 - ((v.u * 1.6 + i / 3) % 1), r = WRD_BLOW.r * (0.6 + u * 1.2); R.flat.flat(v.x, 0.1, v.z, r * 2, r * 2, 0, S.ring, C.aqua, 0.9 * (1 - u * 0.4) * fl, false); }
      R.flat.flat(v.x, 0.09, v.z, WRD_BLOW.r * 2, WRD_BLOW.r * 2, t * 2, S.glow, C.white, 0.35 * fl, true);
      for (let i = 0; i < 4; i++) { const u = (t * 1.3 + i * 0.25) % 1; R.bbs.bb(v.x + Math.sin(i * 2.3 + t) * 0.8, 0.4 + u * 3.5 * v.u, v.z + Math.cos(i * 2.3 + t) * 0.8, 1.2 + u * 1.6, 1.2 + u * 1.6, S.puff, C.mist, 0.6 * (1 - u), false, t + i); }
      R.bbs.bb(v.x, 6 + Math.sin(t * 8) * 0.3, v.z, 2.6, 2.6, S.warn || S.star, C.warn, (0.5 + 0.5 * fl) * Math.min(1, v.u * 3), true);
    } else if (v.st === 'erupt') {
      // the jet: a tall column of water and spray, a ring of splash on the road
      const a = Math.min(1, v.u * 8, (1 - v.u) * 3), h = 16 * Math.min(1, v.u * 5);
      R.bbs.streak(v.x, h / 2, v.z, 0, 1, 0, h, 3.4, S.streak, C.water, 0.85 * a); R.bbs.streak(v.x, h / 2, v.z, 0, 1, 0, h * 0.9, 1.6, S.streak, C.white, 0.9 * a);
      for (let i = 0; i < 6; i++) { const u = (i / 6 + t * 1.5) % 1, ang = i * 1.05 + t; R.bbs.bb(v.x + Math.sin(ang) * u * 2.5, h * (0.3 + u * 0.75), v.z + Math.cos(ang) * u * 2.5, 3.5 + u * 2, 3.5 + u * 2, S.puff, C.foam, 0.8 * a * (1 - u * 0.5), false, t * 2 + i); }
      R.flat.flat(v.x, 0.1, v.z, 10, 10, t * 3, S.ring, C.white, 0.7 * a, false); R.flat.flat(v.x, 0.09, v.z, WRD_BLOW.r * 2.4, WRD_BLOW.r * 2.4, 0, S.square ? S.glow : S.glow, C.aqua, 0.5 * a, true);
      if (s.fx && Math.random() < 0.6 && near(v.x, v.z, 90)) s.fx.add(v.x, h * 0.8, v.z, (Math.random() - 0.5) * 8, 2 + Math.random() * 4, (Math.random() - 0.5) * 8, 1.0, 0.5, 0.2, WRD_C.water, 0.9, 'drop', 0, 0, 0);
    }
  }
  for (const r of L.rocks) {
    if (!near(r.x, r.z, 200)) continue;
    if (r.st === 'down' && r.u > 0.75) { const fl = 0.3 + 0.7 * Math.max(0, Math.sin(t * 12)); R.flat.flat(r.x, 0.1, r.z, WRD_ROCK.r * 2.8, WRD_ROCK.r * 2.8, 0, S.ring, C.warn, 0.7 * fl * (r.u - 0.75) * 4, false); }
    if (r.st === 'rise') {
      // the pool drains in a swirl, a warning ring, bubbles
      const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 18));
      R.flat.flat(r.x, 0.1, r.z, WRD_ROCK.r * 3, WRD_ROCK.r * 3, -t * 4, S.swirl || S.ring, C.water, 0.7 * (1 - r.u * 0.5), false);
      R.flat.flat(r.x, 0.11, r.z, WRD_ROCK.r * 2.8, WRD_ROCK.r * 2.8, 0, S.ring, C.warn, 0.9 * fl, false);
      R.bbs.bb(r.x, 5 + r.h * 2, r.z, 2.4, 2.4, S.warn || S.star, C.warn, 0.8 * fl, true);
    }
    if (r.h > 0.05) R.flat.flat(r.x, 0.09, r.z, 7, 7, t, S.ring, C.white, 0.35 * r.h, false);
  }
  for (const g of L.gulls) {
    if (!near(g.x, g.z, 220)) continue;
    R.flat.flat(g.x, 0.08, g.z, 3 + g.y * 0.1, 3 + g.y * 0.1, 0, S.shadow, C.black, Math.max(0.08, 0.4 - g.y * 0.015), false);
    if (g.st === 'lock' || g.st === 'dive') {
      const u = g.st === 'lock' ? g.t / WRD_GULL.lock : 1, fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * (12 + u * 16))), sz = WRD_GULL.r * 2 * (1.5 - u * 0.5);
      R.flat.flat(g.tx, 0.1, g.tz, sz, sz, t * 2, S.reticle || S.ring, C.red, 0.85 * fl, false);
      R.flat.flat(g.tx, 0.09, g.tz, 1.5 + u * 3, 1.5 + u * 3, 0, S.shadow, C.black, 0.25 + u * 0.4, false);
    }
  }
  const W = L.whale;
  if (near(W.x, W.z, 420)) {
    if (W.st === 'swim' && W.u > 0.3 && W.u < 0.6) { const a = Math.sin((W.u - 0.3) / 0.3 * Math.PI); R.bbs.streak(W.x - 4, 6, W.z, 0, 1, 0, 12 * a, 2.6, S.streak, C.white, 0.8 * a); R.bbs.bb(W.x - 4, 12 * a, W.z, 7 * a, 5 * a, S.puff, C.foam, 0.8 * a, false, t); }
    if (W.st === 'swim') R.flat.flat(W.x, 0.15, W.z, 34, 14, -0.3, S.foam || S.ring, C.white, 0.35, false);
    if (W.st === 'breach' && W.u < 0.35) { const a = 1 - W.u / 0.35; for (let i = 0; i < 8; i++) { const ang = i / 8 * TAU; R.bbs.bb(W.x + Math.sin(ang) * 8, 2 + a * 4, W.z + Math.cos(ang) * 8, 9, 8, S.puff, C.foam, 0.8 * a, false, i); } }
    if (W.st === 'splash' || (W.st === 'under' && W.u < 0.08)) { const u = W.st === 'splash' ? W.u : 1, a = W.st === 'splash' ? 1 - u * 0.5 : 0.5 - W.u * 6; for (let i = 0; i < 12; i++) { const ang = i / 12 * TAU + 0.2; R.bbs.bb(W.x - 8 + Math.sin(ang) * (6 + u * 14), 3 + Math.sin(u * Math.PI) * 14 * (0.6 + (i % 3) * 0.2), W.z + Math.cos(ang) * (6 + u * 14), 12, 12, S.puff, C.foam, 0.85 * a, false, i + t); } R.flat.flat(W.x - 8, 0.15, W.z, 30 + u * 30, 30 + u * 30, t, S.ring, C.white, 0.7 * a, false); }
  }
  // the surf: foam lines running up the beach and back near the camera
  for (let x = Math.floor((cam.x - 140) / 8) * 8; x < cam.x + 140; x += 8) { const z0 = wrdShoreZ(x); if (!near(x, z0, 150)) continue; const u = Math.sin(t * 0.9 + x * 0.04) * 0.5 + 0.5; R.flat.flat(x, 0.06, z0 - 3 + u * 4, 9, 1.6 + u, 0, S.foam || S.puff, C.foam, 0.45 + u * 0.3, false, x); }
  for (let z = Math.floor((cam.z - 140) / 8) * 8; z < cam.z + 140; z += 8) { if (z < -140) continue; const x0 = wrdShoreXW(z); if (!near(x0, z, 150)) continue; const u = Math.sin(t * 0.9 + z * 0.04) * 0.5 + 0.5; R.flat.flat(x0 - 3 + u * 4, 0.06, z, 1.6 + u, 9, 0, S.foam || S.puff, C.foam, 0.45 + u * 0.3, false, z); }
}

if (typeof window !== 'undefined') setTimeout(() => {
  // hazard screenshots (tools/cart_track_test.js reads debug.trackShots.whaleroad) and the level's live state
  const C = window.BRADY_CART; if (!C || !C.debug) return;
  const D = C.debug, NAMES = ['wave-warn', 'wave', 'blow-warn', 'blowhole', 'rocks-rise', 'rocks', 'gull-lock', 'gull-dive', 'whale', 'harbour'];
  D.trackShots = D.trackShots || {};
  D.trackShots.whaleroad = { list: () => NAMES.map(name => ({ name })), shot: name => wrdShot(D, name) };
  D.trackLevel = D.trackLevel || {};
  D.trackLevel.whaleroad = () => {
    const s = Game.scene; if (!s || !s.wrd) return null;
    const K = s.kit || {}, L = s.wrd;
    return { hits: K.hits || {}, touch: K.touch || {}, fired: K.fired || {}, L: s.T ? +s.T.L.toFixed(1) : 0, waves: L.waves.map(w => w.st), vents: L.vents.map(v => v.st), rocks: L.rocks.map(r => r.st), gulls: L.gulls.map(g => g.st), whale: L.whale.st };
  };
}, 0);
function wrdShot(D, name) {
  const STEP = 1 / 60;
  D.start({ mode: 'quick', track: 'whaleroad', car: 'whale', driver: 'brady', seed: 9, autoGas: true });
  const s = D.scene(); s.state = 'race'; s.stateT = 0; window.BRADY.Input.setMode('game'); s.layoutControls(); s.update(STEP);
  const L = s.wrd, T = s.T, P = s.player, B = s.E.wrd;
  let pin = null; const pins = [];
  const park = (sv, lat, speed, frozen) => { const g = T.at(((sv % T.L) + T.L) % T.L, {}); D.place(-1, g.x + g.nx * g.hw * lat, g.z + g.nz * g.hw * lat, g.yaw, { speed: speed || 0, frozen: false }); P.prevS = P.loc.s; P.lap = 1; P.prog = P.loc.s; pin = frozen ? { x: P.x, z: P.z, yaw: P.yaw } : null; };
  const rivals = list => { let j = 0; for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = list[j++] || [-300 - j * 12, 0, 1]; const g = T.at(((P.loc.s + r[0]) % T.L + T.L) % T.L, {}); D.place(i, g.x + g.nx * g.hw * r[1], g.z + g.nz * g.hw * r[1], g.yaw, { speed: r[2] ? 0 : 18, frozen: false }); if (r[2]) pins.push({ k, x: k.x, z: k.z, yaw: k.yaw }); k.prevS = k.loc.s; k.lap = 1; k.prog = k.loc.s; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } k.wpn.t = 99; } };
  s.autoDrive = true; if (!P.ai) s.aiInput(P, STEP, true); P.ai.itemT = 99; P.ai.fireT = 99; P.wpn.t = 99;
  const hold = () => { if (pin) { P.x = pin.x; P.z = pin.z; P.yaw = pin.yaw; P.vx = P.vz = 0; } for (const q of pins) { q.k.x = q.x; q.k.z = q.z; q.k.yaw = q.yaw; q.k.vx = q.k.vz = 0; } };
  const wait = (fn, secs) => { for (let i = 0; i < secs * 60; i++) { s.update(STEP); hold(); if (fn()) return true; } return false; };
  let ok = true;
  if (name === 'wave-warn' || name === 'wave') { const w = L.waves[1]; park(w.s - 24, -0.2 * w.sea, 0, true); rivals([[22, 0.3, 1], [26, -0.4, 1], [-40, 0, 1]]); ok = wait(() => name === 'wave-warn' ? w.st === 'warn' && w.u > 0.6 : w.st === 'wash' && w.u > 0.35 && w.u < 0.6, 12); }
  else if (name === 'blow-warn' || name === 'blowhole') { const v = L.vents[2]; park(v.s - 20, 0, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'blow-warn' ? v.st === 'warn' && v.u > 0.6 : v.st === 'erupt' && v.u > 0.3 && v.u < 0.7, 12); }
  else if (name === 'rocks-rise' || name === 'rocks') { const r = L.rocks[2]; park(r.s - 26, 0, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'rocks-rise' ? r.st === 'rise' && r.u > 0.55 : r.st === 'up' && r.u > 0.3, 16); }
  else if (name === 'gull-lock' || name === 'gull-dive') { const g0 = L.gulls[1]; park(g0.hs - 60, 0.1, 14, false); rivals([[-200, 0, 1]]); for (const g of L.gulls) g.cool = g === g0 ? 0 : 99; ok = wait(() => name === 'gull-lock' ? g0.st === 'lock' && g0.t > 0.8 : g0.st === 'dive' && g0.t > 0.32, 10); if (name === 'gull-lock') pin = { x: P.x, z: P.z, yaw: P.yaw }; }
  else if (name === 'whale') { park(-60, 0.3, 0, true); rivals([[16, 0.4, 1], [24, -0.3, 1]]); ok = wait(() => L.whale.st === 'breach' && L.whale.u > 0.42, 20); }
  else if (name === 'harbour') { park(B.S.gull - 40, 0, 20, false); rivals([[10, 0.3, 0], [16, -0.3, 0], [26, 0, 0]]); wait(() => false, 0.8); }
  s.snapCam = true; for (let i = 0; i < 4; i++) { D.step(1, 1); hold(); }
  return { ok, draws: s.stats.draws, tris: s.stats.tris, hits: (s.kit || {}).hits, p: [+P.x.toFixed(1), +P.z.toFixed(1), +P.loc.s.toFixed(1)] };
}
