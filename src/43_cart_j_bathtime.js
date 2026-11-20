/* ============================================================
   ART CART — BATH TIME, Quackzilla's career track (level agent "duck", Nov 19 2026).
   Recipe: docs/ART_CART_LEVEL_RECIPE.md (Love Parade is the worked example). A sunny giant bathroom: the karts are
   bath-toy sized and race round a clawfoot tub the size of a stadium, past shampoo bottles, foam drifts and an army
   of rubber ducks. One lap of about 1.15 km:
     TOWEL RAIL STRAIGHT  the start, under a chrome towel rail with a striped towel hanging off it
     SOAP SLIDE           the east straight: three giant SOAP BARS sit in soap dishes either side of the road. A bar
                          wiggles (its path flashes pink across the road), then SKIDS across and knocks aside anything
                          in its way, dropping three SOAP SLICKS on its way (spin out if you drive through one).
                          Brake or slip past behind the bar; steer through the dry lanes or HOP the slicks
     BUBBLE CHICANE       an S between two BUBBLE MACHINES whose wand wheels blow giant bubbles that drift across the
                          road: touch one and you float off in it (steer round them; they are slow)
     THE PLUGHOLE         a wide tiled plaza round a giant drain: the PLUG is yanked out on its chain (water rings
                          start to turn), then a WHIRLPOOL drags cars toward the middle and spins out anyone it
                          swallows (keep to the edges: boost pads wait there)
     SHOWER STORM         the west straight under three SHOWER HEADS: each shudders and drips over one half of the road
                          (it flashes blue), then pours: soaked cars slow down and can't see. Drive on the dry side;
                          the heads swap sides every round, so weave
   QUACKZILLA's BUBBLE BATH SURF is in everyone's gift boxes here (CART_TRACKS.bathtime.car = 'duck').
   Start it without the menus: BRADY_CART.debug.start({ mode: 'career', track: 'bathtime' }) (or mode 'quick').
   Globals are prefixed BTM_ / btm, level state lives on E.btm and s.btm.
   ============================================================ */
const BTM_C = { navy: [0.05, 0.2, 0.55], bubbleFill: [0.45, 0.75, 1], bubbleRim: [0.55, 0.45, 0.95], white: [1, 1, 1], foam: [0.95, 0.98, 1], pink: [1, 0.45, 0.72], hot: [1, 0.25, 0.55], aqua: [0.35, 0.85, 1], blue: [0.3, 0.6, 1], deep: [0.1, 0.35, 0.8], water: [0.55, 0.85, 1], yellow: [1, 0.85, 0.25], black: [0, 0, 0], lav: [0.75, 0.6, 1], mint: [0.55, 1, 0.8], warn: [1, 0.3, 0.55] };
const BTM_SOAP_COL = ['#ff8ac0', '#b48cff', '#7aeec0'];
const BTM_SOAP_F = BTM_SOAP_COL.map(c => burnsRGBf(c));
const BTM_T = { at: {}, at2: {}, p: {}, lanes: [] };

/* ---------------- the course ---------------- */
// corners [x, z, radius]: the towel-rail straight (south, heading east), the soap slide (east, heading north), the
// bubble chicane (north-east), the plughole plaza (north), the shower storm (west, heading south)
const BTM_POLY = [[-170, -100, 40], [140, -110, 42], [228, -30, 34], [215, 90, 34], [140, 150, 22], [72, 108, 18], [10, 162, 20], [-90, 172, 34], [-200, 92, 34], [-215, -40, 40]];
const BTM_PLAZA = [-40, 168];   // the drain
const btmWidth = (x, z) => {
  if (z > 140 && x > -95 && x < 15) return 1 + 0.75 * BurnsM.smoothstep(0, 1, 1 - Math.abs(x - BTM_PLAZA[0]) / 50);   // the plughole plaza widens
  return 1;
};
// registries (this file sorts before 43_cart_j_kit.js: assign through the same guards, never redeclare)
var CART_TRACK_RULES = (typeof CART_TRACK_RULES !== 'undefined' && CART_TRACK_RULES) || {};
var CART_CAREER_TRACKS = (typeof CART_CAREER_TRACKS !== 'undefined' && CART_CAREER_TRACKS) || {};
CART_TRACKS.bathtime = {
  name: 'BATH TIME', car: 'duck', tod: 'day', music: 'kart2', width: 20, shoulder: 6, theme: 'bath', blurb: 'Soap slides, bubbles, a shower storm and the plughole',
  get pts() { return this._pts || (this._pts = CartKit.course(BTM_POLY, { start: [-40, -104], width: btmWidth, step: 18 })); },   // lazy: the kit loads after this file
  world: (id, D) => btmWorld(id, D)
};
CART_CAREER_TRACKS.duck = 'bathtime';

/* ---------------- shapes shared by the static and the moving pieces ---------------- */
// a rubber duck facing +z, about 2.4 m tall at scale 1 (body near-white so an instance tint makes it any colour)
function btmDuck(m, body, beak, lo) {
  const sg = lo ? 9 : 14, rg = lo ? 6 : 9;
  m.color(body).shine(3);
  m.ellipsoid(0, 0.95, -0.1, 1.25, 0.85, 1.55, { seg: sg, rings: rg });
  m.ellipsoid(0, 1.45, -1.25, 0.6, 0.55, 0.5, { seg: sg - 2, rings: rg - 2 });   // the tail, tipped up
  m.ellipsoid(0, 1.25, -0.05, 1.0, 0.45, 1.1, { seg: sg - 2, rings: rg - 2 });   // the wings' bulge
  m.ball(0, 2.05, 0.75, 0.72, { seg: sg, rings: rg });
  m.color(beak).shine(2); m.ellipsoid(0, 1.92, 1.45, 0.42, 0.16, 0.38, { seg: 10, rings: 6 }); m.ellipsoid(0, 1.8, 1.38, 0.34, 0.1, 0.3, { seg: 8, rings: 5 });
  m.color('#1a1418').shine(3); for (const sd of [-1, 1]) m.ball(sd * 0.36, 2.22, 1.25, 0.12, { seg: 8, rings: 6 });
  m.color('#ffffff'); for (const sd of [-1, 1]) m.ball(sd * 0.39, 2.27, 1.33, 0.04, { seg: 4, rings: 3 });
  m.shine(0);
}

