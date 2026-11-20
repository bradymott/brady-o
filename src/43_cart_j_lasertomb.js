/* ============================================================
   ART CART — LASER TOMB, Pyramid Scheme's career track (Nov 19 2026; recipe: docs/ART_CART_LEVEL_RECIPE.md).
   A desert night round and THROUGH a giant stepped pyramid that runs its own laser light show (the one level where
   boxy is the point). One lap of about 1.05 km:
     THE PROCESSION   the start straight under the pylon gate, past obelisks and the grandstands
     THE TRAP FLOOR   a hall of sandstone floor tiles: every few seconds a pattern of tiles SHAKES (amber, 1 s) and then
                      DROPS OPEN: a car on an open tile falls onto the spring at the bottom and is BOINGED back up, slow
                      (steer onto the solid tiles, or HOP over the hole)
     THE WRAP PARTY   the esses, where bandage-wrapped burners (MUMMIES, EL wire, goggles on) shuffle across the road;
                      when a car comes they RAISE THEIR ARMS (eyes glow, a ring shows their reach, 1 s) and LUNGE for it,
                      then fall flat on their faces (steer wide of raised arms, or pass while they're down)
     THE STONE RUN    the wide approach to the east gate: the ROLLING STONE (a grumpy carved ball) rocks in the gateway
                      (1.6 s, chevrons light its lane) and then rolls out at the traffic, down one half of the road
                      (switch lanes: the arrows show its lane)
     THE GRAND GALLERY the tunnel through the pyramid: three LASER GRIDS across the road; each one ARMS (1.1 s: the lit
                      lanes flash red, the safe pair glows green) and then fires a curtain of beams in all but two lanes
                      (drive through the GREEN lanes, or ease off until it switches off)
     OBELISK BENDS    out of the west gate, round the obelisks and back to the line
   Pyramid Scheme's PRISM WARP is in everyone's gift boxes here (CART_TRACKS.lasertomb.car = 'pyramid').
   Start it without the menus: BRADY_CART.debug.start({ mode: 'career', track: 'lasertomb' }) (or mode 'quick').
   Everything here is an original design (generic stepped pyramid, made-up glyphs, comic mummies, no real artwork).
   ============================================================ */
const LTB_C = { green: [0.25, 1, 0.55], lime: [0.6, 1, 0.35], red: [1, 0.16, 0.22], hot: [1, 0.3, 0.5], amber: [1, 0.62, 0.15], gold: [1, 0.8, 0.3], white: [1, 1, 1], black: [0, 0, 0], cyan: [0.3, 0.95, 1], magenta: [1, 0.3, 0.9], violet: [0.62, 0.38, 1], dusk: [0.06, 0.04, 0.03] };
const LTB_SHOW = [[0.25, 1, 0.55], [1, 0.3, 0.9], [0.3, 0.95, 1], [1, 0.8, 0.3], [0.62, 0.38, 1]];
const LTB_T = { at: {}, at2: {}, p: [0, 0, 0] };
// the pyramid: centre, base half-size, tier height and step, the gallery slot's half-width (the road runs along z = 100)
const LTB_PYR = { x: 0, z: 100, h: 75, th: 7, step: 9, slot: 19.5, open: 5 };

/* ---------------- the course ---------------- */
// corners [x, z, radius]: the procession (south, eastward), the esses (east), the stone run and the grand gallery
// (westward along z = 100 straight through the pyramid), the obelisk bends (west) back down to the line
const LTB_POLY = [[-190, -40, 36], [160, -40, 30], [175, 15, 18], [215, 45, 18], [220, 100, 30], [-160, 100, 28], [-215, 55, 18], [-170, 25, 18]];
const ltbWidth = (x, z) => {
  if (z > 80 && x > 92 && x < 190) return 1.45;          // the stone run: room to dodge the stone
  if (z > 80 && Math.abs(x) <= 92) return 1.2;           // the grand gallery
  if (z < -20 && x > 30 && x < 125) return 1.25;         // the trap floor
  return 1;
};
CART_TRACKS.lasertomb = {
  name: 'LASER TOMB', car: 'pyramid', tod: 'night', music: 'kart2', width: 20, shoulder: 6, theme: 'tomb', blurb: 'Trap floors, mummies, a rolling stone and laser grids',
  pts: CartKit.course(LTB_POLY, { start: [-50, -40], width: ltbWidth, step: 18 }),
  world: (id, D) => ltbWorld(id, D)
};
CART_CAREER_TRACKS.pyramid = 'lasertomb';

/* ---------------- static pieces (merged into the world's chunks) ---------------- */
// one block of a pyramid tier: sandstone with two dark course lines round it and neon trim on its top edges
function ltbBlock(m, w, h, d, tier, trim) {
  m.color(tier % 2 ? '#bf985e' : '#caa46a').shine(0); m.roundBox(0, h / 2, 0, w, h, d, 0.35, { top: '#dcbc84' });
  m.color('#8a6a40'); for (const y of [h * 0.34, h * 0.68]) { m.box(0, y, d / 2 + 0.04, w - 0.6, 0.18, 0.06); m.box(0, y, -d / 2 - 0.04, w - 0.6, 0.18, 0.06); m.box(w / 2 + 0.04, y, 0, 0.06, 0.18, d - 0.6); m.box(-w / 2 - 0.04, y, 0, 0.06, 0.18, d - 0.6); }
  if (trim) { m.color(trim, 1); m.box(0, h + 0.1, d / 2 - 0.2, w - 0.2, 0.22, 0.22); m.box(0, h + 0.1, -d / 2 + 0.2, w - 0.2, 0.22, 0.22); m.box(w / 2 - 0.2, h + 0.1, 0, 0.22, 0.22, d - 0.2); m.box(-w / 2 + 0.2, h + 0.1, 0, 0.22, 0.22, d - 0.2); m.emissive(0); }
}
// a made-up glyph (laser-lit, on the gallery walls), drawn in the local xy plane facing +z: k picks the shape
function ltbGlyph(m, k, col) {
  m.color(col, 1);
  const L = (x0, y0, x1, y1) => m.limb(x0, y0, 0, x1, y1, 0, 0.07, 0.07, { seg: 4 });
  if (k === 0) { L(-0.9, -0.7, 0, 0.8); L(0, 0.8, 0.9, -0.7); L(0.9, -0.7, -0.9, -0.7); L(-0.4, -0.2, 0.4, -0.2); }                 // a little pyramid
  else if (k === 1) { for (let i = 0; i < 3; i++) { const y = 0.5 - i * 0.5; L(-0.9, y, -0.45, y + 0.25); L(-0.45, y + 0.25, 0, y); L(0, y, 0.45, y + 0.25); L(0.45, y + 0.25, 0.9, y); } }   // ripples
  else if (k === 2) { m.ball(0, 0.62, 0, 0.18, { seg: 6, rings: 4 }); L(0, 0.45, 0, -0.2); L(0, -0.2, -0.35, -0.8); L(0, -0.2, 0.35, -0.8); L(0, 0.25, 0.55, 0.85); L(0, 0.25, -0.45, 0.05); }   // a recruiter pointing up
  else if (k === 3) { L(0, -0.85, 0, 0.75); L(-0.5, 0.25, 0, 0.8); L(0.5, 0.25, 0, 0.8); for (const y of [-0.5, -0.1]) L(-0.3, y, 0.3, y); }   // an arrow up (the only way is up)
  else { m.torus(0, 0, 0, 0.6, 0.06, { seg: 14, tseg: 3 }); m.ball(0, 0, 0, 0.16, { seg: 6, rings: 4 }); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; L(Math.cos(a) * 0.75, Math.sin(a) * 0.75, Math.cos(a) * 0.98, Math.sin(a) * 0.98); } }   // a sunburst coin
  m.emissive(0);
}
// the pylon gate over the start line: two tapered towers, a lintel 12 m up, neon trims (local x across the road)
function ltbPylonGate(m, W) {
  const lights = [];
  for (const sd of [-1, 1]) {
    m.color('#c29a62'); m.box(sd * (W / 2 + 2.6), 7.5, 0, 5.2, 15, 5.2, { taper: 0.62, top: '#d8b880' });
    m.color('#8a6a40'); for (const y of [3, 6, 9, 12]) m.box(sd * (W / 2 + 2.6), y, 2.66 - y * 0.045, 5.2 - y * 0.13, 0.25, 0.08);
    m.color('#3aff8a', 1); m.box(sd * (W / 2 + 2.6), 15.1, 0, 3.4, 0.25, 3.4); m.emissive(0);
    m.color('#ffd84a', 0.6).shine(3); m.cyl(sd * (W / 2 + 2.6), 15.2, 0, 1.1, 0, 2.2, 4, { stripes: ['#ffd84a', '#e8b83a'], yaw0: Math.PI / 4 }); m.emissive(0).shine(0);
    lights.push({ x: sd * (W / 2 + 2.6), y: 17.6, z: 0, s: 2.2, c: '#3aff8a' });
  }
  m.color('#b8905a'); m.roundBox(0, 12.6, 0, W + 4, 2.2, 2.6, 0.25, { top: '#d8b880' });
  m.color('#ff3ad8', 1); m.box(0, 11.45, 1.32, W + 3.6, 0.2, 0.12); m.box(0, 11.45, -1.32, W + 3.6, 0.2, 0.12); m.color('#3aff8a', 1); m.box(0, 13.75, 1.32, W + 3.6, 0.2, 0.12); m.box(0, 13.75, -1.32, W + 3.6, 0.2, 0.12); m.emissive(0);
  return { cols: [{ t: 'box', x: -(W / 2 + 2.6), z: 0, hx: 2.6, hz: 2.6, y0: 0, y1: 15, camPass: true }, { t: 'box', x: W / 2 + 2.6, z: 0, hx: 2.6, hz: 2.6, y0: 0, y1: 15, camPass: true }], lights };
}
// a laser emitter pillar at a gate (the beams are sprites): a dark column with a lens stack facing the road (+z)
function ltbEmitter(m) {
  m.color('#2a2230').shine(2); m.roundBox(0, 1.9, 0, 1.3, 3.8, 1.3, 0.25);
  m.color('#ffd84a', 0.4).shine(3); m.roundBox(0, 3.95, 0, 1.5, 0.3, 1.5, 0.12); m.cyl(0, 4.1, 0, 0.75, 0, 1.0, 4, { stripes: ['#ffd84a', '#e0b030'], yaw0: Math.PI / 4 });
  m.color('#ff4060', 1); for (const y of [0.6, 1.4, 2.2]) { m.push(); m.tf(0, y, 0.66, 0, Math.PI / 2, 0); m.cyl(0, 0, 0, 0.2, 0.2, 0.08, 10); m.pop(); }
  m.emissive(0).shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.65, hz: 0.65, y0: 0, y1: 4 }] };
}
// a wall sconce in the gallery: a bracket and a bowl of fire (the fire is the world's)
function ltbSconce(m) {
  m.color('#3a2a1e').shine(1); m.box(0, 4.0, -0.2, 0.3, 0.9, 0.4); m.limb(0, 4.0, 0, 0, 4.6, 0.55, 0.08, 0.08, { seg: 5 });
  m.color('#ffd84a', 0.2).shine(3); m.push(); m.tf(0, 4.7, 0.6); m.lathe([[0.45, 0.25], [0.38, 0], [0.12, -0.2], [0, -0.22]], { seg: 10 }); m.pop(); m.emissive(0).shine(0);
  return { lights: [{ x: 0, y: 5.1, z: 0.6, s: 1.6, c: '#ffa040', fire: true }] };
}
// a sarcophagus stood on end (the wrap party's furniture): a rounded case with a comic painted face and stripes
function ltbSarc(m, open) {
  m.color('#2a3a8a').shine(2); m.roundBox(0, 1.35, 0, 1.3, 2.7, 0.7, 0.3);
  m.color('#ffd84a', 0.25).shine(3); m.ellipsoid(0, 2.35, 0.32, 0.45, 0.42, 0.12, { seg: 10, rings: 6 }); for (const y of [0.6, 1.0, 1.4]) m.box(0, y, 0.36, 1.1, 0.12, 0.05); m.shine(0);
  m.color('#1a1020'); for (const sx of [-0.15, 0.15]) m.ball(sx, 2.42, 0.43, 0.06, { seg: 6, rings: 4 }); m.color('#ff4f8a'); m.limb(-0.12, 2.2, 0.44, 0.12, 2.2, 0.44, 0.025, 0.025, { seg: 3 });
  if (open) { m.color('#2a3a8a').shine(2); m.push(); m.tf(0.9, 0, 0.4, -0.9); m.roundBox(0, 1.35, 0, 1.3, 2.7, 0.2, 0.08); m.pop(); m.shine(0); }
  m.emissive(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.7, hz: 0.4, y0: 0, y1: 2.7 }] };
}

