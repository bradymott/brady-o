/* ============================================================
   ART CART — SHIPWRECK BAY, Dusty Doubloon's career track (level agent "galleon", Nov 19 2026).
   Recipe: docs/ART_CART_LEVEL_RECIPE.md (Love Parade is the worked example). The sea went out and never came back:
   a bright noon on a bleached, rippled sea bed, a graveyard of old ships half sunk in the silt, coral gone white,
   kelp dried to ribbons. One lap of about 1.1 km, run clockwise in the shape of a fish hook:
     DOUBLOON DRIVE      the start straight, north, past half-buried bows, treasure heaps and a grandstand
     THE BROKEN HULL     a capsized galleon you drive THROUGH: a tunnel of ribs and a keel overhead (boost inside)
     BROADSIDE ALLEY     the east straight under the guns of a sunk man-o'-war: a gun runs out, its fuse fizzes and
                         a scorched lane flashes across the road, then a CANNONBALL skips across and knocks you aside.
                         Pass while it reloads, or ease off and let the ball go by
     THE GALLOWS         two broken masts with a yard across the road and a GIANT ANCHOR swinging from each on its
                         chain, wall to wall. Its shadow and the red sweep on the road show where it is low: time
                         it, or keep to the very edges where it swings high
     THE KRAKEN'S HOOK   a hairpin round the crater where the KRAKEN lives (its eyes peek over the rim). Sand bubbles
                         at a hole by the road, a TENTACLE rears up and the road flashes purple, then it SLAMS across
                         three quarters of the road: be on the far side (the gap), or brake. It lies there a moment:
                         HOP over it or steer round it
     CRAB FLATS          the last straight, past tide pools: giant CRABS scuttle sideways across the road; steer
                         round them (they pinch)
   DUSTY DOUBLOON's ROGUE WAVE is in everyone's gift boxes here (CART_TRACKS.shipwreck.car = 'galleon').
   Its secret arena TREASURE ISLE (43_cart_g_lagoon.js) is a gold sunset cove; this is a white-noon sea bed.
   Start it without the menus: BRADY_CART.debug.start({ mode: 'career', track: 'shipwreck' }) (or mode 'quick').
   Globals are prefixed SWB_ / swb, level state lives on E.swb and s.swb. Everything here is an original design.
   ============================================================ */
const SWB_C = { red: [1, 0.22, 0.12], hot: [1, 0.45, 0.1], gold: [1, 0.8, 0.3], white: [1, 1, 1], black: [0, 0, 0], smoke: [0.85, 0.82, 0.78], purple: [0.75, 0.25, 0.85], ink: [0.35, 0.1, 0.45], sand: [0.88, 0.8, 0.62], warn: [1, 0.3, 0.15], sea: [0.3, 0.75, 0.85], foam: [0.95, 0.97, 1] };
const SWB_T = { at: {}, at2: {} };

/* ---------------- the course ---------------- */
// corners [x, z, radius]: Doubloon Drive (north), the Broken Hull bend, Broadside Alley (east), the Gallows (south-east),
// the Kraken's Hook (a left-hand hairpin round the crater), Crab Flats (west) back to the start
const SWB_POLY = [[-25, -200, 40], [-37, 75, 40], [50, 175, 30], [175, 150, 30], [238, 38, 26], [150, -25, 18], [188, -125, 22], [112, -212, 32]];
const SWB_CRATER = [207, -48];   // the kraken's crater, in the pocket of the hook
const swbWidth = (x, z) => (z < -185 && x > -10 && x < 100 ? 1.1 : 1);   // the crab flats are a touch wider
// registries (assign through the same guards, never redeclare)
var CART_TRACK_RULES = (typeof CART_TRACK_RULES !== 'undefined' && CART_TRACK_RULES) || {};
var CART_CAREER_TRACKS = (typeof CART_CAREER_TRACKS !== 'undefined' && CART_CAREER_TRACKS) || {};
CART_TRACKS.shipwreck = {
  name: 'SHIPWRECK BAY', car: 'galleon', tod: 'day', music: 'kart2', width: 20, shoulder: 6, theme: 'wreck', blurb: 'Broadsides, swinging anchors, the kraken and crab flats',
  get pts() { return this._pts || (this._pts = CartKit.course(SWB_POLY, { start: [-29, -60], width: swbWidth, step: 18 })); },
  world: (id, D) => swbWorld(id, D)
};
CART_CAREER_TRACKS.galleon = 'shipwreck';