/* ---------------- static pieces (merged into the world's chunks) ---------------- */
// THE TUB: a clawfoot tub as big as a stadium, full to the brim, Quackzilla himself floating in it (long axis = x)
function btmTub(m) {
  const A = 46, B = 21, H = 17, rim = [];
  for (let i = 0; i <= 64; i++) { const t = i / 64 * TAU; rim.push([Math.cos(t) * A, Math.sin(t) * B]); }
  // the enamel shell: the lower half of an ellipsoid, white outside, a pink band painted round it
  m.color('#fdfcff').shine(3); m.ellipsoid(0, H, 0, A, H - 2.5, B, { seg: 56, rings: 16, phi0: Math.PI / 2 });
  m.color('#ff9ac8').shine(2); m.push(); m.tf(0, H - 4.2, 0, 0, 0, 0, 1, 1, 1); for (let i = 0; i < 64; i++) { const a = rim[i], b = rim[i + 1], f = Math.sqrt(1 - Math.pow((H - 4.2 - H) / (H - 2.5), 2)) * 1.005; m.limb(a[0] * f, 0, a[1] * f, b[0] * f, 0, b[1] * f, 0.45, 0.45, { seg: 5, ends: false }); } m.pop();
  // the rolled rim
  m.color('#ffffff').shine(3); for (let i = 0; i < 64; i++) { const a = rim[i], b = rim[i + 1]; m.limb(a[0], H, a[1], b[0], H, b[1], 1.25, 1.25, { seg: 8, ends: false }); }
  // the water, foam drifts on it
  m.color('#8fdcf4', 0.08).shine(4); m.push(); m.tf(0, H - 0.6, 0, 0, 0, 0, A * 0.985, 1, B * 0.985); m.disc(0, 0, 0, 1, 48); m.pop(); m.emissive(0);
  m.color('#ffffff').shine(1);
  for (let i = 0; i < 30; i++) { const t = i / 30 * TAU + Math.sin(i * 7.3) * 0.12, f = 0.72 + 0.2 * Math.abs(Math.sin(i * 3.1)), r = 1.6 + 2.2 * Math.abs(Math.sin(i * 1.7)); m.ball(Math.cos(t) * A * f, H - 0.6 + r * 0.25, Math.sin(t) * B * f, r, { seg: 12, rings: 8 }); if (i % 3 === 0) m.ball(Math.cos(t) * A * f + r * 0.8, H - 0.4 + r * 0.3, Math.sin(t) * B * f + r * 0.4, r * 0.6, { seg: 10, rings: 6 }); }
  // four golden claw feet
  m.color('#f0c050').shine(4);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * A * 0.62, z = sz * B * 0.6, y = H - (H - 2.5) * Math.sqrt(Math.max(0, 1 - 0.62 * 0.62 - 0.6 * 0.6)) + 1.5;
    m.limb(x * 0.97, y, z * 0.97, x * 1.08, 2.4, z * 1.12, 1.9, 1.2, { seg: 10 });
    m.ellipsoid(x * 1.1, 1.3, z * 1.14, 2.2, 1.3, 2.2, { seg: 12, rings: 8 });
    for (let k = -1; k <= 1; k++) { const a = Math.atan2(sx, sz) + k * 0.6; m.ball(x * 1.1 + Math.sin(a) * 2.1, 0.7, z * 1.14 + Math.cos(a) * 2.1, 0.75, { seg: 8, rings: 6 }); }
  }
  // the golden mixer tap at the east end: a swan-neck spout and two cross handles
  { const x0 = A - 4; m.limb(x0, H, 0, x0, H + 7, 0, 1.0, 1.0, { seg: 10 }); m.limb(x0, H + 7, 0, x0 - 3, H + 9, 0, 1.0, 0.95, { seg: 10 }); m.limb(x0 - 3, H + 9, 0, x0 - 6.5, H + 8.2, 0, 0.95, 0.9, { seg: 10 }); m.limb(x0 - 6.5, H + 8.2, 0, x0 - 8, H + 5.6, 0, 0.9, 0.85, { seg: 10 });
    for (const sz of [-1, 1]) { m.limb(x0 + 1, H, sz * 4.5, x0 + 1, H + 3.2, sz * 4.5, 0.55, 0.55, { seg: 8 }); m.ball(x0 + 1, H + 3.6, sz * 4.5, 0.9, { seg: 10, rings: 8 }); m.limb(x0 + 1, H + 3.6, sz * 4.5 - 1.8, x0 + 1, H + 3.6, sz * 4.5 + 1.8, 0.3, 0.3, { seg: 6 }); m.limb(x0 - 0.8, H + 3.6, sz * 4.5, x0 + 2.8, H + 3.6, sz * 4.5, 0.3, 0.3, { seg: 6 }); }
    m.color('#ff6a8a', 0.2); m.ball(x0 + 1, H + 4.6, -4.5, 0.4, { seg: 8, rings: 6 }); m.color('#5ab8ff', 0.2); m.ball(x0 + 1, H + 4.6, 4.5, 0.4, { seg: 8, rings: 6 }); m.emissive(0); }
  // QUACKZILLA floats in it: a giant rubber duck with a row of kaiju spikes down its back
  m.push(); m.tf(-12, H - 2.2, 0, Math.PI / 2 + 0.35, 0, 0, 6.5, 6.5, 6.5); btmDuck(m, '#ffd23a', '#ff8a2a', false);
  m.color('#5adca0').shine(2); for (const [z, y, k] of [[0.62, 2.7, 1], [0.25, 2.5, 0.85], [-0.3, 1.74, 1], [-0.75, 1.66, 0.85], [-1.2, 1.9, 0.7]]) { m.push(); m.tf(0, y, z, 0, -0.25, 0, k, k, k); m.lathe([[0.17, 0], [0.06, 0.3], [0, 0.4]], { seg: 8 }); m.pop(); }
  m.pop(); m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: A, hz: B, y0: 0, y1: H + 1 }] };
}
// the start gate: two chrome posts, a towel rail across the road at 13 m, a big striped towel draped over it
function btmTowelGate(m, W) {
  const h = 13.5;
  m.color('#dfe6ee').shine(4);
  for (const sd of [-1, 1]) { m.limb(sd * W / 2, 0, 0, sd * W / 2, h, 0, 0.55, 0.45, { seg: 12 }); m.ball(sd * W / 2, h, 0, 0.8, { seg: 12, rings: 8 }); m.roundCyl(sd * W / 2, 0, 0, 1.4, 0.6, 0.2); }
  m.limb(-W / 2, h, 0, W / 2, h, 0, 0.4, 0.4, { seg: 12, ends: false });
  // the towel: hangs down both faces of the rail, aqua with white and pink stripes, a little sag in the middle
  const tw = Math.min(16, W * 0.62), drop = 3.4, n = 8;
  for (let i = 0; i < n; i++) {
    const x = -tw / 2 + (i + 0.5) * tw / n, sag = Math.sin((i + 0.5) / n * Math.PI) * 0.25;
    for (const sz of [-1, 1]) { m.color('#5ad0e8').shine(0); m.roundBox(x, h - drop / 2 + 0.3 - sag, sz * 0.55, tw / n + 0.02, drop, 0.35, 0.15); }
  }
  for (const yy of [h - 2.2, h - 2.75]) for (const sz of [-1, 1]) { m.color(yy > h - 2.5 ? '#ffffff' : '#ff8ac0'); m.roundBox(0, yy, sz * 0.74, tw + 0.05, 0.32, 0.05, 0.02); }
  m.color('#5ad0e8'); m.limb(-tw / 2, h + 0.2, 0, tw / 2, h + 0.2, 0, 0.62, 0.62, { seg: 10 });
  m.shine(0);
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 1, y0: 0, y1: h, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: 1, y0: 0, y1: h, camPass: true }] };
}
// a soap dish beside the road (facing +z = the road): a pastel tray with drainage ribs
function btmSoapDish(m, col) {
  m.color(col).shine(3); m.roundBox(0, 0.3, 0, 6.2, 0.6, 4.4, 0.28);
  m.color('#ffffff').shine(2); for (let i = -2; i <= 2; i++) m.roundBox(i * 1.1, 0.66, 0, 0.35, 0.14, 3.6, 0.06);
  m.color(col); m.roundBox(0, 0.78, -2.05, 6.2, 0.5, 0.3, 0.12); m.roundBox(-2.95, 0.78, 0, 0.3, 0.5, 4.4, 0.12); m.roundBox(2.95, 0.78, 0, 0.3, 0.5, 4.4, 0.12);
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: -1.2, hx: 3.1, hz: 1, y0: 0, y1: 1 }] };
}
// a shower rig: a chrome pipe up from the roadside (local +x points across the road), an arm over the road, the
// mixer dial on the pipe. `reach` = metres from the pipe to the head over the middle of the road
function btmShowerRig(m, reach) {
  const h = 14.5;
  m.color('#dfe6ee').shine(4);
  m.roundCyl(0, 0, 0, 1.3, 0.5, 0.2); m.limb(0, 0, 0, 0, h - 1.2, 0, 0.42, 0.42, { seg: 12 });
  m.limb(0, h - 1.2, 0, 0.9, h, 0, 0.42, 0.42, { seg: 12 }); m.limb(0.9, h, 0, reach - 0.8, h, 0, 0.42, 0.42, { seg: 12 }); m.limb(reach - 0.8, h, 0, reach, h - 0.9, 0, 0.42, 0.4, { seg: 12 });
  m.ball(0, h - 1.2, 0, 0.5, { seg: 10, rings: 8 }); m.ball(reach - 0.8, h, 0, 0.48, { seg: 10, rings: 8 });
  // the mixer: a round plate with a red/blue dial
  m.push(); m.tf(0, 3.2, 0, Math.PI / 2, Math.PI / 2, 0); m.roundCyl(0, -0.4, 0, 1.2, 0.5, 0.15); m.pop();
  m.color('#ff5a7a', 0.15); m.ball(0.55, 3.2, 0.5, 0.32, { seg: 8, rings: 6 }); m.color('#4aa8ff', 0.15); m.ball(0.55, 3.2, -0.5, 0.32, { seg: 8, rings: 6 }); m.emissive(0);
  m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.8, y0: 0, y1: h, camPass: true }] };
}
// a bubble machine (facing +z = the road): a rounded pastel cabinet, a trough of bubble mix, a fan grille, a stand
// for the wand wheel (the wheel itself is a moving part at y 6.2, 0.3 in front of the stand's top)
function btmBubbleBase(m, col) {
  m.color(col).shine(3); m.roundBox(0, 1.6, 0, 6, 3.2, 4, 0.9);
  m.color('#ffffff').shine(2); m.roundBox(0, 3.25, 1.0, 5.2, 0.3, 1.6, 0.14);
  m.color('#9ae8ff', 0.12).shine(4); m.roundBox(0, 3.35, 1.0, 4.8, 0.12, 1.3, 0.05); m.emissive(0);
  m.color('#3a4458').shine(1); m.push(); m.tf(0, 1.6, 2.02, 0, Math.PI / 2, 0); m.disc(0, 0, 0, 1.15, 18); m.pop();
  m.color('#ffffff').shine(2); m.push(); m.tf(0, 1.6, 2.06, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 1.2, 0.12, { seg: 18, tseg: 5 }); m.pop(); for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; m.limb(Math.cos(a) * 1.1, 1.6 + Math.sin(a) * 1.1, 2.08, -Math.cos(a) * 1.1, 1.6 - Math.sin(a) * 1.1, 2.08, 0.06, 0.06, { seg: 4 }); }
  m.color('#dfe6ee').shine(4); m.limb(0, 3.2, -0.6, 0, 6.2, -0.6, 0.3, 0.3, { seg: 10 }); m.ball(0, 6.2, -0.6, 0.5, { seg: 10, rings: 8 });
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 3, hz: 2, y0: 0, y1: 3.4 }] };
}
// the drain in the plaza: a chrome ring flush with the road, the grate's slots
function btmDrain(m) {
  m.color('#e6eef4').shine(4); m.torus(0, 0.04, 0, 3.6, 0.32, { seg: 36, tseg: 6, sy: 0.35 });
  m.color('#5a6a78').shine(2); m.disc(0, 0.03, 0, 3.4, 32);
  m.color('#d8e0e8').shine(4); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; m.push(); m.tf(0, 0, 0, a); m.box(0, 0.06, 0, 0.32, 0.06, 6.6); m.pop(); }
  m.ball(0, 0.1, 0, 0.6, { seg: 10, rings: 6 });
  m.shine(0);
  return { cols: [] };
}
// a giant sponge with pores
function btmSponge(m, col) {
  m.color(col).shine(0); m.roundBox(0, 3.6, 0, 15, 7.2, 9, 1.6);
  m.color('#c89a28'); for (let i = 0; i < 26; i++) { const u = (i * 0.618) % 1, v = (i * 0.383 + 0.2) % 1, r = 0.35 + (i % 4) * 0.18; m.push(); m.tf(-6.2 + u * 12.4, 1.2 + v * 5, 4.52, 0, Math.PI / 2, 0); m.disc(0, 0, 0, r, 10); m.pop(); m.push(); m.tf(-6.2 + v * 12.4, 7.22, -3.8 + u * 7.6); m.disc(0, 0, 0, r, 10); m.pop(); }
  m.color('#5adca0'); m.roundBox(0, 7.6, 0, 15.2, 0.9, 9.2, 0.4);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 7.5, hz: 4.5, y0: 0, y1: 8 }] };
}
// a toothbrush mug with three giant toothbrushes leaning out of it
function btmMug(m) {
  m.color('#7ad8f0').shine(3); m.lathe([[4.2, 0], [4.6, 9], [4.3, 9.4], [3.9, 9], [3.6, 0.6], [0, 0.6]], { seg: 28 });
  m.color('#ffffff'); m.torus(0, 4.5, 0, 4.45, 0.25, { seg: 28, tseg: 4 });
  const B = [['#ff6a9a', 0.35, 0.2], ['#ffd23a', -0.3, 2.3], ['#6ad08a', 0.1, 4.2]];
  for (const [c, lean, a] of B) { const dx = Math.sin(a) * lean * 10, dz = Math.cos(a) * lean * 10, x0 = Math.sin(a) * 1.5, z0 = Math.cos(a) * 1.5; m.color(c).shine(3); m.limb(x0, 1, z0, x0 + dx, 20, z0 + dz, 0.55, 0.45, { seg: 10 }); m.color('#ffffff').shine(1); m.push(); m.tf(x0 + dx * 1.03, 20.5, z0 + dz * 1.03, a); m.roundBox(0, 0, 0.75, 1.2, 1.6, 1.5, 0.3); m.color('#7ad8f0'); m.roundBox(0, 0.4, 0.75, 1.0, 1.0, 1.3, 0.2); m.pop(); }
  m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 4.6, y0: 0, y1: 9.4 }] };
}
// a toothpaste tube lying on the floor, a curl of paste out of its mouth
function btmTube(m) {
  m.color('#ffffff').shine(2); m.push(); m.tf(0, 0, 0, 0, 0, 0, 1, 0.7, 1); m.limb(-9, 2.2, 0, 7, 2.2, 0, 2.2, 3.0, { seg: 16 }); m.pop();
  m.color('#5ab8ff'); m.roundBox(-9.6, 1.6, 0, 1.4, 3.0, 6.2, 0.3);
  m.color('#ff5a7a'); m.push(); m.tf(0, 0, 0, 0, 0, 0, 1, 0.7, 1); m.limb(-3, 2.2, 0, 3, 2.2, 0, 2.3, 2.6, { seg: 16 }); m.pop();
  m.color('#5ab8ff').shine(3); m.limb(7, 2.0, 0, 9.4, 2.0, 0, 1.4, 1.4, { seg: 14 });
  m.color('#ffffff').shine(2); let px = 9.6, py = 1.4; for (let i = 0; i < 9; i++) { const a = i * 0.8, x = 11 + Math.cos(a) * 1.6 + i * 0.3, z = Math.sin(a) * 1.6, y = 0.9 + i * 0.12; m.limb(px, py, i ? Math.sin((i - 1) * 0.8) * 1.6 : 0, x, y, z, 0.9, 0.9, { seg: 10 }); px = x; py = y; m.color(i % 2 ? '#ffffff' : '#7ae8d0'); }
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 10, hz: 2.6, y0: 0, y1: 4 }] };
}
// a stack of three folded towels
function btmTowels(m) {
  const C = ['#ff9ac8', '#5ad0e8', '#ffffff', '#ffd23a'];
  for (let i = 0; i < 4; i++) { m.color(C[i]).shine(0); m.push(); m.tf(0, 0, 0, i * 0.12 - 0.15); m.roundBox(0, 1.3 + i * 2.5, 0, 12 - i * 0.4, 2.5, 8 - i * 0.2, 1.1); m.color(C[(i + 2) % 4]); m.roundBox(0, 1.3 + i * 2.5, 4.02 - i * 0.1, 12 - i * 0.4 - 0.4, 0.35, 0.1, 0.05); m.pop(); }
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 6, hz: 4, y0: 0, y1: 10 }] };
}
// the bathroom's tiled wall: pale aqua tiles, white grout, a band of pink tiles, a chrome towel bar
function btmWall(m, L, H) {
  m.color('#bfeaf2').shine(2); m.box(0, H / 2, 0, L, H, 3);
  m.color('#ffffff').shine(1); const g = 12;
  for (let x = -L / 2 + g; x < L / 2; x += g) m.box(x, H / 2, 1.55, 0.5, H, 0.12);
  for (let y = g; y < H; y += g) m.box(0, y, 1.55, L, 0.5, 0.12);
  m.color('#ff9ac8').shine(2); m.box(0, 30, 1.6, L, 11.4, 0.08);
  m.color('#ffffff'); m.box(0, 1.2, 2.4, L, 2.4, 2);
  m.shine(0);
  return { cols: [] };
}

