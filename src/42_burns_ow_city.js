/* ============================================================
   BRADY GOES TO BURNING MAN — the open world: Black Rock City (world 500)
   A stylised, scaled Black Rock City you can walk, bike and ride across: the city arc from 2:00 to 10:00
   around the Man, the Esplanade and six lettered streets, radial streets every half hour, Center Camp at
   6:00, the Temple toward 12:00, open playa inside the arc, deep playa beyond the Man, the trash fence,
   Gate Road, the airport and Hell Station outside the fence.
   - The landmarks (theme camps, big art, the Man, the Temple, the 17 story places) are built once.
   - The neighbourhoods (RVs, tents, shade, small camps, people) stream in tiles around Brady (def.tiles).
   - The story worlds are places you enter (BurnsOpen): walk to the glowing marker and press ACTION.
   Layout: the Man at (0, 0); clock 6:00 points to +Z (the city), 12:00 to -Z (the Temple), 3:00 to +X.
   ============================================================ */

const BURNS_OW = {
  ID: 500,
  ESP: 300,                                      // Esplanade radius (m)
  RINGS: [300, 345, 390, 435, 480, 525, 570],    // Esplanade, then the lettered streets
  STREETS: ['Esplanade', 'Arcade', 'Bonfire', 'Carousel', 'Dreamer', 'Ember', 'Firefly'],
  OUTER: 585, FENCE: 860, GATE_Z: 0,             // GATE_Z is set from the fence below
  H0: 2, H1: 10,                                 // the city arc (clock hours)
  // clock math
  dir(h) { const a = h * Math.PI / 6; return [Math.sin(a), -Math.cos(a)]; },
  at(h, r) { const d = this.dir(h); return [d[0] * r, d[1] * r]; },
  clock(x, z) { let a = Math.atan2(x, -z); if (a < 0) a += TAU; return a / (Math.PI / 6); },
  yawIn(h) { return -h * Math.PI / 6; },          // facing the Man from clock h
  yawOut(h) { return Math.PI - h * Math.PI / 6; },
  hourName(h) { const hh = Math.floor(h + 1e-6), mm = Math.round((h - hh) * 60); return `${hh === 0 ? 12 : hh}:${mm < 10 ? '0' : ''}${mm}`; },
  state: null
};
BURNS_OW.FENCE_IN = BURNS_OW.FENCE * Math.cos(Math.PI / 5);   // the pentagon's inradius (its 6:00 edge)
BURNS_OW.GATE_Z = BURNS_OW.FENCE_IN;

/* ---------------- the 17 story places (story worlds you enter) ----------------
   world: the story world id; at: [x, z] of the door (built below); yaw: facing out of the door;
   name: shown on the marker and the ENTER prompt; short: the LEAVE button. */
BURNS_OW.PLACES = (() => {
  const O = BURNS_OW, P = (world, name, short, xz, yaw, kind) => ({ world, name, short, x: xz[0], z: xz[1], yaw, kind });
  const ring = (h, r) => O.at(h, r);
  return [
    P(1, 'Gate Road', 'Gate Road', [0, O.FENCE_IN + 40], 0, 'gate'),
    P(2, 'The Red Light RV', 'the RV', ring(5.55, 318), O.yawIn(5.55), 'rv'),
    P(16, 'Rhythm Wave', 'Rhythm Wave', ring(7, 446), O.yawIn(7), 'bamboo'),
    P(17, 'Root Society', 'Root Society', O.at(2, 330), O.yawIn(2), 'home'),   // moved to Brady's tipi when Root Society is built
    P(3, 'The Costume Camp', 'the costume camp', ring(8, 401), O.yawIn(8), 'costume'),
    P(4, 'The Orgy Dome', 'the dome', ring(3.5, 446), O.yawIn(3.5), 'odome'),
    P(5, 'Costco Soul Trading', 'Costco Soul Trading', ring(5, 356), O.yawIn(5), 'costco'),
    P(6, 'Deep Playa', 'deep playa', ring(12.5, 560), O.yawIn(12.5), 'deep'),
    P(11, 'The Sound Camps', 'the sound camps', ring(9.75, 292), O.yawIn(9.75), 'sound'),
    P(7, 'The Heart Car', 'the heart car', ring(1.6, 205), O.yawIn(1.6), 'heart'),
    P(8, 'Hell Station', 'Hell Station', [-70, O.FENCE_IN + 150], Math.PI / 2, 'hell'),
    P(9, 'The Deep-Playa Storm', 'the storm', ring(11, 640), O.yawIn(11), 'storm'),
    P(12, 'The Temple', 'the Temple', [0, -222], 0, 'temple'),
    P(13, 'The Workshops Camp', 'the workshops', ring(4, 491), O.yawIn(4), 'work'),
    P(14, 'The Airport', 'the airport', ring(4.75, 655), O.yawIn(4.75), 'airport'),
    P(10, 'The Man', 'the Man', [0, 24], 0, 'man'),
    P(15, 'Gate Road Out', 'Gate Road', [14, O.FENCE_IN + 300], 0, 'exodus')
  ];
})();

/* ---------------- the theme camps on the Esplanade (BurnsCamps) ----------------
   clock hour, the camp kind, and how far the camp's front sits behind the Esplanade */
BURNS_OW.CAMPS = [
  { kind: 'rootSociety', h: 2.0, front: 60, crowd: 0.5 },
  { kind: 'playground', h: 2.7, front: 40, crowd: 0.5 },
  { kind: 'deepEnd', h: 3.25, front: 15, crowd: 0.5 },
  { kind: 'spaceCowboys', h: 4.3, front: 27, crowd: 0.5 },
  { kind: 'centerCamp', h: 6.0, front: 29, crowd: 0.5 },
  { kind: 'solSystem', h: 7.55, front: 17, crowd: 0.5 },
  { kind: 'disorient', h: 8.6, front: 26, crowd: 0.5 },
  { kind: 'thunderdome', h: 9.0, front: 15, crowd: 0.5, r: 400 },
  { kind: 'campQuestionMark', h: 9.35, front: 23, crowd: 0.5 },
  { kind: 'opulentTemple', h: 10.0, front: 33, crowd: 0.5 }
];
// the neighbourhood people: a small pool of looks, all built while the city loads (no first-time model mid-game)
BURNS_OW.PEOPLE = [['burner', 1], ['burner', 5], ['burner', 17], ['furcoat', 2], ['furcoat', 8], ['tutu', 3], ['tutu', 11], ['ledsuit', 4], ['ledsuit', 9], ['sparklepony', 6], ['sparklepony', 13], ['furcoat', 19]];
// big art out on the open and deep playa (BurnsBigArt)
BURNS_OW.ART = [
  { kind: 'retroRocket', h: 2.6, r: 205 },
  { kind: 'glowshroomGrove', h: 4.1, r: 185 },
  { kind: 'lighthouses', h: 7.9, r: 195 },
  { kind: 'galleon', h: 1.0, r: 455 },
  { kind: 'pumpJack', h: 12.6, r: 430 },
  { kind: 'sleepingGiant', h: 11.1, r: 420 },
  { kind: 'knottedSemi', h: 11.6, r: 600 }
];

/* ---------------- regions (region-aware saves + missions: mission type 'reach' with region) ---------------- */
BURNS_OW.region = function (x, z) {
  const O = BURNS_OW, r = Math.hypot(x, z), h = O.clock(x, z);
  if (z > O.FENCE_IN - 4 && Math.abs(x) < 60) return z > O.FENCE_IN + 260 ? 'Gate Road Out' : 'Gate Road';
  if (O.outside(x, z)) return 'Outside the Fence';
  if (r < 40) return 'The Man';
  if (Math.hypot(x, z + 250) < 45) return 'The Temple';
  const inArc = h >= O.H0 - 0.05 && h <= O.H1 + 0.05;
  if (inArc && r >= O.ESP - 10 && r <= O.OUTER) {
    if (Math.abs(h - 6) < 0.35 && r < O.RINGS[2]) return 'Center Camp';
    const ring = O.RINGS.findIndex((R, i) => r < (O.RINGS[i + 1] || 1e9) - 22);
    const hh = Math.round(h * 2) / 2;
    return r < O.ESP + 14 ? `${O.hourName(hh)} & Esplanade` : `${O.hourName(hh)} & ${O.STREETS[Math.max(1, ring)]}`;
  }
  if (inArc && r > O.OUTER) return h > 4.4 && h < 5.2 ? 'The Airport' : 'Walk-in Camping';
  if (r < O.ESP - 10) return 'Open Playa';
  return 'Deep Playa';
};
// outside the trash fence? (a pentagon with a corner at 12:00)
BURNS_OW.outside = function (x, z) {
  const O = BURNS_OW;
  for (let k = 0; k < 5; k++) { const a = (k + 0.5) * TAU / 5, nx = Math.sin(a), nz = -Math.cos(a); if (x * nx + z * nz > O.FENCE_IN) return true; }
  return false;
};

/* ---------------- block layout ----------------
   A block sits between two radials half an hour apart and two rings. Camps, plazas and story places reserve the
   blocks they overlap; the tiles fill the rest with RVs, tents, shade, small camps and people. */
BURNS_OW.blocks = function () {
  const O = BURNS_OW; if (O._blocks) return O._blocks;
  const out = [];
  for (let k = 0; k + 1 < O.RINGS.length; k++) for (let h = O.H0; h < O.H1 - 1e-6; h += 0.5) {
    const r0 = O.RINGS[k] + (k === 0 ? 9 : 5.5), r1 = O.RINGS[k + 1] - 5.5, h0 = h + 0.035, h1 = h + 0.5 - 0.035;
    const rm = (r0 + r1) / 2, hm = (h0 + h1) / 2, c = O.at(hm, rm);
    out.push({ k, h, h0, h1, r0, r1, cx: c[0], cz: c[1], id: `b${k}_${Math.round(h * 2)}`, reserved: false });
  }
  O._blocks = out;
  return out;
};
BURNS_OW.reserve = function (x, z, rad) {
  const O = BURNS_OW;
  for (const b of O.blocks()) {
    // closest point of the block's (r, h) box to (x, z), in polar terms
    const r = Math.hypot(x, z), h = O.clock(x, z);
    const dr = Math.max(b.r0 - r, 0, r - b.r1), dh = Math.max(b.h0 - h, 0, h - b.h1) * Math.PI / 6 * Math.max(r, b.r0);
    if (Math.hypot(dr, dh) < rad) b.reserved = true;
  }
};

/* ---------------- builders ---------------- */
// pastel tints for the white tents, domes, shade and camp frontages (instanced copies multiply their colour by these)
const BURNS_OW_WARM = [1, 0.84, 0.6];   // warm-white string lights
const BURNS_OW_TINTS = [[1, 0.62, 0.38], [0.45, 0.86, 0.86], [1, 0.56, 0.8], [0.72, 0.58, 1], [1, 0.86, 0.42], [0.62, 0.95, 0.52], [0.5, 0.68, 1], [1, 0.48, 0.42]];
const BURNS_OW_COLS = { rv: ['#f4f0e8', '#e8e0d0', '#f0f0f4', '#d8d4cc'], tent: ['#3a8a5a', '#c84a3a', '#2a6ac8', '#d8a020', '#8a4ac8', '#e86a2a'], shade: ['#d8c8a8', '#e8e0d0', '#c8b490', '#f0e8d8'], couch: ['#8a2a5a', '#2a5a8a', '#5a2a8a', '#8a5a2a'] };