/* ---------------- static pieces (merged into the world's chunks) ---------------- */
const SWB_WOOD = '#7a5a3c', SWB_WOOD_D = '#4e3826', SWB_WOOD_L = '#a88a62', SWB_IRON = '#2e2c30', SWB_BRASS = '#d8a84a';
// an old hull, lower half of a stretched egg, planked in bands (length along local x, beam along z), sunk to `sink`
function swbHull(m, L, B, D, sink, col) {
  const bands = 6;
  for (let i = 0; i < bands; i++) { const t0 = i / bands, t1 = (i + 1) / bands; m.color(i % 2 ? col : SWB_WOOD_D).shine(0); m.ellipsoid(0, D - sink, 0, L / 2 * (1 - t0 * 0.08), D * (1 - t0), B / 2 * (1 - t0 * 0.12), { seg: 22, rings: 3, phi0: Math.PI / 2 + t0 * Math.PI / 2, phi1: Math.PI / 2 + t1 * Math.PI / 2 }); }
  // the gunwale: a rail round the top edge
  m.color(SWB_WOOD_L).shine(1); for (let i = 0; i < 24; i++) { const a0 = i / 24 * TAU, a1 = (i + 1) / 24 * TAU; m.limb(Math.cos(a0) * L / 2, D - sink + 0.1, Math.sin(a0) * B / 2, Math.cos(a1) * L / 2, D - sink + 0.1, Math.sin(a1) * B / 2, 0.22, 0.22, { seg: 5, ends: false }); }
  m.shine(0);
}
// a broken mast with a crow's nest and a tattered sail stub (rises along y from the origin)
function swbMast(m, h, sail) {
  m.color(SWB_WOOD).shine(0); m.limb(0, 0, 0, 0, h, 0, 0.42, 0.3, { seg: 8 });
  m.color(SWB_WOOD_D); for (let i = 1; i < 4; i++) m.torus(0, h * i / 4, 0, 0.42 - i * 0.03, 0.07, { seg: 8, tseg: 3 });
  m.color(SWB_WOOD_L); m.cyl(0, h * 0.78, 0, 1.1, 0.9, 0.9, 10); m.color(SWB_WOOD_D); m.torus(0, h * 0.78 + 0.9, 0, 1.0, 0.08, { seg: 10, tseg: 3 });
  if (sail) { m.color('#e8dcc0'); m.push(); m.tf(0, h * 0.55, 0.3); for (let i = 0; i < 4; i++) m.box(0.9 + i * 0.05, -i * 0.9, 0, 1.6 - i * 0.25, 0.85, 0.05); m.pop(); }
  m.shine(0);
}
// the start gate: two masts and a yard over the road, a ragged sail with the name stitched on it hangs from it
function swbGate(m, W) {
  for (const sd of [-1, 1]) { m.push(); m.tf(sd * W / 2, 0, 0); swbMast(m, 17, false); m.pop(); m.color(SWB_WOOD_D); m.roundBox(sd * W / 2, 0.5, 0, 2.0, 1.0, 2.0, 0.3); }
  m.color(SWB_WOOD).shine(0); m.limb(-W / 2 - 1.5, 15.2, 0, W / 2 + 1.5, 15.2, 0, 0.32, 0.32, { seg: 8 });
  // rigging: ropes from the yard ends to the ground
  m.color('#c8b890'); for (const sd of [-1, 1]) { m.limb(sd * (W / 2 + 1.5), 15.2, 0, sd * (W / 2 + 6), 0.2, 3, 0.05, 0.05, { seg: 3, ends: false }); m.limb(sd * (W / 2 + 1.5), 15.2, 0, sd * (W / 2 + 6), 0.2, -3, 0.05, 0.05, { seg: 3, ends: false }); }
  // the sail (two layers, a ragged bottom edge), a skull-and-anchor emblem stitched on the back
  for (let i = 0; i < 9; i++) { const x0 = -6.4 + i * 1.42, drop = 3.6 + Math.sin(i * 2.1) * 0.5; m.color(i % 2 ? '#d8c49a' : '#b8382a'); m.box(x0 + 0.71, 15.0 - drop / 2, 0.15, 1.44, drop, 0.06); }
  m.color('#1a1a1e'); m.ball(0, 13.0, 0.35, 0.75, { seg: 10, rings: 7 }); m.color('#efe4c8'); for (const sx of [-0.26, 0.26]) m.ball(sx, 13.1, 0.95, 0.17, { seg: 6, rings: 4 });
  m.color('#1a1a1e'); m.limb(-1.2, 11.8, 0.3, 1.2, 11.4, 0.3, 0.1, 0.1, { seg: 4 }); m.limb(-1.2, 11.4, 0.3, 1.2, 11.8, 0.3, 0.1, 0.1, { seg: 4 });
  m.shine(0);
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 1.0, y0: 0, y1: 4, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: 1.0, y0: 0, y1: 4, camPass: true }] };
}
// one rib of THE BROKEN HULL (a capsized galleon over the road): an arch of frame timber, the keel along the top
// to the next rib, some hull planks left between them. Local x across, y up, z along the road
function swbRib(m, W, H, k, first, last) {
  const N = 14, P = [];
  for (let i = 0; i <= N; i++) { const a = i / N * Math.PI, c = Math.cos(a), sn = Math.sin(a); P.push([c * W / 2, H * Math.pow(Math.max(0, sn), 0.42)]); }
  m.color(first || last ? SWB_WOOD_D : SWB_WOOD).shine(0);
  const r = first || last ? 0.62 : 0.42;
  for (let i = 0; i < N; i++) m.limb(P[i][0], P[i][1], 0, P[i + 1][0], P[i + 1][1], 0, r, r, { seg: 6, ends: i === 0 || i === N - 1 });
  // the keel to the next rib, and the planks still nailed on (a few missing: light falls through)
  if (!last) {
    m.color(SWB_WOOD_D); m.limb(0, H + 0.3, 0, 0, H + 0.3, 5.5, 0.55, 0.55, { seg: 6 });
    m.color(SWB_WOOD_L);
    for (let i = 1; i < N - 1; i++) { if ((i * 7 + k * 3) % 5 === 0) continue; const a = (P[i][0] + P[i + 1][0]) / 2, b = (P[i][1] + P[i + 1][1]) / 2; if (b < 9.5) continue; const ang = Math.atan2(P[i + 1][1] - P[i][1], P[i + 1][0] - P[i][0]); m.push(); m.tf(a * 1.02, b + 0.1, 2.75, 0, 0, ang); m.box(0, 0.25, 0, Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]) + 0.2, 0.18, 5.4); m.pop(); }
  }
  // barnacles crusting the foot of each rib
  m.color('#e8e4da'); for (const sd of [-1, 1]) for (let j = 0; j < 4; j++) m.ball(sd * W / 2 + Math.sin(j * 2 + k) * 0.5, 0.5 + j * 0.45, Math.cos(j * 3 + k) * 0.4, 0.22, { seg: 5, rings: 3 });
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: r + 0.2, y0: 0, y1: 4, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: r + 0.2, y0: 0, y1: 4, camPass: true }] };
}
// THE MAN-O'-WAR: a big hull sunk in the silt alongside Broadside Alley, three gunports on the side facing the road
// (+z), broken masts, the stern castle with its gallery windows. Gun barrels and cannonballs are pooled objects
function swbManOWar(m, L, gunX) {
  swbHull(m, L, 13, 7.5, 2.6, '#6a4c34');
  // the deck, sloping a little (she settled stern-first)
  m.color(SWB_WOOD_L); m.roundBox(0, 5.0, 0, L * 0.86, 0.3, 11, 0.1, { uv: BURNS_ATLAS.pattern('wood') });
  // the gun deck strake and the gunports facing the road: dark ports with brass lids hinged open
  m.color('#3a2a1e'); m.box(0, 3.1, 6.12, L * 0.82, 1.6, 0.25);
  for (const gx of gunX) { m.color('#0c0a0a'); m.roundBox(gx, 3.1, 6.3, 2.0, 1.6, 0.2, 0.08); m.color('#8a2a1e'); m.push(); m.tf(gx, 4.0, 6.4, 0, -1.1, 0); m.roundBox(0, 0, 0.8, 2.1, 0.12, 1.6, 0.05); m.pop(); m.color(SWB_BRASS).shine(3); m.torus(gx, 3.1, 6.32, 1.05, 0.08, { seg: 14, tseg: 3 }); m.shine(0); }
  // dummy ports (painted) along the rest of the strake
  m.color('#1a1410'); for (let x = -L * 0.38; x < L * 0.38; x += 4.2) if (gunX.every(g => Math.abs(g - x) > 3)) m.box(x, 3.1, 6.26, 1.4, 1.0, 0.1);
  // the stern castle (at -x): a raised cabin with gallery windows and a lantern
  m.color('#5a4030'); m.roundBox(-L * 0.36, 7.4, 0, 7, 4.6, 10, 0.4);
  m.color('#ffd890', 0.5); for (let i = 0; i < 4; i++) m.box(-L * 0.36 - 3.52, 7.6, -3 + i * 2, 0.1, 1.4, 1.2); m.emissive(0);
  m.color(SWB_BRASS).shine(3); m.lathe([[0, 0], [0.5, 0.2], [0.5, 1.0], [0.2, 1.3], [0, 1.4]], { seg: 8 }); m.shine(0);
  // the bowsprit, the masts (broken off), one slumped yard with a torn sail draped over the rail
  m.color(SWB_WOOD); m.limb(L * 0.45, 4.6, 0, L * 0.62, 8.8, 0, 0.42, 0.22, { seg: 7 });
  m.push(); m.tf(L * 0.12, 5, 0, 0, 0, -0.08); swbMast(m, 15, true); m.pop();
  m.push(); m.tf(-L * 0.12, 5, 0, 0, 0, 0.12); swbMast(m, 9, false); m.pop();
  m.color(SWB_WOOD); m.limb(-L * 0.05, 5.2, 6.4, L * 0.25, 12.5, 3.0, 0.22, 0.22, { seg: 6 });
  m.color('#e6d8b8'); m.push(); m.tf(L * 0.1, 8.0, 5.6, 0, 0.3, 0.5); m.box(0, 0, 0, 7, 3.2, 0.06); m.pop();
  // the figurehead: a grinning sea dog with a gold earring
  m.color('#c8a070'); m.push(); m.tf(L * 0.5, 5.4, 0, 0, 0, -0.5); m.ellipsoid(0, 0, 0, 1.0, 1.3, 0.8, { seg: 10, rings: 7 }); m.ball(0.6, 1.0, 0, 0.8, { seg: 10, rings: 7 }); m.color('#1a1410'); for (const sz of [-0.3, 0.3]) m.ball(1.25, 1.2, sz, 0.12, { seg: 5, rings: 3 }); m.color(SWB_BRASS).shine(3); m.torus(0.6, 0.6, 0.78, 0.18, 0.04, { seg: 8, tseg: 3 }); m.shine(0); m.pop();
  return { cols: [{ t: 'box', x: 0, z: 0, hx: L / 2 - 1, hz: 6.4, y0: 0, y1: 9 }] };
}
// a half-buried bow sticking out of the silt at an angle (Doubloon Drive)
function swbBow(m, col) {
  m.push(); m.tf(0, -1.4, 0, 0, 0, 0.55);
  swbHull(m, 22, 7.5, 4.6, 0, col);
  m.color(SWB_WOOD); m.limb(10.5, 4.4, 0, 16, 7.6, 0, 0.3, 0.18, { seg: 6 });
  m.pop();
  // a broken mast lying in the sand beside it
  m.color(SWB_WOOD_D); m.limb(-3, 0.4, 4.5, -14, 0.4, 7.5, 0.4, 0.34, { seg: 7 });
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 9, hz: 3.8, y0: 0, y1: 6 }] };
}
// the gallows: a broken mast either side of the road and a yard across at 16 m (the anchor hangs from its middle)
function swbGallows(m, W) {
  for (const sd of [-1, 1]) { m.push(); m.tf(sd * W / 2, 0, 0, 0, 0, sd * 0.03); swbMast(m, 19, sd > 0); m.pop(); m.color(SWB_WOOD_D); m.roundBox(sd * W / 2, 0.6, 0, 2.4, 1.2, 2.4, 0.35); }
  m.color(SWB_WOOD).shine(0); m.limb(-W / 2 - 1, 16.4, 0, W / 2 + 1, 16.4, 0, 0.45, 0.45, { seg: 8 });
  // the pulley block the chain runs through, iron straps, rigging down to the ground
  m.color(SWB_IRON).shine(2); m.roundBox(0, 15.7, 0, 1.2, 1.0, 1.0, 0.25); m.torus(0, 16.4, 0, 0.6, 0.1, { seg: 10, tseg: 3 }); m.shine(0);
  m.color('#c8b890'); for (const sd of [-1, 1]) for (const z of [-4, 4]) m.limb(sd * W / 2, 18, 0, sd * (W / 2 + 4), 0.2, z, 0.05, 0.05, { seg: 3, ends: false });
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 1.3, y0: 0, y1: 4, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: 1.3, y0: 0, y1: 4, camPass: true }] };
}
// a kraken hole beside the road: a ring of churned sand round a dark pit
function swbHole(m) {
  m.color('#b8a888'); m.lathe([[3.6, 0], [3.0, 0.7], [2.2, 0.55], [1.8, 0.05]], { seg: 16 });
  m.color('#1a1018'); m.disc(0, 0.06, 0, 1.9, 14);
  m.color('#7a2a5a'); for (let i = 0; i < 5; i++) { const a = i * 1.3; m.ball(Math.cos(a) * 2.6, 0.6, Math.sin(a) * 2.6, 0.3 + (i % 2) * 0.1, { seg: 6, rings: 4 }); }   // suckers left on the rim
  return {};
}
// THE KRAKEN in its crater: a great purple head peeking over the rim, two huge eyes, a few coils of arm in the sand
function swbKraken(m) {
  m.color('#b8a888'); m.lathe([[19, 0], [16, 2.6], [13, 3.0], [11, 1.0], [0, 0.4]], { seg: 32 });
  m.color('#7a2a5a').shine(2); m.ellipsoid(0, 3.5, 0, 9, 7, 8, { seg: 20, rings: 12 });
  m.color('#9a3a72'); m.ellipsoid(0, 9.5, -1, 6, 5.2, 6.5, { seg: 16, rings: 10 });
  // pale spots on the head
  m.color('#c86aa0'); for (let i = 0; i < 12; i++) { const a = i * 2.39, h = 0.25 + (i % 4) * 0.15; m.ball(Math.cos(a) * 8.6 * Math.cos(h), 3.5 + Math.sin(h) * 7, Math.sin(a) * 7.6 * Math.cos(h), 0.6, { seg: 6, rings: 4 }); }
  // the eyes (they face +z: put the crater's +z toward the road), gold with black slit pupils, heavy lids
  for (const sx of [-3.6, 3.6]) {
    m.color('#ffe8a0', 0.35).shine(3); m.ball(sx, 6.4, 6.6, 2.0, { seg: 14, rings: 10 }); m.emissive(0);
    m.color('#0e0a10'); m.ellipsoid(sx, 6.4, 8.45, 0.35, 1.5, 0.3, { seg: 8, rings: 5 });
    m.color('#6a2250').shine(1); m.ellipsoid(sx, 7.6, 6.4, 2.3, 1.0, 2.0, { seg: 12, rings: 6, phi1: Math.PI / 2 });
  }
  m.shine(0);
  // coils of arm half buried round the head
  m.color('#7a2a5a'); for (let c = 0; c < 4; c++) { const a0 = c * 1.6 + 0.8; for (let i = 0; i < 6; i++) { const a = a0 + i * 0.22, b = a + 0.22, r0 = 10 + i * 0.6, r1 = 10 + (i + 1) * 0.6; m.limb(Math.cos(a) * r0, 0.6 + Math.sin(i) * 0.4, Math.sin(a) * r0, Math.cos(b) * r1, 0.6 + Math.sin(i + 1) * 0.4, Math.sin(b) * r1, 1.0 - i * 0.12, 0.88 - i * 0.12, { seg: 7 }); } }
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 10, y0: 0, y1: 12 }] };
}
// a giant clam, open, a pearl glowing in it (infield)
function swbClam(m) {
  m.color('#e8d8d0').shine(2);
  for (let i = 0; i < 9; i++) { const a0 = (i / 9 - 0.5) * 2.4, a1 = ((i + 1) / 9 - 0.5) * 2.4; m.push(); m.tf(0, 0.8, 0, 0, 0, 0); m.limb(0, 0, -1, Math.sin(a0) * 7, 0, Math.cos(a0) * 7 - 1, 0.5, 0.9, { seg: 6 }); m.pop(); void a1; }
  m.ellipsoid(0, 0.8, 2.5, 7, 1.4, 4.6, { seg: 18, rings: 6, phi0: Math.PI / 2 });
  m.push(); m.tf(0, 1.4, -1.2, 0, -1.0, 0); m.ellipsoid(0, 0, 3.6, 7, 1.2, 4.6, { seg: 18, rings: 6, phi1: Math.PI / 2 }); m.pop();
  m.color('#f4b8c8'); m.ellipsoid(0, 1.6, 2.0, 5.6, 0.7, 3.4, { seg: 14, rings: 5 });
  m.color('#fff8f0', 0.55).shine(3); m.ball(0, 2.9, 1.6, 1.5, { seg: 14, rings: 10 }); m.emissive(0).shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 1.5, r: 6.5, y0: 0, y1: 4 }] };
}
// a giant ship's wheel half buried, upright (infield landmark)
function swbWheel(m) {
  m.push(); m.tf(0, 5.5, 0, 0, Math.PI / 2, 0);
  m.color(SWB_WOOD).shine(1); m.torus(0, 0, 0, 7, 0.55, { seg: 32, tseg: 6 }); m.color(SWB_WOOD_D); m.torus(0, 0, 0, 5.8, 0.3, { seg: 28, tseg: 4 });
  m.color(SWB_BRASS).shine(3); m.cyl(0, -0.7, 0, 1.4, 1.4, 1.4, 14);
  m.color(SWB_WOOD).shine(1); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, c = Math.cos(a), sn = Math.sin(a); m.limb(c * 1.3, 0, sn * 1.3, c * 9.2, 0, sn * 9.2, 0.32, 0.26, { seg: 6 }); m.ball(c * 9.4, 0, sn * 9.4, 0.5, { seg: 8, rings: 5 }); }
  m.pop(); m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 7.5, hz: 1.2, y0: 0, y1: 12 }] };
}