/* ---------------- instanced props (this world only) ---------------- */
const BTM_KINDS = {
  // a rubber duck (tinted: yellow, pink, blue, mint)
  btm_duck: { r: 1.8, near: 34, mid: 120, farD: 300,
    build(m) { btmDuck(m, '#ffffff', '#ff8a2a', m.lo); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.3, y0: 0, y1: 2.6 }] }; },
    far(m) { m.color('#ffffff'); m.ellipsoid(0, 0.95, 0, 1.25, 0.85, 1.5, { seg: 6, rings: 4 }); m.ball(0, 2.05, 0.75, 0.72, { seg: 6, rings: 4 }); m.color('#ff8a2a'); m.box(0, 1.92, 1.45, 0.6, 0.25, 0.5); } },
  // a shampoo bottle with a pump (tinted), the label stays light
  btm_bottle: { r: 2.4, near: 36, mid: 130, farD: 330,
    build(m) {
      m.color('#ffffff').shine(3); m.roundBox(0, 4, 0, 4.2, 8, 2.6, 1.25);
      m.color('#f4f4f4').shine(1); m.roundBox(0, 4.2, 1.28, 2.9, 3.6, 0.1, 0.4);
      m.color('#ffffff').shine(3); m.cyl(0, 8, 0, 0.8, 0.8, 0.9, 14); m.cyl(0, 8.9, 0, 0.45, 0.45, 1.3, 12); m.roundBox(0, 10.4, 0.5, 0.9, 0.6, 2.0, 0.25);
      m.shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.1, hz: 1.3, y0: 0, y1: 10.5 }] };
    },
    far(m) { m.color('#ffffff'); m.box(0, 4, 0, 4, 8, 2.4); m.box(0, 9.2, 0.3, 0.8, 2.4, 1.2); } },
  // a drift of bath foam (tinted white / pink / aqua)
  btm_foam: { r: 3.2, near: 36, mid: 120, farD: 280, soft: 0.4,
    build(m) { m.color('#ffffff').shine(1); const B = [[0, 1.3, 0, 1.6], [1.5, 0.9, 0.4, 1.15], [-1.4, 0.95, -0.3, 1.2], [0.4, 0.8, -1.4, 1.0], [-0.5, 0.75, 1.4, 0.95], [0.6, 2.4, 0.2, 1.0], [2.5, 0.5, -0.8, 0.6]]; for (const [x, y, z, r] of B) m.ball(x, y, z, r, { seg: m.lo ? 8 : 12, rings: m.lo ? 6 : 8 }); m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.4, y0: 0, y1: 2.5, camPass: true }] }; },
    far(m) { m.color('#ffffff'); m.ball(0, 1.2, 0, 2, { seg: 6, rings: 4 }); } }
};