const BurnsOW = {
  // instance prototypes for the neighbourhoods (built once per visit)
  protos(api) {
    const P = BurnsProps;
    const veh = (kind, seed, far) => api.instanceProto('ow_' + kind + seed, m => P.vehicle(m, { kind, seed }), { near: 40, mid: 150, far, farD: 250, r: 6 });
    const boxFar = (w, h, l, col, roof) => m => { m.color(col); m.box(0, h / 2 + 0.25, 0, w, h, l); if (roof) { m.color(roof); m.box(0, h + 0.3, 0, w * 0.6, 0.18, l * 0.5); } };
    veh('rv', 11, boxFar(2.5, 3.0, 9.0, '#ece8e0', '#d8d8d8'));
    veh('camper', 5, boxFar(2.2, 2.4, 5.6, '#d8d0c4'));
    veh('trailer', 7, boxFar(2.4, 2.6, 11.5, '#c8ccd4'));
    veh('bus', 4, boxFar(2.6, 3.0, 11, '#6a3ab0', '#ffd84a'));
    // tents: one white tent with a lantern by the door, tinted per copy (the tent colours)
    api.instanceProto('ow_tent', m => this.domeTent(m, '#f4f2ee', true), { near: 30, mid: 110, r: 2 });
    api.instanceProto('ow_domeL', m => P.dome(m, { r: 4.2, col: '#e0d0f0', alt: '#b8a0e0', freq: 2, lights: true }), { near: 50, mid: 170, r: 5, far: m => { m.color('#e0d0f0'); m.dome(0, 0, 0, 4.2, 1, { frame: false }); m.color('#ff4fd8', 1); m.box(0, 0.3, 0, 8.6, 0.3, 0.3); m.emissive(0); }, farD: 280 });
    api.instanceProto('ow_barrel', m => { m.color('#6a3a24').shine(1); m.cyl(0, 0, 0, 0.42, 0.42, 0.95, 10, { smooth: true }); m.shine(0); m.color('#ff7a2a', 1); m.cyl(0, 0.9, 0, 0.36, 0.36, 0.06, 10, {}); m.emissive(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.45, y0: 0, y1: 1.0 }] }; }, { near: 30, mid: 100, lo: false, r: 0.8 });
    api.instanceProto('ow_totem', m => this.totem(m), { near: 45, mid: 180, r: 2, far: m => { m.color('#3a2a4a'); m.box(0, 3, 0, 0.5, 6, 0.5); m.color('#38f2ff', 1); m.box(0, 5.2, 0, 1.4, 0.6, 1.4); m.emissive(0); }, farD: 300 });
    api.instanceProto('ow_flower', m => this.flower(m), { near: 45, mid: 180, r: 3, far: m => { m.color('#3a8a3a'); m.box(0, 2.5, 0, 0.3, 5, 0.3); m.color('#ff6ab0', 1); m.box(0, 5.2, 0, 2.6, 0.4, 2.6); m.emissive(0); }, farD: 300 });
    api.instanceProto('ow_hexa', m => this.hexayurt(m), { near: 40, mid: 160, r: 3.5, far: m => { m.color('#d8dce4'); m.cyl(0, 0, 0, 3, 3, 2.4, 6, {}); m.lathe([[3, 2.4], [0, 3.6]], { seg: 6 }); }, farD: 260 });
    // camp frontages (three layouts: lounge, bar, dance corner); the canopy, rug and LED colour come from the copy's tint
    for (let i = 0; i < 3; i++) api.instanceProto('ow_shadeC' + i, m => this.camp(m, '#f6f2ea', i), { near: 40, mid: 160, r: 7, far: m => { m.color('#f6f2ea'); m.box(0, 3.33, 0, 9.2, 0.1, 7.2); m.color('#3a3a44'); m.box(0, 1.6, -3.4, 8.6, 3.2, 0.2); m.color('#ffffff', 1); m.box(0, 3.24, 3.62, 9.4, 0.12, 0.08); m.emissive(0); }, farD: 260 });
    api.instanceProto('ow_flag', m => { m.color('#4a4a52'); m.cyl(0, 0, 0, 0.06, 0.04, 6.5, 6, {}); for (let k = 0; k < 3; k++) { m.color(BURNS_NEON[k * 2]); m.box(0.55, 5.9 - k * 0.55, 0, 1.0, 0.45, 0.03); } return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.1, y0: 0, y1: 6.5 }] }; }, { near: 40, mid: 180, lo: false, r: 1.2, shadow: false });
    // far-city stand-ins: cheap blocks seen beyond the streamed neighbourhoods (never drawn up close)
    api.instanceProto('ow_farA', m => { m.color('#e8e0d4'); m.box(-6, 1.5, 0, 2.5, 3, 9); m.box(4, 1.4, 1, 2.4, 2.8, 7); m.color('#c86a8a'); m.box(-1, 1.6, -5, 6, 0.12, 5); m.color('#ffb860', 1); m.box(-1, 3.4, -2.2, 12, 0.35, 0.35); m.color('#ff4fd8', 1); m.box(-6, 3.2, 3.8, 0.35, 0.35, 5); m.emissive(0); }, { lo: false, near: 1400, minD: 240, noCap: true, r: 9, shadow: false, noAO: true, cols: false });
    api.instanceProto('ow_farB', m => { m.color('#d8dce4'); m.dome(0, 0, 0, 4, 1, { frame: false }); m.color('#7aa0d8'); m.box(7, 1.2, 2, 5, 2.4, 2.4); m.color('#38f2ff', 1); m.box(0, 0.6, 0, 8.6, 0.35, 0.35); m.box(0, 0.6, 0, 0.35, 0.35, 8.6); m.color('#ffd84a', 1); m.box(7, 2.7, 2, 5.2, 0.3, 0.3); m.emissive(0); }, { lo: false, near: 1400, minD: 240, noCap: true, r: 9, shadow: false, noAO: true, cols: false });
    api.instanceProto('ow_shade', m => P.shade(m, { w: 7, d: 6, h: 3.0, col: '#f0ece4' }), { near: 40, mid: 160, r: 5 });
    api.instanceProto('ow_dome', m => P.dome(m, { r: 4.5, col: '#f4f0ea', freq: 2 }), { near: 50, mid: 170, r: 5, far: m => { m.color('#f4f0ea'); m.dome(0, 0, 0, 4.5, 1, { frame: false }); }, farD: 280 });
    api.instanceProto('ow_potty', m => { for (let i = 0; i < 4; i++) { m.push(); m.tf((i - 1.5) * 1.35, 0, 0); P.portapotty(m, { col: '#2a6ac8' }); m.pop(); } }, { near: 35, mid: 140, r: 3 });
    api.instanceProto('ow_lamp', m => this.lampPost(m), { near: 45, mid: 200, r: 1.5, far: m => { m.color('#3a3a44'); m.box(0, 3.4, 0, 0.16, 6.8, 0.16); m.color('#ffc070', 1); m.box(0, 6.5, 0, 0.5, 0.6, 0.5); m.emissive(0); }, farD: 360 });
    api.instanceProto('ow_bike', m => this.rider(m), { near: 30, mid: 140, r: 1.2, shadow: false, far: m => { m.color('#2a2a34'); m.box(0, 1.1, 0, 0.35, 1.2, 0.5); m.color('#ffffff', 1); m.box(0, 0.75, 0, 0.12, 0.12, 1.5); m.emissive(0); }, farD: 300 });
    // string lights on the curbs (white bulbs: each run's tint colours them): from far off at night they read as lines of light
    api.instanceProto('ow_string', m => this.stringLights(m), { near: 45, mid: 140, r: 6.5, shadow: false, noAO: true, far: m => this.stringFar(m), farD: 260 });
    // three bikes parked on a curb (one with its LED wrap on)
    api.instanceProto('ow_bikes', m => this.bikeRack(m), { near: 60, lo: false, r: 2, shadow: false });
  },
  // Esplanade lamp post: a tall wooden pole with a lantern on a crook (the lamplighters light them at dusk)
  lampPost(m) {
    m.color('#6a4a32'); m.roundBox(0, 3.4, 0, 0.18, 6.8, 0.18, 0.04, { k: 1, m: 1 });
    m.limb(0, 6.6, 0, 0, 6.85, 0.55, 0.05, 0.05, { seg: 5 });
    m.color('#3a2a1e'); m.box(0, 0.05, 0, 0.6, 0.1, 0.6);
    m.color('#ffc070', 1); m.roundBox(0, 6.35, 0.6, 0.32, 0.42, 0.32, 0.06, { k: 1, m: 1 }); m.emissive(0);
    m.color('#2a2a30'); m.box(0, 6.6, 0.6, 0.38, 0.06, 0.38);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.16, y0: 0, y1: 6.8 }] };
  },
  // a burner on a bike (one static mesh: it's instanced and slides along the streets), LED strip on the frame
  rider(m) {
    BurnsProps.bikeShape(m, 0, 0, 0, 0, '#ffd21a');
    m.color('#ffffff', 1); m.box(0, 0.55, 0, 0.05, 0.05, 1.3); m.emissive(0);
    const skin = '#c89068', top = '#2a2a34';
    m.color(top); m.limb(0, 1.05, -0.15, 0, 1.6, 0.05, 0.16, 0.14, { seg: m.lo ? 5 : 7 });
    m.color(skin); m.ball(0, 1.78, 0.08, 0.13, { seg: m.lo ? 6 : 8, rings: m.lo ? 4 : 5 });
    m.color('#1a1a20'); for (const sx of [-1, 1]) { m.limb(sx * 0.12, 1.05, -0.1, sx * 0.14, 0.62, 0.12, 0.06, 0.05, { seg: 5 }); m.limb(sx * 0.14, 0.62, 0.12, sx * 0.12, 0.25, 0.0, 0.05, 0.04, { seg: 5 }); }
    m.color(skin); for (const sx of [-1, 1]) m.limb(sx * 0.16, 1.5, 0.0, sx * 0.24, 1.15, 0.42, 0.045, 0.04, { seg: 5 });
    return {};
  },
  // a dome tent: rounded body, a darker door flap and two guy lines
  domeTent(m, col, lantern) {
    m.color(col).shine(1); m.ellipsoid(0, 0, 0, 1.5, 1.25, 1.2, m.lo ? { seg: 7, rings: 3 } : { seg: 12, rings: 5 }); m.shine(0);
    m.color('#2a2a34'); m.ellipsoid(0, 0.02, 1.08, 0.55, 0.85, 0.16, { seg: 8, rings: 3 });
    if (!m.lo) { m.color('#e8e8ec'); m.limb(-1.4, 0.7, 0, -2.2, 0, 0, 0.012, 0.012, { seg: 3, ends: false }); m.limb(1.4, 0.7, 0, 2.2, 0, 0, 0.012, 0.012, { seg: 3, ends: false }); }
    if (lantern) { m.color('#ffe6c0', 1); m.ball(0.75, 0.9, 1.15, 0.09, { seg: 6, rings: 4 }); m.emissive(0); }
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.4, hz: 1.1, y0: 0, y1: 1.2 }] };
  },
  // a lit totem: stacked rings and orbs on a pole (an art installation in front of a camp)
  totem(m) {
    m.color('#3a2a4a'); m.roundBox(0, 3, 0, 0.42, 6, 0.42, 0.08, { k: 1, m: 1 });
    for (let k = 0; k < 4; k++) { m.color(BURNS_NEON[k * 2 % 7], 1); m.push(); m.tf(0, 1.6 + k * 1.2, 0); m.torus(0, 0, 0, 0.75 - k * 0.1, 0.07, { seg: 12, tseg: 5 }); m.pop(); }
    m.color('#38f2ff', 1); m.ball(0, 6.4, 0, 0.45, { seg: 10, rings: 6 }); m.emissive(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.3, y0: 0, y1: 6 }] };
  },
  // a giant flower sculpture: a steel stem, glowing petals, a bench of leaves
  flower(m) {
    m.color('#3a8a3a'); m.limb(0, 0, 0, 0, 5.2, 0, 0.18, 0.12, { seg: 8 });
    m.limb(0, 1.6, 0, 1.4, 2.2, 0, 0.08, 0.05, { seg: 6 }); m.limb(0, 2.4, 0, -1.3, 3.0, 0.2, 0.08, 0.05, { seg: 6 });
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; m.color(k % 2 ? '#ff6ab0' : '#ff9ad0', 0.55); m.ellipsoid(Math.sin(a) * 1.0, 5.3, Math.cos(a) * 1.0, 0.7, 0.16, 0.42, { seg: 8, rings: 4 }); }
    m.color('#ffd84a', 1); m.ball(0, 5.42, 0, 0.42, { seg: 10, rings: 6 }); m.emissive(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.25, y0: 0, y1: 5 }] };
  },
  // a hexayurt: the playa's insulated hexagonal hut (foil-faced panels, a low pyramid roof, a door)
  hexayurt(m) {
    m.color('#dfe3ea').shine(3); m.cyl(0, 0, 0, 3, 3, 2.4, 6, {}); m.shine(1); m.lathe([[3, 2.4], [3, 2.4], [0.3, 3.55], [0, 3.6]], { seg: 6 }); m.shine(0);
    m.color('#2a2a34'); m.box(0, 0.95, 2.62, 0.95, 1.9, 0.05);
    if (!m.lo) { m.color('#ffb860', 0.6); m.box(0, 2.9, 1.2, 0.5, 0.3, 0.05); m.emissive(0); }
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.9, y0: 0, y1: 3.4 }] };
  },
  // a camp's street front (+z faces the street): shade canopy, bunting, string lights at the back, an LED strip, and a
  // layout: v 0 lounge (rug, two couches, a cooler), v 1 bar (counter, stools, a lit shelf), v 2 dance corner
  // (speaker stacks, a DJ table, a mirror ball). Built near-white: each copy's tint colours it.
  camp(m, col, v) {
    const P = BurnsProps, w = 9, d = 7, h = 3.3, cols = [];
    m.color('#4a4a52'); for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) m.box(sx * (w / 2 - 0.1), h / 2, sz * (d / 2 - 0.1), 0.1, h, 0.1);
    m.color(col); m.box(0, h + 0.03, 0, w + 0.2, 0.06, d + 0.2, { uv: BURNS_ATLAS.pattern('canvas'), uvFaces: ['py', 'ny'] });
    if (!m.lo) { m.color(col); for (let k = 0; k < 9; k++) { m.push(); m.tf(-w / 2 + 0.5 + k, h - 0.18, d / 2 + 0.1); m.poly([[-0.4, 0.15, 0], [0.4, 0.15, 0], [0, -0.35, 0]]); m.pop(); } }
    m.color('#d8d0c8'); m.box(0, 0.02, 0.5, 6, 0.04, 4.2, { uv: BURNS_ATLAS.pattern(v === 1 ? 'plaid' : 'tiedye'), uvFaces: ['py'] });
    if (v === 0) {
      m.push(); m.tf(0, 0, -1.6); P.couch(m, { col: '#e8d4d0' }); m.pop();
      m.push(); m.tf(-2.6, 0, 0.6, Math.PI / 2); P.couch(m, { col: '#d0d8e8' }); m.pop();
      m.push(); m.tf(2.4, 0, 1.6); P.cooler(m, { col: '#c8e0f0' }); m.pop();
      cols.push({ t: 'box', x: 0, z: -1.6, hx: 1.0, hz: 0.45, y0: 0, y1: 0.95 }, { t: 'box', x: -2.6, z: 0.6, hx: 0.45, hz: 1.0, y0: 0, y1: 0.95 });
    } else if (v === 1) {
      m.color('#9a7a5a'); m.box(0, 0.55, 1.5, 4.4, 1.1, 0.7, { uv: BURNS_ATLAS.pattern('wood'), uvFaces: 'all' });
      m.color('#f0e4d0'); m.box(0, 1.13, 1.5, 4.6, 0.06, 0.9);
      if (!m.lo) for (let k = 0; k < 3; k++) { m.color('#5a5a62'); m.cyl(-1.4 + k * 1.4, 0, 2.5, 0.04, 0.04, 0.72, 5, {}); m.color('#e8e0d8'); m.cyl(-1.4 + k * 1.4, 0.72, 2.5, 0.22, 0.22, 0.07, 8, {}); }
      m.color('#4a3a2a'); m.box(0, 1.3, -3.1, 4.2, 2.6, 0.3);
      for (let k = 0; k < 9; k++) { m.color(BURNS_NEON[k % 7], 0.9); m.box(-1.8 + k * 0.45, 1.75, -2.9, 0.16, 0.34, 0.16); }
      m.color('#ffffff', 1); m.box(0, 2.35, -2.92, 4.0, 0.08, 0.06); m.emissive(0);
      cols.push({ t: 'box', x: 0, z: 1.5, hx: 2.3, hz: 0.45, y0: 0, y1: 1.15 }, { t: 'box', x: 0, z: -3.1, hx: 2.1, hz: 0.2, y0: 0, y1: 2.6 });
    } else {
      m.color('#2a2a30'); for (const sx of [-1, 1]) { m.box(sx * 3.3, 0.95, -2.5, 1.1, 1.9, 1.0); if (!m.lo) { m.color('#9a9aa8'); m.cyl(sx * 3.3, 0.55, -1.99, 0.3, 0.3, 0.02, 10, {}); m.cyl(sx * 3.3, 1.4, -1.99, 0.18, 0.18, 0.02, 8, {}); m.color('#2a2a30'); } }
      m.color('#3a3a44'); m.box(0, 0.5, -2.2, 2.2, 1.0, 0.8); m.color('#ffffff', 1); m.box(0, 0.75, -1.78, 2.0, 0.08, 0.04); m.emissive(0);
      m.color('#e8e8f0').shine(2); m.ball(0, h - 0.75, 0.4, 0.32, { seg: m.lo ? 6 : 10, rings: m.lo ? 4 : 7 }); m.shine(0); m.color('#5a5a62'); m.box(0, h - 0.3, 0.4, 0.03, 0.4, 0.03);
      cols.push({ t: 'box', x: -3.3, z: -2.5, hx: 0.55, hz: 0.5, y0: 0, y1: 1.9 }, { t: 'box', x: 3.3, z: -2.5, hx: 0.55, hz: 0.5, y0: 0, y1: 1.9 }, { t: 'box', x: 0, z: -2.2, hx: 1.1, hz: 0.4, y0: 0, y1: 1.0 });
    }
    if (!m.lo) for (let k = 0; k < 12; k++) { m.color(BURNS_NEON[k % 7], 1); m.ball(-w / 2 + 0.4 + k * 0.75, h - 0.35 - Math.sin(k / 11 * Math.PI) * 0.35, -d / 2 + 0.1, 0.06, { seg: 5, rings: 3 }); }
    // LED strips along the canopy's front and sides (the copy's tint colours them; they read from far away at night)
    m.color('#ffffff', 1); m.box(0, h - 0.04, d / 2 + 0.12, w + 0.2, 0.08, 0.05); for (const sx of [-1, 1]) m.box(sx * (w / 2 + 0.12), h - 0.04, 0, 0.05, 0.08, d + 0.2);
    m.emissive(0);
    return { cols };
  },
  // string lights: three poles 6 m apart along local x, two sagging runs of bulbs between them
  stringLights(m) {
    const L = 12, H = 3.4, n = m.lo ? 6 : 12;
    m.color('#4a4a52'); for (const x of [-L / 2, 0, L / 2]) m.cyl(x, 0, 0, 0.05, 0.04, H + 0.15, 5, {});
    for (const s of [0, 1]) {
      const x0 = s ? 0 : -L / 2, x1 = s ? L / 2 : 0, y = t => H - Math.sin(t * Math.PI) * 0.6;
      if (!m.lo) { m.color('#1a1a20'); for (let i = 0; i < 6; i++) m.limb(lerp(x0, x1, i / 6), y(i / 6), 0, lerp(x0, x1, (i + 1) / 6), y((i + 1) / 6), 0, 0.012, 0.012, { seg: 3, ends: false }); }
      for (let i = 1; i < n; i++) { const t = i / n; m.color(i % 3 ? '#ffffff' : '#fff0d8', 1); m.ball(lerp(x0, x1, t), y(t) - 0.07, 0, m.lo ? 0.09 : 0.075, { seg: m.lo ? 4 : 6, rings: 3 }); }
    }
    m.emissive(0);
    return { cols: [-L / 2, 0, L / 2].map(x => ({ t: 'cyl', x, z: 0, r: 0.08, y0: 0, y1: H, camPass: true, walk: false })) };
  },
  stringFar(m) { m.color('#ffffff', 1); m.box(-3, 3.12, 0, 5.8, 0.14, 0.14); m.box(3, 3.12, 0, 5.8, 0.14, 0.14); m.emissive(0); },
  // three bikes parked on a curb (one wrapped in LED wire)
  bikeRack(m) {
    const cols = ['#ff4fd8', '#38c8ff', '#ffd21a'];
    // side by side along the curb (local z), noses toward the street
    for (let i = 0; i < 3; i++) BurnsProps.bikeShape(m, 0, 0, (i - 1) * 0.75, Math.PI / 2 + (i - 1) * 0.12, cols[i]);
    m.color('#7aff5a', 1); m.box(0.2, 0.62, 0, 0.05, 0.05, 1.7); m.emissive(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.9, hz: 1.2, y0: 0, y1: 1.0, camPass: true }] };
  },
  // a heart-topped art car (W7's heart car parked on the open playa)
  heartCar(m) {
    BurnsProps.artcar(m, { len: 8, w: 3.6, col: '#c81a5a', sculpt: '#ff4f8a' });
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.8, hz: 4, y0: 0, y1: 1.7, cover: true }] };
  },
  // the Man's pavilion: a stepped wooden base with four lit ramps
  pavilion(api) {
    const H = 7.5;
    api.mesh(0, 0, m => {
      m.color('#8a6a48'); m.lathe([[0, 0], [17, 0], [17, 1.2], [13, 1.2], [13, 3.6], [9.5, 3.6], [9.5, H], [0, H]], { seg: 8 });
      m.color('#5a4030'); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + Math.PI / 8; m.push(); m.tf(Math.sin(a) * 9.6, 0, Math.cos(a) * 9.6, a); m.box(0, H / 2 + 0.4, 0, 1.2, H - 0.8, 0.5); m.pop(); }
      m.color('#ffb860', 1); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; m.box(Math.sin(a) * 13.1, 3.65, Math.cos(a) * 13.1, 0.4, 0.12, 0.4); } m.emissive(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 9.5, y0: 0, y1: H }, { t: 'cyl', x: 0, z: 0, r: 13, y0: 0, y1: 3.6 }, { t: 'cyl', x: 0, z: 0, r: 17, y0: 0, y1: 1.2 }] };
    }, { noAO: false });
    // ramps up the tiers on four sides (walkable)
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2, s = Math.sin(a), c = Math.cos(a);
      api.mesh(s * 15, c * 15, m => { m.color('#7a5a3c'); m.box(0, 0.6, 0, 3, 1.2, 4.2); return { cols: [{ t: 'ramp', x: 0, z: 0, hx: 1.5, hz: 2.1, ya: 1.2, yb: 0, yaw: 0 }] }; }, { yaw: a });
      api.mesh(s * 11.3, c * 11.3, m => { m.color('#7a5a3c'); m.box(0, 1.8, 0, 3, 2.4, 3.4); return { cols: [{ t: 'ramp', x: 0, z: 0, hx: 1.5, hz: 1.7, ya: 3.6, yb: 1.2, yaw: 0 }] }; }, { yaw: a });
      api.light(s * 14, c * 14, 9, '#ffb060', 0.55);
    }
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; api.glow(Math.sin(a) * 13.2, 4.2, Math.cos(a) * 13.2, 1.6, '#ffb860'); }
  },
  // the Temple: an original tiered wooden temple with an open, walkable heart and a spire (sunset-lit lattice)
  temple(api, x, z) {
    api.mesh(x, z, m => {
      m.color('#c8a070');
      for (const [r, y0, h] of [[22, 0, 0.6], [18, 0.6, 0.5]]) m.lathe([[0, y0], [r, y0], [r, y0 + h], [0, y0 + h]], { seg: 8 });
      // eight lattice towers around a central pavilion
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * TAU, px = Math.sin(a) * 14, pz = Math.cos(a) * 14;
        m.color('#b88a5a'); m.roundBox(px, 4.6, pz, 2.2, 8, 2.2, 0.2, { k: 1, m: 1 });
        m.push(); m.tf(px, 0, pz); m.color('#d8b080'); m.lathe([[0, 8.6], [1.8, 8.6], [0.2, 12.5], [0, 12.6]], { seg: 6 }); m.pop();
      }
      // the centre: a ring of columns and an onion spire
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; m.color('#b88a5a'); m.roundBox(Math.sin(a) * 6.5, 4.6, Math.cos(a) * 6.5, 0.6, 8, 0.6, 0.12, { k: 1, m: 1 }); }
      m.color('#c89a68'); m.lathe([[0, 8.6], [8, 8.6], [8, 9.4], [6.5, 9.6], [7.2, 13], [4.5, 18], [1.2, 24], [0.3, 30], [0, 30.5]], { seg: 12 });
      m.color('#ffd8a0', 0.6); m.ball(0, 30.8, 0, 0.6, { seg: 8, rings: 6 }); m.emissive(0);
      const cols = [{ t: 'cyl', x: 0, z: 0, r: 22, y0: 0, y1: 1.1 }];
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; cols.push({ t: 'box', x: Math.sin(a) * 14, z: Math.cos(a) * 14, hx: 1.1, hz: 1.1, y0: 1.1, y1: 12, yaw: a }); }
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; cols.push({ t: 'cyl', x: Math.sin(a) * 6.5, z: Math.cos(a) * 6.5, r: 0.35, y0: 1.1, y1: 8.6 }); }
      return { cols };
    });
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; api.glow(x + Math.sin(a) * 14, 9, z + Math.cos(a) * 14, 1.8, '#ffc890'); api.light(x + Math.sin(a) * 14, z + Math.cos(a) * 14, 7, '#ffb070', 0.35); }
    api.light(x, z, 16, '#ffc890', 0.4);
  },
  // the trash fence: five long straight runs of orange mesh on posts, with a gap for Gate Road
  fence(api) {
    const O = BURNS_OW, F = O.FENCE;
    const corner = k => { const a = k * TAU / 5; return [Math.sin(a) * F, -Math.cos(a) * F]; };
    for (let k = 0; k < 5; k++) {
      const A = corner(k), B = corner(k + 1), L = Math.hypot(B[0] - A[0], B[1] - A[1]), yaw = Math.atan2(B[0] - A[0], B[1] - A[1]);
      const n = Math.ceil(L / 100);
      for (let s = 0; s < n; s++) {
        const t0 = s / n, t1 = (s + 1) / n, cx = lerp(A[0], B[0], (t0 + t1) / 2), cz = lerp(A[1], B[1], (t0 + t1) / 2), seg = L / n;
        if (Math.abs(cx) < 40 && cz > 0 && Math.abs(cz - O.FENCE_IN) < 30) {   // Gate Road gap: two half runs
          for (const side of [-1, 1]) { const len = seg / 2 - 18, ox = side * (18 + len / 2); this.fenceRun(api, cx + Math.sin(yaw) * ox, cz + Math.cos(yaw) * ox, yaw, len); }
          continue;
        }
        this.fenceRun(api, cx, cz, yaw, seg);
      }
    }
  },
  fenceRun(api, x, z, yaw, len) {
    api.mesh(x, z, m => {
      m.color('#ff7a2a'); m.box(0, 1.1, 0, 0.04, 1.4, len);
      m.color('#4a4a52'); for (let i = 0; i <= len / 8; i++) m.box(0, 0.8, -len / 2 + i * 8, 0.1, 1.6, 0.1);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.3, hz: len / 2, y0: 0, y1: 2.2 }] };
    }, { yaw, noAO: true });
  },
  // a place's set piece: what you see at the door in the city (the full world lives behind it)
  placeSet(api, g, P) {
    const O = BURNS_OW, x = P.x, z = P.z, yaw = P.yaw, s = Math.sin(yaw), c = Math.cos(yaw);
    const back = (d, side) => [x - s * d + c * (side || 0), z - c * d - s * (side || 0)];
    switch (P.kind) {
      case 'gate': api.prop('gateArch', { x, z: z - 8, yaw: 0 }); api.prop('booth', { x: 9, z: z - 4, yaw: Math.PI }); for (let i = 0; i < 6; i++) api.instance(i % 2 ? 'ow_rv11' : 'ow_camper5', i % 2 ? 4.5 : -4.5, z + 26 + i * 9, { yaw: 0 }); break;
      case 'rv': api.redLightCamp(x - s * 6, z - c * 6, yaw + Math.PI / 2, { crew: 3, sign: true }); break;
      case 'bamboo': { const b = back(9); api.mesh(b[0], b[1], m => { m.color('#c8a860'); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI - Math.PI / 2; m.cyl(Math.sin(a) * 7, 0, Math.cos(a) * 7, 0.12, 0.1, 5.5, 6, {}); } m.color('#b89850'); m.roundBox(0, 0.12, 0, 13, 0.24, 9, 0.08, { k: 1, m: 1 }); m.color('#38f2ff', 0.8); for (let i = 0; i < 7; i++) m.box(-6 + i * 2, 5.4, 0, 0.12, 0.12, 9); m.emissive(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 6.5, hz: 4.5, y0: 0, y1: 0.24 }] }; }, { yaw }); api.sign('RHYTHM WAVE', x + c * 4, z - s * 4, { yaw: yaw + Math.PI, h: 2.4, style: { bg: '#0a2a3a', fg: '#9af8ff', border: '#38f2ff' } }); break; }
      case 'costume': { const b = back(7); api.prop('shade', { x: b[0], z: b[1], yaw, w: 8, d: 7, col: '#ff9ad0' }); for (let i = 0; i < 4; i++) api.prop('crate', { x: b[0] + c * (i * 1.5 - 2.2), z: b[1] - s * (i * 1.5 - 2.2), yaw }); api.sign('COSTUMES\nFREE', x + c * 3.5, z - s * 3.5, { yaw: yaw + Math.PI, h: 2.2, style: { bg: '#3a0a2a', fg: '#ffd84a', border: '#ff4fd8' } }); break; }
      case 'odome': { const b = back(9); api.prop('dome', { x: b[0], z: b[1], yaw, r: 7, col: '#ff6aa8', alt: '#d84a88', lights: true }); api.light(b[0], b[1], 10, '#ff4f8a', 0.45); break; }
      case 'costco': { const b = back(8); api.prop('shade', { x: b[0], z: b[1], yaw, w: 10, d: 6, col: '#e8e0d0' }); api.sign('COSTCO\nSOUL TRADING', x + c * 4, z - s * 4, { yaw: yaw + Math.PI, h: 2.4, style: { bg: '#2a2a6a', fg: '#ffffff', border: '#ff4a4a' } }); for (let i = 0; i < 3; i++) api.prop('cooler', { x: b[0] + c * (i * 1.4 - 1.4), z: b[1] - s * (i * 1.4 - 1.4) + 2, yaw }); break; }
      case 'deep': api.prop('campFlag', { x: x + 2, z }); for (let i = 0; i < 5; i++) api.glow(x + Math.sin(i) * 6, 0.5, z + Math.cos(i) * 6, 0.8, BURNS_NEON[i % 7]); break;
      case 'sound': api.sign('THE SOUND CAMPS\n10:00 PLAZA', x, z + 2, { yaw: yaw + Math.PI, h: 2.6, style: { bg: '#1a0a2a', fg: '#ff9af0', border: '#ff4fd8', glow: '#ff4fd8' } }); break;
      case 'heart': { const b = back(7); api.mesh(b[0], b[1], m => this.heartCar(m), { yaw: yaw + Math.PI / 2 }); api.light(b[0], b[1], 12, '#ff4f8a', 0.5); break; }
      case 'hell': this.hellStation(api, x, z); break;
      case 'storm': for (let i = 0; i < 4; i++) api.glow(x + Math.sin(i * 1.6) * 5, 0.6, z + Math.cos(i * 1.6) * 5, 1.0, '#9ad0ff'); api.prop('campFlag', { x, z }); break;
      case 'temple': break;
      case 'work': { const b = back(8); api.prop('shade', { x: b[0], z: b[1], yaw, w: 9, d: 7, col: '#c8d8a8' }); api.prop('scaffold', { x: b[0] + c * 6, z: b[1] - s * 6, yaw }); api.sign('WORKSHOPS\nTODAY', x + c * 3.5, z - s * 3.5, { yaw: yaw + Math.PI, h: 2.2, style: { bg: '#1a3a1a', fg: '#ffffff', border: '#7aff5a' } }); break; }
      case 'airport': this.airport(api, x, z); break;
      case 'man': break;
      case 'exodus': for (let i = 0; i < 10; i++) api.instance(i % 3 ? 'ow_rv11' : 'ow_camper5', (i % 2 ? 1 : -1) * 4.2, z + 14 + Math.floor(i / 2) * 12, { yaw: Math.PI }); break;
      default: break;
    }
  },
  hellStation(api, x, z) {
    // an original roadside gas-station set: a canopy on posts, pumps, and two flaming torches
    api.mesh(x, z, m => {
      m.color('#2a2a30'); for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) m.box(sx * 6, 2.4, sz * 4, 0.3, 4.8, 0.3);
      m.color('#c82a1a'); m.roundBox(0, 5.0, 0, 14, 0.5, 10, 0.1, { k: 1, m: 1 });
      m.color('#ffd84a', 0.9); m.box(0, 4.7, 5.05, 13, 0.25, 0.06); m.emissive(0);
      m.color('#e8e8ec'); for (const sx of [-3, 0, 3]) m.roundBox(sx, 0.9, 0, 0.8, 1.8, 0.6, 0.08, { k: 1, m: 1 });
      m.color('#3a2a2a'); m.roundBox(-11, 1.8, -2, 6, 3.6, 5, 0.12, { k: 1, m: 1 });
      return { cols: [{ t: 'box', x: -11, z: -2, hx: 3, hz: 2.5, y0: 0, y1: 3.6 }, { t: 'box', x: 0, z: 0, hx: 0.5, hz: 0.4, y0: 0, y1: 1.8 }] };
    });
    api.fire(x + 7.5, 0, z + 5.5, 0.5, { hazard: false }); api.fire(x - 7.5, 0, z + 5.5, 0.5, { hazard: false });
    api.sign('HELL STATION', x, z + 7.5, { yaw: Math.PI, h: 2.6, style: { bg: '#3a0a0a', fg: '#ffd84a', border: '#ff4a2a', glow: '#ff7a2a' } });
    api.light(x, z, 18, '#ff7a3a', 0.5);
  },
  airport(api, x, z) {
    const h = BURNS_OW.clock(x, z), yaw = BURNS_OW.yawIn(h) + Math.PI / 2;
    api.paint((c, P, S) => { const q = P(x, z); c.save(); c.translate(q[0], q[1]); c.rotate(-yaw); c.fillStyle = 'rgba(110,80,60,0.45)'; c.fillRect(-16 * S, -150 * S, 32 * S, 300 * S); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 0.8 * S; c.setLineDash([8 * S, 8 * S]); c.beginPath(); c.moveTo(0, -150 * S); c.lineTo(0, 150 * S); c.stroke(); c.restore(); });
    const s = Math.sin(yaw), c0 = Math.cos(yaw);
    api.mesh(x + c0 * 26, z - s * 26, m => { m.color('#c8ccd4').shine(2); m.lathe([[0, 0], [9, 0], [9, 0.2], [8.6, 4], [6, 7.5], [0, 8.6]], { seg: 10, theta0: 0, theta1: Math.PI, caps: true }); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 4, hx: 9, hz: 4, y0: 0, y1: 7 }] }; }, { yaw });
    api.sign('BRC AIRPORT', x, z, { yaw: yaw + Math.PI / 2, h: 2.2, style: { bg: '#0a2a4a', fg: '#ffffff', border: '#38c8ff' } });
  }
};