/* ---------------- instanced props (this world only) ---------------- */
const SWB_KINDS = {
  // bleached branching coral (tinted: white, pink, coral, lilac)
  swb_coral: { r: 2.4, near: 34, mid: 120, farD: 300,
    build(m) {
      m.color('#ffffff').shine(1);
      const br = (x, y, z, a, b, len, r, d) => { const x1 = x + Math.sin(a) * Math.sin(b) * len, y1 = y + Math.cos(b) * len, z1 = z + Math.cos(a) * Math.sin(b) * len; m.limb(x, y, z, x1, y1, z1, r, r * 0.7, { seg: m.lo ? 4 : 6 }); if (d > 0) { br(x1, y1, z1, a + 0.9, b + 0.25, len * 0.72, r * 0.7, d - 1); br(x1, y1, z1, a - 0.9, Math.max(0.05, b - 0.3), len * 0.72, r * 0.7, d - 1); } else m.ball(x1, y1, z1, r * 0.9, { seg: 5, rings: 3 }); };
      for (let i = 0; i < 3; i++) br(Math.sin(i * 2.1) * 0.4, 0, Math.cos(i * 2.1) * 0.4, i * 2.1, 0.35, 1.6, 0.26, 2);
      m.shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.0, y0: 0, y1: 3, camPass: true }] };
    },
    far(m) { m.color('#ffffff'); m.ball(0, 1.6, 0, 1.4, { seg: 6, rings: 4 }); m.ball(0.9, 2.4, 0.3, 0.8, { seg: 5, rings: 3 }); } },
  // a barnacled rock with a starfish on it (tinted grey-blue / sandstone)
  swb_rock: { r: 3, near: 34, mid: 130, farD: 340,
    build(m) {
      m.color('#ffffff').shine(0); m.ellipsoid(0, 0.9, 0, 2.6, 2.0, 2.2, { seg: m.lo ? 8 : 12, rings: m.lo ? 5 : 8 }); m.ellipsoid(1.5, 0.6, 1.0, 1.4, 1.2, 1.3, { seg: 8, rings: 5 });
      m.color('#f4f0e8'); for (let i = 0; i < 9; i++) { const a = i * 2.3, h = 0.3 + (i % 3) * 0.35; m.cyl(Math.cos(a) * 2.3 * Math.cos(h), 0.9 + Math.sin(h) * 1.8, Math.sin(a) * 2.0 * Math.cos(h), 0.2, 0.08, 0.25, 5); }
      m.color('#ff7a4a'); m.push(); m.tf(0.4, 2.75, 0.4, 0.4, -0.2, 0); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; m.limb(0, 0, 0, Math.sin(a) * 0.75, 0, Math.cos(a) * 0.75, 0.16, 0.06, { seg: 4 }); } m.pop();
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.4, y0: 0, y1: 3 }] };
    },
    far(m) { m.color('#ffffff'); m.ellipsoid(0, 0.9, 0, 2.6, 2.0, 2.2, { seg: 6, rings: 4 }); } },
  // dried kelp: brown ribbons drooping off a holdfast (tinted olive / brown)
  swb_kelp: { r: 1.6, near: 30, mid: 100, farD: 240,
    build(m) {
      m.color('#ffffff');
      for (let i = 0; i < 5; i++) { const a = i * 1.26, l = 2.4 + (i % 3) * 0.7; let x = 0, y = 0.2, z = 0; for (let j = 0; j < 4; j++) { const nx = x + Math.sin(a) * 0.35 * (j + 1) * 0.5, ny = y + l / 4 * (1 - j * 0.2), nz = z + Math.cos(a) * 0.35 * (j + 1) * 0.5; m.limb(x, y, z, nx, ny, nz, 0.08, 0.06, { seg: 4 }); m.push(); m.tf(nx, ny, nz, a, 0.6, 0); m.ellipsoid(0, 0, 0.35, 0.05, 0.12, 0.45, { seg: 4, rings: 3 }); m.pop(); x = nx; y = ny; z = nz; } }
      m.color('#d8c8a0'); m.ellipsoid(0, 0.15, 0, 0.5, 0.25, 0.5, { seg: 6, rings: 3 });
      return { cols: [] };
    },
    far(m) { m.color('#ffffff'); m.limb(0, 0, 0, 0, 2.8, 0, 0.4, 0.15, { seg: 4 }); } },
  // a treasure heap: an open chest, gold coins spilling into the sand, a goblet (not tinted)
  swb_chest: { r: 1.8, near: 30, mid: 110, farD: 260,
    build(m) {
      m.color('#7a4a2a').shine(1); m.roundBox(0, 0.55, 0, 2.0, 1.1, 1.3, 0.1); m.color(SWB_BRASS).shine(3); for (const dx of [-0.7, 0.7]) m.roundBox(dx, 0.55, 0, 0.16, 1.15, 1.36, 0.04);
      m.push(); m.tf(0, 1.1, -0.65, 0, -1.25, 0); m.color('#8a5a32').shine(1); m.roundBox(0, 0.22, 0.65, 2.0, 0.44, 1.3, 0.15); m.pop();
      m.color('#ffcc44', 0.12).shine(3); m.ellipsoid(0, 1.1, 0, 0.9, 0.35, 0.55, { seg: 10, rings: 5 });
      for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 1.2 + (i % 4) * 0.35; m.push(); m.tf(Math.cos(a) * r, 0.06, Math.sin(a) * r + 0.6, 0, 0.2 * (i % 3), 0); m.cyl(0, 0, 0, 0.18, 0.18, 0.05, 8); m.pop(); }
      m.color('#ff3a5a', 0.5); m.ball(0.3, 1.4, 0.2, 0.14, { seg: 6, rings: 4 }); m.color('#3affc8', 0.5); m.ball(-0.4, 1.38, 0.1, 0.12, { seg: 6, rings: 4 }); m.emissive(0);
      m.color(SWB_BRASS).shine(3); m.push(); m.tf(1.6, 0, -0.3); m.lathe([[0.22, 0], [0.06, 0.1], [0.05, 0.5], [0.3, 0.65], [0.32, 0.95]], { seg: 10 }); m.pop(); m.shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.0, hz: 0.7, y0: 0, y1: 1.2 }] };
    },
    far(m) { m.color('#7a4a2a'); m.box(0, 0.55, 0, 2, 1.1, 1.3); m.color('#ffcc44'); m.box(0, 1.15, 0, 1.6, 0.3, 1.0); } },
  // a mooring post with a coil of rope and a ring buoy (tinted: the buoy's colour)
  swb_post: { r: 0.8, near: 30, mid: 110, farD: 240, noAO: true,
    build(m) {
      m.color('#8a6a48').shine(0); m.cyl(0, 0, 0, 0.32, 0.28, 2.2, 8); m.color('#5a4030'); m.ball(0, 2.2, 0, 0.3, { seg: 6, rings: 4 });
      m.color('#ffffff').shine(1); m.push(); m.tf(0, 1.3, 0.35, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.5, 0.15, { seg: 12, tseg: 5 }); m.pop();
      m.color('#d8c8a0'); m.torus(0, 0.25, 0, 0.5, 0.1, { seg: 10, tseg: 3 }); m.torus(0, 0.42, 0, 0.45, 0.1, { seg: 10, tseg: 3 }); m.shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.4, y0: 0, y1: 2.2 }] };
    },
    far(m) { m.color('#8a6a48'); m.box(0, 1.1, 0, 0.5, 2.2, 0.5); m.color('#ffffff'); m.box(0, 1.3, 0.35, 1.0, 1.0, 0.2); } }
};