/* ---------------- building the world ---------------- */
function btmWorld(id, D) {
  const sky = Object.assign({}, CART_SKIES.day(), { zen: '#2a7ae8', hor: '#ffc0e0', sky: '#7cc4ff', fog: '#9ccbea', fogD: 0.0015, haze: 0.12, clouds: 0.65, mid: '#6ab8e0', midK: 0.28, key: '#fff0dc', keyK: 1.05, gnd: '#9ad0e4' });
  const W = CartKit.world(id, D, { worldId: 1213, night: false, sky, ground: '#6cbcd8', crack: 0,
    road: { shoulder: 'rgba(120,170,190,0.22)', band: 'rgba(58,118,168,0.78)', edge: 'rgba(255,255,255,0.95)', edgeW: 0.65, centerFn: btmPaintCenter } });
  const { E, T, api, rng } = W;
  const sOf = (x, z) => CartKit.sOf(T, x, z);
  const S = { soap: sOf(222, -6), chic0: sOf(106, 129), chic1: sOf(41, 135), plaza: sOf(BTM_PLAZA[0], BTM_PLAZA[1]), shower: sOf(-205, 60), start: 0 };
  E.btm = { S };
  const side = (s, sd, off) => { const g = T.at(s, {}), o = sd > 0 ? g.wr + off : -g.wl - off; return { x: g.x + g.nx * o, z: g.z + g.nz * o, yaw: Math.atan2(-g.nx * sd, -g.nz * sd), g }; };
  const taken = [];
  // ---- the floor: big pale tiles, a fluffy bath mat round the start, the plaza's white tiles ----
  api.paint((ctx, P, Sc) => {
    const b = T.bounds, g = 8;
    for (let x = Math.floor((b.x0 - 90) / g) * g; x < b.x1 + 90; x += g) for (let z = Math.floor((b.z0 - 90) / g) * g; z < b.z1 + 90; z += g) {
      const q = P(x, z), k = ((x / g) + (z / g)) & 1, n = Math.sin(x * 0.37 + z * 0.71) * 0.5 + 0.5;
      ctx.fillStyle = k ? `rgba(236,250,255,${0.26 + n * 0.1})` : `rgba(56,150,206,${0.36 + n * 0.12})`; ctx.fillRect(q[0], q[1] - g * Sc, g * Sc - 0.6 * Sc, g * Sc - 0.6 * Sc);
    }
    // the plaza: a disc of small white and aqua tiles round the drain, a dark ring of grout where the water turns
    const c = P(BTM_PLAZA[0], BTM_PLAZA[1]);
    ctx.fillStyle = 'rgba(214,240,252,0.6)'; ctx.beginPath(); ctx.arc(c[0], c[1], 19 * Sc, 0, TAU); ctx.fill();
    for (let r = 4; r < 19; r += 3) { ctx.strokeStyle = r % 2 ? 'rgba(90,180,220,0.45)' : 'rgba(150,220,240,0.5)'; ctx.lineWidth = 1.3 * Sc; ctx.beginPath(); ctx.arc(c[0], c[1], r * Sc, 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(40,120,170,0.55)'; ctx.lineWidth = 0.6 * Sc; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; ctx.beginPath(); ctx.moveTo(c[0] + Math.cos(a) * 4 * Sc, c[1] + Math.sin(a) * 4 * Sc); ctx.quadraticCurveTo(c[0] + Math.cos(a + 0.6) * 12 * Sc, c[1] + Math.sin(a + 0.6) * 12 * Sc, c[0] + Math.cos(a + 1.1) * 19 * Sc, c[1] + Math.sin(a + 1.1) * 19 * Sc); ctx.stroke(); }
    // the shower straight: a slate-blue wet floor with drain channels at both edges
    for (let s = S.shower - 40; s < S.shower + 40; s += 2) { const gg = T.at(s, {}); for (const sd of [1, -1]) { const q = P(gg.x + gg.nx * sd * (gg.hw - 1.2), gg.z + gg.nz * sd * (gg.hw - 1.2)); ctx.fillStyle = 'rgba(60,110,150,0.4)'; ctx.fillRect(q[0] - 0.5 * Sc, q[1] - 0.5 * Sc, 1.0 * Sc, 1.0 * Sc); } }
    // the bath mat under the grid: pink and fluffy (soft dots)
    for (let s = T.L - 70; s < T.L + 4; s += 1.6) { const gg = T.at(s % T.L, {}); for (let d = -gg.hw - 2; d <= gg.hw + 2; d += 1.6) { const q = P(gg.x + gg.nx * d, gg.z + gg.nz * d); ctx.fillStyle = `rgba(255,${140 + Math.floor((Math.abs(d * 7 + s * 3) % 40))},200,0.22)`; ctx.beginPath(); ctx.arc(q[0], q[1], 0.9 * Sc, 0, TAU); ctx.fill(); } }
  });
  // ---- barriers: aqua and white rails, pink and white rubber rings on the tight bends; gaps for the soap dishes ----
  E.btm.gaps = [];
  // ---- the soap slide: three dishes either side of the east straight ----
  E.btm.soaps = [];
  for (let i = 0; i < 3; i++) {
    const s = S.soap + i * 29, g = T.at(s, {});
    E.btm.soaps.push({ i, s, x: g.x, z: g.z, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, yaw: g.yaw, hw: g.hw, wl: g.wl, wr: g.wr });
    for (const sd of [1, -1]) { const p = side(s, sd, 2.2); CartScene.mesh(api, p.x, p.z, p.yaw, m => btmSoapDish(m, BTM_SOAP_COL[i]), { hi: true }); taken.push([p.x, p.z, 5]); }
    E.btm.gaps.push([s, 5]);
    api.sign('SOAP\nSLIDE', ...(() => { const p = side(s - 9, i % 2 ? 1 : -1, 1.5); return [p.x, p.z]; })(), { yaw: g.yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3, style: { bg: '#ff8ac0', fg: '#ffffff', border: '#ffffff' } });
  }
  btmRails(E, T, (i, tight) => tight ? (i % 2 ? '#ffffff' : '#ff7ab4') : (Math.floor(i / 2) % 2 ? '#ffffff' : '#4ac8e8'), E.btm.gaps);
  CartKit.kinds(E, BTM_KINDS);
  // ---- the start: the towel-rail gate, the name, grandstands, rubber ducks lining the straight ----
  { const g = T.at(0, {}), Wd = g.wl + g.wr + 5;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => btmTowelGate(m, Wd), { hi: true });
    api.sign('BATH TIME', g.x, g.z, { yaw: g.yaw + Math.PI, h: 2.0, y: 15.6, post: false, maxW: 10, style: { bg: '#ffffff', fg: '#2a8ac8', border: '#ff8ac0' } });
    for (const sd of [1, -1]) { const p = side(14, sd, 6); E.spots.push(...CartScene.bleachers(api, p.x, p.z, p.yaw, 22, 3, rng)); taken.push([p.x, p.z, 16]); } }
  for (let s = -120, k = 0; s < 110; s += 9, k++) { const sp = ((s % T.L) + T.L) % T.L; for (const sd of [1, -1]) { if (Math.abs(s - 14) < 16) continue; const p = side(sp, sd, 3.2 + (k % 2) * 1.2); CartKit.put(E, 'btm_duck', p.x, p.z, p.yaw + (k % 3 - 1) * 0.3, ['#ffd23a', '#ffd23a', '#ff9ac8', '#7ad8f0', '#ffd23a', '#9af0c0'][(k + (sd > 0 ? 3 : 0)) % 6], { scale: 1 + (k % 3) * 0.15 }); } }
  CartKit.crowd(E, T, (T.L - 100) % T.L, T.L - 30, -1, rng, { rows: 1, off: 7, gap: 2.4 });
  // ---- the bubble chicane: two machines on the outside of the S ----
  E.btm.machines = [];
  for (const [s, sd, col] of [[S.chic0, 1, '#9af0ff'], [S.chic1, -1, '#ffb0d8']]) {
    const g = T.at(s, {}), out = sd, p = side(s, out, 4.5);
    CartScene.mesh(api, p.x, p.z, p.yaw, m => btmBubbleBase(m, col), { hi: true }); taken.push([p.x, p.z, 7]);
    E.btm.machines.push({ s, sd: out, x: p.x, z: p.z, yaw: p.yaw, wx: p.x + Math.sin(p.yaw) * -0.3, wz: p.z + Math.cos(p.yaw) * -0.3, d0: out > 0 ? g.wr + 4.5 : -g.wl - 4.5 });
    api.sign('BUBBLE\nTROUBLE', ...(() => { const q = side(s - 26, out, 1.5); return [q.x, q.z]; })(), { yaw: g.yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.2, style: { bg: '#7ad8f0', fg: '#ffffff', border: '#ffffff' } });
  }
  // ---- the plughole plaza: the drain, the plug's chain post, crowds behind the barriers ----
  { const g = T.at(S.plaza, {}); CartScene.mesh(api, g.x, g.z, g.yaw, btmDrain, { hi: true, noAO: true });
    E.btm.drain = { s: S.plaza, x: g.x, z: g.z, yaw: g.yaw, nx: g.nx, nz: g.nz, hw: g.hw };
    for (const sd of [1, -1]) { const p = side(S.plaza, sd, 1.5); api.sign('PLUG\nHOLE', p.x, p.z, { yaw: g.yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3, style: { bg: '#2a8ac8', fg: '#ffffff', border: '#ffffff' } }); }
    CartKit.crowd(E, T, S.plaza - 30, S.plaza + 30, 1, rng, { rows: 2, off: 4 }); CartKit.crowd(E, T, S.plaza - 30, S.plaza + 30, -1, rng, { rows: 2, off: 4 }); taken.push([g.x, g.z, 36]); }
  // ---- the shower storm: three rigs over the west straight, pipes on the outside ----
  E.btm.heads = [];
  for (let i = 0; i < 3; i++) {
    const s = S.shower - i * 24, g = T.at(s, {}), sd = 1, p = side(s, sd, 1.6), reach = g.wr + 1.6;
    CartScene.mesh(api, p.x, p.z, Math.atan2(g.nz * sd, -g.nx * sd), m => btmShowerRig(m, reach), { hi: true }); taken.push([p.x, p.z, 3]);
    E.btm.heads.push({ i, s, x: g.x, z: g.z, yaw: g.yaw, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, hw: g.hw });
  }
  { const p = side(S.shower + 14, -1, 1.5); api.sign('SHOWER\nSTORM', p.x, p.z, { yaw: T.at(S.shower + 14, {}).yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.2, style: { bg: '#4a8af0', fg: '#ffffff', border: '#ffffff' } }); }
  // ---- the infield: THE TUB, the sponge, the mug of toothbrushes, the towels ----
  CartScene.mesh(api, -20, 25, 0, btmTub, { hi: true }); taken.push([-20, 25, 50]);
  CartScene.mesh(api, 110, -55, 0.3, m => btmSponge(m, '#ffd84a'), { hi: true }); taken.push([110, -55, 10]);
  CartScene.mesh(api, 150, 60, 0, btmMug, { hi: true }); taken.push([150, 60, 8]);
  CartScene.mesh(api, -150, 20, 0.5, btmTowels, { hi: true }); taken.push([-150, 20, 9]);
  CartScene.mesh(api, -40, 118, 0.15, btmTube, { hi: true }); taken.push([-40, 118, 14]);
  // ---- outside: more giant toiletries, the room's tiled walls ----
  CartScene.mesh(api, 40, -150, -0.4, btmTube, { hi: true }); taken.push([40, -150, 14]);
  CartScene.mesh(api, -255, 140, 0.9, m => btmSponge(m, '#ff9ac8'), { hi: true }); taken.push([-255, 140, 10]);
  CartScene.mesh(api, 280, -60, -0.3, btmTowels, { hi: true }); taken.push([280, -60, 9]);
  { const b = T.bounds; CartScene.mesh(api, (b.x0 + b.x1) / 2, b.z1 + 76, Math.PI, m => btmWall(m, b.x1 - b.x0 + 160, 130), { noAO: true }); CartScene.mesh(api, b.x1 + 76, (b.z0 + b.z1) / 2, -Math.PI / 2, m => btmWall(m, b.z1 - b.z0 + 160, 130), { noAO: true }); }
  // bottles, foam drifts and ducks fill the rest of the roadside
  const BCOL = ['#ff8ac0', '#7ad8f0', '#b48cff', '#7aeec0', '#ffd23a', '#ff9a6a'];
  for (let s = 30, k = 0; s < T.L; s += 22, k++) {
    const sd = k % 2 ? 1 : -1, p = side(s, sd, 5 + (k % 3) * 2.5), free = taken.every(q => Math.hypot(q[0] - p.x, q[1] - p.z) > q[2] + 3);
    if (!free || !CartWorlds.clear(T, p.x, p.z, 3)) continue;
    const kind = k % 4 === 0 ? 'btm_bottle' : k % 4 === 2 ? 'btm_duck' : 'btm_foam';
    CartKit.put(E, kind, p.x, p.z, p.yaw + (kind === 'btm_bottle' ? 0.4 * sd : 0), kind === 'btm_foam' ? ['#ffffff', '#ffe0f0', '#e0f6ff'][k % 3] : kind === 'btm_duck' ? ['#ffd23a', '#ff9ac8', '#7ad8f0'][k % 3] : BCOL[k % BCOL.length], { scale: kind === 'btm_duck' ? 1.6 : 1 + (k % 2) * 0.25 });
  }
  // a few more bottles in a cluster by the soap slide and in the infield
  for (const [x, z, c, sc] of [[255, 10, 0, 1.3], [262, 22, 1, 1.0], [250, 30, 2, 1.15], [60, 40, 3, 1.4], [70, 30, 1, 1.1], [-110, -40, 4, 1.3], [-100, -52, 5, 1.0], [-120, 70, 2, 1.2]]) if (CartWorlds.clear(T, x, z, 4)) CartKit.put(E, 'btm_bottle', x, z, x * 0.1, BCOL[c], { scale: sc });
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, x = -20 + Math.cos(a) * 58, z = 25 + Math.sin(a) * 31; if (CartWorlds.clear(T, x, z, 3)) CartKit.put(E, i % 3 ? 'btm_foam' : 'btm_duck', x, z, a, i % 3 ? '#ffffff' : '#ffd23a', { scale: i % 3 ? 1.3 : 1.8 }); }
  // gift rows, boost pads (two on the plaza's edges: the line round the plughole pays), the grid
  const f = s => (((s % T.L) + T.L) % T.L) / T.L;
  CartKit.gifts(E, T, [f(sOf(60, -106)), f(sOf(178, 132)), f(sOf(-140, 135)), f(sOf(-213, -10))]);
  CartKit.boosts(E, T, [[f(S.plaza), 0.72], [f(S.plaza), -0.72], [f(sOf(-90, -102)), 0.3]]);
  CartKit.grid(E, T);
  return CartKit.finish(E);
}
// the centre line: a row of little soap bubbles every 6 m
function btmPaintCenter(ctx, P, S, T) {
  for (let s = 0; s < T.L; s += 6) { const g = T.at(s, {}), q = P(g.x, g.z); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.18 * S; ctx.beginPath(); ctx.arc(q[0], q[1], 0.55 * S, 0, TAU); ctx.stroke(); const q2 = P(g.x + g.tx * 1.4 + g.nx * 0.5, g.z + g.tz * 1.4 + g.nz * 0.5); ctx.beginPath(); ctx.arc(q2[0], q2[1], 0.3 * S, 0, TAU); ctx.stroke(); }
}
// the kit's rails with gaps (the soap bars skid through the barrier line): gaps = [[s, halfLength]]
function btmRails(E, T, pal, gaps) {
  CartDecor.protos(E);
  const step = 7;
  for (let s = 0; s < T.L; s += step) {
    if (gaps.some(q => Math.abs(CartKit.ds(T, s, q[0])) < q[1])) continue;
    const g = T.at(s, {}), tight = Math.abs(g.k) > 0.012, i = Math.floor(s / step);
    for (const sd of [1, -1]) { const off = sd > 0 ? g.wr : -g.wl; CartDecor.put(E, tight ? 'tyres' : 'rail', g.x + g.nx * off, g.z + g.nz * off, g.yaw, pal(i, tight, sd), { y: 0, noLights: true, k: 1 }); }
  }
}