/* ---------------- the world ---------------- */
BurnsWorlds.register({
  id: BURNS_OW.ID, name: 'Black Rock City', sub: 'The open playa', open: true,
  sky: 'dusk', sky2: 'night', tod: 0.15, music: 'burns_hub', noOutro: true, dayCard: false,
  bounds: [-940, -940, 940, 1140],
  spawn: { x: 0, y: 0, z: BURNS_OW.FENCE_IN + 60, yaw: Math.PI },
  ground: { base: '#caa37f', crack: 0.26, mottle: 0.4, res: 1.06, step: 24 },
  drawDist: 300, glowDist: 520, ao: 'fast', dust: 1.5,
  // side quests that start from people in the city (region-aware: 'reach' with a region)
  missions: [
    { id: 'owTemple', side: true, name: 'Quiet Time', short: 'Sit at the Temple', type: 'reach', region: 'The Temple', giver: 'owSage', start: 'talk', desc: 'Sage at Center Camp says everyone should sit at the Temple once. Walk out past the Man toward 12:00.', hint: 'Out past the Man, toward 12:00', marker: { x: 0, z: -250 }, reward: { glow: 15 } },
    { id: 'owLantern', side: true, name: 'The Lost Lantern', short: 'Find the lost lantern', type: 'find', giver: 'owLamp0', start: 'talk', desc: 'A lamplighter dropped a lantern out by the galleon on the deep playa. Find it.', hint: 'Deep playa, by the galleon (1:00)', marker: { x: 203, z: -351 }, reward: { glow: 20 } }
  ],
  build(api, g) {
    const O = BURNS_OW, S = O.state = { places: [], camps: [], art: [], bikes: [], cars: [], devils: [], lamps: 0, t: 0 };
    O._blocks = null;
    for (const P of O.PLACES) P.home = false;
    // ---- streets on the ground paint ----
    const arc = (r, h0, h1, step) => { const pts = []; for (let h = h0; h <= h1 + 1e-6; h += step || 0.05) pts.push(O.at(h, r)); return pts; };
    api.paint((c, P, Sx) => { c.fillStyle = 'rgba(255,240,220,0.05)'; const q = P(0, 0); c.beginPath(); c.arc(q[0], q[1], O.ESP * Sx, 0, TAU); c.fill(); });
    api.road(arc(O.ESP, O.H0 - 0.1, O.H1 + 0.1, 0.03), 18, { col: 'rgba(150,112,86,0.5)', edge: 'rgba(110,80,60,0.3)', dash: 'rgba(255,240,210,0.25)' });
    for (let k = 1; k < O.RINGS.length; k++) api.road(arc(O.RINGS[k], O.H0, O.H1, 0.04), 11, { col: 'rgba(150,112,86,0.42)', edge: 'rgba(110,80,60,0.25)' });
    for (let h = O.H0; h <= O.H1 + 1e-6; h += 0.5) api.road([O.at(h, O.ESP), O.at(h, O.OUTER)], h % 1 === 0 ? 11 : 9, { col: 'rgba(150,112,86,0.42)', edge: 'rgba(110,80,60,0.25)' });
    // promenades: 6:00 (Center Camp to the Man), 3:00 and 9:00 (the plazas to the Man), 12:00 (the Man to the Temple)
    for (const h of [3, 6, 9]) api.road([O.at(h, O.ESP - 8), O.at(h, 22)], 7, { col: 'rgba(150,112,86,0.25)', edge: 'rgba(110,80,60,0.12)', tracks: [-1.2, 1.2] });
    api.road([[0, -22], [0, -226]], 7, { col: 'rgba(150,112,86,0.25)', edge: 'rgba(110,80,60,0.12)', tracks: [-1.2, 1.2] });
    // Gate Road: in from the gate to 6:00 & Firefly, and out past the fence
    api.road([[0, O.OUTER], [0, O.FENCE_IN], [0, O.FENCE_IN + 420]], 14, { col: 'rgba(150,112,86,0.5)', edge: 'rgba(110,80,60,0.3)', dash: 'rgba(255,240,210,0.3)' });
    // ---- plazas at 3:00 and 9:00 & Bonfire ----
    for (const h of [3, 9]) { const q = O.at(h, O.RINGS[2]); api.patch(q[0], q[1], 36, '#b48a6a', 0.35); O.reserve(q[0], q[1], 36); }
    // ---- the Man and the Temple ----
    BurnsOW.pavilion(api);
    S.man = { x: 0, y: 7.5, z: 0, scale: 1.45 };
    O.reserve(0, 0, 40);
    BurnsOW.temple(api, 0, -250);
    // ---- the trash fence ----
    BurnsOW.fence(api);
    // ---- neighbourhood prototypes (instanced) and the people's looks ----
    BurnsOW.protos(api);
    for (const [type, seed] of O.PEOPLE) { try { BurnsRig.model(BurnsRig.npcSpec(type, seed, { type, seed })); } catch (e) { /* built on first use */ } }
    // ---- the theme camps (full near Brady, a silhouette from afar) ----
    if (typeof BurnsCamps !== 'undefined') for (const C of O.CAMPS) {
      try {
        const r = C.r || O.ESP + 9 + C.front, p = O.at(C.h, r);
        const camp = BurnsCamps.place(api, g, C.kind, p[0], p[1], { rotY: O.yawIn(C.h), id: C.kind, lod: 'auto', crowd: C.crowd, marker: false, djPrompt: true, lodNear: 150 });
        S.camps.push(camp);
        const inf = BurnsCamps.info(C.kind), F = inf.foot, rad = Math.hypot(F[2] - F[0], F[3] - F[1]) / 2;
        const cc = camp.toWorld((F[0] + F[2]) / 2, 0, (F[1] + F[3]) / 2); O.reserve(cc[0], cc[2], rad * 0.85);
        if (C.kind === 'rootSociety' && camp.spots && camp.spots.bradyTipi) { const home = O.PLACES.find(q => q.kind === 'home'), t = camp.spots.bradyTipi; home.x = t.x + Math.sin(t.yaw) * 1.6; home.z = t.z + Math.cos(t.yaw) * 1.6; home.yaw = t.yaw; home.y = t.y || 0; home.home = true; }
      } catch (e) { console.error('ow camp ' + C.kind, e); }
    }
    // ---- big art on the open and deep playa ----
    if (typeof BurnsBigArt !== 'undefined') for (const A of O.ART) {
      // open-playa pieces face the city, deep-playa pieces face the Man
      try { const p = O.at(A.h, A.r); S.art.push(BurnsBigArt.place(api, g, A.kind, p[0], p[1], { rotY: A.r < O.ESP ? O.yawOut(A.h) : O.yawIn(A.h), id: A.kind, vantage: false })); } catch (e) { console.error('ow art ' + A.kind, e); }
    }
    // ---- the story places ----
    const home = O.PLACES.find(q => q.kind === 'home'); if (!home.home) { const q = O.at(2, 330); home.x = q[0]; home.z = q[1]; home.yaw = O.yawIn(2); }
    for (const P of O.PLACES) {
      if (P.kind !== 'home' && P.kind !== 'man' && P.kind !== 'temple') O.reserve(P.x, P.z, 20);
      try { BurnsOW.placeSet(api, g, P); } catch (e) { console.error('ow place ' + P.kind, e); }
      api.interact({ x: P.x, z: P.z, y: P.y, r: 3.4, label: 'ENTER: ' + P.name.toUpperCase(), when: gg => !gg.entering, fn: gg => BurnsOW.enter(gg, P) });
      api.marker('place_' + P.world, P.x, P.z, P.name, { col: '#ffd84a' });
    }
    // ---- the far city: stand-ins for every block still free, seen across the playa ----
    BurnsOW.farCity(api);
    for (let k = 0; k < O.RINGS.length; k++) BurnsOW.blade(O.STREETS[k].toUpperCase(), 300);
    for (let h = O.H0; h <= O.H1 + 1e-6; h += 0.5) BurnsOW.blade(O.hourName(h), 230);
    // ---- Esplanade lamp posts and the street signs at each Esplanade corner ----
    for (let h = O.H0; h <= O.H1 + 1e-6; h += 0.1) { const q = O.at(h, O.ESP - 11); api.instance('ow_lamp', q[0], q[1], { yaw: O.yawOut(h) }); api.light(q[0], q[1], 7.5, '#ffb060', 0.42); S.lamps++; }
    // lamps down the 3:00, 6:00 and 9:00 promenades to the Man
    for (const h of [3, 6, 9]) for (let r = 60; r < O.ESP - 20; r += 32) { const q = O.at(h + 0.012 * 300 / r, r); api.instance('ow_lamp', q[0], q[1], { yaw: O.yawOut(h) }); api.light(q[0], q[1], 7, '#ffb060', 0.38); }
    // street signs on the playa side of the Esplanade at every hour (the city side gets its own at each corner)
    for (let h = O.H0; h <= O.H1 + 1e-6; h += 1) BurnsOW.streetSign(api, h, 0, O.at(h + 0.02, O.ESP - 9));
    // ---- open-playa art cars cruising around the Man (rideable movers) ----
    for (let i = 0; i < 3; i++) {
      const col = ['#3a8ac8', '#c8a03a', '#8a3ac8'][i], sc = ['#38f2ff', '#ffd84a', '#ff4fd8'][i];
      const mv = api.mover(m => BurnsProps.artcar(m, { len: 8, w: 3.6, col, sculpt: sc }), {});
      S.cars.push({ mv, r: 150 + i * 32, w: (i % 2 ? -1 : 1) * 3.4 / (150 + i * 32), a: i * 2.1 });
    }
    // ---- two art cars anyone can drive (DRIVE), parked on the open playa ----
    // the green one by the 6:00 promenade is Rae's race car (quicker)
    for (const [x, z, yaw, col, sc, fast] of [[-24, 236, Math.PI, '#2a8a6a', '#7aff5a', true], [232, 36, -Math.PI / 2, '#8a2a6a', '#ff4fd8', false]]) {
      try { const v = api.artCar(Object.assign({ x, z, yaw, col, sculpt: sc, len: 8, w: 3.6 }, fast ? { maxSpeed: 16, accel: 6, turn: 1.25 } : {})); if (fast) S.raceCar = v; } catch (e) { console.error('ow art car', e); }
    }
    // ---- the side quests' people and things ----
    { const q = O.at(6.15, 332); api.npc({ id: 'owSage', type: 'burner', seed: 23, name: 'SAGE', x: q[0], z: q[1] - 34, yaw: Math.PI, behavior: 'chill', talk: (gg, a) => BurnsOW.giver(gg, a, 'owTemple', ['Have you sat at the Temple yet?', 'Walk out past the Man, toward 12:00. Sit a while.'], ['You went. I can tell.']) }); }
    api.pickup('glowstick', 203, 0.9, -351, { mission: 'owLantern', gate: true, label: 'LOST LANTERN', col: '#ffb060' });
    // ---- glow sticks along the Esplanade (ambient collectibles for the glow counter) ----
    for (let h = O.H0 + 0.1; h < O.H1; h += 0.4) { const q = O.at(h, O.ESP - 4); api.pickup('glowstick', q[0], 0.9, q[1]); }
    // ---- lamplighters walk the Esplanade at dusk carrying lanterns ----
    const lp = []; for (let h = O.H0; h <= O.H1; h += 0.1) lp.push(O.at(h, O.ESP - 6));
    for (let i = 0; i < 6; i++) api.npc({ id: 'owLamp' + i, type: 'burner', seed: 40 + i, name: 'LAMPLIGHTER', x: lp[i * 4][0], z: lp[i * 4][1], behavior: 'lamplight', path: lp.slice(i * 4).concat(lp.slice(0, i * 4)), loop: true, speed: 1.1, hang: false, lines: ['We light the Esplanade every night.', 'Walk with us a while.'],
      talk: i ? undefined : (gg, a) => BurnsOW.giver(gg, a, 'owLantern', ['I dropped a lantern out by the galleon on the deep playa.', 'Could you find it? It glows orange.'], ['My lantern! The Esplanade thanks you.']) });
    // ---- bikes riding the streets (instanced, moved every frame) ----
    const loops = [];
    loops.push(arc(O.ESP + 2, O.H0, O.H1, 0.05).concat(arc(O.ESP - 2, O.H0, O.H1, 0.05).reverse()));
    for (const k of [2, 4, 6]) loops.push(arc(O.RINGS[k] + 1.5, O.H0, O.H1, 0.06).concat(arc(O.RINGS[k] - 1.5, O.H0, O.H1, 0.06).reverse()));
    for (const h of [3, 4.5, 6, 7.5, 9]) loops.push([O.at(h + 0.01, O.ESP), O.at(h + 0.01, O.OUTER - 10), O.at(h - 0.01, O.OUTER - 10), O.at(h - 0.01, O.ESP)]);
    loops.push(arc(120, 0, 12, 0.1));
    S.loops = loops.map(L => { const acc = [0]; for (let i = 1; i < L.length; i++) acc.push(acc[i - 1] + Math.hypot(L[i][0] - L[i - 1][0], L[i][1] - L[i - 1][1])); acc.push(acc[acc.length - 1] + Math.hypot(L[0][0] - L[L.length - 1][0], L[0][1] - L[L.length - 1][1])); return { pts: L, acc, len: acc[acc.length - 1] }; });
    const brng = mulberry32(77);
    for (let i = 0; i < 70; i++) { const L = S.loops[i % S.loops.length], d = api.world.instancer().dyn('ow_bike'); if (!d) break; d.tr = 0.7 + brng() * 0.6; d.tg = 0.7 + brng() * 0.6; d.tb = 0.7 + brng() * 0.6; S.bikes.push({ d, L, s: brng() * L.len, v: 3.5 + brng() * 3 }); }
    // ---- dust devils wander the open playa by day ----
    for (let i = 0; i < 4; i++) S.devils.push({ x: Math.sin(i * 1.7) * 220, z: -Math.cos(i * 1.7) * 220, a: i * 1.3, t: i * 4 });
    // the city's people, missions and mini-games (42_burns_ow_life.js), and other worlds' quests placed in the city
    try { if (BurnsOW.buildLife) BurnsOW.buildLife(api, g); } catch (e) { console.error('ow life', e); }
    try { if (BurnsOW.buildQuests) BurnsOW.buildQuests(api, g); } catch (e) { console.error('ow quests', e); }
    // where Brady starts: Gate Road the first time, afterwards wherever he was
    const sv = BurnsSave.get(), ow = sv.ow;
    if (ow && ow.x !== undefined && !g.opts.fresh && !g.opts.spawn) g.opts.spawn = { x: ow.x, y: ow.y || 0, z: ow.z, yaw: ow.yaw || 0 };
  },
  /* ---- the neighbourhoods: one tile at a time, a block per step ---- */
  tiles: {
    size: 160, load: 300, free: 480, budget: 3.5, prime: 120,
    region: (x, z) => BURNS_OW.region(x, z),
    onRegion(g, r, prev) { if (r && prev && g.state === 'play' && !g.cine) g.toast(r.toUpperCase()); },
    *build(api, g, tile) {
      const O = BURNS_OW;
      for (const b of O.blocks()) {
        if (b.reserved || b.cx < tile.x0 || b.cx >= tile.x1 || b.cz < tile.z0 || b.cz >= tile.z1) continue;
        yield* BurnsOW.fillBlock(api, g, b);
        yield;
      }
      // a street sign at every intersection ('4:30 & Carousel'); on the Esplanade only beside open blocks
      let ns = 0;
      for (let k = 0; k < O.RINGS.length; k++) for (let h = O.H0; h <= O.H1 + 1e-6; h += 0.5) {
        const q = O.at(h + 0.03, O.RINGS[k] + (k ? 6 : 9.5)); if (q[0] < tile.x0 || q[0] >= tile.x1 || q[1] < tile.z0 || q[1] >= tile.z1) continue;
        if (k === 0) { const b1 = BurnsOW.blockAt(0, h), b0 = BurnsOW.blockAt(0, h - 0.5); if ((b1 && b1.reserved) || (b0 && b0.reserved)) continue; }
        BurnsOW.streetSign(api, h, k, q);
        if (++ns % 6 === 0) yield;
      }
      // walk-in camping beyond Firefly: scattered tents
      const rng = mulberry32(tile.i * 7331 + tile.j * 131);
      for (let n = 0; n < 14; n++) {
        const x = lerp(tile.x0, tile.x1, rng()), z = lerp(tile.z0, tile.z1, rng()), r = Math.hypot(x, z), h = O.clock(x, z);
        if (r < O.OUTER + 12 || r > O.OUTER + 75 || h < O.H0 || h > O.H1 || O.outside(x, z)) continue;
        BurnsOW.tent(api, x, z, rng);
      }
    }
  },
  onStart(g) {
    const O = BURNS_OW, S = O.state;
    BurnsOW.applyStoryTime(g, true);
    S.manCh = null;
    const nx = BurnsOW.nextPlace();
    if (!BurnsSave.flag(O.ID, 'arrived')) { BurnsSave.flag(O.ID, 'arrived', true); g.banner('BLACK ROCK CITY', nx ? `Your story continues at ${nx.name}. Follow the light.` : 'Welcome home.', { col: '#ffd84a' }); }
    else if (nx) g.banner('BLACK ROCK CITY', `Next: ${nx.name}`, { col: '#ffd84a', small: true });
  },
  onResume(g, sub, how) {
    BurnsOW.applyStoryTime(g, false);
    g.missions.refresh();   // quests that wait on a story world (requires '17:arrive', unlock) open up
    const nx = BurnsOW.nextPlace();
    if (how === 'done' && nx) g.banner(BurnsWorlds.day(nx.world).toUpperCase() || 'NEXT', `Next: ${nx.name}. Follow the light.`, { col: '#ffd84a' });
  },
  travel(g, w) {
    const P = BURNS_OW.PLACES.find(q => q.world === w); if (!P) return;
    const x = P.x + Math.sin(P.yaw) * 5, z = P.z + Math.cos(P.yaw) * 5;
    g.player.teleport(x, (P.y || 0) + 0.2, z, P.yaw); g.camYaw = P.yaw; g.snapCam = true;
    if (g.tiles) g.tiles.prime(x, z, 160);
    g.banner(P.name.toUpperCase(), BurnsWorlds.day(w) || '', { col: '#ffd84a', small: true });
  },
  update(g, dt) { BurnsOW.update(g, dt); if (BurnsOW.updateGames) BurnsOW.updateGames(g, dt); if (BurnsOW.questHook) BurnsOW.questHook('update', g, dt); },
  // an open world needs to see far: thinner fog than the small worlds (and thinner still from up high)
  env(g, env) { const k = g.cam && g.cam.y > 12 ? 0.32 : 0.55; env.fogD *= k; },
  drawSkinned(g, R) { BurnsOW.drawMan(g, R); if (BurnsOW.drawGamesSkinned) BurnsOW.drawGamesSkinned(g, R); },
  onRespawn(g) { if (BurnsOW.bungeeOn && BurnsOW.bungeeOn(g)) BW11Dome.abort(g); },
  drawShadows(g, R) { BurnsOW.drawMan(g, R); },
  drawSprites(g, R) { BurnsOW.drawSprites(g, R); if (BurnsOW.drawGames) BurnsOW.drawGames(g, R); if (BurnsOW.questHook) BurnsOW.questHook('drawSprites', g, R); },
  drawHUD(ctx, g, W, H, S) { BurnsOW.drawHUD(ctx, g, W, H, S); if (BurnsOW.drawGamesHUD) BurnsOW.drawGamesHUD(ctx, g, W, H, S); if (BurnsOW.questHook) BurnsOW.questHook('drawHUD', ctx, g, W, H, S); }
});