/* ---------------- instanced props (this world only) ---------------- */
const LTB_KINDS = {
  // an obelisk with a glowing capstone (tinted cap)
  ltb_obelisk: { r: 1.6, near: 40, mid: 140, farD: 360, glows: [[0, 11.3, 0, 1.6]], pool: 7,
    build(m) {
      m.color('#c8a26a'); m.roundBox(0, 0.4, 0, 2.6, 0.8, 2.6, 0.12);
      m.color('#d0aa72'); m.box(0, 5.6, 0, 1.5, 9.6, 1.5, { taper: 0.7, top: '#e0c08a' });
      m.color('#7a5a36'); for (let i = 0; i < 5; i++) m.box(0, 2.2 + i * 1.6, 0.72 - i * 0.035, 0.5, 0.5, 0.05);
      m.color('#ffffff', 1).shine(3); m.cyl(0, 10.4, 0, 0.75, 0, 1.4, 4, { stripes: ['#ffffff', '#e8e8e8'], yaw0: Math.PI / 4 }); m.emissive(0).shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.3, hz: 1.3, y0: 0, y1: 10 }] };
    },
    far(m) { m.color('#d0aa72'); m.box(0, 5.4, 0, 1.5, 10.8, 1.5, { taper: 0.7 }); m.color('#ffffff', 1); m.box(0, 11.2, 0, 0.8, 1.0, 0.8); m.emissive(0); } },
  // a little pyramid (the downline) with neon edges (tinted edges)
  ltb_minipyr: { r: 8, near: 50, mid: 170, farD: 420, glows: [[0, 9.8, 0, 2.2]], pool: 10,
    build(m) {
      m.color('#c49c64'); m.cyl(0, 0, 0, 10, 0, 9.5, 4, { stripes: ['#d6b07a', '#a8824e'], yaw0: Math.PI / 4 });
      m.color('#ffffff', 1); for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; m.limb(Math.sin(a) * 10, 0.1, Math.cos(a) * 10, 0, 9.5, 0, 0.14, 0.1, { seg: 4 }); } m.emissive(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 6.5, y0: 0, y1: 8 }] };
    },
    far(m) { m.color('#c49c64'); m.cyl(0, 0, 0, 10, 0, 9.5, 4, { stripes: ['#d6b07a', '#a8824e'], yaw0: Math.PI / 4 }); } },
  // a date palm (tinted lights in its crown)
  ltb_palm: { r: 3, soft: 0.6, near: 40, mid: 140, farD: 340, glows: [[0, 7.4, 0, 1.4]], pool: 5,
    build(m, o) {
      m.color('#7a5a3a'); for (let i = 0; i < 6; i++) m.limb(Math.sin(i * 0.5) * 0.2 * i / 6, i * 1.25, 0, Math.sin((i + 1) * 0.5) * 0.2 * (i + 1) / 6, (i + 1) * 1.25, 0, 0.28 - i * 0.02, 0.26 - i * 0.02, { seg: 7 });
      m.color('#3a8a3a'); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; m.limb(0.2, 7.5, 0, 0.2 + Math.sin(a) * 2.6, 6.6, Math.cos(a) * 2.6, 0.22, 0.05, { seg: 4 }); m.limb(0.2 + Math.sin(a) * 2.6, 6.6, Math.cos(a) * 2.6, 0.2 + Math.sin(a) * 3.6, 5.6, Math.cos(a) * 3.6, 0.05, 0.02, { seg: 3 }); }
      m.color('#ffffff', o.night ? 1 : 0); for (let i = 0; i < 3; i++) m.ball(0.2 + Math.sin(i * 2.1) * 0.5, 7.0, Math.cos(i * 2.1) * 0.5, 0.18, { seg: 6, rings: 4 }); m.emissive(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.4, y0: 0, y1: 7 }] };
    },
    far(m) { m.color('#7a5a3a'); m.box(0, 3.7, 0, 0.5, 7.5, 0.5); m.color('#3a8a3a'); m.box(0, 7.2, 0, 5, 0.8, 5); } },
  // a tiny emissive pyramid stud on the road edges (reads the edge at night)
  ltb_stud: { r: 0.6, near: 40, mid: 140, farD: 260, noAO: true, shadow: false,
    build(m) { m.color('#ffffff', 1); m.cyl(0, 0, 0, 0.32, 0, 0.36, 4, { stripes: ['#ffffff', '#d8d8d8'], yaw0: Math.PI / 4 }); m.emissive(0); },
    far(m) { m.color('#ffffff', 1); m.box(0, 0.1, 0, 0.4, 0.2, 0.4); m.emissive(0); } }
};