/* ---------------- the moving things (one pooled group) ---------------- */
const BtmMesh = {
  // a giant bar of soap (rounded, glossy, an inset top with a little duck stamped on it, suds on top)
  soap(m, i) {
    const c = BTM_SOAP_COL[i % 3];
    m.color(c).shine(4); m.roundBox(0, 0.85, 0, 2.8, 1.7, 4.8, 0.75);
    m.color('#ffffff', 0.05).shine(3); m.roundBox(0, 1.66, 0, 1.9, 0.12, 3.6, 0.06); m.emissive(0);
    m.color(c).shine(3); m.push(); m.tf(0, 1.68, 0.2, 0, 0, 0, 0.55, 0.12, 0.55); btmDuck(m, c, c, true); m.pop();
    m.color('#ffffff').shine(1); for (const [x, z, r] of [[0.7, -1.5, 0.42], [0.4, -1.9, 0.3], [-0.6, 1.6, 0.36], [-0.3, 1.9, 0.25]]) m.ball(x, 1.75, z, r, { seg: 8, rings: 6 });
    m.shine(0);
  },
  // a big chrome shower head facing down (the nozzles' face at y 0)
  head(m) {
    m.color('#e8eef4').shine(4); m.lathe([[0.45, 1.6], [0.5, 0.9], [2.0, 0.25], [2.6, 0.1], [2.6, 0]], { seg: 28 });
    m.color('#cfd8e0').shine(3); m.push(); m.tf(0, -0.01, 0, 0, Math.PI, 0); m.disc(0, 0, 0, 2.55, 28); m.pop();
    m.color('#3a4a5a'); for (let r = 0.5; r < 2.3; r += 0.55) { const n = Math.round(r * 7); for (let j = 0; j < n; j++) { const a = j / n * TAU; m.push(); m.tf(Math.sin(a) * r, -0.03, Math.cos(a) * r, 0, Math.PI, 0); m.disc(0, 0, 0, 0.12, 6); m.pop(); } }
    m.color('#e8eef4').shine(4); m.ball(0, 1.6, 0, 0.55, { seg: 10, rings: 8 });
    m.shine(0);
  },
  // the plug: a fat rubber stopper with a brass ring on top for the chain
  plug(m) {
    m.color('#2a3a4a').shine(2); m.lathe([[2.5, 0], [2.9, 0.8], [2.85, 1.0], [0, 1.0]], { seg: 24 });
    m.color('#f0c050').shine(4); m.ball(0, 1.05, 0, 0.5, { seg: 10, rings: 8 }); m.push(); m.tf(0, 1.9, 0, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.7, 0.16, { seg: 16, tseg: 5 }); m.pop();
    m.shine(0);
  },
  // a bubble wand wheel (in its local x-y plane, facing +z): a hub, six spokes, six wand loops
  wheel(m) {
    m.color('#ffffff').shine(3); m.push(); m.tf(0, 0, 0, 0, Math.PI / 2, 0); m.roundCyl(0, -0.3, 0, 0.7, 0.6, 0.2); m.pop();
    const C = ['#ff8ac0', '#ffd23a', '#7ad8f0', '#b48cff', '#7aeec0', '#ff9a6a'];
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, x = Math.sin(a), y = Math.cos(a); m.color('#ffffff').shine(3); m.limb(x * 0.6, y * 0.6, 0.1, x * 2.4, y * 2.4, 0.1, 0.12, 0.1, { seg: 6 }); m.color(C[i]).shine(3); m.push(); m.tf(x * 3.2, y * 3.2, 0.1, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.85, 0.13, { seg: 16, tseg: 5 }); m.pop(); }
    m.shine(0);
  },
  // a little rubber duck (the whirlpool spins them round the drain)
  ducky(m) { btmDuck(m, '#ffd23a', '#ff8a2a', true); }
};