/* ---------------- building the world ---------------- */
function swbWorld(id, D) {
  const sky = Object.assign({}, CART_SKIES.day(), { zen: '#1a64d0', hor: '#bfe8f0', sky: '#6cbcf0', fog: '#8cc4dc', fogD: 0.0017, haze: 0.1, clouds: 0.55, mid: '#5ab0d0', midK: 0.26, key: '#ffeccc', keyK: 1.12, gnd: '#c8b080' });
  const W = CartKit.world(id, D, { worldId: 1231, night: false, sky, ground: '#c4a46c', crack: 0.05,
    road: { shoulder: 'rgba(150,130,100,0.25)', band: 'rgba(122,104,84,0.78)', edge: 'rgba(250,244,226,0.95)', edgeW: 0.6, centerFn: swbPaintCenter } });
  const { E, T, api, rng } = W;
  const sOf = (x, z) => CartKit.sOf(T, x, z), wrap = s => ((s % T.L) + T.L) % T.L;
  const S = { hull: sOf(6, 125), broad: sOf(112, 162.5), gallows: sOf(206.5, 94), krakA: sOf(194, 6.5), krakB: sOf(169, -75), crab: sOf(43, -206) };
  E.swb = { S };
  const side = (s, sd, off) => { const g = T.at(s, {}), o = sd > 0 ? g.wr + off : -g.wl - off; return { x: g.x + g.nx * o, z: g.z + g.nz * o, yaw: Math.atan2(-g.nx * sd, -g.nz * sd), g }; };
  const taken = [];
  // which side of the road a point is on at arc length s (+1 right of travel, -1 left)
  const sideOf = (s, x, z) => { const g = T.at(s, {}); return (x - g.x) * g.nx + (z - g.z) * g.nz > 0 ? 1 : -1; };
  // ---- the hazards' anchor points ----
  // broadside: the man-o'-war on the outside of the alley (the side away from the infield)
  const bsd = -sideOf(S.broad, 100, 60);
  E.swb.guns = [];
  for (let i = 0; i < 3; i++) { const s = S.broad + (i - 1) * 26, g = T.at(s, {}); E.swb.guns.push({ i, s, sd: bsd, x: g.x, z: g.z, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, yaw: g.yaw, hw: g.hw, wl: g.wl, wr: g.wr }); }
  E.swb.anchors = [];
  for (let i = 0; i < 2; i++) { const s = S.gallows + (i ? 24 : -24), g = T.at(s, {}); E.swb.anchors.push({ i, s, x: g.x, z: g.z, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, yaw: g.yaw, hw: g.hw }); }
  E.swb.arms = [];
  for (const [i, s] of [[0, S.krakA], [1, S.krakB]]) { const g = T.at(s, {}), sd = sideOf(s, SWB_CRATER[0], SWB_CRATER[1]), hoff = (sd > 0 ? g.wr : g.wl) + 3.6; E.swb.arms.push({ i, s, sd, bx: g.x + g.nx * sd * hoff, bz: g.z + g.nz * sd * hoff, ux: -g.nx * sd, uz: -g.nz * sd, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, hw: g.hw, hoff, x: g.x, z: g.z }); }
  E.swb.crabs = [];
  for (let i = 0; i < 5; i++) { const s = S.crab + (i - 2) * 13, g = T.at(s, {}); E.swb.crabs.push({ i, s, x: g.x, z: g.z, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, hw: g.hw }); }

  // ---- the sea bed: ripple marks, salt crust, tide pools by the crab flats, the hazards' scars on the road ----
  api.paint((ctx, P, Sc) => {
    const b = T.bounds;
    // ripples: long wavy lines in bands, light crest and a shadow under it
    for (let z = b.z0 - 80; z < b.z1 + 80; z += 3.2) {
      const ph = z * 0.37, x0 = b.x0 - 80, x1 = b.x1 + 80;
      for (const [dz, col] of [[0, 'rgba(255,240,210,0.2)'], [0.7, 'rgba(110,86,56,0.22)']]) { ctx.strokeStyle = col; ctx.lineWidth = 0.45 * Sc; ctx.beginPath(); for (let x = x0; x <= x1; x += 6) { const q = P(x, z + dz + Math.sin(x * 0.06 + ph) * 1.4 + Math.sin(x * 0.17 + ph * 2) * 0.4); if (x === x0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); } ctx.stroke(); }
    }
    // salt crust patches and darker damp silt
    for (let i = 0; i < 260; i++) { const x = b.x0 - 60 + rng() * (b.x1 - b.x0 + 120), z = b.z0 - 60 + rng() * (b.z1 - b.z0 + 120), q = P(x, z); { const u = rng(); ctx.fillStyle = u < 0.3 ? `rgba(250,244,226,${0.08 + rng() * 0.1})` : u < 0.55 ? `rgba(92,84,62,${0.1 + rng() * 0.1})` : u < 0.8 ? `rgba(60,138,112,${0.14 + rng() * 0.12})` : `rgba(214,148,84,${0.14 + rng() * 0.12})`; } ctx.beginPath(); ctx.ellipse(q[0], q[1], (2 + rng() * 9) * Sc, (1 + rng() * 5) * Sc, rng() * 3, 0, TAU); ctx.fill(); }
    // shells and starfish
    for (let i = 0; i < 300; i++) { const x = b.x0 - 40 + rng() * (b.x1 - b.x0 + 80), z = b.z0 - 40 + rng() * (b.z1 - b.z0 + 80); if (!CartWorlds.clear(T, x, z, 1)) continue; const q = P(x, z); if (rng() < 0.6) { ctx.fillStyle = `rgba(255,${230 + Math.floor(rng() * 25)},${215 + Math.floor(rng() * 30)},0.85)`; ctx.beginPath(); ctx.ellipse(q[0], q[1], 0.35 * Sc, 0.28 * Sc, rng() * 3, 0, TAU); ctx.fill(); } else { ctx.fillStyle = rng() < 0.5 ? 'rgba(255,120,70,0.85)' : 'rgba(255,170,60,0.85)'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(rng() * 3); ctx.beginPath(); for (let k = 0; k < 10; k++) { const r = (k % 2 ? 0.22 : 0.6) * Sc, a = k / 10 * TAU; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.restore(); } }
    // tide pools along the crab flats, both sides: teal water, a pale rim
    for (const c of E.swb.crabs) for (const sd of [1, -1]) { const x = c.x + c.nx * sd * (c.hw + 9 + (c.i % 2) * 4), z = c.z + c.nz * sd * (c.hw + 9 + (c.i % 2) * 4), q = P(x, z), r = (4 + (c.i % 3) * 1.5) * Sc; ctx.fillStyle = 'rgba(250,246,230,0.8)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], r * 1.25, r * 0.95, c.i, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(60,150,170,0.85)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], r, r * 0.72, c.i, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(160,230,240,0.5)'; ctx.beginPath(); ctx.ellipse(q[0] - r * 0.25, q[1] - r * 0.2, r * 0.4, r * 0.2, c.i, 0, TAU); ctx.fill(); }
    // the crab flats: little sideways tracks across the road
    for (const c of E.swb.crabs) for (let d = -c.hw; d < c.hw; d += 1.1) for (const a of [-0.5, 0.5]) { const q = P(c.x + c.nx * d + c.tx * a, c.z + c.nz * d + c.tz * a); ctx.fillStyle = 'rgba(70,54,40,0.45)'; ctx.fillRect(q[0] - 0.12 * Sc, q[1] - 0.12 * Sc, 0.24 * Sc, 0.24 * Sc); }
    // broadside: scorched lanes across the road where the balls skip
    for (const gn of E.swb.guns) for (let d = -gn.hw - 2; d < gn.hw + 2; d += 0.8) { const q = P(gn.x + gn.nx * d, gn.z + gn.nz * d), r = (0.9 + Math.abs(Math.sin(d * 1.7)) * 0.7) * Sc; ctx.fillStyle = 'rgba(40,30,26,0.22)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], r, r * 0.8, d, 0, TAU); ctx.fill(); }
    // the gallows: scrape arcs across the road under each anchor
    for (const a of E.swb.anchors) for (const w of [-0.6, 0.6]) { ctx.strokeStyle = 'rgba(80,60,44,0.4)'; ctx.lineWidth = 0.35 * Sc; ctx.beginPath(); for (let d = -a.hw + 1; d <= a.hw - 1; d += 1) { const q = P(a.x + a.nx * d + a.tx * (w + d * d * 0.004), a.z + a.nz * d + a.tz * (w + d * d * 0.004)); if (d === -a.hw + 1) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); } ctx.stroke(); }
    // the kraken's slam lines: a purple-grey drag mark from each hole across the road
    for (const r of E.swb.arms) for (let k = 0; k < 18; k++) { const u = k * 1.0, q = P(r.bx + r.ux * u, r.bz + r.uz * u), w = (1.6 - k * 0.05) * Sc; ctx.fillStyle = 'rgba(110,60,100,0.22)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], w, w * 0.8, 0, 0, TAU); ctx.fill(); }
    // the kraken's crater: dark wet silt round it
    { const q = P(SWB_CRATER[0], SWB_CRATER[1]); const gr = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 30 * Sc); gr.addColorStop(0, 'rgba(70,60,70,0.5)'); gr.addColorStop(1, 'rgba(70,60,70,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(q[0], q[1], 30 * Sc, 0, TAU); ctx.fill(); }
  });
  // ---- barriers: sea-blue and bleached rails, red and white buoy rings on the tight bends; gaps at the crab flats and
  // where the kraken's arms come over ----
  const gaps = [[S.crab, 38]].concat(E.swb.arms.map(r => [r.s, 4]));
  CartDecor.protos(E);
  for (let s = 0; s < T.L; s += 7) {
    if (gaps.some(q => Math.abs(CartKit.ds(T, s, q[0])) < q[1])) continue;
    const g = T.at(s, {}), tight = Math.abs(g.k) > 0.012, i = Math.floor(s / 7);
    for (const sd of [1, -1]) { const off = sd > 0 ? g.wr : -g.wl; CartDecor.put(E, tight ? 'tyres' : 'rail', g.x + g.nx * off, g.z + g.nz * off, g.yaw, tight ? (i % 2 ? '#f4f0ea' : '#e83a2a') : (Math.floor(i / 2) % 2 ? '#e8dcc0' : '#3a7a9a'), { y: 0, noLights: true, k: 1 }); }
  }
  CartKit.kinds(E, SWB_KINDS);
  // mooring posts with ring buoys mark the crab flats' open edges
  for (let s = S.crab - 36; s <= S.crab + 36; s += 9) for (const sd of [1, -1]) { const p = side(s, sd, 0.6); CartKit.put(E, 'swb_post', p.x, p.z, p.yaw, Math.floor(s / 9) % 2 ? '#ff4a3a' : '#ffffff'); }

  // ---- the start: the mast gate with its sail, grandstands, treasure heaps, half-buried bows down the drive ----
  { const g = T.at(0, {}), Wd = g.wl + g.wr + 5;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => swbGate(m, Wd), { hi: true });
    api.sign('SHIPWRECK BAY', g.x - g.tx * 0.5, g.z - g.tz * 0.5, { yaw: g.yaw + Math.PI, h: 2.2, y: 12.9, post: false, maxW: 11, style: { bg: '#efe4c8', fg: '#3a2416', border: '#8a2a1e' } });
    for (const sd of [1, -1]) { const p = side(18, sd, 6); E.spots.push(...CartScene.bleachers(api, p.x, p.z, p.yaw, 22, 3, rng)); taken.push([p.x, p.z, 16]); }
    const heroes = ['burney', 'sparklepony', 'playaartist', 'burnermom', 'furry', 'burnerkid'];
    heroes.forEach((type, i) => { const p = side(-8 + Math.floor(i / 2) * 8, i % 2 ? 1 : -1, 2.4); E.heroes.push({ type, x: p.x, z: p.z, yaw: p.yaw, anim: i % 3 ? 'dance' : 'wave' }); });
  }
  for (const [s, sd, col] of [[60, -1, '#6a4c34'], [110, 1, '#5a5048'], [-55, -1, '#5a4434'], [-105, 1, '#4e5a5a']]) { const p = side(wrap(s), sd, 11); CartScene.mesh(api, p.x, p.z, p.yaw + Math.PI / 2 + sd * 0.4, m => swbBow(m, col), { hi: true }); taken.push([p.x, p.z, 14]); }
  for (let s = -120, k = 0; s < 150; s += 14, k++) for (const sd of [1, -1]) { const p = side(wrap(s), sd, 3.2 + (k % 2) * 1.6); if (taken.some(q => Math.hypot(q[0] - p.x, q[1] - p.z) < q[2] + 1)) continue; CartKit.put(E, k % 3 === 0 ? 'swb_chest' : 'swb_coral', p.x, p.z, p.yaw + (k % 3 - 1) * 0.4, k % 3 === 0 ? '#ffffff' : ['#ffffff', '#ffc8d0', '#ffb08a', '#e0d0ff'][(k + (sd > 0 ? 2 : 0)) % 4], { scale: 1 + (k % 3) * 0.15 }); }
  CartKit.crowd(E, T, wrap(-100), wrap(-30), -1, rng, { rows: 1, off: 8, gap: 2.4 });
  // ---- the Broken Hull: a capsized galleon over the road (ribs every 5.5 m), the boost inside ----
  for (let k = -5; k <= 5; k++) { const g = T.at(S.hull + k * 5.5, {}), Wd = Math.max(g.wl, g.wr) * 2 + 5;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => swbRib(m, Wd, 13.5, k, k === -5, k === 5), { hi: true }); }
  { const g = T.at(S.hull - 32, {}); for (const sd of [1, -1]) { const p = side(S.hull - 32, sd, 1.5); api.sign(sd > 0 ? 'THE BROKEN\nHULL' : 'MIND YOUR\nHEAD', p.x, p.z, { yaw: g.yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.2, style: { bg: '#efe4c8', fg: '#3a2416', border: '#3a2416' } }); } }
  taken.push([T.at(S.hull, {}).x, T.at(S.hull, {}).z, 34]);
  // ---- Broadside Alley: the man-o'-war on the outside ----
  { const g0 = E.swb.guns[1], p = side(g0.s, bsd, 8.8), gunX = E.swb.guns.map(q => -(q.s - g0.s));   // local x runs against the road's direction
    // local +z faces the road; local +x = right of that facing: work out which way the guns sit along the hull
    const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), rx = fz, rz = -fx, along = rx * g0.tx + rz * g0.tz > 0 ? 1 : -1;
    for (let i = 0; i < 3; i++) gunX[i] = (E.swb.guns[i].s - g0.s) * along;
    CartScene.mesh(api, p.x, p.z, p.yaw, m => swbManOWar(m, 74, gunX), { hi: true }); taken.push([p.x, p.z, 40]);
    E.swb.guns.forEach(q => { const pp = side(q.s, bsd, 2.6); q.px = pp.x; q.pz = pp.z; q.pyaw = pp.yaw; });
    const ps = side(g0.s - 46, bsd, 1.5); api.sign('BROADSIDE\nALLEY', ps.x, ps.z, { yaw: T.at(g0.s - 46, {}).yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.2, style: { bg: '#8a2a1e', fg: '#ffe8c0', border: '#ffe8c0' } });
    CartKit.crowd(E, T, g0.s - 40, g0.s + 40, -bsd, rng, { rows: 2, off: 4 }); }
  // ---- the Gallows: two mast pairs with a yard over the road ----
  for (const a of E.swb.anchors) { const g = T.at(a.s, {}), Wd = Math.max(g.wl, g.wr) * 2 + 5; CartScene.mesh(api, g.x, g.z, g.yaw, m => swbGallows(m, Wd), { hi: true }); taken.push([g.x, g.z, 18]); }
  { const g = T.at(S.gallows - 50, {}); for (const sd of [1, -1]) { const p = side(S.gallows - 50, sd, 1.5); api.sign(sd > 0 ? 'THE\nGALLOWS' : 'ANCHORS\nAWEIGH!', p.x, p.z, { yaw: g.yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.2, style: { bg: '#2a4a6a', fg: '#ffffff', border: '#ffffff' } }); } }
  // ---- the Kraken's Hook: the crater with the kraken in it, the holes its arms come out of ----
  { const c = SWB_CRATER, a = E.swb.arms, mx = (a[0].bx + a[1].bx) / 2, mz = (a[0].bz + a[1].bz) / 2;
    CartScene.mesh(api, c[0], c[1], Math.atan2(mx - c[0], mz - c[1]), swbKraken, { hi: true }); taken.push([c[0], c[1], 24]);
    for (const r of a) { CartScene.mesh(api, r.bx, r.bz, 0, swbHole, { hi: true }); taken.push([r.bx, r.bz, 6]); }
    for (const r of a) { const p = side(r.s - 40, r.sd, 1.5); api.sign(r.i ? 'KRAKEN\nCROSSING' : 'HERE BE\nKRAKEN', p.x, p.z, { yaw: T.at(r.s - 40, {}).yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.2, style: { bg: '#5a1a4a', fg: '#ffe0f0', border: '#ffe0f0' } }); } }
  // ---- Crab Flats: signs, rocks and kelp round the tide pools ----
  for (const sd of [1, -1]) { const p = side(S.crab + 46, sd, 1.5); api.sign('CRAB\nFLATS', p.x, p.z, { yaw: T.at(S.crab + 46, {}).yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3, style: { bg: '#ff6a3a', fg: '#ffffff', border: '#ffffff' } }); }
  for (const c of E.swb.crabs) for (const sd of [1, -1]) { const p = side(c.s + 6, sd, 14 + (c.i % 2) * 5); CartKit.put(E, c.i % 2 ? 'swb_rock' : 'swb_kelp', p.x, p.z, c.i, c.i % 2 ? '#c8ccd0' : '#8a7a3a', { scale: 0.8 + (c.i % 3) * 0.2 }); }
  taken.push([T.at(S.crab, {}).x, T.at(S.crab, {}).z, 30]);
  // ---- the infield and beyond: the giant clam, the ship's wheel, more wrecks, sea stacks on the horizon ----
  for (const [x, z, fn, yaw, r] of [[70, -90, swbClam, 0.6, 10], [95, 40, swbWheel, 0.9, 10]]) if (CartWorlds.clear(T, x, z, r)) { CartScene.mesh(api, x, z, yaw, fn, { hi: true }); taken.push([x, z, r + 2]); }
  for (const [x, z, yaw, col] of [[40, -10, 2.2, '#5a4434'], [120, -60, -0.4, '#4e5a5a'], [-120, 30, 1.1, '#6a4c34'], [140, 250, 0.4, '#5a5048'], [300, 60, 2.0, '#6a4c34']]) if (CartWorlds.clear(T, x, z, 14)) { CartScene.mesh(api, x, z, yaw, m => swbBow(m, col), { hi: true }); taken.push([x, z, 14]); }
  // roadside fill: coral, rocks and kelp
  for (let s = 30, k = 0; s < T.L; s += 17, k++) {
    const sd = k % 2 ? 1 : -1, p = side(s, sd, 4 + (k % 3) * 3), free = taken.every(q => Math.hypot(q[0] - p.x, q[1] - p.z) > q[2] + 2);
    if (!free || !CartWorlds.clear(T, p.x, p.z, 3)) continue;
    const kind = k % 4 === 0 ? 'swb_rock' : k % 4 === 2 ? 'swb_kelp' : 'swb_coral';
    CartKit.put(E, kind, p.x, p.z, p.yaw + k, kind === 'swb_rock' ? ['#c8ccd0', '#d8c8a8', '#b8c0c8'][k % 3] : kind === 'swb_kelp' ? ['#8a7a3a', '#6a5a2a', '#9a8a4a'][k % 3] : ['#ffffff', '#ffc8d0', '#ffb08a', '#e0d0ff'][k % 4], { scale: 1 + (k % 3) * 0.25 });
  }
  // sea stacks (big rocks) on the far horizon all round
  { const b = T.bounds, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, R0 = Math.max(b.x1 - b.x0, b.z1 - b.z0) / 2 + 90; for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + rng() * 0.1, r = R0 + rng() * 40, x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r; CartKit.put(E, 'swb_rock', x, z, a, ['#a8b0b8', '#c0b8a8', '#98a4ac'][i % 3], { scale: 5 + rng() * 5, noCol: true }); } }
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.3, b = T.bounds, x = (b.x0 + b.x1) / 2 + Math.sin(a) * 230, z = (b.z0 + b.z1) / 2 + Math.cos(a) * 230; if (CartWorlds.clear(T, x, z, 40)) E.terrain.add(CartFeat.mound(x, z, 30, 5, { col: '#d0c6a8' })); }
  // gift rows, boost pads (one in the hull's belly, one on the hook's exit, one down the drive), the grid
  const f = s => wrap(s) / T.L;
  CartKit.gifts(E, T, [f(sOf(-29, -5)), f(S.broad - 55), f(S.gallows + 55), f(S.krakB + 45), f(S.crab - 52)]);
  CartKit.boosts(E, T, [[f(S.hull), 0], [f(S.krakB + 25), 0.35], [f(sOf(-27, -150)), -0.3]]);
  CartKit.grid(E, T);
  return CartKit.finish(E);
}
// the centre line: a gold doubloon every 7 m
function swbPaintCenter(ctx, P, S, T) {
  for (let s = 0; s < T.L; s += 7) { const g = T.at(s, {}), q = P(g.x, g.z); ctx.fillStyle = 'rgba(255,204,68,0.85)'; ctx.beginPath(); ctx.arc(q[0], q[1], 0.5 * S, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(160,110,30,0.8)'; ctx.lineWidth = 0.1 * S; ctx.beginPath(); ctx.arc(q[0], q[1], 0.36 * S, 0, TAU); ctx.stroke(); }
}

/* ---------------- the moving things (one pooled group) ---------------- */
const SwbMesh = {
  // a long iron gun barrel pointing along +z from the trunnion
  gun(m) { m.color(SWB_IRON).shine(2); m.limb(0, 0, -1.0, 0, 0, 2.6, 0.52, 0.4, { seg: 12 }); m.torus(0, 0, 2.5, 0.44, 0.1, { seg: 12, tseg: 3 }); m.ball(0, 0, -1.1, 0.5, { seg: 10, rings: 6 }); m.color('#0a0808'); m.push(); m.tf(0, 0, 2.62, 0, Math.PI / 2, 0); m.disc(0, 0, 0, 0.3, 10); m.pop(); m.color(SWB_BRASS).shine(3); m.torus(0, 0, 0.4, 0.55, 0.06, { seg: 12, tseg: 3 }); m.shine(0); },
  // a cannonball, a fizzing fuse stub
  ball(m) { m.color('#1e1c20').shine(3); m.ball(0, 0, 0, 0.75, { seg: 12, rings: 8 }); m.color('#ffb040', 1); m.ball(0, 0.75, 0, 0.12, { seg: 5, rings: 3 }); m.emissive(0).shine(0); },
  // the anchor on its chain, hanging from the pivot (origin) down -y
  anchor(m) {
    m.color('#4a4448').shine(2);
    for (let i = 0; i < 12; i++) { const y = -0.4 - i * 0.82; m.push(); m.tf(0, y, 0, i % 2 ? Math.PI / 2 : 0, 0, 0); m.push(); m.tf(0, 0, 0, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.42, 0.11, { seg: 8, tseg: 4 }); m.pop(); m.pop(); }
    // ring, shank, stock, crown, two arms with flukes curling up
    const top = -10.4; m.color('#3a3438').shine(2);
    m.push(); m.tf(0, top, 0, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.6, 0.16, { seg: 12, tseg: 4 }); m.pop();
    m.limb(0, top - 0.5, 0, 0, top - 4.2, 0, 0.32, 0.38, { seg: 10 });
    m.color(SWB_WOOD_D); m.limb(0, top - 1.1, -1.8, 0, top - 1.1, 1.8, 0.24, 0.24, { seg: 6 });
    m.color('#3a3438');
    const arm = sd => { let x = 0, y = top - 4.2; for (let i = 1; i <= 5; i++) { const a = i / 5 * 1.25, nx = sd * Math.sin(a) * 2.6, ny = top - 4.2 - Math.sin(a * 1.1) * 0.6 + (1 - Math.cos(a)) * 2.6; m.limb(x, y, 0, nx, ny, 0, 0.36 - i * 0.03, 0.33 - i * 0.03, { seg: 8 }); x = nx; y = ny; } m.push(); m.tf(x, y, 0, 0, 0, -sd * 0.6); m.ellipsoid(0, 0, 0, 0.75, 0.5, 0.22, { seg: 8, rings: 5 }); m.pop(); };
    arm(1); arm(-1); m.ball(0, top - 4.3, 0, 0.5, { seg: 10, rings: 6 });
    // barnacles and a strand of kelp still hanging off it
    m.color('#e8e4da'); for (let i = 0; i < 6; i++) m.ball(Math.sin(i * 2) * 0.3, top - 1.6 - i * 0.45, 0.32, 0.12, { seg: 5, rings: 3 });
    m.color('#6a7a3a'); m.limb(0.3, top - 2, 0.2, 0.9, top - 3.8, 0.4, 0.06, 0.04, { seg: 3 });
    m.shine(0);
  },
  // one segment of a kraken arm, along +y from 0 to len, suckers on +x (the side that faces the road, then the ground)
  arm(m, i) {
    const j = i % 6, len = 3.1, r0 = 1.3 - j * 0.17, r1 = j === 5 ? 0.12 : r0 - 0.17;
    m.color(j % 2 ? '#8a2e66' : '#7a2a5a').shine(2); m.limb(0, -0.2, 0, 0, len + 0.15, 0, r0, r1, { seg: 10 });
    m.color('#f4c8d8').shine(1); for (let k = 0; k < 3; k++) { const y = 0.4 + k * 0.95, r = lerp(r0, r1, y / len); m.push(); m.tf(r * 0.92, y, 0, 0, 0, -Math.PI / 2); m.cyl(0, 0, 0, r * 0.32, r * 0.26, r * 0.22, 8); m.pop(); }
    m.color('#b84a8a'); m.ball(-r0 * 0.6, len * 0.5, r0 * 0.6, r0 * 0.18, { seg: 5, rings: 3 }); m.shine(0);
  },
  // a giant crab facing +z: a wide shell, eye stalks, eight legs (claws are their own objects)
  crab(m) {
    m.color('#e85a2a').shine(2); m.ellipsoid(0, 1.35, 0, 1.6, 0.7, 1.15, { seg: 14, rings: 8 }); m.color('#ff7a3a'); m.ellipsoid(0, 1.6, 0.05, 1.3, 0.42, 0.9, { seg: 12, rings: 6, phi1: Math.PI / 2 });
    m.color('#ffd0a0'); for (let i = 0; i < 6; i++) m.ball(Math.sin(i * 1.1) * 0.8, 1.95, Math.cos(i * 1.7) * 0.5, 0.1, { seg: 5, rings: 3 });
    m.color('#e85a2a'); for (const sx of [-0.35, 0.35]) { m.limb(sx, 1.7, 0.8, sx * 1.3, 2.4, 1.05, 0.08, 0.07, { seg: 5 }); m.color('#ffffff').shine(3); m.ball(sx * 1.3, 2.5, 1.08, 0.2, { seg: 8, rings: 6 }); m.color('#101010'); m.ball(sx * 1.3, 2.52, 1.25, 0.1, { seg: 6, rings: 4 }); m.color('#e85a2a').shine(2); }
    m.color('#c84a22'); for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { const z = 0.55 - i * 0.38; m.limb(sx * 1.3, 1.25, z, sx * 2.3, 1.55, z * 1.3, 0.13, 0.11, { seg: 5 }); m.limb(sx * 2.3, 1.55, z * 1.3, sx * 2.8, 0.05, z * 1.5, 0.11, 0.05, { seg: 5 }); }
    m.color('#2a1410'); m.ellipsoid(0, 1.05, 1.08, 0.5, 0.1, 0.05, { seg: 6, rings: 3 });
    m.shine(0);
  },
  // a crab claw (pincer) reaching forward along +z from its elbow
  claw(m) { m.color('#e85a2a').shine(2); m.limb(0, 0, 0, 0, 0.3, 0.9, 0.18, 0.2, { seg: 6 }); m.ellipsoid(0, 0.45, 1.5, 0.5, 0.42, 0.75, { seg: 10, rings: 7 }); m.color('#ff8a4a'); m.limb(0.12, 0.65, 1.95, 0.05, 0.95, 2.7, 0.2, 0.06, { seg: 6 }); m.limb(-0.12, 0.25, 1.95, -0.05, 0.1, 2.6, 0.18, 0.06, { seg: 6 }); m.color('#2a1410'); m.ball(0, 0.55, 2.05, 0.1, { seg: 5, rings: 3 }); m.shine(0); }
};

/* ---------------- the rules: hazards and enemies at run time ---------------- */
const SWB_GUN = { period: 6.6, warn: 1.4, speed: 22, r: 2.7, push: 11 };
const SWB_ANCHOR = { period: 4.4, amp: 1.0, len: 14.7, pivot: 16.2, low: 2.7, r: 1.8 };
const SWB_ARM = { period: 9.8, rumble: 0.7, rise: 1.25, slam: 0.22, lie: 1.0, lift: 0.55, sink: 0.6, seg: 3.1, n: 6, band: 1.5 };
const SWB_CRAB = { speed: 3.8, pause: 5.5, r: 1.2 };
CART_TRACK_RULES.shipwreck = {
  onLoad(s) {
    const E = s.E, B = E.swb;
    const G = CartKit.group(s, [['guns', SwbMesh.gun, 3], ['balls', SwbMesh.ball, 3], ['anchors', SwbMesh.anchor, 2], ['arms', SwbMesh.arm, 12], ['crabs', SwbMesh.crab, 5], ['claws', SwbMesh.claw, 10]]);
    const L = s.swb = { G, guns: [], anchors: [], arms: [], crabs: [], said: {}, hintT: -9 };
    B.guns.forEach((q, i) => L.guns.push(Object.assign({}, q, { off: i * 2.2, st: 'idle', t: 0, c: -1, d: 0, dir: -q.sd, mask: 0, gun: G.guns[i], ball: G.balls[i] })));
    for (const q of L.guns) q.d0 = q.sd > 0 ? q.wr + 2.6 : -q.wl - 2.6;
    B.anchors.forEach((q, i) => L.anchors.push(Object.assign({}, q, { ph: i * Math.PI * 0.5, th: 0, w: 0, low: false, mask: 0, cool: [0, 0, 0, 0, 0, 0, 0, 0], obj: G.anchors[i], bx: 0, by: 0, bz: 0, lat: 0 })));
    B.arms.forEach((q, i) => L.arms.push(Object.assign({}, q, { toff: i * SWB_ARM.period / 2, reach0: q.hw * 0.3, seg: (q.hoff + q.hw * 0.3) / SWB_ARM.n, st: 'hide', u: 0, c: -1, mask: 0, cool: [0, 0, 0, 0, 0, 0, 0, 0], phi: [0, 0, 0, 0, 0, 0], sinkY: -20, segs: G.arms.slice(i * 6, i * 6 + 6), reach: 0 })));
    B.crabs.forEach((q, i) => L.crabs.push(Object.assign({}, q, { d: (i % 2 ? 1 : -1) * (q.hw + 3), dir: i % 2 ? -1 : 1, st: 'wait', wait: i * 0.9, sp: SWB_CRAB.speed * (0.85 + (i % 3) * 0.15), cool: [0, 0, 0, 0, 0, 0, 0, 0], snap: 0, x2: 0, z2: 0, body: G.crabs[i], claws: [G.claws[i * 2], G.claws[i * 2 + 1]] })));
    CartKit.state(s);
  },
  onUpdate(s, dt, racing) {
    const L = s.swb; if (!L) return;
    swbGuns(s, L, dt, racing); swbAnchors(s, L, dt, racing); swbArms(s, L, dt, racing); swbCrabs(s, L, dt, racing);
  },
  // the AI: ease off for a cannonball or a low anchor coming across its line, steer to the gap (cartIxObs) or brake
  // for a kraken slam, hop the arm lying on the road (by skill); the crabs are cartIxObs steering
  onStep(s, k, dt, racing) {
    const L = s.swb; if (!L || k.player && !s.autoDrive || !racing || !s.T || k.out) return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9, luck = ((k.slot * 7 + Math.floor(s.time * 0.5)) % 10) / 10, good = luck < 0.45 + (sk - 0.85) * 3;
    const ease = () => { if (k.speed > 10) I.gas = 0; if (k.speed > 17) I.brake = 0.5; };
    for (const q of L.guns) {
      if (q.st === 'idle') continue;
      const ds = CartKit.ahead(s, k, q.s); if (ds < 1.5 || ds > 40) continue;
      const ta = ds / Math.max(6, k.speed), tf = q.st === 'warn' ? SWB_GUN.warn - q.t : -q.t, bd = q.d0 + q.dir * Math.max(0, ta - tf) * SWB_GUN.speed;
      if (ta > tf - 0.25 && Math.abs(bd - k.loc.d) < 4.2 && luck < 0.15 + (sk - 0.85) * 2) { ease(); break; }
    }
    for (const a of L.anchors) {
      const ds = CartKit.ahead(s, k, a.s); if (ds < 1 || ds > 34) continue;
      const ta = ds / Math.max(6, k.speed), th = SWB_ANCHOR.amp * Math.sin((s.time + ta) * TAU / SWB_ANCHOR.period + a.ph), y = SWB_ANCHOR.pivot - SWB_ANCHOR.len * Math.cos(th), lat = SWB_ANCHOR.len * Math.sin(th);
      if (y < SWB_ANCHOR.low + 0.6 && Math.abs(lat - k.loc.d) < 4.0 && good) { ease(); break; }
    }
    for (const r of L.arms) {
      if (r.st === 'hide') continue;
      const ds = CartKit.ahead(s, k, r.s); if (ds < 1 || ds > 38) continue;
      const inZone = r.sd * k.loc.d > -r.reach0;
      if ((r.st === 'rise' || r.st === 'slam') && inZone && ds < 22 && luck < 0.5 + (sk - 0.85) * 2) { ease(); break; }
      if (r.st === 'lie' && ds < Math.max(4, k.speed * 0.24) && inZone && !k.air && luck < 0.5 + (sk - 0.85) * 2) { I.driftPress = true; I.drift = false; break; }
    }
  },
  draw(s, R, S, t) { const L = s.swb; if (L) swbDraw(s, L, R, S, t); },
  lights(s, add) {
    const L = s.swb; if (!L) return;
    for (const q of L.guns) if (q.st === 'fly' && q.t < 0.3) add(q.px, 3, q.pz, 16, SWB_C.hot, 1.6, 2);
  },
  hud(s, ctx, W, H, top, left) {
    const L = s.swb, p = s.player; if (!L || !p) return;
    // first-lap hints as each hazard comes up
    const hint = (key, sv, text, sub) => { if (L.said[key] || p.lap > 1) return; const ds = CartKit.ds(s.T, p.loc.s, sv); if (ds > 0 && ds < 75) { L.said[key] = true; L.hintT = s.time; s.banner(text, '#ffcc44', 2.0, sub); } };
    if (s.state === 'race' && s.T) { const S = s.E.swb.S; hint('guns', L.guns[0].s, 'BROADSIDE!', 'pass while the guns reload'); hint('anchors', L.anchors[0].s, 'SWINGING ANCHORS!', 'time it, or hug the edge'); hint('kraken', L.arms[0].s, 'KRAKEN!', 'take the gap, HOP the arm'); hint('crabs', S.crab - 20, 'CRAB FLATS!', 'steer round the crabs'); }
  }
};
// the world offset of local (lx, ly, lz) for an object with this yaw (R = Ry(yaw)), into out
const swbRot = (yaw, lx, lz, out) => { const c = Math.cos(yaw), sn = Math.sin(yaw); out[0] = c * lx + sn * lz; out[1] = -sn * lx + c * lz; return out; };
const SWB_V = [0, 0];

// ---- broadside: every 6.6 s per gun (staggered): the gun runs out and fizzes (1.4 s, the lane flashes), FIRE: a ball
// skips across the road at 28 m/s and knocks aside what it meets; airborne cars over it are skipped ----
function swbGuns(s, L, dt, racing) {
  const C = SWB_GUN;
  for (const q of L.guns) {
    const c = Math.floor((s.time + q.off) / C.period), ph = (s.time + q.off) - c * C.period;
    if (q.st === 'idle' && ph > C.period - C.warn && c !== q.c) { q.st = 'warn'; q.t = 0; q.c = c; if (CartKit.near(s, q.px, q.pz, 70)) cartIxSound(s, 'cartSparkle', q.px, q.pz, 0.4, 0.6); }
    q.t += dt;
    if (q.st === 'warn' && q.t >= C.warn) {
      q.st = 'fly'; q.t = 0; q.d = q.d0; q.mask = 0; CartKit.fired(s, 'broadside');
      if (CartKit.near(s, q.px, q.pz, 90)) { cartIxSound(s, 'cartBoom', q.px, q.pz, 0.9, 0.7); }
      if (CartKit.near(s, q.px, q.pz, 30)) s.shakeIt(0.4);
      if (s.fx && CartKit.near(s, q.px, q.pz, 140)) s.fx.smoke(q.px - q.nx * q.sd * 1.5, 3.2, q.pz - q.nz * q.sd * 1.5, 6, '#e8e4dc');
    }
    if (q.st === 'fly') {
      q.d += q.dir * C.speed * dt;
      const far = q.sd > 0 ? -q.wl - 4 : q.wr + 4;
      if (q.dir * (q.d - far) > 0) { q.st = 'idle'; q.t = 0; if (s.fx && CartKit.near(s, q.x, q.z, 100)) s.fx.dust(q.x + q.nx * q.d, 0.4, q.z + q.nz * q.d, 6, '#d8ccb0'); }
      else {
        const x = q.x + q.nx * q.d, z = q.z + q.nz * q.d, y = swbBallY(q);
        cartIxObs(s, x, z, 1.6);
        if (racing) for (const k of s.karts) {
          if (k.out || (q.mask & (1 << k.slot))) continue;
          if (Math.hypot(k.x - x, k.z - z) > C.r + 0.9) continue;
          if (k.air && k.y > s.terrain.height(k.x, k.z) + y + 0.4) { if (k.player) s.banner('JUMPED IT!', '#7aff8a', 0.7, null, true); q.mask |= 1 << k.slot; continue; }
          q.mask |= 1 << k.slot;
          if (CartKit.hit(s, k, 'knock', 'broadside', { dx: q.nx * q.dir, dz: q.nz * q.dir, power: C.push, dur: 0.9, banner: 'CANNONBALL!' })) { cartIxSound(s, 'bump', k.x, k.z, 0.9, 0.6); if (s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'star', 10, '#ffcc44'); }
        }
        // a puff of sand at every skip
        if (s.fx && Math.abs(Math.sin(q.d * 0.42)) < 0.12 && CartKit.near(s, x, z, 90)) s.fx.dust(x, 0.2, z, 2, '#d8ccb0');
      }
    }
    // the gun runs out during the warning, recoils on the shot, then draws back in
    const o = q.gun; if (o) { const out = q.st === 'warn' ? Math.min(1, q.t / 0.5) : q.st === 'fly' ? Math.max(0, 1 - q.t * 1.5) : 0, rec = q.st === 'fly' && q.t < 0.3 ? Math.sin(q.t / 0.3 * Math.PI) * 0.9 : 0, fz = q.st === 'warn' ? Math.sin(s.time * 40) * 0.02 * q.t : 0;
      o.live = true; o.visible = true; const ex = -q.sd * (out * 1.6 - rec) - q.sd * 0.2; o.x = q.px + q.nx * ex + q.tx * fz; o.z = q.pz + q.nz * ex + q.tz * fz; o.y = 3.1; o.yaw = q.pyaw; o.pitch = -0.04; o.roll = 0; o.scale = 1; }
    const b = q.ball; if (b) { const on = q.st === 'fly'; b.live = on; b.visible = on; if (on) { b.x = q.x + q.nx * q.d; b.z = q.z + q.nz * q.d; b.y = s.terrain.height(b.x, b.z) + swbBallY(q) + 0.75; b.yaw = 0; b.pitch = q.t * 14 * q.dir; b.roll = 0; b.scale = 1; } }
  }
}
// the ball skips: it leaves the port at 3 m, and bounces lower and lower across the road
function swbBallY(q) { const u = Math.abs(q.d - q.d0), a = Math.max(0.15, 2.4 - u * 0.07); return Math.abs(Math.cos(u * 0.42)) * a; }

// ---- the gallows: each anchor swings wall to wall on its chain (4.4 s), the two out of step. Low in the middle of its
// swing (the red sweep on the road), high at the ends: time it, or keep to the very edges ----
function swbAnchors(s, L, dt, racing) {
  const C = SWB_ANCHOR;
  for (const a of L.anchors) {
    const w = s.time * TAU / C.period + a.ph, th = C.amp * Math.sin(w), om = C.amp * Math.cos(w) * TAU / C.period;
    if (a.th * th <= 0 && a.th !== 0) { CartKit.fired(s, 'anchor'); if (CartKit.near(s, a.x, a.z, 60)) cartIxSound(s, 'swell', a.x, a.z, 0.35, 0.5); }
    a.th = th; a.w = om; a.lat = C.len * Math.sin(th);
    const y = C.pivot - C.len * Math.cos(th); a.bx = a.x + a.nx * a.lat; a.bz = a.z + a.nz * a.lat; a.by = y; a.low = y < C.low;
    for (let i = 0; i < 8; i++) if (a.cool[i] > 0) a.cool[i] -= dt;
    if (a.low) {
      cartIxObs(s, a.bx, a.bz, 2.8);
      if (racing) for (const k of s.karts) {
        if (k.out || a.cool[k.slot] > 0) continue;
        if (Math.hypot(k.x - a.bx, k.z - a.bz) > C.r + 0.8 || k.y > y + 1.4) continue;
        a.cool[k.slot] = 1.5;
        const dir = om > 0 ? 1 : -1;
        if (CartKit.hit(s, k, 'knock', 'anchor', { dx: a.nx * dir, dz: a.nz * dir, power: 12, dur: 1.0, banner: 'ANCHORED!' })) { cartIxSound(s, 'bump', k.x, k.z, 1, 0.5); cartIxSound(s, 'stomp', k.x, k.z, 0.5, 0.8); if (s.fx) s.fx.burst(k.x, k.y + 1.2, k.z, 'star', 12, '#ffffff'); if (k.player) s.shakeIt(0.6); }
      }
    }
    const o = a.obj; if (o) { o.live = true; o.visible = true; o.x = a.x; o.z = a.z; o.y = C.pivot; o.yaw = Math.atan2(-a.nz, a.nx); o.pitch = 0; o.roll = th; o.scale = 1; }
  }
}

// ---- the kraken's arms: rumble at the hole (0.7 s), the arm rears up (1.25 s; the slam zone flashes), SLAM across three
// quarters of the road (flip), it lies there (1.25 s: spin if you drive into it, hop over it), lifts and sinks ----
function swbArms(s, L, dt, racing) {
  const C = SWB_ARM, tRise = C.rumble, tSlam = tRise + C.rise, tLie = tSlam + C.slam, tLift = tLie + C.lie, tSink = tLift + C.lift, tEnd = tSink + C.sink;
  for (const r of L.arms) {
    const c = Math.floor((s.time + r.toff) / C.period), ph = (s.time + r.toff) - c * C.period;
    const st = ph < tRise ? 'rumble' : ph < tSlam ? 'rise' : ph < tLie ? 'slam' : ph < tLift ? 'lie' : ph < tSink ? 'lift' : ph < tEnd ? 'sink' : 'hide';
    if (st !== r.st) {
      if (st === 'rumble' && CartKit.near(s, r.bx, r.bz, 70)) cartIxSound(s, 'cartBass', r.bx, r.bz, 0.5, 0.5);
      if (st === 'rise' && CartKit.near(s, r.bx, r.bz, 70)) cartIxSound(s, 'splash', r.bx, r.bz, 0.6, 0.6);
      if (st === 'slam') { r.mask = 0; CartKit.fired(s, 'kraken'); }
      if (st === 'lie') { if (CartKit.near(s, r.bx, r.bz, 90)) { cartIxSound(s, 'stomp', r.bx, r.bz, 1, 0.5); cartIxSound(s, 'cartBoom', r.bx, r.bz, 0.5, 0.5); } if (CartKit.near(s, r.bx, r.bz, 34)) s.shakeIt(0.7); if (s.fx && CartKit.near(s, r.bx, r.bz, 140)) for (let i = 0; i < 4; i++) s.fx.dust(r.bx + r.ux * (3 + i * 4), 0.3, r.bz + r.uz * (3 + i * 4), 4, '#d8ccb0'); }
      r.st = st;
    }
    r.u = st === 'rumble' ? ph / C.rumble : st === 'rise' ? (ph - tRise) / C.rise : st === 'slam' ? (ph - tSlam) / C.slam : st === 'lie' ? (ph - tLie) / C.lie : st === 'lift' ? (ph - tLift) / C.lift : st === 'sink' ? (ph - tSink) / C.sink : 0;
    // the pose: angles from upright toward the road (FK from the hole), how far it is sunk
    const ph0 = SWB_ARM_UP, flat = Math.PI / 2;
    let sink = 0;
    for (let i = 0; i < 6; i++) {
      const up = ph0[i] + Math.sin(s.time * 3 + i * 0.8) * 0.12 * (i / 5);
      let a;
      if (st === 'rumble' || st === 'hide') { a = up; sink = st === 'hide' ? 20 : 20 - r.u * 4; }
      else if (st === 'rise') { const e = Math.min(1, r.u * 2.2); a = up - (1 - e) * 0.2 - Math.max(0, r.u - 0.6) * 0.5 * (i / 5); sink = (1 - e) * 16; }
      else if (st === 'slam') { const e = r.u * r.u; a = lerp(up - 0.2 * (i / 5), flat, e); }
      else if (st === 'lie') { a = flat + Math.sin(s.time * 5 + i) * 0.03; }
      else if (st === 'lift') { a = lerp(flat, up, r.u); }
      else { a = up; sink = r.u * 20; }
      r.phi[i] = a;
    }
    r.sinkY = sink;
    // the reach across the road (lateral from the centre, on the hole's side positive), for hits and the AI
    // (r.reach0: how far past the centre line the tip reaches toward the far side; r.hoff: the hole's lateral)
    const live = st === 'slam' || st === 'lie';
    // the AI reads the warning late in the rise (steers for the gap) and the arm on the road by skill in onStep (ease off, hop)
    if ((st === 'rise' && r.u > 0.5) || st === 'slam') for (let lat = -r.reach0 + 1.6; lat < r.hw; lat += 3) cartIxObs(s, r.x + r.nx * lat * r.sd, r.z + r.nz * lat * r.sd, 1.7);
    for (let i = 0; i < 8; i++) if (r.cool[i] > 0) r.cool[i] -= dt;
    if (racing && live) for (const k of s.karts) {
      if (k.out) continue;
      const dx = k.x - r.x, dz = k.z - r.z, along = dx * r.tx + dz * r.tz, lat = (dx * r.nx + dz * r.nz) * r.sd;
      if (Math.abs(along) > SWB_ARM.band + 1.0 || lat < -r.reach0 || lat > r.hoff) continue;
      const gy = s.terrain.height(k.x, k.z);
      if (st === 'slam' && r.u > 0.45 && !(r.mask & (1 << k.slot))) {
        r.mask |= 1 << k.slot; if (k.air && k.y > gy + 2.2) continue;
        if (CartKit.hit(s, k, 'flip', 'kraken', { dx: r.tx, dz: r.tz, banner: 'KRAKEN SLAM!' })) { cartIxSound(s, 'bump', k.x, k.z, 1, 0.5); if (s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'star', 14, '#d86ac8'); }
      } else if (st === 'lie' && r.cool[k.slot] <= 0 && !(r.mask & (1 << k.slot))) {
        if (k.air && k.y > gy + 0.9) { if (k.player && !r.said) { r.said = true; s.banner('NICE HOP!', '#7aff8a', 0.7, null, true); } continue; }
        r.cool[k.slot] = 2; r.mask |= 1 << k.slot;
        if (CartKit.hit(s, k, 'spin', 'kraken', { dur: 0.8, banner: 'TANGLED!' })) { k.vx *= 0.5; k.vz *= 0.5; cartIxSound(s, 'bump', k.x, k.z, 0.8, 0.7); }
      }
    }
    // pose the six segments by forward kinematics from the hole
    const yaw = Math.atan2(-r.uz, r.ux); let px = r.bx, pz = r.bz, py = lerp(-0.2, 0.9, st === 'slam' ? r.u : st === 'lie' ? 1 : st === 'lift' ? 1 - r.u : 0) - r.sinkY;
    for (let i = 0; i < 6; i++) {
      const o = r.segs[i]; if (!o) continue; const a = r.phi[i], vis = st !== 'hide';
      o.live = vis; o.visible = vis; o.x = px; o.y = py; o.z = pz; o.yaw = yaw; o.pitch = 0; o.roll = -a; o.scale = r.seg / C.seg;
      const h = Math.sin(a) * r.seg, v = Math.cos(a) * r.seg; px += r.ux * h; pz += r.uz * h; py += v;
      if (st === 'lie' || (st === 'slam' && r.u > 0.8)) py = Math.max(py, 0.9 - (i + 1) * 0.12);
    }
  }
}
// the arm's resting curl when reared up (radians from upright toward the road, base to tip)
const SWB_ARM_UP = [-0.12, -0.05, 0.15, 0.5, 0.95, 1.5];

// ---- crab flats: five crabs scuttle sideways across the road and back, pausing at the edges to clack their claws ----
function swbCrabs(s, L, dt, racing) {
  const C = SWB_CRAB;
  for (const c of L.crabs) {
    const edge = c.hw + 3.5;
    if (c.st === 'wait') { c.wait -= dt; if (c.wait <= 0) { c.st = 'walk'; c.dir = c.d > 0 ? -1 : 1; CartKit.fired(s, 'crab'); } }
    else { c.d += c.dir * c.sp * dt; if (c.dir * c.d >= edge) { c.d = c.dir * edge; c.st = 'wait'; c.wait = C.pause + (c.i % 3) * 0.4; } }
    if (c.snap > 0) c.snap -= dt;
    for (let i = 0; i < 8; i++) if (c.cool[i] > 0) c.cool[i] -= dt;
    const x = c.x + c.nx * c.d, z = c.z + c.nz * c.d; c.x2 = x; c.z2 = z;
    if (Math.abs(c.d) < c.hw + 1) {
      cartIxObs(s, x, z, 3.8);
      if (racing) for (const k of s.karts) {
        if (k.out || c.cool[k.slot] > 0 || (k.air && k.y > s.terrain.height(k.x, k.z) + 1.6)) continue;
        if (Math.hypot(k.x - x, k.z - z) > C.r + 0.9) continue;
        c.cool[k.slot] = 1.6; c.snap = 0.5;
        if (CartKit.hit(s, k, 'spin', 'crab', { dur: 0.8, banner: 'PINCHED!' })) { k.vx *= 0.5; k.vz *= 0.5; cartIxSound(s, 'break', x, z, 0.6, 1.6); if (s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'star', 8, '#ff7a3a'); }
      }
    }
    // pose: the body waddles (roll) as it walks, faces the oncoming cars; the claws wave, snap when it pinches
    const yaw = Math.atan2(-c.tx, -c.tz), walk = c.st === 'walk', step = s.time * 9 + c.i, b = c.body;
    if (b) { b.live = true; b.visible = true; b.x = x; b.z = z; b.y = s.terrain.height(x, z) + (walk ? Math.abs(Math.sin(step)) * 0.12 : 0); b.yaw = yaw + (walk ? Math.sin(step * 0.5) * 0.06 : 0); b.pitch = 0; b.roll = walk ? Math.sin(step) * 0.07 : 0; b.scale = 1.25; }
    for (let j = 0; j < 2; j++) {
      const o = c.claws[j]; if (!o) continue; const sd = j ? 1 : -1;
      swbRot(yaw, sd * 1.25 * 1.25, 1.0 * 1.25, SWB_V);
      const clack = c.st === 'wait' ? Math.max(0, Math.sin(s.time * 8 + j * 1.5)) * 0.5 : 0, sn = c.snap > 0 ? Math.sin(c.snap / 0.5 * Math.PI) * 0.8 : 0;
      o.live = true; o.visible = true; o.x = x + SWB_V[0]; o.z = z + SWB_V[1]; o.y = (b ? b.y : 0) + 1.4 * 1.25; o.yaw = yaw + sd * 0.25; o.pitch = -0.25 - clack - sn; o.roll = 0; o.scale = 1.25;
    }
  }
}

// ---- sprites: the gun lanes, the anchors' shadows and sweeps, the kraken's warnings, the crabs' shadows ----
function swbDraw(s, L, R, S, t) {
  const C = SWB_C, cam = s.cam, T = s.T, near = (x, z, r) => (x - cam.x) ** 2 + (z - cam.z) ** 2 < r * r;
  for (const q of L.guns) {
    if (!near(q.x, q.z, 200)) continue;
    if (q.st === 'warn') {
      // the lane flashes red across the road, arrows point the way the ball will go; the fuse fizzes at the port
      const u = q.t / SWB_GUN.warn, fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * (14 + u * 14))), span = q.hw * 2 + 6;
      R.flat.flat(q.x, 0.09, q.z, span, 3.6, q.yaw, S.square, C.red, (0.55 + 0.4 * u) * fl, false);
      for (const sd of [-1, 1]) R.flat.flat(q.x + q.tx * sd * 2.3, 0.1, q.z + q.tz * sd * 2.3, span, 0.35, q.yaw, S.square, C.warn, 0.9 * fl, false);
      for (let i = 0; i < 5; i++) { const v = ((i / 5 + t * 1.3) % 1), dd = q.d0 + q.dir * v * (span - 4); R.flat.flat(q.x + q.nx * dd, 0.11, q.z + q.nz * dd, 3.2, 3.2, Math.atan2(q.nx * q.dir, q.nz * q.dir), S.arrow, C.white, 0.9 * fl, false); }
      R.bbs.bb(q.px - q.nx * q.sd * 0.6, 3.6, q.pz - q.nz * q.sd * 0.6, 1.4 + Math.random() * 0.6, 1.4 + Math.random() * 0.6, S.spark, C.gold, 1, true, t * 9);
      if (s.fx && Math.random() < 0.5) s.fx.spark(q.px, 3.8, q.pz, 1, '#ffcc44', 3);
    } else if (q.st === 'fly') {
      const x = q.x + q.nx * q.d, z = q.z + q.nz * q.d, y = swbBallY(q) + 0.75;
      R.flat.flat(x, 0.1, z, 2.2, 2.2, 0, S.shadow, C.black, 0.45, false);
      for (let i = 1; i <= 4; i++) R.bbs.bb(x - q.nx * q.dir * i * 1.4, y, z - q.nz * q.dir * i * 1.4, 1.6 - i * 0.2, 1.6 - i * 0.2, S.smoke, C.smoke, 0.5 - i * 0.1, false, t * 2 + i);
      if (q.t < 0.35) R.bbs.bb(q.px - q.nx * q.sd * 1.8, 3.1, q.pz - q.nz * q.sd * 1.8, 6 * (1 - q.t), 6 * (1 - q.t), S.glow, C.hot, 1 - q.t / 0.35, true);
    }
  }
  for (const a of L.anchors) {
    if (!near(a.x, a.z, 220)) continue;
    // the shadow under the anchor (darker and smaller the lower it is), the red sweep across the road when it comes low
    const h = Math.max(0, a.by), sh = 2.4 + h * 0.25;
    R.flat.flat(a.bx, 0.1, a.bz, sh * 1.6, sh, a.yaw, S.shadow, C.black, clamp(0.75 - h * 0.05, 0.2, 0.7), false);
    const lowSoon = Math.abs(a.th) < 0.75, fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 16));
    if (lowSoon) { const ext = 7.6; for (let i = -3; i <= 3; i++) { const d = i / 3 * ext; R.flat.flat(a.x + a.nx * d, 0.09, a.z + a.nz * d, 2.6, 4.4, a.yaw, S.square, C.red, (0.35 + 0.3 * (1 - Math.abs(a.th) / 0.75)) * fl, false); } }
    if (a.low) R.bbs.streak(a.bx, a.by + 0.4, a.bz, a.nx * (a.w > 0 ? -1 : 1), 0, a.nz * (a.w > 0 ? -1 : 1), 3.5, 1.2, S.streak, C.white, 0.35);
  }
  for (const r of L.arms) {
    if (!near(r.bx, r.bz, 220) || r.st === 'hide') continue;
    const reach = r.reach0;
    if (r.st === 'rumble' || r.st === 'rise') {
      // the slam zone flashes purple over three quarters of the road; the gap stays dark; sand boils at the hole
      const u = r.st === 'rumble' ? r.u * 0.4 : 0.4 + r.u * 0.6, fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * (10 + u * 16)));
      for (let d = -reach + 1; d < r.hw + 1; d += 2.2) R.flat.flat(r.x + r.nx * r.sd * d, 0.09, r.z + r.nz * r.sd * d, 2.4, SWB_ARM.band * 2 + 0.8, Math.atan2(r.tx, r.tz), S.square, C.purple, (0.5 + 0.45 * u) * fl, false);
      for (const e of [-1, 1]) R.flat.flat(r.x + r.nx * r.sd * ((r.hw - reach) / 2) + r.tx * e * (SWB_ARM.band + 0.5), 0.1, r.z + r.nz * r.sd * ((r.hw - reach) / 2) + r.tz * e * (SWB_ARM.band + 0.5), 0.45, r.hw + reach, Math.atan2(r.nx, r.nz), S.square, C.white, 0.8 * fl, false);
      R.flat.flat(r.x - r.nx * r.sd * (reach + (r.hw - reach) / 2), 0.1, r.z - r.nz * r.sd * (reach + (r.hw - reach) / 2), r.hw - reach, 3.2, Math.atan2(r.tx, r.tz), S.arrow, [0.5, 1, 0.6], 0.55 * fl, false);
      for (let i = 0; i < 3; i++) { const v = ((t * 1.4 + i / 3) % 1); R.flat.flat(r.bx, 0.12, r.bz, 3 + v * 6, 3 + v * 6, 0, S.ring, C.sand, 0.8 * (1 - v), false); }
      if (s.fx && Math.random() < 0.5 && near(r.bx, r.bz, 90)) s.fx.dust(r.bx + (Math.random() - 0.5) * 3, 0.3, r.bz + (Math.random() - 0.5) * 3, 1, '#d8ccb0');
    } else if (r.st === 'lie' || r.st === 'slam') {
      const a = r.st === 'slam' ? r.u : Math.min(1, (1 - r.u) * 4);
      for (let d = -reach + 1; d < r.hw + 1; d += 3) R.flat.flat(r.x + r.nx * r.sd * d, 0.08, r.z + r.nz * r.sd * d, 3.4, 3.4, 0, S.shadow, C.ink, 0.5 * a, false);
    }
  }
  for (const c of L.crabs) {
    if (!near(c.x, c.z, 180)) continue;
    R.flat.flat(c.x2, 0.08, c.z2, 6.2, 4.6, Math.atan2(c.tx, c.tz), S.shadow, C.black, 0.4, false);
    if (c.snap > 0) R.bbs.bb(c.x2, 3, c.z2, 3, 3, S.star, C.gold, c.snap * 2, true, t * 4);
  }
}