/* ---------------- building the world ---------------- */
function ltbWorld(id, D) {
  const sky = Object.assign({}, BURNS_PALETTES.night, { zen: '#040612', hor: '#2a3a6a', fog: '#141a2c', fogD: 0.0048, haze: 0.2, sky: '#1a2448', gnd: '#2a2218', mid: '#2a2040', midK: 0.3, cityCol: '#3aff8a', cityK: 0.2, key: '#b8c8ff', keyK: 0.6, emB: 1.8, stars: 0.95, clouds: 0.15, cloudCol: '#2a2a48', moon: [120, 34], rim: '#3aff8a' });
  const W = CartKit.world(id, D, { worldId: 1206, night: true, sky, ground: '#a88c62', crack: 0.12,
    road: { shoulder: 'rgba(90,70,44,0.45)', band: 'rgba(58,46,36,0.92)', edge: 'rgba(80,255,150,0.9)', edgeW: 0.55, centerFn: ltbPaintCenter } });
  const { E, T, api, rng } = W, P0 = LTB_PYR;
  const S = { trap0: CartKit.sOf(T, 42, -40), trap1: CartKit.sOf(T, 114, -40), mum0: CartKit.sOf(T, 168, -8), mum1: CartKit.sOf(T, 217, 66),
    stoneEnd: CartKit.sOf(T, 182, 100), mouth: CartKit.sOf(T, 84, 100), gal0: CartKit.sOf(T, 75, 100), gal1: CartKit.sOf(T, -75, 100), bends: CartKit.sOf(T, -205, 55) };
  E.ltb = { S, gates: [], mummies: [], show: { x: P0.x, y: 0, z: P0.z } };
  const taken = [[P0.x, P0.z, P0.h + 8]];
  const side = (s, sd, off) => { const g = T.at(s, {}), o = sd > 0 ? g.wr + off : -g.wl - off; return { x: g.x + g.nx * o, z: g.z + g.nz * o, yaw: Math.atan2(-g.nx * sd, -g.nz * sd), g }; };
  // ---- ground paint: sand ripples, the trap floor's sandstone tiles, the stone run's channel ----
  api.paint((ctx, P, Sc) => {
    for (let i = 0; i < 500; i++) { const x = (rng() - 0.5) * 700, z = 100 + (rng() - 0.5) * 520, q = P(x, z); ctx.fillStyle = `rgba(${rng() < 0.5 ? '70,52,30' : '220,196,150'},${0.05 + rng() * 0.08})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (3 + rng() * 14) * Sc, (0.6 + rng() * 2) * Sc, 0.3 + rng() * 0.3, 0, TAU); ctx.fill(); }
    // the trap floor: big sandstone tiles with dark seams (the rules draw the shaking and the holes)
    for (let s = S.trap0; s < S.trap1; s += LTB_TRAP.row) { const g = T.at(s + LTB_TRAP.row / 2, {}), n = LTB_TRAP.cols, w = g.hw * 2 / n; for (let c = 0; c < n; c++) { const d = -g.hw + (c + 0.5) * w, q = P(g.x + g.nx * d, g.z + g.nz * d); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.fillStyle = (Math.floor(s / LTB_TRAP.row) + c) % 2 ? 'rgba(196,160,104,0.95)' : 'rgba(176,140,88,0.95)'; ctx.fillRect(-LTB_TRAP.row / 2 * Sc + 0.25 * Sc, -w / 2 * Sc + 0.25 * Sc, LTB_TRAP.row * Sc - 0.5 * Sc, w * Sc - 0.5 * Sc); ctx.strokeStyle = 'rgba(90,64,36,0.6)'; ctx.lineWidth = 0.12 * Sc; ctx.beginPath(); ctx.moveTo(-1 * Sc, -0.6 * Sc); ctx.lineTo(0.4 * Sc, 0.3 * Sc); ctx.lineTo(1.2 * Sc, 0.1 * Sc); ctx.stroke(); ctx.restore(); } }
    // the gallery floor: polished dark stone with a green inlaid border
    for (let s = S.gal0; s < S.gal1; s += 3) { const g = T.at(s, {}), q = P(g.x, g.z); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.fillStyle = 'rgba(30,26,34,0.55)'; ctx.fillRect(-1.6 * Sc, -(g.hw + 4) * Sc, 3.2 * Sc, (g.hw + 4) * 2 * Sc); ctx.restore(); }
  });
  // barriers: gold / green / sand along the lap (gold and dark tyres on the tight bends), lamps
  CartKit.rails(E, T, (i, tight) => tight ? (i % 2 ? '#ffd84a' : '#2a2230') : ['#3aff8a', '#ffd84a', '#e8d8b0'][Math.floor(i / 2) % 3]);
  CartKit.lamps(E, T, ['#3aff8a', '#ffd84a', '#ff3ad8', '#ffffff'], 36);
  CartKit.kinds(E, LTB_KINDS);
  // pyramid studs on both road edges every 5 m
  for (let s = 0; s < T.L; s += 5) { const g = T.at(s, {}); for (const sd of [1, -1]) { const d = sd * (g.hw - 0.15); CartKit.put(E, 'ltb_stud', g.x + g.nx * d, g.z + g.nz * d, g.yaw, Math.floor(s / 5) % 3 ? '#3aff8a' : '#ffd84a', { y: 0, noLights: true }); } }

  // ---- THE PYRAMID: seven stepped tiers; the lower five are cut by the gallery, the upper ones roof it ----
  const trims = ['#3aff8a', '#ff3ad8', '#ffd84a', '#38f2ff', '#3aff8a', '#ff3ad8', '#ffd84a', '#38f2ff'];
  for (let i = 0; i < 8; i++) {
    const h = P0.h - i * P0.step, y = i * P0.th, split = i < P0.open;
    if (split) for (const sd of [-1, 1]) {
      const z0 = P0.slot, d = h - z0, cz = P0.z + sd * (z0 + d / 2);
      // each half of a tier in pieces of at most ~50 m (better culling)
      const n = Math.ceil(h * 2 / 50); for (let j = 0; j < n; j++) { const w = h * 2 / n, cx = P0.x - h + (j + 0.5) * w; CartScene.mesh(api, cx, cz, 0, m => { ltbBlock(m, w, P0.th, d, i, trims[i]); return { cols: i === 0 ? [{ t: 'box', x: 0, z: 0, hx: w / 2, hz: d / 2, y0: 0, y1: P0.th }] : [] }; }, { hi: true, noAO: true, y }); }
    } else CartScene.mesh(api, P0.x, P0.z, 0, m => { ltbBlock(m, h * 2, P0.th, h * 2, i, trims[i]); return {}; }, { hi: true, noAO: true, y });
  }
  // the gold capstone with the laser crystal on top, and the gallery's ceiling of laser lines
  const top = 8 * P0.th, capH = 13;
  CartScene.mesh(api, P0.x, P0.z, 0, m => {
    m.color('#ffd84a', 0.35).shine(3); m.cyl(0, 0, 0, P0.h - 8 * P0.step + 1.5, 0, capH, 4, { stripes: ['#ffd84a', '#e0b030'], yaw0: Math.PI / 4 }); m.emissive(0);
    m.color('#3aff8a', 1); m.ball(0, capH + 0.6, 0, 1.3, { seg: 10, rings: 7 }); m.emissive(0).shine(0);
    return { lights: [{ x: 0, y: capH + 0.6, z: 0, s: 6, c: '#3aff8a' }] };
  }, { hi: true, noAO: true, y: top });
  E.ltb.show.y = top + capH + 0.6;
  CartScene.mesh(api, P0.x, P0.z, 0, m => { m.color('#3aff8a', 1); for (let x = -70; x <= 70; x += 14) m.box(x, P0.open * P0.th - 0.15, 0, 0.25, 0.2, P0.slot * 2); m.color('#ff3ad8', 1); m.box(0, P0.open * P0.th - 0.15, -P0.slot * 0.5, 140, 0.18, 0.18); m.box(0, P0.open * P0.th - 0.15, P0.slot * 0.5, 140, 0.18, 0.18); m.emissive(0); return {}; }, { hi: true, noAO: true });
  // the gates: tall gold-capped columns at each mouth, the name over the east gate
  for (const ex of [-P0.h - 0.5, P0.h + 0.5]) for (const sd of [-1, 1]) CartScene.mesh(api, ex, P0.z + sd * (P0.slot + 1.2), 0, m => { m.color('#d4ae74'); m.cyl(0, 0, 0, 1.6, 1.4, P0.open * P0.th, 16); for (let k = 0; k < 6; k++) { m.color('#9a7646'); m.torus(0, 2 + k * 5.6, 0, 1.55, 0.12, { seg: 16, tseg: 3 }); } m.color('#ffd84a', 0.4).shine(3); m.cyl(0, P0.open * P0.th - 1.4, 0, 1.6, 2.2, 1.4, 16); m.color('#3aff8a', 1); m.torus(0, P0.open * P0.th - 1.5, 0, 1.75, 0.12, { seg: 16, tseg: 3 }); m.emissive(0).shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.6, y0: 0, y1: 35, camPass: true }], lights: [{ x: 0, y: P0.open * P0.th - 1.5, z: 0, s: 2.6, c: '#3aff8a' }] }; }, { hi: true });
  api.sign('LASER TOMB', P0.x + P0.h + 0.8, P0.z, { yaw: Math.PI / 2, h: 4.2, y: 26, post: false, maxW: 24, style: { bg: '#1a1408', fg: '#ffd84a', border: '#3aff8a' }, glow: '#3aff8a' });
  api.sign('EXIT THROUGH\nTHE GIFT SHOP', P0.x - P0.h - 0.8, P0.z, { yaw: -Math.PI / 2, h: 2.6, y: 26, post: false, maxW: 16, style: { bg: '#1a1408', fg: '#3aff8a', border: '#ffd84a' }, glow: '#ffd84a' });
  // ---- inside the gallery: glyph panels, joke inscriptions, sconces, light pools ----
  const jokes = ['JOIN NOW!\nPAY LATER', 'RECRUIT 3\nFRIENDS', 'THE TOP IS\nALMOST HERE', 'NO REFUNDS\nIN THE\nAFTERLIFE', 'ASK ME\nABOUT MY\nDOWNLINE', 'LASER SHOW\nINCLUDED*', 'TOMB\nSWEET TOMB', '*SHOW NOT\nINCLUDED'];
  for (let x = -66, j = 0; x <= 66; x += 12, j++) for (const sd of [-1, 1]) {
    const z = P0.z + sd * (P0.slot - 0.05), yaw = sd < 0 ? 0 : Math.PI, glyphCol = ['#3aff8a', '#38f2ff', '#ffd84a', '#ff3ad8'][(j + (sd > 0 ? 2 : 0)) % 4];
    CartScene.mesh(api, x, z, yaw, m => { m.color('#3a2c22').shine(1); m.roundBox(0, 8, 0.05, 4.4, 4.4, 0.12, 0.1); m.shine(0); m.push(); m.tf(0, 8, 0.2, 0, 0, 0, 1.6); ltbGlyph(m, (j * 2 + (sd > 0 ? 1 : 0)) % 5, glyphCol); m.pop(); m.push(); m.tf(0, 15, 0.2, 0, 0, 0, 1.1); ltbGlyph(m, (j + 2) % 5, '#ffd84a'); m.pop(); return {}; }, { hi: true, noAO: true });
    if (j % 2 === 0) CartScene.mesh(api, x + 6, P0.z + sd * (P0.slot - 0.3), yaw, ltbSconce, { hi: true, noAO: true });
    if (j % 3 === 1) api.sign(jokes[(j + (sd > 0 ? 3 : 0)) % jokes.length], x + 6, P0.z + sd * (P0.slot - 0.4), { yaw: sd < 0 ? Math.PI * 0.3 : Math.PI * 0.7, h: 1.6, y: 3.2, post: false, maxW: 4.2, style: { bg: '#e8d4a8', fg: '#3a2410', border: '#8a6030' }, glow: '#ffd84a' });
  }
  for (let x = -60; x <= 60; x += 20) api.light(x, P0.z, 18, x % 40 ? '#3aff8a' : '#ffb060', 0.5);
  // ---- the laser grids: an emitter pillar on each side of each gate ----
  for (const gx of [50, 10, -30]) {
    const s = CartKit.sOf(T, gx, P0.z), g = T.at(s, {});
    for (const sd of [1, -1]) { const p = side(s, sd, 0.9); CartScene.mesh(api, p.x, p.z, p.yaw, ltbEmitter, { hi: true }); }
    E.ltb.gates.push({ s }); api.light(g.x, g.z, 12, '#ff3050', 0.4);
  }
  // ---- the start: the pylon gate, grandstands, crowds, heroes ----
  { const g = T.at(0, {}), Wd = g.wl + g.wr;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => ltbPylonGate(m, Wd), { hi: true });
    api.sign('LASER TOMB', g.x, g.z, { yaw: g.yaw + Math.PI, h: 1.7, y: 12.6, post: false, maxW: 10, style: { bg: '#1a1408', fg: '#ffd84a', border: '#3aff8a' }, glow: '#3aff8a' });
    api.light(g.x, g.z, 22, '#3aff8a', 0.55);
    for (const sd of [1, -1]) { const p = side(10, sd, 7); E.spots.push(...CartScene.bleachers(api, p.x, p.z, p.yaw, 22, 3, rng)); api.light(p.x, p.z, 16, '#ffe0a0', 0.5); taken.push([p.x, p.z, 16]); }
    const heroes = ['partyboy', 'sparklepony', 'crusty', 'greeter_f', 'darkwad', 'badideaguy'];
    heroes.forEach((type, i) => { const p = side(-12 + Math.floor(i / 2) * 8, i % 2 ? 1 : -1, 2.4); E.heroes.push({ type, x: p.x, z: p.z, yaw: p.yaw, anim: i % 3 === 0 ? 'cheer' : i % 3 === 1 ? 'dance' : 'wave' }); });
  }
  CartKit.crowd(E, T, (T.L - 120) % T.L, T.L - 30, 1, rng, { rows: 1, off: 10, gap: 2.2 }); CartKit.crowd(E, T, (T.L - 120) % T.L, T.L - 30, -1, rng, { rows: 1, off: 10, gap: 2.2 });
  // ---- the procession: obelisk pairs, palms; the trap floor's warning arch ----
  for (let s = 40, k = 0; s < S.trap0 - 6; s += 22, k++) for (const sd of [1, -1]) { const p = side(s, sd, 4); CartKit.put(E, 'ltb_obelisk', p.x, p.z, p.yaw, k % 2 ? '#3aff8a' : '#ff3ad8'); taken.push([p.x, p.z, 3]); }
  { const s = S.trap0 - 4, g = T.at(s, {}), Wd = g.wl + g.wr;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => { const lights = []; for (const sd of [-1, 1]) { m.color('#d0aa72'); m.box(sd * (Wd / 2 + 1.2), 6, 0, 2, 12, 2, { taper: 0.7, top: '#e0c08a' }); m.color('#ffd84a', 1); m.box(sd * (Wd / 2 + 1.2), 12.2, 0, 1.6, 0.3, 1.6); m.emissive(0); lights.push({ x: sd * (Wd / 2 + 1.2), y: 12.6, z: 0, s: 1.8, c: '#ffd84a' }); } m.color('#2a2230').shine(2); m.roundBox(0, 11, 0, Wd + 3, 1, 1, 0.2); m.shine(0); m.color('#ffd84a', 1); for (let x = -Wd / 2; x <= Wd / 2; x += 3) m.box(x, 10.45, 0.52, 1.4, 0.12, 0.06); m.emissive(0); return { cols: [{ t: 'box', x: -(Wd / 2 + 1.2), z: 0, hx: 1, hz: 1, y0: 0, y1: 12, camPass: true }, { t: 'box', x: Wd / 2 + 1.2, z: 0, hx: 1, hz: 1, y0: 0, y1: 12, camPass: true }], lights }; }, { hi: true, noAO: true });
    api.sign('TRAP FLOOR', g.x, g.z, { yaw: g.yaw + Math.PI, h: 1.0, y: 11, post: false, maxW: 7, style: { bg: '#ffd84a', fg: '#1a1408', border: '#1a1408' }, glow: '#ffd84a' }); }
  for (const sd of [1, -1]) for (let s = S.trap0 + 6; s < S.trap1; s += 24) { const p = side(s, sd, 3); CartKit.put(E, 'ltb_obelisk', p.x, p.z, p.yaw, '#ffd84a', { scale: 0.8 }); taken.push([p.x, p.z, 3]); }
  // ---- the wrap party: sarcophagi, a sign, a DJ booth of a tomb, crowds ----
  for (const [x, z, sd] of [[190, -18, 1], [196, 32, -1], [228, 70, 1], [178, 50, 1]]) { const s = CartKit.sOf(T, x, z), p = side(s, sd, 3.5); if (!CartWorlds.clear(T, p.x, p.z, 1.5)) continue; CartScene.mesh(api, p.x, p.z, p.yaw, m => ltbSarc(m, (x | 0) % 2 === 0), { hi: true }); api.light(p.x, p.z, 8, '#38f2ff', 0.45); taken.push([p.x, p.z, 4]); }
  { const p = side(CartKit.sOf(T, 175, 15), -1, 6); api.sign('THE WRAP\nPARTY', p.x, p.z, { yaw: p.yaw + 0.5, h: 1.6, y: 2.6, post: true, maxW: 4.4, style: { bg: '#e8e0c8', fg: '#2a3a8a', border: '#38f2ff' }, glow: '#38f2ff' }); taken.push([p.x, p.z, 4]); }
  CartKit.crowd(E, T, S.mum0 - 10, S.mum1 + 10, -1, rng, { rows: 2, off: 6 });
  // the mummies' home spots along the esses (the rules move them)
  for (let i = 0; i < LTB_MUMMY.n; i++) E.ltb.mummies.push({ s: S.mum0 + (i + 0.5) / LTB_MUMMY.n * CartKit.ds(T, S.mum0, S.mum1) });
  // ---- the stone run: the sand pit where the stone sinks, warning posts ----
  { const g = T.at(S.stoneEnd - 6, {}); api.light(g.x, g.z, 14, '#ffb040', 0.4); }
  for (let s = S.stoneEnd; s < S.mouth; s += 16) for (const sd of [1, -1]) { const p = side(s, sd, 1.5); CartKit.put(E, 'ltb_obelisk', p.x, p.z, p.yaw, '#ffb040', { scale: 0.55 }); }
  // ---- the obelisk bends and the west plaza ----
  for (let s = S.gal1 + 12, k = 0; s < S.bends + 60; s += 18, k++) { const sd = k % 2 ? 1 : -1, p = side(s, sd, 5); if (CartWorlds.clear(T, p.x, p.z, 2)) { CartKit.put(E, 'ltb_obelisk', p.x, p.z, p.yaw, LTB_SHOW_HEX[k % 5], { scale: 1.2 }); taken.push([p.x, p.z, 3]); } }
  // ---- the downline: little pyramids and palms round the outside; lasers and searchlights ----
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + rng() * 0.1, r = 330 + rng() * 60, x = Math.sin(a) * r * 1.1, z = 100 + Math.cos(a) * r * 0.85; if (CartWorlds.clear(T, x, z, 14)) CartKit.put(E, 'ltb_minipyr', x, z, Math.PI / 4, LTB_SHOW_HEX[i % 5], { scale: 1 + rng() * 0.8 }); }
  for (let s = 14, k = 0; s < T.L; s += 24, k++) { const sd = k % 2 ? 1 : -1, p = side(s, sd, 7 + (k % 3) * 2), free = taken.every(q => Math.hypot(q[0] - p.x, q[1] - p.z) > q[2] + 3); const outside = Math.abs(p.x - P0.x) > P0.h + 6 || Math.abs(p.z - P0.z) > P0.h + 6; if (free && outside && CartWorlds.clear(T, p.x, p.z, 2)) CartKit.put(E, k % 4 === 3 ? 'ltb_obelisk' : 'ltb_palm', p.x, p.z, p.yaw + rng(), LTB_SHOW_HEX[k % 5], { scale: 0.9 + (k % 3) * 0.15 }); }
  E.beams = [];
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; E.beams.push({ kind: 'laser', x: P0.x + Math.sin(a) * 8, y: E.ltb.show.y - 3, z: P0.z + Math.cos(a) * 8, c: LTB_SHOW[i % 5], ph: i * 1.6, sp: 0.35 + i * 0.06, len: 160, w: 0.6, a: 0.5 }); }
  for (let i = 0; i < 4; i++) { const p = side(T.L * (i + 0.2) / 4, i % 2 ? 1 : -1, 50 + rng() * 20); if (!CartWorlds.clear(T, p.x, p.z, 12)) continue; E.beams.push({ kind: 'search', x: p.x, y: 1, z: p.z, c: burnsRGBf(i % 2 ? '#3aff8a' : '#ff3ad8'), ph: rng() * 6, sp: 0.4 + rng() * 0.3, len: 140, w: 6, a: 0.18 }); api.light(p.x, p.z, 10, '#3aff8a', 0.5); }
  // gift rows, boost pads (fractions of the lap), the grid
  const f = s => (((s % T.L) + T.L) % T.L) / T.L;
  CartKit.gifts(E, T, [f(CartKit.sOf(T, 0, -40)), f(CartKit.sOf(T, 212, 66)), f(CartKit.sOf(T, -112, 100)), f(CartKit.sOf(T, -196, 46))]);
  CartKit.boosts(E, T, [[f(CartKit.sOf(T, -58, 100)), 0], [f(CartKit.sOf(T, -150, -40)), 0.3], [f(CartKit.sOf(T, 140, -40)), -0.3]]);
  CartKit.grid(E, T);
  return CartKit.finish(E);
}
const LTB_SHOW_HEX = ['#3aff8a', '#ff3ad8', '#38f2ff', '#ffd84a', '#9a60ff'];
// the centre line: little green triangles pointing the way (up the pyramid, as it were)
function ltbPaintCenter(ctx, P, S, T) {
  for (let s = 0; s < T.L; s += 7) { const g = T.at(s, {}), q = P(g.x, g.z); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.scale(S * 0.6, S * 0.6); ctx.fillStyle = 'rgba(80,255,150,0.6)'; ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(-0.7, -0.8); ctx.lineTo(-0.7, 0.8); ctx.closePath(); ctx.fill(); ctx.restore(); }
}

/* ---------------- the moving things (one pooled group) ---------------- */
const LTB_BANDAGE = ['#ece4cc', '#d8ccac', '#f6efdc', '#c8bc9a'];
const LTB_GOGGLE = ['#ff3ad8', '#38f2ff', '#ffd84a', '#3aff8a', '#ff7a2a', '#9a60ff'];
const LtbMesh = {
  // the rolling stone: a carved ball with gold bands and a grumpy face on each side (rolls about local x)
  stone(m) {
    m.color('#b09670').shine(1); m.ball(0, 0, 0, 1, { seg: 20, rings: 14 });
    m.color('#7a6448'); for (const x of [-0.6, 0.6]) { m.push(); m.tf(x, 0, 0, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.8, 0.05, { seg: 22, tseg: 3 }); m.pop(); }
    m.color('#ffd84a', 0.3).shine(3); m.push(); m.tf(0, 0, 0, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 1.0, 0.07, { seg: 24, tseg: 4 }); m.pop(); m.shine(0);
    for (const sx of [-1, 1]) {
      m.color('#3a2a1a'); for (const sz of [-0.28, 0.28]) m.ellipsoid(sx * 0.86, 0.3, sz, 0.08, 0.12, 0.1, { seg: 8, rings: 5 });
      m.color('#ffe8a0', 0.6); for (const sz of [-0.28, 0.28]) m.ball(sx * 0.9, 0.3, sz, 0.035, { seg: 5, rings: 3 }); m.emissive(0);
      m.color('#3a2a1a'); for (const sz of [-0.28, 0.28]) m.limb(sx * 0.9, 0.5, sz - 0.14 * Math.sign(sz), sx * 0.88, 0.44, sz + 0.12 * Math.sign(sz), 0.03, 0.03, { seg: 3 });   // the frown brows
      for (let i = 0; i < 5; i++) { const a = -0.5 + i * 0.25; m.ball(sx * (0.88 - Math.abs(a) * 0.1), -0.32 + Math.abs(a) * 0.18 - 0.05, Math.sin(a) * 0.5, 0.045, { seg: 5, rings: 3 }); }   // the grumpy mouth
    }
  },
  // a mummy: a burner wrapped in bandages with EL wire and goggles pushed up (pivot at the feet, facing +z)
  mummy(m, i) {
    const B = LTB_BANDAGE, G = LTB_GOGGLE[i % 6];
    m.color(B[0]); m.ellipsoid(0, 1.15, 0, 0.3, 0.42, 0.22, { seg: 10, rings: 7 }); m.ellipsoid(0, 0.8, 0, 0.25, 0.2, 0.19, { seg: 9, rings: 5 });
    for (let k = 0; k < 6; k++) { m.color(B[(k + i) % 4]); m.push(); m.tf(0, 0.78 + k * 0.15, 0, 0, (k % 2 ? 0.18 : -0.15), (k % 3 - 1) * 0.12); m.torus(0, 0, 0, 0.27 + Math.sin(k / 5 * Math.PI) * 0.06, 0.04, { seg: 12, tseg: 3 }); m.pop(); }
    m.color(B[2]); m.ball(0, 1.8, 0, 0.23, { seg: 10, rings: 8 });
    for (let k = 0; k < 3; k++) { m.color(B[(k + 1) % 4]); m.push(); m.tf(0, 1.7 + k * 0.1, 0, 0, 0.2 - k * 0.15, 0); m.torus(0, 0, 0, 0.22, 0.035, { seg: 12, tseg: 3 }); m.pop(); }
    m.color('#1a1210'); for (const sx of [-0.08, 0.08]) m.ellipsoid(sx, 1.8, 0.2, 0.06, 0.04, 0.03, { seg: 6, rings: 4 });
    m.color('#9affb0', 1); for (const sx of [-0.08, 0.08]) m.ball(sx, 1.8, 0.22, 0.025, { seg: 5, rings: 3 }); m.emissive(0);
    // goggles pushed up on the forehead, a strap round the head
    m.color('#2a2230'); m.push(); m.tf(0, 1.93, 0, 0, -0.25, 0); m.torus(0, 0, 0, 0.235, 0.025, { seg: 12, tseg: 3 }); m.pop();
    m.color(G, 0.5).shine(3); for (const sx of [-0.1, 0.1]) { m.push(); m.tf(sx, 1.98, 0.17, 0, Math.PI / 2 - 0.5, 0); m.cyl(0, 0, 0, 0.075, 0.075, 0.07, 10); m.pop(); } m.emissive(0).shine(0);
    // EL wire wound round the body, a loose bandage tail
    m.color(LTB_GOGGLE[(i + 3) % 6], 1); m.push(); m.tf(0, 1.08, 0, 0, 0.55, 0.3); m.torus(0, 0, 0, 0.33, 0.02, { seg: 14, tseg: 3 }); m.pop(); m.push(); m.tf(0, 0.92, 0, 0, -0.45, -0.2); m.torus(0, 0, 0, 0.3, 0.02, { seg: 14, tseg: 3 }); m.pop(); m.emissive(0);
    m.color(B[3]); m.limb(-0.22, 1.0, -0.1, -0.32, 0.45, -0.25, 0.05, 0.02, { seg: 3 });
  },
  // an arm (pivot at the shoulder, reaching along +z)
  arm(m, i) { const B = LTB_BANDAGE; m.color(B[i % 4]); m.limb(0, 0, 0, 0, -0.02, 0.62, 0.08, 0.065, { seg: 6 }); m.color(B[(i + 2) % 4]); m.ball(0, -0.02, 0.68, 0.08, { seg: 6, rings: 4 }); for (let k = 0; k < 3; k++) { m.push(); m.tf(0, -0.01, 0.12 + k * 0.18, 0, Math.PI / 2, 0.2); m.torus(0, 0, 0, 0.075, 0.018, { seg: 8, tseg: 3 }); m.pop(); } m.color(B[1]); m.limb(0, -0.06, 0.4, 0, -0.32, 0.36, 0.025, 0.012, { seg: 3 }); },
  // a leg (pivot at the hip, down along -y)
  leg(m, i) { const B = LTB_BANDAGE; m.color(B[(i + 1) % 4]); m.limb(0, 0, 0, 0, -0.76, 0.02, 0.1, 0.085, { seg: 6 }); for (let k = 0; k < 3; k++) { m.push(); m.tf(0, -0.15 - k * 0.22, 0, 0, 0.15, 0); m.torus(0, 0, 0, 0.095, 0.02, { seg: 8, tseg: 3 }); m.pop(); } m.color(B[0]); m.ellipsoid(0, -0.8, 0.06, 0.1, 0.06, 0.16, { seg: 6, rings: 4 }); }
};

/* ---------------- the rules: hazards and enemies at run time ---------------- */
const LTB_TRAP = { row: 4, cols: 5, period: 4.2, warn: 1.1, open: 1.15 };
const LTB_GATE = { period: 5.0, arm: 1.2, on: 0.75, lanes: 5, band: 1.1 };
const LTB_STONE = { period: 11, tele: 1.6, speed: 18, r: 3.5, sink: 0.7 };
const LTB_MUMMY = { n: 6, raise: 1.0, lunge: 0.5, down: 1.6, up: 0.6, reach: 3.4, grab: 2.5, sc: 1.3 };
// is trap tile (row r, column c) in this cycle's pattern? (at most 3 of 5 tiles in a row ever open)
function ltbTrapHot(cyc, r, c) {
  switch (cyc % 4) {
    case 0: return (r + c) % 2 === 0;
    case 1: return ((c - r) % 5 + 5) % 5 < 2;
    case 2: return (r + c) % 2 === 1;
    default: return ((c + r) % 5 === 0) || ((c + r) % 5 === 2);
  }
}
// pose one limb of a mummy: (lx, ly, lz) is its pivot on the body (body units), rotated with the body's pitch and yaw
function ltbPoseLimb(o, b, yaw, pitch, lx, ly, lz, sc, own) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), y1 = ly * cp - lz * sp, z1 = ly * sp + lz * cp, cy = Math.cos(yaw), sy = Math.sin(yaw);
  o.live = true; o.visible = true; o.x = b.x + (lx * cy + z1 * sy) * sc; o.y = b.y + y1 * sc; o.z = b.z + (-lx * sy + z1 * cy) * sc; o.yaw = yaw; o.pitch = pitch + own; o.roll = 0; o.scale = sc;
}
CART_TRACK_RULES.lasertomb = {
  onLoad(s) {
    const E = s.E, D = E.ltb, T = s.T || s.TR, S = D.S;
    const G = CartKit.group(s, [['stone', LtbMesh.stone, 1], ['mummy', LtbMesh.mummy, LTB_MUMMY.n], ['arm', LtbMesh.arm, LTB_MUMMY.n * 2], ['leg', LtbMesh.leg, LTB_MUMMY.n * 2]]);
    const L = s.ltb = { G, said: {}, hintT: -9, gates: [], trap: null, stone: null, mummies: [] };
    // the laser grids: staggered so the three are never in step
    D.gates.forEach((q, i) => { const g = T.at(q.s, {}); L.gates.push({ i, s: q.s, x: g.x, z: g.z, el: g.wl + 0.9, er: g.wr + 0.9, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, yaw: g.yaw, hw: g.hw, off: i * 1.55, cyc: -1, ph: 'idle', u: 0, safe: 0, mask: 0 }); });
    // the trap floor: rows of tiles between trap0 and trap1
    { const rows = Math.floor(CartKit.ds(T, S.trap0, S.trap1) / LTB_TRAP.row), tiles = [];
      for (let r = 0; r < rows; r++) { const g = T.at(S.trap0 + (r + 0.5) * LTB_TRAP.row, {}), w = g.hw * 2 / LTB_TRAP.cols; for (let c = 0; c < LTB_TRAP.cols; c++) { const d = -g.hw + (c + 0.5) * w; tiles.push({ r, c, x: g.x + g.nx * d, z: g.z + g.nz * d, yaw: g.yaw, w, d }); } }
      L.trap = { rows, tiles, cyc: -1, ph: 'idle', u: 0, mask: 0, s0: S.trap0 }; }
    // the rolling stone: from the east gate back along the road toward the traffic
    L.stone = { obj: G.stone[0], s0: S.mouth, run: CartKit.ds(T, S.stoneEnd, S.mouth), cyc: -1, ph: 'idle', u: 0, sv: S.mouth, d: 0, x: 0, y: -9, z: 0, yaw: 0, rollA: 0, mask: 0 };
    // the mummies: each crosses the road at its own spot
    D.mummies.forEach((q, i) => { const g = T.at(q.s, {}); L.mummies.push({ i, s: q.s, d: (i % 2 ? 1 : -1) * g.hw * 0.4, dir: i % 2 ? -1 : 1, hw: g.hw, st: 'walk', t: 0, wait: 0, cool: 1 + i * 0.7, tgt: null, tgtD: 0, d0: 0, x: 0, y: 0, z: 0, yaw: 0, pitch: 0, mask: 0, body: G.mummy[i], arms: [G.arm[i * 2], G.arm[i * 2 + 1]], legs: [G.leg[i * 2], G.leg[i * 2 + 1]] }); });
    CartKit.state(s);
  },
  onUpdate(s, dt, racing) {
    const L = s.ltb; if (!L) return;
    ltbGates(s, L, dt, racing); ltbTrap(s, L, dt, racing); ltbStone(s, L, dt, racing); ltbMummies(s, L, dt, racing);
  },
  // the AI: ease off for an armed laser lane, hop a hole that opens under it (both by skill)
  onStep(s, k, dt, racing) {
    const L = s.ltb; if (!L || k.player && !s.autoDrive || !racing || !s.T || k.out) return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9, roll = ((k.slot * 7 + Math.floor(s.time / 4)) % 10) / 10, good = roll < 0.45 + (sk - 0.85) * 3;
    for (const q of L.gates) {
      if (q.ph === 'idle') continue; const ds = CartKit.ahead(s, k, q.s); if (ds < 2 || ds > 16) continue;
      const lane = clamp(Math.floor((k.loc.d + q.hw) / (q.hw * 2 / LTB_GATE.lanes)), 0, LTB_GATE.lanes - 1);
      if ((lane < q.safe || lane > q.safe + 1) && good && k.speed > 8) { I.gas = 0; if (k.speed > 18) I.brake = 0.4; }
    }
    const Tr = L.trap; if (Tr.ph !== 'idle' && good) { const ds = CartKit.ahead(s, k, Tr.s0); if (ds < 0 && ds > -Tr.rows * LTB_TRAP.row) { const r = Math.floor((-ds + k.speed * 0.25) / LTB_TRAP.row); if (r >= 0 && r < Tr.rows) { const t = Tr.tiles[r * LTB_TRAP.cols + ltbTrapCol(Tr, r, k.loc.d)]; if (t && ltbTrapHot(Tr.cyc, t.r, t.c) && !k.air) { I.driftPress = true; I.drift = false; } } } }
  },
  draw(s, R, Sp, t) { const L = s.ltb; if (L) ltbDraw(s, L, R, Sp, t); },
  lights(s, add) {
    const L = s.ltb; if (!L) return;
    for (const q of L.gates) if (q.ph === 'on') add(q.x, 2, q.z, 16, LTB_C.red, 1.6, 2); else if (q.ph === 'arm') add(q.x, 2, q.z, 12, LTB_C.amber, 0.9, 1);
    const St = L.stone; if (St.ph === 'roll' || St.ph === 'warn') add(St.x, 3, St.z, 14, LTB_C.amber, 1.1, 1.5);
    for (const m of L.mummies) if (m.st === 'raise' || m.st === 'lunge') add(m.x, 2.4, m.z, 7, LTB_C.lime, 1.2, 1);
  },
  hud(s, ctx, W, H) {
    const L = s.ltb, p = s.player; if (!L || !p || s.state !== 'race' || !s.T) return;
    // first-lap hints as each hazard comes up
    const hint = (key, sv, text, sub) => { if (L.said[key] || p.lap > 1) return; const ds = CartKit.ds(s.T, p.loc.s, sv); if (ds > 0 && ds < 70) { L.said[key] = true; L.hintT = s.time; s.banner(text, '#3aff8a', 2.0, sub); } };
    const S = s.E.ltb.S;
    hint('trap', S.trap0, 'TRAP FLOOR!', 'shaking tiles drop open: steer onto solid ones or HOP');
    hint('mummy', L.mummies[0].s, 'MUMMIES!', 'steer wide when their arms go up');
    hint('stone', L.stone.s0 - L.stone.run, 'ROLLING STONE!', 'switch lanes: the arrows show its path');
    hint('laser', L.gates[0].s, 'LASER GRID!', 'drive through the GREEN lanes');
  }
};
// the trap tile column under lateral offset d in row r
function ltbTrapCol(Tr, r, d) { const t = Tr.tiles[r * LTB_TRAP.cols]; const w = t.w; return clamp(Math.floor((d + w * LTB_TRAP.cols / 2) / w), 0, LTB_TRAP.cols - 1); }

// ---- the laser grids: idle → ARM (lit lanes flash red, the safe pair glows green) → ON (a curtain of beams) ----
function ltbGates(s, L, dt, racing) {
  const G = LTB_GATE;
  for (const q of L.gates) {
    const tt = s.time + q.off, cyc = Math.floor(tt / G.period), ph = tt - cyc * G.period, idleT = G.period - G.arm - G.on;
    if (cyc !== q.cyc) { q.cyc = cyc; q.safe = (cyc * 3 + q.i * 2) % (G.lanes - 1); q.mask = 0; }
    const was = q.ph; q.ph = ph < idleT ? 'idle' : ph < idleT + G.arm ? 'arm' : 'on'; q.u = q.ph === 'arm' ? (ph - idleT) / G.arm : q.ph === 'on' ? (ph - idleT - G.arm) / G.on : 0;
    if (q.ph === 'on' && was !== 'on') { CartKit.fired(s, 'laser'); if (CartKit.near(s, q.x, q.z, 70)) cartIxSound(s, 'laser', q.x, q.z, 0.8, 0.7); }
    if (q.ph === 'arm' && was === 'idle' && CartKit.near(s, q.x, q.z, 50)) cartIxSound(s, 'cartSparkle', q.x, q.z, 0.4, 0.6);
    if (q.ph === 'idle') continue;
    const lw = q.hw * 2 / G.lanes;
    // the AI steer clear of the lit lanes while the gate is armed or on
    for (let l = 0; l < G.lanes; l++) if (l < q.safe || l > q.safe + 1) { const d = -q.hw + (l + 0.5) * lw; cartIxObs(s, q.x + q.nx * d, q.z + q.nz * d, lw * 0.55); }
    if (q.ph !== 'on' || !racing) continue;
    for (const k of s.karts) {
      if (k.out || (q.mask & (1 << k.slot))) continue;
      const dx = k.x - q.x, dz = k.z - q.z, along = dx * q.tx + dz * q.tz; if (Math.abs(along) > G.band) continue;
      const lat = dx * q.nx + dz * q.nz, lane = Math.floor((lat + q.hw) / lw); if (lane >= q.safe && lane <= q.safe + 1 && lane >= 0) continue;
      if (Math.abs(lat) > q.hw + 1) continue;
      q.mask |= 1 << k.slot;
      if (CartKit.hit(s, k, 'spin', 'laser', { dur: 0.85, banner: 'LASERED!' })) { k.slowT = Math.max(k.slowT || 0, 0.5); if (s.fx) s.fx.spark(k.x, k.y + 1.2, k.z, 16, '#ff3050', 7); cartIxSound(s, 'laser', k.x, k.z, 0.7, 1.5); }
    }
  }
}
// ---- the trap floor: idle → SHAKE (amber tiles, 1 s) → OPEN (holes with a spring at the bottom) ----
function ltbTrap(s, L, dt, racing) {
  const Tr = L.trap, P = LTB_TRAP, tt = s.time + 0.8, cyc = Math.floor(tt / P.period), ph = tt - cyc * P.period, idleT = P.period - P.warn - P.open;
  if (cyc !== Tr.cyc) { Tr.cyc = cyc; Tr.mask = 0; }
  const was = Tr.ph; Tr.ph = ph < idleT ? 'idle' : ph < idleT + P.warn ? 'warn' : 'open'; Tr.u = Tr.ph === 'warn' ? (ph - idleT) / P.warn : Tr.ph === 'open' ? (ph - idleT - P.warn) / P.open : 0;
  if (Tr.ph === 'idle') return;
  // only worth the AI's attention while cars are near the floor
  let busy = false; for (const k of s.karts) { const ds = CartKit.ahead(s, k, Tr.s0); if (ds < 50 && ds > -Tr.rows * P.row - 5) { busy = true; break; } }
  if (!busy) return;
  if (Tr.ph === 'open' && was !== 'open') { CartKit.fired(s, 'trap'); const t0 = Tr.tiles[Math.floor(Tr.tiles.length / 2)]; if (CartKit.near(s, t0.x, t0.z, 80)) cartIxSound(s, 'stomp', t0.x, t0.z, 0.6, 0.7); }
  for (const t of Tr.tiles) { if (!ltbTrapHot(Tr.cyc, t.r, t.c)) continue; cartIxObs(s, t.x, t.z, Math.min(t.w, P.row) * 0.5); }
  if (Tr.ph !== 'open' || !racing) return;
  for (const k of s.karts) {
    if (k.out || k.air || (Tr.mask & (1 << k.slot))) continue;
    const ds = CartKit.ahead(s, k, Tr.s0); if (ds > 0 || ds < -Tr.rows * P.row) continue;
    const r = Math.floor(-ds / P.row); if (r < 0 || r >= Tr.rows) continue;
    const t = Tr.tiles[r * P.cols + ltbTrapCol(Tr, r, k.loc.d)]; if (!ltbTrapHot(Tr.cyc, t.r, t.c)) continue;
    if (Math.hypot(k.x - t.x, k.z - t.z) > Math.max(t.w, P.row) * 0.62) continue;
    Tr.mask |= 1 << k.slot;
    if (k.shieldT > 0 || k.immuneT > 0 || k.fly) continue;
    // down the hole, onto the spring, BOING: most of the speed is gone and the car pops back up
    k.vx *= 0.42; k.vz *= 0.42; k.vy = Math.max(k.vy, 6.5); k.air = true; k.hop = true; k.drift = 0; k.charge = 0; k.slowT = Math.max(k.slowT || 0, 0.7); k.yaw = cartWrap(k.yaw + (Math.random() - 0.5) * 0.3);
    CartKit.touch(s, k, 'trap', 'TRAP DOOR! BOING!', '#ffd84a');
    if (s.fx && CartKit.near(s, k.x, k.z, 90)) { s.fx.dust(t.x, 0.3, t.z, 10, '#c8a070'); s.fx.burst(k.x, k.y + 0.6, k.z, 'star', 8, '#ffd84a'); }
    cartIxSound(s, 'bump', k.x, k.z, 0.8, 0.6); cartIxSound(s, 'spring', k.x, k.z, 0.7, 1.0);
    if (k.player) s.shakeIt(0.5);
  }
}
// ---- the rolling stone: rocks in the gate (warning), rolls down one half of the road at the traffic, sinks ----
function ltbStone(s, L, dt, racing) {
  const St = L.stone, P = LTB_STONE, T = s.T || s.TR, tt = s.time + 3, cyc = Math.floor(tt / P.period), ph = tt - cyc * P.period, rollT = St.run / P.speed;
  if (cyc !== St.cyc) { St.cyc = cyc; St.mask = 0; const g = T.at(St.s0, LTB_T.at); St.d = (cyc % 2 ? 1 : -1) * g.hw * (0.42 + (cyc % 3) * 0.06); }
  const was = St.ph; St.ph = ph < P.tele ? 'warn' : ph < P.tele + rollT ? 'roll' : ph < P.tele + rollT + P.sink ? 'sink' : 'idle';
  const u = St.ph === 'roll' ? (ph - P.tele) / rollT : St.ph === 'warn' ? 0 : 1;
  St.sv = St.s0 - u * St.run;
  const g = T.at(St.sv, LTB_T.at); St.x = g.x + g.nx * St.d; St.z = g.z + g.nz * St.d; St.yaw = g.yaw + Math.PI;
  const gy = s.terrain.height(St.x, St.z);
  St.y = St.ph === 'sink' ? gy + P.r * (1 - (ph - P.tele - rollT) / P.sink * 1.3) : St.ph === 'idle' ? gy - 9 : gy + P.r;
  if (St.ph === 'roll') St.rollA -= P.speed * dt / P.r; else if (St.ph === 'warn') St.rollA = Math.sin(s.time * 9) * 0.12 * Math.min(1, ph / P.tele * 2);
  if (St.ph === 'roll' && was !== 'roll') { CartKit.fired(s, 'stone'); if (CartKit.near(s, St.x, St.z, 120)) { cartIxSound(s, 'stomp', St.x, St.z, 0.9, 0.5); cartIxSound(s, 'cartBoom', St.x, St.z, 0.4, 0.5); } }
  if (St.ph === 'sink' && was === 'roll') { if (s.fx && CartKit.near(s, St.x, St.z, 140)) s.fx.dust(St.x, 0.5, St.z, 24, '#c8a070'); cartIxSound(s, 'stomp', St.x, St.z, 0.7, 0.4); }
  if (St.ph === 'roll' && s.fx && CartKit.near(s, St.x, St.z, 90) && Math.random() < 0.5) s.fx.dust(St.x - Math.sin(St.yaw) * P.r, 0.3, St.z - Math.cos(St.yaw) * P.r, 2, '#c8a070');
  if (St.ph === 'roll' && CartKit.near(s, St.x, St.z, 26)) s.shakeIt(0.12);
  // the AI see it coming: obstacles down its lane ahead of it
  // (only a short way ahead: the AI react late, so a slow or boxed-in driver can still get bowled over)
  if (St.ph === 'roll') for (let r = 0; r <= 16; r += 8) { const q = T.at(St.sv - r, LTB_T.at2); cartIxObs(s, q.x + q.nx * St.d, q.z + q.nz * St.d, P.r + 0.6); }
  if (St.ph !== 'roll' || !racing) return;
  for (const k of s.karts) {
    if (k.out || (St.mask & (1 << k.slot))) continue;
    const dx = k.x - St.x, dz = k.z - St.z, D = Math.hypot(dx, dz); if (D > P.r + 1.2 || (k.air && k.y > gy + P.r * 1.6)) continue;
    St.mask |= 1 << k.slot;
    // bowled over: knocked out of the stone's lane
    const nx = g.nx * Math.sign(k.loc.d - St.d || 1), nz = g.nz * Math.sign(k.loc.d - St.d || 1);
    if (CartKit.hit(s, k, 'knock', 'stone', { dx: nx, dz: nz, power: 13, dur: 1.1, banner: 'BOWLED OVER!' })) { if (s.fx) s.fx.dust(k.x, 0.5, k.z, 12, '#c8a070'); cartIxSound(s, 'bump', k.x, k.z, 0.9, 0.6); }
  }
}
// ---- the mummies: shuffle across the road; RAISE their arms at a car (1 s), LUNGE, fall flat, get up ----
function ltbMummies(s, L, dt, racing) {
  const T = s.T || s.TR, M = LTB_MUMMY, sc = M.sc;
  for (const m of L.mummies) {
    m.t += dt; if (m.cool > 0) m.cool -= dt;
    const g = T.at(m.s, LTB_T.at); m.hw = g.hw;
    if (m.st === 'walk') {
      if (m.wait > 0) m.wait -= dt;
      else { m.d += m.dir * 1.05 * dt; if (Math.abs(m.d) > g.hw - 1.4) { m.d = Math.sign(m.d) * (g.hw - 1.4); m.dir = -m.dir; m.wait = 0.8 + (m.i % 3) * 0.4; } }
      // a car coming: raise the arms when it is 1.0–1.5 s away and in reach of the lunge
      if (racing && m.cool <= 0) for (const k of s.karts) {
        if (k.out || k.finished) continue; const ds = CartKit.ahead(s, k, m.s); if (ds < 4) continue;
        const ta = ds / Math.max(8, k.speed); if (ta < 1.0 || ta > 1.5 || Math.abs(k.loc.d - m.d) > 7) continue;
        m.st = 'raise'; m.t = 0; m.tgt = k; m.mask = 0;
        if (CartKit.near(s, g.x, g.z, 60)) cartIxSound(s, 'crowd', g.x, g.z, 0.4, 0.55);
        break;
      }
    } else if (m.st === 'raise') {
      const k = m.tgt; if (k && !k.out) m.tgtD = clamp(k.loc.d, -g.hw + 1, g.hw - 1);
      if (m.t > M.raise) { m.st = 'lunge'; m.t = 0; m.d0 = m.d; CartKit.fired(s, 'mummy'); if (CartKit.near(s, g.x, g.z, 60)) cartIxSound(s, 'throw', g.x, g.z, 0.5, 0.6); }
    } else if (m.st === 'lunge') {
      const u = Math.min(1, m.t / M.lunge), want = clamp(m.tgtD - m.d0, -M.reach, M.reach); m.d = m.d0 + want * Math.sin(u * Math.PI / 2);
      if (m.t > M.lunge) { m.st = 'down'; m.t = 0; if (s.fx && CartKit.near(s, m.x, m.z, 80)) s.fx.dust(m.x, 0.3, m.z, 8, '#c8a070'); cartIxSound(s, 'stomp', m.x, m.z, 0.4, 1.3); }
    } else if (m.st === 'down') { if (m.t > M.down) { m.st = 'up'; m.t = 0; } }
    else if (m.st === 'up') { if (m.t > M.up) { m.st = 'walk'; m.t = 0; m.cool = 1.6; m.tgt = null; } }
    m.x = g.x + g.nx * m.d; m.z = g.z + g.nz * m.d; m.y = s.terrain.height(m.x, m.z);
    const standing = m.st === 'walk' || m.st === 'raise' || m.st === 'lunge';
    if (standing) cartIxObs(s, m.x, m.z, m.st === 'walk' ? 1.8 : M.grab + 0.8);
    if (racing) for (const k of s.karts) {
      if (k.out || (m.mask & (1 << k.slot))) continue;
      const D = Math.hypot(k.x - m.x, k.z - m.z);
      if (m.st === 'lunge' && D < M.grab && !(k.air && k.y > m.y + 1.6)) {
        m.mask |= 1 << k.slot;
        if (CartKit.hit(s, k, 'spin', 'mummy', { dur: 0.9, banner: 'WRAPPED UP!' })) { k.slowT = Math.max(k.slowT || 0, 1.0); if (s.fx) s.fx.burst(k.x, k.y + 1.2, k.z, 'streak', 10, '#ece4cc'); cartIxSound(s, 'cartSparkle', k.x, k.z, 0.5, 0.7); }
      } else if (standing && m.st !== 'lunge' && D < 1.6) {
        // a car drives into a standing mummy: the mummy goes flat, the car loses a little speed
        m.st = 'down'; m.t = 0; m.mask |= 1 << k.slot; k.vx *= 0.82; k.vz *= 0.82; cartIxSound(s, 'bump', m.x, m.z, 0.6, 1.2);
        if (s.fx && CartKit.near(s, m.x, m.z, 80)) s.fx.dust(m.x, 0.4, m.z, 6, '#ece4cc');
      }
    }
    // pose: shuffle with a waddle, arms up when raising, a dive on the lunge, face down, back up
    const face = g.yaw + Math.PI + (m.st === 'walk' ? Math.sin(m.t * 3 + m.i) * 0.25 + (m.wait > 0 ? 0 : m.dir * 0.35) : 0);
    let pitch = 0, armP = -0.08, legA = 0, hop = 0;
    if (m.st === 'walk') { legA = m.wait > 0 ? 0 : Math.sin(m.t * 6) * 0.35; hop = Math.abs(Math.sin(m.t * 6)) * 0.05; armP = -0.08 + Math.sin(m.t * 3) * 0.06; }
    else if (m.st === 'raise') { const u = Math.min(1, m.t / 0.35); armP = -0.08 - 1.1 * u + Math.sin(m.t * 22) * 0.06; pitch = -0.12 * u; hop = Math.abs(Math.sin(m.t * 14)) * 0.08; }
    else if (m.st === 'lunge') { const u = Math.min(1, m.t / M.lunge); pitch = 0.9 * u; armP = -1.2 + u * 0.9; legA = -0.4 * u; }
    else if (m.st === 'down') { pitch = lerp(0.9, Math.PI / 2 - 0.05, Math.min(1, m.t / 0.18)); armP = 0.0; legA = Math.sin(m.t * 9) * 0.3 * Math.max(0, 1 - m.t); }
    else { const u = Math.min(1, m.t / M.up); pitch = (Math.PI / 2 - 0.05) * (1 - u * u); armP = -0.3; }
    m.yaw = face; m.pitch = pitch;
    const b = m.body; if (b) { b.live = true; b.visible = true; b.x = m.x; b.y = m.y + hop; b.z = m.z; b.yaw = face; b.pitch = pitch; b.roll = m.st === 'walk' ? Math.sin(m.t * 6) * 0.08 : 0; b.scale = sc; }
    if (b) { for (let l = 0; l < 2; l++) { const sd = l ? 1 : -1; if (m.arms[l]) ltbPoseLimb(m.arms[l], b, face, pitch, sd * 0.33, 1.45, 0.04, sc, armP + (m.st === 'walk' ? sd * 0.05 : 0)); if (m.legs[l]) ltbPoseLimb(m.legs[l], b, face, pitch, sd * 0.13, 0.76, 0, sc, legA * sd); } }
  }
  // the stone (posed here too: one place for the group)
  const St = L.stone, o = St.obj; if (o) { o.live = St.ph !== 'idle'; o.visible = o.live; o.x = St.x; o.y = St.y; o.z = St.z; o.yaw = St.yaw; o.pitch = St.rollA; o.roll = 0; o.scale = LTB_STONE.r; }
}
// ---- sprites: laser curtains and lane lights, trap tiles, the stone's lane and shadow, mummy tells, the light show ----
function ltbDraw(s, L, R, Sp, t) {
  const C = LTB_C, cam = s.cam, near = (x, z, r) => (x - cam.x) ** 2 + (z - cam.z) ** 2 < r * r;
  // the laser grids
  for (const q of L.gates) {
    if (!near(q.x, q.z, 220)) continue;
    const lw = q.hw * 2 / LTB_GATE.lanes, fl = 0.5 + 0.5 * Math.sin(t * 24);
    // emitter lenses on both pillars
    for (const sd of [-1, 1]) { const off = sd > 0 ? q.er - 0.66 : -(q.el - 0.66), ex = q.x + q.nx * off, ez = q.z + q.nz * off, ec = sd > 0 ? q.er - 0.66 - q.hw : q.el - 0.66 - q.hw; for (const y of [0.6, 1.4, 2.2]) { R.bbs.bb(ex, y, ez, q.ph === 'on' ? 1.6 : 0.9, q.ph === 'on' ? 1.6 : 0.9, Sp.glow, q.ph === 'idle' ? C.green : C.red, q.ph === 'idle' ? 0.45 : 0.9, true); if (q.ph === 'on') R.bbs.streak(ex - q.nx * sd * ec / 2, y, ez - q.nz * sd * ec / 2, q.nx, 0, q.nz, ec, 0.22, Sp.streak, C.hot, 0.8); } }
    if (q.ph === 'idle') { R.flat.flat(q.x, 0.1, q.z, q.hw * 2, 0.5, q.yaw, Sp.square, C.green, 0.35, true); continue; }
    for (let l = 0; l < LTB_GATE.lanes; l++) {
      const d = -q.hw + (l + 0.5) * lw, cx = q.x + q.nx * d, cz = q.z + q.nz * d, safe = l >= q.safe && l <= q.safe + 1;
      if (safe) { R.flat.flat(cx, 0.1, cz, lw * 0.92, 9, q.yaw, Sp.square, C.green, 0.4 + 0.15 * Math.sin(t * 6), true); R.flat.flat(cx, 0.11, cz - 0, lw * 0.7, lw * 0.7, q.yaw + Math.PI, Sp.arrow, C.green, 0.85, true); continue; }
      if (q.ph === 'arm') {
        // the lit lanes flash red on the floor; thin aiming beams flicker
        R.flat.flat(cx, 0.1, cz, lw * 0.92, 9, q.yaw, Sp.square, C.red, (0.25 + 0.35 * fl) * (0.4 + q.u * 0.6), true);
        R.flat.flat(cx, 0.11, cz, lw * 0.8, lw * 0.8, 0, Sp.warn, C.amber, 0.5 + 0.4 * fl, true);
        if (fl > 0.3) for (const y of [0.6, 1.4, 2.2]) R.bbs.streak(cx, y, cz, q.nx, 0, q.nz, lw, 0.06, Sp.streak, C.red, 0.35 * q.u);
      } else {
        // ON: a curtain of red beams in the lane, a hot band on the floor
        R.flat.flat(cx, 0.1, cz, lw * 0.95, 2.4, q.yaw, Sp.square, C.red, 0.7, true);
        for (const y of [0.45, 0.95, 1.45, 1.95, 2.45]) { R.bbs.streak(cx, y, cz, q.nx, 0, q.nz, lw, 0.42, Sp.streak, C.hot, 1); R.bbs.streak(cx, y, cz, q.nx, 0, q.nz, lw, 1.1, Sp.streak, C.red, 0.45); }
        for (const e of [-0.5, 0.5]) R.bbs.streak(cx + q.nx * e * lw, 1.4, cz + q.nz * e * lw, 0, 1, 0, 2.8, 0.18, Sp.streak, C.red, 0.85);
        R.bbs.bb(cx, 1.4, cz, lw * 1.2, 3.4, Sp.glow, C.red, 0.55, true);
      }
    }
  }
  // the trap floor
  const Tr = L.trap;
  if (Tr.ph !== 'idle' && near(Tr.tiles[0].x, Tr.tiles[0].z, 230)) {
    const bl = 0.5 + 0.5 * Math.sin(t * (14 + Tr.u * 16));
    for (const tl of Tr.tiles) {
      if (!ltbTrapHot(Tr.cyc, tl.r, tl.c)) continue;
      if (Tr.ph === 'warn') { const jx = Math.sin(t * 40 + tl.r) * 0.08; R.flat.flat(tl.x + jx, 0.1, tl.z, LTB_TRAP.row * 0.92, tl.w * 0.92, tl.yaw + Math.PI / 2, Sp.square, C.amber, (0.25 + 0.4 * bl) * (0.5 + Tr.u * 0.5), true); R.flat.flat(tl.x, 0.11, tl.z, 2.2, 2.2, t * 0.5, Sp.cross || Sp.warn, C.amber, 0.6 * bl, true); }
      else { const open = Math.min(1, Tr.u * 6), cl = Tr.u > 0.85 ? (1 - Tr.u) / 0.15 : 1, k = open * cl; R.flat.flat(tl.x, 0.1, tl.z, LTB_TRAP.row * 0.95 * k, tl.w * 0.95 * k, tl.yaw + Math.PI / 2, Sp.square, C.black, 0.92, false); R.flat.flat(tl.x, 0.11, tl.z, LTB_TRAP.row * 0.6 * k, tl.w * 0.6 * k, tl.yaw + Math.PI / 2, Sp.ring, C.gold, 0.9, true); R.flat.flat(tl.x, 0.12, tl.z, LTB_TRAP.row * 1.05, tl.w * 1.05, tl.yaw + Math.PI / 2, Sp.ring, C.red, 0.8, true); }
    }
  }
  // the stone: its lane lights up with chevrons pointing at the traffic, a shadow under it
  const St = L.stone, T = s.T || s.TR;
  if ((St.ph === 'warn' || St.ph === 'roll') && near(St.x, St.z, 260)) {
    const at = LTB_T.at2, fl = St.ph === 'warn' ? 0.5 + 0.5 * Math.sin(t * 16) : 0.75;
    for (let r = 4; r < St.run; r += 7) { const sv = St.s0 - r; if (CartKit.ds(T, sv, St.sv) < 2) continue; T.at(sv, at); const x = at.x + at.nx * St.d, z = at.z + at.nz * St.d, ph = ((r / 7 - t * 3) % 3 + 3) % 3 < 1 ? 1 : 0.45; R.flat.flat(x, 0.1, z, 5.5, 5.5, at.yaw + Math.PI, Sp.arrow, C.amber, fl * ph * 0.9, true); R.flat.flat(x, 0.09, z, 7, 7.2, at.yaw, Sp.square, C.amber, 0.12 * fl, true); }
    R.flat.flat(St.x, 0.12, St.z, LTB_STONE.r * 2.4, LTB_STONE.r * 2.4, 0, Sp.shadow, C.black, 0.6, false);
    if (St.ph === 'warn') R.bbs.bb(St.x, St.y + LTB_STONE.r + 2.2, St.z, 3, 3, Sp.warn, C.amber, 0.6 + 0.4 * fl, true);
  }
  // the mummies: a reach ring and a warning over the head while the arms are up; glowing eyes
  for (const m of L.mummies) {
    if (!near(m.x, m.z, 180)) continue;
    const hy = m.y + 1.8 * LTB_MUMMY.sc * Math.cos(m.pitch);
    if (m.st === 'raise' || m.st === 'lunge') {
      const bl = 0.5 + 0.5 * Math.sin(t * 18);
      R.flat.flat(m.x, 0.12, m.z, LTB_MUMMY.grab * 2 + 1, LTB_MUMMY.grab * 2 + 1, 0, Sp.ring, C.lime, 0.5 + 0.4 * bl, true);
      if (m.st === 'raise') { const tg = m.tgtD - m.d, cl = clamp(tg, -LTB_MUMMY.reach, LTB_MUMMY.reach), g = T.at(m.s, LTB_T.at2); R.flat.flat(m.x + g.nx * cl, 0.11, m.z + g.nz * cl, 4.6, 4.6, 0, Sp.glow, C.lime, 0.35 + 0.3 * bl, true); }
      R.bbs.bb(m.x, hy + 1.3, m.z, 1.6, 1.6, Sp.warn, C.lime, 0.7 + 0.3 * bl, true);
    }
    R.bbs.bb(m.x, hy, m.z, 1.4, 1.4, Sp.glow, C.lime, m.st === 'raise' ? 0.8 : 0.3, true);
  }
  // the light show: fans of beams from the crystal on top of the pyramid, sweeping and changing colour
  const sh = s.E.ltb.show;
  if (near(sh.x, sh.z, 520)) {
    const n = 9, a0 = t * 0.35, col = LTB_SHOW[Math.floor(t / 2.5) % LTB_SHOW.length], col2 = LTB_SHOW[(Math.floor(t / 2.5) + 2) % LTB_SHOW.length];
    for (let i = 0; i < n; i++) { const a = a0 + i / n * TAU, el = -0.18 + 0.14 * Math.sin(t * 0.9 + i), ux = Math.sin(a) * Math.cos(el), uy = Math.sin(el), uz = Math.cos(a) * Math.cos(el), len = 150; R.bbs.streak(sh.x + ux * len / 2, sh.y + uy * len / 2, sh.z + uz * len / 2, ux, uy, uz, len, 0.7, Sp.streak, i % 2 ? col : col2, 0.42); }
    R.bbs.bb(sh.x, sh.y, sh.z, 9 + Math.sin(t * 5) * 1.5, 9 + Math.sin(t * 5) * 1.5, Sp.glow, col, 0.75, true);
  }
}

if (typeof window !== 'undefined') setTimeout(() => {
  const C = window.BRADY_CART; if (!C || !C.debug) return;
  // hazard screenshots (tools/cart_track_test.js): park the player where the hazard plays out, step until its moment.
  // Several level files register shots, so each registers by track id (trackShots) and the test asks for its own.
  const list = () => ['trap-warn', 'trap-open', 'mummy-raise', 'mummy-lunge', 'stone-warn', 'stone', 'laser-arm', 'laser-on', 'gallery', 'pyramid'].map(name => ({ name }));
  const shot = name => {
    const D = C.debug, STEP = 1 / 60;
    D.start({ mode: 'quick', track: 'lasertomb', car: 'pyramid', driver: 'brady', seed: 9, autoGas: true });
    const s = D.scene(); s.state = 'race'; s.stateT = 0; window.BRADY.Input.setMode('game'); s.layoutControls(); s.update(STEP);
    const L = s.ltb, T = s.T, P = s.player, S = s.E.ltb.S;
    let pin = null;
    const park = (sv, lat, speed, frozen) => { const g = T.at(sv, {}); D.place(-1, g.x + g.nx * g.hw * lat, g.z + g.nz * g.hw * lat, g.yaw, { speed: speed || 0, frozen: false }); P.prevS = P.loc.s; P.lap = 1; P.prog = P.loc.s; pin = frozen ? { x: P.x, z: P.z, yaw: P.yaw } : null; };
    const pins = [];
    const rivals = list => { let j = 0; for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = list[j++] || [-300 - j * 12, 0, 1]; const g = T.at(P.loc.s + r[0], {}); D.place(i, g.x + g.nx * g.hw * r[1], g.z + g.nz * g.hw * r[1], g.yaw, { speed: r[2] ? 0 : 18, frozen: false }); if (r[2]) pins.push({ k, x: k.x, z: k.z, yaw: k.yaw }); k.prevS = k.loc.s; k.lap = 1; k.prog = k.loc.s; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } k.wpn.t = 99; } };
    s.autoDrive = true; if (!P.ai) s.aiInput(P, STEP, true); P.ai.itemT = 99; P.ai.fireT = 99; P.wpn.t = 99;
    const hold = () => { if (pin) { P.x = pin.x; P.z = pin.z; P.yaw = pin.yaw; P.vx = P.vz = 0; } for (const q of pins) { q.k.x = q.x; q.k.z = q.z; q.k.yaw = q.yaw; q.k.vx = q.k.vz = 0; } };
    const wait = (fn, secs) => { for (let i = 0; i < secs * 60; i++) { s.update(STEP); hold(); if (fn()) return true; } return false; };
    let ok = true;
    if (name === 'trap-warn' || name === 'trap-open') { park(S.trap0 - 14, 0.1, 0, true); rivals([[-30, 0, 1]]); ok = wait(() => name === 'trap-warn' ? L.trap.ph === 'warn' && L.trap.u > 0.5 : L.trap.ph === 'open' && L.trap.u > 0.25, 9); }
    else if (name === 'mummy-raise' || name === 'mummy-lunge') { const m = L.mummies[2]; park(m.s - 34, 0, 0, true); rivals([[-60, 0, 1]]); m.cool = 0; m.st = 'raise'; m.t = 0; m.tgt = P; ok = wait(() => name === 'mummy-raise' ? m.st === 'raise' && m.t > 0.6 : m.st === 'lunge' && m.t > 0.3, 6); }
    else if (name === 'stone-warn' || name === 'stone') { const St = L.stone; park(St.s0 - St.run - 10, 0, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'stone-warn' ? St.ph === 'warn' && s.time > 0.5 : St.ph === 'roll' && CartKit.ds(T, P.loc.s, St.sv) < 45, 14); }
    else if (name === 'laser-arm' || name === 'laser-on') { const q = L.gates[0]; park(q.s - 22, 0, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'laser-arm' ? q.ph === 'arm' && q.u > 0.5 : q.ph === 'on' && q.u > 0.2, 8); }
    else if (name === 'gallery') { park(S.gal0 + 20, 0, 20, false); rivals([[10, 0.3, 0], [16, -0.3, 0], [26, 0, 0]]); wait(() => false, 0.8); }
    else if (name === 'pyramid') { park(CartKit.sOf(T, 60, -40), 0, 20, false); rivals([[10, 0.3, 0], [16, -0.3, 0]]); wait(() => false, 0.6); }
    s.snapCam = true; for (let i = 0; i < 4; i++) { D.step(1, 1); hold(); }
    return { ok, draws: s.stats.draws, tris: s.stats.tris, hits: (s.kit || {}).hits, p: [+P.x.toFixed(1), +P.z.toFixed(1), +P.loc.s.toFixed(1)] };
  };
  C.debug.trackShots = C.debug.trackShots || {};
  C.debug.trackShots.lasertomb = { list, shot };
}, 0);