Object.assign(BurnsOW, {
  // the block fill: RVs and campers parked along both streets, camps and tents in the middle, people at the camps
  // street-sign blades: one shared texture per street name and per radial time (24 for the whole city)
  blade(text, w) { return BURNS_ATLAS.sign(text, { bg: '#1e4a32', fg: '#f6f6ee', border: '#f6f6ee', borderW: 3, size: 40, pad: 12, w }); },
  blockAt(k, h) { const O = BURNS_OW; if (!O._bmap) { O._bmap = new Map(); for (const b of O.blocks()) O._bmap.set(b.k + ':' + Math.round(b.h * 2), b); } return O._bmap.get(k + ':' + Math.round(h * 2)) || null; },
  // an intersection's street sign, BRC style: a pole with two crossed blades, the street (along the ring street) over
  // the radial's time, so '4:30 & Carousel' reads from both streets
  streetSign(api, h, k, q) {
    const O = BURNS_OW, st = this.blade(O.STREETS[k].toUpperCase(), 300), hr = this.blade(O.hourName(h), 230), yR = O.yawIn(h);
    api.mesh(q[0], q[1], m => {
      m.color('#4a4a52'); m.cyl(0, 0, 0, 0.05, 0.045, 2.6, 6, {}); m.cyl(0, 2.6, 0, 0.03, 0.03, 0.75, 5, {});
      const bl = (reg, y, yaw) => {
        const bh = 0.34, w = Math.min(2.4, bh * reg.aspect);
        m.push(); m.tf(0, 0, 0, yaw);
        m.color('#1e4a32'); m.box(0, y, 0, w + 0.05, bh + 0.05, 0.08);
        m.color('#ffffff', 0.25); m.decal(0, y, 0.042, w, bh, reg); m.push(); m.tf(0, 0, -0.042, Math.PI); m.decal(0, y, 0, w, bh, reg); m.pop(); m.emissive(0);
        m.pop();
      };
      bl(st, 2.8, yR); bl(hr, 3.18, yR + Math.PI / 2);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.09, y0: 0, y1: 3.3, camPass: true, walk: false }] };
    }, { noAO: true });
  },
  // ---- a neighbourhood block: camp fronts line the streets (shade, string lights, people hanging out), RVs, tents
  //      and hexayurts behind them; every lot leaves a pool of light on the street at night ----
  // (a generator: the tile builder runs it a street front at a time)
  *fillBlock(api, g, b) {
    const O = BURNS_OW, rng = mulberry32(hashStr(b.id) + 17), people = [], crowd = !!api.world.crowd, K = Math.PI / 6;
    const T = BURNS_OW_TINTS, pickT = () => T[Math.floor(rng() * T.length)];
    const hexOf = t => '#' + t.map(v => Math.round(Math.min(1, v) * 255).toString(16).padStart(2, '0')).join('');
    // people hanging out (instanced crowd: a few shared poses per look)
    const folk = (q, face, n, anims, spread) => {
      if (!crowd) return;
      for (let k = 0; k < n; k++) { const a = rng() * TAU, r = Math.sqrt(rng()) * (spread || 1.8); api.extra(q[0] + Math.sin(a) * r, q[1] + Math.cos(a) * r, { yaw: face + (rng() - 0.5) * 2.2, anim: anims[Math.floor(rng() * anims.length)], look: Math.floor(rng() * 4), phase: rng() < 0.5 ? 0 : 0.5 }); }
    };
    // one lot on a street front: pt(d, s) is d m into the block from the curb and s m along the street;
    // face: the yaw looking out at the street; along: the street's own direction; w: the lot's width
    const lot = (pt, face, along, w) => {
      const roll = rng(), tint = pickT(), col = hexOf(tint), hw = w / 2;
      // (the run lies along its local x: facing the street puts it along the curb)
      const strings = (pr, multi) => { if (rng() < pr) { const q = pt(0.7, (rng() - 0.5) * 2); api.instance('ow_string', q[0], q[1], { yaw: face, tint: multi ? tint : BURNS_OW_WARM }); } };
      if (roll < 0.4) {
        // a theme camp's front: shade, a lounge / bar / dance corner, its sign, a flag, people out front
        const q = pt(4.9, 0); api.instance('ow_shadeC' + Math.floor(rng() * 3), q[0], q[1], { yaw: face, tint });
        strings(0.85, rng() < 0.5);
        if (rng() < 0.38) { const sq = pt(1.0, (rng() < 0.5 ? -1 : 1) * (hw - 2)), nm = this.campName(rng); api.sign(nm, sq[0], sq[1], { yaw: face, h: 1.1, maxW: 2.6, y: 1.4, style: this.campStyle(nm) }); }
        if (rng() < 0.4) { const fq = pt(2.0, (rng() < 0.5 ? -1 : 1) * (hw - 0.8)); api.instance('ow_flag', fq[0], fq[1], { yaw: rng() * TAU }); }
        folk(pt(1.6, (rng() - 0.5) * 3), face, 2 + Math.floor(rng() * 4), ['talk', 'idle', 'dance', 'idle']);
        const lq = pt(3.2, 0); api.light(lq[0], lq[1], 8.5, col, 0.6);
      } else if (roll < 0.62) {
        // an RV with an awning and a couple of people under it
        const q = pt(3.6, -2.8), v = rng(), sh = 0.88 + rng() * 0.2;
        api.instance(v < 0.5 ? 'ow_rv11' : v < 0.75 ? 'ow_camper5' : v < 0.9 ? 'ow_trailer7' : 'ow_bus4', q[0], q[1], { yaw: along + (rng() < 0.5 ? Math.PI : 0), tint: [sh, sh, sh * (0.95 + rng() * 0.1)] });
        const aq = pt(3.2, hw - 2.7); api.instance('ow_shade', aq[0], aq[1], { yaw: face, tint, scale: 0.75 });
        strings(0.4, false);
        folk(pt(2.4, hw - 2.7), face, 1 + Math.floor(rng() * 2), ['idle', 'talk']);
        const lq = pt(3, hw - 2.7); api.light(lq[0], lq[1], 7, '#ffb060', 0.42);
      } else if (roll < 0.76) {
        // a dome (half of them lit up), people dancing in the street out front
        const q = pt(6.0, 0); if (rng() < 0.55) api.instance('ow_domeL', q[0], q[1], { yaw: face }); else api.instance('ow_dome', q[0], q[1], { yaw: face, tint });
        strings(0.7, true);
        folk(pt(-0.6, 0), face + Math.PI, 2 + Math.floor(rng() * 3), ['dance', 'dance', 'idle'], 2.2);
        const lq = pt(2.4, 0); api.light(lq[0], lq[1], 9, this.pick(rng, ['#ff4fd8', '#38f2ff', '#b06aff']), 0.6);
      } else if (roll < 0.88) {
        // an art piece on the street with people around it (a fire barrel sometimes)
        const q = pt(2.8, 0), art = rng() < 0.5 ? 'ow_totem' : 'ow_flower'; api.instance(art, q[0], q[1], { yaw: rng() * TAU });
        if (rng() < 0.4) { const fq = pt(1.4, hw - 2); api.instance('ow_barrel', fq[0], fq[1], {}); api.fire(fq[0], 1.0, fq[1], 0.32, { hazard: false }); }
        folk(q, face, 3 + Math.floor(rng() * 3), ['idle', 'talk', 'talk'], 3.2);
        api.light(q[0], q[1], 8, art === 'ow_totem' ? '#38f2ff' : '#ff6ab0', 0.6);
      } else {
        // tents (and a fire barrel)
        const n = 2 + Math.floor(rng() * 2);
        for (let k = 0; k < n; k++) { const q = pt(2.6 + rng() * 4, (k - (n - 1) / 2) * 3.6); this.tent(api, q[0], q[1], rng); }
        if (rng() < 0.35) { const fq = pt(1.2, 0); api.instance('ow_barrel', fq[0], fq[1], {}); api.fire(fq[0], 1.0, fq[1], 0.32, { hazard: false }); }
        folk(pt(1.4, 0), face, Math.floor(rng() * 2), ['idle', 'talk']);
        const lq = pt(2.5, 0); api.light(lq[0], lq[1], 6, '#ffb060', 0.35);
      }
      // bikes parked on the curb
      if (rng() < 0.3) { const bq = pt(0.35, (rng() < 0.5 ? -1 : 1) * (hw - 1.2)); api.instance('ow_bikes', bq[0], bq[1], { yaw: along }); }
    };
    // the two ring-street fronts
    for (let side = 0; side < 2; side++) {
      const rc = side ? b.r1 : b.r0, inw = side ? -1 : 1;
      const arc = (b.h1 - b.h0) * K * rc, nl = Math.max(2, Math.round(arc / 14)), w = arc / nl;
      for (let i = 0; i < nl; i++) {
        const hc = lerp(b.h0, b.h1, (i + 0.5) / nl);
        lot((d, s2) => O.at(hc + s2 / (K * (rc + inw * d)), rc + inw * d), O.yawIn(hc) + (side ? Math.PI : 0), O.yawIn(hc) + Math.PI / 2, w);
      }
      yield;
    }
    // the two radial-street fronts (one lot each, mid-block)
    const rm = (b.r0 + b.r1) / 2, depth = b.r1 - b.r0, radial = depth > 26;
    if (radial) for (let side = 0; side < 2; side++) {
      const hk = side ? b.h1 : b.h0, inw = side ? -1 : 1;
      lot((d, s2) => O.at(hk + inw * d / (K * (rm + s2)), rm + s2), O.yawIn(hk) + (side ? Math.PI / 2 : -Math.PI / 2), O.yawIn(hk), Math.min(14, depth - 18));
    }
    yield;
    // the middle: RVs, tents and hexayurts where people sleep (and a porta-potty bank)
    const nm = Math.max(2, Math.floor((b.h1 - b.h0) * K * rm / 11)), rows = Math.max(0, Math.floor((depth - 20) / 7));
    for (let j = 0; j < rows; j++) for (let i = 0; i < nm; i++) {
      if (rng() < 0.2) continue;
      const h = lerp(b.h0, b.h1, (i + 0.5) / nm), r = b.r0 + 11.5 + j * 7, q = O.at(h, r), roll = rng(), tan = O.yawIn(h) + Math.PI / 2;
      if (radial && Math.min(h - b.h0, b.h1 - h) * K * r < 10) continue;   // the radial fronts' lots are there
      if (roll < 0.45) { const v = rng(), sh = 0.86 + rng() * 0.2; api.instance(v < 0.55 ? 'ow_rv11' : v < 0.8 ? 'ow_camper5' : 'ow_trailer7', q[0], q[1], { yaw: tan + (rng() < 0.5 ? Math.PI : 0), tint: [sh, sh, sh] }); }
      else if (roll < 0.65) api.instance('ow_hexa', q[0], q[1], { yaw: rng() * TAU });
      else { for (let k = 0; k < 2; k++) { const qq = O.at(h + (k - 0.5) * 0.02, r + (rng() - 0.5) * 2); this.tent(api, qq[0], qq[1], rng); } }
    }
    if (rng() < 0.3) { const q = O.at(b.h0 + 0.02, rm); api.instance('ow_potty', q[0], q[1], { yaw: O.yawIn(b.h0) + Math.PI / 2 }); }
    // a couple of neighbours you can talk to (real actors) at one camp front
    if (rng() < 0.4) {
      const h = (b.h0 + b.h1) / 2 + (rng() - 0.5) * 0.1, side = rng() < 0.5, front = (side ? b.r1 : b.r0) + (side ? -2.2 : 2.2), yaw = O.yawIn(h) + (side ? Math.PI : 0);
      const nn = 1 + Math.floor(rng() * 2);
      for (let k = 0; k < nn; k++) {
        const qq = O.at(h + (rng() - 0.5) * 0.04, front + (rng() - 0.5)), look = O.PEOPLE[Math.floor(rng() * O.PEOPLE.length)];
        const d = { type: look[0], seed: look[1], x: qq[0], z: qq[1], yaw: yaw + (rng() - 0.5), behavior: rng() < 0.5 ? 'dance' : 'chill', chatter: true };
        api.npc(d); people.push(d);
      }
    }
    return people;
  },
  // a tent: white, tinted one of the tent colours; some have a lantern by the door
  tent(api, x, z, rng) { const T = BURNS_OW.tentTints || (BURNS_OW.tentTints = BURNS_OW_COLS.tent.map(c => burnsRGBf(c))); api.instance('ow_tent', x, z, { yaw: rng() * TAU, tint: T[Math.floor(rng() * T.length)] }); },
  // far-city stand-ins for every block (world-wide; only drawn beyond the streamed neighbourhoods)
  farCity(api) {
    const O = BURNS_OW;
    for (const b of O.blocks()) {
      if (b.reserved) continue;
      const rng = mulberry32(hashStr(b.id) + 5), n = 3;
      for (let i = 0; i < n; i++) { const h = lerp(b.h0, b.h1, (i + 0.5) / n), q = O.at(h, (b.r0 + b.r1) / 2 + (rng() - 0.5) * 8); api.instance(rng() < 0.55 ? 'ow_farA' : 'ow_farB', q[0], q[1], { yaw: O.yawIn(h) + Math.PI / 2, noCol: true }); }
    }
  },
  pick(rng, a) { return a[Math.floor(rng() * a.length)]; },
  // a city side-quest giver: offers the quest, reminds while it's active, thanks when it's done
  giver(g, a, id, offer, thanks) {
    const st = g.missions.state(id);
    if (st === 'available') g.say(a, offer, () => { if (g.missions.start(id)) g.missions.track(id); });
    else if (st === 'done') g.say(a, thanks);
    else g.say(a, [g.missions.get(id).def.hint || 'Go on, you can do it.']);
  },
  campName(rng) {
    const A = ['Dusty', 'Cosmic', 'Glitter', 'Midnight', 'Sunrise', 'Electric', 'Velvet', 'Wandering', 'Lunar', 'Sparkle', 'Tiny', 'Secret', 'Radiant', 'Gentle', 'Feral'];
    const B = ['Pancake', 'Unicorn', 'Owl', 'Lagoon', 'Disco', 'Noodle', 'Cactus', 'Jellyfish', 'Lantern', 'Pickle', 'Coyote', 'Waffle', 'Comet', 'Llama', 'Bubble'];
    const C = ['Camp', 'Lounge', 'Village', 'Oasis', 'Embassy', 'Society', 'Cafe', 'Collective'];
    // 48 names, each always the same (its sign texture is shared by every camp that uses it: the sign pages stay small)
    const r = mulberry32(Math.floor(rng() * 48) * 7919 + 3);
    return `${this.pick(r, A)} ${this.pick(r, B)}\n${this.pick(r, C)}`.toUpperCase();
  },
  // a camp sign's colours come from its name (one texture per name)
  campStyle(name) { const hs = hashStr(name); return { bg: ['#1a0a2a', '#0a1a2a', '#2a0a12', '#102a1a'][hs % 4], fg: ['#ff9af0', '#9af8ff', '#ffd84a', '#b8ff8a'][(hs >> 3) % 4], border: BURNS_NEON[(hs >> 6) % 7], size: 34, pad: 16 }; },
  /* ---- the story: which place is next, and can Brady go in ---- */
  nextPlace() {
    const sv = BurnsSave.get();
    for (const id of BurnsWorlds.order) { if (sv.worldDone[id]) continue; if (!BurnsWorlds.get(id)) continue; return BURNS_OW.PLACES.find(q => q.world === id) || null; }
    return null;
  },
  canEnter(P) { const sv = BurnsSave.get(), nx = this.nextPlace(); return !!(sv.worldDone[P.world] || (nx && nx.world === P.world)); },
  enter(g, P) {
    if (g.cine || g.entering) return;
    if (!BurnsWorlds.get(P.world)) { g.toast('The burners are still building ' + P.short + '. Soon!'); return; }
    const sv = BurnsSave.get(), nx = this.nextPlace();
    if (!this.canEnter(P)) { g.toast('Not yet. Follow the light to ' + (nx ? nx.name : 'your next stop') + '.'); burnsSfx('bump'); return; }
    const p = g.player, back = { x: P.x + Math.sin(P.yaw) * 3.2, y: P.y || 0, z: P.z + Math.cos(P.yaw) * 3.2, yaw: P.yaw };
    this.saveSpot(g, back);
    g.entering = true; p.locked = true;
    if (!sv.unlocked[P.world]) BurnsSave.unlockWorld(P.world);
    const yaw = P.yaw, ex = P.x + Math.sin(yaw) * 9, ez = P.z + Math.cos(yaw) * 9;
    const y0 = P.y || 0;
    g.cutscene([
      { letterbox: true },
      { cam: { x: ex + Math.cos(yaw) * 3, y: y0 + 3.2, z: ez - Math.sin(yaw) * 3, tx: P.x, ty: y0 + 1.6, tz: P.z, fov: 0.85 } },
      { swell: 'burns_victory' },
      { title: { day: P.name.toUpperCase(), sub: BurnsWorlds.day(P.world) || 'Black Rock City' }, hold: 1.7 },
      { cam: { to: { x: P.x + Math.sin(yaw) * 2, y: y0 + 1.8, z: P.z + Math.cos(yaw) * 2, tx: P.x - Math.sin(yaw) * 4, ty: y0 + 1.4, tz: P.z - Math.cos(yaw) * 4, fov: 0.8 }, dur: 1.3 } },
      { fade: 'out', dur: 0.5 }
    ], () => { g.entering = false; p.locked = false; BurnsOpen.enter(g, P.world, { back, place: P.short }); });
  },
  saveSpot(g, at) { const sv = BurnsSave.get(), p = g.player, a = at || { x: p.x, y: p.y, z: p.z, yaw: p.yaw }; sv.ow = { x: Math.round(a.x * 10) / 10, y: Math.round((a.y || 0) * 10) / 10, z: Math.round(a.z * 10) / 10, yaw: Math.round((a.yaw || 0) * 100) / 100 }; BurnsSave.save(); },
  // the city's time of day follows the story: the next place's day (Monday night, Tuesday dawn...)
  applyStoryTime(g, first) {
    const nx = this.nextPlace(), def = nx && BurnsWorlds.get(nx.world);
    const day = nx ? String(BurnsWorlds.day(nx.world) || '').toLowerCase() : 'night';
    const pal = def && def.sky ? [def.sky, def.sky2 || null, def.tod || 0] : /night/.test(day) ? ['dusk', 'night', 0.8] : /dawn/.test(day) ? ['night', 'dawn', 0.7] : /afternoon|arrival/.test(day) ? ['day', 'dusk', 0.45] : ['dawn', 'day', 0.8];
    const key = pal.join('|');
    if (BURNS_OW.state.palKey !== key) {
      BURNS_OW.state.palKey = key;
      g.palA = pal[0]; g.palB = pal[1]; g.tod = pal[2]; g.todTarget = null;
      if (!first && nx) g.dayCard();
    }
  },
  /* ---- per step ---- */
  update(g, dt) {
    const O = BURNS_OW, S = O.state; if (!S) return;
    S.t += dt;
    // bikes along their loops
    for (const B of S.bikes) {
      B.s = (B.s + B.v * dt) % B.L.len;
      const L = B.L, pts = L.pts, acc = L.acc; let i = B.i || 0;
      while (i < pts.length - 1 && acc[i + 1] < B.s) i++; while (i > 0 && acc[i] > B.s) i--;
      B.i = i; const a = pts[i], b = pts[(i + 1) % pts.length], seg = (acc[i + 1] - acc[i]) || 1, t = (B.s - acc[i]) / seg;
      B.d.x = lerp(a[0], b[0], t); B.d.z = lerp(a[1], b[1], t); B.d.y = 0; B.d.yaw = Math.atan2(b[0] - a[0], b[1] - a[1]);
    }
    // art cars circle the Man
    for (const C of S.cars) {
      C.a += C.w * dt; const mv = C.mv;
      mv.x = Math.sin(C.a) * C.r; mv.z = -Math.cos(C.a) * C.r; mv.y = 0; mv.yaw = (C.w > 0 ? Math.PI / 2 : -Math.PI / 2) - C.a;   // facing along the circle
    }
    // dust devils drift (day only)
    for (const D of S.devils) { D.t += dt; D.x += Math.sin(D.t * 0.13 + D.a) * dt * 2.2; D.z += Math.cos(D.t * 0.11 + D.a * 1.7) * dt * 2.2; }
    // dust in the air by day: soft clouds rolling down the streets with the wind, all around Brady (drawn in drawSprites)
    const cam = g.cam, day = 1 - (g.R ? (g.R.night || 0) : 0);
    if (cam && day > 0.25) {
      const W = S.wind || (S.wind = [0.82, 0.57]), D = S.dust || (S.dust = []);
      const spawn = (q, fresh) => { const a = Math.random() * TAU, r = 14 + Math.random() * 60; q.x = cam.x + Math.sin(a) * r - W[0] * (fresh ? 0 : 20); q.z = cam.z + Math.cos(a) * r - W[1] * (fresh ? 0 : 20); q.s = 5 + Math.random() * 8; q.v = 2.5 + Math.random() * 3; q.t = fresh ? Math.random() * 10 : 0; q.life = 9 + Math.random() * 8; return q; };
      while (D.length < 16) D.push(spawn({}, true));
      for (const q of D) { q.x += W[0] * q.v * dt; q.z += W[1] * q.v * dt; q.t += dt; if (q.t > q.life || Math.hypot(q.x - cam.x, q.z - cam.z) > 95) spawn(q, false); }
    }
    // gusts of dust roll across the city by day
    S.gustT = (S.gustT || 0) - dt;
    if (S.gustT <= 0 && g.player && (g.R ? (g.R.night || 0) : 0) < 0.4) { S.gustT = 1.2 + Math.random() * 2; const p = g.player, a = Math.random() * TAU, r = 8 + Math.random() * 16; g.fx.dust(p.x + Math.sin(a) * r, 0.4, p.z + Math.cos(a) * r, 6); }
    // save where Brady is now and then (CONTINUE resumes here)
    S.saveT = (S.saveT || 0) - dt;
    if (S.saveT <= 0 && g.player && g.state === 'play' && !g.cine) { S.saveT = 4; this.saveSpot(g); }
  },
  /* ---- drawing ---- */
  drawMan(g, R) {
    const S = BURNS_OW.state; if (!S || !S.man) return;
    if (!S.manCh) { const m = BurnsManModel.build(); S.manModel = m; S.manCh = new BurnsChar(m); S.manCh.play('idle', {}, true); }
    const ch = S.manCh, M = S.man;
    if (R.pass !== 'shadow') { ch.x = 0; ch.y = M.y; ch.z = 0; ch.yaw = 0; ch.scale = M.scale; ch.update(g.lastFdt || 0.016); ch.compute(); }
    const d = Math.hypot(g.cam.x, g.cam.z); if (d > 900) return;
    R.skin(S.manModel.geo, ch.bones, ch.nb, null, 0, 0.3);
  },
  drawSprites(g, R) {
    const S = BURNS_OW.state, SP = BURNS_SPRITES.R; if (!S) return;
    const night = R.night || 0, t = g.time;
    // the next story place: a tall beacon of light you can see across the city
    const nx = this.nextPlace();
    if (nx) {
      const pul = 0.75 + Math.sin(t * 2.4) * 0.25, y0 = (nx.y || 0);
      for (let k = 0; k < 9; k++) R.bbs.bb(nx.x, y0 + 6 + k * 12, nx.z, 3.2 + k * 0.25, 13, SP.beam, [1, 0.85, 0.35], (0.55 - k * 0.04) * pul, true);
      R.bbs.bb(nx.x, y0 + 2.2, nx.z, 5, 5, SP.glow, [1, 0.85, 0.4], 0.8 * pul, true);
    }
    // the art cars circling the Man leave light trails at night
    if (night > 0.3) for (const C of S.cars) { const sg = Math.sign(C.w) || 1, col = [[0.2, 0.9, 1], [1, 0.85, 0.3], [1, 0.3, 0.85]][S.cars.indexOf(C) % 3]; for (let i = 1; i < 10; i++) { const a = C.a - sg * i * 0.012; R.bbs.bb(Math.sin(a) * C.r, 1.4, -Math.cos(a) * C.r, 1.6, 1.6, SP.glow, col, (1 - i / 10) * 0.55 * night, true); } }
    // the Man glows at night (neon outline at his heart)
    if (night > 0.2) R.bbs.bb(0, 7.5 + 9 * 1.45, 0.5, 6, 6, SP.glow, [0.4, 0.8, 1], night * 0.7, true);
    // drifting dust clouds (day)
    if (night < 0.75 && S.dust) for (const q of S.dust) { const k = Math.sin(Math.PI * Math.min(1, q.t / q.life)) * (1 - night / 0.75); if (k > 0.02) R.bbs.bb(q.x, q.s * 0.3, q.z, q.s, q.s * 0.55, SP.puff, [0.9, 0.8, 0.68], 0.11 * k, false); }
    // dust devils by day: spinning columns of dust
    if (night < 0.5) for (const D of S.devils) {
      const k = 1 - night * 2; if (Math.hypot(D.x - g.cam.x, D.z - g.cam.z) > 320) continue;
      for (let i = 0; i < 7; i++) { const a = t * 3 + i * 0.9, rr = 0.6 + i * 0.45; R.bbs.bb(D.x + Math.sin(a) * rr, 1 + i * 2.2, D.z + Math.cos(a) * rr, 3 + i * 0.8, 3 + i * 0.6, SP.puff, [0.86, 0.74, 0.62], 0.16 * k, false); }
    }
  },
  // HUD: an arrow toward the next story place, with its name and distance
  drawHUD(ctx, g, W, H, S) {
    const nx = this.nextPlace(); if (!nx || g.cine || g.dialog.open) return;
    const p = g.player, dx = nx.x - p.x, dz = nx.z - p.z, d = Math.hypot(dx, dz); if (d < 12) return;
    const o = {}, onScreen = g.R && g.R.project(nx.x, (nx.y || 0) + 4, nx.z, W, H, o) && o.x > 40 && o.x < W - 40 && o.y > 60 && o.y < H - 60;
    let x, y, rot;
    if (onScreen) { x = o.x; y = o.y - 22; rot = Math.PI; }
    else {
      const rel = Math.atan2(dx, dz) - g.camYaw, sa = -Math.atan2(Math.sin(rel), Math.cos(rel));   // on screen: 0 = up, clockwise
      x = W / 2 + Math.sin(sa) * (W / 2 - 70); y = H / 2 - Math.cos(sa) * (H / 2 - 90); rot = sa;
    }
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(255,216,74,0.92)'; ctx.strokeStyle = 'rgba(30,14,40,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, 6); ctx.lineTo(0, 2); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    BurnsUI.text(ctx, `${nx.name}  ${d > 999 ? (d / 1000).toFixed(1) + ' km' : Math.round(d) + ' m'}`, x, y + 18, 11, '#ffd84a', { ui: true });
  }
});

if (typeof window !== 'undefined') window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsOW, BURNS_OW });