/* ---------------- the rules: hazards at run time ---------------- */
const BTM_SOAP = { period: 8.0, warn: 1.3, speed: 20, half: 1.5, len: 2.5, puddleR: 2.2, life: 4.4, lanes: [-7.5, -3.75, 0, 3.75, 7.5] };
const BTM_BUB = { gap: 4.0, r: 2.0, speed: 3.6, n: 14 };
const BTM_SHOWER = { period: 4.8, warn: 1.4, pour: 1.9, half: 8 };
const BTM_WHIRL = { period: 12.5, warn: 1.7, spin: 5.0, R: 12.5, core: 2.8, pull: 26, swirl: 10 };
const BTM_PUDDLES = 12, BTM_DUCKIES = 4;
CART_TRACK_RULES.bathtime = {
  onLoad(s) {
    const E = s.E, B = E.btm, T = s.T || s.TR;
    const G = CartKit.group(s, [['soaps', BtmMesh.soap, 3], ['heads', BtmMesh.head, 3], ['plug', BtmMesh.plug, 1], ['wheels', BtmMesh.wheel, 2], ['duckies', BtmMesh.ducky, BTM_DUCKIES]]);
    const L = s.btm = { G, rng: mulberry32(4242), soaps: [], puddles: [], machines: [], bubbles: [], heads: [], whirl: null, blind: 0, said: {}, hintT: -9 };
    B.soaps.forEach((q, i) => L.soaps.push(Object.assign({}, q, { st: 'rest', t: -i * 2.3, sd: i % 2 ? 1 : -1, d: 0, mask: 0, lanes: [0, 0], li: 0, obj: G.soaps[i] })));
    for (const b of L.soaps) b.d = b.sd > 0 ? b.wr + 2.2 : -b.wl - 2.2;
    for (let i = 0; i < BTM_PUDDLES; i++) L.puddles.push({ live: false, t: 0, x: 0, z: 0, s: 0, d: 0, mask: 0, r: BTM_SOAP.puddleR, rot: i * 1.3 });
    B.machines.forEach((q, i) => L.machines.push(Object.assign({}, q, { t: i * 1.3, spin: 0, obj: G.wheels[i] })));
    for (let i = 0; i < BTM_BUB.n; i++) L.bubbles.push({ live: false, t: 0, s: 0, d: 0, vd: 0, ds: 0, x: 0, y: 0, z: 0, y0: 0, r: BTM_BUB.r, end: 0, ph: i * 0.9 });
    B.heads.forEach((q, i) => L.heads.push(Object.assign({}, q, { off: i * 1.6, st: 'idle', u: 0, sd: 1, c: -1, mask: 0, obj: G.heads[i] })));
    const dr = B.drain; L.whirl = Object.assign({}, dr, { st: 'calm', u: 0, c: -1, mask: 0, hitMask: 0, plugY: 0, obj: G.plug[0], ducks: G.duckies, ang: 0 });
    CartKit.state(s);
  },
  onUpdate(s, dt, racing) {
    const L = s.btm; if (!L) return;
    btmSoaps(s, L, dt, racing); btmPuddles(s, L, dt, racing); btmBubbles(s, L, dt, racing); btmShowers(s, L, dt, racing); btmWhirl(s, L, dt, racing);
    if (L.blind > 0) L.blind = Math.max(0, L.blind - dt);
  },
  // the AI: ease off for a sliding bar, hop a slick it can't steer round (by skill); the rest is cartIxObs steering
  onStep(s, k, dt, racing) {
    const L = s.btm; if (!L || k.player && !s.autoDrive || !racing || !s.T || k.out) return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9, luck = ((k.slot * 7 + Math.floor(s.time * 0.5)) % 10) / 10;
    for (const b of L.soaps) {
      if (b.st === 'rest') continue;
      const ds = CartKit.ahead(s, k, b.s); if (ds < 2 || ds > 42) continue;
      const ta = ds / Math.max(6, k.speed), dir = -b.sd, edge = Math.max(b.wl, b.wr) + 2.2;
      const delay = b.st === 'warn' ? BTM_SOAP.warn - b.t : 0, pd = b.d + dir * Math.max(0, ta - delay) * BTM_SOAP.speed, pdc = dir > 0 ? Math.min(pd, edge) : Math.max(pd, -edge);
      if (Math.abs(pdc - k.loc.d) < 4.5 && luck < 0.45 + (sk - 0.85) * 3) { if (k.speed > 10) I.gas = 0; if (k.speed > 17) I.brake = 0.5; break; }
    }
    for (const p of L.puddles) {
      if (!p.live) continue; const ds = CartKit.ahead(s, k, p.s);
      if (ds > 1 && ds < Math.max(4, k.speed * 0.22) && Math.abs(p.d - k.loc.d) < p.r + 1 && !k.air && luck < 0.35 + (sk - 0.85) * 3) { I.driftPress = true; I.drift = false; break; }
    }
  },
  draw(s, R, S, t) { const L = s.btm; if (L) btmDraw(s, L, R, S, t); },
  lights(s, add) {
    const L = s.btm; if (!L) return;
    const W = L.whirl; if (W.st !== 'calm') add(W.x, 2, W.z, 18, BTM_C.aqua, 0.9, 1);
  },
  hud(s, ctx, W, H, top, left) {
    const L = s.btm, p = s.player; if (!L || !p) return;
    // soaked: water sheeting down the screen, rivulets and drops, clearing from the middle
    if (L.blind > 0) {
      const a = Math.min(1, L.blind * 1.1), tt = s.time; ctx.save();
      ctx.fillStyle = `rgba(120,180,230,${0.22 * a})`; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 60; i++) { const x = ((i * 97) % 100) / 100 * W, sp = 0.35 + (i % 7) * 0.08, u = (i * 0.618 + tt * sp) % 1, y = u * (H + 80) - 40, len = 26 + (i % 5) * 14, cx = (x - W / 2) / W, cy = (y - H / 2) / H, far = Math.min(1, Math.hypot(cx, cy) * 2.6);
        ctx.globalAlpha = a * (0.25 + 0.75 * far); ctx.strokeStyle = i % 3 ? 'rgba(220,240,255,0.9)' : 'rgba(150,200,255,0.9)'; ctx.lineWidth = 2 + (i % 3); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(i) * 3, y + len); ctx.stroke();
        ctx.fillStyle = 'rgba(235,248,255,0.9)'; ctx.beginPath(); ctx.arc(x + Math.sin(i) * 3, y + len, 3 + (i % 3), 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // first-lap hints as each hazard comes up
    const hint = (key, sv, text, sub) => { if (L.said[key] || p.lap > 1) return; const ds = CartKit.ds(s.T, p.loc.s, sv); if (ds > 0 && ds < 75) { L.said[key] = true; L.hintT = s.time; s.banner(text, '#1e6ad8', 2.0, sub); } };
    if (s.state === 'race' && s.T) { const S = s.E.btm.S; hint('soap', S.soap, 'SOAP SLIDE!', 'let the bars pass, steer round the slicks'); hint('bubbles', S.chic0, 'BUBBLE TROUBLE!', 'steer round the bubbles'); hint('plug', S.plaza, 'THE PLUGHOLE!', 'keep to the edge when it swirls'); hint('shower', S.shower, 'SHOWER STORM!', 'drive on the dry side'); }
  }
};
const btmBanner = (s, L, k, text, sub) => { if (k.player && !(s.time - L.hintT < 2.3)) s.banner(text, '#ff8ac0', 1.0, sub, true); };

// ---- the soap bars: rest in a dish, wiggle (warning), skid across the road dropping slicks, rest on the far side ----
function btmSoaps(s, L, dt, racing) {
  const C = BTM_SOAP;
  for (const b of L.soaps) {
    const edge = (b.sd > 0 ? b.wr : b.wl) + 2.2, far = (b.sd > 0 ? b.wl : b.wr) + 2.2;
    b.t += dt;
    if (b.st === 'rest') { b.d = b.sd * edge; if (b.t > C.period - C.warn - 1.3) { b.st = 'warn'; b.t = 0; b.mask = 0; const lanes = BTM_T.lanes; lanes.length = 0; for (const v of C.lanes) lanes.push(v); for (let j = 0; j < 2; j++) { const pick = Math.floor(L.rng() * lanes.length); b.lanes[j] = lanes.splice(pick, 1)[0]; } b.lanes.length = 2; b.lanes.sort((x, y) => b.sd > 0 ? y - x : x - y); b.li = 0; if (CartKit.near(s, b.x, b.z, 60)) cartIxSound(s, 'cartBubble', b.x, b.z, 0.5, 0.7); } }
    else if (b.st === 'warn') { b.d = b.sd * edge; if (b.t > C.warn) { b.st = 'slide'; b.t = 0; CartKit.fired(s, 'soapbar'); if (CartKit.near(s, b.x, b.z, 70)) { cartIxSound(s, 'kartDrift', b.x, b.z, 0.8, 0.6); cartIxSound(s, 'splash', b.x, b.z, 0.4, 1.4); } } }
    else {
      const dir = -b.sd; b.d += dir * C.speed * dt;
      // drop the slicks as the bar passes their lanes
      while (b.li < b.lanes.length && dir * (b.d - b.lanes[b.li]) >= 0) { btmSpawnPuddle(s, L, b, b.lanes[b.li]); b.li++; }
      if (dir * b.d >= far) { b.d = dir * far; b.st = 'rest'; b.t = 0; b.sd = dir; if (CartKit.near(s, b.x, b.z, 50)) cartIxSound(s, 'bump', b.x, b.z, 0.5, 0.6); }
      const x = b.x + b.nx * b.d, z = b.z + b.nz * b.d;
      if (Math.abs(b.d) < Math.max(b.wl, b.wr)) cartIxObs(s, x + b.nx * dir * 3, z + b.nz * dir * 3, 3.2);
      if (racing) for (const k of s.karts) {
        if (k.out || (b.mask & (1 << k.slot)) || (k.air && k.y > s.terrain.height(k.x, k.z) + 1.4)) continue;
        const dx = k.x - x, dz = k.z - z, along = dx * b.tx + dz * b.tz, across = dx * b.nx + dz * b.nz;
        if (Math.abs(along) > C.len + 1.1 || Math.abs(across) > C.half + 1.1) continue;
        b.mask |= 1 << k.slot;
        if (CartKit.hit(s, k, 'knock', 'soapbar', { dx: b.nx * dir, dz: b.nz * dir, power: 11, dur: 0.9, banner: 'SOAP BAR!' })) { cartIxSound(s, 'bump', k.x, k.z, 0.9, 0.8); if (s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'ring', 10, '#ffffff'); }
      }
    }
    if (b.st === 'warn') { for (let r = -1; r <= 1; r++) { const dd = b.d - b.sd * (4 + (r + 1) * 6); cartIxObs(s, b.x + b.nx * dd, b.z + b.nz * dd, 2.4); } }
    const o = b.obj; if (o) { const wig = b.st === 'warn' ? Math.sin(s.time * 34) * 0.12 * (0.4 + b.t / C.warn) : 0; o.live = true; o.visible = true; o.x = b.x + b.nx * b.d + b.tx * wig; o.z = b.z + b.nz * b.d + b.tz * wig; o.y = s.terrain.height(o.x, o.z) + (b.st === 'rest' || b.st === 'warn' ? 0.62 : 0.02); o.yaw = b.yaw + (b.st === 'slide' ? Math.sin(s.time * 6) * 0.08 : wig * 0.5); o.pitch = 0; o.roll = b.st === 'warn' ? wig * 0.6 : 0; o.scale = 1; }
  }
}
function btmSpawnPuddle(s, L, b, d) {
  let p = null; for (const q of L.puddles) if (!q.live) { p = q; break; } if (!p) { p = L.puddles[0]; for (const q of L.puddles) if (q.t > p.t) p = q; }
  const T = s.T || s.TR, sv = b.s + (L.rng() - 0.5) * 2.5, g = T.at(sv, BTM_T.at2);
  p.live = true; p.t = 0; p.s = sv; p.d = d; p.x = g.x + g.nx * d; p.z = g.z + g.nz * d; p.mask = 0; p.rot = L.rng() * TAU;
  CartKit.fired(s, 'soapslick');
}
function btmPuddles(s, L, dt, racing) {
  for (const p of L.puddles) {
    if (!p.live) continue; p.t += dt;
    if (p.t > BTM_SOAP.life) { p.live = false; continue; }
    cartIxObs(s, p.x, p.z, p.r + 1.2);
    if (racing) for (const k of s.karts) {
      if (k.out || k.air || (p.mask & (1 << k.slot))) continue;
      if ((k.x - p.x) ** 2 + (k.z - p.z) ** 2 > (p.r + 0.7) ** 2) continue;
      p.mask |= 1 << k.slot;
      if (CartKit.hit(s, k, 'slip', 'soapslick', { banner: 'SOAPY!' })) { k.yaw = cartWrap(k.yaw + (L.rng() - 0.5) * 0.6); if (s.fx && CartKit.near(s, p.x, p.z, 90)) s.fx.burst(k.x, k.y + 0.4, k.z, 'ring', 8, '#ffffff'); cartIxSound(s, 'kartDrift', k.x, k.z, 0.7, 1.4); }
    }
  }
}
// ---- the bubble machines: the wand wheel turns, a giant bubble floats off it and drifts slowly across the road ----
function btmBubbles(s, L, dt, racing) {
  const T = s.T || s.TR, C = BTM_BUB;
  for (const m of L.machines) {
    m.t += dt; m.spin += dt * 1.6;
    if (m.t > C.gap) {
      m.t = 0; let b = null; for (const q of L.bubbles) if (!q.live) { b = q; break; }
      if (b) {
        const g = T.at(m.s, BTM_T.at2);
        b.live = true; b.t = 0; b.s = m.s + (L.rng() - 0.5) * 16; b.d = m.d0 - m.sd * 1.5; b.vd = -m.sd * C.speed * (0.8 + L.rng() * 0.4); b.ds = (L.rng() - 0.5) * 1.6; b.end = -m.sd * (Math.max(g.wl, g.wr) + 3); b.y0 = 6.2; b.r = C.r * (0.85 + L.rng() * 0.3);
        CartKit.fired(s, 'bubble'); if (CartKit.near(s, m.x, m.z, 60)) cartIxSound(s, 'cartBubble', m.x, m.z, 0.5, 0.8 + L.rng() * 0.4);
      }
    }
    const o = m.obj; if (o) { o.live = true; o.visible = true; o.x = m.wx; o.z = m.wz; o.y = 6.2; o.yaw = m.yaw; o.pitch = 0; o.roll = m.spin; o.scale = 1; }
  }
  for (const b of L.bubbles) {
    if (!b.live) continue; b.t += dt;
    b.d += b.vd * dt; b.s += b.ds * dt;
    const g = T.at(b.s, BTM_T.at2), u = Math.min(1, b.t / 1.6);
    b.x = g.x + g.nx * b.d; b.z = g.z + g.nz * b.d; b.y = lerp(b.y0, 1.9, u * u * (3 - 2 * u)) + Math.sin(s.time * 2.2 + b.ph) * 0.25;
    if ((b.vd > 0 && b.d > b.end) || (b.vd < 0 && b.d < b.end)) { btmPop(s, b); continue; }
    if (u > 0.3 && Math.abs(b.d) < 10.5) cartIxObs(s, b.x, b.z, b.r + 0.9);   // only over the road: obstacles on the shoulder pin cars to the barrier
    if (racing && u > 0.5) for (const k of s.karts) {
      // a bubbled car is never caught again until it has driven on (no re-catch in place, however long it sits there)
      if (k.out || k.bubbleT > 0 || s.time < (k.btmBubT || 0) || (k.btmBubP !== undefined && k.prog < k.btmBubP + 40)) continue;
      if ((k.x - b.x) ** 2 + (k.z - b.z) ** 2 > (b.r + 1.0) ** 2 || k.y > b.y + b.r) continue;
      if (CartKit.hit(s, k, 'bubble', 'bubble', { banner: 'BUBBLED!' })) { k.btmBubT = s.time + 5.5; k.btmBubP = k.prog; btmPop(s, b); cartIxSound(s, 'pop', k.x, k.z, 0.8, 1.0); break; }
    }
  }
}
function btmPop(s, b) { b.live = false; if (s.fx && CartKit.near(s, b.x, b.z, 120)) { s.fx.burst(b.x, b.y, b.z, 'ring', 10, '#d8f4ff'); s.fx.spark(b.x, b.y, b.z, 6, '#ffffff', 4); } if (CartKit.near(s, b.x, b.z, 50)) cartIxSound(s, 'pop', b.x, b.z, 0.5, 1.3); }
// ---- the shower heads: shudder and drip over one half of the road (warning), pour, rest; the wet half alternates ----
function btmShowers(s, L, dt, racing) {
  const C = BTM_SHOWER, T = s.T || s.TR;
  for (const h of L.heads) {
    const tt = s.time + h.off, c = Math.floor(tt / C.period), ph = tt - c * C.period;
    h.sd = (c + h.i) % 2 ? 1 : -1;
    h.st = ph < C.warn ? 'warn' : ph < C.warn + C.pour ? 'pour' : 'idle'; h.u = h.st === 'warn' ? ph / C.warn : h.st === 'pour' ? (ph - C.warn) / C.pour : 0;
    if (h.st === 'pour' && h.c !== c) { h.c = c; h.mask = 0; CartKit.fired(s, 'shower'); if (CartKit.near(s, h.x, h.z, 70)) cartIxSound(s, 'splash', h.x, h.z, 0.8, 0.7); }
    if (h.st !== 'idle') for (let a = -1; a <= 1; a++) { const g = T.at(h.s + a * 5.5, BTM_T.at2); for (const dd of [2.6, 6.8]) cartIxObs(s, g.x + g.nx * h.sd * dd, g.z + g.nz * h.sd * dd, 2.6); }
    if (h.st === 'pour' && racing) for (const k of s.karts) {
      if (k.out || (h.mask & (1 << k.slot))) continue;
      const ds = CartKit.ds(T, h.s, k.loc.s); if (Math.abs(ds) > C.half) continue;
      if (h.sd > 0 ? k.loc.d < -0.8 : k.loc.d > 0.8) continue;
      h.mask |= 1 << k.slot;
      if (k.shieldT > 0) continue;
      k.slowT = Math.max(k.slowT, 1.1); k.vx *= 0.72; k.vz *= 0.72; k.lostT = Math.max(k.lostT || 0, 0.7);
      if (k.player) { L.blind = 1.4; Sound.play('splash', { vol: 0.8, pitch: 0.9 }); }
      CartKit.touch(s, k, 'shower', 'SOAKED!', '#7ad8f0');
    }
    const o = h.obj; if (o) { const shud = h.st === 'warn' ? Math.sin(s.time * 40) * 0.05 * (0.3 + h.u) : 0, tilt = h.st === 'idle' ? 0 : 0.32; o.live = true; o.visible = true; o.x = h.x; o.z = h.z; o.y = 11.6 + (h.st === 'pour' ? Math.sin(s.time * 30) * 0.04 : 0); o.yaw = h.yaw; o.pitch = shud; o.roll = h.sd * tilt + shud; o.scale = 1; }
  }
}
// ---- the plughole: calm; the plug is yanked out on its chain (warning); the whirlpool spins; the plug drops back ----
function btmWhirl(s, L, dt, racing) {
  const C = BTM_WHIRL, W = L.whirl, tt = s.time + 4, c = Math.floor(tt / C.period), ph = tt - c * C.period, calm = C.period - C.warn - C.spin;
  W.st = ph < calm ? 'calm' : ph < calm + C.warn ? 'warn' : 'spin'; W.u = W.st === 'warn' ? (ph - calm) / C.warn : W.st === 'spin' ? (ph - calm - C.warn) / C.spin : ph / calm;
  if (W.st === 'warn' && W.c !== c) { W.c = c; W.mask = 0; W.hitMask = 0; if (CartKit.near(s, W.x, W.z, 80)) { cartIxSound(s, 'cartGeyser', W.x, W.z, 0.6, 0.6); cartIxSound(s, 'kick', W.x, W.z, 0.5, 0.8); } }
  if (W.st === 'spin' && W.fc !== c) { W.fc = c; CartKit.fired(s, 'whirlpool'); if (CartKit.near(s, W.x, W.z, 80)) cartIxSound(s, 'wind', W.x, W.z, 0.7, 0.6); }
  W.ang += dt * (W.st === 'spin' ? 3.2 : W.st === 'warn' ? 1.2 * W.u : 0);
  if (W.st !== 'calm') cartIxObs(s, W.x, W.z, W.st === 'spin' ? 7.5 : 5.5);
  if (W.st === 'spin' && racing) {
    const fade = Math.min(1, W.u * 6, (1 - W.u) * 6);
    for (const k of s.karts) {
      if (k.out || k.air || k.bubbleT > 0) continue;
      const dx = W.x - k.x, dz = W.z - k.z, D = Math.hypot(dx, dz); if (D > C.R) continue;
      const f = Math.pow(1 - D / C.R, 0.6) * fade, nx = dx / (D || 1), nz = dz / (D || 1);
      k.vx += (nx * C.pull + nz * C.swirl) * f * dt; k.vz += (nz * C.pull - nx * C.swirl) * f * dt;
      if (!(W.mask & (1 << k.slot)) && D < C.R * 0.75) { W.mask |= 1 << k.slot; CartKit.touch(s, k, 'whirlpool', 'WHIRLPOOL!', '#7ad8f0'); }
      if (D < C.core && !(W.hitMask & (1 << k.slot))) { W.hitMask |= 1 << k.slot; if (CartKit.hit(s, k, 'whirl', 'plughole', { dur: 1.3, vy: 8, banner: 'DOWN THE PLUGHOLE!' })) { cartIxSound(s, 'splash', k.x, k.z, 0.9, 0.6); if (s.fx) s.fx.burst(k.x, k.y + 0.5, k.z, 'ring', 14, '#bfe8ff'); } }
    }
  }
  // the plug: sits in the drain, yanked up on the warning, hangs swaying, drops back with a plop
  const target = W.st === 'calm' ? (W.u < 0.06 ? lerp(13, 0, W.u / 0.06) : 0) : W.st === 'warn' ? Math.min(13, W.u * 40) : 13;
  if (W.prev === 'spin' && W.st === 'calm' && CartKit.near(s, W.x, W.z, 60)) cartIxSound(s, 'splash', W.x, W.z, 0.6, 1.2);
  W.prev = W.st; W.plugY = target;
  const o = W.obj; if (o) { o.live = true; o.visible = true; o.x = W.x + (W.plugY > 1 ? Math.sin(s.time * 1.3) * 0.6 : 0); o.z = W.z; o.y = W.plugY + 0.02; o.yaw = 0; o.pitch = W.plugY > 1 ? Math.sin(s.time * 1.1) * 0.12 : 0; o.roll = 0; o.scale = 1; }
  // rubber ducks caught in the whirl: they circle in toward the drain
  for (let i = 0; i < W.ducks.length; i++) {
    const d = W.ducks[i]; if (!d) continue; const on = W.st !== 'calm';
    d.live = on; d.visible = on; if (!on) continue;
    const r = W.st === 'warn' ? 11 - i * 0.6 : Math.max(1.2, (11 - i * 0.6) * (1 - W.u * 0.85)), a = W.ang * (1 + 6 / (r + 2)) + i * TAU / W.ducks.length;
    d.x = W.x + Math.cos(a) * r; d.z = W.z + Math.sin(a) * r; d.y = 0.05 - (W.st === 'spin' ? W.u * W.u * 0.4 : 0); d.yaw = -a; d.pitch = 0; d.roll = 0.15; d.scale = 0.75;
  }
}
// ---- sprites: the bars' paths, the slicks, the bubbles, the showers, the whirlpool ----
function btmDraw(s, L, R, S, t) {
  const C = BTM_C, cam = s.cam, T = s.T || s.TR, near = (x, z, r) => (x - cam.x) ** 2 + (z - cam.z) ** 2 < r * r;
  for (const b of L.soaps) {
    if (!near(b.x, b.z, 200)) continue;
    if (b.st === 'warn') {
      // the bar's path flashes pink across the road, chevrons pointing the way it will go
      const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 20)), dir = -b.sd, edge = Math.max(b.wl, b.wr) + 2;
      R.flat.flat(b.x, 0.09, b.z, edge * 2, BTM_SOAP.len * 2 + 1.2, b.yaw, S.square, C.hot, 0.55 * fl, false);
      for (let i = 0; i < 6; i++) { const u = ((i / 6 + t * 1.2) % 1), dd = b.sd * edge + dir * u * edge * 2; R.flat.flat(b.x + b.nx * dd, 0.11, b.z + b.nz * dd, 4.2, 4.2, Math.atan2(b.nx * dir, b.nz * dir), S.arrow, C.white, 0.95 * fl, false); }
      for (const sd of [-1, 1]) R.flat.flat(b.x + b.tx * sd * (BTM_SOAP.len + 0.6), 0.1, b.z + b.tz * sd * (BTM_SOAP.len + 0.6), edge * 2, 0.45, b.yaw, S.square, C.hot, 0.8 * fl, false);
      if (s.fx && Math.random() < 0.5) s.fx.add(b.x + b.nx * b.d, 1.9, b.z + b.nz * b.d, (Math.random() - 0.5) * 2, 2 + Math.random() * 2, (Math.random() - 0.5) * 2, 0.8, 0.5, 0.2, BTM_C.foam, 0.9, 'bubble', 0, 0, 0);
    } else if (b.st === 'slide') {
      const x = b.x + b.nx * b.d, z = b.z + b.nz * b.d, dir = -b.sd;
      for (let i = 1; i <= 4; i++) R.bbs.bb(x - b.nx * dir * i * 1.3, 0.9, z - b.nz * dir * i * 1.3, 3.4 - i * 0.4, 2.2 - i * 0.3, S.foam || S.puff, C.foam, 0.8 - i * 0.15, false, t * 3 + i);
      R.flat.flat(x, 0.08, z, 4.2, 6.6, b.yaw, S.shadow, C.black, 0.35, false);
    }
  }
  for (const p of L.puddles) {
    if (!p.live || !near(p.x, p.z, 180)) continue;
    const a = Math.min(1, p.t * 5, (BTM_SOAP.life - p.t) * 1.5), w = p.r * 2.3 * Math.min(1, 0.4 + p.t * 3);
    R.flat.flat(p.x, 0.095, p.z, w * 1.22, w * 1.22, p.rot + 0.5, S.splat || S.puff, BTM_C.hot, 0.75 * a, false);   // a hot-pink rim: it reads on the bright floor
    R.flat.flat(p.x, 0.1, p.z, w, w, p.rot, S.splat || S.puff, C.white, 0.95 * a, false);
    R.flat.flat(p.x, 0.11, p.z, w * 0.8, w * 0.8, p.rot + 1, S.foam || S.bubble, BTM_C.deep, 0.75 * a, false);
    R.flat.flat(p.x, 0.115, p.z, w * 0.9, w * 0.9, t * 0.8 + p.rot, S.ring, BTM_C.lav, 0.9 * a, false);
    R.bbs.bb(p.x + Math.sin(t * 3 + p.rot) * 0.6, 0.6, p.z + Math.cos(t * 2 + p.rot) * 0.6, 1.2, 1.2, S.star, C.white, 0.7 * a * (0.5 + 0.5 * Math.sin(t * 7 + p.rot)), true, t);
  }
  for (const b of L.bubbles) {
    if (!b.live || !near(b.x, b.z, 200)) continue;
    const pop = Math.min(1, b.t * 3), sz = b.r * 2.3 * pop, gy = 0.1;
    R.bbs.bb(b.x, b.y, b.z, sz, sz, S.glow, BTM_C.bubbleFill, 0.45, false); R.bbs.bb(b.x, b.y, b.z, sz, sz, S.bubble, BTM_C.bubbleRim, 1, false);
    R.bbs.bb(b.x, b.y, b.z, sz * 0.96, sz * 0.96, S.ring, [0.85 + 0.15 * Math.sin(t * 2 + b.ph), 0.5 + 0.3 * Math.sin(t * 2.6 + b.ph + 2), 1], 0.8, false, t * 0.5 + b.ph);
    R.bbs.bb(b.x - b.r * 0.35, b.y + b.r * 0.4, b.z, sz * 0.22, sz * 0.22, S.glow, C.white, 0.9, true);
    R.flat.flat(b.x, gy, b.z, b.r * 2.2, b.r * 2.2, 0, S.shadow, C.black, 0.28 * pop, false);
    R.flat.flat(b.x, gy + 0.01, b.z, b.r * 2.6, b.r * 2.6, 0, S.ring, C.aqua, 0.5 * pop, false);
  }
  for (const m of L.machines) if (near(m.x, m.z, 160)) R.bbs.bb(m.wx, 6.2, m.wz, 8, 8, S.glow, C.aqua, 0.18, true);
  for (const h of L.heads) {
    if (!near(h.x, h.z, 200)) continue;
    const g0 = T.at(h.s, BTM_T.at), hx = h.x, hz = h.z;
    if (h.st === 'warn') {
      // the wet half flashes blue, drips fall
      const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 16));
      for (let a = -1; a <= 1; a++) { const g = T.at(h.s + a * BTM_SHOWER.half * 0.66, BTM_T.at2), d = h.sd * (g0.hw * 0.5 - 0.4); R.flat.flat(g.x + g.nx * d, 0.09, g.z + g.nz * d, g0.hw + 0.8, BTM_SHOWER.half * 0.66 - 0.4, g.yaw, S.square, C.blue, 0.5 * fl * (0.4 + h.u), false); }
      for (let i = 0; i < 5; i++) { const u = ((t * 1.6 + i * 0.37) % 1), ang = i * 2.4, rr = 1 + (i % 3) * 1.6, x = hx + h.nx * h.sd * rr * Math.cos(ang) * 1.8 + h.tx * rr * Math.sin(ang), z = hz + h.nz * h.sd * rr * Math.cos(ang) * 1.8 + h.tz * rr * Math.sin(ang); R.bbs.bb(x, 11.3 - u * 11, z, 0.35, 0.7, S.drop, C.water, 0.95, false); }
    } else if (h.st === 'pour') {
      // a torrent: streaks from the head to the wet half, splashes and mist on the road
      const a = Math.min(1, h.u * 6, (1 - h.u) * 5);
      for (let i = 0; i < 14; i++) { const along = ((i * 0.37) % 1 - 0.5) * BTM_SHOWER.half * 1.7, dd = h.sd * (0.5 + ((i * 0.618) % 1) * (g0.hw - 1)), g = T.at(h.s + along, BTM_T.at2), x = g.x + g.nx * dd, z = g.z + g.nz * dd; R.bbs.streak((x + hx) / 2, 5.8, (z + hz) / 2, x - hx, -11.2, z - hz, 11.6, 0.7, S.streak, i % 2 ? C.water : C.white, 0.55 * a); if (i % 2 === 0) R.bbs.bb(x, 0.8, z, 3, 1.6, S.puff, C.foam, 0.6 * a, false, t * 4 + i); }
      for (let a2 = -1; a2 <= 1; a2++) { const g = T.at(h.s + a2 * BTM_SHOWER.half * 0.66, BTM_T.at2), d = h.sd * (g0.hw * 0.5 - 0.4); R.flat.flat(g.x + g.nx * d, 0.09, g.z + g.nz * d, g0.hw + 0.8, BTM_SHOWER.half * 0.66 - 0.4, g.yaw, S.square, C.deep, 0.32 * a, false); R.flat.flat(g.x + g.nx * d, 0.1, g.z + g.nz * d, 7, 7, t * 2 + a2, S.ring, C.white, 0.5 * a, false); }
      if (s.fx && Math.random() < 0.6 && near(h.x, h.z, 90)) s.fx.add(hx + h.nx * h.sd * 4, 0.5, hz + h.nz * h.sd * 4, (Math.random() - 0.5) * 5, 3 + Math.random() * 3, (Math.random() - 0.5) * 5, 0.7, 0.4, 0.15, BTM_C.water, 0.9, 'drop', 0, 0, 0);
    }
  }
  const W = L.whirl;
  if (near(W.x, W.z, 220)) {
    if (W.st === 'warn') {
      const fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 14));
      for (let i = 0; i < 3; i++) { const u = 1 - ((W.u * 1.5 + i / 3) % 1), r = 4 + u * BTM_WHIRL.R; R.flat.flat(W.x, 0.1, W.z, r * 2, r * 2, W.ang, S.ring, C.aqua, 0.9 * (1 - u * 0.5) * fl, false); }
      R.flat.flat(W.x, 0.085, W.z, BTM_WHIRL.R * 2.1, BTM_WHIRL.R * 2.1, 0, S.glow, BTM_C.deep, 0.55 * W.u, false);
      R.flat.flat(W.x, 0.09, W.z, BTM_WHIRL.R * 2, BTM_WHIRL.R * 2, -W.ang * 2, S.swirl, BTM_C.navy, 0.85 * W.u, false);
      R.bbs.streak(W.x, (W.plugY + 26) / 2, W.z, 0, 1, 0, Math.max(1, 26 - W.plugY), 0.35, S.streak, [0.75, 0.6, 0.3], 0.95);
    } else if (W.st === 'spin') {
      const a = Math.min(1, W.u * 8, (1 - W.u) * 6), R0 = BTM_WHIRL.R;
      R.flat.flat(W.x, 0.075, W.z, R0 * 2.3, R0 * 2.3, 0, S.glow, BTM_C.deep, 0.95 * a, false);   // deep water under the swirl so it reads on the bright floor
      R.flat.flat(W.x, 0.08, W.z, R0 * 2.1, R0 * 2.1, -W.ang, S.swirl, BTM_C.navy, 1.0 * a, false);
      R.flat.flat(W.x, 0.085, W.z, R0 * 2.1, R0 * 2.1, -W.ang * 1.2 + 1.5, S.swirl, BTM_C.navy, 0.8 * a, false);
      R.flat.flat(W.x, 0.09, W.z, R0 * 1.5, R0 * 1.5, -W.ang * 1.6, S.swirl, C.aqua, 0.9 * a, false);
      R.flat.flat(W.x, 0.1, W.z, R0 * 0.8, R0 * 0.8, -W.ang * 2.4, S.swirl, C.white, 0.7 * a, false);
      R.flat.flat(W.x, 0.07, W.z, BTM_WHIRL.core * 2.6, BTM_WHIRL.core * 2.6, 0, S.shadow, C.black, 0.7 * a, false);
      R.flat.flat(W.x, 0.11, W.z, R0 * 2, R0 * 2, 0, S.ring, C.white, 0.6 * a, false);
      for (let i = 0; i < 10; i++) { const ang = -W.ang * (1 + (i % 3) * 0.4) + i * 0.63, r = 2.5 + ((i * 0.618 + W.u * 2) % 1) * (R0 - 2.5); R.bbs.bb(W.x + Math.cos(ang) * r, 0.5, W.z + Math.sin(ang) * r, 2.2, 1.2, S.foam || S.puff, C.foam, 0.8 * a, false, ang); }
      R.bbs.streak(W.x, (W.plugY + 26) / 2, W.z, 0, 1, 0, Math.max(1, 26 - W.plugY), 0.35, S.streak, [0.75, 0.6, 0.3], 0.95);
    }
  }
}