if (typeof window !== 'undefined') setTimeout(() => {
  // hazard screenshots (tools/cart_track_test.js reads debug.trackShots.shipwreck: several career tracks load at once)
  // and the level's live state (debug.trackLevel.shipwreck)
  const C = window.BRADY_CART; if (!C || !C.debug) return;
  const D = C.debug, NAMES = ['broadside-warn', 'broadside', 'anchor', 'kraken-warn', 'kraken', 'kraken-lie', 'crabs', 'hull', 'gallows'];
  D.trackShots = D.trackShots || {};
  D.trackShots.shipwreck = { list: () => NAMES.map(name => ({ name })), shot: name => swbShot(D, name) };
  D.trackLevel = D.trackLevel || {};
  D.trackLevel.shipwreck = () => {
    const s = Game.scene; if (!s || !s.swb) return null;
    const K = s.kit || {}, L = s.swb;
    return { hits: K.hits || {}, touch: K.touch || {}, fired: K.fired || {}, L: s.T ? +s.T.L.toFixed(1) : 0, guns: L.guns.map(q => q.st), anchors: L.anchors.map(a => +a.th.toFixed(2)), arms: L.arms.map(r => r.st), crabs: L.crabs.map(c => +c.d.toFixed(1)) };
  };
}, 0);
function swbShot(D, name) {
  const STEP = 1 / 60;
  D.start({ mode: 'quick', track: 'shipwreck', car: 'galleon', driver: 'brady', seed: 9, autoGas: true });
  const s = D.scene(); s.state = 'race'; s.stateT = 0; window.BRADY.Input.setMode('game'); s.layoutControls(); s.update(STEP);
  const L = s.swb, T = s.T, P = s.player, B = s.E.swb;
  let pin = null; const pins = [];
  const park = (sv, lat, speed, frozen) => { const g = T.at(sv, {}); D.place(-1, g.x + g.nx * g.hw * lat, g.z + g.nz * g.hw * lat, g.yaw, { speed: speed || 0, frozen: false }); P.prevS = P.loc.s; P.lap = 1; P.prog = P.loc.s; pin = frozen ? { x: P.x, z: P.z, yaw: P.yaw } : null; };
  const rivals = list => { let j = 0; for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = list[j++] || [-300 - j * 12, 0, 1]; const g = T.at(P.loc.s + r[0], {}); D.place(i, g.x + g.nx * g.hw * r[1], g.z + g.nz * g.hw * r[1], g.yaw, { speed: r[2] ? 0 : 18, frozen: false }); if (r[2]) pins.push({ k, x: k.x, z: k.z, yaw: k.yaw }); k.prevS = k.loc.s; k.lap = 1; k.prog = k.loc.s; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } k.wpn.t = 99; } };
  s.autoDrive = true; if (!P.ai) s.aiInput(P, STEP, true); P.ai.itemT = 99; P.ai.fireT = 99; P.wpn.t = 99;
  const hold = () => { if (pin) { P.x = pin.x; P.z = pin.z; P.yaw = pin.yaw; P.vx = P.vz = 0; } for (const q of pins) { q.k.x = q.x; q.k.z = q.z; q.k.yaw = q.yaw; q.k.vx = q.k.vz = 0; } };
  const wait = (fn, secs) => { for (let i = 0; i < secs * 60; i++) { s.update(STEP); hold(); if (fn()) return true; } return false; };
  let ok = true;
  if (name === 'broadside-warn' || name === 'broadside') { const q = L.guns[1]; park(q.s - 20, 0.1, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'broadside-warn' ? q.st === 'warn' && q.t > 0.9 : q.st === 'fly' && Math.abs(q.d) < 4, 14); }
  else if (name === 'anchor') { const a = L.anchors[0]; park(a.s - 20, 0, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => a.low && Math.abs(a.lat) < 3, 8); }
  else if (name === 'kraken-warn' || name === 'kraken' || name === 'kraken-lie') { const r = L.arms[0]; park(r.s - 24, -r.sd * 0.05, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'kraken-warn' ? r.st === 'rise' && r.u > 0.7 : name === 'kraken' ? r.st === 'slam' && r.u > 0.5 : r.st === 'lie' && r.u > 0.3, 14); }
  else if (name === 'crabs') { park(B.S.crab - 30, 0, 0, true); rivals([[-50, 0, 1]]); ok = wait(() => L.crabs.filter(c => Math.abs(c.d) < c.hw).length >= 3, 12); }
  else if (name === 'hull') { park(B.S.hull - 34, 0, 20, false); rivals([[10, 0.3, 0], [16, -0.3, 0], [26, 0, 0]]); wait(() => false, 0.8); }
  else if (name === 'gallows') { park(B.S.gallows - 50, 0.1, 18, false); rivals([[10, 0.3, 0], [18, -0.3, 0]]); wait(() => false, 0.8); }
  s.snapCam = true; for (let i = 0; i < 4; i++) { D.step(1, 1); hold(); }
  return { ok, draws: s.stats.draws, tris: s.stats.tris, hits: (s.kit || {}).hits, p: [+P.x.toFixed(1), +P.z.toFixed(1), +P.loc.s.toFixed(1)] };
}