if (typeof window !== 'undefined') setTimeout(() => {
  // hazard screenshots (tools/cart_track_test.js reads debug.trackShots.bathtime: several career tracks load at once)
  // and the level's live state (debug.trackLevel.bathtime)
  const C = window.BRADY_CART; if (!C || !C.debug) return;
  const D = C.debug, NAMES = ['soap-warn', 'soap', 'slick', 'bubbles', 'shower-warn', 'shower', 'soaked', 'plug-warn', 'whirlpool', 'tub'];
  D.trackShots = D.trackShots || {};
  D.trackShots.bathtime = { list: () => NAMES.map(name => ({ name })), shot: name => btmShot(D, name) };
  D.trackLevel = D.trackLevel || {};
  D.trackLevel.bathtime = () => {
    const s = Game.scene; if (!s || !s.btm) return null;
    const K = s.kit || {}, L = s.btm;
    return { hits: K.hits || {}, touch: K.touch || {}, fired: K.fired || {}, L: s.T ? +s.T.L.toFixed(1) : 0, soaps: L.soaps.map(b => b.st), puddles: L.puddles.filter(p => p.live).length, bubbles: L.bubbles.filter(b => b.live).length, heads: L.heads.map(h => h.st + (h.sd > 0 ? '+' : '-')), whirl: L.whirl.st };
  };
}, 0);
function btmShot(D, name) {
  const STEP = 1 / 60;
  D.start({ mode: 'quick', track: 'bathtime', car: 'duck', driver: 'brady', seed: 9, autoGas: true });
  const s = D.scene(); s.state = 'race'; s.stateT = 0; window.BRADY.Input.setMode('game'); s.layoutControls(); s.update(STEP);
  const L = s.btm, T = s.T, P = s.player, B = s.E.btm;
  let pin = null; const pins = [];
  const park = (sv, lat, speed, frozen) => { const g = T.at(sv, {}); D.place(-1, g.x + g.nx * g.hw * lat, g.z + g.nz * g.hw * lat, g.yaw, { speed: speed || 0, frozen: false }); P.prevS = P.loc.s; P.lap = 1; P.prog = P.loc.s; pin = frozen ? { x: P.x, z: P.z, yaw: P.yaw } : null; };
  const rivals = list => { let j = 0; for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = list[j++] || [-300 - j * 12, 0, 1]; const g = T.at(P.loc.s + r[0], {}); D.place(i, g.x + g.nx * g.hw * r[1], g.z + g.nz * g.hw * r[1], g.yaw, { speed: r[2] ? 0 : 18, frozen: false }); if (r[2]) pins.push({ k, x: k.x, z: k.z, yaw: k.yaw }); k.prevS = k.loc.s; k.lap = 1; k.prog = k.loc.s; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } k.wpn.t = 99; } };
  s.autoDrive = true; if (!P.ai) s.aiInput(P, STEP, true); P.ai.itemT = 99; P.ai.fireT = 99; P.wpn.t = 99;
  const hold = () => { if (pin) { P.x = pin.x; P.z = pin.z; P.yaw = pin.yaw; P.vx = P.vz = 0; } for (const q of pins) { q.k.x = q.x; q.k.z = q.z; q.k.yaw = q.yaw; q.k.vx = q.k.vz = 0; } };
  const wait = (fn, secs) => { for (let i = 0; i < secs * 60; i++) { s.update(STEP); hold(); if (fn()) return true; } return false; };
  let ok = true;
  if (name === 'soap-warn' || name === 'soap' || name === 'slick') { const b = L.soaps[1]; park(b.s - 17, 0.15, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'soap-warn' ? b.st === 'warn' && b.t > 0.8 : name === 'soap' ? b.st === 'slide' && Math.abs(b.d) < 3 : L.puddles.some(p => p.live && p.t > 0.6 && Math.abs(CartKit.ds(T, p.s, b.s)) < 3), 16); }
  else if (name === 'bubbles') { const m = L.machines[0]; park(m.s - 26, 0, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => L.bubbles.filter(b => b.live && b.t > 1.6 && Math.abs(CartKit.ds(T, b.s, m.s)) < 14).length >= 2, 16); }
  else if (name === 'shower-warn' || name === 'shower' || name === 'soaked') { const h = L.heads[1]; park(h.s - (name === 'soaked' ? 0 : 22), name === 'soaked' ? 0.5 : 0, 0, true); rivals([[-50, 0, 1]]); ok = wait(() => name === 'shower-warn' ? h.st === 'warn' && h.u > 0.6 : name === 'shower' ? h.st === 'pour' && h.u > 0.25 : L.blind > 1.0, 12); if (name === 'soaked') ok = ok || L.blind > 0; }
  else if (name === 'plug-warn' || name === 'whirlpool') { park(L.whirl.s - 34, 0.1, 0, true); rivals([[-50, 0, 1]]); ok = wait(() => name === 'plug-warn' ? L.whirl.st === 'warn' && L.whirl.u > 0.6 : L.whirl.st === 'spin' && L.whirl.u > 0.3, 16); }
  else if (name === 'tub') { park(B.S.plaza + 60, 0, 20, false); rivals([[10, 0.3, 0], [16, -0.3, 0], [26, 0, 0]]); wait(() => false, 0.8); }
  s.snapCam = true; for (let i = 0; i < 4; i++) { D.step(1, 1); hold(); }
  return { ok, draws: s.stats.draws, tris: s.stats.tris, hits: (s.kit || {}).hits, p: [+P.x.toFixed(1), +P.z.toFixed(1), +P.loc.s.toFixed(1)] };
}
